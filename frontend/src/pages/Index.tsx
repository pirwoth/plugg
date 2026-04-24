import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import SongSection from "@/components/SongSection";
import GenreChips from "@/components/GenreChips";
import OnboardingCarousel from "@/components/OnboardingCarousel";
import TrendingHero from "@/components/TrendingHero";
import { Genre } from "@/lib/mock-data";
import { useTrendingSongs, useNewSongs, useTopHits, useSongsByGenre, useAllSongs } from "@/hooks/useSongs";
import { usePlayer } from "@/context/PlayerContext";

const ONBOARDED_KEY = "plugg.onboarded.v1";

const Index = () => {
  const { currentSong, isPlaying, play } = usePlayer();
  const [genre, setGenre] = useState<Genre | "all">("all");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { songs: trendingSongs, isLoading: trendingLoading } = useTrendingSongs();
  const { songs: newSongs, isLoading: newLoading } = useNewSongs();
  const { songs: topHits, isLoading: topLoading } = useTopHits();
  const { songs: genreSongs } = useSongsByGenre(genre);

  const mainLoading = trendingLoading || newLoading || topLoading;

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
        loading={mainLoading}
        emptyMessage="No trending songs in this genre yet."
      />
      <SongSection
        title="🆕 New Uploads"
        songs={filtered(newSongs)}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlay={play}
        loading={mainLoading}
        emptyMessage="No fresh uploads here yet — try All."
      />
      <SongSection
        title="🏆 Top Hits"
        songs={filtered(topHits)}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlay={play}
        loading={mainLoading}
        emptyMessage="No hits in this genre yet."
      />
      {/* Surface songs for the picked genre when filters hide top lists */}
      {genre !== "all" && genreSongs.length > 0 && (
        <SongSection
          title={`More in ${genre}`}
          songs={genreSongs}
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
