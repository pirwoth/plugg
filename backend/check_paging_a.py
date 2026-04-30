import requests
from bs4 import BeautifulSoup
url = 'https://www.westnilebiz.com/audios/letter/a.html'
res = requests.get(url)
soup = BeautifulSoup(res.text, 'html.parser')
print(f"Checking URL: {url}")
pagination = soup.find('ul', class_='pagination')
if pagination:
    links = pagination.find_all('a')
    for l in links:
        print(f"Text: {l.text.strip()}, Href: {l.get('href')}")
else:
    print('No pagination found.')

# Also check for any links that look like pagination but might not be in ul.pagination
all_links = soup.find_all('a', href=True)
page_links = [l for l in all_links if 'page' in l.get('href').lower() or '/audios/letter/' in l.get('href')]
print("\nPossible page links found:")
for l in page_links[:20]:
    print(f"Text: {l.text.strip()}, Href: {l.get('href')}")
