import re
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

res = supabase.table("artists").select("id, name").execute()

def extract_primary_artist(name):
    # Split by Ft, feat, featuring, x, X, etc.
    name = re.split(r'\s+(?i:ft\.?|feat\.?|featuring|x|with)\s+', name)[0].strip()
    return name

count = 0
for r in res.data[:20]:
    primary = extract_primary_artist(r['name'])
    if primary != r['name']:
        print(f"Original: {r['name']}  ->  Primary: {primary}")
        count += 1

print(f"Sample count: {count}/20")
