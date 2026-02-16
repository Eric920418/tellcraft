-- Template Preview: ecommerce-modern (Modern E-commerce)
-- 極簡電商，產品為主角，多頁面切換（Shop/Cart/Checkout）+ Cart Drawer
-- Pages: Shop (product grid + filter), Cart, Checkout

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '5bddd92b-b957-42b0-b04a-735766d940f4',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MONO — 精選生活好物</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { sans: ['Outfit', 'system-ui', 'sans-serif'] },
      colors: {
        shop: { 50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1', 800: '#292524', 900: '#1c1917' }
      }
    }
  }
}
</script>
<style>
  * { font-family: 'Outfit', system-ui, sans-serif; }
  body { overflow-x: hidden; }

  .product-card { transition: all 0.3s ease; }
  .product-card:hover { transform: translateY(-4px); }
  .product-card:hover .product-img { transform: scale(1.05); }
  .product-card:hover .quick-add { opacity: 1; transform: translateY(0); }
  .product-img { transition: transform 0.5s ease; }
  .quick-add { opacity: 0; transform: translateY(8px); transition: all 0.3s ease; }

  .cart-drawer {
    transform: translateX(100%);
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .cart-drawer.open { transform: translateX(0); }
  .cart-overlay {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }
  .cart-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  .size-btn { transition: all 0.15s ease; }
  .size-btn.active { background: #1c1917; color: white; }

  .filter-btn { transition: all 0.15s ease; }
  .filter-btn.active { background: #1c1917; color: white; }

  .qty-btn { transition: all 0.15s ease; }
  .qty-btn:hover { background: #f5f5f4; }
  .qty-btn:active { transform: scale(0.95); }

  .page { display: none; }
  .page.active { display: block; }

  .form-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #e7e5e4;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s;
    outline: none;
  }
  .form-input:focus {
    border-color: #1c1917;
    box-shadow: 0 0 0 3px rgba(28,25,23,0.05);
  }

  .badge-cart {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 18px;
    height: 18px;
    background: #1c1917;
    color: white;
    font-size: 10px;
    font-weight: 600;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
</head>
<body class="bg-white text-shop-900 antialiased">

<!-- Header -->
<header class="sticky top-0 z-40 bg-white border-b border-shop-100">
  <div class="max-w-7xl mx-auto px-6">
    <!-- Announcement bar -->
    <div class="text-center py-2 text-xs text-shop-800 font-medium border-b border-shop-100 -mx-6 px-6">
      免運優惠 · 滿 NT$2,000 全台免運 · <button onclick="showToast('優惠碼：FREESHIP')" class="underline cursor-pointer">了解更多</button>
    </div>
    <div class="flex items-center justify-between h-16">
      <button onclick="showPage('shop')" class="font-bold text-xl tracking-tight cursor-pointer">MONO</button>

      <nav class="hidden md:flex items-center gap-8">
        <button onclick="filterProducts('all')" class="text-sm font-medium text-gray-600 hover:text-shop-900 transition-colors cursor-pointer">全部商品</button>
        <button onclick="filterProducts('furniture')" class="text-sm font-medium text-gray-600 hover:text-shop-900 transition-colors cursor-pointer">傢俱</button>
        <button onclick="filterProducts('lighting')" class="text-sm font-medium text-gray-600 hover:text-shop-900 transition-colors cursor-pointer">燈具</button>
        <button onclick="filterProducts('decor')" class="text-sm font-medium text-gray-600 hover:text-shop-900 transition-colors cursor-pointer">居家飾品</button>
        <button onclick="filterProducts('audio')" class="text-sm font-medium text-gray-600 hover:text-shop-900 transition-colors cursor-pointer">音響</button>
      </nav>

      <div class="flex items-center gap-5">
        <button onclick="showToast('搜尋功能開發中')" class="cursor-pointer text-gray-600 hover:text-shop-900 transition-colors">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </button>
        <button onclick="showToast('會員功能開發中')" class="cursor-pointer text-gray-600 hover:text-shop-900 transition-colors">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </button>
        <button onclick="openCart()" class="relative cursor-pointer text-gray-600 hover:text-shop-900 transition-colors">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          <span id="cart-badge" class="badge-cart hidden">0</span>
        </button>
      </div>
    </div>
  </div>
</header>

<!-- ==================== SHOP PAGE ==================== -->
<div id="page-shop" class="page active">
  <!-- Hero Banner -->
  <section class="bg-shop-50 py-20 lg:py-28">
    <div class="max-w-7xl mx-auto px-6 text-center">
      <p class="text-xs tracking-widest uppercase text-gray-500 mb-4">2026 春季新品</p>
      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight mb-6">Less is <span class="font-semibold">More</span></h1>
      <p class="text-gray-500 text-base max-w-lg mx-auto mb-8">回歸本質的生活美學。每件物品都經過嚴格篩選，只為你的空間帶來最純粹的美好。</p>
      <button onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})" class="bg-shop-900 text-white text-sm font-medium px-8 py-3.5 rounded-full hover:bg-shop-800 transition-all cursor-pointer">
        探索新品
      </button>
    </div>
  </section>

  <!-- Filter Bar -->
  <section id="products" class="max-w-7xl mx-auto px-6 pt-12 pb-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap gap-2">
        <button onclick="filterProducts('all')" class="filter-btn active text-xs font-medium px-4 py-2 rounded-full border border-shop-200 cursor-pointer" data-filter="all">全部</button>
        <button onclick="filterProducts('furniture')" class="filter-btn text-xs font-medium px-4 py-2 rounded-full border border-shop-200 text-gray-600 cursor-pointer" data-filter="furniture">傢俱</button>
        <button onclick="filterProducts('lighting')" class="filter-btn text-xs font-medium px-4 py-2 rounded-full border border-shop-200 text-gray-600 cursor-pointer" data-filter="lighting">燈具</button>
        <button onclick="filterProducts('decor')" class="filter-btn text-xs font-medium px-4 py-2 rounded-full border border-shop-200 text-gray-600 cursor-pointer" data-filter="decor">居家飾品</button>
        <button onclick="filterProducts('audio')" class="filter-btn text-xs font-medium px-4 py-2 rounded-full border border-shop-200 text-gray-600 cursor-pointer" data-filter="audio">音響</button>
      </div>
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <span id="product-count">8</span> 件商品
        <select onchange="sortProducts(this.value)" class="text-sm border border-shop-200 rounded-lg px-3 py-1.5 cursor-pointer outline-none" style="appearance: auto;">
          <option value="default">預設排序</option>
          <option value="price-low">價格低到高</option>
          <option value="price-high">價格高到低</option>
          <option value="newest">最新上架</option>
        </select>
      </div>
    </div>
  </section>

  <!-- Product Grid -->
  <section class="max-w-7xl mx-auto px-6 pb-20">
    <div id="product-grid" class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
      <!-- Products are rendered by JS -->
    </div>
  </section>
</div>

<!-- ==================== CART PAGE ==================== -->
<div id="page-cart" class="page">
  <div class="max-w-4xl mx-auto px-6 py-16">
    <h2 class="text-2xl font-semibold mb-2">購物車</h2>
    <p class="text-gray-500 text-sm mb-10" id="cart-page-count">0 件商品</p>

    <div id="cart-items-page" class="space-y-0 border-t border-shop-100">
      <!-- Rendered by JS -->
    </div>

    <div id="cart-empty-page" class="text-center py-20 hidden">
      <svg class="mx-auto mb-4" width="48" height="48" fill="none" stroke="#d6d3d1" stroke-width="1" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
      <p class="text-gray-400 text-sm mb-4">購物車是空的</p>
      <button onclick="showPage('shop')" class="text-sm font-medium text-shop-900 underline cursor-pointer">繼續逛逛</button>
    </div>

    <div id="cart-summary-page" class="mt-8 border-t border-shop-100 pt-8">
      <div class="flex justify-between text-sm mb-3">
        <span class="text-gray-500">小計</span>
        <span id="subtotal-page" class="font-medium">NT$0</span>
      </div>
      <div class="flex justify-between text-sm mb-3">
        <span class="text-gray-500">運費</span>
        <span id="shipping-page" class="font-medium">NT$60</span>
      </div>
      <div class="flex justify-between text-base font-semibold mt-4 pt-4 border-t border-shop-100">
        <span>總計</span>
        <span id="total-page">NT$0</span>
      </div>
      <button onclick="showPage('checkout')" class="w-full mt-6 bg-shop-900 text-white text-sm font-medium py-4 rounded-xl hover:bg-shop-800 transition-all cursor-pointer">
        前往結帳
      </button>
      <button onclick="showPage('shop')" class="w-full mt-3 text-sm text-gray-500 font-medium py-3 cursor-pointer hover:text-shop-900 transition-colors">
        ← 繼續購物
      </button>
    </div>
  </div>
</div>

<!-- ==================== CHECKOUT PAGE ==================== -->
<div id="page-checkout" class="page">
  <div class="max-w-6xl mx-auto px-6 py-16">
    <button onclick="showPage('cart')" class="text-sm text-gray-500 mb-8 flex items-center gap-2 cursor-pointer hover:text-shop-900 transition-colors">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      返回購物車
    </button>

    <div class="grid lg:grid-cols-12 gap-12">
      <!-- Form -->
      <div class="lg:col-span-7">
        <h2 class="text-xl font-semibold mb-8">結帳資訊</h2>

        <!-- Contact -->
        <div class="mb-8">
          <h3 class="text-sm font-semibold mb-4 text-gray-700">聯絡資訊</h3>
          <input type="email" class="form-input" placeholder="Email 地址">
        </div>

        <!-- Shipping -->
        <div class="mb-8">
          <h3 class="text-sm font-semibold mb-4 text-gray-700">寄送地址</h3>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <input type="text" class="form-input" placeholder="姓">
            <input type="text" class="form-input" placeholder="名">
          </div>
          <input type="text" class="form-input mb-4" placeholder="地址">
          <div class="grid grid-cols-3 gap-4">
            <input type="text" class="form-input" placeholder="城市">
            <select class="form-input cursor-pointer" style="appearance: auto;">
              <option>台北市</option>
              <option>新北市</option>
              <option>桃園市</option>
              <option>台中市</option>
              <option>台南市</option>
              <option>高雄市</option>
            </select>
            <input type="text" class="form-input" placeholder="郵遞區號">
          </div>
          <input type="tel" class="form-input mt-4" placeholder="電話號碼">
        </div>

        <!-- Shipping Method -->
        <div class="mb-8">
          <h3 class="text-sm font-semibold mb-4 text-gray-700">配送方式</h3>
          <div class="space-y-3">
            <label class="flex items-center justify-between p-4 border border-shop-900 rounded-xl cursor-pointer bg-shop-50">
              <div class="flex items-center gap-3">
                <div class="w-5 h-5 rounded-full border-2 border-shop-900 flex items-center justify-center">
                  <div class="w-2.5 h-2.5 rounded-full bg-shop-900"></div>
                </div>
                <div>
                  <div class="text-sm font-medium">標準配送</div>
                  <div class="text-xs text-gray-500">3-5 個工作天</div>
                </div>
              </div>
              <span class="text-sm font-medium">NT$60</span>
            </label>
            <label onclick="showToast('已切換為快速配送 NT$120')" class="flex items-center justify-between p-4 border border-shop-200 rounded-xl cursor-pointer hover:border-shop-300 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-5 h-5 rounded-full border-2 border-shop-300 flex items-center justify-center"></div>
                <div>
                  <div class="text-sm font-medium">快速配送</div>
                  <div class="text-xs text-gray-500">1-2 個工作天</div>
                </div>
              </div>
              <span class="text-sm font-medium">NT$120</span>
            </label>
          </div>
        </div>

        <!-- Payment -->
        <div class="mb-8">
          <h3 class="text-sm font-semibold mb-4 text-gray-700">付款方式</h3>
          <div class="border border-shop-200 rounded-xl overflow-hidden">
            <div class="p-4 border-b border-shop-100 bg-shop-50 flex items-center gap-3">
              <div class="w-5 h-5 rounded-full border-2 border-shop-900 flex items-center justify-center">
                <div class="w-2.5 h-2.5 rounded-full bg-shop-900"></div>
              </div>
              <span class="text-sm font-medium">信用卡</span>
              <div class="flex gap-2 ml-auto">
                <div class="w-10 h-6 bg-blue-600 rounded text-white text-[8px] flex items-center justify-center font-bold">VISA</div>
                <div class="w-10 h-6 bg-red-500 rounded text-white text-[8px] flex items-center justify-center font-bold">MC</div>
                <div class="w-10 h-6 bg-blue-400 rounded text-white text-[8px] flex items-center justify-center font-bold">JCB</div>
              </div>
            </div>
            <div class="p-4 space-y-4">
              <input type="text" class="form-input" placeholder="卡號" maxlength="19">
              <div class="grid grid-cols-2 gap-4">
                <input type="text" class="form-input" placeholder="MM / YY">
                <input type="text" class="form-input" placeholder="CVV" maxlength="4">
              </div>
              <input type="text" class="form-input" placeholder="持卡人姓名">
            </div>
          </div>
        </div>

        <button onclick="handleCheckout()" class="w-full bg-shop-900 text-white text-sm font-semibold py-4 rounded-xl hover:bg-shop-800 transition-all cursor-pointer">
          確認付款
        </button>
      </div>

      <!-- Order Summary -->
      <div class="lg:col-span-5">
        <div class="bg-shop-50 rounded-2xl p-6 sticky top-24">
          <h3 class="text-sm font-semibold mb-6">訂單摘要</h3>
          <div id="checkout-items" class="space-y-4 mb-6">
            <!-- Rendered by JS -->
          </div>
          <div class="border-t border-shop-200 pt-4 space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">小計</span>
              <span id="checkout-subtotal">NT$0</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">運費</span>
              <span id="checkout-shipping">NT$60</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">折扣</span>
              <span class="text-green-600">-NT$0</span>
            </div>
            <div class="flex justify-between font-semibold text-base pt-3 border-t border-shop-200">
              <span>總計</span>
              <span id="checkout-total">NT$0</span>
            </div>
          </div>
          <!-- Coupon -->
          <div class="mt-6 flex gap-2">
            <input type="text" class="form-input flex-1" placeholder="優惠碼" id="coupon-input">
            <button onclick="applyCoupon()" class="bg-shop-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-shop-800 cursor-pointer whitespace-nowrap">套用</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ==================== CART DRAWER ==================== -->
<div id="cart-overlay" class="cart-overlay fixed inset-0 bg-black/40 z-50" onclick="closeCart()"></div>
<div id="cart-drawer" class="cart-drawer fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl">
  <div class="flex items-center justify-between px-6 py-5 border-b border-shop-100">
    <h3 class="font-semibold text-base">購物車 (<span id="drawer-count">0</span>)</h3>
    <button onclick="closeCart()" class="p-1 cursor-pointer hover:bg-shop-50 rounded-lg transition-colors">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  </div>

  <div id="cart-items-drawer" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
    <!-- Rendered by JS -->
  </div>

  <div id="cart-empty-drawer" class="flex-1 flex flex-col items-center justify-center hidden">
    <svg width="48" height="48" fill="none" stroke="#d6d3d1" stroke-width="1" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
    <p class="text-gray-400 text-sm mt-4">購物車是空的</p>
  </div>

  <div id="cart-footer-drawer" class="border-t border-shop-100 px-6 py-5">
    <div class="flex justify-between text-sm mb-1">
      <span class="text-gray-500">小計</span>
      <span id="drawer-subtotal" class="font-medium">NT$0</span>
    </div>
    <p class="text-xs text-gray-400 mb-4">運費將在結帳時計算</p>
    <button onclick="closeCart(); showPage('cart');" class="w-full bg-shop-900 text-white text-sm font-medium py-3.5 rounded-xl hover:bg-shop-800 transition-all cursor-pointer mb-2">
      查看購物車
    </button>
    <button onclick="closeCart(); showPage('checkout');" class="w-full text-sm font-medium text-gray-600 py-2.5 cursor-pointer hover:text-shop-900 transition-colors">
      直接結帳 →
    </button>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] opacity-0 pointer-events-none transition-all duration-300 translate-y-4">
  <div class="bg-shop-900 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3">
    <svg width="16" height="16" fill="none" stroke="#22c55e" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
    <span id="toast-text"></span>
  </div>
</div>

<!-- Success Modal -->
<div id="success-modal" class="fixed inset-0 z-[300] hidden">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
  <div class="relative flex items-center justify-center h-full p-6">
    <div class="bg-white rounded-2xl p-10 text-center max-w-md w-full shadow-2xl">
      <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg width="32" height="32" fill="none" stroke="#16a34a" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
      </div>
      <h3 class="text-xl font-semibold mb-2">訂單已成立！</h3>
      <p class="text-gray-500 text-sm mb-2">訂單編號：#MONO-20260216-001</p>
      <p class="text-gray-400 text-xs mb-8">確認信已寄送至您的 Email</p>
      <button onclick="resetShop()" class="w-full bg-shop-900 text-white text-sm font-medium py-3.5 rounded-xl hover:bg-shop-800 cursor-pointer">
        繼續購物
      </button>
    </div>
  </div>
</div>

<script>
// ========== Product Data ==========
const products = [
  { id: 1, name: '極簡木質檯燈', price: 2480, category: 'lighting', color: 'bg-amber-50', accent: 'bg-amber-200', label: '熱銷' },
  { id: 2, name: '北歐圓形邊桌', price: 4980, category: 'furniture', color: 'bg-stone-100', accent: 'bg-stone-300', label: '新品' },
  { id: 3, name: '手工陶瓷花器', price: 1280, category: 'decor', color: 'bg-rose-50', accent: 'bg-rose-200', label: '' },
  { id: 4, name: '無線藍牙音響', price: 3680, category: 'audio', color: 'bg-slate-100', accent: 'bg-slate-300', label: '' },
  { id: 5, name: '曲木休閒椅', price: 8900, category: 'furniture', color: 'bg-orange-50', accent: 'bg-orange-200', label: '限量' },
  { id: 6, name: '幾何造型吊燈', price: 5480, category: 'lighting', color: 'bg-zinc-100', accent: 'bg-zinc-300', label: '' },
  { id: 7, name: '純棉編織抱枕', price: 980, category: 'decor', color: 'bg-sky-50', accent: 'bg-sky-200', label: '' },
  { id: 8, name: '桌上型黑膠唱機', price: 12800, category: 'audio', color: 'bg-neutral-100', accent: 'bg-neutral-400', label: '精選' },
];

let cart = [];
let currentFilter = 'all';

// ========== Render Products ==========
function renderProducts(filter = 'all', sort = 'default') {
  let filtered = filter === 'all' ? [...products] : products.filter(p => p.category === filter);

  if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price);
  if (sort === 'newest') filtered.reverse();

  document.getElementById('product-count').textContent = filtered.length;
  const grid = document.getElementById('product-grid');
  grid.innerHTML = filtered.map(p => `
    <div class="product-card cursor-pointer" onclick="addToCart(${p.id})">
      <div class="relative aspect-square ${p.color} rounded-2xl overflow-hidden mb-4">
        <div class="product-img absolute inset-0 flex items-center justify-center">
          <div class="w-24 h-24 ${p.accent} rounded-2xl rotate-12"></div>
        </div>
        ${p.label ? `<span class="absolute top-3 left-3 text-[10px] font-semibold bg-shop-900 text-white px-2.5 py-1 rounded-full">${p.label}</span>` : ''}
        <button class="quick-add absolute bottom-3 left-3 right-3 bg-white text-shop-900 text-xs font-semibold py-3 rounded-xl shadow-lg hover:bg-shop-50 transition-all cursor-pointer text-center">
          加入購物車
        </button>
      </div>
      <h3 class="text-sm font-medium mb-1">${p.name}</h3>
      <p class="text-sm text-gray-500">NT$${p.price.toLocaleString()}</p>
    </div>
  `).join('');
}

