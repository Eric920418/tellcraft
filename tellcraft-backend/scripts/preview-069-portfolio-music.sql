INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '0ff54a39-6ad9-4fef-a69a-cecec0e1c5ac',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>聲波工坊 SoundCraft</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { space: ['Space Grotesk', 'sans-serif'] },
      colors: {
        neon: { 400:'#a78bfa', 500:'#8b5cf6', 600:'#7c3aed' },
        beat: { 400:'#f472b6', 500:'#ec4899', 600:'#db2777' },
        vinyl: { 800:'#1e1b2e', 900:'#121020' }
      }
    }
  }
}
</script>
<style>
* { font-family: 'Space Grotesk', sans-serif; }
body { background: #121020; color: #e2e8f0; }
.glow { text-shadow: 0 0 20px rgba(139,92,246,0.5); }
.album-card { transition: transform 0.3s, box-shadow 0.3s; cursor: pointer; }
.album-card:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 40px rgba(139,92,246,0.2); }
.eq-bar { animation: eq 0.8s ease infinite alternate; }
.eq-bar:nth-child(2) { animation-delay: 0.2s; }
.eq-bar:nth-child(3) { animation-delay: 0.4s; }
.eq-bar:nth-child(4) { animation-delay: 0.1s; }
.eq-bar:nth-child(5) { animation-delay: 0.3s; }
@keyframes eq { from{height:8px} to{height:24px} }
.wave-line { animation: wave 2s ease-in-out infinite; }
@keyframes wave { 0%,100%{d:path("M0,20 Q50,5 100,20 Q150,35 200,20")} 50%{d:path("M0,20 Q50,35 100,20 Q150,5 200,20")} }
.nav-link { transition: color 0.2s; }
.nav-link:hover { color: #a78bfa; }
</style>
</head>
<body>

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-vinyl-900/80 backdrop-blur-lg border-b border-white/5">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-3">
      <div class="flex gap-0.5 items-end h-6">
        <div class="eq-bar w-1 bg-neon-500 rounded-full"></div>
        <div class="eq-bar w-1 bg-neon-400 rounded-full"></div>
        <div class="eq-bar w-1 bg-beat-400 rounded-full"></div>
        <div class="eq-bar w-1 bg-neon-500 rounded-full"></div>
        <div class="eq-bar w-1 bg-beat-500 rounded-full"></div>
      </div>
      <span class="text-lg font-bold tracking-tight">SoundCraft</span>
    </div>
    <div class="flex items-center gap-8 text-sm text-gray-400">
      <a class="nav-link cursor-pointer">作品</a>
      <a class="nav-link cursor-pointer">關於</a>
      <a class="nav-link cursor-pointer">巡演</a>
      <a class="nav-link cursor-pointer">聯繫</a>
      <button class="bg-neon-500 hover:bg-neon-600 text-white px-4 py-1.5 rounded-full text-sm font-medium transition">合作邀約</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="pt-32 pb-20 relative overflow-hidden">
  <div class="absolute inset-0 opacity-20">
    <div class="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-neon-500 blur-[100px]"></div>
    <div class="absolute bottom-10 right-1/4 w-56 h-56 rounded-full bg-beat-500 blur-[80px]"></div>
  </div>
  <div class="max-w-6xl mx-auto px-6 text-center relative">
    <div class="inline-block mb-6">
      <span class="text-xs text-neon-400 border border-neon-500/30 px-4 py-1.5 rounded-full">Electronic Music Producer & DJ</span>
    </div>
    <h1 class="text-6xl font-bold tracking-tight mb-4 glow">DJ NOVA</h1>
    <p class="text-gray-400 max-w-lg mx-auto mb-8 leading-relaxed">探索聲音的邊界，融合 Techno、House 與 Ambient，創造獨一無二的電子音樂體驗。</p>
    <div class="flex items-center justify-center gap-4">
      <button class="bg-gradient-to-r from-neon-500 to-beat-500 hover:opacity-90 text-white px-8 py-3 rounded-full font-medium transition">▶ 試聽最新作品</button>
      <button class="border border-white/20 hover:border-white/40 text-white px-8 py-3 rounded-full font-medium transition">Spotify ↗</button>
    </div>
    <div class="flex items-center justify-center gap-8 mt-10 text-center">
      <div><div class="text-2xl font-bold text-white">12</div><div class="text-xs text-gray-500">專輯</div></div>
      <div class="w-px h-8 bg-white/10"></div>
      <div><div class="text-2xl font-bold text-white">1.2M</div><div class="text-xs text-gray-500">串流播放</div></div>
      <div class="w-px h-8 bg-white/10"></div>
      <div><div class="text-2xl font-bold text-white">48</div><div class="text-xs text-gray-500">城市巡演</div></div>
    </div>
  </div>
</section>

<!-- Albums -->
<section class="py-16 relative">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-2xl font-bold mb-8">作品集</h2>
    <div class="grid grid-cols-4 gap-5">
      <div class="album-card">
        <div class="aspect-square rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-900 flex items-center justify-center mb-3 relative overflow-hidden">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.1),transparent)]"></div>
          <span class="text-5xl relative">🎵</span>
          <div class="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
            <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <h3 class="font-semibold text-sm">Midnight Pulse</h3>
        <p class="text-xs text-gray-500">2026 · EP · 5 tracks</p>
      </div>
      <div class="album-card">
        <div class="aspect-square rounded-2xl bg-gradient-to-br from-pink-600 to-rose-900 flex items-center justify-center mb-3 relative overflow-hidden">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent)]"></div>
          <span class="text-5xl relative">🎶</span>
          <div class="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
            <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <h3 class="font-semibold text-sm">Neon Dreams</h3>
        <p class="text-xs text-gray-500">2025 · Album · 12 tracks</p>
      </div>
      <div class="album-card">
        <div class="aspect-square rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-900 flex items-center justify-center mb-3 relative overflow-hidden">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>
          <span class="text-5xl relative">🌊</span>
          <div class="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
            <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <h3 class="font-semibold text-sm">Ocean Floor</h3>
        <p class="text-xs text-gray-500">2025 · EP · 6 tracks</p>
      </div>
      <div class="album-card">
        <div class="aspect-square rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-900 flex items-center justify-center mb-3 relative overflow-hidden">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_40%_60%,rgba(255,255,255,0.1),transparent)]"></div>
          <span class="text-5xl relative">🌿</span>
          <div class="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
            <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <h3 class="font-semibold text-sm">Forest Frequency</h3>
        <p class="text-xs text-gray-500">2024 · Album · 10 tracks</p>
      </div>
    </div>
  </div>
