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
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        wine: { 50:'#fdf2f4', 100:'#fce4ea', 200:'#f5c6d0', 400:'#a83258', 500:'#831843', 600:'#6d1038', 700:'#4a0e2e', 800:'#3a0920', 900:'#2a0616' },
        cream: { 50:'#fdf8f0', 100:'#faf0e0', 200:'#f5e6cc' },
        gold: { 300:'#d4a843', 400:'#c9952e', 500:'#b8860b' }
      }
    }
  }
}
</script>
<style>
body { font-family: 'DM Sans', sans-serif; background: #fdf8f0; }
.serif { font-family: 'Cormorant Garamond', serif; }
html { scroll-behavior: smooth; }
.wine-card { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
.wine-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(74,14,46,0.12); }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.4s ease; }
.faq-answer.open { max-height: 300px; }
.cat-btn { transition: all 0.25s; }
.cat-btn.active { background: #4a0e2e; color: #fdf8f0; border-color: #4a0e2e; }
.divider { width: 60px; height: 2px; background: linear-gradient(to right, transparent, #b8860b, transparent); }
.exp-card { transition: all 0.35s; }
.exp-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(74,14,46,0.1); }
.award-card { transition: all 0.3s; }
.award-card:hover { transform: scale(1.03); }
.modal-overlay { opacity: 0; transition: opacity 0.3s; pointer-events: none; }
.modal-overlay.show { opacity: 1; pointer-events: auto; }
.modal-box { transform: scale(0.9) translateY(20px); transition: transform 0.3s; }
.modal-overlay.show .modal-box { transform: scale(1) translateY(0); }
.tour-card:hover .tour-icon { transform: scale(1.15); }
.tour-icon { transition: transform 0.3s; }
@keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
.fade-up { animation: fadeInUp 0.6s ease forwards; }
@keyframes checkmark { 0% { transform: scale(0) rotate(-45deg); opacity:0; } 50% { transform: scale(1.2) rotate(-45deg); opacity:1; } 100% { transform: scale(1) rotate(-45deg); opacity:1; } }
.check-anim { animation: checkmark 0.5s ease 0.2s forwards; opacity:0; }
</style>
</head>
<body class="text-gray-800">

<!-- Sticky Nav -->
<nav id="mainNav" class="sticky top-0 z-50 bg-cream-50/90 backdrop-blur-md border-b border-wine-100/50 transition-shadow duration-300">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <a href="#" class="flex items-center gap-2">
      <span class="text-2xl">🍷</span>
      <span class="serif text-xl font-bold text-wine-700 tracking-wider">VINEYARD<span class="text-gold-500">VISTA</span></span>
      <span class="text-[10px] text-wine-400 ml-1 hidden sm:inline">醇酒莊園</span>
    </a>
    <div class="flex items-center gap-7 text-sm text-gray-500">
      <a href="#wines" class="hover:text-wine-700 transition font-medium cursor-pointer">酒款</a>
      <a href="#philosophy" class="hover:text-wine-700 transition font-medium cursor-pointer">哲學</a>
      <a href="#experience" class="hover:text-wine-700 transition font-medium cursor-pointer">品酒</a>
      <a href="#tour" class="hover:text-wine-700 transition font-medium cursor-pointer">巡禮</a>
      <a href="#faq" class="hover:text-wine-700 transition font-medium cursor-pointer">FAQ</a>
      <button onclick="openModal()" class="bg-wine-700 hover:bg-wine-800 text-cream-50 px-5 py-2 text-sm font-medium transition rounded-sm tracking-wide">預約品酒</button>
    </div>
  </div>
</nav>

<!-- Reservation Modal -->
<div id="reserveModal" class="modal-overlay fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
  <div class="modal-box bg-cream-50 rounded-xl p-8 w-full max-w-md shadow-2xl relative border border-wine-100">
    <button onclick="closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-wine-700 text-2xl leading-none transition">&times;</button>
    <div id="reserveContent">
      <div class="text-center mb-6">
        <div class="text-4xl mb-2">🥂</div>
        <h3 class="serif text-2xl font-bold text-wine-700">預約品酒體驗</h3>
        <p class="text-sm text-gray-400 mt-1">感受醇酒莊園的極致風味</p>
      </div>
      <div id="reserveForm">
        <input id="rName" type="text" placeholder="姓名" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-wine-400 bg-white">
        <input id="rPhone" type="tel" placeholder="聯絡電話" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-wine-400 bg-white">
        <input id="rDate" type="date" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-wine-400 bg-white text-gray-500">
        <select id="rTime" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-3 text-gray-500 focus:outline-none focus:border-wine-400 bg-white">
          <option value="">選擇時段</option>
          <option>上午 10:00 - 12:00</option>
          <option>下午 14:00 - 16:00</option>
          <option>傍晚 16:30 - 18:30</option>
          <option>晚間 19:00 - 21:00</option>
        </select>
        <div class="flex gap-3 mb-3">
          <select id="rGuests" class="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 focus:outline-none focus:border-wine-400 bg-white">
            <option value="">人數</option>
            <option>1 位</option><option>2 位</option><option>3 位</option><option>4 位</option><option>5 位</option><option>6 位</option>
          </select>
          <select id="rPref" class="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 focus:outline-none focus:border-wine-400 bg-white">
            <option value="">酒款偏好</option>
            <option>紅酒為主</option><option>白酒為主</option><option>氣泡酒</option><option>都想試試</option>
          </select>
        </div>
        <textarea placeholder="特殊需求（如：慶生、無酒精選項...）" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-wine-400 bg-white h-16 resize-none"></textarea>
        <button onclick="submitReservation()" class="w-full bg-wine-700 hover:bg-wine-800 text-cream-50 py-3 rounded-lg font-medium text-sm transition tracking-wide">確認預約</button>
      </div>
    </div>
  </div>
</div>

<!-- Hero -->
<section class="relative overflow-hidden bg-gradient-to-br from-wine-700 via-wine-800 to-wine-900 min-h-[85vh] flex items-center">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(131,24,67,0.4),transparent_70%)]"></div>
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(184,134,11,0.15),transparent_50%)]"></div>
  <div class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cream-50 to-transparent"></div>
  <div class="max-w-6xl mx-auto px-6 relative z-10 flex items-center gap-16 w-full">
    <div class="flex-1">
      <div class="divider mb-6"></div>
      <span class="text-xs tracking-[0.3em] text-gold-300 uppercase font-medium">Since 2001 &middot; Napa Valley Inspired</span>
      <h1 class="serif text-6xl font-bold text-cream-50 leading-tight mt-4 mb-6">品味時光的<br>藝術</h1>
      <p class="text-cream-200/80 leading-relaxed mb-8 max-w-lg">坐落於陽光充沛的山谷之中，二十五年來堅持手工採摘、橡木桶陳釀，每一滴葡萄酒都凝聚了風土與歲月的精華，等待與您的相遇。</p>
      <div class="flex gap-4">
        <button onclick="openModal()" class="bg-gold-500 hover:bg-gold-400 text-wine-900 px-8 py-3 text-sm font-bold tracking-wider transition rounded-sm">預約品酒</button>
        <a href="#wines" class="border border-cream-100/40 hover:border-cream-100/70 text-cream-50 px-8 py-3 text-sm tracking-wider transition rounded-sm inline-block">探索酒款</a>
      </div>
    </div>
    <div class="hidden lg:flex flex-col items-center gap-5">
      <div class="w-44 h-56 rounded-2xl bg-gradient-to-b from-wine-500/40 to-wine-700/60 border border-white/10 flex items-center justify-center text-8xl rotate-3 shadow-2xl">🍷</div>
      <div class="w-44 h-56 rounded-2xl bg-gradient-to-b from-gold-500/20 to-wine-600/40 border border-white/10 flex items-center justify-center text-8xl -rotate-3 shadow-2xl">🥂</div>
    </div>
  </div>
