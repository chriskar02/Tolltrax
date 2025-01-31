const express = require("express")
const router = express.Router()
const { Pool } = require("pg")

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

// Προσθέτουμε logging
console.log("Passes routes loaded")

// Test endpoint
router.get("/passes-test", (req, res) => {
  res.json({ message: "Passes route works!" })
})

// Helper function to format date from YYYYMMDD to YYYY-MM-DD
function formatDate(dateString) {
  const year = dateString.substring(0, 4)
  const month = dateString.substring(4, 6)
  const day = dateString.substring(6, 8)
  return `${year}-${month}-${day}`
}

// Endpoint για το tollStationPasses (λειτουργία a)
router.get("/tollStationPasses/:tollStationID/:date_from/:date_to", async (req, res) => {
  console.log("Request received:", req.params)
  try {
    const { tollStationID, date_from, date_to } = req.params

    // Format dates for SQL query
    const fromDate = formatDate(date_from)
    const toDate = formatDate(date_to)

    // Get station operator info
    const stationQuery = await pool.query(`SELECT operator FROM toll_station WHERE tollid = $1`, [tollStationID])

    if (stationQuery.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: `Station with ID ${tollStationID} not found`,
      })
    }

    const stationOperator = stationQuery.rows[0].operator

    // Get passes for the station within the date range
    const passesQuery = await pool.query(
      `SELECT 
        p.timestamp,
        t.id as tagid,
        t.operatorid as tagoperator,
        p.charge,
        CASE 
          WHEN t.operatorid = ts.opid THEN 'home'
          ELSE 'visitor'
        END as passtype
      FROM passthrough p
      JOIN transceiver t ON p.transceiverid = t.id
      JOIN toll_station ts ON p.tollid = ts.tollid
      WHERE p.tollid = $1 
      AND p.timestamp::date BETWEEN $2::date AND $3::date
      ORDER BY p.timestamp ASC`,
      [tollStationID, fromDate, toDate],
    )

    // Format the response according to specifications
    const passList = passesQuery.rows.map((pass, index) => ({
      passIndex: index + 1,
      passID: `${tollStationID}${pass.timestamp.toISOString().replace(/[-:T.Z]/g, "")}`,
      timestamp: pass.timestamp.toISOString().slice(0, 16).replace("T", " "),
      tagID: pass.tagid,
      tagoperator: pass.tagoperator,
      passType: pass.passtype,
      passCharge: Number.parseFloat(pass.charge),
    }))

    const response = {
      stationID: tollStationID,
      stationOperator: stationOperator,
      requestTimestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      periodFrom: fromDate,
      periodTo: toDate,
      nPasses: passList.length,
      passList: passList,
    }

    console.log("Sending response:", response)
    res.json(response)
  } catch (error) {
    console.error("Error in tollStationPasses:", error)
    res.status(500).json({
      status: "failed",
      message: error.message,
    })
  }
})

// Endpoint για το passAnalysis (λειτουργία b)
router.get("/passAnalysis/:stationOpID/:tagOpID/:date_from/:date_to", async (req, res) => {
  console.log("Pass Analysis request received:", req.params)
  try {
    const { stationOpID, tagOpID, date_from, date_to } = req.params

    // Format dates for SQL query
    const fromDate = formatDate(date_from)
    const toDate = formatDate(date_to)

    // Get passes for stations operated by stationOpID and tags provided by tagOpID
    const passesQuery = await pool.query(
      `SELECT 
        p.timestamp,
        ts.tollid as stationid,
        t.id as tagid,
        p.charge
      FROM passthrough p
      JOIN transceiver t ON p.transceiverid = t.id
      JOIN toll_station ts ON p.tollid = ts.tollid
      WHERE ts.opid = $1 
      AND t.operatorid = $2
      AND p.timestamp::date BETWEEN $3::date AND $4::date
      ORDER BY p.timestamp ASC`,
      [stationOpID, tagOpID, fromDate, toDate],
    )

    // Format the response according to specifications
    const passList = passesQuery.rows.map((pass, index) => ({
      passIndex: index + 1,
      passID: `${pass.stationid}${pass.timestamp.toISOString().replace(/[-:T.Z]/g, "")}`,
      stationID: pass.stationid,
      timestamp: pass.timestamp.toISOString().slice(0, 16).replace("T", " "),
      tagID: pass.tagid,
      passCharge: Number.parseFloat(pass.charge),
    }))

    const response = {
      stationOpID: stationOpID,
      tagOpID: tagOpID,
      requestTimestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      periodFrom: fromDate,
      periodTo: toDate,
      nPasses: passList.length,
      passList: passList,
    }

    console.log("Sending pass analysis response:", response)
    res.json(response)
  } catch (error) {
    console.error("Error in passAnalysis:", error)
    res.status(500).json({
      status: "failed",
      message: error.message,
    })
  }
})

