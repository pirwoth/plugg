'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/ThemeProvider';
import { PlayerProvider, usePlayer } from '@/context/PlayerContext';
import { AuthProvider } from '@/context/AuthContext';
import AccentLoader from '@/components/AccentLoader';
import DesktopSidebar from '@/components/DesktopSidebar';
import RightPanel from '@/components/RightPanel';
import Header from '@/components/Header';
import MiniPlayer from '@/components/MiniPlayer';
import FullPlayer from '@/components/FullPlayer';
import MobileTabBar from '@/components/MobileTabBar';

const queryClient = new QueryClient();

// The inner layout that actually uses the Player context
function ShellLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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

  const goSearch = () => router.push('/search');
  const goFavs = () => router.push('/favorites');
  const goHome = () => router.push('/');

  const getPageTitle = () => {
    if (pathname === '/') return 'Home';
    if (pathname === '/search') return 'Search';
    if (pathname === '/favorites') return 'Favourites';
    if (pathname === '/account' || pathname?.startsWith('/account/')) return 'Profile';
    if (pathname === '/settings') return 'Settings';
    if (pathname?.startsWith('/profile/')) return 'Artist Profile';
    return 'Plugg';
  };

  const isAuthPage = pathname === '/auth';
  if (isAuthPage) return <>{children}</>;

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
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground">{getPageTitle()}</h1>
          </div>
          <div className="py-2">
            {children}
          </div>
          <div className={currentWithLike ? 'pb-24' : 'pb-8'} />
        </main>
        <RightPanel onSearch={goSearch} />
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden max-w-lg mx-auto relative">
        <Header onSearch={goSearch} onRefresh={goHome} onOpenFavorites={goFavs} />
        {children}
        <div className={currentWithLike ? 'pb-36' : 'pb-20'} />
      </div>

      <MobileTabBar offsetForPlayer={!!currentWithLike} />

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
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AccentLoader />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <PlayerProvider>
              <ShellLayout>{children}</ShellLayout>
            </PlayerProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
