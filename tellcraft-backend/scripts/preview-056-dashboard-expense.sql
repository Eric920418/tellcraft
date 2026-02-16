INSERT INTO template_previews (template_id, html_content, version)
VALUES ('a87430f7-47d1-4ef7-b532-5eb111ac4806', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>記帳小幫手 ExpenseTrack</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{mint:'#10b981',coral:'#f43f5e',sky:'#0ea5e9',purple:'#8b5cf6',amber:'#f59e0b',surface:'#f8fafc',dark:'#0f172a'},fontFamily:{sans:['Inter','sans-serif']}}}}
</script>
<style>
*{font-family:'Inter',sans-serif}
.sidebar-item.active{background:rgba(16,185,129,0.1);color:#10b981;border-right:3px solid #10b981}
</style>
</head>
<body class="bg-surface text-dark">

<div class="flex h-screen">
  <!-- Sidebar -->
  <aside class="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
    <div class="p-5 border-b border-gray-50">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-mint rounded-lg flex items-center justify-center text-white text-sm font-bold">💰</div>
        <span class="font-bold">Expense<span class="text-mint">Track</span></span>
      </div>
    </div>
    <nav class="flex-1 py-4">
      <div class="space-y-1 px-2">
        <button onclick="switchPage('overview')" class="sidebar-item active w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer hover:bg-mint/5 transition-colors text-left" data-page="overview">📊 總覽</button>
        <button onclick="switchPage('records')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-400 hover:bg-mint/5 transition-colors text-left" data-page="records">📝 收支紀錄</button>
        <button onclick="switchPage('budget')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-400 hover:bg-mint/5 transition-colors text-left" data-page="budget">🎯 預算管理</button>
        <button onclick="switchPage('accounts')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-400 hover:bg-mint/5 transition-colors text-left" data-page="accounts">🏦 帳戶</button>
        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-400 hover:bg-mint/5 transition-colors text-left">📈 報表</button>
        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-400 hover:bg-mint/5 transition-colors text-left">⚙️ 設定</button>
      </div>
    </nav>
    <div class="p-4 border-t border-gray-50">
      <div class="bg-mint/5 rounded-lg p-3 text-center">
        <div class="text-xs text-mint font-bold">本月已記 23 筆</div>
        <div class="text-[10px] text-gray-400 mt-0.5">保持記帳好習慣！</div>
      </div>
    </div>
  </aside>

  <main class="flex-1 overflow-y-auto">
    <header class="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 id="pageTitle" class="font-bold text-lg">本月總覽</h1>
        <p class="text-gray-400 text-xs">2026 年 2 月</p>
      </div>
      <div class="flex items-center gap-3">
        <select class="bg-surface border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none cursor-pointer">
          <option>2026 年 2 月</option>
          <option>2026 年 1 月</option>
          <option>2025 年 12 月</option>
        </select>
        <button onclick="document.getElementById('addModal').classList.remove('hidden')" class="bg-mint text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors cursor-pointer">+ 記一筆</button>
      </div>
    </header>

    <!-- Overview -->
    <div id="page-overview" class="p-6">
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="text-gray-400 text-xs mb-1">本月收入</div>
          <div class="text-2xl font-bold text-mint">+$68,500</div>
          <div class="text-[10px] text-gray-300 mt-1">薪資 $55,000 · 投資 $13,500</div>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="text-gray-400 text-xs mb-1">本月支出</div>
          <div class="text-2xl font-bold text-coral">-$42,380</div>
          <div class="text-[10px] text-gray-300 mt-1">較上月 +$3,200</div>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="text-gray-400 text-xs mb-1">本月結餘</div>
          <div class="text-2xl font-bold text-sky">$26,120</div>
          <div class="text-[10px] text-mint mt-1">儲蓄率 38.1% ↑</div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <!-- Expense by Category (Pie chart simulation) -->
        <div class="col-span-1 bg-white rounded-xl p-5 border border-gray-100">
          <h3 class="font-bold text-sm mb-4">支出分類</h3>
          <div class="relative w-36 h-36 mx-auto mb-4">
            <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f43f5e" stroke-width="3" stroke-dasharray="30 70" stroke-dashoffset="0"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0ea5e9" stroke-width="3" stroke-dasharray="22 78" stroke-dashoffset="-30"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" stroke-width="3" stroke-dasharray="18 82" stroke-dashoffset="-52"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-dasharray="15 85" stroke-dashoffset="-70"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" stroke-width="3" stroke-dasharray="15 85" stroke-dashoffset="-85"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-lg font-bold">$42.4k</div>
                <div class="text-[10px] text-gray-400">總支出</div>
              </div>
            </div>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex items-center justify-between"><span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-coral rounded-sm"></span>飲食</span><span class="font-bold">$12,800 (30%)</span></div>
            <div class="flex items-center justify-between"><span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-sky rounded-sm"></span>居住</span><span class="font-bold">$9,200 (22%)</span></div>
            <div class="flex items-center justify-between"><span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-amber rounded-sm"></span>交通</span><span class="font-bold">$7,500 (18%)</span></div>
            <div class="flex items-center justify-between"><span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-purple rounded-sm"></span>娛樂</span><span class="font-bold">$6,380 (15%)</span></div>
            <div class="flex items-center justify-between"><span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-mint rounded-sm"></span>其他</span><span class="font-bold">$6,500 (15%)</span></div>
          </div>
        </div>

        <!-- Daily Trend -->
        <div class="col-span-2 bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-sm">每日支出趨勢</h3>
            <div class="flex gap-4 text-xs text-gray-400">
              <span class="flex items-center gap-1"><span class="w-2 h-2 bg-coral rounded-full"></span>支出</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 bg-mint rounded-full"></span>收入</span>
            </div>
          </div>
          <div class="flex items-end gap-1.5 h-32">
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/20 rounded-t" style="height:45%"></div><span class="text-[8px] text-gray-300">1</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/30 rounded-t" style="height:62%"></div><span class="text-[8px] text-gray-300">2</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/20 rounded-t" style="height:30%"></div><span class="text-[8px] text-gray-300">3</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/25 rounded-t" style="height:55%"></div><span class="text-[8px] text-gray-300">4</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-mint/40 rounded-t" style="height:95%"></div><span class="text-[8px] text-mint font-bold">5</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/20 rounded-t" style="height:38%"></div><span class="text-[8px] text-gray-300">6</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/35 rounded-t" style="height:72%"></div><span class="text-[8px] text-gray-300">7</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/20 rounded-t" style="height:25%"></div><span class="text-[8px] text-gray-300">8</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/25 rounded-t" style="height:48%"></div><span class="text-[8px] text-gray-300">9</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/40 rounded-t" style="height:82%"></div><span class="text-[8px] text-gray-300">10</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/20 rounded-t" style="height:35%"></div><span class="text-[8px] text-gray-300">11</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/25 rounded-t" style="height:42%"></div><span class="text-[8px] text-gray-300">12</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/30 rounded-t" style="height:58%"></div><span class="text-[8px] text-gray-300">13</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/20 rounded-t" style="height:28%"></div><span class="text-[8px] text-gray-300">14</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/25 rounded-t" style="height:52%"></div><span class="text-[8px] text-gray-300">15</span></div>
            <div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full bg-coral/30 rounded-t" style="height:45%"></div><span class="text-[8px] text-coral font-bold">16</span></div>
          </div>
          <!-- Recent transactions below chart -->
          <div class="mt-6 pt-4 border-t border-gray-50">
            <div class="flex items-center justify-between text-xs font-bold text-gray-400 mb-3">
              <span>最近交易</span>
              <button onclick="switchPage('records')" class="text-mint cursor-pointer hover:underline">查看全部 →</button>
            </div>
            <div class="space-y-2">
              <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface transition-colors">
                <div class="w-8 h-8 bg-coral/10 rounded-lg flex items-center justify-center text-sm">🍜</div>
                <div class="flex-1"><div class="text-xs font-bold">晚餐 — 鼎泰豐</div><div class="text-[10px] text-gray-400">今天 19:30 · 飲食</div></div>
                <div class="text-coral text-xs font-bold">-$680</div>
              </div>
              <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface transition-colors">
                <div class="w-8 h-8 bg-sky/10 rounded-lg flex items-center justify-center text-sm">🚇</div>
                <div class="flex-1"><div class="text-xs font-bold">捷運加值</div><div class="text-[10px] text-gray-400">今天 08:15 · 交通</div></div>
                <div class="text-coral text-xs font-bold">-$500</div>
              </div>
              <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface transition-colors">
                <div class="w-8 h-8 bg-mint/10 rounded-lg flex items-center justify-center text-sm">💳</div>
                <div class="flex-1"><div class="text-xs font-bold">發薪日</div><div class="text-[10px] text-gray-400">2/5 · 薪資</div></div>
                <div class="text-mint text-xs font-bold">+$55,000</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Budget Progress -->
      <div class="mt-6 bg-white rounded-xl p-5 border border-gray-100">
        <h3 class="font-bold text-sm mb-4">預算使用進度</h3>
        <div class="grid grid-cols-5 gap-4">
          <div>
            <div class="flex justify-between text-xs mb-1"><span>🍜 飲食</span><span class="font-bold">$12.8k/$15k</span></div>
            <div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-coral rounded-full h-2" style="width:85%"></div></div>
            <div class="text-[10px] text-coral mt-0.5">85% — 注意超支</div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1"><span>🏠 居住</span><span class="font-bold">$9.2k/$10k</span></div>
            <div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-sky rounded-full h-2" style="width:92%"></div></div>
            <div class="text-[10px] text-sky mt-0.5">92%</div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1"><span>🚗 交通</span><span class="font-bold">$7.5k/$8k</span></div>
            <div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-amber rounded-full h-2" style="width:94%"></div></div>
            <div class="text-[10px] text-amber mt-0.5">94% — 快超了！</div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1"><span>🎮 娛樂</span><span class="font-bold">$6.4k/$10k</span></div>
            <div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-purple rounded-full h-2" style="width:64%"></div></div>
            <div class="text-[10px] text-mint mt-0.5">64% — 健康</div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1"><span>📦 其他</span><span class="font-bold">$6.5k/$12k</span></div>
            <div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-mint rounded-full h-2" style="width:54%"></div></div>
            <div class="text-[10px] text-mint mt-0.5">54% — 健康</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Records Page -->
    <div id="page-records" class="p-6 hidden">
      <div class="flex items-center gap-3 mb-6">
        <input type="text" placeholder="搜尋紀錄..." class="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-mint">
        <select class="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none">
          <option>全部分類</option><option>飲食</option><option>居住</option><option>交通</option><option>娛樂</option>
        </select>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div class="p-4 bg-surface text-xs font-bold text-gray-400">2 月 16 日（今天）</div>
        <div class="divide-y divide-gray-50">
          <div class="flex items-center gap-4 px-4 py-3 hover:bg-surface transition-colors">
            <div class="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center text-lg">🍜</div>
            <div class="flex-1"><div class="font-bold text-sm">晚餐 — 鼎泰豐</div><div class="text-[10px] text-gray-400">19:30 · 現金</div></div>
            <div class="text-coral font-bold text-sm">-$680</div>
          </div>
          <div class="flex items-center gap-4 px-4 py-3 hover:bg-surface transition-colors">
            <div class="w-10 h-10 bg-sky/10 rounded-xl flex items-center justify-center text-lg">🚇</div>
            <div class="flex-1"><div class="font-bold text-sm">捷運加值</div><div class="text-[10px] text-gray-400">08:15 · 悠遊卡</div></div>
            <div class="text-coral font-bold text-sm">-$500</div>
          </div>
          <div class="flex items-center gap-4 px-4 py-3 hover:bg-surface transition-colors">
            <div class="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center text-lg">☕</div>
            <div class="flex-1"><div class="font-bold text-sm">早餐 — 路易莎</div><div class="text-[10px] text-gray-400">07:45 · 信用卡</div></div>
            <div class="text-coral font-bold text-sm">-$185</div>
          </div>
        </div>
        <div class="p-4 bg-surface text-xs font-bold text-gray-400">2 月 15 日（昨天）</div>
        <div class="divide-y divide-gray-50">
          <div class="flex items-center gap-4 px-4 py-3 hover:bg-surface transition-colors">
            <div class="w-10 h-10 bg-purple/10 rounded-xl flex items-center justify-center text-lg">🎬</div>
            <div class="flex-1"><div class="font-bold text-sm">電影票 x2</div><div class="text-[10px] text-gray-400">14:00 · 信用卡</div></div>
            <div class="text-coral font-bold text-sm">-$560</div>
          </div>
          <div class="flex items-center gap-4 px-4 py-3 hover:bg-surface transition-colors">
            <div class="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center text-lg">🛒</div>
            <div class="flex-1"><div class="font-bold text-sm">全聯超市</div><div class="text-[10px] text-gray-400">18:20 · 現金</div></div>
            <div class="text-coral font-bold text-sm">-$892</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Budget Page -->
    <div id="page-budget" class="p-6 hidden">
      <div class="grid grid-cols-2 gap-6">
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold">預算設定</h3>
            <button onclick="showToast('預算已更新 ✅')" class="text-mint text-xs font-bold cursor-pointer hover:underline">儲存變更</button>
          </div>
          <div class="space-y-4">
            <div><label class="text-xs text-gray-400 mb-1 block">🍜 飲食</label><input type="number" value="15000" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-mint"></div>
            <div><label class="text-xs text-gray-400 mb-1 block">🏠 居住</label><input type="number" value="10000" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-mint"></div>
            <div><label class="text-xs text-gray-400 mb-1 block">🚗 交通</label><input type="number" value="8000" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-mint"></div>
            <div><label class="text-xs text-gray-400 mb-1 block">🎮 娛樂</label><input type="number" value="10000" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-mint"></div>
            <div><label class="text-xs text-gray-400 mb-1 block">📦 其他</label><input type="number" value="12000" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-mint"></div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <h3 class="font-bold mb-4">預算警示</h3>
          <div class="space-y-3">
            <div class="p-3 bg-coral/5 border border-coral/20 rounded-lg">
              <div class="flex items-center gap-2 text-coral text-xs font-bold">⚠️ 交通預算即將超支</div>
              <div class="text-[10px] text-gray-500 mt-1">已使用 94%（$7,500/$8,000），剩餘 $500</div>
            </div>
            <div class="p-3 bg-amber/5 border border-amber/20 rounded-lg">
              <div class="flex items-center gap-2 text-amber text-xs font-bold">⚠️ 飲食預算使用偏高</div>
              <div class="text-[10px] text-gray-500 mt-1">已使用 85%（$12,800/$15,000），月底還有 14 天</div>
            </div>
            <div class="p-3 bg-mint/5 border border-mint/20 rounded-lg">
              <div class="flex items-center gap-2 text-mint text-xs font-bold">✅ 娛樂預算控制良好</div>
              <div class="text-[10px] text-gray-500 mt-1">已使用 64%（$6,380/$10,000），比上月同期低 12%</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Accounts Page -->
    <div id="page-accounts" class="p-6 hidden">
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-gradient-to-br from-sky to-blue-600 rounded-xl p-5 text-white">
          <div class="text-xs opacity-80 mb-1">中國信託 活存</div>
          <div class="text-2xl font-bold">$128,500</div>
          <div class="text-xs opacity-60 mt-2">**** 3456</div>
        </div>
        <div class="bg-gradient-to-br from-purple to-indigo-600 rounded-xl p-5 text-white">
          <div class="text-xs opacity-80 mb-1">台新 Richart</div>
          <div class="text-2xl font-bold">$85,200</div>
          <div class="text-xs opacity-60 mt-2">**** 7890</div>
        </div>
        <div class="bg-gradient-to-br from-mint to-emerald-600 rounded-xl p-5 text-white">
          <div class="text-xs opacity-80 mb-1">現金</div>
          <div class="text-2xl font-bold">$3,800</div>
          <div class="text-xs opacity-60 mt-2">錢包</div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 border border-gray-100">
        <h3 class="font-bold text-sm mb-4">總資產</h3>
        <div class="text-3xl font-bold text-dark">$217,500</div>
        <div class="text-mint text-xs font-bold mt-1">↑ $26,120 本月成長</div>
      </div>
    </div>
  </main>
</div>

<!-- Add Record Modal -->
<div id="addModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="bg-white rounded-2xl p-6 max-w-sm w-full">
    <h3 class="font-bold text-lg mb-4">💰 新增紀錄</h3>
    <div class="flex gap-2 mb-4">
      <button id="typeExpense" onclick="setType('expense')" class="flex-1 py-2 rounded-lg text-sm font-bold bg-coral text-white cursor-pointer">支出</button>
      <button id="typeIncome" onclick="setType('income')" class="flex-1 py-2 rounded-lg text-sm font-bold bg-gray-100 text-gray-400 cursor-pointer">收入</button>
    </div>
    <div class="space-y-3">
      <input type="number" placeholder="金額" class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-center text-2xl font-bold focus:outline-none focus:border-mint">
      <select class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-mint cursor-pointer">
        <option>🍜 飲食</option><option>🏠 居住</option><option>🚗 交通</option><option>🎮 娛樂</option><option>👕 購物</option><option>💊 醫療</option><option>📚 教育</option><option>📦 其他</option>
      </select>
      <input type="text" placeholder="備註（選填）" class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-mint">
      <div class="grid grid-cols-2 gap-3">
        <input type="date" class="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-mint">
        <select class="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-mint cursor-pointer">
          <option>💳 信用卡</option><option>💵 現金</option><option>🏦 銀行轉帳</option><option>🎫 悠遊卡</option>
        </select>
      </div>
      <button onclick="document.getElementById('addModal').classList.add('hidden');showToast('已新增一筆支出紀錄 ✅')" class="w-full bg-mint text-white py-3 rounded-lg font-bold hover:bg-emerald-600 transition-colors cursor-pointer">
        儲存紀錄
      </button>
    </div>
  </div>
</div>

<div id="toast" class="fixed bottom-6 right-6 bg-dark text-white px-6 py-3.5 rounded-xl shadow-2xl z-[60] translate-y-20 opacity-0 transition-all duration-500 text-sm font-medium"></div>

<script>
function switchPage(page){
  document.querySelectorAll('[id^="page-"]').forEach(p=>p.classList.add('hidden'));
  document.getElementById('page-'+page).classList.remove('hidden');
  document.querySelectorAll('.sidebar-item').forEach(i=>{i.classList.remove('active');if(i.dataset.page===page)i.classList.add('active')});
  const titles={overview:'本月總覽',records:'收支紀錄',budget:'預算管理',accounts:'帳戶管理'};
  document.getElementById('pageTitle').textContent=titles[page]||page;
}
function setType(t){
  document.getElementById('typeExpense').className='flex-1 py-2 rounded-lg text-sm font-bold cursor-pointer '+(t==='expense'?'bg-coral text-white':'bg-gray-100 text-gray-400');
  document.getElementById('typeIncome').className='flex-1 py-2 rounded-lg text-sm font-bold cursor-pointer '+(t==='income'?'bg-mint text-white':'bg-gray-100 text-gray-400');
}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3000)}
</script>
</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
