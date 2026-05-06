import requests
from bs4 import BeautifulSoup

url = "https://www.westnilebiz.com/audios/artist/24/luckydee"
res = requests.get(url)
soup = BeautifulSoup(res.text, 'html.parser')
# Let's just find the divs that contain the songs
items = soup.find_all('div', class_='col-sm-4') # Or whatever the class is
for i in items[:5]:
    print(i.get_text(strip=True)[:100])
