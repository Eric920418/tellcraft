INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '54a2e35b-b363-475e-89dd-06ed25c24618',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EnergyFlow Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        base: '#0B1117',
        surface: '#111827',
        border: '#1F2937',
        energy: { 400: '#34d399', 500: '#10B981', 600: '#059669' },
        solar: { 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706' },
        wind: { 400: '#22D3EE', 500: '#06B6D4', 600: '#0891B2' },
        battery: { 400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB' },
        grid: { 400: '#9CA3AF', 500: '#6B7280', 600: '#4B5563' }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  }
}
</script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Space Grotesk', sans-serif; background: #0B1117; color: #e5e7eb; }
.mono { font-family: 'JetBrains Mono', monospace; }
.display { font-family: 'Space Grotesk', sans-serif; }

/* ── Power-on flicker animation ── */
@keyframes power-on {
  0% { opacity: 0; }
  10% { opacity: 0.8; }
  15% { opacity: 0.2; }
  25% { opacity: 0.9; }
  30% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 1; }
}
@keyframes power-on-scale {
  0% { opacity: 0; transform: scale(0.97); }
  10% { opacity: 0.7; transform: scale(0.99); }
  20% { opacity: 0.3; transform: scale(0.98); }
  40% { opacity: 0.9; transform: scale(1.0); }
  60% { opacity: 0.6; transform: scale(0.995); }
  100% { opacity: 1; transform: scale(1); }
}

/* ── Energy flow dash animation ── */
@keyframes flow-forward {
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
}
@keyframes flow-forward-fast {
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
}
@keyframes flow-reverse {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 24; }
}

/* ── Liquid fill animation ── */
@keyframes liquid-wave {
  0% { d: path('M0,8 Q15,4 30,8 T60,8 T90,8 T120,8 V30 H0 Z'); }
  50% { d: path('M0,6 Q15,10 30,6 T60,6 T90,6 T120,6 V30 H0 Z'); }
  100% { d: path('M0,8 Q15,4 30,8 T60,8 T90,8 T120,8 V30 H0 Z'); }
}

/* ── Glow pulse for active nodes ── */
@keyframes glow-green {
  0%, 100% { box-shadow: 0 0 4px rgba(16,185,129,0.3); }
  50% { box-shadow: 0 0 12px rgba(16,185,129,0.6); }
}
@keyframes glow-solar {
  0%, 100% { box-shadow: 0 0 4px rgba(245,158,11,0.3); }
  50% { box-shadow: 0 0 12px rgba(245,158,11,0.5); }
}
@keyframes glow-wind {
  0%, 100% { box-shadow: 0 0 4px rgba(6,182,212,0.3); }
  50% { box-shadow: 0 0 12px rgba(6,182,212,0.5); }
}
@keyframes glow-battery {
  0%, 100% { box-shadow: 0 0 4px rgba(59,130,246,0.3); }
  50% { box-shadow: 0 0 12px rgba(59,130,246,0.5); }
}

/* ── Counter tick ── */
@keyframes counter-tick {
  0% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
  100% { transform: translateY(0); }
}

/* ── Scan line for status indicators ── */
@keyframes scan-line {
  0% { left: 0; }
  100% { left: 100%; }
}

