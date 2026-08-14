import json
import os
import subprocess
import sys
import time
from datetime import datetime


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

AMTRAK_COLLECTOR = os.path.join(BASE_DIR, "collector.py")

HERITAGE_FETCHER = os.path.join(
    BASE_DIR,
    "heritage",
    "fetcher.py"
)

HERITAGE_COLLECTOR = os.path.join(
    BASE_DIR,
    "heritage",
    "collector.py"
)

STATUS_FILE = os.path.join(
    BASE_DIR,
    "..",
    "frontend",
    "data",
    "update-status.json"
)

UPDATE_INTERVAL = 60


def run_script(name, script):
    print("\n===================================")
    print(name)
    print("===================================\n")

    result = subprocess.run([sys.executable, script])

    if result.returncode != 0:
        print(f"\nERROR: {name} failed.")
        return False

    return True


def write_status(status):
    os.makedirs(os.path.dirname(STATUS_FILE), exist_ok=True)

    payload = {
        "updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": status
    }

    with open(STATUS_FILE, "w", encoding="utf-8") as file:
        json.dump(payload, file, indent=4)

    print(f"\nUPDATE STATUS: {status}")
    print(payload["updated"])


while True:
    print("\n===================================")
    print("MOHAWK MAINLINE DATA UPDATE")
    print("===================================")

    success = run_script("AMTRAK UPDATE", AMTRAK_COLLECTOR)

    if success:
        success = run_script(
            "HERITAGE UNITS DOWNLOAD",
            HERITAGE_FETCHER
        )

    if success:
        success = run_script(
            "HERITAGE FREIGHT PROCESSING",
            HERITAGE_COLLECTOR
        )

    try:
        write_status("READY" if success else "FAILED")
    except Exception as error:
        print("\nERROR WRITING UPDATE STATUS:")
        print(error)

    print("\n===================================")
    print("UPDATE COMPLETE" if success else "UPDATE FAILED")
    print(f"Next update in {UPDATE_INTERVAL} seconds...")
    print("===================================\n")

    time.sleep(UPDATE_INTERVAL)