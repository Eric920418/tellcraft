INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'b50d94c8-8a29-4497-abfb-0979e99c3268',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Wanderlust - Discover the World</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        sepia: { 50:'#fefcf3', 100:'#fef3c7', 200:'#fde68a', 400:'#d4a24e', 500:'#b8860b', 600:'#92400e', 700:'#78350f', 800:'#5c2d0e', 900:'#451a03' },
        postcard: { cream:'#fef3c7', blue:'#1e40af', red:'#dc2626', ink:'#44403c' },
        vintage: { paper:'#fdf6e3', edge:'#d6c5a0', stamp:'#dc2626', airmail:'#1e40af' }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Lato"', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Lato', sans-serif; color: #44403c; background: #fdf6e3; }

  /* Reveal animations */
  .reveal { opacity:0; transform:translateY(30px); transition: all 0.9s cubic-bezier(0.22,1,0.36,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }

  /* Toast */
  .toast {
    position:fixed; bottom:2rem; right:2rem; background:#92400e; color:#fef3c7;
    padding:0.875rem 1.5rem; border-radius:8px; font-size:0.9rem; font-weight:700;
    z-index:9999; transform:translateY(120%); opacity:0;
    transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
    box-shadow: 0 8px 32px rgba(146,64,14,0.35);
    font-family: 'Lato', sans-serif;
    letter-spacing: 0.02em;
  }
  .toast.show { transform:translateY(0); opacity:1; }

  /* Stamp perforated border */
  .stamp-border {
    background: #fef3c7;
    filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.15));
    -webkit-mask-image: radial-gradient(circle at 4px 4px, transparent 3px, black 3.5px);
    -webkit-mask-size: 12px 12px;
    mask-image: radial-gradient(circle at 4px 4px, transparent 3px, black 3.5px);
    mask-size: 12px 12px;
  }

  /* Stamp appear animation */
  @keyframes stamp-appear {
    0% { transform: scale(1.8) rotate(-25deg); opacity:0; }
    60% { transform: scale(0.95) rotate(2deg); opacity:1; }
    80% { transform: scale(1.05) rotate(-1deg); }
    100% { transform: scale(1) rotate(0deg); opacity:1; }
  }
  .stamp-animate { animation: stamp-appear 0.8s cubic-bezier(0.22,1,0.36,1) forwards; }

  /* Postcard scattered rotation */
  .postcard-tilt-left { transform: rotate(-2deg); transition: transform 0.4s ease; }
  .postcard-tilt-left:hover { transform: rotate(0deg) translateY(-8px); }
  .postcard-tilt-right { transform: rotate(2deg); transition: transform 0.4s ease; }
  .postcard-tilt-right:hover { transform: rotate(0deg) translateY(-8px); }
  .postcard-tilt-center { transform: rotate(0.5deg); transition: transform 0.4s ease; }
  .postcard-tilt-center:hover { transform: rotate(0deg) translateY(-8px); }

  /* Airmail stripe */
  .airmail-stripe {
    background: repeating-linear-gradient(
      -45deg,
      #dc2626 0px, #dc2626 8px,
      #fef3c7 8px, #fef3c7 16px,
      #1e40af 16px, #1e40af 24px,
      #fef3c7 24px, #fef3c7 32px
    );
  }

  /* Handwriting style */
  .handwriting { font-family: 'Playfair Display', serif; font-style: italic; font-weight: 400; }

  /* Nav scroll */
  .nav-scrolled {
    background: rgba(253,246,227,0.97) !important;
    box-shadow: 0 2px 20px rgba(0,0,0,0.08);
    border-bottom: 1px solid #d6c5a0;
  }

  /* Experience horizontal scroll */
  .experience-scroll {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .experience-scroll::-webkit-scrollbar { display: none; }
  .experience-card { scroll-snap-align: start; }

  /* Full-bleed image overlay */
  .full-bleed-overlay {
    position: relative;
    overflow: hidden;
  }
  .full-bleed-overlay::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 60%;
    background: linear-gradient(to top, rgba(69,26,3,0.85) 0%, rgba(69,26,3,0.4) 50%, transparent 100%);
    pointer-events: none;
  }

  /* Dashed postcard border */
  .postcard-border {
    border: 2px dashed #d6c5a0;
    border-radius: 4px;
  }

  /* Date input styling */
  .travel-input::-webkit-calendar-picker-indicator { cursor: pointer; filter: sepia(1); }
  .travel-input::placeholder { color: #b8860b; opacity: 0.5; }
</style>
</head>
<body>

<div id="toast" class="toast"></div>

<!-- Navigation - Transparent on hero -->
<nav id="navbar" class="fixed top-0 w-full z-50 bg-transparent transition-all duration-500">
  <!-- Airmail stripe top -->
  <div class="airmail-stripe h-1"></div>
  <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
    <a href="#" class="flex items-center gap-3">
      <svg class="w-8 h-8 text-white nav-icon transition-colors duration-300" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="16" cy="16" r="14"/>
        <path d="M6 16 C6 10 10 6 16 6 C22 6 26 10 26 16"/>
        <path d="M4 16 H28"/>
        <path d="M16 4 C12 8 10 12 10 16 C10 20 12 24 16 28"/>
        <path d="M16 4 C20 8 22 12 22 16 C22 20 20 24 16 28"/>
      </svg>
      <div class="flex flex-col leading-none">
        <span class="font-display text-xl font-bold text-white nav-text transition-colors duration-300 tracking-wide">Wanderlust</span>
        <span class="text-[8px] tracking-[0.35em] text-white/50 nav-subtext transition-colors duration-300 uppercase font-body">Est. 1987</span>
      </div>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#destinations" class="text-sm font-medium text-white/80 hover:text-white nav-link transition-colors duration-300 font-body tracking-wide">Destinations</a>
      <a href="#experiences" class="text-sm font-medium text-white/80 hover:text-white nav-link transition-colors duration-300 font-body tracking-wide">Experiences</a>
      <a href="#stories" class="text-sm font-medium text-white/80 hover:text-white nav-link transition-colors duration-300 font-body tracking-wide">Stories</a>
      <a href="#book" class="text-sm font-medium text-white/80 hover:text-white nav-link transition-colors duration-300 font-body tracking-wide">Book</a>
      <button onclick="scrollToEl('book')" class="bg-postcard-red hover:bg-red-700 text-white px-5 py-2.5 rounded text-sm font-bold transition-all cursor-pointer font-body tracking-wider uppercase border-2 border-postcard-red hover:border-red-700">
        Plan Your Trip
      </button>
    </div>
    <button onclick="toggleMobile()" class="md:hidden w-10 h-10 flex items-center justify-center rounded hover:bg-white/10 cursor-pointer">
      <svg class="w-6 h-6 text-white nav-icon transition-colors duration-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div id="mobileMenu" class="hidden md:hidden bg-vintage-paper border-t border-vintage-edge px-6 pb-6">
    <div class="flex flex-col gap-1 pt-4">
      <a href="#destinations" onclick="closeMobile()" class="py-3 text-sepia-700 font-medium font-body">Destinations</a>
      <a href="#experiences" onclick="closeMobile()" class="py-3 text-sepia-700 font-medium font-body">Experiences</a>
      <a href="#stories" onclick="closeMobile()" class="py-3 text-sepia-700 font-medium font-body">Stories</a>
      <a href="#book" onclick="closeMobile()" class="py-3 text-sepia-700 font-medium font-body">Book</a>
      <button onclick="scrollToEl('book');closeMobile()" class="mt-2 bg-postcard-red text-white py-3 rounded font-bold cursor-pointer uppercase tracking-wider text-sm font-body">Plan Your Trip</button>
    </div>
  </div>
</nav>

<!-- Hero Section - Full-width warm gradient with postage stamp -->
<section class="relative h-screen flex items-end overflow-hidden">
  <!-- Full-bleed warm background -->
  <div class="absolute inset-0 bg-gradient-to-br from-sepia-600 via-sepia-700 to-sepia-900"></div>
  <!-- Vintage texture overlay -->
  <div class="absolute inset-0 opacity-[0.08]" style="background-image: url('data:image/svg+xml,%3Csvg width=%22200%22 height=%22200%22 viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.5%22/%3E%3C/svg%3E');"></div>
  <!-- Warm light leak from top -->
  <div class="absolute inset-0 bg-gradient-to-b from-amber-300/10 via-transparent to-sepia-900/60"></div>

  <!-- Postage stamp decoration - top right -->
  <div id="heroStamp" class="absolute top-28 right-8 md:right-16 opacity-0 z-10">
    <div class="stamp-border p-1">
      <div class="bg-vintage-paper border border-vintage-edge p-3 md:p-4 text-center" style="min-width:90px;">
        <div class="text-[8px] uppercase tracking-[0.2em] text-sepia-600 font-body font-bold mb-1">Wanderlust</div>
        <div class="text-2xl md:text-3xl font-display font-bold text-sepia-800 leading-none">2026</div>
        <div class="w-full h-px bg-sepia-400/40 my-1.5"></div>
        <div class="text-[7px] uppercase tracking-widest text-postcard-red font-body font-bold">First Class</div>
        <svg class="w-full mt-1" height="6" viewBox="0 0 60 6"><line x1="0" y1="3" x2="60" y2="3" stroke="#92400e" stroke-width="1" stroke-dasharray="1 2"/></svg>
      </div>
    </div>
  </div>

  <!-- Second decorative stamp - left side (desktop only) -->
  <div class="hidden lg:block absolute top-40 left-12 opacity-0" id="heroStamp2" style="animation-delay: 0.3s;">
    <div class="stamp-border p-1" style="transform: rotate(-8deg);">
      <div class="bg-vintage-paper border border-vintage-edge p-2 text-center" style="min-width:70px;">
        <svg class="w-8 h-8 mx-auto text-postcard-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
          <path d="M2 12h20M12 2c3 3.6 3 16.4 0 20M12 2c-3 3.6-3 16.4 0 20"/>
        </svg>
        <div class="text-[6px] uppercase tracking-widest text-sepia-600 font-body font-bold mt-1">Par Avion</div>
      </div>
    </div>
  </div>

  <div class="relative z-10 w-full px-6 pb-20 md:pb-28 max-w-6xl mx-auto">
    <div class="inline-flex items-center gap-2 mb-6">
      <div class="airmail-stripe h-0.5 w-12"></div>
      <span class="text-xs tracking-[0.3em] uppercase text-postcard-cream/70 font-body font-bold">Since 1987 - Curated Journeys</span>
      <div class="airmail-stripe h-0.5 w-12"></div>
    </div>
    <h1 class="font-display text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-postcard-cream leading-[0.9] mb-6">
      Discover<br>the World
    </h1>
    <p class="handwriting text-xl md:text-2xl lg:text-3xl text-amber-200/80 mb-4 max-w-xl">
      "Every journey begins with a single postcard..."
    </p>
    <p class="font-body text-sm md:text-base text-postcard-cream/50 max-w-lg mb-10 leading-relaxed">
      Handcrafted itineraries to the world's most captivating destinations.
      Travel not just to see, but to feel, taste, and remember.
    </p>
    <div class="flex flex-wrap gap-4">
      <button onclick="scrollToEl('destinations')" class="bg-postcard-cream text-sepia-800 px-8 py-4 rounded font-body font-bold text-sm tracking-wider uppercase transition-all hover:shadow-xl hover:bg-white cursor-pointer">
        Explore Destinations
      </button>
      <button onclick="scrollToEl('stories')" class="border-2 border-postcard-cream/30 text-postcard-cream px-8 py-4 rounded font-body font-bold text-sm tracking-wider uppercase hover:bg-postcard-cream/10 transition-all cursor-pointer">
        Read Stories
      </button>
    </div>
  </div>

  <!-- Bottom postcard edge decoration -->
  <div class="absolute bottom-0 left-0 right-0">
    <svg class="w-full" height="24" preserveAspectRatio="none" viewBox="0 0 1440 24">
      <path d="M0 24 L0 12 Q10 0 20 12 Q30 24 40 12 Q50 0 60 12 Q70 24 80 12 Q90 0 100 12 Q110 24 120 12 Q130 0 140 12 Q150 24 160 12 Q170 0 180 12 Q190 24 200 12 Q210 0 220 12 Q230 24 240 12 Q250 0 260 12 Q270 24 280 12 Q290 0 300 12 Q310 24 320 12 Q330 0 340 12 Q350 24 360 12 Q370 0 380 12 Q390 24 400 12 Q410 0 420 12 Q430 24 440 12 Q450 0 460 12 Q470 24 480 12 Q490 0 500 12 Q510 24 520 12 Q530 0 540 12 Q550 24 560 12 Q570 0 580 12 Q590 24 600 12 Q610 0 620 12 Q630 24 640 12 Q650 0 660 12 Q670 24 680 12 Q690 0 700 12 Q710 24 720 12 Q730 0 740 12 Q750 24 760 12 Q770 0 780 12 Q790 24 800 12 Q810 0 820 12 Q830 24 840 12 Q850 0 860 12 Q870 24 880 12 Q890 0 900 12 Q910 24 920 12 Q930 0 940 12 Q950 24 960 12 Q970 0 980 12 Q990 24 1000 12 Q1010 0 1020 12 Q1030 24 1040 12 Q1050 0 1060 12 Q1070 24 1080 12 Q1090 0 1100 12 Q1110 24 1120 12 Q1130 0 1140 12 Q1150 24 1160 12 Q1170 0 1180 12 Q1190 24 1200 12 Q1210 0 1220 12 Q1230 24 1240 12 Q1250 0 1260 12 Q1270 24 1280 12 Q1290 0 1300 12 Q1310 24 1320 12 Q1330 0 1340 12 Q1350 24 1360 12 Q1370 0 1380 12 Q1390 24 1400 12 Q1410 0 1420 12 Q1430 24 1440 12 L1440 24Z" fill="#fdf6e3"/>
    </svg>
  </div>
</section>

<!-- Destinations Section - Scattered postcard cards -->
<section id="destinations" class="py-24 bg-vintage-paper">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-6 reveal">
      <div class="inline-flex items-center gap-3 mb-4">
        <div class="airmail-stripe h-0.5 w-16"></div>
        <span class="text-xs tracking-[0.3em] uppercase text-sepia-600 font-body font-bold">Featured Destinations</span>
        <div class="airmail-stripe h-0.5 w-16"></div>
      </div>
      <h2 class="font-display text-4xl lg:text-6xl font-bold text-sepia-800">Postcards From Afar</h2>
      <p class="font-body text-sepia-600/60 mt-4 max-w-2xl mx-auto">Each destination chosen for its soul, not just its scenery. These are places that change you.</p>
    </div>

    <div class="grid md:grid-cols-3 gap-10 md:gap-8 mt-16">
      <!-- Destination 1 - Kyoto -->
      <div class="reveal postcard-tilt-left cursor-pointer" onclick="showToast('Exploring Kyoto - View full itinerary')">
        <div class="full-bleed-overlay rounded-sm shadow-lg" style="border: 3px solid #d6c5a0;">
          <div class="aspect-[3/4] bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 flex items-center justify-center relative">
            <div class="text-center z-10 relative">
              <div class="text-8xl mb-2">&#x26E9;</div>
              <p class="text-sepia-700/40 text-xs font-body">Temples & Gardens</p>
            </div>
            <!-- Stamp icon top right -->
            <div class="absolute top-3 right-3 z-20">
              <div class="stamp-border p-0.5">
                <div class="bg-vintage-paper px-2 py-1 text-center">
                  <span class="text-[6px] font-body font-bold text-postcard-red uppercase tracking-wider">Kyoto</span>
                  <div class="text-xs font-display font-bold text-sepia-800">JP</div>
                </div>
              </div>
            </div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 p-6 z-10">
            <span class="text-postcard-cream/50 text-xs font-body uppercase tracking-widest">Japan</span>
            <h3 class="font-display text-2xl font-bold text-postcard-cream mt-1">Kyoto</h3>
            <p class="text-postcard-cream/70 text-sm font-body mt-1">Ancient temples, bamboo forests & the art of slow living</p>
            <div class="mt-3 flex items-center gap-2">
              <span class="text-[10px] bg-postcard-cream/20 text-postcard-cream px-2 py-0.5 rounded-sm font-body">7 days</span>
              <span class="text-[10px] bg-postcard-cream/20 text-postcard-cream px-2 py-0.5 rounded-sm font-body">From $2,400</span>
            </div>
          </div>
        </div>
        <div class="mt-3 text-right">
          <span class="handwriting text-sm text-sepia-500">"Wish you were here..."</span>
        </div>
      </div>

      <!-- Destination 2 - Marrakech -->
      <div class="reveal postcard-tilt-center cursor-pointer" style="transition-delay: 0.15s;" onclick="showToast('Exploring Marrakech - View full itinerary')">
        <div class="full-bleed-overlay rounded-sm shadow-lg" style="border: 3px solid #d6c5a0;">
          <div class="aspect-[3/4] bg-gradient-to-br from-orange-300 via-red-200 to-amber-200 flex items-center justify-center relative">
            <div class="text-center z-10 relative">
              <div class="text-8xl mb-2">&#x2736;</div>
              <p class="text-sepia-700/40 text-xs font-body">Souks & Spices</p>
            </div>
            <div class="absolute top-3 right-3 z-20">
              <div class="stamp-border p-0.5">
                <div class="bg-vintage-paper px-2 py-1 text-center">
                  <span class="text-[6px] font-body font-bold text-postcard-red uppercase tracking-wider">Marrakech</span>
                  <div class="text-xs font-display font-bold text-sepia-800">MA</div>
                </div>
              </div>
            </div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 p-6 z-10">
            <span class="text-postcard-cream/50 text-xs font-body uppercase tracking-widest">Morocco</span>
            <h3 class="font-display text-2xl font-bold text-postcard-cream mt-1">Marrakech</h3>
            <p class="text-postcard-cream/70 text-sm font-body mt-1">Vibrant souks, riad courtyards & Saharan sunsets</p>
            <div class="mt-3 flex items-center gap-2">
              <span class="text-[10px] bg-postcard-cream/20 text-postcard-cream px-2 py-0.5 rounded-sm font-body">5 days</span>
              <span class="text-[10px] bg-postcard-cream/20 text-postcard-cream px-2 py-0.5 rounded-sm font-body">From $1,800</span>
            </div>
          </div>
        </div>
        <div class="mt-3 text-right">
          <span class="handwriting text-sm text-sepia-500">"The colors here are unreal..."</span>
        </div>
      </div>

      <!-- Destination 3 - Amalfi -->
      <div class="reveal postcard-tilt-right cursor-pointer" style="transition-delay: 0.3s;" onclick="showToast('Exploring Amalfi Coast - View full itinerary')">
        <div class="full-bleed-overlay rounded-sm shadow-lg" style="border: 3px solid #d6c5a0;">
          <div class="aspect-[3/4] bg-gradient-to-br from-sky-200 via-blue-200 to-amber-100 flex items-center justify-center relative">
            <div class="text-center z-10 relative">
              <div class="text-8xl mb-2">&#x2693;</div>
              <p class="text-sepia-700/40 text-xs font-body">Coast & Cuisine</p>
            </div>
            <div class="absolute top-3 right-3 z-20">
              <div class="stamp-border p-0.5">
                <div class="bg-vintage-paper px-2 py-1 text-center">
                  <span class="text-[6px] font-body font-bold text-postcard-red uppercase tracking-wider">Amalfi</span>
                  <div class="text-xs font-display font-bold text-sepia-800">IT</div>
                </div>
              </div>
            </div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 p-6 z-10">
            <span class="text-postcard-cream/50 text-xs font-body uppercase tracking-widest">Italy</span>
            <h3 class="font-display text-2xl font-bold text-postcard-cream mt-1">Amalfi Coast</h3>
            <p class="text-postcard-cream/70 text-sm font-body mt-1">Cliffside villages, limoncello & Mediterranean blues</p>
            <div class="mt-3 flex items-center gap-2">
              <span class="text-[10px] bg-postcard-cream/20 text-postcard-cream px-2 py-0.5 rounded-sm font-body">6 days</span>
              <span class="text-[10px] bg-postcard-cream/20 text-postcard-cream px-2 py-0.5 rounded-sm font-body">From $3,200</span>
            </div>
          </div>
        </div>
        <div class="mt-3 text-right">
          <span class="handwriting text-sm text-sepia-500">"La dolce vita, indeed."</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Experience Section - Horizontal scroll with postcard borders -->
<section id="experiences" class="py-24 bg-sepia-600 relative overflow-hidden">
  <!-- Texture overlay -->
  <div class="absolute inset-0 opacity-[0.04]" style="background-image: url('data:image/svg+xml,%3Csvg width=%22200%22 height=%22200%22 viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.5%22/%3E%3C/svg%3E');"></div>

  <div class="relative z-10">
    <div class="max-w-7xl mx-auto px-6 mb-12 reveal">
      <div class="flex items-end justify-between">
        <div>
          <div class="inline-flex items-center gap-3 mb-4">
            <div class="airmail-stripe h-0.5 w-12"></div>
            <span class="text-xs tracking-[0.3em] uppercase text-postcard-cream/50 font-body font-bold">Travel Styles</span>
          </div>
          <h2 class="font-display text-4xl lg:text-5xl font-bold text-postcard-cream">Choose Your Experience</h2>
        </div>
        <div class="hidden md:flex gap-2">
          <button onclick="scrollExp(-1)" class="w-10 h-10 border border-postcard-cream/30 rounded flex items-center justify-center text-postcard-cream hover:bg-postcard-cream/10 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button onclick="scrollExp(1)" class="w-10 h-10 border border-postcard-cream/30 rounded flex items-center justify-center text-postcard-cream hover:bg-postcard-cream/10 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div id="expScroll" class="experience-scroll flex gap-6 px-6 md:px-12 pb-4 reveal">
      <!-- Culture -->
      <div class="experience-card flex-shrink-0 w-72 md:w-80 cursor-pointer" onclick="showToast('Cultural immersion trips - 12 itineraries available')">
        <div class="postcard-border bg-vintage-paper p-5 h-full">
          <div class="aspect-[4/3] bg-gradient-to-br from-amber-100 to-orange-100 rounded-sm mb-4 flex items-center justify-center relative overflow-hidden">
            <div class="text-6xl">&#x1F3DB;</div>
            <!-- Corner stamp -->
            <div class="absolute bottom-2 right-2 w-8 h-8 border border-dashed border-sepia-400/40 rounded-sm flex items-center justify-center">
              <span class="text-[6px] font-body font-bold text-sepia-500">01</span>
            </div>
          </div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 bg-postcard-red rounded-full"></div>
            <span class="text-[10px] uppercase tracking-[0.2em] text-sepia-600 font-body font-bold">Culture</span>
          </div>
          <h3 class="font-display text-xl font-bold text-sepia-800 mb-2">Cultural Immersion</h3>
          <p class="text-sepia-600/60 text-sm font-body leading-relaxed mb-4">Local workshops, traditional ceremonies & artisan encounters that connect you to the heartbeat of a place.</p>
          <div class="flex items-center justify-between border-t border-dashed border-vintage-edge pt-3">
            <span class="text-xs text-sepia-500 font-body">12 journeys</span>
            <span class="text-xs text-postcard-blue font-body font-bold">Explore &rarr;</span>
          </div>
        </div>
      </div>

      <!-- Adventure -->
      <div class="experience-card flex-shrink-0 w-72 md:w-80 cursor-pointer" onclick="showToast('Adventure trips - 8 itineraries available')">
        <div class="postcard-border bg-vintage-paper p-5 h-full">
          <div class="aspect-[4/3] bg-gradient-to-br from-emerald-100 to-teal-100 rounded-sm mb-4 flex items-center justify-center relative overflow-hidden">
            <div class="text-6xl">&#x26F0;</div>
            <div class="absolute bottom-2 right-2 w-8 h-8 border border-dashed border-sepia-400/40 rounded-sm flex items-center justify-center">
              <span class="text-[6px] font-body font-bold text-sepia-500">02</span>
            </div>
          </div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 bg-emerald-600 rounded-full"></div>
            <span class="text-[10px] uppercase tracking-[0.2em] text-sepia-600 font-body font-bold">Adventure</span>
          </div>
          <h3 class="font-display text-xl font-bold text-sepia-800 mb-2">Wild Adventures</h3>
          <p class="text-sepia-600/60 text-sm font-body leading-relaxed mb-4">Summit treks, jungle expeditions & ocean crossings for those who seek the thrill of the unknown.</p>
          <div class="flex items-center justify-between border-t border-dashed border-vintage-edge pt-3">
            <span class="text-xs text-sepia-500 font-body">8 journeys</span>
            <span class="text-xs text-postcard-blue font-body font-bold">Explore &rarr;</span>
          </div>
        </div>
      </div>

      <!-- Culinary -->
      <div class="experience-card flex-shrink-0 w-72 md:w-80 cursor-pointer" onclick="showToast('Culinary journeys - 10 itineraries available')">
        <div class="postcard-border bg-vintage-paper p-5 h-full">
          <div class="aspect-[4/3] bg-gradient-to-br from-rose-100 to-amber-100 rounded-sm mb-4 flex items-center justify-center relative overflow-hidden">
            <div class="text-6xl">&#x1F372;</div>
            <div class="absolute bottom-2 right-2 w-8 h-8 border border-dashed border-sepia-400/40 rounded-sm flex items-center justify-center">
              <span class="text-[6px] font-body font-bold text-sepia-500">03</span>
            </div>
          </div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span class="text-[10px] uppercase tracking-[0.2em] text-sepia-600 font-body font-bold">Culinary</span>
          </div>
          <h3 class="font-display text-xl font-bold text-sepia-800 mb-2">Culinary Journeys</h3>
          <p class="text-sepia-600/60 text-sm font-body leading-relaxed mb-4">Market foraging, cooking classes & wine trails that reveal a culture through its flavors.</p>
          <div class="flex items-center justify-between border-t border-dashed border-vintage-edge pt-3">
            <span class="text-xs text-sepia-500 font-body">10 journeys</span>
            <span class="text-xs text-postcard-blue font-body font-bold">Explore &rarr;</span>
          </div>
        </div>
      </div>

      <!-- Relaxation -->
      <div class="experience-card flex-shrink-0 w-72 md:w-80 cursor-pointer" onclick="showToast('Relaxation retreats - 9 itineraries available')">
        <div class="postcard-border bg-vintage-paper p-5 h-full">
          <div class="aspect-[4/3] bg-gradient-to-br from-sky-100 to-indigo-100 rounded-sm mb-4 flex items-center justify-center relative overflow-hidden">
            <div class="text-6xl">&#x1F3D6;</div>
            <div class="absolute bottom-2 right-2 w-8 h-8 border border-dashed border-sepia-400/40 rounded-sm flex items-center justify-center">
              <span class="text-[6px] font-body font-bold text-sepia-500">04</span>
            </div>
          </div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 bg-postcard-blue rounded-full"></div>
            <span class="text-[10px] uppercase tracking-[0.2em] text-sepia-600 font-body font-bold">Relaxation</span>
          </div>
          <h3 class="font-display text-xl font-bold text-sepia-800 mb-2">Serene Retreats</h3>
          <p class="text-sepia-600/60 text-sm font-body leading-relaxed mb-4">Coastal villas, mountain spas & island escapes designed for deep rest and renewal.</p>
          <div class="flex items-center justify-between border-t border-dashed border-vintage-edge pt-3">
            <span class="text-xs text-sepia-500 font-body">9 journeys</span>
            <span class="text-xs text-postcard-blue font-body font-bold">Explore &rarr;</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonial Section - Large quote with AIRMAIL stamp -->
<section id="stories" class="py-28 bg-vintage-paper relative overflow-hidden">
  <!-- Faint postcard lines background -->
  <div class="absolute inset-0 opacity-[0.03]" style="background-image: repeating-linear-gradient(0deg, #92400e 0px, #92400e 1px, transparent 1px, transparent 28px); background-size: 100% 28px;"></div>

  <div class="max-w-5xl mx-auto px-6 relative">
    <!-- AIRMAIL stamp decoration - top left -->
    <div class="absolute -top-4 -left-2 md:left-8 z-20 reveal">
      <div class="airmail-stripe py-1.5 px-4 md:px-6" style="transform: rotate(-6deg);">
        <span class="text-white font-body font-black text-xs md:text-sm tracking-[0.3em] uppercase" style="mix-blend-mode: normal; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">&#9993; Par Avion - Airmail</span>
      </div>
    </div>

    <!-- AIRMAIL stamp decoration - bottom right -->
    <div class="absolute -bottom-2 right-4 md:right-12 z-20 reveal">
      <div style="transform: rotate(4deg);">
        <div class="stamp-border p-1">
          <div class="bg-postcard-red px-3 py-2 text-center">
            <span class="text-white font-body font-black text-xs tracking-[0.2em] uppercase">Airmail</span>
            <div class="text-white/70 text-[7px] font-body mt-0.5">Express Delivery</div>
          </div>
        </div>
      </div>
    </div>

    <div class="reveal">
      <div class="postcard-border bg-white/60 p-8 md:p-14 relative">
        <!-- Postcard ruled lines (faint) -->
        <div class="absolute top-0 right-0 w-1/3 h-full hidden md:block opacity-[0.06]" style="background-image: repeating-linear-gradient(0deg, #92400e 0px, #92400e 1px, transparent 1px, transparent 32px); background-size: 100% 32px; background-position: 0 80px;"></div>

        <div class="relative z-10">
          <svg class="w-12 h-12 text-sepia-400/30 mb-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/>
          </svg>
          <blockquote class="font-display text-2xl md:text-3xl lg:text-4xl font-medium text-sepia-800 leading-relaxed mb-8">
            We arrived in Kyoto as tourists and left as something else entirely. The tea ceremony at dawn, the silence of the bamboo grove, the kindness of strangers who became friends &mdash; Wanderlust didn't just plan a trip, they opened a door to a different way of seeing the world.
          </blockquote>
          <div class="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 bg-gradient-to-br from-sepia-200 to-sepia-100 rounded-full flex items-center justify-center border-2 border-vintage-edge">
                <span class="font-display text-xl font-bold text-sepia-700">E.H.</span>
              </div>
              <div>
                <div class="font-body font-bold text-sepia-800">Eleanor & Hugo Ashworth</div>
                <div class="text-sm text-sepia-600/60 font-body">Kyoto Cultural Immersion, Spring 2025</div>
              </div>
            </div>
            <div class="md:ml-auto flex gap-1 text-amber-500">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section - Start Your Journey -->
<section id="book" class="py-24 relative overflow-hidden" style="background: linear-gradient(135deg, #92400e 0%, #78350f 40%, #5c2d0e 100%);">
  <!-- Vintage paper texture -->
  <div class="absolute inset-0 opacity-[0.05]" style="background-image: url('data:image/svg+xml,%3Csvg width=%22200%22 height=%22200%22 viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.5%22/%3E%3C/svg%3E');"></div>
  <!-- Compass rose decoration -->
  <div class="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 opacity-[0.04]">
    <svg width="500" height="500" viewBox="0 0 100 100" fill="none" stroke="#fef3c7" stroke-width="0.5">
      <circle cx="50" cy="50" r="45"/>
      <circle cx="50" cy="50" r="30"/>
      <circle cx="50" cy="50" r="15"/>
      <line x1="50" y1="2" x2="50" y2="98"/>
      <line x1="2" y1="50" x2="98" y2="50"/>
      <line x1="15" y1="15" x2="85" y2="85"/>
      <line x1="85" y1="15" x2="15" y2="85"/>
      <polygon points="50,5 53,20 50,15 47,20" fill="#fef3c7"/>
      <text x="50" y="4" text-anchor="middle" fill="#fef3c7" font-size="5" font-family="serif">N</text>
    </svg>
  </div>

  <div class="relative z-10 max-w-4xl mx-auto px-6">
    <div class="text-center mb-12 reveal">
      <div class="inline-flex items-center gap-3 mb-6">
        <div class="airmail-stripe h-0.5 w-12"></div>
        <span class="text-xs tracking-[0.3em] uppercase text-postcard-cream/40 font-body font-bold">Begin Your Adventure</span>
        <div class="airmail-stripe h-0.5 w-12"></div>
      </div>
      <h2 class="font-display text-4xl lg:text-6xl font-bold text-postcard-cream leading-tight">Start Your Journey</h2>
      <p class="handwriting text-xl text-amber-200/60 mt-4">"The world is a book, and those who do not travel read only one page."</p>
    </div>

    <form id="tripForm" onsubmit="return handleTrip(event)" class="reveal">
      <div class="postcard-border bg-white/10 backdrop-blur-sm p-8 md:p-10">
        <!-- Airmail top border -->
        <div class="airmail-stripe h-1 -mt-8 md:-mt-10 -mx-8 md:-mx-10 mb-8 rounded-t"></div>

        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label class="block text-sm font-body font-bold text-postcard-cream/80 mb-2 uppercase tracking-wider">Departure Date</label>
            <input type="date" id="tDepart" required class="travel-input w-full px-4 py-3.5 rounded bg-white/10 border border-postcard-cream/20 text-postcard-cream focus:border-postcard-cream/60 focus:ring-2 focus:ring-postcard-cream/10 outline-none text-sm font-body transition-all">
          </div>
          <div>
            <label class="block text-sm font-body font-bold text-postcard-cream/80 mb-2 uppercase tracking-wider">Return Date</label>
            <input type="date" id="tReturn" required class="travel-input w-full px-4 py-3.5 rounded bg-white/10 border border-postcard-cream/20 text-postcard-cream focus:border-postcard-cream/60 focus:ring-2 focus:ring-postcard-cream/10 outline-none text-sm font-body transition-all">
          </div>
        </div>
        <div class="grid md:grid-cols-3 gap-6 mb-6">
          <div>
            <label class="block text-sm font-body font-bold text-postcard-cream/80 mb-2 uppercase tracking-wider">Destination</label>
            <select id="tDest" required class="w-full px-4 py-3.5 rounded bg-white/10 border border-postcard-cream/20 text-postcard-cream focus:border-postcard-cream/60 outline-none text-sm font-body transition-all cursor-pointer">
              <option value="" class="text-sepia-800">Select destination</option>
              <option value="kyoto" class="text-sepia-800">Kyoto, Japan</option>
              <option value="marrakech" class="text-sepia-800">Marrakech, Morocco</option>
              <option value="amalfi" class="text-sepia-800">Amalfi Coast, Italy</option>
              <option value="patagonia" class="text-sepia-800">Patagonia, Argentina</option>
              <option value="bali" class="text-sepia-800">Bali, Indonesia</option>
              <option value="custom" class="text-sepia-800">Custom Itinerary</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-body font-bold text-postcard-cream/80 mb-2 uppercase tracking-wider">Travelers</label>
            <select id="tTravelers" required class="w-full px-4 py-3.5 rounded bg-white/10 border border-postcard-cream/20 text-postcard-cream focus:border-postcard-cream/60 outline-none text-sm font-body transition-all cursor-pointer">
              <option value="1" class="text-sepia-800">1 Traveler</option>
              <option value="2" selected class="text-sepia-800">2 Travelers</option>
              <option value="3" class="text-sepia-800">3 Travelers</option>
              <option value="4" class="text-sepia-800">4 Travelers</option>
              <option value="5+" class="text-sepia-800">5+ Group</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-body font-bold text-postcard-cream/80 mb-2 uppercase tracking-wider">Style</label>
            <select id="tStyle" class="w-full px-4 py-3.5 rounded bg-white/10 border border-postcard-cream/20 text-postcard-cream focus:border-postcard-cream/60 outline-none text-sm font-body transition-all cursor-pointer">
              <option value="culture" class="text-sepia-800">Cultural Immersion</option>
              <option value="adventure" class="text-sepia-800">Wild Adventure</option>
              <option value="culinary" class="text-sepia-800">Culinary Journey</option>
              <option value="relaxation" class="text-sepia-800">Serene Retreat</option>
            </select>
          </div>
        </div>
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label class="block text-sm font-body font-bold text-postcard-cream/80 mb-2 uppercase tracking-wider">Your Name</label>
            <input type="text" id="tName" required placeholder="Full name" class="travel-input w-full px-4 py-3.5 rounded bg-white/10 border border-postcard-cream/20 text-postcard-cream placeholder-postcard-cream/30 focus:border-postcard-cream/60 focus:ring-2 focus:ring-postcard-cream/10 outline-none text-sm font-body transition-all">
          </div>
          <div>
            <label class="block text-sm font-body font-bold text-postcard-cream/80 mb-2 uppercase tracking-wider">Email</label>
            <input type="email" id="tEmail" required placeholder="your@email.com" class="travel-input w-full px-4 py-3.5 rounded bg-white/10 border border-postcard-cream/20 text-postcard-cream placeholder-postcard-cream/30 focus:border-postcard-cream/60 focus:ring-2 focus:ring-postcard-cream/10 outline-none text-sm font-body transition-all">
          </div>
        </div>
        <div class="mb-8">
          <label class="block text-sm font-body font-bold text-postcard-cream/80 mb-2 uppercase tracking-wider">Special Requests</label>
          <textarea id="tNotes" rows="3" placeholder="Dietary needs, accessibility requirements, special occasions..." class="travel-input w-full px-4 py-3.5 rounded bg-white/10 border border-postcard-cream/20 text-postcard-cream placeholder-postcard-cream/30 focus:border-postcard-cream/60 focus:ring-2 focus:ring-postcard-cream/10 outline-none text-sm font-body transition-all resize-none"></textarea>
        </div>
        <button type="submit" class="w-full bg-postcard-cream text-sepia-800 py-4 rounded font-body font-bold text-lg tracking-wider uppercase transition-all hover:bg-white hover:shadow-xl cursor-pointer">
          Request Your Itinerary
        </button>

        <!-- Airmail bottom border -->
        <div class="airmail-stripe h-1 -mb-8 md:-mb-10 -mx-8 md:-mx-10 mt-8 rounded-b"></div>
      </div>
    </form>

    <p class="text-center text-xs text-postcard-cream/30 mt-6 font-body">A personal travel consultant will craft your bespoke itinerary within 48 hours. No obligation.</p>
  </div>
</section>

<!-- Footer - Map style with travel icons -->
<footer class="bg-sepia-900 text-postcard-cream pt-16 pb-8 relative overflow-hidden">
  <!-- Map grid decoration -->
  <div class="absolute inset-0 opacity-[0.03]">
    <svg width="100%" height="100%">
      <defs>
        <pattern id="mapGrid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="60" y2="0" stroke="#fef3c7" stroke-width="0.5"/>
          <line x1="0" y1="0" x2="0" y2="60" stroke="#fef3c7" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mapGrid)"/>
    </svg>
  </div>

  <!-- Latitude/longitude markings -->
  <div class="absolute top-4 left-6 text-[8px] text-postcard-cream/10 font-body tracking-widest">40.7128&deg; N, 74.0060&deg; W</div>
  <div class="absolute top-4 right-6 text-[8px] text-postcard-cream/10 font-body tracking-widest">35.6762&deg; N, 139.6503&deg; E</div>

  <div class="relative z-10 max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-4 gap-10 pb-12 border-b border-postcard-cream/10">
      <div class="md:col-span-2">
        <div class="flex items-center gap-3 mb-4">
          <svg class="w-8 h-8 text-postcard-cream/60" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="16" cy="16" r="14"/>
            <path d="M6 16 C6 10 10 6 16 6 C22 6 26 10 26 16"/>
            <path d="M4 16 H28"/>
            <path d="M16 4 C12 8 10 12 10 16 C10 20 12 24 16 28"/>
            <path d="M16 4 C20 8 22 12 22 16 C22 20 20 24 16 28"/>
          </svg>
          <div>
            <span class="font-display text-2xl font-bold">Wanderlust</span>
            <span class="text-[8px] text-postcard-cream/30 block tracking-[0.35em] uppercase font-body">Curated Journeys Since 1987</span>
          </div>
        </div>
        <p class="text-postcard-cream/40 text-sm font-body leading-relaxed max-w-sm mb-6">
          Every stamp in your passport tells a story. We've been helping travelers write theirs for over three decades.
        </p>
        <!-- Travel icons row -->
        <div class="flex gap-4 text-postcard-cream/20">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M2 12h20"/><path d="M12 2c3 3.6 3 16.4 0 20M12 2c-3 3.6-3 16.4 0 20"/></svg>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/><path d="M14 2v6h6"/></svg>
        </div>
      </div>
      <div>
        <h4 class="font-body font-bold text-sm uppercase tracking-wider mb-4">Explore</h4>
        <div class="flex flex-col gap-3 text-postcard-cream/40 text-sm font-body">
          <a href="#destinations" class="hover:text-postcard-cream transition-colors cursor-pointer">Destinations</a>
          <a href="#experiences" class="hover:text-postcard-cream transition-colors cursor-pointer">Experiences</a>
          <a href="#stories" class="hover:text-postcard-cream transition-colors cursor-pointer">Travel Stories</a>
          <a href="#book" class="hover:text-postcard-cream transition-colors cursor-pointer">Plan a Trip</a>
          <a href="#" class="hover:text-postcard-cream transition-colors cursor-pointer" onclick="showToast('Gift cards coming soon!')">Gift Cards</a>
        </div>
      </div>
      <div>
        <h4 class="font-body font-bold text-sm uppercase tracking-wider mb-4">Connect</h4>
        <div class="flex flex-col gap-3 text-postcard-cream/40 text-sm font-body">
          <a href="#" onclick="showToast('Email: hello@wanderlust.travel')" class="hover:text-postcard-cream transition-colors cursor-pointer">hello@wanderlust.travel</a>
          <a href="#" onclick="showToast('+1 (555) 987-6543')" class="hover:text-postcard-cream transition-colors cursor-pointer">+1 (555) 987-6543</a>
          <div class="text-postcard-cream/20 text-xs mt-2">Mon-Fri 9am-6pm EST</div>
        </div>
        <div class="flex gap-3 mt-6">
          <a href="#" class="w-9 h-9 bg-postcard-cream/10 hover:bg-postcard-cream/20 rounded flex items-center justify-center transition-colors cursor-pointer" onclick="showToast('Follow us on Instagram')">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="#" class="w-9 h-9 bg-postcard-cream/10 hover:bg-postcard-cream/20 rounded flex items-center justify-center transition-colors cursor-pointer" onclick="showToast('Follow us on Pinterest')">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
          </a>
          <a href="#" class="w-9 h-9 bg-postcard-cream/10 hover:bg-postcard-cream/20 rounded flex items-center justify-center transition-colors cursor-pointer" onclick="showToast('Subscribe on YouTube')">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
      </div>
    </div>
    <div class="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-postcard-cream/20 text-xs font-body">&copy; 2026 Wanderlust Travel Co. All rights reserved. TICO Reg. #50025061</p>
      <div class="flex items-center gap-4 text-postcard-cream/20 text-xs font-body">
        <a href="#" class="hover:text-postcard-cream/50 transition-colors cursor-pointer">Privacy</a>
        <span>&middot;</span>
        <a href="#" class="hover:text-postcard-cream/50 transition-colors cursor-pointer">Terms</a>
        <span>&middot;</span>
        <a href="#" class="hover:text-postcard-cream/50 transition-colors cursor-pointer">Cookies</a>
      </div>
    </div>
  </div>
