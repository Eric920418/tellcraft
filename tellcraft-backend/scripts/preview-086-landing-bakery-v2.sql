INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '9e96dab6-9be1-4a7e-a598-13e237e6fd4a',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>暖心烘焙 BakeJoy</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { bake: { 50:'#fdf8f0',100:'#f9edd8',200:'#f3dbb1',400:'#d4a574',500:'#c4956a',600:'#a67b54' }, cream: { 50:'#fffdf7',100:'#fef9ee' } } } } } }
</script>
<style>
body { font-family: 'DM Sans', sans-serif; background: #fffdf7; }
.serif { font-family: 'Playfair Display', serif; }
.product-card { transition: all 0.3s; cursor: pointer; }
.product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(196,149,106,0.15); }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.faq-answer.open { max-height: 300px; }
.category-btn { transition: all 0.2s; }
.category-btn.active { background: #c4956a; color: white; }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-cream-50/90 backdrop-blur border-b border-bake-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><span class="text-xl">🥐</span><span class="serif text-lg font-bold text-bake-600">暖心烘焙</span><span class="text-[10px] text-bake-400">BakeJoy</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-500">
      <a onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})" class="hover:text-bake-500 transition cursor-pointer">麵包蛋糕</a>
      <a onclick="document.getElementById('story').scrollIntoView({behavior:'smooth'})" class="hover:text-bake-500 transition cursor-pointer">品牌故事</a>
      <a onclick="document.getElementById('classes').scrollIntoView({behavior:'smooth'})" class="hover:text-bake-500 transition cursor-pointer">烘焙課程</a>
      <a onclick="document.getElementById('locations').scrollIntoView({behavior:'smooth'})" class="hover:text-bake-500 transition cursor-pointer">門市據點</a>
      <button onclick="document.getElementById('orderModal').classList.remove('hidden')" class="bg-bake-500 hover:bg-bake-600 text-white px-5 py-1.5 rounded-full text-sm font-medium transition">線上訂購</button>
    </div>
  </div>
</nav>

<!-- Order Modal -->
<div id="orderModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
    <button onclick="document.getElementById('orderModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
    <div class="text-center mb-6">
      <div class="text-4xl mb-2">🛒</div>
      <h3 class="serif text-xl font-bold text-gray-800">線上訂購</h3>
      <p class="text-sm text-gray-400 mt-1">新鮮出爐，隔日配送</p>
    </div>
    <div id="orderForm">
      <input type="text" placeholder="收件人姓名" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-bake-400">
      <input type="tel" placeholder="聯絡電話" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-bake-400">
      <input type="text" placeholder="配送地址" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-bake-400">
      <select class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 text-gray-500 focus:outline-none focus:border-bake-400">
        <option>選擇配送時段</option><option>上午 10:00-12:00</option><option>下午 14:00-17:00</option><option>晚上 18:00-21:00</option>
      </select>
      <textarea placeholder="備註（如：生日蛋糕請寫「Happy Birthday Amy」）" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-bake-400 h-16 resize-none"></textarea>
      <button onclick="document.getElementById('orderForm').innerHTML='<div class=\'text-center py-6\'><div class=\'text-5xl mb-3\'>🎉</div><p class=\'serif font-bold text-gray-800\'>訂單已送出！</p><p class=\'text-sm text-gray-400 mt-1\'>我們會盡快與您確認訂單</p><p class=\'text-xs text-bake-500 mt-2\'>訂單編號：BJ-' + Math.floor(Math.random()*90000+10000) + '</p></div>'" class="w-full bg-bake-500 hover:bg-bake-600 text-white py-2.5 rounded-xl font-medium text-sm transition">送出訂單</button>
    </div>
  </div>
</div>

