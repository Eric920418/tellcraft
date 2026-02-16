INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '3bfcabd0-c27f-4730-b01c-663a381a3ab4',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>鍛鍊日誌 FitLog</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { outfit: ['Outfit', 'sans-serif'] },
      colors: {
        fit: { 50:'#f0fdf4', 100:'#dcfce7', 200:'#bbf7d0', 300:'#86efac', 400:'#4ade80', 500:'#22c55e', 600:'#16a34a', 700:'#15803d', 800:'#166534', 900:'#14532d' },
        energy: { 400:'#fb923c', 500:'#f97316' },
        calm: { 400:'#60a5fa', 500:'#3b82f6' }
      }
    }
  }
}
</script>
<style>
* { font-family: 'Outfit', sans-serif; }
body { background: #f8faf9; }
.sidebar-item { transition: all 0.2s; }
.sidebar-item:hover, .sidebar-item.active { background: rgba(34,197,94,0.12); color: #16a34a; }
.ring-progress { transition: stroke-dashoffset 0.8s ease; }
.muscle-tag { transition: all 0.15s; cursor: pointer; }
.muscle-tag:hover { transform: scale(1.05); }
.stat-card { transition: transform 0.2s; }
.stat-card:hover { transform: translateY(-2px); }
</style>
</head>
<body class="min-h-screen flex">

<!-- Sidebar -->
<aside class="w-60 bg-white border-r border-gray-100 flex flex-col min-h-screen">
  <div class="p-5 border-b border-gray-50">
    <div class="flex items-center gap-2">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-fit-400 to-fit-600 flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>
      </div>
      <span class="text-lg font-bold text-gray-800">FitLog</span>
    </div>
  </div>
  <nav class="flex-1 p-3 space-y-1">
    <div class="sidebar-item active flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer" onclick="switchPage('overview')">
      <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      總覽
    </div>
    <div class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('workouts')">
      <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6.5 6.5h11M6.5 17.5h11M3 12h3m12 0h3M9 6.5v11M15 6.5v11"/></svg>
      訓練紀錄
    </div>
    <div class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('body')">
      <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2a4 4 0 100 8 4 4 0 000-8zM12 14c-5 0-8 2-8 4v2h16v-2c0-2-3-4-8-4z"/></svg>
      身體數據
    </div>
    <div class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('plan')">
      <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
      訓練計畫
    </div>
  </nav>
  <div class="p-4 border-t border-gray-50">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-fit-100 flex items-center justify-center text-fit-600 text-sm font-semibold">K</div>
      <div class="text-sm"><div class="font-medium text-gray-700">Kevin</div><div class="text-xs text-gray-400">連續 12 天</div></div>
    </div>
  </div>
</aside>

<!-- Main -->
<main class="flex-1 overflow-auto">
  <!-- Overview Page -->
  <div id="page-overview" class="page p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-800">早安，Kevin 💪</h1>
        <p class="text-sm text-gray-400 mt-0.5">今天是腿部日，準備好了嗎？</p>
      </div>
      <button class="bg-fit-500 hover:bg-fit-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition" onclick="document.getElementById('logModal').classList.remove('hidden')">+ 記錄訓練</button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-4 gap-4">
      <div class="stat-card bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-400">本週訓練</span>
          <div class="w-7 h-7 rounded-lg bg-fit-50 flex items-center justify-center"><svg class="w-3.5 h-3.5 text-fit-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>
        </div>
        <div class="text-2xl font-bold text-gray-800">5<span class="text-sm font-normal text-gray-400 ml-1">次</span></div>
        <div class="text-xs text-fit-500 mt-1">↑ 比上週多 1 次</div>
      </div>
      <div class="stat-card bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-400">消耗熱量</span>
          <div class="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center"><svg class="w-3.5 h-3.5 text-energy-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2c.5 4-3 6-3 10a6 6 0 0012 0c0-4-3.5-6-3-10-2 2-4 2-6 0z"/></svg></div>
        </div>
        <div class="text-2xl font-bold text-gray-800">2,480<span class="text-sm font-normal text-gray-400 ml-1">kcal</span></div>
        <div class="text-xs text-energy-500 mt-1">↑ 12% vs 上週</div>
      </div>
      <div class="stat-card bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-400">訓練時長</span>
          <div class="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><svg class="w-3.5 h-3.5 text-calm-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
        </div>
        <div class="text-2xl font-bold text-gray-800">5.2<span class="text-sm font-normal text-gray-400 ml-1">小時</span></div>
        <div class="text-xs text-calm-500 mt-1">平均 62 分鐘/次</div>
      </div>
      <div class="stat-card bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-400">連續天數</span>
          <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><svg class="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
        </div>
        <div class="text-2xl font-bold text-gray-800">12<span class="text-sm font-normal text-gray-400 ml-1">天</span></div>
        <div class="text-xs text-amber-500 mt-1">🔥 最佳紀錄！</div>
      </div>
    </div>

    <!-- Weekly Chart + Today Plan -->
    <div class="grid grid-cols-3 gap-4">
      <div class="col-span-2 bg-white rounded-xl p-5 border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-700">本週訓練量</h3>
          <div class="flex gap-3 text-xs text-gray-400">
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-fit-400"></span>重訓</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-calm-400"></span>有氧</span>
          </div>
        </div>
        <div class="flex items-end gap-3 h-36">
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full flex flex-col gap-0.5">
              <div class="bg-fit-400 rounded-t" style="height:60px"></div>
              <div class="bg-calm-400 rounded-b" style="height:20px"></div>
            </div>
            <span class="text-xs text-gray-400">一</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full flex flex-col gap-0.5">
              <div class="bg-fit-400 rounded-t" style="height:45px"></div>
              <div class="bg-calm-400 rounded-b" style="height:35px"></div>
            </div>
            <span class="text-xs text-gray-400">二</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full bg-gray-100 rounded" style="height:10px"></div>
            <span class="text-xs text-gray-400">三</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full flex flex-col gap-0.5">
              <div class="bg-fit-400 rounded-t" style="height:70px"></div>
              <div class="bg-calm-400 rounded-b" style="height:15px"></div>
            </div>
            <span class="text-xs text-gray-400">四</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full flex flex-col gap-0.5">
              <div class="bg-fit-400 rounded-t" style="height:55px"></div>
              <div class="bg-calm-400 rounded-b" style="height:30px"></div>
            </div>
            <span class="text-xs text-gray-400">五</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full flex flex-col gap-0.5">
              <div class="bg-fit-400 rounded-t" style="height:80px"></div>
              <div class="bg-calm-400 rounded-b" style="height:25px"></div>
            </div>
            <span class="text-xs text-gray-400">六</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded" style="height:40px"></div>
            <span class="text-xs text-fit-500 font-medium">今</span>
          </div>
        </div>
      </div>

      <!-- Today's Plan -->
      <div class="bg-gradient-to-br from-fit-500 to-fit-700 rounded-xl p-5 text-white">
        <h3 class="text-sm font-semibold opacity-90 mb-3">今日計畫 — 腿部日</h3>
        <div class="space-y-2.5">
          <div class="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
            <span class="w-5 h-5 rounded-full border-2 border-white/50 flex items-center justify-center text-xs">1</span>
            <div class="text-sm">深蹲 4×10</div>
          </div>
          <div class="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
            <span class="w-5 h-5 rounded-full border-2 border-white/50 flex items-center justify-center text-xs">2</span>
            <div class="text-sm">腿推 3×12</div>
          </div>
          <div class="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
            <span class="w-5 h-5 rounded-full border-2 border-white/50 flex items-center justify-center text-xs">3</span>
            <div class="text-sm">硬舉 4×8</div>
          </div>
          <div class="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
            <span class="w-5 h-5 rounded-full border-2 border-white/50 flex items-center justify-center text-xs">4</span>
            <div class="text-sm">弓步蹲 3×10</div>
          </div>
        </div>
        <button class="mt-3 w-full bg-white/20 hover:bg-white/30 rounded-lg py-2 text-sm font-medium transition">開始訓練 →</button>
      </div>
    </div>

    <!-- Recent Workouts -->
    <div class="bg-white rounded-xl border border-gray-100 p-5">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">最近訓練</h3>
      <div class="space-y-2">
        <div class="flex items-center justify-between py-2.5 border-b border-gray-50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-lg">🏋️</div>
            <div><div class="text-sm font-medium text-gray-700">胸部 + 三頭</div><div class="text-xs text-gray-400">昨天 · 58 分鐘</div></div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right"><div class="text-sm font-semibold text-gray-700">6 動作</div><div class="text-xs text-gray-400">總量 8,400 kg</div></div>
            <span class="text-xs bg-fit-50 text-fit-600 px-2 py-0.5 rounded-full">PR ×2</span>
          </div>
        </div>
        <div class="flex items-center justify-between py-2.5 border-b border-gray-50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-lg">🏃</div>
            <div><div class="text-sm font-medium text-gray-700">HIIT 間歇</div><div class="text-xs text-gray-400">前天 · 35 分鐘</div></div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right"><div class="text-sm font-semibold text-gray-700">420 kcal</div><div class="text-xs text-gray-400">平均心率 145</div></div>
            <span class="text-xs bg-energy-500/10 text-energy-500 px-2 py-0.5 rounded-full">高強度</span>
          </div>
        </div>
        <div class="flex items-center justify-between py-2.5">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-lg">💪</div>
            <div><div class="text-sm font-medium text-gray-700">背部 + 二頭</div><div class="text-xs text-gray-400">3 天前 · 65 分鐘</div></div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right"><div class="text-sm font-semibold text-gray-700">7 動作</div><div class="text-xs text-gray-400">總量 7,200 kg</div></div>
            <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">一般</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Workouts Page -->
  <div id="page-workouts" class="page hidden p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-800">訓練紀錄</h1>
      <div class="flex gap-2">
        <button class="px-3 py-1.5 text-xs rounded-lg bg-fit-500 text-white font-medium">全部</button>
        <button class="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition">重訓</button>
        <button class="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition">有氧</button>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-500">日期</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">訓練</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">肌群</th>
            <th class="text-center px-4 py-3 font-medium text-gray-500">時長</th>
            <th class="text-center px-4 py-3 font-medium text-gray-500">總量</th>
            <th class="text-center px-4 py-3 font-medium text-gray-500">表現</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-gray-50 hover:bg-gray-50/50">
            <td class="px-4 py-3 text-gray-600">02/15</td>
            <td class="px-4 py-3 font-medium text-gray-700">胸部 + 三頭</td>
            <td class="px-4 py-3"><span class="muscle-tag inline-block text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full mr-1">胸</span><span class="muscle-tag inline-block text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full">三頭</span></td>
            <td class="px-4 py-3 text-center text-gray-600">58 min</td>
            <td class="px-4 py-3 text-center font-medium text-gray-700">8,400 kg</td>
            <td class="px-4 py-3 text-center"><span class="text-xs bg-fit-50 text-fit-600 px-2 py-0.5 rounded-full">PR ×2</span></td>
          </tr>
          <tr class="border-b border-gray-50 hover:bg-gray-50/50">
            <td class="px-4 py-3 text-gray-600">02/14</td>
            <td class="px-4 py-3 font-medium text-gray-700">HIIT 間歇</td>
            <td class="px-4 py-3"><span class="muscle-tag inline-block text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">全身</span></td>
            <td class="px-4 py-3 text-center text-gray-600">35 min</td>
            <td class="px-4 py-3 text-center font-medium text-gray-700">—</td>
            <td class="px-4 py-3 text-center"><span class="text-xs bg-energy-500/10 text-energy-500 px-2 py-0.5 rounded-full">420 kcal</span></td>
          </tr>
          <tr class="border-b border-gray-50 hover:bg-gray-50/50">
            <td class="px-4 py-3 text-gray-600">02/13</td>
            <td class="px-4 py-3 font-medium text-gray-700">背部 + 二頭</td>
            <td class="px-4 py-3"><span class="muscle-tag inline-block text-xs bg-purple-50 text-purple-500 px-2 py-0.5 rounded-full mr-1">背</span><span class="muscle-tag inline-block text-xs bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full">二頭</span></td>
            <td class="px-4 py-3 text-center text-gray-600">65 min</td>
            <td class="px-4 py-3 text-center font-medium text-gray-700">7,200 kg</td>
            <td class="px-4 py-3 text-center"><span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">一般</span></td>
          </tr>
          <tr class="border-b border-gray-50 hover:bg-gray-50/50">
            <td class="px-4 py-3 text-gray-600">02/12</td>
            <td class="px-4 py-3 font-medium text-gray-700">肩部 + 核心</td>
            <td class="px-4 py-3"><span class="muscle-tag inline-block text-xs bg-teal-50 text-teal-500 px-2 py-0.5 rounded-full mr-1">肩</span><span class="muscle-tag inline-block text-xs bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full">核心</span></td>
            <td class="px-4 py-3 text-center text-gray-600">50 min</td>
            <td class="px-4 py-3 text-center font-medium text-gray-700">5,800 kg</td>
            <td class="px-4 py-3 text-center"><span class="text-xs bg-fit-50 text-fit-600 px-2 py-0.5 rounded-full">PR ×1</span></td>
          </tr>
          <tr class="hover:bg-gray-50/50">
            <td class="px-4 py-3 text-gray-600">02/11</td>
            <td class="px-4 py-3 font-medium text-gray-700">腿部日</td>
            <td class="px-4 py-3"><span class="muscle-tag inline-block text-xs bg-emerald-50 text-emerald-500 px-2 py-0.5 rounded-full mr-1">腿</span><span class="muscle-tag inline-block text-xs bg-lime-50 text-lime-500 px-2 py-0.5 rounded-full">臀</span></td>
            <td class="px-4 py-3 text-center text-gray-600">70 min</td>
            <td class="px-4 py-3 text-center font-medium text-gray-700">12,600 kg</td>
            <td class="px-4 py-3 text-center"><span class="text-xs bg-fit-50 text-fit-600 px-2 py-0.5 rounded-full">PR ×3</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Body Data Page -->
  <div id="page-body" class="page hidden p-6 space-y-6">
    <h1 class="text-xl font-bold text-gray-800">身體數據</h1>
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
        <div class="text-xs text-gray-400 mb-1">體重</div>
        <div class="text-2xl font-bold text-gray-800">72.5<span class="text-sm font-normal text-gray-400 ml-0.5">kg</span></div>
        <div class="text-xs text-fit-500 mt-1">↓ 0.3 本月</div>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
        <div class="text-xs text-gray-400 mb-1">體脂率</div>
        <div class="text-2xl font-bold text-gray-800">18.2<span class="text-sm font-normal text-gray-400 ml-0.5">%</span></div>
        <div class="text-xs text-fit-500 mt-1">↓ 0.5 本月</div>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
        <div class="text-xs text-gray-400 mb-1">骨骼肌</div>
        <div class="text-2xl font-bold text-gray-800">33.8<span class="text-sm font-normal text-gray-400 ml-0.5">kg</span></div>
        <div class="text-xs text-energy-500 mt-1">↑ 0.2 本月</div>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
        <div class="text-xs text-gray-400 mb-1">BMI</div>
        <div class="text-2xl font-bold text-gray-800">23.1</div>
        <div class="text-xs text-fit-500 mt-1">正常範圍</div>
      </div>
    </div>
    <!-- Body Trend Chart -->
    <div class="bg-white rounded-xl p-5 border border-gray-100">
      <h3 class="text-sm font-semibold text-gray-700 mb-4">體重趨勢（近 8 週）</h3>
      <svg viewBox="0 0 600 160" class="w-full">
        <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#22c55e" stop-opacity="0.15"/><stop offset="100%" stop-color="#22c55e" stop-opacity="0"/></linearGradient></defs>
        <path d="M40,120 L110,110 L180,115 L250,105 L320,100 L390,95 L460,88 L530,80" fill="none" stroke="#22c55e" stroke-width="2.5"/>
        <path d="M40,120 L110,110 L180,115 L250,105 L320,100 L390,95 L460,88 L530,80 L530,160 L40,160 Z" fill="url(#wg)"/>
        <circle cx="40" cy="120" r="4" fill="#22c55e"/><circle cx="110" cy="110" r="4" fill="#22c55e"/><circle cx="180" cy="115" r="4" fill="#22c55e"/><circle cx="250" cy="105" r="4" fill="#22c55e"/><circle cx="320" cy="100" r="4" fill="#22c55e"/><circle cx="390" cy="95" r="4" fill="#22c55e"/><circle cx="460" cy="88" r="4" fill="#22c55e"/><circle cx="530" cy="80" r="4" fill="white" stroke="#22c55e" stroke-width="2.5"/>
        <text x="40" y="150" fill="#9ca3af" font-size="11" text-anchor="middle">W1</text><text x="110" y="150" fill="#9ca3af" font-size="11" text-anchor="middle">W2</text><text x="180" y="150" fill="#9ca3af" font-size="11" text-anchor="middle">W3</text><text x="250" y="150" fill="#9ca3af" font-size="11" text-anchor="middle">W4</text><text x="320" y="150" fill="#9ca3af" font-size="11" text-anchor="middle">W5</text><text x="390" y="150" fill="#9ca3af" font-size="11" text-anchor="middle">W6</text><text x="460" y="150" fill="#9ca3af" font-size="11" text-anchor="middle">W7</text><text x="530" y="150" fill="#9ca3af" font-size="11" text-anchor="middle">W8</text>
        <text x="530" y="72" fill="#22c55e" font-size="11" text-anchor="middle" font-weight="600">72.5</text>
        <text x="40" y="135" fill="#9ca3af" font-size="10" text-anchor="middle">74.1</text>
      </svg>
    </div>
  </div>

  <!-- Plan Page -->
  <div id="page-plan" class="page hidden p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-800">訓練計畫</h1>
      <span class="text-sm text-gray-400">增肌減脂 · 4 天/週</span>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white rounded-xl p-5 border border-gray-100">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-sm">🏋️</div>
          <div><div class="text-sm font-semibold text-gray-700">Day 1 — 胸部 + 三頭</div><div class="text-xs text-gray-400">週一</div></div>
        </div>
        <div class="space-y-1.5 text-sm text-gray-600">
          <div class="flex justify-between"><span>臥推</span><span class="text-gray-400">4×8</span></div>
          <div class="flex justify-between"><span>上斜啞鈴飛鳥</span><span class="text-gray-400">3×12</span></div>
          <div class="flex justify-between"><span>繩索夾胸</span><span class="text-gray-400">3×15</span></div>
          <div class="flex justify-between"><span>三頭下壓</span><span class="text-gray-400">3×12</span></div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 border border-gray-100">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-sm">💪</div>
          <div><div class="text-sm font-semibold text-gray-700">Day 2 — 背部 + 二頭</div><div class="text-xs text-gray-400">週二</div></div>
        </div>
        <div class="space-y-1.5 text-sm text-gray-600">
          <div class="flex justify-between"><span>引體向上</span><span class="text-gray-400">4×6</span></div>
          <div class="flex justify-between"><span>槓鈴划船</span><span class="text-gray-400">4×10</span></div>
          <div class="flex justify-between"><span>坐姿划船</span><span class="text-gray-400">3×12</span></div>
          <div class="flex justify-between"><span>啞鈴彎舉</span><span class="text-gray-400">3×12</span></div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 border-2 border-fit-200 bg-fit-50/30">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">🦵</div>
          <div><div class="text-sm font-semibold text-gray-700">Day 3 — 腿部日 <span class="text-xs text-fit-500 ml-1">← 今天</span></div><div class="text-xs text-gray-400">週四</div></div>
        </div>
        <div class="space-y-1.5 text-sm text-gray-600">
          <div class="flex justify-between"><span>深蹲</span><span class="text-gray-400">4×10</span></div>
          <div class="flex justify-between"><span>腿推</span><span class="text-gray-400">3×12</span></div>
          <div class="flex justify-between"><span>硬舉</span><span class="text-gray-400">4×8</span></div>
          <div class="flex justify-between"><span>弓步蹲</span><span class="text-gray-400">3×10</span></div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 border border-gray-100">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-sm">🤸</div>
          <div><div class="text-sm font-semibold text-gray-700">Day 4 — 肩部 + 核心</div><div class="text-xs text-gray-400">週六</div></div>
        </div>
        <div class="space-y-1.5 text-sm text-gray-600">
          <div class="flex justify-between"><span>肩推</span><span class="text-gray-400">4×10</span></div>
          <div class="flex justify-between"><span>側平舉</span><span class="text-gray-400">3×15</span></div>
          <div class="flex justify-between"><span>面拉</span><span class="text-gray-400">3×15</span></div>
          <div class="flex justify-between"><span>捲腹</span><span class="text-gray-400">3×20</span></div>
        </div>
      </div>
    </div>
  </div>
</main>

<!-- Log Modal -->
<div id="logModal" class="hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="bg-white rounded-2xl w-full max-w-md p-6 mx-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-gray-800">記錄訓練</h3>
      <button onclick="document.getElementById('logModal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
    </div>
    <div class="space-y-3">
      <div>
        <label class="text-xs font-medium text-gray-500 mb-1 block">訓練類型</label>
        <select class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fit-300 focus:border-fit-300 outline-none">
          <option>重量訓練</option><option>有氧運動</option><option>HIIT</option><option>瑜珈/伸展</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 mb-1 block">目標肌群</label>
        <div class="flex flex-wrap gap-2">
          <span class="muscle-tag text-xs bg-red-50 text-red-500 px-3 py-1 rounded-full border border-red-100">胸</span>
          <span class="muscle-tag text-xs bg-purple-50 text-purple-500 px-3 py-1 rounded-full border border-purple-100">背</span>
          <span class="muscle-tag text-xs bg-emerald-50 text-emerald-500 px-3 py-1 rounded-full border border-emerald-100">腿</span>
          <span class="muscle-tag text-xs bg-teal-50 text-teal-500 px-3 py-1 rounded-full border border-teal-100">肩</span>
          <span class="muscle-tag text-xs bg-orange-50 text-orange-500 px-3 py-1 rounded-full border border-orange-100">手臂</span>
          <span class="muscle-tag text-xs bg-amber-50 text-amber-500 px-3 py-1 rounded-full border border-amber-100">核心</span>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs font-medium text-gray-500 mb-1 block">時長（分鐘）</label>
          <input type="number" value="60" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fit-300 focus:border-fit-300 outline-none">
        </div>
        <div>
          <label class="text-xs font-medium text-gray-500 mb-1 block">消耗熱量</label>
          <input type="number" value="350" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fit-300 focus:border-fit-300 outline-none">
        </div>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 mb-1 block">備註</label>
        <textarea rows="2" placeholder="今天感覺如何..." class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fit-300 focus:border-fit-300 outline-none resize-none"></textarea>
      </div>
    </div>
    <button class="mt-4 w-full bg-fit-500 hover:bg-fit-600 text-white py-2.5 rounded-lg text-sm font-semibold transition">儲存紀錄</button>
  </div>
</div>

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

// Muscle tag toggle
document.querySelectorAll('#logModal .muscle-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    tag.classList.toggle('ring-2');
    tag.classList.toggle('ring-offset-1');
  });
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
