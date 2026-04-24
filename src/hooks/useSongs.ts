import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Song, Genre } from '../lib/mock-data';

// Helper to map DB rows to UI types
function mapToSong(dbSong: any, dbArtist: any, dbStats: any): Song {
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
    audioUrl: dbSong.page_url,
    genre: (dbArtist?.genre?.toLowerCase() as Genre) || "afrobeats",
    coverUrl: dbSong.cover_url,
    // Fallback gradient colors 
    cover: { from: 'hsl(210, 70%, 50%)', to: 'hsl(215, 65%, 35%)' }
  };
}

export function useAllSongs() {
  return useQuery({
    queryKey: ['allSongs'],
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

      const allSongs = data.map((row: any) => {
        // Grab the most recent stats snapshot
        const statsArray = Array.isArray(row.song_stats) ? row.song_stats : [];
        const latestStats = statsArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || { plays: 0 };
        return mapToSong(row, row.artists, latestStats);
      });

      return allSongs;
    }
  });
}

// Derived queries
export function useTrendingSongs() {
  const { data: songs, ...rest } = useAllSongs();
  const trending = songs ? [...songs].sort((a, b) => b.plays - a.plays).slice(0, 10) : [];
  return { songs: trending, ...rest };
}

export function useNewSongs() {
  const { data: songs, ...rest } = useAllSongs();
  const newS = songs ? [...songs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10) : [];
  return { songs: newS, ...rest };
}

export function useTopHits() {
  const { data: songs, ...rest } = useAllSongs();
  const hits = songs ? [...songs].sort((a, b) => b.plays - a.plays).slice(0, 10) : [];
  return { songs: hits, ...rest };
}

export function useSongsByGenre(genre: Genre | 'all') {
  const { data: songs, ...rest } = useAllSongs();
  if (!songs) return { songs: [], ...rest };
  if (genre === 'all') return { songs, ...rest };
  return { songs: songs.filter(s => s.genre === genre), ...rest };
}