<!-- Hero -->
<section class="py-20 bg-gradient-to-br from-bake-50 via-orange-50 to-amber-50 relative overflow-hidden">
  <div class="absolute right-0 top-0 w-80 h-80 bg-bake-200/30 rounded-full blur-[100px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-14">
    <div class="flex-1">
      <span class="inline-block text-xs bg-bake-100 text-bake-600 px-3 py-1 rounded-full font-medium mb-4">🌾 每日新鮮手作</span>
      <h1 class="serif text-5xl font-bold text-gray-800 leading-tight mb-4">用溫度<br>烘焙幸福</h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-md">堅持天然食材、手工製作，每一口都是對品質的承諾。從法式可頌到台式麵包，暖心烘焙陪你度過每個美好時刻。</p>
      <div class="flex gap-3">
        <button onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})" class="bg-bake-500 hover:bg-bake-600 text-white px-8 py-3 rounded-full font-medium transition shadow-lg shadow-bake-200">探索美味</button>
        <button onclick="document.getElementById('orderModal').classList.remove('hidden')" class="border border-bake-400 text-bake-600 hover:bg-bake-50 px-8 py-3 rounded-full font-medium transition">立即訂購</button>
      </div>
    </div>
    <div class="flex gap-4">
      <div class="w-48 h-56 rounded-3xl bg-gradient-to-b from-bake-200 to-amber-200 flex items-center justify-center text-7xl shadow-xl rotate-3">🥖</div>
      <div class="w-48 h-56 rounded-3xl bg-gradient-to-b from-orange-200 to-rose-200 flex items-center justify-center text-7xl shadow-xl -rotate-3 mt-8">🎂</div>
    </div>
  </div>
</section>

<!-- Stats -->
<section class="bg-white border-b border-bake-50">
  <div class="max-w-6xl mx-auto px-6 py-6 grid grid-cols-4 gap-6 text-center">
    <div><div class="text-2xl font-bold text-bake-500">15 年</div><div class="text-xs text-gray-400">烘焙經驗</div></div>
    <div><div class="text-2xl font-bold text-bake-500">50+</div><div class="text-xs text-gray-400">手作品項</div></div>
    <div><div class="text-2xl font-bold text-bake-500">3 家</div><div class="text-xs text-gray-400">直營門市</div></div>
    <div><div class="text-2xl font-bold text-bake-500">4.9⭐</div><div class="text-xs text-gray-400">Google 評分</div></div>
  </div>
</section>

