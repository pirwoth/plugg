import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Heart, ChevronDown, Share2, Shuffle, Repeat, Volume2, Gift } from "lucide-react";
import { Song, getArtistIdByName } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
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

const FullPlayer = ({ song, isPlaying, onToggle, onNext, onPrev, onLike, onClose }: FullPlayerProps) => {
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
      <div className="lg:hidden flex-1 flex flex-col items-center justify-center px-8 gap-6">
        <img
          src={song.artistAvatar}
          alt={song.artistName}
          className="w-40 h-40 rounded-2xl shadow-2xl object-cover"
        />
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">{song.title}</h2>
          <button onClick={goToArtist} className="text-sm text-muted-foreground mt-1 hover:text-foreground hover:underline">
            {song.artistName}
          </button>
        </div>

        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span>▶ {formatCount(song.plays)} plays</span>
        </div>

        <div className="w-full">
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-primary rounded-full" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1:12</span>
            <span>{formatDuration(song.duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <button onClick={onPrev} className="p-3 text-foreground"><SkipBack size={24} /></button>
          <button
            onClick={onToggle}
            className="p-4 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>
          <button onClick={onNext} className="p-3 text-foreground"><SkipForward size={24} /></button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
              song.liked ? "border-primary text-primary" : "border-border text-muted-foreground"
            }`}
          >
            <Heart size={18} fill={song.liked ? "currentColor" : "none"} />
            <span className="text-sm">{song.liked ? "Favourited" : "Favourite"}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 size={18} />
            <span className="text-sm">Share</span>
          </button>
          <button
            onClick={() => setTipOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
          >
            <Gift size={18} />
            <span className="text-sm font-medium">Tip</span>
          </button>
        </div>
      </div>

      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left: ambient art */}
        <div className="relative flex-1 flex items-center justify-center p-12 overflow-hidden">
          {/* Backdrop blur */}
          <div className="absolute inset-0">
            <img src={song.artistAvatar} alt="" className="w-full h-full object-cover blur-3xl opacity-30 scale-110" />
            <div className="absolute inset-0 bg-background/60" />
          </div>
          {/* Foreground art */}
          <motion.img
            key={song.id}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            src={song.artistAvatar}
            alt={song.artistName}
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
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                  song.liked ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart size={16} fill={song.liked ? "currentColor" : "none"} />
                <span className="text-sm font-medium">{song.liked ? "Favourited" : "Favourite"}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <Share2 size={16} />
                <span className="text-sm font-medium">Share</span>
              </button>
              <button
                onClick={() => setTipOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
              >
                <Gift size={16} />
                <span className="text-sm font-medium">Tip artist</span>
              </button>
            </div>
          </div>

          {/* Bottom bar: progress + transport */}
          <div className="border-t border-border px-8 py-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground tabular-nums w-9 text-right">1:12</span>
              <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-primary rounded-full" />
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums w-9">{formatDuration(song.duration)}</span>
            </div>

            <div className="flex items-center justify-between">
              <button className="text-muted-foreground hover:text-foreground" aria-label="Shuffle">
                <Shuffle size={18} />
              </button>
              <div className="flex items-center gap-5">
                <button onClick={onPrev} className="text-foreground hover:text-primary transition-colors" aria-label="Previous">
                  <SkipBack size={22} fill="currentColor" />
                </button>
                <button
                  onClick={onToggle}
                  className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
                </button>
                <button onClick={onNext} className="text-foreground hover:text-primary transition-colors" aria-label="Next">
                  <SkipForward size={22} fill="currentColor" />
                </button>
              </div>
              <button className="text-muted-foreground hover:text-foreground" aria-label="Repeat">
                <Repeat size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Volume2 size={14} />
              <input type="range" min={0} max={100} defaultValue={70} className="flex-1 h-1 accent-primary" aria-label="Volume" />
            </div>
          </div>
        </div>
      </div>

      <TipModal open={tipOpen} onClose={() => setTipOpen(false)} artistName={song.artistName} />
    </motion.div>
  );
};

export default FullPlayer;
