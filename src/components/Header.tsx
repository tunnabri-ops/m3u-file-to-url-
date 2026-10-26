import React, { useState } from 'react';
import { Download, Server, Code, Menu, X, Zap, Palette, Sparkles, Terminal } from 'lucide-react';
import { AccentTheme } from '../types/playlist';
import { THEME_CONFIG } from '../utils/themeHelper';

interface HeaderProps {
  onOpenExport: () => void;
  onOpenXtream: () => void;
  onOpenNextjs: () => void;
  onOpenFastApi: () => void;
  channelCount: number;
  currentTheme: AccentTheme;
  onThemeChange: (theme: AccentTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExport,
  onOpenXtream,
  onOpenNextjs,
  onOpenFastApi,
  channelCount,
  currentTheme,
  onThemeChange,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const theme = THEME_CONFIG[currentTheme];

  const themes: { id: AccentTheme; name: string; color: string; dotClass: string }[] = [
    { id: 'cyan', name: 'Cyan', color: '#06b6d4', dotClass: 'bg-cyan-400' },
    { id: 'purple', name: 'Purple', color: '#a855f7', dotClass: 'bg-purple-400' },
    { id: 'emerald', name: 'Emerald', color: '#10b981', dotClass: 'bg-emerald-400' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark: M3U FILE */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className={`w-9 h-9 rounded-xl ${theme.gradientButton} flex items-center justify-center shadow-lg ${theme.shadowGlow} text-white font-black text-lg transition-all`}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-xl font-extrabold tracking-tight text-white">
              M3U FILE
            </span>
            <span className={`text-[10px] font-mono ${theme.textAccent} uppercase tracking-widest hidden sm:inline`}>
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

        {/* Zone 3: Primary Action Buttons & Theme Customizer */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Theme & Accent Customizer Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl" title="Theme & Accent Customizer">
            {themes.map((t) => {
              const isActive = currentTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id)}
                  aria-label={`Switch to ${t.name} theme`}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${t.dotClass} ${isActive ? 'ring-2 ring-white/30' : 'opacity-70'}`} />
                  <span className="hidden sm:inline">{t.name}</span>
                </button>
              );
            })}
          </div>

          {/* FastAPI Backend Code Button */}
          <button
            onClick={onOpenFastApi}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:border-emerald-500/70 transition-colors cursor-pointer"
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>FastAPI Backend</span>
          </button>

          {/* Next.js Client Code */}
          <button
            onClick={onOpenNextjs}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-slate-400" />
            <span>Next.js Code</span>
          </button>

          <button
            onClick={onOpenXtream}
            disabled={channelCount === 0}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Xtream</span>
          </button>

          <button
            onClick={onOpenExport}
            disabled={channelCount === 0}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 min-h-[36px] ${
              channelCount > 0
                ? `${theme.gradientButton} text-white shadow-md ${theme.shadowGlow} cursor-pointer active:scale-98`
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
                onOpenFastApi();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-medium bg-emerald-950/50 text-emerald-300 border border-emerald-500/40"
            >
              <Server className="w-4 h-4 text-emerald-400" />
              <span>FastAPI Backend Code</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenXtream();
              }}
              disabled={channelCount === 0}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-slate-900 text-indigo-300 border border-indigo-500/30"
            >
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Xtream Codes Converter</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
