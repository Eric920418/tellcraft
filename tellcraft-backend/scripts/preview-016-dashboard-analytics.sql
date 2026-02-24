INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '34a8a641-36f0-4c60-863c-3205776ec5e2',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Analytics Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#a78bfa',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0764'
        },
        warm: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #44403c; background: #fafaf9; }
  h1, h2, h3, .font-display { font-family: 'Space Grotesk', sans-serif; }

  /* Command palette */
  .cmd-input { transition: all 0.2s ease; }
  .cmd-input:focus { box-shadow: 0 0 0 2px rgba(91, 33, 182, 0.2); }

  /* Period selector */
  .period-btn { transition: all 0.15s ease; }
  .period-btn.active { background: #5b21b6; color: #fff; }
  .period-btn:not(.active):hover { background: #f3e8ff; color: #5b21b6; }

  /* Sidebar icons */
  .icon-btn { transition: all 0.15s ease; }
  .icon-btn:hover, .icon-btn.active { background: #f3e8ff; color: #5b21b6; }
  .icon-btn.active { position: relative; }
  .icon-btn.active::before { content: ''; position: absolute; left: 0; top: 25%; bottom: 25%; width: 2px; background: #5b21b6; border-radius: 0 2px 2px 0; }

  /* Sparkline ribbon */
  .ribbon-band { transition: all 0.2s ease; }
  .ribbon-band:hover { transform: translateY(-1px); }

  /* Subtle shadows */
  .shadow-subtle { box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02); }
  .shadow-subtle-lg { box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03); }

  /* SVG animation */
  .chart-line { stroke-dasharray: 2000; stroke-dashoffset: 2000; animation: drawLine 2s ease forwards; }
  .chart-area { opacity: 0; animation: fadeInArea 1.5s ease 0.5s forwards; }
  @keyframes drawLine { to { stroke-dashoffset: 0; } }
  @keyframes fadeInArea { to { opacity: 1; } }

  /* Counter animation */
  .counter { display: inline-block; }

  /* Toast */
  .toast { position: fixed; bottom: 1.5rem; right: 1.5rem; background: #5b21b6; color: #fff; padding: 0.75rem 1.25rem; border-radius: 10px; font-size: 0.85rem; font-weight: 500; z-index: 9999; transform: translateY(120%); opacity: 0; transition: all 0.3s ease; font-family: 'Inter', sans-serif; }
  .toast.show { transform: translateY(0); opacity: 1; }

  /* Table row hover */
  .table-row { transition: background 0.15s ease; }
  .table-row:hover { background: #faf5ff; }

  /* Geo block */
  .geo-block { transition: all 0.2s ease; border-radius: 4px; }
  .geo-block:hover { transform: scale(1.05); filter: brightness(1.1); }

  @media (max-width: 768px) {
    .sidebar-collapsed { display: none; }
    .hero-chart { height: 200px !important; }
  }
</style>
</head>
<body>
<div id="toast" class="toast"></div>

<div class="flex h-screen overflow-hidden">
  <!-- Collapsed Icon Sidebar (48px) -->
  <aside class="sidebar-collapsed w-12 bg-white flex flex-col items-center shrink-0 border-r border-warm-200 py-3 gap-1">
    <!-- Logo -->
    <div class="w-8 h-8 bg-purple-700 rounded-lg flex items-center justify-center mb-4 cursor-pointer" onclick="showToast('Analytix Dashboard')">
      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
    </div>

    <!-- Nav icons -->
    <button class="icon-btn active w-9 h-9 flex items-center justify-center rounded-lg text-warm-400 cursor-pointer" onclick="showToast('Home')">
      <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
    </button>
    <button class="icon-btn w-9 h-9 flex items-center justify-center rounded-lg text-warm-400 cursor-pointer" onclick="showToast('Charts')">
      <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>
    </button>
    <button class="icon-btn w-9 h-9 flex items-center justify-center rounded-lg text-warm-400 cursor-pointer" onclick="showToast('Users')">
      <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
    </button>
    <button class="icon-btn w-9 h-9 flex items-center justify-center rounded-lg text-warm-400 cursor-pointer" onclick="showToast('Settings')">
      <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
    </button>

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- User avatar -->
    <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-[11px] font-bold cursor-pointer" onclick="showToast('Data Team - Pro Plan')">D</div>
  </aside>

  <!-- Main content -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Top bar with command palette -->
    <header class="h-12 bg-white border-b border-warm-200 flex items-center justify-between px-4 shrink-0 shadow-subtle">
      <!-- Left: mobile menu -->
      <div class="flex items-center gap-3 md:hidden">
        <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-warm-100 cursor-pointer" onclick="showToast('Menu')">
          <svg class="w-5 h-5 text-warm-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>

      <!-- Center: Command palette input -->
      <div class="flex-1 flex justify-center max-w-lg mx-auto">
        <div class="relative w-full">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
          <input id="cmdInput" type="text" placeholder="Search metrics, pages, reports..." class="cmd-input w-full pl-9 pr-16 py-2 bg-warm-50 border border-warm-200 rounded-lg text-sm text-warm-700 placeholder-warm-400 outline-none font-body" onclick="this.select()">
          <kbd class="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-warm-200 text-warm-500 text-[10px] rounded font-mono border border-warm-300">&#8984;K</kbd>
        </div>
      </div>

      <!-- Right: Period selector -->
      <div class="flex items-center gap-1 bg-warm-100 rounded-lg p-0.5">
        <button class="period-btn px-2.5 py-1 rounded-md text-[11px] font-medium text-warm-500 cursor-pointer" onclick="setPeriod(this, '7d')">7d</button>
        <button class="period-btn active px-2.5 py-1 rounded-md text-[11px] font-medium text-warm-500 cursor-pointer" onclick="setPeriod(this, '30d')">30d</button>
        <button class="period-btn px-2.5 py-1 rounded-md text-[11px] font-medium text-warm-500 cursor-pointer" onclick="setPeriod(this, '90d')">90d</button>
      </div>
    </header>

    <!-- Scrollable content -->
    <main class="flex-1 overflow-y-auto">

      <!-- HERO: Full-width area chart (SIGNATURE ELEMENT) -->
      <div class="relative w-full bg-white border-b border-warm-100" style="height: 300px;">
        <!-- Chart header overlay -->
        <div class="absolute top-0 left-0 right-0 z-10 flex items-start justify-between px-6 pt-5">
          <div>
            <h1 class="font-display text-2xl font-bold text-warm-800">$127,482</h1>
            <p class="text-sm text-warm-500 mt-0.5 font-body">Total Revenue <span class="text-purple-600 font-medium">+23.4%</span></p>
          </div>
          <div class="flex items-center gap-4 text-[11px] text-warm-400">
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 bg-purple-600 rounded-full"></span>Revenue</span>
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 bg-purple-300 rounded-full"></span>Traffic</span>
          </div>
        </div>
        <!-- SVG Hero Chart -->
        <svg id="heroChart" viewBox="0 0 1200 300" class="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="heroGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#5b21b6" stop-opacity="0.25"/>
              <stop offset="60%" stop-color="#7c3aed" stop-opacity="0.08"/>
              <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="heroGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#d8b4fe" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#d8b4fe" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- Subtle grid -->
          <line x1="0" y1="100" x2="1200" y2="100" stroke="#e7e5e4" stroke-width="0.5" stroke-dasharray="4,4"/>
          <line x1="0" y1="175" x2="1200" y2="175" stroke="#e7e5e4" stroke-width="0.5" stroke-dasharray="4,4"/>
          <line x1="0" y1="250" x2="1200" y2="250" stroke="#e7e5e4" stroke-width="0.5" stroke-dasharray="4,4"/>
          <!-- Revenue area (primary) -->
          <path class="chart-area" d="M0,220 C40,210 80,195 120,200 C160,205 200,185 240,170 C280,155 320,165 360,150 C400,135 440,125 480,130 C520,135 560,115 600,105 C640,95 680,110 720,100 C760,90 800,80 840,85 C880,90 920,75 960,70 C1000,65 1040,80 1080,72 C1120,64 1160,60 1200,55 L1200,300 L0,300 Z" fill="url(#heroGrad1)"/>
          <path class="chart-line" d="M0,220 C40,210 80,195 120,200 C160,205 200,185 240,170 C280,155 320,165 360,150 C400,135 440,125 480,130 C520,135 560,115 600,105 C640,95 680,110 720,100 C760,90 800,80 840,85 C880,90 920,75 960,70 C1000,65 1040,80 1080,72 C1120,64 1160,60 1200,55" stroke="#5b21b6" stroke-width="2.5" fill="none"/>
          <!-- Traffic area (secondary) -->
          <path class="chart-area" d="M0,250 C40,245 80,230 120,235 C160,240 200,225 240,215 C280,205 320,215 360,200 C400,190 440,180 480,185 C520,190 560,170 600,160 C640,150 680,165 720,155 C760,145 800,135 840,140 C880,145 920,130 960,125 C1000,120 1040,135 1080,128 C1120,121 1160,115 1200,110 L1200,300 L0,300 Z" fill="url(#heroGrad2)"/>
          <path class="chart-line" d="M0,250 C40,245 80,230 120,235 C160,240 200,225 240,215 C280,205 320,215 360,200 C400,190 440,180 480,185 C520,190 560,170 600,160 C640,150 680,165 720,155 C760,145 800,135 840,140 C880,145 920,130 960,125 C1000,120 1040,135 1080,128 C1120,121 1160,115 1200,110" stroke="#d8b4fe" stroke-width="2" fill="none"/>
          <!-- Highlight dots on primary line -->
          <circle cx="600" cy="105" r="4" fill="#5b21b6" stroke="#fff" stroke-width="2" class="chart-area"/>
          <circle cx="960" cy="70" r="4" fill="#5b21b6" stroke="#fff" stroke-width="2" class="chart-area"/>
          <circle cx="1200" cy="55" r="5" fill="#5b21b6" stroke="#fff" stroke-width="2" class="chart-area"/>
        </svg>
        <!-- X-axis labels -->
        <div class="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-[10px] text-warm-400 font-mono z-10">
          <span>Feb 1</span><span>Feb 5</span><span>Feb 10</span><span>Feb 15</span><span>Feb 20</span><span>Feb 24</span>
        </div>
      </div>

      <!-- Sparkline Ribbon Bands -->
      <div class="grid grid-cols-2 lg:grid-cols-4 border-b border-warm-100">
        <!-- Sessions -->
        <div class="ribbon-band flex items-center gap-3 px-5 py-3.5 border-r border-warm-100 bg-white cursor-pointer" onclick="showToast('Sessions: 284,592 (+18.3%)')">
          <div class="flex-1 min-w-0">
            <div class="text-[10px] text-warm-400 uppercase tracking-wider font-medium mb-0.5">Sessions</div>
            <div class="flex items-baseline gap-2">
              <span class="text-lg font-display font-bold text-warm-800 counter" data-target="284592" data-format="k">0</span>
              <span class="text-[10px] text-green-600 font-medium">+18.3%</span>
            </div>
          </div>
          <svg class="w-20 h-8 shrink-0" viewBox="0 0 80 32">
            <path d="M0,24 C8,22 16,18 24,20 C32,22 40,14 48,10 C56,6 64,12 72,8 L80,4" stroke="#5b21b6" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M0,24 C8,22 16,18 24,20 C32,22 40,14 48,10 C56,6 64,12 72,8 L80,4 L80,32 L0,32 Z" fill="#5b21b6" fill-opacity="0.08"/>
          </svg>
        </div>
        <!-- Bounce Rate -->
        <div class="ribbon-band flex items-center gap-3 px-5 py-3.5 border-r border-warm-100 bg-white cursor-pointer" onclick="showToast('Bounce Rate: 32.8% (+2.1%)')">
          <div class="flex-1 min-w-0">
            <div class="text-[10px] text-warm-400 uppercase tracking-wider font-medium mb-0.5">Bounce Rate</div>
            <div class="flex items-baseline gap-2">
              <span class="text-lg font-display font-bold text-warm-800">32.8%</span>
              <span class="text-[10px] text-red-500 font-medium">+2.1%</span>
            </div>
          </div>
          <svg class="w-20 h-8 shrink-0" viewBox="0 0 80 32">
            <path d="M0,20 C8,18 16,22 24,16 C32,10 40,14 48,18 C56,22 64,16 72,20 L80,18" stroke="#dc2626" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M0,20 C8,18 16,22 24,16 C32,10 40,14 48,18 C56,22 64,16 72,20 L80,18 L80,32 L0,32 Z" fill="#dc2626" fill-opacity="0.06"/>
          </svg>
        </div>
        <!-- Avg Duration -->
        <div class="ribbon-band flex items-center gap-3 px-5 py-3.5 border-r border-warm-100 bg-white cursor-pointer" onclick="showToast('Avg Duration: 4m 23s (+8.5%)')">
          <div class="flex-1 min-w-0">
            <div class="text-[10px] text-warm-400 uppercase tracking-wider font-medium mb-0.5">Avg Duration</div>
            <div class="flex items-baseline gap-2">
              <span class="text-lg font-display font-bold text-warm-800">4m 23s</span>
              <span class="text-[10px] text-green-600 font-medium">+8.5%</span>
            </div>
          </div>
          <svg class="w-20 h-8 shrink-0" viewBox="0 0 80 32">
            <path d="M0,26 C8,24 16,20 24,22 C32,24 40,16 48,12 C56,8 64,14 72,10 L80,6" stroke="#7c3aed" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M0,26 C8,24 16,20 24,22 C32,24 40,16 48,12 C56,8 64,14 72,10 L80,6 L80,32 L0,32 Z" fill="#7c3aed" fill-opacity="0.06"/>
          </svg>
        </div>
        <!-- Conversions -->
        <div class="ribbon-band flex items-center gap-3 px-5 py-3.5 bg-white cursor-pointer" onclick="showToast('Conversions: 3,847 (+12.6%)')">
          <div class="flex-1 min-w-0">
            <div class="text-[10px] text-warm-400 uppercase tracking-wider font-medium mb-0.5">Conversions</div>
            <div class="flex items-baseline gap-2">
              <span class="text-lg font-display font-bold text-warm-800 counter" data-target="3847" data-format="comma">0</span>
              <span class="text-[10px] text-green-600 font-medium">+12.6%</span>
            </div>
          </div>
          <svg class="w-20 h-8 shrink-0" viewBox="0 0 80 32">
            <path d="M0,28 C8,26 16,24 24,22 C32,20 40,16 48,14 C56,12 64,10 72,6 L80,4" stroke="#5b21b6" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M0,28 C8,26 16,24 24,22 C32,20 40,16 48,14 C56,12 64,10 72,6 L80,4 L80,32 L0,32 Z" fill="#5b21b6" fill-opacity="0.08"/>
          </svg>
        </div>
      </div>

      <!-- Bottom section: 2-column grid -->
      <div class="grid lg:grid-cols-2 gap-0">
        <!-- Left: Top Pages Table -->
        <div class="p-6 border-r border-warm-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display text-sm font-semibold text-warm-800">Top Pages</h2>
            <button onclick="showToast('View all pages')" class="text-[11px] text-purple-600 font-medium cursor-pointer hover:text-purple-800">View all</button>
          </div>
          <div class="shadow-subtle rounded-lg border border-warm-100 overflow-hidden">
            <!-- Table header -->
            <div class="grid grid-cols-12 gap-2 px-4 py-2 bg-warm-50 text-[10px] text-warm-400 uppercase tracking-wider font-medium">
              <div class="col-span-1">#</div>
              <div class="col-span-5">Page</div>
              <div class="col-span-3 text-right">Views</div>
              <div class="col-span-3 text-right">Bounce</div>
            </div>
            <!-- Rows -->
            <div class="table-row grid grid-cols-12 gap-2 px-4 py-2.5 border-t border-warm-100 items-center cursor-pointer" onclick="showToast('/ - 42,312 views')">
              <div class="col-span-1 text-[10px] text-warm-300 font-mono">01</div>
              <div class="col-span-5 text-sm font-mono text-warm-700 truncate">/</div>
              <div class="col-span-3 text-right text-sm font-mono font-medium text-warm-800">42.3K</div>
              <div class="col-span-3 text-right text-sm font-mono text-warm-500">24.1%</div>
            </div>
            <div class="table-row grid grid-cols-12 gap-2 px-4 py-2.5 border-t border-warm-100 items-center cursor-pointer" onclick="showToast('/products - 28,142 views')">
              <div class="col-span-1 text-[10px] text-warm-300 font-mono">02</div>
              <div class="col-span-5 text-sm font-mono text-warm-700 truncate">/products</div>
              <div class="col-span-3 text-right text-sm font-mono font-medium text-warm-800">28.1K</div>
              <div class="col-span-3 text-right text-sm font-mono text-warm-500">31.5%</div>
            </div>
            <div class="table-row grid grid-cols-12 gap-2 px-4 py-2.5 border-t border-warm-100 items-center cursor-pointer" onclick="showToast('/blog - 19,721 views')">
              <div class="col-span-1 text-[10px] text-warm-300 font-mono">03</div>
              <div class="col-span-5 text-sm font-mono text-warm-700 truncate">/blog</div>
              <div class="col-span-3 text-right text-sm font-mono font-medium text-warm-800">19.7K</div>
              <div class="col-span-3 text-right text-sm font-mono text-warm-500">38.2%</div>
            </div>
            <div class="table-row grid grid-cols-12 gap-2 px-4 py-2.5 border-t border-warm-100 items-center cursor-pointer" onclick="showToast('/pricing - 15,230 views')">
              <div class="col-span-1 text-[10px] text-warm-300 font-mono">04</div>
              <div class="col-span-5 text-sm font-mono text-warm-700 truncate">/pricing</div>
              <div class="col-span-3 text-right text-sm font-mono font-medium text-warm-800">15.2K</div>
              <div class="col-span-3 text-right text-sm font-mono text-warm-500">22.8%</div>
            </div>
            <div class="table-row grid grid-cols-12 gap-2 px-4 py-2.5 border-t border-warm-100 items-center cursor-pointer" onclick="showToast('/contact - 8,917 views')">
              <div class="col-span-1 text-[10px] text-warm-300 font-mono">05</div>
              <div class="col-span-5 text-sm font-mono text-warm-700 truncate">/contact</div>
              <div class="col-span-3 text-right text-sm font-mono font-medium text-warm-800">8.9K</div>
              <div class="col-span-3 text-right text-sm font-mono text-warm-500">45.3%</div>
            </div>
            <div class="table-row grid grid-cols-12 gap-2 px-4 py-2.5 border-t border-warm-100 items-center cursor-pointer" onclick="showToast('/docs - 7,145 views')">
              <div class="col-span-1 text-[10px] text-warm-300 font-mono">06</div>
              <div class="col-span-5 text-sm font-mono text-warm-700 truncate">/docs</div>
              <div class="col-span-3 text-right text-sm font-mono font-medium text-warm-800">7.1K</div>
              <div class="col-span-3 text-right text-sm font-mono text-warm-500">18.6%</div>
            </div>
          </div>
        </div>

        <!-- Right: Geo Heatmap -->
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display text-sm font-semibold text-warm-800">Traffic by Region</h2>
            <span class="text-[10px] text-warm-400">Top 8 countries</span>
          </div>
          <div class="shadow-subtle rounded-lg border border-warm-100 p-4">
            <!-- Geo heatmap grid -->
            <div class="grid grid-cols-4 gap-2 mb-4">
              <div class="geo-block bg-purple-700 text-white p-3 col-span-2 row-span-2 cursor-pointer flex flex-col justify-between" onclick="showToast('Taiwan: 64.2% - 182,630 sessions')">
                <span class="text-[10px] opacity-80">TW</span>
                <div>
                  <div class="text-lg font-display font-bold">64.2%</div>
                  <div class="text-[10px] opacity-70">182.6K sessions</div>
                </div>
              </div>
              <div class="geo-block bg-purple-500 text-white p-3 cursor-pointer" onclick="showToast('Japan: 12.8% - 36,428 sessions')" style="border-radius:4px;">
                <span class="text-[10px] opacity-80">JP</span>
                <div class="text-sm font-display font-bold mt-1">12.8%</div>
              </div>
              <div class="geo-block bg-purple-400 text-white p-3 cursor-pointer" onclick="showToast('USA: 8.5% - 24,190 sessions')" style="border-radius:4px;">
                <span class="text-[10px] opacity-80">US</span>
                <div class="text-sm font-display font-bold mt-1">8.5%</div>
              </div>
              <div class="geo-block bg-purple-300 text-purple-800 p-3 cursor-pointer" onclick="showToast('Hong Kong: 6.1% - 17,360 sessions')" style="border-radius:4px;">
                <span class="text-[10px] opacity-70">HK</span>
                <div class="text-sm font-display font-bold mt-1">6.1%</div>
              </div>
              <div class="geo-block bg-purple-200 text-purple-700 p-3 cursor-pointer" onclick="showToast('Singapore: 3.2% - 9,107 sessions')" style="border-radius:4px;">
                <span class="text-[10px] opacity-70">SG</span>
                <div class="text-sm font-display font-bold mt-1">3.2%</div>
              </div>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <div class="geo-block bg-purple-100 text-purple-600 p-2.5 cursor-pointer" onclick="showToast('Korea: 2.1%')" style="border-radius:4px;">
                <span class="text-[10px]">KR</span>
                <div class="text-xs font-display font-bold mt-0.5">2.1%</div>
              </div>
              <div class="geo-block bg-purple-50 text-purple-500 p-2.5 cursor-pointer" onclick="showToast('Germany: 1.4%')" style="border-radius:4px;">
                <span class="text-[10px]">DE</span>
                <div class="text-xs font-display font-bold mt-0.5">1.4%</div>
              </div>
              <div class="geo-block bg-purple-50 text-purple-500 p-2.5 cursor-pointer" onclick="showToast('UK: 0.9%')" style="border-radius:4px;">
                <span class="text-[10px]">UK</span>
                <div class="text-xs font-display font-bold mt-0.5">0.9%</div>
              </div>
              <div class="geo-block bg-warm-100 text-warm-500 p-2.5 cursor-pointer" onclick="showToast('Others: 0.8%')" style="border-radius:4px;">
                <span class="text-[10px]">Other</span>
                <div class="text-xs font-display font-bold mt-0.5">0.8%</div>
              </div>
            </div>
            <!-- Legend -->
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-warm-100">
              <div class="flex items-center gap-1">
                <div class="w-3 h-2 bg-purple-700 rounded-sm"></div>
                <div class="w-3 h-2 bg-purple-500 rounded-sm"></div>
                <div class="w-3 h-2 bg-purple-300 rounded-sm"></div>
                <div class="w-3 h-2 bg-purple-100 rounded-sm"></div>
                <span class="text-[9px] text-warm-400 ml-1">High to Low</span>
              </div>
              <span class="text-[10px] text-warm-400">Last 30 days</span>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
</div>

<script>
// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// Period selector
function setPeriod(btn, period) {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast('Period changed to ' + period);
}

// Command palette focus on Cmd+K
document.addEventListener('keydown', function(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('cmdInput').focus();
  }
});

// Animated number counters
function animateCounters() {
  document.querySelectorAll('.counter').forEach(el => {
    const target = parseInt(el.dataset.target);
    const format = el.dataset.format;
    const duration = 1500;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * eased);

      if (format === 'k') {
        if (current >= 1000) {
          el.textContent = (current / 1000).toFixed(1) + 'K';
        } else {
          el.textContent = current.toLocaleString();
        }
      } else if (format === 'comma') {
        el.textContent = current.toLocaleString();
      } else {
        el.textContent = current;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  });
}

// Run counters on load
setTimeout(animateCounters, 300);
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
