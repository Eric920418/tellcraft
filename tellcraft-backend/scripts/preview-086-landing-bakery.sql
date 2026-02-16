INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '9e96dab6-9be1-4a7e-a598-13e237e6fd4a',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>暖心烘焙 BakeJoy</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { bake: { 50:'#fef7ed',100:'#fdecd4',200:'#f9d5a8',400:'#f2a54a',500:'#ed8a1f',600:'#d97012' }, cream: { 50:'#fffbf5',100:'#fff3e0' } } } } } }
</script>
<style>
body { font-family: 'Nunito', sans-serif; background: #fffbf5; }
.serif { font-family: 'Playfair Display', serif; }
.bread-card { transition: all 0.3s; cursor: pointer; }
.bread-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(237,138,31,0.12); }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-bake-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><span class="text-xl">🥐</span><span class="serif text-lg font-bold text-amber-900">BakeJoy</span><span class="text-[10px] text-bake-500 font-medium">暖心烘焙</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-500">
      <a class="hover:text-bake-500 transition cursor-pointer">今日出爐</a>
      <a class="hover:text-bake-500 transition cursor-pointer">麵包圖鑑</a>
      <a class="hover:text-bake-500 transition cursor-pointer">門市據點</a>
      <a class="hover:text-bake-500 transition cursor-pointer">關於我們</a>
      <button class="bg-bake-500 hover:bg-bake-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition">線上訂購</button>
    </div>
  </div>
</nav>

<section class="py-20 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">
  <div class="absolute right-0 top-0 w-96 h-96 bg-bake-200/30 rounded-full blur-[100px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-14">
    <div class="flex-1">
      <span class="inline-block text-xs bg-bake-100 text-bake-600 px-3 py-1 rounded-full font-semibold mb-4">🔥 每日清晨新鮮出爐</span>
      <h1 class="serif text-5xl font-bold text-gray-800 leading-tight mb-4">用手感溫度<br>烘焙每一天</h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-md">堅持天然酵母、法國麵粉與低溫長時間發酵，每一口都是師傅對麵團的誠意。從經典法棍到季節限定，邀你品嚐真正的好麵包。</p>
      <div class="flex gap-3">
        <button class="bg-bake-500 hover:bg-bake-600 text-white px-8 py-3 rounded-full font-semibold transition shadow-lg shadow-bake-200">立即選購 →</button>
        <button class="border border-bake-400 text-bake-600 hover:bg-bake-50 px-8 py-3 rounded-full font-semibold transition">門市地圖</button>
      </div>
    </div>
    <div class="relative">
      <div class="w-72 h-72 rounded-full bg-gradient-to-br from-bake-200 to-amber-200 flex items-center justify-center text-9xl shadow-xl shadow-bake-100">🍞</div>
      <div class="absolute -bottom-4 -left-6 w-20 h-20 rounded-full bg-bake-100 flex items-center justify-center text-3xl shadow-md">🥖</div>
      <div class="absolute -top-2 -right-4 w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-2xl shadow-md">🧁</div>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-14">
  <div class="flex items-center justify-between mb-8"><h2 class="serif text-2xl font-bold text-gray-800">🔥 今日出爐</h2><span class="text-xs text-gray-400">每日 07:00 & 14:00 新鮮出爐</span></div>
  <div class="grid grid-cols-4 gap-5">
    <div class="bread-card bg-white rounded-2xl overflow-hidden border border-bake-50">
      <div class="h-44 bg-gradient-to-b from-amber-100 to-amber-200 flex items-center justify-center text-6xl relative"><span>🥐</span><span class="absolute top-2 right-2 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">限量</span></div>
      <div class="p-4"><h3 class="font-bold text-gray-800">法式可頌</h3><p class="text-xs text-gray-400 mt-0.5">36 層手工摺疊 · 法國 AOP 奶油</p><div class="flex items-center justify-between mt-3"><span class="text-bake-500 font-bold">NT$ 85</span><button class="text-xs bg-bake-50 text-bake-600 px-3 py-1 rounded-full font-semibold hover:bg-bake-100 transition">加入</button></div></div>
    </div>
    <div class="bread-card bg-white rounded-2xl overflow-hidden border border-bake-50">
      <div class="h-44 bg-gradient-to-b from-yellow-100 to-yellow-200 flex items-center justify-center text-6xl"><span>🥖</span></div>
      <div class="p-4"><h3 class="font-bold text-gray-800">經典法棍</h3><p class="text-xs text-gray-400 mt-0.5">T65 石磨麵粉 · 18 小時發酵</p><div class="flex items-center justify-between mt-3"><span class="text-bake-500 font-bold">NT$ 120</span><button class="text-xs bg-bake-50 text-bake-600 px-3 py-1 rounded-full font-semibold hover:bg-bake-100 transition">加入</button></div></div>
    </div>
    <div class="bread-card bg-white rounded-2xl overflow-hidden border border-bake-50">
      <div class="h-44 bg-gradient-to-b from-orange-100 to-orange-200 flex items-center justify-center text-6xl"><span>🍞</span></div>
      <div class="p-4"><h3 class="font-bold text-gray-800">鄉村酸種</h3><p class="text-xs text-gray-400 mt-0.5">自養酸種菌 · 全麥 30%</p><div class="flex items-center justify-between mt-3"><span class="text-bake-500 font-bold">NT$ 180</span><button class="text-xs bg-bake-50 text-bake-600 px-3 py-1 rounded-full font-semibold hover:bg-bake-100 transition">加入</button></div></div>
    </div>
    <div class="bread-card bg-white rounded-2xl overflow-hidden border border-bake-50">
      <div class="h-44 bg-gradient-to-b from-rose-100 to-rose-200 flex items-center justify-center text-6xl relative"><span>🧁</span><span class="absolute top-2 right-2 text-[10px] bg-bake-500 text-white px-2 py-0.5 rounded-full font-bold">季節</span></div>
      <div class="p-4"><h3 class="font-bold text-gray-800">草莓丹麥</h3><p class="text-xs text-gray-400 mt-0.5">大湖草莓 · 卡士達醬</p><div class="flex items-center justify-between mt-3"><span class="text-bake-500 font-bold">NT$ 95</span><button class="text-xs bg-bake-50 text-bake-600 px-3 py-1 rounded-full font-semibold hover:bg-bake-100 transition">加入</button></div></div>
    </div>
  </div>
