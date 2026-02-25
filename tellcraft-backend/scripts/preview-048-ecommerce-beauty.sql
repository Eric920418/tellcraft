INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '678bc311-9132-4f1f-a65b-9fd7f6e28204',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bloom Beauty</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{rose:'#e11d48',nude:'#d4a574','soft-pink':'#fce7f3',charcoal:'#292524',blush:'#fff1f2',cream:'#fefcfb',petal:'#ffe4e6'},fontFamily:{display:['"Cormorant Garamond"','serif'],body:['Raleway','sans-serif']}}}}
</script>
<style>
body{font-family:'Raleway',sans-serif;color:#292524}
html{scroll-behavior:smooth}
.reveal{opacity:0;transform:translateY(24px);transition:all 0.7s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.droplet-swatch{cursor:pointer;transition:all 0.3s ease;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.1))}
.droplet-swatch:hover{transform:scale(1.15) translateY(-2px);filter:drop-shadow(0 4px 6px rgba(0,0,0,0.15))}
.droplet-swatch.active{transform:scale(1.2) translateY(-3px);filter:drop-shadow(0 4px 8px rgba(0,0,0,0.2))}
.ingredient-card{transition:all 0.4s cubic-bezier(0.4,0,0.2,1)}
.ingredient-card:hover{transform:translateY(-6px);box-shadow:0 20px 40px rgba(225,29,72,0.08)}
.product-card{transition:all 0.4s cubic-bezier(0.4,0,0.2,1)}
.product-card:hover{transform:translateY(-4px);box-shadow:0 16px 32px rgba(0,0,0,0.08)}
.product-card:hover .product-visual{transform:scale(1.05)}
.product-visual{transition:transform 0.5s cubic-bezier(0.4,0,0.2,1)}
.hero-droplet{animation:float 6s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-12px) rotate(3deg)}}
.shimmer{background:linear-gradient(110deg,transparent 40%,rgba(255,255,255,0.5) 50%,transparent 60%);background-size:200% 100%;animation:shimmer 3s infinite}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
</style>
</head>
<body class="bg-cream overflow-x-hidden">

