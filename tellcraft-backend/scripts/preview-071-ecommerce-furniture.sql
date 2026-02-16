INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '56fc4e15-23fd-4738-8a1b-f63aac7ab827',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>木質生活 WoodLife</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        wood: { 50:'#fdf8f0', 100:'#f5ead6', 200:'#e8d5b0', 300:'#d4b580', 400:'#c49a5c', 500:'#a07d4a', 600:'#7a5e38' },
        oak: { 800:'#3d2e1f', 900:'#2a1f15' }
      }
    }
  }
}
</script>
<style>
body { font-family: 'DM Sans', sans-serif; background: #fdf8f0; }
.serif { font-family: 'Cormorant Garamond', serif; }
.product-card { transition: all 0.35s; cursor: pointer; }
.product-card:hover { transform: translateY(-4px); }
.product-card:hover .product-img { transform: scale(1.05); }
.product-img { transition: transform 0.5s; }
.cat-btn { transition: all 0.2s; cursor: pointer; }
.cat-btn:hover, .cat-btn.active { border-color: #a07d4a; color: #a07d4a; }
</style>
</head>
<body>

<!-- Nav -->
<nav class="sticky top-0 z-40 bg-wood-50/95 backdrop-blur border-b border-wood-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-2">
      <svg class="w-6 h-6 text-wood-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M9 22V12h6v10"/></svg>
      <span class="serif text-xl font-semibold text-oak-800 tracking-wide">WoodLife</span>
    </div>
    <div class="flex items-center gap-8 text-sm text-gray-600">
      <a class="hover:text-wood-500 transition cursor-pointer">客廳</a>
      <a class="hover:text-wood-500 transition cursor-pointer">臥室</a>
      <a class="hover:text-wood-500 transition cursor-pointer">書房</a>
      <a class="hover:text-wood-500 transition cursor-pointer">餐廳</a>
      <a class="hover:text-wood-500 transition cursor-pointer">靈感</a>
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-gray-400 hover:text-wood-500 transition cursor-pointer" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <div class="relative cursor-pointer">
          <svg class="w-5 h-5 text-gray-400 hover:text-wood-500 transition" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
          <span class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-wood-500 text-white text-[10px] rounded-full flex items-center justify-center">2</span>
        </div>
      </div>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="relative overflow-hidden">
  <div class="max-w-6xl mx-auto px-6 py-20 flex items-center gap-16">
    <div class="flex-1">
      <span class="inline-block text-xs text-wood-500 tracking-widest uppercase mb-3 font-medium">Handcrafted Furniture</span>
      <h1 class="serif text-5xl font-semibold text-oak-800 leading-tight mb-4">讓每個空間<br>都有溫度</h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-md">嚴選北美黑胡桃木與白橡木，結合職人手工藝，打造兼具美學與實用的家居生活。</p>
      <div class="flex gap-3">
        <button class="bg-oak-800 hover:bg-oak-900 text-white px-8 py-3 text-sm font-medium transition">探索全系列</button>
        <button class="border border-oak-800 text-oak-800 hover:bg-oak-800 hover:text-white px-8 py-3 text-sm font-medium transition">空間靈感</button>
      </div>
    </div>
    <div class="w-96 h-80 rounded-2xl bg-gradient-to-br from-wood-200 to-wood-300 flex items-center justify-center relative">
      <div class="text-8xl">🪑</div>
      <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow-sm">
        <div class="text-xs text-gray-400">北美黑胡桃木</div>
        <div class="text-sm font-semibold text-oak-800">丹麥休閒椅</div>
        <div class="text-sm text-wood-500 font-semibold">NT$ 28,800</div>
      </div>
    </div>
  </div>
</section>

<!-- Categories -->
<section class="max-w-6xl mx-auto px-6 py-12">
  <div class="grid grid-cols-4 gap-4">
    <div class="bg-white rounded-xl p-6 text-center border border-wood-100 hover:border-wood-300 transition cursor-pointer group">
      <div class="text-4xl mb-3">🛋️</div>
      <div class="font-medium text-oak-800 group-hover:text-wood-500 transition">客廳家具</div>
      <div class="text-xs text-gray-400 mt-1">32 件商品</div>
    </div>
    <div class="bg-white rounded-xl p-6 text-center border border-wood-100 hover:border-wood-300 transition cursor-pointer group">
      <div class="text-4xl mb-3">🛏️</div>
      <div class="font-medium text-oak-800 group-hover:text-wood-500 transition">臥室家具</div>
      <div class="text-xs text-gray-400 mt-1">24 件商品</div>
    </div>
    <div class="bg-white rounded-xl p-6 text-center border border-wood-100 hover:border-wood-300 transition cursor-pointer group">
      <div class="text-4xl mb-3">📚</div>
      <div class="font-medium text-oak-800 group-hover:text-wood-500 transition">書房家具</div>
      <div class="text-xs text-gray-400 mt-1">18 件商品</div>
    </div>
    <div class="bg-white rounded-xl p-6 text-center border border-wood-100 hover:border-wood-300 transition cursor-pointer group">
      <div class="text-4xl mb-3">🍽️</div>
      <div class="font-medium text-oak-800 group-hover:text-wood-500 transition">餐廳家具</div>
      <div class="text-xs text-gray-400 mt-1">21 件商品</div>
    </div>
  </div>
</section>

<!-- Products -->
<section class="max-w-6xl mx-auto px-6 pb-16">
  <div class="flex items-center justify-between mb-8">
    <h2 class="serif text-2xl font-semibold text-oak-800">人氣推薦</h2>
    <div class="flex gap-2">
      <button class="cat-btn active px-4 py-1.5 text-xs border rounded-full font-medium">全部</button>
      <button class="cat-btn px-4 py-1.5 text-xs border border-gray-200 text-gray-400 rounded-full">沙發</button>
      <button class="cat-btn px-4 py-1.5 text-xs border border-gray-200 text-gray-400 rounded-full">桌子</button>
      <button class="cat-btn px-4 py-1.5 text-xs border border-gray-200 text-gray-400 rounded-full">椅子</button>
      <button class="cat-btn px-4 py-1.5 text-xs border border-gray-200 text-gray-400 rounded-full">收納</button>
    </div>
  </div>
  <div class="grid grid-cols-3 gap-6">
    <div class="product-card bg-white rounded-xl overflow-hidden border border-wood-100">
      <div class="h-56 bg-gradient-to-br from-amber-100 to-wood-200 flex items-center justify-center overflow-hidden relative">
        <div class="product-img text-7xl">🛋️</div>
        <span class="absolute top-3 left-3 text-xs bg-wood-500 text-white px-2 py-0.5 rounded-full">熱銷</span>
      </div>
      <div class="p-5">
        <div class="text-xs text-wood-400 mb-1">白橡木 · 三人座</div>
        <h3 class="font-semibold text-oak-800 mb-1">北歐經典布沙發</h3>
        <div class="flex items-center justify-between mt-3">
          <div class="text-lg font-bold text-wood-500">NT$ 45,800</div>
          <button class="w-9 h-9 rounded-full border border-wood-200 flex items-center justify-center hover:bg-wood-500 hover:text-white hover:border-wood-500 transition text-wood-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
          </button>
        </div>
      </div>
    </div>
    <div class="product-card bg-white rounded-xl overflow-hidden border border-wood-100">
      <div class="h-56 bg-gradient-to-br from-stone-100 to-wood-200 flex items-center justify-center overflow-hidden relative">
        <div class="product-img text-7xl">🪑</div>
      </div>
      <div class="p-5">
        <div class="text-xs text-wood-400 mb-1">黑胡桃木 · 扶手椅</div>
        <h3 class="font-semibold text-oak-800 mb-1">丹麥風休閒單椅</h3>
        <div class="flex items-center justify-between mt-3">
          <div class="text-lg font-bold text-wood-500">NT$ 28,800</div>
          <button class="w-9 h-9 rounded-full border border-wood-200 flex items-center justify-center hover:bg-wood-500 hover:text-white hover:border-wood-500 transition text-wood-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
          </button>
        </div>
      </div>
    </div>
    <div class="product-card bg-white rounded-xl overflow-hidden border border-wood-100">
      <div class="h-56 bg-gradient-to-br from-orange-50 to-wood-200 flex items-center justify-center overflow-hidden relative">
        <div class="product-img text-7xl">🗄️</div>
        <span class="absolute top-3 left-3 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">新品</span>
      </div>
      <div class="p-5">
        <div class="text-xs text-wood-400 mb-1">白橡木 · 五層</div>
        <h3 class="font-semibold text-oak-800 mb-1">日式格柵書架</h3>
        <div class="flex items-center justify-between mt-3">
          <div class="text-lg font-bold text-wood-500">NT$ 35,200</div>
          <button class="w-9 h-9 rounded-full border border-wood-200 flex items-center justify-center hover:bg-wood-500 hover:text-white hover:border-wood-500 transition text-wood-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Material Feature -->
<section class="bg-oak-800 text-white py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-10">
      <h2 class="serif text-3xl font-semibold mb-2">匠心選材</h2>
      <p class="text-gray-400 text-sm">每件作品都從一塊好木頭開始</p>
    </div>
    <div class="grid grid-cols-3 gap-8">
      <div class="text-center">
        <div class="w-16 h-16 rounded-full bg-wood-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">🌳</div>
        <h3 class="font-semibold mb-1">FSC 認證林木</h3>
        <p class="text-sm text-gray-400">永續森林認證，每件家具都對環境負責</p>
      </div>
      <div class="text-center">
        <div class="w-16 h-16 rounded-full bg-wood-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">🔨</div>
        <h3 class="font-semibold mb-1">傳統榫卯工藝</h3>
        <p class="text-sm text-gray-400">不用一根螺絲，以東方智慧打造百年耐用</p>
      </div>
      <div class="text-center">
        <div class="w-16 h-16 rounded-full bg-wood-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">🛡️</div>
        <h3 class="font-semibold mb-1">5 年品質保固</h3>
        <p class="text-sm text-gray-400">從出貨日起五年內，免費維修保養服務</p>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-oak-900 text-gray-500 py-10">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-start justify-between">
      <div>
        <div class="flex items-center gap-2 mb-3">
          <svg class="w-5 h-5 text-wood-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M9 22V12h6v10"/></svg>
          <span class="serif text-white font-semibold">WoodLife</span>
        </div>
        <p class="text-xs max-w-xs">以木為本，以心為匠。每一件家具，都是一段溫暖故事的開始。</p>
      </div>
      <div class="flex gap-12 text-sm">
        <div><div class="text-white font-medium mb-2">商品</div><div class="space-y-1 text-xs"><div>客廳</div><div>臥室</div><div>書房</div></div></div>
        <div><div class="text-white font-medium mb-2">服務</div><div class="space-y-1 text-xs"><div>免費配送</div><div>到府組裝</div><div>保固維修</div></div></div>
        <div><div class="text-white font-medium mb-2">聯繫</div><div class="space-y-1 text-xs"><div>LINE 客服</div><div>實體門市</div><div>合作洽詢</div></div></div>
      </div>
    </div>
    <div class="mt-8 pt-6 border-t border-gray-800 text-xs text-center">© 2026 木質生活 WoodLife. All Rights Reserved.</div>
  </div>
</footer>

<script>
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
</script>
</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
