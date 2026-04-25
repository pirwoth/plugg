import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin

with open("damavlous.html", "r") as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
songs_header = soup.find('h2', string=re.compile(r'Artist\s+Songs', re.I))
links = []
if songs_header:
    current = songs_header.find_next()
    while current and current.name != 'h2':
        for link in current.find_all('a', href=re.compile(r'/audio/\d+')):
            links.append(link)
        current = current.find_next()

song_urls_seen = set()
for item in links:
    href = item.get('href')
    song_url = urljoin("http://westnilebiz.com", href)
    if not re.search(r'/audio/\d+', song_url): continue
    if song_url in song_urls_seen: continue
    
    container = item.find_parent('div', class_=re.compile(r'mst-trendin|col-xs-12'))
    if not container: container = item.find_parent('div')
    
    title_elem = container.find(['h2']) if container else None
    title = title_elem.text.strip() if title_elem else item.text.strip()
    
    img = container.find('img') if container else None
    cover = img.get('src') if img else None
    
    stats_text = container.get_text() if container else ""
    plays_m = re.search(r'([\d,]+)\s*plays', stats_text, re.I)
    dls_m = re.search(r'([\d,]+)\s*downloads', stats_text, re.I)
    plays = plays_m.group(1) if plays_m else "0"
    dls = dls_m.group(1) if dls_m else "0"
    
    print(f"Title: {title}\nURL: {song_url}\nCover: {cover}\nPlays: {plays}, DLs: {dls}\n")
    song_urls_seen.add(song_url)

