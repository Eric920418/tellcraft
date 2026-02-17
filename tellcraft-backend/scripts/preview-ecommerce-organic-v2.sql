INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'b26b23e6-3068-4c9e-9938-3bf428000d72',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>有機良品 OrganicGood</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        leaf: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#059669',700:'#15803d',800:'#166534',900:'#14532d' },
        soil: { 50:'#faf6f1',100:'#f0e6d3',200:'#e0cca8',300:'#c9a96e',400:'#a07d4a',500:'#8b6b3a',600:'#6d5230' },
        sand: { 50:'#fefcf3',100:'#fdf6e3' }
      }
    }
  }
}
</script>
<style>
* { font-family: 'DM Sans', sans-serif; scroll-behavior: smooth; }
body { background: #f9fdf6; }
.product-card { transition: all 0.35s ease; cursor: pointer; }
.product-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(5,150,105,0.12); }
.farmer-card { transition: all 0.3s ease; }
.farmer-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(5,150,105,0.1); }
.deal-card { transition: all 0.3s ease; }
.deal-card:hover { transform: scale(1.03); }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.4s ease; }
.faq-answer.open { max-height: 400px; }
.faq-chevron { transition: transform 0.3s ease; }
.faq-chevron.open { transform: rotate(180deg); }
.category-btn { transition: all 0.25s ease; }
.category-btn.active { background: #059669; color: white; box-shadow: 0 4px 12px rgba(5,150,105,0.3); }
.sub-plan { transition: all 0.3s ease; }
.sub-plan:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(5,150,105,0.15); }
.modal-overlay { transition: opacity 0.3s ease; }
.qty-btn { transition: all 0.15s ease; }
.qty-btn:hover { background: #059669; color: white; }
</style>
</head>
<body>

<!-- Sticky Nav -->
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-leaf-100 shadow-sm">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-2">
      <span class="text-2xl">🌿</span>
      <span class="text-lg font-bold text-leaf-800 tracking-tight">有機良品</span>
      <span class="text-[10px] text-leaf-500 font-medium">OrganicGood</span>
    </div>
    <div class="flex items-center gap-6 text-sm text-gray-500">
      <a onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})" class="hover:text-leaf-600 transition cursor-pointer font-medium">嚴選好物</a>
      <a onclick="document.getElementById('quality').scrollIntoView({behavior:'smooth'})" class="hover:text-leaf-600 transition cursor-pointer font-medium">品質保證</a>
      <a onclick="document.getElementById('farmers').scrollIntoView({behavior:'smooth'})" class="hover:text-leaf-600 transition cursor-pointer font-medium">合作小農</a>
      <a onclick="document.getElementById('subscribe').scrollIntoView({behavior:'smooth'})" class="hover:text-leaf-600 transition cursor-pointer font-medium">訂閱方案</a>
      <a onclick="document.getElementById('faq').scrollIntoView({behavior:'smooth'})" class="hover:text-leaf-600 transition cursor-pointer font-medium">常見問題</a>
      <div class="relative cursor-pointer ml-2">
        <svg class="w-5 h-5 text-gray-400 hover:text-leaf-600 transition" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
        <span class="absolute -top-2 -right-2 w-4 h-4 bg-leaf-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">2</span>
      </div>
    </div>
  </div>
</nav>

<!-- Product Detail Modal -->
<div id="productModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm modal-overlay">
  <div class="bg-white rounded-2xl p-0 w-full max-w-lg shadow-2xl relative overflow-hidden">
    <button onclick="document.getElementById('productModal').classList.add('hidden')" class="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 text-lg shadow-sm">&times;</button>
    <div id="modalImgArea" class="h-48 bg-gradient-to-br from-leaf-100 to-emerald-200 flex items-center justify-center text-7xl">🥬</div>
    <div class="p-6">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[10px] bg-leaf-100 text-leaf-700 px-2 py-0.5 rounded-full font-bold">有機認證</span>
        <span class="text-[10px] bg-soil-100 text-soil-600 px-2 py-0.5 rounded-full font-bold">產地直送</span>
      </div>
      <h3 id="modalTitle" class="text-xl font-bold text-gray-800 mb-1">有機綜合蔬菜箱</h3>
      <p id="modalOrigin" class="text-xs text-gray-400 mb-3">產地：雲林西螺 &#183; 陳大哥有機農場</p>
      <p id="modalDesc" class="text-sm text-gray-500 leading-relaxed mb-4">嚴選當季 8 種有機蔬菜，48 小時內從產地冷鏈直送到府。通過慈心有機認證，無農藥、無化肥，讓全家吃得安心。</p>
      <div class="flex items-center gap-3 mb-4">
        <span class="text-xs text-gray-400">認證：</span>
        <span class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium">慈心有機</span>
        <span class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium">產銷履歷</span>
      </div>
      <div class="flex items-center justify-between mb-5">
        <div>
          <span class="text-2xl font-bold text-leaf-600" id="modalPrice">NT$ 450</span>
          <span class="text-xs text-gray-400 ml-1">/ 箱</span>
        </div>
        <div class="flex items-center gap-2 border border-gray-200 rounded-full px-1 py-1">
          <button onclick="var e=document.getElementById('modalQty');var v=parseInt(e.textContent);if(v>1)e.textContent=v-1" class="qty-btn w-7 h-7 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center text-sm font-bold">-</button>
          <span id="modalQty" class="text-sm font-bold text-gray-800 w-6 text-center">1</span>
          <button onclick="var e=document.getElementById('modalQty');var v=parseInt(e.textContent);if(v<10)e.textContent=v+1" class="qty-btn w-7 h-7 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center text-sm font-bold">+</button>
        </div>
      </div>
      <div id="modalCartArea">
        <button onclick="document.getElementById('modalCartArea').innerHTML='<div class=\'flex items-center justify-center gap-2 py-3 bg-leaf-50 rounded-xl\'><svg class=\'w-5 h-5 text-leaf-600\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' viewBox=\'0 0 24 24\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M4.5 12.75l6 6 9-13.5\'/></svg><span class=\'text-leaf-700 font-bold text-sm\'>已加入購物車！</span></div>'" class="w-full bg-leaf-600 hover:bg-leaf-700 text-white py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-leaf-200 flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
          加入購物車
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Hero -->
<section class="py-20 bg-gradient-to-br from-leaf-50 via-green-50 to-sand-50 relative overflow-hidden">
  <div class="absolute right-0 top-0 w-96 h-96 bg-leaf-200/20 rounded-full blur-[120px]"></div>
  <div class="absolute left-10 bottom-0 w-64 h-64 bg-lime-200/20 rounded-full blur-[100px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-14 relative">
    <div class="flex-1">
      <div class="inline-flex items-center gap-2 bg-leaf-100 text-leaf-700 px-4 py-1.5 rounded-full text-xs font-bold mb-5">
        <span>🏆</span> 有機認證 &#183; 產地直送 &#183; 冷鏈配送
      </div>
      <h1 class="text-5xl font-bold text-gray-800 leading-tight mb-4">純淨天然<br><span class="text-leaf-600">安心食用</span></h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-md">嚴選全台 50+ 有機小農，從田間到餐桌不超過 48 小時。每一口都是大自然最純粹的饋贈。</p>
      <div class="flex gap-3">
        <button onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})" class="bg-leaf-600 hover:bg-leaf-700 text-white px-8 py-3.5 rounded-full font-bold text-sm transition shadow-lg shadow-leaf-200">立即選購</button>
        <button onclick="document.getElementById('subscribe').scrollIntoView({behavior:'smooth'})" class="border-2 border-leaf-600 text-leaf-600 hover:bg-leaf-600 hover:text-white px-8 py-3.5 rounded-full font-bold text-sm transition">訂閱方案</button>
      </div>
    </div>
    <div class="flex gap-4">
      <div class="w-52 h-60 rounded-3xl bg-gradient-to-b from-leaf-200 to-emerald-300 flex items-center justify-center text-7xl shadow-xl shadow-leaf-100 rotate-3">🥬</div>
      <div class="w-52 h-60 rounded-3xl bg-gradient-to-b from-amber-100 to-orange-200 flex items-center justify-center text-7xl shadow-xl shadow-amber-100 -rotate-3 mt-10">🍊</div>
    </div>
  </div>
