import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import SongSection from "@/components/SongSection";
import GenreChips from "@/components/GenreChips";
import OnboardingCarousel from "@/components/OnboardingCarousel";
import TrendingHero from "@/components/TrendingHero";
import { trendingSongs, newSongs, topHits, songsByGenre, Genre } from "@/lib/mock-data";
import { usePlayer } from "@/context/PlayerContext";

const ONBOARDED_KEY = "plugg.onboarded.v1";

const Index = () => {
  const { currentSong, isPlaying, play } = usePlayer();
  const [genre, setGenre] = useState<Genre | "all">("all");
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Simulated initial loading shimmer
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

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

  const filtered = (list: typeof trendingSongs) =>
    genre === "all" ? list : list.filter((s) => s.genre === genre);

  return (
    <AppShell title="Home">
      <TrendingHero songs={trendingSongs.slice(0, 5)} onPlay={play} />
      <GenreChips active={genre} onChange={setGenre} />
      <SongSection
        title="🔥 Trending"
        songs={filtered(trendingSongs)}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlay={play}
        loading={loading}
        emptyMessage="No trending songs in this genre yet."
      />
      <SongSection
        title="🆕 New Uploads"
        songs={filtered(newSongs)}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlay={play}
        loading={loading}
        emptyMessage="No fresh uploads here yet — try All."
      />
      <SongSection
        title="🏆 Top Hits"
        songs={filtered(topHits)}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlay={play}
        loading={loading}
        emptyMessage="No hits in this genre yet."
      />
      {/* Surface songs for the picked genre when filters hide top lists */}
      {genre !== "all" && songsByGenre(genre).length > 0 && (
        <SongSection
          title={`More in ${genre}`}
          songs={songsByGenre(genre)}
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlay={play}
        />
      )}

      <OnboardingCarousel open={showOnboarding} onClose={closeOnboarding} />
    </AppShell>
  );
};

export default Index;