</section>

<!-- Stats -->
<section class="bg-cream-50 border-b border-wine-50">
  <div class="max-w-6xl mx-auto px-6 py-8 grid grid-cols-4 gap-8 text-center">
    <div>
      <div class="serif text-3xl font-bold text-wine-700">25 年</div>
      <div class="text-xs text-gray-400 mt-1">釀酒歷史</div>
    </div>
    <div>
      <div class="serif text-3xl font-bold text-wine-700">12 款</div>
      <div class="text-xs text-gray-400 mt-1">經典酒款</div>
    </div>
    <div>
      <div class="serif text-3xl font-bold text-wine-700">50 畝</div>
      <div class="text-xs text-gray-400 mt-1">葡萄園面積</div>
    </div>
    <div>
      <div class="serif text-3xl font-bold text-wine-700">20,000</div>
      <div class="text-xs text-gray-400 mt-1">年產量（瓶）</div>
    </div>
  </div>
</section>

<!-- Wine Collection -->
<section id="wines" class="max-w-6xl mx-auto px-6 py-16">
  <div class="text-center mb-10">
    <div class="divider mx-auto mb-4"></div>
    <h2 class="serif text-4xl font-bold text-wine-700">經典酒款</h2>
    <p class="text-sm text-gray-400 mt-2">從輕盈果香到醇厚陳年，每一款皆是匠心之作</p>
  </div>
  <div class="flex justify-center gap-2 mb-8 flex-wrap">
    <button onclick="filterWines('all')" class="cat-btn active text-xs px-5 py-2 rounded-full border border-wine-200 font-medium text-wine-700">全部</button>
    <button onclick="filterWines('red')" class="cat-btn text-xs px-5 py-2 rounded-full border border-wine-200 font-medium text-wine-700">紅酒</button>
    <button onclick="filterWines('white')" class="cat-btn text-xs px-5 py-2 rounded-full border border-wine-200 font-medium text-wine-700">白酒</button>
    <button onclick="filterWines('sparkling')" class="cat-btn text-xs px-5 py-2 rounded-full border border-wine-200 font-medium text-wine-700">氣泡酒</button>
    <button onclick="filterWines('sweet')" class="cat-btn text-xs px-5 py-2 rounded-full border border-wine-200 font-medium text-wine-700">甜酒</button>
  </div>
  <div class="grid grid-cols-4 gap-5" id="wineGrid">
    <!-- Red wines -->
    <div class="wine-card bg-white rounded-xl overflow-hidden border border-wine-50" data-cat="red">
      <div class="h-40 bg-gradient-to-b from-wine-100 to-wine-200/60 flex items-center justify-center relative">
        <span class="text-6xl">🍷</span>
        <span class="absolute top-3 right-3 text-[10px] bg-wine-700 text-cream-50 px-2 py-0.5 rounded-full font-bold">限量</span>
      </div>
      <div class="p-4">
        <div class="text-[10px] text-gold-500 tracking-widest uppercase font-medium">Cabernet Sauvignon</div>
        <h3 class="serif text-lg font-bold text-wine-700 mt-0.5">黑醋栗之夜</h3>
        <div class="text-[10px] text-gray-400 mt-0.5">2019 年份 | 酒精 14.5%</div>
        <p class="text-xs text-gray-500 mt-2 leading-relaxed">深邃紅寶石色，黑醋栗與雪松香氣交織，單寧細緻綿長，餘韻悠遠。</p>
        <div class="flex items-center justify-between mt-3">
          <span class="serif text-lg font-bold text-wine-700">NT$2,800</span>
          <button class="text-[10px] bg-wine-700 text-cream-50 px-3 py-1.5 rounded-full font-medium hover:bg-wine-800 transition">加入購物車</button>
        </div>
      </div>
    </div>
    <div class="wine-card bg-white rounded-xl overflow-hidden border border-wine-50" data-cat="red">
      <div class="h-40 bg-gradient-to-b from-rose-100 to-wine-100/60 flex items-center justify-center">
        <span class="text-6xl">🍷</span>
      </div>
      <div class="p-4">
        <div class="text-[10px] text-gold-500 tracking-widest uppercase font-medium">Pinot Noir</div>
        <h3 class="serif text-lg font-bold text-wine-700 mt-0.5">晨曦玫瑰</h3>
        <div class="text-[10px] text-gray-400 mt-0.5">2020 年份 | 酒精 13.5%</div>
        <p class="text-xs text-gray-500 mt-2 leading-relaxed">淡雅紅寶石色，櫻桃與紫羅蘭芬芳，口感絲滑優雅如絲綢。</p>
        <div class="flex items-center justify-between mt-3">
          <span class="serif text-lg font-bold text-wine-700">NT$2,200</span>
          <button class="text-[10px] bg-wine-700 text-cream-50 px-3 py-1.5 rounded-full font-medium hover:bg-wine-800 transition">加入購物車</button>
        </div>
      </div>
    </div>
    <div class="wine-card bg-white rounded-xl overflow-hidden border border-wine-50" data-cat="red">
      <div class="h-40 bg-gradient-to-b from-wine-200 to-wine-100/60 flex items-center justify-center">
        <span class="text-6xl">🍾</span>
      </div>
      <div class="p-4">
        <div class="text-[10px] text-gold-500 tracking-widest uppercase font-medium">Reserve Blend</div>
        <h3 class="serif text-lg font-bold text-wine-700 mt-0.5">莊主典藏</h3>
        <div class="text-[10px] text-gray-400 mt-0.5">2018 年份 | 酒精 15%</div>
        <p class="text-xs text-gray-500 mt-2 leading-relaxed">三年法國橡木桶陳釀，黑莓巧克力與香草交織，絲絨般的尾韻。</p>
        <div class="flex items-center justify-between mt-3">
          <span class="serif text-lg font-bold text-wine-700">NT$5,800</span>
          <button class="text-[10px] bg-wine-700 text-cream-50 px-3 py-1.5 rounded-full font-medium hover:bg-wine-800 transition">加入購物車</button>
        </div>
      </div>
    </div>
    <!-- White wine -->
    <div class="wine-card bg-white rounded-xl overflow-hidden border border-wine-50" data-cat="white">
      <div class="h-40 bg-gradient-to-b from-amber-50 to-yellow-100/60 flex items-center justify-center">
        <span class="text-6xl">🥂</span>
      </div>
      <div class="p-4">
        <div class="text-[10px] text-gold-500 tracking-widest uppercase font-medium">Chardonnay</div>
        <h3 class="serif text-lg font-bold text-wine-700 mt-0.5">金色晨光</h3>
        <div class="text-[10px] text-gray-400 mt-0.5">2021 年份 | 酒精 13%</div>
        <p class="text-xs text-gray-500 mt-2 leading-relaxed">淡金色澤，白桃與烤杏仁香氣，口感豐潤帶有奶油質感。</p>
        <div class="flex items-center justify-between mt-3">
          <span class="serif text-lg font-bold text-wine-700">NT$1,980</span>
          <button class="text-[10px] bg-wine-700 text-cream-50 px-3 py-1.5 rounded-full font-medium hover:bg-wine-800 transition">加入購物車</button>
        </div>
      </div>
    </div>
    <div class="wine-card bg-white rounded-xl overflow-hidden border border-wine-50" data-cat="white">
      <div class="h-40 bg-gradient-to-b from-lime-50 to-emerald-50/60 flex items-center justify-center">
        <span class="text-6xl">🍶</span>
      </div>
      <div class="p-4">
        <div class="text-[10px] text-gold-500 tracking-widest uppercase font-medium">Sauvignon Blanc</div>
        <h3 class="serif text-lg font-bold text-wine-700 mt-0.5">翠谷清風</h3>
        <div class="text-[10px] text-gray-400 mt-0.5">2022 年份 | 酒精 12.5%</div>
        <p class="text-xs text-gray-500 mt-2 leading-relaxed">清新的青草與百香果香氣，酸度明亮，收尾乾淨俐落。</p>
        <div class="flex items-center justify-between mt-3">
          <span class="serif text-lg font-bold text-wine-700">NT$1,680</span>
          <button class="text-[10px] bg-wine-700 text-cream-50 px-3 py-1.5 rounded-full font-medium hover:bg-wine-800 transition">加入購物車</button>
        </div>
      </div>
    </div>
    <!-- Sparkling -->
    <div class="wine-card bg-white rounded-xl overflow-hidden border border-wine-50" data-cat="sparkling">
      <div class="h-40 bg-gradient-to-b from-sky-50 to-indigo-50/40 flex items-center justify-center">
        <span class="text-6xl">🫧</span>
      </div>
      <div class="p-4">
        <div class="text-[10px] text-gold-500 tracking-widest uppercase font-medium">Brut Sparkling</div>
        <h3 class="serif text-lg font-bold text-wine-700 mt-0.5">星辰之舞</h3>
        <div class="text-[10px] text-gray-400 mt-0.5">NV | 酒精 12%</div>
        <p class="text-xs text-gray-500 mt-2 leading-relaxed">細緻持久的氣泡，青蘋果與白花香，適合慶祝每個美好時刻。</p>
        <div class="flex items-center justify-between mt-3">
          <span class="serif text-lg font-bold text-wine-700">NT$1,500</span>
          <button class="text-[10px] bg-wine-700 text-cream-50 px-3 py-1.5 rounded-full font-medium hover:bg-wine-800 transition">加入購物車</button>
        </div>
      </div>
    </div>
    <div class="wine-card bg-white rounded-xl overflow-hidden border border-wine-50" data-cat="sparkling">
      <div class="h-40 bg-gradient-to-b from-pink-50 to-rose-100/40 flex items-center justify-center">
        <span class="text-6xl">🍾</span>
      </div>
      <div class="p-4">
        <div class="text-[10px] text-gold-500 tracking-widest uppercase font-medium">Rose Sparkling</div>
        <h3 class="serif text-lg font-bold text-wine-700 mt-0.5">玫瑰氣泡</h3>
        <div class="text-[10px] text-gray-400 mt-0.5">NV | 酒精 11.5%</div>
        <p class="text-xs text-gray-500 mt-2 leading-relaxed">夢幻粉紅色澤，草莓與覆盆莓風味，細緻氣泡帶來浪漫口感。</p>
        <div class="flex items-center justify-between mt-3">
          <span class="serif text-lg font-bold text-wine-700">NT$1,800</span>
          <button class="text-[10px] bg-wine-700 text-cream-50 px-3 py-1.5 rounded-full font-medium hover:bg-wine-800 transition">加入購物車</button>
        </div>
      </div>
    </div>
    <!-- Sweet wine -->
    <div class="wine-card bg-white rounded-xl overflow-hidden border border-wine-50" data-cat="sweet">
      <div class="h-40 bg-gradient-to-b from-amber-100 to-orange-100/60 flex items-center justify-center">
        <span class="text-6xl">🍯</span>
      </div>
      <div class="p-4">
        <div class="text-[10px] text-gold-500 tracking-widest uppercase font-medium">Late Harvest</div>
        <h3 class="serif text-lg font-bold text-wine-700 mt-0.5">蜜糖晚霞</h3>
        <div class="text-[10px] text-gray-400 mt-0.5">2020 年份 | 酒精 10%</div>
        <p class="text-xs text-gray-500 mt-2 leading-relaxed">遲摘甜白酒，蜂蜜與杏桃芬芳，甜而不膩，餐後佳釀。</p>
        <div class="flex items-center justify-between mt-3">
          <span class="serif text-lg font-bold text-wine-700">NT$2,400</span>
          <button class="text-[10px] bg-wine-700 text-cream-50 px-3 py-1.5 rounded-full font-medium hover:bg-wine-800 transition">加入購物車</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Winemaking Philosophy -->
