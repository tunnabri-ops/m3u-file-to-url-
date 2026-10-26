import { Channel } from '../types/playlist';

export interface LocalSavedPlaylist {
  slug: string;
  title: string;
  description: string;
  channelCount: number;
  channels: Channel[];
  updatedAt: string;
}

const STORAGE_KEY = 'm3u_file_local_playlists';

/**
 * Retrieves all saved playlists stored in the browser's localStorage.
 */
export function getStoredPlaylists(): LocalSavedPlaylist[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load playlists from localStorage:', err);
    return [];
  }
}

/**
 * Checks if a custom slug is already used in localStorage.
 */
export function isSlugAvailable(slug: string, currentEditingSlug?: string): boolean {
  const clean = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
  if (!clean) return false;
  if (currentEditingSlug && clean === currentEditingSlug.toLowerCase().trim()) {
    return true;
  }
  const playlists = getStoredPlaylists();
  return !playlists.some((p) => p.slug.toLowerCase() === clean);
}

/**
 * Saves or updates a playlist in the browser's localStorage.
 */
export function savePlaylistLocally(data: {
  slug: string;
  title: string;
  description?: string;
  channels: Channel[];
}): LocalSavedPlaylist {
  const cleanSlug = data.slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'my-playlist';

  const newRecord: LocalSavedPlaylist = {
    slug: cleanSlug,
    title: data.title.trim() || cleanSlug,
    description: (data.description || '').trim(),
    channelCount: data.channels.length,
    channels: data.channels,
    updatedAt: new Date().toISOString(),
  };

  const existing = getStoredPlaylists();
  const index = existing.findIndex((p) => p.slug.toLowerCase() === cleanSlug);

  let updatedList: LocalSavedPlaylist[];
  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = newRecord;
  } else {
    updatedList = [newRecord, ...existing];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }

  return newRecord;
}

/**
 * Retrieves a single playlist from localStorage by slug.
 */
export function getPlaylistBySlug(slug: string): LocalSavedPlaylist | null {
  const clean = slug.toLowerCase().trim();
  const list = getStoredPlaylists();
  return list.find((p) => p.slug.toLowerCase() === clean) || null;
}

/**
 * Deletes a playlist from localStorage by slug.
 */
export function deletePlaylistLocally(slug: string): boolean {
  const clean = slug.toLowerCase().trim();
  const list = getStoredPlaylists();
  const filtered = list.filter((p) => p.slug.toLowerCase() !== clean);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Failed to delete from localStorage:', err);
    return false;
  }
}

/**
 * Builds valid standard #EXTM3U playlist content from channel records.
 */
export function generateM3UContent(channels: Channel[], playlistTitle?: string): string {
  let content = '#EXTM3U\n';
  if (playlistTitle) {
    content += `## ${playlistTitle}\n`;
  }

  for (const c of channels) {
    const idAttr = c.tvgId ? ` tvg-id="${c.tvgId}"` : '';
    const nameAttr = c.name ? ` tvg-name="${c.name}"` : '';
    const logoAttr = c.logo ? ` tvg-logo="${c.logo}"` : '';
    const groupAttr = c.group ? ` group-title="${c.group}"` : '';
    
    content += `#EXTINF:-1${idAttr}${nameAttr}${logoAttr}${groupAttr},${c.name}\n${c.url}\n`;
  }

  return content;
}

/**
 * Triggers a 100% client-side file download for the M3U playlist.
 */
export function downloadClientM3U(channels: Channel[], filename: string, title?: string): void {
  const m3uText = generateM3UContent(channels, title);
  const blob = new Blob([m3uText], { type: 'audio/x-mpegurl;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const cleanFilename = filename.endsWith('.m3u') || filename.endsWith('.m3u8')
    ? filename
    : `${filename}.m3u8`;

  const a = document.createElement('a');
  a.href = url;
  a.download = cleanFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Revoke object URL after slight delay
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Generates a 100% client-side shareable URL containing the playlist payload in the URL hash.
 * This works in any browser without needing any backend server or database!
 */
export function generateShareableHashUrl(channels: Channel[], title: string, slug: string): string {
  if (typeof window === 'undefined') return '';

  // Compact channels into minimal payload for URL hash (name, url, group, logo)
  const compactChannels = channels.slice(0, 400).map((c) => {
    const obj: { n: string; u: string; g?: string; l?: string } = {
      n: c.name,
      u: c.url,
    };
    if (c.group && c.group !== 'General') obj.g = c.group;
    if (c.logo) obj.l = c.logo;
    return obj;
  });

  const jsonStr = JSON.stringify(compactChannels);
  try {
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    const origin = window.location.origin;
    const path = window.location.pathname;
    return `${origin}${path}#playlist=${base64}`;
  } catch (err) {
    console.error('Failed to create hash URL:', err);
    return `${window.location.origin}${window.location.pathname}`;
  }
}
