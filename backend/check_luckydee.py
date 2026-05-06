import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

res = supabase.table("artists").select("id, name").ilike("name", "%lucky%").execute()
print("Artists matching %lucky%:")
for r in res.data:
    print(r)

res2 = supabase.table("songs").select("id, title, artist_id").eq("artist_id", 19).execute()
print(f"\nSongs for Lucky Dee (ID 19) - Count: {len(res2.data)}")
for r in res2.data:
    print(f"  {r['title']}")