// Νέο endpoint για το passesCost (λειτουργία c)
router.get("/passesCost/:tollOpID/:tagOpID/:date_from/:date_to", async (req, res) => {
  console.log("Passes Cost request received:", req.params)
  try {
    const { tollOpID, tagOpID, date_from, date_to } = req.params

    // Format dates for SQL query
    const fromDate = formatDate(date_from)
    const toDate = formatDate(date_to)

    // Get passes and calculate total cost
    const passesQuery = await pool.query(
      `SELECT 
        COUNT(*) as pass_count,
        COALESCE(SUM(p.charge), 0) as total_cost
      FROM passthrough p
      JOIN transceiver t ON p.transceiverid = t.id
      JOIN toll_station ts ON p.tollid = ts.tollid
      WHERE ts.opid = $1 
      AND t.operatorid = $2
      AND p.timestamp::date BETWEEN $3::date AND $4::date`,
      [tollOpID, tagOpID, fromDate, toDate],
    )

    const { pass_count, total_cost } = passesQuery.rows[0]

    const response = {
      tollOpID: tollOpID,
      tagOpID: tagOpID,
      requestTimestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      periodFrom: fromDate,
      periodTo: toDate,
      nPasses: Number.parseInt(pass_count),
      passesCost: Number.parseFloat(total_cost),
    }

    console.log("Sending passes cost response:", response)
    res.json(response)
  } catch (error) {
    console.error("Error in passesCost:", error)
    res.status(500).json({
      status: "failed",
      message: error.message,
    })
  }
})

// Νέο endpoint για το chargesBy (λειτουργία d)
router.get("/chargesBy/:tollOpID/:date_from/:date_to", async (req, res) => {
  console.log("Charges By request received:", req.params)
  try {
    const { tollOpID, date_from, date_to } = req.params

    // Format dates for SQL query
    const fromDate = formatDate(date_from)
    const toDate = formatDate(date_to)

    // Get passes and calculate total cost grouped by tag operator
    const passesQuery = await pool.query(
      `SELECT 
        t.operatorid as op_ID,
        COUNT(*) as op_number,
        COALESCE(SUM(p.charge), 0) as op_amount
      FROM passthrough p
      JOIN transceiver t ON p.transceiverid = t.id
      JOIN toll_station ts ON p.tollid = ts.tollid
      WHERE ts.opid = $1 
      AND t.operatorid != $1
      AND p.timestamp::date BETWEEN $2::date AND $3::date
      GROUP BY t.operatorid
      ORDER BY t.operatorid ASC`,
      [tollOpID, fromDate, toDate],
    )

    // Format the PPOList (Per operator Operations List)
    const PPOList = passesQuery.rows.map((row) => ({
      op_ID: row.op_id,
      op_number: Number.parseInt(row.op_number),
      op_amount: Number.parseFloat(row.op_amount),
    }))

    const response = {
      tollOpID: tollOpID,
      requestTimestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      periodFrom: fromDate,
      periodTo: toDate,
      PPOList: PPOList,
    }

    console.log("Sending charges by response:", response)
    res.json(response)
  } catch (error) {
    console.error("Error in chargesBy:", error)
    res.status(500).json({
      status: "failed",
      message: error.message,
    })
  }
})

module.exports = router


