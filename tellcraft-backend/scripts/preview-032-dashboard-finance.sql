INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '753b3d03-6295-4c41-8d50-9aeee7c86f1b',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ledgerline — Business Finance Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        forest: { 50:'#f0fdf4', 100:'#dcfce7', 200:'#bbf7d0', 500:'#166534', 600:'#15803d', 700:'#166534', 800:'#14532d', 900:'#052e16' },
        beige: { 50:'#fefcf8', 100:'#fdf6e9', 200:'#f9eccc', 300:'#f0dba8' },
        expense: '#dc2626',
        income: '#166534'
      },
      fontFamily: {
        display: ['"Libre Franklin"', 'system-ui', 'sans-serif'],
        body: ['"Libre Franklin"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        layered: '0 1px 3px rgba(0,0,0,0.06), 0 6px 16px rgba(0,0,0,0.08)',
        'layered-sm': '0 1px 2px rgba(0,0,0,0.04), 0 3px 8px rgba(0,0,0,0.06)',
        'layered-lg': '0 2px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.1)'
      }
    }
  }
}
</script>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Libre Franklin', system-ui, sans-serif; background:#fefcf8; color:#1e293b; overflow-x:hidden; }

/* Tabular lining figures for numbers */
.tabnum { font-variant-numeric: tabular-nums lining-nums; letter-spacing: -0.01em; }

