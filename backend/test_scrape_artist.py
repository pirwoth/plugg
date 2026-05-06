import asyncio
from playwright.async_api import async_playwright
from scraper import scrape_artist_page, gemini_client
import config

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Using a dummy image and name just to test song extraction
        await scrape_artist_page("https://www.westnilebiz.com/audios/artist/24/luckydee", "Lucky Dee", "", browser)
        await browser.close()

asyncio.run(test())