</section>

<!-- Mini Player -->
<section class="max-w-6xl mx-auto px-6 py-8">
  <div class="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 flex items-center gap-5">
    <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-900 flex items-center justify-center text-2xl flex-shrink-0">🎵</div>
    <div class="flex-1 min-w-0">
      <div class="font-semibold text-sm">Midnight Pulse — Track 03</div>
      <div class="text-xs text-gray-500 mt-0.5">Electric Horizon</div>
      <div class="mt-2 flex items-center gap-3">
        <span class="text-xs text-gray-500">1:24</span>
        <div class="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <div class="h-full w-2/5 bg-gradient-to-r from-neon-500 to-beat-500 rounded-full"></div>
        </div>
        <span class="text-xs text-gray-500">3:42</span>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button class="text-gray-400 hover:text-white transition">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
      </button>
      <button class="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition">
        <svg class="w-4 h-4 text-vinyl-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
      <button class="text-gray-400 hover:text-white transition">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
      </button>
    </div>
  </div>
</section>

<!-- Tour Dates -->
<section class="py-16">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-2xl font-bold mb-8">巡演日程</h2>
    <div class="space-y-3">
      <div class="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-neon-500/30 transition">
        <div class="flex items-center gap-5">
          <div class="text-center w-14"><div class="text-lg font-bold text-neon-400">MAR</div><div class="text-2xl font-bold">08</div></div>
          <div><div class="font-semibold">Taipei — Wall Music</div><div class="text-xs text-gray-500">台北 · 22:00 開始</div></div>
        </div>
        <button class="bg-neon-500 hover:bg-neon-600 text-white px-5 py-2 rounded-full text-sm font-medium transition">購票</button>
      </div>
      <div class="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-neon-500/30 transition">
        <div class="flex items-center gap-5">
          <div class="text-center w-14"><div class="text-lg font-bold text-neon-400">MAR</div><div class="text-2xl font-bold">22</div></div>
          <div><div class="font-semibold">Tokyo — WOMB Shibuya</div><div class="text-xs text-gray-500">東京 · 23:00 開始</div></div>
        </div>
        <button class="bg-neon-500 hover:bg-neon-600 text-white px-5 py-2 rounded-full text-sm font-medium transition">購票</button>
      </div>
      <div class="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-beat-500/30 transition">
        <div class="flex items-center gap-5">
          <div class="text-center w-14"><div class="text-lg font-bold text-beat-400">APR</div><div class="text-2xl font-bold">12</div></div>
          <div><div class="font-semibold">Berlin — Berghain</div><div class="text-xs text-gray-500">柏林 · 00:00 開始</div></div>
        </div>
        <span class="text-sm text-beat-400 font-medium px-5 py-2">即將售罄</span>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-white/5 py-10">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between">
    <div class="flex items-center gap-2 text-sm text-gray-500">
      <div class="flex gap-0.5 items-end h-4">
        <div class="eq-bar w-0.5 bg-neon-500/50 rounded-full" style="animation-duration:1.2s"></div>
        <div class="eq-bar w-0.5 bg-neon-400/50 rounded-full" style="animation-duration:0.9s"></div>
        <div class="eq-bar w-0.5 bg-beat-400/50 rounded-full" style="animation-duration:1.1s"></div>
      </div>
      © 2026 SoundCraft. All Rights Reserved.
    </div>
    <div class="flex gap-4 text-gray-500 text-sm">
      <a class="hover:text-neon-400 transition cursor-pointer">Spotify</a>
      <a class="hover:text-neon-400 transition cursor-pointer">SoundCloud</a>
      <a class="hover:text-neon-400 transition cursor-pointer">Instagram</a>
    </div>
  </div>
</footer>
</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
