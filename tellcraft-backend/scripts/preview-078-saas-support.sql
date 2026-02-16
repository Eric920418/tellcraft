INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'ad59aa11-c881-48f9-b839-19f66d012600',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>客服雲 SupportCloud</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { fontFamily: { jakarta: ['Plus Jakarta Sans','sans-serif'] }, colors: { sup: { 50:'#f0f9ff',100:'#e0f2fe',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1' } } } } }
</script>
<style>
* { font-family: 'Plus Jakarta Sans', sans-serif; }
body { background: #f8fafc; }
.sidebar-item { transition: all 0.2s; }
.sidebar-item:hover, .sidebar-item.active { background: rgba(14,165,233,0.08); color: #0284c7; }
.ticket-row { transition: background 0.15s; cursor: pointer; }
.ticket-row:hover { background: #f0f9ff; }
</style>
</head>
<body class="min-h-screen flex">
<aside class="w-56 bg-white border-r border-gray-100 flex flex-col min-h-screen">
  <div class="p-4 border-b border-gray-50">
    <div class="flex items-center gap-2"><div class="w-8 h-8 rounded-lg bg-sup-500 flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg></div><span class="font-bold text-gray-800 text-sm">SupportCloud</span></div>
  </div>
  <nav class="flex-1 p-2 space-y-0.5">
    <div class="sidebar-item active flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer" onclick="switchPage('tickets')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
      工單 <span class="ml-auto text-[10px] bg-sup-500 text-white w-5 h-5 rounded-full flex items-center justify-center">8</span>
    </div>
    <div class="sidebar-item flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('kb')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
      知識庫
    </div>
    <div class="sidebar-item flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('chat')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>
      即時聊天 <span class="ml-auto text-[10px] bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center">2</span>
    </div>
    <div class="sidebar-item flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('stats')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
      統計
    </div>
  </nav>
</aside>

<main class="flex-1 overflow-auto">
  <!-- Tickets Page -->
  <div id="page-tickets" class="page p-6">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-lg font-bold text-gray-800">工單管理</h1>
      <button class="bg-sup-500 hover:bg-sup-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">+ 新工單</button>
    </div>
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div class="flex items-center gap-2 px-4 py-2 border-b border-gray-50 bg-gray-50/50 text-xs">
        <button class="px-2 py-1 rounded bg-sup-500 text-white font-medium">全部 (8)</button>
        <button class="px-2 py-1 rounded text-gray-400 hover:bg-gray-100">待處理 (3)</button>
        <button class="px-2 py-1 rounded text-gray-400 hover:bg-gray-100">處理中 (4)</button>
        <button class="px-2 py-1 rounded text-gray-400 hover:bg-gray-100">已解決 (1)</button>
      </div>
      <table class="w-full text-sm">
        <thead><tr class="border-b border-gray-50 text-xs text-gray-400"><th class="text-left px-4 py-2 font-medium">工單</th><th class="text-left px-4 py-2 font-medium">客戶</th><th class="text-left px-4 py-2 font-medium">優先級</th><th class="text-left px-4 py-2 font-medium">狀態</th><th class="text-left px-4 py-2 font-medium">更新時間</th></tr></thead>
        <tbody>
          <tr class="ticket-row border-b border-gray-50"><td class="px-4 py-3"><div class="font-medium text-gray-700">#1024 無法登入帳號</div><div class="text-xs text-gray-400">登入後顯示白畫面</div></td><td class="px-4 py-3 text-gray-600">陳小明</td><td class="px-4 py-3"><span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">緊急</span></td><td class="px-4 py-3"><span class="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">處理中</span></td><td class="px-4 py-3 text-xs text-gray-400">5 分鐘前</td></tr>
          <tr class="ticket-row border-b border-gray-50"><td class="px-4 py-3"><div class="font-medium text-gray-700">#1023 付款失敗</div><div class="text-xs text-gray-400">信用卡扣款後未收到確認</div></td><td class="px-4 py-3 text-gray-600">王美麗</td><td class="px-4 py-3"><span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">緊急</span></td><td class="px-4 py-3"><span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">待處理</span></td><td class="px-4 py-3 text-xs text-gray-400">20 分鐘前</td></tr>
          <tr class="ticket-row border-b border-gray-50"><td class="px-4 py-3"><div class="font-medium text-gray-700">#1022 功能建議</div><div class="text-xs text-gray-400">希望新增匯出 CSV 功能</div></td><td class="px-4 py-3 text-gray-600">林大偉</td><td class="px-4 py-3"><span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">低</span></td><td class="px-4 py-3"><span class="text-xs bg-sup-100 text-sup-600 px-2 py-0.5 rounded-full font-medium">處理中</span></td><td class="px-4 py-3 text-xs text-gray-400">1 小時前</td></tr>
          <tr class="ticket-row"><td class="px-4 py-3"><div class="font-medium text-gray-700">#1021 忘記密碼</div><div class="text-xs text-gray-400">重設信未收到</div></td><td class="px-4 py-3 text-gray-600">張家豪</td><td class="px-4 py-3"><span class="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">中</span></td><td class="px-4 py-3"><span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">已解決</span></td><td class="px-4 py-3 text-xs text-gray-400">2 小時前</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Knowledge Base -->
  <div id="page-kb" class="page hidden p-6">
    <h1 class="text-lg font-bold text-gray-800 mb-5">知識庫</h1>
    <div class="mb-4"><input type="text" placeholder="🔍 搜尋文章..." class="w-full max-w-md bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-sup-300"></div>
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white rounded-xl p-5 border border-gray-100 hover:border-sup-200 transition cursor-pointer"><div class="text-2xl mb-2">🔑</div><h3 class="font-bold text-gray-800 text-sm">帳號與登入</h3><p class="text-xs text-gray-400 mt-1">12 篇文章</p></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 hover:border-sup-200 transition cursor-pointer"><div class="text-2xl mb-2">💳</div><h3 class="font-bold text-gray-800 text-sm">付款與帳單</h3><p class="text-xs text-gray-400 mt-1">8 篇文章</p></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 hover:border-sup-200 transition cursor-pointer"><div class="text-2xl mb-2">⚙️</div><h3 class="font-bold text-gray-800 text-sm">功能使用</h3><p class="text-xs text-gray-400 mt-1">24 篇文章</p></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 hover:border-sup-200 transition cursor-pointer"><div class="text-2xl mb-2">📱</div><h3 class="font-bold text-gray-800 text-sm">App 相關</h3><p class="text-xs text-gray-400 mt-1">6 篇文章</p></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 hover:border-sup-200 transition cursor-pointer"><div class="text-2xl mb-2">🔒</div><h3 class="font-bold text-gray-800 text-sm">安全與隱私</h3><p class="text-xs text-gray-400 mt-1">5 篇文章</p></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 hover:border-sup-200 transition cursor-pointer"><div class="text-2xl mb-2">📦</div><h3 class="font-bold text-gray-800 text-sm">API 整合</h3><p class="text-xs text-gray-400 mt-1">10 篇文章</p></div>
    </div>
  </div>

  <!-- Chat -->
  <div id="page-chat" class="page hidden p-6">
    <h1 class="text-lg font-bold text-gray-800 mb-5">即時聊天</h1>
    <div class="grid grid-cols-3 gap-4 h-[480px]">
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div class="p-3 border-b border-gray-50 text-xs font-medium text-gray-500">對話列表</div>
        <div class="p-2 space-y-1">
          <div class="flex items-center gap-2 p-2 bg-sup-50 rounded-lg cursor-pointer"><div class="w-7 h-7 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center font-bold">陳</div><div class="flex-1 min-w-0"><div class="text-xs font-medium text-gray-700 truncate">陳小明</div><div class="text-[10px] text-gray-400 truncate">我還是無法登入...</div></div><span class="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span></div>
          <div class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"><div class="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">王</div><div class="flex-1 min-w-0"><div class="text-xs font-medium text-gray-700 truncate">王美麗</div><div class="text-[10px] text-gray-400 truncate">付款問題已解決了</div></div></div>
        </div>
      </div>
      <div class="col-span-2 bg-white rounded-xl border border-gray-100 flex flex-col">
        <div class="flex items-center gap-2 p-3 border-b border-gray-50"><div class="w-6 h-6 rounded-full bg-red-100 text-red-600 text-[10px] flex items-center justify-center font-bold">陳</div><div class="text-sm font-medium text-gray-700">陳小明</div><span class="w-1.5 h-1.5 rounded-full bg-green-500 ml-1"></span></div>
        <div class="flex-1 p-4 space-y-3 overflow-auto">
          <div class="flex gap-2"><div class="w-6 h-6 rounded-full bg-red-100 text-red-600 text-[10px] flex items-center justify-center font-bold flex-shrink-0">陳</div><div class="bg-gray-50 rounded-lg rounded-tl-none px-3 py-2 text-xs text-gray-700 max-w-xs">你好，我登入後一直顯示白畫面，試了好幾次都一樣</div></div>
          <div class="flex gap-2 justify-end"><div class="bg-sup-500 text-white rounded-lg rounded-tr-none px-3 py-2 text-xs max-w-xs">您好！請問是使用哪個瀏覽器呢？可以試試清除快取後重新登入</div><div class="w-6 h-6 rounded-full bg-sup-100 text-sup-600 text-[10px] flex items-center justify-center font-bold flex-shrink-0">客</div></div>
          <div class="flex gap-2"><div class="w-6 h-6 rounded-full bg-red-100 text-red-600 text-[10px] flex items-center justify-center font-bold flex-shrink-0">陳</div><div class="bg-gray-50 rounded-lg rounded-tl-none px-3 py-2 text-xs text-gray-700 max-w-xs">Chrome，清完快取還是一樣白畫面 😢</div></div>
        </div>
        <div class="border-t border-gray-50 p-3 flex gap-2"><input type="text" placeholder="輸入回覆..." class="flex-1 text-xs bg-gray-50 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-sup-300"><button class="bg-sup-500 text-white px-3 py-2 rounded-lg text-xs font-medium">發送</button></div>
      </div>
    </div>
  </div>

  <!-- Stats -->
  <div id="page-stats" class="page hidden p-6">
    <h1 class="text-lg font-bold text-gray-800 mb-5">客服統計</h1>
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="text-xs text-gray-400">本週工單</div><div class="text-2xl font-bold text-gray-800 mt-1">42</div><div class="text-xs text-green-500 mt-1">↓ 8% vs 上週</div></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="text-xs text-gray-400">平均回覆</div><div class="text-2xl font-bold text-gray-800 mt-1">18<span class="text-sm font-normal text-gray-400 ml-1">min</span></div><div class="text-xs text-green-500 mt-1">↓ 3 min</div></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="text-xs text-gray-400">解決率</div><div class="text-2xl font-bold text-gray-800 mt-1">94<span class="text-sm font-normal text-gray-400">%</span></div><div class="text-xs text-green-500 mt-1">↑ 2%</div></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="text-xs text-gray-400">滿意度</div><div class="text-2xl font-bold text-gray-800 mt-1">4.7<span class="text-sm font-normal text-gray-400">/5</span></div><div class="text-xs text-amber-500 mt-1">★★★★★</div></div>
    </div>
    <div class="bg-white rounded-xl p-5 border border-gray-100">
      <h3 class="text-sm font-semibold text-gray-700 mb-4">工單趨勢（近 7 天）</h3>
      <div class="flex items-end gap-4 h-32">
        <div class="flex-1 flex flex-col items-center gap-1"><div class="bg-sup-400 rounded-t w-full" style="height:50px"></div><span class="text-xs text-gray-400">一</span></div>
        <div class="flex-1 flex flex-col items-center gap-1"><div class="bg-sup-400 rounded-t w-full" style="height:80px"></div><span class="text-xs text-gray-400">二</span></div>
        <div class="flex-1 flex flex-col items-center gap-1"><div class="bg-sup-400 rounded-t w-full" style="height:60px"></div><span class="text-xs text-gray-400">三</span></div>
        <div class="flex-1 flex flex-col items-center gap-1"><div class="bg-sup-400 rounded-t w-full" style="height:45px"></div><span class="text-xs text-gray-400">四</span></div>
        <div class="flex-1 flex flex-col items-center gap-1"><div class="bg-sup-400 rounded-t w-full" style="height:70px"></div><span class="text-xs text-gray-400">五</span></div>
        <div class="flex-1 flex flex-col items-center gap-1"><div class="bg-sup-200 rounded-t w-full" style="height:30px"></div><span class="text-xs text-gray-400">六</span></div>
        <div class="flex-1 flex flex-col items-center gap-1"><div class="bg-sup-100 rounded-t w-full border-2 border-dashed border-sup-300" style="height:20px"></div><span class="text-xs text-sup-500 font-medium">日</span></div>
      </div>
    </div>
  </div>
</main>

<script>
function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + page).classList.remove('hidden');
  document.querySelectorAll('.sidebar-item').forEach(item => { item.classList.remove('active'); item.classList.add('text-gray-500'); });
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