<section id="philosophy" class="bg-gradient-to-r from-wine-700 via-wine-800 to-wine-900 py-20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-2 gap-16 items-center">
      <div class="relative">
        <div class="w-full h-80 rounded-2xl bg-gradient-to-br from-wine-500/30 to-wine-600/40 border border-white/10 flex items-center justify-center text-9xl">🏡</div>
        <div class="absolute -bottom-4 -right-4 w-32 h-32 rounded-xl bg-gradient-to-br from-gold-500/30 to-gold-400/20 border border-white/10 flex items-center justify-center text-4xl">🍇</div>
      </div>
      <div>
        <div class="divider mb-4"></div>
        <h2 class="serif text-4xl font-bold text-cream-50 mb-5">釀酒哲學</h2>
        <p class="text-cream-100/70 leading-relaxed mb-4 text-sm">二十五年前，莊主陳世昌先生懷抱著對葡萄酒的無限熱忱，在這片風土優越的山谷中種下第一株葡萄藤。我們相信，偉大的葡萄酒源於對土地的尊重和對時間的耐心。</p>
        <p class="text-cream-100/70 leading-relaxed mb-6 text-sm">從選地、育苗、手工採收到橡木桶陳釀，每一個步驟都遵循最嚴謹的古法工藝。我們不追求產量，只追求每一瓶酒的完美表達。風土、陽光、雨水、時間 ---- 這些是我們最珍貴的釀酒師。</p>
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white/5 rounded-lg p-3 text-center border border-white/5">
            <div class="text-2xl mb-1">🌿</div>
            <div class="text-xs text-cream-100/80 font-medium">有機種植</div>
            <div class="text-[10px] text-cream-200/50 mt-0.5">零化學農藥</div>
          </div>
          <div class="bg-white/5 rounded-lg p-3 text-center border border-white/5">
            <div class="text-2xl mb-1">🤲</div>
            <div class="text-xs text-cream-100/80 font-medium">手工採摘</div>
            <div class="text-[10px] text-cream-200/50 mt-0.5">逐串精選</div>
          </div>
          <div class="bg-white/5 rounded-lg p-3 text-center border border-white/5">
            <div class="text-2xl mb-1">🪵</div>
            <div class="text-xs text-cream-100/80 font-medium">橡木陳釀</div>
            <div class="text-[10px] text-cream-200/50 mt-0.5">法國橡木桶</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Experience Packages -->