<!-- Products -->
<section id="products" class="max-w-6xl mx-auto px-6 py-14">
  <div class="flex items-center justify-between mb-8">
    <h2 class="serif text-3xl font-bold text-gray-800">招牌美味</h2>
    <div class="flex gap-2">
      <button onclick="filterProducts('all')" class="category-btn active text-xs px-4 py-1.5 rounded-full border border-bake-200 font-medium">全部</button>
      <button onclick="filterProducts('bread')" class="category-btn text-xs px-4 py-1.5 rounded-full border border-bake-200 text-bake-600 font-medium">麵包</button>
      <button onclick="filterProducts('cake')" class="category-btn text-xs px-4 py-1.5 rounded-full border border-bake-200 text-bake-600 font-medium">蛋糕</button>
      <button onclick="filterProducts('pastry')" class="category-btn text-xs px-4 py-1.5 rounded-full border border-bake-200 text-bake-600 font-medium">甜點</button>
    </div>
  </div>
  <div class="grid grid-cols-4 gap-5" id="productGrid">
    <div class="product-card bg-white rounded-2xl overflow-hidden border border-bake-50" data-category="bread">
      <div class="h-36 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-5xl">🥐</div>
      <div class="p-4"><h3 class="font-bold text-gray-800 text-sm">法式可頌</h3><p class="text-xs text-gray-400 mt-1">27 層手工酥皮，外酥內軟</p><div class="flex items-center justify-between mt-3"><span class="text-bake-600 font-bold text-sm">$65</span><button onclick="event.stopPropagation();document.getElementById('orderModal').classList.remove('hidden')" class="text-[10px] bg-bake-50 text-bake-600 px-3 py-1 rounded-full font-medium hover:bg-bake-100 transition">加入購物車</button></div></div>
    </div>
    <div class="product-card bg-white rounded-2xl overflow-hidden border border-bake-50" data-category="bread">
      <div class="h-36 bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center text-5xl">🥖</div>
      <div class="p-4"><h3 class="font-bold text-gray-800 text-sm">歐式雜糧</h3><p class="text-xs text-gray-400 mt-1">五穀雜糧、低糖低油</p><div class="flex items-center justify-between mt-3"><span class="text-bake-600 font-bold text-sm">$85</span><button onclick="event.stopPropagation();document.getElementById('orderModal').classList.remove('hidden')" class="text-[10px] bg-bake-50 text-bake-600 px-3 py-1 rounded-full font-medium hover:bg-bake-100 transition">加入購物車</button></div></div>
    </div>
    <div class="product-card bg-white rounded-2xl overflow-hidden border border-bake-50" data-category="cake">
      <div class="h-36 bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-5xl">🎂</div>
      <div class="p-4"><h3 class="font-bold text-gray-800 text-sm">草莓鮮奶油蛋糕</h3><p class="text-xs text-gray-400 mt-1">季節限定，新鮮草莓</p><div class="flex items-center justify-between mt-3"><span class="text-bake-600 font-bold text-sm">$580</span><button onclick="event.stopPropagation();document.getElementById('orderModal').classList.remove('hidden')" class="text-[10px] bg-bake-50 text-bake-600 px-3 py-1 rounded-full font-medium hover:bg-bake-100 transition">加入購物車</button></div></div>
    </div>
    <div class="product-card bg-white rounded-2xl overflow-hidden border border-bake-50" data-category="pastry">
      <div class="h-36 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-5xl">🍵</div>
      <div class="p-4"><h3 class="font-bold text-gray-800 text-sm">抹茶生乳捲</h3><p class="text-xs text-gray-400 mt-1">京都宇治抹茶 × 北海道鮮奶油</p><div class="flex items-center justify-between mt-3"><span class="text-bake-600 font-bold text-sm">$320</span><button onclick="event.stopPropagation();document.getElementById('orderModal').classList.remove('hidden')" class="text-[10px] bg-bake-50 text-bake-600 px-3 py-1 rounded-full font-medium hover:bg-bake-100 transition">加入購物車</button></div></div>
    </div>
    <div class="product-card bg-white rounded-2xl overflow-hidden border border-bake-50" data-category="bread">
      <div class="h-36 bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center text-5xl">🍞</div>
      <div class="p-4"><h3 class="font-bold text-gray-800 text-sm">明太子法國麵包</h3><p class="text-xs text-gray-400 mt-1">進口明太子醬，微辣鮮香</p><div class="flex items-center justify-between mt-3"><span class="text-bake-600 font-bold text-sm">$75</span><button onclick="event.stopPropagation();document.getElementById('orderModal').classList.remove('hidden')" class="text-[10px] bg-bake-50 text-bake-600 px-3 py-1 rounded-full font-medium hover:bg-bake-100 transition">加入購物車</button></div></div>
    </div>
    <div class="product-card bg-white rounded-2xl overflow-hidden border border-bake-50" data-category="cake">
      <div class="h-36 bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center text-5xl">🍰</div>
      <div class="p-4"><h3 class="font-bold text-gray-800 text-sm">巴斯克乳酪蛋糕</h3><p class="text-xs text-gray-400 mt-1">焦香外皮，綿密內餡</p><div class="flex items-center justify-between mt-3"><span class="text-bake-600 font-bold text-sm">$420</span><button onclick="event.stopPropagation();document.getElementById('orderModal').classList.remove('hidden')" class="text-[10px] bg-bake-50 text-bake-600 px-3 py-1 rounded-full font-medium hover:bg-bake-100 transition">加入購物車</button></div></div>
    </div>
    <div class="product-card bg-white rounded-2xl overflow-hidden border border-bake-50" data-category="pastry">
      <div class="h-36 bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center text-5xl">🧁</div>
      <div class="p-4"><h3 class="font-bold text-gray-800 text-sm">藍莓馬芬</h3><p class="text-xs text-gray-400 mt-1">整顆新鮮藍莓，當日現烤</p><div class="flex items-center justify-between mt-3"><span class="text-bake-600 font-bold text-sm">$55</span><button onclick="event.stopPropagation();document.getElementById('orderModal').classList.remove('hidden')" class="text-[10px] bg-bake-50 text-bake-600 px-3 py-1 rounded-full font-medium hover:bg-bake-100 transition">加入購物車</button></div></div>
    </div>
    <div class="product-card bg-white rounded-2xl overflow-hidden border border-bake-50" data-category="pastry">
      <div class="h-36 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-5xl">🥧</div>
      <div class="p-4"><h3 class="font-bold text-gray-800 text-sm">蘋果肉桂塔</h3><p class="text-xs text-gray-400 mt-1">焦糖蘋果 × 錫蘭肉桂</p><div class="flex items-center justify-between mt-3"><span class="text-bake-600 font-bold text-sm">$180</span><button onclick="event.stopPropagation();document.getElementById('orderModal').classList.remove('hidden')" class="text-[10px] bg-bake-50 text-bake-600 px-3 py-1 rounded-full font-medium hover:bg-bake-100 transition">加入購物車</button></div></div>
    </div>
  </div>
