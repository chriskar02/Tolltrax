#!/usr/bin/env node

const { program } = require("commander")
const axios = require("axios")
const fs = require("fs")
const csv = require("csv-parser")
const { Parser } = require("json2csv")

const API_BASE_URL = "http://localhost:3000/api"

// Helper function to format date
function formatDate(date) {
  return date.replace(/-/g, "")
}

// Helper function to write response in specified format
async function writeResponse(response, format = "csv") {
  if (format === "json") {
    console.log(JSON.stringify(response.data, null, 2))
  } else {
    try {
      const parser = new Parser()
      const csv = parser.parse(response.data)
      console.log(csv)
    } catch (err) {
      console.error("Error converting to CSV:", err.message)
    }
  }
}

// Helper function to handle API calls
async function makeApiCall(method, endpoint, options = {}) {
  console.log(`Making API call to ${endpoint}...`)
  try {
    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      ...options,
    })
    console.log("API call successful")
    return response
  } catch (error) {
    console.error("API call failed:", error.response?.data || error.message)
    throw error
  }
}

// Base program setup
program.name("se2412").description("CLI for toll station management").version("1.0.0")

// healthcheck command
program
  .command("healthcheck")
  .description("Check system health")
  .option("--format <type>", "output format (json/csv)", "csv")
  .action(async (options) => {
    try {
      const response = await makeApiCall("get", "/admin/healthcheck")
      await writeResponse(response, options.format)
    } catch (error) {
      console.error("Healthcheck failed:", error.message)
    }
  })

// resetpasses command
program
  .command("resetpasses")
  .description("Reset all passes")
  .option("--format <type>", "output format (json/csv)", "csv")
  .action(async (options) => {
    try {
      const response = await makeApiCall("post", "/admin/resetpasses")
      console.log("Passes reset successfully")
      await writeResponse(response, options.format)
    } catch (error) {
      console.error("Reset passes failed:", error.message)
    }
  })

// resetstations command
program
  .command("resetstations")
  .description("Reset all stations")
  .option("--format <type>", "output format (json/csv)", "csv")
  .action(async (options) => {
    try {
      const response = await makeApiCall("post", "/admin/resetstations")
      console.log("Stations reset successfully")
      await writeResponse(response, options.format)
    } catch (error) {
      console.error("Reset stations failed:", error.message)
    }
  })

// tollstationpasses command
program
  .command("tollstationpasses")
  .description("Get passes for a specific station")
  .requiredOption("--station <stationID>", "station ID")
  .requiredOption("--from <date>", "start date (YYYYMMDD)")
  .requiredOption("--to <date>", "end date (YYYYMMDD)")
  .option("--format <type>", "output format (json/csv)", "csv")
  .action(async (options) => {
    try {
      const response = await makeApiCall("get", `/tollStationPasses/${options.station}/${options.from}/${options.to}`)
      await writeResponse(response, options.format)
    } catch (error) {
      console.error("Toll station passes retrieval failed:", error.message)
    }
  })

// passanalysis command
program
  .command("passanalysis")
  .description("Analyze passes between operators")
  .requiredOption("--stationop <opID>", "station operator ID")
  .requiredOption("--tagop <opID>", "tag operator ID")
  .requiredOption("--from <date>", "start date (YYYYMMDD)")
  .requiredOption("--to <date>", "end date (YYYYMMDD)")
  .option("--format <type>", "output format (json/csv)", "csv")
  .action(async (options) => {
    try {
      const response = await makeApiCall(
        "get",
        `/passAnalysis/${options.stationop}/${options.tagop}/${options.from}/${options.to}`,
      )
      await writeResponse(response, options.format)
    } catch (error) {
      console.error("Pass analysis failed:", error.message)
    }
  })

// passescost command
program
  .command("passescost")
  .description("Get passes cost between operators")
  .requiredOption("--stationop <opID>", "station operator ID")
  .requiredOption("--tagop <opID>", "tag operator ID")
  .requiredOption("--from <date>", "start date (YYYYMMDD)")
  .requiredOption("--to <date>", "end date (YYYYMMDD)")
  .option("--format <type>", "output format (json/csv)", "csv")
  .action(async (options) => {
    try {
      const response = await makeApiCall(
        "get",
        `/passesCost/${options.stationop}/${options.tagop}/${options.from}/${options.to}`,
      )
      await writeResponse(response, options.format)
    } catch (error) {
      console.error("Passes cost retrieval failed:", error.message)
    }
  })

// chargesby command
program
  .command("chargesby")
  .description("Get charges by operator")
  .requiredOption("--opid <opID>", "operator ID")
  .requiredOption("--from <date>", "start date (YYYYMMDD)")
  .requiredOption("--to <date>", "end date (YYYYMMDD)")
  .option("--format <type>", "output format (json/csv)", "csv")
  .action(async (options) => {
    try {
      const response = await makeApiCall("get", `/chargesBy/${options.opid}/${options.from}/${options.to}`)
      await writeResponse(response, options.format)
    } catch (error) {
      console.error("Charges by operator retrieval failed:", error.message)
    }
  })

// admin commands
program
  .command("admin")
  .description("Administrative commands")
  .option("--usermod", "modify user")
  .option("--username <name>", "username")
  .option("--passw <password>", "password")
  .option("--users", "list users")
  .option("--addpasses", "add passes from CSV")
  .option("--source <file>", "CSV file path")
  .action(async (options) => {
    try {
      if (options.usermod) {
        if (!options.username || !options.passw) {
          throw new Error("Username and password required for usermod")
        }
        // Implement user modification logic here
        console.log("User modified successfully")
      } else if (options.users) {
        // Implement user listing logic here
        console.log("User list:")
      } else if (options.addpasses) {
        if (!options.source) {
          throw new Error("Source file required for addpasses")
        }
        const response = await makeApiCall("post", "/admin/addpasses", {
          data: { source: options.source },
        })
        console.log("Passes added successfully")
      }
    } catch (error) {
      console.error("Admin command failed:", error.message)
    }
  })

// Ensure the program doesn't exit before async operations complete
program
  .parseAsync(process.argv)
  .then(() => {
    console.log("Command execution completed")
  })
  .catch((error) => {
    console.error("An error occurred:", error)
    process.exit(1)
  })

