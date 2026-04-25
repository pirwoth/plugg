import asyncio
from playwright.async_api import async_playwright
import re

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://www.westnilebiz.com/", wait_until='domcontentloaded', timeout=60000)
        html = await page.content()
        with open("/home/sam/Documents/projects/plugg/backend/wnb_home.html", "w") as f:
            f.write(html)
        await browser.close()
        
        # Also grab an artist page to see if there's a timestamp
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://www.westnilebiz.com/artistes/letter/A.html", wait_until='domcontentloaded')
        # Wait, just test one artist
        await page.goto("https://www.westnilebiz.com/audio/2192", wait_until='domcontentloaded', timeout=60000)
        html2 = await page.content()
        with open("/home/sam/Documents/projects/plugg/backend/wnb_song.html", "w") as f:
            f.write(html2)
        await browser.close()

asyncio.run(main())
