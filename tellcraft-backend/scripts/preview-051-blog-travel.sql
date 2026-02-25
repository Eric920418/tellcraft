INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '5735888e-3eba-4ca7-845c-e8541a5ff240',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Wanderlust Diaries</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{sepia:'#92400e','sepia-light':'#b45309','ocean':'#0369a1','ocean-light':'#0284c7',sand:'#d4a574','sand-light':'#e8c9a0',cream:'#fdf6ee','cream-dark':'#f5e6d3',parchment:'#fef9f0',ink:'#3c2415',stamp:'#991b1b','stamp-blue':'#1e40af'},fontFamily:{display:['Abril Fatface','serif'],body:['Lato','sans-serif']}}}}
</script>
<style>
body{font-family:'Lato',sans-serif;background:#fdf6ee}
html{scroll-behavior:smooth}

/* Reveal animations */
.reveal{opacity:0;transform:translateY(24px);transition:all 0.8s cubic-bezier(0.25,0.46,0.45,0.94)}
.reveal.visible{opacity:1;transform:translateY(0)}

/* Torn edge postcard effect */
.postcard{
  clip-path:polygon(
    0% 2%, 3% 0%, 7% 1.5%, 11% 0.5%, 15% 2%, 19% 0%, 23% 1%, 27% 0.5%, 31% 2%, 35% 0.5%,
    39% 1.5%, 43% 0%, 47% 2%, 51% 0.5%, 55% 1%, 59% 0%, 63% 2%, 67% 0.5%, 71% 1.5%, 75% 0%,
    79% 2%, 83% 0.5%, 87% 1%, 91% 0%, 95% 1.5%, 100% 0.5%,
    100% 97%, 97% 100%, 93% 98%, 89% 100%, 85% 98.5%, 81% 100%, 77% 98%, 73% 100%, 69% 98.5%,
    65% 100%, 61% 98%, 57% 100%, 53% 98.5%, 49% 100%, 45% 98%, 41% 100%, 37% 98.5%, 33% 100%,
    29% 98%, 25% 100%, 21% 98.5%, 17% 100%, 13% 98%, 9% 100%, 5% 98.5%, 0% 100%
  );
  transition:transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.5s ease;
}
.postcard:hover{transform:translateY(-6px) rotate(-0.5deg);box-shadow:0 20px 40px rgba(146,64,14,0.15)}

/* Passport stamp base */
.passport-stamp{
  position:absolute;
  opacity:0.12;
  transition:opacity 0.4s ease, transform 0.4s ease;
  pointer-events:auto;
  cursor:default;
}
.passport-stamp:hover{opacity:0.3;transform:scale(1.08) rotate(2deg)}

/* Map dot pulse */
.map-dot{animation:pulse-dot 2s ease-in-out infinite}
@keyframes pulse-dot{0%,100%{r:4}50%{r:6.5}}

/* Stamp ink effect */
.stamp-text{font-family:'Abril Fatface',serif;letter-spacing:0.1em}

/* Nav style */
.nav-link{position:relative}
.nav-link::after{content:'';position:absolute;bottom:-2px;left:50%;width:0;height:2px;background:#92400e;transition:all 0.3s ease;transform:translateX(-50%)}
.nav-link:hover::after{width:100%}

/* Tip card hover */
.tip-card{transition:transform 0.4s ease, box-shadow 0.4s ease}
.tip-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(146,64,14,0.12)}
</style>
</head>
<body class="bg-cream text-ink overflow-x-hidden">

<!-- ========== HEADER ========== -->
<header class="fixed top-0 w-full bg-cream/95 backdrop-blur-sm z-50 border-b border-sepia/10">
  <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#92400e" stroke-width="2" fill="none"/>
        <path d="M8 16 Q16 6 24 16 Q16 26 8 16Z" fill="#92400e" opacity="0.15"/>
        <circle cx="16" cy="16" r="2" fill="#92400e"/>
        <line x1="16" y1="4" x2="16" y2="8" stroke="#92400e" stroke-width="1.5"/>
        <line x1="16" y1="24" x2="16" y2="28" stroke="#92400e" stroke-width="1.5"/>
        <line x1="4" y1="16" x2="8" y2="16" stroke="#92400e" stroke-width="1.5"/>
        <line x1="24" y1="16" x2="28" y2="16" stroke="#92400e" stroke-width="1.5"/>
      </svg>
      <div>
        <div class="font-display text-xl text-sepia">Wanderlust Diaries</div>
        <div class="text-[9px] tracking-[0.35em] text-sepia/40 uppercase font-bold">Est. 2019</div>
      </div>
    </div>
    <nav class="hidden md:flex items-center gap-8">
      <a href="#destinations" class="nav-link text-sm font-bold text-sepia/60 hover:text-sepia transition-colors cursor-pointer">Destinations</a>
      <a href="#stories" class="nav-link text-sm font-bold text-sepia/60 hover:text-sepia transition-colors cursor-pointer">Stories</a>
      <a href="#tips" class="nav-link text-sm font-bold text-sepia/60 hover:text-sepia transition-colors cursor-pointer">Tips</a>
      <a href="#about" class="nav-link text-sm font-bold text-sepia/60 hover:text-sepia transition-colors cursor-pointer">About</a>
    </nav>
    <button class="md:hidden text-sepia/60 hover:text-sepia transition-colors cursor-pointer" onclick="document.getElementById('mobileMenu').classList.toggle('hidden')">
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>
  </div>
  <div id="mobileMenu" class="hidden md:hidden bg-cream border-t border-sepia/10 px-6 py-4 space-y-3">
    <a href="#destinations" class="block text-sm font-bold text-sepia/60 cursor-pointer">Destinations</a>
    <a href="#stories" class="block text-sm font-bold text-sepia/60 cursor-pointer">Stories</a>
    <a href="#tips" class="block text-sm font-bold text-sepia/60 cursor-pointer">Tips</a>
    <a href="#about" class="block text-sm font-bold text-sepia/60 cursor-pointer">About</a>
  </div>
</header>

<!-- ========== FEATURED ARTICLE ========== -->
<section class="pt-24 pb-8">
  <div class="max-w-6xl mx-auto px-6">
    <div class="relative rounded-2xl overflow-hidden bg-gradient-to-br from-sepia via-sepia-light to-ocean cursor-pointer group reveal" style="min-height:420px">
      <!-- Decorative stamp on featured -->
      <div class="absolute top-6 right-6 opacity-20">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="40" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="4 3"/>
          <circle cx="45" cy="45" r="32" fill="none" stroke="#fff" stroke-width="1.5"/>
          <text x="45" y="38" text-anchor="middle" fill="#fff" font-size="8" font-weight="700" letter-spacing="0.15em">KYOTO</text>
          <text x="45" y="50" text-anchor="middle" fill="#fff" font-size="6" letter-spacing="0.1em">JAPAN</text>
          <text x="45" y="62" text-anchor="middle" fill="#fff" font-size="5">2026.02.15</text>
        </svg>
      </div>
      <div class="relative z-10 p-8 md:p-14 max-w-2xl">
        <div class="flex items-center gap-3 mb-5">
          <span class="bg-white/20 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-full tracking-wider uppercase">Featured</span>
          <span class="text-white/50 text-xs font-light">February 15, 2026</span>
          <span class="text-white/40 text-xs">&#8226;</span>
          <span class="text-white/50 text-xs font-light">12 min read</span>
        </div>
        <h1 class="font-display text-4xl md:text-5xl lg:text-6xl text-white leading-[1.1] mb-5 group-hover:translate-x-1 transition-transform">
          48 Hours in Kyoto
        </h1>
        <p class="text-white/70 text-base md:text-lg leading-relaxed mb-8 max-w-lg font-light">
          Temple bells at dawn, bamboo groves whispering secrets, and the most exquisite kaiseki dinner under paper lanterns. A city where every street corner holds eight centuries of stories.
        </p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <div class="text-white text-sm font-bold">Elena Marlowe</div>
            <div class="text-white/40 text-xs">Travel Writer &amp; Photographer</div>
          </div>
        </div>
      </div>
      <!-- Decorative Japanese pattern overlay -->
      <div class="absolute inset-0 opacity-5" style="background-image:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><circle cx=%2230%22 cy=%2230%22 r=%2220%22 fill=%22none%22 stroke=%22white%22 stroke-width=%221%22/><circle cx=%2230%22 cy=%2230%22 r=%2210%22 fill=%22none%22 stroke=%22white%22 stroke-width=%221%22/></svg>');background-size:60px 60px"></div>
    </div>
  </div>
</section>

<!-- ========== PASSPORT STAMPS + POSTCARD GRID ========== -->
<section id="destinations" class="py-12 relative">
  <!-- Scattered Passport Stamps (decorative) -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <!-- Stamp 1: Paris -->
    <div class="passport-stamp" style="top:2%;left:3%;transform:rotate(-12deg)">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="48" fill="none" stroke="#991b1b" stroke-width="3"/>
        <circle cx="55" cy="55" r="42" fill="none" stroke="#991b1b" stroke-width="1.5" stroke-dasharray="3 2"/>
        <text x="55" y="35" text-anchor="middle" fill="#991b1b" font-size="7" font-weight="900" letter-spacing="0.2em" class="stamp-text">REPUBLIQUE</text>
        <text x="55" y="50" text-anchor="middle" fill="#991b1b" font-size="14" font-weight="900" class="stamp-text">PARIS</text>
        <text x="55" y="65" text-anchor="middle" fill="#991b1b" font-size="7" letter-spacing="0.15em">FRANCE</text>
        <line x1="20" y1="73" x2="90" y2="73" stroke="#991b1b" stroke-width="1"/>
        <text x="55" y="82" text-anchor="middle" fill="#991b1b" font-size="6">15 MAR 2025</text>
      </svg>
    </div>

    <!-- Stamp 2: Tokyo (rectangular) -->
    <div class="passport-stamp" style="top:8%;right:5%;transform:rotate(8deg)">
      <svg width="120" height="80" viewBox="0 0 120 80">
        <rect x="3" y="3" width="114" height="74" rx="4" fill="none" stroke="#1e40af" stroke-width="3"/>
        <rect x="8" y="8" width="104" height="64" rx="2" fill="none" stroke="#1e40af" stroke-width="1" stroke-dasharray="4 2"/>
        <text x="60" y="30" text-anchor="middle" fill="#1e40af" font-size="7" font-weight="700" letter-spacing="0.3em">IMMIGRATION</text>
        <text x="60" y="48" text-anchor="middle" fill="#1e40af" font-size="16" font-weight="900" class="stamp-text">TOKYO</text>
        <text x="60" y="64" text-anchor="middle" fill="#1e40af" font-size="6" letter-spacing="0.1em">NARITA AIRPORT 08.JUL.2025</text>
      </svg>
    </div>

    <!-- Stamp 3: Marrakech -->
    <div class="passport-stamp" style="top:42%;left:1%;transform:rotate(15deg)">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <polygon points="50,5 61,35 95,35 67,55 78,85 50,67 22,85 33,55 5,35 39,35" fill="none" stroke="#991b1b" stroke-width="2"/>
        <text x="50" y="48" text-anchor="middle" fill="#991b1b" font-size="8" font-weight="900" class="stamp-text">MARRAKECH</text>
        <text x="50" y="60" text-anchor="middle" fill="#991b1b" font-size="5" letter-spacing="0.1em">MOROCCO</text>
      </svg>
    </div>

    <!-- Stamp 4: Lisbon -->
    <div class="passport-stamp" style="top:55%;right:2%;transform:rotate(-6deg)">
      <svg width="105" height="105" viewBox="0 0 105 105">
        <circle cx="52" cy="52" r="46" fill="none" stroke="#92400e" stroke-width="3"/>
        <circle cx="52" cy="52" r="39" fill="none" stroke="#92400e" stroke-width="1"/>
        <text x="52" y="38" text-anchor="middle" fill="#92400e" font-size="6" font-weight="700" letter-spacing="0.25em">AEROPORTO</text>
        <text x="52" y="54" text-anchor="middle" fill="#92400e" font-size="13" font-weight="900" class="stamp-text">LISBOA</text>
        <text x="52" y="68" text-anchor="middle" fill="#92400e" font-size="5" letter-spacing="0.15em">PORTUGAL</text>
        <text x="52" y="80" text-anchor="middle" fill="#92400e" font-size="5">22.NOV.2025</text>
      </svg>
    </div>

    <!-- Stamp 5: Bangkok (rectangular) -->
    <div class="passport-stamp" style="top:82%;left:6%;transform:rotate(4deg)">
      <svg width="115" height="75" viewBox="0 0 115 75">
        <rect x="2" y="2" width="111" height="71" rx="3" fill="none" stroke="#1e40af" stroke-width="2.5"/>
        <text x="57" y="25" text-anchor="middle" fill="#1e40af" font-size="6" font-weight="700" letter-spacing="0.3em">KINGDOM OF THAILAND</text>
        <text x="57" y="45" text-anchor="middle" fill="#1e40af" font-size="15" font-weight="900" class="stamp-text">BANGKOK</text>
        <text x="57" y="62" text-anchor="middle" fill="#1e40af" font-size="5" letter-spacing="0.1em">SUVARNABHUMI 19.SEP.2025</text>
      </svg>
    </div>

    <!-- Stamp 6: Buenos Aires -->
    <div class="passport-stamp" style="top:85%;right:4%;transform:rotate(-10deg)">
      <svg width="95" height="95" viewBox="0 0 95 95">
        <circle cx="47" cy="47" r="42" fill="none" stroke="#991b1b" stroke-width="2.5"/>
        <circle cx="47" cy="47" r="36" fill="none" stroke="#991b1b" stroke-width="1" stroke-dasharray="5 3"/>
        <text x="47" y="36" text-anchor="middle" fill="#991b1b" font-size="5" font-weight="700" letter-spacing="0.2em">REPUBLICA ARGENTINA</text>
        <text x="47" y="50" text-anchor="middle" fill="#991b1b" font-size="9" font-weight="900" class="stamp-text">BUENOS AIRES</text>
        <text x="47" y="63" text-anchor="middle" fill="#991b1b" font-size="5">EZEIZA 04.JAN.2026</text>
      </svg>
    </div>
  </div>

  <div class="max-w-6xl mx-auto px-6 relative z-10">
    <div class="flex items-center justify-between mb-10">
      <div>
        <h2 class="font-display text-3xl md:text-4xl text-sepia">Recent Postcards</h2>
        <p class="text-sepia/40 text-sm mt-1 font-light">Stories from the road, torn from my notebook</p>
      </div>
      <div class="hidden md:flex items-center gap-1 bg-cream-dark rounded-full p-1">
        <button onclick="filterCards('all')" class="filter-btn text-xs font-bold px-4 py-2 rounded-full bg-sepia text-cream transition-all cursor-pointer" data-filter="all">All</button>
        <button onclick="filterCards('asia')" class="filter-btn text-xs font-bold px-4 py-2 rounded-full text-sepia/50 hover:text-sepia transition-all cursor-pointer" data-filter="asia">Asia</button>
        <button onclick="filterCards('europe')" class="filter-btn text-xs font-bold px-4 py-2 rounded-full text-sepia/50 hover:text-sepia transition-all cursor-pointer" data-filter="europe">Europe</button>
        <button onclick="filterCards('americas')" class="filter-btn text-xs font-bold px-4 py-2 rounded-full text-sepia/50 hover:text-sepia transition-all cursor-pointer" data-filter="americas">Americas</button>
      </div>
    </div>

    <!-- 3x2 Postcard Grid -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8" id="postcardGrid">

      <!-- Postcard 1: Santorini -->
      <article class="postcard bg-white p-1.5 reveal cursor-pointer group" data-region="europe" onclick="showToast('Opening: Santorini Sunsets...')">
        <div class="aspect-[4/3] bg-gradient-to-br from-blue-200 via-sky-100 to-blue-300 flex items-center justify-center relative overflow-hidden">
          <div class="text-center">
            <svg class="mx-auto mb-2" width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="20" width="10" height="18" rx="1" fill="#0369a1" opacity="0.6"/>
              <rect x="20" y="14" width="10" height="24" rx="1" fill="#0369a1" opacity="0.4"/>
              <rect x="32" y="18" width="8" height="20" rx="1" fill="#0369a1" opacity="0.5"/>
              <ellipse cx="13" cy="18" rx="6" ry="4" fill="white" opacity="0.9"/>
              <ellipse cx="25" cy="12" rx="6" ry="4" fill="white" opacity="0.9"/>
              <ellipse cx="36" cy="16" rx="5" ry="3" fill="white" opacity="0.9"/>
              <circle cx="40" cy="8" r="5" fill="#d4a574" opacity="0.7"/>
            </svg>
            <div class="font-display text-ocean text-sm opacity-60">Santorini</div>
          </div>
          <div class="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[9px] font-black tracking-wider text-ocean uppercase">Greece</div>
        </div>
        <div class="p-4">
          <h3 class="font-display text-lg text-sepia mb-1 group-hover:text-ocean transition-colors">Santorini Sunsets &amp; Blue Domes</h3>
          <p class="text-sepia/50 text-xs leading-relaxed line-clamp-2 font-light">Watching the sun melt into the caldera from Oia, where every whitewashed wall becomes a canvas of gold and amber.</p>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-sepia/8">
            <span class="text-[10px] text-sepia/30 font-light">Jan 28, 2026</span>
            <span class="text-[10px] text-ocean/60 font-bold">8 min read</span>
          </div>
        </div>
      </article>

      <!-- Postcard 2: Marrakech -->
      <article class="postcard bg-white p-1.5 reveal cursor-pointer group" data-region="americas" style="transition-delay:0.06s" onclick="showToast('Opening: Marrakech Medina...')">
        <div class="aspect-[4/3] bg-gradient-to-br from-amber-200 via-orange-100 to-red-200 flex items-center justify-center relative overflow-hidden">
          <div class="text-center">
            <svg class="mx-auto mb-2" width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L28 16H40L30 24L34 36L24 28L14 36L18 24L8 16H20L24 4Z" fill="#92400e" opacity="0.3"/>
              <rect x="18" y="22" width="12" height="18" rx="6" fill="#92400e" opacity="0.2"/>
              <rect x="21" y="30" width="6" height="10" rx="3" fill="#92400e" opacity="0.3"/>
            </svg>
            <div class="font-display text-sepia text-sm opacity-60">Marrakech</div>
          </div>
          <div class="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[9px] font-black tracking-wider text-sepia uppercase">Morocco</div>
        </div>
        <div class="p-4">
          <h3 class="font-display text-lg text-sepia mb-1 group-hover:text-ocean transition-colors">Lost in the Marrakech Medina</h3>
          <p class="text-sepia/50 text-xs leading-relaxed line-clamp-2 font-light">The scent of cumin and cedar, the maze of copper-lit souks, and a rooftop tagine that tasted like centuries of tradition.</p>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-sepia/8">
            <span class="text-[10px] text-sepia/30 font-light">Jan 14, 2026</span>
            <span class="text-[10px] text-ocean/60 font-bold">10 min read</span>
          </div>
        </div>
      </article>

      <!-- Postcard 3: Patagonia -->
      <article class="postcard bg-white p-1.5 reveal cursor-pointer group" data-region="americas" style="transition-delay:0.12s" onclick="showToast('Opening: Patagonia Winds...')">
        <div class="aspect-[4/3] bg-gradient-to-br from-slate-200 via-cyan-100 to-sky-200 flex items-center justify-center relative overflow-hidden">
          <div class="text-center">
            <svg class="mx-auto mb-2" width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M8 38L18 14L24 22L30 10L38 38Z" fill="#0369a1" opacity="0.2"/>
              <path d="M14 38L22 18L28 26L34 12L42 38Z" fill="#0369a1" opacity="0.15"/>
              <path d="M18 14L24 4L30 10" fill="white" opacity="0.5"/>
            </svg>
            <div class="font-display text-ocean text-sm opacity-60">Patagonia</div>
          </div>
          <div class="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[9px] font-black tracking-wider text-ocean uppercase">Argentina</div>
        </div>
        <div class="p-4">
          <h3 class="font-display text-lg text-sepia mb-1 group-hover:text-ocean transition-colors">Patagonia: Where Wind Has a Voice</h3>
          <p class="text-sepia/50 text-xs leading-relaxed line-clamp-2 font-light">Torres del Paine at first light, glaciers cracking like thunder, and guanacos watching you with curious indifference.</p>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-sepia/8">
            <span class="text-[10px] text-sepia/30 font-light">Dec 20, 2025</span>
            <span class="text-[10px] text-ocean/60 font-bold">14 min read</span>
          </div>
        </div>
      </article>

      <!-- Postcard 4: Chiang Mai -->
      <article class="postcard bg-white p-1.5 reveal cursor-pointer group" data-region="asia" style="transition-delay:0.18s" onclick="showToast('Opening: Chiang Mai Temples...')">
        <div class="aspect-[4/3] bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-200 flex items-center justify-center relative overflow-hidden">
          <div class="text-center">
            <svg class="mx-auto mb-2" width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 6L30 18H18L24 6Z" fill="#92400e" opacity="0.3"/>
              <path d="M24 14L32 28H16L24 14Z" fill="#92400e" opacity="0.25"/>
              <path d="M24 22L34 38H14L24 22Z" fill="#92400e" opacity="0.2"/>
              <rect x="22" y="38" width="4" height="6" fill="#92400e" opacity="0.3"/>
            </svg>
            <div class="font-display text-sepia text-sm opacity-60">Chiang Mai</div>
          </div>
          <div class="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[9px] font-black tracking-wider text-sepia uppercase">Thailand</div>
        </div>
        <div class="p-4">
          <h3 class="font-display text-lg text-sepia mb-1 group-hover:text-ocean transition-colors">Chiang Mai Temple Trail at Dawn</h3>
          <p class="text-sepia/50 text-xs leading-relaxed line-clamp-2 font-light">Saffron-robed monks collecting alms on misty streets, Doi Suthep glistening above the old city walls.</p>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-sepia/8">
            <span class="text-[10px] text-sepia/30 font-light">Dec 5, 2025</span>
            <span class="text-[10px] text-ocean/60 font-bold">7 min read</span>
          </div>
        </div>
      </article>

      <!-- Postcard 5: Iceland -->
      <article class="postcard bg-white p-1.5 reveal cursor-pointer group" data-region="europe" style="transition-delay:0.24s" onclick="showToast('Opening: Iceland Ring Road...')">
        <div class="aspect-[4/3] bg-gradient-to-br from-indigo-200 via-purple-100 to-green-100 flex items-center justify-center relative overflow-hidden">
          <div class="text-center">
            <svg class="mx-auto mb-2" width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M6 36 Q12 20 18 30 Q24 12 30 26 Q36 18 42 36Z" fill="#0369a1" opacity="0.15"/>
              <ellipse cx="24" cy="18" rx="14" ry="6" fill="none" stroke="#0369a1" stroke-width="1" opacity="0.3"/>
              <path d="M16 14 Q20 6 24 10 Q28 6 32 14" fill="none" stroke="#4ade80" stroke-width="1.5" opacity="0.5"/>
            </svg>
            <div class="font-display text-ocean text-sm opacity-60">Iceland</div>
          </div>
          <div class="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[9px] font-black tracking-wider text-ocean uppercase">Iceland</div>
        </div>
        <div class="p-4">
          <h3 class="font-display text-lg text-sepia mb-1 group-hover:text-ocean transition-colors">Iceland Ring Road in Winter</h3>
          <p class="text-sepia/50 text-xs leading-relaxed line-clamp-2 font-light">Northern lights dancing over black sand beaches, ice caves glowing blue, and hot springs steaming under the Arctic sky.</p>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-sepia/8">
            <span class="text-[10px] text-sepia/30 font-light">Nov 18, 2025</span>
            <span class="text-[10px] text-ocean/60 font-bold">15 min read</span>
          </div>
        </div>
      </article>

      <!-- Postcard 6: Lisbon -->
      <article class="postcard bg-white p-1.5 reveal cursor-pointer group" data-region="europe" style="transition-delay:0.3s" onclick="showToast('Opening: Lisbon Trams...')">
        <div class="aspect-[4/3] bg-gradient-to-br from-yellow-200 via-amber-100 to-rose-200 flex items-center justify-center relative overflow-hidden">
          <div class="text-center">
            <svg class="mx-auto mb-2" width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="14" y="12" width="20" height="28" rx="4" fill="#92400e" opacity="0.2"/>
              <rect x="18" y="16" width="12" height="10" rx="2" fill="#d4a574" opacity="0.4"/>
              <circle cx="20" cy="34" r="3" fill="#92400e" opacity="0.2"/>
              <circle cx="28" cy="34" r="3" fill="#92400e" opacity="0.2"/>
              <line x1="10" y1="40" x2="38" y2="40" stroke="#92400e" stroke-width="2" opacity="0.2"/>
            </svg>
            <div class="font-display text-sepia text-sm opacity-60">Lisbon</div>
          </div>
          <div class="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[9px] font-black tracking-wider text-sepia uppercase">Portugal</div>
        </div>
        <div class="p-4">
          <h3 class="font-display text-lg text-sepia mb-1 group-hover:text-ocean transition-colors">Lisbon: Trams, Tiles &amp; Pasteis</h3>
          <p class="text-sepia/50 text-xs leading-relaxed line-clamp-2 font-light">Riding tram 28 through Alfama, tracing azulejo patterns with fingertips, and that first warm bite of pastel de nata.</p>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-sepia/8">
            <span class="text-[10px] text-sepia/30 font-light">Nov 2, 2025</span>
            <span class="text-[10px] text-ocean/60 font-bold">9 min read</span>
          </div>
        </div>
      </article>
    </div>
  </div>
</section>

<!-- ========== WORLD MAP SECTION ========== -->
<section id="stories" class="py-20 bg-cream-dark relative">
  <div class="max-w-5xl mx-auto px-6 reveal">
    <div class="text-center mb-10">
      <h2 class="font-display text-3xl md:text-4xl text-sepia">Where I've Been</h2>
      <p class="text-sepia/40 text-sm mt-2 font-light">23 countries and counting</p>
    </div>
    <!-- Simplified World Map SVG -->
    <div class="relative bg-white/50 rounded-2xl p-6 md:p-10 border border-sepia/8">
      <svg viewBox="0 0 900 450" class="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Simplified continent outlines -->
        <!-- North America -->
        <path d="M80 80 Q120 60 180 70 Q220 65 240 80 Q260 100 250 130 Q240 160 220 180 Q200 200 180 210 Q150 220 130 200 Q100 180 90 150 Q80 120 80 80Z" fill="#d4a574" opacity="0.15" stroke="#92400e" stroke-width="0.5" opacity="0.3"/>
        <!-- South America -->
        <path d="M180 240 Q210 230 220 250 Q230 280 225 320 Q220 360 200 390 Q180 410 170 380 Q160 340 165 300 Q170 260 180 240Z" fill="#d4a574" opacity="0.15" stroke="#92400e" stroke-width="0.5" opacity="0.3"/>
        <!-- Europe -->
        <path d="M380 60 Q420 55 450 65 Q480 75 490 95 Q485 120 470 140 Q450 155 420 150 Q400 145 385 130 Q375 110 375 90 Q375 75 380 60Z" fill="#d4a574" opacity="0.15" stroke="#92400e" stroke-width="0.5" opacity="0.3"/>
        <!-- Africa -->
        <path d="M400 160 Q440 150 470 170 Q490 200 485 250 Q480 300 460 340 Q440 370 420 360 Q400 340 395 300 Q390 250 390 210 Q392 180 400 160Z" fill="#d4a574" opacity="0.15" stroke="#92400e" stroke-width="0.5" opacity="0.3"/>
        <!-- Asia -->
        <path d="M500 50 Q560 40 640 55 Q720 70 760 100 Q780 130 770 160 Q750 190 700 200 Q650 205 600 195 Q550 180 520 150 Q500 120 495 90 Q495 65 500 50Z" fill="#d4a574" opacity="0.15" stroke="#92400e" stroke-width="0.5" opacity="0.3"/>
        <!-- Australia -->
        <path d="M700 290 Q740 280 770 295 Q790 310 785 340 Q775 365 750 370 Q720 372 705 355 Q695 335 695 315 Q695 300 700 290Z" fill="#d4a574" opacity="0.15" stroke="#92400e" stroke-width="0.5" opacity="0.3"/>

        <!-- Visited destination dots -->
        <!-- Lisbon -->
        <circle cx="370" cy="115" r="4" fill="#0369a1" class="map-dot" style="animation-delay:0s"/>
        <text x="370" y="108" text-anchor="middle" fill="#92400e" font-size="7" font-weight="700" opacity="0.6">Lisbon</text>

        <!-- Paris -->
        <circle cx="415" cy="88" r="4" fill="#0369a1" class="map-dot" style="animation-delay:0.3s"/>
        <text x="415" y="81" text-anchor="middle" fill="#92400e" font-size="7" font-weight="700" opacity="0.6">Paris</text>

        <!-- Santorini -->
        <circle cx="460" cy="115" r="4" fill="#0369a1" class="map-dot" style="animation-delay:0.6s"/>
        <text x="460" y="108" text-anchor="middle" fill="#92400e" font-size="7" font-weight="700" opacity="0.6">Santorini</text>

        <!-- Marrakech -->
        <circle cx="395" cy="155" r="4" fill="#991b1b" class="map-dot" style="animation-delay:0.9s"/>
        <text x="395" y="148" text-anchor="middle" fill="#92400e" font-size="7" font-weight="700" opacity="0.6">Marrakech</text>

        <!-- Tokyo -->
        <circle cx="740" cy="110" r="4" fill="#0369a1" class="map-dot" style="animation-delay:1.2s"/>
        <text x="740" y="103" text-anchor="middle" fill="#92400e" font-size="7" font-weight="700" opacity="0.6">Tokyo</text>

        <!-- Kyoto -->
        <circle cx="725" cy="120" r="4" fill="#0369a1" class="map-dot" style="animation-delay:1.5s"/>
        <text x="725" y="133" text-anchor="middle" fill="#92400e" font-size="7" font-weight="700" opacity="0.6">Kyoto</text>

        <!-- Chiang Mai -->
        <circle cx="660" cy="160" r="4" fill="#d4a574" class="map-dot" style="animation-delay:1.8s"/>
        <text x="660" y="153" text-anchor="middle" fill="#92400e" font-size="7" font-weight="700" opacity="0.6">Chiang Mai</text>

        <!-- Bangkok -->
        <circle cx="665" cy="180" r="4" fill="#d4a574" class="map-dot" style="animation-delay:2.1s"/>
        <text x="665" y="193" text-anchor="middle" fill="#92400e" font-size="7" font-weight="700" opacity="0.6">Bangkok</text>

        <!-- Iceland -->
        <circle cx="365" cy="55" r="4" fill="#0369a1" class="map-dot" style="animation-delay:2.4s"/>
        <text x="365" y="48" text-anchor="middle" fill="#92400e" font-size="7" font-weight="700" opacity="0.6">Iceland</text>

        <!-- Buenos Aires -->
        <circle cx="200" cy="375" r="4" fill="#991b1b" class="map-dot" style="animation-delay:2.7s"/>
        <text x="200" y="390" text-anchor="middle" fill="#92400e" font-size="7" font-weight="700" opacity="0.6">Buenos Aires</text>

        <!-- Patagonia -->
        <circle cx="190" cy="400" r="4" fill="#991b1b" class="map-dot" style="animation-delay:3s"/>
        <text x="190" y="413" text-anchor="middle" fill="#92400e" font-size="7" font-weight="700" opacity="0.6">Patagonia</text>

        <!-- Dashed travel lines connecting some dots -->
        <path d="M370 115 Q400 70 415 88" fill="none" stroke="#92400e" stroke-width="0.5" stroke-dasharray="3 3" opacity="0.2"/>
        <path d="M415 88 Q440 100 460 115" fill="none" stroke="#92400e" stroke-width="0.5" stroke-dasharray="3 3" opacity="0.2"/>
        <path d="M460 115 Q550 130 660 160" fill="none" stroke="#92400e" stroke-width="0.5" stroke-dasharray="3 3" opacity="0.2"/>
        <path d="M660 160 Q700 140 740 110" fill="none" stroke="#92400e" stroke-width="0.5" stroke-dasharray="3 3" opacity="0.2"/>
      </svg>
      <!-- Map legend -->
      <div class="flex items-center justify-center gap-6 mt-4 text-xs text-sepia/40">
        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-ocean"></span>Europe &amp; Asia</div>
        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-sand"></span>Southeast Asia</div>
        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-stamp"></span>Africa &amp; Americas</div>
      </div>
    </div>
  </div>
</section>

<!-- ========== TRAVEL TIPS ========== -->
<section id="tips" class="py-20">
  <div class="max-w-5xl mx-auto px-6">
    <div class="text-center mb-12 reveal">
      <h2 class="font-display text-3xl md:text-4xl text-sepia">Travel Wisdom</h2>
      <p class="text-sepia/40 text-sm mt-2 font-light">Hard-won lessons from the road</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">

      <!-- Tip 1: Packing -->
      <div class="tip-card bg-white rounded-2xl p-8 text-center border border-sepia/8 reveal">
        <div class="w-16 h-16 mx-auto mb-5 bg-sand/20 rounded-2xl flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="6" y="10" width="20" height="16" rx="3" stroke="#92400e" stroke-width="2" fill="none"/>
            <path d="M12 10V7a4 4 0 018 0v3" stroke="#92400e" stroke-width="2" fill="none"/>
            <line x1="6" y1="16" x2="26" y2="16" stroke="#92400e" stroke-width="1.5"/>
            <rect x="14" y="14" width="4" height="4" rx="1" fill="#92400e" opacity="0.3"/>
          </svg>
        </div>
        <h3 class="font-display text-xl text-sepia mb-3">Pack Light, Live Free</h3>
        <p class="text-sepia/50 text-sm leading-relaxed font-light">One carry-on for two weeks. Roll, don't fold. Leave room for souvenirs and spontaneity. Your back will thank you on cobblestone streets.</p>
      </div>

      <!-- Tip 2: Navigation -->
      <div class="tip-card bg-white rounded-2xl p-8 text-center border border-sepia/8 reveal" style="transition-delay:0.1s">
        <div class="w-16 h-16 mx-auto mb-5 bg-ocean/10 rounded-2xl flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="12" stroke="#0369a1" stroke-width="2" fill="none"/>
            <circle cx="16" cy="16" r="2" fill="#0369a1"/>
            <line x1="16" y1="6" x2="16" y2="12" stroke="#991b1b" stroke-width="2" stroke-linecap="round"/>
            <line x1="16" y1="20" x2="16" y2="26" stroke="#0369a1" stroke-width="2" stroke-linecap="round"/>
            <text x="16" y="5" text-anchor="middle" fill="#991b1b" font-size="4" font-weight="700">N</text>
            <text x="16" y="31" text-anchor="middle" fill="#0369a1" font-size="4" font-weight="700">S</text>
          </svg>
        </div>
        <h3 class="font-display text-xl text-sepia mb-3">Get Gloriously Lost</h3>
        <p class="text-sepia/50 text-sm leading-relaxed font-light">Download offline maps, then put the phone away. The best discoveries happen on wrong turns. Ask locals for directions--that's how stories begin.</p>
      </div>

      <!-- Tip 3: Photography -->
      <div class="tip-card bg-white rounded-2xl p-8 text-center border border-sepia/8 reveal" style="transition-delay:0.2s">
        <div class="w-16 h-16 mx-auto mb-5 bg-stamp/10 rounded-2xl flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="10" width="24" height="16" rx="3" stroke="#92400e" stroke-width="2" fill="none"/>
            <circle cx="16" cy="18" r="5" stroke="#92400e" stroke-width="2" fill="none"/>
            <circle cx="16" cy="18" r="2.5" fill="#92400e" opacity="0.2"/>
            <path d="M12 10L14 6h4l2 4" stroke="#92400e" stroke-width="1.5" fill="none"/>
            <circle cx="23" cy="14" r="1.5" fill="#92400e" opacity="0.4"/>
          </svg>
        </div>
        <h3 class="font-display text-xl text-sepia mb-3">Capture the In-Between</h3>
        <p class="text-sepia/50 text-sm leading-relaxed font-light">Forget the postcard shots. Photograph the hands kneading bread, the light in a doorway, the stray cat on ancient steps. Those are the real memories.</p>
      </div>
    </div>
  </div>
</section>

<!-- ========== NEWSLETTER ========== -->
<section class="py-20 relative overflow-hidden" style="background:linear-gradient(135deg,#92400e 0%,#b45309 40%,#0369a1 100%)">
  <!-- Decorative stamps on newsletter bg -->
  <div class="absolute inset-0 opacity-5" aria-hidden="true">
    <svg class="absolute top-4 left-8" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="35" fill="none" stroke="#fff" stroke-width="2"/><text x="40" y="44" text-anchor="middle" fill="#fff" font-size="10" class="stamp-text">WANDERLUST</text></svg>
    <svg class="absolute bottom-4 right-10" width="70" height="70" viewBox="0 0 70 70"><rect x="5" y="5" width="60" height="60" rx="3" fill="none" stroke="#fff" stroke-width="2"/><text x="35" y="40" text-anchor="middle" fill="#fff" font-size="9" class="stamp-text">TRAVEL</text></svg>
  </div>
  <div class="max-w-2xl mx-auto px-6 text-center relative z-10 reveal">
    <div class="inline-block mb-6">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="4" y="10" width="40" height="28" rx="4" stroke="white" stroke-width="2" fill="none"/>
        <path d="M4 14l20 14 20-14" stroke="white" stroke-width="2" fill="none"/>
        <circle cx="38" cy="12" r="6" fill="#d4a574"/>
        <path d="M35 12l2 2 4-4" stroke="white" stroke-width="1.5" fill="none"/>
      </svg>
    </div>
    <h2 class="font-display text-3xl md:text-4xl text-white mb-3">Join the Journey</h2>
    <p class="text-white/60 text-sm mb-8 font-light leading-relaxed">Biweekly dispatches from wherever I am. Honest stories, hidden gems, and the occasional misadventure. No spam, just stamps.</p>
    <div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input type="email" placeholder="your@email.com" class="flex-1 px-5 py-3.5 rounded-full text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sand bg-white/95">
      <button onclick="showToast('Welcome aboard! Check your inbox for a passport stamp.')" class="bg-sand text-sepia px-7 py-3.5 rounded-full text-sm font-black hover:bg-sand-light transition-colors cursor-pointer whitespace-nowrap tracking-wide">Subscribe</button>
    </div>
    <p class="text-white/30 text-[10px] mt-4">Join 3,200+ fellow wanderers. Unsubscribe anytime.</p>
  </div>
</section>

<!-- ========== FOOTER ========== -->
<footer id="about" class="bg-ink text-cream py-14">
  <div class="max-w-5xl mx-auto px-6">
    <div class="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
      <div class="text-center md:text-left">
        <div class="font-display text-2xl text-sand mb-1">Wanderlust Diaries</div>
        <div class="text-cream/30 text-sm font-light flex items-center gap-2 justify-center md:justify-start">
          Currently in: Lisbon
          <svg width="20" height="14" viewBox="0 0 20 14"><rect width="8" height="14" fill="#006600"/><rect x="8" width="12" height="14" fill="#FF0000"/><circle cx="8" cy="7" r="3" fill="#FFCC00" stroke="#006600" stroke-width="0.5"/></svg>
        </div>
      </div>
      <div class="flex items-center gap-5">
        <a href="#" class="w-10 h-10 rounded-full bg-cream/5 flex items-center justify-center hover:bg-ocean transition-colors cursor-pointer" aria-label="Instagram">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4a574" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="#d4a574" stroke="none"/></svg>
        </a>
        <a href="#" class="w-10 h-10 rounded-full bg-cream/5 flex items-center justify-center hover:bg-ocean transition-colors cursor-pointer" aria-label="YouTube">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4a574" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#d4a574" stroke="none"/></svg>
        </a>
        <a href="#" class="w-10 h-10 rounded-full bg-cream/5 flex items-center justify-center hover:bg-ocean transition-colors cursor-pointer" aria-label="Twitter">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4a574" stroke-width="2"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
        </a>
      </div>
    </div>
    <div class="border-t border-cream/8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-cream/25">
      <p>&copy; 2026 Wanderlust Diaries. All rights reserved.</p>
      <div class="flex gap-6">
        <span class="hover:text-sand transition-colors cursor-pointer">Privacy</span>
        <span class="hover:text-sand transition-colors cursor-pointer">Collaborate</span>
        <span class="hover:text-sand transition-colors cursor-pointer">RSS Feed</span>
      </div>
    </div>
  </div>
</footer>

<!-- Toast Notification -->
<div id="toast" class="fixed bottom-6 right-6 bg-sepia text-cream px-6 py-3.5 rounded-2xl shadow-2xl z-[60] translate-y-20 opacity-0 transition-all duration-500 text-sm font-bold max-w-xs"></div>

<script>
// Toast
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.remove('translate-y-20','opacity-0');
  setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3500);
}

