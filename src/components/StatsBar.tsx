import React from 'react';
import { Tv, FolderTree, Image, Check, Copy, Download, Radio } from 'lucide-react';
import { PlaylistData } from '../types/playlist';

interface StatsBarProps {
  playlist: PlaylistData;
  onCopyAllUrls: () => void;
  isCopiedAll: boolean;
  onOpenExport: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  playlist,
  onCopyAllUrls,
  isCopiedAll,
  onOpenExport,
}) => {
  const hlsCount = playlist.channels.filter((c) => c.format === 'HLS').length;
  const mp4Count = playlist.channels.filter((c) => c.format === 'MP4').length;
  const tsCount = playlist.channels.filter((c) => c.format === 'TS').length;

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800/80">
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

          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            {hlsCount > 0 && <span>HLS: <strong className="text-cyan-300 font-normal tabular-nums">{hlsCount}</strong></span>}
            {mp4Count > 0 && <span>MP4: <strong className="text-indigo-300 font-normal tabular-nums">{mp4Count}</strong></span>}
            {tsCount > 0 && <span>TS: <strong className="text-purple-300 font-normal tabular-nums">{tsCount}</strong></span>}
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
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
                <span>Copy All Stream URLs</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Clean Format</span>
          </button>
        </div>
      </div>
    </div>
  );
};
