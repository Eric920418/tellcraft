-- Template Preview: ecommerce-furniture (Furniture E-commerce)
-- 家具電商，房間場景英雄區 + 房間配置器 + 非對稱瀑布流 + 材質探索器
-- Signature: Room Configurator with furniture hotspots

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '56fc4e15-23fd-4738-8a1b-f63aac7ab827',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WOODHAUS — Crafted Furniture for Modern Living</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Lato:wght@300;400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Lato', 'system-ui', 'sans-serif']
      },
      colors: {
        oak: '#B8860B',
        walnut: '#5C4033',
        cream: '#FFF8F0',
        sage: '#87A878',
        charcoal: '#2D2D2D',
        linen: '#FAF0E6',
        cherry: '#8B4513',
        pine: '#C4A35A'
      }
    }
  }
}
</script>
<style>
* { font-family: 'Lato', system-ui, sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
h1, h2, h3, h4, h5 { font-family: 'Playfair Display', Georgia, serif; }
body { overflow-x: hidden; background: #FFF8F0; color: #2D2D2D; }

.wood-grain-bg {
  background:
    repeating-linear-gradient(87deg, transparent, transparent 3px, rgba(184,134,11,0.03) 3px, rgba(184,134,11,0.03) 6px),
    repeating-linear-gradient(92deg, transparent, transparent 5px, rgba(92,64,51,0.02) 5px, rgba(92,64,51,0.02) 8px),
    linear-gradient(180deg, #FFF8F0 0%, #FAF0E6 100%);
}

.linen-texture { position: relative; }
.linen-texture::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(92,64,51,0.015) 1px, rgba(92,64,51,0.015) 2px),
    repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(92,64,51,0.015) 1px, rgba(92,64,51,0.015) 2px);
  pointer-events: none;
  z-index: 1;
}

.paper-card {
  background: #FFFFFF;
  border: 1px solid rgba(184,134,11,0.1);
  box-shadow: 0 2px 8px rgba(92,64,51,0.06), 0 8px 24px rgba(92,64,51,0.04);
  border-radius: 4px;
}

