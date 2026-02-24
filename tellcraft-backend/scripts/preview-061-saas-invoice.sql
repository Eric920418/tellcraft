INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '75d3ecb0-6024-4279-afff-7ee4d9aadbae',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>InvoiceHub - SaaS Invoice Management</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{navy:'#1e3a5f','navy-light':'#2a4d7a','navy-dark':'#152d4a',gold:'#b8860b','gold-light':'#d4a017','gold-dark':'#8b6508',surface:'#faf8f5','surface-warm':'#f5f0e8',overdue:'#c0392b','overdue-bg':'#fef2f0',sent:'#1e3a5f','sent-bg':'#e8eef5',viewed:'#2980b9','viewed-bg':'#e8f4fd',paid:'#b8860b','paid-bg':'#fdf6e3',draft:'#7f8c8d','draft-bg':'#f0f1f2'},fontFamily:{display:['Playfair Display','serif'],body:['Source Sans 3','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Source Sans 3',sans-serif;background:#faf8f5;overflow:hidden;height:100vh}
.font-display{font-family:'Playfair Display',serif}
.layered-shadow{box-shadow:0 2px 4px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.08)}
.layered-shadow-sm{box-shadow:0 1px 2px rgba(0,0,0,0.03),0 4px 12px rgba(0,0,0,0.06)}
.table-row{transition:all .2s ease}
.table-row:hover{background:#f5f0e8}
.table-row:hover .row-actions{opacity:1}
.row-actions{opacity:0;transition:opacity .2s}
.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:120px;opacity:0.04;pointer-events:none;font-family:'Playfair Display',serif;font-weight:700;color:#1e3a5f;white-space:nowrap;z-index:0;transition:opacity .3s}
.detail-panel{transform:translateX(100%);transition:transform .35s cubic-bezier(0.4,0,0.2,1)}
.detail-panel.open{transform:translateX(0)}
.detail-overlay{opacity:0;pointer-events:none;transition:opacity .3s}
.detail-overlay.open{opacity:1;pointer-events:auto}
.funnel-segment{transition:all .25s ease;cursor:pointer}
.funnel-segment:hover{filter:brightness(1.08);transform:translateY(-2px)}
.status-badge{font-size:12px;font-weight:600;padding:4px 12px;border-radius:99px;letter-spacing:0.02em}
.btn-action{transition:all .15s ease}
.btn-action:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.15)}
.fade-in{animation:fadeIn .4s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.timeline-dot{width:12px;height:12px;border-radius:50%;border:2px solid;position:relative;z-index:1;background:#fff}
.timeline-line{position:absolute;left:5px;top:12px;bottom:0;width:2px;background:#e5e7eb}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-thumb{background:#c9b896;border-radius:99px}
::-webkit-scrollbar-track{background:transparent}
</style>
</head>
<body>

<div class="flex flex-col h-screen">
  <!-- Top Action Bar -->
  <header class="bg-white border-b border-gray-200 flex-shrink-0 layered-shadow-sm" style="z-index:20">
    <div class="flex items-center justify-between px-6 h-14">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
            <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <span class="font-display font-bold text-navy text-lg tracking-tight">InvoiceHub</span>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="openNewInvoice()" class="btn-action bg-navy text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Invoice
          </button>
          <button class="btn-action bg-white border border-gray-200 text-gray-700 text-sm font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer hover:border-navy/30">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filter
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button class="btn-action bg-white border border-gray-200 text-gray-700 text-sm font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer hover:border-navy/30">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
        </div>
      </div>
      <div class="flex items-center gap-5">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search invoices..." class="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-52 focus:outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/10 bg-surface font-body" />
        </div>
        <div class="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy text-xs font-bold cursor-pointer">JD</div>
      </div>
    </div>
    <!-- Revenue Summary Bar -->
    <div class="flex items-center gap-6 px-6 py-2.5 bg-surface-warm/60 border-t border-gray-100 text-sm">
      <div class="flex items-center gap-2">
        <span class="text-gray-500 font-body">This Month:</span>
        <span class="font-display font-bold text-gold text-base">$24,850</span>
      </div>
      <div class="w-px h-4 bg-gray-300"></div>
      <div class="flex items-center gap-2">
        <span class="text-gray-500 font-body">Outstanding:</span>
        <span class="font-display font-bold text-navy text-base">$8,420</span>
      </div>
      <div class="w-px h-4 bg-gray-300"></div>
      <div class="flex items-center gap-2">
        <span class="text-gray-500 font-body">Overdue:</span>
        <span class="font-display font-bold text-overdue text-base">$2,100</span>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <div class="flex-1 overflow-auto p-6 fade-in" id="mainContent">
    <!-- Revenue Funnel -->
    <div class="bg-white rounded-2xl p-5 mb-6 layered-shadow">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-display font-bold text-navy text-base">Revenue Funnel</h2>
        <span class="text-xs text-gray-400 font-body">Last 30 days</span>
      </div>
      <div class="flex items-center justify-center gap-0" style="height:80px">
        <!-- Draft -->
        <div class="funnel-segment flex flex-col items-center" onmouseenter="highlightFunnel(0)" onmouseleave="unhighlightFunnel()">
          <svg width="180" height="56" viewBox="0 0 180 56">
            <polygon points="0,0 180,0 170,56 10,56" fill="#7f8c8d" opacity="0.85"/>
            <text x="90" y="24" text-anchor="middle" fill="white" font-family="Source Sans 3" font-size="11" font-weight="600">Draft</text>
            <text x="90" y="42" text-anchor="middle" fill="white" font-family="Playfair Display" font-size="18" font-weight="700">12</text>
          </svg>
        </div>
        <div class="flex flex-col items-center mx-1">
          <span class="text-xs font-bold text-gray-400 font-body">67%</span>
          <svg width="16" height="12" viewBox="0 0 16 12"><path d="M0 6h12l-4-4M12 6l-4 4" stroke="#9ca3af" stroke-width="1.5" fill="none"/></svg>
        </div>
        <!-- Sent -->
        <div class="funnel-segment flex flex-col items-center" onmouseenter="highlightFunnel(1)" onmouseleave="unhighlightFunnel()">
          <svg width="156" height="56" viewBox="0 0 156 56">
            <polygon points="5,0 151,0 141,56 15,56" fill="#1e3a5f" opacity="0.9"/>
            <text x="78" y="24" text-anchor="middle" fill="white" font-family="Source Sans 3" font-size="11" font-weight="600">Sent</text>
            <text x="78" y="42" text-anchor="middle" fill="white" font-family="Playfair Display" font-size="18" font-weight="700">8</text>
          </svg>
        </div>
        <div class="flex flex-col items-center mx-1">
          <span class="text-xs font-bold text-gray-400 font-body">75%</span>
          <svg width="16" height="12" viewBox="0 0 16 12"><path d="M0 6h12l-4-4M12 6l-4 4" stroke="#9ca3af" stroke-width="1.5" fill="none"/></svg>
        </div>
        <!-- Viewed -->
        <div class="funnel-segment flex flex-col items-center" onmouseenter="highlightFunnel(2)" onmouseleave="unhighlightFunnel()">
          <svg width="132" height="56" viewBox="0 0 132 56">
            <polygon points="8,0 124,0 114,56 18,56" fill="#2980b9" opacity="0.85"/>
            <text x="66" y="24" text-anchor="middle" fill="white" font-family="Source Sans 3" font-size="11" font-weight="600">Viewed</text>
            <text x="66" y="42" text-anchor="middle" fill="white" font-family="Playfair Display" font-size="18" font-weight="700">6</text>
          </svg>
        </div>
        <div class="flex flex-col items-center mx-1">
          <span class="text-xs font-bold text-gray-400 font-body">67%</span>
          <svg width="16" height="12" viewBox="0 0 16 12"><path d="M0 6h12l-4-4M12 6l-4 4" stroke="#9ca3af" stroke-width="1.5" fill="none"/></svg>
        </div>
        <!-- Paid -->
        <div class="funnel-segment flex flex-col items-center" onmouseenter="highlightFunnel(3)" onmouseleave="unhighlightFunnel()">
          <svg width="108" height="56" viewBox="0 0 108 56">
            <polygon points="10,0 98,0 88,56 20,56" fill="#b8860b" opacity="0.9"/>
            <text x="54" y="24" text-anchor="middle" fill="white" font-family="Source Sans 3" font-size="11" font-weight="600">Paid</text>
            <text x="54" y="42" text-anchor="middle" fill="white" font-family="Playfair Display" font-size="18" font-weight="700">4</text>
          </svg>
        </div>
      </div>
    </div>

    <!-- Invoice List with Watermark -->
    <div class="bg-white rounded-2xl layered-shadow relative overflow-hidden">
      <!-- Watermark -->
      <div class="watermark" id="watermark">INV-2024-0042</div>

      <!-- Table Header -->
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-100" style="position:relative;z-index:1">
        <h2 class="font-display font-bold text-navy text-base">Invoices</h2>
        <div class="flex items-center gap-3 text-xs font-body">
          <span class="text-gray-400">Showing 8 of 30</span>
          <div class="flex items-center gap-1">
            <button class="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>
            <button class="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <table class="w-full" style="position:relative;z-index:1">
        <thead>
          <tr class="text-xs text-gray-400 font-body font-medium border-b border-gray-50 uppercase tracking-wider">
            <th class="text-left px-5 py-3">Invoice #</th>
            <th class="text-left px-5 py-3">Client</th>
            <th class="text-right px-5 py-3">Amount</th>
            <th class="text-center px-5 py-3">Status</th>
            <th class="text-left px-5 py-3">Date</th>
            <th class="text-left px-5 py-3">Due Date</th>
            <th class="text-center px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr class="table-row border-b border-gray-50 cursor-pointer" onclick="openDetail(0)" onmouseenter="updateWatermark('INV-2024-0042')">
            <td class="px-5 py-3.5"><span class="font-display font-semibold text-navy text-sm">INV-2024-0042</span></td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center text-navy text-xs font-bold">AC</div>
                <span class="text-sm font-medium text-gray-800 font-body">Acme Corp</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-right"><span class="font-display font-bold text-gold">$4,500.00</span></td>
            <td class="px-5 py-3.5 text-center"><span class="status-badge" style="background:#fdf6e3;color:#b8860b">Paid</span></td>
            <td class="px-5 py-3.5 text-sm text-gray-500 font-body">Jan 15, 2024</td>
            <td class="px-5 py-3.5 text-sm text-gray-500 font-body">Feb 15, 2024</td>
            <td class="px-5 py-3.5 text-center">
              <div class="row-actions flex items-center justify-center gap-2">
                <button class="text-xs text-navy font-semibold hover:underline cursor-pointer">View</button>
                <button class="text-xs text-gray-400 font-medium hover:text-navy cursor-pointer">Send Reminder</button>
              </div>
            </td>
          </tr>
          <tr class="table-row border-b border-gray-50 cursor-pointer" onclick="openDetail(1)" onmouseenter="updateWatermark('INV-2024-0041')">
            <td class="px-5 py-3.5"><span class="font-display font-semibold text-navy text-sm">INV-2024-0041</span></td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">TS</div>
                <span class="text-sm font-medium text-gray-800 font-body">TechStart Inc.</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-right"><span class="font-display font-bold text-gold">$2,800.00</span></td>
            <td class="px-5 py-3.5 text-center"><span class="status-badge" style="background:#e8eef5;color:#1e3a5f">Sent</span></td>
            <td class="px-5 py-3.5 text-sm text-gray-500 font-body">Jan 12, 2024</td>
            <td class="px-5 py-3.5 text-sm text-gray-500 font-body">Feb 12, 2024</td>
            <td class="px-5 py-3.5 text-center">
              <div class="row-actions flex items-center justify-center gap-2">
                <button class="text-xs text-navy font-semibold hover:underline cursor-pointer">View</button>
                <button class="text-xs text-gray-400 font-medium hover:text-navy cursor-pointer">Send Reminder</button>
              </div>
            </td>
          </tr>
          <tr class="table-row border-b border-gray-50 cursor-pointer" onclick="openDetail(2)" onmouseenter="updateWatermark('INV-2024-0040')">
            <td class="px-5 py-3.5"><span class="font-display font-semibold text-navy text-sm">INV-2024-0040</span></td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-xs font-bold">GC</div>
                <span class="text-sm font-medium text-gray-800 font-body">GlobalCo Ltd.</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-right"><span class="font-display font-bold text-gold">$8,200.00</span></td>
            <td class="px-5 py-3.5 text-center"><span class="status-badge" style="background:#fef2f0;color:#c0392b">Overdue</span></td>
            <td class="px-5 py-3.5 text-sm text-gray-500 font-body">Jan 8, 2024</td>
            <td class="px-5 py-3.5 text-sm text-overdue font-semibold font-body">Jan 22, 2024</td>
            <td class="px-5 py-3.5 text-center">
              <div class="row-actions flex items-center justify-center gap-2">
                <button class="text-xs text-navy font-semibold hover:underline cursor-pointer">View</button>
                <button class="text-xs text-overdue font-medium hover:underline cursor-pointer">Send Reminder</button>
              </div>
            </td>
          </tr>
          <tr class="table-row border-b border-gray-50 cursor-pointer" onclick="openDetail(3)" onmouseenter="updateWatermark('INV-2024-0039')">
            <td class="px-5 py-3.5"><span class="font-display font-semibold text-navy text-sm">INV-2024-0039</span></td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs font-bold">NV</div>
                <span class="text-sm font-medium text-gray-800 font-body">NovaTech</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-right"><span class="font-display font-bold text-gold">$3,150.00</span></td>
            <td class="px-5 py-3.5 text-center"><span class="status-badge" style="background:#e8f4fd;color:#2980b9">Viewed</span></td>
            <td class="px-5 py-3.5 text-sm text-gray-500 font-body">Jan 5, 2024</td>
            <td class="px-5 py-3.5 text-sm text-gray-500 font-body">Feb 5, 2024</td>
            <td class="px-5 py-3.5 text-center">
              <div class="row-actions flex items-center justify-center gap-2">
                <button class="text-xs text-navy font-semibold hover:underline cursor-pointer">View</button>
                <button class="text-xs text-gray-400 font-medium hover:text-navy cursor-pointer">Send Reminder</button>
              </div>
            </td>
          </tr>
          <tr class="table-row border-b border-gray-50 cursor-pointer" onclick="openDetail(4)" onmouseenter="updateWatermark('INV-2024-0038')">
            <td class="px-5 py-3.5"><span class="font-display font-semibold text-navy text-sm">INV-2024-0038</span></td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 text-xs font-bold">BW</div>
                <span class="text-sm font-medium text-gray-800 font-body">BrightWave Media</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-right"><span class="font-display font-bold text-gold">$6,750.00</span></td>
            <td class="px-5 py-3.5 text-center"><span class="status-badge" style="background:#fdf6e3;color:#b8860b">Paid</span></td>
            <td class="px-5 py-3.5 text-sm text-gray-500 font-body">Dec 28, 2023</td>
            <td class="px-5 py-3.5 text-sm text-gray-500 font-body">Jan 28, 2024</td>
            <td class="px-5 py-3.5 text-center">
              <div class="row-actions flex items-center justify-center gap-2">
                <button class="text-xs text-navy font-semibold hover:underline cursor-pointer">View</button>
                <button class="text-xs text-gray-400 font-medium hover:text-navy cursor-pointer">Send Reminder</button>
              </div>
            </td>
          </tr>
          <tr class="table-row border-b border-gray-50 cursor-pointer" onclick="openDetail(5)" onmouseenter="updateWatermark('INV-2024-0037')">
            <td class="px-5 py-3.5"><span class="font-display font-semibold text-navy text-sm">INV-2024-0037</span></td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 text-xs font-bold">SP</div>
                <span class="text-sm font-medium text-gray-800 font-body">Stellar Partners</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-right"><span class="font-display font-bold text-gold">$1,920.00</span></td>
            <td class="px-5 py-3.5 text-center"><span class="status-badge" style="background:#e8eef5;color:#1e3a5f">Sent</span></td>
            <td class="px-5 py-3.5 text-sm text-gray-500 font-body">Dec 20, 2023</td>
            <td class="px-5 py-3.5 text-sm text-gray-500 font-body">Jan 20, 2024</td>
            <td class="px-5 py-3.5 text-center">
              <div class="row-actions flex items-center justify-center gap-2">
                <button class="text-xs text-navy font-semibold hover:underline cursor-pointer">View</button>
                <button class="text-xs text-gray-400 font-medium hover:text-navy cursor-pointer">Send Reminder</button>
              </div>
            </td>
          </tr>
          <tr class="table-row border-b border-gray-50 cursor-pointer" onclick="openDetail(6)" onmouseenter="updateWatermark('INV-2024-0036')">
            <td class="px-5 py-3.5"><span class="font-display font-semibold text-navy text-sm">INV-2024-0036</span></td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 text-xs font-bold">CX</div>
                <span class="text-sm font-medium text-gray-800 font-body">CloudX Systems</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-right"><span class="font-display font-bold text-gold">$5,400.00</span></td>
            <td class="px-5 py-3.5 text-center"><span class="status-badge" style="background:#fdf6e3;color:#b8860b">Paid</span></td>
            <td class="px-5 py-3.5 text-sm text-gray-500 font-body">Dec 15, 2023</td>
            <td class="px-5 py-3.5 text-sm text-gray-500 font-body">Jan 15, 2024</td>
            <td class="px-5 py-3.5 text-center">
              <div class="row-actions flex items-center justify-center gap-2">
                <button class="text-xs text-navy font-semibold hover:underline cursor-pointer">View</button>
                <button class="text-xs text-gray-400 font-medium hover:text-navy cursor-pointer">Send Reminder</button>
              </div>
            </td>
          </tr>
          <tr class="table-row cursor-pointer" onclick="openDetail(7)" onmouseenter="updateWatermark('INV-2024-0035')">
            <td class="px-5 py-3.5"><span class="font-display font-semibold text-gray-400 text-sm">INV-2024-0035</span></td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">PR</div>
                <span class="text-sm font-medium text-gray-500 font-body">Pinnacle Research</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-right"><span class="font-display font-bold text-gray-400">$2,100.00</span></td>
            <td class="px-5 py-3.5 text-center"><span class="status-badge" style="background:#f0f1f2;color:#7f8c8d">Draft</span></td>
            <td class="px-5 py-3.5 text-sm text-gray-400 font-body">Dec 10, 2023</td>
            <td class="px-5 py-3.5 text-sm text-gray-400 font-body">--</td>
            <td class="px-5 py-3.5 text-center">
              <div class="row-actions flex items-center justify-center gap-2">
                <button class="text-xs text-navy font-semibold hover:underline cursor-pointer">Edit</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Detail Panel Overlay -->
<div class="detail-overlay fixed inset-0 bg-black/20 backdrop-blur-sm" id="detailOverlay" onclick="closeDetail()" style="z-index:30"></div>

<!-- Right Detail Panel -->
<div class="detail-panel fixed top-0 right-0 h-full w-[360px] bg-white border-l border-gray-200 layered-shadow overflow-y-auto" id="detailPanel" style="z-index:40">
  <div class="p-6">
    <!-- Panel Header -->
    <div class="flex items-center justify-between mb-6">
      <span class="text-xs text-gray-400 font-body uppercase tracking-wider">Invoice Detail</span>
      <button onclick="closeDetail()" class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer">
        <svg width="16" height="16" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- Invoice Number Header -->
    <div class="mb-6">
      <h2 class="font-display font-bold text-navy text-2xl tracking-tight" id="detailInvoiceNum">INV-2024-0042</h2>
      <div class="flex items-center gap-2 mt-2">
        <span class="status-badge" id="detailStatus" style="background:#fdf6e3;color:#b8860b">Paid</span>
        <span class="text-xs text-gray-400 font-body" id="detailDate">Issued Jan 15, 2024</span>
      </div>
    </div>

    <!-- Client Details -->
    <div class="bg-surface rounded-xl p-4 mb-5">
      <div class="text-xs text-gray-400 font-body uppercase tracking-wider mb-2">Bill To</div>
      <div class="font-semibold text-gray-900 text-sm font-body" id="detailClient">Acme Corp</div>
      <div class="text-xs text-gray-500 font-body mt-1">123 Business Ave, Suite 400<br>San Francisco, CA 94102</div>
      <div class="text-xs text-navy font-medium mt-2 cursor-pointer hover:underline">billing@acmecorp.com</div>
    </div>

    <!-- Line Items -->
    <div class="mb-5">
      <div class="text-xs text-gray-400 font-body uppercase tracking-wider mb-3">Line Items</div>
      <div class="space-y-2" id="detailLineItems">
        <div class="flex justify-between items-start py-2 border-b border-gray-50">
          <div>
            <div class="text-sm font-medium text-gray-800 font-body">Web Development</div>
            <div class="text-xs text-gray-400 font-body">40 hrs @ $85/hr</div>
          </div>
          <span class="font-display font-bold text-sm text-gray-900">$3,400.00</span>
        </div>
        <div class="flex justify-between items-start py-2 border-b border-gray-50">
          <div>
            <div class="text-sm font-medium text-gray-800 font-body">UI/UX Design</div>
            <div class="text-xs text-gray-400 font-body">Fixed price</div>
          </div>
          <span class="font-display font-bold text-sm text-gray-900">$800.00</span>
        </div>
        <div class="flex justify-between items-start py-2 border-b border-gray-50">
          <div>
            <div class="text-sm font-medium text-gray-800 font-body">Hosting Setup</div>
            <div class="text-xs text-gray-400 font-body">One-time</div>
          </div>
          <span class="font-display font-bold text-sm text-gray-900">$150.00</span>
        </div>
      </div>
    </div>

    <!-- Total Calculation -->
    <div class="bg-navy/5 rounded-xl p-4 mb-5">
      <div class="flex justify-between text-sm font-body mb-1.5">
        <span class="text-gray-500">Subtotal</span>
        <span class="text-gray-800 font-medium">$4,350.00</span>
      </div>
      <div class="flex justify-between text-sm font-body mb-1.5">
        <span class="text-gray-500">Tax (3.45%)</span>
        <span class="text-gray-800 font-medium">$150.00</span>
      </div>
      <div class="border-t border-navy/10 my-2"></div>
      <div class="flex justify-between items-center">
        <span class="font-semibold text-navy font-body">Total</span>
        <span class="font-display font-bold text-gold text-xl">$4,500.00</span>
      </div>
    </div>

    <!-- Payment Status Timeline -->
    <div class="mb-4">
      <div class="text-xs text-gray-400 font-body uppercase tracking-wider mb-3">Payment Timeline</div>
      <div class="space-y-0">
        <div class="flex gap-3 relative pb-5">
          <div class="flex flex-col items-center">
            <div class="timeline-dot" style="border-color:#7f8c8d;background:#7f8c8d"></div>
            <div class="timeline-line"></div>
          </div>
          <div class="pb-1">
            <div class="text-sm font-medium text-gray-800 font-body">Invoice Created</div>
            <div class="text-xs text-gray-400 font-body">Jan 15, 2024 at 9:30 AM</div>
          </div>
        </div>
        <div class="flex gap-3 relative pb-5">
          <div class="flex flex-col items-center">
            <div class="timeline-dot" style="border-color:#1e3a5f;background:#1e3a5f"></div>
            <div class="timeline-line"></div>
          </div>
          <div class="pb-1">
            <div class="text-sm font-medium text-gray-800 font-body">Sent to Client</div>
            <div class="text-xs text-gray-400 font-body">Jan 15, 2024 at 10:15 AM</div>
          </div>
        </div>
        <div class="flex gap-3 relative pb-5">
          <div class="flex flex-col items-center">
            <div class="timeline-dot" style="border-color:#2980b9;background:#2980b9"></div>
            <div class="timeline-line"></div>
          </div>
          <div class="pb-1">
            <div class="text-sm font-medium text-gray-800 font-body">Viewed by Client</div>
            <div class="text-xs text-gray-400 font-body">Jan 16, 2024 at 2:45 PM</div>
          </div>
        </div>
        <div class="flex gap-3 relative">
          <div class="flex flex-col items-center">
            <div class="timeline-dot" style="border-color:#b8860b;background:#b8860b"></div>
          </div>
          <div>
            <div class="text-sm font-semibold text-gold font-body">Payment Received</div>
            <div class="text-xs text-gray-400 font-body">Jan 28, 2024 at 11:20 AM</div>
            <div class="text-xs text-gold font-medium mt-1">Wire Transfer - $4,500.00</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2 mt-6">
      <button class="flex-1 bg-navy text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-navy-dark transition cursor-pointer font-body">Download PDF</button>
      <button class="flex-1 bg-white border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:border-navy/30 transition cursor-pointer font-body">Duplicate</button>
    </div>
  </div>
</div>

<!-- New Invoice Modal -->
<div id="newInvoiceModal" class="fixed inset-0 z-50 hidden items-center justify-center" style="background:rgba(0,0,0,0.35);backdrop-filter:blur(4px)">
  <div class="bg-white rounded-2xl w-full max-w-lg mx-4 p-6 layered-shadow max-h-[85vh] overflow-auto">
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-display font-bold text-navy text-lg">New Invoice</h2>
      <button onclick="closeNewInvoice()" class="text-gray-400 hover:text-gray-600 cursor-pointer"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="space-y-4 font-body">
      <div>
        <label class="text-xs text-gray-500 mb-1 block font-medium">Client</label>
        <select class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40">
          <option>Acme Corp</option><option>TechStart Inc.</option><option>GlobalCo Ltd.</option><option>NovaTech</option>
        </select>
      </div>
      <div class="bg-surface rounded-xl p-4">
        <div class="text-xs text-gray-500 mb-2 font-medium">Line Items</div>
        <div class="space-y-2">
          <div class="flex gap-2"><input type="text" value="Consulting" class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/10"><input type="number" value="1" class="w-16 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-navy/10"><input type="text" value="$2,500" class="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-navy/10"></div>
        </div>
        <button class="text-xs text-navy font-semibold mt-2 hover:underline cursor-pointer">+ Add line item</button>
      </div>
      <div class="flex justify-between items-center p-3 bg-gold/10 rounded-xl">
        <span class="font-medium text-gray-700">Total</span>
        <span class="font-display text-xl font-bold text-gold">$2,500.00</span>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-gray-500 mb-1 block font-medium">Issue Date</label><input type="date" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/10"></div>
        <div><label class="text-xs text-gray-500 mb-1 block font-medium">Payment Terms</label><select class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/10"><option>Net 30</option><option>Net 15</option><option>Net 7</option><option>Due on Receipt</option></select></div>
      </div>
      <div class="flex gap-3 pt-2">
        <button onclick="closeNewInvoice()" class="flex-1 bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-200 transition cursor-pointer">Save Draft</button>
        <button onclick="closeNewInvoice()" class="flex-1 bg-navy text-white font-semibold py-3 rounded-xl hover:bg-navy-dark transition cursor-pointer">Create & Send</button>
      </div>
    </div>
  </div>
</div>

<script>
const invoices=[
  {num:'INV-2024-0042',client:'Acme Corp',amount:'$4,500.00',status:'Paid',statusBg:'#fdf6e3',statusColor:'#b8860b',date:'Jan 15, 2024',due:'Feb 15, 2024'},
  {num:'INV-2024-0041',client:'TechStart Inc.',amount:'$2,800.00',status:'Sent',statusBg:'#e8eef5',statusColor:'#1e3a5f',date:'Jan 12, 2024',due:'Feb 12, 2024'},
  {num:'INV-2024-0040',client:'GlobalCo Ltd.',amount:'$8,200.00',status:'Overdue',statusBg:'#fef2f0',statusColor:'#c0392b',date:'Jan 8, 2024',due:'Jan 22, 2024'},
  {num:'INV-2024-0039',client:'NovaTech',amount:'$3,150.00',status:'Viewed',statusBg:'#e8f4fd',statusColor:'#2980b9',date:'Jan 5, 2024',due:'Feb 5, 2024'},
  {num:'INV-2024-0038',client:'BrightWave Media',amount:'$6,750.00',status:'Paid',statusBg:'#fdf6e3',statusColor:'#b8860b',date:'Dec 28, 2023',due:'Jan 28, 2024'},
  {num:'INV-2024-0037',client:'Stellar Partners',amount:'$1,920.00',status:'Sent',statusBg:'#e8eef5',statusColor:'#1e3a5f',date:'Dec 20, 2023',due:'Jan 20, 2024'},
  {num:'INV-2024-0036',client:'CloudX Systems',amount:'$5,400.00',status:'Paid',statusBg:'#fdf6e3',statusColor:'#b8860b',date:'Dec 15, 2023',due:'Jan 15, 2024'},
  {num:'INV-2024-0035',client:'Pinnacle Research',amount:'$2,100.00',status:'Draft',statusBg:'#f0f1f2',statusColor:'#7f8c8d',date:'Dec 10, 2023',due:'--'}
];

function updateWatermark(text){
  document.getElementById('watermark').textContent=text;
}

function openDetail(idx){
  const inv=invoices[idx];
  document.getElementById('detailInvoiceNum').textContent=inv.num;
  document.getElementById('detailClient').textContent=inv.client;
  document.getElementById('detailDate').textContent='Issued '+inv.date;
  const s=document.getElementById('detailStatus');
  s.textContent=inv.status;
  s.style.background=inv.statusBg;
  s.style.color=inv.statusColor;
  document.getElementById('detailPanel').classList.add('open');
  document.getElementById('detailOverlay').classList.add('open');
  updateWatermark(inv.num);
}

function closeDetail(){
  document.getElementById('detailPanel').classList.remove('open');
  document.getElementById('detailOverlay').classList.remove('open');
}

function openNewInvoice(){
  const m=document.getElementById('newInvoiceModal');
  m.classList.remove('hidden');
  m.classList.add('flex');
}

function closeNewInvoice(){
  const m=document.getElementById('newInvoiceModal');
  m.classList.add('hidden');
  m.classList.remove('flex');
}

function highlightFunnel(idx){
  const segments=document.querySelectorAll('.funnel-segment');
  segments.forEach((s,i)=>{if(i!==idx)s.style.opacity='0.5'});
}

function unhighlightFunnel(){
  document.querySelectorAll('.funnel-segment').forEach(s=>s.style.opacity='1');
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
