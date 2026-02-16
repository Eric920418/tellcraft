INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '10e0a380-e2f8-423a-b69c-539be60572ae',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>專注待辦 FocusTodo</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{primary:'#6366f1',primaryLight:'#818cf8',primaryDark:'#4f46e5',surface:'#f8fafc',sidebar:'#1e1b4b',sideHover:'#312e81',accent:'#f59e0b',success:'#10b981',danger:'#ef4444',muted:'#94a3b8'},fontFamily:{sans:['Inter','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#f8fafc;overflow:hidden;height:100vh}
.sidebar-item{transition:all .2s}
.sidebar-item:hover,.sidebar-item.active{background:rgba(255,255,255,.12);border-radius:8px}
.task-item{transition:all .2s}
.task-item:hover{box-shadow:0 2px 8px rgba(0,0,0,.06);transform:translateY(-1px)}
.checkbox{width:20px;height:20px;border:2px solid #d1d5db;border-radius:6px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.checkbox.checked{background:#6366f1;border-color:#6366f1}
.checkbox.checked svg{display:block}
.checkbox svg{display:none}
.priority-high{color:#ef4444}
.priority-medium{color:#f59e0b}
.priority-low{color:#6366f1}
.tag{font-size:11px;padding:2px 8px;border-radius:99px;font-weight:500}
.progress-ring{transform:rotate(-90deg)}
.fade-in{animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.modal-overlay{background:rgba(0,0,0,.4);backdrop-filter:blur(4px)}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
</style>
</head>
<body>
<div class="flex h-screen">
  <!-- Sidebar -->
  <aside class="w-60 bg-sidebar text-white flex flex-col flex-shrink-0">
    <div class="p-5 flex items-center gap-3 border-b border-white/10">
      <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
      </div>
      <span class="font-bold text-lg tracking-tight">FocusTodo</span>
    </div>

    <nav class="flex-1 p-3 space-y-1">
      <div onclick="switchPage('inbox')" class="sidebar-item active flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="inbox">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>收件匣</span>
        <span class="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">12</span>
      </div>
      <div onclick="switchPage('today')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="today">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>今日任務</span>
        <span class="ml-auto text-xs bg-accent/80 text-white px-2 py-0.5 rounded-full">5</span>
      </div>
      <div onclick="switchPage('projects')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="projects">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        <span>專案</span>
      </div>
      <div onclick="switchPage('stats')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="stats">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        <span>統計</span>
      </div>
    </nav>

    <!-- Projects list -->
    <div class="px-3 pb-3">
      <div class="text-xs text-white/40 uppercase tracking-wider px-3 mb-2">專案</div>
      <div class="space-y-1">
        <div class="flex items-center gap-2 px-3 py-2 text-sm text-white/70 cursor-pointer hover:text-white/90 rounded-lg hover:bg-white/5">
          <div class="w-2.5 h-2.5 rounded-full bg-primary"></div>產品設計
        </div>
        <div class="flex items-center gap-2 px-3 py-2 text-sm text-white/70 cursor-pointer hover:text-white/90 rounded-lg hover:bg-white/5">
          <div class="w-2.5 h-2.5 rounded-full bg-success"></div>行銷企劃
        </div>
        <div class="flex items-center gap-2 px-3 py-2 text-sm text-white/70 cursor-pointer hover:text-white/90 rounded-lg hover:bg-white/5">
          <div class="w-2.5 h-2.5 rounded-full bg-accent"></div>個人學習
        </div>
        <div class="flex items-center gap-2 px-3 py-2 text-sm text-white/70 cursor-pointer hover:text-white/90 rounded-lg hover:bg-white/5">
          <div class="w-2.5 h-2.5 rounded-full bg-danger"></div>客戶支援
        </div>
      </div>
    </div>

    <div class="p-3 border-t border-white/10">
      <div class="flex items-center gap-3 px-3 py-2">
        <div class="w-8 h-8 rounded-full bg-primaryLight flex items-center justify-center text-xs font-bold">W</div>
        <div class="text-sm">
          <div class="font-medium">王小明</div>
          <div class="text-xs text-white/50">Pro 方案</div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col overflow-hidden">
    <!-- Top Bar -->
    <header class="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <div class="flex items-center gap-3">
        <h1 class="font-semibold text-gray-900" id="pageTitle">收件匣</h1>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative">
          <input type="text" placeholder="搜尋任務..." class="text-sm bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <svg class="absolute left-3 top-2.5 text-gray-400" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <button onclick="openAddModal()" class="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primaryDark transition flex items-center gap-1.5">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新增任務
        </button>
      </div>
    </header>

    <!-- Page: Inbox -->
    <div id="page-inbox" class="flex-1 overflow-auto p-6 fade-in">
      <!-- Filter tabs -->
      <div class="flex items-center gap-2 mb-5">
        <button class="text-sm font-medium px-3 py-1.5 rounded-lg bg-primary text-white">全部 (12)</button>
        <button class="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">高優先 (3)</button>
        <button class="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">已標記 (4)</button>
        <div class="ml-auto flex items-center gap-2 text-sm text-gray-500">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>
          排序：優先級
        </div>
      </div>

      <!-- Task List -->
      <div class="space-y-2">
        <!-- High Priority -->
        <div class="task-item bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3 cursor-pointer" onclick="toggleCheck(this)">
          <div class="checkbox mt-0.5"><svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-gray-900 text-sm">完成首頁 Hero Section 設計稿</span>
              <svg class="priority-high flex-shrink-0" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4l7.5 14h-15L12 6z"/><path d="M11 10h2v5h-2zm0 6h2v2h-2z"/></svg>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="tag bg-indigo-50 text-indigo-600">產品設計</span>
              <span class="tag bg-red-50 text-red-600">緊急</span>
              <span class="text-xs text-gray-400 ml-1">截止：今天</span>
            </div>
          </div>
          <svg class="text-gray-300 flex-shrink-0 cursor-pointer hover:text-amber-400 transition" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>

        <div class="task-item bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3 cursor-pointer" onclick="toggleCheck(this)">
          <div class="checkbox mt-0.5"><svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-gray-900 text-sm">撰寫 Q1 行銷報告</span>
              <svg class="priority-high flex-shrink-0" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4l7.5 14h-15L12 6z"/><path d="M11 10h2v5h-2zm0 6h2v2h-2z"/></svg>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="tag bg-emerald-50 text-emerald-600">行銷企劃</span>
              <span class="text-xs text-gray-400 ml-1">截止：明天</span>
            </div>
          </div>
          <svg class="text-amber-400 flex-shrink-0" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>

        <div class="task-item bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3 cursor-pointer" onclick="toggleCheck(this)">
          <div class="checkbox mt-0.5"><svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-gray-900 text-sm">回覆客戶 A 的技術需求文件</span>
              <svg class="priority-high flex-shrink-0" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4l7.5 14h-15L12 6z"/><path d="M11 10h2v5h-2zm0 6h2v2h-2z"/></svg>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="tag bg-red-50 text-red-600">客戶支援</span>
              <span class="tag bg-red-50 text-red-600">緊急</span>
              <span class="text-xs text-gray-400 ml-1">截止：今天</span>
            </div>
          </div>
          <svg class="text-gray-300 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>

        <!-- Medium Priority -->
        <div class="task-item bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3 cursor-pointer" onclick="toggleCheck(this)">
          <div class="checkbox mt-0.5"><svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-gray-900 text-sm">整理設計系統元件庫</span>
              <svg class="priority-medium flex-shrink-0" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="tag bg-indigo-50 text-indigo-600">產品設計</span>
              <span class="text-xs text-gray-400 ml-1">截止：2/20</span>
            </div>
          </div>
          <svg class="text-amber-400 flex-shrink-0" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>

        <div class="task-item bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3 cursor-pointer" onclick="toggleCheck(this)">
          <div class="checkbox mt-0.5"><svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-gray-900 text-sm">準備週五團隊簡報內容</span>
              <svg class="priority-medium flex-shrink-0" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="tag bg-emerald-50 text-emerald-600">行銷企劃</span>
              <span class="text-xs text-gray-400 ml-1">截止：2/21</span>
            </div>
          </div>
          <svg class="text-gray-300 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>

        <div class="task-item bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3 cursor-pointer" onclick="toggleCheck(this)">
          <div class="checkbox mt-0.5"><svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-gray-900 text-sm">閱讀《原子習慣》第 5-8 章</span>
              <svg class="priority-low flex-shrink-0" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="tag bg-amber-50 text-amber-600">個人學習</span>
              <span class="text-xs text-gray-400 ml-1">截止：2/25</span>
            </div>
          </div>
          <svg class="text-amber-400 flex-shrink-0" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>

        <!-- Completed -->
        <div class="task-item bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3 opacity-50 cursor-pointer" onclick="toggleCheck(this)">
          <div class="checkbox checked mt-0.5"><svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-gray-500 text-sm line-through">更新用戶訪談紀錄</span>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="tag bg-indigo-50 text-indigo-400">產品設計</span>
              <span class="text-xs text-gray-300">已完成</span>
            </div>
          </div>
        </div>

        <div class="task-item bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3 opacity-50 cursor-pointer" onclick="toggleCheck(this)">
          <div class="checkbox checked mt-0.5"><svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-gray-500 text-sm line-through">預約下週會議室</span>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="tag bg-emerald-50 text-emerald-400">行銷企劃</span>
              <span class="text-xs text-gray-300">已完成</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Page: Today -->
    <div id="page-today" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="flex items-center gap-4 mb-6">
        <div class="text-center">
          <div class="text-3xl font-bold text-gray-900">16</div>
          <div class="text-xs text-gray-500">二月 週日</div>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm font-medium text-gray-700">今日進度</span>
            <span class="text-sm text-primary font-bold">3/5</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2">
            <div class="bg-primary rounded-full h-2 transition-all" style="width:60%"></div>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">上午</h3>
        <div class="space-y-2">
          <div class="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
            <div class="checkbox checked"><svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="flex-1">
              <span class="text-sm text-gray-400 line-through">晨會同步進度</span>
              <div class="text-xs text-gray-300 mt-0.5">09:00 - 09:30</div>
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
            <div class="checkbox checked"><svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="flex-1">
              <span class="text-sm text-gray-400 line-through">回覆客戶 A 的技術需求</span>
              <div class="text-xs text-gray-300 mt-0.5">10:00 - 11:00</div>
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
            <div class="checkbox checked"><svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="flex-1">
              <span class="text-sm text-gray-400 line-through">更新設計系統文件</span>
              <div class="text-xs text-gray-300 mt-0.5">11:00 - 12:00</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">下午</h3>
        <div class="space-y-2">
          <div class="bg-white rounded-xl p-4 border border-primary/30 flex items-center gap-3">
            <div class="checkbox"><svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="flex-1">
              <span class="text-sm font-medium text-gray-900">完成首頁 Hero Section 設計稿</span>
              <div class="flex items-center gap-2 mt-1">
                <span class="tag bg-indigo-50 text-indigo-600">產品設計</span>
                <span class="text-xs text-red-500">截止今天</span>
              </div>
            </div>
            <svg class="priority-high" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>
          </div>
          <div class="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
            <div class="checkbox"><svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="flex-1">
              <span class="text-sm font-medium text-gray-900">撰寫 Q1 行銷報告初稿</span>
              <div class="flex items-center gap-2 mt-1">
                <span class="tag bg-emerald-50 text-emerald-600">行銷企劃</span>
                <span class="text-xs text-gray-400">14:00 - 16:00</span>
              </div>
            </div>
            <svg class="priority-high" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Page: Projects -->
    <div id="page-projects" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <svg width="20" height="20" fill="none" stroke="#6366f1" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">產品設計</h3>
              <p class="text-xs text-gray-400">8 個任務</p>
            </div>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-500">完成進度</span>
            <span class="text-xs font-bold text-primary">62%</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-1.5">
            <div class="bg-primary rounded-full h-1.5" style="width:62%"></div>
          </div>
          <div class="flex gap-1 mt-3">
            <span class="tag bg-gray-100 text-gray-500">3 待辦</span>
            <span class="tag bg-indigo-50 text-indigo-600">2 進行中</span>
            <span class="tag bg-emerald-50 text-emerald-600">5 已完成</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg width="20" height="20" fill="none" stroke="#10b981" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">行銷企劃</h3>
              <p class="text-xs text-gray-400">6 個任務</p>
            </div>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-500">完成進度</span>
            <span class="text-xs font-bold text-success">83%</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-1.5">
            <div class="bg-success rounded-full h-1.5" style="width:83%"></div>
          </div>
          <div class="flex gap-1 mt-3">
            <span class="tag bg-gray-100 text-gray-500">1 待辦</span>
            <span class="tag bg-emerald-50 text-emerald-600">5 已完成</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg width="20" height="20" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">個人學習</h3>
              <p class="text-xs text-gray-400">4 個任務</p>
            </div>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-500">完成進度</span>
            <span class="text-xs font-bold text-accent">50%</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-1.5">
            <div class="bg-accent rounded-full h-1.5" style="width:50%"></div>
          </div>
          <div class="flex gap-1 mt-3">
            <span class="tag bg-gray-100 text-gray-500">2 待辦</span>
            <span class="tag bg-emerald-50 text-emerald-600">2 已完成</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <svg width="20" height="20" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">客戶支援</h3>
              <p class="text-xs text-gray-400">5 個任務</p>
            </div>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-500">完成進度</span>
            <span class="text-xs font-bold text-danger">40%</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-1.5">
            <div class="bg-danger rounded-full h-1.5" style="width:40%"></div>
          </div>
          <div class="flex gap-1 mt-3">
            <span class="tag bg-gray-100 text-gray-500">2 待辦</span>
            <span class="tag bg-indigo-50 text-indigo-600">1 進行中</span>
            <span class="tag bg-emerald-50 text-emerald-600">2 已完成</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Page: Stats -->
    <div id="page-stats" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <div class="text-3xl font-bold text-primary">156</div>
          <div class="text-xs text-gray-500 mt-1">本月完成</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <div class="text-3xl font-bold text-success">12</div>
          <div class="text-xs text-gray-500 mt-1">連續天數</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <div class="text-3xl font-bold text-accent">4.2</div>
          <div class="text-xs text-gray-500 mt-1">日均完成</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <div class="text-3xl font-bold text-danger">89%</div>
          <div class="text-xs text-gray-500 mt-1">準時率</div>
        </div>
      </div>

      <!-- Weekly Chart -->
      <div class="bg-white rounded-2xl p-5 border border-gray-100 mb-6">
        <h3 class="font-semibold text-gray-900 mb-4">本週完成趨勢</h3>
        <div class="flex items-end gap-3 h-40">
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full bg-primary/20 rounded-t-lg relative" style="height:60%"><div class="absolute inset-x-0 bottom-0 bg-primary rounded-t-lg" style="height:80%"></div></div>
            <span class="text-xs text-gray-400">一</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full bg-primary/20 rounded-t-lg relative" style="height:80%"><div class="absolute inset-x-0 bottom-0 bg-primary rounded-t-lg" style="height:70%"></div></div>
            <span class="text-xs text-gray-400">二</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full bg-primary/20 rounded-t-lg relative" style="height:45%"><div class="absolute inset-x-0 bottom-0 bg-primary rounded-t-lg" style="height:90%"></div></div>
            <span class="text-xs text-gray-400">三</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full bg-primary/20 rounded-t-lg relative" style="height:90%"><div class="absolute inset-x-0 bottom-0 bg-primary rounded-t-lg" style="height:85%"></div></div>
            <span class="text-xs text-gray-400">四</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full bg-primary/20 rounded-t-lg relative" style="height:70%"><div class="absolute inset-x-0 bottom-0 bg-primary rounded-t-lg" style="height:75%"></div></div>
            <span class="text-xs text-gray-400">五</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full bg-primary/20 rounded-t-lg relative" style="height:40%"><div class="absolute inset-x-0 bottom-0 bg-primary rounded-t-lg" style="height:60%"></div></div>
            <span class="text-xs text-gray-400">六</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full bg-primary/20 rounded-t-lg relative" style="height:30%"><div class="absolute inset-x-0 bottom-0 bg-primary rounded-t-lg" style="height:50%"></div></div>
            <span class="text-xs text-gray-400">日</span>
          </div>
        </div>
      </div>

      <!-- Category breakdown -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 class="font-semibold text-gray-900 mb-4">專案分佈</h3>
          <div class="flex justify-center mb-4">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="54" fill="none" stroke="#e2e8f0" stroke-width="16"/>
              <circle cx="70" cy="70" r="54" fill="none" stroke="#6366f1" stroke-width="16" stroke-dasharray="107 232" stroke-dashoffset="0" class="progress-ring"/>
              <circle cx="70" cy="70" r="54" fill="none" stroke="#10b981" stroke-width="16" stroke-dasharray="85 254" stroke-dashoffset="-107" class="progress-ring"/>
              <circle cx="70" cy="70" r="54" fill="none" stroke="#f59e0b" stroke-width="16" stroke-dasharray="68 271" stroke-dashoffset="-192" class="progress-ring"/>
              <circle cx="70" cy="70" r="54" fill="none" stroke="#ef4444" stroke-width="16" stroke-dasharray="79 260" stroke-dashoffset="-260" class="progress-ring"/>
            </svg>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-primary"></div>產品設計</div><span class="text-gray-500">32%</span></div>
            <div class="flex items-center justify-between text-sm"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-success"></div>行銷企劃</div><span class="text-gray-500">25%</span></div>
            <div class="flex items-center justify-between text-sm"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-accent"></div>個人學習</div><span class="text-gray-500">20%</span></div>
            <div class="flex items-center justify-between text-sm"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-danger"></div>客戶支援</div><span class="text-gray-500">23%</span></div>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 class="font-semibold text-gray-900 mb-4">效率指標</h3>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="text-gray-600">準時完成率</span><span class="font-bold text-primary">89%</span></div>
              <div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-primary rounded-full h-2" style="width:89%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="text-gray-600">高優先處理速度</span><span class="font-bold text-success">92%</span></div>
              <div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-success rounded-full h-2" style="width:92%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="text-gray-600">專案推進率</span><span class="font-bold text-accent">76%</span></div>
              <div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-accent rounded-full h-2" style="width:76%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="text-gray-600">每日目標達成</span><span class="font-bold text-danger">68%</span></div>
              <div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-danger rounded-full h-2" style="width:68%"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Add Task Modal -->
<div id="addModal" class="fixed inset-0 z-50 hidden items-center justify-center modal-overlay">
  <div class="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-bold text-lg text-gray-900">新增任務</h2>
      <button onclick="closeAddModal()" class="text-gray-400 hover:text-gray-600 transition">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="space-y-4">
      <input type="text" placeholder="任務名稱" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
      <textarea placeholder="任務描述（選填）" rows="3" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"></textarea>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-gray-500 mb-1 block">優先級</label>
          <select class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>高</option><option selected>中</option><option>低</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 mb-1 block">專案</label>
          <select class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>產品設計</option><option>行銷企劃</option><option>個人學習</option><option>客戶支援</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-gray-500 mb-1 block">截止日期</label>
          <input type="date" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
        </div>
        <div>
          <label class="text-xs text-gray-500 mb-1 block">標籤</label>
          <input type="text" placeholder="輸入標籤" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
        </div>
      </div>
      <button onclick="closeAddModal()" class="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primaryDark transition">建立任務</button>
    </div>
  </div>
</div>

<script>
function switchPage(page){
  document.querySelectorAll('[id^="page-"]').forEach(p=>p.classList.add('hidden'));
  document.getElementById('page-'+page).classList.remove('hidden');
  document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
  document.querySelector('[data-page="'+page+'"]').classList.add('active');
  const titles={inbox:'收件匣',today:'今日任務',projects:'專案',stats:'統計'};
  document.getElementById('pageTitle').textContent=titles[page]||page;
}
function toggleCheck(el){
  const cb=el.querySelector('.checkbox');
  cb.classList.toggle('checked');
  el.classList.toggle('opacity-50');
  const text=el.querySelector('.font-medium');
  if(text)text.classList.toggle('line-through');
  if(text)text.classList.toggle('text-gray-500');
  if(text)text.classList.toggle('text-gray-900');
}
function openAddModal(){document.getElementById('addModal').classList.remove('hidden');document.getElementById('addModal').classList.add('flex')}
function closeAddModal(){document.getElementById('addModal').classList.add('hidden');document.getElementById('addModal').classList.remove('flex')}
</script>
</body>
</html>$HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
