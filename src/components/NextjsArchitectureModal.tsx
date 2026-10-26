import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Database, Server, Code, Download, Layers } from 'lucide-react';

interface NextjsArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NEXTJS_FILES = [
  {
    id: 'schema-sql',
    name: 'schema.sql (Supabase Schema)',
    language: 'sql',
    icon: Database,
    description: 'PostgreSQL database table, indexes, and Row Level Security for Supabase',
    content: `-- Supabase Database Schema for M3U Custom Slugs & IPTV Playlists
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    channels JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for instant custom slug lookups (O(1))
CREATE INDEX IF NOT EXISTS idx_playlists_slug ON public.playlists (slug);

-- Enable Row Level Security (RLS)
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Allow public read access to playlists
CREATE POLICY "Public read playlists"
    ON public.playlists
    FOR SELECT
    USING (is_public = true);

-- Allow public playlist creation (or restrict to auth.uid())
CREATE POLICY "Public create/update playlists"
    ON public.playlists
    FOR ALL
    USING (true)
    WITH CHECK (true);
`,
  },
  {
    id: 'lib-supabase',
    name: 'src/lib/supabase.ts',
    language: 'typescript',
    icon: Server,
    description: 'Supabase client initialization and type definitions',
    content: `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DbPlaylist {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  channels: any[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
`,
  },
  {
    id: 'api-slug-route',
    name: 'app/api/playlist/[slug]/route.ts',
    language: 'typescript',
    icon: FileCode,
    description: 'Next.js App Router dynamic endpoint: streams raw M3U8 or returns JSON',
    content: `import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format');
  const accept = request.headers.get('accept') || '';

  // Query Supabase by custom slug
  const { data: playlist, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('slug', slug.toLowerCase())
    .single();

  if (error || !playlist) {
    return NextResponse.json(
      { error: \`Playlist with slug '\${slug}' not found\` },
      { status: 404 }
    );
  }

  // If client requested raw M3U (VLC, Kodi, TiviMate, OTT Navigator)
  if (format === 'm3u' || format === 'm3u8' || accept.includes('mpegurl')) {
    let m3uBody = '#EXTM3U\\n';
    (playlist.channels || []).forEach((c: any) => {
      const logoAttr = c.logo ? \` tvg-logo="\${c.logo}"\` : '';
      const groupAttr = c.group ? \` group-title="\${c.group}"\` : '';
      const idAttr = c.tvgId ? \` tvg-id="\${c.tvgId}"\` : '';
      m3uBody += \`#EXTINF:-1\${idAttr}\${logoAttr}\${groupAttr},\${c.name}\\n\${c.url}\\n\`;
    });

    return new Response(m3uBody, {
      status: 200,
      headers: {
        'Content-Type': 'audio/x-mpegurl; charset=utf-8',
        'Content-Disposition': \`attachment; filename="\${slug}.m3u8"\`,
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  }

  // Return standard JSON response
  return NextResponse.json({
    slug: playlist.slug,
    title: playlist.title,
    description: playlist.description,
    totalChannels: (playlist.channels || []).length,
    channels: playlist.channels || [],
    updatedAt: playlist.updated_at,
  });
}
`,
  },
  {
    id: 'api-playlists-route',
    name: 'app/api/playlists/route.ts',
    language: 'typescript',
    icon: FileCode,
    description: 'Next.js App Router POST/GET endpoint for custom slug registration',
    content: `import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, title, description, channels } = body;

    if (!slug || !channels || !Array.isArray(channels)) {
      return NextResponse.json(
        { error: 'Slug and channels array are required' },
        { status: 400 }
      );
    }

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');

    // Upsert playlist in Supabase
    const { data, error } = await supabase
      .from('playlists')
      .upsert(
        {
          slug: cleanSlug,
          title: title || cleanSlug,
          description: description || '',
          channels,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const origin = request.nextUrl.origin;
    return NextResponse.json({
      success: true,
      slug: cleanSlug,
      shareUrl: \`\${origin}/playlist/\${cleanSlug}\`,
      m3uStreamUrl: \`\${origin}/api/playlist/\${cleanSlug}?format=m3u\`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
`,
  },
  {
    id: 'app-slug-page',
    name: 'app/playlist/[slug]/page.tsx',
    language: 'typescript',
    icon: Code,
    description: 'Next.js App Router SSR/Client page for viewing & playing the custom playlist',
    content: `'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PlaylistViewerPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(\`/api/playlist/\${slug}\`)
      .then((res) => res.json())
      .then((data) => {
        setPlaylist(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-12 text-center text-slate-400">Loading custom playlist /{slug}...</div>;
  if (!playlist || playlist.error) return <div className="p-12 text-center text-rose-400">Playlist /{slug} not found.</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{playlist.title}</h1>
          <p className="text-xs text-slate-400">/{playlist.slug} · {playlist.totalChannels} channels</p>
        </div>
        <a
          href={\`/api/playlist/\${playlist.slug}?format=m3u\`}
          className="px-4 py-2 bg-cyan-500 text-slate-950 font-semibold rounded-lg text-xs"
        >
          Download M3U
        </a>
      </div>
      {/* Renders ChannelList & HLS Player */}
    </div>
  );
}
`,
  },
];

export const NextjsArchitectureModal: React.FC<NextjsArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFileId, setSelectedFileId] = useState(NEXTJS_FILES[0].id);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentFile = NEXTJS_FILES.find((f) => f.id === selectedFileId) || NEXTJS_FILES[0];

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
            <Layers className="w-4 h-4 text-violet-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">
                Next.js (App Router) & Supabase Architecture Guide
              </h3>
              <p className="text-[11px] text-slate-400">
                Complete production code for deployment on Vercel & Supabase
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
              Project Files
            </div>
            {NEXTJS_FILES.map((file) => {
              const Icon = file.icon;
              const isSelected = file.id === selectedFileId;
              return (
                <button
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-violet-600/25 text-violet-300 border border-violet-500/40 font-medium'
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
              <pre className="text-xs font-mono text-slate-200 leading-relaxed selection:bg-violet-500/30">
                <code>{currentFile.content}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span>Both live in this applet via Express & ready for Next.js App Router export</span>
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
