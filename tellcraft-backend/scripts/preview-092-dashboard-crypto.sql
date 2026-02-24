INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '5007174d-a8c2-43d0-b63a-7147ffa4ce57',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CryptoTrader</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        base: '#09090b',
        surface: '#18181b',
        border: '#27272a',
        up: '#22c55e',
        down: '#ef4444'
      }
    }
  }
}
</script>
<style>
body { font-family: 'Space Grotesk', sans-serif; background: #09090b; color: #e5e7eb; }
.mono { font-family: 'JetBrains Mono', monospace; }
.display { font-family: 'Space Grotesk', sans-serif; }

@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 8px rgba(34,197,94,0.4), inset 0 0 2px rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.5); }
  50% { box-shadow: 0 0 20px rgba(34,197,94,0.6), inset 0 0 4px rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.8); }
}
@keyframes pulse-red {
  0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.4), inset 0 0 2px rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.5); }
  50% { box-shadow: 0 0 20px rgba(239,68,68,0.6), inset 0 0 4px rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.8); }
}
.chart-pulse-up {
  border: 1px solid rgba(34,197,94,0.5);
  animation: pulse-green 2.5s ease-in-out infinite;
}
.chart-pulse-down {
  border: 1px solid rgba(239,68,68,0.5);
  animation: pulse-red 2.5s ease-in-out infinite;
}

.ob-row-buy { background: linear-gradient(to left, rgba(34,197,94,0.08), transparent); }
.ob-row-sell { background: linear-gradient(to left, rgba(239,68,68,0.08), transparent); }
.ob-fill-buy { background: rgba(34,197,94,0.12); }
.ob-fill-sell { background: rgba(239,68,68,0.12); }

