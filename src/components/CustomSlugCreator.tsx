import React, { useState, useEffect } from 'react';
import { Globe, Download, Check, Copy, Sparkles, FolderOpen, RefreshCw, Trash2, HardDrive, Share2, FileDown, Radio, Link as LinkIcon, Server } from 'lucide-react';
import { Channel, AccentTheme } from '../types/playlist';
import {
  getStoredPlaylists,
  savePlaylistLocally,
  deletePlaylistLocally,
  isSlugAvailable,
  downloadClientM3U,
  generateShareableHashUrl,
  generateM3UContent,
  LocalSavedPlaylist,
} from '../utils/localPlaylistStorage';
import { THEME_CONFIG } from '../utils/themeHelper';

interface CustomSlugCreatorProps {
  currentChannels: Channel[];
  currentTitle: string;
  currentSlug?: string;
  currentEpgUrl?: string;
  onPlaylistSaved: (slug: string, title: string, epgUrl?: string) => void;
  onLoadSavedPlaylist: (slug: string) => void;
  currentTheme?: AccentTheme;
}

const EPG_PRESETS = [
  { name: 'US & Global', url: 'https://epgshare01.online/epgshare01/epg_ripper_US1.xml.gz' },
  { name: 'UK & Europe', url: 'https://epgshare01.online/epgshare01/epg_ripper_UK1.xml.gz' },
  { name: 'IPTV-Org TVGuide', url: 'https://iptv-org.github.io/epg/guides/us/tvguide.com.epg.xml' },
];

