import React from 'react';
import { Download, Layers, Server, Code } from 'lucide-react';

interface HeaderProps {
  onOpenExport: () => void;
  onOpenXtream: () => void;
  onOpenNextjs: () => void;
  channelCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExport,
  onOpenXtream,
  onOpenNextjs,
  channelCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-lg">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            M3U Stream Nexus
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm text-slate-400 font-medium">
          <a href="#converter" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
            Converter
          </a>
          <a href="#slug-creator" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
            Custom Slug
          </a>
          <a href="#channels" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
            Channels
          </a>
          <a href="#formats" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
            IPTV Specs
          </a>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenNextjs}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-violet-300 border border-violet-500/30 hover:border-violet-500/60 transition-colors cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-violet-400" />
            <span>Next.js Architecture</span>
          </button>

          <button
            onClick={onOpenXtream}
            disabled={channelCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span>Xtream Codes</span>
          </button>

          <button
            onClick={onOpenExport}
            disabled={channelCount === 0}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              channelCount > 0
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 cursor-pointer active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};