</section>

<!-- Stats -->
<section class="bg-white border-y border-leaf-100">
  <div class="max-w-6xl mx-auto px-6 py-8">
    <div class="grid grid-cols-4 gap-8">
      <div class="text-center">
        <div class="text-3xl font-bold text-leaf-600 mb-1">200+</div>
        <div class="text-xs text-gray-500 font-medium">有機商品</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold text-leaf-600 mb-1">50+</div>
        <div class="text-xs text-gray-500 font-medium">小農合作</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold text-leaf-600 mb-1">$999</div>
        <div class="text-xs text-gray-500 font-medium">免運門檻</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold text-leaf-600 mb-1">全台</div>
        <div class="text-xs text-gray-500 font-medium">冷鏈配送</div>
      </div>
    </div>
  </div>
</section>

<!-- Products with Category Filter -->
<section id="products" class="max-w-6xl mx-auto px-6 py-16">
  <div class="text-center mb-10">
    <span class="text-xs bg-leaf-100 text-leaf-700 px-3 py-1 rounded-full font-bold">嚴選好物</span>
    <h2 class="text-3xl font-bold text-gray-800 mt-3 mb-2">新鮮有機，產地直送</h2>
    <p class="text-sm text-gray-400 max-w-md mx-auto">每件商品皆通過有機認證，支持在地小農永續耕作</p>
  </div>

  <!-- Category Filter -->
  <div class="flex items-center justify-center gap-2 mb-8 flex-wrap">
    <button onclick="filterProducts('all')" class="category-btn active px-5 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600" data-cat="all">全部</button>
    <button onclick="filterProducts('vegfruit')" class="category-btn px-5 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600" data-cat="vegfruit">🥦 蔬果</button>
    <button onclick="filterProducts('grain')" class="category-btn px-5 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600" data-cat="grain">🌾 穀物</button>
    <button onclick="filterProducts('seasoning')" class="category-btn px-5 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600" data-cat="seasoning">🧂 調味料</button>
    <button onclick="filterProducts('drink')" class="category-btn px-5 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600" data-cat="drink">🍵 飲品</button>
    <button onclick="filterProducts('health')" class="category-btn px-5 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600" data-cat="health">💊 保健</button>
  </div>

  <!-- Product Grid -->
  <div id="productGrid" class="grid grid-cols-4 gap-5">
    <div class="product-card bg-white rounded-2xl overflow-hidden border border-leaf-100" data-category="vegfruit" onclick="openProductModal('🥬','有機綜合蔬菜箱','雲林西螺 &#183; 陳大哥有機農場','嚴選當季 8 種有機蔬菜，48 小時內冷鏈直送到府。通過慈心有機認證，無農藥、無化肥。','NT$ 450')">
      <div class="h-40 bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center text-6xl relative">
        <span>🥬</span>
        <span class="absolute top-3 left-3 text-[10px] bg-leaf-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-sm">有機認證</span>
      </div>
      <div class="p-4">
        <div class="text-xs text-gray-400 mb-1">雲林西螺</div>
        <h3 class="font-bold text-gray-800 text-sm mb-2">有機綜合蔬菜箱</h3>
        <div class="flex items-center justify-between">
          <span class="text-leaf-600 font-bold text-lg">NT$ 450</span>
          <button class="w-8 h-8 rounded-full bg-leaf-50 text-leaf-600 flex items-center justify-center hover:bg-leaf-600 hover:text-white transition text-sm font-bold">+</button>
        </div>
      </div>
    </div>

    <div class="product-card bg-white rounded-2xl overflow-hidden border border-leaf-100" data-category="vegfruit" onclick="openProductModal('🍎','蜜富士蘋果 6入','台中梨山 &#183; 林家果園','高山冷冽氣候孕育，蜜腺豐富、口感清脆。海拔 2000 公尺以上栽種，自然熟成。','NT$ 380')">
      <div class="h-40 bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center text-6xl relative">
        <span>🍎</span>
        <span class="absolute top-3 left-3 text-[10px] bg-orange-500 text-white px-2.5 py-0.5 rounded-full font-bold shadow-sm">當季限定</span>
      </div>
      <div class="p-4">
        <div class="text-xs text-gray-400 mb-1">台中梨山</div>
        <h3 class="font-bold text-gray-800 text-sm mb-2">蜜富士蘋果 6入</h3>
        <div class="flex items-center justify-between">
          <span class="text-leaf-600 font-bold text-lg">NT$ 380</span>
          <button class="w-8 h-8 rounded-full bg-leaf-50 text-leaf-600 flex items-center justify-center hover:bg-leaf-600 hover:text-white transition text-sm font-bold">+</button>
        </div>
      </div>
    </div>

    <div class="product-card bg-white rounded-2xl overflow-hidden border border-leaf-100" data-category="grain" onclick="openProductModal('🌾','有機糙米 2kg','花蓮富里 &#183; 天賜糧源','花東縱谷純淨水源灌溉，傳統日曬工法，保留完整營養。適合煮粥、做飯糰。','NT$ 320')">
      <div class="h-40 bg-gradient-to-br from-amber-100 to-yellow-200 flex items-center justify-center text-6xl relative">
        <span>🌾</span>
        <span class="absolute top-3 left-3 text-[10px] bg-leaf-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-sm">有機認證</span>
      </div>
      <div class="p-4">
        <div class="text-xs text-gray-400 mb-1">花蓮富里</div>
        <h3 class="font-bold text-gray-800 text-sm mb-2">有機糙米 2kg</h3>
        <div class="flex items-center justify-between">
          <span class="text-leaf-600 font-bold text-lg">NT$ 320</span>
          <button class="w-8 h-8 rounded-full bg-leaf-50 text-leaf-600 flex items-center justify-center hover:bg-leaf-600 hover:text-white transition text-sm font-bold">+</button>
        </div>
      </div>
    </div>

    <div class="product-card bg-white rounded-2xl overflow-hidden border border-leaf-100" data-category="drink" onclick="openProductModal('🧃','冷壓綜合蔬果汁 6瓶','南投埔里 &#183; 綠光農場','嚴選 12 種有機蔬果冷壓萃取，無加糖、無添加物。每瓶含滿滿膳食纖維與維生素。','NT$ 580')">
      <div class="h-40 bg-gradient-to-br from-lime-100 to-green-200 flex items-center justify-center text-6xl relative">
        <span>🧃</span>
        <span class="absolute top-3 left-3 text-[10px] bg-leaf-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-sm">有機認證</span>
      </div>
      <div class="p-4">
        <div class="text-xs text-gray-400 mb-1">南投埔里</div>
        <h3 class="font-bold text-gray-800 text-sm mb-2">冷壓綜合蔬果汁 6瓶</h3>
        <div class="flex items-center justify-between">
          <span class="text-leaf-600 font-bold text-lg">NT$ 580</span>
          <button class="w-8 h-8 rounded-full bg-leaf-50 text-leaf-600 flex items-center justify-center hover:bg-leaf-600 hover:text-white transition text-sm font-bold">+</button>
        </div>
      </div>
    </div>

    <div class="product-card bg-white rounded-2xl overflow-hidden border border-leaf-100" data-category="seasoning" onclick="openProductModal('🫒','初榨冷壓苦茶油','苗栗三灣 &#183; 老茶園','百年茶樹果實冷壓萃取，發煙點高、營養豐富。涼拌、煎炒皆宜，台灣在地好油。','NT$ 680')">
      <div class="h-40 bg-gradient-to-br from-yellow-100 to-amber-200 flex items-center justify-center text-6xl relative">
        <span>🫒</span>
        <span class="absolute top-3 left-3 text-[10px] bg-soil-500 text-white px-2.5 py-0.5 rounded-full font-bold shadow-sm">小農直送</span>
      </div>
      <div class="p-4">
        <div class="text-xs text-gray-400 mb-1">苗栗三灣</div>
        <h3 class="font-bold text-gray-800 text-sm mb-2">初榨冷壓苦茶油</h3>
        <div class="flex items-center justify-between">
          <span class="text-leaf-600 font-bold text-lg">NT$ 680</span>
          <button class="w-8 h-8 rounded-full bg-leaf-50 text-leaf-600 flex items-center justify-center hover:bg-leaf-600 hover:text-white transition text-sm font-bold">+</button>
        </div>
      </div>
    </div>

    <div class="product-card bg-white rounded-2xl overflow-hidden border border-leaf-100" data-category="health" onclick="openProductModal('🍯','台灣野生龍眼蜜','台南東山 &#183; 蜂之鄉','純天然龍眼蜜，無添加糖漿。富含酵素與礦物質，每日一匙，養生好選擇。','NT$ 520')">
      <div class="h-40 bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center text-6xl relative">
        <span>🍯</span>
        <span class="absolute top-3 left-3 text-[10px] bg-amber-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-sm">純天然</span>
      </div>
      <div class="p-4">
        <div class="text-xs text-gray-400 mb-1">台南東山</div>
        <h3 class="font-bold text-gray-800 text-sm mb-2">台灣野生龍眼蜜</h3>
        <div class="flex items-center justify-between">
          <span class="text-leaf-600 font-bold text-lg">NT$ 520</span>
          <button class="w-8 h-8 rounded-full bg-leaf-50 text-leaf-600 flex items-center justify-center hover:bg-leaf-600 hover:text-white transition text-sm font-bold">+</button>
        </div>
      </div>
    </div>

    <div class="product-card bg-white rounded-2xl overflow-hidden border border-leaf-100" data-category="vegfruit" onclick="openProductModal('🥕','有機紅蘿蔔 1kg','彰化溪州 &#183; 自然田','沙質壤土種植，甜度高、口感細緻。適合打汁、燉湯、生食，孩子也愛吃。','NT$ 120')">
      <div class="h-40 bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center text-6xl relative">
        <span>🥕</span>
        <span class="absolute top-3 left-3 text-[10px] bg-leaf-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-sm">有機認證</span>
      </div>
      <div class="p-4">
        <div class="text-xs text-gray-400 mb-1">彰化溪州</div>
        <h3 class="font-bold text-gray-800 text-sm mb-2">有機紅蘿蔔 1kg</h3>
        <div class="flex items-center justify-between">
          <span class="text-leaf-600 font-bold text-lg">NT$ 120</span>
          <button class="w-8 h-8 rounded-full bg-leaf-50 text-leaf-600 flex items-center justify-center hover:bg-leaf-600 hover:text-white transition text-sm font-bold">+</button>
        </div>
      </div>
    </div>

    <div class="product-card bg-white rounded-2xl overflow-hidden border border-leaf-100" data-category="drink" onclick="openProductModal('🍵','有機烏龍茶 150g','南投鹿谷 &#183; 古法茶園','海拔 1200 公尺茶園，手採一心二葉。傳統炭焙工法，喉韻甘醇、回甘持久。','NT$ 450')">
      <div class="h-40 bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center text-6xl relative">
        <span>🍵</span>
        <span class="absolute top-3 left-3 text-[10px] bg-leaf-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-sm">有機認證</span>
      </div>
      <div class="p-4">
        <div class="text-xs text-gray-400 mb-1">南投鹿谷</div>
        <h3 class="font-bold text-gray-800 text-sm mb-2">有機烏龍茶 150g</h3>
        <div class="flex items-center justify-between">
          <span class="text-leaf-600 font-bold text-lg">NT$ 450</span>
          <button class="w-8 h-8 rounded-full bg-leaf-50 text-leaf-600 flex items-center justify-center hover:bg-leaf-600 hover:text-white transition text-sm font-bold">+</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Quality Assurance -->
