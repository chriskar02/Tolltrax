const { Pool, Client } = require("pg");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const iconv = require("iconv-lite");
const { exec } = require("child_process");

let pool;

// Initialize database and tables
async function initializeDatabase() {
  // Check/Create Database
  if (pool) {
    console.log("Database already initialized.");
    return pool; // Return the existing pool if already initialized
  }

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

  pool = new Pool({
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
        type VARCHAR(255) NOT NULL
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
        [user.username, user.password, user.type]
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

// Getter for accessing the shared connection pool
function getPool() {
  if (!pool) {
    throw new Error("Pool has not been initialized. Call initializeDatabase() first.");
  }
  return pool;
}

//DB dump function
function dumpDatabase(dumpFilePath) {
  return new Promise((resolve, reject) => {
    // Ensure the password is passed securely via the environment variable
    const env = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD };

    // Construct the pg_dump command. The redirection operator (>) ensures the dump is written to the file.
    const command = `pg_dump -U ${process.env.DB_USER} -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -d ${process.env.DB_NAME} > ${dumpFilePath}`;

    exec(command, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error("Error dumping database:", stderr);
        return reject(error);
      }
      console.log("Database dump saved to", dumpFilePath);
      resolve(dumpFilePath);
    });
  });
}

// Export the initializeDatabase function for app.js and the pool for other routes
module.exports = { initializeDatabase, getPool, dumpDatabase, populateUsers, populateVehicles };