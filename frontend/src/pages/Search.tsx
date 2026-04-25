import { useEffect, useState } from "react";
import { Search as SearchIcon, ArrowLeft, X, Clock, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import SongCover from "@/components/SongCover";
import { usePlayer } from "@/context/PlayerContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Song } from "@/lib/mock-data";

type Filter = "all" | "songs" | "artists";

const RECENTS_KEY = "plugg.recent-searches.v1";
const MAX_RECENTS = 6;

const ALPHABETS = [...Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"), "0-9"];

const Search = () => {
  const navigate = useNavigate();
  const { play } = usePlayer();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [recents, setRecents] = useState<string[]>([]);
  const [letterFilter, setLetterFilter] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch {/* noop */}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const persistRecents = (next: string[]) => {
    setRecents(next);
    try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch {/* noop */}
  };

  const commitSearch = (q: string) => {
    if (!q.trim()) return;
    const next = [q.trim(), ...recents.filter((r) => r.toLowerCase() !== q.trim().toLowerCase())].slice(0, MAX_RECENTS);
    persistRecents(next);
  };

  const clearRecents = () => persistRecents([]);

  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ['search', 'v4', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { artists: [], songs: [], playlists: [] };
      const [artistsRes, songsRes, playlistsRes] = await Promise.all([
        supabase.from('artists').select('*').ilike('name', `%${debouncedQuery}%`).limit(20),
        supabase.from('songs').select('*, artists(*), song_stats(*)').ilike('title', `%${debouncedQuery}%`).limit(20),
        supabase.from('playlists').select('*, artists(*), playlist_stats(*)').ilike('title', `%${debouncedQuery}%`).limit(20),
      ]);

      const mapRow = (row: any, isPlaylist = false): Song => {
        const statsArray = (isPlaylist ? row.playlist_stats : row.song_stats) || [];
        const latestStats = statsArray.sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0] || { plays: 0 };
        const artistName = row.artists?.name || 'Unknown';
        const title = row.title || 'Unknown';
        const rawTitle = title;
        let songPart = rawTitle, artistPart = artistName;
        if (rawTitle.includes('-')) {
          const parts = rawTitle.split('-');
          songPart = parts[0];
          artistPart = parts.slice(1).join('-');
        }
        return {
          id: isPlaylist ? `pl-${row.id}` : row.id.toString(),
          artistName,
          artistAvatar: row.artists?.image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(artistName)}&backgroundColor=${isPlaylist ? '7c3aed' : 'd97706'}`,
          title,
          plays: latestStats.plays || 0,
          downloads: latestStats.downloads || 0,
          likes: 0,
          timestamp: new Date(row.first_seen_at || Date.now()),
          duration: isPlaylist ? 3600 : 180,
          audioUrl: row.page_url ? encodeURI(`https://www.westnilebiz.com/songs/${songPart.replace(/\s+/g, '')} - ${artistPart.replace(/\s+/g, '')}.mp3`) : '',
          genre: 'afrobeats' as any,
          coverUrl: row.cover_url || undefined,
          cover: isPlaylist ? { from: 'hsl(262, 60%, 40%)', to: 'hsl(270, 55%, 25%)' } : { from: 'hsl(210, 70%, 50%)', to: 'hsl(215, 65%, 35%)' },
          isPlaylist,
        } as Song;
      };

      return {
        artists: artistsRes.data || [],
        songs: (songsRes.data || []).map((r) => mapRow(r, false)),
        playlists: (playlistsRes.data || []).map((r) => mapRow(r, true)),
      };
    },
    enabled: debouncedQuery.length > 0
  });

  const { data: letterArtists, isLoading: isLetterLoading } = useQuery({
    queryKey: ['letterArtists', letterFilter],
    queryFn: async () => {
      if (!letterFilter) return [];
      let queryStr = `${letterFilter}%`;
      let res;
      if (letterFilter === '0-9') {
        res = await supabase.from('artists').select('*').limit(50); // simplified fallback, postgres regex is tricky with postgrest 
        return (res.data || []).filter(a => /^[0-9]/.test(a.name));
      } else {
        res = await supabase.from('artists').select('*').ilike('name', queryStr).limit(50);
        return res.data || [];
      }
    },
    enabled: !!letterFilter && !debouncedQuery
  });

  const showResults = debouncedQuery.length > 0;
  const artists = searchResults?.artists || [];
  const songs = searchResults?.songs || [];

  const showArtists = filter !== "songs";
  const showSongs = filter !== "artists";

  return (
    <div className="animate-in fade-in duration-500">
      <div className="px-4 pt-4 space-y-3">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary focus-within:ring-2 focus-within:ring-primary/50">
          <SearchIcon size={16} className="text-muted-foreground" />
          <input
            autoFocus
            type="text"
            placeholder="Search artists or songs..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value) setLetterFilter(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && commitSearch(query)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Clear">
              <X size={16} />
            </button>
          )}
        </div>

        {showResults && (
          <div className="flex gap-2">
            {(["all", "songs", "artists"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize ${
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recents and Browse logic */}
      {!showResults && (
        <div className="mt-6 px-4">
          {recents.length > 0 && !letterFilter && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent searches</h2>
                <button onClick={clearRecents} className="text-[11px] text-muted-foreground hover:text-foreground">Clear</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recents.map((r) => (
                  <button
                    key={r}
                    onClick={() => setQuery(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-xs text-foreground hover:bg-secondary/80"
                  >
                    <Clock size={12} className="text-muted-foreground" /> {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
             <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Browse Artists</h2>
             {letterFilter && (
                <button onClick={() => setLetterFilter(null)} className="text-[11px] text-muted-foreground hover:text-foreground">Clear Letter Filter</button>
             )}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
             {ALPHABETS.map((letter) => (
                <button
                   key={letter}
                   onClick={() => setLetterFilter(letter)}
                   className={`w-9 h-9 rounded-full border flex items-center justify-center font-semibold text-xs transition-colors ${
                      letterFilter === letter ? "bg-primary border-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent"
                   }`}
                >
                   {letter}
                </button>
             ))}
          </div>

          {letterFilter && (
            <div className="mt-4">
               {isLetterLoading ? (
                  <p className="text-sm text-muted-foreground">Loading artists...</p>
               ) : letterArtists && letterArtists.length > 0 ? (
                  <div className="space-y-1">
                     {letterArtists.map(artist => (
                        <button
                          key={artist.id}
                          onClick={() => navigate(`/profile/${artist.id}`)}
                          className="flex items-center gap-3 px-2 py-3 w-full text-left hover:bg-secondary/60 transition-colors rounded"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border border-border flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-foreground">{artist.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{artist.name}</p>
                          </div>
                        </button>
                     ))}
                  </div>
               ) : (
                  <p className="text-sm text-muted-foreground">No artists found for "{letterFilter}".</p>
               )}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {showResults && !isSearchLoading && (
        <div className="mt-2">
          {showArtists && (
            <section className="mt-4">
              <h2 className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Artists</h2>
              {artists.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">No artists match your search.</p>
              ) : (
                artists.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => { commitSearch(query); navigate(`/profile/${artist.id}`); }}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-secondary/60 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-foreground">{artist.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{artist.name}</p>
                    </div>
                  </button>
                ))
              )}
            </section>
          )}

          {showSongs && songs.length > 0 && (
            <section className="mt-6">
              <h2 className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tracks</h2>
              {songs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => { commitSearch(query); play(song, songs); }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-secondary/60 transition-colors"
                >
                  <SongCover song={song} size={40} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{song.artistName}</p>
                  </div>
                </button>
              ))}
            </section>
          )}

          {/* Playlists (DJ Mixes) */}
          {showSongs && (searchResults?.playlists || []).length > 0 && (
            <section className="mt-6">
              <h2 className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-violet-600 inline-block" />
                Playlists &amp; DJ Mixes
              </h2>
              {(searchResults?.playlists || []).map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => { commitSearch(query); play(pl, searchResults?.playlists || []); }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-violet-500/5 transition-colors"
                >
                  <SongCover song={pl} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground truncate">{pl.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{pl.artistName}</p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-600/20 text-violet-400 uppercase tracking-wide shrink-0">Mix</span>
                </button>
              ))}
            </section>
          )}

          {artists.length === 0 && songs.length === 0 && (searchResults?.playlists || []).length === 0 && (
            <EmptyState
              icon={SearchIcon}
              title={`No results for "${query}"`}
              description="Try a different artist name or song title."
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
