INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '39f3f4ad-8d7c-493e-92bd-f4c2166fc33e',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CINEHAUS — Cinematic Video Portfolio</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        cinema: { 50:'#fafafa', 100:'#f0f0f0', 200:'#d4d4d4', 300:'#a3a3a3', 400:'#737373', 500:'#525252', 600:'#404040', 700:'#2a2a2a', 800:'#171717', 900:'#0f0f0f', 950:'#0a0a0a' },
        fred: { 400:'#f87171', 500:'#dc2626', 600:'#b91c1c', 700:'#991b1b' },
        gold: { 400:'#d4a847', 500:'#b8860b', 600:'#996f09' }
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { font-family: 'Inter', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { background: #0a0a0a; color: #d4d4d4; }

  .font-display { font-family: 'Bebas Neue', sans-serif; }

  .reveal { opacity: 0; transform: translateY(24px); transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.2s; }
  .reveal-delay-3 { transition-delay: 0.3s; }

  /* Letterbox bars on thumbnails */
  .letterbox { position: relative; }
  .letterbox::before,
  .letterbox::after {
    content: '';
    position: absolute;
    left: 0; right: 0;
    height: 12%;
    background: #000;
    z-index: 2;
    pointer-events: none;
  }
  .letterbox::before { top: 0; }
  .letterbox::after { bottom: 0; }

  /* Play button pulse */
  .play-btn { transition: transform 0.3s ease, box-shadow 0.3s ease; }
  .play-btn:hover { transform: scale(1.12); box-shadow: 0 0 40px rgba(220, 38, 38, 0.4); }

  /* Project card hover */
  .project-card:hover .project-thumb { transform: scale(1.05); }
  .project-card:hover .project-overlay { opacity: 1; }
  .project-card:hover .play-btn { transform: scale(1.12); box-shadow: 0 0 40px rgba(220, 38, 38, 0.4); }

  /* Film grain overlay */
  .film-grain {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
  }

  /* Scanline effect */
  .scanlines {
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255,255,255,0.008) 2px,
      rgba(255,255,255,0.008) 4px
    );
    pointer-events: none;
  }

  /* Red rec dot blink */
  @keyframes rec-blink { 0%,100%{ opacity:1; } 50%{ opacity:0.3; } }
  .rec-dot { animation: rec-blink 2s ease-in-out infinite; }

  /* Horizontal scroll strip */
  @keyframes scroll-strip { 0%{ transform: translateX(0); } 100%{ transform: translateX(-50%); } }
  .scroll-strip { animation: scroll-strip 30s linear infinite; }
</style>
</head>
<body>

<!-- Navigation -->
<nav class="fixed top-0 w-full bg-cinema-950/90 backdrop-blur-md z-50 border-b border-cinema-800/40">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-3">
      <svg class="w-8 h-8 text-fred-500" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2"/>
        <polygon points="16,12 30,20 16,28" fill="currentColor"/>
      </svg>
      <span class="font-display text-2xl tracking-wider text-white">CINEHAUS</span>
    </a>
    <div class="hidden md:flex items-center gap-8 text-sm font-medium text-cinema-400">
      <a href="#showreel" class="hover:text-fred-500 transition-colors duration-300">Showreel</a>
      <a href="#projects" class="hover:text-fred-500 transition-colors duration-300">Projects</a>
      <a href="#equipment" class="hover:text-fred-500 transition-colors duration-300">Equipment</a>
      <a href="#awards" class="hover:text-fred-500 transition-colors duration-300">Awards</a>
      <a href="#contact" class="bg-fred-500 text-white px-5 py-2 rounded-sm hover:bg-fred-600 transition-colors duration-300 font-semibold tracking-wide">Let's Create</a>
    </div>
    <button onclick="document.getElementById('mobile-nav').classList.toggle('hidden')" class="md:hidden text-cinema-400 hover:text-white transition-colors">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div id="mobile-nav" class="hidden md:hidden bg-cinema-950 border-t border-cinema-800/40 px-6 py-5 space-y-4">
    <a href="#showreel" class="block text-sm text-cinema-300 hover:text-fred-500">Showreel</a>
    <a href="#projects" class="block text-sm text-cinema-300 hover:text-fred-500">Projects</a>
    <a href="#equipment" class="block text-sm text-cinema-300 hover:text-fred-500">Equipment</a>
    <a href="#awards" class="block text-sm text-cinema-300 hover:text-fred-500">Awards</a>
    <a href="#contact" class="block text-sm text-fred-500 font-semibold">Let's Create</a>
  </div>
</nav>

