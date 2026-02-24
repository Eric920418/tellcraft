INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'ad59aa11-c881-48f9-b839-19f66d012600',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SupportDesk - Customer Support</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { work: ['Work Sans', 'sans-serif'] },
      colors: {
        teal: { 50:'#f0fdfa', 100:'#ccfbf1', 200:'#99f6e4', 300:'#5eead4', 400:'#2dd4bf', 500:'#14b8a6', 600:'#0d9488', 700:'#0f766e', 800:'#115e59', 900:'#134e4a' },
        desk: { bg:'#f9fafb', card:'#ffffff', border:'#e5e7eb' }
      }
    }
  }
}
</script>
<style>
* { font-family: 'Work Sans', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
body { background: #f9fafb; height: 100vh; overflow: hidden; }

/* SLA Bar animations */
@keyframes blink-urgent {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.sla-blink { animation: blink-urgent 1s ease-in-out infinite; }

/* Ticket list */
.ticket-item { transition: all 0.15s ease; cursor: pointer; border-left: 3px solid transparent; }
.ticket-item:hover { background: #f0fdfa; }
.ticket-item.active { background: #f0fdfa; border-left-color: #0f766e; }

/* Tab buttons */
.tab-btn { transition: all 0.15s; }
.tab-btn.active { color: #0f766e; border-bottom-color: #0f766e; }
.tab-btn:hover:not(.active) { color: #115e59; }

/* Message bubbles */
.msg-customer { background: #f3f4f6; border-radius: 12px 12px 12px 2px; }
.msg-agent { background: #0f766e; color: white; border-radius: 12px 12px 2px 12px; }
.msg-internal { background: #fef9c3; border: 1px dashed #f59e0b; border-radius: 8px; }

/* Reply toggle */
.reply-toggle { transition: all 0.15s; }
.reply-toggle.active { background: #0f766e; color: white; }

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>
</head>
<body class="flex flex-col h-screen">

<!-- Top Bar -->
<header class="bg-white border-b border-gray-200 flex items-center justify-between px-5 py-2.5 flex-shrink-0">
  <div class="flex items-center gap-6">
    <!-- Logo -->
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/></svg>
      </div>
      <span class="font-bold text-gray-800 text-[15px] tracking-tight">SupportDesk</span>
    </div>

    <!-- Tabs -->
    <nav class="flex items-center gap-1">
      <button class="tab-btn active text-sm font-medium px-3 py-2 border-b-2 border-teal-700 text-teal-700" onclick="switchTab(this,'open')">Open <span class="text-xs font-semibold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full ml-1">12</span></button>
      <button class="tab-btn text-sm font-medium px-3 py-2 border-b-2 border-transparent text-gray-400" onclick="switchTab(this,'pending')">Pending <span class="text-xs font-semibold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full ml-1">5</span></button>
      <button class="tab-btn text-sm font-medium px-3 py-2 border-b-2 border-transparent text-gray-400" onclick="switchTab(this,'resolved')">Resolved <span class="text-xs font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full ml-1">48</span></button>
    </nav>
  </div>

  <div class="flex items-center gap-3">
    <!-- Search -->
    <div class="relative">
      <svg class="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
      <input type="text" placeholder="Search tickets..." class="bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm w-52 outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition">
    </div>
    <!-- New Ticket -->
    <button class="bg-teal-700 hover:bg-teal-800 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
      New Ticket
    </button>
    <!-- Agent avatar -->
    <div class="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">JW</div>
  </div>
</header>

<!-- Split View -->
<div class="flex flex-1 overflow-hidden">

  <!-- Left Panel - Ticket List (360px) -->
  <aside class="w-[360px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
    <!-- List header -->
    <div class="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
      <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">12 Open Tickets</span>
      <div class="flex items-center gap-1">
        <button class="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-50 transition">Newest</button>
        <button class="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-50 transition">SLA</button>
      </div>
    </div>

    <!-- Ticket List -->
    <div class="flex-1 overflow-y-auto">

      <!-- Ticket 1 - URGENT, SLA critical (<1h, blinking) -->
      <div class="ticket-item active px-4 py-3 border-b border-gray-50" onclick="selectTicket(0, this)">
        <div class="flex items-start gap-2.5">
          <svg class="w-2.5 h-2.5 mt-1.5 flex-shrink-0" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#ef4444"/></svg>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-[13px] font-semibold text-gray-800 truncate">Sarah Mitchell</span>
              <span class="text-[10px] text-gray-400 flex-shrink-0">5m ago</span>
            </div>
            <p class="text-[12px] text-gray-700 font-medium truncate mt-0.5">Payment gateway returning 500 errors</p>
            <div class="flex items-center justify-between mt-1.5">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">URGENT</span>
                <span class="text-[10px] text-red-500 font-semibold">32m left</span>
              </div>
              <div class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0">MK</div>
            </div>
            <!-- SLA Bar - Critical, blinking -->
            <div class="w-full h-[3px] bg-gray-100 rounded-full mt-1.5 overflow-hidden">
              <div class="h-full bg-red-500 rounded-full sla-blink" style="width: 15%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ticket 2 - URGENT, SLA warning (1-4h) -->
      <div class="ticket-item px-4 py-3 border-b border-gray-50" onclick="selectTicket(1, this)">
        <div class="flex items-start gap-2.5">
          <svg class="w-2.5 h-2.5 mt-1.5 flex-shrink-0" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#ef4444"/></svg>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-[13px] font-semibold text-gray-800 truncate">James Rodriguez</span>
              <span class="text-[10px] text-gray-400 flex-shrink-0">18m ago</span>
            </div>
            <p class="text-[12px] text-gray-700 font-medium truncate mt-0.5">Cannot access admin dashboard after update</p>
            <div class="flex items-center justify-between mt-1.5">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">URGENT</span>
                <span class="text-[10px] text-amber-600 font-semibold">1h 48m left</span>
              </div>
              <div class="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0">AL</div>
            </div>
            <!-- SLA Bar - Warning -->
            <div class="w-full h-[3px] bg-gray-100 rounded-full mt-1.5 overflow-hidden">
              <div class="h-full bg-amber-400 rounded-full" style="width: 38%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ticket 3 - Normal, SLA healthy -->
      <div class="ticket-item px-4 py-3 border-b border-gray-50" onclick="selectTicket(2, this)">
        <div class="flex items-start gap-2.5">
          <svg class="w-2.5 h-2.5 mt-1.5 flex-shrink-0" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#f59e0b"/></svg>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-[13px] font-semibold text-gray-800 truncate">Emily Chen</span>
              <span class="text-[10px] text-gray-400 flex-shrink-0">35m ago</span>
            </div>
            <p class="text-[12px] text-gray-700 font-medium truncate mt-0.5">SSO integration not syncing user roles</p>
            <div class="flex items-center justify-between mt-1.5">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-semibold">NORMAL</span>
                <span class="text-[10px] text-teal-600 font-medium">6h 20m left</span>
              </div>
              <div class="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0">JW</div>
            </div>
            <!-- SLA Bar - Healthy -->
            <div class="w-full h-[3px] bg-gray-100 rounded-full mt-1.5 overflow-hidden">
              <div class="h-full bg-teal-500 rounded-full" style="width: 78%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ticket 4 - Normal, SLA warning -->
      <div class="ticket-item px-4 py-3 border-b border-gray-50" onclick="selectTicket(3, this)">
        <div class="flex items-start gap-2.5">
          <svg class="w-2.5 h-2.5 mt-1.5 flex-shrink-0" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#f59e0b"/></svg>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-[13px] font-semibold text-gray-800 truncate">David Park</span>
              <span class="text-[10px] text-gray-400 flex-shrink-0">1h ago</span>
            </div>
            <p class="text-[12px] text-gray-700 font-medium truncate mt-0.5">Export CSV missing last 3 columns</p>
            <div class="flex items-center justify-between mt-1.5">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-semibold">NORMAL</span>
                <span class="text-[10px] text-amber-600 font-semibold">2h 10m left</span>
              </div>
              <div class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0">MK</div>
            </div>
            <!-- SLA Bar - Warning (approaching) -->
            <div class="w-full h-[3px] bg-gray-100 rounded-full mt-1.5 overflow-hidden">
              <div class="h-full bg-amber-400 rounded-full" style="width: 45%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ticket 5 - Low, SLA healthy -->
      <div class="ticket-item px-4 py-3 border-b border-gray-50" onclick="selectTicket(4, this)">
        <div class="flex items-start gap-2.5">
          <svg class="w-2.5 h-2.5 mt-1.5 flex-shrink-0" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#22c55e"/></svg>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-[13px] font-semibold text-gray-800 truncate">Lisa Wang</span>
              <span class="text-[10px] text-gray-400 flex-shrink-0">2h ago</span>
            </div>
            <p class="text-[12px] text-gray-700 font-medium truncate mt-0.5">How to set up webhook notifications?</p>
            <div class="flex items-center justify-between mt-1.5">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-semibold">LOW</span>
                <span class="text-[10px] text-teal-600 font-medium">22h left</span>
              </div>
              <div class="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0">TS</div>
            </div>
            <!-- SLA Bar - Very healthy -->
            <div class="w-full h-[3px] bg-gray-100 rounded-full mt-1.5 overflow-hidden">
              <div class="h-full bg-teal-500 rounded-full" style="width: 92%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ticket 6 - Urgent, SLA critical -->
      <div class="ticket-item px-4 py-3 border-b border-gray-50" onclick="selectTicket(5, this)">
        <div class="flex items-start gap-2.5">
          <svg class="w-2.5 h-2.5 mt-1.5 flex-shrink-0" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#ef4444"/></svg>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-[13px] font-semibold text-gray-800 truncate">Marcus Thompson</span>
              <span class="text-[10px] text-gray-400 flex-shrink-0">42m ago</span>
            </div>
            <p class="text-[12px] text-gray-700 font-medium truncate mt-0.5">Data loss after API migration</p>
            <div class="flex items-center justify-between mt-1.5">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">URGENT</span>
                <span class="text-[10px] text-red-500 font-semibold">18m left</span>
              </div>
              <div class="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0">AL</div>
            </div>
            <!-- SLA Bar - Critical, blinking -->
            <div class="w-full h-[3px] bg-gray-100 rounded-full mt-1.5 overflow-hidden">
              <div class="h-full bg-red-500 rounded-full sla-blink" style="width: 8%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ticket 7 - Normal, SLA healthy -->
      <div class="ticket-item px-4 py-3 border-b border-gray-50" onclick="selectTicket(6, this)">
        <div class="flex items-start gap-2.5">
          <svg class="w-2.5 h-2.5 mt-1.5 flex-shrink-0" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#f59e0b"/></svg>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-[13px] font-semibold text-gray-800 truncate">Yuki Tanaka</span>
              <span class="text-[10px] text-gray-400 flex-shrink-0">3h ago</span>
            </div>
            <p class="text-[12px] text-gray-700 font-medium truncate mt-0.5">Billing invoice shows wrong currency</p>
            <div class="flex items-center justify-between mt-1.5">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-semibold">NORMAL</span>
                <span class="text-[10px] text-teal-600 font-medium">5h 15m left</span>
              </div>
              <div class="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0">JW</div>
            </div>
            <div class="w-full h-[3px] bg-gray-100 rounded-full mt-1.5 overflow-hidden">
              <div class="h-full bg-teal-500 rounded-full" style="width: 66%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ticket 8 - Low, SLA healthy -->
      <div class="ticket-item px-4 py-3 border-b border-gray-50" onclick="selectTicket(7, this)">
        <div class="flex items-start gap-2.5">
          <svg class="w-2.5 h-2.5 mt-1.5 flex-shrink-0" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#22c55e"/></svg>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-[13px] font-semibold text-gray-800 truncate">Anna Kowalski</span>
              <span class="text-[10px] text-gray-400 flex-shrink-0">5h ago</span>
            </div>
            <p class="text-[12px] text-gray-700 font-medium truncate mt-0.5">Feature request: dark mode support</p>
            <div class="flex items-center justify-between mt-1.5">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-semibold">LOW</span>
                <span class="text-[10px] text-teal-600 font-medium">19h left</span>
              </div>
              <div class="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0">TS</div>
            </div>
            <div class="w-full h-[3px] bg-gray-100 rounded-full mt-1.5 overflow-hidden">
              <div class="h-full bg-teal-500 rounded-full" style="width: 80%"></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </aside>

  <!-- Right Panel - Conversation Detail -->
  <main class="flex-1 flex flex-col bg-gray-50 overflow-hidden">

    <!-- Ticket Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-3">
        <span class="text-xs text-gray-400 font-mono">#TK-1847</span>
        <h2 class="text-[15px] font-semibold text-gray-800">Payment gateway returning 500 errors</h2>
        <span class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">URGENT</span>
        <span class="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">In Progress</span>
      </div>
      <div class="flex items-center gap-3">
        <!-- SLA countdown display -->
        <div class="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
          <svg class="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span class="text-xs font-bold text-red-600 sla-blink">32m remaining</span>
        </div>
        <!-- Assigned to -->
        <div class="flex items-center gap-1.5">
          <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">MK</div>
          <span class="text-xs text-gray-500">Mike K.</span>
        </div>
        <!-- More actions -->
        <button class="text-gray-400 hover:text-gray-600 transition cursor-pointer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
        </button>
      </div>
    </div>

    <!-- Ticket Metadata -->
    <div class="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-6 flex-shrink-0">
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] text-gray-400">Requester:</span>
        <span class="text-[11px] font-medium text-gray-700">Sarah Mitchell</span>
        <span class="text-[10px] text-gray-400">(sarah@acmecorp.com)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] text-gray-400">Company:</span>
        <span class="text-[11px] font-medium text-gray-700">Acme Corp</span>
        <span class="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">Enterprise</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] text-gray-400">Created:</span>
        <span class="text-[11px] text-gray-600">Today 14:23</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] text-gray-400">Tags:</span>
        <span class="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">payment</span>
        <span class="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">api</span>
        <span class="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">production</span>
      </div>
    </div>

    <!-- Conversation Thread -->
    <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">

      <!-- Customer Message 1 -->
      <div class="flex gap-3 max-w-2xl">
        <div class="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold flex-shrink-0">SM</div>
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[12px] font-semibold text-gray-700">Sarah Mitchell</span>
            <span class="text-[10px] text-gray-400">Today 14:23</span>
          </div>
          <div class="msg-customer px-4 py-3 text-[13px] text-gray-700 leading-relaxed">
            Hi, our payment gateway has been returning 500 errors for the last 30 minutes. All checkout attempts are failing across our production environment. This is impacting our revenue directly - we need this resolved ASAP.
            <div class="mt-2 bg-gray-200/50 rounded-lg px-3 py-2 text-[11px] font-mono text-gray-600">
              Error: POST /api/v2/payments - 500 Internal Server Error<br>
              Trace: gateway_timeout at stripe_proxy:443
            </div>
          </div>
        </div>
      </div>

      <!-- Agent Reply 1 -->
      <div class="flex gap-3 max-w-2xl ml-auto flex-row-reverse">
        <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">MK</div>
        <div>
          <div class="flex items-center gap-2 mb-1 justify-end">
            <span class="text-[10px] text-gray-400">Today 14:28</span>
            <span class="text-[12px] font-semibold text-gray-700">Mike Kim</span>
            <span class="text-[9px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">Agent</span>
          </div>
          <div class="msg-agent px-4 py-3 text-[13px] leading-relaxed">
            Hi Sarah, I can see the elevated error rates on our monitoring dashboard. I'm escalating this to our infrastructure team immediately. In the meantime, can you confirm:
            <ol class="mt-1.5 ml-4 space-y-0.5 list-decimal">
              <li>Is this affecting all payment methods or just card payments?</li>
              <li>Did you deploy any changes in the last hour?</li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Customer Reply 2 -->
      <div class="flex gap-3 max-w-2xl">
        <div class="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold flex-shrink-0">SM</div>
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[12px] font-semibold text-gray-700">Sarah Mitchell</span>
            <span class="text-[10px] text-gray-400">Today 14:31</span>
          </div>
          <div class="msg-customer px-4 py-3 text-[13px] text-gray-700 leading-relaxed">
            All payment methods are down - cards, PayPal, and bank transfers. No deployments on our side. This started exactly at 13:55 UTC. Our checkout conversion has dropped to zero.
          </div>
        </div>
      </div>

      <!-- Internal Note -->
      <div class="max-w-2xl mx-8">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-[9px] bg-amber-400 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Internal Note</span>
          <span class="text-[12px] font-semibold text-gray-600">Mike Kim</span>
          <span class="text-[10px] text-gray-400">Today 14:35</span>
        </div>
        <div class="msg-internal px-4 py-3 text-[13px] text-amber-900 leading-relaxed">
          <strong>@infra-team</strong> - Confirmed this is related to the Stripe proxy upgrade rolled out at 13:50 UTC. The new TLS cert is being rejected by our gateway middleware. Rolling back now. ETA for fix: ~15 minutes.
        </div>
      </div>

      <!-- Agent Reply 2 -->
      <div class="flex gap-3 max-w-2xl ml-auto flex-row-reverse">
        <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">MK</div>
        <div>
          <div class="flex items-center gap-2 mb-1 justify-end">
            <span class="text-[10px] text-gray-400">Today 14:38</span>
            <span class="text-[12px] font-semibold text-gray-700">Mike Kim</span>
            <span class="text-[9px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">Agent</span>
          </div>
          <div class="msg-agent px-4 py-3 text-[13px] leading-relaxed">
            Sarah, we've identified the root cause - it's a TLS certificate issue on our payment proxy that was introduced in a recent infrastructure update. Our team is actively rolling it back right now. I expect payments to be fully restored within 15 minutes. I'll keep you updated.
          </div>
        </div>
      </div>

      <!-- Customer Reply 3 -->
      <div class="flex gap-3 max-w-2xl">
        <div class="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold flex-shrink-0">SM</div>
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[12px] font-semibold text-gray-700">Sarah Mitchell</span>
            <span class="text-[10px] text-gray-400">Today 14:40</span>
          </div>
          <div class="msg-customer px-4 py-3 text-[13px] text-gray-700 leading-relaxed">
            Thanks for the quick response Mike. We're losing roughly $2K/minute so the sooner the better. Will you also provide an incident report afterwards?
          </div>
        </div>
      </div>

    </div>

    <!-- Reply Box -->
    <div class="bg-white border-t border-gray-200 px-6 py-3 flex-shrink-0">
      <!-- Reply / Internal Note toggle -->
      <div class="flex items-center gap-1 mb-2.5">
        <button id="btn-reply" class="reply-toggle active text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer" onclick="toggleReplyMode('reply')">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg>
            Reply
          </span>
        </button>
        <button id="btn-note" class="reply-toggle text-xs font-medium px-3 py-1.5 rounded-lg text-gray-400 bg-gray-50 cursor-pointer" onclick="toggleReplyMode('note')">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
            Internal Note
          </span>
        </button>
      </div>
      <!-- Input area -->
      <div class="flex gap-3">
        <div id="reply-box" class="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none min-h-[42px] flex items-center" contenteditable="true" data-placeholder="Type your reply to Sarah..."></div>
        <div class="flex items-end gap-2">
          <button class="text-gray-400 hover:text-gray-600 transition cursor-pointer p-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/></svg>
          </button>
          <button id="send-btn" class="bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
            Send Reply
          </button>
        </div>
      </div>
    </div>

  </main>
</div>

<script>
// Tab switching
function switchTab(el, tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active', 'text-teal-700', 'border-teal-700');
    btn.classList.add('text-gray-400', 'border-transparent');
  });
  el.classList.add('active', 'text-teal-700', 'border-teal-700');
  el.classList.remove('text-gray-400', 'border-transparent');
}

// Ticket selection
function selectTicket(index, el) {
  document.querySelectorAll('.ticket-item').forEach(item => item.classList.remove('active'));
  el.classList.add('active');
}

// Reply / Internal Note toggle
function toggleReplyMode(mode) {
  const btnReply = document.getElementById('btn-reply');
  const btnNote = document.getElementById('btn-note');
  const replyBox = document.getElementById('reply-box');
  const sendBtn = document.getElementById('send-btn');

  if (mode === 'reply') {
    btnReply.classList.add('active');
    btnReply.classList.remove('text-gray-400', 'bg-gray-50');
    btnNote.classList.remove('active');
    btnNote.classList.add('text-gray-400', 'bg-gray-50');
    replyBox.setAttribute('data-placeholder', 'Type your reply to Sarah...');
    replyBox.style.borderColor = '';
    replyBox.style.background = '';
    sendBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg> Send Reply';
    sendBtn.className = 'bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5';
  } else {
    btnNote.classList.add('active');
    btnNote.classList.remove('text-gray-400', 'bg-gray-50');
    btnReply.classList.remove('active');
    btnReply.classList.add('text-gray-400', 'bg-gray-50');
    replyBox.setAttribute('data-placeholder', 'Add an internal note...');
    replyBox.style.borderColor = '#f59e0b';
    replyBox.style.background = '#fefce8';
    sendBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg> Add Note';
    sendBtn.className = 'bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5';
  }
}

// Placeholder for contenteditable
const replyBox = document.getElementById('reply-box');
replyBox.addEventListener('focus', function() {
  if (this.textContent.trim() === '') this.textContent = '';
});
replyBox.addEventListener('blur', function() {
  if (this.textContent.trim() === '') this.textContent = '';
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
