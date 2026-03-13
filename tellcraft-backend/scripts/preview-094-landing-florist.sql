INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '35f6c3ce-6211-4255-8138-3b6aa1cd9046',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>花語 FloraStory</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { flora: { 50:'#fdf2f8',100:'#fce7f3',200:'#fbcfe8',300:'#f9a8d4',400:'#f472b6',500:'#ec4899',600:'#db2777',700:'#be185d' }, sage: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',400:'#4ade80',500:'#22c55e',600:'#16a34a' }, cream: { 50:'#fffbf0',100:'#fef3cd' } } } } }
</script>
<style>
body { font-family: 'DM Sans', sans-serif; background: #fffbfc; }
.serif { font-family: 'Cormorant Garamond', serif; }
.product-card { transition: all 0.3s; cursor: pointer; }
.product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(236,72,153,0.12); }
.team-card:hover .team-overlay { opacity: 1; }
.team-overlay { opacity: 0; transition: opacity 0.3s; }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.4s ease; }
.faq-answer.open { max-height: 400px; }
.faq-icon { transition: transform 0.3s; }
.faq-icon.open { transform: rotate(45deg); }
.filter-btn { transition: all 0.2s; }
.filter-btn.active { background: #be185d; color: white; }
.fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.float-anim { animation: float 4s ease-in-out infinite; }
.success-check { animation: scaleIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275); }
@keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
</style>
</head>
<body>

<!-- Sticky Nav -->
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-pink-50 shadow-sm shadow-pink-50/50">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-2">
      <span class="text-2xl">🌸</span>
      <span class="serif text-xl font-bold text-gray-800">花語</span>
      <span class="text-[10px] text-flora-500 font-medium tracking-wide">FloraStory</span>
    </div>
    <div class="flex items-center gap-6 text-sm text-gray-500">
      <a onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})" class="hover:text-flora-700 transition cursor-pointer">精選花禮</a>
      <a onclick="document.getElementById('meanings').scrollIntoView({behavior:'smooth'})" class="hover:text-flora-700 transition cursor-pointer">花語解讀</a>
      <a onclick="document.getElementById('subscribe').scrollIntoView({behavior:'smooth'})" class="hover:text-flora-700 transition cursor-pointer">訂閱鮮花</a>
      <a onclick="document.getElementById('faq').scrollIntoView({behavior:'smooth'})" class="hover:text-flora-700 transition cursor-pointer">常見問題</a>
      <button onclick="document.getElementById('orderModal').classList.remove('hidden')" class="bg-flora-700 hover:bg-flora-600 text-white px-6 py-2 rounded-full text-sm font-medium transition shadow-lg shadow-flora-200 cursor-pointer">立即訂花</button>
    </div>
  </div>
</nav>

<!-- Order Modal -->
<div id="orderModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
    <button onclick="document.getElementById('orderModal').classList.add('hidden');document.getElementById('orderSuccess').classList.add('hidden');document.getElementById('orderForm').classList.remove('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl cursor-pointer">&times;</button>
    <div class="text-center mb-6">
      <div class="text-4xl mb-2">💐</div>
      <h3 class="serif text-2xl font-bold text-gray-800">訂購花禮</h3>
      <p class="text-sm text-gray-400 mt-1">為特別的人送上最美的心意</p>
    </div>
    <div id="orderForm">
      <div class="text-xs text-gray-500 mb-1.5 font-medium">花禮類型</div>
      <select class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-flora-400 bg-white">
        <option>經典紅玫瑰花束</option>
        <option>粉色浪漫花籃</option>
        <option>向日葵活力花束</option>
        <option>白色純淨百合</option>
        <option>繡球夢幻花盒</option>
        <option>滿天星永生花</option>
        <option>客製化花禮</option>
      </select>
      <div class="text-xs text-gray-500 mb-1.5 font-medium">收件人姓名</div>
      <input type="text" placeholder="請輸入收件人姓名" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-flora-400">
      <div class="text-xs text-gray-500 mb-1.5 font-medium">收件人電話</div>
      <input type="tel" placeholder="09xx-xxx-xxx" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-flora-400">
      <div class="text-xs text-gray-500 mb-1.5 font-medium">配送地址</div>
      <input type="text" placeholder="台北市..." class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-flora-400">
      <div class="text-xs text-gray-500 mb-1.5 font-medium">希望配送日期</div>
      <input type="date" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-flora-400">
      <div class="text-xs text-gray-500 mb-1.5 font-medium">卡片祝福語（選填）</div>
      <textarea placeholder="寫下你想說的話..." class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-flora-400 h-24 resize-none"></textarea>
      <button onclick="document.getElementById('orderForm').classList.add('hidden');document.getElementById('orderSuccess').classList.remove('hidden')" class="w-full bg-flora-700 hover:bg-flora-600 text-white py-3 rounded-xl font-medium text-sm transition cursor-pointer">確認訂購</button>
    </div>
    <div id="orderSuccess" class="hidden text-center py-8">
      <div class="text-6xl mb-4 success-check">🌹</div>
      <p class="serif text-xl font-bold text-gray-800">訂單已送出！</p>
      <p class="text-sm text-gray-400 mt-2">我們的花藝師將在 30 分鐘內確認您的訂單</p>
      <div class="mt-4 bg-flora-50 rounded-xl p-3">
        <p class="text-xs text-flora-700">訂單確認通知將發送至您的手機</p>
      </div>
    </div>
  </div>
</div>

