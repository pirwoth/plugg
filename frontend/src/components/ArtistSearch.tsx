import { useState } from "react";
import { Search, X, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

interface ArtistSearchProps {
  onClose: () => void;
}

const ArtistSearch = ({ onClose }: ArtistSearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { data: artists, isLoading } = useQuery({
    queryKey: ['artistSearch', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const res = await supabase.from('artists').select('*, songs(id)').ilike('name', `%${query.trim()}%`).limit(20);
      return res.data || [];
    },
    enabled: query.trim().length > 0
  });

  const filtered = artists || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-background max-w-lg mx-auto flex flex-col"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Search size={18} className="text-muted-foreground flex-shrink-0" />
        <input
          autoFocus
          type="text"
          placeholder="Search artists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button onClick={onClose} className="p-1 text-muted-foreground">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {query.trim().length > 0 && isLoading && (
          <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
        )}
        {query.trim().length > 0 && !isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No artists found</p>
        )}
        {query.trim().length === 0 && (
           <p className="text-sm text-muted-foreground text-center py-8">Type an artist name to search</p>
        )}
        
        {filtered.map((artist) => (
          <button
            key={artist.id}
            onClick={() => {
              onClose();
              navigate(`/profile/${artist.id}`);
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-left border-b border-border active:bg-secondary/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Music size={18} className="text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{artist.name}</p>
              <p className="text-xs text-muted-foreground truncate">{artist.songs?.length || 0} songs</p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default ArtistSearch;
