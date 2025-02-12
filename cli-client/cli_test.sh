#!/bin/bash
set -e

# Token file used by the CLI tool
TOKEN_FILE="token.json"

# Clean up any existing token
if [ -f "$TOKEN_FILE" ]; then
  rm "$TOKEN_FILE"
fi

echo "Starting CLI tests with error checks and valid flows..."

# Test invalid login with wrong password
echo "Testing invalid login (wrong password)..."
if node se2412.js login --username admin --passw wrongpassword > /dev/null 2>&1; then
  echo "ERROR: Login with wrong password unexpectedly succeeded."
  exit 1
else
  echo "Passed: Login failed as expected with wrong password."
fi

if [ -f "$TOKEN_FILE" ]; then
  echo "ERROR: Token file should not be created after invalid login."
  exit 1
fi

# Test invalid login with wrong username
echo "Testing invalid login (wrong username)..."
if node se2412.js login --username wronguser --passw freepasses4all > /dev/null 2>&1; then
  echo "ERROR: Login with wrong username unexpectedly succeeded."
  exit 1
else
  echo "Passed: Login failed as expected with wrong username."
fi

if [ -f "$TOKEN_FILE" ]; then
  echo "ERROR: Token file should not exist after invalid login with wrong username."
  exit 1
fi

# Test successful login with correct credentials
echo "Testing valid login..."
node se2412.js login --username admin --passw freepasses4all
if [ ! -f "$TOKEN_FILE" ]; then
  echo "ERROR: Token file was not created after valid login."
  exit 1
fi
echo "Passed: Valid login succeeded and token file created."

# Test an admin command (healthcheck) with the valid token
echo "Testing admin command: healthcheck..."
node se2412.js healthcheck --format json

# Test a command that requires login but is public for logged in users
echo "Testing tollstationpasses command..."
node se2412.js tollstationpasses --station NAO30 --from 20220101 --to 20220102 --format json

# Test additional admin commands
echo "Testing admin command: resetpasses..."
node se2412.js resetpasses --format json

echo "Testing admin command: resetstations..."
node se2412.js resetstations --format json

echo "Testing admin command: usermod..."
node se2412.js admin --usermod --username testuser --passw testpass

echo "Testing admin command: list users..."
node se2412.js admin --users

# Logout and ensure token removal
echo "Logging out..."
node se2412.js logout
if [ -f "$TOKEN_FILE" ]; then
  echo "ERROR: Token file still exists after logout."
  exit 1
fi

# Test that an admin command fails after logout
echo "Testing admin command after logout (should fail)..."
if node se2412.js healthcheck --format json > /dev/null 2>&1; then
  echo "ERROR: Healthcheck succeeded even though no user is logged in."
  exit 1
else
  echo "Passed: Admin command correctly failed after logout."
fi

echo "CLI tests (including error cases) completed successfully."
