INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '53a393f4-e62a-458e-b296-dd6219317e74',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>競技場 ArenaPro</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        arena: { 50:'#fef2f2', 400:'#f87171', 500:'#ef4444', 600:'#dc2626', 700:'#b91c1c' },
        dark: { 800:'#1a1a2e', 900:'#0f0f1a' }
      }
    }
  }
}
</script>
<style>
body { font-family: 'Noto Sans TC', sans-serif; background: #0f0f1a; color: #e2e8f0; }
.heading { font-family: 'Rajdhani', sans-serif; }
.match-row { transition: all 0.2s; }
.match-row:hover { background: rgba(239,68,68,0.05); }
.live-dot { animation: pulse 1.5s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
.score-box { min-width: 36px; }
.team-badge { transition: transform 0.2s; }
.team-badge:hover { transform: scale(1.05); }
</style>
</head>
<body>

<!-- Nav -->
<nav class="sticky top-0 z-50 bg-dark-900/95 backdrop-blur border-b border-white/5">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg bg-arena-500 flex items-center justify-center heading text-white font-bold text-sm">AP</div>
      <span class="heading text-lg font-bold tracking-wide">ARENA<span class="text-arena-500">PRO</span></span>
    </div>
    <div class="flex items-center gap-6 text-sm text-gray-400">
      <a class="hover:text-white transition cursor-pointer">賽程</a>
      <a class="hover:text-white transition cursor-pointer">隊伍</a>
      <a class="hover:text-white transition cursor-pointer">比分</a>
      <a class="hover:text-white transition cursor-pointer">購票</a>
      <button class="bg-arena-500 hover:bg-arena-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition heading tracking-wide">立即購票</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="relative overflow-hidden py-16">
  <div class="absolute inset-0 bg-gradient-to-br from-arena-700/20 to-transparent"></div>
  <div class="max-w-6xl mx-auto px-6 relative text-center">
    <div class="inline-block mb-4">
      <span class="flex items-center gap-1.5 text-xs bg-arena-500/20 text-arena-400 px-3 py-1 rounded-full border border-arena-500/30"><span class="live-dot w-1.5 h-1.5 rounded-full bg-arena-500"></span>LIVE NOW</span>
    </div>
    <h1 class="heading text-5xl font-bold tracking-tight mb-3">2026 春季職業聯賽</h1>
    <p class="text-gray-400 mb-6 max-w-lg mx-auto">跨越籃球、排球、足球三大項目，32 支隊伍角逐年度總冠軍</p>
    <div class="flex items-center justify-center gap-8 text-sm">
      <div class="text-center"><div class="heading text-3xl font-bold text-white">32</div><div class="text-xs text-gray-500">參賽隊伍</div></div>
      <div class="w-px h-10 bg-white/10"></div>
      <div class="text-center"><div class="heading text-3xl font-bold text-white">96</div><div class="text-xs text-gray-500">場次</div></div>
      <div class="w-px h-10 bg-white/10"></div>
      <div class="text-center"><div class="heading text-3xl font-bold text-white">3</div><div class="text-xs text-gray-500">運動項目</div></div>
    </div>
  </div>
</section>

<!-- Live Match -->
<section class="max-w-6xl mx-auto px-6 -mt-4 mb-8">
  <div class="bg-gradient-to-r from-arena-700 to-arena-600 rounded-2xl p-6 relative overflow-hidden">
    <div class="absolute top-3 right-4 flex items-center gap-1.5 text-xs text-white/80"><span class="live-dot w-1.5 h-1.5 rounded-full bg-white"></span>直播中</div>
    <div class="flex items-center justify-center gap-10">
      <div class="text-center">
        <div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl mb-2 team-badge">🦁</div>
        <div class="font-bold text-white heading">雄獅隊</div>
        <div class="text-xs text-white/60">Lions</div>
      </div>
      <div class="text-center">
        <div class="heading text-5xl font-bold text-white tracking-wider">
          <span class="score-box inline-block">78</span>
          <span class="mx-2 text-white/40">:</span>
          <span class="score-box inline-block">72</span>
        </div>
        <div class="text-xs text-white/60 mt-1">Q3 · 04:32</div>
      </div>
      <div class="text-center">
        <div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl mb-2 team-badge">🐉</div>
        <div class="font-bold text-white heading">飛龍隊</div>
        <div class="text-xs text-white/60">Dragons</div>
      </div>
    </div>
  </div>
</section>

<!-- Schedule -->
<section class="max-w-6xl mx-auto px-6 pb-12">
  <div class="flex items-center justify-between mb-6">
    <h2 class="heading text-2xl font-bold">賽程表</h2>
    <div class="flex gap-2 text-xs">
      <button class="px-3 py-1.5 rounded-lg bg-arena-500 text-white font-medium">全部</button>
      <button class="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition">🏀 籃球</button>
      <button class="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition">🏐 排球</button>
      <button class="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition">⚽ 足球</button>
    </div>
  </div>
  <div class="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
    <div class="text-xs text-gray-500 px-5 py-2 bg-white/[0.02] border-b border-white/5 font-medium">2/17（一）</div>
    <div class="match-row flex items-center justify-between px-5 py-3 border-b border-white/5">
      <div class="flex items-center gap-3 w-40">
        <span class="text-lg">🏀</span>
        <div><div class="text-sm font-medium">雄獅 vs 飛龍</div><div class="text-xs text-gray-500">籃球 · 決賽</div></div>
      </div>
      <div class="flex items-center gap-1.5"><span class="live-dot w-1.5 h-1.5 rounded-full bg-arena-500"></span><span class="text-xs text-arena-400 font-medium">進行中</span></div>
      <div class="heading text-lg font-bold">78 : 72</div>
      <button class="text-xs text-arena-400 hover:text-arena-300 transition cursor-pointer">觀看直播 →</button>
    </div>
    <div class="match-row flex items-center justify-between px-5 py-3 border-b border-white/5">
      <div class="flex items-center gap-3 w-40">
        <span class="text-lg">🏐</span>
        <div><div class="text-sm font-medium">鷹擊 vs 疾風</div><div class="text-xs text-gray-500">排球 · 八強賽</div></div>
      </div>
      <span class="text-xs text-gray-500">19:00</span>
      <div class="heading text-lg font-bold text-gray-600">— : —</div>
      <button class="text-xs bg-arena-500/10 text-arena-400 px-3 py-1 rounded hover:bg-arena-500/20 transition cursor-pointer">購票</button>
    </div>
    <div class="text-xs text-gray-500 px-5 py-2 bg-white/[0.02] border-b border-white/5 font-medium">2/18（二）</div>
    <div class="match-row flex items-center justify-between px-5 py-3 border-b border-white/5">
      <div class="flex items-center gap-3 w-40">
        <span class="text-lg">⚽</span>
        <div><div class="text-sm font-medium">閃電 vs 巨熊</div><div class="text-xs text-gray-500">足球 · 準決賽</div></div>
      </div>
      <span class="text-xs text-gray-500">15:00</span>
      <div class="heading text-lg font-bold text-gray-600">— : —</div>
      <button class="text-xs bg-arena-500/10 text-arena-400 px-3 py-1 rounded hover:bg-arena-500/20 transition cursor-pointer">購票</button>
    </div>
    <div class="match-row flex items-center justify-between px-5 py-3">
      <div class="flex items-center gap-3 w-40">
        <span class="text-lg">🏀</span>
        <div><div class="text-sm font-medium">猛虎 vs 白鯊</div><div class="text-xs text-gray-500">籃球 · 季殿賽</div></div>
      </div>
      <span class="text-xs text-gray-500">19:30</span>
      <div class="heading text-lg font-bold text-gray-600">— : —</div>
      <button class="text-xs bg-arena-500/10 text-arena-400 px-3 py-1 rounded hover:bg-arena-500/20 transition cursor-pointer">購票</button>
    </div>
  </div>
</section>

<!-- Teams -->
<section class="max-w-6xl mx-auto px-6 pb-12">
  <h2 class="heading text-2xl font-bold mb-6">參賽隊伍</h2>
  <div class="grid grid-cols-4 gap-4">
    <div class="bg-white/5 rounded-xl p-4 text-center border border-white/5 hover:border-arena-500/30 transition cursor-pointer team-badge">
      <div class="text-4xl mb-2">🦁</div>
      <div class="font-bold heading">雄獅隊</div>
      <div class="text-xs text-gray-500">W12 - L3</div>
    </div>
    <div class="bg-white/5 rounded-xl p-4 text-center border border-white/5 hover:border-arena-500/30 transition cursor-pointer team-badge">
      <div class="text-4xl mb-2">🐉</div>
      <div class="font-bold heading">飛龍隊</div>
      <div class="text-xs text-gray-500">W11 - L4</div>
    </div>
    <div class="bg-white/5 rounded-xl p-4 text-center border border-white/5 hover:border-arena-500/30 transition cursor-pointer team-badge">
      <div class="text-4xl mb-2">🦅</div>
      <div class="font-bold heading">鷹擊隊</div>
      <div class="text-xs text-gray-500">W10 - L5</div>
    </div>
    <div class="bg-white/5 rounded-xl p-4 text-center border border-white/5 hover:border-arena-500/30 transition cursor-pointer team-badge">
      <div class="text-4xl mb-2">🐯</div>
      <div class="font-bold heading">猛虎隊</div>
      <div class="text-xs text-gray-500">W9 - L6</div>
    </div>
  </div>
</section>

<!-- Ticket CTA -->
<section class="bg-gradient-to-r from-arena-600 to-arena-700 py-10">
  <div class="max-w-4xl mx-auto px-6 text-center">
    <h2 class="heading text-3xl font-bold mb-2">準備好了嗎？</h2>
    <p class="text-white/70 text-sm mb-6">早鳥票限時 8 折，搶先鎖定最佳觀賽席位</p>
    <button class="bg-white text-arena-600 px-8 py-3 rounded-lg heading font-bold text-lg hover:bg-gray-100 transition">立即購票 →</button>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-white/5 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-gray-500">
    <span>© 2026 競技場 ArenaPro</span>
    <div class="flex gap-4"><a class="hover:text-white transition cursor-pointer">規則</a><a class="hover:text-white transition cursor-pointer">隱私</a><a class="hover:text-white transition cursor-pointer">聯繫</a></div>
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