<section id="experience" class="max-w-6xl mx-auto px-6 py-16">
  <div class="text-center mb-10">
    <div class="divider mx-auto mb-4"></div>
    <h2 class="serif text-4xl font-bold text-wine-700">品酒體驗</h2>
    <p class="text-sm text-gray-400 mt-2">從入門到珍藏，為您量身打造不同層次的味覺旅程</p>
  </div>
  <div class="grid grid-cols-3 gap-6">
    <div class="exp-card bg-white rounded-xl p-7 border border-wine-50 text-center">
      <div class="text-4xl mb-3">🥂</div>
      <h3 class="serif text-xl font-bold text-wine-700">入門品酒</h3>
      <p class="text-xs text-gray-400 mt-2 mb-4">品嘗 4 款精選酒款<br>專業侍酒師導覽解說<br>附贈品酒筆記本</p>
      <div class="text-[10px] text-gray-400 mb-3">時長約 60 分鐘 &middot; 2-6 人</div>
      <div class="serif text-3xl font-bold text-wine-700 mb-4">NT$800<span class="text-sm font-normal text-gray-400"> /人</span></div>
      <button onclick="openModal()" class="w-full border border-wine-700 text-wine-700 hover:bg-wine-700 hover:text-cream-50 py-2.5 rounded-lg text-sm font-medium transition">立即預約</button>
    </div>
    <div class="exp-card bg-white rounded-xl p-7 border-2 border-wine-700 text-center relative">
      <span class="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-wine-700 text-cream-50 px-4 py-1 rounded-full font-bold tracking-wide">最受歡迎</span>
      <div class="text-4xl mb-3">🍽️</div>
      <h3 class="serif text-xl font-bold text-wine-700">進階品酒</h3>
      <p class="text-xs text-gray-400 mt-2 mb-4">品嘗 6 款典藏酒款<br>四道式餐酒搭配體驗<br>主廚特製季節料理</p>
      <div class="text-[10px] text-gray-400 mb-3">時長約 120 分鐘 &middot; 2-8 人</div>
      <div class="serif text-3xl font-bold text-wine-700 mb-4">NT$1,500<span class="text-sm font-normal text-gray-400"> /人</span></div>
      <button onclick="openModal()" class="w-full bg-wine-700 hover:bg-wine-800 text-cream-50 py-2.5 rounded-lg text-sm font-medium transition">立即預約</button>
    </div>
    <div class="exp-card bg-white rounded-xl p-7 border border-wine-50 text-center">
      <div class="text-4xl mb-3">🏰</div>
      <h3 class="serif text-xl font-bold text-wine-700">私人酒窖</h3>
      <p class="text-xs text-gray-400 mt-2 mb-4">VIP 專屬酒窖包場<br>莊主親自導覽與品評<br>含限量酒款一瓶帶回</p>
      <div class="text-[10px] text-gray-400 mb-3">時長約 180 分鐘 &middot; 2-4 人</div>
      <div class="serif text-3xl font-bold text-wine-700 mb-4">NT$3,800<span class="text-sm font-normal text-gray-400"> /人</span></div>
      <button onclick="openModal()" class="w-full border border-wine-700 text-wine-700 hover:bg-wine-700 hover:text-cream-50 py-2.5 rounded-lg text-sm font-medium transition">立即預約</button>
    </div>
  </div>
