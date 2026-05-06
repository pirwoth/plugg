import re
import os
import difflib
import argparse
from collections import defaultdict
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

def extract_primary_artist(name):
    # Split by Ft, feat, featuring, x, with
    parts = re.split(r'(?i:\b(?:ft\.?|feat\.?|featuring|x|with)\b)', name, 1)
    return parts[0].strip()

def get_all_records(table_name, columns="*"):
    all_records = []
    start = 0
    step = 1000
    while True:
        res = supabase.table(table_name).select(columns).range(start, start + step - 1).execute()
        if not res.data:
            break
        all_records.extend(res.data)
        if len(res.data) < step:
            break
        start += step
    return all_records

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without modifying DB')
    args = parser.parse_args()

    print("Fetching artists and songs...")
    artists = get_all_records("artists")
    songs = get_all_records("songs", "id, artist_id")
    playlists = get_all_records("playlists", "id, artist_id")

    # Count items per artist
    item_counts = defaultdict(int)
    for s in songs:
        item_counts[s['artist_id']] += 1
    for p in playlists:
        item_counts[p['artist_id']] += 1

    print(f"Total artists: {len(artists)}")
    print(f"Total songs & playlists: {len(songs) + len(playlists)}")

    # 1. Group by exact normalized primary name
    primary_groups = defaultdict(list)
    for a in artists:
        primary = extract_primary_artist(a['name']).lower()
        primary = re.sub(r'\s+', ' ', primary).strip()
        if not primary:
            primary = "unknown artist"
        primary_groups[primary].append(a)

    print(f"Unique primary names (before fuzzy): {len(primary_groups)}")

    # 2. Fuzzy merge primary names
    keys = list(primary_groups.keys())
    
    # Simple Union-Find to group similar names
    parent = {k: k for k in keys}
    def find(i):
        if parent[i] == i:
            return i
        parent[i] = find(parent[i])
        return parent[i]
    def union(i, j):
        root_i = find(i)
        root_j = find(j)
        if root_i != root_j:
            parent[root_i] = root_j

    print("Running fuzzy matching...")
    for i, key in enumerate(keys):
        # We use a strict cutoff to avoid merging distinct artists (e.g., Bush Boy and Bash Boy)
        # 0.85 is usually good. "sonet" vs "sonnet" is 0.909.
        matches = difflib.get_close_matches(key, keys, n=10, cutoff=0.85)
        for m in matches:
            union(key, m)

    # 3. Build clusters
    clusters = defaultdict(list)
    for key in keys:
        root = find(key)
        clusters[root].extend(primary_groups[key])

    print(f"Unique clusters (after fuzzy): {len(clusters)}")

    # 4. Determine Master Artist and process merges
    total_merges = 0
    for root, cluster_artists in clusters.items():
        if len(cluster_artists) <= 1:
            continue

        # Sort artists by item count (descending), then shortest name length (to prefer 'Sonnet' over 'Sonnet Ft Bob')
        # Wait, if we want the best spelling, the one with most songs usually is the correct one.
        cluster_artists.sort(key=lambda a: (item_counts[a['id']], -len(a['name'])), reverse=True)
        
        master = cluster_artists[0]
        duplicates = cluster_artists[1:]

        print(f"\nCluster Master: '{master['name']}' (ID {master['id']}, Items: {item_counts[master['id']]})")
        for dup in duplicates:
            print(f"  -> Merging: '{dup['name']}' (ID {dup['id']}, Items: {item_counts[dup['id']]})")
            total_merges += 1
            
            if not args.dry_run:
                # Reassign songs
                supabase.table("songs").update({"artist_id": master['id']}).eq("artist_id", dup['id']).execute()
                # Reassign playlists
                supabase.table("playlists").update({"artist_id": master['id']}).eq("artist_id", dup['id']).execute()
                # Delete duplicate artist
                try:
                    supabase.table("artists").delete().eq("id", dup['id']).execute()
                except Exception as e:
                    print(f"     ⚠️ Failed to delete artist {dup['id']}: {e}")

    if args.dry_run:
        print(f"\n[DRY RUN] Would perform {total_merges} merges.")
    else:
        print(f"\n✅ Merged {total_merges} artist profiles successfully.")

if __name__ == "__main__":
    main()
