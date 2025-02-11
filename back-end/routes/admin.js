const express = require("express")
const router = express.Router()
const { getPool, dumpDatabase, populateUsers, populateVehicles } = require("./db")
const path = require("path")
const fs = require("fs")
const iconv = require("iconv-lite")
const csv = require("csv-parser")
const bcrypt = require("bcrypt")
const saltRounds = 10
const jwt = require("jsonwebtoken")
const { authenticateToken, checkRole } = require("./auth");

const pool = getPool() // Get the shared pool instance

router.use(authenticateToken);
router.use(checkRole(["admin"])); //extra layer of security to limit admin api calls to logged in admins

// Helper function for transactions
async function runTransaction(callback) {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    await callback(client)
    await client.query("COMMIT")
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}

// Utility function to format response
function formatResponse(req, res, data, statusCode = 200) {
  const format = req.query.format || "json";
  res.status(statusCode);

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return res.send("");
      }

      const headers = Object.keys(data[0]);
      const csvRows = data.map(row => headers.map(field => JSON.stringify(row[field] || "")).join(","));

      res.send([headers.join(","), ...csvRows].join("\n"));
    } else if (typeof data === "object" && data !== null) {
      // **Flatten nested objects before converting to CSV**
      function flattenObject(obj, prefix = "") {
        return Object.keys(obj).reduce((acc, key) => {
          const newKey = prefix ? `${prefix}_${key}` : key;
          if (typeof obj[key] === "object" && obj[key] !== null) {
            Object.assign(acc, flattenObject(obj[key], newKey));
          } else {
            acc[newKey] = obj[key];
          }
          return acc;
        }, {});
      }

      const flatData = flattenObject(data);
      const csvString = Object.keys(flatData).join(",") + "\n" + Object.values(flatData).join(",");
      res.send(csvString);
    } else {
      res.send(String(data));
    }
  } else {
    res.json(data);
  }
}


