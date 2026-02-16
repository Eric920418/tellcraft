INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '0bb24602-c68b-4ec8-bff1-9e35e7e888dc',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>醇酒莊園 VineyardVista</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        wine: { 50:'#fdf2f8', 100:'#fce7f3', 300:'#c084a0', 500:'#8b1a4a', 600:'#6d1438', 700:'#4c0d28', 800:'#3a0a1e', 900:'#2a0716' },
        gold: { 200:'#fde68a', 300:'#fcd34d', 400:'#fbbf24', 500:'#d4a843' }
      }
    }
  }
}
</script>
<style>
body { font-family: 'Lato', sans-serif; }
.serif { font-family: 'Playfair Display', serif; }
.wine-card { transition: all 0.3s; cursor: pointer; }
.wine-card:hover { transform: translateY(-4px); }
.divider { width: 60px; height: 1px; background: linear-gradient(to right, transparent, #d4a843, transparent); }
</style>
</head>
<body class="bg-wine-900 text-white">

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-wine-900/90 backdrop-blur border-b border-white/5">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-2">
      <span class="text-xl">🍷</span>
      <span class="serif text-lg font-semibold tracking-wider">VINEYARD<span class="text-gold-400">VISTA</span></span>
    </div>
    <div class="flex items-center gap-8 text-sm text-gray-300 tracking-wide">
      <a href="#wines" class="hover:text-gold-400 transition cursor-pointer">酒款</a>
      <a href="#estate" class="hover:text-gold-400 transition cursor-pointer">莊園</a>
      <a href="#experience" class="hover:text-gold-400 transition cursor-pointer">品酒</a>
      <a class="hover:text-gold-400 transition cursor-pointer">故事</a>
      <button class="border border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-wine-900 px-5 py-1.5 text-sm transition tracking-wider">預約品酒</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="min-h-screen flex items-center relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-r from-wine-900 via-wine-900/80 to-transparent z-10"></div>
  <div class="absolute inset-0 bg-gradient-to-br from-wine-800 to-wine-700 opacity-60"></div>
  <div class="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full bg-gradient-to-br from-purple-900/30 to-rose-900/30 blur-[60px]"></div>
  <div class="max-w-6xl mx-auto px-6 relative z-20">
    <div class="max-w-lg">
      <div class="divider mb-6"></div>
      <span class="text-xs tracking-[0.3em] text-gold-400 uppercase">Since 1982 · Napa Valley</span>
      <h1 class="serif text-5xl font-bold leading-tight mt-4 mb-5">每一滴<br>都是時間的<br>藝術品</h1>
      <p class="text-gray-300 leading-relaxed mb-8 text-sm">坐落於陽光充沛的山谷中，四十年來堅持手工採摘、橡木桶陳釀，釀造出細膩而深邃的頂級葡萄酒。</p>
      <div class="flex gap-4">
        <button class="bg-gold-500 hover:bg-gold-400 text-wine-900 px-8 py-3 text-sm font-bold tracking-wider transition">探索酒款</button>
        <button class="border border-white/30 hover:border-white/50 text-white px-8 py-3 text-sm tracking-wider transition">莊園巡禮</button>
      </div>
    </div>
  </div>
</section>

<!-- Wines -->
<section id="wines" class="py-20 bg-gradient-to-b from-wine-900 to-wine-800">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-12">
      <div class="divider mx-auto mb-4"></div>
      <h2 class="serif text-3xl font-bold">精選酒款</h2>
      <p class="text-sm text-gray-400 mt-2">從輕盈果香到醇厚陳年，每一款都是匠心之作</p>
    </div>
    <div class="grid grid-cols-3 gap-8">
      <div class="wine-card text-center group">
        <div class="h-64 rounded-2xl bg-gradient-to-b from-wine-700 to-wine-800 border border-white/5 flex items-center justify-center mb-4 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-t from-wine-900/80 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
          <span class="text-7xl">🍾</span>
        </div>
        <span class="text-xs text-gold-400 tracking-widest uppercase">Cabernet Sauvignon</span>
        <h3 class="serif text-xl font-semibold mt-1">黑醋栗之夜</h3>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">深邃紅寶石色，黑醋栗與雪松香氣，單寧細緻綿長。</p>
        <div class="text-gold-400 font-bold mt-3">NT$ 2,800</div>
      </div>
      <div class="wine-card text-center group">
        <div class="h-64 rounded-2xl bg-gradient-to-b from-wine-700 to-wine-800 border border-white/5 flex items-center justify-center mb-4 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-t from-wine-900/80 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
          <span class="text-7xl">🥂</span>
        </div>
        <span class="text-xs text-gold-400 tracking-widest uppercase">Chardonnay</span>
        <h3 class="serif text-xl font-semibold mt-1">金色晨光</h3>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">淡金色澤，白桃與烤杏仁香，優雅的奶油質感。</p>
        <div class="text-gold-400 font-bold mt-3">NT$ 1,980</div>
      </div>
      <div class="wine-card text-center group">
        <div class="h-64 rounded-2xl bg-gradient-to-b from-wine-700 to-wine-800 border border-white/5 flex items-center justify-center mb-4 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-t from-wine-900/80 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
          <span class="text-7xl">🍷</span>
          <span class="absolute top-3 right-3 text-xs bg-gold-500 text-wine-900 px-2 py-0.5 rounded-full font-bold">限量</span>
        </div>
        <span class="text-xs text-gold-400 tracking-widest uppercase">Reserve Blend</span>
        <h3 class="serif text-xl font-semibold mt-1">莊主典藏</h3>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">三年橡木桶陳釀，複雜而圓潤，絲絨般的餘韻。</p>
        <div class="text-gold-400 font-bold mt-3">NT$ 5,800</div>
      </div>
    </div>
  </div>
</section>

<!-- Estate -->
<section id="estate" class="py-20 bg-wine-800">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-2 gap-16 items-center">
      <div class="h-80 rounded-2xl bg-gradient-to-br from-emerald-900/40 to-green-800/30 border border-white/5 flex items-center justify-center text-8xl">🏡</div>
      <div>
        <div class="divider mb-4"></div>
        <h2 class="serif text-3xl font-bold mb-4">莊園故事</h2>
        <p class="text-gray-300 leading-relaxed mb-4 text-sm">1982 年，創辦人陳世昌先生在加州 Napa Valley 種下第一株葡萄藤。四十年的光陰，從一片荒地到如今 50 公頃的葡萄園，每一瓶酒都承載著對土地的敬畏與對品質的堅持。</p>
        <div class="grid grid-cols-3 gap-4 mt-6">
          <div class="text-center"><div class="serif text-2xl font-bold text-gold-400">40+</div><div class="text-xs text-gray-500">年歷史</div></div>
          <div class="text-center"><div class="serif text-2xl font-bold text-gold-400">50</div><div class="text-xs text-gray-500">公頃葡萄園</div></div>
          <div class="text-center"><div class="serif text-2xl font-bold text-gold-400">12</div><div class="text-xs text-gray-500">獲獎酒款</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Experience -->
<section id="experience" class="py-20 bg-wine-900">
  <div class="max-w-6xl mx-auto px-6 text-center">
    <div class="divider mx-auto mb-4"></div>
    <h2 class="serif text-3xl font-bold mb-10">品酒體驗</h2>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-gold-400/30 transition cursor-pointer">
        <div class="text-3xl mb-3">🥂</div>
        <h3 class="serif text-lg font-semibold mb-1">經典品酒</h3>
        <p class="text-xs text-gray-400 mb-3">品嚐 5 款精選酒款<br>專業侍酒師導覽</p>
        <div class="text-gold-400 font-bold">NT$ 800 / 人</div>
      </div>
      <div class="bg-white/5 border border-gold-400/30 rounded-2xl p-6 relative cursor-pointer">
        <span class="absolute -top-2 right-4 text-xs bg-gold-500 text-wine-900 px-2 py-0.5 rounded-full font-bold">推薦</span>
        <div class="text-3xl mb-3">🍽️</div>
        <h3 class="serif text-lg font-semibold mb-1">佐餐品酒</h3>
        <p class="text-xs text-gray-400 mb-3">四道式餐酒搭配<br>主廚特製菜單</p>
        <div class="text-gold-400 font-bold">NT$ 2,500 / 人</div>
      </div>
      <div class="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-gold-400/30 transition cursor-pointer">
        <div class="text-3xl mb-3">🏡</div>
        <h3 class="serif text-lg font-semibold mb-1">莊園巡禮</h3>
        <p class="text-xs text-gray-400 mb-3">葡萄園導覽 + 酒窖參觀<br>含品酒三款</p>
        <div class="text-gold-400 font-bold">NT$ 1,200 / 人</div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-wine-900 border-t border-white/5 py-10">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2"><span>🍷</span><span class="serif font-semibold tracking-wider">VINEYARD<span class="text-gold-400">VISTA</span></span></div>
      <div class="text-xs text-gray-500">© 2026 醇酒莊園 VineyardVista · 未滿 18 歲禁止飲酒</div>
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
