INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '8a56e3ae-611e-4a8b-a02e-db44c6ceae35',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LENS — 陳維安攝影</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#141414',
        border: '#222',
        muted: '#666',
        subtle: '#999'
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '"Noto Sans TC"', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Space Grotesk', 'Noto Sans TC', sans-serif; color: #e5e5e5; background: #0a0a0a; }

  .reveal { opacity:0; transform:translateY(20px); transition: all 0.8s cubic-bezier(0.22,1,0.36,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }

  .toast {
    position:fixed; bottom:2rem; right:2rem; background:#fff; color:#0a0a0a;
    padding:0.875rem 1.5rem; border-radius:12px; font-size:0.9rem; font-weight:500;
    z-index:9999; transform:translateY(120%); opacity:0;
    transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
  }
  .toast.show { transform:translateY(0); opacity:1; }

  .gallery-item {
    cursor: pointer;
    overflow: hidden;
    border-radius: 8px;
    position: relative;
  }
  .gallery-item .overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%);
    opacity: 0; transition: opacity 0.3s ease;
    display: flex; align-items: flex-end; padding: 1.25rem;
  }
  .gallery-item:hover .overlay { opacity: 1; }
  .gallery-item:hover .gallery-img { transform: scale(1.05); }
  .gallery-img { transition: transform 0.6s ease; width: 100%; height: 100%; object-fit: cover; }

  .filter-btn.active { color: #fff; border-color: #fff; }

  .nav-scrolled { background: rgba(10,10,10,0.95) !important; border-bottom: 1px solid #222; }

  /* Lightbox */
  .lightbox {
    position:fixed; inset:0; z-index:100; background:rgba(0,0,0,0.95);
    display:none; align-items:center; justify-content:center;
    cursor: pointer;
  }
  .lightbox.active { display:flex; }
  .lightbox-content {
    max-width:90vw; max-height:85vh; border-radius:12px; overflow:hidden;
  }
  .lightbox-info {
    position:absolute; bottom:2rem; left:50%; transform:translateX(-50%);
    text-align:center; color:#fff;
  }

  .masonry { columns: 3; gap: 12px; }
  @media (max-width: 768px) { .masonry { columns: 2; } }
  .masonry .gallery-item { break-inside: avoid; margin-bottom: 12px; }
</style>
</head>
<body>

<div id="toast" class="toast"></div>

<!-- Lightbox -->
<div id="lightbox" class="lightbox" onclick="closeLightbox()">
  <div class="lightbox-content" id="lightboxContent"></div>
  <div class="lightbox-info">
    <div id="lightboxTitle" class="font-medium text-lg"></div>
    <div id="lightboxMeta" class="text-sm text-white/50 mt-1"></div>
  </div>
  <button class="absolute top-6 right-6 text-white/60 hover:text-white text-2xl cursor-pointer" onclick="closeLightbox()">✕</button>
</div>

<!-- Navigation -->
<nav id="navbar" class="fixed top-0 w-full z-50 bg-transparent transition-all duration-300">
  <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
    <a href="#" class="text-white font-bold text-xl tracking-wider">LENS</a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#work" class="text-sm text-white/50 hover:text-white transition-colors">作品</a>
      <a href="#about" class="text-sm text-white/50 hover:text-white transition-colors">關於</a>
      <a href="#services" class="text-sm text-white/50 hover:text-white transition-colors">服務</a>
      <a href="#contact" class="text-sm text-white/50 hover:text-white transition-colors">聯絡</a>
      <button onclick="scrollTo('contact')" class="border border-white/30 hover:bg-white hover:text-black text-white px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer">
        合作洽談
      </button>
    </div>
    <button onclick="toggleMobile()" class="md:hidden w-10 h-10 flex items-center justify-center cursor-pointer">
      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div id="mobileMenu" class="hidden md:hidden bg-bg border-t border-border px-6 pb-6">
    <div class="flex flex-col gap-1 pt-4">
      <a href="#work" onclick="closeMobile()" class="py-3 text-white/70">作品</a>
      <a href="#about" onclick="closeMobile()" class="py-3 text-white/70">關於</a>
      <a href="#services" onclick="closeMobile()" class="py-3 text-white/70">服務</a>
      <a href="#contact" onclick="closeMobile()" class="py-3 text-white/70">聯絡</a>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="relative min-h-screen flex items-center">
  <div class="absolute inset-0 bg-gradient-to-b from-bg via-bg/50 to-bg"></div>
  <div class="relative max-w-7xl mx-auto px-6 pt-32 pb-20 w-full">
    <div class="max-w-3xl">
      <div class="text-white/30 text-sm tracking-[0.3em] uppercase mb-6">Photographer & Visual Storyteller</div>
      <h1 class="text-5xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.05] mb-8">
        用光影<br>說一個<br>
        <span class="text-white/30">好故事</span>
      </h1>
      <p class="text-lg text-white/40 max-w-lg leading-relaxed mb-12">
        專注商業攝影、品牌形象與空間攝影。以獨特的視覺語言，為每個品牌捕捉最真實的瞬間。
      </p>
      <div class="flex gap-4">
        <button onclick="scrollTo('work')" class="bg-white text-black px-8 py-4 rounded-full font-semibold transition-all hover:shadow-lg cursor-pointer">
          瀏覽作品集
        </button>
        <button onclick="scrollTo('contact')" class="border border-white/20 text-white px-8 py-4 rounded-full font-medium hover:border-white/50 transition-all cursor-pointer">
          合作洽談
        </button>
      </div>
    </div>
    <!-- Selected brands -->
    <div class="mt-20 pt-10 border-t border-white/10">
      <span class="text-white/20 text-xs tracking-[0.2em] uppercase">Selected Clients</span>
      <div class="flex flex-wrap gap-8 mt-6 text-white/20 text-sm font-medium">
        <span>MUJI</span>
        <span>誠品</span>
        <span>Cloud Gate</span>
        <span>Eslite Hotel</span>
        <span>PINKOI</span>
        <span>Fujin Tree</span>
      </div>
    </div>
  </div>
</section>

<!-- Gallery / Work -->
<section id="work" class="py-24">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 reveal">
      <div>
        <span class="text-white/30 text-sm tracking-[0.2em] uppercase">Selected Work</span>
        <h2 class="text-3xl lg:text-4xl font-bold text-white mt-2">精選作品</h2>
      </div>
      <div class="flex gap-3 mt-6 md:mt-0">
        <button class="filter-btn active px-4 py-1.5 rounded-full text-xs border border-white/20 text-white/50 transition-all cursor-pointer" onclick="filterGallery('all',this)">全部</button>
        <button class="filter-btn px-4 py-1.5 rounded-full text-xs border border-white/10 text-white/30 transition-all cursor-pointer" onclick="filterGallery('commercial',this)">商業攝影</button>
        <button class="filter-btn px-4 py-1.5 rounded-full text-xs border border-white/10 text-white/30 transition-all cursor-pointer" onclick="filterGallery('space',this)">空間攝影</button>
        <button class="filter-btn px-4 py-1.5 rounded-full text-xs border border-white/10 text-white/30 transition-all cursor-pointer" onclick="filterGallery('portrait',this)">人像</button>
      </div>
    </div>

    <div id="galleryGrid" class="masonry reveal">
      <div class="gallery-item" data-cat="commercial" onclick="openLightbox('MUJI 無印良品 — 生活提案','商業攝影 · 2025','commercial-1')">
        <div class="aspect-[3/4] bg-gradient-to-br from-amber-900/40 to-stone-800/60 flex items-center justify-center gallery-img">
          <div class="text-center"><span class="text-5xl">🏺</span><p class="text-white/20 text-xs mt-2">MUJI 商品</p></div>
        </div>
        <div class="overlay"><div><div class="text-white text-sm font-medium">MUJI 生活提案</div><div class="text-white/50 text-xs mt-1">商業攝影</div></div></div>
      </div>
      <div class="gallery-item" data-cat="space" onclick="openLightbox('誠品書店 — 空間紀實','空間攝影 · 2025','space-1')">
        <div class="aspect-[4/5] bg-gradient-to-br from-stone-700/40 to-neutral-800/60 flex items-center justify-center gallery-img">
          <div class="text-center"><span class="text-5xl">📚</span><p class="text-white/20 text-xs mt-2">誠品書店</p></div>
        </div>
        <div class="overlay"><div><div class="text-white text-sm font-medium">誠品書店空間</div><div class="text-white/50 text-xs mt-1">空間攝影</div></div></div>
      </div>
      <div class="gallery-item" data-cat="portrait" onclick="openLightbox('品牌人物 — 形象攝影','人像攝影 · 2025','portrait-1')">
        <div class="aspect-[3/4] bg-gradient-to-br from-zinc-700/40 to-slate-800/60 flex items-center justify-center gallery-img">
          <div class="text-center"><span class="text-5xl">👤</span><p class="text-white/20 text-xs mt-2">形象人像</p></div>
        </div>
        <div class="overlay"><div><div class="text-white text-sm font-medium">品牌形象攝影</div><div class="text-white/50 text-xs mt-1">人像</div></div></div>
      </div>
      <div class="gallery-item" data-cat="commercial" onclick="openLightbox('PINKOI — 品牌視覺','商業攝影 · 2025','commercial-2')">
        <div class="aspect-[4/3] bg-gradient-to-br from-pink-900/30 to-rose-900/40 flex items-center justify-center gallery-img">
          <div class="text-center"><span class="text-5xl">🎀</span><p class="text-white/20 text-xs mt-2">PINKOI 品牌</p></div>
        </div>
        <div class="overlay"><div><div class="text-white text-sm font-medium">PINKOI 品牌視覺</div><div class="text-white/50 text-xs mt-1">商業攝影</div></div></div>
      </div>
      <div class="gallery-item" data-cat="space" onclick="openLightbox('Eslite Hotel — 飯店空間','空間攝影 · 2024','space-2')">
        <div class="aspect-[3/4] bg-gradient-to-br from-amber-800/30 to-yellow-900/40 flex items-center justify-center gallery-img">
          <div class="text-center"><span class="text-5xl">🏨</span><p class="text-white/20 text-xs mt-2">Eslite Hotel</p></div>
        </div>
        <div class="overlay"><div><div class="text-white text-sm font-medium">誠品行旅</div><div class="text-white/50 text-xs mt-1">空間攝影</div></div></div>
      </div>
      <div class="gallery-item" data-cat="commercial" onclick="openLightbox('Fujin Tree — 餐飲攝影','商業攝影 · 2024','commercial-3')">
        <div class="aspect-[4/5] bg-gradient-to-br from-emerald-900/30 to-teal-900/40 flex items-center justify-center gallery-img">
          <div class="text-center"><span class="text-5xl">🍽️</span><p class="text-white/20 text-xs mt-2">富錦樹</p></div>
        </div>
        <div class="overlay"><div><div class="text-white text-sm font-medium">Fujin Tree 餐飲</div><div class="text-white/50 text-xs mt-1">商業攝影</div></div></div>
      </div>
      <div class="gallery-item" data-cat="portrait" onclick="openLightbox('Cloud Gate — 舞者群像','人像攝影 · 2024','portrait-2')">
        <div class="aspect-[3/4] bg-gradient-to-br from-indigo-900/30 to-blue-900/40 flex items-center justify-center gallery-img">
          <div class="text-center"><span class="text-5xl">💃</span><p class="text-white/20 text-xs mt-2">雲門舞者</p></div>
        </div>
        <div class="overlay"><div><div class="text-white text-sm font-medium">雲門舞者群像</div><div class="text-white/50 text-xs mt-1">人像</div></div></div>
      </div>
      <div class="gallery-item" data-cat="space" onclick="openLightbox('選物店 — 空間氛圍','空間攝影 · 2024','space-3')">
        <div class="aspect-[4/3] bg-gradient-to-br from-stone-800/40 to-neutral-900/50 flex items-center justify-center gallery-img">
          <div class="text-center"><span class="text-5xl">🪴</span><p class="text-white/20 text-xs mt-2">選物店</p></div>
        </div>
        <div class="overlay"><div><div class="text-white text-sm font-medium">選物店空間</div><div class="text-white/50 text-xs mt-1">空間攝影</div></div></div>
      </div>
    </div>
  </div>
</section>

<!-- About -->
<section id="about" class="py-24 border-t border-border">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid lg:grid-cols-2 gap-16 items-center reveal">
      <div>
        <div class="aspect-[4/5] bg-gradient-to-br from-stone-800 to-neutral-900 rounded-2xl flex items-center justify-center">
          <div class="text-center">
            <span class="text-7xl">📷</span>
            <p class="text-white/20 text-sm mt-3">攝影師肖像</p>
          </div>
        </div>
      </div>
      <div>
        <span class="text-white/30 text-sm tracking-[0.2em] uppercase">About</span>
        <h2 class="text-3xl lg:text-4xl font-bold text-white mt-3 mb-6">陳維安</h2>
        <p class="text-white/50 leading-relaxed mb-6">
          攝影師、視覺敘事者。2012 年起投入商業攝影領域，專注於品牌形象、空間紀實與人像攝影。
        </p>
        <p class="text-white/50 leading-relaxed mb-8">
          相信好的攝影不只是記錄，而是創造感受。擅長在日常場景中發現不平凡的光影，用細膩的觀察力為每個品牌說出獨特的故事。
        </p>
        <div class="grid grid-cols-3 gap-6 mb-8 py-6 border-y border-border">
          <div>
            <div class="text-2xl font-bold text-white">13+</div>
            <div class="text-xs text-white/30 mt-1">年經驗</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-white">200+</div>
            <div class="text-xs text-white/30 mt-1">專案完成</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-white">50+</div>
            <div class="text-xs text-white/30 mt-1">品牌合作</div>
          </div>
        </div>
        <div>
          <h3 class="text-sm font-medium text-white/70 mb-3">使用設備</h3>
          <div class="flex flex-wrap gap-2">
            <span class="text-xs bg-surface border border-border px-3 py-1.5 rounded-full text-white/40">Sony A7R V</span>
            <span class="text-xs bg-surface border border-border px-3 py-1.5 rounded-full text-white/40">Sony 24-70mm GM II</span>
            <span class="text-xs bg-surface border border-border px-3 py-1.5 rounded-full text-white/40">Sony 85mm f/1.4 GM</span>
            <span class="text-xs bg-surface border border-border px-3 py-1.5 rounded-full text-white/40">Profoto B10X</span>
            <span class="text-xs bg-surface border border-border px-3 py-1.5 rounded-full text-white/40">DJI Mavic 3 Pro</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-24 border-t border-border">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-white/30 text-sm tracking-[0.2em] uppercase">Services</span>
      <h2 class="text-3xl lg:text-4xl font-bold text-white mt-3">服務項目</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6 reveal">
      <div class="bg-surface border border-border rounded-2xl p-8 hover:border-white/20 transition-colors cursor-pointer" onclick="showToast('查看商業攝影服務詳情')">
        <div class="text-3xl mb-6">📦</div>
        <h3 class="text-lg font-bold text-white mb-3">商業攝影</h3>
        <p class="text-white/40 text-sm leading-relaxed mb-4">產品攝影、品牌視覺、廣告素材、社群內容拍攝。含修圖與調色。</p>
        <div class="text-white/20 text-sm">NT$15,000 起 / 半日</div>
      </div>
      <div class="bg-surface border border-border rounded-2xl p-8 hover:border-white/20 transition-colors cursor-pointer" onclick="showToast('查看空間攝影服務詳情')">
        <div class="text-3xl mb-6">🏠</div>
        <h3 class="text-lg font-bold text-white mb-3">空間攝影</h3>
        <p class="text-white/40 text-sm leading-relaxed mb-4">室內空間、建築外觀、飯店民宿、餐廳咖啡廳。含場景佈置建議。</p>
        <div class="text-white/20 text-sm">NT$20,000 起 / 日</div>
      </div>
      <div class="bg-surface border border-border rounded-2xl p-8 hover:border-white/20 transition-colors cursor-pointer" onclick="showToast('查看人像攝影服務詳情')">
        <div class="text-3xl mb-6">👔</div>
        <h3 class="text-lg font-bold text-white mb-3">人像攝影</h3>
        <p class="text-white/40 text-sm leading-relaxed mb-4">品牌人物、團隊形象、藝人側拍、活動紀錄。含妝髮造型建議。</p>
        <div class="text-white/20 text-sm">NT$12,000 起 / 半日</div>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-24 border-t border-border">
  <div class="max-w-3xl mx-auto px-6">
    <div class="text-center mb-12 reveal">
      <span class="text-white/30 text-sm tracking-[0.2em] uppercase">Contact</span>
      <h2 class="text-3xl lg:text-4xl font-bold text-white mt-3">合作洽談</h2>
      <p class="text-white/40 mt-4">告訴我您的拍攝需求，我會在 24 小時內回覆。</p>
    </div>
    <form onsubmit="return handleContact(event)" class="reveal">
      <div class="grid md:grid-cols-2 gap-5 mb-5">
        <div>
          <label class="block text-sm text-white/50 mb-2">姓名 *</label>
          <input type="text" id="cName" required placeholder="您的姓名" class="w-full px-4 py-3.5 rounded-xl bg-surface border border-border text-white placeholder-white/20 focus:border-white/40 outline-none text-sm transition-all">
        </div>
        <div>
          <label class="block text-sm text-white/50 mb-2">Email *</label>
          <input type="email" id="cEmail" required placeholder="email@example.com" class="w-full px-4 py-3.5 rounded-xl bg-surface border border-border text-white placeholder-white/20 focus:border-white/40 outline-none text-sm transition-all">
        </div>
      </div>
      <div class="grid md:grid-cols-2 gap-5 mb-5">
        <div>
          <label class="block text-sm text-white/50 mb-2">拍攝類型 *</label>
          <select id="cType" required class="w-full px-4 py-3.5 rounded-xl bg-surface border border-border text-white focus:border-white/40 outline-none text-sm cursor-pointer">
            <option value="">請選擇</option>
            <option value="商業攝影">商業攝影</option>
            <option value="空間攝影">空間攝影</option>
            <option value="人像攝影">人像攝影</option>
            <option value="活動紀錄">活動紀錄</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-white/50 mb-2">預計預算</label>
          <select class="w-full px-4 py-3.5 rounded-xl bg-surface border border-border text-white focus:border-white/40 outline-none text-sm cursor-pointer">
            <option value="">請選擇</option>
            <option value="10k-20k">NT$10,000-20,000</option>
            <option value="20k-50k">NT$20,000-50,000</option>
            <option value="50k+">NT$50,000 以上</option>
          </select>
        </div>
      </div>
      <div class="mb-6">
        <label class="block text-sm text-white/50 mb-2">專案說明 *</label>
        <textarea id="cMsg" required rows="4" placeholder="請描述拍攝需求、時間、地點等…" class="w-full px-4 py-3.5 rounded-xl bg-surface border border-border text-white placeholder-white/20 focus:border-white/40 outline-none text-sm transition-all resize-none"></textarea>
      </div>
      <button type="submit" class="w-full bg-white text-black py-4 rounded-full font-semibold text-lg hover:bg-white/90 transition-all cursor-pointer">
        送出洽談
      </button>
    </form>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-border py-12">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex flex-col md:flex-row justify-between items-center gap-6">
      <div>
        <span class="font-bold text-xl text-white tracking-wider">LENS</span>
        <p class="text-white/20 text-xs mt-1">陳維安攝影工作室</p>
      </div>
      <div class="flex gap-4">
        <a href="#" class="w-9 h-9 border border-border hover:border-white/40 rounded-full flex items-center justify-center transition-colors cursor-pointer">
          <svg class="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </a>
        <a href="#" class="w-9 h-9 border border-border hover:border-white/40 rounded-full flex items-center justify-center transition-colors cursor-pointer">
          <svg class="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
        <a href="#" class="w-9 h-9 border border-border hover:border-white/40 rounded-full flex items-center justify-center transition-colors cursor-pointer">
          <svg class="w-4 h-4 text-white/40" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
        </a>
      </div>
    </div>
    <div class="mt-8 pt-6 border-t border-border text-center">
      <p class="text-white/15 text-xs">&copy; 2026 LENS Photography. All rights reserved.</p>
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

// Gallery filter
function filterGallery(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.gallery-item').forEach(item => {
    if (cat === 'all' || item.dataset.cat === cat) {
      item.style.display = '';
      item.style.opacity = '0';
      setTimeout(() => { item.style.transition = 'opacity 0.4s'; item.style.opacity = '1'; }, 50);
    } else {
      item.style.display = 'none';
    }
  });
}

// Lightbox
function openLightbox(title, meta, id) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lightboxTitle').textContent = title;
  document.getElementById('lightboxMeta').textContent = meta;
  lb.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

function handleContact(e) {
  e.preventDefault();
  const name = document.getElementById('cName').value;
  const type = document.getElementById('cType').value;
  if (!name || !type) { showToast('請填寫必填欄位'); return false; }
  showToast(`感謝 ${name}！已收到您的${type}需求，24 小時內回覆`);
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
