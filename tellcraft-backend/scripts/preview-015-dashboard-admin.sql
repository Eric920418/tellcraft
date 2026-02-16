INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '9aadd1f6-30c9-410b-95fa-510c824251f1',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: { 50:'#eff6ff', 100:'#dbeafe', 500:'#3b82f6', 600:'#2563eb', 700:'#1d4ed8' },
        sidebar: '#1e293b',
        surface: '#f8fafc'
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans TC"', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Inter', 'Noto Sans TC', sans-serif; color: #334155; background: #f1f5f9; }

  .toast {
    position:fixed; bottom:1.5rem; right:1.5rem; background:#2563eb; color:#fff;
    padding:0.75rem 1.25rem; border-radius:10px; font-size:0.85rem; font-weight:500;
    z-index:9999; transform:translateY(120%); opacity:0;
    transition: all 0.3s ease; box-shadow: 0 4px 20px rgba(37,99,235,0.3);
  }
  .toast.show { transform:translateY(0); opacity:1; }

  .sidebar-link { transition: all 0.15s ease; }
  .sidebar-link:hover, .sidebar-link.active { background: rgba(255,255,255,0.1); }
  .sidebar-link.active { border-right: 3px solid #3b82f6; }

  .stat-card { transition: all 0.2s ease; }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }

  .table-row { transition: background 0.15s ease; }
  .table-row:hover { background: #f8fafc; }

  .chart-bar { transition: height 0.8s cubic-bezier(0.22,1,0.36,1); }

  .page { display: none; }
  .page.active { display: block; }

  .badge { font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 500; }

  @media (max-width: 768px) {
    .sidebar-desktop { display: none; }
  }
</style>
</head>
<body>

<div id="toast" class="toast"></div>

<div class="flex h-screen overflow-hidden">
  <!-- Sidebar -->
  <aside class="sidebar-desktop w-64 bg-sidebar flex flex-col shrink-0">
    <div class="px-6 h-16 flex items-center gap-3 border-b border-white/10">
      <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z"/></svg>
      </div>
      <span class="text-white font-semibold text-sm">AdminPanel</span>
    </div>
    <nav class="flex-1 py-4 overflow-y-auto">
      <div class="px-3 mb-2"><span class="text-[10px] text-white/30 uppercase tracking-wider px-3">主要</span></div>
      <a href="#" class="sidebar-link active flex items-center gap-3 px-6 py-2.5 text-white/90 text-sm cursor-pointer" onclick="switchPage('dashboard',this)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
        總覽
      </a>
      <a href="#" class="sidebar-link flex items-center gap-3 px-6 py-2.5 text-white/50 text-sm cursor-pointer" onclick="switchPage('users',this)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
        用戶管理
        <span class="ml-auto bg-primary-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">3</span>
      </a>
      <a href="#" class="sidebar-link flex items-center gap-3 px-6 py-2.5 text-white/50 text-sm cursor-pointer" onclick="switchPage('orders',this)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
        訂單
      </a>
      <a href="#" class="sidebar-link flex items-center gap-3 px-6 py-2.5 text-white/50 text-sm cursor-pointer" onclick="switchPage('products',this)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg>
        商品
      </a>
      <div class="px-3 mt-6 mb-2"><span class="text-[10px] text-white/30 uppercase tracking-wider px-3">系統</span></div>
      <a href="#" class="sidebar-link flex items-center gap-3 px-6 py-2.5 text-white/50 text-sm cursor-pointer" onclick="showToast('開啟系統設定')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        設定
      </a>
    </nav>
    <!-- User -->
    <div class="px-6 py-4 border-t border-white/10 flex items-center gap-3">
      <div class="w-8 h-8 bg-primary-500/30 rounded-full flex items-center justify-center text-primary-500 text-xs font-bold">A</div>
      <div class="flex-1 min-w-0">
        <div class="text-white text-xs font-medium truncate">Admin User</div>
        <div class="text-white/30 text-[10px]">admin@company.com</div>
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Header -->
    <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div class="flex items-center gap-4">
        <button class="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer" onclick="showToast('開啟側邊欄')">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div class="relative">
          <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
          <input type="text" placeholder="搜尋..." class="pl-9 pr-4 py-2 rounded-lg bg-gray-100 border-0 text-sm w-64 focus:ring-2 focus:ring-primary-500/20 outline-none">
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button class="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center relative cursor-pointer" onclick="showToast('3 則新通知')">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>
          <div class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></div>
        </button>
        <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer" onclick="showToast('帳號設定')">A</div>
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1 overflow-y-auto p-6">
      <!-- Dashboard Page -->
      <div id="page-dashboard" class="page active">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-xl font-bold text-gray-900">總覽</h1>
            <p class="text-sm text-gray-500 mt-0.5">歡迎回來，Admin</p>
          </div>
          <div class="flex gap-2">
            <select class="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
              <option>過去 7 天</option>
              <option>過去 30 天</option>
              <option>過去 90 天</option>
            </select>
            <button onclick="showToast('匯出報表 CSV')" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">匯出</button>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-gray-500 font-medium">總營收</span>
              <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center"><svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
            </div>
            <div class="text-2xl font-bold text-gray-900">$128.4K</div>
            <div class="flex items-center gap-1 mt-1"><span class="text-xs text-green-500 font-medium">↑ 12.5%</span><span class="text-xs text-gray-400">vs 上月</span></div>
          </div>
          <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-gray-500 font-medium">訂單數</span>
              <div class="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center"><svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg></div>
            </div>
            <div class="text-2xl font-bold text-gray-900">1,842</div>
            <div class="flex items-center gap-1 mt-1"><span class="text-xs text-green-500 font-medium">↑ 8.2%</span><span class="text-xs text-gray-400">vs 上月</span></div>
          </div>
          <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-gray-500 font-medium">活躍用戶</span>
              <div class="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center"><svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg></div>
            </div>
            <div class="text-2xl font-bold text-gray-900">5,623</div>
            <div class="flex items-center gap-1 mt-1"><span class="text-xs text-red-500 font-medium">↓ 2.1%</span><span class="text-xs text-gray-400">vs 上月</span></div>
          </div>
          <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-gray-500 font-medium">轉換率</span>
              <div class="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center"><svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"/></svg></div>
            </div>
            <div class="text-2xl font-bold text-gray-900">3.24%</div>
            <div class="flex items-center gap-1 mt-1"><span class="text-xs text-green-500 font-medium">↑ 0.3%</span><span class="text-xs text-gray-400">vs 上月</span></div>
          </div>
        </div>

        <!-- Chart + Recent -->
        <div class="grid lg:grid-cols-3 gap-6 mb-6">
          <!-- Chart -->
          <div class="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="font-semibold text-gray-900 text-sm">營收趨勢</h2>
              <div class="flex gap-1">
                <button class="text-xs px-3 py-1 rounded-md bg-primary-50 text-primary-600 font-medium cursor-pointer">月</button>
                <button class="text-xs px-3 py-1 rounded-md text-gray-400 hover:bg-gray-50 cursor-pointer">週</button>
              </div>
            </div>
            <div class="flex items-end gap-3 h-48" id="barChart">
              <!-- Bars generated by JS -->
            </div>
            <div class="flex justify-between mt-3 text-[10px] text-gray-400">
              <span>1月</span><span>2月</span><span>3月</span><span>4月</span><span>5月</span><span>6月</span><span>7月</span><span>8月</span><span>9月</span><span>10月</span><span>11月</span><span>12月</span>
            </div>
          </div>
          <!-- Recent Orders -->
          <div class="bg-white rounded-xl border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 text-sm mb-4">最新訂單</h2>
            <div class="space-y-3">
              <div class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2" onclick="showToast('查看訂單 #1842')">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">王</div>
                <div class="flex-1 min-w-0"><div class="text-sm font-medium text-gray-900 truncate">王小明</div><div class="text-[10px] text-gray-400">#1842 · 剛剛</div></div>
                <span class="text-sm font-semibold text-gray-900">$2,400</span>
              </div>
              <div class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2" onclick="showToast('查看訂單 #1841')">
                <div class="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-600">李</div>
                <div class="flex-1 min-w-0"><div class="text-sm font-medium text-gray-900 truncate">李美玲</div><div class="text-[10px] text-gray-400">#1841 · 5 分鐘前</div></div>
                <span class="text-sm font-semibold text-gray-900">$890</span>
              </div>
              <div class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2" onclick="showToast('查看訂單 #1840')">
                <div class="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-600">張</div>
                <div class="flex-1 min-w-0"><div class="text-sm font-medium text-gray-900 truncate">張志豪</div><div class="text-[10px] text-gray-400">#1840 · 12 分鐘前</div></div>
                <span class="text-sm font-semibold text-gray-900">$5,100</span>
              </div>
              <div class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2" onclick="showToast('查看訂單 #1839')">
                <div class="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-xs font-bold text-rose-600">陳</div>
                <div class="flex-1 min-w-0"><div class="text-sm font-medium text-gray-900 truncate">陳雅琪</div><div class="text-[10px] text-gray-400">#1839 · 28 分鐘前</div></div>
                <span class="text-sm font-semibold text-gray-900">$1,560</span>
              </div>
              <div class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2" onclick="showToast('查看訂單 #1838')">
                <div class="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-xs font-bold text-violet-600">林</div>
                <div class="flex-1 min-w-0"><div class="text-sm font-medium text-gray-900 truncate">林家豪</div><div class="text-[10px] text-gray-400">#1838 · 1 小時前</div></div>
                <span class="text-sm font-semibold text-gray-900">$3,200</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Table -->
        <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div class="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 class="font-semibold text-gray-900 text-sm">近期訂單</h2>
            <button onclick="showToast('查看全部訂單')" class="text-xs text-primary-600 font-medium hover:underline cursor-pointer">查看全部</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead><tr class="border-b border-gray-100">
                <th class="text-left text-xs font-medium text-gray-500 px-5 py-3">訂單編號</th>
                <th class="text-left text-xs font-medium text-gray-500 px-5 py-3">客戶</th>
                <th class="text-left text-xs font-medium text-gray-500 px-5 py-3">金額</th>
                <th class="text-left text-xs font-medium text-gray-500 px-5 py-3">狀態</th>
                <th class="text-left text-xs font-medium text-gray-500 px-5 py-3">日期</th>
                <th class="text-left text-xs font-medium text-gray-500 px-5 py-3"></th>
              </tr></thead>
              <tbody>
                <tr class="table-row border-b border-gray-50 cursor-pointer" onclick="showToast('查看 #ORD-1842')">
                  <td class="px-5 py-3.5 text-sm font-medium text-primary-600">#ORD-1842</td>
                  <td class="px-5 py-3.5 text-sm">王小明</td>
                  <td class="px-5 py-3.5 text-sm font-medium">NT$2,400</td>
                  <td class="px-5 py-3.5"><span class="badge bg-green-100 text-green-700">已完成</span></td>
                  <td class="px-5 py-3.5 text-sm text-gray-500">2026/02/16</td>
                  <td class="px-5 py-3.5"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg></td>
                </tr>
                <tr class="table-row border-b border-gray-50 cursor-pointer" onclick="showToast('查看 #ORD-1841')">
                  <td class="px-5 py-3.5 text-sm font-medium text-primary-600">#ORD-1841</td>
                  <td class="px-5 py-3.5 text-sm">李美玲</td>
                  <td class="px-5 py-3.5 text-sm font-medium">NT$890</td>
                  <td class="px-5 py-3.5"><span class="badge bg-yellow-100 text-yellow-700">處理中</span></td>
                  <td class="px-5 py-3.5 text-sm text-gray-500">2026/02/16</td>
                  <td class="px-5 py-3.5"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg></td>
                </tr>
                <tr class="table-row border-b border-gray-50 cursor-pointer" onclick="showToast('查看 #ORD-1840')">
                  <td class="px-5 py-3.5 text-sm font-medium text-primary-600">#ORD-1840</td>
                  <td class="px-5 py-3.5 text-sm">張志豪</td>
                  <td class="px-5 py-3.5 text-sm font-medium">NT$5,100</td>
                  <td class="px-5 py-3.5"><span class="badge bg-green-100 text-green-700">已完成</span></td>
                  <td class="px-5 py-3.5 text-sm text-gray-500">2026/02/15</td>
                  <td class="px-5 py-3.5"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg></td>
                </tr>
                <tr class="table-row border-b border-gray-50 cursor-pointer" onclick="showToast('查看 #ORD-1839')">
                  <td class="px-5 py-3.5 text-sm font-medium text-primary-600">#ORD-1839</td>
                  <td class="px-5 py-3.5 text-sm">陳雅琪</td>
                  <td class="px-5 py-3.5 text-sm font-medium">NT$1,560</td>
                  <td class="px-5 py-3.5"><span class="badge bg-red-100 text-red-700">已退款</span></td>
                  <td class="px-5 py-3.5 text-sm text-gray-500">2026/02/15</td>
                  <td class="px-5 py-3.5"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg></td>
                </tr>
                <tr class="table-row cursor-pointer" onclick="showToast('查看 #ORD-1838')">
                  <td class="px-5 py-3.5 text-sm font-medium text-primary-600">#ORD-1838</td>
                  <td class="px-5 py-3.5 text-sm">林家豪</td>
                  <td class="px-5 py-3.5 text-sm font-medium">NT$3,200</td>
                  <td class="px-5 py-3.5"><span class="badge bg-blue-100 text-blue-700">出貨中</span></td>
                  <td class="px-5 py-3.5 text-sm text-gray-500">2026/02/14</td>
                  <td class="px-5 py-3.5"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg></td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span class="text-xs text-gray-500">顯示 1-5 筆，共 1,842 筆</span>
            <div class="flex gap-1">
              <button class="w-8 h-8 rounded-lg border border-gray-200 text-xs text-gray-400 flex items-center justify-center cursor-pointer">‹</button>
              <button class="w-8 h-8 rounded-lg bg-primary-600 text-white text-xs flex items-center justify-center cursor-pointer">1</button>
              <button class="w-8 h-8 rounded-lg border border-gray-200 text-xs text-gray-600 flex items-center justify-center hover:bg-gray-50 cursor-pointer" onclick="showToast('切換到第 2 頁')">2</button>
              <button class="w-8 h-8 rounded-lg border border-gray-200 text-xs text-gray-600 flex items-center justify-center hover:bg-gray-50 cursor-pointer" onclick="showToast('切換到第 3 頁')">3</button>
              <button class="w-8 h-8 rounded-lg border border-gray-200 text-xs text-gray-400 flex items-center justify-center cursor-pointer">…</button>
              <button class="w-8 h-8 rounded-lg border border-gray-200 text-xs text-gray-600 flex items-center justify-center hover:bg-gray-50 cursor-pointer" onclick="showToast('切換到下一頁')">›</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Users Page -->
      <div id="page-users" class="page">
        <h1 class="text-xl font-bold text-gray-900 mb-6">用戶管理</h1>
        <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div class="flex items-center justify-between p-5 border-b border-gray-100">
            <input type="text" placeholder="搜尋用戶..." class="px-4 py-2 rounded-lg bg-gray-50 border-0 text-sm w-64 outline-none">
            <button onclick="showToast('新增用戶表單')" class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer">+ 新增用戶</button>
          </div>
          <table class="w-full">
            <thead><tr class="border-b border-gray-100">
              <th class="text-left text-xs font-medium text-gray-500 px-5 py-3">用戶</th>
              <th class="text-left text-xs font-medium text-gray-500 px-5 py-3">角色</th>
              <th class="text-left text-xs font-medium text-gray-500 px-5 py-3">狀態</th>
              <th class="text-left text-xs font-medium text-gray-500 px-5 py-3">註冊日</th>
            </tr></thead>
            <tbody>
              <tr class="table-row border-b border-gray-50 cursor-pointer" onclick="showToast('編輯 admin@company.com')">
                <td class="px-5 py-3.5"><div class="flex items-center gap-3"><div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">A</div><div><div class="text-sm font-medium">Admin User</div><div class="text-xs text-gray-400">admin@company.com</div></div></div></td>
                <td class="px-5 py-3.5"><span class="badge bg-primary-100 text-primary-700">管理員</span></td>
                <td class="px-5 py-3.5"><span class="badge bg-green-100 text-green-700">啟用</span></td>
                <td class="px-5 py-3.5 text-sm text-gray-500">2024/01/15</td>
              </tr>
              <tr class="table-row border-b border-gray-50 cursor-pointer" onclick="showToast('編輯 editor@company.com')">
                <td class="px-5 py-3.5"><div class="flex items-center gap-3"><div class="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-xs font-bold text-violet-600">E</div><div><div class="text-sm font-medium">編輯小姐</div><div class="text-xs text-gray-400">editor@company.com</div></div></div></td>
                <td class="px-5 py-3.5"><span class="badge bg-violet-100 text-violet-700">編輯</span></td>
                <td class="px-5 py-3.5"><span class="badge bg-green-100 text-green-700">啟用</span></td>
                <td class="px-5 py-3.5 text-sm text-gray-500">2024/03/20</td>
              </tr>
              <tr class="table-row cursor-pointer" onclick="showToast('編輯 viewer@company.com')">
                <td class="px-5 py-3.5"><div class="flex items-center gap-3"><div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">V</div><div><div class="text-sm font-medium">檢視者</div><div class="text-xs text-gray-400">viewer@company.com</div></div></div></td>
                <td class="px-5 py-3.5"><span class="badge bg-gray-100 text-gray-700">檢視</span></td>
                <td class="px-5 py-3.5"><span class="badge bg-red-100 text-red-700">停用</span></td>
                <td class="px-5 py-3.5 text-sm text-gray-500">2025/06/10</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Orders Page -->
      <div id="page-orders" class="page">
        <h1 class="text-xl font-bold text-gray-900 mb-2">訂單管理</h1>
        <p class="text-sm text-gray-500 mb-6">點擊側邊欄「總覽」頁面查看訂單表格示例。</p>
      </div>

      <!-- Products Page -->
      <div id="page-products" class="page">
        <h1 class="text-xl font-bold text-gray-900 mb-2">商品管理</h1>
        <p class="text-sm text-gray-500 mb-6">管理你的商品目錄、庫存和定價。</p>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow" onclick="showToast('編輯商品 A')">
            <div class="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-3xl mb-3">📱</div>
            <div class="text-sm font-medium text-gray-900">智慧手機 Pro</div>
            <div class="text-xs text-gray-500 mt-0.5">庫存：42</div>
            <div class="text-sm font-bold text-gray-900 mt-2">NT$29,900</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow" onclick="showToast('編輯商品 B')">
            <div class="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-3xl mb-3">⌚</div>
            <div class="text-sm font-medium text-gray-900">智慧手錶</div>
            <div class="text-xs text-gray-500 mt-0.5">庫存：128</div>
            <div class="text-sm font-bold text-gray-900 mt-2">NT$8,900</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow" onclick="showToast('編輯商品 C')">
            <div class="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-3xl mb-3">🎧</div>
            <div class="text-sm font-medium text-gray-900">降噪耳機</div>
            <div class="text-xs text-gray-500 mt-0.5">庫存：85</div>
            <div class="text-sm font-bold text-gray-900 mt-2">NT$4,500</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow" onclick="showToast('編輯商品 D')">
            <div class="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-3xl mb-3">💻</div>
            <div class="text-sm font-medium text-gray-900">超薄筆電</div>
            <div class="text-xs text-red-500 mt-0.5">庫存：3 ⚠️</div>
            <div class="text-sm font-bold text-gray-900 mt-2">NT$42,000</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</div>

<script>
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// Page switching
function switchPage(page, link) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.sidebar-link').forEach(l => { l.classList.remove('active'); l.classList.add('text-white/50'); l.classList.remove('text-white/90'); });
  link.classList.add('active');
  link.classList.remove('text-white/50');
  link.classList.add('text-white/90');
}

// Bar chart
function initChart() {
  const data = [65,48,72,58,85,92,78,95,88,72,68,0];
  const container = document.getElementById('barChart');
  container.innerHTML = '';
  data.forEach((v, i) => {
    const bar = document.createElement('div');
    bar.className = 'flex-1 rounded-t-md chart-bar cursor-pointer';
    bar.style.height = '0%';
    bar.style.background = i === data.length - 1 ? '#e2e8f0' : (v > 85 ? '#2563eb' : '#93c5fd');
    bar.title = (v || '—') + '%';
    bar.onclick = () => showToast(i < 11 ? `${i+1}月營收 $${Math.floor(v*1.28)}K` : '本月進行中');
    container.appendChild(bar);
    setTimeout(() => { bar.style.height = (v || 5) + '%'; }, 100 + i * 50);
  });
}
initChart();
</script>

</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
