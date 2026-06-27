'use client';

import Image from 'next/image';
import { Play, Heart, Radio, Tv, Bell } from 'lucide-react';
import type { ChannelDTO } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/store';
import { apiAction } from '@/hooks/use-fetch';
import { toast } from 'sonner';
import { useState } from 'react';

interface Props {
  channel: ChannelDTO;
  className?: string;
  compact?: boolean;
}

export function ChannelCard({ channel, className, compact }: Props) {
  const openPlayer = useApp((s) => s.openPlayer);
  const bumpRefresh = useApp((s) => s.bumpRefresh);
  const openAuth = useApp((s) => s.openAuth);
  const authUser = useApp((s) => s.authUser);
  const [fav, setFav] = useState(channel.isFavorite);
  const [subscribed, setSubscribed] = useState(channel.isSubscribed);

  async function toggleFav(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !fav;
    setFav(next);
    const res = await apiAction(
      next ? 'POST' : 'DELETE',
      next ? '/api/favorites' : `/api/favorites/${channel.id}`,
      next ? { channelId: channel.id } : undefined,
    );
    if (!res.ok) {
      setFav(!next);
      toast.error(res.error || 'Failed to update favorite');
    } else {
      toast.success(next ? 'Added to favorites' : 'Removed from favorites');
      bumpRefresh();
    }
  }

  async function toggleNotify(e: React.MouseEvent) {
    e.stopPropagation();
    if (!authUser) {
      openAuth('signup');
      return;
    }
    const next = !subscribed;
    setSubscribed(next);
    const res = await apiAction('POST', `/api/channels/${channel.id}/notify`);
    if (res.ok) {
      toast.success(next ? `You'll be notified when ${channel.displayName} goes live` : 'Notifications disabled');
      bumpRefresh();
    } else {
      setSubscribed(!next);
      toast.error(res.error || 'Failed');
    }
  }

  return (
    <div
      onClick={() => openPlayer(channel)}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-brand hover:ring-2 hover:ring-brand/30 hover:-translate-y-0.5',
        compact ? 'w-40' : 'w-44',
        className,
      )}
    >
      {/* logo / thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {channel.logo ? (
           
          <img
            src={channel.logo}
            alt={channel.displayName}
            className="h-full w-full object-contain p-2 transition-transform group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Tv className="h-8 w-8" />
          </div>
        )}

        {/* play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-full brand-bg shadow-lg">
            <Play className="h-5 w-5 fill-current" />
          </div>
        </div>

        {/* live badge */}
        {channel.liveNow && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            <Radio className="h-2.5 w-2.5 live-dot" />
            LIVE
          </div>
        )}

        {/* notify + favorite */}
        <div className="absolute right-2 top-2 flex gap-1">
          <button
            onClick={toggleNotify}
            aria-label="Notify when live"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-colors hover:bg-black/70"
          >
            <Bell
              className={cn('h-3.5 w-3.5', subscribed ? 'fill-amber-500 text-amber-500' : 'text-white')}
            />
          </button>
          <button
            onClick={toggleFav}
            aria-label="Toggle favorite"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-colors hover:bg-black/70"
          >
            <Heart
              className={cn('h-3.5 w-3.5', fav ? 'fill-red-500 text-red-500' : 'text-white')}
            />
          </button>
        </div>
      </div>

      {/* info */}
      <div className="p-2.5">
        <h3 className="line-clamp-1 text-sm font-semibold leading-tight" title={channel.displayName}>
          {channel.displayName}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="truncate">{channel.subcategory || channel.category}</span>
          {channel.country && (
            <>
              <span>·</span>
              <span className="truncate">{channel.country}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
