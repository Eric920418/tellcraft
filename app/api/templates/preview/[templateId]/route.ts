import { NextResponse } from 'next/server'

// 模板 HTML 預覽
const TEMPLATE_PREVIEWS: Record<string, string> = {
  'saas-minimal': `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SaaS Dashboard - 極簡</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- Sidebar -->
  <aside class="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-6">
    <div class="flex items-center gap-3 mb-8">
      <div class="w-8 h-8 bg-blue-600 rounded-lg"></div>
      <span class="font-semibold text-gray-900">Dashboard</span>
    </div>
    <nav class="space-y-2">
      <a href="#" class="flex items-center gap-3 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        首頁
      </a>
      <a href="#" class="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
        數據分析
      </a>
      <a href="#" class="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
        用戶管理
      </a>
      <a href="#" class="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        設定
      </a>
    </nav>
  </aside>

  <!-- Main Content -->
  <main class="ml-64 p-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">歡迎回來</h1>
        <p class="text-gray-500 mt-1">這是您今天的概覽</p>
      </div>
      <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        新增項目
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-4 gap-6 mb-8">
      <div class="bg-white p-6 rounded-xl border border-gray-200">
        <p class="text-sm text-gray-500 mb-1">總收入</p>
        <p class="text-2xl font-bold text-gray-900">NT$ 128,430</p>
        <p class="text-sm text-green-600 mt-2">↑ 12.5%</p>
      </div>
      <div class="bg-white p-6 rounded-xl border border-gray-200">
        <p class="text-sm text-gray-500 mb-1">用戶數</p>
        <p class="text-2xl font-bold text-gray-900">2,847</p>
        <p class="text-sm text-green-600 mt-2">↑ 8.2%</p>
      </div>
      <div class="bg-white p-6 rounded-xl border border-gray-200">
        <p class="text-sm text-gray-500 mb-1">訂單數</p>
        <p class="text-2xl font-bold text-gray-900">1,294</p>
        <p class="text-sm text-red-600 mt-2">↓ 3.1%</p>
      </div>
      <div class="bg-white p-6 rounded-xl border border-gray-200">
        <p class="text-sm text-gray-500 mb-1">轉換率</p>
        <p class="text-2xl font-bold text-gray-900">3.24%</p>
        <p class="text-sm text-green-600 mt-2">↑ 1.2%</p>
      </div>
    </div>

    <!-- Chart Placeholder -->
    <div class="bg-white p-6 rounded-xl border border-gray-200 mb-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">收入趨勢</h2>
      <div class="h-64 flex items-end justify-between gap-2 px-4">
        <div class="w-full bg-blue-100 rounded-t" style="height: 40%"></div>
        <div class="w-full bg-blue-200 rounded-t" style="height: 60%"></div>
        <div class="w-full bg-blue-300 rounded-t" style="height: 45%"></div>
        <div class="w-full bg-blue-400 rounded-t" style="height: 80%"></div>
        <div class="w-full bg-blue-500 rounded-t" style="height: 65%"></div>
        <div class="w-full bg-blue-600 rounded-t" style="height: 90%"></div>
        <div class="w-full bg-blue-500 rounded-t" style="height: 75%"></div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-xl border border-gray-200">
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">最近活動</h2>
      </div>
      <div class="divide-y divide-gray-200">
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div>
              <p class="font-medium text-gray-900">新用戶註冊</p>
              <p class="text-sm text-gray-500">王小明 加入了平台</p>
            </div>
          </div>
          <span class="text-sm text-gray-500">5 分鐘前</span>
        </div>
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span class="text-green-600">$</span>
            </div>
            <div>
              <p class="font-medium text-gray-900">收到付款</p>
              <p class="text-sm text-gray-500">訂單 #12345 已完成</p>
            </div>
          </div>
          <span class="text-sm text-gray-500">15 分鐘前</span>
        </div>
      </div>
    </div>
  </main>
</body>
</html>
`,

  'saas-pro': `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SaaS Dashboard - 專業</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-gray-950 min-h-screen text-white">
  <!-- Sidebar -->
  <aside class="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 p-6">
    <div class="flex items-center gap-3 mb-8">
      <div class="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg"></div>
      <span class="font-semibold">Pro Dashboard</span>
    </div>
    <nav class="space-y-2">
      <a href="#" class="flex items-center gap-3 px-4 py-2.5 bg-violet-600/20 text-violet-400 rounded-lg font-medium border border-violet-500/30">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        總覽
      </a>
      <a href="#" class="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-gray-800 rounded-lg">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
        分析
      </a>
      <a href="#" class="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-gray-800 rounded-lg">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        API
      </a>
    </nav>
  </aside>

  <!-- Main Content -->
  <main class="ml-64 p-8">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold">開發者控制台</h1>
        <p class="text-gray-400 mt-1">API 使用量和系統狀態</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30">
          ● 系統正常
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-4 gap-6 mb-8">
      <div class="bg-gray-900 p-6 rounded-xl border border-gray-800">
        <p class="text-sm text-gray-400 mb-1">API 調用</p>
        <p class="text-2xl font-bold">1.2M</p>
        <p class="text-sm text-green-400 mt-2">↑ 23.5% vs 上週</p>
      </div>
      <div class="bg-gray-900 p-6 rounded-xl border border-gray-800">
        <p class="text-sm text-gray-400 mb-1">平均延遲</p>
        <p class="text-2xl font-bold">42ms</p>
        <p class="text-sm text-green-400 mt-2">↓ 8ms 改善</p>
      </div>
      <div class="bg-gray-900 p-6 rounded-xl border border-gray-800">
        <p class="text-sm text-gray-400 mb-1">成功率</p>
        <p class="text-2xl font-bold">99.98%</p>
        <p class="text-sm text-gray-400 mt-2">SLA 達標</p>
      </div>
      <div class="bg-gray-900 p-6 rounded-xl border border-gray-800">
        <p class="text-sm text-gray-400 mb-1">活躍用戶</p>
        <p class="text-2xl font-bold">8,492</p>
        <p class="text-sm text-violet-400 mt-2">↑ 156 新用戶</p>
      </div>
    </div>

    <!-- Chart -->
    <div class="bg-gray-900 p-6 rounded-xl border border-gray-800 mb-8">
      <h2 class="text-lg font-semibold mb-4">流量監控</h2>
      <div class="h-48 flex items-end justify-between gap-1 px-4">
        ${Array.from({length: 24}, (_, i) => {
          const height = 20 + Math.random() * 70
          return `<div class="w-full bg-gradient-to-t from-violet-600 to-purple-400 rounded-t opacity-80" style="height: ${height}%"></div>`
        }).join('')}
      </div>
    </div>

    <!-- Logs -->
    <div class="bg-gray-900 rounded-xl border border-gray-800">
      <div class="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 class="font-semibold">即時日誌</h2>
        <span class="text-xs text-gray-500">自動更新</span>
      </div>
      <div class="p-4 font-mono text-sm space-y-2">
        <div class="flex gap-4">
          <span class="text-gray-500">15:42:33</span>
          <span class="text-green-400">[200]</span>
          <span class="text-gray-300">POST /api/v1/users</span>
        </div>
        <div class="flex gap-4">
          <span class="text-gray-500">15:42:31</span>
          <span class="text-green-400">[200]</span>
          <span class="text-gray-300">GET /api/v1/analytics</span>
        </div>
        <div class="flex gap-4">
          <span class="text-gray-500">15:42:28</span>
          <span class="text-yellow-400">[429]</span>
          <span class="text-gray-300">POST /api/v1/messages - Rate limited</span>
        </div>
      </div>
    </div>
  </main>
</body>
</html>
`,

  'landing-startup': `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Startup Landing Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-white">
  <!-- Nav -->
  <nav class="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg z-50 border-b border-gray-100">
    <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg"></div>
        <span class="font-bold text-xl">Startup</span>
      </div>
      <div class="flex items-center gap-8">
        <a href="#" class="text-gray-600 hover:text-gray-900">產品</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">定價</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">關於</a>
        <button class="px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800">開始使用</button>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="pt-32 pb-20 px-6">
    <div class="max-w-4xl mx-auto text-center">
      <div class="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-6">
        🚀 全新上線
      </div>
      <h1 class="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
        用 AI 打造你的<br>
        <span class="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">下一個創意</span>
      </h1>
      <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        無需程式背景，描述你的想法，AI 幫你完成從設計到部署的全部流程。
      </p>
      <div class="flex justify-center gap-4">
        <button class="px-8 py-4 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-all hover:scale-105">
          免費開始
        </button>
        <button class="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:border-gray-300">
          觀看 Demo
        </button>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="py-20 bg-gray-50">
    <div class="max-w-6xl mx-auto px-6">
      <h2 class="text-3xl font-bold text-center mb-12">為什麼選擇我們</h2>
      <div class="grid grid-cols-3 gap-8">
        <div class="bg-white p-8 rounded-2xl shadow-sm">
          <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
            <span class="text-2xl">⚡</span>
          </div>
          <h3 class="text-xl font-semibold mb-2">極速開發</h3>
          <p class="text-gray-600">從想法到上線只需要幾分鐘，AI 自動處理所有技術細節。</p>
        </div>
        <div class="bg-white p-8 rounded-2xl shadow-sm">
          <div class="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
            <span class="text-2xl">🎨</span>
          </div>
          <h3 class="text-xl font-semibold mb-2">專業設計</h3>
          <p class="text-gray-600">內建多種精美模板，確保你的產品看起來專業又現代。</p>
        </div>
        <div class="bg-white p-8 rounded-2xl shadow-sm">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <span class="text-2xl">🔒</span>
          </div>
          <h3 class="text-xl font-semibold mb-2">安全可靠</h3>
          <p class="text-gray-600">企業級安全標準，你的數據永遠安全。</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-20">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <h2 class="text-4xl font-bold mb-4">準備好開始了嗎？</h2>
      <p class="text-xl text-gray-600 mb-8">加入超過 10,000+ 創業者的行列</p>
      <button class="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-semibold hover:opacity-90 transition-all hover:scale-105">
        免費註冊，立即開始
      </button>
    </div>
  </section>
</body>
</html>
`,

  'landing-corporate': `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Corporate Website</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-white">
  <!-- Nav -->
  <nav class="border-b border-gray-100">
    <div class="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 bg-blue-900 rounded flex items-center justify-center">
          <span class="text-white font-bold">C</span>
        </div>
        <span class="font-semibold text-xl text-gray-900">Corporate</span>
      </div>
      <div class="flex items-center gap-8">
        <a href="#" class="text-gray-600 hover:text-gray-900">服務項目</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">成功案例</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">關於我們</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">聯絡我們</a>
        <button class="px-5 py-2.5 bg-blue-900 text-white rounded hover:bg-blue-800">預約諮詢</button>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="py-24 bg-gradient-to-b from-gray-50 to-white">
    <div class="max-w-6xl mx-auto px-6">
      <div class="grid grid-cols-2 gap-16 items-center">
        <div>
          <h1 class="text-5xl font-bold text-gray-900 leading-tight mb-6">
            專業的企業<br>數位轉型夥伴
          </h1>
          <p class="text-lg text-gray-600 mb-8">
            我們協助企業導入 AI 技術，優化營運流程，提升競爭力。擁有 15 年產業經驗，服務超過 500 家企業客戶。
          </p>
          <div class="flex gap-4">
            <button class="px-6 py-3 bg-blue-900 text-white rounded hover:bg-blue-800 font-medium">
              了解更多
            </button>
            <button class="px-6 py-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium">
              下載簡介
            </button>
          </div>
        </div>
        <div class="bg-gray-200 rounded-lg aspect-video"></div>
      </div>
    </div>
  </section>

  <!-- Stats -->
  <section class="py-16 bg-blue-900 text-white">
    <div class="max-w-6xl mx-auto px-6">
      <div class="grid grid-cols-4 gap-8 text-center">
        <div>
          <p class="text-4xl font-bold mb-2">500+</p>
          <p class="text-blue-200">企業客戶</p>
        </div>
        <div>
          <p class="text-4xl font-bold mb-2">15年</p>
          <p class="text-blue-200">產業經驗</p>
        </div>
        <div>
          <p class="text-4xl font-bold mb-2">98%</p>
          <p class="text-blue-200">客戶滿意度</p>
        </div>
        <div>
          <p class="text-4xl font-bold mb-2">24/7</p>
          <p class="text-blue-200">技術支援</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Services -->
  <section class="py-20">
    <div class="max-w-6xl mx-auto px-6">
      <h2 class="text-3xl font-bold text-center mb-4">服務項目</h2>
      <p class="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
        我們提供全方位的數位轉型解決方案，從策略規劃到落地執行
      </p>
      <div class="grid grid-cols-3 gap-8">
        <div class="border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <span class="text-blue-900 text-xl">📊</span>
          </div>
          <h3 class="text-xl font-semibold mb-3">數據分析</h3>
          <p class="text-gray-600">運用 AI 技術分析企業數據，挖掘商業洞察。</p>
        </div>
        <div class="border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <span class="text-blue-900 text-xl">⚙️</span>
          </div>
          <h3 class="text-xl font-semibold mb-3">流程優化</h3>
          <p class="text-gray-600">自動化重複性工作，提升營運效率。</p>
        </div>
        <div class="border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <span class="text-blue-900 text-xl">🔐</span>
          </div>
          <h3 class="text-xl font-semibold mb-3">資安顧問</h3>
          <p class="text-gray-600">建立完善的資訊安全體系，保護企業資產。</p>
        </div>
      </div>
    </div>
  </section>
</body>
</html>
`,

  'ecommerce-modern': `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern E-commerce</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-white">
  <!-- Nav -->
  <nav class="border-b border-gray-100">
    <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
      <span class="font-bold text-xl tracking-tight">STORE</span>
      <div class="flex items-center gap-8">
        <a href="#" class="text-gray-600 hover:text-gray-900">全部商品</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">新品上市</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">熱銷排行</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">特價專區</a>
      </div>
      <div class="flex items-center gap-4">
        <button class="p-2 hover:bg-gray-100 rounded-full">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </button>
        <button class="p-2 hover:bg-gray-100 rounded-full relative">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          <span class="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center">3</span>
        </button>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="bg-gray-100">
    <div class="max-w-6xl mx-auto px-6 py-20 flex items-center justify-between">
      <div class="max-w-lg">
        <p class="text-sm text-gray-500 uppercase tracking-widest mb-4">2026 春夏新品</p>
        <h1 class="text-5xl font-bold mb-6 leading-tight">極簡美學<br>重新定義</h1>
        <p class="text-gray-600 mb-8">探索我們最新系列，以永續材質打造的經典單品。</p>
        <button class="px-8 py-4 bg-black text-white hover:bg-gray-800 transition-colors">
          立即選購
        </button>
      </div>
      <div class="w-96 h-96 bg-gray-300 rounded-lg"></div>
    </div>
  </section>

  <!-- Products -->
  <section class="py-16">
    <div class="max-w-6xl mx-auto px-6">
      <h2 class="text-2xl font-bold mb-8">熱門商品</h2>
      <div class="grid grid-cols-4 gap-6">
        <div class="group cursor-pointer">
          <div class="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
            <div class="w-full h-full bg-gray-200 group-hover:scale-105 transition-transform duration-300"></div>
          </div>
          <h3 class="font-medium mb-1">極簡白 T-Shirt</h3>
          <p class="text-gray-600">NT$ 1,280</p>
        </div>
        <div class="group cursor-pointer">
          <div class="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
            <div class="w-full h-full bg-gray-200 group-hover:scale-105 transition-transform duration-300"></div>
            <span class="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded">SALE</span>
          </div>
          <h3 class="font-medium mb-1">經典牛仔褲</h3>
          <p class="text-gray-600"><span class="line-through text-gray-400">NT$ 2,980</span> NT$ 2,380</p>
        </div>
        <div class="group cursor-pointer">
          <div class="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
            <div class="w-full h-full bg-gray-200 group-hover:scale-105 transition-transform duration-300"></div>
          </div>
          <h3 class="font-medium mb-1">羊毛針織衫</h3>
          <p class="text-gray-600">NT$ 3,680</p>
        </div>
        <div class="group cursor-pointer">
          <div class="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
            <div class="w-full h-full bg-gray-200 group-hover:scale-105 transition-transform duration-300"></div>
            <span class="absolute top-2 left-2 px-2 py-1 bg-black text-white text-xs rounded">NEW</span>
          </div>
          <h3 class="font-medium mb-1">皮革托特包</h3>
          <p class="text-gray-600">NT$ 5,980</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Newsletter -->
  <section class="py-16 bg-gray-900 text-white">
    <div class="max-w-2xl mx-auto px-6 text-center">
      <h2 class="text-2xl font-bold mb-4">訂閱電子報</h2>
      <p class="text-gray-400 mb-6">搶先獲得新品資訊與專屬優惠</p>
      <div class="flex gap-4 max-w-md mx-auto">
        <input type="email" placeholder="輸入您的 Email" class="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-500">
        <button class="px-6 py-3 bg-white text-black font-medium hover:bg-gray-100">訂閱</button>
      </div>
    </div>
  </section>
</body>
</html>
`
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params

  const html = TEMPLATE_PREVIEWS[templateId]

  if (!html) {
    return new NextResponse('Template not found', { status: 404 })
  }

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
