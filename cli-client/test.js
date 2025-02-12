const { exec } = require("child_process");
const { expect } = require("chai");
const fs = require("fs");

describe("CLI Tests for se2412", function () {
  this.timeout(5000);

  function runCLI(command, callback) {
    exec(`node ./se2412.js ${command}`, (error, stdout, stderr) => {
      callback(error, stdout, stderr);
    });
  }

  it("should fail login with wrong credentials", (done) => {
    runCLI("login --username wrongUser --passw wrongPass", (error, stdout) => {
        const output = JSON.parse(stdout.trim()); 
        expect(output).to.have.property("status", "failed");
        expect(output).to.have.property("info"); 
        done();
    });
  });


  it("should login successfully", (done) => {
    runCLI("login --username admin --passw freepasses4all", (error, stdout) => {
      expect(stdout).to.include("token");
      done();
    });
  });  

  it("should check system health", function (done) {
    exec("se2412 healthcheck --format json", (error, stdout) => {
      if (error) return done(error);
      const output = JSON.parse(stdout.trim()); 
      expect(output).to.have.property("status").that.is.oneOf(["OK", "failed"]);
      expect(output).to.have.property("dbconnection").that.is.a("string");

      if (output.status === "OK") {
        expect(output).to.have.property("n_stations").that.is.a("number");
        expect(output).to.have.property("n_tags").that.is.a("number");
        expect(output).to.have.property("n_passes").that.is.a("number");
      }

      done();
    });
  });
  

  it("should reset passes", (done) => {
    runCLI("se2412 resetpasses --format json", (error, stdout) => {
      const output = JSON.parse(stdout.trim()); 
      expect(output).to.have.property("status", "OK");
      done();
    });
  });

  it("should reset stations and return correct format", function (done) {
    exec("se2412 resetstations --format json", (error, stdout) => {
      if (error) return done(error);

      let output;
      try {
        output = JSON.parse(stdout.trim());
      } catch {
        return done(new Error("Invalid JSON response: " + stdout));
      }

      // Top-level properties
      expect(output).to.have.property("status", "OK");
      expect(output).to.have.property("stationID").that.is.a("string");
      expect(output).to.have.property("stationOperator").that.is.a("string");
      expect(output).to.have.property("requestTimestamp").that.is.a("string");
      expect(output).to.have.property("periodFrom").that.is.a("string");
      expect(output).to.have.property("periodTo").that.is.a("string");
      expect(output).to.have.property("nPasses").that.is.a("number");
      expect(output).to.have.property("passList").that.is.an("array");

      // Validate passList items if there are passes
      if (output.nPasses > 0) {
        output.passList.forEach((pass) => {
          expect(pass).to.have.property("passIndex").that.is.a("number");
          expect(pass).to.have.property("passID").that.is.a("string");
          expect(pass).to.have.property("timestamp").that.is.a("string");
          expect(pass).to.have.property("tagID").that.is.a("string");
          expect(pass).to.have.property("tagProvider").that.is.a("string");
          expect(pass).to.have.property("passType").that.is.oneOf(["home", "visitor"]);
          expect(pass).to.have.property("passCharge").that.is.a("number");
        });
      }

      done();
    });
  });

  it("should fetch toll station passes with correct format", function (done) {
    exec("se2412 tollstationpasses --station NAO01 --from 20240101 --to 20240131 --format json", (error, stdout) => {
      if (error) return done(error);

      let output;
      try {
        output = JSON.parse(stdout.trim());
      } catch {
        return done(new Error("Invalid JSON response: " + stdout));
      }

      // Top-level properties
      expect(output).to.have.property("stationOpID").that.is.a("string");
      expect(output).to.have.property("tagOpID").that.is.a("string");
      expect(output).to.have.property("requestTimestamp").that.is.a("string");
      expect(output).to.have.property("periodFrom").that.is.a("string");
      expect(output).to.have.property("periodTo").that.is.a("string");
      expect(output).to.have.property("nPasses").that.is.a("number");
      expect(output).to.have.property("passList").that.is.an("array");

      // Validate passList items if there are passes
      if (output.nPasses > 0) {
        output.passList.forEach((pass) => {
          expect(pass).to.have.property("passIndex").that.is.a("number");
          expect(pass).to.have.property("passID").that.is.a("string");
          expect(pass).to.have.property("stationID").that.is.a("string");
          expect(pass).to.have.property("timestamp").that.is.a("string");
          expect(pass).to.have.property("tagID").that.is.a("string");
          expect(pass).to.have.property("passCharge").that.is.a("number");
        });
      }

      done();
    });
  });

  it("should analyze pass data between operators with correct format", function (done) {
    exec("se2412 passanalysis --stationop AM --tagop EG --from 20240101 --to 20240131 --format json", (error, stdout) => {
      if (error) return done(error);

      let output;
      try {
        output = JSON.parse(stdout.trim());
      } catch {
        return done(new Error("Invalid JSON response: " + stdout));
      }

      // Top-level properties
      expect(output).to.have.property("stationOpID").that.is.a("string");
      expect(output).to.have.property("tagOpID").that.is.a("string");
      expect(output).to.have.property("requestTimestamp").that.is.a("string");
      expect(output).to.have.property("periodFrom").that.is.a("string");
      expect(output).to.have.property("periodTo").that.is.a("string");
      expect(output).to.have.property("nPasses").that.is.a("number");
      expect(output).to.have.property("passList").that.is.an("array");

      // Validate passList items if there are passes
      if (output.nPasses > 0) {
        output.passList.forEach((pass) => {
          expect(pass).to.have.property("passIndex").that.is.a("number");
          expect(pass).to.have.property("passID").that.is.a("string");
          expect(pass).to.have.property("stationID").that.is.a("string");
          expect(pass).to.have.property("timestamp").that.is.a("string");
          expect(pass).to.have.property("tagID").that.is.a("string");
          expect(pass).to.have.property("passCharge").that.is.a("number");
        });
      }

      done();
    });
  });

  it("should return pass cost with correct format", function (done) {
    exec("se2412 passescost --stationop NAO --tagop AM --from 20240101 --to 20240131 --format json", (error, stdout) => {
      if (error) return done(error);

      let output;
      try {
        output = JSON.parse(stdout.trim());
      } catch {
        return done(new Error("Invalid JSON response: " + stdout));
      }

      // Top-level properties
      expect(output).to.have.property("tollOpID").that.is.a("string");
      expect(output).to.have.property("tagOpID").that.is.a("string");
      expect(output).to.have.property("requestTimestamp").that.is.a("string");
      expect(output).to.have.property("periodFrom").that.is.a("string");
      expect(output).to.have.property("periodTo").that.is.a("string");
      expect(output).to.have.property("nPasses").that.is.a("number");
      expect(output).to.have.property("passesCost").that.is.a("number");

      done();
    });
  });

  it("should get charges by operator with correct format", function (done) {
    exec("se2412 chargesby --opid NAO --from 20240101 --to 20240131 --format json", (error, stdout) => {
      if (error) return done(error);

      let output;
      try {
        output = JSON.parse(stdout.trim());
      } catch {
        return done(new Error("Invalid JSON response: " + stdout));
      }

      // Top-level properties
      expect(output).to.have.property("tollOpID").that.is.a("string");
      expect(output).to.have.property("requestTimestamp").that.is.a("string");
      expect(output).to.have.property("periodFrom").that.is.a("string");
      expect(output).to.have.property("periodTo").that.is.a("string");
      expect(output).to.have.property("vOpList").that.is.an("array");

      // Validate vOpList items if there are any visiting operators
      if (output.vOpList.length > 0) {
        output.vOpList.forEach((operator) => {
          expect(operator).to.have.property("visitingOpID").that.is.a("string");
          expect(operator).to.have.property("nPasses").that.is.a("number");
          expect(operator).to.have.property("passesCost").that.is.a("number");
        });
      }

      done();
    });
  });

  it("should logout successfully", (done) => {
    runCLI("logout", (error, stdout) => {
      expect(stdout).to.be.empty;
      done();
    });
  });
});
