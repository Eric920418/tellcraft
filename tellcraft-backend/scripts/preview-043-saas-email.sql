INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'a91a9897-0bd4-4c9c-8ef6-c1318ccfdb88',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MailPulse — Email Client</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: { 50:'#eff6ff', 100:'#dbeafe', 200:'#bfdbfe', 300:'#93c5fd', 400:'#60a5fa', 500:'#3b82f6', 600:'#2563eb', 700:'#1d4ed8' },
        warm: { 50:'#fafaf9', 100:'#f5f5f4', 200:'#e7e5e3', 300:'#d6d3d1', 400:'#a8a29e', 500:'#78716c', 600:'#57534e', 700:'#44403c', 800:'#292524', 900:'#1c1917' }
      },
      fontFamily: { sans: ['Inter','system-ui','-apple-system','Segoe UI','sans-serif'] }
    }
  }
}
</script>
<style>
  * { font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; overflow: hidden; background: #f5f5f4; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #a8a29e; }
  .email-item { cursor: pointer; transition: background-color 0.15s ease; }
  .email-item:hover { background-color: #f5f5f4; }
  .email-item.active { background-color: #eff6ff; border-left: 3px solid #2563eb; }
  .email-item.active .email-subject { color: #1d4ed8; }
  .folder-item { cursor: pointer; transition: all 0.15s ease; border-radius: 6px; padding: 6px 10px; }
  .folder-item:hover { background-color: #f5f5f4; }
  .folder-item.active { background-color: #eff6ff; color: #2563eb; font-weight: 600; }
  .thread-reply { border-left: 2px solid #e7e5e3; padding-left: 16px; margin-left: 12px; margin-top: 16px; }
  .thread-reply-inner { border-left: 2px solid #d6d3d1; padding-left: 16px; margin-left: 12px; margin-top: 12px; }
  .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: #2563eb; flex-shrink: 0; }
  .badge { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; font-size: 11px; font-weight: 600; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; color: white; flex-shrink: 0; }
  @media (max-width: 768px) {
    .folder-panel { display: none !important; }
    .email-content-panel { display: none !important; }
    .email-list-panel { flex: 1 !important; max-width: 100% !important; }
  }
</style>
</head>
<body>

<div class="h-screen flex flex-col">

  <!-- Top Bar -->
  <header class="h-14 bg-white border-b border-warm-200 flex items-center px-4 gap-3 flex-shrink-0 shadow-sm">
    <!-- Logo -->
    <div class="flex items-center gap-2 mr-2">
      <div class="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
      </div>
      <span class="font-bold text-warm-800 text-base hidden sm:inline">MailPulse</span>
    </div>

    <!-- Compose Button -->
    <button id="composeBtn" class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
      <span class="hidden sm:inline">Compose</span>
    </button>

    <!-- Search -->
    <div class="flex-1 max-w-2xl mx-2">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" placeholder="Search emails..." class="w-full bg-warm-50 border border-warm-200 rounded-lg pl-10 pr-4 py-2 text-sm text-warm-700 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all">
      </div>
    </div>

    <!-- Settings -->
    <button class="p-2 text-warm-400 hover:text-warm-600 hover:bg-warm-100 rounded-lg transition-colors">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
    </button>

    <!-- User avatar -->
    <div class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm border border-brand-200">E</div>
  </header>

  <!-- Main Three-Panel Layout -->
  <div class="flex flex-1 overflow-hidden">

    <!-- Left Panel: Folders (200px) -->
    <aside class="folder-panel w-[200px] bg-white border-r border-warm-200 flex flex-col flex-shrink-0 overflow-y-auto py-3 px-2">

      <div class="space-y-0.5">
        <div class="folder-item active flex items-center justify-between" data-folder="inbox" onclick="selectFolder(this)">
          <div class="flex items-center gap-2.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
            <span class="text-sm">Inbox</span>
          </div>
          <span class="badge bg-brand-600 text-white">12</span>
        </div>

        <div class="folder-item flex items-center justify-between" data-folder="starred" onclick="selectFolder(this)">
          <div class="flex items-center gap-2.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
            <span class="text-sm">Starred</span>
          </div>
          <span class="badge bg-warm-200 text-warm-600">3</span>
        </div>

        <div class="folder-item flex items-center gap-2.5" data-folder="sent" onclick="selectFolder(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          <span class="text-sm">Sent</span>
        </div>

        <div class="folder-item flex items-center justify-between" data-folder="drafts" onclick="selectFolder(this)">
          <div class="flex items-center gap-2.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span class="text-sm">Drafts</span>
          </div>
          <span class="badge bg-warm-200 text-warm-600">1</span>
        </div>

        <div class="folder-item flex items-center gap-2.5" data-folder="archive" onclick="selectFolder(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
          <span class="text-sm">Archive</span>
        </div>

        <div class="folder-item flex items-center gap-2.5" data-folder="trash" onclick="selectFolder(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          <span class="text-sm">Trash</span>
        </div>
      </div>

      <!-- Separator -->
      <div class="border-t border-warm-200 my-3 mx-1"></div>

      <!-- Labels -->
      <div class="px-1 mb-2">
        <span class="text-[10px] uppercase tracking-wider font-semibold text-warm-400">Labels</span>
      </div>
      <div class="space-y-0.5">
        <div class="folder-item flex items-center gap-2.5" onclick="selectFolder(this)">
          <span class="w-2.5 h-2.5 rounded-full bg-brand-500 flex-shrink-0"></span>
          <span class="text-sm text-warm-600">Work</span>
        </div>
        <div class="folder-item flex items-center gap-2.5" onclick="selectFolder(this)">
          <span class="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
          <span class="text-sm text-warm-600">Personal</span>
        </div>
      </div>

      <!-- Spacer -->
      <div class="flex-1"></div>

      <!-- Storage indicator -->
      <div class="px-2 py-3 mt-2">
        <div class="text-[11px] text-warm-400 mb-1.5">2.4 GB of 15 GB used</div>
        <div class="h-1.5 bg-warm-100 rounded-full overflow-hidden">
          <div class="h-full bg-brand-500 rounded-full" style="width:16%"></div>
        </div>
      </div>
    </aside>

    <!-- Middle Panel: Email List (320px) -->
    <div class="email-list-panel w-[320px] bg-white border-r border-warm-200 flex flex-col flex-shrink-0 overflow-hidden">

      <!-- List header -->
      <div class="h-10 border-b border-warm-100 flex items-center justify-between px-4 flex-shrink-0">
        <span class="text-xs font-semibold text-warm-500 uppercase tracking-wider">Inbox</span>
        <div class="flex items-center gap-1">
          <button class="p-1 text-warm-400 hover:text-warm-600 rounded transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>
          </button>
          <button class="p-1 text-warm-400 hover:text-warm-600 rounded transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
          </button>
        </div>
      </div>

      <!-- Email items -->
      <div class="flex-1 overflow-y-auto" id="emailList">

        <!-- Email 1 - UNREAD, SELECTED -->
        <div class="email-item active border-b border-warm-100 px-4 py-3" data-id="0" onclick="selectEmail(0)">
          <div class="flex items-start gap-3">
            <div class="avatar bg-brand-500 mt-0.5">AK</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="unread-dot"></span>
                  <span class="font-semibold text-sm text-warm-900 truncate">Alex Kim</span>
                </div>
                <span class="text-[11px] text-warm-400 flex-shrink-0 ml-2">2m</span>
              </div>
              <div class="text-sm font-semibold text-warm-800 truncate">Q1 Marketing Campaign Review</div>
              <div class="text-xs text-warm-400 truncate mt-0.5">Hey team, I've compiled the Q1 results and want to discuss our next steps for the upcoming...</div>
            </div>
          </div>
        </div>

        <!-- Email 2 - UNREAD -->
        <div class="email-item border-b border-warm-100 px-4 py-3" data-id="1" onclick="selectEmail(1)">
          <div class="flex items-start gap-3">
            <div class="avatar bg-purple-500 mt-0.5">SL</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="unread-dot"></span>
                  <span class="font-semibold text-sm text-warm-900 truncate">Sarah Lin</span>
                </div>
                <span class="text-[11px] text-warm-400 flex-shrink-0 ml-2">18m</span>
              </div>
              <div class="text-sm font-semibold text-warm-800 truncate">Design system update - new components ready</div>
              <div class="text-xs text-warm-400 truncate mt-0.5">Hi! The button, modal, and toast components are finalized. I've pushed them to the staging...</div>
            </div>
          </div>
        </div>

        <!-- Email 3 - UNREAD -->
        <div class="email-item border-b border-warm-100 px-4 py-3" data-id="2" onclick="selectEmail(2)">
          <div class="flex items-start gap-3">
            <div class="avatar bg-emerald-500 mt-0.5">JW</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="unread-dot"></span>
                  <span class="font-semibold text-sm text-warm-900 truncate">James Wang</span>
                </div>
                <span class="text-[11px] text-warm-400 flex-shrink-0 ml-2">1h</span>
              </div>
              <div class="text-sm font-semibold text-warm-800 truncate">Server migration this weekend</div>
              <div class="text-xs text-warm-400 truncate mt-0.5">Quick heads up: we're migrating to the new AWS cluster Saturday 2am-6am. Expect brief downtime...</div>
            </div>
          </div>
        </div>

        <!-- Email 4 - Read -->
        <div class="email-item border-b border-warm-100 px-4 py-3" data-id="3" onclick="selectEmail(3)">
          <div class="flex items-start gap-3">
            <div class="avatar bg-orange-500 mt-0.5">MT</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-sm text-warm-700 truncate">Maya Torres</span>
                <span class="text-[11px] text-warm-400 flex-shrink-0 ml-2">3h</span>
              </div>
              <div class="text-sm text-warm-600 truncate">Re: Client onboarding checklist</div>
              <div class="text-xs text-warm-400 truncate mt-0.5">Updated the checklist with the new compliance steps. Can you review section 3 before I send it...</div>
            </div>
          </div>
        </div>

        <!-- Email 5 - Read -->
        <div class="email-item border-b border-warm-100 px-4 py-3" data-id="4" onclick="selectEmail(4)">
          <div class="flex items-start gap-3">
            <div class="avatar bg-rose-500 mt-0.5">LH</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-sm text-warm-700 truncate">Lisa Huang</span>
                <span class="text-[11px] text-warm-400 flex-shrink-0 ml-2">5h</span>
              </div>
              <div class="text-sm text-warm-600 truncate">Weekly standup notes - Feb 24</div>
              <div class="text-xs text-warm-400 truncate mt-0.5">Here are the notes from today's standup. Action items: David to finalize API docs, Sarah to...</div>
            </div>
          </div>
        </div>

        <!-- Email 6 - Read -->
        <div class="email-item border-b border-warm-100 px-4 py-3" data-id="5" onclick="selectEmail(5)">
          <div class="flex items-start gap-3">
            <div class="avatar bg-cyan-600 mt-0.5">DK</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-sm text-warm-700 truncate">David Kuo</span>
                <span class="text-[11px] text-warm-400 flex-shrink-0 ml-2">1d</span>
              </div>
              <div class="text-sm text-warm-600 truncate">API rate limiting proposal</div>
              <div class="text-xs text-warm-400 truncate mt-0.5">I've drafted a proposal for the new rate limiting strategy. Key changes: sliding window counter...</div>
            </div>
          </div>
        </div>

        <!-- Email 7 - Read -->
        <div class="email-item border-b border-warm-100 px-4 py-3" data-id="6" onclick="selectEmail(6)">
          <div class="flex items-start gap-3">
            <div class="avatar bg-indigo-500 mt-0.5">RC</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-sm text-warm-700 truncate">Rachel Chen</span>
                <span class="text-[11px] text-warm-400 flex-shrink-0 ml-2">1d</span>
              </div>
              <div class="text-sm text-warm-600 truncate">Re: Budget approval for Q2 tools</div>
              <div class="text-xs text-warm-400 truncate mt-0.5">Approved! Go ahead and subscribe to the Figma team plan and the new monitoring service. Keep me...</div>
            </div>
          </div>
        </div>

        <!-- Email 8 - Read -->
        <div class="email-item border-b border-warm-100 px-4 py-3" data-id="7" onclick="selectEmail(7)">
          <div class="flex items-start gap-3">
            <div class="avatar bg-amber-600 mt-0.5">TN</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-sm text-warm-700 truncate">Tom Nakamura</span>
                <span class="text-[11px] text-warm-400 flex-shrink-0 ml-2">2d</span>
              </div>
              <div class="text-sm text-warm-600 truncate">Team dinner reservation confirmed</div>
              <div class="text-xs text-warm-400 truncate mt-0.5">Got us a table at Osteria Francescana for 8 people, Friday 7pm. Please RSVP by Thursday so I...</div>
            </div>
          </div>
        </div>

        <!-- Email 9 - Read -->
        <div class="email-item border-b border-warm-100 px-4 py-3" data-id="8" onclick="selectEmail(8)">
          <div class="flex items-start gap-3">
            <div class="avatar bg-teal-600 mt-0.5">EP</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-sm text-warm-700 truncate">Emily Park</span>
                <span class="text-[11px] text-warm-400 flex-shrink-0 ml-2">3d</span>
              </div>
              <div class="text-sm text-warm-600 truncate">User research findings - Dashboard v2</div>
              <div class="text-xs text-warm-400 truncate mt-0.5">Attached the full report. Key insight: 73% of users want customizable widgets. Scheduling a...</div>
            </div>
          </div>
        </div>

        <!-- Email 10 - Read -->
        <div class="email-item border-b border-warm-100 px-4 py-3" data-id="9" onclick="selectEmail(9)">
          <div class="flex items-start gap-3">
            <div class="avatar bg-gray-500 mt-0.5">GH</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-sm text-warm-700 truncate">GitHub</span>
                <span class="text-[11px] text-warm-400 flex-shrink-0 ml-2">3d</span>
              </div>
              <div class="text-sm text-warm-600 truncate">[mailpulse/api] PR #247 merged</div>
              <div class="text-xs text-warm-400 truncate mt-0.5">Pull request "feat: add batch email endpoint" has been merged into main by davidkuo. 14 files...</div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Right Panel: Email Content -->
    <main class="email-content-panel flex-1 bg-warm-50 overflow-y-auto" id="emailContent">

      <!-- Email content area -->
      <div class="max-w-3xl mx-auto p-6">

        <!-- Subject -->
        <h1 class="text-xl font-bold text-warm-900 mb-4" id="emailSubject">Q1 Marketing Campaign Review</h1>

        <!-- Meta info -->
        <div class="bg-white rounded-xl border border-warm-200 shadow-sm p-5 mb-4">
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-3">
              <div class="avatar bg-brand-500 mt-0.5" id="emailAvatar">AK</div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-sm text-warm-900" id="emailSender">Alex Kim</span>
                  <span class="text-xs text-warm-400" id="emailAddress">&lt;alex.kim@company.com&gt;</span>
                </div>
                <div class="text-xs text-warm-400 mt-0.5">
                  <span id="emailTo">To: team@company.com</span>
                  <span class="mx-1.5">&middot;</span>
                  <span id="emailDate">Feb 24, 2026 at 10:42 AM</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button class="p-1.5 text-warm-400 hover:text-warm-600 rounded-lg hover:bg-warm-100 transition-colors" title="Star">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
              </button>
              <button class="p-1.5 text-warm-400 hover:text-warm-600 rounded-lg hover:bg-warm-100 transition-colors" title="More">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Email Body -->
        <div class="bg-white rounded-xl border border-warm-200 shadow-sm p-6" id="emailBody">

          <div class="text-sm text-warm-700 leading-relaxed space-y-4">
            <p>Hey team,</p>
            <p>I've compiled the Q1 marketing campaign results and want to discuss our strategy for Q2. Here are the highlights:</p>
            <p><strong>Key Metrics:</strong></p>
            <ul class="list-disc pl-5 space-y-1">
              <li>Email open rate: 34.2% (up from 28.7% in Q4)</li>
              <li>Click-through rate: 8.9% (industry avg: 4.2%)</li>
              <li>Subscriber growth: +2,847 new subscribers</li>
              <li>Revenue attributed to email: $142,500</li>
            </ul>
            <p>The personalization features we rolled out in January made a significant impact. Segmented campaigns outperformed generic ones by 3x in conversion rate.</p>
            <p>For Q2, I'm proposing we focus on:</p>
            <ol class="list-decimal pl-5 space-y-1">
              <li>A/B testing subject lines with AI-generated variants</li>
              <li>Expanding the automation workflows (cart abandonment, re-engagement)</li>
              <li>Launching the referral program email sequence</li>
            </ol>
            <p>Let me know your thoughts. I'd like to finalize the plan by end of week.</p>
            <p>Best,<br>Alex</p>
          </div>

          <!-- SIGNATURE ELEMENT: Thread indent lines -->
          <div class="thread-reply mt-6 pt-4">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white text-[10px] font-semibold">LH</div>
              <span class="text-xs font-medium text-warm-600">Lisa Huang</span>
              <span class="text-[11px] text-warm-400">Feb 23, 2026 at 4:15 PM</span>
            </div>
            <div class="text-sm text-warm-600 leading-relaxed space-y-3">
              <p>Alex, these numbers look fantastic! The segmentation work really paid off.</p>
              <p>One thought on Q2: we should also consider integrating the new analytics dashboard so the team can track campaign performance in real-time.</p>
              <p>+1 on the AI subject line testing. Let's sync about this Thursday.</p>
            </div>

            <!-- Nested thread (deeper indent) -->
            <div class="thread-reply-inner mt-4 pt-3">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-white text-[10px] font-semibold">AK</div>
                <span class="text-xs font-medium text-warm-600">Alex Kim</span>
                <span class="text-[11px] text-warm-400">Feb 23, 2026 at 2:30 PM</span>
              </div>
              <div class="text-sm text-warm-500 leading-relaxed">
                <p>Team, I'm pulling together the Q1 report. If you have any additional data points or feedback on specific campaigns, please send them my way before tomorrow noon.</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3 mt-5">
          <button class="flex items-center gap-2 bg-white border border-warm-200 hover:border-brand-300 hover:bg-brand-50 text-warm-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
            Reply
          </button>
          <button class="flex items-center gap-2 bg-white border border-warm-200 hover:border-brand-300 hover:bg-brand-50 text-warm-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6M13 10h8m0 0l-4-4m4 4l-4 4"/></svg>
            Reply All
          </button>
          <button class="flex items-center gap-2 bg-white border border-warm-200 hover:border-brand-300 hover:bg-brand-50 text-warm-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
            Forward
          </button>
          <button class="flex items-center gap-2 bg-white border border-warm-200 hover:border-red-200 hover:bg-red-50 text-warm-400 hover:text-red-500 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ml-auto">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Delete
          </button>
        </div>

      </div>
    </main>

  </div>
</div>

<!-- Compose Modal -->
<div id="composeModal" class="fixed inset-0 z-50 hidden">
  <div class="absolute inset-0 bg-black/20" onclick="closeCompose()"></div>
  <div class="absolute bottom-4 right-4 w-[520px] bg-white rounded-xl shadow-2xl border border-warm-200 overflow-hidden">
    <div class="bg-warm-800 text-white px-4 py-2.5 flex items-center justify-between">
      <span class="text-sm font-medium">New Message</span>
      <button onclick="closeCompose()" class="text-warm-300 hover:text-white transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="p-3 space-y-2 border-b border-warm-100">
      <div class="flex items-center gap-2"><span class="text-xs text-warm-400 w-8">To</span><input type="text" class="flex-1 text-sm outline-none text-warm-700 placeholder-warm-300" placeholder="Recipients"></div>
      <div class="flex items-center gap-2"><span class="text-xs text-warm-400 w-8">Sub</span><input type="text" class="flex-1 text-sm outline-none text-warm-700 placeholder-warm-300" placeholder="Subject"></div>
    </div>
    <textarea class="w-full h-48 p-3 text-sm text-warm-700 outline-none resize-none placeholder-warm-300" placeholder="Write your message..."></textarea>
    <div class="px-3 py-2.5 border-t border-warm-100 flex items-center justify-between">
      <button class="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">Send</button>
      <button onclick="closeCompose()" class="p-2 text-warm-400 hover:text-red-500 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    </div>
  </div>
</div>

<script>
// Email data
const emails = [
  {
    id: 0, sender: 'Alex Kim', initials: 'AK', color: 'bg-brand-500', email: 'alex.kim@company.com',
    to: 'team@company.com', date: 'Feb 24, 2026 at 10:42 AM', time: '2m', unread: true,
    subject: 'Q1 Marketing Campaign Review',
    preview: "Hey team, I've compiled the Q1 results and want to discuss our next steps for the upcoming...",
    body: `<div class="text-sm text-warm-700 leading-relaxed space-y-4">
      <p>Hey team,</p>
      <p>I've compiled the Q1 marketing campaign results and want to discuss our strategy for Q2. Here are the highlights:</p>
      <p><strong>Key Metrics:</strong></p>
      <ul class="list-disc pl-5 space-y-1">
        <li>Email open rate: 34.2% (up from 28.7% in Q4)</li>
        <li>Click-through rate: 8.9% (industry avg: 4.2%)</li>
        <li>Subscriber growth: +2,847 new subscribers</li>
        <li>Revenue attributed to email: $142,500</li>
      </ul>
      <p>The personalization features we rolled out in January made a significant impact. Segmented campaigns outperformed generic ones by 3x in conversion rate.</p>
      <p>For Q2, I'm proposing we focus on:</p>
      <ol class="list-decimal pl-5 space-y-1">
        <li>A/B testing subject lines with AI-generated variants</li>
        <li>Expanding the automation workflows (cart abandonment, re-engagement)</li>
        <li>Launching the referral program email sequence</li>
      </ol>
      <p>Let me know your thoughts. I'd like to finalize the plan by end of week.</p>
      <p>Best,<br>Alex</p>
    </div>
    <div class="thread-reply mt-6 pt-4">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white text-[10px] font-semibold">LH</div>
        <span class="text-xs font-medium text-warm-600">Lisa Huang</span>
        <span class="text-[11px] text-warm-400">Feb 23, 2026 at 4:15 PM</span>
      </div>
      <div class="text-sm text-warm-600 leading-relaxed space-y-3">
        <p>Alex, these numbers look fantastic! The segmentation work really paid off.</p>
        <p>One thought on Q2: we should also consider integrating the new analytics dashboard so the team can track campaign performance in real-time.</p>
        <p>+1 on the AI subject line testing. Let's sync about this Thursday.</p>
      </div>
      <div class="thread-reply-inner mt-4 pt-3">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-white text-[10px] font-semibold">AK</div>
          <span class="text-xs font-medium text-warm-600">Alex Kim</span>
          <span class="text-[11px] text-warm-400">Feb 23, 2026 at 2:30 PM</span>
        </div>
        <div class="text-sm text-warm-500 leading-relaxed">
          <p>Team, I'm pulling together the Q1 report. If you have any additional data points or feedback on specific campaigns, please send them my way before tomorrow noon.</p>
        </div>
      </div>
    </div>`
  },
  {
    id: 1, sender: 'Sarah Lin', initials: 'SL', color: 'bg-purple-500', email: 'sarah.lin@company.com',
    to: 'design-team@company.com', date: 'Feb 24, 2026 at 10:24 AM', time: '18m', unread: true,
    subject: 'Design system update - new components ready',
    preview: "Hi! The button, modal, and toast components are finalized. I've pushed them to the staging...",
    body: `<div class="text-sm text-warm-700 leading-relaxed space-y-4">
      <p>Hi everyone,</p>
      <p>Excited to share that the new design system components are ready for review! Here's what's included:</p>
      <p><strong>New Components:</strong></p>
      <ul class="list-disc pl-5 space-y-1">
        <li><strong>Button</strong> - 4 variants (primary, secondary, ghost, destructive) with loading states</li>
        <li><strong>Modal</strong> - Accessible dialog with focus trap and keyboard navigation</li>
        <li><strong>Toast</strong> - Auto-dismiss notifications with action support</li>
        <li><strong>Dropdown</strong> - Multi-select with search and keyboard navigation</li>
      </ul>
      <p>Everything is live on Storybook: <span class="text-brand-600 underline">storybook.internal.company.com</span></p>
      <p>Please take a look and leave feedback directly in Figma or ping me on Slack. I'd love to get these merged by Wednesday.</p>
      <p>Cheers,<br>Sarah</p>
    </div>`
  },
  {
    id: 2, sender: 'James Wang', initials: 'JW', color: 'bg-emerald-500', email: 'james.wang@company.com',
    to: 'engineering@company.com', date: 'Feb 24, 2026 at 9:32 AM', time: '1h', unread: true,
    subject: 'Server migration this weekend',
    preview: "Quick heads up: we're migrating to the new AWS cluster Saturday 2am-6am. Expect brief downtime...",
    body: `<div class="text-sm text-warm-700 leading-relaxed space-y-4">
      <p>Hi all,</p>
      <p>Quick heads up: we're migrating to the new AWS cluster this Saturday (Feb 28) from 2:00 AM to 6:00 AM UTC.</p>
      <p><strong>What to expect:</strong></p>
      <ul class="list-disc pl-5 space-y-1">
        <li>Brief downtime (estimated 15-30 minutes) during DNS switchover</li>
        <li>All API endpoints will be temporarily unavailable</li>
        <li>Database connections will be reset - please ensure your services handle reconnection</li>
      </ul>
      <p><strong>What you need to do:</strong></p>
      <ol class="list-decimal pl-5 space-y-1">
        <li>Freeze all deployments after Friday 6 PM</li>
        <li>Update your local .env if you point to staging directly</li>
        <li>Monitor #ops-alerts on Saturday morning</li>
      </ol>
      <p>The new cluster gives us 3x the compute capacity and auto-scaling. Worth the brief disruption.</p>
      <p>Ping me if you have concerns.</p>
      <p>James</p>
    </div>
    <div class="thread-reply mt-6 pt-4">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-white text-[10px] font-semibold">DK</div>
        <span class="text-xs font-medium text-warm-600">David Kuo</span>
        <span class="text-[11px] text-warm-400">Feb 23, 2026 at 5:10 PM</span>
      </div>
      <div class="text-sm text-warm-600 leading-relaxed">
        <p>James, will the Redis cluster also be migrated? We have some long-running BullMQ jobs that might get interrupted.</p>
      </div>
    </div>`
  },
  {
    id: 3, sender: 'Maya Torres', initials: 'MT', color: 'bg-orange-500', email: 'maya.torres@company.com',
    to: 'me@company.com', date: 'Feb 24, 2026 at 7:18 AM', time: '3h', unread: false,
    subject: 'Re: Client onboarding checklist',
    preview: "Updated the checklist with the new compliance steps. Can you review section 3 before I send it...",
    body: `<div class="text-sm text-warm-700 leading-relaxed space-y-4">
      <p>Hi,</p>
      <p>Updated the checklist with the new compliance steps from legal. Key changes in section 3:</p>
      <ul class="list-disc pl-5 space-y-1">
        <li>Added GDPR data processing agreement step</li>
        <li>New SOC 2 compliance verification for enterprise clients</li>
        <li>Updated the SLA template with the revised uptime guarantees</li>
      </ul>
      <p>Can you review section 3 before I send it to the client? They're expecting the finalized version by Thursday.</p>
      <p>Thanks,<br>Maya</p>
    </div>
    <div class="thread-reply mt-6 pt-4">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-6 h-6 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 text-[10px] font-semibold">E</div>
        <span class="text-xs font-medium text-warm-600">Me</span>
        <span class="text-[11px] text-warm-400">Feb 23, 2026 at 3:40 PM</span>
      </div>
      <div class="text-sm text-warm-600 leading-relaxed">
        <p>Maya, could you also add the new compliance requirements from the legal team? I think section 3 needs updating.</p>
      </div>
    </div>`
  },
  {
    id: 4, sender: 'Lisa Huang', initials: 'LH', color: 'bg-rose-500', email: 'lisa.huang@company.com',
    to: 'team@company.com', date: 'Feb 24, 2026 at 5:30 AM', time: '5h', unread: false,
    subject: 'Weekly standup notes - Feb 24',
    preview: "Here are the notes from today's standup. Action items: David to finalize API docs, Sarah to...",
    body: `<div class="text-sm text-warm-700 leading-relaxed space-y-4">
      <p>Team,</p>
      <p>Here are the notes from today's standup:</p>
      <p><strong>Completed:</strong></p>
      <ul class="list-disc pl-5 space-y-1">
        <li>Alex: Finished Q1 campaign report</li>
        <li>Sarah: Design system components pushed to staging</li>
        <li>David: API rate limiting PR approved</li>
      </ul>
      <p><strong>In Progress:</strong></p>
      <ul class="list-disc pl-5 space-y-1">
        <li>James: Server migration prep (ETA: Saturday)</li>
        <li>Maya: Client onboarding docs update</li>
        <li>Emily: Dashboard v2 user research synthesis</li>
      </ul>
      <p><strong>Action Items:</strong></p>
      <ol class="list-decimal pl-5 space-y-1">
        <li>David to finalize API documentation by Wednesday</li>
        <li>Sarah to schedule design review for new components</li>
        <li>All: RSVP for team dinner by Thursday</li>
      </ol>
      <p>Next standup: Wednesday 10 AM.</p>
      <p>Lisa</p>
    </div>`
  },
  {
    id: 5, sender: 'David Kuo', initials: 'DK', color: 'bg-cyan-600', email: 'david.kuo@company.com',
    to: 'engineering@company.com', date: 'Feb 23, 2026 at 2:15 PM', time: '1d', unread: false,
    subject: 'API rate limiting proposal',
    preview: "I've drafted a proposal for the new rate limiting strategy. Key changes: sliding window counter...",
    body: `<div class="text-sm text-warm-700 leading-relaxed space-y-4">
      <p>Hey team,</p>
      <p>I've drafted a proposal for our new rate limiting strategy. We've been getting occasional abuse on the public API and the current fixed-window approach has gaps.</p>
      <p><strong>Proposed Changes:</strong></p>
      <ul class="list-disc pl-5 space-y-1">
        <li>Switch from fixed-window to sliding-window counters</li>
        <li>Implement tiered limits: Free (100/min), Pro (1000/min), Enterprise (custom)</li>
        <li>Add Redis-backed distributed counter for multi-region support</li>
        <li>Return proper 429 responses with Retry-After headers</li>
      </ul>
      <p>PR is up for review: <span class="text-brand-600">#248</span></p>
      <p>David</p>
    </div>`
  },
  {
    id: 6, sender: 'Rachel Chen', initials: 'RC', color: 'bg-indigo-500', email: 'rachel.chen@company.com',
    to: 'me@company.com', date: 'Feb 23, 2026 at 11:20 AM', time: '1d', unread: false,
    subject: 'Re: Budget approval for Q2 tools',
    preview: "Approved! Go ahead and subscribe to the Figma team plan and the new monitoring service. Keep me...",
    body: `<div class="text-sm text-warm-700 leading-relaxed space-y-4">
      <p>Approved! Go ahead and subscribe to:</p>
      <ul class="list-disc pl-5 space-y-1">
        <li>Figma Organization plan ($45/editor/month) - 8 seats</li>
        <li>Datadog Pro ($23/host/month) - 12 hosts</li>
        <li>Linear Standard ($8/user/month) - 15 seats</li>
      </ul>
      <p>Total: ~$796/month. Well within our Q2 tooling budget.</p>
      <p>Keep me posted on the vendor negotiations for the annual contract discounts.</p>
      <p>Rachel</p>
    </div>
    <div class="thread-reply mt-6 pt-4">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-6 h-6 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 text-[10px] font-semibold">E</div>
        <span class="text-xs font-medium text-warm-600">Me</span>
        <span class="text-[11px] text-warm-400">Feb 22, 2026 at 4:00 PM</span>
      </div>
      <div class="text-sm text-warm-600 leading-relaxed space-y-3">
        <p>Hi Rachel, requesting budget approval for Q2 developer tools. Details attached.</p>
        <p>Key items: Figma upgrade, Datadog monitoring, and Linear for project management. Total estimated cost ~$800/month.</p>
      </div>
    </div>`
  },
  {
    id: 7, sender: 'Tom Nakamura', initials: 'TN', color: 'bg-amber-600', email: 'tom.nakamura@company.com',
    to: 'team@company.com', date: 'Feb 22, 2026 at 6:45 PM', time: '2d', unread: false,
    subject: 'Team dinner reservation confirmed',
    preview: "Got us a table at Osteria Francescana for 8 people, Friday 7pm. Please RSVP by Thursday so I...",
    body: `<div class="text-sm text-warm-700 leading-relaxed space-y-4">
      <p>Hey everyone!</p>
      <p>Got us a table at Osteria Francescana for 8 people, this Friday at 7 PM. It's the Italian place near the office that Lisa recommended.</p>
      <p><strong>Details:</strong></p>
      <ul class="list-disc pl-5 space-y-1">
        <li>Date: Friday, Feb 27</li>
        <li>Time: 7:00 PM</li>
        <li>Location: 123 Main St (5 min walk from office)</li>
        <li>Budget: Company-covered up to $50/person</li>
      </ul>
      <p>Please RSVP by Thursday so I can adjust the reservation if needed. Menu has great vegetarian options too.</p>
      <p>See you there!</p>
      <p>Tom</p>
    </div>`
  },
  {
    id: 8, sender: 'Emily Park', initials: 'EP', color: 'bg-teal-600', email: 'emily.park@company.com',
    to: 'product@company.com', date: 'Feb 21, 2026 at 3:20 PM', time: '3d', unread: false,
    subject: 'User research findings - Dashboard v2',
    preview: "Attached the full report. Key insight: 73% of users want customizable widgets. Scheduling a...",
    body: `<div class="text-sm text-warm-700 leading-relaxed space-y-4">
      <p>Hi product team,</p>
      <p>The Dashboard v2 user research is complete. We interviewed 24 users across 3 segments (startup, SMB, enterprise). Key findings:</p>
      <p><strong>Top Insights:</strong></p>
      <ol class="list-decimal pl-5 space-y-1">
        <li><strong>73% want customizable widgets</strong> - The #1 feature request. Users want to drag and rearrange dashboard cards.</li>
        <li><strong>Real-time data is critical</strong> - 82% said they check the dashboard multiple times per day</li>
        <li><strong>Mobile experience matters</strong> - 45% access via phone, but current mobile UX is rated 3.2/10</li>
        <li><strong>Export functionality</strong> - 61% need PDF/CSV export for stakeholder reporting</li>
      </ol>
      <p>Scheduling a findings review session for next Tuesday. Full report is in the shared drive.</p>
      <p>Emily</p>
    </div>`
  },
  {
    id: 9, sender: 'GitHub', initials: 'GH', color: 'bg-gray-500', email: 'notifications@github.com',
    to: 'me@company.com', date: 'Feb 21, 2026 at 11:05 AM', time: '3d', unread: false,
    subject: '[mailpulse/api] PR #247 merged',
    preview: 'Pull request "feat: add batch email endpoint" has been merged into main by davidkuo. 14 files...',
    body: `<div class="text-sm text-warm-700 leading-relaxed space-y-4">
      <div class="bg-warm-50 rounded-lg p-4 border border-warm-200">
        <div class="flex items-center gap-2 mb-2">
          <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 16 16"><path d="M5 3.254V3.25v.005a.75.75 0 110-.005v.004zm.45 1.9a2.25 2.25 0 10-1.95.218v5.256a2.25 2.25 0 101.5 0V7.123A5.735 5.735 0 009.25 9h1.378a2.251 2.251 0 100-1.5H9.25a4.25 4.25 0 01-3.8-2.346zM12.75 9a.75.75 0 100-1.5.75.75 0 000 1.5zm-8.5 4.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg>
          <span class="font-semibold text-purple-700">Merged</span>
        </div>
        <p class="font-medium">feat: add batch email endpoint <span class="text-warm-400 font-normal">#247</span></p>
      </div>
      <p><strong>davidkuo</strong> merged this pull request into <code class="bg-warm-100 px-1.5 py-0.5 rounded text-xs">main</code> from <code class="bg-warm-100 px-1.5 py-0.5 rounded text-xs">feat/batch-email</code></p>
      <p>14 files changed: +892 -34</p>
      <p class="text-warm-500">Reviewers: alex-kim (approved), james-wang (approved)</p>
    </div>`
  }
];

// Current state
let currentEmailId = 0;

function selectEmail(id) {
  currentEmailId = id;
  const email = emails[id];

  // Update list selection
  document.querySelectorAll('.email-item').forEach(el => {
    el.classList.remove('active');
    if (parseInt(el.dataset.id) === id) {
      el.classList.add('active');
    }
  });

  // Update content panel
  document.getElementById('emailSubject').textContent = email.subject;
  document.getElementById('emailAvatar').className = 'avatar ' + email.color + ' mt-0.5';
  document.getElementById('emailAvatar').textContent = email.initials;
  document.getElementById('emailSender').textContent = email.sender;
  document.getElementById('emailAddress').textContent = '<' + email.email + '>';
  document.getElementById('emailTo').textContent = 'To: ' + email.to;
  document.getElementById('emailDate').textContent = email.date;
  document.getElementById('emailBody').innerHTML = email.body;
}

function selectFolder(el) {
  document.querySelectorAll('.folder-item').forEach(f => f.classList.remove('active'));
  el.classList.add('active');
}

// Compose modal
document.getElementById('composeBtn').addEventListener('click', function() {
  document.getElementById('composeModal').classList.remove('hidden');
});

function closeCompose() {
  document.getElementById('composeModal').classList.add('hidden');
}

// Keyboard shortcut: Escape to close compose
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeCompose();
});
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
