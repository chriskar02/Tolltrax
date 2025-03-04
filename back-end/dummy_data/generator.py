import csv
import random
import string
import bcrypt
from collections import defaultdict, Counter

########################################
# 1. Generate Users with Specified Types
########################################

def generate_users():
    """
    Generates the following users:
      - 40 normal users (username: normal0000, normal0001, ...; type: "normal")
      - 10 operator users (username: e.g. NAO0000, EG0001, etc.; type is the chosen operator code)
      - 10 analyst users (username: analyst0000, analyst0001, ...; type: "analyst")
      - 1 admin user (username "admin", password "freepasses4all", type: "admin")
      
    Returns a list of dicts:
      { "username": str, "password": str (bcrypt hashed), "type": str }
    """
    user_type_counts = {
        "normal": 40,
        "operator": 10,
        "analyst": 10
    }
    
    all_users = []
    passwords_data = []
    
    # Predefined list of operator codes
    operator_codes = ["NAO", "EG", "AM", "KO", "NO", "OO"]
    
    for utype, count in user_type_counts.items():
        for i in range(count):
            if utype == "operator":
                op_code = random.choice(operator_codes)
                username = f"{op_code}{i:04d}"
                final_type = op_code
            else:
                username = f"{utype}{i:04d}"
                final_type = utype
            
            pw_plain = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
            pw_hash = bcrypt.hashpw(pw_plain.encode(), bcrypt.gensalt()).decode()
            
            all_users.append({
                "username": username,
                "password": pw_hash,
                "type": final_type
            })
            passwords_data.append({
                "username": username,
                "password": pw_plain
            })
    
    # Add the single admin user with fixed credentials.
    admin_username = "admin"
    admin_pw_plain = "freepasses4all"
    admin_pw_hash = bcrypt.hashpw(admin_pw_plain.encode(), bcrypt.gensalt()).decode()
    all_users.append({
        "username": admin_username,
        "password": admin_pw_hash,
        "type": "admin"
    })
    passwords_data.append({
        "username": admin_username,
        "password": admin_pw_plain
    })
    
    save_passwords_csv(passwords_data)
    return all_users

