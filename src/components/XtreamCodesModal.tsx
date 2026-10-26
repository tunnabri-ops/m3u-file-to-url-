import React, { useState } from 'react';
import { X, Copy, Check, Download, Server, Key, User, Radio, FileCode, ExternalLink } from 'lucide-react';
import { Channel } from '../types/playlist';

interface XtreamCodesModalProps {
  channels: Channel[];
  slug?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const XtreamCodesModal: React.FC<XtreamCodesModalProps> = ({
  channels,
  slug = 'custom-list',
  isOpen,
  onClose,
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://stream-nexus.io';

  const [serverUrl, setServerUrl] = useState(origin);
  const [username, setUsername] = useState(`user_${slug.replace(/[^a-z0-9]/g, '') || 'vip'}`);
  const [password, setPassword] = useState('iptv2026pass');
  const [outputFormat, setOutputFormat] = useState<'m3u_plus' | 'ts' | 'm3u8'>('m3u_plus');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getXtreamM3uUrl = () => {
    return `${serverUrl}/api/playlist/${slug}?format=m3u&username=${username}&password=${password}&type=${outputFormat}`;
  };

  const getPlayerApiUrl = () => {
    return `${serverUrl}/api/playlist/${slug}?player_api=true&username=${username}&password=${password}`;
  };

  // Generate Xtream Codes formatted accounts file
  const generateXtreamConfig = () => {
    return JSON.stringify(
      {
        server_info: {
          server_url: serverUrl,
          port: '443',
          https_port: '443',
          server_protocol: 'https',
          rtmp_port: '8880',
          timezone: 'UTC',
          timestamp_now: Math.floor(Date.now() / 1000),
          time_now: new Date().toISOString(),
          process: true,
        },
        user_info: {
          username: username,
          password: password,
          message: 'Active Premium Subscription',
          auth: 1,
          status: 'Active',
          exp_date: '1893456000',
          is_trial: '0',
          active_cons: '1',
          created_at: Math.floor(Date.now() / 1000),
          max_connections: '5',
          allowed_output_formats: ['m3u8', 'ts', 'rtmp'],
        },
        categories: Array.from(new Set(channels.map((c) => c.group || 'General'))).map((g, idx) => ({
          category_id: `${idx + 1}`,
          category_name: g,
          parent_id: 0,
        })),
        channels: channels.map((c, idx) => ({
          num: idx + 1,
          name: c.name,
          stream_type: 'live',
          stream_id: idx + 1001,
          stream_icon: c.logo,
          epg_channel_id: c.tvgId,
          added: Math.floor(Date.now() / 1000),
          category_name: c.group,
          direct_source: c.url,
        })),
      },
      null,
      2
    );
  };

  const handleDownloadXtreamJson = () => {
    const content = generateXtreamConfig();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xtream_${slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl glass-panel-glow rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">
              Xtream Codes IPTV Converter & Credentials
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure and export Xtream Codes credentials compatible with IPTV Smarters, TiviMate, Formuler, XCIPTV, and smart TV apps.
          </p>

          {/* Credentials Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Server className="w-3 h-3 text-cyan-400" />
                <span>Portal / Server URL</span>
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Radio className="w-3 h-3 text-indigo-400" />
                <span>Stream Output Encapsulation</span>
              </label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="m3u_plus">M3U Plus (HLS / m3u8)</option>
                <option value="ts">MPEG-TS (.ts direct)</option>
                <option value="m3u8">Raw HLS Manifest (.m3u8)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-sky-400" />
                <span>Xtream Username</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Key className="w-3 h-3 text-purple-400" />
                <span>Xtream Password</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Quick Copy Credential Cards */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Generated Xtream Codes Endpoints
            </h4>

            {/* 1. M3U Plus URL */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-cyan-300">Xtream M3U_PLUS Link</span>
                <button
                  onClick={() => handleCopy(getXtreamM3uUrl(), 'm3u-plus')}
                  className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {copiedKey === 'm3u-plus' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'm3u-plus' ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-300 truncate select-all">
                {getXtreamM3uUrl()}
              </div>
            </div>

            {/* 2. Player API Endpoint */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-indigo-300">Xtream Player API Endpoint (JSON)</span>
                <button
                  onClick={() => handleCopy(getPlayerApiUrl(), 'player-api')}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  {copiedKey === 'player-api' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'player-api' ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-300 truncate select-all">
                {getPlayerApiUrl()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={handleDownloadXtreamJson}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Xtream Config (.json)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
