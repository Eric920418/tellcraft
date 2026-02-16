INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'f4e8830a-7dba-4af5-9124-7daf8947c268',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>璀璨之夜 GalaLight</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { gala: { 50:'#fdf4ff',100:'#fae8ff',300:'#f0abfc',400:'#e879f9',500:'#d946ef',600:'#c026d3' }, gold: { 300:'#fcd34d',400:'#fbbf24',500:'#f59e0b' } } } } } }
</script>
<style>
body { font-family: 'DM Sans', sans-serif; background: #0c0a14; color: #e8e0f0; }
.serif { font-family: 'Playfair Display', serif; }
.shimmer { background: linear-gradient(120deg, transparent, rgba(250,204,21,0.08), transparent); background-size: 200% 100%; animation: shimmer 3s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.ticket-card { transition: all 0.3s; cursor: pointer; }
.ticket-card:hover { transform: translateY(-4px); border-color: rgba(250,204,21,0.4); }
</style>
</head>
<body>
<nav class="fixed top-0 w-full z-50 bg-black/70 backdrop-blur border-b border-white/5">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gala-500 flex items-center justify-center text-xs">✦</div><span class="serif font-bold tracking-wide">GalaLight</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-400">
      <a class="hover:text-gold-400 transition cursor-pointer">活動資訊</a>
      <a class="hover:text-gold-400 transition cursor-pointer">表演嘉賓</a>
      <a class="hover:text-gold-400 transition cursor-pointer">購票</a>
      <button class="bg-gradient-to-r from-gold-400 to-gold-500 text-black px-5 py-1.5 rounded-full text-sm font-bold hover:opacity-90 transition">立即搶票</button>
    </div>
  </div>
</nav>

<section class="min-h-[85vh] flex items-center relative overflow-hidden pt-14">
  <div class="absolute inset-0 bg-gradient-to-b from-gala-600/10 via-transparent to-transparent"></div>
  <div class="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gala-500/10 rounded-full blur-[150px]"></div>
  <div class="absolute top-32 right-40 w-2 h-2 bg-gold-400 rounded-full animate-pulse"></div>
  <div class="absolute top-60 left-32 w-1.5 h-1.5 bg-gala-400 rounded-full animate-pulse"></div>
  <div class="absolute bottom-40 right-60 w-1 h-1 bg-gold-300 rounded-full animate-pulse"></div>
  <div class="max-w-6xl mx-auto px-6 text-center relative">
    <span class="inline-block text-xs text-gold-400 tracking-[0.3em] uppercase font-medium mb-4">2026 Annual Gala Night</span>
    <h1 class="serif text-6xl font-bold mb-4 bg-gradient-to-r from-gold-300 via-gold-400 to-gala-400 bg-clip-text text-transparent">璀璨之夜</h1>
    <p class="text-gray-400 max-w-lg mx-auto mb-3">一場融合藝術、音樂與頂級美食的年度盛典。在星光下，與 500 位菁英共度難忘的夜晚。</p>
    <div class="flex items-center justify-center gap-6 text-sm text-gray-500 mb-8">
      <span>📅 2026/04/18（六）</span><span>⏰ 18:00 - 23:00</span><span>📍 台北萬豪酒店 · 宴會廳</span>
    </div>
    <div class="flex gap-4 justify-center">
      <button class="bg-gradient-to-r from-gold-400 to-gold-500 text-black px-10 py-3 rounded-full font-bold text-sm hover:opacity-90 transition shadow-lg shadow-gold-500/20">搶購早鳥票</button>
      <button class="border border-gold-400/30 text-gold-400 px-10 py-3 rounded-full font-bold text-sm hover:border-gold-400/60 transition">觀看預告片 ▶</button>
    </div>
    <div class="flex gap-10 justify-center mt-12 text-sm">
      <div><div class="text-3xl font-bold text-white serif">500+</div><div class="text-xs text-gray-500 mt-1">席位</div></div>
      <div class="w-px h-12 bg-white/10"></div>
      <div><div class="text-3xl font-bold text-white serif">12</div><div class="text-xs text-gray-500 mt-1">表演嘉賓</div></div>
      <div class="w-px h-12 bg-white/10"></div>
      <div><div class="text-3xl font-bold text-white serif">5</div><div class="text-xs text-gray-500 mt-1">星級主廚</div></div>
    </div>
  </div>
</section>

<section class="py-16">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold text-center mb-2">表演嘉賓</h2>
    <p class="text-center text-gray-500 text-sm mb-10">來自世界各地的頂級藝術家</p>
    <div class="grid grid-cols-4 gap-5">
      <div class="text-center"><div class="w-28 h-28 rounded-full bg-gradient-to-br from-gala-300 to-gala-600 mx-auto mb-3 flex items-center justify-center text-5xl">🎤</div><h3 class="font-bold text-white">Sarah Lin</h3><div class="text-xs text-gala-400 mt-0.5">Jazz Vocalist</div></div>
      <div class="text-center"><div class="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 mx-auto mb-3 flex items-center justify-center text-5xl">🎻</div><h3 class="font-bold text-white">Alex Chen</h3><div class="text-xs text-gala-400 mt-0.5">Violin Virtuoso</div></div>
      <div class="text-center"><div class="w-28 h-28 rounded-full bg-gradient-to-br from-gold-400 to-amber-600 mx-auto mb-3 flex items-center justify-center text-5xl">🎹</div><h3 class="font-bold text-white">Yuki Tanaka</h3><div class="text-xs text-gala-400 mt-0.5">Piano & Composer</div></div>
      <div class="text-center"><div class="w-28 h-28 rounded-full bg-gradient-to-br from-rose-400 to-red-600 mx-auto mb-3 flex items-center justify-center text-5xl">💃</div><h3 class="font-bold text-white">Luna Rossi</h3><div class="text-xs text-gala-400 mt-0.5">Contemporary Dance</div></div>
    </div>
  </div>
</section>

<section class="py-14 border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold text-center mb-8">活動流程</h2>
    <div class="grid grid-cols-5 gap-4 text-center text-sm">
      <div class="shimmer rounded-xl p-4 border border-white/5"><div class="text-gold-400 font-bold mb-1">18:00</div><div class="text-white font-medium">紅毯入場</div><div class="text-xs text-gray-500 mt-1">迎賓香檳</div></div>
      <div class="shimmer rounded-xl p-4 border border-white/5"><div class="text-gold-400 font-bold mb-1">18:45</div><div class="text-white font-medium">開幕致詞</div><div class="text-xs text-gray-500 mt-1">主辦人歡迎</div></div>
      <div class="shimmer rounded-xl p-4 border border-white/5"><div class="text-gold-400 font-bold mb-1">19:15</div><div class="text-white font-medium">晚宴</div><div class="text-xs text-gray-500 mt-1">五星級料理</div></div>
      <div class="shimmer rounded-xl p-4 border border-white/5"><div class="text-gold-400 font-bold mb-1">20:30</div><div class="text-white font-medium">表演時間</div><div class="text-xs text-gray-500 mt-1">音樂與舞蹈</div></div>
      <div class="shimmer rounded-xl p-4 border border-white/5"><div class="text-gold-400 font-bold mb-1">22:00</div><div class="text-white font-medium">After Party</div><div class="text-xs text-gray-500 mt-1">DJ & 調酒</div></div>
    </div>
  </div>
</section>

<section class="py-14">
  <div class="max-w-4xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold text-center mb-8">選擇票種</h2>
    <div class="grid grid-cols-3 gap-5">
      <div class="ticket-card rounded-2xl p-6 border border-white/10 bg-white/5 text-center"><h3 class="font-bold text-lg">標準席</h3><div class="serif text-3xl font-bold text-gold-400 my-4">$3,800</div><ul class="text-sm text-gray-400 space-y-1.5"><li>✓ 晚宴席位</li><li>✓ 全場表演</li><li>✓ 迎賓飲品</li></ul><button class="mt-5 w-full py-2 rounded-full border border-gold-400/30 text-gold-400 text-sm font-medium hover:bg-gold-400/10 transition">選購</button></div>
      <div class="ticket-card rounded-2xl p-6 border border-gold-400/40 bg-gold-400/5 text-center relative"><span class="absolute -top-2 right-4 text-xs bg-gold-400 text-black px-2 py-0.5 rounded-full font-bold">推薦</span><h3 class="font-bold text-lg">VIP 席</h3><div class="serif text-3xl font-bold text-gold-400 my-4">$6,800</div><ul class="text-sm text-gray-400 space-y-1.5"><li>✓ 前排 VIP 席位</li><li>✓ 獨享 Lounge</li><li>✓ 精選紅酒</li><li>✓ 嘉賓合照</li></ul><button class="mt-5 w-full py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-black text-sm font-bold hover:opacity-90 transition">選購</button></div>
      <div class="ticket-card rounded-2xl p-6 border border-white/10 bg-white/5 text-center"><h3 class="font-bold text-lg">尊爵桌席</h3><div class="serif text-3xl font-bold text-gold-400 my-4">$58,000</div><ul class="text-sm text-gray-400 space-y-1.5"><li>✓ 10 人圓桌</li><li>✓ 專屬管家</li><li>✓ 頂級酒單</li><li>✓ 後台參觀</li></ul><button class="mt-5 w-full py-2 rounded-full border border-gold-400/30 text-gold-400 text-sm font-medium hover:bg-gold-400/10 transition">選購</button></div>
    </div>
  </div>
</section>

<footer class="border-t border-white/5 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-gray-500">
    <span>© 2026 GalaLight · 璀璨之夜</span>
    <div class="flex gap-4"><a class="hover:text-gold-400 transition cursor-pointer">Instagram</a><a class="hover:text-gold-400 transition cursor-pointer">Facebook</a></div>
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
