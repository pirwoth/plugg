import asyncio
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv("frontend/.env.local")
supabase = create_client(os.environ["VITE_SUPABASE_URL"], os.environ["VITE_SUPABASE_ANON_KEY"])

artists = supabase.table("artists").select("id, name").order("id", desc=True).limit(5).execute()
print(f"Latest artists: {artists.data}")

for a in artists.data:
    songs = supabase.table("songs").select("id").eq("artist_id", a['id']).execute()
    print(f"Artist {a['id']} ({a['name']}): {len(songs.data)} songs")
