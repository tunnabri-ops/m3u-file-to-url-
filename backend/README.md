# M3U FILE - Python FastAPI IPTV Backend

Production-ready backend for custom M3U playlist conversion, persistent slug generation, stream health diagnostics, and raw IPTV streaming endpoints (`audio/x-mpegurl`).

## Requirements
- Python 3.10+
- `pip install -r requirements.txt`

## Running the Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints
- `POST /api/playlists`: Save playlist with custom slug, title, epgUrl, and channels
- `GET /playlist/{slug}`: Serve raw M3U stream endpoint for VLC, Kodi, TiviMate, OTT Navigator
- `GET /api/playlist/{slug}`: Fetch playlist JSON or `?format=m3u`
- `GET /api/check-slug/{slug}`: Check if custom slug is available
- `POST /api/check-streams-batch`: Concurrent async stream health prober
