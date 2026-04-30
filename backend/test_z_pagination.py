import asyncio
from playwright.async_api import async_playwright
import config
from scraper import scrape_audios_from_letter

async def test_z():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=config.HEADLESS)
        page = await browser.new_page()
        
        print("Testing letter X with pagination...")
        count = await scrape_audios_from_letter('x', page)
        print(f"\nFinal count for Z: {count}")
        
        await page.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_z())
