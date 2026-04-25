import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

res = supabase.table("artists").select("*").limit(5).execute()
print("Artists:", res.data)

res_songs = supabase.table("songs").select("*").limit(5).execute()
print("Songs:", res_songs.data)
