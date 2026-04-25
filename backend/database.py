from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def find_artist_by_name(name: str) -> int | None:
    """Case-insensitive exact-name lookup. Returns artist ID or None."""
    try:
        res = supabase.table('artists').select('id').ilike('name', name.strip()).limit(1).execute()
        if res.data:
            return res.data[0]['id']
    except Exception:
        pass
    return None

def upsert_artist(name: str, bio: str = None, image_url: str = None) -> int:
    """Insert or update artist, return ID."""
    try:
        existing = supabase.table('artists').select('id').eq('name', name).execute()
        if existing.data:
            artist_id = existing.data[0]['id']
            update_data = {}
            if bio:
                update_data['bio'] = bio
            if image_url:
                update_data['image_url'] = image_url
            if update_data:
                supabase.table('artists').update(update_data).eq('id', artist_id).execute()
            return artist_id
        new_data = {'name': name}
        if bio:
            new_data['bio'] = bio
        if image_url:
            new_data['image_url'] = image_url
        new = supabase.table('artists').insert(new_data).execute()
        return new.data[0]['id']
    except Exception as e:
        err_msg = str(e)
        if 'artists_slug_key' in err_msg:
            # Re-fetch by slug attempt if name failed but slug collided (e.g. casing/spacing issue)
            import re
            fallback_slug = re.sub(r'[\W_]+', '-', name.lower().strip())
            fallback = supabase.table('artists').select('id').eq('slug', fallback_slug).execute()
            if fallback.data:
                return fallback.data[0]['id']
        raise

def update_artist_genre(artist_id: int, genre: str):
    """Update genre for a specific artist."""
    if not genre:
        return
    try:
        supabase.table('artists').update({'genre': genre}).eq('id', artist_id).execute()
        print(f"      [AI] Assigned genre: {genre}")
    except Exception as e:
        print(f"  ⚠️ Failed to update genre for artist {artist_id}: {e}")

def upsert_song(artist_id: int, title: str, cover_url: str, page_url: str) -> int:
    try:
        existing = supabase.table('songs').select('id', 'title', 'cover_url').eq('page_url', page_url).execute()
        if existing.data:
            song_id = existing.data[0]['id']
            # Update title and cover_url if they are empty or different
            update_data = {}
            if title and title != existing.data[0].get('title'):
                update_data['title'] = title
            if cover_url and cover_url != existing.data[0].get('cover_url'):
                update_data['cover_url'] = cover_url
                
            if update_data:
                supabase.table('songs').update(update_data).eq('id', song_id).execute()
                
            return song_id
            
        new_song = supabase.table('songs').insert({
            'title': title,
            'artist_id': artist_id,
            'cover_url': cover_url,
            'page_url': page_url
        }).execute()
        return new_song.data[0]['id']
    except Exception as e:
        print(f"  ⚠️ Song DB error: {e}")
        raise

def upsert_stats(song_id: int, plays: int, downloads: int):
    supabase.table('song_stats').upsert({
        'song_id': song_id,
        'date': 'now()',
        'plays': plays,
        'downloads': downloads
    }, on_conflict='song_id,date').execute()


# ────────────────────────────────────────────────────────────
# Playlist (DJ Mixtape) helpers
# ────────────────────────────────────────────────────────────

def upsert_playlist(artist_id: int, title: str, cover_url: str, page_url: str) -> int:
    """Insert or update a DJ mixtape, return its ID."""
    try:
        existing = supabase.table('playlists').select('id', 'title', 'cover_url').eq('page_url', page_url).execute()
        if existing.data:
            playlist_id = existing.data[0]['id']
            update_data = {}
            if title and title != existing.data[0].get('title'):
                update_data['title'] = title
            if cover_url and cover_url != existing.data[0].get('cover_url'):
                update_data['cover_url'] = cover_url
            if update_data:
                supabase.table('playlists').update(update_data).eq('id', playlist_id).execute()
            return playlist_id

        new_pl = supabase.table('playlists').insert({
            'title': title,
            'artist_id': artist_id,
            'cover_url': cover_url,
            'page_url': page_url
        }).execute()
        return new_pl.data[0]['id']
    except Exception as e:
        print(f'  ⚠️ Playlist DB error: {e}')
        raise


def upsert_playlist_stats(playlist_id: int, plays: int, downloads: int):
    """Upsert play/download stats for a DJ mixtape."""
    supabase.table('playlist_stats').upsert({
        'playlist_id': playlist_id,
        'date': 'now()',
        'plays': plays,
        'downloads': downloads
    }, on_conflict='playlist_id,date').execute()