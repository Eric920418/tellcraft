INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '90220197-6d0b-479a-9b90-db5807ab2568',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pulse — SaaS Analytics Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { sans: ['DM Sans', 'sans-serif'] },
      colors: {
        teal: { 50:'#f0fdfa', 100:'#ccfbf1', 200:'#99f6e4', 300:'#5eead4', 400:'#2dd4bf', 500:'#14b8a6', 600:'#0d9488', 700:'#0f766e', 800:'#115e59', 900:'#134e4a' },
        slate: { 50:'#f8fafc', 100:'#f1f5f9', 200:'#e2e8f0', 300:'#cbd5e1', 400:'#94a3b8', 500:'#64748b', 600:'#475569', 700:'#334155', 800:'#1e293b', 900:'#0f172a' }
      }
    }
  }
}
</script>
<style>
* { margin:0; padding:0; box-sizing:border-box }
body { font-family:'DM Sans',sans-serif; background:#f8fafc; color:#0f172a }

/* Layered shadow depth strategy */
.layer-shadow { box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.04); }
.layer-shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.05); }
.layer-shadow-lg { box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08), 0 20px 44px rgba(0,0,0,0.06); }

/* Pulse dot animation */
@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.8); opacity: 0.3; }
}
@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.5); opacity: 0; }
}
.pulse-dot { position: relative; }
.pulse-dot::before {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 8px; height: 8px;
  margin: -4px 0 0 -4px;
  background: #0d9488;
  border-radius: 50%;
  animation: pulse-dot 2s ease-in-out infinite;
}
.pulse-dot::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 8px; height: 8px;
  margin: -4px 0 0 -4px;
  border: 2px solid #0d9488;
  border-radius: 50%;
  animation: pulse-ring 2s ease-out infinite;
}

