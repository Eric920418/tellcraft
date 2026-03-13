INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '074cbebb-b538-4082-946d-4fc0f6c62921',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>球鞋共和國 SneakerRep</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { lime: { 400:'#a3e635',500:'#84cc16',600:'#65a30d' }, dark: { 900:'#0a0a0a',800:'#141414',700:'#1a1a1a',600:'#222222',500:'#2a2a2a' } } } } }
</script>
<style>
body { font-family: 'Outfit', sans-serif; background: #0a0a0a; color: #e5e7eb; scroll-behavior: smooth; }
.shoe-card { transition: all 0.4s cubic-bezier(0.25,0.46,0.45,0.94); cursor: pointer; }
.shoe-card:hover { transform: translateY(-8px) scale(1.02); }
.shoe-card:hover .shoe-img { transform: rotate(-12deg) scale(1.15); }
.shoe-img { transition: all 0.5s cubic-bezier(0.25,0.46,0.45,0.94); }
.brand-card { transition: all 0.3s; }
.brand-card:hover { transform: translateY(-4px); border-color: #a3e635; }
.category-btn { transition: all 0.2s; }
.category-btn.active { background: #a3e635; color: #0a0a0a; font-weight: 700; }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.4s ease; }
.faq-answer.open { max-height: 400px; }
.faq-chevron { transition: transform 0.3s; }
.faq-chevron.open { transform: rotate(180deg); }
.glow-lime { box-shadow: 0 0 40px rgba(163,230,53,0.15); }
.modal-overlay { opacity: 0; pointer-events: none; transition: opacity 0.3s; }
.modal-overlay.show { opacity: 1; pointer-events: auto; }
.modal-content { transform: scale(0.9) translateY(20px); transition: transform 0.3s; }
.modal-overlay.show .modal-content { transform: scale(1) translateY(0); }
.countdown-box { background: linear-gradient(135deg, #1a1a1a, #222); }
.step-line { background: linear-gradient(to bottom, #a3e635, transparent); }
@keyframes pulse-lime { 0%,100% { box-shadow: 0 0 0 0 rgba(163,230,53,0.4); } 50% { box-shadow: 0 0 0 10px rgba(163,230,53,0); } }
.pulse-lime { animation: pulse-lime 2s infinite; }
@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
.slide-up { animation: slideUp 0.5s ease forwards; }
</style>
</head>
<body>

<!-- Sticky Nav -->
<nav class="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-lg border-b border-white/5">
  <div class="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-lime-400 flex items-center justify-center text-sm font-extrabold text-dark-900">SR</div>
      <div><span class="text-lg font-bold tracking-widest text-white">SNEAKER REP</span><span class="block text-[10px] text-gray-500 tracking-wider -mt-0.5">球鞋共和國</span></div>
    </div>
    <div class="flex items-center gap-8 text-sm text-gray-400">
      <a onclick="document.getElementById('new-arrivals').scrollIntoView({behavior:'smooth'})" class="hover:text-lime-400 transition cursor-pointer">新品</a>
      <a onclick="document.getElementById('upcoming').scrollIntoView({behavior:'smooth'})" class="hover:text-lime-400 transition cursor-pointer">即將發售</a>
      <a onclick="document.getElementById('brands').scrollIntoView({behavior:'smooth'})" class="hover:text-lime-400 transition cursor-pointer">品牌</a>
      <a onclick="document.getElementById('auth-section').scrollIntoView({behavior:'smooth'})" class="hover:text-lime-400 transition cursor-pointer">鑑定</a>
      <a onclick="document.getElementById('faq').scrollIntoView({behavior:'smooth'})" class="hover:text-lime-400 transition cursor-pointer">FAQ</a>
      <button onclick="openSizeGuide()" class="hover:text-lime-400 transition cursor-pointer">尺碼表</button>
      <div class="flex items-center gap-4 ml-2">
        <svg class="w-5 h-5 text-gray-400 hover:text-lime-400 transition cursor-pointer" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <div class="relative cursor-pointer">
          <svg class="w-5 h-5 text-gray-400 hover:text-lime-400 transition" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
          <span id="cartBadge" class="absolute -top-1.5 -right-2 w-4 h-4 bg-lime-400 text-dark-900 text-[10px] rounded-full flex items-center justify-center font-bold">0</span>
        </div>
      </div>
    </div>
  </div>
</nav>

<!-- Quick View Modal -->
<div id="quickViewModal" class="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
  <div class="modal-content bg-dark-700 rounded-2xl p-8 w-full max-w-lg border border-white/10 relative">
    <button onclick="closeQuickView()" class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl transition">&times;</button>
    <div class="flex gap-6">
      <div class="w-40 h-40 bg-dark-600 rounded-xl flex items-center justify-center text-7xl flex-shrink-0" id="qvImage">👟</div>
      <div class="flex-1">
        <span class="text-xs text-gray-500 uppercase tracking-wider" id="qvBrand">Nike</span>
        <h3 class="text-xl font-bold text-white mt-1" id="qvName">Air Jordan 1 Retro High OG</h3>
        <div class="text-lime-400 text-2xl font-bold mt-2" id="qvPrice">NT$6,300</div>
        <div class="mt-4">
          <span class="text-xs text-gray-400 mb-2 block">選擇尺碼 (US)</span>
          <div class="grid grid-cols-6 gap-1.5" id="qvSizes"></div>
        </div>
        <div class="flex gap-3 mt-5">
          <button onclick="addToCartAnim()" id="qvCartBtn" class="flex-1 bg-lime-400 hover:bg-lime-500 text-dark-900 py-2.5 rounded-lg font-bold text-sm transition">加入購物車</button>
          <button class="border border-white/20 text-white px-4 py-2.5 rounded-lg text-sm hover:border-lime-400 hover:text-lime-400 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Size Guide Modal -->
<div id="sizeGuideModal" class="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
  <div class="modal-content bg-dark-700 rounded-2xl p-8 w-full max-w-xl border border-white/10 relative">
    <button onclick="closeSizeGuide()" class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl transition">&times;</button>
    <div class="text-center mb-6">
      <div class="text-3xl mb-2">📏</div>
      <h3 class="text-xl font-bold text-white">球鞋尺碼對照表</h3>
      <p class="text-sm text-gray-400 mt-1">建議依品牌實際試穿為準</p>
    </div>
    <div class="overflow-hidden rounded-xl border border-white/10">
      <table class="w-full text-sm">
        <thead><tr class="bg-dark-600 text-gray-300">
          <th class="py-3 px-4 text-left font-semibold">US 男鞋</th>
          <th class="py-3 px-4 text-center font-semibold">EU</th>
          <th class="py-3 px-4 text-center font-semibold">CM</th>
        </tr></thead>
        <tbody>
          <tr class="border-t border-white/5"><td class="py-2.5 px-4 text-white">7</td><td class="py-2.5 px-4 text-center text-gray-300">40</td><td class="py-2.5 px-4 text-center text-gray-300">25.0</td></tr>
          <tr class="border-t border-white/5 bg-white/[0.02]"><td class="py-2.5 px-4 text-white">7.5</td><td class="py-2.5 px-4 text-center text-gray-300">40.5</td><td class="py-2.5 px-4 text-center text-gray-300">25.5</td></tr>
          <tr class="border-t border-white/5"><td class="py-2.5 px-4 text-white">8</td><td class="py-2.5 px-4 text-center text-gray-300">41</td><td class="py-2.5 px-4 text-center text-gray-300">26.0</td></tr>
          <tr class="border-t border-white/5 bg-white/[0.02]"><td class="py-2.5 px-4 text-white">8.5</td><td class="py-2.5 px-4 text-center text-gray-300">42</td><td class="py-2.5 px-4 text-center text-gray-300">26.5</td></tr>
          <tr class="border-t border-white/5"><td class="py-2.5 px-4 text-white">9</td><td class="py-2.5 px-4 text-center text-gray-300">42.5</td><td class="py-2.5 px-4 text-center text-gray-300">27.0</td></tr>
          <tr class="border-t border-white/5 bg-white/[0.02]"><td class="py-2.5 px-4 text-white">9.5</td><td class="py-2.5 px-4 text-center text-gray-300">43</td><td class="py-2.5 px-4 text-center text-gray-300">27.5</td></tr>
          <tr class="border-t border-white/5"><td class="py-2.5 px-4 text-white">10</td><td class="py-2.5 px-4 text-center text-gray-300">44</td><td class="py-2.5 px-4 text-center text-gray-300">28.0</td></tr>
          <tr class="border-t border-white/5 bg-white/[0.02]"><td class="py-2.5 px-4 text-white">10.5</td><td class="py-2.5 px-4 text-center text-gray-300">44.5</td><td class="py-2.5 px-4 text-center text-gray-300">28.5</td></tr>
          <tr class="border-t border-white/5"><td class="py-2.5 px-4 text-white">11</td><td class="py-2.5 px-4 text-center text-gray-300">45</td><td class="py-2.5 px-4 text-center text-gray-300">29.0</td></tr>
          <tr class="border-t border-white/5 bg-white/[0.02]"><td class="py-2.5 px-4 text-white">11.5</td><td class="py-2.5 px-4 text-center text-gray-300">45.5</td><td class="py-2.5 px-4 text-center text-gray-300">29.5</td></tr>
          <tr class="border-t border-white/5"><td class="py-2.5 px-4 text-white">12</td><td class="py-2.5 px-4 text-center text-gray-300">46</td><td class="py-2.5 px-4 text-center text-gray-300">30.0</td></tr>
        </tbody>
      </table>
    </div>
    <p class="text-xs text-gray-500 mt-4 text-center">💡 Nike / Jordan 建議選大半號 ｜ adidas 正常尺碼 ｜ New Balance 偏大半號</p>
  </div>
</div>

<!-- Hero Section -->
<section class="min-h-[85vh] flex items-center relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-lime-400/10 via-transparent to-transparent"></div>
  <div class="absolute top-32 right-16 w-[500px] h-[500px] bg-lime-400/8 rounded-full blur-[150px]"></div>
  <div class="absolute bottom-20 left-10 w-64 h-64 bg-lime-400/5 rounded-full blur-[100px]"></div>
  <div class="max-w-7xl mx-auto px-6 flex items-center gap-14 relative">
    <div class="flex-1">
      <span class="inline-flex items-center gap-2 text-xs bg-lime-400/10 text-lime-400 border border-lime-400/20 px-4 py-1.5 rounded-full font-semibold mb-6 tracking-wider">
        <span class="w-2 h-2 bg-lime-400 rounded-full pulse-lime"></span>
        JUST DROPPED
      </span>
      <h1 class="text-7xl font-extrabold leading-[0.9] mb-5 tracking-tight">AIR MAX<br><span class="text-lime-400">DN8</span></h1>
      <p class="text-gray-400 text-base mb-8 max-w-md leading-relaxed">Nike 最新動態氣墊科技，8 個獨立氣墊單元帶來前所未有的緩震體驗。全球限量 5,000 雙，台灣配額僅 200 雙。</p>
      <div class="flex gap-4 mb-10">
        <button onclick="openQuickView('Nike','Air Max DN8','NT$7,200')" class="bg-lime-400 hover:bg-lime-500 text-dark-900 px-10 py-3.5 rounded-lg text-sm font-bold tracking-wider transition glow-lime">立即搶購 NT$7,200</button>
        <button onclick="openSizeGuide()" class="border border-white/20 text-white px-8 py-3.5 rounded-lg text-sm hover:border-lime-400 hover:text-lime-400 transition">尺碼指南</button>
      </div>
      <!-- Countdown -->
      <div>
        <span class="text-xs text-gray-500 uppercase tracking-wider mb-3 block">限時搶購倒數</span>
        <div class="flex gap-3">
          <div class="countdown-box rounded-lg px-4 py-3 text-center border border-white/5"><div class="text-2xl font-bold text-white" id="cd-days">02</div><div class="text-[10px] text-gray-500 mt-0.5">DAYS</div></div>
          <div class="countdown-box rounded-lg px-4 py-3 text-center border border-white/5"><div class="text-2xl font-bold text-white" id="cd-hours">18</div><div class="text-[10px] text-gray-500 mt-0.5">HOURS</div></div>
          <div class="countdown-box rounded-lg px-4 py-3 text-center border border-white/5"><div class="text-2xl font-bold text-white" id="cd-mins">45</div><div class="text-[10px] text-gray-500 mt-0.5">MINS</div></div>
          <div class="countdown-box rounded-lg px-4 py-3 text-center border border-white/5"><div class="text-2xl font-bold text-lime-400" id="cd-secs">30</div><div class="text-[10px] text-gray-500 mt-0.5">SECS</div></div>
        </div>
      </div>
    </div>
    <div class="w-[380px] h-[380px] flex items-center justify-center relative">
      <div class="absolute inset-0 bg-lime-400/5 rounded-full blur-3xl"></div>
      <span class="text-[180px] drop-shadow-2xl relative z-10" style="filter: drop-shadow(0 0 40px rgba(163,230,53,0.2));">👟</span>
    </div>
  </div>
</section>

<!-- Stats Bar -->
<section class="py-6 border-y border-white/5 bg-dark-800">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid grid-cols-4 gap-6">
      <div class="text-center">
        <div class="text-2xl font-bold text-white">2,000+</div>
        <div class="text-xs text-gray-500 mt-0.5">鞋款收錄</div>
      </div>
      <div class="text-center border-l border-white/5">
        <div class="text-2xl font-bold text-lime-400">100%</div>
        <div class="text-xs text-gray-500 mt-0.5">正品保證</div>
      </div>
      <div class="text-center border-l border-white/5">
        <div class="text-2xl font-bold text-white">免運費</div>
        <div class="text-xs text-gray-500 mt-0.5">滿 NT$3,000 免運</div>
      </div>
      <div class="text-center border-l border-white/5">
        <div class="text-2xl font-bold text-white">30 天</div>
        <div class="text-xs text-gray-500 mt-0.5">鑑賞期</div>
      </div>
    </div>
  </div>
</section>

<!-- New Arrivals - 8 Product Cards -->
<section id="new-arrivals" class="py-20">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex items-end justify-between mb-10">
      <div>
        <span class="text-xs text-lime-400 font-semibold tracking-widest uppercase">NEW IN</span>
        <h2 class="text-3xl font-bold mt-1 tracking-tight">本週新品</h2>
      </div>
      <div class="flex gap-2 text-xs">
        <button onclick="filterCategory('all')" class="category-btn active px-4 py-2 rounded-lg bg-white/5 text-gray-400 font-medium" data-cat="all">全部</button>
        <button onclick="filterCategory('jordan')" class="category-btn px-4 py-2 rounded-lg bg-white/5 text-gray-400 font-medium" data-cat="jordan">Jordan</button>
        <button onclick="filterCategory('nike')" class="category-btn px-4 py-2 rounded-lg bg-white/5 text-gray-400 font-medium" data-cat="nike">Nike</button>
        <button onclick="filterCategory('adidas')" class="category-btn px-4 py-2 rounded-lg bg-white/5 text-gray-400 font-medium" data-cat="adidas">adidas</button>
        <button onclick="filterCategory('nb')" class="category-btn px-4 py-2 rounded-lg bg-white/5 text-gray-400 font-medium" data-cat="nb">New Balance</button>
      </div>
    </div>
    <div class="grid grid-cols-4 gap-5" id="productGrid">
      <!-- Card 1 -->
      <div class="shoe-card bg-dark-700 rounded-xl overflow-hidden border border-white/5 hover:border-lime-400/30" data-category="jordan" onclick="openQuickView('Jordan','Air Jordan 1 Retro High OG Chicago','NT$6,800')">
        <div class="h-52 bg-gradient-to-b from-red-500/15 to-transparent flex items-center justify-center relative">
          <span class="absolute top-3 left-3 text-[10px] bg-lime-400 text-dark-900 px-2 py-0.5 rounded font-bold">NEW</span>
          <span class="shoe-img text-7xl">👟</span>
        </div>
        <div class="p-4">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider">Jordan</span>
          <h3 class="font-bold text-white text-sm mt-1">Air Jordan 1 Retro High OG</h3>
          <p class="text-[11px] text-gray-500 mt-0.5">Chicago 配色</p>
          <div class="flex items-center justify-between mt-3">
            <span class="text-lime-400 font-bold">NT$6,800</span>
            <button class="text-[11px] bg-lime-400/10 text-lime-400 px-3 py-1 rounded-md font-semibold hover:bg-lime-400 hover:text-dark-900 transition">搶購</button>
          </div>
        </div>
      </div>
      <!-- Card 2 -->
      <div class="shoe-card bg-dark-700 rounded-xl overflow-hidden border border-white/5 hover:border-lime-400/30" data-category="adidas" onclick="openQuickView('adidas','Yeezy Boost 350 V2 Bone','NT$8,500')">
        <div class="h-52 bg-gradient-to-b from-amber-500/15 to-transparent flex items-center justify-center relative">
          <span class="absolute top-3 left-3 text-[10px] bg-amber-400 text-dark-900 px-2 py-0.5 rounded font-bold">HOT</span>
          <span class="shoe-img text-7xl">👟</span>
        </div>
        <div class="p-4">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider">adidas</span>
          <h3 class="font-bold text-white text-sm mt-1">Yeezy Boost 350 V2</h3>
          <p class="text-[11px] text-gray-500 mt-0.5">Bone 配色</p>
          <div class="flex items-center justify-between mt-3">
            <span class="text-lime-400 font-bold">NT$8,500</span>
            <button class="text-[11px] bg-lime-400/10 text-lime-400 px-3 py-1 rounded-md font-semibold hover:bg-lime-400 hover:text-dark-900 transition">搶購</button>
          </div>
        </div>
      </div>
      <!-- Card 3 -->
      <div class="shoe-card bg-dark-700 rounded-xl overflow-hidden border border-white/5 hover:border-lime-400/30" data-category="nb" onclick="openQuickView('New Balance','993 Made in USA Grey','NT$5,980')">
        <div class="h-52 bg-gradient-to-b from-gray-500/15 to-transparent flex items-center justify-center relative">
          <span class="shoe-img text-7xl">👟</span>
        </div>
        <div class="p-4">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider">New Balance</span>
          <h3 class="font-bold text-white text-sm mt-1">993 Made in USA</h3>
          <p class="text-[11px] text-gray-500 mt-0.5">Grey 經典配色</p>
          <div class="flex items-center justify-between mt-3">
            <span class="text-lime-400 font-bold">NT$5,980</span>
            <button class="text-[11px] bg-lime-400/10 text-lime-400 px-3 py-1 rounded-md font-semibold hover:bg-lime-400 hover:text-dark-900 transition">搶購</button>
          </div>
        </div>
      </div>
      <!-- Card 4 -->
      <div class="shoe-card bg-dark-700 rounded-xl overflow-hidden border border-white/5 hover:border-lime-400/30 relative" data-category="nike" onclick="openQuickView('Nike x Travis Scott','Air Force 1 Low Cactus Jack','NT$12,800')">
        <span class="absolute top-3 right-3 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-bold z-10">限量</span>
        <div class="h-52 bg-gradient-to-b from-purple-500/15 to-transparent flex items-center justify-center relative">
          <span class="shoe-img text-7xl">👟</span>
        </div>
        <div class="p-4">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider">Nike x Travis Scott</span>
          <h3 class="font-bold text-white text-sm mt-1">Air Force 1 Low</h3>
          <p class="text-[11px] text-gray-500 mt-0.5">Cactus Jack 聯名</p>
          <div class="flex items-center justify-between mt-3">
            <span class="text-lime-400 font-bold">NT$12,800</span>
            <button class="text-[11px] bg-red-500/20 text-red-400 px-3 py-1 rounded-md font-semibold hover:bg-red-500 hover:text-white transition">即將售罄</button>
          </div>
        </div>
      </div>
      <!-- Card 5 -->
      <div class="shoe-card bg-dark-700 rounded-xl overflow-hidden border border-white/5 hover:border-lime-400/30" data-category="nike" onclick="openQuickView('Nike','Dunk Low Panda 2026','NT$3,600')">
        <div class="h-52 bg-gradient-to-b from-sky-500/15 to-transparent flex items-center justify-center relative">
          <span class="absolute top-3 left-3 text-[10px] bg-lime-400 text-dark-900 px-2 py-0.5 rounded font-bold">NEW</span>
          <span class="shoe-img text-7xl">👟</span>
        </div>
        <div class="p-4">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider">Nike</span>
          <h3 class="font-bold text-white text-sm mt-1">Dunk Low Panda 2026</h3>
          <p class="text-[11px] text-gray-500 mt-0.5">黑白經典配色</p>
          <div class="flex items-center justify-between mt-3">
            <span class="text-lime-400 font-bold">NT$3,600</span>
            <button class="text-[11px] bg-lime-400/10 text-lime-400 px-3 py-1 rounded-md font-semibold hover:bg-lime-400 hover:text-dark-900 transition">搶購</button>
          </div>
        </div>
      </div>
      <!-- Card 6 -->
      <div class="shoe-card bg-dark-700 rounded-xl overflow-hidden border border-white/5 hover:border-lime-400/30" data-category="jordan" onclick="openQuickView('Jordan','Air Jordan 4 Retro Military Blue','NT$7,200')">
        <div class="h-52 bg-gradient-to-b from-blue-500/15 to-transparent flex items-center justify-center relative">
          <span class="shoe-img text-7xl">👟</span>
        </div>
        <div class="p-4">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider">Jordan</span>
          <h3 class="font-bold text-white text-sm mt-1">Air Jordan 4 Retro</h3>
          <p class="text-[11px] text-gray-500 mt-0.5">Military Blue 配色</p>
          <div class="flex items-center justify-between mt-3">
            <span class="text-lime-400 font-bold">NT$7,200</span>
            <button class="text-[11px] bg-lime-400/10 text-lime-400 px-3 py-1 rounded-md font-semibold hover:bg-lime-400 hover:text-dark-900 transition">搶購</button>
          </div>
        </div>
      </div>
      <!-- Card 7 -->
      <div class="shoe-card bg-dark-700 rounded-xl overflow-hidden border border-white/5 hover:border-lime-400/30" data-category="adidas" onclick="openQuickView('adidas','Samba OG Cream White','NT$3,290')">
        <div class="h-52 bg-gradient-to-b from-emerald-500/15 to-transparent flex items-center justify-center relative">
          <span class="absolute top-3 left-3 text-[10px] bg-emerald-400 text-dark-900 px-2 py-0.5 rounded font-bold">TREND</span>
          <span class="shoe-img text-7xl">👟</span>
        </div>
        <div class="p-4">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider">adidas</span>
          <h3 class="font-bold text-white text-sm mt-1">Samba OG</h3>
          <p class="text-[11px] text-gray-500 mt-0.5">Cream White 奶油配色</p>
          <div class="flex items-center justify-between mt-3">
            <span class="text-lime-400 font-bold">NT$3,290</span>
            <button class="text-[11px] bg-lime-400/10 text-lime-400 px-3 py-1 rounded-md font-semibold hover:bg-lime-400 hover:text-dark-900 transition">搶購</button>
          </div>
        </div>
      </div>
      <!-- Card 8 -->
      <div class="shoe-card bg-dark-700 rounded-xl overflow-hidden border border-white/5 hover:border-lime-400/30" data-category="nb" onclick="openQuickView('New Balance','2002R Protection Pack Rain Cloud','NT$4,680')">
        <div class="h-52 bg-gradient-to-b from-teal-500/15 to-transparent flex items-center justify-center relative">
          <span class="shoe-img text-7xl">👟</span>
        </div>
        <div class="p-4">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider">New Balance</span>
          <h3 class="font-bold text-white text-sm mt-1">2002R Protection Pack</h3>
          <p class="text-[11px] text-gray-500 mt-0.5">Rain Cloud 配色</p>
          <div class="flex items-center justify-between mt-3">
            <span class="text-lime-400 font-bold">NT$4,680</span>
            <button class="text-[11px] bg-lime-400/10 text-lime-400 px-3 py-1 rounded-md font-semibold hover:bg-lime-400 hover:text-dark-900 transition">搶購</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Upcoming Releases -->
<section id="upcoming" class="py-20 border-t border-white/5">
  <div class="max-w-7xl mx-auto px-6">
    <div class="mb-10">
      <span class="text-xs text-lime-400 font-semibold tracking-widest uppercase">COMING SOON</span>
      <h2 class="text-3xl font-bold mt-1 tracking-tight">即將發售</h2>
    </div>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-dark-700 rounded-xl overflow-hidden border border-white/5 hover:border-lime-400/20 transition group cursor-pointer">
        <div class="h-56 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-transparent flex items-center justify-center">
          <span class="text-8xl group-hover:scale-110 transition duration-500">👟</span>
        </div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] text-gray-500 uppercase tracking-wider">Nike</span>
            <span class="text-[10px] bg-lime-400/10 text-lime-400 px-2 py-0.5 rounded font-semibold">2/28 發售</span>
          </div>
          <h3 class="font-bold text-white">Air Max 1 OG 'Big Bubble'</h3>
          <p class="text-sm text-gray-500 mt-1">經典大氣墊回歸，Sport Red 原始配色復刻</p>
          <div class="flex items-center justify-between mt-4">
            <span class="text-lime-400 font-bold text-lg">NT$5,400</span>
            <button class="text-xs border border-lime-400/30 text-lime-400 px-4 py-1.5 rounded-lg font-semibold hover:bg-lime-400 hover:text-dark-900 transition">設定提醒</button>
          </div>
        </div>
      </div>
      <div class="bg-dark-700 rounded-xl overflow-hidden border border-white/5 hover:border-lime-400/20 transition group cursor-pointer">
        <div class="h-56 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent flex items-center justify-center">
          <span class="text-8xl group-hover:scale-110 transition duration-500">👟</span>
        </div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] text-gray-500 uppercase tracking-wider">Jordan</span>
            <span class="text-[10px] bg-lime-400/10 text-lime-400 px-2 py-0.5 rounded font-semibold">3/08 發售</span>
          </div>
          <h3 class="font-bold text-white">Air Jordan 11 Retro 'Cool Grey'</h3>
          <p class="text-sm text-gray-500 mt-1">2026 復刻版，碳纖維底板搭配全掌 Zoom Air</p>
          <div class="flex items-center justify-between mt-4">
            <span class="text-lime-400 font-bold text-lg">NT$8,200</span>
            <button class="text-xs border border-lime-400/30 text-lime-400 px-4 py-1.5 rounded-lg font-semibold hover:bg-lime-400 hover:text-dark-900 transition">設定提醒</button>
          </div>
        </div>
      </div>
      <div class="bg-dark-700 rounded-xl overflow-hidden border border-white/5 hover:border-lime-400/20 transition group cursor-pointer">
        <div class="h-56 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-transparent flex items-center justify-center">
          <span class="text-8xl group-hover:scale-110 transition duration-500">👟</span>
        </div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] text-gray-500 uppercase tracking-wider">adidas</span>
            <span class="text-[10px] bg-lime-400/10 text-lime-400 px-2 py-0.5 rounded font-semibold">3/15 發售</span>
          </div>
          <h3 class="font-bold text-white">adidas Gazelle Indoor 'Green'</h3>
          <p class="text-sm text-gray-500 mt-1">復古室內訓練鞋，麂皮鞋面搭配橡膠大底</p>
          <div class="flex items-center justify-between mt-4">
            <span class="text-lime-400 font-bold text-lg">NT$3,690</span>
            <button class="text-xs border border-lime-400/30 text-lime-400 px-4 py-1.5 rounded-lg font-semibold hover:bg-lime-400 hover:text-dark-900 transition">設定提醒</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Brand Zone -->
<section id="brands" class="py-20 border-t border-white/5 bg-dark-800">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs text-lime-400 font-semibold tracking-widest uppercase">BRANDS</span>
      <h2 class="text-3xl font-bold mt-1 tracking-tight">品牌專區</h2>
      <p class="text-gray-500 text-sm mt-2">精選全球頂尖運動品牌，100% 官方授權</p>
    </div>
    <div class="grid grid-cols-4 gap-5">
      <div class="brand-card bg-dark-700 rounded-xl p-6 border border-white/5 text-center cursor-pointer group" onclick="filterCategory('nike');document.getElementById('new-arrivals').scrollIntoView({behavior:'smooth'})">
        <div class="w-16 h-16 mx-auto mb-4 bg-dark-600 rounded-full flex items-center justify-center text-3xl group-hover:bg-lime-400/10 transition">
          <svg class="w-10 h-6 text-white" viewBox="0 0 69 32" fill="currentColor"><path d="M68.56 4.05C53.1 13.55 34.56 25.34 17.98 31.27 11.19 33.67 3.17 33.36.37 27.67c-1.72-3.5-.56-8.18 2.91-11.76C9.15 10.14 19.6 5.1 29.19 2.16L27.1.54C16.76 3.8 5.57 9.52 1.4 16.62c-3.09 5.26-2.1 11.87 3.36 15.12 4.5 2.68 10.83 2.03 16.13-.27C38.2 24.3 57.1 10.54 68.56 4.05z"/></svg>
        </div>
        <h3 class="font-bold text-white text-lg">Nike</h3>
        <p class="text-xs text-gray-500 mt-1">Air Max / Dunk / AF1</p>
        <span class="text-lime-400 text-xs font-semibold mt-3 inline-block group-hover:underline">探索 320+ 鞋款 &rarr;</span>
      </div>
      <div class="brand-card bg-dark-700 rounded-xl p-6 border border-white/5 text-center cursor-pointer group" onclick="filterCategory('jordan');document.getElementById('new-arrivals').scrollIntoView({behavior:'smooth'})">
        <div class="w-16 h-16 mx-auto mb-4 bg-dark-600 rounded-full flex items-center justify-center text-3xl group-hover:bg-lime-400/10 transition">
          <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M13.64 6.13c.18-.33.63-.36.84-.06l5.43 7.82a.5.5 0 01-.07.64l-3.32 3.07a.5.5 0 01-.68 0L12 14.24l-3.84 3.36a.5.5 0 01-.68 0L4.16 14.53a.5.5 0 01-.07-.64l5.43-7.82c.21-.3.66-.27.84.06L12 9.2l1.64-3.07z"/></svg>
        </div>
        <h3 class="font-bold text-white text-lg">Jordan</h3>
        <p class="text-xs text-gray-500 mt-1">AJ1 / AJ4 / AJ11</p>
        <span class="text-lime-400 text-xs font-semibold mt-3 inline-block group-hover:underline">探索 280+ 鞋款 &rarr;</span>
      </div>
      <div class="brand-card bg-dark-700 rounded-xl p-6 border border-white/5 text-center cursor-pointer group" onclick="filterCategory('adidas');document.getElementById('new-arrivals').scrollIntoView({behavior:'smooth'})">
        <div class="w-16 h-16 mx-auto mb-4 bg-dark-600 rounded-full flex items-center justify-center text-3xl group-hover:bg-lime-400/10 transition">
          <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h6.5l8-14H9.5L1 21zm8.5 0H16l4.5-7.88L16.58 6H10.5l-1 1.75L15 17h-3.5L8 21h1.5zm10 0h3.5l-5-8.75-1.75 3.06L19.5 21z"/></svg>
        </div>
        <h3 class="font-bold text-white text-lg">adidas</h3>
        <p class="text-xs text-gray-500 mt-1">Yeezy / Samba / Gazelle</p>
        <span class="text-lime-400 text-xs font-semibold mt-3 inline-block group-hover:underline">探索 250+ 鞋款 &rarr;</span>
      </div>
      <div class="brand-card bg-dark-700 rounded-xl p-6 border border-white/5 text-center cursor-pointer group" onclick="filterCategory('nb');document.getElementById('new-arrivals').scrollIntoView({behavior:'smooth'})">
        <div class="w-16 h-16 mx-auto mb-4 bg-dark-600 rounded-full flex items-center justify-center text-3xl group-hover:bg-lime-400/10 transition">
          <span class="text-white font-extrabold text-xl tracking-tighter">NB</span>
        </div>
        <h3 class="font-bold text-white text-lg">New Balance</h3>
        <p class="text-xs text-gray-500 mt-1">993 / 2002R / 550</p>
        <span class="text-lime-400 text-xs font-semibold mt-3 inline-block group-hover:underline">探索 180+ 鞋款 &rarr;</span>
      </div>
    </div>
  </div>
</section>

<!-- Authentication Process -->
<section id="auth-section" class="py-20 border-t border-white/5">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-14">
      <span class="text-xs text-lime-400 font-semibold tracking-widest uppercase">LEGIT CHECK</span>
      <h2 class="text-3xl font-bold mt-1 tracking-tight">鑑定保證</h2>
      <p class="text-gray-500 text-sm mt-2">業界最嚴格的三重鑑定流程，讓你安心購買</p>
    </div>
    <div class="grid grid-cols-3 gap-8">
      <div class="text-center relative">
        <div class="w-20 h-20 mx-auto mb-5 bg-lime-400/10 rounded-2xl flex items-center justify-center border border-lime-400/20">
          <span class="text-3xl">🔬</span>
        </div>
        <div class="absolute top-10 right-0 w-1/2 h-px bg-gradient-to-r from-lime-400/30 to-transparent hidden lg:block"></div>
        <span class="inline-block text-[10px] bg-lime-400 text-dark-900 px-2 py-0.5 rounded font-bold mb-3">STEP 1</span>
        <h3 class="font-bold text-white text-lg">AI 影像鑑定</h3>
        <p class="text-sm text-gray-500 mt-2 leading-relaxed">採用 AI 電腦視覺技術，比對超過 50 萬張正品資料庫影像，精準辨識材質紋理與車線細節。</p>
      </div>
      <div class="text-center relative">
        <div class="w-20 h-20 mx-auto mb-5 bg-lime-400/10 rounded-2xl flex items-center justify-center border border-lime-400/20">
          <span class="text-3xl">👨‍🔬</span>
        </div>
        <div class="absolute top-10 right-0 w-1/2 h-px bg-gradient-to-r from-lime-400/30 to-transparent hidden lg:block"></div>
        <span class="inline-block text-[10px] bg-lime-400 text-dark-900 px-2 py-0.5 rounded font-bold mb-3">STEP 2</span>
        <h3 class="font-bold text-white text-lg">專家人工複驗</h3>
        <p class="text-sm text-gray-500 mt-2 leading-relaxed">資深鑑定師逐雙檢查，從鞋標字體、膠水痕跡到鞋盒細節，確保零瑕疵通過。</p>
      </div>
      <div class="text-center">
        <div class="w-20 h-20 mx-auto mb-5 bg-lime-400/10 rounded-2xl flex items-center justify-center border border-lime-400/20">
          <span class="text-3xl">🏷️</span>
        </div>
        <span class="inline-block text-[10px] bg-lime-400 text-dark-900 px-2 py-0.5 rounded font-bold mb-3">STEP 3</span>
        <h3 class="font-bold text-white text-lg">NFC 防偽標籤</h3>
        <p class="text-sm text-gray-500 mt-2 leading-relaxed">每雙鞋附加獨一無二的 NFC 晶片，手機一感應即可查詢完整鑑定報告與履歷。</p>
      </div>
    </div>
    <div class="mt-12 text-center">
      <div class="inline-flex items-center gap-2 bg-dark-700 border border-white/5 rounded-full px-6 py-3 text-sm text-gray-400">
        <span class="text-lime-400">&#10003;</span> 鑑定不通過全額退款
        <span class="mx-3 text-white/10">|</span>
        <span class="text-lime-400">&#10003;</span> 鑑定報告永久保存
        <span class="mx-3 text-white/10">|</span>
        <span class="text-lime-400">&#10003;</span> 30 天無條件退換
      </div>
    </div>
  </div>
</section>

<!-- Customer Reviews -->
<section class="py-20 border-t border-white/5 bg-dark-800">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs text-lime-400 font-semibold tracking-widest uppercase">REVIEWS</span>
      <h2 class="text-3xl font-bold mt-1 tracking-tight">鞋友評價</h2>
      <p class="text-gray-500 text-sm mt-2">超過 15,000 位鞋友的真實回饋</p>
    </div>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-dark-700 rounded-xl p-6 border border-white/5">
        <div class="flex items-center gap-1 mb-3">
          <span class="text-lime-400 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
          <span class="text-xs text-gray-500 ml-1">5.0</span>
        </div>
        <p class="text-gray-300 text-sm leading-relaxed mb-4">「第一次在網路買球鞋就選了 SneakerRep，收到的 AJ1 品質超讚！NFC 鑑定標籤讓我超安心，以後都在這買了。」</p>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center text-dark-900 text-xs font-bold">K</div>
          <div><div class="text-sm font-semibold text-white">Kevin L.</div><div class="text-[11px] text-gray-500">購買 Air Jordan 1 Chicago</div></div>
        </div>
      </div>
      <div class="bg-dark-700 rounded-xl p-6 border border-white/5">
        <div class="flex items-center gap-1 mb-3">
          <span class="text-lime-400 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
          <span class="text-xs text-gray-500 ml-1">5.0</span>
        </div>
        <p class="text-gray-300 text-sm leading-relaxed mb-4">「物流超快！下單隔天就收到，包裝也很用心。Yeezy 350 穿起來超舒服，鑑定報告很詳細，值得信賴的平台。」</p>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">S</div>
          <div><div class="text-sm font-semibold text-white">Sophie C.</div><div class="text-[11px] text-gray-500">購買 Yeezy 350 V2 Bone</div></div>
        </div>
      </div>
      <div class="bg-dark-700 rounded-xl p-6 border border-white/5">
        <div class="flex items-center gap-1 mb-3">
          <span class="text-lime-400 text-sm">&#9733;&#9733;&#9733;&#9733;</span><span class="text-gray-600 text-sm">&#9733;</span>
          <span class="text-xs text-gray-500 ml-1">4.0</span>
        </div>
        <p class="text-gray-300 text-sm leading-relaxed mb-4">「比其他平台便宜不少，而且有完整的尺碼對照表，不怕買錯號。New Balance 993 穿起來腳感一流，推薦大家！」</p>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">M</div>
          <div><div class="text-sm font-semibold text-white">Mike W.</div><div class="text-[11px] text-gray-500">購買 New Balance 993 Grey</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Size Guide Section -->
<section id="size-guide" class="py-20 border-t border-white/5">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex items-start gap-14">
      <div class="flex-1">
        <span class="text-xs text-lime-400 font-semibold tracking-widest uppercase">SIZE GUIDE</span>
        <h2 class="text-3xl font-bold mt-1 tracking-tight mb-4">尺碼指南</h2>
        <p class="text-gray-500 text-sm leading-relaxed mb-6">不確定自己的尺碼？別擔心！我們提供完整的尺碼對照表和品牌建議，幫你找到最合腳的那一雙。</p>
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <span class="text-lime-400 mt-0.5">&#10003;</span>
            <div><span class="text-white text-sm font-semibold">Nike / Jordan</span><span class="text-gray-500 text-sm"> - 建議選大半號，偏窄版型</span></div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-lime-400 mt-0.5">&#10003;</span>
            <div><span class="text-white text-sm font-semibold">adidas</span><span class="text-gray-500 text-sm"> - 正常尺碼即可，Yeezy 建議大半號</span></div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-lime-400 mt-0.5">&#10003;</span>
            <div><span class="text-white text-sm font-semibold">New Balance</span><span class="text-gray-500 text-sm"> - 偏大半號，寬楦設計舒適</span></div>
          </div>
        </div>
        <button onclick="openSizeGuide()" class="mt-8 bg-lime-400 hover:bg-lime-500 text-dark-900 px-6 py-3 rounded-lg font-bold text-sm transition">查看完整尺碼表</button>
      </div>
      <div class="w-80 h-72 bg-dark-700 rounded-2xl border border-white/5 flex items-center justify-center">
        <div class="text-center">
          <span class="text-7xl">📏</span>
          <p class="text-gray-500 text-sm mt-4">找到你的完美尺碼</p>
          <p class="text-lime-400 font-bold text-lg mt-1">US 7 - 12</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FAQ Accordion -->
<section id="faq" class="py-20 border-t border-white/5 bg-dark-800">
  <div class="max-w-3xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs text-lime-400 font-semibold tracking-widest uppercase">FAQ</span>
      <h2 class="text-3xl font-bold mt-1 tracking-tight">常見問題</h2>
    </div>
    <div class="space-y-3">
      <div class="bg-dark-700 rounded-xl border border-white/5 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left">
          <span class="font-semibold text-white text-sm">如何確認球鞋是正品？</span>
          <svg class="faq-chevron w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="faq-answer px-5">
          <p class="text-sm text-gray-400 pb-5 leading-relaxed">我們採用業界最嚴格的三重鑑定流程：AI 影像比對、專家人工複驗、NFC 防偽標籤。每雙鞋都附有完整鑑定報告，手機感應 NFC 即可查詢。鑑定不通過 100% 全額退款。</p>
        </div>
      </div>
      <div class="bg-dark-700 rounded-xl border border-white/5 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left">
          <span class="font-semibold text-white text-sm">運費怎麼計算？多久會到貨？</span>
          <svg class="faq-chevron w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="faq-answer px-5">
          <p class="text-sm text-gray-400 pb-5 leading-relaxed">滿 NT$3,000 即享免運費。台灣本島配送 1-2 個工作天，離島 3-5 個工作天。急件可選擇當日達服務（限雙北地區，加收 NT$150）。所有訂單皆提供即時物流追蹤。</p>
        </div>
      </div>
      <div class="bg-dark-700 rounded-xl border border-white/5 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left">
          <span class="font-semibold text-white text-sm">可以退換貨嗎？</span>
          <svg class="faq-chevron w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="faq-answer px-5">
          <p class="text-sm text-gray-400 pb-5 leading-relaxed">提供 30 天無條件鑑賞期。商品未拆封、未使用可全額退款。已拆封但尺碼不合可免費換貨一次（需保持鞋況完好）。退換貨運費由我們負擔，退款 3-5 個工作天入帳。</p>
        </div>
      </div>
      <div class="bg-dark-700 rounded-xl border border-white/5 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left">
          <span class="font-semibold text-white text-sm">支援哪些付款方式？</span>
          <svg class="faq-chevron w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="faq-answer px-5">
          <p class="text-sm text-gray-400 pb-5 leading-relaxed">支援信用卡（Visa/Mastercard/JCB）、LINE Pay、Apple Pay、Google Pay、ATM 轉帳、超商代碼繳費。信用卡可享 3/6/12 期零利率分期（依銀行規定）。</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Newsletter CTA -->
<section class="py-20 border-t border-white/5 relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-r from-lime-400/5 via-transparent to-lime-400/5"></div>
  <div class="max-w-7xl mx-auto px-6 relative">
    <div class="bg-dark-700 rounded-2xl p-12 border border-lime-400/10 text-center relative overflow-hidden">
      <div class="absolute top-0 right-0 w-60 h-60 bg-lime-400/5 rounded-full blur-[80px]"></div>
      <div class="absolute bottom-0 left-0 w-40 h-40 bg-lime-400/5 rounded-full blur-[60px]"></div>
      <div class="relative">
        <span class="text-4xl mb-4 inline-block">🔥</span>
        <h2 class="text-3xl font-bold tracking-tight mb-3">加入球鞋共和國</h2>
        <p class="text-gray-400 mb-8 max-w-md mx-auto">搶先收到限量發售通知、獨家折扣和鞋圈最新消息。已有 25,000+ 鞋友加入！</p>
        <div class="flex gap-3 max-w-md mx-auto" id="newsletterForm">
          <input type="email" placeholder="輸入你的 Email" class="flex-1 bg-dark-600 border border-white/10 rounded-lg px-5 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-lime-400 transition" id="newsletterEmail">
          <button onclick="submitNewsletter()" class="bg-lime-400 hover:bg-lime-500 text-dark-900 px-8 py-3 rounded-lg font-bold text-sm tracking-wider transition whitespace-nowrap">免費訂閱</button>
        </div>
        <p class="text-xs text-gray-600 mt-3">我們尊重你的隱私，不會發送垃圾郵件</p>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-white/5 bg-dark-900 py-14">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid grid-cols-4 gap-10 mb-10">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center text-xs font-extrabold text-dark-900">SR</div>
          <span class="font-bold tracking-widest text-white">SNEAKER REP</span>
        </div>
        <p class="text-sm text-gray-500 leading-relaxed">台灣最值得信賴的球鞋電商平台。100% 正品保證，三重鑑定流程守護每一雙。</p>
        <div class="flex gap-3 mt-5">
          <a class="w-9 h-9 bg-dark-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-lime-400 hover:border-lime-400/30 border border-white/5 transition cursor-pointer text-sm">IG</a>
          <a class="w-9 h-9 bg-dark-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-lime-400 hover:border-lime-400/30 border border-white/5 transition cursor-pointer text-sm">X</a>
          <a class="w-9 h-9 bg-dark-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-lime-400 hover:border-lime-400/30 border border-white/5 transition cursor-pointer text-sm">YT</a>
          <a class="w-9 h-9 bg-dark-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-lime-400 hover:border-lime-400/30 border border-white/5 transition cursor-pointer text-sm">FB</a>
        </div>
      </div>
      <div>
        <h4 class="font-semibold text-white text-sm mb-4">商品分類</h4>
        <div class="space-y-2.5 text-sm text-gray-500">
          <a class="block hover:text-lime-400 transition cursor-pointer">Nike 專區</a>
          <a class="block hover:text-lime-400 transition cursor-pointer">Jordan 專區</a>
          <a class="block hover:text-lime-400 transition cursor-pointer">adidas 專區</a>
          <a class="block hover:text-lime-400 transition cursor-pointer">New Balance 專區</a>
          <a class="block hover:text-lime-400 transition cursor-pointer">聯名限定</a>
        </div>
      </div>
      <div>
        <h4 class="font-semibold text-white text-sm mb-4">顧客服務</h4>
        <div class="space-y-2.5 text-sm text-gray-500">
          <a class="block hover:text-lime-400 transition cursor-pointer">尺碼指南</a>
          <a class="block hover:text-lime-400 transition cursor-pointer">運費說明</a>
          <a class="block hover:text-lime-400 transition cursor-pointer">退換貨政策</a>
          <a class="block hover:text-lime-400 transition cursor-pointer">鑑定流程</a>
          <a class="block hover:text-lime-400 transition cursor-pointer">聯絡客服</a>
        </div>
      </div>
      <div>
        <h4 class="font-semibold text-white text-sm mb-4">關於我們</h4>
        <div class="space-y-2.5 text-sm text-gray-500">
          <a class="block hover:text-lime-400 transition cursor-pointer">品牌故事</a>
          <a class="block hover:text-lime-400 transition cursor-pointer">鑑定團隊</a>
          <a class="block hover:text-lime-400 transition cursor-pointer">合作夥伴</a>
          <a class="block hover:text-lime-400 transition cursor-pointer">人才招募</a>
          <a class="block hover:text-lime-400 transition cursor-pointer">隱私權政策</a>
        </div>
      </div>
    </div>
    <div class="border-t border-white/5 pt-8 flex items-center justify-between">
      <span class="text-xs text-gray-600">&copy; 2026 球鞋共和國 SneakerRep. All rights reserved.</span>
      <div class="flex items-center gap-4 text-xs text-gray-600">
        <span>Visa</span><span>Mastercard</span><span>JCB</span><span>LINE Pay</span><span>Apple Pay</span>
      </div>
    </div>
  </div>
</footer>

<script>
// Cart count
let cartCount = 0;

// Quick View Modal
function openQuickView(brand, name, price) {
  document.getElementById('qvBrand').textContent = brand;
  document.getElementById('qvName').textContent = name;
  document.getElementById('qvPrice').textContent = price;
  const sizesEl = document.getElementById('qvSizes');
  sizesEl.innerHTML = '';
  for (let s = 7; s <= 12; s += 0.5) {
    const btn = document.createElement('button');
    btn.textContent = s % 1 === 0 ? s : s.toFixed(1);
    btn.className = 'text-xs py-1.5 rounded bg-dark-600 text-gray-300 hover:bg-lime-400 hover:text-dark-900 transition font-medium border border-white/5 hover:border-lime-400 size-btn';
    btn.onclick = function(e) {
      e.stopPropagation();
      document.querySelectorAll('.size-btn').forEach(b => { b.classList.remove('bg-lime-400','text-dark-900','border-lime-400'); b.classList.add('bg-dark-600','text-gray-300','border-white/5'); });
      this.classList.add('bg-lime-400','text-dark-900','border-lime-400');
      this.classList.remove('bg-dark-600','text-gray-300','border-white/5');
    };
    sizesEl.appendChild(btn);
  }
  const cartBtn = document.getElementById('qvCartBtn');
  cartBtn.textContent = '加入購物車';
  cartBtn.classList.remove('bg-green-500');
  cartBtn.classList.add('bg-lime-400');
  document.getElementById('quickViewModal').classList.add('show');
}
function closeQuickView() {
  document.getElementById('quickViewModal').classList.remove('show');
}

// Add to cart animation
function addToCartAnim() {
  const btn = document.getElementById('qvCartBtn');
  btn.textContent = '已加入購物車 ✓';
  btn.classList.remove('bg-lime-400');
  btn.classList.add('bg-green-500');
  cartCount++;
  const badge = document.getElementById('cartBadge');
  badge.textContent = cartCount;
  badge.style.transform = 'scale(1.4)';
  setTimeout(() => { badge.style.transform = 'scale(1)'; badge.style.transition = 'transform 0.2s'; }, 200);
  setTimeout(() => closeQuickView(), 1200);
}

// Size Guide Modal
function openSizeGuide() {
  document.getElementById('sizeGuideModal').classList.add('show');
}
function closeSizeGuide() {
  document.getElementById('sizeGuideModal').classList.remove('show');
}

// Category Filter
function filterCategory(cat) {
  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.category-btn[data-cat="' + cat + '"]').classList.add('active');
  const cards = document.querySelectorAll('#productGrid > div');
  cards.forEach(card => {
    if (cat === 'all' || card.dataset.category === cat) {
      card.style.display = '';
      card.style.animation = 'slideUp 0.4s ease forwards';
    } else {
      card.style.display = 'none';
    }
  });
}

// FAQ Accordion
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const chevron = btn.querySelector('.faq-chevron');
  const isOpen = answer.classList.contains('open');
  document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-chevron').forEach(c => c.classList.remove('open'));
  if (!isOpen) {
    answer.classList.add('open');
    chevron.classList.add('open');
  }
}

// Newsletter
function submitNewsletter() {
  const email = document.getElementById('newsletterEmail').value;
  if (!email || !email.includes('@')) {
    document.getElementById('newsletterEmail').style.borderColor = '#ef4444';
    setTimeout(() => { document.getElementById('newsletterEmail').style.borderColor = ''; }, 2000);
    return;
  }
  const form = document.getElementById('newsletterForm');
  form.innerHTML = '<div class="text-center py-2 slide-up"><span class="text-lime-400 text-2xl">&#10003;</span><p class="text-white font-bold mt-1">訂閱成功！</p><p class="text-gray-400 text-sm mt-1">限量發售通知將第一時間送達你的信箱</p></div>';
}

// Countdown Timer
function updateCountdown() {
  const now = new Date();
  const end = new Date(now.getTime() + 2*24*60*60*1000 + 18*60*60*1000 + 45*60*1000 + 30*1000);
  if (!window._countdownEnd) window._countdownEnd = end;
  const diff = Math.max(0, window._countdownEnd - new Date());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  document.getElementById('cd-days').textContent = String(d).padStart(2,'0');
  document.getElementById('cd-hours').textContent = String(h).padStart(2,'0');
  document.getElementById('cd-mins').textContent = String(m).padStart(2,'0');
  document.getElementById('cd-secs').textContent = String(s).padStart(2,'0');
}
setInterval(updateCountdown, 1000);

// Close modals on overlay click
document.getElementById('quickViewModal').addEventListener('click', function(e) { if (e.target === this) closeQuickView(); });
document.getElementById('sizeGuideModal').addEventListener('click', function(e) { if (e.target === this) closeSizeGuide(); });

// Close modals on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeQuickView(); closeSizeGuide(); }
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