// ========== Filter ==========
function filterProducts(category) {
  currentFilter = category;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === category);
    if (btn.dataset.filter !== category) { btn.classList.add('text-gray-600'); } else { btn.classList.remove('text-gray-600'); }
  });
  renderProducts(category);
}

function sortProducts(sort) {
  renderProducts(currentFilter, sort);
}

// ========== Cart Logic ==========
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  updateCartUI();
  openCart();
  showToast(`已加入：${product.name}`);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartUI();
  renderCartPage();
  renderCheckout();
}

function updateQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }
  updateCartUI();
  renderCartPage();
  renderCheckout();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartUI() {
  const count = getCartCount();
  const badge = document.getElementById('cart-badge');
  if (count > 0) {
    badge.classList.remove('hidden');
    badge.textContent = count;
  } else {
    badge.classList.add('hidden');
  }

  // Drawer
  document.getElementById('drawer-count').textContent = count;
  const subtotal = getCartTotal();
  document.getElementById('drawer-subtotal').textContent = `NT$${subtotal.toLocaleString()}`;

  const drawerItems = document.getElementById('cart-items-drawer');
  const drawerEmpty = document.getElementById('cart-empty-drawer');
  const drawerFooter = document.getElementById('cart-footer-drawer');

  if (cart.length === 0) {
    drawerItems.classList.add('hidden');
    drawerEmpty.classList.remove('hidden');
    drawerFooter.classList.add('hidden');
  } else {
    drawerItems.classList.remove('hidden');
    drawerEmpty.classList.add('hidden');
    drawerFooter.classList.remove('hidden');

    drawerItems.innerHTML = cart.map(item => `
      <div class="flex gap-4 py-4 border-b border-shop-100">
        <div class="w-20 h-20 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0">
          <div class="w-10 h-10 ${item.accent} rounded-lg rotate-12"></div>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-medium mb-1 truncate">${item.name}</h4>
          <p class="text-sm text-gray-500 mb-2">NT$${item.price.toLocaleString()}</p>
          <div class="flex items-center gap-2">
            <button onclick="event.stopPropagation(); updateQty(${item.id}, -1)" class="qty-btn w-7 h-7 rounded-md border border-shop-200 flex items-center justify-center text-xs cursor-pointer">−</button>
            <span class="text-sm font-medium w-6 text-center">${item.qty}</span>
            <button onclick="event.stopPropagation(); updateQty(${item.id}, 1)" class="qty-btn w-7 h-7 rounded-md border border-shop-200 flex items-center justify-center text-xs cursor-pointer">+</button>
          </div>
        </div>
        <button onclick="event.stopPropagation(); removeFromCart(${item.id})" class="text-gray-300 hover:text-red-500 transition-colors cursor-pointer self-start mt-1">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    `).join('');
  }
}

