INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '12218d24-0e62-44ec-9bc5-2571d6a1076d',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>聲旅 PodVoyage</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { dm: ['DM Sans', 'sans-serif'] },
      colors: {
        pod: { 50:'#faf5ff', 100:'#f3e8ff', 200:'#e9d5ff', 400:'#c084fc', 500:'#a855f7', 600:'#9333ea', 700:'#7e22ce' },
        coral: { 400:'#fb7185', 500:'#f43f5e' }
      }
    }
  }
}
</script>
<style>
* { font-family: 'DM Sans', sans-serif; }
body { background: #faf8ff; }
.episode-card { transition: all 0.25s; cursor: pointer; }
.episode-card:hover { transform: translateX(4px); background: #f3e8ff; }
.play-btn { transition: all 0.2s; }
.play-btn:hover { transform: scale(1.1); }
.wave-anim { animation: waveMove 1.5s ease-in-out infinite; }
@keyframes waveMove { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.6)} }
</style>
</head>
<body>

<!-- Nav -->
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-purple-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg bg-pod-500 flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 004 7.48V22h2v-2.52a9 9 0 004 0V22h2v-2.52A9 9 0 0021 12v-2h-2z"/></svg>
      </div>
      <span class="text-lg font-bold text-gray-800">聲旅 <span class="text-pod-500">PodVoyage</span></span>
    </div>
    <div class="flex items-center gap-6 text-sm font-medium text-gray-500">
      <a class="hover:text-pod-500 transition cursor-pointer">所有集數</a>
      <a class="hover:text-pod-500 transition cursor-pointer">來賓</a>
      <a class="hover:text-pod-500 transition cursor-pointer">主題</a>
      <a class="hover:text-pod-500 transition cursor-pointer">關於</a>
      <button class="bg-pod-500 hover:bg-pod-600 text-white px-4 py-1.5 rounded-full text-sm font-medium transition">訂閱</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="py-16 bg-gradient-to-br from-pod-600 via-pod-700 to-purple-900 text-white relative overflow-hidden">
  <div class="absolute inset-0 opacity-10">
    <div class="absolute top-10 right-20 w-64 h-64 rounded-full bg-coral-400 blur-[80px]"></div>
    <div class="absolute bottom-0 left-20 w-48 h-48 rounded-full bg-pod-300 blur-[60px]"></div>
  </div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-12 relative">
    <div class="w-56 h-56 rounded-3xl bg-gradient-to-br from-pod-400 to-coral-400 flex items-center justify-center shadow-2xl shadow-pod-900/50 flex-shrink-0 relative">
      <span class="text-7xl">🎙️</span>
      <div class="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg play-btn cursor-pointer">
        <svg class="w-5 h-5 text-pod-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>
    <div class="flex-1">
      <span class="inline-block text-xs bg-white/20 px-3 py-1 rounded-full mb-3">每週三更新 · 科技 × 生活</span>
      <h1 class="text-4xl font-bold mb-3">用聲音旅行，<br>探索每個故事的維度</h1>
      <p class="text-white/70 leading-relaxed mb-6 max-w-lg">每集邀請不同領域的創作者，從 AI、設計到心理學，在對話中碰撞出意想不到的火花。</p>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm"><span>🎧</span> Apple Podcasts</div>
        <div class="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm"><span>💚</span> Spotify</div>
        <div class="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm"><span>📡</span> RSS</div>
      </div>
      <div class="flex gap-6 mt-6 text-sm">
        <div><span class="text-2xl font-bold">128</span><span class="text-white/50 ml-1">集</span></div>
        <div><span class="text-2xl font-bold">50K+</span><span class="text-white/50 ml-1">訂閱</span></div>
        <div><span class="text-2xl font-bold">4.9</span><span class="text-white/50 ml-1">★ 評分</span></div>
      </div>
    </div>
  </div>
</section>

<!-- Latest Episode -->
<section class="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
  <div class="bg-white rounded-2xl shadow-lg shadow-purple-100/50 border border-purple-50 p-6">
    <div class="flex items-center gap-1 mb-3">
      <span class="text-xs bg-coral-500 text-white px-2 py-0.5 rounded-full font-medium">最新</span>
      <span class="text-xs text-gray-400 ml-2">EP.128 · 2026/02/12</span>
    </div>
    <div class="flex items-center gap-5">
      <div class="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl flex-shrink-0">🤖</div>
      <div class="flex-1">
        <h3 class="text-lg font-bold text-gray-800 mb-1">AI 會取代創意嗎？— 與 Midjourney 設計師的深度對談</h3>
        <p class="text-sm text-gray-400 mb-2">探討 AI 工具如何改變設計師的工作流程，以及人類創意不可被取代的核心價值</p>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <button class="play-btn w-9 h-9 rounded-full bg-pod-500 flex items-center justify-center">
              <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <div class="flex-1 h-1.5 bg-pod-100 rounded-full w-64 overflow-hidden">
              <div class="h-full w-1/4 bg-pod-500 rounded-full"></div>
            </div>
            <span class="text-xs text-gray-400">52:18</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Episode List -->