<section id="quality" class="bg-white py-16 border-y border-leaf-100">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-10">
      <span class="text-xs bg-leaf-100 text-leaf-700 px-3 py-1 rounded-full font-bold">品質保證</span>
      <h2 class="text-3xl font-bold text-gray-800 mt-3 mb-2">四大安心承諾</h2>
      <p class="text-sm text-gray-400">從產地到餐桌，每一個環節都嚴格把關</p>
    </div>
    <div class="grid grid-cols-4 gap-6">
      <div class="text-center p-6 rounded-2xl bg-leaf-50 border border-leaf-100 hover:shadow-lg transition">
        <div class="w-16 h-16 bg-leaf-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🏅</div>
        <h3 class="font-bold text-gray-800 mb-2">有機認證</h3>
        <p class="text-xs text-gray-500 leading-relaxed">所有商品皆通過政府核可有機認證機構檢驗，定期抽檢確保品質。</p>
      </div>
      <div class="text-center p-6 rounded-2xl bg-leaf-50 border border-leaf-100 hover:shadow-lg transition">
        <div class="w-16 h-16 bg-leaf-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📍</div>
        <h3 class="font-bold text-gray-800 mb-2">產地溯源</h3>
        <p class="text-xs text-gray-500 leading-relaxed">每件商品附產地溯源 QR Code，掃描即可查看農場資訊與種植紀錄。</p>
      </div>
      <div class="text-center p-6 rounded-2xl bg-leaf-50 border border-leaf-100 hover:shadow-lg transition">
        <div class="w-16 h-16 bg-leaf-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🧊</div>
        <h3 class="font-bold text-gray-800 mb-2">冷鏈配送</h3>
        <p class="text-xs text-gray-500 leading-relaxed">全程低溫冷鏈物流，從產地到府不斷鏈，保持食材最佳鮮度。</p>
      </div>
      <div class="text-center p-6 rounded-2xl bg-leaf-50 border border-leaf-100 hover:shadow-lg transition">
        <div class="w-16 h-16 bg-leaf-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🚫</div>
        <h3 class="font-bold text-gray-800 mb-2">無添加</h3>
        <p class="text-xs text-gray-500 leading-relaxed">堅持無農藥、無化肥、無防腐劑，還原食材最天然的味道。</p>
      </div>
    </div>
  </div>
