export interface StreamHealthResult {
  status: 'live' | 'offline' | 'checking' | 'unchecked';
  statusCode?: number;
  statusText?: string;
  latencyMs?: number;
  contentType?: string;
  contentLength?: string | null;
  server?: string | null;
  lastChecked?: string;
  error?: string;
}

/**
 * Checks a stream URL by first attempting the full-stack `/api/check-stream` endpoint
 * (which bypasses browser CORS restrictions). If unavailable, falls back to direct
 * browser HEAD/Range request.
 */
export async function checkStreamStatus(url: string): Promise<StreamHealthResult> {
  const startTime = Date.now();

  // 1. Try server-side lightweight HEAD/Range prober endpoint
  try {
    const apiRes = await fetch(`/api/check-stream?url=${encodeURIComponent(url)}`, {
      headers: { Accept: 'application/json' },
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      return {
        status: data.status === 'live' ? 'live' : 'offline',
        statusCode: data.statusCode,
        statusText: data.statusText,
        latencyMs: data.latencyMs,
        contentType: data.contentType,
        contentLength: data.contentLength,
        server: data.server,
        lastChecked: new Date().toLocaleTimeString(),
        error: data.error,
      };
    }
  } catch {
    // If backend endpoint is unreachable (e.g. standalone HTML mode), proceed to direct client probe
  }

  // 2. Direct browser probe fallback
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors',
      });
    } catch {
      // Some media servers reject HEAD with 405 or CORS, try lightweight partial GET (1KB range)
      res = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-1024' },
        signal: controller.signal,
        mode: 'cors',
      });
    }

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const isLive = res.status >= 200 && res.status < 400;

    return {
      status: isLive ? 'live' : 'offline',
      statusCode: res.status,
      statusText: res.statusText || (isLive ? 'OK' : 'Error'),
      latencyMs,
      contentType: res.headers.get('content-type') || 'media/stream',
      contentLength: res.headers.get('content-length'),
      lastChecked: new Date().toLocaleTimeString(),
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const isTimeout = err instanceof Error && err.name === 'AbortError';

    return {
      status: 'offline',
      statusCode: 0,
      statusText: isTimeout ? 'Timeout (>4s)' : 'Offline / Unreachable',
      latencyMs,
      error: isTimeout ? 'Request timed out' : 'Unable to connect to stream',
      lastChecked: new Date().toLocaleTimeString(),
    };
  }
}
