import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Heart, ChevronDown, Share2, Shuffle, Repeat, Volume2, Gift } from "lucide-react";
import { Song, getArtistIdByName } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import SongCover from "@/components/SongCover";
import TipModal from "@/components/TipModal";

interface FullPlayerProps {
  song: Song;
  isPlaying: boolean;
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onLike: () => void;
  onClose: () => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

import { usePlayer } from "@/context/PlayerContext";

const FullPlayer = ({ song, isPlaying, onToggle, onNext, onPrev, onLike, onClose }: FullPlayerProps) => {
  const { currentTime, duration, seek, volume, setVolume, isShuffle, isRepeat, toggleShuffle, toggleRepeat } = usePlayer();
  const navigate = useNavigate();
  const [tipOpen, setTipOpen] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: song.title,
      text: `Check out ${song.title} by ${song.artistName} on Plugg`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} — ${shareData.url}`);
        toast({ title: "Link copied", description: "Share link copied to clipboard." });
      }
    } catch {
      // user cancelled
    }
  };

  const goToArtist = () => {
    const id = getArtistIdByName(song.artistName);
    if (id) {
      onClose();
      navigate(`/artist/${id}`);
    }
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-[60] bg-background flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 lg:px-8 py-3 border-b border-border">
        <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground" aria-label="Close player">
          <ChevronDown size={22} />
        </button>
        <span className="text-sm font-semibold text-foreground">Now Playing</span>
        <div className="w-10" />
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="lg:hidden flex-1 flex flex-col px-6 pt-8 pb-12">
        {/* Album Art (Spinning Vinyl + Circular Visualizer) */}
        <div className="flex-1 flex items-center justify-center py-4 relative">
          {/* Circular Audio Visualizer Halo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {isPlaying && Array.from({ length: 72 }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{ 
                  transform: `rotate(${i * 5}deg) translateY(-125px)`,
                }}
              >
                <motion.div
                  className="w-1 bg-white/40 rounded-full"
                  initial={{ height: 4 }}
                  animate={{ 
                    height: [4, Math.random() * 30 + 12, 4],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{ 
                    duration: Math.random() * 0.4 + 0.3, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: i * 0.01
                  }}
                  style={{ transformOrigin: "bottom" }}
                />
              </div>
            ))}
          </div>

          {/* Spinning Circle Art */}
          <motion.div
            key={song.id}
            animate={{ 
              rotate: isPlaying ? 360 : 0 
            }}
            transition={{ 
              duration: 15, 
              repeat: isPlaying ? Infinity : 0, 
              ease: "linear" 
            }}
            className="w-full aspect-square max-w-[240px] relative z-10"
          >
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.9)] relative">
              <SongCover song={song} size={400} rounded="none" className="w-full h-full object-cover" />
              {/* Vinyl center hole effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-black/30" />
              <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-background rounded-full border-2 border-white/20 z-20" />
            </div>
          </motion.div>
        </div>

        {/* Info & Actions Row */}
        <div className="mt-8 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-foreground truncate leading-tight tracking-tight">{song.title}</h2>
            <button onClick={goToArtist} className="text-base text-muted-foreground mt-1.5 font-bold hover:text-primary transition-colors">
              {song.artistName}
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={onLike}
              className={`p-2.5 rounded-full transition-all ${
                song.liked ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
            >
              <Heart size={24} fill={song.liked ? "currentColor" : "none"} strokeWidth={2.5} />
            </button>
            <button onClick={handleShare} className="p-2.5 rounded-full text-muted-foreground">
              <Share2 size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">
          <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-full">
            <Play size={10} fill="currentColor" /> {formatCount(song.plays)}
          </span>
        </div>

        {/* Progress Slider */}
        <div className="mt-10 space-y-3">
          <div 
            className="relative h-1.5 bg-secondary/50 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              seek(ratio * (duration || 1));
            }}
          >
            <div 
              className="absolute h-full bg-primary rounded-full transition-all" 
              style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-xl" />
            </div>
          </div>
          <div className="flex justify-between text-[11px] font-bold text-muted-foreground tabular-nums">
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>{formatDuration(Math.floor(duration || song.duration))}</span>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="mt-10 flex items-center justify-between">
          <button onClick={toggleShuffle} className={isShuffle ? "text-primary" : "text-muted-foreground"} aria-label="Shuffle">
            <Shuffle size={22} strokeWidth={2.5} />
          </button>
          
          <div className="flex items-center gap-8">
            <button onClick={onPrev} className="text-foreground active:text-primary transition-colors">
              <SkipBack size={32} fill="currentColor" />
            </button>
            <button
              onClick={onToggle}
              className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/30 active:scale-90 transition-all"
            >
              {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1.5" />}
            </button>
            <button onClick={onNext} className="text-foreground active:text-primary transition-colors">
              <SkipForward size={32} fill="currentColor" />
            </button>
          </div>

          <button onClick={toggleRepeat} className={isRepeat ? "text-primary" : "text-muted-foreground"} aria-label="Repeat">
            <Repeat size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left: ambient art */}
        <div className="relative flex-1 flex items-center justify-center p-12 overflow-hidden">
          {/* Backdrop blur */}
          <div className="absolute inset-0">
            <img src={song.coverUrl || song.artistAvatar} alt="" className="w-full h-full object-cover blur-3xl opacity-30 scale-110" />
            <div className="absolute inset-0 bg-background/60" />
          </div>
          {/* Foreground art */}
          <motion.img
            key={song.id}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            src={song.coverUrl || song.artistAvatar}
            alt={song.title}
            className="relative w-[min(60vh,28rem)] h-[min(60vh,28rem)] rounded-3xl shadow-2xl object-cover ring-1 ring-border"
          />
        </div>

        {/* Right: details + controls */}
        <div className="w-[420px] xl:w-[480px] border-l border-border bg-card/50 backdrop-blur flex flex-col">
          <div className="flex-1 overflow-y-auto px-8 py-10 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Now playing</p>
              <h2 className="font-display text-3xl font-bold text-foreground mt-2 leading-tight">{song.title}</h2>
              <button onClick={goToArtist} className="text-base text-muted-foreground mt-1 hover:text-foreground hover:underline">
                {song.artistName}
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Play size={14} /> {formatCount(song.plays)} plays
              </span>
              <span>·</span>
              <span>{formatDuration(song.duration)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onLike}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full border transition-all ${
                  song.liked ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Heart size={18} fill={song.liked ? "currentColor" : "none"} />
                <span className="text-sm font-bold">{song.liked ? "Favourited" : "Favourite"}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
              >
                <Share2 size={18} />
                <span className="text-sm font-bold">Share</span>
              </button>
            </div>
          </div>

          {/* Bottom bar: progress + transport */}
          <div className="border-t border-border/50 px-8 py-8 space-y-6 bg-background/40">
            <div className="space-y-2">
              <div 
                className="relative h-1.5 bg-secondary rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  seek(ratio * (duration || 1));
                }}
              >
                <div 
                  className="absolute h-full bg-primary rounded-full transition-all group-hover:bg-[#9DFF4D]" 
                  style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-muted-foreground tabular-nums">
                <span>{formatDuration(Math.floor(currentTime))}</span>
                <span>{formatDuration(Math.floor(duration || song.duration))}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={toggleShuffle} className={isShuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"} aria-label="Shuffle">
                <Shuffle size={20} />
              </button>
              <div className="flex items-center gap-8">
                <button onClick={onPrev} className="text-foreground hover:text-primary transition-colors" aria-label="Previous">
                  <SkipBack size={28} fill="currentColor" />
                </button>
                <button
                  onClick={onToggle}
                  className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-primary/20"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={onNext} className="text-foreground hover:text-primary transition-colors" aria-label="Next">
                  <SkipForward size={28} fill="currentColor" />
                </button>
              </div>
              <button onClick={toggleRepeat} className={isRepeat ? "text-primary" : "text-muted-foreground hover:text-foreground"} aria-label="Repeat">
                <Repeat size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <Volume2 size={18} className="text-muted-foreground" />
              <div 
                className="flex-1 relative h-1.5 bg-secondary rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  setVolume(Math.max(0, Math.min(1, ratio)));
                }}
              >
                <div 
                  className="absolute h-full bg-foreground rounded-full transition-all group-hover:bg-primary" 
                  style={{ width: `${volume * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FullPlayer;
