const express = require("express");
const router = express.Router();
const { getPool, dumpDatabase, populateUsers, populateVehicles } = require("./db");
const path = require("path");
const fs = require("fs");
const iconv = require("iconv-lite");
const csv = require("csv-parser");


const pool = getPool(); // Get the shared pool instance

// Helper function for transactions
async function runTransaction(callback) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await callback(client);
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

// Reset stations
router.post("/admin/resetstations", async (req, res) => {
    try {
        await runTransaction(async (client) => {
            const csvPath = path.join(__dirname, "..", "data", "tollstations2024.csv");

            // Process operators first
            const operators = new Map();
            const stations = [];

            await new Promise((resolve, reject) => {
                fs.createReadStream(csvPath)
                    .pipe(iconv.decodeStream("UTF-8"))
                    .pipe(csv())
                    .on("data", (row) => {
                        if (!operators.has(row.OpID)) {
                            operators.set(row.OpID, row.Operator);
                        }
                        stations.push(row);
                    })
                    .on("end", resolve)
                    .on("error", reject);
            });

            // Insert operators
            for (const [id, name] of operators) {
                await client.query(
                    `INSERT INTO operator (id, name) VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
                    [id, name]
                );
            }

            // Insert/update stations
            for (const station of stations) {
                await client.query(
                    `INSERT INTO toll_station VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (tollid) DO UPDATE SET
             operatorid = EXCLUDED.operatorid,
             name = EXCLUDED.name,
             lat = EXCLUDED.lat,
             long = EXCLUDED.long,
             price1 = EXCLUDED.price1,
             price2 = EXCLUDED.price2,
             price3 = EXCLUDED.price3,
             price4 = EXCLUDED.price4`,
                    [
                        station.TollID,
                        station.OpID,
                        station.Name,
                        station.Lat,
                        station.Long,
                        station.Price1,
                        station.Price2,
                        station.Price3,
                        station.Price4
                    ]
                );
            }
        });

        res.json({ status: "OK" });
    } catch (err) {
        console.error("Reset stations error:", err);
        res.status(500).json({ status: "failed", info: err.message });
    }
});

// Reset passes
router.post("/admin/resetpasses", async (req, res) => {
    try {
        await runTransaction(async (client) => {
            await client.query(`
                TRUNCATE TABLE passthrough,
                transceiver RESTART IDENTITY;
            `);
        });
        res.json({ status: "OK" });
    } catch (err) {
        res.status(500).json({ status: "failed", info: err.message });
    }
});

// Helper function to normalize a CSV row:
function normalizeRow(row) {
    const normalized = {};
    for (const key in row) {
      // Convert keys to lowercase and trim both key and value.
      normalized[key.trim().toLowerCase()] = (row[key] || "").trim();
    }
    return normalized;
  }
  
  // Add passes and compute debt settlements
  router.post("/admin/addpasses", async (req, res) => {
    try {
      let newPasses = 0;
  
      await runTransaction(async (client) => {
        // 1. Load passes from CSV and normalize rows
        const passesCsvPath = path.join(__dirname, "..", "data", "passes-sample.csv");
        const passes = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(passesCsvPath)
            .pipe(iconv.decodeStream("UTF-8"))
            .pipe(csv())
            .on("data", (row) => passes.push(normalizeRow(row)))
            .on("end", resolve)
            .on("error", reject);
        });
  
        // 2. Load transceivers from CSV (dummy data) and normalize rows
        const transceiversCsvPath = path.join(__dirname, "..", "dummy_data", "transceiver.csv");
        const transceivers = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(transceiversCsvPath)
            .pipe(iconv.decodeStream("UTF-8"))
            .pipe(csv())
            .on("data", (row) => transceivers.push(normalizeRow(row)))
            .on("end", resolve)
            .on("error", reject);
        });
  
        // 3. Insert transceivers into the database.
        // We use the normalized 'providerid' as the operator id.
        for (const t of transceivers) {
          await client.query(
            `INSERT INTO transceiver (id, vehicleid, operatorid, balance, active)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING`,
            [
              t.id, 
              t.vehicleid, 
              t.operatorid, // already trimmed and lowercased
              t.balance, 
              t.active === "true"
            ]
          );
        }
  
        // 4. Insert passes into the database.
        // Note that after normalization, the keys are lowercase.
        for (const pass of passes) {
          const result = await client.query(
            `INSERT INTO passthrough (timestamp, tollid, transceiverid, charge)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT DO NOTHING`,
            [
              pass.timestamp,
              pass.tollid,
              pass.tagref, // normalized tagRef becomes tagref
              pass.charge
            ]
          );
          if (result.rowCount > 0) newPasses++;
        }
  
        // 5. Load toll stations from CSV and normalize rows
        const tollstationsCsvPath = path.join(__dirname, "..", "data", "tollstations2024.csv");
        const tollstations = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(tollstationsCsvPath)
            .pipe(iconv.decodeStream("UTF-8"))
            .pipe(csv())
            .on("data", (row) => tollstations.push(normalizeRow(row)))
            .on("end", resolve)
            .on("error", reject);
        });
  
        // 6. Compute settlement records.
        // For each pass, we look up the matching transceiver and toll station.
        // We use the transceiver’s providerid as the payer and the toll station’s opid as the payee.
        const settlements = {}; // key: "payer_payee"
        for (const pass of passes) {
          // Find the transceiver using normalized tagref
          const transceiver = transceivers.find(t => t.id === pass.tagref);
          if (!transceiver) continue;
  
          // Find the toll station using normalized tollid
          const tollStation = tollstations.find(ts => ts.tollid === pass.tollid);
          if (!tollStation) continue;
  
          // Extract payer and payee from normalized values.
          const payer = transceiver.operatorid; // e.g. "nao"
          const payee = tollStation.opid;         // e.g. "am", "no", etc.
          // Only create a settlement if both values exist and they differ.
          if (payer && payee && payer !== payee) {
            const key = `${payer}_${payee}`;
            const charge = parseFloat(pass.charge) || 0;
            if (!settlements[key]) {
              settlements[key] = { payer, payee, amount: 0 };
            }
            settlements[key].amount += charge;
          }
        }
  
        // 7. Insert settlement records into the debt_settlement table.
        for (const key in settlements) {
          const settlement = settlements[key];
          await client.query(
            `INSERT INTO debt_settlement (payer, payee, amount, date, complete)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING`,
            [settlement.payer, settlement.payee, settlement.amount, new Date(), false]
          );
        }
      });
  
      res.json({ status: "OK", newPasses });
    } catch (err) {
      console.error("Add passes error:", err);
      res.status(500).json({ status: "failed", info: err.message });
    }
  });
  




//Healthcheck
router.get("/admin/healthcheck", async (req, res) => {
    try {
        const client = await pool.connect()

        const stationsResult = await client.query("SELECT COUNT(*) FROM toll_station")
        const tagsResult = await client.query("SELECT COUNT(*) FROM transceiver")
        const passesResult = await client.query("SELECT COUNT(*) FROM passthrough")

        const n_stations = Number.parseInt(stationsResult.rows[0].count)
        const n_tags = Number.parseInt(tagsResult.rows[0].count)
        const n_passes = Number.parseInt(passesResult.rows[0].count)

        const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

        client.release()

        res.status(200).json({
            status: "OK",
            dbconnection: connectionString,
            n_stations: n_stations,
            n_tags: n_tags,
            n_passes: n_passes,
        })
    } catch (err) {
        console.error("Database connection error:", err)
        res.status(500).json({
            status: "failed",
            dbconnection: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
        })
    }
});

// API Endpoint to manually reset users
router.post("/admin/resetusers", async (req, res) => {
    try {
        const client = await pool.connect();
        await client.query("TRUNCATE TABLE \"user\" RESTART IDENTITY CASCADE");
        await populateUsers(client);
        client.release();
        res.json({ status: "OK" });
    } catch (err) {
        res.status(500).json({ status: "failed", info: err.message });
    }
});

// API Endpoint to manually reset vehicles
router.post("/admin/resetvehicles", async (req, res) => {
    try {
        const client = await pool.connect();
        await client.query("TRUNCATE TABLE vehicle RESTART IDENTITY CASCADE");
        await populateVehicles(client);
        client.release();
        res.json({ status: "OK" });
    } catch (err) {
        res.status(500).json({ status: "failed", info: err.message });
    }
});

// API endpoint for triggering a database dump
router.post("/admin/dbdump", async (req, res) => {
    try {
        // Create a dump filename using a timestamp for uniqueness
        const dumpFilePath = `dump_${Date.now()}.sql`;

        await dumpDatabase(dumpFilePath);

        res.status(200).json({
            status: "OK",
            message: "Database dump created successfully",
            dumpFile: dumpFilePath,
        });
    } catch (error) {
        console.error("Error during database dump:", error);
        res.status(500).json({
            status: "failed",
            message: "Database dump failed",
            error: error.message,
        });
    }
});




module.exports = router;