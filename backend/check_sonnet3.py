import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

res = supabase.table("songs").select("id, title, artist_id").ilike("title", "%after party%").execute()
for r in res.data:
    print(r)
    
res2 = supabase.table("songs").select("id, title, artist_id").ilike("title", "%loco%").execute()
for r in res2.data:
    print(r)
