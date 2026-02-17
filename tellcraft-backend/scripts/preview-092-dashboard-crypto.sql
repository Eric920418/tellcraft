INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '5007174d-a8c2-43d0-b63a-7147ffa4ce57',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>幣勢通 CryptoVault</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { crypto: { 50:'#fffbeb',100:'#fef3c7',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706' } } } } } }
</script>
<style>
body { font-family: 'Inter', sans-serif; background: #0b0e11; color: #e5e7eb; }
.mono { font-family: 'JetBrains Mono', monospace; }
</style>
</head>
<body class="min-h-screen flex">
<aside class="w-56 bg-[#12151a] border-r border-white/5 flex flex-col min-h-screen">
  <div class="p-4 border-b border-white/5">
    <div class="flex items-center gap-2"><div class="w-8 h-8 rounded-lg bg-crypto-500 flex items-center justify-center text-sm font-bold text-black">₿</div><span class="font-bold text-white text-sm">CryptoVault</span></div>
  </div>
  <nav class="flex-1 p-3 space-y-1 text-sm" id="sidebar-nav">
    <a onclick="switchPage('overview')" class="nav-item active flex items-center gap-2 px-3 py-2 rounded-lg bg-crypto-500/10 text-crypto-400 font-medium cursor-pointer">📊 總覽</a>
    <a onclick="switchPage('portfolio')" class="nav-item flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-white/5 cursor-pointer">💰 投資組合</a>
    <a onclick="switchPage('market')" class="nav-item flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-white/5 cursor-pointer">📈 行情</a>
    <a onclick="switchPage('alerts')" class="nav-item flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-white/5 cursor-pointer">🔔 提醒</a>
  </nav>
</aside>

<main class="flex-1 overflow-auto">
  <!-- Overview -->
  <div id="page-overview" class="page-content p-6">
    <div class="flex items-center justify-between mb-6"><h1 class="text-xl font-bold">資產總覽</h1><span class="text-xs text-gray-500">更新於 2026/02/16 14:30</span></div>
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-[#12151a] rounded-xl p-4 border border-white/5"><div class="text-xs text-gray-500">總資產</div><div class="text-2xl font-bold text-white mt-1 mono">$124,832</div><div class="text-xs text-green-400 mt-1">↑ 4.2% (24h)</div></div>
      <div class="bg-[#12151a] rounded-xl p-4 border border-white/5"><div class="text-xs text-gray-500">今日損益</div><div class="text-2xl font-bold text-green-400 mt-1 mono">+$5,021</div><div class="text-xs text-green-400 mt-1">↑ 4.19%</div></div>
      <div class="bg-[#12151a] rounded-xl p-4 border border-white/5"><div class="text-xs text-gray-500">BTC 持倉</div><div class="text-2xl font-bold text-crypto-400 mt-1 mono">1.45 BTC</div><div class="text-xs text-gray-500 mt-1">≈ $89,320</div></div>
      <div class="bg-[#12151a] rounded-xl p-4 border border-white/5"><div class="text-xs text-gray-500">ETH 持倉</div><div class="text-2xl font-bold text-blue-400 mt-1 mono">12.8 ETH</div><div class="text-xs text-gray-500 mt-1">≈ $35,512</div></div>
    </div>
    <div class="bg-[#12151a] rounded-xl p-5 border border-white/5 mb-6">
      <h3 class="text-sm font-medium mb-4">資產走勢 (30 天)</h3>
      <svg viewBox="0 0 600 150" class="w-full h-32">
        <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(245,158,11,0.3)"/><stop offset="100%" stop-color="rgba(245,158,11,0)"/></linearGradient></defs>
        <path d="M0,120 L20,115 L40,110 L60,105 L80,108 L100,95 L120,90 L140,85 L160,88 L180,75 L200,70 L220,72 L240,65 L260,60 L280,55 L300,58 L320,50 L340,45 L360,40 L380,42 L400,35 L420,38 L440,30 L460,25 L480,28 L500,22 L520,18 L540,20 L560,15 L580,10 L600,8" fill="none" stroke="#f59e0b" stroke-width="2"/>
        <path d="M0,120 L20,115 L40,110 L60,105 L80,108 L100,95 L120,90 L140,85 L160,88 L180,75 L200,70 L220,72 L240,65 L260,60 L280,55 L300,58 L320,50 L340,45 L360,40 L380,42 L400,35 L420,38 L440,30 L460,25 L480,28 L500,22 L520,18 L540,20 L560,15 L580,10 L600,8 L600,150 L0,150Z" fill="url(#cg)"/>
      </svg>
    </div>
    <div class="bg-[#12151a] rounded-xl p-5 border border-white/5">
      <h3 class="text-sm font-medium mb-3">快速行情</h3>
      <div class="space-y-2">
        <div class="flex items-center justify-between py-2 border-b border-white/5"><div class="flex items-center gap-2"><span class="text-lg">₿</span><span class="font-medium text-sm">Bitcoin</span><span class="text-xs text-gray-500">BTC</span></div><div class="text-right"><div class="mono text-sm font-medium">$61,600</div><div class="text-xs text-green-400">+3.8%</div></div></div>
        <div class="flex items-center justify-between py-2 border-b border-white/5"><div class="flex items-center gap-2"><span class="text-lg">◆</span><span class="font-medium text-sm">Ethereum</span><span class="text-xs text-gray-500">ETH</span></div><div class="text-right"><div class="mono text-sm font-medium">$2,774</div><div class="text-xs text-green-400">+5.1%</div></div></div>
        <div class="flex items-center justify-between py-2"><div class="flex items-center gap-2"><span class="text-lg">◎</span><span class="font-medium text-sm">Solana</span><span class="text-xs text-gray-500">SOL</span></div><div class="text-right"><div class="mono text-sm font-medium">$142.5</div><div class="text-xs text-red-400">-1.2%</div></div></div>
      </div>
    </div>
  </div>

  <!-- Portfolio -->
  <div id="page-portfolio" class="page-content hidden p-6">
    <h1 class="text-xl font-bold mb-6">投資組合</h1>
    <div class="grid grid-cols-2 gap-6">
      <div class="bg-[#12151a] rounded-xl p-5 border border-white/5">
        <h3 class="text-sm font-medium mb-4">持倉分配</h3>
        <div class="space-y-3">
          <div><div class="flex justify-between text-xs mb-1"><span class="text-gray-400">BTC</span><span class="mono">71.5%</span></div><div class="h-2 bg-white/5 rounded-full"><div class="h-2 bg-crypto-500 rounded-full" style="width:71.5%"></div></div></div>
          <div><div class="flex justify-between text-xs mb-1"><span class="text-gray-400">ETH</span><span class="mono">22.8%</span></div><div class="h-2 bg-white/5 rounded-full"><div class="h-2 bg-blue-500 rounded-full" style="width:22.8%"></div></div></div>
          <div><div class="flex justify-between text-xs mb-1"><span class="text-gray-400">SOL</span><span class="mono">3.2%</span></div><div class="h-2 bg-white/5 rounded-full"><div class="h-2 bg-purple-500 rounded-full" style="width:3.2%"></div></div></div>
          <div><div class="flex justify-between text-xs mb-1"><span class="text-gray-400">其他</span><span class="mono">2.5%</span></div><div class="h-2 bg-white/5 rounded-full"><div class="h-2 bg-gray-500 rounded-full" style="width:2.5%"></div></div></div>
        </div>
      </div>
      <div class="bg-[#12151a] rounded-xl p-5 border border-white/5">
        <h3 class="text-sm font-medium mb-4">最近交易</h3>
        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between py-2 border-b border-white/5"><div><span class="text-green-400 text-xs font-bold mr-2">買入</span><span>BTC</span></div><div class="text-right"><div class="mono text-xs">0.05 BTC</div><div class="text-[10px] text-gray-500">$3,080 · 02/15</div></div></div>
          <div class="flex items-center justify-between py-2 border-b border-white/5"><div><span class="text-red-400 text-xs font-bold mr-2">賣出</span><span>SOL</span></div><div class="text-right"><div class="mono text-xs">15 SOL</div><div class="text-[10px] text-gray-500">$2,137 · 02/14</div></div></div>
          <div class="flex items-center justify-between py-2"><div><span class="text-green-400 text-xs font-bold mr-2">買入</span><span>ETH</span></div><div class="text-right"><div class="mono text-xs">2.0 ETH</div><div class="text-[10px] text-gray-500">$5,408 · 02/13</div></div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Market -->
  <div id="page-market" class="page-content hidden p-6">
    <h1 class="text-xl font-bold mb-6">行情總覽</h1>
    <div class="bg-[#12151a] rounded-xl border border-white/5 overflow-hidden">
      <table class="w-full text-sm">
        <thead><tr class="bg-white/5 text-xs text-gray-500"><th class="py-3 px-4 text-left">#</th><th class="py-3 px-4 text-left">幣種</th><th class="py-3 px-4 text-right">價格</th><th class="py-3 px-4 text-right">24h%</th><th class="py-3 px-4 text-right">7d%</th><th class="py-3 px-4 text-right">市值</th></tr></thead>
        <tbody class="mono text-xs">
          <tr class="border-t border-white/5"><td class="py-3 px-4 text-gray-500">1</td><td class="py-3 px-4 font-medium text-white">₿ Bitcoin</td><td class="py-3 px-4 text-right">$61,600</td><td class="py-3 px-4 text-right text-green-400">+3.8%</td><td class="py-3 px-4 text-right text-green-400">+8.2%</td><td class="py-3 px-4 text-right text-gray-400">$1.21T</td></tr>
          <tr class="border-t border-white/5"><td class="py-3 px-4 text-gray-500">2</td><td class="py-3 px-4 font-medium text-white">◆ Ethereum</td><td class="py-3 px-4 text-right">$2,774</td><td class="py-3 px-4 text-right text-green-400">+5.1%</td><td class="py-3 px-4 text-right text-green-400">+12.4%</td><td class="py-3 px-4 text-right text-gray-400">$334B</td></tr>
          <tr class="border-t border-white/5"><td class="py-3 px-4 text-gray-500">3</td><td class="py-3 px-4 font-medium text-white">◎ Solana</td><td class="py-3 px-4 text-right">$142.5</td><td class="py-3 px-4 text-right text-red-400">-1.2%</td><td class="py-3 px-4 text-right text-green-400">+5.6%</td><td class="py-3 px-4 text-right text-gray-400">$62B</td></tr>
          <tr class="border-t border-white/5"><td class="py-3 px-4 text-gray-500">4</td><td class="py-3 px-4 font-medium text-white">⬡ Cardano</td><td class="py-3 px-4 text-right">$0.62</td><td class="py-3 px-4 text-right text-green-400">+2.3%</td><td class="py-3 px-4 text-right text-red-400">-0.8%</td><td class="py-3 px-4 text-right text-gray-400">$22B</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Alerts -->
  <div id="page-alerts" class="page-content hidden p-6">
    <div class="flex items-center justify-between mb-6"><h1 class="text-xl font-bold">價格提醒</h1><button class="bg-crypto-500 hover:bg-crypto-600 text-black px-4 py-2 rounded-lg text-sm font-bold transition cursor-pointer">+ 新增提醒</button></div>
    <div class="space-y-3">
      <div class="bg-[#12151a] rounded-xl p-4 border border-white/5 flex items-center justify-between"><div class="flex items-center gap-3"><span class="text-lg">₿</span><div><div class="font-medium text-sm">BTC 突破 $65,000</div><div class="text-xs text-gray-500">高於目標 $3,400</div></div></div><span class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded font-medium">監控中</span></div>
      <div class="bg-[#12151a] rounded-xl p-4 border border-white/5 flex items-center justify-between"><div class="flex items-center gap-3"><span class="text-lg">◆</span><div><div class="font-medium text-sm">ETH 跌破 $2,500</div><div class="text-xs text-gray-500">低於目標 $274</div></div></div><span class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded font-medium">監控中</span></div>
      <div class="bg-[#12151a] rounded-xl p-4 border border-white/5 flex items-center justify-between"><div class="flex items-center gap-3"><span class="text-lg">◎</span><div><div class="font-medium text-sm">SOL 突破 $150</div><div class="text-xs text-gray-500">高於目標 $7.5</div></div></div><span class="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-medium">接近觸發</span></div>
    </div>
  </div>
</main>

<script>
function switchPage(page) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + page).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n => { n.className = n.className.replace(/bg-crypto-500\/10 text-crypto-400 font-medium/g, 'text-gray-500 hover:bg-white/5'); n.classList.remove('active'); });
  event.currentTarget.className = event.currentTarget.className.replace(/text-gray-500 hover:bg-white\/5/g, 'bg-crypto-500/10 text-crypto-400 font-medium'); event.currentTarget.classList.add('active');
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