<!-- Hero -->
<section class="py-24 bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50/50 relative overflow-hidden">
  <div class="absolute right-0 top-0 w-96 h-96 bg-flora-200/30 rounded-full blur-[120px]"></div>
  <div class="absolute left-10 bottom-10 w-64 h-64 bg-rose-100/40 rounded-full blur-[80px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-16">
    <div class="flex-1">
      <span class="inline-block text-xs bg-flora-100 text-flora-700 px-4 py-1.5 rounded-full font-medium mb-5">🌷 台北市 2 小時極速送達</span>
      <h1 class="serif text-6xl font-bold text-gray-800 leading-tight mb-5">用花，說出<br>心中的話</h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-lg text-lg">每束花都由資深花藝師親手設計，嚴選當季鮮花，從產地直送。讓最新鮮的花朵，傳遞你最真摯的情感。</p>
      <div class="flex gap-4">
        <button onclick="document.getElementById('orderModal').classList.remove('hidden')" class="bg-flora-700 hover:bg-flora-600 text-white px-8 py-3.5 rounded-full font-medium transition shadow-lg shadow-flora-200 cursor-pointer">立即訂花</button>
        <button onclick="document.getElementById('subscribe').scrollIntoView({behavior:'smooth'})" class="border border-flora-300 text-flora-700 hover:bg-flora-50 px-8 py-3.5 rounded-full font-medium transition cursor-pointer">每週訂閱</button>
      </div>
    </div>
    <div class="relative">
      <div class="w-80 h-96 rounded-3xl bg-gradient-to-b from-flora-200 to-rose-300 flex items-center justify-center text-9xl shadow-2xl shadow-flora-100 float-anim">💐</div>
      <div class="absolute -bottom-5 -left-8 w-20 h-20 rounded-full bg-sage-100 flex items-center justify-center text-3xl shadow-lg border-4 border-white">🌿</div>
      <div class="absolute top-6 -right-6 w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-2xl shadow-lg border-4 border-white">🌹</div>
      <div class="absolute bottom-20 -right-4 w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-xl shadow-md border-4 border-white">🌻</div>
    </div>
  </div>
</section>

<!-- Stats Bar -->
<section class="bg-flora-700 text-white py-10">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-4 gap-8 text-center">
      <div>
        <div class="serif text-4xl font-bold">8</div>
        <div class="text-sm text-white/70 mt-1">年專業經驗</div>
      </div>
      <div>
        <div class="serif text-4xl font-bold">10,000+</div>
        <div class="text-sm text-white/70 mt-1">花束配送</div>
      </div>
      <div>
        <div class="serif text-4xl font-bold">50+</div>
        <div class="text-sm text-white/70 mt-1">企業合作客戶</div>
      </div>
      <div>
        <div class="serif text-4xl font-bold">當日</div>
        <div class="text-sm text-white/70 mt-1">台北市配送</div>
      </div>
    </div>
  </div>
</section>

