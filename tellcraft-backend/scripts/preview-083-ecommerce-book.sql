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
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { book: { 50:'#fefce8',100:'#fef9c3',200:'#fef08a',400:'#facc15',500:'#eab308',600:'#ca8a04' }, amber: { 700:'#b45309',800:'#92400e',900:'#78350f' } } } } }
</script>
<style>
body { font-family: 'Noto Sans TC', sans-serif; background: #fdfbf5; }
.serif { font-family: 'Noto Serif TC', serif; }
.book-card { transition: all 0.3s; cursor: pointer; }
.book-card:hover { transform: translateY(-4px); }
.book-spine { width: 8px; background: linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.05)); }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-amber-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><span class="text-xl">📚</span><span class="serif text-lg font-bold text-amber-900">閱讀角</span><span class="text-xs text-book-600 font-medium">BookNook</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-500">
      <a class="hover:text-amber-700 transition cursor-pointer">文學</a>
      <a class="hover:text-amber-700 transition cursor-pointer">社科</a>
      <a class="hover:text-amber-700 transition cursor-pointer">藝術</a>
      <a class="hover:text-amber-700 transition cursor-pointer">讀書會</a>
      <div class="flex items-center gap-3">
        <svg class="w-4.5 h-4.5 text-gray-400 hover:text-amber-700 transition cursor-pointer" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <div class="relative cursor-pointer"><svg class="w-4.5 h-4.5 text-gray-400 hover:text-amber-700 transition" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg><span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-700 text-white text-[9px] rounded-full flex items-center justify-center">1</span></div>
      </div>
    </div>
  </div>
</nav>

<section class="py-14 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-12">
    <div class="flex-1">
      <span class="inline-block text-xs bg-amber-700 text-white px-3 py-1 rounded-full font-medium mb-3">📖 編輯推薦</span>
      <h1 class="serif text-3xl font-bold text-gray-800 leading-snug mb-3">在書頁之間<br>發現未知的世界</h1>
      <p class="text-gray-500 text-sm leading-relaxed mb-6 max-w-md">獨立書店的選書品味，從經典文學到當代新銳作家，每一本都是我們精心挑選的閱讀旅程。</p>
      <button class="bg-amber-800 hover:bg-amber-900 text-white px-7 py-2.5 rounded-full text-sm font-medium transition">探索書單 →</button>
    </div>
    <div class="flex items-end gap-1">
      <div class="w-24 h-36 rounded-lg bg-gradient-to-b from-rose-400 to-rose-600 flex items-center justify-center text-3xl shadow-md -rotate-3">📕</div>
      <div class="w-24 h-40 rounded-lg bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center text-3xl shadow-md rotate-1">📘</div>
      <div class="w-24 h-44 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center text-3xl shadow-md -rotate-2">📗</div>
      <div class="w-24 h-38 rounded-lg bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center text-3xl shadow-md rotate-3">📙</div>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-12">
  <div class="flex items-center justify-between mb-6"><h2 class="serif text-xl font-bold text-gray-800">🌟 本月精選</h2><a class="text-sm text-amber-700 hover:text-amber-800 cursor-pointer font-medium">查看全部 →</a></div>
  <div class="grid grid-cols-5 gap-5">
    <div class="book-card"><div class="h-56 rounded-xl bg-gradient-to-b from-indigo-300 to-indigo-500 flex items-center justify-center text-5xl mb-3 shadow-md relative"><span>📖</span><span class="absolute top-2 left-2 text-[10px] bg-white/90 px-1.5 py-0.5 rounded font-bold text-amber-700">新書</span></div><h3 class="serif font-bold text-gray-800 text-sm">月光下的房間</h3><div class="text-xs text-gray-400 mt-0.5">村上春樹</div><div class="text-amber-700 font-bold text-sm mt-1">NT$ 380</div></div>
    <div class="book-card"><div class="h-56 rounded-xl bg-gradient-to-b from-rose-300 to-rose-500 flex items-center justify-center text-5xl mb-3 shadow-md"><span>📖</span></div><h3 class="serif font-bold text-gray-800 text-sm">正常人</h3><div class="text-xs text-gray-400 mt-0.5">Sally Rooney</div><div class="text-amber-700 font-bold text-sm mt-1">NT$ 350</div></div>
    <div class="book-card"><div class="h-56 rounded-xl bg-gradient-to-b from-teal-300 to-teal-500 flex items-center justify-center text-5xl mb-3 shadow-md"><span>📖</span></div><h3 class="serif font-bold text-gray-800 text-sm">人類大歷史</h3><div class="text-xs text-gray-400 mt-0.5">哈拉瑞</div><div class="text-amber-700 font-bold text-sm mt-1">NT$ 450</div></div>
    <div class="book-card"><div class="h-56 rounded-xl bg-gradient-to-b from-purple-300 to-purple-500 flex items-center justify-center text-5xl mb-3 shadow-md"><span>📖</span></div><h3 class="serif font-bold text-gray-800 text-sm">素食者</h3><div class="text-xs text-gray-400 mt-0.5">韓江</div><div class="text-amber-700 font-bold text-sm mt-1">NT$ 320</div></div>
    <div class="book-card"><div class="h-56 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 flex items-center justify-center text-5xl mb-3 shadow-md relative"><span>📖</span><span class="absolute top-2 left-2 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">預購</span></div><h3 class="serif font-bold text-gray-800 text-sm">解憂雜貨店（新版）</h3><div class="text-xs text-gray-400 mt-0.5">東野圭吾</div><div class="text-amber-700 font-bold text-sm mt-1">NT$ 360</div></div>
  </div>
