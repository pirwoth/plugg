import requests
from bs4 import BeautifulSoup

url = "https://www.westnilebiz.com/moresongs.php"
headers = {'User-Agent': 'Mozilla/5.0'}
current_id = 24930
res = requests.post(url, data={'last_loaded_id': current_id}, headers=headers)
soup = BeautifulSoup(res.text, 'html.parser')
containers = soup.find_all('div', class_='audio-card') # wait, what is the class in scraper.py?
# In scraper.py: containers = soup.find_all('div', class_=re.compile(r'col-lg-2|col-lg-3|col-md-3|col-sm-4'))
import re
containers = soup.find_all('div', class_=re.compile(r'col-lg-2|col-lg-3|col-md-3|col-sm-4'))
for c in containers:
    link = c.find('a', href=lambda h: h and '/audio/' in h)
    if link and '24927' in link.get('href'):
        title_tag = c.find(['h6', 'h5', 'h4', 'span'], class_=re.compile(r'title|name|text'))
        if title_tag:
            print("Title tag found:", title_tag.get_text(strip=True))
        else:
            print("No title tag found! HTML:", c.prettify())