<!-- Products with Category Filter -->
<section id="products" class="max-w-6xl mx-auto px-6 py-20">
  <div class="text-center mb-10">
    <span class="text-xs text-flora-500 font-medium tracking-widest uppercase">Our Collection</span>
    <h2 class="serif text-4xl font-bold text-gray-800 mt-2 mb-3">精選花禮</h2>
    <p class="text-gray-400">嚴選當季鮮花，每一束都是獨一無二的作品</p>
  </div>

  <!-- Category Filter -->
  <div class="flex justify-center gap-3 mb-10">
    <button onclick="filterProducts('all')" class="filter-btn active px-5 py-2 rounded-full text-sm font-medium border border-flora-200 cursor-pointer" data-cat="all">全部</button>
    <button onclick="filterProducts('bouquet')" class="filter-btn px-5 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-500 hover:border-flora-300 cursor-pointer" data-cat="bouquet">花束</button>
    <button onclick="filterProducts('basket')" class="filter-btn px-5 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-500 hover:border-flora-300 cursor-pointer" data-cat="basket">花籃</button>
    <button onclick="filterProducts('art')" class="filter-btn px-5 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-500 hover:border-flora-300 cursor-pointer" data-cat="art">花藝</button>
    <button onclick="filterProducts('sub')" class="filter-btn px-5 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-500 hover:border-flora-300 cursor-pointer" data-cat="sub">訂閱</button>
  </div>

  <!-- Product Grid -->
  <div id="productGrid" class="grid grid-cols-4 gap-6">
    <div class="product-card bg-white rounded-2xl overflow-hidden border border-pink-50" data-category="bouquet">
      <div class="h-56 bg-gradient-to-b from-rose-100 to-rose-200 flex items-center justify-center text-7xl relative">
        <span>🌹</span>
        <span class="absolute top-3 right-3 text-[10px] bg-flora-700 text-white px-2.5 py-0.5 rounded-full font-bold">熱賣</span>
      </div>
      <div class="p-5">
        <span class="text-[10px] text-flora-400 font-medium">花束</span>
        <h3 class="font-bold text-gray-800 mt-0.5">經典紅玫瑰</h3>
        <p class="text-xs text-gray-400 mt-1">20 朵厄瓜多爾紅玫瑰 · 尤加利葉</p>
        <div class="flex items-center justify-between mt-4">
          <span class="text-flora-700 font-bold text-lg">NT$ 1,680</span>
          <button onclick="document.getElementById('orderModal').classList.remove('hidden')" class="text-xs bg-flora-50 text-flora-700 px-4 py-1.5 rounded-full font-medium hover:bg-flora-100 transition cursor-pointer">訂購</button>
        </div>
      </div>
    </div>

    <div class="product-card bg-white rounded-2xl overflow-hidden border border-pink-50" data-category="bouquet">
      <div class="h-56 bg-gradient-to-b from-purple-100 to-violet-200 flex items-center justify-center text-7xl">
        <span>💜</span>
      </div>
      <div class="p-5">
        <span class="text-[10px] text-flora-400 font-medium">花束</span>
        <h3 class="font-bold text-gray-800 mt-0.5">紫色夢境</h3>
        <p class="text-xs text-gray-400 mt-1">桔梗 · 繡球花 · 薰衣草</p>
        <div class="flex items-center justify-between mt-4">
          <span class="text-flora-700 font-bold text-lg">NT$ 2,280</span>
          <button onclick="document.getElementById('orderModal').classList.remove('hidden')" class="text-xs bg-flora-50 text-flora-700 px-4 py-1.5 rounded-full font-medium hover:bg-flora-100 transition cursor-pointer">訂購</button>
        </div>
      </div>
    </div>

    <div class="product-card bg-white rounded-2xl overflow-hidden border border-pink-50" data-category="bouquet">
      <div class="h-56 bg-gradient-to-b from-amber-100 to-yellow-200 flex items-center justify-center text-7xl">
        <span>🌻</span>
      </div>
      <div class="p-5">
        <span class="text-[10px] text-flora-400 font-medium">花束</span>
        <h3 class="font-bold text-gray-800 mt-0.5">向日葵活力</h3>
        <p class="text-xs text-gray-400 mt-1">向日葵 · 雛菊 · 小米果</p>
        <div class="flex items-center justify-between mt-4">
          <span class="text-flora-700 font-bold text-lg">NT$ 1,480</span>
          <button onclick="document.getElementById('orderModal').classList.remove('hidden')" class="text-xs bg-flora-50 text-flora-700 px-4 py-1.5 rounded-full font-medium hover:bg-flora-100 transition cursor-pointer">訂購</button>
        </div>
      </div>
    </div>

    <div class="product-card bg-white rounded-2xl overflow-hidden border border-pink-50" data-category="basket">
      <div class="h-56 bg-gradient-to-b from-pink-100 to-pink-200 flex items-center justify-center text-7xl relative">
        <span>🌸</span>
        <span class="absolute top-3 right-3 text-[10px] bg-sage-500 text-white px-2.5 py-0.5 rounded-full font-bold">季節</span>
      </div>
      <div class="p-5">
        <span class="text-[10px] text-sage-500 font-medium">花籃</span>
        <h3 class="font-bold text-gray-800 mt-0.5">春日櫻花籃</h3>
        <p class="text-xs text-gray-400 mt-1">吉野櫻 · 芍藥 · 滿天星</p>
        <div class="flex items-center justify-between mt-4">
          <span class="text-flora-700 font-bold text-lg">NT$ 2,880</span>
          <button onclick="document.getElementById('orderModal').classList.remove('hidden')" class="text-xs bg-flora-50 text-flora-700 px-4 py-1.5 rounded-full font-medium hover:bg-flora-100 transition cursor-pointer">訂購</button>
        </div>
      </div>
    </div>

    <div class="product-card bg-white rounded-2xl overflow-hidden border border-pink-50" data-category="basket">
      <div class="h-56 bg-gradient-to-b from-rose-100 to-red-200 flex items-center justify-center text-7xl">
        <span>🧺</span>
      </div>
      <div class="p-5">
        <span class="text-[10px] text-sage-500 font-medium">花籃</span>
        <h3 class="font-bold text-gray-800 mt-0.5">祝賀花籃</h3>
        <p class="text-xs text-gray-400 mt-1">百合 · 康乃馨 · 火鶴</p>
        <div class="flex items-center justify-between mt-4">
          <span class="text-flora-700 font-bold text-lg">NT$ 3,680</span>
          <button onclick="document.getElementById('orderModal').classList.remove('hidden')" class="text-xs bg-flora-50 text-flora-700 px-4 py-1.5 rounded-full font-medium hover:bg-flora-100 transition cursor-pointer">訂購</button>
        </div>
      </div>
    </div>

    <div class="product-card bg-white rounded-2xl overflow-hidden border border-pink-50" data-category="art">
      <div class="h-56 bg-gradient-to-b from-green-50 to-emerald-100 flex items-center justify-center text-7xl">
        <span>🪴</span>
      </div>
      <div class="p-5">
        <span class="text-[10px] text-emerald-500 font-medium">花藝</span>
        <h3 class="font-bold text-gray-800 mt-0.5">永生花盒</h3>
        <p class="text-xs text-gray-400 mt-1">玫瑰永生花 · 木質禮盒</p>
        <div class="flex items-center justify-between mt-4">
          <span class="text-flora-700 font-bold text-lg">NT$ 1,980</span>
          <button onclick="document.getElementById('orderModal').classList.remove('hidden')" class="text-xs bg-flora-50 text-flora-700 px-4 py-1.5 rounded-full font-medium hover:bg-flora-100 transition cursor-pointer">訂購</button>
        </div>
      </div>
    </div>

    <div class="product-card bg-white rounded-2xl overflow-hidden border border-pink-50" data-category="art">
      <div class="h-56 bg-gradient-to-b from-teal-50 to-cyan-100 flex items-center justify-center text-7xl">
        <span>🌿</span>
      </div>
      <div class="p-5">
        <span class="text-[10px] text-emerald-500 font-medium">花藝</span>
        <h3 class="font-bold text-gray-800 mt-0.5">桌上花藝</h3>
        <p class="text-xs text-gray-400 mt-1">多肉組合 · 苔蘚花器</p>
        <div class="flex items-center justify-between mt-4">
          <span class="text-flora-700 font-bold text-lg">NT$ 1,280</span>
          <button onclick="document.getElementById('orderModal').classList.remove('hidden')" class="text-xs bg-flora-50 text-flora-700 px-4 py-1.5 rounded-full font-medium hover:bg-flora-100 transition cursor-pointer">訂購</button>
        </div>
      </div>
    </div>

    <div class="product-card bg-white rounded-2xl overflow-hidden border border-pink-50" data-category="sub">
      <div class="h-56 bg-gradient-to-b from-orange-50 to-amber-100 flex items-center justify-center text-7xl">
        <span>📦</span>
      </div>
      <div class="p-5">
        <span class="text-[10px] text-amber-500 font-medium">訂閱</span>
        <h3 class="font-bold text-gray-800 mt-0.5">每週驚喜花束</h3>
        <p class="text-xs text-gray-400 mt-1">花藝師每週精選搭配</p>
        <div class="flex items-center justify-between mt-4">
          <span class="text-flora-700 font-bold text-lg">NT$ 699<span class="text-xs text-gray-400 font-normal">/週</span></span>
          <button onclick="document.getElementById('subscribe').scrollIntoView({behavior:'smooth'})" class="text-xs bg-flora-50 text-flora-700 px-4 py-1.5 rounded-full font-medium hover:bg-flora-100 transition cursor-pointer">了解</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Flower Meanings -->
