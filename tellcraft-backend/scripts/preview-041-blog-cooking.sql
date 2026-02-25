INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'b7a7c8c0-357d-4b8d-955a-7412027160f1',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Kitchen Table — Recipe Blog</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        saffron: { 50:'#fffbeb', 100:'#fef3c7', 200:'#fde68a', 300:'#fcd34d', 400:'#fbbf24', 500:'#f59e0b', 600:'#d97706', 700:'#b45309', 800:'#92400e', 900:'#78350f' },
        cream: { 50:'#fefdf8', 100:'#fef9c3', 200:'#fef08a', 300:'#fde047' },
        olive: { 50:'#f7fee7', 100:'#ecfccb', 200:'#d9f99d', 300:'#bef264', 400:'#a3e635', 500:'#84cc16', 600:'#65a30d', 700:'#4d7c0f', 800:'#3f6212', 900:'#365314' },
        terra: { 50:'#fff7ed', 100:'#ffedd5', 200:'#fed7aa', 300:'#fdba74', 400:'#fb923c', 500:'#f97316', 600:'#ea580c', 700:'#c2410c', 800:'#9a3412', 900:'#7c2d12' }
      },
      fontFamily: {
        display: ['Merriweather', 'Georgia', 'serif'],
        body: ['Source Sans 3', 'system-ui', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  body { font-family: 'Source Sans 3', system-ui, sans-serif; background: #fefdf8; color: #3f3f46; }
  h1,h2,h3,h4,.font-display { font-family: 'Merriweather', Georgia, serif; }
  html { scroll-behavior: smooth; }
  .reveal { opacity: 0; transform: translateY(24px); transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .step-line { position: absolute; left: 15px; top: 40px; bottom: -12px; width: 2px; border-left: 2px dashed #d97706; opacity: 0.35; }
  .ingredient-check:checked + .ingredient-label { text-decoration: line-through; color: #a1a1aa; }
  @media print {
    nav, .no-print, footer, .newsletter-section { display: none !important; }
    body { background: white; }
    .print-break { page-break-before: always; }
  }
</style>
</head>
<body class="font-body">

<!-- ========== NAVBAR ========== -->
<nav class="fixed top-0 w-full bg-cream-50/95 backdrop-blur-md z-50 border-b border-saffron-100">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2.5 group">
      <svg class="w-8 h-8 text-saffron-600" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 4v10c0 3.3 2.7 6 6 6s6-2.7 6-6V4"/>
        <line x1="8" y1="4" x2="24" y2="4"/>
        <line x1="16" y1="20" x2="16" y2="28"/>
        <line x1="12" y1="28" x2="20" y2="28"/>
      </svg>
      <span class="font-display text-xl font-bold text-olive-800 group-hover:text-saffron-700 transition-colors">The Kitchen Table</span>
    </a>
    <div class="hidden md:flex items-center gap-8 text-sm font-semibold text-olive-800/70">
      <a href="#recipes" class="hover:text-saffron-600 transition-colors">Recipes</a>
      <a href="#categories" class="hover:text-saffron-600 transition-colors">Categories</a>
      <a href="#about" class="hover:text-saffron-600 transition-colors">About</a>
      <a href="#newsletter" class="hover:text-saffron-600 transition-colors">Newsletter</a>
    </div>
    <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-olive-800">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-cream-50 border-t border-saffron-100 px-6 py-4 space-y-3">
    <a href="#recipes" class="block text-sm font-semibold text-olive-800/70 hover:text-saffron-600">Recipes</a>
    <a href="#categories" class="block text-sm font-semibold text-olive-800/70 hover:text-saffron-600">Categories</a>
    <a href="#about" class="block text-sm font-semibold text-olive-800/70 hover:text-saffron-600">About</a>
    <a href="#newsletter" class="block text-sm font-semibold text-olive-800/70 hover:text-saffron-600">Newsletter</a>
  </div>
</nav>

<!-- ========== FEATURED RECIPE HERO ========== -->
<section class="pt-24 pb-16 bg-gradient-to-b from-cream-100 to-cream-50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="reveal bg-white rounded-2xl overflow-hidden shadow-sm border border-saffron-100 grid md:grid-cols-2">
      <!-- Image placeholder -->
      <div class="h-64 md:h-auto min-h-[320px] bg-gradient-to-br from-saffron-200 via-saffron-300 to-terra-200 flex items-center justify-center relative overflow-hidden">
        <div class="absolute inset-0 opacity-10">
          <svg class="w-full h-full" viewBox="0 0 200 200" fill="none"><circle cx="60" cy="80" r="40" stroke="#92400e" stroke-width="0.5"/><circle cx="140" cy="120" r="30" stroke="#92400e" stroke-width="0.5"/><circle cx="100" cy="50" r="25" stroke="#92400e" stroke-width="0.5"/></svg>
        </div>
        <div class="text-center relative z-10">
          <svg class="w-24 h-24 mx-auto text-white/80 mb-3" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
            <ellipse cx="32" cy="38" rx="24" ry="14"/>
            <path d="M14 38c0-10 8-22 18-22s18 12 18 22"/>
            <path d="M32 6v6" stroke-linecap="round"/>
            <path d="M26 8c2-3 4-4 6-4" stroke-linecap="round"/>
            <path d="M38 8c-2-3-4-4-6-4" stroke-linecap="round"/>
          </svg>
          <span class="text-white/70 text-sm font-body font-medium tracking-wide">FEATURED RECIPE</span>
        </div>
      </div>
      <!-- Recipe info -->
      <div class="p-8 md:p-10 flex flex-col justify-center">
        <span class="inline-block text-saffron-600 text-xs font-bold tracking-widest uppercase mb-3">This Week's Pick</span>
        <h1 class="font-display text-3xl md:text-4xl font-bold text-olive-900 leading-tight mb-4">Homemade Sourdough Bread</h1>
        <p class="text-gray-500 leading-relaxed mb-6">A crusty, tangy loaf with an open crumb. This recipe walks you through every fold, every rest, and every golden moment in the oven.</p>
        <div class="flex flex-wrap items-center gap-5 text-sm text-olive-800/60 mb-6">
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-saffron-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            Prep: 20 min
          </span>
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-terra-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 2c1 3 4 6 4 10a4 4 0 01-8 0c0-4 3-7 4-10z"/></svg>
            Cook: 45 min
          </span>
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-olive-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            Serves: 4
          </span>
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-saffron-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Medium
          </span>
        </div>
        <a href="#recipe-card" class="self-start bg-saffron-600 text-white px-7 py-3 rounded-full text-sm font-bold hover:bg-saffron-700 transition-colors shadow-sm hover:shadow-md cursor-pointer">View Full Recipe</a>
      </div>
    </div>
  </div>
</section>

<!-- ========== MAIN RECIPE CARD (Signature Step Counter) ========== -->
<section id="recipe-card" class="py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="reveal">
      <h2 class="font-display text-2xl font-bold text-olive-900 mb-2">Homemade Sourdough Bread</h2>
      <p class="text-gray-400 text-sm mb-8">A step-by-step guide to the perfect artisan loaf</p>

      <div class="grid lg:grid-cols-[1fr_0.54fr] gap-8">
        <!-- LEFT: Steps with step counter dots (65%) -->
        <div class="bg-white rounded-2xl border border-saffron-100 p-8 shadow-sm">
          <h3 class="font-display text-lg font-bold text-olive-800 mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-saffron-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            Instructions
          </h3>

          <!-- Step 1 -->
          <div class="relative pl-14 pb-10">
            <div class="step-line"></div>
            <div class="absolute left-0 top-0 w-8 h-8 rounded-full bg-white border-[2.5px] border-saffron-600 flex items-center justify-center">
              <span class="text-saffron-700 text-sm font-bold font-body">1</span>
            </div>
            <div>
              <h4 class="font-display text-base font-bold text-olive-800 mb-1.5">Mix the Dough</h4>
              <p class="text-gray-500 text-sm leading-relaxed">Mix 500g bread flour, 350ml lukewarm water, and 100g active sourdough starter in a large bowl. Stir with a wooden spoon until no dry flour remains. The dough will be shaggy and sticky -- that's exactly right.</p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="relative pl-14 pb-10">
            <div class="step-line"></div>
            <div class="absolute left-0 top-0 w-8 h-8 rounded-full bg-white border-[2.5px] border-saffron-600 flex items-center justify-center">
              <span class="text-saffron-700 text-sm font-bold font-body">2</span>
            </div>
            <div>
              <h4 class="font-display text-base font-bold text-olive-800 mb-1.5">Autolyse Rest</h4>
              <p class="text-gray-500 text-sm leading-relaxed">Cover the bowl with a damp towel and let it rest for 30 minutes. This autolyse period allows the flour to fully hydrate, making the dough easier to work with and improving the final crumb structure.</p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="relative pl-14 pb-10">
            <div class="step-line"></div>
            <div class="absolute left-0 top-0 w-8 h-8 rounded-full bg-white border-[2.5px] border-saffron-600 flex items-center justify-center">
              <span class="text-saffron-700 text-sm font-bold font-body">3</span>
            </div>
            <div>
              <h4 class="font-display text-base font-bold text-olive-800 mb-1.5">Stretch & Fold</h4>
              <p class="text-gray-500 text-sm leading-relaxed">Add 10g salt with a splash of water. Perform stretch and fold sets every 30 minutes for the next 2 hours (4 sets total). Grab one side of the dough, stretch it up, and fold it over to the opposite side. Rotate the bowl 90 degrees and repeat.</p>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="relative pl-14 pb-2">
            <div class="absolute left-0 top-0 w-8 h-8 rounded-full bg-saffron-600 border-[2.5px] border-saffron-600 flex items-center justify-center">
              <span class="text-white text-sm font-bold font-body">4</span>
            </div>
            <div>
              <h4 class="font-display text-base font-bold text-olive-800 mb-1.5">Shape, Proof & Bake</h4>
              <p class="text-gray-500 text-sm leading-relaxed">Shape the dough into a round boule and place seam-side up in a floured banneton. Cold-proof in the fridge for 8-12 hours. Preheat a Dutch oven to 250C. Score the top, bake covered for 20 minutes, then uncover and bake at 230C for another 25 minutes until deep golden.</p>
            </div>
          </div>
        </div>

        <!-- RIGHT: Ingredients sidebar (35%) -->
        <div class="space-y-6">
          <div class="bg-cream-100 rounded-2xl border border-saffron-100 p-8">
            <h3 class="font-display text-lg font-bold text-olive-800 mb-5 flex items-center gap-2">
              <svg class="w-5 h-5 text-saffron-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              Ingredients
            </h3>
            <ul class="space-y-3.5" id="ingredient-list">
              <li class="flex items-center gap-3">
                <input type="checkbox" class="ingredient-check w-4 h-4 rounded border-saffron-300 text-saffron-600 focus:ring-saffron-500 cursor-pointer accent-saffron-600" id="ing1">
                <label for="ing1" class="ingredient-label text-sm text-olive-800 cursor-pointer select-none">500g bread flour</label>
              </li>
              <li class="flex items-center gap-3">
                <input type="checkbox" class="ingredient-check w-4 h-4 rounded border-saffron-300 text-saffron-600 focus:ring-saffron-500 cursor-pointer accent-saffron-600" id="ing2">
                <label for="ing2" class="ingredient-label text-sm text-olive-800 cursor-pointer select-none">350ml water (lukewarm)</label>
              </li>
              <li class="flex items-center gap-3">
                <input type="checkbox" class="ingredient-check w-4 h-4 rounded border-saffron-300 text-saffron-600 focus:ring-saffron-500 cursor-pointer accent-saffron-600" id="ing3">
                <label for="ing3" class="ingredient-label text-sm text-olive-800 cursor-pointer select-none">100g sourdough starter</label>
              </li>
              <li class="flex items-center gap-3">
                <input type="checkbox" class="ingredient-check w-4 h-4 rounded border-saffron-300 text-saffron-600 focus:ring-saffron-500 cursor-pointer accent-saffron-600" id="ing4">
                <label for="ing4" class="ingredient-label text-sm text-olive-800 cursor-pointer select-none">10g fine sea salt</label>
              </li>
            </ul>

            <div class="mt-6 pt-5 border-t border-saffron-200">
              <button onclick="handlePrint()" class="w-full bg-olive-800 text-white py-3 rounded-xl text-sm font-bold hover:bg-olive-900 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                Print Recipe
              </button>
            </div>
          </div>

          <!-- Nutrition quick facts -->
          <div class="bg-white rounded-2xl border border-saffron-100 p-6">
            <h4 class="font-display text-sm font-bold text-olive-800 mb-3">Quick Facts</h4>
            <div class="grid grid-cols-2 gap-3 text-center">
              <div class="bg-cream-50 rounded-lg py-2.5">
                <div class="text-saffron-700 text-lg font-bold font-body">65</div>
                <div class="text-[11px] text-gray-400 font-medium">MIN TOTAL</div>
              </div>
              <div class="bg-cream-50 rounded-lg py-2.5">
                <div class="text-saffron-700 text-lg font-bold font-body">4</div>
                <div class="text-[11px] text-gray-400 font-medium">INGREDIENTS</div>
              </div>
              <div class="bg-cream-50 rounded-lg py-2.5">
                <div class="text-saffron-700 text-lg font-bold font-body">4</div>
                <div class="text-[11px] text-gray-400 font-medium">SERVINGS</div>
              </div>
              <div class="bg-cream-50 rounded-lg py-2.5">
                <div class="text-saffron-700 text-lg font-bold font-body">4</div>
                <div class="text-[11px] text-gray-400 font-medium">STEPS</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ========== MORE RECIPES ========== -->
<section id="recipes" class="py-16 bg-cream-50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between mb-10">
      <div>
        <h2 class="font-display text-2xl font-bold text-olive-900">More Recipes</h2>
        <p class="text-gray-400 text-sm mt-1">Fresh from the kitchen this week</p>
      </div>
      <a href="#" class="text-saffron-600 text-sm font-semibold hover:text-saffron-700 transition-colors hidden md:block">View All Recipes &rarr;</a>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Card 1 -->
      <div class="reveal bg-white rounded-2xl overflow-hidden shadow-sm border border-saffron-100 hover:shadow-md transition-all group cursor-pointer">
        <div class="h-44 bg-gradient-to-br from-saffron-100 via-saffron-200 to-terra-100 flex items-center justify-center relative overflow-hidden">
          <svg class="w-16 h-16 text-saffron-500/50 group-hover:scale-110 transition-transform" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
            <ellipse cx="32" cy="40" rx="22" ry="12"/>
            <path d="M10 40c0 6 10 12 22 12s22-6 22-12"/>
            <path d="M18 36c4-10 10-16 14-16s10 6 14 16"/>
          </svg>
          <span class="absolute top-3 left-3 bg-terra-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">BREAD</span>
        </div>
        <div class="p-5">
          <h3 class="font-display text-lg font-bold text-olive-900 group-hover:text-saffron-700 transition-colors mb-2">Rustic Ciabatta</h3>
          <p class="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">An Italian classic with a crispy crust and airy, hole-filled interior. Perfect for sandwiches or dipping in olive oil.</p>
          <div class="flex items-center gap-4 text-xs text-olive-800/50">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              15 min prep
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 2c1 3 4 6 4 10a4 4 0 01-8 0c0-4 3-7 4-10z"/></svg>
              35 min cook
            </span>
          </div>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="reveal bg-white rounded-2xl overflow-hidden shadow-sm border border-saffron-100 hover:shadow-md transition-all group cursor-pointer">
        <div class="h-44 bg-gradient-to-br from-cream-100 via-saffron-100 to-olive-100 flex items-center justify-center relative overflow-hidden">
          <svg class="w-16 h-16 text-olive-500/50 group-hover:scale-110 transition-transform" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M16 48c0 0 4-20 16-20s16 20 16 20"/>
            <path d="M24 28c0-6 4-12 8-12s8 6 8 12"/>
            <line x1="32" y1="16" x2="32" y2="48"/>
            <path d="M16 48h32"/>
          </svg>
          <span class="absolute top-3 left-3 bg-olive-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">PASTA</span>
        </div>
        <div class="p-5">
          <h3 class="font-display text-lg font-bold text-olive-900 group-hover:text-saffron-700 transition-colors mb-2">Cacio e Pepe</h3>
          <p class="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">The Roman three-ingredient masterpiece. Pecorino Romano, black pepper, and perfectly cooked tonnarelli.</p>
          <div class="flex items-center gap-4 text-xs text-olive-800/50">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              10 min prep
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 2c1 3 4 6 4 10a4 4 0 01-8 0c0-4 3-7 4-10z"/></svg>
              12 min cook
            </span>
          </div>
        </div>
      </div>

      <!-- Card 3 -->
      <div class="reveal bg-white rounded-2xl overflow-hidden shadow-sm border border-saffron-100 hover:shadow-md transition-all group cursor-pointer">
        <div class="h-44 bg-gradient-to-br from-terra-100 via-saffron-100 to-cream-100 flex items-center justify-center relative overflow-hidden">
          <svg class="w-16 h-16 text-terra-500/50 group-hover:scale-110 transition-transform" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="32" cy="36" r="18"/>
            <ellipse cx="32" cy="32" rx="12" ry="6"/>
            <path d="M26 30c2-4 4-6 6-6s4 2 6 6"/>
            <path d="M32 18v-6"/>
            <path d="M28 14l4 4 4-4"/>
          </svg>
          <span class="absolute top-3 left-3 bg-saffron-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">DESSERT</span>
        </div>
        <div class="p-5">
          <h3 class="font-display text-lg font-bold text-olive-900 group-hover:text-saffron-700 transition-colors mb-2">Salted Caramel Tart</h3>
          <p class="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">Buttery shortcrust filled with smooth, bittersweet caramel and finished with flaky Maldon sea salt.</p>
          <div class="flex items-center gap-4 text-xs text-olive-800/50">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              25 min prep
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 2c1 3 4 6 4 10a4 4 0 01-8 0c0-4 3-7 4-10z"/></svg>
              30 min cook
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ========== CATEGORIES ========== -->
<section id="categories" class="py-16">
  <div class="max-w-6xl mx-auto px-6 text-center">
    <h2 class="font-display text-2xl font-bold text-olive-900 mb-3 reveal">Browse Categories</h2>
    <p class="text-gray-400 text-sm mb-10 reveal">Find exactly what you're craving</p>
    <div class="flex flex-wrap justify-center gap-4 reveal">
      <!-- Bread -->
      <button class="category-pill flex items-center gap-2.5 bg-white border-2 border-saffron-200 rounded-full px-6 py-3 hover:border-saffron-500 hover:bg-saffron-50 transition-all group cursor-pointer">
        <svg class="w-6 h-6 text-terra-600 group-hover:scale-110 transition-transform" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
          <ellipse cx="16" cy="20" rx="12" ry="7"/>
          <path d="M8 18c2-6 5-10 8-10s6 4 8 10"/>
          <path d="M12 16v4M16 14v6M20 16v4"/>
        </svg>
        <span class="text-sm font-semibold text-olive-800">Bread</span>
      </button>
      <!-- Pasta -->
      <button class="category-pill flex items-center gap-2.5 bg-white border-2 border-saffron-200 rounded-full px-6 py-3 hover:border-saffron-500 hover:bg-saffron-50 transition-all group cursor-pointer">
        <svg class="w-6 h-6 text-saffron-600 group-hover:scale-110 transition-transform" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M8 8c4 12 4 16 8 20"/>
          <path d="M12 6c3 12 3 18 6 22"/>
          <path d="M16 6c2 12 2 18 4 22"/>
          <path d="M20 8c1 10 1 16 2 18"/>
          <path d="M6 26h20"/>
        </svg>
        <span class="text-sm font-semibold text-olive-800">Pasta</span>
      </button>
      <!-- Salad -->
      <button class="category-pill flex items-center gap-2.5 bg-white border-2 border-saffron-200 rounded-full px-6 py-3 hover:border-saffron-500 hover:bg-saffron-50 transition-all group cursor-pointer">
        <svg class="w-6 h-6 text-olive-600 group-hover:scale-110 transition-transform" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 22c0 4 4.5 7 10 7s10-3 10-7"/>
          <path d="M6 22h20"/>
          <path d="M10 22c-1-4 1-8 4-10"/>
          <path d="M22 22c1-4-1-8-4-10"/>
          <path d="M16 12c0-4 2-6 2-9"/>
          <circle cx="16" cy="18" r="2"/>
        </svg>
        <span class="text-sm font-semibold text-olive-800">Salad</span>
      </button>
      <!-- Dessert -->
      <button class="category-pill flex items-center gap-2.5 bg-white border-2 border-saffron-200 rounded-full px-6 py-3 hover:border-saffron-500 hover:bg-saffron-50 transition-all group cursor-pointer">
        <svg class="w-6 h-6 text-saffron-700 group-hover:scale-110 transition-transform" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M8 26h16"/>
          <path d="M10 26c0-4-2-8 0-12h12c2 4 0 8 0 12"/>
          <path d="M16 14v-4"/>
          <circle cx="16" cy="8" r="2"/>
          <path d="M12 16c1 2 3 2 4 0s3-2 4 0"/>
        </svg>
        <span class="text-sm font-semibold text-olive-800">Dessert</span>
      </button>
    </div>
  </div>
</section>

<!-- ========== ABOUT ========== -->
<section id="about" class="py-16 bg-white">
  <div class="max-w-4xl mx-auto px-6">
    <div class="reveal grid md:grid-cols-[1fr_1.5fr] gap-10 items-center">
      <div class="w-full aspect-square bg-gradient-to-br from-saffron-100 to-cream-200 rounded-2xl flex items-center justify-center">
        <svg class="w-20 h-20 text-saffron-400" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="32" cy="28" r="14"/>
          <path d="M18 52c0-8 6-14 14-14s14 6 14 14"/>
          <path d="M28 24c0-1 1-2 2-2h4c1 0 2 1 2 2v2c0 1-1 2-2 2h-4c-1 0-2-1-2-2v-2z"/>
        </svg>
      </div>
      <div>
        <span class="text-saffron-600 text-xs font-bold tracking-widest uppercase mb-2 block">About The Author</span>
        <h2 class="font-display text-2xl font-bold text-olive-900 mb-4">Cooking is an act of love</h2>
        <p class="text-gray-500 leading-relaxed mb-4">The Kitchen Table is where I share recipes that have been passed down, discovered, or invented during late-night kitchen experiments. Every recipe is tested at least three times before it makes it here.</p>
        <p class="text-gray-400 text-sm leading-relaxed">I believe in simple ingredients, honest techniques, and the joy of feeding the people you love. No fussy plating, no impossible-to-find ingredients -- just real food for real kitchens.</p>
      </div>
    </div>
  </div>
</section>

<!-- ========== NEWSLETTER ========== -->
<section id="newsletter" class="newsletter-section py-16 bg-gradient-to-br from-saffron-600 to-terra-700 relative overflow-hidden">
  <div class="absolute inset-0 opacity-5">
    <svg class="w-full h-full" viewBox="0 0 400 200"><circle cx="50" cy="100" r="80" stroke="white" stroke-width="0.5" fill="none"/><circle cx="350" cy="80" r="60" stroke="white" stroke-width="0.5" fill="none"/><circle cx="200" cy="150" r="40" stroke="white" stroke-width="0.5" fill="none"/></svg>
  </div>
  <div class="max-w-xl mx-auto px-6 text-center relative z-10">
    <div class="reveal">
      <svg class="w-12 h-12 mx-auto text-white/80 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48" stroke-width="1.5">
        <rect x="4" y="10" width="40" height="28" rx="4"/>
        <path d="M4 14l20 14 20-14"/>
      </svg>
      <h2 class="font-display text-3xl font-bold text-white mb-3">Get Weekly Recipes</h2>
      <p class="text-saffron-100 text-sm mb-8 leading-relaxed">Every Sunday morning, a new recipe lands in your inbox. Seasonal ingredients, tested techniques, and the occasional kitchen story.</p>
      <div class="flex gap-3 max-w-md mx-auto">
        <input type="email" placeholder="your@email.com" class="flex-1 bg-white/15 border border-white/25 rounded-full px-6 py-3 text-sm text-white placeholder-saffron-200/70 outline-none focus:bg-white/25 focus:border-white/40 transition-colors">
        <button onclick="handleSubscribe()" class="bg-white text-saffron-700 px-7 py-3 rounded-full text-sm font-bold hover:bg-cream-100 transition-colors shadow-lg cursor-pointer whitespace-nowrap">Subscribe</button>
      </div>
      <p class="text-saffron-200/60 text-xs mt-4">No spam. Unsubscribe anytime.</p>
    </div>
  </div>
</section>

<!-- ========== FOOTER ========== -->
<footer class="bg-olive-900 py-14 text-white/70">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid md:grid-cols-3 gap-10 mb-10">
      <!-- Brand -->
      <div>
        <div class="flex items-center gap-2.5 mb-4">
          <svg class="w-7 h-7 text-saffron-400" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 4v10c0 3.3 2.7 6 6 6s6-2.7 6-6V4"/>
            <line x1="8" y1="4" x2="24" y2="4"/>
            <line x1="16" y1="20" x2="16" y2="28"/>
            <line x1="12" y1="28" x2="20" y2="28"/>
          </svg>
          <span class="font-display text-lg font-bold text-white">The Kitchen Table</span>
        </div>
        <p class="text-sm leading-relaxed text-white/50">Honest recipes for everyday cooking. Made with love, tested in a real kitchen.</p>
      </div>
      <!-- Recipe Index -->
      <div>
        <h4 class="font-display text-sm font-bold text-white mb-4">Recipe Index</h4>
        <div class="grid grid-cols-2 gap-2 text-sm text-white/50">
          <a href="#" class="hover:text-saffron-400 transition-colors">Bread & Dough</a>
          <a href="#" class="hover:text-saffron-400 transition-colors">Pasta & Noodles</a>
          <a href="#" class="hover:text-saffron-400 transition-colors">Salads & Bowls</a>
          <a href="#" class="hover:text-saffron-400 transition-colors">Soups & Stews</a>
          <a href="#" class="hover:text-saffron-400 transition-colors">Desserts</a>
          <a href="#" class="hover:text-saffron-400 transition-colors">Quick Meals</a>
        </div>
      </div>
      <!-- Social -->
      <div>
        <h4 class="font-display text-sm font-bold text-white mb-4">Follow Along</h4>
        <div class="flex gap-3">
          <a href="#" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-saffron-600 transition-colors">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="6" r="1.5" fill="currentColor"/></svg>
          </a>
          <a href="#" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-saffron-600 transition-colors">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 001.88-2.38 8.59 8.59 0 01-2.72 1.04 4.28 4.28 0 00-7.32 3.91A12.16 12.16 0 013 4.86a4.28 4.28 0 001.32 5.72 4.24 4.24 0 01-1.94-.54v.05a4.28 4.28 0 003.43 4.2 4.27 4.27 0 01-1.93.07 4.29 4.29 0 004 2.98A8.59 8.59 0 012 19.54a12.13 12.13 0 006.56 1.92c7.88 0 12.2-6.53 12.2-12.2l-.01-.56A8.72 8.72 0 0024 5.06a8.57 8.57 0 01-2.54.7z"/></svg>
          </a>
          <a href="#" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-saffron-600 transition-colors">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .55.04.81.1v-3.51a6.37 6.37 0 00-.81-.05A6.37 6.37 0 003.12 15.2a6.37 6.37 0 0010.67 4.72 6.37 6.37 0 001.88-4.53V8.72a8.28 8.28 0 004.84 1.56V6.83a4.84 4.84 0 01-.92-.14z"/></svg>
          </a>
          <a href="#" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-saffron-600 transition-colors">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </a>
        </div>
        <p class="text-xs text-white/30 mt-4">Tag us #TheKitchenTable</p>
      </div>
    </div>
    <div class="border-t border-white/10 pt-6 text-center">
      <p class="text-xs text-white/30">&copy; 2026 The Kitchen Table. All recipes are original. Made with flour-dusted hands.</p>
    </div>
  </div>
</footer>

<!-- Toast notification -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-olive-900 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"></div>

<script>
// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 2500);
}

// Print
function handlePrint() {
  showToast('Opening print dialog...');
  setTimeout(() => window.print(), 300);
}

// Newsletter subscribe
function handleSubscribe() {
  const input = document.querySelector('input[type="email"]');
  if (input && input.value.includes('@')) {
    showToast('Subscribed! Check your inbox for confirmation.');
    input.value = '';
  } else {
    showToast('Please enter a valid email address.');
  }
}

// Ingredient checkbox strikethrough
document.querySelectorAll('.ingredient-check').forEach(cb => {
  cb.addEventListener('change', function() {
    const label = this.nextElementSibling;
    if (this.checked) {
      label.style.textDecoration = 'line-through';
      label.style.color = '#a1a1aa';
    } else {
      label.style.textDecoration = 'none';
      label.style.color = '';
    }
  });
});

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

// Close mobile menu on nav click
document.querySelectorAll('#mobile-menu a').forEach(a => {
  a.addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.add('hidden');
  });
});

// Category pill hover feedback
document.querySelectorAll('.category-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    showToast('Category filter coming soon!');
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
