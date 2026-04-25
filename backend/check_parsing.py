from bs4 import BeautifulSoup
import re
import urllib.request
from urllib.parse import urljoin

req = urllib.request.Request("https://www.westnilebiz.com/artist/62/ashankilla", headers={'User-Agent': 'Mozilla/5.0'})
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
            
        song_urls_seen = set()
        
        for item in links:
            href = item.get('href')
            if not href: continue
            song_url = urljoin("https://www.westnilebiz.com", href)
            if not re.search(r'/audio/\d+', song_url): continue
            if 'download' in song_url.lower(): continue
            if song_url in song_urls_seen: continue
            
            container = item.find_parent('div', class_=re.compile(r'mst-trendin|col-xs-12'))
            if not container:
                container = item.find_parent('div')
            
            title_elem = container.find(['h2', 'h3']) if container else None
            title_a = title_elem.find('a') if title_elem else item
            title = title_a.text.strip() if title_a else item.text.strip()
            if not title or title.lower() == 'download':
                continue
                
            stats_text = container.get_text() if container else ""
            plays_match = re.search(r'([\d,.]+[KMB]?)\s*plays?', stats_text, re.I)
            plays = plays_match.group(1) if plays_match else "0"
                
            print(f"FOUND SONG: {title} | {song_url} | Plays: {plays}")
            song_urls_seen.add(song_url)
            
except Exception as e:
    print(e)