</section>

<!-- Farmers -->
<section id="farmers" class="max-w-6xl mx-auto px-6 py-16">
  <div class="text-center mb-10">
    <span class="text-xs bg-soil-100 text-soil-600 px-3 py-1 rounded-full font-bold">合作小農</span>
    <h2 class="text-3xl font-bold text-gray-800 mt-3 mb-2">用心耕作的夥伴</h2>
    <p class="text-sm text-gray-400">認識為你種出健康食材的農友們</p>
  </div>
  <div class="grid grid-cols-4 gap-6">
    <div class="farmer-card bg-white rounded-2xl p-5 border border-leaf-100 text-center">
      <div class="w-20 h-20 bg-gradient-to-br from-leaf-200 to-emerald-300 rounded-full flex items-center justify-center text-4xl mx-auto mb-3">👨‍🌾</div>
      <h3 class="font-bold text-gray-800 mb-0.5">陳大哥</h3>
      <div class="text-xs text-leaf-600 font-medium mb-2">雲林西螺 &#183; 有機蔬菜</div>
      <p class="text-xs text-gray-400 leading-relaxed">從慣行農法轉型有機 15 年，堅持不用農藥，讓土地自然呼吸。</p>
      <div class="mt-3 flex items-center justify-center gap-1">
        <span class="text-[10px] bg-leaf-50 text-leaf-600 px-2 py-0.5 rounded-full">慈心認證</span>
        <span class="text-[10px] bg-leaf-50 text-leaf-600 px-2 py-0.5 rounded-full">15年經驗</span>
      </div>
    </div>
    <div class="farmer-card bg-white rounded-2xl p-5 border border-leaf-100 text-center">
      <div class="w-20 h-20 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full flex items-center justify-center text-4xl mx-auto mb-3">👩‍🌾</div>
      <h3 class="font-bold text-gray-800 mb-0.5">林媽媽</h3>
      <div class="text-xs text-leaf-600 font-medium mb-2">台中梨山 &#183; 溫帶水果</div>
      <p class="text-xs text-gray-400 leading-relaxed">三代果農，海拔 2000 米以上栽種蘋果與水梨，堅持自然熟成。</p>
      <div class="mt-3 flex items-center justify-center gap-1">
        <span class="text-[10px] bg-leaf-50 text-leaf-600 px-2 py-0.5 rounded-full">產銷履歷</span>
        <span class="text-[10px] bg-leaf-50 text-leaf-600 px-2 py-0.5 rounded-full">三代傳承</span>
      </div>
    </div>
    <div class="farmer-card bg-white rounded-2xl p-5 border border-leaf-100 text-center">
      <div class="w-20 h-20 bg-gradient-to-br from-yellow-200 to-lime-300 rounded-full flex items-center justify-center text-4xl mx-auto mb-3">👨‍🌾</div>
      <h3 class="font-bold text-gray-800 mb-0.5">阿明</h3>
      <div class="text-xs text-leaf-600 font-medium mb-2">花蓮富里 &#183; 有機稻米</div>
      <p class="text-xs text-gray-400 leading-relaxed">青農返鄉，用科技結合傳統農法，種出獲獎無數的有機好米。</p>
      <div class="mt-3 flex items-center justify-center gap-1">
        <span class="text-[10px] bg-leaf-50 text-leaf-600 px-2 py-0.5 rounded-full">有機認證</span>
        <span class="text-[10px] bg-leaf-50 text-leaf-600 px-2 py-0.5 rounded-full">比賽常勝</span>
      </div>
    </div>
    <div class="farmer-card bg-white rounded-2xl p-5 border border-leaf-100 text-center">
      <div class="w-20 h-20 bg-gradient-to-br from-teal-200 to-cyan-300 rounded-full flex items-center justify-center text-4xl mx-auto mb-3">👩‍🌾</div>
      <h3 class="font-bold text-gray-800 mb-0.5">美惠姐</h3>
      <div class="text-xs text-leaf-600 font-medium mb-2">南投埔里 &#183; 蔬果加工</div>
      <p class="text-xs text-gray-400 leading-relaxed">專注冷壓蔬果汁與果乾製作，全程低溫處理，保留最多營養。</p>
      <div class="mt-3 flex items-center justify-center gap-1">
        <span class="text-[10px] bg-leaf-50 text-leaf-600 px-2 py-0.5 rounded-full">HACCP</span>
        <span class="text-[10px] bg-leaf-50 text-leaf-600 px-2 py-0.5 rounded-full">8年經驗</span>
      </div>
    </div>
  </div>
