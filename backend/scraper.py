import re
import asyncio
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
import config
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
    import google.generativeai as genai
    genai.configure(api_key=config.GEMINI_API_KEY)

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
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = await model.generate_content_async(prompt)
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
            if song_count >= 50:
                break
                
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


async def process_artists_batch(artists, browser):
    """Process multiple artist pages concurrently."""
    semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_ARTISTS)

    async def process_one(artist):
        async with semaphore:
            await scrape_artist_page(artist['url'], artist['name'], artist['image_url'], browser)
            await asyncio.sleep(config.PAGE_DELAY)

    await asyncio.gather(*[process_one(a) for a in artists])

async def scrape_audios_from_letter(letter: str, page):
    """Fallback sweep to extract audios directly and implicitly create missing artists."""
    url = f"{config.BASE_URL}/audios/letter/{letter}.html"
    print(f"  🎶 Audio Sweep {letter.upper()}: {url}")

    try:
        res = await page.goto(url, wait_until='domcontentloaded', timeout=60000)
        if res.status == 404:
            return 0
    except Exception as e:
        print(f"  Failed to load audios for {letter.upper()}: {e}")
        return 0

    html = await page.content()
    soup = BeautifulSoup(html, 'html.parser')
    
    songs = soup.find_all('div', class_='col-lg-2') or soup.find_all('div', class_='col-lg-3')
    if not songs:
        songs = soup.find_all('div', class_='col-md-3') or soup.find_all('div', class_='col-sm-4')
    
    print(f"      Matched {len(songs)} audio cards.")
    count = 0
    
    for container in songs:
        link_elem = container.find('a', href=re.compile(r'/audio/\d+'))
        if not link_elem:
            continue
            
        href = link_elem.get('href')
        song_url = urljoin(config.BASE_URL, href)
        
        # Get image
        img = container.find('img')
        cover_url = img.get('src') if img else None
        if cover_url and cover_url.startswith('/'):
            cover_url = urljoin(config.BASE_URL, cover_url)
            
        # Title processing
        title_elem = container.find('div', class_=re.compile(r'other-sng-title'))
        if not title_elem:
            title_elem = container.find(['h2', 'h3'])
        
        title_text = ''
        if title_elem:
            h_link = title_elem.find('a')
            if h_link:
                title_text = h_link.text.strip()
            else:
                title_text = title_elem.find(['h2', 'h3']).text.strip() if title_elem.find(['h2', 'h3']) else title_elem.text.strip()
        else:
            title_text = link_elem.text.strip()
            
        if not title_text:
            continue
            
        # Parse Artist and Song Name from title (format: "SongName - ArtistName")
        song_name = title_text
        artist_name = "Unknown Artist"
        if "-" in title_text:
            parts = title_text.split("-", 1)
            song_name = parts[0].strip()
            artist_name = parts[1].strip()

        if not artist_name or len(artist_name) == 0:
            artist_name = "Unknown Artist"

        # Fuzzy-match artist name to avoid duplicates — normalise whitespace & case
        normalised = re.sub(r'\s+', ' ', artist_name).strip()
        existing_id = find_artist_by_name(normalised)
        if existing_id:
            artist_id = existing_id
        else:
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
            artist_id = upsert_artist(artist_name)
            if is_dj_playlist(title_text):
                rec_id = upsert_playlist(artist_id, title_text, cover_url, song_url)
                upsert_playlist_stats(rec_id, plays, downloads)
            else:
                song_id = upsert_song(artist_id, title_text, cover_url, song_url)
                upsert_stats(song_id, plays, downloads)
            count += 1
        except Exception as e:
            print(f"      ❌ Ghost sync error for {artist_name}: {e}")
            
    print(f"      ✅ Safely swept {count}/{len(songs)} into DB.")
    return count