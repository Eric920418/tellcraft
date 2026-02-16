INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '73695743-629f-4c08-872b-9c4a2d25c2a5',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>家庭預算 BudgetWise</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{primary:'#2563eb',primaryLight:'#60a5fa',primaryDark:'#1d4ed8',surface:'#eff6ff',sidebar:'#0f172a',accent:'#f59e0b',success:'#10b981',danger:'#ef4444',rose:'#f43f5e',teal:'#14b8a6'},fontFamily:{sans:['Inter','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#f8fafc;overflow:hidden;height:100vh}
.sidebar-item{transition:all .2s}
.sidebar-item:hover,.sidebar-item.active{background:rgba(255,255,255,.1);border-radius:8px}
.budget-bar{height:8px;border-radius:99px;background:#e2e8f0;overflow:hidden}
.budget-fill{height:100%;border-radius:99px;transition:width .5s ease}
.goal-card{transition:all .2s}
.goal-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08)}
.fade-in{animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#93c5fd;border-radius:99px}
</style>
</head>
<body>
<div class="flex h-screen">
  <aside class="w-56 bg-sidebar text-white flex flex-col flex-shrink-0">
    <div class="p-4 flex items-center gap-2.5 border-b border-white/10">
      <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
      </div>
      <span class="font-bold text-base">BudgetWise</span>
    </div>
    <nav class="flex-1 p-3 space-y-1">
      <div onclick="switchPage('overview')" class="sidebar-item active flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="overview">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>總覽</span>
      </div>
      <div onclick="switchPage('budgets')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="budgets">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span>預算分配</span>
      </div>
      <div onclick="switchPage('goals')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="goals">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        <span>儲蓄目標</span>
      </div>
      <div onclick="switchPage('trends')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="trends">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        <span>趨勢分析</span>
      </div>
    </nav>
    <div class="p-3 border-t border-white/10">
      <div class="bg-white/5 rounded-xl p-3">
        <div class="flex justify-between text-xs mb-1"><span class="text-white/60">本月預算使用</span><span class="text-white font-bold">68%</span></div>
        <div class="budget-bar"><div class="budget-fill bg-primaryLight" style="width:68%"></div></div>
        <div class="text-xs text-white/40 mt-1">剩餘 $19,200</div>
      </div>
    </div>
  </aside>

  <main class="flex-1 flex flex-col overflow-hidden">
    <header class="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <div class="flex items-center gap-3">
        <h1 class="font-semibold text-gray-900" id="pageTitle">總覽</h1>
        <span class="text-sm text-gray-400">2026 年 2 月</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">◀ 1月</button>
        <button class="text-sm text-primary font-medium px-3 py-1.5 rounded-lg bg-primary/5">2月</button>
        <button class="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">3月 ▶</button>
      </div>
    </header>

    <!-- Overview -->
    <div id="page-overview" class="flex-1 overflow-auto p-6 fade-in">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">月收入</div>
          <div class="text-2xl font-bold text-primary">$60,000</div>
          <div class="text-xs text-gray-400 mt-1">薪資 + 副業</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">月支出</div>
          <div class="text-2xl font-bold text-danger">$40,800</div>
          <div class="text-xs text-danger mt-1">佔收入 68%</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">本月結餘</div>
          <div class="text-2xl font-bold text-success">$19,200</div>
          <div class="text-xs text-success mt-1">↑ 比上月多 $2,100</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">儲蓄率</div>
          <div class="text-2xl font-bold text-teal">32%</div>
          <div class="text-xs text-success mt-1">目標 30% ✓</div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <!-- Spending by category -->
        <div class="col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
          <h3 class="font-semibold text-gray-900 mb-4">支出分類</h3>
          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="text-gray-600">🏠 房租/房貸</span><div><span class="font-bold">$15,000</span><span class="text-xs text-gray-400 ml-1">/ $15,000</span></div></div>
              <div class="budget-bar"><div class="budget-fill bg-primary" style="width:100%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="text-gray-600">🍽️ 餐飲</span><div><span class="font-bold">$7,200</span><span class="text-xs text-gray-400 ml-1">/ $8,000</span></div></div>
              <div class="budget-bar"><div class="budget-fill bg-accent" style="width:90%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="text-gray-600">🚗 交通</span><div><span class="font-bold">$3,500</span><span class="text-xs text-gray-400 ml-1">/ $4,000</span></div></div>
              <div class="budget-bar"><div class="budget-fill bg-teal" style="width:88%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="text-gray-600">🛒 日用品</span><div><span class="font-bold text-danger">$5,800</span><span class="text-xs text-gray-400 ml-1">/ $5,000</span><span class="text-xs text-danger ml-1">超支!</span></div></div>
              <div class="budget-bar"><div class="budget-fill bg-danger" style="width:100%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="text-gray-600">🎮 娛樂</span><div><span class="font-bold">$4,300</span><span class="text-xs text-gray-400 ml-1">/ $5,000</span></div></div>
              <div class="budget-bar"><div class="budget-fill bg-rose" style="width:86%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="text-gray-600">📚 教育</span><div><span class="font-bold">$2,000</span><span class="text-xs text-gray-400 ml-1">/ $3,000</span></div></div>
              <div class="budget-bar"><div class="budget-fill bg-primaryLight" style="width:67%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="text-gray-600">💊 醫療</span><div><span class="font-bold">$3,000</span><span class="text-xs text-gray-400 ml-1">/ $5,000</span></div></div>
              <div class="budget-bar"><div class="budget-fill bg-success" style="width:60%"></div></div>
            </div>
          </div>
        </div>

        <!-- Donut chart -->
        <div class="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 class="font-semibold text-gray-900 mb-3">支出比例</h3>
          <div class="flex justify-center mb-4">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#e2e8f0" stroke-width="20"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#2563eb" stroke-width="20" stroke-dasharray="138 239" stroke-dashoffset="0" style="transform:rotate(-90deg);transform-origin:center"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#f59e0b" stroke-width="20" stroke-dasharray="66 311" stroke-dashoffset="-138" style="transform:rotate(-90deg);transform-origin:center"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#14b8a6" stroke-width="20" stroke-dasharray="33 344" stroke-dashoffset="-204" style="transform:rotate(-90deg);transform-origin:center"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#ef4444" stroke-width="20" stroke-dasharray="53 324" stroke-dashoffset="-237" style="transform:rotate(-90deg);transform-origin:center"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#f43f5e" stroke-width="20" stroke-dasharray="40 337" stroke-dashoffset="-290" style="transform:rotate(-90deg);transform-origin:center"/>
              <text x="80" y="76" text-anchor="middle" class="text-sm font-bold" fill="#0f172a">$40,800</text>
              <text x="80" y="92" text-anchor="middle" class="text-xs" fill="#94a3b8">總支出</text>
            </svg>
          </div>
          <div class="space-y-1.5 text-xs">
            <div class="flex items-center justify-between"><div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-primary"></div>房租</div><span>37%</span></div>
            <div class="flex items-center justify-between"><div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-accent"></div>餐飲</div><span>18%</span></div>
            <div class="flex items-center justify-between"><div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-teal"></div>交通</div><span>9%</span></div>
            <div class="flex items-center justify-between"><div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-danger"></div>日用品</div><span>14%</span></div>
            <div class="flex items-center justify-between"><div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-rose"></div>娛樂</div><span>11%</span></div>
            <div class="flex items-center justify-between"><div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-gray-300"></div>其他</div><span>11%</span></div>
          </div>
        </div>
      </div>

      <!-- Alerts -->
      <div class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
        <svg class="text-danger flex-shrink-0" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div class="text-sm text-red-700"><span class="font-medium">預算警示：</span>「日用品」已超支 $800（超出 16%），建議本月剩餘天數控制消費。</div>
      </div>
    </div>

    <!-- Budgets -->
    <div id="page-budgets" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">每月預算分配</h3>
          <span class="text-sm text-gray-500">總預算：$60,000</span>
        </div>
        <table class="w-full">
          <thead><tr class="text-xs text-gray-400 border-b border-gray-50"><th class="text-left px-4 py-2.5 font-medium">分類</th><th class="text-right px-4 py-2.5 font-medium">預算</th><th class="text-right px-4 py-2.5 font-medium">已花</th><th class="text-right px-4 py-2.5 font-medium">剩餘</th><th class="px-4 py-2.5 font-medium w-32">進度</th><th class="text-center px-4 py-2.5 font-medium">狀態</th></tr></thead>
          <tbody>
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition"><td class="px-4 py-3 text-sm">🏠 房租/房貸</td><td class="px-4 py-3 text-sm text-right">$15,000</td><td class="px-4 py-3 text-sm text-right font-medium">$15,000</td><td class="px-4 py-3 text-sm text-right text-gray-400">$0</td><td class="px-4 py-3"><div class="budget-bar"><div class="budget-fill bg-primary" style="width:100%"></div></div></td><td class="px-4 py-3 text-center"><span class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">固定</span></td></tr>
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition"><td class="px-4 py-3 text-sm">🍽️ 餐飲</td><td class="px-4 py-3 text-sm text-right">$8,000</td><td class="px-4 py-3 text-sm text-right font-medium">$7,200</td><td class="px-4 py-3 text-sm text-right text-success">$800</td><td class="px-4 py-3"><div class="budget-bar"><div class="budget-fill bg-accent" style="width:90%"></div></div></td><td class="px-4 py-3 text-center"><span class="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">注意</span></td></tr>
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition"><td class="px-4 py-3 text-sm">🚗 交通</td><td class="px-4 py-3 text-sm text-right">$4,000</td><td class="px-4 py-3 text-sm text-right font-medium">$3,500</td><td class="px-4 py-3 text-sm text-right text-success">$500</td><td class="px-4 py-3"><div class="budget-bar"><div class="budget-fill bg-teal" style="width:88%"></div></div></td><td class="px-4 py-3 text-center"><span class="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">正常</span></td></tr>
            <tr class="border-b border-gray-50 hover:bg-red-50/50 transition"><td class="px-4 py-3 text-sm">🛒 日用品</td><td class="px-4 py-3 text-sm text-right">$5,000</td><td class="px-4 py-3 text-sm text-right font-medium text-danger">$5,800</td><td class="px-4 py-3 text-sm text-right text-danger font-medium">-$800</td><td class="px-4 py-3"><div class="budget-bar"><div class="budget-fill bg-danger" style="width:100%"></div></div></td><td class="px-4 py-3 text-center"><span class="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">超支</span></td></tr>
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition"><td class="px-4 py-3 text-sm">🎮 娛樂</td><td class="px-4 py-3 text-sm text-right">$5,000</td><td class="px-4 py-3 text-sm text-right font-medium">$4,300</td><td class="px-4 py-3 text-sm text-right text-success">$700</td><td class="px-4 py-3"><div class="budget-bar"><div class="budget-fill bg-rose" style="width:86%"></div></div></td><td class="px-4 py-3 text-center"><span class="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">正常</span></td></tr>
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition"><td class="px-4 py-3 text-sm">📚 教育</td><td class="px-4 py-3 text-sm text-right">$3,000</td><td class="px-4 py-3 text-sm text-right font-medium">$2,000</td><td class="px-4 py-3 text-sm text-right text-success">$1,000</td><td class="px-4 py-3"><div class="budget-bar"><div class="budget-fill bg-primaryLight" style="width:67%"></div></div></td><td class="px-4 py-3 text-center"><span class="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">正常</span></td></tr>
            <tr class="hover:bg-gray-50 transition"><td class="px-4 py-3 text-sm">💊 醫療/保險</td><td class="px-4 py-3 text-sm text-right">$5,000</td><td class="px-4 py-3 text-sm text-right font-medium">$3,000</td><td class="px-4 py-3 text-sm text-right text-success">$2,000</td><td class="px-4 py-3"><div class="budget-bar"><div class="budget-fill bg-success" style="width:60%"></div></div></td><td class="px-4 py-3 text-center"><span class="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">正常</span></td></tr>
          </tbody>
          <tfoot><tr class="bg-gray-50 font-medium"><td class="px-4 py-3 text-sm">合計</td><td class="px-4 py-3 text-sm text-right">$45,000</td><td class="px-4 py-3 text-sm text-right">$40,800</td><td class="px-4 py-3 text-sm text-right text-success">$4,200</td><td class="px-4 py-3"></td><td class="px-4 py-3"></td></tr></tfoot>
        </table>
      </div>
    </div>

    <!-- Goals -->
    <div id="page-goals" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="grid grid-cols-2 gap-4">
        <div class="goal-card bg-white rounded-2xl p-5 border border-gray-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">✈️</div>
            <div><h4 class="font-semibold text-gray-900">日本旅遊基金</h4><p class="text-xs text-gray-400">目標 2026/07</p></div>
          </div>
          <div class="flex justify-between text-sm mb-2"><span class="text-gray-500">$68,000 / $120,000</span><span class="font-bold text-primary">57%</span></div>
          <div class="budget-bar mb-2"><div class="budget-fill bg-primary" style="width:57%"></div></div>
          <div class="text-xs text-gray-400">每月存 $10,400 可達標</div>
        </div>

        <div class="goal-card bg-white rounded-2xl p-5 border border-gray-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-2xl">🏠</div>
            <div><h4 class="font-semibold text-gray-900">買房頭期款</h4><p class="text-xs text-gray-400">目標 2028/01</p></div>
          </div>
          <div class="flex justify-between text-sm mb-2"><span class="text-gray-500">$320,000 / $2,000,000</span><span class="font-bold text-success">16%</span></div>
          <div class="budget-bar mb-2"><div class="budget-fill bg-success" style="width:16%"></div></div>
          <div class="text-xs text-gray-400">每月存 $72,727 可達標</div>
        </div>

        <div class="goal-card bg-white rounded-2xl p-5 border border-gray-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl">🎓</div>
            <div><h4 class="font-semibold text-gray-900">進修學費</h4><p class="text-xs text-gray-400">目標 2026/09</p></div>
          </div>
          <div class="flex justify-between text-sm mb-2"><span class="text-gray-500">$42,000 / $60,000</span><span class="font-bold text-accent">70%</span></div>
          <div class="budget-bar mb-2"><div class="budget-fill bg-accent" style="width:70%"></div></div>
          <div class="text-xs text-success">進度超前！</div>
        </div>

        <div class="goal-card bg-white rounded-2xl p-5 border border-gray-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl bg-rose/10 flex items-center justify-center text-2xl">🚗</div>
            <div><h4 class="font-semibold text-gray-900">換車基金</h4><p class="text-xs text-gray-400">目標 2027/06</p></div>
          </div>
          <div class="flex justify-between text-sm mb-2"><span class="text-gray-500">$85,000 / $500,000</span><span class="font-bold text-rose">17%</span></div>
          <div class="budget-bar mb-2"><div class="budget-fill bg-rose" style="width:17%"></div></div>
          <div class="text-xs text-gray-400">每月存 $25,938 可達標</div>
        </div>
      </div>
    </div>

    <!-- Trends -->
    <div id="page-trends" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="bg-white rounded-2xl p-5 border border-gray-100 mb-6">
        <h3 class="font-semibold text-gray-900 mb-4">收支趨勢（近 6 個月）</h3>
        <div class="flex items-end gap-4 h-40">
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full flex gap-1 justify-center" style="height:120px">
              <div class="w-5 bg-primary/20 rounded-t self-end" style="height:70%"></div>
              <div class="w-5 bg-danger/20 rounded-t self-end" style="height:55%"></div>
            </div>
            <span class="text-xs text-gray-400">9月</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full flex gap-1 justify-center" style="height:120px">
              <div class="w-5 bg-primary/20 rounded-t self-end" style="height:70%"></div>
              <div class="w-5 bg-danger/20 rounded-t self-end" style="height:60%"></div>
            </div>
            <span class="text-xs text-gray-400">10月</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full flex gap-1 justify-center" style="height:120px">
              <div class="w-5 bg-primary/30 rounded-t self-end" style="height:75%"></div>
              <div class="w-5 bg-danger/30 rounded-t self-end" style="height:65%"></div>
            </div>
            <span class="text-xs text-gray-400">11月</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full flex gap-1 justify-center" style="height:120px">
              <div class="w-5 bg-primary/30 rounded-t self-end" style="height:80%"></div>
              <div class="w-5 bg-danger/30 rounded-t self-end" style="height:70%"></div>
            </div>
            <span class="text-xs text-gray-400">12月</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full flex gap-1 justify-center" style="height:120px">
              <div class="w-5 bg-primary/40 rounded-t self-end" style="height:85%"></div>
              <div class="w-5 bg-danger/40 rounded-t self-end" style="height:65%"></div>
            </div>
            <span class="text-xs text-gray-400">1月</span>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full flex gap-1 justify-center" style="height:120px">
              <div class="w-5 bg-primary rounded-t self-end" style="height:90%"></div>
              <div class="w-5 bg-danger rounded-t self-end" style="height:68%"></div>
            </div>
            <span class="text-xs text-gray-400">2月</span>
          </div>
        </div>
        <div class="flex justify-center gap-6 mt-3">
          <div class="flex items-center gap-1.5 text-xs text-gray-500"><div class="w-3 h-3 rounded bg-primary"></div>收入</div>
          <div class="flex items-center gap-1.5 text-xs text-gray-500"><div class="w-3 h-3 rounded bg-danger"></div>支出</div>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl p-5 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-primary mb-1">$115,200</div>
          <div class="text-sm text-gray-500">半年總儲蓄</div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-success mb-1">31%</div>
          <div class="text-sm text-gray-500">平均儲蓄率</div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-accent mb-1">$19,200</div>
          <div class="text-sm text-gray-500">月均儲蓄額</div>
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
  const titles={overview:'總覽',budgets:'預算分配',goals:'儲蓄目標',trends:'趨勢分析'};
  document.getElementById('pageTitle').textContent=titles[page]||page;
}
</script>
</body>
</html>$HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
