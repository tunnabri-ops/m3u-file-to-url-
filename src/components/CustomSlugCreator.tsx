import React, { useState, useEffect } from 'react';
import { Globe, Link, Check, Copy, ExternalLink, Sparkles, FolderOpen, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { Channel, SavedPlaylistSummary } from '../types/playlist';

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
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedData, setSavedData] = useState<{
    shareUrl: string;
    m3uStreamUrl: string;
    slug: string;
  } | null>(null);

  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylistSummary[]>([]);
  const [isCopiedWeb, setIsCopiedWeb] = useState(false);
  const [isCopiedM3u, setIsCopiedM3u] = useState(false);

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

  // Load existing saved playlists list
  const fetchSavedPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists');
      if (res.ok) {
        const data = await res.json();
        setSavedPlaylists(data.playlists || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSavedPlaylists();
  }, []);

  // Validate slug availability with debounce
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

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await fetch(`/api/check-slug/${cleanSlug}`);
        if (res.ok) {
          const data = await res.json();
          // If editing same slug, it's ok
          setIsAvailable(data.available || cleanSlug === currentSlug);
        }
      } catch {
        setIsAvailable(true);
      } finally {
        setIsChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [slug, currentSlug]);

  const handleSlugInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
    setSlug(val);
  };

  const handleSavePlaylist = async () => {
    if (!slug.trim() || currentChannels.length === 0) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug.trim(),
          title: playlistTitle.trim() || slug.trim(),
          description: description.trim(),
          channels: currentChannels,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save playlist');
      }

      const data = await res.json();
      setSavedData({
        shareUrl: data.shareUrl,
        m3uStreamUrl: data.m3uStreamUrl,
        slug: data.slug,
      });
      onPlaylistSaved(data.slug, data.title);
      fetchSavedPlaylists();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error saving custom URL');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, type: 'web' | 'm3u') => {
    navigator.clipboard.writeText(text);
    if (type === 'web') {
      setIsCopiedWeb(true);
      setTimeout(() => setIsCopiedWeb(false), 2000);
    } else {
      setIsCopiedM3u(true);
      setTimeout(() => setIsCopiedM3u(false), 2000);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com';
  const previewWebUrl = `${origin}/playlist/${slug || 'custom-name'}`;
  const previewM3uUrl = `${origin}/api/playlist/${slug || 'custom-name'}?format=m3u`;

  return (
    <div className="w-full glass-panel-glow rounded-2xl p-5 sm:p-7 border border-violet-500/20 shadow-xl space-y-6 relative overflow-hidden">
      {/* Background neon grid accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-600/10 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4" />
            <span>Custom URL Generator & IPTV Manager</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Create Permanent Custom Playlist URL
          </h2>
          <p className="text-xs text-slate-400">
            Publish your curated channels to a custom slug. Stream directly into VLC, TiviMate, or Kodi, or share via web link.
          </p>
        </div>

        {/* Existing custom playlists quick selector */}
        {savedPlaylists.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Saved Playlists:</span>
            <select
              onChange={(e) => {
                if (e.target.value) onLoadSavedPlaylist(e.target.value);
              }}
              value={currentSlug || ''}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="">Switch to saved...</option>
              {savedPlaylists.map((p) => (
                <option key={p.slug} value={p.slug}>
                  /{p.slug} ({p.channelCount} ch)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Slug Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {/* Custom Slug Input */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Custom Link Slug <span className="text-cyan-400 font-mono">*</span>
          </label>
          <div className="relative">
            <div className="flex items-center rounded-xl bg-slate-950/90 border border-slate-800 focus-within:border-cyan-500/80 focus-within:ring-1 focus-within:ring-cyan-500/80 px-3 py-2 text-xs font-mono text-slate-300">
              <span className="text-slate-600 select-none mr-1">/playlist/</span>
              <input
                type="text"
                value={slug}
                onChange={handleSlugInput}
                placeholder="my-sports-list"
                className="flex-1 bg-transparent focus:outline-none text-cyan-300 placeholder:text-slate-700 font-semibold"
              />
              {isChecking && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />}
              {!isChecking && isAvailable === true && slug && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-sans font-medium">
                  <Check className="w-3.5 h-3.5" /> Available
                </span>
              )}
              {!isChecking && isAvailable === false && (
                <span className="text-[11px] text-rose-400 font-sans font-medium">
                  Slug taken
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Alphanumeric characters and hyphens only (e.g. <code>euro-sports-hd</code>).
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
            Visible in IPTV players and browser titles.
          </p>
        </div>
      </div>

      {/* Action to Save / Deploy Custom Slug */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 relative z-10 border-t border-slate-800/80">
        <div className="text-xs text-slate-400">
          Ready to publish <strong className="text-white font-mono">{currentChannels.length}</strong> channels under <code className="text-cyan-300 font-mono">/{slug || 'custom-name'}</code>
        </div>

        <button
          onClick={handleSavePlaylist}
          disabled={!slug.trim() || currentChannels.length === 0 || isSaving || isAvailable === false}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Publishing to Database...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deploy Custom URL & Save</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Permanent URLs Showcase Card */}
      {(savedData || slug) && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Permanent URLs for <code className="text-cyan-300 font-mono">/{slug}</code>
            </span>
            {savedData && (
              <span className="text-[10px] text-emerald-400 font-mono">
                Active in Database
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* 1. Direct Web Player & Manager Link */}
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col justify-between gap-2">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Web Dashboard Link:
                </span>
                <span className="font-mono text-cyan-300 text-[11px] break-all select-all">
                  {savedData?.shareUrl || previewWebUrl}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                <button
                  onClick={() => copyToClipboard(savedData?.shareUrl || previewWebUrl, 'web')}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors cursor-pointer"
                >
                  {isCopiedWeb ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedWeb ? 'Copied' : 'Copy Web Link'}</span>
                </button>
                <a
                  href={savedData?.shareUrl || previewWebUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-slate-400 hover:text-white"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* 2. Direct IPTV M3U Playlist Stream Link (for VLC, TiviMate, etc.) */}
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col justify-between gap-2">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Direct IPTV Stream Endpoint (VLC / Kodi / TiviMate):
                </span>
                <span className="font-mono text-indigo-300 text-[11px] break-all select-all">
                  {savedData?.m3uStreamUrl || previewM3uUrl}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                <button
                  onClick={() => copyToClipboard(savedData?.m3uStreamUrl || previewM3uUrl, 'm3u')}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-[11px] transition-colors cursor-pointer"
                >
                  {isCopiedM3u ? <Check className="w-3 h-3 text-emerald-400" /> : <Link className="w-3 h-3" />}
                  <span>{isCopiedM3u ? 'Copied M3U Link' : 'Copy M3U Link for IPTV'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