</section>

<!-- Monthly Deals -->
<section class="bg-gradient-to-br from-leaf-50 to-emerald-50 py-16 border-y border-leaf-100">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-10">
      <span class="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold">限時優惠</span>
      <h2 class="text-3xl font-bold text-gray-800 mt-3 mb-2">本月特惠</h2>
      <p class="text-sm text-gray-400">每月精選優質商品，限量供應</p>
    </div>
    <div class="grid grid-cols-3 gap-6">
      <div class="deal-card bg-white rounded-2xl overflow-hidden border border-leaf-100 relative cursor-pointer" onclick="openProductModal('🥗','有機沙拉蔬菜組合','嘉義新港 &#183; 晨光農場','嚴選 5 種生菜、2 種芽菜，搭配自製油醋醬。開袋即食，輕鬆享受有機生活。','NT$ 199')">
        <div class="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">75折</div>
        <div class="h-36 bg-gradient-to-br from-green-100 to-lime-200 flex items-center justify-center text-6xl">🥗</div>
        <div class="p-4">
          <h3 class="font-bold text-gray-800 mb-1">有機沙拉蔬菜組合</h3>
          <p class="text-xs text-gray-400 mb-2">嘉義新港 &#183; 5 種生菜 + 油醋醬</p>
          <div class="flex items-center gap-2">
            <span class="text-leaf-600 font-bold text-lg">NT$ 199</span>
            <span class="text-xs text-gray-400 line-through">NT$ 265</span>
          </div>
        </div>
      </div>
      <div class="deal-card bg-white rounded-2xl overflow-hidden border border-leaf-100 relative cursor-pointer" onclick="openProductModal('🍠','有機地瓜 3kg','台南新化 &#183; 金黃農場','台農 57 號黃金地瓜，鬆軟綿密、甜度極高。烤箱烤 40 分鐘即享天然甜點。','NT$ 180')">
        <div class="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">8折</div>
        <div class="h-36 bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center text-6xl">🍠</div>
        <div class="p-4">
          <h3 class="font-bold text-gray-800 mb-1">有機地瓜 3kg</h3>
          <p class="text-xs text-gray-400 mb-2">台南新化 &#183; 台農 57 號黃金地瓜</p>
          <div class="flex items-center gap-2">
            <span class="text-leaf-600 font-bold text-lg">NT$ 180</span>
            <span class="text-xs text-gray-400 line-through">NT$ 225</span>
          </div>
        </div>
      </div>
      <div class="deal-card bg-white rounded-2xl overflow-hidden border border-leaf-100 relative cursor-pointer" onclick="openProductModal('🫖','有機薑母茶 12入','宜蘭冬山 &#183; 老薑園','嚴選三年老薑，搭配有機黑糖熬製。冬日暖身、經期調理最佳選擇。','NT$ 299')">
        <div class="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">買2送1</div>
        <div class="h-36 bg-gradient-to-br from-yellow-100 to-orange-200 flex items-center justify-center text-6xl">🫖</div>
        <div class="p-4">
          <h3 class="font-bold text-gray-800 mb-1">有機薑母茶 12入</h3>
          <p class="text-xs text-gray-400 mb-2">宜蘭冬山 &#183; 三年老薑黑糖</p>
          <div class="flex items-center gap-2">
            <span class="text-leaf-600 font-bold text-lg">NT$ 299</span>
            <span class="text-xs text-gray-400 line-through">NT$ 380</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="max-w-6xl mx-auto px-6 py-16">
  <div class="text-center mb-10">
    <span class="text-xs bg-leaf-100 text-leaf-700 px-3 py-1 rounded-full font-bold">真實評價</span>
    <h2 class="text-3xl font-bold text-gray-800 mt-3 mb-2">顧客心聲</h2>
    <p class="text-sm text-gray-400">來自真實顧客的回饋</p>
  </div>
  <div class="grid grid-cols-3 gap-6">
    <div class="bg-white rounded-2xl p-6 border border-leaf-100 hover:shadow-lg transition">
      <div class="flex items-center gap-1 mb-3">
        <span class="text-amber-400 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
      </div>
      <p class="text-sm text-gray-600 leading-relaxed mb-4">「訂閱蔬菜箱半年了，每週收到的蔬菜都超新鮮！小朋友以前不愛吃菜，現在搶著吃。有機的味道真的不一樣。」</p>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-leaf-100 rounded-full flex items-center justify-center text-lg">👩</div>
        <div>
          <div class="text-sm font-bold text-gray-800">王小姐</div>
          <div class="text-xs text-gray-400">訂閱會員 6 個月</div>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-2xl p-6 border border-leaf-100 hover:shadow-lg transition">
      <div class="flex items-center gap-1 mb-3">
        <span class="text-amber-400 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
      </div>
      <p class="text-sm text-gray-600 leading-relaxed mb-4">「冷壓蔬果汁超好喝！而且包裝很用心，玻璃瓶環保又質感。產地溯源 QR Code 讓我很放心，知道食材從哪來。」</p>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-lg">👨</div>
        <div>
          <div class="text-sm font-bold text-gray-800">陳先生</div>
          <div class="text-xs text-gray-400">回購客戶 1 年</div>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-2xl p-6 border border-leaf-100 hover:shadow-lg transition">
      <div class="flex items-center gap-1 mb-3">
        <span class="text-amber-400 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
      </div>
      <p class="text-sm text-gray-600 leading-relaxed mb-4">「企業訂閱方案很棒！員工福利升級，大家都很期待每週的有機蔬果箱。客服回應很快，配送也都準時。」</p>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-lg">👩‍💼</div>
        <div>
          <div class="text-sm font-bold text-gray-800">李經理</div>
          <div class="text-xs text-gray-400">企業方案用戶</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Subscription Plans -->
