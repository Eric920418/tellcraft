INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'fba66d17-4111-4242-8b19-cdb967245b90',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>智聊 ChatGenius</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { chat: { 50:'#f0fdf4',100:'#dcfce7',400:'#4ade80',500:'#22c55e',600:'#16a34a' }, ai: { 50:'#eef2ff',100:'#e0e7ff',400:'#818cf8',500:'#6366f1',600:'#4f46e5' } } } } } }
</script>
<style>
* { font-family: 'DM Sans', sans-serif; }
body { background: #f8f9fc; }
</style>
</head>
<body class="min-h-screen flex">
<aside class="w-56 bg-white border-r border-gray-100 flex flex-col min-h-screen">
  <div class="p-4 border-b border-gray-50">
    <div class="flex items-center gap-2 mb-3"><div class="w-8 h-8 rounded-lg bg-ai-500 flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg></div><span class="font-bold text-gray-800 text-sm">ChatGenius</span></div>
  </div>
  <nav class="flex-1 p-3 space-y-1 text-sm" id="sidebar-nav">
    <a onclick="switchPage('dashboard')" class="nav-item active flex items-center gap-2 px-3 py-2 rounded-lg bg-ai-50 text-ai-600 font-medium cursor-pointer">📊 儀表板</a>
    <a onclick="switchPage('flows')" class="nav-item flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer">🔀 對話流程</a>
    <a onclick="switchPage('train')" class="nav-item flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer">🧠 訓練資料</a>
    <a onclick="switchPage('preview')" class="nav-item flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer">💬 測試對話</a>
  </nav>
</aside>

<main class="flex-1 overflow-auto">
  <!-- Dashboard -->
  <div id="page-dashboard" class="page-content p-6">
    <div class="flex items-center justify-between mb-6"><h1 class="text-xl font-bold text-gray-800">儀表板</h1><select class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500 outline-none"><option>過去 7 天</option><option>過去 30 天</option></select></div>
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="text-xs text-gray-400">總對話數</div><div class="text-2xl font-bold text-gray-800 mt-1">4,821</div><div class="text-xs text-chat-500 mt-1">↑ 12% vs 上週</div></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="text-xs text-gray-400">解決率</div><div class="text-2xl font-bold text-gray-800 mt-1">87%</div><div class="text-xs text-chat-500 mt-1">↑ 3%</div></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="text-xs text-gray-400">平均回應時間</div><div class="text-2xl font-bold text-gray-800 mt-1">1.2 秒</div><div class="text-xs text-chat-500 mt-1">↓ 0.3s</div></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100"><div class="text-xs text-gray-400">滿意度</div><div class="text-2xl font-bold text-gray-800 mt-1">4.6/5</div><div class="text-xs text-chat-500 mt-1">↑ 0.2</div></div>
    </div>
    <div class="grid grid-cols-2 gap-6">
      <div class="bg-white rounded-xl p-5 border border-gray-100">
        <h3 class="text-sm font-medium text-gray-800 mb-4">對話量趨勢</h3>
        <svg viewBox="0 0 400 120" class="w-full h-24">
          <defs><linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(99,102,241,0.2)"/><stop offset="100%" stop-color="rgba(99,102,241,0)"/></linearGradient></defs>
          <path d="M0,80 L57,65 L114,70 L171,50 L228,45 L285,30 L342,35 L400,20" fill="none" stroke="#6366f1" stroke-width="2"/>
          <path d="M0,80 L57,65 L114,70 L171,50 L228,45 L285,30 L342,35 L400,20 L400,120 L0,120Z" fill="url(#cg2)"/>
        </svg>
      </div>
      <div class="bg-white rounded-xl p-5 border border-gray-100">
        <h3 class="text-sm font-medium text-gray-800 mb-4">常見問題 Top 5</h3>
        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between"><span class="text-gray-600">退貨流程</span><span class="text-xs bg-ai-100 text-ai-600 px-2 py-0.5 rounded-full">23%</span></div>
          <div class="flex items-center justify-between"><span class="text-gray-600">出貨時間</span><span class="text-xs bg-ai-100 text-ai-600 px-2 py-0.5 rounded-full">18%</span></div>
          <div class="flex items-center justify-between"><span class="text-gray-600">付款方式</span><span class="text-xs bg-ai-100 text-ai-600 px-2 py-0.5 rounded-full">14%</span></div>
          <div class="flex items-center justify-between"><span class="text-gray-600">會員優惠</span><span class="text-xs bg-ai-100 text-ai-600 px-2 py-0.5 rounded-full">11%</span></div>
          <div class="flex items-center justify-between"><span class="text-gray-600">尺寸對照</span><span class="text-xs bg-ai-100 text-ai-600 px-2 py-0.5 rounded-full">8%</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Flows -->
  <div id="page-flows" class="page-content hidden p-6">
    <div class="flex items-center justify-between mb-6"><h1 class="text-xl font-bold text-gray-800">對話流程</h1><button class="bg-ai-500 hover:bg-ai-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">+ 新增流程</button></div>
    <div class="space-y-3">
      <div class="bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-lg">🛒</div><div><h3 class="font-medium text-gray-800">購物諮詢</h3><div class="text-xs text-gray-400">12 個節點 · 6 條分支</div></div></div><div class="flex items-center gap-3"><span class="text-xs bg-chat-100 text-chat-600 px-2 py-1 rounded-full font-medium">已上線</span><button class="text-xs text-gray-400 hover:text-ai-500 cursor-pointer">編輯</button></div></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-lg">📦</div><div><h3 class="font-medium text-gray-800">退貨處理</h3><div class="text-xs text-gray-400">8 個節點 · 4 條分支</div></div></div><div class="flex items-center gap-3"><span class="text-xs bg-chat-100 text-chat-600 px-2 py-1 rounded-full font-medium">已上線</span><button class="text-xs text-gray-400 hover:text-ai-500 cursor-pointer">編輯</button></div></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-lg">🎫</div><div><h3 class="font-medium text-gray-800">優惠券查詢</h3><div class="text-xs text-gray-400">5 個節點 · 3 條分支</div></div></div><div class="flex items-center gap-3"><span class="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full font-medium">草稿</span><button class="text-xs text-gray-400 hover:text-ai-500 cursor-pointer">編輯</button></div></div>
    </div>
  </div>

  <!-- Training -->
  <div id="page-train" class="page-content hidden p-6">
    <div class="flex items-center justify-between mb-6"><h1 class="text-xl font-bold text-gray-800">訓練資料</h1><button class="bg-ai-500 hover:bg-ai-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">+ 匯入資料</button></div>
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 border border-gray-100 text-center"><div class="text-2xl mb-1">📄</div><div class="text-sm font-medium text-gray-800">FAQ 文件</div><div class="text-xs text-gray-400 mt-1">128 筆問答對</div><div class="text-xs text-chat-500 mt-2">已訓練</div></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100 text-center"><div class="text-2xl mb-1">🌐</div><div class="text-sm font-medium text-gray-800">網站內容</div><div class="text-xs text-gray-400 mt-1">32 個頁面</div><div class="text-xs text-chat-500 mt-2">已訓練</div></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100 text-center"><div class="text-2xl mb-1">💬</div><div class="text-sm font-medium text-gray-800">歷史對話</div><div class="text-xs text-gray-400 mt-1">2,450 筆對話</div><div class="text-xs text-amber-500 mt-2">訓練中...</div></div>
    </div>
    <div class="bg-white rounded-xl p-5 border border-gray-100">
      <h3 class="text-sm font-medium text-gray-800 mb-3">最近訓練記錄</h3>
      <div class="space-y-2 text-sm">
        <div class="flex items-center justify-between py-2 border-b border-gray-50"><div><span class="text-gray-600">FAQ v3 更新</span><span class="text-xs text-gray-400 ml-2">+15 筆</span></div><div class="text-xs text-gray-400">2 小時前</div></div>
        <div class="flex items-center justify-between py-2 border-b border-gray-50"><div><span class="text-gray-600">產品頁面爬取</span><span class="text-xs text-gray-400 ml-2">8 個頁面</span></div><div class="text-xs text-gray-400">昨天</div></div>
        <div class="flex items-center justify-between py-2"><div><span class="text-gray-600">對話紀錄匯入</span><span class="text-xs text-gray-400 ml-2">500 筆</span></div><div class="text-xs text-gray-400">3 天前</div></div>
      </div>
    </div>
  </div>

  <!-- Preview Chat -->
  <div id="page-preview" class="page-content hidden p-6">
    <h1 class="text-xl font-bold text-gray-800 mb-6">測試對話</h1>
    <div class="max-w-lg mx-auto bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div class="bg-ai-500 text-white px-4 py-3 flex items-center gap-2"><div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">🤖</div><span class="font-medium text-sm">ChatGenius Bot</span><span class="text-xs text-white/60 ml-auto">線上</span></div>
      <div class="p-4 space-y-3 h-72 overflow-auto bg-gray-50">
        <div class="flex gap-2"><div class="w-6 h-6 rounded-full bg-ai-100 flex items-center justify-center text-xs shrink-0">🤖</div><div class="bg-white rounded-xl rounded-tl-sm px-3 py-2 text-sm text-gray-600 max-w-xs shadow-sm">你好！我是 ChatGenius 智能助手，有什麼可以幫你的嗎？😊</div></div>
        <div class="flex gap-2 justify-end"><div class="bg-ai-500 text-white rounded-xl rounded-tr-sm px-3 py-2 text-sm max-w-xs">我想退貨，要怎麼辦？</div></div>
        <div class="flex gap-2"><div class="w-6 h-6 rounded-full bg-ai-100 flex items-center justify-center text-xs shrink-0">🤖</div><div class="bg-white rounded-xl rounded-tl-sm px-3 py-2 text-sm text-gray-600 max-w-xs shadow-sm">沒問題！退貨流程很簡單：<br>1️⃣ 登入帳號 → 訂單紀錄<br>2️⃣ 點選「申請退貨」<br>3️⃣ 填寫退貨原因<br><br>7 天內會完成退款。需要我幫你查詢訂單嗎？</div></div>
      </div>
      <div class="p-3 border-t border-gray-100 flex gap-2"><input type="text" placeholder="輸入訊息..." class="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ai-200"><button class="bg-ai-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ai-600 transition">送出</button></div>
    </div>
  </div>
</main>

<script>
function switchPage(page) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + page).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n => { n.className = n.className.replace(/bg-ai-50 text-ai-600 font-medium/g, 'text-gray-500 hover:bg-gray-50'); n.classList.remove('active'); });
  event.currentTarget.className = event.currentTarget.className.replace(/text-gray-500 hover:bg-gray-50/g, 'bg-ai-50 text-ai-600 font-medium'); event.currentTarget.classList.add('active');
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
