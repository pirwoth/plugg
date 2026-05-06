import requests
from bs4 import BeautifulSoup
import re

url = "https://www.westnilebiz.com/audios/letter/a.html"
res = requests.get(url)
soup = BeautifulSoup(res.text, 'html.parser')

songs = soup.find_all('div', class_=re.compile(r'col-lg-2|col-lg-3|col-md-3|col-sm-4'))
print("Songs found on page 1:", len(songs))
