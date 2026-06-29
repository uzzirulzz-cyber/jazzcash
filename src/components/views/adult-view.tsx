'use client';

import { useMemo, useState } from 'react';
import { AlertOctagon, Lock, Tv, CheckCircle2, ShieldAlert, Eye, EyeOff, Crown } from 'lucide-react';
import { useFetch } from '@/hooks/use-fetch';
import { useApp } from '@/lib/store';
import { ChannelCard } from '@/components/channel-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ChannelDTO } from '@/lib/types';

const META = {
  label: 'Adult',
  icon: <AlertOctagon className="h-5 w-5" />,
  accent: 'text-red-600',
  desc: 'Adult content — 18+ only. Live channels, movies & premium content.',
};

const SUBCATEGORY_LABELS: Record<string, string> = {
  'Adult Live': 'Live Channels',
  'Adult Movies': 'Movies',
  'Adult Premium': 'Premium',
  'Adult 18+': '18+ Only',
};

export function AdultView() {
  const refreshTick = useApp((s) => s.refreshTick);
  const authUser = useApp((s) => s.authUser);
  const requestVipAccess = useApp((s) => s.requestVipAccess);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [visible, setVisible] = useState(48);
  const [blurred, setBlurred] = useState(true);

  const params = new URLSearchParams({ limit: '300', category: 'Adult' });
  if (subcategory) params.set('subcategory', subcategory);

  const { data, loading } = useFetch<{ channels: ChannelDTO[]; total: number }>(
    `/api/channels?${params.toString()}`,
    [refreshTick, subcategory],
  );

  const subcats = useMemo(() => {
    const set = new Set<string>();
    data?.channels.forEach((c) => c.subcategory && set.add(c.subcategory));
    return Array.from(set).sort();
  }, [data]);

  const channels = data?.channels ?? [];
  const shown = channels.slice(0, visible);

  // If not VIP, show the VIP-locked state with a button to open the VIP wall.
  if (!authUser?.vip) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-amber-500/40 bg-amber-950/20 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
            <Lock className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-amber-500">VIP Membership Required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This section is exclusive to VIP members. Subscribe for <span className="font-semibold text-foreground">$8/month</span> or log in with a VIP account to unlock 114+ premium adult channels.
          </p>
          <Button
            className="mt-6 gap-2 bg-amber-500 text-black hover:bg-amber-600"
            onClick={() => requestVipAccess()}
          >
            <Crown className="h-4 w-4" /> Unlock with VIP
          </Button>
          <Button
            variant="outline"
            className="mt-2 w-full gap-2"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/10', META.accent)}>
            {META.icon}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{META.label}</h1>
            <p className="text-sm text-muted-foreground">{META.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="w-fit">
            {data?.total ?? 0} channels
          </Badge>
          <Badge className="gap-1 bg-amber-500 text-black hover:bg-amber-600">
            <Crown className="h-3 w-3" /> VIP
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setBlurred(!blurred)}
          >
            {blurred ? <><Eye className="h-3.5 w-3.5" /> Show Thumbnails</> : <><EyeOff className="h-3.5 w-3.5" /> Hide Thumbnails</>}
          </Button>
        </div>
      </div>

      {/* 18+ warning banner */}
      <div className="flex items-center gap-3 rounded-xl border border-red-600/40 bg-red-950/20 p-3">
        <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-red-500">18+ Only.</span> This section contains adult content. By viewing this section you confirm you are at least 18 years of age and that adult content is legal in your jurisdiction.
        </p>
      </div>

      {/* subcategory filter */}
      {subcats.length > 0 && (
        <div className="scroll-thin flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => { setSubcategory(null); setVisible(48); }}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              !subcategory ? 'border-red-600 bg-red-600 text-white' : 'border-border hover:bg-muted',
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
                subcategory === s ? 'border-red-600 bg-red-600 text-white' : 'border-border hover:bg-muted',
              )}
            >
              {SUBCATEGORY_LABELS[s] ?? s}
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
            Try a different subcategory or refresh playlists.
          </p>
        </div>
      ) : (
        <>
          <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6', blurred && '[&_img]:blur-xl [&_.aspect-video]:bg-black')}>
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
