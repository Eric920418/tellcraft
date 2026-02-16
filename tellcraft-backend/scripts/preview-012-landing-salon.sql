INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '82d6c3f8-7d80-4809-9e90-4115d131d283',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LUEUR 璐兒美學沙龍</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        blush: { 50:'#fdf5f3', 100:'#fce8e3', 200:'#f9d2c9', 400:'#e8977f', 500:'#d97760' },
        gold: { 200:'#f0deb4', 300:'#e6cf96', 400:'#d4b36d', 500:'#c49a4a', DEFAULT:'#c49a4a' },
        cream: { 50:'#fdfbf7', 100:'#f9f3ea', 200:'#f0e5d4' },
        charcoal: { 700:'#3d3532', 800:'#2d2724', 900:'#1f1b19' }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['"Noto Sans TC"', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Noto Sans TC', sans-serif; color: #3d3532; background: #fdfbf7; }

  .reveal { opacity:0; transform:translateY(24px); transition: all 0.8s cubic-bezier(0.22,1,0.36,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }

  .toast {
    position:fixed; bottom:2rem; right:2rem; background:#c49a4a; color:#fff;
    padding:0.875rem 1.5rem; border-radius:12px; font-size:0.9rem; font-weight:500;
    z-index:9999; transform:translateY(120%); opacity:0;
    transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
    box-shadow: 0 8px 32px rgba(196,154,74,0.3);
  }
  .toast.show { transform:translateY(0); opacity:1; }

  .service-item { transition: all 0.3s ease; }
  .service-item:hover { background: #f9f3ea; }

  .team-card { transition: all 0.3s ease; }
  .team-card:hover { transform: translateY(-4px); }
  .team-card:hover .team-overlay { opacity: 1; }
  .team-overlay { opacity: 0; transition: opacity 0.3s ease; }

  .gallery-img { transition: all 0.4s ease; cursor: pointer; }
  .gallery-img:hover { transform: scale(1.03); }

  .nav-scrolled {
    background: rgba(253,251,247,0.97) !important;
    box-shadow: 0 2px 20px rgba(0,0,0,0.04);
  }

  .gold-line {
    width: 40px; height: 1px; background: linear-gradient(90deg, transparent, #c49a4a, transparent);
  }

  .tab-btn.active {
    color: #c49a4a;
    border-bottom-color: #c49a4a;
  }
</style>
</head>
<body>

<div id="toast" class="toast"></div>

<!-- Navigation -->
<nav id="navbar" class="fixed top-0 w-full z-50 bg-cream-50/80 backdrop-blur-md transition-all duration-300">
  <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2">
      <span class="font-serif text-2xl font-bold text-charcoal-800 tracking-wider">LUEUR</span>
      <span class="text-[10px] text-gold-400 tracking-[0.15em] mt-1">璐兒美學</span>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#services" class="text-sm text-charcoal-700/60 hover:text-gold-500 transition-colors">服務項目</a>
      <a href="#team" class="text-sm text-charcoal-700/60 hover:text-gold-500 transition-colors">設計師團隊</a>
      <a href="#gallery" class="text-sm text-charcoal-700/60 hover:text-gold-500 transition-colors">作品集</a>
      <a href="#testimonials" class="text-sm text-charcoal-700/60 hover:text-gold-500 transition-colors">顧客評價</a>
      <button onclick="scrollTo('booking')" class="bg-charcoal-800 hover:bg-charcoal-900 text-cream-50 px-6 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer">
        線上預約
      </button>
    </div>
    <button onclick="toggleMobile()" class="md:hidden w-10 h-10 flex items-center justify-center cursor-pointer">
      <svg class="w-6 h-6 text-charcoal-800" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div id="mobileMenu" class="hidden md:hidden bg-cream-50 border-t border-cream-200 px-6 pb-6">
    <div class="flex flex-col gap-1 pt-4">
      <a href="#services" onclick="closeMobile()" class="py-3 text-charcoal-700">服務項目</a>
      <a href="#team" onclick="closeMobile()" class="py-3 text-charcoal-700">設計師團隊</a>
      <a href="#gallery" onclick="closeMobile()" class="py-3 text-charcoal-700">作品集</a>
      <a href="#testimonials" onclick="closeMobile()" class="py-3 text-charcoal-700">顧客評價</a>
      <button onclick="scrollTo('booking');closeMobile()" class="mt-2 bg-charcoal-800 text-cream-50 py-3 rounded-full font-medium cursor-pointer">線上預約</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="relative pt-20 overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-cream-50 via-blush-50 to-cream-100"></div>
  <div class="absolute top-40 right-0 w-96 h-96 bg-gold-200/20 rounded-full blur-3xl"></div>
  <div class="absolute bottom-0 left-0 w-80 h-80 bg-blush-100/30 rounded-full blur-3xl"></div>

  <div class="relative max-w-7xl mx-auto px-6 pt-20 pb-28">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div>
        <div class="flex items-center gap-3 mb-8">
          <div class="gold-line"></div>
          <span class="text-gold-500 text-sm tracking-[0.2em] uppercase font-medium">Since 2018</span>
          <div class="gold-line"></div>
        </div>
        <h1 class="font-serif text-4xl lg:text-6xl xl:text-7xl text-charcoal-800 leading-tight mb-6">
          Reveal Your<br>
          <span class="italic text-gold-500">Natural Glow</span>
        </h1>
        <p class="text-charcoal-700/60 text-lg leading-relaxed mb-10 max-w-md">
          不追求千篇一律的美，而是找到屬於你的光。LUEUR 以專業技術與細膩美感，為每位客人量身打造最適合的風格。
        </p>
        <div class="flex flex-wrap gap-4">
          <button onclick="scrollTo('booking')" class="bg-charcoal-800 hover:bg-charcoal-900 text-cream-50 px-8 py-4 rounded-full font-medium text-lg transition-all hover:shadow-lg cursor-pointer">
            立即預約
          </button>
          <button onclick="scrollTo('services')" class="border border-charcoal-700/20 hover:border-gold-400 text-charcoal-700 px-8 py-4 rounded-full font-medium transition-all cursor-pointer">
            瀏覽服務
          </button>
        </div>
        <!-- Mini stats -->
        <div class="flex gap-8 mt-14 pt-8 border-t border-charcoal-700/10">
          <div>
            <div class="font-serif text-3xl font-bold text-charcoal-800">8+</div>
            <div class="text-xs text-charcoal-700/40 mt-1">年專業經驗</div>
          </div>
          <div>
            <div class="font-serif text-3xl font-bold text-charcoal-800">15K+</div>
            <div class="text-xs text-charcoal-700/40 mt-1">服務顧客</div>
          </div>
          <div>
            <div class="font-serif text-3xl font-bold text-charcoal-800">4.9</div>
            <div class="text-xs text-charcoal-700/40 mt-1">Google 評分</div>
          </div>
        </div>
      </div>
      <!-- Hero Visual -->
      <div class="relative hidden lg:block">
        <div class="bg-gradient-to-br from-blush-100 via-cream-200 to-gold-200/40 rounded-[2rem] aspect-[3/4] flex items-center justify-center relative overflow-hidden">
          <div class="text-center">
            <div class="text-8xl mb-4">💇‍♀️</div>
            <p class="text-charcoal-700/30 font-serif italic text-sm">Salon Interior</p>
          </div>
          <!-- Floating elements -->
          <div class="absolute top-6 left-6 bg-white/80 backdrop-blur rounded-2xl p-4 shadow-sm">
            <div class="text-xs text-gold-500 font-medium mb-1">本月推薦</div>
            <div class="text-sm font-medium text-charcoal-800">韓式氧氣瀏海 + 護髮</div>
            <div class="text-xs text-blush-500 mt-1">NT$2,800 → <span class="font-bold">NT$2,200</span></div>
          </div>
          <div class="absolute bottom-8 right-6 bg-white/80 backdrop-blur rounded-2xl p-4 shadow-sm">
            <div class="flex gap-0.5 mb-1 text-gold-400 text-xs">★★★★★</div>
            <p class="text-xs text-charcoal-700/60 italic">"髮色超美，每次都好滿意"</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <div class="gold-line mx-auto mb-4"></div>
      <span class="text-gold-500 text-sm tracking-[0.2em] uppercase font-medium">Services</span>
      <h2 class="font-serif text-3xl lg:text-4xl text-charcoal-800 mt-3">服務項目</h2>
    </div>

    <!-- Service tabs -->
    <div class="flex justify-center gap-6 mb-12 reveal">
      <button class="tab-btn active pb-2 border-b-2 border-transparent text-sm font-medium transition-colors cursor-pointer" onclick="switchTab('hair', this)">美髮</button>
      <button class="tab-btn pb-2 border-b-2 border-transparent text-sm font-medium text-charcoal-700/40 transition-colors cursor-pointer" onclick="switchTab('nail', this)">美甲</button>
      <button class="tab-btn pb-2 border-b-2 border-transparent text-sm font-medium text-charcoal-700/40 transition-colors cursor-pointer" onclick="switchTab('spa', this)">SPA</button>
    </div>

    <!-- Hair services -->
    <div id="tab-hair" class="tab-content max-w-3xl mx-auto reveal">
      <div class="space-y-0 border-t border-charcoal-700/10">
        <div class="service-item flex items-center justify-between py-6 px-4 border-b border-charcoal-700/10 cursor-pointer rounded-lg" onclick="showToast('剪髮 — 包含洗髮、造型')">
          <div>
            <h3 class="font-medium text-charcoal-800">剪髮</h3>
            <p class="text-sm text-charcoal-700/40 mt-1">包含洗髮、造型吹整 · 約 60 分鐘</p>
          </div>
          <div class="text-right">
            <span class="font-serif text-lg font-bold text-charcoal-800">NT$800</span>
            <span class="text-xs text-charcoal-700/30 block">起</span>
          </div>
        </div>
        <div class="service-item flex items-center justify-between py-6 px-4 border-b border-charcoal-700/10 cursor-pointer rounded-lg" onclick="showToast('染髮 — 客製化調色')">
          <div>
            <h3 class="font-medium text-charcoal-800">染髮</h3>
            <p class="text-sm text-charcoal-700/40 mt-1">客製化調色、護色處理 · 約 2-3 小時</p>
          </div>
          <div class="text-right">
            <span class="font-serif text-lg font-bold text-charcoal-800">NT$2,500</span>
            <span class="text-xs text-charcoal-700/30 block">起</span>
          </div>
        </div>
        <div class="service-item flex items-center justify-between py-6 px-4 border-b border-charcoal-700/10 cursor-pointer rounded-lg" onclick="showToast('燙髮 — 韓式溫塑燙/冷燙')">
          <div>
            <h3 class="font-medium text-charcoal-800">燙髮</h3>
            <p class="text-sm text-charcoal-700/40 mt-1">韓式溫塑燙、冷燙、離子燙 · 約 3-4 小時</p>
          </div>
          <div class="text-right">
            <span class="font-serif text-lg font-bold text-charcoal-800">NT$3,000</span>
            <span class="text-xs text-charcoal-700/30 block">起</span>
          </div>
        </div>
        <div class="service-item flex items-center justify-between py-6 px-4 border-b border-charcoal-700/10 cursor-pointer rounded-lg" onclick="showToast('頭皮養護 — 深層淨化')">
          <div>
            <h3 class="font-medium text-charcoal-800">頭皮養護</h3>
            <p class="text-sm text-charcoal-700/40 mt-1">深層淨化、頭皮按摩、精油護理 · 約 60 分鐘</p>
          </div>
          <div class="text-right">
            <span class="font-serif text-lg font-bold text-charcoal-800">NT$1,200</span>
            <span class="text-xs text-charcoal-700/30 block">起</span>
          </div>
        </div>
        <div class="service-item flex items-center justify-between py-6 px-4 border-b border-charcoal-700/10 cursor-pointer rounded-lg" onclick="showToast('結構式護髮 — 修復受損')">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-medium text-charcoal-800">結構式護髮</h3>
              <span class="text-[10px] bg-gold-200 text-gold-500 px-2 py-0.5 rounded-full font-medium">人氣</span>
            </div>
            <p class="text-sm text-charcoal-700/40 mt-1">Olaplex/哥德式護髮 · 約 40 分鐘</p>
          </div>
          <div class="text-right">
            <span class="font-serif text-lg font-bold text-charcoal-800">NT$1,800</span>
            <span class="text-xs text-charcoal-700/30 block">起</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Nail services -->
    <div id="tab-nail" class="tab-content max-w-3xl mx-auto hidden">
      <div class="space-y-0 border-t border-charcoal-700/10">
        <div class="service-item flex items-center justify-between py-6 px-4 border-b border-charcoal-700/10 cursor-pointer rounded-lg" onclick="showToast('手部凝膠美甲')">
          <div><h3 class="font-medium text-charcoal-800">手部凝膠美甲</h3><p class="text-sm text-charcoal-700/40 mt-1">基礎保養 + 單色凝膠 · 約 90 分鐘</p></div>
          <div class="text-right"><span class="font-serif text-lg font-bold text-charcoal-800">NT$800</span><span class="text-xs text-charcoal-700/30 block">起</span></div>
        </div>
        <div class="service-item flex items-center justify-between py-6 px-4 border-b border-charcoal-700/10 cursor-pointer rounded-lg" onclick="showToast('手部凝膠彩繪')">
          <div><h3 class="font-medium text-charcoal-800">手繪設計款</h3><p class="text-sm text-charcoal-700/40 mt-1">客製圖案、暈染、貓眼、鏡面 · 約 2 小時</p></div>
          <div class="text-right"><span class="font-serif text-lg font-bold text-charcoal-800">NT$1,500</span><span class="text-xs text-charcoal-700/30 block">起</span></div>
        </div>
        <div class="service-item flex items-center justify-between py-6 px-4 border-b border-charcoal-700/10 cursor-pointer rounded-lg" onclick="showToast('足部凝膠美甲')">
          <div><h3 class="font-medium text-charcoal-800">足部凝膠</h3><p class="text-sm text-charcoal-700/40 mt-1">足部保養 + 凝膠上色 · 約 90 分鐘</p></div>
          <div class="text-right"><span class="font-serif text-lg font-bold text-charcoal-800">NT$900</span><span class="text-xs text-charcoal-700/30 block">起</span></div>
        </div>
        <div class="service-item flex items-center justify-between py-6 px-4 border-b border-charcoal-700/10 cursor-pointer rounded-lg" onclick="showToast('卸甲服務')">
          <div><h3 class="font-medium text-charcoal-800">卸甲</h3><p class="text-sm text-charcoal-700/40 mt-1">安全卸除 + 指緣保養 · 約 30 分鐘</p></div>
          <div class="text-right"><span class="font-serif text-lg font-bold text-charcoal-800">NT$300</span></div>
        </div>
      </div>
    </div>

    <!-- SPA services -->
    <div id="tab-spa" class="tab-content max-w-3xl mx-auto hidden">
      <div class="space-y-0 border-t border-charcoal-700/10">
        <div class="service-item flex items-center justify-between py-6 px-4 border-b border-charcoal-700/10 cursor-pointer rounded-lg" onclick="showToast('臉部深層護理')">
          <div><h3 class="font-medium text-charcoal-800">臉部深層護理</h3><p class="text-sm text-charcoal-700/40 mt-1">清潔 + 精華導入 + 面膜 + 按摩 · 約 90 分鐘</p></div>
          <div class="text-right"><span class="font-serif text-lg font-bold text-charcoal-800">NT$2,000</span><span class="text-xs text-charcoal-700/30 block">起</span></div>
        </div>
        <div class="service-item flex items-center justify-between py-6 px-4 border-b border-charcoal-700/10 cursor-pointer rounded-lg" onclick="showToast('全身精油按摩')">
          <div><h3 class="font-medium text-charcoal-800">全身精油按摩</h3><p class="text-sm text-charcoal-700/40 mt-1">客製化精油調配 + 全身放鬆 · 約 90 分鐘</p></div>
          <div class="text-right"><span class="font-serif text-lg font-bold text-charcoal-800">NT$2,500</span><span class="text-xs text-charcoal-700/30 block">起</span></div>
        </div>
        <div class="service-item flex items-center justify-between py-6 px-4 border-b border-charcoal-700/10 cursor-pointer rounded-lg" onclick="showToast('熱石舒壓')">
          <div>
            <div class="flex items-center gap-2"><h3 class="font-medium text-charcoal-800">熱石舒壓</h3><span class="text-[10px] bg-gold-200 text-gold-500 px-2 py-0.5 rounded-full font-medium">推薦</span></div>
            <p class="text-sm text-charcoal-700/40 mt-1">玄武岩熱石 + 深層肌肉放鬆 · 約 120 分鐘</p>
          </div>
          <div class="text-right"><span class="font-serif text-lg font-bold text-charcoal-800">NT$3,200</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Team -->
<section id="team" class="py-24 bg-cream-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <div class="gold-line mx-auto mb-4"></div>
      <span class="text-gold-500 text-sm tracking-[0.2em] uppercase font-medium">Our Team</span>
      <h2 class="font-serif text-3xl lg:text-4xl text-charcoal-800 mt-3">設計師團隊</h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 reveal">
      <div class="team-card bg-white rounded-2xl overflow-hidden cursor-pointer" onclick="showToast('預約 Mia 設計師')">
        <div class="relative aspect-[3/4] bg-gradient-to-br from-blush-100 to-gold-200/30 flex items-center justify-center">
          <span class="text-6xl">💁‍♀️</span>
          <div class="team-overlay absolute inset-0 bg-charcoal-900/50 flex items-center justify-center">
            <button class="bg-gold-500 text-white px-6 py-2.5 rounded-full text-sm font-medium cursor-pointer">預約</button>
          </div>
        </div>
        <div class="p-5 text-center">
          <h3 class="font-serif text-lg font-bold text-charcoal-800">Mia</h3>
          <p class="text-gold-500 text-sm mt-0.5">Creative Director</p>
          <p class="text-charcoal-700/40 text-xs mt-2">15 年資歷 · 韓系髮型 · 色彩專家</p>
        </div>
      </div>
      <div class="team-card bg-white rounded-2xl overflow-hidden cursor-pointer" onclick="showToast('預約 Yuki 設計師')">
        <div class="relative aspect-[3/4] bg-gradient-to-br from-pink-100 to-blush-100 flex items-center justify-center">
          <span class="text-6xl">💇‍♀️</span>
          <div class="team-overlay absolute inset-0 bg-charcoal-900/50 flex items-center justify-center">
            <button class="bg-gold-500 text-white px-6 py-2.5 rounded-full text-sm font-medium cursor-pointer">預約</button>
          </div>
        </div>
        <div class="p-5 text-center">
          <h3 class="font-serif text-lg font-bold text-charcoal-800">Yuki</h3>
          <p class="text-gold-500 text-sm mt-0.5">Senior Stylist</p>
          <p class="text-charcoal-700/40 text-xs mt-2">10 年資歷 · 日系剪裁 · 燙髮專家</p>
        </div>
      </div>
      <div class="team-card bg-white rounded-2xl overflow-hidden cursor-pointer" onclick="showToast('預約 Amber 美甲師')">
        <div class="relative aspect-[3/4] bg-gradient-to-br from-amber-100 to-gold-200/40 flex items-center justify-center">
          <span class="text-6xl">💅</span>
          <div class="team-overlay absolute inset-0 bg-charcoal-900/50 flex items-center justify-center">
            <button class="bg-gold-500 text-white px-6 py-2.5 rounded-full text-sm font-medium cursor-pointer">預約</button>
          </div>
        </div>
        <div class="p-5 text-center">
          <h3 class="font-serif text-lg font-bold text-charcoal-800">Amber</h3>
          <p class="text-gold-500 text-sm mt-0.5">Nail Artist</p>
          <p class="text-charcoal-700/40 text-xs mt-2">8 年資歷 · 手繪設計 · 韓式美甲</p>
        </div>
      </div>
      <div class="team-card bg-white rounded-2xl overflow-hidden cursor-pointer" onclick="showToast('預約 Sophie SPA 師')">
        <div class="relative aspect-[3/4] bg-gradient-to-br from-emerald-100 to-cream-200 flex items-center justify-center">
          <span class="text-6xl">🧖‍♀️</span>
          <div class="team-overlay absolute inset-0 bg-charcoal-900/50 flex items-center justify-center">
            <button class="bg-gold-500 text-white px-6 py-2.5 rounded-full text-sm font-medium cursor-pointer">預約</button>
          </div>
        </div>
        <div class="p-5 text-center">
          <h3 class="font-serif text-lg font-bold text-charcoal-800">Sophie</h3>
          <p class="text-gold-500 text-sm mt-0.5">SPA Therapist</p>
          <p class="text-charcoal-700/40 text-xs mt-2">12 年資歷 · 芳療認證 · 臉部護理</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Gallery -->
<section id="gallery" class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <div class="gold-line mx-auto mb-4"></div>
      <span class="text-gold-500 text-sm tracking-[0.2em] uppercase font-medium">Portfolio</span>
      <h2 class="font-serif text-3xl lg:text-4xl text-charcoal-800 mt-3">作品集</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 reveal">
      <div class="gallery-img aspect-square rounded-2xl bg-gradient-to-br from-blush-100 to-blush-200 flex items-center justify-center" onclick="showToast('查看作品：韓系氧氣瀏海')">
        <div class="text-center"><span class="text-4xl">✨</span><p class="text-xs text-charcoal-700/40 mt-2">韓系氧氣瀏海</p></div>
      </div>
      <div class="gallery-img aspect-square rounded-2xl bg-gradient-to-br from-amber-100 to-gold-200/40 flex items-center justify-center" onclick="showToast('查看作品：奶茶色染髮')">
        <div class="text-center"><span class="text-4xl">🎨</span><p class="text-xs text-charcoal-700/40 mt-2">奶茶色染髮</p></div>
      </div>
      <div class="gallery-img aspect-square rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center" onclick="showToast('查看作品：日式手繪美甲')">
        <div class="text-center"><span class="text-4xl">💅</span><p class="text-xs text-charcoal-700/40 mt-2">日式手繪美甲</p></div>
      </div>
      <div class="gallery-img aspect-square rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center" onclick="showToast('查看作品：薰衣草霧面色')">
        <div class="text-center"><span class="text-4xl">💜</span><p class="text-xs text-charcoal-700/40 mt-2">薰衣草霧面色</p></div>
      </div>
      <div class="gallery-img aspect-square rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center" onclick="showToast('查看作品：SPA 空間')">
        <div class="text-center"><span class="text-4xl">🌿</span><p class="text-xs text-charcoal-700/40 mt-2">SPA 放鬆空間</p></div>
      </div>
      <div class="gallery-img aspect-square rounded-2xl bg-gradient-to-br from-cream-200 to-sand-200 flex items-center justify-center" onclick="showToast('查看作品：溫塑大波浪')">
        <div class="text-center"><span class="text-4xl">〰️</span><p class="text-xs text-charcoal-700/40 mt-2">溫塑大波浪</p></div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section id="testimonials" class="py-24 bg-cream-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <div class="gold-line mx-auto mb-4"></div>
      <span class="text-gold-500 text-sm tracking-[0.2em] uppercase font-medium">Reviews</span>
      <h2 class="font-serif text-3xl lg:text-4xl text-charcoal-800 mt-3">顧客評價</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6 reveal">
      <div class="bg-white rounded-2xl p-8">
        <div class="flex gap-0.5 mb-4 text-gold-400 text-sm">★★★★★</div>
        <p class="text-charcoal-700/60 text-sm leading-relaxed mb-6 italic">"Mia 真的是我遇過最用心的設計師！染出來的顏色比照片還美，而且一個月後都還很有光澤。朋友都問我在哪裡弄的。"</p>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-blush-100 rounded-full flex items-center justify-center text-blush-500 text-sm font-bold">S</div>
          <div><div class="text-sm font-medium text-charcoal-800">Sandy</div><div class="text-xs text-charcoal-700/30">染髮 · Google 評論</div></div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-8">
        <div class="flex gap-0.5 mb-4 text-gold-400 text-sm">★★★★★</div>
        <p class="text-charcoal-700/60 text-sm leading-relaxed mb-6 italic">"第一次做凝膠美甲就選了 Amber，手繪的花朵超精緻！做了快三週還是很完整，隔壁座位的客人還拍照問款式。"</p>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm font-bold">J</div>
          <div><div class="text-sm font-medium text-charcoal-800">Jessica</div><div class="text-xs text-charcoal-700/30">美甲 · IG 評價</div></div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-8">
        <div class="flex gap-0.5 mb-4 text-gold-400 text-sm">★★★★★</div>
        <p class="text-charcoal-700/60 text-sm leading-relaxed mb-6 italic">"Sophie 的精油按摩真的超舒服，做完感覺整個人輕了三公斤。環境也很有質感，放的音樂讓人完全放鬆，已經變常客了。"</p>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-sm font-bold">M</div>
          <div><div class="text-sm font-medium text-charcoal-800">Michelle</div><div class="text-xs text-charcoal-700/30">SPA · 常客推薦</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Booking -->
<section id="booking" class="py-24 bg-charcoal-800 relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-charcoal-900 to-charcoal-800"></div>
  <div class="relative max-w-3xl mx-auto px-6">
    <div class="text-center mb-12 reveal">
      <div class="gold-line mx-auto mb-4"></div>
      <span class="text-gold-400 text-sm tracking-[0.2em] uppercase font-medium">Reservation</span>
      <h2 class="font-serif text-3xl lg:text-4xl text-white mt-3">線上預約</h2>
    </div>
    <form onsubmit="return handleBooking(event)" class="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 lg:p-10 reveal">
      <div class="grid md:grid-cols-2 gap-5 mb-5">
        <div>
          <label class="block text-sm text-white/70 mb-2">姓名 *</label>
          <input type="text" id="bName" required placeholder="您的姓名" class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/25 focus:border-gold-400 outline-none text-sm">
        </div>
        <div>
          <label class="block text-sm text-white/70 mb-2">手機 *</label>
          <input type="tel" id="bPhone" required placeholder="0912-345-678" class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/25 focus:border-gold-400 outline-none text-sm">
        </div>
      </div>
      <div class="grid md:grid-cols-2 gap-5 mb-5">
        <div>
          <label class="block text-sm text-white/70 mb-2">服務類型 *</label>
          <select id="bService" required class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white focus:border-gold-400 outline-none text-sm cursor-pointer">
            <option value="" class="text-charcoal-800">請選擇</option>
            <option value="剪髮" class="text-charcoal-800">剪髮 NT$800 起</option>
            <option value="染髮" class="text-charcoal-800">染髮 NT$2,500 起</option>
            <option value="燙髮" class="text-charcoal-800">燙髮 NT$3,000 起</option>
            <option value="護髮" class="text-charcoal-800">護髮 NT$1,800 起</option>
            <option value="美甲" class="text-charcoal-800">凝膠美甲 NT$800 起</option>
            <option value="SPA" class="text-charcoal-800">SPA 臉部護理 NT$2,000 起</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-white/70 mb-2">指定設計師</label>
          <select id="bStylist" class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white focus:border-gold-400 outline-none text-sm cursor-pointer">
            <option value="不指定" class="text-charcoal-800">不指定</option>
            <option value="Mia" class="text-charcoal-800">Mia（總監）</option>
            <option value="Yuki" class="text-charcoal-800">Yuki（資深設計師）</option>
            <option value="Amber" class="text-charcoal-800">Amber（美甲師）</option>
            <option value="Sophie" class="text-charcoal-800">Sophie（SPA 芳療師）</option>
          </select>
        </div>
      </div>
      <div class="grid md:grid-cols-2 gap-5 mb-5">
        <div>
          <label class="block text-sm text-white/70 mb-2">預約日期 *</label>
          <input type="date" id="bDate" required class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white focus:border-gold-400 outline-none text-sm cursor-pointer">
        </div>
        <div>
          <label class="block text-sm text-white/70 mb-2">偏好時段 *</label>
          <select id="bTime" required class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white focus:border-gold-400 outline-none text-sm cursor-pointer">
            <option value="" class="text-charcoal-800">請選擇</option>
            <option value="10:00" class="text-charcoal-800">10:00</option>
            <option value="11:00" class="text-charcoal-800">11:00</option>
            <option value="13:00" class="text-charcoal-800">13:00</option>
            <option value="14:00" class="text-charcoal-800">14:00</option>
            <option value="15:00" class="text-charcoal-800">15:00</option>
            <option value="16:00" class="text-charcoal-800">16:00</option>
            <option value="17:00" class="text-charcoal-800">17:00</option>
            <option value="18:00" class="text-charcoal-800">18:00</option>
            <option value="19:00" class="text-charcoal-800">19:00</option>
          </select>
        </div>
      </div>
      <div class="mb-6">
        <label class="block text-sm text-white/70 mb-2">備註</label>
        <textarea rows="2" placeholder="特殊需求或想參考的照片連結…" class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/25 focus:border-gold-400 outline-none text-sm resize-none"></textarea>
      </div>
      <button type="submit" class="w-full bg-gold-500 hover:bg-gold-400 text-white py-4 rounded-full font-medium text-lg transition-all hover:shadow-lg cursor-pointer">
        送出預約
      </button>
      <p class="text-xs text-white/25 text-center mt-4">預約送出後，設計師將於營業時間內回電確認。</p>
    </form>
  </div>
</section>

<!-- Footer -->
<footer class="bg-charcoal-900 text-white pt-14 pb-8">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex flex-col md:flex-row justify-between items-start gap-10 pb-10 border-b border-white/10">
      <div>
        <span class="font-serif text-2xl font-bold tracking-wider">LUEUR</span>
        <span class="text-[10px] text-gold-400/60 block tracking-[0.15em] mt-0.5">璐兒美學沙龍</span>
        <p class="text-white/40 text-sm mt-4 max-w-xs">找到屬於你的光，成為最美的自己。</p>
      </div>
      <div class="flex gap-12">
        <div>
          <h4 class="text-sm font-medium mb-3">營業資訊</h4>
          <div class="text-white/40 text-xs space-y-2">
            <p>週二至週六 10:00-21:00</p>
            <p>週日 10:00-18:00</p>
            <p>每週一公休</p>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-medium mb-3">聯絡方式</h4>
          <div class="text-white/40 text-xs space-y-2">
            <p>台北市大安區仁愛路四段 88 號 2F</p>
            <p>02-2771-8899</p>
            <p>line@lueur-salon</p>
          </div>
        </div>
      </div>
    </div>
    <div class="pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="text-white/20 text-xs">&copy; 2026 LUEUR Salon. All rights reserved.</p>
      <div class="flex gap-3">
        <a href="#" class="w-8 h-8 bg-white/10 hover:bg-gold-500 rounded-lg flex items-center justify-center transition-colors cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </a>
        <a href="#" class="w-8 h-8 bg-white/10 hover:bg-[#06C755] rounded-lg flex items-center justify-center transition-colors cursor-pointer">
          <span class="text-[10px] font-bold">LINE</span>
        </a>
      </div>
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
function scrollTo(id) { document.getElementById(id).scrollIntoView({ behavior:'smooth' }); }

window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('nav-scrolled', window.scrollY > 20);
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

function switchTab(tab, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.style.color = ''; });
  btn.classList.add('active');
}

function handleBooking(e) {
  e.preventDefault();
  const name = document.getElementById('bName').value;
  const service = document.getElementById('bService').value;
  const date = document.getElementById('bDate').value;
  const time = document.getElementById('bTime').value;
  const stylist = document.getElementById('bStylist').value;
  if (!name || !service || !date || !time) { showToast('請填寫必填欄位'); return false; }
  showToast(`預約成功！${name}，${date} ${time} ${service}（${stylist}），設計師將來電確認`);
  e.target.reset();
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  const d = document.getElementById('bDate');
  if (d) { const t = new Date(); t.setDate(t.getDate()+1); d.min = t.toISOString().split('T')[0]; }
});
</script>

</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
