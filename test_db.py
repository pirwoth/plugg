import asyncio
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv("frontend/.env.local")
supabase = create_client(os.environ["VITE_SUPABASE_URL"], os.environ["VITE_SUPABASE_ANON_KEY"])

response = supabase.table("songs").select("title, artist_id").limit(5).execute()
print(f"Sample songs: {response.data}")

# check an artist
artists = supabase.table("artists").select("id, name").limit(1).execute()
print(f"Sample artist: {artists.data}")

if artists.data:
    aid = artists.data[0]['id']
    s = supabase.table("songs").select("*").eq("artist_id", aid).execute()
    print(f"Songs for {aid}: {len(s.data)}")
