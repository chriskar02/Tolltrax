const express = require("express");
const { getPool } = require("./db"); // Import shared database pool
const { authenticateToken, checkRole } = require("./auth"); // Import auth middleware

const router = express.Router();
const pool = getPool(); // Get the shared pool instance
router.use(authenticateToken); // Ensure all analytics routes require an authenticated user

// ======================= USER =======================
// Get user balance and passthrough history
router.get("/user", async (req, res) => {
  const { username } = req.user; // Access logged-in user's username
  const { fromDate, toDate } = req.query;
  try {
    const client = await pool.connect();
    try {
      // Get user balance
      const balanceQuery = `
        SELECT SUM(balance) AS balance
        FROM transceiver
        WHERE vehicleid IN (
          SELECT license_plate
          FROM vehicle
          WHERE userid = $1
        )`;
      const balanceResult = await client.query(balanceQuery, [username]);

      // Get passthrough history
      const historyQuery = `
        SELECT p.timestamp, ts.name AS station_name, p.charge
        FROM passthrough p
        JOIN toll_station ts ON p.tollid = ts.tollid
        JOIN transceiver t ON p.transceiverid = t.id
        WHERE t.vehicleid IN (
          SELECT license_plate
          FROM vehicle
          WHERE userid = $1
        )
        AND p.timestamp BETWEEN $2::timestamp AND $3::timestamp
        ORDER BY p.timestamp DESC`;
      const historyResult = await client.query(historyQuery, [
        username,
        fromDate || "1970-01-01",
        toDate || "3000-01-01",
      ]);

      res.json({
        balance: balanceResult.rows[0].balance || 0,
        history: historyResult.rows,
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error fetching user analytics:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get station popularity for operator's stations
router.get(
  "/operator/station-popularity",
  checkRole(["operator"]), // Ensure user is an operator
  async (req, res) => {
    const operatorId = req.user.type;
    const { fromDate, toDate } = req.query;
    console.log("Operator station popularity endpoint called");
    console.log("Operator ID:", operatorId, "FromDate:", fromDate, "ToDate:", toDate);
    try {
      const client = await pool.connect();
      try {
        const query = `
          SELECT ts.name AS station_name, COUNT(p.tollid) AS passthrough_count
          FROM passthrough p
          JOIN toll_station ts ON p.tollid = ts.tollid
          WHERE ts.operatorid = $1
          AND p.timestamp BETWEEN $2::timestamp AND $3::timestamp
          GROUP BY ts.name
          ORDER BY passthrough_count DESC`;
        const result = await client.query(query, [
          operatorId,
          fromDate || "1970-01-01",
          toDate || "3000-01-01",
        ]);
        console.log("Station popularity query result:", result.rows);
        res.json(result.rows);
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Error fetching operator station popularity:", err.message);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get vehicle type rankings for operator's stations
router.get(
  "/operator/vehicle-type-rank",
  checkRole(["operator"]),
  async (req, res) => {
    const operatorId = req.user.type;
    const { fromDate, toDate } = req.query;
    console.log("Operator vehicle type rank endpoint called");
    console.log("Operator ID:", operatorId, "FromDate:", fromDate, "ToDate:", toDate);
    try {
      const client = await pool.connect();
      try {
        const query = `
          SELECT v.model AS vehicle_model, COUNT(p.transceiverid) AS passthrough_count
          FROM passthrough p
          JOIN transceiver t ON p.transceiverid = t.id
          JOIN vehicle v ON t.vehicleid = v.license_plate
          JOIN toll_station ts ON p.tollid = ts.tollid
          WHERE ts.operatorid = $1
          AND p.timestamp BETWEEN $2::timestamp AND $3::timestamp
          GROUP BY v.model
          ORDER BY passthrough_count DESC
        `;
        const result = await client.query(query, [
          operatorId,
          fromDate || "1970-01-01",
          toDate || "3000-01-01",
        ]);
        console.log("Vehicle type ranking query result:", result.rows);
        res.json(result.rows);
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Error fetching operator vehicle type rankings:", err.message);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ==========================================================
// NEW ENDPOINT: Aggregated Settlements for the Current Operator
// ==========================================================

router.get("/settlements", async (req, res) => {
  // Extract the operator's ID from the token (stored in req.user.type)
  const operatorId = req.user.type;
  if (!operatorId) {
    return res.status(400).json({ message: "Operator ID missing from token." });
  }
  console.log("Settlements endpoint called for operator:", operatorId); // Debug log
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT
          CASE
            WHEN payer = $1 THEN payee
            ELSE payer
            END AS other_operator,
          SUM(
              CASE
                WHEN payer = $1 THEN -amount -- Negative when the logged-in operator is the payer
                ELSE amount -- Positive when the logged-in operator is the payee
                END
          ) AS total_settlement
        FROM debt_settlement
        WHERE payer = $1 OR payee = $1
        GROUP BY other_operator;
      `;
      const result = await client.query(query, [operatorId]);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error fetching settlements:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ======================= ADMIN/ANALYST =======================
router.get(
  "/admin/station-popularity",
  checkRole(["admin", "analyst"]),
  async (req, res) => {
    const { fromDate, toDate } = req.query;
    try {
      const client = await pool.connect();
      try {
        const query = `
          SELECT ts.name AS station_name, COUNT(p.tollid) AS passthrough_count
          FROM passthrough p
          JOIN toll_station ts ON p.tollid = ts.tollid
          WHERE p.timestamp BETWEEN $1::timestamp AND $2::timestamp
          GROUP BY ts.name
          ORDER BY passthrough_count DESC`;
        const result = await client.query(query, [
          fromDate || "1970-01-01",
          toDate || "3000-01-01",
        ]);
        res.json(result.rows);
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Error fetching admin station popularity:", err.message);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;