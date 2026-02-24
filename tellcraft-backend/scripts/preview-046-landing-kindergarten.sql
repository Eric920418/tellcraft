INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'ba7c15b5-d9fd-42f9-a9c6-1d3ca253a9f6',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Little Stars Kindergarten</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{crayon:{red:'#ef4444',yellow:'#eab308',blue:'#0ea5e9',green:'#22c55e',pink:'#fda4af'},paper:'#fef9ef',kraft:'#f5e6d0'},fontFamily:{display:['Fredoka','sans-serif'],body:['Nunito Sans','sans-serif']},borderRadius:{blob1:'40% 60% 55% 45% / 60% 40% 50% 50%',blob2:'60% 40% 45% 55% / 40% 60% 50% 50%',blob3:'50% 50% 40% 60% / 55% 45% 60% 40%'}}}}
</script>
<style>
*{font-family:'Nunito Sans',sans-serif;box-sizing:border-box}
h1,h2,h3,h4,.font-display{font-family:'Fredoka',sans-serif}
html{scroll-behavior:smooth}
body{background:#fef9ef}

/* Crayon texture overlay */
.crayon-texture{position:relative}
.crayon-texture::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(0,0,0,0.015) 2px,rgba(0,0,0,0.015) 4px);border-radius:inherit;pointer-events:none}

/* Wobbly hand-drawn borders via SVG filter */
.wobbly{filter:url(#wobbly-filter)}

/* Blob float animations */
.float-1{animation:blobFloat1 7s ease-in-out infinite}
.float-2{animation:blobFloat2 8s ease-in-out infinite 1s}
.float-3{animation:blobFloat3 6s ease-in-out infinite 0.5s}
@keyframes blobFloat1{0%,100%{transform:translate(0,0) rotate(0deg)}33%{transform:translate(8px,-12px) rotate(2deg)}66%{transform:translate(-5px,8px) rotate(-1deg)}}
@keyframes blobFloat2{0%,100%{transform:translate(0,0) rotate(0deg)}33%{transform:translate(-10px,8px) rotate(-2deg)}66%{transform:translate(6px,-10px) rotate(1.5deg)}}
@keyframes blobFloat3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(5px,-8px) scale(1.03)}}

/* Bounce reveal */
.reveal{opacity:0;transform:translateY(40px) scale(0.95);transition:all 0.7s cubic-bezier(0.34,1.56,0.64,1)}
.reveal.visible{opacity:1;transform:translateY(0) scale(1)}

/* Crayon underline */
.crayon-underline{position:relative;display:inline-block}
.crayon-underline::after{content:'';position:absolute;bottom:-4px;left:-4px;right:-4px;height:10px;background:currentColor;opacity:0.25;border-radius:40% 60% 50% 50% / 80% 80% 40% 40%;transform:rotate(-1deg)}

/* Speech bubble */
.speech-bubble{position:relative;background:#fff;border-radius:1.5rem}
.speech-bubble::after{content:'';position:absolute;bottom:-14px;left:32px;width:28px;height:20px;background:#fff;clip-path:polygon(0 0,100% 0,20% 100%)}

/* Scattered layout */
.scatter-1{transform:rotate(-3deg) translate(5px,-10px)}
.scatter-2{transform:rotate(2deg) translate(-8px,5px)}
.scatter-3{transform:rotate(-1.5deg) translate(3px,8px)}
.scatter-4{transform:rotate(3deg) translate(-5px,-5px)}
.scatter-5{transform:rotate(-2deg) translate(10px,3px)}

/* Cloud doodles */
.cloud-drift{animation:cloudDrift 25s linear infinite}
@keyframes cloudDrift{0%{transform:translateX(-120%)}100%{transform:translateX(calc(100vw + 120%))}}

/* Star twinkle */
.twinkle{animation:twinkle 3s ease-in-out infinite}
@keyframes twinkle{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.15)}}

/* Wobbly border card */
.wobbly-card{border:3px solid;border-radius:1.5rem;position:relative}
.wobbly-card::before{content:'';position:absolute;inset:-5px;border:2px dashed;border-radius:2rem;opacity:0.2;border-color:inherit}

/* Paper fold */
.paper-fold{position:relative;overflow:hidden}
.paper-fold::before{content:'';position:absolute;top:0;right:0;width:40px;height:40px;background:linear-gradient(225deg,#fef9ef 50%,rgba(0,0,0,0.06) 50%);border-radius:0 0 0 8px}

/* Mobile nav */
.mobile-nav{transform:translateX(100%);transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1)}
.mobile-nav.open{transform:translateX(0)}

/* Timeline dot pulse */
.timeline-dot{position:relative}
.timeline-dot::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid;border-color:inherit;opacity:0;animation:dotPulse 2s ease-in-out infinite}
@keyframes dotPulse{0%,100%{opacity:0;transform:scale(0.8)}50%{opacity:0.3;transform:scale(1.2)}}
</style>

<!-- SVG Filters for wobbly effect -->
<svg style="position:absolute;width:0;height:0">
<defs>
<filter id="wobbly-filter">
<feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="3" seed="2" result="turbulence"/>
<feDisplacementMap in="SourceGraphic" in2="turbulence" scale="3" xChannelSelector="R" yChannelSelector="G"/>
</filter>
</defs>
</svg>
</head>

<body class="overflow-x-hidden bg-paper">

<!-- Floating Cloud Doodles -->
<div class="fixed top-8 left-0 z-0 pointer-events-none opacity-20">
<svg class="cloud-drift" width="120" height="60" viewBox="0 0 120 60" style="animation-delay:0s"><path d="M20,45 Q10,45 10,35 Q10,25 20,25 Q22,15 35,15 Q45,10 55,15 Q60,5 75,10 Q90,8 95,20 Q110,20 110,35 Q110,45 100,45 Z" fill="#0ea5e9" opacity="0.4"/></svg>
</div>
<div class="fixed top-28 left-0 z-0 pointer-events-none opacity-15">
<svg class="cloud-drift" width="100" height="50" viewBox="0 0 100 50" style="animation-delay:-10s"><path d="M15,40 Q5,40 5,30 Q5,20 18,20 Q20,10 35,12 Q48,5 58,12 Q65,5 78,10 Q92,12 92,25 Q95,40 80,40 Z" fill="#fda4af" opacity="0.5"/></svg>
</div>
<div class="fixed top-52 left-0 z-0 pointer-events-none opacity-10">
<svg class="cloud-drift" width="140" height="65" viewBox="0 0 140 65" style="animation-delay:-18s"><path d="M25,50 Q8,50 10,38 Q5,25 22,22 Q25,10 42,12 Q55,2 70,10 Q80,4 95,12 Q115,10 118,28 Q125,45 108,50 Z" fill="#eab308" opacity="0.4"/></svg>
</div>

