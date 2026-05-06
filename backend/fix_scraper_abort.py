import re
from bs4 import BeautifulSoup

def analyze_scraper_code():
    with open('scraper.py', 'r') as f:
        code = f.read()
    
    # Let's replace the break condition with something more robust
    replacement = """
            if not batch_ids:
                print("    ⚠️ No valid song IDs parsed in this batch. Attempting to extract next ID from links...")
                link_ids = []
                for l in potential_links:
                    m = re.search(r'/audio/(\d+)', l.get('href', ''))
                    if m:
                        link_ids.append(int(m.group(1)))
                if link_ids:
                    next_id = min(link_ids)
                else:
                    print("    🏁 No valid audio links found in this batch.")
                    break
            else:
                next_id = min(batch_ids)

            if next_id >= int(current_id):
                print(f"    ⚠️ Warning: ID did not decrease ({current_id} -> {next_id}). Decrementing manually by 16.")
                next_id = int(current_id) - 16
                if next_id <= 0:
                    break
"""
    # Replace in scraper.py
    # Actually, it's easier to just use `replace_file_content` via the tool.
    print("Will use replace_file_content tool")

analyze_scraper_code()
