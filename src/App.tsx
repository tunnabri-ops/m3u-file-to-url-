import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { StatsBar } from './components/StatsBar';
import { ChannelToolbar } from './components/ChannelToolbar';
import { ChannelList } from './components/ChannelList';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { ExportModal } from './components/ExportModal';
import { parseM3U } from './utils/m3uParser';
import { SAMPLE_PLAYLISTS } from './utils/samplePlaylists';
import { checkStreamStatus, StreamHealthResult } from './utils/streamChecker';
import { Channel, PlaylistData, FilterOptions, ViewMode } from './types/playlist';
import { Check, Layers } from 'lucide-react';

export default function App() {
  const [playlist, setPlaylist] = useState<PlaylistData>(() => {
    return parseM3U(SAMPLE_PLAYLISTS[0].content, 'featured-streams.m3u');
  });

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [activeChannelForPlayer, setActiveChannelForPlayer] = useState<Channel | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Stream health state tracking
  const [streamHealthMap, setStreamHealthMap] = useState<Record<string, StreamHealthResult>>({});
  const [checkingUrls, setCheckingUrls] = useState<Set<string>>(new Set());
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [probeProgress, setProbeProgress] = useState<{ current: number; total: number } | null>(null);

  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    selectedGroup: 'ALL',
    formatFilter: 'ALL',
    statusFilter: 'ALL',
    sortBy: 'order',
  });

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Function to perform lightweight HEAD/Range check on a single channel
  const handleCheckChannel = useCallback(async (channel: Channel) => {
    setCheckingUrls((prev) => new Set(prev).add(channel.url));
    setStreamHealthMap((prev) => ({
      ...prev,
      [channel.url]: { status: 'checking' },
    }));

    try {
      const result = await checkStreamStatus(channel.url);
      setStreamHealthMap((prev) => ({
        ...prev,
        [channel.url]: result,
      }));
      if (result.status === 'live') {
        showToast(`${channel.name}: Live (${result.latencyMs}ms)`);
      } else {
        showToast(`${channel.name}: Offline (${result.statusText || 'Error'})`);
      }
    } catch {
      setStreamHealthMap((prev) => ({
        ...prev,
        [channel.url]: { status: 'offline', statusText: 'Connection failed' },
      }));
    } finally {
      setCheckingUrls((prev) => {
        const next = new Set(prev);
        next.delete(channel.url);
        return next;
      });
    }
  }, []);

  // Function to perform lightweight batch probing across all streams
  const handleCheckAllStreams = useCallback(async () => {
    if (playlist.channels.length === 0 || isCheckingAll) return;
    setIsCheckingAll(true);
    const channels = playlist.channels;
    setProbeProgress({ current: 0, total: channels.length });

    // Mark all as checking
    setStreamHealthMap((prev) => {
      const next = { ...prev };
      channels.forEach((c) => {
        next[c.url] = { status: 'checking' };
      });
      return next;
    });

    const CHUNK_SIZE = 4;
    let completed = 0;

    for (let i = 0; i < channels.length; i += CHUNK_SIZE) {
      const chunk = channels.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (c) => {
          try {
            const res = await checkStreamStatus(c.url);
            setStreamHealthMap((prev) => ({
              ...prev,
              [c.url]: res,
            }));
          } catch {
            setStreamHealthMap((prev) => ({
              ...prev,
              [c.url]: { status: 'offline', statusText: 'Error' },
            }));
          } finally {
            completed++;
            setProbeProgress({ current: completed, total: channels.length });
          }
        })
      );
    }

    setIsCheckingAll(false);
    setProbeProgress(null);
    showToast(`Health probe finished for ${channels.length} streams.`);
  }, [playlist.channels, isCheckingAll]);

  // Initial probe of sample streams on first mount
  useEffect(() => {
    // Automatically probe the initial sample streams so user sees Live/Offline badges immediately
    const timer = setTimeout(() => {
      handleCheckAllStreams();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Check URL hash for shared playlist data on mount
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#playlist=')) {
        const b64 = hash.replace('#playlist=', '');
        const jsonStr = decodeURIComponent(escape(atob(b64)));
        const sharedChannels = JSON.parse(jsonStr);
        if (Array.isArray(sharedChannels) && sharedChannels.length > 0) {
          let reconstructedM3U = '#EXTM3U\n';
          sharedChannels.forEach((c: { n: string; u: string; g?: string; l?: string }) => {
            const logoAttr = c.l ? ` tvg-logo="${c.l}"` : '';
            const groupAttr = c.g ? ` group-title="${c.g}"` : '';
            reconstructedM3U += `#EXTINF:-1${logoAttr}${groupAttr},${c.n}\n${c.u}\n`;
          });
          const parsed = parseM3U(reconstructedM3U, 'shared-playlist.m3u');
          setPlaylist(parsed);
          showToast('Loaded shared playlist from URL link!');
        }
      }
    } catch {
      // Ignore hash parse error
    }
  }, []);

  const handleParseContent = (content: string, filename = 'playlist.m3u') => {
    setIsLoading(true);
    setTimeout(() => {
      const parsed = parseM3U(content, filename);
      if (parsed.channels.length === 0) {
        showToast('No valid stream URLs detected in provided content.');
      } else {
        setPlaylist(parsed);
        setStreamHealthMap({});
        setFilters({
          searchQuery: '',
          selectedGroup: 'ALL',
          formatFilter: 'ALL',
          statusFilter: 'ALL',
          sortBy: 'order',
        });
        showToast(`Parsed ${parsed.channels.length} channels successfully!`);
      }
      setIsLoading(false);
    }, 150);
  };

  const handleReset = () => {
    setPlaylist({
      title: '',
      filename: undefined,
      channels: [],
      groups: [],
      totalChannels: 0,
      channelsWithLogo: 0,
      parsedAt: new Date().toISOString(),
    });
    setStreamHealthMap({});
    showToast('Cleared playlist');
  };

  const handleCopySingleUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast('Copied stream URL to clipboard!');
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleCopyAllUrls = () => {
    if (playlist.channels.length === 0) return;
    const allUrls = playlist.channels.map((c) => c.url).join('\n');
    navigator.clipboard.writeText(allUrls);
    setIsCopiedAll(true);
    showToast(`Copied ${playlist.channels.length} stream URLs!`);
    setTimeout(() => {
      setIsCopiedAll(false);
    }, 2500);
  };

  // Filtered and Sorted Channels
  const filteredChannels = useMemo(() => {
    let result = [...playlist.channels];

    // Search query filter
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.url.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q) ||
          (c.tvgId && c.tvgId.toLowerCase().includes(q))
      );
    }

    // Group / Category filter
    if (filters.selectedGroup !== 'ALL') {
      result = result.filter((c) => c.group === filters.selectedGroup);
    }

    // Format filter
    if (filters.formatFilter !== 'ALL') {
      if (filters.formatFilter === 'OTHER') {
        result = result.filter((c) => c.format !== 'HLS' && c.format !== 'MP4' && c.format !== 'TS');
      } else {
        result = result.filter((c) => c.format === filters.formatFilter);
      }
    }

    // Status filter (Live vs Offline vs Unchecked)
    if (filters.statusFilter !== 'ALL') {
      result = result.filter((c) => {
        const health = streamHealthMap[c.url];
        if (filters.statusFilter === 'LIVE') return health?.status === 'live';
        if (filters.statusFilter === 'OFFLINE') return health?.status === 'offline';
        if (filters.statusFilter === 'UNCHECKED') return !health || health.status === 'unchecked';
        return true;
      });
    }

    // Sorting
    if (filters.sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (filters.sortBy === 'group-asc') {
      result.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
    }

    return result;
  }, [playlist.channels, filters, streamHealthMap]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background soft ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-cyan-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-[40%] -right-40 w-[500px] h-[500px] bg-indigo-600/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-10 -left-40 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Top Bar */}
      <Header
        onOpenExport={() => setIsExportModalOpen(true)}
        channelCount={playlist.totalChannels}
      />

      {/* Main Content Viewport */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Upload & Ingestion Section */}
        <UploadSection
          onParseContent={handleParseContent}
          isLoading={isLoading}
          activeFilename={playlist.filename}
          channelCount={playlist.totalChannels}
          onReset={handleReset}
        />

        {/* Channels Workspace */}
        {playlist.totalChannels > 0 && (
          <section id="channels" className="space-y-4 pt-2">
            {/* Stats Bar */}
            <StatsBar
              playlist={playlist}
              onCopyAllUrls={handleCopyAllUrls}
              isCopiedAll={isCopiedAll}
              onOpenExport={() => setIsExportModalOpen(true)}
              streamHealthMap={streamHealthMap}
              onCheckAllStreams={handleCheckAllStreams}
              isCheckingAll={isCheckingAll}
              probeProgress={probeProgress}
              statusFilter={filters.statusFilter}
              onStatusFilterChange={(st) => setFilters({ ...filters, statusFilter: st })}
            />

            {/* Filter & Search Toolbar */}
            <ChannelToolbar
              filters={filters}
              onFilterChange={setFilters}
              groups={playlist.groups}
              totalChannels={playlist.totalChannels}
              filteredCount={filteredChannels.length}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Channel List / Grid */}
            <ChannelList
              channels={filteredChannels}
              viewMode={viewMode}
              onPlayChannel={(channel) => setActiveChannelForPlayer(channel)}
              onCopyUrl={handleCopySingleUrl}
              copiedId={copiedId}
              streamHealthMap={streamHealthMap}
              onCheckChannel={handleCheckChannel}
              checkingUrls={checkingUrls}
            />
          </section>
        )}

        {/* Specifications & Format Reference */}
        <section id="formats" className="pt-10 border-t border-slate-900 space-y-4">
          <div className="text-left">
            <h2 className="text-lg font-semibold text-white mb-1">
              Supported Playlist Attributes & Specifications
            </h2>
            <p className="text-xs text-slate-400">
              Standardized M3U parsing engine with lightweight HEAD/Range stream probing and metadata inspection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel rounded-xl p-4 border border-slate-800/80">
              <h3 className="text-xs font-semibold text-cyan-400 mb-1">Live / Offline Health Probing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sends lightweight HEAD and byte-range metadata queries to detect active video streams, HTTP status codes, server response latency, and MIME types without downloading full media files.
              </p>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-slate-800/80">
              <h3 className="text-xs font-semibold text-indigo-400 mb-1">EXTINF Tag Parsing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extracts <code className="text-cyan-300 font-mono text-[11px]">tvg-id</code>, <code className="text-cyan-300 font-mono text-[11px]">tvg-logo</code>, <code className="text-cyan-300 font-mono text-[11px]">group-title</code>, and channel title suffixes automatically.
              </p>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-slate-800/80">
              <h3 className="text-xs font-semibold text-purple-400 mb-1">Multi-Format Batch Export</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export normalized M3U8 files, clean stream lists for aria2/curl downloaders, structured JSON, or spreadsheet CSV tables.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="pt-6 pb-12 border-t border-slate-900 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-1">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
            <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-200">How does the stream health check work?</h4>
              <p className="leading-relaxed">
                It executes a non-intrusive HEAD request to check whether the stream server responds with an active HTTP 200/206 status, calculating latency and confirming video headers without consuming excess bandwidth.
              </p>
            </div>

            <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-200">Can I filter by Live streams only?</h4>
              <p className="leading-relaxed">
                Yes! Click the <strong>Live</strong> button in the Status filter or click the <strong>Live: N</strong> counter in the statistics bar to view only verified online channels.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-500" />
            <span className="font-medium text-slate-400">M3U Stream Nexus</span>
            <span aria-hidden="true" className="text-slate-800">·</span>
            <span>Client-side M3U to URL Converter</span>
          </div>
          <div>All processing runs 100% locally in your browser.</div>
        </div>
      </footer>

      {/* Video Player Modal */}
      {activeChannelForPlayer && (
        <VideoPlayerModal
          channel={activeChannelForPlayer}
          onClose={() => setActiveChannelForPlayer(null)}
        />
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          playlist={playlist}
          filteredChannels={filteredChannels}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* Toast Feedback Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-cyan-500/40 text-cyan-300 rounded-xl shadow-2xl text-xs font-medium backdrop-blur-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
