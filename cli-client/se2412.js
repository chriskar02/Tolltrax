#!/usr/bin/env node

const { program } = require("commander")
const axios = require("axios")
const fs = require("fs")
const csv = require("csv-parser")
const { Parser } = require("json2csv")

const API_BASE_URL = "http://localhost:3000/api"
const TOKEN_FILE = "token.json";

// Function to save JWT token
function saveToken(token) {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token }));
}

// Function to load JWT token (for authenticated requests)
function loadToken() {
  if (fs.existsSync(TOKEN_FILE)) {
    return JSON.parse(fs.readFileSync(TOKEN_FILE)).token;
  }
  return null;
}

// Function to remove JWT token (logout)
function removeToken() {
  if (fs.existsSync(TOKEN_FILE)) {
    fs.unlinkSync(TOKEN_FILE);
  }
}

// Function to enforce login before executing commands
function requireLogin() {
  if (!fs.existsSync(TOKEN_FILE)) {
      console.error("You must log in first! Use: se2412 login --username <username> --passw <password>");
      process.exit(1); 
  }
}

// Helper function to write response in specified format
async function writeResponse(response, format = "csv") {
  if (format === "json") {
    console.log(JSON.stringify(response.data));  // Ensures JSON is properly formatted
  } else if (format === "csv") {
    try {
      if (typeof response.data === "object") {
        const parser = new Parser();
        const csv = parser.parse(response.data);
        console.log(csv);
      } else {
        console.error("Error: Expected object for CSV conversion but got:", response.data);
      }
    } catch (err) {
      console.error("Error converting to CSV:", err.message);
    }
  } else {
    console.error("Unsupported format:", format);
  }
}


// Base program setup
program.name("se2412").description("CLI for toll station management").version("1.0.0")

// Login Command
program
  .command("login")
  .description("Log in to the system")
  .requiredOption("--username <username>", "Username")
  .requiredOption("--passw <password>", "Password")
  .action(async (options) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: options.username,
        password: options.passw,
      });

      saveToken(response.data.token);
      console.log(JSON.stringify(response.data, null, 2)); // Print the exact API response
      process.exit(0);
    } catch (error) {
      console.log(JSON.stringify(error.response?.data || { error: error.message }, null, 2)); // Print API error response
      process.exit(1);
    }
  });


// Logout Command
program
  .command("logout")
  .description("Log out of the system")
  .action(() => {
    removeToken();;
  });

// Healthcheck Command
program
  .command("healthcheck")
  .description("Check system health")
  .option("--format <type>", "output format (json/csv)", "csv")
  .action(async (options) => {
    requireLogin();
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/healthcheck`, {
        headers: { Authorization: `Bearer ${loadToken()}` },
      });

      await writeResponse(response, options.format); 
    } catch (error) {
      console.log(JSON.stringify(error.response?.data || { error: error.message }, null, 2)); 
    }
  });

// Reset Passes Command
program
  .command("resetpasses")
  .description("Reset all passes")
  .option("--format <type>", "output format (json/csv)", "csv")
  .action(async (options) => {
    requireLogin();
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/resetpasses`, {}, {
        headers: { Authorization: `Bearer ${loadToken()}` },
      });

      await writeResponse(response, options.format); 
    } catch (error) {
      console.log(JSON.stringify(error.response?.data || { error: error.message }, null, 2)); 
    }
  });

