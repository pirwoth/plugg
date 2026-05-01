import re
import asyncio
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
import config
import requests
from database import (
    upsert_artist, upsert_song, upsert_stats, update_artist_genre,
    upsert_playlist, upsert_playlist_stats,
    find_artist_by_name,
)


# ────────────────────────────────────────────────────────────
def is_dj_playlist(title: str) -> bool:
    """Return True if the title looks like a DJ mixtape rather than an artist single.

    Detection rules (any match = playlist):
      1. Starts with a 4-digit year           e.g. "2024 New Ugandan Mashup..."
      2. Contains 'mashup'                    case-insensitive
      3. Contains 'mixtape'                   case-insensitive
      4. Contains 'non stop' or 'nonstop'     case-insensitive
      5. Contains standalone ' mix ' word     e.g. "Afrobeats Mix 2023" (not 'remix')
    """
    t = title.strip()
    tl = t.lower()
    if re.match(r'^\d{4}\b', t):
        return True
    keywords = ['mashup', 'mixtape', 'non stop', 'nonstop']
    if any(kw in tl for kw in keywords):
        return True
    # standalone 'mix' — avoid matching 'remix'
    if re.search(r'\bmix\b', tl) and 'remix' not in tl:
        return True
    return False
# ────────────────────────────────────────────────────────────

if config.ENABLE_AI_GENRE:
    from google import genai
    # Global client for Gemini API
    gemini_client = genai.Client(api_key=config.GEMINI_API_KEY)
else:
    gemini_client = None

async def infer_genre(artist_name: str, bio: str, song_titles: list) -> str:
    """Uses Gemini to guess the genre of the artist based on their info."""
    if not config.ENABLE_AI_GENRE:
        return None
        
    prompt = f"""
    You are an expert music curator for a Ugandan West Nile music platform.
    Analyze this artist and classify their music into EXACTLY ONE of the following genres:
    Afrobeat, Gospel, Hip Hop, Dancehall, Reggae, Local Traditional, R&B, Zouk.
    
    Artist Name: {artist_name}
    Biography: {bio if bio else 'N/A'}
    Known Song Titles: {', '.join(song_titles) if song_titles else 'N/A'}
    
    If you are unsure, default to Afrobeat.
    Return ONLY the exact genre string from the list above, nothing else.
    """
    try:
        response = await gemini_client.aio.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        genre = response.text.strip()
        genre = re.sub(r'[^a-zA-Z& ]', '', genre).strip()
        return genre
    except Exception as e:
        print(f"      [AI Error] Could not infer genre: {e}")
        return None


async def scrape_artists_from_letter(letter: str, page):
    """Extract all artist names and profile URLs from a letter page."""
    url = f"{config.BASE_URL}/artistes/letter/{letter}.html"
    print(f"  🔤 Letter {letter.upper()}: {url}")

    await page.goto(url, wait_until='domcontentloaded', timeout=60000)
    try:
        await page.wait_for_selector('div.all-artistes', timeout=10000)
    except Exception:
        print(f"  No artists found for {letter.upper()}.")
        return []

    html = await page.content()
    soup = BeautifulSoup(html, 'html.parser')

    artists = []
    seen = set()
    artist_items = soup.select('div.all-artistes div.col-lg-3')

    for item in artist_items:
        link = item.select_one('h2 a')
        if not link:
            continue
        name = link.text.strip()
        href = link.get('href')
        if not name or not href:
            continue
        full_url = urljoin(config.BASE_URL, href)
        if full_url in seen:
            continue
        seen.add(full_url)
        img = item.select_one('img')
        image_url = img.get('src') if img else None
        artists.append({'name': name, 'url': full_url, 'image_url': image_url})
        print(f"      Found artist: {name}")

    print(f"  Total artists for {letter.upper()}: {len(artists)}")
    return artists


async def process_artists_batch(artists, browser):
    """Process a list of artists with limited concurrency."""
    semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_ARTISTS)

    async def sem_scrape(artist):
        async with semaphore:
            await scrape_artist_page(artist['url'], artist['name'], artist['image_url'], browser)

    print(f"  🚀 Processing {len(artists)} artists (Concurrency: {config.MAX_CONCURRENT_ARTISTS})...")
    tasks = [sem_scrape(artist) for artist in artists]
    await asyncio.gather(*tasks)


