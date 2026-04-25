import { createContext, useCallback, useContext, useMemo, useState, ReactNode, useRef, useEffect } from "react";
import { Song, mockSongs } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface PlayerContextValue {
  currentSong: Song | null;
  isPlaying: boolean;
  showFullPlayer: boolean;
  likedSongs: Set<string>;
  followedArtists: Set<string>;
  play: (song: Song, playlist?: Song[]) => void;
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
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  isRepeat: boolean;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  recentlyPlayed: Song[];
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(() => {
    try {
      const saved = localStorage.getItem("plugg_current_song");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  const [followedArtists, setFollowedArtists] = useState<Set<string>>(new Set());
  const [playlist, setPlaylist] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem("plugg_playlist");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const savedTime = (() => { try { return parseFloat(localStorage.getItem("plugg_current_time") || "0") || 0; } catch { return 0; } })();
  const [currentTime, setCurrentTime] = useState(savedTime);
  const [duration, setDuration] = useState(0);
  const [volumeState, setVolumeState] = useState(0.7);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem("plugg_recently_played");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load user data (likes/follows) when authenticated
  useEffect(() => {
    if (!user) {
      setLikedSongs(new Set());
      setFollowedArtists(new Set());
      return;
    }

    // Load likes
    supabase.from("user_favourites").select("song_id").eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setLikedSongs(new Set(data.map(d => d.song_id)));
      });

    // Load follows
    supabase.from("user_follows").select("artist_slug").eq("follower_id", user.id)
      .then(({ data }) => {
        if (data) setFollowedArtists(new Set(data.map(d => d.artist_slug)));
      });
  }, [user]);

  // Track Recently Played
  useEffect(() => {
    if (currentSong) {
      setRecentlyPlayed(prev => {
        const filtered = prev.filter(s => s.id !== currentSong.id);
        const next = [currentSong, ...filtered].slice(0, 12);
        localStorage.setItem("plugg_recently_played", JSON.stringify(next));
        return next;
      });
    }
  }, [currentSong?.id]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (currentSong) localStorage.setItem("plugg_current_song", JSON.stringify(currentSong));
    else localStorage.removeItem("plugg_current_song");
  }, [currentSong]);

  useEffect(() => {
    if (playlist.length > 0) localStorage.setItem("plugg_playlist", JSON.stringify(playlist));
    else localStorage.removeItem("plugg_playlist");
  }, [playlist]);

  // Throttle-save playback position every second, tagged to the current song ID
  useEffect(() => {
    if (currentSong && currentTime > 0) {
      localStorage.setItem("plugg_current_time", String(currentTime));
      localStorage.setItem("plugg_current_time_id", currentSong.id);
    }
  }, [Math.floor(currentTime)]);

  const play = useCallback((song: Song, newPlaylist?: Song[]) => {
    if (newPlaylist) {
      setPlaylist(newPlaylist);
    }
    setCurrentSong((cur) => {
      if (cur?.id === song.id) {
        setIsPlaying((p) => !p);
        return cur;
      }
      // New song — clear saved position so it starts from 0
      localStorage.removeItem("plugg_current_time");
      localStorage.removeItem("plugg_current_time_id");
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
      const list = playlist.length > 0 ? playlist : mockSongs;
      if (list.length === 0) return cur;
      let nxt;
      if (isShuffle) {
        nxt = list[Math.floor(Math.random() * list.length)];
      } else {
        const idx = list.findIndex((s) => s.id === cur.id);
        const currentIndex = idx === -1 ? 0 : idx;
        nxt = list[(currentIndex + 1) % list.length];
      }
      setIsPlaying(true);
      return nxt;
    });
  }, [playlist, isShuffle]);

  const prev = useCallback(() => {
    setCurrentSong((cur) => {
      if (!cur) return cur;
      const list = playlist.length > 0 ? playlist : mockSongs;
      const idx = list.findIndex((s) => s.id === cur.id);
      if (idx === -1) return list[0] || cur;
      const prv = list[(idx - 1 + list.length) % list.length];
      setIsPlaying(true);
      return prv;
    });
  }, [playlist]);

  const toggleLike = useCallback(async (id?: string) => {
    const songId = id ?? currentSong?.id;
    if (!songId) return;

    const isLiked = likedSongs.has(songId);
    
    // Optimistic UI update
    setLikedSongs((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(songId);
      else next.add(songId);
      return next;
    });

    if (user) {
      if (isLiked) {
        await supabase.from("user_favourites").delete().eq("user_id", user.id).eq("song_id", songId);
      } else {
        await supabase.from("user_favourites").insert({ user_id: user.id, song_id: songId });
      }
    }
  }, [currentSong, likedSongs, user]);

  const toggleFollow = useCallback(async (artistId: string) => {
    const isFollowing = followedArtists.has(artistId);

    // Optimistic UI update
    setFollowedArtists((prev) => {
      const next = new Set(prev);
      if (isFollowing) next.delete(artistId);
      else next.add(artistId);
      return next;
    });

    if (user) {
      if (isFollowing) {
        await supabase.from("user_follows").delete().eq("follower_id", user.id).eq("artist_slug", artistId);
      } else {
        await supabase.from("user_follows").insert({ follower_id: user.id, artist_slug: artistId });
      }
    }
  }, [followedArtists, user]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((vol: number) => {
    // vol should be 0 to 1
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    setVolumeState(vol);
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
      currentTime,
      duration,
      volume: volumeState,
      isShuffle,
      isRepeat,
      seek,
      setVolume,
      toggleShuffle: () => setIsShuffle(s => !s),
      toggleRepeat: () => setIsRepeat(r => !r),
      recentlyPlayed
    };
  }, [currentSong, isPlaying, showFullPlayer, likedSongs, followedArtists, play, toggle, close, next, prev, toggleLike, toggleFollow, currentTime, duration, volumeState, isShuffle, isRepeat, seek, setVolume, recentlyPlayed]);

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {currentSong && (
        <audio 
          ref={audioRef} 
          src={currentSong.audioUrl} 
          onEnded={next} 
          autoPlay={isPlaying}
          loop={isRepeat}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            e.currentTarget.volume = volumeState;
            // Only restore saved position if it belongs to THIS song
            const savedId = localStorage.getItem("plugg_current_time_id");
            const saved = parseFloat(localStorage.getItem("plugg_current_time") || "0");
            if (currentSong && savedId === currentSong.id && saved > 0 && saved < e.currentTarget.duration) {
              e.currentTarget.currentTime = saved;
              setCurrentTime(saved);
            }
          }}
        />
      )}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
};
