import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Music, UserPlus, UserCheck, BadgeCheck, Gift } from "lucide-react";
import { GENRE_LABEL, GENRE_EMOJI, Genre, Song } from "@/lib/mock-data";
import SongItem from "@/components/SongItem";
import ClampedBio from "@/components/ClampedBio";
import TipModal from "@/components/TipModal";
import { usePlayer } from "@/context/PlayerContext";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const ArtistProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tipOpen, setTipOpen] = useState(false);

  const { currentSong, isPlaying, play, followedArtists, toggleFollow } = usePlayer();

  const { data: artist, isLoading, error } = useQuery({
    queryKey: ['artistProfile', 'v3', id],
    queryFn: async () => {
      if (!id) throw new Error("No ID");
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', id)
        .single();
        
      if (artistError || !artistData) throw new Error("Artist not found");
      
      const { data: songsData } = await supabase
        .from('songs')
        .select('*, song_stats(*)')
        .eq('artist_id', id)
        .order('first_seen_at', { ascending: false });

      const mappedSongs: Song[] = (songsData || []).map(row => {
        const statsArray = Array.isArray(row.song_stats) ? row.song_stats : [];
        const latestStats = statsArray.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0] || { plays: 0, downloads: 0 };
        return {
          id: row.id.toString(),
          artistName: artistData.name,
          artistAvatar: artistData.image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(artistData.name)}&backgroundColor=d97706`,
          title: row.title || 'Unknown Title',
          plays: latestStats.plays || 0,
          downloads: latestStats.downloads || 0,
          likes: 0,
          timestamp: new Date(row.first_seen_at || Date.now()),
          duration: 180,
          audioUrl: (() => {
            if (row.page_url) {
              const rawTitle = row.title || '';
              let songPart = rawTitle;
              let artistPart = artistData.name || '';
              
              if (rawTitle.includes('-')) {
                const parts = rawTitle.split('-');
                songPart = parts[0];
                artistPart = parts.slice(1).join('-');
              }
              
              const cleanSong = songPart.replace(/\s+/g, '');
              const cleanArtist = artistPart.replace(/\s+/g, '');
              return encodeURI(`https://www.westnilebiz.com/songs/${cleanSong} - ${cleanArtist}.mp3`);
            }
            return "";
          })(),
          genre: (artistData.genre as Genre) || "afrobeats",
          coverUrl: row.cover_url || undefined,
          cover: { from: 'hsl(210, 70%, 50%)', to: 'hsl(215, 65%, 35%)' }
        };
      });

      return {
        ...artistData,
        username: artistData.name.toLowerCase().replace(/\s/g, ""),
        songs: mappedSongs
      };
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="px-6 py-16 text-center text-sm text-muted-foreground">
        Artist not found. Try searching for someone else.
      </div>
    );
  }

  const isFollowing = followedArtists.has(artist.id.toString());

  const handleFollow = () => {
    toggleFollow(artist.id.toString());
    toast({
      title: isFollowing ? "Unfollowed" : `Following ${artist.name}`,
      description: isFollowing ? undefined : "You'll see their new uploads first.",
    });
  };

  const totalPlays = artist.songs.reduce((acc: number, s: Song) => acc + s.plays, 0);
  const formatCount = (n: number) =>
    n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : n.toString();

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Hero */}
      <div className="relative">
        {/* Cover banner */}
        <div className="h-32 sm:h-44 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />

        <div className="px-5 -mt-10 sm:-mt-12 flex items-end gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-secondary border-4 border-background flex items-center justify-center overflow-hidden flex-shrink-0">
             {artist.image_url ? (
               <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
             ) : (
               <Music size={32} className="text-muted-foreground" />
             )}
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

          {/* Genre badges */}
          {(() => {
            const genres = artist.genre ? [artist.genre as Genre] : [];
            if (genres.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {genres.map((g) => (
                  <span key={g} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-[11px] font-medium text-foreground capitalize">
                    <span>{GENRE_EMOJI[g] || "🎵"}</span>
                    {GENRE_LABEL[g] || g}
                  </span>
                ))}
              </div>
            );
          })()}

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground tabular-nums">
            <span><span className="text-foreground font-semibold">{artist.songs.length}</span> songs</span>
            <span><span className="text-foreground font-semibold">{formatCount(totalPlays)}</span> plays</span>
            <span><span className="text-foreground font-semibold">{followedArtists.has(artist.id.toString()) ? 1 : 0}</span> follower{followedArtists.has(artist.id.toString()) ? "" : "s"}</span>
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
              onClick={() => toast({ title: "Coming soon", description: "Tipping via MTN MoMo and Airtel is currently under development!" })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
            >
              <Gift size={16} />
              Send tip
            </button>
          </div>
        </div>
      </div>

      {/* Songs */}
      <div className="mt-8 mb-20">
        <h3 className="px-5 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Songs
        </h3>
        {artist.songs.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">This artist hasn't uploaded any songs yet.</p>
        ) : (
          artist.songs.map((song: Song, i: number) => (
            <SongItem
              key={song.id}
              song={song}
              index={i}
              rank={i + 1}
              isPlaying={isPlaying && currentSong?.id === song.id}
              onPlay={() => play(song, artist.songs)}
            />
          ))
        )}
      </div>

      <TipModal open={tipOpen} onClose={() => setTipOpen(false)} artistName={artist.name} />
    </div>
  );
};

export default ArtistProfile;
