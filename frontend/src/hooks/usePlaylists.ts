import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Song, Genre } from '../lib/mock-data'; // playlists share the same UI shape as songs

interface DbPlaylist {
  id: string | number;
  title?: string;
  first_seen_at?: string;
  page_url?: string;
  cover_url?: string;
  playlist_stats?: DbStats[];
  artists?: DbArtist;
}

interface DbArtist {
  name?: string;
  image_url?: string;
}

interface DbStats {
  plays?: number;
  downloads?: number;
  date?: string;
}

/**
 * Map a playlist DB row to the Song UI type so all existing components
 * (SongItem, TrendingHero, SongSection) just work without changes.
 */
function mapToPlaylist(row: DbPlaylist): Song {
  const title = row.title || 'Unknown Playlist';
  const artistName = row.artists?.name || 'DJ';
  const statsArray = Array.isArray(row.playlist_stats) ? row.playlist_stats : [];
  const latest = statsArray
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0] || {
    plays: 0, downloads: 0,
  };

  return {
    id: `pl-${row.id}`,           // prefix avoids ID collisions with regular songs
    artistName,
    artistAvatar:
      row.artists?.image_url ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(artistName)}&backgroundColor=7c3aed`,
    title,
    plays: latest.plays || 0,
    downloads: latest.downloads || 0,
    likes: 0,
    timestamp: new Date(row.first_seen_at || Date.now()),
    duration: 3600, // mixtapes are ~1 hr
    audioUrl: (() => {
      if (!row.page_url) return '';
      const rawTitle = title;
      let songPart = rawTitle;
      let artistPart = artistName;
      if (rawTitle.includes('-')) {
        const parts = rawTitle.split('-');
        songPart = parts[0];
        artistPart = parts.slice(1).join('-');
      }
      const cleanSong = songPart.replace(/\s+/g, '');
      const cleanArtist = artistPart.replace(/\s+/g, '');
      return encodeURI(`https://www.westnilebiz.com/songs/${cleanSong} - ${cleanArtist}.mp3`);
    })(),
    genre: 'afrobeats' as Genre,
    coverUrl: row.cover_url || undefined,
    cover: { from: 'hsl(262, 60%, 40%)', to: 'hsl(270, 55%, 25%)' }, // purple gradient for DJ mixes
    isPlaylist: true,
  };
}

export function useAllPlaylists() {
  return useQuery({
    queryKey: ['allPlaylists', 'v1'],
    queryFn: async (): Promise<Song[]> => {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          artists (*),
          playlist_stats (*)
        `)
        .order('first_seen_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Playlists fetch error:', error);
        throw error;
      }

      return (data as DbPlaylist[]).map(mapToPlaylist);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrendingPlaylists() {
  const { data, ...rest } = useAllPlaylists();
  const sorted = data ? [...data].sort((a, b) => b.plays - a.plays).slice(0, 10) : [];
  return { songs: sorted, ...rest };
}

export function useNewPlaylists() {
  const { data, ...rest } = useAllPlaylists();
  // Newest by ID suffix (matches 'first_seen_at' ordering from the query)
  const sorted = data ? data.slice(0, 10) : [];
  return { songs: sorted, ...rest };
}

export function useTopPlaylists() {
  const { data, ...rest } = useAllPlaylists();
  const sorted = data ? [...data].sort((a, b) => b.downloads - a.downloads).slice(0, 10) : [];
  return { songs: sorted, ...rest };
}