@keyframes shelfSlideLeft {
  from { opacity: 0; transform: translateX(-60px) rotate(-1deg); }
  to { opacity: 1; transform: translateX(0) rotate(0deg); }
}
@keyframes shelfSlideRight {
  from { opacity: 0; transform: translateX(60px) rotate(1deg); }
  to { opacity: 1; transform: translateX(0) rotate(0deg); }
}
@keyframes shelfSlideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeScale {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes warmGlow {
  0%, 100% { box-shadow: 0 4px 16px rgba(184,134,11,0.1); }
  50% { box-shadow: 0 8px 32px rgba(184,134,11,0.2); }
}
@keyframes hotspotPulse {
  0%, 100% { transform: translate(-50%,-50%) scale(1); box-shadow: 0 0 0 0 rgba(184,134,11,0.4); }
  50% { transform: translate(-50%,-50%) scale(1.1); box-shadow: 0 0 0 12px rgba(184,134,11,0); }
}
@keyframes toastSlide {
  0% { transform: translateX(120%); opacity: 0; }
  10% { transform: translateX(0); opacity: 1; }
  90% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(120%); opacity: 0; }
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes gentleBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes grainShimmer {
  0% { background-position: 0% 0%; }
  100% { background-position: 100% 100%; }
}

.shelf-left { opacity: 0; }
.shelf-left.revealed { animation: shelfSlideLeft 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.shelf-right { opacity: 0; }
.shelf-right.revealed { animation: shelfSlideRight 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.shelf-up { opacity: 0; }
.shelf-up.revealed { animation: shelfSlideUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.fade-scale { opacity: 0; }
.fade-scale.revealed { animation: fadeScale 0.6s ease forwards; }

.hotspot {
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(184,134,11,0.85);
  border: 3px solid #FFF8F0;
  cursor: pointer;
  transform: translate(-50%, -50%);
  animation: hotspotPulse 2.5s ease-in-out infinite;
  z-index: 10;
  transition: background 0.2s;
}
.hotspot:hover {
  background: rgba(184,134,11,1);
  animation: none;
  transform: translate(-50%, -50%) scale(1.2);
}
.hotspot-tooltip {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%) scale(0.9);
  background: #2D2D2D;
  color: #FFF8F0;
  padding: 10px 16px;
  border-radius: 4px;
  white-space: nowrap;
  font-size: 13px;
  opacity: 0;
  pointer-events: none;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  font-family: 'Lato', sans-serif;
  z-index: 20;
}
.hotspot-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #2D2D2D;
}
.hotspot:hover .hotspot-tooltip {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

.furniture-card {
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;
}
.furniture-card:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 40px rgba(184,134,11,0.15), 0 4px 12px rgba(92,64,51,0.08);
}
.furniture-card:hover .card-img { transform: scale(1.06); }
.card-img { transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1); }

.swatch {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 3px solid transparent;
  position: relative;
}
.swatch:hover { transform: scale(1.15); }
.swatch.active {
  border-color: #2D2D2D;
  box-shadow: 0 0 0 3px rgba(45,45,45,0.15);
}

.room-tab {
  padding: 12px 28px;
  cursor: pointer;
  font-family: 'Lato', sans-serif;
  font-weight: 500;
  font-size: 15px;
  color: #5C4033;
  border: none;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  background: none;
}
.room-tab:hover { color: #B8860B; }
.room-tab.active { color: #B8860B; border-bottom-color: #B8860B; }

.toast {
  position: fixed;
  bottom: 32px;
  right: 32px;
  background: #2D2D2D;
  color: #FFF8F0;
  padding: 16px 24px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  animation: toastSlide 3.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  font-family: 'Lato', sans-serif;
}

.gallery-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255,248,240,0.9);
  border: 1px solid rgba(184,134,11,0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  backdrop-filter: blur(8px);
}
.gallery-btn:hover { background: #B8860B; border-color: #B8860B; }
.gallery-btn:hover svg { stroke: #FFF8F0; }

.room-furniture-dot { cursor: pointer; transition: all 0.3s ease; }
.room-furniture-dot:hover { transform: scale(1.3); }

.delivery-marquee {
  display: flex;
  animation: marquee 20s linear infinite;
}

html { scroll-behavior: smooth; }

.add-cart-btn {
  background: #2D2D2D;
  color: #FFF8F0;
  padding: 10px 20px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-family: 'Lato', sans-serif;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.add-cart-btn:hover { background: #B8860B; }

.filter-pill {
  padding: 8px 20px;
  border: 1px solid rgba(92,64,51,0.2);
  border-radius: 24px;
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s ease;
  background: transparent;
  color: #5C4033;
}
.filter-pill:hover { border-color: #B8860B; color: #B8860B; }
.filter-pill.active { background: #2D2D2D; color: #FFF8F0; border-color: #2D2D2D; }

.newsletter-input {
  padding: 14px 20px;
  border: 1px solid rgba(184,134,11,0.3);
  background: rgba(255,248,240,0.6);
  font-size: 15px;
  font-family: 'Lato', sans-serif;
  color: #2D2D2D;
  width: 100%;
  border-radius: 3px 0 0 3px;
  outline: none;
  transition: border-color 0.2s;
}
.newsletter-input:focus { border-color: #B8860B; }
.newsletter-input::placeholder { color: #5C4033; opacity: 0.6; }

.section-divider {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, #B8860B, #5C4033);
  margin: 16px auto 0;
}

.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }
.stagger-4 { animation-delay: 0.4s; }

@media (max-width: 768px) {
  .hero-hotspot-area { min-height: 400px !important; }
  .asymmetric-grid { display: flex !important; flex-direction: column !important; }
  .asymmetric-grid > * { grid-column: span 1 !important; grid-row: span 1 !important; }
  .room-svg-wrap { height: 300px !important; }
  .gallery-track-item { width: 280px !important; }
}
</style>
</head>
<body>

<!-- ===== DELIVERY BAR ===== -->
<div class="bg-walnut text-cream overflow-hidden" style="height: 40px; line-height: 40px;">
  <div class="delivery-marquee whitespace-nowrap">
    <span class="inline-flex items-center gap-8 px-8 text-sm tracking-wide font-body">
      <span class="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        Free delivery on orders over $999
      </span>
      <span class="opacity-40">&#183;</span>
      <span>Handcrafted with sustainable materials</span>
      <span class="opacity-40">&#183;</span>
      <span>30-day comfort guarantee</span>
      <span class="opacity-40">&#183;</span>
      <span>White-glove assembly available</span>
      <span class="opacity-40">&#183;</span>
      <span class="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        Free delivery on orders over $999
      </span>
      <span class="opacity-40">&#183;</span>
      <span>Handcrafted with sustainable materials</span>
      <span class="opacity-40">&#183;</span>
      <span>30-day comfort guarantee</span>
      <span class="opacity-40">&#183;</span>
      <span>White-glove assembly available</span>
    </span>
  </div>
</div>

<!-- ===== NAVIGATION ===== -->
<nav class="sticky top-0 z-50 bg-cream/95 backdrop-blur-md border-b border-oak/10">
  <div class="max-w-7xl mx-auto px-6 flex items-center justify-between" style="height: 72px;">
    <a href="#" class="flex items-center gap-3">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="22" width="24" height="3" rx="1" fill="#5C4033"/>
        <rect x="6" y="8" width="8" height="14" rx="1" fill="#B8860B"/>
        <rect x="18" y="12" width="8" height="10" rx="1" fill="#87A878"/>
        <circle cx="10" cy="28" r="2" fill="#5C4033"/>
        <circle cx="22" cy="28" r="2" fill="#5C4033"/>
      </svg>
      <span class="font-display text-xl font-bold text-charcoal tracking-tight">WOODHAUS</span>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#rooms" class="text-sm font-medium text-walnut hover:text-oak transition-colors tracking-wide uppercase">Rooms</a>
      <a href="#collection" class="text-sm font-medium text-walnut hover:text-oak transition-colors tracking-wide uppercase">Collection</a>
      <a href="#materials" class="text-sm font-medium text-walnut hover:text-oak transition-colors tracking-wide uppercase">Materials</a>
      <a href="#gallery" class="text-sm font-medium text-walnut hover:text-oak transition-colors tracking-wide uppercase">Gallery</a>
    </div>
    <div class="flex items-center gap-5">
      <button class="relative text-walnut hover:text-oak transition-colors" aria-label="Search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </button>
      <button id="cartBtn" class="relative text-walnut hover:text-oak transition-colors" aria-label="Cart">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <span id="cartCount" class="absolute -top-2 -right-2 w-5 h-5 bg-oak text-cream text-xs rounded-full flex items-center justify-center font-bold" style="display:none;">0</span>
      </button>
      <button class="md:hidden text-walnut" id="mobileMenuBtn" aria-label="Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>
  </div>
</nav>

<!-- ===== SECTION 1: HERO with Room Scene Hotspots ===== -->
<section class="relative linen-texture" style="min-height: 680px; background: linear-gradient(135deg, #FAF0E6 0%, #FFF8F0 40%, #f5ead6 100%);">
  <div class="max-w-7xl mx-auto px-6 py-16 md:py-20">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div class="relative z-10 shelf-left">
        <p class="text-oak text-sm font-medium tracking-widest uppercase mb-4 font-body">New Season 2026</p>
        <h1 class="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-charcoal leading-tight mb-6">
          Furniture<br><span class="text-oak">for Life.</span>
        </h1>
        <p class="text-walnut/80 text-lg leading-relaxed mb-8 max-w-md font-body">
          Handcrafted from sustainably sourced hardwoods. Each piece tells a story of meticulous craftsmanship and timeless design.
        </p>
        <div class="flex flex-wrap gap-4">
          <a href="#collection" class="add-cart-btn inline-flex items-center gap-2 px-8 py-4 text-sm">
            Explore Collection
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
          <a href="#rooms" class="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium text-walnut border border-walnut/20 rounded-sm hover:border-oak hover:text-oak transition-all tracking-wide uppercase font-body">
            Shop by Room
          </a>
        </div>
        <div class="flex items-center gap-8 mt-10 text-sm text-walnut/60 font-body">
          <span class="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#87A878" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            5-Year Warranty
          </span>
          <span class="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#87A878" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Showroom in NYC
          </span>
        </div>
      </div>

      <!-- Room Scene with Hotspots -->
      <div class="relative hero-hotspot-area shelf-right" style="min-height: 500px;">
        <svg viewBox="0 0 600 450" class="w-full h-auto" style="filter: drop-shadow(0 8px 32px rgba(92,64,51,0.1));">
          <!-- Floor -->
          <rect x="40" y="300" width="520" height="120" rx="4" fill="#FAF0E6" stroke="#B8860B" stroke-width="1" opacity="0.5"/>
          <!-- Back wall -->
          <rect x="40" y="40" width="520" height="260" rx="4" fill="#FFF8F0" stroke="#5C4033" stroke-width="1" opacity="0.4"/>
          <!-- Window -->
          <rect x="360" y="60" width="160" height="140" rx="2" fill="none" stroke="#B8860B" stroke-width="1.5"/>
          <line x1="440" y1="60" x2="440" y2="200" stroke="#B8860B" stroke-width="1"/>
          <line x1="360" y1="130" x2="520" y2="130" stroke="#B8860B" stroke-width="1"/>
          <rect x="370" y="70" width="60" height="55" rx="1" fill="#87A878" opacity="0.15"/>
          <rect x="450" y="70" width="60" height="55" rx="1" fill="#87A878" opacity="0.1"/>
          <!-- Sofa -->
          <rect x="80" y="240" width="200" height="70" rx="8" fill="#B8860B" opacity="0.7"/>
          <rect x="80" y="220" width="200" height="30" rx="6" fill="#B8860B" opacity="0.5"/>
          <rect x="80" y="220" width="45" height="90" rx="6" fill="#B8860B" opacity="0.6"/>
          <rect x="235" y="220" width="45" height="90" rx="6" fill="#B8860B" opacity="0.6"/>
          <!-- Coffee table -->
          <rect x="160" y="340" width="120" height="50" rx="4" fill="#5C4033" opacity="0.6"/>
          <rect x="170" y="348" width="100" height="34" rx="2" fill="#5C4033" opacity="0.4"/>
          <!-- Side table + lamp -->
          <rect x="320" y="280" width="50" height="50" rx="3" fill="#5C4033" opacity="0.5"/>
          <line x1="345" y1="240" x2="345" y2="280" stroke="#B8860B" stroke-width="2"/>
          <ellipse cx="345" cy="235" rx="25" ry="12" fill="#B8860B" opacity="0.3"/>
          <!-- Bookshelf -->
          <rect x="430" y="220" width="100" height="100" rx="2" fill="#5C4033" opacity="0.4"/>
          <line x1="430" y1="250" x2="530" y2="250" stroke="#5C4033" stroke-width="1" opacity="0.5"/>
          <line x1="430" y1="280" x2="530" y2="280" stroke="#5C4033" stroke-width="1" opacity="0.5"/>
          <rect x="440" y="225" width="18" height="22" rx="1" fill="#87A878" opacity="0.4"/>
          <rect x="462" y="228" width="14" height="19" rx="1" fill="#B8860B" opacity="0.3"/>
          <rect x="480" y="226" width="16" height="21" rx="1" fill="#5C4033" opacity="0.3"/>
          <!-- Plant -->
          <circle cx="90" cy="340" r="20" fill="#87A878" opacity="0.4"/>
          <rect x="82" y="356" width="16" height="24" rx="3" fill="#5C4033" opacity="0.5"/>
          <!-- Rug -->
          <ellipse cx="220" cy="370" rx="140" ry="35" fill="#B8860B" opacity="0.1" stroke="#B8860B" stroke-width="0.5"/>
          <!-- Wall art -->
          <rect x="120" y="80" width="100" height="80" rx="2" fill="none" stroke="#5C4033" stroke-width="1.5"/>
          <rect x="130" y="90" width="80" height="60" rx="1" fill="#87A878" opacity="0.15"/>
        </svg>

        <!-- Hotspot dots overlaid on SVG -->
        <div class="hotspot" style="top: 55%; left: 28%;">
          <div class="hotspot-tooltip"><span class="font-medium">Nordic Sofa</span><span class="block text-oak text-sm mt-1">$2,490</span></div>
        </div>
        <div class="hotspot" style="top: 73%; left: 37%;">
          <div class="hotspot-tooltip"><span class="font-medium">Oval Coffee Table</span><span class="block text-oak text-sm mt-1">$890</span></div>
        </div>
        <div class="hotspot" style="top: 55%; left: 57%;">
          <div class="hotspot-tooltip"><span class="font-medium">Arc Floor Lamp</span><span class="block text-oak text-sm mt-1">$340</span></div>
        </div>
        <div class="hotspot" style="top: 55%; left: 78%;">
          <div class="hotspot-tooltip"><span class="font-medium">Oak Bookshelf</span><span class="block text-oak text-sm mt-1">$1,260</span></div>
        </div>
        <div class="hotspot" style="top: 74%; left: 15%;">
          <div class="hotspot-tooltip"><span class="font-medium">Terracotta Planter</span><span class="block text-oak text-sm mt-1">$85</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===== SECTION 2: Shop by Room (Room Configurator) ===== -->
<section id="rooms" class="py-20 md:py-28 bg-cream">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-12 shelf-up">
      <p class="text-oak text-sm tracking-widest uppercase mb-3 font-body font-medium">Curated Spaces</p>
      <h2 class="font-display text-4xl md:text-5xl font-bold text-charcoal">Shop by Room</h2>
      <div class="section-divider"></div>
    </div>

    <div class="flex justify-center gap-2 mb-10 shelf-up" id="roomTabs">
      <button class="room-tab active" data-room="living">Living Room</button>
      <button class="room-tab" data-room="bedroom">Bedroom</button>
      <button class="room-tab" data-room="dining">Dining</button>
    </div>

    <div class="relative max-w-4xl mx-auto">
      <!-- Living Room Panel -->
      <div class="room-panel active" data-room="living">
        <div class="paper-card p-8 md:p-12 relative room-svg-wrap" style="height: 420px;">
          <svg viewBox="0 0 800 360" class="w-full h-full">
            <rect x="20" y="20" width="760" height="320" rx="4" fill="#FFF8F0" stroke="#5C4033" stroke-width="1" stroke-dasharray="4,4"/>
            <line x1="20" y1="260" x2="780" y2="260" stroke="#B8860B" stroke-width="0.5" opacity="0.4"/>
            <rect x="100" y="50" width="80" height="60" rx="2" fill="none" stroke="#5C4033" stroke-width="1" opacity="0.3"/>
            <rect x="350" y="40" width="120" height="80" rx="2" fill="none" stroke="#5C4033" stroke-width="1" opacity="0.3"/>
            <rect x="80" y="180" width="200" height="80" rx="10" fill="#B8860B" opacity="0.25" class="room-furniture-dot" data-item="Modular Sofa"/>
            <rect x="80" y="165" width="200" height="25" rx="8" fill="#B8860B" opacity="0.2"/>
            <rect x="320" y="200" width="70" height="60" rx="8" fill="#87A878" opacity="0.25" class="room-furniture-dot" data-item="Accent Armchair"/>
            <ellipse cx="230" cy="300" rx="70" ry="30" fill="#5C4033" opacity="0.2" class="room-furniture-dot" data-item="Coffee Table"/>
            <rect x="550" y="180" width="180" height="60" rx="4" fill="#5C4033" opacity="0.2" class="room-furniture-dot" data-item="Media Console"/>
            <rect x="590" y="100" width="100" height="65" rx="2" fill="#2D2D2D" opacity="0.1"/>
            <rect x="430" y="220" width="50" height="40" rx="3" fill="#B8860B" opacity="0.2" class="room-furniture-dot" data-item="Side Table"/>
            <line x1="500" y1="140" x2="500" y2="250" stroke="#B8860B" stroke-width="2" opacity="0.3"/>
            <ellipse cx="500" cy="135" rx="20" ry="10" fill="#B8860B" opacity="0.15"/>
            <ellipse cx="250" cy="290" rx="160" ry="40" fill="#B8860B" opacity="0.06" stroke="#B8860B" stroke-width="0.5"/>
          </svg>
          <div class="absolute bottom-6 left-8 right-8 flex flex-wrap gap-3">
            <span class="text-xs font-body bg-walnut/10 text-walnut px-3 py-1.5 rounded-full">Modular Sofa - $3,200</span>
            <span class="text-xs font-body bg-sage/20 text-walnut px-3 py-1.5 rounded-full">Accent Armchair - $980</span>
            <span class="text-xs font-body bg-walnut/10 text-walnut px-3 py-1.5 rounded-full">Coffee Table - $690</span>
            <span class="text-xs font-body bg-walnut/10 text-walnut px-3 py-1.5 rounded-full">Media Console - $1,450</span>
          </div>
        </div>
      </div>

      <!-- Bedroom Panel -->
      <div class="room-panel" data-room="bedroom" style="display:none;">
        <div class="paper-card p-8 md:p-12 relative room-svg-wrap" style="height: 420px;">
          <svg viewBox="0 0 800 360" class="w-full h-full">
            <rect x="20" y="20" width="760" height="320" rx="4" fill="#FFF8F0" stroke="#5C4033" stroke-width="1" stroke-dasharray="4,4"/>
            <line x1="20" y1="260" x2="780" y2="260" stroke="#B8860B" stroke-width="0.5" opacity="0.4"/>
            <rect x="200" y="160" width="280" height="100" rx="6" fill="#B8860B" opacity="0.2" class="room-furniture-dot" data-item="Platform Bed"/>
            <rect x="220" y="150" width="240" height="20" rx="4" fill="#B8860B" opacity="0.3"/>
            <rect x="200" y="80" width="280" height="80" rx="4" fill="#5C4033" opacity="0.15"/>
            <rect x="120" y="190" width="55" height="50" rx="3" fill="#5C4033" opacity="0.2" class="room-furniture-dot" data-item="Nightstand"/>
            <rect x="510" y="190" width="55" height="50" rx="3" fill="#5C4033" opacity="0.2" class="room-furniture-dot"/>
            <rect x="620" y="160" width="120" height="80" rx="4" fill="#5C4033" opacity="0.2" class="room-furniture-dot" data-item="Wide Dresser"/>
            <rect x="250" y="290" width="180" height="30" rx="4" fill="#87A878" opacity="0.2" class="room-furniture-dot" data-item="End Bench"/>
            <circle cx="147" cy="180" r="12" fill="#B8860B" opacity="0.15"/>
            <circle cx="537" cy="180" r="12" fill="#B8860B" opacity="0.15"/>
            <rect x="160" y="275" width="360" height="50" rx="20" fill="#B8860B" opacity="0.06" stroke="#B8860B" stroke-width="0.5"/>
          </svg>
          <div class="absolute bottom-6 left-8 right-8 flex flex-wrap gap-3">
            <span class="text-xs font-body bg-walnut/10 text-walnut px-3 py-1.5 rounded-full">Platform Bed - $2,800</span>
            <span class="text-xs font-body bg-walnut/10 text-walnut px-3 py-1.5 rounded-full">Nightstand x2 - $480 ea</span>
            <span class="text-xs font-body bg-walnut/10 text-walnut px-3 py-1.5 rounded-full">Dresser - $1,890</span>
            <span class="text-xs font-body bg-sage/20 text-walnut px-3 py-1.5 rounded-full">End Bench - $640</span>
          </div>
        </div>
      </div>

      <!-- Dining Panel -->
      <div class="room-panel" data-room="dining" style="display:none;">
        <div class="paper-card p-8 md:p-12 relative room-svg-wrap" style="height: 420px;">
          <svg viewBox="0 0 800 360" class="w-full h-full">
            <rect x="20" y="20" width="760" height="320" rx="4" fill="#FFF8F0" stroke="#5C4033" stroke-width="1" stroke-dasharray="4,4"/>
            <line x1="20" y1="260" x2="780" y2="260" stroke="#B8860B" stroke-width="0.5" opacity="0.4"/>
            <ellipse cx="380" cy="200" rx="160" ry="70" fill="#5C4033" opacity="0.2" class="room-furniture-dot" data-item="Dining Table"/>
            <rect x="260" y="110" width="40" height="40" rx="20" fill="#B8860B" opacity="0.2" class="room-furniture-dot" data-item="Chair"/>
            <rect x="370" y="100" width="40" height="40" rx="20" fill="#B8860B" opacity="0.2"/>
            <rect x="480" y="110" width="40" height="40" rx="20" fill="#B8860B" opacity="0.2"/>
            <rect x="260" y="260" width="40" height="40" rx="20" fill="#B8860B" opacity="0.2"/>
            <rect x="370" y="270" width="40" height="40" rx="20" fill="#B8860B" opacity="0.2"/>
            <rect x="480" y="260" width="40" height="40" rx="20" fill="#B8860B" opacity="0.2"/>
            <rect x="620" y="150" width="130" height="70" rx="4" fill="#5C4033" opacity="0.2" class="room-furniture-dot" data-item="Sideboard"/>
            <line x1="380" y1="20" x2="380" y2="70" stroke="#B8860B" stroke-width="1.5" opacity="0.3"/>
            <ellipse cx="380" cy="78" rx="40" ry="15" fill="#B8860B" opacity="0.15"/>
            <rect x="60" y="100" width="80" height="140" rx="3" fill="#5C4033" opacity="0.15" class="room-furniture-dot" data-item="Display Cabinet"/>
          </svg>
          <div class="absolute bottom-6 left-8 right-8 flex flex-wrap gap-3">
            <span class="text-xs font-body bg-walnut/10 text-walnut px-3 py-1.5 rounded-full">Dining Table - $2,200</span>
            <span class="text-xs font-body bg-walnut/10 text-walnut px-3 py-1.5 rounded-full">Dining Chairs x6 - $380 ea</span>
            <span class="text-xs font-body bg-walnut/10 text-walnut px-3 py-1.5 rounded-full">Sideboard - $1,650</span>
            <span class="text-xs font-body bg-walnut/10 text-walnut px-3 py-1.5 rounded-full">Display Cabinet - $1,100</span>
          </div>
        </div>
      </div>
    </div>

    <div class="text-center mt-10">
      <button class="add-cart-btn px-10 py-4 text-sm" onclick="showToast('Room bundles save up to 20%!')">Shop This Room &mdash; Save 20%</button>
    </div>
  </div>
</section>

<!-- ===== SECTION 3: Featured Collection (Asymmetric Masonry) ===== -->
<section id="collection" class="py-20 md:py-28 linen-texture" style="background: linear-gradient(180deg, #FAF0E6 0%, #FFF8F0 100%);">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-8 shelf-up">
      <p class="text-oak text-sm tracking-widest uppercase mb-3 font-body font-medium">The Collection</p>
      <h2 class="font-display text-4xl md:text-5xl font-bold text-charcoal">Crafted Pieces</h2>
      <div class="section-divider"></div>
    </div>

    <div class="flex flex-wrap justify-center gap-3 mb-12 shelf-up" id="collectionFilters">
      <button class="filter-pill active" data-filter="all">All Pieces</button>
      <button class="filter-pill" data-filter="living">Living Room</button>
      <button class="filter-pill" data-filter="bedroom">Bedroom</button>
      <button class="filter-pill" data-filter="dining">Dining</button>
      <button class="filter-pill" data-filter="office">Office</button>
    </div>

    <!-- Asymmetric Grid: 1 large + 2 medium + 3 small -->
    <div class="asymmetric-grid grid gap-5" style="grid-template-columns: repeat(12, 1fr); grid-auto-rows: minmax(180px, auto);" id="productGrid">

      <!-- LARGE Feature (7 cols, 2 rows) -->
      <div class="furniture-card paper-card overflow-hidden shelf-left" data-category="living" style="grid-column: span 7; grid-row: span 2;">
        <div class="relative h-full min-h-[380px] flex flex-col">
          <div class="flex-1 overflow-hidden" style="background: linear-gradient(135deg, #f5ead6 0%, #FAF0E6 50%, #e8d5b8 100%);">
            <div class="p-10 h-full flex items-center justify-center">
              <svg viewBox="0 0 400 250" class="w-full max-w-md card-img" style="filter: drop-shadow(0 8px 24px rgba(92,64,51,0.15));">
                <rect x="30" y="100" width="340" height="100" rx="16" fill="#B8860B" opacity="0.6"/>
                <rect x="30" y="80" width="340" height="40" rx="12" fill="#B8860B" opacity="0.45"/>
                <rect x="25" y="75" width="70" height="130" rx="12" fill="#B8860B" opacity="0.55"/>
                <rect x="305" y="75" width="70" height="130" rx="12" fill="#B8860B" opacity="0.55"/>
                <rect x="60" y="200" width="10" height="30" rx="3" fill="#5C4033" opacity="0.5"/>
                <rect x="330" y="200" width="10" height="30" rx="3" fill="#5C4033" opacity="0.5"/>
                <rect x="70" y="90" width="80" height="55" rx="8" fill="#87A878" opacity="0.35"/>
                <rect x="160" y="92" width="75" height="50" rx="8" fill="#FFF8F0" opacity="0.4"/>
                <rect x="250" y="88" width="80" height="55" rx="8" fill="#B8860B" opacity="0.3"/>
              </svg>
            </div>
          </div>
          <div class="p-6 flex items-end justify-between">
            <div>
              <span class="text-xs text-oak font-medium tracking-wider uppercase font-body">Featured</span>
              <h3 class="font-display text-xl font-bold text-charcoal mt-1">Oslo Modular Sofa</h3>
              <p class="text-walnut/60 text-sm mt-1 font-body">Configurable 3-piece sectional in premium oak frame</p>
            </div>
            <div class="text-right">
              <p class="font-display text-2xl font-bold text-charcoal">$3,490</p>
              <button class="add-cart-btn mt-2 text-xs" onclick="addToCart('Oslo Modular Sofa', 3490)">Add to Cart</button>
            </div>
          </div>
        </div>
      </div>

      <!-- MEDIUM 1 (5 cols) -->
      <div class="furniture-card paper-card overflow-hidden shelf-right" data-category="dining" style="grid-column: span 5; grid-row: span 1;">
        <div class="relative h-full min-h-[220px] flex">
          <div class="w-2/5 overflow-hidden" style="background: linear-gradient(135deg, #e8d5b8 0%, #FAF0E6 100%);">
            <div class="h-full flex items-center justify-center p-6">
              <svg viewBox="0 0 120 140" class="w-full max-w-[80px] card-img">
                <rect x="20" y="10" width="80" height="55" rx="3" fill="#5C4033" opacity="0.5"/>
                <rect x="15" y="65" width="90" height="8" rx="2" fill="#5C4033" opacity="0.6"/>
                <rect x="25" y="73" width="8" height="60" rx="2" fill="#5C4033" opacity="0.45"/>
                <rect x="87" y="73" width="8" height="60" rx="2" fill="#5C4033" opacity="0.45"/>
              </svg>
            </div>
          </div>
          <div class="w-3/5 p-5 flex flex-col justify-center">
            <span class="text-xs text-sage font-medium tracking-wider uppercase font-body">Dining</span>
            <h3 class="font-display text-lg font-bold text-charcoal mt-1">Walnut Dining Chair</h3>
            <p class="text-walnut/60 text-xs mt-1 font-body">Solid walnut with woven seat</p>
            <div class="flex items-center justify-between mt-3">
              <span class="font-display text-lg font-bold text-charcoal">$480</span>
              <button class="add-cart-btn text-xs py-2 px-4" onclick="addToCart('Walnut Dining Chair', 480)">Add</button>
            </div>
          </div>
        </div>
      </div>

      <!-- MEDIUM 2 (5 cols) -->
      <div class="furniture-card paper-card overflow-hidden shelf-right" data-category="bedroom" style="grid-column: span 5; grid-row: span 1;">
        <div class="relative h-full min-h-[220px] flex">
          <div class="w-2/5 overflow-hidden" style="background: linear-gradient(135deg, #f0e6d2 0%, #FFF8F0 100%);">
            <div class="h-full flex items-center justify-center p-6">
              <svg viewBox="0 0 140 100" class="w-full max-w-[100px] card-img">
                <rect x="10" y="30" width="120" height="45" rx="4" fill="#B8860B" opacity="0.4"/>
                <rect x="10" y="10" width="120" height="25" rx="3" fill="#5C4033" opacity="0.35"/>
                <rect x="15" y="75" width="10" height="15" rx="2" fill="#5C4033" opacity="0.4"/>
                <rect x="115" y="75" width="10" height="15" rx="2" fill="#5C4033" opacity="0.4"/>
              </svg>
            </div>
          </div>
          <div class="w-3/5 p-5 flex flex-col justify-center">
            <span class="text-xs text-oak font-medium tracking-wider uppercase font-body">Bedroom</span>
            <h3 class="font-display text-lg font-bold text-charcoal mt-1">Nara Nightstand</h3>
            <p class="text-walnut/60 text-xs mt-1 font-body">Oak with soft-close drawer</p>
            <div class="flex items-center justify-between mt-3">
              <span class="font-display text-lg font-bold text-charcoal">$640</span>
              <button class="add-cart-btn text-xs py-2 px-4" onclick="addToCart('Nara Nightstand', 640)">Add</button>
            </div>
          </div>
        </div>
      </div>

      <!-- SMALL 1 (4 cols) -->
      <div class="furniture-card paper-card overflow-hidden shelf-up" data-category="living" style="grid-column: span 4;">
        <div class="p-6 text-center" style="background: linear-gradient(180deg, #FAF0E6, #FFF8F0);">
          <div class="flex justify-center mb-4">
            <svg viewBox="0 0 100 100" class="w-20 h-20 card-img">
              <circle cx="50" cy="50" r="40" fill="#B8860B" opacity="0.15"/>
              <rect x="25" y="35" width="50" height="35" rx="3" fill="#5C4033" opacity="0.4"/>
              <rect x="30" y="70" width="8" height="12" rx="2" fill="#5C4033" opacity="0.35"/>
              <rect x="62" y="70" width="8" height="12" rx="2" fill="#5C4033" opacity="0.35"/>
            </svg>
          </div>
          <span class="text-xs text-sage font-medium tracking-wider uppercase font-body">Living</span>
          <h3 class="font-display text-base font-bold text-charcoal mt-1">Round Coffee Table</h3>
          <p class="font-display text-lg font-bold text-oak mt-2">$890</p>
          <button class="add-cart-btn text-xs mt-3 w-full py-2" onclick="addToCart('Round Coffee Table', 890)">Add to Cart</button>
        </div>
      </div>

      <!-- SMALL 2 (4 cols) -->
      <div class="furniture-card paper-card overflow-hidden shelf-up stagger-1" data-category="office" style="grid-column: span 4;">
        <div class="p-6 text-center" style="background: linear-gradient(180deg, #f0e6d2, #FFF8F0);">
          <div class="flex justify-center mb-4">
            <svg viewBox="0 0 120 80" class="w-24 h-16 card-img">
              <rect x="10" y="5" width="100" height="50" rx="3" fill="#5C4033" opacity="0.4"/>
              <rect x="15" y="55" width="90" height="5" rx="1" fill="#5C4033" opacity="0.5"/>
              <rect x="20" y="60" width="8" height="15" rx="2" fill="#5C4033" opacity="0.35"/>
              <rect x="92" y="60" width="8" height="15" rx="2" fill="#5C4033" opacity="0.35"/>
            </svg>
          </div>
          <span class="text-xs text-walnut/60 font-medium tracking-wider uppercase font-body">Office</span>
          <h3 class="font-display text-base font-bold text-charcoal mt-1">Writing Desk</h3>
          <p class="font-display text-lg font-bold text-oak mt-2">$1,290</p>
          <button class="add-cart-btn text-xs mt-3 w-full py-2" onclick="addToCart('Writing Desk', 1290)">Add to Cart</button>
        </div>
      </div>

      <!-- SMALL 3 (4 cols) -->
      <div class="furniture-card paper-card overflow-hidden shelf-up stagger-2" data-category="living" style="grid-column: span 4;">
        <div class="p-6 text-center" style="background: linear-gradient(180deg, #e8ded0, #FFF8F0);">
          <div class="flex justify-center mb-4">
            <svg viewBox="0 0 80 120" class="w-16 h-24 card-img">
              <rect x="15" y="10" width="50" height="75" rx="3" fill="#5C4033" opacity="0.35"/>
              <line x1="15" y1="35" x2="65" y2="35" stroke="#5C4033" stroke-width="1" opacity="0.3"/>
              <line x1="15" y1="60" x2="65" y2="60" stroke="#5C4033" stroke-width="1" opacity="0.3"/>
              <rect x="10" y="85" width="60" height="6" rx="1" fill="#5C4033" opacity="0.5"/>
              <rect x="18" y="91" width="8" height="20" rx="2" fill="#5C4033" opacity="0.35"/>
              <rect x="54" y="91" width="8" height="20" rx="2" fill="#5C4033" opacity="0.35"/>
            </svg>
          </div>
          <span class="text-xs text-oak font-medium tracking-wider uppercase font-body">Living</span>
          <h3 class="font-display text-base font-bold text-charcoal mt-1">Tall Bookshelf</h3>
          <p class="font-display text-lg font-bold text-oak mt-2">$1,260</p>
          <button class="add-cart-btn text-xs mt-3 w-full py-2" onclick="addToCart('Tall Bookshelf', 1260)">Add to Cart</button>
        </div>
      </div>
    </div>

    <div class="text-center mt-12 shelf-up">
      <a href="#" class="inline-flex items-center gap-2 text-walnut hover:text-oak transition-colors font-medium tracking-wide text-sm uppercase font-body">
        View All 86 Pieces
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </a>
    </div>
  </div>
</section>

<!-- ===== SECTION 4: Material Explorer ===== -->
<section id="materials" class="py-20 md:py-28 bg-cream wood-grain-bg">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-2 gap-16 items-center">
      <div class="shelf-left">
        <p class="text-oak text-sm tracking-widest uppercase mb-3 font-body font-medium">Honest Materials</p>
        <h2 class="font-display text-4xl md:text-5xl font-bold text-charcoal mb-6">Feel the<br>Difference</h2>
        <p class="text-walnut/70 text-lg leading-relaxed mb-8 font-body">
          Every piece starts with responsibly sourced hardwood. We select each plank for grain character, then finish by hand with natural oils that deepen with age.
        </p>

        <div class="flex gap-5 mb-8" id="materialSwatches">
          <button class="swatch active" data-material="oak" style="background: linear-gradient(135deg, #B8860B, #D4A030);" title="White Oak"></button>
          <button class="swatch" data-material="walnut" style="background: linear-gradient(135deg, #5C4033, #7B5B4C);" title="Black Walnut"></button>
          <button class="swatch" data-material="cherry" style="background: linear-gradient(135deg, #8B4513, #A0522D);" title="Cherry"></button>
          <button class="swatch" data-material="pine" style="background: linear-gradient(135deg, #C4A35A, #D4B86A);" title="Pine"></button>
        </div>

        <div id="materialInfo">
          <div class="paper-card p-6" data-material="oak">
            <h4 class="font-display text-lg font-bold text-charcoal">White Oak</h4>
            <p class="text-walnut/60 text-sm mt-2 font-body leading-relaxed">Dense, durable, and naturally water-resistant. Our signature wood with a warm golden hue that deepens beautifully over decades. Sourced from managed forests in Appalachia.</p>
            <div class="flex gap-6 mt-4 text-xs text-walnut/50 font-body">
              <span class="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#87A878" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Hardness: 1360 Janka</span>
              <span class="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#87A878" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg> Origin: Appalachia, USA</span>
            </div>
          </div>
          <div class="paper-card p-6" data-material="walnut" style="display:none;">
            <h4 class="font-display text-lg font-bold text-charcoal">Black Walnut</h4>
            <p class="text-walnut/60 text-sm mt-2 font-body leading-relaxed">Rich, chocolate-brown heartwood with striking grain patterns. The most prized North American hardwood, each piece has a unique character. Hand-rubbed with tung oil finish.</p>
            <div class="flex gap-6 mt-4 text-xs text-walnut/50 font-body">
              <span class="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#87A878" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Hardness: 1010 Janka</span>
              <span class="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#87A878" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg> Origin: Missouri, USA</span>
            </div>
          </div>
          <div class="paper-card p-6" data-material="cherry" style="display:none;">
            <h4 class="font-display text-lg font-bold text-charcoal">American Cherry</h4>
            <p class="text-walnut/60 text-sm mt-2 font-body leading-relaxed">Warm reddish-brown tones that develop a rich patina over time. Fine, straight grain with a natural luster that needs minimal finishing. A favorite for heirloom pieces.</p>
            <div class="flex gap-6 mt-4 text-xs text-walnut/50 font-body">
              <span class="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#87A878" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Hardness: 950 Janka</span>
              <span class="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#87A878" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg> Origin: Pennsylvania, USA</span>
            </div>
          </div>
          <div class="paper-card p-6" data-material="pine" style="display:none;">
            <h4 class="font-display text-lg font-bold text-charcoal">Reclaimed Pine</h4>
            <p class="text-walnut/60 text-sm mt-2 font-body leading-relaxed">Salvaged from century-old barns and structures. Each plank carries the marks of its history. No two pieces are alike.</p>
            <div class="flex gap-6 mt-4 text-xs text-walnut/50 font-body">
              <span class="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#87A878" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Hardness: 690 Janka</span>
              <span class="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#87A878" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg> Origin: Reclaimed, Various</span>
            </div>
          </div>
        </div>
      </div>

      <div class="shelf-right">
        <div class="paper-card overflow-hidden" id="materialPreview">
          <div class="relative" style="height: 480px;">
            <div class="material-preview-pane absolute inset-0 flex items-center justify-center" data-material="oak" style="background: linear-gradient(160deg, #f5ead6 0%, #e8d5b8 40%, #d4c4a0 100%);">
              <svg viewBox="0 0 300 300" class="w-48 h-48" style="filter: drop-shadow(0 12px 32px rgba(184,134,11,0.2));">
                <rect x="20" y="80" width="260" height="140" rx="12" fill="#B8860B" opacity="0.5"/>
                <rect x="20" y="65" width="260" height="30" rx="8" fill="#B8860B" opacity="0.4"/>
                <rect x="15" y="60" width="55" height="165" rx="10" fill="#B8860B" opacity="0.45"/>
                <rect x="230" y="60" width="55" height="165" rx="10" fill="#B8860B" opacity="0.45"/>
                <rect x="45" y="220" width="8" height="40" rx="3" fill="#5C4033" opacity="0.4"/>
                <rect x="247" y="220" width="8" height="40" rx="3" fill="#5C4033" opacity="0.4"/>
              </svg>
            </div>
            <div class="material-preview-pane absolute inset-0 flex items-center justify-center" data-material="walnut" style="display:none; background: linear-gradient(160deg, #e0d0c0 0%, #c4a890 40%, #a88070 100%);">
              <svg viewBox="0 0 300 300" class="w-48 h-48" style="filter: drop-shadow(0 12px 32px rgba(92,64,51,0.25));">
                <rect x="20" y="80" width="260" height="140" rx="12" fill="#5C4033" opacity="0.5"/>
                <rect x="20" y="65" width="260" height="30" rx="8" fill="#5C4033" opacity="0.4"/>
                <rect x="15" y="60" width="55" height="165" rx="10" fill="#5C4033" opacity="0.45"/>
                <rect x="230" y="60" width="55" height="165" rx="10" fill="#5C4033" opacity="0.45"/>
                <rect x="45" y="220" width="8" height="40" rx="3" fill="#3D2A1F" opacity="0.4"/>
                <rect x="247" y="220" width="8" height="40" rx="3" fill="#3D2A1F" opacity="0.4"/>
              </svg>
            </div>
            <div class="material-preview-pane absolute inset-0 flex items-center justify-center" data-material="cherry" style="display:none; background: linear-gradient(160deg, #f0dcc8 0%, #d4b098 40%, #c09878 100%);">
              <svg viewBox="0 0 300 300" class="w-48 h-48" style="filter: drop-shadow(0 12px 32px rgba(139,69,19,0.2));">
                <rect x="20" y="80" width="260" height="140" rx="12" fill="#8B4513" opacity="0.5"/>
                <rect x="20" y="65" width="260" height="30" rx="8" fill="#8B4513" opacity="0.4"/>
                <rect x="15" y="60" width="55" height="165" rx="10" fill="#8B4513" opacity="0.45"/>
                <rect x="230" y="60" width="55" height="165" rx="10" fill="#8B4513" opacity="0.45"/>
                <rect x="45" y="220" width="8" height="40" rx="3" fill="#5C3010" opacity="0.4"/>
                <rect x="247" y="220" width="8" height="40" rx="3" fill="#5C3010" opacity="0.4"/>
              </svg>
            </div>
            <div class="material-preview-pane absolute inset-0 flex items-center justify-center" data-material="pine" style="display:none; background: linear-gradient(160deg, #f5eed8 0%, #e0d4b8 40%, #ccc0a0 100%);">
              <svg viewBox="0 0 300 300" class="w-48 h-48" style="filter: drop-shadow(0 12px 32px rgba(196,163,90,0.2));">
                <rect x="20" y="80" width="260" height="140" rx="12" fill="#C4A35A" opacity="0.5"/>
                <rect x="20" y="65" width="260" height="30" rx="8" fill="#C4A35A" opacity="0.4"/>
                <rect x="15" y="60" width="55" height="165" rx="10" fill="#C4A35A" opacity="0.45"/>
                <rect x="230" y="60" width="55" height="165" rx="10" fill="#C4A35A" opacity="0.45"/>
                <rect x="45" y="220" width="8" height="40" rx="3" fill="#9A8040" opacity="0.4"/>
                <rect x="247" y="220" width="8" height="40" rx="3" fill="#9A8040" opacity="0.4"/>
              </svg>
            </div>
          </div>
          <div class="p-6 text-center border-t border-oak/10">
            <p class="text-sm text-walnut/60 font-body" id="materialCaption">Viewing in <strong>White Oak</strong> &mdash; click swatches to compare</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===== SECTION 5: Customers' Rooms Gallery ===== -->
<section id="gallery" class="py-20 md:py-28 bg-cream">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-12 shelf-up">
      <p class="text-oak text-sm tracking-widest uppercase mb-3 font-body font-medium">#MyWoodhaus</p>
      <h2 class="font-display text-4xl md:text-5xl font-bold text-charcoal">Customers' Rooms</h2>
      <div class="section-divider"></div>
      <p class="text-walnut/60 mt-4 font-body max-w-lg mx-auto">Real homes, real stories. See how our community styles their WOODHAUS pieces.</p>
    </div>

    <div class="relative">
      <div class="overflow-hidden" id="galleryViewport">
        <div class="flex gap-5 transition-transform duration-500 ease-out" id="galleryTrack" style="transform: translateX(0);">
          <div class="flex-shrink-0 w-80 paper-card overflow-hidden furniture-card gallery-track-item">
            <div class="h-56" style="background: linear-gradient(135deg, #f0e6d2 0%, #e0d4b8 50%, #d4c4a0 100%);">
              <div class="h-full flex items-center justify-center p-6">
                <svg viewBox="0 0 200 150" class="w-full"><rect x="10" y="60" width="80" height="50" rx="6" fill="#B8860B" opacity="0.3"/><rect x="100" y="70" width="90" height="40" rx="3" fill="#5C4033" opacity="0.25"/><rect x="30" y="120" width="60" height="20" rx="3" fill="#5C4033" opacity="0.2"/><circle cx="170" cy="45" r="18" fill="#87A878" opacity="0.2"/></svg>
              </div>
            </div>
            <div class="p-4">
              <p class="text-sm font-medium text-charcoal font-body">Sarah's Living Room</p>
              <p class="text-xs text-walnut/50 mt-1 font-body">Brooklyn, NY &mdash; Oslo Sofa + Arc Lamp</p>
            </div>
          </div>
          <div class="flex-shrink-0 w-80 paper-card overflow-hidden furniture-card gallery-track-item">
            <div class="h-56" style="background: linear-gradient(135deg, #e8d8c4 0%, #d8c8b0 50%, #c8b8a0 100%);">
              <div class="h-full flex items-center justify-center p-6">
                <svg viewBox="0 0 200 150" class="w-full"><rect x="40" y="40" width="120" height="60" rx="4" fill="#5C4033" opacity="0.3"/><rect x="20" y="100" width="40" height="30" rx="3" fill="#5C4033" opacity="0.2"/><rect x="140" y="100" width="40" height="30" rx="3" fill="#5C4033" opacity="0.2"/><ellipse cx="100" cy="130" rx="60" ry="12" fill="#B8860B" opacity="0.1"/></svg>
              </div>
            </div>
            <div class="p-4">
              <p class="text-sm font-medium text-charcoal font-body">James's Bedroom</p>
              <p class="text-xs text-walnut/50 mt-1 font-body">Portland, OR &mdash; Platform Bed + Nightstands</p>
            </div>
          </div>
          <div class="flex-shrink-0 w-80 paper-card overflow-hidden furniture-card gallery-track-item">
            <div class="h-56" style="background: linear-gradient(135deg, #f5e8d0 0%, #e8d8c0 50%, #dcc8b0 100%);">
              <div class="h-full flex items-center justify-center p-6">
                <svg viewBox="0 0 200 150" class="w-full"><ellipse cx="100" cy="80" rx="70" ry="35" fill="#5C4033" opacity="0.25"/><rect x="30" y="30" width="20" height="25" rx="10" fill="#B8860B" opacity="0.25"/><rect x="60" y="25" width="20" height="25" rx="10" fill="#B8860B" opacity="0.25"/><rect x="120" y="25" width="20" height="25" rx="10" fill="#B8860B" opacity="0.25"/><rect x="150" y="30" width="20" height="25" rx="10" fill="#B8860B" opacity="0.25"/><rect x="30" y="105" width="20" height="25" rx="10" fill="#B8860B" opacity="0.2"/><rect x="150" y="105" width="20" height="25" rx="10" fill="#B8860B" opacity="0.2"/></svg>
              </div>
            </div>
            <div class="p-4">
              <p class="text-sm font-medium text-charcoal font-body">The Tanaka Dining</p>
              <p class="text-xs text-walnut/50 mt-1 font-body">Austin, TX &mdash; Oval Table + 6 Chairs</p>
            </div>
          </div>
          <div class="flex-shrink-0 w-80 paper-card overflow-hidden furniture-card gallery-track-item">
            <div class="h-56" style="background: linear-gradient(135deg, #e4dcc8 0%, #d4ccb0 50%, #c4bca0 100%);">
              <div class="h-full flex items-center justify-center p-6">
                <svg viewBox="0 0 200 150" class="w-full"><rect x="50" y="20" width="100" height="60" rx="3" fill="#5C4033" opacity="0.3"/><rect x="50" y="80" width="100" height="10" rx="2" fill="#5C4033" opacity="0.35"/><rect x="60" y="90" width="8" height="30" rx="2" fill="#5C4033" opacity="0.25"/><rect x="132" y="90" width="8" height="30" rx="2" fill="#5C4033" opacity="0.25"/><rect x="15" y="30" width="20" height="70" rx="2" fill="#87A878" opacity="0.2"/><rect x="165" y="50" width="25" height="30" rx="2" fill="#B8860B" opacity="0.2"/></svg>
              </div>
            </div>
            <div class="p-4">
              <p class="text-sm font-medium text-charcoal font-body">Maya's Home Office</p>
              <p class="text-xs text-walnut/50 mt-1 font-body">Denver, CO &mdash; Writing Desk + Bookshelf</p>
            </div>
          </div>
          <div class="flex-shrink-0 w-80 paper-card overflow-hidden furniture-card gallery-track-item">
            <div class="h-56" style="background: linear-gradient(135deg, #ece2d0 0%, #dcd2c0 50%, #ccc2b0 100%);">
              <div class="h-full flex items-center justify-center p-6">
                <svg viewBox="0 0 200 150" class="w-full"><rect x="20" y="50" width="160" height="60" rx="8" fill="#B8860B" opacity="0.25"/><rect x="20" y="35" width="160" height="25" rx="6" fill="#B8860B" opacity="0.2"/><circle cx="40" cy="30" r="15" fill="#87A878" opacity="0.2"/><rect x="100" y="120" width="50" height="20" rx="3" fill="#5C4033" opacity="0.2"/></svg>
              </div>
            </div>
            <div class="p-4">
              <p class="text-sm font-medium text-charcoal font-body">Liam and Emma's Den</p>
              <p class="text-xs text-walnut/50 mt-1 font-body">Chicago, IL &mdash; Sectional + Plants</p>
            </div>
          </div>
        </div>
      </div>
      <button class="gallery-btn absolute left-4 top-1/2 -translate-y-1/2 z-10" id="galleryPrev" aria-label="Previous">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5C4033" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button class="gallery-btn absolute right-4 top-1/2 -translate-y-1/2 z-10" id="galleryNext" aria-label="Next">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5C4033" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  </div>
</section>

<!-- ===== SECTION 6: Delivery & Assembly Info Bar ===== -->
<section class="py-16 md:py-20 linen-texture" style="background: linear-gradient(135deg, #5C4033 0%, #3D2A1F 100%);">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
      <div class="text-center shelf-up">
        <div class="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: rgba(184,134,11,0.15);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8860B" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        </div>
        <h4 class="font-display text-cream text-lg font-bold">White-Glove Delivery</h4>
        <p class="text-cream/50 text-sm mt-2 font-body">Placed in your room of choice, packaging removed</p>
      </div>
      <div class="text-center shelf-up stagger-1">
        <div class="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: rgba(135,168,120,0.15);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#87A878" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        </div>
        <h4 class="font-display text-cream text-lg font-bold">Expert Assembly</h4>
        <p class="text-cream/50 text-sm mt-2 font-body">Professional setup included on orders over $500</p>
      </div>
      <div class="text-center shelf-up stagger-2">
        <div class="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: rgba(184,134,11,0.15);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8860B" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        <h4 class="font-display text-cream text-lg font-bold">5-Year Warranty</h4>
        <p class="text-cream/50 text-sm mt-2 font-body">Full structural coverage on every piece we make</p>
      </div>
      <div class="text-center shelf-up stagger-3">
        <div class="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: rgba(135,168,120,0.15);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#87A878" stroke-width="2"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9"/></svg>
        </div>
        <h4 class="font-display text-cream text-lg font-bold">Sustainable Source</h4>
        <p class="text-cream/50 text-sm mt-2 font-body">FSC-certified wood from managed forests only</p>
      </div>
    </div>
  </div>
</section>

<!-- ===== SECTION 7: Newsletter with Wood-Grain Background ===== -->
<section class="py-20 md:py-28 wood-grain-bg relative overflow-hidden">
  <div class="absolute inset-0" style="background: repeating-linear-gradient(175deg, transparent, transparent 8px, rgba(184,134,11,0.02) 8px, rgba(184,134,11,0.02) 16px);"></div>
  <div class="max-w-2xl mx-auto px-6 text-center relative z-10">
    <div class="shelf-up">
      <svg width="48" height="48" viewBox="0 0 48 48" class="mx-auto mb-6" style="animation: gentleBob 3s ease-in-out infinite;">
        <rect x="8" y="28" width="32" height="4" rx="1" fill="#5C4033" opacity="0.5"/>
        <rect x="12" y="10" width="10" height="18" rx="2" fill="#B8860B" opacity="0.4"/>
        <rect x="26" y="14" width="10" height="14" rx="2" fill="#87A878" opacity="0.4"/>
        <circle cx="14" cy="36" r="3" fill="#5C4033" opacity="0.4"/>
        <circle cx="34" cy="36" r="3" fill="#5C4033" opacity="0.4"/>
      </svg>
      <h2 class="font-display text-3xl md:text-4xl font-bold text-charcoal mb-4">Join the Workshop</h2>
      <p class="text-walnut/60 font-body mb-8 max-w-md mx-auto">Get early access to new collections, maker stories, and exclusive workshop invitations. No spam &mdash; just honest craft.</p>
      <div class="flex max-w-lg mx-auto">
        <input type="email" placeholder="Your email address" class="newsletter-input flex-1" id="newsletterEmail">
        <button class="add-cart-btn rounded-none rounded-r-sm px-8 whitespace-nowrap" onclick="subscribeNewsletter()">Subscribe</button>
      </div>
      <p class="text-xs text-walnut/40 mt-4 font-body">Join 12,400+ furniture enthusiasts. Unsubscribe anytime.</p>
    </div>
  </div>
</section>

<!-- ===== FOOTER ===== -->
<footer class="bg-charcoal text-cream/70 py-16">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
      <div>
        <div class="flex items-center gap-2 mb-5">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none"><rect x="4" y="22" width="24" height="3" rx="1" fill="#B8860B"/><rect x="6" y="8" width="8" height="14" rx="1" fill="#B8860B" opacity="0.6"/><rect x="18" y="12" width="8" height="10" rx="1" fill="#87A878" opacity="0.6"/></svg>
          <span class="font-display text-cream font-bold">WOODHAUS</span>
        </div>
        <p class="text-sm leading-relaxed font-body">Crafted furniture for modern living. Sustainably sourced, beautifully made.</p>
      </div>
      <div>
        <h4 class="font-display text-cream font-bold mb-4 text-sm uppercase tracking-wider">Shop</h4>
        <ul class="space-y-2 text-sm font-body">
          <li><a href="#" class="hover:text-oak transition-colors">Living Room</a></li>
          <li><a href="#" class="hover:text-oak transition-colors">Bedroom</a></li>
          <li><a href="#" class="hover:text-oak transition-colors">Dining</a></li>
          <li><a href="#" class="hover:text-oak transition-colors">Office</a></li>
          <li><a href="#" class="hover:text-oak transition-colors">Outdoor</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-display text-cream font-bold mb-4 text-sm uppercase tracking-wider">About</h4>
        <ul class="space-y-2 text-sm font-body">
          <li><a href="#" class="hover:text-oak transition-colors">Our Story</a></li>
          <li><a href="#" class="hover:text-oak transition-colors">Workshops</a></li>
          <li><a href="#" class="hover:text-oak transition-colors">Sustainability</a></li>
          <li><a href="#" class="hover:text-oak transition-colors">Careers</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-display text-cream font-bold mb-4 text-sm uppercase tracking-wider">Support</h4>
        <ul class="space-y-2 text-sm font-body">
          <li><a href="#" class="hover:text-oak transition-colors">Contact Us</a></li>
          <li><a href="#" class="hover:text-oak transition-colors">Delivery Info</a></li>
          <li><a href="#" class="hover:text-oak transition-colors">Returns</a></li>
          <li><a href="#" class="hover:text-oak transition-colors">Care Guide</a></li>
          <li><a href="#" class="hover:text-oak transition-colors">FAQ</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-cream/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="text-xs font-body">&copy; 2026 WOODHAUS. All rights reserved.</p>
      <div class="flex items-center gap-5">
        <a href="#" class="text-cream/40 hover:text-oak transition-colors" aria-label="Instagram">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
        </a>
        <a href="#" class="text-cream/40 hover:text-oak transition-colors" aria-label="Pinterest">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 21c1-3 1.5-5.5 2-7.5.5-2-.5-3 1-4.5s4-1 4.5 1c.5 2-1 4-3.5 4-1 0-1.5-.5-1.5-1.5 0-2 1.5-4 1.5-5.5s-1-2-2 0-1.5 3-2 5-1 4-1.5 5.5"/></svg>
        </a>
        <a href="#" class="text-cream/40 hover:text-oak transition-colors" aria-label="YouTube">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none"/></svg>
        </a>
      </div>
    </div>
  </div>
</footer>

<!-- Toast Container -->
<div id="toastContainer" class="fixed bottom-8 right-8 z-50 flex flex-col gap-3"></div>

<!-- ===== JAVASCRIPT ===== -->
<script>
(function() {
  'use strict';

  /* ---- Cart State ---- */
  var cartItems = [];
  var cartTotal = 0;

  function addToCart(name, price) {
    cartItems.push({ name: name, price: price });
    cartTotal += price;
    updateCartBadge();
    showToast('Added to cart: ' + name + ' \u2014 $' + price.toLocaleString());
  }

  function updateCartBadge() {
    var badge = document.getElementById('cartCount');
    if (cartItems.length > 0) {
      badge.style.display = 'flex';
      badge.textContent = cartItems.length;
    } else {
      badge.style.display = 'none';
    }
  }

  window.addToCart = addToCart;

  /* ---- Toast System ---- */
  function showToast(message) {
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#87A878" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg><span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3600);
  }

  window.showToast = showToast;

  /* ---- Initial delivery toast ---- */
  setTimeout(function() { showToast('Free delivery on orders over $999'); }, 2000);

  /* ---- Room Tab Switching ---- */
  var roomTabs = document.querySelectorAll('.room-tab');
  var roomPanels = document.querySelectorAll('.room-panel');

  roomTabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var room = this.getAttribute('data-room');
      roomTabs.forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
      roomPanels.forEach(function(p) {
        if (p.getAttribute('data-room') === room) {
          p.style.display = 'block';
          p.style.animation = 'fadeScale 0.4s ease forwards';
        } else {
          p.style.display = 'none';
        }
      });
    });
  });

  /* ---- Material Swatch Switching ---- */
  var swatches = document.querySelectorAll('#materialSwatches .swatch');
  var materialInfoPanels = document.querySelectorAll('#materialInfo .paper-card');
  var materialPreviews = document.querySelectorAll('.material-preview-pane');
  var materialNames = { oak: 'White Oak', walnut: 'Black Walnut', cherry: 'American Cherry', pine: 'Reclaimed Pine' };
  var materialCaption = document.getElementById('materialCaption');

  swatches.forEach(function(swatch) {
    swatch.addEventListener('click', function() {
      var mat = this.getAttribute('data-material');
      swatches.forEach(function(s) { s.classList.remove('active'); });
      this.classList.add('active');
      materialInfoPanels.forEach(function(p) {
        if (p.getAttribute('data-material') === mat) { p.style.display = 'block'; p.style.animation = 'fadeScale 0.35s ease forwards'; }
        else { p.style.display = 'none'; }
      });
      materialPreviews.forEach(function(p) {
        if (p.getAttribute('data-material') === mat) { p.style.display = 'flex'; p.style.animation = 'fadeScale 0.5s ease forwards'; }
        else { p.style.display = 'none'; }
      });
      materialCaption.innerHTML = 'Viewing in <strong>' + materialNames[mat] + '</strong> \u2014 click swatches to compare';
    });
  });

  /* ---- Collection Filter ---- */
  var filterPills = document.querySelectorAll('#collectionFilters .filter-pill');
  var productCards = document.querySelectorAll('#productGrid .furniture-card');

  filterPills.forEach(function(pill) {
    pill.addEventListener('click', function() {
      var filter = this.getAttribute('data-filter');
      filterPills.forEach(function(p) { p.classList.remove('active'); });
      this.classList.add('active');
      productCards.forEach(function(card) {
        var category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = '';
          card.style.animation = 'fadeScale 0.4s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* ---- Gallery Carousel ---- */
  var galleryTrack = document.getElementById('galleryTrack');
  var galleryPrev = document.getElementById('galleryPrev');
  var galleryNext = document.getElementById('galleryNext');
  var galleryIndex = 0;
  var galleryItemWidth = 340;

  function updateGallery() {
    var maxIndex = galleryTrack.children.length - 3;
    if (maxIndex < 0) maxIndex = 0;
    if (galleryIndex < 0) galleryIndex = 0;
    if (galleryIndex > maxIndex) galleryIndex = maxIndex;
    galleryTrack.style.transform = 'translateX(-' + (galleryIndex * galleryItemWidth) + 'px)';
  }

  galleryPrev.addEventListener('click', function() { galleryIndex--; updateGallery(); });
  galleryNext.addEventListener('click', function() { galleryIndex++; updateGallery(); });

  /* ---- Newsletter ---- */
  function subscribeNewsletter() {
    var email = document.getElementById('newsletterEmail').value;
    if (email && email.indexOf('@') > -1) {
      showToast('Welcome to the Workshop! Check your inbox.');
      document.getElementById('newsletterEmail').value = '';
    } else {
      showToast('Please enter a valid email address.');
    }
  }
  window.subscribeNewsletter = subscribeNewsletter;

  /* ---- Cart Button ---- */
  document.getElementById('cartBtn').addEventListener('click', function() {
    if (cartItems.length === 0) { showToast('Your cart is empty. Start exploring!'); }
    else { showToast('Cart: ' + cartItems.length + ' item(s) \u2014 $' + cartTotal.toLocaleString()); }
  });

  /* ---- IntersectionObserver for Scroll Reveal ---- */
  var revealElements = document.querySelectorAll('.shelf-left, .shelf-right, .shelf-up, .fade-scale');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(function(el) { observer.observe(el); });
  } else {
    revealElements.forEach(function(el) { el.classList.add('revealed'); });
  }

  /* ---- Room SVG furniture dot hover ---- */
  var furnitureDots = document.querySelectorAll('.room-furniture-dot');
  furnitureDots.forEach(function(dot) {
    dot.addEventListener('mouseenter', function() {
      this.style.opacity = '0.5';
      this.style.filter = 'drop-shadow(0 0 8px rgba(184,134,11,0.4))';
    });
    dot.addEventListener('mouseleave', function() {
      this.style.opacity = '';
      this.style.filter = '';
    });
  });

  /* ---- Mobile menu ---- */
  var mobileMenuBtn = document.getElementById('mobileMenuBtn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
      showToast('Mobile menu \u2014 use navigation links above');
    });
  }

})();
</script>

</body>
</html>$HTML$,
  2
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
