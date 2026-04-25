-- ============================================================
-- ONE-TIME MIGRATION: songs → playlists
--
-- Detects DJ mixtapes using the same rules as the scraper:
--   1. Title starts with a 4-digit year
--   2. Title contains Mashup / Mixtape / Non Stop / Nonstop / " Mix"
--
-- Run AFTER playlists_table.sql has been executed.
-- ============================================================

BEGIN;

-- 1. Copy matching songs into playlists
INSERT INTO playlists (artist_id, title, cover_url, page_url, first_seen_at)
SELECT artist_id, title, cover_url, page_url, first_seen_at
FROM   songs
WHERE  title ~* '^\d{4}\b'
   OR  LOWER(title) LIKE '%mashup%'
   OR  LOWER(title) LIKE '%mixtape%'
   OR  LOWER(title) LIKE '%non stop%'
   OR  LOWER(title) LIKE '%nonstop%'
   OR  LOWER(title) ~ '\bmix\b'
ON CONFLICT (page_url) DO NOTHING;

-- 2. Copy their stats into playlist_stats
INSERT INTO playlist_stats (playlist_id, date, plays, downloads)
SELECT p.id, ss.date, ss.plays, ss.downloads
FROM   playlists        p
JOIN   songs            s  ON s.page_url   = p.page_url
JOIN   song_stats       ss ON ss.song_id   = s.id
ON CONFLICT (playlist_id, date) DO NOTHING;

-- 3. Delete the originals from songs (stats cascade via FK)
DELETE FROM songs
WHERE  title ~* '^\d{4}\b'
   OR  LOWER(title) LIKE '%mashup%'
   OR  LOWER(title) LIKE '%mixtape%'
   OR  LOWER(title) LIKE '%non stop%'
   OR  LOWER(title) LIKE '%nonstop%'
   OR  LOWER(title) ~ '\bmix\b';

COMMIT;

-- Verify counts after migration
SELECT 'playlists' AS tbl, COUNT(*) FROM playlists
UNION ALL
SELECT 'songs',            COUNT(*) FROM songs;