def save_users_csv(users, outfile="users.csv"):
    fieldnames = ["username", "password", "type"]
    with open(outfile, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(users)

def save_passwords_csv(passwords, outfile="passwords.csv"):
    fieldnames = ["username", "password"]
    with open(outfile, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(passwords)

########################################
# 2. Load Toll Station Data
########################################

def load_tollstations(tollstations_file="tollstations2024.csv"):
    """
    Reads tollstations2024.csv and returns a dictionary keyed by TollID:
      { TollID: {"price1": float, "price2": float, "price3": float, "price4": float} }
    """
    station_map = {}
    with open(tollstations_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            toll_id = row["TollID"].strip()
            station_map[toll_id] = {
                "price1": float(row["Price1"]),
                "price2": float(row["Price2"]),
                "price3": float(row["Price3"]),
                "price4": float(row["Price4"])
            }
    return station_map

########################################
# 3. Infer Vehicle Type Based on Charge and Toll Prices
########################################

def infer_vehicle_type(charge, toll_info):
    """
    Compare charge to toll_info prices.
    Returns one of: 'motorbike', 'sedan', 'bus', or 'truck' (the one with smallest difference).
    """
    mappings = [
        ("motorbike", toll_info["price1"]),
        ("sedan", toll_info["price2"]),
        ("bus", toll_info["price3"]),
        ("truck", toll_info["price4"])
    ]
    vehicle_type, _ = min(mappings, key=lambda m: abs(m[1] - charge))
    return vehicle_type

########################################
# 4. Process Passes to Infer Transceivers' Vehicle Type
########################################

def load_passes_and_infer_transceivers(passes_file, station_map):
    """
    Reads passes-sample.csv and groups passes by (tagRef, tagHomeID),
    inferring the vehicle type based on charge and toll prices.
    
    Returns a dictionary:
      { (tagRef, tagHomeID): vehicle_type }
    """
    trans_data = defaultdict(list)
    with open(passes_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            toll_id = row["tollID"].strip()
            tag_ref = row["tagRef"].strip()
            tag_home_id = row["tagHomeID"].strip()
            charge = float(row["charge"])
            if toll_id in station_map:
                toll_info = station_map[toll_id]
                vehicle_type = infer_vehicle_type(charge, toll_info)
                trans_data[(tag_ref, tag_home_id)].append(vehicle_type)
            else:
                print(f"Warning: TollID {toll_id} not found in tollstations.csv.")
    transceivers = {}
    for key, types in trans_data.items():
        most_common, _ = Counter(types).most_common(1)[0]
        transceivers[key] = most_common
    return transceivers

########################################
# 5. Generate Vehicles and Transceivers
########################################

def create_license_plate():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def create_transceiver_id():
    return "TR" + ''.join(random.choices(string.digits, k=7))

def allocate_transceivers(transceivers, normal_users):
    """
    Allocates vehicles and transceivers to normal users (each normal user may get up to 2 vehicles).
    
    Returns:
      vehicles: list of dicts to be saved as vehicles.csv
      transceiver_records: list of dicts to be saved as transceiver.csv
    """
    vehicles = []
    transceiver_records = []
    user_vehicle_count = {user["username"]: 0 for user in normal_users}
    
    models_by_type = {
        "motorbike": ["FastMoto", "CityRider", "SpeedX"],
        "sedan": ["FamilySedan", "EcoSedan", "LuxSedan"],
        "bus": ["CityBus", "MegaBus", "GlideBus"],
        "truck": ["HeavyTruck", "CargoMax", "RoadHauler"]
    }
    
    for (tag_ref, tag_home_id), vehicle_type in transceivers.items():
        eligible_users = [u for u in normal_users if user_vehicle_count[u["username"]] < 2]
        if not eligible_users:
            # Fallback if every normal user already has 2 vehicles.
            eligible_users = normal_users
        user = random.choice(eligible_users)
        user_vehicle_count[user["username"]] += 1
        
        license_plate = create_license_plate()
        license_year = random.randint(2010, 2025)
        model = random.choice(models_by_type.get(vehicle_type, ["GenericModel"]))
        
        vehicles.append({
            "license_plate": license_plate,
            "license_year": license_year,
            "type": vehicle_type,
            "model": model,
            "userid": user["username"]
        })
        
        balance = round(random.uniform(0.0, 100.0), 2)
        status = random.random() < 0.7
        transceiver_records.append({
            "id": tag_ref,
            "vehicleid": license_plate,
            "operatorid": tag_home_id,
            "balance": balance,
            "active": status
        })
    return vehicles, transceiver_records

########################################
# 6. Helper to Write CSV Files
########################################

def write_csv(data_list, fieldnames, filename):
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data_list)

########################################
# 7. Main Script Flow
########################################

def main():
    # Load toll station data.
    station_map = load_tollstations("tollstations2024.csv")
    # Process passes data to determine transceiver vehicle types.
    transceivers = load_passes_and_infer_transceivers("passes-sample.csv", station_map)
    # Generate users; note that normal users will have type "normal" (as a string).
    all_users = generate_users()
    # Filter normal users for transceiver allocation.
    normal_users = [u for u in all_users if u["type"] == "normal"]
    vehicles, transceiver_records = allocate_transceivers(transceivers, normal_users)
    
    # Write output CSV files.
    save_users_csv(all_users)
    write_csv(vehicles, ["license_plate", "license_year", "type", "model", "userid"], filename="vehicles.csv")
    write_csv(transceiver_records, ["id", "vehicleid", "operatorid", "balance", "active"], filename="transceiver.csv")

if __name__ == "__main__":
    main()