<section id="meanings" class="bg-gradient-to-b from-white to-flora-50/50 py-20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs text-flora-500 font-medium tracking-widest uppercase">Language of Flowers</span>
      <h2 class="serif text-4xl font-bold text-gray-800 mt-2 mb-3">花語解讀</h2>
      <p class="text-gray-400">每一朵花都有它獨特的語言，讓我們為你翻譯</p>
    </div>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-white rounded-2xl p-6 border border-pink-50 hover:shadow-lg hover:shadow-flora-100/50 transition group cursor-pointer">
        <div class="text-5xl mb-4 group-hover:scale-110 transition">🌹</div>
        <h3 class="serif text-xl font-bold text-gray-800">玫瑰</h3>
        <p class="text-flora-500 text-sm font-medium mt-1">熱情的愛</p>
        <p class="text-gray-400 text-sm mt-3 leading-relaxed">紅玫瑰代表熱烈的愛情，粉玫瑰象徵初戀的甜蜜。送一束玫瑰，是最經典的告白方式。</p>
        <div class="mt-4 flex gap-2">
          <span class="text-[10px] bg-red-50 text-red-400 px-2 py-0.5 rounded-full">愛情</span>
          <span class="text-[10px] bg-pink-50 text-pink-400 px-2 py-0.5 rounded-full">告白</span>
          <span class="text-[10px] bg-rose-50 text-rose-400 px-2 py-0.5 rounded-full">浪漫</span>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-6 border border-pink-50 hover:shadow-lg hover:shadow-flora-100/50 transition group cursor-pointer">
        <div class="text-5xl mb-4 group-hover:scale-110 transition">🤍</div>
        <h3 class="serif text-xl font-bold text-gray-800">百合</h3>
        <p class="text-flora-500 text-sm font-medium mt-1">純潔與祝福</p>
        <p class="text-gray-400 text-sm mt-3 leading-relaxed">百合花代表純潔無瑕的愛，也象徵著百年好合的美好祝願。婚禮與祝賀的首選花材。</p>
        <div class="mt-4 flex gap-2">
          <span class="text-[10px] bg-violet-50 text-violet-400 px-2 py-0.5 rounded-full">祝福</span>
          <span class="text-[10px] bg-blue-50 text-blue-400 px-2 py-0.5 rounded-full">婚禮</span>
          <span class="text-[10px] bg-indigo-50 text-indigo-400 px-2 py-0.5 rounded-full">純潔</span>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-6 border border-pink-50 hover:shadow-lg hover:shadow-flora-100/50 transition group cursor-pointer">
        <div class="text-5xl mb-4 group-hover:scale-110 transition">🌻</div>
        <h3 class="serif text-xl font-bold text-gray-800">向日葵</h3>
        <p class="text-flora-500 text-sm font-medium mt-1">陽光與希望</p>
        <p class="text-gray-400 text-sm mt-3 leading-relaxed">向日葵總是朝向陽光，象徵樂觀與活力。送向日葵給朋友，傳遞正面能量與溫暖。</p>
        <div class="mt-4 flex gap-2">
          <span class="text-[10px] bg-amber-50 text-amber-400 px-2 py-0.5 rounded-full">活力</span>
          <span class="text-[10px] bg-yellow-50 text-yellow-500 px-2 py-0.5 rounded-full">友誼</span>
          <span class="text-[10px] bg-orange-50 text-orange-400 px-2 py-0.5 rounded-full">樂觀</span>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-6 border border-pink-50 hover:shadow-lg hover:shadow-flora-100/50 transition group cursor-pointer">
        <div class="text-5xl mb-4 group-hover:scale-110 transition">💙</div>
        <h3 class="serif text-xl font-bold text-gray-800">繡球花</h3>
        <p class="text-flora-500 text-sm font-medium mt-1">團聚與感恩</p>
        <p class="text-gray-400 text-sm mt-3 leading-relaxed">繡球花瓣簇擁成團，象徵團圓和美。淡藍色繡球帶來寧靜感，是母親節的熱門花材。</p>
        <div class="mt-4 flex gap-2">
          <span class="text-[10px] bg-sky-50 text-sky-400 px-2 py-0.5 rounded-full">感恩</span>
          <span class="text-[10px] bg-cyan-50 text-cyan-400 px-2 py-0.5 rounded-full">團圓</span>
          <span class="text-[10px] bg-teal-50 text-teal-400 px-2 py-0.5 rounded-full">寧靜</span>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-6 border border-pink-50 hover:shadow-lg hover:shadow-flora-100/50 transition group cursor-pointer">
        <div class="text-5xl mb-4 group-hover:scale-110 transition">🌷</div>
        <h3 class="serif text-xl font-bold text-gray-800">鬱金香</h3>
        <p class="text-flora-500 text-sm font-medium mt-1">優雅與永恆</p>
        <p class="text-gray-400 text-sm mt-3 leading-relaxed">鬱金香代表優雅的愛慕與永恆之美。不同顏色有不同含義，紫色代表高貴，粉色代表幸福。</p>
        <div class="mt-4 flex gap-2">
          <span class="text-[10px] bg-purple-50 text-purple-400 px-2 py-0.5 rounded-full">優雅</span>
          <span class="text-[10px] bg-fuchsia-50 text-fuchsia-400 px-2 py-0.5 rounded-full">高貴</span>
          <span class="text-[10px] bg-pink-50 text-pink-400 px-2 py-0.5 rounded-full">永恆</span>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-6 border border-pink-50 hover:shadow-lg hover:shadow-flora-100/50 transition group cursor-pointer">
        <div class="text-5xl mb-4 group-hover:scale-110 transition">✨</div>
        <h3 class="serif text-xl font-bold text-gray-800">滿天星</h3>
        <p class="text-flora-500 text-sm font-medium mt-1">思念與陪伴</p>
        <p class="text-gray-400 text-sm mt-3 leading-relaxed">滿天星如漫天繁星，象徵默默的守護與陪伴。作為配花或主花，都散發著清新浪漫氣息。</p>
        <div class="mt-4 flex gap-2">
          <span class="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full">思念</span>
          <span class="text-[10px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full">守護</span>
          <span class="text-[10px] bg-zinc-50 text-zinc-400 px-2 py-0.5 rounded-full">清新</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Subscription Plans -->
