import json
import os
from datetime import datetime


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

HERITAGE_RAW = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "..",
    "frontend",
    "data",
    "heritage_raw.json"
)

FREIGHT_OUTPUT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "..",
    "frontend",
    "data",
    "freight.json"
)


# ---------------------------------------------------------
# MOHAWK SUBDIVISION BOUNDING BOX
# ---------------------------------------------------------

MIN_LAT = 42.90
MAX_LAT = 43.30

MIN_LON = -77.60
MAX_LON = -74.60


# ---------------------------------------------------------
# LOAD HERITAGE DATA
# ---------------------------------------------------------

print("Loading Heritage Units data...")

with open(
    HERITAGE_RAW,
    "r",
    encoding="utf-8"
) as file:

    heritage = json.load(file)


# Heritage response stores the actual API response
# inside the "raw" object.

raw = heritage.get("raw", {})


# Geographic reports are stored under raw["map"]

map_locations = raw.get("map", [])

print(
    f"Found {len(map_locations)} Heritage map locations."
)


# ---------------------------------------------------------
# COLLECT FREIGHT TRAINS
# ---------------------------------------------------------

freight_by_train = {}


for location in map_locations:

    name = location.get(
        "name",
        "Unknown"
    )

    lat = location.get("lat")
    lon = location.get("lon")


    # Skip locations without coordinates

    if lat is None or lon is None:
        continue


    # -----------------------------------------------------
    # MOHAWK SUBDIVISION FILTER
    # -----------------------------------------------------

    if not (
        MIN_LAT <= lat <= MAX_LAT
        and
        MIN_LON <= lon <= MAX_LON
    ):
        continue


    reports = location.get(
        "reports",
        []
    )


    if not reports:
        continue


    print(
        f"\nMohawk report: {name}"
    )


    # -----------------------------------------------------
    # PROCESS REPORTS
    # -----------------------------------------------------

    for report in reports:

        train_name = report.get("train")


        # Heritage sometimes reports a locomotive
        # without a train assignment.

        if not train_name:
            continue


        train_name = str(
            train_name
        ).strip()


        if not train_name:
            continue


        # -------------------------------------------------
        # DIRECTION
        # -------------------------------------------------

        direction = str(
            report.get(
                "direction",
                ""
            )
        ).strip()


        direction_lower = direction.lower()


        if direction_lower == "east":

            direction_code = "E"


        elif direction_lower == "west":

            direction_code = "W"


        else:

            direction_code = "Unknown"


        # -------------------------------------------------
        # LOCOMOTIVE
        # -------------------------------------------------

        locomotive = report.get(
            "loco",
            "Unknown"
        )


        # -------------------------------------------------
        # DETERMINE RAILROAD
        # -------------------------------------------------

        train_upper = train_name.upper()


        if train_upper.startswith("CSX"):

            provider = "CSX"


        elif train_upper.startswith("NS"):

            provider = "Norfolk Southern"


        elif train_upper.startswith("CN"):

            provider = "Canadian National"


        elif train_upper.startswith("CP"):

            provider = "Canadian Pacific"


        else:

            provider = "Freight"


        # -------------------------------------------------
        # CREATE TRAIN
        # -------------------------------------------------

        if train_name not in freight_by_train:

            freight_by_train[train_name] = {

                "type": "freight",

                "trainNum": train_name,

                "route": train_name,

                "provider": provider,

                "direction": direction_code,

                "latitude": lat,

                "longitude": lon,

                "location": name,

                "locomotives": [],

                "spottedOn": report.get(
                    "spottedOn"
                ),

                "source": "Heritage Units",

                "lastUpdate": datetime.now().strftime(
                    "%H:%M:%S"
                )

            }


        # -------------------------------------------------
        # GET TRAIN
        # -------------------------------------------------

        train = freight_by_train[
            train_name
        ]


        # -------------------------------------------------
        # UPDATE LOCATION
        # -------------------------------------------------

        train["latitude"] = lat

        train["longitude"] = lon

        train["location"] = name


        # -------------------------------------------------
        # UPDATE REPORT TIME
        # -------------------------------------------------

        if report.get("spottedOn") is not None:

            train["spottedOn"] = report.get(
                "spottedOn"
            )


        # -------------------------------------------------
        # UPDATE DIRECTION
        # -------------------------------------------------

        if direction_code in (
            "E",
            "W"
        ):

            train["direction"] = direction_code


        # -------------------------------------------------
        # ADD LOCOMOTIVE
        # -------------------------------------------------

        if locomotive not in train[
            "locomotives"
        ]:

            train[
                "locomotives"
            ].append(
                locomotive
            )


        print(
            f"  Keeping {train_name} "
            f"{direction_code} "
            f"{locomotive}"
        )


# ---------------------------------------------------------
# CONVERT TO LIST
# ---------------------------------------------------------

trains = list(
    freight_by_train.values()
)


# ---------------------------------------------------------
# OUTPUT
# ---------------------------------------------------------

output = {

    "updated": datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    ),

    "count": len(trains),

    "trains": trains

}


# ---------------------------------------------------------
# WRITE FREIGHT.JSON
# ---------------------------------------------------------

os.makedirs(
    os.path.dirname(
        FREIGHT_OUTPUT
    ),
    exist_ok=True
)


with open(
    FREIGHT_OUTPUT,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        output,
        file,
        indent=4
    )


# ---------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------

print()

print(
    "==================================="
)

print(
    "Heritage freight collection complete"
)

print(
    "==================================="
)


for train in trains:

    print(
        f"{train['trainNum']} "
        f"{train['direction']} "
        f"@ {train['location']} "
        f"({len(train['locomotives'])} locomotives)"
    )


print()

print(
    f"Saved {len(trains)} freight trains."
)

print(
    f"Output: {FREIGHT_OUTPUT}"
)