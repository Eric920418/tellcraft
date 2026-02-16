INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '3e0aef14-4916-4e49-bff2-7478ed4a6b56',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>萬物聯控 IoTDash</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { fontFamily: { mono: ['JetBrains Mono','monospace'], dm: ['DM Sans','sans-serif'] }, colors: { iot: { 50:'#ecfdf5',100:'#d1fae5',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857' }, sensor: { 400:'#60a5fa',500:'#3b82f6' } } } } }
</script>
<style>
* { font-family: 'DM Sans', sans-serif; }
body { background: #0f172a; color: #e2e8f0; }
.mono { font-family: 'JetBrains Mono', monospace; }
.sidebar-item { transition: all 0.2s; }
.sidebar-item:hover, .sidebar-item.active { background: rgba(16,185,129,0.1); color: #34d399; }
.device-card { transition: all 0.2s; cursor: pointer; }
.device-card:hover { border-color: rgba(16,185,129,0.3); }
.pulse-dot { animation: pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
</style>
</head>
<body class="min-h-screen flex">
<aside class="w-56 bg-slate-900 border-r border-slate-800 flex flex-col min-h-screen">
  <div class="p-4 border-b border-slate-800"><div class="flex items-center gap-2"><div class="w-8 h-8 rounded-lg bg-iot-500 flex items-center justify-center text-xs font-bold text-white mono">IoT</div><span class="font-bold text-sm">IoTDash</span></div></div>
  <nav class="flex-1 p-2 space-y-0.5">
    <div class="sidebar-item active flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer" onclick="switchPage('dashboard')">📊 控制面板</div>
    <div class="sidebar-item flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('devices')">📱 設備管理</div>
    <div class="sidebar-item flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('alerts')">🔔 告警通知 <span class="ml-auto text-[10px] bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center">2</span></div>
    <div class="sidebar-item flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('rules')">⚡ 自動化</div>
  </nav>
</aside>

<main class="flex-1 overflow-auto">
  <div id="page-dashboard" class="page p-6 space-y-5">
    <div class="flex items-center justify-between"><h1 class="text-lg font-bold">智慧家居控制面板</h1><div class="flex items-center gap-2 text-xs text-gray-400"><span class="pulse-dot w-2 h-2 rounded-full bg-iot-400 inline-block"></span>所有系統正常運作</div></div>

    <div class="grid grid-cols-4 gap-4">
      <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"><div class="flex items-center justify-between mb-2"><span class="text-xs text-gray-400">客廳溫度</span><span class="text-lg">🌡️</span></div><div class="mono text-2xl font-semibold text-iot-400">24.5°<span class="text-sm text-gray-500">C</span></div><div class="text-xs text-gray-500 mt-1">濕度 58%</div></div>
      <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"><div class="flex items-center justify-between mb-2"><span class="text-xs text-gray-400">用電量</span><span class="text-lg">⚡</span></div><div class="mono text-2xl font-semibold text-sensor-400">3.2<span class="text-sm text-gray-500">kWh</span></div><div class="text-xs text-green-400 mt-1">↓ 12% vs 昨天</div></div>
      <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"><div class="flex items-center justify-between mb-2"><span class="text-xs text-gray-400">連線設備</span><span class="text-lg">📡</span></div><div class="mono text-2xl font-semibold text-white">18<span class="text-sm text-gray-500">/20</span></div><div class="text-xs text-amber-400 mt-1">2 台離線</div></div>
      <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"><div class="flex items-center justify-between mb-2"><span class="text-xs text-gray-400">空氣品質</span><span class="text-lg">🌿</span></div><div class="mono text-2xl font-semibold text-iot-400">AQI 42</div><div class="text-xs text-iot-400 mt-1">良好</div></div>
    </div>

    <!-- Temperature Chart -->
    <div class="grid grid-cols-3 gap-4">
      <div class="col-span-2 bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
        <h3 class="text-sm font-semibold mb-3">溫濕度趨勢（24hr）</h3>
        <svg viewBox="0 0 500 120" class="w-full">
          <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10b981" stop-opacity="0.2"/><stop offset="100%" stop-color="#10b981" stop-opacity="0"/></linearGradient></defs>
          <path d="M20,80 L60,75 L100,78 L140,72 L180,65 L220,60 L260,55 L300,52 L340,48 L380,45 L420,42 L460,40" fill="none" stroke="#10b981" stroke-width="2"/>
          <path d="M20,80 L60,75 L100,78 L140,72 L180,65 L220,60 L260,55 L300,52 L340,48 L380,45 L420,42 L460,40 L460,120 L20,120Z" fill="url(#tg)"/>
          <path d="M20,60 L60,65 L100,58 L140,62 L180,55 L220,58 L260,52 L300,55 L340,58 L380,52 L420,55 L460,50" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4,4"/>
          <text x="20" y="110" fill="#64748b" font-size="9">0:00</text><text x="140" y="110" fill="#64748b" font-size="9">6:00</text><text x="260" y="110" fill="#64748b" font-size="9">12:00</text><text x="380" y="110" fill="#64748b" font-size="9">18:00</text><text x="460" y="110" fill="#64748b" font-size="9">Now</text>
        </svg>
        <div class="flex gap-4 mt-2 text-[10px] text-gray-500"><span class="flex items-center gap-1"><span class="w-2 h-0.5 bg-iot-400 inline-block"></span>溫度</span><span class="flex items-center gap-1"><span class="w-2 h-0.5 bg-sensor-400 inline-block border-dashed"></span>濕度</span></div>
      </div>
      <!-- Quick Controls -->
      <div class="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
        <h3 class="text-sm font-semibold mb-3">快速控制</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between"><div class="flex items-center gap-2"><span>💡</span><span class="text-sm">客廳燈</span></div><div class="w-10 h-5 bg-iot-500 rounded-full relative cursor-pointer"><div class="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow"></div></div></div>
          <div class="flex items-center justify-between"><div class="flex items-center gap-2"><span>❄️</span><span class="text-sm">空調</span></div><div class="w-10 h-5 bg-iot-500 rounded-full relative cursor-pointer"><div class="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow"></div></div></div>
          <div class="flex items-center justify-between"><div class="flex items-center gap-2"><span>🔒</span><span class="text-sm">門鎖</span></div><div class="w-10 h-5 bg-gray-600 rounded-full relative cursor-pointer"><div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow"></div></div></div>
          <div class="flex items-center justify-between"><div class="flex items-center gap-2"><span>📹</span><span class="text-sm">監視器</span></div><div class="w-10 h-5 bg-iot-500 rounded-full relative cursor-pointer"><div class="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow"></div></div></div>
          <div class="flex items-center justify-between"><div class="flex items-center gap-2"><span>🎵</span><span class="text-sm">音響</span></div><div class="w-10 h-5 bg-gray-600 rounded-full relative cursor-pointer"><div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow"></div></div></div>
        </div>
      </div>
    </div>
  </div>

  <div id="page-devices" class="page hidden p-6 space-y-5">
    <h1 class="text-lg font-bold">設備管理</h1>
    <div class="grid grid-cols-3 gap-4">
      <div class="device-card bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"><div class="flex items-center gap-3 mb-3"><span class="text-2xl">🌡️</span><div><div class="font-medium text-sm">溫濕度感測器</div><div class="text-xs text-gray-500">客廳 · Zigbee</div></div><span class="pulse-dot w-2 h-2 rounded-full bg-iot-400 ml-auto"></span></div><div class="mono text-xs text-gray-400">24.5°C / 58%</div></div>
      <div class="device-card bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"><div class="flex items-center gap-3 mb-3"><span class="text-2xl">💡</span><div><div class="font-medium text-sm">智慧燈泡 x4</div><div class="text-xs text-gray-500">客廳 · Wi-Fi</div></div><span class="pulse-dot w-2 h-2 rounded-full bg-iot-400 ml-auto"></span></div><div class="mono text-xs text-gray-400">亮度 80% / 暖白光</div></div>
      <div class="device-card bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"><div class="flex items-center gap-3 mb-3"><span class="text-2xl">❄️</span><div><div class="font-medium text-sm">智慧空調</div><div class="text-xs text-gray-500">主臥 · IR</div></div><span class="pulse-dot w-2 h-2 rounded-full bg-iot-400 ml-auto"></span></div><div class="mono text-xs text-gray-400">25°C / 自動模式</div></div>
      <div class="device-card bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"><div class="flex items-center gap-3 mb-3"><span class="text-2xl">🔒</span><div><div class="font-medium text-sm">電子門鎖</div><div class="text-xs text-gray-500">玄關 · Bluetooth</div></div><span class="w-2 h-2 rounded-full bg-gray-600 ml-auto"></span></div><div class="mono text-xs text-amber-400">已鎖定</div></div>
      <div class="device-card bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"><div class="flex items-center gap-3 mb-3"><span class="text-2xl">📹</span><div><div class="font-medium text-sm">監視攝影機</div><div class="text-xs text-gray-500">門口 · Wi-Fi</div></div><span class="pulse-dot w-2 h-2 rounded-full bg-iot-400 ml-auto"></span></div><div class="mono text-xs text-gray-400">錄影中 · 1080p</div></div>
      <div class="device-card bg-slate-800/50 rounded-xl p-4 border border-red-500/20"><div class="flex items-center gap-3 mb-3"><span class="text-2xl">🌊</span><div><div class="font-medium text-sm">漏水偵測器</div><div class="text-xs text-gray-500">浴室 · Zigbee</div></div><span class="w-2 h-2 rounded-full bg-red-500 ml-auto"></span></div><div class="mono text-xs text-red-400">離線 · 電池低</div></div>
    </div>
  </div>

  <div id="page-alerts" class="page hidden p-6 space-y-5">
    <h1 class="text-lg font-bold">告警通知</h1>
    <div class="space-y-2">
      <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3"><span class="text-xl">🔴</span><div class="flex-1"><div class="text-sm font-medium text-red-400">漏水偵測器離線</div><div class="text-xs text-gray-500">浴室 · 電池電量過低，請更換電池</div></div><span class="text-xs text-gray-500">10 分鐘前</span></div>
      <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3"><span class="text-xl">🟡</span><div class="flex-1"><div class="text-sm font-medium text-amber-400">空氣清淨機濾網提醒</div><div class="text-xs text-gray-500">客廳 · 使用已超過 2000 小時，建議更換</div></div><span class="text-xs text-gray-500">2 小時前</span></div>
      <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-3 opacity-60"><span class="text-xl">✅</span><div class="flex-1"><div class="text-sm font-medium">門口偵測到移動</div><div class="text-xs text-gray-500">已確認為住戶</div></div><span class="text-xs text-gray-500">昨天 22:30</span></div>
    </div>
  </div>

  <div id="page-rules" class="page hidden p-6 space-y-5">
    <div class="flex items-center justify-between"><h1 class="text-lg font-bold">自動化規則</h1><button class="bg-iot-500 hover:bg-iot-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">+ 新規則</button></div>
    <div class="space-y-3">
      <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-lg bg-iot-500/20 flex items-center justify-center text-lg">🌙</div><div><div class="font-medium text-sm">晚安模式</div><div class="text-xs text-gray-500">23:00 → 關燈 + 鎖門 + 空調 26°C</div></div></div><div class="w-10 h-5 bg-iot-500 rounded-full relative cursor-pointer"><div class="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow"></div></div></div>
      <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-lg bg-sensor-400/20 flex items-center justify-center text-lg">🌡️</div><div><div class="font-medium text-sm">溫度自動調節</div><div class="text-xs text-gray-500">溫度 > 28°C → 開啟空調 25°C</div></div></div><div class="w-10 h-5 bg-iot-500 rounded-full relative cursor-pointer"><div class="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow"></div></div></div>
      <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg">🚪</div><div><div class="font-medium text-sm">出門模式</div><div class="text-xs text-gray-500">門鎖關閉 → 5 分鐘後關所有燈 + 空調</div></div></div><div class="w-10 h-5 bg-gray-600 rounded-full relative cursor-pointer"><div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow"></div></div></div>
    </div>
  </div>
</main>

<script>
function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + page).classList.remove('hidden');
  document.querySelectorAll('.sidebar-item').forEach(i => { i.classList.remove('active'); i.classList.add('text-gray-500'); });
  event.currentTarget.classList.add('active');
  event.currentTarget.classList.remove('text-gray-500');
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
