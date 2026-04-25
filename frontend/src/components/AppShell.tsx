import { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import DesktopSidebar from "@/components/DesktopSidebar";
import RightPanel from "@/components/RightPanel";
import Header from "@/components/Header";
import MiniPlayer from "@/components/MiniPlayer";
import FullPlayer from "@/components/FullPlayer";
import MobileTabBar from "@/components/MobileTabBar";
import { usePlayer } from "@/context/PlayerContext";
import { useNavigate } from "react-router-dom";

interface AppShellProps {
  title: string;
  children: ReactNode;
  /** Optional element rendered next to the title (e.g., back button) */
  titleLeading?: ReactNode;
}

const AppShell = ({ title, children, titleLeading }: AppShellProps) => {
  const navigate = useNavigate();
  const {
    currentWithLike,
    isPlaying,
    showFullPlayer,
    toggle,
    close,
    next,
    prev,
    toggleLike,
    openFullPlayer,
    closeFullPlayer,
  } = usePlayer();

  const goSearch = () => navigate("/search");
  const goFavs = () => navigate("/favorites");
  const goHome = () => navigate("/");

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop X-style 3-column layout */}
      <div className="hidden lg:grid mx-auto max-w-[1280px] grid-cols-[88px_minmax(0,1fr)_320px] xl:grid-cols-[260px_minmax(0,640px)_360px] gap-0 px-4">
        <DesktopSidebar
          onSearch={goSearch}
          onOpenFavorites={goFavs}
          onRefresh={goHome}
        />
        <main className="border-x border-border min-h-screen">
          <div className="sticky top-0 z-40 backdrop-blur bg-background/80 border-b border-border px-5 py-4">
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground">{title}</h1>
          </div>
          <div className="py-2">{children}</div>
          <div className={currentWithLike ? "pb-24" : "pb-8"} />
        </main>
        <RightPanel onSearch={goSearch} />
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden max-w-lg mx-auto relative">
        <Header onSearch={goSearch} onRefresh={goHome} onOpenFavorites={goFavs} />

        {children}
        {/* Bottom space: tab bar (~56px) + mini player (~64px) */}
        <div className={currentWithLike ? "pb-36" : "pb-20"} />
      </div>

      {/* Mobile bottom tab bar */}
      <MobileTabBar offsetForPlayer={!!currentWithLike} />

      {/* Player overlays */}
      <MiniPlayer
        song={currentWithLike}
        isPlaying={isPlaying}
        onToggle={toggle}
        onClose={close}
        onExpand={openFullPlayer}
      />

      <AnimatePresence>
        {showFullPlayer && currentWithLike && (
          <FullPlayer
            song={currentWithLike}
            isPlaying={isPlaying}
            onToggle={toggle}
            onNext={next}
            onPrev={prev}
            onLike={() => toggleLike()}
            onClose={closeFullPlayer}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppShell;
