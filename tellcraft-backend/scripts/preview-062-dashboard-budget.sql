INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '73695743-629f-4c08-872b-9c4a2d25c2a5',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BudgetView - Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{ocean:'#0284c7',oceanLight:'#38bdf8',oceanDark:'#0369a1',sand:'#f5f0e8',sandDark:'#d4c9b5',sandMid:'#e8dfd1',spent:'#f59e0b',spentLight:'#fef3c7',over:'#ef4444',overLight:'#fef2f2',safe:'#22c55e',safeLight:'#f0fdf4',surface:'#f8fafc'},fontFamily:{archivo:['Archivo','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Archivo',sans-serif;background:#f8fafc;overflow-x:hidden;height:100vh}

/* Water tank */
.water-tank{position:relative;width:100%;height:220px;border-radius:16px;background:linear-gradient(180deg,#e0f2fe 0%,#f0f9ff 100%);border:2px solid #bae6fd;overflow:hidden}
.water-fill{position:absolute;bottom:0;left:0;right:0;height:30%;background:linear-gradient(180deg,#38bdf8 0%,#0284c7 100%);transition:height 1s ease}
.water-surface{position:absolute;top:0;left:0;right:0;height:12px;overflow:hidden}
.water-surface::before,.water-surface::after{content:'';position:absolute;top:0;width:200%;height:100%;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 24'%3E%3Cpath d='M0 12 Q150 0 300 12 T600 12 T900 12 T1200 12 V24 H0 Z' fill='%2338bdf8'/%3E%3C/svg%3E");background-size:600px 24px;animation:wave 4s linear infinite}
.water-surface::after{animation:wave 6s linear infinite reverse;opacity:.5}
@keyframes wave{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.water-label{position:absolute;z-index:10;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center}
.tank-mark{position:absolute;right:12px;font-size:11px;color:#0369a1;font-weight:600}
.tank-line{position:absolute;right:0;left:0;border-top:1px dashed #bae6fd}

/* Swim lanes */
.swim-lane{background:#fff;border-radius:12px;padding:16px 20px;border:1px solid #e2e8f0;transition:all .3s ease;cursor:pointer;overflow:hidden}
.swim-lane:hover{box-shadow:0 4px 16px rgba(2,132,199,.1);border-color:#bae6fd;transform:translateY(-1px)}
.swim-lane .details{max-height:0;overflow:hidden;transition:max-height .4s ease,opacity .3s ease;opacity:0}
.swim-lane.expanded .details{max-height:200px;opacity:1}
.lane-bar{height:10px;border-radius:99px;background:#e2e8f0;overflow:hidden;flex:1}
.lane-fill{height:100%;border-radius:99px;transition:width .8s ease}

/* Expense list */
.expense-row{transition:all .2s}
.expense-row:hover{background:#f8fafc}

/* Alert banner */
.alert-banner{animation:slideDown .5s ease}
@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}

/* Category tags */
.cat-tag{font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px}

/* Subtle card shadow */
.card{box-shadow:0 1px 3px rgba(0,0,0,.04),0 1px 2px rgba(0,0,0,.06)}
</style>
</head>
<body>

<!-- Alert Banner -->
<div class="alert-banner bg-over/10 border-b-2 border-over px-6 py-3 flex items-center gap-3">
  <svg width="20" height="20" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  <span class="text-over font-semibold text-sm">Operations is 4% over budget!</span>
  <span class="text-over/70 text-sm">$26,100 spent of $25,000 allocated &mdash; $1,100 over limit.</span>
  <button class="ml-auto text-over/50 hover:text-over text-lg leading-none">&times;</button>
</div>

<!-- Top Bar -->
<header class="bg-white border-b border-gray-100 px-6 py-4">
  <div class="flex items-center justify-between max-w-[1400px] mx-auto">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-ocean flex items-center justify-center">
        <svg width="18" height="18" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20"/><path d="M2 7h5M17 7h5M2 17h5M17 17h5"/></svg>
      </div>
      <span class="font-bold text-xl text-gray-900 tracking-tight">BudgetView</span>
    </div>

    <div class="flex items-center gap-2 bg-surface rounded-lg px-1 py-1">
      <button class="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-md hover:bg-white transition">
        <svg class="inline mr-1" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>Jan
      </button>
      <button class="text-sm text-ocean font-semibold px-4 py-1.5 rounded-md bg-white shadow-sm">February 2026</button>
      <button class="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-md hover:bg-white transition">
        Mar<svg class="inline ml-1" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>

    <div class="flex items-center gap-6">
      <div class="text-right">
        <div class="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Budget</div>
        <div class="text-lg font-bold text-gray-900">$125,000</div>
      </div>
      <div class="w-px h-10 bg-gray-200"></div>
      <div class="text-right">
        <div class="text-xs text-spent font-medium uppercase tracking-wide">Spent</div>
        <div class="text-lg font-bold text-spent">$87,400</div>
      </div>
      <div class="w-px h-10 bg-gray-200"></div>
      <div class="text-right">
        <div class="text-xs text-ocean font-medium uppercase tracking-wide">Remaining</div>
        <div class="text-lg font-bold text-ocean">$37,600</div>
      </div>
    </div>
  </div>
</header>

<div class="max-w-[1400px] mx-auto px-6 py-6 space-y-6" style="height:calc(100vh - 110px);overflow-y:auto">

  <!-- Water Level Indicator (SIGNATURE) -->
  <div class="card bg-white rounded-2xl p-6 border border-gray-100">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-gray-900">Budget Reservoir</h2>
        <p class="text-sm text-gray-400">Visual overview of remaining budget capacity</p>
      </div>
      <div class="flex items-center gap-4 text-sm">
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-ocean inline-block"></span> Available</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-sand inline-block border border-sandDark"></span> Spent</span>
      </div>
    </div>
    <div class="water-tank">
      <!-- Tank graduation marks -->
      <div class="tank-line" style="bottom:75%"><span class="tank-mark" style="bottom:2px">75%</span></div>
      <div class="tank-line" style="bottom:50%"><span class="tank-mark" style="bottom:2px">50%</span></div>
      <div class="tank-line" style="bottom:25%"><span class="tank-mark" style="bottom:2px">25%</span></div>

      <!-- Water fill (30% remaining) -->
      <div class="water-fill" style="height:30%">
        <div class="water-surface"></div>
      </div>

      <!-- Center label -->
      <div class="water-label">
        <div class="text-4xl font-black text-ocean" style="text-shadow:0 1px 8px rgba(255,255,255,.6)">30%</div>
        <div class="text-sm font-semibold text-oceanDark/80 mt-1">Remaining</div>
        <div class="text-xs text-oceanDark/60 mt-0.5">$37,600 of $125,000</div>
      </div>
    </div>
  </div>

  <!-- Swim Lane Categories -->
  <div class="card bg-white rounded-2xl p-6 border border-gray-100">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h2 class="text-lg font-bold text-gray-900">Department Budgets</h2>
        <p class="text-sm text-gray-400">Click a lane to expand details</p>
      </div>
    </div>
    <div class="space-y-3" id="swimLanes">

      <!-- Marketing: 82% - amber -->
      <div class="swim-lane" onclick="toggleLane(this)" data-dept="marketing">
        <div class="flex items-center gap-5">
          <div class="w-32 flex-shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-spentLight flex items-center justify-center">
                <svg width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <span class="font-semibold text-gray-900 text-sm">Marketing</span>
            </div>
          </div>
          <div class="lane-bar">
            <div class="lane-fill bg-spent" style="width:82%"></div>
          </div>
          <div class="w-48 flex-shrink-0 flex items-center justify-end gap-4">
            <div class="text-right">
              <div class="text-xs text-gray-400">Spent</div>
              <div class="text-sm font-bold text-spent">$24,500</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-400">Budget</div>
              <div class="text-sm font-semibold text-gray-600">$30,000</div>
            </div>
            <span class="cat-tag bg-spentLight text-spent">82%</span>
            <svg class="lane-chevron text-gray-300 transition-transform" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div class="details mt-4 pt-4 border-t border-gray-100">
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div><span class="text-gray-400 block text-xs mb-1">Remaining</span><span class="font-semibold text-ocean">$5,500</span></div>
            <div><span class="text-gray-400 block text-xs mb-1">Daily avg</span><span class="font-semibold text-gray-700">$875</span></div>
            <div><span class="text-gray-400 block text-xs mb-1">Projected</span><span class="font-semibold text-spent">$30,625</span></div>
          </div>
          <div class="mt-3 text-xs text-gray-400">Top expenses: Ad campaigns ($12,400), Events ($6,200), Content ($5,900)</div>
        </div>
      </div>

      <!-- Engineering: 69% - blue/ocean -->
      <div class="swim-lane" onclick="toggleLane(this)" data-dept="engineering">
        <div class="flex items-center gap-5">
          <div class="w-32 flex-shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-ocean/10 flex items-center justify-center">
                <svg width="16" height="16" fill="none" stroke="#0284c7" stroke-width="2" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              </div>
              <span class="font-semibold text-gray-900 text-sm">Engineering</span>
            </div>
          </div>
          <div class="lane-bar">
            <div class="lane-fill bg-ocean" style="width:69%"></div>
          </div>
          <div class="w-48 flex-shrink-0 flex items-center justify-end gap-4">
            <div class="text-right">
              <div class="text-xs text-gray-400">Spent</div>
              <div class="text-sm font-bold text-ocean">$31,200</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-400">Budget</div>
              <div class="text-sm font-semibold text-gray-600">$45,000</div>
            </div>
            <span class="cat-tag bg-ocean/10 text-ocean">69%</span>
            <svg class="lane-chevron text-gray-300 transition-transform" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div class="details mt-4 pt-4 border-t border-gray-100">
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div><span class="text-gray-400 block text-xs mb-1">Remaining</span><span class="font-semibold text-ocean">$13,800</span></div>
            <div><span class="text-gray-400 block text-xs mb-1">Daily avg</span><span class="font-semibold text-gray-700">$1,114</span></div>
            <div><span class="text-gray-400 block text-xs mb-1">Projected</span><span class="font-semibold text-ocean">$39,200</span></div>
          </div>
          <div class="mt-3 text-xs text-gray-400">Top expenses: Cloud infrastructure ($14,800), Tooling ($9,400), Contractors ($7,000)</div>
        </div>
      </div>

      <!-- Operations: 104% - RED, over budget! -->
      <div class="swim-lane border-over/30 bg-overLight/30" onclick="toggleLane(this)" data-dept="operations">
        <div class="flex items-center gap-5">
          <div class="w-32 flex-shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-overLight flex items-center justify-center">
                <svg width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              </div>
              <span class="font-semibold text-over text-sm">Operations</span>
            </div>
          </div>
          <div class="lane-bar">
            <div class="lane-fill bg-over" style="width:100%"></div>
          </div>
          <div class="w-48 flex-shrink-0 flex items-center justify-end gap-4">
            <div class="text-right">
              <div class="text-xs text-over">Spent</div>
              <div class="text-sm font-bold text-over">$26,100</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-400">Budget</div>
              <div class="text-sm font-semibold text-gray-600">$25,000</div>
            </div>
            <span class="cat-tag bg-over text-white">104%</span>
            <svg class="lane-chevron text-over/40 transition-transform" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div class="details mt-4 pt-4 border-t border-over/20">
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div><span class="text-over/60 block text-xs mb-1">Over by</span><span class="font-semibold text-over">-$1,100</span></div>
            <div><span class="text-gray-400 block text-xs mb-1">Daily avg</span><span class="font-semibold text-gray-700">$932</span></div>
            <div><span class="text-gray-400 block text-xs mb-1">Projected</span><span class="font-semibold text-over">$27,800</span></div>
          </div>
          <div class="mt-3 text-xs text-over/70">Overrun caused by: Emergency facility repair ($4,200), Unplanned vendor costs ($2,800)</div>
        </div>
      </div>

      <!-- Sales: 37% - green -->
      <div class="swim-lane" onclick="toggleLane(this)" data-dept="sales">
        <div class="flex items-center gap-5">
          <div class="w-32 flex-shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-safeLight flex items-center justify-center">
                <svg width="16" height="16" fill="none" stroke="#22c55e" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M16 8l-4 4-4-4"/></svg>
              </div>
              <span class="font-semibold text-gray-900 text-sm">Sales</span>
            </div>
          </div>
          <div class="lane-bar">
            <div class="lane-fill bg-safe" style="width:37%"></div>
          </div>
          <div class="w-48 flex-shrink-0 flex items-center justify-end gap-4">
            <div class="text-right">
              <div class="text-xs text-gray-400">Spent</div>
              <div class="text-sm font-bold text-safe">$5,600</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-400">Budget</div>
              <div class="text-sm font-semibold text-gray-600">$15,000</div>
            </div>
            <span class="cat-tag bg-safeLight text-safe">37%</span>
            <svg class="lane-chevron text-gray-300 transition-transform" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div class="details mt-4 pt-4 border-t border-gray-100">
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div><span class="text-gray-400 block text-xs mb-1">Remaining</span><span class="font-semibold text-ocean">$9,400</span></div>
            <div><span class="text-gray-400 block text-xs mb-1">Daily avg</span><span class="font-semibold text-gray-700">$200</span></div>
            <div><span class="text-gray-400 block text-xs mb-1">Projected</span><span class="font-semibold text-safe">$7,000</span></div>
          </div>
          <div class="mt-3 text-xs text-gray-400">Top expenses: Client dinners ($2,400), Travel ($1,800), CRM subscription ($1,400)</div>
        </div>
      </div>

    </div>
  </div>

  <!-- Recent Expenses -->
  <div class="card bg-white rounded-2xl p-6 border border-gray-100">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-gray-900">Recent Expenses</h2>
        <p class="text-sm text-gray-400">Latest transactions across all departments</p>
      </div>
      <button class="text-sm text-ocean font-medium hover:text-oceanDark transition cursor-pointer">View all</button>
    </div>
    <div class="divide-y divide-gray-50">
      <div class="expense-row flex items-center justify-between py-3 px-2 rounded-lg">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-overLight flex items-center justify-center">
            <svg width="14" height="14" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94L6.7 20.2a2.18 2.18 0 01-3.08-3.08l6.73-6.73A6 6 0 0117.47 2.53z"/></svg>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-900">Emergency HVAC repair</div>
            <div class="text-xs text-gray-400">Vendor: CoolAir Services</div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span class="cat-tag bg-overLight text-over">Operations</span>
          <div class="text-right">
            <div class="text-sm font-bold text-over">-$4,200</div>
            <div class="text-xs text-gray-400">Feb 22</div>
          </div>
        </div>
      </div>

      <div class="expense-row flex items-center justify-between py-3 px-2 rounded-lg">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-spentLight flex items-center justify-center">
            <svg width="14" height="14" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 00-8 0v2"/></svg>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-900">Google Ads Q1 campaign</div>
            <div class="text-xs text-gray-400">Platform: Google Ads</div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span class="cat-tag bg-spentLight text-spent">Marketing</span>
          <div class="text-right">
            <div class="text-sm font-bold text-gray-900">-$6,800</div>
            <div class="text-xs text-gray-400">Feb 20</div>
          </div>
        </div>
      </div>

      <div class="expense-row flex items-center justify-between py-3 px-2 rounded-lg">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-ocean/10 flex items-center justify-center">
            <svg width="14" height="14" fill="none" stroke="#0284c7" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-900">AWS monthly invoice</div>
            <div class="text-xs text-gray-400">Cloud infrastructure</div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span class="cat-tag bg-ocean/10 text-ocean">Engineering</span>
          <div class="text-right">
            <div class="text-sm font-bold text-gray-900">-$8,200</div>
            <div class="text-xs text-gray-400">Feb 18</div>
          </div>
        </div>
      </div>

      <div class="expense-row flex items-center justify-between py-3 px-2 rounded-lg">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-safeLight flex items-center justify-center">
            <svg width="14" height="14" fill="none" stroke="#22c55e" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-900">Client dinner - Acme Corp</div>
            <div class="text-xs text-gray-400">Restaurant: Le Bistro</div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span class="cat-tag bg-safeLight text-safe">Sales</span>
          <div class="text-right">
            <div class="text-sm font-bold text-gray-900">-$320</div>
            <div class="text-xs text-gray-400">Feb 17</div>
          </div>
        </div>
      </div>

      <div class="expense-row flex items-center justify-between py-3 px-2 rounded-lg">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-spentLight flex items-center justify-center">
            <svg width="14" height="14" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-900">Trade show booth design</div>
            <div class="text-xs text-gray-400">Vendor: ExpoDesign Co.</div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span class="cat-tag bg-spentLight text-spent">Marketing</span>
          <div class="text-right">
            <div class="text-sm font-bold text-gray-900">-$3,500</div>
            <div class="text-xs text-gray-400">Feb 15</div>
          </div>
        </div>
      </div>
    </div>
  </div>

</div>

<script>
function toggleLane(el){
  const wasExpanded=el.classList.contains('expanded');
  document.querySelectorAll('.swim-lane').forEach(l=>{
    l.classList.remove('expanded');
    l.querySelector('.lane-chevron').style.transform='rotate(0deg)';
  });
  if(!wasExpanded){
    el.classList.add('expanded');
    el.querySelector('.lane-chevron').style.transform='rotate(180deg)';
  }
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