<!-- Scattered Star Decorations (fixed) -->
<div class="fixed top-20 right-12 z-0 pointer-events-none twinkle" style="animation-delay:0s">
<svg width="24" height="24" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="#eab308" opacity="0.3"/></svg>
</div>
<div class="fixed top-60 left-16 z-0 pointer-events-none twinkle" style="animation-delay:1s">
<svg width="18" height="18" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="#ef4444" opacity="0.25"/></svg>
</div>
<div class="fixed bottom-40 right-20 z-0 pointer-events-none twinkle" style="animation-delay:2s">
<svg width="20" height="20" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="#22c55e" opacity="0.2"/></svg>
</div>

<!-- ============ NAV ============ -->
<nav class="fixed top-0 w-full bg-paper/90 backdrop-blur-md z-50" style="border-bottom:3px solid #eab308;border-bottom-left-radius:0 0 2rem 2rem">
<div class="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
  <div class="flex items-center gap-2">
    <svg width="36" height="36" viewBox="0 0 36 36"><polygon points="18,2 22,13 34,13 24,20 28,31 18,24 8,31 12,20 2,13 14,13" fill="#eab308" stroke="#ef4444" stroke-width="1"/><circle cx="18" cy="17" r="5" fill="#fef9ef"/><text x="18" y="20" text-anchor="middle" font-size="7" fill="#ef4444" font-family="Fredoka" font-weight="700">LS</text></svg>
    <span class="font-display font-bold text-xl" style="color:#ef4444">Little Stars</span>
  </div>
  <!-- Desktop nav dots -->
  <div class="hidden md:flex items-center gap-5">
    <a href="#about" class="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-crayon-red transition-colors cursor-pointer group">
      <span class="w-2.5 h-2.5 rounded-full bg-crayon-red group-hover:scale-125 transition-transform"></span>About
    </a>
    <a href="#programs" class="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-crayon-yellow transition-colors cursor-pointer group">
      <span class="w-2.5 h-2.5 rounded-full bg-crayon-yellow group-hover:scale-125 transition-transform"></span>Programs
    </a>
    <a href="#gallery" class="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-crayon-blue transition-colors cursor-pointer group">
      <span class="w-2.5 h-2.5 rounded-full bg-crayon-blue group-hover:scale-125 transition-transform"></span>Gallery
    </a>
    <a href="#enroll" class="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-crayon-green transition-colors cursor-pointer group">
      <span class="w-2.5 h-2.5 rounded-full bg-crayon-green group-hover:scale-125 transition-transform"></span>Enroll
    </a>
  </div>
  <!-- Register button with hand-drawn border -->
  <button onclick="document.getElementById('enroll').scrollIntoView({behavior:'smooth'})" class="hidden md:block relative font-display font-semibold text-sm px-5 py-2 cursor-pointer bg-crayon-red text-white hover:scale-105 transition-transform" style="border-radius:30% 70% 60% 40% / 60% 30% 70% 40%">
    Register
  </button>
  <!-- Mobile burger -->
  <button id="mobileMenuBtn" class="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 cursor-pointer" onclick="document.getElementById('mobileMenu').classList.toggle('open')">
    <span class="w-6 h-0.5 bg-crayon-red rounded-full"></span>
    <span class="w-5 h-0.5 bg-crayon-yellow rounded-full"></span>
    <span class="w-4 h-0.5 bg-crayon-blue rounded-full"></span>
  </button>
</div>
<!-- Mobile menu -->
<div id="mobileMenu" class="mobile-nav fixed top-0 right-0 h-full w-72 bg-paper shadow-2xl z-50 p-8 md:hidden">
  <button onclick="document.getElementById('mobileMenu').classList.remove('open')" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-crayon-pink/30 flex items-center justify-center text-crayon-red font-bold cursor-pointer text-lg">X</button>
  <div class="mt-16 space-y-6">
    <a href="#about" onclick="document.getElementById('mobileMenu').classList.remove('open')" class="flex items-center gap-3 text-lg font-display font-semibold text-gray-700 cursor-pointer"><span class="w-4 h-4 rounded-full bg-crayon-red"></span>About</a>
    <a href="#programs" onclick="document.getElementById('mobileMenu').classList.remove('open')" class="flex items-center gap-3 text-lg font-display font-semibold text-gray-700 cursor-pointer"><span class="w-4 h-4 rounded-full bg-crayon-yellow"></span>Programs</a>
    <a href="#gallery" onclick="document.getElementById('mobileMenu').classList.remove('open')" class="flex items-center gap-3 text-lg font-display font-semibold text-gray-700 cursor-pointer"><span class="w-4 h-4 rounded-full bg-crayon-blue"></span>Gallery</a>
    <a href="#enroll" onclick="document.getElementById('mobileMenu').classList.remove('open')" class="flex items-center gap-3 text-lg font-display font-semibold text-gray-700 cursor-pointer"><span class="w-4 h-4 rounded-full bg-crayon-green"></span>Enroll</a>
  </div>
</div>
</nav>

<!-- ============ HERO ============ -->
<section class="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
<!-- Background blobs -->
<div class="absolute -top-20 -left-32 w-[500px] h-[500px] bg-crayon-yellow/15 float-1" style="border-radius:40% 60% 55% 45% / 60% 40% 50% 50%"></div>
<div class="absolute top-20 -right-20 w-[400px] h-[400px] bg-crayon-blue/10 float-2" style="border-radius:60% 40% 45% 55% / 40% 60% 50% 50%"></div>
<div class="absolute -bottom-20 left-1/4 w-[350px] h-[350px] bg-crayon-pink/15 float-3" style="border-radius:50% 50% 40% 60% / 55% 45% 60% 40%"></div>
<div class="absolute top-40 left-1/2 w-[250px] h-[250px] bg-crayon-green/10 float-1" style="border-radius:55% 45% 50% 50% / 45% 55% 50% 50%;animation-delay:2s"></div>