</section>

<!-- Vineyard Tour -->
<section id="tour" class="bg-gradient-to-b from-cream-100 to-cream-50 py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-10">
      <div class="divider mx-auto mb-4"></div>
      <h2 class="serif text-4xl font-bold text-wine-700">莊園巡禮</h2>
      <p class="text-sm text-gray-400 mt-2">走進葡萄園，感受風土的呼吸</p>
    </div>
    <div class="grid grid-cols-4 gap-5">
      <div class="tour-card bg-white rounded-xl p-5 border border-wine-50 text-center hover:shadow-lg transition cursor-pointer">
        <div class="tour-icon text-4xl mb-3 inline-block">🍇</div>
        <h3 class="font-bold text-wine-700 text-sm">葡萄園漫步</h3>
        <p class="text-xs text-gray-400 mt-2 leading-relaxed">穿梭於整齊的葡萄藤間，了解不同品種的特性與種植哲學。</p>
      </div>
      <div class="tour-card bg-white rounded-xl p-5 border border-wine-50 text-center hover:shadow-lg transition cursor-pointer">
        <div class="tour-icon text-4xl mb-3 inline-block">🪵</div>
        <h3 class="font-bold text-wine-700 text-sm">酒窖探秘</h3>
        <p class="text-xs text-gray-400 mt-2 leading-relaxed">深入地下酒窖，見證橡木桶中美酒緩慢熟成的奧秘。</p>
      </div>
      <div class="tour-card bg-white rounded-xl p-5 border border-wine-50 text-center hover:shadow-lg transition cursor-pointer">
        <div class="tour-icon text-4xl mb-3 inline-block">🔬</div>
        <h3 class="font-bold text-wine-700 text-sm">釀造工坊</h3>
        <p class="text-xs text-gray-400 mt-2 leading-relaxed">參觀現代化釀酒設備，體驗從葡萄到美酒的完整旅程。</p>
      </div>
      <div class="tour-card bg-white rounded-xl p-5 border border-wine-50 text-center hover:shadow-lg transition cursor-pointer">
        <div class="tour-icon text-4xl mb-3 inline-block">🌅</div>
        <h3 class="font-bold text-wine-700 text-sm">日落品酒露台</h3>
        <p class="text-xs text-gray-400 mt-2 leading-relaxed">在莊園露台享受黃昏美景，搭配一杯私藏佳釀。</p>
      </div>
    </div>
  </div>
</section>

<!-- Awards -->
<section class="max-w-6xl mx-auto px-6 py-16">
  <div class="text-center mb-10">
    <div class="divider mx-auto mb-4"></div>
    <h2 class="serif text-4xl font-bold text-wine-700">獎項榮耀</h2>
    <p class="text-sm text-gray-400 mt-2">國際認可的品質，專業肯定的實力</p>
  </div>
  <div class="grid grid-cols-4 gap-5">
    <div class="award-card bg-white rounded-xl p-6 border border-wine-50 text-center cursor-pointer">
      <div class="text-4xl mb-3">🏆</div>
      <h3 class="font-bold text-wine-700 text-sm">亞洲葡萄酒大賽</h3>
      <div class="text-xs text-gold-500 font-medium mt-1">金牌獎 2024</div>
      <p class="text-[10px] text-gray-400 mt-2">「莊主典藏 2018」榮獲最高殊榮</p>
    </div>
    <div class="award-card bg-white rounded-xl p-6 border border-wine-50 text-center cursor-pointer">
      <div class="text-4xl mb-3">🥇</div>
      <h3 class="font-bold text-wine-700 text-sm">Wine Spectator</h3>
      <div class="text-xs text-gold-500 font-medium mt-1">92 分評鑑 2023</div>
      <p class="text-[10px] text-gray-400 mt-2">「黑醋栗之夜」獲國際酒評高分</p>
    </div>
    <div class="award-card bg-white rounded-xl p-6 border border-wine-50 text-center cursor-pointer">
      <div class="text-4xl mb-3">🎖️</div>
      <h3 class="font-bold text-wine-700 text-sm">台灣精品酒莊</h3>
      <div class="text-xs text-gold-500 font-medium mt-1">年度最佳 2024</div>
      <p class="text-[10px] text-gray-400 mt-2">連續三年獲選台灣十大精品酒莊</p>
    </div>
    <div class="award-card bg-white rounded-xl p-6 border border-wine-50 text-center cursor-pointer">
      <div class="text-4xl mb-3">🌟</div>
      <h3 class="font-bold text-wine-700 text-sm">Decanter 大賽</h3>
      <div class="text-xs text-gold-500 font-medium mt-1">銀牌獎 2023</div>
      <p class="text-[10px] text-gray-400 mt-2">「金色晨光 Chardonnay」國際認可</p>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="bg-gradient-to-b from-cream-100 to-cream-50 py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-10">
      <div class="divider mx-auto mb-4"></div>
      <h2 class="serif text-4xl font-bold text-wine-700">賓客迴響</h2>
    </div>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-white rounded-xl p-6 border border-wine-50 shadow-sm">
        <div class="flex items-center gap-1 text-yellow-400 text-xs mb-3">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="text-sm text-gray-600 italic leading-relaxed">"第一次參加私人酒窖體驗，莊主親自導覽、分享釀酒故事，讓人深深感動。那瓶帶回家的典藏紅酒，是我收過最特別的禮物。"</p>
        <div class="flex items-center gap-3 mt-4">
          <div class="w-9 h-9 rounded-full bg-wine-100 flex items-center justify-center text-sm">林</div>
          <div><div class="text-xs font-medium text-gray-700">林小姐</div><div class="text-[10px] text-gray-400">私人酒窖體驗</div></div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-6 border border-wine-50 shadow-sm">
        <div class="flex items-center gap-1 text-yellow-400 text-xs mb-3">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="text-sm text-gray-600 italic leading-relaxed">"帶太太來慶祝結婚紀念日，進階品酒的餐酒搭配令人驚艷，每一道菜與酒的組合都恰到好處。環境優雅，服務一流！"</p>
        <div class="flex items-center gap-3 mt-4">
          <div class="w-9 h-9 rounded-full bg-wine-100 flex items-center justify-center text-sm">陳</div>
          <div><div class="text-xs font-medium text-gray-700">陳先生</div><div class="text-[10px] text-gray-400">進階品酒體驗</div></div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-6 border border-wine-50 shadow-sm">
        <div class="flex items-center gap-1 text-yellow-400 text-xs mb-3">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="text-sm text-gray-600 italic leading-relaxed">"身為葡萄酒初學者，入門品酒體驗非常適合我。侍酒師耐心地講解每款酒的風味，完全不會有壓力，現在已經成為常客了。"</p>
        <div class="flex items-center gap-3 mt-4">
          <div class="w-9 h-9 rounded-full bg-wine-100 flex items-center justify-center text-sm">王</div>
          <div><div class="text-xs font-medium text-gray-700">王同學</div><div class="text-[10px] text-gray-400">入門品酒體驗</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Food Pairing -->
