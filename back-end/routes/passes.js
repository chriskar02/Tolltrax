const express = require("express")
const router = express.Router()
const { getPool } = require("./db");

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
        return res.status(500).json({
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

      formatResponse(req, res, {
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
    formatResponse(req, res, { status: "failed", info: error.message }, 500);
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

      formatResponse(req, res, {
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
    formatResponse(req, res, { status: "failed", info: error.message }, 500);
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
      formatResponse(req, res, {
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
    formatResponse(req, res, { status: "failed", info: error.message }, 500);
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

      formatResponse(req, res, {
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
    formatResponse(req, res, { status: "failed", info: error.message }, 500);
  }
});

module.exports = router;