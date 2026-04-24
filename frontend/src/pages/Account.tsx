import { ArrowLeft, User, Heart, Music, Headphones, Mic2, ChevronRight, Flame, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import { usePlayer } from "@/context/PlayerContext";
import { mockArtists } from "@/lib/mock-data";

// TODO: replace with real auth/role check once Lovable Cloud is wired up
const isArtist = false;

const Account = () => {
  const navigate = useNavigate();
  const { favoriteSongs, followedArtists } = usePlayer();
  const followed = mockArtists.filter((a) => followedArtists.has(a.id));

  // Mock listening streak
  const streak = Math.min(7, favoriteSongs.length);
  const stats = [
    { label: "Favourites", value: favoriteSongs.length, icon: Heart },
    { label: "Following", value: followedArtists.size, icon: Users },
    { label: "Streak (days)", value: streak, icon: Flame },
  ];

  return (
    <AppShell
      title="Profile"
      titleLeading={
        <button onClick={() => navigate(-1)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
      }
    >
      {/* Hero with cover gradient */}
      <div className="relative">
        <div className="h-28 sm:h-36 bg-gradient-to-br from-primary/35 via-primary/10 to-transparent" />
        <div className="px-5 -mt-12 flex items-end gap-4">
          <div className="w-24 h-24 rounded-full bg-secondary border-4 border-background flex items-center justify-center shrink-0">
            <User size={36} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <p className="font-display text-xl font-bold text-foreground truncate">Guest Listener</p>
            <p className="text-sm text-muted-foreground truncate">@guest · Sign in to sync your library</p>
          </div>
        </div>
        <div className="px-5 mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/auth")}
            className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Sign in / Create account
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="px-5 py-2.5 rounded-full border border-border text-foreground text-sm font-semibold hover:bg-secondary"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-5 mt-6">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
            <Icon size={16} className="text-muted-foreground" />
            <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Become an artist */}
      <div className="px-5 mt-6">
        <button
          onClick={() => navigate("/artist")}
          className="w-full text-left bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-4 hover:border-primary/40 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Mic2 size={22} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {isArtist ? "Go to Artist Studio" : "Become an artist"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isArtist
                ? "Upload tracks and view your stats."
                : "Upload your music, grow your audience, and earn tips."}
            </p>
          </div>
          <ChevronRight size={18} className="text-muted-foreground shrink-0" />
        </button>
      </div>

      {/* Following list */}
      <div className="px-5 mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Following</h3>
        {followed.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Not following anyone yet"
            description="Follow artists from their profile to see their new uploads first."
            className="py-8"
          />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {followed.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/profile/${a.id}`)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border border-border flex items-center justify-center group-hover:border-primary">
                  <span className="font-display text-xl font-bold text-foreground">{a.name.charAt(0)}</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate max-w-[80px]">{a.name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recently played placeholder */}
      <div className="px-5 mt-8 mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recently played</h3>
        <EmptyState
          icon={Headphones}
          title="Nothing here yet"
          description="Start listening to build your history."
          className="py-8"
        />
      </div>

      <span className="sr-only">{Music.name}</span>
    </AppShell>
  );
};

export default Account;
