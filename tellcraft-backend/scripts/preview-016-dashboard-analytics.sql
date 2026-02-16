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
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        bg: '#0f1117',
        surface: '#1a1d27',
        card: '#1e2130',
        border: '#2a2d3a',
        accent: { blue:'#6366f1', cyan:'#22d3ee', green:'#34d399', orange:'#fb923c', pink:'#f472b6', red:'#f87171' }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  }
}
</script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#e2e8f0; background:#0f1117; }
  .toast { position:fixed; bottom:1.5rem; right:1.5rem; background:#6366f1; color:#fff; padding:0.75rem 1.25rem; border-radius:10px; font-size:0.85rem; font-weight:500; z-index:9999; transform:translateY(120%); opacity:0; transition:all 0.3s ease; }
  .toast.show { transform:translateY(0); opacity:1; }
  .sidebar-link { transition:all 0.15s ease; }
  .sidebar-link:hover,.sidebar-link.active { background:rgba(99,102,241,0.1); }
  .sidebar-link.active { border-left:3px solid #6366f1; }
  .stat-card { transition:all 0.2s ease; }
  .stat-card:hover { border-color:#6366f1; }
  .chart-bar { transition:height 0.8s cubic-bezier(0.22,1,0.36,1); }
  .sparkline-bar { display:inline-block; width:3px; border-radius:1px; margin-right:1px; transition:height 0.6s ease; }
  .metric-ring { transition: stroke-dashoffset 1.5s cubic-bezier(0.22,1,0.36,1); }
  @media(max-width:768px){ .sidebar-desktop{display:none;} }
</style>
</head>
<body>
<div id="toast" class="toast"></div>

<div class="flex h-screen overflow-hidden">
  <!-- Sidebar -->
  <aside class="sidebar-desktop w-60 bg-surface flex flex-col shrink-0 border-r border-border">
    <div class="px-5 h-14 flex items-center gap-2.5 border-b border-border">
      <div class="w-7 h-7 bg-accent-blue rounded-lg flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"/></svg>
      </div>
      <span class="text-white font-semibold text-sm">Analytix</span>
    </div>
    <nav class="flex-1 py-3 overflow-y-auto">
      <a href="#" class="sidebar-link active flex items-center gap-2.5 px-5 py-2 text-white text-sm cursor-pointer" onclick="showToast('總覽')">
        <svg class="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z"/><path d="M3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z"/><path d="M13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z"/><path d="M13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z"/></svg>
        總覽
      </a>
      <a href="#" class="sidebar-link flex items-center gap-2.5 px-5 py-2 text-white/40 text-sm cursor-pointer" onclick="showToast('開啟流量分析')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>
        流量分析
      </a>
      <a href="#" class="sidebar-link flex items-center gap-2.5 px-5 py-2 text-white/40 text-sm cursor-pointer" onclick="showToast('開啟轉換追蹤')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
        轉換追蹤
      </a>
      <a href="#" class="sidebar-link flex items-center gap-2.5 px-5 py-2 text-white/40 text-sm cursor-pointer" onclick="showToast('開啟用戶行為')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
        用戶行為
      </a>
      <a href="#" class="sidebar-link flex items-center gap-2.5 px-5 py-2 text-white/40 text-sm cursor-pointer" onclick="showToast('開啟即時監控')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
        即時監控
        <span class="ml-auto w-2 h-2 bg-accent-green rounded-full animate-pulse"></span>
      </a>
      <div class="px-5 mt-5 mb-2"><span class="text-[10px] text-white/20 uppercase tracking-wider">報表</span></div>
      <a href="#" class="sidebar-link flex items-center gap-2.5 px-5 py-2 text-white/40 text-sm cursor-pointer" onclick="showToast('自訂報表')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
        自訂報表
      </a>
      <a href="#" class="sidebar-link flex items-center gap-2.5 px-5 py-2 text-white/40 text-sm cursor-pointer" onclick="showToast('開啟設定')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        設定
      </a>
    </nav>
    <div class="px-5 py-3 border-t border-border flex items-center gap-2.5">
      <div class="w-7 h-7 bg-accent-blue/20 rounded-full flex items-center justify-center text-accent-blue text-[10px] font-bold">D</div>
      <div class="flex-1 min-w-0"><div class="text-xs font-medium truncate">Data Team</div><div class="text-[10px] text-white/30">Pro Plan</div></div>
    </div>
  </aside>

  <!-- Main -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Header -->
    <header class="h-14 bg-surface border-b border-border flex items-center justify-between px-5 shrink-0">
      <div class="flex items-center gap-3">
        <button class="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-card cursor-pointer" onclick="showToast('開啟選單')">
          <svg class="w-5 h-5 text-white/50" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <h1 class="text-sm font-semibold">數據總覽</h1>
        <span class="text-[10px] text-white/30 bg-card px-2 py-0.5 rounded">Live</span>
      </div>
      <div class="flex items-center gap-2">
        <select class="text-xs bg-card border border-border rounded-lg px-3 py-1.5 text-white/70 cursor-pointer outline-none">
          <option>過去 7 天</option><option>過去 30 天</option><option>過去 90 天</option>
        </select>
        <button onclick="showToast('匯出 CSV 報表')" class="bg-accent-blue hover:bg-accent-blue/80 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer">匯出</button>
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1 overflow-y-auto p-5 space-y-5">
      <!-- Metric cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat-card bg-card rounded-xl p-4 border border-border">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] text-white/40 uppercase tracking-wider">Sessions</span>
            <div class="flex gap-0.5" id="spark1"></div>
          </div>
          <div class="text-2xl font-bold text-white font-mono">284.5K</div>
          <div class="flex items-center gap-1 mt-1"><span class="text-[10px] text-accent-green font-medium font-mono">+18.3%</span><span class="text-[10px] text-white/20">vs prev</span></div>
        </div>
        <div class="stat-card bg-card rounded-xl p-4 border border-border">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] text-white/40 uppercase tracking-wider">Page Views</span>
            <div class="flex gap-0.5" id="spark2"></div>
          </div>
          <div class="text-2xl font-bold text-white font-mono">1.24M</div>
          <div class="flex items-center gap-1 mt-1"><span class="text-[10px] text-accent-green font-medium font-mono">+12.7%</span><span class="text-[10px] text-white/20">vs prev</span></div>
        </div>
        <div class="stat-card bg-card rounded-xl p-4 border border-border">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] text-white/40 uppercase tracking-wider">Bounce Rate</span>
            <div class="flex gap-0.5" id="spark3"></div>
          </div>
          <div class="text-2xl font-bold text-white font-mono">32.8%</div>
          <div class="flex items-center gap-1 mt-1"><span class="text-[10px] text-accent-red font-medium font-mono">+2.1%</span><span class="text-[10px] text-white/20">vs prev</span></div>
        </div>
        <div class="stat-card bg-card rounded-xl p-4 border border-border">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] text-white/40 uppercase tracking-wider">Avg. Duration</span>
            <div class="flex gap-0.5" id="spark4"></div>
          </div>
          <div class="text-2xl font-bold text-white font-mono">4m 23s</div>
          <div class="flex items-center gap-1 mt-1"><span class="text-[10px] text-accent-green font-medium font-mono">+8.5%</span><span class="text-[10px] text-white/20">vs prev</span></div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid lg:grid-cols-3 gap-4">
        <!-- Main area chart -->
        <div class="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h2 class="text-sm font-semibold">流量趨勢</h2>
              <p class="text-[10px] text-white/30 mt-0.5">Sessions & Page Views</p>
            </div>
            <div class="flex gap-3 text-[10px]">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 bg-accent-blue rounded-full"></span>Sessions</span>
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 bg-accent-cyan rounded-full"></span>Page Views</span>
            </div>
          </div>
          <!-- SVG Area Chart -->
          <div class="relative h-52">
            <svg viewBox="0 0 700 200" class="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6366f1" stop-opacity="0.3"/><stop offset="100%" stop-color="#6366f1" stop-opacity="0"/></linearGradient>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#22d3ee" stop-opacity="0.2"/><stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/></linearGradient>
              </defs>
              <!-- Grid lines -->
              <line x1="0" y1="50" x2="700" y2="50" stroke="#2a2d3a" stroke-width="0.5"/>
              <line x1="0" y1="100" x2="700" y2="100" stroke="#2a2d3a" stroke-width="0.5"/>
              <line x1="0" y1="150" x2="700" y2="150" stroke="#2a2d3a" stroke-width="0.5"/>
              <!-- Area 1 -->
              <path d="M0,140 C50,130 100,100 150,110 C200,120 250,80 300,70 C350,60 400,90 450,65 C500,40 550,55 600,45 C650,35 700,50 700,50 L700,200 L0,200 Z" fill="url(#grad1)"/>
              <path d="M0,140 C50,130 100,100 150,110 C200,120 250,80 300,70 C350,60 400,90 450,65 C500,40 550,55 600,45 C650,35 700,50 700,50" stroke="#6366f1" stroke-width="2" fill="none"/>
              <!-- Area 2 -->
              <path d="M0,160 C50,150 100,130 150,140 C200,150 250,120 300,110 C350,100 400,125 450,105 C500,85 550,95 600,80 C650,70 700,85 700,85 L700,200 L0,200 Z" fill="url(#grad2)"/>
              <path d="M0,160 C50,150 100,130 150,140 C200,150 250,120 300,110 C350,100 400,125 450,105 C500,85 550,95 600,80 C650,70 700,85 700,85" stroke="#22d3ee" stroke-width="2" fill="none"/>
              <!-- Dots -->
              <circle cx="300" cy="70" r="4" fill="#6366f1" stroke="#1e2130" stroke-width="2"/>
              <circle cx="450" cy="65" r="4" fill="#6366f1" stroke="#1e2130" stroke-width="2"/>
              <circle cx="600" cy="45" r="4" fill="#6366f1" stroke="#1e2130" stroke-width="2"/>
            </svg>
            <!-- Y labels -->
            <div class="absolute left-0 top-0 h-full flex flex-col justify-between text-[9px] text-white/20 font-mono py-1">
              <span>50K</span><span>35K</span><span>20K</span><span>5K</span>
            </div>
          </div>
          <div class="flex justify-between mt-2 text-[9px] text-white/20 font-mono">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        <!-- Donut + metrics -->
        <div class="bg-card rounded-xl border border-border p-5">
          <h2 class="text-sm font-semibold mb-4">流量來源</h2>
          <!-- Donut -->
          <div class="flex justify-center mb-5">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#2a2d3a" stroke-width="16"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#6366f1" stroke-width="16" stroke-dasharray="142 235" stroke-dashoffset="0" transform="rotate(-90 80 80)" class="metric-ring"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#22d3ee" stroke-width="16" stroke-dasharray="85 292" stroke-dashoffset="-142" transform="rotate(-90 80 80)" class="metric-ring"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#34d399" stroke-width="16" stroke-dasharray="60 317" stroke-dashoffset="-227" transform="rotate(-90 80 80)" class="metric-ring"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#fb923c" stroke-width="16" stroke-dasharray="45 332" stroke-dashoffset="-287" transform="rotate(-90 80 80)" class="metric-ring"/>
              <text x="80" y="76" text-anchor="middle" fill="#fff" font-size="22" font-weight="700" font-family="Inter">284K</text>
              <text x="80" y="94" text-anchor="middle" fill="#ffffff50" font-size="10" font-family="Inter">Total Sessions</text>
            </svg>
          </div>
          <div class="space-y-2.5">
            <div class="flex items-center justify-between cursor-pointer hover:bg-white/5 px-2 py-1 rounded -mx-2" onclick="showToast('有機搜尋：37.6% (106.8K)')">
              <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 bg-accent-blue rounded-sm"></span><span class="text-xs">有機搜尋</span></div>
              <div class="flex items-center gap-2"><span class="text-xs font-mono font-semibold">37.6%</span></div>
            </div>
            <div class="flex items-center justify-between cursor-pointer hover:bg-white/5 px-2 py-1 rounded -mx-2" onclick="showToast('直接流量：22.5% (64K)')">
              <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 bg-accent-cyan rounded-sm"></span><span class="text-xs">直接流量</span></div>
              <div class="flex items-center gap-2"><span class="text-xs font-mono font-semibold">22.5%</span></div>
            </div>
            <div class="flex items-center justify-between cursor-pointer hover:bg-white/5 px-2 py-1 rounded -mx-2" onclick="showToast('社群媒體：15.9% (45.2K)')">
              <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 bg-accent-green rounded-sm"></span><span class="text-xs">社群媒體</span></div>
              <div class="flex items-center gap-2"><span class="text-xs font-mono font-semibold">15.9%</span></div>
            </div>
            <div class="flex items-center justify-between cursor-pointer hover:bg-white/5 px-2 py-1 rounded -mx-2" onclick="showToast('付費廣告：11.9% (33.9K)')">
              <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 bg-accent-orange rounded-sm"></span><span class="text-xs">付費廣告</span></div>
              <div class="flex items-center gap-2"><span class="text-xs font-mono font-semibold">11.9%</span></div>
            </div>
            <div class="flex items-center justify-between cursor-pointer hover:bg-white/5 px-2 py-1 rounded -mx-2" onclick="showToast('其他來源：12.1% (34.4K)')">
              <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 bg-border rounded-sm"></span><span class="text-xs">其他</span></div>
              <div class="flex items-center gap-2"><span class="text-xs font-mono font-semibold">12.1%</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom row -->
      <div class="grid lg:grid-cols-2 gap-4">
        <!-- Top Pages -->
        <div class="bg-card rounded-xl border border-border p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold">熱門頁面</h2>
            <button onclick="showToast('查看全部頁面')" class="text-[10px] text-accent-blue cursor-pointer">查看全部</button>
          </div>
          <div class="space-y-2">
            <div class="flex items-center gap-3 text-sm cursor-pointer hover:bg-white/5 px-2 py-2 rounded -mx-2" onclick="showToast('/ — 首頁')">
              <span class="text-[10px] text-white/20 w-5 font-mono">01</span>
              <span class="flex-1 font-mono text-xs truncate">/</span>
              <span class="font-mono text-xs font-medium">42.3K</span>
              <div class="w-20 h-1.5 bg-border rounded-full"><div class="h-full bg-accent-blue rounded-full" style="width:85%"></div></div>
            </div>
            <div class="flex items-center gap-3 text-sm cursor-pointer hover:bg-white/5 px-2 py-2 rounded -mx-2" onclick="showToast('/products — 產品頁')">
              <span class="text-[10px] text-white/20 w-5 font-mono">02</span>
              <span class="flex-1 font-mono text-xs truncate">/products</span>
              <span class="font-mono text-xs font-medium">28.1K</span>
              <div class="w-20 h-1.5 bg-border rounded-full"><div class="h-full bg-accent-cyan rounded-full" style="width:56%"></div></div>
            </div>
            <div class="flex items-center gap-3 text-sm cursor-pointer hover:bg-white/5 px-2 py-2 rounded -mx-2" onclick="showToast('/blog — 部落格')">
              <span class="text-[10px] text-white/20 w-5 font-mono">03</span>
              <span class="flex-1 font-mono text-xs truncate">/blog</span>
              <span class="font-mono text-xs font-medium">19.7K</span>
              <div class="w-20 h-1.5 bg-border rounded-full"><div class="h-full bg-accent-green rounded-full" style="width:40%"></div></div>
            </div>
            <div class="flex items-center gap-3 text-sm cursor-pointer hover:bg-white/5 px-2 py-2 rounded -mx-2" onclick="showToast('/pricing — 價格頁')">
              <span class="text-[10px] text-white/20 w-5 font-mono">04</span>
              <span class="flex-1 font-mono text-xs truncate">/pricing</span>
              <span class="font-mono text-xs font-medium">15.2K</span>
              <div class="w-20 h-1.5 bg-border rounded-full"><div class="h-full bg-accent-orange rounded-full" style="width:30%"></div></div>
            </div>
            <div class="flex items-center gap-3 text-sm cursor-pointer hover:bg-white/5 px-2 py-2 rounded -mx-2" onclick="showToast('/contact — 聯絡')">
              <span class="text-[10px] text-white/20 w-5 font-mono">05</span>
              <span class="flex-1 font-mono text-xs truncate">/contact</span>
              <span class="font-mono text-xs font-medium">8.9K</span>
              <div class="w-20 h-1.5 bg-border rounded-full"><div class="h-full bg-accent-pink rounded-full" style="width:18%"></div></div>
            </div>
          </div>
        </div>

        <!-- Device & Geo -->
        <div class="bg-card rounded-xl border border-border p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold">裝置 & 地區</h2>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <!-- Devices -->
            <div>
              <h3 class="text-[10px] text-white/30 uppercase tracking-wider mb-3">裝置類型</h3>
              <div class="space-y-2.5">
                <div class="cursor-pointer" onclick="showToast('手機：58.3%')">
                  <div class="flex justify-between text-xs mb-1"><span>📱 手機</span><span class="font-mono">58.3%</span></div>
                  <div class="h-1.5 bg-border rounded-full"><div class="h-full bg-accent-blue rounded-full" style="width:58%"></div></div>
                </div>
                <div class="cursor-pointer" onclick="showToast('桌機：32.1%')">
                  <div class="flex justify-between text-xs mb-1"><span>💻 桌機</span><span class="font-mono">32.1%</span></div>
                  <div class="h-1.5 bg-border rounded-full"><div class="h-full bg-accent-cyan rounded-full" style="width:32%"></div></div>
                </div>
                <div class="cursor-pointer" onclick="showToast('平板：9.6%')">
                  <div class="flex justify-between text-xs mb-1"><span>📱 平板</span><span class="font-mono">9.6%</span></div>
                  <div class="h-1.5 bg-border rounded-full"><div class="h-full bg-accent-green rounded-full" style="width:10%"></div></div>
                </div>
              </div>
            </div>
            <!-- Geo -->
            <div>
              <h3 class="text-[10px] text-white/30 uppercase tracking-wider mb-3">地區分佈</h3>
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs cursor-pointer hover:text-white" onclick="showToast('台灣：64.2%')">
                  <span>🇹🇼 台灣</span><span class="font-mono font-medium">64.2%</span>
                </div>
                <div class="flex items-center justify-between text-xs text-white/60 cursor-pointer hover:text-white" onclick="showToast('日本：12.8%')">
                  <span>🇯🇵 日本</span><span class="font-mono">12.8%</span>
                </div>
                <div class="flex items-center justify-between text-xs text-white/60 cursor-pointer hover:text-white" onclick="showToast('美國：8.5%')">
                  <span>🇺🇸 美國</span><span class="font-mono">8.5%</span>
                </div>
                <div class="flex items-center justify-between text-xs text-white/60 cursor-pointer hover:text-white" onclick="showToast('香港：6.1%')">
                  <span>🇭🇰 香港</span><span class="font-mono">6.1%</span>
                </div>
                <div class="flex items-center justify-between text-xs text-white/60 cursor-pointer hover:text-white" onclick="showToast('其他：8.4%')">
                  <span>🌏 其他</span><span class="font-mono">8.4%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Real-time bar -->
      <div class="bg-card rounded-xl border border-border p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-semibold">即時活躍用戶</h2>
            <span class="w-2 h-2 bg-accent-green rounded-full animate-pulse"></span>
            <span class="text-accent-green text-xs font-mono font-bold">247</span>
          </div>
          <span class="text-[10px] text-white/30">最近 30 分鐘</span>
        </div>
        <div class="flex items-end gap-1 h-16" id="realtimeChart"></div>
      </div>
    </main>
  </div>
