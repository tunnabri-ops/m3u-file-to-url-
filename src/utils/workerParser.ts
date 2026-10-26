import { PlaylistData } from '../types/playlist';
import { parseM3U as syncParseM3U } from './m3uParser';

export interface ParseProgress {
  percent: number;
  channelCount: number;
  linesProcessed: number;
  totalLines: number;
}

export interface ParseResult {
  playlist: PlaylistData;
  parseTimeMs: number;
}

export function parseM3UAsync(
  content: string,
  filename = 'playlist.m3u',
  onProgress?: (progress: ParseProgress) => void
): Promise<ParseResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    // Check for Web Worker support
    if (typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(
          new URL('../workers/m3uParser.worker.ts', import.meta.url),
          { type: 'module' }
        );

        worker.onmessage = (e) => {
          const data = e.data;
          if (data.type === 'progress') {
            if (onProgress) {
              onProgress({
                percent: data.percent,
                channelCount: data.channelCount,
                linesProcessed: data.linesProcessed,
                totalLines: data.totalLines,
              });
            }
          } else if (data.type === 'done') {
            worker.terminate();
            resolve({
              playlist: data.playlist,
              parseTimeMs: data.parseTimeMs || Date.now() - startTime,
            });
          }
        };

        worker.onerror = (err) => {
          console.warn('Web Worker error, falling back to synchronous parser:', err);
          worker.terminate();
          const fallbackData = syncParseM3U(content, filename);
          resolve({
            playlist: fallbackData,
            parseTimeMs: Date.now() - startTime,
          });
        };

        worker.postMessage({ content, filename });
        return;
      } catch (err) {
        console.warn('Could not initialize Worker, using sync fallback:', err);
      }
    }

    // Synchronous fallback
    const result = syncParseM3U(content, filename);
    resolve({
      playlist: result,
      parseTimeMs: Date.now() - startTime,
    });
  });
}
