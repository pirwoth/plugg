import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

res = supabase.table("songs").select("*").ilike("title", "%tribute%").execute()
print("Songs with Tribute in title:")
for r in res.data:
    print(r)
