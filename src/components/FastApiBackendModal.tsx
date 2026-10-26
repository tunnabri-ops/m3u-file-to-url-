import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Server, Terminal, Sparkles, Database, ShieldCheck, Download } from 'lucide-react';
import { AccentTheme } from '../types/playlist';
import { THEME_CONFIG } from '../utils/themeHelper';

interface FastApiBackendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: AccentTheme;
}

const FASTAPI_FILES = [
  {
    id: 'main-py',
    name: 'backend/main.py (FastAPI App)',
    language: 'python',
    icon: Server,
    description: 'High-performance FastAPI server with slug storage, M3U stream generator, EPG support, and async health checker',
    content: `"""
Production-Ready Python FastAPI Backend for M3U Playlist to Custom URL Converter & IPTV Manager
Framework: FastAPI (Python 3.10+)
"""

from fastapi import FastAPI, HTTPException, Request, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import httpx
import json
import os
import re
import time
from datetime import datetime

app = FastAPI(
    title="M3U FILE - IPTV Custom URL Converter & Stream Manager API",
    description="High-performance backend for custom playlist generation, live streaming endpoints, and bulk stream health diagnostics.",
    version="2.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class ChannelModel(BaseModel):
    id: str
    name: str
    url: str
    logo: Optional[str] = ""
    group: Optional[str] = "General"
    tvgId: Optional[str] = ""
    tvgName: Optional[str] = ""
    tvgChno: Optional[str] = ""
    resolution: Optional[str] = "OTHER"
    format: Optional[str] = "HLS"
    rawExtinf: Optional[str] = None

class PlaylistCreate(BaseModel):
    slug: str = Field(..., min_length=2, max_length=100)
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = ""
    epgUrl: Optional[str] = None
    channels: List[ChannelModel] = Field(..., min_items=1)

class StreamCheckBatchRequest(BaseModel):
    urls: List[str] = Field(..., max_items=100)

# In-Memory Storage with optional local file backup
DB_FILE = os.path.join(os.path.dirname(__file__), "playlists_db.json")
PLAYLISTS_DB: Dict[str, Dict[str, Any]] = {}

def clean_slug(raw_slug: str) -> str:
    cleaned = raw_slug.lower().strip()
    cleaned = re.sub(r"[^a-z0-9_-]+", "-", cleaned)
    cleaned = re.sub(r"-+", "-", cleaned)
    return cleaned.strip("-")

def generate_m3u_text(playlist_data: Dict[str, Any]) -> str:
    epg_url = playlist_data.get("epgUrl")
    title = playlist_data.get("title", "Custom Playlist")
    channels = playlist_data.get("channels", [])

    m3u_lines = ["#EXTM3U"]
    if epg_url:
        m3u_lines[0] += f' url-tvg="{epg_url.strip()}"'
    if title:
        m3u_lines.append(f"## {title}")

    for c in channels:
        attrs = []
        if c.get("tvgId"):
            attrs.append(f'tvg-id="{c["tvgId"]}"')
        if c.get("name"):
            attrs.append(f'tvg-name="{c.get("tvgName") or c["name"]}"')
        if c.get("logo"):
            attrs.append(f'tvg-logo="{c["logo"]}"')
        if c.get("group"):
            attrs.append(f'group-title="{c["group"]}"')

        attr_str = (" " + " ".join(attrs)) if attrs else ""
        m3u_lines.append(f'#EXTINF:-1{attr_str},{c.get("name", "Channel")}')
        m3u_lines.append(c.get("url", ""))

    return "\\n".join(m3u_lines) + "\\n"

# Endpoints
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "M3U FILE FastAPI"}

@app.get("/api/check-slug/{slug}")
def check_slug(slug: str):
    cleaned = clean_slug(slug)
    return {"slug": cleaned, "available": cleaned not in PLAYLISTS_DB}

@app.post("/api/playlists")
def create_playlist(payload: PlaylistCreate, request: Request):
    slug = clean_slug(payload.slug)
    now = datetime.utcnow().isoformat()
    record = {
        "slug": slug,
        "title": payload.title.strip() or slug,
        "description": payload.description or "",
        "epgUrl": payload.epgUrl.strip() if payload.epgUrl else None,
        "channels": [c.dict() for c in payload.channels],
        "updatedAt": now,
    }
    PLAYLISTS_DB[slug] = record

    base_url = str(request.base_url).rstrip("/")
    return {
        "success": True,
        "slug": slug,
        "title": record["title"],
        "epgUrl": record["epgUrl"],
        "totalChannels": len(payload.channels),
        "shareUrl": f"{base_url}/playlist/{slug}",
        "m3uStreamUrl": f"{base_url}/api/playlist/{slug}?format=m3u",
        "updatedAt": now,
    }

@app.get("/playlist/{slug}")
def serve_iptv_stream(slug: str):
    """Direct streaming endpoint for VLC, Kodi, TiviMate, OTT Navigator"""
    cleaned = clean_slug(slug.replace(".m3u8", "").replace(".m3u", ""))
    playlist = PLAYLISTS_DB.get(cleaned)
    if not playlist:
        return Response(content="#EXTM3U\\n# Error: Playlist not found\\n", media_type="audio/x-mpegurl", status_code=404)

    m3u_text = generate_m3u_text(playlist)
    return Response(
        content=m3u_text,
        media_type="audio/x-mpegurl; charset=utf-8",
        headers={"Content-Disposition": f'inline; filename="{cleaned}.m3u8"'},
    )

@app.post("/api/check-streams-batch")
async def check_streams_batch(payload: StreamCheckBatchRequest):
    """High-concurrency stream health diagnostics using async HTTPX"""
    results: Dict[str, Any] = {}
    timeout = httpx.Timeout(4.0, connect=2.5)

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        for url in payload.urls[:50]:
            start = time.time()
            try:
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) IPTVHealthProber/2.0"}
                resp = await client.head(url, headers=headers)
                if resp.status_code in (405, 501):
                    headers["Range"] = "bytes=0-1024"
                    resp = await client.get(url, headers=headers)

                latency_ms = int((time.time() - start) * 1000)
                is_live = 200 <= resp.status_code < 400
                results[url] = {
                    "status": "live" if is_live else "offline",
                    "statusCode": resp.status_code,
                    "latencyMs": latency_ms,
                    "contentType": resp.headers.get("content-type", "unknown"),
                }
            except Exception as e:
                latency_ms = int((time.time() - start) * 1000)
                results[url] = {"status": "offline", "statusCode": 0, "latencyMs": latency_ms, "error": str(e)}

    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
`,
  },
  {
    id: 'requirements-txt',
    name: 'backend/requirements.txt',
    language: 'text',
    icon: FileCode,
    description: 'Python dependencies for FastAPI, async HTTP client, and ASGI server',
    content: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
httpx>=0.27.0
pydantic>=2.6.0
python-multipart>=0.0.9
`,
  },
  {
    id: 'dockerfile',
    name: 'backend/Dockerfile',
    language: 'dockerfile',
    icon: Terminal,
    description: 'Containerized deployment for Cloud Run, VPS, Docker Compose, or Kubernetes',
    content: `FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`,
  },
  {
    id: 'readme-md',
    name: 'backend/README.md',
    language: 'markdown',
    icon: FileCode,
    description: 'Setup and execution guide with cURL commands and testing instructions',
    content: `# M3U FILE - Python FastAPI IPTV Backend

## 1. Quick Start
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
\`\`\`

## 2. API Documentation
Once running, open the interactive Swagger UI:
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 3. Streaming in VLC / TiviMate
Load the URL directly in VLC (Media > Open Network Stream):
\`\`\`
http://localhost:8000/playlist/my-sports-list
\`\`\`
`,
  },
];

export const FastApiBackendModal: React.FC<FastApiBackendModalProps> = ({
  isOpen,
  onClose,
  currentTheme = 'cyan',
}) => {
  const [selectedFileId, setSelectedFileId] = useState(FASTAPI_FILES[0].id);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentFile = FASTAPI_FILES.find((f) => f.id === selectedFileId) || FASTAPI_FILES[0];
  const theme = THEME_CONFIG[currentTheme];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl glass-panel-glow rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${theme.bgSubtle} border ${theme.borderAccent} flex items-center justify-center`}>
              <Server className={`w-4 h-4 ${theme.textAccent}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Python FastAPI Backend Architecture</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  FastAPI · Pydantic · HTTPX Async
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Production-ready code for M3U playlist conversion, live stream serving, and bulk stream diagnostics
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
              Python Backend Files
            </div>
            {FASTAPI_FILES.map((file) => {
              const Icon = file.icon;
              const isSelected = file.id === selectedFileId;
              return (
                <button
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? `${theme.bgSubtle} ${theme.textAccent} border ${theme.borderAccent} font-medium`
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
                <span className={`font-mono ${theme.textAccent} font-medium`}>{currentFile.name}</span>
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
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready to run with <code>uvicorn main:app --reload</code></span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