// Reset Stations Command
program
  .command("resetstations")
  .description("Reset all stations")
  .option("--format <type>", "output format (json/csv)", "csv")
  .action(async (options) => {
    requireLogin();
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/resetstations`, {}, {
        headers: { Authorization: `Bearer ${loadToken()}` },
      });

      await writeResponse(response, options.format); 
    } catch (error) {
      console.log(JSON.stringify(error.response?.data || { error: error.message }, null, 2)); 
    }
  });

// Toll Station Passes Command
program
  .command("tollstationpasses")
  .description("Get passes for a specific station")
  .requiredOption("--station <stationID>", "station ID")
  .requiredOption("--from <date>", "start date (YYYYMMDD)")
  .requiredOption("--to <date>", "end date (YYYYMMDD)")
  .option("--format <type>", "output format (json/csv)", "csv")
  .action(async (options) => {
    requireLogin();
    try {
      const response = await axios.get(`${API_BASE_URL}/tollStationPasses/${options.station}/${options.from}/${options.to}`, {
        headers: { Authorization: `Bearer ${loadToken()}` },
      });

      await writeResponse(response, options.format); 
    } catch (error) {
      console.log(JSON.stringify(error.response?.data || { error: error.message }, null, 2)); 
    }
  });

// Pass Analysis Command
program
  .command("passanalysis")
  .description("Analyze passes between operators")
  .requiredOption("--stationop <opID>", "station operator ID")
  .requiredOption("--tagop <opID>", "tag operator ID")
  .requiredOption("--from <date>", "start date (YYYYMMDD)")
  .requiredOption("--to <date>", "end date (YYYYMMDD)")
  .option("--format <type>", "output format (json/csv)", "csv")
  .action(async (options) => {
    requireLogin();
    try {
      const response = await axios.get(
        `${API_BASE_URL}/passAnalysis/${options.stationop}/${options.tagop}/${options.from}/${options.to}`,
        {
          headers: { Authorization: `Bearer ${loadToken()}` },
        }
      );

      await writeResponse(response, options.format); 
    } catch (error) {
      console.log(JSON.stringify(error.response?.data || { error: error.message }, null, 2)); 
    }
  });

// Passes Cost Command
program
  .command("passescost")
  .description("Get passes cost between operators")
  .requiredOption("--stationop <opID>", "station operator ID")
  .requiredOption("--tagop <opID>", "tag operator ID")
  .requiredOption("--from <date>", "start date (YYYYMMDD)")
  .requiredOption("--to <date>", "end date (YYYYMMDD)")
  .option("--format <type>", "output format (json/csv)", "csv")
  .action(async (options) => {
    requireLogin();
    try {
      const response = await axios.get(
        `${API_BASE_URL}/passesCost/${options.stationop}/${options.tagop}/${options.from}/${options.to}`,
        {
          headers: { Authorization: `Bearer ${loadToken()}` },
        }
      );

      await writeResponse(response, options.format); 
    } catch (error) {
      console.log(JSON.stringify(error.response?.data || { error: error.message }, null, 2)); 
    }
  });

// Charges By Command
program
  .command("chargesby")
  .description("Get charges by operator")
  .requiredOption("--opid <opID>", "operator ID")
  .requiredOption("--from <date>", "start date (YYYYMMDD)")
  .requiredOption("--to <date>", "end date (YYYYMMDD)")
  .option("--format <type>", "output format (json/csv)", "csv")
  .action(async (options) => {
    requireLogin();
    try {
      const response = await axios.get(
        `${API_BASE_URL}/chargesBy/${options.opid}/${options.from}/${options.to}`,
        {
          headers: { Authorization: `Bearer ${loadToken()}` },
        }
      );

      await writeResponse(response, options.format); 
    } catch (error) {
      console.log(JSON.stringify(error.response?.data || { error: error.message }, null, 2)); 
    }
  });


// Admin Commands
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
    requireLogin();
    try {
      let response;

      if (options.usermod) {
        if (!options.username || !options.passw) {
          throw new Error("Username and password required for usermod");
        }

        response = await axios.post(
          `${API_BASE_URL}/admin/usermod`,
          {
            username: options.username,
            password: options.passw,
          },
          {
            headers: { Authorization: `Bearer ${loadToken()}` },
          }
        );
      } else if (options.users) {
        response = await axios.get(`${API_BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${loadToken()}` },
        });
      } else if (options.addpasses) {
        if (!options.source) {
          throw new Error("Source file required for addpasses");
        }

        response = await axios.post(
          `${API_BASE_URL}/admin/addpasses`,
          { source: options.source },
          {
            headers: { Authorization: `Bearer ${loadToken()}` },
          }
        );
      }

      if (response) {
        console.log(JSON.stringify(response.data, null, 2)); 
      }
    } catch (error) {
      console.log(JSON.stringify(error.response?.data || { error: error.message }, null, 2)); 
    }
  });


// Ensure the program doesn't exit before async operations complete
program
  .parseAsync(process.argv)
  .catch(() => process.exit(1));

