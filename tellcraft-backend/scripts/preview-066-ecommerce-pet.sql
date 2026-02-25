INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'c0977dd8-bfe2-4df6-a817-9e0161e69a3c',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PawShop - Everything Your Pet Needs</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Baloo 2', 'cursive'],
        body: ['Nunito', 'sans-serif']
      },
      colors: {
        paw: { 400:'#fb923c', 500:'#ea580c', 600:'#c2410c' },
        forest: { 400:'#22c55e', 500:'#166534', 600:'#14532d' },
        cream: { 50:'#fffdf5', 100:'#fef9c3', 200:'#fef08a' },
        choco: { 400:'#92400e', 500:'#78350f', 600:'#451a03' }
      },
      borderRadius: {
        'card': '1.5rem',
        'pill': '9999px'
      }
    }
  }
}
</script>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Nunito',sans-serif; background:#fffdf5; color:#292524; }
h1,h2,h3,.font-display { font-family:'Baloo 2',cursive; }

/* Size selector silhouettes */
.size-option { cursor:pointer; transition:all .25s; border:3px solid transparent; border-radius:1.25rem; padding:12px 16px; background:#fef9c3; }
.size-option:hover { border-color:#fb923c; background:#fff7ed; }
.size-option.selected { border-color:#ea580c; background:#fff7ed; box-shadow:0 4px 16px rgba(234,88,12,.2); }
.size-option svg { transition:transform .2s; }
.size-option.selected svg { transform:scale(1.08); }
.size-info { max-height:0; opacity:0; overflow:hidden; transition:all .35s ease; }
.size-info.open { max-height:120px; opacity:1; margin-top:8px; }

/* Product cards */
.product-card { transition:all .3s cubic-bezier(.4,0,.2,1); border-radius:1.5rem; }
.product-card:hover { transform:translateY(-8px); box-shadow:0 16px 40px rgba(234,88,12,.12); }

/* Pet type filter */
.pet-filter { cursor:pointer; transition:all .25s; border:2px solid #d6d3d1; border-radius:1rem; padding:10px 16px; background:white; }
.pet-filter:hover { border-color:#ea580c; }
.pet-filter.active { border-color:#ea580c; background:#fff7ed; }
.pet-filter.active svg path, .pet-filter.active svg circle, .pet-filter.active svg ellipse { stroke:#ea580c; }

/* Dog/Cat toggle */
.pet-toggle { cursor:pointer; transition:all .2s; padding:10px 28px; border-radius:9999px; font-weight:700; font-family:'Baloo 2',cursive; font-size:1.05rem; border:2px solid transparent; }
.pet-toggle.active-dog { background:#ea580c; color:white; border-color:#ea580c; }
.pet-toggle.active-cat { background:#166534; color:white; border-color:#166534; }
.pet-toggle:not(.active-dog):not(.active-cat) { background:white; color:#78350f; border-color:#d6d3d1; }
.pet-toggle:not(.active-dog):not(.active-cat):hover { border-color:#ea580c; }

/* Toast */
.toast { position:fixed; bottom:24px; right:24px; background:#166534; color:white; padding:14px 28px; border-radius:1rem; font-size:15px; font-weight:700; font-family:'Baloo 2',cursive; z-index:999; transform:translateY(100px); opacity:0; transition:all .35s cubic-bezier(.4,0,.2,1); display:flex; align-items:center; gap:8px; }
.toast.show { transform:translateY(0); opacity:1; }

/* Cart badge */
.cart-badge { position:absolute; top:-7px; right:-7px; background:#ea580c; color:white; font-size:11px; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-family:'Nunito',sans-serif; }

/* Paw rating */
.paw-rating { display:inline-flex; gap:2px; }
.paw-rating .paw { opacity:.25; font-size:14px; transition:opacity .2s; }
.paw-rating .paw.filled { opacity:1; }

/* Scroll animation */
.fade-up { opacity:0; transform:translateY(24px); transition:all .6s cubic-bezier(.4,0,.2,1); }
.fade-up.visible { opacity:1; transform:translateY(0); }

/* Subscription card shimmer */
.sub-card { position:relative; overflow:hidden; }
.sub-card::before { content:''; position:absolute; top:0; left:-100%; width:100%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent); animation:shimmer 3s infinite; }
@keyframes shimmer { 0%{left:-100%} 100%{left:100%} }

/* Floating paw decorations */
@keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(8deg)} }
.float-paw { animation:float 3.5s ease-in-out infinite; }
.float-paw:nth-child(2) { animation-delay:.6s; }
.float-paw:nth-child(3) { animation-delay:1.2s; }
</style>
</head>
<body>

<!-- Header -->
<header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-cream-100" style="border-radius:0 0 1.5rem 1.5rem">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <div class="flex items-center gap-2.5">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <ellipse cx="8" cy="6" rx="4" ry="5" fill="#ea580c"/>
        <ellipse cx="24" cy="6" rx="4" ry="5" fill="#ea580c"/>
        <ellipse cx="3" cy="16" rx="3.5" ry="4.5" fill="#ea580c"/>
        <ellipse cx="29" cy="16" rx="3.5" ry="4.5" fill="#ea580c"/>
        <ellipse cx="16" cy="20" rx="10" ry="10" fill="#ea580c"/>
      </svg>
      <span class="font-display font-extrabold text-2xl text-choco-500">PawShop</span>
    </div>
    <nav class="hidden md:flex items-center gap-7 font-body text-sm font-bold text-stone-500">
      <a href="#featured" class="hover:text-paw-500 transition">Dogs</a>
      <a href="#products" class="hover:text-paw-500 transition">Cats</a>
      <a href="#subscription" class="hover:text-paw-500 transition">Food</a>
      <a href="#products" class="hover:text-paw-500 transition">Toys</a>
    </nav>
    <div class="flex items-center gap-4">
      <span class="text-xl float-paw">&#128062;</span>
      <div class="relative cursor-pointer" id="cartIcon">
        <svg width="24" height="24" fill="none" stroke="#78350f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
        <div class="cart-badge" id="cartCount">2</div>
      </div>
    </div>
  </div>
</header>

<!-- Hero -->
<section class="relative overflow-hidden py-20 bg-gradient-to-br from-cream-100 via-cream-50 to-white">
  <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
    <div class="flex-1 relative z-10">
      <div class="inline-block bg-paw-500/10 text-paw-500 text-sm font-extrabold px-5 py-2 rounded-pill mb-5 font-display">Free Shipping on $50+</div>
      <h1 class="font-display text-5xl md:text-6xl font-extrabold leading-tight mb-5 text-choco-500">Everything Your<br>Pet <span class="text-paw-500">Needs</span></h1>
      <p class="text-lg text-stone-500 mb-8 max-w-lg font-body">Premium food, cozy beds, fun toys, and everything in between. Because every paw deserves the best.</p>
      <div class="flex gap-3 items-center mb-8">
        <span class="text-sm font-bold text-choco-400 font-display">Shop by Pet:</span>
        <button class="pet-toggle active-dog" id="toggleDog" onclick="setHeroPet('dog')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline -mt-0.5 mr-1"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14 5.172C14 3.782 15.577 2.679 17.5 3c2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5"/><path d="M8 14v.5M16 14v.5M11.25 16.25h1.5L12 17l-.75-.75z"/><path d="M4.42 11.247A13.152 13.152 0 008 14.167c1.242.66 2.615 1.077 4 1.167 1.385-.09 2.758-.507 4-1.167a13.152 13.152 0 003.58-2.92"/></svg>
          Dog
        </button>
        <button class="pet-toggle" id="toggleCat" onclick="setHeroPet('cat')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline -mt-0.5 mr-1"><path d="M12 5c-1.5-2-4.5-2.5-6-1s-1.5 4 0 6c1 1.333 3 3 6 6 3-3 5-4.667 6-6 1.5-2 1.5-4.5 0-6s-4.5-1-6 1z"/><path d="M4 4l2 2M20 4l-2 2"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>
          Cat
        </button>
      </div>
    </div>
    <div class="flex-1 relative hidden md:flex items-center justify-center">
      <!-- Scattered pet toy SVGs -->
      <div class="relative w-80 h-80">
        <svg class="absolute top-4 left-8 float-paw" width="60" height="60" viewBox="0 0 60 60" fill="none"><path d="M10 30c0-4 6-20 20-20s20 16 20 20-6 14-20 14S10 34 10 30z" fill="#fef9c3" stroke="#ea580c" stroke-width="2"/><circle cx="22" cy="28" r="3" fill="#ea580c"/><circle cx="38" cy="28" r="3" fill="#ea580c"/><ellipse cx="30" cy="22" rx="4" ry="2.5" fill="#ea580c" opacity=".5"/></svg>
        <!-- Bone -->
        <svg class="absolute top-20 right-4 float-paw" width="80" height="40" viewBox="0 0 80 40" fill="none"><rect x="20" y="12" width="40" height="16" rx="8" fill="#fef9c3" stroke="#ea580c" stroke-width="2"/><circle cx="18" cy="12" r="8" fill="#fef9c3" stroke="#ea580c" stroke-width="2"/><circle cx="18" cy="28" r="8" fill="#fef9c3" stroke="#ea580c" stroke-width="2"/><circle cx="62" cy="12" r="8" fill="#fef9c3" stroke="#ea580c" stroke-width="2"/><circle cx="62" cy="28" r="8" fill="#fef9c3" stroke="#ea580c" stroke-width="2"/></svg>
        <!-- Ball -->
        <svg class="absolute bottom-12 left-16 float-paw" width="56" height="56" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="24" fill="#fef9c3" stroke="#ea580c" stroke-width="2"/><path d="M16 14c6 8 18 8 24 0" stroke="#ea580c" stroke-width="1.5" fill="none"/><path d="M16 42c6-8 18-8 24 0" stroke="#ea580c" stroke-width="1.5" fill="none"/><line x1="28" y1="4" x2="28" y2="52" stroke="#ea580c" stroke-width="1.5"/></svg>
        <!-- Fish -->
        <svg class="absolute bottom-2 right-12 float-paw" width="64" height="36" viewBox="0 0 64 36" fill="none"><ellipse cx="28" cy="18" rx="22" ry="14" fill="#fef9c3" stroke="#166534" stroke-width="2"/><path d="M50 18l12-12v24L50 18z" fill="#fef9c3" stroke="#166534" stroke-width="2"/><circle cx="20" cy="14" r="2.5" fill="#166534"/><path d="M8 18c8-4 16-4 24 0" stroke="#166534" stroke-width="1" opacity=".4"/></svg>
        <!-- Big Paw center -->
        <svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" width="120" height="120" viewBox="0 0 120 120" fill="none" opacity=".15"><ellipse cx="36" cy="20" rx="14" ry="18" fill="#ea580c"/><ellipse cx="84" cy="20" rx="14" ry="18" fill="#ea580c"/><ellipse cx="14" cy="56" rx="12" ry="16" fill="#ea580c"/><ellipse cx="106" cy="56" rx="12" ry="16" fill="#ea580c"/><ellipse cx="60" cy="76" rx="34" ry="32" fill="#ea580c"/></svg>
      </div>
    </div>
  </div>
</section>

<!-- Featured Product with Size Selector (SIGNATURE) -->
<section id="featured" class="py-20 bg-white fade-up">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="font-display text-3xl font-extrabold text-center mb-3 text-choco-500">Featured Product</h2>
    <p class="text-center text-stone-400 mb-12 font-body">Find the perfect fit for your furry friend</p>
    <div class="bg-cream-50 rounded-card p-8 md:p-10 flex flex-col md:flex-row gap-10 items-center border-2 border-cream-200">
      <!-- Product Image Area -->
      <div class="flex-1 flex items-center justify-center">
        <div class="w-72 h-72 bg-cream-100 rounded-card flex items-center justify-center relative">
          <svg width="180" height="140" viewBox="0 0 180 140" fill="none">
            <!-- Pet bed shape -->
            <ellipse cx="90" cy="110" rx="85" ry="28" fill="#78350f" opacity=".15"/>
            <path d="M20 90c0-30 14-60 70-60s70 30 70 60c0 12-8 22-20 28H40c-12-6-20-16-20-28z" fill="#fef9c3" stroke="#78350f" stroke-width="2"/>
            <path d="M35 88c0-22 12-48 55-48s55 26 55 48" fill="#fff7ed" stroke="#78350f" stroke-width="1.5"/>
            <ellipse cx="90" cy="80" rx="20" ry="12" fill="#ea580c" opacity=".1"/>
            <!-- Sleeping pet silhouette -->
            <ellipse cx="90" cy="76" rx="28" ry="16" fill="#78350f" opacity=".12"/>
            <circle cx="108" cy="70" r="10" fill="#78350f" opacity=".12"/>
            <ellipse cx="116" cy="68" rx="5" ry="3" fill="#78350f" opacity=".08"/>
          </svg>
          <div class="absolute top-3 right-3 bg-paw-500 text-white text-xs font-extrabold px-3 py-1 rounded-pill font-display">Best Seller</div>
        </div>
      </div>
      <!-- Product Info -->
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <span class="bg-forest-500/10 text-forest-500 text-xs font-bold px-3 py-1 rounded-pill">Beds & Comfort</span>
          <div class="paw-rating">
            <span class="paw filled">&#128062;</span>
            <span class="paw filled">&#128062;</span>
            <span class="paw filled">&#128062;</span>
            <span class="paw filled">&#128062;</span>
            <span class="paw">&#128062;</span>
          </div>
          <span class="text-xs text-stone-400">(247)</span>
        </div>
        <h3 class="font-display text-3xl font-extrabold text-choco-500 mb-1">Cozy Pet Bed</h3>
        <p class="text-stone-500 mb-5 font-body">Ultra-soft memory foam with washable cover. Orthopedic support for joints. Your pet's dream nap spot.</p>
        <div class="text-3xl font-extrabold text-paw-500 font-display mb-6">$39.99</div>

        <!-- SIZE SELECTOR - Dog Silhouettes -->
        <div class="mb-6">
          <div class="text-sm font-bold text-choco-400 mb-3 font-display">Select Size:</div>
          <div class="flex gap-3" id="sizeSelector">
            <!-- Small -->
            <div class="size-option text-center flex-1" onclick="selectSize('small',this)" data-size="small">
              <svg width="48" height="40" viewBox="0 0 48 40" fill="none" class="mx-auto mb-1">
                <ellipse cx="24" cy="36" rx="16" ry="3" fill="#78350f" opacity=".1"/>
                <path d="M14 28c0-4 2-10 8-10h4c6 0 8 6 8 10v2c0 2-1 4-4 4H18c-3 0-4-2-4-4v-2z" stroke="#78350f" stroke-width="1.5" fill="none"/>
                <circle cx="26" cy="14" r="6" stroke="#78350f" stroke-width="1.5" fill="none"/>
                <path d="M22 10l-2-4" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M30 10l2-4" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="25" cy="13" r="1" fill="#78350f"/>
                <path d="M14 30l-2 4M34 30l2 4" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M33 24c2-1 5 0 6 1" stroke="#78350f" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <div class="text-xs font-extrabold text-choco-500 font-display">Small</div>
              <div class="text-xs text-stone-400">Up to 5kg</div>
            </div>
            <!-- Medium -->
            <div class="size-option text-center flex-1" onclick="selectSize('medium',this)" data-size="medium">
              <svg width="56" height="46" viewBox="0 0 56 46" fill="none" class="mx-auto mb-1">
                <ellipse cx="28" cy="42" rx="20" ry="3" fill="#78350f" opacity=".1"/>
                <path d="M12 32c0-6 3-14 12-14h8c9 0 12 8 12 14v3c0 3-2 5-5 5H17c-3 0-5-2-5-5v-3z" stroke="#78350f" stroke-width="1.8" fill="none"/>
                <circle cx="32" cy="14" r="8" stroke="#78350f" stroke-width="1.8" fill="none"/>
                <path d="M26 8l-3-5" stroke="#78350f" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M38 8l3-5" stroke="#78350f" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="31" cy="13" r="1.2" fill="#78350f"/>
                <path d="M12 34l-3 5M44 34l3 5" stroke="#78350f" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M42 28c3-1 7 0 8 2" stroke="#78350f" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              <div class="text-xs font-extrabold text-choco-500 font-display">Medium</div>
              <div class="text-xs text-stone-400">Up to 15kg</div>
            </div>
            <!-- Large -->
            <div class="size-option text-center flex-1" onclick="selectSize('large',this)" data-size="large">
              <svg width="68" height="54" viewBox="0 0 68 54" fill="none" class="mx-auto mb-1">
                <ellipse cx="34" cy="50" rx="26" ry="3" fill="#78350f" opacity=".1"/>
                <path d="M10 38c0-8 4-18 16-18h12c12 0 16 10 16 18v4c0 3-2 6-6 6H16c-4 0-6-3-6-6v-4z" stroke="#78350f" stroke-width="2" fill="none"/>
                <circle cx="40" cy="14" r="10" stroke="#78350f" stroke-width="2" fill="none"/>
                <path d="M32 7l-4-6" stroke="#78350f" stroke-width="2" stroke-linecap="round"/>
                <path d="M48 7l4-6" stroke="#78350f" stroke-width="2" stroke-linecap="round"/>
                <circle cx="39" cy="13" r="1.5" fill="#78350f"/>
                <path d="M10 40l-4 6M58 40l4 6" stroke="#78350f" stroke-width="2" stroke-linecap="round"/>
                <path d="M54 32c4-2 9 0 10 3" stroke="#78350f" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
              <div class="text-xs font-extrabold text-choco-500 font-display">Large</div>
              <div class="text-xs text-stone-400">Up to 30kg</div>
            </div>
          </div>
          <!-- Size Details (shown on selection) -->
          <div class="size-info" id="sizeInfo">
            <div class="bg-white rounded-2xl p-4 border border-cream-200 flex items-center gap-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17h14M3 17V3l4 4 3-4 3 4 4-4v14" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <div>
                <div class="text-sm font-bold text-choco-500" id="sizeDimensions">-</div>
                <div class="text-xs text-stone-400" id="sizeBreed">-</div>
              </div>
            </div>
          </div>
        </div>

        <button onclick="addToCart('Cozy Pet Bed')" class="w-full bg-paw-500 hover:bg-paw-400 text-white font-extrabold py-4 rounded-pill text-lg font-display transition shadow-lg shadow-paw-500/30 active:scale-95" style="transition:all .2s">
          Add to Cart
        </button>
      </div>
    </div>
  </div>
</section>

<!-- Product Grid -->
<section id="products" class="py-20 bg-cream-50 fade-up">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="font-display text-3xl font-extrabold text-center mb-3 text-choco-500">Shop Essentials</h2>
    <p class="text-center text-stone-400 mb-12 font-body">Everything for happy, healthy pets</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7" id="productGrid">

      <!-- Product 1: Premium Kibble -->
      <div class="product-card bg-white border-2 border-cream-200 overflow-hidden" data-type="dog cat">
        <div class="h-48 bg-gradient-to-br from-cream-100 to-orange-50 flex items-center justify-center relative">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none"><rect x="15" y="20" width="50" height="45" rx="6" fill="#fef9c3" stroke="#78350f" stroke-width="2"/><path d="M15 32h50" stroke="#78350f" stroke-width="1.5"/><circle cx="40" cy="50" r="10" fill="#ea580c" opacity=".15"/><text x="40" y="54" text-anchor="middle" font-family="Baloo 2" font-size="10" fill="#78350f" font-weight="700">KIBBLE</text><path d="M30 20v-6a10 10 0 0120 0v6" stroke="#78350f" stroke-width="2" fill="none"/></svg>
          <div class="absolute top-3 left-3 bg-paw-500 text-white text-xs font-bold px-2.5 py-1 rounded-pill flex items-center gap-1">&#128062; Popular</div>
        </div>
        <div class="p-5">
          <h3 class="font-display font-bold text-choco-500 text-lg mb-1">Premium Kibble</h3>
          <p class="text-xs text-stone-400 mb-3 font-body">Grain-free, real chicken formula. 2kg bag.</p>
          <div class="flex items-center gap-1 mb-3">
            <div class="paw-rating"><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span></div>
            <span class="text-xs text-stone-400">(182)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-2xl font-extrabold text-paw-500 font-display">$24.99</span>
            <button onclick="addToCart('Premium Kibble')" class="bg-paw-500 hover:bg-paw-400 text-white text-sm font-bold px-5 py-2.5 rounded-pill transition active:scale-95">Add to Cart</button>
          </div>
        </div>
      </div>

      <!-- Product 2: Squeaky Bone -->
      <div class="product-card bg-white border-2 border-cream-200 overflow-hidden" data-type="dog">
        <div class="h-48 bg-gradient-to-br from-cream-100 to-green-50 flex items-center justify-center relative">
          <svg width="100" height="50" viewBox="0 0 100 50" fill="none"><rect x="25" y="15" width="50" height="20" rx="10" fill="#fef9c3" stroke="#166534" stroke-width="2"/><circle cx="22" cy="15" r="10" fill="#fef9c3" stroke="#166534" stroke-width="2"/><circle cx="22" cy="35" r="10" fill="#fef9c3" stroke="#166534" stroke-width="2"/><circle cx="78" cy="15" r="10" fill="#fef9c3" stroke="#166534" stroke-width="2"/><circle cx="78" cy="35" r="10" fill="#fef9c3" stroke="#166534" stroke-width="2"/></svg>
        </div>
        <div class="p-5">
          <h3 class="font-display font-bold text-choco-500 text-lg mb-1">Squeaky Bone</h3>
          <p class="text-xs text-stone-400 mb-3 font-body">Durable natural rubber, non-toxic. Hours of fun!</p>
          <div class="flex items-center gap-1 mb-3">
            <div class="paw-rating"><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw">&#128062;</span></div>
            <span class="text-xs text-stone-400">(94)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-2xl font-extrabold text-forest-500 font-display">$8.99</span>
            <button onclick="addToCart('Squeaky Bone')" class="bg-forest-500 hover:bg-forest-400 text-white text-sm font-bold px-5 py-2.5 rounded-pill transition active:scale-95">Add to Cart</button>
          </div>
        </div>
      </div>

      <!-- Product 3: Cat Tower -->
      <div class="product-card bg-white border-2 border-cream-200 overflow-hidden" data-type="cat">
        <div class="h-48 bg-gradient-to-br from-cream-100 to-amber-50 flex items-center justify-center relative">
          <svg width="60" height="90" viewBox="0 0 60 90" fill="none"><rect x="20" y="0" width="20" height="90" rx="3" fill="#fef9c3" stroke="#78350f" stroke-width="2"/><rect x="5" y="10" width="50" height="14" rx="7" fill="#fef9c3" stroke="#78350f" stroke-width="2"/><rect x="10" y="40" width="40" height="14" rx="7" fill="#fef9c3" stroke="#78350f" stroke-width="2"/><circle cx="30" cy="78" r="10" fill="#fef9c3" stroke="#78350f" stroke-width="2"/><circle cx="30" cy="78" r="4" fill="#78350f" opacity=".15"/></svg>
          <div class="absolute top-3 right-3 bg-choco-500 text-white text-xs font-bold px-2.5 py-1 rounded-pill">Premium</div>
        </div>
        <div class="p-5">
          <h3 class="font-display font-bold text-choco-500 text-lg mb-1">Cat Tower</h3>
          <p class="text-xs text-stone-400 mb-3 font-body">3-tier sisal scratching post with cozy hideaway.</p>
          <div class="flex items-center gap-1 mb-3">
            <div class="paw-rating"><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span></div>
            <span class="text-xs text-stone-400">(316)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-2xl font-extrabold text-choco-500 font-display">$89.99</span>
            <button onclick="addToCart('Cat Tower')" class="bg-choco-500 hover:bg-choco-400 text-white text-sm font-bold px-5 py-2.5 rounded-pill transition active:scale-95">Add to Cart</button>
          </div>
        </div>
      </div>

      <!-- Product 4: Leash Set -->
      <div class="product-card bg-white border-2 border-cream-200 overflow-hidden" data-type="dog">
        <div class="h-48 bg-gradient-to-br from-orange-50 to-cream-100 flex items-center justify-center">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="16" fill="none" stroke="#ea580c" stroke-width="3"/><circle cx="40" cy="40" r="6" fill="#ea580c" opacity=".2"/><path d="M40 24V8" stroke="#ea580c" stroke-width="2.5" stroke-linecap="round"/><circle cx="40" cy="6" r="3" fill="#ea580c"/><path d="M56 40h16" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 3"/></svg>
        </div>
        <div class="p-5">
          <h3 class="font-display font-bold text-choco-500 text-lg mb-1">Leash Set</h3>
          <p class="text-xs text-stone-400 mb-3 font-body">Adjustable harness + retractable leash combo.</p>
          <div class="flex items-center gap-1 mb-3">
            <div class="paw-rating"><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw">&#128062;</span></div>
            <span class="text-xs text-stone-400">(67)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-2xl font-extrabold text-paw-500 font-display">$19.99</span>
            <button onclick="addToCart('Leash Set')" class="bg-paw-500 hover:bg-paw-400 text-white text-sm font-bold px-5 py-2.5 rounded-pill transition active:scale-95">Add to Cart</button>
          </div>
        </div>
      </div>

      <!-- Product 5: Pet Shampoo -->
      <div class="product-card bg-white border-2 border-cream-200 overflow-hidden" data-type="dog cat">
        <div class="h-48 bg-gradient-to-br from-green-50 to-cream-100 flex items-center justify-center">
          <svg width="50" height="80" viewBox="0 0 50 80" fill="none"><rect x="10" y="25" width="30" height="45" rx="6" fill="#fef9c3" stroke="#166534" stroke-width="2"/><rect x="17" y="15" width="16" height="14" rx="3" fill="#fef9c3" stroke="#166534" stroke-width="2"/><rect x="21" y="8" width="8" height="10" rx="2" fill="none" stroke="#166534" stroke-width="1.5"/><path d="M18 42h14M18 50h14" stroke="#166534" stroke-width="1" opacity=".4"/><circle cx="25" cy="38" r="2" fill="#166534" opacity=".3"/></svg>
        </div>
        <div class="p-5">
          <h3 class="font-display font-bold text-choco-500 text-lg mb-1">Pet Shampoo</h3>
          <p class="text-xs text-stone-400 mb-3 font-body">Oatmeal & aloe formula. Soothes sensitive skin.</p>
          <div class="flex items-center gap-1 mb-3">
            <div class="paw-rating"><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw">&#128062;</span><span class="paw">&#128062;</span></div>
            <span class="text-xs text-stone-400">(53)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-2xl font-extrabold text-forest-500 font-display">$14.99</span>
            <button onclick="addToCart('Pet Shampoo')" class="bg-forest-500 hover:bg-forest-400 text-white text-sm font-bold px-5 py-2.5 rounded-pill transition active:scale-95">Add to Cart</button>
          </div>
        </div>
      </div>

      <!-- Product 6: Treat Bag -->
      <div class="product-card bg-white border-2 border-cream-200 overflow-hidden" data-type="dog cat">
        <div class="h-48 bg-gradient-to-br from-amber-50 to-cream-100 flex items-center justify-center">
          <svg width="60" height="80" viewBox="0 0 60 80" fill="none"><path d="M12 25h36l-3 45a4 4 0 01-4 3.5H19a4 4 0 01-4-3.5L12 25z" fill="#fef9c3" stroke="#78350f" stroke-width="2"/><path d="M10 20h40a2 2 0 012 2v3H8v-3a2 2 0 012-2z" fill="#ea580c" stroke="#78350f" stroke-width="2"/><path d="M22 12a8 8 0 0116 0" stroke="#78350f" stroke-width="2" fill="none"/><circle cx="24" cy="40" r="3" fill="#78350f" opacity=".15"/><circle cx="36" cy="45" r="2.5" fill="#78350f" opacity=".15"/><circle cx="28" cy="52" r="2" fill="#78350f" opacity=".15"/></svg>
        </div>
        <div class="p-5">
          <h3 class="font-display font-bold text-choco-500 text-lg mb-1">Treat Bag</h3>
          <p class="text-xs text-stone-400 mb-3 font-body">Mixed flavor training treats. Vet approved recipe.</p>
          <div class="flex items-center gap-1 mb-3">
            <div class="paw-rating"><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span><span class="paw filled">&#128062;</span></div>
            <span class="text-xs text-stone-400">(209)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-2xl font-extrabold text-paw-500 font-display">$12.99</span>
            <button onclick="addToCart('Treat Bag')" class="bg-paw-500 hover:bg-paw-400 text-white text-sm font-bold px-5 py-2.5 rounded-pill transition active:scale-95">Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Pet Type Filter Section -->
<section class="py-16 bg-white fade-up">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="font-display text-3xl font-extrabold text-center mb-3 text-choco-500">Shop by Pet</h2>
    <p class="text-center text-stone-400 mb-10 font-body">Find products tailored to your companion</p>
    <div class="flex justify-center gap-4 flex-wrap" id="petFilters">
      <!-- Dog -->
      <div class="pet-filter active flex items-center gap-3 min-w-[140px]" onclick="filterByPet('dog',this)">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M10 24c0-5 3-12 8-12s8 7 8 12v2c0 2-1 4-4 4h-8c-3 0-4-2-4-4v-2z" stroke="#78350f" stroke-width="1.5" fill="none"/><circle cx="20" cy="10" r="6" stroke="#78350f" stroke-width="1.5" fill="none"/><path d="M16 6l-2-4M24 6l2-4" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/><circle cx="19" cy="9.5" r="1" fill="#78350f"/><path d="M26 20c2-1 4 0 5 1" stroke="#78350f" stroke-width="1.2" stroke-linecap="round"/></svg>
        <div>
          <div class="text-sm font-extrabold text-choco-500 font-display">Dogs</div>
          <div class="text-xs text-stone-400">42 products</div>
        </div>
      </div>
      <!-- Cat -->
      <div class="pet-filter flex items-center gap-3 min-w-[140px]" onclick="filterByPet('cat',this)">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M10 28c0-6 3-14 8-14s8 8 8 14c0 2-2 4-4 4h-8c-2 0-4-2-4-4z" stroke="#78350f" stroke-width="1.5" fill="none"/><circle cx="18" cy="11" r="7" stroke="#78350f" stroke-width="1.5" fill="none"/><path d="M12 6l-3-5M24 6l3-5" stroke="#78350f" stroke-width="1.8" stroke-linecap="round"/><circle cx="15.5" cy="10" r="1" fill="#78350f"/><circle cx="20.5" cy="10" r="1" fill="#78350f"/><path d="M17 13h2l-1 1.5-1-1.5z" fill="#78350f"/><path d="M26 22c1 0 3 1 3 3" stroke="#78350f" stroke-width="1.2" stroke-linecap="round"/></svg>
        <div>
          <div class="text-sm font-extrabold text-choco-500 font-display">Cats</div>
          <div class="text-xs text-stone-400">38 products</div>
        </div>
      </div>
      <!-- Bird -->
      <div class="pet-filter flex items-center gap-3 min-w-[140px]" onclick="filterByPet('bird',this)">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><ellipse cx="18" cy="20" rx="7" ry="10" stroke="#78350f" stroke-width="1.5" fill="none"/><circle cx="18" cy="10" r="5.5" stroke="#78350f" stroke-width="1.5" fill="none"/><circle cx="16" cy="9" r="1" fill="#78350f"/><path d="M20 11l3-1" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/><path d="M14 20l-5 2M22 20l5 2" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/><path d="M16 30l-1 4M20 30l1 4" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/></svg>
        <div>
          <div class="text-sm font-extrabold text-choco-500 font-display">Birds</div>
          <div class="text-xs text-stone-400">15 products</div>
        </div>
      </div>
      <!-- Fish -->
      <div class="pet-filter flex items-center gap-3 min-w-[140px]" onclick="filterByPet('fish',this)">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><ellipse cx="16" cy="18" rx="12" ry="8" stroke="#78350f" stroke-width="1.5" fill="none"/><path d="M28 18l7-7v14l-7-7z" stroke="#78350f" stroke-width="1.5" fill="none"/><circle cx="10" cy="16" r="1.5" fill="#78350f"/><path d="M6 18c4-2 10-2 16 0" stroke="#78350f" stroke-width="1" opacity=".3"/></svg>
        <div>
          <div class="text-sm font-extrabold text-choco-500 font-display">Fish</div>
          <div class="text-xs text-stone-400">12 products</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Subscription: Monthly Treat Box -->
<section id="subscription" class="py-20 bg-gradient-to-br from-choco-500 to-choco-600 text-white fade-up">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex flex-col md:flex-row items-center gap-12">
      <div class="flex-1">
        <div class="inline-block bg-white/15 text-cream-100 text-sm font-bold px-4 py-1.5 rounded-pill mb-4 font-display">Subscription Box</div>
        <h2 class="font-display text-4xl font-extrabold mb-4">Monthly Treat Box</h2>
        <p class="text-white/70 mb-6 font-body text-lg">Curated surprises delivered to your door every month. Premium treats, toys, and accessories tailored to your pet's size and preferences.</p>
        <div class="flex items-baseline gap-2 mb-6">
          <span class="text-5xl font-extrabold font-display">$29.99</span>
          <span class="text-white/50 font-body">/month</span>
        </div>
        <div class="flex flex-wrap gap-3 mb-8">
          <div class="bg-white/10 rounded-2xl px-5 py-3 text-center cursor-pointer border-2 border-transparent hover:border-paw-400 transition pet-sub active" onclick="selectPetSub('dog',this)" id="subDog">
            <div class="text-2xl mb-1">&#128054;</div>
            <div class="text-xs font-bold">Dog Box</div>
          </div>
          <div class="bg-white/10 rounded-2xl px-5 py-3 text-center cursor-pointer border-2 border-transparent hover:border-paw-400 transition pet-sub" onclick="selectPetSub('cat',this)" id="subCat">
            <div class="text-2xl mb-1">&#128049;</div>
            <div class="text-xs font-bold">Cat Box</div>
          </div>
          <div class="bg-white/10 rounded-2xl px-5 py-3 text-center cursor-pointer border-2 border-transparent hover:border-paw-400 transition pet-sub" onclick="selectPetSub('bird',this)" id="subBird">
            <div class="text-2xl mb-1">&#128038;</div>
            <div class="text-xs font-bold">Bird Box</div>
          </div>
        </div>
        <button onclick="addToCart('Monthly Treat Box')" class="bg-paw-500 hover:bg-paw-400 text-white font-extrabold py-4 px-10 rounded-pill text-lg font-display transition shadow-lg shadow-paw-500/40 active:scale-95">
          Subscribe Now
        </button>
      </div>
      <div class="flex-1 hidden md:flex justify-center">
        <div class="sub-card bg-white/10 rounded-card p-8 w-80 border border-white/10">
          <div class="text-center mb-4">
            <div class="text-6xl mb-2">&#127873;</div>
            <div class="font-display font-bold text-xl">What's Inside?</div>
          </div>
          <div class="space-y-3">
            <div class="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-2.5"><span>&#128054;</span><span class="text-sm">2-3 Premium Treats</span></div>
            <div class="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-2.5"><span>&#127790;</span><span class="text-sm">1 Durable Toy</span></div>
            <div class="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-2.5"><span>&#128062;</span><span class="text-sm">1 Surprise Accessory</span></div>
            <div class="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-2.5"><span>&#128218;</span><span class="text-sm">Pet Care Tip Card</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-choco-600 text-white pt-16 pb-8" style="background:#3a1a00">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
      <div>
        <div class="flex items-center gap-2.5 mb-4">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><ellipse cx="8" cy="6" rx="4" ry="5" fill="#ea580c"/><ellipse cx="24" cy="6" rx="4" ry="5" fill="#ea580c"/><ellipse cx="3" cy="16" rx="3.5" ry="4.5" fill="#ea580c"/><ellipse cx="29" cy="16" rx="3.5" ry="4.5" fill="#ea580c"/><ellipse cx="16" cy="20" rx="10" ry="10" fill="#ea580c"/></svg>
          <span class="font-display font-extrabold text-xl">PawShop</span>
        </div>
        <p class="text-sm text-white/50 font-body leading-relaxed">Making tails wag and purrs louder since 2020. Every product vet-approved.</p>
      </div>
      <div>
        <h4 class="font-display font-bold text-lg mb-4">Pet Care Tips</h4>
        <div class="space-y-2.5 text-sm text-white/50 font-body">
          <div class="hover:text-white transition cursor-pointer">Nutrition Guides</div>
          <div class="hover:text-white transition cursor-pointer">Training Basics</div>
          <div class="hover:text-white transition cursor-pointer">Health Checkups</div>
          <div class="hover:text-white transition cursor-pointer">Grooming 101</div>
        </div>
      </div>
      <div>
        <h4 class="font-display font-bold text-lg mb-4">Delivery Info</h4>
        <div class="space-y-2.5 text-sm text-white/50 font-body">
          <div>Free shipping on $50+</div>
          <div>2-5 business day delivery</div>
          <div>30-day easy returns</div>
          <div>Track your order 24/7</div>
        </div>
      </div>
      <div>
        <h4 class="font-display font-bold text-lg mb-4">Vet Partnership</h4>
        <div class="bg-white/10 rounded-2xl p-4 border border-white/10">
          <div class="flex items-center gap-3 mb-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="4" y="4" width="24" height="24" rx="6" fill="#166534" opacity=".3"/><path d="M16 10v12M10 16h12" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"/></svg>
            <div class="font-display font-bold text-sm">Vet Approved</div>
          </div>
          <p class="text-xs text-white/40 font-body">All products reviewed by licensed veterinarians for safety and quality.</p>
        </div>
      </div>
    </div>
    <div class="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="text-xs text-white/30 font-body">&copy; 2026 PawShop. All rights reserved. Made with &#128062; for pets everywhere.</div>
      <div class="flex gap-4 text-xs text-white/30 font-body">
        <span class="hover:text-white transition cursor-pointer">Privacy Policy</span>
        <span class="hover:text-white transition cursor-pointer">Terms of Service</span>
        <span class="hover:text-white transition cursor-pointer">Contact Us</span>
      </div>
    </div>
  </div>
</footer>

<!-- Toast -->
<div class="toast" id="toast"></div>

<script>
// Cart
let cartNum = 2;
function addToCart(name) {
  cartNum++;
  document.getElementById('cartCount').textContent = cartNum;
  const t = document.getElementById('toast');
  t.innerHTML = '&#128062; ' + name + ' added to cart!';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// Size Selector
const sizeData = {
  small: { dims: '45 x 35 cm', breed: 'Recommended for: Chihuahua, Pomeranian, Yorkshire Terrier' },
  medium: { dims: '65 x 50 cm', breed: 'Recommended for: Beagle, Cocker Spaniel, Border Collie' },
  large: { dims: '90 x 70 cm', breed: 'Recommended for: Labrador, Golden Retriever, German Shepherd' }
};
function selectSize(size, el) {
  document.querySelectorAll('.size-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  const info = document.getElementById('sizeInfo');
  document.getElementById('sizeDimensions').textContent = sizeData[size].dims;
  document.getElementById('sizeBreed').textContent = sizeData[size].breed;
  info.classList.add('open');
}

// Hero Dog/Cat toggle
function setHeroPet(pet) {
  const dog = document.getElementById('toggleDog');
  const cat = document.getElementById('toggleCat');
  dog.classList.remove('active-dog');
  cat.classList.remove('active-cat');
  if (pet === 'dog') dog.classList.add('active-dog');
  else cat.classList.add('active-cat');
}

// Pet Type Filter
function filterByPet(type, el) {
  document.querySelectorAll('.pet-filter').forEach(f => f.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.product-card').forEach(card => {
    const types = (card.dataset.type || '').split(' ');
    if (type === 'all' || types.includes(type)) {
      card.style.display = 'block';
      card.style.opacity = '1';
      card.style.transform = 'scale(1)';
    } else {
      card.style.opacity = '0.3';
      card.style.transform = 'scale(0.95)';
    }
  });
}

// Subscription pet selection
function selectPetSub(pet, el) {
  document.querySelectorAll('.pet-sub').forEach(s => {
    s.classList.remove('active');
    s.style.borderColor = 'transparent';
  });
  el.classList.add('active');
  el.style.borderColor = '#ea580c';
}
// Init sub selection
document.getElementById('subDog').style.borderColor = '#ea580c';

// Scroll reveal
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
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
