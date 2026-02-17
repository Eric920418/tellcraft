INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '57274695-924b-437b-a2ef-75367f2fa15a',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>博覽天下 ExpoWorld</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { expo: { 50:'#fef3c7',100:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706' }, deep: { 800:'#1e1b4b',900:'#0f0a2e' } } } } } }
</script>
<style>
* { font-family: 'Outfit', sans-serif; }
body { background: #0f0a2e; color: #e2e8f0; }
.booth-card { transition: all 0.3s; cursor: pointer; }
.booth-card:hover { transform: translateY(-4px); border-color: rgba(251,191,36,0.3); }
</style>
</head>
<body>
<nav class="fixed top-0 w-full z-50 bg-deep-900/80 backdrop-blur border-b border-white/5">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><div class="w-7 h-7 rounded bg-gradient-to-br from-expo-400 to-orange-500 flex items-center justify-center text-xs font-bold text-deep-900">EW</div><span class="font-bold tracking-wide">ExpoWorld</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-400">
      <a class="hover:text-expo-400 transition cursor-pointer">展覽資訊</a>
      <a class="hover:text-expo-400 transition cursor-pointer">參展商</a>
      <a class="hover:text-expo-400 transition cursor-pointer">論壇</a>
      <a class="hover:text-expo-400 transition cursor-pointer">交通指南</a>
      <button class="bg-gradient-to-r from-expo-400 to-orange-500 text-deep-900 px-5 py-1.5 rounded-full text-sm font-bold hover:opacity-90 transition">購票入場</button>
    </div>
  </div>
</nav>

<section class="min-h-[80vh] flex items-center relative overflow-hidden pt-14">
  <div class="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-transparent to-transparent"></div>
  <div class="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-expo-500/5 rounded-full blur-[150px]"></div>
  <div class="max-w-6xl mx-auto px-6 text-center relative">
    <div class="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs mb-6">
      <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
      <span class="text-gray-400">2026 年度科技盛會</span>
    </div>
    <h1 class="text-6xl font-extrabold mb-4">亞洲科技<span class="bg-gradient-to-r from-expo-300 to-orange-400 bg-clip-text text-transparent">博覽會</span></h1>
    <p class="text-gray-400 max-w-lg mx-auto mb-3">匯聚全球 200+ 科技品牌、50+ 場論壇演講、現場體驗最前沿的 AI、XR 與機器人技術。</p>
    <div class="flex items-center justify-center gap-6 text-sm text-gray-500 mb-8">
      <span>📅 2026/05/15 - 05/18</span><span>📍 南港展覽館 1 & 2 館</span><span>👥 預計 80,000+ 人次</span>
    </div>
    <div class="flex gap-4 justify-center">
      <button class="bg-gradient-to-r from-expo-400 to-orange-500 text-deep-900 px-10 py-3 rounded-full font-bold hover:opacity-90 transition shadow-lg shadow-expo-500/20">早鳥票 $480</button>
      <button class="border border-expo-400/30 text-expo-400 px-10 py-3 rounded-full font-bold hover:border-expo-400/60 transition">免費索取邀請碼</button>
    </div>
    <div class="flex gap-12 justify-center mt-14">
      <div><div class="text-3xl font-extrabold text-white">200+</div><div class="text-xs text-gray-500 mt-1">參展品牌</div></div>
      <div class="w-px h-12 bg-white/10"></div>
      <div><div class="text-3xl font-extrabold text-white">50+</div><div class="text-xs text-gray-500 mt-1">論壇講座</div></div>
      <div class="w-px h-12 bg-white/10"></div>
      <div><div class="text-3xl font-extrabold text-white">4</div><div class="text-xs text-gray-500 mt-1">展覽天數</div></div>
      <div class="w-px h-12 bg-white/10"></div>
      <div><div class="text-3xl font-extrabold text-white">6</div><div class="text-xs text-gray-500 mt-1">主題展區</div></div>
    </div>
  </div>
</section>

<section class="py-16 border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-2xl font-bold text-center mb-2">主題展區</h2>
    <p class="text-center text-gray-500 text-sm mb-10">六大主題，一次體驗最前沿的科技革新</p>
    <div class="grid grid-cols-3 gap-5">
      <div class="booth-card bg-white/5 rounded-xl p-6 border border-white/5"><div class="text-3xl mb-3">🤖</div><h3 class="font-bold text-white">AI & 大語言模型</h3><p class="text-xs text-gray-400 mt-2">GPT、Claude、Gemini 最新應用，AI Agent 與企業自動化</p><div class="text-xs text-expo-400 mt-3 font-medium">42 家參展商</div></div>
      <div class="booth-card bg-white/5 rounded-xl p-6 border border-white/5"><div class="text-3xl mb-3">🥽</div><h3 class="font-bold text-white">XR & 空間運算</h3><p class="text-xs text-gray-400 mt-2">Apple Vision Pro、Meta Quest、空間計算與沉浸式體驗</p><div class="text-xs text-expo-400 mt-3 font-medium">28 家參展商</div></div>
      <div class="booth-card bg-white/5 rounded-xl p-6 border border-white/5"><div class="text-3xl mb-3">🦾</div><h3 class="font-bold text-white">機器人 & 自動化</h3><p class="text-xs text-gray-400 mt-2">人形機器人、工業自動化、無人配送</p><div class="text-xs text-expo-400 mt-3 font-medium">35 家參展商</div></div>
      <div class="booth-card bg-white/5 rounded-xl p-6 border border-white/5"><div class="text-3xl mb-3">⚡</div><h3 class="font-bold text-white">綠能 & 永續科技</h3><p class="text-xs text-gray-400 mt-2">電動車、氫能、碳捕捉與循環經濟</p><div class="text-xs text-expo-400 mt-3 font-medium">30 家參展商</div></div>
      <div class="booth-card bg-white/5 rounded-xl p-6 border border-white/5"><div class="text-3xl mb-3">🧬</div><h3 class="font-bold text-white">生醫 & 健康科技</h3><p class="text-xs text-gray-400 mt-2">基因療法、AI 藥物研發、穿戴式健康裝置</p><div class="text-xs text-expo-400 mt-3 font-medium">25 家參展商</div></div>
      <div class="booth-card bg-white/5 rounded-xl p-6 border border-white/5"><div class="text-3xl mb-3">🛡️</div><h3 class="font-bold text-white">資安 & Web3</h3><p class="text-xs text-gray-400 mt-2">零信任架構、DID 數位身份、區塊鏈基礎設施</p><div class="text-xs text-expo-400 mt-3 font-medium">20 家參展商</div></div>
    </div>
  </div>
</section>

<section class="py-14 border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-2xl font-bold text-center mb-8">重點論壇</h2>
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white/5 rounded-xl p-5 border border-white/5 flex items-start gap-4"><div class="text-center shrink-0 bg-expo-500/10 rounded-lg px-3 py-2"><div class="text-expo-400 font-bold text-sm">5/15</div><div class="text-xs text-gray-500">10:00</div></div><div><h3 class="font-medium text-white text-sm">Keynote: AI 的下一個十年</h3><p class="text-xs text-gray-400 mt-1">Andrew Ng · AI Fund 創辦人</p></div></div>
      <div class="bg-white/5 rounded-xl p-5 border border-white/5 flex items-start gap-4"><div class="text-center shrink-0 bg-expo-500/10 rounded-lg px-3 py-2"><div class="text-expo-400 font-bold text-sm">5/16</div><div class="text-xs text-gray-500">14:00</div></div><div><h3 class="font-medium text-white text-sm">Panel: 空間運算改變工作模式</h3><p class="text-xs text-gray-400 mt-1">Apple · Meta · HTC 共同探討</p></div></div>
      <div class="bg-white/5 rounded-xl p-5 border border-white/5 flex items-start gap-4"><div class="text-center shrink-0 bg-expo-500/10 rounded-lg px-3 py-2"><div class="text-expo-400 font-bold text-sm">5/17</div><div class="text-xs text-gray-500">11:00</div></div><div><h3 class="font-medium text-white text-sm">Workshop: 用 Claude Agent SDK 建構自動化</h3><p class="text-xs text-gray-400 mt-1">Anthropic Developer Relations</p></div></div>
      <div class="bg-white/5 rounded-xl p-5 border border-white/5 flex items-start gap-4"><div class="text-center shrink-0 bg-expo-500/10 rounded-lg px-3 py-2"><div class="text-expo-400 font-bold text-sm">5/18</div><div class="text-xs text-gray-500">09:30</div></div><div><h3 class="font-medium text-white text-sm">Fireside Chat: 台灣科技的全球機會</h3><p class="text-xs text-gray-400 mt-1">TSMC · MediaTek · Appier 三方對談</p></div></div>
    </div>
  </div>
</section>

<section class="bg-gradient-to-r from-expo-500 to-orange-500 py-10 text-center text-deep-900">
  <h2 class="text-2xl font-extrabold mb-2">早鳥優惠倒數中</h2>
  <p class="text-deep-900/70 text-sm mb-5">前 5,000 名享 6 折優惠</p>
  <button class="bg-deep-900 text-expo-400 px-10 py-3 rounded-full font-bold hover:bg-deep-800 transition">立即購票 →</button>
</section>

<footer class="border-t border-white/5 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-gray-500">
    <span>© 2026 ExpoWorld · 亞洲科技博覽會</span>
    <div class="flex gap-4"><a class="hover:text-expo-400 transition cursor-pointer">Facebook</a><a class="hover:text-expo-400 transition cursor-pointer">LinkedIn</a></div>
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
