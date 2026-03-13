INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '7d17ee32-fe2b-46cb-b172-5941f55ee991',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>構思集 ArchiWorks</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { arch: { 50:'#f5f5f4',100:'#e7e5e4',200:'#d6d3d1',400:'#a8a29e',500:'#78716c',600:'#57534e',800:'#292524',900:'#1c1917' } } } } } }
</script>
<style>
body { font-family: 'DM Sans', sans-serif; background: #fafaf9; }
.serif { font-family: 'Cormorant Garamond', serif; }
.project-card { transition: all 0.4s; cursor: pointer; }
.project-card:hover { transform: scale(1.02); }
.project-card:hover .overlay { opacity: 1; }
.overlay { opacity: 0; transition: opacity 0.3s; }
.filter-btn { transition: all 0.2s; }
.filter-btn.active { background: #1c1917; color: white; }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-3"><div class="w-8 h-8 border-2 border-arch-800 flex items-center justify-center"><div class="w-4 h-4 border border-arch-800"></div></div><span class="serif text-xl font-bold text-arch-900 tracking-wide">ArchiWorks</span></div>
    <div class="flex items-center gap-8 text-sm text-gray-500">
      <a onclick="document.getElementById('works').scrollIntoView({behavior:'smooth'})" class="hover:text-arch-900 transition cursor-pointer">作品</a>
      <a onclick="document.getElementById('philosophy').scrollIntoView({behavior:'smooth'})" class="hover:text-arch-900 transition cursor-pointer">理念</a>
      <a onclick="document.getElementById('team').scrollIntoView({behavior:'smooth'})" class="hover:text-arch-900 transition cursor-pointer">團隊</a>
      <a onclick="document.getElementById('awards').scrollIntoView({behavior:'smooth'})" class="hover:text-arch-900 transition cursor-pointer">獎項</a>
      <a onclick="document.getElementById('process').scrollIntoView({behavior:'smooth'})" class="hover:text-arch-900 transition cursor-pointer">合作流程</a>
      <button onclick="document.getElementById('contactModal').classList.remove('hidden')" class="border border-arch-800 text-arch-800 px-5 py-2 text-sm hover:bg-arch-800 hover:text-white transition cursor-pointer">聯繫我們</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="py-24 relative">
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-16">
    <div class="flex-1">
      <span class="text-xs text-arch-500 tracking-[0.3em] uppercase">Architecture · Interior · Landscape</span>
      <h1 class="serif text-5xl font-bold text-arch-900 leading-tight mt-4 mb-6">以空間為語言<br>書寫生活的詩</h1>
      <p class="text-gray-500 leading-relaxed max-w-md mb-8">構思集建築事務所，成立於 2015 年。我們相信好的建築不只是造型，而是對生活方式的深刻理解。從住宅、商空到公共建築，每個專案都是一次與土地的對話。</p>
      <div class="flex gap-8 text-sm">
        <div><div class="text-3xl font-bold text-arch-900 serif">38</div><div class="text-xs text-gray-400 mt-1">完成專案</div></div>
        <div class="w-px h-12 bg-gray-200"></div>
        <div><div class="text-3xl font-bold text-arch-900 serif">11</div><div class="text-xs text-gray-400 mt-1">年經驗</div></div>
        <div class="w-px h-12 bg-gray-200"></div>
        <div><div class="text-3xl font-bold text-arch-900 serif">7</div><div class="text-xs text-gray-400 mt-1">設計獎項</div></div>
        <div class="w-px h-12 bg-gray-200"></div>
        <div><div class="text-3xl font-bold text-arch-900 serif">12</div><div class="text-xs text-gray-400 mt-1">團隊成員</div></div>
      </div>
    </div>
    <div class="w-96 h-[28rem] bg-gradient-to-b from-arch-100 to-arch-200 rounded-sm flex items-center justify-center text-8xl shadow-lg">🏛️</div>
  </div>
</section>

<!-- Works -->
<section id="works" class="py-16 bg-arch-900 text-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between mb-10">
      <h2 class="serif text-3xl font-bold">精選作品</h2>
      <div class="flex gap-2 text-xs">
        <button onclick="filterWorks(this,'all')" class="filter-btn active px-4 py-1.5 border border-white cursor-pointer">全部</button>
        <button onclick="filterWorks(this,'residential')" class="filter-btn px-4 py-1.5 border border-white/20 text-gray-400 cursor-pointer">住宅</button>
        <button onclick="filterWorks(this,'commercial')" class="filter-btn px-4 py-1.5 border border-white/20 text-gray-400 cursor-pointer">商空</button>
        <button onclick="filterWorks(this,'public')" class="filter-btn px-4 py-1.5 border border-white/20 text-gray-400 cursor-pointer">公共</button>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-4" id="worksGrid">
      <div class="project-card col-span-2 row-span-2 relative aspect-[4/3] bg-gradient-to-br from-stone-700 to-stone-800 rounded-sm overflow-hidden flex items-center justify-center text-7xl" data-type="residential">🏠<div class="overlay absolute inset-0 bg-black/60 flex items-end p-6"><div><span class="text-xs text-amber-300 font-medium tracking-wider uppercase">住宅 · 2025</span><h3 class="serif text-2xl font-bold mt-1">山居歲月</h3><p class="text-sm text-gray-300 mt-1">陽明山 · 清水模住宅 · 420 坪</p><p class="text-xs text-gray-400 mt-2">以山為景框，以光為素材。清水模牆面隨四季光線變化，在室內創造了一幅永遠不重複的畫作。</p></div></div></div>
      <div class="project-card relative aspect-square bg-gradient-to-br from-amber-700 to-amber-800 rounded-sm overflow-hidden flex items-center justify-center text-5xl" data-type="commercial">☕<div class="overlay absolute inset-0 bg-black/60 flex items-end p-4"><div><span class="text-[10px] text-amber-300 tracking-wider uppercase">商空 · 2025</span><h3 class="serif text-lg font-bold mt-1">沈默咖啡</h3><p class="text-xs text-gray-300 mt-0.5">大安區 · 45 坪</p></div></div></div>
      <div class="project-card relative aspect-square bg-gradient-to-br from-slate-600 to-slate-700 rounded-sm overflow-hidden flex items-center justify-center text-5xl" data-type="public">📚<div class="overlay absolute inset-0 bg-black/60 flex items-end p-4"><div><span class="text-[10px] text-amber-300 tracking-wider uppercase">公共 · 2024</span><h3 class="serif text-lg font-bold mt-1">光之圖書館</h3><p class="text-xs text-gray-300 mt-0.5">新竹 · 1,200 坪</p></div></div></div>
      <div class="project-card relative aspect-[2/1] bg-gradient-to-br from-emerald-700 to-emerald-800 rounded-sm overflow-hidden flex items-center justify-center text-5xl" data-type="commercial">🏢<div class="overlay absolute inset-0 bg-black/60 flex items-end p-4"><div><span class="text-[10px] text-amber-300 tracking-wider uppercase">商空 · 2024</span><h3 class="serif text-lg font-bold mt-1">未來辦公室</h3><p class="text-xs text-gray-300 mt-0.5">內湖科技園區 · 800 坪</p></div></div></div>
      <div class="project-card relative aspect-[2/1] bg-gradient-to-br from-rose-700 to-rose-800 rounded-sm overflow-hidden flex items-center justify-center text-5xl" data-type="residential">🏡<div class="overlay absolute inset-0 bg-black/60 flex items-end p-4"><div><span class="text-[10px] text-amber-300 tracking-wider uppercase">住宅 · 2023</span><h3 class="serif text-lg font-bold mt-1">浮光之家</h3><p class="text-xs text-gray-300 mt-0.5">淡水 · 透天厝 · 280 坪</p></div></div></div>
      <div class="project-card relative aspect-[2/1] bg-gradient-to-br from-indigo-700 to-indigo-800 rounded-sm overflow-hidden flex items-center justify-center text-5xl" data-type="public">🎭<div class="overlay absolute inset-0 bg-black/60 flex items-end p-4"><div><span class="text-[10px] text-amber-300 tracking-wider uppercase">公共 · 2023</span><h3 class="serif text-lg font-bold mt-1">竹風藝廊</h3><p class="text-xs text-gray-300 mt-0.5">新竹 · 展覽空間 · 600 坪</p></div></div></div>
    </div>
  </div>
</section>

<!-- Philosophy -->
<section id="philosophy" class="py-16">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold text-arch-900 mb-10 text-center">設計理念</h2>
    <div class="grid grid-cols-3 gap-10">
      <div class="text-center"><div class="w-16 h-16 rounded-full border-2 border-arch-800 flex items-center justify-center mx-auto mb-4 text-2xl">🌿</div><h3 class="font-bold text-arch-900 mb-2">與自然共生</h3><p class="text-xs text-gray-500 leading-relaxed">尊重基地環境，讓建築融入地景而非對抗。我們從風向、日照、植被開始設計，而不是從造型。</p></div>
      <div class="text-center"><div class="w-16 h-16 rounded-full border-2 border-arch-800 flex items-center justify-center mx-auto mb-4 text-2xl">💡</div><h3 class="font-bold text-arch-900 mb-2">光線即素材</h3><p class="text-xs text-gray-500 leading-relaxed">以自然光為核心設計元素，透過開窗、天井、反射面創造會呼吸的空間，讓居住者感受時間的流動。</p></div>
      <div class="text-center"><div class="w-16 h-16 rounded-full border-2 border-arch-800 flex items-center justify-center mx-auto mb-4 text-2xl">🪨</div><h3 class="font-bold text-arch-900 mb-2">誠實的材料</h3><p class="text-xs text-gray-500 leading-relaxed">清水模、實木、石材、鋼鐵。我們讓材料說自己的語言，呈現時間賦予的質地與溫度。</p></div>
    </div>
  </div>
</section>

<!-- Awards -->
<section id="awards" class="bg-gray-50 border-y border-gray-100 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold text-arch-900 mb-8 text-center">獲獎紀錄</h2>
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5 border border-gray-100 text-center hover:shadow-md transition"><div class="text-2xl mb-2">🏆</div><div class="text-sm font-bold text-gray-800">TID Award</div><div class="text-xs text-gray-400 mt-1">台灣室內設計大獎 · 2025</div></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 text-center hover:shadow-md transition"><div class="text-2xl mb-2">🥇</div><div class="text-sm font-bold text-gray-800">iF Design Award</div><div class="text-xs text-gray-400 mt-1">德國 iF 設計獎 · 2024</div></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 text-center hover:shadow-md transition"><div class="text-2xl mb-2">🏅</div><div class="text-sm font-bold text-gray-800">A' Design Award</div><div class="text-xs text-gray-400 mt-1">義大利銀獎 · 2024</div></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 text-center hover:shadow-md transition"><div class="text-2xl mb-2">🎖️</div><div class="text-sm font-bold text-gray-800">ADA 新銳獎</div><div class="text-xs text-gray-400 mt-1">亞洲設計獎 · 2023</div></div>
    </div>
  </div>
</section>

<!-- Team -->
<section id="team" class="py-14">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold text-arch-900 mb-8 text-center">團隊成員</h2>
    <div class="grid grid-cols-4 gap-6">
      <div class="text-center"><div class="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center mx-auto mb-3 text-3xl">👨</div><h3 class="font-bold text-arch-900 text-sm">陳思遠</h3><div class="text-xs text-arch-500">創辦人 · 主持建築師</div><p class="text-[10px] text-gray-400 mt-1">東京大學建築碩士</p></div>
      <div class="text-center"><div class="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center mx-auto mb-3 text-3xl">👩</div><h3 class="font-bold text-arch-900 text-sm">林宜璇</h3><div class="text-xs text-arch-500">合夥人 · 室內設計</div><p class="text-[10px] text-gray-400 mt-1">AA School 碩士</p></div>
      <div class="text-center"><div class="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center mx-auto mb-3 text-3xl">👨</div><h3 class="font-bold text-arch-900 text-sm">張哲維</h3><div class="text-xs text-arch-500">設計總監</div><p class="text-[10px] text-gray-400 mt-1">成大建築碩士</p></div>
      <div class="text-center"><div class="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center mx-auto mb-3 text-3xl">👩</div><h3 class="font-bold text-arch-900 text-sm">吳佩芳</h3><div class="text-xs text-arch-500">景觀設計師</div><p class="text-[10px] text-gray-400 mt-1">Harvard GSD 碩士</p></div>
    </div>
  </div>
</section>

<!-- Process -->
<section id="process" class="bg-arch-900 text-white py-14">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold text-center mb-10">合作流程</h2>
    <div class="grid grid-cols-5 gap-4">
      <div class="text-center"><div class="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-3 serif text-lg font-bold">01</div><h4 class="font-medium text-sm">初步諮詢</h4><p class="text-[10px] text-gray-400 mt-1">了解需求、基地與預算</p></div>
      <div class="text-center"><div class="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-3 serif text-lg font-bold">02</div><h4 class="font-medium text-sm">概念設計</h4><p class="text-[10px] text-gray-400 mt-1">平面配置、空間概念</p></div>
      <div class="text-center"><div class="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-3 serif text-lg font-bold">03</div><h4 class="font-medium text-sm">細部設計</h4><p class="text-[10px] text-gray-400 mt-1">3D 渲染、材料選定</p></div>
      <div class="text-center"><div class="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-3 serif text-lg font-bold">04</div><h4 class="font-medium text-sm">施工監造</h4><p class="text-[10px] text-gray-400 mt-1">全程品質管控</p></div>
      <div class="text-center"><div class="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-3 serif text-lg font-bold">05</div><h4 class="font-medium text-sm">完工交付</h4><p class="text-[10px] text-gray-400 mt-1">竣工驗收、售後保固</p></div>
    </div>
  </div>
</section>

<!-- Testimonial -->
<section class="py-12">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <h2 class="serif text-xl font-bold text-arch-900 mb-6">業主評價</h2>
    <blockquote class="serif text-lg text-gray-600 italic leading-relaxed mb-4">「構思集不只是設計了一棟房子，他們設計了一種生活方式。住進山居歲月的第一天，我就知道這是對的決定。」</blockquote>
    <div class="text-sm text-gray-400">— 李先生，山居歲月業主</div>
  </div>
</section>

<!-- CTA -->
<section class="bg-arch-800 text-white py-12 text-center">
  <h2 class="serif text-2xl font-bold mb-2">有想法想聊聊？</h2>
  <p class="text-gray-400 text-sm mb-6">無論是住宅、商空或公共建築，歡迎預約諮詢</p>
  <button onclick="document.getElementById('contactModal').classList.remove('hidden')" class="border border-white text-white px-10 py-3 hover:bg-white hover:text-arch-900 transition font-medium cursor-pointer">預約諮詢</button>
</section>

<footer class="py-8 border-t border-gray-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
    <div class="flex items-center gap-2"><div class="w-5 h-5 border border-arch-800 flex items-center justify-center"><div class="w-2.5 h-2.5 border border-arch-800"></div></div><span class="serif font-bold text-gray-600">ArchiWorks</span></div>
    <div class="flex gap-4"><a class="hover:text-arch-900 cursor-pointer">ArchDaily</a><a class="hover:text-arch-900 cursor-pointer">Instagram</a><a class="hover:text-arch-900 cursor-pointer">Behance</a></div>
    <div>© 2026 構思集建築事務所</div>
  </div>
</footer>

<!-- Contact Modal -->
<div id="contactModal" class="hidden fixed inset-0 z-50 flex items-center justify-center">
  <div class="absolute inset-0 bg-black/50" onclick="document.getElementById('contactModal').classList.add('hidden')"></div>
  <div class="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
    <button onclick="document.getElementById('contactModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer text-lg">✕</button>
    <h3 class="serif text-xl font-bold text-arch-900 mb-1">預約諮詢</h3>
    <p class="text-xs text-gray-400 mb-6">填寫基本資訊，我們會在 2 個工作天內聯繫您</p>
    <div class="space-y-3">
      <input type="text" placeholder="您的姓名" class="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-stone-200">
      <input type="email" placeholder="Email" class="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-stone-200">
      <input type="tel" placeholder="聯絡電話" class="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-stone-200">
      <select class="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 outline-none focus:ring-2 focus:ring-stone-200">
        <option>專案類型</option>
        <option>住宅設計</option>
        <option>商業空間</option>
        <option>公共建築</option>
        <option>室內設計</option>
        <option>景觀設計</option>
        <option>其他</option>
      </select>
      <textarea placeholder="簡述您的需求與基地概況" rows="3" class="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-stone-200 resize-none"></textarea>
      <button onclick="this.textContent='✓ 已送出！我們會盡快聯繫';this.classList.replace('bg-arch-800','bg-green-600');setTimeout(()=>{document.getElementById('contactModal').classList.add('hidden');this.textContent='送出';this.classList.replace('bg-green-600','bg-arch-800')},2000)" class="w-full bg-arch-800 hover:bg-arch-900 text-white py-3 rounded-lg font-medium transition cursor-pointer">送出</button>
    </div>
  </div>
</div>

<script>
function filterWorks(btn, type) {
  document.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('active'); b.style.background=''; b.style.color=''; b.classList.add('border-white/20'); b.classList.remove('border-white'); });
  btn.classList.add('active'); btn.classList.remove('border-white/20'); btn.classList.add('border-white');
  document.querySelectorAll('[data-type]').forEach(card => {
    card.style.display = (type === 'all' || card.dataset.type === type) ? '' : 'none';
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
