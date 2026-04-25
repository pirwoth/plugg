-- ============================================================
-- Create playlists + playlist_stats tables (DJ Mixtapes)
-- Run this ONCE in the Supabase SQL editor before migration
-- ============================================================

CREATE TABLE IF NOT EXISTS playlists (
  id            BIGSERIAL PRIMARY KEY,
  artist_id     BIGINT REFERENCES artists(id),
  title         TEXT NOT NULL,
  cover_url     TEXT,
  page_url      TEXT UNIQUE,
  first_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playlist_stats (
  id          BIGSERIAL PRIMARY KEY,
  playlist_id BIGINT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  plays       BIGINT DEFAULT 0,
  downloads   BIGINT DEFAULT 0,
  UNIQUE (playlist_id, date)
);

-- Row Level Security — public read
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read playlists"
  ON playlists FOR SELECT USING (true);

CREATE POLICY "Public read playlist_stats"
  ON playlist_stats FOR SELECT USING (true);
