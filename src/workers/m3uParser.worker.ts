/**
 * High-performance M3U Parser Web Worker
 * Offloads massive playlist file parsing from the main UI thread.
 */

interface Channel {
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
  const fallbackRegex = new RegExp(`${attrName}=["']?([^"'>\\s]+)["']?`, 'i');
  const match = line.match(fallbackRegex);
  return match && match[1] ? match[1].trim() : '';
}

self.onmessage = function (e: MessageEvent<{ content: string; filename?: string }>) {
  const { content, filename = 'playlist.m3u' } = e.data;
  const startTime = Date.now();

  if (!content) {
    self.postMessage({
      type: 'done',
      playlist: {
        title: filename.replace(/\.[^/.]+$/, ''),
        filename,
        channels: [],
        groups: [],
        totalChannels: 0,
        channelsWithLogo: 0,
        parsedAt: new Date().toISOString(),
      },
      parseTimeMs: 0,
    });
    return;
  }

  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const totalLines = lines.length;
  const channels: Channel[] = [];
  const groupsSet = new Set<string>();

  let currentExtinf = '';
  let currentGroupFromTag = '';
  let lastProgressReportTime = Date.now();

  for (let i = 0; i < totalLines; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      currentExtinf = line;
      continue;
    }

    if (line.startsWith('#EXTGRP:')) {
      currentGroupFromTag = line.substring(8).trim();
      continue;
    }

    if (line.startsWith('#')) {
      continue;
    }

    // Stream URL line
    if (
      line.startsWith('http://') ||
      line.startsWith('https://') ||
      line.startsWith('rtmp://') ||
      line.startsWith('rtsp://') ||
      line.includes('://')
    ) {
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
        format: detectFormat(streamUrl),
        rawExtinf: currentExtinf,
      });

      currentExtinf = '';
      currentGroupFromTag = '';
    }

    // Send progress report every 50ms or 5000 lines
    const now = Date.now();
    if (now - lastProgressReportTime > 50 || i === totalLines - 1) {
      const percent = Math.round((i / totalLines) * 100);
      self.postMessage({
        type: 'progress',
        percent,
        channelCount: channels.length,
        linesProcessed: i + 1,
        totalLines,
      });
      lastProgressReportTime = now;
    }
  }

  const groups = Array.from(groupsSet).sort((a, b) => a.localeCompare(b));
  const channelsWithLogo = channels.filter((ch) => !!ch.logo).length;
  const parseTimeMs = Date.now() - startTime;

  self.postMessage({
    type: 'done',
    playlist: {
      title: filename.replace(/\.[^/.]+$/, '') || 'Stream Playlist',
      filename,
      channels,
      groups,
      totalChannels: channels.length,
      channelsWithLogo,
      parsedAt: new Date().toISOString(),
    },
    parseTimeMs,
  });
};