</footer>

<script>
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function toggleMobile() { document.getElementById('mobileMenu').classList.toggle('hidden'); }
function closeMobile() { document.getElementById('mobileMenu').classList.add('hidden'); }

function scrollToEl(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// Nav scroll - transparent to solid
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  const scrolled = window.scrollY > 80;
  nav.classList.toggle('nav-scrolled', scrolled);
  nav.querySelectorAll('.nav-text').forEach(el => el.style.color = scrolled ? '#5c2d0e' : '#fff');
  nav.querySelectorAll('.nav-subtext').forEach(el => el.style.color = scrolled ? 'rgba(92,45,14,0.4)' : 'rgba(255,255,255,0.5)');
  nav.querySelectorAll('.nav-link').forEach(el => { el.style.color = scrolled ? 'rgba(92,45,14,0.7)' : 'rgba(255,255,255,0.8)'; });
  nav.querySelectorAll('.nav-icon').forEach(el => el.style.color = scrolled ? '#5c2d0e' : '#fff');
});

// Scroll reveal with IntersectionObserver
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Stamp animation on hero load
window.addEventListener('load', () => {
  setTimeout(() => {
    const s1 = document.getElementById('heroStamp');
    if (s1) { s1.style.opacity = '1'; s1.querySelector('.stamp-border').classList.add('stamp-animate'); }
  }, 800);
  setTimeout(() => {
    const s2 = document.getElementById('heroStamp2');
    if (s2) { s2.style.opacity = '1'; s2.querySelector('.stamp-border').classList.add('stamp-animate'); }
  }, 1100);
});

