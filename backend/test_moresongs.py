import requests
import json
from bs4 import BeautifulSoup

url = "https://www.westnilebiz.com/moresongs.php"
headers = {'User-Agent': 'Mozilla/5.0'}

# Let's test with a known ID to see what we get
res = requests.post(url, data={'last_loaded_id': 50000}, headers=headers)
print("Status:", res.status_code)
html = res.text
soup = BeautifulSoup(html, 'html.parser')
links = soup.find_all('a', href=lambda h: h and '/audio/' in h)
ids = []
for l in links:
    href = l.get('href')
    import re
    match = re.search(r'/audio/(\d+)', href)
    if match:
        ids.append(int(match.group(1)))

print("Found IDs:", ids)
print("Min ID:", min(ids) if ids else None)
print("Max ID:", max(ids) if ids else None)