<div class="max-w-6xl mx-auto px-6 relative z-10">
  <div class="flex flex-col lg:flex-row items-center gap-12">
    <!-- Left text -->
    <div class="flex-1 text-center lg:text-left">
      <div class="inline-block bg-crayon-yellow/20 px-5 py-2 mb-6 font-display font-semibold text-sm" style="border-radius:60% 40% 50% 50% / 50% 50% 60% 40%;color:#eab308">
        Now Enrolling for 2026!
      </div>
      <h1 class="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-gray-800 leading-tight mb-6">
        Where Every Child
        <span class="block">
          <span class="crayon-underline" style="color:#ef4444">Sh</span><span class="crayon-underline" style="color:#eab308">in</span><span class="crayon-underline" style="color:#0ea5e9">es</span>
          <!-- Inline SVG star -->
          <svg class="inline-block -mt-2 ml-1 twinkle" width="40" height="40" viewBox="0 0 40 40"><polygon points="20,2 25,15 38,15 28,23 31,36 20,28 9,36 12,23 2,15 15,15" fill="#eab308" stroke="#ef4444" stroke-width="0.5"/></svg>
        </span>
      </h1>
      <p class="text-gray-500 text-lg mb-8 max-w-lg mx-auto lg:mx-0 font-body">
        A joyful, nurturing space where little ones learn through play, creativity, and wonder. Every day is an adventure at Little Stars!
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
        <button onclick="document.getElementById('enroll').scrollIntoView({behavior:'smooth'})" class="font-display font-semibold text-white px-8 py-3.5 text-lg bg-crayon-red hover:scale-105 transition-all cursor-pointer shadow-lg shadow-red-200" style="border-radius:40% 60% 50% 50% / 60% 40% 55% 45%">
          Enroll Now
        </button>
        <a href="#programs" class="font-display font-semibold text-crayon-blue px-8 py-3.5 text-lg border-3 border-crayon-blue/40 hover:bg-crayon-blue/10 transition-all cursor-pointer text-center" style="border-radius:55% 45% 50% 50% / 50% 55% 45% 50%;border-width:3px">
          Our Programs
        </a>
      </div>
    </div>
    <!-- Right - blob collage -->
    <div class="flex-1 relative">
      <div class="relative w-full max-w-md mx-auto">
        <!-- Main blob -->
        <div class="crayon-texture bg-crayon-yellow/20 p-8 relative" style="border-radius:40% 60% 55% 45% / 60% 40% 50% 50%">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white/90 p-5 text-center shadow-md float-1 crayon-texture" style="border-radius:50% 50% 40% 60% / 55% 45% 55% 45%">
              <svg class="mx-auto mb-2" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="16" r="8" fill="#ef4444" opacity="0.8"/><circle cx="14" cy="22" r="6" fill="#eab308" opacity="0.7"/><circle cx="26" cy="22" r="6" fill="#0ea5e9" opacity="0.7"/><rect x="17" y="26" width="6" height="10" rx="2" fill="#8B4513" opacity="0.6"/></svg>
              <div class="font-display font-semibold text-gray-700 text-sm">Art Studio</div>
            </div>
            <div class="bg-white/90 p-5 text-center shadow-md float-2 crayon-texture" style="border-radius:45% 55% 55% 45% / 50% 50% 55% 45%">
              <svg class="mx-auto mb-2" width="40" height="40" viewBox="0 0 40 40"><circle cx="12" cy="24" r="7" fill="none" stroke="#0ea5e9" stroke-width="2.5"/><circle cx="28" cy="24" r="7" fill="none" stroke="#22c55e" stroke-width="2.5"/><line x1="19" y1="24" x2="21" y2="24" stroke="#eab308" stroke-width="2"/><path d="M12,17 L12,8 Q12,6 14,6 L18,6" stroke="#0ea5e9" stroke-width="2" fill="none"/><path d="M28,17 L28,8 Q28,6 26,6 L22,6" stroke="#22c55e" stroke-width="2" fill="none"/></svg>
              <div class="font-display font-semibold text-gray-700 text-sm">Music</div>
            </div>
            <div class="bg-white/90 p-5 text-center shadow-md float-3 crayon-texture" style="border-radius:55% 45% 45% 55% / 45% 55% 50% 50%">
              <svg class="mx-auto mb-2" width="40" height="40" viewBox="0 0 40 40"><path d="M20,34 L20,18" stroke="#8B5E3C" stroke-width="3" stroke-linecap="round"/><ellipse cx="20" cy="14" rx="10" ry="10" fill="#22c55e" opacity="0.7"/><ellipse cx="14" cy="16" rx="6" ry="7" fill="#16a34a" opacity="0.6"/><ellipse cx="26" cy="16" rx="6" ry="7" fill="#4ade80" opacity="0.5"/><circle cx="22" cy="11" r="2" fill="#ef4444"/></svg>
              <div class="font-display font-semibold text-gray-700 text-sm">Nature</div>
            </div>
            <div class="bg-white/90 p-5 text-center shadow-md float-1 crayon-texture" style="border-radius:50% 50% 50% 50% / 60% 40% 55% 45%;animation-delay:1.5s">
              <svg class="mx-auto mb-2" width="40" height="40" viewBox="0 0 40 40"><rect x="6" y="10" width="28" height="22" rx="3" fill="none" stroke="#fda4af" stroke-width="2.5"/><rect x="10" y="14" width="8" height="6" rx="1" fill="#ef4444" opacity="0.4"/><rect x="22" y="14" width="8" height="6" rx="1" fill="#0ea5e9" opacity="0.4"/><rect x="10" y="24" width="20" height="3" rx="1" fill="#eab308" opacity="0.3"/></svg>
              <div class="font-display font-semibold text-gray-700 text-sm">Reading</div>
            </div>
          </div>
        </div>
        <!-- Floating decorations -->
        <svg class="absolute -top-6 -right-6 twinkle" width="32" height="32" viewBox="0 0 32 32"><polygon points="16,2 20,12 30,12 22,18 25,28 16,22 7,28 10,18 2,12 12,12" fill="#eab308"/></svg>
        <svg class="absolute -bottom-4 -left-6 float-2" width="50" height="30" viewBox="0 0 50 30"><path d="M5,25 Q2,25 2,18 Q2,12 8,12 Q10,5 18,6 Q25,2 32,6 Q38,3 42,8 Q48,8 48,16 Q48,25 40,25 Z" fill="#0ea5e9" opacity="0.25"/></svg>
        <div class="absolute top-1/2 -right-10 w-6 h-6 rounded-full bg-crayon-pink float-3 opacity-50"></div>
      </div>
    </div>
  </div>
</div>
</section>

<!-- ============ PROGRAMS (with wobbly SVG borders) ============ -->
<section id="programs" class="py-20 relative">
<!-- Section blob bg -->
<div class="absolute top-0 right-0 w-[300px] h-[300px] bg-crayon-green/8 -z-10" style="border-radius:40% 60% 55% 45% / 60% 40% 50% 50%"></div>

