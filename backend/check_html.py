from bs4 import BeautifulSoup
import urllib.request
import re

req = urllib.request.Request(
    "https://www.westnilebiz.com/audio/1763", headers={"User-Agent": "Mozilla/5.0"}
)
try:
    with urllib.request.urlopen(req) as response:
        html = response.read()
        soup = BeautifulSoup(html, "html.parser")
        print("====== AUDIO PAGE ======")
        print(soup.get_text()[:2000])

        # Look for dates
        print("====== FINIDING DATES ======")
        date_pattern = re.compile(r"(uploaded|date|added|released).*?\n", re.I)
        for d in soup.find_all(string=date_pattern):
            print(d.strip())
except Exception as e:
    print(e)
