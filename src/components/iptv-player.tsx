'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  X, Minimize2, Maximize2, Maximize, Minimize, Heart, Radio,
  Loader2, AlertTriangle, Volume2, VolumeX, Settings, Tv,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { apiAction } from '@/hooks/use-fetch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ChannelDTO } from '@/lib/types';

export function IptvPlayer() {
  const { playerOpen, playerChannel, playerMinimized, closePlayer, minimizePlayer } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [muted, setMuted] = useState(false);
  const [levels, setLevels] = useState<{ height: number; index: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [showSettings, setShowSettings] = useState(false);
  const [fav, setFav] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // sync favorite state with current channel
  useEffect(() => {
    setFav(playerChannel?.isFavorite ?? false);
  }, [playerChannel]);

  // load the stream whenever the channel changes
  const loadStream = useCallback(() => {
    const video = videoRef.current;
    const channel = playerChannel;
    if (!video || !channel) return;

    setLoading(true);
    setError(null);
    setLevels([]);
    setCurrentLevel(-1);

    // cleanup previous hls
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isM3u8 = /\.m3u8(\?|$)/i.test(channel.url) || channel.url.includes('m3u8');

    const onReady = () => {
      setLoading(false);
      video.play().catch(() => {});
    };

    if (isM3u8 && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        setLevels(
          data.levels
            .map((l, i) => ({ height: l.height || 0, index: i }))
            .sort((a, b) => b.height - a.height),
        );
        setCurrentLevel(-1); // auto
        onReady();
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          setLoading(false);
          setError(
            data.type === Hls.ErrorTypes.NETWORK_ERROR
              ? 'Network error — stream may be offline or geo-blocked.'
              : data.type === Hls.ErrorTypes.MEDIA_ERROR
                ? 'Media error — this stream format is not playable.'
                : 'Stream failed to load.',
          );
        }
      });
    } else {
      // native playback (Safari / direct mp4 / plain HLS)
      video.src = channel.url;
      video.addEventListener('loadedmetadata', onReady, { once: true });
      video.addEventListener('error', () => {
        setLoading(false);
        setError('Unable to play this stream directly.');
      });
    }

    // record view + history
    apiAction('PATCH', `/api/channels/${channel.id}`, { incrementView: true });
    apiAction('POST', '/api/history', { channelId: channel.id, position: 0, duration: 0 });
  }, [playerChannel]);

  useEffect(() => {
    if (playerOpen && playerChannel) loadStream();
     
  }, [playerOpen, playerChannel?.id, retryKey]);

  // periodic position save (resume playback)
  useEffect(() => {
    if (!playerOpen) return;
    saveTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      const channel = playerChannel;
      if (video && channel && !video.paused) {
        apiAction('POST', '/api/history', {
          channelId: channel.id,
          position: video.currentTime,
          duration: video.duration || 0,
        });
      }
    }, 10000);
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [playerOpen, playerChannel]);

  // cleanup on close
  useEffect(() => {
    if (!playerOpen) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      const video = videoRef.current;
      if (video) video.removeAttribute('src');
    }
  }, [playerOpen]);

  // fullscreen tracking
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  if (!playerOpen || !playerChannel) return null;

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen().catch(() => {});
  }

  async function togglePip() {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPip(false);
      } else {
        await video.requestPictureInPicture();
        setIsPip(true);
      }
    } catch {
      toast.error('Picture-in-Picture not available');
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function changeLevel(index: number) {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
      setCurrentLevel(index);
    }
    setShowSettings(false);
  }

  async function toggleFav() {
    if (!playerChannel) return;
    const next = !fav;
    setFav(next);
    const res = await apiAction(
      next ? 'POST' : 'DELETE',
      next ? '/api/favorites' : `/api/favorites/${playerChannel.id}`,
      next ? { channelId: playerChannel.id } : undefined,
    );
    if (!res.ok) {
      setFav(!next);
      toast.error(res.error || 'Failed');
    } else {
      toast.success(next ? 'Added to favorites' : 'Removed from favorites');
    }
  }

  const channel = playerChannel;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur transition-all',
        playerMinimized && 'pointer-events-none',
      )}
    >
      {/* hidden when minimized */}
      <div className={cn('flex h-full flex-col', playerMinimized && 'hidden')}>
        {/* top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {channel.logo && (
               
              <img src={channel.logo} alt="" className="h-8 w-8 rounded object-contain" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-bold text-white sm:text-base">{channel.displayName}</h3>
                {channel.liveNow && (
                  <span className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    <Radio className="h-2.5 w-2.5 live-dot" /> LIVE
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-white/60">
                {channel.subcategory ? `${channel.subcategory} · ` : ''}
                {channel.category} · {channel.sourceName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleFav}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
              aria-label="Favorite"
            >
              <Heart className={cn('h-4 w-4', fav && 'fill-red-500 text-red-500')} />
            </button>
            <button
              onClick={() => minimizePlayer(true)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 sm:flex"
              aria-label="Minimize"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={closePlayer}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* video */}
        <div ref={containerRef} className="relative flex-1 bg-black">
          <video
            ref={videoRef}
            className="h-full w-full"
            controls
            playsInline
            autoPlay
            muted={muted}
          />

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
              <Loader2 className="h-10 w-10 animate-spin text-brand" />
              <p className="text-sm text-white/70">Loading stream…</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-400" />
              <div>
                <p className="text-base font-semibold text-white">Playback failed</p>
                <p className="mt-1 max-w-md text-sm text-white/60">{error}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRetryKey((k) => k + 1)}
                  className="rounded-lg brand-bg px-4 py-2 text-sm font-semibold"
                >
                  Retry
                </button>
                <button
                  onClick={closePlayer}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Close
                </button>
              </div>
              <p className="mt-2 max-w-md text-xs text-white/40">
                Some IPTV streams are geo-blocked or temporarily offline. Try another channel from the same category.
              </p>
            </div>
          )}

          {/* custom control bar */}
          {!loading && !error && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => setShowSettings((s) => !s)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70"
                  aria-label="Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
                {showSettings && (
                  <div className="absolute bottom-11 right-0 w-44 rounded-lg border border-white/10 bg-black/90 p-2 text-sm text-white shadow-xl">
                    <p className="px-2 py-1 text-xs font-semibold uppercase text-white/50">Quality</p>
                    <button
                      onClick={() => changeLevel(-1)}
                      className={cn(
                        'flex w-full items-center justify-between rounded px-2 py-1.5 hover:bg-white/10',
                        currentLevel === -1 && 'text-brand',
                      )}
                    >
                      Auto {levels.length > 0 && <span className="text-xs text-white/40">({levels.length} levels)</span>}
                    </button>
                    {levels.map((l) => (
                      <button
                        key={l.index}
                        onClick={() => changeLevel(l.index)}
                        className={cn(
                          'flex w-full items-center justify-between rounded px-2 py-1.5 hover:bg-white/10',
                          currentLevel === l.index && 'text-brand',
                        )}
                      >
                        {l.height ? `${l.height}p` : `Track ${l.index + 1}`}
                      </button>
                    ))}
                    {levels.length === 0 && (
                      <p className="px-2 py-1 text-xs text-white/40">Single quality</p>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={toggleMute}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70"
                aria-label="Mute"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                onClick={togglePip}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70',
                  isPip && 'text-brand',
                )}
                aria-label="Picture in picture"
              >
                <Minimize className="h-4 w-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70"
                aria-label="Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>

        {/* bottom info */}
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
            <span className="flex items-center gap-1 rounded bg-white/10 px-2 py-1">
              <Tv className="h-3 w-3" /> {channel.sourceName}
            </span>
            {channel.country && <span className="rounded bg-white/10 px-2 py-1">{channel.country}</span>}
            {channel.language && <span className="rounded bg-white/10 px-2 py-1">{channel.language}</span>}
            <span className="rounded bg-white/10 px-2 py-1 capitalize">{channel.status}</span>
            <span className="ml-auto truncate font-mono text-[10px] text-white/30">{channel.url}</span>
          </div>
        </div>
      </div>

      {/* minimized mini player */}
      {playerMinimized && (
        <div className="pointer-events-auto fixed bottom-4 right-4 z-50 w-80 overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
          <div className="relative aspect-video bg-black">
            {/* note: the actual <video> lives above; for the mini view we show a poster + controls */}
            {channel.logo ? (
               
              <img src={channel.logo} alt="" className="h-full w-full object-contain p-4" />
            ) : (
              <div className="flex h-full items-center justify-center text-white/40">
                <Tv className="h-8 w-8" />
              </div>
            )}
            <button
              onClick={() => minimizePlayer(false)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={closePlayer}
              className="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-2">
            <p className="truncate text-xs font-semibold text-white">{channel.displayName}</p>
            <p className="truncate text-[10px] text-white/50">{channel.category}</p>
          </div>
        </div>
      )}
    </div>
  );
}
