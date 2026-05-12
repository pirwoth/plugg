import asyncio
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv("frontend/.env.local")
supabase = create_client(os.environ["VITE_SUPABASE_URL"], os.environ["VITE_SUPABASE_ANON_KEY"])

songs = supabase.table("songs").select("id, title, artist_id").order("id", desc=True).limit(5).execute()
print(f"Latest songs: {songs.data}")

for s in songs.data:
    artist = supabase.table("artists").select("id, name").eq("id", s['artist_id']).execute()
    print(f"Song {s['id']} ({s['title']}) belongs to artist: {artist.data}")

