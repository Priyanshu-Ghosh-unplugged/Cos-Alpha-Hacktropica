// Music Service — Search & play music via iTunes Search API (free, no key needed)

export interface Track {
  id: number;
  name: string;
  artist: string;
  album: string;
  previewUrl: string;
  artworkUrl: string;
  durationMs: number;
  genre: string;
}

let currentAudio: HTMLAudioElement | null = null;
let currentTrack: Track | null = null;
let queue: Track[] = [];
let queueIndex = -1;
let isPlaying = false;
let volume = 0.7;

// Search iTunes for tracks
export const searchMusic = async (query: string, limit = 10): Promise<Track[]> => {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Music search failed');
  const data = await res.json();

  return data.results.map((r: any) => ({
    id: r.trackId,
    name: r.trackName,
    artist: r.artistName,
    album: r.collectionName,
    previewUrl: r.previewUrl,
    artworkUrl: r.artworkUrl100,
    durationMs: r.trackTimeMillis,
    genre: r.primaryGenreName,
  }));
};

// Format duration
const fmtDuration = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Play a track
export const playTrack = (track: Track): string => {
  stopMusic();
  currentAudio = new Audio(track.previewUrl);
  currentAudio.volume = volume;
  currentTrack = track;
  isPlaying = true;

  currentAudio.addEventListener('ended', () => {
    isPlaying = false;
    // Auto-play next in queue
    if (queueIndex < queue.length - 1) {
      queueIndex++;
      playTrack(queue[queueIndex]);
    }
  });

  currentAudio.play().catch(() => {});

  return `▶ Now Playing: ${track.name}
  Artist:   ${track.artist}
  Album:    ${track.album}
  Genre:    ${track.genre}
  Duration: ${fmtDuration(track.durationMs)} (30s preview)

  Controls: music pause | music stop | music vol <0-100>`;
};

// Play first result from search
export const playFromSearch = async (query: string): Promise<string> => {
  const tracks = await searchMusic(query, 5);
  if (tracks.length === 0) return '🔇 No results found for: ' + query;

  queue = tracks;
  queueIndex = 0;
  return playTrack(tracks[0]);
};

// Pause / Resume
export const togglePause = (): string => {
  if (!currentAudio || !currentTrack) return '🔇 Nothing is playing. Use: music play <query>';
  if (isPlaying) {
    currentAudio.pause();
    isPlaying = false;
    return `⏸ Paused: ${currentTrack.name} — ${currentTrack.artist}`;
  } else {
    currentAudio.play().catch(() => {});
    isPlaying = true;
    return `▶ Resumed: ${currentTrack.name} — ${currentTrack.artist}`;
  }
};

// Stop
export const stopMusic = (): string => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  const was = currentTrack;
  currentTrack = null;
  isPlaying = false;
  return was ? `⏹ Stopped: ${was.name}` : '⏹ Player stopped.';
};

// Volume
export const setVolume = (v: number): string => {
  volume = Math.max(0, Math.min(1, v / 100));
  if (currentAudio) currentAudio.volume = volume;
  const bar = '█'.repeat(Math.round(volume * 20)) + '░'.repeat(20 - Math.round(volume * 20));
  return `🔊 Volume: [${bar}] ${Math.round(volume * 100)}%`;
};

// Next track in queue
export const nextTrack = (): string => {
  if (queue.length === 0) return '🔇 Queue is empty.';
  if (queueIndex >= queue.length - 1) return '🔇 End of queue.';
  queueIndex++;
  return playTrack(queue[queueIndex]);
};

// Previous track
export const prevTrack = (): string => {
  if (queue.length === 0) return '🔇 Queue is empty.';
  if (queueIndex <= 0) return '🔇 Already at start of queue.';
  queueIndex--;
  return playTrack(queue[queueIndex]);
};

// Now playing status
export const nowPlaying = (): string => {
  if (!currentTrack) return '🔇 Nothing is playing.\n\n  Usage: music play <song name or artist>';
  const status = isPlaying ? '▶ Playing' : '⏸ Paused';
  const bar = '█'.repeat(Math.round(volume * 15)) + '░'.repeat(15 - Math.round(volume * 15));
  return `
  ┌────────────────────────────────────────┐
  │  ${status}                              
  │                                        │
  │  🎵 ${currentTrack.name.substring(0, 34).padEnd(34)} │
  │  🎤 ${currentTrack.artist.substring(0, 34).padEnd(34)} │
  │  💿 ${currentTrack.album.substring(0, 34).padEnd(34)} │
  │  🎸 ${currentTrack.genre.padEnd(34)} │
  │  🔊 [${bar}] ${String(Math.round(volume * 100)).padStart(3)}%            │
  │                                        │
  │  Queue: ${queueIndex + 1}/${queue.length}                            │
  └────────────────────────────────────────┘

  Commands: pause | stop | next | prev | vol <0-100>`;
};

// Search results display
export const formatSearchResults = (tracks: Track[]): string => {
  if (tracks.length === 0) return '  No results found.';
  const lines = tracks.map((t, i) =>
    `  ${String(i + 1).padStart(2)}. ${t.name.substring(0, 30).padEnd(30)} ${t.artist.substring(0, 20).padEnd(20)} ${fmtDuration(t.durationMs)}`
  );
  return `
  ┌─ Search Results ────────────────────────────────────────────────┐
  │  #   Title                          Artist               Dur   │
  ├─────────────────────────────────────────────────────────────────┤
${lines.join('\n')}
  └─────────────────────────────────────────────────────────────────┘

  Play a result: music play #<number>   (e.g. music play #3)`;
};

// Play by queue index
export const playByIndex = (index: number): string => {
  if (queue.length === 0) return '🔇 No search results. Search first: music search <query>';
  if (index < 1 || index > queue.length) return `🔇 Invalid track number. Pick 1-${queue.length}`;
  queueIndex = index - 1;
  return playTrack(queue[queueIndex]);
};

// Music help
export const musicHelp = (): string => `
  ┌─ 🎵 Music Player ─────────────────────────────────┐
  │                                                     │
  │  music play <query>    Search & play a song         │
  │  music play #<n>       Play track #n from results   │
  │  music search <query>  Search without playing       │
  │  music pause           Pause / Resume               │
  │  music stop            Stop playback                │
  │  music next            Next track in queue           │
  │  music prev            Previous track                │
  │  music now             Show now playing              │
  │  music vol <0-100>     Set volume                    │
  │  music help            Show this help                │
  │                                                     │
  │  Powered by iTunes Search API (30s previews)        │
  └─────────────────────────────────────────────────────┘`;

// Get queue for reference
export const getQueue = (): Track[] => queue;

// Get current playback state (for taskbar)
export const getMusicState = () => ({
  track: currentTrack,
  isPlaying,
  volume,
  queueIndex,
  queueLength: queue.length,
});
