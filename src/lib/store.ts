'use client';

import { create } from 'zustand';
import type { ChannelDTO } from '@/lib/types';

export type ViewId =
  | 'landing'
  | 'home'
  | 'live'
  | 'football'
  | 'cricket'
  | 'wrestling'
  | 'other-sports'
  | 'movies'
  | 'music'
  | 'web-series'
  | 'adult'
  | 'events'
  | 'search'
  | 'favorites'
  | 'history'
  | 'notifications'
  | 'profile'
  | 'admin';

interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  vip?: boolean;
  vipExpiresAt?: string | null;
}

interface AppState {
  view: ViewId;
  adminTab: 'playlists' | 'channels' | 'categories' | 'analytics' | 'monetization' | 'revenue' | 'ads' | 'settings';
  searchQuery: string;
  // player
  playerChannel: ChannelDTO | null;
  playerOpen: boolean;
  playerMinimized: boolean;
  // auth
  authUser: AuthUser | null;
  authOpen: boolean;
  authMode: 'login' | 'signup';
  // notifications
  unreadCount: number;
  // VIP gate for Adult section — requires VIP membership ($8/mo)
  pendingVipAccess: boolean;
  // navigation
  setView: (v: ViewId) => void;
  setAdminTab: (t: AppState['adminTab']) => void;
  setSearchQuery: (q: string) => void;
  openPlayer: (ch: ChannelDTO) => void;
  closePlayer: () => void;
  minimizePlayer: (m: boolean) => void;
  // auth actions
  setAuthUser: (u: AuthUser | null) => void;
  openAuth: (mode: 'login' | 'signup') => void;
  closeAuth: () => void;
  // notifications
  setUnreadCount: (n: number) => void;
  // VIP gate actions
  requestVipAccess: () => void;
  cancelVipAccess: () => void;
  // refresh trigger (bumped to refetch data)
  refreshTick: number;
  bumpRefresh: () => void;
}

/** Parse the current view from the URL ?view= param. */
function getViewFromUrl(): ViewId {
  if (typeof window === 'undefined') return 'landing';
  const params = new URLSearchParams(window.location.search);
  const v = params.get('view') as ViewId | null;
  const valid: ViewId[] = ['landing', 'home', 'live', 'football', 'cricket', 'wrestling', 'other-sports', 'movies', 'music', 'web-series', 'adult', 'events', 'search', 'favorites', 'history', 'notifications', 'profile', 'admin'];
  return valid.includes(v as ViewId) ? (v as ViewId) : 'landing';
}

export const useApp = create<AppState>((set, get) => ({
  view: typeof window !== 'undefined' ? getViewFromUrl() : 'landing',
  adminTab: 'playlists',
  searchQuery: '',
  playerChannel: null,
  playerOpen: false,
  playerMinimized: false,
  authUser: null,
  authOpen: false,
  authMode: 'login',
  unreadCount: 0,
  pendingVipAccess: false,
  setView: (v) => {
    // VIP gate: clicking the Adult nav opens the VIP subscription wall
    // unless the logged-in user is already a VIP member.
    if (v === 'adult') {
      const user = get().authUser;
      if (!user?.vip) {
        set({ pendingVipAccess: true });
        return;
      }
    }
    // Update URL query param so it's shareable/bookmarkable.
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (v === 'landing') url.searchParams.delete('view');
      else url.searchParams.set('view', v);
      window.history.replaceState({}, '', url.toString());
    }
    set({ view: v });
  },
  setAdminTab: (t) => set({ adminTab: t, view: 'admin' }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  openPlayer: (ch) => set({ playerChannel: ch, playerOpen: true, playerMinimized: false }),
  closePlayer: () => set({ playerOpen: false, playerChannel: null, playerMinimized: false }),
  minimizePlayer: (m) => set({ playerMinimized: m }),
  setAuthUser: (u) => {
    set({ authUser: u });
    // If the user just became VIP (e.g. logged in as VIP), and they were
    // waiting on the VIP gate, navigate to the Adult view.
    if (u?.vip && get().pendingVipAccess) {
      set({ pendingVipAccess: false });
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'adult');
        window.history.replaceState({}, '', url.toString());
      }
      set({ view: 'adult' });
    }
  },
  openAuth: (mode) => set({ authOpen: true, authMode: mode }),
  closeAuth: () => set({ authOpen: false }),
  setUnreadCount: (n) => set({ unreadCount: n }),
  requestVipAccess: () => set({ pendingVipAccess: true }),
  cancelVipAccess: () => set({ pendingVipAccess: false }),
  refreshTick: 0,
  bumpRefresh: () => set((s) => ({ refreshTick: s.refreshTick + 1 })),
}));