.tf-btn { transition: background 0.15s, color 0.15s; }
.tf-btn.active { background: #27272a; color: #fff; }
.tf-btn:not(.active):hover { background: rgba(39,39,42,0.5); }

.trade-row { border-bottom: 1px solid rgba(39,39,42,0.5); }
.trade-row:last-child { border-bottom: none; }
</style>
</head>
<body class="min-h-screen flex flex-col overflow-hidden">

<!-- Top Bar -->
<header class="flex items-center justify-between px-4 h-12 bg-surface border-b border-border flex-shrink-0">
  <div class="flex items-center gap-5">
    <!-- Logo -->
    <div class="flex items-center gap-2">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="4" height="12" rx="1" fill="#22c55e"/><rect x="10" y="3" width="4" height="18" rx="1" fill="#22c55e" opacity="0.7"/><rect x="18" y="8" width="4" height="10" rx="1" fill="#ef4444"/></svg>
      <span class="display font-bold text-white text-sm tracking-tight">CryptoTrader</span>
    </div>
    <!-- Asset Selector -->
    <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-base border border-border hover:border-white/20 transition cursor-pointer" id="asset-selector">
      <span class="font-semibold text-white text-sm">BTC/USDT</span>
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#71717a" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>
    <!-- Price & Stats -->
    <div class="flex items-center gap-4">
      <span class="mono font-bold text-up text-lg" id="header-price">43,256.78</span>
      <div class="flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2l4 5H2l4-5z" fill="#22c55e"/></svg>
        <span class="mono text-up text-xs font-medium" id="header-change">+2.34%</span>
      </div>
      <div class="h-4 w-px bg-border"></div>
      <div class="text-xs text-zinc-500">
        <span class="mr-1">24h Vol</span>
        <span class="mono text-zinc-400">$1.2B</span>
      </div>
      <div class="h-4 w-px bg-border"></div>
      <div class="text-xs text-zinc-500">
        <span class="mr-1">High</span>
        <span class="mono text-zinc-400">43,890.00</span>
      </div>
      <div class="text-xs text-zinc-500 ml-2">
        <span class="mr-1">Low</span>
        <span class="mono text-zinc-400">42,105.50</span>
      </div>
    </div>
  </div>
  <!-- Timeframe Buttons -->
  <div class="flex items-center gap-1" id="tf-group">
    <button class="tf-btn mono text-xs px-2.5 py-1 rounded text-zinc-500 cursor-pointer" data-tf="1H">1H</button>
    <button class="tf-btn mono text-xs px-2.5 py-1 rounded text-zinc-500 cursor-pointer active" data-tf="4H">4H</button>
    <button class="tf-btn mono text-xs px-2.5 py-1 rounded text-zinc-500 cursor-pointer" data-tf="1D">1D</button>
    <button class="tf-btn mono text-xs px-2.5 py-1 rounded text-zinc-500 cursor-pointer" data-tf="1W">1W</button>
  </div>
</header>

<!-- Main Content: Chart + Order Book -->
<div class="flex flex-1 min-h-0">

  <!-- Chart Area -->
  <div class="flex-1 flex flex-col min-w-0 p-3 pb-0">
    <div class="chart-pulse-up rounded-lg flex-1 flex flex-col min-h-0 bg-surface" id="chart-container">
      <!-- Chart SVG -->
      <div class="flex-1 relative min-h-0 p-2">
        <svg viewBox="0 0 800 400" class="w-full h-full" preserveAspectRatio="none" id="chart-svg">
          <!-- Grid lines -->
          <line x1="0" y1="80" x2="760" y2="80" stroke="#27272a" stroke-width="0.5" stroke-dasharray="4,4"/>
          <line x1="0" y1="160" x2="760" y2="160" stroke="#27272a" stroke-width="0.5" stroke-dasharray="4,4"/>
          <line x1="0" y1="240" x2="760" y2="240" stroke="#27272a" stroke-width="0.5" stroke-dasharray="4,4"/>
          <line x1="0" y1="320" x2="760" y2="320" stroke="#27272a" stroke-width="0.5" stroke-dasharray="4,4"/>

          <!-- Candlesticks: x positions spaced every 36px, starting at 20 -->
          <!-- Candle 1: green (open=300, close=260, high=240, low=320) -->
          <line x1="20" y1="240" x2="20" y2="320" stroke="#22c55e" stroke-width="1.5"/>
          <rect x="12" y="260" width="16" height="40" rx="1" fill="#22c55e"/>

          <!-- Candle 2: red (open=270, close=290, high=250, low=310) -->
          <line x1="56" y1="250" x2="56" y2="310" stroke="#ef4444" stroke-width="1.5"/>
          <rect x="48" y="270" width="16" height="20" rx="1" fill="#ef4444"/>

          <!-- Candle 3: green (open=285, close=240, high=220, low=295) -->
          <line x1="92" y1="220" x2="92" y2="295" stroke="#22c55e" stroke-width="1.5"/>
          <rect x="84" y="240" width="16" height="45" rx="1" fill="#22c55e"/>

          <!-- Candle 4: green (open=250, close=210, high=195, low=260) -->
          <line x1="128" y1="195" x2="128" y2="260" stroke="#22c55e" stroke-width="1.5"/>
          <rect x="120" y="210" width="16" height="40" rx="1" fill="#22c55e"/>

          <!-- Candle 5: red (open=215, close=255, high=200, low=270) -->
          <line x1="164" y1="200" x2="164" y2="270" stroke="#ef4444" stroke-width="1.5"/>
          <rect x="156" y="215" width="16" height="40" rx="1" fill="#ef4444"/>

          <!-- Candle 6: red (open=240, close=275, high=230, low=285) -->
          <line x1="200" y1="230" x2="200" y2="285" stroke="#ef4444" stroke-width="1.5"/>
          <rect x="192" y="240" width="16" height="35" rx="1" fill="#ef4444"/>

          <!-- Candle 7: green (open=270, close=230, high=215, low=280) -->
          <line x1="236" y1="215" x2="236" y2="280" stroke="#22c55e" stroke-width="1.5"/>
          <rect x="228" y="230" width="16" height="40" rx="1" fill="#22c55e"/>

          <!-- Candle 8: green (open=235, close=200, high=185, low=245) -->
          <line x1="272" y1="185" x2="272" y2="245" stroke="#22c55e" stroke-width="1.5"/>
          <rect x="264" y="200" width="16" height="35" rx="1" fill="#22c55e"/>

          <!-- Candle 9: red (open=205, close=230, high=190, low=245) -->
          <line x1="308" y1="190" x2="308" y2="245" stroke="#ef4444" stroke-width="1.5"/>
          <rect x="300" y="205" width="16" height="25" rx="1" fill="#ef4444"/>

          <!-- Candle 10: green (open=225, close=195, high=180, low=235) -->
          <line x1="344" y1="180" x2="344" y2="235" stroke="#22c55e" stroke-width="1.5"/>
          <rect x="336" y="195" width="16" height="30" rx="1" fill="#22c55e"/>

          <!-- Candle 11: red (open=200, close=220, high=185, low=235) -->
          <line x1="380" y1="185" x2="380" y2="235" stroke="#ef4444" stroke-width="1.5"/>
          <rect x="372" y="200" width="16" height="20" rx="1" fill="#ef4444"/>

          <!-- Candle 12: green (open=215, close=175, high=160, low=225) -->
          <line x1="416" y1="160" x2="416" y2="225" stroke="#22c55e" stroke-width="1.5"/>
          <rect x="408" y="175" width="16" height="40" rx="1" fill="#22c55e"/>

          <!-- Candle 13: green (open=180, close=150, high=135, low=190) -->
          <line x1="452" y1="135" x2="452" y2="190" stroke="#22c55e" stroke-width="1.5"/>
          <rect x="444" y="150" width="16" height="30" rx="1" fill="#22c55e"/>

          <!-- Candle 14: red (open=155, close=180, high=140, low=195) -->
          <line x1="488" y1="140" x2="488" y2="195" stroke="#ef4444" stroke-width="1.5"/>
          <rect x="480" y="155" width="16" height="25" rx="1" fill="#ef4444"/>

          <!-- Candle 15: green (open=175, close=145, high=130, low=185) -->
          <line x1="524" y1="130" x2="524" y2="185" stroke="#22c55e" stroke-width="1.5"/>
          <rect x="516" y="145" width="16" height="30" rx="1" fill="#22c55e"/>

          <!-- Candle 16: red (open=150, close=170, high=138, low=180) -->
          <line x1="560" y1="138" x2="560" y2="180" stroke="#ef4444" stroke-width="1.5"/>
          <rect x="552" y="150" width="16" height="20" rx="1" fill="#ef4444"/>

          <!-- Candle 17: green (open=165, close=130, high=115, low=175) -->
          <line x1="596" y1="115" x2="596" y2="175" stroke="#22c55e" stroke-width="1.5"/>
          <rect x="588" y="130" width="16" height="35" rx="1" fill="#22c55e"/>

          <!-- Candle 18: green (open=135, close=110, high=95, low=145) -->
          <line x1="632" y1="95" x2="632" y2="145" stroke="#22c55e" stroke-width="1.5"/>
          <rect x="624" y="110" width="16" height="25" rx="1" fill="#22c55e"/>

          <!-- Candle 19: red (open=115, close=140, high=100, low=150) -->
          <line x1="668" y1="100" x2="668" y2="150" stroke="#ef4444" stroke-width="1.5"/>
          <rect x="660" y="115" width="16" height="25" rx="1" fill="#ef4444"/>

          <!-- Candle 20: green (open=135, close=105, high=88, low=145) -->
          <line x1="704" y1="88" x2="704" y2="145" stroke="#22c55e" stroke-width="1.5"/>
          <rect x="696" y="105" width="16" height="30" rx="1" fill="#22c55e"/>

          <!-- Current price dashed line -->
          <line x1="0" y1="105" x2="760" y2="105" stroke="#22c55e" stroke-width="1" stroke-dasharray="6,4" opacity="0.6"/>

          <!-- Price label on the right -->
          <rect x="762" y="97" width="38" height="16" rx="3" fill="#22c55e"/>
          <text x="781" y="109" fill="#000" font-size="9" font-family="JetBrains Mono" text-anchor="middle" font-weight="600">43,256</text>

          <!-- Price axis labels (right side) -->
          <text x="780" y="84" fill="#52525b" font-size="9" font-family="JetBrains Mono" text-anchor="end">43,890</text>
          <text x="780" y="164" fill="#52525b" font-size="9" font-family="JetBrains Mono" text-anchor="end">43,400</text>
          <text x="780" y="244" fill="#52525b" font-size="9" font-family="JetBrains Mono" text-anchor="end">42,900</text>
          <text x="780" y="324" fill="#52525b" font-size="9" font-family="JetBrains Mono" text-anchor="end">42,400</text>

          <!-- Volume bars at bottom (subtle) -->
          <rect x="12" y="370" width="16" height="20" rx="1" fill="#22c55e" opacity="0.2"/>
          <rect x="48" y="375" width="16" height="15" rx="1" fill="#ef4444" opacity="0.2"/>
          <rect x="84" y="360" width="16" height="30" rx="1" fill="#22c55e" opacity="0.2"/>
          <rect x="120" y="365" width="16" height="25" rx="1" fill="#22c55e" opacity="0.2"/>
          <rect x="156" y="372" width="16" height="18" rx="1" fill="#ef4444" opacity="0.2"/>
          <rect x="192" y="378" width="16" height="12" rx="1" fill="#ef4444" opacity="0.2"/>
          <rect x="228" y="362" width="16" height="28" rx="1" fill="#22c55e" opacity="0.2"/>
          <rect x="264" y="355" width="16" height="35" rx="1" fill="#22c55e" opacity="0.2"/>
          <rect x="300" y="375" width="16" height="15" rx="1" fill="#ef4444" opacity="0.2"/>
          <rect x="336" y="368" width="16" height="22" rx="1" fill="#22c55e" opacity="0.2"/>
          <rect x="372" y="378" width="16" height="12" rx="1" fill="#ef4444" opacity="0.2"/>
          <rect x="408" y="352" width="16" height="38" rx="1" fill="#22c55e" opacity="0.2"/>
          <rect x="444" y="358" width="16" height="32" rx="1" fill="#22c55e" opacity="0.2"/>
          <rect x="480" y="374" width="16" height="16" rx="1" fill="#ef4444" opacity="0.2"/>
          <rect x="516" y="360" width="16" height="30" rx="1" fill="#22c55e" opacity="0.2"/>
          <rect x="552" y="376" width="16" height="14" rx="1" fill="#ef4444" opacity="0.2"/>
          <rect x="588" y="350" width="16" height="40" rx="1" fill="#22c55e" opacity="0.2"/>
          <rect x="624" y="355" width="16" height="35" rx="1" fill="#22c55e" opacity="0.2"/>
          <rect x="660" y="370" width="16" height="20" rx="1" fill="#ef4444" opacity="0.2"/>
          <rect x="696" y="348" width="16" height="42" rx="1" fill="#22c55e" opacity="0.2"/>

          <!-- Time axis labels -->
          <text x="20" y="398" fill="#3f3f46" font-size="8" font-family="JetBrains Mono" text-anchor="middle">00:00</text>
          <text x="200" y="398" fill="#3f3f46" font-size="8" font-family="JetBrains Mono" text-anchor="middle">04:00</text>
          <text x="380" y="398" fill="#3f3f46" font-size="8" font-family="JetBrains Mono" text-anchor="middle">08:00</text>
          <text x="560" y="398" fill="#3f3f46" font-size="8" font-family="JetBrains Mono" text-anchor="middle">12:00</text>
          <text x="704" y="398" fill="#3f3f46" font-size="8" font-family="JetBrains Mono" text-anchor="middle">16:00</text>
        </svg>
      </div>
    </div>

    <!-- Bottom Section: Portfolio + Recent Trades -->
    <div class="flex gap-3 py-3 flex-shrink-0" style="height: 140px;">
      <!-- Portfolio -->
      <div class="flex-1 bg-surface rounded-lg border border-border p-3">
        <div class="text-xs text-zinc-500 font-medium mb-2 display">Portfolio</div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <div class="text-xs text-zinc-500">BTC</div>
            <div class="mono text-sm text-white font-medium">0.5432</div>
            <div class="mono text-xs text-zinc-400">$23,490.12</div>
          </div>
          <div>
            <div class="text-xs text-zinc-500">ETH</div>
            <div class="mono text-sm text-white font-medium">4.2100</div>
            <div class="mono text-xs text-zinc-400">$9,842.35</div>
          </div>
          <div>
            <div class="text-xs text-zinc-500">Total Value</div>
            <div class="mono text-sm text-up font-bold">$33,332.47</div>
            <div class="mono text-xs text-up">+3.82%</div>
          </div>
        </div>
      </div>
      <!-- Recent Trades -->
      <div class="bg-surface rounded-lg border border-border p-3" style="width: 380px;">
        <div class="text-xs text-zinc-500 font-medium mb-2 display">Recent Trades</div>
        <div class="space-y-0">
          <div class="trade-row flex items-center justify-between py-1">
            <span class="mono text-[10px] text-zinc-600">16:42:08</span>
            <span class="mono text-xs text-up">43,256.78</span>
            <span class="mono text-xs text-zinc-400">0.0234</span>
            <span class="text-[10px] font-medium text-up px-1.5 py-0.5 rounded bg-up/10">BUY</span>
          </div>
          <div class="trade-row flex items-center justify-between py-1">
            <span class="mono text-[10px] text-zinc-600">16:41:55</span>
            <span class="mono text-xs text-down">43,248.50</span>
            <span class="mono text-xs text-zinc-400">0.1500</span>
            <span class="text-[10px] font-medium text-down px-1.5 py-0.5 rounded bg-down/10">SELL</span>
          </div>
          <div class="trade-row flex items-center justify-between py-1">
            <span class="mono text-[10px] text-zinc-600">16:41:32</span>
            <span class="mono text-xs text-up">43,251.20</span>
            <span class="mono text-xs text-zinc-400">0.0890</span>
            <span class="text-[10px] font-medium text-up px-1.5 py-0.5 rounded bg-up/10">BUY</span>
          </div>
          <div class="trade-row flex items-center justify-between py-1">
            <span class="mono text-[10px] text-zinc-600">16:41:18</span>
            <span class="mono text-xs text-up">43,250.00</span>
            <span class="mono text-xs text-zinc-400">0.0412</span>
            <span class="text-[10px] font-medium text-up px-1.5 py-0.5 rounded bg-up/10">BUY</span>
          </div>
          <div class="trade-row flex items-center justify-between py-1">
            <span class="mono text-[10px] text-zinc-600">16:40:59</span>
            <span class="mono text-xs text-down">43,245.30</span>
            <span class="mono text-xs text-zinc-400">0.2100</span>
            <span class="text-[10px] font-medium text-down px-1.5 py-0.5 rounded bg-down/10">SELL</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Order Book Panel -->
  <div class="flex-shrink-0 bg-surface border-l border-border flex flex-col" style="width: 280px;">
    <div class="px-3 py-2 border-b border-border">
      <span class="text-xs font-medium text-zinc-400 display">Order Book</span>
    </div>
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-1.5 text-[10px] text-zinc-600 mono border-b border-border/50">
      <span>Price (USDT)</span>
      <span>Amount (BTC)</span>
      <span>Total</span>
    </div>
    <!-- Sell orders (red, ascending - highest at top) -->
    <div class="flex-1 flex flex-col justify-end overflow-hidden px-1">
      <div class="relative flex items-center justify-between px-2 py-[3px] rounded-sm">
        <div class="absolute inset-0 ob-fill-sell rounded-sm" style="width: 92%;"></div>
        <span class="mono text-[11px] text-down relative z-10">43,312.40</span>
        <span class="mono text-[11px] text-zinc-400 relative z-10">1.2450</span>
        <span class="mono text-[11px] text-zinc-500 relative z-10">53,924</span>
      </div>
      <div class="relative flex items-center justify-between px-2 py-[3px] rounded-sm">
        <div class="absolute inset-0 ob-fill-sell rounded-sm" style="width: 78%;"></div>
        <span class="mono text-[11px] text-down relative z-10">43,298.80</span>
        <span class="mono text-[11px] text-zinc-400 relative z-10">0.8920</span>
        <span class="mono text-[11px] text-zinc-500 relative z-10">38,621</span>
      </div>
      <div class="relative flex items-center justify-between px-2 py-[3px] rounded-sm">
        <div class="absolute inset-0 ob-fill-sell rounded-sm" style="width: 65%;"></div>
        <span class="mono text-[11px] text-down relative z-10">43,285.50</span>
        <span class="mono text-[11px] text-zinc-400 relative z-10">0.6340</span>
        <span class="mono text-[11px] text-zinc-500 relative z-10">27,409</span>
      </div>
      <div class="relative flex items-center justify-between px-2 py-[3px] rounded-sm">
        <div class="absolute inset-0 ob-fill-sell rounded-sm" style="width: 45%;"></div>
        <span class="mono text-[11px] text-down relative z-10">43,274.20</span>
        <span class="mono text-[11px] text-zinc-400 relative z-10">0.4210</span>
        <span class="mono text-[11px] text-zinc-500 relative z-10">18,217</span>
      </div>
      <div class="relative flex items-center justify-between px-2 py-[3px] rounded-sm">
        <div class="absolute inset-0 ob-fill-sell rounded-sm" style="width: 35%;"></div>
        <span class="mono text-[11px] text-down relative z-10">43,268.10</span>
        <span class="mono text-[11px] text-zinc-400 relative z-10">0.3150</span>
        <span class="mono text-[11px] text-zinc-500 relative z-10">13,629</span>
      </div>
      <div class="relative flex items-center justify-between px-2 py-[3px] rounded-sm">
        <div class="absolute inset-0 ob-fill-sell rounded-sm" style="width: 22%;"></div>
        <span class="mono text-[11px] text-down relative z-10">43,260.30</span>
        <span class="mono text-[11px] text-zinc-400 relative z-10">0.1880</span>
        <span class="mono text-[11px] text-zinc-500 relative z-10">8,132</span>
      </div>
      <div class="relative flex items-center justify-between px-2 py-[3px] rounded-sm">
        <div class="absolute inset-0 ob-fill-sell rounded-sm" style="width: 12%;"></div>
        <span class="mono text-[11px] text-down relative z-10">43,257.90</span>
        <span class="mono text-[11px] text-zinc-400 relative z-10">0.0750</span>
        <span class="mono text-[11px] text-zinc-500 relative z-10">3,244</span>
      </div>
    </div>

    <!-- Spread -->
    <div class="flex items-center justify-center py-2 border-y border-border/50 bg-base/50">
      <span class="mono text-sm font-bold text-up" id="spread-price">43,256.78</span>
      <span class="mono text-[10px] text-zinc-600 ml-2">Spread: 1.12</span>
    </div>

    <!-- Buy orders (green, descending) -->
    <div class="flex-1 flex flex-col overflow-hidden px-1">
      <div class="relative flex items-center justify-between px-2 py-[3px] rounded-sm">
        <div class="absolute inset-0 ob-fill-buy rounded-sm" style="width: 15%;"></div>
        <span class="mono text-[11px] text-up relative z-10">43,255.60</span>
        <span class="mono text-[11px] text-zinc-400 relative z-10">0.0920</span>
        <span class="mono text-[11px] text-zinc-500 relative z-10">3,979</span>
      </div>
      <div class="relative flex items-center justify-between px-2 py-[3px] rounded-sm">
        <div class="absolute inset-0 ob-fill-buy rounded-sm" style="width: 28%;"></div>
        <span class="mono text-[11px] text-up relative z-10">43,249.40</span>
        <span class="mono text-[11px] text-zinc-400 relative z-10">0.2340</span>
        <span class="mono text-[11px] text-zinc-500 relative z-10">10,120</span>
      </div>
      <div class="relative flex items-center justify-between px-2 py-[3px] rounded-sm">
        <div class="absolute inset-0 ob-fill-buy rounded-sm" style="width: 42%;"></div>
        <span class="mono text-[11px] text-up relative z-10">43,240.80</span>
        <span class="mono text-[11px] text-zinc-400 relative z-10">0.3870</span>
        <span class="mono text-[11px] text-zinc-500 relative z-10">16,733</span>
      </div>
      <div class="relative flex items-center justify-between px-2 py-[3px] rounded-sm">
        <div class="absolute inset-0 ob-fill-buy rounded-sm" style="width: 58%;"></div>
        <span class="mono text-[11px] text-up relative z-10">43,232.50</span>
        <span class="mono text-[11px] text-zinc-400 relative z-10">0.5610</span>
        <span class="mono text-[11px] text-zinc-500 relative z-10">24,253</span>
      </div>
      <div class="relative flex items-center justify-between px-2 py-[3px] rounded-sm">
        <div class="absolute inset-0 ob-fill-buy rounded-sm" style="width: 72%;"></div>
        <span class="mono text-[11px] text-up relative z-10">43,221.30</span>
        <span class="mono text-[11px] text-zinc-400 relative z-10">0.7480</span>
        <span class="mono text-[11px] text-zinc-500 relative z-10">32,329</span>
      </div>
      <div class="relative flex items-center justify-between px-2 py-[3px] rounded-sm">
        <div class="absolute inset-0 ob-fill-buy rounded-sm" style="width: 85%;"></div>
        <span class="mono text-[11px] text-up relative z-10">43,210.70</span>
        <span class="mono text-[11px] text-zinc-400 relative z-10">0.9230</span>
        <span class="mono text-[11px] text-zinc-500 relative z-10">39,882</span>
      </div>
      <div class="relative flex items-center justify-between px-2 py-[3px] rounded-sm">
        <div class="absolute inset-0 ob-fill-buy rounded-sm" style="width: 95%;"></div>
        <span class="mono text-[11px] text-up relative z-10">43,198.20</span>
        <span class="mono text-[11px] text-zinc-400 relative z-10">1.1560</span>
        <span class="mono text-[11px] text-zinc-500 relative z-10">49,936</span>
      </div>
    </div>
  </div>
</div>

<script>
// Timeframe toggle
document.getElementById('tf-group').addEventListener('click', function(e) {
  var btn = e.target.closest('.tf-btn');
  if (!btn) return;
  this.querySelectorAll('.tf-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
});

// Format number with commas
function fmtNum(n, decimals) {
  return n.toFixed(decimals || 2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
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