async def scrape_artist_page(artist_url: str, artist_name: str, artist_image_url: str, browser):
    """Open a new tab, scrape bio and all songs, then close."""
    context = await browser.new_context()
    page = await context.new_page()
    try:
        print(f"    🎤 {artist_name}")

        # Use domcontentloaded to avoid waiting for ads/images
        await page.goto(artist_url, wait_until='domcontentloaded', timeout=60000)

        # Wait for a heading that confirms page loaded
        try:
            await page.wait_for_selector(
                f'h1:has-text("{artist_name}"), h2:has-text("{artist_name}")',
                timeout=10000
            )
        except:
            await page.wait_for_selector('h1, h2', timeout=5000)

        html = await page.content()
        soup = BeautifulSoup(html, 'html.parser')

        # --- Biography ---
        bio = None
        bio_header = soup.find('h2', string='Biography')
        if bio_header:
            bio_paragraph = bio_header.find_next('p')
            if bio_paragraph:
                bio = bio_paragraph.text.strip()

        # --- Songs ---
        # Try multiple selectors — the site layout varies per artist page
        songs_container = None

        # Strategy 1: look for the "Artist Songs" heading and its sibling container
        songs_h1 = soup.find(['h1', 'h2'], string=re.compile(r'Artist\s+Songs', re.I))
        if songs_h1:
            songs_container = songs_h1.find_next_sibling('div', class_=re.compile(r'all-audios|col'))

        # Strategy 2: find any div that contains multiple audio links
        if not songs_container:
            for div in soup.find_all('div', class_=re.compile(r'all-audios|audio-list|songs')):
                if div.find('a', href=re.compile(r'/audio/\d+')):
                    songs_container = div
                    break

        # Collect all audio links — from container if found, else full page
        if songs_container:
            links = songs_container.find_all('a', href=re.compile(r'/audio/\d+'))
        else:
            links = soup.select('a[href*="/audio/"]')

        song_urls_seen = set()
        song_count = 0
        
        # Ensure artist exists in DB
        artist_id = upsert_artist(artist_name, bio, artist_image_url)
        extracted_song_titles = []

        for item in links:
            href = item.get('href')
            if not href:
                continue
                
            song_url = urljoin(config.BASE_URL, href)
            if not re.search(r'/audio/\d+', song_url):
                continue
            if 'download' in song_url.lower():
                continue
            if song_url in song_urls_seen:
                continue

            # Locate container
            container = item.find_parent('div', class_=re.compile(r'mst-trendin|col-xs-12|col-lg-2|col-lg-3|col-md-3'))
            if not container:
                container = item.find_parent('div')

            # Try to extract title from multiple possible structures
            title = None
            # Structure A: dedicated title div
            title_div = container.find('div', class_=re.compile(r'title|sng-title', re.I)) if container else None
            if title_div:
                a = title_div.find('a')
                title = (a or title_div).get_text(strip=True)
            # Structure B: h2/h3 inside container
            if not title and container:
                heading = container.find(['h2', 'h3'])
                if heading:
                    a = heading.find('a')
                    title = (a or heading).get_text(strip=True)
            # Structure C: the link text itself
            if not title:
                title = item.get_text(strip=True)
            
            if not title or title.lower() == 'download':
                continue
                
            extracted_song_titles.append(title)

            img = container.find('img') if container else None
            cover_url = img.get('src') if img else None
            if cover_url and cover_url.startswith('/'):
                cover_url = urljoin(config.BASE_URL, cover_url)

            # --- Stats ---
            stats_text = container.get_text() if container else ""
            plays_match = re.search(r'([\d,.]+[KMB]?)\s*plays?', stats_text, re.I)
            downloads_match = re.search(r'([\d,.]+[KMB]?)\s*downloads?', stats_text, re.I)

            plays = 0
            downloads = 0
            if plays_match:
                p = plays_match.group(1).replace(',', '')
                if 'K' in p:
                    plays = int(float(p.replace('K', '')) * 1000)
                elif 'M' in p:
                    plays = int(float(p.replace('M', '')) * 1000000)
                else:
                    plays = int(p)
            if downloads_match:
                d = downloads_match.group(1).replace(',', '')
                if 'K' in d:
                    downloads = int(float(d.replace('K', '')) * 1000)
                elif 'M' in d:
                    downloads = int(float(d.replace('M', '')) * 1000000)
                else:
                    downloads = int(d)

            # Store in DB — route to the right table
            if is_dj_playlist(title):
                rec_id = upsert_playlist(artist_id, title, cover_url, song_url)
                upsert_playlist_stats(rec_id, plays, downloads)
                print(f"      🎵 [PLAYLIST] {title} ({plays} plays)")
            else:
                rec_id = upsert_song(artist_id, title, cover_url, song_url)
                upsert_stats(rec_id, plays, downloads)
                print(f"      🎵 {title} ({plays} plays)")
            
            song_urls_seen.add(song_url)
            song_count += 1
            
        # Determine genre dynamically
        if config.ENABLE_AI_GENRE:
            guessed_genre = await infer_genre(artist_name, bio, extracted_song_titles)
            if guessed_genre:
                update_artist_genre(artist_id, guessed_genre)

    except Exception as e:
        print(f"    ❌ Error processing {artist_name}: {e}")
    finally:
        await page.close()
        await context.close()