<!-- Hero -->
<section class="pt-16 min-h-screen flex items-center relative overflow-hidden">
  <div class="absolute inset-0 scanlines z-10"></div>
  <div class="absolute inset-0 film-grain z-10"></div>
  <div class="absolute inset-0 bg-gradient-to-b from-cinema-950/60 via-transparent to-cinema-950 z-10"></div>
  <!-- Cinematic background with letterbox -->
  <div class="absolute inset-0">
    <div class="absolute top-0 left-0 right-0 h-[15%] bg-black z-[5]"></div>
    <div class="absolute bottom-0 left-0 right-0 h-[15%] bg-black z-[5]"></div>
    <div class="absolute inset-0 bg-gradient-to-br from-cinema-900 via-cinema-950 to-cinema-900 flex items-center justify-center">
      <div class="w-full h-full bg-gradient-to-tr from-fred-700/5 via-transparent to-gold-500/5"></div>
    </div>
  </div>

  <div class="relative z-20 max-w-7xl mx-auto px-6 w-full">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <div class="flex items-center gap-3 mb-8">
          <div class="w-2.5 h-2.5 bg-fred-500 rounded-full rec-dot"></div>
          <span class="text-xs tracking-[0.35em] uppercase text-cinema-400 font-medium">Director &middot; Cinematographer &middot; Colorist</span>
        </div>
        <h1 class="font-display text-6xl md:text-8xl lg:text-9xl tracking-wide leading-[0.9] mb-8 text-white">
          EVERY<br>
          FRAME<br>
          <span class="text-fred-500">TELLS</span>
        </h1>
        <p class="text-cinema-300 text-lg leading-relaxed mb-10 max-w-md font-light">
          Cinematic storytelling for brands that demand more than ordinary. Every project is crafted with the precision of film and the soul of art.
        </p>
        <div class="flex flex-wrap gap-4 items-center">
          <a href="#showreel" class="group flex items-center gap-3 bg-fred-500 text-white pl-4 pr-6 py-3 rounded-sm hover:bg-fred-600 transition-all duration-300 font-semibold">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            Watch Showreel
          </a>
          <a href="#projects" class="border border-cinema-600 text-cinema-300 px-6 py-3 rounded-sm hover:border-gold-500 hover:text-gold-500 transition-all duration-300 font-medium">
            View Projects
          </a>
        </div>
      </div>
      <!-- Hero play button -->
      <div class="flex items-center justify-center">
        <div class="relative cursor-pointer group" onclick="showToast('Showreel loading...')">
          <div class="w-40 h-40 md:w-52 md:h-52 rounded-full border-2 border-cinema-600 group-hover:border-fred-500 flex items-center justify-center transition-all duration-500 relative">
            <svg class="w-16 h-16 md:w-20 md:h-20 text-cinema-300 group-hover:text-fred-500 transition-colors duration-500 ml-2" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            <div class="absolute inset-0 rounded-full border border-cinema-700/50 animate-ping opacity-20 group-hover:border-fred-500/50"></div>
          </div>
          <span class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-[0.3em] uppercase text-cinema-500 font-medium whitespace-nowrap">Play Reel</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Showreel / Featured Video -->
<section id="showreel" class="py-28 relative">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-fred-500 text-xs tracking-[0.35em] uppercase font-semibold">Featured Showreel</span>
      <h2 class="font-display text-5xl md:text-6xl tracking-wider mt-3 text-white">2024 DIRECTOR'S REEL</h2>
      <p class="text-cinema-400 mt-3 text-sm">Director: Lin Wei-Ting &nbsp;|&nbsp; DOP: Chen Yu-Hsiang &nbsp;|&nbsp; Colorist: Huang Mei-Ling</p>
    </div>

    <div class="reveal letterbox relative aspect-video bg-cinema-900 rounded-sm overflow-hidden cursor-pointer group max-w-5xl mx-auto" onclick="showToast('Showreel playback coming soon')">
      <!-- Cinematic gradient background -->
      <div class="absolute inset-0 bg-gradient-to-br from-cinema-800 via-cinema-900 to-black flex items-center justify-center transition-transform duration-700 project-thumb">
        <div class="absolute inset-0 bg-gradient-to-tr from-fred-700/10 via-transparent to-gold-500/10"></div>
      </div>
      <!-- Center play button -->
      <div class="absolute inset-0 flex items-center justify-center z-10">
        <div class="play-btn w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-white/80 flex items-center justify-center bg-fred-500/20 backdrop-blur-sm group-hover:bg-fred-500/40 transition-all duration-500">
          <svg class="w-10 h-10 md:w-12 md:h-12 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        </div>
      </div>
      <!-- Duration badge -->
      <div class="absolute bottom-[14%] right-4 z-10 bg-black/70 text-cinema-200 text-xs px-3 py-1 rounded-sm font-medium backdrop-blur-sm">03:42</div>
      <!-- Film info overlay -->
      <div class="absolute bottom-[14%] left-4 z-10">
        <span class="font-display text-2xl md:text-3xl text-white tracking-wider">CINEHAUS REEL 2024</span>
        <p class="text-cinema-300 text-xs mt-1">4K &middot; DCI-P3 &middot; Dolby Vision</p>
      </div>
    </div>
  </div>