<!-- Header -->
<nav class="sticky top-0 bg-cream/95 backdrop-blur-sm z-50 border-b border-rose/5">
  <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2.5 cursor-pointer">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="6" fill="#fce7f3"/>
        <ellipse cx="14" cy="7" rx="3" ry="5" fill="#e11d48" opacity="0.7"/>
        <ellipse cx="20" cy="11.5" rx="3" ry="5" transform="rotate(72 20 11.5)" fill="#e11d48" opacity="0.6"/>
        <ellipse cx="18.5" cy="18.5" rx="3" ry="5" transform="rotate(144 18.5 18.5)" fill="#e11d48" opacity="0.5"/>
        <ellipse cx="9.5" cy="18.5" rx="3" ry="5" transform="rotate(216 9.5 18.5)" fill="#e11d48" opacity="0.55"/>
        <ellipse cx="8" cy="11.5" rx="3" ry="5" transform="rotate(288 8 11.5)" fill="#e11d48" opacity="0.65"/>
        <circle cx="14" cy="14" r="3" fill="#e11d48"/>
      </svg>
      <div>
        <span class="font-display text-xl font-semibold tracking-wide text-charcoal">Bloom Beauty</span>
      </div>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#skincare" class="text-sm text-charcoal/60 hover:text-rose transition-colors tracking-wide cursor-pointer">Skincare</a>
      <a href="#makeup" class="text-sm text-charcoal/60 hover:text-rose transition-colors tracking-wide cursor-pointer">Makeup</a>
      <a href="#hair" class="text-sm text-charcoal/60 hover:text-rose transition-colors tracking-wide cursor-pointer">Hair</a>
      <a href="#sets" class="text-sm text-charcoal/60 hover:text-rose transition-colors tracking-wide cursor-pointer">Sets</a>
    </div>
    <div class="flex items-center gap-5">
      <button class="text-charcoal/50 hover:text-rose transition-colors cursor-pointer">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </button>
      <button onclick="document.getElementById('cartDrawer').classList.remove('translate-x-full')" class="relative text-charcoal/50 hover:text-rose transition-colors cursor-pointer">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <span id="cartBadge" class="absolute -top-1.5 -right-2 bg-rose text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold hidden">1</span>
      </button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="py-20 md:py-28 relative overflow-hidden">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div class="reveal">
        <p class="text-rose text-xs tracking-[0.25em] uppercase font-semibold mb-4">Luxury Skincare</p>
        <h1 class="font-display text-5xl md:text-6xl lg:text-7xl font-semibold text-charcoal leading-[1.1] mb-6">
          Radiance<br><em class="text-rose font-normal">Serum</em>
        </h1>
        <p class="text-charcoal/50 leading-relaxed mb-3 max-w-sm text-sm">Unlock your skin's natural luminosity with our award-winning formula. Pure botanicals, visible results.</p>
        <p class="font-display text-3xl text-charcoal font-semibold mb-8">$68</p>
        <a href="#makeup" class="inline-block bg-rose text-white px-10 py-3.5 rounded-full text-sm font-semibold hover:bg-rose/90 transition-all shadow-lg shadow-rose/20 cursor-pointer tracking-wide">Shop Now</a>
      </div>
      <div class="relative flex items-center justify-center reveal">
        <!-- Large Hero Droplet SVG -->
        <div class="hero-droplet">
          <svg width="260" height="340" viewBox="0 0 260 340" fill="none">
            <defs>
              <linearGradient id="heroGrad" x1="130" y1="0" x2="130" y2="340" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#fce7f3"/>
                <stop offset="50%" stop-color="#e11d48" stop-opacity="0.15"/>
                <stop offset="100%" stop-color="#d4a574" stop-opacity="0.2"/>
              </linearGradient>
              <linearGradient id="heroStroke" x1="130" y1="0" x2="130" y2="340" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#e11d48" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#d4a574" stop-opacity="0.2"/>
              </linearGradient>
            </defs>
            <path d="M130 10 C130 10, 240 140, 240 210 C240 280, 190 330, 130 330 C70 330, 20 280, 20 210 C20 140, 130 10, 130 10Z" fill="url(#heroGrad)" stroke="url(#heroStroke)" stroke-width="1"/>
            <path d="M130 50 C130 50, 200 150, 200 200 C200 250, 170 280, 130 280 C90 280, 60 250, 60 200 C60 150, 130 50, 130 50Z" fill="white" fill-opacity="0.3"/>
            <!-- Inner product silhouette -->
            <rect x="110" y="120" width="40" height="100" rx="8" fill="white" fill-opacity="0.5"/>
            <rect x="118" y="100" width="24" height="30" rx="4" fill="white" fill-opacity="0.4"/>
            <text x="130" y="250" text-anchor="middle" font-family="Cormorant Garamond" font-size="14" fill="#e11d48" opacity="0.6">30ml</text>
          </svg>
        </div>
        <!-- Floating accent dots -->
        <div class="absolute top-8 right-12 w-3 h-3 bg-rose/20 rounded-full animate-pulse"></div>
        <div class="absolute bottom-16 left-8 w-2 h-2 bg-nude/40 rounded-full animate-pulse" style="animation-delay:1s"></div>
      </div>
    </div>
  </div>
</section>