<div class="max-w-6xl mx-auto px-6">
  <div class="text-center mb-16 reveal">
    <h2 class="font-display font-bold text-3xl md:text-4xl text-gray-800">Our Programs</h2>
    <div class="flex justify-center gap-2 mt-3">
      <span class="w-3 h-3 rounded-full bg-crayon-red"></span>
      <span class="w-3 h-3 rounded-full bg-crayon-yellow"></span>
      <span class="w-3 h-3 rounded-full bg-crayon-blue"></span>
      <span class="w-3 h-3 rounded-full bg-crayon-green"></span>
    </div>
    <p class="text-gray-500 mt-4 max-w-md mx-auto">Age-appropriate learning through play, exploration, and creativity</p>
  </div>

  <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Card 1: Nursery -->
    <div class="reveal relative p-6 bg-crayon-red/5 crayon-texture hover:scale-105 transition-all cursor-pointer" style="transition-delay:0s">
      <svg class="absolute inset-0 w-full h-full" viewBox="0 0 300 320" preserveAspectRatio="none" fill="none">
        <path d="M15,8 Q60,2 150,6 Q240,2 285,10 Q295,15 292,80 Q296,160 290,240 Q293,300 280,310 Q220,318 150,315 Q80,318 20,310 Q6,300 8,240 Q4,160 10,80 Q6,15 15,8 Z" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" fill="rgba(239,68,68,0.03)"/>
      </svg>
      <div class="relative z-10">
        <div class="w-14 h-14 mb-4 flex items-center justify-center bg-crayon-red/15" style="border-radius:50% 50% 40% 60% / 55% 45% 55% 45%">
          <svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="10" r="6" fill="#ef4444" opacity="0.7"/><path d="M6,26 Q6,18 14,18 Q22,18 22,26" fill="#ef4444" opacity="0.5"/><circle cx="11" cy="9" r="1" fill="white"/><circle cx="17" cy="9" r="1" fill="white"/><path d="M11,12 Q14,15 17,12" stroke="white" stroke-width="0.8" fill="none"/></svg>
        </div>
        <h3 class="font-display font-bold text-lg text-gray-800 mb-1">Nursery</h3>
        <span class="font-display text-xs font-semibold text-crayon-red bg-crayon-red/10 px-3 py-1 inline-block mb-3" style="border-radius:40% 60% 50% 50% / 50% 50% 60% 40%">2-3 years</span>
        <p class="text-gray-500 text-sm leading-relaxed">Gentle introduction to group play, sensory exploration, and early social skills in a warm, caring environment.</p>
      </div>
    </div>

    <!-- Card 2: Pre-K -->
    <div class="reveal relative p-6 bg-crayon-yellow/5 crayon-texture hover:scale-105 transition-all cursor-pointer" style="transition-delay:0.08s">
      <svg class="absolute inset-0 w-full h-full" viewBox="0 0 300 320" preserveAspectRatio="none" fill="none">
        <path d="M12,12 Q80,4 150,8 Q230,3 288,12 Q296,20 294,90 Q298,170 292,250 Q296,305 282,314 Q210,320 150,316 Q90,320 18,314 Q4,305 8,250 Q3,170 6,90 Q4,20 12,12 Z" stroke="#eab308" stroke-width="2.5" stroke-linecap="round" fill="rgba(234,179,8,0.03)"/>
      </svg>
      <div class="relative z-10">
        <div class="w-14 h-14 mb-4 flex items-center justify-center bg-crayon-yellow/15" style="border-radius:55% 45% 50% 50% / 45% 55% 50% 50%">
          <svg width="28" height="28" viewBox="0 0 28 28"><rect x="4" y="6" width="20" height="16" rx="2" fill="#eab308" opacity="0.5"/><rect x="7" y="9" width="6" height="4" rx="1" fill="#fef9ef"/><rect x="15" y="9" width="6" height="4" rx="1" fill="#fef9ef"/><rect x="7" y="15" width="14" height="2" rx="1" fill="#fef9ef" opacity="0.7"/><rect x="7" y="19" width="10" height="2" rx="1" fill="#fef9ef" opacity="0.5"/></svg>
        </div>
        <h3 class="font-display font-bold text-lg text-gray-800 mb-1">Pre-K</h3>
        <span class="font-display text-xs font-semibold text-crayon-yellow bg-crayon-yellow/10 px-3 py-1 inline-block mb-3" style="border-radius:45% 55% 55% 45% / 55% 45% 50% 50%">3-4 years</span>
        <p class="text-gray-500 text-sm leading-relaxed">Building curiosity through storytelling, art projects, early literacy, and structured group activities.</p>
      </div>
    </div>

    <!-- Card 3: Kindergarten -->
    <div class="reveal relative p-6 bg-crayon-blue/5 crayon-texture hover:scale-105 transition-all cursor-pointer" style="transition-delay:0.16s">
      <svg class="absolute inset-0 w-full h-full" viewBox="0 0 300 320" preserveAspectRatio="none" fill="none">
        <path d="M18,6 Q100,1 150,5 Q210,1 282,8 Q294,14 290,85 Q295,165 288,245 Q294,308 278,315 Q200,322 150,318 Q100,322 22,315 Q8,308 12,245 Q5,165 10,85 Q6,14 18,6 Z" stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round" fill="rgba(14,165,233,0.03)"/>
      </svg>
      <div class="relative z-10">
        <div class="w-14 h-14 mb-4 flex items-center justify-center bg-crayon-blue/15" style="border-radius:45% 55% 45% 55% / 50% 50% 55% 45%">
          <svg width="28" height="28" viewBox="0 0 28 28"><polygon points="14,3 18,11 27,11 20,16 22,25 14,20 6,25 8,16 1,11 10,11" fill="#0ea5e9" opacity="0.6"/><text x="14" y="17" text-anchor="middle" font-size="7" fill="white" font-weight="bold">K</text></svg>
        </div>
        <h3 class="font-display font-bold text-lg text-gray-800 mb-1">Kindergarten</h3>
        <span class="font-display text-xs font-semibold text-crayon-blue bg-crayon-blue/10 px-3 py-1 inline-block mb-3" style="border-radius:50% 50% 45% 55% / 45% 55% 55% 45%">4-5 years</span>
        <p class="text-gray-500 text-sm leading-relaxed">School-readiness with phonics, numbers, science experiments, and collaborative learning projects.</p>
      </div>
    </div>

    <!-- Card 4: After School -->
    <div class="reveal relative p-6 bg-crayon-green/5 crayon-texture hover:scale-105 transition-all cursor-pointer" style="transition-delay:0.24s">
      <svg class="absolute inset-0 w-full h-full" viewBox="0 0 300 320" preserveAspectRatio="none" fill="none">
        <path d="M14,10 Q70,3 150,7 Q240,3 286,10 Q296,18 293,88 Q297,168 291,248 Q295,306 280,313 Q215,320 150,317 Q85,320 20,313 Q5,306 9,248 Q4,168 7,88 Q5,18 14,10 Z" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" fill="rgba(34,197,94,0.03)"/>
      </svg>
      <div class="relative z-10">
        <div class="w-14 h-14 mb-4 flex items-center justify-center bg-crayon-green/15" style="border-radius:50% 50% 50% 50% / 55% 45% 50% 50%">
          <svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.6"/><line x1="14" y1="7" x2="14" y2="14" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="14" x2="19" y2="17" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/><circle cx="14" cy="14" r="1.5" fill="#22c55e"/></svg>
        </div>
        <h3 class="font-display font-bold text-lg text-gray-800 mb-1">After School</h3>
        <span class="font-display text-xs font-semibold text-crayon-green bg-crayon-green/10 px-3 py-1 inline-block mb-3" style="border-radius:55% 45% 50% 50% / 50% 55% 45% 55%">5-7 years</span>
        <p class="text-gray-500 text-sm leading-relaxed">Homework help, enrichment activities, sports, and creative workshops until parents arrive.</p>
      </div>
    </div>
  </div>
