import requests
from bs4 import BeautifulSoup

url = "https://www.westnilebiz.com/audios/artist/24/luckydee"
res = requests.get(url)
soup = BeautifulSoup(res.text, 'html.parser')
body = soup.find('body')
if body:
    print(body.get_text(strip=True)[:500])
else:
    print("No body found.")
