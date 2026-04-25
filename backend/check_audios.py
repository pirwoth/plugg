import requests
from bs4 import BeautifulSoup
url = 'https://www.westnilebiz.com/audios/letter/w.html'
res = requests.get(url)
soup = BeautifulSoup(res.text, 'html.parser')
songs = soup.find_all('div', class_='col-lg-2') or soup.find_all('div', class_='col-lg-3')
if not songs:
    songs = soup.find_all('div', class_='col-md-3') or soup.find_all('div', class_='col-sm-4')
print(f'Found {len(songs)} song containers.')
for s in songs[:3]:
    print('---')
    print(s.get_text(strip=True))
    a = s.find('a')
    if a:
        print('Link:', a.get('href'))
