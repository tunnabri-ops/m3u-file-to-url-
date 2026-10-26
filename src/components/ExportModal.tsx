import React, { useState } from 'react';
import { X, Copy, Download, Check, Share2, Server } from 'lucide-react';
import { Channel, PlaylistData } from '../types/playlist';
import { exportCleanM3U, exportPlainUrls, exportJSON, exportCSV } from '../utils/m3uParser';
import { generateSingleFileHtml } from '../utils/standaloneHtmlGenerator';

interface ExportModalProps {
  playlist: PlaylistData;
  filteredChannels: Channel[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  playlist,
  filteredChannels,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'m3u' | 'txt' | 'json' | 'csv' | 'xtream' | 'share' | 'standalone'>('m3u');
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('all');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const channelsToUse = exportScope === 'filtered' ? filteredChannels : playlist.channels;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com';

  const exportXtreamFormat = (channels: Channel[]) => {
    const slug = playlist.slug || 'custom-list';
    return JSON.stringify(
      {
        server_info: {
          server_url: origin,
          port: '443',
          https_port: '443',
          server_protocol: 'https',
        },
        user_info: {
          username: `user_${slug.replace(/[^a-z0-9]/g, '')}`,
          password: 'iptv-password',
          status: 'Active',
          max_connections: '5',
        },
        m3u_plus_url: `${origin}/api/playlist/${slug}?format=m3u&type=m3u_plus`,
        player_api_url: `${origin}/api/playlist/${slug}?player_api=true`,
        categories: Array.from(new Set(channels.map((c) => c.group || 'General'))).map((g, idx) => ({
          category_id: `${idx + 1}`,
          category_name: g,
        })),
        channels: channels.map((c, idx) => ({
          num: idx + 1,
          name: c.name,
          stream_id: idx + 1001,
          stream_icon: c.logo,
          epg_channel_id: c.tvgId,
          category_name: c.group,
          direct_source: c.url,
        })),
      },
      null,
      2
    );
  };

  const getExportContent = (format: 'm3u' | 'txt' | 'json' | 'csv' | 'xtream' | 'standalone') => {
    switch (format) {
      case 'm3u':
        return exportCleanM3U(playlist, channelsToUse);
      case 'txt':
        return exportPlainUrls(channelsToUse);
      case 'json':
        return exportJSON(channelsToUse);
      case 'csv':
        return exportCSV(channelsToUse);
      case 'xtream':
        return exportXtreamFormat(channelsToUse);
      case 'standalone':
        return generateSingleFileHtml();
      default:
        return '';
    }
  };

  const handleCopy = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleDownload = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentContent = activeTab !== 'share' ? getExportContent(activeTab) : '';

  const getShareableUrl = () => {
    if (playlist.slug) {
      return `${origin}/playlist/${playlist.slug}`;
    }
    const dataToShare = channelsToUse.slice(0, 30).map((c) => ({
      n: c.name,
      u: c.url,
      g: c.group,
      l: c.logo || undefined,
    }));
    try {
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(dataToShare))));
      return `${window.location.origin}${window.location.pathname}#playlist=${b64}`;
    } catch {
      return window.location.href;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl glass-panel-glow rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div>
            <h3 className="text-base font-semibold text-white">
              Export Channels & Formats
            </h3>
            <p className="text-xs text-slate-400">
              Clean M3U8, plain URLs, JSON, CSV, Xtream Codes, or Standalone HTML
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope selector & Tabs */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          {/* Format Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('m3u')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'm3u' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Clean M3U8
            </button>
            <button
              onClick={() => setActiveTab('txt')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'txt' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Plain URLs (.txt)
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'json' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'csv' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              CSV
            </button>
            <button
              onClick={() => setActiveTab('xtream')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'xtream' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Xtream Codes
            </button>
            <button
              onClick={() => setActiveTab('share')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'share' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Share Link
            </button>
            <button
              onClick={() => setActiveTab('standalone')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'standalone' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Standalone HTML
            </button>
          </div>

          {/* Export Scope */}
          {activeTab !== 'standalone' && activeTab !== 'share' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-[11px]">Scope:</span>
              <button
                onClick={() => setExportScope('all')}
                className={`px-2 py-1 rounded-md text-[11px] font-mono cursor-pointer ${
                  exportScope === 'all'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                All ({playlist.totalChannels})
              </button>
              <button
                onClick={() => setExportScope('filtered')}
                className={`px-2 py-1 rounded-md text-[11px] font-mono cursor-pointer ${
                  exportScope === 'filtered'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Filtered ({filteredChannels.length})
              </button>
            </div>
          )}
        </div>

        {/* Content Viewer */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'share' ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Share2 className="w-5 h-5" />
                  <h4 className="text-sm font-semibold text-white">Permanent Shareable Link</h4>
                </div>
                <p className="text-xs text-slate-400">
                  {playlist.slug
                    ? `This playlist is published at /playlist/${playlist.slug}. Recipients can view and stream it immediately.`
                    : 'This URL embeds your playlist channel snapshot in the hash parameter for instant sharing.'}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getShareableUrl()}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 select-all"
                  />
                  <button
                    onClick={() => handleCopy(getShareableUrl(), 'share-url')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedFormat === 'share-url' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  {activeTab === 'standalone'
                    ? 'Self-contained single-file HTML version'
                    : `Previewing ${channelsToUse.length} channels (${activeTab.toUpperCase()})`}
                </span>
                <span className="font-mono text-[11px]">
                  {Math.round(currentContent.length / 1024)} KB
                </span>
              </div>
              <textarea
                readOnly
                value={currentContent}
                rows={12}
                className="w-full px-4 py-3 bg-slate-950/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none select-all"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>

          {activeTab !== 'share' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(currentContent, activeTab)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedFormat === activeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const baseName = playlist.slug || playlist.title || 'playlist';
                  if (activeTab === 'm3u') {
                    handleDownload(`${baseName}_clean.m3u8`, currentContent, 'audio/x-mpegurl');
                  } else if (activeTab === 'txt') {
                    handleDownload(`${baseName}_urls.txt`, currentContent, 'text/plain');
                  } else if (activeTab === 'json') {
                    handleDownload(`${baseName}.json`, currentContent, 'application/json');
                  } else if (activeTab === 'csv') {
                    handleDownload(`${baseName}.csv`, currentContent, 'text/csv');
                  } else if (activeTab === 'xtream') {
                    handleDownload(`xtream_${baseName}.json`, currentContent, 'application/json');
                  } else if (activeTab === 'standalone') {
                    handleDownload(`m3u-converter.html`, currentContent, 'text/html');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  Download{' '}
                  {activeTab === 'm3u'
                    ? '.m3u8'
                    : activeTab === 'txt'
                    ? '.txt'
                    : activeTab === 'json' || activeTab === 'xtream'
                    ? '.json'
                    : activeTab === 'csv'
                    ? '.csv'
                    : '.html'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
