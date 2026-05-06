import requests
from bs4 import BeautifulSoup
import re

url = "https://www.westnilebiz.com/moresongs.php"
headers = {'User-Agent': 'Mozilla/5.0'}

current_id = 25000
for i in range(10):
    res = requests.post(url, data={'last_loaded_id': current_id}, headers=headers)
    soup = BeautifulSoup(res.text, 'html.parser')
    links = soup.find_all('a', href=lambda h: h and '/audio/' in h)
    
    ids = []
    for l in links:
        match = re.search(r'/audio/(\d+)', l.get('href'))
        if match:
            ids.append(int(match.group(1)))
            
    ids = sorted(list(set(ids)), reverse=True)
    if not ids:
        print(f"[{current_id}] Returned NO IDs")
        break
        
    print(f"[{current_id}] Returned {len(ids)} unique IDs: {ids[0]} down to {ids[-1]}")
    current_id = ids[-1]
