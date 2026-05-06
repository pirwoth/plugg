import difflib

artists = ["Sonet", "Sonnet", "Bush Boy", "Bushboy", "Lucky Dee", "Lucky D", "Don Popular", "Don Popular "]
for a in artists:
    matches = difflib.get_close_matches(a, artists, n=5, cutoff=0.85)
    print(f"'{a}': {matches}")