// Reset stations
router.post("/admin/resetstations", async (req, res) => {
  try {
    const stations = []
    await runTransaction(async (client) => {
      const csvPath = path.join(__dirname, "..", "data", "tollstations2024.csv")

      // Process operators first
      const operators = new Map()

      await new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
          .pipe(iconv.decodeStream("UTF-8"))
          .pipe(csv())
          .on("data", (row) => {
            if (!operators.has(row.OpID)) {
              operators.set(row.OpID, row.Operator)
            }
            stations.push(row)
          })
          .on("end", resolve)
          .on("error", reject)
      })

      // Insert operators
      for (const [id, name] of operators) {
        await client.query(
          `INSERT INTO operator (id, name) VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
          [id, name],
        )
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
            station.Price4,
          ],
        )
      }
    })

    formatResponse(req, res, { status: "OK", stations });
  } catch (err) {
    formatResponse(req, res, { status: "failed", info: err.message }, 500);
  }
})

// Reset passes
router.post("/admin/resetpasses", async (req, res) => {
  try {
    await runTransaction(async (client) => {
      await client.query(`
                TRUNCATE TABLE passthrough,
                transceiver RESTART IDENTITY;
            `)
    })
    formatResponse(req, res, { status: "OK" });
  } catch (err) {
    formatResponse(req, res, { status: "failed", info: err.message }, 500);
  }
})

// Helper function to normalize a CSV row:
function normalizeRow(row) {
  const normalized = {}
  for (const key in row) {
    // Convert keys to lowercase and trim both key and value.
    normalized[key.trim().toLowerCase()] = (row[key] || "").trim()
  }
  return normalized
}

// Add passes and compute debt settlements
router.post("/admin/addpasses", async (req, res) => {
  try {
    let newPasses = 0

    await runTransaction(async (client) => {
      // 1. Load passes from CSV and normalize rows
      const passesCsvPath = path.join(__dirname, "..", "data", "passes-sample.csv")
      const passes = []
      await new Promise((resolve, reject) => {
        fs.createReadStream(passesCsvPath)
          .pipe(iconv.decodeStream("UTF-8"))
          .pipe(csv())
          .on("data", (row) => passes.push(normalizeRow(row)))
          .on("end", resolve)
          .on("error", reject)
      })

      // 2. Load transceivers from CSV (dummy data) and normalize rows
      const transceiversCsvPath = path.join(__dirname, "..", "dummy_data", "transceiver.csv")
      const transceivers = []
      await new Promise((resolve, reject) => {
        fs.createReadStream(transceiversCsvPath)
          .pipe(iconv.decodeStream("UTF-8"))
          .pipe(csv())
          .on("data", (row) => transceivers.push(normalizeRow(row)))
          .on("end", resolve)
          .on("error", reject)
      })

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
            t.active === "true",
          ],
        )
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
            pass.charge,
          ],
        )
        if (result.rowCount > 0) newPasses++
      }

      // 5. Load toll stations from CSV and normalize rows
      const tollstationsCsvPath = path.join(__dirname, "..", "data", "tollstations2024.csv")
      const tollstations = []
      await new Promise((resolve, reject) => {
        fs.createReadStream(tollstationsCsvPath)
          .pipe(iconv.decodeStream("UTF-8"))
          .pipe(csv())
          .on("data", (row) => tollstations.push(normalizeRow(row)))
          .on("end", resolve)
          .on("error", reject)
      })

      // 6. Compute settlement records.
      // For each pass, we look up the matching transceiver and toll station.
      // We use the transceiver’s providerid as the payer and the toll station’s opid as the payee.
      const settlements = {} // key: "payer_payee"
      for (const pass of passes) {
        // Find the transceiver using normalized tagref
        const transceiver = transceivers.find((t) => t.id === pass.tagref)
        if (!transceiver) continue

        // Find the toll station using normalized tollid
        const tollStation = tollstations.find((ts) => ts.tollid === pass.tollid)
        if (!tollStation) continue

        // Extract payer and payee from normalized values.
        const payer = transceiver.operatorid // e.g. "nao"
        const payee = tollStation.opid // e.g. "am", "no", etc.
        // Only create a settlement if both values exist and they differ.
        if (payer && payee && payer !== payee) {
          const key = `${payer}_${payee}`
          const charge = Number.parseFloat(pass.charge) || 0
          if (!settlements[key]) {
            settlements[key] = { payer, payee, amount: 0 }
          }
          settlements[key].amount += charge
        }
      }

      // 7. Insert settlement records into the debt_settlement table.
      for (const key in settlements) {
        const settlement = settlements[key]
        await client.query(
          `INSERT INTO debt_settlement (payer, payee, amount, date, complete)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING`,
          [settlement.payer, settlement.payee, settlement.amount, new Date(), false],
        )
      }
    })

    formatResponse(req, res, { status: "OK", newPasses });
  } catch (err) {
    formatResponse(req, res, { status: "failed", info: err.message }, 500);
  }
})

// Healthcheck
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
    const healthcheck = {
      dbconnection: connectionString,
      n_stations,
      n_tags,
      n_passes
    };

    formatResponse(req, res, { status: "OK", ...healthcheck });
  } catch (err) {
    const reason = {
      dbconnection: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
    };

    formatResponse(req, res, { status: "failed", info: reason }, 500);
  }
})

// API Endpoint to manually reset users
router.post("/admin/resetusers", async (req, res) => {
  try {
    const client = await pool.connect()
    await client.query('TRUNCATE TABLE "user" RESTART IDENTITY CASCADE')
    await populateUsers(client)
    client.release()
    formatResponse(req, res, { status: "OK" });
  } catch (err) {
    formatResponse(req, res, { status: "failed", info: err.message }, 500);
  }
})

// API Endpoint to manually reset vehicles
router.post("/admin/resetvehicles", async (req, res) => {
  try {
    const client = await pool.connect()
    await client.query("TRUNCATE TABLE vehicle RESTART IDENTITY CASCADE")
    await populateVehicles(client)
    client.release()
    formatResponse(req, res, { status: "OK" });
  } catch (err) {
    formatResponse(req, res, { status: "failed", info: err.message }, 500);
  }
})

// API endpoint for triggering a database dump
router.post("/admin/dbdump", async (req, res) => {
  try {
    // Create a dump filename using a timestamp for uniqueness
    const dumpFilePath = `dump_${Date.now()}.sql`

    await dumpDatabase(dumpFilePath)

    formatResponse(req, res, { status: "OK", dumpFile: dumpFilePath });
  } catch (error) {
    formatResponse(req, res, { status: "failed", info: error.message }, 500);
  }
})

// API to update a user
router.post("/admin/usermod", async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    const reason = "Username and password are required"
    return formatResponse(req, res, { status: "failed", info: reason }, 400);
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Check if the user exists
    const userCheckQuery = `SELECT * FROM "user" WHERE username = $1`
    const userCheckValues = [username]
    const userCheckResult = await pool.query(userCheckQuery, userCheckValues)

    if (userCheckResult.rows.length === 0) {
      // User doesn't exist, create a new user with type "normal"
      const insertQuery = `
              INSERT INTO "user" (username, password, type)
              VALUES ($1, $2, $3);
          `
      const insertValues = [username, hashedPassword, "normal"]

      await pool.query(insertQuery, insertValues)

      message = "User created successfully"
    } else {
      // User exists, update the password, keeping the existing type
      const updateQuery = `
              UPDATE "user"
              SET password = $1
              WHERE username = $2;
          `
      const updateValues = [hashedPassword, username]

      await pool.query(updateQuery, updateValues)

      message = "User password updated successfully"
    }
    formatResponse(req, res, { status: "success", info: message });
  } catch (error) {
    // Handle any errors that occur during the database update
    const reason = "Internal server error"
    return formatResponse(req, res, { status: "failed", info: reason }, 500);
  }
})

// API to list users
router.get("/admin/users", async (req, res) => {
  try {
    const query = `
          SELECT username
          FROM "user";
      `

    const result = await pool.query(query)

    // Extract the usernames from the result
    const usernames = result.rows.map((row) => row.username)

    // Respond with the list of usernames
    formatResponse(req, res, { status: "OK", usernames });
  } catch (error) {
    // Handle any errors that occur during the database query
    const reason = "Internal server error"
    return formatResponse(req, res, { status: "failed", info: reason }, 500);
  }
})

// API to check if the user is an admin
router.get("/admin/checkAdminStatus", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const username = decoded.username

    const query = `
      SELECT type
      FROM "user"
      WHERE username = $1;
    `

    const result = await pool.query(query, [username])

    if (result.rows.length > 0 && result.rows[0].type === "admin") {
      res.json({ isAdmin: true })
    } else {
      res.json({ isAdmin: false })
    }
  } catch (error) {
    const reason = "Internal server error"
    return formatResponse(req, res, { status: "failed", info: reason }, 500);
  }
})

module.exports = router

