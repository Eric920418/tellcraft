INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '9dde6d85-ef7d-41f2-9b78-be925dfabd51',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>手作人 CraftMaker</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { qs: ['Quicksand', 'sans-serif'] },
      colors: {
        craft: { 50:'#fdf2f8', 100:'#fce7f3', 200:'#fbcfe8', 300:'#f9a8d4', 400:'#f472b6', 500:'#ec4899', 600:'#db2777' },
        clay: { 50:'#fef7ee', 100:'#fdefd6', 300:'#f5c97e', 500:'#e8a640' }
      }
    }
  }
}
</script>
<style>
* { font-family: 'Quicksand', sans-serif; }
body { background: #fef7f0; }
.tutorial-card { transition: all 0.3s; cursor: pointer; }
.tutorial-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(236,72,153,0.1); }
.difficulty { display: flex; gap: 2px; }
.difficulty .dot { width: 8px; height: 8px; border-radius: 50%; background: #e5e7eb; }
.difficulty .dot.filled { background: #ec4899; }
.step-num { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
</style>
</head>
<body>

<!-- Nav -->
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-pink-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2">
      <span class="text-xl">✂️</span>
      <span class="text-lg font-bold text-gray-800">手作人</span>
      <span class="text-xs text-craft-500 font-semibold">CraftMaker</span>
    </div>
    <div class="flex items-center gap-6 text-sm font-medium text-gray-500">
      <a class="hover:text-craft-500 transition cursor-pointer">教學</a>
      <a class="hover:text-craft-500 transition cursor-pointer">作品牆</a>
      <a class="hover:text-craft-500 transition cursor-pointer">材料包</a>
      <a class="hover:text-craft-500 transition cursor-pointer">關於</a>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="py-14 bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-10">
    <div class="flex-1">
      <span class="inline-block text-xs bg-craft-500 text-white px-3 py-1 rounded-full mb-3 font-semibold">🌟 本週精選</span>
      <h1 class="text-3xl font-bold text-gray-800 leading-snug mb-3">手縫迷你皮革錢包<br>零基礎也能上手！</h1>
      <p class="text-gray-500 mb-5 text-sm leading-relaxed">只需要基本工具和一片植鞣皮革，跟著步驟做出你的第一個手作皮件。</p>
      <div class="flex items-center gap-4 mb-5">
        <div class="flex items-center gap-1 text-xs text-gray-400"><span>⏱</span> 2 小時</div>
        <div class="flex items-center gap-1 text-xs text-gray-400"><span>💰</span> NT$ 350</div>
        <div class="flex items-center gap-1 text-xs">
          <span class="text-gray-400">難度</span>
          <div class="difficulty"><div class="dot filled"></div><div class="dot filled"></div><div class="dot"></div><div class="dot"></div></div>
        </div>
      </div>
      <button class="bg-craft-500 hover:bg-craft-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition">開始教學 →</button>
    </div>
    <div class="w-72 h-72 rounded-3xl bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center text-8xl shadow-lg">👜</div>
  </div>
</section>

<!-- Categories -->
<section class="max-w-6xl mx-auto px-6 py-8">
  <div class="grid grid-cols-6 gap-3">
    <div class="bg-white rounded-xl p-3 text-center border border-pink-50 hover:border-craft-300 transition cursor-pointer">
      <div class="text-2xl mb-1">🧶</div><div class="text-xs font-medium text-gray-600">編織</div>
    </div>
    <div class="bg-white rounded-xl p-3 text-center border border-pink-50 hover:border-craft-300 transition cursor-pointer">
      <div class="text-2xl mb-1">🪡</div><div class="text-xs font-medium text-gray-600">刺繡</div>
    </div>
    <div class="bg-white rounded-xl p-3 text-center border border-pink-50 hover:border-craft-300 transition cursor-pointer">
      <div class="text-2xl mb-1">🏺</div><div class="text-xs font-medium text-gray-600">陶藝</div>
    </div>
    <div class="bg-white rounded-xl p-3 text-center border border-pink-50 hover:border-craft-300 transition cursor-pointer">
      <div class="text-2xl mb-1">🕯️</div><div class="text-xs font-medium text-gray-600">蠟燭</div>
    </div>
    <div class="bg-white rounded-xl p-3 text-center border border-pink-50 hover:border-craft-300 transition cursor-pointer">
      <div class="text-2xl mb-1">🧴</div><div class="text-xs font-medium text-gray-600">手工皂</div>
    </div>
    <div class="bg-white rounded-xl p-3 text-center border border-pink-50 hover:border-craft-300 transition cursor-pointer">
      <div class="text-2xl mb-1">📿</div><div class="text-xs font-medium text-gray-600">飾品</div>
    </div>
  </div>
</section>

<!-- Tutorial Grid -->
<section class="max-w-6xl mx-auto px-6 pb-12">
  <h2 class="text-xl font-bold text-gray-800 mb-6">最新教學</h2>
  <div class="grid grid-cols-3 gap-5">
    <div class="tutorial-card bg-white rounded-2xl overflow-hidden border border-pink-50">
      <div class="h-40 bg-gradient-to-br from-violet-200 to-purple-300 flex items-center justify-center text-5xl relative">🧶
        <span class="absolute top-2 right-2 text-xs bg-white/90 px-2 py-0.5 rounded-full text-gray-500 font-medium">編織</span>
      </div>
      <div class="p-4">
        <h3 class="font-bold text-gray-800 mb-1">北歐風漁夫帽</h3>
        <p class="text-xs text-gray-400 mb-3">粗針織的溫暖質感，初學者也能完成的冬日單品</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 text-xs text-gray-400">
            <span>⏱ 4hr</span>
            <div class="difficulty"><div class="dot filled"></div><div class="dot filled"></div><div class="dot filled"></div><div class="dot"></div></div>
          </div>
          <span class="text-xs text-craft-500 font-semibold">❤️ 234</span>
        </div>
      </div>
    </div>
    <div class="tutorial-card bg-white rounded-2xl overflow-hidden border border-pink-50">
      <div class="h-40 bg-gradient-to-br from-amber-200 to-yellow-300 flex items-center justify-center text-5xl relative">🕯️
        <span class="absolute top-2 right-2 text-xs bg-white/90 px-2 py-0.5 rounded-full text-gray-500 font-medium">蠟燭</span>
      </div>
      <div class="p-4">
        <h3 class="font-bold text-gray-800 mb-1">大理石紋香氛蠟燭</h3>
        <p class="text-xs text-gray-400 mb-3">雙色倒蠟技法打造天然石紋效果，加入精油超療癒</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 text-xs text-gray-400">
            <span>⏱ 1.5hr</span>
            <div class="difficulty"><div class="dot filled"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
          </div>
          <span class="text-xs text-craft-500 font-semibold">❤️ 189</span>
        </div>
      </div>
    </div>
    <div class="tutorial-card bg-white rounded-2xl overflow-hidden border border-pink-50">
      <div class="h-40 bg-gradient-to-br from-teal-200 to-emerald-300 flex items-center justify-center text-5xl relative">🏺
        <span class="absolute top-2 right-2 text-xs bg-white/90 px-2 py-0.5 rounded-full text-gray-500 font-medium">陶藝</span>
      </div>
      <div class="p-4">
        <h3 class="font-bold text-gray-800 mb-1">手捏不規則花器</h3>
        <p class="text-xs text-gray-400 mb-3">不需要拉坯機！用手捏出有溫度的 wabi-sabi 風花器</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 text-xs text-gray-400">
            <span>⏱ 3hr</span>
            <div class="difficulty"><div class="dot filled"></div><div class="dot filled"></div><div class="dot"></div><div class="dot"></div></div>
          </div>
          <span class="text-xs text-craft-500 font-semibold">❤️ 312</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Step Preview -->
<section class="bg-white border-t border-pink-50 py-12">
  <div class="max-w-4xl mx-auto px-6">
    <h2 class="text-xl font-bold text-gray-800 mb-6 text-center">教學預覽 — 皮革錢包</h2>
    <div class="space-y-4">
      <div class="flex items-start gap-4 p-4 rounded-xl bg-craft-50/50">
        <div class="step-num bg-craft-500 text-white">1</div>
        <div><div class="font-semibold text-gray-800 text-sm">裁切皮革</div><div class="text-xs text-gray-400 mt-0.5">用美工刀沿著紙型裁切出錢包的三個部件：主體、卡夾層、零錢袋</div></div>
      </div>
      <div class="flex items-start gap-4 p-4 rounded-xl hover:bg-pink-50/50 transition">
        <div class="step-num bg-craft-200 text-craft-600">2</div>
        <div><div class="font-semibold text-gray-800 text-sm">打孔定位</div><div class="text-xs text-gray-400 mt-0.5">使用菱斬在邊緣等距打孔，間距建議 4mm</div></div>
      </div>
      <div class="flex items-start gap-4 p-4 rounded-xl hover:bg-pink-50/50 transition">
        <div class="step-num bg-craft-200 text-craft-600">3</div>
        <div><div class="font-semibold text-gray-800 text-sm">手縫組合</div><div class="text-xs text-gray-400 mt-0.5">雙針馬鞍縫法，縫合卡夾層與主體</div></div>
      </div>
      <div class="flex items-start gap-4 p-4 rounded-xl hover:bg-pink-50/50 transition">
        <div class="step-num bg-craft-200 text-craft-600">4</div>
        <div><div class="font-semibold text-gray-800 text-sm">封邊打磨</div><div class="text-xs text-gray-400 mt-0.5">塗抹邊油並用打磨棒反覆拋光至光滑</div></div>
      </div>
    </div>
    <div class="text-center mt-6">
      <button class="bg-craft-500 hover:bg-craft-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition">查看完整教學 →</button>
    </div>
  </div>
</section>

<!-- Material List -->
<section class="max-w-6xl mx-auto px-6 py-12">
  <h2 class="text-xl font-bold text-gray-800 mb-6">📦 材料包推薦</h2>
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-white rounded-xl p-4 border border-pink-50 flex gap-4 hover:shadow-md transition cursor-pointer">
      <div class="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center text-3xl flex-shrink-0">👜</div>
      <div class="flex-1">
        <h3 class="font-bold text-gray-800 text-sm">皮革錢包材料包</h3>
        <div class="text-xs text-gray-400 mt-0.5">含植鞣皮+工具+教學</div>
        <div class="text-craft-500 font-bold mt-2">NT$ 680</div>
      </div>
    </div>
    <div class="bg-white rounded-xl p-4 border border-pink-50 flex gap-4 hover:shadow-md transition cursor-pointer">
      <div class="w-20 h-20 rounded-lg bg-gradient-to-br from-violet-100 to-purple-200 flex items-center justify-center text-3xl flex-shrink-0">🧶</div>
      <div class="flex-1">
        <h3 class="font-bold text-gray-800 text-sm">漁夫帽毛線材料包</h3>
        <div class="text-xs text-gray-400 mt-0.5">含毛線+棒針+紙型</div>
        <div class="text-craft-500 font-bold mt-2">NT$ 450</div>
      </div>
    </div>
    <div class="bg-white rounded-xl p-4 border border-pink-50 flex gap-4 hover:shadow-md transition cursor-pointer">
      <div class="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-200 flex items-center justify-center text-3xl flex-shrink-0">🕯️</div>
      <div class="flex-1">
        <h3 class="font-bold text-gray-800 text-sm">香氛蠟燭材料包</h3>
        <div class="text-xs text-gray-400 mt-0.5">含蠟+精油+容器</div>
        <div class="text-craft-500 font-bold mt-2">NT$ 520</div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
    <div class="flex items-center gap-2">
      <span>✂️</span>
      <span class="text-white font-bold">手作人</span>
    </div>
    <div class="text-xs">© 2026 CraftMaker. All Rights Reserved.</div>
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
