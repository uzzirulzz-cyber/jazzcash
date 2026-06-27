// Shared TypeScript types for the IPTV Sports Streaming Platform.

export interface ParsedChannel {
  name: string;
  url: string;
  logo?: string;
  tvgId?: string;
  tvgName?: string;
  groupTitle?: string;
  country?: string;
  language?: string;
}

export interface CategoryRule {
  category: string;
  subcategory: string | null;
  keywords: string[];
  /** higher priority wins when multiple rules match */
  priority: number;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  icon?: string;
  color?: string;
  keywords: string;
  isCustom: boolean;
  sortOrder: number;
}

export interface ChannelDTO {
  id: string;
  name: string;
  displayName: string;
  url: string;
  logo: string | null;
  category: string;
  subcategory: string | null;
  country: string | null;
  language: string | null;
  tvgName: string | null;
  groupTitle: string | null;
  status: string;
  enabled: boolean;
  featured: boolean;
  trending: boolean;
  liveNow: boolean;
  viewCount: number;
  sourceId: string;
  sourceName: string;
  isFavorite: boolean;
}

export interface PlaylistDTO {
  id: string;
  name: string;
  url: string;
  status: string;
  channelCount: number;
  onlineCount: number;
  offlineCount: number;
  lastRefreshAt: string | null;
  lastRefreshMs: number;
  nextRefreshAt: string | null;
  refreshHours: number;
  errorMessage: string | null;
  enabled: boolean;
}

export interface AnalyticsDTO {
  totalChannels: number;
  onlineChannels: number;
  offlineChannels: number;
  disabledChannels: number;
  totalPlaylists: number;
  activePlaylists: number;
  featuredChannels: number;
  trendingChannels: number;
  liveNowChannels: number;
  totalFavorites: number;
  totalViews: number;
  byCategory: { category: string; count: number }[];
  playlistHealth: {
    id: string;
    name: string;
    channelCount: number;
    onlineCount: number;
    offlineCount: number;
    health: number;
  }[];
  topChannels: { id: string; name: string; viewCount: number; logo: string | null }[];
}
