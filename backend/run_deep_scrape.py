import asyncio
from scraper import scrape_newsongs_sequentially

if __name__ == "__main__":
    asyncio.run(scrape_newsongs_sequentially())
