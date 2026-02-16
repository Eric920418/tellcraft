INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '416c7690-2144-4247-b077-4fcd1d3ed1ea',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>團隊協作 TeamSync</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { jakarta: ['Plus Jakarta Sans', 'sans-serif'] },
      colors: {
        sync: { 50:'#eff6ff', 100:'#dbeafe', 200:'#bfdbfe', 400:'#60a5fa', 500:'#3b82f6', 600:'#2563eb', 700:'#1d4ed8' },
        mint: { 400:'#34d399', 500:'#10b981' }
      }
    }
  }
}
</script>
<style>
* { font-family: 'Plus Jakarta Sans', sans-serif; }
body { background: #f8fafc; }
.sidebar-item { transition: all 0.2s; }
.sidebar-item:hover, .sidebar-item.active { background: rgba(59,130,246,0.08); color: #2563eb; }
.kanban-card { transition: all 0.2s; cursor: grab; }
.kanban-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.avatar-stack .avatar { margin-left: -6px; border: 2px solid white; }
.avatar-stack .avatar:first-child { margin-left: 0; }
</style>
</head>
<body class="min-h-screen flex">

<!-- Sidebar -->
<aside class="w-60 bg-white border-r border-gray-100 flex flex-col min-h-screen">
  <div class="p-5 border-b border-gray-50">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg bg-sync-500 flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
      </div>
      <span class="font-bold text-gray-800">TeamSync</span>
    </div>
    <div class="mt-3 text-xs text-gray-400">Tellcraft 團隊 · 12 位成員</div>
  </div>
  <nav class="flex-1 p-3 space-y-0.5">
    <div class="sidebar-item active flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer" onclick="switchPage('board')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      看板
    </div>
    <div class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('timeline')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>
      甘特圖
    </div>
    <div class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('files')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
      文件
    </div>
    <div class="sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('chat')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      聊天
      <span class="ml-auto text-[10px] bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center">3</span>
    </div>
    <div class="mt-4 pt-3 border-t border-gray-50">
      <div class="text-[10px] text-gray-400 uppercase tracking-wider px-3 mb-2">專案</div>
      <div class="sidebar-item flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 cursor-pointer">
        <span class="w-2 h-2 rounded-full bg-sync-500"></span>官網改版
      </div>
      <div class="sidebar-item flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 cursor-pointer">
        <span class="w-2 h-2 rounded-full bg-mint-500"></span>App v2.0
      </div>
      <div class="sidebar-item flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 cursor-pointer">
        <span class="w-2 h-2 rounded-full bg-amber-500"></span>行銷活動
      </div>
    </div>
  </nav>
  <div class="p-4 border-t border-gray-50">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-sync-100 flex items-center justify-center text-sync-600 text-sm font-semibold">E</div>
      <div class="text-sm"><div class="font-medium text-gray-700">Eric</div><div class="text-xs text-gray-400">管理員</div></div>
    </div>
  </div>
</aside>

<!-- Main -->
<main class="flex-1 overflow-auto">
  <!-- Board Page -->
  <div id="page-board" class="page p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-800">官網改版</h1>
        <p class="text-sm text-gray-400 mt-0.5">Sprint 4 · 2/10 - 2/23</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="avatar-stack flex">
          <div class="avatar w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-medium">E</div>
          <div class="avatar w-7 h-7 rounded-full bg-pink-100 text-pink-600 text-xs flex items-center justify-center font-medium">L</div>
          <div class="avatar w-7 h-7 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center font-medium">W</div>
          <div class="avatar w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-medium">+3</div>
        </div>
        <button class="bg-sync-500 hover:bg-sync-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">+ 新任務</button>
      </div>
    </div>

    <!-- Kanban Board -->
    <div class="grid grid-cols-4 gap-4">
      <!-- To Do -->
      <div class="bg-gray-50 rounded-xl p-3">
        <div class="flex items-center justify-between mb-3 px-1">
          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-gray-400"></span><span class="text-sm font-semibold text-gray-600">待處理</span><span class="text-xs text-gray-400 ml-1">4</span></div>
        </div>
        <div class="space-y-2">
          <div class="kanban-card bg-white rounded-lg p-3 border border-gray-100">
            <div class="flex items-center gap-1 mb-2"><span class="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">高</span><span class="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">前端</span></div>
            <div class="text-sm font-medium text-gray-700">首頁 Hero 動畫效果</div>
            <div class="flex items-center justify-between mt-2">
              <div class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] flex items-center justify-center font-medium">E</div>
              <span class="text-[10px] text-gray-400">02/18</span>
            </div>
          </div>
          <div class="kanban-card bg-white rounded-lg p-3 border border-gray-100">
            <div class="flex items-center gap-1 mb-2"><span class="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-medium">中</span><span class="text-[10px] bg-green-50 text-green-500 px-1.5 py-0.5 rounded">後端</span></div>
            <div class="text-sm font-medium text-gray-700">API 文檔更新</div>
            <div class="flex items-center justify-between mt-2">
              <div class="w-5 h-5 rounded-full bg-green-100 text-green-600 text-[10px] flex items-center justify-center font-medium">W</div>
              <span class="text-[10px] text-gray-400">02/20</span>
            </div>
          </div>
          <div class="kanban-card bg-white rounded-lg p-3 border border-gray-100">
            <div class="flex items-center gap-1 mb-2"><span class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">低</span><span class="text-[10px] bg-purple-50 text-purple-500 px-1.5 py-0.5 rounded">設計</span></div>
            <div class="text-sm font-medium text-gray-700">Dark Mode 配色方案</div>
            <div class="flex items-center justify-between mt-2">
              <div class="w-5 h-5 rounded-full bg-pink-100 text-pink-600 text-[10px] flex items-center justify-center font-medium">L</div>
              <span class="text-[10px] text-gray-400">02/22</span>
            </div>
          </div>
        </div>
      </div>

      <!-- In Progress -->
      <div class="bg-blue-50/50 rounded-xl p-3">
        <div class="flex items-center justify-between mb-3 px-1">
          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-sync-500"></span><span class="text-sm font-semibold text-gray-600">進行中</span><span class="text-xs text-gray-400 ml-1">3</span></div>
        </div>
        <div class="space-y-2">
          <div class="kanban-card bg-white rounded-lg p-3 border border-blue-100">
            <div class="flex items-center gap-1 mb-2"><span class="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">高</span><span class="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">前端</span></div>
            <div class="text-sm font-medium text-gray-700">商品列表元件重構</div>
            <div class="w-full h-1 bg-gray-100 rounded-full mt-2 mb-1"><div class="h-full w-3/5 bg-sync-500 rounded-full"></div></div>
            <div class="flex items-center justify-between">
              <div class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] flex items-center justify-center font-medium">E</div>
              <span class="text-[10px] text-gray-400">60%</span>
            </div>
          </div>
          <div class="kanban-card bg-white rounded-lg p-3 border border-blue-100">
            <div class="flex items-center gap-1 mb-2"><span class="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">高</span><span class="text-[10px] bg-green-50 text-green-500 px-1.5 py-0.5 rounded">後端</span></div>
            <div class="text-sm font-medium text-gray-700">搜尋功能 Elasticsearch</div>
            <div class="w-full h-1 bg-gray-100 rounded-full mt-2 mb-1"><div class="h-full w-2/5 bg-sync-500 rounded-full"></div></div>
            <div class="flex items-center justify-between">
              <div class="w-5 h-5 rounded-full bg-green-100 text-green-600 text-[10px] flex items-center justify-center font-medium">W</div>
              <span class="text-[10px] text-gray-400">40%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Review -->
      <div class="bg-amber-50/50 rounded-xl p-3">
        <div class="flex items-center justify-between mb-3 px-1">
          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-amber-500"></span><span class="text-sm font-semibold text-gray-600">審查中</span><span class="text-xs text-gray-400 ml-1">2</span></div>
        </div>
        <div class="space-y-2">
          <div class="kanban-card bg-white rounded-lg p-3 border border-amber-100">
            <div class="flex items-center gap-1 mb-2"><span class="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-medium">中</span><span class="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">前端</span></div>
            <div class="text-sm font-medium text-gray-700">RWD 斷點修正</div>
            <div class="flex items-center justify-between mt-2">
              <div class="w-5 h-5 rounded-full bg-pink-100 text-pink-600 text-[10px] flex items-center justify-center font-medium">L</div>
              <span class="text-[10px] text-amber-500">等待 Review</span>
            </div>
          </div>
          <div class="kanban-card bg-white rounded-lg p-3 border border-amber-100">
            <div class="flex items-center gap-1 mb-2"><span class="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">高</span><span class="text-[10px] bg-purple-50 text-purple-500 px-1.5 py-0.5 rounded">設計</span></div>
            <div class="text-sm font-medium text-gray-700">結帳流程 UX 優化</div>
            <div class="flex items-center justify-between mt-2">
              <div class="w-5 h-5 rounded-full bg-pink-100 text-pink-600 text-[10px] flex items-center justify-center font-medium">L</div>
              <span class="text-[10px] text-amber-500">2 筆評論</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Done -->
      <div class="bg-green-50/50 rounded-xl p-3">
        <div class="flex items-center justify-between mb-3 px-1">
          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-mint-500"></span><span class="text-sm font-semibold text-gray-600">完成</span><span class="text-xs text-gray-400 ml-1">5</span></div>
        </div>
        <div class="space-y-2">
          <div class="kanban-card bg-white rounded-lg p-3 border border-green-100 opacity-70">
            <div class="text-sm font-medium text-gray-500 line-through">登入頁面改版</div>
            <div class="flex items-center justify-between mt-2">
              <div class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] flex items-center justify-center font-medium">E</div>
              <span class="text-[10px] text-mint-500">✓ 02/14</span>
            </div>
          </div>
          <div class="kanban-card bg-white rounded-lg p-3 border border-green-100 opacity-70">
            <div class="text-sm font-medium text-gray-500 line-through">SEO Meta Tags</div>
            <div class="flex items-center justify-between mt-2">
              <div class="w-5 h-5 rounded-full bg-green-100 text-green-600 text-[10px] flex items-center justify-center font-medium">W</div>
              <span class="text-[10px] text-mint-500">✓ 02/13</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Timeline Page -->
  <div id="page-timeline" class="page hidden p-6">
    <h1 class="text-xl font-bold text-gray-800 mb-6">甘特圖</h1>
    <div class="bg-white rounded-xl border border-gray-100 p-5">
      <div class="flex items-center gap-4 mb-4 text-xs text-gray-400">
        <span class="w-32 font-medium text-gray-600">任務</span>
        <div class="flex-1 grid grid-cols-14 gap-0">
          <span>10</span><span>11</span><span>12</span><span>13</span><span>14</span><span>15</span><span>16</span><span>17</span><span>18</span><span>19</span><span>20</span><span>21</span><span>22</span><span>23</span>
        </div>
      </div>
      <div class="space-y-3">
        <div class="flex items-center gap-4"><span class="w-32 text-sm text-gray-600 truncate">登入頁面改版</span><div class="flex-1 h-6 relative"><div class="absolute left-0 h-full bg-mint-500/20 border border-mint-500/40 rounded" style="width:28%;left:0"></div></div></div>
        <div class="flex items-center gap-4"><span class="w-32 text-sm text-gray-600 truncate">SEO Meta Tags</span><div class="flex-1 h-6 relative"><div class="absolute h-full bg-mint-500/20 border border-mint-500/40 rounded" style="width:21%;left:7%"></div></div></div>
        <div class="flex items-center gap-4"><span class="w-32 text-sm text-gray-600 truncate">商品列表重構</span><div class="flex-1 h-6 relative"><div class="absolute h-full bg-sync-500/20 border border-sync-500/40 rounded" style="width:42%;left:14%"></div></div></div>
        <div class="flex items-center gap-4"><span class="w-32 text-sm text-gray-600 truncate">搜尋 ES 整合</span><div class="flex-1 h-6 relative"><div class="absolute h-full bg-sync-500/20 border border-sync-500/40 rounded" style="width:35%;left:21%"></div></div></div>
        <div class="flex items-center gap-4"><span class="w-32 text-sm text-gray-600 truncate">RWD 斷點修正</span><div class="flex-1 h-6 relative"><div class="absolute h-full bg-amber-400/20 border border-amber-400/40 rounded" style="width:28%;left:28%"></div></div></div>
        <div class="flex items-center gap-4"><span class="w-32 text-sm text-gray-600 truncate">Hero 動畫效果</span><div class="flex-1 h-6 relative"><div class="absolute h-full bg-gray-300/30 border border-gray-300 rounded border-dashed" style="width:21%;left:57%"></div></div></div>
      </div>
    </div>
  </div>

  <!-- Files Page -->
  <div id="page-files" class="page hidden p-6">
    <h1 class="text-xl font-bold text-gray-800 mb-6">共享文件</h1>
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-4 border border-gray-100 hover:border-sync-200 transition cursor-pointer text-center">
        <div class="text-4xl mb-2">📄</div>
        <div class="text-sm font-medium text-gray-700 truncate">PRD 需求文件.pdf</div>
        <div class="text-xs text-gray-400 mt-1">Eric · 2 天前</div>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-100 hover:border-sync-200 transition cursor-pointer text-center">
        <div class="text-4xl mb-2">🎨</div>
        <div class="text-sm font-medium text-gray-700 truncate">UI 設計稿.fig</div>
        <div class="text-xs text-gray-400 mt-1">Lisa · 3 天前</div>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-100 hover:border-sync-200 transition cursor-pointer text-center">
        <div class="text-4xl mb-2">📊</div>
        <div class="text-sm font-medium text-gray-700 truncate">Sprint 回顧.xlsx</div>
        <div class="text-xs text-gray-400 mt-1">Wang · 1 天前</div>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-100 hover:border-sync-200 transition cursor-pointer text-center">
        <div class="text-4xl mb-2">📝</div>
        <div class="text-sm font-medium text-gray-700 truncate">API 文件.md</div>
        <div class="text-xs text-gray-400 mt-1">Wang · 5 小時前</div>
      </div>
    </div>
  </div>

  <!-- Chat Page -->
  <div id="page-chat" class="page hidden p-6">
    <h1 class="text-xl font-bold text-gray-800 mb-6">團隊聊天</h1>
    <div class="bg-white rounded-xl border border-gray-100 h-[500px] flex flex-col">
      <div class="flex-1 p-4 space-y-4 overflow-auto">
        <div class="flex gap-3"><div class="w-7 h-7 rounded-full bg-pink-100 text-pink-600 text-xs flex items-center justify-center font-medium flex-shrink-0">L</div><div><div class="text-xs text-gray-400">Lisa · 10:32</div><div class="bg-gray-50 rounded-lg rounded-tl-none px-3 py-2 text-sm text-gray-700 mt-1 max-w-md">結帳流程的 UX 稿已經更新了，大家看看有沒有問題 🎨</div></div></div>
        <div class="flex gap-3"><div class="w-7 h-7 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center font-medium flex-shrink-0">W</div><div><div class="text-xs text-gray-400">Wang · 10:45</div><div class="bg-gray-50 rounded-lg rounded-tl-none px-3 py-2 text-sm text-gray-700 mt-1 max-w-md">收到，搜尋 API 那邊 Elasticsearch 的 mapping 已經設定好了，今天會完成 indexing 邏輯</div></div></div>
        <div class="flex gap-3 justify-end"><div class="text-right"><div class="text-xs text-gray-400">Eric · 11:02</div><div class="bg-sync-500 text-white rounded-lg rounded-tr-none px-3 py-2 text-sm mt-1 max-w-md">太好了！我這邊商品列表元件快完成了，預計今天下午可以 PR</div></div><div class="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-medium flex-shrink-0">E</div></div>
      </div>
      <div class="border-t border-gray-100 p-3 flex gap-2">
        <input type="text" placeholder="輸入訊息..." class="flex-1 text-sm bg-gray-50 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-sync-300">
        <button class="bg-sync-500 hover:bg-sync-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">發送</button>
      </div>
    </div>
  </div>
</main>

<script>
function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + page).classList.remove('hidden');
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
    item.classList.add('text-gray-500');
  });
  event.currentTarget.classList.add('active');
  event.currentTarget.classList.remove('text-gray-500');
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
