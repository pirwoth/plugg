import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Song, Genre } from '../lib/mock-data';

interface DbSong {
  id: string | number;
  title?: string;
  first_seen_at?: string;
  page_url?: string;
  cover_url?: string;
  song_stats?: DbStats[];
  artists?: DbArtist;
}

interface DbArtist {
  name?: string;
  image_url?: string;
  genre?: string;
}

interface DbStats {
  plays?: number;
  downloads?: number;
  date?: string;
}

// Helper to map DB rows to UI types
function mapToSong(dbSong: DbSong, dbArtist: DbArtist | null | undefined, dbStats: DbStats | null | undefined): Song {
  // If the title is missing, fallback gracefully
  const title = dbSong.title || 'Unknown Title';
  const artistName = dbArtist?.name || 'Unknown Artist';
  
  return {
    id: dbSong.id.toString(),
    artistName,
    artistAvatar: dbArtist?.image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(artistName)}&backgroundColor=d97706`,
    title,
    plays: dbStats?.plays || 0,
    downloads: dbStats?.downloads || 0,
    likes: 0,
    timestamp: new Date(dbSong.first_seen_at || Date.now()),
    duration: 180, // Stub duration
    audioUrl: (() => {
      if (dbSong.page_url) {
        const rawTitle = title || '';
        let songPart = rawTitle;
        let artistPart = artistName || '';
        
        if (rawTitle.includes('-')) {
          const parts = rawTitle.split('-');
          songPart = parts[0];
          artistPart = parts.slice(1).join('-');
        }
        
        const cleanSong = songPart.replace(/\s+/g, '');
        const cleanArtist = artistPart.replace(/\s+/g, '');
        return encodeURI(`https://www.westnilebiz.com/songs/${cleanSong} - ${cleanArtist}.mp3`);
      }
      return "";
    })(),
    westnile_id: (() => {
      const match = dbSong.page_url?.match(/\/audio\/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })(),
    genre: (dbArtist?.genre?.toLowerCase() as Genre) || "afrobeats",
    coverUrl: dbSong.cover_url || undefined,
    // Fallback gradient colors 
    cover: { from: 'hsl(210, 70%, 50%)', to: 'hsl(215, 65%, 35%)' }
  };
}

export function useAllSongs() {
  return useQuery({
    queryKey: ['allSongs', 'v3'],
    queryFn: async (): Promise<Song[]> => {
      // Fetch up to 100 recent songs for the UI feed
      const { data, error } = await supabase
        .from('songs')
        .select(`
          *,
          artists (*),
          song_stats (*)
        `)
        .order('first_seen_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error("Supabase fetch error:", error);
        throw error;
      }

      const allSongs = (data as DbSong[]).map((row) => {
        // Grab the most recent stats snapshot
        const statsArray = Array.isArray(row.song_stats) ? row.song_stats : [];
        const latestStats = statsArray.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0] || { plays: 0 };
        return mapToSong(row, row.artists, latestStats);
      });

      // Safety filter: exclude any DJ mixes that weren't caught by the scraper
      const MIXTAPE_PATTERNS = [/^\d{4}\b/, /mashup/i, /mixtape/i, /non[\s-]?stop/i];
      const STANDALONE_MIX = /\bmix\b/i;
      const REMIX = /remix/i;
      const tracks = allSongs.filter((s) => {
        const t = s.title;
        if (MIXTAPE_PATTERNS.some((p) => p.test(t))) return false;
        if (STANDALONE_MIX.test(t) && !REMIX.test(t)) return false;
        return true;
      });

      return tracks;
    }
  });
}

// Derived queries
export function useTrendingSongs() {
  const { data: songs, ...rest } = useAllSongs();
  // Trending -> plays
  const trending = songs ? [...songs].sort((a, b) => b.plays - a.plays).slice(0, 10) : [];
  return { songs: trending, ...rest };
}

export function useNewSongs() {
  const { data: songs, ...rest } = useAllSongs();
  // New Upload -> westnile_id
  const newS = songs ? [...songs].sort((a, b) => (b.westnile_id || 0) - (a.westnile_id || 0)).slice(0, 10) : [];
  return { songs: newS, ...rest };
}

export function useTopHits() {
  const { data: songs, ...rest } = useAllSongs();
  // Hits -> downloads
  const hits = songs ? [...songs].sort((a, b) => b.downloads - a.downloads).slice(0, 10) : [];
  return { songs: hits, ...rest };
}

export function useSongsByGenre(genre: Genre | 'all') {
  const { data: songs, ...rest } = useAllSongs();
  if (!songs) return { songs: [], ...rest };
  if (genre === 'all') return { songs, ...rest };
  return { songs: songs.filter(s => s.genre === genre), ...rest };
}
