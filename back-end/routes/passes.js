const express = require("express")
const router = express.Router()
const { getPool } = require("../config/db");

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


// 20240101 ===> 2024-01-01
function formatDate(dateString) {
  return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
}

function handleError(res, error) {
  console.error(error);
  res.status(500).json({
    status: "failed",
    info: error.message
  });
}

// a. Toll Station Passes Endpoint
router.get("/tollStationPasses/:tollStationID/:date_from/:date_to", async (req, res) => {
  try {
    await runTransaction(async (client) => {
      const { tollStationID, date_from, date_to } = req.params;

      const stationQuery = await client.query(
        `SELECT operatorid FROM toll_station WHERE tollid = $1`,
        [tollStationID]
      );

      if (!stationQuery.rows.length) {
        return res.status(404).json({
          status: "failed",
          info: `Station ${tollStationID} not found`
        });
      }

      const passes = await client.query(
        `SELECT
          p.timestamp, t.id as tagid, t.operatorid as tagoperator, p.charge,
          CASE
            WHEN t.operatorid = ts.operatorid THEN 'home'
            ELSE 'visitor'
          END as passtype
         FROM passthrough p
         JOIN transceiver t ON p.transceiverid = t.id
         JOIN toll_station ts ON p.tollid = ts.tollid
         WHERE p.tollid = $1 AND p.timestamp::date BETWEEN $2 AND $3
         ORDER BY p.timestamp ASC`,
        [tollStationID, formatDate(date_from), formatDate(date_to)]
      );

      res.json({
        stationID: tollStationID,
        stationOperator: stationQuery.rows[0].operatorid,
        requestTimestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
        periodFrom: formatDate(date_from),
        periodTo: formatDate(date_to),
        nPasses: passes.rows.length,
        passList: passes.rows.map((pass, index) => ({
          passIndex: index + 1,
          passID: `${tollStationID}${pass.timestamp.toISOString().replace(/[-:T.Z]/g, "")}`,
          timestamp: pass.timestamp.toISOString().slice(0, 16).replace("T", " "),
          tagID: pass.tagid,
          tagProvider: pass.tagprovider,
          passType: pass.passtype,
          passCharge: Number(pass.charge),
        }))
      });
    });
  } catch (error) {
    handleError(res, error);
  }
});

// B. Pass Analysis Endpoint
router.get("/passAnalysis/:stationOpID/:tagOpID/:date_from/:date_to", async (req, res) => {
  try {
    await runTransaction(async (client) => {
      const { stationOpID, tagOpID, date_from, date_to } = req.params;

      const passes = await client.query(
        `SELECT p.timestamp, ts.tollid as stationid, t.id as tagid, p.charge
         FROM passthrough p
         JOIN transceiver t ON p.transceiverid = t.id
         JOIN toll_station ts ON p.tollid = ts.tollid
         WHERE ts.operatorid = $1 AND t.operatorid = $2
         AND p.timestamp::date BETWEEN $3 AND $4
         ORDER BY p.timestamp ASC`,
        [stationOpID, tagOpID, formatDate(date_from), formatDate(date_to)]
      );

      res.json({
        stationOpID: stationOpID,
        tagOpID: tagOpID,
        requestTimestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
        periodFrom: formatDate(date_from),
        periodTo: formatDate(date_to),
        nPasses: passes.rows.length,
        passList: passes.rows.map((pass, index) => ({
          passIndex: index + 1,
          passID: `${pass.stationid}${pass.timestamp.toISOString().replace(/[-:T.Z]/g, "")}`,
          stationID: pass.stationid,
          timestamp: pass.timestamp.toISOString().slice(0, 16).replace("T", " "),
          tagID: pass.tagid,
          passCharge: Number(pass.charge)
        }))
      });
    });
  } catch (error) {
    handleError(res, error);
  }
});

// C. Passes Cost Endpoint
router.get("/passesCost/:tollOpID/:tagOpID/:date_from/:date_to", async (req, res) => {
  try {
    await runTransaction(async (client) => {
      const { tollOpID, tagOpID, date_from, date_to } = req.params;

      const result = await client.query(
        `SELECT COUNT(*) as pass_count, COALESCE(SUM(p.charge), 0) as total_cost
         FROM passthrough p
         JOIN transceiver t ON p.transceiverid = t.id
         JOIN toll_station ts ON p.tollid = ts.tollid
         WHERE ts.operatorid = $1 AND t.operatorid = $2
         AND p.timestamp::date BETWEEN $3 AND $4`,
        [tollOpID, tagOpID, formatDate(date_from), formatDate(date_to)]
      );

      const { pass_count, total_cost } = result.rows[0];
      res.json({
        tollOpID: tollOpID,
        tagOpID: tagOpID,
        requestTimestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
        periodFrom: formatDate(date_from),
        periodTo: formatDate(date_to),
        nPasses: Number(pass_count),
        passesCost: Number(total_cost)
      });
    });
  } catch (error) {
    handleError(res, error);
  }
});

// D. Charges By Endpoint
router.get("/chargesBy/:tollOpID/:date_from/:date_to", async (req, res) => {
  try {
    await runTransaction(async (client) => {
      const { tollOpID, date_from, date_to } = req.params;

      const result = await client.query(
        `SELECT t.operatorid as op_id, COUNT(*) as op_number, 
         COALESCE(SUM(p.charge), 0) as op_amount
         FROM passthrough p
         JOIN transceiver t ON p.transceiverid = t.id
         JOIN toll_station ts ON p.tollid = ts.tollid
         WHERE ts.operatorid = $1 AND t.operatorid != $1
         AND p.timestamp::date BETWEEN $2 AND $3
         GROUP BY t.operatorid
         ORDER BY t.operatorid ASC`,
        [tollOpID, formatDate(date_from), formatDate(date_to)]
      );

      res.json({
        tollOpID: tollOpID,
        requestTimestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
        periodFrom: formatDate(date_from),
        periodTo: formatDate(date_to),
        vOpList: result.rows.map(row => ({
          visitingOpID: row.op_id,
          nPasses: Number(row.op_number),
          passesCost: Number(row.op_amount)
        }))
      });
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;