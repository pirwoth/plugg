import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

res = supabase.table("artists").select("*").eq("name", "A Face").execute()
print("A Face Data:", res.data)

if res.data:
    artist_id = res.data[0]['id']
    res_songs = supabase.table("songs").select("*").eq("artist_id", artist_id).execute()
    print("A Face Songs:", len(res_songs.data))
    for s in res_songs.data:
        print(s['title'], s['cover_url'])
        res_st = supabase.table("song_stats").select("*").eq("song_id", s['id']).execute()
        print("  Stats:", res_st.data)
