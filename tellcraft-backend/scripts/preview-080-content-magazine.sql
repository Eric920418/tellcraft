INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'ffb0ebd4-5336-42b3-92e7-3341f020133d',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>潮流誌 TrendMag</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
body { font-family: 'DM Sans', sans-serif; background: #fff; }
.serif { font-family: 'Playfair Display', serif; }
.article-card { transition: all 0.3s; cursor: pointer; }
.article-card:hover { transform: translateY(-3px); }
.article-card:hover .article-img { transform: scale(1.05); }
.article-img { transition: transform 0.5s; }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white border-b border-gray-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <span class="serif text-2xl font-black tracking-tight">TREND<span class="text-rose-500">MAG</span></span>
    <div class="flex items-center gap-6 text-sm font-medium text-gray-500">
      <a class="hover:text-black transition cursor-pointer">時尚</a>
      <a class="hover:text-black transition cursor-pointer">生活</a>
      <a class="hover:text-black transition cursor-pointer">科技</a>
      <a class="hover:text-black transition cursor-pointer">文化</a>
      <button class="bg-black text-white px-4 py-1.5 text-xs font-semibold hover:bg-gray-800 transition">訂閱</button>
    </div>
  </div>
</nav>

<!-- Featured -->
<section class="max-w-6xl mx-auto px-6 py-8">
  <div class="grid grid-cols-2 gap-6">
    <div class="article-card relative rounded-2xl overflow-hidden h-96 bg-gradient-to-br from-rose-300 to-pink-500 flex items-end">
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      <div class="relative p-6 text-white">
        <span class="text-xs bg-rose-500 px-2 py-0.5 rounded-full font-medium">編輯精選</span>
        <h2 class="serif text-2xl font-bold mt-2 leading-snug">2026 春夏趨勢：<br>極簡主義的回歸</h2>
        <p class="text-white/70 text-sm mt-2">從米蘭到巴黎，各大品牌不約而同回歸簡約...</p>
        <div class="text-xs text-white/50 mt-3">Fashion · 5 min read</div>
      </div>
    </div>
    <div class="grid grid-rows-2 gap-6">
      <div class="article-card relative rounded-2xl overflow-hidden bg-gradient-to-br from-sky-300 to-indigo-400 flex items-end">
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div class="relative p-5 text-white">
          <span class="text-xs bg-sky-500 px-2 py-0.5 rounded-full font-medium">科技</span>
          <h3 class="serif text-lg font-bold mt-1">AI 如何改寫創意產業的遊戲規則</h3>
          <div class="text-xs text-white/50 mt-1">Tech · 8 min read</div>
        </div>
      </div>
      <div class="article-card relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-300 to-orange-400 flex items-end">
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div class="relative p-5 text-white">
          <span class="text-xs bg-amber-500 px-2 py-0.5 rounded-full font-medium">生活</span>
          <h3 class="serif text-lg font-bold mt-1">東京巷弄：12 間在地人才知道的咖啡館</h3>
          <div class="text-xs text-white/50 mt-1">Lifestyle · 6 min read</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Latest -->
<section class="max-w-6xl mx-auto px-6 pb-12">
  <div class="flex items-center justify-between mb-6">
    <h2 class="serif text-xl font-bold">最新專題</h2>
    <div class="flex gap-2 text-xs">
      <button class="px-3 py-1 rounded-full bg-black text-white font-medium">全部</button>
      <button class="px-3 py-1 rounded-full bg-gray-100 text-gray-500">時尚</button>
      <button class="px-3 py-1 rounded-full bg-gray-100 text-gray-500">生活</button>
      <button class="px-3 py-1 rounded-full bg-gray-100 text-gray-500">科技</button>
      <button class="px-3 py-1 rounded-full bg-gray-100 text-gray-500">文化</button>
    </div>
  </div>
  <div class="grid grid-cols-3 gap-6">
    <div class="article-card">
      <div class="h-44 rounded-xl bg-gradient-to-br from-violet-200 to-purple-300 overflow-hidden flex items-center justify-center mb-3"><div class="article-img text-5xl">👗</div></div>
      <span class="text-xs text-rose-500 font-medium">時尚</span>
      <h3 class="serif font-bold text-gray-800 mt-1">永續時尚不只是口號：5 個正在改變產業的品牌</h3>
      <p class="text-xs text-gray-400 mt-1.5 line-clamp-2">當快時尚的代價越來越明顯，這些品牌用行動證明...</p>
      <div class="text-xs text-gray-400 mt-2">Feb 14 · 4 min</div>
    </div>
    <div class="article-card">
      <div class="h-44 rounded-xl bg-gradient-to-br from-emerald-200 to-teal-300 overflow-hidden flex items-center justify-center mb-3"><div class="article-img text-5xl">🏠</div></div>
      <span class="text-xs text-emerald-500 font-medium">生活</span>
      <h3 class="serif font-bold text-gray-800 mt-1">斷捨離之後：極簡生活的 365 天實踐報告</h3>
      <p class="text-xs text-gray-400 mt-1.5 line-clamp-2">丟掉了 80% 的物品後，生活真的變得更好嗎？</p>
      <div class="text-xs text-gray-400 mt-2">Feb 12 · 7 min</div>
    </div>
    <div class="article-card">
      <div class="h-44 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden flex items-center justify-center mb-3"><div class="article-img text-5xl">🎬</div></div>
      <span class="text-xs text-gray-500 font-medium">文化</span>
      <h3 class="serif font-bold text-gray-800 mt-1">獨立電影的黃金時代：亞洲新銳導演巡禮</h3>
      <p class="text-xs text-gray-400 mt-1.5 line-clamp-2">從韓國到泰國，這些新一代導演正在創造全新的...</p>
      <div class="text-xs text-gray-400 mt-2">Feb 10 · 5 min</div>
    </div>
  </div>
</section>

<!-- Subscribe -->
<section class="bg-black text-white py-12">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <h2 class="serif text-2xl font-bold mb-2">不錯過每一個趨勢</h2>
    <p class="text-gray-400 text-sm mb-6">訂閱 TrendMag，每週收到精選專題與獨家觀點</p>
    <div class="flex gap-2 max-w-md mx-auto"><input type="email" placeholder="your@email.com" class="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm outline-none"><button class="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition">訂閱</button></div>
  </div>
</section>

<footer class="bg-gray-50 py-8 border-t border-gray-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
    <span class="serif font-bold text-gray-600">TREND<span class="text-rose-500">MAG</span></span>
    <span class="text-xs">© 2026 潮流誌 TrendMag</span>
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
