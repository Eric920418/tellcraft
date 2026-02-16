INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '7b0195c0-0876-4ce0-8ca1-0807ffb2a0f0',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>預約管家 BookEasy</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{primary:'#7c3aed',primaryLight:'#a78bfa',primaryDark:'#6d28d9',surface:'#f5f3ff',sidebar:'#1e1033',accent:'#f59e0b',success:'#10b981',danger:'#ef4444',sky:'#0ea5e9',rose:'#f43f5e'},fontFamily:{sans:['Inter','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#f8fafc;overflow:hidden;height:100vh}
.sidebar-item{transition:all .2s}
.sidebar-item:hover,.sidebar-item.active{background:rgba(255,255,255,.1);border-radius:8px}
.time-slot{transition:all .15s;cursor:pointer}
.time-slot:hover{border-color:#7c3aed;background:#f5f3ff}
.time-slot.booked{background:#fee2e2;border-color:#fca5a5;opacity:.6;cursor:not-allowed}
.time-slot.selected{background:#7c3aed;color:white;border-color:#7c3aed}
.booking-card{transition:all .2s}
.booking-card:hover{box-shadow:0 2px 8px rgba(0,0,0,.06)}
.status-confirmed{background:#dcfce7;color:#16a34a}
.status-pending{background:#fef3c7;color:#d97706}
.status-cancelled{background:#fee2e2;color:#dc2626}
.fade-in{animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.modal-overlay{background:rgba(0,0,0,.4);backdrop-filter:blur(4px)}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#c4b5fd;border-radius:99px}
</style>
</head>
<body>
<div class="flex h-screen">
  <aside class="w-56 bg-sidebar text-white flex flex-col flex-shrink-0">
    <div class="p-4 flex items-center gap-2.5 border-b border-white/10">
      <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <span class="font-bold text-base">BookEasy</span>
    </div>
    <nav class="flex-1 p-3 space-y-1">
      <div onclick="switchPage('dashboard')" class="sidebar-item active flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="dashboard">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>儀表板</span>
      </div>
      <div onclick="switchPage('calendar')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="calendar">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
        <span>預約日曆</span>
      </div>
      <div onclick="switchPage('clients')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="clients">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <span>客戶名單</span>
        <span class="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">86</span>
      </div>
      <div onclick="switchPage('services')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="services">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        <span>服務項目</span>
      </div>
    </nav>
    <div class="p-3 border-t border-white/10">
      <div class="flex items-center gap-3 px-3 py-2">
        <div class="w-8 h-8 rounded-full bg-primaryLight flex items-center justify-center text-xs font-bold">美</div>
        <div class="text-sm"><div class="font-medium">美麗髮廊</div><div class="text-xs text-white/50">專業版</div></div>
      </div>
    </div>
  </aside>

  <main class="flex-1 flex flex-col overflow-hidden">
    <header class="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <h1 class="font-semibold text-gray-900" id="pageTitle">儀表板</h1>
      <button onclick="openBookingModal()" class="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primaryDark transition flex items-center gap-1.5">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新增預約
      </button>
    </header>

    <!-- Dashboard -->
    <div id="page-dashboard" class="flex-1 overflow-auto p-6 fade-in">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">今日預約</div>
          <div class="text-2xl font-bold text-primary">8</div>
          <div class="text-xs text-success mt-1">3 個已完成</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">本週預約</div>
          <div class="text-2xl font-bold text-gray-900">32</div>
          <div class="text-xs text-primary mt-1">↑ 8% vs 上週</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">本月營收</div>
          <div class="text-2xl font-bold text-success">$186K</div>
          <div class="text-xs text-success mt-1">↑ 12%</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">取消率</div>
          <div class="text-2xl font-bold text-accent">4.2%</div>
          <div class="text-xs text-success mt-1">↓ 低於平均</div>
        </div>
      </div>

      <!-- Today's Schedule -->
      <div class="bg-white rounded-2xl border border-gray-100 mb-6">
        <div class="p-4 border-b border-gray-100"><h3 class="font-semibold text-gray-900">今日預約排程</h3></div>
        <div class="divide-y divide-gray-50">
          <div class="booking-card flex items-center gap-4 px-4 py-3">
            <div class="text-center w-16"><div class="text-sm font-bold text-primary">09:00</div><div class="text-xs text-gray-400">1hr</div></div>
            <div class="w-1 h-10 rounded-full bg-success"></div>
            <div class="flex-1"><div class="font-medium text-sm text-gray-900">林小姐</div><div class="text-xs text-gray-400">剪髮 + 染髮</div></div>
            <div class="text-xs text-gray-400">設計師：Amy</div>
            <span class="status-confirmed text-xs px-2.5 py-1 rounded-full font-medium">已完成</span>
          </div>
          <div class="booking-card flex items-center gap-4 px-4 py-3">
            <div class="text-center w-16"><div class="text-sm font-bold text-primary">10:30</div><div class="text-xs text-gray-400">1.5hr</div></div>
            <div class="w-1 h-10 rounded-full bg-success"></div>
            <div class="flex-1"><div class="font-medium text-sm text-gray-900">王太太</div><div class="text-xs text-gray-400">燙髮 + 護髮</div></div>
            <div class="text-xs text-gray-400">設計師：Kevin</div>
            <span class="status-confirmed text-xs px-2.5 py-1 rounded-full font-medium">已完成</span>
          </div>
          <div class="booking-card flex items-center gap-4 px-4 py-3">
            <div class="text-center w-16"><div class="text-sm font-bold text-primary">11:00</div><div class="text-xs text-gray-400">45min</div></div>
            <div class="w-1 h-10 rounded-full bg-success"></div>
            <div class="flex-1"><div class="font-medium text-sm text-gray-900">陳先生</div><div class="text-xs text-gray-400">男士剪髮</div></div>
            <div class="text-xs text-gray-400">設計師：Amy</div>
            <span class="status-confirmed text-xs px-2.5 py-1 rounded-full font-medium">已完成</span>
          </div>
          <div class="booking-card flex items-center gap-4 px-4 py-3 bg-primary/5">
            <div class="text-center w-16"><div class="text-sm font-bold text-primary">14:00</div><div class="text-xs text-gray-400">2hr</div></div>
            <div class="w-1 h-10 rounded-full bg-primary animate-pulse"></div>
            <div class="flex-1"><div class="font-medium text-sm text-gray-900">張小姐</div><div class="text-xs text-gray-400">染髮 + 護髮 + 造型</div></div>
            <div class="text-xs text-gray-400">設計師：Mia</div>
            <span class="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">進行中</span>
          </div>
          <div class="booking-card flex items-center gap-4 px-4 py-3">
            <div class="text-center w-16"><div class="text-sm font-bold text-gray-400">15:30</div><div class="text-xs text-gray-300">1hr</div></div>
            <div class="w-1 h-10 rounded-full bg-gray-200"></div>
            <div class="flex-1"><div class="font-medium text-sm text-gray-600">吳小姐</div><div class="text-xs text-gray-400">剪髮 + 洗頭</div></div>
            <div class="text-xs text-gray-400">設計師：Amy</div>
            <span class="status-pending text-xs px-2.5 py-1 rounded-full font-medium">待確認</span>
          </div>
          <div class="booking-card flex items-center gap-4 px-4 py-3">
            <div class="text-center w-16"><div class="text-sm font-bold text-gray-400">16:00</div><div class="text-xs text-gray-300">1.5hr</div></div>
            <div class="w-1 h-10 rounded-full bg-gray-200"></div>
            <div class="flex-1"><div class="font-medium text-sm text-gray-600">李先生</div><div class="text-xs text-gray-400">染髮</div></div>
            <div class="text-xs text-gray-400">設計師：Kevin</div>
            <span class="status-confirmed text-xs px-2.5 py-1 rounded-full font-medium">已確認</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar -->
    <div id="page-calendar" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="bg-white rounded-2xl p-5 border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900">2026 年 2 月 第三週</h3>
          <div class="flex items-center gap-2 text-sm">
            <button class="text-gray-400 hover:text-gray-600">◀</button>
            <span class="font-medium">2/16 - 2/22</span>
            <button class="text-gray-400 hover:text-gray-600">▶</button>
          </div>
        </div>
        <div class="grid grid-cols-8 gap-px bg-gray-100 rounded-xl overflow-hidden">
          <div class="bg-gray-50 p-2"></div>
          <div class="bg-gray-50 p-2 text-center"><div class="text-xs text-gray-400">週一</div><div class="text-sm font-bold text-primary">16</div></div>
          <div class="bg-gray-50 p-2 text-center"><div class="text-xs text-gray-400">週二</div><div class="text-sm font-medium">17</div></div>
          <div class="bg-gray-50 p-2 text-center"><div class="text-xs text-gray-400">週三</div><div class="text-sm font-medium">18</div></div>
          <div class="bg-gray-50 p-2 text-center"><div class="text-xs text-gray-400">週四</div><div class="text-sm font-medium">19</div></div>
          <div class="bg-gray-50 p-2 text-center"><div class="text-xs text-gray-400">週五</div><div class="text-sm font-medium">20</div></div>
          <div class="bg-gray-50 p-2 text-center"><div class="text-xs text-gray-400">週六</div><div class="text-sm font-medium">21</div></div>
          <div class="bg-gray-50 p-2 text-center"><div class="text-xs text-gray-400">週日</div><div class="text-sm font-medium">22</div></div>

          <div class="bg-white p-1.5 text-xs text-gray-400 text-right">09:00</div>
          <div class="bg-white p-1"><div class="bg-purple-100 text-purple-700 text-xs p-1 rounded truncate">林小姐 剪染</div></div>
          <div class="bg-white p-1"><div class="bg-blue-100 text-blue-700 text-xs p-1 rounded truncate">黃太太 護髮</div></div>
          <div class="bg-white p-1"></div>
          <div class="bg-white p-1"><div class="bg-emerald-100 text-emerald-700 text-xs p-1 rounded truncate">趙先生 剪髮</div></div>
          <div class="bg-white p-1"><div class="bg-purple-100 text-purple-700 text-xs p-1 rounded truncate">周小姐 燙髮</div></div>
          <div class="bg-white p-1"><div class="bg-amber-100 text-amber-700 text-xs p-1 rounded truncate">預約滿</div></div>
          <div class="bg-gray-50 p-1 text-center text-xs text-gray-300">休息</div>

          <div class="bg-white p-1.5 text-xs text-gray-400 text-right">11:00</div>
          <div class="bg-white p-1"><div class="bg-emerald-100 text-emerald-700 text-xs p-1 rounded truncate">陳先生 剪髮</div></div>
          <div class="bg-white p-1"></div>
          <div class="bg-white p-1"><div class="bg-purple-100 text-purple-700 text-xs p-1 rounded truncate">劉小姐 染髮</div></div>
          <div class="bg-white p-1"><div class="bg-blue-100 text-blue-700 text-xs p-1 rounded truncate">蔡太太 護理</div></div>
          <div class="bg-white p-1"><div class="bg-emerald-100 text-emerald-700 text-xs p-1 rounded truncate">孫先生 剪髮</div></div>
          <div class="bg-white p-1"><div class="bg-purple-100 text-purple-700 text-xs p-1 rounded truncate">鄭小姐 造型</div></div>
          <div class="bg-gray-50 p-1"></div>

          <div class="bg-white p-1.5 text-xs text-gray-400 text-right">14:00</div>
          <div class="bg-white p-1"><div class="bg-rose-100 text-rose-700 text-xs p-1 rounded truncate">張小姐 染護造</div></div>
          <div class="bg-white p-1"><div class="bg-purple-100 text-purple-700 text-xs p-1 rounded truncate">楊太太 燙髮</div></div>
          <div class="bg-white p-1"><div class="bg-emerald-100 text-emerald-700 text-xs p-1 rounded truncate">許先生 剪髮</div></div>
          <div class="bg-white p-1"></div>
          <div class="bg-white p-1"><div class="bg-rose-100 text-rose-700 text-xs p-1 rounded truncate">何小姐 染護</div></div>
          <div class="bg-white p-1"><div class="bg-amber-100 text-amber-700 text-xs p-1 rounded truncate">預約滿</div></div>
          <div class="bg-gray-50 p-1"></div>

          <div class="bg-white p-1.5 text-xs text-gray-400 text-right">16:00</div>
          <div class="bg-white p-1"><div class="bg-blue-100 text-blue-700 text-xs p-1 rounded truncate">李先生 染髮</div></div>
          <div class="bg-white p-1"></div>
          <div class="bg-white p-1"><div class="bg-purple-100 text-purple-700 text-xs p-1 rounded truncate">吳小姐 燙髮</div></div>
          <div class="bg-white p-1"><div class="bg-emerald-100 text-emerald-700 text-xs p-1 rounded truncate">朱先生 剪髮</div></div>
          <div class="bg-white p-1"></div>
          <div class="bg-white p-1"><div class="bg-purple-100 text-purple-700 text-xs p-1 rounded truncate">馬小姐 護髮</div></div>
          <div class="bg-gray-50 p-1"></div>
        </div>
      </div>
    </div>

    <!-- Clients -->
    <div id="page-clients" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="bg-white rounded-2xl border border-gray-100">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h3 class="font-semibold text-gray-900">客戶名單</h3>
            <div class="relative"><input type="text" placeholder="搜尋客戶..." class="text-sm bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 w-48 focus:outline-none focus:border-primary"><svg class="absolute left-2.5 top-2 text-gray-400" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
          </div>
          <span class="text-sm text-gray-400">共 86 位客戶</span>
        </div>
        <table class="w-full">
          <thead><tr class="text-xs text-gray-400 border-b border-gray-50"><th class="text-left px-4 py-2.5 font-medium">客戶</th><th class="text-left px-4 py-2.5 font-medium">電話</th><th class="text-center px-4 py-2.5 font-medium">預約次數</th><th class="text-left px-4 py-2.5 font-medium">上次預約</th><th class="text-right px-4 py-2.5 font-medium">累計消費</th><th class="text-center px-4 py-2.5 font-medium">等級</th></tr></thead>
          <tbody>
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition"><td class="px-4 py-3"><div class="flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">林</div><span class="text-sm font-medium">林小姐</span></div></td><td class="px-4 py-3 text-sm text-gray-500">0912-***-789</td><td class="px-4 py-3 text-sm text-center font-medium">24</td><td class="px-4 py-3 text-sm text-gray-400">今天</td><td class="px-4 py-3 text-sm text-right font-medium">$42,800</td><td class="px-4 py-3 text-center"><span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">VIP</span></td></tr>
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition"><td class="px-4 py-3"><div class="flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">王</div><span class="text-sm font-medium">王太太</span></div></td><td class="px-4 py-3 text-sm text-gray-500">0923-***-456</td><td class="px-4 py-3 text-sm text-center font-medium">18</td><td class="px-4 py-3 text-sm text-gray-400">今天</td><td class="px-4 py-3 text-sm text-right font-medium">$36,200</td><td class="px-4 py-3 text-center"><span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">VIP</span></td></tr>
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition"><td class="px-4 py-3"><div class="flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">張</div><span class="text-sm font-medium">張小姐</span></div></td><td class="px-4 py-3 text-sm text-gray-500">0935-***-123</td><td class="px-4 py-3 text-sm text-center font-medium">12</td><td class="px-4 py-3 text-sm text-gray-400">今天</td><td class="px-4 py-3 text-sm text-right font-medium">$28,500</td><td class="px-4 py-3 text-center"><span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">金卡</span></td></tr>
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition"><td class="px-4 py-3"><div class="flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-xs font-bold text-rose-600">陳</div><span class="text-sm font-medium">陳先生</span></div></td><td class="px-4 py-3 text-sm text-gray-500">0987-***-654</td><td class="px-4 py-3 text-sm text-center font-medium">8</td><td class="px-4 py-3 text-sm text-gray-400">今天</td><td class="px-4 py-3 text-sm text-right font-medium">$12,000</td><td class="px-4 py-3 text-center"><span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">一般</span></td></tr>
            <tr class="hover:bg-gray-50 transition"><td class="px-4 py-3"><div class="flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600">吳</div><span class="text-sm font-medium">吳小姐</span></div></td><td class="px-4 py-3 text-sm text-gray-500">0956-***-321</td><td class="px-4 py-3 text-sm text-center font-medium">5</td><td class="px-4 py-3 text-sm text-gray-400">2/14</td><td class="px-4 py-3 text-sm text-right font-medium">$8,500</td><td class="px-4 py-3 text-center"><span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">一般</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Services -->
    <div id="page-services" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition">
          <div class="flex items-center justify-between mb-3"><span class="text-2xl">✂️</span><span class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">熱門</span></div>
          <h4 class="font-semibold text-gray-900 mb-1">剪髮</h4>
          <p class="text-xs text-gray-400 mb-3">含洗頭 + 造型吹整</p>
          <div class="flex items-center justify-between"><span class="text-lg font-bold text-primary">$500</span><span class="text-xs text-gray-400">約 45 分鐘</span></div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition">
          <div class="flex items-center justify-between mb-3"><span class="text-2xl">🎨</span><span class="text-xs bg-rose/10 text-rose px-2 py-0.5 rounded-full">高人氣</span></div>
          <h4 class="font-semibold text-gray-900 mb-1">染髮</h4>
          <p class="text-xs text-gray-400 mb-3">單色 / 漸層 / 挑染</p>
          <div class="flex items-center justify-between"><span class="text-lg font-bold text-primary">$2,500 起</span><span class="text-xs text-gray-400">約 2 小時</span></div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition">
          <div class="flex items-center justify-between mb-3"><span class="text-2xl">💫</span></div>
          <h4 class="font-semibold text-gray-900 mb-1">燙髮</h4>
          <p class="text-xs text-gray-400 mb-3">溫塑燙 / 冷燙 / 離子燙</p>
          <div class="flex items-center justify-between"><span class="text-lg font-bold text-primary">$3,000 起</span><span class="text-xs text-gray-400">約 2.5 小時</span></div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition">
          <div class="flex items-center justify-between mb-3"><span class="text-2xl">💆</span></div>
          <h4 class="font-semibold text-gray-900 mb-1">護髮</h4>
          <p class="text-xs text-gray-400 mb-3">深層修護 / 角蛋白 / 結構護理</p>
          <div class="flex items-center justify-between"><span class="text-lg font-bold text-primary">$1,500 起</span><span class="text-xs text-gray-400">約 1 小時</span></div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition">
          <div class="flex items-center justify-between mb-3"><span class="text-2xl">👔</span></div>
          <h4 class="font-semibold text-gray-900 mb-1">男士剪髮</h4>
          <p class="text-xs text-gray-400 mb-3">剪髮 + 修容 + 造型</p>
          <div class="flex items-center justify-between"><span class="text-lg font-bold text-primary">$400</span><span class="text-xs text-gray-400">約 30 分鐘</span></div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition">
          <div class="flex items-center justify-between mb-3"><span class="text-2xl">👰</span></div>
          <h4 class="font-semibold text-gray-900 mb-1">特殊造型</h4>
          <p class="text-xs text-gray-400 mb-3">婚禮 / 活動 / 拍攝造型</p>
          <div class="flex items-center justify-between"><span class="text-lg font-bold text-primary">$3,500 起</span><span class="text-xs text-gray-400">約 2 小時</span></div>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Booking Modal -->
<div id="bookingModal" class="fixed inset-0 z-50 hidden items-center justify-center modal-overlay">
  <div class="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-bold text-lg text-gray-900">新增預約</h2>
      <button onclick="closeBookingModal()" class="text-gray-400 hover:text-gray-600"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="space-y-4">
      <input type="text" placeholder="客戶姓名或電話" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
      <div><label class="text-xs text-gray-500 mb-1 block">服務項目</label><select class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"><option>剪髮 - $500</option><option>染髮 - $2,500起</option><option>燙髮 - $3,000起</option><option>護髮 - $1,500起</option></select></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-gray-500 mb-1 block">日期</label><input type="date" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"></div>
        <div><label class="text-xs text-gray-500 mb-1 block">設計師</label><select class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"><option>Amy</option><option>Kevin</option><option>Mia</option></select></div>
      </div>
      <div>
        <label class="text-xs text-gray-500 mb-2 block">選擇時段</label>
        <div class="grid grid-cols-4 gap-2">
          <div class="time-slot border border-gray-200 rounded-lg text-center py-2 text-sm" onclick="selectSlot(this)">09:00</div>
          <div class="time-slot booked border border-gray-200 rounded-lg text-center py-2 text-sm">10:00</div>
          <div class="time-slot border border-gray-200 rounded-lg text-center py-2 text-sm" onclick="selectSlot(this)">11:00</div>
          <div class="time-slot booked border border-gray-200 rounded-lg text-center py-2 text-sm">13:00</div>
          <div class="time-slot border border-gray-200 rounded-lg text-center py-2 text-sm" onclick="selectSlot(this)">14:00</div>
          <div class="time-slot border border-gray-200 rounded-lg text-center py-2 text-sm" onclick="selectSlot(this)">15:00</div>
          <div class="time-slot border border-gray-200 rounded-lg text-center py-2 text-sm" onclick="selectSlot(this)">16:00</div>
          <div class="time-slot border border-gray-200 rounded-lg text-center py-2 text-sm" onclick="selectSlot(this)">17:00</div>
        </div>
      </div>
      <div class="flex items-center gap-2"><input type="checkbox" checked class="accent-primary"><label class="text-sm text-gray-600">發送預約確認簡訊</label></div>
      <button onclick="closeBookingModal()" class="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primaryDark transition">確認預約</button>
    </div>
  </div>
</div>

<script>
function switchPage(page){
  document.querySelectorAll('[id^="page-"]').forEach(p=>p.classList.add('hidden'));
  document.getElementById('page-'+page).classList.remove('hidden');
  document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
  document.querySelector('[data-page="'+page+'"]').classList.add('active');
  const titles={dashboard:'儀表板',calendar:'預約日曆',clients:'客戶名單',services:'服務項目'};
  document.getElementById('pageTitle').textContent=titles[page]||page;
}
function selectSlot(el){document.querySelectorAll('.time-slot:not(.booked)').forEach(s=>s.classList.remove('selected'));el.classList.add('selected')}
function openBookingModal(){document.getElementById('bookingModal').classList.remove('hidden');document.getElementById('bookingModal').classList.add('flex')}
function closeBookingModal(){document.getElementById('bookingModal').classList.add('hidden');document.getElementById('bookingModal').classList.remove('flex')}
</script>
</body>
</html>$HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
