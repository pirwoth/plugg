import requests
from bs4 import BeautifulSoup
url = 'https://www.westnilebiz.com/audios/letter/w.html'
res = requests.get(url)
soup = BeautifulSoup(res.text, 'html.parser')
songs = soup.find_all('div', class_='col-lg-2') or soup.find_all('div', class_='col-lg-3')
if not songs:
    songs = soup.find_all('div', class_='col-md-3') or soup.find_all('div', class_='col-sm-4')

s = songs[0]
print(s.prettify())
