import asyncio
from playwright.async_api import async_playwright
import config
from scraper import scrape_artists_from_letter, process_artists_batch, scrape_audios_from_letter

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=config.HEADLESS)
        main_page = await browser.new_page()

        for letter in config.LETTERS:
            print(f"\n🔤 Letter '{letter.upper()}'")
            artists = await scrape_artists_from_letter(letter, main_page)
            print(f"  Found {len(artists)} artists.")

            if artists:
                await process_artists_batch(artists, browser)
                
            print(f"  🎵 Starting Audio sweep for '{letter.upper()}'")
            await scrape_audios_from_letter(letter, main_page)

            await asyncio.sleep(1)

        await main_page.close()
        await browser.close()

    print("\n🎉 Full migration complete!")

if __name__ == "__main__":
    asyncio.run(main())