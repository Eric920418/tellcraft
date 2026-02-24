INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'e0a27560-1aad-43b6-b52d-05846e127de6',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HabitTrack - Habit Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{emerald0:'#f0fdf4',emerald1:'#bbf7d0',emerald2:'#6ee7b7',emerald3:'#34d399',emerald4:'#059669',cream:'#fefcf3',creamDark:'#faf5e4',cardBg:'rgba(255,255,255,0.92)'},fontFamily:{display:['Rubik','sans-serif'],body:['Rubik','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Rubik',sans-serif;background:#fefcf3;overflow-x:hidden;min-height:100vh}

/* Background Heatmap Grid */
.bg-heatmap{position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;opacity:0.12;display:grid;grid-template-columns:repeat(52,12px);grid-template-rows:repeat(7,12px);gap:2px;padding:20px;align-content:start;justify-content:center;pointer-events:none}
.bg-heatmap .cell{border-radius:2px;width:12px;height:12px}
.cell-0{background:#e5e7eb}
.cell-1{background:#bbf7d0}
.cell-2{background:#6ee7b7}
.cell-3{background:#34d399}
.cell-4{background:#059669}

/* Content layer */
.content-layer{position:relative;z-index:1;min-height:100vh}

/* Streak pulse */
@keyframes pulse-fire{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
.fire-pulse{animation:pulse-fire 2s ease-in-out infinite}

/* Count up animation */
@keyframes count-up-glow{0%{opacity:0.5;transform:scale(0.8)}100%{opacity:1;transform:scale(1)}}
.count-up-enter{animation:count-up-glow 0.6s ease-out forwards}

/* Progress bar animation */
@keyframes progress-fill{from{width:0}to{width:var(--target-width)}}
.progress-animated{animation:progress-fill 1s ease-out 0.3s forwards;width:0}

/* Habit row hover */
.habit-row{transition:all 0.2s ease;border:1px solid transparent}
.habit-row:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(5,150,105,0.1);border-color:rgba(5,150,105,0.15)}

/* Heatmap cell hover (mini) */
.mini-cell{transition:all 0.15s ease;cursor:pointer}
.mini-cell:hover{transform:scale(1.4);box-shadow:0 0 6px rgba(5,150,105,0.4)}

/* Stat card */
.stat-card{transition:all 0.2s ease}
.stat-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(5,150,105,0.1)}

/* Tooltip */
.tooltip-wrap{position:relative}
.tooltip-wrap:hover .tooltip-text{opacity:1;transform:translateX(-50%) translateY(0)}
.tooltip-text{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%) translateY(4px);background:#1f2937;color:white;padding:4px 8px;border-radius:6px;font-size:11px;white-space:nowrap;opacity:0;transition:all 0.15s ease;pointer-events:none;z-index:10}
.tooltip-text::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border:4px solid transparent;border-top-color:#1f2937}

/* Checkbox */
.habit-check{width:22px;height:22px;border-radius:6px;border:2px solid #d1d5db;cursor:pointer;transition:all 0.2s ease;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.habit-check.done{border-color:#059669;background:#059669}
.habit-check:not(.done):hover{border-color:#34d399;background:#f0fdf4}
@keyframes check-pop{0%{transform:scale(1)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
.habit-check.just-checked{animation:check-pop 0.3s ease}

/* Fade in */
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.fade-up{animation:fadeUp 0.5s ease forwards}
.fade-up-d1{animation-delay:0.1s;opacity:0}
.fade-up-d2{animation-delay:0.2s;opacity:0}
.fade-up-d3{animation-delay:0.3s;opacity:0}
.fade-up-d4{animation-delay:0.4s;opacity:0}

/* Scrollbar */
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-thumb{background:#bbf7d0;border-radius:99px}
::-webkit-scrollbar-track{background:transparent}
</style>
</head>
<body>

<!-- SIGNATURE: Full-page background heatmap -->
<div class="bg-heatmap" id="bgHeatmap"></div>

<!-- Content overlaid on heatmap -->
<div class="content-layer">

  <!-- Header -->
  <header class="flex items-center justify-between px-8 py-5">
    <div class="flex items-center gap-3">
      <!-- Logo -->
      <div class="w-9 h-9 rounded-xl bg-emerald4 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="white" stroke-width="2"/>
        </svg>
      </div>
      <span class="text-xl font-bold text-gray-900 tracking-tight">HabitTrack</span>
    </div>
    <div class="flex items-center gap-5">
      <span class="text-sm text-gray-500 font-medium">2026 / 02 / 24 Mon</span>
      <!-- Streak badge -->
      <div class="flex items-center gap-2 bg-gradient-to-r from-emerald4 to-emerald3 text-white text-sm font-bold px-4 py-2 rounded-full shadow-md shadow-emerald-200">
        <svg class="fire-pulse" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 4 10 4 14.5C4 18.64 7.58 22 12 22C16.42 22 20 18.64 20 14.5C20 10 12 2 12 2Z" fill="#FCD34D"/>
          <path d="M12 8C12 8 8 12 8 14.75C8 17.1 9.79 19 12 19C14.21 19 16 17.1 16 14.75C16 12 12 8 12 8Z" fill="#FB923C"/>
          <path d="M12 13C12 13 10 15 10 16.25C10 17.22 10.9 18 12 18C13.1 18 14 17.22 14 16.25C14 15 12 13 12 13Z" fill="#FEF3C7"/>
        </svg>
        <span id="streakBadge">24 Day Streak!</span>
      </div>
      <!-- Settings gear -->
      <button class="w-9 h-9 rounded-xl bg-white/80 border border-gray-200 flex items-center justify-center hover:bg-white hover:border-emerald-300 transition-all cursor-pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      </button>
    </div>
  </header>

  <!-- Main content area -->
  <div class="max-w-5xl mx-auto px-6 pb-12">

    <!-- Large Streak Counter -->
    <div class="text-center mb-10 fade-up">
      <div class="flex items-center justify-center gap-3 mb-2">
        <svg class="fire-pulse" width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 4 10 4 14.5C4 18.64 7.58 22 12 22C16.42 22 20 18.64 20 14.5C20 10 12 2 12 2Z" fill="#FCD34D"/>
          <path d="M12 8C12 8 8 12 8 14.75C8 17.1 9.79 19 12 19C14.21 19 16 17.1 16 14.75C16 12 12 8 12 8Z" fill="#FB923C"/>
          <path d="M12 13C12 13 10 15 10 16.25C10 17.22 10.9 18 12 18C13.1 18 14 17.22 14 16.25C14 15 12 13 12 13Z" fill="#FEF3C7"/>
        </svg>
        <span id="streakLarge" class="text-7xl font-black text-gray-900 count-up-enter" style="font-family:'Rubik',sans-serif;letter-spacing:-2px">0</span>
      </div>
      <p class="text-sm font-medium text-gray-500 tracking-wide uppercase">Day Streak</p>
    </div>

    <!-- Today's Habits Card -->
    <div class="bg-cardBg backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-emerald-100/60 mb-6 fade-up fade-up-d1">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-bold text-gray-900">Today's Habits</h2>
        <span class="text-xs font-medium text-emerald4 bg-emerald-50 px-3 py-1 rounded-full">3/5 done</span>
      </div>
      <div class="space-y-3" id="habitList">

        <!-- Habit 1: Water - in progress -->
        <div class="habit-row flex items-center gap-4 bg-white/70 rounded-xl px-4 py-3.5" data-habit="water">
          <div class="habit-check" onclick="toggleHabit(this)">
            <svg width="14" height="14" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L5.5 11C4 13.2 4 15.5 4 16.5C4 20.08 7.58 22 12 22C16.42 22 20 20.08 20 16.5C20 15.5 20 13.2 18.5 11L12 2Z" fill="#60A5FA" opacity="0.2"/><path d="M12 2L5.5 11C4 13.2 4 15.5 4 16.5C4 20.08 7.58 22 12 22C16.42 22 20 20.08 20 16.5C20 15.5 20 13.2 18.5 11L12 2Z" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-semibold text-sm text-gray-900">Drink 8 glasses water</span>
              <span class="text-xs font-medium text-emerald4">6 / 8</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2">
              <div class="bg-gradient-to-r from-emerald3 to-emerald4 rounded-full h-2 progress-animated" style="--target-width:75%"></div>
            </div>
          </div>
        </div>

        <!-- Habit 2: Exercise - completed -->
        <div class="habit-row flex items-center gap-4 bg-emerald-50/60 rounded-xl px-4 py-3.5" data-habit="exercise">
          <div class="habit-check done" onclick="toggleHabit(this)">
            <svg width="14" height="14" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2" stroke="#059669" stroke-width="1.5"/><path d="M4 17L7 12L10 14L14 10L17 12L20 7" stroke="#059669" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 20H18" stroke="#059669" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-sm text-gray-900">Exercise 30 min</span>
              <span class="text-xs font-bold text-emerald4 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Done
              </span>
            </div>
          </div>
        </div>

        <!-- Habit 3: Read - in progress -->
        <div class="habit-row flex items-center gap-4 bg-white/70 rounded-xl px-4 py-3.5" data-habit="read">
          <div class="habit-check" onclick="toggleHabit(this)">
            <svg width="14" height="14" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 19.5V4.5C4 3.67 4.67 3 5.5 3H20V21H5.5C4.67 21 4 20.33 4 19.5Z" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 19.5C4 18.67 4.67 18 5.5 18H20" stroke="#F59E0B" stroke-width="1.5"/><path d="M8 7H15" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/><path d="M8 10H12" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-semibold text-sm text-gray-900">Read 20 pages</span>
              <span class="text-xs font-medium text-amber-600">12 / 20</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2">
              <div class="bg-gradient-to-r from-amber-300 to-amber-500 rounded-full h-2 progress-animated" style="--target-width:60%"></div>
            </div>
          </div>
        </div>

        <!-- Habit 4: Meditate - completed -->
        <div class="habit-row flex items-center gap-4 bg-emerald-50/60 rounded-xl px-4 py-3.5" data-habit="meditate">
          <div class="habit-check done" onclick="toggleHabit(this)">
            <svg width="14" height="14" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="6" r="2.5" stroke="#8B5CF6" stroke-width="1.5"/><path d="M8 22V18C8 16 9 14 12 14C15 14 16 16 16 18V22" stroke="#8B5CF6" stroke-width="1.5" stroke-linecap="round"/><path d="M6 16L3 14" stroke="#8B5CF6" stroke-width="1.5" stroke-linecap="round"/><path d="M18 16L21 14" stroke="#8B5CF6" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-sm text-gray-900">Meditate</span>
              <span class="text-xs font-bold text-emerald4 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Done
              </span>
            </div>
          </div>
        </div>

        <!-- Habit 5: Sleep - pending -->
        <div class="habit-row flex items-center gap-4 bg-white/70 rounded-xl px-4 py-3.5" data-habit="sleep">
          <div class="habit-check" onclick="toggleHabit(this)">
            <svg width="14" height="14" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-sm text-gray-900">Sleep before 11pm</span>
              <span class="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Pending</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Weekly Mini Heatmap + Stats Row -->
    <div class="grid grid-cols-5 gap-5 mb-6">

      <!-- Weekly Mini Heatmap: 7 days x 5 habits -->
      <div class="col-span-3 bg-cardBg backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-emerald-100/60 fade-up fade-up-d2">
        <h3 class="text-sm font-bold text-gray-900 mb-4">This Week</h3>
        <div class="overflow-x-auto">
          <table class="w-full" style="border-spacing:3px;border-collapse:separate">
            <thead>
              <tr>
                <th class="text-left text-xs text-gray-400 font-medium pb-2 pr-3" style="width:90px"></th>
                <th class="text-center text-xs text-gray-400 font-medium pb-2">Mon</th>
                <th class="text-center text-xs text-gray-400 font-medium pb-2">Tue</th>
                <th class="text-center text-xs text-gray-400 font-medium pb-2">Wed</th>
                <th class="text-center text-xs text-gray-400 font-medium pb-2">Thu</th>
                <th class="text-center text-xs text-gray-400 font-medium pb-2">Fri</th>
                <th class="text-center text-xs text-gray-400 font-medium pb-2">Sat</th>
                <th class="text-center text-xs text-gray-400 font-medium pb-2 text-emerald4">Sun</th>
              </tr>
            </thead>
            <tbody id="weeklyHeatmap"></tbody>
          </table>
        </div>
      </div>

      <!-- Stats Column -->
      <div class="col-span-2 grid grid-rows-4 gap-3">
        <div class="stat-card bg-cardBg backdrop-blur-sm rounded-2xl px-5 py-3.5 shadow-sm border border-emerald-100/60 flex items-center gap-3 fade-up fade-up-d2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 4 10 4 14.5C4 18.64 7.58 22 12 22C16.42 22 20 18.64 20 14.5C20 10 12 2 12 2Z" fill="#FCD34D"/><path d="M12 8C12 8 8 12 8 14.75C8 17.1 9.79 19 12 19C14.21 19 16 17.1 16 14.75C16 12 12 8 12 8Z" fill="#FB923C"/></svg>
          </div>
          <div>
            <div class="text-xs text-gray-500">Current Streak</div>
            <div class="text-xl font-bold text-gray-900">24</div>
          </div>
        </div>
        <div class="stat-card bg-cardBg backdrop-blur-sm rounded-2xl px-5 py-3.5 shadow-sm border border-emerald-100/60 flex items-center gap-3 fade-up fade-up-d3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-green-50 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 3L18 9" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 3V15" stroke="#059669" stroke-width="2" stroke-linecap="round"/><path d="M4 21H20" stroke="#059669" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <div>
            <div class="text-xs text-gray-500">Best Streak</div>
            <div class="text-xl font-bold text-gray-900">42</div>
          </div>
        </div>
        <div class="stat-card bg-cardBg backdrop-blur-sm rounded-2xl px-5 py-3.5 shadow-sm border border-emerald-100/60 flex items-center gap-3 fade-up fade-up-d3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-blue-50 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#0EA5E9" stroke-width="2"/><path d="M12 7V12L15 15" stroke="#0EA5E9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div>
            <div class="text-xs text-gray-500">Completion Rate</div>
            <div class="text-xl font-bold text-gray-900">78%</div>
          </div>
        </div>
        <div class="stat-card bg-cardBg backdrop-blur-sm rounded-2xl px-5 py-3.5 shadow-sm border border-emerald-100/60 flex items-center gap-3 fade-up fade-up-d4">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#8B5CF6" stroke-width="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#8B5CF6" stroke-width="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#8B5CF6" stroke-width="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#8B5CF6" stroke-width="1.5"/></svg>
          </div>
          <div>
            <div class="text-xs text-gray-500">Total Logged</div>
            <div class="text-xl font-bold text-gray-900">1,247</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Heatmap Legend -->
    <div class="flex items-center justify-end gap-2 text-xs text-gray-400 fade-up fade-up-d4">
      <span>Less</span>
      <div class="flex gap-1">
        <div class="w-3 h-3 rounded-sm cell-0"></div>
        <div class="w-3 h-3 rounded-sm cell-1"></div>
        <div class="w-3 h-3 rounded-sm cell-2"></div>
        <div class="w-3 h-3 rounded-sm cell-3"></div>
        <div class="w-3 h-3 rounded-sm cell-4"></div>
      </div>
      <span>More</span>
    </div>

  </div>
</div>

<script>
// --- Background Heatmap ---
(function(){
  var grid=document.getElementById('bgHeatmap');
  var levels=['cell-0','cell-1','cell-2','cell-3','cell-4'];
  // 52 weeks x 7 days = 364 cells
  for(var d=0;d<7;d++){
    for(var w=0;w<52;w++){
      var cell=document.createElement('div');
      // Realistic pattern: more activity in recent weeks
      var recency=w/52;
      var lvl;
      if(Math.random()<0.15){lvl=0}
      else if(recency<0.3){lvl=Math.random()>0.5?Math.floor(Math.random()*3):0}
      else if(recency<0.7){lvl=Math.floor(Math.random()*4)+1;if(Math.random()<0.2)lvl=0}
      else{lvl=Math.floor(Math.random()*3)+2;if(Math.random()<0.1)lvl=0}
      cell.className='cell '+levels[lvl];
      grid.appendChild(cell);
    }
  }
})();

// --- Streak Count-up Animation ---
(function(){
  var target=24;
  var el=document.getElementById('streakLarge');
  var duration=1200;
  var start=null;
  function step(ts){
    if(!start)start=ts;
    var progress=Math.min((ts-start)/duration,1);
    var eased=1-Math.pow(1-progress,3); // ease-out cubic
    el.textContent=Math.floor(eased*target);
    if(progress<1)requestAnimationFrame(step);
    else el.textContent=target;
  }
  setTimeout(function(){requestAnimationFrame(step)},300);
})();

// --- Weekly Mini Heatmap ---
(function(){
  var tbody=document.getElementById('weeklyHeatmap');
  var habits=['Water','Exercise','Read','Meditate','Sleep'];
  var icons=[
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L5.5 11C4 13.2 4 15.5 4 16.5C4 20.08 7.58 22 12 22C16.42 22 20 20.08 20 16.5C20 15.5 20 13.2 18.5 11L12 2Z" stroke="#3B82F6" stroke-width="2"/></svg>',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2" stroke="#059669" stroke-width="2"/><path d="M4 17L7 12L10 14L14 10L17 12L20 7" stroke="#059669" stroke-width="2" stroke-linecap="round"/></svg>',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 19.5V4.5C4 3.67 4.67 3 5.5 3H20V21H5.5C4.67 21 4 20.33 4 19.5Z" stroke="#F59E0B" stroke-width="2"/></svg>',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="6" r="2.5" stroke="#8B5CF6" stroke-width="2"/><path d="M8 22V18C8 16 9 14 12 14C15 14 16 16 16 18V22" stroke="#8B5CF6" stroke-width="2"/></svg>',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="#94A3B8" stroke-width="2"/></svg>'
  ];
  // Realistic completion data for each habit x 7 days (Mon-Sun)
  // 0=none, 1=partial, 2=half, 3=mostly, 4=complete
  var data=[
    [4,4,3,4,4,2,1],  // Water
    [4,0,4,4,3,4,0],  // Exercise
    [3,2,4,1,3,2,0],  // Read
    [4,4,4,4,4,3,4],  // Meditate
    [4,3,0,4,4,4,0]   // Sleep
  ];
  var cellColors=['#e5e7eb','#bbf7d0','#6ee7b7','#34d399','#059669'];
  for(var h=0;h<5;h++){
    var tr=document.createElement('tr');
    var tdLabel=document.createElement('td');
    tdLabel.className='text-xs text-gray-600 font-medium pr-3 py-0.5';
    tdLabel.style.width='90px';
    tdLabel.innerHTML='<span class="flex items-center gap-1.5">'+icons[h]+' '+habits[h]+'</span>';
    tr.appendChild(tdLabel);
    for(var d=0;d<7;d++){
      var td=document.createElement('td');
      td.className='text-center py-0.5';
      var cell=document.createElement('div');
      cell.className='mini-cell tooltip-wrap inline-block';
      cell.style.width='28px';
      cell.style.height='18px';
      cell.style.borderRadius='4px';
      cell.style.backgroundColor=cellColors[data[h][d]];
      // Tooltip
      var tt=document.createElement('span');
      tt.className='tooltip-text';
      var dayNames=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      var levelNames=['Skipped','Started','Halfway','Almost','Complete'];
      tt.textContent=habits[h]+' - '+dayNames[d]+': '+levelNames[data[h][d]];
      cell.appendChild(tt);
      td.appendChild(cell);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
})();

// --- Habit Checkbox Toggle ---
function toggleHabit(el){
  el.classList.toggle('done');
  el.classList.add('just-checked');
  setTimeout(function(){el.classList.remove('just-checked')},300);
  // Update counter
  var doneCount=document.querySelectorAll('.habit-check.done').length;
  var total=document.querySelectorAll('.habit-check').length;
  var badge=document.querySelector('[class*="text-emerald4"][class*="bg-emerald-50"]');
  if(badge)badge.textContent=doneCount+'/'+total+' done';
}
</script>
</body>
</html>$HTML$,
  3
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
