import { useState, useEffect } from 'react';
import { fetchWeather, getUserLocation, WeatherData } from '@/lib/weatherService';
import { getMusicState, togglePause, stopMusic, nextTrack, prevTrack, Track } from '@/lib/musicService';

interface CpuMetrics {
  usage: number;
  processes: number;
  uptime: string;
}

const getUptime = (startTime: number): string => {
  const diff = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const weatherIcon = (code: number, isDay: boolean): string => {
  if (code <= 1) return isDay ? '☀' : '☽';
  if (code <= 3) return '☁';
  if (code <= 48) return '▓';
  if (code <= 67) return '▒';
  if (code <= 86) return '❄';
  return '⚡';
};

export const Taskbar = () => {
  const [time, setTime] = useState(new Date());
  const [cpu, setCpu] = useState<CpuMetrics>({ usage: 0, processes: 0, uptime: '0s' });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [startTime] = useState(Date.now());
  const [memUsed, setMemUsed] = useState(0);
  const [musicTrack, setMusicTrack] = useState<Track | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);

  // Clock
  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // CPU metrics + music state polling
  useEffect(() => {
    const iv = setInterval(() => {
      setCpu({
        usage: Math.round(8 + Math.random() * 15),
        processes: 42 + Math.floor(Math.random() * 10),
        uptime: getUptime(startTime),
      });
      setMemUsed(Math.round(1.2 + Math.random() * 0.8));

      // Poll music state
      const ms = getMusicState();
      setMusicTrack(ms.track);
      setMusicPlaying(ms.isPlaying);
    }, 1000);
    setCpu({ usage: 12, processes: 44, uptime: '0s' });
    setMemUsed(1.4);
    return () => clearInterval(iv);
  }, [startTime]);

  // Weather (one-time fetch)
  useEffect(() => {
    getUserLocation()
      .then(loc => fetchWeather(loc.lat, loc.lon))
      .then(setWeather)
      .catch(() => {});
  }, []);

  const dateStr = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const truncate = (s: string, len: number) => s.length > len ? s.slice(0, len) + '…' : s;

  return (
    <div className="fixed top-0 left-0 right-0 h-8 flex items-center justify-between px-3 font-mono text-xs border-b border-border bg-muted/95 backdrop-blur-sm select-none z-[60]">
      {/* Left: OS name + uptime */}
      <div className="flex items-center gap-3 text-muted-foreground shrink-0">
        <span className="text-primary font-semibold">cos α</span>
        <span className="hidden sm:inline">│</span>
        <span className="hidden sm:inline">↑ {cpu.uptime}</span>
      </div>

      {/* Center: Music player (when playing) or system metrics */}
      <div className="flex items-center gap-2 text-muted-foreground overflow-hidden min-w-0">
        {musicTrack ? (
          <>
            {/* Music controls */}
            <button
              onClick={() => { prevTrack(); const ms = getMusicState(); setMusicTrack(ms.track); setMusicPlaying(ms.isPlaying); }}
              className="hover:text-primary transition-colors px-0.5"
              title="Previous"
            >⏮</button>
            <button
              onClick={() => { togglePause(); setMusicPlaying(!musicPlaying); }}
              className="hover:text-primary transition-colors px-0.5"
              title={musicPlaying ? 'Pause' : 'Play'}
            >{musicPlaying ? '⏸' : '▶'}</button>
            <button
              onClick={() => { nextTrack(); const ms = getMusicState(); setMusicTrack(ms.track); setMusicPlaying(ms.isPlaying); }}
              className="hover:text-primary transition-colors px-0.5"
              title="Next"
            >⏭</button>
            <button
              onClick={() => { stopMusic(); setMusicTrack(null); setMusicPlaying(false); }}
              className="hover:text-destructive transition-colors px-0.5"
              title="Stop"
            >⏹</button>

            <span className="text-border">│</span>

            {/* Track info */}
            <span className="text-primary truncate max-w-[120px] sm:max-w-[200px]" title={musicTrack.name}>
              {musicPlaying ? '♪' : '⏸'} {truncate(musicTrack.name, 25)}
            </span>
            <span className="hidden sm:inline text-muted-foreground truncate max-w-[150px]" title={musicTrack.artist}>
              — {truncate(musicTrack.artist, 20)}
            </span>
          </>
        ) : (
          <>
            <span title="CPU Usage">
              CPU <span className={cpu.usage > 20 ? 'text-warning' : 'text-success'}>{cpu.usage}%</span>
            </span>
            <span className="hidden md:inline">│</span>
            <span className="hidden md:inline" title="Memory">
              MEM {memUsed.toFixed(1)}G
            </span>
            <span className="hidden lg:inline">│</span>
            <span className="hidden lg:inline" title="Processes">
              PRC {cpu.processes}
            </span>
            {weather && (
              <>
                <span>│</span>
                <span title={weather.description}>
                  {weatherIcon(weather.weatherCode, weather.isDay)} {weather.temperature}°C
                </span>
              </>
            )}
          </>
        )}
      </div>

      {/* Right: Date + Time */}
      <div className="flex items-center gap-3 text-muted-foreground shrink-0">
        {weather && musicTrack && (
          <>
            <span className="hidden md:inline" title={weather.description}>
              {weatherIcon(weather.weatherCode, weather.isDay)} {weather.temperature}°C
            </span>
            <span className="hidden md:inline">│</span>
          </>
        )}
        <span className="hidden sm:inline">{dateStr}</span>
        <span className="text-foreground tabular-nums">{timeStr}</span>
      </div>
    </div>
  );
};
