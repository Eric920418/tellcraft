INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'e693b2d5-dd41-43be-a8b1-988946307b5d',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>田園時光 FarmFresh</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { farm: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d' }, earth: { 50:'#fefce8',100:'#fef9c3',400:'#facc15',500:'#eab308' } } } } } }
</script>
<style>
* { font-family: 'Nunito', sans-serif; }
body { background: #fafdf7; }
.produce-card { transition: all 0.3s; cursor: pointer; }
.produce-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(34,197,94,0.1); }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-green-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><span class="text-xl">🌾</span><span class="text-lg font-extrabold text-green-800">田園時光</span><span class="text-[10px] text-farm-500 font-bold">FarmFresh</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-500 font-semibold">
      <a class="hover:text-farm-600 transition cursor-pointer">當季蔬果</a>
      <a class="hover:text-farm-600 transition cursor-pointer">農場故事</a>
      <a class="hover:text-farm-600 transition cursor-pointer">產地直送</a>
      <a class="hover:text-farm-600 transition cursor-pointer">食農教育</a>
      <button class="bg-farm-600 hover:bg-farm-700 text-white px-5 py-1.5 rounded-full text-sm font-bold transition">訂購蔬果箱</button>
    </div>
  </div>
</nav>

<section class="py-20 bg-gradient-to-br from-green-50 via-lime-50 to-yellow-50 relative overflow-hidden">
  <div class="absolute left-0 bottom-0 w-96 h-96 bg-farm-200/30 rounded-full blur-[100px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-14">
    <div class="flex-1">
      <span class="inline-block text-xs bg-farm-100 text-farm-700 px-3 py-1 rounded-full font-bold mb-4">🚜 產地直送 · 今天採明天到</span>
      <h1 class="text-4xl font-extrabold text-gray-800 leading-tight mb-4">從田園到餐桌<br>最新鮮的距離</h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-md">與全台 50+ 小農合作，堅持無毒有機栽培。每週配送當季蔬果，讓你在家就能享受產地直送的新鮮美味。</p>
      <div class="flex gap-3">
        <button class="bg-farm-600 hover:bg-farm-700 text-white px-8 py-3 rounded-full font-bold transition shadow-lg shadow-farm-200">瀏覽蔬果</button>
        <button class="border border-farm-500 text-farm-600 hover:bg-farm-50 px-8 py-3 rounded-full font-bold transition">蔬果箱訂閱</button>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="w-36 h-36 rounded-2xl bg-gradient-to-b from-red-100 to-red-200 flex items-center justify-center text-5xl shadow-lg">🍅</div>
      <div class="w-36 h-36 rounded-2xl bg-gradient-to-b from-green-100 to-green-200 flex items-center justify-center text-5xl shadow-lg mt-6">🥬</div>
      <div class="w-36 h-36 rounded-2xl bg-gradient-to-b from-orange-100 to-orange-200 flex items-center justify-center text-5xl shadow-lg -mt-3">🥕</div>
      <div class="w-36 h-36 rounded-2xl bg-gradient-to-b from-yellow-100 to-yellow-200 flex items-center justify-center text-5xl shadow-lg mt-3">🌽</div>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-14">
  <div class="flex items-center justify-between mb-8"><h2 class="text-2xl font-extrabold text-gray-800">🥬 當季蔬果</h2><span class="text-xs text-gray-400">每週二、五產地直送</span></div>
  <div class="grid grid-cols-5 gap-4">
    <div class="produce-card bg-white rounded-2xl overflow-hidden border border-green-50">
      <div class="h-36 bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center text-5xl">🍅</div>
      <div class="p-3"><h3 class="font-bold text-gray-800 text-sm">玉女番茄</h3><p class="text-[10px] text-gray-400">美濃 · 溫室水耕</p><div class="flex items-center justify-between mt-2"><span class="text-farm-600 font-bold text-sm">$120/盒</span><span class="text-[10px] text-farm-500">有機</span></div></div>
    </div>
    <div class="produce-card bg-white rounded-2xl overflow-hidden border border-green-50">
      <div class="h-36 bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center text-5xl">🥬</div>
      <div class="p-3"><h3 class="font-bold text-gray-800 text-sm">有機青江菜</h3><p class="text-[10px] text-gray-400">三芝 · 露天栽培</p><div class="flex items-center justify-between mt-2"><span class="text-farm-600 font-bold text-sm">$65/把</span><span class="text-[10px] text-farm-500">有機</span></div></div>
    </div>
    <div class="produce-card bg-white rounded-2xl overflow-hidden border border-green-50">
      <div class="h-36 bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center text-5xl">🥕</div>
      <div class="p-3"><h3 class="font-bold text-gray-800 text-sm">胡蘿蔔</h3><p class="text-[10px] text-gray-400">雲林 · 自然農法</p><div class="flex items-center justify-between mt-2"><span class="text-farm-600 font-bold text-sm">$80/包</span><span class="text-[10px] text-earth-500">無毒</span></div></div>
    </div>
    <div class="produce-card bg-white rounded-2xl overflow-hidden border border-green-50">
      <div class="h-36 bg-gradient-to-b from-yellow-50 to-yellow-100 flex items-center justify-center text-5xl">🌽</div>
      <div class="p-3"><h3 class="font-bold text-gray-800 text-sm">水果玉米</h3><p class="text-[10px] text-gray-400">台南 · 甜度 18 度</p><div class="flex items-center justify-between mt-2"><span class="text-farm-600 font-bold text-sm">$150/6入</span><span class="text-[10px] text-farm-500">有機</span></div></div>
    </div>
    <div class="produce-card bg-white rounded-2xl overflow-hidden border border-green-50">
      <div class="h-36 bg-gradient-to-b from-pink-50 to-pink-100 flex items-center justify-center text-5xl">🍓</div>
      <div class="p-3"><h3 class="font-bold text-gray-800 text-sm">大湖草莓</h3><p class="text-[10px] text-gray-400">苗栗 · 高架栽培</p><div class="flex items-center justify-between mt-2"><span class="text-farm-600 font-bold text-sm">$280/盒</span><span class="text-[10px] text-earth-500">無毒</span></div></div>
    </div>
  </div>
</section>

<section class="bg-farm-700 text-white py-14">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-8"><h2 class="text-2xl font-extrabold">🎁 蔬果箱訂閱方案</h2><p class="text-green-200/70 text-sm mt-1">讓新鮮定期送到你家</p></div>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-white/10 rounded-2xl p-6 border border-white/10 text-center cursor-pointer hover:border-white/30 transition"><h3 class="font-bold text-lg">小家庭箱</h3><div class="text-3xl font-extrabold my-3">$599<span class="text-sm font-normal text-white/50">/週</span></div><ul class="text-sm text-white/70 space-y-1"><li>✓ 5-6 種當季蔬果</li><li>✓ 2-3 人份</li><li>✓ 免運費</li></ul></div>
      <div class="bg-white/15 rounded-2xl p-6 border border-white/30 text-center relative cursor-pointer"><span class="absolute -top-2 right-4 text-xs bg-earth-400 text-earth-900 px-2 py-0.5 rounded-full font-bold">最超值</span><h3 class="font-bold text-lg">豐收箱</h3><div class="text-3xl font-extrabold my-3">$999<span class="text-sm font-normal text-white/50">/週</span></div><ul class="text-sm text-white/70 space-y-1"><li>✓ 8-10 種當季蔬果</li><li>✓ 3-4 人份</li><li>✓ 免運費 + 食譜卡</li></ul></div>
      <div class="bg-white/10 rounded-2xl p-6 border border-white/10 text-center cursor-pointer hover:border-white/30 transition"><h3 class="font-bold text-lg">水果控箱</h3><div class="text-3xl font-extrabold my-3">$799<span class="text-sm font-normal text-white/50">/週</span></div><ul class="text-sm text-white/70 space-y-1"><li>✓ 4-5 種季節水果</li><li>✓ 約 3-4 公斤</li><li>✓ 免運費</li></ul></div>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-12">
  <h2 class="text-xl font-extrabold text-gray-800 mb-6 text-center">🧑‍🌾 合作農場</h2>
  <div class="grid grid-cols-3 gap-5">
    <div class="bg-white rounded-xl p-5 border border-green-50 flex items-start gap-3"><div class="w-12 h-12 rounded-full bg-farm-100 flex items-center justify-center text-xl shrink-0">👨‍🌾</div><div><h3 class="font-bold text-gray-800 text-sm">陳家有機農場</h3><div class="text-xs text-farm-600 mt-0.5">苗栗三灣 · 有機認證</div><p class="text-xs text-gray-400 mt-1">三代務農，30 年有機栽培經驗</p></div></div>
    <div class="bg-white rounded-xl p-5 border border-green-50 flex items-start gap-3"><div class="w-12 h-12 rounded-full bg-earth-100 flex items-center justify-center text-xl shrink-0">👩‍🌾</div><div><h3 class="font-bold text-gray-800 text-sm">日光農莊</h3><div class="text-xs text-farm-600 mt-0.5">台南新化 · 自然農法</div><p class="text-xs text-gray-400 mt-1">青年返鄉，堅持不用農藥</p></div></div>
    <div class="bg-white rounded-xl p-5 border border-green-50 flex items-start gap-3"><div class="w-12 h-12 rounded-full bg-farm-100 flex items-center justify-center text-xl shrink-0">👨‍🌾</div><div><h3 class="font-bold text-gray-800 text-sm">綠野仙蹤</h3><div class="text-xs text-farm-600 mt-0.5">宜蘭三星 · 有機認證</div><p class="text-xs text-gray-400 mt-1">專注溫室水耕，品質穩定</p></div></div>
  </div>
</section>

<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
    <div class="flex items-center gap-2"><span>🌾</span><span class="text-white font-extrabold">田園時光</span></div>
    <div class="text-xs">© 2026 FarmFresh · 從田園到餐桌，最新鮮的距離</div>
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