</section>

<section class="bg-amber-900 text-white py-14">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-3 gap-8">
      <div class="text-center"><div class="text-4xl mb-3">🌾</div><h3 class="serif text-xl font-bold mb-2">天然酵母</h3><p class="text-amber-200/70 text-sm leading-relaxed">堅持使用自養天然酵母，不添加商業酵母與改良劑，讓麵包回歸最自然的風味。</p></div>
      <div class="text-center"><div class="text-4xl mb-3">⏰</div><h3 class="serif text-xl font-bold mb-2">長時間發酵</h3><p class="text-amber-200/70 text-sm leading-relaxed">低溫冷藏 12-18 小時慢速發酵，讓麵團充分熟成，口感層次更加豐富。</p></div>
      <div class="text-center"><div class="text-4xl mb-3">🇫🇷</div><h3 class="serif text-xl font-bold mb-2">法國進口麵粉</h3><p class="text-amber-200/70 text-sm leading-relaxed">選用法國 Grands Moulins de Paris T55/T65 麵粉，帶出小麥最純粹的香氣。</p></div>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-14">
  <h2 class="serif text-2xl font-bold text-gray-800 mb-8 text-center">門市據點</h2>
  <div class="grid grid-cols-2 gap-6">
    <div class="bg-white rounded-2xl p-6 border border-bake-50 flex items-start gap-4">
      <div class="w-12 h-12 rounded-xl bg-bake-50 flex items-center justify-center text-xl shrink-0">🏠</div>
      <div><h3 class="font-bold text-gray-800">大安本店</h3><p class="text-xs text-gray-400 mt-1">台北市大安區永康街 32 號</p><div class="text-xs text-bake-500 font-medium mt-2">每日 07:00 - 20:00</div></div>
    </div>
    <div class="bg-white rounded-2xl p-6 border border-bake-50 flex items-start gap-4">
      <div class="w-12 h-12 rounded-xl bg-bake-50 flex items-center justify-center text-xl shrink-0">🏠</div>
      <div><h3 class="font-bold text-gray-800">信義旗艦店</h3><p class="text-xs text-gray-400 mt-1">台北市信義區松仁路 100 號 1F</p><div class="text-xs text-bake-500 font-medium mt-2">每日 08:00 - 21:00</div></div>
    </div>
  </div>
</section>

<section class="bg-gradient-to-r from-bake-500 to-amber-500 py-12 text-center text-white">
  <h2 class="serif text-2xl font-bold mb-2">加入烘焙家族</h2>
  <p class="text-white/80 text-sm mb-6">訂閱電子報，搶先知道新品出爐與限定優惠</p>
  <div class="flex gap-2 max-w-md mx-auto"><input type="email" placeholder="your@email.com" class="flex-1 px-4 py-2.5 rounded-full text-sm text-gray-800 outline-none"><button class="bg-amber-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-amber-800 transition">訂閱</button></div>
</section>

<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
    <div class="flex items-center gap-2"><span>🥐</span><span class="serif text-white font-bold">BakeJoy</span></div>
    <div class="text-xs">© 2026 暖心烘焙 · 用手感溫度，烘焙每一天</div>
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
