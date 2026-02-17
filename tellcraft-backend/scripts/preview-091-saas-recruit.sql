INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '8461b27f-2131-4873-a149-1267152dbd87',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>人才引擎 TalentEngine</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { talent: { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',400:'#818cf8',500:'#6366f1',600:'#4f46e5' } } } } } }
</script>
<style>
* { font-family: 'DM Sans', sans-serif; }
body { background: #f8f9fc; }
</style>
</head>
<body class="min-h-screen flex">
<aside class="w-56 bg-white border-r border-gray-100 flex flex-col min-h-screen">
  <div class="p-4 border-b border-gray-50">
    <div class="flex items-center gap-2 mb-3"><div class="w-8 h-8 rounded-lg bg-talent-500 flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div><span class="font-bold text-gray-800 text-sm">TalentEngine</span></div>
  </div>
  <nav class="flex-1 p-3 space-y-1 text-sm" id="sidebar-nav">
    <a onclick="switchPage('pipeline')" class="nav-item active flex items-center gap-2 px-3 py-2 rounded-lg bg-talent-50 text-talent-600 font-medium cursor-pointer"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>招聘管道</a>
    <a onclick="switchPage('jobs')" class="nav-item flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>職位管理</a>
    <a onclick="switchPage('talent')" class="nav-item flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>人才庫</a>
    <a onclick="switchPage('analytics')" class="nav-item flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>數據分析</a>
  </nav>
</aside>

<main class="flex-1 overflow-auto">
  <!-- Pipeline Page -->
  <div id="page-pipeline" class="page-content p-6">
    <div class="flex items-center justify-between mb-6"><h1 class="text-xl font-bold text-gray-800">招聘管道</h1><button class="bg-talent-500 hover:bg-talent-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">+ 新增候選人</button></div>
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="flex items-center justify-between mb-3"><h3 class="font-medium text-gray-600 text-sm">履歷篩選</h3><span class="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">12</span></div><div class="space-y-2">
        <div class="bg-gray-50 rounded-lg p-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs">👩</div><div><div class="text-sm font-medium text-gray-800">陳小美</div><div class="text-[10px] text-gray-400">前端工程師 · 3 年</div></div></div></div>
        <div class="bg-gray-50 rounded-lg p-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs">👨</div><div><div class="text-sm font-medium text-gray-800">王大明</div><div class="text-[10px] text-gray-400">後端工程師 · 5 年</div></div></div></div>
      </div></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="flex items-center justify-between mb-3"><h3 class="font-medium text-gray-600 text-sm">初試</h3><span class="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">8</span></div><div class="space-y-2">
        <div class="bg-gray-50 rounded-lg p-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-xs">👩</div><div><div class="text-sm font-medium text-gray-800">林雅婷</div><div class="text-[10px] text-gray-400">UI 設計師 · 4 年</div></div></div><div class="text-[10px] text-talent-500 mt-2 font-medium">📅 明天 14:00 面試</div></div>
      </div></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="flex items-center justify-between mb-3"><h3 class="font-medium text-gray-600 text-sm">複試</h3><span class="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">5</span></div><div class="space-y-2">
        <div class="bg-gray-50 rounded-lg p-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center text-xs">👨</div><div><div class="text-sm font-medium text-gray-800">張志豪</div><div class="text-[10px] text-gray-400">全端工程師 · 6 年</div></div></div><div class="text-[10px] text-green-500 mt-2 font-medium">⭐ 技術面試 92 分</div></div>
      </div></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="flex items-center justify-between mb-3"><h3 class="font-medium text-gray-600 text-sm">發送 Offer</h3><span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">3</span></div><div class="space-y-2">
        <div class="bg-green-50 rounded-lg p-3 border border-green-100"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs">👩</div><div><div class="text-sm font-medium text-gray-800">黃美玲</div><div class="text-[10px] text-gray-400">PM · 7 年</div></div></div><div class="text-[10px] text-green-600 mt-2 font-medium">✅ 已接受 Offer</div></div>
      </div></div>
    </div>
  </div>

  <!-- Jobs Page -->
  <div id="page-jobs" class="page-content hidden p-6">
    <div class="flex items-center justify-between mb-6"><h1 class="text-xl font-bold text-gray-800">職位管理</h1><button class="bg-talent-500 hover:bg-talent-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">+ 發布職位</button></div>
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table class="w-full text-sm">
        <thead><tr class="bg-gray-50 text-xs text-gray-500"><th class="py-3 px-4 text-left">職位名稱</th><th class="py-3 px-4">部門</th><th class="py-3 px-4">應徵數</th><th class="py-3 px-4">狀態</th><th class="py-3 px-4">發布日期</th></tr></thead>
        <tbody>
          <tr class="border-t border-gray-50"><td class="py-3 px-4 font-medium text-gray-800">資深前端工程師</td><td class="py-3 px-4 text-center text-gray-500">工程部</td><td class="py-3 px-4 text-center font-medium text-talent-500">28</td><td class="py-3 px-4 text-center"><span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">招聘中</span></td><td class="py-3 px-4 text-center text-gray-400">2026/02/01</td></tr>
          <tr class="border-t border-gray-50"><td class="py-3 px-4 font-medium text-gray-800">產品經理</td><td class="py-3 px-4 text-center text-gray-500">產品部</td><td class="py-3 px-4 text-center font-medium text-talent-500">15</td><td class="py-3 px-4 text-center"><span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">招聘中</span></td><td class="py-3 px-4 text-center text-gray-400">2026/01/28</td></tr>
          <tr class="border-t border-gray-50"><td class="py-3 px-4 font-medium text-gray-800">UI/UX 設計師</td><td class="py-3 px-4 text-center text-gray-500">設計部</td><td class="py-3 px-4 text-center font-medium text-talent-500">22</td><td class="py-3 px-4 text-center"><span class="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">審核中</span></td><td class="py-3 px-4 text-center text-gray-400">2026/02/10</td></tr>
          <tr class="border-t border-gray-50"><td class="py-3 px-4 font-medium text-gray-800">DevOps 工程師</td><td class="py-3 px-4 text-center text-gray-500">基礎設施</td><td class="py-3 px-4 text-center font-medium text-talent-500">9</td><td class="py-3 px-4 text-center"><span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">已關閉</span></td><td class="py-3 px-4 text-center text-gray-400">2026/01/15</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Talent Pool Page -->
  <div id="page-talent" class="page-content hidden p-6">
    <div class="flex items-center justify-between mb-6"><h1 class="text-xl font-bold text-gray-800">人才庫</h1><div class="relative"><svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" placeholder="搜尋人才..." class="bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-talent-200 w-64"></div></div>
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white rounded-xl p-5 border border-gray-100"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg">👩‍💻</div><div><div class="font-bold text-gray-800">陳小美</div><div class="text-xs text-gray-400">前端工程師 · 3 年</div></div></div><div class="flex flex-wrap gap-1"><span class="text-[10px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">React</span><span class="text-[10px] bg-green-50 text-green-500 px-2 py-0.5 rounded-full">Vue</span><span class="text-[10px] bg-purple-50 text-purple-500 px-2 py-0.5 rounded-full">TypeScript</span></div><div class="text-xs text-gray-400 mt-2">評分：⭐⭐⭐⭐ · 來源：104</div></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg">👨‍💻</div><div><div class="font-bold text-gray-800">王大明</div><div class="text-xs text-gray-400">後端工程師 · 5 年</div></div></div><div class="flex flex-wrap gap-1"><span class="text-[10px] bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full">Node.js</span><span class="text-[10px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">Go</span><span class="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full">PostgreSQL</span></div><div class="text-xs text-gray-400 mt-2">評分：⭐⭐⭐⭐⭐ · 來源：LinkedIn</div></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-lg">👩‍🎨</div><div><div class="font-bold text-gray-800">林雅婷</div><div class="text-xs text-gray-400">UI 設計師 · 4 年</div></div></div><div class="flex flex-wrap gap-1"><span class="text-[10px] bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full">Figma</span><span class="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">Sketch</span><span class="text-[10px] bg-cyan-50 text-cyan-500 px-2 py-0.5 rounded-full">Framer</span></div><div class="text-xs text-gray-400 mt-2">評分：⭐⭐⭐⭐ · 來源：主動投遞</div></div>
    </div>
  </div>

  <!-- Analytics Page -->
  <div id="page-analytics" class="page-content hidden p-6">
    <h1 class="text-xl font-bold text-gray-800 mb-6">數據分析</h1>
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="text-xs text-gray-400">總應徵數</div><div class="text-2xl font-bold text-gray-800 mt-1">247</div><div class="text-xs text-green-500 mt-1">↑ 18% vs 上月</div></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="text-xs text-gray-400">面試到場率</div><div class="text-2xl font-bold text-gray-800 mt-1">82%</div><div class="text-xs text-green-500 mt-1">↑ 5%</div></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="text-xs text-gray-400">平均招聘天數</div><div class="text-2xl font-bold text-gray-800 mt-1">23 天</div><div class="text-xs text-green-500 mt-1">↓ 3 天</div></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="text-xs text-gray-400">Offer 接受率</div><div class="text-2xl font-bold text-gray-800 mt-1">91%</div><div class="text-xs text-gray-400 mt-1">→ 持平</div></div>
    </div>
    <div class="bg-white rounded-xl p-5 border border-gray-100">
      <h3 class="font-medium text-gray-800 text-sm mb-4">招聘漏斗</h3>
      <div class="space-y-3">
        <div><div class="flex justify-between text-xs mb-1"><span class="text-gray-500">履歷投遞</span><span class="font-medium">247</span></div><div class="h-3 bg-gray-100 rounded-full"><div class="h-3 bg-talent-500 rounded-full" style="width:100%"></div></div></div>
        <div><div class="flex justify-between text-xs mb-1"><span class="text-gray-500">初試</span><span class="font-medium">86</span></div><div class="h-3 bg-gray-100 rounded-full"><div class="h-3 bg-talent-400 rounded-full" style="width:35%"></div></div></div>
        <div><div class="flex justify-between text-xs mb-1"><span class="text-gray-500">複試</span><span class="font-medium">32</span></div><div class="h-3 bg-gray-100 rounded-full"><div class="h-3 bg-talent-300 rounded-full" style="width:13%"></div></div></div>
        <div><div class="flex justify-between text-xs mb-1"><span class="text-gray-500">Offer</span><span class="font-medium">11</span></div><div class="h-3 bg-gray-100 rounded-full"><div class="h-3 bg-green-400 rounded-full" style="width:4.5%"></div></div></div>
      </div>
    </div>
  </div>
</main>

<script>
function switchPage(page) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + page).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n => { n.className = n.className.replace(/bg-talent-50 text-talent-600 font-medium/g, 'text-gray-500 hover:bg-gray-50'); n.classList.remove('active'); });
  event.currentTarget.className = event.currentTarget.className.replace(/text-gray-500 hover:bg-gray-50/g, 'bg-talent-50 text-talent-600 font-medium'); event.currentTarget.classList.add('active');
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
