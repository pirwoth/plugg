import requests
from bs4 import BeautifulSoup
import re

url = "https://www.westnilebiz.com/newsongs"
headers = {'User-Agent': 'Mozilla/5.0'}
res = requests.get(url, headers=headers)
html = res.text
soup = BeautifulSoup(html, 'html.parser')
last_loaded_id_input = soup.find('input', id='last_loaded_id')
if last_loaded_id_input:
    print("last_loaded_id on page:", last_loaded_id_input.get('value'))

links = soup.find_all('a', href=lambda h: h and '/audio/' in h)
ids = []
for l in links:
    href = l.get('href')
    match = re.search(r'/audio/(\d+)', href)
    if match:
        ids.append(int(match.group(1)))

print("Min ID on page:", min(ids) if ids else None)
print("Max ID on page:", max(ids) if ids else None)
