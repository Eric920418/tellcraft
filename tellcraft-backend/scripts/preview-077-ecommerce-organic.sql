INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'b26b23e6-3068-4c9e-9938-3bf428000d72',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>有機良品 OrganicGood</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: { extend: { fontFamily: { nunito: ['Nunito','sans-serif'] }, colors: { leaf: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d' }, soil: { 400:'#a07d4a',500:'#8b6b3a',600:'#6d5230' } } } }
}
</script>
<style>
* { font-family: 'Nunito', sans-serif; }
body { background: #f7faf3; }
.product-card { transition: all 0.3s; cursor: pointer; }
.product-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(22,163,74,0.1); }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-green-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><span class="text-xl">🌱</span><span class="text-lg font-extrabold text-leaf-700">OrganicGood</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-500">
      <a class="hover:text-leaf-600 transition cursor-pointer">蔬果</a>
      <a class="hover:text-leaf-600 transition cursor-pointer">穀物</a>
      <a class="hover:text-leaf-600 transition cursor-pointer">飲品</a>
      <a class="hover:text-leaf-600 transition cursor-pointer">訂閱箱</a>
      <div class="relative cursor-pointer"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg><span class="absolute -top-1 -right-1 w-4 h-4 bg-leaf-500 text-white text-[10px] rounded-full flex items-center justify-center">3</span></div>
    </div>
  </div>
</nav>

<section class="py-14 bg-gradient-to-br from-green-50 via-lime-50 to-amber-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-12">
    <div class="flex-1">
      <div class="inline-flex items-center gap-1 bg-leaf-100 text-leaf-700 px-3 py-1 rounded-full text-xs font-bold mb-4">🏆 有機認證 · 產地直送</div>
      <h1 class="text-4xl font-extrabold text-gray-800 leading-snug mb-3">新鮮有機<br>從產地到餐桌</h1>
      <p class="text-gray-500 mb-6 text-sm leading-relaxed max-w-md">嚴選全台小農有機作物，48 小時內從產地直送到你家。無農藥、無化肥，吃得安心。</p>
      <div class="flex gap-3">
        <button class="bg-leaf-600 hover:bg-leaf-700 text-white px-7 py-3 rounded-full text-sm font-bold transition">立即選購</button>
        <button class="border border-leaf-600 text-leaf-600 hover:bg-leaf-600 hover:text-white px-7 py-3 rounded-full text-sm font-bold transition">訂閱方案</button>
      </div>
    </div>
    <div class="w-72 h-72 rounded-3xl bg-gradient-to-br from-green-200 to-lime-300 flex items-center justify-center text-8xl shadow-lg shadow-green-100">🥬</div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-10">
  <div class="grid grid-cols-4 gap-3">
    <div class="bg-white rounded-xl p-4 text-center border border-green-50 hover:border-leaf-300 transition cursor-pointer"><div class="text-3xl mb-1">🥦</div><div class="text-xs font-bold text-gray-600">有機蔬菜</div></div>
    <div class="bg-white rounded-xl p-4 text-center border border-green-50 hover:border-leaf-300 transition cursor-pointer"><div class="text-3xl mb-1">🍎</div><div class="text-xs font-bold text-gray-600">當季水果</div></div>
    <div class="bg-white rounded-xl p-4 text-center border border-green-50 hover:border-leaf-300 transition cursor-pointer"><div class="text-3xl mb-1">🌾</div><div class="text-xs font-bold text-gray-600">穀物雜糧</div></div>
    <div class="bg-white rounded-xl p-4 text-center border border-green-50 hover:border-leaf-300 transition cursor-pointer"><div class="text-3xl mb-1">🧃</div><div class="text-xs font-bold text-gray-600">健康飲品</div></div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 pb-12">
  <h2 class="text-xl font-extrabold text-gray-800 mb-6">🛒 人氣商品</h2>
  <div class="grid grid-cols-4 gap-4">
    <div class="product-card bg-white rounded-xl overflow-hidden border border-green-50">
      <div class="h-36 bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center text-5xl relative"><span>🥬</span><span class="absolute top-2 left-2 text-[10px] bg-leaf-500 text-white px-2 py-0.5 rounded-full font-bold">有機認證</span></div>
      <div class="p-3"><div class="text-xs text-gray-400">雲林小農</div><h3 class="font-bold text-gray-800 text-sm">有機大白菜</h3><div class="flex items-center justify-between mt-2"><span class="text-leaf-600 font-extrabold">NT$ 85</span><button class="w-7 h-7 rounded-full bg-leaf-50 text-leaf-600 flex items-center justify-center hover:bg-leaf-500 hover:text-white transition text-xs">+</button></div></div>
    </div>
    <div class="product-card bg-white rounded-xl overflow-hidden border border-green-50">
      <div class="h-36 bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center text-5xl relative"><span>🍎</span><span class="absolute top-2 left-2 text-[10px] bg-leaf-500 text-white px-2 py-0.5 rounded-full font-bold">當季</span></div>
      <div class="p-3"><div class="text-xs text-gray-400">台中梨山</div><h3 class="font-bold text-gray-800 text-sm">蜜富士蘋果 5入</h3><div class="flex items-center justify-between mt-2"><span class="text-leaf-600 font-extrabold">NT$ 320</span><button class="w-7 h-7 rounded-full bg-leaf-50 text-leaf-600 flex items-center justify-center hover:bg-leaf-500 hover:text-white transition text-xs">+</button></div></div>
    </div>
    <div class="product-card bg-white rounded-xl overflow-hidden border border-green-50">
      <div class="h-36 bg-gradient-to-br from-amber-100 to-yellow-200 flex items-center justify-center text-5xl"><span>🌾</span></div>
      <div class="p-3"><div class="text-xs text-gray-400">花蓮富里</div><h3 class="font-bold text-gray-800 text-sm">有機糙米 2kg</h3><div class="flex items-center justify-between mt-2"><span class="text-leaf-600 font-extrabold">NT$ 280</span><button class="w-7 h-7 rounded-full bg-leaf-50 text-leaf-600 flex items-center justify-center hover:bg-leaf-500 hover:text-white transition text-xs">+</button></div></div>
    </div>
    <div class="product-card bg-white rounded-xl overflow-hidden border border-green-50">
      <div class="h-36 bg-gradient-to-br from-green-100 to-lime-200 flex items-center justify-center text-5xl"><span>🧃</span></div>
      <div class="p-3"><div class="text-xs text-gray-400">南投埔里</div><h3 class="font-bold text-gray-800 text-sm">冷壓蔬果汁 6瓶</h3><div class="flex items-center justify-between mt-2"><span class="text-leaf-600 font-extrabold">NT$ 580</span><button class="w-7 h-7 rounded-full bg-leaf-50 text-leaf-600 flex items-center justify-center hover:bg-leaf-500 hover:text-white transition text-xs">+</button></div></div>
    </div>
  </div>
</section>

<section class="bg-leaf-700 text-white py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-8"><h2 class="text-2xl font-extrabold mb-1">📦 有機訂閱箱</h2><p class="text-white/70 text-sm">每週配送當季有機蔬果，省時省力吃得健康</p></div>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-white/10 rounded-xl p-5 text-center border border-white/10 hover:border-white/30 transition cursor-pointer">
        <div class="text-2xl mb-2">🥗</div><h3 class="font-bold">輕食箱</h3><p class="text-xs text-white/60 mt-1">5 種蔬菜 + 2 種水果</p><div class="text-xl font-extrabold mt-3">NT$ 599<span class="text-sm font-normal text-white/50">/週</span></div>
      </div>
      <div class="bg-white/10 rounded-xl p-5 text-center border border-white/30 relative cursor-pointer">
        <span class="absolute -top-2 right-4 text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">最熱門</span>
        <div class="text-2xl mb-2">🥘</div><h3 class="font-bold">家庭箱</h3><p class="text-xs text-white/60 mt-1">8 種蔬菜 + 3 種水果 + 穀物</p><div class="text-xl font-extrabold mt-3">NT$ 999<span class="text-sm font-normal text-white/50">/週</span></div>
      </div>
      <div class="bg-white/10 rounded-xl p-5 text-center border border-white/10 hover:border-white/30 transition cursor-pointer">
        <div class="text-2xl mb-2">🍱</div><h3 class="font-bold">豐盛箱</h3><p class="text-xs text-white/60 mt-1">12 種蔬果 + 穀物 + 飲品</p><div class="text-xl font-extrabold mt-3">NT$ 1,499<span class="text-sm font-normal text-white/50">/週</span></div>
      </div>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-12">
  <h2 class="text-xl font-extrabold text-gray-800 mb-6">🍳 食譜推薦</h2>
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-white rounded-xl p-4 border border-green-50 hover:shadow-md transition cursor-pointer">
      <div class="text-2xl mb-2">🥗</div><h3 class="font-bold text-gray-800 text-sm">有機蔬菜溫沙拉</h3><p class="text-xs text-gray-400 mt-1">15 分鐘 · 簡單</p>
    </div>
    <div class="bg-white rounded-xl p-4 border border-green-50 hover:shadow-md transition cursor-pointer">
      <div class="text-2xl mb-2">🥣</div><h3 class="font-bold text-gray-800 text-sm">南瓜糙米粥</h3><p class="text-xs text-gray-400 mt-1">40 分鐘 · 簡單</p>
    </div>
    <div class="bg-white rounded-xl p-4 border border-green-50 hover:shadow-md transition cursor-pointer">
      <div class="text-2xl mb-2">🥤</div><h3 class="font-bold text-gray-800 text-sm">綠拿鐵蔬果昔</h3><p class="text-xs text-gray-400 mt-1">5 分鐘 · 簡單</p>
    </div>
  </div>
</section>

<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
    <div class="flex items-center gap-2"><span>🌱</span><span class="text-white font-bold">OrganicGood</span></div>
    <div class="text-xs">© 2026 有機良品 · 用心耕作 · 安心食用</div>
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
