INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'ffb0ebd4-5336-42b3-92e7-3341f020133d',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>潮流誌 TrendMag</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { mag: { 50:'#fff1f2',100:'#ffe4e6',400:'#fb7185',500:'#f43f5e',600:'#e11d48' } } } } } }
</script>
<style>
body { font-family: 'DM Sans', sans-serif; background: #fafafa; }
.serif { font-family: 'Playfair Display', serif; }
.article-card { transition: all 0.3s; cursor: pointer; }
.article-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(244,63,94,0.08); }
.category-btn { transition: all 0.2s; }
.category-btn.active { background: #1a1a1a; color: white; }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white border-b border-gray-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-3"><span class="serif text-2xl font-extrabold text-gray-900 tracking-tight">TREND</span><span class="text-[10px] text-mag-500 font-bold tracking-widest">MAG</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-500 font-medium">
      <a class="hover:text-gray-900 transition cursor-pointer">時尚</a>
      <a class="hover:text-gray-900 transition cursor-pointer">文化</a>
      <a class="hover:text-gray-900 transition cursor-pointer">生活</a>
      <a class="hover:text-gray-900 transition cursor-pointer">人物</a>
      <a class="hover:text-gray-900 transition cursor-pointer">影音</a>
      <button onclick="document.getElementById('subscribeModal').classList.remove('hidden')" class="bg-gray-900 hover:bg-gray-800 text-white px-4 py-1.5 rounded-full text-sm font-medium transition cursor-pointer">訂閱</button>
    </div>
  </div>
</nav>

<!-- Hero Feature -->
<section class="max-w-6xl mx-auto px-6 py-8">
  <div class="grid grid-cols-2 gap-6">
    <div class="article-card relative h-[420px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex items-end">
      <div class="absolute inset-0 flex items-center justify-center text-[120px] opacity-50">👗</div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
      <div class="relative p-8">
        <span class="text-xs bg-mag-500 text-white px-2 py-0.5 rounded-full font-bold">封面故事</span>
        <h2 class="serif text-3xl font-bold text-white mt-3 leading-snug">2026 春夏時裝週<br>關鍵趨勢全解析</h2>
        <p class="text-gray-300 text-sm mt-2 max-w-xs">從極簡主義回歸到大膽解構，四大時裝之都帶來的啟示</p>
        <div class="flex items-center gap-3 mt-3 text-xs text-gray-400"><span>Emily Wang</span><span>·</span><span>12 min</span><span>·</span><span>2026/02/15</span></div>
      </div>
    </div>
    <div class="grid grid-rows-2 gap-4">
      <div class="article-card relative h-full rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-400 to-violet-600 flex items-end">
        <div class="absolute inset-0 flex items-center justify-center text-7xl opacity-40">🎬</div>
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div class="relative p-5">
          <span class="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">文化</span>
          <h3 class="serif text-xl font-bold text-white mt-2">奧斯卡前哨戰：五部必看的藝術電影</h3>
          <div class="text-xs text-gray-300 mt-1">James Liu · 8 min</div>
        </div>
      </div>
      <div class="article-card relative h-full rounded-2xl overflow-hidden bg-gradient-to-br from-amber-400 to-orange-600 flex items-end">
        <div class="absolute inset-0 flex items-center justify-center text-7xl opacity-40">🏠</div>
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div class="relative p-5">
          <span class="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">生活</span>
          <h3 class="serif text-xl font-bold text-white mt-2">侘寂美學：用不完美打造完美居家</h3>
          <div class="text-xs text-gray-300 mt-1">Sophie Chen · 6 min</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Category Filter -->
<section class="max-w-6xl mx-auto px-6">
  <div class="flex items-center gap-2 py-4 border-y border-gray-100">
    <span class="text-xs text-gray-400 mr-2">探索：</span>
    <button onclick="filterCategory(this,'all')" class="category-btn active px-4 py-1.5 rounded-full text-xs font-medium bg-gray-900 text-white cursor-pointer">全部</button>
    <button onclick="filterCategory(this,'fashion')" class="category-btn px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 cursor-pointer">時尚</button>
    <button onclick="filterCategory(this,'culture')" class="category-btn px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 cursor-pointer">文化</button>
    <button onclick="filterCategory(this,'lifestyle')" class="category-btn px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 cursor-pointer">生活</button>
    <button onclick="filterCategory(this,'people')" class="category-btn px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 cursor-pointer">人物</button>
  </div>
</section>

<!-- Articles Grid -->
<section class="max-w-6xl mx-auto px-6 py-10">
  <div class="grid grid-cols-3 gap-6">
    <div class="article-card bg-white rounded-xl overflow-hidden border border-gray-100" data-category="fashion">
      <div class="h-48 bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center text-5xl">👠</div>
      <div class="p-5"><span class="text-[10px] bg-mag-50 text-mag-500 px-2 py-0.5 rounded-full font-bold">時尚</span><h3 class="font-bold text-gray-800 mt-2 leading-snug">新銳設計師 Iris Wang 的永續時尚革命</h3><p class="text-xs text-gray-400 mt-2 line-clamp-2">用回收海洋塑料製作高級訂製服，她正在改寫時尚產業的規則。</p><div class="flex items-center gap-2 mt-3 text-xs text-gray-400"><span>Nina Huang</span><span>·</span><span>7 min</span></div></div>
    </div>
    <div class="article-card bg-white rounded-xl overflow-hidden border border-gray-100" data-category="people">
      <div class="h-48 bg-gradient-to-br from-teal-200 to-emerald-300 flex items-center justify-center text-5xl">🧑‍🎤</div>
      <div class="p-5"><span class="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">人物</span><h3 class="font-bold text-gray-800 mt-2 leading-snug">專訪：90 後導演的獨立電影之路</h3><p class="text-xs text-gray-400 mt-2 line-clamp-2">「我不想拍商業片，我只想拍讓人在散場後還會想起的東西。」</p><div class="flex items-center gap-2 mt-3 text-xs text-gray-400"><span>James Liu</span><span>·</span><span>10 min</span></div></div>
    </div>
    <div class="article-card bg-white rounded-xl overflow-hidden border border-gray-100" data-category="lifestyle">
      <div class="h-48 bg-gradient-to-br from-amber-200 to-yellow-300 flex items-center justify-center text-5xl">☕</div>
      <div class="p-5"><span class="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold">生活</span><h3 class="font-bold text-gray-800 mt-2 leading-snug">第三波咖啡浪潮：台北 8 家隱藏版自烘豆店</h3><p class="text-xs text-gray-400 mt-2 line-clamp-2">從日式淺焙到北歐極淺，這些店主正在重新定義台北的咖啡風景。</p><div class="flex items-center gap-2 mt-3 text-xs text-gray-400"><span>Sophie Chen</span><span>·</span><span>6 min</span></div></div>
    </div>
    <div class="article-card bg-white rounded-xl overflow-hidden border border-gray-100" data-category="culture">
      <div class="h-48 bg-gradient-to-br from-violet-200 to-purple-300 flex items-center justify-center text-5xl">🎵</div>
      <div class="p-5"><span class="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-bold">文化</span><h3 class="font-bold text-gray-800 mt-2 leading-snug">AI 生成音樂是藝術還是工具？音樂人怎麼看</h3><p class="text-xs text-gray-400 mt-2 line-clamp-2">Suno 和 Udio 讓任何人都能「作曲」，但這對職業音樂人意味著什麼？</p><div class="flex items-center gap-2 mt-3 text-xs text-gray-400"><span>David Wu</span><span>·</span><span>9 min</span></div></div>
    </div>
    <div class="article-card bg-white rounded-xl overflow-hidden border border-gray-100" data-category="fashion">
      <div class="h-48 bg-gradient-to-br from-gray-200 to-slate-300 flex items-center justify-center text-5xl">🕶️</div>
      <div class="p-5"><span class="text-[10px] bg-mag-50 text-mag-500 px-2 py-0.5 rounded-full font-bold">時尚</span><h3 class="font-bold text-gray-800 mt-2 leading-snug">靜奢風已死？2026 的穿搭新哲學</h3><p class="text-xs text-gray-400 mt-2 line-clamp-2">告別 quiet luxury，新一代消費者用混搭與二手古著表達態度。</p><div class="flex items-center gap-2 mt-3 text-xs text-gray-400"><span>Emily Wang</span><span>·</span><span>5 min</span></div></div>
    </div>
    <div class="article-card bg-white rounded-xl overflow-hidden border border-gray-100" data-category="lifestyle">
      <div class="h-48 bg-gradient-to-br from-blue-200 to-cyan-300 flex items-center justify-center text-5xl">🧘</div>
      <div class="p-5"><span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">生活</span><h3 class="font-bold text-gray-800 mt-2 leading-snug">數位斷食 30 天：我的身心變化實錄</h3><p class="text-xs text-gray-400 mt-2 line-clamp-2">沒有社群媒體的一個月，焦慮消失了，但 FOMO 也意外地加劇了。</p><div class="flex items-center gap-2 mt-3 text-xs text-gray-400"><span>Mia Lin</span><span>·</span><span>8 min</span></div></div>
    </div>
  </div>
</section>

<!-- Editor's Pick -->
<section class="bg-gray-900 text-white py-14">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between mb-8"><h2 class="serif text-2xl font-bold">編輯精選</h2><span class="text-xs text-gray-500">本月最受歡迎</span></div>
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-mag-500/30 transition cursor-pointer"><span class="serif text-3xl font-bold text-mag-400">01</span><h4 class="font-bold mt-2 text-sm">2026 春夏時裝週關鍵趨勢全解析</h4><div class="text-xs text-gray-500 mt-2">23,456 閱讀</div></div>
      <div class="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-mag-500/30 transition cursor-pointer"><span class="serif text-3xl font-bold text-mag-400">02</span><h4 class="font-bold mt-2 text-sm">AI 生成音樂是藝術還是工具？</h4><div class="text-xs text-gray-500 mt-2">18,902 閱讀</div></div>
      <div class="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-mag-500/30 transition cursor-pointer"><span class="serif text-3xl font-bold text-mag-400">03</span><h4 class="font-bold mt-2 text-sm">第三波咖啡浪潮：8 家隱藏版店</h4><div class="text-xs text-gray-500 mt-2">15,677 閱讀</div></div>
      <div class="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-mag-500/30 transition cursor-pointer"><span class="serif text-3xl font-bold text-mag-400">04</span><h4 class="font-bold mt-2 text-sm">數位斷食 30 天：身心變化實錄</h4><div class="text-xs text-gray-500 mt-2">12,340 閱讀</div></div>
    </div>
  </div>
</section>

<!-- Subscribe Section -->
<section class="max-w-6xl mx-auto px-6 py-14">
  <div class="bg-gradient-to-br from-mag-500 to-rose-600 rounded-2xl p-10 text-center text-white">
    <h2 class="serif text-3xl font-bold mb-2">不想錯過任何一篇？</h2>
    <p class="text-white/80 text-sm mb-6">訂閱潮流誌，每週收到精選文章推播</p>
    <div class="flex gap-2 max-w-md mx-auto">
      <input type="email" placeholder="your@email.com" class="flex-1 px-4 py-3 rounded-full text-sm text-gray-800 outline-none">
      <button onclick="document.getElementById('subscribeModal').classList.remove('hidden')" class="bg-gray-900 text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-gray-800 transition cursor-pointer">訂閱</button>
    </div>
  </div>
</section>

<!-- Writers -->
<section class="bg-gray-50 border-t border-gray-100 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-xl font-bold text-gray-800 mb-6 text-center">撰稿團隊</h2>
    <div class="grid grid-cols-4 gap-5">
      <div class="text-center"><div class="w-16 h-16 rounded-full bg-pink-200 flex items-center justify-center mx-auto mb-2 text-2xl">👩</div><h4 class="font-bold text-gray-800 text-sm">Emily Wang</h4><div class="text-xs text-mag-500">時尚主編</div></div>
      <div class="text-center"><div class="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center mx-auto mb-2 text-2xl">👨</div><h4 class="font-bold text-gray-800 text-sm">James Liu</h4><div class="text-xs text-mag-500">文化記者</div></div>
      <div class="text-center"><div class="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center mx-auto mb-2 text-2xl">👩</div><h4 class="font-bold text-gray-800 text-sm">Sophie Chen</h4><div class="text-xs text-mag-500">生活編輯</div></div>
      <div class="text-center"><div class="w-16 h-16 rounded-full bg-green-200 flex items-center justify-center mx-auto mb-2 text-2xl">👨</div><h4 class="font-bold text-gray-800 text-sm">David Wu</h4><div class="text-xs text-mag-500">科技專欄</div></div>
    </div>
  </div>
</section>

<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
    <div class="flex items-center gap-2"><span class="serif text-white font-extrabold tracking-tight">TREND</span><span class="text-[10px] text-mag-400">MAG</span></div>
    <div class="flex gap-4 text-xs"><a class="hover:text-white cursor-pointer">Instagram</a><a class="hover:text-white cursor-pointer">Twitter</a><a class="hover:text-white cursor-pointer">Facebook</a><a class="hover:text-white cursor-pointer">YouTube</a></div>
    <div class="text-xs">© 2026 潮流誌</div>
  </div>
</footer>

<!-- Subscribe Modal -->
<div id="subscribeModal" class="hidden fixed inset-0 z-50 flex items-center justify-center">
  <div class="absolute inset-0 bg-black/50" onclick="document.getElementById('subscribeModal').classList.add('hidden')"></div>
  <div class="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
    <button onclick="document.getElementById('subscribeModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer text-lg">✕</button>
    <div class="text-center">
      <h3 class="serif text-2xl font-bold text-gray-800 mb-2">訂閱潮流誌</h3>
      <p class="text-sm text-gray-500 mb-6">選擇你感興趣的主題</p>
      <div class="flex flex-wrap gap-2 justify-center mb-4">
        <label class="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full text-xs cursor-pointer hover:bg-gray-100"><input type="checkbox" checked class="accent-mag-500"> 時尚</label>
        <label class="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full text-xs cursor-pointer hover:bg-gray-100"><input type="checkbox" checked class="accent-mag-500"> 文化</label>
        <label class="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full text-xs cursor-pointer hover:bg-gray-100"><input type="checkbox" class="accent-mag-500"> 生活</label>
        <label class="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full text-xs cursor-pointer hover:bg-gray-100"><input type="checkbox" class="accent-mag-500"> 人物</label>
      </div>
      <input type="email" placeholder="你的 Email" class="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-mag-200 mb-3">
      <button onclick="this.textContent='✓ 訂閱成功！';this.classList.replace('bg-gray-900','bg-green-500');setTimeout(()=>{document.getElementById('subscribeModal').classList.add('hidden');this.textContent='立即訂閱';this.classList.replace('bg-green-500','bg-gray-900')},1500)" class="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-bold transition cursor-pointer">立即訂閱</button>
    </div>
  </div>
</div>

<script>
function filterCategory(btn, cat) {
  document.querySelectorAll('.category-btn').forEach(b => { b.classList.remove('active'); b.classList.add('bg-gray-100','text-gray-500'); b.classList.remove('bg-gray-900','text-white'); });
  btn.classList.add('active'); btn.classList.remove('bg-gray-100','text-gray-500'); btn.classList.add('bg-gray-900','text-white');
  document.querySelectorAll('[data-category]').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
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
