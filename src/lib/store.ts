'use client';

import { create } from 'zustand';
import type { ChannelDTO } from '@/lib/types';

export type ViewId =
  | 'home'
  | 'live'
  | 'football'
  | 'cricket'
  | 'wrestling'
  | 'other-sports'
  | 'search'
  | 'favorites'
  | 'history'
  | 'admin';

interface AppState {
  view: ViewId;
  adminTab: 'playlists' | 'channels' | 'categories' | 'analytics' | 'settings';
  searchQuery: string;
  // player
  playerChannel: ChannelDTO | null;
  playerOpen: boolean;
  playerMinimized: boolean;
  // navigation
  setView: (v: ViewId) => void;
  setAdminTab: (t: AppState['adminTab']) => void;
  setSearchQuery: (q: string) => void;
  openPlayer: (ch: ChannelDTO) => void;
  closePlayer: () => void;
  minimizePlayer: (m: boolean) => void;
  // refresh trigger (bumped to refetch data)
  refreshTick: number;
  bumpRefresh: () => void;
}

export const useApp = create<AppState>((set) => ({
  view: 'home',
  adminTab: 'playlists',
  searchQuery: '',
  playerChannel: null,
  playerOpen: false,
  playerMinimized: false,
  setView: (v) => set({ view: v }),
  setAdminTab: (t) => set({ adminTab: t, view: 'admin' }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  openPlayer: (ch) => set({ playerChannel: ch, playerOpen: true, playerMinimized: false }),
  closePlayer: () => set({ playerOpen: false, playerChannel: null, playerMinimized: false }),
  minimizePlayer: (m) => set({ playerMinimized: m }),
  refreshTick: 0,
  bumpRefresh: () => set((s) => ({ refreshTick: s.refreshTick + 1 })),
}));
