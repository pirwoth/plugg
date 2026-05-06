import requests
from bs4 import BeautifulSoup
from scraper import process_audio_card

html = """
<div class="col-lg-3 col-xs-12" style="margin-bottom: 5px">
 <div class="row">
  <div class="col-lg-12 col-xs-3">
   <a href="https://www.westnilebiz.com/audio/24927/tribute">
    <img alt="Tribute" class="img img-responsive" src="https://www.westnilebiz.com/images/artists/thumbs/1ff1de774005f8da13f42943881c655f.jpg" title="Tribute"/>
   </a>
  </div>
  <div class="col-lg-12 col-xs-9">
   <div class="other-sng-title">
    <h2>
     <a href="https://www.westnilebiz.com/audio/24927/tribute">
      Tribute - Lucky Dee
     </a>
    </h2>
    <p style="font-size: 11px;font-family: 'roboto',sans-serif;margin-top: 6px;color: #ed2542;">
     13544 plays | 21809 Downloads
    </p>
   </div>
  </div>
 </div>
</div>
"""
soup = BeautifulSoup(html, 'html.parser')
container = soup.find('div', class_='col-lg-3')
id_val = process_audio_card(container)
print("Returned ID:", id_val)
