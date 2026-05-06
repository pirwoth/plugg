import requests
from bs4 import BeautifulSoup
import re

url = "https://www.westnilebiz.com/moresongs.php"
headers = {'User-Agent': 'Mozilla/5.0'}

# We simulate the loop
current_id = 29387
print("Calling with ID:", current_id)
res = requests.post(url, data={'last_loaded_id': current_id}, headers=headers)
html = res.text
soup = BeautifulSoup(html, 'html.parser')
links = soup.find_all('a', href=lambda h: h and '/audio/' in h)
ids = []
for l in links:
    href = l.get('href')
    match = re.search(r'/audio/(\d+)', href)
    if match:
        ids.append(int(match.group(1)))

print("Min ID returned:", min(ids) if ids else None)
print("Max ID returned:", max(ids) if ids else None)