</div>
</section>

<!-- ============ ACTIVITIES (scattered circles) ============ -->
<section id="gallery" class="py-20 bg-white relative overflow-hidden" style="border-radius:3rem 3rem 0 0">
<div class="max-w-6xl mx-auto px-6">
  <div class="text-center mb-16 reveal">
    <h2 class="font-display font-bold text-3xl md:text-4xl text-gray-800">Fun Activities</h2>
    <p class="text-gray-500 mt-3">Every day is filled with creative exploration</p>
  </div>

  <div class="flex flex-wrap justify-center gap-6 md:gap-8 reveal">
    <!-- Art -->
    <div class="scatter-1 hover:scale-110 transition-all cursor-pointer group">
      <div class="w-28 h-28 md:w-36 md:h-36 rounded-full bg-crayon-red/10 flex flex-col items-center justify-center border-3 border-crayon-red/30 group-hover:border-crayon-red/60 transition-colors" style="border-width:3px">
        <svg width="36" height="36" viewBox="0 0 36 36"><circle cx="10" cy="10" r="5" fill="#ef4444" opacity="0.7"/><circle cx="20" cy="8" r="4" fill="#eab308" opacity="0.7"/><circle cx="15" cy="18" r="5" fill="#0ea5e9" opacity="0.6"/><path d="M8,30 L12,16 Q13,14 14,16 L18,30" fill="#8B5E3C" opacity="0.5"/></svg>
        <span class="font-display font-semibold text-sm text-gray-700 mt-1">Art</span>
      </div>
    </div>
    <!-- Music -->
    <div class="scatter-2 hover:scale-110 transition-all cursor-pointer group mt-8 md:mt-12">
      <div class="w-28 h-28 md:w-36 md:h-36 rounded-full bg-crayon-yellow/10 flex flex-col items-center justify-center border-3 border-crayon-yellow/30 group-hover:border-crayon-yellow/60 transition-colors" style="border-width:3px">
        <svg width="36" height="36" viewBox="0 0 36 36"><circle cx="10" cy="26" r="5" fill="#eab308" opacity="0.6"/><circle cx="26" cy="22" r="5" fill="#eab308" opacity="0.6"/><line x1="15" y1="26" x2="15" y2="8" stroke="#eab308" stroke-width="2"/><line x1="31" y1="22" x2="31" y2="4" stroke="#eab308" stroke-width="2"/><path d="M15,8 Q15,4 23,6 L31,4" stroke="#eab308" stroke-width="2" fill="none"/></svg>
        <span class="font-display font-semibold text-sm text-gray-700 mt-1">Music</span>
      </div>
    </div>
    <!-- Dance -->
    <div class="scatter-3 hover:scale-110 transition-all cursor-pointer group">
      <div class="w-28 h-28 md:w-36 md:h-36 rounded-full bg-crayon-pink/15 flex flex-col items-center justify-center border-3 border-crayon-pink/40 group-hover:border-crayon-pink/70 transition-colors" style="border-width:3px">
        <svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="8" r="4" fill="#fda4af" opacity="0.8"/><line x1="18" y1="12" x2="18" y2="24" stroke="#fda4af" stroke-width="2.5" stroke-linecap="round"/><line x1="18" y1="16" x2="10" y2="20" stroke="#fda4af" stroke-width="2" stroke-linecap="round"/><line x1="18" y1="16" x2="26" y2="13" stroke="#fda4af" stroke-width="2" stroke-linecap="round"/><line x1="18" y1="24" x2="12" y2="32" stroke="#fda4af" stroke-width="2" stroke-linecap="round"/><line x1="18" y1="24" x2="25" y2="30" stroke="#fda4af" stroke-width="2" stroke-linecap="round"/></svg>
        <span class="font-display font-semibold text-sm text-gray-700 mt-1">Dance</span>
      </div>
    </div>
    <!-- Science -->
    <div class="scatter-4 hover:scale-110 transition-all cursor-pointer group mt-4 md:mt-8">
      <div class="w-28 h-28 md:w-36 md:h-36 rounded-full bg-crayon-green/10 flex flex-col items-center justify-center border-3 border-crayon-green/30 group-hover:border-crayon-green/60 transition-colors" style="border-width:3px">
        <svg width="36" height="36" viewBox="0 0 36 36"><path d="M14,4 L14,16 L6,30 Q4,34 10,34 L26,34 Q32,34 30,30 L22,16 L22,4" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/><line x1="11" y1="4" x2="25" y2="4" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/><ellipse cx="18" cy="28" rx="6" ry="3" fill="#22c55e" opacity="0.3"/><circle cx="15" cy="25" r="2" fill="#0ea5e9" opacity="0.4"/><circle cx="21" cy="27" r="1.5" fill="#eab308" opacity="0.4"/></svg>
        <span class="font-display font-semibold text-sm text-gray-700 mt-1">Science</span>
      </div>
    </div>
    <!-- Reading -->
    <div class="scatter-5 hover:scale-110 transition-all cursor-pointer group">
      <div class="w-28 h-28 md:w-36 md:h-36 rounded-full bg-crayon-blue/10 flex flex-col items-center justify-center border-3 border-crayon-blue/30 group-hover:border-crayon-blue/60 transition-colors" style="border-width:3px">
        <svg width="36" height="36" viewBox="0 0 36 36"><path d="M4,8 Q4,6 6,6 L16,6 Q18,6 18,8 L18,30 Q16,28 6,28 Q4,28 4,26 Z" fill="#0ea5e9" opacity="0.4"/><path d="M32,8 Q32,6 30,6 L20,6 Q18,6 18,8 L18,30 Q20,28 30,28 Q32,28 32,26 Z" fill="#0ea5e9" opacity="0.3"/><line x1="8" y1="12" x2="14" y2="12" stroke="white" stroke-width="1" opacity="0.8"/><line x1="8" y1="16" x2="14" y2="16" stroke="white" stroke-width="1" opacity="0.6"/><line x1="8" y1="20" x2="12" y2="20" stroke="white" stroke-width="1" opacity="0.4"/></svg>
        <span class="font-display font-semibold text-sm text-gray-700 mt-1">Reading</span>
      </div>
    </div>
  </div>
