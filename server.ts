import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
      // 1. Attempt lightweight HEAD request first
      let response = await fetch(targetUrl, {
        method: 'HEAD',
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });

      // 2. If HEAD is disallowed by stream server (405 or 501), retry with lightweight ranged GET (1KB)
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

  // Batch prober with bounded concurrency
  app.post('/api/check-streams-batch', async (req, res) => {
    const { urls } = req.body;
    if (!Array.isArray(urls)) {
      return res.status(400).json({ error: 'urls array required' });
    }

    const maxToProbe = urls.slice(0, 50); // limit batch to 50 max per call
    const results: Record<string, unknown> = {};

    // Run probes in chunks of 6 concurrent requests
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
