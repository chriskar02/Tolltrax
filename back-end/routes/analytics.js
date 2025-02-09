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

// ======================= OPERATOR =======================
// Note: In the new dummy data, operator users have their operator code stored in the "type" field.

router.get(
  "/operator/station-popularity",
  checkRole(["operator"]), // Ensure user is an operator (adjust checkRole as needed)
  async (req, res) => {
    // For operator users, fetch the operator code from the type field.
    const operatorId = req.user.type;
    const { fromDate, toDate } = req.query;
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
    const operatorId = req.user.type; // Use operator code from the type field
    const { fromDate, toDate } = req.query;
    try {
      const client = await pool.connect();
      try {
        const query = `
          SELECT v.type AS vehicle_type, COUNT(p.transceiverid) AS passthrough_count
          FROM passthrough p
          JOIN transceiver t ON p.transceiverid = t.id
          JOIN vehicle v ON t.vehicleid = v.license_plate
          JOIN toll_station ts ON p.tollid = ts.tollid
          WHERE ts.operatorid = $1
          AND p.timestamp BETWEEN $2::timestamp AND $3::timestamp
          GROUP BY v.type
          ORDER BY passthrough_count DESC`;
        const result = await client.query(query, [
          operatorId,
          fromDate || "1970-01-01",
          toDate || "3000-01-01",
        ]);
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