export const CustomSlugCreator: React.FC<CustomSlugCreatorProps> = ({
  currentChannels,
  currentTitle,
  currentSlug = '',
  currentEpgUrl = '',
  onPlaylistSaved,
  onLoadSavedPlaylist,
  currentTheme = 'cyan',
}) => {
  const [slug, setSlug] = useState(currentSlug);
  const [playlistTitle, setPlaylistTitle] = useState(currentTitle);
  const [epgUrl, setEpgUrl] = useState(currentEpgUrl);
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [savedData, setSavedData] = useState<{
    shareUrl: string;
    slug: string;
    downloadName: string;
    backendStreamUrl: string;
  } | null>(null);

  const [savedPlaylists, setSavedPlaylists] = useState<LocalSavedPlaylist[]>([]);
  const [isCopiedShare, setIsCopiedShare] = useState(false);
  const [isCopiedM3u, setIsCopiedM3u] = useState(false);
  const [isCopiedFastApiUrl, setIsCopiedFastApiUrl] = useState(false);
  const [isJustSaved, setIsJustSaved] = useState(false);

  const theme = THEME_CONFIG[currentTheme];

  // Sync title, slug, and EPG when props change
  useEffect(() => {
    if (currentTitle && !slug) {
      const generatedSlug = currentTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generatedSlug);
      setPlaylistTitle(currentTitle);
    }
  }, [currentTitle]);

  useEffect(() => {
    if (currentEpgUrl && !epgUrl) {
      setEpgUrl(currentEpgUrl);
    }
  }, [currentEpgUrl]);

  // Load existing saved playlists from localStorage on mount
  const refreshLocalPlaylists = () => {
    const list = getStoredPlaylists();
    setSavedPlaylists(list);
  };

  useEffect(() => {
    refreshLocalPlaylists();
  }, []);

  // Validate slug availability locally
  useEffect(() => {
    if (!slug.trim()) {
      setIsAvailable(null);
      return;
    }

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');

    const available = isSlugAvailable(cleanSlug, currentSlug);
    setIsAvailable(available);
  }, [slug, currentSlug]);

  const handleSlugInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
    setSlug(val);
  };

  // Save to both LocalStorage AND FastAPI/Backend endpoint
  const handleSavePlaylist = async () => {
    if (!slug.trim() || currentChannels.length === 0) return;

    const clean = slug.trim();
    const title = playlistTitle.trim() || clean;
    const cleanEpg = epgUrl.trim() || undefined;

    // 1. Save in Browser LocalStorage
    const saved = savePlaylistLocally({
      slug: clean,
      title,
      description: description.trim(),
      channels: currentChannels,
      epgUrl: cleanEpg,
    });

    // 2. Also register with FastAPI / Express backend if reachable
    try {
      await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: clean,
          title,
          description: description.trim(),
          epgUrl: cleanEpg,
          channels: currentChannels,
        }),
      });
    } catch {
      // Backend optional / offline
    }

    const shareUrl = generateShareableHashUrl(currentChannels, saved.title, saved.slug);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
    const backendStreamUrl = `${origin}/playlist/${saved.slug}`;

    setSavedData({
      shareUrl,
      slug: saved.slug,
      downloadName: `${saved.slug}.m3u8`,
      backendStreamUrl,
    });

    onPlaylistSaved(saved.slug, saved.title, cleanEpg);
    refreshLocalPlaylists();

    setIsJustSaved(true);
    setTimeout(() => setIsJustSaved(false), 2500);
  };

  // Direct .m3u8 File Download with EPG injection
  const handleDownloadCustomM3U = () => {
    const activeSlug = slug.trim() || 'custom-playlist';
    downloadClientM3U(currentChannels, `${activeSlug}.m3u8`, playlistTitle || activeSlug, epgUrl.trim() || undefined);
  };

  // Delete from localStorage
  const handleDeleteSaved = (targetSlug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove custom playlist "/${targetSlug}" from browser storage?`)) {
      deletePlaylistLocally(targetSlug);
      refreshLocalPlaylists();
      if (slug === targetSlug) {
        setSavedData(null);
      }
    }
  };

  const copyToClipboard = (text: string, type: 'share' | 'm3u' | 'fastapi') => {
    navigator.clipboard.writeText(text);
    if (type === 'share') {
      setIsCopiedShare(true);
      setTimeout(() => setIsCopiedShare(false), 2000);
    } else if (type === 'm3u') {
      setIsCopiedM3u(true);
      setTimeout(() => setIsCopiedM3u(false), 2000);
    } else {
      setIsCopiedFastApiUrl(true);
      setTimeout(() => setIsCopiedFastApiUrl(false), 2000);
    }
  };

  const currentM3UContent = generateM3UContent(currentChannels, playlistTitle || slug, epgUrl.trim() || undefined);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
  const liveStreamUrl = savedData?.backendStreamUrl || `${origin}/playlist/${slug || 'custom-playlist'}`;

  return (
    <div className={`w-full glass-panel-glow rounded-2xl p-5 sm:p-7 border ${theme.borderAccent} shadow-xl space-y-6 relative overflow-hidden`}>
      {/* Background neon ambient accent */}
      <div className={`absolute top-0 right-0 w-80 h-80 ${theme.bgSubtle} blur-3xl pointer-events-none`} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10 border-b border-slate-800/80 pb-4">
        <div>
          <div className={`flex items-center gap-2 ${theme.textAccent} font-mono text-xs uppercase tracking-wider mb-1`}>
            <HardDrive className="w-4 h-4" />
            <span>Custom URL Generator & EPG Manager</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Custom Link Naming, EPG & Direct Conversion
          </h2>
          <p className="text-xs text-slate-400">
            Define custom slug names, attach XMLTV EPG guides, and generate direct streaming URLs for VLC, TiviMate, or Kodi.
          </p>
        </div>

        {/* Existing local custom playlists quick selector */}
        {savedPlaylists.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <FolderOpen className={`w-3.5 h-3.5 ${theme.textAccent}`} />
              <span>Saved Playlists:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <select
                onChange={(e) => {
                  if (e.target.value) onLoadSavedPlaylist(e.target.value);
                }}
                value={currentSlug || ''}
                className={`px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono ${theme.textMuted} focus:outline-none focus:${theme.borderAccent} cursor-pointer`}
              >
                <option value="">Switch to saved ({savedPlaylists.length})...</option>
                {savedPlaylists.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    /{p.slug} ({p.channelCount} ch)
                  </option>
                ))}
              </select>
              {currentSlug && (
                <button
                  onClick={(e) => handleDeleteSaved(currentSlug, e)}
                  title="Delete current saved playlist"
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Form Fields: Slug, Display Title, and XMLTV EPG URL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {/* Custom Slug Input */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Custom Playlist Slug / Filename <span className={`${theme.textAccent} font-mono`}>*</span>
          </label>
          <div className="relative">
            <div className={`flex items-center rounded-xl bg-slate-950/90 border border-slate-800 focus-within:${theme.borderAccent} focus-within:ring-1 px-3 py-2 text-xs font-mono text-slate-300`}>
              <span className="text-slate-600 select-none mr-1">/playlist/</span>
              <input
                type="text"
                value={slug}
                onChange={handleSlugInput}
                placeholder="my-sports-list"
                className={`flex-1 bg-transparent focus:outline-none ${theme.textMuted} placeholder:text-slate-700 font-semibold`}
              />
              <span className="text-slate-500 select-none ml-1">.m3u8</span>
              {isAvailable === true && slug && (
                <span className="ml-2 flex items-center gap-1 text-[11px] text-emerald-400 font-sans font-medium">
                  <Check className="w-3.5 h-3.5" /> Available
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Permanent endpoint: <code className={theme.textAccent}>/playlist/{slug || 'custom-name'}</code>
          </p>
        </div>

        {/* Playlist Display Title */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Playlist Display Title
          </label>
          <input
            type="text"
            value={playlistTitle}
            onChange={(e) => setPlaylistTitle(e.target.value)}
            placeholder="e.g. My Premium Sports & News"
            className="w-full px-3 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Displayed inside IPTV players & headers.
          </p>
        </div>

        {/* EPG (Electronic Program Guide) Support */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>XMLTV EPG URL Guide</span>
            </label>
            <span className="text-[10px] text-emerald-400 font-mono">url-tvg</span>
          </div>
          <input
            type="text"
            value={epgUrl}
            onChange={(e) => setEpgUrl(e.target.value)}
            placeholder="https://example.com/epg.xml.gz"
            className="w-full px-3 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-emerald-300 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 font-mono"
          />
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto">
            <span className="text-[10px] text-slate-500">Presets:</span>
            {EPG_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setEpgUrl(p.url)}
                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 border border-slate-800 whitespace-nowrap cursor-pointer"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action to Save & Download */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 relative z-10 border-t border-slate-800/80">
        <div className="text-xs text-slate-400">
          Target configuration: <strong className="text-white font-mono">{currentChannels.length}</strong> channels under <code className={`${theme.textAccent} font-mono`}>{slug || 'custom-playlist'}.m3u8</code>
          {epgUrl && <span className="ml-2 text-emerald-400 font-mono text-[11px]">· EPG attached</span>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSavePlaylist}
            disabled={!slug.trim() || currentChannels.length === 0}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:${theme.borderAccent} shadow-md disabled:opacity-50 transition-all cursor-pointer`}
          >
            {isJustSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Saved Successfully!</span>
              </>
            ) : (
              <>
                <HardDrive className={`w-3.5 h-3.5 ${theme.textAccent}`} />
                <span>Save to Storage & API</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadCustomM3U}
            disabled={!slug.trim() || currentChannels.length === 0}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white ${theme.gradientButton} shadow-lg ${theme.shadowGlow} disabled:opacity-50 transition-all cursor-pointer active:scale-98`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {slug ? `${slug}.m3u8` : '.m3u8'}</span>
          </button>
        </div>
      </div>

      {/* Generated URLs Hub Card */}
      {(savedData || slug) && (
        <div className={`p-4 rounded-xl bg-slate-900/80 border ${theme.borderAccent} space-y-3 relative z-10`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${theme.textAccent} bg-current animate-pulse`} />
              Live Deployment Endpoints for <code className={`${theme.textAccent} font-mono`}>/{slug || 'custom-playlist'}</code>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded flex items-center gap-1">
              <Server className="w-3 h-3" />
              <span>FastAPI & Client Ready</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* 1. Direct IPTV Stream Link for VLC / Kodi / TiviMate */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col justify-between gap-2.5">
              <div>
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <Radio className="w-3 h-3 text-cyan-400" />
                  <span>IPTV Stream URL (VLC, Kodi, TiviMate):</span>
                </span>
                <span className="font-mono text-cyan-300 text-[11px] break-all select-all block">
                  {liveStreamUrl}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1.5 border-t border-slate-900">
                <button
                  onClick={() => copyToClipboard(liveStreamUrl, 'fastapi')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-600/25 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {isCopiedFastApiUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedFastApiUrl ? 'Copied IPTV Link!' : 'Copy IPTV Link'}</span>
                </button>
              </div>
            </div>

            {/* 2. Direct Instant Download / Copy Raw M3U */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col justify-between gap-2.5">
              <div>
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <FileDown className="w-3 h-3 text-indigo-400" />
                  <span>Instant M3U8 File Generation:</span>
                </span>
                <span className="font-mono text-indigo-300 text-[11px] block">
                  Filename: <strong className="text-white">{slug || 'playlist'}.m3u8</strong> ({currentChannels.length} streams)
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1.5 border-t border-slate-900">
                <button
                  onClick={() => copyToClipboard(currentM3UContent, 'm3u')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {isCopiedM3u ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedM3u ? 'M3U Copied!' : 'Copy Raw M3U'}</span>
                </button>
                <button
                  onClick={handleDownloadCustomM3U}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