</section>

<!-- Projects Grid -->
<section id="projects" class="py-28 border-t border-cinema-800/30">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex items-end justify-between mb-14 reveal">
      <div>
        <span class="text-fred-500 text-xs tracking-[0.35em] uppercase font-semibold">Selected Works</span>
        <h2 class="font-display text-5xl md:text-6xl tracking-wider mt-3 text-white">PROJECTS</h2>
      </div>
      <div class="hidden md:flex gap-2">
        <button onclick="filterProjects('all')" class="proj-filter active text-xs px-4 py-2 rounded-sm font-semibold bg-fred-500 text-white transition-colors duration-300">All</button>
        <button onclick="filterProjects('brand')" class="proj-filter text-xs px-4 py-2 rounded-sm font-semibold bg-cinema-800 text-cinema-400 hover:text-white transition-colors duration-300">Brand</button>
        <button onclick="filterProjects('commercial')" class="proj-filter text-xs px-4 py-2 rounded-sm font-semibold bg-cinema-800 text-cinema-400 hover:text-white transition-colors duration-300">Commercial</button>
        <button onclick="filterProjects('music')" class="proj-filter text-xs px-4 py-2 rounded-sm font-semibold bg-cinema-800 text-cinema-400 hover:text-white transition-colors duration-300">Music</button>
        <button onclick="filterProjects('doc')" class="proj-filter text-xs px-4 py-2 rounded-sm font-semibold bg-cinema-800 text-cinema-400 hover:text-white transition-colors duration-300">Documentary</button>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-5" id="projects-grid">

      <!-- Project 1 -->
      <div class="reveal project-card relative letterbox aspect-video bg-cinema-900 rounded-sm overflow-hidden cursor-pointer group" data-cat="brand" onclick="showToast('Project detail loading...')">
        <div class="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-cinema-900 to-cinema-950 transition-transform duration-700 project-thumb"></div>
        <div class="project-overlay absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-400 z-[3]"></div>
        <!-- Play button -->
        <div class="absolute inset-0 flex items-center justify-center z-10">
          <div class="play-btn w-16 h-16 rounded-full border-2 border-white/70 flex items-center justify-center bg-fred-500/20 backdrop-blur-sm">
            <svg class="w-7 h-7 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
        <!-- Film credit metadata -->
        <div class="absolute bottom-[14%] left-0 right-0 px-5 z-10">
          <span class="text-gold-500 text-[10px] tracking-[0.25em] uppercase font-semibold">Brand Film</span>
          <h3 class="font-display text-xl md:text-2xl text-white tracking-wider mt-1">PATAGONIA TAIWAN &mdash; BETWEEN MOUNTAINS</h3>
          <p class="text-cinema-400 text-[11px] mt-1.5 font-light">Director: Lin Wei-Ting &nbsp;|&nbsp; DOP: Chen Yu-Hsiang &nbsp;|&nbsp; Client: Patagonia</p>
          <p class="text-cinema-500 text-[10px] mt-1">4K &middot; 3:24 &middot; Alexa Mini LF &middot; 2024</p>
        </div>
      </div>

      <!-- Project 2 -->
      <div class="reveal reveal-delay-1 project-card relative letterbox aspect-video bg-cinema-900 rounded-sm overflow-hidden cursor-pointer group" data-cat="music" onclick="showToast('Project detail loading...')">
        <div class="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-cinema-900 to-cinema-950 transition-transform duration-700 project-thumb"></div>
        <div class="project-overlay absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-400 z-[3]"></div>
        <div class="absolute inset-0 flex items-center justify-center z-10">
          <div class="play-btn w-16 h-16 rounded-full border-2 border-white/70 flex items-center justify-center bg-fred-500/20 backdrop-blur-sm">
            <svg class="w-7 h-7 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
        <div class="absolute bottom-[14%] left-0 right-0 px-5 z-10">
          <span class="text-gold-500 text-[10px] tracking-[0.25em] uppercase font-semibold">Music Video</span>
          <h3 class="font-display text-xl md:text-2xl text-white tracking-wider mt-1">9M88 &mdash; MIDNIGHT CRUISE</h3>
          <p class="text-cinema-400 text-[11px] mt-1.5 font-light">Director: Lin Wei-Ting &nbsp;|&nbsp; DOP: Tsai Ming-Lun &nbsp;|&nbsp; Artist: 9m88</p>
          <p class="text-cinema-500 text-[10px] mt-1">4K &middot; 4:32 &middot; RED V-Raptor &middot; 2024</p>
        </div>
      </div>

      <!-- Project 3 -->
      <div class="reveal project-card relative letterbox aspect-video bg-cinema-900 rounded-sm overflow-hidden cursor-pointer group" data-cat="doc" onclick="showToast('Project detail loading...')">
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-900/25 via-cinema-900 to-cinema-950 transition-transform duration-700 project-thumb"></div>
        <div class="project-overlay absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-400 z-[3]"></div>
        <div class="absolute inset-0 flex items-center justify-center z-10">
          <div class="play-btn w-16 h-16 rounded-full border-2 border-white/70 flex items-center justify-center bg-fred-500/20 backdrop-blur-sm">
            <svg class="w-7 h-7 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
        <div class="absolute bottom-[14%] left-0 right-0 px-5 z-10">
          <span class="text-gold-500 text-[10px] tracking-[0.25em] uppercase font-semibold">Documentary</span>
          <h3 class="font-display text-xl md:text-2xl text-white tracking-wider mt-1">THE ARTISAN &mdash; DADAOCHENG LEGACY</h3>
          <p class="text-cinema-400 text-[11px] mt-1.5 font-light">Director: Lin Wei-Ting &nbsp;|&nbsp; DOP: Chen Yu-Hsiang &nbsp;|&nbsp; Producer: Wang Li-Wen</p>
          <p class="text-cinema-500 text-[10px] mt-1">4K &middot; 28 min &middot; Sony Venice 2 &middot; 2023</p>
        </div>
      </div>

      <!-- Project 4 -->
      <div class="reveal reveal-delay-1 project-card relative letterbox aspect-video bg-cinema-900 rounded-sm overflow-hidden cursor-pointer group" data-cat="commercial" onclick="showToast('Project detail loading...')">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-cinema-900 to-cinema-950 transition-transform duration-700 project-thumb"></div>
        <div class="project-overlay absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-400 z-[3]"></div>
        <div class="absolute inset-0 flex items-center justify-center z-10">
          <div class="play-btn w-16 h-16 rounded-full border-2 border-white/70 flex items-center justify-center bg-fred-500/20 backdrop-blur-sm">
            <svg class="w-7 h-7 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
        <div class="absolute bottom-[14%] left-0 right-0 px-5 z-10">
          <span class="text-gold-500 text-[10px] tracking-[0.25em] uppercase font-semibold">Commercial TVC</span>
          <h3 class="font-display text-xl md:text-2xl text-white tracking-wider mt-1">LEXUS RX &mdash; THE PURSUIT</h3>
          <p class="text-cinema-400 text-[11px] mt-1.5 font-light">Director: Lin Wei-Ting &nbsp;|&nbsp; DOP: Huang Kai-Wen &nbsp;|&nbsp; Client: Lexus Taiwan</p>
          <p class="text-cinema-500 text-[10px] mt-1">6K &middot; 30s/60s &middot; Alexa 35 &middot; 2024</p>
        </div>
      </div>

    </div>
  </div>
