import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

res = supabase.table("songs").select("id", count="exact").execute()
print(f"Total songs: {res.count}")

# Check for songs starting with Z (case insensitive)
res_z = supabase.table("songs").select("id", count="exact").ilike("title", "z%").execute()
print(f"Songs starting with Z: {res_z.count}")
