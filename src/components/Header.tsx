import React, { useState } from 'react';
import { Download, Layers, Server, Code, Menu, X, Zap } from 'lucide-react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark: M3U FILE */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-xl font-extrabold tracking-tight text-white">
              M3U FILE
            </span>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest hidden sm:inline">
              PRO
            </span>
          </div>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
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

        {/* Zone 3: Primary Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenNextjs}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-violet-300 border border-violet-500/30 hover:border-violet-500/60 transition-colors cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-violet-400" />
            <span>Client Next.js</span>
          </button>

          <button
            onClick={onOpenXtream}
            disabled={channelCount === 0}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span>Xtream Codes</span>
          </button>

          <button
            onClick={onOpenExport}
            disabled={channelCount === 0}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 min-h-[36px] ${
              channelCount > 0
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 cursor-pointer active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 p-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col gap-2 text-sm text-slate-300 font-medium">
            <a
              href="#converter"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-900 text-slate-200"
            >
              Converter
            </a>
            <a
              href="#slug-creator"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-900 text-slate-200"
            >
              Custom Slug Creator
            </a>
            <a
              href="#channels"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-900 text-slate-200"
            >
              Channels Explorer
            </a>
            <a
              href="#formats"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-900 text-slate-200"
            >
              IPTV Specifications
            </a>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenXtream();
              }}
              disabled={channelCount === 0}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-slate-900 text-indigo-300 border border-indigo-500/30"
            >
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Xtream Codes Converter</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenNextjs();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-medium bg-slate-900 text-violet-300 border border-violet-500/30"
            >
              <Code className="w-4 h-4 text-violet-400" />
              <span>Client Next.js Code</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