<section id="subscribe" class="bg-leaf-800 text-white py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-10">
      <span class="text-xs bg-leaf-600 text-white px-3 py-1 rounded-full font-bold">訂閱方案</span>
      <h2 class="text-3xl font-bold mt-3 mb-2">每月新鮮直送</h2>
      <p class="text-sm text-white/60">省時省力，讓有機生活更輕鬆</p>
    </div>
    <div class="grid grid-cols-3 gap-6">
      <div class="sub-plan bg-white/10 rounded-2xl p-7 border border-white/10 text-center backdrop-blur-sm">
        <div class="text-3xl mb-3">🥗</div>
        <h3 class="text-lg font-bold mb-1">個人方案</h3>
        <p class="text-xs text-white/50 mb-4">適合 1-2 人小家庭</p>
        <div class="text-3xl font-bold mb-1">NT$ 680<span class="text-sm font-normal text-white/50">/月</span></div>
        <ul class="text-xs text-white/70 space-y-2 mt-5 mb-6 text-left">
          <li class="flex items-center gap-2"><span class="text-leaf-400">&#10003;</span> 每週 5 種有機蔬菜</li>
          <li class="flex items-center gap-2"><span class="text-leaf-400">&#10003;</span> 每月 2 種當季水果</li>
          <li class="flex items-center gap-2"><span class="text-leaf-400">&#10003;</span> 免運費配送</li>
          <li class="flex items-center gap-2"><span class="text-white/30">&#10003;</span> <span class="text-white/40">穀物雜糧加購 9 折</span></li>
        </ul>
        <button class="w-full py-2.5 rounded-xl border border-white/30 text-sm font-medium hover:bg-white/10 transition">選擇方案</button>
      </div>
      <div class="sub-plan bg-white/15 rounded-2xl p-7 border border-leaf-400 text-center relative backdrop-blur-sm">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-leaf-400 text-leaf-900 text-xs font-bold px-4 py-1 rounded-full">最受歡迎</div>
        <div class="text-3xl mb-3">🥘</div>
        <h3 class="text-lg font-bold mb-1">家庭方案</h3>
        <p class="text-xs text-white/50 mb-4">適合 3-5 人家庭</p>
        <div class="text-3xl font-bold mb-1">NT$ 1,280<span class="text-sm font-normal text-white/50">/月</span></div>
        <ul class="text-xs text-white/70 space-y-2 mt-5 mb-6 text-left">
          <li class="flex items-center gap-2"><span class="text-leaf-400">&#10003;</span> 每週 8 種有機蔬菜</li>
          <li class="flex items-center gap-2"><span class="text-leaf-400">&#10003;</span> 每月 4 種當季水果</li>
          <li class="flex items-center gap-2"><span class="text-leaf-400">&#10003;</span> 每月穀物雜糧 1 份</li>
          <li class="flex items-center gap-2"><span class="text-leaf-400">&#10003;</span> 免運費 + 專屬食譜</li>
        </ul>
        <button class="w-full py-2.5 rounded-xl bg-leaf-500 hover:bg-leaf-400 text-white text-sm font-bold transition shadow-lg">選擇方案</button>
      </div>
      <div class="sub-plan bg-white/10 rounded-2xl p-7 border border-white/10 text-center backdrop-blur-sm">
        <div class="text-3xl mb-3">🏢</div>
        <h3 class="text-lg font-bold mb-1">企業方案</h3>
        <p class="text-xs text-white/50 mb-4">員工福利 / 辦公室下午茶</p>
        <div class="text-3xl font-bold mb-1">NT$ 2,800<span class="text-sm font-normal text-white/50">/月</span></div>
        <ul class="text-xs text-white/70 space-y-2 mt-5 mb-6 text-left">
          <li class="flex items-center gap-2"><span class="text-leaf-400">&#10003;</span> 客製化蔬果組合</li>
          <li class="flex items-center gap-2"><span class="text-leaf-400">&#10003;</span> 每週 2 次配送</li>
          <li class="flex items-center gap-2"><span class="text-leaf-400">&#10003;</span> 專屬客服經理</li>
          <li class="flex items-center gap-2"><span class="text-leaf-400">&#10003;</span> 統一發票 / 月結</li>
        </ul>
        <button class="w-full py-2.5 rounded-xl border border-white/30 text-sm font-medium hover:bg-white/10 transition">聯繫業務</button>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section id="faq" class="max-w-6xl mx-auto px-6 py-16">
  <div class="text-center mb-10">
    <span class="text-xs bg-leaf-100 text-leaf-700 px-3 py-1 rounded-full font-bold">常見問題</span>
    <h2 class="text-3xl font-bold text-gray-800 mt-3 mb-2">FAQ</h2>
    <p class="text-sm text-gray-400">您可能想了解的問題</p>
  </div>
  <div class="max-w-2xl mx-auto space-y-3">
    <div class="bg-white rounded-xl border border-leaf-100 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer">
        <span class="text-sm font-bold text-gray-800">有機商品和一般商品有什麼不同？</span>
        <svg class="faq-chevron w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
      </button>
      <div class="faq-answer px-6">
        <p class="text-sm text-gray-500 leading-relaxed pb-4">有機商品在種植過程中完全不使用化學農藥、化學肥料及基因改造技術，並通過政府核可的有機認證機構定期檢驗。我們的有機農產品不僅更安全，口感和營養價值也更豐富。每件商品都附有有機認證標章和產地溯源資訊。</p>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-leaf-100 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer">
        <span class="text-sm font-bold text-gray-800">配送範圍和時間是怎樣的？</span>
        <svg class="faq-chevron w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
      </button>
      <div class="faq-answer px-6">
        <p class="text-sm text-gray-500 leading-relaxed pb-4">我們提供全台本島冷鏈宅配服務。一般訂單於下單後 48 小時內出貨，偏遠地區可能多 1 個工作天。訂閱方案固定每週配送（可選擇週二或週五），您也可以隨時在會員中心調整配送時間。消費滿 NT$ 999 免運費。</p>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-leaf-100 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer">
        <span class="text-sm font-bold text-gray-800">訂閱方案可以隨時取消嗎？</span>
        <svg class="faq-chevron w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
      </button>
      <div class="faq-answer px-6">
        <p class="text-sm text-gray-500 leading-relaxed pb-4">當然可以！訂閱方案完全彈性，無綁約期限。您可以隨時在會員中心暫停或取消訂閱，也可以更換方案等級。暫停或取消需在下次配送日前 3 天完成，已出貨的訂單無法取消但可辦理退貨。</p>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-leaf-100 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer">
        <span class="text-sm font-bold text-gray-800">收到商品不滿意怎麼辦？</span>
        <svg class="faq-chevron w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
      </button>
      <div class="faq-answer px-6">
        <p class="text-sm text-gray-500 leading-relaxed pb-4">我們提供 100% 滿意保證！生鮮商品如有品質問題，請在收貨 24 小時內拍照聯繫客服，我們將免費補寄或全額退款。其他商品在未拆封的情況下，7 天內可申請退換貨，退貨運費由我們負擔。</p>
      </div>
    </div>
  </div>
