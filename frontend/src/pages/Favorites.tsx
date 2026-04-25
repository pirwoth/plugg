import { Heart, ArrowLeft, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import SongItem from "@/components/SongItem";
import EmptyState from "@/components/EmptyState";
import { usePlayer } from "@/context/PlayerContext";

const Favorites = () => {
  const navigate = useNavigate();
  const { favoriteSongs, currentSong, isPlaying, play } = usePlayer();

  return (
    <div className="animate-in fade-in duration-500">
      {favoriteSongs.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favourites yet"
          description="Tap the heart on any song to save it here for quick access."
          action={
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
            >
              <Compass size={14} /> Discover music
            </button>
          }
        />
      ) : (
        <div className="py-2">
          {favoriteSongs.map((song, i) => (
            <SongItem
              key={song.id}
              song={song}
              index={i}
              rank={i + 1}
              isPlaying={isPlaying && currentSong?.id === song.id}
              onPlay={() => play(song, favoriteSongs)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
