import subprocess
import json

def run_cli_command(command):
    """Εκτελεί μια εντολή CLI και επιστρέφει την έξοδο ως κείμενο."""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except Exception as e:
        return None, str(e), -1

def compare_output(actual, expected):
    """Συγκρίνει το actual output με το expected output και επιστρέφει το αποτέλεσμα."""
    try:
        actual_json = json.loads(actual)
        expected_json = json.loads(expected)
        return actual_json == expected_json
    except json.JSONDecodeError:
        return actual.strip() == expected.strip()

# ----------------------------
#         TEST CASES
# ----------------------------

def test_login():
    actual_output, error, code = run_cli_command("se2412 login --username admin --passw freepasses4all")
    return code == 0 and "token" in actual_output, actual_output, "Contains token", error

def test_logout():
    actual_output, error, code = run_cli_command("se2412 logout")
    return code == 0 and actual_output == "", actual_output, "Empty response", error

def test_healthcheck():
    expected_output = '{"status":"OK","dbconnection":"postgresql://user:password@localhost:5432/dbname","n_stations":253,"n_tags":50,"n_passes":1002}'
    actual_output, error, code = run_cli_command("se2412 healthcheck --format json")
    return compare_output(actual_output, expected_output), actual_output, expected_output, error

def test_resetpasses():
    expected_output = '{"status":"OK"}'
    actual_output, error, code = run_cli_command("se2412 resetpasses --format json")
    return compare_output(actual_output, expected_output), actual_output, expected_output, error

def test_resetstations():
    expected_output = '{"status":"OK"}'
    actual_output, error, code = run_cli_command("se2412 resetstations --format json")
    return compare_output(actual_output, expected_output), actual_output, expected_output, error

def test_toll_station_passes():
    expected_output = '{"stationID":"NAO01","stationOperator":"OperatorA","requestTimestamp":"2025-02-09 12:34","periodFrom":"20241101","periodTo":"20241130","nPasses":10,"passList":[{"passIndex":1,"passID":"P123","timestamp":"2024-11-01 08:00","tagID":"T001","tagProvider":"ProviderA","passType":"home","passCharge":2.5}]}'
    actual_output, error, code = run_cli_command("se2412 tollstationpasses --station NAO01 --from 20241101 --to 20241130 --format json")
    return compare_output(actual_output, expected_output), actual_output, expected_output, error

def test_pass_analysis():
    expected_output = '{"stationOpID":"TollOpA","tagOpID":"TagOpB","requestTimestamp":"2025-02-09 12:35","periodFrom":"20241101","periodTo":"20241130","nPasses":5,"passList":[{"passIndex":1,"passID":"P124","stationID":"ST01","timestamp":"2024-11-01 09:15","tagID":"T002","passCharge":3.0}]}'
    actual_output, error, code = run_cli_command("se2412 passanalysis --stationop TollOpA --tagop TagOpB --from 20241101 --to 20241130 --format json")
    return compare_output(actual_output, expected_output), actual_output, expected_output, error

def test_admin_addpasses():
    expected_output = '{"status":"OK"}'
    actual_output, error, code = run_cli_command("se2412 admin --addpasses --source ./newpasses.csv")
    return compare_output(actual_output, expected_output), actual_output, expected_output, error

# ----------------------------
#     ΕΚΤΕΛΕΣΗ ΟΛΩΝ ΤΩΝ ΤΕΣΤ
# ----------------------------

def run_all_tests():
    tests = {
        "Login": test_login,
        "Healthcheck": test_healthcheck,
        "Reset Passes": test_resetpasses,
        "Reset Stations": test_resetstations,
        "Toll Station Passes": test_toll_station_passes,
        "Pass Analysis": test_pass_analysis,
        "Admin Add Passes": test_admin_addpasses,
        "Logout": test_logout,
    }
    
    results = {}
    for test_name, test_func in tests.items():
        success, actual, expected, error = test_func()
        results[test_name] = {
            "Success": success,
            "Actual Output": actual,
            "Expected Output": expected,
            "Error": error,
        }
    
    return results

if __name__ == "__main__":
    test_results = run_all_tests()
    print(json.dumps(test_results, indent=4, ensure_ascii=False))
