INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'a9c5d2cb-89bc-4577-a01c-c79928fa06c5',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SpaceHub — Where Work Meets Community</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Work+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        concrete: { 50:'#fafaf9', 100:'#f5f5f4', 200:'#e7e5e4', 300:'#d6d3d1', 400:'#a8a29e', 500:'#78716c', 600:'#57534e', 700:'#44403c', 800:'#292524', 900:'#1c1917' },
        wood: { 50:'#fefce8', 100:'#fef9c3', 200:'#fef08a', 300:'#fde047', 400:'#facc15', 500:'#ca8a04', 600:'#a16207', 700:'#854d0e', 800:'#713f12', 900:'#422006' },
        glass: { 50:'#f0f9ff', 100:'#e0f2fe', 200:'#bae6fd', 300:'#7dd3fc', 400:'#38bdf8', 500:'#0ea5e9', 600:'#0284c7', 700:'#0369a1', 800:'#075985', 900:'#0c4a6e' }
      },
      fontFamily: {
        archivo: ['Archivo', 'sans-serif'],
        work: ['Work Sans', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { font-family: 'Work Sans', sans-serif; }
  h1, h2, h3, h4, .font-archivo { font-family: 'Archivo', sans-serif; }
  html { scroll-behavior: smooth; }

  /* Concrete noise texture overlay */
  .concrete-grain {
    position: relative;
  }
  .concrete-grain::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
  }
  .concrete-grain > * { position: relative; z-index: 2; }

  /* Bento grid */
  .bento-hero {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(3, minmax(120px, auto));
    gap: 16px;
  }
  @media (max-width: 768px) {
    .bento-hero {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: auto;
    }
  }

  .bento-amenities {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(2, minmax(140px, auto));
    gap: 16px;
  }
  @media (max-width: 768px) {
    .bento-amenities {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: auto;
    }
  }

  /* Scroll reveal */
  .reveal { opacity: 0; transform: translateY(24px); transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  /* Wood accent line */
  .wood-divider {
    height: 3px;
    background: linear-gradient(90deg, transparent, #a16207, transparent);
  }

  /* Counter animation */
  .counter-num { font-variant-numeric: tabular-nums; }

  /* Events horizontal scroll */
  .events-scroll { scrollbar-width: thin; scrollbar-color: #a8a29e transparent; }
  .events-scroll::-webkit-scrollbar { height: 6px; }
  .events-scroll::-webkit-scrollbar-track { background: transparent; }
  .events-scroll::-webkit-scrollbar-thumb { background: #a8a29e; border-radius: 3px; }

  /* Glass effect cells */
  .glass-cell {
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.8);
  }
</style>
</head>
<body class="bg-concrete-100 text-concrete-800">

<!-- Decorative desk/chair icons scattered (fixed, low opacity) -->
<div class="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.025]">
  <svg class="absolute top-[12%] left-[8%] w-16 h-16 text-concrete-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48"><rect x="8" y="8" width="32" height="4" rx="1"/><rect x="12" y="12" width="24" height="16" rx="1"/><line x1="14" y1="28" x2="14" y2="40"/><line x1="34" y1="28" x2="34" y2="40"/><line x1="10" y1="40" x2="18" y2="40"/><line x1="30" y1="40" x2="38" y2="40"/></svg>
  <svg class="absolute top-[45%] right-[6%] w-20 h-20 text-concrete-600 rotate-12" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48"><path d="M12 32 C12 20 16 16 24 14 C32 16 36 20 36 32"/><rect x="10" y="32" width="28" height="4" rx="2"/><line x1="16" y1="36" x2="14" y2="44"/><line x1="32" y1="36" x2="34" y2="44"/></svg>
  <svg class="absolute top-[75%] left-[15%] w-14 h-14 text-concrete-600 -rotate-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48"><ellipse cx="24" cy="14" rx="10" ry="8"/><path d="M16 18 C14 24 14 30 16 34"/><path d="M20 22 C20 22 22 38 24 38"/></svg>
  <svg class="absolute top-[30%] left-[55%] w-12 h-12 text-concrete-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48"><rect x="8" y="8" width="32" height="4" rx="1"/><rect x="12" y="12" width="24" height="16" rx="1"/><line x1="14" y1="28" x2="14" y2="40"/><line x1="34" y1="28" x2="34" y2="40"/></svg>
  <svg class="absolute bottom-[15%] right-[25%] w-16 h-16 text-concrete-600 rotate-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48"><ellipse cx="24" cy="14" rx="10" ry="8"/><path d="M16 18 C14 24 14 30 16 34"/><path d="M20 22 C20 22 22 38 24 38"/></svg>
</div>

<!-- Nav -->
<nav class="fixed top-0 w-full bg-white/85 backdrop-blur-lg z-50 border-b border-concrete-200/60">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2.5">
      <div class="w-9 h-9 bg-concrete-800 rounded-lg flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
      </div>
      <span class="text-xl font-archivo font-black tracking-tight text-concrete-900">SpaceHub</span>
    </a>
    <div class="hidden md:flex items-center gap-7 text-sm font-medium text-concrete-500">
      <a href="#spaces" class="hover:text-concrete-900 transition-colors">Spaces</a>
      <a href="#amenities" class="hover:text-concrete-900 transition-colors">Amenities</a>
      <a href="#pricing" class="hover:text-concrete-900 transition-colors">Pricing</a>
      <a href="#events" class="hover:text-concrete-900 transition-colors">Events</a>
    </div>
    <div class="flex items-center gap-3">
      <a href="#cta" class="bg-wood-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-wood-700 transition-colors cursor-pointer">Book a Tour</a>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-concrete-500">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-concrete-100 px-6 py-4 space-y-3">
    <a href="#spaces" class="block text-sm font-medium text-concrete-600 hover:text-concrete-900">Spaces</a>
    <a href="#amenities" class="block text-sm font-medium text-concrete-600 hover:text-concrete-900">Amenities</a>
    <a href="#pricing" class="block text-sm font-medium text-concrete-600 hover:text-concrete-900">Pricing</a>
    <a href="#events" class="block text-sm font-medium text-concrete-600 hover:text-concrete-900">Events</a>
  </div>
</nav>

<!-- Bento Grid Hero -->
<section class="pt-24 pb-16 concrete-grain">
  <div class="max-w-7xl mx-auto px-6">
    <div class="bento-hero">
      <!-- Large cell 2x2: Main headline -->
      <div class="rounded-2xl bg-concrete-800 text-white p-8 md:p-10 flex flex-col justify-end" style="grid-column: span 2; grid-row: span 2;">
        <div class="mb-auto">
          <div class="inline-flex items-center gap-2 bg-wood-600/20 border border-wood-600/30 text-wood-300 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-6">
            <span class="w-1.5 h-1.5 bg-wood-500 rounded-full animate-pulse"></span>
            Now Open
          </div>
        </div>
        <h1 class="text-3xl md:text-5xl font-archivo font-black leading-[1.1] tracking-tight mb-4">
          Where Work<br>Meets<br><span class="text-wood-400">Community</span>
        </h1>
        <p class="text-concrete-400 text-sm md:text-base leading-relaxed max-w-sm font-work">
          A modern coworking space designed for freelancers, startups, and growing teams. Concrete, glass, and community.
        </p>
      </div>

      <!-- Medium cell: Desk counter -->
      <div class="rounded-2xl bg-white border border-concrete-200 p-6 flex flex-col justify-between" style="grid-column: span 1; grid-row: span 1;">
        <svg class="w-8 h-8 text-wood-600 mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48">
          <rect x="6" y="16" width="36" height="4" rx="1.5"/>
          <line x1="12" y1="20" x2="12" y2="36" stroke-linecap="round"/>
          <line x1="36" y1="20" x2="36" y2="36" stroke-linecap="round"/>
          <line x1="8" y1="36" x2="16" y2="36" stroke-linecap="round"/>
          <line x1="32" y1="36" x2="40" y2="36" stroke-linecap="round"/>
          <rect x="16" y="10" width="16" height="6" rx="1" fill="currentColor" opacity="0.15"/>
        </svg>
        <div>
          <p class="text-4xl font-archivo font-black text-concrete-900 counter-num" id="desk-counter">0</p>
          <p class="text-concrete-500 text-sm font-work mt-1">Desks Available</p>
        </div>
      </div>

      <!-- Small cell: Free coffee -->
      <div class="rounded-2xl bg-wood-600 text-white p-5 flex flex-col justify-between" style="grid-column: span 1; grid-row: span 1;">
        <svg class="w-7 h-7 text-wood-200" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48">
          <path d="M8 20h24v16a8 8 0 01-8 8H16a8 8 0 01-8-8V20z"/>
          <path d="M32 24h4a4 4 0 010 8h-4"/>
          <path d="M14 8c2-4 4-4 4 0"/>
          <path d="M20 6c2-4 4-4 4 0"/>
          <path d="M26 8c2-4 4-4 4 0"/>
        </svg>
        <div>
          <p class="font-archivo font-bold text-sm">Free Artisan</p>
          <p class="font-archivo font-bold text-sm">Coffee</p>
        </div>
      </div>

      <!-- Medium cell: Concrete texture placeholder -->
      <div class="rounded-2xl overflow-hidden relative" style="grid-column: span 1; grid-row: span 2;">
        <div class="absolute inset-0 bg-gradient-to-br from-concrete-300 via-concrete-200 to-concrete-400"></div>
        <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.65%27 numOctaves=%275%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.15%27/%3E%3C/svg%3E');"></div>
        <div class="absolute inset-0 flex items-end p-5">
          <p class="text-concrete-700 text-xs font-work font-medium uppercase tracking-widest">Raw Concrete &<br>Warm Wood</p>
        </div>
      </div>

      <!-- Small cell: 24/7 Access -->
      <div class="rounded-2xl bg-concrete-900 text-white p-5 flex flex-col justify-between" style="grid-column: span 1; grid-row: span 1;">
        <svg class="w-7 h-7 text-glass-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48">
          <rect x="14" y="20" width="20" height="20" rx="3"/>
          <path d="M18 20v-6a6 6 0 1112 0v6"/>
          <circle cx="24" cy="31" r="2.5" fill="currentColor"/>
          <line x1="24" y1="33" x2="24" y2="36" stroke-linecap="round"/>
        </svg>
        <div>
          <p class="font-archivo font-black text-lg">24/7</p>
          <p class="text-concrete-400 text-xs font-work">Access</p>
        </div>
      </div>

      <!-- Small cell: WiFi speed -->
      <div class="rounded-2xl bg-glass-500 text-white p-5 flex flex-col justify-between" style="grid-column: span 1; grid-row: span 1;">
        <svg class="w-7 h-7 text-glass-100" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 48 48">
          <path d="M6 18a26 26 0 0136 0" stroke-linecap="round"/>
          <path d="M12 24a18 18 0 0124 0" stroke-linecap="round"/>
          <path d="M18 30a10 10 0 0112 0" stroke-linecap="round"/>
          <circle cx="24" cy="36" r="2.5" fill="currentColor"/>
        </svg>
        <div>
          <p class="font-archivo font-black text-2xl">1Gbps</p>
          <p class="text-glass-100 text-xs font-work">Fiber WiFi</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Wood divider -->
<div class="max-w-7xl mx-auto px-6"><div class="wood-divider"></div></div>

<!-- Spaces Section -->
<section id="spaces" class="py-20">
  <div class="max-w-7xl mx-auto px-6">
    <div class="mb-12 reveal">
      <span class="text-wood-600 font-archivo font-bold text-xs tracking-[0.2em] uppercase">Workspace Options</span>
      <h2 class="text-3xl md:text-4xl font-archivo font-black mt-2 tracking-tight text-concrete-900">Find Your Space</h2>
      <p class="text-concrete-500 font-work mt-2 max-w-lg">From a single desk to a private office suite, we have what you need to do your best work.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-5">
      <!-- Hot Desk -->
      <div class="reveal group bg-white rounded-2xl border-2 border-concrete-200 p-7 hover:border-wood-500 transition-all hover:shadow-lg cursor-pointer">
        <div class="flex items-start justify-between mb-5">
          <div class="w-14 h-14 rounded-xl bg-concrete-100 flex items-center justify-center group-hover:bg-wood-50 transition-colors">
            <svg class="w-7 h-7 text-concrete-600 group-hover:text-wood-600 transition-colors" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48">
              <rect x="8" y="18" width="32" height="4" rx="1.5"/>
              <line x1="14" y1="22" x2="14" y2="36" stroke-linecap="round"/>
              <line x1="34" y1="22" x2="34" y2="36" stroke-linecap="round"/>
              <circle cx="24" cy="12" r="4" stroke-dasharray="2 2"/>
            </svg>
          </div>
          <span class="text-xs font-semibold text-concrete-400 bg-concrete-100 px-2.5 py-1 rounded-full">Flex</span>
        </div>
        <h3 class="font-archivo font-bold text-xl mb-2">Hot Desk</h3>
        <p class="text-concrete-500 text-sm font-work leading-relaxed mb-5">Grab any open desk. New neighbors every day. Perfect for freelancers and remote workers.</p>
        <div class="flex items-center gap-3 mb-5 text-xs text-concrete-400 font-work">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"/><path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            1 person
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01M1.394 9.393a11.5 11.5 0 0121.212 0"/></svg>
            WiFi
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v-4H7v4H5a2 2 0 01-2-2v-6a2 2 0 012-2h2"/><rect x="7" y="4" width="10" height="8" rx="1"/></svg>
            Print access
          </span>
        </div>
        <div class="pt-5 border-t-2 border-concrete-100 flex items-end justify-between">
          <div>
            <span class="text-3xl font-archivo font-black text-concrete-900">$25</span>
            <span class="text-concrete-400 text-sm font-work">/day</span>
          </div>
          <span class="text-wood-600 text-sm font-semibold group-hover:translate-x-1 transition-transform inline-block">Learn more &rarr;</span>
        </div>
      </div>

      <!-- Dedicated Desk -->
      <div class="reveal group bg-white rounded-2xl border-2 border-wood-400 p-7 shadow-lg shadow-wood-400/10 relative cursor-pointer">
        <div class="absolute -top-3.5 right-6 bg-wood-600 text-white px-3 py-1 rounded-full text-xs font-bold font-archivo">Popular</div>
        <div class="flex items-start justify-between mb-5">
          <div class="w-14 h-14 rounded-xl bg-wood-50 flex items-center justify-center">
            <svg class="w-7 h-7 text-wood-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48">
              <rect x="8" y="18" width="32" height="4" rx="1.5"/>
              <line x1="14" y1="22" x2="14" y2="36" stroke-linecap="round"/>
              <line x1="34" y1="22" x2="34" y2="36" stroke-linecap="round"/>
              <rect x="18" y="10" width="12" height="8" rx="1.5" fill="currentColor" opacity="0.15"/>
              <circle cx="24" cy="14" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <span class="text-xs font-semibold text-wood-700 bg-wood-100 px-2.5 py-1 rounded-full">Reserved</span>
        </div>
        <h3 class="font-archivo font-bold text-xl mb-2">Dedicated Desk</h3>
        <p class="text-concrete-500 text-sm font-work leading-relaxed mb-5">Your own permanent desk with storage. Set up your monitor, leave your things. It's yours.</p>
        <div class="flex items-center gap-3 mb-5 text-xs text-concrete-400 font-work">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"/><path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            1 person
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Locker
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            Mail
          </span>
        </div>
        <div class="pt-5 border-t-2 border-wood-100 flex items-end justify-between">
          <div>
            <span class="text-3xl font-archivo font-black text-concrete-900">$400</span>
            <span class="text-concrete-400 text-sm font-work">/mo</span>
          </div>
          <span class="text-wood-600 text-sm font-semibold group-hover:translate-x-1 transition-transform inline-block">Learn more &rarr;</span>
        </div>
      </div>

      <!-- Private Office -->
      <div class="reveal group bg-white rounded-2xl border-2 border-concrete-200 p-7 hover:border-wood-500 transition-all hover:shadow-lg cursor-pointer">
        <div class="flex items-start justify-between mb-5">
          <div class="w-14 h-14 rounded-xl bg-concrete-100 flex items-center justify-center group-hover:bg-wood-50 transition-colors">
            <svg class="w-7 h-7 text-concrete-600 group-hover:text-wood-600 transition-colors" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48">
              <rect x="6" y="12" width="36" height="24" rx="2"/>
              <line x1="18" y1="12" x2="18" y2="36"/>
              <rect x="22" y="20" width="6" height="4" rx="1"/>
              <rect x="32" y="20" width="6" height="4" rx="1"/>
              <rect x="22" y="28" width="6" height="4" rx="1"/>
              <rect x="32" y="28" width="6" height="4" rx="1"/>
              <circle cx="12" cy="24" r="3"/>
            </svg>
          </div>
          <span class="text-xs font-semibold text-concrete-400 bg-concrete-100 px-2.5 py-1 rounded-full">Private</span>
        </div>
        <h3 class="font-archivo font-bold text-xl mb-2">Private Office</h3>
        <p class="text-concrete-500 text-sm font-work leading-relaxed mb-5">Lockable glass-walled offices for 2-20 people. Your own space with shared community perks.</p>
        <div class="flex items-center gap-3 mb-5 text-xs text-concrete-400 font-work">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            2-20 people
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Secure
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Custom
          </span>
        </div>
        <div class="pt-5 border-t-2 border-concrete-100 flex items-end justify-between">
          <div>
            <span class="text-3xl font-archivo font-black text-concrete-900">$800</span>
            <span class="text-concrete-400 text-sm font-work">/mo</span>
          </div>
          <span class="text-wood-600 text-sm font-semibold group-hover:translate-x-1 transition-transform inline-block">Learn more &rarr;</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Amenities Bento Grid -->
<section id="amenities" class="py-20 bg-concrete-800 concrete-grain text-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="mb-12 reveal">
      <span class="text-wood-400 font-archivo font-bold text-xs tracking-[0.2em] uppercase">Everything You Need</span>
      <h2 class="text-3xl md:text-4xl font-archivo font-black mt-2 tracking-tight">Amenities</h2>
    </div>
    <div class="bento-amenities">
      <!-- Meeting Rooms: 2x1 -->
      <div class="reveal rounded-2xl bg-concrete-700/60 border border-concrete-600/40 p-6 flex flex-col justify-between hover:border-wood-500/50 transition-colors" style="grid-column: span 2;">
        <div class="flex items-start justify-between">
          <svg class="w-10 h-10 text-wood-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48">
            <rect x="6" y="14" width="36" height="20" rx="3"/>
            <circle cx="16" cy="24" r="3"/><circle cx="24" cy="24" r="3"/><circle cx="32" cy="24" r="3"/>
            <line x1="6" y1="38" x2="42" y2="38" stroke-linecap="round" stroke-dasharray="4 3"/>
          </svg>
          <span class="text-xs font-semibold text-wood-400 bg-wood-400/10 px-2.5 py-1 rounded-full">Bookable</span>
        </div>
        <div class="mt-4">
          <h4 class="font-archivo font-bold text-lg">Meeting Rooms</h4>
          <p class="text-concrete-400 text-sm font-work mt-1">4 rooms from 4-16 seats. 65" displays, video conferencing, whiteboards. Book by the hour.</p>
        </div>
      </div>

      <!-- Phone Booths: 1x1 -->
      <div class="reveal rounded-2xl bg-concrete-700/60 border border-concrete-600/40 p-6 flex flex-col justify-between hover:border-glass-500/50 transition-colors">
        <svg class="w-9 h-9 text-glass-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48">
          <rect x="14" y="6" width="20" height="36" rx="3"/>
          <circle cx="24" cy="18" r="4"/>
          <path d="M18 30h12"/>
          <path d="M18 34h12"/>
        </svg>
        <div class="mt-4">
          <h4 class="font-archivo font-bold">Phone Booths</h4>
          <p class="text-concrete-400 text-xs font-work mt-1">Soundproof pods for calls and focus time.</p>
        </div>
      </div>

      <!-- Kitchen: 1x1 -->
      <div class="reveal rounded-2xl bg-wood-600/20 border border-wood-600/30 p-6 flex flex-col justify-between hover:border-wood-400/60 transition-colors">
        <svg class="w-9 h-9 text-wood-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48">
          <ellipse cx="24" cy="14" rx="12" ry="8"/>
          <path d="M14 18c-2 6-2 12 0 16"/>
          <path d="M34 18c2 6 2 12 0 16"/>
          <path d="M20 22c0 0 2 16 4 16s4-16 4-16"/>
        </svg>
        <div class="mt-4">
          <h4 class="font-archivo font-bold">Full Kitchen</h4>
          <p class="text-concrete-400 text-xs font-work mt-1">Fridge, microwave, artisan coffee, kombucha on tap.</p>
        </div>
      </div>

      <!-- Lounge: 1x1 -->
      <div class="reveal rounded-2xl bg-concrete-700/60 border border-concrete-600/40 p-6 flex flex-col justify-between hover:border-wood-500/50 transition-colors">
        <svg class="w-9 h-9 text-wood-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48">
          <path d="M8 28c0-6 4-10 8-10h16c4 0 8 4 8 10"/>
          <rect x="6" y="28" width="36" height="6" rx="3"/>
          <line x1="10" y1="34" x2="10" y2="40" stroke-linecap="round"/>
          <line x1="38" y1="34" x2="38" y2="40" stroke-linecap="round"/>
        </svg>
        <div class="mt-4">
          <h4 class="font-archivo font-bold">Lounge</h4>
          <p class="text-concrete-400 text-xs font-work mt-1">Sofas, beanbags, and a nap room. Recharge zone.</p>
        </div>
      </div>

      <!-- Parking: 1x1 -->
      <div class="reveal rounded-2xl bg-concrete-700/60 border border-concrete-600/40 p-6 flex flex-col justify-between hover:border-glass-500/50 transition-colors">
        <svg class="w-9 h-9 text-glass-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48">
          <rect x="8" y="8" width="32" height="32" rx="8"/>
          <text x="24" y="32" text-anchor="middle" font-size="20" font-weight="bold" fill="currentColor" font-family="Archivo">P</text>
        </svg>
        <div class="mt-4">
          <h4 class="font-archivo font-bold">Parking</h4>
          <p class="text-concrete-400 text-xs font-work mt-1">Underground garage, bike storage, EV charging.</p>
        </div>
      </div>

      <!-- Printer: 2x1 -->
      <div class="reveal rounded-2xl bg-glass-500/10 border border-glass-500/20 p-6 flex flex-col justify-between hover:border-glass-400/40 transition-colors" style="grid-column: span 2;">
        <div class="flex items-start justify-between">
          <svg class="w-10 h-10 text-glass-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 48 48">
            <rect x="10" y="18" width="28" height="16" rx="2"/>
            <rect x="14" y="6" width="20" height="12" rx="1"/>
            <rect x="14" y="34" width="20" height="8" rx="1"/>
            <line x1="18" y1="38" x2="30" y2="38" stroke-linecap="round"/>
            <circle cx="32" cy="26" r="2" fill="currentColor"/>
          </svg>
          <span class="text-xs font-semibold text-glass-400 bg-glass-400/10 px-2.5 py-1 rounded-full">Included</span>
        </div>
        <div class="mt-4">
          <h4 class="font-archivo font-bold text-lg">Print & Scan Station</h4>
          <p class="text-concrete-400 text-sm font-work mt-1">Color laser printing, A3 scanning, binding. 100 pages/month included with all plans.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Pricing Section -->
<section id="pricing" class="py-20">
  <div class="max-w-7xl mx-auto px-6">
    <div class="mb-12 reveal">
      <span class="text-wood-600 font-archivo font-bold text-xs tracking-[0.2em] uppercase">Simple Pricing</span>
      <h2 class="text-3xl md:text-4xl font-archivo font-black mt-2 tracking-tight text-concrete-900">No Hidden Fees</h2>
      <p class="text-concrete-500 font-work mt-2 max-w-lg">Month-to-month. Cancel anytime. Everything included.</p>
    </div>

    <div class="grid md:grid-cols-3 gap-0 bg-white rounded-2xl border-2 border-concrete-200 overflow-hidden">
      <!-- Hot Desk pricing -->
      <div class="reveal p-8 border-b md:border-b-0 md:border-r border-concrete-200">
        <h3 class="font-archivo font-bold text-lg mb-1 text-concrete-900">Hot Desk</h3>
        <p class="text-concrete-400 text-sm font-work mb-6">Flexible seating</p>
        <div class="mb-6">
          <span class="text-4xl font-archivo font-black text-concrete-900">$25</span>
          <span class="text-concrete-400 font-work">/day</span>
        </div>
        <div class="space-y-3 text-sm font-work mb-8 text-concrete-600">
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>Open area seating</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>24/7 building access</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>1Gbps WiFi</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>Free coffee & tea</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>2hr meeting room/mo</div>
          <div class="flex items-center gap-2.5 text-concrete-300"><span class="w-5 h-5 rounded-full bg-concrete-100 text-concrete-300 flex items-center justify-center text-xs">&ndash;</span>Personal locker</div>
          <div class="flex items-center gap-2.5 text-concrete-300"><span class="w-5 h-5 rounded-full bg-concrete-100 text-concrete-300 flex items-center justify-center text-xs">&ndash;</span>Mail handling</div>
        </div>
        <button onclick="showToast('Thanks! We will reach out shortly.')" class="w-full border-2 border-concrete-200 text-concrete-700 py-3 rounded-xl font-semibold font-archivo hover:border-wood-400 hover:text-wood-700 transition-colors cursor-pointer">Get Started</button>
      </div>

      <!-- Dedicated Desk pricing -->
      <div class="reveal p-8 border-b md:border-b-0 md:border-r border-concrete-200 bg-wood-50/30 relative">
        <div class="absolute top-0 left-0 right-0 h-1 bg-wood-600"></div>
        <h3 class="font-archivo font-bold text-lg mb-1 text-concrete-900">Dedicated Desk</h3>
        <p class="text-concrete-400 text-sm font-work mb-6">Your permanent spot</p>
        <div class="mb-6">
          <span class="text-4xl font-archivo font-black text-concrete-900">$400</span>
          <span class="text-concrete-400 font-work">/mo</span>
        </div>
        <div class="space-y-3 text-sm font-work mb-8 text-concrete-600">
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>Reserved desk + chair</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>24/7 building access</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>1Gbps WiFi</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>Free coffee & tea</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>5hr meeting room/mo</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>Personal locker</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>Mail handling</div>
        </div>
        <button onclick="showToast('Thanks! We will reach out shortly.')" class="w-full bg-wood-600 text-white py-3 rounded-xl font-bold font-archivo hover:bg-wood-700 transition-colors cursor-pointer">Get Started</button>
      </div>

      <!-- Private Office pricing -->
      <div class="reveal p-8">
        <h3 class="font-archivo font-bold text-lg mb-1 text-concrete-900">Private Office</h3>
        <p class="text-concrete-400 text-sm font-work mb-6">For teams of 2-20</p>
        <div class="mb-6">
          <span class="text-4xl font-archivo font-black text-concrete-900">$800</span>
          <span class="text-concrete-400 font-work">/mo</span>
        </div>
        <div class="space-y-3 text-sm font-work mb-8 text-concrete-600">
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>Lockable glass office</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>24/7 building access</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>Dedicated internet line</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>Free coffee & tea</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>10hr meeting room/mo</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>Company registration</div>
          <div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-wood-100 text-wood-600 flex items-center justify-center text-xs font-bold">&check;</span>Custom branding</div>
        </div>
        <button onclick="showToast('Thanks! We will reach out shortly.')" class="w-full border-2 border-concrete-200 text-concrete-700 py-3 rounded-xl font-semibold font-archivo hover:border-wood-400 hover:text-wood-700 transition-colors cursor-pointer">Contact Sales</button>
      </div>
    </div>
  </div>
</section>

<!-- Community Events - Horizontal Scroll -->
<section id="events" class="py-20 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex items-end justify-between mb-10 reveal">
      <div>
        <span class="text-wood-600 font-archivo font-bold text-xs tracking-[0.2em] uppercase">Community</span>
        <h2 class="text-3xl md:text-4xl font-archivo font-black mt-2 tracking-tight text-concrete-900">Upcoming Events</h2>
      </div>
      <span class="text-concrete-400 text-sm font-work hidden md:block">Scroll &rarr;</span>
    </div>
    <div class="flex gap-5 overflow-x-auto pb-4 events-scroll reveal">
      <!-- Event 1 -->
      <div class="flex-shrink-0 w-72 bg-concrete-50 rounded-2xl border border-concrete-200 overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
        <div class="h-36 bg-gradient-to-br from-wood-500 to-wood-700 flex items-center justify-center relative overflow-hidden">
          <svg class="w-16 h-16 text-white/20 absolute -bottom-2 -right-2" fill="currentColor" viewBox="0 0 48 48"><path d="M24 4v20l14-10z"/><circle cx="24" cy="34" r="10"/></svg>
          <div class="relative text-white text-center">
            <p class="text-xs font-work uppercase tracking-widest opacity-80">Mar 5</p>
            <p class="font-archivo font-black text-lg mt-1">Founder Friday</p>
          </div>
        </div>
        <div class="p-5">
          <p class="text-concrete-500 text-sm font-work leading-relaxed">Monthly meetup for startup founders. Pitch practice, mentorship, and networking over craft beer.</p>
          <div class="flex items-center gap-2 mt-4 text-xs text-concrete-400"><span>6:00 PM</span><span>&bull;</span><span>Main Lounge</span><span>&bull;</span><span>Free</span></div>
        </div>
      </div>
      <!-- Event 2 -->
      <div class="flex-shrink-0 w-72 bg-concrete-50 rounded-2xl border border-concrete-200 overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
        <div class="h-36 bg-gradient-to-br from-glass-500 to-glass-700 flex items-center justify-center relative overflow-hidden">
          <svg class="w-16 h-16 text-white/20 absolute -bottom-2 -right-2" fill="currentColor" viewBox="0 0 48 48"><rect x="8" y="8" width="32" height="32" rx="4"/><path d="M16 20h16M16 28h10"/></svg>
          <div class="relative text-white text-center">
            <p class="text-xs font-work uppercase tracking-widest opacity-80">Mar 12</p>
            <p class="font-archivo font-black text-lg mt-1">Design Workshop</p>
          </div>
        </div>
        <div class="p-5">
          <p class="text-concrete-500 text-sm font-work leading-relaxed">Hands-on Figma workshop: Design systems for startups. Bring your laptop. Limited to 20 seats.</p>
          <div class="flex items-center gap-2 mt-4 text-xs text-concrete-400"><span>2:00 PM</span><span>&bull;</span><span>Room B</span><span>&bull;</span><span>$15</span></div>
        </div>
      </div>
      <!-- Event 3 -->
      <div class="flex-shrink-0 w-72 bg-concrete-50 rounded-2xl border border-concrete-200 overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
        <div class="h-36 bg-gradient-to-br from-concrete-600 to-concrete-800 flex items-center justify-center relative overflow-hidden">
          <svg class="w-16 h-16 text-white/20 absolute -bottom-2 -right-2" fill="currentColor" viewBox="0 0 48 48"><circle cx="24" cy="24" r="18"/><path d="M24 14v10l7 7" stroke="white" stroke-width="2" fill="none"/></svg>
          <div class="relative text-white text-center">
            <p class="text-xs font-work uppercase tracking-widest opacity-80">Mar 19</p>
            <p class="font-archivo font-black text-lg mt-1">AI & Automation</p>
          </div>
        </div>
        <div class="p-5">
          <p class="text-concrete-500 text-sm font-work leading-relaxed">Panel discussion: How small teams use AI to punch above their weight. 3 speakers, live demos.</p>
          <div class="flex items-center gap-2 mt-4 text-xs text-concrete-400"><span>7:00 PM</span><span>&bull;</span><span>Event Space</span><span>&bull;</span><span>Free</span></div>
        </div>
      </div>
      <!-- Event 4 -->
      <div class="flex-shrink-0 w-72 bg-concrete-50 rounded-2xl border border-concrete-200 overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
        <div class="h-36 bg-gradient-to-br from-wood-400 to-wood-600 flex items-center justify-center relative overflow-hidden">
          <svg class="w-16 h-16 text-white/20 absolute -bottom-2 -right-2" fill="currentColor" viewBox="0 0 48 48"><ellipse cx="24" cy="16" rx="10" ry="8"/><path d="M16 20c-2 6-2 12 0 16M32 20c2 6 2 12 0 16"/></svg>
          <div class="relative text-white text-center">
            <p class="text-xs font-work uppercase tracking-widest opacity-80">Every Friday</p>
            <p class="font-archivo font-black text-lg mt-1">Coffee & Connect</p>
          </div>
        </div>
        <div class="p-5">
          <p class="text-concrete-500 text-sm font-work leading-relaxed">Casual Friday afternoon coffee break. No agenda, just conversations. Open to members and guests.</p>
          <div class="flex items-center gap-2 mt-4 text-xs text-concrete-400"><span>3:00 PM</span><span>&bull;</span><span>Kitchen</span><span>&bull;</span><span>Free</span></div>
        </div>
      </div>
      <!-- Event 5 -->
      <div class="flex-shrink-0 w-72 bg-concrete-50 rounded-2xl border border-concrete-200 overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
        <div class="h-36 bg-gradient-to-br from-concrete-700 to-concrete-900 flex items-center justify-center relative overflow-hidden">
          <svg class="w-16 h-16 text-white/20 absolute -bottom-2 -right-2" fill="currentColor" viewBox="0 0 48 48"><path d="M12 8h24v32H12z"/><path d="M18 16h12M18 22h12M18 28h8"/></svg>
          <div class="relative text-white text-center">
            <p class="text-xs font-work uppercase tracking-widest opacity-80">Mar 26</p>
            <p class="font-archivo font-black text-lg mt-1">Tax Season Q&A</p>
          </div>
        </div>
        <div class="p-5">
          <p class="text-concrete-500 text-sm font-work leading-relaxed">CPA office hours for freelancers and small business owners. Bring your questions (and receipts).</p>
          <div class="flex items-center gap-2 mt-4 text-xs text-concrete-400"><span>11:00 AM</span><span>&bull;</span><span>Room A</span><span>&bull;</span><span>Members Only</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section id="cta" class="py-20 bg-concrete-900 concrete-grain relative overflow-hidden">
  <!-- Decorative desk SVGs -->
  <svg class="absolute top-8 left-8 w-24 h-24 text-concrete-800 opacity-40" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 48 48"><rect x="8" y="16" width="32" height="4" rx="1.5"/><line x1="14" y1="20" x2="14" y2="36"/><line x1="34" y1="20" x2="34" y2="36"/></svg>
  <svg class="absolute bottom-8 right-12 w-20 h-20 text-concrete-800 opacity-40 rotate-12" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 48 48"><path d="M12 32 C12 20 16 16 24 14 C32 16 36 20 36 32"/><rect x="10" y="32" width="28" height="4" rx="2"/></svg>

  <div class="max-w-2xl mx-auto px-6 text-center relative reveal">
    <h2 class="text-3xl md:text-4xl font-archivo font-black text-white tracking-tight mb-4">Start Your Free Day Pass</h2>
    <p class="text-concrete-400 font-work mb-8 text-lg">Experience SpaceHub for a full day. No credit card required. Just show up and work.</p>
    <div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input type="email" id="cta-email" placeholder="you@company.com" class="flex-1 px-5 py-3.5 rounded-xl bg-concrete-800 border border-concrete-700 text-white placeholder:text-concrete-500 font-work text-sm focus:outline-none focus:ring-2 focus:ring-wood-500 focus:border-transparent">
      <button onclick="claimPass()" class="bg-wood-600 text-white px-7 py-3.5 rounded-xl font-bold font-archivo hover:bg-wood-500 transition-colors whitespace-nowrap cursor-pointer">Claim Pass</button>
    </div>
    <p class="text-concrete-600 text-xs font-work mt-4">Available Monday-Friday. Valid for 30 days after signup.</p>
  </div>
</section>

<!-- Footer -->
<footer class="bg-concrete-900 border-t border-concrete-800">
  <div class="max-w-7xl mx-auto px-6 py-14">
    <div class="grid md:grid-cols-4 gap-10">
      <!-- Logo + info -->
      <div class="md:col-span-2">
        <div class="flex items-center gap-2.5 mb-4">
          <div class="w-8 h-8 bg-concrete-700 rounded-lg flex items-center justify-center">
            <svg class="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
          </div>
          <span class="text-lg font-archivo font-black text-white">SpaceHub</span>
        </div>
        <p class="text-concrete-500 text-sm font-work leading-relaxed max-w-xs mb-6">Modern coworking for people who care about where they work. Concrete, glass, community.</p>
        <!-- Location map placeholder -->
        <div class="bg-concrete-800 rounded-xl p-4 border border-concrete-700 max-w-xs">
          <div class="h-32 bg-concrete-700 rounded-lg flex items-center justify-center mb-3">
            <div class="text-center">
              <svg class="w-8 h-8 text-concrete-500 mx-auto mb-1" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <p class="text-concrete-500 text-xs font-work">123 Industrial Blvd, Suite 400</p>
            </div>
          </div>
          <div class="flex items-center justify-between text-xs text-concrete-500 font-work">
            <span>Downtown District</span>
            <span>2 min from Metro</span>
          </div>
        </div>
      </div>

      <!-- Hours -->
      <div>
        <h4 class="font-archivo font-bold text-white text-sm mb-4 uppercase tracking-wider">Hours</h4>
        <div class="space-y-2.5 text-sm font-work text-concrete-500">
          <div class="flex justify-between"><span>Building Access</span><span class="text-white font-medium">24/7</span></div>
          <div class="flex justify-between"><span>Front Desk</span><span>Mon-Fri 8-6</span></div>
          <div class="flex justify-between"><span>Kitchen</span><span>6 AM - 10 PM</span></div>
          <div class="flex justify-between"><span>Events</span><span>Check calendar</span></div>
        </div>
      </div>

      <!-- Contact -->
      <div>
        <h4 class="font-archivo font-bold text-white text-sm mb-4 uppercase tracking-wider">Contact</h4>
        <div class="space-y-2.5 text-sm font-work text-concrete-500">
          <p>hello@spacehub.co</p>
          <p>(555) 234-5678</p>
          <p>123 Industrial Blvd<br>Suite 400<br>Downtown, ST 10001</p>
        </div>
        <div class="flex gap-3 mt-5">
          <a href="#" class="w-8 h-8 rounded-lg bg-concrete-800 flex items-center justify-center text-concrete-500 hover:text-white hover:bg-concrete-700 transition-colors cursor-pointer">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
          </a>
          <a href="#" class="w-8 h-8 rounded-lg bg-concrete-800 flex items-center justify-center text-concrete-500 hover:text-white hover:bg-concrete-700 transition-colors cursor-pointer">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="#" class="w-8 h-8 rounded-lg bg-concrete-800 flex items-center justify-center text-concrete-500 hover:text-white hover:bg-concrete-700 transition-colors cursor-pointer">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
        </div>
      </div>
    </div>

    <!-- Wood divider -->
    <div class="wood-divider my-10 opacity-40"></div>

    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="text-concrete-600 text-xs font-work">&copy; 2026 SpaceHub. All rights reserved.</p>
      <div class="flex gap-6 text-xs text-concrete-600 font-work">
        <a href="#" class="hover:text-white transition-colors cursor-pointer">Privacy</a>
        <a href="#" class="hover:text-white transition-colors cursor-pointer">Terms</a>
        <a href="#" class="hover:text-white transition-colors cursor-pointer">Cookies</a>
      </div>
    </div>
  </div>
</footer>

<!-- Toast notification -->
<div id="toast" class="fixed bottom-6 right-6 z-[60] bg-concrete-800 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-semibold font-work translate-y-20 opacity-0 transition-all duration-300 pointer-events-none border border-concrete-700"></div>

<script>
// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 2800);
}

// CTA claim pass
function claimPass() {
  const email = document.getElementById('cta-email').value;
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email address.');
    return;
  }
  showToast('Your free day pass is on the way! Check your inbox.');
  document.getElementById('cta-email').value = '';
}

// Desk counter animation
function animateCounter(el, target) {
  let current = 0;
  const increment = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current;
  }, 35);
}

// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Counter trigger
const counterEl = document.getElementById('desk-counter');
let counterFired = false;
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting && !counterFired) {
      counterFired = true;
      animateCounter(counterEl, 24);
      counterObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
counterObserver.observe(counterEl);

// Mobile menu close on nav click
document.querySelectorAll('#mobile-menu a').forEach(a => {
  a.addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.add('hidden');
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
