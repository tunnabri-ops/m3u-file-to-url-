import { Channel, PlaylistData } from '../types/playlist';

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
  // Regex to match attr="value" or attr='value' or attr=value
  const regex = new RegExp(`${attrName}=["']?([^"'>\\s]+)["']?`, 'i');
  const quotedRegex = new RegExp(`${attrName}="([^"]*)"`, 'i');
  const quotedMatch = line.match(quotedRegex);
  if (quotedMatch && quotedMatch[1] !== undefined) {
    return quotedMatch[1].trim();
  }
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

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

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
        // Extract comma and channel name
        const commaIndex = currentExtinf.lastIndexOf(',');
        if (commaIndex !== -1) {
          name = currentExtinf.substring(commaIndex + 1).trim();
        }

        // Extract attributes
        logo = parseAttribute(currentExtinf, 'tvg-logo');
        group = parseAttribute(currentExtinf, 'group-title');
        tvgId = parseAttribute(currentExtinf, 'tvg-id');
        tvgName = parseAttribute(currentExtinf, 'tvg-name');
        tvgChno = parseAttribute(currentExtinf, 'tvg-chno');
      }

      // Fallback group from #EXTGRP if not found in attributes
      if (!group && currentGroupFromTag) {
        group = currentGroupFromTag;
      }
      if (!group) {
        group = 'General';
      }

      // Fallback name if title is empty
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
        id: `ch-${channels.length + 1}-${Date.now().toString(36)}`,
        name,
        url: streamUrl,
        logo,
        group,
        tvgId,
        tvgName,
        tvgChno,
        format: detectFormat(streamUrl),
        rawExtinf: currentExtinf,
      });

      // Reset for next stream item
      currentExtinf = '';
      currentGroupFromTag = '';
    }
  }

  const groups = Array.from(groupsSet).sort((a, b) => a.localeCompare(b));
  const channelsWithLogo = channels.filter(ch => !!ch.logo).length;

  return {
    title: filename.replace(/\.[^/.]+$/, '') || 'Stream Playlist',
    filename,
    channels,
    groups,
    totalChannels: channels.length,
    channelsWithLogo,
    parsedAt: new Date().toISOString(),
  };
}

export function exportCleanM3U(playlist: PlaylistData, channelsToExport?: Channel[]): string {
  const items = channelsToExport || playlist.channels;
  const lines: string[] = ['#EXTM3U'];

  items.forEach(channel => {
    const attrs: string[] = [];
    if (channel.tvgId) attrs.push(`tvg-id="${channel.tvgId}"`);
    if (channel.tvgName) attrs.push(`tvg-name="${channel.tvgName}"`);
    if (channel.logo) attrs.push(`tvg-logo="${channel.logo}"`);
    if (channel.group) attrs.push(`group-title="${channel.group}"`);
    if (channel.tvgChno) attrs.push(`tvg-chno="${channel.tvgChno}"`);

    const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    lines.push(`#EXTINF:-1${attrStr},${channel.name}`);
    lines.push(channel.url);
  });

  return lines.join('\n');
}

export function exportPlainUrls(channels: Channel[]): string {
  return channels.map(ch => ch.url).join('\n');
}

export function exportJSON(channels: Channel[]): string {
  return JSON.stringify(
    channels.map(ch => ({
      name: ch.name,
      url: ch.url,
      group: ch.group,
      logo: ch.logo,
      tvgId: ch.tvgId,
      format: ch.format,
    })),
    null,
    2
  );
}

export function exportCSV(channels: Channel[]): string {
  const headers = ['Channel Name', 'Stream URL', 'Group / Category', 'Logo URL', 'TVG ID', 'Format'];
  const rows = channels.map(ch => [
    `"${(ch.name || '').replace(/"/g, '""')}"`,
    `"${(ch.url || '').replace(/"/g, '""')}"`,
    `"${(ch.group || '').replace(/"/g, '""')}"`,
    `"${(ch.logo || '').replace(/"/g, '""')}"`,
    `"${(ch.tvgId || '').replace(/"/g, '""')}"`,
    `"${ch.format}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