<!-- Featured Product: Velvet Lip Color with Droplet Swatches -->
<section id="makeup" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div class="flex justify-center reveal">
        <div class="bg-soft-pink/30 rounded-[2.5rem] w-80 h-96 flex items-center justify-center relative overflow-hidden">
          <div class="product-visual">
            <svg width="80" height="160" viewBox="0 0 80 160" fill="none">
              <rect x="20" y="10" width="40" height="100" rx="20" fill="#292524" opacity="0.8"/>
              <rect x="24" y="14" width="32" height="50" rx="16" id="lipProductFill" fill="#e11d48"/>
              <rect x="28" y="110" width="24" height="40" rx="4" fill="#292524" opacity="0.6"/>
              <line x1="28" y1="110" x2="52" y2="110" stroke="#d4a574" stroke-width="1.5"/>
            </svg>
          </div>
          <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2">
            <div class="text-[10px] text-charcoal/40 uppercase tracking-wider">Selected</div>
            <div id="selectedShadeName" class="text-sm font-semibold text-charcoal">Rose</div>
          </div>
        </div>
      </div>
      <div class="reveal">
        <p class="text-rose text-xs tracking-[0.25em] uppercase font-semibold mb-3">Bestseller</p>
        <h2 class="font-display text-3xl md:text-4xl font-semibold text-charcoal mb-2">Velvet Lip Color</h2>
        <p class="text-charcoal/50 text-sm mb-6 leading-relaxed">Creamy, long-wearing lip color with a velvety matte finish. Enriched with shea butter for all-day comfort.</p>
        <p class="font-display text-2xl text-charcoal font-semibold mb-6">$34</p>

        <!-- Droplet Swatches -->
        <div class="mb-3">
          <p class="text-xs text-charcoal/40 uppercase tracking-wider mb-3">Choose Your Shade</p>
          <div class="flex items-end gap-4" id="swatchRow">
            <!-- Berry -->
            <div class="text-center">
              <svg class="droplet-swatch" data-shade="Berry" data-color="#881337" width="36" height="48" viewBox="0 0 36 48" onclick="selectShade(this)">
                <path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#881337"/>
                <path d="M18 10 C18 10, 27 24, 27 29 C27 35, 23 39, 18 39 C13 39, 9 35, 9 29 C9 24, 18 10, 18 10Z" fill="#9f1239" opacity="0.5"/>
              </svg>
              <span class="text-[10px] text-charcoal/40 mt-1 block">Berry</span>
            </div>
            <!-- Nude -->
            <div class="text-center">
              <svg class="droplet-swatch" data-shade="Nude" data-color="#d4a574" width="36" height="48" viewBox="0 0 36 48" onclick="selectShade(this)">
                <path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#d4a574"/>
                <path d="M18 10 C18 10, 27 24, 27 29 C27 35, 23 39, 18 39 C13 39, 9 35, 9 29 C9 24, 18 10, 18 10Z" fill="#e0b68a" opacity="0.5"/>
              </svg>
              <span class="text-[10px] text-charcoal/40 mt-1 block">Nude</span>
            </div>
            <!-- Rose (default active) -->
            <div class="text-center">
              <svg class="droplet-swatch active" data-shade="Rose" data-color="#e11d48" width="36" height="48" viewBox="0 0 36 48" onclick="selectShade(this)">
                <path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#e11d48"/>
                <path d="M18 10 C18 10, 27 24, 27 29 C27 35, 23 39, 18 39 C13 39, 9 35, 9 29 C9 24, 18 10, 18 10Z" fill="#f43f5e" opacity="0.5"/>
              </svg>
              <span class="text-[10px] text-charcoal/40 mt-1 block">Rose</span>
            </div>
            <!-- Coral -->
            <div class="text-center">
              <svg class="droplet-swatch" data-shade="Coral" data-color="#ea580c" width="36" height="48" viewBox="0 0 36 48" onclick="selectShade(this)">
                <path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#ea580c"/>
                <path d="M18 10 C18 10, 27 24, 27 29 C27 35, 23 39, 18 39 C13 39, 9 35, 9 29 C9 24, 18 10, 18 10Z" fill="#f97316" opacity="0.5"/>
              </svg>
              <span class="text-[10px] text-charcoal/40 mt-1 block">Coral</span>
            </div>
            <!-- Plum -->
            <div class="text-center">
              <svg class="droplet-swatch" data-shade="Plum" data-color="#7e22ce" width="36" height="48" viewBox="0 0 36 48" onclick="selectShade(this)">
                <path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#7e22ce"/>
                <path d="M18 10 C18 10, 27 24, 27 29 C27 35, 23 39, 18 39 C13 39, 9 35, 9 29 C9 24, 18 10, 18 10Z" fill="#9333ea" opacity="0.5"/>
              </svg>
              <span class="text-[10px] text-charcoal/40 mt-1 block">Plum</span>
            </div>
          </div>
        </div>

        <button onclick="addToCart('Velvet Lip Color',34)" class="mt-6 bg-charcoal text-white px-10 py-3.5 rounded-full text-sm font-semibold hover:bg-charcoal/90 transition-all cursor-pointer tracking-wide">Add to Bag</button>
      </div>
    </div>
  </div>
</section>

