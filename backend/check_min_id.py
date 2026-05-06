import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

res = supabase.table("songs").select("page_url").execute()
ids = []
for r in res.data:
    url = r['page_url']
    import re
    m = re.search(r'/audio/(\d+)', url)
    if m:
        ids.append(int(m.group(1)))

print("Min ID in DB:", min(ids) if ids else None)
print("Max ID in DB:", max(ids) if ids else None)
