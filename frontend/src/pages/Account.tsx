import { useState, useEffect, useMemo } from "react";
import { User, Heart, Headphones, Mic2, ChevronRight, Flame, Users, Camera, Pencil, X, Check, AtSign, Settings as SettingsIcon, LogOut, Play } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import ImageCropper from "@/components/ImageCropper";
import SongCover from "@/components/SongCover";
import SongItem from "@/components/SongItem";
import { Song, Genre } from "@/lib/mock-data";

type Tab = "none" | "history" | "favorites" | "following";

const formatCount = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
};

const Account = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, signOut, updateProfile, updateAvatar, checkHandleAvailable } = useAuth();
  const { recentlyPlayed, play, isPlaying, currentSong } = usePlayer();

  // Determine active tab from path
  const activeTab = useMemo<Tab>(() => {
    if (location.pathname === "/account/history") return "history";
    if (location.pathname === "/account/following") return "following";
    return "none";
  }, [location.pathname]);
  const [favouriteCount, setFavouriteCount] = useState(() => {
    return Number(localStorage.getItem(`plugg_fav_count_${user?.id}`)) || 0;
  });
  const [followingCount, setFollowingCount] = useState(() => {
    return Number(localStorage.getItem(`plugg_follow_count_${user?.id}`)) || 0;
  });
  const [followedList, setFollowedList] = useState<{ artist_slug: string, id?: string, name?: string, image_url?: string }[]>(() => {
    const saved = localStorage.getItem(`plugg_followed_list_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [favoriteSongs, setFavoriteSongs] = useState<Song[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHandle, setEditHandle] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editHandleError, setEditHandleError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Fetch counts
    supabase.from("user_favourites").select("song_id", { count: "exact" }).eq("user_id", user.id)
      .then(({ count }) => {
        const val = count ?? 0;
        setFavouriteCount(val);
        localStorage.setItem(`plugg_fav_count_${user.id}`, String(val));
      });

    // Fetch latest profile for streak/listens
    supabase.from("profiles").select("streak").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) {
          // Streak is our listens count
          localStorage.setItem(`plugg_fav_listens_${user.id}`, String(data.streak || 0));
        }
      });

    // Fetch followed artists with more details
    supabase.from("user_follows").select("artist_slug").eq("follower_id", user.id)
      .then(async ({ data: followData }) => {
        if (followData && followData.length > 0) {
          const identifiers = followData.map(d => d.artist_slug?.trim()).filter(Boolean);
          
          // Fetch each artist individually to be 100% sure of the match (robust for small lists)
          const artistsResults = await Promise.all(
            identifiers.map(async (id) => {
              // Try ID match
              const isNumeric = !isNaN(parseInt(id));
              let query = supabase.from("artists").select("id, name, image_url, slug, genre");
              
              if (isNumeric) {
                const { data } = await query.eq("id", parseInt(id)).single();
                if (data) return data;
              }
              
              // Fallback to slug match
              const { data: bySlug } = await supabase.from("artists").select("id, name, image_url, slug, genre").eq("slug", id).single();
              return bySlug;
            })
          );

          const allArtists = artistsResults.filter(Boolean);
          
          const fullList = followData.map(d => {
            const val = d.artist_slug?.trim();
            const art = allArtists.find(a => a.id.toString() === val || a.slug === val);
            
            return {
              artist_slug: val,
              id: art?.id?.toString() || val,
              name: art?.name || `Artist #${val}`,
              image_url: art?.image_url,
              genre: art?.genre || "Music Artist"
            };
          });
          
          setFollowingCount(followData.length);
          setFollowedList(fullList);
          localStorage.setItem(`plugg_follow_count_${user.id}`, String(followData.length));
          localStorage.setItem(`plugg_followed_list_${user.id}`, JSON.stringify(fullList));
        } else {
          setFollowingCount(0);
          setFollowedList([]);
        }
      });
  }, [user]);

  // Fetch favorite songs when activeTab is 'favorites'
  useEffect(() => {
    if (activeTab === "favorites" && user) {
      setLoadingFavorites(true);
      supabase.from("user_favourites").select("song_id").eq("user_id", user.id)
        .then(async ({ data }) => {
          if (data && data.length > 0) {
            const ids = data.map(d => d.song_id);
            const { data: songs } = await supabase.from("songs").select("*, artists(name, image_url, genre)").in("id", ids);
            if (songs) {
              const mapped: Song[] = songs.map(s => ({
                id: s.id.toString(),
                title: s.title,
                artistName: s.artists?.name || "Unknown",
                artistAvatar: s.artists?.image_url || "",
                plays: 0,
                downloads: 0,
                likes: 0,
                timestamp: new Date(s.first_seen_at || Date.now()),
                duration: 0,
                audioUrl: "", // Should ideally come from a real URL builder logic
                genre: (s.artists?.genre as Genre) || "afrobeats",
                coverUrl: s.cover_url || undefined,
                cover: { from: "#333", to: "#000" }
              }));
              setFavoriteSongs(mapped);
            }
          }
          setLoadingFavorites(false);
        });
    }
  }, [activeTab, user]);

  const openEdit = () => {
    setEditName(profile?.full_name ?? "");
    setEditHandle(profile?.handle ?? "");
    setEditBio(profile?.bio ?? "");
    setEditHandleError("");
    setEditing(true);
  };

  const onHandleBlur = async () => {
    const clean = editHandle.replace(/[^a-z0-9_]/gi, "").toLowerCase();
    if (clean !== editHandle) setEditHandle(clean);
    if (clean.length < 3) { setEditHandleError("At least 3 characters"); return; }
    if (clean === profile?.handle) { setEditHandleError(""); return; }
    const available = await checkHandleAvailable(clean);
    setEditHandleError(available ? "" : "Handle already taken");
  };

  const saveEdit = async () => {
    if (editHandleError) return;
    setSaving(true);
    const { error } = await updateProfile({
      full_name: editName,
      handle: editHandle,
      bio: editBio,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error, variant: "destructive" }); return; }
    setEditing(false);
    toast({ title: "Profile updated ✓" });
  };

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingSrc(URL.createObjectURL(f));
    e.target.value = "";
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
    navigate("/");
  };

  if (loading && !profile && !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Listener";
  const displayHandle = profile?.handle ? `@${profile.handle}` : "@guest";
  const avatar = profile?.avatar_url;
  const isGuest = !user;

  const continueListeningSong = recentlyPlayed.length > 0 ? recentlyPlayed[0] : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <AnimatePresence mode="wait">
        {activeTab === "none" ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="animate-in"
          >
            {/* Premium Header */}
            <div className="relative pt-16 pb-10 px-6 text-center overflow-hidden">
              {/* Blurred Background Image */}
              <div 
                className="absolute inset-0 -z-20 bg-cover bg-center blur-3xl opacity-20 scale-110"
                style={{ backgroundImage: `url(${avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + displayName})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background/60 to-background -z-10" />
              
              {/* Identity Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-secondary border-4 border-background shadow-xl flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105">
                    {avatar ? (
                      <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-muted-foreground/40" />
                    )}
                  </div>
                  {!isGuest && (
                    <label className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary border-4 border-background flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                      <Camera size={14} className="text-primary-foreground" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
                    </label>
                  )}
                </div>

                <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">{displayName}</h1>
                <p className="text-muted-foreground font-medium text-lg mt-1">
                  {isGuest ? "Guest Listener" : displayHandle}
                </p>
                
                {profile?.bio && (
                  <p className="mt-4 text-sm text-muted-foreground/80 max-w-[280px] leading-relaxed mx-auto">
                    {profile.bio}
                  </p>
                )}

                {/* Minimal Stats Row - Now Tappable */}
                <div className="flex items-center justify-center gap-10 mt-8 w-full max-w-sm mx-auto">
                  <button onClick={() => navigate("/favorites")} className="text-center group active:scale-95 transition-transform">
                    <p className="text-xl font-bold text-foreground tabular-nums group-hover:text-primary transition-colors">{favouriteCount}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5 group-hover:text-primary/70 transition-colors">Favorites</p>
                  </button>
                  <div className="w-px h-8 bg-border/50" />
                  <button onClick={() => navigate("/account/following")} className="text-center group active:scale-95 transition-transform">
                    <p className="text-xl font-bold text-foreground tabular-nums group-hover:text-primary transition-colors">{followingCount}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5 group-hover:text-primary/70 transition-colors">Following</p>
                  </button>
                  <div className="w-px h-8 bg-border/50" />
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground tabular-nums">{formatCount(profile?.streak ?? 0)}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Listens</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="px-6 space-y-10 max-w-lg mx-auto">
              {/* Continue Listening Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">Continue Listening</h3>
                  <button 
                    onClick={() => navigate("/account/history")}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View History
                  </button>
                </div>
                
                {continueListeningSong ? (
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => play(continueListeningSong, recentlyPlayed)}
                    className="bg-secondary/30 border border-border/40 backdrop-blur-sm p-4 rounded-3xl flex items-center gap-4 cursor-pointer transition-colors hover:bg-secondary/50 group"
                  >
                    <div className="relative shrink-0">
                      <SongCover song={continueListeningSong} size={64} rounded="2xl" className="shadow-md group-hover:shadow-lg transition-shadow" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-100 transition-opacity">
                        <Play size={20} className="text-white fill-current" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{continueListeningSong.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{continueListeningSong.artistName}</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-secondary/10 border border-dashed border-border rounded-3xl p-8 flex flex-col items-center text-center">
                    <Headphones className="text-muted-foreground/30 mb-2" size={32} />
                    <p className="text-xs text-muted-foreground">Start listening to build your history</p>
                  </div>
                )}
              </section>

              {/* Action List - Simplified */}
              <div className="space-y-2">
                {!isGuest ? (
                  <>
                    <button 
                      onClick={openEdit}
                      className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 text-sm font-medium">
                        <Pencil size={16} className="text-muted-foreground" />
                        Edit Profile
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button 
                      onClick={() => navigate("/settings")}
                      className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 text-sm font-medium">
                        <SettingsIcon size={16} className="text-muted-foreground" />
                        Account Settings
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button 
                      onClick={() => toast({ title: "Coming soon", description: "Artist studio features are arriving shortly!" })}
                      className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group"
                    >
                      <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                        <Mic2 size={16} />
                        Become an Artist
                      </div>
                      <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">New</span>
                    </button>

                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 py-4 text-destructive text-sm font-semibold hover:bg-destructive/5 rounded-2xl transition-colors mt-4"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => navigate("/auth")}
                    className="w-full py-4 rounded-full bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Sign in to Plugg
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-6 pt-12 animate-in"
          >
            <h2 className="text-2xl font-bold mb-8 capitalize tracking-tight">{activeTab === "history" ? "Recently Played" : activeTab}</h2>
            
            <div className="space-y-4">
              {activeTab === "history" && (
                recentlyPlayed.length > 0 ? (
                  <div className="space-y-1">
                    {recentlyPlayed.map((song, i) => (
                      <SongItem 
                        key={song.id + i} 
                        song={song} 
                        index={i} 
                        rank={i+1}
                        isPlaying={isPlaying && currentSong?.id === song.id}
                        onPlay={() => play(song, recentlyPlayed)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Headphones} title="No history" description="Start listening to see your history here." />
                )
              )}

              {activeTab === "following" && (
                followedList.length > 0 ? (
                  <div className="space-y-3">
                    {followedList.map((f) => (
                      <button 
                        key={f.artist_slug} 
                        onClick={() => navigate(`/profile/${f.id || f.artist_slug}`)}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-secondary/40 transition-colors group text-left"
                      >
                        <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center overflow-hidden shadow-sm group-active:scale-95 transition-transform border border-border/50">
                          {f.image_url ? (
                            <img src={f.image_url} alt={f.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-xl">
                              {f.name ? f.name.charAt(0).toUpperCase() : "?"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-base text-foreground truncate">{f.name || `Artist #${f.artist_slug}`}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium mt-0.5">
                            {f.genre || "Music Artist"}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Users} title="Not following" description="Follow artists to see them here." />
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal - Improved UI */}
      <AnimatePresence>
        {editing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl mb-safe"
            >
              <div className="px-6 py-6 border-b border-border/50 flex items-center justify-between">
                <h2 className="text-xl font-bold">Edit Profile</h2>
                <button onClick={() => setEditing(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">NAME</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-secondary text-foreground text-sm font-medium border border-transparent focus:border-primary/50 outline-none transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">HANDLE</label>
                  <div className="relative">
                    <AtSign size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" value={editHandle}
                      onChange={(e) => { setEditHandle(e.target.value.toLowerCase()); setEditHandleError(""); }}
                      onBlur={onHandleBlur}
                      className="w-full pl-11 pr-5 py-4 rounded-2xl bg-secondary text-foreground text-sm font-medium border border-transparent focus:border-primary/50 outline-none transition-all" />
                  </div>
                  {editHandleError && <p className="text-xs text-destructive ml-1">{editHandleError}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">BIO</label>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} maxLength={160}
                    className="w-full px-5 py-4 rounded-2xl bg-secondary text-foreground text-sm font-medium border border-transparent focus:border-primary/50 outline-none transition-all resize-none" />
                  <p className="text-[10px] text-muted-foreground text-right mr-1">{editBio.length}/160</p>
                </div>

                <button 
                  onClick={saveEdit} 
                  disabled={saving || !!editHandleError}
                  className="w-full py-4 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95"
                >
                  {saving ? "Updating..." : "Save Profile"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageCropper open={!!pendingSrc} src={pendingSrc} aspect={1} shape="circle" outputWidth={512}
        onCancel={() => setPendingSrc(null)}
        onConfirm={async (url) => {
          setPendingSrc(null);
          const { error } = await updateAvatar(url);
          if (error) toast({ title: "Upload failed", description: error, variant: "destructive" });
          else toast({ title: "Avatar updated ✓" });
        }}
      />
    </div>
  );
};

export default Account;
