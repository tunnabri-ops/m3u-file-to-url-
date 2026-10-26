import React, { useState } from 'react';
import { X, Copy, Check, FileCode, HardDrive, Download, Layers, ShieldCheck, Sparkles } from 'lucide-react';

interface NextjsArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NEXTJS_CLIENT_FILES = [
  {
    id: 'next-config',
    name: 'next.config.ts (Static Export)',
    language: 'typescript',
    icon: FileCode,
    description: '100% Static HTML/JS Client Export: Deploy anywhere (Vercel, Cloudflare, Netlify, GitHub Pages)',
    content: `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Configured for 100% client-side static export
  // Zero backend servers, zero databases, and zero API costs
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
`,
  },
  {
    id: 'app-page',
    name: 'app/page.tsx (Client Dashboard)',
    language: 'typescript',
    icon: FileCode,
    description: 'Client-side entry point with in-browser M3U conversion, custom naming, and live player',
    content: `'use client';

import React, { useState, useEffect } from 'react';
import { HardDrive, Download, Search, Play, Trash2, Edit3, Share2 } from 'lucide-react';
import { parseM3UClient, downloadCustomM3U } from '@/utils/m3uConverter';
import { saveLocalPlaylist, getLocalPlaylists, generateShareableUrl } from '@/utils/localPlaylists';

export default function M3UConverterPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [customSlug, setCustomSlug] = useState('my-sports-list');
  const [customTitle, setCustomTitle] = useState('My Custom Sports Playlist');
  const [search, setSearch] = useState('');
  const [savedLists, setSavedLists] = useState<any[]>([]);

  useEffect(() => {
    setSavedLists(getLocalPlaylists());
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseM3UClient(text);
    setChannels(parsed);
  };

  const handleSaveToBrowser = () => {
    const saved = saveLocalPlaylist({
      slug: customSlug,
      title: customTitle,
      channels,
    });
    setSavedLists(getLocalPlaylists());
    alert(\`Saved "\${saved.title}" to browser storage!\`);
  };

  const handleDownload = () => {
    downloadCustomM3U(channels, \`\${customSlug}.m3u8\`, customTitle);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 max-w-7xl mx-auto space-y-6">
      {/* 100% Client-Side Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-cyan-400">M3U FILE PRO</h1>
          <p className="text-xs text-slate-400">100% Client-Side IPTV Customizer & Downloader</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveToBrowser}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs"
          >
            Save in Browser
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs"
          >
            Download {customSlug}.m3u8
          </button>
        </div>
      </header>

      {/* Upload & Custom Naming */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="file"
          accept=".m3u,.m3u8"
          onChange={handleFileUpload}
          className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300"
        />
        <input
          type="text"
          value={customSlug}
          onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/\\s+/g, '-'))}
          placeholder="custom-slug-name"
          className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-cyan-300 font-mono"
        />
      </div>

      {/* Channel Count & List */}
      <div className="text-xs text-slate-400">
        Ready to export: {channels.length} channels
      </div>
    </main>
  );
}
`,
  },
  {
    id: 'utils-m3u',
    name: 'src/utils/m3uConverter.ts',
    language: 'typescript',
    icon: Download,
    description: 'In-browser M3U parsing and Blob download generator with zero server latency',
    content: `export interface ClientChannel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group?: string;
  tvgId?: string;
}

/**
 * Fast client-side M3U manifest parser
 */
export function parseM3UClient(content: string): ClientChannel[] {
  const lines = content.split(/\\r?\\n/);
  const channels: ClientChannel[] = [];
  let current: Partial<ClientChannel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const tvgNameMatch = line.match(/tvg-name="([^"]+)"/i);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]+)"/i);
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      const tvgIdMatch = line.match(/tvg-id="([^"]+)"/i);

      const commaIndex = line.lastIndexOf(',');
      const rawName = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Channel';

      current = {
        id: \`ch-\${channels.length + 1}\`,
        name: tvgNameMatch?.[1] || rawName,
        logo: tvgLogoMatch?.[1] || '',
        group: groupMatch?.[1] || 'General',
        tvgId: tvgIdMatch?.[1] || '',
      };
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (current) {
        channels.push({
          id: current.id || \`ch-\${channels.length + 1}\`,
          name: current.name || 'Channel',
          url: line,
          logo: current.logo,
          group: current.group || 'General',
          tvgId: current.tvgId,
        });
        current = null;
      }
    }
  }

  return channels;
}

/**
 * Triggers 100% browser-side file download with custom filename
 */
export function downloadCustomM3U(channels: ClientChannel[], filename: string, title?: string): void {
  let body = '#EXTM3U\\n';
  if (title) body += \`## \${title}\\n\`;

  for (const c of channels) {
    const logoAttr = c.logo ? \` tvg-logo="\${c.logo}"\` : '';
    const groupAttr = c.group ? \` group-title="\${c.group}"\` : '';
    const idAttr = c.tvgId ? \` tvg-id="\${c.tvgId}"\` : '';
    body += \`#EXTINF:-1\${idAttr}\${logoAttr}\${groupAttr},\${c.name}\\n\${c.url}\\n\`;
  }

  const blob = new Blob([body], { type: 'audio/x-mpegurl;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename.endsWith('.m3u8') ? filename : \`\${filename}.m3u8\`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
}
`,
  },
  {
    id: 'utils-storage',
    name: 'src/utils/localPlaylists.ts',
    language: 'typescript',
    icon: HardDrive,
    description: 'Browser localStorage persistence & hash URL sharing with zero database/backend setup',
    content: `const KEY = 'm3u_file_playlists';

export function getLocalPlaylists(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalPlaylist(item: { slug: string; title: string; channels: any[] }): any {
  const current = getLocalPlaylists();
  const cleanSlug = item.slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const record = {
    ...item,
    slug: cleanSlug,
    updatedAt: new Date().toISOString(),
  };

  const filtered = current.filter((p) => p.slug !== cleanSlug);
  const updated = [record, ...filtered];
  localStorage.setItem(KEY, JSON.stringify(updated));
  return record;
}

/**
 * Creates a 100% client-side shareable URL containing compact channel data in the URL hash
 */
export function generateShareableUrl(channels: any[], slug: string): string {
  if (typeof window === 'undefined') return '';
  const compact = channels.slice(0, 300).map((c) => ({
    n: c.name,
    u: c.url,
    g: c.group,
    l: c.logo,
  }));
  const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
  return \`\${window.location.origin}\${window.location.pathname}#playlist=\${base64}\`;
}
`,
  },
  {
    id: 'package-json',
    name: 'package.json (Zero Backend Dependencies)',
    language: 'json',
    icon: FileCode,
    description: 'Minimal client-side dependencies: React 19, Lucide, Tailwind, and HLS.js',
    content: `{
  "name": "m3u-file-client",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "hls.js": "^1.6.15",
    "lucide-react": "^0.546.0",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0"
  }
}
`,
  },
];

