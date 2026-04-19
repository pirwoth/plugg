import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Music, UserPlus, UserCheck, BadgeCheck, Gift } from "lucide-react";
import { mockArtists, GENRE_LABEL, GENRE_EMOJI, Genre } from "@/lib/mock-data";
import SongItem from "@/components/SongItem";
import AppShell from "@/components/AppShell";
import ClampedBio from "@/components/ClampedBio";
import TipModal from "@/components/TipModal";
import { usePlayer } from "@/context/PlayerContext";
import { toast } from "@/hooks/use-toast";

const ArtistProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const artist = mockArtists.find((a) => a.id === id);
  const [tipOpen, setTipOpen] = useState(false);

  const { currentSong, isPlaying, play, followedArtists, toggleFollow } = usePlayer();

  if (!artist) {
    return (
      <AppShell title="Artist">
        <div className="px-6 py-16 text-center text-sm text-muted-foreground">Artist not found.</div>
      </AppShell>
    );
  }

  const isFollowing = followedArtists.has(artist.id);

  const handleFollow = () => {
    toggleFollow(artist.id);
    toast({
      title: isFollowing ? "Unfollowed" : `Following ${artist.name}`,
      description: isFollowing ? undefined : "You'll see their new uploads first.",
    });
  };

  const totalPlays = artist.songs.reduce((acc, s) => acc + s.plays, 0);
  const formatCount = (n: number) =>
    n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : n.toString();

  return (
    <AppShell
      title={artist.name}
      titleLeading={
        <button onClick={() => navigate(-1)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
      }
    >
      {/* Hero */}
      <div className="relative">
        {/* Cover banner */}
        <div className="h-32 sm:h-44 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />

        <div className="px-5 -mt-10 sm:-mt-12 flex items-end gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-secondary border-4 border-background flex items-center justify-center overflow-hidden flex-shrink-0">
            <Music size={32} className="text-muted-foreground" />
          </div>
        </div>

        <div className="px-5 pt-3">
          <div className="flex items-center gap-1.5">
            <h2 className="font-display text-xl font-bold text-foreground">{artist.name}</h2>
            <BadgeCheck size={18} className="text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">@{artist.username}</p>
          {artist.bio && (
            <div className="mt-2 max-w-prose">
              <ClampedBio text={artist.bio} limit={80} />
            </div>
          )}

          {/* Genre badges (uses artist's song genres as a stand-in until profile genres ship in Cloud) */}
          {(() => {
            const set = new Set<Genre>();
            artist.songs.forEach((s) => set.add(s.genre));
            const genres = Array.from(set).slice(0, 3);
            if (genres.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {genres.map((g) => (
                  <span key={g} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-[11px] font-medium text-foreground">
                    <span>{GENRE_EMOJI[g]}</span>
                    {GENRE_LABEL[g]}
                  </span>
                ))}
              </div>
            );
          })()}

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground tabular-nums">
            <span><span className="text-foreground font-semibold">{artist.songs.length}</span> songs</span>
            <span><span className="text-foreground font-semibold">{formatCount(totalPlays)}</span> plays</span>
            <span><span className="text-foreground font-semibold">{followedArtists.has(artist.id) ? 1 : 0}</span> follower{followedArtists.has(artist.id) ? "" : "s"}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button
              onClick={handleFollow}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                isFollowing
                  ? "bg-secondary text-foreground hover:bg-secondary/80"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
              {isFollowing ? "Following" : "Follow"}
            </button>
            <button
              onClick={() => setTipOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
            >
              <Gift size={16} />
              Send tip
            </button>
          </div>
        </div>
      </div>

      {/* Songs */}
      <div className="mt-8">
        <h3 className="px-5 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Songs
        </h3>
        {artist.songs.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">This artist hasn't uploaded any songs yet.</p>
        ) : (
          artist.songs.map((song, i) => (
            <SongItem
              key={song.id}
              song={song}
              index={i}
              rank={i + 1}
              isPlaying={isPlaying && currentSong?.id === song.id}
              onPlay={() => play(song)}
            />
          ))
        )}
      </div>

      <TipModal open={tipOpen} onClose={() => setTipOpen(false)} artistName={artist.name} />
    </AppShell>
  );
};

export default ArtistProfile;
