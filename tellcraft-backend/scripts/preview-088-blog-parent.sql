INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'd864935f-b711-45af-a400-6fabf532c10f',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>童樂園 ParentHub</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { parent: { 50:'#fef3c7',100:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b' }, sky: { 50:'#f0f9ff',100:'#e0f2fe',400:'#38bdf8',500:'#0ea5e9' }, pink: { 50:'#fdf2f8',100:'#fce7f3',400:'#f472b6',500:'#ec4899' } } } } } }
</script>
<style>
* { font-family: 'Nunito', sans-serif; }
body { background: #fffef7; }
.article-card { transition: all 0.3s; cursor: pointer; }
.article-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(245,158,11,0.1); }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-yellow-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><span class="text-xl">🧒</span><span class="text-lg font-extrabold text-amber-700">童樂園</span><span class="text-xs text-amber-400 font-bold">ParentHub</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-500 font-semibold">
      <a class="hover:text-amber-500 transition cursor-pointer">育兒經</a>
      <a class="hover:text-amber-500 transition cursor-pointer">親子遊</a>
      <a class="hover:text-amber-500 transition cursor-pointer">教育</a>
      <a class="hover:text-amber-500 transition cursor-pointer">好物推薦</a>
      <button class="bg-amber-400 hover:bg-amber-500 text-white px-4 py-1.5 rounded-full text-sm font-bold transition">訂閱</button>
    </div>
  </div>
</nav>

<section class="py-14 bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-12">
    <div class="flex-1">
      <span class="inline-block text-xs bg-pink-100 text-pink-500 px-3 py-1 rounded-full font-bold mb-3">🌟 本週精選</span>
      <h1 class="text-3xl font-extrabold text-gray-800 leading-snug mb-3">和孩子一起<br>探索世界的美好</h1>
      <p class="text-gray-500 text-sm leading-relaxed mb-6 max-w-md">分享育兒日常、親子旅遊、教育觀點與好物推薦。讓每個家庭都能找到屬於自己的幸福節奏。</p>
      <div class="flex gap-3">
        <button class="bg-amber-400 hover:bg-amber-500 text-white px-6 py-2.5 rounded-full font-bold text-sm transition">開始閱讀</button>
        <button class="border border-sky-400 text-sky-500 hover:bg-sky-50 px-6 py-2.5 rounded-full font-bold text-sm transition">加入社群</button>
      </div>
    </div>
    <div class="flex gap-3">
      <div class="w-44 h-56 rounded-2xl bg-gradient-to-b from-sky-200 to-sky-300 flex items-center justify-center text-6xl shadow-lg rotate-2">👶</div>
      <div class="w-44 h-56 rounded-2xl bg-gradient-to-b from-pink-200 to-pink-300 flex items-center justify-center text-6xl shadow-lg -rotate-2 mt-6">🎨</div>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-12">
  <div class="flex items-center gap-3 mb-6"><h2 class="text-xl font-extrabold text-gray-800">📝 最新文章</h2><div class="flex gap-2 text-xs"><button class="px-3 py-1 rounded-full bg-amber-400 text-white font-bold">全部</button><button class="px-3 py-1 rounded-full bg-yellow-50 text-gray-500 font-medium">育兒</button><button class="px-3 py-1 rounded-full bg-yellow-50 text-gray-500 font-medium">旅遊</button><button class="px-3 py-1 rounded-full bg-yellow-50 text-gray-500 font-medium">教育</button></div></div>
  <div class="grid grid-cols-3 gap-5">
    <div class="article-card bg-white rounded-2xl overflow-hidden border border-yellow-50">
      <div class="h-40 bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center text-5xl">🏕️</div>
      <div class="p-4"><span class="text-[10px] bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full font-bold">親子遊</span><h3 class="font-bold text-gray-800 mt-2">帶孩子露營的 10 個必備清單</h3><p class="text-xs text-gray-400 mt-1 line-clamp-2">第一次帶小朋友露營不知道要準備什麼？這份清單讓你輕鬆出發！</p><div class="flex items-center gap-2 mt-3 text-xs text-gray-400"><span>2026/02/14</span><span>·</span><span>5 min</span></div></div>
    </div>
    <div class="article-card bg-white rounded-2xl overflow-hidden border border-yellow-50">
      <div class="h-40 bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center text-5xl">📚</div>
      <div class="p-4"><span class="text-[10px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full font-bold">教育</span><h3 class="font-bold text-gray-800 mt-2">培養閱讀習慣：從 0 歲開始的共讀指南</h3><p class="text-xs text-gray-400 mt-1 line-clamp-2">研究顯示，早期共讀對孩子的語言發展有顯著影響。</p><div class="flex items-center gap-2 mt-3 text-xs text-gray-400"><span>2026/02/12</span><span>·</span><span>8 min</span></div></div>
    </div>
    <div class="article-card bg-white rounded-2xl overflow-hidden border border-yellow-50">
      <div class="h-40 bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center text-5xl">🥦</div>
      <div class="p-4"><span class="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">育兒</span><h3 class="font-bold text-gray-800 mt-2">挑食小孩的救星：5 道偽裝蔬菜料理</h3><p class="text-xs text-gray-400 mt-1 line-clamp-2">把蔬菜藏進美味料理裡，讓孩子不知不覺吃光光。</p><div class="flex items-center gap-2 mt-3 text-xs text-gray-400"><span>2026/02/10</span><span>·</span><span>4 min</span></div></div>
    </div>
  </div>
</section>

<section class="bg-sky-500 text-white py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between"><div><h2 class="text-2xl font-extrabold">🎪 親子活動日曆</h2><p class="text-sky-100 text-sm mt-1">精選本月親子活動</p></div><a class="text-sm text-white/70 hover:text-white cursor-pointer font-medium">查看全部 →</a></div>
    <div class="grid grid-cols-3 gap-4 mt-6">
      <div class="bg-white/15 rounded-xl p-4 border border-white/10"><div class="text-xs text-sky-200">2/22（六）10:00</div><h3 class="font-bold mt-1">兒童科學實驗營</h3><div class="text-xs text-sky-200/60 mt-2">📍 科教館 · 適合 5-10 歲</div></div>
      <div class="bg-white/15 rounded-xl p-4 border border-white/10"><div class="text-xs text-sky-200">3/01（六）09:00</div><h3 class="font-bold mt-1">春日親子馬拉松</h3><div class="text-xs text-sky-200/60 mt-2">📍 大安森林公園 · 全年齡</div></div>
      <div class="bg-white/15 rounded-xl p-4 border border-white/10"><div class="text-xs text-sky-200">3/08（六）14:00</div><h3 class="font-bold mt-1">繪本故事劇場</h3><div class="text-xs text-sky-200/60 mt-2">📍 信誼基金會 · 3-6 歲</div></div>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-12">
  <h2 class="text-xl font-extrabold text-gray-800 mb-6 text-center">💝 好物推薦</h2>
  <div class="grid grid-cols-4 gap-4">
    <div class="bg-white rounded-xl p-4 border border-yellow-50 text-center hover:shadow-md transition cursor-pointer"><div class="text-3xl mb-2">🎒</div><div class="text-sm font-bold text-gray-700">護脊書包</div><div class="text-xs text-amber-500 font-bold mt-1">NT$ 2,480</div></div>
    <div class="bg-white rounded-xl p-4 border border-yellow-50 text-center hover:shadow-md transition cursor-pointer"><div class="text-3xl mb-2">🧩</div><div class="text-sm font-bold text-gray-700">益智積木組</div><div class="text-xs text-amber-500 font-bold mt-1">NT$ 890</div></div>
    <div class="bg-white rounded-xl p-4 border border-yellow-50 text-center hover:shadow-md transition cursor-pointer"><div class="text-3xl mb-2">🖍️</div><div class="text-sm font-bold text-gray-700">無毒蠟筆 24 色</div><div class="text-xs text-amber-500 font-bold mt-1">NT$ 350</div></div>
    <div class="bg-white rounded-xl p-4 border border-yellow-50 text-center hover:shadow-md transition cursor-pointer"><div class="text-3xl mb-2">📖</div><div class="text-sm font-bold text-gray-700">兒童百科全書</div><div class="text-xs text-amber-500 font-bold mt-1">NT$ 680</div></div>
  </div>
</section>

<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
    <div class="flex items-center gap-2"><span>🧒</span><span class="text-white font-extrabold">童樂園</span></div>
    <div class="text-xs">© 2026 ParentHub · 陪你一起享受育兒時光</div>
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