</section>

<!-- Delivery & Return -->
<section class="bg-soil-50 py-16 border-y border-soil-100">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-10">
      <span class="text-xs bg-soil-100 text-soil-600 px-3 py-1 rounded-full font-bold">購物須知</span>
      <h2 class="text-3xl font-bold text-gray-800 mt-3 mb-2">配送與退換貨</h2>
    </div>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-white rounded-2xl p-6 border border-soil-100">
        <div class="text-2xl mb-3">🚛</div>
        <h3 class="font-bold text-gray-800 mb-2">配送資訊</h3>
        <ul class="text-xs text-gray-500 space-y-1.5 leading-relaxed">
          <li>&#8226; 全台本島冷鏈宅配</li>
          <li>&#8226; 下單後 48 小時內出貨</li>
          <li>&#8226; 消費滿 NT$ 999 免運費</li>
          <li>&#8226; 未達免運門檻，運費 NT$ 150</li>
          <li>&#8226; 離島地區加收 NT$ 100</li>
        </ul>
      </div>
      <div class="bg-white rounded-2xl p-6 border border-soil-100">
        <div class="text-2xl mb-3">🔄</div>
        <h3 class="font-bold text-gray-800 mb-2">退換貨政策</h3>
        <ul class="text-xs text-gray-500 space-y-1.5 leading-relaxed">
          <li>&#8226; 生鮮品質問題 24 小時內受理</li>
          <li>&#8226; 一般商品 7 天鑑賞期</li>
          <li>&#8226; 退貨運費由我們負擔</li>
          <li>&#8226; 退款 3-5 個工作天入帳</li>
          <li>&#8226; 拍照回報即可申請</li>
        </ul>
      </div>
      <div class="bg-white rounded-2xl p-6 border border-soil-100">
        <div class="text-2xl mb-3">💳</div>
        <h3 class="font-bold text-gray-800 mb-2">付款方式</h3>
        <ul class="text-xs text-gray-500 space-y-1.5 leading-relaxed">
          <li>&#8226; 信用卡（Visa/Master/JCB）</li>
          <li>&#8226; LINE Pay / Apple Pay</li>
          <li>&#8226; ATM 轉帳</li>
          <li>&#8226; 貨到付款（加收 NT$ 30）</li>
          <li>&#8226; 企業月結（限企業方案）</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- Newsletter CTA -->
