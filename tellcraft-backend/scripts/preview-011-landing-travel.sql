INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'b50d94c8-8a29-4497-abfb-0979e99c3268',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>雲棲山房 CloudNest Retreat</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        sage: { 50:'#f6f7f4', 100:'#eaede4', 200:'#d5dbc9', 400:'#9aaa7e', 500:'#7a8f5f', 600:'#5f7148', DEFAULT:'#7a8f5f' },
        sand: { 50:'#faf8f5', 100:'#f2ede5', 200:'#e5dccf', 400:'#c4b49e', 500:'#ad9a81' },
        earth: { 700:'#4a3f35', 800:'#3a3128', 900:'#2a2420' }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Noto Sans TC"', 'serif'],
        sans: ['"Noto Sans TC"', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Noto Sans TC', sans-serif; color: #3a3128; background: #faf8f5; }

  .reveal { opacity:0; transform:translateY(24px); transition: all 0.8s cubic-bezier(0.22,1,0.36,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }

  .toast {
    position:fixed; bottom:2rem; right:2rem; background:#5f7148; color:#fff;
    padding:0.875rem 1.5rem; border-radius:12px; font-size:0.9rem; font-weight:500;
    z-index:9999; transform:translateY(120%); opacity:0;
    transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
    box-shadow: 0 8px 32px rgba(95,113,72,0.3);
  }
  .toast.show { transform:translateY(0); opacity:1; }

  .room-card { transition: all 0.4s ease; }
  .room-card:hover { transform: translateY(-6px); }
  .room-card:hover .room-img { transform: scale(1.05); }
  .room-img { transition: transform 0.6s ease; }

  .dest-card { transition: all 0.4s ease; }
  .dest-card:hover { transform: translateY(-4px); }
  .dest-card:hover .dest-overlay { opacity: 1; }
  .dest-overlay { opacity: 0; transition: opacity 0.3s ease; }

  .gallery-item { transition: all 0.3s ease; cursor: pointer; }
  .gallery-item:hover { transform: scale(1.02); }

  .nav-scrolled {
    background: rgba(250,248,245,0.97) !important;
    box-shadow: 0 2px 20px rgba(0,0,0,0.05);
  }

  .hero-parallax {
    background-attachment: fixed;
    background-size: cover;
    background-position: center;
  }

  .date-input::-webkit-calendar-picker-indicator { cursor: pointer; }
</style>
</head>
<body>

<div id="toast" class="toast"></div>

<!-- Navigation -->
<nav id="navbar" class="fixed top-0 w-full z-50 bg-transparent transition-all duration-500">
  <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
    <a href="#" class="flex items-center gap-3">
      <div class="flex flex-col items-center leading-none">
        <span class="font-serif text-2xl font-bold text-white nav-text transition-colors duration-300">雲棲山房</span>
        <span class="text-[9px] tracking-[0.3em] text-white/60 nav-subtext transition-colors duration-300">CLOUDNEST RETREAT</span>
      </div>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#rooms" class="text-sm font-medium text-white/80 hover:text-white nav-link transition-colors duration-300">客房</a>
      <a href="#destinations" class="text-sm font-medium text-white/80 hover:text-white nav-link transition-colors duration-300">周邊景點</a>
      <a href="#gallery" class="text-sm font-medium text-white/80 hover:text-white nav-link transition-colors duration-300">影像紀實</a>
      <a href="#booking" class="text-sm font-medium text-white/80 hover:text-white nav-link transition-colors duration-300">預訂</a>
      <button onclick="scrollTo('booking')" class="bg-white/20 backdrop-blur hover:bg-white hover:text-earth-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer nav-btn border border-white/30">
        立即預訂
      </button>
    </div>
    <button onclick="toggleMobile()" class="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 cursor-pointer">
      <svg class="w-6 h-6 text-white nav-icon transition-colors duration-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div id="mobileMenu" class="hidden md:hidden bg-sand-50 border-t border-sand-200 px-6 pb-6">
    <div class="flex flex-col gap-1 pt-4">
      <a href="#rooms" onclick="closeMobile()" class="py-3 text-earth-700 font-medium">客房</a>
      <a href="#destinations" onclick="closeMobile()" class="py-3 text-earth-700 font-medium">周邊景點</a>
      <a href="#gallery" onclick="closeMobile()" class="py-3 text-earth-700 font-medium">影像紀實</a>
      <a href="#booking" onclick="closeMobile()" class="py-3 text-earth-700 font-medium">預訂</a>
      <button onclick="scrollTo('booking');closeMobile()" class="mt-2 bg-sage-600 text-white py-3 rounded-xl font-semibold cursor-pointer">立即預訂</button>
    </div>
  </div>
</nav>

<!-- Hero Section - Full Screen -->
<section class="relative h-screen flex items-center justify-center overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-sage-600/80 via-earth-700/60 to-sage-500/70"></div>
  <div class="absolute inset-0 bg-gradient-to-t from-earth-900/40 to-transparent"></div>
  <!-- Nature pattern overlay -->
  <div class="absolute inset-0 opacity-10" style="background-image: url('data:image/svg+xml,%3Csvg width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M50 0 C55 35 65 50 100 50 C65 55 55 65 50 100 C45 65 35 55 0 50 C35 45 45 35 50 0Z%22 fill=%22%23fff%22/%3E%3C/svg%3E'); background-size: 80px;"></div>

  <div class="relative text-center px-6 max-w-4xl">
    <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-5 py-2 mb-8">
      <svg class="w-4 h-4 text-sage-200" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
      <span class="text-sm text-white/80">南投縣魚池鄉 · 海拔 760 公尺</span>
    </div>
    <h1 class="font-serif text-5xl lg:text-7xl xl:text-8xl font-bold text-white leading-tight mb-6">
      雲棲山房
    </h1>
    <p class="text-xl lg:text-2xl text-white/70 font-light mb-4 font-serif italic">
      Where clouds rest, and you find peace.
    </p>
    <p class="text-base text-white/60 max-w-xl mx-auto mb-12">
      隱身日月潭畔的山間秘境，與雲霧為鄰，讓時光慢下來。
    </p>
    <div class="flex flex-wrap gap-4 justify-center">
      <button onclick="scrollTo('booking')" class="bg-white text-earth-800 px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:shadow-xl cursor-pointer">
        預訂客房
      </button>
      <button onclick="scrollTo('gallery')" class="border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/10 transition-all cursor-pointer">
        探索美景
      </button>
    </div>
  </div>

  <!-- Scroll indicator -->
  <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
    <span class="text-white/40 text-xs tracking-widest">SCROLL</span>
    <div class="w-px h-12 bg-gradient-to-b from-white/40 to-transparent"></div>
  </div>
</section>

<!-- Rooms Section -->
<section id="rooms" class="py-24 bg-sand-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-sage-500 font-medium text-sm tracking-[0.2em] uppercase">Rooms & Suites</span>
      <h2 class="font-serif text-3xl lg:text-5xl font-bold text-earth-800 mt-3">客房空間</h2>
      <p class="text-earth-700/60 mt-4 max-w-2xl mx-auto">每間客房都面向山谷，推窗即見雲海。以在地木材與石材打造，營造質樸溫暖的山居氛圍。</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 reveal">
      <!-- Room 1 -->
      <div class="room-card bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer" onclick="showToast('查看「雲嵐」雙人房詳細資訊')">
        <div class="aspect-[4/3] bg-gradient-to-br from-sage-200 to-sage-100 overflow-hidden flex items-center justify-center relative">
          <div class="room-img text-7xl">🏔️</div>
          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-3 py-1 text-xs font-semibold text-earth-800">NT$3,800/晚</div>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs bg-sage-100 text-sage-600 px-2.5 py-0.5 rounded-full font-medium">雙人房</span>
            <span class="text-xs text-earth-700/40">12 坪</span>
          </div>
          <h3 class="font-serif text-xl font-bold text-earth-800 mb-2">雲嵐 Mist</h3>
          <p class="text-earth-700/60 text-sm leading-relaxed mb-4">面山雙人房，落地窗迎接晨間雲海。檜木浴缸、手沖咖啡組、暖氣。</p>
          <div class="flex flex-wrap gap-2">
            <span class="text-[10px] text-earth-700/40 bg-sand-100 px-2 py-1 rounded">山景</span>
            <span class="text-[10px] text-earth-700/40 bg-sand-100 px-2 py-1 rounded">檜木浴缸</span>
            <span class="text-[10px] text-earth-700/40 bg-sand-100 px-2 py-1 rounded">暖氣</span>
            <span class="text-[10px] text-earth-700/40 bg-sand-100 px-2 py-1 rounded">WiFi</span>
          </div>
        </div>
      </div>
      <!-- Room 2 -->
      <div class="room-card bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer" onclick="showToast('查看「映月」家庭房詳細資訊')">
        <div class="aspect-[4/3] bg-gradient-to-br from-sand-200 to-sand-100 overflow-hidden flex items-center justify-center relative">
          <div class="room-img text-7xl">🌙</div>
          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-3 py-1 text-xs font-semibold text-earth-800">NT$5,200/晚</div>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs bg-sand-200 text-sand-500 px-2.5 py-0.5 rounded-full font-medium">家庭房</span>
            <span class="text-xs text-earth-700/40">18 坪</span>
          </div>
          <h3 class="font-serif text-xl font-bold text-earth-800 mb-2">映月 Moonrise</h3>
          <p class="text-earth-700/60 text-sm leading-relaxed mb-4">寬敞家庭房，一大一小床。獨立陽台可觀星，兒童遊具、繪本借閱。</p>
          <div class="flex flex-wrap gap-2">
            <span class="text-[10px] text-earth-700/40 bg-sand-100 px-2 py-1 rounded">親子友善</span>
            <span class="text-[10px] text-earth-700/40 bg-sand-100 px-2 py-1 rounded">獨立陽台</span>
            <span class="text-[10px] text-earth-700/40 bg-sand-100 px-2 py-1 rounded">觀星</span>
            <span class="text-[10px] text-earth-700/40 bg-sand-100 px-2 py-1 rounded">浴缸</span>
          </div>
        </div>
      </div>
      <!-- Room 3 -->
      <div class="room-card bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer" onclick="showToast('查看「松風」獨棟Villa詳細資訊')">
        <div class="aspect-[4/3] bg-gradient-to-br from-emerald-100 to-sage-100 overflow-hidden flex items-center justify-center relative">
          <div class="room-img text-7xl">🌲</div>
          <div class="absolute top-4 left-4 bg-sage-600 text-white text-xs font-semibold px-3 py-1 rounded-full">人氣首選</div>
          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-3 py-1 text-xs font-semibold text-earth-800">NT$8,800/晚</div>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs bg-emerald-100 text-emerald-600 px-2.5 py-0.5 rounded-full font-medium">獨棟Villa</span>
            <span class="text-xs text-earth-700/40">30 坪</span>
          </div>
          <h3 class="font-serif text-xl font-bold text-earth-800 mb-2">松風 Pinewood</h3>
          <p class="text-earth-700/60 text-sm leading-relaxed mb-4">獨棟山間小屋，私人露台、戶外泡湯池。壁爐、廚房一應俱全。</p>
          <div class="flex flex-wrap gap-2">
            <span class="text-[10px] text-earth-700/40 bg-sand-100 px-2 py-1 rounded">獨棟</span>
            <span class="text-[10px] text-earth-700/40 bg-sand-100 px-2 py-1 rounded">露天泡湯</span>
            <span class="text-[10px] text-earth-700/40 bg-sand-100 px-2 py-1 rounded">壁爐</span>
            <span class="text-[10px] text-earth-700/40 bg-sand-100 px-2 py-1 rounded">廚房</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Destinations -->
<section id="destinations" class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-sage-500 font-medium text-sm tracking-[0.2em] uppercase">Nearby</span>
      <h2 class="font-serif text-3xl lg:text-5xl font-bold text-earth-800 mt-3">周邊景點</h2>
      <p class="text-earth-700/60 mt-4">步出山房，處處是風景。</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 reveal">
      <div class="dest-card relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer" onclick="showToast('查看日月潭景點資訊')">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center">
          <span class="text-6xl">🌊</span>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-earth-900/70 to-transparent"></div>
        <div class="dest-overlay absolute inset-0 bg-sage-600/40 flex items-center justify-center">
          <span class="text-white font-semibold">探索 →</span>
        </div>
        <div class="absolute bottom-0 left-0 right-0 p-5">
          <span class="text-white/60 text-xs">車程 15 分鐘</span>
          <h3 class="font-serif text-xl font-bold text-white mt-1">日月潭</h3>
          <p class="text-white/70 text-xs mt-1">環湖自行車道、朝霧碼頭、水社老街</p>
        </div>
      </div>
      <div class="dest-card relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer" onclick="showToast('查看九族文化村景點資訊')">
        <div class="absolute inset-0 bg-gradient-to-br from-pink-200 to-purple-300 flex items-center justify-center">
          <span class="text-6xl">🌸</span>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-earth-900/70 to-transparent"></div>
        <div class="dest-overlay absolute inset-0 bg-sage-600/40 flex items-center justify-center">
          <span class="text-white font-semibold">探索 →</span>
        </div>
        <div class="absolute bottom-0 left-0 right-0 p-5">
          <span class="text-white/60 text-xs">車程 20 分鐘</span>
          <h3 class="font-serif text-xl font-bold text-white mt-1">九族文化村</h3>
          <p class="text-white/70 text-xs mt-1">纜車、櫻花季、原住民文化體驗</p>
        </div>
      </div>
      <div class="dest-card relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer" onclick="showToast('查看澀水社區景點資訊')">
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-200 to-emerald-400 flex items-center justify-center">
          <span class="text-6xl">🍃</span>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-earth-900/70 to-transparent"></div>
        <div class="dest-overlay absolute inset-0 bg-sage-600/40 flex items-center justify-center">
          <span class="text-white font-semibold">探索 →</span>
        </div>
        <div class="absolute bottom-0 left-0 right-0 p-5">
          <span class="text-white/60 text-xs">步行 10 分鐘</span>
          <h3 class="font-serif text-xl font-bold text-white mt-1">澀水社區</h3>
          <p class="text-white/70 text-xs mt-1">紅茶體驗、陶藝 DIY、森林步道</p>
        </div>
      </div>
      <div class="dest-card relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer" onclick="showToast('查看集集線景點資訊')">
        <div class="absolute inset-0 bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center">
          <span class="text-6xl">🚂</span>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-earth-900/70 to-transparent"></div>
        <div class="dest-overlay absolute inset-0 bg-sage-600/40 flex items-center justify-center">
          <span class="text-white font-semibold">探索 →</span>
        </div>
        <div class="absolute bottom-0 left-0 right-0 p-5">
          <span class="text-white/60 text-xs">車程 30 分鐘</span>
          <h3 class="font-serif text-xl font-bold text-white mt-1">集集線</h3>
          <p class="text-white/70 text-xs mt-1">百年車站、綠色隧道、特有生物中心</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Gallery -->
<section id="gallery" class="py-24 bg-sand-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-sage-500 font-medium text-sm tracking-[0.2em] uppercase">Gallery</span>
      <h2 class="font-serif text-3xl lg:text-5xl font-bold text-earth-800 mt-3">影像紀實</h2>
      <p class="text-earth-700/60 mt-4">住客鏡頭下的雲棲四季。</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 reveal">
      <div class="gallery-item col-span-2 row-span-2 aspect-square rounded-2xl bg-gradient-to-br from-sage-200 to-sage-300 flex items-center justify-center overflow-hidden" onclick="showToast('查看大圖：晨間雲海')">
        <div class="text-center">
          <div class="text-7xl mb-2">🌄</div>
          <p class="text-sage-600/60 text-sm">晨間雲海</p>
        </div>
      </div>
      <div class="gallery-item aspect-square rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center overflow-hidden" onclick="showToast('查看大圖：夕陽餘暉')">
        <div class="text-center">
          <div class="text-4xl mb-1">🌅</div>
          <p class="text-amber-600/60 text-xs">夕陽餘暉</p>
        </div>
      </div>
      <div class="gallery-item aspect-square rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center overflow-hidden" onclick="showToast('查看大圖：星空銀河')">
        <div class="text-center">
          <div class="text-4xl mb-1">🌌</div>
          <p class="text-indigo-600/60 text-xs">星空銀河</p>
        </div>
      </div>
      <div class="gallery-item aspect-square rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center overflow-hidden" onclick="showToast('查看大圖：山間小徑')">
        <div class="text-center">
          <div class="text-4xl mb-1">🌿</div>
          <p class="text-emerald-600/60 text-xs">山間小徑</p>
        </div>
      </div>
      <div class="gallery-item aspect-square rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center overflow-hidden" onclick="showToast('查看大圖：在地茶席')">
        <div class="text-center">
          <div class="text-4xl mb-1">🍵</div>
          <p class="text-orange-600/60 text-xs">在地茶席</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-sage-500 font-medium text-sm tracking-[0.2em] uppercase">Reviews</span>
      <h2 class="font-serif text-3xl lg:text-5xl font-bold text-earth-800 mt-3">旅人迴響</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-8 reveal">
      <div class="bg-sand-50 rounded-2xl p-8">
        <div class="flex gap-1 mb-4 text-amber-400">★★★★★</div>
        <p class="text-earth-700/70 text-sm leading-relaxed mb-6 italic">"推開窗就是雲海，泡在檜木浴缸裡看夕陽，人生最奢侈的寧靜。管家準備的早餐用的全是在地食材，每一口都是驚喜。"</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-sage-200 rounded-full flex items-center justify-center font-bold text-sage-700 text-sm">林</div>
          <div>
            <div class="font-medium text-earth-800 text-sm">林小姐</div>
            <div class="text-xs text-earth-700/40">2026.01 · 雲嵐雙人房</div>
          </div>
        </div>
      </div>
      <div class="bg-sand-50 rounded-2xl p-8">
        <div class="flex gap-1 mb-4 text-amber-400">★★★★★</div>
        <p class="text-earth-700/70 text-sm leading-relaxed mb-6 italic">"帶孩子住了映月房，小朋友在陽台看到螢火蟲開心到尖叫。民宿主人還帶我們去私房步道，完全是城市裡找不到的體驗。"</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-sand-300 rounded-full flex items-center justify-center font-bold text-sand-700 text-sm">陳</div>
          <div>
            <div class="font-medium text-earth-800 text-sm">陳爸爸</div>
            <div class="text-xs text-earth-700/40">2025.12 · 映月家庭房</div>
          </div>
        </div>
      </div>
      <div class="bg-sand-50 rounded-2xl p-8">
        <div class="flex gap-1 mb-4 text-amber-400">★★★★★</div>
        <p class="text-earth-700/70 text-sm leading-relaxed mb-6 italic">"松風Villa的露天溫泉太享受了，冬天泡在熱湯裡看星星，壁爐燒著柴火的聲音讓人完全放鬆。已經訂了第三次了。"</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center font-bold text-emerald-700 text-sm">王</div>
          <div>
            <div class="font-medium text-earth-800 text-sm">王先生 & 太太</div>
            <div class="text-xs text-earth-700/40">2025.11 · 松風Villa</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Booking Section -->
<section id="booking" class="py-24 bg-earth-800 relative overflow-hidden">
  <div class="absolute inset-0 opacity-5" style="background-image: url('data:image/svg+xml,%3Csvg width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M50 0 C55 35 65 50 100 50 C65 55 55 65 50 100 C45 65 35 55 0 50 C35 45 45 35 50 0Z%22 fill=%22%23fff%22/%3E%3C/svg%3E'); background-size: 60px;"></div>

  <div class="relative max-w-4xl mx-auto px-6">
    <div class="text-center mb-12 reveal">
      <span class="text-sage-400 font-medium text-sm tracking-[0.2em] uppercase">Reservation</span>
      <h2 class="font-serif text-3xl lg:text-5xl font-bold text-white mt-3">預訂您的山居時光</h2>
      <p class="text-white/50 mt-4">選擇日期與客房，開始一段靜謐之旅。</p>
    </div>

    <form id="bookingForm" onsubmit="return handleBooking(event)" class="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 lg:p-10 reveal">
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label class="block text-sm font-medium text-white/80 mb-2">入住日期 *</label>
          <input type="date" id="bCheckin" required class="date-input w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/20 outline-none text-sm transition-all">
        </div>
        <div>
          <label class="block text-sm font-medium text-white/80 mb-2">退房日期 *</label>
          <input type="date" id="bCheckout" required class="date-input w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white focus:border-sage-400 focus:ring-2 focus:ring-sage-400/20 outline-none text-sm transition-all">
        </div>
      </div>
      <div class="grid md:grid-cols-3 gap-6 mb-6">
        <div>
          <label class="block text-sm font-medium text-white/80 mb-2">房型 *</label>
          <select id="bRoom" required class="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white focus:border-sage-400 outline-none text-sm transition-all cursor-pointer">
            <option value="" class="text-earth-800">請選擇</option>
            <option value="雲嵐" class="text-earth-800">雲嵐 雙人房 $3,800</option>
            <option value="映月" class="text-earth-800">映月 家庭房 $5,200</option>
            <option value="松風" class="text-earth-800">松風 Villa $8,800</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-white/80 mb-2">大人 *</label>
          <select id="bAdults" required class="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white focus:border-sage-400 outline-none text-sm transition-all cursor-pointer">
            <option value="1" class="text-earth-800">1 位</option>
            <option value="2" selected class="text-earth-800">2 位</option>
            <option value="3" class="text-earth-800">3 位</option>
            <option value="4" class="text-earth-800">4 位</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-white/80 mb-2">兒童</label>
          <select id="bChildren" class="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white focus:border-sage-400 outline-none text-sm transition-all cursor-pointer">
            <option value="0" class="text-earth-800">0 位</option>
            <option value="1" class="text-earth-800">1 位</option>
            <option value="2" class="text-earth-800">2 位</option>
          </select>
        </div>
      </div>
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label class="block text-sm font-medium text-white/80 mb-2">姓名 *</label>
          <input type="text" id="bName" required placeholder="訂房者姓名" class="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:border-sage-400 focus:ring-2 focus:ring-sage-400/20 outline-none text-sm transition-all">
        </div>
        <div>
          <label class="block text-sm font-medium text-white/80 mb-2">手機 *</label>
          <input type="tel" id="bPhone" required placeholder="0912-345-678" class="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:border-sage-400 focus:ring-2 focus:ring-sage-400/20 outline-none text-sm transition-all">
        </div>
      </div>
      <div class="mb-8">
        <label class="block text-sm font-medium text-white/80 mb-2">特殊需求</label>
        <textarea id="bNotes" rows="3" placeholder="素食早餐、加嬰兒床、慶祝紀念日…" class="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:border-sage-400 focus:ring-2 focus:ring-sage-400/20 outline-none text-sm transition-all resize-none"></textarea>
      </div>
      <button type="submit" class="w-full bg-sage-500 hover:bg-sage-600 text-white py-4 rounded-2xl font-semibold text-lg transition-all hover:shadow-lg cursor-pointer">
        送出預訂
      </button>
      <p class="text-xs text-white/30 text-center mt-4">送出後將於 24 小時內以電話確認訂房，確認後收取 30% 訂金。</p>
    </form>
  </div>
</section>

<!-- Footer -->
<footer class="bg-earth-900 text-white pt-16 pb-8">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-3 gap-10 pb-12 border-b border-white/10">
      <div>
        <div class="mb-4">
          <span class="font-serif text-2xl font-bold">雲棲山房</span>
          <span class="text-[9px] text-white/40 block tracking-[0.3em] mt-0.5">CLOUDNEST RETREAT</span>
        </div>
        <p class="text-white/50 text-sm leading-relaxed">與雲為鄰，與山為友。<br>在喧囂世界中，為您留一方淨土。</p>
      </div>
      <div>
        <h4 class="font-medium mb-4">聯絡資訊</h4>
        <div class="flex flex-col gap-3 text-white/50 text-sm">
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
            南投縣魚池鄉水社村中山路 158 號
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            049-285-1688
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            入住 15:00 · 退房 11:00
          </div>
        </div>
      </div>
      <div>
        <h4 class="font-medium mb-4">追蹤我們</h4>
        <div class="flex gap-3">
          <a href="#" class="w-10 h-10 bg-white/10 hover:bg-sage-500 rounded-xl flex items-center justify-center transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="#" class="w-10 h-10 bg-white/10 hover:bg-sage-500 rounded-xl flex items-center justify-center transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="#" class="w-10 h-10 bg-white/10 hover:bg-[#06C755] rounded-xl flex items-center justify-center transition-colors cursor-pointer">
            <span class="text-xs font-bold">LINE</span>
          </a>
        </div>
        <p class="text-white/30 text-xs mt-6">觀光局登記證號：南投縣民宿 0168 號</p>
      </div>
    </div>
    <div class="pt-8 text-center">
      <p class="text-white/30 text-xs">&copy; 2026 雲棲山房 CloudNest Retreat. All rights reserved.</p>
    </div>
  </div>
</footer>

<script>
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function toggleMobile() { document.getElementById('mobileMenu').classList.toggle('hidden'); }
function closeMobile() { document.getElementById('mobileMenu').classList.add('hidden'); }

function scrollTo(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// Nav scroll - transparent to solid
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  const scrolled = window.scrollY > 80;
  nav.classList.toggle('nav-scrolled', scrolled);
  nav.querySelectorAll('.nav-text').forEach(el => el.style.color = scrolled ? '#3a3128' : '#fff');
  nav.querySelectorAll('.nav-subtext').forEach(el => el.style.color = scrolled ? 'rgba(58,49,40,0.4)' : 'rgba(255,255,255,0.6)');
  nav.querySelectorAll('.nav-link').forEach(el => { el.style.color = scrolled ? 'rgba(58,49,40,0.6)' : 'rgba(255,255,255,0.8)'; });
  nav.querySelectorAll('.nav-icon').forEach(el => el.style.color = scrolled ? '#3a3128' : '#fff');
  nav.querySelectorAll('.nav-btn').forEach(el => {
    if (scrolled) {
      el.style.background = '#5f7148'; el.style.color = '#fff'; el.style.borderColor = '#5f7148';
    } else {
      el.style.background = 'rgba(255,255,255,0.2)'; el.style.color = '#fff'; el.style.borderColor = 'rgba(255,255,255,0.3)';
    }
  });
});

// Reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Set min date
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const ci = document.getElementById('bCheckin');
  const co = document.getElementById('bCheckout');
  if (ci) ci.min = tomorrow.toISOString().split('T')[0];
  if (co) co.min = dayAfter.toISOString().split('T')[0];
  if (ci) ci.addEventListener('change', () => {
    const d = new Date(ci.value);
    d.setDate(d.getDate() + 1);
    co.min = d.toISOString().split('T')[0];
    if (co.value && new Date(co.value) <= new Date(ci.value)) co.value = '';
  });
});

function handleBooking(e) {
  e.preventDefault();
  const name = document.getElementById('bName').value;
  const room = document.getElementById('bRoom').value;
  const ci = document.getElementById('bCheckin').value;
  const co = document.getElementById('bCheckout').value;
  if (!name || !room || !ci || !co) {
    showToast('請填寫所有必填欄位');
    return false;
  }
  const nights = Math.ceil((new Date(co) - new Date(ci)) / 86400000);
  showToast(`預訂成功！${name}，${room}房 ${ci} ~ ${co}（${nights}晚），稍後將致電確認`);
  e.target.reset();
  return false;
}
</script>

</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
