INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '13b32c92-1110-409d-9112-9a91e40396f7',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>閱讀角 BookNook</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { book: { 50:'#fffbf0',100:'#fef3cd',200:'#fde68a',300:'#fcd34d',400:'#f59e0b',500:'#d97706',600:'#b45309',700:'#92400e',800:'#78350f',900:'#451a03' }, cream: { 50:'#fffdf7',100:'#fffbf0',200:'#fef7e0' } } } } }
</script>
<style>
body { font-family: 'DM Sans', sans-serif; background: #fffbf0; scroll-behavior: smooth; }
.serif { font-family: 'Merriweather', serif; }
.book-card { transition: all 0.3s; cursor: pointer; }
.book-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(146,64,14,0.12); }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.35s ease; }
.faq-answer.open { max-height: 300px; }
.category-btn { transition: all 0.2s; }
.category-btn.active { background: #92400e; color: white; border-color: #92400e; }
.plan-card { transition: all 0.3s; }
.plan-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(146,64,14,0.1); }
.collection-card { transition: all 0.3s; }
.collection-card:hover { transform: scale(1.02); }
.preorder-card { transition: all 0.3s; }
.preorder-card:hover { box-shadow: 0 8px 24px rgba(146,64,14,0.1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.fade-in { animation: fadeIn 0.3s ease; }
</style>
</head>
<body>

<!-- Sticky Nav -->
<nav class="sticky top-0 z-40 bg-cream-100/90 backdrop-blur-md border-b border-book-200/50">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2">
      <span class="text-xl">📚</span>
      <span class="serif text-lg font-bold text-book-700">閱讀角</span>
      <span class="text-[10px] text-book-500 font-medium tracking-wider">BOOKNOOK</span>
    </div>
    <div class="flex items-center gap-5 text-sm text-gray-500">
      <a onclick="document.getElementById('recommend').scrollIntoView({behavior:'smooth'})" class="hover:text-book-700 transition cursor-pointer">本月推薦</a>
      <a onclick="document.getElementById('picks').scrollIntoView({behavior:'smooth'})" class="hover:text-book-700 transition cursor-pointer">編輯精選</a>
      <a onclick="document.getElementById('collections').scrollIntoView({behavior:'smooth'})" class="hover:text-book-700 transition cursor-pointer">主題企劃</a>
      <a onclick="document.getElementById('faq').scrollIntoView({behavior:'smooth'})" class="hover:text-book-700 transition cursor-pointer">常見問題</a>
      <div class="flex items-center gap-3 ml-1">
        <div class="relative">
          <svg class="w-[18px] h-[18px] text-gray-400 hover:text-book-700 transition cursor-pointer" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        </div>
        <div class="relative cursor-pointer">
          <svg class="w-[18px] h-[18px] text-gray-400 hover:text-book-700 transition" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
          <span id="cartBadge" class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-book-700 text-white text-[9px] rounded-full flex items-center justify-center font-bold hidden">0</span>
        </div>
      </div>
    </div>
  </div>
</nav>

<!-- Book Detail Modal -->
<div id="bookModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden fade-in">
    <button onclick="closeBookModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl z-10 cursor-pointer">&times;</button>
    <div class="flex">
      <div id="modalCover" class="w-44 shrink-0 flex items-center justify-center text-6xl"></div>
      <div class="p-6 flex-1">
        <div id="modalCategory" class="text-[10px] font-bold text-book-600 uppercase tracking-wider mb-1"></div>
        <h3 id="modalTitle" class="serif text-xl font-bold text-gray-800 mb-1"></h3>
        <div id="modalAuthor" class="text-sm text-gray-400 mb-3"></div>
        <div id="modalRating" class="flex items-center gap-1 text-yellow-400 text-xs mb-3"></div>
        <p id="modalSynopsis" class="text-xs text-gray-500 leading-relaxed mb-4"></p>
        <div class="flex items-center justify-between">
          <div id="modalPrice" class="text-book-700 font-bold text-lg"></div>
          <button onclick="addToCartFromModal()" id="modalCartBtn" class="bg-book-700 hover:bg-book-800 text-white px-5 py-2 rounded-full text-sm font-medium transition cursor-pointer">加入購物車</button>
        </div>
        <div id="modalSuccess" class="hidden mt-3 text-center py-2 bg-green-50 rounded-lg text-green-700 text-sm font-medium fade-in">
          &#10003; 已加入購物車！
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Hero -->
<section class="py-20 bg-gradient-to-br from-cream-100 via-amber-50 to-orange-50 relative overflow-hidden">
  <div class="absolute right-0 top-0 w-96 h-96 bg-book-200/20 rounded-full blur-[120px]"></div>
  <div class="absolute left-10 bottom-0 w-64 h-64 bg-amber-200/20 rounded-full blur-[80px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-14 relative">
    <div class="flex-1">
      <span class="inline-block text-xs bg-book-700 text-white px-4 py-1.5 rounded-full font-medium mb-5">&#128214; 獨立書店精選</span>
      <h1 class="serif text-4xl font-black text-gray-800 leading-snug mb-4">在文字裡<br>遇見更好的自己</h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-md">從經典文學到當代暢銷，從深度人文到生活美學。閱讀角為你嚴選每一本值得翻開的書，讓閱讀成為日常最美的風景。</p>
      <div class="flex gap-3">
        <button onclick="document.getElementById('recommend').scrollIntoView({behavior:'smooth'})" class="bg-book-700 hover:bg-book-800 text-white px-8 py-3 rounded-full font-medium transition shadow-lg shadow-book-200 cursor-pointer">探索書單</button>
        <button onclick="document.getElementById('membership').scrollIntoView({behavior:'smooth'})" class="border border-book-400 text-book-700 hover:bg-book-50 px-8 py-3 rounded-full font-medium transition cursor-pointer">加入會員</button>
      </div>
    </div>
    <div class="flex items-end gap-2">
      <div class="w-28 h-40 rounded-lg bg-gradient-to-b from-rose-300 to-rose-500 flex items-center justify-center text-4xl shadow-lg -rotate-6 hover:rotate-0 transition-transform cursor-pointer">&#128213;</div>
      <div class="w-28 h-48 rounded-lg bg-gradient-to-b from-sky-300 to-sky-500 flex items-center justify-center text-4xl shadow-lg rotate-2 hover:rotate-0 transition-transform cursor-pointer">&#128216;</div>
      <div class="w-28 h-52 rounded-lg bg-gradient-to-b from-emerald-300 to-emerald-500 flex items-center justify-center text-4xl shadow-xl -rotate-1 hover:rotate-0 transition-transform cursor-pointer">&#128215;</div>
      <div class="w-28 h-44 rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 flex items-center justify-center text-4xl shadow-lg rotate-4 hover:rotate-0 transition-transform cursor-pointer">&#128217;</div>
    </div>
  </div>
</section>

<!-- Stats -->
<section class="bg-white border-y border-book-100">
  <div class="max-w-6xl mx-auto px-6 py-6 grid grid-cols-4 gap-6 text-center">
    <div><div class="text-2xl font-bold text-book-700">10,000+</div><div class="text-xs text-gray-400 mt-0.5">精選書目</div></div>
    <div><div class="text-2xl font-bold text-book-700">500+</div><div class="text-xs text-gray-400 mt-0.5">合作作者</div></div>
    <div><div class="text-2xl font-bold text-book-700">4.8 &#11088;</div><div class="text-xs text-gray-400 mt-0.5">讀者評分</div></div>
    <div><div class="text-2xl font-bold text-book-700">$699</div><div class="text-xs text-gray-400 mt-0.5">免運門檻</div></div>
  </div>
</section>

<!-- Search + Category Filter + 本月推薦 -->
<section id="recommend" class="max-w-6xl mx-auto px-6 py-14">
  <div class="flex items-center justify-between mb-3">
    <h2 class="serif text-2xl font-bold text-gray-800">&#127775; 本月推薦</h2>
    <div class="relative">
      <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input id="searchInput" type="text" placeholder="搜尋書名..." oninput="searchBooks()" class="pl-9 pr-4 py-2 border border-book-200 rounded-full text-sm w-52 focus:outline-none focus:border-book-500 bg-white">
    </div>
  </div>
  <div class="flex gap-2 mb-8">
    <button onclick="filterBooks('all')" class="category-btn active text-xs px-5 py-1.5 rounded-full border border-book-200 font-medium cursor-pointer">全部</button>
    <button onclick="filterBooks('literature')" class="category-btn text-xs px-5 py-1.5 rounded-full border border-book-200 text-book-700 font-medium cursor-pointer">文學小說</button>
    <button onclick="filterBooks('business')" class="category-btn text-xs px-5 py-1.5 rounded-full border border-book-200 text-book-700 font-medium cursor-pointer">商業理財</button>
    <button onclick="filterBooks('psychology')" class="category-btn text-xs px-5 py-1.5 rounded-full border border-book-200 text-book-700 font-medium cursor-pointer">心理勵志</button>
    <button onclick="filterBooks('lifestyle')" class="category-btn text-xs px-5 py-1.5 rounded-full border border-book-200 text-book-700 font-medium cursor-pointer">生活風格</button>
  </div>
  <div class="grid grid-cols-4 gap-5" id="bookGrid">
    <!-- Book 1 -->
    <div class="book-card bg-white rounded-2xl overflow-hidden border border-book-100" data-category="literature" data-title="月光下的房間" data-author="村上春樹" data-price="NT$ 380" data-rating="&#11088;&#11088;&#11088;&#11088;&#11088;" data-synopsis="在一個失去時間感的房間裡，三個陌生人的命運交織在一起。村上春樹以其獨特的魔幻寫實風格，探索孤獨、記憶與人際連結的本質。" data-emoji="&#128214;" data-bg="from-indigo-200 to-indigo-400" data-cat-label="文學小說" onclick="openBookModal(this)">
      <div class="h-48 rounded-t-2xl bg-gradient-to-b from-indigo-200 to-indigo-400 flex items-center justify-center text-5xl relative">
        <span>&#128214;</span>
        <span class="absolute top-2.5 left-2.5 text-[10px] bg-white/90 text-book-700 px-2 py-0.5 rounded-full font-bold">新書</span>
      </div>
      <div class="p-4">
        <h3 class="serif font-bold text-gray-800 text-sm">月光下的房間</h3>
        <div class="text-xs text-gray-400 mt-0.5">村上春樹</div>
        <div class="flex items-center gap-1 text-yellow-400 text-[10px] mt-1.5">&#11088;&#11088;&#11088;&#11088;&#11088;</div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-book-700 font-bold text-sm">NT$ 380</span>
          <button onclick="event.stopPropagation();addToCart('月光下的房間')" class="text-[10px] bg-book-50 text-book-700 px-3 py-1 rounded-full font-medium hover:bg-book-100 transition cursor-pointer">加入購物車</button>
        </div>
      </div>
    </div>
    <!-- Book 2 -->
    <div class="book-card bg-white rounded-2xl overflow-hidden border border-book-100" data-category="literature" data-title="正常人" data-author="Sally Rooney" data-price="NT$ 350" data-rating="&#11088;&#11088;&#11088;&#11088;&#11088;" data-synopsis="康諾和瑪麗安從高中到大學，在愛與不安之間反覆靠近又離開。這是一個關於階級、親密關係和自我認同的動人故事。" data-emoji="&#128213;" data-bg="from-rose-200 to-rose-400" data-cat-label="文學小說" onclick="openBookModal(this)">
      <div class="h-48 rounded-t-2xl bg-gradient-to-b from-rose-200 to-rose-400 flex items-center justify-center text-5xl">
        <span>&#128213;</span>
      </div>
      <div class="p-4">
        <h3 class="serif font-bold text-gray-800 text-sm">正常人</h3>
        <div class="text-xs text-gray-400 mt-0.5">Sally Rooney</div>
        <div class="flex items-center gap-1 text-yellow-400 text-[10px] mt-1.5">&#11088;&#11088;&#11088;&#11088;&#11088;</div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-book-700 font-bold text-sm">NT$ 350</span>
          <button onclick="event.stopPropagation();addToCart('正常人')" class="text-[10px] bg-book-50 text-book-700 px-3 py-1 rounded-full font-medium hover:bg-book-100 transition cursor-pointer">加入購物車</button>
        </div>
      </div>
    </div>
    <!-- Book 3 -->
    <div class="book-card bg-white rounded-2xl overflow-hidden border border-book-100" data-category="business" data-title="從零到一" data-author="Peter Thiel" data-price="NT$ 420" data-rating="&#11088;&#11088;&#11088;&#11088;" data-synopsis="PayPal 創辦人彼得．提爾分享獨到的創業哲學：真正改變世界的不是競爭，而是創造全新的市場。矽谷創業者必讀經典。" data-emoji="&#128216;" data-bg="from-emerald-200 to-emerald-400" data-cat-label="商業理財" onclick="openBookModal(this)">
      <div class="h-48 rounded-t-2xl bg-gradient-to-b from-emerald-200 to-emerald-400 flex items-center justify-center text-5xl">
        <span>&#128216;</span>
      </div>
      <div class="p-4">
        <h3 class="serif font-bold text-gray-800 text-sm">從零到一</h3>
        <div class="text-xs text-gray-400 mt-0.5">Peter Thiel</div>
        <div class="flex items-center gap-1 text-yellow-400 text-[10px] mt-1.5">&#11088;&#11088;&#11088;&#11088;</div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-book-700 font-bold text-sm">NT$ 420</span>
          <button onclick="event.stopPropagation();addToCart('從零到一')" class="text-[10px] bg-book-50 text-book-700 px-3 py-1 rounded-full font-medium hover:bg-book-100 transition cursor-pointer">加入購物車</button>
        </div>
      </div>
    </div>
    <!-- Book 4 -->
    <div class="book-card bg-white rounded-2xl overflow-hidden border border-book-100" data-category="psychology" data-title="被討厭的勇氣" data-author="岸見一郎" data-price="NT$ 300" data-rating="&#11088;&#11088;&#11088;&#11088;&#11088;" data-synopsis="以阿德勒心理學為基礎，透過哲學家與年輕人的對話，闡述「所有煩惱都是人際關係的煩惱」，學會放下對他人認同的執著。" data-emoji="&#128218;" data-bg="from-violet-200 to-violet-400" data-cat-label="心理勵志" onclick="openBookModal(this)">
      <div class="h-48 rounded-t-2xl bg-gradient-to-b from-violet-200 to-violet-400 flex items-center justify-center text-5xl">
        <span>&#128218;</span>
      </div>
      <div class="p-4">
        <h3 class="serif font-bold text-gray-800 text-sm">被討厭的勇氣</h3>
        <div class="text-xs text-gray-400 mt-0.5">岸見一郎</div>
        <div class="flex items-center gap-1 text-yellow-400 text-[10px] mt-1.5">&#11088;&#11088;&#11088;&#11088;&#11088;</div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-book-700 font-bold text-sm">NT$ 300</span>
          <button onclick="event.stopPropagation();addToCart('被討厭的勇氣')" class="text-[10px] bg-book-50 text-book-700 px-3 py-1 rounded-full font-medium hover:bg-book-100 transition cursor-pointer">加入購物車</button>
        </div>
      </div>
    </div>
    <!-- Book 5 -->
    <div class="book-card bg-white rounded-2xl overflow-hidden border border-book-100" data-category="lifestyle" data-title="獨居生活提案" data-author="開始整理吧" data-price="NT$ 340" data-rating="&#11088;&#11088;&#11088;&#11088;" data-synopsis="給所有享受獨處的人：如何打造舒適的一人空間、為自己煮一頓好飯、在安靜中找到生活的節奏與樂趣。" data-emoji="&#128215;" data-bg="from-teal-200 to-teal-400" data-cat-label="生活風格" onclick="openBookModal(this)">
      <div class="h-48 rounded-t-2xl bg-gradient-to-b from-teal-200 to-teal-400 flex items-center justify-center text-5xl">
        <span>&#128215;</span>
      </div>
      <div class="p-4">
        <h3 class="serif font-bold text-gray-800 text-sm">獨居生活提案</h3>
        <div class="text-xs text-gray-400 mt-0.5">開始整理吧</div>
        <div class="flex items-center gap-1 text-yellow-400 text-[10px] mt-1.5">&#11088;&#11088;&#11088;&#11088;</div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-book-700 font-bold text-sm">NT$ 340</span>
          <button onclick="event.stopPropagation();addToCart('獨居生活提案')" class="text-[10px] bg-book-50 text-book-700 px-3 py-1 rounded-full font-medium hover:bg-book-100 transition cursor-pointer">加入購物車</button>
        </div>
      </div>
    </div>
    <!-- Book 6 -->
    <div class="book-card bg-white rounded-2xl overflow-hidden border border-book-100" data-category="business" data-title="原子習慣" data-author="James Clear" data-price="NT$ 330" data-rating="&#11088;&#11088;&#11088;&#11088;&#11088;" data-synopsis="微小改變帶來巨大成就。作者以科學研究為基礎，提出四大習慣法則，讓你每天進步 1%，一年後將進步 37 倍。" data-emoji="&#128217;" data-bg="from-amber-200 to-amber-400" data-cat-label="商業理財" onclick="openBookModal(this)">
      <div class="h-48 rounded-t-2xl bg-gradient-to-b from-amber-200 to-amber-400 flex items-center justify-center text-5xl">
        <span>&#128217;</span>
      </div>
      <div class="p-4">
        <h3 class="serif font-bold text-gray-800 text-sm">原子習慣</h3>
        <div class="text-xs text-gray-400 mt-0.5">James Clear</div>
        <div class="flex items-center gap-1 text-yellow-400 text-[10px] mt-1.5">&#11088;&#11088;&#11088;&#11088;&#11088;</div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-book-700 font-bold text-sm">NT$ 330</span>
          <button onclick="event.stopPropagation();addToCart('原子習慣')" class="text-[10px] bg-book-50 text-book-700 px-3 py-1 rounded-full font-medium hover:bg-book-100 transition cursor-pointer">加入購物車</button>
        </div>
      </div>
    </div>
    <!-- Book 7 -->
    <div class="book-card bg-white rounded-2xl overflow-hidden border border-book-100" data-category="psychology" data-title="薩提爾的對話練習" data-author="李崇建" data-price="NT$ 360" data-rating="&#11088;&#11088;&#11088;&#11088;" data-synopsis="以薩提爾家族治療為核心，學習如何在對話中覺察自己的冰山、回應他人的情緒，建立真正有溫度的人際關係。" data-emoji="&#128214;" data-bg="from-pink-200 to-pink-400" data-cat-label="心理勵志" onclick="openBookModal(this)">
      <div class="h-48 rounded-t-2xl bg-gradient-to-b from-pink-200 to-pink-400 flex items-center justify-center text-5xl">
        <span>&#128214;</span>
      </div>
      <div class="p-4">
        <h3 class="serif font-bold text-gray-800 text-sm">薩提爾的對話練習</h3>
        <div class="text-xs text-gray-400 mt-0.5">李崇建</div>
        <div class="flex items-center gap-1 text-yellow-400 text-[10px] mt-1.5">&#11088;&#11088;&#11088;&#11088;</div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-book-700 font-bold text-sm">NT$ 360</span>
          <button onclick="event.stopPropagation();addToCart('薩提爾的對話練習')" class="text-[10px] bg-book-50 text-book-700 px-3 py-1 rounded-full font-medium hover:bg-book-100 transition cursor-pointer">加入購物車</button>
        </div>
      </div>
    </div>
    <!-- Book 8 -->
    <div class="book-card bg-white rounded-2xl overflow-hidden border border-book-100" data-category="lifestyle" data-title="日日減醣瘦身餐" data-author="圈媽" data-price="NT$ 380" data-rating="&#11088;&#11088;&#11088;&#11088;&#11088;" data-synopsis="超過 100 道低醣美味食譜，每一餐都兼顧營養與口感。不需要餓肚子，用聰明的飲食選擇輕鬆維持體態。" data-emoji="&#128216;" data-bg="from-lime-200 to-lime-400" data-cat-label="生活風格" onclick="openBookModal(this)">
      <div class="h-48 rounded-t-2xl bg-gradient-to-b from-lime-200 to-lime-400 flex items-center justify-center text-5xl relative">
        <span>&#128216;</span>
        <span class="absolute top-2.5 left-2.5 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">熱銷</span>
      </div>
      <div class="p-4">
        <h3 class="serif font-bold text-gray-800 text-sm">日日減醣瘦身餐</h3>
        <div class="text-xs text-gray-400 mt-0.5">圈媽</div>
        <div class="flex items-center gap-1 text-yellow-400 text-[10px] mt-1.5">&#11088;&#11088;&#11088;&#11088;&#11088;</div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-book-700 font-bold text-sm">NT$ 380</span>
          <button onclick="event.stopPropagation();addToCart('日日減醣瘦身餐')" class="text-[10px] bg-book-50 text-book-700 px-3 py-1 rounded-full font-medium hover:bg-book-100 transition cursor-pointer">加入購物車</button>
        </div>
      </div>
    </div>
  </div>
  <div id="noResults" class="hidden text-center py-10 text-gray-400 text-sm">找不到符合的書籍，請試試其他關鍵字</div>
</section>

<!-- 編輯精選 -->
<section id="picks" class="bg-gradient-to-r from-book-700 to-book-800 text-white py-16">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold mb-2">&#9997;&#65039; 編輯精選</h2>
    <p class="text-book-200/70 text-sm mb-8">三本我們讀了之後想推薦給全世界的書</p>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur hover:bg-white/15 transition">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-20 rounded-lg bg-gradient-to-b from-sky-300 to-sky-500 flex items-center justify-center text-3xl shrink-0">&#128213;</div>
          <div>
            <h3 class="font-bold text-lg">人類大歷史</h3>
            <div class="text-sm text-book-200/70">哈拉瑞 Yuval Harari</div>
          </div>
        </div>
        <p class="text-sm text-white/80 leading-relaxed mb-3">從認知革命到人工智慧，哈拉瑞用宏觀的視角重新詮釋人類七萬年的歷史。這不只是一本歷史書，更是一面讓你重新認識自己物種的鏡子。讀完之後，你會用完全不同的眼光看待日常生活中的每一件事。</p>
        <div class="flex items-center justify-between">
          <span class="text-book-200 font-bold">NT$ 450</span>
          <span class="text-xs text-book-200/50">社會人文 / 624 頁</span>
        </div>
      </div>
      <div class="bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur hover:bg-white/15 transition">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-20 rounded-lg bg-gradient-to-b from-violet-300 to-violet-500 flex items-center justify-center text-3xl shrink-0">&#128218;</div>
          <div>
            <h3 class="font-bold text-lg">素食者</h3>
            <div class="text-sm text-book-200/70">韓江</div>
          </div>
        </div>
        <p class="text-sm text-white/80 leading-relaxed mb-3">諾貝爾文學獎得主之作。一個女人決定不再吃肉，這個看似微小的選擇卻撕裂了她與家庭、社會的所有關係。韓江以冷峻而詩意的筆觸，探問身體自主與社會暴力的邊界。讀來令人不寒而慄，又無法放下。</p>
        <div class="flex items-center justify-between">
          <span class="text-book-200 font-bold">NT$ 320</span>
          <span class="text-xs text-book-200/50">文學小說 / 240 頁</span>
        </div>
      </div>
      <div class="bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur hover:bg-white/15 transition">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-20 rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 flex items-center justify-center text-3xl shrink-0">&#128217;</div>
          <div>
            <h3 class="font-bold text-lg">也許你該找人聊聊</h3>
            <div class="text-sm text-book-200/70">蘿蕊・乖乖里乙</div>
          </div>
        </div>
        <p class="text-sm text-white/80 leading-relaxed mb-3">一位心理治療師的真實故事：她的病人各有各的痛苦，而她自己也需要另一位治療師。這本書讓你笑著笑著就哭了，然後又在淚水中找到力量。關於脆弱、勇氣，以及我們都需要被聽見的渴望。</p>
        <div class="flex items-center justify-between">
          <span class="text-book-200 font-bold">NT$ 450</span>
          <span class="text-xs text-book-200/50">心理勵志 / 448 頁</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 閱讀主題企劃 -->
<section id="collections" class="max-w-6xl mx-auto px-6 py-14">
  <h2 class="serif text-2xl font-bold text-gray-800 mb-2 text-center">&#128218; 閱讀主題企劃</h2>
  <p class="text-sm text-gray-400 text-center mb-8">跟著主題走，發現意想不到的好書</p>
  <div class="grid grid-cols-4 gap-5">
    <div class="collection-card bg-gradient-to-br from-pink-50 to-rose-100 rounded-2xl p-6 border border-pink-100 cursor-pointer">
      <div class="text-3xl mb-3">&#127800;</div>
      <h3 class="serif font-bold text-gray-800 mb-2">春日書單</h3>
      <p class="text-xs text-gray-500 leading-relaxed mb-3">適合在陽光下翻閱的輕盈之作，讓文字和春風一起拂過心頭。</p>
      <div class="text-[10px] text-rose-600 font-bold">12 本精選 &#8594;</div>
    </div>
    <div class="collection-card bg-gradient-to-br from-blue-50 to-sky-100 rounded-2xl p-6 border border-blue-100 cursor-pointer">
      <div class="text-3xl mb-3">&#128188;</div>
      <h3 class="serif font-bold text-gray-800 mb-2">職場進修</h3>
      <p class="text-xs text-gray-500 leading-relaxed mb-3">從時間管理到領導力，幫你在職場上找到突破口的實用指南。</p>
      <div class="text-[10px] text-sky-600 font-bold">15 本精選 &#8594;</div>
    </div>
    <div class="collection-card bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-6 border border-purple-100 cursor-pointer">
      <div class="text-3xl mb-3">&#128156;</div>
      <h3 class="serif font-bold text-gray-800 mb-2">心靈療癒</h3>
      <p class="text-xs text-gray-500 leading-relaxed mb-3">當世界太嘈雜，讓這些書成為你的安靜角落，溫柔地陪伴你。</p>
      <div class="text-[10px] text-violet-600 font-bold">10 本精選 &#8594;</div>
    </div>
    <div class="collection-card bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-100 cursor-pointer">
      <div class="text-3xl mb-3">&#128106;</div>
      <h3 class="serif font-bold text-gray-800 mb-2">親子共讀</h3>
      <p class="text-xs text-gray-500 leading-relaxed mb-3">和孩子一起翻開故事書，在共讀中建立最珍貴的親密時光。</p>
      <div class="text-[10px] text-emerald-600 font-bold">18 本精選 &#8594;</div>
    </div>
  </div>
</section>

<!-- 讀者書評 -->
<section class="bg-gradient-to-b from-cream-200 to-cream-100 py-14">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold text-gray-800 mb-8 text-center">&#128172; 讀者書評</h2>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-white rounded-2xl p-6 border border-book-100 shadow-sm">
        <div class="flex items-center gap-1 text-yellow-400 text-sm mb-3">&#11088;&#11088;&#11088;&#11088;&#11088;</div>
        <p class="text-sm text-gray-600 italic leading-relaxed mb-4">"在閱讀角買書是一種享受。每次收到包裹，書都用牛皮紙細心包裝，還附上一張手寫書籤。感受到滿滿的溫度和對書的尊重。"</p>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center text-sm">A</div>
          <div>
            <div class="text-sm font-bold text-gray-800">Amy Chen</div>
            <div class="text-[10px] text-gray-400">購買 27 本 &#183; 會員 2 年</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-6 border border-book-100 shadow-sm">
        <div class="flex items-center gap-1 text-yellow-400 text-sm mb-3">&#11088;&#11088;&#11088;&#11088;&#11088;</div>
        <p class="text-sm text-gray-600 italic leading-relaxed mb-4">"本來只是隨便逛逛，結果被編輯精選打動，一口氣買了三本。每一本都沒讓我失望，選書品味真的很好！推薦給所有愛書人。"</p>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-sky-200 to-sky-300 flex items-center justify-center text-sm">K</div>
          <div>
            <div class="text-sm font-bold text-gray-800">Kevin Liu</div>
            <div class="text-[10px] text-gray-400">購買 15 本 &#183; 會員 1 年</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-6 border border-book-100 shadow-sm">
        <div class="flex items-center gap-1 text-yellow-400 text-sm mb-3">&#11088;&#11088;&#11088;&#11088;</div>
        <p class="text-sm text-gray-600 italic leading-relaxed mb-4">"很喜歡閱讀角的主題書單企劃，每次跟著書單買都能發現很多以前沒注意到的好書。客服回覆也很快，退換貨流程很順暢。"</p>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-rose-200 to-rose-300 flex items-center justify-center text-sm">M</div>
          <div>
            <div class="text-sm font-bold text-gray-800">Mia Wang</div>
            <div class="text-[10px] text-gray-400">購買 42 本 &#183; 會員 3 年</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 新書預購 -->
<section class="max-w-6xl mx-auto px-6 py-14">
  <h2 class="serif text-2xl font-bold text-gray-800 mb-2 text-center">&#128276; 新書預購</h2>
  <p class="text-sm text-gray-400 text-center mb-8">搶先預訂，上市第一天送到你手中</p>
  <div class="grid grid-cols-3 gap-6">
    <div class="preorder-card bg-white rounded-2xl overflow-hidden border border-book-100">
      <div class="h-40 bg-gradient-to-br from-cyan-100 to-sky-200 flex items-center justify-center text-5xl">&#128214;</div>
      <div class="p-5">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] bg-sky-100 text-sky-700 px-2.5 py-0.5 rounded-full font-bold">3/15 上市</span>
          <span class="text-[10px] text-gray-400">預購價 85 折</span>
        </div>
        <h3 class="serif font-bold text-gray-800 mb-1">時間的秩序</h3>
        <div class="text-xs text-gray-400 mb-2">Carlo Rovelli</div>
        <p class="text-xs text-gray-500 leading-relaxed mb-3">物理學家用詩人的語言告訴你：時間並不存在。這本書將徹底顛覆你對現實的理解。</p>
        <div class="flex items-center justify-between">
          <div><span class="text-book-700 font-bold">NT$ 306</span><span class="text-xs text-gray-400 line-through ml-1.5">$360</span></div>
          <button onclick="addToCart('時間的秩序')" class="text-xs bg-book-700 text-white px-4 py-1.5 rounded-full font-medium hover:bg-book-800 transition cursor-pointer">預購</button>
        </div>
      </div>
    </div>
    <div class="preorder-card bg-white rounded-2xl overflow-hidden border border-book-100">
      <div class="h-40 bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center text-5xl">&#128213;</div>
      <div class="p-5">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-bold">3/28 上市</span>
          <span class="text-[10px] text-gray-400">預購價 85 折</span>
        </div>
        <h3 class="serif font-bold text-gray-800 mb-1">解憂雜貨店（全新典藏版）</h3>
        <div class="text-xs text-gray-400 mb-2">東野圭吾</div>
        <p class="text-xs text-gray-500 leading-relaxed mb-3">經典名作全新裝幀，附贈獨家作者後記。在煩惱無處訴說的夜裡，推開那扇門就對了。</p>
        <div class="flex items-center justify-between">
          <div><span class="text-book-700 font-bold">NT$ 298</span><span class="text-xs text-gray-400 line-through ml-1.5">$350</span></div>
          <button onclick="addToCart('解憂雜貨店')" class="text-xs bg-book-700 text-white px-4 py-1.5 rounded-full font-medium hover:bg-book-800 transition cursor-pointer">預購</button>
        </div>
      </div>
    </div>
    <div class="preorder-card bg-white rounded-2xl overflow-hidden border border-book-100">
      <div class="h-40 bg-gradient-to-br from-rose-100 to-pink-200 flex items-center justify-center text-5xl">&#128218;</div>
      <div class="p-5">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-bold">4/10 上市</span>
          <span class="text-[10px] text-gray-400">預購價 85 折</span>
        </div>
        <h3 class="serif font-bold text-gray-800 mb-1">內在原力</h3>
        <div class="text-xs text-gray-400 mb-2">愛瑞克</div>
        <p class="text-xs text-gray-500 leading-relaxed mb-3">FIRE 族必讀！重新定義成功與自由，找到屬於你的內在驅動力，活出不被定義的人生。</p>
        <div class="flex items-center justify-between">
          <div><span class="text-book-700 font-bold">NT$ 323</span><span class="text-xs text-gray-400 line-through ml-1.5">$380</span></div>
          <button onclick="addToCart('內在原力')" class="text-xs bg-book-700 text-white px-4 py-1.5 rounded-full font-medium hover:bg-book-800 transition cursor-pointer">預購</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 會員方案 -->
<section id="membership" class="bg-gradient-to-b from-amber-50 to-cream-100 py-14">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold text-gray-800 mb-2 text-center">&#128081; 會員方案</h2>
    <p class="text-sm text-gray-400 text-center mb-8">選擇適合你的閱讀計畫，享受更多專屬優惠</p>
    <div class="grid grid-cols-3 gap-6">
      <div class="plan-card bg-white rounded-2xl p-6 border border-book-100 text-center">
        <div class="text-3xl mb-3">&#128214;</div>
        <h3 class="serif font-bold text-gray-800 text-lg mb-1">書蟲方案</h3>
        <div class="text-xs text-gray-400 mb-4">適合偶爾閱讀的你</div>
        <div class="text-3xl font-bold text-book-700 mb-1">免費</div>
        <div class="text-xs text-gray-400 mb-5">永久</div>
        <ul class="text-xs text-gray-500 space-y-2 text-left mb-6">
          <li class="flex items-center gap-2"><span class="text-green-500">&#10003;</span>每月電子報推薦</li>
          <li class="flex items-center gap-2"><span class="text-green-500">&#10003;</span>生日禮金 $50</li>
          <li class="flex items-center gap-2"><span class="text-green-500">&#10003;</span>$699 免運</li>
          <li class="flex items-center gap-2"><span class="text-gray-300">&#10005;</span><span class="text-gray-400">會員折扣</span></li>
          <li class="flex items-center gap-2"><span class="text-gray-300">&#10005;</span><span class="text-gray-400">搶先預購</span></li>
        </ul>
        <button class="w-full border border-book-200 text-book-700 py-2.5 rounded-full text-sm font-medium hover:bg-book-50 transition cursor-pointer">免費加入</button>
      </div>
      <div class="plan-card bg-white rounded-2xl p-6 border-2 border-book-700 text-center relative shadow-lg">
        <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-book-700 text-white text-[10px] px-4 py-1 rounded-full font-bold">最受歡迎</span>
        <div class="text-3xl mb-3">&#128218;</div>
        <h3 class="serif font-bold text-gray-800 text-lg mb-1">閱讀家方案</h3>
        <div class="text-xs text-gray-400 mb-4">一個月兩本書的你</div>
        <div class="text-3xl font-bold text-book-700 mb-1">$199<span class="text-sm font-normal text-gray-400">/月</span></div>
        <div class="text-xs text-gray-400 mb-5">年繳 $1,990（省 $398）</div>
        <ul class="text-xs text-gray-500 space-y-2 text-left mb-6">
          <li class="flex items-center gap-2"><span class="text-green-500">&#10003;</span>全站 95 折</li>
          <li class="flex items-center gap-2"><span class="text-green-500">&#10003;</span>生日禮金 $200</li>
          <li class="flex items-center gap-2"><span class="text-green-500">&#10003;</span>$499 免運</li>
          <li class="flex items-center gap-2"><span class="text-green-500">&#10003;</span>新書搶先預購</li>
          <li class="flex items-center gap-2"><span class="text-green-500">&#10003;</span>每月選書驚喜盒</li>
        </ul>
        <button class="w-full bg-book-700 text-white py-2.5 rounded-full text-sm font-medium hover:bg-book-800 transition cursor-pointer">立即訂閱</button>
      </div>
      <div class="plan-card bg-white rounded-2xl p-6 border border-book-100 text-center">
        <div class="text-3xl mb-3">&#127942;</div>
        <h3 class="serif font-bold text-gray-800 text-lg mb-1">藏書家方案</h3>
        <div class="text-xs text-gray-400 mb-4">重度書癮患者專屬</div>
        <div class="text-3xl font-bold text-book-700 mb-1">$399<span class="text-sm font-normal text-gray-400">/月</span></div>
        <div class="text-xs text-gray-400 mb-5">年繳 $3,990（省 $798）</div>
        <ul class="text-xs text-gray-500 space-y-2 text-left mb-6">
          <li class="flex items-center gap-2"><span class="text-green-500">&#10003;</span>全站 9 折</li>
          <li class="flex items-center gap-2"><span class="text-green-500">&#10003;</span>生日禮金 $500</li>
          <li class="flex items-center gap-2"><span class="text-green-500">&#10003;</span>全年免運</li>
          <li class="flex items-center gap-2"><span class="text-green-500">&#10003;</span>限量簽名版優先</li>
          <li class="flex items-center gap-2"><span class="text-green-500">&#10003;</span>作者見面會邀請</li>
        </ul>
        <button class="w-full border border-book-700 text-book-700 py-2.5 rounded-full text-sm font-medium hover:bg-book-50 transition cursor-pointer">立即訂閱</button>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section id="faq" class="max-w-6xl mx-auto px-6 py-14">
  <h2 class="serif text-2xl font-bold text-gray-800 mb-8 text-center">&#10067; 常見問題</h2>
  <div class="max-w-2xl mx-auto space-y-3">
    <div class="bg-white rounded-xl border border-book-100 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-gray-800 hover:bg-book-50 transition cursor-pointer">
        <span>訂單多久會出貨？可以指定到貨日嗎？</span>
        <span class="text-book-500 text-lg transition-transform duration-200">+</span>
      </button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500 leading-relaxed">一般書籍下單後 1-2 個工作天出貨，預購書會在上市日當天寄出。可在備註欄指定到貨日（限平日），我們會盡量配合。急件可選擇「隔日到貨」加價 $60。</div>
    </div>
    <div class="bg-white rounded-xl border border-book-100 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-gray-800 hover:bg-book-50 transition cursor-pointer">
        <span>可以退換貨嗎？有什麼條件？</span>
        <span class="text-book-500 text-lg transition-transform duration-200">+</span>
      </button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500 leading-relaxed">收到商品 7 天內可申請退換貨，書籍需保持全新未拆封狀態（含原始包膜）。退貨運費由我們負擔。如收到瑕疵品（如印刷錯誤、缺頁），請拍照寄至客服信箱，我們會立即補寄新書。</div>
    </div>
    <div class="bg-white rounded-xl border border-book-100 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-gray-800 hover:bg-book-50 transition cursor-pointer">
        <span>會員方案可以隨時取消嗎？</span>
        <span class="text-book-500 text-lg transition-transform duration-200">+</span>
      </button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500 leading-relaxed">可以！月繳方案隨時可取消，取消後當月權益仍有效至月底。年繳方案若在 14 天內取消可全額退款，超過 14 天則依剩餘月份按比例退費。取消後保留免費會員身份。</div>
    </div>
    <div class="bg-white rounded-xl border border-book-100 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-gray-800 hover:bg-book-50 transition cursor-pointer">
        <span>有提供海外配送嗎？</span>
        <span class="text-book-500 text-lg transition-transform duration-200">+</span>
      </button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500 leading-relaxed">目前提供港澳、日本、新加坡、馬來西亞的國際配送。運費依重量計算（約 $250-$600），通常 7-14 個工作天到貨。訂單滿 $2,000 享國際免運。其他地區請來信詢問。</div>
    </div>
  </div>
</section>

<!-- Shipping Info -->
<section class="bg-white border-y border-book-100 py-10">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-xl font-bold text-gray-800 mb-6 text-center">&#128666; 配送說明</h2>
    <div class="grid grid-cols-4 gap-5">
      <div class="text-center">
        <div class="w-12 h-12 rounded-full bg-book-50 flex items-center justify-center text-xl mx-auto mb-3">&#128230;</div>
        <h4 class="font-bold text-sm text-gray-800 mb-1">快速出貨</h4>
        <p class="text-xs text-gray-400">下單後 1-2 天出貨<br>急件可選隔日到</p>
      </div>
      <div class="text-center">
        <div class="w-12 h-12 rounded-full bg-book-50 flex items-center justify-center text-xl mx-auto mb-3">&#127873;</div>
        <h4 class="font-bold text-sm text-gray-800 mb-1">精美包裝</h4>
        <p class="text-xs text-gray-400">牛皮紙包覆保護<br>附贈手寫書籤</p>
      </div>
      <div class="text-center">
        <div class="w-12 h-12 rounded-full bg-book-50 flex items-center justify-center text-xl mx-auto mb-3">&#128176;</div>
        <h4 class="font-bold text-sm text-gray-800 mb-1">滿額免運</h4>
        <p class="text-xs text-gray-400">一般會員 $699 免運<br>訂閱會員 $499 免運</p>
      </div>
      <div class="text-center">
        <div class="w-12 h-12 rounded-full bg-book-50 flex items-center justify-center text-xl mx-auto mb-3">&#128260;</div>
        <h4 class="font-bold text-sm text-gray-800 mb-1">安心退換</h4>
        <p class="text-xs text-gray-400">7 天鑑賞期<br>瑕疵品免費換新</p>
      </div>
    </div>
  </div>
</section>

<!-- Newsletter CTA -->
<section class="max-w-6xl mx-auto px-6 py-12">
  <div class="bg-gradient-to-r from-book-700 to-book-800 rounded-2xl p-10 text-center text-white relative overflow-hidden">
    <div class="absolute left-8 top-6 text-6xl opacity-10">&#128214;</div>
    <div class="absolute right-8 bottom-6 text-6xl opacity-10">&#128218;</div>
    <div class="relative">
      <div class="text-3xl mb-3">&#128140;</div>
      <h2 class="serif text-2xl font-bold mb-2">每週好書推薦</h2>
      <p class="text-sm text-white/70 mb-6 max-w-md mx-auto">每週三寄送一封，為你精選 3 本好書 + 獨家折扣碼。已有 5,200+ 位讀者訂閱。</p>
      <div class="flex items-center gap-3 max-w-md mx-auto">
        <input type="email" placeholder="your@email.com" class="flex-1 px-5 py-3 rounded-full text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/30">
        <button onclick="subscribeNewsletter(this)" class="bg-white text-book-700 px-6 py-3 rounded-full font-bold text-sm hover:bg-book-50 transition shrink-0 cursor-pointer">免費訂閱</button>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-gray-900 text-gray-400 py-10">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-4 gap-8 mb-8">
      <div>
        <div class="flex items-center gap-2 mb-3"><span class="text-lg">&#128218;</span><span class="serif text-white font-bold">閱讀角</span></div>
        <p class="text-xs text-gray-500 leading-relaxed">在文字裡遇見更好的自己。<br>獨立書店的溫度，線上購書的便利。</p>
      </div>
      <div>
        <h4 class="text-white text-sm font-bold mb-3">購物指南</h4>
        <div class="space-y-2 text-xs">
          <div class="hover:text-book-400 transition cursor-pointer">如何訂購</div>
          <div class="hover:text-book-400 transition cursor-pointer">付款方式</div>
          <div class="hover:text-book-400 transition cursor-pointer">配送說明</div>
          <div class="hover:text-book-400 transition cursor-pointer">退換貨政策</div>
        </div>
      </div>
      <div>
        <h4 class="text-white text-sm font-bold mb-3">關於我們</h4>
        <div class="space-y-2 text-xs">
          <div class="hover:text-book-400 transition cursor-pointer">品牌故事</div>
          <div class="hover:text-book-400 transition cursor-pointer">選書理念</div>
          <div class="hover:text-book-400 transition cursor-pointer">合作提案</div>
          <div class="hover:text-book-400 transition cursor-pointer">徵才資訊</div>
        </div>
      </div>
      <div>
        <h4 class="text-white text-sm font-bold mb-3">聯絡我們</h4>
        <div class="space-y-2 text-xs">
          <div>&#128231; hello@booknook.tw</div>
          <div>&#128222; (02) 2700-8888</div>
          <div>&#128205; 台北市大安區溫州街 18 巷 5 號</div>
          <div class="flex gap-3 mt-2">
            <span class="hover:text-white transition cursor-pointer">Facebook</span>
            <span class="hover:text-white transition cursor-pointer">Instagram</span>
            <span class="hover:text-white transition cursor-pointer">Line</span>
          </div>
        </div>
      </div>
    </div>
    <div class="border-t border-gray-800 pt-6 flex items-center justify-between text-xs text-gray-500">
      <div>&copy; 2026 BookNook 閱讀角 All rights reserved.</div>
      <div class="flex gap-4">
        <span class="hover:text-gray-300 cursor-pointer">隱私權政策</span>
        <span class="hover:text-gray-300 cursor-pointer">服務條款</span>
        <span class="hover:text-gray-300 cursor-pointer">Cookies 設定</span>
      </div>
    </div>
  </div>
</footer>

<script>
let cartCount = 0;

function addToCart(name) {
  cartCount++;
  const badge = document.getElementById('cartBadge');
  badge.textContent = cartCount;
  badge.classList.remove('hidden');
  badge.style.transform = 'scale(1.3)';
  setTimeout(() => badge.style.transform = 'scale(1)', 200);
}

function openBookModal(card) {
  const modal = document.getElementById('bookModal');
  document.getElementById('modalTitle').textContent = card.dataset.title;
  document.getElementById('modalAuthor').textContent = card.dataset.author;
  document.getElementById('modalPrice').textContent = card.dataset.price;
  document.getElementById('modalRating').innerHTML = card.dataset.rating;
  document.getElementById('modalSynopsis').textContent = card.dataset.synopsis;
  document.getElementById('modalCategory').textContent = card.dataset.catLabel;
  document.getElementById('modalCover').innerHTML = '<span class="text-6xl">' + card.dataset.emoji + '</span>';
  document.getElementById('modalCover').className = 'w-44 shrink-0 flex items-center justify-center text-6xl bg-gradient-to-b ' + card.dataset.bg;
  document.getElementById('modalSuccess').classList.add('hidden');
  document.getElementById('modalCartBtn').style.display = '';
  modal.classList.remove('hidden');
  modal.dataset.bookName = card.dataset.title;
}

function closeBookModal() {
  document.getElementById('bookModal').classList.add('hidden');
}

function addToCartFromModal() {
  const modal = document.getElementById('bookModal');
  addToCart(modal.dataset.bookName);
  document.getElementById('modalCartBtn').style.display = 'none';
  document.getElementById('modalSuccess').classList.remove('hidden');
}

document.getElementById('bookModal').addEventListener('click', function(e) {
  if (e.target === this) closeBookModal();
});

function filterBooks(cat) {
  document.querySelectorAll('.category-btn').forEach(function(b) { b.classList.remove('active'); });
  event.target.classList.add('active');
  var searchVal = document.getElementById('searchInput').value.trim().toLowerCase();
  var hasVisible = false;
  document.querySelectorAll('#bookGrid > div').forEach(function(card) {
    var catMatch = (cat === 'all' || card.dataset.category === cat);
    var searchMatch = (!searchVal || card.dataset.title.toLowerCase().includes(searchVal));
    if (catMatch && searchMatch) {
      card.style.display = '';
      hasVisible = true;
    } else {
      card.style.display = 'none';
    }
  });
  document.getElementById('noResults').style.display = hasVisible ? 'none' : 'block';
}

function searchBooks() {
  var searchVal = document.getElementById('searchInput').value.trim().toLowerCase();
  var activeBtn = document.querySelector('.category-btn.active');
  var activeCat = 'all';
  if (activeBtn) {
    var btnText = activeBtn.textContent.trim();
    if (btnText === '文學小說') activeCat = 'literature';
    else if (btnText === '商業理財') activeCat = 'business';
    else if (btnText === '心理勵志') activeCat = 'psychology';
    else if (btnText === '生活風格') activeCat = 'lifestyle';
  }
  var hasVisible = false;
  document.querySelectorAll('#bookGrid > div').forEach(function(card) {
    var catMatch = (activeCat === 'all' || card.dataset.category === activeCat);
    var searchMatch = (!searchVal || card.dataset.title.toLowerCase().includes(searchVal));
    if (catMatch && searchMatch) {
      card.style.display = '';
      hasVisible = true;
    } else {
      card.style.display = 'none';
    }
  });
  document.getElementById('noResults').style.display = hasVisible ? 'none' : 'block';
}

function toggleFaq(btn) {
  var answer = btn.nextElementSibling;
  var icon = btn.querySelector('span:last-child');
  var wasOpen = answer.classList.contains('open');
  document.querySelectorAll('.faq-answer').forEach(function(a) { a.classList.remove('open'); });
  document.querySelectorAll('.faq-answer').forEach(function(a) {
    var prevIcon = a.previousElementSibling.querySelector('span:last-child');
    if (prevIcon) prevIcon.textContent = '+';
  });
  if (!wasOpen) {
    answer.classList.add('open');
    icon.textContent = '\u2212';
  }
}

function subscribeNewsletter(btn) {
  var input = btn.previousElementSibling;
  if (!input.value || !input.value.includes('@')) {
    input.style.borderColor = '#ef4444';
    input.placeholder = '請輸入有效的 Email';
    return;
  }
  btn.textContent = '\u2713 已訂閱！';
  btn.style.background = '#16a34a';
  btn.style.color = 'white';
  btn.disabled = true;
  input.disabled = true;
  input.value = '';
  input.placeholder = '感謝訂閱！';
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
