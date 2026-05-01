import requests
from bs4 import BeautifulSoup
import re

url = "https://www.westnilebiz.com/artistes/letter/a.html"
res = requests.get(url)
soup = BeautifulSoup(res.text, 'html.parser')
artist_link = soup.select_one('div.all-artistes div.col-lg-3 h2 a')
if artist_link:
    print(f"Artist: {artist_link['href']}")
    artist_res = requests.get("https://www.westnilebiz.com" + artist_link['href'])
    artist_soup = BeautifulSoup(artist_res.text, 'html.parser')
    songs = artist_soup.find_all('a', href=re.compile(r'/audio/\d+'))
    print(f"Songs on page 1: {len(songs)}")
    
    pagination = artist_soup.find('ul', class_='pagination')
    if pagination:
        print("Pagination found!")
        print(pagination.text)
    else:
        print("No pagination found.")
