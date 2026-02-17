INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '327f304f-1cdf-4174-bb3d-5b4a68ccb269',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>墨報 InkLetter</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { ink: { 50:'#f5f3ff',100:'#ede9fe',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed' } } } } } }
</script>
<style>
body { font-family: 'Inter', sans-serif; background: #faf9f7; }
.serif { font-family: 'Newsreader', serif; }
.issue-card { transition: all 0.3s; cursor: pointer; }
.issue-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(139,92,246,0.1); }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
  <div class="max-w-3xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><span class="text-xl">✉️</span><span class="serif text-lg font-bold text-gray-800">墨報</span><span class="text-[10px] text-ink-500 font-medium">InkLetter</span></div>
    <div class="flex items-center gap-5 text-sm text-gray-500">
      <a class="hover:text-ink-500 transition cursor-pointer">過刊</a>
      <a class="hover:text-ink-500 transition cursor-pointer">關於</a>
      <button class="bg-ink-500 hover:bg-ink-600 text-white px-4 py-1.5 rounded-full text-sm font-medium transition">免費訂閱</button>
    </div>
  </div>
</nav>

<section class="py-16 bg-gradient-to-b from-violet-50 to-white">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <span class="inline-block text-xs bg-ink-100 text-ink-600 px-3 py-1 rounded-full font-medium mb-4">每週三早晨 · 準時送達</span>
    <h1 class="serif text-4xl font-bold text-gray-800 mb-4">一封信，讀懂科技趨勢</h1>
    <p class="text-gray-500 max-w-md mx-auto mb-8">每週精選全球科技、商業與創新觀點，用最精簡的文字帶你掌握一週大事。已有 12,000+ 讀者訂閱。</p>
    <div class="flex gap-2 max-w-sm mx-auto"><input type="email" placeholder="輸入你的 Email" class="flex-1 px-4 py-3 rounded-full border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-ink-200"><button class="bg-ink-500 hover:bg-ink-600 text-white px-6 py-3 rounded-full text-sm font-bold transition whitespace-nowrap">訂閱</button></div>
    <p class="text-xs text-gray-400 mt-3">免費、無廣告、隨時退訂</p>
  </div>
</section>

<section class="max-w-3xl mx-auto px-6 py-12">
  <h2 class="serif text-xl font-bold text-gray-800 mb-6">📬 最新一期</h2>
  <article class="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
    <div class="flex items-center gap-3 mb-4">
      <span class="text-xs bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full font-medium">#127</span>
      <span class="text-xs text-gray-400">2026/02/12</span>
      <span class="text-xs text-gray-400">·</span>
      <span class="text-xs text-gray-400">閱讀時間 6 分鐘</span>
    </div>
    <h3 class="serif text-2xl font-bold text-gray-800 mb-3">AI Agent 的崛起：為什麼 2026 是代理元年？</h3>
    <p class="text-gray-500 text-sm leading-relaxed mb-4">從 ChatGPT 到 Claude，大型語言模型正在從「聊天工具」進化為「自主代理」。本期深入分析三大趨勢：MCP 協議標準化、Agent SDK 生態爆發、企業級部署的安全挑戰...</p>
    <div class="flex items-center gap-4">
      <button class="text-ink-500 text-sm font-medium hover:text-ink-600 transition cursor-pointer">繼續閱讀 →</button>
      <span class="text-xs text-gray-300">|</span>
      <button class="text-gray-400 text-sm hover:text-gray-600 transition cursor-pointer">分享</button>
    </div>
  </article>
</section>

<section class="max-w-3xl mx-auto px-6 pb-12">
  <div class="flex items-center justify-between mb-6"><h2 class="serif text-xl font-bold text-gray-800">📚 過刊精選</h2><a class="text-sm text-ink-500 hover:text-ink-600 cursor-pointer font-medium">全部過刊 →</a></div>
  <div class="space-y-4">
    <div class="issue-card bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-4">
      <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono shrink-0">#126</span>
      <div class="flex-1"><h3 class="font-bold text-gray-800 text-sm">開源 AI 的下半場：Meta、Google、Mistral 的角力戰</h3><p class="text-xs text-gray-400 mt-1">2026/02/05 · 5 min</p></div>
    </div>
    <div class="issue-card bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-4">
      <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono shrink-0">#125</span>
      <div class="flex-1"><h3 class="font-bold text-gray-800 text-sm">遠端工作三年後，企業學到了什麼？</h3><p class="text-xs text-gray-400 mt-1">2026/01/29 · 7 min</p></div>
    </div>
    <div class="issue-card bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-4">
      <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono shrink-0">#124</span>
      <div class="flex-1"><h3 class="font-bold text-gray-800 text-sm">Rust 正在吃掉基礎設施：從 Linux kernel 到 Web 框架</h3><p class="text-xs text-gray-400 mt-1">2026/01/22 · 6 min</p></div>
    </div>
    <div class="issue-card bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-4">
      <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono shrink-0">#123</span>
      <div class="flex-1"><h3 class="font-bold text-gray-800 text-sm">Web3 的務實轉型：從炒幣到真實應用</h3><p class="text-xs text-gray-400 mt-1">2026/01/15 · 5 min</p></div>
    </div>
  </div>
</section>

<section class="bg-ink-600 text-white py-12 text-center">
  <h2 class="serif text-2xl font-bold mb-2">加入 12,000+ 讀者</h2>
  <p class="text-white/70 text-sm mb-6">每週三早上 8:00，一封值得閱讀的信</p>
  <div class="flex gap-2 max-w-sm mx-auto"><input type="email" placeholder="your@email.com" class="flex-1 px-4 py-2.5 rounded-full text-sm text-gray-800 outline-none"><button class="bg-white text-ink-600 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-100 transition">訂閱</button></div>
</section>

<footer class="py-8">
  <div class="max-w-3xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
    <div class="flex items-center gap-2"><span>✉️</span><span class="serif font-bold text-gray-600">墨報</span></div>
    <div>© 2026 InkLetter · 用一封信，讀懂世界</div>
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
