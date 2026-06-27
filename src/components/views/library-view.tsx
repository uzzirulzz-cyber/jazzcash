'use client';

import { Heart, History, Tv, Trash2, Clock } from 'lucide-react';
import { useFetch } from '@/hooks/use-fetch';
import { useApp } from '@/lib/store';
import { ChannelCard } from '@/components/channel-card';
import { Button } from '@/components/ui/button';
import type { ChannelDTO } from '@/lib/types';

interface Props {
  mode: 'favorites' | 'history';
}

interface HistoryItem extends ChannelDTO {
  position?: number;
  duration?: number;
  watchedAt?: string;
}

export function LibraryView({ mode }: Props) {
  const refreshTick = useApp((s) => s.refreshTick);
  const url = mode === 'favorites' ? '/api/favorites' : '/api/history';
  const { data, loading } = useFetch<{ favorites?: ChannelDTO[]; history?: HistoryItem[] }>(url, [refreshTick]);

  const items: (ChannelDTO & { position?: number; duration?: number; watchedAt?: string })[] =
    mode === 'favorites' ? data?.favorites ?? [] : data?.history ?? [];

  const meta = mode === 'favorites'
    ? { label: 'Favorites', icon: <Heart className="h-5 w-5" />, accent: 'text-red-500', desc: 'Channels you’ve saved to watch later', empty: 'You haven’t added any favorites yet. Tap the heart on any channel to save it here.' }
    : { label: 'Watch History', icon: <History className="h-5 w-5" />, accent: 'text-brand', desc: 'Recently watched channels with resume positions', empty: 'No watch history yet. Play a channel to see it here.' };

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${meta.accent}`}>
          {meta.icon}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{meta.label}</h1>
          <p className="text-sm text-muted-foreground">{meta.desc}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-video bg-muted" />
              <div className="space-y-2 p-2.5">
                <div className="h-3.5 w-3/4 rounded bg-muted" />
                <div className="h-2.5 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Tv className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">Nothing here yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{meta.empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((ch) => (
            <div key={ch.id} className="relative">
              <ChannelCard channel={ch} className="w-full" />
              {mode === 'history' && ch.position && ch.position > 0 && (
                <div className="absolute bottom-[68px] left-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                  <Clock className="mr-1 inline h-2.5 w-2.5" />
                  Resumed at {Math.floor(ch.position / 60)}:{String(Math.floor(ch.position % 60)).padStart(2, '0')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
