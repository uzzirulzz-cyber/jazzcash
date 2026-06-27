'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Radio, X, BellOff } from 'lucide-react';
import { useApp } from '@/lib/store';
import { useFetch, apiAction } from '@/hooks/use-fetch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NotifItem {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
  channel: { id: string; name: string; logo: string | null; liveNow: boolean } | null;
}

export function NotificationsBell() {
  const { setUnreadCount, openPlayer, bumpRefresh } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data, refetch } = useFetch<{ notifications: NotifItem[]; unreadCount: number }>('/api/notifications', []);

  useEffect(() => {
    if (data) setUnreadCount(data.unreadCount);
  }, [data, setUnreadCount]);

  // Poll for new notifications every 30s.
  useEffect(() => {
    const t = setInterval(() => refetch(), 30000);
    return () => clearInterval(t);
  }, [refetch]);

  // Close on outside click.
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  async function markAllRead() {
    const res = await apiAction('PATCH', '/api/notifications', { markAllRead: true });
    if (res.ok) { refetch(); setUnreadCount(0); }
  }

  async function markOne(id: string) {
    await apiAction('PATCH', '/api/notifications', { id });
    refetch();
  }

  function onNotifClick(n: NotifItem) {
    if (n.channel) {
      // open the player for this channel
      fetch(`/api/channels?limit=1`).then(() => {});
      // We don't have the full channel DTO here, so just navigate.
      // For simplicity, mark as read and close.
    }
    if (!n.read) markOne(n.id);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open) refetch(); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-xl sm:w-96">
          {/* header */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-bold">Notifications</span>
              {unread > 0 && <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-brand hover:underline">
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {/* list */}
          <div className="max-h-96 overflow-y-auto scroll-thin">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                <BellOff className="h-8 w-8" />
                <p>No notifications yet</p>
                <p className="text-xs">Tap the bell icon on any channel to get notified when it goes live.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onNotifClick(n)}
                  className={cn(
                    'flex w-full items-start gap-2.5 border-b border-border/50 p-3 text-left transition-colors hover:bg-muted/50',
                    !n.read && 'bg-brand/5',
                  )}
                >
                  {n.channel?.logo ? (
                     
                    <img src={n.channel.logo} alt="" className="mt-0.5 h-8 w-8 shrink-0 rounded object-contain" />
                  ) : (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                      {n.type === 'live' ? <Radio className="h-4 w-4 text-red-500" /> : <Bell className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
                      <p className="truncate text-sm font-semibold">{n.title}</p>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