<!-- Ingredient Breakdown -->
<section id="skincare" class="py-20 bg-cream">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <p class="text-rose text-xs tracking-[0.25em] uppercase font-semibold mb-3">The Science</p>
      <h2 class="font-display text-3xl md:text-4xl font-semibold text-charcoal">Ingredient Breakdown</h2>
      <p class="text-charcoal/40 text-sm mt-3 max-w-md mx-auto">Every formula is built on clinically proven actives, ethically sourced from nature.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Hyaluronic Acid -->
      <div class="ingredient-card bg-white rounded-2xl p-8 text-center reveal cursor-pointer">
        <div class="w-16 h-16 bg-soft-pink/40 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 4 C16 4, 26 14, 26 20 C26 26, 21 30, 16 30 C11 30, 6 26, 6 20 C6 14, 16 4, 16 4Z" fill="#e11d48" opacity="0.15"/>
            <path d="M16 10 C16 10, 22 16, 22 20 C22 24, 19 26, 16 26 C13 26, 10 24, 10 20 C10 16, 16 10, 16 10Z" fill="#e11d48" opacity="0.25"/>
            <circle cx="16" cy="20" r="3" fill="#e11d48" opacity="0.4"/>
          </svg>
        </div>
        <h3 class="font-display text-xl font-semibold text-charcoal mb-2">Hyaluronic Acid</h3>
        <p class="text-xs text-rose font-semibold uppercase tracking-wider mb-3">Deep Hydration</p>
        <p class="text-charcoal/50 text-sm leading-relaxed">Holds 1000x its weight in water, plumping fine lines and delivering moisture to every layer of skin.</p>
      </div>
      <!-- Vitamin C -->
      <div class="ingredient-card bg-white rounded-2xl p-8 text-center reveal cursor-pointer" style="transition-delay:0.1s">
        <div class="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="10" fill="#d4a574" opacity="0.15"/>
            <circle cx="16" cy="16" r="6" fill="#d4a574" opacity="0.25"/>
            <line x1="16" y1="2" x2="16" y2="8" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
            <line x1="16" y1="24" x2="16" y2="30" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
            <line x1="2" y1="16" x2="8" y2="16" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
            <line x1="24" y1="16" x2="30" y2="16" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
            <line x1="6" y1="6" x2="10" y2="10" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
            <line x1="22" y1="22" x2="26" y2="26" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
            <line x1="6" y1="26" x2="10" y2="22" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
            <line x1="22" y1="10" x2="26" y2="6" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
            <circle cx="16" cy="16" r="3" fill="#d4a574" opacity="0.6"/>
          </svg>
        </div>
        <h3 class="font-display text-xl font-semibold text-charcoal mb-2">Vitamin C</h3>
        <p class="text-xs text-nude font-semibold uppercase tracking-wider mb-3">Radiant Glow</p>
        <p class="text-charcoal/50 text-sm leading-relaxed">Potent antioxidant that brightens dark spots, evens skin tone, and shields against environmental damage.</p>
      </div>
      <!-- Retinol -->
      <div class="ingredient-card bg-white rounded-2xl p-8 text-center reveal cursor-pointer" style="transition-delay:0.2s">
        <div class="w-16 h-16 bg-rose/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 6 L20 14 L28 16 L20 18 L16 26 L12 18 L4 16 L12 14Z" fill="#e11d48" opacity="0.12"/>
            <path d="M16 10 L18 14 L22 16 L18 18 L16 22 L14 18 L10 16 L14 14Z" fill="#e11d48" opacity="0.25"/>
            <circle cx="16" cy="16" r="3" fill="#e11d48" opacity="0.35"/>
            <path d="M13 8 Q16 6 19 8" stroke="#e11d48" stroke-width="1" fill="none" opacity="0.3"/>
            <path d="M13 24 Q16 26 19 24" stroke="#e11d48" stroke-width="1" fill="none" opacity="0.3"/>
          </svg>
        </div>
        <h3 class="font-display text-xl font-semibold text-charcoal mb-2">Retinol</h3>
        <p class="text-xs text-rose font-semibold uppercase tracking-wider mb-3">Cellular Renewal</p>
        <p class="text-charcoal/50 text-sm leading-relaxed">Gold standard in anti-aging. Accelerates cell turnover, refines texture, and boosts collagen production.</p>
      </div>
    </div>
  </div>
</section>

