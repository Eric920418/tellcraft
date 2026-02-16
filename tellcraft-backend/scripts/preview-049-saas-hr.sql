INSERT INTO template_previews (template_id, html_content, version)
VALUES ('103874be-108b-4286-8e12-14f5e199384e', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PeopleOS — 智慧人資管理平台</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{primary:'#4f46e5',accent:'#f59e0b',success:'#10b981',danger:'#ef4444',surface:'#f8fafc',dark:'#0f172a'},fontFamily:{sans:['Inter','sans-serif']}}}}
</script>
<style>
*{font-family:'Inter',sans-serif}
html{scroll-behavior:smooth}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.6s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.sidebar-item.active{background:rgba(79,70,229,0.1);color:#4f46e5;border-right:3px solid #4f46e5}
.tab-btn.active{color:#4f46e5;border-bottom:2px solid #4f46e5}
</style>
</head>
<body class="bg-surface text-dark overflow-x-hidden">

<!-- Dashboard Layout -->
<div class="flex h-screen">
  <!-- Sidebar -->
  <aside class="w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
    <div class="p-5 border-b border-gray-100">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">P</div>
        <span class="font-bold text-lg">People<span class="text-primary">OS</span></span>
      </div>
    </div>
    <nav class="flex-1 py-4 overflow-y-auto">
      <div class="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">主選單</div>
      <div class="space-y-1 px-2">
        <button onclick="switchPage('dashboard')" class="sidebar-item active w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer hover:bg-primary/5 transition-colors text-left" data-page="dashboard">
          <span>📊</span> 儀表板
        </button>
        <button onclick="switchPage('employees')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-500 hover:bg-primary/5 transition-colors text-left" data-page="employees">
          <span>👥</span> 員工管理
        </button>
        <button onclick="switchPage('attendance')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-500 hover:bg-primary/5 transition-colors text-left" data-page="attendance">
          <span>⏰</span> 出勤管理
        </button>
        <button onclick="switchPage('leave')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-500 hover:bg-primary/5 transition-colors text-left" data-page="leave">
          <span>📋</span> 請假管理
        </button>
        <button onclick="switchPage('payroll')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-500 hover:bg-primary/5 transition-colors text-left" data-page="payroll">
          <span>💰</span> 薪資計算
        </button>
      </div>
      <div class="px-3 mt-6 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">進階功能</div>
      <div class="space-y-1 px-2">
        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-500 hover:bg-primary/5 transition-colors text-left">
          <span>🎯</span> 績效評估
        </button>
        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-500 hover:bg-primary/5 transition-colors text-left">
          <span>📈</span> 報表中心
        </button>
        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-500 hover:bg-primary/5 transition-colors text-left">
          <span>⚙️</span> 系統設定
        </button>
      </div>
    </nav>
    <div class="p-4 border-t border-gray-100">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-sm">👤</div>
        <div>
          <div class="font-bold text-xs">林人資</div>
          <div class="text-[10px] text-gray-400">HR Manager</div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 overflow-y-auto">
    <!-- Top Bar -->
    <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 id="pageTitle" class="font-bold text-lg">儀表板</h1>
        <p class="text-gray-400 text-xs">2026 年 2 月 · 星期一</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative">
          <input type="text" placeholder="搜尋員工..." class="bg-surface border border-gray-200 rounded-lg pl-8 pr-4 py-2 text-sm w-48 focus:outline-none focus:border-primary">
          <span class="absolute left-2.5 top-2.5 text-gray-400 text-sm">🔍</span>
        </div>
        <button class="relative w-9 h-9 bg-surface rounded-lg flex items-center justify-center text-sm hover:bg-gray-200 transition-colors cursor-pointer">
          🔔
          <span class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-danger rounded-full border-2 border-white"></span>
        </button>
      </div>
    </header>

    <!-- Page: Dashboard -->
    <div id="page-dashboard" class="p-6">
      <!-- Stats -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center justify-between mb-3">
            <span class="text-gray-400 text-xs font-medium">總員工數</span>
            <span class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm">👥</span>
          </div>
          <div class="text-2xl font-bold">248</div>
          <div class="text-success text-xs font-medium mt-1">↑ 12 本月新進</div>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center justify-between mb-3">
            <span class="text-gray-400 text-xs font-medium">今日出勤率</span>
            <span class="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center text-sm">✅</span>
          </div>
          <div class="text-2xl font-bold">94.3%</div>
          <div class="text-success text-xs font-medium mt-1">↑ 2.1% vs 上月</div>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center justify-between mb-3">
            <span class="text-gray-400 text-xs font-medium">待審假單</span>
            <span class="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-sm">📋</span>
          </div>
          <div class="text-2xl font-bold text-accent">7</div>
          <div class="text-gray-400 text-xs font-medium mt-1">3 件超過 2 天</div>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center justify-between mb-3">
            <span class="text-gray-400 text-xs font-medium">本月薪資支出</span>
            <span class="w-8 h-8 bg-danger/10 rounded-lg flex items-center justify-center text-sm">💰</span>
          </div>
          <div class="text-2xl font-bold">$8.2M</div>
          <div class="text-danger text-xs font-medium mt-1">↑ 3.5% vs 上月</div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <!-- Chart Area -->
        <div class="col-span-2 bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-sm">月度出勤趨勢</h3>
            <div class="flex gap-2">
              <button class="text-xs px-3 py-1 bg-primary text-white rounded-md cursor-pointer">月</button>
              <button class="text-xs px-3 py-1 bg-surface text-gray-400 rounded-md cursor-pointer hover:bg-gray-200">季</button>
              <button class="text-xs px-3 py-1 bg-surface text-gray-400 rounded-md cursor-pointer hover:bg-gray-200">年</button>
            </div>
          </div>
          <div class="flex items-end gap-3 h-40">
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary/20 rounded-t" style="height:75%"><div class="w-full bg-primary rounded-t h-[92%]"></div></div>
              <span class="text-[10px] text-gray-400">Sep</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary/20 rounded-t" style="height:82%"><div class="w-full bg-primary rounded-t h-[88%]"></div></div>
              <span class="text-[10px] text-gray-400">Oct</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary/20 rounded-t" style="height:70%"><div class="w-full bg-primary rounded-t h-[95%]"></div></div>
              <span class="text-[10px] text-gray-400">Nov</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary/20 rounded-t" style="height:65%"><div class="w-full bg-primary rounded-t h-[85%]"></div></div>
              <span class="text-[10px] text-gray-400">Dec</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary/20 rounded-t" style="height:88%"><div class="w-full bg-primary rounded-t h-[90%]"></div></div>
              <span class="text-[10px] text-gray-400">Jan</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary/20 rounded-t" style="height:90%"><div class="w-full bg-primary rounded-t h-[94%]"></div></div>
              <span class="text-[10px] text-gray-400">Feb</span>
            </div>
          </div>
          <div class="flex gap-6 mt-4 text-xs text-gray-400">
            <div class="flex items-center gap-2"><div class="w-3 h-3 bg-primary rounded-sm"></div>實際出勤</div>
            <div class="flex items-center gap-2"><div class="w-3 h-3 bg-primary/20 rounded-sm"></div>應出勤</div>
          </div>
        </div>

        <!-- Pending Approvals -->
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <h3 class="font-bold text-sm mb-4">待審核 🔔</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3 p-2.5 bg-accent/5 rounded-lg">
              <div class="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-xs">陳</div>
              <div class="flex-1">
                <div class="text-xs font-bold">陳小明</div>
                <div class="text-[10px] text-gray-400">特休 2/18-2/20（3天）</div>
              </div>
              <div class="flex gap-1">
                <button onclick="showToast('已核准陳小明的請假申請 ✅')" class="w-6 h-6 bg-success/10 text-success rounded flex items-center justify-center text-xs cursor-pointer hover:bg-success hover:text-white transition-colors">✓</button>
                <button class="w-6 h-6 bg-danger/10 text-danger rounded flex items-center justify-center text-xs cursor-pointer hover:bg-danger hover:text-white transition-colors">✕</button>
              </div>
            </div>
            <div class="flex items-center gap-3 p-2.5 bg-accent/5 rounded-lg">
              <div class="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs">李</div>
              <div class="flex-1">
                <div class="text-xs font-bold">李美玲</div>
                <div class="text-[10px] text-gray-400">病假 2/17（1天）</div>
              </div>
              <div class="flex gap-1">
                <button onclick="showToast('已核准李美玲的請假申請 ✅')" class="w-6 h-6 bg-success/10 text-success rounded flex items-center justify-center text-xs cursor-pointer hover:bg-success hover:text-white transition-colors">✓</button>
                <button class="w-6 h-6 bg-danger/10 text-danger rounded flex items-center justify-center text-xs cursor-pointer hover:bg-danger hover:text-white transition-colors">✕</button>
              </div>
            </div>
            <div class="flex items-center gap-3 p-2.5 bg-accent/5 rounded-lg">
              <div class="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center text-xs">王</div>
              <div class="flex-1">
                <div class="text-xs font-bold">王大華</div>
                <div class="text-[10px] text-gray-400">加班申請 2/15（4hr）</div>
              </div>
              <div class="flex gap-1">
                <button onclick="showToast('已核准王大華的加班申請 ✅')" class="w-6 h-6 bg-success/10 text-success rounded flex items-center justify-center text-xs cursor-pointer hover:bg-success hover:text-white transition-colors">✓</button>
                <button class="w-6 h-6 bg-danger/10 text-danger rounded flex items-center justify-center text-xs cursor-pointer hover:bg-danger hover:text-white transition-colors">✕</button>
              </div>
            </div>
          </div>
          <button class="w-full mt-4 text-primary text-xs font-bold hover:underline cursor-pointer">查看全部 7 件 →</button>
        </div>
      </div>

      <!-- Department Overview -->
      <div class="mt-6 bg-white rounded-xl p-5 border border-gray-100">
        <h3 class="font-bold text-sm mb-4">部門概覽</h3>
        <div class="grid grid-cols-5 gap-4">
          <div class="text-center p-4 bg-surface rounded-xl">
            <div class="text-2xl mb-2">💻</div>
            <div class="font-bold text-sm">工程部</div>
            <div class="text-gray-400 text-xs">68 人</div>
            <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2"><div class="bg-primary rounded-full h-1.5" style="width:96%"></div></div>
            <div class="text-[10px] text-success mt-1">96% 出勤</div>
          </div>
          <div class="text-center p-4 bg-surface rounded-xl">
            <div class="text-2xl mb-2">📊</div>
            <div class="font-bold text-sm">業務部</div>
            <div class="text-gray-400 text-xs">45 人</div>
            <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2"><div class="bg-success rounded-full h-1.5" style="width:92%"></div></div>
            <div class="text-[10px] text-success mt-1">92% 出勤</div>
          </div>
          <div class="text-center p-4 bg-surface rounded-xl">
            <div class="text-2xl mb-2">🎨</div>
            <div class="font-bold text-sm">設計部</div>
            <div class="text-gray-400 text-xs">32 人</div>
            <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2"><div class="bg-accent rounded-full h-1.5" style="width:88%"></div></div>
            <div class="text-[10px] text-accent mt-1">88% 出勤</div>
          </div>
          <div class="text-center p-4 bg-surface rounded-xl">
            <div class="text-2xl mb-2">📞</div>
            <div class="font-bold text-sm">客服部</div>
            <div class="text-gray-400 text-xs">52 人</div>
            <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2"><div class="bg-primary rounded-full h-1.5" style="width:97%"></div></div>
            <div class="text-[10px] text-success mt-1">97% 出勤</div>
          </div>
          <div class="text-center p-4 bg-surface rounded-xl">
            <div class="text-2xl mb-2">⚙️</div>
            <div class="font-bold text-sm">管理部</div>
            <div class="text-gray-400 text-xs">51 人</div>
            <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2"><div class="bg-success rounded-full h-1.5" style="width:95%"></div></div>
            <div class="text-[10px] text-success mt-1">95% 出勤</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Page: Employees -->
    <div id="page-employees" class="p-6 hidden">
      <div class="flex items-center justify-between mb-6">
        <div class="flex gap-2">
          <button class="tab-btn active px-4 py-2 text-sm font-medium border-b-2 cursor-pointer" onclick="switchTab(this)">全部 (248)</button>
          <button class="tab-btn px-4 py-2 text-sm font-medium text-gray-400 border-b-2 border-transparent cursor-pointer" onclick="switchTab(this)">在職 (234)</button>
          <button class="tab-btn px-4 py-2 text-sm font-medium text-gray-400 border-b-2 border-transparent cursor-pointer" onclick="switchTab(this)">試用期 (14)</button>
        </div>
        <button onclick="showToast('新增員工功能開發中')" class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer">+ 新增員工</button>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left p-4 text-xs font-bold text-gray-400">員工</th>
              <th class="text-left p-4 text-xs font-bold text-gray-400">部門</th>
              <th class="text-left p-4 text-xs font-bold text-gray-400">職稱</th>
              <th class="text-left p-4 text-xs font-bold text-gray-400">到職日</th>
              <th class="text-left p-4 text-xs font-bold text-gray-400">狀態</th>
              <th class="text-left p-4 text-xs font-bold text-gray-400"></th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-50 hover:bg-surface transition-colors">
              <td class="p-4"><div class="flex items-center gap-3"><div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold">張</div><div><div class="font-bold text-sm">張志明</div><div class="text-[10px] text-gray-400">EMP-001</div></div></div></td>
              <td class="p-4 text-sm">工程部</td>
              <td class="p-4 text-sm">資深工程師</td>
              <td class="p-4 text-sm text-gray-400">2021-03-15</td>
              <td class="p-4"><span class="bg-success/10 text-success text-xs font-bold px-2.5 py-1 rounded-full">在職</span></td>
              <td class="p-4"><button class="text-gray-400 hover:text-primary cursor-pointer text-sm">⋯</button></td>
            </tr>
            <tr class="border-b border-gray-50 hover:bg-surface transition-colors">
              <td class="p-4"><div class="flex items-center gap-3"><div class="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-xs font-bold">林</div><div><div class="font-bold text-sm">林雅婷</div><div class="text-[10px] text-gray-400">EMP-045</div></div></div></td>
              <td class="p-4 text-sm">設計部</td>
              <td class="p-4 text-sm">UI 設計師</td>
              <td class="p-4 text-sm text-gray-400">2023-08-01</td>
              <td class="p-4"><span class="bg-success/10 text-success text-xs font-bold px-2.5 py-1 rounded-full">在職</span></td>
              <td class="p-4"><button class="text-gray-400 hover:text-primary cursor-pointer text-sm">⋯</button></td>
            </tr>
            <tr class="border-b border-gray-50 hover:bg-surface transition-colors">
              <td class="p-4"><div class="flex items-center gap-3"><div class="w-8 h-8 bg-danger/10 rounded-full flex items-center justify-center text-xs font-bold">黃</div><div><div class="font-bold text-sm">黃建宏</div><div class="text-[10px] text-gray-400">EMP-102</div></div></div></td>
              <td class="p-4 text-sm">業務部</td>
              <td class="p-4 text-sm">業務經理</td>
              <td class="p-4 text-sm text-gray-400">2020-01-10</td>
              <td class="p-4"><span class="bg-success/10 text-success text-xs font-bold px-2.5 py-1 rounded-full">在職</span></td>
              <td class="p-4"><button class="text-gray-400 hover:text-primary cursor-pointer text-sm">⋯</button></td>
            </tr>
            <tr class="border-b border-gray-50 hover:bg-surface transition-colors">
              <td class="p-4"><div class="flex items-center gap-3"><div class="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center text-xs font-bold">吳</div><div><div class="font-bold text-sm">吳小萍</div><div class="text-[10px] text-gray-400">EMP-241</div></div></div></td>
              <td class="p-4 text-sm">客服部</td>
              <td class="p-4 text-sm">客服專員</td>
              <td class="p-4 text-sm text-gray-400">2025-12-01</td>
              <td class="p-4"><span class="bg-accent/10 text-accent text-xs font-bold px-2.5 py-1 rounded-full">試用期</span></td>
              <td class="p-4"><button class="text-gray-400 hover:text-primary cursor-pointer text-sm">⋯</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Page: Attendance -->
    <div id="page-attendance" class="p-6 hidden">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-bold">今日出勤狀況</h2>
        <div class="flex gap-4 text-sm">
          <div class="flex items-center gap-1.5"><div class="w-3 h-3 bg-success rounded-full"></div><span class="text-gray-500">已到 <strong>234</strong></span></div>
          <div class="flex items-center gap-1.5"><div class="w-3 h-3 bg-accent rounded-full"></div><span class="text-gray-500">遲到 <strong>6</strong></span></div>
          <div class="flex items-center gap-1.5"><div class="w-3 h-3 bg-danger rounded-full"></div><span class="text-gray-500">缺勤 <strong>8</strong></span></div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left p-4 text-xs font-bold text-gray-400">員工</th>
              <th class="text-left p-4 text-xs font-bold text-gray-400">上班打卡</th>
              <th class="text-left p-4 text-xs font-bold text-gray-400">下班打卡</th>
              <th class="text-left p-4 text-xs font-bold text-gray-400">工時</th>
              <th class="text-left p-4 text-xs font-bold text-gray-400">狀態</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-50 hover:bg-surface transition-colors">
              <td class="p-4 text-sm font-medium">張志明</td>
              <td class="p-4 text-sm text-success">08:52</td>
              <td class="p-4 text-sm">18:15</td>
              <td class="p-4 text-sm">9h 23m</td>
              <td class="p-4"><span class="bg-success/10 text-success text-xs font-bold px-2.5 py-1 rounded-full">正常</span></td>
            </tr>
            <tr class="border-b border-gray-50 hover:bg-surface transition-colors">
              <td class="p-4 text-sm font-medium">林雅婷</td>
              <td class="p-4 text-sm text-danger">09:18</td>
              <td class="p-4 text-sm">18:30</td>
              <td class="p-4 text-sm">9h 12m</td>
              <td class="p-4"><span class="bg-accent/10 text-accent text-xs font-bold px-2.5 py-1 rounded-full">遲到</span></td>
            </tr>
            <tr class="border-b border-gray-50 hover:bg-surface transition-colors">
              <td class="p-4 text-sm font-medium">黃建宏</td>
              <td class="p-4 text-sm text-success">08:30</td>
              <td class="p-4 text-sm">—</td>
              <td class="p-4 text-sm text-gray-400">進行中</td>
              <td class="p-4"><span class="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">上班中</span></td>
            </tr>
            <tr class="border-b border-gray-50 hover:bg-surface transition-colors">
              <td class="p-4 text-sm font-medium">陳小明</td>
              <td class="p-4 text-sm text-gray-300">—</td>
              <td class="p-4 text-sm text-gray-300">—</td>
              <td class="p-4 text-sm text-gray-300">—</td>
              <td class="p-4"><span class="bg-blue-50 text-blue-500 text-xs font-bold px-2.5 py-1 rounded-full">請假</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Page: Leave -->
    <div id="page-leave" class="p-6 hidden">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-primary">12</div>
          <div class="text-xs text-gray-400 mt-1">本月請假人次</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-accent">7</div>
          <div class="text-xs text-gray-400 mt-1">待審核</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-success">42</div>
          <div class="text-xs text-gray-400 mt-1">已核准</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-danger">3</div>
          <div class="text-xs text-gray-400 mt-1">已駁回</div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 border border-gray-100">
        <h3 class="font-bold text-sm mb-4">近期假單</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-surface rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold">陳</div>
              <div><div class="text-sm font-bold">陳小明 — 特休</div><div class="text-[10px] text-gray-400">2/18 - 2/20（3天）</div></div>
            </div>
            <span class="bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full">待審核</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-surface rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-xs font-bold">李</div>
              <div><div class="text-sm font-bold">李美玲 — 病假</div><div class="text-[10px] text-gray-400">2/17（1天）</div></div>
            </div>
            <span class="bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full">待審核</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-surface rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold">周</div>
              <div><div class="text-sm font-bold">周杰倫 — 特休</div><div class="text-[10px] text-gray-400">2/10 - 2/14（5天）</div></div>
            </div>
            <span class="bg-success/10 text-success text-xs font-bold px-3 py-1 rounded-full">已核准</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Page: Payroll -->
    <div id="page-payroll" class="p-6 hidden">
      <div class="bg-white rounded-xl p-5 border border-gray-100 mb-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold">2026 年 2 月薪資總覽</h3>
          <button onclick="showToast('薪資報表已匯出 📊')" class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-indigo-700 transition-colors">匯出報表</button>
        </div>
        <div class="grid grid-cols-3 gap-6">
          <div class="bg-surface rounded-xl p-4 text-center">
            <div class="text-sm text-gray-400 mb-1">薪資總額</div>
            <div class="text-xl font-bold">$8,247,500</div>
          </div>
          <div class="bg-surface rounded-xl p-4 text-center">
            <div class="text-sm text-gray-400 mb-1">加班費</div>
            <div class="text-xl font-bold text-accent">$342,800</div>
          </div>
          <div class="bg-surface rounded-xl p-4 text-center">
            <div class="text-sm text-gray-400 mb-1">扣款合計</div>
            <div class="text-xl font-bold text-danger">-$1,856,200</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left p-4 text-xs font-bold text-gray-400">員工</th>
              <th class="text-left p-4 text-xs font-bold text-gray-400">底薪</th>
              <th class="text-left p-4 text-xs font-bold text-gray-400">加班</th>
              <th class="text-left p-4 text-xs font-bold text-gray-400">扣款</th>
              <th class="text-left p-4 text-xs font-bold text-gray-400">實發</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-50">
              <td class="p-4 text-sm font-medium">張志明</td>
              <td class="p-4 text-sm">$65,000</td>
              <td class="p-4 text-sm text-accent">+$4,200</td>
              <td class="p-4 text-sm text-danger">-$12,300</td>
              <td class="p-4 text-sm font-bold">$56,900</td>
            </tr>
            <tr class="border-b border-gray-50">
              <td class="p-4 text-sm font-medium">林雅婷</td>
              <td class="p-4 text-sm">$52,000</td>
              <td class="p-4 text-sm text-accent">+$0</td>
              <td class="p-4 text-sm text-danger">-$9,800</td>
              <td class="p-4 text-sm font-bold">$42,200</td>
            </tr>
            <tr class="border-b border-gray-50">
              <td class="p-4 text-sm font-medium">黃建宏</td>
              <td class="p-4 text-sm">$78,000</td>
              <td class="p-4 text-sm text-accent">+$6,500</td>
              <td class="p-4 text-sm text-danger">-$15,200</td>
              <td class="p-4 text-sm font-bold">$69,300</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 bg-dark text-white px-6 py-3.5 rounded-xl shadow-2xl z-50 translate-y-20 opacity-0 transition-all duration-500 text-sm font-medium"></div>

<script>
function switchPage(page){
  document.querySelectorAll('[id^="page-"]').forEach(p=>p.classList.add('hidden'));
  document.getElementById('page-'+page).classList.remove('hidden');
  document.querySelectorAll('.sidebar-item').forEach(item=>{
    item.classList.remove('active');
    if(item.dataset.page===page)item.classList.add('active');
  });
  const titles={dashboard:'儀表板',employees:'員工管理',attendance:'出勤管理',leave:'請假管理',payroll:'薪資計算'};
  document.getElementById('pageTitle').textContent=titles[page]||page;
}
function switchTab(btn){
  btn.parentElement.querySelectorAll('.tab-btn').forEach(b=>{b.classList.remove('active');b.classList.add('text-gray-400','border-transparent')});
  btn.classList.add('active');btn.classList.remove('text-gray-400','border-transparent');
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
