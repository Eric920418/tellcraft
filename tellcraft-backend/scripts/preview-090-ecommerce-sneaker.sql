INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '074cbebb-b538-4082-946d-4fc0f6c62921',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>球鞋共和國 SneakerRep</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { snkr: { 50:'#fef2f2',100:'#fee2e2',400:'#f87171',500:'#ef4444',600:'#dc2626' } } } } } }
</script>
<style>
body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: #e5e7eb; }
.display { font-family: 'Oswald', sans-serif; }
.shoe-card { transition: all 0.4s; cursor: pointer; }
.shoe-card:hover { transform: translateY(-6px) scale(1.02); }
.shoe-card:hover .shoe-img { transform: rotate(-8deg) scale(1.1); }
.shoe-img { transition: all 0.4s; }
</style>
</head>
<body>
<nav class="fixed top-0 w-full z-50 bg-black/80 backdrop-blur border-b border-white/5">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><div class="w-7 h-7 rounded bg-snkr-500 flex items-center justify-center text-xs font-bold text-white display">SR</div><span class="display text-lg font-bold tracking-wider">SNEAKER REP</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-400">
      <a class="hover:text-white transition cursor-pointer">新品</a>
      <a class="hover:text-white transition cursor-pointer">品牌</a>
      <a class="hover:text-white transition cursor-pointer">抽籤</a>
      <a class="hover:text-white transition cursor-pointer">二手市集</a>
      <div class="flex items-center gap-3">
        <svg class="w-4.5 h-4.5 text-gray-400 hover:text-white transition cursor-pointer" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <div class="relative cursor-pointer"><svg class="w-4.5 h-4.5 text-gray-400 hover:text-white transition" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg><span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-snkr-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">2</span></div>
      </div>
    </div>
  </div>
</nav>

<section class="min-h-[80vh] flex items-center relative overflow-hidden pt-14">
  <div class="absolute inset-0 bg-gradient-to-br from-snkr-600/15 via-transparent to-transparent"></div>
  <div class="absolute top-40 right-20 w-96 h-96 bg-snkr-500/10 rounded-full blur-[120px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-10 relative">
    <div class="flex-1">
      <span class="inline-block text-xs bg-snkr-500 text-white px-3 py-1 rounded font-bold mb-4 display tracking-wider">🔥 JUST DROPPED</span>
      <h1 class="display text-6xl font-bold leading-none mb-4">AIR MAX<br><span class="text-snkr-400">DN8</span></h1>
      <p class="text-gray-400 text-sm mb-6 max-w-md">Nike 最新動態氣墊科技，8 個獨立氣墊單元帶來前所未有的緩震體驗。全球限量 5,000 雙。</p>
      <div class="flex gap-4">
        <button class="bg-snkr-500 hover:bg-snkr-600 text-white px-10 py-3 rounded text-sm font-bold display tracking-wider transition">立即搶購 $7,200</button>
        <button class="border border-white/20 text-white px-8 py-3 rounded text-sm hover:border-white/40 transition">尺碼指南</button>
      </div>
    </div>
    <div class="w-80 h-80 flex items-center justify-center text-[140px] drop-shadow-2xl">👟</div>
  </div>
</section>

