'use client';

import { useMemo, useState } from 'react';
import { Radio, Trophy, Target, Swords, Medal, Filter, Loader2, Tv } from 'lucide-react';
import { useFetch } from '@/hooks/use-fetch';
import { useApp, type ViewId } from '@/lib/store';
import { ChannelCard } from '@/components/channel-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ChannelDTO } from '@/lib/types';

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; accent: string; desc: string }> = {
  Football: { label: 'Football', icon: <Trophy className="h-5 w-5" />, accent: 'text-emerald-500', desc: 'Premier League, Champions League, La Liga, Serie A, Bundesliga & more' },
  Cricket: { label: 'Cricket', icon: <Target className="h-5 w-5" />, accent: 'text-amber-500', desc: 'IPL, PSL, BBL, CPL, ICC Events, Asia Cup, Test, ODI & T20' },
  Wrestling: { label: 'Wrestling', icon: <Swords className="h-5 w-5" />, accent: 'text-rose-500', desc: 'WWE RAW, SmackDown, NXT, AEW, UFC, PPV & WrestleMania' },
  'Other Sports': { label: 'Other Sports', icon: <Medal className="h-5 w-5" />, accent: 'text-violet-500', desc: 'Basketball, Tennis, Baseball, F1, MotoGP, Boxing, MMA, Golf & more' },
};

interface Props {
  viewId: ViewId;
}

export function CategoryView({ viewId }: Props) {
  const refreshTick = useApp((s) => s.refreshTick);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [visible, setVisible] = useState(48);

  // Determine which category to fetch.
  const isLive = viewId === 'live';
  const categoryName = isLive ? null : viewId === 'other-sports' ? 'Other Sports' : viewId.charAt(0).toUpperCase() + viewId.slice(1);

  const params = new URLSearchParams({ limit: '300' });
  if (isLive) params.set('liveNow', 'true');
  else if (categoryName) params.set('category', categoryName);
  if (subcategory) params.set('subcategory', subcategory);

  const { data, loading } = useFetch<{ channels: ChannelDTO[]; total: number }>(
    `/api/channels?${params.toString()}`,
    [refreshTick, subcategory],
  );

  const meta = categoryName ? CATEGORY_META[categoryName] : { label: 'Live Now', icon: <Radio className="h-5 w-5" />, accent: 'text-red-500', desc: 'Channels streaming live right now' };

  // collect unique subcategories from fetched channels for the filter chips
  const subcats = useMemo(() => {
    const set = new Set<string>();
    data?.channels.forEach((c) => c.subcategory && set.add(c.subcategory));
    return Array.from(set).sort();
  }, [data]);

  const channels = data?.channels ?? [];
  const shown = channels.slice(0, visible);

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-muted', meta.accent)}>
            {meta.icon}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{meta.label}</h1>
            <p className="text-sm text-muted-foreground">{meta.desc}</p>
          </div>
        </div>
        <Badge variant="secondary" className="w-fit">
          {data?.total ?? 0} channels
        </Badge>
      </div>

      {/* subcategory filter */}
      {!isLive && subcats.length > 0 && (
        <div className="scroll-thin flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => { setSubcategory(null); setVisible(48); }}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              !subcategory ? 'border-brand bg-brand text-brand-foreground' : 'border-border hover:bg-muted',
            )}
          >
            All
          </button>
          {subcats.map((s) => (
            <button
              key={s}
              onClick={() => { setSubcategory(s); setVisible(48); }}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                subcategory === s ? 'border-brand bg-brand text-brand-foreground' : 'border-border hover:bg-muted',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-video bg-muted" />
              <div className="space-y-2 p-2.5">
                <div className="h-3.5 w-3/4 rounded bg-muted" />
                <div className="h-2.5 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Tv className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">No channels in this section</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try refreshing playlists or check another category.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {shown.map((ch) => (
              <ChannelCard key={ch.id} channel={ch} className="w-full" />
            ))}
          </div>
          {visible < channels.length && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => setVisible((v) => v + 48)}>
                Load more ({channels.length - visible} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
