INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '3e0aef14-4916-4e49-bff2-7478ed4a6b56',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>IoT Hub - Control Room</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        body: ['Inter', 'sans-serif']
      },
      colors: {
        navy: { 900: '#0c1222', 800: '#111a2e', 700: '#162033', 600: '#1a2744' },
        cyan: { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' }
      }
    }
  }
}
</script>
<style>
* { font-family: 'Inter', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #0c1222;
  background-image: radial-gradient(circle, #1a2332 1px, transparent 1px);
  background-size: 24px 24px;
  color: #e2e8f0;
  min-height: 100vh;
  overflow: hidden;
}
.font-mono { font-family: 'Space Mono', monospace; }

/* Status LED Blink Animations */
@keyframes blink-online {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px 2px rgba(34,197,94,0.6); }
  50% { opacity: 0.4; box-shadow: 0 0 2px 1px rgba(34,197,94,0.2); }
}
@keyframes blink-warning {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px 2px rgba(245,158,11,0.6); }
  40% { opacity: 0.3; box-shadow: 0 0 2px 1px rgba(245,158,11,0.2); }
}
@keyframes blink-offline {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px 2px rgba(239,68,68,0.7); }
  30% { opacity: 0.2; box-shadow: 0 0 2px 1px rgba(239,68,68,0.2); }
}
.led-online { animation: blink-online 2.5s ease-in-out infinite; }
.led-warning { animation: blink-warning 1.5s ease-in-out infinite; }
.led-offline { animation: blink-offline 0.8s ease-in-out infinite; }

/* Animated dashed connections */
@keyframes dash-flow {
  to { stroke-dashoffset: -20; }
}
.connection-line {
  stroke-dasharray: 8 4;
  animation: dash-flow 1.5s linear infinite;
}
.connection-line-warning {
  stroke-dasharray: 6 6;
  animation: dash-flow 2s linear infinite;
}
.connection-line-offline {
  stroke-dasharray: 3 8;
  animation: none;
  opacity: 0.3;
}

/* Gateway glow pulse */
@keyframes gateway-pulse {
  0%, 100% { filter: drop-shadow(0 0 12px rgba(6,182,212,0.5)); }
  50% { filter: drop-shadow(0 0 24px rgba(6,182,212,0.8)); }
}
.gateway-glow { animation: gateway-pulse 3s ease-in-out infinite; }

/* Device node hover */
.device-node { cursor: pointer; transition: transform 0.2s; }
.device-node:hover { transform: scale(1.08); }
.device-node.selected { filter: drop-shadow(0 0 16px rgba(6,182,212,0.6)); }

/* Sparkline */
@keyframes sparkline-draw {
  from { stroke-dashoffset: 200; }
  to { stroke-dashoffset: 0; }
}
.sparkline-path {
  stroke-dasharray: 200;
  animation: sparkline-draw 1.5s ease-out forwards;
}