</section>

<!-- Equipment -->
<section id="equipment" class="py-28 border-t border-cinema-800/30">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-fred-500 text-xs tracking-[0.35em] uppercase font-semibold">Our Arsenal</span>
      <h2 class="font-display text-5xl md:text-6xl tracking-wider mt-3 text-white">EQUIPMENT</h2>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="reveal bg-cinema-900/60 border border-cinema-800/60 rounded-sm p-6 hover:border-fred-500/30 transition-all duration-300 group">
        <div class="w-10 h-10 rounded-sm bg-fred-500/10 flex items-center justify-center mb-5 group-hover:bg-fred-500/20 transition-colors">
          <svg class="w-5 h-5 text-fred-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="16" height="12" rx="1"/><polygon points="20,9 23,7 23,17 20,15"/></svg>
        </div>
        <h4 class="font-display text-lg tracking-wider text-white mb-3">CAMERAS</h4>
        <ul class="space-y-1.5 text-cinema-400 text-sm font-light">
          <li>ARRI Alexa Mini LF</li>
          <li>RED V-Raptor XL</li>
          <li>Sony Venice 2</li>
          <li>Sony FX6</li>
        </ul>
      </div>

      <div class="reveal reveal-delay-1 bg-cinema-900/60 border border-cinema-800/60 rounded-sm p-6 hover:border-fred-500/30 transition-all duration-300 group">
        <div class="w-10 h-10 rounded-sm bg-gold-500/10 flex items-center justify-center mb-5 group-hover:bg-gold-500/20 transition-colors">
          <svg class="w-5 h-5 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
        </div>
        <h4 class="font-display text-lg tracking-wider text-white mb-3">LENSES</h4>
        <ul class="space-y-1.5 text-cinema-400 text-sm font-light">
          <li>ARRI Signature Prime Set</li>
          <li>Cooke S7/i Full Frame</li>
          <li>Atlas Mercury Anamorphic</li>
          <li>Laowa Nanomorph 1.5x</li>
        </ul>
      </div>

      <div class="reveal reveal-delay-2 bg-cinema-900/60 border border-cinema-800/60 rounded-sm p-6 hover:border-fred-500/30 transition-all duration-300 group">
        <div class="w-10 h-10 rounded-sm bg-fred-500/10 flex items-center justify-center mb-5 group-hover:bg-fred-500/20 transition-colors">
          <svg class="w-5 h-5 text-fred-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
        </div>
        <h4 class="font-display text-lg tracking-wider text-white mb-3">LIGHTING</h4>
        <ul class="space-y-1.5 text-cinema-400 text-sm font-light">
          <li>ARRI SkyPanel S60-C</li>
          <li>Aputure 600d Pro</li>
          <li>Nanlite Forza 720B</li>
          <li>Astera Titan Tubes</li>
        </ul>
      </div>

      <div class="reveal reveal-delay-3 bg-cinema-900/60 border border-cinema-800/60 rounded-sm p-6 hover:border-fred-500/30 transition-all duration-300 group">
        <div class="w-10 h-10 rounded-sm bg-gold-500/10 flex items-center justify-center mb-5 group-hover:bg-gold-500/20 transition-colors">
          <svg class="w-5 h-5 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M9 4v16M15 4v16M4 9h16M4 15h16"/></svg>
        </div>
        <h4 class="font-display text-lg tracking-wider text-white mb-3">GRIP &amp; POST</h4>
        <ul class="space-y-1.5 text-cinema-400 text-sm font-light">
          <li>DJI Ronin 2</li>
          <li>Dana Dolly</li>
          <li>DaVinci Resolve Studio</li>
          <li>Flame / Nuke</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- Awards -->
