-- Template Preview: landing-realestate (Real Estate Landing Page) v3
-- Swap Test: Blueprint grid + floor plan SVG + split map hero + navy/wood palette = unmistakably real estate
-- Signature: Split hero (map left + search right), blueprint grid background, floor plan silhouette decorations

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '21fa43b5-f7dc-4a5f-9519-a7a1e3cb2bd9',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PrimeRealty - Find Your Dream Home</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        navy: '#1e3a5f',
        'navy-dark': '#152d4a',
        'navy-deep': '#0f2035',
        white: '#ffffff',
        wood: '#a16207',
        'wood-light': '#b8860b',
        'wood-soft': 'rgba(161,98,7,0.08)',
        blueprint: '#dbeafe',
        'blueprint-line': '#bfdbfe',
        cream: '#f8fafc',
        slate: '#64748b',
        'slate-dark': '#475569'
      },
      fontFamily: {
        display: ['DM Serif Display', 'serif'],
        body: ['DM Sans', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'DM Sans', sans-serif; background: #ffffff; color: #1e3a5f; }

  .blueprint-bg {
    background-image:
      linear-gradient(#dbeafe 1px, transparent 1px),
      linear-gradient(90deg, #dbeafe 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .property-card { transition: all 0.35s ease; }
  .property-card:hover { transform: translateY(-6px); box-shadow: 0 24px 48px rgba(30,58,95,0.12); }

  .step-card { transition: all 0.3s ease; }
  .step-card:hover { background: #1e3a5f; color: white; }
  .step-card:hover .step-num { background: rgba(161,98,7,0.2); color: #b8860b; }
  .step-card:hover .step-desc { color: rgba(255,255,255,0.6); }
  .step-card:hover svg path, .step-card:hover svg line, .step-card:hover svg rect, .step-card:hover svg circle, .step-card:hover svg polyline { stroke: #b8860b; }

  .fade-up { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .fade-up.visible { opacity: 1; transform: translateY(0); }

  .range-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; background: #dbeafe; outline: none; }
  .range-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #1e3a5f; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2); cursor: pointer; }

  .map-pin { animation: pinBounce 2s ease-in-out infinite; }
  .map-pin:nth-child(2) { animation-delay: 0.3s; }
  .map-pin:nth-child(3) { animation-delay: 0.6s; }
  @keyframes pinBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #f8fafc; }
  ::-webkit-scrollbar-thumb { background: #bfdbfe; border-radius: 3px; }
</style>
</head>
<body>

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-blueprint">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2.5">
      <div class="w-8 h-8 bg-navy rounded flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
      </div>
      <span class="font-display text-xl text-navy">PrimeRealty</span>
    </a>
    <div class="hidden md:flex items-center gap-7">
      <a href="#properties" class="text-sm text-slate hover:text-navy transition-colors">Buy</a>
      <a href="#" class="text-sm text-slate hover:text-navy transition-colors">Rent</a>
      <a href="#" class="text-sm text-slate hover:text-navy transition-colors">Sell</a>
      <a href="#about" class="text-sm text-slate hover:text-navy transition-colors">About</a>
      <a href="#contact" class="text-sm text-slate hover:text-navy transition-colors">Contact</a>
      <button onclick="handleAction('List Property')" class="px-5 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-dark transition-colors cursor-pointer">
        List Property
      </button>
    </div>
    <button onclick="toggleMenu()" class="md:hidden text-navy">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
  <div id="mobileMenu" class="hidden md:hidden bg-white border-t border-blueprint">
    <div class="px-6 py-4 space-y-3">
      <a href="#properties" onclick="toggleMenu()" class="block text-sm text-slate">Buy</a>
      <a href="#" onclick="toggleMenu()" class="block text-sm text-slate">Rent</a>
      <a href="#" onclick="toggleMenu()" class="block text-sm text-slate">Sell</a>
      <a href="#about" onclick="toggleMenu()" class="block text-sm text-slate">About</a>
      <a href="#contact" onclick="toggleMenu()" class="block text-sm text-slate">Contact</a>
    </div>
  </div>
</nav>

<!-- Hero: Split 50/50 Map + Search -->
<section class="relative pt-16 blueprint-bg overflow-hidden">
  <div class="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-0 items-stretch min-h-[600px]">

    <!-- LEFT: Map with pins -->
    <div class="relative bg-white/60 backdrop-blur-sm rounded-l-2xl border border-blueprint-line p-6 fade-up overflow-hidden">
      <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-blueprint-line z-10">
        <span class="text-[10px] text-slate font-medium uppercase tracking-wider">Live Map</span>
      </div>
      <svg viewBox="0 0 500 450" class="w-full h-full" style="min-height:350px">
        <!-- Street grid -->
        <line x1="50" y1="0" x2="50" y2="450" stroke="#bfdbfe" stroke-width="1.5"/>
        <line x1="130" y1="0" x2="130" y2="450" stroke="#bfdbfe" stroke-width="1.5"/>
        <line x1="220" y1="0" x2="220" y2="450" stroke="#dbeafe" stroke-width="1"/>
        <line x1="310" y1="0" x2="310" y2="450" stroke="#bfdbfe" stroke-width="1.5"/>
        <line x1="400" y1="0" x2="400" y2="450" stroke="#dbeafe" stroke-width="1"/>
        <line x1="460" y1="0" x2="460" y2="450" stroke="#bfdbfe" stroke-width="1"/>
        <line x1="0" y1="50" x2="500" y2="50" stroke="#bfdbfe" stroke-width="1.5"/>
        <line x1="0" y1="140" x2="500" y2="140" stroke="#dbeafe" stroke-width="1"/>
        <line x1="0" y1="230" x2="500" y2="230" stroke="#bfdbfe" stroke-width="1.5"/>
        <line x1="0" y1="320" x2="500" y2="320" stroke="#dbeafe" stroke-width="1"/>
        <line x1="0" y1="400" x2="500" y2="400" stroke="#bfdbfe" stroke-width="1.5"/>
        <!-- Block fills -->
        <rect x="55" y="55" width="70" height="80" rx="4" fill="#dbeafe" opacity="0.4"/>
        <rect x="135" y="145" width="80" height="80" rx="4" fill="#dbeafe" opacity="0.3"/>
        <rect x="315" y="55" width="80" height="80" rx="4" fill="#dbeafe" opacity="0.35"/>
        <rect x="135" y="325" width="80" height="70" rx="4" fill="#dbeafe" opacity="0.3"/>
        <rect x="315" y="235" width="80" height="80" rx="4" fill="#dbeafe" opacity="0.4"/>
        <rect x="405" y="325" width="50" height="70" rx="4" fill="#dbeafe" opacity="0.25"/>
        <!-- Roads (thicker) -->
        <line x1="0" y1="190" x2="500" y2="190" stroke="#93c5fd" stroke-width="3" opacity="0.5"/>
        <line x1="260" y1="0" x2="260" y2="450" stroke="#93c5fd" stroke-width="3" opacity="0.5"/>
        <!-- Park area -->
        <rect x="55" y="235" width="70" height="80" rx="8" fill="#dcfce7" opacity="0.5"/>
        <text x="90" y="280" text-anchor="middle" font-size="9" fill="#16a34a" opacity="0.6" font-family="DM Sans">Park</text>
        <!-- Pin 1 - $450K -->
        <g class="map-pin" transform="translate(170, 85)">
          <ellipse cx="0" cy="22" rx="8" ry="3" fill="#1e3a5f" opacity="0.15"/>
          <path d="M0-12 C-8-12-14-6-14 1 C-14 10 0 22 0 22 S14 10 14 1 C14-6 8-12 0-12Z" fill="#1e3a5f"/>
          <circle cx="0" cy="0" r="5" fill="white"/>
          <text x="0" y="3" text-anchor="middle" font-size="5" fill="#1e3a5f" font-weight="700" font-family="DM Sans">$</text>
          <rect x="-20" y="-32" width="40" height="16" rx="4" fill="white" stroke="#1e3a5f" stroke-width="0.5" filter="url(#shadow)"/>
          <text x="0" y="-21" text-anchor="middle" font-size="8" fill="#1e3a5f" font-weight="600" font-family="DM Sans">$450K</text>
        </g>
        <!-- Pin 2 - $320K -->
        <g class="map-pin" transform="translate(350, 170)">
          <ellipse cx="0" cy="22" rx="8" ry="3" fill="#a16207" opacity="0.15"/>
          <path d="M0-12 C-8-12-14-6-14 1 C-14 10 0 22 0 22 S14 10 14 1 C14-6 8-12 0-12Z" fill="#a16207"/>
          <circle cx="0" cy="0" r="5" fill="white"/>
          <text x="0" y="3" text-anchor="middle" font-size="5" fill="#a16207" font-weight="700" font-family="DM Sans">$</text>
          <rect x="-20" y="-32" width="40" height="16" rx="4" fill="white" stroke="#a16207" stroke-width="0.5"/>
          <text x="0" y="-21" text-anchor="middle" font-size="8" fill="#a16207" font-weight="600" font-family="DM Sans">$320K</text>
        </g>
        <!-- Pin 3 - $780K -->
        <g class="map-pin" transform="translate(100, 340)">
          <ellipse cx="0" cy="22" rx="8" ry="3" fill="#1e3a5f" opacity="0.15"/>
          <path d="M0-12 C-8-12-14-6-14 1 C-14 10 0 22 0 22 S14 10 14 1 C14-6 8-12 0-12Z" fill="#1e3a5f"/>
          <circle cx="0" cy="0" r="5" fill="white"/>
          <text x="0" y="3" text-anchor="middle" font-size="5" fill="#1e3a5f" font-weight="700" font-family="DM Sans">$</text>
          <rect x="-20" y="-32" width="40" height="16" rx="4" fill="white" stroke="#1e3a5f" stroke-width="0.5"/>
          <text x="0" y="-21" text-anchor="middle" font-size="8" fill="#1e3a5f" font-weight="600" font-family="DM Sans">$780K</text>
        </g>
        <!-- Pin 4 - $520K -->
        <g class="map-pin" transform="translate(420, 380)">
          <ellipse cx="0" cy="22" rx="8" ry="3" fill="#a16207" opacity="0.15"/>
          <path d="M0-12 C-8-12-14-6-14 1 C-14 10 0 22 0 22 S14 10 14 1 C14-6 8-12 0-12Z" fill="#a16207"/>
          <circle cx="0" cy="0" r="5" fill="white"/>
          <text x="0" y="3" text-anchor="middle" font-size="5" fill="#a16207" font-weight="700" font-family="DM Sans">$</text>
          <rect x="-20" y="-32" width="40" height="16" rx="4" fill="white" stroke="#a16207" stroke-width="0.5"/>
          <text x="0" y="-21" text-anchor="middle" font-size="8" fill="#a16207" font-weight="600" font-family="DM Sans">$520K</text>
        </g>
        <!-- Pin 5 - $1.2M -->
        <g class="map-pin" transform="translate(280, 270)">
          <ellipse cx="0" cy="22" rx="8" ry="3" fill="#1e3a5f" opacity="0.2"/>
          <path d="M0-14 C-10-14-16-7-16 1 C-16 12 0 26 0 26 S16 12 16 1 C16-7 10-14 0-14Z" fill="#1e3a5f"/>
          <circle cx="0" cy="0" r="6" fill="white"/>
          <text x="0" y="3" text-anchor="middle" font-size="5" fill="#1e3a5f" font-weight="700" font-family="DM Sans">$</text>
          <rect x="-22" y="-36" width="44" height="18" rx="4" fill="#1e3a5f"/>
          <text x="0" y="-24" text-anchor="middle" font-size="9" fill="white" font-weight="700" font-family="DM Sans">$1.2M</text>
        </g>
      </svg>
    </div>

    <!-- RIGHT: Search form -->
    <div class="bg-navy rounded-r-2xl p-8 md:p-10 flex flex-col justify-center fade-up relative overflow-hidden">
      <!-- Floor plan decoration -->
      <svg class="absolute top-6 right-6 opacity-[0.06]" width="140" height="140" viewBox="0 0 140 140" fill="none" stroke="white" stroke-width="1.5">
        <rect x="5" y="5" width="60" height="80" rx="2"/>
        <rect x="65" y="5" width="70" height="50" rx="2"/>
        <rect x="65" y="55" width="40" height="30" rx="2"/>
        <rect x="105" y="55" width="30" height="80" rx="2"/>
        <rect x="5" y="85" width="60" height="50" rx="2"/>
        <rect x="65" y="85" width="40" height="50" rx="2"/>
        <line x1="25" y1="5" x2="25" y2="45" stroke-dasharray="3 3"/>
        <line x1="65" y1="25" x2="95" y2="25" stroke-dasharray="3 3"/>
        <line x1="85" y1="85" x2="85" y2="115" stroke-dasharray="3 3"/>
      </svg>

      <div class="relative z-10">
        <span class="inline-block text-xs text-wood-light font-medium tracking-wider uppercase mb-3">Find Your Property</span>
        <h1 class="font-display text-3xl md:text-4xl text-white leading-tight mb-2">
          Where Life Meets<br>Location.
        </h1>
        <p class="text-sm text-white/50 mb-8 max-w-sm leading-relaxed">Search through 1,200+ verified listings across the metropolitan area. Updated daily.</p>

        <div class="space-y-4">
          <!-- Location -->
          <div>
            <label class="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 block">Location</label>
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              <input type="text" placeholder="City, neighborhood, or ZIP..." class="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-wood/50 transition-colors">
            </div>
          </div>

          <!-- Property Type -->
          <div>
            <label class="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 block">Property Type</label>
            <div class="grid grid-cols-3 gap-2" id="propTypes">
              <button onclick="selectType(this)" class="prop-type-btn px-3 py-2.5 border border-white/10 rounded-lg text-xs text-white/60 hover:border-wood/40 transition-all cursor-pointer text-center">House</button>
              <button onclick="selectType(this)" class="prop-type-btn px-3 py-2.5 border border-white/10 rounded-lg text-xs text-white/60 hover:border-wood/40 transition-all cursor-pointer text-center">Condo</button>
              <button onclick="selectType(this)" class="prop-type-btn px-3 py-2.5 border border-white/10 rounded-lg text-xs text-white/60 hover:border-wood/40 transition-all cursor-pointer text-center">Townhouse</button>
            </div>
          </div>

          <!-- Price Range -->
          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label class="text-[10px] text-white/40 uppercase tracking-wider">Price Range</label>
              <span id="priceLabel" class="text-xs text-wood-light font-medium">$250K - $750K</span>
            </div>
            <input type="range" min="100" max="2000" value="750" class="range-slider" id="priceRange" oninput="updatePrice(this.value)">
            <div class="flex justify-between mt-1">
              <span class="text-[10px] text-white/20">$100K</span>
              <span class="text-[10px] text-white/20">$2M+</span>
            </div>
          </div>

          <!-- Search Button -->
          <button onclick="handleAction('Search Properties')" class="w-full py-3.5 bg-wood text-white text-sm font-semibold rounded-lg hover:bg-wood-light transition-colors mt-2 cursor-pointer flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            Search Properties
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Featured Properties -->
<section id="properties" class="py-20 px-6 bg-white relative">
  <!-- Floor plan watermark behind section -->
  <svg class="absolute right-0 top-10 opacity-[0.03]" width="400" height="350" viewBox="0 0 400 350" fill="none" stroke="#1e3a5f" stroke-width="2">
    <rect x="20" y="20" width="150" height="200" rx="3"/>
    <rect x="170" y="20" width="120" height="130" rx="3"/>
    <rect x="170" y="150" width="120" height="70" rx="3"/>
    <rect x="290" y="20" width="90" height="200" rx="3"/>
    <rect x="20" y="220" width="150" height="110" rx="3"/>
    <rect x="170" y="220" width="210" height="110" rx="3"/>
    <line x1="80" y1="20" x2="80" y2="120" stroke-dasharray="4 4"/>
    <line x1="170" y1="80" x2="230" y2="80" stroke-dasharray="4 4"/>
    <line x1="330" y1="20" x2="330" y2="120" stroke-dasharray="4 4"/>
    <line x1="80" y1="220" x2="80" y2="280" stroke-dasharray="4 4"/>
    <line x1="270" y1="220" x2="270" y2="280" stroke-dasharray="4 4"/>
    <!-- Dimension markers -->
    <text x="90" y="15" font-size="8" fill="#1e3a5f" opacity="0.5" font-family="DM Sans">12'</text>
    <text x="220" y="15" font-size="8" fill="#1e3a5f" opacity="0.5" font-family="DM Sans">9'6"</text>
  </svg>

  <div class="max-w-7xl mx-auto relative z-10">
    <div class="flex items-end justify-between mb-10 fade-up">
      <div>
        <span class="text-xs text-wood tracking-widest uppercase font-medium">Featured Listings</span>
        <h2 class="font-display text-3xl mt-1">Handpicked Properties</h2>
      </div>
      <a onclick="handleAction('View All Listings')" class="cursor-pointer text-sm text-navy hover:text-wood transition-colors hidden md:flex items-center gap-1">
        View all listings
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <!-- Property 1 -->
      <div class="property-card bg-white rounded-xl overflow-hidden border border-slate-100 fade-up cursor-pointer" onclick="handleAction('View 1847 Oak Avenue')">
        <div class="aspect-[4/3] relative overflow-hidden" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%);">
          <div class="absolute inset-0 flex items-center justify-center">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="0.8" opacity="0.2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
          </div>
          <div class="absolute top-3 left-3 px-2.5 py-1 bg-navy text-white text-[10px] font-medium rounded-md">Featured</div>
          <div class="absolute bottom-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-navy text-[10px] rounded-md font-medium">House</div>
        </div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xl font-bold text-navy">$450,000</span>
            <span class="text-[10px] text-wood font-medium bg-wood-soft px-2 py-0.5 rounded">$225/sqft</span>
          </div>
          <h3 class="font-display text-lg mb-1.5">1847 Oak Avenue</h3>
          <p class="text-xs text-slate mb-3">Westfield Heights, CA 94102</p>
          <div class="flex items-center gap-4 py-3 border-t border-slate-100">
            <div class="flex items-center gap-1.5 text-xs text-slate-dark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7v11a2 2 0 002 2h14"/><path d="M7 7h14v5H7z"/><path d="M7 12v4"/><path d="M21 12v4"/></svg>
              <span>4 bd</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-dark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h16a1 1 0 011 1v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3a2 2 0 012 2v7"/></svg>
              <span>3 ba</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-dark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>
              <span>2,000 sqft</span>
            </div>
          </div>
          <button onclick="event.stopPropagation(); handleAction('View 1847 Oak Avenue')" class="w-full mt-3 py-2.5 border border-navy text-navy text-xs font-medium rounded-lg hover:bg-navy hover:text-white transition-all cursor-pointer">View Property</button>
        </div>
      </div>

      <!-- Property 2 -->
      <div class="property-card bg-white rounded-xl overflow-hidden border border-slate-100 fade-up cursor-pointer" onclick="handleAction('View 520 Marina Blvd')">
        <div class="aspect-[4/3] relative overflow-hidden" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%);">
          <div class="absolute inset-0 flex items-center justify-center">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#a16207" stroke-width="0.8" opacity="0.2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10"/><path d="M8 6h2M8 10h2M14 6h2M14 10h2"/></svg>
          </div>
          <div class="absolute top-3 left-3 px-2.5 py-1 bg-wood text-white text-[10px] font-medium rounded-md">New</div>
          <div class="absolute bottom-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-navy text-[10px] rounded-md font-medium">Condo</div>
        </div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xl font-bold text-navy">$320,000</span>
            <span class="text-[10px] text-wood font-medium bg-wood-soft px-2 py-0.5 rounded">$320/sqft</span>
          </div>
          <h3 class="font-display text-lg mb-1.5">520 Marina Blvd #12A</h3>
          <p class="text-xs text-slate mb-3">Harbor Point, CA 94107</p>
          <div class="flex items-center gap-4 py-3 border-t border-slate-100">
            <div class="flex items-center gap-1.5 text-xs text-slate-dark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7v11a2 2 0 002 2h14"/><path d="M7 7h14v5H7z"/><path d="M7 12v4"/><path d="M21 12v4"/></svg>
              <span>2 bd</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-dark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h16a1 1 0 011 1v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3a2 2 0 012 2v7"/></svg>
              <span>2 ba</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-dark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>
              <span>1,000 sqft</span>
            </div>
          </div>
          <button onclick="event.stopPropagation(); handleAction('View 520 Marina Blvd')" class="w-full mt-3 py-2.5 border border-navy text-navy text-xs font-medium rounded-lg hover:bg-navy hover:text-white transition-all cursor-pointer">View Property</button>
        </div>
      </div>

      <!-- Property 3 -->
      <div class="property-card bg-white rounded-xl overflow-hidden border border-slate-100 fade-up cursor-pointer" onclick="handleAction('View 2200 Hillcrest Dr')">
        <div class="aspect-[4/3] relative overflow-hidden" style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%);">
          <div class="absolute inset-0 flex items-center justify-center">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="0.8" opacity="0.2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
          </div>
          <div class="absolute top-3 left-3 px-2.5 py-1 bg-navy/80 text-white text-[10px] font-medium rounded-md">Luxury</div>
          <div class="absolute bottom-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-navy text-[10px] rounded-md font-medium">House</div>
        </div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xl font-bold text-navy">$780,000</span>
            <span class="text-[10px] text-wood font-medium bg-wood-soft px-2 py-0.5 rounded">$195/sqft</span>
          </div>
          <h3 class="font-display text-lg mb-1.5">2200 Hillcrest Drive</h3>
          <p class="text-xs text-slate mb-3">Summit Park, CA 94118</p>
          <div class="flex items-center gap-4 py-3 border-t border-slate-100">
            <div class="flex items-center gap-1.5 text-xs text-slate-dark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7v11a2 2 0 002 2h14"/><path d="M7 7h14v5H7z"/><path d="M7 12v4"/><path d="M21 12v4"/></svg>
              <span>5 bd</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-dark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h16a1 1 0 011 1v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3a2 2 0 012 2v7"/></svg>
              <span>4 ba</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-dark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>
              <span>4,000 sqft</span>
            </div>
          </div>
          <button onclick="event.stopPropagation(); handleAction('View 2200 Hillcrest Dr')" class="w-full mt-3 py-2.5 border border-navy text-navy text-xs font-medium rounded-lg hover:bg-navy hover:text-white transition-all cursor-pointer">View Property</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Stats Strip -->
<section class="py-8 px-6 bg-navy">
  <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
    <div class="fade-up">
      <div class="text-2xl font-bold text-white">1,200+</div>
      <div class="text-xs text-white/40 mt-1">Active Properties</div>
    </div>
    <div class="fade-up">
      <div class="text-2xl font-bold text-white">98%</div>
      <div class="text-xs text-white/40 mt-1">Client Satisfaction</div>
    </div>
    <div class="fade-up">
      <div class="text-2xl font-bold text-white">15 Years</div>
      <div class="text-xs text-white/40 mt-1">of Experience</div>
    </div>
    <div class="fade-up">
      <div class="text-2xl font-bold text-white">$2.1B</div>
      <div class="text-xs text-white/40 mt-1">in Properties Sold</div>
    </div>
  </div>
</section>

<!-- How It Works -->
<section class="py-20 px-6 blueprint-bg relative">
  <div class="max-w-5xl mx-auto">
    <div class="text-center mb-14 fade-up">
      <span class="text-xs text-wood tracking-widest uppercase font-medium">Simple Process</span>
      <h2 class="font-display text-3xl mt-2 mb-3">How It Works</h2>
      <p class="text-sm text-slate max-w-lg mx-auto">From first search to closing day, we make the journey seamless.</p>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <!-- Step 1 -->
      <div class="step-card bg-white rounded-xl p-7 text-center border border-blueprint-line fade-up cursor-pointer">
        <div class="step-num w-10 h-10 mx-auto bg-blueprint rounded-full flex items-center justify-center text-navy font-bold text-sm mb-5 transition-all">1</div>
        <div class="w-16 h-16 mx-auto mb-5 flex items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#1e3a5f" stroke-width="1.5">
            <circle cx="20" cy="20" r="12"/>
            <path d="M28 28l10 10"/>
            <path d="M16 16l8 0M16 20l5 0" stroke-dasharray="2 2"/>
            <rect x="14" y="14" width="12" height="12" rx="1" stroke-dasharray="3 3" opacity="0.3"/>
          </svg>
        </div>
        <h3 class="font-display text-lg mb-2">Search</h3>
        <p class="step-desc text-xs text-slate leading-relaxed transition-colors">Browse listings with our smart filters. Save favorites and get instant alerts for new matches.</p>
      </div>

      <!-- Step 2 -->
      <div class="step-card bg-white rounded-xl p-7 text-center border border-blueprint-line fade-up cursor-pointer">
        <div class="step-num w-10 h-10 mx-auto bg-blueprint rounded-full flex items-center justify-center text-navy font-bold text-sm mb-5 transition-all">2</div>
        <div class="w-16 h-16 mx-auto mb-5 flex items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#1e3a5f" stroke-width="1.5">
            <rect x="8" y="12" width="32" height="24" rx="2"/>
            <path d="M8 18h32"/>
            <path d="M16 24v8"/>
            <path d="M24 18v18"/>
            <circle cx="30" cy="28" r="4" stroke-dasharray="3 3"/>
            <path d="M20 32h8" opacity="0.5"/>
          </svg>
        </div>
        <h3 class="font-display text-lg mb-2">Tour</h3>
        <p class="step-desc text-xs text-slate leading-relaxed transition-colors">Schedule in-person or virtual tours. Our agents provide detailed insights on every property.</p>
      </div>

      <!-- Step 3 -->
      <div class="step-card bg-white rounded-xl p-7 text-center border border-blueprint-line fade-up cursor-pointer">
        <div class="step-num w-10 h-10 mx-auto bg-blueprint rounded-full flex items-center justify-center text-navy font-bold text-sm mb-5 transition-all">3</div>
        <div class="w-16 h-16 mx-auto mb-5 flex items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#1e3a5f" stroke-width="1.5">
            <path d="M12 36l8-6 6 4 10-12"/>
            <rect x="8" y="8" width="32" height="32" rx="3"/>
            <path d="M18 28l3 3 7-8" stroke-width="2"/>
            <circle cx="36" cy="12" r="6" fill="#dbeafe" stroke="#1e3a5f"/>
            <path d="M34 12h4M36 10v4" stroke-width="1.5"/>
          </svg>
        </div>
        <h3 class="font-display text-lg mb-2">Close</h3>
        <p class="step-desc text-xs text-slate leading-relaxed transition-colors">We handle negotiations, inspections, and paperwork. Move in with confidence and peace of mind.</p>
      </div>
    </div>
  </div>
</section>

<!-- Testimonial -->
<section id="about" class="py-20 px-6 bg-white">
  <div class="max-w-5xl mx-auto">
    <div class="text-center mb-12 fade-up">
      <span class="text-xs text-wood tracking-widest uppercase font-medium">Client Stories</span>
      <h2 class="font-display text-3xl mt-2">What Our Clients Say</h2>
    </div>

    <div class="grid md:grid-cols-5 gap-8 items-center fade-up">
      <!-- Property image thumbnail -->
      <div class="md:col-span-2 relative">
        <div class="aspect-[4/5] rounded-xl overflow-hidden" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%);">
          <div class="absolute inset-0 flex items-center justify-center">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="0.6" opacity="0.15"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
          </div>
        </div>
        <div class="absolute -bottom-3 -right-3 bg-navy text-white rounded-lg px-4 py-2.5 shadow-lg">
          <div class="text-xs text-white/50">Sold for</div>
          <div class="font-bold text-wood-light">$485,000</div>
        </div>
      </div>

      <!-- Quote -->
      <div class="md:col-span-3">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#dbeafe"><path d="M3 21v-4a6 6 0 016-6V3H3v8h6a6 6 0 01-6 6v4zm12 0v-4a6 6 0 016-6V3h-6v8h6a6 6 0 01-6 6v4z"/></svg>
        <blockquote class="font-display text-xl md:text-2xl text-navy leading-relaxed mt-4 mb-6">
          "PrimeRealty made buying our first home effortless. Sarah guided us through every step, negotiated $30K below asking, and we closed in just 28 days. We couldn't have asked for a better experience."
        </blockquote>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-navy flex items-center justify-center">
            <span class="text-white font-bold text-sm">M&J</span>
          </div>
          <div>
            <div class="text-sm font-semibold text-navy">Michael & Jennifer Torres</div>
            <div class="text-xs text-slate">First-time buyers, Westfield Heights</div>
          </div>
          <div class="flex gap-0.5 ml-auto">
            <span class="text-wood">&#9733;</span>
            <span class="text-wood">&#9733;</span>
            <span class="text-wood">&#9733;</span>
            <span class="text-wood">&#9733;</span>
            <span class="text-wood">&#9733;</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="py-20 px-6 bg-navy relative overflow-hidden">
  <!-- Floor plan decoration -->
  <svg class="absolute left-0 bottom-0 opacity-[0.04]" width="500" height="300" viewBox="0 0 500 300" fill="none" stroke="white" stroke-width="1.5">
    <rect x="20" y="20" width="120" height="160" rx="3"/>
    <rect x="140" y="20" width="100" height="100" rx="3"/>
    <rect x="140" y="120" width="100" height="60" rx="3"/>
    <rect x="240" y="20" width="80" height="160" rx="3"/>
    <rect x="320" y="20" width="160" height="80" rx="3"/>
    <rect x="320" y="100" width="80" height="80" rx="3"/>
    <rect x="400" y="100" width="80" height="80" rx="3"/>
    <rect x="20" y="180" width="220" height="100" rx="3"/>
    <rect x="240" y="180" width="240" height="100" rx="3"/>
    <line x1="80" y1="20" x2="80" y2="100" stroke-dasharray="4 4"/>
    <line x1="280" y1="20" x2="280" y2="100" stroke-dasharray="4 4"/>
    <line x1="140" y1="70" x2="190" y2="70" stroke-dasharray="4 4"/>
    <line x1="360" y1="100" x2="360" y2="140" stroke-dasharray="4 4"/>
  </svg>

  <div class="max-w-3xl mx-auto text-center relative z-10">
    <div class="fade-up">
      <span class="text-xs text-wood-light tracking-widest uppercase font-medium">Start Your Search</span>
      <h2 class="font-display text-3xl md:text-4xl text-white mt-3 mb-4">Find Your Dream Home</h2>
      <p class="text-sm text-white/50 mb-8 max-w-lg mx-auto">Join 1,200+ happy homeowners who found their perfect property with PrimeRealty.</p>

      <!-- Condensed search bar -->
      <div class="bg-white/10 border border-white/10 rounded-xl p-2 flex flex-col md:flex-row gap-2 max-w-2xl mx-auto">
        <div class="flex-1 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          <input type="text" placeholder="Enter city, neighborhood, or ZIP..." class="w-full pl-10 pr-4 py-3 bg-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none">
        </div>
        <button onclick="handleAction('Quick Search')" class="px-8 py-3 bg-wood text-white text-sm font-semibold rounded-lg hover:bg-wood-light transition-colors cursor-pointer whitespace-nowrap">
          Search Now
        </button>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer id="contact" class="bg-navy-deep text-white py-14 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
      <!-- Brand -->
      <div>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 bg-navy rounded flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
          </div>
          <span class="font-display text-lg">PrimeRealty</span>
        </div>
        <p class="text-xs text-white/40 leading-relaxed mb-4">Trusted real estate professionals serving the Bay Area for over 15 years.</p>
        <div class="flex gap-3">
          <a onclick="handleAction('Facebook')" class="cursor-pointer w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" opacity="0.5"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
          </a>
          <a onclick="handleAction('Instagram')" class="cursor-pointer w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" opacity="0.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="white" opacity="0.5"/></svg>
          </a>
          <a onclick="handleAction('LinkedIn')" class="cursor-pointer w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" opacity="0.5"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z"/></svg>
          </a>
        </div>
      </div>

      <!-- Office Locations -->
      <div>
        <h4 class="text-xs font-semibold text-white/70 uppercase tracking-wider mb-4">Office Locations</h4>
        <div class="space-y-2.5 text-xs text-white/40">
          <div>
            <div class="text-white/60 font-medium">Main Office</div>
            <div>450 Market St, Suite 200</div>
            <div>San Francisco, CA 94102</div>
          </div>
          <div>
            <div class="text-white/60 font-medium">South Bay</div>
            <div>1280 El Camino Real</div>
            <div>Palo Alto, CA 94301</div>
          </div>
          <div>
            <div class="text-white/60 font-medium">East Bay</div>
            <div>800 Broadway</div>
            <div>Oakland, CA 94607</div>
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div>
        <h4 class="text-xs font-semibold text-white/70 uppercase tracking-wider mb-4">Contact</h4>
        <div class="space-y-2.5 text-xs text-white/40">
          <div class="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 11.042 11.042 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            <span>(415) 555-0120</span>
          </div>
          <div class="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
            <span>hello@primerealty.com</span>
          </div>
          <div class="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span>Mon-Sat 9am - 7pm</span>
          </div>
          <div class="pt-2">
            <button onclick="handleAction('Schedule Consultation')" class="px-4 py-2 border border-wood/40 text-wood-light text-[11px] rounded-lg hover:bg-wood hover:text-white transition-all cursor-pointer">
              Free Consultation
            </button>
          </div>
        </div>
      </div>

      <!-- License & Legal -->
      <div>
        <h4 class="text-xs font-semibold text-white/70 uppercase tracking-wider mb-4">Legal</h4>
        <div class="space-y-2 text-xs text-white/40">
          <div>DRE License #01234567</div>
          <div>NMLS ID #987654</div>
          <div>Equal Housing Opportunity</div>
          <div class="pt-2 space-y-1.5">
            <a onclick="handleAction('Privacy Policy')" class="block cursor-pointer hover:text-white/60 transition-colors">Privacy Policy</a>
            <a onclick="handleAction('Terms of Service')" class="block cursor-pointer hover:text-white/60 transition-colors">Terms of Service</a>
            <a onclick="handleAction('Fair Housing')" class="block cursor-pointer hover:text-white/60 transition-colors">Fair Housing Statement</a>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
      <p class="text-[10px] text-white/25">&copy; 2011-2026 PrimeRealty Inc. All rights reserved. DRE #01234567</p>
      <p class="text-[10px] text-white/25">MLS data courtesy of Bay Area Real Estate Information Services, Inc.</p>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-navy text-white px-5 py-3 rounded-lg text-xs shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-50 max-w-sm text-center border border-wood/20"></div>

<script>
function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('hidden'); }

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1'; t.style.transform = 'translate(-50%, 0)';
  setTimeout(function() { t.style.opacity = '0'; t.style.transform = 'translate(-50%, 8px)'; }, 2500);
}

function handleAction(a) { showToast(a + ' \u2014 template preview'); }

function selectType(btn) {
  document.querySelectorAll('.prop-type-btn').forEach(function(b) {
    b.classList.remove('border-wood', 'text-wood-light', 'bg-white/5');
    b.classList.add('border-white/10', 'text-white/60');
  });
  btn.classList.remove('border-white/10', 'text-white/60');
  btn.classList.add('border-wood', 'text-wood-light', 'bg-white/5');
}

function updatePrice(val) {
  var v = parseInt(val);
  var min = Math.max(100, v - 250);
  var label;
  if (v >= 1800) {
    label = '$' + (min / 1000).toFixed(1) + 'M - $2M+';
  } else if (v >= 1000) {
    label = '$' + (min / 1000).toFixed(1) + 'M - $' + (v / 1000).toFixed(1) + 'M';
  } else {
    label = '$' + min + 'K - $' + v + 'K';
  }
  document.getElementById('priceLabel').textContent = label;
}

// Scroll reveal
var obs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(function(el) { obs.observe(el); });

// Select first property type by default
document.querySelector('.prop-type-btn').click();
</script>

</body>
</html>$HTML$,
  3
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
