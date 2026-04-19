import { Song, mockSongs, mockArtists } from "@/lib/mock-data";

export interface SongStats {
  song: Song;
  plays: number;
  likes: number;
  downloads: number;
  tips: number;
  tipAmount: number; // in USD
  comments: number;
  shares: number;
}

export interface ArtistStats {
  totalPlays: number;
  totalLikes: number;
  totalDownloads: number;
  totalTips: number;
  totalTipAmount: number;
  totalComments: number;
  totalShares: number;
  followers: number;
  monthlyListeners: number;
  songs: SongStats[];
  trend: { day: string; plays: number; likes: number }[];
}

// Deterministic pseudo-random so numbers stay stable across renders
function seeded(seed: string, salt: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  h = (h ^ (salt * 2654435761)) >>> 0;
  return h / 0xffffffff;
}

function intFrom(seed: string, salt: number, min: number, max: number) {
  return Math.floor(seeded(seed, salt) * (max - min + 1)) + min;
}

function statsForSong(song: Song): SongStats {
  const plays = song.plays;
  const likes = song.likes;
  const downloads = song.downloads;
  const tips = intFrom(song.id, 1, 0, Math.max(2, Math.floor(plays / 400)));
  const tipAmount = tips === 0 ? 0 : tips * intFrom(song.id, 2, 1, 8);
  const comments = intFrom(song.id, 3, 0, Math.floor(plays / 30));
  const shares = intFrom(song.id, 4, 0, Math.floor(plays / 50));
  return { song, plays, likes, downloads, tips, tipAmount, comments, shares };
}

export function getArtistStats(artistName: string): ArtistStats {
  const songs = mockSongs.filter((s) => s.artistName === artistName);
  const songStats = songs.map(statsForSong);

  const totalPlays = songStats.reduce((a, s) => a + s.plays, 0);
  const totalLikes = songStats.reduce((a, s) => a + s.likes, 0);
  const totalDownloads = songStats.reduce((a, s) => a + s.downloads, 0);
  const totalTips = songStats.reduce((a, s) => a + s.tips, 0);
  const totalTipAmount = songStats.reduce((a, s) => a + s.tipAmount, 0);
  const totalComments = songStats.reduce((a, s) => a + s.comments, 0);
  const totalShares = songStats.reduce((a, s) => a + s.shares, 0);

  const artistSeed = artistName || "anon";
  const followers = intFrom(artistSeed, 10, 50, 12000);
  const monthlyListeners = intFrom(artistSeed, 11, Math.floor(totalPlays / 8) || 100, Math.max(500, totalPlays));

  // 14-day trend
  const trend = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(Date.now() - (13 - i) * 86400000)
      .toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return {
      day,
      plays: intFrom(artistSeed, 100 + i, Math.floor(totalPlays / 40) || 5, Math.floor(totalPlays / 12) || 50),
      likes: intFrom(artistSeed, 200 + i, Math.floor(totalLikes / 50) || 1, Math.floor(totalLikes / 14) || 20),
    };
  });

  return {
    totalPlays,
    totalLikes,
    totalDownloads,
    totalTips,
    totalTipAmount,
    totalComments,
    totalShares,
    followers,
    monthlyListeners,
    songs: songStats,
    trend,
  };
}

// Default artist used by the demo dashboard
export const DEMO_ARTIST = mockArtists[0]?.name ?? "Azawi";
