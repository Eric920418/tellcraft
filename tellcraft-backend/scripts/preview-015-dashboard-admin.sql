INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '9aadd1f6-30c9-410b-95fa-510c824251f1',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Dashboard - Permission Management</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
          400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
          800: '#1e293b', 900: '#0f172a'
        },
        indigo: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
          800: '#3730a3', 900: '#312e81'
        }
      },
      fontFamily: {
        display: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'IBM Plex Sans', sans-serif;
    color: #1e293b;
    background: #f8fafc;
  }

  /* Toast */
  .toast {
    position: fixed; bottom: 1.5rem; right: 1.5rem;
    background: #1e293b; color: #fff;
    padding: 0.75rem 1.25rem; border-radius: 6px;
    font-size: 0.8rem; font-weight: 500; font-family: 'IBM Plex Sans', sans-serif;
    z-index: 9999; transform: translateY(120%); opacity: 0;
    transition: all 0.3s ease; border: 1px solid #334155;
  }
  .toast.show { transform: translateY(0); opacity: 1; }

  /* Tab styling */
  .nav-tab {
    position: relative;
    transition: color 0.15s ease;
  }
  .nav-tab::after {
    content: '';
    position: absolute; bottom: -1px; left: 0; right: 0;
    height: 2px; background: transparent;
    transition: background 0.15s ease;
  }
  .nav-tab.active { color: #4f46e5; }
  .nav-tab.active::after { background: #4f46e5; }
  .nav-tab:not(.active):hover { color: #334155; }

  /* Table row */
  .table-row { transition: background 0.1s ease; }
  .table-row:hover { background: #f8fafc; }

  /* Permission dot */
  .perm-dot {
    width: 12px; height: 12px; border-radius: 50%;
    transition: transform 0.15s ease;
  }
  .perm-dot:hover { transform: scale(1.3); }
  .perm-granted { background: #4f46e5; }
  .perm-denied { background: transparent; border: 2px solid #cbd5e1; }

  /* Scroll reveal */
  .reveal-section {
    opacity: 0; transform: translateY(12px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .reveal-section.visible {
    opacity: 1; transform: translateY(0);
  }

  /* Badge */
  .badge {
    font-size: 11px; padding: 2px 10px; border-radius: 9999px;
    font-weight: 500; font-family: 'IBM Plex Sans', sans-serif;
  }

  /* Page visibility */
  .page { display: none; }
  .page.active { display: block; }

  /* Action button (border-based) */
  .btn-outline {
    border: 1px solid #e2e8f0; background: #fff; color: #334155;
    padding: 0.4rem 0.85rem; border-radius: 6px; font-size: 0.8rem;
    font-weight: 500; transition: border-color 0.15s ease, color 0.15s ease;
    cursor: pointer; font-family: 'IBM Plex Sans', sans-serif;
  }
  .btn-outline:hover { border-color: #4f46e5; color: #4f46e5; }

  .btn-primary-outline {
    border: 1px solid #4f46e5; background: #fff; color: #4f46e5;
    padding: 0.4rem 0.85rem; border-radius: 6px; font-size: 0.8rem;
    font-weight: 500; transition: background 0.15s ease;
    cursor: pointer; font-family: 'IBM Plex Sans', sans-serif;
  }
  .btn-primary-outline:hover { background: #eef2ff; }

  @media (max-width: 768px) {
    .hide-mobile { display: none; }
  }
</style>
</head>
<body>

<div id="toast" class="toast"></div>

<div class="min-h-screen flex flex-col">
  <!-- Top Navigation Bar -->
  <header class="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
    <div class="flex items-center gap-8">
      <!-- Logo -->
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 border-2 border-indigo-600 rounded flex items-center justify-center">
          <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
        </div>
        <span class="font-display font-semibold text-slate-800 text-sm tracking-tight">AdminPanel</span>
      </div>
      <!-- Horizontal Tabs -->
      <nav class="flex items-center gap-1 h-14 hide-mobile">
        <a href="#" class="nav-tab active flex items-center gap-1.5 px-3 h-full text-sm font-medium cursor-pointer" onclick="switchTab('dashboard', this)" data-tab="dashboard">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z"/></svg>
          Dashboard
        </a>
        <a href="#" class="nav-tab flex items-center gap-1.5 px-3 h-full text-sm font-medium text-slate-400 cursor-pointer" onclick="switchTab('users', this)" data-tab="users">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
          Users
        </a>
        <a href="#" class="nav-tab flex items-center gap-1.5 px-3 h-full text-sm font-medium text-slate-400 cursor-pointer" onclick="switchTab('roles', this)" data-tab="roles">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"/></svg>
          Roles
        </a>
        <a href="#" class="nav-tab flex items-center gap-1.5 px-3 h-full text-sm font-medium text-slate-400 cursor-pointer" onclick="switchTab('settings', this)" data-tab="settings">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          Settings
        </a>
        <a href="#" class="nav-tab flex items-center gap-1.5 px-3 h-full text-sm font-medium text-slate-400 cursor-pointer" onclick="switchTab('logs', this)" data-tab="logs">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Logs
        </a>
      </nav>
    </div>
    <!-- Right side -->
    <div class="flex items-center gap-3">
      <button class="btn-outline hide-mobile" onclick="showToast('Exporting system report...')">
        <span class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
          Export
        </span>
      </button>
      <button class="relative cursor-pointer" onclick="showToast('2 new notifications')">
        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>
        <div class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-600 rounded-full"></div>
      </button>
      <div class="w-8 h-8 border-2 border-slate-200 rounded-full flex items-center justify-center text-slate-600 text-xs font-semibold font-mono cursor-pointer" onclick="showToast('Account settings')">SA</div>
    </div>
  </header>

  <!-- Breadcrumb -->
  <div class="bg-white border-b border-slate-100 px-6 py-2.5">
    <nav class="flex items-center gap-2 text-xs font-mono text-slate-400">
      <span class="cursor-pointer hover:text-slate-600" onclick="switchTab('dashboard', document.querySelector('[data-tab=dashboard]'))">Dashboard</span>
      <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
      <span id="breadcrumb-current" class="text-slate-700">Overview</span>
    </nav>
  </div>

  <!-- Content Area -->
  <main class="flex-1 overflow-y-auto">
    <!-- Dashboard Page -->
    <div id="page-dashboard" class="page active">
      <div class="max-w-7xl mx-auto px-6 py-6">
        <!-- Stats Row -->
        <div class="reveal-section grid grid-cols-2 lg:grid-cols-4 gap-0 border border-slate-200 rounded-lg overflow-hidden mb-8">
          <div class="p-5 bg-white border-r border-slate-200 last:border-r-0">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Users</span>
              <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
            </div>
            <div class="text-2xl font-display font-bold text-slate-800">2,847</div>
            <div class="text-xs text-slate-400 mt-1 font-mono">+124 this month</div>
          </div>
          <div class="p-5 bg-white border-r border-slate-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono text-slate-400 uppercase tracking-wider">Active</span>
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div class="text-2xl font-display font-bold text-slate-800">2,314</div>
            <div class="text-xs text-emerald-500 mt-1 font-mono">81.3% of total</div>
          </div>
          <div class="p-5 bg-white border-r border-slate-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono text-slate-400 uppercase tracking-wider">Pending</span>
              <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div class="text-2xl font-display font-bold text-slate-800">498</div>
            <div class="text-xs text-amber-500 mt-1 font-mono">Awaiting review</div>
          </div>
          <div class="p-5 bg-white">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono text-slate-400 uppercase tracking-wider">Banned</span>
              <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
            </div>
            <div class="text-2xl font-display font-bold text-slate-800">35</div>
            <div class="text-xs text-red-400 mt-1 font-mono">3 this week</div>
          </div>
        </div>

        <!-- Permission Matrix (SIGNATURE ELEMENT) -->
        <div class="reveal-section mb-8">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-sm font-display font-semibold text-slate-800">Permission Matrix</h2>
              <p class="text-xs text-slate-400 mt-0.5 font-mono">Role-based access control overview</p>
            </div>
            <button class="btn-primary-outline" onclick="showToast('Opening permission editor...')">
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                Edit Permissions
              </span>
            </button>
          </div>
          <div class="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-200">
                  <th class="text-left text-xs font-mono font-medium text-slate-400 uppercase tracking-wider px-5 py-3 bg-slate-50 w-40">Role</th>
                  <th class="text-center text-xs font-mono font-medium text-slate-400 uppercase tracking-wider px-4 py-3 bg-slate-50">Read</th>
                  <th class="text-center text-xs font-mono font-medium text-slate-400 uppercase tracking-wider px-4 py-3 bg-slate-50">Write</th>
                  <th class="text-center text-xs font-mono font-medium text-slate-400 uppercase tracking-wider px-4 py-3 bg-slate-50">Delete</th>
                  <th class="text-center text-xs font-mono font-medium text-slate-400 uppercase tracking-wider px-4 py-3 bg-slate-50">Deploy</th>
                  <th class="text-center text-xs font-mono font-medium text-slate-400 uppercase tracking-wider px-4 py-3 bg-slate-50">Manage</th>
                  <th class="text-center text-xs font-mono font-medium text-slate-400 uppercase tracking-wider px-4 py-3 bg-slate-50 hide-mobile">Audit</th>
                  <th class="text-center text-xs font-mono font-medium text-slate-400 uppercase tracking-wider px-4 py-3 bg-slate-50 hide-mobile">Billing</th>
                </tr>
              </thead>
              <tbody>
                <!-- Admin -->
                <tr class="border-b border-slate-100 table-row cursor-pointer" onclick="showToast('Editing Admin role permissions...')">
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-2.5">
                      <div class="w-2 h-2 rounded-full bg-indigo-600"></div>
                      <span class="text-sm font-display font-semibold text-slate-800">Admin</span>
                    </div>
                  </td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-granted" title="Granted"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-granted" title="Granted"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-granted" title="Granted"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-granted" title="Granted"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-granted" title="Granted"></div></div></td>
                  <td class="text-center px-4 py-3.5 hide-mobile"><div class="flex justify-center"><div class="perm-dot perm-granted" title="Granted"></div></div></td>
                  <td class="text-center px-4 py-3.5 hide-mobile"><div class="flex justify-center"><div class="perm-dot perm-granted" title="Granted"></div></div></td>
                </tr>
                <!-- Editor -->
                <tr class="border-b border-slate-100 table-row cursor-pointer" onclick="showToast('Editing Editor role permissions...')">
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-2.5">
                      <div class="w-2 h-2 rounded-full bg-violet-500"></div>
                      <span class="text-sm font-display font-semibold text-slate-800">Editor</span>
                    </div>
                  </td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-granted" title="Granted"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-granted" title="Granted"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-granted" title="Granted"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                  <td class="text-center px-4 py-3.5 hide-mobile"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                  <td class="text-center px-4 py-3.5 hide-mobile"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                </tr>
                <!-- Viewer -->
                <tr class="border-b border-slate-100 table-row cursor-pointer" onclick="showToast('Editing Viewer role permissions...')">
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-2.5">
                      <div class="w-2 h-2 rounded-full bg-slate-400"></div>
                      <span class="text-sm font-display font-semibold text-slate-800">Viewer</span>
                    </div>
                  </td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-granted" title="Granted"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                  <td class="text-center px-4 py-3.5 hide-mobile"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                  <td class="text-center px-4 py-3.5 hide-mobile"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                </tr>
                <!-- Guest -->
                <tr class="table-row cursor-pointer" onclick="showToast('Editing Guest role permissions...')">
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-2.5">
                      <div class="w-2 h-2 rounded-full bg-slate-300"></div>
                      <span class="text-sm font-display font-semibold text-slate-800">Guest</span>
                    </div>
                  </td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-granted" title="Granted"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                  <td class="text-center px-4 py-3.5"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                  <td class="text-center px-4 py-3.5 hide-mobile"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                  <td class="text-center px-4 py-3.5 hide-mobile"><div class="flex justify-center"><div class="perm-dot perm-denied" title="Denied"></div></div></td>
                </tr>
              </tbody>
            </table>
            <!-- Legend -->
            <div class="flex items-center gap-6 px-5 py-3 border-t border-slate-100 bg-slate-50">
              <div class="flex items-center gap-2">
                <div class="perm-dot perm-granted" style="width:10px;height:10px;"></div>
                <span class="text-xs font-mono text-slate-500">Granted</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="perm-dot perm-denied" style="width:10px;height:10px;"></div>
                <span class="text-xs font-mono text-slate-500">Denied</span>
              </div>
              <span class="text-xs font-mono text-slate-300 ml-auto">4 roles / 7 permissions</span>
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div class="reveal-section">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-sm font-display font-semibold text-slate-800">User Management</h2>
              <p class="text-xs text-slate-400 mt-0.5 font-mono">2,847 total accounts</p>
            </div>
            <div class="flex items-center gap-2">
              <div class="relative hide-mobile">
                <svg class="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                <input type="text" placeholder="Search users..." class="pl-8 pr-4 py-2 border border-slate-200 rounded-md text-xs font-mono w-52 outline-none focus:border-indigo-300 bg-white">
              </div>
              <button class="btn-outline hide-mobile" onclick="showToast('Filter options opened')">
                <span class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"/></svg>
                  Filter
                </span>
              </button>
              <button class="btn-primary-outline" onclick="showToast('Add user dialog opened')">
                <span class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
                  Add User
                </span>
              </button>
            </div>
          </div>
          <div class="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-slate-200">
                    <th class="text-left text-xs font-mono font-medium text-slate-400 uppercase tracking-wider px-5 py-3 bg-slate-50">User</th>
                    <th class="text-left text-xs font-mono font-medium text-slate-400 uppercase tracking-wider px-5 py-3 bg-slate-50">Role</th>
                    <th class="text-left text-xs font-mono font-medium text-slate-400 uppercase tracking-wider px-5 py-3 bg-slate-50">Status</th>
                    <th class="text-left text-xs font-mono font-medium text-slate-400 uppercase tracking-wider px-5 py-3 bg-slate-50 hide-mobile">Last Active</th>
                    <th class="text-left text-xs font-mono font-medium text-slate-400 uppercase tracking-wider px-5 py-3 bg-slate-50 hide-mobile">User ID</th>
                    <th class="text-right text-xs font-mono font-medium text-slate-400 uppercase tracking-wider px-5 py-3 bg-slate-50">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="table-row border-b border-slate-100 cursor-pointer" onclick="showToast('Viewing Sarah Chen profile...')">
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 border-2 border-indigo-200 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 font-mono bg-indigo-50">SC</div>
                        <div>
                          <div class="text-sm font-display font-medium text-slate-800">Sarah Chen</div>
                          <div class="text-xs font-mono text-slate-400">s.chen@company.io</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-3.5"><span class="badge border border-indigo-200 text-indigo-700 bg-indigo-50">Admin</span></td>
                    <td class="px-5 py-3.5"><span class="badge border border-emerald-200 text-emerald-700 bg-emerald-50">Active</span></td>
                    <td class="px-5 py-3.5 text-xs font-mono text-slate-400 hide-mobile">2 min ago</td>
                    <td class="px-5 py-3.5 text-xs font-mono text-slate-300 hide-mobile">usr_01H8X</td>
                    <td class="px-5 py-3.5 text-right">
                      <button class="btn-outline" onclick="event.stopPropagation(); showToast('Editing Sarah Chen...')">Edit</button>
                    </td>
                  </tr>
                  <tr class="table-row border-b border-slate-100 cursor-pointer" onclick="showToast('Viewing Marcus Lee profile...')">
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 border-2 border-violet-200 rounded-full flex items-center justify-center text-xs font-bold text-violet-600 font-mono bg-violet-50">ML</div>
                        <div>
                          <div class="text-sm font-display font-medium text-slate-800">Marcus Lee</div>
                          <div class="text-xs font-mono text-slate-400">m.lee@company.io</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-3.5"><span class="badge border border-violet-200 text-violet-700 bg-violet-50">Editor</span></td>
                    <td class="px-5 py-3.5"><span class="badge border border-emerald-200 text-emerald-700 bg-emerald-50">Active</span></td>
                    <td class="px-5 py-3.5 text-xs font-mono text-slate-400 hide-mobile">1 hr ago</td>
                    <td class="px-5 py-3.5 text-xs font-mono text-slate-300 hide-mobile">usr_01H9A</td>
                    <td class="px-5 py-3.5 text-right">
                      <button class="btn-outline" onclick="event.stopPropagation(); showToast('Editing Marcus Lee...')">Edit</button>
                    </td>
                  </tr>
                  <tr class="table-row border-b border-slate-100 cursor-pointer" onclick="showToast('Viewing Yuki Tanaka profile...')">
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 border-2 border-amber-200 rounded-full flex items-center justify-center text-xs font-bold text-amber-600 font-mono bg-amber-50">YT</div>
                        <div>
                          <div class="text-sm font-display font-medium text-slate-800">Yuki Tanaka</div>
                          <div class="text-xs font-mono text-slate-400">y.tanaka@company.io</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-3.5"><span class="badge border border-slate-200 text-slate-600 bg-slate-50">Viewer</span></td>
                    <td class="px-5 py-3.5"><span class="badge border border-amber-200 text-amber-700 bg-amber-50">Pending</span></td>
                    <td class="px-5 py-3.5 text-xs font-mono text-slate-400 hide-mobile">3 days ago</td>
                    <td class="px-5 py-3.5 text-xs font-mono text-slate-300 hide-mobile">usr_01HBK</td>
                    <td class="px-5 py-3.5 text-right">
                      <button class="btn-outline" onclick="event.stopPropagation(); showToast('Approving Yuki Tanaka...')">Approve</button>
                    </td>
                  </tr>
                  <tr class="table-row border-b border-slate-100 cursor-pointer" onclick="showToast('Viewing David Kim profile...')">
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 border-2 border-emerald-200 rounded-full flex items-center justify-center text-xs font-bold text-emerald-600 font-mono bg-emerald-50">DK</div>
                        <div>
                          <div class="text-sm font-display font-medium text-slate-800">David Kim</div>
                          <div class="text-xs font-mono text-slate-400">d.kim@company.io</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-3.5"><span class="badge border border-violet-200 text-violet-700 bg-violet-50">Editor</span></td>
                    <td class="px-5 py-3.5"><span class="badge border border-emerald-200 text-emerald-700 bg-emerald-50">Active</span></td>
                    <td class="px-5 py-3.5 text-xs font-mono text-slate-400 hide-mobile">15 min ago</td>
                    <td class="px-5 py-3.5 text-xs font-mono text-slate-300 hide-mobile">usr_01HCM</td>
                    <td class="px-5 py-3.5 text-right">
                      <button class="btn-outline" onclick="event.stopPropagation(); showToast('Editing David Kim...')">Edit</button>
                    </td>
                  </tr>
                  <tr class="table-row border-b border-slate-100 cursor-pointer" onclick="showToast('Viewing Emma Wilson profile...')">
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 border-2 border-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 font-mono bg-slate-50">EW</div>
                        <div>
                          <div class="text-sm font-display font-medium text-slate-800">Emma Wilson</div>
                          <div class="text-xs font-mono text-slate-400">e.wilson@company.io</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-3.5"><span class="badge border border-slate-200 text-slate-600 bg-slate-50">Guest</span></td>
                    <td class="px-5 py-3.5"><span class="badge border border-red-200 text-red-700 bg-red-50">Banned</span></td>
                    <td class="px-5 py-3.5 text-xs font-mono text-slate-400 hide-mobile">Jan 15</td>
                    <td class="px-5 py-3.5 text-xs font-mono text-slate-300 hide-mobile">usr_01HDR</td>
                    <td class="px-5 py-3.5 text-right">
                      <button class="btn-outline" onclick="event.stopPropagation(); showToast('Restoring Emma Wilson...')">Restore</button>
                    </td>
                  </tr>
                  <tr class="table-row cursor-pointer" onclick="showToast('Viewing Alex Rivera profile...')">
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 border-2 border-indigo-200 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 font-mono bg-indigo-50">AR</div>
                        <div>
                          <div class="text-sm font-display font-medium text-slate-800">Alex Rivera</div>
                          <div class="text-xs font-mono text-slate-400">a.rivera@company.io</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-3.5"><span class="badge border border-indigo-200 text-indigo-700 bg-indigo-50">Admin</span></td>
                    <td class="px-5 py-3.5"><span class="badge border border-emerald-200 text-emerald-700 bg-emerald-50">Active</span></td>
                    <td class="px-5 py-3.5 text-xs font-mono text-slate-400 hide-mobile">Just now</td>
                    <td class="px-5 py-3.5 text-xs font-mono text-slate-300 hide-mobile">usr_01HEV</td>
                    <td class="px-5 py-3.5 text-right">
                      <button class="btn-outline" onclick="event.stopPropagation(); showToast('Editing Alex Rivera...')">Edit</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Pagination -->
            <div class="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
              <span class="text-xs font-mono text-slate-400">Showing 1-6 of 2,847</span>
              <div class="flex gap-1">
                <button class="w-8 h-8 border border-slate-200 text-xs text-slate-300 flex items-center justify-center cursor-pointer bg-white rounded-md font-mono">&lsaquo;</button>
                <button class="w-8 h-8 border-2 border-indigo-600 text-xs text-indigo-600 flex items-center justify-center cursor-pointer bg-white rounded-md font-mono font-semibold">1</button>
                <button class="w-8 h-8 border border-slate-200 text-xs text-slate-600 flex items-center justify-center cursor-pointer bg-white rounded-md font-mono hover:border-indigo-300" onclick="showToast('Page 2')">2</button>
                <button class="w-8 h-8 border border-slate-200 text-xs text-slate-600 flex items-center justify-center cursor-pointer bg-white rounded-md font-mono hover:border-indigo-300" onclick="showToast('Page 3')">3</button>
                <button class="w-8 h-8 border border-slate-200 text-xs text-slate-300 flex items-center justify-center cursor-pointer bg-white rounded-md font-mono">&hellip;</button>
                <button class="w-8 h-8 border border-slate-200 text-xs text-slate-600 flex items-center justify-center cursor-pointer bg-white rounded-md font-mono hover:border-indigo-300" onclick="showToast('Next page')">&rsaquo;</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Users Page -->
    <div id="page-users" class="page">
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div class="reveal-section">
          <h2 class="text-sm font-display font-semibold text-slate-800 mb-1">All Users</h2>
          <p class="text-xs text-slate-400 font-mono mb-4">Detailed user account management with bulk actions.</p>
          <div class="border border-slate-200 rounded-lg bg-white p-6">
            <div class="flex items-center gap-4 mb-4">
              <button class="btn-primary-outline" onclick="showToast('Bulk invite sent to 12 users')">Bulk Invite</button>
              <button class="btn-outline" onclick="showToast('Exporting user list as CSV...')">Export CSV</button>
              <button class="btn-outline" onclick="showToast('Import wizard opened')">Import</button>
            </div>
            <div class="border border-slate-100 rounded p-4">
              <div class="flex items-center gap-3 mb-3">
                <svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>
                <span class="text-sm font-display text-slate-600">User directory with advanced filtering is available on the Dashboard tab.</span>
              </div>
              <p class="text-xs font-mono text-slate-400">Navigate to Dashboard to see the full user table with status badges, role tags, and inline actions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Roles Page -->
    <div id="page-roles" class="page">
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div class="reveal-section">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-sm font-display font-semibold text-slate-800">Role Configuration</h2>
              <p class="text-xs text-slate-400 font-mono mt-0.5">Define custom roles and permission sets</p>
            </div>
            <button class="btn-primary-outline" onclick="showToast('Create role dialog opened')">
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
                New Role
              </span>
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="border border-slate-200 rounded-lg bg-white p-5 cursor-pointer" onclick="showToast('Editing Admin role...')">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-3 h-3 rounded-full bg-indigo-600"></div>
                <span class="text-sm font-display font-semibold text-slate-800">Admin</span>
                <span class="badge border border-indigo-200 text-indigo-600 bg-indigo-50 ml-auto font-mono">7/7 perms</span>
              </div>
              <p class="text-xs text-slate-400 font-mono">Full system access. Can manage users, roles, billing, and deployments.</p>
              <div class="mt-3 flex items-center gap-1.5">
                <div class="w-6 h-6 border border-indigo-200 rounded-full flex items-center justify-center text-[9px] font-bold text-indigo-600 font-mono bg-indigo-50">SC</div>
                <div class="w-6 h-6 border border-indigo-200 rounded-full flex items-center justify-center text-[9px] font-bold text-indigo-600 font-mono bg-indigo-50">AR</div>
                <span class="text-[10px] font-mono text-slate-300 ml-1">2 members</span>
              </div>
            </div>
            <div class="border border-slate-200 rounded-lg bg-white p-5 cursor-pointer" onclick="showToast('Editing Editor role...')">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-3 h-3 rounded-full bg-violet-500"></div>
                <span class="text-sm font-display font-semibold text-slate-800">Editor</span>
                <span class="badge border border-violet-200 text-violet-600 bg-violet-50 ml-auto font-mono">3/7 perms</span>
              </div>
              <p class="text-xs text-slate-400 font-mono">Can read, write, and delete content. No deploy or management access.</p>
              <div class="mt-3 flex items-center gap-1.5">
                <div class="w-6 h-6 border border-violet-200 rounded-full flex items-center justify-center text-[9px] font-bold text-violet-600 font-mono bg-violet-50">ML</div>
                <div class="w-6 h-6 border border-violet-200 rounded-full flex items-center justify-center text-[9px] font-bold text-violet-600 font-mono bg-violet-50">DK</div>
                <span class="text-[10px] font-mono text-slate-300 ml-1">2 members</span>
              </div>
            </div>
            <div class="border border-slate-200 rounded-lg bg-white p-5 cursor-pointer" onclick="showToast('Editing Viewer role...')">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-3 h-3 rounded-full bg-slate-400"></div>
                <span class="text-sm font-display font-semibold text-slate-800">Viewer</span>
                <span class="badge border border-slate-200 text-slate-500 bg-slate-50 ml-auto font-mono">1/7 perms</span>
              </div>
              <p class="text-xs text-slate-400 font-mono">Read-only access to all resources. Cannot modify or delete anything.</p>
              <div class="mt-3 flex items-center gap-1.5">
                <div class="w-6 h-6 border border-amber-200 rounded-full flex items-center justify-center text-[9px] font-bold text-amber-600 font-mono bg-amber-50">YT</div>
                <span class="text-[10px] font-mono text-slate-300 ml-1">1 member</span>
              </div>
            </div>
            <div class="border border-slate-200 rounded-lg bg-white p-5 cursor-pointer" onclick="showToast('Editing Guest role...')">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-3 h-3 rounded-full bg-slate-300"></div>
                <span class="text-sm font-display font-semibold text-slate-800">Guest</span>
                <span class="badge border border-slate-200 text-slate-500 bg-slate-50 ml-auto font-mono">1/7 perms</span>
              </div>
              <p class="text-xs text-slate-400 font-mono">Limited read-only access. Typically for external collaborators.</p>
              <div class="mt-3 flex items-center gap-1.5">
                <div class="w-6 h-6 border border-slate-200 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-500 font-mono bg-slate-50">EW</div>
                <span class="text-[10px] font-mono text-slate-300 ml-1">1 member</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Page -->
    <div id="page-settings" class="page">
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div class="reveal-section">
          <h2 class="text-sm font-display font-semibold text-slate-800 mb-1">System Settings</h2>
          <p class="text-xs text-slate-400 font-mono mb-4">Global configuration and preferences</p>
          <div class="border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
            <div class="flex items-center justify-between p-5 cursor-pointer" onclick="showToast('Opening general settings...')">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"/></svg>
                <div>
                  <div class="text-sm font-display font-medium text-slate-800">General</div>
                  <div class="text-xs font-mono text-slate-400">App name, timezone, language</div>
                </div>
              </div>
              <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
            </div>
            <div class="flex items-center justify-between p-5 cursor-pointer" onclick="showToast('Opening security settings...')">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
                <div>
                  <div class="text-sm font-display font-medium text-slate-800">Security</div>
                  <div class="text-xs font-mono text-slate-400">2FA, session timeout, password policy</div>
                </div>
              </div>
              <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
            </div>
            <div class="flex items-center justify-between p-5 cursor-pointer" onclick="showToast('Opening notification settings...')">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>
                <div>
                  <div class="text-sm font-display font-medium text-slate-800">Notifications</div>
                  <div class="text-xs font-mono text-slate-400">Email, Slack, webhook integrations</div>
                </div>
              </div>
              <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
            </div>
            <div class="flex items-center justify-between p-5 cursor-pointer" onclick="showToast('Opening API settings...')">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/></svg>
                <div>
                  <div class="text-sm font-display font-medium text-slate-800">API Keys</div>
                  <div class="text-xs font-mono text-slate-400">Manage API tokens and webhooks</div>
                </div>
              </div>
              <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logs Page -->
    <div id="page-logs" class="page">
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div class="reveal-section">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-sm font-display font-semibold text-slate-800">Activity Logs</h2>
              <p class="text-xs text-slate-400 font-mono mt-0.5">System audit trail</p>
            </div>
            <button class="btn-outline" onclick="showToast('Filtering logs...')">
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"/></svg>
                Filter
              </span>
            </button>
          </div>
          <div class="border border-slate-200 rounded-lg bg-white overflow-hidden">
            <div class="divide-y divide-slate-100">
              <div class="flex items-start gap-3 p-4 cursor-pointer table-row" onclick="showToast('Log detail: user.login')">
                <div class="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-display font-medium text-slate-800">Sarah Chen</span>
                    <span class="text-xs font-mono text-slate-400">logged in</span>
                  </div>
                  <div class="text-[10px] font-mono text-slate-300 mt-0.5">2 min ago  |  IP: 192.168.1.42  |  Chrome/macOS</div>
                </div>
                <span class="text-[10px] font-mono text-emerald-500 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0">AUTH</span>
              </div>
              <div class="flex items-start gap-3 p-4 cursor-pointer table-row" onclick="showToast('Log detail: role.update')">
                <div class="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-display font-medium text-slate-800">Alex Rivera</span>
                    <span class="text-xs font-mono text-slate-400">updated Editor role permissions</span>
                  </div>
                  <div class="text-[10px] font-mono text-slate-300 mt-0.5">18 min ago  |  IP: 10.0.0.15  |  Firefox/Linux</div>
                </div>
                <span class="text-[10px] font-mono text-indigo-500 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded shrink-0">RBAC</span>
              </div>
              <div class="flex items-start gap-3 p-4 cursor-pointer table-row" onclick="showToast('Log detail: user.ban')">
                <div class="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-display font-medium text-slate-800">Sarah Chen</span>
                    <span class="text-xs font-mono text-slate-400">banned user Emma Wilson</span>
                  </div>
                  <div class="text-[10px] font-mono text-slate-300 mt-0.5">1 hr ago  |  IP: 192.168.1.42  |  Reason: Policy violation</div>
                </div>
                <span class="text-[10px] font-mono text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded shrink-0">SECURITY</span>
              </div>
              <div class="flex items-start gap-3 p-4 cursor-pointer table-row" onclick="showToast('Log detail: deploy')">
                <div class="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-display font-medium text-slate-800">Marcus Lee</span>
                    <span class="text-xs font-mono text-slate-400">attempted deploy (permission denied)</span>
                  </div>
                  <div class="text-[10px] font-mono text-slate-300 mt-0.5">3 hrs ago  |  IP: 172.16.0.8  |  Required: deploy permission</div>
                </div>
                <span class="text-[10px] font-mono text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded shrink-0">DENIED</span>
              </div>
              <div class="flex items-start gap-3 p-4 cursor-pointer table-row" onclick="showToast('Log detail: settings.update')">
                <div class="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-display font-medium text-slate-800">Alex Rivera</span>
                    <span class="text-xs font-mono text-slate-400">updated system timezone to UTC+8</span>
                  </div>
                  <div class="text-[10px] font-mono text-slate-300 mt-0.5">Yesterday  |  IP: 10.0.0.15  |  Settings > General</div>
                </div>
                <span class="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded shrink-0">CONFIG</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>

<script>
// Toast
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.classList.remove('show'); }, 2500);
}

// Breadcrumb labels
var breadcrumbMap = {
  dashboard: 'Overview',
  users: 'All Users',
  roles: 'Role Configuration',
  settings: 'System Settings',
  logs: 'Activity Logs'
};

// Tab switching
function switchTab(page, link) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('page-' + page).classList.add('active');

  // Update tab styles
  document.querySelectorAll('.nav-tab').forEach(function(t) {
    t.classList.remove('active');
    t.classList.add('text-slate-400');
  });
  link.classList.add('active');
  link.classList.remove('text-slate-400');

  // Update breadcrumb
  document.getElementById('breadcrumb-current').textContent = breadcrumbMap[page] || page;

  // Re-trigger scroll reveal for new page
  setTimeout(initScrollReveal, 50);
}

// Scroll reveal with IntersectionObserver
function initScrollReveal() {
  var sections = document.querySelectorAll('.page.active .reveal-section');
  if (!sections.length) return;

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    sections.forEach(function(s) {
      s.classList.remove('visible');
      observer.observe(s);
    });
  } else {
    // Fallback: show immediately
    sections.forEach(function(s) { s.classList.add('visible'); });
  }
}

// Init on load
document.addEventListener('DOMContentLoaded', function() {
  initScrollReveal();
});

// Also run on script execution (for inline loading)
initScrollReveal();
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
