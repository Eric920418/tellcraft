INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'b56324ea-a163-4257-a2df-98d5c5ff9304',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>靜心瑜珈 ZenYoga</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { zen: { 50:'#faf5ff',100:'#f3e8ff',200:'#e9d5ff',300:'#d8b4fe',400:'#c084fc',500:'#a855f7',600:'#9333ea' }, sage: { 50:'#f0fdf4',100:'#dcfce7',400:'#4ade80',500:'#22c55e' } } } } }
</script>
<style>
body { font-family: 'DM Sans', sans-serif; background: #faf8ff; }
.serif { font-family: 'Cormorant Garamond', serif; }
.class-card { transition: all 0.3s; cursor: pointer; }
.class-card:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(168,85,247,0.1); }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-purple-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-2"><span class="text-xl">🧘</span><span class="serif text-xl font-semibold text-gray-800">ZenYoga</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-500">
      <a class="hover:text-zen-600 transition cursor-pointer">課程</a>
      <a class="hover:text-zen-600 transition cursor-pointer">老師</a>
      <a class="hover:text-zen-600 transition cursor-pointer">價格</a>
      <a class="hover:text-zen-600 transition cursor-pointer">關於</a>
      <button class="bg-zen-500 hover:bg-zen-600 text-white px-5 py-2 rounded-full text-sm font-medium transition">體驗預約</button>
    </div>
  </div>
</nav>

<section class="py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 relative overflow-hidden">
  <div class="absolute right-10 top-10 w-72 h-72 rounded-full bg-zen-200/30 blur-[80px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-14">
    <div class="flex-1">
      <span class="inline-block text-xs bg-zen-100 text-zen-600 px-3 py-1 rounded-full font-medium mb-4">🌸 身心合一的旅程</span>
      <h1 class="serif text-5xl font-bold text-gray-800 leading-tight mb-4">在呼吸之間<br>找到內在平靜</h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-md">結合哈達、流瑜珈與正念冥想，為不同程度的練習者提供專屬課程，讓身心在這裡找到最舒適的節奏。</p>
      <div class="flex gap-3">
        <button class="bg-zen-500 hover:bg-zen-600 text-white px-8 py-3 rounded-full font-medium transition">免費體驗課</button>
        <button class="border border-zen-500 text-zen-500 hover:bg-zen-500 hover:text-white px-8 py-3 rounded-full font-medium transition">查看課表</button>
      </div>
    </div>
    <div class="w-80 h-80 rounded-3xl bg-gradient-to-br from-zen-300 to-pink-300 flex items-center justify-center text-8xl shadow-xl shadow-zen-200/40">🧘‍♀️</div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-16">
  <div class="text-center mb-10"><h2 class="serif text-3xl font-bold text-gray-800 mb-2">課程類型</h2><p class="text-sm text-gray-400">找到最適合你的練習方式</p></div>
  <div class="grid grid-cols-4 gap-5">
    <div class="class-card bg-white rounded-2xl p-6 border border-purple-50 text-center">
      <div class="text-3xl mb-3">🌊</div><h3 class="font-bold text-gray-800">流瑜珈</h3><p class="text-xs text-gray-400 mt-1">動態串聯 · 強化體能</p><div class="text-xs text-zen-500 font-medium mt-3">每週 6 堂</div>
    </div>
    <div class="class-card bg-white rounded-2xl p-6 border border-purple-50 text-center">
      <div class="text-3xl mb-3">🧘</div><h3 class="font-bold text-gray-800">哈達瑜珈</h3><p class="text-xs text-gray-400 mt-1">基礎體式 · 適合初學</p><div class="text-xs text-zen-500 font-medium mt-3">每週 8 堂</div>
    </div>
    <div class="class-card bg-white rounded-2xl p-6 border border-purple-50 text-center">
      <div class="text-3xl mb-3">🌙</div><h3 class="font-bold text-gray-800">陰瑜珈</h3><p class="text-xs text-gray-400 mt-1">深層伸展 · 放鬆修復</p><div class="text-xs text-zen-500 font-medium mt-3">每週 4 堂</div>
    </div>
    <div class="class-card bg-white rounded-2xl p-6 border border-purple-50 text-center">
      <div class="text-3xl mb-3">💭</div><h3 class="font-bold text-gray-800">正念冥想</h3><p class="text-xs text-gray-400 mt-1">呼吸引導 · 心靈沈澱</p><div class="text-xs text-zen-500 font-medium mt-3">每週 3 堂</div>
    </div>
  </div>
</section>