<section id="subscribe" class="bg-flora-700 text-white py-20 relative overflow-hidden">
  <div class="absolute left-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-[80px]"></div>
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs text-white/60 font-medium tracking-widest uppercase">Flower Subscription</span>
      <h2 class="serif text-4xl font-bold mt-2 mb-3">訂閱鮮花</h2>
      <p class="text-white/60">讓生活中永遠有花的陪伴，每週為你精選不同花材</p>
    </div>
    <div class="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
      <div class="bg-white/10 rounded-2xl p-8 border border-white/10 cursor-pointer hover:bg-white/15 hover:border-white/20 transition text-center">
        <div class="text-3xl mb-3">🌱</div>
        <h3 class="font-bold text-lg">小品束</h3>
        <div class="serif text-4xl font-bold my-4">$399<span class="text-sm font-normal text-white/50">/週</span></div>
        <div class="space-y-2 text-sm text-white/70 mb-6">
          <p>3-5 支當季鮮花</p>
          <p>基礎花藝包裝</p>
          <p>每週配送一次</p>
          <p>可暫停或取消</p>
        </div>
        <button class="w-full bg-white/20 hover:bg-white/30 py-2.5 rounded-full text-sm font-medium transition cursor-pointer">開始訂閱</button>
      </div>
      <div class="bg-white/15 rounded-2xl p-8 border border-white/30 relative cursor-pointer text-center transform scale-105">
        <span class="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-amber-400 text-amber-900 px-4 py-1 rounded-full font-bold">最受歡迎</span>
        <div class="text-3xl mb-3">💐</div>
        <h3 class="font-bold text-lg">經典束</h3>
        <div class="serif text-4xl font-bold my-4">$699<span class="text-sm font-normal text-white/50">/週</span></div>
        <div class="space-y-2 text-sm text-white/70 mb-6">
          <p>7-10 支混搭花束</p>
          <p>精緻韓式包裝</p>
          <p>附花語小卡</p>
          <p>免費配送到府</p>
        </div>
        <button class="w-full bg-white text-flora-700 hover:bg-white/90 py-2.5 rounded-full text-sm font-bold transition cursor-pointer">開始訂閱</button>
      </div>
      <div class="bg-white/10 rounded-2xl p-8 border border-white/10 cursor-pointer hover:bg-white/15 hover:border-white/20 transition text-center">
        <div class="text-3xl mb-3">👑</div>
        <h3 class="font-bold text-lg">奢華束</h3>
        <div class="serif text-4xl font-bold my-4">$1,299<span class="text-sm font-normal text-white/50">/週</span></div>
        <div class="space-y-2 text-sm text-white/70 mb-6">
          <p>15+ 支設計師搭配</p>
          <p>頂級進口花材</p>
          <p>含花瓶或花器</p>
          <p>專屬花藝師服務</p>
        </div>
        <button class="w-full bg-white/20 hover:bg-white/30 py-2.5 rounded-full text-sm font-medium transition cursor-pointer">開始訂閱</button>
      </div>
    </div>
  </div>
</section>

