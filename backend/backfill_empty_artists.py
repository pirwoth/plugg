"""
backfill_empty_artists.py
─────────────────────────
Re-scrapes ONLY the artists who are in the DB but have no songs yet.
Much faster than a full re-run — only visits the pages that failed before.

Run:  python backfill_empty_artists.py
"""

import asyncio
import re
from dotenv import load_dotenv
load_dotenv()

from playwright.async_api import async_playwright
import config
from database import supabase
from scraper import scrape_artist_page

ARTIST_BASE = "https://www.westnilebiz.com"


async def get_empty_artists():
    """Return list of (id, name, image_url, profile_url) for artists with no songs."""
    artists_res = supabase.table("artists").select("id, name, image_url, slug").execute()
    songs_res   = supabase.table("songs").select("artist_id").execute()
    pl_res      = supabase.table("playlists").select("artist_id").execute()

    has_content = (
        {s["artist_id"] for s in songs_res.data} |
        {p["artist_id"] for p in pl_res.data}
    )

    empty = [a for a in artists_res.data if a["id"] not in has_content]
    print(f"Artists with no content: {len(empty)} / {len(artists_res.data)}")
    return empty


def artist_to_url(artist: dict) -> str:
    """Derive the westnilebiz profile URL from slug or name."""
    # Try slug first
    slug = artist.get("slug") or re.sub(r"[\W_]+", "-", artist["name"].lower()).strip("-")
    return f"{ARTIST_BASE}/artiste/{slug}.html"


async def main():
    empty = await get_empty_artists()
    if not empty:
        print("✅ All artists already have songs. Nothing to backfill.")
        return

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=config.HEADLESS)
        semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_ARTISTS)

        async def process_one(artist):
            async with semaphore:
                url = artist_to_url(artist)
                print(f"  🔄 Backfilling: {artist['name']}  →  {url}")
                try:
                    await scrape_artist_page(
                        url,
                        artist["name"],
                        artist.get("image_url", ""),
                        browser
                    )
                except Exception as e:
                    print(f"    ❌ Failed {artist['name']}: {e}")
                await asyncio.sleep(config.PAGE_DELAY)

        # Process in batches
        BATCH = 20
        for i in range(0, len(empty), BATCH):
            batch = empty[i : i + BATCH]
            print(f"\n📦 Batch {i // BATCH + 1} — {len(batch)} artists")
            await asyncio.gather(*[process_one(a) for a in batch])

        await browser.close()

    print("\n🎉 Backfill complete!")

    # Print final stats
    songs_after  = supabase.table("songs").select("id", count="exact").execute()
    pl_after     = supabase.table("playlists").select("id", count="exact").execute()
    print(f"   Songs:     {songs_after.count}")
    print(f"   Playlists: {pl_after.count}")

if __name__ == "__main__":
    asyncio.run(main())
