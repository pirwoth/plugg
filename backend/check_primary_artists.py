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
    # Split by Ft, feat, featuring, x, with
    # Case insensitive, matching word boundaries
    parts = re.split(r'(?i:\b(ft\.?|feat\.?|featuring|x|with)\b)', name, 1)
    return parts[0].strip()

# Let's see what artists we have containing "sonet" or "sonnet" (case insensitive)
sonets = []
for r in res.data:
    n = r['name'].lower()
    if 'sonet' in n or 'sonne' in n:
        primary = extract_primary_artist(r['name'])
        print(f"ID: {r['id']}, Name: '{r['name']}', Primary: '{primary}'")