<!-- Corporate Services -->
<section class="max-w-6xl mx-auto px-6 py-20">
  <div class="text-center mb-12">
    <span class="text-xs text-flora-500 font-medium tracking-widest uppercase">Corporate Services</span>
    <h2 class="serif text-4xl font-bold text-gray-800 mt-2 mb-3">企業服務</h2>
    <p class="text-gray-400">專業花藝團隊，為您的重要時刻增添色彩</p>
  </div>
  <div class="grid grid-cols-3 gap-8">
    <div class="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-8 border border-pink-100 hover:shadow-lg transition cursor-pointer group">
      <div class="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm mb-5 group-hover:scale-110 transition">💒</div>
      <h3 class="serif text-xl font-bold text-gray-800">婚禮花藝</h3>
      <p class="text-gray-400 text-sm mt-3 leading-relaxed">從新娘捧花、胸花到會場佈置，一站式婚禮花藝服務。我們的設計師會依據您的婚禮主題，打造獨一無二的花藝方案。</p>
      <ul class="mt-4 space-y-1.5 text-sm text-gray-500">
        <li class="flex items-center gap-2"><span class="text-flora-400">&#10003;</span> 新娘捧花設計</li>
        <li class="flex items-center gap-2"><span class="text-flora-400">&#10003;</span> 宴會桌花佈置</li>
        <li class="flex items-center gap-2"><span class="text-flora-400">&#10003;</span> 拍照花牆搭建</li>
      </ul>
    </div>
    <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100 hover:shadow-lg transition cursor-pointer group">
      <div class="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm mb-5 group-hover:scale-110 transition">🎊</div>
      <h3 class="serif text-xl font-bold text-gray-800">開幕花禮</h3>
      <p class="text-gray-400 text-sm mt-3 leading-relaxed">開幕、喬遷、週年慶等重要里程碑，用氣派的花籃與花藝裝置，為客戶留下深刻印象。</p>
      <ul class="mt-4 space-y-1.5 text-sm text-gray-500">
        <li class="flex items-center gap-2"><span class="text-amber-400">&#10003;</span> 高架花籃</li>
        <li class="flex items-center gap-2"><span class="text-amber-400">&#10003;</span> 企業客製花禮</li>
        <li class="flex items-center gap-2"><span class="text-amber-400">&#10003;</span> 大量訂購優惠</li>
      </ul>
    </div>
    <div class="bg-gradient-to-br from-sage-50 to-emerald-50 rounded-2xl p-8 border border-green-100 hover:shadow-lg transition cursor-pointer group">
      <div class="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm mb-5 group-hover:scale-110 transition">🏢</div>
      <h3 class="serif text-xl font-bold text-gray-800">空間佈置</h3>
      <p class="text-gray-400 text-sm mt-3 leading-relaxed">辦公室、餐廳、飯店大廳定期花藝佈置。依據空間風格與季節，打造充滿生命力的綠意空間。</p>
      <ul class="mt-4 space-y-1.5 text-sm text-gray-500">
        <li class="flex items-center gap-2"><span class="text-sage-500">&#10003;</span> 每週定期更換</li>
        <li class="flex items-center gap-2"><span class="text-sage-500">&#10003;</span> 專屬設計師諮詢</li>
        <li class="flex items-center gap-2"><span class="text-sage-500">&#10003;</span> 企業月結方案</li>
      </ul>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="bg-flora-50/50 py-20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs text-flora-500 font-medium tracking-widest uppercase">Testimonials</span>
      <h2 class="serif text-4xl font-bold text-gray-800 mt-2 mb-3">客戶好評</h2>
      <p class="text-gray-400">每一則好評都是我們持續進步的動力</p>
    </div>
    <div class="grid grid-cols-3 gap-8">
      <div class="bg-white rounded-2xl p-7 border border-pink-50 shadow-sm">
        <div class="flex items-center gap-1 mb-4">
          <span class="text-amber-400">&#9733;</span><span class="text-amber-400">&#9733;</span><span class="text-amber-400">&#9733;</span><span class="text-amber-400">&#9733;</span><span class="text-amber-400">&#9733;</span>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed mb-5">「訂了經典紅玫瑰送給太太，她收到的時候真的感動到哭了。花束比照片還漂亮，包裝也超精緻！以後固定在這裡訂花了。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm">👨</div>
          <div>
            <div class="font-bold text-gray-800 text-sm">陳先生</div>
            <div class="text-xs text-gray-400">結婚紀念日</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-7 border border-pink-50 shadow-sm">
        <div class="flex items-center gap-1 mb-4">
          <span class="text-amber-400">&#9733;</span><span class="text-amber-400">&#9733;</span><span class="text-amber-400">&#9733;</span><span class="text-amber-400">&#9733;</span><span class="text-amber-400">&#9733;</span>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed mb-5">「訂閱每週鮮花已經三個月了，每次收到都有驚喜感。花藝師的配色品味很好，家裡每個角落都變得更有生氣了。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-sm">👩</div>
          <div>
            <div class="font-bold text-gray-800 text-sm">林小姐</div>
            <div class="text-xs text-gray-400">每週訂閱客戶</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-7 border border-pink-50 shadow-sm">
        <div class="flex items-center gap-1 mb-4">
          <span class="text-amber-400">&#9733;</span><span class="text-amber-400">&#9733;</span><span class="text-amber-400">&#9733;</span><span class="text-amber-400">&#9733;</span><span class="text-amber-400">&#9733;</span>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed mb-5">「公司年會請花語團隊做會場佈置，效果超出預期。從規劃到執行都很專業，同事們一進場就 wow 了一聲。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-sm">👩</div>
          <div>
            <div class="font-bold text-gray-800 text-sm">王經理</div>
            <div class="text-xs text-gray-400">企業空間佈置</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Florist Team -->
