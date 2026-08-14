import requests
from bs4 import BeautifulSoup

session = requests.Session()

headers = {
    "User-Agent": "Mozilla/5.0"
}

print("Loading Heritage Units homepage...")

page = session.get(
    "https://heritageunits.com",
    headers=headers
)

print("Status:", page.status_code)

soup = BeautifulSoup(page.text, "html.parser")

token = soup.find(
    "input",
    {"name": "__RequestVerificationToken"}
)

if token is None:
    raise Exception("Couldn't find verification token.")

token = token["value"]

print("Token found!")
print(token[:40] + "...")

headers.update({
    "RequestVerificationToken": token,
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json;charset=UTF-8",
    "Origin": "https://heritageunits.com",
    "Referer": "https://heritageunits.com/"
})

payload = {
    "group": -1,
    "userfavs": False,
    "railroad": -1
}

print("Requesting current reports...")

response = session.post(
    "https://heritageunits.com/home/reports/current/new",
    json=payload,
    headers=headers
)

print("Status:", response.status_code)

print(response.text[:500])