// Helpers to convert Prisma records into DTOs for the API.

import type { Channel, Playlist } from '@prisma/client';
import type { ChannelDTO, PlaylistDTO } from './types';

export function toChannelDTO(
  ch: Channel & { playlist?: Playlist | null },
  isFavorite = false,
): ChannelDTO {
  return {
    id: ch.id,
    name: ch.name,
    displayName: ch.displayName,
    url: ch.url,
    logo: ch.logo,
    category: ch.category,
    subcategory: ch.subcategory,
    country: ch.country,
    language: ch.language,
    tvgName: ch.tvgName,
    groupTitle: ch.groupTitle,
    status: ch.status,
    enabled: ch.enabled,
    featured: ch.featured,
    trending: ch.trending,
    liveNow: ch.liveNow,
    viewCount: ch.viewCount,
    sourceId: ch.sourceId,
    sourceName: ch.playlist?.name ?? 'Unknown',
    isFavorite,
  };
}

export function toPlaylistDTO(pl: Playlist): PlaylistDTO {
  return {
    id: pl.id,
    name: pl.name,
    url: pl.url,
    status: pl.status,
    channelCount: pl.channelCount,
    onlineCount: pl.onlineCount,
    offlineCount: pl.offlineCount,
    lastRefreshAt: pl.lastRefreshAt ? pl.lastRefreshAt.toISOString() : null,
    lastRefreshMs: pl.lastRefreshMs,
    nextRefreshAt: pl.nextRefreshAt ? pl.nextRefreshAt.toISOString() : null,
    refreshHours: pl.refreshHours,
    errorMessage: pl.errorMessage,
    enabled: pl.enabled,
  };
}
