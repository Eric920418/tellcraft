-- ============================================================
-- Template Preview: saas-minimal (SaaS Dashboard 極簡)
-- 執行: psql -U tellcraft_user -d tellcraft -f preview-001-saas-minimal.sql
-- ============================================================

INSERT INTO template_previews (template_id, html_content, version)
SELECT t.id, $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SaaS Dashboard — 極簡</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { sans: ['IBM Plex Sans', 'sans-serif'], mono: ['IBM Plex Mono', 'monospace'] },
      colors: { primary: { 50:'#EFF6FF',100:'#DBEAFE',200:'#BFDBFE',500:'#3B82F6',600:'#2563EB',700:'#1D4ED8',800:'#1E40AF' } }
    }
  }
}
</script>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'IBM Plex Sans',sans-serif; background:#F8FAFC; color:#1E293B; }
/* sidebar nav */
.nav-item { display:flex; align-items:center; gap:12px; padding:10px 16px; border-radius:8px; font-size:14px; font-weight:500; color:#64748B; cursor:pointer; transition:all .15s; border:1px solid transparent; }
.nav-item:hover { color:#1E293B; background:#F1F5F9; }
.nav-item.active { color:#2563EB; background:#EFF6FF; border-color:#BFDBFE; }
.nav-item svg { width:20px; height:20px; flex-shrink:0; }
/* page transitions */
.page { display:none; animation:fadeIn .2s ease; }
.page.active { display:block; }
@keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
/* buttons */
.btn-primary { background:#2563EB; color:#fff; padding:8px 16px; border-radius:8px; font-size:14px; font-weight:500; border:none; cursor:pointer; transition:all .15s; }
.btn-primary:hover { background:#1D4ED8; }
.btn-primary:active { transform:scale(.97); }
.btn-secondary { background:#fff; color:#1E293B; padding:8px 16px; border-radius:8px; font-size:14px; font-weight:500; border:1px solid #E2E8F0; cursor:pointer; transition:all .15s; }
.btn-secondary:hover { background:#F8FAFC; border-color:#CBD5E1; }
.btn-secondary:active { transform:scale(.97); }
/* table */
.data-table { width:100%; border-collapse:collapse; font-size:14px; }
.data-table th { text-align:left; padding:12px 16px; font-weight:500; color:#64748B; font-size:12px; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #E2E8F0; }
.data-table td { padding:12px 16px; border-bottom:1px solid #F1F5F9; }
.data-table tbody tr { cursor:pointer; transition:background .1s; }
.data-table tbody tr:hover { background:#F8FAFC; }
/* cards */
.stat-card { background:#fff; border:1px solid #E2E8F0; border-radius:12px; padding:24px; transition:border-color .15s; }
.stat-card:hover { border-color:#CBD5E1; }
/* sparkline */
.sparkline { display:block; }
/* badge */
.badge { display:inline-flex; align-items:center; padding:2px 8px; border-radius:9999px; font-size:12px; font-weight:500; }
.badge-green { background:#DCFCE7; color:#16A34A; }
.badge-red { background:#FEE2E2; color:#DC2626; }
.badge-blue { background:#DBEAFE; color:#2563EB; }
.badge-yellow { background:#FEF3C7; color:#D97706; }
/* search */
.search-box { display:flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid #E2E8F0; border-radius:8px; background:#fff; font-size:14px; transition:border-color .15s; }
.search-box:focus-within { border-color:#2563EB; outline:2px solid #BFDBFE; }
.search-box input { border:none; outline:none; flex:1; font-family:inherit; font-size:14px; color:#1E293B; background:transparent; }
.search-box input::placeholder { color:#94A3B8; }
/* dropdown */
.dropdown { position:relative; }
.dropdown-menu { position:absolute; right:0; top:calc(100%+4px); background:#fff; border:1px solid #E2E8F0; border-radius:8px; padding:4px; min-width:200px; z-index:50; display:none; }
.dropdown-menu.open { display:block; }
.dropdown-item { display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:6px; font-size:14px; color:#1E293B; cursor:pointer; transition:background .1s; }
.dropdown-item:hover { background:#F1F5F9; }
/* notification dot */
.notif-dot { position:absolute; top:-2px; right:-2px; width:8px; height:8px; background:#EF4444; border-radius:50%; border:2px solid #fff; }
/* tabs */
.tab { padding:8px 16px; font-size:14px; font-weight:500; color:#64748B; border-bottom:2px solid transparent; cursor:pointer; transition:all .15s; }
.tab:hover { color:#1E293B; }
.tab.active { color:#2563EB; border-bottom-color:#2563EB; }
/* toggle */
.toggle { width:44px; height:24px; border-radius:12px; background:#CBD5E1; position:relative; cursor:pointer; transition:background .2s; }
.toggle.on { background:#2563EB; }
.toggle::after { content:''; position:absolute; top:2px; left:2px; width:20px; height:20px; background:#fff; border-radius:50%; transition:transform .2s; }
.toggle.on::after { transform:translateX(20px); }
/* tooltip */
[data-tooltip] { position:relative; }
[data-tooltip]:hover::after { content:attr(data-tooltip); position:absolute; bottom:calc(100%+8px); left:50%; transform:translateX(-50%); background:#1E293B; color:#fff; padding:4px 10px; border-radius:6px; font-size:12px; white-space:nowrap; z-index:100; }
/* form */
.form-input { width:100%; padding:10px 14px; border:1px solid #E2E8F0; border-radius:8px; font-size:14px; font-family:inherit; color:#1E293B; transition:border-color .15s; outline:none; }
.form-input:focus { border-color:#2563EB; box-shadow:0 0 0 3px #BFDBFE40; }
.form-label { display:block; font-size:14px; font-weight:500; color:#374151; margin-bottom:6px; }
/* scroll */
::-webkit-scrollbar { width:6px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:3px; }
::-webkit-scrollbar-thumb:hover { background:#94A3B8; }
</style>
</head>
<body class="flex h-screen overflow-hidden">

<!-- ===== SIDEBAR ===== -->
<aside class="w-[260px] h-full border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
  <!-- Logo -->
  <div class="px-6 py-5 flex items-center gap-3">
    <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
    </div>
    <span class="text-lg font-semibold text-gray-900 tracking-tight">Metric</span>
    <span class="ml-auto text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">v2.4</span>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
    <div onclick="switchPage('dashboard')" data-nav="dashboard" class="nav-item active">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
      首頁總覽
    </div>
    <div onclick="switchPage('analytics')" data-nav="analytics" class="nav-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
      數據分析
    </div>
    <div onclick="switchPage('users')" data-nav="users" class="nav-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
      用戶管理
    </div>
    <div onclick="switchPage('settings')" data-nav="settings" class="nav-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      系統設定
    </div>

    <div class="pt-4 pb-2 px-2">
      <div class="text-[11px] font-medium text-gray-400 uppercase tracking-wider">工具</div>
    </div>
    <div class="nav-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      行事曆
    </div>
    <div class="nav-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      報表匯出
    </div>
    <div class="nav-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
      技術支援
    </div>
  </nav>

  <!-- User -->
  <div class="px-4 py-4 border-t border-gray-200">
    <div class="flex items-center gap-3 px-2">
      <div class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">李</div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-gray-900 truncate">李偉明</div>
        <div class="text-xs text-gray-500 truncate">weiming@company.tw</div>
      </div>
      <button class="p-1.5 rounded-md hover:bg-gray-100 transition-colors" data-tooltip="登出">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
      </button>
    </div>
  </div>
</aside>

<!-- ===== MAIN CONTENT ===== -->
<main class="flex-1 flex flex-col overflow-hidden">

  <!-- Top Bar -->
  <header class="h-16 px-8 flex items-center justify-between border-b border-gray-200 bg-white flex-shrink-0">
    <div class="search-box w-80">
      <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <input type="text" placeholder="搜尋功能、報表、用戶...">
    </div>
    <div class="flex items-center gap-2">
      <button class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors" onclick="alert('通知功能')">
        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        <span class="notif-dot"></span>
      </button>
      <button class="p-2 rounded-lg hover:bg-gray-100 transition-colors" onclick="alert('訊息功能')">
        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
      </button>
      <div class="w-px h-6 bg-gray-200 mx-2"></div>
      <div class="dropdown">
        <button onclick="this.nextElementSibling.classList.toggle('open')" class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs">李</div>
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="dropdown-menu">
          <div class="dropdown-item" onclick="switchPage('settings')">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            個人資料
          </div>
          <div class="dropdown-item" onclick="switchPage('settings')">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            帳號設定
          </div>
          <div class="px-1 py-1"><div class="border-t border-gray-100"></div></div>
          <div class="dropdown-item" style="color:#DC2626" onclick="alert('已登出')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            登出
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Content Area -->
  <div class="flex-1 overflow-y-auto">

    <!-- ==================== PAGE: DASHBOARD ==================== -->
    <div data-page="dashboard" class="page active p-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">歡迎回來，偉明</h1>
          <p class="text-gray-500 mt-1 text-sm">以下是您今天的業務概覽 · 2026 年 2 月 16 日</p>
        </div>
        <div class="flex gap-3">
          <button class="btn-secondary" onclick="alert('報表已匯出')">
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              匯出報表
            </span>
          </button>
          <button class="btn-primary" onclick="alert('已建立新項目')">
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              新增項目
            </span>
          </button>
        </div>
      </div>

      <!-- Stats Grid - Asymmetric Layout -->
      <div class="grid grid-cols-12 gap-6 mb-8">
        <!-- Large Card -->
        <div class="col-span-4 stat-card">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-sm text-gray-500 mb-1">本月營收</p>
              <p class="text-3xl font-semibold text-gray-900 font-mono tracking-tight">NT$428,930</p>
            </div>
            <span class="badge badge-green">↑ 12.5%</span>
          </div>
          <svg class="sparkline" viewBox="0 0 200 40" fill="none" style="width:100%;height:40px">
            <path d="M0 30 L25 22 L50 28 L75 15 L100 20 L125 12 L150 18 L175 8 L200 5" stroke="#2563EB" stroke-width="2" fill="none"/>
            <path d="M0 30 L25 22 L50 28 L75 15 L100 20 L125 12 L150 18 L175 8 L200 5 L200 40 L0 40Z" fill="url(#sparkGrad1)" opacity="0.1"/>
            <defs><linearGradient id="sparkGrad1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2563EB"/><stop offset="100%" stop-color="#2563EB" stop-opacity="0"/></linearGradient></defs>
          </svg>
        </div>
        <!-- Medium Cards -->
        <div class="col-span-3 stat-card">
          <div class="flex items-start justify-between mb-3">
            <p class="text-sm text-gray-500">活躍用戶</p>
            <span class="badge badge-green">↑ 8.2%</span>
          </div>
          <p class="text-2xl font-semibold text-gray-900 font-mono mb-3">2,847</p>
          <svg class="sparkline" viewBox="0 0 120 30" fill="none" style="width:100%;height:24px">
            <path d="M0 20 L20 18 L40 22 L60 14 L80 16 L100 10 L120 8" stroke="#16A34A" stroke-width="1.5" fill="none"/>
          </svg>
        </div>
        <div class="col-span-3 stat-card">
          <div class="flex items-start justify-between mb-3">
            <p class="text-sm text-gray-500">訂單數</p>
            <span class="badge badge-red">↓ 3.1%</span>
          </div>
          <p class="text-2xl font-semibold text-gray-900 font-mono mb-3">1,294</p>
          <svg class="sparkline" viewBox="0 0 120 30" fill="none" style="width:100%;height:24px">
            <path d="M0 10 L20 12 L40 8 L60 16 L80 14 L100 20 L120 22" stroke="#DC2626" stroke-width="1.5" fill="none"/>
          </svg>
        </div>
        <div class="col-span-2 stat-card flex flex-col items-center justify-center text-center">
          <p class="text-sm text-gray-500 mb-1">轉換率</p>
          <p class="text-2xl font-semibold text-gray-900 font-mono">3.24%</p>
          <span class="badge badge-green mt-2">↑ 0.4%</span>
        </div>
      </div>

      <!-- Chart + Activity -->
      <div class="grid grid-cols-12 gap-6 mb-8">
        <!-- Revenue Chart -->
        <div class="col-span-8 bg-white border border-gray-200 rounded-xl p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-base font-semibold text-gray-900">營收趨勢</h2>
            <div class="flex">
              <button class="tab active" onclick="selectTab(this)">月</button>
              <button class="tab" onclick="selectTab(this)">季</button>
              <button class="tab" onclick="selectTab(this)">年</button>
            </div>
          </div>
          <div class="flex items-end gap-3 h-52 px-2">
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary-100 rounded-t-md transition-all hover:bg-primary-200 cursor-pointer" style="height:40%" data-tooltip="$32K"></div>
              <span class="text-[11px] text-gray-400">1月</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary-200 rounded-t-md transition-all hover:bg-primary-300 cursor-pointer" style="height:55%" data-tooltip="$41K"></div>
              <span class="text-[11px] text-gray-400">2月</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary-100 rounded-t-md transition-all hover:bg-primary-200 cursor-pointer" style="height:45%" data-tooltip="$35K"></div>
              <span class="text-[11px] text-gray-400">3月</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary-200 rounded-t-md transition-all hover:bg-primary-300 cursor-pointer" style="height:70%" data-tooltip="$52K"></div>
              <span class="text-[11px] text-gray-400">4月</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary-100 rounded-t-md transition-all hover:bg-primary-200 cursor-pointer" style="height:60%" data-tooltip="$45K"></div>
              <span class="text-[11px] text-gray-400">5月</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary-500 rounded-t-md transition-all hover:bg-primary-600 cursor-pointer" style="height:85%" data-tooltip="$63K"></div>
              <span class="text-[11px] text-gray-400">6月</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary-200 rounded-t-md transition-all hover:bg-primary-300 cursor-pointer" style="height:75%" data-tooltip="$56K"></div>
              <span class="text-[11px] text-gray-400">7月</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary-100 rounded-t-md transition-all hover:bg-primary-200 cursor-pointer" style="height:65%" data-tooltip="$48K"></div>
              <span class="text-[11px] text-gray-400">8月</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary-200 rounded-t-md transition-all hover:bg-primary-300 cursor-pointer" style="height:80%" data-tooltip="$59K"></div>
              <span class="text-[11px] text-gray-400">9月</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary-500 rounded-t-md transition-all hover:bg-primary-600 cursor-pointer" style="height:92%" data-tooltip="$68K"></div>
              <span class="text-[11px] text-gray-400">10月</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary-200 rounded-t-md transition-all hover:bg-primary-300 cursor-pointer" style="height:78%" data-tooltip="$58K"></div>
              <span class="text-[11px] text-gray-400">11月</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary-600 rounded-t-md transition-all hover:bg-primary-700 cursor-pointer" style="height:100%" data-tooltip="$72K"></div>
              <span class="text-[11px] text-gray-400">12月</span>
            </div>
          </div>
        </div>

        <!-- Activity Feed -->
        <div class="col-span-4 bg-white border border-gray-200 rounded-xl p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-4">最近動態</h2>
          <div class="space-y-4">
            <div class="flex gap-3">
              <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900">新用戶 <span class="font-medium">王小明</span> 註冊</p>
                <p class="text-xs text-gray-400 mt-0.5">3 分鐘前</p>
              </div>
            </div>
            <div class="flex gap-3">
              <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900">訂單 <span class="font-mono text-xs">#TW-4821</span> 付款成功</p>
                <p class="text-xs text-gray-400 mt-0.5">12 分鐘前</p>
              </div>
            </div>
            <div class="flex gap-3">
              <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900">伺服器 <span class="font-medium">CPU 使用率</span> 超過 80%</p>
                <p class="text-xs text-gray-400 mt-0.5">28 分鐘前</p>
              </div>
            </div>
            <div class="flex gap-3">
              <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900"><span class="font-medium">張美玲</span> 提交了客服回饋</p>
                <p class="text-xs text-gray-400 mt-0.5">1 小時前</p>
              </div>
            </div>
            <div class="flex gap-3">
              <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900">系統更新 <span class="font-mono text-xs">v2.4.1</span> 部署完成</p>
                <p class="text-xs text-gray-400 mt-0.5">2 小時前</p>
              </div>
            </div>
          </div>
          <button class="w-full mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium py-2 rounded-lg hover:bg-primary-50 transition-colors" onclick="alert('查看全部動態')">查看全部</button>
        </div>
      </div>

      <!-- Recent Orders Table -->
      <div class="bg-white border border-gray-200 rounded-xl">
        <div class="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <h2 class="text-base font-semibold text-gray-900">最近訂單</h2>
          <button class="btn-secondary text-sm" onclick="alert('查看全部訂單')">查看全部</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>訂單編號</th>
              <th>客戶</th>
              <th>商品</th>
              <th>金額</th>
              <th>狀態</th>
              <th>日期</th>
            </tr>
          </thead>
          <tbody>
            <tr onclick="alert('訂單 #TW-4821 詳情')">
              <td class="font-mono text-sm">#TW-4821</td>
              <td><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">陳</div>陳志偉</div></td>
              <td>專業方案 × 1</td>
              <td class="font-mono">NT$2,980</td>
              <td><span class="badge badge-green">已完成</span></td>
              <td class="text-gray-500">今天 14:23</td>
            </tr>
            <tr onclick="alert('訂單 #TW-4820 詳情')">
              <td class="font-mono text-sm">#TW-4820</td>
              <td><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-xs font-medium">林</div>林佳穎</div></td>
              <td>企業方案 × 1</td>
              <td class="font-mono">NT$9,800</td>
              <td><span class="badge badge-blue">處理中</span></td>
              <td class="text-gray-500">今天 11:05</td>
            </tr>
            <tr onclick="alert('訂單 #TW-4819 詳情')">
              <td class="font-mono text-sm">#TW-4819</td>
              <td><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-medium">黃</div>黃建宏</div></td>
              <td>基礎方案 × 2</td>
              <td class="font-mono">NT$1,960</td>
              <td><span class="badge badge-green">已完成</span></td>
              <td class="text-gray-500">昨天 17:42</td>
            </tr>
            <tr onclick="alert('訂單 #TW-4818 詳情')">
              <td class="font-mono text-sm">#TW-4818</td>
              <td><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-medium">吳</div>吳淑芬</div></td>
              <td>專業方案 × 1</td>
              <td class="font-mono">NT$2,980</td>
              <td><span class="badge badge-yellow">待付款</span></td>
              <td class="text-gray-500">昨天 09:18</td>
            </tr>
            <tr onclick="alert('訂單 #TW-4817 詳情')">
              <td class="font-mono text-sm">#TW-4817</td>
              <td><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-medium">張</div>張家豪</div></td>
              <td>企業方案 × 1</td>
              <td class="font-mono">NT$9,800</td>
              <td><span class="badge badge-red">已取消</span></td>
              <td class="text-gray-500">2/14 15:30</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== PAGE: ANALYTICS ==================== -->
    <div data-page="analytics" class="page p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">數據分析</h1>
          <p class="text-gray-500 mt-1 text-sm">深入了解您的業務表現</p>
        </div>
        <div class="flex gap-3">
          <select class="form-input w-auto text-sm" style="padding:8px 32px 8px 12px">
            <option>過去 7 天</option>
            <option>過去 30 天</option>
            <option selected>過去 90 天</option>
            <option>今年</option>
          </select>
          <button class="btn-primary text-sm" onclick="alert('報表已匯出')">匯出 PDF</button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-4 gap-6 mb-8">
        <div class="stat-card">
          <p class="text-sm text-gray-500 mb-1">總營收</p>
          <p class="text-2xl font-semibold font-mono">NT$1,284,500</p>
          <div class="flex items-center gap-1 mt-2"><span class="badge badge-green">↑ 18.3%</span><span class="text-xs text-gray-400">vs 上季</span></div>
        </div>
        <div class="stat-card">
          <p class="text-sm text-gray-500 mb-1">新增用戶</p>
          <p class="text-2xl font-semibold font-mono">1,247</p>
          <div class="flex items-center gap-1 mt-2"><span class="badge badge-green">↑ 24.1%</span><span class="text-xs text-gray-400">vs 上季</span></div>
        </div>
        <div class="stat-card">
          <p class="text-sm text-gray-500 mb-1">客單價</p>
          <p class="text-2xl font-semibold font-mono">NT$3,420</p>
          <div class="flex items-center gap-1 mt-2"><span class="badge badge-red">↓ 5.2%</span><span class="text-xs text-gray-400">vs 上季</span></div>
        </div>
        <div class="stat-card">
          <p class="text-sm text-gray-500 mb-1">續約率</p>
          <p class="text-2xl font-semibold font-mono">87.6%</p>
          <div class="flex items-center gap-1 mt-2"><span class="badge badge-green">↑ 2.1%</span><span class="text-xs text-gray-400">vs 上季</span></div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-2 gap-6 mb-8">
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-4">流量來源</h3>
          <div class="flex items-center gap-8">
            <!-- Donut Chart SVG -->
            <svg viewBox="0 0 120 120" style="width:140px;height:140px">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" stroke-width="12"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#2563EB" stroke-width="12" stroke-dasharray="125.6 188.5" stroke-dashoffset="-47.1" stroke-linecap="round"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#3B82F6" stroke-width="12" stroke-dasharray="78.5 235.6" stroke-dashoffset="-172.8" stroke-linecap="round"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#93C5FD" stroke-width="12" stroke-dasharray="47.1 267" stroke-dashoffset="-251.3" stroke-linecap="round"/>
              <text x="60" y="56" text-anchor="middle" font-size="18" font-weight="600" fill="#1E293B">2,847</text>
              <text x="60" y="72" text-anchor="middle" font-size="11" fill="#64748B">用戶</text>
            </svg>
            <div class="flex-1 space-y-3">
              <div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-primary-600"></div><span class="text-sm">直接訪問</span></div><span class="text-sm font-mono font-medium">40%</span></div>
              <div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-primary-500"></div><span class="text-sm">搜尋引擎</span></div><span class="text-sm font-mono font-medium">25%</span></div>
              <div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-primary-300"></div><span class="text-sm">社群媒體</span></div><span class="text-sm font-mono font-medium">15%</span></div>
              <div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-gray-200"></div><span class="text-sm">其他</span></div><span class="text-sm font-mono font-medium">20%</span></div>
            </div>
          </div>
        </div>
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-4">用戶增長</h3>
          <svg viewBox="0 0 400 160" style="width:100%;height:160px">
            <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2563EB" stop-opacity="0.15"/><stop offset="100%" stop-color="#2563EB" stop-opacity="0"/></linearGradient></defs>
            <path d="M0 140 L33 120 L66 125 L100 100 L133 108 L166 85 L200 90 L233 65 L266 70 L300 45 L333 50 L366 30 L400 20" fill="none" stroke="#2563EB" stroke-width="2"/>
            <path d="M0 140 L33 120 L66 125 L100 100 L133 108 L166 85 L200 90 L233 65 L266 70 L300 45 L333 50 L366 30 L400 20 L400 160 L0 160Z" fill="url(#areaGrad)"/>
            <!-- grid lines -->
            <line x1="0" y1="40" x2="400" y2="40" stroke="#F1F5F9" stroke-width="1"/>
            <line x1="0" y1="80" x2="400" y2="80" stroke="#F1F5F9" stroke-width="1"/>
            <line x1="0" y1="120" x2="400" y2="120" stroke="#F1F5F9" stroke-width="1"/>
          </svg>
          <div class="flex justify-between mt-2 text-[11px] text-gray-400">
            <span>1月</span><span>3月</span><span>5月</span><span>7月</span><span>9月</span><span>11月</span>
          </div>
        </div>
      </div>

      <!-- Top Products Table -->
      <div class="bg-white border border-gray-200 rounded-xl">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-base font-semibold text-gray-900">熱門方案</h3>
        </div>
        <table class="data-table">
          <thead><tr><th>方案名稱</th><th>訂閱數</th><th>營收</th><th>成長</th><th>佔比</th></tr></thead>
          <tbody>
            <tr><td class="font-medium">企業方案</td><td class="font-mono">342</td><td class="font-mono">NT$3,351,600</td><td><span class="badge badge-green">↑ 22%</span></td><td><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-primary-600 h-2 rounded-full" style="width:48%"></div></div></td></tr>
            <tr><td class="font-medium">專業方案</td><td class="font-mono">518</td><td class="font-mono">NT$1,543,640</td><td><span class="badge badge-green">↑ 15%</span></td><td><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-primary-500 h-2 rounded-full" style="width:32%"></div></div></td></tr>
            <tr><td class="font-medium">基礎方案</td><td class="font-mono">847</td><td class="font-mono">NT$830,060</td><td><span class="badge badge-red">↓ 3%</span></td><td><div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-primary-300 h-2 rounded-full" style="width:20%"></div></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== PAGE: USERS ==================== -->
    <div data-page="users" class="page p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">用戶管理</h1>
          <p class="text-gray-500 mt-1 text-sm">管理所有平台用戶和權限</p>
        </div>
        <button class="btn-primary" onclick="alert('邀請用戶功能')">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
            邀請用戶
          </span>
        </button>
      </div>

      <!-- Filters -->
      <div class="flex gap-4 mb-6">
        <div class="search-box flex-1 max-w-sm">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" placeholder="搜尋用戶名稱或 Email...">
        </div>
        <select class="form-input w-auto text-sm" style="padding:8px 32px 8px 12px">
          <option>所有角色</option>
          <option>管理員</option>
          <option>一般用戶</option>
        </select>
        <select class="form-input w-auto text-sm" style="padding:8px 32px 8px 12px">
          <option>所有狀態</option>
          <option>啟用中</option>
          <option>已停用</option>
        </select>
      </div>

      <!-- Users Table -->
      <div class="bg-white border border-gray-200 rounded-xl">
        <table class="data-table">
          <thead>
            <tr>
              <th><input type="checkbox" class="rounded cursor-pointer"></th>
              <th>用戶</th>
              <th>角色</th>
              <th>方案</th>
              <th>狀態</th>
              <th>最近登入</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type="checkbox" class="rounded cursor-pointer"></td>
              <td><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">陳</div><div><div class="font-medium">陳志偉</div><div class="text-xs text-gray-500">chihwei@example.com</div></div></div></td>
              <td><span class="badge badge-blue">管理員</span></td>
              <td>企業方案</td>
              <td><div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-green-500"></div><span class="text-sm">啟用中</span></div></td>
              <td class="text-gray-500 text-sm">剛剛</td>
              <td><button class="btn-secondary text-xs py-1 px-3" onclick="alert('編輯用戶：陳志偉')">編輯</button></td>
            </tr>
            <tr>
              <td><input type="checkbox" class="rounded cursor-pointer"></td>
              <td><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-medium text-sm">林</div><div><div class="font-medium">林佳穎</div><div class="text-xs text-gray-500">jiaying@example.com</div></div></div></td>
              <td><span class="badge" style="background:#F1F5F9;color:#64748B">用戶</span></td>
              <td>專業方案</td>
              <td><div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-green-500"></div><span class="text-sm">啟用中</span></div></td>
              <td class="text-gray-500 text-sm">2 小時前</td>
              <td><button class="btn-secondary text-xs py-1 px-3" onclick="alert('編輯用戶：林佳穎')">編輯</button></td>
            </tr>
            <tr>
              <td><input type="checkbox" class="rounded cursor-pointer"></td>
              <td><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium text-sm">黃</div><div><div class="font-medium">黃建宏</div><div class="text-xs text-gray-500">jianhong@example.com</div></div></div></td>
              <td><span class="badge" style="background:#F1F5F9;color:#64748B">用戶</span></td>
              <td>基礎方案</td>
              <td><div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-green-500"></div><span class="text-sm">啟用中</span></div></td>
              <td class="text-gray-500 text-sm">昨天</td>
              <td><button class="btn-secondary text-xs py-1 px-3" onclick="alert('編輯用戶：黃建宏')">編輯</button></td>
            </tr>
            <tr>
              <td><input type="checkbox" class="rounded cursor-pointer"></td>
              <td><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium text-sm">吳</div><div><div class="font-medium">吳淑芬</div><div class="text-xs text-gray-500">shufen@example.com</div></div></div></td>
              <td><span class="badge" style="background:#F1F5F9;color:#64748B">用戶</span></td>
              <td>專業方案</td>
              <td><div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-gray-300"></div><span class="text-sm text-gray-400">已停用</span></div></td>
              <td class="text-gray-500 text-sm">3 天前</td>
              <td><button class="btn-secondary text-xs py-1 px-3" onclick="alert('編輯用戶：吳淑芬')">編輯</button></td>
            </tr>
            <tr>
              <td><input type="checkbox" class="rounded cursor-pointer"></td>
              <td><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium text-sm">張</div><div><div class="font-medium">張家豪</div><div class="text-xs text-gray-500">jiahao@example.com</div></div></div></td>
              <td><span class="badge badge-blue">管理員</span></td>
              <td>企業方案</td>
              <td><div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-green-500"></div><span class="text-sm">啟用中</span></div></td>
              <td class="text-gray-500 text-sm">5 小時前</td>
              <td><button class="btn-secondary text-xs py-1 px-3" onclick="alert('編輯用戶：張家豪')">編輯</button></td>
            </tr>
          </tbody>
        </table>
        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <span class="text-sm text-gray-500">顯示 1-5 / 共 2,847 位用戶</span>
          <div class="flex gap-1">
            <button class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed">上一頁</button>
            <button class="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg">1</button>
            <button class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">2</button>
            <button class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">3</button>
            <span class="px-2 py-1.5 text-sm text-gray-400">...</span>
            <button class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">570</button>
            <button class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">下一頁</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== PAGE: SETTINGS ==================== -->
    <div data-page="settings" class="page p-8">
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">系統設定</h1>
        <p class="text-gray-500 mt-1 text-sm">管理您的帳號和應用程式偏好設定</p>
      </div>

      <!-- Settings Tabs -->
      <div class="flex border-b border-gray-200 mb-8">
        <button class="tab active" onclick="selectSettingsTab(this, 'profile')">個人資料</button>
        <button class="tab" onclick="selectSettingsTab(this, 'notifications')">通知設定</button>
        <button class="tab" onclick="selectSettingsTab(this, 'security')">安全性</button>
        <button class="tab" onclick="selectSettingsTab(this, 'billing')">帳單方案</button>
      </div>

      <!-- Profile Settings -->
      <div data-settings="profile" class="settings-panel">
        <div class="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
          <h3 class="text-base font-semibold text-gray-900 mb-6">基本資料</h3>
          <div class="space-y-5">
            <div class="flex items-center gap-6 mb-6">
              <div class="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-2xl">李</div>
              <div>
                <button class="btn-secondary text-sm" onclick="alert('更換頭像')">更換頭像</button>
                <p class="text-xs text-gray-400 mt-1.5">JPG、PNG，最大 2MB</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="form-label">姓名</label><input type="text" class="form-input" value="李偉明"></div>
              <div><label class="form-label">顯示名稱</label><input type="text" class="form-input" value="偉明"></div>
            </div>
            <div><label class="form-label">Email</label><input type="email" class="form-input" value="weiming@company.tw"></div>
            <div><label class="form-label">電話</label><input type="tel" class="form-input" value="0912-345-678"></div>
            <div><label class="form-label">公司名稱</label><input type="text" class="form-input" value="創新科技股份有限公司"></div>
            <div><label class="form-label">個人簡介</label><textarea class="form-input" rows="3" placeholder="簡短介紹自己...">資深產品經理，專注於 SaaS 產品開發和用戶體驗優化。</textarea></div>
          </div>
          <div class="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
            <button class="btn-secondary" onclick="alert('已取消')">取消</button>
            <button class="btn-primary" onclick="alert('資料已儲存')">儲存變更</button>
          </div>
        </div>
      </div>

      <!-- Notifications Settings -->
      <div data-settings="notifications" class="settings-panel" style="display:none">
        <div class="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
          <h3 class="text-base font-semibold text-gray-900 mb-6">通知偏好</h3>
          <div class="space-y-5">
            <div class="flex items-center justify-between py-2">
              <div><div class="font-medium text-sm">Email 通知</div><div class="text-xs text-gray-500 mt-0.5">接收訂單和系統更新通知</div></div>
              <div class="toggle on" onclick="this.classList.toggle('on')"></div>
            </div>
            <div class="border-t border-gray-100"></div>
            <div class="flex items-center justify-between py-2">
              <div><div class="font-medium text-sm">瀏覽器推播</div><div class="text-xs text-gray-500 mt-0.5">即時推播重要事件</div></div>
              <div class="toggle on" onclick="this.classList.toggle('on')"></div>
            </div>
            <div class="border-t border-gray-100"></div>
            <div class="flex items-center justify-between py-2">
              <div><div class="font-medium text-sm">行銷郵件</div><div class="text-xs text-gray-500 mt-0.5">新功能和促銷資訊</div></div>
              <div class="toggle" onclick="this.classList.toggle('on')"></div>
            </div>
            <div class="border-t border-gray-100"></div>
            <div class="flex items-center justify-between py-2">
              <div><div class="font-medium text-sm">週報摘要</div><div class="text-xs text-gray-500 mt-0.5">每週一封業務數據摘要</div></div>
              <div class="toggle on" onclick="this.classList.toggle('on')"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div data-settings="security" class="settings-panel" style="display:none">
        <div class="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
          <h3 class="text-base font-semibold text-gray-900 mb-6">安全性設定</h3>
          <div class="space-y-5">
            <div><label class="form-label">目前密碼</label><input type="password" class="form-input" placeholder="輸入目前密碼"></div>
            <div><label class="form-label">新密碼</label><input type="password" class="form-input" placeholder="輸入新密碼"></div>
            <div><label class="form-label">確認新密碼</label><input type="password" class="form-input" placeholder="再次輸入新密碼"></div>
          </div>
          <div class="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
            <button class="btn-primary" onclick="alert('密碼已更新')">更新密碼</button>
          </div>
          <div class="mt-8 pt-6 border-t border-gray-100">
            <h4 class="font-medium text-sm mb-4">兩步驟驗證</h4>
            <div class="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <div><div class="text-sm font-medium text-green-800">已啟用</div><div class="text-xs text-green-600">透過 Authenticator App 驗證</div></div>
              </div>
              <button class="btn-secondary text-xs" onclick="alert('管理 2FA')">管理</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Billing Settings -->
      <div data-settings="billing" class="settings-panel" style="display:none">
        <div class="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
          <h3 class="text-base font-semibold text-gray-900 mb-6">帳單與方案</h3>
          <div class="p-4 border border-primary-200 bg-primary-50 rounded-lg mb-6">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2"><span class="font-semibold">企業方案</span><span class="badge badge-blue">目前方案</span></div>
                <p class="text-sm text-gray-500 mt-1">NT$9,800/月 · 下次扣款 2026/03/16</p>
              </div>
              <button class="btn-secondary text-sm" onclick="alert('方案管理')">管理方案</button>
            </div>
          </div>
          <h4 class="font-medium text-sm mb-3">付款方式</h4>
          <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-10 h-7 bg-gray-100 rounded flex items-center justify-center text-xs font-mono font-bold text-gray-600">VISA</div>
              <div><div class="text-sm font-medium">**** **** **** 4242</div><div class="text-xs text-gray-500">到期 12/2027</div></div>
            </div>
            <button class="btn-secondary text-xs" onclick="alert('更換付款方式')">更換</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</main>

<script>
// Page Navigation
function switchPage(page) {
  document.querySelectorAll('[data-page]').forEach(el => { el.classList.remove('active'); });
  document.querySelector('[data-page="'+page+'"]').classList.add('active');
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.classList.toggle('active', el.dataset.nav === page);
  });
  // Close any open dropdown
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
}

// Tab Selection (chart tabs)
function selectTab(el) {
  el.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

// Settings Tab
function selectSettingsTab(el, panel) {
  el.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.settings-panel').forEach(p => p.style.display = 'none');
  document.querySelector('[data-settings="'+panel+'"]').style.display = 'block';
}

// Close dropdown on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
  }
});
</script>
</body>
</html>$HTML$, COALESCE(tp.version, 0) + 1
FROM templates t
LEFT JOIN template_previews tp ON tp.template_id = t.id
WHERE t.slug = 'saas-minimal'
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