def process_audio_card(container):
    """Parses a single audio card and saves it to the database.
    Returns the extracted song ID if successful.
    """
    link_elem = container.find('a', href=re.compile(r'/audio/\d+'))
    if not link_elem:
        return None
        
    href = link_elem.get('href')
    song_url = urljoin(config.BASE_URL, href)
    
    # Extract ID from URL
    id_match = re.search(r'/audio/(\d+)', song_url)
    song_id_int = int(id_match.group(1)) if id_match else None
    
    # Get image
    img = container.find('img')
    cover_url = img.get('src') if img else None
    if cover_url and cover_url.startswith('/'):
        cover_url = urljoin(config.BASE_URL, cover_url)
        
    # Title processing
    title_elem = container.find('div', class_=re.compile(r'other-sng-title|sng-title|title', re.I))
    if not title_elem:
        title_elem = container.find(['h2', 'h3'])
    
    title_text = ''
    if title_elem:
        h_link = title_elem.find('a')
        if h_link:
            title_text = h_link.text.strip()
        else:
            h2h3 = title_elem.find(['h2', 'h3'])
            title_text = h2h3.text.strip() if h2h3 else title_elem.text.strip()
    else:
        title_text = link_elem.text.strip()
        
    if not title_text:
        return song_id_int
        
    # Parse Artist and Song Name from title (format: "SongName - ArtistName")
    artist_name = "Unknown Artist"
    if "-" in title_text:
        parts = title_text.split("-", 1)
        artist_name = parts[1].strip()

    if not artist_name:
        artist_name = "Unknown Artist"

    # Fuzzy-match artist name to avoid duplicates
    normalised = re.sub(r'\s+', ' ', artist_name).strip()
    artist_id = find_artist_by_name(normalised)
    if not artist_id:
        artist_id = upsert_artist(normalised)

    # Stats
    stats_text = container.get_text()
    plays_match = re.search(r'([\d,.]+[KMB]?)\s*plays?', stats_text, re.I)
    downloads_match = re.search(r'([\d,.]+[KMB]?)\s*downloads?', stats_text, re.I)

    plays = 0
    downloads = 0
    if plays_match:
        p = plays_match.group(1).replace(',', '')
        if 'K' in p: plays = int(float(p.replace('K', '')) * 1000)
        elif 'M' in p: plays = int(float(p.replace('M', '')) * 1000000)
        else: plays = int(float(p))
    if downloads_match:
        d = downloads_match.group(1).replace(',', '')
        if 'K' in d: downloads = int(float(d.replace('K', '')) * 1000)
        elif 'M' in d: downloads = int(float(d.replace('M', '')) * 1000000)
        else: downloads = int(float(d))
        
    # Db integration
    try:
        if is_dj_playlist(title_text):
            rec_id = upsert_playlist(artist_id, title_text, cover_url, song_url)
            upsert_playlist_stats(rec_id, plays, downloads)
        else:
            song_id = upsert_song(artist_id, title_text, cover_url, song_url)
            upsert_stats(song_id, plays, downloads)
    except Exception as e:
        print(f"      ❌ Ghost sync error for {artist_name}: {e}")
        
    return song_id_int


