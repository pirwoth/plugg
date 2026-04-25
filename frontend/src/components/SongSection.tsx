import { useState } from "react";
import { ChevronDown, ChevronUp, Music } from "lucide-react";
import SongItem from "@/components/SongItem";
import { SongSectionSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { Song } from "@/lib/mock-data";

interface SongSectionProps {
  title: string;
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlay: (song: Song, playlist?: Song[]) => void;
  loading?: boolean;
  emptyMessage?: string;
}

const SongSection = ({
  title, songs, currentSong, isPlaying, onPlay, loading = false, emptyMessage,
}: SongSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? songs.slice(0, 10) : songs.slice(0, 5);
  const canExpand = songs.length > 5;

  if (loading) return <SongSectionSkeleton />;

  return (
    <section className="mb-8">
      <div className="px-4 pt-2 pb-3">
        <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
      </div>

      {songs.length === 0 ? (
        <EmptyState
          icon={Music}
          title="Nothing here yet"
          description={emptyMessage ?? "Try a different filter or check back soon."}
        />
      ) : (
        <div className="px-1">
          {visible.map((song, i) => (
            <SongItem
              key={song.id}
              song={song}
              index={i}
              rank={i + 1}
              isPlaying={isPlaying && currentSong?.id === song.id}
              onPlay={() => onPlay(song, songs)}
            />
          ))}
        </div>
      )}

      {canExpand && (
        <div className="px-4 pt-3">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary font-semibold uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            {expanded ? "Show less" : "Show more"}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      )}
    </section>
  );
};

export default SongSection;
