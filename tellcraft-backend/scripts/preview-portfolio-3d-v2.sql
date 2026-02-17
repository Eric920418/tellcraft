INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '79be9580-07a3-4824-b1c9-1013554d57f4',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>維度空間 DimensionLab｜3D Artist Portfolio</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { dim: { 950:'#09090b',900:'#0f0f14',800:'#18181b',700:'#27272a',600:'#3f3f46',500:'#52525b',400:'#71717a' }, cyan: { 400:'#22d3ee',500:'#06b6d4',600:'#0891b2',700:'#0e7490' }, neon: { glow:'#22d3ee' } }, fontFamily: { outfit: ['Outfit','sans-serif'] } } } }
</script>
<style>
* { font-family: 'Outfit', sans-serif; }
body { background: #09090b; color: #e4e4e7; }
.neon-text { text-shadow: 0 0 40px rgba(6,182,212,0.5), 0 0 80px rgba(6,182,212,0.2); }
.neon-border { box-shadow: 0 0 15px rgba(6,182,212,0.15), inset 0 0 15px rgba(6,182,212,0.05); }
.neon-border:hover { box-shadow: 0 0 25px rgba(6,182,212,0.3), inset 0 0 25px rgba(6,182,212,0.1); }
.grid-bg { background-image: linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px); background-size: 50px 50px; }
.card-hover { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
.card-hover:hover { transform: translateY(-6px) scale(1.02); }
.card-hover:hover .card-glow { opacity: 1; }
.card-glow { opacity: 0; transition: opacity 0.4s; }
.portfolio-card { transition: all 0.4s; }
.portfolio-card:hover { transform: translateY(-4px); }
.portfolio-card:hover .port-overlay { opacity: 1; }
.port-overlay { opacity: 0; transition: opacity 0.35s; }
.filter-btn { transition: all 0.25s; }
.filter-btn.active { background: #06b6d4; color: #09090b; border-color: #06b6d4; }
.faq-content { max-height: 0; overflow: hidden; transition: max-height 0.35s ease; }
.faq-content.open { max-height: 200px; }
.faq-icon { transition: transform 0.3s; }
.faq-item.open .faq-icon { transform: rotate(45deg); }
.timeline-dot { width: 14px; height: 14px; border-radius: 50%; background: #06b6d4; box-shadow: 0 0 12px rgba(6,182,212,0.5); }
.tool-badge { transition: all 0.3s; }
.tool-badge:hover { border-color: #06b6d4; box-shadow: 0 0 20px rgba(6,182,212,0.2); transform: translateY(-2px); }
.brand-placeholder { transition: all 0.3s; }
.brand-placeholder:hover { border-color: rgba(6,182,212,0.3); }
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.float-anim { animation: float 4s ease-in-out infinite; }
@keyframes pulse-glow { 0%,100% { box-shadow: 0 0 20px rgba(6,182,212,0.3); } 50% { box-shadow: 0 0 40px rgba(6,182,212,0.6); } }
.pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
</style>
</head>
<body>

<!-- Sticky Nav -->
<nav class="sticky top-0 z-50 bg-dim-950/90 backdrop-blur-xl border-b border-white/5">
  <div class="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-xs font-extrabold text-white tracking-tight pulse-glow">3D</div>
      <span class="font-bold text-lg tracking-tight">Dimension<span class="text-cyan-400">Lab</span></span>
    </div>
    <div class="flex items-center gap-7 text-sm text-zinc-400">
      <a onclick="document.getElementById('works').scrollIntoView({behavior:'smooth'})" class="hover:text-cyan-400 transition cursor-pointer">作品</a>
      <a onclick="document.getElementById('services').scrollIntoView({behavior:'smooth'})" class="hover:text-cyan-400 transition cursor-pointer">服務</a>
      <a onclick="document.getElementById('process').scrollIntoView({behavior:'smooth'})" class="hover:text-cyan-400 transition cursor-pointer">流程</a>
      <a onclick="document.getElementById('tools').scrollIntoView({behavior:'smooth'})" class="hover:text-cyan-400 transition cursor-pointer">工具</a>
      <a onclick="document.getElementById('faq').scrollIntoView({behavior:'smooth'})" class="hover:text-cyan-400 transition cursor-pointer">FAQ</a>
      <button onclick="document.getElementById('contactModal').classList.remove('hidden')" class="border border-cyan-500 text-cyan-400 px-5 py-2 rounded-full text-sm hover:bg-cyan-500 hover:text-dim-950 transition font-medium cursor-pointer">合作邀約</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="min-h-[92vh] flex items-center relative overflow-hidden grid-bg">
  <div class="absolute top-16 right-16 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[140px]"></div>
  <div class="absolute bottom-0 left-10 w-[350px] h-[350px] bg-violet-600/6 rounded-full blur-[100px]"></div>
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-cyan-400/5 rounded-full blur-[60px]"></div>
  <div class="max-w-7xl mx-auto px-6 relative flex items-center gap-16 w-full">
    <div class="flex-1 max-w-2xl">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-6">
        <div class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
        <span class="text-xs text-cyan-400 tracking-widest uppercase font-medium">3D Artist &amp; Creative Director</span>
      </div>
      <h1 class="text-6xl font-extrabold leading-tight mb-6">
        <span class="neon-text">創造超越想像</span><br>
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600">的維度</span>
      </h1>
      <p class="text-zinc-400 text-lg leading-relaxed mb-10 max-w-lg">專注於高端 3D 視覺創作——角色設計、場景建模、產品渲染與動態影像。將每一個像素打磨成超現實的藝術品，為品牌注入未來感。</p>
      <div class="flex gap-4 mb-12">
        <button onclick="document.getElementById('works').scrollIntoView({behavior:'smooth'})" class="bg-gradient-to-r from-cyan-500 to-cyan-600 text-dim-950 px-8 py-3.5 rounded-full font-bold text-sm hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition cursor-pointer">探索作品集</button>
        <button onclick="document.getElementById('contactModal').classList.remove('hidden')" class="border border-white/15 text-white px-8 py-3.5 rounded-full font-medium text-sm hover:border-cyan-500/40 hover:text-cyan-400 transition cursor-pointer">開始合作 &rarr;</button>
      </div>
    </div>
    <div class="w-80 h-80 relative float-anim hidden lg:block">
      <div class="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-violet-600/10 border border-cyan-500/10 flex items-center justify-center text-8xl neon-border">
        <span>🎨</span>
      </div>
      <div class="absolute -bottom-4 -right-4 w-24 h-24 rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-500/10 border border-violet-500/10 flex items-center justify-center text-3xl">💎</div>
    </div>
  </div>
</section>

<!-- Stats -->
<section class="border-y border-white/5 bg-dim-900/50">
  <div class="max-w-7xl mx-auto px-6 py-10">
    <div class="grid grid-cols-4 gap-8">
      <div class="text-center">
        <div class="text-4xl font-extrabold text-white mb-1">150<span class="text-cyan-400">+</span></div>
        <div class="text-sm text-zinc-500">完成專案</div>
      </div>
      <div class="text-center">
        <div class="text-4xl font-extrabold text-white mb-1">50<span class="text-cyan-400">+</span></div>
        <div class="text-sm text-zinc-500">合作客戶</div>
      </div>
      <div class="text-center">
        <div class="text-4xl font-extrabold text-white mb-1">8<span class="text-cyan-400">年</span></div>
        <div class="text-sm text-zinc-500">業界經驗</div>
      </div>
      <div class="text-center">
        <div class="text-4xl font-extrabold text-white mb-1">15<span class="text-cyan-400">+</span></div>
        <div class="text-sm text-zinc-500">國際獎項</div>
      </div>
    </div>
  </div>
</section>

<!-- Portfolio -->
<section id="works" class="py-20">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex items-end justify-between mb-10">
      <div>
        <span class="text-xs text-cyan-400 tracking-widest uppercase font-medium">Portfolio</span>
        <h2 class="text-3xl font-bold mt-2">精選作品</h2>
      </div>
      <div class="flex gap-2">
        <button onclick="filterPortfolio(this,'all')" class="filter-btn active px-4 py-1.5 rounded-full border border-cyan-500 text-sm font-medium cursor-pointer">全部</button>
        <button onclick="filterPortfolio(this,'character')" class="filter-btn px-4 py-1.5 rounded-full border border-white/10 text-zinc-400 text-sm cursor-pointer">角色</button>
        <button onclick="filterPortfolio(this,'scene')" class="filter-btn px-4 py-1.5 rounded-full border border-white/10 text-zinc-400 text-sm cursor-pointer">場景</button>
        <button onclick="filterPortfolio(this,'product')" class="filter-btn px-4 py-1.5 rounded-full border border-white/10 text-zinc-400 text-sm cursor-pointer">產品</button>
        <button onclick="filterPortfolio(this,'motion')" class="filter-btn px-4 py-1.5 rounded-full border border-white/10 text-zinc-400 text-sm cursor-pointer">動態</button>
      </div>
    </div>
    <div class="grid grid-cols-4 gap-5" id="portfolioGrid">
      <!-- Card 1 -->
      <div class="portfolio-card rounded-2xl overflow-hidden relative aspect-[4/3] bg-gradient-to-br from-violet-900 to-indigo-800 flex items-center justify-center text-6xl border border-white/5" data-category="character">
        <span>🤖</span>
        <div class="port-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-5">
          <div>
            <span class="inline-block px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-medium mb-1.5">角色</span>
            <h3 class="font-bold text-sm">賽博機甲戰士</h3>
            <p class="text-[11px] text-zinc-400 mt-0.5">客戶：Bandai Namco</p>
          </div>
        </div>
      </div>
      <!-- Card 2 -->
      <div class="portfolio-card rounded-2xl overflow-hidden relative aspect-[4/3] bg-gradient-to-br from-cyan-900 to-teal-800 flex items-center justify-center text-6xl border border-white/5" data-category="scene">
        <span>🏙️</span>
        <div class="port-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-5">
          <div>
            <span class="inline-block px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-medium mb-1.5">場景</span>
            <h3 class="font-bold text-sm">霓虹都市 2077</h3>
            <p class="text-[11px] text-zinc-400 mt-0.5">客戶：Sony Interactive</p>
          </div>
        </div>
      </div>
      <!-- Card 3 -->
      <div class="portfolio-card rounded-2xl overflow-hidden relative aspect-[4/3] bg-gradient-to-br from-amber-900 to-orange-800 flex items-center justify-center text-6xl border border-white/5" data-category="product">
        <span>👟</span>
        <div class="port-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-5">
          <div>
            <span class="inline-block px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-medium mb-1.5">產品</span>
            <h3 class="font-bold text-sm">Nike Air Max 解構</h3>
            <p class="text-[11px] text-zinc-400 mt-0.5">客戶：Nike Greater China</p>
          </div>
        </div>
      </div>
      <!-- Card 4 -->
      <div class="portfolio-card rounded-2xl overflow-hidden relative aspect-[4/3] bg-gradient-to-br from-rose-900 to-pink-800 flex items-center justify-center text-6xl border border-white/5" data-category="motion">
        <span>🎬</span>
        <div class="port-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-5">
          <div>
            <span class="inline-block px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-medium mb-1.5">動態</span>
            <h3 class="font-bold text-sm">品牌識別動畫</h3>
            <p class="text-[11px] text-zinc-400 mt-0.5">客戶：ASUS ROG</p>
          </div>
        </div>
      </div>
      <!-- Card 5 -->
      <div class="portfolio-card rounded-2xl overflow-hidden relative aspect-[4/3] bg-gradient-to-br from-emerald-900 to-green-800 flex items-center justify-center text-6xl border border-white/5" data-category="character">
        <span>🧝</span>
        <div class="port-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-5">
          <div>
            <span class="inline-block px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-medium mb-1.5">角色</span>
            <h3 class="font-bold text-sm">奇幻精靈族長</h3>
            <p class="text-[11px] text-zinc-400 mt-0.5">客戶：miHoYo</p>
          </div>
        </div>
      </div>
      <!-- Card 6 -->
      <div class="portfolio-card rounded-2xl overflow-hidden relative aspect-[4/3] bg-gradient-to-br from-blue-900 to-sky-800 flex items-center justify-center text-6xl border border-white/5" data-category="scene">
        <span>🌌</span>
        <div class="port-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-5">
          <div>
            <span class="inline-block px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-medium mb-1.5">場景</span>
            <h3 class="font-bold text-sm">深空太空站</h3>
            <p class="text-[11px] text-zinc-400 mt-0.5">客戶：CNSA 宣傳片</p>
          </div>
        </div>
      </div>
      <!-- Card 7 -->
      <div class="portfolio-card rounded-2xl overflow-hidden relative aspect-[4/3] bg-gradient-to-br from-purple-900 to-fuchsia-800 flex items-center justify-center text-6xl border border-white/5" data-category="product">
        <span>🎧</span>
        <div class="port-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-5">
          <div>
            <span class="inline-block px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-medium mb-1.5">產品</span>
            <h3 class="font-bold text-sm">Sony WH-1000XM6</h3>
            <p class="text-[11px] text-zinc-400 mt-0.5">客戶：Sony Taiwan</p>
          </div>
        </div>
      </div>
      <!-- Card 8 -->
      <div class="portfolio-card rounded-2xl overflow-hidden relative aspect-[4/3] bg-gradient-to-br from-red-900 to-rose-800 flex items-center justify-center text-6xl border border-white/5" data-category="motion">
        <span>🚗</span>
        <div class="port-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-5">
          <div>
            <span class="inline-block px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-medium mb-1.5">動態</span>
            <h3 class="font-bold text-sm">Porsche Turbo S 動態廣告</h3>
            <p class="text-[11px] text-zinc-400 mt-0.5">客戶：Porsche Asia</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-20 border-t border-white/5">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-14">
      <span class="text-xs text-cyan-400 tracking-widest uppercase font-medium">Services</span>
      <h2 class="text-3xl font-bold mt-2">服務項目</h2>
      <p class="text-zinc-500 mt-3 max-w-lg mx-auto">從概念到成品，提供全方位 3D 視覺解決方案</p>
    </div>
    <div class="grid grid-cols-4 gap-6">
      <div class="card-hover bg-dim-900 border border-white/5 rounded-2xl p-7 relative overflow-hidden">
        <div class="card-glow absolute inset-0 border-2 border-cyan-500/30 rounded-2xl"></div>
        <div class="relative">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 flex items-center justify-center text-3xl mb-5">🤖</div>
          <h3 class="font-bold text-lg mb-2">3D 角色設計</h3>
          <p class="text-zinc-500 text-sm leading-relaxed mb-5">從概念草圖到高精度角色模型。涵蓋遊戲角色、虛擬 IP、NFT 數位藝術，支援即時渲染與動畫綁定。</p>
          <div class="flex items-center justify-between pt-4 border-t border-white/5">
            <span class="text-xs text-zinc-500">起始價格</span>
            <span class="text-cyan-400 font-bold">NT$ 80,000 起</span>
          </div>
        </div>
      </div>
      <div class="card-hover bg-dim-900 border border-white/5 rounded-2xl p-7 relative overflow-hidden">
        <div class="card-glow absolute inset-0 border-2 border-cyan-500/30 rounded-2xl"></div>
        <div class="relative">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/5 flex items-center justify-center text-3xl mb-5">🏔️</div>
          <h3 class="font-bold text-lg mb-2">場景建模</h3>
          <p class="text-zinc-500 text-sm leading-relaxed mb-5">打造沉浸式 3D 場景與環境。建築視覺化、遊戲場景、虛擬展廳，結合光影與氛圍營造超現實空間。</p>
          <div class="flex items-center justify-between pt-4 border-t border-white/5">
            <span class="text-xs text-zinc-500">起始價格</span>
            <span class="text-cyan-400 font-bold">NT$ 120,000 起</span>
          </div>
        </div>
      </div>
      <div class="card-hover bg-dim-900 border border-white/5 rounded-2xl p-7 relative overflow-hidden">
        <div class="card-glow absolute inset-0 border-2 border-cyan-500/30 rounded-2xl"></div>
        <div class="relative">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 flex items-center justify-center text-3xl mb-5">💎</div>
          <h3 class="font-bold text-lg mb-2">產品視覺化</h3>
          <p class="text-zinc-500 text-sm leading-relaxed mb-5">高品質產品 3D 渲染與互動展示。電商視覺、廣告素材、AR 預覽，讓產品在數位世界中完美呈現。</p>
          <div class="flex items-center justify-between pt-4 border-t border-white/5">
            <span class="text-xs text-zinc-500">起始價格</span>
            <span class="text-cyan-400 font-bold">NT$ 50,000 起</span>
          </div>
        </div>
      </div>
      <div class="card-hover bg-dim-900 border border-white/5 rounded-2xl p-7 relative overflow-hidden">
        <div class="card-glow absolute inset-0 border-2 border-cyan-500/30 rounded-2xl"></div>
        <div class="relative">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/5 flex items-center justify-center text-3xl mb-5">🎬</div>
          <h3 class="font-bold text-lg mb-2">動態影片</h3>
          <p class="text-zinc-500 text-sm leading-relaxed mb-5">3D 動畫與動態圖形製作。品牌廣告、產品動畫、MV 視覺特效、展演影像，從腳本到後期一條龍服務。</p>
          <div class="flex items-center justify-between pt-4 border-t border-white/5">
            <span class="text-xs text-zinc-500">起始價格</span>
            <span class="text-cyan-400 font-bold">NT$ 150,000 起</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Workflow -->
<section id="process" class="py-20 bg-dim-900/50 border-y border-white/5">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-xs text-cyan-400 tracking-widest uppercase font-medium">Workflow</span>
      <h2 class="text-3xl font-bold mt-2">工作流程</h2>
      <p class="text-zinc-500 mt-3">從一個想法到最終交付，每一步都精準掌控</p>
    </div>
    <div class="relative">
      <!-- Timeline line -->
      <div class="absolute top-7 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
      <div class="grid grid-cols-5 gap-6 relative">
        <div class="text-center">
          <div class="timeline-dot mx-auto mb-5 relative z-10"></div>
          <div class="bg-dim-900 border border-white/5 rounded-xl p-5 neon-border">
            <div class="text-cyan-400 font-bold text-xs mb-2">STEP 01</div>
            <h4 class="font-bold text-sm mb-1.5">需求討論</h4>
            <p class="text-[11px] text-zinc-500 leading-relaxed">深入了解專案目標、風格偏好、預算與交付時程</p>
          </div>
        </div>
        <div class="text-center">
          <div class="timeline-dot mx-auto mb-5 relative z-10"></div>
          <div class="bg-dim-900 border border-white/5 rounded-xl p-5 neon-border">
            <div class="text-cyan-400 font-bold text-xs mb-2">STEP 02</div>
            <h4 class="font-bold text-sm mb-1.5">概念設計</h4>
            <p class="text-[11px] text-zinc-500 leading-relaxed">提供 2-3 套視覺概念草圖與情緒板供選擇確認</p>
          </div>
        </div>
        <div class="text-center">
          <div class="timeline-dot mx-auto mb-5 relative z-10"></div>
          <div class="bg-dim-900 border border-white/5 rounded-xl p-5 neon-border">
            <div class="text-cyan-400 font-bold text-xs mb-2">STEP 03</div>
            <h4 class="font-bold text-sm mb-1.5">3D 建模</h4>
            <p class="text-[11px] text-zinc-500 leading-relaxed">精細建模、拓撲優化，中期呈現灰模供確認結構</p>
          </div>
        </div>
        <div class="text-center">
          <div class="timeline-dot mx-auto mb-5 relative z-10"></div>
          <div class="bg-dim-900 border border-white/5 rounded-xl p-5 neon-border">
            <div class="text-cyan-400 font-bold text-xs mb-2">STEP 04</div>
            <h4 class="font-bold text-sm mb-1.5">材質渲染</h4>
            <p class="text-[11px] text-zinc-500 leading-relaxed">PBR 材質繪製、光影設置、高品質算圖輸出</p>
          </div>
        </div>
        <div class="text-center">
          <div class="timeline-dot mx-auto mb-5 relative z-10"></div>
          <div class="bg-dim-900 border border-white/5 rounded-xl p-5 neon-border">
            <div class="text-cyan-400 font-bold text-xs mb-2">STEP 05</div>
            <h4 class="font-bold text-sm mb-1.5">交付修改</h4>
            <p class="text-[11px] text-zinc-500 leading-relaxed">含 2 輪修改、多格式交付（PSD/PNG/GLB/MP4）</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Tools -->
<section id="tools" class="py-20">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs text-cyan-400 tracking-widest uppercase font-medium">Tech Stack</span>
      <h2 class="text-3xl font-bold mt-2">使用工具</h2>
    </div>
    <div class="grid grid-cols-6 gap-4">
      <div class="tool-badge bg-dim-900 border border-white/5 rounded-xl p-5 text-center">
        <div class="text-3xl mb-2">🟠</div>
        <div class="font-bold text-sm">Blender</div>
        <div class="text-[10px] text-zinc-500 mt-1">建模 / 動畫</div>
      </div>
      <div class="tool-badge bg-dim-900 border border-white/5 rounded-xl p-5 text-center">
        <div class="text-3xl mb-2">🔷</div>
        <div class="font-bold text-sm">Maya</div>
        <div class="text-[10px] text-zinc-500 mt-1">角色 / 綁定</div>
      </div>
      <div class="tool-badge bg-dim-900 border border-white/5 rounded-xl p-5 text-center">
        <div class="text-3xl mb-2">🪨</div>
        <div class="font-bold text-sm">ZBrush</div>
        <div class="text-[10px] text-zinc-500 mt-1">雕刻 / 細節</div>
      </div>
      <div class="tool-badge bg-dim-900 border border-white/5 rounded-xl p-5 text-center">
        <div class="text-3xl mb-2">🎨</div>
        <div class="font-bold text-sm">Substance</div>
        <div class="text-[10px] text-zinc-500 mt-1">材質 / 貼圖</div>
      </div>
      <div class="tool-badge bg-dim-900 border border-white/5 rounded-xl p-5 text-center">
        <div class="text-3xl mb-2">🎮</div>
        <div class="font-bold text-sm">Unreal Engine</div>
        <div class="text-[10px] text-zinc-500 mt-1">即時渲染</div>
      </div>
      <div class="tool-badge bg-dim-900 border border-white/5 rounded-xl p-5 text-center">
        <div class="text-3xl mb-2">🎬</div>
        <div class="font-bold text-sm">After Effects</div>
        <div class="text-[10px] text-zinc-500 mt-1">合成 / 後期</div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="py-20 border-t border-white/5 bg-dim-900/30">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs text-cyan-400 tracking-widest uppercase font-medium">Testimonials</span>
      <h2 class="text-3xl font-bold mt-2">客戶好評</h2>
    </div>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-dim-900 border border-white/5 rounded-2xl p-7 neon-border">
        <div class="flex items-center gap-1 mb-4 text-cyan-400 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="text-zinc-400 text-sm leading-relaxed mb-6">&ldquo;DimensionLab 的作品完全超出預期。角色模型的細節精緻到令人驚嘆，動畫流暢度堪比 3A 遊戲水準。團隊溝通非常有效率，絕對會再次合作。&rdquo;</p>
        <div class="flex items-center gap-3 pt-4 border-t border-white/5">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-bold">陳</div>
          <div>
            <div class="text-sm font-medium">陳彥霖</div>
            <div class="text-[11px] text-zinc-500">miHoYo 台灣 / 美術總監</div>
          </div>
        </div>
      </div>
      <div class="bg-dim-900 border border-white/5 rounded-2xl p-7 neon-border">
        <div class="flex items-center gap-1 mb-4 text-cyan-400 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="text-zinc-400 text-sm leading-relaxed mb-6">&ldquo;產品渲染品質極高，Nike 總部直接採用作為全球素材。從溝通、建模到最終交付，每一步都非常專業。推薦給任何需要頂級 3D 視覺的品牌。&rdquo;</p>
        <div class="flex items-center gap-3 pt-4 border-t border-white/5">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-bold">林</div>
          <div>
            <div class="text-sm font-medium">林佩珊</div>
            <div class="text-[11px] text-zinc-500">Nike Greater China / 行銷經理</div>
          </div>
        </div>
      </div>
      <div class="bg-dim-900 border border-white/5 rounded-2xl p-7 neon-border">
        <div class="flex items-center gap-1 mb-4 text-cyan-400 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="text-zinc-400 text-sm leading-relaxed mb-6">&ldquo;合作拍攝的 Porsche 動態廣告在 YouTube 獲得超過 500 萬觀看次數。光影和動態效果非常有電影感，完美詮釋了品牌的速度與精準。&rdquo;</p>
        <div class="flex items-center gap-3 pt-4 border-t border-white/5">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-sm font-bold">張</div>
          <div>
            <div class="text-sm font-medium">張智翔</div>
            <div class="text-[11px] text-zinc-500">Porsche Asia / 品牌公關</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Partner Brands -->
<section class="py-16 border-t border-white/5">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-10">
      <span class="text-xs text-cyan-400 tracking-widest uppercase font-medium">Trusted By</span>
      <h2 class="text-xl font-bold mt-2 text-zinc-400">合作品牌</h2>
    </div>
    <div class="grid grid-cols-6 gap-5">
      <div class="brand-placeholder h-20 rounded-xl border border-white/5 bg-dim-900/50 flex items-center justify-center text-zinc-600 font-bold text-sm tracking-wider">SONY</div>
      <div class="brand-placeholder h-20 rounded-xl border border-white/5 bg-dim-900/50 flex items-center justify-center text-zinc-600 font-bold text-sm tracking-wider">NIKE</div>
      <div class="brand-placeholder h-20 rounded-xl border border-white/5 bg-dim-900/50 flex items-center justify-center text-zinc-600 font-bold text-sm tracking-wider">PORSCHE</div>
      <div class="brand-placeholder h-20 rounded-xl border border-white/5 bg-dim-900/50 flex items-center justify-center text-zinc-600 font-bold text-sm tracking-wider">ASUS</div>
      <div class="brand-placeholder h-20 rounded-xl border border-white/5 bg-dim-900/50 flex items-center justify-center text-zinc-600 font-bold text-sm tracking-wider">miHoYo</div>
      <div class="brand-placeholder h-20 rounded-xl border border-white/5 bg-dim-900/50 flex items-center justify-center text-zinc-600 font-bold text-sm tracking-wider">CNSA</div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section id="faq" class="py-20 border-t border-white/5">
  <div class="max-w-3xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs text-cyan-400 tracking-widest uppercase font-medium">FAQ</span>
      <h2 class="text-3xl font-bold mt-2">常見問題</h2>
    </div>
    <div class="space-y-3">
      <div class="faq-item bg-dim-900 border border-white/5 rounded-xl overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left cursor-pointer">
          <span class="font-medium text-sm">一個 3D 專案通常需要多長時間？</span>
          <span class="faq-icon text-cyan-400 text-xl font-light">+</span>
        </button>
        <div class="faq-content px-5">
          <p class="text-sm text-zinc-400 leading-relaxed pb-5">依據專案複雜度而定。簡單的產品渲染約 1-2 週；角色設計含動畫約 3-6 週；大型場景或影片專案約 6-12 週。初次諮詢時會提供精確的時程規劃。</p>
        </div>
      </div>
      <div class="faq-item bg-dim-900 border border-white/5 rounded-xl overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left cursor-pointer">
          <span class="font-medium text-sm">可以提供哪些格式的檔案交付？</span>
          <span class="faq-icon text-cyan-400 text-xl font-light">+</span>
        </button>
        <div class="faq-content px-5">
          <p class="text-sm text-zinc-400 leading-relaxed pb-5">靜態渲染支援 PNG、TIFF、PSD、EXR；3D 模型支援 FBX、OBJ、GLB/GLTF、USD；動畫影片支援 MP4、MOV、ProRes。亦可依客戶需求提供特定格式。</p>
        </div>
      </div>
      <div class="faq-item bg-dim-900 border border-white/5 rounded-xl overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left cursor-pointer">
          <span class="font-medium text-sm">修改次數有限制嗎？</span>
          <span class="faq-icon text-cyan-400 text-xl font-light">+</span>
        </button>
        <div class="faq-content px-5">
          <p class="text-sm text-zinc-400 leading-relaxed pb-5">標準方案包含 2 輪修改。概念階段的大方向調整不計入修改次數。若需額外修改，我們會提前溝通費用。長期合作客戶享有更彈性的修改機制。</p>
        </div>
      </div>
      <div class="faq-item bg-dim-900 border border-white/5 rounded-xl overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left cursor-pointer">
          <span class="font-medium text-sm">如何開始第一個合作專案？</span>
          <span class="faq-icon text-cyan-400 text-xl font-light">+</span>
        </button>
        <div class="faq-content px-5">
          <p class="text-sm text-zinc-400 leading-relaxed pb-5">點擊頁面上的「合作邀約」按鈕填寫基本資訊，或直接來信 hello@dimensionlab.tw。我們會在 1-2 個工作天內回覆，安排免費線上諮詢，了解您的需求後提供正式報價。</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Contact CTA -->
<section class="py-20 relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-violet-600/10"></div>
  <div class="absolute top-0 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px]"></div>
  <div class="max-w-3xl mx-auto px-6 text-center relative">
    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-6">
      <div class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
      <span class="text-xs text-cyan-400 font-medium">目前接案中</span>
    </div>
    <h2 class="text-4xl font-extrabold mb-4">有想法？<span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600">讓我們實現它</span></h2>
    <p class="text-zinc-400 mb-8 max-w-md mx-auto">無論是產品視覺化、角色設計、場景建模或動態影片，歡迎聊聊你的專案構想。</p>
    <button onclick="document.getElementById('contactModal').classList.remove('hidden')" class="bg-gradient-to-r from-cyan-500 to-cyan-600 text-dim-950 px-10 py-4 rounded-full font-bold text-base hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition cursor-pointer">開始合作邀約 &rarr;</button>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-white/5 bg-dim-950">
  <div class="max-w-7xl mx-auto px-6 py-12">
    <div class="flex items-start justify-between mb-10">
      <div>
        <div class="flex items-center gap-3 mb-4">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-xs font-extrabold text-white">3D</div>
          <span class="font-bold text-lg">Dimension<span class="text-cyan-400">Lab</span></span>
        </div>
        <p class="text-sm text-zinc-500 max-w-xs leading-relaxed">專注於高端 3D 視覺創作，用像素構建想像力的維度。</p>
      </div>
      <div class="flex gap-16">
        <div>
          <h4 class="font-bold text-sm mb-3 text-zinc-300">快速連結</h4>
          <div class="space-y-2 text-sm text-zinc-500">
            <div><a onclick="document.getElementById('works').scrollIntoView({behavior:'smooth'})" class="hover:text-cyan-400 transition cursor-pointer">作品集</a></div>
            <div><a onclick="document.getElementById('services').scrollIntoView({behavior:'smooth'})" class="hover:text-cyan-400 transition cursor-pointer">服務項目</a></div>
            <div><a onclick="document.getElementById('process').scrollIntoView({behavior:'smooth'})" class="hover:text-cyan-400 transition cursor-pointer">工作流程</a></div>
            <div><a onclick="document.getElementById('faq').scrollIntoView({behavior:'smooth'})" class="hover:text-cyan-400 transition cursor-pointer">常見問題</a></div>
          </div>
        </div>
        <div>
          <h4 class="font-bold text-sm mb-3 text-zinc-300">社群平台</h4>
          <div class="space-y-2 text-sm text-zinc-500">
            <div><a class="hover:text-cyan-400 transition cursor-pointer">ArtStation</a></div>
            <div><a class="hover:text-cyan-400 transition cursor-pointer">Behance</a></div>
            <div><a class="hover:text-cyan-400 transition cursor-pointer">Instagram</a></div>
            <div><a class="hover:text-cyan-400 transition cursor-pointer">YouTube</a></div>
          </div>
        </div>
        <div>
          <h4 class="font-bold text-sm mb-3 text-zinc-300">聯絡方式</h4>
          <div class="space-y-2 text-sm text-zinc-500">
            <div>hello@dimensionlab.tw</div>
            <div>+886 2 2771-0000</div>
            <div>台北市大安區敦化南路一段</div>
          </div>
        </div>
      </div>
    </div>
    <div class="border-t border-white/5 pt-6 flex items-center justify-between text-xs text-zinc-600">
      <span>&copy; 2026 DimensionLab 維度空間. All rights reserved.</span>
      <div class="flex gap-4">
        <a class="hover:text-zinc-400 cursor-pointer">隱私政策</a>
        <a class="hover:text-zinc-400 cursor-pointer">服務條款</a>
      </div>
    </div>
  </div>
</footer>

<!-- Contact Modal -->
<div id="contactModal" class="hidden fixed inset-0 z-50 flex items-center justify-center">
  <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="closeContactModal()"></div>
  <div class="relative bg-dim-900 border border-white/10 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl" id="contactFormContainer">
    <button onclick="closeContactModal()" class="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer text-lg transition">&#10005;</button>
    <!-- Form View -->
    <div id="contactForm">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-[10px] font-extrabold text-white">3D</div>
        <h3 class="font-bold text-xl">合作邀約</h3>
      </div>
      <p class="text-xs text-zinc-500 mb-6 ml-11">填寫基本資訊，我們會在 1-2 個工作天內回覆</p>
      <div class="space-y-3">
        <input type="text" placeholder="您的姓名 *" class="w-full px-4 py-3 rounded-xl bg-dim-800 border border-white/5 text-sm outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition placeholder-zinc-600">
        <input type="email" placeholder="Email *" class="w-full px-4 py-3 rounded-xl bg-dim-800 border border-white/5 text-sm outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition placeholder-zinc-600">
        <select class="w-full px-4 py-3 rounded-xl bg-dim-800 border border-white/5 text-sm text-zinc-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition">
          <option>選擇專案類型</option>
          <option>3D 角色設計</option>
          <option>場景建模</option>
          <option>產品視覺化</option>
          <option>動態影片</option>
          <option>其他</option>
        </select>
        <select class="w-full px-4 py-3 rounded-xl bg-dim-800 border border-white/5 text-sm text-zinc-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition">
          <option>預算範圍</option>
          <option>NT$ 50,000 以下</option>
          <option>NT$ 50,000 - 150,000</option>
          <option>NT$ 150,000 - 500,000</option>
          <option>NT$ 500,000 以上</option>
          <option>待討論</option>
        </select>
        <textarea placeholder="請簡述您的專案需求與期望..." rows="3" class="w-full px-4 py-3 rounded-xl bg-dim-800 border border-white/5 text-sm outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition resize-none placeholder-zinc-600"></textarea>
        <button onclick="submitContact()" class="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-dim-950 py-3.5 rounded-xl font-bold text-sm hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition cursor-pointer">送出邀約</button>
      </div>
    </div>
    <!-- Success View -->
    <div id="contactSuccess" class="hidden text-center py-8">
      <div class="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-5 text-3xl">&#10003;</div>
      <h3 class="font-bold text-xl mb-2">邀約已送出！</h3>
      <p class="text-sm text-zinc-400 leading-relaxed">感謝您的合作邀約，我們會在 1-2 個工作天內<br>透過 Email 與您聯繫。</p>
      <button onclick="closeContactModal()" class="mt-6 px-8 py-2.5 rounded-full border border-white/10 text-sm text-zinc-300 hover:border-cyan-500/30 transition cursor-pointer">關閉</button>
    </div>
  </div>
</div>

<script>
// Portfolio filter
function filterPortfolio(btn, category) {
  document.querySelectorAll('.filter-btn').forEach(function(b) {
    b.classList.remove('active');
    b.style.borderColor = '';
    b.style.color = '';
  });
  btn.classList.add('active');
  document.querySelectorAll('[data-category]').forEach(function(card) {
    if (category === 'all' || card.dataset.category === category) {
      card.style.display = '';
      card.style.opacity = '1';
      card.style.transform = 'scale(1)';
    } else {
      card.style.display = 'none';
    }
  });
}

// FAQ accordion
function toggleFaq(btn) {
  var item = btn.parentElement;
  var content = item.querySelector('.faq-content');
  var isOpen = item.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-item').forEach(function(fi) {
    fi.classList.remove('open');
    fi.querySelector('.faq-content').classList.remove('open');
  });
  // Open clicked if was closed
  if (!isOpen) {
    item.classList.add('open');
    content.classList.add('open');
  }
}

// Contact modal
function submitContact() {
  document.getElementById('contactForm').classList.add('hidden');
  document.getElementById('contactSuccess').classList.remove('hidden');
}

function closeContactModal() {
  document.getElementById('contactModal').classList.add('hidden');
  // Reset form after close
  setTimeout(function() {
    document.getElementById('contactForm').classList.remove('hidden');
    document.getElementById('contactSuccess').classList.add('hidden');
  }, 300);
}

// Smooth scroll for nav links (keyboard accessibility)
document.querySelectorAll('a[onclick]').forEach(function(link) {
  link.setAttribute('role', 'button');
  link.setAttribute('tabindex', '0');
  link.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      link.click();
    }
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
