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
tailwind.config = { theme: { extend: { colors: { flora: { 50:'#fdf2f8',100:'#fce7f3',200:'#fbcfe8',300:'#f9a8d4',400:'#f472b6',500:'#ec4899',600:'#db2777' }, sage: { 50:'#f0fdf4',100:'#dcfce7',400:'#4ade80',500:'#22c55e',600:'#16a34a' } } } } } }
</script>
<style>
body { font-family: 'DM Sans', sans-serif; background: #fffbfc; }
.serif { font-family: 'Cormorant Garamond', serif; }
.bouquet-card { transition: all 0.3s; cursor: pointer; }
.bouquet-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(236,72,153,0.1); }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-pink-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><span class="text-xl">🌸</span><span class="serif text-xl font-bold text-gray-800">花語</span><span class="text-[10px] text-flora-500 font-medium">FloraStory</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-500">
      <a class="hover:text-flora-500 transition cursor-pointer">花束</a>
      <a class="hover:text-flora-500 transition cursor-pointer">花禮</a>
      <a class="hover:text-flora-500 transition cursor-pointer">訂閱花</a>
      <a class="hover:text-flora-500 transition cursor-pointer">花藝課</a>
      <button class="bg-flora-500 hover:bg-flora-600 text-white px-5 py-1.5 rounded-full text-sm font-medium transition">立即訂花</button>
    </div>
  </div>
</nav>

<section class="py-20 bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 relative overflow-hidden">
  <div class="absolute right-0 top-0 w-80 h-80 bg-flora-200/30 rounded-full blur-[100px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-14">
    <div class="flex-1">
      <span class="inline-block text-xs bg-flora-100 text-flora-600 px-3 py-1 rounded-full font-medium mb-4">🌷 台北 2 小時極速送達</span>
      <h1 class="serif text-5xl font-bold text-gray-800 leading-tight mb-4">用花的語言<br>訴說心意</h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-md">每束花都由花藝師親手設計，選用當季鮮花，從產地到手中不超過 48 小時。讓最新鮮的花朵，傳遞你最真摯的情感。</p>
      <div class="flex gap-3">
        <button class="bg-flora-500 hover:bg-flora-600 text-white px-8 py-3 rounded-full font-medium transition shadow-lg shadow-flora-200">選購花束</button>
        <button class="border border-flora-400 text-flora-600 hover:bg-flora-50 px-8 py-3 rounded-full font-medium transition">每週訂閱</button>
      </div>
    </div>
    <div class="relative">
      <div class="w-72 h-80 rounded-3xl bg-gradient-to-b from-flora-200 to-rose-300 flex items-center justify-center text-8xl shadow-xl shadow-flora-100">💐</div>
      <div class="absolute -bottom-4 -left-6 w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center text-2xl shadow-md">🌿</div>
      <div class="absolute top-4 -right-4 w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center text-xl shadow-md">🌹</div>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-14">
  <div class="text-center mb-10"><h2 class="serif text-3xl font-bold text-gray-800 mb-2">人氣花束</h2><p class="text-sm text-gray-400">當季鮮花 · 花藝師手作</p></div>
  <div class="grid grid-cols-4 gap-5">
    <div class="bouquet-card bg-white rounded-2xl overflow-hidden border border-pink-50">
      <div class="h-52 bg-gradient-to-b from-rose-100 to-rose-200 flex items-center justify-center text-6xl relative"><span>🌹</span><span class="absolute top-2 right-2 text-[10px] bg-flora-500 text-white px-2 py-0.5 rounded-full font-bold">熱賣</span></div>
      <div class="p-4"><h3 class="font-bold text-gray-800">浪漫紅玫瑰</h3><p class="text-xs text-gray-400 mt-0.5">20 朵紅玫瑰 · 尤加利葉</p><div class="flex items-center justify-between mt-3"><span class="text-flora-500 font-bold">NT$ 1,680</span><button class="text-xs bg-flora-50 text-flora-600 px-3 py-1 rounded-full font-medium hover:bg-flora-100 transition">加入</button></div></div>
    </div>
    <div class="bouquet-card bg-white rounded-2xl overflow-hidden border border-pink-50">
      <div class="h-52 bg-gradient-to-b from-purple-100 to-violet-200 flex items-center justify-center text-6xl"><span>💜</span></div>
      <div class="p-4"><h3 class="font-bold text-gray-800">紫色夢境</h3><p class="text-xs text-gray-400 mt-0.5">桔梗 · 繡球 · 薰衣草</p><div class="flex items-center justify-between mt-3"><span class="text-flora-500 font-bold">NT$ 2,280</span><button class="text-xs bg-flora-50 text-flora-600 px-3 py-1 rounded-full font-medium hover:bg-flora-100 transition">加入</button></div></div>
    </div>
    <div class="bouquet-card bg-white rounded-2xl overflow-hidden border border-pink-50">
      <div class="h-52 bg-gradient-to-b from-amber-100 to-yellow-200 flex items-center justify-center text-6xl"><span>🌻</span></div>
      <div class="p-4"><h3 class="font-bold text-gray-800">向日葵活力</h3><p class="text-xs text-gray-400 mt-0.5">向日葵 · 雛菊 · 小米果</p><div class="flex items-center justify-between mt-3"><span class="text-flora-500 font-bold">NT$ 1,480</span><button class="text-xs bg-flora-50 text-flora-600 px-3 py-1 rounded-full font-medium hover:bg-flora-100 transition">加入</button></div></div>
    </div>
    <div class="bouquet-card bg-white rounded-2xl overflow-hidden border border-pink-50">
      <div class="h-52 bg-gradient-to-b from-pink-100 to-pink-200 flex items-center justify-center text-6xl relative"><span>🌸</span><span class="absolute top-2 right-2 text-[10px] bg-sage-500 text-white px-2 py-0.5 rounded-full font-bold">季節</span></div>
      <div class="p-4"><h3 class="font-bold text-gray-800">春日櫻花</h3><p class="text-xs text-gray-400 mt-0.5">吉野櫻 · 芍藥 · 滿天星</p><div class="flex items-center justify-between mt-3"><span class="text-flora-500 font-bold">NT$ 2,880</span><button class="text-xs bg-flora-50 text-flora-600 px-3 py-1 rounded-full font-medium hover:bg-flora-100 transition">加入</button></div></div>
    </div>
  </div>
