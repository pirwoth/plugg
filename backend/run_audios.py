import asyncio
from playwright.async_api import async_playwright
import config
from scraper import scrape_audios_from_letter

async def main():
    print("🚀 Starting Global Audio Index Sweep")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=config.HEADLESS)
        main_page = await browser.new_page()

        for letter in config.LETTERS:
            print(f"\n🎵 Ghost Sweeping Letter '{letter.upper()}'")
            await scrape_audios_from_letter(letter, main_page)
            await asyncio.sleep(1)

        await main_page.close()
        await browser.close()

    print("\n🎉 Full Audio Sweep Complete!")

if __name__ == "__main__":
    asyncio.run(main())
