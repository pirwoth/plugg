import { useEffect, useState } from "react";
import { Play, Pause, X, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Maximize2 } from "lucide-react";
import { Song, getArtistIdByName } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/context/PlayerContext";
import { useNavigate } from "react-router-dom";
import SongCover from "@/components/SongCover";
import HeartBurstButton from "@/components/HeartBurstButton";

interface MiniPlayerProps {
  song: Song | null;
  isPlaying: boolean;
  onToggle: () => void;
  onClose: () => void;
  onExpand: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const MiniPlayer = ({ song, isPlaying, onToggle, onClose, onExpand }: MiniPlayerProps) => {
  const { next, prev, toggleLike, currentTime, duration, seek, volume, setVolume, isShuffle, isRepeat, toggleShuffle, toggleRepeat } = usePlayer();
  const navigate = useNavigate();

  const goToArtist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!song) return;
    const id = getArtistIdByName(song.artistName);
    if (id) navigate(`/artist/${id}`);
  };

  if (!song) return null;
  const pct = Math.min(100, (currentTime / (duration || 1)) * 100);

  return (
    <AnimatePresence>
      {song && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
          className="fixed bottom-14 lg:bottom-0 left-0 right-0 z-40 bg-card border-t border-border"
        >
          {/* Mini progress bar across the top */}
          <div className="lg:hidden h-0.5 bg-secondary">
            <div className="h-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
          </div>

          {/* MOBILE: compact row with cover + title + play */}
          <div className="lg:hidden px-3 py-2 flex items-center gap-2">
            <button onClick={onExpand} aria-label="Expand player" className="shrink-0">
              <SongCover song={song} size={44} />
            </button>
            <div className="min-w-0 flex-1">
              <button
                onClick={onExpand}
                className="text-sm font-semibold truncate text-foreground block max-w-full text-left"
              >
                {song.title}
              </button>
              <button
                onClick={goToArtist}
                className="text-xs text-muted-foreground truncate hover:text-foreground hover:underline block max-w-full text-left"
              >
                {song.artistName}
              </button>
            </div>
            <HeartBurstButton liked={!!song.liked} onToggle={() => toggleLike(song.id)} size={18} className="p-2" />
            <button
              onClick={onToggle}
              className="p-2 rounded-full bg-primary text-primary-foreground"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={onClose} className="p-2 text-muted-foreground" aria-label="Close">
              <X size={16} />
            </button>
          </div>

          {/* DESKTOP: full-width Spotify-style bar */}
          <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-4 px-4 py-3">
            {/* Left: track info */}
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={onExpand} className="shrink-0">
                <SongCover song={song} size={56} />
              </button>
              <div className="min-w-0">
                <button
                  onClick={onExpand}
                  className="text-sm font-semibold text-foreground truncate hover:underline block max-w-full text-left"
                >
                  {song.title}
                </button>
                <button
                  onClick={goToArtist}
                  className="text-xs text-muted-foreground truncate hover:text-foreground hover:underline block max-w-full text-left"
                >
                  {song.artistName}
                </button>
              </div>
              <HeartBurstButton liked={!!song.liked} onToggle={() => toggleLike(song.id)} size={16} className="ml-2 p-1.5" />
            </div>

            {/* Center: controls + progress */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleShuffle}
                  className={isShuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                  aria-label="Shuffle"
                >
                  <Shuffle size={16} />
                </button>
                <button onClick={prev} className="text-foreground hover:text-primary" aria-label="Previous">
                  <SkipBack size={18} fill="currentColor" />
                </button>
                <button
                  onClick={onToggle}
                  className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                </button>
                <button onClick={next} className="text-foreground hover:text-primary" aria-label="Next">
                  <SkipForward size={18} fill="currentColor" />
                </button>
                <button
                  onClick={toggleRepeat}
                  className={isRepeat ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                  aria-label="Repeat"
                >
                  <Repeat size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2 w-full">
                <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
                  {formatTime(currentTime)}
                </span>
                <div
                  className="group relative flex-1 h-1 bg-secondary rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    seek(ratio * (duration || 1));
                  }}
                >
                  <div
                    className="h-full bg-foreground group-hover:bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums w-8">
                  {formatTime(duration || song.duration)}
                </span>
              </div>
            </div>

            {/* Right: volume + expand + close */}
            <div className="flex items-center justify-end gap-3">
              <Volume2 size={16} className="text-muted-foreground" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-24 h-1 accent-primary cursor-pointer"
                aria-label="Volume"
              />
              <button
                onClick={onExpand}
                className="p-1.5 text-muted-foreground hover:text-foreground"
                aria-label="Expand"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MiniPlayer;
