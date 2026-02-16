INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '5bb5362f-db51-444d-b6d7-fbca1f3069ac',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NOIR — 時裝</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500&family=Noto+Sans+TC:wght@300;400;500&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        noir: '#0a0a0a',
        bone: '#f5f0eb',
        warm: '#e8e2db',
        ash: '#999490',
        stone: '#666360',
        cream: '#faf7f4'
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['Inter', 'Noto Sans TC', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', 'Noto Sans TC', sans-serif; background: #fff; color: #0a0a0a; }

  /* Product card hover */
  .product-card { cursor: pointer; }
  .product-card .img-wrap { overflow: hidden; }
  .product-card .img-primary { transition: opacity 0.5s ease; }
  .product-card .img-hover { opacity: 0; transition: opacity 0.5s ease; position: absolute; inset: 0; }
  .product-card:hover .img-primary { opacity: 0; }
  .product-card:hover .img-hover { opacity: 1; }
  .product-card .quick-add {
    opacity: 0; transform: translateY(8px);
    transition: all 0.3s ease;
  }
  .product-card:hover .quick-add { opacity: 1; transform: translateY(0); }

  /* Cart drawer */
  .cart-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    opacity: 0; pointer-events: none; transition: opacity 0.3s ease; z-index: 60;
  }
  .cart-overlay.open { opacity: 1; pointer-events: auto; }
  .cart-drawer {
    position: fixed; top: 0; right: 0; bottom: 0; width: 400px; max-width: 90vw;
    background: white; transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); z-index: 70;
    overflow-y: auto;
  }
  .cart-drawer.open { transform: translateX(0); }

  /* Size selector */
  .size-btn { transition: all 0.2s ease; }
  .size-btn:hover { border-color: #0a0a0a; }
  .size-btn.active { background: #0a0a0a; color: white; border-color: #0a0a0a; }

  /* Animations */
  .fade-up {
    opacity: 0; transform: translateY(20px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .fade-up.visible { opacity: 1; transform: translateY(0); }

  /* Page system */
  .page { display: none; }
  .page.active { display: block; }

  /* Product detail image gallery */
  .thumb { transition: all 0.2s ease; cursor: pointer; border: 2px solid transparent; }
  .thumb.active, .thumb:hover { border-color: #0a0a0a; }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: white; }
  ::-webkit-scrollbar-thumb { background: #e8e2db; border-radius: 2px; }
</style>
</head>
<body>

<!-- Header -->
<header class="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-warm/50">
  <div class="max-w-7xl mx-auto px-6">
    <!-- Top bar -->
    <div class="hidden md:flex items-center justify-center py-1.5 border-b border-warm/30">
      <span class="text-[10px] text-ash tracking-wider uppercase font-body">全館免運 · 14 天無條件退換</span>
    </div>
    <!-- Main nav -->
    <div class="h-14 flex items-center justify-between">
      <nav class="hidden md:flex items-center gap-8">
        <a onclick="showPage('home')" class="cursor-pointer text-xs font-body text-stone hover:text-noir tracking-wider uppercase transition-colors">新品</a>
        <a onclick="filterProducts('women')" class="cursor-pointer text-xs font-body text-stone hover:text-noir tracking-wider uppercase transition-colors">女裝</a>
        <a onclick="filterProducts('men')" class="cursor-pointer text-xs font-body text-stone hover:text-noir tracking-wider uppercase transition-colors">男裝</a>
        <a onclick="filterProducts('accessory')" class="cursor-pointer text-xs font-body text-stone hover:text-noir tracking-wider uppercase transition-colors">配件</a>
      </nav>

      <a onclick="showPage('home')" class="cursor-pointer absolute left-1/2 -translate-x-1/2">
        <h1 class="font-display text-2xl font-semibold tracking-[0.2em] text-noir">NOIR</h1>
      </a>

      <div class="flex items-center gap-5 ml-auto">
        <button onclick="handleAction('搜尋')" class="text-stone hover:text-noir transition-colors hidden md:block">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
        <button onclick="handleAction('登入')" class="text-stone hover:text-noir transition-colors hidden md:block">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </button>
        <button onclick="openCart()" class="text-stone hover:text-noir transition-colors relative">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          <span id="cartCount" class="absolute -top-1 -right-1.5 w-4 h-4 bg-noir text-white text-[9px] rounded-full flex items-center justify-center hidden">0</span>
        </button>
      </div>
    </div>
  </div>
</header>

<!-- HOME PAGE -->
<div id="page-home" class="page active">
  <!-- Hero -->
  <section class="pt-28 md:pt-32 pb-16 px-6">
    <div class="max-w-7xl mx-auto">
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Hero image left -->
        <div class="aspect-[3/4] bg-gradient-to-b from-bone to-warm rounded-sm overflow-hidden relative group cursor-pointer" onclick="showPage('detail')">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div class="text-8xl opacity-20">👗</div>
              <div class="text-xs text-ash mt-2">SS26 Collection</div>
            </div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-noir/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div class="text-xs tracking-widest uppercase mb-1">2026 春夏系列</div>
            <div class="font-display text-2xl italic">Quiet Luxury</div>
          </div>
        </div>
        <!-- Right grid -->
        <div class="grid grid-rows-2 gap-6">
          <div class="aspect-[4/3] bg-gradient-to-br from-cream to-warm rounded-sm overflow-hidden relative group cursor-pointer" onclick="filterProducts('women')">
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-6xl opacity-20">🧥</span>
            </div>
            <div class="absolute bottom-4 left-4">
              <div class="text-xs text-stone tracking-widest uppercase">Women's</div>
              <div class="font-display text-lg">女裝</div>
            </div>
          </div>
          <div class="aspect-[4/3] bg-gradient-to-br from-noir to-stone rounded-sm overflow-hidden relative group cursor-pointer" onclick="filterProducts('men')">
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-6xl opacity-20">🧣</span>
            </div>
            <div class="absolute bottom-4 left-4 text-white">
              <div class="text-xs tracking-widest uppercase opacity-70">Men's</div>
              <div class="font-display text-lg">男裝</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Product Grid -->
  <section class="px-6 pb-20">
    <div class="max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-8 fade-up">
        <h2 class="font-display text-2xl">精選商品</h2>
        <div class="flex items-center gap-4">
          <button onclick="filterProducts('all')" class="text-xs text-noir tracking-wider uppercase border-b border-noir pb-0.5 filter-btn active" data-filter="all">全部</button>
          <button onclick="filterProducts('women')" class="text-xs text-ash tracking-wider uppercase hover:text-noir transition-colors filter-btn" data-filter="women">女裝</button>
          <button onclick="filterProducts('men')" class="text-xs text-ash tracking-wider uppercase hover:text-noir transition-colors filter-btn" data-filter="men">男裝</button>
          <button onclick="filterProducts('accessory')" class="text-xs text-ash tracking-wider uppercase hover:text-noir transition-colors filter-btn" data-filter="accessory">配件</button>
        </div>
      </div>

      <div id="productGrid" class="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">

        <div class="product-card fade-up" data-cat="women" onclick="showProduct(0)">
          <div class="img-wrap aspect-[3/4] bg-bone rounded-sm relative mb-3">
            <div class="img-primary absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-30">👚</span></div>
            <div class="img-hover flex items-center justify-center bg-warm"><span class="text-5xl opacity-30">👚</span></div>
            <div class="quick-add absolute bottom-3 left-3 right-3">
              <button onclick="event.stopPropagation();addToCart('絲質襯衫')" class="w-full py-2 bg-noir text-white text-xs tracking-wider rounded-sm hover:bg-stone transition-colors">加入購物車</button>
            </div>
            <div class="absolute top-3 left-3 px-2 py-0.5 bg-noir text-white text-[10px] tracking-wider">NEW</div>
          </div>
          <h3 class="text-xs font-body mb-1">柔光絲質襯衫</h3>
          <p class="text-xs text-ash">NT$ 3,280</p>
        </div>

        <div class="product-card fade-up" data-cat="women" onclick="showProduct(1)">
          <div class="img-wrap aspect-[3/4] bg-gradient-to-b from-cream to-bone rounded-sm relative mb-3">
            <div class="img-primary absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-30">👗</span></div>
            <div class="img-hover flex items-center justify-center bg-warm"><span class="text-5xl opacity-30">👗</span></div>
            <div class="quick-add absolute bottom-3 left-3 right-3">
              <button onclick="event.stopPropagation();addToCart('羊毛洋裝')" class="w-full py-2 bg-noir text-white text-xs tracking-wider rounded-sm">加入購物車</button>
            </div>
          </div>
          <h3 class="text-xs font-body mb-1">駝色羊毛直筒洋裝</h3>
          <p class="text-xs text-ash">NT$ 5,680</p>
        </div>

        <div class="product-card fade-up" data-cat="men" onclick="showProduct(2)">
          <div class="img-wrap aspect-[3/4] bg-gradient-to-b from-stone/20 to-warm rounded-sm relative mb-3">
            <div class="img-primary absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-30">🧥</span></div>
            <div class="img-hover flex items-center justify-center bg-bone"><span class="text-5xl opacity-30">🧥</span></div>
            <div class="quick-add absolute bottom-3 left-3 right-3">
              <button onclick="event.stopPropagation();addToCart('風衣外套')" class="w-full py-2 bg-noir text-white text-xs tracking-wider rounded-sm">加入購物車</button>
            </div>
          </div>
          <h3 class="text-xs font-body mb-1">經典風衣外套</h3>
          <p class="text-xs text-ash">NT$ 8,900</p>
        </div>

        <div class="product-card fade-up" data-cat="accessory" onclick="showProduct(3)">
          <div class="img-wrap aspect-[3/4] bg-bone rounded-sm relative mb-3">
            <div class="img-primary absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-30">👜</span></div>
            <div class="img-hover flex items-center justify-center bg-warm"><span class="text-5xl opacity-30">👜</span></div>
            <div class="quick-add absolute bottom-3 left-3 right-3">
              <button onclick="event.stopPropagation();addToCart('皮革托特包')" class="w-full py-2 bg-noir text-white text-xs tracking-wider rounded-sm">加入購物車</button>
            </div>
            <div class="absolute top-3 left-3 px-2 py-0.5 bg-noir text-white text-[10px] tracking-wider">BEST</div>
          </div>
          <h3 class="text-xs font-body mb-1">植鞣皮革托特包</h3>
          <p class="text-xs text-ash">NT$ 4,280</p>
        </div>

        <div class="product-card fade-up" data-cat="men" onclick="showProduct(4)">
          <div class="img-wrap aspect-[3/4] bg-gradient-to-b from-noir/10 to-bone rounded-sm relative mb-3">
            <div class="img-primary absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-30">👔</span></div>
            <div class="img-hover flex items-center justify-center bg-warm"><span class="text-5xl opacity-30">👔</span></div>
            <div class="quick-add absolute bottom-3 left-3 right-3">
              <button onclick="event.stopPropagation();addToCart('亞麻西裝')" class="w-full py-2 bg-noir text-white text-xs tracking-wider rounded-sm">加入購物車</button>
            </div>
          </div>
          <h3 class="text-xs font-body mb-1">水洗亞麻休閒西裝</h3>
          <p class="text-xs text-ash">NT$ 6,480</p>
        </div>

        <div class="product-card fade-up" data-cat="women" onclick="showProduct(5)">
          <div class="img-wrap aspect-[3/4] bg-cream rounded-sm relative mb-3">
            <div class="img-primary absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-30">🧶</span></div>
            <div class="img-hover flex items-center justify-center bg-warm"><span class="text-5xl opacity-30">🧶</span></div>
            <div class="quick-add absolute bottom-3 left-3 right-3">
              <button onclick="event.stopPropagation();addToCart('針織毛衣')" class="w-full py-2 bg-noir text-white text-xs tracking-wider rounded-sm">加入購物車</button>
            </div>
          </div>
          <h3 class="text-xs font-body mb-1">霧灰羊絨針織衫</h3>
          <p class="text-xs text-ash">NT$ 4,980</p>
        </div>

        <div class="product-card fade-up" data-cat="accessory" onclick="showProduct(6)">
          <div class="img-wrap aspect-[3/4] bg-bone rounded-sm relative mb-3">
            <div class="img-primary absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-30">🧣</span></div>
            <div class="img-hover flex items-center justify-center bg-warm"><span class="text-5xl opacity-30">🧣</span></div>
            <div class="quick-add absolute bottom-3 left-3 right-3">
              <button onclick="event.stopPropagation();addToCart('喀什米爾圍巾')" class="w-full py-2 bg-noir text-white text-xs tracking-wider rounded-sm">加入購物車</button>
            </div>
          </div>
          <h3 class="text-xs font-body mb-1">喀什米爾羊毛圍巾</h3>
          <p class="text-xs text-ash">NT$ 2,680</p>
        </div>

        <div class="product-card fade-up" data-cat="men" onclick="showProduct(7)">
          <div class="img-wrap aspect-[3/4] bg-gradient-to-b from-warm to-cream rounded-sm relative mb-3">
            <div class="img-primary absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-30">👟</span></div>
            <div class="img-hover flex items-center justify-center bg-bone"><span class="text-5xl opacity-30">👟</span></div>
            <div class="quick-add absolute bottom-3 left-3 right-3">
              <button onclick="event.stopPropagation();addToCart('皮革德比鞋')" class="w-full py-2 bg-noir text-white text-xs tracking-wider rounded-sm">加入購物車</button>
            </div>
          </div>
          <h3 class="text-xs font-body mb-1">手工皮革德比鞋</h3>
          <p class="text-xs text-ash">NT$ 7,200</p>
        </div>

      </div>
    </div>
  </section>

  <!-- Brand Story -->
  <section class="py-20 px-6 bg-noir text-white">
    <div class="max-w-4xl mx-auto text-center fade-up">
      <div class="font-display text-4xl md:text-5xl italic leading-tight mb-6">
        "Less noise,<br>more substance."
      </div>
      <p class="text-sm text-ash max-w-lg mx-auto leading-relaxed mb-8">
        NOIR 相信好的衣服不需要大聲喊叫。我們追求的是安靜的品質——在剪裁中感受用心，在面料中觸摸溫度。
        每一件作品都經過至少 40 道工序，從選料到成衣，堅持手工品質。
      </p>
      <a onclick="handleAction('品牌故事')" class="cursor-pointer text-xs tracking-widest uppercase border-b border-ash pb-1 text-ash hover:text-white hover:border-white transition-colors">
        了解品牌故事 →
      </a>
    </div>
  </section>
</div>

<!-- PRODUCT DETAIL PAGE -->
<div id="page-detail" class="page">
  <div class="pt-28 pb-20 px-6">
    <div class="max-w-6xl mx-auto">
      <a onclick="showPage('home')" class="cursor-pointer text-xs text-ash hover:text-noir transition-colors inline-flex items-center gap-1 mb-8">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
        返回
      </a>

      <div class="grid md:grid-cols-2 gap-10">
        <!-- Images -->
        <div>
          <div class="aspect-[3/4] bg-bone rounded-sm flex items-center justify-center mb-3" id="mainImage">
            <span class="text-8xl opacity-20" id="mainEmoji">👗</span>
          </div>
          <div class="grid grid-cols-4 gap-2">
            <div class="thumb active aspect-square bg-bone rounded-sm flex items-center justify-center" onclick="changeImage(this, '👗')">
              <span class="text-2xl opacity-30">👗</span>
            </div>
            <div class="thumb aspect-square bg-warm rounded-sm flex items-center justify-center" onclick="changeImage(this, '👗')">
              <span class="text-2xl opacity-30">👗</span>
            </div>
            <div class="thumb aspect-square bg-cream rounded-sm flex items-center justify-center" onclick="changeImage(this, '👗')">
              <span class="text-2xl opacity-30">👗</span>
            </div>
            <div class="thumb aspect-square bg-bone rounded-sm flex items-center justify-center" onclick="changeImage(this, '👗')">
              <span class="text-2xl opacity-30">👗</span>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div>
          <div class="text-xs text-ash tracking-widest uppercase mb-2">NOIR · 2026 春夏</div>
          <h1 class="font-display text-3xl mb-2" id="detailTitle">駝色羊毛直筒洋裝</h1>
          <div class="text-lg font-body font-medium mb-6" id="detailPrice">NT$ 5,680</div>

          <div class="text-xs text-ash leading-relaxed mb-8" id="detailDesc">
            採用 100% 美麗諾羊毛，自然垂墜的直筒剪裁。簡約的圓領設計搭配隱藏式側袋，
            兼具日常實用與優雅氣質。適合辦公室或週末約會。
          </div>

          <!-- Color -->
          <div class="mb-6">
            <div class="text-xs text-stone mb-3">顏色：<span class="text-noir" id="colorName">駝色</span></div>
            <div class="flex items-center gap-2">
              <button class="w-7 h-7 rounded-full bg-[#c4a77d] ring-2 ring-noir ring-offset-2 transition-all" onclick="selectColor(this, '駝色')"></button>
              <button class="w-7 h-7 rounded-full bg-noir ring-2 ring-transparent ring-offset-2 hover:ring-ash transition-all" onclick="selectColor(this, '黑色')"></button>
              <button class="w-7 h-7 rounded-full bg-[#f5f0eb] border ring-2 ring-transparent ring-offset-2 hover:ring-ash transition-all" onclick="selectColor(this, '米白')"></button>
            </div>
          </div>

          <!-- Size -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-stone">尺寸</span>
              <a onclick="handleAction('尺寸指南')" class="cursor-pointer text-xs text-ash underline underline-offset-2 hover:text-noir transition-colors">尺寸指南</a>
            </div>
            <div class="flex items-center gap-2">
              <button class="size-btn w-12 h-10 border border-warm text-xs font-body rounded-sm hover:border-noir transition-all" onclick="selectSize(this)">XS</button>
              <button class="size-btn w-12 h-10 border border-warm text-xs font-body rounded-sm hover:border-noir transition-all" onclick="selectSize(this)">S</button>
              <button class="size-btn active w-12 h-10 border border-noir bg-noir text-white text-xs font-body rounded-sm" onclick="selectSize(this)">M</button>
              <button class="size-btn w-12 h-10 border border-warm text-xs font-body rounded-sm hover:border-noir transition-all" onclick="selectSize(this)">L</button>
              <button class="size-btn w-12 h-10 border border-warm text-xs font-body rounded-sm hover:border-noir transition-all text-ash" onclick="selectSize(this)">XL</button>
            </div>
          </div>

          <!-- Add to cart -->
          <button onclick="addToCart('駝色羊毛直筒洋裝')" class="w-full py-3.5 bg-noir text-white text-sm font-body tracking-wider rounded-sm hover:bg-stone transition-colors mb-3">
            加入購物車
          </button>
          <button onclick="handleAction('立即購買')" class="w-full py-3.5 border border-noir text-noir text-sm font-body tracking-wider rounded-sm hover:bg-noir hover:text-white transition-all">
            立即購買
          </button>

          <!-- Details -->
          <div class="mt-8 space-y-4 border-t border-warm pt-6">
            <details class="group">
              <summary class="flex items-center justify-between cursor-pointer text-xs text-stone py-2">
                <span>商品詳情</span>
                <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div class="text-xs text-ash leading-relaxed pb-3">
                <ul class="space-y-1 mt-2">
                  <li>材質：100% 美麗諾羊毛</li>
                  <li>產地：義大利面料 / 台灣製造</li>
                  <li>洗滌：建議乾洗</li>
                  <li>模特身高 170cm，穿著 S 號</li>
                </ul>
              </div>
            </details>
            <details class="group">
              <summary class="flex items-center justify-between cursor-pointer text-xs text-stone py-2 border-t border-warm">
                <span>配送與退換</span>
                <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div class="text-xs text-ash leading-relaxed pb-3">
                全館免運。標準配送 3-5 個工作天。14 天內未穿著、吊牌完整可退換。
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Cart Drawer -->
<div class="cart-overlay" id="cartOverlay" onclick="closeCart()"></div>
<div class="cart-drawer" id="cartDrawer">
  <div class="p-6 h-full flex flex-col">
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-display text-lg">購物車</h2>
      <button onclick="closeCart()" class="text-stone hover:text-noir transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <div id="cartItems" class="flex-1 overflow-y-auto space-y-4">
      <!-- Populated by JS -->
    </div>

    <div id="cartEmpty" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="text-4xl opacity-20 mb-3">🛒</div>
        <p class="text-xs text-ash">購物車是空的</p>
        <button onclick="closeCart();showPage('home')" class="mt-4 text-xs text-noir underline underline-offset-2">繼續購物</button>
      </div>
    </div>

    <div id="cartFooter" class="hidden border-t border-warm pt-4 mt-4">
      <div class="flex items-center justify-between mb-4">
        <span class="text-xs text-stone">小計</span>
        <span class="text-sm font-medium" id="cartTotal">NT$ 0</span>
      </div>
      <button onclick="handleAction('結帳')" class="w-full py-3 bg-noir text-white text-sm tracking-wider rounded-sm hover:bg-stone transition-colors">
        前往結帳
      </button>
      <p class="text-center text-[10px] text-ash mt-2">免運費 · 安全付款</p>
    </div>
  </div>
</div>

<!-- Footer -->
<footer class="border-t border-warm py-12 px-6 bg-cream">
  <div class="max-w-7xl mx-auto">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
      <div>
        <h3 class="font-display text-lg mb-4">NOIR</h3>
        <p class="text-xs text-ash leading-relaxed">Less noise, more substance.<br>安靜的品質，溫暖的設計。</p>
      </div>
      <div>
        <h4 class="text-xs font-medium tracking-wider uppercase mb-3">購物</h4>
        <div class="space-y-2">
          <a onclick="handleAction('女裝')" class="block text-xs text-ash hover:text-noir cursor-pointer transition-colors">女裝</a>
          <a onclick="handleAction('男裝')" class="block text-xs text-ash hover:text-noir cursor-pointer transition-colors">男裝</a>
          <a onclick="handleAction('配件')" class="block text-xs text-ash hover:text-noir cursor-pointer transition-colors">配件</a>
          <a onclick="handleAction('禮品卡')" class="block text-xs text-ash hover:text-noir cursor-pointer transition-colors">禮品卡</a>
        </div>
      </div>
      <div>
        <h4 class="text-xs font-medium tracking-wider uppercase mb-3">服務</h4>
        <div class="space-y-2">
          <a onclick="handleAction('配送資訊')" class="block text-xs text-ash hover:text-noir cursor-pointer transition-colors">配送資訊</a>
          <a onclick="handleAction('退換政策')" class="block text-xs text-ash hover:text-noir cursor-pointer transition-colors">退換政策</a>
          <a onclick="handleAction('尺寸指南')" class="block text-xs text-ash hover:text-noir cursor-pointer transition-colors">尺寸指南</a>
          <a onclick="handleAction('聯繫客服')" class="block text-xs text-ash hover:text-noir cursor-pointer transition-colors">聯繫客服</a>
        </div>
      </div>
      <div>
        <h4 class="text-xs font-medium tracking-wider uppercase mb-3">關注我們</h4>
        <div class="flex items-center gap-3">
          <a onclick="handleAction('Instagram')" class="cursor-pointer text-ash hover:text-noir transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg></a>
          <a onclick="handleAction('Facebook')" class="cursor-pointer text-ash hover:text-noir transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
          <a onclick="handleAction('LINE')" class="cursor-pointer text-ash hover:text-noir transition-colors text-xs font-bold">LINE</a>
        </div>
        <div class="mt-4">
          <p class="text-xs text-ash mb-2">訂閱新品通知</p>
          <div class="flex gap-1">
            <input type="email" placeholder="email@example.com" class="flex-1 px-3 py-2 bg-white border border-warm rounded-sm text-xs focus:outline-none focus:border-noir">
            <button onclick="handleAction('訂閱')" class="px-3 py-2 bg-noir text-white text-xs rounded-sm hover:bg-stone transition-colors">訂閱</button>
          </div>
        </div>
      </div>
    </div>
    <div class="border-t border-warm pt-6 text-center">
      <p class="text-[10px] text-ash">© 2026 NOIR. All rights reserved.</p>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-noir text-white px-5 py-3 rounded-sm text-xs font-body shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-80 max-w-sm text-center"></div>

<script>
// Cart state
let cart = [];

// Products
const products = [
  { name: '柔光絲質襯衫', price: 3280, emoji: '👚' },
  { name: '駝色羊毛直筒洋裝', price: 5680, emoji: '👗' },
  { name: '經典風衣外套', price: 8900, emoji: '🧥' },
  { name: '植鞣皮革托特包', price: 4280, emoji: '👜' },
  { name: '水洗亞麻休閒西裝', price: 6480, emoji: '👔' },
  { name: '霧灰羊絨針織衫', price: 4980, emoji: '🧶' },
  { name: '喀什米爾羊毛圍巾', price: 2680, emoji: '🧣' },
  { name: '手工皮革德比鞋', price: 7200, emoji: '👟' }
];

// Page navigation
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  window.scrollTo({ top: 0 });
  setTimeout(() => {
    document.querySelectorAll('.page.active .fade-up').forEach(el => el.classList.add('visible'));
  }, 100);
}

// Show product detail
function showProduct(index) {
  const p = products[index];
  if (!p) return;
  document.getElementById('detailTitle').textContent = p.name;
  document.getElementById('detailPrice').textContent = 'NT$ ' + p.price.toLocaleString();
  document.getElementById('mainEmoji').textContent = p.emoji;
  showPage('detail');
}

// Filter products
function filterProducts(cat) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const isActive = btn.dataset.filter === cat;
    btn.classList.toggle('text-noir', isActive);
    btn.classList.toggle('border-b', isActive);
    btn.classList.toggle('border-noir', isActive);
    btn.classList.toggle('text-ash', !isActive);
  });
  document.querySelectorAll('#productGrid .product-card').forEach(card => {
    if (cat === 'all') { card.style.display = 'block'; }
    else { card.style.display = card.dataset.cat === cat ? 'block' : 'none'; }
  });
}

// Size selector
function selectSize(el) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active', 'bg-noir', 'text-white', 'border-noir'));
  el.classList.add('active', 'bg-noir', 'text-white', 'border-noir');
}

// Color selector
function selectColor(el, name) {
  document.querySelectorAll('[onclick^="selectColor"]').forEach(b => b.classList.remove('ring-noir'));
  el.classList.add('ring-noir');
  document.getElementById('colorName').textContent = name;
}

// Image change
function changeImage(el) {
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

// Cart
function addToCart(name) {
  const existing = cart.find(i => i.name === name);
  if (existing) { existing.qty++; }
  else {
    const p = products.find(p => p.name === name) || { name, price: 3280, emoji: '🛒' };
    cart.push({ ...p, qty: 1 });
  }
  updateCart();
  openCart();
  showToast('已加入購物車');
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

function updateCart() {
  const countEl = document.getElementById('cartCount');
  const total = cart.reduce((s, i) => s + i.qty, 0);
  if (total > 0) { countEl.textContent = total; countEl.classList.remove('hidden'); }
  else { countEl.classList.add('hidden'); }

  const itemsEl = document.getElementById('cartItems');
  const emptyEl = document.getElementById('cartEmpty');
  const footerEl = document.getElementById('cartFooter');

  if (cart.length === 0) {
    itemsEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    footerEl.classList.add('hidden');
  } else {
    itemsEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
    footerEl.classList.remove('hidden');

    itemsEl.innerHTML = cart.map((item, i) => `
      <div class="flex gap-3 pb-4 border-b border-warm">
        <div class="w-16 h-20 bg-bone rounded-sm flex items-center justify-center flex-shrink-0">
          <span class="text-2xl opacity-30">${item.emoji}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-medium mb-1 truncate">${item.name}</h4>
          <p class="text-xs text-ash">M · 駝色</p>
          <div class="flex items-center justify-between mt-2">
            <div class="flex items-center gap-2 border border-warm rounded-sm">
              <button onclick="changeQty(${i},-1)" class="w-6 h-6 text-xs text-ash hover:text-noir">−</button>
              <span class="text-xs w-4 text-center">${item.qty}</span>
              <button onclick="changeQty(${i},1)" class="w-6 h-6 text-xs text-ash hover:text-noir">+</button>
            </div>
            <span class="text-xs font-medium">NT$ ${(item.price * item.qty).toLocaleString()}</span>
          </div>
        </div>
        <button onclick="removeFromCart(${i})" class="text-ash hover:text-noir transition-colors self-start">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    `).join('');

    const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);
    document.getElementById('cartTotal').textContent = 'NT$ ' + totalPrice.toLocaleString();
  }
}

function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  updateCart();
}

function openCart() {
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartDrawer').classList.add('open');
}
function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('cartDrawer').classList.remove('open');
}

// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1'; t.style.transform = 'translate(-50%, 0)';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translate(-50%, 8px)'; }, 2000);
}
function handleAction(a) { showToast(a + ' — 此為模板展示'); }

// IntersectionObserver
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
</script>

</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
