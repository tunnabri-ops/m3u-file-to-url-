import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { StatsBar } from './components/StatsBar';
import { CategoryTabs } from './components/CategoryTabs';
import { ChannelToolbar } from './components/ChannelToolbar';
import { ChannelList } from './components/ChannelList';
import { PaginationControls } from './components/PaginationControls';
import { CustomSlugCreator } from './components/CustomSlugCreator';
import { ChannelEditorModal } from './components/ChannelEditorModal';
import { XtreamCodesModal } from './components/XtreamCodesModal';
import { FastApiBackendModal } from './components/FastApiBackendModal';
import { NextjsArchitectureModal } from './components/NextjsArchitectureModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { ExportModal } from './components/ExportModal';
import { parseM3U } from './utils/m3uParser';
import { parseM3UAsync, ParseProgress } from './utils/workerParser';
import { SAMPLE_PLAYLISTS } from './utils/samplePlaylists';
import { checkStreamStatus, StreamHealthResult } from './utils/streamChecker';
import { getPlaylistBySlug } from './utils/localPlaylistStorage';
import { getSavedFavorites, toggleFavoriteInStorage } from './utils/favoritesStorage';
import { getSavedTheme, saveTheme, THEME_CONFIG } from './utils/themeHelper';
import { Channel, PlaylistData, FilterOptions, ViewMode, AccentTheme, ResolutionTag } from './types/playlist';
import { Check, Layers, Zap, Terminal, Server, Star } from 'lucide-react';

