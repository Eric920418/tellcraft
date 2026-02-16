INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '97e687f2-ebb3-4f98-bbe9-12c142c9ce70',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>進銷存 StockPulse</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{primary:'#0284c7',primaryLight:'#38bdf8',primaryDark:'#0369a1',surface:'#f0f9ff',sidebar:'#0c1222',accent:'#f59e0b',success:'#10b981',danger:'#ef4444',warning:'#f97316',muted:'#64748b'},fontFamily:{sans:['Inter','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#f8fafc;overflow:hidden;height:100vh}
.sidebar-item{transition:all .2s}
.sidebar-item:hover,.sidebar-item.active{background:rgba(255,255,255,.1);border-radius:8px}
.stock-low{background:#fef2f2;border-left:3px solid #ef4444}
.stock-ok{border-left:3px solid transparent}
.table-row{transition:all .15s}
.table-row:hover{background:#f0f9ff}
.fade-in{animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.modal-overlay{background:rgba(0,0,0,.4);backdrop-filter:blur(4px)}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#7dd3fc;border-radius:99px}
</style>
</head>
<body>
<div class="flex h-screen">
  <aside class="w-56 bg-sidebar text-white flex flex-col flex-shrink-0">
    <div class="p-4 flex items-center gap-2.5 border-b border-white/10">
      <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
      </div>
      <span class="font-bold text-base">StockPulse</span>
    </div>
    <nav class="flex-1 p-3 space-y-1">
      <div onclick="switchPage('dashboard')" class="sidebar-item active flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="dashboard">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>儀表板</span>
      </div>
      <div onclick="switchPage('products')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="products">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
        <span>商品列表</span>
        <span class="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">148</span>
      </div>
      <div onclick="switchPage('records')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="records">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        <span>進出庫紀錄</span>
      </div>
      <div onclick="switchPage('suppliers')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="suppliers">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        <span>供應商</span>
      </div>
    </nav>
    <div class="p-3 border-t border-white/10">
      <div class="bg-danger/20 border border-danger/30 rounded-xl p-3">
        <div class="flex items-center gap-2 text-xs text-danger font-medium mb-1">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          低庫存警示
        </div>
        <div class="text-xs text-white/60">5 項商品低於安全庫存</div>
      </div>
    </div>
  </aside>

  <main class="flex-1 flex flex-col overflow-hidden">
    <header class="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <h1 class="font-semibold text-gray-900" id="pageTitle">儀表板</h1>
      <div class="flex items-center gap-2">
        <button onclick="openStockModal('in')" class="bg-success text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-success/90 transition flex items-center gap-1">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          進貨
        </button>
        <button onclick="openStockModal('out')" class="bg-warning text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-warning/90 transition flex items-center gap-1">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          出庫
        </button>
      </div>
    </header>

    <!-- Dashboard -->
    <div id="page-dashboard" class="flex-1 overflow-auto p-6 fade-in">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">商品總數</div>
          <div class="text-2xl font-bold text-gray-900">148</div>
          <div class="text-xs text-gray-400 mt-1">12 個分類</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">庫存總值</div>
          <div class="text-2xl font-bold text-primary">$2.4M</div>
          <div class="text-xs text-success mt-1">↑ 8% vs 上月</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">本月進貨</div>
          <div class="text-2xl font-bold text-success">$580K</div>
          <div class="text-xs text-gray-400 mt-1">42 筆訂單</div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="text-xs text-gray-500 mb-1">低庫存</div>
          <div class="text-2xl font-bold text-danger">5</div>
          <div class="text-xs text-danger mt-1">需要補貨</div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
          <h3 class="font-semibold text-gray-900 mb-4">進出庫趨勢</h3>
          <div class="flex items-end gap-3 h-36">
            <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full flex gap-0.5 justify-center" style="height:120px"><div class="w-4 bg-success/30 rounded-t self-end" style="height:60%"></div><div class="w-4 bg-warning/30 rounded-t self-end" style="height:45%"></div></div><span class="text-xs text-gray-400">W1</span></div>
            <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full flex gap-0.5 justify-center" style="height:120px"><div class="w-4 bg-success/30 rounded-t self-end" style="height:80%"></div><div class="w-4 bg-warning/30 rounded-t self-end" style="height:55%"></div></div><span class="text-xs text-gray-400">W2</span></div>
            <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full flex gap-0.5 justify-center" style="height:120px"><div class="w-4 bg-success rounded-t self-end" style="height:70%"></div><div class="w-4 bg-warning rounded-t self-end" style="height:65%"></div></div><span class="text-xs text-gray-400">W3</span></div>
            <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full flex gap-0.5 justify-center" style="height:120px"><div class="w-4 bg-success/20 rounded-t self-end" style="height:50%"></div><div class="w-4 bg-warning/20 rounded-t self-end" style="height:40%"></div></div><span class="text-xs text-gray-400">W4</span></div>
          </div>
          <div class="flex justify-center gap-6 mt-3"><div class="flex items-center gap-1.5 text-xs text-gray-500"><div class="w-3 h-3 rounded bg-success"></div>進貨</div><div class="flex items-center gap-1.5 text-xs text-gray-500"><div class="w-3 h-3 rounded bg-warning"></div>出庫</div></div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 class="font-semibold text-gray-900 mb-3">分類庫存</h3>
          <div class="space-y-2.5">
            <div><div class="flex justify-between text-sm mb-1"><span>電子零件</span><span class="font-bold">38%</span></div><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-primary rounded-full h-2" style="width:38%"></div></div></div>
            <div><div class="flex justify-between text-sm mb-1"><span>包裝材料</span><span class="font-bold">25%</span></div><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-success rounded-full h-2" style="width:25%"></div></div></div>
            <div><div class="flex justify-between text-sm mb-1"><span>五金配件</span><span class="font-bold">20%</span></div><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-accent rounded-full h-2" style="width:20%"></div></div></div>
            <div><div class="flex justify-between text-sm mb-1"><span>辦公用品</span><span class="font-bold">12%</span></div><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-warning rounded-full h-2" style="width:12%"></div></div></div>
            <div><div class="flex justify-between text-sm mb-1"><span>其他</span><span class="font-bold">5%</span></div><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-gray-400 rounded-full h-2" style="width:5%"></div></div></div>
          </div>
        </div>
      </div>

      <!-- Low stock alerts -->
      <div class="bg-white rounded-2xl border border-gray-100">
        <div class="p-4 border-b border-gray-100 flex items-center gap-2">
          <svg class="text-danger" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <h3 class="font-semibold text-danger">低庫存警示</h3>
        </div>
        <table class="w-full">
          <thead><tr class="text-xs text-gray-400 border-b border-gray-50"><th class="text-left px-4 py-2.5 font-medium">商品</th><th class="text-left px-4 py-2.5 font-medium">分類</th><th class="text-right px-4 py-2.5 font-medium">現有庫存</th><th class="text-right px-4 py-2.5 font-medium">安全庫存</th><th class="text-right px-4 py-2.5 font-medium">缺口</th><th class="text-center px-4 py-2.5 font-medium">操作</th></tr></thead>
          <tbody>
            <tr class="stock-low border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium text-gray-900">USB-C 連接器 (Type A)</td><td class="px-4 py-3 text-sm text-gray-500">電子零件</td><td class="px-4 py-3 text-sm text-right text-danger font-bold">23</td><td class="px-4 py-3 text-sm text-right text-gray-400">100</td><td class="px-4 py-3 text-sm text-right text-danger font-bold">-77</td><td class="px-4 py-3 text-center"><button class="text-xs bg-primary text-white px-3 py-1 rounded-lg hover:bg-primaryDark transition">補貨</button></td></tr>
            <tr class="stock-low border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium text-gray-900">M3 不鏽鋼螺絲</td><td class="px-4 py-3 text-sm text-gray-500">五金配件</td><td class="px-4 py-3 text-sm text-right text-danger font-bold">45</td><td class="px-4 py-3 text-sm text-right text-gray-400">200</td><td class="px-4 py-3 text-sm text-right text-danger font-bold">-155</td><td class="px-4 py-3 text-center"><button class="text-xs bg-primary text-white px-3 py-1 rounded-lg hover:bg-primaryDark transition">補貨</button></td></tr>
            <tr class="stock-low border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium text-gray-900">氣泡緩衝袋 25x30</td><td class="px-4 py-3 text-sm text-gray-500">包裝材料</td><td class="px-4 py-3 text-sm text-right text-danger font-bold">80</td><td class="px-4 py-3 text-sm text-right text-gray-400">500</td><td class="px-4 py-3 text-sm text-right text-danger font-bold">-420</td><td class="px-4 py-3 text-center"><button class="text-xs bg-primary text-white px-3 py-1 rounded-lg hover:bg-primaryDark transition">補貨</button></td></tr>
            <tr class="stock-low border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium text-gray-900">A4 影印紙 (箱)</td><td class="px-4 py-3 text-sm text-gray-500">辦公用品</td><td class="px-4 py-3 text-sm text-right text-danger font-bold">3</td><td class="px-4 py-3 text-sm text-right text-gray-400">10</td><td class="px-4 py-3 text-sm text-right text-danger font-bold">-7</td><td class="px-4 py-3 text-center"><button class="text-xs bg-primary text-white px-3 py-1 rounded-lg hover:bg-primaryDark transition">補貨</button></td></tr>
            <tr class="stock-low"><td class="px-4 py-3 text-sm font-medium text-gray-900">LED 指示燈 3mm 紅</td><td class="px-4 py-3 text-sm text-gray-500">電子零件</td><td class="px-4 py-3 text-sm text-right text-danger font-bold">150</td><td class="px-4 py-3 text-sm text-right text-gray-400">500</td><td class="px-4 py-3 text-sm text-right text-danger font-bold">-350</td><td class="px-4 py-3 text-center"><button class="text-xs bg-primary text-white px-3 py-1 rounded-lg hover:bg-primaryDark transition">補貨</button></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Products -->
    <div id="page-products" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="flex items-center gap-2 mb-4">
        <div class="relative flex-1 max-w-xs"><input type="text" placeholder="搜尋商品..." class="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-primary"><svg class="absolute left-3 top-2.5 text-gray-400" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
        <select class="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"><option>全部分類</option><option>電子零件</option><option>包裝材料</option><option>五金配件</option><option>辦公用品</option></select>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100">
        <table class="w-full">
          <thead><tr class="text-xs text-gray-400 border-b border-gray-100"><th class="text-left px-4 py-3 font-medium">商品名稱</th><th class="text-left px-4 py-3 font-medium">SKU</th><th class="text-left px-4 py-3 font-medium">分類</th><th class="text-right px-4 py-3 font-medium">單價</th><th class="text-right px-4 py-3 font-medium">庫存</th><th class="text-right px-4 py-3 font-medium">庫存值</th><th class="text-center px-4 py-3 font-medium">狀態</th></tr></thead>
          <tbody>
            <tr class="table-row border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium">10K 電阻 1/4W</td><td class="px-4 py-3 text-xs text-gray-400 font-mono">EL-R10K</td><td class="px-4 py-3 text-sm text-gray-500">電子零件</td><td class="px-4 py-3 text-sm text-right">$0.5</td><td class="px-4 py-3 text-sm text-right font-medium">12,000</td><td class="px-4 py-3 text-sm text-right">$6,000</td><td class="px-4 py-3 text-center"><span class="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">充足</span></td></tr>
            <tr class="table-row border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium">USB-C 連接器 (Type A)</td><td class="px-4 py-3 text-xs text-gray-400 font-mono">EL-USBC-A</td><td class="px-4 py-3 text-sm text-gray-500">電子零件</td><td class="px-4 py-3 text-sm text-right">$12</td><td class="px-4 py-3 text-sm text-right font-medium text-danger">23</td><td class="px-4 py-3 text-sm text-right">$276</td><td class="px-4 py-3 text-center"><span class="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">低庫存</span></td></tr>
            <tr class="table-row border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium">瓦楞紙箱 30x20x15</td><td class="px-4 py-3 text-xs text-gray-400 font-mono">PK-BOX-M</td><td class="px-4 py-3 text-sm text-gray-500">包裝材料</td><td class="px-4 py-3 text-sm text-right">$15</td><td class="px-4 py-3 text-sm text-right font-medium">850</td><td class="px-4 py-3 text-sm text-right">$12,750</td><td class="px-4 py-3 text-center"><span class="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">充足</span></td></tr>
            <tr class="table-row border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium">M3 不鏽鋼螺絲</td><td class="px-4 py-3 text-xs text-gray-400 font-mono">HW-M3-SS</td><td class="px-4 py-3 text-sm text-gray-500">五金配件</td><td class="px-4 py-3 text-sm text-right">$0.8</td><td class="px-4 py-3 text-sm text-right font-medium text-danger">45</td><td class="px-4 py-3 text-sm text-right">$36</td><td class="px-4 py-3 text-center"><span class="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">低庫存</span></td></tr>
            <tr class="table-row border-b border-gray-50"><td class="px-4 py-3 text-sm font-medium">標籤貼紙 50x30mm</td><td class="px-4 py-3 text-xs text-gray-400 font-mono">PK-LBL-S</td><td class="px-4 py-3 text-sm text-gray-500">包裝材料</td><td class="px-4 py-3 text-sm text-right">$3</td><td class="px-4 py-3 text-sm text-right font-medium">2,400</td><td class="px-4 py-3 text-sm text-right">$7,200</td><td class="px-4 py-3 text-center"><span class="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">充足</span></td></tr>
            <tr class="table-row"><td class="px-4 py-3 text-sm font-medium">防靜電手環</td><td class="px-4 py-3 text-xs text-gray-400 font-mono">HW-ESD-W</td><td class="px-4 py-3 text-sm text-gray-500">五金配件</td><td class="px-4 py-3 text-sm text-right">$85</td><td class="px-4 py-3 text-sm text-right font-medium">120</td><td class="px-4 py-3 text-sm text-right">$10,200</td><td class="px-4 py-3 text-center"><span class="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">充足</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Records -->
    <div id="page-records" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="flex items-center gap-2 mb-4">
        <button class="text-sm font-medium px-3 py-1.5 rounded-lg bg-primary text-white">全部</button>
        <button class="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">進貨</button>
        <button class="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">出庫</button>
        <button class="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">退貨</button>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100">
        <table class="w-full">
          <thead><tr class="text-xs text-gray-400 border-b border-gray-100"><th class="text-left px-4 py-3 font-medium">日期</th><th class="text-center px-4 py-3 font-medium">類型</th><th class="text-left px-4 py-3 font-medium">商品</th><th class="text-right px-4 py-3 font-medium">數量</th><th class="text-left px-4 py-3 font-medium">來源/去向</th><th class="text-left px-4 py-3 font-medium">經手人</th></tr></thead>
          <tbody>
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition"><td class="px-4 py-3 text-sm text-gray-500">2/16 14:30</td><td class="px-4 py-3 text-center"><span class="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium">出庫</span></td><td class="px-4 py-3 text-sm font-medium">瓦楞紙箱 30x20x15</td><td class="px-4 py-3 text-sm text-right font-medium text-warning">-50</td><td class="px-4 py-3 text-sm text-gray-500">訂單 #2026-0458</td><td class="px-4 py-3 text-sm text-gray-400">王倉管</td></tr>
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition"><td class="px-4 py-3 text-sm text-gray-500">2/16 10:15</td><td class="px-4 py-3 text-center"><span class="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">進貨</span></td><td class="px-4 py-3 text-sm font-medium">10K 電阻 1/4W</td><td class="px-4 py-3 text-sm text-right font-medium text-success">+5,000</td><td class="px-4 py-3 text-sm text-gray-500">大同電子</td><td class="px-4 py-3 text-sm text-gray-400">李倉管</td></tr>
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition"><td class="px-4 py-3 text-sm text-gray-500">2/15 16:00</td><td class="px-4 py-3 text-center"><span class="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium">出庫</span></td><td class="px-4 py-3 text-sm font-medium">防靜電手環</td><td class="px-4 py-3 text-sm text-right font-medium text-warning">-10</td><td class="px-4 py-3 text-sm text-gray-500">產線 B</td><td class="px-4 py-3 text-sm text-gray-400">王倉管</td></tr>
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition"><td class="px-4 py-3 text-sm text-gray-500">2/15 09:30</td><td class="px-4 py-3 text-center"><span class="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">退貨</span></td><td class="px-4 py-3 text-sm font-medium">USB-C 連接器 (Type A)</td><td class="px-4 py-3 text-sm text-right font-medium text-primary">+3</td><td class="px-4 py-3 text-sm text-gray-500">品檢退回</td><td class="px-4 py-3 text-sm text-gray-400">陳品管</td></tr>
            <tr class="hover:bg-gray-50 transition"><td class="px-4 py-3 text-sm text-gray-500">2/14 14:00</td><td class="px-4 py-3 text-center"><span class="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">進貨</span></td><td class="px-4 py-3 text-sm font-medium">標籤貼紙 50x30mm</td><td class="px-4 py-3 text-sm text-right font-medium text-success">+1,000</td><td class="px-4 py-3 text-sm text-gray-500">宏達包材</td><td class="px-4 py-3 text-sm text-gray-400">李倉管</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Suppliers -->
    <div id="page-suppliers" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer">
          <div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600">大</div><div><h4 class="font-semibold text-sm">大同電子</h4><p class="text-xs text-gray-400">電子零件</p></div></div>
          <div class="text-xs text-gray-500 mb-2">供應 42 項商品</div>
          <div class="flex justify-between text-sm"><span class="text-gray-500">本月訂單</span><span class="font-bold text-primary">$185,000</span></div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer">
          <div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg font-bold text-amber-600">宏</div><div><h4 class="font-semibold text-sm">宏達包材</h4><p class="text-xs text-gray-400">包裝材料</p></div></div>
          <div class="text-xs text-gray-500 mb-2">供應 28 項商品</div>
          <div class="flex justify-between text-sm"><span class="text-gray-500">本月訂單</span><span class="font-bold text-primary">$92,000</span></div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer">
          <div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-600">永</div><div><h4 class="font-semibold text-sm">永豐五金</h4><p class="text-xs text-gray-400">五金配件</p></div></div>
          <div class="text-xs text-gray-500 mb-2">供應 35 項商品</div>
          <div class="flex justify-between text-sm"><span class="text-gray-500">本月訂單</span><span class="font-bold text-primary">$68,500</span></div>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Stock Modal -->
<div id="stockModal" class="fixed inset-0 z-50 hidden items-center justify-center modal-overlay">
  <div class="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-bold text-lg text-gray-900" id="stockModalTitle">進貨登記</h2>
      <button onclick="closeStockModal()" class="text-gray-400 hover:text-gray-600"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="space-y-4">
      <div><label class="text-xs text-gray-500 mb-1 block">商品</label><select class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"><option>USB-C 連接器 (Type A)</option><option>M3 不鏽鋼螺絲</option><option>10K 電阻 1/4W</option></select></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-gray-500 mb-1 block">數量</label><input type="number" value="100" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"></div>
        <div><label class="text-xs text-gray-500 mb-1 block" id="stockSourceLabel">供應商</label><select class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"><option>大同電子</option><option>宏達包材</option><option>永豐五金</option></select></div>
      </div>
      <textarea placeholder="備註" rows="2" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"></textarea>
      <button onclick="closeStockModal()" id="stockSubmitBtn" class="w-full bg-success text-white font-medium py-3 rounded-xl hover:bg-success/90 transition">確認進貨</button>
    </div>
  </div>
</div>

<script>
function switchPage(page){
  document.querySelectorAll('[id^="page-"]').forEach(p=>p.classList.add('hidden'));
  document.getElementById('page-'+page).classList.remove('hidden');
  document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
  document.querySelector('[data-page="'+page+'"]').classList.add('active');
  const titles={dashboard:'儀表板',products:'商品列表',records:'進出庫紀錄',suppliers:'供應商'};
  document.getElementById('pageTitle').textContent=titles[page]||page;
}
function openStockModal(type){
  document.getElementById('stockModal').classList.remove('hidden');
  document.getElementById('stockModal').classList.add('flex');
  if(type==='in'){
    document.getElementById('stockModalTitle').textContent='進貨登記';
    document.getElementById('stockSourceLabel').textContent='供應商';
    document.getElementById('stockSubmitBtn').textContent='確認進貨';
    document.getElementById('stockSubmitBtn').className='w-full bg-success text-white font-medium py-3 rounded-xl hover:bg-success/90 transition';
  }else{
    document.getElementById('stockModalTitle').textContent='出庫登記';
    document.getElementById('stockSourceLabel').textContent='去向';
    document.getElementById('stockSubmitBtn').textContent='確認出庫';
    document.getElementById('stockSubmitBtn').className='w-full bg-warning text-white font-medium py-3 rounded-xl hover:bg-warning/90 transition';
  }
}
function closeStockModal(){document.getElementById('stockModal').classList.add('hidden');document.getElementById('stockModal').classList.remove('flex')}
</script>
</body>
</html>$HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
