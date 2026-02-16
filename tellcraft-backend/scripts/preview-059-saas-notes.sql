INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'dde421fe-44d5-4392-842f-4b82b203e925',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>雲筆記 NoteFlow</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{primary:'#0ea5e9',primaryLight:'#38bdf8',primaryDark:'#0284c7',surface:'#f0f9ff',sidebar:'#0f172a',sideHover:'#1e293b',accent:'#f59e0b',success:'#10b981',danger:'#ef4444',muted:'#64748b'},fontFamily:{sans:['Inter','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#f8fafc;overflow:hidden;height:100vh}
.sidebar-item{transition:all .2s}
.sidebar-item:hover,.sidebar-item.active{background:rgba(255,255,255,.08);border-radius:6px}
.folder-item{transition:all .15s}
.folder-item:hover{background:#f1f5f9}
.note-item{transition:all .15s;border-left:3px solid transparent}
.note-item:hover,.note-item.active{background:#f0f9ff;border-left-color:#0ea5e9}
.editor-content{line-height:1.8}
.editor-content h1{font-size:28px;font-weight:700;margin-bottom:12px;color:#0f172a}
.editor-content h2{font-size:20px;font-weight:600;margin-top:24px;margin-bottom:8px;color:#1e293b}
.editor-content p{color:#475569;margin-bottom:8px}
.editor-content ul{padding-left:20px;margin-bottom:12px}
.editor-content li{color:#475569;margin-bottom:4px}
.editor-content code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:13px;color:#0ea5e9}
.editor-content blockquote{border-left:3px solid #0ea5e9;padding-left:16px;color:#64748b;font-style:italic;margin:12px 0}
.toolbar-btn{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:6px;cursor:pointer;transition:all .15s;color:#64748b}
.toolbar-btn:hover{background:#f1f5f9;color:#0f172a}
.toolbar-btn.active{background:#e0f2fe;color:#0ea5e9}
.tag-chip{font-size:11px;padding:2px 8px;border-radius:99px;cursor:pointer;transition:all .15s}
.fade-in{animation:fadeIn .2s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
</style>
</head>
<body>
<div class="flex h-screen">
  <!-- Sidebar -->
  <aside class="w-56 bg-sidebar text-white flex flex-col flex-shrink-0">
    <div class="p-4 flex items-center gap-2.5 border-b border-white/10">
      <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <span class="font-bold text-base">NoteFlow</span>
    </div>

    <div class="p-3">
      <button class="w-full bg-primary/20 text-primary border border-primary/30 text-sm font-medium px-3 py-2 rounded-lg hover:bg-primary/30 transition flex items-center justify-center gap-1.5">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新增筆記
      </button>
    </div>

    <div class="px-3 mb-2">
      <div class="relative">
        <input type="text" placeholder="搜尋筆記..." class="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary/50">
        <svg class="absolute left-2.5 top-2 text-white/30" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
    </div>

    <nav class="px-3 space-y-0.5 mb-3">
      <div class="sidebar-item active flex items-center gap-2.5 px-2.5 py-2 cursor-pointer text-sm">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
        <span>全部筆記</span>
        <span class="ml-auto text-xs text-white/30">24</span>
      </div>
      <div class="sidebar-item flex items-center gap-2.5 px-2.5 py-2 cursor-pointer text-sm">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span>收藏</span>
        <span class="ml-auto text-xs text-white/30">6</span>
      </div>
      <div class="sidebar-item flex items-center gap-2.5 px-2.5 py-2 cursor-pointer text-sm">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        <span>垃圾桶</span>
      </div>
    </nav>

    <div class="px-3 flex-1 overflow-auto">
      <div class="text-xs text-white/30 uppercase tracking-wider px-2.5 mb-2">資料夾</div>
      <div class="space-y-0.5">
        <div class="sidebar-item flex items-center gap-2 px-2.5 py-1.5 cursor-pointer text-sm">
          <svg width="14" height="14" fill="none" stroke="#0ea5e9" stroke-width="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          <span class="text-white/70">工作筆記</span>
          <span class="ml-auto text-xs text-white/20">8</span>
        </div>
        <div class="sidebar-item flex items-center gap-2 px-2.5 py-1.5 cursor-pointer text-sm">
          <svg width="14" height="14" fill="none" stroke="#10b981" stroke-width="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          <span class="text-white/70">學習紀錄</span>
          <span class="ml-auto text-xs text-white/20">6</span>
        </div>
        <div class="sidebar-item flex items-center gap-2 px-2.5 py-1.5 cursor-pointer text-sm">
          <svg width="14" height="14" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          <span class="text-white/70">靈感收集</span>
          <span class="ml-auto text-xs text-white/20">5</span>
        </div>
        <div class="sidebar-item flex items-center gap-2 px-2.5 py-1.5 cursor-pointer text-sm">
          <svg width="14" height="14" fill="none" stroke="#f43f5e" stroke-width="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          <span class="text-white/70">個人日記</span>
          <span class="ml-auto text-xs text-white/20">5</span>
        </div>
      </div>

      <div class="text-xs text-white/30 uppercase tracking-wider px-2.5 mt-4 mb-2">標籤</div>
      <div class="flex flex-wrap gap-1.5 px-2">
        <span class="tag-chip bg-sky-500/20 text-sky-300">#設計</span>
        <span class="tag-chip bg-emerald-500/20 text-emerald-300">#技術</span>
        <span class="tag-chip bg-amber-500/20 text-amber-300">#想法</span>
        <span class="tag-chip bg-rose-500/20 text-rose-300">#重要</span>
        <span class="tag-chip bg-violet-500/20 text-violet-300">#會議</span>
      </div>
    </div>
  </aside>

  <!-- Note List Panel -->
  <div class="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
    <div class="p-3 border-b border-gray-100">
      <div class="flex items-center justify-between">
        <span class="font-semibold text-gray-900 text-sm">全部筆記</span>
        <div class="flex gap-1">
          <div class="toolbar-btn"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg></div>
        </div>
      </div>
    </div>
    <div class="flex-1 overflow-auto">
      <div class="note-item active p-3 cursor-pointer border-b border-gray-50">
        <div class="font-medium text-sm text-gray-900 mb-1 truncate">產品設計原則筆記</div>
        <div class="text-xs text-gray-400 mb-1.5 line-clamp-2">好的設計不是添加更多功能，而是在繁雜中找到簡潔...</div>
        <div class="flex items-center gap-1.5">
          <span class="tag-chip bg-sky-50 text-sky-600">#設計</span>
          <span class="text-xs text-gray-300">今天 14:30</span>
        </div>
      </div>
      <div class="note-item p-3 cursor-pointer border-b border-gray-50">
        <div class="font-medium text-sm text-gray-900 mb-1 truncate">React 19 新特性整理</div>
        <div class="text-xs text-gray-400 mb-1.5 line-clamp-2">Actions, useOptimistic, use() hook...</div>
        <div class="flex items-center gap-1.5">
          <span class="tag-chip bg-emerald-50 text-emerald-600">#技術</span>
          <span class="text-xs text-gray-300">今天 10:15</span>
        </div>
      </div>
      <div class="note-item p-3 cursor-pointer border-b border-gray-50">
        <div class="font-medium text-sm text-gray-900 mb-1 truncate">週會記錄 02/14</div>
        <div class="text-xs text-gray-400 mb-1.5 line-clamp-2">Q1 目標回顧，行銷策略調整...</div>
        <div class="flex items-center gap-1.5">
          <span class="tag-chip bg-violet-50 text-violet-600">#會議</span>
          <span class="text-xs text-gray-300">2/14</span>
        </div>
      </div>
      <div class="note-item p-3 cursor-pointer border-b border-gray-50">
        <div class="font-medium text-sm text-gray-900 mb-1 truncate">SaaS 定價策略研究</div>
        <div class="text-xs text-gray-400 mb-1.5 line-clamp-2">三種常見定價模型：免費增值、分級訂閱...</div>
        <div class="flex items-center gap-1.5">
          <span class="tag-chip bg-rose-50 text-rose-600">#重要</span>
          <span class="text-xs text-gray-300">2/13</span>
        </div>
      </div>
      <div class="note-item p-3 cursor-pointer border-b border-gray-50">
        <div class="font-medium text-sm text-gray-900 mb-1 truncate">App 介面靈感</div>
        <div class="text-xs text-gray-400 mb-1.5 line-clamp-2">漸層色卡片、圓角大按鈕、微互動...</div>
        <div class="flex items-center gap-1.5">
          <span class="tag-chip bg-amber-50 text-amber-600">#想法</span>
          <span class="text-xs text-gray-300">2/12</span>
        </div>
      </div>
      <div class="note-item p-3 cursor-pointer border-b border-gray-50">
        <div class="font-medium text-sm text-gray-900 mb-1 truncate">TypeScript 泛型深入</div>
        <div class="text-xs text-gray-400 mb-1.5 line-clamp-2">Conditional types, mapped types, infer...</div>
        <div class="flex items-center gap-1.5">
          <span class="tag-chip bg-emerald-50 text-emerald-600">#技術</span>
          <span class="text-xs text-gray-300">2/10</span>
        </div>
      </div>
      <div class="note-item p-3 cursor-pointer border-b border-gray-50">
        <div class="font-medium text-sm text-gray-900 mb-1 truncate">個人年度目標 2026</div>
        <div class="text-xs text-gray-400 mb-1.5 line-clamp-2">技能提升、健康管理、閱讀 24 本書...</div>
        <div class="flex items-center gap-1.5">
          <span class="tag-chip bg-rose-50 text-rose-600">#重要</span>
          <span class="text-xs text-gray-300">1/1</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Editor -->
  <main class="flex-1 flex flex-col overflow-hidden bg-white">
    <!-- Editor Toolbar -->
    <div class="h-12 border-b border-gray-100 flex items-center px-4 gap-1 flex-shrink-0">
      <div class="toolbar-btn active" title="粗體"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg></div>
      <div class="toolbar-btn" title="斜體"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></div>
      <div class="toolbar-btn" title="底線"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg></div>
      <div class="w-px h-5 bg-gray-200 mx-1"></div>
      <div class="toolbar-btn" title="標題"><span class="text-xs font-bold">H1</span></div>
      <div class="toolbar-btn" title="標題"><span class="text-xs font-bold">H2</span></div>
      <div class="w-px h-5 bg-gray-200 mx-1"></div>
      <div class="toolbar-btn" title="列表"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></div>
      <div class="toolbar-btn" title="引用"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg></div>
      <div class="toolbar-btn" title="程式碼"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div>
      <div class="ml-auto flex items-center gap-2">
        <span class="text-xs text-gray-400">最後編輯：今天 14:30</span>
        <svg class="text-amber-400 cursor-pointer" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <div class="toolbar-btn"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></div>
      </div>
    </div>

    <!-- Editor Body -->
    <div class="flex-1 overflow-auto p-8 max-w-3xl">
      <div class="flex items-center gap-2 mb-4">
        <span class="tag-chip bg-sky-50 text-sky-600 cursor-pointer">#設計</span>
        <span class="tag-chip bg-rose-50 text-rose-600 cursor-pointer">#重要</span>
        <span class="tag-chip bg-gray-100 text-gray-400 cursor-pointer">+ 標籤</span>
      </div>
      <div class="editor-content" contenteditable="true">
        <h1>產品設計原則筆記</h1>
        <p>好的設計不是添加更多功能，而是在繁雜中找到簡潔。以下是我整理的核心設計原則：</p>

        <h2>1. 以使用者為中心</h2>
        <p>所有設計決策都應該從使用者的需求出發。透過<code>使用者研究</code>和<code>原型測試</code>來驗證假設。</p>
        <ul>
          <li>建立用戶畫像（Persona）</li>
          <li>繪製使用者旅程地圖</li>
          <li>進行 A/B 測試驗證</li>
        </ul>

        <h2>2. 簡潔即力量</h2>
        <blockquote>Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away. — Antoine de Saint-Exupéry</blockquote>
        <p>每一個功能都要問：<strong>這真的必要嗎？</strong> 減少認知負擔是提升體驗的最佳方式。</p>

        <h2>3. 一致性</h2>
        <p>保持視覺語言和互動模式的一致性。建立<code>Design System</code>是規模化的關鍵：</p>
        <ul>
          <li>色彩系統：主色、語義色、中性色</li>
          <li>字體層級：H1-H6、Body、Caption</li>
          <li>間距系統：4px 基準倍數</li>
          <li>元件庫：按鈕、輸入框、卡片、Modal</li>
        </ul>

        <h2>4. 回饋與引導</h2>
        <p>使用者的每一個操作都應該得到即時的回饋。載入狀態、成功提示、錯誤訊息缺一不可。</p>
      </div>
    </div>

    <!-- Bottom status bar -->
    <div class="h-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between px-4 text-xs text-gray-400 flex-shrink-0">
      <div class="flex items-center gap-4">
        <span>字數：462</span>
        <span>閱讀時間：約 2 分鐘</span>
      </div>
      <div class="flex items-center gap-3">
        <span>資料夾：工作筆記</span>
        <span class="flex items-center gap-1"><svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/></svg>已自動儲存</span>
      </div>
    </div>
  </main>
</div>
</body>
</html>$HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