</div>
</section>

<!-- ============ DAILY SCHEDULE (colorful timeline) ============ -->
<section class="py-20 bg-white">
<div class="max-w-3xl mx-auto px-6">
  <div class="text-center mb-16 reveal">
    <h2 class="font-display font-bold text-3xl md:text-4xl text-gray-800">A Day at Little Stars</h2>
    <p class="text-gray-500 mt-3">Structured yet flexible, every moment matters</p>
  </div>

  <div class="relative reveal">
    <!-- Timeline line -->
    <div class="absolute left-6 md:left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-crayon-red via-crayon-yellow via-crayon-blue via-crayon-green to-crayon-pink" style="border-radius:9999px"></div>

    <div class="space-y-6">
      <!-- 8:00 -->
      <div class="flex items-start gap-4 md:gap-6 pl-2">
        <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-crayon-red flex items-center justify-center flex-shrink-0 shadow-md shadow-red-200 timeline-dot z-10" style="border-color:#ef4444">
          <span class="text-white font-display font-bold text-xs">8:00</span>
        </div>
        <div class="bg-crayon-red/5 p-4 flex-1 crayon-texture" style="border-radius:1.2rem 1.5rem 1.5rem 0.8rem">
          <h4 class="font-display font-bold text-gray-800">Arrival & Free Play</h4>
          <p class="text-gray-500 text-sm mt-1">Warm greetings, settling in, and choosing morning activities</p>
        </div>
      </div>
      <!-- 9:00 -->
      <div class="flex items-start gap-4 md:gap-6 pl-2">
        <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-crayon-yellow flex items-center justify-center flex-shrink-0 shadow-md shadow-yellow-200 timeline-dot z-10" style="border-color:#eab308">
          <span class="text-white font-display font-bold text-xs">9:00</span>
        </div>
        <div class="bg-crayon-yellow/5 p-4 flex-1 crayon-texture" style="border-radius:1.5rem 1.2rem 0.8rem 1.5rem">
          <h4 class="font-display font-bold text-gray-800">Circle Time</h4>
          <p class="text-gray-500 text-sm mt-1">Songs, stories, and sharing. Building community together</p>
        </div>
      </div>
      <!-- 10:00 -->
      <div class="flex items-start gap-4 md:gap-6 pl-2">
        <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-crayon-blue flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200 timeline-dot z-10" style="border-color:#0ea5e9">
          <span class="text-white font-display font-bold text-xs">10:00</span>
        </div>
        <div class="bg-crayon-blue/5 p-4 flex-1 crayon-texture" style="border-radius:1rem 1.5rem 1.5rem 1.2rem">
          <h4 class="font-display font-bold text-gray-800">Learning Adventures</h4>
          <p class="text-gray-500 text-sm mt-1">Theme-based lessons with hands-on activities and exploration</p>
        </div>
      </div>
      <!-- 11:30 -->
      <div class="flex items-start gap-4 md:gap-6 pl-2">
        <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-crayon-green flex items-center justify-center flex-shrink-0 shadow-md shadow-green-200 timeline-dot z-10" style="border-color:#22c55e">
          <span class="text-white font-display font-bold text-xs">11:30</span>
        </div>
        <div class="bg-crayon-green/5 p-4 flex-1 crayon-texture" style="border-radius:1.5rem 1rem 1.2rem 1.5rem">
          <h4 class="font-display font-bold text-gray-800">Lunch Time</h4>
          <p class="text-gray-500 text-sm mt-1">Nutritious meals prepared fresh, family-style dining</p>
        </div>
      </div>
      <!-- 1:00 -->
      <div class="flex items-start gap-4 md:gap-6 pl-2">
        <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-crayon-pink flex items-center justify-center flex-shrink-0 shadow-md shadow-pink-200 timeline-dot z-10" style="border-color:#fda4af">
          <span class="text-white font-display font-bold text-xs">1:00</span>
        </div>
        <div class="bg-crayon-pink/10 p-4 flex-1 crayon-texture" style="border-radius:1.2rem 1.5rem 1rem 1.5rem">
          <h4 class="font-display font-bold text-gray-800">Nap / Quiet Time</h4>
          <p class="text-gray-500 text-sm mt-1">Rest and recharge with soft music and cozy blankets</p>
        </div>
      </div>
      <!-- 2:30 -->
      <div class="flex items-start gap-4 md:gap-6 pl-2">
        <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-crayon-yellow flex items-center justify-center flex-shrink-0 shadow-md shadow-yellow-200 timeline-dot z-10" style="border-color:#eab308">
          <span class="text-white font-display font-bold text-xs">2:30</span>
        </div>
        <div class="bg-crayon-yellow/5 p-4 flex-1 crayon-texture" style="border-radius:1.5rem 1.2rem 1.5rem 1rem">
          <h4 class="font-display font-bold text-gray-800">Outdoor Play</h4>
          <p class="text-gray-500 text-sm mt-1">Playground adventures, nature walks, and active games</p>
        </div>
      </div>
      <!-- 4:00 -->
      <div class="flex items-start gap-4 md:gap-6 pl-2">
        <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-crayon-red flex items-center justify-center flex-shrink-0 shadow-md shadow-red-200 timeline-dot z-10" style="border-color:#ef4444">
          <span class="text-white font-display font-bold text-xs">4:00</span>
        </div>
        <div class="bg-crayon-red/5 p-4 flex-1 crayon-texture" style="border-radius:1rem 1.5rem 1.2rem 1.5rem">
          <h4 class="font-display font-bold text-gray-800">Pickup Time</h4>
          <p class="text-gray-500 text-sm mt-1">Share the day's highlights, pack up, and head home happy</p>
        </div>
      </div>
    </div>
  </div>
