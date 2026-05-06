import requests
from bs4 import BeautifulSoup
import re

url = "https://www.westnilebiz.com/audios/artist/24/luckydee"
res = requests.get(url)
soup = BeautifulSoup(res.text, 'html.parser')

links = soup.find_all('a', href=lambda h: h and '/audio/' in h)
print(f"Songs on artist page: {len(links)}")
for l in links:
    print(f"  {l.get_text(strip=True)} -> {l.get('href')}")