<section id="awards" class="py-28 border-t border-cinema-800/30 relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-r from-cinema-950 via-cinema-900/50 to-cinema-950"></div>
  <div class="relative z-10 max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-gold-500 text-xs tracking-[0.35em] uppercase font-semibold">Recognition</span>
      <h2 class="font-display text-5xl md:text-6xl tracking-wider mt-3 text-white">AWARDS</h2>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div class="reveal bg-cinema-950/80 border border-gold-500/20 rounded-sm p-7 hover:border-gold-500/50 transition-all duration-400">
        <div class="flex items-center gap-3 mb-4">
          <svg class="w-7 h-7 text-gold-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span class="font-display text-lg tracking-wider text-gold-500">BEST FILM</span>
        </div>
        <h4 class="text-white font-semibold mb-1">Golden Horse Awards 2024</h4>
        <p class="text-cinema-400 text-sm font-light">Best Short Film &mdash; "The Artisan"</p>
        <p class="text-cinema-500 text-xs mt-2">Director: Lin Wei-Ting &nbsp;|&nbsp; Producer: Wang Li-Wen</p>
      </div>

      <div class="reveal reveal-delay-1 bg-cinema-950/80 border border-gold-500/20 rounded-sm p-7 hover:border-gold-500/50 transition-all duration-400">
        <div class="flex items-center gap-3 mb-4">
          <svg class="w-7 h-7 text-gold-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span class="font-display text-lg tracking-wider text-gold-500">GOLD AWARD</span>
        </div>
        <h4 class="text-white font-semibold mb-1">4A Creative Awards 2024</h4>
        <p class="text-cinema-400 text-sm font-light">Best Cinematography &mdash; Patagonia Campaign</p>
        <p class="text-cinema-500 text-xs mt-2">DOP: Chen Yu-Hsiang &nbsp;|&nbsp; Client: Patagonia</p>
      </div>

      <div class="reveal reveal-delay-2 bg-cinema-950/80 border border-gold-500/20 rounded-sm p-7 hover:border-gold-500/50 transition-all duration-400">
        <div class="flex items-center gap-3 mb-4">
          <svg class="w-7 h-7 text-gold-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span class="font-display text-lg tracking-wider text-gold-500">OFFICIAL SELECTION</span>
        </div>
        <h4 class="text-white font-semibold mb-1">Kaohsiung Film Festival 2023</h4>
        <p class="text-cinema-400 text-sm font-light">Short Film Competition &mdash; "Midnight Crossing"</p>
        <p class="text-cinema-500 text-xs mt-2">Director: Lin Wei-Ting &nbsp;|&nbsp; DOP: Tsai Ming-Lun</p>
      </div>

      <div class="reveal bg-cinema-950/80 border border-cinema-800/40 rounded-sm p-7 hover:border-gold-500/30 transition-all duration-400">
        <div class="flex items-center gap-3 mb-4">
          <svg class="w-7 h-7 text-cinema-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span class="font-display text-lg tracking-wider text-cinema-400">FINALIST</span>
        </div>
        <h4 class="text-white font-semibold mb-1">Cannes Lions 2023</h4>
        <p class="text-cinema-400 text-sm font-light">Film Craft &mdash; Lexus "The Pursuit"</p>
        <p class="text-cinema-500 text-xs mt-2">Director: Lin Wei-Ting &nbsp;|&nbsp; Agency: ADK Taiwan</p>
      </div>

      <div class="reveal reveal-delay-1 bg-cinema-950/80 border border-cinema-800/40 rounded-sm p-7 hover:border-gold-500/30 transition-all duration-400">
        <div class="flex items-center gap-3 mb-4">
          <svg class="w-7 h-7 text-cinema-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span class="font-display text-lg tracking-wider text-cinema-400">SILVER AWARD</span>
        </div>
        <h4 class="text-white font-semibold mb-1">Asia Pacific Advertising Festival</h4>
        <p class="text-cinema-400 text-sm font-light">Best Direction &mdash; "Between Mountains"</p>
        <p class="text-cinema-500 text-xs mt-2">Client: Patagonia &nbsp;|&nbsp; Agency: Wieden+Kennedy</p>
      </div>

      <div class="reveal reveal-delay-2 bg-cinema-950/80 border border-cinema-800/40 rounded-sm p-7 hover:border-gold-500/30 transition-all duration-400">
        <div class="flex items-center gap-3 mb-4">
          <svg class="w-7 h-7 text-cinema-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span class="font-display text-lg tracking-wider text-cinema-400">WINNER</span>
        </div>
        <h4 class="text-white font-semibold mb-1">Taipei Golden Eagle Awards 2024</h4>
        <p class="text-cinema-400 text-sm font-light">Best Music Video &mdash; 9m88 "Midnight Cruise"</p>
        <p class="text-cinema-500 text-xs mt-2">Director: Lin Wei-Ting &nbsp;|&nbsp; Label: Sony Music</p>
      </div>
    </div>

    <!-- Stats strip -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 reveal">
      <div class="text-center py-6 border border-cinema-800/40 rounded-sm bg-cinema-950/50">
        <span class="font-display text-4xl text-fred-500 block">150+</span>
        <span class="text-cinema-500 text-xs tracking-wider uppercase mt-1 block">Projects Completed</span>
      </div>
      <div class="text-center py-6 border border-cinema-800/40 rounded-sm bg-cinema-950/50">
        <span class="font-display text-4xl text-gold-500 block">12</span>
        <span class="text-cinema-500 text-xs tracking-wider uppercase mt-1 block">Awards Won</span>
      </div>
      <div class="text-center py-6 border border-cinema-800/40 rounded-sm bg-cinema-950/50">
        <span class="font-display text-4xl text-fred-500 block">10</span>
        <span class="text-cinema-500 text-xs tracking-wider uppercase mt-1 block">Years Experience</span>
      </div>
      <div class="text-center py-6 border border-cinema-800/40 rounded-sm bg-cinema-950/50">
        <span class="font-display text-4xl text-gold-500 block">40+</span>
        <span class="text-cinema-500 text-xs tracking-wider uppercase mt-1 block">Brand Partners</span>
      </div>
    </div>
  </div>