</section>

<!-- Story -->
<section id="story" class="bg-gradient-to-r from-bake-50 to-amber-50 py-14">
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-12">
    <div class="w-72 h-64 rounded-2xl bg-gradient-to-br from-bake-200 to-amber-200 flex items-center justify-center text-7xl shrink-0">👨‍🍳</div>
    <div>
      <h2 class="serif text-3xl font-bold text-gray-800 mb-4">品牌故事</h2>
      <p class="text-sm text-gray-500 leading-relaxed mb-3">暖心烘焙創立於 2011 年，主廚阿德師傅在法國藍帶學院學習三年後，回到台灣開設第一家小店。他堅信：「好的麵包不需要太多添加物，只要用最好的食材和足夠的時間。」</p>
      <p class="text-sm text-gray-500 leading-relaxed mb-4">我們使用法國 T55 麵粉、法國 AOP 發酵奶油、台灣在地有機雞蛋，每一個可頌都經過 27 層手工摺疊、18 小時低溫發酵。</p>
      <div class="flex gap-4">
        <div class="bg-white rounded-lg px-4 py-2 text-center"><div class="text-lg">🇫🇷</div><div class="text-[10px] text-gray-400">藍帶認證</div></div>
        <div class="bg-white rounded-lg px-4 py-2 text-center"><div class="text-lg">🌾</div><div class="text-[10px] text-gray-400">天然食材</div></div>
        <div class="bg-white rounded-lg px-4 py-2 text-center"><div class="text-lg">🕐</div><div class="text-[10px] text-gray-400">18hr 發酵</div></div>
        <div class="bg-white rounded-lg px-4 py-2 text-center"><div class="text-lg">🥇</div><div class="text-[10px] text-gray-400">多次得獎</div></div>
      </div>
    </div>
  </div>
</section>

