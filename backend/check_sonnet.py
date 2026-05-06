import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

res = supabase.table("artists").select("id, name").ilike("name", "%sonet%").execute()
print("Artists matching %sonet%:")
for r in res.data:
    print(f"ID: {r['id']}, Name: {r['name']}")

res2 = supabase.table("artists").select("id, name").ilike("name", "%sonnet%").execute()
print("\nArtists matching %sonnet%:")
for r in res2.data:
    print(f"ID: {r['id']}, Name: {r['name']}")
