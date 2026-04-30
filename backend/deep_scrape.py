import asyncio
from scraper import scrape_newsongs_sequentially

async def main():
    print("🚀 Initializing Deep Scraper...")
    await scrape_newsongs_sequentially()
    print("\n🎉 Deep Scrape Execution Finished!")

if __name__ == "__main__":
    asyncio.run(main())
