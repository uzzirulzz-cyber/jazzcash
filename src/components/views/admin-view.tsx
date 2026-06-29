'use client';

import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { ListVideo, Tv, FolderTree, BarChart3, Settings, ShieldCheck, DollarSign, Megaphone, Brain } from 'lucide-react';
import { PlaylistsTab } from './admin/playlists-tab';
import { ChannelsTab } from './admin/channels-tab';
import { CategoriesTab } from './admin/categories-tab';
import { AnalyticsTab } from './admin/analytics-tab';
import { SettingsTab } from './admin/settings-tab';
import { RevenueDashboard } from './admin/revenue-dashboard';
import { AdsTab } from './admin/ads-tab';
import { AIMonetizationDashboard } from './admin/ai-monetization';

const TABS = [
  { id: 'playlists', label: 'Playlists', icon: ListVideo },
  { id: 'channels', label: 'Channels', icon: Tv },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'monetization', label: 'Monetization AI', icon: Brain },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'ads', label: 'Ads', icon: Megaphone },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

export function AdminView() {
  const { adminTab, setAdminTab } = useApp();

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-brand">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">
            Manage playlists, channels, categories and monitor platform health.
          </p>
        </div>
      </div>

      {/* tabs */}
      <div className="scroll-thin flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setAdminTab(t.id)}
            className={cn(
              'flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              adminTab === t.id
                ? 'border-brand text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* content */}
      {adminTab === 'playlists' && <PlaylistsTab />}
      {adminTab === 'channels' && <ChannelsTab />}
      {adminTab === 'categories' && <CategoriesTab />}
      {adminTab === 'analytics' && <AnalyticsTab />}
      {adminTab === 'monetization' && <AIMonetizationDashboard />}
      {adminTab === 'revenue' && <RevenueDashboard />}
      {adminTab === 'ads' && <AdsTab />}
      {adminTab === 'settings' && <SettingsTab />}
    </div>
  );
}