<section class="max-w-6xl mx-auto px-6 py-20">
  <div class="text-center mb-12">
    <span class="text-xs text-flora-500 font-medium tracking-widest uppercase">Our Florists</span>
    <h2 class="serif text-4xl font-bold text-gray-800 mt-2 mb-3">花藝團隊</h2>
    <p class="text-gray-400">每位花藝師都擁有豐富經驗與獨特美學觀點</p>
  </div>
  <div class="grid grid-cols-3 gap-8">
    <div class="text-center group cursor-pointer">
      <div class="relative w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-flora-200 to-rose-200 flex items-center justify-center text-7xl mb-5 overflow-hidden">
        <span>👩‍🎨</span>
        <div class="team-overlay absolute inset-0 bg-flora-700/80 rounded-full flex items-center justify-center">
          <p class="text-white text-xs px-4 text-center">「花是大自然的詩，我只是翻譯它的語言。」</p>
        </div>
      </div>
      <h3 class="font-bold text-gray-800 text-lg">Emily 陳</h3>
      <p class="text-flora-500 text-sm font-medium">首席花藝師</p>
      <p class="text-gray-400 text-xs mt-2">日本池坊花道認證 · 10 年資歷</p>
    </div>
    <div class="text-center group cursor-pointer">
      <div class="relative w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-amber-100 to-yellow-200 flex items-center justify-center text-7xl mb-5 overflow-hidden">
        <span>👨‍🎨</span>
        <div class="team-overlay absolute inset-0 bg-flora-700/80 rounded-full flex items-center justify-center">
          <p class="text-white text-xs px-4 text-center">「每束花都有靈魂，我的工作是讓它綻放。」</p>
        </div>
      </div>
      <h3 class="font-bold text-gray-800 text-lg">James 林</h3>
      <p class="text-flora-500 text-sm font-medium">資深花藝師</p>
      <p class="text-gray-400 text-xs mt-2">韓式花藝專精 · 8 年資歷</p>
    </div>
    <div class="text-center group cursor-pointer">
      <div class="relative w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-sage-100 to-emerald-200 flex items-center justify-center text-7xl mb-5 overflow-hidden">
        <span>👩‍🌾</span>
        <div class="team-overlay absolute inset-0 bg-flora-700/80 rounded-full flex items-center justify-center">
          <p class="text-white text-xs px-4 text-center">「用色彩與花材的搭配，為每個空間注入生命力。」</p>
        </div>
      </div>
      <h3 class="font-bold text-gray-800 text-lg">Sophie 張</h3>
      <p class="text-flora-500 text-sm font-medium">空間花藝設計師</p>
      <p class="text-gray-400 text-xs mt-2">室內設計背景 · 6 年資歷</p>
    </div>
  </div>
</section>

<!-- Delivery Info -->
<section class="bg-gradient-to-r from-flora-50 to-rose-50 py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-10">
      <span class="text-xs text-flora-500 font-medium tracking-widest uppercase">Delivery</span>
      <h2 class="serif text-4xl font-bold text-gray-800 mt-2 mb-3">配送資訊</h2>
    </div>
    <div class="grid grid-cols-4 gap-6">
      <div class="bg-white rounded-2xl p-6 text-center border border-pink-50 shadow-sm">
        <div class="text-3xl mb-3">🚚</div>
        <h3 class="font-bold text-gray-800 text-sm">台北市區</h3>
        <p class="text-xs text-gray-400 mt-2">2 小時極速送達</p>
        <p class="text-flora-700 text-sm font-bold mt-2">免運費</p>
      </div>
      <div class="bg-white rounded-2xl p-6 text-center border border-pink-50 shadow-sm">
        <div class="text-3xl mb-3">📦</div>
        <h3 class="font-bold text-gray-800 text-sm">新北市</h3>
        <p class="text-xs text-gray-400 mt-2">當日下午配送</p>
        <p class="text-flora-700 text-sm font-bold mt-2">NT$ 100</p>
      </div>
      <div class="bg-white rounded-2xl p-6 text-center border border-pink-50 shadow-sm">
        <div class="text-3xl mb-3">🌏</div>
        <h3 class="font-bold text-gray-800 text-sm">全台宅配</h3>
        <p class="text-xs text-gray-400 mt-2">隔日到貨（保鮮包裝）</p>
        <p class="text-flora-700 text-sm font-bold mt-2">NT$ 200</p>
      </div>
      <div class="bg-white rounded-2xl p-6 text-center border border-pink-50 shadow-sm">
        <div class="text-3xl mb-3">⏰</div>
        <h3 class="font-bold text-gray-800 text-sm">預約配送</h3>
        <p class="text-xs text-gray-400 mt-2">指定日期與時段</p>
        <p class="text-flora-700 text-sm font-bold mt-2">免費預約</p>
      </div>
    </div>
    <p class="text-center text-xs text-gray-400 mt-6">* 每日 10:00 前下單，台北市當日送達。特殊節日（情人節、母親節）請提前 3 天預訂。</p>
  </div>
</section>

