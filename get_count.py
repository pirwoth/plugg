import asyncio
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv("frontend/.env.local")
supabase = create_client(os.environ["VITE_SUPABASE_URL"], os.environ["VITE_SUPABASE_ANON_KEY"])

response = supabase.table("songs").select("id", count="exact").limit(1).execute()
print(f"Total songs in DB: {response.count}")
