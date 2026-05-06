import requests
from bs4 import BeautifulSoup
import re

url = "https://www.westnilebiz.com/moresongs.php"
headers = {'User-Agent': 'Mozilla/5.0'}

# ID 24927 should be returned when last_loaded_id is slightly higher.
current_id = 24930
res = requests.post(url, data={'last_loaded_id': current_id}, headers=headers)
soup = BeautifulSoup(res.text, 'html.parser')
links = soup.find_all('a', href=lambda h: h and '/audio/' in h)
for l in links:
    href = l.get('href')
    title = l.get_text(strip=True)
    if not title:
        # the title might be on the image or next element
        # the scraper gets title from the h6 element
        pass
    print(href)

