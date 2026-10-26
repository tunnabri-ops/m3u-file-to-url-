export function generateSingleFileHtml(): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>M3U File to URL Converter & Health Prober</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    h1, h2, h3, h4, .font-display { font-family: 'Outfit', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .glass-panel {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .glass-card {
      background: rgba(30, 41, 59, 0.45);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.07);
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
  <header class="border-b border-slate-800/80 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-xl">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-8">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 font-bold text-white">
          ⚡
        </div>
        <span class="font-display text-lg font-semibold tracking-tight text-white">M3U Stream Nexus</span>
      </div>
      <div class="flex items-center gap-2">
        <button id="checkAllTopBtn" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors">
          Check All Statuses
        </button>
        <button id="copyAllTopBtn" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors">
          Copy All URLs
        </button>
        <button id="downloadM3uBtn" class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 transition-all">
          Download Playlist
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-8 space-y-8">
    <div class="text-center max-w-3xl mx-auto">
      <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
        Convert & Verify <span class="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">M3U Playlists</span>
      </h1>
      <p class="text-xs sm:text-sm text-slate-400">
        Drop your .m3u files, run lightweight HEAD/Range requests for Live/Offline badges, and extract clean stream endpoints.
      </p>
    </div>

    <!-- Drag & Drop Zone -->
    <div class="glass-panel rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto text-center border-2 border-dashed border-slate-700 hover:border-cyan-500/60 transition-all cursor-pointer" id="dropZone">
      <input type="file" id="fileInput" accept=".m3u,.m3u8,.txt" class="hidden" />
      <div class="w-12 h-12 mx-auto mb-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl font-bold">
        📥
      </div>
      <h3 class="text-base font-semibold text-white mb-1">Drop your .m3u or .m3u8 file here</h3>
      <p class="text-xs text-slate-400 mb-4">Or click to select a file from your computer</p>
      <div class="flex flex-wrap justify-center gap-3">
        <button type="button" class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700" onclick="document.getElementById('fileInput').click()">
          Browse Files
        </button>
        <button type="button" id="loadSampleBtn" class="px-4 py-2 text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg border border-indigo-500/30">
          Load Sample Streams
        </button>
      </div>
    </div>

    <!-- Controls & Stats Bar -->
    <div id="controlsSection" class="space-y-4 hidden">
      <div class="glass-panel rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div class="flex flex-wrap items-center gap-3 text-slate-400">
          <div><strong id="statTotal" class="text-white font-mono text-sm tabular-nums">0</strong> channels</div>
          <div>·</div>
          <div><strong id="statCategories" class="text-white font-mono tabular-nums">0</strong> categories</div>
          <div>·</div>
          <div class="text-emerald-400 font-mono"><strong id="statLive" class="tabular-nums font-semibold">0</strong> Live</div>
          <div>·</div>
          <div class="text-rose-400 font-mono"><strong id="statOffline" class="tabular-nums font-semibold">0</strong> Offline</div>
        </div>
        <div class="flex items-center gap-2">
          <input type="text" id="searchInput" placeholder="Search channels or URLs..." class="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500" />
          <select id="groupSelect" class="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none">
            <option value="ALL">All Categories</option>
          </select>
          <select id="statusFilterSelect" class="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none">
            <option value="ALL">All Statuses</option>
            <option value="LIVE">Live Only</option>
            <option value="OFFLINE">Offline Only</option>
          </select>
        </div>
      </div>

      <!-- Channel Table -->
      <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th class="py-3 px-4 w-12 text-center">#</th>
                <th class="py-3 px-4">Channel</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4 text-center">Health Status</th>
                <th class="py-3 px-4">Stream URL</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="channelTableBody" class="divide-y divide-slate-800/60 text-slate-300"></tbody>
          </table>
        </div>
      </div>
    </div>
  </main>

  <!-- Video Player Modal -->
  <div id="playerModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md hidden">
    <div class="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h4 id="playerTitle" class="text-sm font-semibold text-white truncate">Live Stream Preview</h4>
        <button id="closePlayerBtn" class="text-slate-400 hover:text-white text-lg font-bold">✕</button>
      </div>
      <div class="aspect-video bg-black flex items-center justify-center">
        <video id="videoElement" controls class="w-full h-full object-contain"></video>
      </div>
      <div class="p-3 bg-slate-950 text-xs font-mono text-slate-400 flex items-center justify-between">
        <span id="playerUrl" class="truncate max-w-md"></span>
        <button id="copyModalUrlBtn" class="text-cyan-400 hover:text-cyan-300">Copy URL</button>
      </div>
    </div>
  </div>

  <div id="toast" class="fixed bottom-6 right-6 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium transition-all duration-300 opacity-0 pointer-events-none translate-y-2">
    Copied to clipboard!
  </div>

  <script>
    let channels = [];
    let healthMap = {};
    let currentHls = null;

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
      setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
      }, 2500);
    }

    async function checkStreamStatus(url) {
      const start = Date.now();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      try {
        let res;
        try {
          res = await fetch(url, { method: 'HEAD', signal: ctrl.signal });
        } catch {
          res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-1024' }, signal: ctrl.signal });
        }
        clearTimeout(timer);
        const latency = Date.now() - start;
        return {
          status: res.status >= 200 && res.status < 400 ? 'live' : 'offline',
          statusCode: res.status,
          latencyMs: latency,
          contentType: res.headers.get('content-type') || 'stream'
        };
      } catch (e) {
        clearTimeout(timer);
        return {
          status: 'offline',
          statusCode: 0,
          latencyMs: Date.now() - start,
          error: e.name === 'AbortError' ? 'Timeout' : 'Unreachable'
        };
      }
    }

    async function probeChannel(url) {
      healthMap[url] = { status: 'checking' };
      renderChannels();
      const res = await checkStreamStatus(url);
      healthMap[url] = res;
      updateStats();
      renderChannels();
    }

    async function probeAllChannels() {
      showToast('Starting lightweight health probe on streams...');
      for (let i = 0; i < channels.length; i++) {
        healthMap[channels[i].url] = { status: 'checking' };
      }
      renderChannels();

      for (let i = 0; i < channels.length; i += 3) {
        const batch = channels.slice(i, i + 3);
        await Promise.all(batch.map(async (c) => {
          healthMap[c.url] = await checkStreamStatus(c.url);
        }));
        updateStats();
        renderChannels();
      }
      showToast('Completed stream health check!');
    }

    function parseM3U(text) {
      const lines = text.replace(/\\r\\n/g, '\\n').split('\\n');
      const list = [];
      let currentExtinf = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (line.startsWith('#EXTINF:')) {
          currentExtinf = line;
          continue;
        }
        if (line.startsWith('#')) continue;
        if (line.startsWith('http://') || line.startsWith('https://') || line.includes('://')) {
          let name = 'Channel ' + (list.length + 1);
          let logo = '';
          let group = 'General';

          if (currentExtinf) {
            const commaIdx = currentExtinf.lastIndexOf(',');
            if (commaIdx !== -1) name = currentExtinf.substring(commaIdx + 1).trim();
            const logoMatch = currentExtinf.match(/tvg-logo=["']?([^"'>\\s]+)["']?/i);
            if (logoMatch) logo = logoMatch[1];
            const groupMatch = currentExtinf.match(/group-title=["']?([^"'>\\s]+)["']?/i);
            if (groupMatch) group = groupMatch[1];
          }

          list.push({ id: 'ch-' + (list.length + 1), name, logo, group, url: line });
          currentExtinf = '';
        }
      }
      return list;
    }

    function renderChannels() {
      const q = document.getElementById('searchInput').value.toLowerCase();
      const groupFilter = document.getElementById('groupSelect').value;
      const statusFilter = document.getElementById('statusFilterSelect').value;
      const tbody = document.getElementById('channelTableBody');
      tbody.innerHTML = '';

      const filtered = channels.filter(ch => {
        const matchesQuery = ch.name.toLowerCase().includes(q) || ch.url.toLowerCase().includes(q);
        const matchesGroup = groupFilter === 'ALL' || ch.group === groupFilter;
        const h = healthMap[ch.url];
        let matchesStatus = true;
        if (statusFilter === 'LIVE') matchesStatus = h?.status === 'live';
        if (statusFilter === 'OFFLINE') matchesStatus = h?.status === 'offline';
        return matchesQuery && matchesGroup && matchesStatus;
      });

      filtered.forEach((ch, idx) => {
        const h = healthMap[ch.url];
        let badgeHtml = '<button onclick="probeChannel(\\'' + ch.url + '\\')" class="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300">Check</button>';
        if (h?.status === 'checking') {
          badgeHtml = '<span class="px-2 py-0.5 rounded text-[10px] bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-mono">Checking...</span>';
        } else if (h?.status === 'live') {
          badgeHtml = '<button onclick="probeChannel(\\'' + ch.url + '\\')" class="px-2 py-0.5 rounded text-[10px] bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono flex items-center gap-1 mx-auto"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Live ' + (h.latencyMs ? h.latencyMs + 'ms' : '') + '</button>';
        } else if (h?.status === 'offline') {
          badgeHtml = '<button onclick="probeChannel(\\'' + ch.url + '\\')" class="px-2 py-0.5 rounded text-[10px] bg-rose-950/40 border border-rose-500/40 text-rose-300 font-mono flex items-center gap-1 mx-auto"><span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Offline</button>';
        }

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/40 transition-colors';
        tr.innerHTML = \`
          <td class="py-3 px-4 text-center font-mono text-slate-500">\${idx + 1}</td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-2.5">
              \${ch.logo ? \`<img src="\${ch.logo}" class="w-6 h-6 object-contain rounded bg-slate-900" onerror="this.style.display='none'" />\` : ''}
              <span class="font-medium text-white truncate max-w-[180px]">\${ch.name}</span>
            </div>
          </td>
          <td class="py-3 px-4 text-slate-400">\${ch.group}</td>
          <td class="py-3 px-4 text-center">\${badgeHtml}</td>
          <td class="py-3 px-4 font-mono text-slate-400 max-w-xs truncate">\${ch.url}</td>
          <td class="py-3 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="playChannel('\${encodeURIComponent(JSON.stringify(ch))}')" class="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30">▶</button>
              <button onclick="copyText('\${ch.url}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">📋</button>
            </div>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function updateStats() {
      document.getElementById('statTotal').textContent = channels.length;
      const groups = Array.from(new Set(channels.map(c => c.group)));
      document.getElementById('statCategories').textContent = groups.length;

      let liveCount = 0;
      let offlineCount = 0;
      channels.forEach(c => {
        if (healthMap[c.url]?.status === 'live') liveCount++;
        if (healthMap[c.url]?.status === 'offline') offlineCount++;
      });
      document.getElementById('statLive').textContent = liveCount;
      document.getElementById('statOffline').textContent = offlineCount;

      const groupSelect = document.getElementById('groupSelect');
      groupSelect.innerHTML = '<option value="ALL">All Categories</option>';
      groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        groupSelect.appendChild(opt);
      });
    }

    function loadContent(text) {
      channels = parseM3U(text);
      healthMap = {};
      if (channels.length > 0) {
        document.getElementById('controlsSection').classList.remove('hidden');
        updateStats();
        renderChannels();
        showToast('Parsed ' + channels.length + ' channels! Probing health...');
        probeAllChannels();
      } else {
        alert('No valid stream URLs found.');
      }
    }

    window.copyText = function(text) {
      navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    };

    window.probeChannel = probeChannel;

    window.playChannel = function(encoded) {
      const ch = JSON.parse(decodeURIComponent(encoded));
      const modal = document.getElementById('playerModal');
      const video = document.getElementById('videoElement');
      document.getElementById('playerTitle').textContent = ch.name;
      document.getElementById('playerUrl').textContent = ch.url;

      if (currentHls) {
        currentHls.destroy();
        currentHls = null;
      }

      if (ch.url.includes('.m3u8') && Hls.isSupported()) {
        currentHls = new Hls();
        currentHls.loadSource(ch.url);
        currentHls.attachMedia(video);
        currentHls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
      } else {
        video.src = ch.url;
        video.play();
      }

      modal.classList.remove('hidden');
    };

    document.getElementById('closePlayerBtn').onclick = () => {
      document.getElementById('playerModal').classList.add('hidden');
      document.getElementById('videoElement').pause();
    };

    document.getElementById('fileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => loadContent(ev.target.result);
        reader.readAsText(file);
      }
    });

    const dropZone = document.getElementById('dropZone');
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('border-cyan-400'); };
    dropZone.ondragleave = () => { dropZone.classList.remove('border-cyan-400'); };
    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-cyan-400');
      if (e.dataTransfer.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => loadContent(ev.target.result);
        reader.readAsText(e.dataTransfer.files[0]);
      }
    };

    document.getElementById('loadSampleBtn').onclick = (e) => {
      e.stopPropagation();
      const sample = \`#EXTM3U
#EXTINF:-1 tvg-id="bbb" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/320px-Big_buck_bunny_poster_big.jpg" group-title="Animation",Big Buck Bunny 1080p
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
#EXTINF:-1 tvg-id="sintel" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sintel_poster.jpg/320px-Sintel_poster.jpg" group-title="Animation",Sintel 4K HLS
https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8
#EXTINF:-1 tvg-id="tears" group-title="Sci-Fi",Tears of Steel (VFX Demo)
https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8
#EXTINF:-1 tvg-id="elephants" group-title="Cinema",Elephants Dream MP4
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4\`;
      loadContent(sample);
    };

    document.getElementById('checkAllTopBtn').onclick = probeAllChannels;
    document.getElementById('searchInput').oninput = renderChannels;
    document.getElementById('groupSelect').onchange = renderChannels;
    document.getElementById('statusFilterSelect').onchange = renderChannels;

    document.getElementById('copyAllTopBtn').onclick = () => {
      if (channels.length === 0) return alert('No channels loaded.');
      const allUrls = channels.map(c => c.url).join('\\n');
      navigator.clipboard.writeText(allUrls);
      showToast('Copied ' + channels.length + ' URLs to clipboard!');
    };

    document.getElementById('downloadM3uBtn').onclick = () => {
      if (channels.length === 0) return alert('No channels loaded.');
      let out = '#EXTM3U\\n';
      channels.forEach(c => {
        out += \`#EXTINF:-1 tvg-logo="\${c.logo}" group-title="\${c.group}",\${c.name}\\n\${c.url}\\n\`;
      });
      const blob = new Blob([out], { type: 'audio/x-mpegurl' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cleaned_playlist.m3u8';
      a.click();
      showToast('Downloaded clean M3U8 playlist!');
    };
  </script>
</body>
</html>`;
}
