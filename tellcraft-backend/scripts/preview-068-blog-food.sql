INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '23821022-5839-4a77-a488-9e4c7b456ca5',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Flavor & Fork - Discover Flavors from Around the World</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;500;600;700&family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{tomato:{50:'#fef2f2',100:'#fee2e2',200:'#fecaca',400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c'},basil:{50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#166534',800:'#14532d'},saffron:{50:'#fffbeb',100:'#fef3c7',200:'#fde68a',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309'},cream:{50:'#fefce8',100:'#fef9c3',200:'#fef08a'}},fontFamily:{display:['Josefin Sans','sans-serif'],body:['Lato','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Lato',sans-serif;background:#fffdf7;color:#1c1917}
.font-display{font-family:'Josefin Sans',sans-serif}

/* Plate circle frames */
.plate-circle{width:200px;height:200px;border-radius:50%;border:4px solid rgba(217,119,6,0.3);box-shadow:0 0 0 2px rgba(217,119,6,0.1),0 0 0 8px rgba(217,119,6,0.05),0 8px 32px rgba(0,0,0,0.08);position:relative;overflow:hidden;transition:transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94),box-shadow 0.4s}
.plate-circle:hover{transform:scale(1.05) rotate(2deg);box-shadow:0 0 0 2px rgba(217,119,6,0.2),0 0 0 8px rgba(217,119,6,0.1),0 16px 48px rgba(0,0,0,0.12)}
.plate-circle::after{content:'';position:absolute;inset:6px;border-radius:50%;border:1.5px dashed rgba(217,119,6,0.15);pointer-events:none}

.plate-sm{width:80px;height:80px;border-radius:50%;border:3px solid rgba(217,119,6,0.25);box-shadow:0 0 0 2px rgba(217,119,6,0.08),0 4px 12px rgba(0,0,0,0.06);overflow:hidden;flex-shrink:0;transition:transform 0.3s}
.plate-sm:hover{transform:scale(1.08)}

/* Cards */
.recipe-card{transition:transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94),box-shadow 0.3s;cursor:pointer}
.recipe-card:hover{transform:translateY(-6px);box-shadow:0 16px 40px rgba(0,0,0,0.1)}

/* Category strips */
.cat-strip{transition:transform 0.3s}
.cat-strip:hover{transform:scale(1.01)}

/* Scroll reveal */
.reveal{opacity:0;transform:translateY(30px);transition:opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94),transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)}
.reveal.visible{opacity:1;transform:translateY(0)}
.reveal-delay-1{transition-delay:0.1s}
.reveal-delay-2{transition-delay:0.2s}
.reveal-delay-3{transition-delay:0.3s}

