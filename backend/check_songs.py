from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
res = supabase.table('artists').select('id, name').limit(5).execute()
for a in res.data:
    songs = supabase.table('songs').select('id, title').eq('artist_id', a['id']).execute()
    print(f"Artist: {a['name']} - Songs: {len(songs.data)}")
    for s in songs.data:
        print(f"  - {s['title']}")