<section class="max-w-6xl mx-auto px-6 py-16">
  <div class="bg-gradient-to-r from-leaf-600 to-emerald-600 rounded-3xl p-10 text-center text-white relative overflow-hidden">
    <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-50"></div>
    <div class="relative">
      <div class="text-3xl mb-3">🌿</div>
      <h2 class="text-2xl font-bold mb-2">加入有機生活圈</h2>
      <p class="text-sm text-white/70 mb-6 max-w-md mx-auto">訂閱電子報，搶先獲得新品上架通知、獨家折扣碼與有機食譜分享</p>
      <div id="newsletterArea" class="flex items-center gap-3 max-w-md mx-auto">
        <input type="email" placeholder="請輸入您的 Email" class="flex-1 px-5 py-3 rounded-xl text-sm text-gray-800 bg-white border-0 outline-none placeholder-gray-400">
        <button onclick="document.getElementById('newsletterArea').innerHTML='<div class=\'flex items-center justify-center gap-2 py-3\'><span class=\'text-xl\'>&#10003;</span><span class=\'font-bold\'>訂閱成功！感謝您加入有機生活圈</span></div>'" class="bg-white text-leaf-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-leaf-50 transition whitespace-nowrap">立即訂閱</button>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-leaf-900 text-white py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-4 gap-8 mb-10">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <span class="text-xl">🌿</span>
          <span class="font-bold text-lg">有機良品</span>
        </div>
        <p class="text-xs text-white/50 leading-relaxed">用心耕作，安心食用。<br>支持在地小農，守護台灣這片土地。</p>
        <div class="flex items-center gap-3 mt-4">
          <span class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm cursor-pointer hover:bg-white/20 transition">f</span>
          <span class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm cursor-pointer hover:bg-white/20 transition">ig</span>
          <span class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm cursor-pointer hover:bg-white/20 transition">L</span>
        </div>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-4">商品分類</h4>
        <ul class="text-xs text-white/50 space-y-2">
          <li class="hover:text-white/80 cursor-pointer transition">有機蔬菜</li>
          <li class="hover:text-white/80 cursor-pointer transition">當季水果</li>
          <li class="hover:text-white/80 cursor-pointer transition">穀物雜糧</li>
          <li class="hover:text-white/80 cursor-pointer transition">健康飲品</li>
          <li class="hover:text-white/80 cursor-pointer transition">調味料</li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-4">顧客服務</h4>
        <ul class="text-xs text-white/50 space-y-2">
          <li class="hover:text-white/80 cursor-pointer transition">訂單查詢</li>
          <li class="hover:text-white/80 cursor-pointer transition">退換貨申請</li>
          <li class="hover:text-white/80 cursor-pointer transition">常見問題</li>
          <li class="hover:text-white/80 cursor-pointer transition">聯絡客服</li>
          <li class="hover:text-white/80 cursor-pointer transition">合作洽談</li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-4">聯絡我們</h4>
        <ul class="text-xs text-white/50 space-y-2">
          <li>&#128222; 0800-123-456</li>
          <li>&#128231; hello@organicgood.tw</li>
          <li>&#128205; 台北市大安區有機路 88 號</li>
          <li class="text-white/40 pt-1">週一至週五 09:00-18:00</li>
          <li class="text-white/40">週六 10:00-14:00</li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/10 pt-6 flex items-center justify-between">
      <div class="text-xs text-white/40">&copy; 2026 有機良品 OrganicGood. All rights reserved.</div>
      <div class="flex items-center gap-4 text-xs text-white/40">
        <span class="hover:text-white/70 cursor-pointer transition">隱私政策</span>
        <span class="hover:text-white/70 cursor-pointer transition">服務條款</span>
        <span class="hover:text-white/70 cursor-pointer transition">有機認證資訊</span>
      </div>
    </div>
  </div>
</footer>

<script>
function filterProducts(cat) {
  document.querySelectorAll('.category-btn').forEach(function(btn) {
    btn.classList.remove('active');
  });
  document.querySelector('[data-cat="'+cat+'"]').classList.add('active');
  document.querySelectorAll('#productGrid > div').forEach(function(card) {
    if (cat === 'all' || card.dataset.category === cat) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

function toggleFaq(btn) {
  var answer = btn.nextElementSibling;
  var chevron = btn.querySelector('.faq-chevron');
  var isOpen = answer.classList.contains('open');
  document.querySelectorAll('.faq-answer').forEach(function(a) { a.classList.remove('open'); });
  document.querySelectorAll('.faq-chevron').forEach(function(c) { c.classList.remove('open'); });
  if (!isOpen) {
    answer.classList.add('open');
    chevron.classList.add('open');
  }
}

function openProductModal(emoji, title, origin, desc, price) {
  document.getElementById('modalImgArea').innerHTML = '<span class="text-7xl">' + emoji + '</span>';
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalOrigin').innerHTML = '產地：' + origin;
  document.getElementById('modalDesc').textContent = desc;
  document.getElementById('modalPrice').textContent = price;
  document.getElementById('modalQty').textContent = '1';
  document.getElementById('modalCartArea').innerHTML = '<button onclick="document.getElementById(\'modalCartArea\').innerHTML=\'<div class=\\\'flex items-center justify-center gap-2 py-3 bg-leaf-50 rounded-xl\\\'><svg class=\\\'w-5 h-5 text-leaf-600\\\' fill=\\\'none\\\' stroke=\\\'currentColor\\\' stroke-width=\\\'2\\\' viewBox=\\\'0 0 24 24\\\'><path stroke-linecap=\\\'round\\\' stroke-linejoin=\\\'round\\\' d=\\\'M4.5 12.75l6 6 9-13.5\\\'/></svg><span class=\\\'text-leaf-700 font-bold text-sm\\\'>已加入購物車！</span></div>\'" class="w-full bg-leaf-600 hover:bg-leaf-700 text-white py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-leaf-200 flex items-center justify-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>加入購物車</button>';
  document.getElementById('productModal').classList.remove('hidden');
}

document.getElementById('productModal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.add('hidden');
});
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