async def scrape_newsongs_sequentially():
    """Extracts all songs using the moresongs.php AJAX endpoint."""
    print("🚀 Starting Chronological Deep Scrape...")
    
    # 1. Get initial last_loaded_id from /newsongs
    url = f"{config.BASE_URL}/newsongs"
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=config.HEADLESS)
        page = await browser.new_page()
        await page.goto(url, wait_until='domcontentloaded', timeout=60000)
        
        try:
            last_loaded_id_val = await page.input_value('#last_loaded_id')
        except:
            # Fallback if the input is not yet present
            await page.wait_for_selector('#last_loaded_id', timeout=10000)
            last_loaded_id_val = await page.input_value('#last_loaded_id')
            
        print(f"  Starting from ID: {last_loaded_id_val}")
        
        # Initial scrape of the first batch on the page
        html = await page.content()
        soup = BeautifulSoup(html, 'html.parser')
        containers = soup.find_all('div', class_=re.compile(r'col-lg-2|col-lg-3|col-md-3|col-sm-4'))
        for c in containers:
            process_audio_card(c)
            
        await browser.close()

    # 2. Loop through moresongs.php
    current_id = last_loaded_id_val
    total_new = 0
    
    while current_id:
        print(f"  📥 Fetching batch before ID {current_id}...")
        try:
            max_retries = 3
            response = None
            for attempt in range(max_retries):
                try:
                    response = requests.post(
                        f"{config.BASE_URL}/moresongs.php",
                        data={'last_loaded_id': current_id},
                        headers={'Content-Type': 'application/x-www-form-urlencoded', **config.HEADERS},
                        timeout=30
                    )
                    break
                except requests.exceptions.RequestException as e:
                    print(f"    ⚠️ Connection error on attempt {attempt+1}/{max_retries}: {e}")
                    if attempt == max_retries - 1:
                        raise
                    await asyncio.sleep(5 * (attempt + 1))
                    
            if not response or response.status_code != 200:
                status = response.status_code if response else 'Unknown'
                print(f"    ❌ Error: Server returned {status}")
                break
                
            batch_html = response.text
            if not batch_html.strip():
                print("    🏁 No more songs found.")
                break
                
            soup = BeautifulSoup(batch_html, 'html.parser')
            # The AJAX response might be just a list of items, not a full page
            potential_links = soup.find_all('a', href=re.compile(r'/audio/\d+'))
            if not potential_links:
                print("    🏁 No more audio cards found in response.")
                break

            # Find unique containers
            containers = []
            seen_containers = set()
            for l in potential_links:
                c = l.find_parent('div', class_=re.compile(r'col-lg-2|col-lg-3|col-md-3|col-sm-4'))
                if not c:
                    c = l.find_parent('div')
                if c and id(c) not in seen_containers:
                    containers.append(c)
                    seen_containers.add(id(c))

            batch_ids = []
            for c in containers:
                sid = process_audio_card(c)
                if sid:
                    batch_ids.append(sid)
            
            if not batch_ids:
                print("    🏁 No valid song IDs found in this batch.")
                break
                
            # Update current_id to the smallest ID found
            next_id = min(batch_ids)
            if next_id >= int(current_id):
                # This could happen if the batch only contains the same ID or if the server repeats data
                # We should stop to avoid infinite loops
                print(f"    ⚠️ Warning: ID did not decrease ({current_id} -> {next_id}). Breaking.")
                break
                
            current_id = str(next_id)
            total_new += len(batch_ids)
            print(f"    ✅ Batch processed. Next ID: {current_id}. Total so far: {total_new}")
            
            await asyncio.sleep(config.PAGE_DELAY)
            
        except Exception as e:
            print(f"    ❌ Request error: {e}")
            break
            
    print(f"🎉 Deep Scrape complete! Extracted {total_new} items.")


async def scrape_audios_from_letter(letter: str, page):
    """Fallback sweep to extract audios directly and implicitly create missing artists.
    Supports pagination via ?page=N.
    """
    total_count = 0
    for p_num in range(1, config.MAX_PAGES_PER_LETTER + 1):
        url = f"{config.BASE_URL}/audios/letter/{letter}.html?page={p_num}"
        print(f"  🎶 Audio Sweep {letter.upper()} (Page {p_num}): {url}")

        try:
            res = await page.goto(url, wait_until='domcontentloaded', timeout=60000)
            if res.status == 404:
                print(f"    No more pages for {letter.upper()}.")
                break
        except Exception as e:
            print(f"  Failed to load audios for {letter.upper()} P{p_num}: {e}")
            break

        html = await page.content()
        soup = BeautifulSoup(html, 'html.parser')
        
        songs = soup.find_all('div', class_='col-lg-2') or soup.find_all('div', class_='col-lg-3')
        if not songs:
            songs = soup.find_all('div', class_='col-md-3') or soup.find_all('div', class_='col-sm-4')
        
        if not songs:
            print(f"    No songs found on page {p_num}. Finishing sweep.")
            break
            
        print(f"      Matched {len(songs)} audio cards.")
        page_count = 0
        
        for container in songs:
            process_audio_card(container)
            page_count += 1
                
        total_count += page_count
        print(f"      ✅ Page {p_num} swept: {page_count} items. Total so far: {total_count}")
        
        # If we got significantly less than a full page (usually 100), we've reached the end
        if len(songs) < 50:
            break
            
        await asyncio.sleep(config.PAGE_DELAY)

    return total_count