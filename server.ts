import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, 'src/data/playlists.json');

// Helper to read stored playlists
function getPlaylists(): Record<string, any> {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading playlists.json:', err);
  }
  return {};
}

// Helper to save stored playlists
function savePlaylists(playlists: Record<string, any>) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(playlists, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing playlists.json:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Check if a slug is available
  app.get('/api/check-slug/:slug', (req, res) => {
    const rawSlug = req.params.slug || '';
    const cleanSlug = rawSlug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
    const playlists = getPlaylists();
    const exists = !!playlists[cleanSlug];
    res.json({
      slug: cleanSlug,
      available: !exists,
    });
  });

  // List all saved custom playlists
  app.get('/api/playlists', (req, res) => {
    const playlists = getPlaylists();
    const list = Object.values(playlists).map((p: any) => ({
      slug: p.slug,
      title: p.title || p.slug,
      description: p.description || '',
      updatedAt: p.updatedAt,
      channelCount: Array.isArray(p.channels) ? p.channels.length : 0,
      groups: Array.from(new Set((p.channels || []).map((c: any) => c.group || 'General'))),
    }));
    res.json({ playlists: list });
  });

  // Get a specific playlist by slug (supports JSON or raw M3U streaming output!)
  app.get('/api/playlist/:slug', (req, res) => {
    const slug = req.params.slug.toLowerCase().trim();
    const playlists = getPlaylists();
    const playlist = playlists[slug];

    if (!playlist) {
      return res.status(404).json({ error: `Playlist with slug '${slug}' not found` });
    }

    const format = (req.query.format as string) || '';
    const acceptHeader = req.headers.accept || '';

    // If client requested raw M3U (via ?format=m3u or IPTV client accept header)
    if (format === 'm3u' || format === 'm3u8' || acceptHeader.includes('mpegurl')) {
      res.setHeader('Content-Type', 'audio/x-mpegurl; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${slug}.m3u8"`);

      let m3uText = '#EXTM3U\n';
      (playlist.channels || []).forEach((c: any) => {
        const logoAttr = c.logo ? ` tvg-logo="${c.logo}"` : '';
        const groupAttr = c.group ? ` group-title="${c.group}"` : '';
        const idAttr = c.tvgId ? ` tvg-id="${c.tvgId}"` : '';
        m3uText += `#EXTINF:-1${idAttr}${logoAttr}${groupAttr},${c.name}\n${c.url}\n`;
      });

      return res.send(m3uText);
    }

    // Default JSON output
    res.json({
      slug: playlist.slug,
      title: playlist.title,
      description: playlist.description,
      updatedAt: playlist.updatedAt,
      totalChannels: (playlist.channels || []).length,
      channels: playlist.channels || [],
      groups: Array.from(new Set((playlist.channels || []).map((c: any) => c.group || 'General'))),
    });
  });

  // Create or Update playlist with custom slug
  app.post('/api/playlists', (req, res) => {
    const { slug, title, description, channels } = req.body;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Valid slug is required' });
    }

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (cleanSlug.length < 2) {
      return res.status(400).json({ error: 'Slug must be at least 2 characters long' });
    }

    if (!Array.isArray(channels) || channels.length === 0) {
      return res.status(400).json({ error: 'At least one channel is required' });
    }

    const playlists = getPlaylists();
    const updatedPlaylist = {
      slug: cleanSlug,
      title: title?.trim() || cleanSlug,
      description: description?.trim() || '',
      channels,
      updatedAt: new Date().toISOString(),
    };

    playlists[cleanSlug] = updatedPlaylist;
    savePlaylists(playlists);

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    res.json({
      success: true,
      slug: cleanSlug,
      title: updatedPlaylist.title,
      totalChannels: channels.length,
      shareUrl: `${baseUrl}/playlist/${cleanSlug}`,
      m3uStreamUrl: `${baseUrl}/api/playlist/${cleanSlug}?format=m3u`,
      updatedAt: updatedPlaylist.updatedAt,
    });
  });

  // Delete a playlist
  app.delete('/api/playlist/:slug', (req, res) => {
    const slug = req.params.slug.toLowerCase().trim();
    const playlists = getPlaylists();

    if (!playlists[slug]) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    delete playlists[slug];
    savePlaylists(playlists);
    res.json({ success: true, message: `Playlist '${slug}' deleted` });
  });

  // Single stream URL prober using lightweight HEAD or Range GET request
  app.get('/api/check-stream', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ status: 'offline', error: 'Missing url parameter' });
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: '*/*',
    };

    try {
      let response = await fetch(targetUrl, {
        method: 'HEAD',
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });

      if (response.status === 405 || response.status === 501) {
        response = await fetch(targetUrl, {
          method: 'GET',
          headers: { ...headers, Range: 'bytes=0-1024' },
          signal: controller.signal,
          redirect: 'follow',
        });
      }

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      const contentType = response.headers.get('content-type') || 'unknown';
      const contentLength = response.headers.get('content-length') || null;
      const serverHeader = response.headers.get('server') || null;

      const isLive = response.status >= 200 && response.status < 400;

      return res.json({
        status: isLive ? 'live' : 'offline',
        statusCode: response.status,
        statusText: response.statusText,
        latencyMs,
        contentType,
        contentLength,
        server: serverHeader,
        url: targetUrl,
      });
    } catch (err: unknown) {
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      const errorMsg =
        err instanceof Error
          ? err.name === 'AbortError'
            ? 'Timeout (>4.5s)'
            : err.message
          : 'Connection failed';

      return res.json({
        status: 'offline',
        statusCode: 0,
        statusText: errorMsg,
        latencyMs,
        contentType: 'none',
        error: errorMsg,
        url: targetUrl,
      });
    }
  });

  // Batch stream prober
  app.post('/api/check-streams-batch', async (req, res) => {
    const { urls } = req.body;
    if (!Array.isArray(urls)) {
      return res.status(400).json({ error: 'urls array required' });
    }

    const maxToProbe = urls.slice(0, 50);
    const results: Record<string, any> = {};

    const CHUNK_SIZE = 6;
    for (let i = 0; i < maxToProbe.length; i += CHUNK_SIZE) {
      const chunk = maxToProbe.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (url) => {
          const startTime = Date.now();
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);
          try {
            let response = await fetch(url, {
              method: 'HEAD',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) StreamProber/1.0',
                Accept: '*/*',
              },
              signal: controller.signal,
              redirect: 'follow',
            });

            if (response.status === 405 || response.status === 501) {
              response = await fetch(url, {
                method: 'GET',
                headers: { Range: 'bytes=0-1024' },
                signal: controller.signal,
                redirect: 'follow',
              });
            }

            clearTimeout(timeout);
            results[url] = {
              status: response.status >= 200 && response.status < 400 ? 'live' : 'offline',
              statusCode: response.status,
              latencyMs: Date.now() - startTime,
              contentType: response.headers.get('content-type') || 'unknown',
            };
          } catch (e: unknown) {
            clearTimeout(timeout);
            results[url] = {
              status: 'offline',
              statusCode: 0,
              latencyMs: Date.now() - startTime,
              error: e instanceof Error ? e.message : 'Unreachable',
            };
          }
        })
      );
    }

    res.json({ results });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
