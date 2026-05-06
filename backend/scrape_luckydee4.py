import requests
from bs4 import BeautifulSoup
import re

url = "https://www.westnilebiz.com/audios/artist/24/luckydee"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
res = requests.get(url, headers=headers)
soup = BeautifulSoup(res.text, 'html.parser')

links = soup.find_all('a', href=lambda h: h and '/audio/' in h)
print(f"Songs on artist page: {len(links)}")
for l in links:
    print(f"  {l.get_text(strip=True)} -> {l.get('href')}")
