INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '39f3f4ad-8d7c-493e-92bd-f4c2166fc33e',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FRAMEHAUS — 影像創作者作品集</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        film: { 50:'#f5f5f6', 100:'#e5e5e8', 200:'#cdced3', 300:'#aaabb4', 400:'#81828f', 500:'#636474', 600:'#515260', 700:'#45454f', 800:'#3b3c44', 900:'#27272e', 950:'#111114' },
        accent: { 400:'#fb923c', 500:'#f97316', 600:'#ea580c' }
      },
      fontFamily: { space:['Space Grotesk','Noto Sans TC','sans-serif'] }
    }
  }
}
</script>
<style>
  * { font-family: 'Space Grotesk', 'Noto Sans TC', sans-serif; }
  html { scroll-behavior: smooth; }
  body { background: #111114; color: #e5e5e8; }
  .reveal { opacity:0; transform:translateY(20px); transition:all 0.6s cubic-bezier(0.16,1,0.3,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }
  .video-card:hover .video-overlay { opacity:1; }
  .video-card:hover .video-thumb { transform: scale(1.05); }
  .scanline { background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px); pointer-events:none; }
</style>
</head>
<body>

<!-- Navbar -->
<nav class="fixed top-0 w-full bg-film-950/95 backdrop-blur-md z-50 border-b border-film-800/50">
  <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2">
      <div class="w-7 h-7 border-2 border-accent-500 rounded flex items-center justify-center">
        <svg class="w-3.5 h-3.5 text-accent-500" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </div>
      <span class="text-lg font-bold tracking-tight">FRAMEHAUS</span>
    </a>
    <div class="hidden md:flex items-center gap-8 text-sm font-medium text-film-400">
      <a href="#works" class="hover:text-white transition-colors">作品</a>
      <a href="#about" class="hover:text-white transition-colors">關於</a>
      <a href="#services" class="hover:text-white transition-colors">服務</a>
      <a href="#clients" class="hover:text-white transition-colors">合作夥伴</a>
      <a href="#contact" class="hover:text-white transition-colors">聯繫</a>
    </div>
    <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-film-400">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-film-950 border-t border-film-800/50 px-6 py-4 space-y-3">
    <a href="#works" class="block text-sm text-film-400">作品</a>
    <a href="#about" class="block text-sm text-film-400">關於</a>
    <a href="#services" class="block text-sm text-film-400">服務</a>
    <a href="#clients" class="block text-sm text-film-400">合作夥伴</a>
    <a href="#contact" class="block text-sm text-film-400">聯繫</a>
  </div>
</nav>

<!-- Hero Reel -->
<section class="pt-14 min-h-screen flex items-center relative overflow-hidden">
  <div class="absolute inset-0 scanline z-10"></div>
  <div class="absolute inset-0 bg-gradient-to-b from-film-950/50 via-transparent to-film-950 z-10"></div>
  <div class="absolute inset-0 bg-gradient-to-r from-film-950 via-film-900/80 to-film-950 flex items-center justify-center">
    <div class="text-[200px] opacity-10">🎬</div>
  </div>
  <div class="relative z-20 max-w-6xl mx-auto px-6 w-full">
    <div class="max-w-2xl">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span class="text-xs tracking-[0.3em] uppercase text-film-400 font-medium">Director · Cinematographer · Editor</span>
      </div>
      <h1 class="text-5xl md:text-7xl font-bold tracking-tight leading-none mb-6">
        用鏡頭<br>
        <span class="text-accent-500">說故事</span>
      </h1>
      <p class="text-film-400 text-lg leading-relaxed mb-8 max-w-lg">
        FRAMEHAUS 由導演陳昱翔創立，專注品牌影片、廣告、音樂錄影帶及紀錄片製作。用電影級的視覺語言，為每個故事注入靈魂。
      </p>
      <div class="flex flex-wrap gap-4">
        <a href="#works" class="bg-accent-500 text-white px-8 py-3 rounded-sm font-semibold hover:bg-accent-600 transition-colors">
          觀看作品 ▶
        </a>
        <a href="#contact" class="border border-film-600 text-film-300 px-8 py-3 rounded-sm font-semibold hover:border-accent-500 hover:text-accent-500 transition-colors">
          合作洽談
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Works -->
<section id="works" class="py-24">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between mb-10 reveal">
      <div>
        <span class="text-accent-500 text-xs tracking-[0.3em] uppercase font-medium">Selected Works</span>
        <h2 class="text-3xl md:text-4xl font-bold tracking-tight mt-2">精選作品</h2>
      </div>
      <div class="hidden md:flex gap-2">
        <button onclick="filterWork('all')" class="work-btn active text-xs px-3 py-1.5 rounded-sm font-medium bg-accent-500 text-white">全部</button>
        <button onclick="filterWork('brand')" class="work-btn text-xs px-3 py-1.5 rounded-sm font-medium bg-film-800 text-film-400 hover:text-white">品牌</button>
        <button onclick="filterWork('mv')" class="work-btn text-xs px-3 py-1.5 rounded-sm font-medium bg-film-800 text-film-400 hover:text-white">MV</button>
        <button onclick="filterWork('doc')" class="work-btn text-xs px-3 py-1.5 rounded-sm font-medium bg-film-800 text-film-400 hover:text-white">紀錄片</button>
        <button onclick="filterWork('ad')" class="work-btn text-xs px-3 py-1.5 rounded-sm font-medium bg-film-800 text-film-400 hover:text-white">廣告</button>
      </div>
    </div>
    <div class="grid md:grid-cols-2 gap-4" id="works-grid">
      <div class="reveal video-card relative aspect-video bg-film-900 rounded-sm overflow-hidden cursor-pointer group" data-cat="brand" onclick="openWork(this)">
        <div class="video-thumb absolute inset-0 bg-gradient-to-br from-film-800 to-film-900 flex items-center justify-center text-7xl transition-transform duration-500">🏔️</div>
        <div class="video-overlay absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 transition-opacity duration-300">
          <div class="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center"><svg class="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg></div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
          <span class="text-accent-500 text-[10px] tracking-wider uppercase font-medium">品牌影片</span>
          <h3 class="font-bold text-white mt-1">Patagonia Taiwan — 山與海之間</h3>
          <p class="text-film-300 text-xs mt-1">4K · 3 分鐘 · 品牌形象</p>
        </div>
      </div>
      <div class="reveal video-card relative aspect-video bg-film-900 rounded-sm overflow-hidden cursor-pointer group" data-cat="mv" onclick="openWork(this)">
        <div class="video-thumb absolute inset-0 bg-gradient-to-br from-purple-900 to-film-900 flex items-center justify-center text-7xl transition-transform duration-500">🎵</div>
        <div class="video-overlay absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 transition-opacity duration-300">
          <div class="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center"><svg class="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg></div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
          <span class="text-accent-500 text-[10px] tracking-wider uppercase font-medium">Music Video</span>
          <h3 class="font-bold text-white mt-1">9m88 — Midnight Cruise</h3>
          <p class="text-film-300 text-xs mt-1">4K · 4:32 · 概念 MV</p>
        </div>
      </div>
      <div class="reveal video-card relative aspect-video bg-film-900 rounded-sm overflow-hidden cursor-pointer group" data-cat="doc" onclick="openWork(this)">
        <div class="video-thumb absolute inset-0 bg-gradient-to-br from-amber-900 to-film-900 flex items-center justify-center text-7xl transition-transform duration-500">🎎</div>
        <div class="video-overlay absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 transition-opacity duration-300">
          <div class="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center"><svg class="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg></div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
          <span class="text-accent-500 text-[10px] tracking-wider uppercase font-medium">紀錄片</span>
          <h3 class="font-bold text-white mt-1">職人之手 — 大稻埕百年糕餅店</h3>
          <p class="text-film-300 text-xs mt-1">4K · 28 分鐘 · 短片紀錄</p>
        </div>
      </div>
      <div class="reveal video-card relative aspect-video bg-film-900 rounded-sm overflow-hidden cursor-pointer group" data-cat="ad" onclick="openWork(this)">
        <div class="video-thumb absolute inset-0 bg-gradient-to-br from-blue-900 to-film-900 flex items-center justify-center text-7xl transition-transform duration-500">🚗</div>
        <div class="video-overlay absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 transition-opacity duration-300">
          <div class="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center"><svg class="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg></div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
          <span class="text-accent-500 text-[10px] tracking-wider uppercase font-medium">TVC 廣告</span>
          <h3 class="font-bold text-white mt-1">Luxgen n⁷ — 電馭未來</h3>
          <p class="text-film-300 text-xs mt-1">4K · 30s/60s · 電視廣告</p>
        </div>
      </div>
      <div class="reveal video-card relative aspect-video bg-film-900 rounded-sm overflow-hidden cursor-pointer group" data-cat="brand" onclick="openWork(this)">
        <div class="video-thumb absolute inset-0 bg-gradient-to-br from-green-900 to-film-900 flex items-center justify-center text-7xl transition-transform duration-500">☕</div>
        <div class="video-overlay absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 transition-opacity duration-300">
          <div class="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center"><svg class="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg></div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
          <span class="text-accent-500 text-[10px] tracking-wider uppercase font-medium">品牌影片</span>
          <h3 class="font-bold text-white mt-1">% Arabica — 一杯咖啡的旅程</h3>
          <p class="text-film-300 text-xs mt-1">4K · 2 分鐘 · 品牌故事</p>
        </div>
      </div>
      <div class="reveal video-card relative aspect-video bg-film-900 rounded-sm overflow-hidden cursor-pointer group" data-cat="mv" onclick="openWork(this)">
        <div class="video-thumb absolute inset-0 bg-gradient-to-br from-red-900 to-film-900 flex items-center justify-center text-7xl transition-transform duration-500">🎸</div>
        <div class="video-overlay absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 transition-opacity duration-300">
          <div class="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center"><svg class="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg></div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
          <span class="text-accent-500 text-[10px] tracking-wider uppercase font-medium">Music Video</span>
          <h3 class="font-bold text-white mt-1">落日飛車 — Candlelight</h3>
          <p class="text-film-300 text-xs mt-1">4K · 5:12 · 敘事 MV</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- About -->
<section id="about" class="py-24 border-t border-film-800/50">
  <div class="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
    <div class="reveal">
      <div class="aspect-[3/4] bg-gradient-to-br from-film-800 to-film-900 rounded-sm flex items-center justify-center relative overflow-hidden">
        <span class="text-[120px] opacity-60">🎥</span>
        <div class="absolute bottom-6 left-6">
          <p class="text-accent-500 text-sm font-medium">陳昱翔 Rex Chen</p>
          <p class="text-film-500 text-xs">Director / Cinematographer</p>
        </div>
      </div>
    </div>
    <div class="reveal">
      <span class="text-accent-500 text-xs tracking-[0.3em] uppercase font-medium">About</span>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight mt-2 mb-6">關於我</h2>
      <p class="text-film-400 leading-relaxed mb-4">
        十年影像工作經歷。從獨立短片到國際品牌廣告，我相信每一個畫面都應該有意義，每一個故事都值得被好好說。
      </p>
      <p class="text-film-400 leading-relaxed mb-6">
        擅長電影感的敘事手法、自然光影運用，以及後期調色。作品曾入選金馬影展、高雄電影節，並獲得 2024 年 4A 創意獎最佳影片。
      </p>
      <div class="grid grid-cols-3 gap-4 mb-8">
        <div class="text-center p-4 bg-film-900 rounded-sm border border-film-800"><span class="block text-2xl font-bold text-accent-500">150+</span><span class="text-xs text-film-500">完成專案</span></div>
        <div class="text-center p-4 bg-film-900 rounded-sm border border-film-800"><span class="block text-2xl font-bold text-accent-500">12</span><span class="text-xs text-film-500">獎項</span></div>
        <div class="text-center p-4 bg-film-900 rounded-sm border border-film-800"><span class="block text-2xl font-bold text-accent-500">10Y</span><span class="text-xs text-film-500">經驗</span></div>
      </div>
      <div class="flex flex-wrap gap-2">
        <span class="px-3 py-1 bg-film-800 rounded-sm text-xs text-film-300">Sony FX6</span>
        <span class="px-3 py-1 bg-film-800 rounded-sm text-xs text-film-300">RED Komodo</span>
        <span class="px-3 py-1 bg-film-800 rounded-sm text-xs text-film-300">DaVinci Resolve</span>
        <span class="px-3 py-1 bg-film-800 rounded-sm text-xs text-film-300">Premiere Pro</span>
        <span class="px-3 py-1 bg-film-800 rounded-sm text-xs text-film-300">After Effects</span>
        <span class="px-3 py-1 bg-film-800 rounded-sm text-xs text-film-300">DJI Ronin</span>
      </div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-24 border-t border-film-800/50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-accent-500 text-xs tracking-[0.3em] uppercase font-medium">Services</span>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight mt-2">服務項目</h2>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="reveal bg-film-900 border border-film-800 rounded-sm p-6 hover:border-accent-500/30 transition-colors group cursor-pointer">
        <span class="text-3xl block mb-4 group-hover:scale-110 transition-transform">🎬</span>
        <h4 class="font-bold mb-2">品牌影片</h4>
        <p class="text-film-500 text-sm leading-relaxed">企業形象、品牌故事、產品介紹。用電影級畫面傳遞品牌價值。</p>
        <p class="text-accent-500 text-sm font-medium mt-3">NT$ 80,000 起</p>
      </div>
      <div class="reveal bg-film-900 border border-film-800 rounded-sm p-6 hover:border-accent-500/30 transition-colors group cursor-pointer">
        <span class="text-3xl block mb-4 group-hover:scale-110 transition-transform">📺</span>
        <h4 class="font-bold mb-2">廣告 TVC</h4>
        <p class="text-film-500 text-sm leading-relaxed">電視廣告、網路廣告，從概念發想到後期製作一站完成。</p>
        <p class="text-accent-500 text-sm font-medium mt-3">NT$ 150,000 起</p>
      </div>
      <div class="reveal bg-film-900 border border-film-800 rounded-sm p-6 hover:border-accent-500/30 transition-colors group cursor-pointer">
        <span class="text-3xl block mb-4 group-hover:scale-110 transition-transform">🎵</span>
        <h4 class="font-bold mb-2">MV 製作</h4>
        <p class="text-film-500 text-sm leading-relaxed">概念 MV、敘事 MV、現場 Live。為音樂賦予視覺生命。</p>
        <p class="text-accent-500 text-sm font-medium mt-3">NT$ 120,000 起</p>
      </div>
      <div class="reveal bg-film-900 border border-film-800 rounded-sm p-6 hover:border-accent-500/30 transition-colors group cursor-pointer">
        <span class="text-3xl block mb-4 group-hover:scale-110 transition-transform">🎞️</span>
        <h4 class="font-bold mb-2">紀錄片</h4>
        <p class="text-film-500 text-sm leading-relaxed">人物紀錄、文化紀錄、企業紀錄。真實的故事最動人。</p>
        <p class="text-accent-500 text-sm font-medium mt-3">NT$ 200,000 起</p>
      </div>
    </div>
  </div>
</section>

<!-- Clients -->
<section id="clients" class="py-24 border-t border-film-800/50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-accent-500 text-xs tracking-[0.3em] uppercase font-medium">Clients</span>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight mt-2">合作夥伴</h2>
    </div>
    <div class="grid grid-cols-3 md:grid-cols-6 gap-4 reveal">
      <div class="bg-film-900 border border-film-800 rounded-sm p-5 flex items-center justify-center h-20 text-film-500 font-bold text-sm hover:border-film-600 transition-colors">Patagonia</div>
      <div class="bg-film-900 border border-film-800 rounded-sm p-5 flex items-center justify-center h-20 text-film-500 font-bold text-sm hover:border-film-600 transition-colors">% Arabica</div>
      <div class="bg-film-900 border border-film-800 rounded-sm p-5 flex items-center justify-center h-20 text-film-500 font-bold text-sm hover:border-film-600 transition-colors">Luxgen</div>
      <div class="bg-film-900 border border-film-800 rounded-sm p-5 flex items-center justify-center h-20 text-film-500 font-bold text-sm hover:border-film-600 transition-colors">誠品</div>
      <div class="bg-film-900 border border-film-800 rounded-sm p-5 flex items-center justify-center h-20 text-film-500 font-bold text-sm hover:border-film-600 transition-colors">故宮</div>
      <div class="bg-film-900 border border-film-800 rounded-sm p-5 flex items-center justify-center h-20 text-film-500 font-bold text-sm hover:border-film-600 transition-colors">金馬獎</div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-24 border-t border-film-800/50">
  <div class="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16">
    <div class="reveal">
      <span class="text-accent-500 text-xs tracking-[0.3em] uppercase font-medium">Contact</span>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight mt-2 mb-6">聊聊你的專案</h2>
      <p class="text-film-400 leading-relaxed mb-8">無論是品牌影片、MV 還是紀錄片，歡迎與我分享你的想法。好的作品始於一次真誠的對話。</p>
      <div class="space-y-4">
        <div class="flex items-center gap-3"><span class="w-8 h-8 rounded-sm bg-film-800 flex items-center justify-center text-sm">📧</span><span class="text-film-300 text-sm">rex@framehaus.tw</span></div>
        <div class="flex items-center gap-3"><span class="w-8 h-8 rounded-sm bg-film-800 flex items-center justify-center text-sm">📞</span><span class="text-film-300 text-sm">+886 912-345-678</span></div>
        <div class="flex items-center gap-3"><span class="w-8 h-8 rounded-sm bg-film-800 flex items-center justify-center text-sm">📍</span><span class="text-film-300 text-sm">台北市中山區南京東路三段 88 號 5F</span></div>
      </div>
      <div class="flex gap-3 mt-6">
        <a href="#" class="w-9 h-9 rounded-sm bg-film-800 flex items-center justify-center text-film-400 hover:bg-accent-500 hover:text-white transition-colors text-sm">IG</a>
        <a href="#" class="w-9 h-9 rounded-sm bg-film-800 flex items-center justify-center text-film-400 hover:bg-accent-500 hover:text-white transition-colors text-sm">YT</a>
        <a href="#" class="w-9 h-9 rounded-sm bg-film-800 flex items-center justify-center text-film-400 hover:bg-accent-500 hover:text-white transition-colors text-sm">Vi</a>
      </div>
    </div>
    <div class="reveal">
      <div class="bg-film-900 border border-film-800 rounded-sm p-7">
        <h3 class="font-bold text-lg mb-5">專案諮詢</h3>
        <div class="space-y-4">
          <div><label class="text-xs text-film-500 mb-1 block">姓名 / 公司</label><input type="text" placeholder="您的姓名或公司名稱" class="w-full bg-film-800 border border-film-700 rounded-sm px-4 py-2.5 text-sm text-film-200 placeholder-film-600 focus:border-accent-500 outline-none"></div>
          <div><label class="text-xs text-film-500 mb-1 block">Email</label><input type="email" placeholder="you@company.com" class="w-full bg-film-800 border border-film-700 rounded-sm px-4 py-2.5 text-sm text-film-200 placeholder-film-600 focus:border-accent-500 outline-none"></div>
          <div><label class="text-xs text-film-500 mb-1 block">專案類型</label>
            <select class="w-full bg-film-800 border border-film-700 rounded-sm px-4 py-2.5 text-sm text-film-200 focus:border-accent-500 outline-none">
              <option>品牌影片</option><option>廣告 TVC</option><option>MV 製作</option><option>紀錄片</option><option>其他</option>
            </select>
          </div>
          <div><label class="text-xs text-film-500 mb-1 block">預算範圍</label>
            <select class="w-full bg-film-800 border border-film-700 rounded-sm px-4 py-2.5 text-sm text-film-200 focus:border-accent-500 outline-none">
              <option>NT$ 50,000 - 100,000</option><option>NT$ 100,000 - 300,000</option><option>NT$ 300,000 - 500,000</option><option>NT$ 500,000+</option><option>尚未確定</option>
            </select>
          </div>
          <div><label class="text-xs text-film-500 mb-1 block">專案描述</label><textarea rows="3" placeholder="簡述您的專案需求..." class="w-full bg-film-800 border border-film-700 rounded-sm px-4 py-2.5 text-sm text-film-200 placeholder-film-600 focus:border-accent-500 outline-none resize-none"></textarea></div>
          <button onclick="showToast('已收到！我會在 48 小時內回覆 🎬')" class="w-full bg-accent-500 text-white py-3 rounded-sm font-semibold hover:bg-accent-600 transition-colors">送出諮詢</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-film-800/50 py-10">
  <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
    <div class="flex items-center gap-2">
      <div class="w-6 h-6 border-2 border-accent-500 rounded flex items-center justify-center">
        <svg class="w-3 h-3 text-accent-500" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg>
      </div>
      <span class="font-bold text-sm">FRAMEHAUS</span>
    </div>
    <p class="text-film-600 text-xs">© 2026 FRAMEHAUS. All rights reserved.</p>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-accent-500 text-white px-6 py-3 rounded-sm shadow-2xl text-sm font-medium translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"></div>

<script>
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),2500);}
function filterWork(cat){
  document.querySelectorAll('.work-btn').forEach(b=>{b.className='work-btn text-xs px-3 py-1.5 rounded-sm font-medium bg-film-800 text-film-400 hover:text-white';});
  event.target.className='work-btn active text-xs px-3 py-1.5 rounded-sm font-medium bg-accent-500 text-white';
  document.querySelectorAll('.video-card').forEach(c=>{c.style.display=(cat==='all'||c.dataset.cat===cat)?'block':'none';});
}
function openWork(el){showToast('影片播放功能即將上線');}
const obs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:0.15});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',()=>{document.getElementById('mobile-menu').classList.add('hidden');});});
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