export default function App() {
  const [playlist, setPlaylist] = useState<PlaylistData>(() => {
    return parseM3U(SAMPLE_PLAYLISTS[0].content, 'featured-cinema.m3u');
  });

  const [isLoading, setIsLoading] = useState(false);
  const [parseProgress, setParseProgress] = useState<ParseProgress | null>(null);
  const [parseMetrics, setParseMetrics] = useState<{ parseTimeMs: number; channelCount: number } | null>({
    parseTimeMs: 14,
    channelCount: 4,
  });

  // Theme & Accent State
  const [currentTheme, setCurrentTheme] = useState<AccentTheme>(getSavedTheme);
  const activeThemeConfig = THEME_CONFIG[currentTheme];

  const handleThemeChange = (theme: AccentTheme) => {
    setCurrentTheme(theme);
    saveTheme(theme);
  };

  // Favorites / Bookmarks State
  const [favorites, setFavorites] = useState<Set<string>>(() => getSavedFavorites());

  const handleToggleFavorite = (channelId: string) => {
    const isNowFav = toggleFavoriteInStorage(channelId);
    setFavorites(getSavedFavorites());
    const ch = playlist.channels.find((c) => c.id === channelId);
    showToast(isNowFav ? `★ Bookmarked "${ch?.name || 'Channel'}"` : `Removed "${ch?.name || 'Channel'}" from bookmarks`);
  };

  const isFavorited = (channelId: string) => favorites.has(channelId);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Modals state
  const [activeChannelForPlayer, setActiveChannelForPlayer] = useState<Channel | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isXtreamModalOpen, setIsXtreamModalOpen] = useState(false);
  const [isFastApiModalOpen, setIsFastApiModalOpen] = useState(false);
  const [isNextjsModalOpen, setIsNextjsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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
    resolutionFilter: 'ALL',
    onlyFavorites: false,
    sortBy: 'order',
  });

  // Reset page when filters change
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Check URL pathname for /playlist/:slug or URL hash on mount
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/playlist/')) {
      const slug = pathname.replace('/playlist/', '').replace(/\/$/, '');
      if (slug) {
        loadSavedPlaylist(slug);
        return;
      }
    }

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

  // Load a saved playlist from localStorage (100% client-side) or fallback to server route
  const loadSavedPlaylist = async (slug: string) => {
    setIsLoading(true);

    // 1. Check browser local storage first
    const local = getPlaylistBySlug(slug);
    if (local) {
      const groups = Array.from(new Set(local.channels.map((c) => c.group || 'General'))).sort();
      setPlaylist({
        title: local.title,
        slug: local.slug,
        filename: `${local.slug}.m3u8`,
        channels: local.channels,
        groups,
        totalChannels: local.channels.length,
        channelsWithLogo: local.channels.filter((c: Channel) => !!c.logo).length,
        parsedAt: local.updatedAt,
        updatedAt: local.updatedAt,
        epgUrl: local.epgUrl,
      });
      setFilters({
        searchQuery: '',
        selectedGroup: 'ALL',
        formatFilter: 'ALL',
        statusFilter: 'ALL',
        resolutionFilter: 'ALL',
        onlyFavorites: false,
        sortBy: 'order',
      });
      setCurrentPage(1);
      setStreamHealthMap({});
      setIsLoading(false);
      showToast(`Loaded "${local.title}"`);
      return;
    }

    // 2. Fallback attempt for server route if configured
    try {
      const res = await fetch(`/api/playlist/${slug}`);
      if (!res.ok) throw new Error('Playlist not found');
      const data = await res.json();
      setPlaylist({
        title: data.title,
        slug: data.slug,
        filename: `${data.slug}.m3u8`,
        channels: data.channels || [],
        groups: data.groups || [],
        totalChannels: data.totalChannels || 0,
        channelsWithLogo: (data.channels || []).filter((c: Channel) => !!c.logo).length,
        parsedAt: data.updatedAt || new Date().toISOString(),
        updatedAt: data.updatedAt,
        epgUrl: data.epgUrl,
      });
      setFilters({
        searchQuery: '',
        selectedGroup: 'ALL',
        formatFilter: 'ALL',
        statusFilter: 'ALL',
        resolutionFilter: 'ALL',
        onlyFavorites: false,
        sortBy: 'order',
      });
      setCurrentPage(1);
      setStreamHealthMap({});
      showToast(`Loaded playlist: /${slug}`);
    } catch {
      showToast(`Playlist /${slug} not found`);
    } finally {
      setIsLoading(false);
    }
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
    showToast(`Bulk health probe complete for ${channels.length} streams.`);
  }, [playlist.channels, isCheckingAll]);

  // Dead Channel Remover: Purges all streams marked as 'offline' from active playlist
  const handleRemoveDeadChannels = useCallback(() => {
    const deadUrls = new Set<string>();
    playlist.channels.forEach((c) => {
      if (streamHealthMap[c.url]?.status === 'offline') {
        deadUrls.add(c.url);
      }
    });

    if (deadUrls.size === 0) {
      showToast('No offline channels detected to remove.');
      return;
    }

    setPlaylist((prev) => {
      const aliveChannels = prev.channels.filter((c) => !deadUrls.has(c.url));
      const groups = Array.from(new Set(aliveChannels.map((c) => c.group || 'General'))).sort();
      return {
        ...prev,
        channels: aliveChannels,
        groups,
        totalChannels: aliveChannels.length,
        channelsWithLogo: aliveChannels.filter((c) => !!c.logo).length,
      };
    });

    showToast(`Purged ${deadUrls.size} dead channels from playlist!`);
  }, [playlist.channels, streamHealthMap]);

  // Initial probe of sample streams on first mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleCheckAllStreams();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Web Worker async parsing
  const handleParseContent = async (content: string, filename = 'playlist.m3u') => {
    setIsLoading(true);
    setParseProgress({ percent: 0, channelCount: 0, linesProcessed: 0, totalLines: 0 });

    try {
      const { playlist: parsed, parseTimeMs } = await parseM3UAsync(
        content,
        filename,
        (progress) => {
          setParseProgress(progress);
        }
      );

      if (parsed.channels.length === 0) {
        showToast('No valid stream URLs detected in file.');
      } else {
        setPlaylist(parsed);
        setParseMetrics({ parseTimeMs, channelCount: parsed.channels.length });
        setStreamHealthMap({});
        setFilters({
          searchQuery: '',
          selectedGroup: 'ALL',
          formatFilter: 'ALL',
          statusFilter: 'ALL',
          resolutionFilter: 'ALL',
          onlyFavorites: false,
          sortBy: 'order',
        });
        setCurrentPage(1);
        showToast(`Parsed ${parsed.channels.length.toLocaleString()} channels in ${parseTimeMs}ms!`);
      }
    } catch (err) {
      console.error(err);
      showToast('Error parsing file.');
    } finally {
      setIsLoading(false);
      setParseProgress(null);
    }
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
    setCurrentPage(1);
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
    showToast(`Copied ${playlist.channels.length.toLocaleString()} stream URLs!`);
    setTimeout(() => {
      setIsCopiedAll(false);
    }, 2500);
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setIsEditorOpen(true);
  };

  const handleAddNewChannel = () => {
    setEditingChannel(null);
    setIsEditorOpen(true);
  };

  const handleSaveChannel = (channel: Channel) => {
    setPlaylist((prev) => {
      const exists = prev.channels.some((c) => c.id === channel.id);
      let updatedChannels: Channel[];
      if (exists) {
        updatedChannels = prev.channels.map((c) => (c.id === channel.id ? channel : c));
        showToast(`Updated "${channel.name}"`);
      } else {
        updatedChannels = [channel, ...prev.channels];
        showToast(`Added channel "${channel.name}"`);
      }

      const groups = Array.from(new Set(updatedChannels.map((c) => c.group || 'General'))).sort();
      return {
        ...prev,
        channels: updatedChannels,
        groups,
        totalChannels: updatedChannels.length,
        channelsWithLogo: updatedChannels.filter((c) => !!c.logo).length,
      };
    });
  };

  const handleDeleteChannel = (channelId: string) => {
    setPlaylist((prev) => {
      const target = prev.channels.find((c) => c.id === channelId);
      const updatedChannels = prev.channels.filter((c) => c.id !== channelId);
      const groups = Array.from(new Set(updatedChannels.map((c) => c.group || 'General'))).sort();
      showToast(`Deleted "${target?.name || 'channel'}"`);
      return {
        ...prev,
        channels: updatedChannels,
        groups,
        totalChannels: updatedChannels.length,
        channelsWithLogo: updatedChannels.filter((c) => !!c.logo).length,
      };
    });
  };

  const handlePlaylistSaved = (slug: string, title: string, epgUrl?: string) => {
    setPlaylist((prev) => ({
      ...prev,
      slug,
      title,
      epgUrl: epgUrl || prev.epgUrl,
    }));
    showToast(`Saved & deployed to /playlist/${slug}`);
  };

  const channelCountsByGroup = useMemo(() => {
    const counts: Record<string, number> = {};
    playlist.channels.forEach((c) => {
      const g = c.group || 'General';
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [playlist.channels]);

  // Compute counts by resolution tag
  const resolutionCounts = useMemo<Record<ResolutionTag, number>>(() => {
    const counts: Record<ResolutionTag, number> = {
      '4K': 0,
      'FHD': 0,
      'HD': 0,
      'SD': 0,
      'OTHER': 0,
    };
    playlist.channels.forEach((c) => {
      const tag = c.resolution || 'OTHER';
      counts[tag] = (counts[tag] || 0) + 1;
    });
    return counts;
  }, [playlist.channels]);

  // Total favorites count in current playlist
  const favoritesCount = useMemo(() => {
    return playlist.channels.filter((c) => favorites.has(c.id) || favorites.has(c.url)).length;
  }, [playlist.channels, favorites]);

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
          (c.resolution && c.resolution.toLowerCase().includes(q)) ||
          (c.tvgId && c.tvgId.toLowerCase().includes(q))
      );
    }

    // Favorites only filter (via button or tab)
    if (filters.onlyFavorites || filters.selectedGroup === '__FAVORITES__') {
      result = result.filter((c) => favorites.has(c.id) || favorites.has(c.url));
    } else if (filters.selectedGroup !== 'ALL') {
      result = result.filter((c) => c.group === filters.selectedGroup);
    }

    // Resolution & Quality filter (4K, FHD, HD, SD)
    if (filters.resolutionFilter !== 'ALL') {
      result = result.filter((c) => c.resolution === filters.resolutionFilter);
    }

    // Format protocol filter
    if (filters.formatFilter !== 'ALL') {
      if (filters.formatFilter === 'OTHER') {
        result = result.filter((c) => c.format !== 'HLS' && c.format !== 'MP4' && c.format !== 'TS');
      } else {
        result = result.filter((c) => c.format === filters.formatFilter);
      }
    }

    // Status filter (Live / Offline / Unchecked)
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
  }, [playlist.channels, filters, streamHealthMap, favorites]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background ambient lighting and subtle cyber grid pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[450px] blur-[140px] rounded-full transition-colors duration-700 ${
            currentTheme === 'cyan'
              ? 'bg-cyan-500/10'
              : currentTheme === 'purple'
              ? 'bg-purple-600/12'
              : 'bg-emerald-500/10'
          }`}
        />
        <div className="absolute top-[35%] -right-40 w-[550px] h-[550px] bg-violet-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-10 -left-40 w-[550px] h-[550px] bg-indigo-600/10 blur-[160px] rounded-full" />
      </div>

      {/* Top Bar with M3U FILE branding, Theme Switcher, and FastAPI Code button */}
      <Header
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenXtream={() => setIsXtreamModalOpen(true)}
        onOpenNextjs={() => setIsNextjsModalOpen(true)}
        onOpenFastApi={() => setIsFastApiModalOpen(true)}
        channelCount={playlist.totalChannels}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

      {/* Main Content Viewport */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Upload & Ingestion Section with Web Worker Progress */}
        <UploadSection
          onParseContent={handleParseContent}
          isLoading={isLoading}
          parseProgress={parseProgress}
          parseMetrics={parseMetrics}
          activeFilename={playlist.filename}
          channelCount={playlist.totalChannels}
          onReset={handleReset}
        />

        {/* Custom Link Naming (Slug Creator & EPG Publisher) */}
        {playlist.totalChannels > 0 && (
          <section id="slug-creator">
            <CustomSlugCreator
              currentChannels={playlist.channels}
              currentTitle={playlist.title}
              currentSlug={playlist.slug}
              currentEpgUrl={playlist.epgUrl}
              onPlaylistSaved={handlePlaylistSaved}
              onLoadSavedPlaylist={loadSavedPlaylist}
              currentTheme={currentTheme}
            />
          </section>
        )}

        {/* Channels Workspace */}
        {playlist.totalChannels > 0 && (
          <section id="channels" className="space-y-4 pt-2">
            {/* Stats Bar with Bulk Health Checker & Dead Channel Remover */}
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
              onStatusFilterChange={(st) => handleFilterChange({ ...filters, statusFilter: st })}
              onRemoveDeadChannels={handleRemoveDeadChannels}
              currentTheme={currentTheme}
            />

            {/* Interactive Category Group Tabs + Favorites Tab */}
            {playlist.groups.length > 0 && (
              <CategoryTabs
                groups={playlist.groups}
                selectedGroup={filters.selectedGroup}
                onSelectGroup={(group) => handleFilterChange({ ...filters, selectedGroup: group })}
                channelCountsByGroup={channelCountsByGroup}
                totalChannels={playlist.totalChannels}
                favoritesCount={favoritesCount}
                currentTheme={currentTheme}
              />
            )}

            {/* Filter & Search Toolbar with Resolution Filter & Favorites Toggle */}
            <ChannelToolbar
              filters={filters}
              onFilterChange={handleFilterChange}
              groups={playlist.groups}
              totalChannels={playlist.totalChannels}
              filteredCount={filteredChannels.length}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              favoritesCount={favoritesCount}
              resolutionCounts={resolutionCounts}
              currentTheme={currentTheme}
            />

            {/* Top Pagination Bar */}
            <PaginationControls
              currentPage={currentPage}
              totalItems={filteredChannels.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />

            {/* Channel List & Grid with Resolution Badges and Bookmarks */}
            <ChannelList
              channels={filteredChannels}
              viewMode={viewMode}
              currentPage={currentPage}
              pageSize={pageSize}
              onPlayChannel={(channel) => setActiveChannelForPlayer(channel)}
              onCopyUrl={handleCopySingleUrl}
              copiedId={copiedId}
              streamHealthMap={streamHealthMap}
              onCheckChannel={handleCheckChannel}
              checkingUrls={checkingUrls}
              onEditChannel={handleEditChannel}
              onDeleteChannel={handleDeleteChannel}
              onAddNewChannel={handleAddNewChannel}
              isFavorited={isFavorited}
              onToggleFavorite={handleToggleFavorite}
              currentTheme={currentTheme}
            />

            {/* Bottom Pagination Bar */}
            {filteredChannels.length > pageSize && (
              <PaginationControls
                currentPage={currentPage}
                totalItems={filteredChannels.length}
                pageSize={pageSize}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            )}
          </section>
        )}

        {/* Specifications & IPTV Standards */}
        <section id="formats" className="pt-8 border-t border-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                M3U FILE Performance & Full-Stack Architecture
              </h2>
              <p className="text-xs text-slate-400">
                Python FastAPI backend with asynchronous HTTPX stream probing, combined with Web Worker frontend parsing for lag-free performance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFastApiModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 text-xs font-mono transition-colors cursor-pointer min-h-[36px]"
              >
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>FastAPI Code</span>
              </button>
              <button
                onClick={() => setIsNextjsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-mono transition-colors cursor-pointer min-h-[36px]"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Client Architecture</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel rounded-xl p-4 border border-slate-800/80">
              <h3 className="text-xs font-semibold text-cyan-400 mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Python FastAPI Streaming</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct endpoint <code>/playlist/:slug</code> serves valid <code>audio/x-mpegurl</code> with XMLTV EPG injection for VLC, Kodi, and TiviMate.
              </p>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-slate-800/80">
              <h3 className="text-xs font-semibold text-indigo-400 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Bulk Health Diagnostics</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                High-concurrency stream health verification with 1-click dead channel purging to keep your IPTV playlists clean and functional.
              </p>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-slate-800/80">
              <h3 className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                <span>Quality & Favorites Filter</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instant resolution classification (4K, FHD, HD, SD) and local bookmarking system with dedicated export capabilities.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with M3U FILE branding */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${activeThemeConfig.textAccent}`} />
            <span className="font-bold text-slate-300">M3U FILE</span>
            <span aria-hidden="true" className="text-slate-800">·</span>
            <span>Python FastAPI & Web Worker IPTV Stream Manager</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsFastApiModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-mono cursor-pointer"
            >
              FastAPI Backend
            </button>
            <button
              onClick={() => setIsNextjsModalOpen(true)}
              className="text-violet-400 hover:text-violet-300 font-mono cursor-pointer"
            >
              Client Code
            </button>
            <button
              onClick={() => setIsXtreamModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 font-mono cursor-pointer"
            >
              Xtream Codes
            </button>
          </div>
        </div>
      </footer>

      {/* Video Player Modal */}
      {activeChannelForPlayer && (
        <VideoPlayerModal
          channel={activeChannelForPlayer}
          onClose={() => setActiveChannelForPlayer(null)}
        />
      )}

      {/* Channel Editor Modal */}
      <ChannelEditorModal
        isOpen={isEditorOpen}
        channel={editingChannel}
        existingGroups={playlist.groups}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveChannel}
      />

      {/* Xtream Codes Converter Modal */}
      <XtreamCodesModal
        isOpen={isXtreamModalOpen}
        channels={filteredChannels}
        slug={playlist.slug || 'custom-list'}
        onClose={() => setIsXtreamModalOpen(false)}
      />

      {/* Python FastAPI Backend Explorer Modal */}
      <FastApiBackendModal
        isOpen={isFastApiModalOpen}
        onClose={() => setIsFastApiModalOpen(false)}
        currentTheme={currentTheme}
      />

      {/* Next.js & Client Architecture Modal */}
      <NextjsArchitectureModal
        isOpen={isNextjsModalOpen}
        onClose={() => setIsNextjsModalOpen(false)}
      />

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
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 border ${activeThemeConfig.borderAccent} ${activeThemeConfig.textMuted} rounded-xl shadow-2xl text-xs font-medium backdrop-blur-lg animate-in fade-in slide-in-from-bottom-2 duration-200`}>
          <Check className={`w-4 h-4 ${activeThemeConfig.textAccent}`} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
