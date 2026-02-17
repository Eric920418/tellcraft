INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'e693b2d5-dd41-43be-a8b1-988946307b5d',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>田園時光 FarmFresh - 從產地到餐桌</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        farm: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d' },
        earth: { 50:'#fefce8',100:'#fef9c3',200:'#fde68a',300:'#fcd34d',400:'#facc15',500:'#eab308',600:'#ca8a04',700:'#a16207',800:'#854d0e',900:'#713f12' },
        soil: { 50:'#fdf8f0',100:'#f5ead6',200:'#e8d5b0',300:'#d4b896',400:'#b8956a',500:'#9c7650',600:'#7c5c3a',700:'#5e4328',800:'#3d2b18',900:'#2a1d10' }
      }
    }
  }
}
</script>
<style>
* { font-family: 'DM Sans', sans-serif; scroll-behavior: smooth; }
body { background: #fafdf7; color: #1a1a1a; }
.card-hover { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(22,101,52,0.08); }
.season-tab { transition: all 0.3s; cursor: pointer; }
.season-tab.active { background: #15803d; color: white; }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.4s ease, padding 0.3s ease; }
.faq-answer.open { max-height: 300px; padding-top: 12px; padding-bottom: 4px; }
.faq-icon { transition: transform 0.3s; }
.faq-item.open .faq-icon { transform: rotate(45deg); }
.modal-overlay { opacity: 0; pointer-events: none; transition: opacity 0.3s; }
.modal-overlay.show { opacity: 1; pointer-events: auto; }
.modal-content { transform: scale(0.95) translateY(10px); transition: transform 0.3s; }
.modal-overlay.show .modal-content { transform: scale(1) translateY(0); }
.tier-card { transition: all 0.3s; cursor: pointer; }
.tier-card:hover { transform: translateY(-4px); }
.tier-card.selected { ring: 2px; box-shadow: 0 0 0 3px rgba(22,163,74,0.3); }
.nav-link { position: relative; }
.nav-link::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:2px; background:#16a34a; transition:width 0.3s; }
.nav-link:hover::after { width:100%; }
.calendar-item { transition: all 0.3s; }
.calendar-item:hover { transform: scale(1.05); }
.value-card { transition: all 0.4s; }
.value-card:hover { transform: translateY(-4px) scale(1.02); }
.experience-card { transition: all 0.4s; }
.experience-card:hover .exp-img { transform: scale(1.1); }
.exp-img { transition: transform 0.5s; }
</style>
</head>
<body>

<!-- Sticky Nav -->
<nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-farm-100/60 shadow-sm">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-2.5">
      <div class="w-9 h-9 bg-farm-600 rounded-xl flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M12 22V8"/><path d="M8 12c-2-1-4 0-4 3"/><path d="M16 12c2-1 4 0 4 3"/><path d="M12 8c-2-4 1-7 3-7"/><path d="M12 8c2-4-1-7-3-7"/></svg>
      </div>
      <div><span class="text-lg font-extrabold text-farm-800 tracking-tight">田園時光</span><span class="text-[10px] text-farm-500 font-semibold ml-1.5 tracking-wider">FARMFRESH</span></div>
    </div>
    <div class="flex items-center gap-7 text-sm text-gray-500 font-medium">
      <a onclick="document.getElementById('seasonal').scrollIntoView({behavior:'smooth'})" class="nav-link hover:text-farm-700 cursor-pointer">當季好物</a>
      <a onclick="document.getElementById('values').scrollIntoView({behavior:'smooth'})" class="nav-link hover:text-farm-700 cursor-pointer">我們的堅持</a>
      <a onclick="document.getElementById('plans').scrollIntoView({behavior:'smooth'})" class="nav-link hover:text-farm-700 cursor-pointer">蔬菜箱</a>
      <a onclick="document.getElementById('story').scrollIntoView({behavior:'smooth'})" class="nav-link hover:text-farm-700 cursor-pointer">農場故事</a>
      <a onclick="document.getElementById('faq').scrollIntoView({behavior:'smooth'})" class="nav-link hover:text-farm-700 cursor-pointer">常見問題</a>
      <button onclick="openOrderModal('standard')" class="bg-farm-600 hover:bg-farm-700 text-white px-6 py-2 rounded-full text-sm font-bold transition shadow-lg shadow-farm-200/50 cursor-pointer">立即訂購</button>
    </div>
  </div>
</nav>

<!-- Hero Section -->
<section class="relative overflow-hidden bg-gradient-to-br from-farm-50 via-green-50/80 to-earth-50/40 py-24">
  <div class="absolute -top-20 -right-20 w-[500px] h-[500px] bg-farm-200/20 rounded-full blur-[120px]"></div>
  <div class="absolute -bottom-32 -left-20 w-[400px] h-[400px] bg-earth-200/20 rounded-full blur-[100px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-16 relative">
    <div class="flex-1">
      <div class="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-farm-200 rounded-full px-4 py-1.5 mb-6">
        <span class="w-2 h-2 bg-farm-500 rounded-full animate-pulse"></span>
        <span class="text-xs font-semibold text-farm-700">產地直送 · 採收 24 小時內送達</span>
      </div>
      <h1 class="text-5xl font-extrabold text-gray-900 leading-[1.15] mb-5">從產地到餐桌<br><span class="text-farm-600">最純粹的新鮮</span></h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-lg text-base">十五年有機耕作經驗，堅持無農藥、無化肥的自然農法。與在地小農攜手合作，將最當季、最新鮮的蔬果，從田間直送到您的餐桌。</p>
      <div class="flex gap-4">
        <button onclick="document.getElementById('plans').scrollIntoView({behavior:'smooth'})" class="bg-farm-600 hover:bg-farm-700 text-white px-8 py-3.5 rounded-full font-bold transition shadow-xl shadow-farm-300/30 cursor-pointer">選購蔬菜箱</button>
        <button onclick="document.getElementById('story').scrollIntoView({behavior:'smooth'})" class="border-2 border-farm-300 text-farm-700 hover:bg-farm-50 px-8 py-3.5 rounded-full font-bold transition cursor-pointer">認識我們</button>
      </div>
    </div>
    <div class="flex-shrink-0 relative">
      <div class="w-[380px] h-[380px] rounded-[40px] bg-gradient-to-br from-farm-100 to-farm-200/60 border border-farm-200/50 flex items-center justify-center relative overflow-hidden shadow-2xl shadow-farm-200/30">
        <div class="grid grid-cols-3 gap-3 p-8">
          <div class="w-24 h-24 rounded-2xl bg-white/90 flex items-center justify-center text-4xl shadow-sm border border-farm-100">🥬</div>
          <div class="w-24 h-24 rounded-2xl bg-white/90 flex items-center justify-center text-4xl shadow-sm border border-farm-100">🍅</div>
          <div class="w-24 h-24 rounded-2xl bg-white/90 flex items-center justify-center text-4xl shadow-sm border border-farm-100">🥕</div>
          <div class="w-24 h-24 rounded-2xl bg-white/90 flex items-center justify-center text-4xl shadow-sm border border-farm-100">🌽</div>
          <div class="w-24 h-24 rounded-2xl bg-white/90 flex items-center justify-center text-4xl shadow-sm border border-farm-100">🍓</div>
          <div class="w-24 h-24 rounded-2xl bg-white/90 flex items-center justify-center text-4xl shadow-sm border border-farm-100">🫑</div>
          <div class="w-24 h-24 rounded-2xl bg-white/90 flex items-center justify-center text-4xl shadow-sm border border-farm-100">🍆</div>
          <div class="w-24 h-24 rounded-2xl bg-white/90 flex items-center justify-center text-4xl shadow-sm border border-farm-100">🧅</div>
          <div class="w-24 h-24 rounded-2xl bg-white/90 flex items-center justify-center text-4xl shadow-sm border border-farm-100">🥒</div>
        </div>
      </div>
      <div class="absolute -bottom-3 -left-6 bg-white rounded-2xl px-5 py-3 shadow-xl border border-farm-100 flex items-center gap-3">
        <div class="w-10 h-10 bg-farm-100 rounded-full flex items-center justify-center text-lg">🚛</div>
        <div><div class="text-xs font-bold text-gray-800">今日已配送</div><div class="text-farm-600 font-extrabold text-sm">326 箱</div></div>
      </div>
    </div>
  </div>
</section>

<!-- Stats -->
<section class="py-14 bg-white border-y border-farm-50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-4 gap-8">
      <div class="text-center">
        <div class="text-4xl font-extrabold text-farm-700 mb-1">15<span class="text-xl">年</span></div>
        <div class="text-sm text-gray-500">有機耕作經驗</div>
      </div>
      <div class="text-center">
        <div class="text-4xl font-extrabold text-farm-700 mb-1">30<span class="text-xl">+</span></div>
        <div class="text-sm text-gray-500">有機蔬果品種</div>
      </div>
      <div class="text-center">
        <div class="text-4xl font-extrabold text-farm-700 mb-1">5,000<span class="text-xl">+</span></div>
        <div class="text-sm text-gray-500">服務家庭</div>
      </div>
      <div class="text-center">
        <div class="text-4xl font-extrabold text-farm-700 mb-1">24<span class="text-xl">hr</span></div>
        <div class="text-sm text-gray-500">產地直送到府</div>
      </div>
    </div>
  </div>
</section>

<!-- Seasonal Products with Tabs -->
<section id="seasonal" class="py-20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-10">
      <span class="inline-block text-xs font-bold text-farm-600 bg-farm-100 px-3 py-1 rounded-full mb-3">SEASONAL PICKS</span>
      <h2 class="text-3xl font-extrabold text-gray-900 mb-2">當季好物</h2>
      <p class="text-gray-400 text-sm">跟著節氣吃，最新鮮最營養</p>
    </div>
    <div class="flex justify-center gap-2 mb-10">
      <button onclick="switchSeason('spring')" class="season-tab active px-6 py-2.5 rounded-full text-sm font-bold border border-farm-200 bg-farm-100 text-farm-700" data-season="spring">🌸 春季</button>
      <button onclick="switchSeason('summer')" class="season-tab px-6 py-2.5 rounded-full text-sm font-bold border border-gray-200 bg-white text-gray-500" data-season="summer">☀️ 夏季</button>
      <button onclick="switchSeason('autumn')" class="season-tab px-6 py-2.5 rounded-full text-sm font-bold border border-gray-200 bg-white text-gray-500" data-season="autumn">🍂 秋季</button>
      <button onclick="switchSeason('winter')" class="season-tab px-6 py-2.5 rounded-full text-sm font-bold border border-gray-200 bg-white text-gray-500" data-season="winter">❄️ 冬季</button>
    </div>
    <div id="season-spring" class="grid grid-cols-4 gap-5 season-content">
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center text-6xl relative"><span>🍅</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-farm-500 text-white px-2 py-0.5 rounded-full">有機</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">玉女番茄</h3><p class="text-xs text-gray-400 mt-0.5">美濃 · 溫室水耕栽培</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$120<span class="text-xs font-normal text-gray-400">/盒</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center text-6xl relative"><span>🥬</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-farm-500 text-white px-2 py-0.5 rounded-full">有機</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">春季嫩菠菜</h3><p class="text-xs text-gray-400 mt-0.5">三芝 · 露天有機栽培</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$75<span class="text-xs font-normal text-gray-400">/把</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-pink-50 to-pink-100 flex items-center justify-center text-6xl relative"><span>🍓</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-earth-500 text-white px-2 py-0.5 rounded-full">限量</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">大湖草莓</h3><p class="text-xs text-gray-400 mt-0.5">苗栗 · 高架有機栽培</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$280<span class="text-xs font-normal text-gray-400">/盒</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-emerald-50 to-emerald-100 flex items-center justify-center text-6xl relative"><span>🫛</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-farm-500 text-white px-2 py-0.5 rounded-full">有機</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">甜豌豆</h3><p class="text-xs text-gray-400 mt-0.5">雲林 · 自然農法</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$90<span class="text-xs font-normal text-gray-400">/包</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
    </div>
    <div id="season-summer" class="grid grid-cols-4 gap-5 season-content hidden">
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center text-6xl relative"><span>🍉</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-farm-500 text-white px-2 py-0.5 rounded-full">有機</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">花蓮西瓜</h3><p class="text-xs text-gray-400 mt-0.5">花蓮 · 砂地栽培</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$350<span class="text-xs font-normal text-gray-400">/顆</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-yellow-50 to-yellow-100 flex items-center justify-center text-6xl relative"><span>🌽</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-farm-500 text-white px-2 py-0.5 rounded-full">有機</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">水果玉米</h3><p class="text-xs text-gray-400 mt-0.5">台南 · 甜度18度</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$150<span class="text-xs font-normal text-gray-400">/6入</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-purple-50 to-purple-100 flex items-center justify-center text-6xl relative"><span>🍆</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-earth-500 text-white px-2 py-0.5 rounded-full">無毒</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">日本茄子</h3><p class="text-xs text-gray-400 mt-0.5">屏東 · 溫室栽培</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$65<span class="text-xs font-normal text-gray-400">/包</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-lime-50 to-lime-100 flex items-center justify-center text-6xl relative"><span>🥒</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-farm-500 text-white px-2 py-0.5 rounded-full">有機</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">小黃瓜</h3><p class="text-xs text-gray-400 mt-0.5">宜蘭 · 自然農法</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$55<span class="text-xs font-normal text-gray-400">/包</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
    </div>
    <div id="season-autumn" class="grid grid-cols-4 gap-5 season-content hidden">
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center text-6xl relative"><span>🎃</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-farm-500 text-white px-2 py-0.5 rounded-full">有機</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">栗子南瓜</h3><p class="text-xs text-gray-400 mt-0.5">南投 · 高山栽培</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$130<span class="text-xs font-normal text-gray-400">/顆</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-orange-50 to-amber-100 flex items-center justify-center text-6xl relative"><span>🍠</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-earth-500 text-white px-2 py-0.5 rounded-full">無毒</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">台農57地瓜</h3><p class="text-xs text-gray-400 mt-0.5">雲林 · 砂質壤土</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$80<span class="text-xs font-normal text-gray-400">/包</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center text-6xl relative"><span>🥕</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-farm-500 text-white px-2 py-0.5 rounded-full">有機</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">有機紅蘿蔔</h3><p class="text-xs text-gray-400 mt-0.5">彰化 · 自然農法</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$70<span class="text-xs font-normal text-gray-400">/包</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center text-6xl relative"><span>🍄</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-farm-500 text-white px-2 py-0.5 rounded-full">有機</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">秋季香菇</h3><p class="text-xs text-gray-400 mt-0.5">新社 · 段木栽培</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$160<span class="text-xs font-normal text-gray-400">/盒</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
    </div>
    <div id="season-winter" class="grid grid-cols-4 gap-5 season-content hidden">
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center text-6xl relative"><span>🥦</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-farm-500 text-white px-2 py-0.5 rounded-full">有機</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">冬季花椰菜</h3><p class="text-xs text-gray-400 mt-0.5">嘉義 · 露天栽培</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$85<span class="text-xs font-normal text-gray-400">/顆</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-emerald-50 to-emerald-100 flex items-center justify-center text-6xl relative"><span>🥬</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-farm-500 text-white px-2 py-0.5 rounded-full">有機</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">高山高麗菜</h3><p class="text-xs text-gray-400 mt-0.5">梨山 · 高冷地栽培</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$110<span class="text-xs font-normal text-gray-400">/顆</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center text-6xl relative"><span>🍊</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-earth-500 text-white px-2 py-0.5 rounded-full">限量</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">茂谷柑</h3><p class="text-xs text-gray-400 mt-0.5">台中東勢 · 果園直送</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$200<span class="text-xs font-normal text-gray-400">/箱</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
      <div class="card-hover bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm">
        <div class="h-44 bg-gradient-to-b from-yellow-50 to-yellow-100 flex items-center justify-center text-6xl relative"><span>🧅</span><span class="absolute top-3 right-3 text-[10px] font-bold bg-farm-500 text-white px-2 py-0.5 rounded-full">有機</span></div>
        <div class="p-4"><h3 class="font-bold text-gray-800">有機洋蔥</h3><p class="text-xs text-gray-400 mt-0.5">屏東恆春 · 落山風洋蔥</p><div class="flex items-center justify-between mt-3"><span class="text-farm-700 font-extrabold">$60<span class="text-xs font-normal text-gray-400">/包</span></span><button class="text-xs bg-farm-50 text-farm-600 px-3 py-1 rounded-full font-semibold hover:bg-farm-100 transition cursor-pointer">加入</button></div></div>
      </div>
    </div>
  </div>
</section>

<!-- Values -->
<section id="values" class="py-20 bg-gradient-to-b from-white to-farm-50/30">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="inline-block text-xs font-bold text-farm-600 bg-farm-100 px-3 py-1 rounded-full mb-3">OUR VALUES</span>
      <h2 class="text-3xl font-extrabold text-gray-900 mb-2">我們的堅持</h2>
      <p class="text-gray-400 text-sm">每一份蔬果，都是對土地的承諾</p>
    </div>
    <div class="grid grid-cols-4 gap-6">
      <div class="value-card bg-white rounded-2xl p-6 border border-farm-100 text-center shadow-sm">
        <div class="w-16 h-16 bg-farm-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
        </div>
        <h3 class="font-bold text-gray-800 mb-2">有機認證</h3>
        <p class="text-xs text-gray-400 leading-relaxed">通過國際有機認證標準，每批產品可追溯產地與生產履歷，安心看得見。</p>
      </div>
      <div class="value-card bg-white rounded-2xl p-6 border border-farm-100 text-center shadow-sm">
        <div class="w-16 h-16 bg-farm-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2" stroke-linecap="round"><path d="M12 22V8"/><path d="M8 12c-2-1-4 0-4 3"/><path d="M16 12c2-1 4 0 4 3"/><path d="M12 8c-2-4 1-7 3-7"/><path d="M12 8c2-4-1-7-3-7"/></svg>
        </div>
        <h3 class="font-bold text-gray-800 mb-2">無農藥栽培</h3>
        <p class="text-xs text-gray-400 leading-relaxed">全程不使用化學農藥與除草劑，以生物防治與物理方式管理病蟲害。</p>
      </div>
      <div class="value-card bg-white rounded-2xl p-6 border border-farm-100 text-center shadow-sm">
        <div class="w-16 h-16 bg-earth-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a16207" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20"/><path d="M12 2a15 15 0 0 0 0 20"/><path d="M2 12h20"/></svg>
        </div>
        <h3 class="font-bold text-gray-800 mb-2">友善土地</h3>
        <p class="text-xs text-gray-400 leading-relaxed">實踐永續農業，輪作休耕養地、堆肥取代化肥，守護台灣的美麗田園。</p>
      </div>
      <div class="value-card bg-white rounded-2xl p-6 border border-farm-100 text-center shadow-sm">
        <div class="w-16 h-16 bg-farm-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2" stroke-linecap="round"><rect x="1" y="6" width="22" height="12" rx="3"/><path d="M1 10h22"/><path d="M6 6v12"/><path d="M18 6v12"/></svg>
        </div>
        <h3 class="font-bold text-gray-800 mb-2">小農直送</h3>
        <p class="text-xs text-gray-400 leading-relaxed">與全台 30+ 在地小農合作，省去中間商環節，農民賺更多、消費者付更少。</p>
      </div>
    </div>
  </div>
</section>

<!-- Subscription Plans -->
<section id="plans" class="py-20 bg-farm-800 relative overflow-hidden">
  <div class="absolute inset-0 opacity-10" style="background-image:url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 stroke=%22%23fff%22 stroke-width=%220.5%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%224%22/%3E%3C/g%3E%3C/svg%3E');"></div>
  <div class="max-w-6xl mx-auto px-6 relative">
    <div class="text-center mb-12">
      <span class="inline-block text-xs font-bold text-farm-300 bg-farm-700 px-3 py-1 rounded-full mb-3">SUBSCRIPTION</span>
      <h2 class="text-3xl font-extrabold text-white mb-2">蔬菜箱方案</h2>
      <p class="text-farm-300/70 text-sm">選擇適合你的方案，新鮮定期送到家</p>
    </div>
    <div class="grid grid-cols-3 gap-6">
      <!-- Tier 1 -->
      <div class="tier-card bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/10 hover:border-white/25">
        <div class="text-center">
          <div class="text-3xl mb-3">🥗</div>
          <h3 class="text-xl font-bold text-white">小家庭箱</h3>
          <p class="text-farm-300/60 text-xs mt-1">2-3 人份 · 輕巧入門</p>
          <div class="mt-5 mb-6">
            <span class="text-4xl font-extrabold text-white">$680</span>
            <span class="text-sm text-white/40">/箱</span>
          </div>
          <ul class="text-sm text-white/70 space-y-2.5 text-left mb-8">
            <li class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>5-6 種當季蔬果</li>
            <li class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>每箱約 3-4 公斤</li>
            <li class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>免運費配送</li>
            <li class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>附當季食譜卡</li>
          </ul>
          <button onclick="openOrderModal('small')" class="w-full py-3 rounded-full border border-white/30 text-white font-bold hover:bg-white/10 transition cursor-pointer">選擇方案</button>
        </div>
      </div>
      <!-- Tier 2 (Popular) -->
      <div class="tier-card bg-white/15 backdrop-blur rounded-2xl p-8 border-2 border-farm-400/50 relative shadow-2xl shadow-farm-900/50 scale-105">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-farm-400 text-farm-900 text-xs font-extrabold px-4 py-1 rounded-full">最受歡迎</div>
        <div class="text-center">
          <div class="text-3xl mb-3">🥬</div>
          <h3 class="text-xl font-bold text-white">標準家庭箱</h3>
          <p class="text-farm-300/60 text-xs mt-1">3-4 人份 · 最超值</p>
          <div class="mt-5 mb-6">
            <span class="text-4xl font-extrabold text-white">$980</span>
            <span class="text-sm text-white/40">/箱</span>
          </div>
          <ul class="text-sm text-white/70 space-y-2.5 text-left mb-8">
            <li class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>8-10 種當季蔬果</li>
            <li class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>每箱約 6-7 公斤</li>
            <li class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>免運費 + 冷藏配送</li>
            <li class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>食譜卡 + 產地故事</li>
            <li class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>可客製排除品項</li>
          </ul>
          <button onclick="openOrderModal('standard')" class="w-full py-3 rounded-full bg-farm-500 text-white font-bold hover:bg-farm-600 transition cursor-pointer shadow-lg shadow-farm-500/30">選擇方案</button>
        </div>
      </div>
      <!-- Tier 3 -->
      <div class="tier-card bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/10 hover:border-white/25">
        <div class="text-center">
          <div class="text-3xl mb-3">🍱</div>
          <h3 class="text-xl font-bold text-white">豐富饗宴箱</h3>
          <p class="text-farm-300/60 text-xs mt-1">4-5 人份 · 大家庭首選</p>
          <div class="mt-5 mb-6">
            <span class="text-4xl font-extrabold text-white">$1,480</span>
            <span class="text-sm text-white/40">/箱</span>
          </div>
          <ul class="text-sm text-white/70 space-y-2.5 text-left mb-8">
            <li class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>12-15 種當季蔬果</li>
            <li class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>每箱約 10 公斤</li>
            <li class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>免運費 + 冷藏配送</li>
            <li class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>每月贈送限量農產品</li>
            <li class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>專屬客服 + 農場體驗</li>
          </ul>
          <button onclick="openOrderModal('rich')" class="w-full py-3 rounded-full border border-white/30 text-white font-bold hover:bg-white/10 transition cursor-pointer">選擇方案</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Founder Story -->
<section id="story" class="py-20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center gap-16">
      <div class="flex-shrink-0 relative">
        <div class="w-[400px] h-[460px] rounded-3xl bg-gradient-to-br from-farm-100 to-earth-100 border border-farm-200/50 overflow-hidden shadow-xl relative">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div class="text-8xl mb-4">👨‍🌾</div>
              <div class="text-farm-700 font-bold text-lg">林清河 創辦人</div>
              <div class="text-farm-500 text-sm">與土地共生 15 年</div>
            </div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-farm-800/20 to-transparent"></div>
        </div>
        <div class="absolute -bottom-4 -right-4 bg-white rounded-xl p-4 shadow-lg border border-farm-100">
          <div class="text-xs text-gray-400 mb-1">創立於</div>
          <div class="text-2xl font-extrabold text-farm-700">2011</div>
        </div>
      </div>
      <div class="flex-1">
        <span class="inline-block text-xs font-bold text-farm-600 bg-farm-100 px-3 py-1 rounded-full mb-4">OUR STORY</span>
        <h2 class="text-3xl font-extrabold text-gray-900 mb-6">農場故事</h2>
        <div class="space-y-4 text-gray-500 leading-relaxed">
          <p>「小時候，阿公的菜園是我最喜歡的遊樂場。那裡的番茄有真正的番茄味，每一口都是陽光和泥土的香氣。」</p>
          <p>2011 年，林清河放棄了科技業的高薪工作，帶著對土地的思念回到了苗栗三灣的老家。面對荒廢已久的農田，他決定用最原始的方式——不施農藥、不用化肥，讓土地慢慢恢復生機。</p>
          <p>前三年幾乎是零收入，產量只有慣行農法的三分之一。但當第一顆番茄結果、第一把菠菜長成，他知道自己的選擇是對的。那些蔬果有著他記憶中的味道。</p>
          <p class="text-farm-700 font-semibold">「我們不只是在種菜，我們是在守護一種生活方式。希望每個家庭的餐桌上，都能有真正新鮮、安心的食物。」</p>
        </div>
        <div class="flex gap-8 mt-8">
          <div class="text-center"><div class="text-2xl font-extrabold text-farm-700">50+</div><div class="text-xs text-gray-400">合作小農</div></div>
          <div class="text-center"><div class="text-2xl font-extrabold text-farm-700">200</div><div class="text-xs text-gray-400">畝有機農田</div></div>
          <div class="text-center"><div class="text-2xl font-extrabold text-farm-700">3</div><div class="text-xs text-gray-400">有機認證</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Farm Experience -->
<section class="py-20 bg-gradient-to-b from-farm-50/30 to-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="inline-block text-xs font-bold text-farm-600 bg-farm-100 px-3 py-1 rounded-full mb-3">FARM EXPERIENCE</span>
      <h2 class="text-3xl font-extrabold text-gray-900 mb-2">農場體驗</h2>
      <p class="text-gray-400 text-sm">週末帶家人來農場，感受泥土的溫度</p>
    </div>
    <div class="grid grid-cols-3 gap-6">
      <div class="experience-card bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm cursor-pointer">
        <div class="h-48 bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center overflow-hidden">
          <div class="exp-img text-7xl">🍓</div>
        </div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold text-gray-800 text-lg">採果體驗</h3>
            <span class="text-xs bg-farm-100 text-farm-700 px-2 py-0.5 rounded-full font-semibold">季節限定</span>
          </div>
          <p class="text-sm text-gray-400 mb-3">親手採摘當季水果，草莓、番茄、柑橘...享受收穫的喜悅，帶回最新鮮的果實。</p>
          <div class="flex items-center justify-between">
            <span class="text-farm-700 font-bold">$350<span class="text-xs text-gray-400 font-normal">/人</span></span>
            <span class="text-xs text-gray-400">每週六日 09:00-16:00</span>
          </div>
        </div>
      </div>
      <div class="experience-card bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm cursor-pointer">
        <div class="h-48 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center overflow-hidden">
          <div class="exp-img text-7xl">🌾</div>
        </div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold text-gray-800 text-lg">插秧農事</h3>
            <span class="text-xs bg-earth-100 text-earth-700 px-2 py-0.5 rounded-full font-semibold">親子推薦</span>
          </div>
          <p class="text-sm text-gray-400 mb-3">體驗傳統農耕文化，從插秧、除草到收割，了解一粒米的旅程，珍惜食物的來之不易。</p>
          <div class="flex items-center justify-between">
            <span class="text-farm-700 font-bold">$500<span class="text-xs text-gray-400 font-normal">/人</span></span>
            <span class="text-xs text-gray-400">春秋兩季 · 需預約</span>
          </div>
        </div>
      </div>
      <div class="experience-card bg-white rounded-2xl overflow-hidden border border-farm-100 shadow-sm cursor-pointer">
        <div class="h-48 bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center overflow-hidden">
          <div class="exp-img text-7xl">🧑‍🍳</div>
        </div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold text-gray-800 text-lg">食農手作 DIY</h3>
            <span class="text-xs bg-farm-100 text-farm-700 px-2 py-0.5 rounded-full font-semibold">全年開放</span>
          </div>
          <p class="text-sm text-gray-400 mb-3">手作豆腐、醃漬蔬菜、窯烤麵包...從田間到廚房的食農教育，大人小孩都能樂在其中。</p>
          <div class="flex items-center justify-between">
            <span class="text-farm-700 font-bold">$450<span class="text-xs text-gray-400 font-normal">/人</span></span>
            <span class="text-xs text-gray-400">每週六 10:00-14:00</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="py-20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="inline-block text-xs font-bold text-farm-600 bg-farm-100 px-3 py-1 rounded-full mb-3">TESTIMONIALS</span>
      <h2 class="text-3xl font-extrabold text-gray-900 mb-2">好評推薦</h2>
      <p class="text-gray-400 text-sm">來自 5,000+ 家庭的真實回饋</p>
    </div>
    <div class="grid grid-cols-3 gap-6">
      <div class="card-hover bg-white rounded-2xl p-6 border border-farm-100 shadow-sm">
        <div class="flex gap-1 mb-3">
          <span class="text-farm-400 text-sm">&#9733;</span><span class="text-farm-400 text-sm">&#9733;</span><span class="text-farm-400 text-sm">&#9733;</span><span class="text-farm-400 text-sm">&#9733;</span><span class="text-farm-400 text-sm">&#9733;</span>
        </div>
        <p class="text-gray-500 text-sm leading-relaxed mb-4">「訂了半年的標準箱，孩子以前不愛吃菜，現在搶著吃！真的吃得出差別，尤其是番茄和玉米，甜到不可思議。」</p>
        <div class="flex items-center gap-3 pt-3 border-t border-gray-50">
          <div class="w-10 h-10 bg-farm-100 rounded-full flex items-center justify-center text-lg">👩</div>
          <div><div class="text-sm font-bold text-gray-800">陳小萱</div><div class="text-xs text-gray-400">台北 · 訂閱 6 個月</div></div>
        </div>
      </div>
      <div class="card-hover bg-white rounded-2xl p-6 border border-farm-100 shadow-sm">
        <div class="flex gap-1 mb-3">
          <span class="text-farm-400 text-sm">&#9733;</span><span class="text-farm-400 text-sm">&#9733;</span><span class="text-farm-400 text-sm">&#9733;</span><span class="text-farm-400 text-sm">&#9733;</span><span class="text-farm-400 text-sm">&#9733;</span>
        </div>
        <p class="text-gray-500 text-sm leading-relaxed mb-4">「帶小朋友去體驗採草莓，他們興奮到不行。回家後更珍惜食物了。每週配送很準時，客服態度也超好的！」</p>
        <div class="flex items-center gap-3 pt-3 border-t border-gray-50">
          <div class="w-10 h-10 bg-earth-100 rounded-full flex items-center justify-center text-lg">👨</div>
          <div><div class="text-sm font-bold text-gray-800">張志豪</div><div class="text-xs text-gray-400">新竹 · 訂閱 1 年</div></div>
        </div>
      </div>
      <div class="card-hover bg-white rounded-2xl p-6 border border-farm-100 shadow-sm">
        <div class="flex gap-1 mb-3">
          <span class="text-farm-400 text-sm">&#9733;</span><span class="text-farm-400 text-sm">&#9733;</span><span class="text-farm-400 text-sm">&#9733;</span><span class="text-farm-400 text-sm">&#9733;</span><span class="text-farm-400 text-sm">&#9733;</span>
        </div>
        <p class="text-gray-500 text-sm leading-relaxed mb-4">「身為營養師，我很在意食材品質。田園時光的有機蔬果，檢驗報告透明，口感和營養價值都是一流的。大力推薦！」</p>
        <div class="flex items-center gap-3 pt-3 border-t border-gray-50">
          <div class="w-10 h-10 bg-farm-100 rounded-full flex items-center justify-center text-lg">👩‍⚕️</div>
          <div><div class="text-sm font-bold text-gray-800">李怡如</div><div class="text-xs text-gray-400">台中 · 訂閱 3 個月</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Seasonal Calendar Strip -->
<section class="py-12 bg-gradient-to-r from-farm-50 to-earth-50 border-y border-farm-100">
  <div class="max-w-6xl mx-auto px-6">
    <h3 class="text-center font-extrabold text-gray-800 mb-6">🗓️ 全年產季曆</h3>
    <div class="grid grid-cols-12 gap-2">
      <div class="calendar-item text-center p-3 bg-white rounded-xl border border-farm-100 cursor-pointer"><div class="text-xs font-bold text-gray-400 mb-1">1月</div><div class="text-lg">🍊</div><div class="text-[10px] text-gray-400 mt-0.5">柑橘</div></div>
      <div class="calendar-item text-center p-3 bg-white rounded-xl border border-farm-100 cursor-pointer"><div class="text-xs font-bold text-gray-400 mb-1">2月</div><div class="text-lg">🍓</div><div class="text-[10px] text-gray-400 mt-0.5">草莓</div></div>
      <div class="calendar-item text-center p-3 bg-white rounded-xl border border-farm-100 cursor-pointer"><div class="text-xs font-bold text-gray-400 mb-1">3月</div><div class="text-lg">🫛</div><div class="text-[10px] text-gray-400 mt-0.5">豌豆</div></div>
      <div class="calendar-item text-center p-3 bg-white rounded-xl border border-farm-100 cursor-pointer"><div class="text-xs font-bold text-gray-400 mb-1">4月</div><div class="text-lg">🥬</div><div class="text-[10px] text-gray-400 mt-0.5">萵苣</div></div>
      <div class="calendar-item text-center p-3 bg-white rounded-xl border border-farm-100 cursor-pointer"><div class="text-xs font-bold text-gray-400 mb-1">5月</div><div class="text-lg">🍅</div><div class="text-[10px] text-gray-400 mt-0.5">番茄</div></div>
      <div class="calendar-item text-center p-3 bg-white rounded-xl border border-farm-100 cursor-pointer"><div class="text-xs font-bold text-gray-400 mb-1">6月</div><div class="text-lg">🍉</div><div class="text-[10px] text-gray-400 mt-0.5">西瓜</div></div>
      <div class="calendar-item text-center p-3 bg-white rounded-xl border border-farm-100 cursor-pointer"><div class="text-xs font-bold text-gray-400 mb-1">7月</div><div class="text-lg">🌽</div><div class="text-[10px] text-gray-400 mt-0.5">玉米</div></div>
      <div class="calendar-item text-center p-3 bg-white rounded-xl border border-farm-100 cursor-pointer"><div class="text-xs font-bold text-gray-400 mb-1">8月</div><div class="text-lg">🍆</div><div class="text-[10px] text-gray-400 mt-0.5">茄子</div></div>
      <div class="calendar-item text-center p-3 bg-white rounded-xl border border-farm-100 cursor-pointer"><div class="text-xs font-bold text-gray-400 mb-1">9月</div><div class="text-lg">🎃</div><div class="text-[10px] text-gray-400 mt-0.5">南瓜</div></div>
      <div class="calendar-item text-center p-3 bg-white rounded-xl border border-farm-100 cursor-pointer"><div class="text-xs font-bold text-gray-400 mb-1">10月</div><div class="text-lg">🍠</div><div class="text-[10px] text-gray-400 mt-0.5">地瓜</div></div>
      <div class="calendar-item text-center p-3 bg-white rounded-xl border border-farm-100 cursor-pointer"><div class="text-xs font-bold text-gray-400 mb-1">11月</div><div class="text-lg">🍄</div><div class="text-[10px] text-gray-400 mt-0.5">香菇</div></div>
      <div class="calendar-item text-center p-3 bg-white rounded-xl border border-farm-100 cursor-pointer"><div class="text-xs font-bold text-gray-400 mb-1">12月</div><div class="text-lg">🥦</div><div class="text-[10px] text-gray-400 mt-0.5">花椰菜</div></div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section id="faq" class="py-20">
  <div class="max-w-3xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="inline-block text-xs font-bold text-farm-600 bg-farm-100 px-3 py-1 rounded-full mb-3">FAQ</span>
      <h2 class="text-3xl font-extrabold text-gray-900 mb-2">常見問題</h2>
      <p class="text-gray-400 text-sm">您想知道的，我們都幫您整理好了</p>
    </div>
    <div class="space-y-3">
      <div class="faq-item bg-white rounded-xl border border-farm-100 overflow-hidden" onclick="toggleFaq(this)">
        <div class="flex items-center justify-between p-5 cursor-pointer">
          <h3 class="font-bold text-gray-800">蔬菜箱的蔬果是怎麼挑選的？</h3>
          <span class="faq-icon text-farm-600 text-xl font-light">+</span>
        </div>
        <div class="faq-answer px-5 text-sm text-gray-500 leading-relaxed">
          每週由我們的農產專家根據當季最佳品質的作物進行挑選，優先選擇當週採收、風味最佳的品項。我們會盡量保持每週品項的多樣性，讓您的餐桌不會單調。若您有不喜歡的品項，可在訂閱時設定排除清單。
        </div>
      </div>
      <div class="faq-item bg-white rounded-xl border border-farm-100 overflow-hidden" onclick="toggleFaq(this)">
        <div class="flex items-center justify-between p-5 cursor-pointer">
          <h3 class="font-bold text-gray-800">配送範圍和時間是？</h3>
          <span class="faq-icon text-farm-600 text-xl font-light">+</span>
        </div>
        <div class="faq-answer px-5 text-sm text-gray-500 leading-relaxed">
          目前提供全台本島配送服務（離島暫不支援）。配送日為每週二和週五，您可以在訂閱時選擇偏好的配送日。我們使用低溫宅配，確保蔬果在最佳狀態送達您手中。當天中午前下單，最快隔日即可收到。
        </div>
      </div>
      <div class="faq-item bg-white rounded-xl border border-farm-100 overflow-hidden" onclick="toggleFaq(this)">
        <div class="flex items-center justify-between p-5 cursor-pointer">
          <h3 class="font-bold text-gray-800">可以暫停或取消訂閱嗎？</h3>
          <span class="faq-icon text-farm-600 text-xl font-light">+</span>
        </div>
        <div class="faq-answer px-5 text-sm text-gray-500 leading-relaxed">
          當然可以！我們採用彈性訂閱制，沒有最低訂閱期限。您可以隨時透過 LINE 客服或網站會員中心暫停、跳過某週配送，或完全取消訂閱。暫停期間不會收取任何費用。我們希望帶給您的是便利，而非負擔。
        </div>
      </div>
      <div class="faq-item bg-white rounded-xl border border-farm-100 overflow-hidden" onclick="toggleFaq(this)">
        <div class="flex items-center justify-between p-5 cursor-pointer">
          <h3 class="font-bold text-gray-800">有機認證和檢驗報告可以查看嗎？</h3>
          <span class="faq-icon text-farm-600 text-xl font-light">+</span>
        </div>
        <div class="faq-answer px-5 text-sm text-gray-500 leading-relaxed">
          完全透明公開！每批蔬果都附有產地履歷 QR Code，掃描即可查看該批次的農場資訊、種植方式及農藥殘留檢驗報告。我們的合作農場均通過 MOA 有機認證或慈心有機認證，所有認證文件也可在官網查閱。
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Delivery Info -->
<section class="py-16 bg-white border-y border-farm-50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-10">
      <span class="inline-block text-xs font-bold text-farm-600 bg-farm-100 px-3 py-1 rounded-full mb-3">DELIVERY</span>
      <h2 class="text-3xl font-extrabold text-gray-900 mb-2">配送說明</h2>
    </div>
    <div class="grid grid-cols-4 gap-6">
      <div class="text-center">
        <div class="w-14 h-14 bg-farm-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">📦</div>
        <h3 class="font-bold text-gray-800 text-sm mb-1">冷藏宅配</h3>
        <p class="text-xs text-gray-400">全程 4°C 低溫配送<br>維持最佳鮮度</p>
      </div>
      <div class="text-center">
        <div class="w-14 h-14 bg-farm-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">🚛</div>
        <h3 class="font-bold text-gray-800 text-sm mb-1">全台配送</h3>
        <p class="text-xs text-gray-400">本島免運費<br>每週二、五固定出貨</p>
      </div>
      <div class="text-center">
        <div class="w-14 h-14 bg-farm-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">🔄</div>
        <h3 class="font-bold text-gray-800 text-sm mb-1">彈性調整</h3>
        <p class="text-xs text-gray-400">隨時暫停、跳過<br>出貨前 2 天可更改</p>
      </div>
      <div class="text-center">
        <div class="w-14 h-14 bg-farm-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">💚</div>
        <h3 class="font-bold text-gray-800 text-sm mb-1">品質保證</h3>
        <p class="text-xs text-gray-400">不滿意免費補寄<br>7 天鑑賞期</p>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="py-20 bg-gradient-to-br from-farm-700 to-farm-900 relative overflow-hidden">
  <div class="absolute inset-0 opacity-5" style="background-image:url('data:image/svg+xml,%3Csvg width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M20 5c-3 0-5 8-5 15s2 15 5 15 5-8 5-15S23 5 20 5z%22 fill=%22%23fff%22/%3E%3C/svg%3E');"></div>
  <div class="max-w-3xl mx-auto px-6 text-center relative">
    <h2 class="text-4xl font-extrabold text-white mb-4">讓餐桌回歸自然</h2>
    <p class="text-farm-200/70 mb-8 max-w-lg mx-auto">加入田園時光，每週享受產地直送的有機蔬果。第一箱訂閱即享 9 折優惠，現在就開始您的健康生活。</p>
    <div class="flex gap-4 justify-center">
      <button onclick="openOrderModal('standard')" class="bg-white text-farm-800 px-10 py-4 rounded-full font-bold text-lg hover:bg-farm-50 transition shadow-xl cursor-pointer">立即訂閱蔬菜箱</button>
      <button onclick="document.getElementById('seasonal').scrollIntoView({behavior:'smooth'})" class="border-2 border-white/30 text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 transition cursor-pointer">瀏覽當季蔬果</button>
    </div>
    <p class="text-farm-300/50 text-xs mt-6">免綁約 · 隨時取消 · 全台免運</p>
  </div>
</section>

<!-- Footer -->
<footer class="bg-farm-900 text-white py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-4 gap-10 mb-12">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 bg-farm-600 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M12 22V8"/><path d="M8 12c-2-1-4 0-4 3"/><path d="M16 12c2-1 4 0 4 3"/><path d="M12 8c-2-4 1-7 3-7"/><path d="M12 8c2-4-1-7-3-7"/></svg>
          </div>
          <span class="font-extrabold text-lg">田園時光</span>
        </div>
        <p class="text-sm text-white/50 leading-relaxed">從產地到餐桌，讓每個家庭都能享受最新鮮、最安心的有機蔬果。</p>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-4 text-white/80">快速連結</h4>
        <ul class="space-y-2 text-sm text-white/40">
          <li><a class="hover:text-white transition cursor-pointer">當季好物</a></li>
          <li><a class="hover:text-white transition cursor-pointer">蔬菜箱方案</a></li>
          <li><a class="hover:text-white transition cursor-pointer">農場體驗</a></li>
          <li><a class="hover:text-white transition cursor-pointer">關於我們</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-4 text-white/80">客服中心</h4>
        <ul class="space-y-2 text-sm text-white/40">
          <li><a class="hover:text-white transition cursor-pointer">常見問題</a></li>
          <li><a class="hover:text-white transition cursor-pointer">退換貨政策</a></li>
          <li><a class="hover:text-white transition cursor-pointer">配送說明</a></li>
          <li><a class="hover:text-white transition cursor-pointer">聯絡我們</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-4 text-white/80">聯絡資訊</h4>
        <ul class="space-y-2 text-sm text-white/40">
          <li>📞 02-2345-6789</li>
          <li>📧 hello@farmfresh.com.tw</li>
          <li>📍 苗栗縣三灣鄉田園路 88 號</li>
          <li class="flex gap-3 pt-2">
            <span class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm hover:bg-white/20 transition cursor-pointer">FB</span>
            <span class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm hover:bg-white/20 transition cursor-pointer">IG</span>
            <span class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm hover:bg-white/20 transition cursor-pointer">LINE</span>
          </li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/10 pt-6 flex items-center justify-between text-xs text-white/30">
      <span>&copy; 2026 田園時光 FarmFresh. All rights reserved.</span>
      <div class="flex gap-4">
        <a class="hover:text-white/60 transition cursor-pointer">隱私權政策</a>
        <a class="hover:text-white/60 transition cursor-pointer">服務條款</a>
      </div>
    </div>
  </div>
</footer>

<!-- Order Modal -->
<div id="orderModal" class="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
  <div class="modal-content bg-white rounded-3xl shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto">
    <!-- Step 1: Order Form -->
    <div id="orderForm">
      <div class="p-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-extrabold text-gray-900">訂購蔬菜箱</h2>
          <button onclick="closeOrderModal()" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition cursor-pointer">&times;</button>
        </div>
        <!-- Plan Selection -->
        <div class="mb-5">
          <label class="text-sm font-bold text-gray-700 mb-2 block">選擇方案</label>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="selectPlan('small')" id="plan-small" class="plan-btn p-3 rounded-xl border-2 border-gray-200 text-center hover:border-farm-400 transition cursor-pointer">
              <div class="text-lg mb-1">🥗</div>
              <div class="text-xs font-bold text-gray-800">小家庭</div>
              <div class="text-sm font-extrabold text-farm-600">$680</div>
            </button>
            <button onclick="selectPlan('standard')" id="plan-standard" class="plan-btn p-3 rounded-xl border-2 border-farm-500 bg-farm-50 text-center cursor-pointer">
              <div class="text-lg mb-1">🥬</div>
              <div class="text-xs font-bold text-gray-800">標準家庭</div>
              <div class="text-sm font-extrabold text-farm-600">$980</div>
            </button>
            <button onclick="selectPlan('rich')" id="plan-rich" class="plan-btn p-3 rounded-xl border-2 border-gray-200 text-center hover:border-farm-400 transition cursor-pointer">
              <div class="text-lg mb-1">🍱</div>
              <div class="text-xs font-bold text-gray-800">豐富饗宴</div>
              <div class="text-sm font-extrabold text-farm-600">$1,480</div>
            </button>
          </div>
        </div>
        <!-- Frequency -->
        <div class="mb-5">
          <label class="text-sm font-bold text-gray-700 mb-2 block">配送頻率</label>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="selectFreq('weekly')" id="freq-weekly" class="freq-btn p-3 rounded-xl border-2 border-farm-500 bg-farm-50 text-center text-sm font-semibold cursor-pointer">每週配送</button>
            <button onclick="selectFreq('biweekly')" id="freq-biweekly" class="freq-btn p-3 rounded-xl border-2 border-gray-200 text-center text-sm font-semibold hover:border-farm-400 transition cursor-pointer">隔週配送</button>
          </div>
        </div>
        <!-- Form Fields -->
        <div class="space-y-4">
          <div>
            <label class="text-sm font-bold text-gray-700 mb-1 block">配送地址</label>
            <input type="text" placeholder="請輸入完整配送地址" class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-farm-400 focus:ring-2 focus:ring-farm-100 transition">
          </div>
          <div>
            <label class="text-sm font-bold text-gray-700 mb-1 block">聯絡電話</label>
            <input type="tel" placeholder="0912-345-678" class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-farm-400 focus:ring-2 focus:ring-farm-100 transition">
          </div>
          <div>
            <label class="text-sm font-bold text-gray-700 mb-1 block">備註（選填）</label>
            <textarea placeholder="如：不要香菜、希望多一些根莖類..." rows="2" class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-farm-400 focus:ring-2 focus:ring-farm-100 transition resize-none"></textarea>
          </div>
        </div>
        <button onclick="submitOrder()" class="w-full mt-6 bg-farm-600 hover:bg-farm-700 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-farm-200/50 cursor-pointer">確認訂購</button>
        <p class="text-center text-xs text-gray-400 mt-3">首次訂閱享 9 折優惠 · 免綁約隨時取消</p>
      </div>
    </div>
    <!-- Step 2: Success -->
    <div id="orderSuccess" class="hidden p-8 text-center">
      <div class="w-20 h-20 bg-farm-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">🎉</div>
      <h2 class="text-2xl font-extrabold text-gray-900 mb-2">訂購成功！</h2>
      <p class="text-gray-500 text-sm mb-2">感謝您選擇田園時光</p>
      <p class="text-gray-400 text-xs mb-6">我們將在下一個配送日為您準備最新鮮的蔬菜箱。<br>訂單確認信已發送至您的信箱。</p>
      <div class="bg-farm-50 rounded-xl p-4 mb-6 text-left">
        <div class="flex justify-between text-sm mb-2"><span class="text-gray-500">方案</span><span class="font-bold text-gray-800" id="successPlan">標準家庭箱</span></div>
        <div class="flex justify-between text-sm mb-2"><span class="text-gray-500">配送頻率</span><span class="font-bold text-gray-800" id="successFreq">每週配送</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-500">預計首次配送</span><span class="font-bold text-farm-700">2026/02/20（五）</span></div>
      </div>
      <button onclick="closeOrderModal()" class="w-full bg-farm-600 hover:bg-farm-700 text-white py-3.5 rounded-xl font-bold transition cursor-pointer">完成</button>
    </div>
  </div>
</div>

<script>
// Season Tabs
function switchSeason(season) {
  document.querySelectorAll('.season-content').forEach(el => el.classList.add('hidden'));
  document.getElementById('season-' + season).classList.remove('hidden');
  document.querySelectorAll('.season-tab').forEach(btn => {
    btn.classList.remove('active', 'bg-farm-100', 'text-farm-700', 'border-farm-200');
    btn.classList.add('bg-white', 'text-gray-500', 'border-gray-200');
  });
  const activeBtn = document.querySelector('[data-season="' + season + '"]');
  activeBtn.classList.add('active', 'bg-farm-100', 'text-farm-700', 'border-farm-200');
  activeBtn.classList.remove('bg-white', 'text-gray-500', 'border-gray-200');
}

// FAQ Accordion
function toggleFaq(item) {
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(el => {
    el.classList.remove('open');
    el.querySelector('.faq-answer').classList.remove('open');
  });
  if (!wasOpen) {
    item.classList.add('open');
    item.querySelector('.faq-answer').classList.add('open');
  }
}

// Order Modal
let selectedPlan = 'standard';
let selectedFreq = 'weekly';
const planNames = { small: '小家庭箱', standard: '標準家庭箱', rich: '豐富饗宴箱' };
const planPrices = { small: '$680', standard: '$980', rich: '$1,480' };
const freqNames = { weekly: '每週配送', biweekly: '隔週配送' };

function openOrderModal(plan) {
  selectedPlan = plan || 'standard';
  document.getElementById('orderForm').classList.remove('hidden');
  document.getElementById('orderSuccess').classList.add('hidden');
  updatePlanUI();
  updateFreqUI();
  document.getElementById('orderModal').classList.add('show');
}

function closeOrderModal() {
  document.getElementById('orderModal').classList.remove('show');
}

function selectPlan(plan) {
  selectedPlan = plan;
  updatePlanUI();
}

function updatePlanUI() {
  document.querySelectorAll('.plan-btn').forEach(btn => {
    btn.classList.remove('border-farm-500', 'bg-farm-50');
    btn.classList.add('border-gray-200');
  });
  const active = document.getElementById('plan-' + selectedPlan);
  if (active) {
    active.classList.add('border-farm-500', 'bg-farm-50');
    active.classList.remove('border-gray-200');
  }
}

function selectFreq(freq) {
  selectedFreq = freq;
  updateFreqUI();
}

function updateFreqUI() {
  document.querySelectorAll('.freq-btn').forEach(btn => {
    btn.classList.remove('border-farm-500', 'bg-farm-50');
    btn.classList.add('border-gray-200');
  });
  const active = document.getElementById('freq-' + selectedFreq);
  if (active) {
    active.classList.add('border-farm-500', 'bg-farm-50');
    active.classList.remove('border-gray-200');
  }
}

function submitOrder() {
  document.getElementById('successPlan').textContent = planNames[selectedPlan] + ' (' + planPrices[selectedPlan] + ')';
  document.getElementById('successFreq').textContent = freqNames[selectedFreq];
  document.getElementById('orderForm').classList.add('hidden');
  document.getElementById('orderSuccess').classList.remove('hidden');
}

// Close modal on overlay click
document.getElementById('orderModal').addEventListener('click', function(e) {
  if (e.target === this) closeOrderModal();
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