<!-- Products Grid -->
<section id="hair" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <p class="text-rose text-xs tracking-[0.25em] uppercase font-semibold mb-3">The Collection</p>
      <h2 class="font-display text-3xl md:text-4xl font-semibold text-charcoal">Curated for You</h2>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-6" id="productsGrid">
      <!-- Product 1 -->
      <div class="product-card bg-cream rounded-2xl overflow-hidden reveal cursor-pointer">
        <div class="aspect-square bg-gradient-to-br from-soft-pink/30 to-rose/5 flex items-center justify-center relative overflow-hidden">
          <div class="product-visual w-12 h-20 bg-gradient-to-b from-rose/20 to-rose/40 rounded-xl shimmer"></div>
          <div class="absolute top-3 right-3 text-[10px] bg-rose text-white px-2 py-0.5 rounded-full font-semibold">New</div>
        </div>
        <div class="p-4">
          <h3 class="font-display text-base font-semibold text-charcoal mb-1">Petal Glow Serum</h3>
          <p class="text-charcoal/40 text-xs mb-3">Brightening + Hydrating</p>
          <div class="flex items-center gap-2 mb-3">
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#fce7f3"/></svg>
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#e11d48"/></svg>
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#d4a574"/></svg>
          </div>
          <div class="flex items-center justify-between">
            <span class="font-display text-lg font-semibold text-charcoal">$52</span>
            <button onclick="event.stopPropagation();addToCart('Petal Glow Serum',52)" class="w-8 h-8 bg-rose/10 rounded-full flex items-center justify-center text-rose hover:bg-rose hover:text-white transition-colors cursor-pointer text-sm">+</button>
          </div>
        </div>
      </div>
      <!-- Product 2 -->
      <div class="product-card bg-cream rounded-2xl overflow-hidden reveal cursor-pointer" style="transition-delay:0.05s">
        <div class="aspect-square bg-gradient-to-br from-amber-50 to-nude/20 flex items-center justify-center relative overflow-hidden">
          <div class="product-visual w-14 h-14 bg-gradient-to-b from-nude/30 to-nude/50 rounded-full shimmer"></div>
        </div>
        <div class="p-4">
          <h3 class="font-display text-base font-semibold text-charcoal mb-1">Cloud Cream</h3>
          <p class="text-charcoal/40 text-xs mb-3">Weightless Moisturizer</p>
          <div class="flex items-center gap-2 mb-3">
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#fce7f3"/></svg>
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#d4a574"/></svg>
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#292524" opacity="0.6"/></svg>
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#ea580c"/></svg>
          </div>
          <div class="flex items-center justify-between">
            <span class="font-display text-lg font-semibold text-charcoal">$44</span>
            <button onclick="event.stopPropagation();addToCart('Cloud Cream',44)" class="w-8 h-8 bg-rose/10 rounded-full flex items-center justify-center text-rose hover:bg-rose hover:text-white transition-colors cursor-pointer text-sm">+</button>
          </div>
        </div>
      </div>
      <!-- Product 3 -->
      <div class="product-card bg-cream rounded-2xl overflow-hidden reveal cursor-pointer" style="transition-delay:0.1s">
        <div class="aspect-square bg-gradient-to-br from-rose/5 to-soft-pink/30 flex items-center justify-center relative overflow-hidden">
          <div class="product-visual w-10 h-24 bg-gradient-to-b from-rose/15 to-rose/35 rounded-lg shimmer"></div>
          <div class="absolute top-3 right-3 text-[10px] bg-charcoal text-white px-2 py-0.5 rounded-full font-semibold">Hot</div>
        </div>
        <div class="p-4">
          <h3 class="font-display text-base font-semibold text-charcoal mb-1">Silk Hair Oil</h3>
          <p class="text-charcoal/40 text-xs mb-3">Repair + Shine</p>
          <div class="flex items-center gap-2 mb-3">
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#d4a574"/></svg>
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#fce7f3"/></svg>
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#881337"/></svg>
          </div>
          <div class="flex items-center justify-between">
            <span class="font-display text-lg font-semibold text-charcoal">$38</span>
            <button onclick="event.stopPropagation();addToCart('Silk Hair Oil',38)" class="w-8 h-8 bg-rose/10 rounded-full flex items-center justify-center text-rose hover:bg-rose hover:text-white transition-colors cursor-pointer text-sm">+</button>
          </div>
        </div>
      </div>
      <!-- Product 4 -->
      <div class="product-card bg-cream rounded-2xl overflow-hidden reveal cursor-pointer" style="transition-delay:0.15s">
        <div class="aspect-square bg-gradient-to-br from-soft-pink/20 to-petal/30 flex items-center justify-center relative overflow-hidden">
          <div class="product-visual w-16 h-6 bg-gradient-to-r from-rose/20 via-nude/30 to-soft-pink/40 rounded-full shimmer"></div>
        </div>
        <div class="p-4">
          <h3 class="font-display text-base font-semibold text-charcoal mb-1">Blush Palette</h3>
          <p class="text-charcoal/40 text-xs mb-3">6-Shade Cheek Color</p>
          <div class="flex items-center gap-2 mb-3">
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#e11d48"/></svg>
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#fce7f3"/></svg>
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#ea580c"/></svg>
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#d4a574"/></svg>
            <svg class="droplet-swatch" width="16" height="22" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#7e22ce"/></svg>
          </div>
          <div class="flex items-center justify-between">
            <span class="font-display text-lg font-semibold text-charcoal">$46</span>
            <button onclick="event.stopPropagation();addToCart('Blush Palette',46)" class="w-8 h-8 bg-rose/10 rounded-full flex items-center justify-center text-rose hover:bg-rose hover:text-white transition-colors cursor-pointer text-sm">+</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Routine Builder -->
