import requests
from bs4 import BeautifulSoup
import re

url = "https://www.westnilebiz.com/moresongs.php"
headers = {'User-Agent': 'Mozilla/5.0'}

current_id = 25910
for i in range(5):
    res = requests.post(url, data={'last_loaded_id': current_id}, headers=headers)
    soup = BeautifulSoup(res.text, 'html.parser')
    links = soup.find_all('a', href=lambda h: h and '/audio/' in h)
    ids = []
    for l in links:
        match = re.search(r'/audio/(\d+)', l.get('href'))
        if match:
            ids.append(int(match.group(1)))
    
    if not ids:
        print(f"No IDs returned for last_loaded_id={current_id}")
        break
    
    min_id = min(ids)
    print(f"last_loaded_id={current_id} -> returned {len(ids)} links, min ID: {min_id}, max ID: {max(ids)}")
    
    if min_id >= current_id:
        print("BREAK CONDITION MET!")
        break
        
    current_id = min_id