<section class="max-w-6xl mx-auto px-6 py-16">
  <div class="text-center mb-10">
    <div class="divider mx-auto mb-4"></div>
    <h2 class="serif text-4xl font-bold text-wine-700">餐酒搭配</h2>
    <p class="text-sm text-gray-400 mt-2">由主廚精心設計，讓美酒與佳餚共譜完美和弦</p>
  </div>
  <div class="grid grid-cols-3 gap-6">
    <div class="bg-white rounded-xl overflow-hidden border border-wine-50 hover:shadow-lg transition cursor-pointer">
      <div class="h-36 bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center gap-3">
        <span class="text-5xl">🥩</span><span class="text-2xl text-wine-400">+</span><span class="text-5xl">🍷</span>
      </div>
      <div class="p-5">
        <h3 class="font-bold text-wine-700">嫩煎菲力 x 莊主典藏</h3>
        <p class="text-xs text-gray-400 mt-2 leading-relaxed">五分熟菲力牛排的鮮嫩肉汁，搭配典藏紅酒的豐厚單寧，經典中的經典。</p>
        <div class="text-[10px] text-gold-500 font-medium mt-3">主廚推薦搭配</div>
      </div>
    </div>
    <div class="bg-white rounded-xl overflow-hidden border border-wine-50 hover:shadow-lg transition cursor-pointer">
      <div class="h-36 bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center gap-3">
        <span class="text-5xl">🧀</span><span class="text-2xl text-wine-400">+</span><span class="text-5xl">🥂</span>
      </div>
      <div class="p-5">
        <h3 class="font-bold text-wine-700">熟成乳酪 x 金色晨光</h3>
        <p class="text-xs text-gray-400 mt-2 leading-relaxed">法國 Comté 乳酪的堅果風味，與 Chardonnay 的奶油質感完美融合。</p>
        <div class="text-[10px] text-gold-500 font-medium mt-3">午後品酒推薦</div>
      </div>
    </div>
    <div class="bg-white rounded-xl overflow-hidden border border-wine-50 hover:shadow-lg transition cursor-pointer">
      <div class="h-36 bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center gap-3">
        <span class="text-5xl">🍰</span><span class="text-2xl text-wine-400">+</span><span class="text-5xl">🍯</span>
      </div>
      <div class="p-5">
        <h3 class="font-bold text-wine-700">焦糖布蕾 x 蜜糖晚霞</h3>
        <p class="text-xs text-gray-400 mt-2 leading-relaxed">甜點的焦糖香氣與遲摘甜白酒的蜂蜜韻味，為味蕾畫下完美句點。</p>
        <div class="text-[10px] text-gold-500 font-medium mt-3">餐後甜點首選</div>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section id="faq" class="bg-gradient-to-b from-cream-100 to-cream-50 py-16">
  <div class="max-w-3xl mx-auto px-6">
    <div class="text-center mb-10">
      <div class="divider mx-auto mb-4"></div>
      <h2 class="serif text-4xl font-bold text-wine-700">常見問題</h2>
    </div>
    <div class="space-y-3">
      <div class="bg-white rounded-xl border border-wine-50 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left font-medium text-sm text-gray-800 hover:bg-wine-50/50 transition">
          <span>品酒體驗需要事先預約嗎？可以當天直接前往嗎？</span>
          <span class="text-wine-400 text-xl font-light shrink-0 ml-4">+</span>
        </button>
        <div class="faq-answer px-5 pb-5 text-sm text-gray-500 leading-relaxed">建議至少提前 3 天預約，以確保名額與最佳服務品質。週末與假日通常較為熱門，建議提前 1 週預約。若臨時有空位，我們也歡迎現場詢問，但無法保證。可透過官網預約表單或來電 (04) 2573-8888 預約。</div>
      </div>
      <div class="bg-white rounded-xl border border-wine-50 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left font-medium text-sm text-gray-800 hover:bg-wine-50/50 transition">
          <span>莊園有提供停車場嗎？交通方式建議？</span>
          <span class="text-wine-400 text-xl font-light shrink-0 ml-4">+</span>
        </button>
        <div class="faq-answer px-5 pb-5 text-sm text-gray-500 leading-relaxed">莊園備有免費停車場，可容納約 50 輛車。若搭乘大眾運輸，可於台中高鐵站搭乘接駁車（週六日固定班次），或搭計程車約 30 分鐘。品酒活動建議指定駕駛或搭乘計程車前來，飲酒不開車。</div>
      </div>
      <div class="bg-white rounded-xl border border-wine-50 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left font-medium text-sm text-gray-800 hover:bg-wine-50/50 transition">
          <span>可以帶小朋友一起前往莊園嗎？</span>
          <span class="text-wine-400 text-xl font-light shrink-0 ml-4">+</span>
        </button>
        <div class="faq-answer px-5 pb-5 text-sm text-gray-500 leading-relaxed">歡迎攜帶小朋友參觀莊園與葡萄園，我們備有果汁與無酒精飲品。但品酒活動依法規定未滿 18 歲不得參加。莊園花園設有兒童遊戲區，家長可安心參與品酒體驗。</div>
      </div>
      <div class="bg-white rounded-xl border border-wine-50 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left font-medium text-sm text-gray-800 hover:bg-wine-50/50 transition">
          <span>酒款可以線上購買嗎？是否提供國際配送？</span>
          <span class="text-wine-400 text-xl font-light shrink-0 ml-4">+</span>
        </button>
        <div class="faq-answer px-5 pb-5 text-sm text-gray-500 leading-relaxed">目前提供台灣本島宅配服務（冷藏配送），滿 NT$3,000 免運費。國際配送方面，目前支援港澳與日本地區，運費依訂單重量計算。企業大量訂購享有特別優惠，歡迎來電洽詢。</div>
      </div>
    </div>
  </div>
