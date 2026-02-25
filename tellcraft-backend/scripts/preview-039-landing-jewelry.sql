INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '2b03734b-1777-4384-9507-35804f525f20',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LUMIÈRE — Fine Jewelry</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Jost:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        gold: '#D4AF37',
        'gold-light': '#E8C967',
        'gold-dark': '#A8882C',
        rosegold: '#B76E79',
        platinum: '#E5E4E2',
        velvet: '#0A0A0A',
        champagne: '#F7E7CE',
        navy: '#0C1222',
        'navy-light': '#141D33'
      },
      fontFamily: {
        display: ['Cinzel Decorative', 'serif'],
        body: ['Jost', 'sans-serif']
      }
    }
  }
}
</script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Jost', sans-serif; background: #0A0A0A; color: #E5E4E2; overflow-x: hidden; }
h1,h2,h3,.font-display { font-family: 'Cinzel Decorative', serif; }
html { scroll-behavior: smooth; }

/* Gold line reveal animation */
.gold-reveal { opacity: 0; transition: opacity 1.2s ease, transform 1.2s ease; transform: translateY(30px); }
.gold-reveal.visible { opacity: 1; transform: translateY(0); }
.gold-reveal::before { content: ''; position: absolute; top: -1px; left: 50%; width: 0; height: 1px; background: linear-gradient(90deg, transparent, #D4AF37, transparent); transition: width 1.4s ease 0.3s, left 1.4s ease 0.3s; }
.gold-reveal.visible::before { width: 60%; left: 20%; }

/* Sparkle particles */
.sparkle-dot {
  position: absolute;
  width: 3px; height: 3px;
  border-radius: 50%;
  background: #D4AF37;
  animation: sparkle-twinkle var(--dur, 2.5s) ease-in-out infinite;
  animation-delay: var(--delay, 0s);
  opacity: 0;
}
@keyframes sparkle-twinkle {
  0%, 100% { opacity: 0; transform: scale(0.3); }
  40% { opacity: 1; transform: scale(1.2); }
  60% { opacity: 0.8; transform: scale(1); }
}

/* Shimmer sweep for buttons */
.shimmer-sweep { position: relative; overflow: hidden; }
.shimmer-sweep::after {
  content: '';
  position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  animation: sweep 4s ease-in-out infinite;
}
@keyframes sweep { 0%{left:-100%} 50%{left:150%} 100%{left:150%} }

/* Gold foil gradient text */
.gold-foil {
  background: linear-gradient(135deg, #D4AF37 0%, #F7E7CE 25%, #D4AF37 50%, #B76E79 75%, #D4AF37 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: foil-shift 6s ease-in-out infinite;
}
@keyframes foil-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

/* Gem glow pulse */
@keyframes gem-glow {
  0%, 100% { filter: drop-shadow(0 0 15px rgba(212,175,55,0.3)); }
  50% { filter: drop-shadow(0 0 35px rgba(212,175,55,0.6)) drop-shadow(0 0 60px rgba(212,175,55,0.2)); }
}

/* Horizontal scroll snap */
.snap-scroll {
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.snap-scroll::-webkit-scrollbar { display: none; }
.snap-item { scroll-snap-align: center; }

/* Flip card */
.flip-card { perspective: 800px; }
.flip-inner {
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}
.flip-card:hover .flip-inner { transform: rotateY(180deg); }
.flip-front, .flip-back { backface-visibility: hidden; }
.flip-back { transform: rotateY(180deg); }

/* Gold hairline */
.gold-hairline { border-image: linear-gradient(90deg, transparent 5%, #D4AF37 30%, #D4AF37 70%, transparent 95%) 1; }

/* Slow float */
@keyframes slow-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  33% { transform: translateY(-6px) rotate(0.5deg); }
  66% { transform: translateY(3px) rotate(-0.3deg); }
}

/* Ring rotation */
@keyframes ring-rotate {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}

/* Star sparkle for craftsmanship */
@keyframes star-pulse {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* Toast */
.toast-show { transform: translateY(0) !important; opacity: 1 !important; }

/* Modal fade */
.modal-overlay { opacity: 0; transition: opacity 0.3s ease; pointer-events: none; }
.modal-overlay.active { opacity: 1; pointer-events: all; }
.modal-overlay .modal-box { transform: translateY(20px) scale(0.97); transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }
.modal-overlay.active .modal-box { transform: translateY(0) scale(1); }

/* Engraving font */
@keyframes engrave-appear {
  from { opacity: 0; letter-spacing: 0.5em; }
  to { opacity: 1; letter-spacing: 0.15em; }
}
</style>
</head>
<body>

<!-- ========== NAVBAR ========== -->
<nav class="fixed top-0 w-full z-50 transition-all duration-500" id="navbar">
  <div class="max-w-[1400px] mx-auto px-8 h-20 flex items-center justify-between">
    <a href="#" class="font-display text-xl tracking-[0.25em] text-gold">LUMIÈRE</a>
    <div class="hidden md:flex items-center gap-10">
      <a href="#collections" class="text-xs tracking-[0.2em] uppercase text-platinum/60 hover:text-gold transition-colors duration-300 font-medium">Collections</a>
      <a href="#craft" class="text-xs tracking-[0.2em] uppercase text-platinum/60 hover:text-gold transition-colors duration-300 font-medium">Our Craft</a>
      <a href="#materials" class="text-xs tracking-[0.2em] uppercase text-platinum/60 hover:text-gold transition-colors duration-300 font-medium">Materials</a>
      <a href="#sizing" class="text-xs tracking-[0.2em] uppercase text-platinum/60 hover:text-gold transition-colors duration-300 font-medium">Ring Guide</a>
      <a href="#engrave" class="text-xs tracking-[0.2em] uppercase text-platinum/60 hover:text-gold transition-colors duration-300 font-medium">Engrave</a>
    </div>
    <div class="flex items-center gap-5">
      <button onclick="openModal('appointment-modal')" class="hidden md:block text-xs tracking-[0.15em] uppercase border border-gold/40 text-gold px-5 py-2 hover:bg-gold hover:text-velvet transition-all duration-300">Book Appointment</button>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-platinum/70">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-velvet/98 backdrop-blur-xl border-t border-gold/10 px-8 py-6 space-y-4">
    <a href="#collections" class="block text-xs tracking-[0.2em] uppercase text-platinum/60 hover:text-gold">Collections</a>
    <a href="#craft" class="block text-xs tracking-[0.2em] uppercase text-platinum/60 hover:text-gold">Our Craft</a>
    <a href="#materials" class="block text-xs tracking-[0.2em] uppercase text-platinum/60 hover:text-gold">Materials</a>
    <a href="#sizing" class="block text-xs tracking-[0.2em] uppercase text-platinum/60 hover:text-gold">Ring Guide</a>
    <a href="#engrave" class="block text-xs tracking-[0.2em] uppercase text-platinum/60 hover:text-gold">Engrave</a>
    <button onclick="openModal('appointment-modal')" class="block text-xs tracking-[0.15em] uppercase border border-gold/40 text-gold px-5 py-2 mt-3">Book Appointment</button>
  </div>
</nav>

<!-- ========== HERO — Full screen dark with gem SVG + sparkle particles ========== -->
<section class="min-h-screen flex items-center justify-center relative overflow-hidden bg-velvet" id="hero">
  <!-- Background radial glow -->
  <div class="absolute inset-0" style="background: radial-gradient(ellipse 60% 50% at 50% 45%, rgba(212,175,55,0.06) 0%, transparent 70%);"></div>
  <div class="absolute inset-0" style="background: radial-gradient(ellipse 40% 35% at 50% 50%, rgba(183,110,121,0.04) 0%, transparent 60%);"></div>

  <!-- Sparkle particles around the gem -->
  <div id="hero-sparkles" class="absolute inset-0 pointer-events-none">
    <span class="sparkle-dot" style="top:25%;left:38%;--dur:2.1s;--delay:0s;"></span>
    <span class="sparkle-dot" style="top:20%;left:55%;--dur:2.8s;--delay:0.4s;"></span>
    <span class="sparkle-dot" style="top:35%;left:62%;--dur:2.3s;--delay:0.8s;"></span>
    <span class="sparkle-dot" style="top:30%;left:33%;--dur:3.1s;--delay:1.2s;"></span>
    <span class="sparkle-dot" style="top:45%;left:58%;--dur:2.6s;--delay:0.2s;"></span>
    <span class="sparkle-dot" style="top:50%;left:40%;--dur:2.9s;--delay:1.5s;"></span>
    <span class="sparkle-dot" style="top:22%;left:47%;--dur:2.4s;--delay:0.6s;"></span>
    <span class="sparkle-dot" style="top:55%;left:52%;--dur:3.3s;--delay:1.0s;"></span>
    <span class="sparkle-dot" style="top:40%;left:44%;--dur:2.7s;--delay:1.8s;"></span>
    <span class="sparkle-dot" style="top:28%;left:50%;--dur:2.2s;--delay:0.3s;"></span>
    <span class="sparkle-dot" style="top:48%;left:36%;--dur:3.0s;--delay:1.4s;"></span>
    <span class="sparkle-dot" style="top:33%;left:56%;--dur:2.5s;--delay:0.9s;"></span>
    <span class="sparkle-dot" style="top:18%;left:42%;--dur:2.8s;--delay:1.6s;width:4px;height:4px;background:#F7E7CE;"></span>
    <span class="sparkle-dot" style="top:52%;left:48%;--dur:3.2s;--delay:0.7s;width:2px;height:2px;"></span>
    <span class="sparkle-dot" style="top:38%;left:38%;--dur:2.0s;--delay:2.0s;width:4px;height:4px;background:#B76E79;"></span>
    <span class="sparkle-dot" style="top:42%;left:60%;--dur:2.6s;--delay:1.1s;width:2px;height:2px;background:#F7E7CE;"></span>
  </div>

  <!-- Central gem SVG illustration -->
  <div class="relative z-10 flex flex-col items-center text-center px-6">
    <div class="mb-10" style="animation: gem-glow 4s ease-in-out infinite, slow-float 8s ease-in-out infinite;">
      <svg width="180" height="220" viewBox="0 0 180 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Diamond gem shape -->
        <polygon points="90,10 160,80 90,210 20,80" fill="url(#gemGrad)" stroke="#D4AF37" stroke-width="1"/>
        <polygon points="90,10 160,80 90,80" fill="url(#gemFacet1)" opacity="0.6"/>
        <polygon points="90,10 20,80 90,80" fill="url(#gemFacet2)" opacity="0.4"/>
        <polygon points="20,80 90,210 90,80" fill="url(#gemFacet3)" opacity="0.3"/>
        <polygon points="160,80 90,210 90,80" fill="url(#gemFacet4)" opacity="0.5"/>
        <!-- Top facets -->
        <polygon points="90,10 55,45 90,55 125,45" fill="url(#gemTop)" opacity="0.7"/>
        <line x1="90" y1="10" x2="55" y2="45" stroke="#D4AF37" stroke-width="0.5" opacity="0.5"/>
        <line x1="90" y1="10" x2="125" y2="45" stroke="#D4AF37" stroke-width="0.5" opacity="0.5"/>
        <line x1="55" y1="45" x2="20" y2="80" stroke="#D4AF37" stroke-width="0.5" opacity="0.4"/>
        <line x1="125" y1="45" x2="160" y2="80" stroke="#D4AF37" stroke-width="0.5" opacity="0.4"/>
        <line x1="90" y1="55" x2="90" y2="210" stroke="#D4AF37" stroke-width="0.3" opacity="0.3"/>
        <line x1="55" y1="45" x2="90" y2="80" stroke="#D4AF37" stroke-width="0.3" opacity="0.3"/>
        <line x1="125" y1="45" x2="90" y2="80" stroke="#D4AF37" stroke-width="0.3" opacity="0.3"/>
        <!-- Highlight flare -->
        <ellipse cx="75" cy="60" rx="12" ry="6" fill="white" opacity="0.15" transform="rotate(-15 75 60)"/>
        <defs>
          <linearGradient id="gemGrad" x1="90" y1="10" x2="90" y2="210">
            <stop offset="0%" stop-color="#F7E7CE"/>
            <stop offset="30%" stop-color="#D4AF37"/>
            <stop offset="60%" stop-color="#B76E79"/>
            <stop offset="100%" stop-color="#0C1222"/>
          </linearGradient>
          <linearGradient id="gemFacet1" x1="90" y1="10" x2="160" y2="80">
            <stop offset="0%" stop-color="#F7E7CE"/>
            <stop offset="100%" stop-color="#D4AF37"/>
          </linearGradient>
          <linearGradient id="gemFacet2" x1="90" y1="10" x2="20" y2="80">
            <stop offset="0%" stop-color="#E5E4E2"/>
            <stop offset="100%" stop-color="#D4AF37" stop-opacity="0.5"/>
          </linearGradient>
          <linearGradient id="gemFacet3" x1="20" y1="80" x2="90" y2="210">
            <stop offset="0%" stop-color="#D4AF37" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#0C1222"/>
          </linearGradient>
          <linearGradient id="gemFacet4" x1="160" y1="80" x2="90" y2="210">
            <stop offset="0%" stop-color="#B76E79" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="#0C1222"/>
          </linearGradient>
          <linearGradient id="gemTop" x1="90" y1="10" x2="90" y2="55">
            <stop offset="0%" stop-color="white" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#D4AF37" stop-opacity="0.1"/>
          </linearGradient>
        </defs>
      </svg>
    </div>

    <p class="text-gold/70 text-xs tracking-[0.4em] uppercase mb-5 font-body font-light">Est. 2008 &mdash; Taipei</p>
    <h1 class="font-display text-5xl md:text-7xl lg:text-8xl tracking-wide mb-6 leading-[1.1]">
      <span class="gold-foil">LUMIÈRE</span>
    </h1>
    <p class="text-platinum/50 text-lg md:text-xl font-body font-light max-w-lg mx-auto leading-relaxed mb-10">
      Where light meets stone. Every facet tells a story of craft, patience, and eternal beauty.
    </p>
    <a href="#collections" class="shimmer-sweep inline-block bg-gold text-velvet px-12 py-4 text-xs tracking-[0.2em] uppercase font-body font-semibold hover:bg-gold-light transition-colors duration-500">
      Explore Collections
    </a>

    <!-- Scroll indicator -->
    <div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
      <span class="text-gold/30 text-[10px] tracking-[0.3em] uppercase font-body">Discover</span>
      <div class="w-px h-12 bg-gradient-to-b from-gold/40 to-transparent"></div>
    </div>
  </div>
</section>

<!-- ========== GIFT WRAPPING TOAST BAR ========== -->
<div id="gift-bar" class="fixed top-20 left-0 right-0 z-40 bg-navy/95 backdrop-blur-md border-b border-gold/15 py-3 px-6 flex items-center justify-center gap-4 transition-all duration-500" style="transform: translateY(-100%); opacity: 0;">
  <svg class="w-4 h-4 text-gold flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18"/></svg>
  <span class="text-champagne/80 text-xs tracking-wide font-body">Complimentary gift wrapping on all orders</span>
  <button onclick="this.parentElement.style.transform='translateY(-100%)';this.parentElement.style.opacity='0'" class="text-platinum/40 hover:text-platinum/70 ml-2">
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
  </button>
</div>

<!-- ========== COLLECTION STRIP — Horizontal scroll with snap ========== -->
<section id="collections" class="py-28 relative">
  <div class="border-t border-gold/10 absolute top-0 left-0 right-0"></div>
  <div class="max-w-[1400px] mx-auto px-8 mb-14">
    <div class="gold-reveal relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <p class="text-gold/60 text-[10px] tracking-[0.4em] uppercase mb-3 font-body font-medium">Collections</p>
        <h2 class="font-display text-3xl md:text-4xl text-platinum">Our Curated Lines</h2>
      </div>
      <div class="flex gap-3">
        <button onclick="scrollCarousel(-1)" class="w-10 h-10 border border-gold/30 flex items-center justify-center text-gold/60 hover:bg-gold/10 hover:text-gold transition-all duration-300">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
        </button>
        <button onclick="scrollCarousel(1)" class="w-10 h-10 border border-gold/30 flex items-center justify-center text-gold/60 hover:bg-gold/10 hover:text-gold transition-all duration-300">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
        </button>
      </div>
    </div>
  </div>

  <div id="collection-carousel" class="snap-scroll flex gap-6 overflow-x-auto px-8 pb-4">
    <!-- Collection 1: Étoile -->
    <div class="snap-item flex-shrink-0 w-[320px] md:w-[380px] group cursor-pointer">
      <div class="aspect-[3/4] bg-gradient-to-br from-navy to-navy-light border border-gold/10 overflow-hidden relative">
        <div class="absolute inset-0 flex items-center justify-center">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none"><polygon points="60,5 72,42 110,42 78,65 88,102 60,80 32,102 42,65 10,42 48,42" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.7"/><polygon points="60,20 68,45 92,45 72,60 78,85 60,70 42,85 48,60 28,45 52,45" fill="url(#starFill)" opacity="0.3"/><defs><linearGradient id="starFill" x1="60" y1="20" x2="60" y2="85"><stop offset="0%" stop-color="#F7E7CE"/><stop offset="100%" stop-color="#D4AF37"/></linearGradient></defs></svg>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-velvet/80 via-transparent to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-6">
          <span class="text-gold/60 text-[10px] tracking-[0.3em] uppercase font-body">New Season</span>
          <h3 class="font-display text-xl text-platinum mt-1">Étoile</h3>
          <p class="text-platinum/40 text-sm font-body font-light mt-1">Star-cut diamonds in celestial settings</p>
        </div>
        <!-- Sparkle dots on hover -->
        <span class="sparkle-dot" style="top:15%;left:25%;--dur:1.8s;--delay:0s;"></span>
        <span class="sparkle-dot" style="top:22%;left:70%;--dur:2.2s;--delay:0.5s;"></span>
        <span class="sparkle-dot" style="top:40%;left:80%;--dur:2.5s;--delay:1.0s;"></span>
      </div>
    </div>

    <!-- Collection 2: Rose Éternelle -->
    <div class="snap-item flex-shrink-0 w-[320px] md:w-[380px] group cursor-pointer">
      <div class="aspect-[3/4] bg-gradient-to-br from-navy to-[#1a1020] border border-rosegold/10 overflow-hidden relative">
        <div class="absolute inset-0 flex items-center justify-center">
          <svg width="110" height="130" viewBox="0 0 110 130" fill="none">
            <path d="M55 20 C55 20 75 35 75 55 C75 70 65 80 55 85 C45 80 35 70 35 55 C35 35 55 20 55 20Z" fill="#B76E79" opacity="0.4" stroke="#B76E79" stroke-width="0.8"/>
            <path d="M55 30 C55 30 68 40 68 55 C68 65 62 72 55 76 C48 72 42 65 42 55 C42 40 55 30 55 30Z" fill="#B76E79" opacity="0.25"/>
            <path d="M40 50 C30 40 25 55 35 65 C38 68 45 72 55 85" stroke="#B76E79" stroke-width="0.6" fill="none" opacity="0.5"/>
            <path d="M70 50 C80 40 85 55 75 65 C72 68 65 72 55 85" stroke="#B76E79" stroke-width="0.6" fill="none" opacity="0.5"/>
            <line x1="55" y1="85" x2="55" y2="120" stroke="#4a7a4a" stroke-width="1.5"/>
            <path d="M55 95 C55 95 45 90 40 95" stroke="#4a7a4a" stroke-width="0.8" fill="none"/>
          </svg>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-velvet/80 via-transparent to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-6">
          <span class="text-rosegold/60 text-[10px] tracking-[0.3em] uppercase font-body">Signature</span>
          <h3 class="font-display text-xl text-platinum mt-1">Rose Éternelle</h3>
          <p class="text-platinum/40 text-sm font-body font-light mt-1">Rose gold & ruby poetry of romance</p>
        </div>
      </div>
    </div>

    <!-- Collection 3: Océan -->
    <div class="snap-item flex-shrink-0 w-[320px] md:w-[380px] group cursor-pointer">
      <div class="aspect-[3/4] bg-gradient-to-br from-navy to-[#0a1a2e] border border-platinum/10 overflow-hidden relative">
        <div class="absolute inset-0 flex items-center justify-center">
          <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
            <path d="M10 50 Q25 30 40 50 Q55 70 70 50 Q85 30 100 50 Q115 70 120 55" stroke="#5b8fb9" stroke-width="1.2" fill="none" opacity="0.5"/>
            <path d="M0 60 Q15 40 30 60 Q45 80 60 60 Q75 40 90 60 Q105 80 120 65" stroke="#5b8fb9" stroke-width="0.8" fill="none" opacity="0.3"/>
            <circle cx="60" cy="45" r="18" fill="none" stroke="#E5E4E2" stroke-width="0.8" opacity="0.4"/>
            <circle cx="60" cy="45" r="12" fill="url(#sapphireGrad)" opacity="0.6"/>
            <ellipse cx="55" cy="40" rx="4" ry="2.5" fill="white" opacity="0.2" transform="rotate(-20 55 40)"/>
            <defs><radialGradient id="sapphireGrad"><stop offset="0%" stop-color="#7db8e0"/><stop offset="100%" stop-color="#1a3a5c"/></radialGradient></defs>
          </svg>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-velvet/80 via-transparent to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-6">
          <span class="text-platinum/40 text-[10px] tracking-[0.3em] uppercase font-body">Limited Edition</span>
          <h3 class="font-display text-xl text-platinum mt-1">Océan</h3>
          <p class="text-platinum/40 text-sm font-body font-light mt-1">Sapphire depths & platinum waves</p>
        </div>
      </div>
    </div>

    <!-- Collection 4: Soleil -->
    <div class="snap-item flex-shrink-0 w-[320px] md:w-[380px] group cursor-pointer">
      <div class="aspect-[3/4] bg-gradient-to-br from-navy to-[#1a1810] border border-gold/10 overflow-hidden relative">
        <div class="absolute inset-0 flex items-center justify-center">
          <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
            <circle cx="55" cy="55" r="22" fill="url(#sunGrad)" opacity="0.5"/>
            <circle cx="55" cy="55" r="22" stroke="#D4AF37" stroke-width="0.8"/>
            <g stroke="#D4AF37" stroke-width="0.6" opacity="0.4">
              <line x1="55" y1="10" x2="55" y2="28"/><line x1="55" y1="82" x2="55" y2="100"/>
              <line x1="10" y1="55" x2="28" y2="55"/><line x1="82" y1="55" x2="100" y2="55"/>
              <line x1="23" y1="23" x2="36" y2="36"/><line x1="74" y1="74" x2="87" y2="87"/>
              <line x1="87" y1="23" x2="74" y2="36"/><line x1="36" y1="74" x2="23" y2="87"/>
            </g>
            <defs><radialGradient id="sunGrad"><stop offset="0%" stop-color="#F7E7CE"/><stop offset="100%" stop-color="#D4AF37"/></radialGradient></defs>
          </svg>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-velvet/80 via-transparent to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-6">
          <span class="text-gold/50 text-[10px] tracking-[0.3em] uppercase font-body">Bridal</span>
          <h3 class="font-display text-xl text-platinum mt-1">Soleil</h3>
          <p class="text-platinum/40 text-sm font-body font-light mt-1">Golden hour radiance for your forever</p>
        </div>
      </div>
    </div>

    <!-- Collection 5: Noir -->
    <div class="snap-item flex-shrink-0 w-[320px] md:w-[380px] group cursor-pointer">
      <div class="aspect-[3/4] bg-gradient-to-br from-[#0e0e0e] to-[#1a1a1a] border border-platinum/5 overflow-hidden relative">
        <div class="absolute inset-0 flex items-center justify-center">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <rect x="25" y="25" width="50" height="50" rx="2" stroke="#E5E4E2" stroke-width="0.6" opacity="0.3" transform="rotate(45 50 50)"/>
            <rect x="32" y="32" width="36" height="36" rx="1" stroke="#E5E4E2" stroke-width="0.4" opacity="0.2" transform="rotate(45 50 50)"/>
            <circle cx="50" cy="50" r="8" fill="#E5E4E2" opacity="0.15"/>
            <circle cx="50" cy="50" r="4" fill="#E5E4E2" opacity="0.25"/>
          </svg>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-velvet/80 via-transparent to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-6">
          <span class="text-platinum/30 text-[10px] tracking-[0.3em] uppercase font-body">Men's Line</span>
          <h3 class="font-display text-xl text-platinum mt-1">Noir</h3>
          <p class="text-platinum/40 text-sm font-body font-light mt-1">Black diamond minimalism</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ========== OUR CRAFT — Narrow column story with gold dividers ========== -->
<section id="craft" class="py-28 relative">
  <div class="border-t border-gold/10 absolute top-0 left-0 right-0"></div>
  <div class="max-w-xl mx-auto px-8">
    <div class="gold-reveal relative text-center mb-20">
      <p class="text-gold/60 text-[10px] tracking-[0.4em] uppercase mb-3 font-body font-medium">Our Craft</p>
      <h2 class="font-display text-3xl md:text-4xl text-platinum">From Earth to Eternity</h2>
    </div>

    <!-- Step 1: Mine -->
    <div class="gold-reveal relative mb-16">
      <div class="flex items-start gap-6">
        <div class="flex-shrink-0 w-14 h-14 border border-gold/30 flex items-center justify-center">
          <svg class="w-7 h-7 text-gold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h14v-8h3L12 3z"/><path d="M8 14v4M12 12v6M16 14v4" stroke-width="0.8" opacity="0.5"/></svg>
        </div>
        <div>
          <span class="text-gold/40 text-[10px] tracking-[0.3em] uppercase font-body">Step 01</span>
          <h3 class="font-display text-xl text-platinum mt-1 mb-2">Source</h3>
          <p class="text-platinum/45 text-sm font-body font-light leading-relaxed">Each gemstone is hand-selected from ethically certified mines across Myanmar, Colombia, and Sri Lanka. Only stones that pass our 12-point clarity assessment proceed to the atelier.</p>
        </div>
      </div>
      <div class="ml-7 mt-6 w-px h-12 bg-gradient-to-b from-gold/30 to-transparent"></div>
    </div>

    <!-- Step 2: Cut -->
    <div class="gold-reveal relative mb-16">
      <div class="flex items-start gap-6">
        <div class="flex-shrink-0 w-14 h-14 border border-gold/30 flex items-center justify-center">
          <svg class="w-7 h-7 text-gold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><polygon points="12,2 22,9 18,22 6,22 2,9"/><line x1="12" y1="2" x2="12" y2="22" stroke-width="0.6" opacity="0.5"/><line x1="2" y1="9" x2="22" y2="9" stroke-width="0.6" opacity="0.5"/></svg>
        </div>
        <div>
          <span class="text-gold/40 text-[10px] tracking-[0.3em] uppercase font-body">Step 02</span>
          <h3 class="font-display text-xl text-platinum mt-1 mb-2">Cut</h3>
          <p class="text-platinum/45 text-sm font-body font-light leading-relaxed">Master lapidaries with 30+ years of experience study each rough stone for weeks before making the first cut. Our proprietary 58-facet technique maximizes brilliance while preserving carat weight.</p>
        </div>
      </div>
      <div class="ml-7 mt-6 w-px h-12 bg-gradient-to-b from-gold/30 to-transparent"></div>
    </div>

    <!-- Step 3: Set -->
    <div class="gold-reveal relative mb-16">
      <div class="flex items-start gap-6">
        <div class="flex-shrink-0 w-14 h-14 border border-gold/30 flex items-center justify-center">
          <svg class="w-7 h-7 text-gold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><circle cx="12" cy="10" r="5"/><path d="M7 10L3 20h18L17 10"/><path d="M12 5v-3M8 7L6 4M16 7l2-3" stroke-width="0.8" opacity="0.5"/></svg>
        </div>
        <div>
          <span class="text-gold/40 text-[10px] tracking-[0.3em] uppercase font-body">Step 03</span>
          <h3 class="font-display text-xl text-platinum mt-1 mb-2">Set</h3>
          <p class="text-platinum/45 text-sm font-body font-light leading-relaxed">Each stone is hand-set using micro-prong technology under 40x magnification. The setting process alone takes 8-12 hours per piece, ensuring the gem sits perfectly secure while maximizing light entry.</p>
        </div>
      </div>
      <div class="ml-7 mt-6 w-px h-12 bg-gradient-to-b from-gold/30 to-transparent"></div>
    </div>

    <!-- Step 4: Polish -->
    <div class="gold-reveal relative">
      <div class="flex items-start gap-6">
        <div class="flex-shrink-0 w-14 h-14 border border-gold/30 flex items-center justify-center">
          <svg class="w-7 h-7 text-gold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z"/></svg>
        </div>
        <div>
          <span class="text-gold/40 text-[10px] tracking-[0.3em] uppercase font-body">Step 04</span>
          <h3 class="font-display text-xl text-platinum mt-1 mb-2">Polish</h3>
          <p class="text-platinum/45 text-sm font-body font-light leading-relaxed">A seven-stage polishing process using progressively finer compounds brings each piece to a mirror finish. The final hand-buff with chamois leather reveals the metal's deepest lustre.</p>
        </div>
      </div>
    </div>

    <div class="text-center mt-16 gold-reveal">
      <div class="inline-flex items-center gap-4 text-gold/30 text-xs tracking-[0.2em] uppercase font-body">
        <span class="w-8 h-px bg-gold/20"></span>
        40 - 120 hours per piece
        <span class="w-8 h-px bg-gold/20"></span>
      </div>
    </div>
  </div>
</section>

<!-- ========== FEATURED PIECES — Layered cards with parallax offset ========== -->
<section class="py-28 relative">
  <div class="border-t border-gold/10 absolute top-0 left-0 right-0"></div>
  <div class="max-w-[1200px] mx-auto px-8">
    <div class="gold-reveal text-center mb-20">
      <p class="text-gold/60 text-[10px] tracking-[0.4em] uppercase mb-3 font-body font-medium">Featured</p>
      <h2 class="font-display text-3xl md:text-4xl text-platinum">Signature Pieces</h2>
    </div>

    <div class="grid md:grid-cols-3 gap-8 md:gap-6">
      <!-- Piece 1 - offset up -->
      <div class="gold-reveal md:-mt-8">
        <div class="bg-gradient-to-b from-navy-light to-navy border border-gold/8 p-5 group cursor-pointer">
          <div class="aspect-square bg-gradient-to-br from-navy to-velvet flex items-center justify-center relative overflow-hidden mb-5">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="28" stroke="#D4AF37" stroke-width="0.8"/>
              <circle cx="40" cy="28" r="8" fill="url(#diaGrad1)" opacity="0.6"/>
              <path d="M40 20l-6 8h12l-6-8z" fill="#D4AF37" opacity="0.3"/>
              <defs><radialGradient id="diaGrad1"><stop offset="0%" stop-color="#F7E7CE"/><stop offset="100%" stop-color="#D4AF37"/></radialGradient></defs>
            </svg>
            <span class="sparkle-dot" style="top:20%;left:55%;--dur:2s;--delay:0s;"></span>
            <span class="sparkle-dot" style="top:35%;left:30%;--dur:2.5s;--delay:0.7s;"></span>
          </div>
          <div class="border-t border-gold/10 pt-4">
            <h4 class="font-display text-lg text-platinum">Solitaire Étoile</h4>
            <p class="text-platinum/35 text-xs font-body font-light mt-1 mb-3">18K White Gold &middot; 0.5ct GIA Diamond</p>
            <div class="flex items-center justify-between">
              <span class="text-gold font-display text-lg">NT$ 68,000</span>
              <span class="text-[10px] tracking-wider uppercase text-gold/40 font-body">Bestseller</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Piece 2 - center -->
      <div class="gold-reveal">
        <div class="bg-gradient-to-b from-navy-light to-navy border border-rosegold/8 p-5 group cursor-pointer">
          <div class="aspect-square bg-gradient-to-br from-navy to-[#15101a] flex items-center justify-center relative overflow-hidden mb-5">
            <svg width="60" height="90" viewBox="0 0 60 90" fill="none">
              <ellipse cx="30" cy="30" rx="15" ry="18" fill="none" stroke="#B76E79" stroke-width="0.8"/>
              <ellipse cx="30" cy="30" rx="9" ry="12" fill="#B76E79" opacity="0.25"/>
              <line x1="30" y1="48" x2="30" y2="70" stroke="#B76E79" stroke-width="0.8"/>
              <path d="M20 70 Q30 78 40 70" stroke="#B76E79" stroke-width="0.6" fill="none"/>
              <ellipse cx="27" cy="25" rx="3" ry="2" fill="white" opacity="0.15" transform="rotate(-15 27 25)"/>
            </svg>
            <span class="sparkle-dot" style="top:18%;left:52%;--dur:2.2s;--delay:0.3s;"></span>
            <span class="sparkle-dot" style="top:40%;left:42%;--dur:2.8s;--delay:1.1s;"></span>
          </div>
          <div class="border-t border-rosegold/10 pt-4">
            <h4 class="font-display text-lg text-platinum">Rose Pendant</h4>
            <p class="text-platinum/35 text-xs font-body font-light mt-1 mb-3">Rose Gold &middot; Ruby &middot; Pavé Diamonds</p>
            <div class="flex items-center justify-between">
              <span class="text-rosegold font-display text-lg">NT$ 42,000</span>
              <span class="text-[10px] tracking-wider uppercase text-rosegold/40 font-body">Signature</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Piece 3 - offset down -->
      <div class="gold-reveal md:mt-8">
        <div class="bg-gradient-to-b from-navy-light to-navy border border-platinum/8 p-5 group cursor-pointer">
          <div class="aspect-square bg-gradient-to-br from-navy to-[#0a1520] flex items-center justify-center relative overflow-hidden mb-5">
            <svg width="90" height="50" viewBox="0 0 90 50" fill="none">
              <ellipse cx="45" cy="25" rx="38" ry="12" stroke="#E5E4E2" stroke-width="0.8" fill="none"/>
              <ellipse cx="45" cy="25" rx="32" ry="9" stroke="#E5E4E2" stroke-width="0.4" fill="none" opacity="0.4"/>
              <circle cx="45" cy="15" r="6" fill="url(#sapphGrad)" opacity="0.5"/>
              <ellipse cx="43" cy="13" rx="2" ry="1.2" fill="white" opacity="0.15"/>
              <defs><radialGradient id="sapphGrad"><stop offset="0%" stop-color="#7db8e0"/><stop offset="100%" stop-color="#1a3a5c"/></radialGradient></defs>
            </svg>
            <span class="sparkle-dot" style="top:30%;left:60%;--dur:2.4s;--delay:0.5s;"></span>
            <span class="sparkle-dot" style="top:45%;left:35%;--dur:2.9s;--delay:1.3s;"></span>
          </div>
          <div class="border-t border-platinum/10 pt-4">
            <h4 class="font-display text-lg text-platinum">Océan Bracelet</h4>
            <p class="text-platinum/35 text-xs font-body font-light mt-1 mb-3">Platinum &middot; Ceylon Sapphire &middot; Diamonds</p>
            <div class="flex items-center justify-between">
              <span class="text-platinum font-display text-lg">NT$ 88,000</span>
              <span class="text-[10px] tracking-wider uppercase text-platinum/40 font-body">Limited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ========== MATERIAL EXPLORER — Flip cards (Gold / Silver / Platinum) ========== -->
<section id="materials" class="py-28 relative">
  <div class="border-t border-gold/10 absolute top-0 left-0 right-0"></div>
  <div class="max-w-[1100px] mx-auto px-8">
    <div class="gold-reveal text-center mb-20">
      <p class="text-gold/60 text-[10px] tracking-[0.4em] uppercase mb-3 font-body font-medium">Materials</p>
      <h2 class="font-display text-3xl md:text-4xl text-platinum">Noble Metals</h2>
      <p class="text-platinum/35 text-sm font-body font-light mt-4 max-w-md mx-auto">Hover to explore each material's unique properties</p>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <!-- Gold flip card -->
      <div class="gold-reveal flip-card h-[360px] cursor-pointer">
        <div class="flip-inner relative w-full h-full">
          <div class="flip-front absolute inset-0 border border-gold/20 bg-gradient-to-b from-navy-light to-navy flex flex-col items-center justify-center p-8">
            <div class="w-20 h-20 rounded-full mb-6" style="background: linear-gradient(135deg, #D4AF37 0%, #F7E7CE 40%, #D4AF37 60%, #A8882C 100%);"></div>
            <h3 class="font-display text-xl text-gold mb-2">18K Gold</h3>
            <p class="text-platinum/40 text-xs font-body text-center">The warmth of centuries</p>
            <div class="absolute bottom-4 left-0 right-0 text-center">
              <span class="text-gold/30 text-[10px] tracking-[0.2em] uppercase font-body">Hover to explore</span>
            </div>
          </div>
          <div class="flip-back absolute inset-0 border border-gold/20 bg-gradient-to-b from-[#1a1608] to-navy p-8 flex flex-col justify-center">
            <h4 class="font-display text-lg text-gold mb-4">18K Gold Properties</h4>
            <div class="space-y-3 text-sm font-body">
              <div class="flex justify-between border-b border-gold/10 pb-2"><span class="text-platinum/50">Purity</span><span class="text-champagne">75% Pure Gold</span></div>
              <div class="flex justify-between border-b border-gold/10 pb-2"><span class="text-platinum/50">Hardness</span><span class="text-champagne">2.75 Mohs</span></div>
              <div class="flex justify-between border-b border-gold/10 pb-2"><span class="text-platinum/50">Density</span><span class="text-champagne">15.6 g/cm³</span></div>
              <div class="flex justify-between border-b border-gold/10 pb-2"><span class="text-platinum/50">Tarnish</span><span class="text-champagne">Resistant</span></div>
              <div class="flex justify-between"><span class="text-platinum/50">Best For</span><span class="text-champagne">Everyday Wear</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Silver / White Gold flip card -->
      <div class="gold-reveal flip-card h-[360px] cursor-pointer">
        <div class="flip-inner relative w-full h-full">
          <div class="flip-front absolute inset-0 border border-platinum/15 bg-gradient-to-b from-navy-light to-navy flex flex-col items-center justify-center p-8">
            <div class="w-20 h-20 rounded-full mb-6" style="background: linear-gradient(135deg, #c0c0c0 0%, #f5f5f5 40%, #d0d0d0 60%, #a0a0a0 100%);"></div>
            <h3 class="font-display text-xl text-platinum mb-2">White Gold</h3>
            <p class="text-platinum/40 text-xs font-body text-center">Cool elegance refined</p>
            <div class="absolute bottom-4 left-0 right-0 text-center">
              <span class="text-platinum/25 text-[10px] tracking-[0.2em] uppercase font-body">Hover to explore</span>
            </div>
          </div>
          <div class="flip-back absolute inset-0 border border-platinum/15 bg-gradient-to-b from-[#121218] to-navy p-8 flex flex-col justify-center">
            <h4 class="font-display text-lg text-platinum mb-4">White Gold Properties</h4>
            <div class="space-y-3 text-sm font-body">
              <div class="flex justify-between border-b border-platinum/10 pb-2"><span class="text-platinum/50">Alloy</span><span class="text-platinum">Gold + Palladium</span></div>
              <div class="flex justify-between border-b border-platinum/10 pb-2"><span class="text-platinum/50">Hardness</span><span class="text-platinum">3.5 Mohs</span></div>
              <div class="flex justify-between border-b border-platinum/10 pb-2"><span class="text-platinum/50">Finish</span><span class="text-platinum">Rhodium Plated</span></div>
              <div class="flex justify-between border-b border-platinum/10 pb-2"><span class="text-platinum/50">Lustre</span><span class="text-platinum">Mirror-bright</span></div>
              <div class="flex justify-between"><span class="text-platinum/50">Best For</span><span class="text-platinum">Diamond Settings</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Platinum flip card -->
      <div class="gold-reveal flip-card h-[360px] cursor-pointer">
        <div class="flip-inner relative w-full h-full">
          <div class="flip-front absolute inset-0 border border-platinum/10 bg-gradient-to-b from-navy-light to-navy flex flex-col items-center justify-center p-8">
            <div class="w-20 h-20 rounded-full mb-6" style="background: linear-gradient(135deg, #E5E4E2 0%, #ffffff 30%, #E5E4E2 50%, #c8c8c6 80%, #E5E4E2 100%);"></div>
            <h3 class="font-display text-xl text-platinum mb-2">Platinum</h3>
            <p class="text-platinum/40 text-xs font-body text-center">The king of metals</p>
            <div class="absolute bottom-4 left-0 right-0 text-center">
              <span class="text-platinum/25 text-[10px] tracking-[0.2em] uppercase font-body">Hover to explore</span>
            </div>
          </div>
          <div class="flip-back absolute inset-0 border border-platinum/10 bg-gradient-to-b from-[#14141a] to-navy p-8 flex flex-col justify-center">
            <h4 class="font-display text-lg text-platinum mb-4">Platinum Properties</h4>
            <div class="space-y-3 text-sm font-body">
              <div class="flex justify-between border-b border-platinum/10 pb-2"><span class="text-platinum/50">Purity</span><span class="text-platinum">95% Pure Pt</span></div>
              <div class="flex justify-between border-b border-platinum/10 pb-2"><span class="text-platinum/50">Hardness</span><span class="text-platinum">4.5 Mohs</span></div>
              <div class="flex justify-between border-b border-platinum/10 pb-2"><span class="text-platinum/50">Density</span><span class="text-platinum">21.45 g/cm³</span></div>
              <div class="flex justify-between border-b border-platinum/10 pb-2"><span class="text-platinum/50">Tarnish</span><span class="text-platinum">Never Tarnishes</span></div>
              <div class="flex justify-between"><span class="text-platinum/50">Best For</span><span class="text-platinum">Heirloom Pieces</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ========== RING SIZE GUIDE ========== -->
<section id="sizing" class="py-28 relative">
  <div class="border-t border-gold/10 absolute top-0 left-0 right-0"></div>
  <div class="max-w-[900px] mx-auto px-8">
    <div class="gold-reveal text-center mb-16">
      <p class="text-gold/60 text-[10px] tracking-[0.4em] uppercase mb-3 font-body font-medium">Guide</p>
      <h2 class="font-display text-3xl md:text-4xl text-platinum">Find Your Ring Size</h2>
      <p class="text-platinum/35 text-sm font-body font-light mt-4 max-w-md mx-auto">Use a piece of string or paper to measure around your finger, then compare below</p>
    </div>

    <div class="gold-reveal grid md:grid-cols-2 gap-12 items-center">
      <!-- Measurement SVG illustration -->
      <div class="flex justify-center">
        <svg width="220" height="260" viewBox="0 0 220 260" fill="none">
          <!-- Hand outline -->
          <path d="M110 240 C80 240 50 220 50 180 L50 100 C50 85 60 75 70 75 C80 75 85 82 85 90 L85 130" stroke="#E5E4E2" stroke-width="1" fill="none" opacity="0.2"/>
          <path d="M85 130 L85 60 C85 48 92 40 100 40 C108 40 115 48 115 60 L115 130" stroke="#E5E4E2" stroke-width="1" fill="none" opacity="0.2"/>
          <path d="M115 130 L115 50 C115 38 122 30 130 30 C138 30 145 38 145 50 L145 130" stroke="#E5E4E2" stroke-width="1" fill="none" opacity="0.2"/>
          <path d="M145 130 L145 65 C145 53 152 45 160 45 C168 45 175 53 175 65 L175 180 C175 220 145 240 110 240Z" stroke="#E5E4E2" stroke-width="1" fill="none" opacity="0.2"/>
          <!-- Ring on finger -->
          <ellipse cx="130" cy="110" rx="22" ry="10" stroke="#D4AF37" stroke-width="1.5" fill="none"/>
          <ellipse cx="130" cy="110" rx="18" ry="7" stroke="#D4AF37" stroke-width="0.5" fill="none" opacity="0.4"/>
          <!-- Measurement arrows -->
          <line x1="108" y1="140" x2="152" y2="140" stroke="#D4AF37" stroke-width="0.8" stroke-dasharray="3,3"/>
          <polygon points="108,140 114,137 114,143" fill="#D4AF37"/>
          <polygon points="152,140 146,137 146,143" fill="#D4AF37"/>
          <text x="130" y="155" text-anchor="middle" fill="#D4AF37" font-size="10" font-family="Jost">diameter</text>
          <!-- Sparkle on gem -->
          <circle cx="130" cy="100" r="4" fill="#D4AF37" opacity="0.6"/>
          <circle cx="130" cy="100" r="2" fill="#F7E7CE" opacity="0.8"/>
          <span class="sparkle-dot" style="top:36%;left:56%;--dur:2s;--delay:0s;"></span>
        </svg>
      </div>

      <!-- Size chart -->
      <div>
        <div class="border border-gold/15 overflow-hidden">
          <table class="w-full text-sm font-body">
            <thead>
              <tr class="bg-gold/5">
                <th class="px-4 py-3 text-left text-[10px] tracking-[0.2em] uppercase text-gold/60 font-medium">Size</th>
                <th class="px-4 py-3 text-left text-[10px] tracking-[0.2em] uppercase text-gold/60 font-medium">Diameter</th>
                <th class="px-4 py-3 text-left text-[10px] tracking-[0.2em] uppercase text-gold/60 font-medium">Circumference</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-gold/5"><td class="px-4 py-2.5 text-platinum/60">5</td><td class="px-4 py-2.5 text-platinum/60">15.7 mm</td><td class="px-4 py-2.5 text-platinum/60">49.3 mm</td></tr>
              <tr class="border-t border-gold/5 bg-gold/[0.02]"><td class="px-4 py-2.5 text-platinum/60">6</td><td class="px-4 py-2.5 text-platinum/60">16.5 mm</td><td class="px-4 py-2.5 text-platinum/60">51.8 mm</td></tr>
              <tr class="border-t border-gold/5"><td class="px-4 py-2.5 text-platinum/60">7</td><td class="px-4 py-2.5 text-platinum/60">17.3 mm</td><td class="px-4 py-2.5 text-platinum/60">54.4 mm</td></tr>
              <tr class="border-t border-gold/5 bg-gold/[0.02]"><td class="px-4 py-2.5 text-platinum/60">8</td><td class="px-4 py-2.5 text-platinum/60">18.1 mm</td><td class="px-4 py-2.5 text-platinum/60">56.9 mm</td></tr>
              <tr class="border-t border-gold/5"><td class="px-4 py-2.5 text-platinum/60">9</td><td class="px-4 py-2.5 text-platinum/60">19.0 mm</td><td class="px-4 py-2.5 text-platinum/60">59.5 mm</td></tr>
              <tr class="border-t border-gold/5 bg-gold/[0.02]"><td class="px-4 py-2.5 text-platinum/60">10</td><td class="px-4 py-2.5 text-platinum/60">19.8 mm</td><td class="px-4 py-2.5 text-platinum/60">62.1 mm</td></tr>
              <tr class="border-t border-gold/5"><td class="px-4 py-2.5 text-platinum/60">11</td><td class="px-4 py-2.5 text-platinum/60">20.6 mm</td><td class="px-4 py-2.5 text-platinum/60">64.6 mm</td></tr>
            </tbody>
          </table>
        </div>
        <button onclick="openModal('sizing-modal')" class="mt-5 text-xs tracking-[0.15em] uppercase text-gold/60 hover:text-gold transition-colors font-body underline underline-offset-4 decoration-gold/20 cursor-pointer">
          Not sure? Get help from our jeweler
        </button>
      </div>
    </div>
  </div>
</section>

<!-- ========== ENGRAVING PREVIEW ========== -->
<section id="engrave" class="py-28 relative">
  <div class="border-t border-gold/10 absolute top-0 left-0 right-0"></div>
  <div class="max-w-[800px] mx-auto px-8">
    <div class="gold-reveal text-center mb-16">
      <p class="text-gold/60 text-[10px] tracking-[0.4em] uppercase mb-3 font-body font-medium">Personalize</p>
      <h2 class="font-display text-3xl md:text-4xl text-platinum">Engrave Your Story</h2>
      <p class="text-platinum/35 text-sm font-body font-light mt-4 max-w-md mx-auto">Add a personal inscription to make your piece truly one-of-a-kind</p>
    </div>

    <div class="gold-reveal">
      <!-- Ring with engraving preview -->
      <div class="flex justify-center mb-10">
        <div class="relative">
          <svg width="300" height="160" viewBox="0 0 300 160" fill="none">
            <!-- Ring band -->
            <ellipse cx="150" cy="90" rx="120" ry="40" stroke="#D4AF37" stroke-width="2" fill="none"/>
            <ellipse cx="150" cy="90" rx="100" ry="30" stroke="#D4AF37" stroke-width="0.8" fill="none" opacity="0.3"/>
            <!-- Inner band surface for engraving -->
            <path d="M55 90 Q150 130 245 90" stroke="#D4AF37" stroke-width="0.5" fill="none" opacity="0.2"/>
            <!-- Gem on top -->
            <polygon points="150,40 165,55 150,62 135,55" fill="#D4AF37" opacity="0.4" stroke="#D4AF37" stroke-width="0.5"/>
            <polygon points="150,40 165,55 150,50" fill="#F7E7CE" opacity="0.3"/>
          </svg>
          <!-- Engraving text overlay -->
          <div class="absolute bottom-6 left-0 right-0 text-center">
            <span id="engrave-display" class="font-display text-sm text-gold/70 tracking-[0.15em]" style="text-shadow: 0 0 8px rgba(212,175,55,0.3);">Your text here</span>
          </div>
          <!-- Sparkles around gem -->
          <span class="sparkle-dot" style="top:20%;left:46%;--dur:2.2s;--delay:0s;"></span>
          <span class="sparkle-dot" style="top:15%;left:54%;--dur:2.6s;--delay:0.8s;"></span>
          <span class="sparkle-dot" style="top:28%;left:40%;--dur:2.0s;--delay:1.2s;"></span>
        </div>
      </div>

      <!-- Input -->
      <div class="max-w-sm mx-auto">
        <label class="block text-[10px] tracking-[0.3em] uppercase text-gold/50 font-body mb-2 text-center">Type your engraving</label>
        <input
          type="text"
          id="engrave-input"
          maxlength="20"
          placeholder="e.g. Forever Yours"
          oninput="document.getElementById('engrave-display').textContent = this.value || 'Your text here'; document.getElementById('engrave-count').textContent = this.value.length"
          class="w-full bg-transparent border border-gold/20 text-center text-platinum font-display text-lg tracking-[0.1em] px-6 py-4 placeholder:text-platinum/20 focus:border-gold/50 focus:outline-none transition-colors"
        />
        <div class="flex justify-between mt-2">
          <span class="text-platinum/25 text-[10px] font-body">Cinzel Decorative font</span>
          <span class="text-platinum/25 text-[10px] font-body"><span id="engrave-count">0</span>/20 characters</span>
        </div>
      </div>

      <!-- Gift wrapping toggle -->
      <div class="mt-10 border border-gold/10 p-6 flex items-center justify-between max-w-sm mx-auto">
        <div>
          <h4 class="text-platinum text-sm font-body font-medium">Gift Wrapping</h4>
          <p class="text-platinum/35 text-xs font-body font-light mt-0.5">Complimentary luxury packaging</p>
        </div>
        <button id="gift-toggle" onclick="toggleGift()" class="w-12 h-6 rounded-full border border-gold/30 relative transition-all duration-300 bg-transparent">
          <span id="gift-knob" class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-platinum/30 transition-all duration-300"></span>
        </button>
      </div>
    </div>
  </div>
</section>

<!-- ========== APPOINTMENT BOOKING ========== -->
<section id="booking" class="py-28 relative">
  <div class="border-t border-gold/10 absolute top-0 left-0 right-0"></div>
  <div class="max-w-[900px] mx-auto px-8">
    <div class="gold-reveal grid md:grid-cols-2 gap-16 items-start">
      <!-- Left: Info -->
      <div>
        <p class="text-gold/60 text-[10px] tracking-[0.4em] uppercase mb-3 font-body font-medium">Private Consultation</p>
        <h2 class="font-display text-3xl text-platinum mb-6">Book an Appointment</h2>
        <p class="text-platinum/40 text-sm font-body font-light leading-relaxed mb-8">
          Visit our atelier for a private viewing. Our gemologist will guide you through our collections, discuss bespoke options, and help you find the perfect piece.
        </p>

        <div class="space-y-5">
          <div class="flex items-start gap-4">
            <svg class="w-5 h-5 text-gold/50 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
            <div>
              <h4 class="text-platinum text-sm font-body font-medium">Flagship — Xinyi District</h4>
              <p class="text-platinum/35 text-xs font-body font-light mt-0.5">No. 28, Songren Rd, Xinyi, Taipei</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <svg class="w-5 h-5 text-gold/50 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
              <h4 class="text-platinum text-sm font-body font-medium">Hours</h4>
              <p class="text-platinum/35 text-xs font-body font-light mt-0.5">Mon — Sun, 11:00 — 21:00</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <svg class="w-5 h-5 text-gold/50 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
            <div>
              <h4 class="text-platinum text-sm font-body font-medium">Contact</h4>
              <p class="text-platinum/35 text-xs font-body font-light mt-0.5">(02) 2720-8888</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Form -->
      <div class="border border-gold/15 bg-navy/40 p-8">
        <div class="space-y-5">
          <div>
            <label class="block text-[10px] tracking-[0.2em] uppercase text-gold/50 font-body mb-2">Full Name</label>
            <input type="text" placeholder="Your name" class="w-full bg-transparent border border-gold/15 px-4 py-3 text-sm font-body text-platinum placeholder:text-platinum/20 focus:border-gold/40 focus:outline-none transition-colors">
          </div>
          <div>
            <label class="block text-[10px] tracking-[0.2em] uppercase text-gold/50 font-body mb-2">Phone</label>
            <input type="tel" placeholder="09xx-xxx-xxx" class="w-full bg-transparent border border-gold/15 px-4 py-3 text-sm font-body text-platinum placeholder:text-platinum/20 focus:border-gold/40 focus:outline-none transition-colors">
          </div>
          <div>
            <label class="block text-[10px] tracking-[0.2em] uppercase text-gold/50 font-body mb-2">Interest</label>
            <select class="w-full bg-velvet border border-gold/15 px-4 py-3 text-sm font-body text-platinum/60 focus:border-gold/40 focus:outline-none transition-colors">
              <option>Engagement Ring</option>
              <option>Wedding Bands</option>
              <option>Bespoke Design</option>
              <option>Gift Selection</option>
              <option>Gem Certification</option>
              <option>Repair & Maintenance</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] tracking-[0.2em] uppercase text-gold/50 font-body mb-2">Preferred Date</label>
            <input type="date" class="w-full bg-velvet border border-gold/15 px-4 py-3 text-sm font-body text-platinum/60 focus:border-gold/40 focus:outline-none transition-colors">
          </div>
          <div>
            <label class="block text-[10px] tracking-[0.2em] uppercase text-gold/50 font-body mb-2">Message</label>
            <textarea rows="3" placeholder="Tell us about your vision..." class="w-full bg-transparent border border-gold/15 px-4 py-3 text-sm font-body text-platinum placeholder:text-platinum/20 focus:border-gold/40 focus:outline-none transition-colors resize-none"></textarea>
          </div>
          <button onclick="showToast('Appointment request received. We will confirm within 24 hours.')" class="shimmer-sweep w-full bg-gold text-velvet py-3.5 text-xs tracking-[0.2em] uppercase font-body font-semibold hover:bg-gold-light transition-colors duration-300 cursor-pointer">
            Request Appointment
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ========== FOOTER with gold gradient top border ========== -->
<footer class="relative pt-16 pb-10">
  <div class="absolute top-0 left-0 right-0 h-px" style="background: linear-gradient(90deg, transparent 0%, #D4AF37 20%, #F7E7CE 50%, #D4AF37 80%, transparent 100%);"></div>
  <div class="max-w-[1200px] mx-auto px-8">
    <div class="grid md:grid-cols-4 gap-10 mb-12">
      <!-- Brand -->
      <div class="md:col-span-1">
        <span class="font-display text-xl tracking-[0.2em] text-gold">LUMIÈRE</span>
        <p class="text-platinum/30 text-xs font-body font-light mt-3 leading-relaxed">Fine jewelry crafted in Taipei since 2008. Every piece, a story.</p>
      </div>
      <!-- Collections -->
      <div>
        <h4 class="text-[10px] tracking-[0.25em] uppercase text-gold/50 font-body font-medium mb-4">Collections</h4>
        <div class="space-y-2">
          <a href="#" class="block text-xs text-platinum/35 font-body font-light hover:text-gold/60 transition-colors">Étoile</a>
          <a href="#" class="block text-xs text-platinum/35 font-body font-light hover:text-gold/60 transition-colors">Rose Éternelle</a>
          <a href="#" class="block text-xs text-platinum/35 font-body font-light hover:text-gold/60 transition-colors">Océan</a>
          <a href="#" class="block text-xs text-platinum/35 font-body font-light hover:text-gold/60 transition-colors">Soleil Bridal</a>
          <a href="#" class="block text-xs text-platinum/35 font-body font-light hover:text-gold/60 transition-colors">Noir Men's</a>
        </div>
      </div>
      <!-- Services -->
      <div>
        <h4 class="text-[10px] tracking-[0.25em] uppercase text-gold/50 font-body font-medium mb-4">Services</h4>
        <div class="space-y-2">
          <a href="#" class="block text-xs text-platinum/35 font-body font-light hover:text-gold/60 transition-colors">Bespoke Design</a>
          <a href="#" class="block text-xs text-platinum/35 font-body font-light hover:text-gold/60 transition-colors">Engraving</a>
          <a href="#" class="block text-xs text-platinum/35 font-body font-light hover:text-gold/60 transition-colors">Ring Sizing</a>
          <a href="#" class="block text-xs text-platinum/35 font-body font-light hover:text-gold/60 transition-colors">Repair & Polish</a>
          <a href="#" class="block text-xs text-platinum/35 font-body font-light hover:text-gold/60 transition-colors">Certification</a>
        </div>
      </div>
      <!-- Contact -->
      <div>
        <h4 class="text-[10px] tracking-[0.25em] uppercase text-gold/50 font-body font-medium mb-4">Connect</h4>
        <div class="space-y-2">
          <p class="text-xs text-platinum/35 font-body font-light">(02) 2720-8888</p>
          <p class="text-xs text-platinum/35 font-body font-light">concierge@lumiere.tw</p>
          <div class="flex gap-4 mt-3">
            <!-- Instagram -->
            <a href="#" class="text-platinum/25 hover:text-gold/60 transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <!-- Facebook -->
            <a href="#" class="text-platinum/25 hover:text-gold/60 transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <!-- LINE -->
            <a href="#" class="text-platinum/25 hover:text-gold/60 transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-gold/8 pt-8 flex flex-col md:flex-row justify-between items-center gap-3">
      <p class="text-platinum/20 text-[10px] tracking-wider font-body">&copy; 2026 LUMIERE Joaillerie. All rights reserved.</p>
      <div class="flex gap-6">
        <a href="#" class="text-platinum/20 text-[10px] tracking-wider font-body hover:text-platinum/40 transition-colors">Privacy</a>
        <a href="#" class="text-platinum/20 text-[10px] tracking-wider font-body hover:text-platinum/40 transition-colors">Terms</a>
        <a href="#" class="text-platinum/20 text-[10px] tracking-wider font-body hover:text-platinum/40 transition-colors">Sitemap</a>
      </div>
    </div>
  </div>
</footer>

<!-- ========== APPOINTMENT MODAL ========== -->
<div id="appointment-modal" class="modal-overlay fixed inset-0 z-[60] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-velvet/80 backdrop-blur-md" onclick="closeModal('appointment-modal')"></div>
  <div class="modal-box relative bg-navy border border-gold/20 p-10 max-w-lg w-full shadow-2xl">
    <button onclick="closeModal('appointment-modal')" class="absolute top-5 right-5 text-platinum/30 hover:text-platinum/60 transition-colors">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
    <div class="text-center mb-8">
      <div class="w-12 h-12 mx-auto mb-4 border border-gold/30 flex items-center justify-center">
        <svg class="w-6 h-6 text-gold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
      </div>
      <h3 class="font-display text-2xl text-platinum">Book Your Visit</h3>
      <p class="text-platinum/35 text-xs font-body font-light mt-2">Private one-on-one with our gemologist</p>
    </div>
    <div class="space-y-4">
      <input type="text" placeholder="Full name" class="w-full bg-transparent border border-gold/15 px-4 py-3 text-sm font-body text-platinum placeholder:text-platinum/20 focus:border-gold/40 focus:outline-none transition-colors">
      <input type="tel" placeholder="Phone number" class="w-full bg-transparent border border-gold/15 px-4 py-3 text-sm font-body text-platinum placeholder:text-platinum/20 focus:border-gold/40 focus:outline-none transition-colors">
      <input type="email" placeholder="Email address" class="w-full bg-transparent border border-gold/15 px-4 py-3 text-sm font-body text-platinum placeholder:text-platinum/20 focus:border-gold/40 focus:outline-none transition-colors">
      <select class="w-full bg-velvet border border-gold/15 px-4 py-3 text-sm font-body text-platinum/60 focus:border-gold/40 focus:outline-none transition-colors">
        <option>Engagement Ring Consultation</option>
        <option>Wedding Band Selection</option>
        <option>Bespoke Commission</option>
        <option>Gift Guidance</option>
        <option>Gemstone Viewing</option>
      </select>
      <textarea rows="2" placeholder="Any special requests..." class="w-full bg-transparent border border-gold/15 px-4 py-3 text-sm font-body text-platinum placeholder:text-platinum/20 focus:border-gold/40 focus:outline-none transition-colors resize-none"></textarea>
      <button onclick="showToast('Appointment booked. A confirmation will be sent shortly.');closeModal('appointment-modal')" class="shimmer-sweep w-full bg-gold text-velvet py-3.5 text-xs tracking-[0.2em] uppercase font-body font-semibold hover:bg-gold-light transition-colors duration-300 cursor-pointer">
        Confirm Appointment
      </button>
    </div>
  </div>
</div>

<!-- ========== SIZING HELP MODAL ========== -->
<div id="sizing-modal" class="modal-overlay fixed inset-0 z-[60] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-velvet/80 backdrop-blur-md" onclick="closeModal('sizing-modal')"></div>
  <div class="modal-box relative bg-navy border border-gold/20 p-10 max-w-md w-full shadow-2xl">
    <button onclick="closeModal('sizing-modal')" class="absolute top-5 right-5 text-platinum/30 hover:text-platinum/60 transition-colors">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
    <div class="text-center mb-6">
      <h3 class="font-display text-xl text-platinum">Need Sizing Help?</h3>
      <p class="text-platinum/35 text-xs font-body font-light mt-2">Our jeweler can measure you in-store, or we can mail a free sizing kit.</p>
    </div>
    <div class="space-y-4">
      <button onclick="showToast('Free sizing kit will be mailed to you within 2 business days.');closeModal('sizing-modal')" class="w-full border border-gold/20 text-gold py-3 text-xs tracking-[0.15em] uppercase font-body hover:bg-gold/5 transition-colors cursor-pointer">
        Mail Me a Sizing Kit
      </button>
      <button onclick="openModal('appointment-modal');closeModal('sizing-modal')" class="w-full bg-gold text-velvet py-3 text-xs tracking-[0.15em] uppercase font-body font-semibold hover:bg-gold-light transition-colors cursor-pointer">
        Book In-Store Measurement
      </button>
    </div>
  </div>
</div>

<!-- ========== TOAST ========== -->
<div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] max-w-md w-auto px-8 py-4 border border-gold/30 text-champagne text-xs tracking-wide font-body text-center shadow-2xl transition-all duration-500 pointer-events-none" style="background: linear-gradient(135deg, #0C1222 0%, #141D33 100%); transform: translateX(-50%) translateY(30px); opacity: 0;">
  <span id="toast-text"></span>
</div>

<!-- ========== JAVASCRIPT ========== -->
<script>
/* ---- Toast ---- */
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-text').textContent = msg;
  t.style.transform = 'translateX(-50%) translateY(0)';
  t.style.opacity = '1';
  setTimeout(() => {
    t.style.transform = 'translateX(-50%) translateY(30px)';
    t.style.opacity = '0';
  }, 3500);
}

/* ---- Modal open/close ---- */
function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

/* ---- Gift wrapping toggle ---- */
let giftOn = false;
function toggleGift() {
  giftOn = !giftOn;
  const btn = document.getElementById('gift-toggle');
  const knob = document.getElementById('gift-knob');
  if (giftOn) {
    btn.style.borderColor = 'rgba(212,175,55,0.6)';
    btn.style.backgroundColor = 'rgba(212,175,55,0.15)';
    knob.style.left = '24px';
    knob.style.backgroundColor = '#D4AF37';
    showToast('Gift wrapping added — complimentary on all orders');
  } else {
    btn.style.borderColor = 'rgba(212,175,55,0.3)';
    btn.style.backgroundColor = 'transparent';
    knob.style.left = '2px';
    knob.style.backgroundColor = 'rgba(229,228,226,0.3)';
  }
}

/* ---- Collection carousel ---- */
function scrollCarousel(dir) {
  const el = document.getElementById('collection-carousel');
  const scrollAmt = 400;
  el.scrollBy({ left: dir * scrollAmt, behavior: 'smooth' });
}

/* ---- Navbar scroll effect ---- */
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  const scrollY = window.scrollY;
  if (scrollY > 80) {
    nav.style.background = 'rgba(10,10,10,0.95)';
    nav.style.backdropFilter = 'blur(20px)';
    nav.style.borderBottom = '1px solid rgba(212,175,55,0.08)';
  } else {
    nav.style.background = 'transparent';
    nav.style.backdropFilter = 'none';
    nav.style.borderBottom = 'none';
  }
  lastScroll = scrollY;
});

/* ---- Gift bar auto-show after 3s ---- */
setTimeout(() => {
  const bar = document.getElementById('gift-bar');
  bar.style.transform = 'translateY(0)';
  bar.style.opacity = '1';
}, 3000);

/* ---- IntersectionObserver for gold-reveal ---- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.gold-reveal').forEach(el => revealObserver.observe(el));

/* ---- Mobile menu close on link click ---- */
document.querySelectorAll('#mobile-menu a, #mobile-menu button').forEach(el => {
  el.addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.add('hidden');
  });
});

