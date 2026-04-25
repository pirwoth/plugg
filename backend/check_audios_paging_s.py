import requests
from bs4 import BeautifulSoup
url = 'https://www.westnilebiz.com/audios/letter/s.html'
res = requests.get(url)
soup = BeautifulSoup(res.text, 'html.parser')
pagination = soup.find('ul', class_='pagination')
if pagination:
    links = pagination.find_all('a')
    for l in links:
        print(l.text, l.get('href'))
else:
    print('No pagination found on S.')
