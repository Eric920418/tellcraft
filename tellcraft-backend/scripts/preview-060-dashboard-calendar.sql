INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '9f08d3b2-0814-4888-ba6b-6e4b26d4facd',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>日程通 CalendarPro</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{primary:'#6366f1',primaryLight:'#818cf8',primaryDark:'#4f46e5',surface:'#f5f3ff',sidebar:'#1e1b4b',accent:'#f59e0b',success:'#10b981',danger:'#ef4444',sky:'#0ea5e9',rose:'#f43f5e'},fontFamily:{sans:['Inter','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#f8fafc;overflow:hidden;height:100vh}
.sidebar-item{transition:all .2s}
.sidebar-item:hover,.sidebar-item.active{background:rgba(255,255,255,.1);border-radius:8px}
.cal-day{min-height:90px;transition:all .15s;cursor:pointer}
.cal-day:hover{background:#f5f3ff}
.cal-day.today{background:#eef2ff;border:2px solid #6366f1}
.cal-day.other-month{opacity:.35}
.event-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.event-bar{font-size:11px;padding:1px 6px;border-radius:4px;cursor:pointer;truncate;transition:all .15s}
.event-bar:hover{opacity:.85}
.fade-in{animation:fadeIn .2s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.modal-overlay{background:rgba(0,0,0,.4);backdrop-filter:blur(4px)}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#c7d2fe;border-radius:99px}
</style>
</head>
<body>
<div class="flex h-screen">
  <!-- Sidebar -->
  <aside class="w-56 bg-sidebar text-white flex flex-col flex-shrink-0">
    <div class="p-4 flex items-center gap-2.5 border-b border-white/10">
      <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <span class="font-bold text-base">CalendarPro</span>
    </div>

    <div class="p-3">
      <button onclick="openEventModal()" class="w-full bg-primary text-white text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-primaryDark transition flex items-center justify-center gap-1.5">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新增事件
      </button>
    </div>

    <!-- Mini Calendar -->
    <div class="px-4 mb-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium">2026 年 2 月</span>
      </div>
      <div class="grid grid-cols-7 gap-0 text-center text-xs">
        <span class="text-white/30 py-1">日</span><span class="text-white/30 py-1">一</span><span class="text-white/30 py-1">二</span><span class="text-white/30 py-1">三</span><span class="text-white/30 py-1">四</span><span class="text-white/30 py-1">五</span><span class="text-white/30 py-1">六</span>
        <span class="py-1 text-white/20">1</span><span class="py-1">2</span><span class="py-1">3</span><span class="py-1">4</span><span class="py-1">5</span><span class="py-1">6</span><span class="py-1">7</span>
        <span class="py-1">8</span><span class="py-1">9</span><span class="py-1">10</span><span class="py-1">11</span><span class="py-1">12</span><span class="py-1">13</span><span class="py-1">14</span>
        <span class="py-1">15</span><span class="py-1 bg-primary rounded-full text-white font-bold">16</span><span class="py-1">17</span><span class="py-1">18</span><span class="py-1">19</span><span class="py-1">20</span><span class="py-1">21</span>
        <span class="py-1">22</span><span class="py-1">23</span><span class="py-1">24</span><span class="py-1">25</span><span class="py-1">26</span><span class="py-1">27</span><span class="py-1">28</span>
      </div>
    </div>

    <!-- Categories -->
    <div class="px-4 flex-1">
      <div class="text-xs text-white/30 uppercase tracking-wider mb-2">日曆分類</div>
      <div class="space-y-1.5">
        <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked class="accent-indigo-500"><span class="text-white/80">工作</span></label>
        <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked class="accent-emerald-500"><span class="text-white/80">個人</span></label>
        <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked class="accent-amber-500"><span class="text-white/80">家庭</span></label>
        <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked class="accent-rose-500"><span class="text-white/80">健康</span></label>
      </div>
    </div>

    <!-- Upcoming -->
    <div class="p-4 border-t border-white/10">
      <div class="text-xs text-white/30 mb-2">即將到來</div>
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <div class="event-dot bg-primary"></div>
          <div class="text-xs"><div class="text-white/80">產品會議</div><div class="text-white/30">10:00</div></div>
        </div>
        <div class="flex items-center gap-2">
          <div class="event-dot bg-success"></div>
          <div class="text-xs"><div class="text-white/80">午餐約會</div><div class="text-white/30">12:00</div></div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col overflow-hidden">
    <!-- Top Bar -->
    <header class="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <div class="flex items-center gap-4">
        <h1 class="font-bold text-xl text-gray-900">2026 年 2 月</h1>
        <div class="flex gap-1">
          <button class="text-gray-400 hover:text-gray-600 p-1"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>
          <button class="text-gray-400 hover:text-gray-600 p-1"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>
        <button class="text-sm text-primary font-medium hover:bg-primary/5 px-3 py-1 rounded-lg transition">今天</button>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="switchView('month')" id="btn-month" class="text-sm font-medium px-3 py-1.5 rounded-lg bg-primary text-white transition">月</button>
        <button onclick="switchView('week')" id="btn-week" class="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">週</button>
        <button onclick="switchView('day')" id="btn-day" class="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">日</button>
      </div>
    </header>

    <!-- Month View -->
    <div id="view-month" class="flex-1 overflow-auto fade-in">
      <!-- Week header -->
      <div class="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
        <div class="text-center text-xs font-medium text-gray-400 py-2">週日</div>
        <div class="text-center text-xs font-medium text-gray-400 py-2">週一</div>
        <div class="text-center text-xs font-medium text-gray-400 py-2">週二</div>
        <div class="text-center text-xs font-medium text-gray-400 py-2">週三</div>
        <div class="text-center text-xs font-medium text-gray-400 py-2">週四</div>
        <div class="text-center text-xs font-medium text-gray-400 py-2">週五</div>
        <div class="text-center text-xs font-medium text-gray-400 py-2">週六</div>
      </div>
      <!-- Calendar Grid -->
      <div class="grid grid-cols-7 flex-1">
        <!-- Week 1 -->
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-300 font-medium">1</span></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">2</span><div class="event-bar bg-indigo-100 text-indigo-700 mt-1 truncate">團隊週會</div></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">3</span></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">4</span><div class="event-bar bg-emerald-100 text-emerald-700 mt-1 truncate">瑜珈課</div></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">5</span></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">6</span><div class="event-bar bg-amber-100 text-amber-700 mt-1 truncate">家庭聚餐</div></div>
        <div class="cal-day border-b border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">7</span></div>
        <!-- Week 2 -->
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">8</span></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">9</span><div class="event-bar bg-indigo-100 text-indigo-700 mt-1 truncate">團隊週會</div></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">10</span><div class="event-bar bg-rose-100 text-rose-700 mt-1 truncate">健康檢查</div></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">11</span><div class="event-bar bg-emerald-100 text-emerald-700 mt-1 truncate">瑜珈課</div></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">12</span></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">13</span><div class="event-bar bg-indigo-100 text-indigo-700 mt-1 truncate">客戶提案</div></div>
        <div class="cal-day border-b border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">14</span><div class="event-bar bg-rose-100 text-rose-700 mt-1 truncate">💕 情人節晚餐</div></div>
        <!-- Week 3 -->
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">15</span><div class="event-bar bg-amber-100 text-amber-700 mt-1 truncate">親子活動</div></div>
        <div class="cal-day today border-b border-r border-gray-100 p-1.5">
          <span class="text-xs text-primary font-bold">16</span>
          <div class="event-bar bg-indigo-100 text-indigo-700 mt-1 truncate">產品會議 10:00</div>
          <div class="event-bar bg-emerald-100 text-emerald-700 mt-0.5 truncate">午餐約會 12:00</div>
          <div class="event-bar bg-sky-100 text-sky-700 mt-0.5 truncate">讀書會 19:00</div>
        </div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">17</span><div class="event-bar bg-indigo-100 text-indigo-700 mt-1 truncate">設計評審</div></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">18</span><div class="event-bar bg-emerald-100 text-emerald-700 mt-1 truncate">瑜珈課</div></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">19</span></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">20</span><div class="event-bar bg-indigo-100 text-indigo-700 mt-1 truncate">Q1 Review</div></div>
        <div class="cal-day border-b border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">21</span></div>
        <!-- Week 4 -->
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">22</span></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">23</span><div class="event-bar bg-indigo-100 text-indigo-700 mt-1 truncate">團隊週會</div></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">24</span></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">25</span><div class="event-bar bg-emerald-100 text-emerald-700 mt-1 truncate">瑜珈課</div><div class="event-bar bg-amber-100 text-amber-700 mt-0.5 truncate">接小孩</div></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">26</span></div>
        <div class="cal-day border-b border-r border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">27</span><div class="event-bar bg-indigo-100 text-indigo-700 mt-1 truncate">月底報告</div></div>
        <div class="cal-day border-b border-gray-100 p-1.5"><span class="text-xs text-gray-500 font-medium">28</span><div class="event-bar bg-amber-100 text-amber-700 mt-1 truncate">家族聚會</div></div>
      </div>
    </div>

    <!-- Week View -->
    <div id="view-week" class="flex-1 overflow-auto fade-in hidden">
      <div class="flex">
        <div class="w-16 flex-shrink-0"></div>
        <div class="flex-1 grid grid-cols-7 border-b border-gray-100">
          <div class="text-center py-2 border-r border-gray-100"><div class="text-xs text-gray-400">週日</div><div class="text-sm font-medium text-gray-500">15</div></div>
          <div class="text-center py-2 border-r border-gray-100 bg-primary/5"><div class="text-xs text-primary">週一</div><div class="text-sm font-bold text-primary bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center mx-auto">16</div></div>
          <div class="text-center py-2 border-r border-gray-100"><div class="text-xs text-gray-400">週二</div><div class="text-sm font-medium text-gray-500">17</div></div>
          <div class="text-center py-2 border-r border-gray-100"><div class="text-xs text-gray-400">週三</div><div class="text-sm font-medium text-gray-500">18</div></div>
          <div class="text-center py-2 border-r border-gray-100"><div class="text-xs text-gray-400">週四</div><div class="text-sm font-medium text-gray-500">19</div></div>
          <div class="text-center py-2 border-r border-gray-100"><div class="text-xs text-gray-400">週五</div><div class="text-sm font-medium text-gray-500">20</div></div>
          <div class="text-center py-2"><div class="text-xs text-gray-400">週六</div><div class="text-sm font-medium text-gray-500">21</div></div>
        </div>
      </div>
      <div class="flex flex-1 overflow-auto">
        <div class="w-16 flex-shrink-0">
          <div class="h-12 flex items-center justify-end pr-2 text-xs text-gray-300">08:00</div>
          <div class="h-12 flex items-center justify-end pr-2 text-xs text-gray-300">09:00</div>
          <div class="h-12 flex items-center justify-end pr-2 text-xs text-gray-300">10:00</div>
          <div class="h-12 flex items-center justify-end pr-2 text-xs text-gray-300">11:00</div>
          <div class="h-12 flex items-center justify-end pr-2 text-xs text-gray-300">12:00</div>
          <div class="h-12 flex items-center justify-end pr-2 text-xs text-gray-300">13:00</div>
          <div class="h-12 flex items-center justify-end pr-2 text-xs text-gray-300">14:00</div>
          <div class="h-12 flex items-center justify-end pr-2 text-xs text-gray-300">15:00</div>
          <div class="h-12 flex items-center justify-end pr-2 text-xs text-gray-300">16:00</div>
          <div class="h-12 flex items-center justify-end pr-2 text-xs text-gray-300">17:00</div>
          <div class="h-12 flex items-center justify-end pr-2 text-xs text-gray-300">18:00</div>
          <div class="h-12 flex items-center justify-end pr-2 text-xs text-gray-300">19:00</div>
          <div class="h-12 flex items-center justify-end pr-2 text-xs text-gray-300">20:00</div>
        </div>
        <div class="flex-1 grid grid-cols-7 relative">
          <!-- Hour lines -->
          <div class="col-span-7 absolute inset-0 pointer-events-none">
            <div class="h-12 border-b border-gray-50"></div><div class="h-12 border-b border-gray-50"></div><div class="h-12 border-b border-gray-50"></div><div class="h-12 border-b border-gray-50"></div><div class="h-12 border-b border-gray-50"></div><div class="h-12 border-b border-gray-50"></div><div class="h-12 border-b border-gray-50"></div><div class="h-12 border-b border-gray-50"></div><div class="h-12 border-b border-gray-50"></div><div class="h-12 border-b border-gray-50"></div><div class="h-12 border-b border-gray-50"></div><div class="h-12 border-b border-gray-50"></div><div class="h-12 border-b border-gray-50"></div>
          </div>
          <!-- Sunday column -->
          <div class="border-r border-gray-100 relative">
            <div class="absolute left-1 right-1 bg-amber-100 border-l-2 border-amber-500 rounded px-1 py-0.5 text-xs text-amber-700" style="top:120px;height:48px">親子活動</div>
          </div>
          <!-- Monday (today) column -->
          <div class="border-r border-gray-100 bg-primary/5 relative">
            <div class="absolute left-1 right-1 bg-indigo-100 border-l-2 border-indigo-500 rounded px-1 py-0.5 text-xs text-indigo-700" style="top:24px;height:48px">產品會議<br><span class="text-indigo-400">10:00-11:00</span></div>
            <div class="absolute left-1 right-1 bg-emerald-100 border-l-2 border-emerald-500 rounded px-1 py-0.5 text-xs text-emerald-700" style="top:96px;height:36px">午餐約會<br><span class="text-emerald-400">12:00</span></div>
            <div class="absolute left-1 right-1 bg-sky-100 border-l-2 border-sky-500 rounded px-1 py-0.5 text-xs text-sky-700" style="top:264px;height:48px">讀書會<br><span class="text-sky-400">19:00-20:00</span></div>
          </div>
          <!-- Tuesday -->
          <div class="border-r border-gray-100 relative">
            <div class="absolute left-1 right-1 bg-indigo-100 border-l-2 border-indigo-500 rounded px-1 py-0.5 text-xs text-indigo-700" style="top:48px;height:48px">設計評審<br><span class="text-indigo-400">10:00-11:00</span></div>
          </div>
          <!-- Wednesday -->
          <div class="border-r border-gray-100 relative">
            <div class="absolute left-1 right-1 bg-emerald-100 border-l-2 border-emerald-500 rounded px-1 py-0.5 text-xs text-emerald-700" style="top:192px;height:36px">瑜珈課<br><span class="text-emerald-400">16:00</span></div>
          </div>
          <!-- Thursday -->
          <div class="border-r border-gray-100 relative"></div>
          <!-- Friday -->
          <div class="border-r border-gray-100 relative">
            <div class="absolute left-1 right-1 bg-indigo-100 border-l-2 border-indigo-500 rounded px-1 py-0.5 text-xs text-indigo-700" style="top:24px;height:72px">Q1 Review<br><span class="text-indigo-400">10:00-12:00</span></div>
          </div>
          <!-- Saturday -->
          <div class="relative"></div>
        </div>
      </div>
    </div>

    <!-- Day View -->
    <div id="view-day" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="text-center mb-6">
        <div class="text-3xl font-bold text-gray-900">16</div>
        <div class="text-sm text-gray-500">2 月 週一・今天</div>
      </div>
      <div class="max-w-xl mx-auto space-y-3">
        <div class="bg-white rounded-xl p-4 border-l-4 border-indigo-500 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="font-semibold text-gray-900">產品會議</span>
            <span class="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">工作</span>
          </div>
          <div class="text-sm text-gray-500 mb-2">10:00 - 11:00</div>
          <div class="text-xs text-gray-400">討論新功能規格和時間表，與設計團隊同步</div>
        </div>
        <div class="bg-white rounded-xl p-4 border-l-4 border-emerald-500 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="font-semibold text-gray-900">午餐約會</span>
            <span class="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">個人</span>
          </div>
          <div class="text-sm text-gray-500 mb-2">12:00 - 13:00</div>
          <div class="text-xs text-gray-400">老地方見面，討論週末旅行計畫</div>
        </div>
        <div class="bg-white rounded-xl p-4 border-l-4 border-sky-500 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="font-semibold text-gray-900">讀書會</span>
            <span class="text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full">個人</span>
          </div>
          <div class="text-sm text-gray-500 mb-2">19:00 - 20:00</div>
          <div class="text-xs text-gray-400">本次主題：《原子習慣》第 5-8 章討論</div>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Add Event Modal -->
<div id="eventModal" class="fixed inset-0 z-50 hidden items-center justify-center modal-overlay">
  <div class="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-bold text-lg text-gray-900">新增事件</h2>
      <button onclick="closeEventModal()" class="text-gray-400 hover:text-gray-600"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="space-y-4">
      <input type="text" placeholder="事件名稱" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-gray-500 mb-1 block">開始時間</label><input type="datetime-local" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"></div>
        <div><label class="text-xs text-gray-500 mb-1 block">結束時間</label><input type="datetime-local" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"></div>
      </div>
      <div>
        <label class="text-xs text-gray-500 mb-1 block">分類</label>
        <div class="flex gap-2">
          <button class="flex-1 text-sm py-2 rounded-lg bg-indigo-50 text-indigo-600 border-2 border-indigo-200 font-medium">工作</button>
          <button class="flex-1 text-sm py-2 rounded-lg bg-gray-50 text-gray-500 border border-gray-200">個人</button>
          <button class="flex-1 text-sm py-2 rounded-lg bg-gray-50 text-gray-500 border border-gray-200">家庭</button>
          <button class="flex-1 text-sm py-2 rounded-lg bg-gray-50 text-gray-500 border border-gray-200">健康</button>
        </div>
      </div>
      <textarea placeholder="備註（選填）" rows="2" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"></textarea>
      <div class="flex items-center gap-2">
        <input type="checkbox" id="remind" class="accent-primary"><label for="remind" class="text-sm text-gray-600">提前 15 分鐘提醒</label>
      </div>
      <button onclick="closeEventModal()" class="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primaryDark transition">建立事件</button>
    </div>
  </div>
</div>

<script>
function switchView(view){
  ['month','week','day'].forEach(v=>{
    document.getElementById('view-'+v).classList.add('hidden');
    document.getElementById('btn-'+v).classList.remove('bg-primary','text-white');
    document.getElementById('btn-'+v).classList.add('bg-gray-100','text-gray-600');
  });
  document.getElementById('view-'+view).classList.remove('hidden');
  document.getElementById('btn-'+view).classList.add('bg-primary','text-white');
  document.getElementById('btn-'+view).classList.remove('bg-gray-100','text-gray-600');
}
function openEventModal(){document.getElementById('eventModal').classList.remove('hidden');document.getElementById('eventModal').classList.add('flex')}
function closeEventModal(){document.getElementById('eventModal').classList.add('hidden');document.getElementById('eventModal').classList.remove('flex')}
</script>
</body>
</html>$HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