/* SVG ring animation */
@keyframes ring-fill {
  from { stroke-dashoffset: var(--circumference); }
  to { stroke-dashoffset: var(--target-offset); }
}
.ring-animate {
  animation: ring-fill 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* Filter pill */
.filter-pill {
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;
}
.filter-pill:hover { background: #f0fdfa; border-color: #0d9488; color: #0d9488; }
.filter-pill.active { background: #f0fdfa; border-color: #0d9488; color: #0d9488; }

/* Funnel bar animation */
@keyframes funnel-grow {
  from { width: 0; }
  to { width: var(--target-width); }
}
.funnel-bar { animation: funnel-grow 1s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

/* Fade in */
.fade-in { opacity: 0; transform: translateY(12px); transition: opacity 0.6s ease, transform 0.6s ease; }
.fade-in.visible { opacity: 1; transform: translateY(0); }

/* Activity dot */
.activity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* Live toggle */
.live-toggle { position: relative; width: 36px; height: 20px; border-radius: 10px; cursor: pointer; transition: background 0.3s; }
.live-toggle .knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: white; transition: transform 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.live-toggle.on { background: #0d9488; }
.live-toggle.on .knob { transform: translateX(16px); }
.live-toggle.off { background: #cbd5e1; }
</style>
</head>
<body>

<!-- Top Bar -->
<header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between layer-shadow-sm sticky top-0 z-50">
  <div class="flex items-center gap-3">
    <div class="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m-10-10h4m12 0h4"/><path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83m-14.14 0l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
    </div>
    <span class="text-lg font-bold text-slate-900">Pulse</span>
    <span class="text-sm text-slate-400 font-medium hidden sm:inline ml-1">SaaS Analytics</span>
  </div>
  <div class="flex items-center gap-4">
    <button onclick="handleAction('Notifications')" class="relative cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
      <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
    </button>
    <div onclick="handleAction('Profile')" class="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center cursor-pointer">
      <span class="text-xs font-bold text-teal-700">JC</span>
    </div>
  </div>
</header>

<!-- Filter Bar (KEY DIFFERENTIATOR) -->
<div class="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-3 flex-wrap layer-shadow-sm">
  <div class="filter-pill active inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-medium text-slate-600" onclick="toggleFilter(this)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    Last 30 Days
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
  </div>
  <div class="filter-pill inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-medium text-slate-600" onclick="toggleFilter(this)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    All Channels
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
  </div>
  <div class="filter-pill inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-medium text-slate-600" onclick="toggleFilter(this)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10"/></svg>
    All Regions
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
  </div>
  <div class="filter-pill inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-medium text-slate-600" onclick="toggleFilter(this)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
    All Devices
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
  </div>
  <div class="ml-auto flex items-center gap-2">
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200">
      <span class="relative w-2 h-2">
        <span class="absolute inset-0 bg-teal-500 rounded-full animate-ping opacity-60"></span>
        <span class="absolute inset-0 bg-teal-500 rounded-full"></span>
      </span>
      <span class="text-xs font-semibold text-teal-700">Live</span>
    </div>
    <div id="liveToggle" class="live-toggle on" onclick="toggleLive()">
      <div class="knob"></div>
    </div>
  </div>
</div>

<main class="max-w-7xl mx-auto px-6 py-8">

  <!-- KPI Ring Section -->
  <section class="mb-8 fade-in">
    <div class="flex items-center gap-2 mb-5">
      <h2 class="text-lg font-bold text-slate-800">Key Metrics</h2>
      <span class="text-xs text-slate-400 font-medium">vs. previous period</span>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">

      <!-- MRR Ring -->
      <div class="bg-white rounded-2xl p-6 layer-shadow flex flex-col items-center">
        <div class="relative w-32 h-32 mb-3">
          <svg viewBox="0 0 120 120" class="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" stroke-width="8"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke="#0d9488" stroke-width="8"
              stroke-linecap="round"
              stroke-dasharray="326.73"
              stroke-dashoffset="326.73"
              class="ring-animate"
              style="--circumference:326.73;--target-offset:71.88"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-2xl font-bold text-slate-900">$48.2k</span>
            <span class="text-xs text-teal-600 font-semibold">78%</span>
          </div>
        </div>
        <div class="text-sm font-semibold text-slate-700">MRR</div>
        <div class="text-xs text-slate-400 mt-0.5">of $62k target</div>
        <div class="flex items-center gap-1 mt-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
          <span class="text-xs font-semibold text-teal-600">+12.3%</span>
        </div>
      </div>

      <!-- Churn Rate Ring -->
      <div class="bg-white rounded-2xl p-6 layer-shadow flex flex-col items-center">
        <div class="relative w-32 h-32 mb-3">
          <svg viewBox="0 0 120 120" class="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" stroke-width="8"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke="#22c55e" stroke-width="8"
              stroke-linecap="round"
              stroke-dasharray="326.73"
              stroke-dashoffset="326.73"
              class="ring-animate"
              style="--circumference:326.73;--target-offset:49.01"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-2xl font-bold text-slate-900">2.1%</span>
            <span class="text-xs text-green-600 font-semibold">85%</span>
          </div>
        </div>
        <div class="text-sm font-semibold text-slate-700">Churn Rate</div>
        <div class="text-xs text-slate-400 mt-0.5">85% healthy</div>
        <div class="flex items-center gap-1 mt-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
          <span class="text-xs font-semibold text-green-600">-0.4%</span>
        </div>
      </div>

      <!-- NPS Score Ring -->
      <div class="bg-white rounded-2xl p-6 layer-shadow flex flex-col items-center">
        <div class="relative w-32 h-32 mb-3">
          <svg viewBox="0 0 120 120" class="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" stroke-width="8"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke="#f59e0b" stroke-width="8"
              stroke-linecap="round"
              stroke-dasharray="326.73"
              stroke-dashoffset="326.73"
              class="ring-animate"
              style="--circumference:326.73;--target-offset:32.67"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-2xl font-bold text-slate-900">72</span>
            <span class="text-xs text-amber-600 font-semibold">90%</span>
          </div>
        </div>
        <div class="text-sm font-semibold text-slate-700">NPS Score</div>
        <div class="text-xs text-slate-400 mt-0.5">90th percentile</div>
        <div class="flex items-center gap-1 mt-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
          <span class="text-xs font-semibold text-amber-600">+6 pts</span>
        </div>
      </div>

      <!-- Active Users Ring -->
      <div class="bg-white rounded-2xl p-6 layer-shadow flex flex-col items-center">
        <div class="relative w-32 h-32 mb-3">
          <svg viewBox="0 0 120 120" class="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" stroke-width="8"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke="#0d9488" stroke-width="8"
              stroke-linecap="round"
              stroke-dasharray="326.73"
              stroke-dashoffset="326.73"
              class="ring-animate"
              style="--circumference:326.73;--target-offset:114.35"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-2xl font-bold text-slate-900">12.4k</span>
            <span class="text-xs text-teal-600 font-semibold">65%</span>
          </div>
        </div>
        <div class="text-sm font-semibold text-slate-700">Active Users</div>
        <div class="text-xs text-slate-400 mt-0.5">65% growth target</div>
        <div class="flex items-center gap-1 mt-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
          <span class="text-xs font-semibold text-teal-600">+23.1%</span>
        </div>
      </div>

    </div>
  </section>

  <!-- Middle Section: Chart + Funnel -->
  <section class="grid lg:grid-cols-2 gap-6 mb-8">

    <!-- Line Chart (Live Traffic) -->
    <div class="bg-white rounded-2xl p-6 layer-shadow fade-in">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-bold text-slate-800">Live Traffic</h3>
          <span class="relative w-2 h-2 pulse-dot"></span>
        </div>
        <div class="flex items-center gap-2 text-xs text-slate-400">
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-teal-500"></span>Sessions</span>
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-teal-300"></span>Page Views</span>
        </div>
      </div>
      <div class="relative h-48">
        <svg viewBox="0 0 500 180" class="w-full h-full" preserveAspectRatio="none">
          <!-- Grid lines -->
          <line x1="0" y1="45" x2="500" y2="45" stroke="#f1f5f9" stroke-width="1"/>
          <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" stroke-width="1"/>
          <line x1="0" y1="135" x2="500" y2="135" stroke="#f1f5f9" stroke-width="1"/>

          <!-- Area fill - Sessions -->
          <path d="M0,140 L35,130 L70,120 L105,115 L140,100 L175,90 L210,95 L245,70 L280,60 L315,55 L350,40 L385,45 L420,30 L455,35 L500,20 L500,180 L0,180 Z" fill="url(#tealGrad)" opacity="0.15"/>
          <!-- Line - Sessions -->
          <path d="M0,140 L35,130 L70,120 L105,115 L140,100 L175,90 L210,95 L245,70 L280,60 L315,55 L350,40 L385,45 L420,30 L455,35 L500,20" fill="none" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

          <!-- Area fill - Page Views -->
          <path d="M0,155 L35,150 L70,145 L105,140 L140,130 L175,125 L210,130 L245,110 L280,100 L315,95 L350,80 L385,85 L420,70 L455,75 L500,60 L500,180 L0,180 Z" fill="url(#tealGrad2)" opacity="0.08"/>
          <!-- Line - Page Views -->
          <path d="M0,155 L35,150 L70,145 L105,140 L140,130 L175,125 L210,130 L245,110 L280,100 L315,95 L350,80 L385,85 L420,70 L455,75 L500,60" fill="none" stroke="#5eead4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="6,4"/>

          <!-- Pulse dot at end of line -->
          <circle cx="500" cy="20" r="4" fill="#0d9488"/>
          <circle cx="500" cy="20" r="4" fill="#0d9488" opacity="0.4">
            <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/>
          </circle>

          <defs>
            <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0d9488" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#0d9488" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="tealGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#5eead4" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#5eead4" stop-opacity="0"/>
            </linearGradient>
          </defs>
        </svg>
        <!-- Y-axis labels -->
        <div class="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-400 py-1">
          <span>3k</span><span>2k</span><span>1k</span><span>0</span>
        </div>
      </div>
      <div class="flex justify-between mt-3 text-[10px] text-slate-400 px-4">
        <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>Now</span>
      </div>
      <div class="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
        <div class="flex items-center gap-1.5">
          <span class="relative w-2 h-2">
            <span class="absolute inset-0 bg-teal-500 rounded-full animate-ping opacity-50"></span>
            <span class="absolute inset-0 bg-teal-500 rounded-full"></span>
          </span>
          <span class="text-xs text-slate-500">Active now:</span>
          <span class="text-xs font-bold text-slate-800">847</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-slate-500">Peak today:</span>
          <span class="text-xs font-bold text-slate-800">2,341</span>
        </div>
      </div>
    </div>

    <!-- Conversion Funnel -->
    <div class="bg-white rounded-2xl p-6 layer-shadow fade-in">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-sm font-bold text-slate-800">Conversion Funnel</h3>
        <span class="text-xs text-slate-400 font-medium">Last 30 days</span>
      </div>
      <div class="space-y-4">
        <!-- Visitors -->
        <div class="flex items-center gap-4">
          <div class="w-20 text-right">
            <div class="text-xs font-bold text-slate-800">42,847</div>
            <div class="text-[10px] text-slate-400">Visitors</div>
          </div>
          <div class="flex-1 h-10 bg-slate-50 rounded-lg overflow-hidden relative">
            <div class="h-full bg-teal-600 rounded-lg funnel-bar" style="--target-width:100%;width:100%"></div>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white">100%</span>
          </div>
        </div>
        <!-- Signups -->
        <div class="flex items-center gap-4">
          <div class="w-20 text-right">
            <div class="text-xs font-bold text-slate-800">6,428</div>
            <div class="text-[10px] text-slate-400">Signups</div>
          </div>
          <div class="flex-1 h-10 bg-slate-50 rounded-lg overflow-hidden relative">
            <div class="h-full bg-teal-500 rounded-lg funnel-bar" style="--target-width:62%;width:62%"></div>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">15.0%</span>
          </div>
        </div>
        <!-- Activated -->
        <div class="flex items-center gap-4">
          <div class="w-20 text-right">
            <div class="text-xs font-bold text-slate-800">2,571</div>
            <div class="text-[10px] text-slate-400">Activated</div>
          </div>
          <div class="flex-1 h-10 bg-slate-50 rounded-lg overflow-hidden relative">
            <div class="h-full bg-teal-400 rounded-lg funnel-bar" style="--target-width:38%;width:38%"></div>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">6.0%</span>
          </div>
        </div>
        <!-- Paying -->
        <div class="flex items-center gap-4">
          <div class="w-20 text-right">
            <div class="text-xs font-bold text-slate-800">847</div>
            <div class="text-[10px] text-slate-400">Paying</div>
          </div>
          <div class="flex-1 h-10 bg-slate-50 rounded-lg overflow-hidden relative">
            <div class="h-full bg-teal-300 rounded-lg funnel-bar" style="--target-width:18%;width:18%"></div>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">2.0%</span>
          </div>
        </div>
      </div>
      <!-- Funnel summary -->
      <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2"><path d="M22 2L15 22l-4-9-9-4z"/></svg>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800">2.0% Overall CVR</div>
            <div class="text-[10px] text-teal-600 font-medium">+0.3% vs last month</div>
          </div>
        </div>
        <button onclick="handleAction('View full funnel')" class="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer">Details &rarr;</button>
      </div>
    </div>

  </section>

  <!-- Activity Feed -->
  <section class="bg-white rounded-2xl p-6 layer-shadow fade-in">
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-bold text-slate-800">Activity Feed</h3>
        <span class="relative w-2 h-2 pulse-dot"></span>
      </div>
      <button onclick="handleAction('View all activity')" class="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer">View all</button>
    </div>
    <div class="relative">
      <!-- Timeline line -->
      <div class="absolute left-[3px] top-2 bottom-2 w-px bg-slate-200"></div>

      <div class="space-y-5">
        <!-- Item 1 -->
        <div class="flex gap-4 items-start pl-6 relative">
          <div class="activity-dot bg-teal-500 absolute left-0 top-1.5"></div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-800">New enterprise signup</span>
              <span class="relative w-1.5 h-1.5">
                <span class="absolute inset-0 bg-teal-500 rounded-full animate-ping opacity-50"></span>
                <span class="absolute inset-0 bg-teal-500 rounded-full"></span>
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">Acme Corp upgraded to Enterprise plan ($2,400/yr)</p>
          </div>
          <span class="text-[10px] text-slate-400 whitespace-nowrap">2 min ago</span>
        </div>

        <!-- Item 2 -->
        <div class="flex gap-4 items-start pl-6 relative">
          <div class="activity-dot bg-green-500 absolute left-0 top-1.5"></div>
          <div class="flex-1">
            <span class="text-xs font-semibold text-slate-800">MRR milestone reached</span>
            <p class="text-[11px] text-slate-500 mt-0.5">Monthly recurring revenue exceeded $48k target</p>
          </div>
          <span class="text-[10px] text-slate-400 whitespace-nowrap">18 min ago</span>
        </div>

        <!-- Item 3 -->
        <div class="flex gap-4 items-start pl-6 relative">
          <div class="activity-dot bg-amber-500 absolute left-0 top-1.5"></div>
          <div class="flex-1">
            <span class="text-xs font-semibold text-slate-800">Churn alert</span>
            <p class="text-[11px] text-slate-500 mt-0.5">3 accounts flagged as at-risk (inactive &gt; 14 days)</p>
          </div>
          <span class="text-[10px] text-slate-400 whitespace-nowrap">45 min ago</span>
        </div>

        <!-- Item 4 -->
        <div class="flex gap-4 items-start pl-6 relative">
          <div class="activity-dot bg-teal-400 absolute left-0 top-1.5"></div>
          <div class="flex-1">
            <span class="text-xs font-semibold text-slate-800">Campaign performance update</span>
            <p class="text-[11px] text-slate-500 mt-0.5">Q1 email campaign: 24.7% open rate, 3.2% CTR</p>
          </div>
          <span class="text-[10px] text-slate-400 whitespace-nowrap">1 hr ago</span>
        </div>

        <!-- Item 5 -->
        <div class="flex gap-4 items-start pl-6 relative">
          <div class="activity-dot bg-slate-400 absolute left-0 top-1.5"></div>
          <div class="flex-1">
            <span class="text-xs font-semibold text-slate-800">Weekly report generated</span>
            <p class="text-[11px] text-slate-500 mt-0.5">Automated analytics report sent to 12 team members</p>
          </div>
          <span class="text-[10px] text-slate-400 whitespace-nowrap">3 hrs ago</span>
        </div>
      </div>
    </div>
  </section>

</main>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-teal-200 text-slate-800 px-5 py-3 rounded-xl text-xs layer-shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-50 max-w-sm text-center"></div>

<script>
// Toast
function showToast(m) {
  const t = document.getElementById('toast');
  t.textContent = m;
  t.style.opacity = '1';
  t.style.transform = 'translate(-50%, 0)';
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translate(-50%, 8px)';
  }, 2500);
}

function handleAction(a) {
  showToast(a + ' \u2014 \u6b64\u70ba\u6a21\u677f\u5c55\u793a');
}

// Filter pill toggle
function toggleFilter(el) {
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  showToast('\u7be9\u9078\u5df2\u66f4\u65b0');
}

// Live toggle
function toggleLive() {
  const t = document.getElementById('liveToggle');
  t.classList.toggle('on');
  t.classList.toggle('off');
  showToast(t.classList.contains('on') ? 'Live mode ON' : 'Live mode OFF');
}

// Fade-in on scroll
const fadeObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(el => fadeObs.observe(el));

// Ring animation on scroll (re-trigger)
const ringObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.ring-animate').forEach(ring => {
        ring.style.animation = 'none';
        ring.offsetHeight; // force reflow
        ring.style.animation = '';
      });
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.grid.grid-cols-2').forEach(el => ringObs.observe(el));
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
