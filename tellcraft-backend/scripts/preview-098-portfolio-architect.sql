INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '7d17ee32-fe2b-46cb-b172-5941f55ee991',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>構思集 ArchiWorks</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { arch: { 50:'#f5f5f4',100:'#e7e5e4',200:'#d6d3d1',400:'#a8a29e',500:'#78716c',600:'#57534e',800:'#292524',900:'#1c1917' } } } } } }
</script>
<style>
body { font-family: 'DM Sans', sans-serif; background: #fafaf9; }
.serif { font-family: 'Cormorant Garamond', serif; }
.project-card { transition: all 0.4s; cursor: pointer; }
.project-card:hover { transform: scale(1.02); }
.project-card:hover .overlay { opacity: 1; }
.overlay { opacity: 0; transition: opacity 0.3s; }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-3"><div class="w-8 h-8 border-2 border-arch-800 flex items-center justify-center"><div class="w-4 h-4 border border-arch-800"></div></div><span class="serif text-xl font-bold text-arch-900 tracking-wide">ArchiWorks</span></div>
    <div class="flex items-center gap-8 text-sm text-gray-500">
      <a class="hover:text-arch-900 transition cursor-pointer">作品</a>
      <a class="hover:text-arch-900 transition cursor-pointer">理念</a>
      <a class="hover:text-arch-900 transition cursor-pointer">團隊</a>
      <a class="hover:text-arch-900 transition cursor-pointer">獎項</a>
      <button class="border border-arch-800 text-arch-800 px-5 py-2 text-sm hover:bg-arch-800 hover:text-white transition">聯繫我們</button>
    </div>
  </div>
</nav>

<section class="py-24 relative">
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-16">
    <div class="flex-1">
      <span class="text-xs text-arch-500 tracking-[0.3em] uppercase">Architecture · Interior · Landscape</span>
      <h1 class="serif text-5xl font-bold text-arch-900 leading-tight mt-4 mb-6">以空間為語言<br>書寫生活的詩</h1>
      <p class="text-gray-500 leading-relaxed max-w-md mb-8">構思集建築事務所，成立於 2015 年。我們相信好的建築不只是造型，而是對生活方式的深刻理解。從住宅、商空到公共建築，每個專案都是一次與土地的對話。</p>
      <div class="flex gap-8 text-sm">
        <div><div class="text-3xl font-bold text-arch-900 serif">38</div><div class="text-xs text-gray-400 mt-1">完成專案</div></div>
        <div class="w-px h-12 bg-gray-200"></div>
        <div><div class="text-3xl font-bold text-arch-900 serif">11</div><div class="text-xs text-gray-400 mt-1">年經驗</div></div>
        <div class="w-px h-12 bg-gray-200"></div>
        <div><div class="text-3xl font-bold text-arch-900 serif">7</div><div class="text-xs text-gray-400 mt-1">設計獎項</div></div>
      </div>
    </div>
    <div class="w-96 h-[28rem] bg-gradient-to-b from-arch-100 to-arch-200 rounded-sm flex items-center justify-center text-8xl shadow-lg">🏛️</div>
  </div>
</section>

<section class="py-16 bg-arch-900 text-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between mb-10"><h2 class="serif text-3xl font-bold">精選作品</h2><div class="flex gap-2 text-xs"><button class="px-4 py-1.5 border border-white text-white font-medium">全部</button><button class="px-4 py-1.5 border border-white/20 text-gray-400 hover:border-white/40">住宅</button><button class="px-4 py-1.5 border border-white/20 text-gray-400 hover:border-white/40">商空</button><button class="px-4 py-1.5 border border-white/20 text-gray-400 hover:border-white/40">公共</button></div></div>
    <div class="grid grid-cols-3 gap-4">
      <div class="project-card col-span-2 row-span-2 relative aspect-[4/3] bg-gradient-to-br from-stone-700 to-stone-800 rounded-sm overflow-hidden flex items-center justify-center text-7xl">🏠<div class="overlay absolute inset-0 bg-black/60 flex items-end p-6"><div><span class="text-xs text-amber-300 font-medium tracking-wider uppercase">住宅</span><h3 class="serif text-2xl font-bold mt-1">山居歲月</h3><p class="text-sm text-gray-300 mt-1">陽明山 · 清水模住宅 · 420 坪</p></div></div></div>
      <div class="project-card relative aspect-square bg-gradient-to-br from-amber-700 to-amber-800 rounded-sm overflow-hidden flex items-center justify-center text-5xl">☕<div class="overlay absolute inset-0 bg-black/60 flex items-end p-4"><div><span class="text-[10px] text-amber-300 tracking-wider uppercase">商空</span><h3 class="serif text-lg font-bold mt-1">沈默咖啡</h3><p class="text-xs text-gray-300 mt-0.5">大安區 · 45 坪</p></div></div></div>
      <div class="project-card relative aspect-square bg-gradient-to-br from-slate-600 to-slate-700 rounded-sm overflow-hidden flex items-center justify-center text-5xl">📚<div class="overlay absolute inset-0 bg-black/60 flex items-end p-4"><div><span class="text-[10px] text-amber-300 tracking-wider uppercase">公共</span><h3 class="serif text-lg font-bold mt-1">光之圖書館</h3><p class="text-xs text-gray-300 mt-0.5">新竹 · 1,200 坪</p></div></div></div>
      <div class="project-card relative aspect-[2/1] bg-gradient-to-br from-emerald-700 to-emerald-800 rounded-sm overflow-hidden flex items-center justify-center text-5xl">🏢<div class="overlay absolute inset-0 bg-black/60 flex items-end p-4"><div><span class="text-[10px] text-amber-300 tracking-wider uppercase">商空</span><h3 class="serif text-lg font-bold mt-1">未來辦公室</h3><p class="text-xs text-gray-300 mt-0.5">內湖科技園區 · 800 坪</p></div></div></div>
      <div class="project-card relative aspect-[2/1] bg-gradient-to-br from-rose-700 to-rose-800 rounded-sm overflow-hidden flex items-center justify-center text-5xl">🏡<div class="overlay absolute inset-0 bg-black/60 flex items-end p-4"><div><span class="text-[10px] text-amber-300 tracking-wider uppercase">住宅</span><h3 class="serif text-lg font-bold mt-1">浮光之家</h3><p class="text-xs text-gray-300 mt-0.5">淡水 · 透天厝 · 280 坪</p></div></div></div>
    </div>
  </div>
</section>

<section class="py-16">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold text-arch-900 mb-8 text-center">設計理念</h2>
    <div class="grid grid-cols-3 gap-8">
      <div class="text-center"><div class="w-16 h-16 rounded-full border-2 border-arch-800 flex items-center justify-center mx-auto mb-4 text-2xl">🌿</div><h3 class="font-bold text-arch-900">與自然共生</h3><p class="text-xs text-gray-500 mt-2 leading-relaxed">尊重基地環境，讓建築融入地景而非對抗。</p></div>
      <div class="text-center"><div class="w-16 h-16 rounded-full border-2 border-arch-800 flex items-center justify-center mx-auto mb-4 text-2xl">💡</div><h3 class="font-bold text-arch-900">光線即素材</h3><p class="text-xs text-gray-500 mt-2 leading-relaxed">以自然光為核心設計元素，創造會呼吸的空間。</p></div>
      <div class="text-center"><div class="w-16 h-16 rounded-full border-2 border-arch-800 flex items-center justify-center mx-auto mb-4 text-2xl">🪨</div><h3 class="font-bold text-arch-900">誠實的材料</h3><p class="text-xs text-gray-500 mt-2 leading-relaxed">清水模、實木、石材，讓材料說自己的語言。</p></div>
    </div>
  </div>
</section>

<section class="bg-arch-800 text-white py-12 text-center">
  <h2 class="serif text-2xl font-bold mb-2">有想法想聊聊？</h2>
  <p class="text-gray-400 text-sm mb-6">無論是住宅、商空或公共建築，歡迎預約諮詢</p>
  <button class="border border-white text-white px-10 py-3 hover:bg-white hover:text-arch-900 transition font-medium">預約諮詢</button>
</section>

<footer class="py-8 border-t border-gray-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
    <div class="flex items-center gap-2"><div class="w-5 h-5 border border-arch-800 flex items-center justify-center"><div class="w-2.5 h-2.5 border border-arch-800"></div></div><span class="serif font-bold text-gray-600">ArchiWorks</span></div>
    <div>© 2026 構思集建築事務所 · 台北市大安區敦化南路一段 233 號 8F</div>
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
