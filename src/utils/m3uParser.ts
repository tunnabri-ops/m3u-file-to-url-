import { Channel, PlaylistData } from '../types/playlist';
import { detectResolution } from './resolutionHelper';

function detectFormat(url: string): Channel['format'] {
  const cleanUrl = url.toLowerCase().split('?')[0];
  if (cleanUrl.endsWith('.m3u8')) return 'HLS';
  if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.m4v') || cleanUrl.endsWith('.mov')) return 'MP4';
  if (cleanUrl.endsWith('.ts')) return 'TS';
  if (cleanUrl.endsWith('.mpd')) return 'DASH';
  if (url.includes('.m3u8')) return 'HLS';
  return 'STREAM';
}

function parseAttribute(line: string, attrName: string): string {
  const quotedRegex = new RegExp(`${attrName}="([^"]*)"`, 'i');
  const quotedMatch = line.match(quotedRegex);
  if (quotedMatch && quotedMatch[1] !== undefined) {
    return quotedMatch[1].trim();
  }
  const regex = new RegExp(`${attrName}=["']?([^"'>\\s]+)["']?`, 'i');
  const match = line.match(regex);
  return match && match[1] ? match[1].trim() : '';
}

export function parseM3U(content: string, filename = 'playlist.m3u'): PlaylistData {
  if (!content) {
    return {
      title: filename.replace(/\.[^/.]+$/, ''),
      filename,
      channels: [],
      groups: [],
      totalChannels: 0,
      channelsWithLogo: 0,
      parsedAt: new Date().toISOString(),
    };
  }

  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const channels: Channel[] = [];
  const groupsSet = new Set<string>();

  let currentExtinf = '';
  let currentGroupFromTag = '';
  let epgUrl = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    // Check for EXTM3U header and extract EPG
    if (line.startsWith('#EXTM3U')) {
      const tvgUrl = parseAttribute(line, 'url-tvg') || parseAttribute(line, 'x-tvg-url');
      if (tvgUrl) {
        epgUrl = tvgUrl;
      }
      continue;
    }

    // Check for EXTINF
    if (line.startsWith('#EXTINF:')) {
      currentExtinf = line;
      continue;
    }

    // Check for EXTGRP tag
    if (line.startsWith('#EXTGRP:')) {
      currentGroupFromTag = line.substring(8).trim();
      continue;
    }

    // Check for other comment lines, ignore unless it's a URL
    if (line.startsWith('#')) {
      continue;
    }

    // If it doesn't start with '#', this is a stream URL
    if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://') || line.startsWith('rtsp://') || line.includes('://')) {
      const streamUrl = line;
      let name = '';
      let logo = '';
      let group = '';
      let tvgId = '';
      let tvgName = '';
      let tvgChno = '';

      if (currentExtinf) {
        const commaIndex = currentExtinf.lastIndexOf(',');
        if (commaIndex !== -1) {
          name = currentExtinf.substring(commaIndex + 1).trim();
        }

        logo = parseAttribute(currentExtinf, 'tvg-logo');
        group = parseAttribute(currentExtinf, 'group-title');
        tvgId = parseAttribute(currentExtinf, 'tvg-id');
        tvgName = parseAttribute(currentExtinf, 'tvg-name');
        tvgChno = parseAttribute(currentExtinf, 'tvg-chno');
      }

      if (!group && currentGroupFromTag) {
        group = currentGroupFromTag;
      }
      if (!group) {
        group = 'General';
      }

      if (!name) {
        if (tvgName) {
          name = tvgName;
        } else {
          try {
            const urlObj = new URL(streamUrl);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            name = pathParts[pathParts.length - 1] || 'Stream Channel';
          } catch {
            name = `Channel ${channels.length + 1}`;
          }
        }
      }

      groupsSet.add(group);

      channels.push({
        id: `ch-${channels.length + 1}-${i.toString(36)}`,
        name,
        url: streamUrl,
        logo,
        group,
        tvgId,
        tvgName,
        tvgChno,
        resolution: detectResolution(name, streamUrl),
        format: detectFormat(streamUrl),
        rawExtinf: currentExtinf,
      });

      // Reset state for next channel
      currentExtinf = '';
      currentGroupFromTag = '';
    }
  }

  const groups = Array.from(groupsSet).sort((a, b) => a.localeCompare(b));
  const channelsWithLogo = channels.filter((ch) => !!ch.logo).length;

  return {
    title: filename.replace(/\.[^/.]+$/, '') || 'Stream Playlist',
    filename,
    channels,
    groups,
    totalChannels: channels.length,
    channelsWithLogo,
    parsedAt: new Date().toISOString(),
    epgUrl: epgUrl || undefined,
  };
}

export function exportCleanM3U(
  playlistOrChannels: PlaylistData | Channel[],
  channelsOrTitle?: Channel[] | string,
  maybeEpgUrl?: string
): string {
  let channels: Channel[] = [];
  let title = '';
  let epgUrl: string | undefined;

  if (Array.isArray(playlistOrChannels)) {
    channels = playlistOrChannels;
    if (typeof channelsOrTitle === 'string') {
      title = channelsOrTitle;
    }
    epgUrl = maybeEpgUrl;
  } else {
    channels = Array.isArray(channelsOrTitle) ? channelsOrTitle : playlistOrChannels.channels || [];
    title = playlistOrChannels.title || '';
    epgUrl = playlistOrChannels.epgUrl;
  }

  let content = '#EXTM3U';
  if (epgUrl) {
    content += ` url-tvg="${epgUrl.trim()}"`;
  }
  content += '\n';

  if (title) {
    content += `## ${title}\n`;
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

export function exportPlainUrls(channels: Channel[]): string {
  return channels.map((c) => c.url).join('\n');
}

export function exportJSON(channels: Channel[]): string {
  return JSON.stringify(channels, null, 2);
}

export function exportCSV(channels: Channel[]): string {
  const header = 'Name,Group,URL,Logo,TvgId,Format,Resolution';
  const rows = channels.map((c) => {
    const name = `"${(c.name || '').replace(/"/g, '""')}"`;
    const group = `"${(c.group || '').replace(/"/g, '""')}"`;
    const url = `"${(c.url || '').replace(/"/g, '""')}"`;
    const logo = `"${(c.logo || '').replace(/"/g, '""')}"`;
    const tvgId = `"${(c.tvgId || '').replace(/"/g, '""')}"`;
    const format = c.format || 'STREAM';
    const resolution = c.resolution || 'OTHER';
    return `${name},${group},${url},${logo},${tvgId},${format},${resolution}`;
  });
  return [header, ...rows].join('\n');
}
