import asyncio
import config
from scraper import scrape_artists_from_letter, process_artists_batch, scrape_audios_from_letter, scrape_newsongs_sequentially

async def main():
    for letter in config.LETTERS:
        print(f"\n🔤 Letter '{letter.upper()}'")
        artists = await scrape_artists_from_letter(letter)
        print(f"  Found {len(artists)} artists.")

        if artists:
            await process_artists_batch(artists)
            
        print(f"  🎵 Starting Audio sweep for '{letter.upper()}'")
        await scrape_audios_from_letter(letter)

        await asyncio.sleep(1)

    print("\n🚀 Starting Deep Scrape for all remaining songs...")
    await scrape_newsongs_sequentially()

    print("\n🎉 Full migration complete!")

if __name__ == "__main__":
    asyncio.run(main())