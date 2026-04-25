import os
from dotenv import load_dotenv

# Load variables from .env automatically
load_dotenv()

# Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

# AI Categorization
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
ENABLE_AI_GENRE = True if GEMINI_API_KEY else False

# Scraping
BASE_URL = "https://www.westnilebiz.com"
LETTERS = "abcdefghijklmnopqrstuvwxyz0123456789"
HEADERS = {'User-Agent': 'InternalMigrationBot/1.0'}

# Performance
MAX_CONCURRENT_ARTISTS = 10
PAGE_DELAY = 1.0  
HEADLESS = True  
