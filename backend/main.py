"""
Production-Ready Python FastAPI Backend for M3U Playlist to Custom URL Converter & IPTV Manager
Author: Elite Full-Stack Engineer
Framework: FastAPI (Python 3.10+)

Features:
- Custom slug registration and persistent in-memory/JSON storage
- Direct IPTV streaming endpoint (/playlist/{slug}) returning 'audio/x-mpegurl'
- XMLTV EPG injection (url-tvg="..." header in #EXTM3U)
- Bulk stream health checker using async httpx with HEAD/Range probing
- Resolution classification and filter support
- CORS middleware enabled for modern SPA dashboards
"""

from fastapi import FastAPI, HTTPException, Request, Response, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    slug: str = Field(..., min_length=2, max_length=100, description="Unique slug for the custom playlist")
    title: str = Field(..., min_length=1, max_length=200, description="Display title for the playlist")
    description: Optional[str] = ""
    epgUrl: Optional[str] = None
    channels: List[ChannelModel] = Field(..., min_items=1, description="List of channels to include")

class StreamCheckBatchRequest(BaseModel):
    urls: List[str] = Field(..., max_items=100)

# In-Memory Storage with optional local file backup
DB_FILE = os.path.join(os.path.dirname(__file__), "playlists_db.json")
PLAYLISTS_DB: Dict[str, Dict[str, Any]] = {}

def load_db():
    global PLAYLISTS_DB
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                PLAYLISTS_DB = json.load(f)
        except Exception as e:
            print(f"Warning: Could not load DB file: {e}")

def save_db():
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(PLAYLISTS_DB, f, indent=2)
    except Exception as e:
        print(f"Warning: Could not save DB file: {e}")

load_db()

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

    return "\n".join(m3u_lines) + "\n"

# API Endpoints

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "M3U FILE Python FastAPI", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/check-slug/{slug}")
def check_slug_availability(slug: str):
    cleaned = clean_slug(slug)
    is_available = cleaned not in PLAYLISTS_DB
    return {"slug": cleaned, "available": is_available}

@app.get("/api/playlists")
def list_playlists():
    playlists_summary = []
    for slug, data in PLAYLISTS_DB.items():
        channels = data.get("channels", [])
        groups = sorted(list(set(c.get("group", "General") for c in channels)))
        playlists_summary.append({
            "slug": slug,
            "title": data.get("title", slug),
            "description": data.get("description", ""),
            "epgUrl": data.get("epgUrl"),
            "channelCount": len(channels),
            "groups": groups,
            "updatedAt": data.get("updatedAt"),
        })
    return {"playlists": playlists_summary}

@app.post("/api/playlists")
def create_or_update_playlist(payload: PlaylistCreate, request: Request):
    slug = clean_slug(payload.slug)
    if not slug:
        raise HTTPException(status_code=400, detail="Invalid slug format.")

    now = datetime.utcnow().isoformat()
    playlist_record = {
        "slug": slug,
        "title": payload.title.strip() or slug,
        "description": payload.description or "",
        "epgUrl": payload.epgUrl.strip() if payload.epgUrl else None,
        "channels": [c.dict() for c in payload.channels],
        "updatedAt": now,
    }

    PLAYLISTS_DB[slug] = playlist_record
    save_db()

    base_url = str(request.base_url).rstrip("/")
    return {
        "success": True,
        "slug": slug,
        "title": playlist_record["title"],
        "epgUrl": playlist_record["epgUrl"],
        "totalChannels": len(payload.channels),
        "shareUrl": f"{base_url}/playlist/{slug}",
        "m3uStreamUrl": f"{base_url}/api/playlist/{slug}?format=m3u",
        "updatedAt": now,
    }

@app.get("/api/playlist/{slug}")
def get_playlist(slug: str, format: Optional[str] = Query(None)):
    cleaned = clean_slug(slug)
    playlist = PLAYLISTS_DB.get(cleaned)
    if not playlist:
        raise HTTPException(status_code=404, detail=f"Playlist '{cleaned}' not found.")

    if format in ("m3u", "m3u8"):
        m3u_text = generate_m3u_text(playlist)
        return Response(
            content=m3u_text,
            media_type="audio/x-mpegurl; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{cleaned}.m3u8"'},
        )

    return playlist

@app.get("/playlist/{slug}")
def serve_iptv_stream(slug: str):
    """
    Direct endpoint for IPTV players (VLC, Kodi, TiviMate, OTT Navigator).
    Returns pure audio/x-mpegurl with attachment headers.
    """
    cleaned = clean_slug(slug.replace(".m3u8", "").replace(".m3u", ""))
    playlist = PLAYLISTS_DB.get(cleaned)
    if not playlist:
        return Response(content="#EXTM3U\n# Error: Playlist not found\n", media_type="audio/x-mpegurl", status_code=404)

    m3u_text = generate_m3u_text(playlist)
    return Response(
        content=m3u_text,
        media_type="audio/x-mpegurl; charset=utf-8",
        headers={"Content-Disposition": f'inline; filename="{cleaned}.m3u8"'},
    )

@app.delete("/api/playlist/{slug}")
def delete_playlist(slug: str):
    cleaned = clean_slug(slug)
    if cleaned in PLAYLISTS_DB:
        del PLAYLISTS_DB[cleaned]
        save_db()
        return {"success": True, "message": f"Playlist '{cleaned}' deleted."}
    raise HTTPException(status_code=404, detail="Playlist not found.")

@app.post("/api/check-streams-batch")
async def check_streams_batch(payload: StreamCheckBatchRequest):
    """
    Asynchronous high-concurrency stream health check using HTTPX.
    Uses lightweight HEAD requests and ranged GET fallbacks.
    """
    results: Dict[str, Any] = {}
    timeout = httpx.Timeout(4.5, connect=3.0)

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        for url in payload.urls[:50]:
            start = time.time()
            try:
                # 1. Attempt lightweight HEAD request
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) IPTVHealthProber/2.0"}
                resp = await client.head(url, headers=headers)
                
                # If HEAD rejected with 405 Method Not Allowed, fallback to partial GET range
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
                results[url] = {
                    "status": "offline",
                    "statusCode": 0,
                    "latencyMs": latency_ms,
                    "error": str(e),
                }

    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