<section id="sets" class="py-20 bg-soft-pink/20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <p class="text-rose text-xs tracking-[0.25em] uppercase font-semibold mb-3">Curated Ritual</p>
      <h2 class="font-display text-3xl md:text-4xl font-semibold text-charcoal">Morning Routine</h2>
      <p class="text-charcoal/40 text-sm mt-3 max-w-md mx-auto">Three simple steps to radiant, dewy skin every morning.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Step 1 -->
      <div class="bg-white rounded-2xl p-8 text-center reveal group cursor-pointer relative">
        <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-rose text-white rounded-full flex items-center justify-center font-display text-lg font-semibold">1</div>
        <div class="w-20 h-20 bg-soft-pink/30 rounded-full mx-auto mb-5 flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg width="32" height="40" viewBox="0 0 36 48" fill="none">
            <path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#e11d48" opacity="0.2"/>
            <path d="M18 14 C18 14, 26 22, 26 27 C26 32, 22 35, 18 35 C14 35, 10 32, 10 27 C10 22, 18 14, 18 14Z" fill="#e11d48" opacity="0.35"/>
          </svg>
        </div>
        <h3 class="font-display text-xl font-semibold text-charcoal mb-1">Cleanse</h3>
        <p class="text-charcoal/40 text-xs mb-1">Gentle Foaming Wash</p>
        <p class="text-charcoal/50 text-sm leading-relaxed mb-4">Remove impurities without stripping natural oils. Leaves skin soft and prepped.</p>
        <p class="font-display text-lg font-semibold text-rose">$28</p>
        <button onclick="addToCart('Gentle Foaming Wash',28)" class="mt-3 text-xs bg-rose/10 text-rose px-5 py-2 rounded-full hover:bg-rose hover:text-white transition-colors cursor-pointer font-semibold tracking-wide">Add to Bag</button>
      </div>
      <!-- Step 2 -->
      <div class="bg-white rounded-2xl p-8 text-center reveal group cursor-pointer relative" style="transition-delay:0.1s">
        <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-rose text-white rounded-full flex items-center justify-center font-display text-lg font-semibold">2</div>
        <div class="w-20 h-20 bg-amber-50 rounded-full mx-auto mb-5 flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="10" fill="#d4a574" opacity="0.15"/>
            <circle cx="16" cy="16" r="6" fill="#d4a574" opacity="0.25"/>
            <circle cx="16" cy="16" r="3" fill="#d4a574" opacity="0.5"/>
            <line x1="16" y1="2" x2="16" y2="7" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
            <line x1="16" y1="25" x2="16" y2="30" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
            <line x1="2" y1="16" x2="7" y2="16" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
            <line x1="25" y1="16" x2="30" y2="16" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
          </svg>
        </div>
        <h3 class="font-display text-xl font-semibold text-charcoal mb-1">Treat</h3>
        <p class="text-charcoal/40 text-xs mb-1">Radiance Serum</p>
        <p class="text-charcoal/50 text-sm leading-relaxed mb-4">Vitamin C + Hyaluronic Acid. Brightens, plumps, and protects throughout the day.</p>
        <p class="font-display text-lg font-semibold text-rose">$68</p>
        <button onclick="addToCart('Radiance Serum',68)" class="mt-3 text-xs bg-rose/10 text-rose px-5 py-2 rounded-full hover:bg-rose hover:text-white transition-colors cursor-pointer font-semibold tracking-wide">Add to Bag</button>
      </div>
      <!-- Step 3 -->
      <div class="bg-white rounded-2xl p-8 text-center reveal group cursor-pointer relative" style="transition-delay:0.2s">
        <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-rose text-white rounded-full flex items-center justify-center font-display text-lg font-semibold">3</div>
        <div class="w-20 h-20 bg-rose/5 rounded-full mx-auto mb-5 flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect x="8" y="6" width="16" height="20" rx="4" fill="#e11d48" opacity="0.12"/>
            <rect x="11" y="9" width="10" height="14" rx="2" fill="#e11d48" opacity="0.2"/>
            <circle cx="16" cy="16" r="3" fill="#e11d48" opacity="0.3"/>
          </svg>
        </div>
        <h3 class="font-display text-xl font-semibold text-charcoal mb-1">Protect</h3>
        <p class="text-charcoal/40 text-xs mb-1">Cloud Cream SPF 30</p>
        <p class="text-charcoal/50 text-sm leading-relaxed mb-4">Lightweight moisture with broad-spectrum UV protection. No white cast, no greasiness.</p>
        <p class="font-display text-lg font-semibold text-rose">$44</p>
        <button onclick="addToCart('Cloud Cream SPF 30',44)" class="mt-3 text-xs bg-rose/10 text-rose px-5 py-2 rounded-full hover:bg-rose hover:text-white transition-colors cursor-pointer font-semibold tracking-wide">Add to Bag</button>
      </div>
    </div>
    <div class="text-center mt-12 reveal">
      <button onclick="addToCart('Morning Routine Set',119);showToast('Complete routine added - you saved $21!')" class="bg-rose text-white px-10 py-4 rounded-full font-semibold hover:bg-rose/90 transition-all shadow-lg shadow-rose/20 cursor-pointer tracking-wide">
        Get the Routine &mdash; <span class="line-through opacity-70">$140</span> $119
      </button>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-charcoal text-white py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid md:grid-cols-4 gap-10 mb-12">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="6" fill="#fce7f3" opacity="0.3"/>
            <ellipse cx="14" cy="7" rx="3" ry="5" fill="#e11d48" opacity="0.5"/>
            <ellipse cx="20" cy="11.5" rx="3" ry="5" transform="rotate(72 20 11.5)" fill="#e11d48" opacity="0.4"/>
            <ellipse cx="18.5" cy="18.5" rx="3" ry="5" transform="rotate(144 18.5 18.5)" fill="#e11d48" opacity="0.35"/>
            <ellipse cx="9.5" cy="18.5" rx="3" ry="5" transform="rotate(216 9.5 18.5)" fill="#e11d48" opacity="0.4"/>
            <ellipse cx="8" cy="11.5" rx="3" ry="5" transform="rotate(288 8 11.5)" fill="#e11d48" opacity="0.45"/>
            <circle cx="14" cy="14" r="3" fill="#e11d48" opacity="0.6"/>
          </svg>
          <span class="font-display text-lg font-semibold tracking-wide">Bloom Beauty</span>
        </div>
        <p class="text-white/40 text-xs leading-relaxed">Pure botanicals, proven results. Beauty that blooms from within.</p>
      </div>
      <div>
        <h4 class="text-sm font-semibold mb-4 tracking-wide">Shop</h4>
        <div class="space-y-2.5 text-white/40 text-xs">
          <p class="hover:text-rose transition-colors cursor-pointer">Skincare</p>
          <p class="hover:text-rose transition-colors cursor-pointer">Makeup</p>
          <p class="hover:text-rose transition-colors cursor-pointer">Hair Care</p>
          <p class="hover:text-rose transition-colors cursor-pointer">Gift Sets</p>
        </div>
      </div>
      <div>
        <h4 class="text-sm font-semibold mb-4 tracking-wide">Our Promise</h4>
        <div class="space-y-2.5 text-white/40 text-xs">
          <p class="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Cruelty-Free & Vegan
          </p>
          <p class="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            Clean Ingredients
          </p>
          <p class="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            Dermatologist Tested
          </p>
          <p class="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Sustainably Sourced
          </p>
        </div>
      </div>
      <div>
        <h4 class="text-sm font-semibold mb-4 tracking-wide">Follow Us</h4>
        <div class="flex gap-3">
          <div class="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-rose transition-colors cursor-pointer">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="18" cy="6" r="1" fill="currentColor"/></svg>
          </div>
          <div class="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-rose transition-colors cursor-pointer">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
          </div>
          <div class="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-rose transition-colors cursor-pointer">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
          </div>
        </div>
        <div class="mt-6">
          <p class="text-white/30 text-[10px] uppercase tracking-wider mb-2">Newsletter</p>
          <div class="flex gap-2">
            <input type="email" placeholder="Your email" class="bg-white/10 text-white text-xs px-3 py-2 rounded-full flex-1 outline-none focus:bg-white/15 placeholder:text-white/30 border border-white/5 focus:border-rose/30 transition-colors">
            <button onclick="showToast('Welcome to Bloom! Check your inbox for a special offer.')" class="bg-rose text-white text-xs px-4 py-2 rounded-full font-semibold hover:bg-rose/80 transition-colors cursor-pointer">Join</button>
          </div>
        </div>
      </div>
    </div>
    <div class="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-white/25 text-xs">&copy; 2026 Bloom Beauty. All rights reserved.</p>
      <div class="flex gap-6 text-white/25 text-xs">
        <span class="hover:text-white/50 cursor-pointer transition-colors">Privacy</span>
        <span class="hover:text-white/50 cursor-pointer transition-colors">Terms</span>
        <span class="hover:text-white/50 cursor-pointer transition-colors">Accessibility</span>
      </div>
    </div>
  </div>
