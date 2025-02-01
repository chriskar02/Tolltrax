const express = require("express");
const router = express.Router();
const { Pool, Client } = require("pg");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const iconv = require("iconv-lite"); // Ensure this is installed

// Initialize database and tables
async function initializeDatabase() {
  // Check/Create Database
  const adminClient = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: "postgres",
  });

  try {
    await adminClient.connect();
    const dbCheck = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME]
    );
    if (dbCheck.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Database ${process.env.DB_NAME} created.`);
    }
  } finally {
    await adminClient.end();
  }

  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

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

    // Populate users and vehicles
    await populateUsers(client);
    await populateVehicles(client);

    console.log("Tables verified/created");
  } finally {
    client.release();
  }

  return pool;
}

// Helper function to populate users
async function populateUsers(client) {
  const userspath = path.join(__dirname, "..", "dummy_data", "users.csv");

  try {
    if (!fs.existsSync(userspath)) {
      console.warn("Users CSV file not found, skipping population.");
      return;
    }

    const users = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(userspath)
        .pipe(iconv.decodeStream("UTF-8"))
        .pipe(csv())
        .on("data", (row) => users.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    for (const user of users) {
      await client.query(
        `INSERT INTO "user" (username, password, type)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO NOTHING`,
        [user.username, user.password, parseInt(user.type)]
      );
    }

    console.log("Users populated successfully.");
  } catch (err) {
    console.error("Error populating users:", err.message);
  }
}

// Helper function to populate vehicles
async function populateVehicles(client) {
  const vehiclespath = path.join(__dirname, "..", "dummy_data", "vehicles.csv");

  try {
    if (!fs.existsSync(vehiclespath)) {
      console.warn("Vehicles CSV file not found, skipping population.");
      return;
    }

    const vehicles = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(vehiclespath)
        .pipe(iconv.decodeStream("UTF-8"))
        .pipe(csv())
        .on("data", (row) => vehicles.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    for (const vehicle of vehicles) {
      await client.query(
        `INSERT INTO vehicle (license_plate, license_year, type, model, userid)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (license_plate) DO NOTHING`,
        [
          vehicle.license_plate,
          parseInt(vehicle.license_year),
          vehicle.type,
          vehicle.model,
          vehicle.userid,
        ]
      );
    }

    console.log("Vehicles populated successfully.");
  } catch (err) {
    console.error("Error populating vehicles:", err.message);
  }
}


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
      await client.query("TRUNCATE passthrough");
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
