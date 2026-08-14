import json
import os
import requests
from bs4 import BeautifulSoup
from datetime import datetime


# =========================================================
# PATHS
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

HERITAGE_OUTPUT = os.path.join(
    BASE_DIR,
    "..",
    "..",
    "frontend",
    "data",
    "heritage_raw.json"
)

HOME_URL = "https://heritageunits.com"
REPORT_URL = "https://heritageunits.com/home/reports/current/new"


# =========================================================
# HTTP SESSION
# =========================================================

session = requests.Session()

session.headers.update({
    "User-Agent": "Mozilla/5.0"
})


# =========================================================
# LOAD HOMEPAGE
# =========================================================

print()
print("===================================")
print("HERITAGE UNITS FETCHER")
print("===================================")

print()
print("Loading Heritage Units homepage...")

page = session.get(
    HOME_URL,
    timeout=20
)

print("Homepage status:", page.status_code)

page.raise_for_status()


# =========================================================
# FIND VERIFICATION TOKEN
# =========================================================

soup = BeautifulSoup(
    page.text,
    "html.parser"
)

token_element = soup.find(
    "input",
    {
        "name": "__RequestVerificationToken"
    }
)

if token_element is None:

    raise Exception(
        "Could not find Heritage Units verification token."
    )


token = token_element.get("value")


if not token:

    raise Exception(
        "Heritage Units verification token was empty."
    )


print("Verification token found.")


# =========================================================
# REQUEST HEADERS
# =========================================================

headers = {

    "RequestVerificationToken": token,

    "X-Requested-With":
        "XMLHttpRequest",

    "Content-Type":
        "application/json;charset=UTF-8",

    "Origin":
        "https://heritageunits.com",

    "Referer":
        "https://heritageunits.com/"

}


# =========================================================
# REQUEST PAYLOAD
# =========================================================

payload = {

    "group": -1,

    "userfavs": False,

    "railroad": -1

}


# =========================================================
# REQUEST CURRENT REPORTS
# =========================================================

print()
print("Requesting current Heritage reports...")

response = session.post(

    REPORT_URL,

    json=payload,

    headers=headers,

    timeout=20

)

print(
    "Reports status:",
    response.status_code
)

response.raise_for_status()


# =========================================================
# PARSE RESPONSE
# =========================================================

try:

    heritage_data = response.json()

except ValueError:

    print()
    print("Heritage Units returned invalid JSON.")
    print(response.text[:1000])

    raise


# =========================================================
# BASIC VALIDATION
# =========================================================

if not heritage_data.get("success"):

    raise Exception(
        "Heritage Units reported an unsuccessful request."
    )


message = heritage_data.get(
    "msg",
    {}
)

reports = message.get(
    "table",
    []
)

map_data = message.get(
    "map",
    []
)


print()
print(
    f"Reports received: {len(reports)}"
)

print(
    f"Map locations received: {len(map_data)}"
)


# =========================================================
# SAVE DATA
# =========================================================

output = {

    "updated":
        datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        ),

    "count":
        len(reports),

    "reports":
        reports,

    "raw":
        message

}


os.makedirs(

    os.path.dirname(
        HERITAGE_OUTPUT
    ),

    exist_ok=True

)


with open(

    HERITAGE_OUTPUT,

    "w",

    encoding="utf-8"

) as file:

    json.dump(

        output,

        file,

        indent=4

    )


# =========================================================
# COMPLETE
# =========================================================

print()
print("===================================")
print("Heritage Units download complete")
print("===================================")

print(
    "Saved:",
    HERITAGE_OUTPUT
)

print(
    "Reports:",
    len(reports)
)

print(
    "Map locations:",
    len(map_data)
)

print()