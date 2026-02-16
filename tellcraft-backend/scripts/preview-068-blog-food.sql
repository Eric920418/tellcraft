INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '23821022-5839-4a77-a488-9e4c7b456ca5',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>食光記 FoodieTime</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        warm: { 50:'#fefce8', 100:'#fef9c3', 200:'#fef08a', 300:'#fde047', 400:'#facc15', 500:'#eab308' },
        spice: { 50:'#fff7ed', 100:'#ffedd5', 400:'#fb923c', 500:'#f97316', 600:'#ea580c' },
        basil: { 50:'#f0fdf4', 400:'#4ade80', 500:'#22c55e', 600:'#16a34a' }
      }
    }
  }
}
</script>
<style>
body { font-family: 'Noto Sans TC', sans-serif; background: #fffdf7; }
.serif { font-family: 'Noto Serif TC', serif; }
.recipe-card { transition: transform 0.3s, box-shadow 0.3s; cursor: pointer; }
.recipe-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.08); }
.tag-btn { transition: all 0.2s; cursor: pointer; }
.tag-btn:hover, .tag-btn.active { background: #f97316; color: white; }
.fade-in { animation: fadeIn 0.6s ease; }
@keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
</style>
</head>
<body>

<!-- Nav -->
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-amber-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-2">
      <span class="text-2xl">🍳</span>
      <span class="serif text-xl font-bold text-gray-800">食光記</span>
      <span class="text-xs text-spice-500 font-medium ml-1">FoodieTime</span>
    </div>
    <div class="flex items-center gap-6 text-sm font-medium text-gray-600">
      <a class="hover:text-spice-500 transition cursor-pointer">食譜</a>
      <a class="hover:text-spice-500 transition cursor-pointer">餐廳探店</a>
      <a class="hover:text-spice-500 transition cursor-pointer">食材百科</a>
      <a class="hover:text-spice-500 transition cursor-pointer">關於我</a>
      <div class="w-8 h-8 rounded-full bg-spice-50 flex items-center justify-center">
        <svg class="w-4 h-4 text-spice-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      </div>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 py-16">
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-12">
    <div class="flex-1">
      <span class="inline-block text-xs bg-spice-500 text-white px-3 py-1 rounded-full mb-4 font-medium">✨ 本週推薦</span>
      <h1 class="serif text-4xl font-bold text-gray-800 leading-snug mb-3">冬日暖胃<br>手作味噌拉麵</h1>
      <p class="text-gray-500 leading-relaxed mb-6">用自製叉燒和溏心蛋，在寒冷冬天煮一碗暖心拉麵。從高湯熬製到配料準備，完整教學讓你在家也能做出店級美味。</p>
      <div class="flex items-center gap-4">
        <button class="bg-spice-500 hover:bg-spice-600 text-white px-6 py-2.5 rounded-full text-sm font-medium transition">閱讀食譜 →</button>
        <div class="flex items-center gap-2 text-sm text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span>45 分鐘</span>
          <span class="mx-1">·</span>
          <span>中等難度</span>
        </div>
      </div>
    </div>
    <div class="w-80 h-80 rounded-3xl bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center text-8xl shadow-lg shadow-orange-100">
      🍜
    </div>
  </div>
</section>

<!-- Categories -->
<section class="max-w-6xl mx-auto px-6 py-8">
  <div class="flex items-center gap-3 flex-wrap">
    <span class="text-sm font-medium text-gray-500 mr-2">分類：</span>
    <button class="tag-btn active px-4 py-1.5 rounded-full text-sm border border-spice-200 font-medium">全部</button>
    <button class="tag-btn px-4 py-1.5 rounded-full text-sm border border-gray-200 text-gray-500">🍝 義式</button>
    <button class="tag-btn px-4 py-1.5 rounded-full text-sm border border-gray-200 text-gray-500">🍣 日式</button>
    <button class="tag-btn px-4 py-1.5 rounded-full text-sm border border-gray-200 text-gray-500">🥘 中式</button>
    <button class="tag-btn px-4 py-1.5 rounded-full text-sm border border-gray-200 text-gray-500">🧁 甜點</button>
    <button class="tag-btn px-4 py-1.5 rounded-full text-sm border border-gray-200 text-gray-500">🥗 輕食</button>
    <button class="tag-btn px-4 py-1.5 rounded-full text-sm border border-gray-200 text-gray-500">🍸 飲品</button>
  </div>
</section>

<!-- Recipe Grid -->
<section class="max-w-6xl mx-auto px-6 pb-12">
  <div class="grid grid-cols-3 gap-6">
    <!-- Card 1 -->
    <div class="recipe-card bg-white rounded-2xl overflow-hidden border border-amber-50">
      <div class="h-48 bg-gradient-to-br from-rose-200 to-red-300 flex items-center justify-center text-6xl relative">
        🍝
        <span class="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs px-2 py-0.5 rounded-full text-spice-600 font-medium">義式</span>
      </div>
      <div class="p-5">
        <h3 class="serif text-lg font-bold text-gray-800 mb-1">奶油松露義大利麵</h3>
        <p class="text-sm text-gray-400 mb-3 line-clamp-2">簡單卻驚艷的松露風味，只需 20 分鐘就能端上桌的高級感晚餐</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 text-xs text-gray-400">
            <span class="flex items-center gap-1">⏱ 20 min</span>
            <span class="flex items-center gap-1">📊 簡單</span>
          </div>
          <div class="flex items-center gap-1 text-xs text-amber-500">❤️ 328</div>
        </div>
      </div>
    </div>
    <!-- Card 2 -->
    <div class="recipe-card bg-white rounded-2xl overflow-hidden border border-amber-50">
      <div class="h-48 bg-gradient-to-br from-emerald-200 to-teal-300 flex items-center justify-center text-6xl relative">
        🥗
        <span class="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs px-2 py-0.5 rounded-full text-basil-600 font-medium">輕食</span>
      </div>
      <div class="p-5">
        <h3 class="serif text-lg font-bold text-gray-800 mb-1">酪梨鮮蝦沙拉碗</h3>
        <p class="text-sm text-gray-400 mb-3 line-clamp-2">清爽不油膩的高蛋白料理，搭配自製柑橘油醋醬更加分</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 text-xs text-gray-400">
            <span class="flex items-center gap-1">⏱ 15 min</span>
            <span class="flex items-center gap-1">📊 簡單</span>
          </div>
          <div class="flex items-center gap-1 text-xs text-amber-500">❤️ 215</div>
        </div>
      </div>
    </div>
    <!-- Card 3 -->
    <div class="recipe-card bg-white rounded-2xl overflow-hidden border border-amber-50">
      <div class="h-48 bg-gradient-to-br from-amber-200 to-yellow-300 flex items-center justify-center text-6xl relative">
        🧁
        <span class="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs px-2 py-0.5 rounded-full text-amber-600 font-medium">甜點</span>
      </div>
      <div class="p-5">
        <h3 class="serif text-lg font-bold text-gray-800 mb-1">巴斯克焦香起司蛋糕</h3>
        <p class="text-sm text-gray-400 mb-3 line-clamp-2">外焦內融的經典甜點，5 種材料零失敗配方大公開</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 text-xs text-gray-400">
            <span class="flex items-center gap-1">⏱ 60 min</span>
            <span class="flex items-center gap-1">📊 中等</span>
          </div>
          <div class="flex items-center gap-1 text-xs text-amber-500">❤️ 567</div>
        </div>
      </div>
    </div>
    <!-- Card 4 -->
    <div class="recipe-card bg-white rounded-2xl overflow-hidden border border-amber-50">
      <div class="h-48 bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center text-6xl relative">
        🥘
        <span class="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs px-2 py-0.5 rounded-full text-red-600 font-medium">中式</span>
      </div>
      <div class="p-5">
        <h3 class="serif text-lg font-bold text-gray-800 mb-1">紅燒牛腩煲</h3>
        <p class="text-sm text-gray-400 mb-3 line-clamp-2">滷到入口即化的牛腩，搭配白蘿蔔吸飽濃郁湯汁的療癒料理</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 text-xs text-gray-400">
            <span class="flex items-center gap-1">⏱ 120 min</span>
            <span class="flex items-center gap-1">📊 中等</span>
          </div>
          <div class="flex items-center gap-1 text-xs text-amber-500">❤️ 412</div>
        </div>
      </div>
    </div>
    <!-- Card 5 -->
    <div class="recipe-card bg-white rounded-2xl overflow-hidden border border-amber-50">
      <div class="h-48 bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center text-6xl relative">
        🍣
        <span class="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs px-2 py-0.5 rounded-full text-rose-600 font-medium">日式</span>
      </div>
      <div class="p-5">
        <h3 class="serif text-lg font-bold text-gray-800 mb-1">炙燒鮭魚散壽司</h3>
        <p class="text-sm text-gray-400 mb-3 line-clamp-2">在家用噴槍做出居酒屋級別的炙燒散壽司，視覺味覺雙享受</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 text-xs text-gray-400">
            <span class="flex items-center gap-1">⏱ 30 min</span>
            <span class="flex items-center gap-1">📊 進階</span>
          </div>
          <div class="flex items-center gap-1 text-xs text-amber-500">❤️ 389</div>
        </div>
      </div>
    </div>
    <!-- Card 6 -->
    <div class="recipe-card bg-white rounded-2xl overflow-hidden border border-amber-50">
      <div class="h-48 bg-gradient-to-br from-purple-200 to-violet-300 flex items-center justify-center text-6xl relative">
        🍸
        <span class="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs px-2 py-0.5 rounded-full text-violet-600 font-medium">飲品</span>
      </div>
      <div class="p-5">
        <h3 class="serif text-lg font-bold text-gray-800 mb-1">藍莓薰衣草氣泡飲</h3>
        <p class="text-sm text-gray-400 mb-3 line-clamp-2">顏值爆表的紫色漸層飲品，自製糖漿配方讓你的下午茶升級</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 text-xs text-gray-400">
            <span class="flex items-center gap-1">⏱ 10 min</span>
            <span class="flex items-center gap-1">📊 簡單</span>
          </div>
          <div class="flex items-center gap-1 text-xs text-amber-500">❤️ 198</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Restaurant Reviews -->
<section class="bg-white border-t border-amber-50 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="serif text-2xl font-bold text-gray-800">🏪 最新探店</h2>
      <a class="text-sm text-spice-500 hover:text-spice-600 cursor-pointer transition font-medium">查看全部 →</a>
    </div>
    <div class="grid grid-cols-2 gap-6">
      <div class="flex gap-4 p-4 rounded-xl hover:bg-amber-50/50 transition cursor-pointer">
        <div class="w-28 h-28 rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center text-4xl flex-shrink-0">🍕</div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-bold text-gray-800">Napoli Pizzeria</h3>
            <span class="text-xs bg-warm-100 text-warm-500 px-2 py-0.5 rounded-full font-medium">4.8 ★</span>
          </div>
          <p class="text-sm text-gray-400 mb-2">大安區 · 義式窯烤</p>
          <p class="text-sm text-gray-500 line-clamp-2">道地拿坡里窯烤披薩，莫扎瑞拉起司如瀑布般拉絲，酥脆薄餅皮搭配新鮮番茄醬底...</p>
        </div>
      </div>
      <div class="flex gap-4 p-4 rounded-xl hover:bg-amber-50/50 transition cursor-pointer">
        <div class="w-28 h-28 rounded-xl bg-gradient-to-br from-green-300 to-emerald-400 flex items-center justify-center text-4xl flex-shrink-0">🍵</div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-bold text-gray-800">靜巷茶屋</h3>
            <span class="text-xs bg-warm-100 text-warm-500 px-2 py-0.5 rounded-full font-medium">4.6 ★</span>
          </div>
          <p class="text-sm text-gray-400 mb-2">松山區 · 日式抹茶</p>
          <p class="text-sm text-gray-500 line-clamp-2">隱身巷弄的日式茶屋，每日限量手刷抹茶搭配自製和菓子，空間寧靜優雅...</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-gray-900 text-gray-400 py-10">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xl">🍳</span>
        <span class="serif text-white font-bold">食光記</span>
      </div>
      <div class="flex items-center gap-6 text-sm">
        <a class="hover:text-white transition cursor-pointer">食譜</a>
        <a class="hover:text-white transition cursor-pointer">探店</a>
        <a class="hover:text-white transition cursor-pointer">食材</a>
        <a class="hover:text-white transition cursor-pointer">聯繫我</a>
      </div>
    </div>
    <div class="mt-6 pt-6 border-t border-gray-800 text-xs text-center text-gray-500">© 2026 食光記 FoodieTime. All Rights Reserved.</div>
  </div>
</footer>

<script>
document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
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
