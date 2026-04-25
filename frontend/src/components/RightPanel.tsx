import { Search, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTrendingSongs, useAllSongs } from "@/hooks/useSongs";
import { Skeleton } from "@/components/Skeleton";

interface RightPanelProps {
  onSearch: () => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

const RightPanel = ({ onSearch }: RightPanelProps) => {
  const navigate = useNavigate();
  // Fetch live trending songs instead of mock data
  const { songs: liveTrendingSongs, isLoading: trendingLoading } = useTrendingSongs();
  const topTrending = liveTrendingSongs ? liveTrendingSongs.slice(0, 5) : [];

  // Derive top 5 live artists from all songs — exclude obvious DJ names
  const { data: allSongs, isLoading: allSongsLoading } = useAllSongs();
  const suggestedArtists = (() => {
    if (!allSongs) return [];
    const seen = new Set<string>();
    const artists = [];
    for (const song of allSongs) {
      const name = song.artistName;
      // Skip DJ mixer entries that aren't real individual artists
      const isDJ = /^dj\b/i.test(name) && /mix|fest|nonstop|non stop/i.test(name);
      if (!seen.has(name) && !isDJ) {
        seen.add(name);
        artists.push({
          id: name,
          name,
          username: name.toLowerCase().replace(/\s/g, ""),
        });
      }
      if (artists.length >= 5) break;
    }
    return artists;
  })();

  return (
    <aside className="sticky top-0 h-screen overflow-y-auto scrollbar-hide py-4 pl-2 space-y-4">
      {/* Search */}
      <button
        onClick={onSearch}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-left"
      >
        <Search size={18} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Search artists</span>
      </button>

      {/* Trending now */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <h3 className="font-display text-lg font-bold text-foreground px-4 pt-3 pb-2">
          Trending now
        </h3>
        {trendingLoading ? (
          <div className="px-4 pb-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-2 w-16" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        ) : (
          topTrending.map((song, i) => (
            <div
              key={song.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors cursor-default"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">#{i + 1} · Trending</p>
                <p className="text-sm font-semibold text-foreground truncate">{song.title}</p>
                <p className="text-xs text-muted-foreground truncate">{song.artistName}</p>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                ▶ {formatCount(song.plays)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Who to listen to */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <h3 className="font-display text-lg font-bold text-foreground px-4 pt-3 pb-2">
          Who to listen to
        </h3>
        {allSongsLoading ? (
          <div className="px-4 pb-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          suggestedArtists.map((artist) => (
            <button
              key={artist.id}
              onClick={() => navigate(`/profile/${artist.id}`)}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Music size={18} className="text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{artist.name}</p>
                <p className="text-xs text-muted-foreground truncate">@{artist.username}</p>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-semibold">
                View
              </span>
            </button>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground px-4">
        plugg © {new Date().getFullYear()} · Built local 🇺🇬
      </p>
    </aside>
  );
};

export default RightPanel;
