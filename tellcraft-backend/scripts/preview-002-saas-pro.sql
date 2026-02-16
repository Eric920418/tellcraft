-- ============================================================
-- Template Preview: saas-pro (SaaS Dashboard 專業版)
-- ============================================================

INSERT INTO template_previews (template_id, html_content, version)
SELECT t.id, $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pro Dashboard — 開發者控制台</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { sans:['Inter','sans-serif'], mono:['JetBrains Mono','monospace'] },
      colors: {
        surface: { 900:'#0A0A0F', 800:'#12121A', 700:'#1A1A25', 600:'#22222F' },
        accent: { 400:'#A78BFA', 500:'#8B5CF6', 600:'#7C3AED' },
        cyan: { 400:'#22D3EE', 500:'#06B6D4' }
      }
    }
  }
}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#0A0A0F;color:#E2E8F0;overflow:hidden;height:100vh}
/* sidebar */
.nav-item{display:flex;align-items:center;gap:12px;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:500;color:#64748B;cursor:pointer;transition:all .15s;border:1px solid transparent}
.nav-item:hover{color:#CBD5E1;background:#ffffff08}
.nav-item.active{color:#A78BFA;background:rgba(139,92,246,.12);border-color:rgba(139,92,246,.25)}
.nav-item svg{width:20px;height:20px;flex-shrink:0}
/* pages */
.page{display:none;animation:fadeIn .2s ease}.page.active{display:block}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
/* buttons */
.btn-primary{background:#7C3AED;color:#fff;padding:8px 16px;border-radius:8px;font-size:14px;font-weight:500;border:none;cursor:pointer;transition:all .15s}
.btn-primary:hover{background:#6D28D9}.btn-primary:active{transform:scale(.97)}
.btn-ghost{background:transparent;color:#A78BFA;padding:8px 16px;border-radius:8px;font-size:14px;font-weight:500;border:1px solid rgba(139,92,246,.3);cursor:pointer;transition:all .15s}
.btn-ghost:hover{background:rgba(139,92,246,.1);border-color:rgba(139,92,246,.5)}.btn-ghost:active{transform:scale(.97)}
/* cards */
.card{background:#12121A;border:1px solid #1E1E2E;border-radius:12px;padding:24px;transition:border-color .15s}
.card:hover{border-color:#2A2A3A}
/* table */
.data-table{width:100%;border-collapse:collapse;font-size:14px}
.data-table th{text-align:left;padding:12px 16px;font-weight:500;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #1E1E2E}
.data-table td{padding:12px 16px;border-bottom:1px solid #12121A}
.data-table tbody tr{cursor:pointer;transition:background .1s}.data-table tbody tr:hover{background:#ffffff04}
/* badge */
.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:500}
.badge-green{background:rgba(34,197,94,.15);color:#4ADE80}
.badge-red{background:rgba(239,68,68,.15);color:#F87171}
.badge-yellow{background:rgba(234,179,8,.15);color:#FACC15}
.badge-purple{background:rgba(139,92,246,.15);color:#A78BFA}
.badge-cyan{background:rgba(34,211,238,.15);color:#22D3EE}
/* status dot */
.status-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.status-online{background:#4ADE80;box-shadow:0 0 6px rgba(74,222,128,.5)}
.status-warning{background:#FACC15;box-shadow:0 0 6px rgba(250,204,21,.4)}
/* log line */
.log-line{display:flex;gap:16px;padding:6px 0;font-family:'JetBrains Mono',monospace;font-size:13px;transition:background .1s;border-radius:4px;padding-left:8px;padding-right:8px}
.log-line:hover{background:#ffffff06}
/* tab */
.tab{padding:8px 16px;font-size:14px;font-weight:500;color:#64748B;border-bottom:2px solid transparent;cursor:pointer;transition:all .15s}
.tab:hover{color:#CBD5E1}.tab.active{color:#A78BFA;border-bottom-color:#A78BFA}
/* toggle */
.toggle{width:44px;height:24px;border-radius:12px;background:#334155;position:relative;cursor:pointer;transition:background .2s}
.toggle.on{background:#7C3AED}
.toggle::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;background:#fff;border-radius:50%;transition:transform .2s}
.toggle.on::after{transform:translateX(20px)}
/* form */
.form-input{width:100%;padding:10px 14px;border:1px solid #1E1E2E;border-radius:8px;font-size:14px;font-family:inherit;color:#E2E8F0;background:#0A0A0F;transition:border-color .15s;outline:none}
.form-input:focus{border-color:#7C3AED;box-shadow:0 0 0 3px rgba(124,58,237,.15)}
.form-label{display:block;font-size:14px;font-weight:500;color:#94A3B8;margin-bottom:6px}
/* glow line */
.glow-line{height:1px;background:linear-gradient(90deg,transparent,#7C3AED,transparent)}
/* scrollbar */
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1E1E2E;border-radius:3px}::-webkit-scrollbar-thumb:hover{background:#2A2A3A}
/* terminal */
.terminal{background:#0A0A0F;border:1px solid #1E1E2E;border-radius:8px;font-family:'JetBrains Mono',monospace;font-size:13px;overflow:hidden}
.terminal-header{display:flex;align-items:center;gap:6px;padding:10px 14px;border-bottom:1px solid #1E1E2E}
.terminal-dot{width:10px;height:10px;border-radius:50%}
</style>
</head>
<body class="flex h-screen">

<!-- ===== SIDEBAR ===== -->
<aside class="w-[260px] h-full border-r border-[#1E1E2E] bg-[#12121A] flex flex-col flex-shrink-0">
  <div class="px-6 py-5 flex items-center gap-3">
    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
    </div>
    <span class="text-lg font-semibold tracking-tight">DevConsole</span>
    <span class="ml-auto text-[10px] font-mono text-gray-500 bg-[#1A1A25] px-2 py-0.5 rounded border border-[#1E1E2E]">PRO</span>
  </div>

  <nav class="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
    <div onclick="switchPage('overview')" data-nav="overview" class="nav-item active">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
      總覽
    </div>
    <div onclick="switchPage('analytics')" data-nav="analytics" class="nav-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
      分析
    </div>
    <div onclick="switchPage('api')" data-nav="api" class="nav-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      API 管理
    </div>
    <div onclick="switchPage('settings')" data-nav="settings" class="nav-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      設定
    </div>

    <div class="pt-4 pb-2 px-2"><div class="text-[11px] font-medium text-gray-600 uppercase tracking-wider">監控</div></div>
    <div class="nav-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      即時日誌
    </div>
    <div class="nav-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      Uptime
    </div>
    <div class="nav-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
      告警規則
    </div>
  </nav>

  <!-- System Status -->
  <div class="px-4 py-4 border-t border-[#1E1E2E]">
    <div class="px-3 py-2.5 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E]">
      <div class="flex items-center gap-2 mb-2">
        <span class="status-dot status-online"></span>
        <span class="text-xs font-medium text-green-400">系統正常運行</span>
      </div>
      <div class="text-[11px] text-gray-500 font-mono">Uptime: 99.98% · Latency: 42ms</div>
    </div>
  </div>
</aside>

<!-- ===== MAIN ===== -->
<main class="flex-1 flex flex-col overflow-hidden">

  <!-- Top Bar -->
  <header class="h-14 px-8 flex items-center justify-between border-b border-[#1E1E2E] bg-[#12121A] flex-shrink-0">
    <div class="flex items-center gap-3">
      <span class="text-sm text-gray-400">環境：</span>
      <select class="bg-[#0A0A0F] border border-[#1E1E2E] text-sm rounded-md px-3 py-1.5 text-gray-300 outline-none focus:border-accent-500" style="font-family:'JetBrains Mono',monospace;font-size:12px">
        <option>Production</option>
        <option>Staging</option>
        <option>Development</option>
      </select>
    </div>
    <div class="flex items-center gap-3">
      <div class="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs border border-green-500/20 flex items-center gap-1.5">
        <span class="status-dot status-online" style="width:6px;height:6px"></span> 所有服務正常
      </div>
      <button class="p-2 rounded-lg hover:bg-white/5 transition-colors relative" onclick="alert('3 則未讀告警')">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold cursor-pointer" onclick="switchPage('settings')">E</div>
    </div>
  </header>

  <div class="flex-1 overflow-y-auto">

    <!-- ==================== PAGE: OVERVIEW ==================== -->
    <div data-page="overview" class="page active p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-semibold">開發者控制台</h1>
          <p class="text-gray-500 mt-1 text-sm">API 使用量和系統狀態一覽</p>
        </div>
        <div class="flex gap-3">
          <button class="btn-ghost" onclick="alert('檢視文件')">
            <span class="flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>API 文件</span>
          </button>
          <button class="btn-primary" onclick="alert('已複製新的 API Key')">
            <span class="flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>產生 API Key</span>
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-4 gap-5 mb-8">
        <div class="card">
          <p class="text-sm text-gray-500 mb-1">API 調用（今日）</p>
          <p class="text-2xl font-semibold font-mono">1,247,832</p>
          <div class="flex items-center gap-1 mt-2"><span class="badge badge-green">↑ 23.5%</span><span class="text-xs text-gray-600">vs 昨天</span></div>
        </div>
        <div class="card">
          <p class="text-sm text-gray-500 mb-1">平均延遲</p>
          <p class="text-2xl font-semibold font-mono">42<span class="text-sm text-gray-500 font-normal">ms</span></p>
          <div class="flex items-center gap-1 mt-2"><span class="badge badge-green">↓ 8ms</span><span class="text-xs text-gray-600">改善</span></div>
        </div>
        <div class="card">
          <p class="text-sm text-gray-500 mb-1">成功率</p>
          <p class="text-2xl font-semibold font-mono">99.98<span class="text-sm text-gray-500 font-normal">%</span></p>
          <div class="flex items-center gap-1 mt-2"><span class="badge badge-cyan">SLA 達標</span></div>
        </div>
        <div class="card">
          <p class="text-sm text-gray-500 mb-1">活躍 API Keys</p>
          <p class="text-2xl font-semibold font-mono">24</p>
          <div class="flex items-center gap-1 mt-2"><span class="badge badge-purple">+3 本週</span></div>
        </div>
      </div>

      <!-- Traffic Chart + Endpoint Stats -->
      <div class="grid grid-cols-12 gap-5 mb-8">
        <div class="col-span-8 card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold">24 小時流量</h2>
            <div class="flex"><button class="tab active" onclick="selectTab(this)">1H</button><button class="tab" onclick="selectTab(this)">6H</button><button class="tab" onclick="selectTab(this)">24H</button><button class="tab" onclick="selectTab(this)">7D</button></div>
          </div>
          <div class="flex items-end gap-1 h-40 px-2">
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:35%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:28%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:22%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:18%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:15%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:20%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:32%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:55%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:72%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:88%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:95%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-100 cursor-pointer" style="height:100%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:92%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:85%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:78%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:82%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:75%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:68%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:62%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:58%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:65%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:70%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:55%"></div>
            <div class="flex-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer" style="height:48%"></div>
          </div>
          <div class="flex justify-between mt-2 text-[10px] text-gray-600 font-mono px-2">
            <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>Now</span>
          </div>
        </div>

        <!-- Top Endpoints -->
        <div class="col-span-4 card">
          <h2 class="text-base font-semibold mb-4">熱門 Endpoint</h2>
          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="font-mono text-cyan-400">POST /api/v1/users</span><span class="text-gray-400">32%</span></div>
              <div class="w-full h-1.5 bg-[#1A1A25] rounded-full"><div class="h-1.5 bg-gradient-to-r from-accent-500 to-cyan-400 rounded-full" style="width:32%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="font-mono text-cyan-400">GET /api/v1/analytics</span><span class="text-gray-400">28%</span></div>
              <div class="w-full h-1.5 bg-[#1A1A25] rounded-full"><div class="h-1.5 bg-gradient-to-r from-accent-500 to-cyan-400 rounded-full" style="width:28%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="font-mono text-cyan-400">GET /api/v1/products</span><span class="text-gray-400">18%</span></div>
              <div class="w-full h-1.5 bg-[#1A1A25] rounded-full"><div class="h-1.5 bg-gradient-to-r from-accent-500 to-cyan-400 rounded-full" style="width:18%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="font-mono text-cyan-400">PUT /api/v1/orders</span><span class="text-gray-400">12%</span></div>
              <div class="w-full h-1.5 bg-[#1A1A25] rounded-full"><div class="h-1.5 bg-gradient-to-r from-accent-500 to-cyan-400 rounded-full" style="width:12%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="font-mono text-cyan-400">DELETE /api/v1/cache</span><span class="text-gray-400">10%</span></div>
              <div class="w-full h-1.5 bg-[#1A1A25] rounded-full"><div class="h-1.5 bg-gradient-to-r from-accent-500 to-cyan-400 rounded-full" style="width:10%"></div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Logs -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold flex items-center gap-2">
            即時日誌
            <span class="status-dot status-online" style="width:6px;height:6px"></span>
          </h2>
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-600 font-mono">自動更新 · 每 5 秒</span>
            <button class="btn-ghost text-xs py-1 px-3" onclick="alert('已暫停即時更新')">暫停</button>
          </div>
        </div>
        <div class="terminal">
          <div class="terminal-header">
            <div class="terminal-dot" style="background:#EF4444"></div>
            <div class="terminal-dot" style="background:#EAB308"></div>
            <div class="terminal-dot" style="background:#22C55E"></div>
            <span class="ml-2 text-xs text-gray-600 font-mono">production-logs</span>
          </div>
          <div class="p-3 space-y-0.5 max-h-48 overflow-y-auto">
            <div class="log-line"><span class="text-gray-600 w-20 flex-shrink-0">15:42:33</span><span class="text-green-400 w-10">[200]</span><span class="text-gray-400">POST</span><span class="text-gray-300">/api/v1/users</span><span class="ml-auto text-gray-600">12ms</span></div>
            <div class="log-line"><span class="text-gray-600 w-20 flex-shrink-0">15:42:31</span><span class="text-green-400 w-10">[200]</span><span class="text-gray-400">GET</span><span class="text-gray-300">/api/v1/analytics</span><span class="ml-auto text-gray-600">34ms</span></div>
            <div class="log-line"><span class="text-gray-600 w-20 flex-shrink-0">15:42:28</span><span class="text-yellow-400 w-10">[429]</span><span class="text-gray-400">POST</span><span class="text-yellow-200">/api/v1/messages</span><span class="ml-auto text-yellow-400">— Rate limited</span></div>
            <div class="log-line"><span class="text-gray-600 w-20 flex-shrink-0">15:42:25</span><span class="text-green-400 w-10">[200]</span><span class="text-gray-400">GET</span><span class="text-gray-300">/api/v1/products?page=2</span><span class="ml-auto text-gray-600">28ms</span></div>
            <div class="log-line"><span class="text-gray-600 w-20 flex-shrink-0">15:42:22</span><span class="text-green-400 w-10">[201]</span><span class="text-gray-400">POST</span><span class="text-gray-300">/api/v1/orders</span><span class="ml-auto text-gray-600">56ms</span></div>
            <div class="log-line"><span class="text-gray-600 w-20 flex-shrink-0">15:42:19</span><span class="text-red-400 w-10">[500]</span><span class="text-gray-400">PUT</span><span class="text-red-300">/api/v1/webhooks/config</span><span class="ml-auto text-red-400">Internal Error</span></div>
            <div class="log-line"><span class="text-gray-600 w-20 flex-shrink-0">15:42:16</span><span class="text-green-400 w-10">[200]</span><span class="text-gray-400">GET</span><span class="text-gray-300">/api/v1/users/me</span><span class="ml-auto text-gray-600">8ms</span></div>
            <div class="log-line"><span class="text-gray-600 w-20 flex-shrink-0">15:42:14</span><span class="text-green-400 w-10">[204]</span><span class="text-gray-400">DELETE</span><span class="text-gray-300">/api/v1/cache/products</span><span class="ml-auto text-gray-600">3ms</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== PAGE: ANALYTICS ==================== -->
    <div data-page="analytics" class="page p-8">
      <div class="flex items-center justify-between mb-8">
        <div><h1 class="text-2xl font-semibold">API 分析</h1><p class="text-gray-500 mt-1 text-sm">深入了解 API 使用模式和效能</p></div>
        <select class="bg-[#12121A] border border-[#1E1E2E] text-sm rounded-md px-3 py-2 text-gray-300 outline-none focus:border-accent-500">
          <option>過去 24 小時</option><option selected>過去 7 天</option><option>過去 30 天</option>
        </select>
      </div>

      <div class="grid grid-cols-3 gap-5 mb-8">
        <div class="card"><p class="text-sm text-gray-500 mb-1">總請求數</p><p class="text-2xl font-semibold font-mono">8,734,219</p><span class="badge badge-green mt-2">↑ 18%</span></div>
        <div class="card"><p class="text-sm text-gray-500 mb-1">錯誤率</p><p class="text-2xl font-semibold font-mono">0.02<span class="text-sm text-gray-500">%</span></p><span class="badge badge-green mt-2">↓ 0.01%</span></div>
        <div class="card"><p class="text-sm text-gray-500 mb-1">P95 延遲</p><p class="text-2xl font-semibold font-mono">128<span class="text-sm text-gray-500">ms</span></p><span class="badge badge-yellow mt-2">↑ 12ms</span></div>
      </div>

      <!-- Latency Distribution -->
      <div class="card mb-8">
        <h3 class="text-base font-semibold mb-4">延遲分布</h3>
        <div class="flex items-end gap-1 h-32">
          <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full bg-green-500/60 rounded-t hover:bg-green-500/80 transition cursor-pointer" style="height:20%"></div><span class="text-[10px] text-gray-600 font-mono">&lt;10</span></div>
          <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full bg-green-500/60 rounded-t hover:bg-green-500/80 transition cursor-pointer" style="height:65%"></div><span class="text-[10px] text-gray-600 font-mono">10-25</span></div>
          <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full bg-green-500/60 rounded-t hover:bg-green-500/80 transition cursor-pointer" style="height:100%"></div><span class="text-[10px] text-gray-600 font-mono">25-50</span></div>
          <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full bg-cyan-400/60 rounded-t hover:bg-cyan-400/80 transition cursor-pointer" style="height:75%"></div><span class="text-[10px] text-gray-600 font-mono">50-100</span></div>
          <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full bg-yellow-400/60 rounded-t hover:bg-yellow-400/80 transition cursor-pointer" style="height:30%"></div><span class="text-[10px] text-gray-600 font-mono">100-250</span></div>
          <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full bg-orange-400/60 rounded-t hover:bg-orange-400/80 transition cursor-pointer" style="height:12%"></div><span class="text-[10px] text-gray-600 font-mono">250-500</span></div>
          <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full bg-red-400/60 rounded-t hover:bg-red-400/80 transition cursor-pointer" style="height:4%"></div><span class="text-[10px] text-gray-600 font-mono">&gt;500</span></div>
        </div>
        <div class="text-center text-xs text-gray-600 mt-2">回應時間 (ms)</div>
      </div>

      <!-- Error Breakdown -->
      <div class="card">
        <h3 class="text-base font-semibold mb-4">錯誤類型統計</h3>
        <table class="data-table">
          <thead><tr><th>HTTP 狀態</th><th>描述</th><th>次數</th><th>佔比</th><th>趨勢</th></tr></thead>
          <tbody>
            <tr><td><span class="badge badge-yellow font-mono">429</span></td><td>Rate Limit Exceeded</td><td class="font-mono">842</td><td class="font-mono">48.2%</td><td><span class="badge badge-red">↑ 12%</span></td></tr>
            <tr><td><span class="badge badge-red font-mono">500</span></td><td>Internal Server Error</td><td class="font-mono">523</td><td class="font-mono">29.9%</td><td><span class="badge badge-green">↓ 5%</span></td></tr>
            <tr><td><span class="badge badge-yellow font-mono">408</span></td><td>Request Timeout</td><td class="font-mono">218</td><td class="font-mono">12.5%</td><td><span class="badge badge-green">↓ 8%</span></td></tr>
            <tr><td><span class="badge badge-red font-mono">502</span></td><td>Bad Gateway</td><td class="font-mono">164</td><td class="font-mono">9.4%</td><td><span class="badge badge-green">↓ 15%</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== PAGE: API ==================== -->
    <div data-page="api" class="page p-8">
      <div class="flex items-center justify-between mb-8">
        <div><h1 class="text-2xl font-semibold">API 管理</h1><p class="text-gray-500 mt-1 text-sm">管理 API Keys、Webhooks 與速率限制</p></div>
        <button class="btn-primary" onclick="alert('新 API Key 已生成：sk_live_xxxxxxxx')">
          <span class="flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>新增 API Key</span>
        </button>
      </div>

      <!-- API Keys Table -->
      <div class="card mb-8">
        <h3 class="text-base font-semibold mb-4">API Keys</h3>
        <table class="data-table">
          <thead><tr><th>名稱</th><th>Key</th><th>權限</th><th>最後使用</th><th>操作</th></tr></thead>
          <tbody>
            <tr>
              <td class="font-medium">Production Key</td>
              <td><code class="text-xs bg-[#1A1A25] px-2 py-1 rounded font-mono text-cyan-400">sk_live_****...a8f2</code></td>
              <td><span class="badge badge-green">Full Access</span></td>
              <td class="text-gray-500 text-sm">剛剛</td>
              <td class="flex gap-2"><button class="btn-ghost text-xs py-1 px-3" onclick="alert('已複製')">複製</button><button class="text-xs py-1 px-3 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition" onclick="alert('確定要撤銷此 Key？')">撤銷</button></td>
            </tr>
            <tr>
              <td class="font-medium">Staging Key</td>
              <td><code class="text-xs bg-[#1A1A25] px-2 py-1 rounded font-mono text-cyan-400">sk_test_****...7b3d</code></td>
              <td><span class="badge badge-yellow">Read Only</span></td>
              <td class="text-gray-500 text-sm">2 小時前</td>
              <td class="flex gap-2"><button class="btn-ghost text-xs py-1 px-3" onclick="alert('已複製')">複製</button><button class="text-xs py-1 px-3 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition" onclick="alert('確定要撤銷此 Key？')">撤銷</button></td>
            </tr>
            <tr>
              <td class="font-medium">CI/CD Key</td>
              <td><code class="text-xs bg-[#1A1A25] px-2 py-1 rounded font-mono text-cyan-400">sk_live_****...c1e9</code></td>
              <td><span class="badge badge-purple">Deploy Only</span></td>
              <td class="text-gray-500 text-sm">昨天</td>
              <td class="flex gap-2"><button class="btn-ghost text-xs py-1 px-3" onclick="alert('已複製')">複製</button><button class="text-xs py-1 px-3 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition" onclick="alert('確定要撤銷此 Key？')">撤銷</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Webhook Config -->
      <div class="card mb-8">
        <h3 class="text-base font-semibold mb-4">Webhooks</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-4 bg-[#0A0A0F] rounded-lg border border-[#1E1E2E]">
            <div>
              <div class="font-mono text-sm text-cyan-400">https://app.example.com/webhooks/orders</div>
              <div class="text-xs text-gray-600 mt-1">Events: order.created, order.updated, order.completed</div>
            </div>
            <div class="flex items-center gap-3">
              <span class="badge badge-green">Active</span>
              <button class="btn-ghost text-xs py-1 px-3" onclick="alert('編輯 Webhook')">編輯</button>
            </div>
          </div>
          <div class="flex items-center justify-between p-4 bg-[#0A0A0F] rounded-lg border border-[#1E1E2E]">
            <div>
              <div class="font-mono text-sm text-cyan-400">https://slack.com/webhooks/alerts</div>
              <div class="text-xs text-gray-600 mt-1">Events: alert.triggered, system.down</div>
            </div>
            <div class="flex items-center gap-3">
              <span class="badge badge-green">Active</span>
              <button class="btn-ghost text-xs py-1 px-3" onclick="alert('編輯 Webhook')">編輯</button>
            </div>
          </div>
        </div>
        <button class="mt-4 text-sm text-accent-400 hover:text-accent-300 font-medium flex items-center gap-1" onclick="alert('新增 Webhook')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          新增 Webhook
        </button>
      </div>

      <!-- Rate Limits -->
      <div class="card">
        <h3 class="text-base font-semibold mb-4">速率限制</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="p-4 bg-[#0A0A0F] rounded-lg border border-[#1E1E2E]">
            <div class="text-sm text-gray-400 mb-2">基礎方案</div>
            <div class="text-xl font-semibold font-mono">1,000<span class="text-sm text-gray-500">/min</span></div>
          </div>
          <div class="p-4 bg-[#0A0A0F] rounded-lg border border-accent-500/30">
            <div class="text-sm text-accent-400 mb-2">專業方案 (目前)</div>
            <div class="text-xl font-semibold font-mono">10,000<span class="text-sm text-gray-500">/min</span></div>
          </div>
          <div class="p-4 bg-[#0A0A0F] rounded-lg border border-[#1E1E2E]">
            <div class="text-sm text-gray-400 mb-2">企業方案</div>
            <div class="text-xl font-semibold font-mono">100,000<span class="text-sm text-gray-500">/min</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== PAGE: SETTINGS ==================== -->
    <div data-page="settings" class="page p-8">
      <div class="mb-8"><h1 class="text-2xl font-semibold">設定</h1><p class="text-gray-500 mt-1 text-sm">帳號與偏好設定</p></div>

      <div class="flex border-b border-[#1E1E2E] mb-8">
        <button class="tab active" onclick="selectSettingsTab(this,'profile')">個人資料</button>
        <button class="tab" onclick="selectSettingsTab(this,'team')">團隊成員</button>
        <button class="tab" onclick="selectSettingsTab(this,'billing')">帳單</button>
      </div>

      <div data-settings="profile" class="settings-panel">
        <div class="card max-w-2xl">
          <h3 class="text-base font-semibold mb-6">個人資料</h3>
          <div class="space-y-5">
            <div class="flex items-center gap-6 mb-4">
              <div class="w-16 h-16 rounded-full bg-gradient-to-br from-accent-500 to-cyan-400 flex items-center justify-center text-white text-xl font-bold">E</div>
              <div><button class="btn-ghost text-sm" onclick="alert('更換頭像')">更換頭像</button></div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="form-label">姓名</label><input type="text" class="form-input" value="Eric Chen"></div>
              <div><label class="form-label">Email</label><input type="email" class="form-input" value="eric@devteam.tw"></div>
            </div>
            <div><label class="form-label">公司</label><input type="text" class="form-input" value="DevTeam Inc."></div>
            <div><label class="form-label">時區</label>
              <select class="form-input"><option>Asia/Taipei (UTC+8)</option><option>Asia/Tokyo (UTC+9)</option></select>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6 pt-6 border-t border-[#1E1E2E]">
            <button class="btn-ghost" onclick="alert('已取消')">取消</button>
            <button class="btn-primary" onclick="alert('已儲存')">儲存</button>
          </div>
        </div>
      </div>

      <div data-settings="team" class="settings-panel" style="display:none">
        <div class="card max-w-2xl">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-base font-semibold">團隊成員</h3>
            <button class="btn-primary text-sm" onclick="alert('邀請成員')">邀請</button>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 rounded-lg hover:bg-white/[.02] transition">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-gradient-to-br from-accent-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">E</div>
                <div><div class="text-sm font-medium">Eric Chen</div><div class="text-xs text-gray-500">eric@devteam.tw</div></div>
              </div>
              <span class="badge badge-purple">Owner</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-lg hover:bg-white/[.02] transition">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">S</div>
                <div><div class="text-sm font-medium">Sarah Lin</div><div class="text-xs text-gray-500">sarah@devteam.tw</div></div>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge badge-cyan">Admin</span>
                <button class="text-xs text-gray-500 hover:text-red-400 transition" onclick="alert('移除成員')">移除</button>
              </div>
            </div>
            <div class="flex items-center justify-between p-3 rounded-lg hover:bg-white/[.02] transition">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">M</div>
                <div><div class="text-sm font-medium">Mike Wang</div><div class="text-xs text-gray-500">mike@devteam.tw</div></div>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge" style="background:rgba(100,116,139,.15);color:#94A3B8">Member</span>
                <button class="text-xs text-gray-500 hover:text-red-400 transition" onclick="alert('移除成員')">移除</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div data-settings="billing" class="settings-panel" style="display:none">
        <div class="card max-w-2xl">
          <h3 class="text-base font-semibold mb-6">帳單與方案</h3>
          <div class="p-4 border border-accent-500/30 bg-accent-500/5 rounded-lg mb-6">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2"><span class="font-semibold">Pro 方案</span><span class="badge badge-purple">目前</span></div>
                <p class="text-sm text-gray-500 mt-1">US$49/月 · 10,000 req/min · 5 team members</p>
              </div>
              <button class="btn-ghost text-sm" onclick="alert('升級方案')">升級</button>
            </div>
          </div>
          <div class="space-y-3">
            <div class="flex justify-between text-sm"><span class="text-gray-400">本月用量</span><span class="font-mono">8,734,219 / 10,000,000 requests</span></div>
            <div class="w-full h-2 bg-[#1A1A25] rounded-full"><div class="h-2 bg-gradient-to-r from-accent-500 to-cyan-400 rounded-full" style="width:87%"></div></div>
            <p class="text-xs text-yellow-400">已使用 87%，接近上限時將收到通知</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</main>

<script>
function switchPage(p){document.querySelectorAll('[data-page]').forEach(el=>el.classList.remove('active'));document.querySelector('[data-page="'+p+'"]').classList.add('active');document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===p))}
function selectTab(el){el.parentElement.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));el.classList.add('active')}
function selectSettingsTab(el,panel){el.parentElement.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');document.querySelectorAll('.settings-panel').forEach(p=>p.style.display='none');document.querySelector('[data-settings="'+panel+'"]').style.display='block'}
</script>
</body>
</html>$HTML$, COALESCE(tp.version, 0) + 1
FROM templates t
LEFT JOIN template_previews tp ON tp.template_id = t.id
WHERE t.slug = 'saas-pro'
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
