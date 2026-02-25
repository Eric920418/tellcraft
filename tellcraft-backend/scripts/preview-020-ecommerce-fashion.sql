-- Template Preview: ecommerce-fashion (Fashion E-commerce - Editorial Style)
-- Magazine editorial lookbook, body silhouette size guide, Shop the Look, horizontal scroll
-- Palette: Noir #1A1A1A, Off-White #FAFAF5, Nude #C8B098, Burgundy #8B0000, Gray #6B6B6B

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '5bb5362f-db51-444d-b6d7-fbca1f3069ac',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MAISON NOIR — Editorial Fashion</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        noir: '#1A1A1A',
        offwhite: '#FAFAF5',
        nude: '#C8B098',
        burgundy: '#8B0000',
        gray: { fashion: '#6B6B6B' },
        warm: '#E8E0D4',
        cream: '#F5F0EB'
      },
      fontFamily: {
        editorial: ['Cormorant Garamond', 'serif'],
        body: ['Montserrat', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Montserrat', sans-serif; background: #FAFAF5; color: #1A1A1A; overflow-x: hidden; }

  /* ===== EDITORIAL CLIP-REVEAL ===== */
  @keyframes clipRevealLeft {
    from { clip-path: inset(0 100% 0 0); }
    to { clip-path: inset(0 0 0 0); }
  }
  @keyframes clipRevealRight {
    from { clip-path: inset(0 0 0 100%); }
    to { clip-path: inset(0 0 0 0); }
  }
  @keyframes clipRevealUp {
    from { clip-path: inset(100% 0 0 0); }
    to { clip-path: inset(0 0 0 0); }
  }
  @keyframes clipRevealDown {
    from { clip-path: inset(0 0 100% 0); }
    to { clip-path: inset(0 0 0 0); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes letterSpread {
    from { letter-spacing: 0.5em; opacity: 0; }
    to { letter-spacing: 0.2em; opacity: 1; }
  }
  @keyframes lineGrow {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  @keyframes slideInRight {
    from { transform: translateX(40px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes heartBeat {
    0% { transform: scale(1); }
    25% { transform: scale(1.3); }
    50% { transform: scale(1); }
    75% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }
  @keyframes modalFadeIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes newsletterSlideUp {
    from { opacity: 0; transform: translateY(100%); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes borderDraw {
    from { stroke-dashoffset: 1000; }
    to { stroke-dashoffset: 0; }
  }

  /* ===== SCROLL REVEAL ===== */
  .reveal { opacity: 0; }
  .reveal.visible { animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .reveal-left { opacity: 0; clip-path: inset(0 100% 0 0); }
  .reveal-left.visible { animation: clipRevealLeft 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .reveal-right { opacity: 0; clip-path: inset(0 0 0 100%); }
  .reveal-right.visible { animation: clipRevealRight 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .reveal-up { opacity: 0; clip-path: inset(100% 0 0 0); }
  .reveal-up.visible { animation: clipRevealUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

  .stagger-1 { animation-delay: 0.1s !important; }
  .stagger-2 { animation-delay: 0.2s !important; }
  .stagger-3 { animation-delay: 0.3s !important; }
  .stagger-4 { animation-delay: 0.4s !important; }
  .stagger-5 { animation-delay: 0.5s !important; }

  /* ===== HAIRLINE BORDERS ===== */
  .hairline { border-width: 0.5px; }
  .hairline-b { border-bottom: 0.5px solid #E8E0D4; }
  .hairline-t { border-top: 0.5px solid #E8E0D4; }
  .hairline-l { border-left: 0.5px solid #E8E0D4; }

  /* ===== PRODUCT CARDS ===== */
  .product-card { cursor: pointer; position: relative; }
  .product-card .card-img { transition: clip-path 0.6s cubic-bezier(0.16, 1, 0.3, 1); clip-path: inset(0); }
  .product-card:hover .card-img { clip-path: inset(8px); }
  .product-card .card-overlay { opacity: 0; transition: opacity 0.4s ease; }
  .product-card:hover .card-overlay { opacity: 1; }

  /* ===== WISHLIST HEART ===== */
  .wishlist-btn { transition: all 0.2s ease; }
  .wishlist-btn.active svg { fill: #8B0000; stroke: #8B0000; }
  .wishlist-btn.active { animation: heartBeat 0.4s ease; }

  /* ===== LOOKBOOK HORIZONTAL SCROLL ===== */
  .lookbook-scroll {
    display: flex; gap: 2px; overflow-x: auto; scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch; scrollbar-width: none;
  }
  .lookbook-scroll::-webkit-scrollbar { display: none; }
  .lookbook-item { scroll-snap-align: start; flex-shrink: 0; }

  /* ===== SIZE GUIDE BODY ===== */
  .body-part { cursor: pointer; transition: all 0.3s ease; }
  .body-part:hover { fill: #C8B098; filter: drop-shadow(0 0 8px rgba(200,176,152,0.5)); }
  .body-part.active { fill: #8B0000; filter: drop-shadow(0 0 12px rgba(139,0,0,0.3)); }
  .measurement-tooltip {
    position: absolute; background: #1A1A1A; color: white;
    padding: 8px 14px; font-size: 11px; font-family: 'Montserrat', sans-serif;
    letter-spacing: 0.05em; pointer-events: none;
    opacity: 0; transition: opacity 0.3s ease; white-space: nowrap;
  }
  .measurement-tooltip.show { opacity: 1; }
  .measurement-tooltip::after {
    content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
    border: 5px solid transparent; border-top-color: #1A1A1A;
  }

  /* ===== SHOP THE LOOK ===== */
  .look-hotspot {
    position: absolute; width: 28px; height: 28px;
    border: 1.5px solid white; border-radius: 50%; cursor: pointer;
    transition: all 0.3s ease; background: rgba(255,255,255,0.2);
  }
  .look-hotspot::after {
    content: ''; position: absolute; inset: 4px;
    background: white; border-radius: 50%;
    animation: pulseGlow 2s ease-in-out infinite;
  }
  .look-hotspot:hover { transform: scale(1.2); background: rgba(255,255,255,0.5); }
  .look-hotspot.active { border-color: #8B0000; background: rgba(139,0,0,0.2); }
  .look-hotspot.active::after { background: #8B0000; }
  .look-item-card {
    opacity: 0; transform: translateX(20px);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .look-item-card.show { opacity: 1; transform: translateX(0); }

  /* ===== QUICK VIEW MODAL ===== */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(26,26,26,0.6);
    backdrop-filter: blur(4px); z-index: 100;
    opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
  }
  .modal-overlay.open { opacity: 1; pointer-events: auto; }
  .modal-content {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #FAFAF5; z-index: 110; max-width: 900px; width: 92%;
    max-height: 90vh; overflow-y: auto;
  }
  .modal-overlay.open + .modal-content { animation: modalFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

  /* ===== NEWSLETTER POPUP ===== */
  .newsletter-popup {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 90;
    transform: translateY(100%); transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .newsletter-popup.show { transform: translateY(0); }

  /* ===== CATEGORY TABS ===== */
  .cat-tab { position: relative; transition: color 0.3s ease; }
  .cat-tab::after {
    content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
    height: 1px; background: #1A1A1A; transform: scaleX(0);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: left;
  }
  .cat-tab.active { color: #1A1A1A; }
  .cat-tab.active::after { transform: scaleX(1); }

  /* ===== COLOR SWATCH ===== */
  .swatch { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent; }
  .swatch:hover { transform: scale(1.15); }
  .swatch.active { border-color: #1A1A1A; box-shadow: 0 0 0 2px #FAFAF5, 0 0 0 3.5px #1A1A1A; }

  /* ===== TOAST ===== */
  .toast-msg {
    position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%) translateY(20px);
    background: #1A1A1A; color: #FAFAF5; padding: 14px 28px;
    font-family: 'Montserrat', sans-serif; font-size: 12px; letter-spacing: 0.05em;
    opacity: 0; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); z-index: 200;
    pointer-events: none;
  }
  .toast-msg.show { opacity: 1; transform: translateX(-50%) translateY(0); }

  /* ===== SCROLLBAR ===== */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #FAFAF5; }
  ::-webkit-scrollbar-thumb { background: #E8E0D4; }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 768px) {
    .hero-title { font-size: 3rem !important; }
    .editorial-spread { grid-template-columns: 1fr !important; }
    .lookbook-item { width: 80vw !important; }
    .modal-content { width: 96%; max-height: 95vh; }
  }
</style>
</head>
<body>

<!-- ==================== HEADER ==================== -->
<header class="fixed top-0 w-full z-50 bg-offwhite/95 backdrop-blur-sm" style="border-bottom: 0.5px solid #E8E0D4;">
  <div class="max-w-[1400px] mx-auto px-6 md:px-10">
    <!-- Announcement -->
    <div class="hidden md:flex items-center justify-center py-2" style="border-bottom: 0.5px solid #E8E0D4;">
      <span class="text-[10px] font-body text-gray-fashion tracking-[0.15em] uppercase">Complimentary shipping on all orders &mdash; 14-day returns</span>
    </div>
    <!-- Nav -->
    <div class="h-16 flex items-center justify-between">
      <nav class="hidden md:flex items-center gap-10">
        <button onclick="filterCategory('women')" class="cat-tab text-[11px] font-body text-gray-fashion tracking-[0.15em] uppercase">Women</button>
        <button onclick="filterCategory('men')" class="cat-tab text-[11px] font-body text-gray-fashion tracking-[0.15em] uppercase">Men</button>
        <button onclick="filterCategory('accessories')" class="cat-tab text-[11px] font-body text-gray-fashion tracking-[0.15em] uppercase">Accessories</button>
      </nav>

      <div class="absolute left-1/2 -translate-x-1/2">
        <h1 class="font-editorial text-2xl md:text-3xl font-semibold tracking-[0.15em] text-noir cursor-pointer" onclick="scrollToTop()">MAISON NOIR</h1>
      </div>

      <div class="flex items-center gap-6 ml-auto">
        <button onclick="showToast('Search coming soon')" class="text-gray-fashion hover:text-noir transition-colors hidden md:block">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
        </button>
        <button onclick="showToast('Account — template demo')" class="text-gray-fashion hover:text-noir transition-colors hidden md:block">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </button>
        <button onclick="showToast('Wishlist — ' + wishlist.length + ' items')" class="text-gray-fashion hover:text-noir transition-colors relative">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <span id="wishlistCount" class="absolute -top-1.5 -right-2 w-4 h-4 bg-burgundy text-white text-[9px] font-body rounded-full flex items-center justify-center hidden">0</span>
        </button>
        <button onclick="showToast('Cart — template demo')" class="text-gray-fashion hover:text-noir transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        </button>
      </div>
    </div>
  </div>
</header>

<!-- ==================== 1. FULL-BLEED EDITORIAL HERO ==================== -->
<section class="relative min-h-screen flex items-end pt-20 overflow-hidden">
  <!-- Background -->
  <div class="absolute inset-0 bg-noir">
    <div class="absolute inset-0 bg-gradient-to-b from-noir/30 via-transparent to-noir/80"></div>
    <!-- Editorial geometric shapes as image placeholder -->
    <div class="absolute top-[15%] left-[10%] w-[35vw] h-[60vh] bg-gradient-to-br from-nude/20 to-warm/10 reveal-left" style="clip-path: polygon(0 0, 100% 5%, 95% 100%, 5% 95%);"></div>
    <div class="absolute top-[20%] right-[8%] w-[25vw] h-[50vh] bg-gradient-to-tl from-burgundy/15 to-nude/10 reveal-right" style="clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 95%);"></div>
    <div class="absolute bottom-[25%] left-[45%] w-[20vw] h-[30vh] bg-warm/8"></div>
  </div>

  <!-- Oversized typography overlay -->
  <div class="relative z-10 w-full pb-20 md:pb-32 px-6 md:px-10">
    <div class="max-w-[1400px] mx-auto">
      <div class="reveal stagger-1">
        <p class="font-body text-[10px] md:text-xs text-nude tracking-[0.3em] uppercase mb-4">Spring / Summer 2026 Collection</p>
      </div>
      <h2 class="hero-title font-editorial text-6xl md:text-8xl lg:text-[140px] text-offwhite font-light leading-[0.9] tracking-tight reveal stagger-2">
        The Art<br>
        <span class="italic font-light text-nude">of Quiet</span><br>
        Luxury
      </h2>
      <div class="mt-8 md:mt-12 flex items-center gap-8 reveal stagger-3">
        <button onclick="document.getElementById('editorial-spread').scrollIntoView({behavior:'smooth'})" class="font-body text-[11px] text-offwhite tracking-[0.15em] uppercase border-b border-offwhite/40 pb-1 hover:border-offwhite transition-colors">
          Explore Collection
        </button>
        <button onclick="document.getElementById('lookbook').scrollIntoView({behavior:'smooth'})" class="font-body text-[11px] text-nude/70 tracking-[0.15em] uppercase hover:text-nude transition-colors">
          View Lookbook
        </button>
      </div>
      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 reveal stagger-5">
        <span class="font-body text-[9px] text-offwhite/40 tracking-[0.2em] uppercase">Scroll</span>
        <div class="w-px h-10 bg-gradient-to-b from-offwhite/40 to-transparent"></div>
      </div>
    </div>
  </div>
</section>

<!-- ==================== 2. "NEW SEASON" EDITORIAL SPREAD ==================== -->
<section id="editorial-spread" class="py-24 md:py-40 px-6 md:px-10">
  <div class="max-w-[1400px] mx-auto">
    <!-- Asymmetric spread 1: Large image left, text right -->
    <div class="editorial-spread grid md:grid-cols-12 gap-6 md:gap-4 items-center mb-32">
      <div class="md:col-span-7 reveal-left">
        <div class="aspect-[4/5] bg-gradient-to-br from-warm to-cream relative overflow-hidden">
          <!-- Image placeholder with fashion silhouette SVG -->
          <svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 500" fill="none">
            <rect width="400" height="500" fill="url(#grad1)"/>
            <defs><linearGradient id="grad1" x1="0" y1="0" x2="400" y2="500"><stop offset="0%" stop-color="#E8E0D4"/><stop offset="100%" stop-color="#C8B098" stop-opacity="0.3"/></linearGradient></defs>
            <path d="M200 80 C180 80 165 100 165 130 L165 160 C165 170 170 180 180 185 L175 280 C170 320 155 380 150 420 L250 420 C245 380 230 320 225 280 L220 185 C230 180 235 170 235 160 L235 130 C235 100 220 80 200 80Z" fill="#C8B098" opacity="0.3"/>
            <ellipse cx="200" cy="65" rx="25" ry="30" fill="#C8B098" opacity="0.25"/>
          </svg>
          <div class="absolute bottom-8 left-8">
            <span class="font-body text-[9px] text-noir/50 tracking-[0.2em] uppercase">01 / New Season</span>
          </div>
        </div>
      </div>
      <div class="md:col-span-4 md:col-start-9 reveal stagger-2">
        <p class="font-body text-[10px] text-burgundy tracking-[0.2em] uppercase mb-4">New Arrivals</p>
        <h3 class="font-editorial text-4xl md:text-5xl italic font-light leading-tight mb-6">Understated<br>Elegance</h3>
        <div class="w-12 h-px bg-noir/20 mb-6"></div>
        <p class="font-body text-sm text-gray-fashion leading-relaxed mb-8">
          Our Spring/Summer 2026 collection embraces the philosophy of quiet luxury.
          Each piece is crafted from the finest materials, designed to speak through
          quality rather than logos. Merino wool from Italy, Japanese selvedge cotton,
          and hand-finished details define this season.
        </p>
        <button onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})" class="font-body text-[11px] text-noir tracking-[0.15em] uppercase border-b border-noir pb-1 hover:text-burgundy hover:border-burgundy transition-colors">
          Shop New Season
        </button>
      </div>
    </div>

    <!-- Asymmetric spread 2: Text left, image right -->
    <div class="editorial-spread grid md:grid-cols-12 gap-6 md:gap-4 items-center">
      <div class="md:col-span-4 md:col-start-2 order-2 md:order-1 reveal stagger-1">
        <p class="font-body text-[10px] text-gray-fashion tracking-[0.2em] uppercase mb-4">Craftsmanship</p>
        <h3 class="font-editorial text-4xl md:text-5xl font-light leading-tight mb-6">40 Steps<br><span class="italic">Per Garment</span></h3>
        <div class="w-12 h-px bg-noir/20 mb-6"></div>
        <p class="font-body text-sm text-gray-fashion leading-relaxed mb-4">
          From raw material to finished piece, every garment passes through
          at least forty steps of meticulous craftsmanship. Our ateliers in
          Taipei and Milan work in concert to create clothes that age
          beautifully, becoming more personal with every wear.
        </p>
        <p class="font-body text-sm text-gray-fashion leading-relaxed mb-8">
          We believe in the power of restraint. No excess ornamentation,
          no fleeting trends. Just pure, thoughtful design that
          transcends seasons.
        </p>
        <button onclick="document.getElementById('brand-story').scrollIntoView({behavior:'smooth'})" class="font-body text-[11px] text-noir tracking-[0.15em] uppercase border-b border-noir pb-1 hover:text-burgundy hover:border-burgundy transition-colors">
          Our Story
        </button>
      </div>
      <div class="md:col-span-6 md:col-start-7 order-1 md:order-2 reveal-right">
        <div class="aspect-[3/4] bg-gradient-to-tl from-noir/5 to-cream relative overflow-hidden">
          <svg class="absolute inset-0 w-full h-full" viewBox="0 0 300 400" fill="none">
            <rect width="300" height="400" fill="url(#grad2)"/>
            <defs><linearGradient id="grad2" x1="300" y1="0" x2="0" y2="400"><stop offset="0%" stop-color="#F5F0EB"/><stop offset="100%" stop-color="#E8E0D4"/></linearGradient></defs>
            <!-- Fabric drape suggestion -->
            <path d="M50 0 Q80 100 60 200 Q40 300 80 400" stroke="#C8B098" stroke-width="0.5" opacity="0.4"/>
            <path d="M100 0 Q130 120 110 240 Q90 360 120 400" stroke="#C8B098" stroke-width="0.5" opacity="0.3"/>
            <path d="M200 0 Q170 150 190 300 Q210 380 180 400" stroke="#C8B098" stroke-width="0.5" opacity="0.35"/>
            <path d="M250 0 Q220 100 240 200 Q260 300 230 400" stroke="#C8B098" stroke-width="0.5" opacity="0.25"/>
            <text x="150" y="200" text-anchor="middle" font-family="Cormorant Garamond" font-size="14" font-style="italic" fill="#C8B098" opacity="0.5">Atelier Detail</text>
          </svg>
          <div class="absolute bottom-8 right-8">
            <span class="font-body text-[9px] text-noir/50 tracking-[0.2em] uppercase">02 / Atelier</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ==================== 3. CATEGORY FILTER + PRODUCT GRID ==================== -->
<section id="products" class="py-20 px-6 md:px-10">
  <div class="max-w-[1400px] mx-auto">
    <!-- Section header -->
    <div class="text-center mb-16 reveal">
      <p class="font-body text-[10px] text-gray-fashion tracking-[0.3em] uppercase mb-3">Curated Selection</p>
      <h2 class="font-editorial text-4xl md:text-5xl font-light">The Edit</h2>
    </div>

    <!-- Category tabs -->
    <div class="flex items-center justify-center gap-8 md:gap-12 mb-16 reveal stagger-1" style="border-bottom: 0.5px solid #E8E0D4; padding-bottom: 16px;">
      <button onclick="filterCategory('all')" class="cat-tab active font-body text-[11px] tracking-[0.15em] uppercase text-noir" data-cat="all">All</button>
      <button onclick="filterCategory('women')" class="cat-tab font-body text-[11px] tracking-[0.15em] uppercase text-gray-fashion" data-cat="women">Women</button>
      <button onclick="filterCategory('men')" class="cat-tab font-body text-[11px] tracking-[0.15em] uppercase text-gray-fashion" data-cat="men">Men</button>
      <button onclick="filterCategory('accessories')" class="cat-tab font-body text-[11px] tracking-[0.15em] uppercase text-gray-fashion" data-cat="accessories">Accessories</button>
    </div>

    <!-- Product grid: 3-col editorial spacing -->
    <div id="productGrid" class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-16">

      <!-- Product 1 -->
      <div class="product-card reveal stagger-1" data-cat="women" onclick="openQuickView(0)">
        <div class="relative mb-5">
          <div class="card-img aspect-[3/4] bg-gradient-to-b from-cream to-warm relative">
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 300 400" fill="none">
              <rect width="300" height="400" fill="url(#pc1)"/>
              <defs><linearGradient id="pc1" x1="0" y1="0" x2="300" y2="400"><stop offset="0%" stop-color="#F5F0EB"/><stop offset="100%" stop-color="#E8E0D4"/></linearGradient></defs>
              <rect x="100" y="80" width="100" height="240" rx="4" fill="#C8B098" opacity="0.2"/>
              <rect x="110" y="100" width="80" height="40" rx="2" fill="#C8B098" opacity="0.15"/>
            </svg>
            <div class="absolute top-4 left-4 font-body text-[9px] tracking-[0.15em] uppercase text-burgundy bg-offwhite/90 px-2 py-1">New</div>
          </div>
          <div class="card-overlay absolute inset-0 bg-noir/10 flex items-end p-5">
            <button onclick="event.stopPropagation(); openQuickView(0)" class="w-full py-3 bg-offwhite text-noir font-body text-[11px] tracking-[0.12em] uppercase hover:bg-noir hover:text-offwhite transition-all">Quick View</button>
          </div>
          <button onclick="event.stopPropagation(); toggleWishlist(0)" class="wishlist-btn absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-offwhite/80 hover:bg-offwhite transition-colors" data-id="0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>
        </div>
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-body text-xs font-medium tracking-wide mb-1">Silk Draped Blouse</h3>
            <p class="font-body text-[11px] text-gray-fashion">NT$ 3,280</p>
          </div>
          <div class="flex gap-1.5 mt-1">
            <span class="swatch active" style="background:#F5F0EB; border: 1px solid #E8E0D4;" onclick="event.stopPropagation(); selectSwatch(this)" title="Ivory"></span>
            <span class="swatch" style="background:#1A1A1A;" onclick="event.stopPropagation(); selectSwatch(this)" title="Noir"></span>
            <span class="swatch" style="background:#C8B098;" onclick="event.stopPropagation(); selectSwatch(this)" title="Nude"></span>
          </div>
        </div>
      </div>

      <!-- Product 2 -->
      <div class="product-card reveal stagger-2" data-cat="women" onclick="openQuickView(1)">
        <div class="relative mb-5">
          <div class="card-img aspect-[3/4] bg-gradient-to-b from-offwhite to-cream relative">
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 300 400" fill="none">
              <rect width="300" height="400" fill="#F5F0EB"/>
              <path d="M120 90 L150 80 L180 90 L185 200 L175 350 L125 350 L115 200Z" fill="#C8B098" opacity="0.18"/>
              <ellipse cx="150" cy="65" rx="18" ry="22" fill="#C8B098" opacity="0.15"/>
            </svg>
          </div>
          <div class="card-overlay absolute inset-0 bg-noir/10 flex items-end p-5">
            <button onclick="event.stopPropagation(); openQuickView(1)" class="w-full py-3 bg-offwhite text-noir font-body text-[11px] tracking-[0.12em] uppercase hover:bg-noir hover:text-offwhite transition-all">Quick View</button>
          </div>
          <button onclick="event.stopPropagation(); toggleWishlist(1)" class="wishlist-btn absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-offwhite/80 hover:bg-offwhite transition-colors" data-id="1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>
        </div>
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-body text-xs font-medium tracking-wide mb-1">Wool Column Dress</h3>
            <p class="font-body text-[11px] text-gray-fashion">NT$ 5,680</p>
          </div>
          <div class="flex gap-1.5 mt-1">
            <span class="swatch active" style="background:#C8B098;" onclick="event.stopPropagation(); selectSwatch(this)" title="Camel"></span>
            <span class="swatch" style="background:#1A1A1A;" onclick="event.stopPropagation(); selectSwatch(this)" title="Noir"></span>
          </div>
        </div>
      </div>

      <!-- Product 3 -->
      <div class="product-card reveal stagger-3" data-cat="men" onclick="openQuickView(2)">
        <div class="relative mb-5">
          <div class="card-img aspect-[3/4] bg-gradient-to-b from-noir/5 to-warm relative">
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 300 400" fill="none">
              <rect width="300" height="400" fill="#F0EDE8"/>
              <rect x="90" y="80" width="120" height="260" rx="4" fill="#6B6B6B" opacity="0.12"/>
              <rect x="110" y="85" width="80" height="35" rx="2" fill="#6B6B6B" opacity="0.08"/>
              <line x1="150" y1="85" x2="150" y2="340" stroke="#6B6B6B" stroke-width="0.5" opacity="0.15"/>
            </svg>
            <div class="absolute top-4 left-4 font-body text-[9px] tracking-[0.15em] uppercase text-offwhite bg-noir/80 px-2 py-1">Bestseller</div>
          </div>
          <div class="card-overlay absolute inset-0 bg-noir/10 flex items-end p-5">
            <button onclick="event.stopPropagation(); openQuickView(2)" class="w-full py-3 bg-offwhite text-noir font-body text-[11px] tracking-[0.12em] uppercase hover:bg-noir hover:text-offwhite transition-all">Quick View</button>
          </div>
          <button onclick="event.stopPropagation(); toggleWishlist(2)" class="wishlist-btn absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-offwhite/80 hover:bg-offwhite transition-colors" data-id="2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>
        </div>
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-body text-xs font-medium tracking-wide mb-1">Deconstructed Trench</h3>
            <p class="font-body text-[11px] text-gray-fashion">NT$ 8,900</p>
          </div>
          <div class="flex gap-1.5 mt-1">
            <span class="swatch active" style="background:#C8B098;" onclick="event.stopPropagation(); selectSwatch(this)" title="Sand"></span>
            <span class="swatch" style="background:#1A1A1A;" onclick="event.stopPropagation(); selectSwatch(this)" title="Noir"></span>
          </div>
        </div>
      </div>

      <!-- Product 4 -->
      <div class="product-card reveal stagger-1" data-cat="accessories" onclick="openQuickView(3)">
        <div class="relative mb-5">
          <div class="card-img aspect-[3/4] bg-cream relative">
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 300 400" fill="none">
              <rect width="300" height="400" fill="#F5F0EB"/>
              <rect x="90" y="120" width="120" height="140" rx="8" fill="#C8B098" opacity="0.2"/>
              <path d="M120 120 Q150 80 180 120" stroke="#C8B098" stroke-width="1.5" fill="none" opacity="0.25"/>
            </svg>
          </div>
          <div class="card-overlay absolute inset-0 bg-noir/10 flex items-end p-5">
            <button onclick="event.stopPropagation(); openQuickView(3)" class="w-full py-3 bg-offwhite text-noir font-body text-[11px] tracking-[0.12em] uppercase hover:bg-noir hover:text-offwhite transition-all">Quick View</button>
          </div>
          <button onclick="event.stopPropagation(); toggleWishlist(3)" class="wishlist-btn absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-offwhite/80 hover:bg-offwhite transition-colors" data-id="3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>
        </div>
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-body text-xs font-medium tracking-wide mb-1">Vegetable-Tanned Tote</h3>
            <p class="font-body text-[11px] text-gray-fashion">NT$ 4,280</p>
          </div>
          <div class="flex gap-1.5 mt-1">
            <span class="swatch active" style="background:#C8B098;" onclick="event.stopPropagation(); selectSwatch(this)" title="Tan"></span>
            <span class="swatch" style="background:#1A1A1A;" onclick="event.stopPropagation(); selectSwatch(this)" title="Noir"></span>
          </div>
        </div>
      </div>

      <!-- Product 5 -->
      <div class="product-card reveal stagger-2" data-cat="men" onclick="openQuickView(4)">
        <div class="relative mb-5">
          <div class="card-img aspect-[3/4] bg-gradient-to-b from-warm/50 to-cream relative">
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 300 400" fill="none">
              <rect width="300" height="400" fill="#EFEBE5"/>
              <rect x="95" y="90" width="110" height="250" rx="4" fill="#C8B098" opacity="0.15"/>
              <path d="M130 90 L150 75 L170 90" stroke="#C8B098" stroke-width="1" fill="none" opacity="0.2"/>
              <line x1="150" y1="90" x2="150" y2="340" stroke="#6B6B6B" stroke-width="0.3" opacity="0.15"/>
            </svg>
          </div>
          <div class="card-overlay absolute inset-0 bg-noir/10 flex items-end p-5">
            <button onclick="event.stopPropagation(); openQuickView(4)" class="w-full py-3 bg-offwhite text-noir font-body text-[11px] tracking-[0.12em] uppercase hover:bg-noir hover:text-offwhite transition-all">Quick View</button>
          </div>
          <button onclick="event.stopPropagation(); toggleWishlist(4)" class="wishlist-btn absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-offwhite/80 hover:bg-offwhite transition-colors" data-id="4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>
        </div>
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-body text-xs font-medium tracking-wide mb-1">Linen Unstructured Blazer</h3>
            <p class="font-body text-[11px] text-gray-fashion">NT$ 6,480</p>
          </div>
          <div class="flex gap-1.5 mt-1">
            <span class="swatch active" style="background:#E8E0D4;" onclick="event.stopPropagation(); selectSwatch(this)" title="Sand"></span>
            <span class="swatch" style="background:#6B6B6B;" onclick="event.stopPropagation(); selectSwatch(this)" title="Charcoal"></span>
          </div>
        </div>
      </div>

      <!-- Product 6 -->
      <div class="product-card reveal stagger-3" data-cat="women" onclick="openQuickView(5)">
        <div class="relative mb-5">
          <div class="card-img aspect-[3/4] bg-offwhite relative">
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 300 400" fill="none">
              <rect width="300" height="400" fill="#FAFAF5"/>
              <path d="M110 100 Q150 90 190 100 Q195 120 195 180 Q190 220 150 230 Q110 220 105 180 Q105 120 110 100Z" fill="#C8B098" opacity="0.15"/>
              <path d="M130 230 L120 360 M170 230 L180 360" stroke="#C8B098" stroke-width="1" opacity="0.12"/>
            </svg>
          </div>
          <div class="card-overlay absolute inset-0 bg-noir/10 flex items-end p-5">
            <button onclick="event.stopPropagation(); openQuickView(5)" class="w-full py-3 bg-offwhite text-noir font-body text-[11px] tracking-[0.12em] uppercase hover:bg-noir hover:text-offwhite transition-all">Quick View</button>
          </div>
          <button onclick="event.stopPropagation(); toggleWishlist(5)" class="wishlist-btn absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-offwhite/80 hover:bg-offwhite transition-colors" data-id="5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>
        </div>
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-body text-xs font-medium tracking-wide mb-1">Cashmere Cocoon Knit</h3>
            <p class="font-body text-[11px] text-gray-fashion">NT$ 4,980</p>
          </div>
          <div class="flex gap-1.5 mt-1">
            <span class="swatch active" style="background:#E8E0D4;" onclick="event.stopPropagation(); selectSwatch(this)" title="Oatmeal"></span>
            <span class="swatch" style="background:#8B0000;" onclick="event.stopPropagation(); selectSwatch(this)" title="Burgundy"></span>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>

<!-- ==================== 4. SHOP THE LOOK ==================== -->
<section id="shop-the-look" class="py-24 md:py-32 bg-noir text-offwhite">
  <div class="max-w-[1400px] mx-auto px-6 md:px-10">
    <div class="text-center mb-16 reveal">
      <p class="font-body text-[10px] text-nude/60 tracking-[0.3em] uppercase mb-3">Style Guide</p>
      <h2 class="font-editorial text-4xl md:text-5xl font-light italic">Shop the Look</h2>
    </div>

    <div class="grid md:grid-cols-12 gap-8 items-start">
      <!-- Look image with hotspots -->
      <div class="md:col-span-7 relative reveal-left">
        <div class="aspect-[3/4] bg-gradient-to-br from-noir to-gray-fashion/30 relative overflow-hidden" id="lookImage">
          <!-- Outfit silhouette -->
          <svg class="absolute inset-0 w-full h-full" viewBox="0 0 500 667" fill="none">
            <defs>
              <linearGradient id="lookGrad" x1="0" y1="0" x2="500" y2="667">
                <stop offset="0%" stop-color="#2A2A2A"/>
                <stop offset="100%" stop-color="#1A1A1A"/>
              </linearGradient>
            </defs>
            <rect width="500" height="667" fill="url(#lookGrad)"/>
            <!-- Stylized figure outline -->
            <ellipse cx="250" cy="100" rx="35" ry="45" stroke="#C8B098" stroke-width="0.8" fill="none" opacity="0.3"/>
            <path d="M215 145 Q200 150 195 200 L190 320 Q188 340 200 345 L210 350 L210 550 L225 555 L230 350 L250 345 L270 350 L275 555 L290 550 L290 350 L300 345 Q312 340 310 320 L305 200 Q300 150 285 145Z" stroke="#C8B098" stroke-width="0.8" fill="none" opacity="0.3"/>
          </svg>

          <!-- Hotspots -->
          <div class="look-hotspot" style="top: 18%; left: 45%;" onclick="showLookItem(0)" data-item="0" title="Cashmere Scarf"></div>
          <div class="look-hotspot" style="top: 32%; left: 42%;" onclick="showLookItem(1)" data-item="1" title="Silk Blouse"></div>
          <div class="look-hotspot" style="top: 50%; left: 48%;" onclick="showLookItem(2)" data-item="2" title="Tailored Trousers"></div>
          <div class="look-hotspot" style="top: 42%; left: 55%;" onclick="showLookItem(3)" data-item="3" title="Leather Belt"></div>
          <div class="look-hotspot" style="top: 78%; left: 46%;" onclick="showLookItem(4)" data-item="4" title="Leather Derby Shoes"></div>
        </div>
      </div>

      <!-- Look items panel -->
      <div class="md:col-span-5 reveal stagger-2">
        <p class="font-body text-[10px] text-nude/50 tracking-[0.15em] uppercase mb-6">Click hotspots to explore</p>
        <div id="lookItemsContainer" class="space-y-4">
          <!-- Default state -->
          <div id="lookDefault" class="py-12 text-center">
            <p class="font-editorial text-xl italic text-offwhite/30">Select a piece to discover</p>
          </div>

          <!-- Item cards (hidden by default) -->
          <div class="look-item-card hidden" data-look-item="0">
            <div class="flex gap-5 p-5" style="border: 0.5px solid rgba(200,176,152,0.2);">
              <div class="w-24 h-32 bg-gradient-to-b from-warm/10 to-nude/5 flex-shrink-0 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><path d="M5 20 Q20 5 35 20 Q20 35 5 20Z" stroke="#C8B098" stroke-width="0.8" opacity="0.5"/></svg>
              </div>
              <div class="flex-1">
                <h4 class="font-body text-xs font-medium tracking-wide text-offwhite mb-1">Cashmere Wrap Scarf</h4>
                <p class="font-body text-[11px] text-nude/60 mb-3">100% Mongolian Cashmere</p>
                <p class="font-body text-sm text-offwhite mb-4">NT$ 2,680</p>
                <button onclick="showToast('Added to your wishlist')" class="font-body text-[10px] text-nude tracking-[0.1em] uppercase border-b border-nude/30 pb-0.5 hover:border-nude transition-colors">Add to Wishlist</button>
              </div>
            </div>
          </div>

          <div class="look-item-card hidden" data-look-item="1">
            <div class="flex gap-5 p-5" style="border: 0.5px solid rgba(200,176,152,0.2);">
              <div class="w-24 h-32 bg-gradient-to-b from-cream/10 to-warm/5 flex-shrink-0 flex items-center justify-center">
                <svg width="40" height="50" viewBox="0 0 40 50" fill="none"><rect x="5" y="5" width="30" height="40" rx="2" stroke="#C8B098" stroke-width="0.8" opacity="0.5"/></svg>
              </div>
              <div class="flex-1">
                <h4 class="font-body text-xs font-medium tracking-wide text-offwhite mb-1">Silk Draped Blouse</h4>
                <p class="font-body text-[11px] text-nude/60 mb-3">Italian Silk Charmeuse</p>
                <p class="font-body text-sm text-offwhite mb-4">NT$ 3,280</p>
                <button onclick="showToast('Added to your wishlist')" class="font-body text-[10px] text-nude tracking-[0.1em] uppercase border-b border-nude/30 pb-0.5 hover:border-nude transition-colors">Add to Wishlist</button>
              </div>
            </div>
          </div>

          <div class="look-item-card hidden" data-look-item="2">
            <div class="flex gap-5 p-5" style="border: 0.5px solid rgba(200,176,152,0.2);">
              <div class="w-24 h-32 bg-gradient-to-b from-noir/30 to-gray-fashion/10 flex-shrink-0 flex items-center justify-center">
                <svg width="40" height="50" viewBox="0 0 40 50" fill="none"><rect x="8" y="5" width="24" height="40" rx="1" stroke="#C8B098" stroke-width="0.8" opacity="0.5"/><line x1="20" y1="5" x2="20" y2="45" stroke="#C8B098" stroke-width="0.3" opacity="0.3"/></svg>
              </div>
              <div class="flex-1">
                <h4 class="font-body text-xs font-medium tracking-wide text-offwhite mb-1">High-Waist Tailored Trousers</h4>
                <p class="font-body text-[11px] text-nude/60 mb-3">Wool-Blend Gabardine</p>
                <p class="font-body text-sm text-offwhite mb-4">NT$ 4,580</p>
                <button onclick="showToast('Added to your wishlist')" class="font-body text-[10px] text-nude tracking-[0.1em] uppercase border-b border-nude/30 pb-0.5 hover:border-nude transition-colors">Add to Wishlist</button>
              </div>
            </div>
          </div>

          <div class="look-item-card hidden" data-look-item="3">
            <div class="flex gap-5 p-5" style="border: 0.5px solid rgba(200,176,152,0.2);">
              <div class="w-24 h-32 bg-gradient-to-b from-nude/10 to-warm/5 flex-shrink-0 flex items-center justify-center">
                <svg width="40" height="10" viewBox="0 0 40 10" fill="none"><rect x="0" y="2" width="40" height="6" rx="3" stroke="#C8B098" stroke-width="0.8" opacity="0.5"/></svg>
              </div>
              <div class="flex-1">
                <h4 class="font-body text-xs font-medium tracking-wide text-offwhite mb-1">Leather Minimal Belt</h4>
                <p class="font-body text-[11px] text-nude/60 mb-3">Vegetable-Tanned Leather</p>
                <p class="font-body text-sm text-offwhite mb-4">NT$ 1,680</p>
                <button onclick="showToast('Added to your wishlist')" class="font-body text-[10px] text-nude tracking-[0.1em] uppercase border-b border-nude/30 pb-0.5 hover:border-nude transition-colors">Add to Wishlist</button>
              </div>
            </div>
          </div>

          <div class="look-item-card hidden" data-look-item="4">
            <div class="flex gap-5 p-5" style="border: 0.5px solid rgba(200,176,152,0.2);">
              <div class="w-24 h-32 bg-gradient-to-b from-warm/10 to-noir/20 flex-shrink-0 flex items-center justify-center">
                <svg width="40" height="30" viewBox="0 0 40 30" fill="none"><ellipse cx="20" cy="20" rx="16" ry="8" stroke="#C8B098" stroke-width="0.8" opacity="0.5"/><path d="M10 20 Q20 8 30 20" stroke="#C8B098" stroke-width="0.8" fill="none" opacity="0.4"/></svg>
              </div>
              <div class="flex-1">
                <h4 class="font-body text-xs font-medium tracking-wide text-offwhite mb-1">Hand-Stitched Derby Shoes</h4>
                <p class="font-body text-[11px] text-nude/60 mb-3">Full-Grain Calfskin</p>
                <p class="font-body text-sm text-offwhite mb-4">NT$ 7,200</p>
                <button onclick="showToast('Added to your wishlist')" class="font-body text-[10px] text-nude tracking-[0.1em] uppercase border-b border-nude/30 pb-0.5 hover:border-nude transition-colors">Add to Wishlist</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Total look -->
        <div class="mt-8 pt-6" style="border-top: 0.5px solid rgba(200,176,152,0.15);">
          <div class="flex items-center justify-between mb-4">
            <span class="font-body text-[11px] text-nude/50 tracking-[0.1em] uppercase">Complete Look</span>
            <span class="font-body text-sm text-offwhite">NT$ 19,420</span>
          </div>
          <button onclick="showToast('Complete look added to cart')" class="w-full py-3.5 bg-offwhite text-noir font-body text-[11px] tracking-[0.12em] uppercase hover:bg-nude transition-colors">
            Shop Complete Look
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ==================== 5. LOOKBOOK HORIZONTAL SCROLL ==================== -->
<section id="lookbook" class="py-24 md:py-32 overflow-hidden">
  <div class="max-w-[1400px] mx-auto px-6 md:px-10 mb-12 reveal">
    <div class="flex items-end justify-between">
      <div>
        <p class="font-body text-[10px] text-gray-fashion tracking-[0.3em] uppercase mb-3">SS26</p>
        <h2 class="font-editorial text-4xl md:text-5xl font-light">Lookbook</h2>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="scrollLookbook(-1)" class="w-10 h-10 flex items-center justify-center border border-noir/20 hover:border-noir transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <button onclick="scrollLookbook(1)" class="w-10 h-10 flex items-center justify-center border border-noir/20 hover:border-noir transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  </div>

  <div class="lookbook-scroll pl-6 md:pl-10" id="lookbookScroll">
    <div class="lookbook-item w-[60vw] md:w-[35vw]">
      <div class="aspect-[3/4] bg-gradient-to-br from-cream to-warm relative overflow-hidden group cursor-pointer">
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 350 467" fill="none">
          <rect width="350" height="467" fill="#E8E0D4"/>
          <text x="175" y="220" text-anchor="middle" font-family="Cormorant Garamond" font-size="18" font-style="italic" fill="#C8B098" opacity="0.6">Look 01</text>
          <path d="M175 260 L175 400" stroke="#C8B098" stroke-width="0.5" opacity="0.3"/>
        </svg>
        <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-noir/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <p class="font-editorial text-lg italic text-offwhite">Morning Light</p>
          <p class="font-body text-[10px] text-offwhite/70 tracking-[0.1em] mt-1">Silk &middot; Cashmere &middot; Ivory</p>
        </div>
      </div>
    </div>

    <div class="lookbook-item w-[60vw] md:w-[35vw]">
      <div class="aspect-[3/4] bg-gradient-to-br from-noir to-gray-fashion/60 relative overflow-hidden group cursor-pointer">
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 350 467" fill="none">
          <rect width="350" height="467" fill="#2A2A2A"/>
          <text x="175" y="220" text-anchor="middle" font-family="Cormorant Garamond" font-size="18" font-style="italic" fill="#C8B098" opacity="0.5">Look 02</text>
          <path d="M175 260 L175 400" stroke="#C8B098" stroke-width="0.5" opacity="0.2"/>
        </svg>
        <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-noir/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <p class="font-editorial text-lg italic text-offwhite">After Dark</p>
          <p class="font-body text-[10px] text-offwhite/70 tracking-[0.1em] mt-1">Wool &middot; Leather &middot; Noir</p>
        </div>
      </div>
    </div>

    <div class="lookbook-item w-[60vw] md:w-[35vw]">
      <div class="aspect-[3/4] bg-gradient-to-br from-nude/30 to-cream relative overflow-hidden group cursor-pointer">
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 350 467" fill="none">
          <rect width="350" height="467" fill="#E0D5C8"/>
          <text x="175" y="220" text-anchor="middle" font-family="Cormorant Garamond" font-size="18" font-style="italic" fill="#8B6914" opacity="0.4">Look 03</text>
          <path d="M175 260 L175 400" stroke="#C8B098" stroke-width="0.5" opacity="0.3"/>
        </svg>
        <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-noir/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <p class="font-editorial text-lg italic text-offwhite">Golden Hour</p>
          <p class="font-body text-[10px] text-offwhite/70 tracking-[0.1em] mt-1">Linen &middot; Cotton &middot; Sand</p>
        </div>
      </div>
    </div>

    <div class="lookbook-item w-[60vw] md:w-[35vw]">
      <div class="aspect-[3/4] bg-gradient-to-br from-burgundy/20 to-noir relative overflow-hidden group cursor-pointer">
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 350 467" fill="none">
          <rect width="350" height="467" fill="#2E1010"/>
          <text x="175" y="220" text-anchor="middle" font-family="Cormorant Garamond" font-size="18" font-style="italic" fill="#C8B098" opacity="0.5">Look 04</text>
          <path d="M175 260 L175 400" stroke="#8B0000" stroke-width="0.5" opacity="0.3"/>
        </svg>
        <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-noir/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <p class="font-editorial text-lg italic text-offwhite">Velvet Night</p>
          <p class="font-body text-[10px] text-offwhite/70 tracking-[0.1em] mt-1">Velvet &middot; Silk &middot; Burgundy</p>
        </div>
      </div>
    </div>

    <div class="lookbook-item w-[60vw] md:w-[35vw]">
      <div class="aspect-[3/4] bg-gradient-to-br from-offwhite to-warm relative overflow-hidden group cursor-pointer">
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 350 467" fill="none">
          <rect width="350" height="467" fill="#F5F0EB"/>
          <text x="175" y="220" text-anchor="middle" font-family="Cormorant Garamond" font-size="18" font-style="italic" fill="#C8B098" opacity="0.5">Look 05</text>
          <path d="M175 260 L175 400" stroke="#C8B098" stroke-width="0.5" opacity="0.3"/>
        </svg>
        <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-noir/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <p class="font-editorial text-lg italic text-offwhite">Sunday Ease</p>
          <p class="font-body text-[10px] text-offwhite/70 tracking-[0.1em] mt-1">Cashmere &middot; Wool &middot; Cream</p>
        </div>
      </div>
    </div>

    <!-- Spacer -->
    <div class="lookbook-item w-6 md:w-10 flex-shrink-0"></div>
  </div>
</section>

<!-- ==================== 6. SIZE GUIDE WITH BODY SVG ==================== -->
<section id="size-guide" class="py-24 md:py-32 bg-offwhite px-6 md:px-10">
  <div class="max-w-[1400px] mx-auto">
    <div class="text-center mb-16 reveal">
      <p class="font-body text-[10px] text-gray-fashion tracking-[0.3em] uppercase mb-3">Fit & Measurements</p>
      <h2 class="font-editorial text-4xl md:text-5xl font-light italic">Size Guide</h2>
    </div>

    <div class="grid md:grid-cols-2 gap-16 items-center">
      <!-- Body silhouette SVG -->
      <div class="relative flex justify-center reveal-up" id="sizeGuideContainer">
        <svg viewBox="0 0 300 600" width="280" height="560" class="mx-auto">
          <!-- Body outline -->
          <!-- Head -->
          <ellipse class="body-part" data-part="head" cx="150" cy="45" rx="28" ry="35" fill="#E8E0D4" stroke="#C8B098" stroke-width="0.8" onclick="showMeasurement('head', this)"/>
          <!-- Neck -->
          <rect class="body-part" data-part="neck" x="140" y="78" width="20" height="22" rx="4" fill="#E8E0D4" stroke="#C8B098" stroke-width="0.8" onclick="showMeasurement('neck', this)"/>
          <!-- Shoulders & Chest -->
          <path class="body-part" data-part="chest" d="M95 100 Q100 95 140 98 L160 98 Q200 95 205 100 L210 140 Q212 175 200 200 L100 200 Q88 175 90 140 Z" fill="#E8E0D4" stroke="#C8B098" stroke-width="0.8" onclick="showMeasurement('chest', this)"/>
          <!-- Waist -->
          <path class="body-part" data-part="waist" d="M100 200 Q110 195 150 198 Q190 195 200 200 L195 250 Q185 255 150 252 Q115 255 105 250 Z" fill="#E8E0D4" stroke="#C8B098" stroke-width="0.8" onclick="showMeasurement('waist', this)"/>
          <!-- Hips -->
          <path class="body-part" data-part="hips" d="M105 250 Q100 260 95 300 Q93 320 100 330 L150 335 L200 330 Q207 320 205 300 Q200 260 195 250 Z" fill="#E8E0D4" stroke="#C8B098" stroke-width="0.8" onclick="showMeasurement('hips', this)"/>
          <!-- Left leg -->
          <path class="body-part" data-part="inseam" d="M100 330 L95 440 Q93 480 95 530 L105 535 Q110 530 112 480 L115 440 L125 335 Z" fill="#E8E0D4" stroke="#C8B098" stroke-width="0.8" onclick="showMeasurement('inseam', this)"/>
          <!-- Right leg -->
          <path class="body-part" data-part="inseam" d="M200 330 L205 440 Q207 480 205 530 L195 535 Q190 530 188 480 L185 440 L175 335 Z" fill="#E8E0D4" stroke="#C8B098" stroke-width="0.8" onclick="showMeasurement('inseam', this)"/>
          <!-- Left arm -->
          <path class="body-part" data-part="sleeve" d="M95 100 L72 115 Q55 130 45 180 L40 240 Q38 255 45 258 L55 255 Q58 240 60 200 L70 155 L90 130 Z" fill="#E8E0D4" stroke="#C8B098" stroke-width="0.8" onclick="showMeasurement('sleeve', this)"/>
          <!-- Right arm -->
          <path class="body-part" data-part="sleeve" d="M205 100 L228 115 Q245 130 255 180 L260 240 Q262 255 255 258 L245 255 Q242 240 240 200 L230 155 L210 130 Z" fill="#E8E0D4" stroke="#C8B098" stroke-width="0.8" onclick="showMeasurement('sleeve', this)"/>

          <!-- Measurement guide lines (subtle) -->
          <line x1="80" y1="100" x2="220" y2="100" stroke="#8B0000" stroke-width="0.3" stroke-dasharray="4 4" opacity="0.3"/>
          <line x1="95" y1="200" x2="205" y2="200" stroke="#8B0000" stroke-width="0.3" stroke-dasharray="4 4" opacity="0.3"/>
          <line x1="90" y1="300" x2="210" y2="300" stroke="#8B0000" stroke-width="0.3" stroke-dasharray="4 4" opacity="0.3"/>
        </svg>

        <!-- Measurement tooltip -->
        <div class="measurement-tooltip" id="measurementTooltip"></div>
      </div>

      <!-- Size table -->
      <div class="reveal stagger-2">
        <p class="font-body text-sm text-gray-fashion leading-relaxed mb-8">
          Hover over body parts to see measurement points. Our garments follow a relaxed,
          modern fit. If between sizes, we recommend sizing down for a structured silhouette
          or sizing up for a relaxed drape.
        </p>

        <div class="overflow-x-auto">
          <table class="w-full font-body text-xs">
            <thead>
              <tr style="border-bottom: 0.5px solid #E8E0D4;">
                <th class="text-left py-3 pr-4 font-medium tracking-[0.1em] uppercase text-gray-fashion text-[10px]">Size</th>
                <th class="text-center py-3 px-3 font-medium tracking-[0.1em] uppercase text-gray-fashion text-[10px]">Chest</th>
                <th class="text-center py-3 px-3 font-medium tracking-[0.1em] uppercase text-gray-fashion text-[10px]">Waist</th>
                <th class="text-center py-3 px-3 font-medium tracking-[0.1em] uppercase text-gray-fashion text-[10px]">Hips</th>
                <th class="text-center py-3 pl-3 font-medium tracking-[0.1em] uppercase text-gray-fashion text-[10px]">Sleeve</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 0.5px solid #E8E0D4;">
                <td class="py-3 pr-4 font-medium">XS</td>
                <td class="py-3 px-3 text-center text-gray-fashion">80-84</td>
                <td class="py-3 px-3 text-center text-gray-fashion">62-66</td>
                <td class="py-3 px-3 text-center text-gray-fashion">86-90</td>
                <td class="py-3 pl-3 text-center text-gray-fashion">58</td>
              </tr>
              <tr style="border-bottom: 0.5px solid #E8E0D4;">
                <td class="py-3 pr-4 font-medium">S</td>
                <td class="py-3 px-3 text-center text-gray-fashion">84-88</td>
                <td class="py-3 px-3 text-center text-gray-fashion">66-70</td>
                <td class="py-3 px-3 text-center text-gray-fashion">90-94</td>
                <td class="py-3 pl-3 text-center text-gray-fashion">59</td>
              </tr>
              <tr style="border-bottom: 0.5px solid #E8E0D4;">
                <td class="py-3 pr-4 font-medium">M</td>
                <td class="py-3 px-3 text-center text-gray-fashion">88-92</td>
                <td class="py-3 px-3 text-center text-gray-fashion">70-74</td>
                <td class="py-3 px-3 text-center text-gray-fashion">94-98</td>
                <td class="py-3 pl-3 text-center text-gray-fashion">60</td>
              </tr>
              <tr style="border-bottom: 0.5px solid #E8E0D4;">
                <td class="py-3 pr-4 font-medium">L</td>
                <td class="py-3 px-3 text-center text-gray-fashion">92-96</td>
                <td class="py-3 px-3 text-center text-gray-fashion">74-78</td>
                <td class="py-3 px-3 text-center text-gray-fashion">98-102</td>
                <td class="py-3 pl-3 text-center text-gray-fashion">61</td>
              </tr>
              <tr>
                <td class="py-3 pr-4 font-medium">XL</td>
                <td class="py-3 px-3 text-center text-gray-fashion">96-100</td>
                <td class="py-3 px-3 text-center text-gray-fashion">78-82</td>
                <td class="py-3 px-3 text-center text-gray-fashion">102-106</td>
                <td class="py-3 pl-3 text-center text-gray-fashion">62</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="font-body text-[10px] text-gray-fashion/60 mt-4">All measurements in centimeters (cm)</p>

        <div class="mt-8 p-5 bg-cream/50" style="border: 0.5px solid #E8E0D4;">
          <div class="flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B0000" stroke-width="1.2" class="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            <div>
              <p class="font-body text-xs font-medium mb-1">Need Help?</p>
              <p class="font-body text-[11px] text-gray-fashion leading-relaxed">Our stylists are available to help you find the perfect fit. Contact us for personalized sizing advice.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ==================== 7. BRAND STORY ==================== -->
<section id="brand-story" class="py-28 md:py-40 px-6 md:px-10">
  <div class="max-w-[600px] mx-auto text-center">
    <div class="reveal">
      <div class="w-px h-16 bg-noir/15 mx-auto mb-10"></div>
      <p class="font-body text-[10px] text-gray-fashion tracking-[0.3em] uppercase mb-8">Our Philosophy</p>
    </div>
    <blockquote class="font-editorial text-3xl md:text-4xl italic font-light leading-snug mb-8 reveal stagger-1">
      "Less noise,<br>more substance."
    </blockquote>
    <div class="w-12 h-px bg-burgundy mx-auto mb-8 reveal stagger-2"></div>
    <p class="font-body text-sm text-gray-fashion leading-[1.8] mb-6 reveal stagger-2">
      Maison Noir was born from a simple belief: good clothes don't need to shout.
      We pursue quiet quality &mdash; felt in the cut, touched in the fabric.
      Every piece passes through at least forty steps of meticulous craftsmanship,
      from raw material to finished garment.
    </p>
    <p class="font-body text-sm text-gray-fashion leading-[1.8] mb-10 reveal stagger-3">
      Our ateliers in Taipei and Milan work in concert, blending Eastern restraint
      with Mediterranean warmth. The result is clothing that transcends seasons and trends,
      becoming more personal with every wear. We don't make fashion. We make companions.
    </p>
    <div class="reveal stagger-4">
      <button onclick="showToast('Brand story page — template demo')" class="font-body text-[11px] text-noir tracking-[0.15em] uppercase border-b border-noir pb-1 hover:text-burgundy hover:border-burgundy transition-colors">
        Read Full Story
      </button>
    </div>
    <div class="reveal stagger-5">
      <div class="w-px h-16 bg-noir/15 mx-auto mt-10"></div>
    </div>
  </div>
</section>

<!-- ==================== 8. NEWSLETTER SPLIT DESIGN ==================== -->
<section class="bg-noir text-offwhite">
  <div class="grid md:grid-cols-2 min-h-[500px]">
    <!-- Left: Image -->
    <div class="relative overflow-hidden reveal-left">
      <div class="absolute inset-0 bg-gradient-to-br from-burgundy/20 to-noir">
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 600 500" fill="none">
          <defs>
            <linearGradient id="nlGrad" x1="0" y1="0" x2="600" y2="500">
              <stop offset="0%" stop-color="#3A1010"/>
              <stop offset="100%" stop-color="#1A1A1A"/>
            </linearGradient>
          </defs>
          <rect width="600" height="500" fill="url(#nlGrad)"/>
          <text x="300" y="230" text-anchor="middle" font-family="Cormorant Garamond" font-size="48" font-style="italic" fill="#C8B098" opacity="0.12">MAISON</text>
          <text x="300" y="280" text-anchor="middle" font-family="Cormorant Garamond" font-size="48" font-style="italic" fill="#C8B098" opacity="0.12">NOIR</text>
          <line x1="200" y1="300" x2="400" y2="300" stroke="#C8B098" stroke-width="0.5" opacity="0.1"/>
        </svg>
      </div>
    </div>

    <!-- Right: Form -->
    <div class="flex items-center justify-center p-12 md:p-20 reveal stagger-2">
      <div class="max-w-sm w-full">
        <p class="font-body text-[10px] text-nude/50 tracking-[0.3em] uppercase mb-4">Join the Maison</p>
        <h2 class="font-editorial text-3xl md:text-4xl italic font-light mb-6">Stay in the Know</h2>
        <p class="font-body text-sm text-offwhite/50 leading-relaxed mb-8">
          Be the first to discover new collections, exclusive editorials, and members-only events.
          No spam, just inspiration.
        </p>
        <div class="space-y-3 mb-6">
          <input type="email" placeholder="Your email address" class="w-full px-0 py-3 bg-transparent border-b border-offwhite/20 text-offwhite font-body text-sm focus:outline-none focus:border-nude transition-colors placeholder:text-offwhite/25" id="nlEmail">
          <button onclick="submitNewsletter()" class="w-full py-3.5 bg-offwhite text-noir font-body text-[11px] tracking-[0.12em] uppercase hover:bg-nude transition-colors mt-4">
            Subscribe
          </button>
        </div>
        <p class="font-body text-[10px] text-offwhite/25 leading-relaxed">
          By subscribing, you agree to our Privacy Policy. You can unsubscribe at any time.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- ==================== FOOTER ==================== -->
<footer style="border-top: 0.5px solid #E8E0D4;" class="py-16 px-6 md:px-10 bg-offwhite">
  <div class="max-w-[1400px] mx-auto">
    <div class="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
      <!-- Brand -->
      <div class="col-span-2 md:col-span-1">
        <h3 class="font-editorial text-xl font-semibold tracking-[0.1em] mb-4">MAISON NOIR</h3>
        <p class="font-body text-[11px] text-gray-fashion leading-relaxed">Less noise, more substance.<br>Taipei &middot; Milan</p>
      </div>
      <!-- Shop -->
      <div>
        <h4 class="font-body text-[10px] font-medium tracking-[0.15em] uppercase mb-4 text-noir">Shop</h4>
        <div class="space-y-2.5">
          <a onclick="filterCategory('women')" class="block font-body text-[11px] text-gray-fashion hover:text-noir cursor-pointer transition-colors">Women</a>
          <a onclick="filterCategory('men')" class="block font-body text-[11px] text-gray-fashion hover:text-noir cursor-pointer transition-colors">Men</a>
          <a onclick="filterCategory('accessories')" class="block font-body text-[11px] text-gray-fashion hover:text-noir cursor-pointer transition-colors">Accessories</a>
          <a onclick="showToast('New Arrivals')" class="block font-body text-[11px] text-gray-fashion hover:text-noir cursor-pointer transition-colors">New Arrivals</a>
        </div>
      </div>
      <!-- Service -->
      <div>
        <h4 class="font-body text-[10px] font-medium tracking-[0.15em] uppercase mb-4 text-noir">Service</h4>
        <div class="space-y-2.5">
          <a onclick="showToast('Shipping info')" class="block font-body text-[11px] text-gray-fashion hover:text-noir cursor-pointer transition-colors">Shipping</a>
          <a onclick="showToast('Returns & exchanges')" class="block font-body text-[11px] text-gray-fashion hover:text-noir cursor-pointer transition-colors">Returns</a>
          <a onclick="document.getElementById('size-guide').scrollIntoView({behavior:'smooth'})" class="block font-body text-[11px] text-gray-fashion hover:text-noir cursor-pointer transition-colors">Size Guide</a>
          <a onclick="showToast('Care instructions')" class="block font-body text-[11px] text-gray-fashion hover:text-noir cursor-pointer transition-colors">Care Guide</a>
        </div>
      </div>
      <!-- About -->
      <div>
        <h4 class="font-body text-[10px] font-medium tracking-[0.15em] uppercase mb-4 text-noir">About</h4>
        <div class="space-y-2.5">
          <a onclick="document.getElementById('brand-story').scrollIntoView({behavior:'smooth'})" class="block font-body text-[11px] text-gray-fashion hover:text-noir cursor-pointer transition-colors">Our Story</a>
          <a onclick="showToast('Atelier page')" class="block font-body text-[11px] text-gray-fashion hover:text-noir cursor-pointer transition-colors">Atelier</a>
          <a onclick="showToast('Sustainability')" class="block font-body text-[11px] text-gray-fashion hover:text-noir cursor-pointer transition-colors">Sustainability</a>
          <a onclick="showToast('Careers')" class="block font-body text-[11px] text-gray-fashion hover:text-noir cursor-pointer transition-colors">Careers</a>
        </div>
      </div>
      <!-- Social -->
      <div>
        <h4 class="font-body text-[10px] font-medium tracking-[0.15em] uppercase mb-4 text-noir">Follow</h4>
        <div class="flex items-center gap-4">
          <a onclick="showToast('Instagram')" class="cursor-pointer text-gray-fashion hover:text-noir transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
          </a>
          <a onclick="showToast('Pinterest')" class="cursor-pointer text-gray-fashion hover:text-noir transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><path d="M8 21c1-3 2-5 3-8M9 14c-.5 2.5 1 4 3 4 3.5 0 5-3 5-6 0-3.5-3-6-6.5-6C7 6 5 8.5 5 11c0 1.5.5 2.5 1.5 3"/></svg>
          </a>
          <a onclick="showToast('WeChat')" class="cursor-pointer text-gray-fashion hover:text-noir transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M9 3C5.1 3 2 5.7 2 9c0 1.8 1 3.4 2.5 4.5L4 16l2.5-1.2c.8.3 1.6.4 2.5.4"/><path d="M15 8c-3.3 0-6 2.2-6 5s2.7 5 6 5c.7 0 1.4-.1 2-.3L19.5 19l-.5-2.2C20.3 15.8 21 14.5 21 13c0-2.8-2.7-5-6-5z"/><circle cx="7" cy="8" r="0.8" fill="currentColor"/><circle cx="11" cy="8" r="0.8" fill="currentColor"/><circle cx="13" cy="12" r="0.8" fill="currentColor"/><circle cx="17" cy="12" r="0.8" fill="currentColor"/></svg>
          </a>
        </div>
      </div>
    </div>
    <div style="border-top: 0.5px solid #E8E0D4;" class="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="font-body text-[10px] text-gray-fashion/50">&copy; 2026 Maison Noir. All rights reserved.</p>
      <div class="flex items-center gap-6">
        <a onclick="showToast('Privacy Policy')" class="font-body text-[10px] text-gray-fashion/50 hover:text-noir cursor-pointer transition-colors">Privacy</a>
        <a onclick="showToast('Terms of Service')" class="font-body text-[10px] text-gray-fashion/50 hover:text-noir cursor-pointer transition-colors">Terms</a>
        <a onclick="showToast('Cookie Settings')" class="font-body text-[10px] text-gray-fashion/50 hover:text-noir cursor-pointer transition-colors">Cookies</a>
      </div>
    </div>
  </div>
</footer>

<!-- ==================== QUICK VIEW MODAL ==================== -->
<div class="modal-overlay" id="modalOverlay" onclick="closeQuickView()"></div>
<div class="modal-content hidden" id="modalContent">
  <div class="relative">
    <button onclick="closeQuickView()" class="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center bg-offwhite/80 hover:bg-offwhite transition-colors">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.2"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
    <div class="grid md:grid-cols-2">
      <!-- Image -->
      <div class="aspect-square md:aspect-auto bg-gradient-to-br from-cream to-warm flex items-center justify-center" id="modalImage">
        <div class="text-center p-8">
          <svg width="80" height="100" viewBox="0 0 80 100" fill="none" class="mx-auto opacity-30">
            <rect x="10" y="10" width="60" height="80" rx="4" stroke="#C8B098" stroke-width="1"/>
          </svg>
        </div>
      </div>
      <!-- Info -->
      <div class="p-8 md:p-12 flex flex-col justify-center">
        <p class="font-body text-[10px] text-gray-fashion tracking-[0.2em] uppercase mb-2" id="modalCategory">Women</p>
        <h3 class="font-editorial text-2xl md:text-3xl font-light mb-2" id="modalTitle">Product Name</h3>
        <p class="font-body text-lg font-medium mb-6" id="modalPrice">NT$ 0</p>
        <p class="font-body text-sm text-gray-fashion leading-relaxed mb-6" id="modalDesc">Product description.</p>

        <!-- Colors -->
        <div class="mb-6">
          <p class="font-body text-[10px] text-gray-fashion tracking-[0.1em] uppercase mb-3">Color</p>
          <div class="flex gap-2" id="modalColors"></div>
        </div>

        <!-- Sizes -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <p class="font-body text-[10px] text-gray-fashion tracking-[0.1em] uppercase">Size</p>
            <button onclick="document.getElementById('size-guide').scrollIntoView({behavior:'smooth'}); closeQuickView();" class="font-body text-[10px] text-gray-fashion underline underline-offset-2 hover:text-noir transition-colors">Size Guide</button>
          </div>
          <div class="flex gap-2">
            <button onclick="selectModalSize(this)" class="w-12 h-10 border border-warm font-body text-xs hover:border-noir transition-colors">XS</button>
            <button onclick="selectModalSize(this)" class="w-12 h-10 border border-warm font-body text-xs hover:border-noir transition-colors">S</button>
            <button onclick="selectModalSize(this)" class="w-12 h-10 border border-noir bg-noir text-offwhite font-body text-xs">M</button>
            <button onclick="selectModalSize(this)" class="w-12 h-10 border border-warm font-body text-xs hover:border-noir transition-colors">L</button>
            <button onclick="selectModalSize(this)" class="w-12 h-10 border border-warm font-body text-xs hover:border-noir transition-colors">XL</button>
          </div>
        </div>

        <!-- Actions -->
        <button onclick="showToast('Added to cart'); closeQuickView();" class="w-full py-3.5 bg-noir text-offwhite font-body text-[11px] tracking-[0.12em] uppercase hover:bg-gray-fashion transition-colors mb-3">
          Add to Cart
        </button>
        <button onclick="showToast('Added to your wishlist')" class="w-full py-3.5 border border-noir text-noir font-body text-[11px] tracking-[0.12em] uppercase hover:bg-noir hover:text-offwhite transition-all">
          Add to Wishlist
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ==================== NEWSLETTER POPUP ==================== -->
<div class="newsletter-popup" id="newsletterPopup">
  <div class="max-w-lg mx-auto bg-offwhite shadow-2xl" style="border: 0.5px solid #E8E0D4;">
    <div class="relative p-6 md:p-8">
      <button onclick="closeNewsletter()" class="absolute top-4 right-4 text-gray-fashion hover:text-noir transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div class="text-center">
        <p class="font-body text-[10px] text-burgundy tracking-[0.2em] uppercase mb-2">Exclusive Access</p>
        <h3 class="font-editorial text-2xl italic font-light mb-3">Join the Inner Circle</h3>
        <p class="font-body text-xs text-gray-fashion mb-5">Get 10% off your first order + early access to new collections.</p>
        <div class="flex gap-2">
          <input type="email" placeholder="Email address" class="flex-1 px-4 py-3 bg-cream border-0 font-body text-xs focus:outline-none" id="popupEmail">
          <button onclick="submitPopupNewsletter()" class="px-6 py-3 bg-noir text-offwhite font-body text-[10px] tracking-[0.1em] uppercase hover:bg-burgundy transition-colors">Join</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ==================== TOAST ==================== -->
<div class="toast-msg" id="toast"></div>

<!-- ==================== JAVASCRIPT ==================== -->
<script>
// ==================== DATA ====================
const products = [
  { name: 'Silk Draped Blouse', price: 3280, cat: 'women', desc: 'Italian silk charmeuse with a fluid draped neckline. Hand-finished seams and mother-of-pearl buttons. The quintessential layering piece.', colors: ['Ivory', 'Noir', 'Nude'] },
  { name: 'Wool Column Dress', price: 5680, cat: 'women', desc: '100% Merino wool in a clean column silhouette. Natural drape with hidden side pockets. From Italian mills to our Taipei atelier.', colors: ['Camel', 'Noir'] },
  { name: 'Deconstructed Trench', price: 8900, cat: 'men', desc: 'A modern take on the classic. Unlined cotton gabardine with raw edges and a relaxed shoulder. Removable belt for two distinct silhouettes.', colors: ['Sand', 'Noir'] },
  { name: 'Vegetable-Tanned Tote', price: 4280, cat: 'accessories', desc: 'Full-grain vegetable-tanned leather from a century-old Tuscan tannery. Unlined interior with one slip pocket. Develops a beautiful patina over time.', colors: ['Tan', 'Noir'] },
  { name: 'Linen Unstructured Blazer', price: 6480, cat: 'men', desc: 'Washed Belgian linen with a deliberately relaxed construction. No shoulder padding, no fusing — just pure fabric and expert tailoring.', colors: ['Sand', 'Charcoal'] },
  { name: 'Cashmere Cocoon Knit', price: 4980, cat: 'women', desc: 'Grade-A Mongolian cashmere in a cocoon-wrap silhouette. Ribbed cuffs and hem with a generous, enveloping fit. Pure comfort elevated.', colors: ['Oatmeal', 'Burgundy'] }
];

let wishlist = [];
let currentLookItem = -1;
let newsletterShown = false;

// ==================== SCROLL TO TOP ====================
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== CATEGORY FILTER ====================
function filterCategory(cat) {
  // Update tabs
  document.querySelectorAll('.cat-tab').forEach(tab => {
    const isActive = tab.dataset.cat === cat;
    tab.classList.toggle('active', isActive);
    tab.classList.toggle('text-noir', isActive);
    tab.classList.toggle('text-gray-fashion', !isActive);
  });

  // Filter products
  document.querySelectorAll('#productGrid .product-card').forEach(card => {
    if (cat === 'all') {
      card.style.display = '';
    } else {
      card.style.display = card.dataset.cat === cat ? '' : 'none';
    }
  });

  // Scroll to products
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// ==================== WISHLIST ====================
function toggleWishlist(id) {
  const btn = document.querySelector(`.wishlist-btn[data-id="${id}"]`);
  const idx = wishlist.indexOf(id);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    btn.classList.remove('active');
    showToast('Removed from wishlist');
  } else {
    wishlist.push(id);
    btn.classList.add('active');
    showToast('Added to your wishlist');
  }
  updateWishlistCount();
}

function updateWishlistCount() {
  const el = document.getElementById('wishlistCount');
  if (wishlist.length > 0) {
    el.textContent = wishlist.length;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

// ==================== COLOR SWATCH ====================
function selectSwatch(el) {
  const parent = el.parentElement;
  parent.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}

// ==================== QUICK VIEW MODAL ====================
function openQuickView(idx) {
  const p = products[idx];
  if (!p) return;
  document.getElementById('modalTitle').textContent = p.name;
  document.getElementById('modalPrice').textContent = 'NT$ ' + p.price.toLocaleString();
  document.getElementById('modalCategory').textContent = p.cat.charAt(0).toUpperCase() + p.cat.slice(1);
  document.getElementById('modalDesc').textContent = p.desc;

  // Colors
  const colorsEl = document.getElementById('modalColors');
  const colorMap = { Ivory: '#F5F0EB', Noir: '#1A1A1A', Nude: '#C8B098', Camel: '#C8B098', Sand: '#E8E0D4', Tan: '#C8B098', Charcoal: '#6B6B6B', Oatmeal: '#E8E0D4', Burgundy: '#8B0000' };
  colorsEl.innerHTML = p.colors.map((c, i) => {
    const border = c === 'Ivory' || c === 'Oatmeal' || c === 'Sand' ? 'border: 1px solid #E8E0D4;' : '';
    return `<span class="swatch ${i === 0 ? 'active' : ''}" style="background:${colorMap[c] || '#CCC'}; ${border}" onclick="selectSwatch(this)" title="${c}"></span>`;
  }).join('');

  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('modalContent').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('modalContent').classList.add('hidden');
  document.body.style.overflow = '';
}

function selectModalSize(el) {
  el.parentElement.querySelectorAll('button').forEach(b => {
    b.classList.remove('bg-noir', 'text-offwhite', 'border-noir');
    b.classList.add('border-warm');
  });
  el.classList.add('bg-noir', 'text-offwhite', 'border-noir');
  el.classList.remove('border-warm');
}

// ==================== SHOP THE LOOK ====================
function showLookItem(idx) {
  // Toggle hotspots
  document.querySelectorAll('.look-hotspot').forEach(h => h.classList.remove('active'));
  const hotspot = document.querySelector(`.look-hotspot[data-item="${idx}"]`);
  if (hotspot) hotspot.classList.add('active');

  // Hide default
  document.getElementById('lookDefault').style.display = 'none';

  // Show/hide items with animation
  document.querySelectorAll('.look-item-card').forEach(card => {
    card.classList.add('hidden');
    card.classList.remove('show');
  });
  const target = document.querySelector(`[data-look-item="${idx}"]`);
  if (target) {
    target.classList.remove('hidden');
    setTimeout(() => target.classList.add('show'), 50);
  }
  currentLookItem = idx;
}

// ==================== SIZE GUIDE MEASUREMENT ====================
const measurements = {
  head: 'Head Circumference: 54-58 cm',
  neck: 'Neck: 36-42 cm',
  chest: 'Chest / Bust: 80-100 cm',
  waist: 'Waist: 62-82 cm',
  hips: 'Hips: 86-106 cm',
  inseam: 'Inseam: 76-82 cm',
  sleeve: 'Sleeve Length: 58-62 cm'
};

function showMeasurement(part, el) {
  const tooltip = document.getElementById('measurementTooltip');
  const container = document.getElementById('sizeGuideContainer');
  const rect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  tooltip.textContent = measurements[part] || '';
  tooltip.classList.add('show');

  // Position tooltip above the clicked part
  const x = rect.left + rect.width / 2 - containerRect.left;
  const y = rect.top - containerRect.top - 10;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
  tooltip.style.transform = 'translate(-50%, -100%)';

  // Reset all parts
  document.querySelectorAll('.body-part').forEach(p => p.classList.remove('active'));
  // Highlight matching parts
  document.querySelectorAll(`.body-part[data-part="${part}"]`).forEach(p => p.classList.add('active'));

  // Auto-hide
  clearTimeout(window._measureTimeout);
  window._measureTimeout = setTimeout(() => {
    tooltip.classList.remove('show');
    document.querySelectorAll('.body-part').forEach(p => p.classList.remove('active'));
  }, 3000);
}

// ==================== LOOKBOOK SCROLL ====================
function scrollLookbook(dir) {
  const container = document.getElementById('lookbookScroll');
  const itemWidth = container.querySelector('.lookbook-item').offsetWidth + 2;
  container.scrollBy({ left: dir * itemWidth, behavior: 'smooth' });
}

// ==================== NEWSLETTER ====================
function submitNewsletter() {
  const email = document.getElementById('nlEmail').value.trim();
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email');
    return;
  }
  showToast('Welcome to Maison Noir!');
  document.getElementById('nlEmail').value = '';
}

function submitPopupNewsletter() {
  const email = document.getElementById('popupEmail').value.trim();
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email');
    return;
  }
  showToast('Welcome! Your 10% code: MAISON10');
  closeNewsletter();
}

function closeNewsletter() {
  document.getElementById('newsletterPopup').classList.remove('show');
  newsletterShown = true;
}

// ==================== TOAST ====================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ==================== INTERSECTION OBSERVER ====================
const observerOptions = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-up').forEach(el => {
  observer.observe(el);
});

// ==================== NEWSLETTER POPUP TRIGGER ====================
let scrollDepth = 0;
window.addEventListener('scroll', () => {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const current = (window.scrollY / docHeight) * 100;
  if (current > 55 && !newsletterShown) {
    newsletterShown = true;
    setTimeout(() => {
      document.getElementById('newsletterPopup').classList.add('show');
    }, 500);
  }
}, { passive: true });

// ==================== KEYBOARD CLOSE ====================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeQuickView();
    closeNewsletter();
  }
});
</script>

</body>
</html>
  $HTML$,
  2
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
