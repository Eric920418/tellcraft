INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'ca6c5168-d6a6-48f7-a3b4-cced69fc2e16',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>知識寶庫 WikiBase</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { wiki: { 50:'#f0fdf4',100:'#dcfce7',400:'#4ade80',500:'#22c55e',600:'#16a34a' }, slate: { 750:'#293548' } } } } } }
</script>
<style>
body { font-family: 'Inter', sans-serif; background: #f8fafc; }
.mono { font-family: 'JetBrains Mono', monospace; }
.article-link { transition: all 0.2s; }
.article-link:hover { background: #f0fdf4; transform: translateX(4px); }
.search-highlight { background: #dcfce7; padding: 0 2px; border-radius: 2px; }
.toc-link { transition: all 0.2s; border-left: 2px solid transparent; }
.toc-link:hover, .toc-link.active { border-left-color: #22c55e; background: #f0fdf4; color: #16a34a; }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.faq-answer.open { max-height: 500px; }
.tab-btn { transition: all 0.2s; }
.tab-btn.active { background: #22c55e; color: white; }
</style>
</head>
<body>
<!-- Nav -->
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
  <div class="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-wiki-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">W</div>
      <span class="font-bold text-gray-800">WikiBase</span>
      <span class="text-[10px] bg-wiki-50 text-wiki-600 px-2 py-0.5 rounded font-medium">v2.4</span>
    </div>
    <div class="flex items-center gap-4">
      <div class="relative">
        <input id="searchInput" type="text" placeholder="搜尋文章..." class="w-64 bg-gray-50 border border-gray-200 rounded-lg px-4 py-1.5 text-sm focus:outline-none focus:border-wiki-400 focus:bg-white" oninput="searchArticles(this.value)">
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs">⌘K</span>
      </div>
      <button onclick="document.getElementById('contributeModal').classList.remove('hidden')" class="bg-wiki-500 hover:bg-wiki-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition">✏️ 投稿</button>
    </div>
  </div>
</nav>

<!-- Contribute Modal -->
<div id="contributeModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl relative">
    <button onclick="document.getElementById('contributeModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
    <h3 class="text-lg font-bold text-gray-800 mb-4">✏️ 投稿新文章</h3>
    <div id="contribForm">
      <input type="text" placeholder="文章標題" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-wiki-400">
      <select class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 text-gray-500 focus:outline-none focus:border-wiki-400">
        <option>選擇分類</option><option>程式語言</option><option>框架工具</option><option>資料庫</option><option>DevOps</option><option>AI / ML</option><option>資安</option>
      </select>
      <textarea placeholder="文章內容（支援 Markdown）" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-wiki-400 h-32 resize-none mono text-xs"></textarea>
      <div class="flex gap-2 mb-4">
        <input type="text" placeholder="標籤（逗號分隔）" class="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-wiki-400">
      </div>
      <button onclick="document.getElementById('contribForm').innerHTML='<div class=\'text-center py-8\'><div class=\'text-5xl mb-3\'>✅</div><p class=\'font-bold text-gray-800\'>文章已提交審核</p><p class=\'text-sm text-gray-400 mt-1\'>通常 1-2 個工作天內完成審核</p></div>'" class="w-full bg-wiki-500 hover:bg-wiki-600 text-white py-2.5 rounded-xl font-medium text-sm transition">提交審核</button>
    </div>
  </div>
</div>

<!-- Search Results Overlay -->
<div id="searchResults" class="hidden fixed top-16 left-1/2 -translate-x-1/2 w-[500px] bg-white rounded-xl shadow-2xl border border-gray-100 z-40 max-h-80 overflow-y-auto"></div>

<div class="max-w-7xl mx-auto px-6 py-8 flex gap-8">
  <!-- Sidebar -->
  <aside class="w-56 shrink-0">
    <div class="sticky top-20">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">分類目錄</h3>
      <div class="space-y-0.5">
        <a onclick="filterByCategory('all')" class="toc-link active block px-3 py-2 text-sm text-gray-600 rounded-r cursor-pointer">📚 全部文章</a>
        <a onclick="filterByCategory('lang')" class="toc-link block px-3 py-2 text-sm text-gray-600 rounded-r cursor-pointer">💻 程式語言</a>
        <a onclick="filterByCategory('framework')" class="toc-link block px-3 py-2 text-sm text-gray-600 rounded-r cursor-pointer">🛠️ 框架工具</a>
        <a onclick="filterByCategory('database')" class="toc-link block px-3 py-2 text-sm text-gray-600 rounded-r cursor-pointer">🗄️ 資料庫</a>
        <a onclick="filterByCategory('devops')" class="toc-link block px-3 py-2 text-sm text-gray-600 rounded-r cursor-pointer">⚙️ DevOps</a>
        <a onclick="filterByCategory('ai')" class="toc-link block px-3 py-2 text-sm text-gray-600 rounded-r cursor-pointer">🤖 AI / ML</a>
        <a onclick="filterByCategory('security')" class="toc-link block px-3 py-2 text-sm text-gray-600 rounded-r cursor-pointer">🔒 資安</a>
      </div>
      <div class="mt-8 bg-wiki-50 rounded-xl p-4">
        <h4 class="font-bold text-gray-800 text-xs mb-2">📊 知識庫統計</h4>
        <div class="space-y-1 text-xs text-gray-500">
          <div class="flex justify-between"><span>文章總數</span><span class="font-medium text-gray-800">1,247</span></div>
          <div class="flex justify-between"><span>本月新增</span><span class="font-medium text-wiki-600">+38</span></div>
          <div class="flex justify-between"><span>貢獻者</span><span class="font-medium text-gray-800">156</span></div>
          <div class="flex justify-between"><span>總閱讀數</span><span class="font-medium text-gray-800">89.4K</span></div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 min-w-0">
    <!-- Featured Article -->
    <div class="bg-gradient-to-r from-wiki-500 to-emerald-600 rounded-2xl p-8 text-white mb-8">
      <span class="text-xs bg-white/20 px-2 py-0.5 rounded-full">🌟 精選文章</span>
      <h2 class="text-2xl font-bold mt-3 mb-2">2026 前端開發完整指南</h2>
      <p class="text-sm text-white/80 mb-4 max-w-lg">從 React 19 到 Tailwind v4，從 Vite 到 Bun — 一文掌握 2026 年前端生態系的所有重要變化。</p>
      <div class="flex items-center gap-4 text-xs text-white/60">
        <span>👤 Alex Chen</span><span>📅 2026/02/14</span><span>👁️ 3,842 次閱讀</span><span>⏱️ 25 分鐘</span>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex gap-2 mb-6">
      <button onclick="switchTab('latest')" class="tab-btn active text-xs px-4 py-1.5 rounded-full border border-gray-200 font-medium">最新發布</button>
      <button onclick="switchTab('popular')" class="tab-btn text-xs px-4 py-1.5 rounded-full border border-gray-200 text-gray-500 font-medium">熱門文章</button>
      <button onclick="switchTab('updated')" class="tab-btn text-xs px-4 py-1.5 rounded-full border border-gray-200 text-gray-500 font-medium">最近更新</button>
    </div>

    <!-- Article List -->
    <div id="articleList" class="space-y-3">
      <div class="article-link bg-white rounded-xl p-5 border border-gray-100 cursor-pointer" data-category="framework" onclick="showWikiArticle(this)">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">框架工具</span>
              <span class="text-[10px] text-gray-300">v3.2</span>
            </div>
            <h3 class="font-bold text-gray-800 text-sm">Next.js 16 App Router 完全攻略</h3>
            <p class="text-xs text-gray-400 mt-1">Server Components、Streaming SSR、Route Handlers 深入解析，附帶完整範例程式碼。</p>
            <div class="flex items-center gap-3 mt-2 text-[10px] text-gray-300"><span>👤 Sarah Lin</span><span>📅 2026/02/12</span><span>👁️ 2,156</span><span>💬 24</span></div>
          </div>
          <div class="flex gap-1 ml-4"><span class="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded">React</span><span class="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded">SSR</span></div>
        </div>
      </div>
      <div class="article-link bg-white rounded-xl p-5 border border-gray-100 cursor-pointer" data-category="lang" onclick="showWikiArticle(this)">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded font-medium">程式語言</span>
            </div>
            <h3 class="font-bold text-gray-800 text-sm">TypeScript 5.8 新功能完整解析</h3>
            <p class="text-xs text-gray-400 mt-1">Isolated Declarations、Inferred Type Predicates、正則表達式型別等重要更新。</p>
            <div class="flex items-center gap-3 mt-2 text-[10px] text-gray-300"><span>👤 Kevin Wu</span><span>📅 2026/02/10</span><span>👁️ 1,893</span><span>💬 18</span></div>
          </div>
          <div class="flex gap-1 ml-4"><span class="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded">TS</span><span class="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded">型別</span></div>
        </div>
      </div>
      <div class="article-link bg-white rounded-xl p-5 border border-gray-100 cursor-pointer" data-category="database" onclick="showWikiArticle(this)">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-medium">資料庫</span>
            </div>
            <h3 class="font-bold text-gray-800 text-sm">PostgreSQL vs MySQL 2026 效能對比</h3>
            <p class="text-xs text-gray-400 mt-1">JSONB 查詢、全文搜索、地理空間索引、並發性能等多維度實測比較。</p>
            <div class="flex items-center gap-3 mt-2 text-[10px] text-gray-300"><span>👤 David Huang</span><span>📅 2026/02/08</span><span>👁️ 1,567</span><span>💬 31</span></div>
          </div>
          <div class="flex gap-1 ml-4"><span class="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded">PG</span><span class="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded">MySQL</span></div>
        </div>
      </div>
      <div class="article-link bg-white rounded-xl p-5 border border-gray-100 cursor-pointer" data-category="ai" onclick="showWikiArticle(this)">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-medium">AI / ML</span>
              <span class="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-medium">🔥 Hot</span>
            </div>
            <h3 class="font-bold text-gray-800 text-sm">用 Claude API 打造 AI Agent 實戰</h3>
            <p class="text-xs text-gray-400 mt-1">Tool Use、Function Calling、Multi-turn Conversation 完整教學，含生產環境最佳實踐。</p>
            <div class="flex items-center gap-3 mt-2 text-[10px] text-gray-300"><span>👤 Alex Chen</span><span>📅 2026/02/05</span><span>👁️ 4,231</span><span>💬 56</span></div>
          </div>
          <div class="flex gap-1 ml-4"><span class="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded">Claude</span><span class="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded">Agent</span></div>
        </div>
      </div>
      <div class="article-link bg-white rounded-xl p-5 border border-gray-100 cursor-pointer" data-category="devops" onclick="showWikiArticle(this)">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-medium">DevOps</span>
            </div>
            <h3 class="font-bold text-gray-800 text-sm">Docker Compose v3 到 Kubernetes 遷移指南</h3>
            <p class="text-xs text-gray-400 mt-1">從本地開發到 K8s 部署，Helm Chart 配置、Service Mesh、監控告警一站式教學。</p>
            <div class="flex items-center gap-3 mt-2 text-[10px] text-gray-300"><span>👤 Mike Liu</span><span>📅 2026/02/01</span><span>👁️ 987</span><span>💬 12</span></div>
          </div>
          <div class="flex gap-1 ml-4"><span class="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded">K8s</span><span class="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded">Docker</span></div>
        </div>
      </div>
      <div class="article-link bg-white rounded-xl p-5 border border-gray-100 cursor-pointer" data-category="security" onclick="showWikiArticle(this)">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-medium">資安</span>
            </div>
            <h3 class="font-bold text-gray-800 text-sm">OWASP Top 10 (2026) 防禦實戰</h3>
            <p class="text-xs text-gray-400 mt-1">XSS、CSRF、SQL Injection、SSRF 等常見漏洞的攻防技巧與修復方案。</p>
            <div class="flex items-center gap-3 mt-2 text-[10px] text-gray-300"><span>👤 James Tsai</span><span>📅 2026/01/28</span><span>👁️ 1,342</span><span>💬 19</span></div>
          </div>
          <div class="flex gap-1 ml-4"><span class="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded">OWASP</span><span class="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded">安全</span></div>
        </div>
      </div>
    </div>

    <!-- Top Contributors -->
    <section class="mt-10 bg-white rounded-2xl border border-gray-100 p-6">
      <h3 class="font-bold text-gray-800 mb-4">🏆 本月貢獻者排行</h3>
      <div class="grid grid-cols-4 gap-4">
        <div class="text-center">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 flex items-center justify-center text-lg mx-auto mb-2">🥇</div>
          <div class="font-bold text-gray-800 text-xs">Alex Chen</div>
          <div class="text-[10px] text-gray-400">12 篇 · 8.2K 閱讀</div>
        </div>
        <div class="text-center">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-lg mx-auto mb-2">🥈</div>
          <div class="font-bold text-gray-800 text-xs">Sarah Lin</div>
          <div class="text-[10px] text-gray-400">9 篇 · 5.6K 閱讀</div>
        </div>
        <div class="text-center">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg mx-auto mb-2">🥉</div>
          <div class="font-bold text-gray-800 text-xs">Kevin Wu</div>
          <div class="text-[10px] text-gray-400">7 篇 · 4.1K 閱讀</div>
        </div>
        <div class="text-center">
          <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg mx-auto mb-2">4</div>
          <div class="font-bold text-gray-800 text-xs">David Huang</div>
          <div class="text-[10px] text-gray-400">5 篇 · 3.8K 閱讀</div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="mt-10">
      <h3 class="font-bold text-gray-800 mb-4">❓ 常見問題</h3>
      <div class="space-y-2">
        <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-gray-800 hover:bg-gray-50 transition"><span>如何投稿文章？</span><span class="text-wiki-500 text-lg">+</span></button>
          <div class="faq-answer px-4 pb-4 text-xs text-gray-500">點擊右上角「投稿」按鈕，填寫標題、分類和內容即可提交。支援 Markdown 語法。審核通常在 1-2 個工作天完成，通過後會自動發布並通知你。</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-gray-800 hover:bg-gray-50 transition"><span>文章可以多人協作嗎？</span><span class="text-wiki-500 text-lg">+</span></button>
          <div class="faq-answer px-4 pb-4 text-xs text-gray-500">可以！每篇文章都有「編輯歷史」和「建議修改」功能。你可以對任何文章提出修改建議，原作者審核通過後即可合併。</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-gray-800 hover:bg-gray-50 transition"><span>支援哪些程式碼語法高亮？</span><span class="text-wiki-500 text-lg">+</span></button>
          <div class="faq-answer px-4 pb-4 text-xs text-gray-500">支援超過 100 種語言的語法高亮，包括 JavaScript、TypeScript、Python、Go、Rust、SQL、Shell 等。使用 Markdown 的程式碼區塊語法 ```lang 即可。</div>
        </div>
      </div>
    </section>
  </main>
</div>

<footer class="bg-gray-900 text-gray-400 py-6 mt-8">
  <div class="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs">
    <div class="flex items-center gap-2"><div class="w-6 h-6 rounded bg-wiki-500 flex items-center justify-center text-white text-[10px] font-bold">W</div><span class="text-white font-medium">WikiBase</span></div>
    <div class="flex gap-6">
      <a class="hover:text-white transition cursor-pointer">關於我們</a>
      <a class="hover:text-white transition cursor-pointer">投稿規範</a>
      <a class="hover:text-white transition cursor-pointer">API 文件</a>
      <a class="hover:text-white transition cursor-pointer">隱私政策</a>
    </div>
    <div>© 2026 WikiBase · 知識共享，眾人受益</div>
  </div>
</footer>

<script>
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const icon = btn.querySelector('span:last-child');
  answer.classList.toggle('open');
  icon.textContent = answer.classList.contains('open') ? '−' : '+';
}
function filterByCategory(cat) {
  document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('#articleList > div').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
  });
}
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}
function searchArticles(query) {
  const results = document.getElementById('searchResults');
  if (!query.trim()) { results.classList.add('hidden'); return; }
  const articles = document.querySelectorAll('#articleList > div');
  let html = '';
  articles.forEach(a => {
    const title = a.querySelector('h3').textContent;
    const desc = a.querySelector('p').textContent;
    if (title.toLowerCase().includes(query.toLowerCase()) || desc.toLowerCase().includes(query.toLowerCase())) {
      html += '<div class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50" onclick="document.getElementById(\'searchResults\').classList.add(\'hidden\');document.getElementById(\'searchInput\').value=\'\'"><div class="font-medium text-sm text-gray-800">' + title + '</div><div class="text-xs text-gray-400 mt-0.5 line-clamp-1">' + desc + '</div></div>';
    }
  });
  results.innerHTML = html || '<div class="p-4 text-sm text-gray-400 text-center">沒有找到相關文章</div>';
  results.classList.remove('hidden');
}
function showWikiArticle(el) {
  const title = el.querySelector('h3').textContent;
  const desc = el.querySelector('p').textContent;
  alert('📖 ' + title + '\n\n' + desc);
}
document.addEventListener('click', e => {
  if (!e.target.closest('#searchResults') && !e.target.closest('#searchInput')) {
    document.getElementById('searchResults').classList.add('hidden');
  }
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