<!-- Baking Classes -->
<section id="classes" class="max-w-6xl mx-auto px-6 py-14">
  <h2 class="serif text-3xl font-bold text-gray-800 mb-2 text-center">烘焙課程</h2>
  <p class="text-sm text-gray-400 text-center mb-8">跟著主廚學做麵包，享受手作的樂趣</p>
  <div class="grid grid-cols-3 gap-6">
    <div class="bg-white rounded-2xl p-6 border border-bake-50 hover:shadow-lg transition cursor-pointer">
      <div class="text-3xl mb-3">🥐</div>
      <h3 class="font-bold text-gray-800">可頌大師班</h3>
      <p class="text-xs text-gray-400 mt-2">學習正統法式可頌的 27 層摺疊技巧，從揉麵到出爐，完整體驗。</p>
      <div class="flex items-center justify-between mt-4">
        <div class="text-xs text-gray-400">⏱ 4 小時 · 👥 8 人</div>
        <span class="text-bake-600 font-bold text-sm">$2,800</span>
      </div>
    </div>
    <div class="bg-white rounded-2xl p-6 border border-bake-50 hover:shadow-lg transition cursor-pointer">
      <div class="text-3xl mb-3">🎂</div>
      <h3 class="font-bold text-gray-800">裝飾蛋糕入門</h3>
      <p class="text-xs text-gray-400 mt-2">從打發鮮奶油到擠花裝飾，帶回一個自己做的 6 吋蛋糕。</p>
      <div class="flex items-center justify-between mt-4">
        <div class="text-xs text-gray-400">⏱ 3 小時 · 👥 6 人</div>
        <span class="text-bake-600 font-bold text-sm">$2,200</span>
      </div>
    </div>
    <div class="bg-white rounded-2xl p-6 border border-bake-50 hover:shadow-lg transition cursor-pointer">
      <div class="text-3xl mb-3">👨‍👩‍👧</div>
      <h3 class="font-bold text-gray-800">親子烘焙趣</h3>
      <p class="text-xs text-gray-400 mt-2">和孩子一起做餅乾和小蛋糕，適合 4 歲以上小朋友。</p>
      <div class="flex items-center justify-between mt-4">
        <div class="text-xs text-gray-400">⏱ 2 小時 · 👨‍👩‍👧 6 組</div>
        <span class="text-bake-600 font-bold text-sm">$1,500/組</span>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="bg-bake-50/50 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold text-gray-800 mb-8 text-center">💬 顧客好評</h2>
    <div class="grid grid-cols-3 gap-5">
      <div class="bg-white rounded-xl p-5 border border-bake-50">
        <div class="flex items-center gap-1 text-yellow-400 text-xs mb-2">⭐⭐⭐⭐⭐</div>
        <p class="text-sm text-gray-600 italic">"可頌真的超級好吃！外酥內軟，一咬下去奶油香氣撲鼻，完全不輸在巴黎吃的。"</p>
        <div class="text-xs text-gray-400 mt-3">— 小美，忠實顧客 3 年</div>
      </div>
      <div class="bg-white rounded-xl p-5 border border-bake-50">
        <div class="flex items-center gap-1 text-yellow-400 text-xs mb-2">⭐⭐⭐⭐⭐</div>
        <p class="text-sm text-gray-600 italic">"每次生日都訂暖心的蛋糕，草莓鮮奶油蛋糕是我們全家的最愛，不會太甜！"</p>
        <div class="text-xs text-gray-400 mt-3">— 陳太太，生日蛋糕常客</div>
      </div>
      <div class="bg-white rounded-xl p-5 border border-bake-50">
        <div class="flex items-center gap-1 text-yellow-400 text-xs mb-2">⭐⭐⭐⭐⭐</div>
        <p class="text-sm text-gray-600 italic">"帶小孩去上親子烘焙課，小朋友超開心！而且環境很乾淨，老師很有耐心。"</p>
        <div class="text-xs text-gray-400 mt-3">— Amy，親子課程學員</div>
      </div>
    </div>
  </div>
</section>

