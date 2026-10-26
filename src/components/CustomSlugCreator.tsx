import React, { useState, useEffect } from 'react';
import { Globe, Download, Check, Copy, Sparkles, FolderOpen, RefreshCw, Trash2, HardDrive, Share2, FileDown } from 'lucide-react';
import { Channel } from '../types/playlist';
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

interface CustomSlugCreatorProps {
  currentChannels: Channel[];
  currentTitle: string;
  currentSlug?: string;
  onPlaylistSaved: (slug: string, title: string) => void;
  onLoadSavedPlaylist: (slug: string) => void;
}

export const CustomSlugCreator: React.FC<CustomSlugCreatorProps> = ({
  currentChannels,
  currentTitle,
  currentSlug = '',
  onPlaylistSaved,
  onLoadSavedPlaylist,
}) => {
  const [slug, setSlug] = useState(currentSlug);
  const [playlistTitle, setPlaylistTitle] = useState(currentTitle);
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [savedData, setSavedData] = useState<{
    shareUrl: string;
    slug: string;
    downloadName: string;
  } | null>(null);

  const [savedPlaylists, setSavedPlaylists] = useState<LocalSavedPlaylist[]>([]);
  const [isCopiedShare, setIsCopiedShare] = useState(false);
  const [isCopiedM3u, setIsCopiedM3u] = useState(false);
  const [isJustSaved, setIsJustSaved] = useState(false);

  // Sync title and slug when currentTitle changes
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

  // Load existing saved playlists from localStorage on mount
  const refreshLocalPlaylists = () => {
    const list = getStoredPlaylists();
    setSavedPlaylists(list);
  };

  useEffect(() => {
    refreshLocalPlaylists();
  }, []);

  // Validate slug availability locally with debounce
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

  // 100% Client-Side Save to localStorage
  const handleSavePlaylist = () => {
    if (!slug.trim() || currentChannels.length === 0) return;

    const saved = savePlaylistLocally({
      slug: slug.trim(),
      title: playlistTitle.trim() || slug.trim(),
      description: description.trim(),
      channels: currentChannels,
    });

    const shareUrl = generateShareableHashUrl(currentChannels, saved.title, saved.slug);

    setSavedData({
      shareUrl,
      slug: saved.slug,
      downloadName: `${saved.slug}.m3u8`,
    });

    onPlaylistSaved(saved.slug, saved.title);
    refreshLocalPlaylists();

    setIsJustSaved(true);
    setTimeout(() => setIsJustSaved(false), 2500);
  };

  // 100% Client-Side Direct .m3u8 File Download
  const handleDownloadCustomM3U = () => {
    const activeSlug = slug.trim() || 'custom-playlist';
    downloadClientM3U(currentChannels, `${activeSlug}.m3u8`, playlistTitle || activeSlug);
  };

  // 100% Client-Side Delete from localStorage
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

  const copyToClipboard = (text: string, type: 'share' | 'm3u') => {
    navigator.clipboard.writeText(text);
    if (type === 'share') {
      setIsCopiedShare(true);
      setTimeout(() => setIsCopiedShare(false), 2000);
    } else {
      setIsCopiedM3u(true);
      setTimeout(() => setIsCopiedM3u(false), 2000);
    }
  };

  const currentM3UContent = generateM3UContent(currentChannels, playlistTitle || slug);

  return (
    <div className="w-full glass-panel-glow rounded-2xl p-5 sm:p-7 border border-violet-500/20 shadow-xl space-y-6 relative overflow-hidden">
      {/* Background neon grid accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-600/10 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <HardDrive className="w-4 h-4" />
            <span>100% Client-Side Custom URL & Playlist Manager</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Custom Link Naming & Direct Conversion
          </h2>
          <p className="text-xs text-slate-400">
            Customize playlist naming, edit metadata, and download your tailored .m3u8 directly from the browser with zero server or database setup.
          </p>
        </div>

        {/* Existing local custom playlists quick selector */}
        {savedPlaylists.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Saved Playlists:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <select
                onChange={(e) => {
                  if (e.target.value) onLoadSavedPlaylist(e.target.value);
                }}
                value={currentSlug || ''}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
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

      {/* Slug Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {/* Custom Slug Input */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Custom Playlist Slug / Filename <span className="text-cyan-400 font-mono">*</span>
          </label>
          <div className="relative">
            <div className="flex items-center rounded-xl bg-slate-950/90 border border-slate-800 focus-within:border-cyan-500/80 focus-within:ring-1 focus-within:ring-cyan-500/80 px-3 py-2 text-xs font-mono text-slate-300">
              <span className="text-slate-600 select-none mr-1">custom/</span>
              <input
                type="text"
                value={slug}
                onChange={handleSlugInput}
                placeholder="my-sports-list"
                className="flex-1 bg-transparent focus:outline-none text-cyan-300 placeholder:text-slate-700 font-semibold"
              />
              <span className="text-slate-500 select-none ml-1">.m3u8</span>
              {isAvailable === true && slug && (
                <span className="ml-2 flex items-center gap-1 text-[11px] text-emerald-400 font-sans font-medium">
                  <Check className="w-3.5 h-3.5" /> Available
                </span>
              )}
              {isAvailable === false && (
                <span className="ml-2 text-[11px] text-amber-400 font-sans font-medium">
                  Overwrite existing
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Custom name for your exported file e.g. <code className="text-cyan-400">euro-sports-hd.m3u8</code>
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
            Appended inside the <code className="text-violet-400">#EXTM3U</code> header.
          </p>
        </div>
      </div>

      {/* Action to Save & Download */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 relative z-10 border-t border-slate-800/80">
        <div className="text-xs text-slate-400">
          Target configuration: <strong className="text-white font-mono">{currentChannels.length}</strong> channels under <code className="text-cyan-300 font-mono">{slug || 'custom-playlist'}.m3u8</code>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSavePlaylist}
            disabled={!slug.trim() || currentChannels.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 shadow-md disabled:opacity-50 transition-all cursor-pointer"
          >
            {isJustSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Saved in Browser!</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>Save to Browser Storage</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadCustomM3U}
            disabled={!slug.trim() || currentChannels.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 disabled:opacity-50 transition-all cursor-pointer active:scale-98"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {slug ? `${slug}.m3u8` : '.m3u8'}</span>
          </button>
        </div>
      </div>

      {/* 100% Client-Side Showcase Card */}
      {(savedData || slug) && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Client-Side Export & Share Hub for <code className="text-cyan-300 font-mono">/{slug || 'custom-playlist'}</code>
            </span>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
              Zero Database Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* 1. Direct Shareable Link (Encoded URL Hash) */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col justify-between gap-2.5">
              <div>
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <Share2 className="w-3 h-3 text-cyan-400" />
                  <span>Client-Side Shareable URL (Hash Encoded):</span>
                </span>
                <span className="font-mono text-cyan-300 text-[11px] break-all select-all block line-clamp-2">
                  {savedData?.shareUrl || generateShareableHashUrl(currentChannels, playlistTitle, slug)}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1.5 border-t border-slate-900">
                <button
                  onClick={() => copyToClipboard(savedData?.shareUrl || generateShareableHashUrl(currentChannels, playlistTitle, slug), 'share')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {isCopiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedShare ? 'Share URL Copied!' : 'Copy Shareable Link'}</span>
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
                  Filename: <strong className="text-white">{slug || 'playlist'}.m3u8</strong> ({currentChannels.length} streams ready)
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1.5 border-t border-slate-900">
                <button
                  onClick={() => copyToClipboard(currentM3UContent, 'm3u')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {isCopiedM3u ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedM3u ? 'M3U Content Copied!' : 'Copy Raw M3U'}</span>
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
