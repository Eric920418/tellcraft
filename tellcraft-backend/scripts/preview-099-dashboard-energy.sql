INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '54a2e35b-b363-475e-89dd-06ed25c24618',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>能源眼 EnergyEye</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { energy: { 50:'#ecfdf5',100:'#d1fae5',400:'#34d399',500:'#10b981',600:'#059669' } } } } } }
</script>
<style>
body { font-family: 'Inter', sans-serif; background: #0f1419; color: #e5e7eb; }
.mono { font-family: 'JetBrains Mono', monospace; }
</style>
</head>
<body class="min-h-screen flex">
<aside class="w-56 bg-[#131920] border-r border-white/5 flex flex-col min-h-screen">
  <div class="p-4 border-b border-white/5">
    <div class="flex items-center gap-2"><div class="w-8 h-8 rounded-lg bg-energy-500 flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div><span class="font-bold text-white text-sm">EnergyEye</span></div>
  </div>
  <nav class="flex-1 p-3 space-y-1 text-sm" id="sidebar-nav">
    <a onclick="switchPage('overview')" class="nav-item active flex items-center gap-2 px-3 py-2 rounded-lg bg-energy-500/10 text-energy-400 font-medium cursor-pointer">⚡ 總覽</a>
    <a onclick="switchPage('solar')" class="nav-item flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-white/5 cursor-pointer">☀️ 太陽能</a>
    <a onclick="switchPage('consumption')" class="nav-item flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-white/5 cursor-pointer">📊 用電分析</a>
    <a onclick="switchPage('battery')" class="nav-item flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-white/5 cursor-pointer">🔋 儲能電池</a>
  </nav>
</aside>

<main class="flex-1 overflow-auto">
  <!-- Overview -->
  <div id="page-overview" class="page-content p-6">
    <div class="flex items-center justify-between mb-6"><h1 class="text-xl font-bold">能源總覽</h1><span class="text-xs text-gray-500">即時更新 · 2026/02/16 14:30</span></div>
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-[#131920] rounded-xl p-4 border border-white/5"><div class="text-xs text-gray-500">太陽能發電</div><div class="text-2xl font-bold text-energy-400 mt-1 mono">4.8 <span class="text-sm">kW</span></div><div class="text-xs text-energy-400 mt-1">☀️ 發電中</div></div>
      <div class="bg-[#131920] rounded-xl p-4 border border-white/5"><div class="text-xs text-gray-500">目前用電</div><div class="text-2xl font-bold text-amber-400 mt-1 mono">2.3 <span class="text-sm">kW</span></div><div class="text-xs text-gray-400 mt-1">低於平均</div></div>
      <div class="bg-[#131920] rounded-xl p-4 border border-white/5"><div class="text-xs text-gray-500">電池電量</div><div class="text-2xl font-bold text-blue-400 mt-1 mono">78%</div><div class="text-xs text-blue-400 mt-1">🔋 充電中</div></div>
      <div class="bg-[#131920] rounded-xl p-4 border border-white/5"><div class="text-xs text-gray-500">今日節省</div><div class="text-2xl font-bold text-white mt-1 mono">$142</div><div class="text-xs text-energy-400 mt-1">↑ 相比市電</div></div>
    </div>
    <div class="grid grid-cols-2 gap-6 mb-6">
      <div class="bg-[#131920] rounded-xl p-5 border border-white/5">
        <h3 class="text-sm font-medium mb-4">今日發電 vs 用電</h3>
        <svg viewBox="0 0 400 120" class="w-full h-24">
          <path d="M0,100 L33,85 L66,70 L99,50 L132,35 L165,25 L198,20 L231,22 L264,30 L297,45 L330,65 L363,80 L400,95" fill="none" stroke="#10b981" stroke-width="2"/>
          <path d="M0,90 L33,88 L66,85 L99,80 L132,75 L165,72 L198,70 L231,68 L264,72 L297,78 L330,85 L363,88 L400,92" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4,4"/>
          <text x="20" y="15" fill="#10b981" font-size="10">— 發電</text>
          <text x="100" y="15" fill="#f59e0b" font-size="10">--- 用電</text>
        </svg>
      </div>
      <div class="bg-[#131920] rounded-xl p-5 border border-white/5">
        <h3 class="text-sm font-medium mb-4">能源流向</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between"><span class="text-xs text-gray-400">太陽能 → 家庭用電</span><div class="flex-1 mx-3 h-2 bg-white/5 rounded-full"><div class="h-2 bg-energy-500 rounded-full" style="width:48%"></div></div><span class="mono text-xs">2.3 kW</span></div>
          <div class="flex items-center justify-between"><span class="text-xs text-gray-400">太陽能 → 電池</span><div class="flex-1 mx-3 h-2 bg-white/5 rounded-full"><div class="h-2 bg-blue-500 rounded-full" style="width:35%"></div></div><span class="mono text-xs">1.7 kW</span></div>
          <div class="flex items-center justify-between"><span class="text-xs text-gray-400">太陽能 → 售電</span><div class="flex-1 mx-3 h-2 bg-white/5 rounded-full"><div class="h-2 bg-amber-500 rounded-full" style="width:17%"></div></div><span class="mono text-xs">0.8 kW</span></div>
        </div>
      </div>
    </div>
    <div class="bg-[#131920] rounded-xl p-5 border border-white/5">
      <h3 class="text-sm font-medium mb-3">本月摘要</h3>
      <div class="grid grid-cols-4 gap-4 text-center">
        <div><div class="mono text-lg font-bold text-energy-400">342 kWh</div><div class="text-xs text-gray-500">總發電量</div></div>
        <div><div class="mono text-lg font-bold text-amber-400">198 kWh</div><div class="text-xs text-gray-500">總用電量</div></div>
        <div><div class="mono text-lg font-bold text-blue-400">89 kWh</div><div class="text-xs text-gray-500">儲能</div></div>
        <div><div class="mono text-lg font-bold text-white">$4,230</div><div class="text-xs text-gray-500">節省金額</div></div>
      </div>
    </div>
  </div>

  <!-- Solar -->
  <div id="page-solar" class="page-content hidden p-6">
    <h1 class="text-xl font-bold mb-6">太陽能面板</h1>
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-[#131920] rounded-xl p-4 border border-white/5"><div class="text-xs text-gray-500">面板數量</div><div class="text-2xl font-bold mt-1 mono">24 片</div></div>
      <div class="bg-[#131920] rounded-xl p-4 border border-white/5"><div class="text-xs text-gray-500">裝置容量</div><div class="text-2xl font-bold mt-1 mono">9.6 kWp</div></div>
      <div class="bg-[#131920] rounded-xl p-4 border border-white/5"><div class="text-xs text-gray-500">轉換效率</div><div class="text-2xl font-bold text-energy-400 mt-1 mono">21.8%</div></div>
    </div>
    <div class="bg-[#131920] rounded-xl p-5 border border-white/5">
      <h3 class="text-sm font-medium mb-4">面板狀態</h3>
      <div class="grid grid-cols-6 gap-2">
        <div class="aspect-square rounded bg-energy-500/20 border border-energy-500/30 flex items-center justify-center text-[10px] mono text-energy-400">A1<br>OK</div>
        <div class="aspect-square rounded bg-energy-500/20 border border-energy-500/30 flex items-center justify-center text-[10px] mono text-energy-400">A2<br>OK</div>
        <div class="aspect-square rounded bg-energy-500/20 border border-energy-500/30 flex items-center justify-center text-[10px] mono text-energy-400">A3<br>OK</div>
        <div class="aspect-square rounded bg-energy-500/20 border border-energy-500/30 flex items-center justify-center text-[10px] mono text-energy-400">A4<br>OK</div>
        <div class="aspect-square rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] mono text-amber-400">A5<br>⚠️</div>
        <div class="aspect-square rounded bg-energy-500/20 border border-energy-500/30 flex items-center justify-center text-[10px] mono text-energy-400">A6<br>OK</div>
        <div class="aspect-square rounded bg-energy-500/20 border border-energy-500/30 flex items-center justify-center text-[10px] mono text-energy-400">B1<br>OK</div>
        <div class="aspect-square rounded bg-energy-500/20 border border-energy-500/30 flex items-center justify-center text-[10px] mono text-energy-400">B2<br>OK</div>
        <div class="aspect-square rounded bg-energy-500/20 border border-energy-500/30 flex items-center justify-center text-[10px] mono text-energy-400">B3<br>OK</div>
        <div class="aspect-square rounded bg-energy-500/20 border border-energy-500/30 flex items-center justify-center text-[10px] mono text-energy-400">B4<br>OK</div>
        <div class="aspect-square rounded bg-energy-500/20 border border-energy-500/30 flex items-center justify-center text-[10px] mono text-energy-400">B5<br>OK</div>
        <div class="aspect-square rounded bg-energy-500/20 border border-energy-500/30 flex items-center justify-center text-[10px] mono text-energy-400">B6<br>OK</div>
      </div>
      <p class="text-xs text-amber-400 mt-3">⚠️ A5 面板效率降低 12%，建議清潔或檢查</p>
    </div>
  </div>

  <!-- Consumption -->
  <div id="page-consumption" class="page-content hidden p-6">
    <h1 class="text-xl font-bold mb-6">用電分析</h1>
    <div class="bg-[#131920] rounded-xl p-5 border border-white/5 mb-6">
      <h3 class="text-sm font-medium mb-4">各區域用電占比</h3>
      <div class="space-y-3">
        <div><div class="flex justify-between text-xs mb-1"><span class="text-gray-400">空調系統</span><span class="mono">42%</span></div><div class="h-3 bg-white/5 rounded-full"><div class="h-3 bg-red-400 rounded-full" style="width:42%"></div></div></div>
        <div><div class="flex justify-between text-xs mb-1"><span class="text-gray-400">照明</span><span class="mono">18%</span></div><div class="h-3 bg-white/5 rounded-full"><div class="h-3 bg-amber-400 rounded-full" style="width:18%"></div></div></div>
        <div><div class="flex justify-between text-xs mb-1"><span class="text-gray-400">廚房設備</span><span class="mono">15%</span></div><div class="h-3 bg-white/5 rounded-full"><div class="h-3 bg-blue-400 rounded-full" style="width:15%"></div></div></div>
        <div><div class="flex justify-between text-xs mb-1"><span class="text-gray-400">電子設備</span><span class="mono">14%</span></div><div class="h-3 bg-white/5 rounded-full"><div class="h-3 bg-purple-400 rounded-full" style="width:14%"></div></div></div>
        <div><div class="flex justify-between text-xs mb-1"><span class="text-gray-400">其他</span><span class="mono">11%</span></div><div class="h-3 bg-white/5 rounded-full"><div class="h-3 bg-gray-400 rounded-full" style="width:11%"></div></div></div>
      </div>
    </div>
    <div class="bg-[#131920] rounded-xl p-5 border border-white/5">
      <h3 class="text-sm font-medium mb-3">節能建議</h3>
      <div class="space-y-2">
        <div class="flex items-start gap-2 text-sm"><span class="text-energy-400">💡</span><span class="text-gray-400">空調設定溫度提高 1°C 可節省約 6% 用電</span></div>
        <div class="flex items-start gap-2 text-sm"><span class="text-energy-400">💡</span><span class="text-gray-400">建議在 10:00-14:00 太陽能高峰期運行洗衣機</span></div>
        <div class="flex items-start gap-2 text-sm"><span class="text-energy-400">💡</span><span class="text-gray-400">深夜模式可將電池售電比例提高到 30%</span></div>
      </div>
    </div>
  </div>

  <!-- Battery -->
  <div id="page-battery" class="page-content hidden p-6">
    <h1 class="text-xl font-bold mb-6">儲能電池</h1>
    <div class="grid grid-cols-2 gap-6">
      <div class="bg-[#131920] rounded-xl p-5 border border-white/5">
        <h3 class="text-sm font-medium mb-4">電池狀態</h3>
        <div class="flex items-center justify-center my-6"><div class="relative w-32 h-32"><svg class="w-32 h-32 -rotate-90" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="3"/><circle cx="18" cy="18" r="16" fill="none" stroke="#10b981" stroke-width="3" stroke-dasharray="78.4, 100" stroke-linecap="round"/></svg><div class="absolute inset-0 flex items-center justify-center"><div class="text-center"><div class="mono text-2xl font-bold text-energy-400">78%</div><div class="text-[10px] text-gray-500">充電中</div></div></div></div></div>
        <div class="grid grid-cols-2 gap-3 text-center text-sm">
          <div><div class="text-gray-500 text-xs">容量</div><div class="mono font-medium">13.5 kWh</div></div>
          <div><div class="text-gray-500 text-xs">健康度</div><div class="mono font-medium text-energy-400">96%</div></div>
          <div><div class="text-gray-500 text-xs">充電功率</div><div class="mono font-medium">1.7 kW</div></div>
          <div><div class="text-gray-500 text-xs">預計充滿</div><div class="mono font-medium">17:30</div></div>
        </div>
      </div>
      <div class="bg-[#131920] rounded-xl p-5 border border-white/5">
        <h3 class="text-sm font-medium mb-4">充放電記錄</h3>
        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between py-2 border-b border-white/5"><div><span class="text-energy-400 text-xs font-bold mr-2">充電</span><span class="text-gray-400">太陽能</span></div><div class="text-right"><div class="mono text-xs">+4.2 kWh</div><div class="text-[10px] text-gray-500">08:00 - 12:00</div></div></div>
          <div class="flex items-center justify-between py-2 border-b border-white/5"><div><span class="text-amber-400 text-xs font-bold mr-2">放電</span><span class="text-gray-400">家庭用電</span></div><div class="text-right"><div class="mono text-xs">-1.8 kWh</div><div class="text-[10px] text-gray-500">18:00 - 22:00 (昨)</div></div></div>
          <div class="flex items-center justify-between py-2"><div><span class="text-blue-400 text-xs font-bold mr-2">售電</span><span class="text-gray-400">回售電網</span></div><div class="text-right"><div class="mono text-xs">-2.1 kWh</div><div class="text-[10px] text-gray-500">12:00 - 14:00 (昨)</div></div></div>
        </div>
      </div>
    </div>
  </div>
</main>

<script>
function switchPage(page) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + page).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n => { n.className = n.className.replace(/bg-energy-500\/10 text-energy-400 font-medium/g, 'text-gray-500 hover:bg-white/5'); n.classList.remove('active'); });
  event.currentTarget.className = event.currentTarget.className.replace(/text-gray-500 hover:bg-white\/5/g, 'bg-energy-500/10 text-energy-400 font-medium'); event.currentTarget.classList.add('active');
}
</script>
</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