<!-- Locations -->
<section id="locations" class="max-w-6xl mx-auto px-6 py-14">
  <h2 class="serif text-2xl font-bold text-gray-800 mb-8 text-center">📍 門市據點</h2>
  <div class="grid grid-cols-3 gap-5">
    <div class="bg-white rounded-xl p-5 border border-bake-50 hover:shadow-md transition">
      <h3 class="font-bold text-gray-800 text-sm">大安旗艦店</h3>
      <p class="text-xs text-gray-400 mt-2">台北市大安區復興南路一段 200 號</p>
      <p class="text-xs text-gray-400">🕐 07:30 - 21:00 · ☎ (02) 2700-1234</p>
      <div class="text-[10px] text-bake-500 mt-2 font-medium">附設內用座位 · 烘焙教室</div>
    </div>
    <div class="bg-white rounded-xl p-5 border border-bake-50 hover:shadow-md transition">
      <h3 class="font-bold text-gray-800 text-sm">信義微風店</h3>
      <p class="text-xs text-gray-400 mt-2">台北市信義區忠孝東路五段 68 號 B1</p>
      <p class="text-xs text-gray-400">🕐 11:00 - 21:30 · ☎ (02) 8780-5678</p>
      <div class="text-[10px] text-bake-500 mt-2 font-medium">百貨專櫃</div>
    </div>
    <div class="bg-white rounded-xl p-5 border border-bake-50 hover:shadow-md transition">
      <h3 class="font-bold text-gray-800 text-sm">天母本店</h3>
      <p class="text-xs text-gray-400 mt-2">台北市士林區天母東路 50 巷 8 號</p>
      <p class="text-xs text-gray-400">🕐 08:00 - 20:00 · ☎ (02) 2871-9999</p>
      <div class="text-[10px] text-bake-500 mt-2 font-medium">創始店 · 工廠直送</div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="max-w-6xl mx-auto px-6 py-8">
  <h2 class="serif text-2xl font-bold text-gray-800 mb-8 text-center">❓ 常見問題</h2>
  <div class="max-w-2xl mx-auto space-y-3">
    <div class="bg-white rounded-xl border border-bake-50 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-gray-800 hover:bg-bake-50 transition"><span>可以訂製生日蛋糕嗎？</span><span class="text-bake-400 text-lg">+</span></button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500">可以！我們提供 6 吋、8 吋、10 吋三種尺寸的客製蛋糕，可選擇口味和裝飾風格。請至少提前 3 天預訂，旺季（聖誕、情人節）建議提前 1 週。</div>
    </div>
    <div class="bg-white rounded-xl border border-bake-50 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-gray-800 hover:bg-bake-50 transition"><span>配送範圍和運費？</span><span class="text-bake-400 text-lg">+</span></button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500">目前配送範圍為大台北地區（台北市、新北市），運費 $100。滿 $800 免運。蛋糕類使用冷藏配送，確保品質。外縣市可選擇冷凍宅配（黑貓），運費另計。</div>
    </div>
    <div class="bg-white rounded-xl border border-bake-50 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-gray-800 hover:bg-bake-50 transition"><span>有素食選項嗎？</span><span class="text-bake-400 text-lg">+</span></button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500">有的！我們的歐式雜糧麵包和全麥吐司都是蛋奶素。另外也有純素（vegan）的燕麥餅乾和香蕉蛋糕，產品標籤上會清楚標示。</div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="max-w-6xl mx-auto px-6 py-8">
  <div class="bg-gradient-to-r from-bake-500 to-amber-500 rounded-2xl p-10 text-center text-white">
    <div class="text-4xl mb-3">🥐</div>
    <h2 class="serif text-2xl font-bold mb-2">今天就品嚐暖心的味道</h2>
    <p class="text-sm text-white/80 mb-6">線上訂購，隔日新鮮到府。首購享 9 折優惠！</p>
    <button onclick="document.getElementById('orderModal').classList.remove('hidden')" class="bg-white text-bake-600 px-8 py-3 rounded-full font-bold hover:bg-bake-50 transition shadow-lg">立即訂購</button>
  </div>
</section>

<footer class="bg-gray-800 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs">
    <div class="flex items-center gap-2"><span>🥐</span><span class="serif text-white font-bold">暖心烘焙</span></div>
    <div>© 2026 BakeJoy · 用溫度烘焙幸福</div>
  </div>
</footer>

<script>
function filterProducts(cat) {
  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('#productGrid > div').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
  });
}
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const icon = btn.querySelector('span:last-child');
  answer.classList.toggle('open');
  icon.textContent = answer.classList.contains('open') ? '−' : '+';
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
