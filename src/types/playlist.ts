import { StreamHealthResult } from '../utils/streamChecker';

export interface Channel {
  id: string;
  name: string;
  url: string;
  logo: string;
  group: string;
  tvgId: string;
  tvgName?: string;
  tvgChno?: string;
  format: 'HLS' | 'MP4' | 'TS' | 'DASH' | 'STREAM';
  rawExtinf?: string;
}

export interface PlaylistData {
  title: string;
  filename?: string;
  channels: Channel[];
  groups: string[];
  totalChannels: number;
  channelsWithLogo: number;
  parsedAt: string;
}

export interface FilterOptions {
  searchQuery: string;
  selectedGroup: string;
  formatFilter: 'ALL' | 'HLS' | 'MP4' | 'TS' | 'OTHER';
  statusFilter: 'ALL' | 'LIVE' | 'OFFLINE' | 'UNCHECKED';
  sortBy: 'order' | 'name-asc' | 'name-desc' | 'group-asc';
}

export type ViewMode = 'list' | 'grid';
export type { StreamHealthResult };
