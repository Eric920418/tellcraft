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
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { fontFamily: { dm: ['DM Sans','sans-serif'] }, colors: { wiki: { 50:'#f0f9ff',100:'#e0f2fe',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7' } } } } }
</script>
<style>
* { font-family: 'DM Sans', sans-serif; }
body { background: #f8fafc; }
.tree-item { transition: background 0.15s; cursor: pointer; }
.tree-item:hover { background: rgba(14,165,233,0.06); }
.tree-item.active { background: rgba(14,165,233,0.1); color: #0284c7; }
</style>
</head>
<body class="min-h-screen flex">
<!-- Sidebar - Tree Nav -->
<aside class="w-64 bg-white border-r border-gray-100 flex flex-col min-h-screen">
  <div class="p-4 border-b border-gray-50">
    <div class="flex items-center gap-2 mb-3"><div class="w-8 h-8 rounded-lg bg-wiki-500 flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg></div><span class="font-bold text-gray-800 text-sm">WikiBase</span></div>
    <div class="relative"><svg class="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" placeholder="搜尋文件..." class="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-wiki-300"></div>
  </div>
  <nav class="flex-1 p-2 overflow-auto text-sm">
    <div class="text-[10px] text-gray-400 uppercase tracking-wider px-3 py-1 font-medium">文件目錄</div>
    <div class="tree-item active flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
      快速入門
    </div>
    <div class="ml-4 space-y-0.5">
      <div class="tree-item flex items-center gap-2 px-3 py-1 rounded text-gray-500 text-xs"><span class="w-1 h-1 rounded-full bg-gray-300"></span>安裝指南</div>
      <div class="tree-item flex items-center gap-2 px-3 py-1 rounded text-gray-500 text-xs"><span class="w-1 h-1 rounded-full bg-gray-300"></span>基礎設定</div>
      <div class="tree-item flex items-center gap-2 px-3 py-1 rounded text-gray-500 text-xs"><span class="w-1 h-1 rounded-full bg-gray-300"></span>第一個專案</div>
    </div>
    <div class="tree-item flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-600 font-medium mt-1">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
      API 文件
    </div>
    <div class="tree-item flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-600 font-medium mt-1">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
      部署指南
    </div>
    <div class="tree-item flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-600 font-medium mt-1">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
      FAQ
    </div>
  </nav>
</aside>

<!-- Main Content -->
<main class="flex-1 overflow-auto">
  <div class="max-w-4xl mx-auto px-8 py-8">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-1 text-xs text-gray-400 mb-4">
      <span class="hover:text-wiki-500 cursor-pointer">首頁</span><span>/</span><span class="hover:text-wiki-500 cursor-pointer">快速入門</span><span>/</span><span class="text-gray-600">安裝指南</span>
    </div>

    <!-- Article -->
    <article>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">安裝指南</h1>
        <div class="flex items-center gap-2">
          <button class="text-xs text-gray-400 hover:text-wiki-500 border border-gray-200 px-2 py-1 rounded transition cursor-pointer">✏️ 編輯</button>
          <button class="text-xs text-gray-400 hover:text-wiki-500 border border-gray-200 px-2 py-1 rounded transition cursor-pointer">📋 歷史</button>
        </div>
      </div>

      <div class="flex items-center gap-4 mb-6 text-xs text-gray-400">
        <span>最後更新：2026/02/14</span>
        <span>·</span>
        <span>作者：Eric</span>
        <span>·</span>
        <span>版本 v3.2</span>
      </div>

      <div class="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-4">
        <div class="bg-wiki-50 border border-wiki-100 rounded-lg p-4 text-sm">
          <div class="font-medium text-wiki-600 mb-1">💡 前置條件</div>
          <ul class="text-xs text-gray-500 space-y-0.5 ml-4 list-disc">
            <li>Node.js 18+ 已安裝</li>
            <li>pnpm 套件管理器</li>
            <li>PostgreSQL 15+ 資料庫</li>
          </ul>
        </div>

        <h2 class="text-lg font-bold text-gray-800 mt-6">1. 安裝專案</h2>
        <p class="text-sm">首先，從 GitHub 複製專案並安裝依賴：</p>
        <div class="bg-gray-900 text-gray-200 rounded-lg p-4 text-xs font-mono overflow-x-auto">
          <div class="text-gray-500"># 複製專案</div>
          <div>git clone https://github.com/your-org/project.git</div>
          <div class="text-gray-500 mt-2"># 安裝依賴</div>
          <div>cd project && pnpm install</div>
        </div>

        <h2 class="text-lg font-bold text-gray-800 mt-6">2. 環境設定</h2>
        <p class="text-sm">複製 <code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-pink-600">.env.example</code> 並填入你的設定值：</p>
        <div class="bg-gray-900 text-gray-200 rounded-lg p-4 text-xs font-mono overflow-x-auto">
          <div>cp .env.example .env</div>
          <div class="text-gray-500 mt-2"># 編輯 .env 檔案</div>
          <div>DATABASE_URL=postgresql://user:pass@localhost:5432/db</div>
          <div>REDIS_URL=redis://localhost:6379</div>
        </div>

        <h2 class="text-lg font-bold text-gray-800 mt-6">3. 啟動開發伺服器</h2>
        <div class="bg-gray-900 text-gray-200 rounded-lg p-4 text-xs font-mono">
          <div>pnpm dev</div>
          <div class="text-green-400 mt-1"># ✓ Server running at http://localhost:3000</div>
        </div>

        <div class="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm mt-4">
          <div class="font-medium text-amber-700 mb-1">⚠️ 注意</div>
          <p class="text-xs text-amber-600">請確保 Redis 服務已啟動，否則佇列功能將無法正常運作。</p>
        </div>
      </div>

      <!-- Tags -->
      <div class="flex items-center gap-2 mt-8 pt-6 border-t border-gray-100">
        <span class="text-xs text-gray-400">標籤：</span>
        <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">安裝</span>
        <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">入門</span>
        <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">開發環境</span>
      </div>

      <!-- Prev/Next -->
      <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 text-sm">
        <span class="text-gray-400">← 快速入門</span>
        <a class="text-wiki-500 hover:text-wiki-600 cursor-pointer font-medium">基礎設定 →</a>
      </div>
    </article>
  </div>
</main>

<!-- TOC Sidebar -->
<aside class="w-48 border-l border-gray-100 bg-white p-4 min-h-screen hidden lg:block">
  <div class="sticky top-20">
    <div class="text-[10px] text-gray-400 uppercase tracking-wider mb-3 font-medium">本頁目錄</div>
    <div class="space-y-1.5 text-xs">
      <a class="block text-wiki-600 font-medium cursor-pointer">1. 安裝專案</a>
      <a class="block text-gray-400 hover:text-wiki-500 cursor-pointer">2. 環境設定</a>
      <a class="block text-gray-400 hover:text-wiki-500 cursor-pointer">3. 啟動開發伺服器</a>
    </div>
  </div>
</aside>
</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
