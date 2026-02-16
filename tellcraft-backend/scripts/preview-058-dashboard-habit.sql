INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'e0a27560-1aad-43b6-b52d-05846e127de6',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>習慣打卡 HabitLoop</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{primary:'#8b5cf6',primaryLight:'#a78bfa',primaryDark:'#7c3aed',surface:'#faf5ff',accent:'#f59e0b',success:'#10b981',danger:'#ef4444',sky:'#0ea5e9',rose:'#f43f5e',sidebar:'#1a1025',sideHover:'#2d1b42'},fontFamily:{sans:['Inter','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#faf5ff;overflow:hidden;height:100vh}
.sidebar-item{transition:all .2s}
.sidebar-item:hover,.sidebar-item.active{background:rgba(255,255,255,.1);border-radius:8px}
.habit-card{transition:all .2s}
.habit-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08)}
.streak-fire{animation:flicker 1.5s infinite alternate}
@keyframes flicker{0%{transform:scale(1)}50%{transform:scale(1.1)}100%{transform:scale(1)}}
.heatmap-cell{width:14px;height:14px;border-radius:3px;transition:all .15s}
.heatmap-cell:hover{transform:scale(1.3)}
.check-btn{width:44px;height:44px;border-radius:50%;border:3px solid #d1d5db;cursor:pointer;transition:all .25s;display:flex;align-items:center;justify-content:center}
.check-btn.done{border-color:#10b981;background:#10b981;animation:pop .3s ease}
.check-btn:not(.done):hover{border-color:#8b5cf6;background:#f5f3ff}
@keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
.badge{transition:all .3s}
.badge:hover{transform:scale(1.05)}
.fade-in{animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#d8b4fe;border-radius:99px}
</style>
</head>
<body>
<div class="flex h-screen">
  <!-- Sidebar -->
  <aside class="w-60 bg-sidebar text-white flex flex-col flex-shrink-0">
    <div class="p-5 flex items-center gap-3 border-b border-white/10">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-rose flex items-center justify-center text-lg">🔥</div>
      <span class="font-bold text-lg tracking-tight">HabitLoop</span>
    </div>
    <nav class="flex-1 p-3 space-y-1">
      <div onclick="switchPage('overview')" class="sidebar-item active flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="overview">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>總覽</span>
      </div>
      <div onclick="switchPage('habits')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="habits">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
        <span>習慣打卡</span>
      </div>
      <div onclick="switchPage('heatmap')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="heatmap">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>熱力圖</span>
      </div>
      <div onclick="switchPage('badges')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="badges">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
        <span>成就徽章</span>
      </div>
    </nav>
    <div class="p-3 border-t border-white/10">
      <div class="flex items-center gap-3 px-3 py-2">
        <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold">小</div>
        <div class="text-sm"><div class="font-medium">小美</div><div class="text-xs text-white/50">連續 23 天 🔥</div></div>
      </div>
    </div>
  </aside>

  <main class="flex-1 flex flex-col overflow-hidden">
    <header class="h-14 bg-white border-b border-purple-100 flex items-center justify-between px-6 flex-shrink-0">
      <h1 class="font-semibold text-gray-900" id="pageTitle">總覽</h1>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500">2026 年 2 月 16 日 週日</span>
        <div class="flex items-center gap-1 bg-gradient-to-r from-primary to-rose text-white text-sm font-bold px-3 py-1.5 rounded-full">
          <span class="streak-fire">🔥</span> 23 天連續
        </div>
      </div>
    </header>

    <!-- Page: Overview -->
    <div id="page-overview" class="flex-1 overflow-auto p-6 fade-in">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-2xl p-4 border border-purple-100">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><svg width="16" height="16" fill="none" stroke="#8b5cf6" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg></div>
            <span class="text-xs text-gray-500">今日完成</span>
          </div>
          <div class="text-2xl font-bold text-gray-900">4<span class="text-sm font-normal text-gray-400">/7</span></div>
          <div class="w-full bg-gray-100 rounded-full h-1.5 mt-2"><div class="bg-primary rounded-full h-1.5" style="width:57%"></div></div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-purple-100">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-rose/10 flex items-center justify-center text-lg">🔥</div>
            <span class="text-xs text-gray-500">最長連續</span>
          </div>
          <div class="text-2xl font-bold text-gray-900">23<span class="text-sm font-normal text-gray-400">天</span></div>
          <div class="text-xs text-success mt-2">↑ 目前紀錄中</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-purple-100">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center"><svg width="16" height="16" fill="none" stroke="#10b981" stroke-width="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg></div>
            <span class="text-xs text-gray-500">本月完成率</span>
          </div>
          <div class="text-2xl font-bold text-gray-900">87<span class="text-sm font-normal text-gray-400">%</span></div>
          <div class="text-xs text-success mt-2">↑ 比上月 +5%</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-purple-100">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center"><svg width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg></div>
            <span class="text-xs text-gray-500">已獲徽章</span>
          </div>
          <div class="text-2xl font-bold text-gray-900">12</div>
          <div class="text-xs text-accent mt-2">差 1 個解鎖新成就</div>
        </div>
      </div>

      <!-- Quick Check-in -->
      <div class="bg-white rounded-2xl p-5 border border-purple-100 mb-6">
        <h3 class="font-semibold text-gray-900 mb-4">快速打卡</h3>
        <div class="grid grid-cols-7 gap-3">
          <div class="flex flex-col items-center gap-2">
            <div class="check-btn done" onclick="this.classList.toggle('done')"><svg width="20" height="20" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <span class="text-xs font-medium text-gray-600">冥想</span>
            <span class="text-xs text-success">✓</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="check-btn done" onclick="this.classList.toggle('done')"><svg width="20" height="20" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <span class="text-xs font-medium text-gray-600">運動</span>
            <span class="text-xs text-success">✓</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="check-btn done" onclick="this.classList.toggle('done')"><svg width="20" height="20" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <span class="text-xs font-medium text-gray-600">閱讀</span>
            <span class="text-xs text-success">✓</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="check-btn done" onclick="this.classList.toggle('done')"><svg width="20" height="20" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <span class="text-xs font-medium text-gray-600">喝水</span>
            <span class="text-xs text-success">✓</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="check-btn" onclick="this.classList.toggle('done')"><svg width="20" height="20" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <span class="text-xs font-medium text-gray-600">寫日記</span>
            <span class="text-xs text-gray-300">-</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="check-btn" onclick="this.classList.toggle('done')"><svg width="20" height="20" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <span class="text-xs font-medium text-gray-600">早睡</span>
            <span class="text-xs text-gray-300">-</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="check-btn" onclick="this.classList.toggle('done')"><svg width="20" height="20" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <span class="text-xs font-medium text-gray-600">學英文</span>
            <span class="text-xs text-gray-300">-</span>
          </div>
        </div>
      </div>

      <!-- Weekly mini chart -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white rounded-2xl p-5 border border-purple-100">
          <h3 class="font-semibold text-gray-900 mb-3">本週趨勢</h3>
          <div class="flex items-end gap-2 h-28">
            <div class="flex-1 flex flex-col items-center"><div class="w-full rounded-t bg-primary" style="height:85%"></div><span class="text-xs text-gray-400 mt-1">一</span></div>
            <div class="flex-1 flex flex-col items-center"><div class="w-full rounded-t bg-primary" style="height:100%"></div><span class="text-xs text-gray-400 mt-1">二</span></div>
            <div class="flex-1 flex flex-col items-center"><div class="w-full rounded-t bg-primary" style="height:71%"></div><span class="text-xs text-gray-400 mt-1">三</span></div>
            <div class="flex-1 flex flex-col items-center"><div class="w-full rounded-t bg-primary" style="height:100%"></div><span class="text-xs text-gray-400 mt-1">四</span></div>
            <div class="flex-1 flex flex-col items-center"><div class="w-full rounded-t bg-primary" style="height:85%"></div><span class="text-xs text-gray-400 mt-1">五</span></div>
            <div class="flex-1 flex flex-col items-center"><div class="w-full rounded-t bg-primary/40" style="height:57%"></div><span class="text-xs text-gray-400 mt-1">六</span></div>
            <div class="flex-1 flex flex-col items-center"><div class="w-full rounded-t bg-primary/30" style="height:42%"></div><span class="text-xs text-gray-400 mt-1">日</span></div>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-purple-100">
          <h3 class="font-semibold text-gray-900 mb-3">習慣排行</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3"><span class="text-lg">🧘</span><div class="flex-1"><div class="flex justify-between text-sm mb-1"><span>冥想</span><span class="text-primary font-bold">96%</span></div><div class="w-full bg-gray-100 rounded-full h-1.5"><div class="bg-primary rounded-full h-1.5" style="width:96%"></div></div></div></div>
            <div class="flex items-center gap-3"><span class="text-lg">💧</span><div class="flex-1"><div class="flex justify-between text-sm mb-1"><span>喝水</span><span class="text-sky font-bold">91%</span></div><div class="w-full bg-gray-100 rounded-full h-1.5"><div class="bg-sky rounded-full h-1.5" style="width:91%"></div></div></div></div>
            <div class="flex items-center gap-3"><span class="text-lg">🏃</span><div class="flex-1"><div class="flex justify-between text-sm mb-1"><span>運動</span><span class="text-success font-bold">82%</span></div><div class="w-full bg-gray-100 rounded-full h-1.5"><div class="bg-success rounded-full h-1.5" style="width:82%"></div></div></div></div>
            <div class="flex items-center gap-3"><span class="text-lg">📖</span><div class="flex-1"><div class="flex justify-between text-sm mb-1"><span>閱讀</span><span class="text-accent font-bold">78%</span></div><div class="w-full bg-gray-100 rounded-full h-1.5"><div class="bg-accent rounded-full h-1.5" style="width:78%"></div></div></div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Page: Habits -->
    <div id="page-habits" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="space-y-3">
        <div class="habit-card bg-white rounded-2xl p-5 border border-purple-100 flex items-center gap-4">
          <div class="check-btn done" onclick="this.classList.toggle('done')"><svg width="20" height="20" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">🧘</div>
          <div class="flex-1">
            <div class="font-semibold text-gray-900">每日冥想</div>
            <div class="text-xs text-gray-400 mt-0.5">每天 10 分鐘・連續 23 天</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-primary">🔥 23</div>
            <div class="w-20 bg-gray-100 rounded-full h-1.5 mt-1"><div class="bg-primary rounded-full h-1.5" style="width:96%"></div></div>
          </div>
        </div>

        <div class="habit-card bg-white rounded-2xl p-5 border border-purple-100 flex items-center gap-4">
          <div class="check-btn done" onclick="this.classList.toggle('done')"><svg width="20" height="20" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl">🏃</div>
          <div class="flex-1">
            <div class="font-semibold text-gray-900">運動 30 分鐘</div>
            <div class="text-xs text-gray-400 mt-0.5">跑步 / 瑜珈 / 重訓・連續 15 天</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-success">🔥 15</div>
            <div class="w-20 bg-gray-100 rounded-full h-1.5 mt-1"><div class="bg-success rounded-full h-1.5" style="width:82%"></div></div>
          </div>
        </div>

        <div class="habit-card bg-white rounded-2xl p-5 border border-purple-100 flex items-center gap-4">
          <div class="check-btn done" onclick="this.classList.toggle('done')"><svg width="20" height="20" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">📖</div>
          <div class="flex-1">
            <div class="font-semibold text-gray-900">閱讀 20 頁</div>
            <div class="text-xs text-gray-400 mt-0.5">目前：原子習慣・連續 18 天</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-accent">🔥 18</div>
            <div class="w-20 bg-gray-100 rounded-full h-1.5 mt-1"><div class="bg-accent rounded-full h-1.5" style="width:78%"></div></div>
          </div>
        </div>

        <div class="habit-card bg-white rounded-2xl p-5 border border-purple-100 flex items-center gap-4">
          <div class="check-btn done" onclick="this.classList.toggle('done')"><svg width="20" height="20" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">💧</div>
          <div class="flex-1">
            <div class="font-semibold text-gray-900">喝 2000ml 水</div>
            <div class="text-xs text-gray-400 mt-0.5">目前 1600ml / 2000ml・連續 20 天</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-sky">🔥 20</div>
            <div class="w-20 bg-gray-100 rounded-full h-1.5 mt-1"><div class="bg-sky rounded-full h-1.5" style="width:80%"></div></div>
          </div>
        </div>

        <div class="habit-card bg-white rounded-2xl p-5 border border-purple-100 flex items-center gap-4">
          <div class="check-btn" onclick="this.classList.toggle('done')"><svg width="20" height="20" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-xl">📝</div>
          <div class="flex-1">
            <div class="font-semibold text-gray-900">寫日記</div>
            <div class="text-xs text-gray-400 mt-0.5">感恩日記 3 件事・連續 8 天</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-rose">🔥 8</div>
            <div class="w-20 bg-gray-100 rounded-full h-1.5 mt-1"><div class="bg-rose rounded-full h-1.5" style="width:65%"></div></div>
          </div>
        </div>

        <div class="habit-card bg-white rounded-2xl p-5 border border-purple-100 flex items-center gap-4">
          <div class="check-btn" onclick="this.classList.toggle('done')"><svg width="20" height="20" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xl">😴</div>
          <div class="flex-1">
            <div class="font-semibold text-gray-900">11 點前就寢</div>
            <div class="text-xs text-gray-400 mt-0.5">睡眠品質追蹤・連續 5 天</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-primaryLight">🔥 5</div>
            <div class="w-20 bg-gray-100 rounded-full h-1.5 mt-1"><div class="bg-primaryLight rounded-full h-1.5" style="width:55%"></div></div>
          </div>
        </div>

        <div class="habit-card bg-white rounded-2xl p-5 border border-purple-100 flex items-center gap-4">
          <div class="check-btn" onclick="this.classList.toggle('done')"><svg width="20" height="20" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-xl">🇬🇧</div>
          <div class="flex-1">
            <div class="font-semibold text-gray-900">學英文 15 分鐘</div>
            <div class="text-xs text-gray-400 mt-0.5">Duolingo / 播客・連續 12 天</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-teal-500">🔥 12</div>
            <div class="w-20 bg-gray-100 rounded-full h-1.5 mt-1"><div class="bg-teal-500 rounded-full h-1.5" style="width:72%"></div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Page: Heatmap -->
    <div id="page-heatmap" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="bg-white rounded-2xl p-6 border border-purple-100 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900">2026 年活動熱力圖</h3>
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <span>少</span>
            <div class="flex gap-1">
              <div class="w-3 h-3 rounded bg-gray-100"></div>
              <div class="w-3 h-3 rounded bg-purple-100"></div>
              <div class="w-3 h-3 rounded bg-purple-300"></div>
              <div class="w-3 h-3 rounded bg-purple-500"></div>
              <div class="w-3 h-3 rounded bg-purple-700"></div>
            </div>
            <span>多</span>
          </div>
        </div>
        <div class="flex gap-1 flex-wrap" id="heatmapGrid"></div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl p-5 border border-purple-100 text-center">
          <div class="text-3xl font-bold text-primary mb-1">286</div>
          <div class="text-sm text-gray-500">年度打卡次數</div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-purple-100 text-center">
          <div class="text-3xl font-bold text-success mb-1">23</div>
          <div class="text-sm text-gray-500">最長連續天數</div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-purple-100 text-center">
          <div class="text-3xl font-bold text-accent mb-1">87%</div>
          <div class="text-sm text-gray-500">整體完成率</div>
        </div>
      </div>
    </div>

    <!-- Page: Badges -->
    <div id="page-badges" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="grid grid-cols-4 gap-4">
        <div class="badge bg-white rounded-2xl p-5 border border-purple-100 text-center cursor-pointer">
          <div class="text-4xl mb-2">🌟</div>
          <div class="font-semibold text-sm text-gray-900">初心者</div>
          <div class="text-xs text-gray-400 mt-1">完成第一次打卡</div>
          <div class="text-xs text-success mt-2 font-medium">已獲得</div>
        </div>
        <div class="badge bg-white rounded-2xl p-5 border border-purple-100 text-center cursor-pointer">
          <div class="text-4xl mb-2">🔥</div>
          <div class="font-semibold text-sm text-gray-900">燃燒吧</div>
          <div class="text-xs text-gray-400 mt-1">連續 7 天全部完成</div>
          <div class="text-xs text-success mt-2 font-medium">已獲得</div>
        </div>
        <div class="badge bg-white rounded-2xl p-5 border border-purple-100 text-center cursor-pointer">
          <div class="text-4xl mb-2">💎</div>
          <div class="font-semibold text-sm text-gray-900">鑽石意志</div>
          <div class="text-xs text-gray-400 mt-1">連續 14 天不中斷</div>
          <div class="text-xs text-success mt-2 font-medium">已獲得</div>
        </div>
        <div class="badge bg-white rounded-2xl p-5 border border-purple-100 text-center cursor-pointer">
          <div class="text-4xl mb-2">🏆</div>
          <div class="font-semibold text-sm text-gray-900">冠軍</div>
          <div class="text-xs text-gray-400 mt-1">連續 21 天不中斷</div>
          <div class="text-xs text-success mt-2 font-medium">已獲得</div>
        </div>
        <div class="badge bg-white rounded-2xl p-5 border border-purple-100 text-center cursor-pointer">
          <div class="text-4xl mb-2">📚</div>
          <div class="font-semibold text-sm text-gray-900">書蟲</div>
          <div class="text-xs text-gray-400 mt-1">閱讀習慣滿 30 天</div>
          <div class="text-xs text-primary mt-2 font-medium">進度 60%</div>
        </div>
        <div class="badge bg-white rounded-2xl p-5 border border-purple-100 text-center cursor-pointer">
          <div class="text-4xl mb-2">🏃</div>
          <div class="font-semibold text-sm text-gray-900">運動健將</div>
          <div class="text-xs text-gray-400 mt-1">運動習慣滿 30 天</div>
          <div class="text-xs text-primary mt-2 font-medium">進度 50%</div>
        </div>
        <div class="badge bg-white rounded-2xl p-5 border border-purple-100 text-center cursor-pointer opacity-40">
          <div class="text-4xl mb-2">👑</div>
          <div class="font-semibold text-sm text-gray-900">自律之王</div>
          <div class="text-xs text-gray-400 mt-1">連續 30 天全勤</div>
          <div class="text-xs text-gray-400 mt-2">未解鎖</div>
        </div>
        <div class="badge bg-white rounded-2xl p-5 border border-purple-100 text-center cursor-pointer opacity-40">
          <div class="text-4xl mb-2">🌈</div>
          <div class="font-semibold text-sm text-gray-900">彩虹收集者</div>
          <div class="text-xs text-gray-400 mt-1">同時維持 7 個習慣</div>
          <div class="text-xs text-gray-400 mt-2">未解鎖</div>
        </div>
      </div>
    </div>
  </main>
</div>

<script>
function switchPage(page){
  document.querySelectorAll('[id^="page-"]').forEach(p=>p.classList.add('hidden'));
  document.getElementById('page-'+page).classList.remove('hidden');
  document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
  document.querySelector('[data-page="'+page+'"]').classList.add('active');
  const titles={overview:'總覽',habits:'習慣打卡',heatmap:'熱力圖',badges:'成就徽章'};
  document.getElementById('pageTitle').textContent=titles[page]||page;
}
// Generate heatmap
(function(){
  const grid=document.getElementById('heatmapGrid');
  const levels=['bg-gray-100','bg-purple-100','bg-purple-300','bg-purple-500','bg-purple-700'];
  for(let w=0;w<7;w++){
    for(let d=0;d<47;d++){
      const cell=document.createElement('div');
      const today=w*47+d;
      let lvl=0;
      if(today<47*7*0.6){
        lvl=Math.random()>0.2?Math.floor(Math.random()*4)+1:0;
      }else{
        lvl=Math.random()>0.7?Math.floor(Math.random()*2)+1:0;
      }
      cell.className='heatmap-cell '+levels[lvl];
      cell.title=`第 ${d+1} 週`;
      grid.appendChild(cell);
    }
  }
})();
</script>
</body>
</html>$HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