/* Tab active */
.tab-item { transition: all 0.2s; }
.tab-item:hover { color: #22d3ee; }
.tab-item.active { color: #06b6d4; border-bottom: 2px solid #06b6d4; }

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }

/* Alert severity */
.alert-critical { border-left: 3px solid #ef4444; }
.alert-warning { border-left: 3px solid #f59e0b; }
.alert-info { border-left: 3px solid #06b6d4; }

/* Connection status indicator */
@keyframes status-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.status-breathe { animation: status-breathe 2s ease-in-out infinite; }
</style>
</head>
<body class="h-screen flex flex-col">

<!-- Top Bar -->
<header class="h-12 bg-navy-800/80 backdrop-blur border-b border-cyan-500/10 flex items-center justify-between px-5 flex-shrink-0">
  <div class="flex items-center gap-6">
    <div class="flex items-center gap-2">
      <div class="w-7 h-7 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="#06b6d4" stroke-width="1.5"/><circle cx="8" cy="2" r="1" fill="#06b6d4"/><circle cx="14" cy="8" r="1" fill="#06b6d4"/><circle cx="8" cy="14" r="1" fill="#06b6d4"/><circle cx="2" cy="8" r="1" fill="#06b6d4"/><line x1="8" y1="5" x2="8" y2="3" stroke="#06b6d4" stroke-width="0.8"/><line x1="11" y1="8" x2="13" y2="8" stroke="#06b6d4" stroke-width="0.8"/><line x1="8" y1="11" x2="8" y2="13" stroke="#06b6d4" stroke-width="0.8"/><line x1="5" y1="8" x2="3" y2="8" stroke="#06b6d4" stroke-width="0.8"/></svg>
      </div>
      <span class="font-mono text-sm font-bold text-cyan-400 tracking-wider">IoT Hub</span>
    </div>
    <nav class="flex items-center gap-1">
      <button class="tab-item active font-mono text-xs px-3 py-3" onclick="switchTab('topology')">Devices (24)</button>
      <button class="tab-item font-mono text-xs px-3 py-3 text-gray-500" onclick="switchTab('alerts')">Alerts (3)</button>
      <button class="tab-item font-mono text-xs px-3 py-3 text-gray-500" onclick="switchTab('logs')">Logs</button>
    </nav>
  </div>
  <div class="flex items-center gap-5">
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-green-400 status-breathe"></span>
      <span class="font-mono text-[11px] text-green-400">CONNECTED</span>
    </div>
    <div class="font-mono text-[11px] text-gray-400" id="system-clock">--:--:--</div>
  </div>
</header>

<!-- Main Content -->
<div class="flex-1 flex overflow-hidden">

  <!-- Topology Map (65%) -->
  <div id="view-topology" class="flex-1 relative p-4">
    <svg id="topology-svg" class="w-full h-full" viewBox="0 0 700 500" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="gateway-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
        </radialGradient>
        <filter id="glow-cyan">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-green">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Connection Lines -->
      <line x1="350" y1="250" x2="160" y2="100" class="connection-line" stroke="#06b6d4" stroke-width="1.2" opacity="0.5"/>
      <line x1="350" y1="250" x2="540" y2="100" class="connection-line" stroke="#06b6d4" stroke-width="1.2" opacity="0.5"/>
      <line x1="350" y1="250" x2="120" y2="280" class="connection-line-warning" stroke="#f59e0b" stroke-width="1.2" opacity="0.5"/>
      <line x1="350" y1="250" x2="580" y2="280" class="connection-line" stroke="#06b6d4" stroke-width="1.2" opacity="0.5"/>
      <line x1="350" y1="250" x2="180" y2="420" class="connection-line-offline" stroke="#ef4444" stroke-width="1.2"/>
      <line x1="350" y1="250" x2="520" y2="420" class="connection-line" stroke="#06b6d4" stroke-width="1.2" opacity="0.5"/>

      <!-- Gateway Hub (Center) -->
      <circle cx="350" cy="250" r="60" fill="url(#gateway-grad)" class="gateway-glow"/>
      <circle cx="350" cy="250" r="36" fill="#0c1222" stroke="#06b6d4" stroke-width="2" filter="url(#glow-cyan)"/>
      <circle cx="350" cy="250" r="28" fill="none" stroke="#06b6d4" stroke-width="0.5" opacity="0.3"/>
      <text x="350" y="246" text-anchor="middle" fill="#06b6d4" font-family="Space Mono, monospace" font-size="10" font-weight="700">GATEWAY</text>
      <text x="350" y="260" text-anchor="middle" fill="#22d3ee" font-family="Space Mono, monospace" font-size="7" opacity="0.7">HUB-001</text>

      <!-- Device 1: Temp Sensor #1 (Top-Left) -->
      <g class="device-node" data-device="0" onclick="selectDevice(0)">
        <circle cx="160" cy="100" r="28" fill="#111a2e" stroke="#1e3a5f" stroke-width="1.5"/>
        <text x="160" y="90" text-anchor="middle" fill="#e2e8f0" font-size="14">🌡️</text>
        <text x="160" y="105" text-anchor="middle" fill="#94a3b8" font-family="Space Mono, monospace" font-size="7">TEMP #1</text>
        <text x="160" y="116" text-anchor="middle" fill="#22d3ee" font-family="Space Mono, monospace" font-size="9" font-weight="700">23.5°C</text>
        <!-- LED Online (green, slow blink) -->
        <circle cx="183" cy="78" r="4" fill="#22c55e" class="led-online"/>
      </g>

      <!-- Device 2: Motion Cam #2 (Top-Right) -->
      <g class="device-node" data-device="1" onclick="selectDevice(1)">
        <circle cx="540" cy="100" r="28" fill="#111a2e" stroke="#1e3a5f" stroke-width="1.5"/>
        <text x="540" y="90" text-anchor="middle" fill="#e2e8f0" font-size="14">📹</text>
        <text x="540" y="105" text-anchor="middle" fill="#94a3b8" font-family="Space Mono, monospace" font-size="7">CAM #2</text>
        <text x="540" y="116" text-anchor="middle" fill="#22d3ee" font-family="Space Mono, monospace" font-size="9" font-weight="700">Active</text>
        <!-- LED Online -->
        <circle cx="563" cy="78" r="4" fill="#22c55e" class="led-online"/>
      </g>

      <!-- Device 3: Door Lock #3 (Mid-Left) - Warning -->
      <g class="device-node" data-device="2" onclick="selectDevice(2)">
        <circle cx="120" cy="280" r="28" fill="#111a2e" stroke="#f59e0b" stroke-width="1.5" opacity="0.7"/>
        <text x="120" y="270" text-anchor="middle" fill="#e2e8f0" font-size="14">🔒</text>
        <text x="120" y="285" text-anchor="middle" fill="#94a3b8" font-family="Space Mono, monospace" font-size="7">LOCK #3</text>
        <text x="120" y="296" text-anchor="middle" fill="#f59e0b" font-family="Space Mono, monospace" font-size="9" font-weight="700">Locked</text>
        <!-- LED Warning (amber, medium blink) -->
        <circle cx="143" cy="258" r="4" fill="#f59e0b" class="led-warning"/>
      </g>

      <!-- Device 4: HVAC Unit #4 (Mid-Right) -->
      <g class="device-node" data-device="3" onclick="selectDevice(3)">
        <circle cx="580" cy="280" r="28" fill="#111a2e" stroke="#1e3a5f" stroke-width="1.5"/>
        <text x="580" y="270" text-anchor="middle" fill="#e2e8f0" font-size="14">❄️</text>
        <text x="580" y="285" text-anchor="middle" fill="#94a3b8" font-family="Space Mono, monospace" font-size="7">HVAC #4</text>
        <text x="580" y="296" text-anchor="middle" fill="#22d3ee" font-family="Space Mono, monospace" font-size="9" font-weight="700">21°C</text>
        <!-- LED Online -->
        <circle cx="603" cy="258" r="4" fill="#22c55e" class="led-online"/>
      </g>

      <!-- Device 5: Smoke Detector #5 (Bottom-Left) - Offline -->
      <g class="device-node" data-device="4" onclick="selectDevice(4)">
        <circle cx="180" cy="420" r="28" fill="#111a2e" stroke="#ef4444" stroke-width="1.5" opacity="0.5"/>
        <text x="180" y="410" text-anchor="middle" fill="#e2e8f0" font-size="14" opacity="0.5">🔥</text>
        <text x="180" y="425" text-anchor="middle" fill="#94a3b8" font-family="Space Mono, monospace" font-size="7" opacity="0.5">SMOKE #5</text>
        <text x="180" y="436" text-anchor="middle" fill="#ef4444" font-family="Space Mono, monospace" font-size="9" font-weight="700">Offline</text>
        <!-- LED Offline (red, fast blink) -->
        <circle cx="203" cy="398" r="4" fill="#ef4444" class="led-offline"/>
      </g>

      <!-- Device 6: Light Panel #6 (Bottom-Right) -->
      <g class="device-node" data-device="5" onclick="selectDevice(5)">
        <circle cx="520" cy="420" r="28" fill="#111a2e" stroke="#1e3a5f" stroke-width="1.5"/>
        <text x="520" y="410" text-anchor="middle" fill="#e2e8f0" font-size="14">💡</text>
        <text x="520" y="425" text-anchor="middle" fill="#94a3b8" font-family="Space Mono, monospace" font-size="7">LIGHT #6</text>
        <text x="520" y="436" text-anchor="middle" fill="#22d3ee" font-family="Space Mono, monospace" font-size="9" font-weight="700">80%</text>
        <!-- LED Online -->
        <circle cx="543" cy="398" r="4" fill="#22c55e" class="led-online"/>
      </g>

      <!-- Outer ring decoration -->
      <circle cx="350" cy="250" r="180" fill="none" stroke="#1a2744" stroke-width="0.5" stroke-dasharray="4 8" opacity="0.4"/>
      <circle cx="350" cy="250" r="220" fill="none" stroke="#1a2744" stroke-width="0.3" stroke-dasharray="2 12" opacity="0.2"/>
    </svg>

    <!-- Legend overlay -->
    <div class="absolute bottom-4 left-4 flex items-center gap-4 bg-navy-800/80 backdrop-blur rounded-lg px-4 py-2 border border-cyan-500/10">
      <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-green-400 led-online"></span><span class="font-mono text-[10px] text-gray-400">Online</span></div>
      <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-400 led-warning"></span><span class="font-mono text-[10px] text-gray-400">Warning</span></div>
      <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-red-400 led-offline"></span><span class="font-mono text-[10px] text-gray-400">Offline</span></div>
      <div class="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-700">
        <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#06b6d4" stroke-width="1" stroke-dasharray="4 2"/></svg>
        <span class="font-mono text-[10px] text-gray-400">Active Link</span>
      </div>
    </div>
  </div>

  <!-- Alerts View (hidden by default) -->
  <div id="view-alerts" class="flex-1 p-5 overflow-auto hidden">
    <div class="max-w-2xl mx-auto space-y-3">
      <h2 class="font-mono text-sm text-cyan-400 mb-4">ACTIVE ALERTS</h2>
      <div class="alert-critical bg-navy-800/60 rounded-lg p-4 border border-red-500/20">
        <div class="flex items-center justify-between mb-1">
          <span class="font-mono text-xs text-red-400 font-bold">CRITICAL</span>
          <span class="font-mono text-[10px] text-gray-500">14:23:01</span>
        </div>
        <p class="text-sm">Smoke Detector #5 has gone offline. Last signal: 4 min ago.</p>
        <p class="font-mono text-[10px] text-gray-500 mt-1">Device: SMOKE-005 &middot; Zone: Kitchen</p>
      </div>
      <div class="alert-warning bg-navy-800/60 rounded-lg p-4 border border-amber-500/20">
        <div class="flex items-center justify-between mb-1">
          <span class="font-mono text-xs text-amber-400 font-bold">WARNING</span>
          <span class="font-mono text-[10px] text-gray-500">14:18:44</span>
        </div>
        <p class="text-sm">Door Lock #3 battery level at 12%. Replace soon.</p>
        <p class="font-mono text-[10px] text-gray-500 mt-1">Device: LOCK-003 &middot; Zone: Entrance</p>
      </div>
      <div class="alert-info bg-navy-800/60 rounded-lg p-4 border border-cyan-500/20">
        <div class="flex items-center justify-between mb-1">
          <span class="font-mono text-xs text-cyan-400 font-bold">INFO</span>
          <span class="font-mono text-[10px] text-gray-500">13:55:12</span>
        </div>
        <p class="text-sm">HVAC Unit #4 auto-adjusted to 21°C (schedule: Afternoon).</p>
        <p class="font-mono text-[10px] text-gray-500 mt-1">Device: HVAC-004 &middot; Zone: Living Room</p>
      </div>
      <h2 class="font-mono text-sm text-gray-500 mt-6 mb-3">RESOLVED</h2>
      <div class="bg-navy-800/30 rounded-lg p-4 border border-gray-700/30 opacity-50">
        <div class="flex items-center justify-between mb-1">
          <span class="font-mono text-xs text-green-400 font-bold">RESOLVED</span>
          <span class="font-mono text-[10px] text-gray-500">12:30:00</span>
        </div>
        <p class="text-sm text-gray-400">Temp Sensor #1 connectivity restored after firmware update.</p>
      </div>
    </div>
  </div>

  <!-- Logs View (hidden by default) -->
  <div id="view-logs" class="flex-1 p-5 overflow-auto hidden">
    <div class="max-w-3xl mx-auto">
      <h2 class="font-mono text-sm text-cyan-400 mb-4">SYSTEM LOG</h2>
      <div class="bg-navy-800/40 rounded-lg border border-gray-700/30 font-mono text-[11px] leading-6 p-4 space-y-0">
        <div><span class="text-gray-500">14:27:03</span> <span class="text-cyan-400">[GW-001]</span> Heartbeat OK &middot; 24 devices polled</div>
        <div><span class="text-gray-500">14:23:01</span> <span class="text-red-400">[SMOKE-005]</span> Connection lost &middot; timeout 30s</div>
        <div><span class="text-gray-500">14:22:58</span> <span class="text-red-400">[SMOKE-005]</span> Retry 3/3 failed</div>
        <div><span class="text-gray-500">14:22:45</span> <span class="text-amber-400">[LOCK-003]</span> Battery: 12% &middot; threshold alert triggered</div>
        <div><span class="text-gray-500">14:20:10</span> <span class="text-green-400">[CAM-002]</span> Motion detected &middot; Zone: Front Door</div>
        <div><span class="text-gray-500">14:18:44</span> <span class="text-cyan-400">[HVAC-004]</span> Setpoint changed: 23&deg;C &rarr; 21&deg;C</div>
        <div><span class="text-gray-500">14:15:00</span> <span class="text-cyan-400">[GW-001]</span> Heartbeat OK &middot; 24 devices polled</div>
        <div><span class="text-gray-500">14:12:33</span> <span class="text-green-400">[LIGHT-006]</span> Dimmer adjusted to 80%</div>
        <div><span class="text-gray-500">14:10:01</span> <span class="text-green-400">[TEMP-001]</span> Reading: 23.5&deg;C / 58% RH</div>
        <div><span class="text-gray-500">14:05:22</span> <span class="text-cyan-400">[GW-001]</span> Firmware v2.4.1 &middot; uptime 14d 6h</div>
      </div>
    </div>
  </div>

  <!-- Right Panel (35%) -->
  <aside id="right-panel" class="w-[35%] min-w-[320px] bg-navy-800/50 border-l border-cyan-500/10 flex flex-col overflow-hidden flex-shrink-0">

    <!-- Device Detail Card -->
    <div class="p-5 border-b border-gray-700/30 flex-shrink-0">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span id="detail-icon" class="text-xl">🌡️</span>
          <div>
            <h3 id="detail-name" class="font-mono text-sm font-bold text-white">Temp Sensor #1</h3>
            <p id="detail-id" class="font-mono text-[10px] text-gray-500">TEMP-001 &middot; Zone: Living Room</p>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <span id="detail-led" class="w-2.5 h-2.5 rounded-full bg-green-400 led-online"></span>
          <span id="detail-status" class="font-mono text-[10px] text-green-400">Online</span>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-3 gap-2" id="detail-stats">
        <div class="bg-navy-900/60 rounded-lg p-2.5 text-center border border-gray-700/20">
          <div class="font-mono text-[10px] text-gray-500 mb-0.5">Reading</div>
          <div class="font-mono text-sm font-bold text-cyan-400" id="stat-reading">23.5°C</div>
        </div>
        <div class="bg-navy-900/60 rounded-lg p-2.5 text-center border border-gray-700/20">
          <div class="font-mono text-[10px] text-gray-500 mb-0.5">Uptime</div>
          <div class="font-mono text-sm font-bold text-white" id="stat-uptime">14d 6h</div>
        </div>
        <div class="bg-navy-900/60 rounded-lg p-2.5 text-center border border-gray-700/20">
          <div class="font-mono text-[10px] text-gray-500 mb-0.5">Signal</div>
          <div class="font-mono text-sm font-bold text-green-400" id="stat-signal">-42 dBm</div>
        </div>
      </div>
    </div>

    <!-- Sparkline Chart -->
    <div class="p-5 border-b border-gray-700/30 flex-shrink-0">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-mono text-[11px] text-gray-400 uppercase tracking-wider">Last 6 Readings</h4>
        <span class="font-mono text-[10px] text-gray-600">15 min intervals</span>
      </div>
      <svg id="sparkline-chart" viewBox="0 0 280 60" class="w-full">
        <defs>
          <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="M10,45 L56,38 L102,42 L148,30 L194,25 L240,20" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" class="sparkline-path"/>
        <path d="M10,45 L56,38 L102,42 L148,30 L194,25 L240,20 L240,58 L10,58Z" fill="url(#spark-grad)" opacity="0.5"/>
        <!-- Data points -->
        <circle cx="10" cy="45" r="2.5" fill="#0c1222" stroke="#06b6d4" stroke-width="1.5"/>
        <circle cx="56" cy="38" r="2.5" fill="#0c1222" stroke="#06b6d4" stroke-width="1.5"/>
        <circle cx="102" cy="42" r="2.5" fill="#0c1222" stroke="#06b6d4" stroke-width="1.5"/>
        <circle cx="148" cy="30" r="2.5" fill="#0c1222" stroke="#06b6d4" stroke-width="1.5"/>
        <circle cx="194" cy="25" r="2.5" fill="#0c1222" stroke="#06b6d4" stroke-width="1.5"/>
        <circle cx="240" cy="20" r="2.5" fill="#06b6d4" stroke="#06b6d4" stroke-width="1.5"/>
        <!-- Labels -->
        <text x="10" y="55" text-anchor="middle" fill="#475569" font-family="Space Mono, monospace" font-size="6">22.8</text>
        <text x="56" y="55" text-anchor="middle" fill="#475569" font-family="Space Mono, monospace" font-size="6">23.0</text>
        <text x="102" y="55" text-anchor="middle" fill="#475569" font-family="Space Mono, monospace" font-size="6">22.9</text>
        <text x="148" y="55" text-anchor="middle" fill="#475569" font-family="Space Mono, monospace" font-size="6">23.2</text>
        <text x="194" y="55" text-anchor="middle" fill="#475569" font-family="Space Mono, monospace" font-size="6">23.4</text>
        <text x="240" y="55" text-anchor="middle" fill="#22d3ee" font-family="Space Mono, monospace" font-size="6">23.5</text>
      </svg>
    </div>

    <!-- Alert Log -->
    <div class="flex-1 overflow-auto p-5">
      <h4 class="font-mono text-[11px] text-gray-400 uppercase tracking-wider mb-3">Recent Alerts</h4>
      <div class="space-y-2">
        <div class="alert-critical bg-navy-900/40 rounded-lg p-3 border border-red-500/10">
          <div class="flex items-center justify-between">
            <span class="font-mono text-[10px] text-red-400 font-bold">CRITICAL</span>
            <span class="font-mono text-[9px] text-gray-600">14:23:01</span>
          </div>
          <p class="text-xs text-gray-300 mt-1">Smoke Detector #5 offline</p>
          <p class="font-mono text-[9px] text-gray-500 mt-0.5">No heartbeat for 4 min</p>
        </div>
        <div class="alert-warning bg-navy-900/40 rounded-lg p-3 border border-amber-500/10">
          <div class="flex items-center justify-between">
            <span class="font-mono text-[10px] text-amber-400 font-bold">WARNING</span>
            <span class="font-mono text-[9px] text-gray-600">14:18:44</span>
          </div>
          <p class="text-xs text-gray-300 mt-1">Door Lock #3 low battery</p>
          <p class="font-mono text-[9px] text-gray-500 mt-0.5">Battery: 12% &middot; Replace within 48h</p>
        </div>
        <div class="alert-info bg-navy-900/40 rounded-lg p-3 border border-cyan-500/10">
          <div class="flex items-center justify-between">
            <span class="font-mono text-[10px] text-cyan-400 font-bold">INFO</span>
            <span class="font-mono text-[9px] text-gray-600">13:55:12</span>
          </div>
          <p class="text-xs text-gray-300 mt-1">HVAC auto-adjusted to 21°C</p>
          <p class="font-mono text-[9px] text-gray-500 mt-0.5">Schedule: Afternoon preset</p>
        </div>
      </div>
    </div>
  </aside>
</div>

<!-- Bottom Strip -->
<footer class="h-8 bg-navy-800/80 backdrop-blur border-t border-cyan-500/10 flex items-center justify-between px-5 flex-shrink-0">
  <div class="flex items-center gap-4 font-mono text-[10px] text-gray-500">
    <span>24 devices</span>
    <span class="text-gray-700">&middot;</span>
    <span class="text-green-400">21 online</span>
    <span class="text-gray-700">&middot;</span>
    <span class="text-amber-400">1 warning</span>
    <span class="text-gray-700">&middot;</span>
    <span class="text-red-400">1 offline</span>
    <span class="text-gray-700">&middot;</span>
    <span>3 alerts</span>
  </div>
  <div class="font-mono text-[10px] text-gray-600">
    Last sync: <span id="sync-timer" class="text-cyan-500">2s</span> ago &middot; Gateway v2.4.1
  </div>
</footer>

<script>
// Device data
const devices = [
  {
    name: 'Temp Sensor #1', id: 'TEMP-001', zone: 'Living Room', icon: '🌡️',
    status: 'online', reading: '23.5°C', uptime: '14d 6h', signal: '-42 dBm',
    sparkline: [22.8, 23.0, 22.9, 23.2, 23.4, 23.5],
    alerts: []
  },
  {
    name: 'Motion Cam #2', id: 'CAM-002', zone: 'Front Door', icon: '📹',
    status: 'online', reading: 'Active', uptime: '7d 2h', signal: '-38 dBm',
    sparkline: [0, 2, 0, 1, 3, 1],
    alerts: []
  },
  {
    name: 'Door Lock #3', id: 'LOCK-003', zone: 'Entrance', icon: '🔒',
    status: 'warning', reading: 'Locked', uptime: '30d 1h', signal: '-55 dBm',
    sparkline: [85, 72, 60, 45, 28, 12],
    alerts: ['Low battery: 12%']
  },
  {
    name: 'HVAC Unit #4', id: 'HVAC-004', zone: 'Living Room', icon: '❄️',
    status: 'online', reading: '21°C', uptime: '3d 14h', signal: '-44 dBm',
    sparkline: [23, 23, 22, 22, 21, 21],
    alerts: []
  },
  {
    name: 'Smoke Detector #5', id: 'SMOKE-005', zone: 'Kitchen', icon: '🔥',
    status: 'offline', reading: 'N/A', uptime: '--', signal: 'No signal',
    sparkline: [0, 0, 0, 0, 0, 0],
    alerts: ['Device offline', 'No heartbeat for 4 min']
  },
  {
    name: 'Light Panel #6', id: 'LIGHT-006', zone: 'Bedroom', icon: '💡',
    status: 'online', reading: '80%', uptime: '21d 8h', signal: '-40 dBm',
    sparkline: [100, 100, 80, 80, 80, 80],
    alerts: []
  }
];

let selectedDevice = 0;

function selectDevice(index) {
  selectedDevice = index;
  const d = devices[index];

  // Update node selection visual
  document.querySelectorAll('.device-node').forEach((n, i) => {
    n.classList.toggle('selected', i === index);
  });

  // Update detail panel
  document.getElementById('detail-icon').textContent = d.icon;
  document.getElementById('detail-name').textContent = d.name;
  document.getElementById('detail-id').textContent = d.id + ' \u00b7 Zone: ' + d.zone;
  document.getElementById('stat-reading').textContent = d.reading;
  document.getElementById('stat-uptime').textContent = d.uptime;
  document.getElementById('stat-signal').textContent = d.signal;

  // Status LED
  const led = document.getElementById('detail-led');
  const statusText = document.getElementById('detail-status');
  led.className = 'w-2.5 h-2.5 rounded-full';
  if (d.status === 'online') {
    led.classList.add('bg-green-400', 'led-online');
    statusText.textContent = 'Online';
    statusText.className = 'font-mono text-[10px] text-green-400';
  } else if (d.status === 'warning') {
    led.classList.add('bg-amber-400', 'led-warning');
    statusText.textContent = 'Warning';
    statusText.className = 'font-mono text-[10px] text-amber-400';
  } else {
    led.classList.add('bg-red-400', 'led-offline');
    statusText.textContent = 'Offline';
    statusText.className = 'font-mono text-[10px] text-red-400';
  }

  // Signal color
  const sigEl = document.getElementById('stat-signal');
  if (d.status === 'offline') sigEl.className = 'font-mono text-sm font-bold text-red-400';
  else if (d.status === 'warning') sigEl.className = 'font-mono text-sm font-bold text-amber-400';
  else sigEl.className = 'font-mono text-sm font-bold text-green-400';

  // Reading color
  const readEl = document.getElementById('stat-reading');
  readEl.className = 'font-mono text-sm font-bold ' + (d.status === 'offline' ? 'text-red-400' : 'text-cyan-400');

  // Update sparkline
  updateSparkline(d.sparkline, d.status);
}

function updateSparkline(data, status) {
  const svg = document.getElementById('sparkline-chart');
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = 10 + i * 46;
    const y = 48 - ((v - min) / range) * 35;
    return { x, y, v };
  });

  const color = status === 'offline' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#06b6d4';
  const lineD = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
  const areaD = lineD + ' L' + points[points.length-1].x + ',58 L' + points[0].x + ',58Z';

  let html = '<defs><linearGradient id="spark-grad2" x1="0" y1="0" x2="0" y2="1">';
  html += '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.3"/>';
  html += '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/>';
  html += '</linearGradient></defs>';
  html += '<path d="' + lineD + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" class="sparkline-path"/>';
  html += '<path d="' + areaD + '" fill="url(#spark-grad2)" opacity="0.5"/>';
  points.forEach((p, i) => {
    const isLast = i === points.length - 1;
    html += '<circle cx="' + p.x + '" cy="' + p.y + '" r="2.5" fill="' + (isLast ? color : '#0c1222') + '" stroke="' + color + '" stroke-width="1.5"/>';
    html += '<text x="' + p.x + '" y="55" text-anchor="middle" fill="' + (isLast ? color : '#475569') + '" font-family="Space Mono, monospace" font-size="6">' + p.v + '</text>';
  });
  svg.innerHTML = html;
}

// Tab switching
function switchTab(tab) {
  document.querySelectorAll('.tab-item').forEach(t => { t.classList.remove('active'); t.classList.add('text-gray-500'); });
  event.currentTarget.classList.add('active');
  event.currentTarget.classList.remove('text-gray-500');

  document.getElementById('view-topology').classList.toggle('hidden', tab !== 'topology');
  document.getElementById('view-alerts').classList.toggle('hidden', tab !== 'alerts');
  document.getElementById('view-logs').classList.toggle('hidden', tab !== 'logs');

  // Show/hide right panel only for topology
  document.getElementById('right-panel').classList.toggle('hidden', tab !== 'topology');
}

// System clock
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('system-clock').textContent = h + ':' + m + ':' + s;
}

// Sync timer
let syncSeconds = 2;
function updateSync() {
  syncSeconds++;
  if (syncSeconds > 30) syncSeconds = 1;
  document.getElementById('sync-timer').textContent = syncSeconds + 's';
}

// Init
updateClock();
setInterval(updateClock, 1000);
setInterval(updateSync, 1000);
selectDevice(0);
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