// Filter postcards
function filterCards(region){
  document.querySelectorAll('.filter-btn').forEach(b=>{
    if(b.dataset.filter===region){b.classList.add('bg-sepia','text-cream');b.classList.remove('text-sepia/50')}
    else{b.classList.remove('bg-sepia','text-cream');b.classList.add('text-sepia/50')}
  });
  document.querySelectorAll('#postcardGrid article').forEach(card=>{
    if(region==='all'||card.dataset.region===region){card.style.display='';card.style.opacity='1'}
    else{card.style.display='none'}
  });
}

// Scroll reveal
const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}
  });
},{threshold:0.08,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

// Stamp hover interactivity (make stamps slightly interactive on scroll)
let stampAngle=0;
window.addEventListener('scroll',()=>{
  stampAngle=window.scrollY*0.02;
  document.querySelectorAll('.passport-stamp').forEach((s,i)=>{
    const baseRotation=parseFloat(s.style.transform.match(/rotate\(([-\d.]+)deg\)/)?.[1]||0);
    s.style.transform=s.style.transform.replace(/rotate\([-\d.]+deg\)/,`rotate(${baseRotation+Math.sin(stampAngle+i)*0.5}deg)`);
  });
},{passive:true});
</script>
</body>
</html>
$HTML$,
  3
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
