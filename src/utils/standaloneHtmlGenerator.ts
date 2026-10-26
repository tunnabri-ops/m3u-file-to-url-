export function generateSingleFileHtml(): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>M3U File to URL Converter</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
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
  <!-- Header -->
  <header class="border-b border-slate-800/80 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-xl">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-8">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 font-bold">
          ⚡
        </div>
        <span class="font-display text-lg font-semibold tracking-tight text-white">M3U Stream Nexus</span>
      </div>
      <div class="flex items-center gap-3">
        <button id="copyAllTopBtn" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors">
          Copy All URLs
        </button>
        <button id="downloadM3uBtn" class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 transition-all">
          Download Playlist
        </button>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-4 py-8 space-y-8">
    <!-- Hero Title -->
    <div class="text-center max-w-3xl mx-auto">
      <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
        Convert <span class="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">M3U Playlists</span> to Direct URLs
      </h1>
      <p class="text-xs sm:text-sm text-slate-400">
        Drag and drop your .m3u or .m3u8 files, extract clean stream links and logos instantly, and preview live streams.
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

    <!-- Stats & Filters Bar (Hidden until channels loaded) -->
    <div id="controlsSection" class="space-y-4 hidden">
      <div class="glass-panel rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div class="flex items-center gap-4 text-slate-400">
          <div><strong id="statTotal" class="text-white font-mono text-sm tabular-nums">0</strong> channels found</div>
          <div>·</div>
          <div><strong id="statCategories" class="text-white font-mono tabular-nums">0</strong> categories</div>
          <div>·</div>
          <div><strong id="statLogos" class="text-white font-mono tabular-nums">0</strong> with logos</div>
        </div>
        <div class="flex items-center gap-2">
          <input type="text" id="searchInput" placeholder="Search channels..." class="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500" />
          <select id="groupSelect" class="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none">
            <option value="ALL">All Categories</option>
          </select>
        </div>
      </div>

      <!-- Channel Table Container -->
      <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th class="py-3 px-4 w-12 text-center">#</th>
                <th class="py-3 px-4">Channel</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4">Stream URL</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="channelTableBody" class="divide-y divide-slate-800/60 text-slate-300">
            </tbody>
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

  <!-- Toast Notification -->
  <div id="toast" class="fixed bottom-6 right-6 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium transition-all duration-300 opacity-0 pointer-events-none translate-y-2">
    Copied to clipboard!
  </div>

  <script>
    let channels = [];
    let currentHls = null;

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
      setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
      }, 2500);
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
      const tbody = document.getElementById('channelTableBody');
      tbody.innerHTML = '';

      const filtered = channels.filter(ch => {
        const matchesQuery = ch.name.toLowerCase().includes(q) || ch.url.toLowerCase().includes(q);
        const matchesGroup = groupFilter === 'ALL' || ch.group === groupFilter;
        return matchesQuery && matchesGroup;
      });

      filtered.forEach((ch, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/40 transition-colors';
        tr.innerHTML = \`
          <td class="py-3 px-4 text-center font-mono text-slate-500">\${idx + 1}</td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-2.5">
              \${ch.logo ? \`<img src="\${ch.logo}" class="w-6 h-6 object-contain rounded bg-slate-900" onerror="this.style.display='none'" />\` : ''}
              <span class="font-medium text-white truncate max-w-[200px]">\${ch.name}</span>
            </div>
          </td>
          <td class="py-3 px-4 text-slate-400">\${ch.group}</td>
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
      document.getElementById('statLogos').textContent = channels.filter(c => c.logo).length;

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
      if (channels.length > 0) {
        document.getElementById('controlsSection').classList.remove('hidden');
        updateStats();
        renderChannels();
        showToast('Successfully parsed ' + channels.length + ' channels!');
      } else {
        alert('No valid stream URLs found in file.');
      }
    }

    window.copyText = function(text) {
      navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    };

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

    document.getElementById('searchInput').oninput = renderChannels;
    document.getElementById('groupSelect').onchange = renderChannels;

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