<section class="max-w-6xl mx-auto px-6 py-12">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-bold text-gray-800">所有集數</h2>
    <div class="flex gap-2 text-xs">
      <button class="px-3 py-1.5 rounded-full bg-pod-500 text-white font-medium">全部</button>
      <button class="px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">科技</button>
      <button class="px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">設計</button>
      <button class="px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">心理</button>
      <button class="px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">創業</button>
    </div>
  </div>
  <div class="space-y-2">
    <div class="episode-card flex items-center gap-4 p-4 rounded-xl bg-white border border-purple-50">
      <div class="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center text-2xl flex-shrink-0">💡</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-400">EP.127</span>
          <span class="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">創業</span>
        </div>
        <h3 class="font-semibold text-gray-800 text-sm mt-0.5 truncate">從 Side Project 到 10 萬用戶 — 獨立開發者的成長之路</h3>
      </div>
      <span class="text-xs text-gray-400 flex-shrink-0">48:35</span>
      <button class="play-btn w-8 h-8 rounded-full bg-pod-50 flex items-center justify-center flex-shrink-0">
        <svg class="w-3.5 h-3.5 text-pod-500 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
    <div class="episode-card flex items-center gap-4 p-4 rounded-xl bg-white border border-purple-50">
      <div class="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-300 to-teal-500 flex items-center justify-center text-2xl flex-shrink-0">🧠</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-400">EP.126</span>
          <span class="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">心理</span>
        </div>
        <h3 class="font-semibold text-gray-800 text-sm mt-0.5 truncate">數位斷捨離：重新找回專注力的 30 天實驗</h3>
      </div>
      <span class="text-xs text-gray-400 flex-shrink-0">41:22</span>
      <button class="play-btn w-8 h-8 rounded-full bg-pod-50 flex items-center justify-center flex-shrink-0">
        <svg class="w-3.5 h-3.5 text-pod-500 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
    <div class="episode-card flex items-center gap-4 p-4 rounded-xl bg-white border border-purple-50">
      <div class="w-14 h-14 rounded-lg bg-gradient-to-br from-rose-300 to-pink-500 flex items-center justify-center text-2xl flex-shrink-0">🎨</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-400">EP.125</span>
          <span class="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">設計</span>
        </div>
        <h3 class="font-semibold text-gray-800 text-sm mt-0.5 truncate">為什麼好設計是看不見的？— UX 設計的隱形法則</h3>
      </div>
      <span class="text-xs text-gray-400 flex-shrink-0">55:07</span>
      <button class="play-btn w-8 h-8 rounded-full bg-pod-50 flex items-center justify-center flex-shrink-0">
        <svg class="w-3.5 h-3.5 text-pod-500 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
    <div class="episode-card flex items-center gap-4 p-4 rounded-xl bg-white border border-purple-50">
      <div class="w-14 h-14 rounded-lg bg-gradient-to-br from-violet-300 to-purple-600 flex items-center justify-center text-2xl flex-shrink-0">🚀</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-400">EP.124</span>
          <span class="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">科技</span>
        </div>
        <h3 class="font-semibold text-gray-800 text-sm mt-0.5 truncate">Web3 還有未來嗎？區塊鏈開發者的真實告白</h3>
      </div>
      <span class="text-xs text-gray-400 flex-shrink-0">63:45</span>
      <button class="play-btn w-8 h-8 rounded-full bg-pod-50 flex items-center justify-center flex-shrink-0">
        <svg class="w-3.5 h-3.5 text-pod-500 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
  </div>
</section>

<!-- Subscribe CTA -->
<section class="bg-gradient-to-r from-pod-600 to-pod-700 py-12">
  <div class="max-w-3xl mx-auto px-6 text-center text-white">
    <h2 class="text-2xl font-bold mb-3">不錯過任何一集好故事</h2>
    <p class="text-white/70 mb-6 text-sm">輸入 Email，每週三收到新集數通知 + 獨家幕後花絮</p>
    <div class="flex gap-2 max-w-md mx-auto">
      <input type="email" placeholder="your@email.com" class="flex-1 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm outline-none focus:border-white/40">
      <button class="bg-white text-pod-600 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-white/90 transition">訂閱</button>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
    <span>© 2026 聲旅 PodVoyage</span>
    <div class="flex gap-4">
      <a class="hover:text-white transition cursor-pointer">Apple Podcasts</a>
      <a class="hover:text-white transition cursor-pointer">Spotify</a>
      <a class="hover:text-white transition cursor-pointer">YouTube</a>
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