</section>

<!-- Location & Hours -->
<section class="max-w-6xl mx-auto px-6 py-16">
  <div class="text-center mb-10">
    <div class="divider mx-auto mb-4"></div>
    <h2 class="serif text-4xl font-bold text-wine-700">造訪莊園</h2>
  </div>
  <div class="grid grid-cols-2 gap-8">
    <div class="bg-white rounded-xl p-8 border border-wine-50">
      <div class="flex items-start gap-4 mb-5">
        <div class="text-3xl">📍</div>
        <div>
          <h3 class="font-bold text-wine-700">莊園地址</h3>
          <p class="text-sm text-gray-500 mt-1">台中市后里區葡萄路 168 號</p>
          <p class="text-xs text-gray-400 mt-0.5">鄰近后里觀光花市，Google Maps 搜尋「醇酒莊園」</p>
        </div>
      </div>
      <div class="flex items-start gap-4 mb-5">
        <div class="text-3xl">🕐</div>
        <div>
          <h3 class="font-bold text-wine-700">營業時間</h3>
          <div class="text-sm text-gray-500 mt-1 space-y-0.5">
            <p>週二至週五：10:00 - 18:00</p>
            <p>週六至週日：09:00 - 20:00</p>
            <p class="text-xs text-wine-400">週一公休（國定假日除外）</p>
          </div>
        </div>
      </div>
      <div class="flex items-start gap-4">
        <div class="text-3xl">📞</div>
        <div>
          <h3 class="font-bold text-wine-700">聯絡方式</h3>
          <p class="text-sm text-gray-500 mt-1">電話：(04) 2573-8888</p>
          <p class="text-sm text-gray-500">信箱：hello@vineyardvista.tw</p>
        </div>
      </div>
    </div>
    <div class="bg-gradient-to-br from-wine-50 to-cream-100 rounded-xl border border-wine-50 flex items-center justify-center overflow-hidden relative">
      <div class="text-center p-8">
        <div class="text-6xl mb-4">🗺️</div>
        <p class="text-sm text-wine-700 font-medium">台中后里 &middot; 距離高鐵站 30 分鐘</p>
        <p class="text-xs text-gray-400 mt-2">提供週末高鐵站免費接駁服務</p>
        <div class="flex justify-center gap-3 mt-4">
          <span class="text-[10px] bg-white/70 text-wine-700 px-3 py-1 rounded-full">🅿 免費停車</span>
          <span class="text-[10px] bg-white/70 text-wine-700 px-3 py-1 rounded-full">🚌 接駁服務</span>
          <span class="text-[10px] bg-white/70 text-wine-700 px-3 py-1 rounded-full">♿ 無障礙</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="max-w-6xl mx-auto px-6 pb-16">
  <div class="bg-gradient-to-r from-wine-700 via-wine-800 to-wine-900 rounded-2xl p-14 text-center relative overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.12),transparent_70%)]"></div>
    <div class="relative z-10">
      <div class="divider mx-auto mb-4" style="background: linear-gradient(to right, transparent, #d4a843, transparent);"></div>
      <h2 class="serif text-4xl font-bold text-cream-50 mb-3">開啟您的味覺之旅</h2>
      <p class="text-cream-100/70 mb-8 max-w-lg mx-auto">無論是品酒初學者還是資深愛好者，醇酒莊園都為您準備了一場難忘的體驗。立即預約，讓美酒述說時光的故事。</p>
      <div class="flex justify-center gap-4">
        <button onclick="openModal()" class="bg-gold-500 hover:bg-gold-400 text-wine-900 px-10 py-3 font-bold tracking-wider transition rounded-sm text-sm">立即預約品酒</button>
        <a href="#wines" class="border border-cream-100/40 hover:border-cream-100/70 text-cream-50 px-10 py-3 tracking-wider transition rounded-sm text-sm inline-block">瀏覽酒款</a>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-wine-900 text-cream-100/60 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-4 gap-8 mb-8">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <span class="text-xl">🍷</span>
          <span class="serif text-lg font-bold text-cream-50 tracking-wider">VINEYARD<span class="text-gold-400">VISTA</span></span>
        </div>
        <p class="text-xs leading-relaxed">二十五年釀酒傳承，以風土與時間淬鍊每一滴美酒。歡迎蒞臨莊園，品味時光的藝術。</p>
      </div>
      <div>
        <h4 class="text-cream-50 font-medium text-sm mb-3">快速連結</h4>
        <div class="space-y-2 text-xs">
          <a href="#wines" class="block hover:text-gold-400 transition">經典酒款</a>
          <a href="#philosophy" class="block hover:text-gold-400 transition">釀酒哲學</a>
          <a href="#experience" class="block hover:text-gold-400 transition">品酒體驗</a>
          <a href="#tour" class="block hover:text-gold-400 transition">莊園巡禮</a>
        </div>
      </div>
      <div>
        <h4 class="text-cream-50 font-medium text-sm mb-3">聯絡我們</h4>
        <div class="space-y-2 text-xs">
          <p>📍 台中市后里區葡萄路 168 號</p>
          <p>📞 (04) 2573-8888</p>
          <p>📧 hello@vineyardvista.tw</p>
          <p>🕐 週二至週日 09:00-20:00</p>
        </div>
      </div>
      <div>
        <h4 class="text-cream-50 font-medium text-sm mb-3">社群媒體</h4>
        <div class="space-y-2 text-xs">
          <a href="#" class="block hover:text-gold-400 transition">Instagram @vineyardvista</a>
          <a href="#" class="block hover:text-gold-400 transition">Facebook 醇酒莊園</a>
          <a href="#" class="block hover:text-gold-400 transition">LINE 官方帳號</a>
        </div>
        <div class="mt-4 text-[10px] bg-wine-800/50 rounded-lg p-2 text-center text-cream-200/40 border border-white/5">訂閱電子報<br>搶先獲得新酒上市資訊</div>
      </div>
    </div>
    <div class="border-t border-white/10 pt-6 flex items-center justify-between text-xs">
      <p>&copy; 2026 醇酒莊園 VineyardVista. All rights reserved.</p>
      <p class="text-cream-200/40">&#9888; 未滿 18 歲禁止飲酒 &middot; 飲酒過量有害健康 &middot; 開車不喝酒</p>
    </div>
  </div>
