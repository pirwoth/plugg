import requests
from bs4 import BeautifulSoup
import re

url = "https://www.westnilebiz.com/audios/letter/a.html?page=1"
res = requests.get(url)
soup = BeautifulSoup(res.text, 'html.parser')
pagination = soup.find('ul', class_='pagination')
if pagination:
    links = pagination.find_all('a')
    pages = []
    for l in links:
        if l.text.strip().isdigit():
            pages.append(int(l.text.strip()))
    print("Max page for letter A:", max(pages) if pages else 1)
else:
    print("No pagination found.")