export const NextjsArchitectureModal: React.FC<NextjsArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFileId, setSelectedFileId] = useState(NEXTJS_CLIENT_FILES[0].id);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentFile = NEXTJS_CLIENT_FILES.find((f) => f.id === selectedFileId) || NEXTJS_CLIENT_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl glass-panel-glow rounded-2xl overflow-hidden border border-violet-500/30 shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>100% Client-Side Next.js Architecture</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  No Database · No SQL · No .env.local
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pure in-browser conversion, client-side Blob downloads, and localStorage persistence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Column Explorer Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Tree Sidebar */}
          <div className="w-full md:w-64 border-r border-slate-800 bg-slate-950/60 p-3 space-y-1 overflow-y-auto">
            <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
              Client Architecture Files
            </div>
            {NEXTJS_CLIENT_FILES.map((file) => {
              const Icon = file.icon;
              const isSelected = file.id === selectedFileId;
              return (
                <button
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-600/25 text-cyan-300 border border-cyan-500/40 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950/90 overflow-hidden">
            {/* File meta row */}
            <div className="px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40 text-xs">
              <div>
                <span className="font-mono text-cyan-300 font-medium">{currentFile.name}</span>
                <span className="text-slate-500 text-[11px] ml-2 hidden sm:inline">
                  — {currentFile.description}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy File'}</span>
              </button>
            </div>

            {/* Code Pre Tag */}
            <div className="flex-1 p-4 overflow-auto">
              <pre className="text-xs font-mono text-slate-200 leading-relaxed selection:bg-cyan-500/30">
                <code>{currentFile.content}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zero server overhead · 100% browser-driven execution</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
