const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const iconv = require("iconv-lite");
const { Pool, Client } = require("pg");

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

  // Create tables
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
      CREATE TABLE IF NOT EXISTS provider (
        id VARCHAR(5) PRIMARY KEY,
        name CHAR(255) NOT NULL,
        UNIQUE (id, name)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        username VARCHAR(255) PRIMARY KEY,
        password VARCHAR(255) NOT NULL
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle (
        id CHAR(9) PRIMARY KEY,
        licenseyear INTEGER,
        type CHAR(20),
        model VARCHAR(255),
        userid VARCHAR(255) REFERENCES "user"(username)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS toll_station (
        tollid VARCHAR(10) PRIMARY KEY,
        opid VARCHAR(5),
        operator CHAR(255),
        name VARCHAR(255),
        pm VARCHAR(5),
        locality VARCHAR(255),
        road VARCHAR(255),
        lat NUMERIC(10,6),
        long NUMERIC(10,6),
        email VARCHAR(255),
        price1 NUMERIC(10,2),
        price2 NUMERIC(10,2),
        price3 NUMERIC(10,2),
        price4 NUMERIC(10,2)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS transceiver (
        id CHAR(10) PRIMARY KEY,
        vehicleid CHAR(9) REFERENCES vehicle(id),
        providerid VARCHAR(5) REFERENCES provider(id),
        balance NUMERIC(10,2),
        active BOOLEAN
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS passthrough (
        timestamp TIMESTAMP,
        tollid VARCHAR(10) REFERENCES toll_station(tollid),
        transceiverid CHAR(10) REFERENCES transceiver(id),
        taghomeid VARCHAR(5) REFERENCES provider(id),
        charge NUMERIC(10,2),
        UNIQUE (timestamp, tollid, transceiverid)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS debt_settlement (
        id INTEGER PRIMARY KEY,
        payer VARCHAR(5) REFERENCES provider(id),
        payee VARCHAR(5) REFERENCES provider(id),
        amount NUMERIC(10,2),
        date TIMESTAMP,
        complete BOOLEAN
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_provider (
        userid VARCHAR(255) REFERENCES "user"(username),
        providerid VARCHAR(5) REFERENCES provider(id),
        PRIMARY KEY (userid, providerid)
      );
    `);
    console.log("Tables created successfully");
  } catch (err) {
    console.error("Error creating tables:", err);
    throw err;
  } finally {
    client.release();
  }
  return pool;
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

// Τροποποιημένο endpoint resetstations
router.post("/admin/resetstations", async (req, res) => {
  const results = []
  const csvFilePath = path.join(__dirname, "..", "data", "tollstations2024.csv")

  if (!fs.existsSync(csvFilePath)) {
    return res.json({ status: "failed", info: "CSV file not found" })
  }

  try {
    // Έναρξη συναλλαγής
    await pool.query("BEGIN")

    // Ανάγνωση του αρχείου CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(iconv.decodeStream("UTF-8"))
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject)
    })

    // Δημιουργία ενός set με όλα τα tollid από το CSV
    const csvTollIds = new Set(results.map((row) => row.TollID))

    // Εισαγωγή ή ενημέρωση δεδομένων στον πίνακα
    for (const row of results) {
      try {
        await pool.query(
          `INSERT INTO toll_station 
          (tollid, opid, operator, name, pm, locality, road, lat, long, email, price1, price2, price3, price4)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (tollid) 
          DO UPDATE SET
            opid = EXCLUDED.opid,
            operator = EXCLUDED.operator,
            name = EXCLUDED.name,
            pm = EXCLUDED.pm,
            locality = EXCLUDED.locality,
            road = EXCLUDED.road,
            lat = EXCLUDED.lat,
            long = EXCLUDED.long,
            email = EXCLUDED.email,
            price1 = EXCLUDED.price1,
            price2 = EXCLUDED.price2,
            price3 = EXCLUDED.price3,
            price4 = EXCLUDED.price4`,
          [
            row.TollID,
            row.OpID,
            row.Operator,
            row.Name,
            row.PM,
            row.Locality,
            row.Road,
            row.Lat,
            row.Long,
            row.Email,
            row.Price1,
            row.Price2,
            row.Price3,
            row.Price4,
          ],
        )
      } catch (rowError) {
        console.error("Error inserting/updating row:", rowError)
        throw rowError
      }
    }

    // Διαγραφή σταθμών που δεν υπάρχουν πλέον στο CSV
    await pool.query(
      `DELETE FROM toll_station WHERE tollid NOT IN (${Array.from(csvTollIds)
        .map((id) => `'${id}'`)
        .join(", ")})`,
    )

    // Ολοκλήρωση της συναλλαγής
    await pool.query("COMMIT")
    res.json({ status: "OK" })
  } catch (err) {
    console.error("Transaction error:", err)
    await pool.query("ROLLBACK")
    res.json({ status: "failed", info: err.message })
  }
});

// resetpasses endpoint
router.post("/admin/resetpasses", async (req, res) => {
  try {
    await pool.query("BEGIN");
    await pool.query("DELETE FROM passthrough");
    await pool.query("DELETE FROM transceiver");
    await pool.query("COMMIT");
    res.json({ status: "OK" });
  } catch (err) {
    console.error("Transaction error:", err);
    await pool.query("ROLLBACK");
    res.json({ status: "failed", info: err.message });
  }
});

// addpasses endpoint
router.post("/admin/addpasses", async (req, res) => {
  const results = [];
  const csvFilePath = path.join(__dirname, "..", "data", "passes-sample.csv");
  let newPassesCount = 0;

  if (!fs.existsSync(csvFilePath)) {
    return res.json({
      status: "failed",
      info: "CSV file not found",
    });
  }

  try {
    await pool.query("BEGIN");

    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(iconv.decodeStream("UTF-8"))
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    // Insert or update transceiver data
    for (const row of results) {
        try {
             // Insert provider if it doesn't exist
             await pool.query(
                 `INSERT INTO provider (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
                 [row.tagHomeID, `Provider ${row.tagHomeID}`]
             );

              await pool.query(
                  `INSERT INTO transceiver (id, providerid)
                   VALUES ($1, $2)
                   ON CONFLICT (id) DO UPDATE SET providerid = EXCLUDED.providerid`,
                  [row.tagRef, row.tagHomeID]
              );
        } catch (rowError) {
            console.error("Error inserting/updating transceiver:", rowError);
            throw rowError;
        }
    }

    // Insert passthrough data
    for (const row of results) {
      try {
        // Validate that transceiver exists before inserting passthrough
        const transceiverExists = await pool.query(
          `SELECT 1 FROM transceiver WHERE id = $1`,
          [row.tagRef]
        );

        if (transceiverExists.rowCount === 0) {
          console.warn(
            "Skipping passthrough entry due to missing transceiver:",
            row
          );
          continue; // Skip this row if transceiver does not exist
        }

        const result = await pool.query(
          `INSERT INTO passthrough 
           (timestamp, tollid, transceiverid, taghomeid, charge)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (timestamp, tollid, transceiverid) DO NOTHING`,
          [row.timestamp, row.tollID, row.tagRef, row.tagHomeID, row.charge]
        );

        if (result.rowCount > 0) {
          newPassesCount++;
        }

        console.log("Inserted passthrough values:", [
          row.timestamp,
          row.tollID,
          row.tagRef,
          row.tagHomeID,
          row.charge,
        ]);
      } catch (rowError) {
        console.error("Error inserting passthrough:", rowError);
        throw rowError;
      }
    }

    await pool.query("COMMIT");
    res.json({ status: "OK", newPasses: newPassesCount });
  } catch (err) {
    console.error("Transaction error:", err);
    await pool.query("ROLLBACK");
    res.json({
      status: "failed",
      info: err.message,
    });
  }
});


//healthcheck endpoint
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
})

module.exports = router