INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '79be9580-07a3-4824-b1c9-1013554d57f4',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>維度空間 DimensionLab</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
* { font-family: 'Space Grotesk', sans-serif; }
body { background: #0a0a0f; color: #e2e8f0; }
.project-card { transition: all 0.4s; cursor: pointer; }
.project-card:hover { transform: translateY(-6px) scale(1.02); }
.project-card:hover .overlay { opacity: 1; }
.overlay { opacity: 0; transition: opacity 0.3s; }
.glow-text { text-shadow: 0 0 30px rgba(56,189,248,0.4); }
.grid-bg { background-image: linear-gradient(rgba(56,189,248,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.05) 1px, transparent 1px); background-size: 40px 40px; }
</style>
</head>
<body>
<nav class="fixed top-0 w-full z-50 bg-black/80 backdrop-blur border-b border-white/5">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><div class="w-7 h-7 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white">3D</div><span class="font-semibold tracking-tight">DimensionLab</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-400"><a class="hover:text-cyan-400 transition cursor-pointer">作品</a><a class="hover:text-cyan-400 transition cursor-pointer">技術</a><a class="hover:text-cyan-400 transition cursor-pointer">關於</a><button class="border border-cyan-400 text-cyan-400 px-4 py-1.5 rounded-full text-sm hover:bg-cyan-400 hover:text-black transition">合作邀約</button></div>
  </div>
</nav>

<section class="min-h-[80vh] flex items-center relative overflow-hidden grid-bg pt-14">
  <div class="absolute top-20 right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]"></div>
  <div class="absolute bottom-10 left-20 w-60 h-60 bg-violet-500/10 rounded-full blur-[80px]"></div>
  <div class="max-w-6xl mx-auto px-6 relative">
    <div class="max-w-xl">
      <span class="text-xs text-cyan-400 tracking-widest uppercase">3D Artist & Technical Director</span>
      <h1 class="text-5xl font-bold mt-4 mb-4 glow-text">用三維空間<br>講述故事</h1>
      <p class="text-gray-400 leading-relaxed mb-8">專注於 CGI、產品視覺化與動態圖形設計。8 年業界經驗，合作品牌包含 Nike、Apple、Sony。</p>
      <div class="flex gap-4">
        <button class="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition">查看作品</button>
        <button class="border border-white/20 text-white px-8 py-3 rounded-full hover:border-white/40 transition">Showreel ▶</button>
      </div>
      <div class="flex gap-8 mt-10 text-sm">
        <div><div class="text-2xl font-bold text-white">50+</div><div class="text-xs text-gray-500">商業專案</div></div>
        <div class="w-px h-10 bg-white/10"></div>
        <div><div class="text-2xl font-bold text-white">8</div><div class="text-xs text-gray-500">年經驗</div></div>
        <div class="w-px h-10 bg-white/10"></div>
        <div><div class="text-2xl font-bold text-white">12</div><div class="text-xs text-gray-500">獲獎紀錄</div></div>
      </div>
    </div>
  </div>
</section>

<section class="py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between mb-8"><h2 class="text-2xl font-bold">精選作品</h2><div class="flex gap-2 text-xs"><button class="px-3 py-1 rounded-full bg-cyan-500 text-white font-medium">全部</button><button class="px-3 py-1 rounded-full bg-white/5 text-gray-400">產品</button><button class="px-3 py-1 rounded-full bg-white/5 text-gray-400">建築</button><button class="px-3 py-1 rounded-full bg-white/5 text-gray-400">動態</button></div></div>
    <div class="grid grid-cols-3 gap-5">
      <div class="project-card rounded-2xl overflow-hidden relative aspect-[4/3] bg-gradient-to-br from-indigo-900 to-violet-800 flex items-center justify-center text-6xl"><span>🎧</span><div class="overlay absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-5"><div><span class="text-xs text-cyan-400 font-medium">產品視覺化</span><h3 class="font-bold mt-1">Sony WH-1000XM6</h3><p class="text-xs text-gray-400 mt-0.5">產品 3D 渲染 · Cinema 4D</p></div></div></div>
      <div class="project-card rounded-2xl overflow-hidden relative aspect-[4/3] bg-gradient-to-br from-orange-900 to-amber-800 flex items-center justify-center text-6xl"><span>👟</span><div class="overlay absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-5"><div><span class="text-xs text-cyan-400 font-medium">產品動畫</span><h3 class="font-bold mt-1">Nike Air Max 2026</h3><p class="text-xs text-gray-400 mt-0.5">分解動畫 · Blender + AE</p></div></div></div>
      <div class="project-card rounded-2xl overflow-hidden relative aspect-[4/3] bg-gradient-to-br from-cyan-900 to-teal-800 flex items-center justify-center text-6xl"><span>🏢</span><div class="overlay absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-5"><div><span class="text-xs text-cyan-400 font-medium">建築視覺化</span><h3 class="font-bold mt-1">未來城市概念</h3><p class="text-xs text-gray-400 mt-0.5">環境設計 · Unreal Engine 5</p></div></div></div>
      <div class="project-card rounded-2xl overflow-hidden relative aspect-[4/3] bg-gradient-to-br from-rose-900 to-pink-800 flex items-center justify-center text-6xl"><span>🍎</span><div class="overlay absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-5"><div><span class="text-xs text-cyan-400 font-medium">產品 CGI</span><h3 class="font-bold mt-1">Apple Vision Pro</h3><p class="text-xs text-gray-400 mt-0.5">場景渲染 · Octane + C4D</p></div></div></div>
      <div class="project-card rounded-2xl overflow-hidden relative aspect-[4/3] bg-gradient-to-br from-emerald-900 to-green-800 flex items-center justify-center text-6xl"><span>🚗</span><div class="overlay absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-5"><div><span class="text-xs text-cyan-400 font-medium">汽車 CGI</span><h3 class="font-bold mt-1">Porsche 911 GT3</h3><p class="text-xs text-gray-400 mt-0.5">汽車渲染 · Redshift</p></div></div></div>
      <div class="project-card rounded-2xl overflow-hidden relative aspect-[4/3] bg-gradient-to-br from-purple-900 to-fuchsia-800 flex items-center justify-center text-6xl"><span>💎</span><div class="overlay absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-5"><div><span class="text-xs text-cyan-400 font-medium">動態圖形</span><h3 class="font-bold mt-1">品牌識別動畫</h3><p class="text-xs text-gray-400 mt-0.5">MoGraph · After Effects</p></div></div></div>
    </div>
  </div>
</section>

<section class="py-16 border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-2xl font-bold mb-8 text-center">技術棧</h2>
    <div class="grid grid-cols-6 gap-4">
      <div class="bg-white/5 rounded-xl p-4 text-center border border-white/5 hover:border-cyan-500/30 transition"><div class="text-2xl mb-1">🎨</div><div class="text-xs text-gray-400">Cinema 4D</div></div>
      <div class="bg-white/5 rounded-xl p-4 text-center border border-white/5 hover:border-cyan-500/30 transition"><div class="text-2xl mb-1">🔥</div><div class="text-xs text-gray-400">Blender</div></div>
      <div class="bg-white/5 rounded-xl p-4 text-center border border-white/5 hover:border-cyan-500/30 transition"><div class="text-2xl mb-1">🎮</div><div class="text-xs text-gray-400">Unreal Engine</div></div>
      <div class="bg-white/5 rounded-xl p-4 text-center border border-white/5 hover:border-cyan-500/30 transition"><div class="text-2xl mb-1">✨</div><div class="text-xs text-gray-400">Houdini</div></div>
      <div class="bg-white/5 rounded-xl p-4 text-center border border-white/5 hover:border-cyan-500/30 transition"><div class="text-2xl mb-1">🎬</div><div class="text-xs text-gray-400">After Effects</div></div>
      <div class="bg-white/5 rounded-xl p-4 text-center border border-white/5 hover:border-cyan-500/30 transition"><div class="text-2xl mb-1">💡</div><div class="text-xs text-gray-400">Substance</div></div>
    </div>
  </div>
</section>

<section class="bg-gradient-to-r from-cyan-600 to-blue-700 py-12 text-center">
  <h2 class="text-2xl font-bold mb-2">有專案想要合作？</h2>
  <p class="text-white/70 text-sm mb-6">無論是產品視覺化、品牌動畫或建築渲染，歡迎聊聊</p>
  <button class="bg-white text-cyan-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition">開始對話 →</button>
</section>

<footer class="border-t border-white/5 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-gray-500">
    <span>© 2026 DimensionLab</span>
    <div class="flex gap-4"><a class="hover:text-cyan-400 transition cursor-pointer">Behance</a><a class="hover:text-cyan-400 transition cursor-pointer">ArtStation</a><a class="hover:text-cyan-400 transition cursor-pointer">Instagram</a></div>
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
