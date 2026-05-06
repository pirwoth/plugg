import re
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

res1 = supabase.table("artists").select("id, name").ilike("name", "%sonet%").execute()
res2 = supabase.table("artists").select("id, name").ilike("name", "%sonne%").execute()

data = res1.data + res2.data

def extract_primary_artist(name):
    parts = re.split(r'(?i:\b(?:ft\.?|feat\.?|featuring|x|with)\b)', name, 1)
    return parts[0].strip()

for r in data:
    primary = extract_primary_artist(r['name'])
    print(f"ID: {r['id']}, Name: '{r['name']}', Primary: '{primary}'")
