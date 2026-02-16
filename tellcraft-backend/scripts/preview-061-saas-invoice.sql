INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '75d3ecb0-6024-4279-afff-7ee4d9aadbae',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>快開票 InvoiceSnap</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{primary:'#059669',primaryLight:'#34d399',primaryDark:'#047857',surface:'#f0fdf4',sidebar:'#022c22',accent:'#f59e0b',sky:'#0ea5e9',danger:'#ef4444',rose:'#f43f5e',muted:'#64748b'},fontFamily:{sans:['Inter','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#f8fafc;overflow:hidden;height:100vh}
.sidebar-item{transition:all .2s}
.sidebar-item:hover,.sidebar-item.active{background:rgba(255,255,255,.1);border-radius:8px}
.status-paid{background:#dcfce7;color:#16a34a}
.status-pending{background:#fef3c7;color:#d97706}
.status-overdue{background:#fee2e2;color:#dc2626}
.status-draft{background:#f1f5f9;color:#64748b}
.table-row{transition:all .15s}
.table-row:hover{background:#f0fdf4}
.fade-in{animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.modal-overlay{background:rgba(0,0,0,.4);backdrop-filter:blur(4px)}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#a7f3d0;border-radius:99px}
</style>
</head>
<body>
<div class="flex h-screen">
  <aside class="w-56 bg-sidebar text-white flex flex-col flex-shrink-0">
    <div class="p-4 flex items-center gap-2.5 border-b border-white/10">
      <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </div>
      <span class="font-bold text-base">InvoiceSnap</span>
    </div>
    <nav class="flex-1 p-3 space-y-1">
      <div onclick="switchPage('dashboard')" class="sidebar-item active flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="dashboard">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>儀表板</span>
      </div>
      <div onclick="switchPage('invoices')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="invoices">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>發票管理</span>
        <span class="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">28</span>
      </div>
      <div onclick="switchPage('clients')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="clients">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        <span>客戶</span>
      </div>
      <div onclick="switchPage('revenue')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="revenue">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        <span>營收報表</span>
      </div>
    </nav>
    <div class="p-3 border-t border-white/10">
      <div class="flex items-center gap-3 px-3 py-2">
        <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold">張</div>
        <div class="text-sm"><div class="font-medium">張設計師</div><div class="text-xs text-white/50">自由接案</div></div>
      </div>
    </div>
  </aside>

  <main class="flex-1 flex flex-col overflow-hidden">
    <header class="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <h1 class="font-semibold text-gray-900" id="pageTitle">儀表板</h1>
      <button onclick="openInvoiceModal()" class="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primaryDark transition flex items-center gap-1.5">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新增發票
      </button>
    </header>

    <!-- Dashboard -->
    <div id="page-dashboard" class="flex-1 overflow-auto p-6 fade-in">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">本月營收</div>
          <div class="text-2xl font-bold text-gray-900">$128,500</div>
          <div class="text-xs text-primary mt-1">↑ 12% vs 上月</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">待收款</div>
          <div class="text-2xl font-bold text-accent">$45,200</div>
          <div class="text-xs text-gray-400 mt-1">6 張發票</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">已逾期</div>
          <div class="text-2xl font-bold text-danger">$12,800</div>
          <div class="text-xs text-danger mt-1">2 張需跟進</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">本月開票數</div>
          <div class="text-2xl font-bold text-gray-900">8</div>
          <div class="text-xs text-gray-400 mt-1">平均 $16,063</div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
          <h3 class="font-semibold text-gray-900 mb-4">月營收趨勢</h3>
          <div class="flex items-end gap-2 h-36">
            <div class="flex-1 flex flex-col items-center"><div class="w-full bg-primary/20 rounded-t" style="height:50%"></div><span class="text-xs text-gray-400 mt-1">9月</span></div>
            <div class="flex-1 flex flex-col items-center"><div class="w-full bg-primary/20 rounded-t" style="height:65%"></div><span class="text-xs text-gray-400 mt-1">10月</span></div>
            <div class="flex-1 flex flex-col items-center"><div class="w-full bg-primary/20 rounded-t" style="height:55%"></div><span class="text-xs text-gray-400 mt-1">11月</span></div>
            <div class="flex-1 flex flex-col items-center"><div class="w-full bg-primary/30 rounded-t" style="height:80%"></div><span class="text-xs text-gray-400 mt-1">12月</span></div>
            <div class="flex-1 flex flex-col items-center"><div class="w-full bg-primary/40 rounded-t" style="height:70%"></div><span class="text-xs text-gray-400 mt-1">1月</span></div>
            <div class="flex-1 flex flex-col items-center"><div class="w-full bg-primary rounded-t" style="height:90%"></div><span class="text-xs text-gray-400 mt-1">2月</span></div>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 class="font-semibold text-gray-900 mb-3">狀態分佈</h3>
          <div class="space-y-3">
            <div><div class="flex justify-between text-sm mb-1"><span>已付款</span><span class="font-bold text-primary">18</span></div><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-primary rounded-full h-2" style="width:64%"></div></div></div>
            <div><div class="flex justify-between text-sm mb-1"><span>待付款</span><span class="font-bold text-accent">6</span></div><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-accent rounded-full h-2" style="width:21%"></div></div></div>
            <div><div class="flex justify-between text-sm mb-1"><span>已逾期</span><span class="font-bold text-danger">2</span></div><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-danger rounded-full h-2" style="width:7%"></div></div></div>
            <div><div class="flex justify-between text-sm mb-1"><span>草稿</span><span class="font-bold text-muted">2</span></div><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-gray-400 rounded-full h-2" style="width:7%"></div></div></div>
          </div>
        </div>
      </div>

      <!-- Recent invoices -->
      <div class="bg-white rounded-2xl border border-gray-100">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">最近發票</h3>
          <button class="text-sm text-primary hover:underline">查看全部</button>
        </div>
        <table class="w-full">
          <thead><tr class="text-xs text-gray-400 border-b border-gray-50"><th class="text-left px-4 py-2.5 font-medium">發票編號</th><th class="text-left px-4 py-2.5 font-medium">客戶</th><th class="text-left px-4 py-2.5 font-medium">日期</th><th class="text-right px-4 py-2.5 font-medium">金額</th><th class="text-center px-4 py-2.5 font-medium">狀態</th></tr></thead>
          <tbody>
            <tr class="table-row border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium text-gray-900">#INV-2026-028</td><td class="px-4 py-3 text-sm text-gray-600">數位科技股份有限公司</td><td class="px-4 py-3 text-sm text-gray-400">2/15</td><td class="px-4 py-3 text-sm text-right font-medium">$32,000</td><td class="px-4 py-3 text-center"><span class="status-pending text-xs px-2.5 py-1 rounded-full font-medium">待付款</span></td></tr>
            <tr class="table-row border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium text-gray-900">#INV-2026-027</td><td class="px-4 py-3 text-sm text-gray-600">創意行銷工作室</td><td class="px-4 py-3 text-sm text-gray-400">2/12</td><td class="px-4 py-3 text-sm text-right font-medium">$18,500</td><td class="px-4 py-3 text-center"><span class="status-paid text-xs px-2.5 py-1 rounded-full font-medium">已付款</span></td></tr>
            <tr class="table-row border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium text-gray-900">#INV-2026-026</td><td class="px-4 py-3 text-sm text-gray-600">綠能環保有限公司</td><td class="px-4 py-3 text-sm text-gray-400">2/8</td><td class="px-4 py-3 text-sm text-right font-medium">$25,000</td><td class="px-4 py-3 text-center"><span class="status-paid text-xs px-2.5 py-1 rounded-full font-medium">已付款</span></td></tr>
            <tr class="table-row border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium text-gray-900">#INV-2026-025</td><td class="px-4 py-3 text-sm text-gray-600">美妝品牌 ROSÉ</td><td class="px-4 py-3 text-sm text-gray-400">1/28</td><td class="px-4 py-3 text-sm text-right font-medium">$8,800</td><td class="px-4 py-3 text-center"><span class="status-overdue text-xs px-2.5 py-1 rounded-full font-medium">已逾期</span></td></tr>
            <tr class="table-row"><td class="px-4 py-3 text-sm font-medium text-gray-900">#INV-2026-024</td><td class="px-4 py-3 text-sm text-gray-600">山海旅行社</td><td class="px-4 py-3 text-sm text-gray-400">1/25</td><td class="px-4 py-3 text-sm text-right font-medium">$15,000</td><td class="px-4 py-3 text-center"><span class="status-paid text-xs px-2.5 py-1 rounded-full font-medium">已付款</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invoices -->
    <div id="page-invoices" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="flex items-center gap-2 mb-4">
        <button class="text-sm font-medium px-3 py-1.5 rounded-lg bg-primary text-white">全部 (28)</button>
        <button class="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">已付款 (18)</button>
        <button class="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">待付款 (6)</button>
        <button class="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">已逾期 (2)</button>
        <button class="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">草稿 (2)</button>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100">
        <table class="w-full">
          <thead><tr class="text-xs text-gray-400 border-b border-gray-100"><th class="text-left px-4 py-3 font-medium">發票編號</th><th class="text-left px-4 py-3 font-medium">客戶</th><th class="text-left px-4 py-3 font-medium">開立日期</th><th class="text-left px-4 py-3 font-medium">到期日</th><th class="text-right px-4 py-3 font-medium">金額</th><th class="text-center px-4 py-3 font-medium">狀態</th><th class="text-center px-4 py-3 font-medium">操作</th></tr></thead>
          <tbody>
            <tr class="table-row border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium text-gray-900">#INV-2026-028</td><td class="px-4 py-3 text-sm text-gray-600">數位科技股份有限公司</td><td class="px-4 py-3 text-sm text-gray-400">2/15</td><td class="px-4 py-3 text-sm text-gray-400">3/15</td><td class="px-4 py-3 text-sm text-right font-medium">$32,000</td><td class="px-4 py-3 text-center"><span class="status-pending text-xs px-2.5 py-1 rounded-full font-medium">待付款</span></td><td class="px-4 py-3 text-center"><button class="text-xs text-primary hover:underline">檢視</button></td></tr>
            <tr class="table-row border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium text-gray-900">#INV-2026-027</td><td class="px-4 py-3 text-sm text-gray-600">創意行銷工作室</td><td class="px-4 py-3 text-sm text-gray-400">2/12</td><td class="px-4 py-3 text-sm text-gray-400">3/12</td><td class="px-4 py-3 text-sm text-right font-medium">$18,500</td><td class="px-4 py-3 text-center"><span class="status-paid text-xs px-2.5 py-1 rounded-full font-medium">已付款</span></td><td class="px-4 py-3 text-center"><button class="text-xs text-primary hover:underline">檢視</button></td></tr>
            <tr class="table-row border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium text-gray-900">#INV-2026-026</td><td class="px-4 py-3 text-sm text-gray-600">綠能環保有限公司</td><td class="px-4 py-3 text-sm text-gray-400">2/8</td><td class="px-4 py-3 text-sm text-gray-400">3/8</td><td class="px-4 py-3 text-sm text-right font-medium">$25,000</td><td class="px-4 py-3 text-center"><span class="status-paid text-xs px-2.5 py-1 rounded-full font-medium">已付款</span></td><td class="px-4 py-3 text-center"><button class="text-xs text-primary hover:underline">檢視</button></td></tr>
            <tr class="table-row border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium text-gray-900">#INV-2026-025</td><td class="px-4 py-3 text-sm text-gray-600">美妝品牌 ROSÉ</td><td class="px-4 py-3 text-sm text-gray-400">1/28</td><td class="px-4 py-3 text-sm text-red-500 font-medium">2/12 ⚠️</td><td class="px-4 py-3 text-sm text-right font-medium">$8,800</td><td class="px-4 py-3 text-center"><span class="status-overdue text-xs px-2.5 py-1 rounded-full font-medium">已逾期</span></td><td class="px-4 py-3 text-center"><button class="text-xs text-danger hover:underline">催款</button></td></tr>
            <tr class="table-row border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium text-gray-900">#INV-2026-024</td><td class="px-4 py-3 text-sm text-gray-600">山海旅行社</td><td class="px-4 py-3 text-sm text-gray-400">1/25</td><td class="px-4 py-3 text-sm text-gray-400">2/25</td><td class="px-4 py-3 text-sm text-right font-medium">$15,000</td><td class="px-4 py-3 text-center"><span class="status-paid text-xs px-2.5 py-1 rounded-full font-medium">已付款</span></td><td class="px-4 py-3 text-center"><button class="text-xs text-primary hover:underline">檢視</button></td></tr>
            <tr class="table-row"><td class="px-4 py-3 text-sm font-medium text-gray-400">#INV-2026-029</td><td class="px-4 py-3 text-sm text-gray-400">新專案（未填）</td><td class="px-4 py-3 text-sm text-gray-300">-</td><td class="px-4 py-3 text-sm text-gray-300">-</td><td class="px-4 py-3 text-sm text-right text-gray-400">$0</td><td class="px-4 py-3 text-center"><span class="status-draft text-xs px-2.5 py-1 rounded-full font-medium">草稿</span></td><td class="px-4 py-3 text-center"><button class="text-xs text-primary hover:underline">編輯</button></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Clients -->
    <div id="page-clients" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600">數</div>
            <div><h4 class="font-semibold text-gray-900 text-sm">數位科技股份有限公司</h4><p class="text-xs text-gray-400">5 張發票</p></div>
          </div>
          <div class="flex justify-between text-sm"><span class="text-gray-500">累計營收</span><span class="font-bold text-primary">$185,000</span></div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-600">創</div>
            <div><h4 class="font-semibold text-gray-900 text-sm">創意行銷工作室</h4><p class="text-xs text-gray-400">8 張發票</p></div>
          </div>
          <div class="flex justify-between text-sm"><span class="text-gray-500">累計營收</span><span class="font-bold text-primary">$142,300</span></div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-lg font-bold text-green-600">綠</div>
            <div><h4 class="font-semibold text-gray-900 text-sm">綠能環保有限公司</h4><p class="text-xs text-gray-400">4 張發票</p></div>
          </div>
          <div class="flex justify-between text-sm"><span class="text-gray-500">累計營收</span><span class="font-bold text-primary">$98,000</span></div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-lg font-bold text-rose-600">R</div>
            <div><h4 class="font-semibold text-gray-900 text-sm">美妝品牌 ROSÉ</h4><p class="text-xs text-gray-400">3 張發票</p></div>
          </div>
          <div class="flex justify-between text-sm"><span class="text-gray-500">累計營收</span><span class="font-bold text-primary">$52,800</span></div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg font-bold text-amber-600">山</div>
            <div><h4 class="font-semibold text-gray-900 text-sm">山海旅行社</h4><p class="text-xs text-gray-400">4 張發票</p></div>
          </div>
          <div class="flex justify-between text-sm"><span class="text-gray-500">累計營收</span><span class="font-bold text-primary">$68,500</span></div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer border-dashed flex items-center justify-center">
          <div class="text-center">
            <svg class="mx-auto mb-2 text-gray-300" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span class="text-sm text-gray-400">新增客戶</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Revenue -->
    <div id="page-revenue" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-2xl p-5 border border-gray-100 text-center">
          <div class="text-3xl font-bold text-primary">$856K</div>
          <div class="text-sm text-gray-500 mt-1">年度總營收</div>
          <div class="text-xs text-primary mt-1">↑ 23% YoY</div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 text-center">
          <div class="text-3xl font-bold text-accent">$128.5K</div>
          <div class="text-sm text-gray-500 mt-1">本月營收</div>
          <div class="text-xs text-primary mt-1">↑ 12% MoM</div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 text-center">
          <div class="text-3xl font-bold text-gray-900">$16,063</div>
          <div class="text-sm text-gray-500 mt-1">平均發票金額</div>
          <div class="text-xs text-gray-400 mt-1">基於 28 張發票</div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-gray-100 mb-6">
        <h3 class="font-semibold text-gray-900 mb-4">客戶營收排行</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-3"><span class="text-sm font-medium text-gray-500 w-4">1</span><div class="flex-1"><div class="flex justify-between text-sm mb-1"><span>數位科技股份有限公司</span><span class="font-bold">$185,000</span></div><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-primary rounded-full h-2" style="width:100%"></div></div></div></div>
          <div class="flex items-center gap-3"><span class="text-sm font-medium text-gray-500 w-4">2</span><div class="flex-1"><div class="flex justify-between text-sm mb-1"><span>創意行銷工作室</span><span class="font-bold">$142,300</span></div><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-primary/80 rounded-full h-2" style="width:77%"></div></div></div></div>
          <div class="flex items-center gap-3"><span class="text-sm font-medium text-gray-500 w-4">3</span><div class="flex-1"><div class="flex justify-between text-sm mb-1"><span>綠能環保有限公司</span><span class="font-bold">$98,000</span></div><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-primary/60 rounded-full h-2" style="width:53%"></div></div></div></div>
          <div class="flex items-center gap-3"><span class="text-sm font-medium text-gray-500 w-4">4</span><div class="flex-1"><div class="flex justify-between text-sm mb-1"><span>山海旅行社</span><span class="font-bold">$68,500</span></div><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-primary/40 rounded-full h-2" style="width:37%"></div></div></div></div>
          <div class="flex items-center gap-3"><span class="text-sm font-medium text-gray-500 w-4">5</span><div class="flex-1"><div class="flex justify-between text-sm mb-1"><span>美妝品牌 ROSÉ</span><span class="font-bold">$52,800</span></div><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-primary/30 rounded-full h-2" style="width:29%"></div></div></div></div>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Invoice Modal -->
<div id="invoiceModal" class="fixed inset-0 z-50 hidden items-center justify-center modal-overlay">
  <div class="bg-white rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl max-h-[90vh] overflow-auto">
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-bold text-lg text-gray-900">新增發票</h2>
      <button onclick="closeInvoiceModal()" class="text-gray-400 hover:text-gray-600"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="space-y-4">
      <div><label class="text-xs text-gray-500 mb-1 block">客戶</label><select class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"><option>數位科技股份有限公司</option><option>創意行銷工作室</option><option>綠能環保有限公司</option></select></div>
      <div class="bg-gray-50 rounded-xl p-4">
        <div class="text-xs text-gray-500 mb-2">項目明細</div>
        <div class="space-y-2">
          <div class="flex gap-2"><input type="text" value="網頁設計" class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"><input type="number" value="1" class="w-16 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center"><input type="text" value="$25,000" class="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right"></div>
          <div class="flex gap-2"><input type="text" value="Logo 設計" class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"><input type="number" value="1" class="w-16 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center"><input type="text" value="$8,000" class="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right"></div>
        </div>
        <button class="text-xs text-primary mt-2 hover:underline">+ 新增項目</button>
      </div>
      <div class="flex justify-between items-center p-3 bg-primary/5 rounded-xl"><span class="font-medium text-gray-700">總計</span><span class="text-xl font-bold text-primary">$33,000</span></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-gray-500 mb-1 block">開立日期</label><input type="date" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"></div>
        <div><label class="text-xs text-gray-500 mb-1 block">付款期限</label><select class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"><option>30 天</option><option>15 天</option><option>7 天</option></select></div>
      </div>
      <div class="flex gap-3">
        <button onclick="closeInvoiceModal()" class="flex-1 bg-gray-100 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-200 transition">存為草稿</button>
        <button onclick="closeInvoiceModal()" class="flex-1 bg-primary text-white font-medium py-3 rounded-xl hover:bg-primaryDark transition">建立並寄出</button>
      </div>
    </div>
  </div>
</div>

<script>
function switchPage(page){
  document.querySelectorAll('[id^="page-"]').forEach(p=>p.classList.add('hidden'));
  document.getElementById('page-'+page).classList.remove('hidden');
  document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
  document.querySelector('[data-page="'+page+'"]').classList.add('active');
  const titles={dashboard:'儀表板',invoices:'發票管理',clients:'客戶',revenue:'營收報表'};
  document.getElementById('pageTitle').textContent=titles[page]||page;
}
function openInvoiceModal(){document.getElementById('invoiceModal').classList.remove('hidden');document.getElementById('invoiceModal').classList.add('flex')}
function closeInvoiceModal(){document.getElementById('invoiceModal').classList.add('hidden');document.getElementById('invoiceModal').classList.remove('flex')}
</script>
</body>
</html>$HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
