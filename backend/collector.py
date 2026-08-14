import json
import os
from datetime import datetime

import requests


API_URL = "https://www.traintrackerus.com/api/amtrak/trains"

# Mohawk Subdivision bounding box
MIN_LAT = 42.90
MAX_LAT = 43.30
MIN_LON = -77.60
MAX_LON = -74.60

# Train numbers that travel eastbound on this route.
EASTBOUND = {
    "232",
    "234",
    "236",
    "238",
    "240",
    "244",
    "280",
    "284",
    "290",
    "48",
    "64",
    "68",
}


def get_train_status(stations):
    for station in stations:
        if station.get("status") != "Enroute":
            continue

        scheduled_time = station.get("schArr")
        predicted_time = station.get("arr")

        if not scheduled_time or not predicted_time:
            return "On Time"

        try:
            scheduled = datetime.fromisoformat(scheduled_time)
            predicted = datetime.fromisoformat(predicted_time)
            delay = (predicted - scheduled).total_seconds() / 60

            if delay >= 10:
                return f"{int(delay)} min Late"
            if delay >= 3:
                return "Slightly Late"
            if delay <= -3:
                return "Early"

        except ValueError:
            pass

        return "On Time"

    return "On Time"


print("Downloading train data...")

response = requests.get(API_URL, timeout=20)
response.raise_for_status()

api = response.json()
trains = []

for train_group in api.values():
    if not train_group:
        continue

    for train in train_group:
        lat = train.get("lat")
        lon = train.get("lon")

        if lat is None or lon is None:
            continue

        if not (
            MIN_LAT <= lat <= MAX_LAT
            and MIN_LON <= lon <= MAX_LON
        ):
            continue

        train_num = str(train.get("trainNum", ""))
        direction = "E" if train_num in EASTBOUND else "W"

        stations = train.get("stations", [])
        train_status = get_train_status(stations)

        completed = 0
        next_stop = "Unknown"

        for station in stations:
            station_status = str(
                station.get("status", "")
            ).lower()

            if station_status == "departed":
                completed += 1
                continue

            if next_stop == "Unknown":
                next_stop = station.get("name", "Unknown")

        print(
            f"Keeping Train {train_num} "
            f"({lat:.5f}, {lon:.5f}) "
            f"{direction}"
        )

        trains.append({
            "type": train.get("provider", "unknown").lower(),
            "trainNum": train_num,
            "route": train.get("routeName", "Unknown"),
            "provider": train.get("provider", "Unknown"),
            "direction": direction,
            "trainID": train.get("trainID"),
            "latitude": lat,
            "longitude": lon,
            "status": train_status,
            "completedStops": completed,
            "totalStops": len(stations),
            "nextStop": next_stop,
            "lastUpdate": datetime.now().strftime("%H:%M:%S")
        })

output = {
    "updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "count": len(trains),
    "trains": trains
}

project_root = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

output_path = os.path.join(
    project_root,
    "frontend",
    "data",
    "trains.json"
)

os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, "w", encoding="utf-8") as file:
    json.dump(output, file, indent=4)

print(f"\nSaved {len(trains)} trains.")