</footer>

<!-- Cart Drawer -->
<div id="cartDrawer" class="fixed inset-0 z-50 translate-x-full transition-transform duration-300" onclick="if(event.target===this)this.classList.add('translate-x-full')">
  <div class="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" onclick="document.getElementById('cartDrawer').classList.add('translate-x-full')"></div>
  <div class="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white p-6 overflow-y-auto shadow-2xl">
    <div class="flex items-center justify-between mb-8">
      <h3 class="font-display text-xl font-semibold text-charcoal">Your Bag</h3>
      <button onclick="document.getElementById('cartDrawer').classList.add('translate-x-full')" class="w-8 h-8 bg-charcoal/5 rounded-full flex items-center justify-center text-charcoal/40 hover:bg-charcoal/10 cursor-pointer transition-colors">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div id="cartItems" class="space-y-4 mb-6"></div>
    <div id="cartEmpty" class="text-center py-16">
      <svg width="48" height="64" viewBox="0 0 36 48" class="mx-auto mb-4 opacity-20">
        <path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#292524"/>
      </svg>
      <p class="text-charcoal/30 text-sm">Your bag is empty</p>
    </div>
    <div id="cartSummary" class="hidden border-t border-charcoal/10 pt-4">
      <div class="flex justify-between mb-2 text-sm"><span class="text-charcoal/50">Subtotal</span><span id="cartSubtotal" class="font-semibold">$0</span></div>
      <div class="flex justify-between mb-4 text-sm"><span class="text-charcoal/50">Shipping</span><span class="text-emerald-600 font-semibold text-xs">Free over $50</span></div>
      <button onclick="showToast('Checkout coming soon!');document.getElementById('cartDrawer').classList.add('translate-x-full')" class="w-full bg-charcoal text-white py-3.5 rounded-full font-semibold hover:bg-charcoal/90 transition-colors cursor-pointer tracking-wide text-sm">Checkout</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal text-white px-6 py-3 rounded-full shadow-2xl z-[60] translate-y-20 opacity-0 transition-all duration-500 text-sm font-medium tracking-wide whitespace-nowrap"></div>

