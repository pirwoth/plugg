import { Play } from "lucide-react";
import { Song, getArtistIdByName } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SongCover from "@/components/SongCover";
import EqualizerBars from "@/components/EqualizerBars";

interface SongItemProps {
  song: Song;
  isPlaying: boolean;
  onPlay: () => void;
  index: number;
  rank: number;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const SongItem = ({ song, isPlaying, onPlay, index, rank }: SongItemProps) => {
  const navigate = useNavigate();
  const artistId = getArtistIdByName(song.artistName);
  const goToArtist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (artistId) navigate(`/profile/${artistId}`);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.18 }}
      onClick={onPlay}
      className="group grid grid-cols-[24px_44px_1fr_auto_auto] items-center gap-3 px-4 py-2 rounded-md hover:bg-secondary/60 active:bg-secondary cursor-pointer transition-colors focus-within:bg-secondary/60"
    >
      {/* Rank / EQ / Play hover */}
      <div className="relative w-6 h-6 flex items-center justify-center text-muted-foreground">
        {isPlaying ? (
          <span className="text-primary group-hover:opacity-0 transition-opacity">
            <EqualizerBars size={14} />
          </span>
        ) : (
          <span className="text-sm tabular-nums group-hover:opacity-0 transition-opacity">{rank}</span>
        )}
        <Play
          size={14}
          fill="currentColor"
          className="absolute inset-0 m-auto text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>

      {/* Cover */}
      <SongCover song={song} size={44} rounded="lg" />

      {/* Title + artist */}
      <div className="min-w-0">
        <p className={`text-sm font-semibold truncate ${isPlaying ? "text-primary" : "text-foreground"}`}>
          {song.title}
        </p>
        <button
          onClick={goToArtist}
          className="text-xs text-muted-foreground truncate mt-0.5 hover:text-primary hover:underline transition-colors block max-w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          {song.artistName}
        </button>
      </div>

      {/* Plays */}
      <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums w-16 text-right">
        ▶ {formatCount(song.plays)}
      </span>

      {/* Date + duration */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground tabular-nums">
        <span className="hidden xs:inline w-20 text-right">{formatDate(song.timestamp)}</span>
        <span className="w-10 text-right">{formatDuration(song.duration)}</span>
      </div>
    </motion.div>
  );
};

export default SongItem;