// Experience horizontal scroll
function scrollExp(dir) {
  const el = document.getElementById('expScroll');
  el.scrollBy({ left: dir * 340, behavior: 'smooth' });
}

// Set min dates
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekLater = new Date(today);
  weekLater.setDate(weekLater.getDate() + 8);
  const dp = document.getElementById('tDepart');
  const rt = document.getElementById('tReturn');
  if (dp) dp.min = tomorrow.toISOString().split('T')[0];
  if (rt) rt.min = weekLater.toISOString().split('T')[0];
  if (dp) dp.addEventListener('change', () => {
    const d = new Date(dp.value);
    d.setDate(d.getDate() + 1);
    rt.min = d.toISOString().split('T')[0];
    if (rt.value && new Date(rt.value) <= new Date(dp.value)) rt.value = '';
  });
});

// Trip form handler
function handleTrip(e) {
  e.preventDefault();
  const name = document.getElementById('tName').value;
  const dest = document.getElementById('tDest');
  const destText = dest.options[dest.selectedIndex].text;
  const depart = document.getElementById('tDepart').value;
  const ret = document.getElementById('tReturn').value;
  if (!name || !dest.value || !depart || !ret) {
    showToast('Please fill in all required fields');
    return false;
  }
  const days = Math.ceil((new Date(ret) - new Date(depart)) / 86400000);
  showToast('Itinerary requested! ' + name + ', ' + destText + ' (' + days + ' days). We\'ll be in touch within 48 hours.');
  e.target.reset();
  return false;
}
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
