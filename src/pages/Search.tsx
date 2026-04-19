import { useEffect, useState } from "react";
import { Search as SearchIcon, ArrowLeft, X, Music, User, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import SongCover from "@/components/SongCover";
import { mockArtists, mockSongs } from "@/lib/mock-data";
import { usePlayer } from "@/context/PlayerContext";

type Filter = "all" | "songs" | "artists";

const RECENTS_KEY = "plugg.recent-searches.v1";
const MAX_RECENTS = 6;

const Search = () => {
  const navigate = useNavigate();
  const { play } = usePlayer();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch {/* noop */}
  }, []);

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

  const q = query.trim().toLowerCase();
  const showResults = q.length > 0;

  const artists = q
    ? mockArtists.filter((a) => a.name.toLowerCase().includes(q) || a.username.toLowerCase().includes(q))
    : [];
  const songs = q
    ? mockSongs.filter((s) => s.title.toLowerCase().includes(q) || s.artistName.toLowerCase().includes(q))
    : [];

  const showArtists = filter !== "songs";
  const showSongs = filter !== "artists";

  return (
    <AppShell
      title="Search"
      titleLeading={
        <button onClick={() => navigate(-1)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
      }
    >
      <div className="px-4 pt-4 space-y-3">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary focus-within:ring-2 focus-within:ring-primary/50">
          <SearchIcon size={16} className="text-muted-foreground" />
          <input
            autoFocus
            type="text"
            placeholder="Search artists or songs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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

      {/* Recents / suggestions when idle */}
      {!showResults && (
        <div className="mt-6 px-4">
          {recents.length > 0 && (
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

          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Browse artists</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {mockArtists.slice(0, 8).map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/profile/${a.id}`)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                  <span className="font-display text-xl font-bold text-foreground">{a.name.charAt(0)}</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate max-w-[80px]">{a.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && (
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
                      <p className="text-xs text-muted-foreground truncate">@{artist.username} · {artist.songs.length} songs</p>
                    </div>
                  </button>
                ))
              )}
            </section>
          )}

          {showSongs && songs.length > 0 && (
            <section className="mt-6">
              <h2 className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Songs</h2>
              {songs.slice(0, 20).map((song) => (
                <button
                  key={song.id}
                  onClick={() => { commitSearch(query); play(song); }}
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

          {artists.length === 0 && songs.length === 0 && (
            <EmptyState
              icon={SearchIcon}
              title={`No results for "${query}"`}
              description="Try a different artist name or song title."
            />
          )}
        </div>
      )}
    </AppShell>
  );
};

export default Search;