<script>
// Cart
let cart=[];
function addToCart(name,price){
  const existing=cart.find(i=>i.name===name);
  if(existing){existing.qty++}else{cart.push({name,price,qty:1})}
  updateCart();
  showToast('Added to bag: '+name);
}
function removeFromCart(idx){cart.splice(idx,1);updateCart()}
function updateCart(){
  const count=cart.reduce((s,i)=>s+i.qty,0);
  const badge=document.getElementById('cartBadge');
  if(count>0){badge.textContent=count;badge.classList.remove('hidden')}else{badge.classList.add('hidden')}
  const items=document.getElementById('cartItems');
  const empty=document.getElementById('cartEmpty');
  const summary=document.getElementById('cartSummary');
  if(cart.length===0){items.innerHTML='';empty.classList.remove('hidden');summary.classList.add('hidden');return}
  empty.classList.add('hidden');summary.classList.remove('hidden');
  items.innerHTML=cart.map((item,i)=>`
    <div class="flex items-center gap-4 bg-cream rounded-xl p-3">
      <div class="w-12 h-12 bg-soft-pink/30 rounded-lg flex items-center justify-center">
        <svg width="20" height="28" viewBox="0 0 36 48"><path d="M18 4 C18 4, 33 22, 33 30 C33 39, 26 45, 18 45 C10 45, 3 39, 3 30 C3 22, 18 4, 18 4Z" fill="#e11d48" opacity="0.3"/></svg>
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-sm text-charcoal truncate">${item.name}</div>
        <div class="text-rose text-sm font-semibold">$${item.price} x ${item.qty}</div>
      </div>
      <button onclick="removeFromCart(${i})" class="text-charcoal/20 hover:text-rose cursor-pointer transition-colors">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
  `).join('');
  document.getElementById('cartSubtotal').textContent='$'+cart.reduce((s,i)=>s+i.price*i.qty,0);
}

// Swatch Selection
function selectShade(el){
  document.querySelectorAll('#swatchRow .droplet-swatch').forEach(s=>s.classList.remove('active'));
  el.classList.add('active');
  const shade=el.getAttribute('data-shade');
  const color=el.getAttribute('data-color');
  document.getElementById('selectedShadeName').textContent=shade;
  const fill=document.getElementById('lipProductFill');
  if(fill)fill.setAttribute('fill',color);
}

// Toast
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.remove('translate-y-20','opacity-0');
  setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3000);
}

// Scroll Reveal
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}});
},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'})});
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
