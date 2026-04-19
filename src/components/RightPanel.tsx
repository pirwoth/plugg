import { Search, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mockArtists, trendingSongs } from "@/lib/mock-data";

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
  const suggestedArtists = mockArtists.slice(0, 5);
  const topTrending = trendingSongs.slice(0, 5);

  return (
    <aside className="sticky top-0 h-screen overflow-y-auto py-4 pl-2 space-y-4">
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
        {topTrending.map((song, i) => (
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
        ))}
      </div>

      {/* Who to listen to */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <h3 className="font-display text-lg font-bold text-foreground px-4 pt-3 pb-2">
          Who to listen to
        </h3>
        {suggestedArtists.map((artist) => (
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
        ))}
      </div>

      <p className="text-xs text-muted-foreground px-4">
        plugg © {new Date().getFullYear()} · Built local 🇺🇬
      </p>
    </aside>
  );
};

export default RightPanel;
