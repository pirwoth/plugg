// Mock lyrics for tracks. Real lyrics will plug in once Cloud is connected.
const SAMPLE_LYRICS: string[] = [
  "[Verse 1]",
  "Walking through the city, lights on every road",
  "Feel the rhythm pulsing, carrying the load",
  "Memories like echoes, fading in the night",
  "Every step a story, holding on so tight",
  "",
  "[Chorus]",
  "We are the sound, we are the fire",
  "Burning brighter, climbing higher",
  "Hands up high, we never tire",
  "We are the sound, we are the fire",
  "",
  "[Verse 2]",
  "Faces in the crowd, smiles I've never known",
  "Music is the home, I no longer feel alone",
  "Heartbeats sync together, drumming in my chest",
  "Tonight we live forever, no time for the rest",
  "",
  "[Bridge]",
  "Ohh — let it go, let it ride",
  "Ohh — every wave from inside",
  "",
  "[Outro]",
  "We are the sound… we are the fire…",
];

export function getMockLyrics(_songId: string): string[] {
  return SAMPLE_LYRICS;
}
