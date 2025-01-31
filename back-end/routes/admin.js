const express = require("express");
const router = express.Router();
const { Pool, Client } = require("pg");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const iconv = require("iconv-lite"); // Ensure this is installed

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Initialize tables (modified for operator table)
async function initializeTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS operator (
        id VARCHAR(5) PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        username VARCHAR(255) PRIMARY KEY,
        password VARCHAR(255) NOT NULL,
        type INT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle (
        license_plate CHAR(6) PRIMARY KEY,
        license_year INT NOT NULL,
        type VARCHAR(20) NOT NULL,
        model VARCHAR(255),
        userid VARCHAR(255) REFERENCES "user"(username)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS toll_station (
        tollid VARCHAR(10) PRIMARY KEY,
        operatorid VARCHAR(5) REFERENCES operator(id),
        name VARCHAR(255),
        lat NUMERIC(10,6),
        long NUMERIC(10,6),
        price1 NUMERIC(10,2),
        price2 NUMERIC(10,2),
        price3 NUMERIC(10,2),
        price4 NUMERIC(10,2)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transceiver (
        id VARCHAR(10) PRIMARY KEY,
        vehicleid VARCHAR(6),
        operatorid VARCHAR(5) REFERENCES operator(id),
        balance NUMERIC(10,2),
        active BOOLEAN
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS passthrough (
        timestamp TIMESTAMP,
        tollid VARCHAR(10) REFERENCES toll_station(tollid),
        transceiverid VARCHAR(10) REFERENCES transceiver(id),
        charge NUMERIC(10,2),
        UNIQUE (timestamp, tollid, transceiverid)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS debt_settlement (
        id SERIAL PRIMARY KEY,
        payer VARCHAR(5) REFERENCES operator(id),
        payee VARCHAR(5) REFERENCES operator(id),
        amount NUMERIC(10,2),
        date TIMESTAMP,
        complete BOOLEAN DEFAULT FALSE
      );
    `);

    console.log("Tables verified/created");
  } finally {
    client.release();
  }
}

// Initialize on startup
initializeTables().catch(console.error);

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

// Reset stations (now handles operators)
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
      await client.query("TRUNCATE passthrough");
    });
    res.json({ status: "OK" });
  } catch (err) {
    res.status(500).json({ status: "failed", info: err.message });
  }
});

// Add passes (using dummy transceiver data)
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
            new Date(pass.timestamp),
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

// Health check
router.get("/admin/healthcheck", async (req, res) => {
  try {
    const client = await pool.connect();
    const stations = await client.query("SELECT COUNT(*) FROM toll_station");
    const passes = await client.query("SELECT COUNT(*) FROM passthrough");
    const transceivers = await client.query("SELECT COUNT(*) FROM transceiver");
    client.release();

    res.json({
      status: "OK",
      toll_stations: parseInt(stations.rows[0].count),
      passes: parseInt(passes.rows[0].count),
      transceivers: parseInt(transceivers.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ status: "failed", info: err.message });
  }
});

module.exports = router;