</section>

<section class="bg-amber-800 text-white py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between"><div><h2 class="serif text-2xl font-bold">📖 每月讀書會</h2><p class="text-amber-200/70 text-sm mt-1">與愛書人一起分享閱讀的感動</p></div><button class="bg-white text-amber-800 px-5 py-2 rounded-full text-sm font-bold hover:bg-amber-50 transition">免費參加</button></div>
    <div class="grid grid-cols-3 gap-4 mt-6">
      <div class="bg-white/10 rounded-xl p-4 border border-white/10"><div class="text-xs text-amber-200">2/22（六）14:00</div><h3 class="font-bold mt-1">讀《正常人》— 親密關係的脆弱與美好</h3><div class="text-xs text-amber-200/50 mt-2">12/15 位已報名</div></div>
      <div class="bg-white/10 rounded-xl p-4 border border-white/10"><div class="text-xs text-amber-200">3/08（六）14:00</div><h3 class="font-bold mt-1">讀《素食者》— 身體自主與社會期待</h3><div class="text-xs text-amber-200/50 mt-2">8/15 位已報名</div></div>
      <div class="bg-white/10 rounded-xl p-4 border border-white/10"><div class="text-xs text-amber-200">3/22（六）14:00</div><h3 class="font-bold mt-1">讀《月光下的房間》— 孤獨的多重面貌</h3><div class="text-xs text-amber-200/50 mt-2">5/15 位已報名</div></div>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-10">
  <h2 class="serif text-xl font-bold text-gray-800 mb-6">分類瀏覽</h2>
  <div class="grid grid-cols-6 gap-3">
    <div class="bg-white rounded-xl p-4 text-center border border-amber-100 hover:border-amber-300 transition cursor-pointer"><div class="text-2xl mb-1">📝</div><div class="text-xs font-bold text-gray-600">文學小說</div></div>
    <div class="bg-white rounded-xl p-4 text-center border border-amber-100 hover:border-amber-300 transition cursor-pointer"><div class="text-2xl mb-1">🧠</div><div class="text-xs font-bold text-gray-600">社會人文</div></div>
    <div class="bg-white rounded-xl p-4 text-center border border-amber-100 hover:border-amber-300 transition cursor-pointer"><div class="text-2xl mb-1">🎨</div><div class="text-xs font-bold text-gray-600">藝術設計</div></div>
    <div class="bg-white rounded-xl p-4 text-center border border-amber-100 hover:border-amber-300 transition cursor-pointer"><div class="text-2xl mb-1">💼</div><div class="text-xs font-bold text-gray-600">商業理財</div></div>
    <div class="bg-white rounded-xl p-4 text-center border border-amber-100 hover:border-amber-300 transition cursor-pointer"><div class="text-2xl mb-1">🔬</div><div class="text-xs font-bold text-gray-600">科普新知</div></div>
    <div class="bg-white rounded-xl p-4 text-center border border-amber-100 hover:border-amber-300 transition cursor-pointer"><div class="text-2xl mb-1">🧒</div><div class="text-xs font-bold text-gray-600">兒童繪本</div></div>
  </div>
</section>

<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
    <div class="flex items-center gap-2"><span>📚</span><span class="serif text-white font-bold">閱讀角</span></div>
    <div class="text-xs">© 2026 BookNook · 台北市大安區溫州街 18 巷 5 號</div>
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