/* ── Toast slide in ── */
@keyframes toast-in {
  0% { transform: translateX(120%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
@keyframes toast-out {
  0% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(120%); opacity: 0; }
}

/* ── Scroll reveal ── */
.scroll-reveal {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.scroll-reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* ── Tree node styles ── */
.tree-node {
  cursor: pointer;
  transition: background 0.15s ease;
  border-left: 2px solid transparent;
}
.tree-node:hover {
  background: rgba(255,255,255,0.03);
}
.tree-node.active {
  border-left-color: #10B981;
  background: rgba(16,185,129,0.06);
}
.tree-node.active-solar {
  border-left-color: #F59E0B;
  background: rgba(245,158,11,0.06);
}
.tree-node.active-wind {
  border-left-color: #06B6D4;
  background: rgba(6,182,212,0.06);
}
.tree-node.active-battery {
  border-left-color: #3B82F6;
  background: rgba(59,130,246,0.06);
}
.tree-node.active-grid {
  border-left-color: #6B7280;
  background: rgba(107,114,128,0.06);
}

.tree-children {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}
.tree-children.expanded {
  max-height: 300px;
}

/* ── Tab styles ── */
.tab-btn {
  position: relative;
  transition: color 0.2s ease;
}
.tab-btn::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #10B981;
  transform: scaleX(0);
  transition: transform 0.2s ease;
}
.tab-btn.active-tab {
  color: #10B981;
}
.tab-btn.active-tab::after {
  transform: scaleX(1);
}

/* ── Flow lines ── */
.flow-line {
  fill: none;
  stroke-width: 2;
  stroke-dasharray: 8,4;
}
.flow-solar {
  stroke: #F59E0B;
  animation: flow-forward 1.2s linear infinite;
}
.flow-wind {
  stroke: #06B6D4;
  animation: flow-forward 1.5s linear infinite;
}
.flow-battery-charge {
  stroke: #3B82F6;
  animation: flow-forward 2s linear infinite;
}
.flow-battery-discharge {
  stroke: #3B82F6;
  animation: flow-reverse 2s linear infinite;
}
.flow-home {
  stroke: #10B981;
  animation: flow-forward 1s linear infinite;
}
.flow-grid-export {
  stroke: #6B7280;
  animation: flow-forward 2.5s linear infinite;
}

/* ── Toast ── */
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: toast-in 0.4s ease forwards;
  max-width: 320px;
}
.toast.hiding {
  animation: toast-out 0.3s ease forwards;
}

/* ── Responsive ── */
@media (max-width: 1200px) {
  .main-grid { grid-template-columns: 1fr !important; }
}
@media (max-width: 768px) {
  .sidebar-tree { display: none; }
  .content-area { margin-left: 0 !important; }
}
</style>
</head>
<body class="min-h-screen flex overflow-hidden">

<!-- Toast container -->
<div class="toast-container" id="toast-container"></div>

<!-- ═══════════════════════════════════════════════ -->
<!-- LEFT: Device Tree Sidebar                       -->
<!-- ═══════════════════════════════════════════════ -->
<aside class="sidebar-tree w-60 bg-surface border-r border-border flex flex-col min-h-screen flex-shrink-0" style="animation: power-on 0.8s ease forwards;">
  <!-- Logo -->
  <div class="px-4 py-4 border-b border-border">
    <div class="flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-energy-500/20 border border-energy-500/30 flex items-center justify-center" style="animation: glow-green 3s ease-in-out infinite;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      </div>
      <div>
        <div class="display font-bold text-white text-sm tracking-tight">EnergyFlow</div>
        <div class="text-[10px] text-gray-500 mono">v2.4.1 · LIVE</div>
      </div>
    </div>
  </div>

  <!-- System Status -->
  <div class="px-4 py-3 border-b border-border">
    <div class="flex items-center gap-2 mb-2">
      <div class="w-1.5 h-1.5 rounded-full bg-energy-500" style="animation: glow-green 2s ease-in-out infinite;"></div>
      <span class="text-[10px] text-gray-400 mono uppercase tracking-wider">System Online</span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-[10px] text-gray-500">Total Output</span>
      <span class="mono text-xs text-energy-400 font-semibold" id="total-output">7.2 kW</span>
    </div>
    <div class="flex items-center justify-between mt-1">
      <span class="text-[10px] text-gray-500">Efficiency</span>
      <span class="mono text-xs text-white font-medium">94.2%</span>
    </div>
  </div>

  <!-- Device Tree -->
  <nav class="flex-1 overflow-y-auto py-2" id="device-tree">
    <!-- Overview node -->
    <div class="tree-node active px-4 py-2.5 flex items-center gap-2.5" data-filter="overview" onclick="filterView('overview', this)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      <span class="text-sm text-energy-400 font-medium">Overview</span>
    </div>

    <!-- Solar Array (expandable) -->
    <div class="tree-parent">
      <div class="tree-node px-4 py-2.5 flex items-center justify-between" data-filter="solar" onclick="toggleTree(this, 'solar')">
        <div class="flex items-center gap-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <span class="text-sm text-gray-300">Solar Array</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="mono text-[10px] text-solar-400">4.8 kW</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" class="tree-chevron transition-transform duration-200"><path d="M3 2l4 3-4 3" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
      </div>
      <div class="tree-children" id="tree-solar">
        <div class="tree-node pl-10 pr-4 py-1.5 flex items-center justify-between" data-filter="solar-a" onclick="filterView('solar-a', this)">
          <span class="text-xs text-gray-400">String A (12 panels)</span>
          <span class="mono text-[10px] text-solar-400">2.6 kW</span>
        </div>
        <div class="tree-node pl-10 pr-4 py-1.5 flex items-center justify-between" data-filter="solar-b" onclick="filterView('solar-b', this)">
          <span class="text-xs text-gray-400">String B (12 panels)</span>
          <span class="mono text-[10px] text-solar-400">2.2 kW</span>
        </div>
        <div class="tree-node pl-10 pr-4 py-1.5 flex items-center justify-between" data-filter="solar-inv" onclick="filterView('solar-inv', this)">
          <span class="text-xs text-gray-400">Inverter SMA-5000</span>
          <span class="mono text-[10px] text-energy-400">98.1%</span>
        </div>
      </div>
    </div>

    <!-- Wind Turbines (expandable) -->
    <div class="tree-parent">
      <div class="tree-node px-4 py-2.5 flex items-center justify-between" data-filter="wind" onclick="toggleTree(this, 'wind')">
        <div class="flex items-center gap-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2" stroke-linecap="round"><path d="M12 12c-2-2.67-6-4-6-4s-0.33 4 2.67 6c-2.67 2-4 6-4 6s4 0.33 6-2.67c2 2.67 6 4 6 4s0.33-4-2.67-6c2.67-2 4-6 4-6s-4-0.33-6 2.67z"/><circle cx="12" cy="12" r="2"/></svg>
          <span class="text-sm text-gray-300">Wind Turbines</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="mono text-[10px] text-wind-400">2.4 kW</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" class="tree-chevron transition-transform duration-200"><path d="M3 2l4 3-4 3" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
      </div>
      <div class="tree-children" id="tree-wind">
        <div class="tree-node pl-10 pr-4 py-1.5 flex items-center justify-between" data-filter="wind-1" onclick="filterView('wind-1', this)">
          <span class="text-xs text-gray-400">Turbine #1 (Roof N)</span>
          <span class="mono text-[10px] text-wind-400">1.4 kW</span>
        </div>
        <div class="tree-node pl-10 pr-4 py-1.5 flex items-center justify-between" data-filter="wind-2" onclick="filterView('wind-2', this)">
          <span class="text-xs text-gray-400">Turbine #2 (Roof S)</span>
          <span class="mono text-[10px] text-wind-400">1.0 kW</span>
        </div>
      </div>
    </div>

    <!-- Grid Connection -->
    <div class="tree-node px-4 py-2.5 flex items-center justify-between" data-filter="grid" onclick="filterView('grid', this)">
      <div class="flex items-center gap-2.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
        <span class="text-sm text-gray-300">Grid</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="mono text-[10px] text-grid-400">Export</span>
        <div class="w-1.5 h-1.5 rounded-full bg-energy-500"></div>
      </div>
    </div>

    <!-- Battery Bank (expandable) -->
    <div class="tree-parent">
      <div class="tree-node px-4 py-2.5 flex items-center justify-between" data-filter="battery" onclick="toggleTree(this, 'battery')">
        <div class="flex items-center gap-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/><line x1="7" y1="10" x2="7" y2="14"/><line x1="12" y1="10" x2="12" y2="14"/></svg>
          <span class="text-sm text-gray-300">Battery Bank</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="mono text-[10px] text-battery-400">78%</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" class="tree-chevron transition-transform duration-200"><path d="M3 2l4 3-4 3" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
      </div>
      <div class="tree-children" id="tree-battery">
        <div class="tree-node pl-10 pr-4 py-1.5 flex items-center justify-between" data-filter="batt-1" onclick="filterView('batt-1', this)">
          <span class="text-xs text-gray-400">Pack A (LFP 5kWh)</span>
          <span class="mono text-[10px] text-battery-400">82%</span>
        </div>
        <div class="tree-node pl-10 pr-4 py-1.5 flex items-center justify-between" data-filter="batt-2" onclick="filterView('batt-2', this)">
          <span class="text-xs text-gray-400">Pack B (LFP 5kWh)</span>
          <span class="mono text-[10px] text-battery-400">74%</span>
        </div>
        <div class="tree-node pl-10 pr-4 py-1.5 flex items-center justify-between" data-filter="batt-inv" onclick="filterView('batt-inv', this)">
          <span class="text-xs text-gray-400">Hybrid Inverter</span>
          <span class="mono text-[10px] text-energy-400">OK</span>
        </div>
      </div>
    </div>
  </nav>

  <!-- Bottom status -->
  <div class="px-4 py-3 border-t border-border">
    <div class="flex items-center justify-between mb-1.5">
      <span class="text-[10px] text-gray-500">Carbon Offset Today</span>
    </div>
    <div class="flex items-center gap-1">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M12 22c4-4 8-7.58 8-12a8 8 0 10-16 0c0 4.42 4 8 8 12z"/><path d="M12 12V8"/><path d="M12 8l-2 2"/></svg>
      <span class="mono text-sm text-energy-400 font-bold" id="carbon-counter">12.4</span>
      <span class="text-[10px] text-gray-500">kg CO2</span>
    </div>
  </div>
</aside>

<!-- ═══════════════════════════════════════════════ -->
<!-- MAIN CONTENT AREA                               -->
<!-- ═══════════════════════════════════════════════ -->
<main class="content-area flex-1 flex flex-col min-h-screen overflow-y-auto" style="animation: power-on-scale 1s ease forwards;">

  <!-- Top bar -->
  <header class="flex items-center justify-between px-6 h-12 border-b border-border flex-shrink-0 bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
    <div class="flex items-center gap-4">
      <h1 class="display font-semibold text-white text-sm" id="view-title">Energy Overview</h1>
      <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-energy-500/10 border border-energy-500/20">
        <div class="w-1.5 h-1.5 rounded-full bg-energy-500" style="animation: glow-green 2s ease-in-out infinite;"></div>
        <span class="mono text-[10px] text-energy-400">LIVE</span>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <!-- Tab navigation -->
      <div class="flex items-center gap-1 border-b border-transparent" id="tab-group">
        <button class="tab-btn active-tab px-3 py-1 text-xs font-medium text-energy-400 cursor-pointer" data-tab="overview" onclick="switchTab('overview', this)">Overview</button>
        <button class="tab-btn px-3 py-1 text-xs font-medium text-gray-500 cursor-pointer" data-tab="production" onclick="switchTab('production', this)">Production</button>
        <button class="tab-btn px-3 py-1 text-xs font-medium text-gray-500 cursor-pointer" data-tab="consumption" onclick="switchTab('consumption', this)">Consumption</button>
        <button class="tab-btn px-3 py-1 text-xs font-medium text-gray-500 cursor-pointer" data-tab="storage" onclick="switchTab('storage', this)">Storage</button>
      </div>
      <div class="h-5 w-px bg-border"></div>
      <span class="mono text-[10px] text-gray-500">Feb 25, 2026 · 14:32</span>
    </div>
  </header>

  <!-- ═══════════════════════════════════════════ -->
  <!-- TAB: OVERVIEW                               -->
  <!-- ═══════════════════════════════════════════ -->
  <div class="tab-content p-6 space-y-6" id="tab-overview">

    <!-- Energy Flow Diagram (Sankey-style) -->
    <div class="scroll-reveal bg-surface rounded-xl border border-border p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="display font-semibold text-sm text-white">Energy Flow</h2>
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-gray-500">Real-time power routing</span>
          <div class="w-1.5 h-1.5 rounded-full bg-energy-500" style="animation: glow-green 2s ease-in-out infinite;"></div>
        </div>
      </div>
      <svg viewBox="0 0 900 320" class="w-full" style="max-height: 280px;" id="energy-flow-svg">
        <!-- Sources (left side) -->
        <!-- Solar icon group -->
        <g transform="translate(30, 40)">
          <rect x="-10" y="-10" width="80" height="65" rx="10" fill="#111827" stroke="#F59E0B" stroke-width="1" opacity="0.6"/>
          <circle cx="30" cy="18" r="12" fill="none" stroke="#F59E0B" stroke-width="1.5"/>
          <line x1="30" y1="0" x2="30" y2="5" stroke="#F59E0B" stroke-width="1.5"/>
          <line x1="30" y1="31" x2="30" y2="36" stroke="#F59E0B" stroke-width="1.5"/>
          <line x1="13" y1="18" x2="18" y2="18" stroke="#F59E0B" stroke-width="1.5"/>
          <line x1="42" y1="18" x2="47" y2="18" stroke="#F59E0B" stroke-width="1.5"/>
          <text x="30" y="50" text-anchor="middle" fill="#F59E0B" font-family="Space Grotesk" font-size="9" font-weight="600">SOLAR</text>
          <text x="30" y="62" text-anchor="middle" fill="#FBBF24" font-family="JetBrains Mono" font-size="11" font-weight="700" class="counter-value" data-target="4.8">0.0</text>
          <text x="52" y="62" fill="#6B7280" font-family="JetBrains Mono" font-size="8">kW</text>
        </g>

        <!-- Wind icon group -->
        <g transform="translate(30, 150)">
          <rect x="-10" y="-10" width="80" height="65" rx="10" fill="#111827" stroke="#06B6D4" stroke-width="1" opacity="0.6"/>
          <circle cx="30" cy="18" r="10" fill="none" stroke="#06B6D4" stroke-width="1.5"/>
          <path d="M30,8 Q38,14 30,18 Q22,14 30,8Z" fill="#06B6D4" opacity="0.3"/>
          <path d="M30,18 Q38,24 30,28 Q22,24 30,18Z" fill="#06B6D4" opacity="0.3"/>
          <path d="M22,13 Q28,21 30,18" fill="none" stroke="#06B6D4" stroke-width="1"/>
          <text x="30" y="50" text-anchor="middle" fill="#06B6D4" font-family="Space Grotesk" font-size="9" font-weight="600">WIND</text>
          <text x="30" y="62" text-anchor="middle" fill="#22D3EE" font-family="JetBrains Mono" font-size="11" font-weight="700" class="counter-value" data-target="2.4">0.0</text>
          <text x="52" y="62" fill="#6B7280" font-family="JetBrains Mono" font-size="8">kW</text>
        </g>

        <!-- Inverter (center) -->
        <g transform="translate(350, 95)">
          <rect x="0" y="0" width="100" height="70" rx="12" fill="#111827" stroke="#10B981" stroke-width="1.5"/>
          <rect x="0" y="0" width="100" height="70" rx="12" fill="url(#inverter-glow)" opacity="0.3"/>
          <text x="50" y="28" text-anchor="middle" fill="#10B981" font-family="Space Grotesk" font-size="9" font-weight="600">INVERTER</text>
          <text x="50" y="42" text-anchor="middle" fill="#34d399" font-family="JetBrains Mono" font-size="12" font-weight="700" class="counter-value" data-target="7.2">0.0</text>
          <text x="50" y="55" text-anchor="middle" fill="#6B7280" font-family="JetBrains Mono" font-size="8">kW total</text>
        </g>

        <!-- Home (right side) -->
        <g transform="translate(650, 30)">
          <rect x="-10" y="-10" width="80" height="65" rx="10" fill="#111827" stroke="#10B981" stroke-width="1" opacity="0.6"/>
          <path d="M30,5 L10,20 L50,20Z" fill="none" stroke="#10B981" stroke-width="1.5"/>
          <rect x="18" y="20" width="24" height="18" fill="none" stroke="#10B981" stroke-width="1.5" rx="1"/>
          <text x="30" y="52" text-anchor="middle" fill="#10B981" font-family="Space Grotesk" font-size="9" font-weight="600">HOME</text>
          <text x="30" y="64" text-anchor="middle" fill="#34d399" font-family="JetBrains Mono" font-size="11" font-weight="700" class="counter-value" data-target="3.1">0.0</text>
          <text x="52" y="64" fill="#6B7280" font-family="JetBrains Mono" font-size="8">kW</text>
        </g>

        <!-- Grid export (right side) -->
        <g transform="translate(650, 130)">
          <rect x="-10" y="-10" width="80" height="65" rx="10" fill="#111827" stroke="#6B7280" stroke-width="1" opacity="0.6"/>
          <path d="M18,15 L18,35 M30,10 L30,35 M42,20 L42,35" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>
          <text x="30" y="50" text-anchor="middle" fill="#6B7280" font-family="Space Grotesk" font-size="9" font-weight="600">GRID</text>
          <text x="30" y="62" text-anchor="middle" fill="#9CA3AF" font-family="JetBrains Mono" font-size="11" font-weight="700" class="counter-value" data-target="2.4">0.0</text>
          <text x="52" y="62" fill="#6B7280" font-family="JetBrains Mono" font-size="8">kW</text>
        </g>

        <!-- Battery (right-bottom) -->
        <g transform="translate(650, 230)">
          <rect x="-10" y="-10" width="80" height="65" rx="10" fill="#111827" stroke="#3B82F6" stroke-width="1" opacity="0.6"/>
          <rect x="12" y="8" width="36" height="22" rx="3" fill="none" stroke="#3B82F6" stroke-width="1.5"/>
          <rect x="48" y="14" width="4" height="10" rx="1" fill="#3B82F6" opacity="0.5"/>
          <rect x="14" y="10" width="23" height="18" rx="2" fill="#3B82F6" opacity="0.25"/>
          <text x="30" y="46" text-anchor="middle" fill="#3B82F6" font-family="Space Grotesk" font-size="9" font-weight="600">BATTERY</text>
          <text x="30" y="58" text-anchor="middle" fill="#60A5FA" font-family="JetBrains Mono" font-size="11" font-weight="700">78%</text>
        </g>

        <!-- Flow lines: Solar -> Inverter -->
        <path d="M100,70 C200,70 250,120 350,130" class="flow-line flow-solar"/>
        <path d="M100,70 C200,70 250,120 350,130" fill="none" stroke="#F59E0B" stroke-width="6" opacity="0.06"/>

        <!-- Flow lines: Wind -> Inverter -->
        <path d="M100,180 C200,180 250,145 350,135" class="flow-line flow-wind"/>
        <path d="M100,180 C200,180 250,145 350,135" fill="none" stroke="#06B6D4" stroke-width="6" opacity="0.06"/>

        <!-- Flow lines: Inverter -> Home -->
        <path d="M450,115 C530,100 580,65 640,55" class="flow-line flow-home"/>
        <path d="M450,115 C530,100 580,65 640,55" fill="none" stroke="#10B981" stroke-width="6" opacity="0.06"/>

        <!-- Flow lines: Inverter -> Grid -->
        <path d="M450,130 C530,135 580,150 640,155" class="flow-line flow-grid-export"/>
        <path d="M450,130 C530,135 580,150 640,155" fill="none" stroke="#6B7280" stroke-width="4" opacity="0.04"/>

        <!-- Flow lines: Inverter -> Battery -->
        <path d="M450,150 C520,180 580,230 640,255" class="flow-line flow-battery-charge"/>
        <path d="M450,150 C520,180 580,230 640,255" fill="none" stroke="#3B82F6" stroke-width="5" opacity="0.05"/>

        <!-- Gradient definition -->
        <defs>
          <radialGradient id="inverter-glow" cx="50%" cy="50%">
            <stop offset="0%" stop-color="#10B981" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#10B981" stop-opacity="0"/>
          </radialGradient>
        </defs>
      </svg>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-4 gap-4">
      <div class="scroll-reveal bg-surface rounded-xl p-4 border border-border group" style="animation-delay: 0.1s;">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider">Solar Production</span>
          <div class="w-6 h-6 rounded-md bg-solar-500/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>
          </div>
        </div>
        <div class="mono text-2xl font-bold text-solar-400 counter-value" data-target="4.8" data-suffix=" kW">0.0 kW</div>
        <div class="flex items-center gap-1 mt-1">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2l3 4H2l3-4z" fill="#10B981"/></svg>
          <span class="text-[10px] text-energy-400 mono">+12% vs yesterday</span>
        </div>
      </div>

      <div class="scroll-reveal bg-surface rounded-xl p-4 border border-border" style="animation-delay: 0.15s;">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider">Wind Power</span>
          <div class="w-6 h-6 rounded-md bg-wind-500/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
          </div>
        </div>
        <div class="mono text-2xl font-bold text-wind-400 counter-value" data-target="2.4" data-suffix=" kW">0.0 kW</div>
        <div class="flex items-center gap-1 mt-1">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2l3 4H2l3-4z" fill="#10B981"/></svg>
          <span class="text-[10px] text-energy-400 mono">Wind 14 km/h NW</span>
        </div>
      </div>

      <div class="scroll-reveal bg-surface rounded-xl p-4 border border-border" style="animation-delay: 0.2s;">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider">Home Consumption</span>
          <div class="w-6 h-6 rounded-md bg-energy-500/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          </div>
        </div>
        <div class="mono text-2xl font-bold text-energy-400 counter-value" data-target="3.1" data-suffix=" kW">0.0 kW</div>
        <div class="flex items-center gap-1 mt-1">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 8l3-4H2l3 4z" fill="#10B981"/></svg>
          <span class="text-[10px] text-energy-400 mono">-8% below avg</span>
        </div>
      </div>

      <div class="scroll-reveal bg-surface rounded-xl p-4 border border-border" style="animation-delay: 0.25s;">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider">Battery SOC</span>
          <div class="w-6 h-6 rounded-md bg-battery-500/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/></svg>
          </div>
        </div>
        <div class="mono text-2xl font-bold text-battery-400">78%</div>
        <div class="flex items-center gap-1 mt-1">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2l3 4H2l3-4z" fill="#3B82F6"/></svg>
          <span class="text-[10px] text-battery-400 mono">Charging 1.7 kW</span>
        </div>
      </div>
    </div>

    <!-- Power Curve + Battery -->
    <div class="grid grid-cols-3 gap-4">
      <!-- Real-time power curve -->
      <div class="scroll-reveal col-span-2 bg-surface rounded-xl p-5 border border-border">
        <div class="flex items-center justify-between mb-4">
          <h3 class="display font-semibold text-sm text-white">Power Curve - Today</h3>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-solar-500"></div><span class="text-[10px] text-gray-500">Solar</span></div>
            <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-wind-500"></div><span class="text-[10px] text-gray-500">Wind</span></div>
            <div class="flex items-center gap-1.5"><div class="w-2 h-0.5 bg-energy-500"></div><span class="text-[10px] text-gray-500">Consumption</span></div>
          </div>
        </div>
        <svg viewBox="0 0 600 200" class="w-full" style="max-height: 180px;">
          <!-- Grid lines -->
          <line x1="40" y1="20" x2="580" y2="20" stroke="#1F2937" stroke-width="0.5" stroke-dasharray="3,3"/>
          <line x1="40" y1="60" x2="580" y2="60" stroke="#1F2937" stroke-width="0.5" stroke-dasharray="3,3"/>
          <line x1="40" y1="100" x2="580" y2="100" stroke="#1F2937" stroke-width="0.5" stroke-dasharray="3,3"/>
          <line x1="40" y1="140" x2="580" y2="140" stroke="#1F2937" stroke-width="0.5" stroke-dasharray="3,3"/>
          <line x1="40" y1="180" x2="580" y2="180" stroke="#1F2937" stroke-width="0.5"/>

          <!-- Y-axis labels -->
          <text x="35" y="24" fill="#4B5563" font-family="JetBrains Mono" font-size="8" text-anchor="end">8kW</text>
          <text x="35" y="64" fill="#4B5563" font-family="JetBrains Mono" font-size="8" text-anchor="end">6kW</text>
          <text x="35" y="104" fill="#4B5563" font-family="JetBrains Mono" font-size="8" text-anchor="end">4kW</text>
          <text x="35" y="144" fill="#4B5563" font-family="JetBrains Mono" font-size="8" text-anchor="end">2kW</text>
          <text x="35" y="184" fill="#4B5563" font-family="JetBrains Mono" font-size="8" text-anchor="end">0</text>

          <!-- X-axis labels -->
          <text x="40" y="196" fill="#4B5563" font-family="JetBrains Mono" font-size="8" text-anchor="middle">00:00</text>
          <text x="130" y="196" fill="#4B5563" font-family="JetBrains Mono" font-size="8" text-anchor="middle">04:00</text>
          <text x="220" y="196" fill="#4B5563" font-family="JetBrains Mono" font-size="8" text-anchor="middle">08:00</text>
          <text x="310" y="196" fill="#4B5563" font-family="JetBrains Mono" font-size="8" text-anchor="middle">12:00</text>
          <text x="400" y="196" fill="#4B5563" font-family="JetBrains Mono" font-size="8" text-anchor="middle">16:00</text>
          <text x="490" y="196" fill="#4B5563" font-family="JetBrains Mono" font-size="8" text-anchor="middle">20:00</text>
          <text x="580" y="196" fill="#4B5563" font-family="JetBrains Mono" font-size="8" text-anchor="middle">24:00</text>

          <!-- Solar gradient fill -->
          <defs>
            <linearGradient id="solar-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#F59E0B" stop-opacity="0.02"/>
            </linearGradient>
            <linearGradient id="wind-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#06B6D4" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#06B6D4" stop-opacity="0.02"/>
            </linearGradient>
          </defs>

          <!-- Solar curve fill -->
          <path d="M40,180 L85,178 L130,175 L175,165 L220,120 L265,72 L310,48 L355,42 L400,55 L445,85 L490,140 L535,170 L580,178 L580,180 Z" fill="url(#solar-grad)"/>
          <!-- Solar curve line -->
          <path d="M40,180 L85,178 L130,175 L175,165 L220,120 L265,72 L310,48 L355,42 L400,55 L445,85 L490,140 L535,170 L580,178" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>

          <!-- Wind curve fill -->
          <path d="M40,160 L85,155 L130,148 L175,152 L220,145 L265,138 L310,142 L355,135 L400,128 L445,132 L490,138 L535,145 L580,150 L580,180 L40,180 Z" fill="url(#wind-grad)"/>
          <!-- Wind curve line -->
          <path d="M40,160 L85,155 L130,148 L175,152 L220,145 L265,138 L310,142 L355,135 L400,128 L445,132 L490,138 L535,145 L580,150" fill="none" stroke="#06B6D4" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="4,2"/>

          <!-- Consumption line -->
          <path d="M40,158 L85,156 L130,155 L175,148 L220,140 L265,135 L310,132 L355,128 L400,120 L445,118 L490,125 L535,140 L580,152" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round"/>

          <!-- Current time marker -->
          <line x1="400" y1="20" x2="400" y2="180" stroke="#10B981" stroke-width="1" stroke-dasharray="3,3" opacity="0.4"/>
          <circle cx="400" cy="55" r="3" fill="#F59E0B" stroke="#0B1117" stroke-width="1.5"/>
          <circle cx="400" cy="128" r="3" fill="#06B6D4" stroke="#0B1117" stroke-width="1.5"/>
          <circle cx="400" cy="120" r="3" fill="#10B981" stroke="#0B1117" stroke-width="1.5"/>
          <text x="400" y="14" fill="#6B7280" font-family="JetBrains Mono" font-size="7" text-anchor="middle">NOW</text>
        </svg>
      </div>

      <!-- Battery SOC with liquid fill -->
      <div class="scroll-reveal bg-surface rounded-xl p-5 border border-border">
        <h3 class="display font-semibold text-sm text-white mb-4">Battery State</h3>
        <div class="flex justify-center mb-4">
          <div class="relative" style="width: 120px; height: 160px;">
            <!-- Battery outline -->
            <svg viewBox="0 0 120 160" class="w-full h-full">
              <!-- Battery terminal -->
              <rect x="40" y="0" width="40" height="8" rx="3" fill="#1F2937" stroke="#3B82F6" stroke-width="1"/>
              <!-- Battery body -->
              <rect x="15" y="8" width="90" height="140" rx="8" fill="#0B1117" stroke="#3B82F6" stroke-width="1.5"/>
              <!-- Liquid fill (78%) -->
              <clipPath id="battery-clip">
                <rect x="18" y="11" width="84" height="134" rx="6"/>
              </clipPath>
              <g clip-path="url(#battery-clip)">
                <!-- Fill level: 78% of 134px = 104.5px from bottom -->
                <rect x="18" y="40.5" width="84" height="104.5" fill="#3B82F6" opacity="0.15"/>
                <rect x="18" y="40.5" width="84" height="104.5" fill="url(#liquid-gradient)"/>
                <!-- Wave surface -->
                <path class="liquid-wave-path" d="M18,42 Q45,36 60,42 T102,42 V145 H18 Z" fill="#3B82F6" opacity="0.25">
                  <animate attributeName="d" values="M18,42 Q45,36 60,42 T102,42 V145 H18 Z;M18,40 Q45,46 60,40 T102,40 V145 H18 Z;M18,42 Q45,36 60,42 T102,42 V145 H18 Z" dur="3s" repeatCount="indefinite"/>
                </path>
              </g>
              <!-- Percentage text -->
              <text x="60" y="95" text-anchor="middle" fill="#60A5FA" font-family="JetBrains Mono" font-size="22" font-weight="700">78%</text>
              <text x="60" y="112" text-anchor="middle" fill="#3B82F6" font-family="Space Grotesk" font-size="9" opacity="0.7">CHARGING</text>
              <defs>
                <linearGradient id="liquid-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.08"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <!-- Battery stats -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">Capacity</span>
            <span class="mono text-xs text-white font-medium">10 kWh</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">Charge Rate</span>
            <span class="mono text-xs text-battery-400 font-medium">1.7 kW</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">Health</span>
            <span class="mono text-xs text-energy-400 font-medium">96%</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">Full By</span>
            <span class="mono text-xs text-white font-medium">~17:45</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">Cycles</span>
            <span class="mono text-xs text-gray-400 font-medium">342 / 6000</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom: Carbon + Grid Status + Self-sufficiency -->
    <div class="grid grid-cols-3 gap-4">
      <!-- Carbon offset -->
      <div class="scroll-reveal bg-surface rounded-xl p-5 border border-border">
        <div class="flex items-center gap-2 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M12 22c4-4 8-7.58 8-12a8 8 0 10-16 0c0 4.42 4 8 8 12z"/><path d="M12 12V8"/><path d="M12 8l-2 2"/></svg>
          <h3 class="display font-semibold text-sm text-white">Carbon Offset</h3>
        </div>
        <div class="mb-3">
          <div class="mono text-3xl font-bold text-energy-400" id="carbon-display">12.4</div>
          <div class="text-xs text-gray-500">kg CO2 avoided today</div>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">This Week</span>
            <span class="mono text-xs text-energy-400">78.2 kg</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">This Month</span>
            <span class="mono text-xs text-energy-400">312.8 kg</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">Lifetime</span>
            <span class="mono text-xs text-white font-medium">4.2 tonnes</span>
          </div>
          <!-- Tree equivalent -->
          <div class="mt-2 pt-2 border-t border-border">
            <div class="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M12 22V8"/><path d="M5 12l7-8 7 8"/><path d="M8 16l4-4 4 4"/></svg>
              <span class="text-[10px] text-gray-400">Equivalent to <span class="text-energy-400 font-medium">19 trees</span> planted</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid exchange -->
      <div class="scroll-reveal bg-surface rounded-xl p-5 border border-border">
        <div class="flex items-center gap-2 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          <h3 class="display font-semibold text-sm text-white">Grid Exchange</h3>
        </div>
        <div class="mb-3">
          <div class="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2l5 6H2l5-6z" fill="#10B981"/></svg>
            <span class="mono text-xl font-bold text-energy-400">Exporting</span>
          </div>
          <div class="mono text-2xl font-bold text-white mt-1">2.4 kW</div>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">Exported Today</span>
            <span class="mono text-xs text-energy-400">18.6 kWh</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">Imported Today</span>
            <span class="mono text-xs text-gray-400">2.1 kWh</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">Net Export</span>
            <span class="mono text-xs text-energy-400 font-medium">+16.5 kWh</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">Feed-in Revenue</span>
            <span class="mono text-xs text-white font-medium">$4.12</span>
          </div>
        </div>
      </div>

      <!-- Self-sufficiency gauge -->
      <div class="scroll-reveal bg-surface rounded-xl p-5 border border-border">
        <div class="flex items-center gap-2 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          <h3 class="display font-semibold text-sm text-white">Self-Sufficiency</h3>
        </div>
        <div class="flex justify-center mb-3">
          <svg viewBox="0 0 120 70" class="w-full" style="max-width: 160px;">
            <!-- Arc background -->
            <path d="M15,60 A45,45 0 0,1 105,60" fill="none" stroke="#1F2937" stroke-width="8" stroke-linecap="round"/>
            <!-- Arc progress (93%) -->
            <path d="M15,60 A45,45 0 0,1 105,60" fill="none" stroke="url(#sufficiency-grad)" stroke-width="8" stroke-linecap="round" stroke-dasharray="141.37" stroke-dashoffset="9.9"/>
            <text x="60" y="52" text-anchor="middle" fill="#10B981" font-family="JetBrains Mono" font-size="20" font-weight="700">93%</text>
            <text x="60" y="65" text-anchor="middle" fill="#6B7280" font-family="Space Grotesk" font-size="8">TODAY</text>
            <defs>
              <linearGradient id="sufficiency-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#F59E0B"/>
                <stop offset="50%" stop-color="#10B981"/>
                <stop offset="100%" stop-color="#06B6D4"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">7-day Avg</span>
            <span class="mono text-xs text-energy-400">88%</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">30-day Avg</span>
            <span class="mono text-xs text-energy-400">82%</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">Grid Dependency</span>
            <span class="mono text-xs text-gray-400">7%</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500">Best Day</span>
            <span class="mono text-xs text-white font-medium">98% (Feb 18)</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════ -->
  <!-- TAB: PRODUCTION                             -->
  <!-- ═══════════════════════════════════════════ -->
  <div class="tab-content p-6 space-y-6 hidden" id="tab-production">
    <!-- Solar Production Detail -->
    <div class="scroll-reveal bg-surface rounded-xl p-5 border border-border">
      <div class="flex items-center justify-between mb-4">
        <h2 class="display font-semibold text-sm text-white">Solar Array Performance</h2>
        <span class="mono text-[10px] text-solar-400 px-2 py-0.5 bg-solar-500/10 rounded-full border border-solar-500/20">24 panels active</span>
      </div>
      <div class="grid grid-cols-4 gap-4 mb-4">
        <div class="bg-base rounded-lg p-3 border border-border">
          <span class="text-[10px] text-gray-500 block">Current Output</span>
          <span class="mono text-lg font-bold text-solar-400">4.8 kW</span>
        </div>
        <div class="bg-base rounded-lg p-3 border border-border">
          <span class="text-[10px] text-gray-500 block">Today Total</span>
          <span class="mono text-lg font-bold text-white">28.4 kWh</span>
        </div>
        <div class="bg-base rounded-lg p-3 border border-border">
          <span class="text-[10px] text-gray-500 block">Peak Today</span>
          <span class="mono text-lg font-bold text-solar-400">5.6 kW</span>
          <span class="text-[10px] text-gray-500 block">at 12:15</span>
        </div>
        <div class="bg-base rounded-lg p-3 border border-border">
          <span class="text-[10px] text-gray-500 block">Efficiency</span>
          <span class="mono text-lg font-bold text-energy-400">21.8%</span>
        </div>
      </div>
      <!-- Panel grid -->
      <h4 class="text-xs text-gray-400 mb-2">Panel Status Grid</h4>
      <div class="grid grid-cols-12 gap-1.5">
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400" style="animation: glow-solar 4s ease-in-out infinite;">A1</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">A2</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">A3</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">A4</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">A5</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">A6</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">A7</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">A8</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">A9</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">A10</div>
        <div class="aspect-square rounded bg-solar-500/15 border border-solar-600/40 flex items-center justify-center text-[8px] mono text-solar-600">A11</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">A12</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">B1</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">B2</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">B3</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">B4</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">B5</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">B6</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">B7</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">B8</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">B9</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">B10</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">B11</div>
        <div class="aspect-square rounded bg-solar-500/20 border border-solar-500/30 flex items-center justify-center text-[8px] mono text-solar-400">B12</div>
      </div>
      <div class="flex items-center gap-3 mt-3 text-[10px]">
        <div class="flex items-center gap-1"><div class="w-3 h-3 rounded bg-solar-500/20 border border-solar-500/30"></div><span class="text-gray-400">Normal</span></div>
        <div class="flex items-center gap-1"><div class="w-3 h-3 rounded bg-solar-500/15 border border-solar-600/40"></div><span class="text-gray-400">Reduced (-11%)</span></div>
      </div>
    </div>

    <!-- Wind Production Detail -->
    <div class="scroll-reveal bg-surface rounded-xl p-5 border border-border">
      <div class="flex items-center justify-between mb-4">
        <h2 class="display font-semibold text-sm text-white">Wind Turbine Performance</h2>
        <span class="mono text-[10px] text-wind-400 px-2 py-0.5 bg-wind-500/10 rounded-full border border-wind-500/20">2 turbines active</span>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <!-- Turbine 1 -->
        <div class="bg-base rounded-lg p-4 border border-border">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs text-gray-300 font-medium">Turbine #1 - Roof North</span>
            <div class="w-2 h-2 rounded-full bg-wind-500" style="animation: glow-wind 3s ease-in-out infinite;"></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><span class="text-[10px] text-gray-500 block">Output</span><span class="mono text-sm font-bold text-wind-400">1.4 kW</span></div>
            <div><span class="text-[10px] text-gray-500 block">Wind Speed</span><span class="mono text-sm font-bold text-white">16 km/h</span></div>
            <div><span class="text-[10px] text-gray-500 block">RPM</span><span class="mono text-sm text-gray-300">820</span></div>
            <div><span class="text-[10px] text-gray-500 block">Bearing Temp</span><span class="mono text-sm text-energy-400">42C</span></div>
          </div>
        </div>
        <!-- Turbine 2 -->
        <div class="bg-base rounded-lg p-4 border border-border">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs text-gray-300 font-medium">Turbine #2 - Roof South</span>
            <div class="w-2 h-2 rounded-full bg-wind-500" style="animation: glow-wind 3s ease-in-out infinite;"></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><span class="text-[10px] text-gray-500 block">Output</span><span class="mono text-sm font-bold text-wind-400">1.0 kW</span></div>
            <div><span class="text-[10px] text-gray-500 block">Wind Speed</span><span class="mono text-sm font-bold text-white">12 km/h</span></div>
            <div><span class="text-[10px] text-gray-500 block">RPM</span><span class="mono text-sm text-gray-300">610</span></div>
            <div><span class="text-[10px] text-gray-500 block">Bearing Temp</span><span class="mono text-sm text-energy-400">38C</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Production history table -->
    <div class="scroll-reveal bg-surface rounded-xl p-5 border border-border">
      <h3 class="display font-semibold text-sm text-white mb-3">7-Day Production History</h3>
      <div class="overflow-hidden rounded-lg border border-border">
        <table class="w-full text-xs">
          <thead>
            <tr class="bg-base">
              <th class="text-left px-3 py-2 text-gray-500 font-medium">Date</th>
              <th class="text-right px-3 py-2 text-solar-400 font-medium">Solar</th>
              <th class="text-right px-3 py-2 text-wind-400 font-medium">Wind</th>
              <th class="text-right px-3 py-2 text-white font-medium">Total</th>
              <th class="text-right px-3 py-2 text-gray-500 font-medium">Peak</th>
            </tr>
          </thead>
          <tbody class="mono">
            <tr class="border-t border-border/50"><td class="px-3 py-2 text-gray-400">Feb 25</td><td class="px-3 py-2 text-right text-solar-400">28.4*</td><td class="px-3 py-2 text-right text-wind-400">14.2*</td><td class="px-3 py-2 text-right text-white font-medium">42.6*</td><td class="px-3 py-2 text-right text-gray-500">7.2 kW</td></tr>
            <tr class="border-t border-border/50"><td class="px-3 py-2 text-gray-400">Feb 24</td><td class="px-3 py-2 text-right text-solar-400">32.1</td><td class="px-3 py-2 text-right text-wind-400">11.8</td><td class="px-3 py-2 text-right text-white font-medium">43.9</td><td class="px-3 py-2 text-right text-gray-500">7.8 kW</td></tr>
            <tr class="border-t border-border/50"><td class="px-3 py-2 text-gray-400">Feb 23</td><td class="px-3 py-2 text-right text-solar-400">18.5</td><td class="px-3 py-2 text-right text-wind-400">18.3</td><td class="px-3 py-2 text-right text-white font-medium">36.8</td><td class="px-3 py-2 text-right text-gray-500">6.4 kW</td></tr>
            <tr class="border-t border-border/50"><td class="px-3 py-2 text-gray-400">Feb 22</td><td class="px-3 py-2 text-right text-solar-400">35.2</td><td class="px-3 py-2 text-right text-wind-400">8.9</td><td class="px-3 py-2 text-right text-white font-medium">44.1</td><td class="px-3 py-2 text-right text-gray-500">8.1 kW</td></tr>
            <tr class="border-t border-border/50"><td class="px-3 py-2 text-gray-400">Feb 21</td><td class="px-3 py-2 text-right text-solar-400">29.8</td><td class="px-3 py-2 text-right text-wind-400">15.1</td><td class="px-3 py-2 text-right text-white font-medium">44.9</td><td class="px-3 py-2 text-right text-gray-500">7.6 kW</td></tr>
            <tr class="border-t border-border/50"><td class="px-3 py-2 text-gray-400">Feb 20</td><td class="px-3 py-2 text-right text-solar-400">12.3</td><td class="px-3 py-2 text-right text-wind-400">22.4</td><td class="px-3 py-2 text-right text-white font-medium">34.7</td><td class="px-3 py-2 text-right text-gray-500">5.9 kW</td></tr>
            <tr class="border-t border-border/50"><td class="px-3 py-2 text-gray-400">Feb 19</td><td class="px-3 py-2 text-right text-solar-400">33.6</td><td class="px-3 py-2 text-right text-wind-400">9.7</td><td class="px-3 py-2 text-right text-white font-medium">43.3</td><td class="px-3 py-2 text-right text-gray-500">7.9 kW</td></tr>
          </tbody>
        </table>
      </div>
      <div class="text-[10px] text-gray-600 mt-2 mono">* Projected based on current rate</div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════ -->
  <!-- TAB: CONSUMPTION                            -->
  <!-- ═══════════════════════════════════════════ -->
  <div class="tab-content p-6 space-y-6 hidden" id="tab-consumption">
    <!-- Consumption by zone -->
    <div class="scroll-reveal bg-surface rounded-xl p-5 border border-border">
      <h2 class="display font-semibold text-sm text-white mb-4">Consumption by Zone</h2>
      <div class="space-y-3">
        <div>
          <div class="flex items-center justify-between text-xs mb-1.5">
            <div class="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="3"/></svg>
              <span class="text-gray-300">HVAC System</span>
            </div>
            <span class="mono text-red-400 font-medium">1.28 kW (41%)</span>
          </div>
          <div class="h-2.5 bg-base rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-red-500/80 to-red-400/60 rounded-full" style="width:41%;"></div></div>
        </div>
        <div>
          <div class="flex items-center justify-between text-xs mb-1.5">
            <div class="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/></svg>
              <span class="text-gray-300">Lighting</span>
            </div>
            <span class="mono text-solar-400 font-medium">0.53 kW (17%)</span>
          </div>
          <div class="h-2.5 bg-base rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-solar-500/80 to-solar-400/60 rounded-full" style="width:17%;"></div></div>
        </div>
        <div>
          <div class="flex items-center justify-between text-xs mb-1.5">
            <div class="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <span class="text-gray-300">Electronics</span>
            </div>
            <span class="mono text-purple-400 font-medium">0.47 kW (15%)</span>
          </div>
          <div class="h-2.5 bg-base rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-purple-500/80 to-purple-400/60 rounded-full" style="width:15%;"></div></div>
        </div>
        <div>
          <div class="flex items-center justify-between text-xs mb-1.5">
            <div class="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <span class="text-gray-300">Kitchen</span>
            </div>
            <span class="mono text-wind-400 font-medium">0.44 kW (14%)</span>
          </div>
          <div class="h-2.5 bg-base rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-wind-500/80 to-wind-400/60 rounded-full" style="width:14%;"></div></div>
        </div>
        <div>
          <div class="flex items-center justify-between text-xs mb-1.5">
            <div class="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span class="text-gray-300">Other</span>
            </div>
            <span class="mono text-gray-400 font-medium">0.38 kW (13%)</span>
          </div>
          <div class="h-2.5 bg-base rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-gray-500/80 to-gray-400/60 rounded-full" style="width:13%;"></div></div>
        </div>
      </div>
    </div>

    <!-- Energy tips -->
    <div class="scroll-reveal bg-surface rounded-xl p-5 border border-border">
      <h3 class="display font-semibold text-sm text-white mb-3">Smart Recommendations</h3>
      <div class="space-y-3">
        <div class="flex items-start gap-3 p-3 bg-base rounded-lg border border-border">
          <div class="w-7 h-7 rounded-md bg-energy-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div>
            <div class="text-xs text-white font-medium mb-0.5">Shift heavy loads to solar peak</div>
            <div class="text-[10px] text-gray-400">Run washing machine & dishwasher between 10:00-14:00 to maximize self-consumption. Potential savings: $2.40/day.</div>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 bg-base rounded-lg border border-border">
          <div class="w-7 h-7 rounded-md bg-solar-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M12 3v18M3 12h18"/></svg>
          </div>
          <div>
            <div class="text-xs text-white font-medium mb-0.5">HVAC optimization detected</div>
            <div class="text-[10px] text-gray-400">Raising thermostat by 1C during 14:00-18:00 could save ~6% on HVAC consumption. Current draw 1.28 kW is above baseline.</div>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 bg-base rounded-lg border border-border">
          <div class="w-7 h-7 rounded-md bg-battery-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/></svg>
          </div>
          <div>
            <div class="text-xs text-white font-medium mb-0.5">Battery discharge schedule</div>
            <div class="text-[10px] text-gray-400">Enable off-peak discharge (22:00-06:00) to sell stored energy at premium night tariff. Estimated bonus: $1.80/night.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cost analysis -->
    <div class="scroll-reveal bg-surface rounded-xl p-5 border border-border">
      <h3 class="display font-semibold text-sm text-white mb-3">Cost Analysis - This Month</h3>
      <div class="grid grid-cols-4 gap-3">
        <div class="bg-base rounded-lg p-3 border border-border text-center">
          <span class="text-[10px] text-gray-500 block mb-1">Without Solar</span>
          <span class="mono text-lg font-bold text-red-400">$186</span>
        </div>
        <div class="bg-base rounded-lg p-3 border border-border text-center">
          <span class="text-[10px] text-gray-500 block mb-1">Actual Cost</span>
          <span class="mono text-lg font-bold text-white">$28</span>
        </div>
        <div class="bg-base rounded-lg p-3 border border-border text-center">
          <span class="text-[10px] text-gray-500 block mb-1">Feed-in Revenue</span>
          <span class="mono text-lg font-bold text-energy-400">+$42</span>
        </div>
        <div class="bg-base rounded-lg p-3 border border-border text-center">
          <span class="text-[10px] text-gray-500 block mb-1">Net Savings</span>
          <span class="mono text-lg font-bold text-energy-400">$200</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════ -->
  <!-- TAB: STORAGE                                -->
  <!-- ═══════════════════════════════════════════ -->
  <div class="tab-content p-6 space-y-6 hidden" id="tab-storage">
    <!-- Battery packs detail -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Pack A -->
      <div class="scroll-reveal bg-surface rounded-xl p-5 border border-border">
        <div class="flex items-center justify-between mb-3">
          <h3 class="display font-semibold text-sm text-white">Pack A - LFP 5kWh</h3>
          <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-battery-500/10 border border-battery-500/20">
            <div class="w-1.5 h-1.5 rounded-full bg-battery-500" style="animation: glow-battery 3s ease-in-out infinite;"></div>
            <span class="mono text-[10px] text-battery-400">Charging</span>
          </div>
        </div>
        <!-- Mini battery visual -->
        <div class="flex items-center gap-4 mb-4">
          <div class="flex-1 h-8 bg-base rounded-md border border-border overflow-hidden relative">
            <div class="absolute inset-0 bg-gradient-to-r from-battery-500/30 to-battery-400/20 rounded-md" style="width: 82%;"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="mono text-xs font-bold text-battery-400 relative z-10">82%</span>
            </div>
          </div>
          <div class="w-2 h-4 bg-battery-500/30 rounded-r-sm"></div>
        </div>
        <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          <div class="flex justify-between"><span class="text-gray-500">Voltage</span><span class="mono text-white">51.2V</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Current</span><span class="mono text-battery-400">+33.2A</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Temperature</span><span class="mono text-energy-400">28C</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Health</span><span class="mono text-energy-400">97%</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Cycles</span><span class="mono text-gray-300">168</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Serial</span><span class="mono text-gray-500">LFP-A-0291</span></div>
        </div>
      </div>

      <!-- Pack B -->
      <div class="scroll-reveal bg-surface rounded-xl p-5 border border-border">
        <div class="flex items-center justify-between mb-3">
          <h3 class="display font-semibold text-sm text-white">Pack B - LFP 5kWh</h3>
          <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-battery-500/10 border border-battery-500/20">
            <div class="w-1.5 h-1.5 rounded-full bg-battery-500" style="animation: glow-battery 3s ease-in-out infinite;"></div>
            <span class="mono text-[10px] text-battery-400">Charging</span>
          </div>
        </div>
        <div class="flex items-center gap-4 mb-4">
          <div class="flex-1 h-8 bg-base rounded-md border border-border overflow-hidden relative">
            <div class="absolute inset-0 bg-gradient-to-r from-battery-500/30 to-battery-400/20 rounded-md" style="width: 74%;"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="mono text-xs font-bold text-battery-400 relative z-10">74%</span>
            </div>
          </div>
          <div class="w-2 h-4 bg-battery-500/30 rounded-r-sm"></div>
        </div>
        <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          <div class="flex justify-between"><span class="text-gray-500">Voltage</span><span class="mono text-white">50.8V</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Current</span><span class="mono text-battery-400">+33.2A</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Temperature</span><span class="mono text-energy-400">27C</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Health</span><span class="mono text-energy-400">95%</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Cycles</span><span class="mono text-gray-300">174</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Serial</span><span class="mono text-gray-500">LFP-B-0292</span></div>
        </div>
      </div>
    </div>

    <!-- Charge/discharge history chart -->
    <div class="scroll-reveal bg-surface rounded-xl p-5 border border-border">
      <h3 class="display font-semibold text-sm text-white mb-4">24h Charge/Discharge History</h3>
      <svg viewBox="0 0 600 160" class="w-full" style="max-height: 140px;">
        <!-- Center line (0) -->
        <line x1="40" y1="80" x2="580" y2="80" stroke="#1F2937" stroke-width="1"/>
        <line x1="40" y1="30" x2="580" y2="30" stroke="#1F2937" stroke-width="0.5" stroke-dasharray="3,3"/>
        <line x1="40" y1="130" x2="580" y2="130" stroke="#1F2937" stroke-width="0.5" stroke-dasharray="3,3"/>

        <text x="35" y="34" fill="#4B5563" font-family="JetBrains Mono" font-size="7" text-anchor="end">+3kW</text>
        <text x="35" y="84" fill="#4B5563" font-family="JetBrains Mono" font-size="7" text-anchor="end">0</text>
        <text x="35" y="134" fill="#4B5563" font-family="JetBrains Mono" font-size="7" text-anchor="end">-3kW</text>

        <!-- Charge bars (positive, blue) -->
        <rect x="55" y="75" width="18" height="5" rx="1" fill="#3B82F6" opacity="0.3"/>
        <rect x="80" y="72" width="18" height="8" rx="1" fill="#3B82F6" opacity="0.3"/>
        <rect x="105" y="74" width="18" height="6" rx="1" fill="#3B82F6" opacity="0.3"/>
        <rect x="130" y="76" width="18" height="4" rx="1" fill="#3B82F6" opacity="0.3"/>
        <rect x="155" y="78" width="18" height="2" rx="1" fill="#3B82F6" opacity="0.3"/>
        <rect x="180" y="78" width="18" height="2" rx="1" fill="#3B82F6" opacity="0.3"/>
        <!-- Morning: solar charging begins -->
        <rect x="205" y="65" width="18" height="15" rx="1" fill="#3B82F6" opacity="0.5"/>
        <rect x="230" y="50" width="18" height="30" rx="1" fill="#3B82F6" opacity="0.6"/>
        <rect x="255" y="42" width="18" height="38" rx="1" fill="#3B82F6" opacity="0.7"/>
        <rect x="280" y="38" width="18" height="42" rx="1" fill="#3B82F6" opacity="0.7"/>
        <rect x="305" y="35" width="18" height="45" rx="1" fill="#3B82F6" opacity="0.8"/>
        <rect x="330" y="40" width="18" height="40" rx="1" fill="#3B82F6" opacity="0.7"/>
        <!-- Afternoon -->
        <rect x="355" y="45" width="18" height="35" rx="1" fill="#3B82F6" opacity="0.6"/>
        <rect x="380" y="55" width="18" height="25" rx="1" fill="#3B82F6" opacity="0.5"/>
        <rect x="405" y="60" width="18" height="20" rx="1" fill="#3B82F6" opacity="0.4"/>
        <!-- Evening: discharge -->
        <rect x="430" y="80" width="18" height="15" rx="1" fill="#F59E0B" opacity="0.5"/>
        <rect x="455" y="80" width="18" height="25" rx="1" fill="#F59E0B" opacity="0.6"/>
        <rect x="480" y="80" width="18" height="35" rx="1" fill="#F59E0B" opacity="0.7"/>
        <rect x="505" y="80" width="18" height="30" rx="1" fill="#F59E0B" opacity="0.6"/>
        <rect x="530" y="80" width="18" height="20" rx="1" fill="#F59E0B" opacity="0.5"/>
        <rect x="555" y="80" width="18" height="10" rx="1" fill="#F59E0B" opacity="0.4"/>

        <!-- Time labels -->
        <text x="55" y="155" fill="#4B5563" font-family="JetBrains Mono" font-size="7" text-anchor="middle">00</text>
        <text x="180" y="155" fill="#4B5563" font-family="JetBrains Mono" font-size="7" text-anchor="middle">06</text>
        <text x="305" y="155" fill="#4B5563" font-family="JetBrains Mono" font-size="7" text-anchor="middle">12</text>
        <text x="430" y="155" fill="#4B5563" font-family="JetBrains Mono" font-size="7" text-anchor="middle">18</text>
        <text x="555" y="155" fill="#4B5563" font-family="JetBrains Mono" font-size="7" text-anchor="middle">24</text>
      </svg>
      <div class="flex items-center gap-4 mt-2 text-[10px]">
        <div class="flex items-center gap-1.5"><div class="w-3 h-2 rounded-sm bg-battery-500/60"></div><span class="text-gray-400">Charging</span></div>
        <div class="flex items-center gap-1.5"><div class="w-3 h-2 rounded-sm bg-solar-500/60"></div><span class="text-gray-400">Discharging</span></div>
      </div>
    </div>

    <!-- Battery settings -->
    <div class="scroll-reveal bg-surface rounded-xl p-5 border border-border">
      <h3 class="display font-semibold text-sm text-white mb-4">Battery Configuration</h3>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-base rounded-lg border border-border">
            <div>
              <span class="text-xs text-gray-300 block">Charge Limit</span>
              <span class="text-[10px] text-gray-500">Max SOC target</span>
            </div>
            <span class="mono text-sm font-bold text-battery-400">95%</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-base rounded-lg border border-border">
            <div>
              <span class="text-xs text-gray-300 block">Discharge Floor</span>
              <span class="text-[10px] text-gray-500">Min SOC reserve</span>
            </div>
            <span class="mono text-sm font-bold text-solar-400">15%</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-base rounded-lg border border-border">
            <div>
              <span class="text-xs text-gray-300 block">Max Charge Rate</span>
              <span class="text-[10px] text-gray-500">Per pack limit</span>
            </div>
            <span class="mono text-sm font-bold text-white">2.5 kW</span>
          </div>
        </div>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-base rounded-lg border border-border">
            <div>
              <span class="text-xs text-gray-300 block">Grid Export</span>
              <span class="text-[10px] text-gray-500">Battery to grid</span>
            </div>
            <span class="mono text-sm font-bold text-energy-400">Enabled</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-base rounded-lg border border-border">
            <div>
              <span class="text-xs text-gray-300 block">TOU Schedule</span>
              <span class="text-[10px] text-gray-500">Time-of-use mode</span>
            </div>
            <span class="mono text-sm font-bold text-energy-400">Active</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-base rounded-lg border border-border">
            <div>
              <span class="text-xs text-gray-300 block">Storm Guard</span>
              <span class="text-[10px] text-gray-500">Weather reserve</span>
            </div>
            <span class="mono text-sm font-bold text-solar-400">Armed</span>
          </div>
        </div>
      </div>
    </div>
  </div>

</main>

<!-- ═══════════════════════════════════════════════ -->
<!-- JAVASCRIPT                                      -->
<!-- ═══════════════════════════════════════════════ -->
<script>
// ── Device tree toggle ──
function toggleTree(nodeEl, treeId) {
  var children = document.getElementById('tree-' + treeId);
  var chevron = nodeEl.querySelector('.tree-chevron');
  if (children.classList.contains('expanded')) {
    children.classList.remove('expanded');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  } else {
    children.classList.add('expanded');
    if (chevron) chevron.style.transform = 'rotate(90deg)';
  }
  filterView(treeId, nodeEl);
}

// ── Filter view by tree node ──
var currentFilter = 'overview';
function filterView(filter, nodeEl) {
  currentFilter = filter;
  // Update active state on tree
  document.querySelectorAll('.tree-node').forEach(function(n) {
    n.classList.remove('active', 'active-solar', 'active-wind', 'active-battery', 'active-grid');
  });
  if (filter === 'overview') {
    nodeEl.classList.add('active');
  } else if (filter.indexOf('solar') === 0) {
    nodeEl.classList.add('active-solar');
  } else if (filter.indexOf('wind') === 0) {
    nodeEl.classList.add('active-wind');
  } else if (filter.indexOf('batt') === 0 || filter === 'battery') {
    nodeEl.classList.add('active-battery');
  } else if (filter === 'grid') {
    nodeEl.classList.add('active-grid');
  }

  // Update title
  var titleMap = {
    'overview': 'Energy Overview',
    'solar': 'Solar Array',
    'solar-a': 'Solar String A',
    'solar-b': 'Solar String B',
    'solar-inv': 'Solar Inverter SMA-5000',
    'wind': 'Wind Turbines',
    'wind-1': 'Wind Turbine #1',
    'wind-2': 'Wind Turbine #2',
    'grid': 'Grid Connection',
    'battery': 'Battery Bank',
    'batt-1': 'Battery Pack A',
    'batt-2': 'Battery Pack B',
    'batt-inv': 'Hybrid Inverter'
  };
  document.getElementById('view-title').textContent = titleMap[filter] || 'Energy Overview';

  // Switch to relevant tab
  if (filter.indexOf('solar') === 0 || filter.indexOf('wind') === 0) {
    switchTab('production', document.querySelector('[data-tab="production"]'));
  } else if (filter.indexOf('batt') === 0 || filter === 'battery') {
    switchTab('storage', document.querySelector('[data-tab="storage"]'));
  } else if (filter === 'grid') {
    switchTab('consumption', document.querySelector('[data-tab="consumption"]'));
  } else {
    switchTab('overview', document.querySelector('[data-tab="overview"]'));
  }
}

// ── Tab switching ──
function switchTab(tabId, btnEl) {
  // Hide all tab content
  document.querySelectorAll('.tab-content').forEach(function(tc) {
    tc.classList.add('hidden');
  });
  document.getElementById('tab-' + tabId).classList.remove('hidden');

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(function(tb) {
    tb.classList.remove('active-tab');
    tb.classList.add('text-gray-500');
    tb.classList.remove('text-energy-400');
  });
  if (btnEl) {
    btnEl.classList.add('active-tab');
    btnEl.classList.remove('text-gray-500');
    btnEl.classList.add('text-energy-400');
  }

  // Trigger scroll reveal for newly visible content
  setTimeout(observeNewElements, 100);
}

// ── Animated counters ──
function animateCounters() {
  var counters = document.querySelectorAll('.counter-value');
  counters.forEach(function(el) {
    var target = parseFloat(el.getAttribute('data-target'));
    if (isNaN(target)) return;
    var suffix = el.getAttribute('data-suffix') || '';
    var current = 0;
    var increment = target / 40;
    var timer = setInterval(function() {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = current.toFixed(1) + suffix;
    }, 35);
  });
}

// ── Carbon counter tick ──
var carbonValue = 12.4;
function tickCarbon() {
  carbonValue += 0.01;
  var display = document.getElementById('carbon-display');
  var sidebar = document.getElementById('carbon-counter');
  if (display) display.textContent = carbonValue.toFixed(1);
  if (sidebar) sidebar.textContent = carbonValue.toFixed(1);
}
setInterval(tickCarbon, 3000);

// ── Toast notification ──
function showToast(message, type) {
  var container = document.getElementById('toast-container');
  var toast = document.createElement('div');
  var bgColor = type === 'success' ? 'bg-energy-500/20 border border-energy-500/30 text-energy-400' :
                type === 'warning' ? 'bg-solar-500/20 border border-solar-500/30 text-solar-400' :
                'bg-battery-500/20 border border-battery-500/30 text-battery-400';
  toast.className = 'toast ' + bgColor;

  var iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  } else if (type === 'warning') {
    iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  } else {
    iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }
  toast.innerHTML = iconSvg + '<span class="text-xs font-medium">' + message + '</span>';
  container.appendChild(toast);

  setTimeout(function() {
    toast.classList.add('hiding');
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4000);
}

// ── Scheduled toasts ──
setTimeout(function() {
  showToast('Solar production peak reached: 5.6 kW', 'warning');
}, 2500);
setTimeout(function() {
  showToast('Battery Pack A charging complete soon', 'info');
}, 7000);
setTimeout(function() {
  showToast('Grid export surplus: +2.4 kW feed-in active', 'success');
}, 11000);

// ── IntersectionObserver for scroll reveal ──
function observeNewElements() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'power-on-scale 0.6s ease forwards';
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.scroll-reveal:not(.revealed)').forEach(function(el) {
    observer.observe(el);
  });
}

// ── Init ──
document.addEventListener('DOMContentLoaded', function() {
  // Animate counters
  setTimeout(animateCounters, 400);

  // Observe scroll reveals
  observeNewElements();

  // Expand solar tree by default
  var solarChildren = document.getElementById('tree-solar');
  if (solarChildren) {
    solarChildren.classList.add('expanded');
    var solarChevron = solarChildren.previousElementSibling.querySelector('.tree-chevron');
    if (solarChevron) solarChevron.style.transform = 'rotate(90deg)';
  }
});
</script>

</body>
</html>
  $HTML$,
  2
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