<!-- Schedule -->
<section class="bg-white border-y border-purple-50 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold text-gray-800 mb-6 text-center">本週課表</h2>
    <div class="bg-gray-50 rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead><tr class="bg-zen-50 text-xs text-zen-600"><th class="py-2 px-3">時間</th><th class="py-2 px-3">一</th><th class="py-2 px-3">二</th><th class="py-2 px-3">三</th><th class="py-2 px-3">四</th><th class="py-2 px-3">五</th><th class="py-2 px-3">六</th><th class="py-2 px-3">日</th></tr></thead>
        <tbody class="text-xs text-center">
          <tr class="border-t border-gray-100"><td class="py-2 px-3 text-gray-400">07:00</td><td class="py-2 bg-zen-50 text-zen-600 font-medium rounded">晨間流瑜珈</td><td class="py-2"></td><td class="py-2 bg-zen-50 text-zen-600 font-medium rounded">晨間流瑜珈</td><td class="py-2"></td><td class="py-2 bg-zen-50 text-zen-600 font-medium rounded">晨間流瑜珈</td><td class="py-2 bg-amber-50 text-amber-600 font-medium rounded">戶外瑜珈</td><td class="py-2"></td></tr>
          <tr class="border-t border-gray-100"><td class="py-2 px-3 text-gray-400">10:00</td><td class="py-2 bg-blue-50 text-blue-600 font-medium rounded">哈達基礎</td><td class="py-2 bg-pink-50 text-pink-600 font-medium rounded">孕婦瑜珈</td><td class="py-2 bg-blue-50 text-blue-600 font-medium rounded">哈達基礎</td><td class="py-2 bg-pink-50 text-pink-600 font-medium rounded">孕婦瑜珈</td><td class="py-2 bg-blue-50 text-blue-600 font-medium rounded">哈達基礎</td><td class="py-2"></td><td class="py-2 bg-purple-50 text-purple-600 font-medium rounded">正念冥想</td></tr>
          <tr class="border-t border-gray-100"><td class="py-2 px-3 text-gray-400">19:00</td><td class="py-2 bg-indigo-50 text-indigo-600 font-medium rounded">陰瑜珈</td><td class="py-2 bg-zen-50 text-zen-600 font-medium rounded">流瑜珈</td><td class="py-2 bg-purple-50 text-purple-600 font-medium rounded">正念冥想</td><td class="py-2 bg-zen-50 text-zen-600 font-medium rounded">流瑜珈</td><td class="py-2 bg-indigo-50 text-indigo-600 font-medium rounded">陰瑜珈</td><td class="py-2"></td><td class="py-2"></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<!-- Instructors -->
<section class="max-w-6xl mx-auto px-6 py-16">
  <h2 class="serif text-2xl font-bold text-gray-800 mb-8 text-center">師資團隊</h2>
  <div class="grid grid-cols-3 gap-6">
    <div class="text-center"><div class="w-24 h-24 rounded-full bg-gradient-to-br from-zen-200 to-pink-200 flex items-center justify-center mx-auto mb-3 text-4xl">👩‍🦰</div><h3 class="font-bold text-gray-800">Amy 老師</h3><div class="text-xs text-zen-500 font-medium mt-0.5">流瑜珈 · RYT500</div><p class="text-xs text-gray-400 mt-2">10 年教學經驗，擅長動態序列編排</p></div>
    <div class="text-center"><div class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center mx-auto mb-3 text-4xl">🧑</div><h3 class="font-bold text-gray-800">Kevin 老師</h3><div class="text-xs text-zen-500 font-medium mt-0.5">哈達瑜珈 · E-RYT200</div><p class="text-xs text-gray-400 mt-2">溫暖耐心的教學風格，初學者首選</p></div>
    <div class="text-center"><div class="w-24 h-24 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center mx-auto mb-3 text-4xl">👩</div><h3 class="font-bold text-gray-800">Mia 老師</h3><div class="text-xs text-zen-500 font-medium mt-0.5">陰瑜珈 + 冥想 · RYT200</div><p class="text-xs text-gray-400 mt-2">結合正念與瑜珈，引導深層放鬆</p></div>
  </div>
</section>

<!-- Pricing -->
<section class="bg-zen-600 text-white py-16">
  <div class="max-w-6xl mx-auto px-6 text-center">
    <h2 class="serif text-3xl font-bold mb-8">方案價格</h2>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-white/10 rounded-2xl p-6 border border-white/10 hover:border-white/30 transition cursor-pointer"><h3 class="font-bold text-lg">單堂體驗</h3><div class="serif text-4xl font-bold my-4">$350</div><ul class="text-sm text-white/70 space-y-1"><li>✓ 任選一堂課</li><li>✓ 含瑜珈墊</li><li>✓ 新手友善</li></ul></div>
      <div class="bg-white/15 rounded-2xl p-6 border border-white/30 relative cursor-pointer"><span class="absolute -top-2 right-4 text-xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-bold">最熱門</span><h3 class="font-bold text-lg">月票</h3><div class="serif text-4xl font-bold my-4">$2,800<span class="text-base font-normal text-white/50">/月</span></div><ul class="text-sm text-white/70 space-y-1"><li>✓ 不限堂數</li><li>✓ 所有課程</li><li>✓ 免費停車</li></ul></div>
      <div class="bg-white/10 rounded-2xl p-6 border border-white/10 hover:border-white/30 transition cursor-pointer"><h3 class="font-bold text-lg">季票</h3><div class="serif text-4xl font-bold my-4">$7,200<span class="text-base font-normal text-white/50">/季</span></div><ul class="text-sm text-white/70 space-y-1"><li>✓ 不限堂數</li><li>✓ 含私教 2 堂</li><li>✓ 優先預約</li></ul></div>
    </div>
  </div>
</section>

<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
    <div class="flex items-center gap-2"><span>🧘</span><span class="serif text-white font-semibold">ZenYoga</span></div>
    <div class="text-xs">© 2026 靜心瑜珈 · 台北市信義區松仁路 88 號 B1</div>
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