</footer>

<script>
/* Wine filter */
function filterWines(cat) {
  document.querySelectorAll('.cat-btn').forEach(function(b) { b.classList.remove('active'); });
  event.target.classList.add('active');
  document.querySelectorAll('#wineGrid > div').forEach(function(card) {
    if (cat === 'all' || card.dataset.cat === cat) {
      card.style.display = '';
      card.style.opacity = '0';
      card.style.transform = 'translateY(10px)';
      setTimeout(function() {
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 50);
    } else {
      card.style.display = 'none';
    }
  });
}

/* FAQ toggle */
function toggleFaq(btn) {
  var answer = btn.nextElementSibling;
  var icon = btn.querySelector('span:last-child');
  var wasOpen = answer.classList.contains('open');
  /* Close all */
  document.querySelectorAll('.faq-answer').forEach(function(a) { a.classList.remove('open'); });
  document.querySelectorAll('.faq-answer').forEach(function(a) {
    a.previousElementSibling.querySelector('span:last-child').textContent = '+';
  });
  if (!wasOpen) {
    answer.classList.add('open');
    icon.textContent = '\u2212';
  }
}

/* Modal */
function openModal() {
  document.getElementById('reserveModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('reserveModal').classList.remove('show');
  document.body.style.overflow = '';
}
document.getElementById('reserveModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

/* Submit reservation */
function submitReservation() {
  var name = document.getElementById('rName').value;
  var phone = document.getElementById('rPhone').value;
  var date = document.getElementById('rDate').value;
  var time = document.getElementById('rTime').value;
  var guests = document.getElementById('rGuests').value;
  if (!name || !phone || !date || !time || !guests) {
    alert('Please fill in all required fields / \u8ACB\u586B\u5BEB\u5FC5\u586B\u6B04\u4F4D');
    return;
  }
  var orderNum = 'VV-' + Math.floor(Math.random() * 90000 + 10000);
  document.getElementById('reserveContent').innerHTML =
    '<div class="text-center py-6 fade-up">' +
    '<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">' +
    '<div class="check-anim" style="width:28px;height:14px;border-left:3px solid #16a34a;border-bottom:3px solid #16a34a;"></div>' +
    '</div>' +
    '<h3 class="serif text-2xl font-bold text-wine-700">預約成功！</h3>' +
    '<p class="text-sm text-gray-400 mt-2">我們已收到您的品酒預約</p>' +
    '<div class="bg-cream-50 rounded-lg p-4 mt-4 text-left text-sm text-gray-600 space-y-1.5">' +
    '<p><span class="text-gray-400">預約編號：</span><span class="font-mono text-wine-700 font-bold">' + orderNum + '</span></p>' +
    '<p><span class="text-gray-400">姓名：</span>' + name + '</p>' +
    '<p><span class="text-gray-400">日期：</span>' + date + '</p>' +
    '<p><span class="text-gray-400">時段：</span>' + time + '</p>' +
    '<p><span class="text-gray-400">人數：</span>' + guests + '</p>' +
    '</div>' +
    '<p class="text-xs text-gray-400 mt-3">確認信將發送至您的手機，如有問題請致電 (04) 2573-8888</p>' +
    '<button onclick="closeModal();setTimeout(function(){document.getElementById(\'reserveContent\').innerHTML=document.getElementById(\'reserveContent\').dataset.orig;},500);" class="mt-5 bg-wine-700 hover:bg-wine-800 text-cream-50 px-8 py-2.5 rounded-lg text-sm font-medium transition">完成</button>' +
    '</div>';
}

/* Nav shadow on scroll */
window.addEventListener('scroll', function() {
  var nav = document.getElementById('mainNav');
  if (window.scrollY > 20) {
    nav.classList.add('shadow-md');
  } else {
    nav.classList.remove('shadow-md');
  }
});

/* Store original form for reset */
document.addEventListener('DOMContentLoaded', function() {
  var rc = document.getElementById('reserveContent');
  rc.dataset.orig = rc.innerHTML;
  /* Set min date to today */
  var today = new Date().toISOString().split('T')[0];
  document.getElementById('rDate').setAttribute('min', today);
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
