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
tailwind.config = { theme: { extend: { colors: { ink: { 50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9' } } } } } }
</script>
<style>
body { font-family: 'Inter', sans-serif; background: #faf9f7; }
.serif { font-family: 'Newsreader', serif; }
.issue-card { transition: all 0.3s; cursor: pointer; }
.issue-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(139,92,246,0.1); }
.modal-overlay { transition: opacity 0.3s; }
.fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
  <div class="max-w-3xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><span class="text-xl">✉️</span><span class="serif text-lg font-bold text-gray-800">墨報</span><span class="text-[10px] text-ink-500 font-medium">InkLetter</span></div>
    <div class="flex items-center gap-5 text-sm text-gray-500">
      <a class="hover:text-ink-500 transition cursor-pointer" onclick="document.getElementById('archive').scrollIntoView({behavior:'smooth'})">過刊</a>
      <a class="hover:text-ink-500 transition cursor-pointer" onclick="document.getElementById('about').scrollIntoView({behavior:'smooth'})">關於</a>
      <a class="hover:text-ink-500 transition cursor-pointer" onclick="document.getElementById('topics').scrollIntoView({behavior:'smooth'})">主題</a>
      <button onclick="document.getElementById('subscribeModal').classList.remove('hidden')" class="bg-ink-500 hover:bg-ink-600 text-white px-4 py-1.5 rounded-full text-sm font-medium transition cursor-pointer">免費訂閱</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="py-16 bg-gradient-to-b from-violet-50 to-white">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <span class="inline-block text-xs bg-ink-100 text-ink-600 px-3 py-1 rounded-full font-medium mb-4">每週三早晨 · 準時送達</span>
    <h1 class="serif text-4xl font-bold text-gray-800 mb-4">一封信，讀懂科技趨勢</h1>
    <p class="text-gray-500 max-w-md mx-auto mb-8">每週精選全球科技、商業與創新觀點，用最精簡的文字帶你掌握一週大事。已有 12,000+ 讀者訂閱。</p>
    <div class="flex gap-2 max-w-sm mx-auto"><input type="email" placeholder="輸入你的 Email" class="flex-1 px-4 py-3 rounded-full border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-ink-200"><button onclick="document.getElementById('subscribeModal').classList.remove('hidden')" class="bg-ink-500 hover:bg-ink-600 text-white px-6 py-3 rounded-full text-sm font-bold transition whitespace-nowrap cursor-pointer">訂閱</button></div>
    <p class="text-xs text-gray-400 mt-3">免費、無廣告、隨時退訂</p>
    <div class="flex items-center justify-center gap-6 mt-8">
      <div class="flex -space-x-2">
        <div class="w-8 h-8 rounded-full bg-indigo-200 border-2 border-white flex items-center justify-center text-xs">👩</div>
        <div class="w-8 h-8 rounded-full bg-pink-200 border-2 border-white flex items-center justify-center text-xs">👨</div>
        <div class="w-8 h-8 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center text-xs">👩</div>
        <div class="w-8 h-8 rounded-full bg-green-200 border-2 border-white flex items-center justify-center text-xs">👨</div>
      </div>
      <span class="text-xs text-gray-400">12,347 位讀者已訂閱</span>
    </div>
  </div>
</section>

<!-- Social Proof -->
<section class="bg-white border-y border-gray-100 py-6">
  <div class="max-w-3xl mx-auto px-6 flex items-center justify-center gap-10 text-xs text-gray-400">
    <span>被推薦於</span>
    <span class="font-bold text-gray-500">TechCrunch</span>
    <span class="font-bold text-gray-500">數位時代</span>
    <span class="font-bold text-gray-500">科技島</span>
    <span class="font-bold text-gray-500">Inside</span>
    <span class="font-bold text-gray-500">Product Hunt</span>
  </div>
</section>

<!-- Latest Issue -->
<section class="max-w-3xl mx-auto px-6 py-12">
  <h2 class="serif text-xl font-bold text-gray-800 mb-6">📬 最新一期</h2>
  <article class="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm fade-in">
    <div class="flex items-center gap-3 mb-4">
      <span class="text-xs bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full font-medium">#127</span>
      <span class="text-xs text-gray-400">2026/02/12</span>
      <span class="text-xs text-gray-400">·</span>
      <span class="text-xs text-gray-400">閱讀時間 6 分鐘</span>
    </div>
    <h3 class="serif text-2xl font-bold text-gray-800 mb-3">AI Agent 的崛起：為什麼 2026 是代理元年？</h3>
    <p class="text-gray-500 text-sm leading-relaxed mb-4">從 ChatGPT 到 Claude，大型語言模型正在從「聊天工具」進化為「自主代理」。本期深入分析三大趨勢：MCP 協議標準化、Agent SDK 生態爆發、企業級部署的安全挑戰。</p>
    <div class="bg-ink-50 rounded-xl p-4 mb-4">
      <div class="text-xs text-ink-600 font-medium mb-2">本期重點</div>
      <ul class="text-sm text-gray-600 space-y-1.5">
        <li class="flex items-start gap-2"><span class="text-ink-400">→</span>Anthropic 發布 Agent SDK，開發者可以用 50 行代碼構建自主代理</li>
        <li class="flex items-start gap-2"><span class="text-ink-400">→</span>OpenAI 的 Operator 正式上線，支援 20+ 網站自動操作</li>
        <li class="flex items-start gap-2"><span class="text-ink-400">→</span>Google DeepMind 的 Mariner 打通瀏覽器 Agent，挑戰 Web 自動化</li>
        <li class="flex items-start gap-2"><span class="text-ink-400">→</span>企業端：Agent 安全與權限控制成為最大痛點</li>
      </ul>
    </div>
    <div class="flex items-center gap-4">
      <button onclick="document.getElementById('articleModal').classList.remove('hidden')" class="text-ink-500 text-sm font-medium hover:text-ink-600 transition cursor-pointer">繼續閱讀 →</button>
      <span class="text-xs text-gray-300">|</span>
      <button class="text-gray-400 text-sm hover:text-gray-600 transition cursor-pointer">分享</button>
      <button class="text-gray-400 text-sm hover:text-gray-600 transition cursor-pointer">收藏</button>
    </div>
  </article>
</section>

<!-- Topics -->
<section id="topics" class="bg-white border-y border-gray-100 py-12">
  <div class="max-w-3xl mx-auto px-6">
    <h2 class="serif text-xl font-bold text-gray-800 mb-6 text-center">📂 涵蓋主題</h2>
    <div class="grid grid-cols-4 gap-3">
      <div class="bg-violet-50 rounded-xl p-4 text-center hover:bg-violet-100 transition cursor-pointer"><div class="text-2xl mb-1">🤖</div><div class="text-xs font-bold text-gray-600">AI & 機器學習</div><div class="text-[10px] text-gray-400 mt-1">每期必讀</div></div>
      <div class="bg-blue-50 rounded-xl p-4 text-center hover:bg-blue-100 transition cursor-pointer"><div class="text-2xl mb-1">💻</div><div class="text-xs font-bold text-gray-600">軟體工程</div><div class="text-[10px] text-gray-400 mt-1">工具與趨勢</div></div>
      <div class="bg-green-50 rounded-xl p-4 text-center hover:bg-green-100 transition cursor-pointer"><div class="text-2xl mb-1">💰</div><div class="text-xs font-bold text-gray-600">科技商業</div><div class="text-[10px] text-gray-400 mt-1">融資與策略</div></div>
      <div class="bg-amber-50 rounded-xl p-4 text-center hover:bg-amber-100 transition cursor-pointer"><div class="text-2xl mb-1">🌐</div><div class="text-xs font-bold text-gray-600">Web3 & 加密</div><div class="text-[10px] text-gray-400 mt-1">務實觀點</div></div>
    </div>
  </div>
</section>

<!-- Archive -->
<section id="archive" class="max-w-3xl mx-auto px-6 py-12">
  <div class="flex items-center justify-between mb-6"><h2 class="serif text-xl font-bold text-gray-800">📚 過刊精選</h2><a class="text-sm text-ink-500 hover:text-ink-600 cursor-pointer font-medium">全部過刊 →</a></div>
  <div class="space-y-3">
    <div class="issue-card bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-4">
      <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono shrink-0">#126</span>
      <div class="flex-1"><h3 class="font-bold text-gray-800 text-sm">開源 AI 的下半場：Meta、Google、Mistral 的角力戰</h3><p class="text-xs text-gray-400 mt-1">Llama 4 vs Gemma 3 vs Mistral Large — 誰能贏得開源 AI 的王座？</p><div class="flex items-center gap-3 mt-2"><span class="text-[10px] text-gray-400">2026/02/05 · 5 min</span><span class="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">AI</span></div></div>
    </div>
    <div class="issue-card bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-4">
      <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono shrink-0">#125</span>
      <div class="flex-1"><h3 class="font-bold text-gray-800 text-sm">遠端工作三年後，企業學到了什麼？</h3><p class="text-xs text-gray-400 mt-1">Spotify 全遠端、GitLab 上市後的組織變革、Meta 回歸辦公室的真正原因</p><div class="flex items-center gap-3 mt-2"><span class="text-[10px] text-gray-400">2026/01/29 · 7 min</span><span class="text-[10px] bg-green-50 text-green-500 px-1.5 py-0.5 rounded">商業</span></div></div>
    </div>
    <div class="issue-card bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-4">
      <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono shrink-0">#124</span>
      <div class="flex-1"><h3 class="font-bold text-gray-800 text-sm">Rust 正在吃掉基礎設施：從 Linux kernel 到 Web 框架</h3><p class="text-xs text-gray-400 mt-1">為什麼越來越多公司從 Go/C++ 遷移到 Rust？效能、安全性與開發體驗的全面分析</p><div class="flex items-center gap-3 mt-2"><span class="text-[10px] text-gray-400">2026/01/22 · 6 min</span><span class="text-[10px] bg-purple-50 text-purple-500 px-1.5 py-0.5 rounded">工程</span></div></div>
    </div>
    <div class="issue-card bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-4">
      <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono shrink-0">#123</span>
      <div class="flex-1"><h3 class="font-bold text-gray-800 text-sm">Web3 的務實轉型：從炒幣到真實應用</h3><p class="text-xs text-gray-400 mt-1">DePIN、RWA 代幣化、穩定幣支付 — 區塊鏈終於找到了真正有用的場景</p><div class="flex items-center gap-3 mt-2"><span class="text-[10px] text-gray-400">2026/01/15 · 5 min</span><span class="text-[10px] bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded">Web3</span></div></div>
    </div>
    <div class="issue-card bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-4">
      <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono shrink-0">#122</span>
      <div class="flex-1"><h3 class="font-bold text-gray-800 text-sm">蘋果的 AI 困局：為什麼 Siri 始終追不上？</h3><p class="text-xs text-gray-400 mt-1">Apple Intelligence 半年回顧，隱私至上的策略是否讓蘋果錯失了 AI 先機？</p><div class="flex items-center gap-3 mt-2"><span class="text-[10px] text-gray-400">2026/01/08 · 8 min</span><span class="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">AI</span></div></div>
    </div>
  </div>
</section>

<!-- About -->
<section id="about" class="bg-gray-50 border-y border-gray-100 py-12">
  <div class="max-w-3xl mx-auto px-6">
    <div class="flex items-start gap-8">
      <div class="w-20 h-20 rounded-full bg-ink-100 flex items-center justify-center text-3xl shrink-0">👨‍💻</div>
      <div>
        <h2 class="serif text-xl font-bold text-gray-800 mb-2">關於作者</h2>
        <h3 class="font-bold text-gray-700">Eric Chen</h3>
        <p class="text-sm text-gray-500 leading-relaxed mt-2">前 Google 軟體工程師，現為獨立科技寫作者。在矽谷工作 8 年，經歷了從 Mobile-first 到 AI-first 的技術浪潮。創辦墨報的初衷是用中文讀者熟悉的語境，解讀全球科技趨勢。</p>
        <div class="flex gap-3 mt-3">
          <a class="text-xs text-ink-500 hover:text-ink-600 cursor-pointer">Twitter</a>
          <a class="text-xs text-ink-500 hover:text-ink-600 cursor-pointer">LinkedIn</a>
          <a class="text-xs text-ink-500 hover:text-ink-600 cursor-pointer">個人網站</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="max-w-3xl mx-auto px-6 py-12">
  <h2 class="serif text-xl font-bold text-gray-800 mb-6 text-center">💬 讀者怎麼說</h2>
  <div class="grid grid-cols-2 gap-4">
    <div class="bg-white rounded-xl p-5 border border-gray-100">
      <p class="text-sm text-gray-600 italic leading-relaxed">「每週三最期待的就是打開墨報。資訊密度高但不枯燥，比看 10 篇文章還有效率。」</p>
      <div class="flex items-center gap-2 mt-3"><div class="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-xs">👩</div><div class="text-xs text-gray-400">Alice · PM @ LINE</div></div>
    </div>
    <div class="bg-white rounded-xl p-5 border border-gray-100">
      <p class="text-sm text-gray-600 italic leading-relaxed">「終於有一個用中文就能追蹤矽谷動態的電子報了。觀點獨到，不是翻譯稿。」</p>
      <div class="flex items-center gap-2 mt-3"><div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">👨</div><div class="text-xs text-gray-400">Kevin · CTO @ 新創</div></div>
    </div>
    <div class="bg-white rounded-xl p-5 border border-gray-100">
      <p class="text-sm text-gray-600 italic leading-relaxed">「推薦給所有想了解 AI 趨勢的朋友。每期都有可以直接用在工作報告裡的洞察。」</p>
      <div class="flex items-center gap-2 mt-3"><div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs">👩</div><div class="text-xs text-gray-400">Mia · 策略顧問</div></div>
    </div>
    <div class="bg-white rounded-xl p-5 border border-gray-100">
      <p class="text-sm text-gray-600 italic leading-relaxed">「內容精煉、排版舒服、沒有廣告。這就是電子報應該有的樣子。」</p>
      <div class="flex items-center gap-2 mt-3"><div class="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs">👨</div><div class="text-xs text-gray-400">David · 工程師 @ TSMC</div></div>
    </div>
  </div>
</section>

<!-- Stats -->
<section class="bg-ink-600 text-white py-12">
  <div class="max-w-3xl mx-auto px-6">
    <div class="grid grid-cols-4 gap-6 text-center">
      <div><div class="text-3xl font-bold">12K+</div><div class="text-xs text-white/60 mt-1">訂閱讀者</div></div>
      <div><div class="text-3xl font-bold">127</div><div class="text-xs text-white/60 mt-1">已發行期數</div></div>
      <div><div class="text-3xl font-bold">58%</div><div class="text-xs text-white/60 mt-1">開信率</div></div>
      <div><div class="text-3xl font-bold">4.8</div><div class="text-xs text-white/60 mt-1">讀者評分</div></div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="max-w-3xl mx-auto px-6 py-12">
  <h2 class="serif text-xl font-bold text-gray-800 mb-6 text-center">❓ 常見問題</h2>
  <div class="space-y-3">
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('span:last-child').textContent=this.nextElementSibling.classList.contains('hidden')?'+':'-'" class="w-full flex items-center justify-between p-4 text-left cursor-pointer"><span class="font-medium text-gray-800 text-sm">這封電子報是免費的嗎？</span><span class="text-gray-400">+</span></button>
      <div class="hidden px-4 pb-4 text-sm text-gray-500">是的，墨報完全免費。我們透過贊助合作維持營運，但保證內容獨立不受影響。</div>
    </div>
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('span:last-child').textContent=this.nextElementSibling.classList.contains('hidden')?'+':'-'" class="w-full flex items-center justify-between p-4 text-left cursor-pointer"><span class="font-medium text-gray-800 text-sm">多久會收到一封？</span><span class="text-gray-400">+</span></button>
      <div class="hidden px-4 pb-4 text-sm text-gray-500">每週三早上 8:00 準時送達。偶爾有特刊（如重大科技事件），但我們會控制在一週最多兩封。</div>
    </div>
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('span:last-child').textContent=this.nextElementSibling.classList.contains('hidden')?'+':'-'" class="w-full flex items-center justify-between p-4 text-left cursor-pointer"><span class="font-medium text-gray-800 text-sm">我可以退訂嗎？</span><span class="text-gray-400">+</span></button>
      <div class="hidden px-4 pb-4 text-sm text-gray-500">當然！每封信的底部都有一鍵退訂連結，點一下就完成。我們尊重每位讀者的選擇。</div>
    </div>
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('span:last-child').textContent=this.nextElementSibling.classList.contains('hidden')?'+':'-'" class="w-full flex items-center justify-between p-4 text-left cursor-pointer"><span class="font-medium text-gray-800 text-sm">如何投稿或合作？</span><span class="text-gray-400">+</span></button>
      <div class="hidden px-4 pb-4 text-sm text-gray-500">歡迎來信 hello@inkletter.tw。我們接受讀者投稿（科技觀點文章）和品牌贊助合作。</div>
    </div>
  </div>
</section>

<!-- Final CTA -->
<section class="bg-gradient-to-br from-ink-600 to-violet-700 text-white py-14 text-center">
  <h2 class="serif text-3xl font-bold mb-2">加入 12,000+ 讀者</h2>
  <p class="text-white/70 text-sm mb-6">每週三早上 8:00，一封值得閱讀的信</p>
  <div class="flex gap-2 max-w-sm mx-auto"><input type="email" placeholder="your@email.com" class="flex-1 px-4 py-3 rounded-full text-sm text-gray-800 outline-none"><button onclick="document.getElementById('subscribeModal').classList.remove('hidden')" class="bg-white text-ink-600 px-6 py-3 rounded-full text-sm font-bold hover:bg-gray-100 transition cursor-pointer">免費訂閱</button></div>
  <p class="text-xs text-white/40 mt-3">我們重視你的隱私，絕不分享你的 Email</p>
</section>

<footer class="py-8">
  <div class="max-w-3xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
    <div class="flex items-center gap-2"><span>✉️</span><span class="serif font-bold text-gray-600">墨報</span></div>
    <div class="flex gap-4">
      <a class="hover:text-ink-500 cursor-pointer">Twitter</a>
      <a class="hover:text-ink-500 cursor-pointer">Threads</a>
      <a class="hover:text-ink-500 cursor-pointer">RSS</a>
    </div>
    <div>© 2026 InkLetter</div>
  </div>
</footer>

<!-- Subscribe Modal -->
<div id="subscribeModal" class="hidden fixed inset-0 z-50 flex items-center justify-center">
  <div class="absolute inset-0 bg-black/50 modal-overlay" onclick="document.getElementById('subscribeModal').classList.add('hidden')"></div>
  <div class="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
    <button onclick="document.getElementById('subscribeModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer text-lg">✕</button>
    <div class="text-center">
      <div class="text-4xl mb-3">✉️</div>
      <h3 class="serif text-xl font-bold text-gray-800 mb-2">訂閱墨報</h3>
      <p class="text-sm text-gray-500 mb-6">每週三收到最精煉的科技觀點</p>
      <input type="email" placeholder="你的 Email" class="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-ink-200 mb-3">
      <input type="text" placeholder="你的名字（選填）" class="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-ink-200 mb-4">
      <button onclick="this.textContent='✓ 訂閱成功！';this.classList.remove('bg-ink-500','hover:bg-ink-600');this.classList.add('bg-green-500');setTimeout(()=>{document.getElementById('subscribeModal').classList.add('hidden');this.textContent='免費訂閱';this.classList.remove('bg-green-500');this.classList.add('bg-ink-500','hover:bg-ink-600')},1500)" class="w-full bg-ink-500 hover:bg-ink-600 text-white py-3 rounded-lg font-bold transition cursor-pointer">免費訂閱</button>
      <p class="text-xs text-gray-400 mt-3">🔒 我們絕不寄送垃圾信</p>
    </div>
  </div>
</div>

<!-- Article Modal -->
<div id="articleModal" class="hidden fixed inset-0 z-50 flex items-center justify-center">
  <div class="absolute inset-0 bg-black/50 modal-overlay" onclick="document.getElementById('articleModal').classList.add('hidden')"></div>
  <div class="relative bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-auto">
    <button onclick="document.getElementById('articleModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer text-lg">✕</button>
    <span class="text-xs bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full font-medium">#127</span>
    <h2 class="serif text-2xl font-bold text-gray-800 mt-3 mb-4">AI Agent 的崛起：為什麼 2026 是代理元年？</h2>
    <div class="prose prose-sm text-gray-600 leading-relaxed space-y-3">
      <p>如果說 2024 年是 ChatGPT 讓普通人認識了 AI，2025 年是大語言模型能力突破的一年，那 2026 年最大的主題就是 <strong>AI Agent（AI 代理）</strong>。</p>
      <p>Agent 不只是「聊天機器人」。它可以自主思考、規劃步驟、呼叫工具、執行任務。你告訴它目標，它會自己想辦法達成。</p>
      <h3 class="serif text-lg font-bold text-gray-800 mt-4">1. MCP 協議：Agent 的「USB 標準」</h3>
      <p>Anthropic 在去年底推出的 Model Context Protocol（MCP）正在成為 Agent 的通用接口標準。就像 USB-C 統一了充電接口，MCP 讓 Agent 可以用統一的方式連接不同的工具和服務...</p>
      <div class="bg-gray-50 rounded-lg p-4 text-xs text-gray-500 my-4">📧 訂閱墨報以閱讀完整內容</div>
    </div>
    <button onclick="document.getElementById('articleModal').classList.add('hidden');document.getElementById('subscribeModal').classList.remove('hidden')" class="mt-4 bg-ink-500 hover:bg-ink-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer">訂閱以閱讀全文</button>
  </div>
</div>
</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