</section>

<!-- Clients marquee -->
<section class="py-14 border-t border-cinema-800/30 overflow-hidden">
  <div class="flex whitespace-nowrap scroll-strip">
    <div class="flex items-center gap-16 px-8">
      <span class="font-display text-xl tracking-wider text-cinema-600 hover:text-cinema-400 transition-colors cursor-default">PATAGONIA</span>
      <span class="text-cinema-800">/</span>
      <span class="font-display text-xl tracking-wider text-cinema-600 hover:text-cinema-400 transition-colors cursor-default">% ARABICA</span>
      <span class="text-cinema-800">/</span>
      <span class="font-display text-xl tracking-wider text-cinema-600 hover:text-cinema-400 transition-colors cursor-default">LEXUS</span>
      <span class="text-cinema-800">/</span>
      <span class="font-display text-xl tracking-wider text-cinema-600 hover:text-cinema-400 transition-colors cursor-default">ESLITE</span>
      <span class="text-cinema-800">/</span>
      <span class="font-display text-xl tracking-wider text-cinema-600 hover:text-cinema-400 transition-colors cursor-default">NATIONAL PALACE MUSEUM</span>
      <span class="text-cinema-800">/</span>
      <span class="font-display text-xl tracking-wider text-cinema-600 hover:text-cinema-400 transition-colors cursor-default">GOLDEN HORSE</span>
      <span class="text-cinema-800">/</span>
      <span class="font-display text-xl tracking-wider text-cinema-600 hover:text-cinema-400 transition-colors cursor-default">SONY MUSIC</span>
      <span class="text-cinema-800">/</span>
      <span class="font-display text-xl tracking-wider text-cinema-600 hover:text-cinema-400 transition-colors cursor-default">NIKE</span>
      <span class="text-cinema-800">/</span>
    </div>
    <div class="flex items-center gap-16 px-8" aria-hidden="true">
      <span class="font-display text-xl tracking-wider text-cinema-600">PATAGONIA</span>
      <span class="text-cinema-800">/</span>
      <span class="font-display text-xl tracking-wider text-cinema-600">% ARABICA</span>
      <span class="text-cinema-800">/</span>
      <span class="font-display text-xl tracking-wider text-cinema-600">LEXUS</span>
      <span class="text-cinema-800">/</span>
      <span class="font-display text-xl tracking-wider text-cinema-600">ESLITE</span>
      <span class="text-cinema-800">/</span>
      <span class="font-display text-xl tracking-wider text-cinema-600">NATIONAL PALACE MUSEUM</span>
      <span class="text-cinema-800">/</span>
      <span class="font-display text-xl tracking-wider text-cinema-600">GOLDEN HORSE</span>
      <span class="text-cinema-800">/</span>
      <span class="font-display text-xl tracking-wider text-cinema-600">SONY MUSIC</span>
      <span class="text-cinema-800">/</span>
      <span class="font-display text-xl tracking-wider text-cinema-600">NIKE</span>
      <span class="text-cinema-800">/</span>
    </div>
  </div>
