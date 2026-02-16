INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '6b55a394-e05f-4ed9-b601-7b921c8c0981',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TaskFlow — 專案管理平台</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        pm: { 50:'#faf5ff', 100:'#f3e8ff', 200:'#e9d5ff', 300:'#d8b4fe', 400:'#c084fc', 500:'#a855f7', 600:'#9333ea', 700:'#7e22ce', 800:'#6b21a8', 900:'#581c87' },
        board: { 50:'#f8fafc', 100:'#f1f5f9', 200:'#e2e8f0', 300:'#cbd5e1', 400:'#94a3b8', 500:'#64748b', 600:'#475569', 700:'#334155', 800:'#1e293b', 900:'#0f172a', 950:'#020617' }
      },
      fontFamily: { inter:['Inter','Noto Sans TC','sans-serif'] }
    }
  }
}
</script>
<style>
  * { font-family: 'Inter', 'Noto Sans TC', sans-serif; }
  .sidebar-link.active { background: rgba(168,85,247,0.1); color: #a855f7; border-right: 3px solid #a855f7; }
  .kanban-card { cursor: grab; }
  .kanban-card:active { cursor: grabbing; }
  .reveal { opacity:0; transform:translateY(16px); transition:all 0.4s ease; }
  .reveal.visible { opacity:1; transform:translateY(0); }
</style>
</head>
<body class="bg-board-950 text-board-200">

<div class="flex h-screen overflow-hidden">
  <!-- Sidebar -->
  <aside class="w-60 bg-board-900 border-r border-board-800 flex flex-col flex-shrink-0 hidden md:flex">
    <div class="p-5 border-b border-board-800">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 bg-pm-500 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </div>
        <span class="font-bold text-white">TaskFlow</span>
      </div>
    </div>
    <nav class="flex-1 py-4">
      <div class="px-3 mb-2 text-[10px] tracking-wider uppercase text-board-500 font-medium">主選單</div>
      <a href="#" onclick="switchPage('board')" class="sidebar-link active flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-board-400 hover:bg-board-800 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>
        看板
      </a>
      <a href="#" onclick="switchPage('timeline')" class="sidebar-link flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-board-400 hover:bg-board-800 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        時間軸
      </a>
      <a href="#" onclick="switchPage('members')" class="sidebar-link flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-board-400 hover:bg-board-800 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        成員
      </a>
      <a href="#" onclick="switchPage('settings')" class="sidebar-link flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-board-400 hover:bg-board-800 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        設定
      </a>
      <div class="px-3 mt-6 mb-2 text-[10px] tracking-wider uppercase text-board-500 font-medium">專案</div>
      <a href="#" class="flex items-center gap-3 px-5 py-2 text-sm text-board-400 hover:bg-board-800 transition-colors">
        <span class="w-2 h-2 rounded-full bg-pm-500"></span>Tellcraft 官網重構
      </a>
      <a href="#" class="flex items-center gap-3 px-5 py-2 text-sm text-board-400 hover:bg-board-800 transition-colors">
        <span class="w-2 h-2 rounded-full bg-blue-500"></span>App 2.0 開發
      </a>
      <a href="#" class="flex items-center gap-3 px-5 py-2 text-sm text-board-400 hover:bg-board-800 transition-colors">
        <span class="w-2 h-2 rounded-full bg-green-500"></span>行銷活動 Q1
      </a>
    </nav>
    <div class="p-4 border-t border-board-800">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-pm-500 flex items-center justify-center text-white text-xs font-bold">EC</div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-board-200 truncate">Eric Chen</p>
          <p class="text-xs text-board-500">Admin</p>
        </div>
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col overflow-hidden">
    <!-- Top Bar -->
    <header class="h-14 bg-board-900 border-b border-board-800 flex items-center px-6 gap-4 flex-shrink-0">
      <button onclick="document.querySelector('aside').classList.toggle('hidden')" class="md:hidden text-board-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <h1 class="font-semibold text-white text-sm">Tellcraft 官網重構</h1>
      <div class="flex items-center gap-1 ml-2">
        <span class="px-2 py-0.5 bg-pm-500/20 text-pm-400 text-[10px] rounded-full font-medium">進行中</span>
        <span class="px-2 py-0.5 bg-board-800 text-board-400 text-[10px] rounded-full font-medium">Sprint 4</span>
      </div>
      <div class="flex-1"></div>
      <div class="flex items-center gap-3">
        <div class="flex -space-x-2">
          <div class="w-7 h-7 rounded-full bg-pm-500 border-2 border-board-900 flex items-center justify-center text-[10px] text-white font-bold">EC</div>
          <div class="w-7 h-7 rounded-full bg-blue-500 border-2 border-board-900 flex items-center justify-center text-[10px] text-white font-bold">JL</div>
          <div class="w-7 h-7 rounded-full bg-green-500 border-2 border-board-900 flex items-center justify-center text-[10px] text-white font-bold">AW</div>
          <div class="w-7 h-7 rounded-full bg-orange-500 border-2 border-board-900 flex items-center justify-center text-[10px] text-white font-bold">SL</div>
        </div>
        <button onclick="showToast('搜尋功能 Coming Soon')" class="text-board-400 hover:text-board-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </button>
        <button onclick="showToast('篩選功能 Coming Soon')" class="text-board-400 hover:text-board-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
        </button>
      </div>
    </header>

    <!-- Page Content -->
    <div class="flex-1 overflow-auto">
      <!-- Board Page -->
      <div id="page-board" class="p-6 h-full">
        <div class="flex gap-5 h-full overflow-x-auto pb-4">
          <!-- Column: Backlog -->
          <div class="flex-shrink-0 w-72">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-board-400"></span><h3 class="text-sm font-semibold text-board-300">待辦</h3><span class="text-xs text-board-500 bg-board-800 px-1.5 rounded">4</span></div>
              <button onclick="showToast('新增任務')" class="text-board-500 hover:text-board-300 text-lg">+</button>
            </div>
            <div class="space-y-2.5">
              <div class="kanban-card bg-board-800 rounded-lg p-3.5 border border-board-700 hover:border-pm-500/30 transition-colors">
                <div class="flex items-center gap-1.5 mb-2"><span class="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded font-medium">Bug</span><span class="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] rounded font-medium">高</span></div>
                <p class="text-sm font-medium mb-2">修復部署後 CSS 遺失問題</p>
                <div class="flex items-center justify-between"><div class="w-5 h-5 rounded-full bg-pm-500 flex items-center justify-center text-[8px] text-white font-bold">EC</div><span class="text-[10px] text-board-500">2/15</span></div>
              </div>
              <div class="kanban-card bg-board-800 rounded-lg p-3.5 border border-board-700 hover:border-pm-500/30 transition-colors">
                <div class="flex items-center gap-1.5 mb-2"><span class="px-1.5 py-0.5 bg-pm-500/20 text-pm-400 text-[10px] rounded font-medium">Feature</span></div>
                <p class="text-sm font-medium mb-2">新增深色模式切換</p>
                <div class="flex items-center justify-between"><div class="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">JL</div><span class="text-[10px] text-board-500">2/18</span></div>
              </div>
              <div class="kanban-card bg-board-800 rounded-lg p-3.5 border border-board-700 hover:border-pm-500/30 transition-colors">
                <div class="flex items-center gap-1.5 mb-2"><span class="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded font-medium">Design</span></div>
                <p class="text-sm font-medium mb-2">About 頁面 UI 設計</p>
                <div class="flex items-center justify-between"><div class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[8px] text-white font-bold">AW</div><span class="text-[10px] text-board-500">2/20</span></div>
              </div>
              <div class="kanban-card bg-board-800 rounded-lg p-3.5 border border-board-700 hover:border-pm-500/30 transition-colors">
                <div class="flex items-center gap-1.5 mb-2"><span class="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded font-medium">Chore</span></div>
                <p class="text-sm font-medium mb-2">升級 Next.js 到 v16</p>
                <div class="flex items-center justify-between"><div class="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[8px] text-white font-bold">SL</div><span class="text-[10px] text-board-500">2/22</span></div>
              </div>
            </div>
          </div>
          <!-- Column: In Progress -->
          <div class="flex-shrink-0 w-72">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-pm-500"></span><h3 class="text-sm font-semibold text-board-300">進行中</h3><span class="text-xs text-board-500 bg-board-800 px-1.5 rounded">3</span></div>
              <button onclick="showToast('新增任務')" class="text-board-500 hover:text-board-300 text-lg">+</button>
            </div>
            <div class="space-y-2.5">
              <div class="kanban-card bg-board-800 rounded-lg p-3.5 border border-pm-500/30">
                <div class="flex items-center gap-1.5 mb-2"><span class="px-1.5 py-0.5 bg-pm-500/20 text-pm-400 text-[10px] rounded font-medium">Feature</span><span class="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded font-medium">高</span></div>
                <p class="text-sm font-medium mb-2">模板預覽系統重構</p>
                <div class="w-full bg-board-700 rounded-full h-1.5 mb-2"><div class="bg-pm-500 h-1.5 rounded-full" style="width:72%"></div></div>
                <div class="flex items-center justify-between"><div class="w-5 h-5 rounded-full bg-pm-500 flex items-center justify-center text-[8px] text-white font-bold">EC</div><span class="text-[10px] text-board-500">72%</span></div>
              </div>
              <div class="kanban-card bg-board-800 rounded-lg p-3.5 border border-pm-500/30">
                <div class="flex items-center gap-1.5 mb-2"><span class="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded font-medium">Design</span></div>
                <p class="text-sm font-medium mb-2">首頁 Hero Section 重新設計</p>
                <div class="w-full bg-board-700 rounded-full h-1.5 mb-2"><div class="bg-blue-500 h-1.5 rounded-full" style="width:45%"></div></div>
                <div class="flex items-center justify-between"><div class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[8px] text-white font-bold">AW</div><span class="text-[10px] text-board-500">45%</span></div>
              </div>
              <div class="kanban-card bg-board-800 rounded-lg p-3.5 border border-pm-500/30">
                <div class="flex items-center gap-1.5 mb-2"><span class="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded font-medium">Test</span></div>
                <p class="text-sm font-medium mb-2">E2E 測試覆蓋率提升</p>
                <div class="w-full bg-board-700 rounded-full h-1.5 mb-2"><div class="bg-green-500 h-1.5 rounded-full" style="width:30%"></div></div>
                <div class="flex items-center justify-between"><div class="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[8px] text-white font-bold">SL</div><span class="text-[10px] text-board-500">30%</span></div>
              </div>
            </div>
          </div>
          <!-- Column: Review -->
          <div class="flex-shrink-0 w-72">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span><h3 class="text-sm font-semibold text-board-300">審核中</h3><span class="text-xs text-board-500 bg-board-800 px-1.5 rounded">2</span></div>
            </div>
            <div class="space-y-2.5">
              <div class="kanban-card bg-board-800 rounded-lg p-3.5 border border-amber-500/30">
                <div class="flex items-center gap-1.5 mb-2"><span class="px-1.5 py-0.5 bg-pm-500/20 text-pm-400 text-[10px] rounded font-medium">Feature</span></div>
                <p class="text-sm font-medium mb-2">使用者認證 OAuth 整合</p>
                <div class="flex items-center gap-1 mb-2"><span class="text-amber-400 text-xs">⏳</span><span class="text-[10px] text-board-500">等待 Code Review</span></div>
                <div class="flex items-center justify-between"><div class="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">JL</div><span class="text-[10px] text-board-500">PR #47</span></div>
              </div>
              <div class="kanban-card bg-board-800 rounded-lg p-3.5 border border-amber-500/30">
                <div class="flex items-center gap-1.5 mb-2"><span class="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded font-medium">Design</span></div>
                <p class="text-sm font-medium mb-2">Pricing 頁面 UI</p>
                <div class="flex items-center gap-1 mb-2"><span class="text-amber-400 text-xs">⏳</span><span class="text-[10px] text-board-500">等待客戶確認</span></div>
                <div class="flex items-center justify-between"><div class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[8px] text-white font-bold">AW</div><span class="text-[10px] text-board-500">Figma</span></div>
              </div>
            </div>
          </div>
          <!-- Column: Done -->
          <div class="flex-shrink-0 w-72">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-green-500"></span><h3 class="text-sm font-semibold text-board-300">完成</h3><span class="text-xs text-board-500 bg-board-800 px-1.5 rounded">5</span></div>
            </div>
            <div class="space-y-2.5">
              <div class="kanban-card bg-board-800 rounded-lg p-3.5 border border-board-700 opacity-70">
                <p class="text-sm font-medium mb-2 line-through text-board-400">資料庫 Schema 設計</p>
                <div class="flex items-center justify-between"><div class="w-5 h-5 rounded-full bg-pm-500 flex items-center justify-center text-[8px] text-white font-bold">EC</div><span class="text-[10px] text-green-500">✓ 完成</span></div>
              </div>
              <div class="kanban-card bg-board-800 rounded-lg p-3.5 border border-board-700 opacity-70">
                <p class="text-sm font-medium mb-2 line-through text-board-400">API 路由架構</p>
                <div class="flex items-center justify-between"><div class="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">JL</div><span class="text-[10px] text-green-500">✓ 完成</span></div>
              </div>
              <div class="kanban-card bg-board-800 rounded-lg p-3.5 border border-board-700 opacity-70">
                <p class="text-sm font-medium mb-2 line-through text-board-400">Design System 建立</p>
                <div class="flex items-center justify-between"><div class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[8px] text-white font-bold">AW</div><span class="text-[10px] text-green-500">✓ 完成</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Page -->
      <div id="page-timeline" class="p-6 hidden">
        <h2 class="text-lg font-semibold text-white mb-6">Sprint 4 時間軸</h2>
        <div class="space-y-1 overflow-x-auto">
          <div class="flex items-center gap-3 text-xs text-board-500 mb-2 min-w-[600px]">
            <div class="w-40"></div>
            <div class="flex-1 grid grid-cols-14 gap-0">
              <span>2/3</span><span>2/4</span><span>2/5</span><span>2/6</span><span>2/7</span><span>2/10</span><span>2/11</span><span>2/12</span><span>2/13</span><span>2/14</span><span>2/17</span><span>2/18</span><span>2/19</span><span>2/20</span>
            </div>
          </div>
          <div class="flex items-center gap-3 min-w-[600px]">
            <div class="w-40 text-sm truncate">模板預覽系統</div>
            <div class="flex-1 relative h-7"><div class="absolute top-1 left-[5%] w-[55%] h-5 bg-pm-500/30 rounded border border-pm-500/50"><div class="h-full bg-pm-500/60 rounded" style="width:72%"></div></div></div>
          </div>
          <div class="flex items-center gap-3 min-w-[600px]">
            <div class="w-40 text-sm truncate">Hero Section 設計</div>
            <div class="flex-1 relative h-7"><div class="absolute top-1 left-[15%] w-[40%] h-5 bg-blue-500/30 rounded border border-blue-500/50"><div class="h-full bg-blue-500/60 rounded" style="width:45%"></div></div></div>
          </div>
          <div class="flex items-center gap-3 min-w-[600px]">
            <div class="w-40 text-sm truncate">OAuth 整合</div>
            <div class="flex-1 relative h-7"><div class="absolute top-1 left-[0%] w-[50%] h-5 bg-green-500/30 rounded border border-green-500/50"><div class="h-full bg-green-500/60 rounded" style="width:100%"></div></div></div>
          </div>
          <div class="flex items-center gap-3 min-w-[600px]">
            <div class="w-40 text-sm truncate">E2E 測試</div>
            <div class="flex-1 relative h-7"><div class="absolute top-1 left-[25%] w-[45%] h-5 bg-orange-500/30 rounded border border-orange-500/50"><div class="h-full bg-orange-500/60 rounded" style="width:30%"></div></div></div>
          </div>
          <div class="flex items-center gap-3 min-w-[600px]">
            <div class="w-40 text-sm truncate">深色模式</div>
            <div class="flex-1 relative h-7"><div class="absolute top-1 left-[50%] w-[35%] h-5 bg-board-600/30 rounded border border-board-500/50 border-dashed"></div></div>
          </div>
        </div>
        <div class="mt-8 grid sm:grid-cols-3 gap-4">
          <div class="bg-board-800 rounded-lg p-4 border border-board-700">
            <p class="text-xs text-board-500 mb-1">Sprint 進度</p>
            <p class="text-2xl font-bold text-white">64%</p>
            <div class="w-full bg-board-700 rounded-full h-2 mt-2"><div class="bg-pm-500 h-2 rounded-full" style="width:64%"></div></div>
          </div>
          <div class="bg-board-800 rounded-lg p-4 border border-board-700">
            <p class="text-xs text-board-500 mb-1">剩餘天數</p>
            <p class="text-2xl font-bold text-white">6 天</p>
            <p class="text-xs text-board-500 mt-2">截止 2/20</p>
          </div>
          <div class="bg-board-800 rounded-lg p-4 border border-board-700">
            <p class="text-xs text-board-500 mb-1">完成任務</p>
            <p class="text-2xl font-bold text-white">5 / 14</p>
            <p class="text-xs text-board-500 mt-2">9 個待完成</p>
          </div>
        </div>
      </div>

      <!-- Members Page -->
      <div id="page-members" class="p-6 hidden">
        <h2 class="text-lg font-semibold text-white mb-6">團隊成員</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-board-800 rounded-xl p-5 border border-board-700 text-center">
            <div class="w-14 h-14 mx-auto rounded-full bg-pm-500 flex items-center justify-center text-white font-bold text-lg mb-3">EC</div>
            <h4 class="font-semibold text-white">Eric Chen</h4>
            <p class="text-xs text-board-400 mt-0.5">全端工程師 · Admin</p>
            <div class="flex justify-center gap-2 mt-3">
              <span class="px-2 py-0.5 bg-board-700 text-board-300 text-[10px] rounded-full">3 進行中</span>
              <span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full">2 完成</span>
            </div>
          </div>
          <div class="bg-board-800 rounded-xl p-5 border border-board-700 text-center">
            <div class="w-14 h-14 mx-auto rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg mb-3">JL</div>
            <h4 class="font-semibold text-white">Jimmy Lin</h4>
            <p class="text-xs text-board-400 mt-0.5">後端工程師</p>
            <div class="flex justify-center gap-2 mt-3">
              <span class="px-2 py-0.5 bg-board-700 text-board-300 text-[10px] rounded-full">2 進行中</span>
              <span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full">1 完成</span>
            </div>
          </div>
          <div class="bg-board-800 rounded-xl p-5 border border-board-700 text-center">
            <div class="w-14 h-14 mx-auto rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg mb-3">AW</div>
            <h4 class="font-semibold text-white">Amy Wang</h4>
            <p class="text-xs text-board-400 mt-0.5">UI/UX 設計師</p>
            <div class="flex justify-center gap-2 mt-3">
              <span class="px-2 py-0.5 bg-board-700 text-board-300 text-[10px] rounded-full">2 進行中</span>
              <span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full">1 完成</span>
            </div>
          </div>
          <div class="bg-board-800 rounded-xl p-5 border border-board-700 text-center">
            <div class="w-14 h-14 mx-auto rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg mb-3">SL</div>
            <h4 class="font-semibold text-white">Sandy Liu</h4>
            <p class="text-xs text-board-400 mt-0.5">QA 工程師</p>
            <div class="flex justify-center gap-2 mt-3">
              <span class="px-2 py-0.5 bg-board-700 text-board-300 text-[10px] rounded-full">2 進行中</span>
              <span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full">1 完成</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Page -->
      <div id="page-settings" class="p-6 hidden">
        <h2 class="text-lg font-semibold text-white mb-6">專案設定</h2>
        <div class="max-w-xl space-y-5">
          <div class="bg-board-800 rounded-xl p-5 border border-board-700">
            <h3 class="font-semibold text-white mb-3">一般設定</h3>
            <div class="space-y-3">
              <div><label class="text-xs text-board-400 mb-1 block">專案名稱</label><input type="text" value="Tellcraft 官網重構" class="w-full bg-board-700 border border-board-600 rounded-lg px-3 py-2 text-sm text-board-200 focus:border-pm-500 outline-none"></div>
              <div><label class="text-xs text-board-400 mb-1 block">說明</label><textarea rows="2" class="w-full bg-board-700 border border-board-600 rounded-lg px-3 py-2 text-sm text-board-200 focus:border-pm-500 outline-none resize-none">重構 Tellcraft 官方網站，改善效能與使用者體驗。</textarea></div>
            </div>
          </div>
          <div class="bg-board-800 rounded-xl p-5 border border-board-700">
            <h3 class="font-semibold text-white mb-3">通知設定</h3>
            <div class="space-y-3">
              <label class="flex items-center justify-between cursor-pointer"><span class="text-sm">任務指派通知</span><div class="w-10 h-5 bg-pm-500 rounded-full relative"><div class="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5"></div></div></label>
              <label class="flex items-center justify-between cursor-pointer"><span class="text-sm">截止日提醒</span><div class="w-10 h-5 bg-pm-500 rounded-full relative"><div class="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5"></div></div></label>
              <label class="flex items-center justify-between cursor-pointer"><span class="text-sm">每日摘要</span><div class="w-10 h-5 bg-board-600 rounded-full relative"><div class="w-4 h-4 bg-board-400 rounded-full absolute top-0.5 left-0.5"></div></div></label>
            </div>
          </div>
          <button onclick="showToast('設定已儲存 ✓')" class="bg-pm-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-pm-600 transition-colors">儲存變更</button>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-pm-500 text-white px-5 py-2.5 rounded-lg shadow-2xl text-sm font-medium translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"></div>

<script>
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),2500);}
function switchPage(page){
  document.querySelectorAll('[id^="page-"]').forEach(p=>p.classList.add('hidden'));
  document.getElementById('page-'+page).classList.remove('hidden');
  document.querySelectorAll('.sidebar-link').forEach(l=>l.classList.remove('active'));
  event.target.closest('.sidebar-link').classList.add('active');
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