/* ---- Smooth anchor scrolling ---- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ---- Dynamic sparkle generation for hero (additional ambient sparkles) ---- */
function createAmbientSparkle() {
  const container = document.getElementById('hero-sparkles');
  if (!container) return;
  const dot = document.createElement('span');
  dot.className = 'sparkle-dot';
  const top = 15 + Math.random() * 50;
  const left = 30 + Math.random() * 40;
  const dur = 1.5 + Math.random() * 2;
  const size = 1.5 + Math.random() * 3;
  const colors = ['#D4AF37', '#F7E7CE', '#B76E79', '#E5E4E2'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  dot.style.cssText = `top:${top}%;left:${left}%;width:${size}px;height:${size}px;background:${color};animation:sparkle-twinkle ${dur}s ease-in-out 1;opacity:0;`;
  container.appendChild(dot);
  setTimeout(() => dot.remove(), dur * 1000 + 100);
}
setInterval(createAmbientSparkle, 800);

/* ---- Parallax offset for featured pieces on scroll ---- */
function parallaxFeatured() {
  const cards = document.querySelectorAll('.gold-reveal.md\\:-mt-8, .gold-reveal.md\\:mt-8');
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const viewH = window.innerHeight;
    if (rect.top < viewH && rect.bottom > 0) {
      const progress = (viewH - rect.top) / (viewH + rect.height);
      const offset = (progress - 0.5) * 15;
      card.style.transform = `translateY(${offset}px)`;
    }
  });
}
window.addEventListener('scroll', parallaxFeatured, { passive: true });
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
