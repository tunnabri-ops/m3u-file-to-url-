import { StreamHealthResult } from '../utils/streamChecker';

export type ResolutionTag = '4K' | 'FHD' | 'HD' | 'SD' | 'OTHER';
export type AccentTheme = 'cyan' | 'purple' | 'emerald';

export interface Channel {
  id: string;
  name: string;
  url: string;
  logo: string;
  group: string;
  tvgId: string;
  tvgName?: string;
  tvgChno?: string;
  resolution?: ResolutionTag;
  format: 'HLS' | 'MP4' | 'TS' | 'DASH' | 'STREAM';
  rawExtinf?: string;
}

export interface PlaylistData {
  title: string;
  slug?: string;
  filename?: string;
  channels: Channel[];
  groups: string[];
  totalChannels: number;
  channelsWithLogo: number;
  parsedAt: string;
  updatedAt?: string;
  epgUrl?: string;
}

export interface SavedPlaylistSummary {
  slug: string;
  title: string;
  description: string;
  updatedAt: string;
  channelCount: number;
  groups: string[];
  epgUrl?: string;
}

export interface FilterOptions {
  searchQuery: string;
  selectedGroup: string;
  formatFilter: 'ALL' | 'HLS' | 'MP4' | 'TS' | 'OTHER';
  statusFilter: 'ALL' | 'LIVE' | 'OFFLINE' | 'UNCHECKED';
  resolutionFilter: 'ALL' | '4K' | 'FHD' | 'HD' | 'SD';
  onlyFavorites: boolean;
  sortBy: 'order' | 'name-asc' | 'name-desc' | 'group-asc';
}

export type ViewMode = 'list' | 'grid';

export interface XtreamConfig {
  serverUrl: string;
  username: string;
  password: string;
  outputFormat: 'm3u_plus' | 'ts' | 'm3u8';
}

export type { StreamHealthResult };
