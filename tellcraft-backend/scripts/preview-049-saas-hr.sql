INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '103874be-108b-4286-8e12-14f5e199384e',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HR Portal — People-First Organization Platform</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{violet:'#7c3aed',violetDark:'#6d28d9',violetLight:'#a78bfa',cream:'#fdf8f0',warmWhite:'#fefcf9',warmGray:'#6b6462',warmGrayLight:'#a8a3a0',surface:'#f9f5ef',cardBg:'#ffffff',rose:'#e11d48',amber:'#d97706',teal:'#0d9488'},fontFamily:{display:['Nunito Sans','sans-serif'],body:['Nunito Sans','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:'Nunito Sans',sans-serif}
html{scroll-behavior:smooth}
body{background:#fdf8f0;color:#3d3836;overflow-x:hidden}

/* Org chart SVG animations */
@keyframes pulse-glow{
  0%,100%{opacity:0.4;filter:drop-shadow(0 0 2px #7c3aed)}
  50%{opacity:1;filter:drop-shadow(0 0 8px #a78bfa)}
}
@keyframes dash-flow{
  0%{stroke-dashoffset:20}
  100%{stroke-dashoffset:0}
}
@keyframes fade-in-up{
  from{opacity:0;transform:translateY(12px)}
  to{opacity:1;transform:translateY(0)}
}
.org-line{stroke:#c4b5fd;stroke-width:2;fill:none;stroke-dasharray:6 4;animation:dash-flow 2s linear infinite}
.org-line-solid{stroke:#c4b5fd;stroke-width:2;fill:none}
.connection-dot{fill:#7c3aed;animation:pulse-glow 2.5s ease-in-out infinite}
.org-node{animation:fade-in-up 0.5s ease-out both;cursor:pointer;transition:box-shadow 0.25s ease}
.org-node:hover{box-shadow:0 8px 24px rgba(124,58,237,0.18)!important}
.tab-btn{position:relative;padding:10px 20px;font-size:14px;font-weight:600;color:#a8a3a0;cursor:pointer;background:none;border:none;transition:color 0.2s}
.tab-btn::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:#7c3aed;transform:scaleX(0);transition:transform 0.2s}
.tab-btn.active{color:#7c3aed}
.tab-btn.active::after{transform:scaleX(1)}
.tab-btn:hover{color:#6d28d9}
.quick-action{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;cursor:pointer;transition:all 0.2s;font-size:13px;font-weight:600;color:#6b6462}
.quick-action:hover{background:rgba(124,58,237,0.08);color:#7c3aed}
.donut-label{font-size:14px;font-weight:800;fill:#3d3836}
.donut-sublabel{font-size:10px;font-weight:600;fill:#a8a3a0}
.node-detail-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.3);z-index:100;display:none;align-items:center;justify-content:center;animation:fade-in-up 0.2s ease-out}
.node-detail-overlay.show{display:flex}

/* Page transitions */
.page-section{display:none;animation:fade-in-up 0.3s ease-out}
.page-section.active{display:block}
</style>
</head>
<body>

<!-- Top Navigation Bar -->
<header class="bg-white border-b border-stone-200/60 sticky top-0 z-50" style="box-shadow:0 1px 3px rgba(0,0,0,0.04)">
  <div class="max-w-[1440px] mx-auto flex items-center justify-between px-6 h-14">
    <div class="flex items-center gap-8">
      <!-- Logo -->
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:linear-gradient(135deg,#7c3aed,#a78bfa)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" fill="white"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="white" stroke-width="1.5" fill="none"/></svg>
        </div>
        <span class="font-extrabold text-lg tracking-tight" style="color:#3d3836">HR <span style="color:#7c3aed">Portal</span></span>
      </div>
      <!-- Tab Navigation -->
      <nav class="flex items-center gap-1 h-14">
        <button onclick="switchTab('structure')" class="tab-btn active" data-tab="structure">Structure</button>
        <button onclick="switchTab('people')" class="tab-btn" data-tab="people">People</button>
        <button onclick="switchTab('payroll')" class="tab-btn" data-tab="payroll">Payroll</button>
        <button onclick="switchTab('leave')" class="tab-btn" data-tab="leave">Leave</button>
      </nav>
    </div>
    <div class="flex items-center gap-3">
      <!-- Search -->
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-warmGrayLight" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" placeholder="Search people..." class="bg-surface border border-stone-200/60 rounded-lg pl-9 pr-4 py-2 text-sm w-44 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/20 placeholder-warmGrayLight" style="font-family:'Nunito Sans'">
      </div>
      <!-- Notifications -->
      <button onclick="showToast('3 pending approvals')" class="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface transition-colors cursor-pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b6462" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="absolute top-1 right-1 w-2.5 h-2.5 bg-rose rounded-full border-2 border-white"></span>
      </button>
      <!-- Avatar -->
      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer" style="background:linear-gradient(135deg,#7c3aed,#a78bfa)">JL</div>
    </div>
  </div>
</header>

<!-- Company Overview Strip -->
<div class="bg-white border-b border-stone-200/40">
  <div class="max-w-[1440px] mx-auto px-6 py-3 flex items-center gap-8">
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold text-warmGrayLight">Total Employees</span>
      <span class="text-sm font-extrabold" style="color:#3d3836">127</span>
    </div>
    <div class="w-px h-4 bg-stone-200"></div>
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold text-warmGrayLight">New Hires This Month</span>
      <span class="text-sm font-extrabold text-violet">+8</span>
    </div>
    <div class="w-px h-4 bg-stone-200"></div>
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold text-warmGrayLight">Open Positions</span>
      <span class="text-sm font-extrabold text-amber">5</span>
    </div>
    <div class="w-px h-4 bg-stone-200"></div>
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold text-warmGrayLight">Avg Tenure</span>
      <span class="text-sm font-extrabold" style="color:#3d3836">2.3 yrs</span>
    </div>
  </div>
</div>

<!-- Main Content Area -->
<div class="max-w-[1440px] mx-auto flex">

  <!-- Main Content (org chart + donuts) -->
  <div class="flex-1 min-w-0">

    <!-- Tab: Structure (ORG CHART - DEFAULT/MAIN) -->
    <div id="tab-structure" class="page-section active">
      <div class="px-6 pt-6 pb-2">
        <h2 class="text-lg font-extrabold" style="color:#3d3836">Organization Structure</h2>
        <p class="text-xs text-warmGrayLight mt-0.5">Click any node to view details</p>
      </div>

      <!-- SVG Org Chart -->
      <div class="px-6 pb-4 overflow-x-auto">
        <div class="relative" style="min-width:900px;min-height:520px">
          <!-- SVG Connection Lines -->
          <svg class="absolute inset-0 w-full h-full" viewBox="0 0 900 520" fill="none" xmlns="http://www.w3.org/2000/svg" style="pointer-events:none;z-index:0">
            <!-- CEO to VPs -->
            <path d="M450 95 L450 140" class="org-line-solid"/>
            <path d="M450 140 L160 140" class="org-line-solid"/>
            <path d="M450 140 L450 140" class="org-line-solid"/>
            <path d="M450 140 L740 140" class="org-line-solid"/>
            <path d="M160 140 L160 170" class="org-line-solid"/>
            <path d="M450 140 L450 170" class="org-line-solid"/>
            <path d="M740 140 L740 170" class="org-line-solid"/>

            <!-- VP Engineering to dept heads -->
            <path d="M160 265 L160 300" class="org-line-solid"/>
            <path d="M160 300 L80 300" class="org-line-solid"/>
            <path d="M160 300 L240 300" class="org-line-solid"/>
            <path d="M80 300 L80 320" class="org-line-solid"/>
            <path d="M240 300 L240 320" class="org-line-solid"/>

            <!-- VP Marketing to dept heads -->
            <path d="M450 265 L450 300" class="org-line-solid"/>
            <path d="M450 300 L370 300" class="org-line-solid"/>
            <path d="M450 300 L530 300" class="org-line-solid"/>
            <path d="M370 300 L370 320" class="org-line-solid"/>
            <path d="M530 300 L530 320" class="org-line-solid"/>

            <!-- VP Operations to dept heads -->
            <path d="M740 265 L740 300" class="org-line-solid"/>
            <path d="M740 300 L660 300" class="org-line-solid"/>
            <path d="M740 300 L820 300" class="org-line-solid"/>
            <path d="M660 300 L660 320" class="org-line-solid"/>
            <path d="M820 300 L820 320" class="org-line-solid"/>

            <!-- Animated gradient overlay lines (decorative) -->
            <path d="M450 95 L450 140" class="org-line" style="animation-delay:0s"/>
            <path d="M450 140 L160 140" class="org-line" style="animation-delay:0.3s"/>
            <path d="M450 140 L740 140" class="org-line" style="animation-delay:0.6s"/>
            <path d="M160 140 L160 170" class="org-line" style="animation-delay:0.9s"/>
            <path d="M450 140 L450 170" class="org-line" style="animation-delay:0.5s"/>
            <path d="M740 140 L740 170" class="org-line" style="animation-delay:1.1s"/>

            <path d="M160 265 L160 300" class="org-line" style="animation-delay:1.2s"/>
            <path d="M160 300 L80 300" class="org-line" style="animation-delay:1.5s"/>
            <path d="M160 300 L240 300" class="org-line" style="animation-delay:1.5s"/>
            <path d="M80 300 L80 320" class="org-line" style="animation-delay:1.8s"/>
            <path d="M240 300 L240 320" class="org-line" style="animation-delay:1.8s"/>

            <path d="M450 265 L450 300" class="org-line" style="animation-delay:1.3s"/>
            <path d="M450 300 L370 300" class="org-line" style="animation-delay:1.6s"/>
            <path d="M450 300 L530 300" class="org-line" style="animation-delay:1.6s"/>
            <path d="M370 300 L370 320" class="org-line" style="animation-delay:1.9s"/>
            <path d="M530 300 L530 320" class="org-line" style="animation-delay:1.9s"/>

            <path d="M740 265 L740 300" class="org-line" style="animation-delay:1.4s"/>
            <path d="M740 300 L660 300" class="org-line" style="animation-delay:1.7s"/>
            <path d="M740 300 L820 300" class="org-line" style="animation-delay:1.7s"/>
            <path d="M660 300 L660 320" class="org-line" style="animation-delay:2.0s"/>
            <path d="M820 300 L820 320" class="org-line" style="animation-delay:2.0s"/>

            <!-- Connection dots at intersections -->
            <circle cx="450" cy="95" r="4" class="connection-dot" style="animation-delay:0s"/>
            <circle cx="450" cy="140" r="5" class="connection-dot" style="animation-delay:0.3s"/>
            <circle cx="160" cy="140" r="4" class="connection-dot" style="animation-delay:0.5s"/>
            <circle cx="740" cy="140" r="4" class="connection-dot" style="animation-delay:0.7s"/>
            <circle cx="160" cy="300" r="4" class="connection-dot" style="animation-delay:1.0s"/>
            <circle cx="450" cy="300" r="4" class="connection-dot" style="animation-delay:1.2s"/>
            <circle cx="740" cy="300" r="4" class="connection-dot" style="animation-delay:1.4s"/>
          </svg>

          <!-- CEO Node (largest) -->
          <div onclick="showNodeDetail('ceo')" class="org-node absolute bg-white rounded-2xl border border-violet/20 px-6 py-4 text-center" style="left:370px;top:10px;width:160px;box-shadow:0 4px 16px rgba(124,58,237,0.1);animation-delay:0.1s;z-index:2">
            <div class="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold" style="background:linear-gradient(135deg,#7c3aed,#a78bfa)">JL</div>
            <div class="font-extrabold text-sm" style="color:#3d3836">Jennifer Lin</div>
            <div class="text-xs text-warmGrayLight mt-0.5">Chief Executive Officer</div>
            <div class="inline-flex items-center gap-1 mt-2 bg-violet/8 text-violet text-[10px] font-bold px-2 py-0.5 rounded-full">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              127
            </div>
          </div>

          <!-- VP Engineering -->
          <div onclick="showNodeDetail('vp-eng')" class="org-node absolute bg-white rounded-xl border border-violet/15 px-4 py-3 text-center" style="left:80px;top:170px;width:160px;box-shadow:0 3px 12px rgba(124,58,237,0.08);animation-delay:0.3s;z-index:2">
            <div class="w-11 h-11 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold" style="background:#7c3aed">MC</div>
            <div class="font-bold text-sm" style="color:#3d3836">Michael Chen</div>
            <div class="text-[11px] text-warmGrayLight mt-0.5">VP Engineering</div>
            <div class="inline-flex items-center gap-1 mt-1.5 bg-violet/8 text-violet text-[10px] font-bold px-2 py-0.5 rounded-full">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              42
            </div>
          </div>

          <!-- VP Marketing -->
          <div onclick="showNodeDetail('vp-mkt')" class="org-node absolute bg-white rounded-xl border border-rose/15 px-4 py-3 text-center" style="left:370px;top:170px;width:160px;box-shadow:0 3px 12px rgba(225,29,72,0.06);animation-delay:0.4s;z-index:2">
            <div class="w-11 h-11 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold" style="background:#e11d48">SK</div>
            <div class="font-bold text-sm" style="color:#3d3836">Sarah Kim</div>
            <div class="text-[11px] text-warmGrayLight mt-0.5">VP Marketing</div>
            <div class="inline-flex items-center gap-1 mt-1.5 bg-rose/8 text-rose text-[10px] font-bold px-2 py-0.5 rounded-full">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              28
            </div>
          </div>

          <!-- VP Operations -->
          <div onclick="showNodeDetail('vp-ops')" class="org-node absolute bg-white rounded-xl border border-amber/15 px-4 py-3 text-center" style="left:660px;top:170px;width:160px;box-shadow:0 3px 12px rgba(217,119,6,0.06);animation-delay:0.5s;z-index:2">
            <div class="w-11 h-11 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold" style="background:#d97706">DW</div>
            <div class="font-bold text-sm" style="color:#3d3836">David Wang</div>
            <div class="text-[11px] text-warmGrayLight mt-0.5">VP Operations</div>
            <div class="inline-flex items-center gap-1 mt-1.5 bg-amber/8 text-amber text-[10px] font-bold px-2 py-0.5 rounded-full">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              57
            </div>
          </div>

          <!-- Dept Heads under VP Engineering -->
          <div onclick="showNodeDetail('head-fe')" class="org-node absolute bg-white rounded-lg border border-stone-200/60 px-3 py-2.5 text-center" style="left:15px;top:320px;width:130px;box-shadow:0 2px 8px rgba(0,0,0,0.04);animation-delay:0.7s;z-index:2">
            <div class="w-9 h-9 rounded-full mx-auto mb-1.5 flex items-center justify-center text-white text-xs font-bold" style="background:#8b5cf6">AZ</div>
            <div class="font-bold text-xs" style="color:#3d3836">Alex Zhang</div>
            <div class="text-[10px] text-warmGrayLight">Frontend Lead</div>
            <div class="text-[10px] font-bold text-violet mt-1">18 people</div>
          </div>

          <div onclick="showNodeDetail('head-be')" class="org-node absolute bg-white rounded-lg border border-stone-200/60 px-3 py-2.5 text-center" style="left:175px;top:320px;width:130px;box-shadow:0 2px 8px rgba(0,0,0,0.04);animation-delay:0.8s;z-index:2">
            <div class="w-9 h-9 rounded-full mx-auto mb-1.5 flex items-center justify-center text-white text-xs font-bold" style="background:#7c3aed">RL</div>
            <div class="font-bold text-xs" style="color:#3d3836">Rachel Lee</div>
            <div class="text-[10px] text-warmGrayLight">Backend Lead</div>
            <div class="text-[10px] font-bold text-violet mt-1">24 people</div>
          </div>

          <!-- Dept Heads under VP Marketing -->
          <div onclick="showNodeDetail('head-brand')" class="org-node absolute bg-white rounded-lg border border-stone-200/60 px-3 py-2.5 text-center" style="left:305px;top:320px;width:130px;box-shadow:0 2px 8px rgba(0,0,0,0.04);animation-delay:0.9s;z-index:2">
            <div class="w-9 h-9 rounded-full mx-auto mb-1.5 flex items-center justify-center text-white text-xs font-bold" style="background:#f43f5e">LH</div>
            <div class="font-bold text-xs" style="color:#3d3836">Lisa Huang</div>
            <div class="text-[10px] text-warmGrayLight">Brand Director</div>
            <div class="text-[10px] font-bold text-rose mt-1">15 people</div>
          </div>

          <div onclick="showNodeDetail('head-growth')" class="org-node absolute bg-white rounded-lg border border-stone-200/60 px-3 py-2.5 text-center" style="left:465px;top:320px;width:130px;box-shadow:0 2px 8px rgba(0,0,0,0.04);animation-delay:1.0s;z-index:2">
            <div class="w-9 h-9 rounded-full mx-auto mb-1.5 flex items-center justify-center text-white text-xs font-bold" style="background:#e11d48">TN</div>
            <div class="font-bold text-xs" style="color:#3d3836">Tom Nguyen</div>
            <div class="text-[10px] text-warmGrayLight">Growth Lead</div>
            <div class="text-[10px] font-bold text-rose mt-1">13 people</div>
          </div>

          <!-- Dept Heads under VP Operations -->
          <div onclick="showNodeDetail('head-sales')" class="org-node absolute bg-white rounded-lg border border-stone-200/60 px-3 py-2.5 text-center" style="left:595px;top:320px;width:130px;box-shadow:0 2px 8px rgba(0,0,0,0.04);animation-delay:1.1s;z-index:2">
            <div class="w-9 h-9 rounded-full mx-auto mb-1.5 flex items-center justify-center text-white text-xs font-bold" style="background:#0d9488">EP</div>
            <div class="font-bold text-xs" style="color:#3d3836">Emily Park</div>
            <div class="text-[10px] text-warmGrayLight">Sales Director</div>
            <div class="text-[10px] font-bold text-teal mt-1">22 people</div>
          </div>

          <div onclick="showNodeDetail('head-ops')" class="org-node absolute bg-white rounded-lg border border-stone-200/60 px-3 py-2.5 text-center" style="left:755px;top:320px;width:130px;box-shadow:0 2px 8px rgba(0,0,0,0.04);animation-delay:1.2s;z-index:2">
            <div class="w-9 h-9 rounded-full mx-auto mb-1.5 flex items-center justify-center text-white text-xs font-bold" style="background:#b45309">KY</div>
            <div class="font-bold text-xs" style="color:#3d3836">Kevin Yang</div>
            <div class="text-[10px] text-warmGrayLight">Ops Manager</div>
            <div class="text-[10px] font-bold text-amber mt-1">35 people</div>
          </div>
        </div>
      </div>

      <!-- Department Donut Charts -->
      <div class="px-6 pb-8">
        <h3 class="text-sm font-extrabold mb-4" style="color:#3d3836">Department Headcount</h3>
        <div class="grid grid-cols-4 gap-5">
          <!-- Engineering Donut -->
          <div class="bg-white rounded-xl p-5 text-center" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <svg width="100" height="100" viewBox="0 0 100 100" class="mx-auto">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f0eb" stroke-width="10"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#7c3aed" stroke-width="10" stroke-dasharray="83 168" stroke-dashoffset="-42" stroke-linecap="round" transform="rotate(-90 50 50)"/>
              <text x="50" y="47" text-anchor="middle" class="donut-label">42</text>
              <text x="50" y="60" text-anchor="middle" class="donut-sublabel">people</text>
            </svg>
            <div class="font-bold text-sm mt-2" style="color:#3d3836">Engineering</div>
            <div class="text-[11px] text-warmGrayLight">33% of company</div>
          </div>

          <!-- Marketing Donut -->
          <div class="bg-white rounded-xl p-5 text-center" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <svg width="100" height="100" viewBox="0 0 100 100" class="mx-auto">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f0eb" stroke-width="10"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e11d48" stroke-width="10" stroke-dasharray="55 196" stroke-dashoffset="-42" stroke-linecap="round" transform="rotate(-90 50 50)"/>
              <text x="50" y="47" text-anchor="middle" class="donut-label">28</text>
              <text x="50" y="60" text-anchor="middle" class="donut-sublabel">people</text>
            </svg>
            <div class="font-bold text-sm mt-2" style="color:#3d3836">Marketing</div>
            <div class="text-[11px] text-warmGrayLight">22% of company</div>
          </div>

          <!-- Operations Donut -->
          <div class="bg-white rounded-xl p-5 text-center" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <svg width="100" height="100" viewBox="0 0 100 100" class="mx-auto">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f0eb" stroke-width="10"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#d97706" stroke-width="10" stroke-dasharray="69 182" stroke-dashoffset="-42" stroke-linecap="round" transform="rotate(-90 50 50)"/>
              <text x="50" y="47" text-anchor="middle" class="donut-label">35</text>
              <text x="50" y="60" text-anchor="middle" class="donut-sublabel">people</text>
            </svg>
            <div class="font-bold text-sm mt-2" style="color:#3d3836">Operations</div>
            <div class="text-[11px] text-warmGrayLight">28% of company</div>
          </div>

          <!-- Sales Donut -->
          <div class="bg-white rounded-xl p-5 text-center" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <svg width="100" height="100" viewBox="0 0 100 100" class="mx-auto">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f0eb" stroke-width="10"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#0d9488" stroke-width="10" stroke-dasharray="44 207" stroke-dashoffset="-42" stroke-linecap="round" transform="rotate(-90 50 50)"/>
              <text x="50" y="47" text-anchor="middle" class="donut-label">22</text>
              <text x="50" y="60" text-anchor="middle" class="donut-sublabel">people</text>
            </svg>
            <div class="font-bold text-sm mt-2" style="color:#3d3836">Sales</div>
            <div class="text-[11px] text-warmGrayLight">17% of company</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: People -->
    <div id="tab-people" class="page-section">
      <div class="p-6">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-extrabold" style="color:#3d3836">People Directory</h2>
          <button onclick="showToast('Add Employee form coming soon')" class="bg-violet text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer" style="box-shadow:0 2px 8px rgba(124,58,237,0.3)">+ Add Employee</button>
        </div>
        <div class="bg-white rounded-xl overflow-hidden" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
          <table class="w-full">
            <thead><tr class="border-b border-stone-100">
              <th class="text-left p-4 text-[11px] font-bold text-warmGrayLight uppercase tracking-wider">Employee</th>
              <th class="text-left p-4 text-[11px] font-bold text-warmGrayLight uppercase tracking-wider">Department</th>
              <th class="text-left p-4 text-[11px] font-bold text-warmGrayLight uppercase tracking-wider">Title</th>
              <th class="text-left p-4 text-[11px] font-bold text-warmGrayLight uppercase tracking-wider">Start Date</th>
              <th class="text-left p-4 text-[11px] font-bold text-warmGrayLight uppercase tracking-wider">Status</th>
            </tr></thead>
            <tbody>
              <tr class="border-b border-stone-50 hover:bg-surface/50 transition-colors">
                <td class="p-4"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background:#7c3aed">MC</div><div><div class="font-bold text-sm">Michael Chen</div><div class="text-[10px] text-warmGrayLight">michael@company.com</div></div></div></td>
                <td class="p-4 text-sm">Engineering</td>
                <td class="p-4 text-sm">VP Engineering</td>
                <td class="p-4 text-sm text-warmGrayLight">2021-03-15</td>
                <td class="p-4"><span class="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2.5 py-1 rounded-full">Active</span></td>
              </tr>
              <tr class="border-b border-stone-50 hover:bg-surface/50 transition-colors">
                <td class="p-4"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background:#e11d48">SK</div><div><div class="font-bold text-sm">Sarah Kim</div><div class="text-[10px] text-warmGrayLight">sarah@company.com</div></div></div></td>
                <td class="p-4 text-sm">Marketing</td>
                <td class="p-4 text-sm">VP Marketing</td>
                <td class="p-4 text-sm text-warmGrayLight">2020-08-22</td>
                <td class="p-4"><span class="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2.5 py-1 rounded-full">Active</span></td>
              </tr>
              <tr class="border-b border-stone-50 hover:bg-surface/50 transition-colors">
                <td class="p-4"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background:#d97706">DW</div><div><div class="font-bold text-sm">David Wang</div><div class="text-[10px] text-warmGrayLight">david@company.com</div></div></div></td>
                <td class="p-4 text-sm">Operations</td>
                <td class="p-4 text-sm">VP Operations</td>
                <td class="p-4 text-sm text-warmGrayLight">2019-11-04</td>
                <td class="p-4"><span class="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2.5 py-1 rounded-full">Active</span></td>
              </tr>
              <tr class="border-b border-stone-50 hover:bg-surface/50 transition-colors">
                <td class="p-4"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background:#8b5cf6">AZ</div><div><div class="font-bold text-sm">Alex Zhang</div><div class="text-[10px] text-warmGrayLight">alex@company.com</div></div></div></td>
                <td class="p-4 text-sm">Engineering</td>
                <td class="p-4 text-sm">Frontend Lead</td>
                <td class="p-4 text-sm text-warmGrayLight">2022-01-10</td>
                <td class="p-4"><span class="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2.5 py-1 rounded-full">Active</span></td>
              </tr>
              <tr class="border-b border-stone-50 hover:bg-surface/50 transition-colors">
                <td class="p-4"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background:#0d9488">EP</div><div><div class="font-bold text-sm">Emily Park</div><div class="text-[10px] text-warmGrayLight">emily@company.com</div></div></div></td>
                <td class="p-4 text-sm">Sales</td>
                <td class="p-4 text-sm">Sales Director</td>
                <td class="p-4 text-sm text-warmGrayLight">2023-06-18</td>
                <td class="p-4"><span class="bg-amber-50 text-amber-600 text-[11px] font-bold px-2.5 py-1 rounded-full">Probation</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab: Payroll -->
    <div id="tab-payroll" class="page-section">
      <div class="p-6">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-extrabold" style="color:#3d3836">Payroll Overview</h2>
          <button onclick="showToast('Payroll report exported')" class="bg-violet text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer" style="box-shadow:0 2px 8px rgba(124,58,237,0.3)">Export Report</button>
        </div>
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="bg-white rounded-xl p-5 text-center" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <div class="text-xs text-warmGrayLight font-semibold mb-1">Total Payroll</div>
            <div class="text-xl font-extrabold" style="color:#3d3836">$892,400</div>
          </div>
          <div class="bg-white rounded-xl p-5 text-center" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <div class="text-xs text-warmGrayLight font-semibold mb-1">Overtime</div>
            <div class="text-xl font-extrabold text-amber">$34,200</div>
          </div>
          <div class="bg-white rounded-xl p-5 text-center" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <div class="text-xs text-warmGrayLight font-semibold mb-1">Benefits</div>
            <div class="text-xl font-extrabold text-violet">$156,800</div>
          </div>
        </div>
        <div class="bg-white rounded-xl overflow-hidden" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
          <table class="w-full">
            <thead><tr class="border-b border-stone-100">
              <th class="text-left p-4 text-[11px] font-bold text-warmGrayLight uppercase tracking-wider">Employee</th>
              <th class="text-left p-4 text-[11px] font-bold text-warmGrayLight uppercase tracking-wider">Base</th>
              <th class="text-left p-4 text-[11px] font-bold text-warmGrayLight uppercase tracking-wider">Overtime</th>
              <th class="text-left p-4 text-[11px] font-bold text-warmGrayLight uppercase tracking-wider">Deductions</th>
              <th class="text-left p-4 text-[11px] font-bold text-warmGrayLight uppercase tracking-wider">Net Pay</th>
            </tr></thead>
            <tbody>
              <tr class="border-b border-stone-50"><td class="p-4 text-sm font-semibold">Michael Chen</td><td class="p-4 text-sm">$12,500</td><td class="p-4 text-sm text-amber">+$800</td><td class="p-4 text-sm text-rose">-$2,100</td><td class="p-4 text-sm font-extrabold">$11,200</td></tr>
              <tr class="border-b border-stone-50"><td class="p-4 text-sm font-semibold">Sarah Kim</td><td class="p-4 text-sm">$11,800</td><td class="p-4 text-sm text-amber">+$0</td><td class="p-4 text-sm text-rose">-$1,950</td><td class="p-4 text-sm font-extrabold">$9,850</td></tr>
              <tr class="border-b border-stone-50"><td class="p-4 text-sm font-semibold">David Wang</td><td class="p-4 text-sm">$11,200</td><td class="p-4 text-sm text-amber">+$450</td><td class="p-4 text-sm text-rose">-$1,880</td><td class="p-4 text-sm font-extrabold">$9,770</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab: Leave -->
    <div id="tab-leave" class="page-section">
      <div class="p-6">
        <h2 class="text-lg font-extrabold mb-5" style="color:#3d3836">Leave Management</h2>
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl p-4 text-center" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <div class="text-xl font-extrabold text-violet">4</div>
            <div class="text-[11px] text-warmGrayLight font-semibold mt-1">Pending</div>
          </div>
          <div class="bg-white rounded-xl p-4 text-center" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <div class="text-xl font-extrabold text-emerald-600">18</div>
            <div class="text-[11px] text-warmGrayLight font-semibold mt-1">Approved</div>
          </div>
          <div class="bg-white rounded-xl p-4 text-center" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <div class="text-xl font-extrabold text-rose">2</div>
            <div class="text-[11px] text-warmGrayLight font-semibold mt-1">Rejected</div>
          </div>
          <div class="bg-white rounded-xl p-4 text-center" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <div class="text-xl font-extrabold" style="color:#3d3836">3</div>
            <div class="text-[11px] text-warmGrayLight font-semibold mt-1">On Leave Today</div>
          </div>
        </div>
        <div class="space-y-3">
          <div class="bg-white rounded-xl p-4 flex items-center justify-between" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background:#8b5cf6">AZ</div>
              <div><div class="text-sm font-bold">Alex Zhang</div><div class="text-[11px] text-warmGrayLight">Vacation - Feb 25 to Feb 28 (4 days)</div></div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="showToast('Leave approved for Alex Zhang')" class="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-emerald-100 transition-colors font-bold text-sm">&#10003;</button>
              <button class="w-8 h-8 bg-rose/10 text-rose rounded-lg flex items-center justify-center cursor-pointer hover:bg-rose/20 transition-colors font-bold text-sm">&#10005;</button>
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 flex items-center justify-between" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background:#f43f5e">LH</div>
              <div><div class="text-sm font-bold">Lisa Huang</div><div class="text-[11px] text-warmGrayLight">Sick Leave - Feb 24 (1 day)</div></div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="showToast('Leave approved for Lisa Huang')" class="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-emerald-100 transition-colors font-bold text-sm">&#10003;</button>
              <button class="w-8 h-8 bg-rose/10 text-rose rounded-lg flex items-center justify-center cursor-pointer hover:bg-rose/20 transition-colors font-bold text-sm">&#10005;</button>
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 flex items-center justify-between" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background:#0d9488">EP</div>
              <div><div class="text-sm font-bold">Emily Park</div><div class="text-[11px] text-warmGrayLight">Personal - Mar 3 to Mar 4 (2 days)</div></div>
            </div>
            <span class="bg-amber-50 text-amber-600 text-[11px] font-bold px-3 py-1 rounded-full">Pending</span>
          </div>
          <div class="bg-white rounded-xl p-4 flex items-center justify-between" style="box-shadow:0 2px 8px rgba(0,0,0,0.04)">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background:#7c3aed">MC</div>
              <div><div class="text-sm font-bold">Michael Chen</div><div class="text-[11px] text-warmGrayLight">Vacation - Feb 10 to Feb 14 (5 days)</div></div>
            </div>
            <span class="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-3 py-1 rounded-full">Approved</span>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- Right Sidebar (240px) -->
  <aside class="w-60 bg-white border-l border-stone-200/60 flex-shrink-0 p-5 hidden lg:block" style="min-height:calc(100vh - 56px)">
    <h3 class="text-xs font-extrabold text-warmGrayLight uppercase tracking-wider mb-4">Quick Actions</h3>
    <div class="space-y-1 mb-8">
      <button onclick="showToast('Add Employee form opening...')" class="quick-action w-full text-left">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(124,58,237,0.08)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
        </div>
        Add Employee
      </button>
      <button onclick="switchTab('leave');showToast('Switched to Leave tab')" class="quick-action w-full text-left">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(217,119,6,0.08)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        Request Leave
      </button>
      <button onclick="showToast('Reports module loading...')" class="quick-action w-full text-left">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(13,148,136,0.08)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        View Reports
      </button>
    </div>

    <h3 class="text-xs font-extrabold text-warmGrayLight uppercase tracking-wider mb-4">Upcoming Birthdays</h3>
    <div class="space-y-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style="background:#f43f5e">LH</div>
        <div class="min-w-0">
          <div class="text-sm font-bold truncate">Lisa Huang</div>
          <div class="text-[10px] text-warmGrayLight">Feb 26 (in 2 days)</div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style="background:#7c3aed">RL</div>
        <div class="min-w-0">
          <div class="text-sm font-bold truncate">Rachel Lee</div>
          <div class="text-[10px] text-warmGrayLight">Mar 1 (in 5 days)</div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style="background:#0d9488">EP</div>
        <div class="min-w-0">
          <div class="text-sm font-bold truncate">Emily Park</div>
          <div class="text-[10px] text-warmGrayLight">Mar 8 (in 12 days)</div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style="background:#d97706">DW</div>
        <div class="min-w-0">
          <div class="text-sm font-bold truncate">David Wang</div>
          <div class="text-[10px] text-warmGrayLight">Mar 15 (in 19 days)</div>
        </div>
      </div>
    </div>

    <div class="mt-8 p-4 rounded-xl" style="background:rgba(124,58,237,0.05);border:1px solid rgba(124,58,237,0.1)">
      <div class="text-xs font-bold text-violet mb-1">Team Mood</div>
      <div class="flex items-center gap-1 text-lg">
        <span>&#128522;</span><span>&#128522;</span><span>&#128516;</span><span>&#128578;</span><span>&#128522;</span>
      </div>
      <div class="text-[10px] text-warmGrayLight mt-1">Based on 84 responses this week</div>
    </div>
  </aside>
</div>

<!-- Node Detail Overlay -->
<div id="nodeDetailOverlay" class="node-detail-overlay" onclick="if(event.target===this)closeNodeDetail()">
  <div class="bg-white rounded-2xl p-6 w-96 max-w-[90vw]" style="box-shadow:0 20px 60px rgba(0,0,0,0.15)">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div id="detailAvatar" class="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"></div>
        <div>
          <div id="detailName" class="font-extrabold text-base"></div>
          <div id="detailTitle" class="text-sm text-warmGrayLight"></div>
        </div>
      </div>
      <button onclick="closeNodeDetail()" class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface transition-colors cursor-pointer text-warmGrayLight">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-surface rounded-lg p-3">
        <div class="text-[10px] text-warmGrayLight font-semibold">Department</div>
        <div id="detailDept" class="text-sm font-bold mt-0.5"></div>
      </div>
      <div class="bg-surface rounded-lg p-3">
        <div class="text-[10px] text-warmGrayLight font-semibold">Team Size</div>
        <div id="detailTeamSize" class="text-sm font-bold mt-0.5"></div>
      </div>
      <div class="bg-surface rounded-lg p-3">
        <div class="text-[10px] text-warmGrayLight font-semibold">Reports To</div>
        <div id="detailReportsTo" class="text-sm font-bold mt-0.5"></div>
      </div>
      <div class="bg-surface rounded-lg p-3">
        <div class="text-[10px] text-warmGrayLight font-semibold">Tenure</div>
        <div id="detailTenure" class="text-sm font-bold mt-0.5"></div>
      </div>
    </div>
    <div class="flex gap-2">
      <button onclick="showToast('Opening profile...');closeNodeDetail()" class="flex-1 bg-violet text-white py-2.5 rounded-lg text-sm font-bold cursor-pointer" style="box-shadow:0 2px 8px rgba(124,58,237,0.3)">View Profile</button>
      <button onclick="showToast('Opening chat...');closeNodeDetail()" class="flex-1 bg-surface py-2.5 rounded-lg text-sm font-bold cursor-pointer hover:bg-stone-200 transition-colors" style="color:#3d3836">Send Message</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 bg-stone-800 text-white px-6 py-3.5 rounded-xl z-[200] translate-y-20 opacity-0 transition-all duration-500 text-sm font-semibold" style="box-shadow:0 8px 24px rgba(0,0,0,0.2)"></div>

<script>
// Node data
const nodes = {
  'ceo': { name:'Jennifer Lin', initials:'JL', title:'Chief Executive Officer', dept:'Executive', teamSize:'127', reportsTo:'Board of Directors', tenure:'5.2 yrs', color:'#7c3aed' },
  'vp-eng': { name:'Michael Chen', initials:'MC', title:'VP Engineering', dept:'Engineering', teamSize:'42', reportsTo:'Jennifer Lin', tenure:'4.8 yrs', color:'#7c3aed' },
  'vp-mkt': { name:'Sarah Kim', initials:'SK', title:'VP Marketing', dept:'Marketing', teamSize:'28', reportsTo:'Jennifer Lin', tenure:'5.4 yrs', color:'#e11d48' },
  'vp-ops': { name:'David Wang', initials:'DW', title:'VP Operations', dept:'Operations', teamSize:'57', reportsTo:'Jennifer Lin', tenure:'6.1 yrs', color:'#d97706' },
  'head-fe': { name:'Alex Zhang', initials:'AZ', title:'Frontend Lead', dept:'Engineering', teamSize:'18', reportsTo:'Michael Chen', tenure:'3.1 yrs', color:'#8b5cf6' },
  'head-be': { name:'Rachel Lee', initials:'RL', title:'Backend Lead', dept:'Engineering', teamSize:'24', reportsTo:'Michael Chen', tenure:'3.8 yrs', color:'#7c3aed' },
  'head-brand': { name:'Lisa Huang', initials:'LH', title:'Brand Director', dept:'Marketing', teamSize:'15', reportsTo:'Sarah Kim', tenure:'2.5 yrs', color:'#f43f5e' },
  'head-growth': { name:'Tom Nguyen', initials:'TN', title:'Growth Lead', dept:'Marketing', teamSize:'13', reportsTo:'Sarah Kim', tenure:'1.8 yrs', color:'#e11d48' },
  'head-sales': { name:'Emily Park', initials:'EP', title:'Sales Director', dept:'Sales', teamSize:'22', reportsTo:'David Wang', tenure:'0.7 yrs', color:'#0d9488' },
  'head-ops': { name:'Kevin Yang', initials:'KY', title:'Ops Manager', dept:'Operations', teamSize:'35', reportsTo:'David Wang', tenure:'2.9 yrs', color:'#b45309' }
};

function showNodeDetail(id) {
  const n = nodes[id];
  if (!n) return;
  document.getElementById('detailAvatar').textContent = n.initials;
  document.getElementById('detailAvatar').style.background = n.color;
  document.getElementById('detailName').textContent = n.name;
  document.getElementById('detailTitle').textContent = n.title;
  document.getElementById('detailDept').textContent = n.dept;
  document.getElementById('detailTeamSize').textContent = n.teamSize + ' people';
  document.getElementById('detailReportsTo').textContent = n.reportsTo;
  document.getElementById('detailTenure').textContent = n.tenure;
  document.getElementById('nodeDetailOverlay').classList.add('show');
}

function closeNodeDetail() {
  document.getElementById('nodeDetailOverlay').classList.remove('show');
}

function switchTab(tab) {
  document.querySelectorAll('.page-section').forEach(function(s){ s.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
  var el = document.getElementById('tab-' + tab);
  if (el) el.classList.add('active');
  var btn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
  if (btn) btn.classList.add('active');
}

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('translate-y-20','opacity-0');
  setTimeout(function(){ t.classList.add('translate-y-20','opacity-0'); }, 3000);
}

// Keyboard shortcut: Escape to close detail
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeNodeDetail();
});
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
