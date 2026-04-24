import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Upload, Music, User, Camera, Edit2, Image as ImageIcon,
  Play, Heart, Download, Users, Share2, TrendingUp, Smartphone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppShell from "@/components/AppShell";
import ImageCropper from "@/components/ImageCropper";
import GenrePicker from "@/components/GenrePicker";
import { getArtistStats, DEMO_ARTIST, SongStats } from "@/lib/artist-stats";
import { Genre, GENRE_EMOJI, GENRE_LABEL } from "@/lib/mock-data";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const BIO_LIMIT = 160;
const MAX_REG_GENRES = 3;
const MAX_SONG_GENRES = 2;

interface ArtistProfile {
  phone: string;
  name: string;
  username: string;
  bio: string;
  photo: string | null;
  cover: string | null;
  genres: Genre[];
}

interface SongDraft {
  title: string;
  artist: string;
  featured: string;
  producer: string;
  cover: string | null;
  genres: Genre[];
}

const emptySong: SongDraft = { title: "", artist: "", featured: "", producer: "", cover: null, genres: [] };

type Tab = "overview" | "songs" | "upload";

const compact = (n: number) =>
  n >= 1000 ? Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n) : String(n);

type CropTarget = { kind: "avatar" | "cover"; scope: "register" | "edit" } | null;

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const [registered, setRegistered] = useState(true);
  const [profile, setProfile] = useState<ArtistProfile>({
    phone: "0700000000", name: DEMO_ARTIST, username: DEMO_ARTIST.toLowerCase().replace(/\s/g, ""), bio: "Making waves in the 256 🇺🇬", photo: null, cover: null, genres: ["afrobeats"],
  });
  const [editing, setEditing] = useState(false);
  const [editProfile, setEditProfile] = useState<ArtistProfile>(profile);
  const [tab, setTab] = useState<Tab>("overview");
  const [file, setFile] = useState<File | null>(null);
  const [song, setSong] = useState<SongDraft>(emptySong);

  // Cropper state
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget>(null);

  const stats = useMemo(() => getArtistStats(profile.name || DEMO_ARTIST), [profile.name]);

  const canRegister =
    profile.phone.length >= 9 &&
    !!profile.name &&
    !!profile.username &&
    profile.genres.length > 0 &&
    profile.bio.length <= BIO_LIMIT;

  const openCrop = (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "avatar" | "cover",
    scope: "register" | "edit",
  ) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingSrc(URL.createObjectURL(f));
    setCropTarget({ kind, scope });
    e.target.value = ""; // allow same file to be re-picked
  };

  const handleCropConfirm = (dataUrl: string) => {
    if (!cropTarget) return;
    const { kind, scope } = cropTarget;
    if (scope === "register") {
      setProfile((p) => ({ ...p, [kind === "avatar" ? "photo" : "cover"]: dataUrl }));
    } else {
      setEditProfile((p) => ({ ...p, [kind === "avatar" ? "photo" : "cover"]: dataUrl }));
    }
    setPendingSrc(null);
    setCropTarget(null);
  };

  const handleCropCancel = () => {
    setPendingSrc(null);
    setCropTarget(null);
  };

  const handleRegister = () => { if (canRegister) setRegistered(true); };

  const handleUpload = () => {
    setFile(null);
    setSong(emptySong);
    setTab("songs");
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSong({ ...song, cover: URL.createObjectURL(f) });
  };

  const canPost = !!file && !!song.title && !!song.artist && song.genres.length > 0;

  const handleSaveEdit = () => { setProfile(editProfile); setEditing(false); };

  // ===== Edit profile screen =====
  if (editing) {
    return (
      <AppShell
        title="Edit Profile"
        titleLeading={
          <button onClick={() => setEditing(false)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
        }
      >
        <div className="max-w-lg mx-auto pb-8">
          {/* Cover + avatar combo */}
          <div className="relative">
            <label className="relative block cursor-pointer group">
              <div className="h-36 sm:h-44 w-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent overflow-hidden">
                {editProfile.cover && (
                  <img src={editProfile.cover} alt="Cover" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="flex items-center gap-1.5 text-xs text-white bg-black/60 px-3 py-1.5 rounded-full">
                  <Camera size={12} /> Change cover
                </span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => openCrop(e, "cover", "edit")} />
            </label>

            <div className="px-5 -mt-12 flex items-end">
              <label className="relative cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-secondary border-4 border-background flex items-center justify-center overflow-hidden">
                  {editProfile.photo ? (
                    <img src={editProfile.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Music size={32} className="text-muted-foreground" />
                  )}
                </div>
                <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                  <Camera size={12} className="text-primary-foreground" />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => openCrop(e, "avatar", "edit")} />
              </label>
            </div>
          </div>

          <div className="px-4 pt-5 space-y-4">
            <input type="text" placeholder="Full Name" value={editProfile.name}
              onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50" />
            <input type="text" placeholder="Username" value={editProfile.username}
              onChange={(e) => setEditProfile({ ...editProfile, username: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50" />
            <div>
              <textarea placeholder="Bio" value={editProfile.bio}
                onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value.slice(0, BIO_LIMIT) })}
                rows={3}
                maxLength={BIO_LIMIT}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              <p className="text-[11px] text-muted-foreground mt-1 px-1 text-right tabular-nums">
                {editProfile.bio.length}/{BIO_LIMIT}
              </p>
            </div>
            <GenrePicker
              value={editProfile.genres}
              onChange={(genres) => setEditProfile({ ...editProfile, genres })}
              max={MAX_REG_GENRES}
              label={`Your genres · pick up to ${MAX_REG_GENRES}`}
              helper="Helps fans discover you on the right feeds."
            />
            <button onClick={handleSaveEdit} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
              Save Changes
            </button>
          </div>
        </div>

        <ImageCropper
          open={!!pendingSrc}
          src={pendingSrc}
          aspect={cropTarget?.kind === "cover" ? 3 : 1}
          shape={cropTarget?.kind === "cover" ? "rect" : "circle"}
          outputWidth={cropTarget?.kind === "cover" ? 1200 : 512}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      </AppShell>
    );
  }

  // ===== Registration form =====
  if (!registered) {
    return (
      <AppShell
        title="Become an Artist"
        titleLeading={
          <button onClick={() => navigate(-1)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
        }
      >
        <div className="max-w-lg mx-auto pb-8">
          <div className="relative">
            <label className="relative block cursor-pointer group">
              <div className="h-32 sm:h-40 w-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent overflow-hidden">
                {profile.cover && (
                  <img src={profile.cover} alt="Cover" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex items-center gap-1.5 text-xs text-foreground bg-background/70 px-3 py-1.5 rounded-full backdrop-blur">
                  <Camera size={12} /> {profile.cover ? "Change cover" : "Add cover photo"}
                </span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => openCrop(e, "cover", "register")} />
            </label>

            <div className="px-5 -mt-10 flex items-end">
              <label className="relative cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-secondary border-4 border-background flex items-center justify-center overflow-hidden">
                  {profile.photo ? (
                    <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-muted-foreground" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                  <Camera size={12} className="text-primary-foreground" />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => openCrop(e, "avatar", "register")} />
              </label>
            </div>
          </div>

          <div className="px-4 pt-5 space-y-4">
            <p className="text-sm text-muted-foreground">Register to start uploading your music.</p>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Mobile Money number for tips
              </label>
              <div className="relative mt-1.5">
                <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="tel" placeholder="e.g. 0772 123 456" value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
                Tips from fans will be sent here via MTN MoMo or Airtel Money.
              </p>
            </div>
            <input type="text" placeholder="Full Name" value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50" />
            <input type="text" placeholder="Username" value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50" />
            <div>
              <textarea placeholder="Short bio — what's your vibe?" value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value.slice(0, BIO_LIMIT) })}
                rows={3}
                maxLength={BIO_LIMIT}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              <p className="text-[11px] text-muted-foreground mt-1 px-1 text-right tabular-nums">
                {profile.bio.length}/{BIO_LIMIT}
              </p>
            </div>
            <GenrePicker
              value={profile.genres}
              onChange={(genres) => setProfile({ ...profile, genres })}
              max={MAX_REG_GENRES}
              label={`What kind of music do you make? · pick up to ${MAX_REG_GENRES}`}
              helper="Required — fans will discover you in these feeds."
            />
            <button onClick={handleRegister} disabled={!canRegister}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-opacity">
              Create Account
            </button>
          </div>
        </div>

        <ImageCropper
          open={!!pendingSrc}
          src={pendingSrc}
          aspect={cropTarget?.kind === "cover" ? 3 : 1}
          shape={cropTarget?.kind === "cover" ? "rect" : "circle"}
          outputWidth={cropTarget?.kind === "cover" ? 1200 : 512}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      </AppShell>
    );
  }

  // ===== Registered Dashboard =====
  return (
    <AppShell title="Artist Studio">
      <div className="px-4 py-5 space-y-5">
        {/* Profile header with cover */}
        <div className="rounded-xl overflow-hidden border border-border bg-card">
          <div className="h-24 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent">
            {profile.cover && <img src={profile.cover} alt="Cover" className="w-full h-full object-cover" />}
          </div>
          <div className="px-4 pb-4 -mt-8 flex items-end gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary border-4 border-card flex items-center justify-center overflow-hidden shrink-0">
              {profile.photo ? (
                <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Music size={24} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <p className="font-bold text-foreground truncate">{profile.name}</p>
              <p className="text-xs text-muted-foreground truncate">@{profile.username} · {compact(stats.followers)} followers</p>
            </div>
            <button
              onClick={() => { setEditProfile({ ...profile }); setEditing(true); }}
              className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary mb-1"
              aria-label="Edit profile"
            >
              <Edit2 size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-full bg-secondary w-full max-w-md">
          {(["overview", "songs", "upload"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-semibold rounded-full transition-colors capitalize ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab stats={stats} />}
        {tab === "songs" && <SongsTab stats={stats.songs} />}
        {tab === "upload" && (
          <UploadTab
            file={file} setFile={setFile} song={song} setSong={setSong}
            canPost={!!canPost} onPost={handleUpload} onCoverChange={handleCoverChange}
          />
        )}
      </div>
    </AppShell>
  );
};

// ============= Overview =============
const OverviewTab = ({ stats }: { stats: ReturnType<typeof getArtistStats> }) => {
  const cards = [
    { icon: Play, label: "Total plays", value: compact(stats.totalPlays) },
    { icon: Heart, label: "Likes", value: compact(stats.totalLikes) },
    { icon: Users, label: "Followers", value: compact(stats.followers) },
    { icon: TrendingUp, label: "Monthly listeners", value: compact(stats.monthlyListeners) },
    { icon: Download, label: "Downloads", value: compact(stats.totalDownloads) },
    { icon: Share2, label: "Shares", value: compact(stats.totalShares) },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <c.icon size={14} />
              <span className="text-[11px] uppercase tracking-wider">{c.label}</span>
            </div>
            <p className="font-display font-bold text-xl text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Last 14 days</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Plays</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground" /> Likes</span>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.trend} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="g-plays" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g-likes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))",
                  borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))",
                }}
              />
              <Area type="monotone" dataKey="plays" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#g-plays)" />
              <Area type="monotone" dataKey="likes" stroke="hsl(var(--muted-foreground))" strokeWidth={2} fill="url(#g-likes)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top performing */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-semibold text-foreground mb-3">Top performing tracks</p>
        <div className="space-y-2">
          {[...stats.songs].sort((a, b) => b.plays - a.plays).slice(0, 5).map((s, i) => (
            <div key={s.song.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
              <p className="flex-1 text-sm text-foreground truncate">{s.song.title}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Play size={12} /> {compact(s.plays)}
              </div>
            </div>
          ))}
          {stats.songs.length === 0 && (
            <p className="text-xs text-muted-foreground">No tracks yet — upload one to start tracking stats.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============= Songs (per-track) =============
const SongsTab = ({ stats }: { stats: SongStats[] }) => {
  if (stats.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No tracks uploaded yet. Switch to <span className="text-foreground font-semibold">Upload</span> to post your first song.
      </div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
      {stats.map((s) => (
        <div key={s.song.id} className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
              <Music size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{s.song.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {Math.floor(s.song.duration / 60)}:{String(s.song.duration % 60).padStart(2, "0")} · uploaded {s.song.timestamp.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat icon={Play} label="Plays" value={compact(s.plays)} />
            <Stat icon={Heart} label="Likes" value={compact(s.likes)} />
            <Stat icon={Download} label="DL" value={compact(s.downloads)} />
          </div>
        </div>
      ))}
    </motion.div>
  );
};

const Stat = ({ icon: Icon, label, value }: { icon: typeof Play; label: string; value: string }) => (
  <div className="rounded-lg bg-secondary py-2">
    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
      <Icon size={11} />
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-sm font-bold text-foreground">{value}</p>
  </div>
);

// ============= Upload tab =============
const UploadTab = ({
  file, setFile, song, setSong, canPost, onPost, onCoverChange,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  song: SongDraft;
  setSong: (s: SongDraft) => void;
  canPost: boolean;
  onPost: () => void;
  onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 max-w-lg">
    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-8 cursor-pointer hover:border-primary/50 transition-colors">
      {file ? (
        <>
          <Music size={28} className="text-primary" />
          <span className="text-sm text-foreground text-center px-4">{file.name}</span>
        </>
      ) : (
        <>
          <Upload size={28} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Tap to select audio file</span>
        </>
      )}
      <input type="file" accept="audio/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
    </label>

    <label className="flex items-center gap-3 p-3 rounded-xl bg-secondary cursor-pointer hover:bg-secondary/80 transition-colors">
      <div className="w-14 h-14 rounded-lg bg-background flex items-center justify-center overflow-hidden shrink-0">
        {song.cover ? (
          <img src={song.cover} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={20} className="text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Song cover</p>
        <p className="text-xs text-muted-foreground">JPG or PNG, square works best</p>
      </div>
      <input type="file" accept="image/*" className="hidden" onChange={onCoverChange} />
    </label>

    <input type="text" placeholder="Song name" value={song.title}
      onChange={(e) => setSong({ ...song, title: e.target.value })}
      className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50" />
    <input type="text" placeholder="Artist" value={song.artist}
      onChange={(e) => setSong({ ...song, artist: e.target.value })}
      className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50" />
    <input type="text" placeholder="Featured artist (optional)" value={song.featured}
      onChange={(e) => setSong({ ...song, featured: e.target.value })}
      className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50" />
    <input type="text" placeholder="Producer (optional)" value={song.producer}
      onChange={(e) => setSong({ ...song, producer: e.target.value })}
      className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50" />

    <GenrePicker
      value={song.genres}
      onChange={(genres) => setSong({ ...song, genres })}
      max={MAX_SONG_GENRES}
      label={`Genre · pick up to ${MAX_SONG_GENRES}`}
      helper="Required — used to filter your track into the right feeds."
    />

    <button onClick={onPost} disabled={!canPost}
      className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-opacity">
      Post track
    </button>
  </motion.div>
);

export default ArtistDashboard;