/* Nav link */
.nav-link{position:relative;transition:color 0.2s}
.nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:2px;background:#dc2626;transition:width 0.3s}
.nav-link:hover::after{width:100%}
.nav-link:hover{color:#dc2626}

/* Newsletter recipe card */
.recipe-card-frame{background:white;border-radius:12px;border:2px dashed rgba(217,119,6,0.3);position:relative}
.recipe-card-frame::before{content:'Recipe';position:absolute;top:-10px;left:24px;background:#fefce8;padding:0 8px;font-family:'Josefin Sans',sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#d97706}
</style>
</head>
<body>

<!-- Header -->
<header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-saffron-100/60">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2.5 group">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" class="text-tomato-600 transition-transform group-hover:rotate-12">
        <path d="M12 2C11 2 10.5 3 10.5 3L10 5C10 5 9 6 9 8C9 10 10 11 10 11L10.5 14C10.5 14 10 15 10 16C10 17 10.5 18 12 18C13.5 18 14 17 14 16C14 15 13.5 14 13.5 14L14 11C14 11 15 10 15 8C15 6 14 5 14 5L13.5 3C13.5 3 13 2 12 2Z" fill="currentColor" opacity="0.9"/>
        <path d="M12 18V22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M9 22H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <div>
        <span class="font-display text-xl font-bold text-gray-900 tracking-tight">Flavor & Fork</span>
      </div>
    </a>
    <nav class="hidden md:flex items-center gap-8">
      <a class="nav-link text-sm font-semibold text-gray-600 cursor-pointer">Recipes</a>
      <a class="nav-link text-sm font-semibold text-gray-600 cursor-pointer">Reviews</a>
      <a class="nav-link text-sm font-semibold text-gray-600 cursor-pointer">Guides</a>
      <a class="nav-link text-sm font-semibold text-gray-600 cursor-pointer">About</a>
    </nav>
    <div class="flex items-center gap-3">
      <button class="w-9 h-9 rounded-full bg-cream-50 flex items-center justify-center hover:bg-saffron-100 transition cursor-pointer">
        <svg class="w-4 h-4 text-saffron-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" stroke-linecap="round"/></svg>
      </button>
      <button class="hidden sm:flex items-center gap-2 bg-tomato-600 hover:bg-tomato-700 text-white px-4 py-2 rounded-full text-sm font-bold transition cursor-pointer">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Subscribe
      </button>
    </div>
  </div>
</header>

<!-- Hero -->
<section class="relative overflow-hidden" style="background:linear-gradient(135deg, #fefce8 0%, #fef3c7 30%, #ffedd5 60%, #fee2e2 100%)">
  <div class="absolute inset-0 opacity-[0.03]" style="background-image:radial-gradient(circle at 2px 2px, #d97706 1px, transparent 0);background-size:32px 32px"></div>
  <div class="max-w-6xl mx-auto px-6 py-20 flex items-center gap-16 relative">
    <div class="flex-1">
      <div class="flex items-center gap-2 mb-5">
        <span class="w-8 h-[2px] bg-tomato-600"></span>
        <span class="text-xs font-bold text-tomato-600 uppercase tracking-[3px] font-display">Since 2021</span>
      </div>
      <h1 class="font-display text-5xl font-bold text-gray-900 leading-[1.15] mb-5 tracking-tight">Discover Flavors<br>from Around<br>the <span class="text-tomato-600 italic">World</span></h1>
      <p class="text-lg text-gray-500 leading-relaxed mb-8 max-w-md font-light">Curated recipes, honest reviews, and kitchen guides for the passionate home cook. Every dish tells a story.</p>
      <div class="flex items-center gap-4">
        <button class="bg-tomato-600 hover:bg-tomato-700 text-white px-7 py-3 rounded-full font-bold transition shadow-lg shadow-tomato-200 cursor-pointer">Explore Recipes</button>
        <button class="border-2 border-gray-200 hover:border-saffron-400 text-gray-700 px-7 py-3 rounded-full font-bold transition cursor-pointer">Watch Videos</button>
      </div>
      <div class="flex items-center gap-6 mt-8 text-sm text-gray-400">
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-4 text-saffron-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <span class="font-semibold text-gray-600">500+ Recipes</span>
        </div>
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-4 text-basil-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          <span class="font-semibold text-gray-600">12K Readers</span>
        </div>
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-4 text-tomato-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/></svg>
          <span class="font-semibold text-gray-600">48 Countries</span>
        </div>
      </div>
    </div>
    <div class="hidden lg:block relative">
      <div class="plate-circle" style="width:300px;height:300px">
        <div class="absolute inset-0 bg-gradient-to-br from-saffron-200 via-saffron-300 to-saffron-400 flex items-center justify-center">
          <div class="text-center">
            <div class="w-20 h-20 mx-auto rounded-full bg-white/30 flex items-center justify-center mb-2">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
            </div>
            <span class="text-white font-display font-bold text-sm tracking-wide">FRESH DAILY</span>
          </div>
        </div>
      </div>
      <!-- Decorative small plates -->
      <div class="absolute -top-4 -left-8 plate-sm">
        <div class="w-full h-full bg-gradient-to-br from-tomato-300 to-tomato-500"></div>
      </div>
      <div class="absolute -bottom-6 -left-4 plate-sm" style="width:64px;height:64px">
        <div class="w-full h-full bg-gradient-to-br from-basil-300 to-basil-600"></div>
      </div>
      <div class="absolute top-8 -right-6 plate-sm" style="width:56px;height:56px">
        <div class="w-full h-full bg-gradient-to-br from-cream-100 to-saffron-200"></div>
      </div>
    </div>
  </div>
</section>

<!-- Featured Recipes: 3 plate-circle cards -->
<section class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-xs font-bold text-saffron-600 uppercase tracking-[3px] font-display">Handpicked</span>
      <h2 class="font-display text-3xl font-bold text-gray-900 mt-2">Featured Recipes</h2>
      <p class="text-gray-400 mt-2 font-light">This week's most loved dishes from our kitchen</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
      <!-- Recipe 1 -->
      <div class="recipe-card flex flex-col items-center text-center p-6 rounded-2xl bg-cream-50/50 border border-saffron-100/50 reveal reveal-delay-1">
        <div class="plate-circle mb-6">
          <div class="absolute inset-0 bg-gradient-to-br from-tomato-300 via-tomato-400 to-tomato-600 flex items-center justify-center">
            <div class="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
              <svg class="w-12 h-12 text-white/90" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15 11h.01M11 15h.01M16 16c.5-1.5.5-3 0-4.5M13 13c0-1-.5-2-1.5-2.5"/><circle cx="12" cy="12" r="10"/></svg>
            </div>
          </div>
        </div>
        <span class="inline-block text-[10px] font-bold uppercase tracking-[2px] text-tomato-600 bg-tomato-50 px-3 py-1 rounded-full mb-3 font-display">Italian</span>
        <h3 class="font-display text-xl font-bold text-gray-900 mb-2">Tuscan Tomato Risotto</h3>
        <p class="text-sm text-gray-400 mb-4 font-light leading-relaxed">Creamy arborio rice slow-cooked with San Marzano tomatoes and fresh basil</p>
        <div class="flex items-center gap-4 text-xs text-gray-400 font-semibold">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-saffron-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            45 min
          </span>
          <span class="w-1 h-1 rounded-full bg-gray-300"></span>
          <span>Medium</span>
        </div>
      </div>
      <!-- Recipe 2 -->
      <div class="recipe-card flex flex-col items-center text-center p-6 rounded-2xl bg-cream-50/50 border border-saffron-100/50 reveal reveal-delay-2">
        <div class="plate-circle mb-6">
          <div class="absolute inset-0 bg-gradient-to-br from-saffron-200 via-saffron-400 to-saffron-600 flex items-center justify-center">
            <div class="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
              <svg class="w-12 h-12 text-white/90" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 3c-1.5 0-3 .5-4 1.5C7 5.5 6 7 6 9c0 4 6 12 6 12s6-8 6-12c0-2-1-3.5-2-4.5-1-1-2.5-1.5-4-1.5z"/></svg>
            </div>
          </div>
        </div>
        <span class="inline-block text-[10px] font-bold uppercase tracking-[2px] text-saffron-700 bg-saffron-50 px-3 py-1 rounded-full mb-3 font-display">Asian</span>
        <h3 class="font-display text-xl font-bold text-gray-900 mb-2">Thai Basil Curry</h3>
        <p class="text-sm text-gray-400 mb-4 font-light leading-relaxed">Fragrant coconut curry with lemongrass, galangal, and crispy tofu</p>
        <div class="flex items-center gap-4 text-xs text-gray-400 font-semibold">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-saffron-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            35 min
          </span>
          <span class="w-1 h-1 rounded-full bg-gray-300"></span>
          <span>Easy</span>
        </div>
      </div>
      <!-- Recipe 3 -->
      <div class="recipe-card flex flex-col items-center text-center p-6 rounded-2xl bg-cream-50/50 border border-saffron-100/50 reveal reveal-delay-3">
        <div class="plate-circle mb-6">
          <div class="absolute inset-0 bg-gradient-to-br from-basil-300 via-basil-500 to-basil-700 flex items-center justify-center">
            <div class="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
              <svg class="w-12 h-12 text-white/90" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M7 21h10M12 3v18M5 7c0-1 1-4 7-4s7 3 7 4c0 3-3 5-7 5S5 10 5 7z"/></svg>
            </div>
          </div>
        </div>
        <span class="inline-block text-[10px] font-bold uppercase tracking-[2px] text-basil-700 bg-basil-50 px-3 py-1 rounded-full mb-3 font-display">Mexican</span>
        <h3 class="font-display text-xl font-bold text-gray-900 mb-2">Mole Verde Enchiladas</h3>
        <p class="text-sm text-gray-400 mb-4 font-light leading-relaxed">Corn tortillas filled with roasted chicken and topped with green mole sauce</p>
        <div class="flex items-center gap-4 text-xs text-gray-400 font-semibold">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-saffron-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            60 min
          </span>
          <span class="w-1 h-1 rounded-full bg-gray-300"></span>
          <span>Advanced</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Categories with food-color backgrounds -->
<section class="py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-12 reveal">
      <span class="text-xs font-bold text-tomato-600 uppercase tracking-[3px] font-display">Browse by Cuisine</span>
      <h2 class="font-display text-3xl font-bold text-gray-900 mt-2">Explore Categories</h2>
    </div>
    <div class="flex flex-col gap-4">
      <!-- Italian - Tomato Red -->
      <div class="cat-strip reveal reveal-delay-1 rounded-2xl overflow-hidden cursor-pointer" style="background:linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)">
        <div class="flex items-center justify-between px-8 py-7">
          <div class="flex items-center gap-5">
            <div class="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <h3 class="font-display text-2xl font-bold text-white">Italian</h3>
              <p class="text-white/70 text-sm font-light">Pasta, risotto, pizza & more</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full">86 recipes</span>
            <svg class="w-5 h-5 text-white/70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
      </div>
      <!-- Asian - Saffron -->
      <div class="cat-strip reveal reveal-delay-2 rounded-2xl overflow-hidden cursor-pointer" style="background:linear-gradient(135deg, #d97706 0%, #b45309 100%)">
        <div class="flex items-center justify-between px-8 py-7">
          <div class="flex items-center gap-5">
            <div class="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 3c-1.5 0-3 .5-4 1.5C7 5.5 6 7 6 9c0 4 6 12 6 12s6-8 6-12c0-2-1-3.5-2-4.5-1-1-2.5-1.5-4-1.5z"/></svg>
            </div>
            <div>
              <h3 class="font-display text-2xl font-bold text-white">Asian</h3>
              <p class="text-white/70 text-sm font-light">Thai, Japanese, Chinese & Korean</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full">124 recipes</span>
            <svg class="w-5 h-5 text-white/70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
      </div>
      <!-- Mexican - Basil Green -->
      <div class="cat-strip reveal reveal-delay-3 rounded-2xl overflow-hidden cursor-pointer" style="background:linear-gradient(135deg, #166534 0%, #14532d 100%)">
        <div class="flex items-center justify-between px-8 py-7">
          <div class="flex items-center gap-5">
            <div class="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M7 21h10M12 3v18M5 7c0-1 1-4 7-4s7 3 7 4c0 3-3 5-7 5S5 10 5 7z"/></svg>
            </div>
            <div>
              <h3 class="font-display text-2xl font-bold text-white">Mexican</h3>
              <p class="text-white/70 text-sm font-light">Tacos, enchiladas, salsas & bowls</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full">67 recipes</span>
            <svg class="w-5 h-5 text-white/70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
      </div>
      <!-- French - Cream -->
      <div class="cat-strip reveal rounded-2xl overflow-hidden cursor-pointer border-2 border-saffron-100" style="background:linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)">
        <div class="flex items-center justify-between px-8 py-7">
          <div class="flex items-center gap-5">
            <div class="w-14 h-14 rounded-full bg-saffron-200/50 flex items-center justify-center border-2 border-saffron-300/40">
              <svg class="w-7 h-7 text-saffron-700" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            </div>
            <div>
              <h3 class="font-display text-2xl font-bold text-gray-800">French</h3>
              <p class="text-gray-500 text-sm font-light">Pastries, soups, sauces & classics</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="bg-saffron-200/60 text-saffron-800 text-sm font-bold px-4 py-1.5 rounded-full">53 recipes</span>
            <svg class="w-5 h-5 text-saffron-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Latest Posts with plate-circle thumbnails -->
<section class="py-20 bg-white border-t border-saffron-50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-end justify-between mb-12 reveal">
      <div>
        <span class="text-xs font-bold text-basil-700 uppercase tracking-[3px] font-display">From the Blog</span>
        <h2 class="font-display text-3xl font-bold text-gray-900 mt-2">Latest Posts</h2>
      </div>
      <a class="text-sm font-bold text-tomato-600 hover:text-tomato-700 transition cursor-pointer font-display">View All Posts &rarr;</a>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Post 1 -->
      <article class="recipe-card rounded-2xl bg-cream-50/30 border border-saffron-100/40 overflow-hidden reveal reveal-delay-1">
        <div class="p-6 flex flex-col items-center">
          <div class="plate-sm mb-5" style="width:100px;height:100px;border-width:3px">
            <div class="w-full h-full bg-gradient-to-br from-tomato-200 via-tomato-400 to-saffron-400 flex items-center justify-center">
              <svg class="w-8 h-8 text-white/80" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-[2px] text-saffron-600 font-display mb-2">Guide</span>
          <h3 class="font-display text-lg font-bold text-gray-900 text-center mb-2 leading-snug">The Complete Guide to<br>Homemade Pasta</h3>
          <p class="text-sm text-gray-400 text-center font-light leading-relaxed mb-4">From selecting the right flour to mastering the art of hand-rolling. Everything you need to know.</p>
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <span>Feb 20, 2026</span>
            <span class="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>8 min read</span>
          </div>
        </div>
      </article>
      <!-- Post 2 -->
      <article class="recipe-card rounded-2xl bg-cream-50/30 border border-saffron-100/40 overflow-hidden reveal reveal-delay-2">
        <div class="p-6 flex flex-col items-center">
          <div class="plate-sm mb-5" style="width:100px;height:100px;border-width:3px">
            <div class="w-full h-full bg-gradient-to-br from-basil-200 via-basil-400 to-basil-600 flex items-center justify-center">
              <svg class="w-8 h-8 text-white/80" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </div>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-[2px] text-basil-600 font-display mb-2">Review</span>
          <h3 class="font-display text-lg font-bold text-gray-900 text-center mb-2 leading-snug">5 Kitchen Knives That<br>Changed My Cooking</h3>
          <p class="text-sm text-gray-400 text-center font-light leading-relaxed mb-4">After testing 30+ knives over two years, here are the ones I actually reach for every day.</p>
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <span>Feb 14, 2026</span>
            <span class="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>6 min read</span>
          </div>
        </div>
      </article>
      <!-- Post 3 -->
      <article class="recipe-card rounded-2xl bg-cream-50/30 border border-saffron-100/40 overflow-hidden reveal reveal-delay-3">
        <div class="p-6 flex flex-col items-center">
          <div class="plate-sm mb-5" style="width:100px;height:100px;border-width:3px">
            <div class="w-full h-full bg-gradient-to-br from-saffron-200 via-saffron-400 to-tomato-400 flex items-center justify-center">
              <svg class="w-8 h-8 text-white/80" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            </div>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-[2px] text-tomato-600 font-display mb-2">Tips</span>
          <h3 class="font-display text-lg font-bold text-gray-900 text-center mb-2 leading-snug">Spice Blending 101:<br>Build Your Own Rubs</h3>
          <p class="text-sm text-gray-400 text-center font-light leading-relaxed mb-4">Learn the fundamental ratios behind great spice blends and create signature rubs for any protein.</p>
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <span>Feb 8, 2026</span>
            <span class="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>5 min read</span>
          </div>
        </div>
      </article>
    </div>
  </div>
</section>

<!-- Newsletter - styled like a recipe card -->
<section class="py-20" style="background:linear-gradient(135deg, #fefce8 0%, #fef3c7 50%, #ffedd5 100%)">
  <div class="max-w-2xl mx-auto px-6 reveal">
    <div class="recipe-card-frame p-10 text-center">
      <div class="w-16 h-16 rounded-full bg-saffron-100 flex items-center justify-center mx-auto mb-5 border-2 border-dashed border-saffron-300">
        <svg class="w-8 h-8 text-saffron-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
      </div>
      <h2 class="font-display text-3xl font-bold text-gray-900 mb-3">Get Weekly Recipes</h2>
      <p class="text-gray-500 font-light mb-8 max-w-md mx-auto">Every Sunday morning, a curated collection of seasonal recipes, cooking tips, and kitchen stories delivered to your inbox.</p>
      <div class="flex gap-3 max-w-md mx-auto">
        <input type="email" placeholder="your@email.com" class="flex-1 px-5 py-3 rounded-full border-2 border-saffron-200 bg-white focus:border-tomato-400 focus:outline-none transition text-sm font-medium placeholder:text-gray-300">
        <button class="bg-tomato-600 hover:bg-tomato-700 text-white px-7 py-3 rounded-full font-bold text-sm transition shadow-lg shadow-tomato-100 cursor-pointer whitespace-nowrap">Subscribe</button>
      </div>
      <p class="text-xs text-gray-400 mt-4">Join 12,000+ home cooks. No spam, unsubscribe anytime.</p>
      <!-- Decorative dotted line like recipe card -->
      <div class="mt-8 border-t-2 border-dashed border-saffron-200/60 pt-5 flex items-center justify-center gap-6 text-xs text-gray-400">
        <span class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-saffron-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          Free forever
        </span>
        <span class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-saffron-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          Weekly delivery
        </span>
        <span class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-saffron-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          Exclusive content
        </span>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-gray-900 text-gray-400 py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
      <!-- Brand -->
      <div class="md:col-span-1">
        <div class="flex items-center gap-2.5 mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-tomato-500">
            <path d="M12 2C11 2 10.5 3 10.5 3L10 5C10 5 9 6 9 8C9 10 10 11 10 11L10.5 14C10.5 14 10 15 10 16C10 17 10.5 18 12 18C13.5 18 14 17 14 16C14 15 13.5 14 13.5 14L14 11C14 11 15 10 15 8C15 6 14 5 14 5L13.5 3C13.5 3 13 2 12 2Z" fill="currentColor"/>
            <path d="M12 18V22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M9 22H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span class="font-display text-lg font-bold text-white">Flavor & Fork</span>
        </div>
        <p class="text-sm font-light leading-relaxed text-gray-500">Exploring the world one recipe at a time. From home kitchen to global flavors.</p>
      </div>
      <!-- Popular Cuisines -->
      <div>
        <h4 class="font-display font-bold text-white text-sm uppercase tracking-wider mb-4">Popular Cuisines</h4>
        <ul class="space-y-2.5 text-sm">
          <li><a class="hover:text-saffron-400 transition cursor-pointer">Italian Recipes</a></li>
          <li><a class="hover:text-saffron-400 transition cursor-pointer">Thai Cuisine</a></li>
          <li><a class="hover:text-saffron-400 transition cursor-pointer">Mexican Food</a></li>
          <li><a class="hover:text-saffron-400 transition cursor-pointer">French Pastry</a></li>
          <li><a class="hover:text-saffron-400 transition cursor-pointer">Japanese Dishes</a></li>
        </ul>
      </div>
      <!-- Quick Links -->
      <div>
        <h4 class="font-display font-bold text-white text-sm uppercase tracking-wider mb-4">Quick Links</h4>
        <ul class="space-y-2.5 text-sm">
          <li><a class="hover:text-saffron-400 transition cursor-pointer">All Recipes</a></li>
          <li><a class="hover:text-saffron-400 transition cursor-pointer">Restaurant Reviews</a></li>
          <li><a class="hover:text-saffron-400 transition cursor-pointer">Kitchen Guides</a></li>
          <li><a class="hover:text-saffron-400 transition cursor-pointer">About the Cook</a></li>
          <li><a class="hover:text-saffron-400 transition cursor-pointer">Contact</a></li>
        </ul>
      </div>
      <!-- Social & RSS -->
      <div>
        <h4 class="font-display font-bold text-white text-sm uppercase tracking-wider mb-4">Connect</h4>
        <div class="flex gap-3 mb-5">
          <!-- Instagram -->
          <a class="w-9 h-9 rounded-full bg-gray-800 hover:bg-tomato-600 flex items-center justify-center transition cursor-pointer">
            <svg class="w-4 h-4 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <!-- YouTube -->
          <a class="w-9 h-9 rounded-full bg-gray-800 hover:bg-tomato-600 flex items-center justify-center transition cursor-pointer">
            <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          <!-- Pinterest -->
          <a class="w-9 h-9 rounded-full bg-gray-800 hover:bg-tomato-600 flex items-center justify-center transition cursor-pointer">
            <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>
          </a>
          <!-- RSS -->
          <a class="w-9 h-9 rounded-full bg-gray-800 hover:bg-saffron-600 flex items-center justify-center transition cursor-pointer">
            <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795 0 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.742-7.098-15.772-15.839-15.82zm0-8.18v4.819c12.376.067 22.399 10.089 22.462 22.435h4.83c-.067-15.057-12.239-27.218-27.292-27.254z"/></svg>
          </a>
        </div>
        <p class="text-xs text-gray-600 font-light">Subscribe via RSS for the freshest updates straight to your reader.</p>
      </div>
    </div>
    <div class="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p class="text-xs text-gray-600">&copy; 2026 Flavor & Fork. Made with love and good olive oil.</p>
      <div class="flex items-center gap-4 text-xs text-gray-600">
        <a class="hover:text-gray-400 transition cursor-pointer">Privacy</a>
        <a class="hover:text-gray-400 transition cursor-pointer">Terms</a>
        <a class="hover:text-gray-400 transition cursor-pointer">Sitemap</a>
      </div>
    </div>
  </div>
</footer>

<script>
// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Category filter highlight (for interactive feel)
document.querySelectorAll('.cat-strip').forEach(strip => {
  strip.addEventListener('mouseenter', () => {
    strip.style.transform = 'scale(1.01)';
  });
  strip.addEventListener('mouseleave', () => {
    strip.style.transform = 'scale(1)';
  });
});
</script>
</body>
</html>$HTML$,
  3
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
