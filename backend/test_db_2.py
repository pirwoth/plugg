import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

try:
    supabase = create_client(url, key)
    res = supabase.table("artists").select("*").limit(5).execute()
    print("Artists Count:", len(res.data))
    if len(res.data) > 0:
        print("First Artist:", res.data[0])
    else:
        print("Empty artists table!")

    res_songs = supabase.table("songs").select("*").limit(5).execute()
    print("Songs Count:", len(res_songs.data))
    if len(res_songs.data) > 0:
        print("First Song:", res_songs.data[0])
    
    res_stats = supabase.table("song_stats").select("*").limit(5).execute()
    print("Stats Count:", len(res_stats.data))
except Exception as e:
    print(f"Error connecting to supabase: {e}")
