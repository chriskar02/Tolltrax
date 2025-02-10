import subprocess
import unittest
import json

class TestCLILoginLogout(unittest.TestCase):

    def run_command(self, command):
        """Executes a CLI command and returns its output, error, and exit status."""
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result.stdout.strip(), result.stderr.strip(), result.returncode

    def test_valid_login(self):
        """Test successful login"""
        cmd = "se2412 login --username admin --passw freepasses4all"
        output, error, status = self.run_command(cmd)

        self.assertEqual(status, 0)  
        self.assertTrue("token" in output)  
        json_output = json.loads(output)
        self.assertIn("token", json_output)

    def test_invalid_login(self):
        """Test login failure with incorrect credentials"""
        cmd = "se2412 login --username wrong_user --passw wrong_pass"
        output, error, status = self.run_command(cmd)

        self.assertEqual(status, 1)  
        json_output = json.loads(output)
        self.assertEqual(json_output["status"], "failed")
        self.assertEqual(json_output["info"], "Invalid username or password")

    def test_empty_credentials(self):
        """Test login with empty credentials"""
        cmd = 'se2412 login --username "" --passw ""'
        output, error, status = self.run_command(cmd)

        self.assertEqual(status, 1)
        json_output = json.loads(output)
        self.assertEqual(json_output["status"], "failed")
        self.assertEqual(json_output["info"], "Username and password required")

    def test_valid_logout(self):
        """Test successful logout"""
        cmd = "se2412 logout"
        output, error, status = self.run_command(cmd)

        self.assertEqual(status, 0)  
        self.assertEqual(output, "")  

    def test_logout_without_login(self):
        """Test logout without an active session"""
        cmd = "se2412 logout"
        output, error, status = self.run_command(cmd)

        self.assertEqual(status, 1)
        json_output = json.loads(output)
        self.assertEqual(json_output["status"], "failed")
        self.assertEqual(json_output["info"], "No active session")

    def test_logout_with_invalid_token(self):
        """Test logout with an invalid token"""
        cmd = "se2412 logout --token INVALIDTOKEN"
        output, error, status = self.run_command(cmd)

        self.assertEqual(status, 1)
        json_output = json.loads(output)
        self.assertEqual(json_output["status"], "failed")
        self.assertEqual(json_output["info"], "Invalid session")


# class TestCLISystemCommands(unittest.TestCase):

#     def run_command(self, command):
#         """Executes a CLI command and returns its output, error, and exit status."""
#         result = subprocess.run(command, shell=True, capture_output=True, text=True)
#         return result.stdout.strip(), result.stderr.strip(), result.returncode

#     def test_healthcheck(self):
#         """Test initial healthcheck"""
#         cmd = "se2499 healthcheck"
#         output, error, status = self.run_command(cmd)

#         self.assertEqual(status, 0)  
#         json_output = json.loads(output)
#         self.assertEqual(json_output["status"], "OK")  

#     def test_reset_passes(self):
#         """Test resetpasses command"""
#         cmd = "se2499 resetpasses"
#         output, error, status = self.run_command(cmd)

#         self.assertEqual(status, 0)
#         json_output = json.loads(output)
#         self.assertEqual(json_output["status"], "OK")  

#     def test_healthcheck_after_resetpasses(self):
#         """Test healthcheck after resetpasses"""
#         cmd = "se2499 healthcheck"
#         output, error, status = self.run_command(cmd)

#         self.assertEqual(status, 0)
#         json_output = json.loads(output)
#         self.assertEqual(json_output["status"], "OK")  

#     def test_reset_stations(self):
#         """Test resetstations command"""
#         cmd = "se2499 resetstations"
#         output, error, status = self.run_command(cmd)

#         self.assertEqual(status, 0)
#         json_output = json.loads(output)
#         self.assertEqual(json_output["status"], "OK")  

#     def test_healthcheck_after_resetstations(self):
#         """Test healthcheck after resetstations"""
#         cmd = "se2499 healthcheck"
#         output, error, status = self.run_command(cmd)

#         self.assertEqual(status, 0)
#         json_output = json.loads(output)
#         self.assertEqual(json_output["status"], "OK")  

#     def test_add_passes(self):
#         """Test admin --addpasses"""
#         cmd = "se2499 admin --addpasses --source passes99.csv"
#         output, error, status = self.run_command(cmd)

#         self.assertEqual(status, 0)
#         json_output = json.loads(output)
#         self.assertEqual(json_output["status"], "OK")  

#     def test_healthcheck_after_addpasses(self):
#         """Final healthcheck to ensure system consistency"""
#         cmd = "se2499 healthcheck"
#         output, error, status = self.run_command(cmd)

#         self.assertEqual(status, 0)
#         json_output = json.loads(output)
#         self.assertEqual(json_output["status"], "OK")  


if __name__ == "__main__":
    unittest.main()