</div>
</section>

<!-- ============ TESTIMONIALS (speech bubbles) ============ -->
<section class="py-20 relative" style="background:linear-gradient(180deg,#fef9ef 0%,#fef3e2 100%)">
<div class="absolute top-10 left-10 w-[200px] h-[200px] bg-crayon-yellow/10 -z-0" style="border-radius:60% 40% 45% 55% / 40% 60% 50% 50%"></div>

<div class="max-w-6xl mx-auto px-6 relative z-10">
  <div class="text-center mb-16 reveal">
    <h2 class="font-display font-bold text-3xl md:text-4xl text-gray-800">Happy Parents Say</h2>
    <p class="text-gray-500 mt-3">Hear from families in our Little Stars community</p>
  </div>

  <div class="grid md:grid-cols-3 gap-8">
    <!-- Testimonial 1 -->
    <div class="reveal" style="transition-delay:0s">
      <div class="speech-bubble p-6 shadow-md hover:shadow-xl transition-all">
        <div class="flex gap-1 mb-3">
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed mb-4">"My daughter used to cry at drop-off. Within two weeks at Little Stars, she was running to her teacher with a huge smile. The warmth here is truly special."</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-crayon-red/15 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="8" r="4" fill="#ef4444" opacity="0.5"/><path d="M3,20 Q3,14 10,14 Q17,14 17,20" fill="#ef4444" opacity="0.3"/></svg>
          </div>
          <div>
            <div class="font-display font-bold text-gray-800 text-sm">Sarah M.</div>
            <div class="text-gray-400 text-xs">Parent of Emma, Pre-K</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Testimonial 2 -->
    <div class="reveal" style="transition-delay:0.1s">
      <div class="speech-bubble p-6 shadow-md hover:shadow-xl transition-all">
        <div class="flex gap-1 mb-3">
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed mb-4">"The bilingual program is amazing. My son now counts in English and sings songs from school all weekend. The teachers make learning feel like pure play."</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-crayon-blue/15 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="8" r="4" fill="#0ea5e9" opacity="0.5"/><path d="M3,20 Q3,14 10,14 Q17,14 17,20" fill="#0ea5e9" opacity="0.3"/></svg>
          </div>
          <div>
            <div class="font-display font-bold text-gray-800 text-sm">David L.</div>
            <div class="text-gray-400 text-xs">Parent of Max, Kindergarten</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Testimonial 3 -->
    <div class="reveal" style="transition-delay:0.2s">
      <div class="speech-bubble p-6 shadow-md hover:shadow-xl transition-all">
        <div class="flex gap-1 mb-3">
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
          <svg width="18" height="18" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308"/></svg>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed mb-4">"We visited five kindergartens before choosing Little Stars. The organic approach to learning and genuinely caring staff made the decision easy."</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-crayon-green/15 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="8" r="4" fill="#22c55e" opacity="0.5"/><path d="M3,20 Q3,14 10,14 Q17,14 17,20" fill="#22c55e" opacity="0.3"/></svg>
          </div>
          <div>
            <div class="font-display font-bold text-gray-800 text-sm">Jennifer K.</div>
            <div class="text-gray-400 text-xs">Parent of Lily, Nursery</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</section>

<!-- ============ ENROLLMENT CTA ============ -->
<section id="enroll" class="py-20 bg-white relative overflow-hidden">
<!-- Background blobs -->
<div class="absolute -top-20 -right-20 w-[400px] h-[400px] bg-crayon-red/8" style="border-radius:40% 60% 55% 45% / 60% 40% 50% 50%"></div>
<div class="absolute -bottom-20 -left-20 w-[350px] h-[350px] bg-crayon-blue/8" style="border-radius:55% 45% 50% 50% / 45% 55% 50% 50%"></div>

<div class="max-w-5xl mx-auto px-6 relative z-10">
  <div class="text-center mb-12 reveal">
    <h2 class="font-display font-bold text-3xl md:text-4xl text-gray-800">Join Our Family</h2>
    <p class="text-gray-500 mt-3 max-w-md mx-auto">Take the first step towards a wonderful learning journey for your child</p>
  </div>

  <div class="max-w-lg mx-auto reveal">
    <div class="bg-paper p-8 shadow-lg crayon-texture relative" style="border-radius:2rem 2.5rem 2rem 2.5rem">
      <!-- Wobbly border -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 520" preserveAspectRatio="none" fill="none">
        <path d="M20,15 Q100,5 250,10 Q400,5 480,15 Q495,25 490,130 Q495,260 488,390 Q493,490 475,508 Q380,518 250,515 Q120,518 25,508 Q7,490 12,390 Q5,260 10,130 Q5,25 20,15 Z" stroke="#eab308" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
      </svg>

      <div class="relative z-10">
        <div class="text-center mb-6">
          <svg class="mx-auto" width="48" height="48" viewBox="0 0 48 48"><polygon points="24,4 30,18 44,18 32,26 36,40 24,32 12,40 16,26 4,18 18,18" fill="#eab308" stroke="#ef4444" stroke-width="0.5"/><text x="24" y="25" text-anchor="middle" font-size="10" fill="#fef9ef" font-weight="bold" font-family="Fredoka">!</text></svg>
          <p class="font-display font-semibold text-gray-600 text-sm mt-2">Limited spots available for 2026!</p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="font-display text-sm font-semibold text-gray-700 mb-1 block">Child's Name</label>
            <input type="text" placeholder="e.g. Emma" class="w-full px-4 py-3 bg-white border-2 border-crayon-yellow/30 focus:border-crayon-yellow focus:outline-none text-sm" style="border-radius:1rem 1.2rem 1rem 1.2rem">
          </div>
          <div>
            <label class="font-display text-sm font-semibold text-gray-700 mb-1 block">Child's Age</label>
            <select class="w-full px-4 py-3 bg-white border-2 border-crayon-blue/30 focus:border-crayon-blue focus:outline-none text-sm text-gray-500" style="border-radius:1.2rem 1rem 1.2rem 1rem">
              <option>Select age group</option>
              <option>2-3 years (Nursery)</option>
              <option>3-4 years (Pre-K)</option>
              <option>4-5 years (Kindergarten)</option>
              <option>5-7 years (After School)</option>
            </select>
          </div>
          <div>
            <label class="font-display text-sm font-semibold text-gray-700 mb-1 block">Parent's Name</label>
            <input type="text" placeholder="Your full name" class="w-full px-4 py-3 bg-white border-2 border-crayon-green/30 focus:border-crayon-green focus:outline-none text-sm" style="border-radius:1rem 1.2rem 1rem 1.2rem">
          </div>
          <div>
            <label class="font-display text-sm font-semibold text-gray-700 mb-1 block">Phone Number</label>
            <input type="tel" placeholder="(555) 123-4567" class="w-full px-4 py-3 bg-white border-2 border-crayon-pink/30 focus:border-crayon-pink focus:outline-none text-sm" style="border-radius:1.2rem 1rem 1.2rem 1rem">
          </div>
          <button onclick="showToast('Thank you! We will contact you within 24 hours to schedule a visit.')" class="w-full font-display font-bold text-white py-3.5 text-lg bg-crayon-red hover:scale-[1.02] transition-all cursor-pointer shadow-lg shadow-red-200 mt-2" style="border-radius:40% 60% 50% 50% / 60% 40% 55% 45%">
            Start the Adventure
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
</section>

