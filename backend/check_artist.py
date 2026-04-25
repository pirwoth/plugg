import asyncio
from bs4 import BeautifulSoup
from functools import partial
import urllib.request
import re

req = urllib.request.Request("https://www.westnilebiz.com/artist/8/2thanks", headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read()
        soup = BeautifulSoup(html, 'html.parser')
        
        songs_h1 = soup.find(['h1', 'h2'], string=re.compile(r'Artist\s+Songs', re.I))
        links = []
        if songs_h1:
            container = songs_h1.find_next_sibling('div', class_=re.compile(r'all-audios'))
            if container:
                links = container.find_all('a', href=re.compile(r'/audio/\d+'))
        
        if not links:
            links = soup.select('a[href*="/audio/"]')
            
        print("Total audio links found:", len(links))
        for link in links:
             print(link.get('href'))
except Exception as e:
    print(e)
