export type Genre = "afrobeats" | "dancehall" | "gospel" | "hiphop" | "rnb" | "pop" | "afrohouse";

export interface Song {
  id: string;
  artistName: string;
  artistAvatar: string;
  title: string;
  plays: number;
  downloads: number;
  likes: number;
  timestamp: Date;
  duration: number;
  audioUrl?: string;
  liked?: boolean;
  genre: Genre;
  /** Two HSL colors used to generate a deterministic cover gradient */
  cover: { from: string; to: string };
}

export interface Artist {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  songs: Song[];
}

const names = [
  "Azawi", "Fik Fameica", "Sheebah", "Eddy Kenzo", "Vinka",
  "Bebe Cool", "Gravity Omutujju", "Lydia Jazmine", "John Blaq", "Zex Bilangilangi"
];

const titles = [
  "My Year", "On Fire", "Mbozi za Malwa", "Sitya Loss", "Over It",
  "Dagala", "Control", "Nkwatako", "Do Dat", "Ratata",
  "Byenyenya", "Party Animal", "Love Letter", "Midnight", "Champion"
];

const bios = [
  "Making waves in the 256 🇺🇬",
  "Music is life",
  "Born to perform",
  "Kampala's finest",
  "Beats and vibes only",
];

const genres: Genre[] = ["afrobeats", "dancehall", "gospel", "hiphop", "rnb", "pop", "afrohouse"];

export const GENRE_LABEL: Record<Genre, string> = {
  afrobeats: "Afrobeats",
  dancehall: "Dancehall",
  gospel: "Gospel",
  hiphop: "Hip-Hop",
  rnb: "R&B",
  pop: "Pop",
  afrohouse: "Afrohouse",
};

export const GENRE_EMOJI: Record<Genre, string> = {
  afrobeats: "🥁",
  dancehall: "🎶",
  gospel: "🙏",
  hiphop: "🎤",
  rnb: "💜",
  pop: "✨",
  afrohouse: "🌍",
};

// Seeded pseudo-random so covers stay stable across renders.
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function coverFromTitle(title: string): { from: string; to: string } {
  const h = hash(title);
  const hue1 = h % 360;
  const hue2 = (hue1 + 40 + (h % 80)) % 360;
  return {
    from: `hsl(${hue1}, 70%, 50%)`,
    to: `hsl(${hue2}, 65%, 35%)`,
  };
}

function generateSong(id: number): Song {
  const artist = names[id % names.length];
  const title = titles[id % titles.length];
  const genre = genres[id % genres.length];
  return {
    id: `song-${id}`,
    artistName: artist,
    artistAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(artist)}&backgroundColor=d97706`,
    title,
    plays: randomInt(50, 15000),
    downloads: randomInt(10, 3000),
    likes: randomInt(5, 8000),
    timestamp: new Date(Date.now() - randomInt(0, 30) * 86400000),
    duration: randomInt(120, 300),
    liked: false,
    genre,
    cover: coverFromTitle(title + artist + id),
  };
}

export const mockSongs: Song[] = Array.from({ length: 20 }, (_, i) => generateSong(i));

export const trendingSongs = [...mockSongs]
  .sort((a, b) => (b.plays + b.likes + b.downloads) - (a.plays + a.likes + a.downloads))
  .slice(0, 10);

export const newSongs = [...mockSongs]
  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  .slice(0, 10);

export const topHits = [...mockSongs]
  .sort((a, b) => b.plays - a.plays)
  .slice(0, 10);

// Mock artists for discovery
export const mockArtists: Artist[] = names.map((name, i) => ({
  id: `artist-${i}`,
  name,
  username: name.toLowerCase().replace(/\s/g, ""),
  avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=d97706`,
  bio: bios[i % bios.length],
  songs: mockSongs.filter((s) => s.artistName === name),
}));

export function getArtistIdByName(name: string): string | undefined {
  return mockArtists.find((a) => a.name === name)?.id;
}

export function songsByGenre(genre: Genre | "all"): Song[] {
  if (genre === "all") return mockSongs;
  return mockSongs.filter((s) => s.genre === genre);
}