<!-- ============ FOOTER ============ -->
<footer class="relative py-12 overflow-hidden" style="background:#2d2a26;border-radius:2.5rem 2.5rem 0 0">
<div class="max-w-6xl mx-auto px-6">
  <div class="grid md:grid-cols-3 gap-8 mb-8">
    <!-- Brand -->
    <div>
      <div class="flex items-center gap-2 mb-4">
        <svg width="32" height="32" viewBox="0 0 36 36"><polygon points="18,2 22,13 34,13 24,20 28,31 18,24 8,31 12,20 2,13 14,13" fill="#eab308" stroke="#ef4444" stroke-width="1"/></svg>
        <span class="font-display font-bold text-xl text-white">Little Stars</span>
      </div>
      <p class="text-gray-400 text-sm leading-relaxed">Where every child shines. Nurturing curiosity, creativity, and confidence since 2010.</p>
      <!-- Playful crayon dots -->
      <div class="flex gap-2 mt-4">
        <span class="w-3 h-3 rounded-full bg-crayon-red"></span>
        <span class="w-3 h-3 rounded-full bg-crayon-yellow"></span>
        <span class="w-3 h-3 rounded-full bg-crayon-blue"></span>
        <span class="w-3 h-3 rounded-full bg-crayon-green"></span>
        <span class="w-3 h-3 rounded-full bg-crayon-pink"></span>
      </div>
    </div>
    <!-- Hours & Address -->
    <div>
      <h4 class="font-display font-bold text-white mb-4">Visit Us</h4>
      <div class="space-y-3 text-gray-400 text-sm">
        <p>123 Sunshine Avenue<br>Maplewood, CA 90210</p>
        <p>Mon - Fri: 7:30 AM - 6:00 PM<br>Saturday Tours: 9:00 AM - 12:00 PM</p>
        <p>Phone: (555) 234-5678<br>Email: hello@littlestars.edu</p>
      </div>
    </div>
    <!-- Safety / Certifications -->
    <div>
      <h4 class="font-display font-bold text-white mb-4">Safety & Trust</h4>
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-crayon-green/20 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8,1 L14,4 L14,8 Q14,13 8,15 Q2,13 2,8 L2,4 Z" fill="#22c55e" opacity="0.7"/><path d="M5,8 L7,10 L11,6" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
          </div>
          <span class="text-gray-400 text-sm">State Licensed & Certified</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-crayon-blue/20 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#0ea5e9" opacity="0.7"/><path d="M5,8 L7,10 L11,6" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
          </div>
          <span class="text-gray-400 text-sm">CPR & First Aid Trained Staff</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-crayon-yellow/20 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16"><polygon points="8,1 10,6 16,6 11,9 13,15 8,11 3,15 5,9 0,6 6,6" fill="#eab308" opacity="0.7"/></svg>
          </div>
          <span class="text-gray-400 text-sm">5-Star Parent Rating</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-crayon-red/20 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="4" width="12" height="8" rx="1.5" fill="#ef4444" opacity="0.7"/><circle cx="8" cy="8" r="2" fill="white" opacity="0.8"/></svg>
          </div>
          <span class="text-gray-400 text-sm">24/7 Security Cameras</span>
        </div>
      </div>
    </div>
  </div>

  <div class="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
    <p class="text-gray-500 text-sm">&copy; 2026 Little Stars Kindergarten. All rights reserved.</p>
    <!-- Decorative star line -->
    <div class="flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#ef4444" opacity="0.5"/></svg>
      <svg width="14" height="14" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#eab308" opacity="0.5"/></svg>
      <svg width="14" height="14" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#0ea5e9" opacity="0.5"/></svg>
      <svg width="14" height="14" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#22c55e" opacity="0.5"/></svg>
      <svg width="14" height="14" viewBox="0 0 20 20"><polygon points="10,1 13,7 20,7 14,11 16,18 10,14 4,18 6,11 0,7 7,7" fill="#fda4af" opacity="0.5"/></svg>
    </div>
  </div>
</div>
</footer>

<!-- Toast Notification -->
<div id="toast" class="fixed bottom-6 right-6 bg-gray-800 text-white px-6 py-3.5 z-50 translate-y-20 opacity-0 transition-all duration-500 font-display font-semibold text-sm shadow-2xl" style="border-radius:1.2rem 1.5rem 1.2rem 1.5rem"></div>

<script>
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.remove('translate-y-20','opacity-0');
  setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3500);
}

// Scroll reveal with bouncy easing
const revealObs=new IntersectionObserver((entries)=>{
  entries.forEach((e,i)=>{
    if(e.isIntersecting){
      // Stagger children if they have transition-delay already set
      setTimeout(()=>{
        e.target.classList.add('visible');
      }, 50);
      revealObs.unobserve(e.target);
    }
  });
},{threshold:0.08,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach(el=>revealObs.observe(el));

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    const target=document.querySelector(a.getAttribute('href'));
    if(target){
      target.scrollIntoView({behavior:'smooth',block:'start'});
    }
  });
});

// Close mobile menu on outside click
document.addEventListener('click',(e)=>{
  const menu=document.getElementById('mobileMenu');
  const btn=document.getElementById('mobileMenuBtn');
  if(menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)){
    menu.classList.remove('open');
  }
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
