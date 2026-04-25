import { Play, Download } from "lucide-react";
import { Song, getArtistIdByName } from "@/lib/mock-data";
import { supabaseUrl } from "@/lib/supabase";
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
      className="group flex items-center gap-3 px-4 py-2 rounded-md hover:bg-secondary/60 active:bg-secondary cursor-pointer transition-colors focus-within:bg-secondary/60"
    >
      {/* Rank / EQ / Play hover */}
      <div className="relative flex-shrink-0 w-6 h-6 flex items-center justify-center text-muted-foreground">
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
      <div className="flex-shrink-0">
        <SongCover song={song} size={44} rounded="lg" />
      </div>

      {/* Title + artist */}
      <div className="flex-1 min-w-0 pr-2 sm:pr-4">
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

      {/* Stats and Duration */}
      <div className="flex flex-shrink-0 items-center justify-end text-xs text-muted-foreground tabular-nums">
        <div className="hidden sm:flex items-center gap-3 mr-4">
          <span title="Plays">▶ {formatCount(song.plays)}</span>
          <a
            href={`${supabaseUrl}/functions/v1/download?url=${encodeURIComponent(song.audioUrl)}&filename=${encodeURIComponent(`${song.title} - ${song.artistName}.mp3`)}`}
            download={`${song.title} - ${song.artistName}.mp3`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:text-primary transition-colors flex items-center justify-center p-1 hover:bg-primary/10 rounded-full"
            title="Download song"
          >
            <Download size={14} />
          </a>
        </div>
        <span className="w-10 text-right">{formatDuration(song.duration)}</span>
      </div>
    </motion.div>
  );
};

export default SongItem;
