import { useEffect, useState } from "react";
import { Disc3, Music2 } from "lucide-react";
import SongSection from "@/components/SongSection";
import OnboardingCarousel from "@/components/OnboardingCarousel";
import TrendingHero from "@/components/TrendingHero";
import { useTrendingSongs, useNewSongs, useTopHits } from "@/hooks/useSongs";
import { useTrendingPlaylists, useNewPlaylists, useTopPlaylists } from "@/hooks/usePlaylists";
import { usePlayer } from "@/context/PlayerContext";
import { Song } from "@/lib/mock-data";

const ONBOARDED_KEY = "plugg.onboarded.v1";
type Tab = "tracks" | "playlists";

const Index = () => {
  const { currentSong, isPlaying, play } = usePlayer();
  const [tab, setTab] = useState<Tab>("tracks");
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Tracks data
  const { songs: trendingSongs, isLoading: trendingLoading } = useTrendingSongs();
  const { songs: newSongs, isLoading: newLoading } = useNewSongs();
  const { songs: topHits, isLoading: topLoading } = useTopHits();
  const tracksLoading = trendingLoading || newLoading || topLoading;

  // Playlists data
  const { songs: trendingPlaylists, isLoading: plTrendingLoading } = useTrendingPlaylists();
  const { songs: newPlaylists, isLoading: plNewLoading } = useNewPlaylists();
  const { songs: topPlaylists, isLoading: plTopLoading } = useTopPlaylists();
  const playlistsLoading = plTrendingLoading || plNewLoading || plTopLoading;

  // First-launch onboarding
  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDED_KEY)) setShowOnboarding(true);
    } catch {/* noop */}
  }, []);

  const closeOnboarding = () => {
    try { localStorage.setItem(ONBOARDED_KEY, "1"); } catch {/* noop */}
    setShowOnboarding(false);
  };

  const handlePlay = (song: Song, queue?: Song[]) => play(song, queue);

  return (
    <div className="animate-in fade-in duration-500">

      {/* ── Tab Switcher ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex gap-1 p-1 bg-secondary rounded-full max-w-xs">
          <button
            onClick={() => setTab("tracks")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
              tab === "tracks"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Music2 size={13} />
            Tracks
          </button>
          <button
            onClick={() => setTab("playlists")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
              tab === "playlists"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Disc3 size={13} />
            Playlists
          </button>
        </div>
      </div>

      {/* ── TRACKS TAB ── */}
      {tab === "tracks" && (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
          <TrendingHero songs={trendingSongs.slice(0, 5)} onPlay={handlePlay} loading={trendingLoading} />
          <SongSection
            title="🔥 Trending"
            songs={trendingSongs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            loading={tracksLoading}
            emptyMessage="No trending tracks yet."
          />
          <SongSection
            title="🆕 New Uploads"
            songs={newSongs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            loading={tracksLoading}
            emptyMessage="No fresh uploads yet."
          />
          <SongSection
            title="🏆 Top Hits"
            songs={topHits}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            loading={tracksLoading}
            emptyMessage="No top hits yet."
          />
        </div>
      )}

      {/* ── PLAYLISTS TAB ── */}
      {tab === "playlists" && (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
          {/* Purple-tinted hero for DJ mixes */}
          <PlaylistHero playlists={trendingPlaylists.slice(0, 5)} onPlay={handlePlay} loading={plTrendingLoading} />
          <SongSection
            title="🎧 Trending Mixes"
            songs={trendingPlaylists}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            loading={playlistsLoading}
            emptyMessage="No trending mixes yet."
          />
          <SongSection
            title="🆕 New Mixes"
            songs={newPlaylists}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            loading={playlistsLoading}
            emptyMessage="No new mixes yet."
          />
          <SongSection
            title="⬇️ Most Downloaded"
            songs={topPlaylists}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            loading={playlistsLoading}
            emptyMessage="No mixes with downloads yet."
          />
        </div>
      )}

      <OnboardingCarousel open={showOnboarding} onClose={closeOnboarding} />
    </div>
  );
};

// ── Playlist Hero (purple-tinted variant of TrendingHero) ──
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import SongCover from "@/components/SongCover";
import { TrendingHeroSkeleton } from "@/components/Skeleton";

const PlaylistHero = ({
  playlists,
  onPlay,
  loading,
}: {
  playlists: Song[];
  onPlay: (song: Song, queue?: Song[]) => void;
  loading?: boolean;
}) => {
  if (loading) return <TrendingHeroSkeleton />;
  if (playlists.length === 0) return null;
  return (
    <section className="px-4 pt-4 pb-2">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-lg font-bold text-foreground">🔥 Hottest Mixes</h2>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Top 5</span>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pt-4 pb-4 snap-x snap-mandatory">
        {playlists.map((pl, i) => (
          <motion.button
            key={pl.id}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPlay(pl, playlists)}
            className="snap-start shrink-0 w-44 sm:w-52 group text-left focus:outline-none"
          >
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-lg ring-2 ring-violet-500/30">
              <SongCover song={pl} size={208} rounded="2xl" className="w-full h-full" />
              {/* Rank badge */}
              <span className="absolute top-2 left-2 text-[40px] sm:text-5xl font-display font-black text-white/95 leading-none drop-shadow-md">
                {i + 1}
              </span>
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-end justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg">
                  <Play size={16} fill="currentColor" className="ml-0.5" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-violet-900/50 via-transparent to-transparent pointer-events-none" />
              {/* DJ badge */}
              <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-600/80 text-white backdrop-blur-sm uppercase tracking-wide">
                Mix
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground truncate">{pl.title}</p>
            <p className="text-xs text-muted-foreground truncate">{pl.artistName}</p>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default Index;