</section>

<section class="bg-flora-600 text-white py-14">
  <div class="max-w-6xl mx-auto px-6 text-center">
    <h2 class="serif text-3xl font-bold mb-2">每週鮮花訂閱</h2>
    <p class="text-white/70 text-sm mb-8">讓生活中永遠有花的陪伴</p>
    <div class="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
      <div class="bg-white/10 rounded-2xl p-6 border border-white/10 cursor-pointer hover:border-white/30 transition"><h3 class="font-bold text-lg">小品束</h3><div class="serif text-3xl font-bold my-3">$399<span class="text-sm font-normal text-white/50">/週</span></div><p class="text-xs text-white/60">3-5 支當季鮮花</p></div>
      <div class="bg-white/15 rounded-2xl p-6 border border-white/30 relative cursor-pointer"><span class="absolute -top-2 right-4 text-xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-bold">最受歡迎</span><h3 class="font-bold text-lg">經典束</h3><div class="serif text-3xl font-bold my-3">$699<span class="text-sm font-normal text-white/50">/週</span></div><p class="text-xs text-white/60">7-10 支混搭花束</p></div>
      <div class="bg-white/10 rounded-2xl p-6 border border-white/10 cursor-pointer hover:border-white/30 transition"><h3 class="font-bold text-lg">奢華束</h3><div class="serif text-3xl font-bold my-3">$1,299<span class="text-sm font-normal text-white/50">/週</span></div><p class="text-xs text-white/60">15+ 支設計師搭配</p></div>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-12">
  <h2 class="serif text-2xl font-bold text-gray-800 mb-6 text-center">花藝教室</h2>
  <div class="grid grid-cols-3 gap-5">
    <div class="bg-white rounded-xl p-5 border border-pink-50 text-center hover:shadow-md transition cursor-pointer"><div class="text-3xl mb-2">🎨</div><h3 class="font-bold text-gray-800 text-sm">初階花藝</h3><p class="text-xs text-gray-400 mt-1">螺旋手綁花束技法</p><div class="text-xs text-flora-500 font-medium mt-2">$1,800 / 堂</div></div>
    <div class="bg-white rounded-xl p-5 border border-pink-50 text-center hover:shadow-md transition cursor-pointer"><div class="text-3xl mb-2">💎</div><h3 class="font-bold text-gray-800 text-sm">韓式花藝</h3><p class="text-xs text-gray-400 mt-1">韓式自然風格設計</p><div class="text-xs text-flora-500 font-medium mt-2">$2,400 / 堂</div></div>
    <div class="bg-white rounded-xl p-5 border border-pink-50 text-center hover:shadow-md transition cursor-pointer"><div class="text-3xl mb-2">💍</div><h3 class="font-bold text-gray-800 text-sm">婚禮花藝</h3><p class="text-xs text-gray-400 mt-1">捧花與胸花設計</p><div class="text-xs text-flora-500 font-medium mt-2">$3,200 / 堂</div></div>
  </div>
</section>

<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
    <div class="flex items-center gap-2"><span>🌸</span><span class="serif text-white font-bold">花語</span></div>
    <div class="text-xs">© 2026 FloraStory · 台北市大安區仁愛路四段 112 巷 5 號</div>
  </div>
</footer>
</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
