import { useState, useEffect } from "react";
import { User, Heart, Headphones, Mic2, ChevronRight, Flame, Users, Camera, Pencil, X, Check, AtSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import SongItem from "@/components/SongItem";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import ImageCropper from "@/components/ImageCropper";

const Account = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, updateProfile, updateAvatar, checkHandleAvailable } = useAuth();
  const { recentlyPlayed, play, isPlaying, currentSong } = usePlayer();

  const [favouriteCount, setFavouriteCount] = useState(() => {
    return Number(localStorage.getItem(`plugg_fav_count_${user?.id}`)) || 0;
  });
  const [followingCount, setFollowingCount] = useState(() => {
    return Number(localStorage.getItem(`plugg_follow_count_${user?.id}`)) || 0;
  });
  const [followedList, setFollowedList] = useState<{ artist_slug: string }[]>(() => {
    const saved = localStorage.getItem(`plugg_followed_list_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Edit modal state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHandle, setEditHandle] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editHandleError, setEditHandleError] = useState("");
  const [saving, setSaving] = useState(false);

  // Avatar crop
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
    supabase.from("user_follows").select("artist_slug", { count: "exact" }).eq("follower_id", user.id)
      .then(({ data, count }) => {
        const val = count ?? 0;
        setFollowingCount(val);
        setFollowedList(data ?? []);
        localStorage.setItem(`plugg_follow_count_${user.id}`, String(val));
        localStorage.setItem(`plugg_followed_list_${user.id}`, JSON.stringify(data ?? []));
      });
  }, [user]);

  // Open edit modal with current values
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
  };

  const stats = [
    { label: "Favourites", value: favouriteCount, icon: Heart },
    { label: "Following", value: followingCount, icon: Users },
    { label: "Streak (days)", value: profile?.streak ?? 0, icon: Flame },
  ];

  const isGuest = !user;

  // Only show a loading spinner if we have absolutely no data yet
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Hero cover */}
      <div className="relative">
        <div className="h-28 sm:h-36 bg-gradient-to-br from-primary/35 via-primary/10 to-transparent" />
        <div className="px-5 -mt-12 flex items-end gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-secondary border-4 border-background flex items-center justify-center overflow-hidden">
              {avatar ? (
                <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-muted-foreground" />
              )}
            </div>
            {!isGuest && (
              <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary border-2 border-background flex items-center justify-center cursor-pointer">
                <Camera size={12} className="text-primary-foreground" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
              </label>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <p className="font-display text-xl font-bold text-foreground truncate">{displayName}</p>
            <p className="text-sm text-muted-foreground truncate">
              {isGuest ? "@guest · Sign in to sync your library" : displayHandle}
            </p>
            {profile?.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-5 mt-4 flex flex-wrap gap-2">
          {isGuest ? (
            <button onClick={() => navigate("/auth")}
              className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              Sign in / Create account
            </button>
          ) : (
            <button onClick={openEdit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-foreground text-sm font-semibold hover:bg-secondary transition-colors">
              <Pencil size={14} /> Edit Profile
            </button>
          )}
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
          onClick={() => toast({ title: "Coming soon", description: "Artist studio features are arriving shortly!" })}
          className="w-full text-left bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-4 hover:border-primary/40 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Mic2 size={22} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Become an artist</p>
            <p className="text-xs text-muted-foreground mt-0.5">Upload your music, grow your audience, and earn tips.</p>
          </div>
          <ChevronRight size={18} className="text-muted-foreground shrink-0" />
        </button>
      </div>

      {/* Following list */}
      <div className="px-5 mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Following</h3>
        {followedList.length === 0 ? (
          <EmptyState icon={Users} title="Not following anyone yet"
            description="Follow artists from their profile to see their new uploads first." className="py-8" />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {followedList.map((f) => (
              <button key={f.artist_slug} onClick={() => navigate(`/profile/${f.artist_slug}`)}
                className="flex flex-col items-center gap-1.5 group">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border border-border flex items-center justify-center group-hover:border-primary">
                  <span className="font-display text-xl font-bold text-foreground">{f.artist_slug.charAt(0).toUpperCase()}</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate max-w-[80px]">{f.artist_slug}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recently played */}
      <div className="px-5 mt-8 mb-20">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recently played</h3>
        {recentlyPlayed.length === 0 ? (
          <EmptyState icon={Headphones} title="Nothing here yet"
            description="Start listening to build your history." className="py-8" />
        ) : (
          <div className="space-y-1">
            {recentlyPlayed.map((song, i) => (
              <SongItem
                key={`${song.id}-${i}`}
                song={song}
                index={i}
                isPlaying={isPlaying && currentSong?.id === song.id}
                onPlay={() => play(song, recentlyPlayed)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ===== EDIT PROFILE MODAL ===== */}
      {editing && (
        <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-display text-lg font-bold text-foreground">Edit Profile</h2>
              <button onClick={() => setEditing(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              {/* Full name */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Full name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              {/* Handle */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Handle</label>
                <div className="relative">
                  <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={editHandle}
                    onChange={(e) => { setEditHandle(e.target.value.toLowerCase()); setEditHandleError(""); }}
                    onBlur={onHandleBlur}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                {editHandleError && <p className="text-xs text-destructive mt-1">{editHandleError}</p>}
              </div>
              {/* Bio */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} maxLength={160}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                <p className="text-xs text-muted-foreground text-right">{editBio.length}/160</p>
              </div>
              {/* Save */}
              <button onClick={saveEdit} disabled={saving || !!editHandleError}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
                <Check size={16} /> {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar crop */}
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
