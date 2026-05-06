import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

res = supabase.table("artists").select("id, name").ilike("name", "%sonet%").execute()
print("Artists %sonet%:")
for r in res.data:
    print(r)

res2 = supabase.table("artists").select("id, name").ilike("name", "%sonnet%").execute()
print("\nArtists %sonnet%:")
for r in res2.data:
    print(r)
    
res3 = supabase.table("songs").select("id, title, artist_id").eq("artist_id", 3031).execute()
print(f"\nSongs for Sonnet (ID 3031) - Count: {len(res3.data)}")
for r in res3.data:
    print(f"  {r['title']}")