</section>

<!-- Contact / Let's Create -->
<section id="contact" class="py-28 border-t border-cinema-800/30 relative">
  <div class="absolute inset-0 bg-gradient-to-b from-cinema-950 via-cinema-900/30 to-cinema-950"></div>
  <div class="relative z-10 max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-2 gap-16 items-start">
      <div class="reveal">
        <span class="text-fred-500 text-xs tracking-[0.35em] uppercase font-semibold">Get In Touch</span>
        <h2 class="font-display text-5xl md:text-7xl tracking-wider mt-3 mb-8 text-white leading-[0.95]">LET'S<br>CREATE</h2>
        <p class="text-cinema-300 text-lg leading-relaxed mb-10 font-light max-w-md">
          Every great film starts with a conversation. Tell me your vision, and let's craft something cinematic together.
        </p>

        <div class="space-y-5 mb-10">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-sm bg-cinema-800/80 border border-cinema-700/40 flex items-center justify-center">
              <svg class="w-4 h-4 text-fred-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <span class="text-cinema-300 text-sm">lin@cinehaus.film</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-sm bg-cinema-800/80 border border-cinema-700/40 flex items-center justify-center">
              <svg class="w-4 h-4 text-fred-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <span class="text-cinema-300 text-sm">+886 912-345-678</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-sm bg-cinema-800/80 border border-cinema-700/40 flex items-center justify-center">
              <svg class="w-4 h-4 text-fred-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <span class="text-cinema-300 text-sm">Taipei, Taiwan</span>
          </div>
        </div>

        <div class="flex gap-3">
          <a href="#" class="w-10 h-10 rounded-sm bg-cinema-800/80 border border-cinema-700/40 flex items-center justify-center text-cinema-400 hover:bg-fred-500 hover:border-fred-500 hover:text-white transition-all duration-300">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="#" class="w-10 h-10 rounded-sm bg-cinema-800/80 border border-cinema-700/40 flex items-center justify-center text-cinema-400 hover:bg-fred-500 hover:border-fred-500 hover:text-white transition-all duration-300">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          <a href="#" class="w-10 h-10 rounded-sm bg-cinema-800/80 border border-cinema-700/40 flex items-center justify-center text-cinema-400 hover:bg-fred-500 hover:border-fred-500 hover:text-white transition-all duration-300">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm-1 3.05L12.36 12.1a.56.56 0 01-.72 0L5 7.05V6.5l7 5.25 7-5.25v.55z"/></svg>
          </a>
        </div>
      </div>

      <!-- Contact form -->
      <div class="reveal">
        <div class="bg-cinema-900/50 border border-cinema-800/50 rounded-sm p-8">
          <h3 class="font-display text-2xl tracking-wider text-white mb-6">PROJECT INQUIRY</h3>
          <div class="space-y-5">
            <div>
              <label class="text-[11px] text-cinema-500 mb-1.5 block tracking-wider uppercase font-medium">Name / Company</label>
              <input type="text" placeholder="Your name or company" class="w-full bg-cinema-800/60 border border-cinema-700/50 rounded-sm px-4 py-3 text-sm text-cinema-200 placeholder-cinema-600 focus:border-fred-500 outline-none transition-colors">
            </div>
            <div>
              <label class="text-[11px] text-cinema-500 mb-1.5 block tracking-wider uppercase font-medium">Email</label>
              <input type="email" placeholder="you@company.com" class="w-full bg-cinema-800/60 border border-cinema-700/50 rounded-sm px-4 py-3 text-sm text-cinema-200 placeholder-cinema-600 focus:border-fred-500 outline-none transition-colors">
            </div>
            <div>
              <label class="text-[11px] text-cinema-500 mb-1.5 block tracking-wider uppercase font-medium">Project Type</label>
              <select class="w-full bg-cinema-800/60 border border-cinema-700/50 rounded-sm px-4 py-3 text-sm text-cinema-200 focus:border-fred-500 outline-none transition-colors">
                <option>Brand Film</option>
                <option>Commercial / TVC</option>
                <option>Music Video</option>
                <option>Documentary</option>
                <option>Event Coverage</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label class="text-[11px] text-cinema-500 mb-1.5 block tracking-wider uppercase font-medium">Budget Range</label>
              <select class="w-full bg-cinema-800/60 border border-cinema-700/50 rounded-sm px-4 py-3 text-sm text-cinema-200 focus:border-fred-500 outline-none transition-colors">
                <option>Under $5,000 USD</option>
                <option>$5,000 - $15,000 USD</option>
                <option>$15,000 - $50,000 USD</option>
                <option>$50,000+ USD</option>
                <option>To be discussed</option>
              </select>
            </div>
            <div>
              <label class="text-[11px] text-cinema-500 mb-1.5 block tracking-wider uppercase font-medium">Project Brief</label>
              <textarea rows="4" placeholder="Tell me about your vision..." class="w-full bg-cinema-800/60 border border-cinema-700/50 rounded-sm px-4 py-3 text-sm text-cinema-200 placeholder-cinema-600 focus:border-fred-500 outline-none transition-colors resize-none"></textarea>
            </div>
            <button onclick="showToast('Inquiry received. I will respond within 24 hours.')" class="w-full bg-fred-500 text-white py-3.5 rounded-sm font-semibold hover:bg-fred-600 transition-colors duration-300 flex items-center justify-center gap-2">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              Send Inquiry
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-cinema-800/30 py-10">
  <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
    <div class="flex items-center gap-3">
      <svg class="w-6 h-6 text-fred-500" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2"/>
        <polygon points="16,12 30,20 16,28" fill="currentColor"/>
      </svg>
      <span class="font-display text-lg tracking-wider text-white">CINEHAUS</span>
    </div>
    <p class="text-cinema-600 text-xs tracking-wider">&copy; 2026 CINEHAUS. All rights reserved. Crafted with cinema.</p>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-fred-500 text-white px-6 py-3 rounded-sm shadow-2xl text-sm font-medium translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"></div>

<script>
// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 2800);
}

// Project filter
function filterProjects(cat) {
  document.querySelectorAll('.proj-filter').forEach(b => {
    b.className = 'proj-filter text-xs px-4 py-2 rounded-sm font-semibold bg-cinema-800 text-cinema-400 hover:text-white transition-colors duration-300';
  });
  event.target.className = 'proj-filter active text-xs px-4 py-2 rounded-sm font-semibold bg-fred-500 text-white transition-colors duration-300';
  document.querySelectorAll('.project-card').forEach(c => {
    c.style.display = (cat === 'all' || c.dataset.cat === cat) ? 'block' : 'none';
  });
}

// Scroll reveal
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// Mobile menu close on nav click
document.querySelectorAll('#mobile-nav a').forEach(a => {
  a.addEventListener('click', () => {
    document.getElementById('mobile-nav').classList.add('hidden');
  });
});
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
