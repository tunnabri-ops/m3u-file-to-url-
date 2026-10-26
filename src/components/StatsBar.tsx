import React from 'react';
import { Tv, FolderTree, Image, Check, Copy, Download, Activity, RefreshCw } from 'lucide-react';
import { PlaylistData, StreamHealthResult } from '../types/playlist';

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
}) => {
  const hlsCount = playlist.channels.filter((c) => c.format === 'HLS').length;
  const mp4Count = playlist.channels.filter((c) => c.format === 'MP4').length;

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
            <Tv className="w-4 h-4 text-cyan-400" />
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

          <span aria-hidden="true" className="text-slate-700">·</span>

          {/* Real-time Health Counts */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStatusFilterChange(statusFilter === 'LIVE' ? 'ALL' : 'LIVE')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                statusFilter === 'LIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span>Live:</span>
              <span className="tabular-nums font-semibold">{liveCount}</span>
            </button>

            <button
              onClick={() => onStatusFilterChange(statusFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                statusFilter === 'OFFLINE'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
              <span>Offline:</span>
              <span className="tabular-nums font-semibold">{offlineCount}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Prober trigger & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Probe All Streams Button */}
          <button
            onClick={onCheckAllStreams}
            disabled={isCheckingAll}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              isCheckingAll
                ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300'
            }`}
          >
            {isCheckingAll ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>
                  Probing {probeProgress ? `${probeProgress.current}/${probeProgress.total}` : 'Streams...'}
                </span>
              </>
            ) : (
              <>
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Check All Stream Health</span>
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};
