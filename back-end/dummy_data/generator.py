import csv
import random
import string
import hashlib
from collections import defaultdict, Counter

########################################
# 1. Generate Users with 4 Types
########################################
def generate_users():
    """
    - 40 normal users (type=0)
    - 10 operator users (type=1)
    - 10 analyst users (type=2)
    - 10 admin users (type=3)

    Returns a list of dict with:
      { "username": str, "password": str, "type": int }
    """
    user_type_counts = {
        0: 40,  # normal
        1: 10,  # operator
        2: 10,  # analyst
        3: 10   # admin
    }
    type_labels = {
        0: "normal",
        1: "operator",
        2: "analyst",
        3: "admin"
    }

    all_users = []
    for t, count in user_type_counts.items():
        for i in range(count):
            uname = f"{type_labels[t]}{i:04d}"
            pw_plain = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
            pw_hash = hashlib.sha256(pw_plain.encode()).hexdigest()
            all_users.append({
                "username": uname,
                "password": pw_hash,
                "type": t
            })
    return all_users

def save_users_csv(users, outfile="users.csv"):
    fieldnames = ["username", "password", "type"]
    with open(outfile, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(users)

########################################
# 2. Load Toll Station Data
########################################
def load_tollstations(tollstations_file="tollstations2024.csv"):
    """
    Reads tollstations2024.csv and returns a dict keyed by TollID:
      { 'price1': float, 'price2': float, 'price3': float, 'price4': float }
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
# 3. Infer Vehicle Type Based on Charge and Toll Station Prices
########################################
def infer_vehicle_type(charge, toll_info):
    """
    Compare charge to toll_info['price1'..'price4'].
    Return 'motorbike', 'sedan', 'bus', or 'truck'
    whichever is numerically closest.
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
# 4. Process Passes => Unique Transceivers with Vehicle Types
########################################
def load_passes_and_infer_transceivers(passes_file, station_map):
    """
    Reads passes-sample.csv and groups passes by (tagRef, tagHomeID).
    Infers vehicle types based on charges and toll station prices.
    
    Returns a dict:
      transceivers[(tagRef, tagHomeID)] = vehicle_type
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
    
    # Resolve final vehicle type for each transceiver by majority vote
    transceivers = {}
    for (tag_ref, tag_home_id), vehicle_types in trans_data.items():
        most_common_type, _ = Counter(vehicle_types).most_common(1)[0]
        transceivers[(tag_ref, tag_home_id)] = most_common_type

    return transceivers

########################################
# 5. Generate Vehicles and Transceivers with CHAR(6) License Plates
########################################
def create_license_plate():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def create_transceiver_id():
    return "TR" + ''.join(random.choices(string.digits, k=7))

def allocate_transceivers(transceivers, normal_users):
    """
    Allocates vehicles and transceivers to normal users.
    
    Returns two lists:
      - vehicles: list of dicts for vehicles.csv
      - transceivers: list of dicts for transceiver.csv
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
        # Assign a random normal user (allow up to 2 vehicles per user)
        eligible_users = [u for u in normal_users if user_vehicle_count[u["username"]] < 2]
        if not eligible_users:
            eligible_users = normal_users
        
        user = random.choice(eligible_users)
        user_vehicle_count[user["username"]] += 1

        # Create vehicle record
        license_plate = create_license_plate()
        license_year = random.randint(2010, 2025)
        model = random.choice(models_by_type[vehicle_type])
        
        vehicles.append({
            "license_plate": license_plate,
            "license_year": license_year,
            "type": vehicle_type,
            "model": model,
            "userid": user["username"]
        })

        # Create transceiver record
        transceiver_id = create_transceiver_id()
        balance = round(random.uniform(0.0, 100.0), 2)
        
        transceiver_records.append({
            "id": transceiver_id,
            "vehicleid": license_plate,
            "providerid": tag_home_id,
            "balance": balance,
            "active": True,
            "tagRef": tag_ref
        })

    return vehicles, transceiver_records

########################################
# Main Script Logic
########################################
def main():
    # Load Toll Stations Data
    station_map = load_tollstations("tollstations2024.csv")
    
    # Load Pass Data and Infer Transceivers with Vehicle Types
    transceivers = load_passes_and_infer_transceivers("passes-sample.csv", station_map)

    # Generate Users (40 normal users + others)
    all_users = generate_users()
    
    # Filter Normal Users (type=0) for Transceiver Allocation
    normal_users = [u for u in all_users if u["type"] == 0]

    # Allocate Vehicles and Transceivers to Normal Users
    vehicles, transceiver_records = allocate_transceivers(transceivers, normal_users)

    # Write CSV Files
    save_users_csv(all_users)
    
    write_csv(vehicles,
              ["license_plate", "license_year", "type", "model", "userid"],
              filename="vehicles.csv")
    
    write_csv(transceiver_records,
              ["id", "vehicleid", "providerid", "balance", "active", "tagRef"],
              filename="transceiver.csv")

def write_csv(data_list, fieldnames, filename):
    with open(filename, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data_list)

if __name__ == "__main__":
    main()
