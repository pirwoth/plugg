import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

res = supabase.table("artists").select("*", count="exact").execute()
print(f"Total artists: {res.count}")

# Check recently added artists
res_recent = supabase.table("artists").select("name", "created_at").order("created_at", desc=True).limit(5).execute()
print(f"Recent artists: {res_recent.data}")
