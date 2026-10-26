import React, { useState, useRef, DragEvent } from 'react';
import { Upload, FileText, Link2, Sparkles, Check, AlertCircle, ArrowRight, Play, RefreshCw } from 'lucide-react';
import { SAMPLE_PLAYLISTS, SamplePreset } from '../utils/samplePlaylists';

interface UploadSectionProps {
  onParseContent: (content: string, filename?: string) => void;
  isLoading: boolean;
  activeFilename?: string;
  channelCount: number;
  onReset: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onParseContent,
  isLoading,
  activeFilename,
  channelCount,
  onReset,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'url' | 'samples'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [fetchError, setFetchError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      onParseContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return;
    onParseContent(pasteText, 'pasted-playlist.m3u');
  };

  const handleUrlFetch = async () => {
    if (!remoteUrl.trim()) return;
    setFetchError('');
    try {
      const response = await fetch(remoteUrl.trim());
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      const text = await response.text();
      let filename = 'remote-playlist.m3u';
      try {
        const parsed = new URL(remoteUrl);
        const name = parsed.pathname.split('/').filter(Boolean).pop();
        if (name) filename = name;
      } catch {
        // use default
      }
      onParseContent(text, filename);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setFetchError(
        `Direct fetch blocked or failed (${errMsg}). This often occurs due to browser CORS policies. Try uploading the file directly or pasting the M3U content.`
      );
    }
  };

  const handleSelectSample = (sample: SamplePreset) => {
    onParseContent(sample.content, `${sample.id}.m3u`);
  };

  return (
    <div id="converter" className="w-full">
      {/* Hero Headline & Intro */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3 text-balance">
          Convert & Extract <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">M3U Playlists</span> into Clean URLs
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Instantly parse channel titles, stream endpoints, TVG logos, and categories. Test streams in real-time and export to clean M3U8, TXT, JSON, or CSV formats.
        </p>
      </div>

      {/* Main Glass Workspace Panel */}
      <div className="glass-panel-glow rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Method Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800/80 rounded-xl">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>File Upload</span>
            </button>

            <button
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste M3U</span>
            </button>

            <button
              onClick={() => setActiveTab('url')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>From URL</span>
            </button>

            <button
              onClick={() => setActiveTab('samples')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'samples'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sample Playlists</span>
            </button>
          </div>

          {channelCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                {activeFilename || 'Loaded'} ({channelCount} streams)
              </span>
              <button
                onClick={onReset}
                title="Reset Playlist"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Drag & Drop File Upload */}
        {activeTab === 'upload' && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".m3u,.m3u8,.txt,audio/x-mpegurl,application/vnd.apple.mpegurl"
              className="hidden"
            />
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
                  : 'border-slate-700/80 hover:border-cyan-500/60 bg-slate-900/40 hover:bg-slate-900/70'
              }`}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                Drop your M3U or M3U8 file here
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Supports standard .m3u, .m3u8 playlists and plain text stream links
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors">
                Browse Files
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Paste Raw Text */}
        {activeTab === 'paste' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Paste M3U raw playlist content:
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={7}
                placeholder={`#EXTM3U\n#EXTINF:-1 tvg-logo="https://example.com/logo.png" group-title="News",Global News 24/7\nhttps://stream.example.com/live.m3u8`}
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/80 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPasteText('')}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 rounded-lg transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                <span>Parse & Extract URLs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Remote URL Fetch */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Enter Public M3U/M3U8 Web URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  placeholder="https://example.com/playlist.m3u"
                  className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/80"
                />
                <button
                  onClick={handleUrlFetch}
                  disabled={!remoteUrl.trim() || isLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 rounded-lg transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <span>Fetch & Parse</span>
                </button>
              </div>
            </div>

            {fetchError && (
              <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{fetchError}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Sample Presets */}
        {activeTab === 'samples' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 mb-2">
              Select any curated sample playlist to test parsing, channel filtering, live playback, and exports immediately:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_PLAYLISTS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="text-left p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {sample.title}
                      </span>
                      <span className="text-[10px] text-cyan-400/90 font-mono">
                        {sample.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                      {sample.description}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                    <Play className="w-3 h-3 fill-cyan-400" />
                    <span>Load Demo</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
