import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { Song, mockSongs } from "@/lib/mock-data";

interface PlayerContextValue {
  currentSong: Song | null;
  isPlaying: boolean;
  showFullPlayer: boolean;
  likedSongs: Set<string>;
  followedArtists: Set<string>;
  play: (song: Song) => void;
  toggle: () => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  toggleLike: (id?: string) => void;
  toggleFollow: (artistId: string) => void;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
  currentWithLike: Song | null;
  favoriteSongs: Song[];
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  const [followedArtists, setFollowedArtists] = useState<Set<string>>(new Set());

  const play = useCallback((song: Song) => {
    setCurrentSong((cur) => {
      if (cur?.id === song.id) {
        setIsPlaying((p) => !p);
        return cur;
      }
      setIsPlaying(true);
      return song;
    });
  }, []);

  const toggle = useCallback(() => setIsPlaying((p) => !p), []);

  const close = useCallback(() => {
    setCurrentSong(null);
    setIsPlaying(false);
    setShowFullPlayer(false);
  }, []);

  const next = useCallback(() => {
    setCurrentSong((cur) => {
      if (!cur) return cur;
      const idx = mockSongs.findIndex((s) => s.id === cur.id);
      const nxt = mockSongs[(idx + 1) % mockSongs.length];
      setIsPlaying(true);
      return nxt;
    });
  }, []);

  const prev = useCallback(() => {
    setCurrentSong((cur) => {
      if (!cur) return cur;
      const idx = mockSongs.findIndex((s) => s.id === cur.id);
      const prv = mockSongs[(idx - 1 + mockSongs.length) % mockSongs.length];
      setIsPlaying(true);
      return prv;
    });
  }, []);

  const toggleLike = useCallback((id?: string) => {
    const songId = id ?? currentSong?.id;
    if (!songId) return;
    setLikedSongs((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  }, [currentSong]);

  const toggleFollow = useCallback((artistId: string) => {
    setFollowedArtists((prev) => {
      const next = new Set(prev);
      if (next.has(artistId)) next.delete(artistId);
      else next.add(artistId);
      return next;
    });
  }, []);

  const value = useMemo<PlayerContextValue>(() => {
    const currentWithLike = currentSong
      ? { ...currentSong, liked: likedSongs.has(currentSong.id) }
      : null;
    const favoriteSongs = mockSongs.filter((s) => likedSongs.has(s.id));
    return {
      currentSong,
      isPlaying,
      showFullPlayer,
      likedSongs,
      followedArtists,
      play,
      toggle,
      close,
      next,
      prev,
      toggleLike,
      toggleFollow,
      openFullPlayer: () => setShowFullPlayer(true),
      closeFullPlayer: () => setShowFullPlayer(false),
      currentWithLike,
      favoriteSongs,
    };
  }, [currentSong, isPlaying, showFullPlayer, likedSongs, followedArtists, play, toggle, close, next, prev, toggleLike, toggleFollow]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
};
