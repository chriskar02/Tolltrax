const express = require("express");
const router = express.Router();
const { initializeDatabase } = require("./db");
const path = require("path");
const fs = require("fs");
const iconv = require("iconv-lite");
const csv = require("csv-parser");


// Initialize database and get pool
let pool;
initializeDatabase()
    .then((initializedPool) => {
        pool = initializedPool;
        console.log("Database initialization complete");
    })
    .catch((err) => {
        console.error("Database initialization failed:", err);
        process.exit(1);
    });


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
            await client.query("TRUNCATE TABLE passthrough");
        });
        res.json({ status: "OK" });
    } catch (err) {
        res.status(500).json({ status: "failed", info: err.message });
    }
});

// Add passes
router.post("/admin/addpasses", async (req, res) => {
    try {
        let newPasses = 0;

        await runTransaction(async (client) => {
            const csvPath = path.join(__dirname, "..", "data", "passes-sample.csv");
            const passes = [];

            await new Promise((resolve, reject) => {
                fs.createReadStream(csvPath)
                    .pipe(iconv.decodeStream("UTF-8"))
                    .pipe(csv())
                    .on("data", (row) => passes.push(row))
                    .on("end", resolve)
                    .on("error", reject);
            });

            // Insert transceivers from dummy data
            const transceiversPath = path.join(__dirname, "..", "dummy_data", "transceiver.csv");
            const transceivers = [];

            await new Promise((resolve, reject) => {
                fs.createReadStream(transceiversPath)
                    .pipe(csv())
                    .on("data", (row) => transceivers.push(row))
                    .on("end", resolve)
                    .on("error", reject);
            });

            for (const t of transceivers) {
                await client.query(
                    `INSERT INTO transceiver (id, vehicleid, operatorid, balance, active)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
                    [t.id, t.vehicleid, t.operatorid, t.balance, t.active === "True"]
                );
            }

            // Insert passes
            for (const pass of passes) {
                const result = await client.query(
                    `INSERT INTO passthrough (timestamp, tollid, transceiverid, charge)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
                    [
                        pass.timestamp,
                        pass.tollID,
                        pass.tagRef,
                        pass.charge
                    ]
                );
                if (result.rowCount > 0) newPasses++;
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



module.exports = router;
