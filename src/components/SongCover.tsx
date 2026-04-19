import { Song } from "@/lib/mock-data";

interface SongCoverProps {
  song: Song;
  size?: number;
  className?: string;
  rounded?: "md" | "lg" | "xl" | "2xl";
}

/**
 * Deterministic gradient cover art for a song. Uses the song's stored
 * cover gradient + the first character of the title as a typographic mark.
 */
const SongCover = ({ song, size = 48, className = "", rounded = "lg" }: SongCoverProps) => {
  const initial = song.title.charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `linear-gradient(135deg, ${song.cover.from}, ${song.cover.to})`,
      }}
      className={`relative shrink-0 overflow-hidden flex items-center justify-center text-white shadow-md rounded-${rounded} ${className}`}
    >
      <span
        className="font-display font-black tracking-tight drop-shadow-sm select-none"
        style={{ fontSize: Math.max(12, size * 0.42) }}
      >
        {initial}
      </span>
      {/* subtle vinyl shine */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />
    </div>
  );
};

export default SongCover;