</div>

<script>
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}

// Sparklines
function createSparkline(id, color, data){
  const c = document.getElementById(id);
  if(!c)return;
  data.forEach((v,i)=>{
    const b=document.createElement('span');
    b.className='sparkline-bar';
    b.style.height=v+'px';
    b.style.background=color;
    c.appendChild(b);
  });
}
createSparkline('spark1','#6366f1',[8,12,10,15,18,14,20,16,22,18,25,20]);
createSparkline('spark2','#22d3ee',[10,8,14,12,16,20,18,22,16,24,20,26]);
createSparkline('spark3','#f87171',[14,12,16,14,18,16,14,16,18,14,16,18]);
createSparkline('spark4','#34d399',[6,10,8,14,12,16,14,18,20,16,22,18]);

// Realtime chart
function initRealtime(){
  const c=document.getElementById('realtimeChart');
  for(let i=0;i<30;i++){
    const b=document.createElement('div');
    b.className='flex-1 rounded-t-sm transition-all duration-500 cursor-pointer';
    const h=Math.floor(Math.random()*50)+10;
    b.style.height=h+'px';
    b.style.background=h>45?'#6366f1':h>30?'#6366f180':'#6366f140';
    b.onclick=()=>showToast(`${30-i} 分鐘前：${Math.floor(h*5)} 活躍用戶`);
    c.appendChild(b);
  }
}
initRealtime();

// Simulate real-time updates
setInterval(()=>{
  const c=document.getElementById('realtimeChart');
  if(!c)return;
  const bars=c.children;
  for(let i=0;i<bars.length-1;i++){
    bars[i].style.height=bars[i+1].style.height;
    bars[i].style.background=bars[i+1].style.background;
  }
  const h=Math.floor(Math.random()*50)+10;
  bars[bars.length-1].style.height=h+'px';
  bars[bars.length-1].style.background=h>45?'#6366f1':h>30?'#6366f180':'#6366f140';
},3000);
</script>

</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
