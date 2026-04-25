import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { Song } from "@/lib/mock-data";
import { TrendingHeroSkeleton } from "@/components/Skeleton";
import SongCover from "@/components/SongCover";

interface TrendingHeroProps {
  songs: Song[];
  onPlay: (song: Song, playlist?: Song[]) => void;
  loading?: boolean;
}

/**
 * Horizontal rank carousel of the top 5 trending tracks. Visible on home,
 * gives the feed a magazine-cover feel.
 */
const TrendingHero = ({ songs, onPlay, loading }: TrendingHeroProps) => {
  if (loading) return <TrendingHeroSkeleton />;
  if (songs.length === 0) return null;
  return (
    <section className="px-4 pt-4 pb-2">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-lg font-bold text-foreground">Trending this week</h2>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Top 5</span>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pt-4 pb-4 snap-x snap-mandatory">
        {songs.map((song, i) => (
          <motion.button
            key={song.id}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPlay(song, songs)}
            className="snap-start shrink-0 w-44 sm:w-52 group text-left focus:outline-none"
          >
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-lg">
              <SongCover song={song} size={208} rounded="2xl" className="w-full h-full" />
              {/* Rank badge */}
              <span className="absolute top-2 left-2 text-[40px] sm:text-5xl font-display font-black text-white/95 leading-none drop-shadow-md">
                {i + 1}
              </span>
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-end justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                  <Play size={16} fill="currentColor" className="ml-0.5" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground truncate">{song.title}</p>
            <p className="text-xs text-muted-foreground truncate">{song.artistName}</p>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default TrendingHero;
