'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ChannelCard } from './channel-card';
import type { ChannelDTO } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  icon?: React.ReactNode;
  channels: ChannelDTO[];
  loading?: boolean;
  accent?: string;
  action?: React.ReactNode;
}

export function ChannelRail({ title, icon, channels, loading, accent, action }: Props) {
  const scroller = useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' });
  }

  if (!loading && channels.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-muted', accent)}>{icon}</span>}
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {channels.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {action}
          <div className="hidden gap-1 sm:flex">
            <button
              onClick={() => scroll(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-muted"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-muted"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-44 shrink-0 animate-pulse overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-video bg-muted" />
              <div className="space-y-2 p-2.5">
                <div className="h-3.5 w-3/4 rounded bg-muted" />
                <div className="h-2.5 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scroller}
          className="scroll-thin flex gap-3 overflow-x-auto pb-2"
        >
          {channels.map((ch, i) => (
            <div key={ch.id} className="flex shrink-0 gap-3">
              <ChannelCard channel={ch} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
