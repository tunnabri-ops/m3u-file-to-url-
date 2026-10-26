import React from 'react';
import { Tv, FolderTree, Image, Check, Copy, Download, Activity, RefreshCw, Trash2, ShieldAlert, Sparkles } from 'lucide-react';
import { PlaylistData, StreamHealthResult, AccentTheme } from '../types/playlist';
import { THEME_CONFIG } from '../utils/themeHelper';

interface StatsBarProps {
  playlist: PlaylistData;
  onCopyAllUrls: () => void;
  isCopiedAll: boolean;
  onOpenExport: () => void;
  streamHealthMap: Record<string, StreamHealthResult>;
  onCheckAllStreams: () => void;
  isCheckingAll: boolean;
  probeProgress: { current: number; total: number } | null;
  statusFilter: string;
  onStatusFilterChange: (status: 'ALL' | 'LIVE' | 'OFFLINE' | 'UNCHECKED') => void;
  onRemoveDeadChannels: () => void;
  currentTheme?: AccentTheme;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  playlist,
  onCopyAllUrls,
  isCopiedAll,
  onOpenExport,
  streamHealthMap,
  onCheckAllStreams,
  isCheckingAll,
  probeProgress,
  statusFilter,
  onStatusFilterChange,
  onRemoveDeadChannels,
  currentTheme = 'cyan',
}) => {
  const theme = THEME_CONFIG[currentTheme];

  // Calculate live & offline counts from the health map
  let liveCount = 0;
  let offlineCount = 0;
  playlist.channels.forEach((c) => {
    const h = streamHealthMap[c.url];
    if (h?.status === 'live') liveCount++;
    else if (h?.status === 'offline') offlineCount++;
  });

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800/80 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Side: Unboxed metrics with typographic separators */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-200">
            <Tv className={`w-4 h-4 ${theme.textAccent}`} />
            <span className="font-semibold text-white font-mono tabular-nums text-sm">
              {playlist.totalChannels}
            </span>
            <span>channels</span>
          </div>

          <span aria-hidden="true" className="text-slate-700">·</span>

          <div className="flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono tabular-nums text-slate-200 font-medium">
              {playlist.groups.length}
            </span>
            <span>categories</span>
          </div>

          <span aria-hidden="true" className="text-slate-700">·</span>

          <div className="flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono tabular-nums text-slate-200 font-medium">
              {playlist.channelsWithLogo}
            </span>
            <span>with logos</span>
          </div>

          {playlist.epgUrl && (
            <>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <div className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                <Sparkles className="w-3 h-3" />
                <span>EPG Linked</span>
              </div>
            </>
          )}

          <span aria-hidden="true" className="text-slate-700">·</span>

          {/* Real-time Health Counts */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStatusFilterChange(statusFilter === 'LIVE' ? 'ALL' : 'LIVE')}
              title="Filter by live channels"
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                statusFilter === 'LIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold ring-1 ring-emerald-500/50'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>Live:</span>
              <span className="tabular-nums font-semibold">{liveCount}</span>
            </button>

            <button
              onClick={() => onStatusFilterChange(statusFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE')}
              title="Filter by offline channels"
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                statusFilter === 'OFFLINE'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold ring-1 ring-rose-500/50'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
              <span>Offline:</span>
              <span className="tabular-nums font-semibold">{offlineCount}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Prober trigger & Dead Channel Remover */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Dead Channel Remover Button */}
          {offlineCount > 0 && (
            <button
              onClick={onRemoveDeadChannels}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 hover:border-rose-400 shadow-lg shadow-rose-950/50 transition-all cursor-pointer animate-in fade-in"
              title="Delete all offline/dead channels from current playlist"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Remove Dead Channels ({offlineCount})</span>
            </button>
          )}

          {/* Probe All Streams Button */}
          <button
            onClick={onCheckAllStreams}
            disabled={isCheckingAll}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              isCheckingAll
                ? `${theme.bgSubtle} ${theme.borderAccent} ${theme.textAccent}`
                : `bg-slate-900 border-slate-700 hover:${theme.borderAccent} text-slate-200 hover:${theme.textAccent}`
            }`}
          >
            {isCheckingAll ? (
              <>
                <RefreshCw className={`w-3.5 h-3.5 animate-spin ${theme.textAccent}`} />
                <span>
                  Probing {probeProgress ? `${probeProgress.current}/${probeProgress.total}` : 'Streams...'}
                </span>
              </>
            ) : (
              <>
                <Activity className={`w-3.5 h-3.5 ${theme.textAccent}`} />
                <span>Bulk Health Checker</span>
              </>
            )}
          </button>

          <button
            onClick={onCopyAllUrls}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              isCopiedAll
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {isCopiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied All {playlist.totalChannels} URLs</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy URLs</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenExport}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${theme.bgSubtle} hover:${theme.borderGlow} ${theme.textAccent} border ${theme.borderAccent} transition-colors cursor-pointer`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};