<!-- FAQ Accordion -->
<section id="faq" class="max-w-3xl mx-auto px-6 py-20">
  <div class="text-center mb-12">
    <span class="text-xs text-flora-500 font-medium tracking-widest uppercase">FAQ</span>
    <h2 class="serif text-4xl font-bold text-gray-800 mt-2 mb-3">常見問題</h2>
  </div>
  <div class="space-y-4">
    <div class="bg-white rounded-xl border border-pink-50 overflow-hidden shadow-sm">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer">
        <span class="font-medium text-gray-800">鮮花可以維持多久？如何延長花期？</span>
        <span class="faq-icon text-flora-400 text-xl font-light select-none">+</span>
      </button>
      <div class="faq-answer">
        <div class="px-6 pb-4 text-sm text-gray-500 leading-relaxed">一般鮮花在良好照護下可維持 5-7 天。建議每天換水、斜切花莖 1-2 公分，避免陽光直射與靠近水果。我們隨花附贈保鮮劑，加入水中可延長花期約 2-3 天。冷氣房中花朵保存更佳，但需注意不要讓出風口直吹花束。</div>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-pink-50 overflow-hidden shadow-sm">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer">
        <span class="font-medium text-gray-800">可以客製化花束嗎？需要多久前預訂？</span>
        <span class="faq-icon text-flora-400 text-xl font-light select-none">+</span>
      </button>
      <div class="faq-answer">
        <div class="px-6 pb-4 text-sm text-gray-500 leading-relaxed">當然可以！我們提供完全客製化服務。您可以指定花材、顏色、預算等需求，花藝師會為您量身設計。一般客製花束建議提前 2 個工作天預訂，大型活動佈置請提前 1-2 週。您也可以 LINE 傳送參考圖片給我們，我們會盡力為您重現。</div>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-pink-50 overflow-hidden shadow-sm">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer">
        <span class="font-medium text-gray-800">訂閱花束可以暫停或取消嗎？</span>
        <span class="faq-icon text-flora-400 text-xl font-light select-none">+</span>
      </button>
      <div class="faq-answer">
        <div class="px-6 pb-4 text-sm text-gray-500 leading-relaxed">可以！我們的訂閱方案完全彈性。您可以隨時在個人帳戶中暫停或取消訂閱，暫停期間不會收費。若本週不方便收花，也可以在週三前通知我們跳過該週配送。出國旅遊或公務繁忙時都可以靈活調整。</div>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-pink-50 overflow-hidden shadow-sm">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer">
        <span class="font-medium text-gray-800">付款方式有哪些？可以開統編嗎？</span>
        <span class="faq-icon text-flora-400 text-xl font-light select-none">+</span>
      </button>
      <div class="faq-answer">
        <div class="px-6 pb-4 text-sm text-gray-500 leading-relaxed">我們支援信用卡（Visa/Mastercard/JCB）、Line Pay、銀行轉帳等付款方式。企業客戶可開立統一發票與電子收據，也支援月結帳款。如有特殊需求，歡迎聯繫我們的企業服務專線。</div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="bg-gradient-to-br from-flora-700 via-rose-700 to-pink-700 text-white py-20 relative overflow-hidden">
  <div class="absolute inset-0 opacity-10">
    <div class="absolute top-10 left-20 text-8xl">🌸</div>
    <div class="absolute bottom-10 right-20 text-8xl">🌹</div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl">💐</div>
  </div>
  <div class="max-w-3xl mx-auto px-6 text-center relative z-10">
    <h2 class="serif text-5xl font-bold mb-4">讓花語替你說話</h2>
    <p class="text-white/70 text-lg mb-8 max-w-lg mx-auto">無論是告白、感謝、祝賀還是思念，我們用最美的花朵為你傳遞心意</p>
    <div class="flex justify-center gap-4">
      <button onclick="document.getElementById('orderModal').classList.remove('hidden')" class="bg-white text-flora-700 hover:bg-white/90 px-10 py-4 rounded-full font-bold text-lg transition shadow-xl cursor-pointer">立即訂花</button>
      <button onclick="document.getElementById('subscribe').scrollIntoView({behavior:'smooth'})" class="border-2 border-white/40 text-white hover:bg-white/10 px-10 py-4 rounded-full font-medium text-lg transition cursor-pointer">了解訂閱</button>
    </div>
    <p class="text-white/50 text-xs mt-6">台北市 2 小時送達 · 滿 $1,500 免運 · 不滿意免費重送</p>
  </div>
</section>

<!-- Footer -->
<footer class="bg-gray-900 text-gray-400 py-14">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-4 gap-10 mb-10">
      <div>
        <div class="flex items-center gap-2 mb-4"><span class="text-2xl">🌸</span><span class="serif text-xl text-white font-bold">花語</span></div>
        <p class="text-sm leading-relaxed">用最新鮮的花朵，傳遞最真摯的情感。每束花都是一封寫給你的情書。</p>
      </div>
      <div>
        <h4 class="text-white font-medium mb-4 text-sm">服務項目</h4>
        <ul class="space-y-2 text-sm">
          <li><a class="hover:text-flora-300 transition cursor-pointer">鮮花花束</a></li>
          <li><a class="hover:text-flora-300 transition cursor-pointer">花籃花禮</a></li>
          <li><a class="hover:text-flora-300 transition cursor-pointer">永生花藝</a></li>
          <li><a class="hover:text-flora-300 transition cursor-pointer">每週訂閱</a></li>
          <li><a class="hover:text-flora-300 transition cursor-pointer">企業服務</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-medium mb-4 text-sm">顧客服務</h4>
        <ul class="space-y-2 text-sm">
          <li><a class="hover:text-flora-300 transition cursor-pointer">配送說明</a></li>
          <li><a class="hover:text-flora-300 transition cursor-pointer">退換貨政策</a></li>
          <li><a class="hover:text-flora-300 transition cursor-pointer">常見問題</a></li>
          <li><a class="hover:text-flora-300 transition cursor-pointer">聯絡我們</a></li>
          <li><a class="hover:text-flora-300 transition cursor-pointer">隱私權政策</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-medium mb-4 text-sm">聯繫我們</h4>
        <ul class="space-y-2 text-sm">
          <li>台北市大安區仁愛路四段 112 巷 5 號</li>
          <li>02-2771-8899</li>
          <li>hello@florastory.tw</li>
          <li class="pt-2">
            <span class="text-xs">營業時間</span><br>
            <span class="text-white text-xs">週一至週六 09:00-20:00</span>
          </li>
        </ul>
      </div>
    </div>
    <div class="border-t border-gray-800 pt-6 flex items-center justify-between text-xs">
      <span>&copy; 2026 花語 FloraStory. All rights reserved.</span>
      <div class="flex items-center gap-4">
        <a class="hover:text-white transition cursor-pointer">Instagram</a>
        <a class="hover:text-white transition cursor-pointer">Facebook</a>
        <a class="hover:text-white transition cursor-pointer">LINE</a>
      </div>
    </div>
  </div>
</footer>

<script>
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const icon = btn.querySelector('.faq-icon');
  const isOpen = answer.classList.contains('open');
  document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-icon').forEach(i => i.classList.remove('open'));
  if (!isOpen) {
    answer.classList.add('open');
    icon.classList.add('open');
  }
}

function filterProducts(category) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.classList.add('text-gray-500');
  });
  const activeBtn = document.querySelector('[data-cat="'+category+'"]');
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.classList.remove('text-gray-500');
  }
  const cards = document.querySelectorAll('#productGrid > div');
  cards.forEach(card => {
    if (category === 'all' || card.dataset.category === category) {
      card.style.display = '';
      card.style.animation = 'fadeIn 0.4s ease-out';
    } else {
      card.style.display = 'none';
    }
  });
}
</script>

</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
