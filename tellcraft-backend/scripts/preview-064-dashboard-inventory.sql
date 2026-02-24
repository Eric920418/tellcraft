INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '97e687f2-ebb3-4f98-bbe9-12c142c9ce70',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>StockHub - Inventory Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{amber600:'#d97706',amber500:'#f59e0b',amber100:'#fef3c7',amber50:'#fffbeb',green600:'#16a34a',green100:'#dcfce7',green50:'#f0fdf4',red600:'#dc2626',red100:'#fee2e2',red50:'#fef2f2',gray900:'#111827',gray800:'#1f2937',gray700:'#374151',gray600:'#4b5563',gray500:'#6b7280',gray400:'#9ca3af',gray300:'#d1d5db',gray200:'#e5e7eb',gray100:'#f3f4f6',gray50:'#f9fafb'},fontFamily:{sans:['"IBM Plex Sans"','sans-serif'],mono:['"IBM Plex Mono"','monospace']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'IBM Plex Sans',sans-serif;background:#f3f4f6;overflow-x:hidden;min-height:100vh}
@keyframes pulse-border{0%,100%{border-left-color:#d97706}50%{border-left-color:transparent}}
.low-stock-row{border-left:4px solid #d97706;animation:pulse-border 2s ease-in-out infinite}
.normal-row{border-left:4px solid transparent}
.out-stock-row{border-left:4px solid #dc2626}
tr.hoverable:hover{background:#f9fafb}
tr.hoverable:hover .row-actions{opacity:1}
.row-actions{opacity:0;transition:opacity .15s}
.editable-cell{cursor:pointer;position:relative}
.editable-cell:hover{background:#fffbeb}
.edit-input{width:64px;padding:2px 6px;border:2px solid #d97706;border-radius:4px;font-size:14px;font-family:'IBM Plex Sans',sans-serif;outline:none;text-align:center}
.badge{display:inline-flex;align-items:center;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;line-height:1.5}
.badge-in-stock{background:#dcfce7;color:#16a34a}
.badge-low-stock{background:#fef3c7;color:#d97706}
.badge-out-of-stock{background:#fee2e2;color:#dc2626}
.sort-header{cursor:pointer;user-select:none;transition:color .15s}
.sort-header:hover{color:#111827}
.alert-pulse{animation:alert-glow 2s ease-in-out infinite}
@keyframes alert-glow{0%,100%{box-shadow:0 0 0 0 rgba(217,119,6,0.4)}50%{box-shadow:0 0 0 6px rgba(217,119,6,0)}}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:99px}
::-webkit-scrollbar-thumb:hover{background:#9ca3af}
</style>
</head>
<body>

<!-- Top Bar -->
<header class="bg-white border-b border-gray-200 sticky top-0 z-30">
  <div class="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <svg width="18" height="18" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </div>
        <span class="font-bold text-gray-900 text-lg tracking-tight">StockHub</span>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input id="searchInput" type="text" placeholder="Search SKU or product..." class="w-72 text-sm bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition" oninput="filterTable()">
      </div>
      <button onclick="openAddModal()" class="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center gap-1.5">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Product
      </button>
      <button class="bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition flex items-center gap-1.5">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export CSV
      </button>
      <div class="alert-pulse bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer" onclick="filterLowStock()">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Low Stock (7)
      </div>
    </div>
  </div>
</header>

<!-- Quick Stats Strip -->
<div class="bg-white border-b border-gray-200">
  <div class="max-w-[1400px] mx-auto px-6 py-2.5 flex items-center gap-8">
    <div class="flex items-center gap-2 text-sm">
      <div class="w-2 h-2 rounded-full bg-gray-400"></div>
      <span class="text-gray-500">Total Products</span>
      <span class="font-semibold text-gray-900">342</span>
    </div>
    <div class="flex items-center gap-2 text-sm">
      <div class="w-2 h-2 rounded-full bg-green-500"></div>
      <span class="text-gray-500">In Stock</span>
      <span class="font-semibold text-green-700">285</span>
    </div>
    <div class="flex items-center gap-2 text-sm">
      <div class="w-2 h-2 rounded-full bg-amber-500"></div>
      <span class="text-gray-500">Low Stock</span>
      <span class="font-semibold text-amber-700">42</span>
    </div>
    <div class="flex items-center gap-2 text-sm">
      <div class="w-2 h-2 rounded-full bg-red-500"></div>
      <span class="text-gray-500">Out of Stock</span>
      <span class="font-semibold text-red-600">15</span>
    </div>
  </div>
</div>

<!-- Main Inventory Table -->
<div class="max-w-[1400px] mx-auto px-6 py-5">
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <table class="w-full table-fixed" id="inventoryTable">
      <colgroup>
        <col class="w-[44px]">
        <col class="w-[110px]">
        <col class="w-[200px]">
        <col class="w-[120px]">
        <col class="w-[80px]">
        <col class="w-[90px]">
        <col class="w-[120px]">
        <col class="w-[110px]">
        <col class="w-[120px]">
        <col class="w-[90px]">
      </colgroup>
      <thead>
        <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
          <th class="px-3 py-3 text-center"><input type="checkbox" id="selectAll" onclick="toggleSelectAll()" class="rounded border-gray-300 cursor-pointer"></th>
          <th class="px-3 py-3 text-left font-semibold sort-header" onclick="sortTable('sku')">SKU <span class="text-gray-300 ml-0.5">&#9650;&#9660;</span></th>
          <th class="px-3 py-3 text-left font-semibold sort-header" onclick="sortTable('name')">Product Name <span class="text-gray-300 ml-0.5">&#9650;&#9660;</span></th>
          <th class="px-3 py-3 text-left font-semibold sort-header" onclick="sortTable('category')">Category</th>
          <th class="px-3 py-3 text-right font-semibold sort-header" onclick="sortTable('qty')">Qty <span class="text-gray-300 ml-0.5">&#9650;&#9660;</span></th>
          <th class="px-3 py-3 text-right font-semibold">Min Stock</th>
          <th class="px-3 py-3 text-center font-semibold">Status</th>
          <th class="px-3 py-3 text-left font-semibold">Location</th>
          <th class="px-3 py-3 text-left font-semibold">Last Updated</th>
          <th class="px-3 py-3 text-center font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody id="tableBody">
        <!-- Row 1: In Stock -->
        <tr class="hoverable normal-row border-b border-gray-100 transition-colors" data-sku="SKU-001" data-name="Widget A" data-category="Electronics" data-qty="245" data-min="50" data-status="in-stock">
          <td class="px-3 py-3 text-center"><input type="checkbox" class="row-check rounded border-gray-300 cursor-pointer"></td>
          <td class="px-3 py-3 text-sm font-mono font-medium text-gray-700">SKU-001</td>
          <td class="px-3 py-3 text-sm font-medium text-gray-900">Widget A</td>
          <td class="px-3 py-3 text-sm text-gray-500">Electronics</td>
          <td class="px-3 py-3 text-sm text-right font-medium editable-cell" onclick="startEdit(this, 245)">245</td>
          <td class="px-3 py-3 text-sm text-right text-gray-400">50</td>
          <td class="px-3 py-3 text-center"><span class="badge badge-in-stock">In Stock</span></td>
          <td class="px-3 py-3 text-sm text-gray-500">Aisle 3, Shelf B</td>
          <td class="px-3 py-3 text-sm text-gray-400">Feb 24, 2026</td>
          <td class="px-3 py-3 text-center"><div class="row-actions flex items-center justify-center gap-1"><button class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition" title="Edit"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title="Delete"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></td>
        </tr>
        <!-- Row 2: LOW STOCK - PULSING -->
        <tr class="hoverable low-stock-row border-b border-gray-100 bg-amber-50/40 transition-colors" data-sku="SKU-002" data-name="Gadget B" data-category="Electronics" data-qty="3" data-min="10" data-status="low-stock">
          <td class="px-3 py-3 text-center"><input type="checkbox" class="row-check rounded border-gray-300 cursor-pointer"></td>
          <td class="px-3 py-3 text-sm font-mono font-medium text-amber-700">SKU-002</td>
          <td class="px-3 py-3 text-sm font-medium text-gray-900">Gadget B</td>
          <td class="px-3 py-3 text-sm text-gray-500">Electronics</td>
          <td class="px-3 py-3 text-sm text-right font-bold text-amber-700 editable-cell" onclick="startEdit(this, 3)">3</td>
          <td class="px-3 py-3 text-sm text-right text-gray-400">10</td>
          <td class="px-3 py-3 text-center"><span class="badge badge-low-stock font-bold">LOW STOCK</span></td>
          <td class="px-3 py-3 text-sm text-gray-500">Aisle 1, Shelf A</td>
          <td class="px-3 py-3 text-sm text-gray-400">Feb 23, 2026</td>
          <td class="px-3 py-3 text-center"><div class="row-actions flex items-center justify-center gap-1"><button class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition" title="Edit"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title="Delete"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></td>
        </tr>
        <!-- Row 3: OUT OF STOCK -->
        <tr class="hoverable out-stock-row border-b border-gray-100 bg-red-50/30 transition-colors" data-sku="SKU-003" data-name="Part C" data-category="Hardware" data-qty="0" data-min="25" data-status="out-of-stock">
          <td class="px-3 py-3 text-center"><input type="checkbox" class="row-check rounded border-gray-300 cursor-pointer"></td>
          <td class="px-3 py-3 text-sm font-mono font-medium text-red-600">SKU-003</td>
          <td class="px-3 py-3 text-sm font-medium text-gray-900">Part C</td>
          <td class="px-3 py-3 text-sm text-gray-500">Hardware</td>
          <td class="px-3 py-3 text-sm text-right font-bold text-red-600 editable-cell" onclick="startEdit(this, 0)">0</td>
          <td class="px-3 py-3 text-sm text-right text-gray-400">25</td>
          <td class="px-3 py-3 text-center"><span class="badge badge-out-of-stock font-bold">OUT OF STOCK</span></td>
          <td class="px-3 py-3 text-sm text-gray-500">Aisle 5, Shelf D</td>
          <td class="px-3 py-3 text-sm text-gray-400">Feb 20, 2026</td>
          <td class="px-3 py-3 text-center"><div class="row-actions flex items-center justify-center gap-1"><button class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition" title="Edit"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title="Delete"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></td>
        </tr>
        <!-- Row 4: In Stock -->
        <tr class="hoverable normal-row border-b border-gray-100 transition-colors" data-sku="SKU-004" data-name="Connector D" data-category="Electronics" data-qty="180" data-min="30" data-status="in-stock">
          <td class="px-3 py-3 text-center"><input type="checkbox" class="row-check rounded border-gray-300 cursor-pointer"></td>
          <td class="px-3 py-3 text-sm font-mono font-medium text-gray-700">SKU-004</td>
          <td class="px-3 py-3 text-sm font-medium text-gray-900">Connector D</td>
          <td class="px-3 py-3 text-sm text-gray-500">Electronics</td>
          <td class="px-3 py-3 text-sm text-right font-medium editable-cell" onclick="startEdit(this, 180)">180</td>
          <td class="px-3 py-3 text-sm text-right text-gray-400">30</td>
          <td class="px-3 py-3 text-center"><span class="badge badge-in-stock">In Stock</span></td>
          <td class="px-3 py-3 text-sm text-gray-500">Aisle 2, Shelf C</td>
          <td class="px-3 py-3 text-sm text-gray-400">Feb 22, 2026</td>
          <td class="px-3 py-3 text-center"><div class="row-actions flex items-center justify-center gap-1"><button class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition" title="Edit"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title="Delete"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></td>
        </tr>
        <!-- Row 5: LOW STOCK - PULSING -->
        <tr class="hoverable low-stock-row border-b border-gray-100 bg-amber-50/40 transition-colors" data-sku="SKU-005" data-name="Bearing E" data-category="Hardware" data-qty="8" data-min="20" data-status="low-stock">
          <td class="px-3 py-3 text-center"><input type="checkbox" class="row-check rounded border-gray-300 cursor-pointer"></td>
          <td class="px-3 py-3 text-sm font-mono font-medium text-amber-700">SKU-005</td>
          <td class="px-3 py-3 text-sm font-medium text-gray-900">Bearing E</td>
          <td class="px-3 py-3 text-sm text-gray-500">Hardware</td>
          <td class="px-3 py-3 text-sm text-right font-bold text-amber-700 editable-cell" onclick="startEdit(this, 8)">8</td>
          <td class="px-3 py-3 text-sm text-right text-gray-400">20</td>
          <td class="px-3 py-3 text-center"><span class="badge badge-low-stock font-bold">LOW STOCK</span></td>
          <td class="px-3 py-3 text-sm text-gray-500">Aisle 7, Shelf A</td>
          <td class="px-3 py-3 text-sm text-gray-400">Feb 21, 2026</td>
          <td class="px-3 py-3 text-center"><div class="row-actions flex items-center justify-center gap-1"><button class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition" title="Edit"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title="Delete"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></td>
        </tr>
        <!-- Row 6: In Stock -->
        <tr class="hoverable normal-row border-b border-gray-100 transition-colors" data-sku="SKU-006" data-name="Cable Assembly F" data-category="Electronics" data-qty="520" data-min="100" data-status="in-stock">
          <td class="px-3 py-3 text-center"><input type="checkbox" class="row-check rounded border-gray-300 cursor-pointer"></td>
          <td class="px-3 py-3 text-sm font-mono font-medium text-gray-700">SKU-006</td>
          <td class="px-3 py-3 text-sm font-medium text-gray-900">Cable Assembly F</td>
          <td class="px-3 py-3 text-sm text-gray-500">Electronics</td>
          <td class="px-3 py-3 text-sm text-right font-medium editable-cell" onclick="startEdit(this, 520)">520</td>
          <td class="px-3 py-3 text-sm text-right text-gray-400">100</td>
          <td class="px-3 py-3 text-center"><span class="badge badge-in-stock">In Stock</span></td>
          <td class="px-3 py-3 text-sm text-gray-500">Aisle 3, Shelf A</td>
          <td class="px-3 py-3 text-sm text-gray-400">Feb 24, 2026</td>
          <td class="px-3 py-3 text-center"><div class="row-actions flex items-center justify-center gap-1"><button class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition" title="Edit"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title="Delete"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></td>
        </tr>
        <!-- Row 7: LOW STOCK - PULSING -->
        <tr class="hoverable low-stock-row border-b border-gray-100 bg-amber-50/40 transition-colors" data-sku="SKU-007" data-name="Gasket G" data-category="Industrial" data-qty="5" data-min="15" data-status="low-stock">
          <td class="px-3 py-3 text-center"><input type="checkbox" class="row-check rounded border-gray-300 cursor-pointer"></td>
          <td class="px-3 py-3 text-sm font-mono font-medium text-amber-700">SKU-007</td>
          <td class="px-3 py-3 text-sm font-medium text-gray-900">Gasket G</td>
          <td class="px-3 py-3 text-sm text-gray-500">Industrial</td>
          <td class="px-3 py-3 text-sm text-right font-bold text-amber-700 editable-cell" onclick="startEdit(this, 5)">5</td>
          <td class="px-3 py-3 text-sm text-right text-gray-400">15</td>
          <td class="px-3 py-3 text-center"><span class="badge badge-low-stock font-bold">LOW STOCK</span></td>
          <td class="px-3 py-3 text-sm text-gray-500">Aisle 9, Shelf B</td>
          <td class="px-3 py-3 text-sm text-gray-400">Feb 19, 2026</td>
          <td class="px-3 py-3 text-center"><div class="row-actions flex items-center justify-center gap-1"><button class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition" title="Edit"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title="Delete"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></td>
        </tr>
        <!-- Row 8: In Stock -->
        <tr class="hoverable normal-row border-b border-gray-100 transition-colors" data-sku="SKU-008" data-name="Valve H" data-category="Industrial" data-qty="92" data-min="20" data-status="in-stock">
          <td class="px-3 py-3 text-center"><input type="checkbox" class="row-check rounded border-gray-300 cursor-pointer"></td>
          <td class="px-3 py-3 text-sm font-mono font-medium text-gray-700">SKU-008</td>
          <td class="px-3 py-3 text-sm font-medium text-gray-900">Valve H</td>
          <td class="px-3 py-3 text-sm text-gray-500">Industrial</td>
          <td class="px-3 py-3 text-sm text-right font-medium editable-cell" onclick="startEdit(this, 92)">92</td>
          <td class="px-3 py-3 text-sm text-right text-gray-400">20</td>
          <td class="px-3 py-3 text-center"><span class="badge badge-in-stock">In Stock</span></td>
          <td class="px-3 py-3 text-sm text-gray-500">Aisle 6, Shelf C</td>
          <td class="px-3 py-3 text-sm text-gray-400">Feb 23, 2026</td>
          <td class="px-3 py-3 text-center"><div class="row-actions flex items-center justify-center gap-1"><button class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition" title="Edit"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title="Delete"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></td>
        </tr>
        <!-- Row 9: In Stock -->
        <tr class="hoverable normal-row border-b border-gray-100 transition-colors" data-sku="SKU-009" data-name="Mounting Bracket J" data-category="Hardware" data-qty="340" data-min="50" data-status="in-stock">
          <td class="px-3 py-3 text-center"><input type="checkbox" class="row-check rounded border-gray-300 cursor-pointer"></td>
          <td class="px-3 py-3 text-sm font-mono font-medium text-gray-700">SKU-009</td>
          <td class="px-3 py-3 text-sm font-medium text-gray-900">Mounting Bracket J</td>
          <td class="px-3 py-3 text-sm text-gray-500">Hardware</td>
          <td class="px-3 py-3 text-sm text-right font-medium editable-cell" onclick="startEdit(this, 340)">340</td>
          <td class="px-3 py-3 text-sm text-right text-gray-400">50</td>
          <td class="px-3 py-3 text-center"><span class="badge badge-in-stock">In Stock</span></td>
          <td class="px-3 py-3 text-sm text-gray-500">Aisle 4, Shelf B</td>
          <td class="px-3 py-3 text-sm text-gray-400">Feb 24, 2026</td>
          <td class="px-3 py-3 text-center"><div class="row-actions flex items-center justify-center gap-1"><button class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition" title="Edit"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title="Delete"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></td>
        </tr>
        <!-- Row 10: OUT OF STOCK -->
        <tr class="hoverable out-stock-row bg-red-50/30 transition-colors" data-sku="SKU-010" data-name="Sensor Module K" data-category="Electronics" data-qty="0" data-min="10" data-status="out-of-stock">
          <td class="px-3 py-3 text-center"><input type="checkbox" class="row-check rounded border-gray-300 cursor-pointer"></td>
          <td class="px-3 py-3 text-sm font-mono font-medium text-red-600">SKU-010</td>
          <td class="px-3 py-3 text-sm font-medium text-gray-900">Sensor Module K</td>
          <td class="px-3 py-3 text-sm text-gray-500">Electronics</td>
          <td class="px-3 py-3 text-sm text-right font-bold text-red-600 editable-cell" onclick="startEdit(this, 0)">0</td>
          <td class="px-3 py-3 text-sm text-right text-gray-400">10</td>
          <td class="px-3 py-3 text-center"><span class="badge badge-out-of-stock font-bold">OUT OF STOCK</span></td>
          <td class="px-3 py-3 text-sm text-gray-500">Aisle 1, Shelf D</td>
          <td class="px-3 py-3 text-sm text-gray-400">Feb 18, 2026</td>
          <td class="px-3 py-3 text-center"><div class="row-actions flex items-center justify-center gap-1"><button class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition" title="Edit"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title="Delete"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></td>
        </tr>
      </tbody>
    </table>

    <!-- Table Footer -->
    <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
      <span class="text-sm text-gray-500">Showing <span class="font-medium text-gray-700">1-10</span> of <span class="font-medium text-gray-700">342</span> products</span>
      <div class="flex items-center gap-1">
        <button class="px-3 py-1.5 text-sm text-gray-400 bg-white border border-gray-200 rounded-lg cursor-not-allowed" disabled>&laquo; Prev</button>
        <button class="px-3 py-1.5 text-sm text-white bg-gray-900 border border-gray-900 rounded-lg font-medium">1</button>
        <button class="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">2</button>
        <button class="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">3</button>
        <span class="px-2 text-gray-400">...</span>
        <button class="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">35</button>
        <button class="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">Next &raquo;</button>
      </div>
    </div>
  </div>
</div>

<!-- Add Product Modal -->
<div id="addModal" class="fixed inset-0 z-50 hidden items-center justify-center" style="background:rgba(0,0,0,.4);backdrop-filter:blur(4px)">
  <div class="bg-white rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl">
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-bold text-lg text-gray-900">Add New Product</h2>
      <button onclick="closeAddModal()" class="text-gray-400 hover:text-gray-600 transition"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-gray-500 mb-1 block font-medium">SKU</label><input type="text" placeholder="SKU-011" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"></div>
        <div><label class="text-xs text-gray-500 mb-1 block font-medium">Category</label><select class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"><option>Electronics</option><option>Hardware</option><option>Industrial</option><option>Packaging</option></select></div>
      </div>
      <div><label class="text-xs text-gray-500 mb-1 block font-medium">Product Name</label><input type="text" placeholder="Enter product name" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"></div>
      <div class="grid grid-cols-3 gap-3">
        <div><label class="text-xs text-gray-500 mb-1 block font-medium">Quantity</label><input type="number" value="0" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"></div>
        <div><label class="text-xs text-gray-500 mb-1 block font-medium">Min Stock</label><input type="number" value="10" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"></div>
        <div><label class="text-xs text-gray-500 mb-1 block font-medium">Location</label><input type="text" placeholder="Aisle-Shelf" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"></div>
      </div>
      <button onclick="closeAddModal()" class="w-full bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-gray-800 transition">Add Product</button>
    </div>
  </div>
</div>

<script>
// Select All checkbox
function toggleSelectAll(){
  var c=document.getElementById('selectAll').checked;
  document.querySelectorAll('.row-check').forEach(function(cb){cb.checked=c});
}

// Inline edit on quantity cell click
var activeEdit=null;
function startEdit(cell,val){
  if(activeEdit){cancelEdit()}
  activeEdit={cell:cell,original:cell.innerHTML};
  var inp=document.createElement('input');
  inp.type='number';inp.value=val;inp.className='edit-input';
  inp.onblur=function(){finishEdit(cell,inp.value)};
  inp.onkeydown=function(e){if(e.key==='Enter'){finishEdit(cell,inp.value)}if(e.key==='Escape'){cancelEdit()}};
  cell.innerHTML='';cell.appendChild(inp);inp.focus();inp.select();
}
function finishEdit(cell,val){
  var n=parseInt(val)||0;
  var row=cell.closest('tr');
  var min=parseInt(row.getAttribute('data-min'))||0;
  cell.textContent=n;
  row.setAttribute('data-qty',n);
  // Update status
  if(n===0){
    row.setAttribute('data-status','out-of-stock');
    row.className='hoverable out-stock-row border-b border-gray-100 bg-red-50/30 transition-colors';
    cell.className='px-3 py-3 text-sm text-right font-bold text-red-600 editable-cell';
    cell.setAttribute('onclick','startEdit(this,'+n+')');
    row.querySelector('.badge').className='badge badge-out-of-stock font-bold';
    row.querySelector('.badge').textContent='OUT OF STOCK';
    row.querySelector('td:nth-child(2)').className='px-3 py-3 text-sm font-mono font-medium text-red-600';
  }else if(n<min){
    row.setAttribute('data-status','low-stock');
    row.className='hoverable low-stock-row border-b border-gray-100 bg-amber-50/40 transition-colors';
    cell.className='px-3 py-3 text-sm text-right font-bold text-amber-700 editable-cell';
    cell.setAttribute('onclick','startEdit(this,'+n+')');
    row.querySelector('.badge').className='badge badge-low-stock font-bold';
    row.querySelector('.badge').textContent='LOW STOCK';
    row.querySelector('td:nth-child(2)').className='px-3 py-3 text-sm font-mono font-medium text-amber-700';
  }else{
    row.setAttribute('data-status','in-stock');
    row.className='hoverable normal-row border-b border-gray-100 transition-colors';
    cell.className='px-3 py-3 text-sm text-right font-medium editable-cell';
    cell.setAttribute('onclick','startEdit(this,'+n+')');
    row.querySelector('.badge').className='badge badge-in-stock';
    row.querySelector('.badge').textContent='In Stock';
    row.querySelector('td:nth-child(2)').className='px-3 py-3 text-sm font-mono font-medium text-gray-700';
  }
  activeEdit=null;
}
function cancelEdit(){
  if(activeEdit){activeEdit.cell.innerHTML=activeEdit.original;activeEdit=null}
}

// Sort table by column
var sortDir={};
function sortTable(col){
  var tbody=document.getElementById('tableBody');
  var rows=Array.from(tbody.querySelectorAll('tr'));
  sortDir[col]=!sortDir[col];
  var dir=sortDir[col]?1:-1;
  rows.sort(function(a,b){
    var va=a.getAttribute('data-'+col)||'';
    var vb=b.getAttribute('data-'+col)||'';
    if(col==='qty'){return(parseInt(va)-parseInt(vb))*dir}
    return va.localeCompare(vb)*dir;
  });
  rows.forEach(function(r){tbody.appendChild(r)});
}

// Search / filter
function filterTable(){
  var q=document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('#tableBody tr').forEach(function(r){
    var sku=(r.getAttribute('data-sku')||'').toLowerCase();
    var name=(r.getAttribute('data-name')||'').toLowerCase();
    r.style.display=(sku.indexOf(q)>-1||name.indexOf(q)>-1)?'':'none';
  });
}

// Filter low stock only
var lowStockFilter=false;
function filterLowStock(){
  lowStockFilter=!lowStockFilter;
  document.querySelectorAll('#tableBody tr').forEach(function(r){
    if(lowStockFilter){
      var s=r.getAttribute('data-status');
      r.style.display=(s==='low-stock'||s==='out-of-stock')?'':'none';
    }else{
      r.style.display='';
    }
  });
}

// Modal
function openAddModal(){document.getElementById('addModal').classList.remove('hidden');document.getElementById('addModal').classList.add('flex')}
function closeAddModal(){document.getElementById('addModal').classList.add('hidden');document.getElementById('addModal').classList.remove('flex')}
</script>
</body>
</html>$HTML$,
  3
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
