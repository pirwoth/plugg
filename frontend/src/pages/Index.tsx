import { useEffect, useState } from "react";
import { Search, Play, UserPlus, Music2, Disc3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTrendingSongs, useNewSongs, useTopHits, useTopArtists } from "@/hooks/useSongs";
import { useTrendingPlaylists, useNewPlaylists, useTopPlaylists } from "@/hooks/usePlaylists";
import { usePlayer } from "@/context/PlayerContext";
import { Song } from "@/lib/mock-data";
import OnboardingCarousel from "@/components/OnboardingCarousel";
import SongCover from "@/components/SongCover";

const ONBOARDED_KEY = "plugg.onboarded.v1";
type Tab = "tracks" | "playlists";

const Index = () => {
  const navigate = useNavigate();
  const { currentSong, isPlaying, play } = usePlayer();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<Tab>("tracks");
  const [direction, setDirection] = useState(0);

  const handleTabChange = (newTab: Tab) => {
    if (newTab === tab) return;
    setDirection(newTab === "tracks" ? -1 : 1);
    setTab(newTab);
  };

  // Data Hooks
  const { songs: trendingSongs } = useTrendingSongs();
  const { songs: newSongs } = useNewSongs();
  const { songs: topHits } = useTopHits();
  const { data: topArtists } = useTopArtists();
  
  const { songs: trendingPlaylists } = useTrendingPlaylists();
  const { songs: newPlaylists } = useNewPlaylists();
  const { songs: topPlaylists } = useTopPlaylists();

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDED_KEY)) setShowOnboarding(true);
    } catch {/* noop */}
  }, []);

  const closeOnboarding = () => {
    try { localStorage.setItem(ONBOARDED_KEY, "1"); } catch {/* noop */}
    setShowOnboarding(false);
  };

  const formatViews = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  const handlePlay = (song: Song, queue?: Song[]) => play(song, queue);

  const variants = {
    initial: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-background pb-32 overflow-x-hidden">
      {/* ── Search Bar ── */}
      <div className="px-5 pt-2 pb-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search artists"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => navigate("/search")}
            className="w-full bg-secondary/50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-1 focus:ring-primary/30 transition-all outline-none"
          />
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="px-5 mb-6">
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-full w-full max-w-sm mx-auto">
          <button
            onClick={() => handleTabChange("tracks")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
              tab === "tracks"
                ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Music2 size={14} strokeWidth={2.5} />
            Tracks
          </button>
          <button
            onClick={() => handleTabChange("playlists")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
              tab === "playlists"
                ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Disc3 size={14} strokeWidth={2.5} />
            Playlists
          </button>
        </div>
      </div>

      <div className="px-5">
        <AnimatePresence mode="wait" custom={direction}>
          {tab === "tracks" ? (
            <motion.div
              key="tracks"
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="space-y-8"
            >
              {/* ── Top 5 Horizontal Hero ── */}
              <section className="px-0">
                <div className="flex items-baseline justify-between px-0 mb-4">
                  <h2 className="text-xl font-bold tracking-tight">Trending this week</h2>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold bg-secondary/50 px-2 py-0.5 rounded-full">Top 5</span>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-0 pb-2">
                  {trendingSongs.slice(0, 5).map((song, i) => (
                    <motion.button
                      key={song.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handlePlay(song, trendingSongs)}
                      className="snap-start shrink-0 w-44 group text-left focus:outline-none"
                    >
                      <div className="relative aspect-square w-full rounded-[32px] overflow-hidden shadow-2xl border border-white/5 bg-secondary/30">
                        <SongCover song={song} size={200} rounded="none" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        {/* Rank Number */}
                        <div className="absolute top-2 left-3 pointer-events-none">
                          <span className="text-[56px] font-black leading-none text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] select-none opacity-90">
                            {i + 1}
                          </span>
                        </div>
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                      </div>
                      <div className="mt-3 px-1">
                        <p className="text-[14px] font-bold text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                          {song.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate font-medium mt-0.5">
                          {song.artistName}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>
              {/* ── Trending now Card ── */}
              <section className="bg-secondary/30 rounded-[32px] p-6 border border-white/5 shadow-xl">
                <h2 className="text-xl font-bold tracking-tight mb-5">Trending now</h2>
                <div className="space-y-5">
                  {trendingSongs.slice(0, 5).map((song, i) => (
                    <button key={song.id} onClick={() => handlePlay(song, trendingSongs)} className="w-full flex items-center gap-4 group text-left">
                      <span className="w-4 text-[13px] font-bold text-muted-foreground/40 tabular-nums">{i + 1}</span>
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-secondary/50 shadow-lg">
                        <SongCover song={song} size={48} rounded="none" className="w-full h-full object-cover transition-transform group-active:scale-95" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-foreground truncate group-hover:text-primary transition-colors leading-tight">{song.title}</p>
                        <p className="text-[12px] text-muted-foreground truncate mt-0.5">{song.artistName}</p>
                      </div>
                      <div className="text-[11px] font-bold text-muted-foreground/40 tabular-nums">
                        {formatViews(song.plays)}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* ── Who to listen to Card ── */}
              <section className="bg-secondary/30 rounded-[32px] p-6 border border-white/5 shadow-xl">
                <h2 className="text-xl font-bold tracking-tight mb-5">Who to listen to</h2>
                <div className="space-y-5">
                  {topArtists?.slice(0, 5).map((artist) => (
                    <div key={artist.id} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/5 shadow-lg">
                        {artist.image_url ? (
                          <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-muted-foreground/40"><UserPlus size={20} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-foreground truncate leading-tight">{artist.name}</p>
                        <p className="text-[12px] text-muted-foreground truncate mt-0.5">@{artist.slug || artist.name.toLowerCase().replace(/\s+/g, '')}</p>
                      </div>
                      <button onClick={() => navigate(`/profile/${artist.id}`)} className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-xs font-black hover:scale-105 active:scale-95 transition-all shadow-md">View</button>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── New Uploads Section ── */}
              <section className="bg-secondary/30 rounded-[32px] p-6 border border-white/5 shadow-xl">
                <h2 className="text-xl font-bold tracking-tight mb-5">New Uploads</h2>
                <div className="space-y-5">
                  {newSongs.slice(0, 5).map((song) => (
                    <button key={song.id} onClick={() => handlePlay(song, newSongs)} className="w-full flex items-center gap-4 group text-left">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-secondary/50 shadow-lg">
                        <SongCover song={song} size={48} rounded="none" className="w-full h-full object-cover transition-transform group-active:scale-95" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-foreground truncate group-hover:text-primary transition-colors leading-tight">{song.title}</p>
                        <p className="text-[12px] text-muted-foreground truncate mt-0.5">{song.artistName}</p>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                        New
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="playlists"
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="space-y-8"
            >
              {/* ── Top 5 Horizontal Hero for Playlists ── */}
              <section className="px-0">
                <div className="flex items-baseline justify-between px-0 mb-4">
                  <h2 className="text-xl font-bold tracking-tight">Top Mixes</h2>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold bg-secondary/50 px-2 py-0.5 rounded-full">Top 5</span>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-0 pb-2">
                  {trendingPlaylists.slice(0, 5).map((pl, i) => (
                    <motion.button
                      key={pl.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handlePlay(pl, trendingPlaylists)}
                      className="snap-start shrink-0 w-44 group text-left focus:outline-none"
                    >
                      <div className="relative aspect-square w-full rounded-[32px] overflow-hidden shadow-2xl border border-white/5 bg-secondary/30">
                        <SongCover song={pl} size={200} rounded="none" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        {/* Rank Number */}
                        <div className="absolute top-2 left-3 pointer-events-none">
                          <span className="text-[56px] font-black leading-none text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] select-none opacity-90">
                            {i + 1}
                          </span>
                        </div>
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                      </div>
                      <div className="mt-3 px-1">
                        <p className="text-[14px] font-bold text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                          {pl.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate font-medium mt-0.5">
                          {pl.artistName}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>
              {/* ── Trending Mixes Card ── */}
              <section className="bg-secondary/30 rounded-[32px] p-6 border border-white/5 shadow-xl">
                <h2 className="text-xl font-bold tracking-tight mb-5">Trending Mixes</h2>
                <div className="space-y-5">
                  {trendingPlaylists.slice(0, 5).map((pl, i) => (
                    <button key={pl.id} onClick={() => handlePlay(pl, trendingPlaylists)} className="w-full flex items-center gap-4 group text-left">
                      <span className="w-4 text-[13px] font-bold text-muted-foreground/40 tabular-nums">{i + 1}</span>
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-secondary/50 shadow-lg">
                        <SongCover song={pl} size={48} rounded="none" className="w-full h-full object-cover transition-transform group-active:scale-95" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-foreground truncate group-hover:text-violet-400 transition-colors leading-tight">{pl.title}</p>
                        <p className="text-[12px] text-muted-foreground truncate mt-0.5">{pl.artistName}</p>
                      </div>
                      <div className="text-[11px] font-bold text-muted-foreground/40 tabular-nums">
                        {formatViews(pl.plays)}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* ── Most Downloaded Mixes ── */}
              <section className="bg-secondary/30 rounded-[32px] p-6 border border-white/5 shadow-xl">
                <h2 className="text-xl font-bold tracking-tight mb-5">Most Downloaded</h2>
                <div className="space-y-5">
                  {topPlaylists.slice(0, 5).map((pl, i) => (
                    <button key={pl.id} onClick={() => handlePlay(pl, topPlaylists)} className="w-full flex items-center gap-4 group text-left">
                      <span className="w-4 text-[13px] font-bold text-muted-foreground/40 tabular-nums">{i + 1}</span>
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-secondary/50 shadow-lg">
                        <SongCover song={pl} size={48} rounded="none" className="w-full h-full object-cover transition-transform group-active:scale-95" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-foreground truncate group-hover:text-primary transition-colors leading-tight">{pl.title}</p>
                        <p className="text-[12px] text-muted-foreground truncate mt-0.5">{pl.artistName}</p>
                      </div>
                      <div className="text-[11px] font-bold text-muted-foreground/40 tabular-nums">
                        {pl.downloads} DL
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <OnboardingCarousel open={showOnboarding} onClose={closeOnboarding} />
    </div>
  );
};

export default Index;