/* Collapsible Left Rail */
.left-rail {
  position: fixed; left:0; top:0; height:100vh; z-index:50;
  width: 56px; background: #fff; border-right: 1px solid #e8e0d4;
  display: flex; flex-direction: column; align-items: center;
  padding: 12px 0; transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
  overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.left-rail.expanded { width: 200px; align-items: flex-start; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }

.rail-logo { display:flex; align-items:center; gap:10px; padding:8px 14px; margin-bottom:20px; white-space:nowrap; width:200px; }
.rail-logo-icon { width:28px; height:28px; min-width:28px; background:#166534; border-radius:7px; display:flex; align-items:center; justify-content:center; }
.rail-logo-text { font-weight:700; font-size:15px; color:#166534; opacity:0; transition: opacity 0.2s ease 0.1s; }
.left-rail.expanded .rail-logo-text { opacity:1; }

.rail-item {
  display:flex; align-items:center; gap:12px; width:200px; padding:10px 16px;
  cursor:pointer; transition: all 0.15s ease; white-space:nowrap;
  border-left: 3px solid transparent; color:#6b7280; font-size:13px; font-weight:500;
}
.rail-item:hover { background: #f0fdf4; color:#166534; }
.rail-item.active { border-left-color:#166534; color:#166534; background:#f0fdf4; font-weight:600; }
.rail-item svg { min-width:20px; width:20px; height:20px; }
.rail-item-label { opacity:0; transition: opacity 0.2s ease 0.1s; }
.left-rail.expanded .rail-item-label { opacity:1; }

.rail-spacer { flex:1; }

/* Main content */
.main-content { margin-left:56px; padding:24px 32px; min-height:100vh; transition: margin-left 0.3s cubic-bezier(0.4,0,0.2,1); }

/* Cards */
.card { background:#fff; border:1px solid #e8e0d4; border-radius:12px; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.06), 0 6px 16px rgba(0,0,0,0.08); }

/* Stacked bar animation */
.stacked-segment { transition: width 1s cubic-bezier(0.22,1,0.36,1); }

/* Table */
.tx-row { display:grid; grid-template-columns: 100px 1fr 110px 120px 120px; gap:12px; padding:12px 16px; align-items:center; border-bottom:1px solid #f0ead6; font-size:13px; transition:background 0.15s; cursor:pointer; }
.tx-row:hover { background:#fdf6e9; }
.tx-header { font-size:11px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid #e8e0d4; cursor:default; }
.tx-header:hover { background:transparent; }

/* Timeline tooltip */
.tl-tooltip { position:absolute; background:#14532d; color:#fff; padding:6px 10px; border-radius:6px; font-size:11px; font-weight:600; white-space:nowrap; pointer-events:none; opacity:0; transition:opacity 0.2s; transform:translateX(-50%); z-index:10; }
.tl-tooltip::after { content:''; position:absolute; top:100%; left:50%; transform:translateX(-50%); border:5px solid transparent; border-top-color:#14532d; }

/* Category tags */
.cat-tag { display:inline-block; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:500; }

/* Bill card */
.bill-item { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid #f0ead6; }
.bill-item:last-child { border-bottom:none; }

/* Toast */
.toast { position:fixed; bottom:24px; right:24px; background:#166534; color:#fff; padding:12px 20px; border-radius:10px; font-size:13px; font-weight:600; z-index:9999; transform:translateY(100px); opacity:0; transition:all 0.35s ease; box-shadow:0 4px 16px rgba(22,101,52,0.3); }
.toast.show { transform:translateY(0); opacity:1; }

/* Filter buttons */
.filter-btn { padding:6px 14px; border-radius:8px; font-size:12px; font-weight:500; cursor:pointer; border:1px solid #e8e0d4; background:#fff; color:#6b7280; transition:all 0.15s; }
.filter-btn:hover { border-color:#166534; color:#166534; }
.filter-btn.active { background:#166534; color:#fff; border-color:#166534; }
</style>
</head>
<body>

<div class="toast" id="toast"></div>

<!-- Collapsible Left Rail -->
<nav class="left-rail" id="leftRail" onmouseenter="expandRail()" onmouseleave="collapseRail()">
  <div class="rail-logo">
    <div class="rail-logo-icon">
      <svg width="16" height="16" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/></svg>
    </div>
    <span class="rail-logo-text">Ledgerline</span>
  </div>

  <div class="rail-item active" onclick="showToast('Dashboard')">
    <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
    <span class="rail-item-label">Home</span>
  </div>
  <div class="rail-item" onclick="showToast('Accounts')">
    <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>
    <span class="rail-item-label">Accounts</span>
  </div>
  <div class="rail-item" onclick="showToast('Transfers')">
    <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>
    <span class="rail-item-label">Transfers</span>
  </div>
  <div class="rail-item" onclick="showToast('Bills & Payments')">
    <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
    <span class="rail-item-label">Bills</span>
  </div>
  <div class="rail-item" onclick="showToast('Reports')">
    <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
    <span class="rail-item-label">Reports</span>
  </div>

  <div class="rail-spacer"></div>

  <div class="rail-item" onclick="showToast('Settings')">
    <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
    <span class="rail-item-label">Settings</span>
  </div>
</nav>

<!-- Main Content -->
<div class="main-content" id="mainContent">

  <!-- Top Area: Account selector + Balance -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <div class="flex items-center gap-3 mb-1">
        <button onclick="toggleAccountDropdown()" id="accountBtn" class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e8e0d4] bg-white text-sm font-600 cursor-pointer hover:border-[#166534] transition-colors" style="font-weight:600;">
          Business Checking
          <svg width="12" height="12" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24"><path d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
        </button>
        <div id="accountDropdown" style="display:none;position:absolute;top:60px;left:88px;background:#fff;border:1px solid #e8e0d4;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.1);padding:6px;z-index:60;min-width:180px;">
          <div onclick="selectAccount('Business Checking')" class="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-[#f0fdf4]" style="font-weight:500;">Business Checking</div>
          <div onclick="selectAccount('Savings Account')" class="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-[#f0fdf4]" style="font-weight:500;">Savings Account</div>
          <div onclick="selectAccount('Operating Account')" class="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-[#f0fdf4]" style="font-weight:500;">Operating Account</div>
        </div>
      </div>
      <div class="flex items-baseline gap-3">
        <span class="text-4xl font-800 tabnum" style="color:#14532d; letter-spacing:-0.02em;">$127,845.32</span>
        <span class="text-sm font-600 tabnum" style="color:#166534; background:#dcfce7; padding:3px 10px; border-radius:9999px;">+$2,340 this month</span>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="showToast('Export report generated')" class="px-4 py-2 rounded-lg border border-[#e8e0d4] bg-white text-sm font-500 cursor-pointer hover:border-[#166534] hover:text-[#166534] transition-colors" style="font-weight:500;">Export</button>
      <button onclick="showToast('New transfer initiated')" class="px-4 py-2 rounded-lg bg-[#166534] text-white text-sm font-600 cursor-pointer hover:bg-[#14532d] transition-colors" style="font-weight:600;">New Transfer</button>
    </div>
  </div>

  <!-- Balance Timeline Strip (SIGNATURE) -->
  <div class="card mb-6" style="padding:16px 20px;">
    <div class="flex items-center justify-between mb-3">
      <h3 style="font-size:13px; font-weight:600; color:#64748b;">Balance Timeline &mdash; Last 30 Days</h3>
      <span class="text-xs tabnum" style="color:#94a3b8;">Hover for details</span>
    </div>
    <div style="position:relative; height:100px; cursor:crosshair;" id="timelineContainer">
      <svg width="100%" height="100" viewBox="0 0 900 100" preserveAspectRatio="none" id="timelineSvg">
        <defs>
          <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#166534" stop-opacity="0.35"/>
            <stop offset="50%" stop-color="#15803d" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.05"/>
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#15803d"/>
            <stop offset="40%" stop-color="#166534"/>
            <stop offset="60%" stop-color="#ca8a04"/>
            <stop offset="80%" stop-color="#166534"/>
            <stop offset="100%" stop-color="#166534"/>
          </linearGradient>
        </defs>
        <!-- Filled area -->
        <path d="M0,30 C30,30 50,28 90,25 C120,23 150,22 180,20 C210,18 230,15 270,12 C300,10 330,10 360,35 C390,55 410,58 450,60 C480,62 510,48 540,40 C570,35 600,32 630,28 C660,25 690,22 720,18 C750,15 780,14 810,20 C840,25 870,28 900,30 L900,100 L0,100 Z" fill="url(#balanceGrad)"/>
        <!-- Line -->
        <path d="M0,30 C30,30 50,28 90,25 C120,23 150,22 180,20 C210,18 230,15 270,12 C300,10 330,10 360,35 C390,55 410,58 450,60 C480,62 510,48 540,40 C570,35 600,32 630,28 C660,25 690,22 720,18 C750,15 780,14 810,20 C840,25 870,28 900,30" fill="none" stroke="url(#lineGrad)" stroke-width="2.5"/>
        <!-- Event dots -->
        <circle cx="270" cy="12" r="5" fill="#166534" stroke="#fff" stroke-width="2"/>
        <circle cx="360" cy="35" r="5" fill="#dc2626" stroke="#fff" stroke-width="2"/>
        <circle cx="540" cy="40" r="5" fill="#166534" stroke="#fff" stroke-width="2"/>
        <circle cx="810" cy="20" r="5" fill="#dc2626" stroke="#fff" stroke-width="2"/>
      </svg>
      <!-- Event labels -->
      <div style="position:absolute; top:-2px; left:calc(270/900*100% - 20px); font-size:10px; font-weight:600; color:#166534; white-space:nowrap;">
        <div style="background:#dcfce7; padding:1px 6px; border-radius:4px;">Invoice +$12k</div>
      </div>
      <div style="position:absolute; top:42px; left:calc(360/900*100% - 22px); font-size:10px; font-weight:600; color:#dc2626; white-space:nowrap;">
        <div style="background:#fef2f2; padding:1px 6px; border-radius:4px;">Payroll -$45k</div>
      </div>
      <div style="position:absolute; top:18px; left:calc(540/900*100% - 22px); font-size:10px; font-weight:600; color:#166534; white-space:nowrap;">
        <div style="background:#dcfce7; padding:1px 6px; border-radius:4px;">Revenue +$18k</div>
      </div>
      <div style="position:absolute; top:-2px; left:calc(810/900*100% - 18px); font-size:10px; font-weight:600; color:#dc2626; white-space:nowrap;">
        <div style="background:#fef2f2; padding:1px 6px; border-radius:4px;">Rent -$3.2k</div>
      </div>
      <!-- Hover tooltip -->
      <div class="tl-tooltip" id="tlTooltip">$130,200 &middot; Feb 14</div>
    </div>
    <!-- Timeline axis -->
    <div class="flex justify-between mt-2" style="font-size:10px; color:#94a3b8;">
      <span class="tabnum">Jan 25</span>
      <span class="tabnum">Feb 1</span>
      <span class="tabnum">Feb 8</span>
      <span class="tabnum">Feb 15</span>
      <span class="tabnum">Feb 22</span>
      <span class="tabnum">Feb 24</span>
    </div>
  </div>

  <!-- Budget Allocation + Quick Stats -->
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
    <!-- Budget Allocation: Stacked Progress Bars -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 style="font-size:14px; font-weight:700; color:#1e293b;">Budget Allocation</h3>
        <span class="tabnum" style="font-size:12px; color:#64748b; font-weight:500;">Total: $126,400</span>
      </div>

      <!-- Stacked bar overview -->
      <div style="height:28px; border-radius:8px; overflow:hidden; display:flex; margin-bottom:20px; background:#f0ead6;">
        <div class="stacked-segment" id="bar-ops" style="width:0%; background:#166534; height:100%;"></div>
        <div class="stacked-segment" id="bar-mkt" style="width:0%; background:#2563eb; height:100%;"></div>
        <div class="stacked-segment" id="bar-eqp" style="width:0%; background:#d97706; height:100%;"></div>
        <div class="stacked-segment" id="bar-oth" style="width:0%; background:#94a3b8; height:100%;"></div>
      </div>

      <!-- Individual bars -->
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center gap-2">
              <div style="width:10px; height:10px; border-radius:3px; background:#166534;"></div>
              <span style="font-size:13px; font-weight:600;">Operations</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="tabnum" style="font-size:13px; font-weight:700;">62%</span>
              <span class="tabnum" style="font-size:12px; color:#64748b;">$78,500</span>
            </div>
          </div>
          <div style="height:8px; border-radius:4px; background:#f0ead6; overflow:hidden;">
            <div class="stacked-segment" id="ibar-ops" style="width:0%; height:100%; border-radius:4px; background:#166534;"></div>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center gap-2">
              <div style="width:10px; height:10px; border-radius:3px; background:#2563eb;"></div>
              <span style="font-size:13px; font-weight:600;">Marketing</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="tabnum" style="font-size:13px; font-weight:700;">18%</span>
              <span class="tabnum" style="font-size:12px; color:#64748b;">$22,700</span>
            </div>
          </div>
          <div style="height:8px; border-radius:4px; background:#f0ead6; overflow:hidden;">
            <div class="stacked-segment" id="ibar-mkt" style="width:0%; height:100%; border-radius:4px; background:#2563eb;"></div>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center gap-2">
              <div style="width:10px; height:10px; border-radius:3px; background:#d97706;"></div>
              <span style="font-size:13px; font-weight:600;">Equipment</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="tabnum" style="font-size:13px; font-weight:700;">12%</span>
              <span class="tabnum" style="font-size:12px; color:#64748b;">$15,100</span>
            </div>
          </div>
          <div style="height:8px; border-radius:4px; background:#f0ead6; overflow:hidden;">
            <div class="stacked-segment" id="ibar-eqp" style="width:0%; height:100%; border-radius:4px; background:#d97706;"></div>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center gap-2">
              <div style="width:10px; height:10px; border-radius:3px; background:#94a3b8;"></div>
              <span style="font-size:13px; font-weight:600;">Other</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="tabnum" style="font-size:13px; font-weight:700;">8%</span>
              <span class="tabnum" style="font-size:12px; color:#64748b;">$10,100</span>
            </div>
          </div>
          <div style="height:8px; border-radius:4px; background:#f0ead6; overflow:hidden;">
            <div class="stacked-segment" id="ibar-oth" style="width:0%; height:100%; border-radius:4px; background:#94a3b8;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div style="display:grid; grid-template-rows:1fr 1fr; gap:16px;">
      <div class="card" style="display:flex; align-items:center; gap:16px;">
        <div style="width:48px; height:48px; border-radius:12px; background:#dcfce7; display:flex; align-items:center; justify-content:center;">
          <svg width="22" height="22" fill="none" stroke="#166534" stroke-width="2" viewBox="0 0 24 24"><path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>
        </div>
        <div style="flex:1;">
          <div style="font-size:12px; color:#64748b; font-weight:500; margin-bottom:2px;">Monthly Income</div>
          <div class="tabnum" style="font-size:26px; font-weight:800; color:#166534; letter-spacing:-0.02em;">$84,320</div>
          <div class="tabnum" style="font-size:11px; font-weight:600; color:#166534;">+12.3% vs last month</div>
        </div>
      </div>
      <div class="card" style="display:flex; align-items:center; gap:16px;">
        <div style="width:48px; height:48px; border-radius:12px; background:#fef2f2; display:flex; align-items:center; justify-content:center;">
          <svg width="22" height="22" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24"><path d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181"/></svg>
        </div>
        <div style="flex:1;">
          <div style="font-size:12px; color:#64748b; font-weight:500; margin-bottom:2px;">Monthly Expenses</div>
          <div class="tabnum" style="font-size:26px; font-weight:800; color:#dc2626; letter-spacing:-0.02em;">$61,980</div>
          <div class="tabnum" style="font-size:11px; font-weight:600; color:#dc2626;">+4.1% vs last month</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Recent Transactions -->
  <div class="card mb-6">
    <div class="flex items-center justify-between mb-4">
      <h3 style="font-size:14px; font-weight:700; color:#1e293b;">Recent Transactions</h3>
      <div class="flex items-center gap-2">
        <button class="filter-btn active" onclick="filterTx('all',this)">All</button>
        <button class="filter-btn" onclick="filterTx('income',this)">Income</button>
        <button class="filter-btn" onclick="filterTx('expense',this)">Expense</button>
      </div>
    </div>

    <div>
      <div class="tx-row tx-header">
        <span>Date</span>
        <span>Description</span>
        <span>Category</span>
        <span style="text-align:right;">Amount</span>
        <span style="text-align:right;">Balance</span>
      </div>

      <div class="tx-row" data-type="income" onclick="showToast('Transaction: Wire from Acme Corp')">
        <span class="tabnum" style="color:#64748b;">Feb 24</span>
        <span style="font-weight:600;">Wire Transfer &mdash; Acme Corp</span>
        <span><span class="cat-tag" style="background:#dcfce7; color:#166534;">Revenue</span></span>
        <span class="tabnum" style="text-align:right; font-weight:700; color:#166534;">+$24,500.00</span>
        <span class="tabnum" style="text-align:right; font-weight:600; color:#475569;">$127,845.32</span>
      </div>

      <div class="tx-row" data-type="expense" onclick="showToast('Transaction: AWS Invoice')">
        <span class="tabnum" style="color:#64748b;">Feb 22</span>
        <span style="font-weight:600;">AWS Monthly Invoice</span>
        <span><span class="cat-tag" style="background:#dbeafe; color:#2563eb;">Operations</span></span>
        <span class="tabnum" style="text-align:right; font-weight:700; color:#dc2626;">-$3,842.50</span>
        <span class="tabnum" style="text-align:right; font-weight:600; color:#475569;">$103,345.32</span>
      </div>

      <div class="tx-row" data-type="expense" onclick="showToast('Transaction: Payroll')">
        <span class="tabnum" style="color:#64748b;">Feb 20</span>
        <span style="font-weight:600;">Payroll &mdash; Feb Cycle</span>
        <span><span class="cat-tag" style="background:#fef9c3; color:#a16207;">Payroll</span></span>
        <span class="tabnum" style="text-align:right; font-weight:700; color:#dc2626;">-$45,200.00</span>
        <span class="tabnum" style="text-align:right; font-weight:600; color:#475569;">$107,187.82</span>
      </div>

      <div class="tx-row" data-type="income" onclick="showToast('Transaction: Client Payment')">
        <span class="tabnum" style="color:#64748b;">Feb 18</span>
        <span style="font-weight:600;">Client Payment &mdash; BlueStar LLC</span>
        <span><span class="cat-tag" style="background:#dcfce7; color:#166534;">Revenue</span></span>
        <span class="tabnum" style="text-align:right; font-weight:700; color:#166534;">+$12,800.00</span>
        <span class="tabnum" style="text-align:right; font-weight:600; color:#475569;">$152,387.82</span>
      </div>

      <div class="tx-row" data-type="expense" onclick="showToast('Transaction: Office Rent')">
        <span class="tabnum" style="color:#64748b;">Feb 15</span>
        <span style="font-weight:600;">Office Lease &mdash; Suite 420</span>
        <span><span class="cat-tag" style="background:#fef2f2; color:#dc2626;">Rent</span></span>
        <span class="tabnum" style="text-align:right; font-weight:700; color:#dc2626;">-$3,200.00</span>
        <span class="tabnum" style="text-align:right; font-weight:600; color:#475569;">$139,587.82</span>
      </div>

      <div class="tx-row" data-type="expense" onclick="showToast('Transaction: Software Subscriptions')">
        <span class="tabnum" style="color:#64748b;">Feb 12</span>
        <span style="font-weight:600;">Software Subscriptions (5)</span>
        <span><span class="cat-tag" style="background:#dbeafe; color:#2563eb;">Operations</span></span>
        <span class="tabnum" style="text-align:right; font-weight:700; color:#dc2626;">-$1,680.00</span>
        <span class="tabnum" style="text-align:right; font-weight:600; color:#475569;">$142,787.82</span>
      </div>

      <div class="tx-row" data-type="income" onclick="showToast('Transaction: Refund')">
        <span class="tabnum" style="color:#64748b;">Feb 10</span>
        <span style="font-weight:600;">Vendor Refund &mdash; Overcharge</span>
        <span><span class="cat-tag" style="background:#f0fdf4; color:#15803d;">Refund</span></span>
        <span class="tabnum" style="text-align:right; font-weight:700; color:#166534;">+$560.00</span>
        <span class="tabnum" style="text-align:right; font-weight:600; color:#475569;">$144,467.82</span>
      </div>
    </div>
  </div>

  <!-- Upcoming Bills -->
  <div class="card">
    <div class="flex items-center justify-between mb-3">
      <h3 style="font-size:14px; font-weight:700; color:#1e293b;">Upcoming Bills</h3>
      <button onclick="showToast('View all scheduled payments')" style="font-size:12px; color:#166534; background:none; border:none; cursor:pointer; font-weight:600;">View All</button>
    </div>

    <div>
      <div class="bill-item" onclick="showToast('Pay insurance now')">
        <div class="flex items-center gap-3">
          <div style="width:40px; height:40px; border-radius:10px; background:#fef2f2; display:flex; align-items:center; justify-content:center;">
            <svg width="18" height="18" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
          </div>
          <div>
            <div style="font-size:13px; font-weight:600;">Business Insurance</div>
            <div style="font-size:11px; color:#94a3b8;">Due Feb 28, 2026</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="tabnum" style="font-size:15px; font-weight:700; color:#dc2626;">$2,450.00</span>
          <span style="font-size:10px; font-weight:600; color:#dc2626; background:#fef2f2; padding:2px 8px; border-radius:9999px;">4 days</span>
        </div>
      </div>

      <div class="bill-item" onclick="showToast('Pay internet bill')">
        <div class="flex items-center gap-3">
          <div style="width:40px; height:40px; border-radius:10px; background:#dbeafe; display:flex; align-items:center; justify-content:center;">
            <svg width="18" height="18" fill="none" stroke="#2563eb" stroke-width="2" viewBox="0 0 24 24"><path d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>
          </div>
          <div>
            <div style="font-size:13px; font-weight:600;">Internet & Telecom</div>
            <div style="font-size:11px; color:#94a3b8;">Due Mar 3, 2026</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="tabnum" style="font-size:15px; font-weight:700; color:#1e293b;">$380.00</span>
          <span style="font-size:10px; font-weight:600; color:#d97706; background:#fef9c3; padding:2px 8px; border-radius:9999px;">7 days</span>
        </div>
      </div>

      <div class="bill-item" onclick="showToast('Pay office rent')">
        <div class="flex items-center gap-3">
          <div style="width:40px; height:40px; border-radius:10px; background:#f0fdf4; display:flex; align-items:center; justify-content:center;">
            <svg width="18" height="18" fill="none" stroke="#166534" stroke-width="2" viewBox="0 0 24 24"><path d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21"/></svg>
          </div>
          <div>
            <div style="font-size:13px; font-weight:600;">Office Lease &mdash; March</div>
            <div style="font-size:11px; color:#94a3b8;">Due Mar 15, 2026</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="tabnum" style="font-size:15px; font-weight:700; color:#1e293b;">$3,200.00</span>
          <span style="font-size:10px; font-weight:600; color:#166534; background:#dcfce7; padding:2px 8px; border-radius:9999px;">19 days</span>
        </div>
      </div>

      <div class="bill-item" onclick="showToast('Schedule payroll')">
        <div class="flex items-center gap-3">
          <div style="width:40px; height:40px; border-radius:10px; background:#fef9c3; display:flex; align-items:center; justify-content:center;">
            <svg width="18" height="18" fill="none" stroke="#a16207" stroke-width="2" viewBox="0 0 24 24"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
          </div>
          <div>
            <div style="font-size:13px; font-weight:600;">Payroll &mdash; March Cycle</div>
            <div style="font-size:11px; color:#94a3b8;">Due Mar 20, 2026</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="tabnum" style="font-size:15px; font-weight:700; color:#1e293b;">$45,200.00</span>
          <span style="font-size:10px; font-weight:600; color:#166534; background:#dcfce7; padding:2px 8px; border-radius:9999px;">24 days</span>
        </div>
      </div>
    </div>
  </div>

</div>

<script>
// Rail expand/collapse
function expandRail() {
  document.getElementById('leftRail').classList.add('expanded');
}
function collapseRail() {
  document.getElementById('leftRail').classList.remove('expanded');
}

// Account dropdown
function toggleAccountDropdown() {
  var dd = document.getElementById('accountDropdown');
  dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}
function selectAccount(name) {
  document.getElementById('accountBtn').innerHTML = name + ' <svg width="12" height="12" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24"><path d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>';
  document.getElementById('accountDropdown').style.display = 'none';
  showToast('Switched to ' + name);
}
document.addEventListener('click', function(e) {
  if (!e.target.closest('#accountBtn') && !e.target.closest('#accountDropdown')) {
    document.getElementById('accountDropdown').style.display = 'none';
  }
});

// Transaction filter
function filterTx(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.tx-row:not(.tx-header)').forEach(function(row) {
    if (type === 'all') { row.style.display = ''; return; }
    row.style.display = row.getAttribute('data-type') === type ? '' : 'none';
  });
}

// Balance timeline hover tooltip
(function() {
  var container = document.getElementById('timelineContainer');
  var tooltip = document.getElementById('tlTooltip');
  var balanceData = [
    { day: 'Jan 25', val: 145200 }, { day: 'Jan 28', val: 143800 },
    { day: 'Feb 1', val: 148500 }, { day: 'Feb 5', val: 152400 },
    { day: 'Feb 8', val: 155100 }, { day: 'Feb 10', val: 140200 },
    { day: 'Feb 12', val: 135800 }, { day: 'Feb 14', val: 130200 },
    { day: 'Feb 16', val: 128900 }, { day: 'Feb 18', val: 139600 },
    { day: 'Feb 20', val: 125400 }, { day: 'Feb 22', val: 124500 },
    { day: 'Feb 24', val: 127845 }
  ];
  container.addEventListener('mousemove', function(e) {
    var rect = container.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var pct = x / rect.width;
    var idx = Math.min(Math.floor(pct * balanceData.length), balanceData.length - 1);
    var d = balanceData[idx];
    tooltip.textContent = '$' + d.val.toLocaleString() + ' \u00B7 ' + d.day;
    tooltip.style.left = x + 'px';
    tooltip.style.top = '-32px';
    tooltip.style.opacity = '1';
  });
  container.addEventListener('mouseleave', function() {
    tooltip.style.opacity = '0';
  });
})();

// Animate stacked bars on load
function animateBars() {
  setTimeout(function() {
    document.getElementById('bar-ops').style.width = '62%';
    document.getElementById('bar-mkt').style.width = '18%';
    document.getElementById('bar-eqp').style.width = '12%';
    document.getElementById('bar-oth').style.width = '8%';
    document.getElementById('ibar-ops').style.width = '62%';
    document.getElementById('ibar-mkt').style.width = '18%';
    document.getElementById('ibar-eqp').style.width = '12%';
    document.getElementById('ibar-oth').style.width = '8%';
  }, 200);
}

// Toast
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}

// Init
window.addEventListener('DOMContentLoaded', animateBars);
</script>

</body>
</html>
$HTML$,
  3
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