<section class="py-14 border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between mb-8"><h2 class="display text-2xl font-bold tracking-wider">HOT RELEASES</h2><div class="flex gap-2 text-xs"><button class="px-3 py-1 rounded bg-snkr-500 text-white font-bold display">全部</button><button class="px-3 py-1 rounded bg-white/5 text-gray-400">Nike</button><button class="px-3 py-1 rounded bg-white/5 text-gray-400">Jordan</button><button class="px-3 py-1 rounded bg-white/5 text-gray-400">adidas</button><button class="px-3 py-1 rounded bg-white/5 text-gray-400">New Balance</button></div></div>
    <div class="grid grid-cols-4 gap-5">
      <div class="shoe-card bg-white/5 rounded-xl overflow-hidden border border-white/5">
        <div class="h-48 bg-gradient-to-b from-orange-500/20 to-transparent flex items-center justify-center"><span class="shoe-img text-7xl">👟</span></div>
        <div class="p-4"><span class="text-[10px] text-gray-500">Nike</span><h3 class="font-bold text-white text-sm mt-0.5">Air Jordan 1 Retro High OG</h3><div class="flex items-center justify-between mt-3"><span class="text-snkr-400 font-bold">$6,300</span><span class="text-[10px] text-green-400 font-medium">有貨</span></div></div>
      </div>
      <div class="shoe-card bg-white/5 rounded-xl overflow-hidden border border-white/5">
        <div class="h-48 bg-gradient-to-b from-blue-500/20 to-transparent flex items-center justify-center"><span class="shoe-img text-7xl">👟</span></div>
        <div class="p-4"><span class="text-[10px] text-gray-500">adidas</span><h3 class="font-bold text-white text-sm mt-0.5">Yeezy Boost 350 V2</h3><div class="flex items-center justify-between mt-3"><span class="text-snkr-400 font-bold">$8,500</span><span class="text-[10px] text-amber-400 font-medium">抽籤中</span></div></div>
      </div>
      <div class="shoe-card bg-white/5 rounded-xl overflow-hidden border border-white/5">
        <div class="h-48 bg-gradient-to-b from-gray-500/20 to-transparent flex items-center justify-center"><span class="shoe-img text-7xl">👟</span></div>
        <div class="p-4"><span class="text-[10px] text-gray-500">New Balance</span><h3 class="font-bold text-white text-sm mt-0.5">993 Made in USA</h3><div class="flex items-center justify-between mt-3"><span class="text-snkr-400 font-bold">$5,980</span><span class="text-[10px] text-green-400 font-medium">有貨</span></div></div>
      </div>
      <div class="shoe-card bg-white/5 rounded-xl overflow-hidden border border-white/5 relative">
        <span class="absolute top-2 right-2 text-[10px] bg-snkr-500 text-white px-2 py-0.5 rounded font-bold z-10">限量</span>
        <div class="h-48 bg-gradient-to-b from-purple-500/20 to-transparent flex items-center justify-center"><span class="shoe-img text-7xl">👟</span></div>
        <div class="p-4"><span class="text-[10px] text-gray-500">Nike x Travis Scott</span><h3 class="font-bold text-white text-sm mt-0.5">Air Force 1 Low</h3><div class="flex items-center justify-between mt-3"><span class="text-snkr-400 font-bold">$12,800</span><span class="text-[10px] text-red-400 font-medium">即將售罄</span></div></div>
      </div>
    </div>
  </div>
</section>

<section class="py-12 border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="display text-xl font-bold tracking-wider mb-6">🎫 UPCOMING RAFFLES</h2>
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white/5 rounded-xl p-5 border border-white/5 flex items-center gap-4 hover:border-snkr-500/30 transition cursor-pointer"><div class="text-4xl">👟</div><div><h3 class="font-bold text-white text-sm">Nike Dunk Low 'Panda' 2026</h3><div class="text-xs text-gray-500 mt-1">抽籤截止：2/20 23:59</div><div class="text-xs text-snkr-400 font-medium mt-1">$3,600</div></div></div>
      <div class="bg-white/5 rounded-xl p-5 border border-white/5 flex items-center gap-4 hover:border-snkr-500/30 transition cursor-pointer"><div class="text-4xl">👟</div><div><h3 class="font-bold text-white text-sm">Jordan 4 Retro 'Military Blue'</h3><div class="text-xs text-gray-500 mt-1">抽籤截止：2/25 23:59</div><div class="text-xs text-snkr-400 font-medium mt-1">$7,200</div></div></div>
      <div class="bg-white/5 rounded-xl p-5 border border-white/5 flex items-center gap-4 hover:border-snkr-500/30 transition cursor-pointer"><div class="text-4xl">👟</div><div><h3 class="font-bold text-white text-sm">adidas Samba OG 'Cream'</h3><div class="text-xs text-gray-500 mt-1">抽籤截止：3/01 23:59</div><div class="text-xs text-snkr-400 font-medium mt-1">$3,290</div></div></div>
    </div>
  </div>
</section>

<section class="bg-snkr-600 py-10 text-center">
  <h2 class="display text-2xl font-bold tracking-wider mb-2">JOIN THE REP</h2>
  <p class="text-white/70 text-sm mb-5">加入會員，搶先收到限量發售通知</p>
  <div class="flex gap-2 max-w-md mx-auto"><input type="email" placeholder="your@email.com" class="flex-1 px-4 py-2.5 rounded text-sm text-gray-800 outline-none"><button class="bg-black text-white px-6 py-2.5 rounded text-sm font-bold display tracking-wider hover:bg-gray-900 transition">加入</button></div>
</section>

<footer class="border-t border-white/5 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-gray-500">
    <span class="display tracking-wider">© 2026 SNEAKER REP</span>
    <div class="flex gap-4"><a class="hover:text-white transition cursor-pointer">Instagram</a><a class="hover:text-white transition cursor-pointer">Twitter</a></div>
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