// ========== Cart Drawer ==========
function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ========== Page Navigation ==========
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  window.scrollTo(0, 0);

  if (page === 'cart') renderCartPage();
  if (page === 'checkout') renderCheckout();
}

function renderCartPage() {
  const count = getCartCount();
  const subtotal = getCartTotal();
  const shipping = subtotal >= 2000 ? 0 : 60;

  document.getElementById('cart-page-count').textContent = `${count} 件商品`;
  document.getElementById('subtotal-page').textContent = `NT$${subtotal.toLocaleString()}`;
  document.getElementById('shipping-page').textContent = shipping === 0 ? '免運' : `NT$${shipping}`;
  document.getElementById('total-page').textContent = `NT$${(subtotal + shipping).toLocaleString()}`;

  const itemsEl = document.getElementById('cart-items-page');
  const emptyEl = document.getElementById('cart-empty-page');
  const summaryEl = document.getElementById('cart-summary-page');

  if (cart.length === 0) {
    itemsEl.classList.add('hidden');
    summaryEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
  } else {
    itemsEl.classList.remove('hidden');
    summaryEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');

    itemsEl.innerHTML = cart.map(item => `
      <div class="flex gap-5 py-6 border-b border-shop-100">
        <div class="w-24 h-24 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0">
          <div class="w-12 h-12 ${item.accent} rounded-lg rotate-12"></div>
        </div>
        <div class="flex-1">
          <div class="flex justify-between mb-1">
            <h4 class="text-sm font-medium">${item.name}</h4>
            <button onclick="removeFromCart(${item.id})" class="text-gray-300 hover:text-red-500 transition-colors cursor-pointer">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <p class="text-sm text-gray-500 mb-3">NT$${item.price.toLocaleString()}</p>
          <div class="flex items-center gap-3">
            <button onclick="updateQty(${item.id}, -1)" class="qty-btn w-8 h-8 rounded-lg border border-shop-200 flex items-center justify-center text-sm cursor-pointer">−</button>
            <span class="text-sm font-medium w-6 text-center">${item.qty}</span>
            <button onclick="updateQty(${item.id}, 1)" class="qty-btn w-8 h-8 rounded-lg border border-shop-200 flex items-center justify-center text-sm cursor-pointer">+</button>
            <span class="text-sm font-medium ml-auto">NT$${(item.price * item.qty).toLocaleString()}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
}

function renderCheckout() {
  const subtotal = getCartTotal();
  const shipping = subtotal >= 2000 ? 0 : 60;
  document.getElementById('checkout-subtotal').textContent = `NT$${subtotal.toLocaleString()}`;
  document.getElementById('checkout-shipping').textContent = shipping === 0 ? '免運' : `NT$${shipping}`;
  document.getElementById('checkout-total').textContent = `NT$${(subtotal + shipping).toLocaleString()}`;

  document.getElementById('checkout-items').innerHTML = cart.map(item => `
    <div class="flex gap-3 items-center">
      <div class="relative">
        <div class="w-14 h-14 ${item.color} rounded-lg flex items-center justify-center">
          <div class="w-7 h-7 ${item.accent} rounded rotate-12"></div>
        </div>
        <span class="absolute -top-1 -right-1 w-5 h-5 bg-shop-900 text-white text-[10px] rounded-full flex items-center justify-center">${item.qty}</span>
      </div>
      <div class="flex-1">
        <div class="text-sm font-medium">${item.name}</div>
      </div>
      <div class="text-sm font-medium">NT$${(item.price * item.qty).toLocaleString()}</div>
    </div>
  `).join('');
}

// ========== Coupon ==========
function applyCoupon() {
  const code = document.getElementById('coupon-input').value.trim().toUpperCase();
  if (code === 'FREESHIP') {
    showToast('優惠碼已套用：免運費！');
  } else if (code === 'MONO10') {
    showToast('優惠碼已套用：全館 9 折！');
  } else {
    showToast('無效的優惠碼');
  }
}

// ========== Checkout ==========
function handleCheckout() {
  if (cart.length === 0) {
    showToast('購物車是空的');
    return;
  }
  document.getElementById('success-modal').classList.remove('hidden');
}

function resetShop() {
  cart = [];
  updateCartUI();
  document.getElementById('success-modal').classList.add('hidden');
  showPage('shop');
}

// ========== Toast ==========
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-text').textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  toast.style.pointerEvents = 'auto';
  clearTimeout(window._t);
  window._t = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(16px)';
    toast.style.pointerEvents = 'none';
  }, 2500);
}

// ========== Init ==========
renderProducts();
</script>

<!-- Footer (inside shop page would break page switching, so always visible) -->
<footer class="border-t border-shop-100 mt-auto">
  <div class="max-w-7xl mx-auto px-6 py-12">
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
      <div>
        <div class="font-bold text-lg tracking-tight mb-4">MONO</div>
        <p class="text-sm text-gray-500 leading-relaxed">精選生活好物。<br>回歸本質的美學。</p>
      </div>
      <div>
        <h4 class="font-semibold text-sm mb-4">商品分類</h4>
        <ul class="space-y-2.5 text-sm text-gray-500">
          <li><button onclick="showPage('shop'); filterProducts('furniture')" class="hover:text-shop-900 transition-colors cursor-pointer">傢俱</button></li>
          <li><button onclick="showPage('shop'); filterProducts('lighting')" class="hover:text-shop-900 transition-colors cursor-pointer">燈具</button></li>
          <li><button onclick="showPage('shop'); filterProducts('decor')" class="hover:text-shop-900 transition-colors cursor-pointer">居家飾品</button></li>
          <li><button onclick="showPage('shop'); filterProducts('audio')" class="hover:text-shop-900 transition-colors cursor-pointer">音響</button></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold text-sm mb-4">客戶服務</h4>
        <ul class="space-y-2.5 text-sm text-gray-500">
          <li><button onclick="showToast('配送說明頁面即將推出')" class="hover:text-shop-900 transition-colors cursor-pointer">配送說明</button></li>
          <li><button onclick="showToast('退換貨政策頁面即將推出')" class="hover:text-shop-900 transition-colors cursor-pointer">退換貨政策</button></li>
          <li><button onclick="showToast('常見問題頁面即將推出')" class="hover:text-shop-900 transition-colors cursor-pointer">常見問題</button></li>
          <li><button onclick="showToast('聯絡客服：service@mono.tw')" class="hover:text-shop-900 transition-colors cursor-pointer">聯絡我們</button></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold text-sm mb-4">訂閱電子報</h4>
        <p class="text-sm text-gray-500 mb-3">搶先收到新品上架與獨家優惠。</p>
        <div class="flex gap-2">
          <input type="email" placeholder="your@email.com" class="form-input flex-1 text-xs" style="padding: 10px 12px;">
          <button onclick="showToast('訂閱成功！')" class="bg-shop-900 text-white text-xs font-medium px-4 rounded-lg hover:bg-shop-800 cursor-pointer">訂閱</button>
        </div>
      </div>
    </div>
    <div class="border-t border-shop-100 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
      <p class="text-xs text-gray-400">© 2026 MONO. All rights reserved.</p>
      <div class="flex gap-5">
        <button onclick="showToast('前往 Instagram')" class="text-gray-400 hover:text-shop-900 transition-colors cursor-pointer">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </button>
        <button onclick="showToast('前往 Pinterest')" class="text-gray-400 hover:text-shop-900 transition-colors cursor-pointer">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
        </button>
        <button onclick="showToast('前往 LINE')" class="text-gray-400 hover:text-shop-900 transition-colors cursor-pointer">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
        </button>
      </div>
    </div>
  </div>
</footer>

</body>
</html>$HTML$,
  2
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content,
             version = EXCLUDED.version,
             updated_at = now();
