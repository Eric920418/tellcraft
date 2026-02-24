INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '416c7690-2144-4247-b077-4fcd1d3ed1ea',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TeamSpace - Activity Feed</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { nunito: ['Nunito', 'sans-serif'] },
      colors: {
        brand: { 50:'#eff6ff', 100:'#dbeafe', 200:'#bfdbfe', 300:'#93c5fd', 400:'#60a5fa', 500:'#3b82f6', 600:'#2563eb', 700:'#1d4ed8' },
        success: { 50:'#f0fdf4', 100:'#dcfce7', 500:'#22c55e', 600:'#16a34a' },
        mention: { 50:'#fffbeb', 100:'#fef3c7', 500:'#f59e0b', 600:'#d97706' }
      }
    }
  }
}
</script>
<style>
* { font-family: 'Nunito', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
body { background: #f8fafc; }

/* Typing indicator bounce */
@keyframes bounce-dot {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}
.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #94a3b8;
  display: inline-block;
  animation: bounce-dot 1.4s infinite ease-in-out;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

/* Channel list */
.channel-item { transition: all 0.15s ease; cursor: pointer; }
.channel-item:hover { background: rgba(37, 99, 235, 0.06); }
.channel-item.active { background: rgba(37, 99, 235, 0.1); color: #2563eb; font-weight: 700; }

/* Feed entry */
.feed-entry { transition: all 0.15s ease; }
.feed-entry:hover { background: #f8fafc; }

/* Reaction button */
.reaction-btn { transition: all 0.15s ease; cursor: pointer; user-select: none; }
.reaction-btn:hover { background: #e2e8f0; transform: scale(1.1); }
.reaction-btn.reacted { background: #dbeafe; }

/* Online dot pulse */
@keyframes pulse-online {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
}
.online-dot { animation: pulse-online 2s infinite; }

/* Scrollbar */
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* Notification badge bounce */
@keyframes badge-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
.badge-notify { animation: badge-bounce 2s infinite; }
</style>
</head>
<body class="min-h-screen flex font-nunito">

<!-- LEFT SIDEBAR (200px) -->
<aside class="w-[200px] bg-white border-r border-gray-100 flex flex-col min-h-screen flex-shrink-0">
  <!-- Workspace header -->
  <div class="p-4 border-b border-gray-50">
    <div class="flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
      </div>
      <div>
        <div class="text-sm font-bold text-gray-800">TeamSpace</div>
        <div class="text-[10px] text-gray-400">Product Team</div>
      </div>
    </div>
  </div>

  <!-- Channels -->
  <nav class="flex-1 py-3 custom-scroll overflow-y-auto">
    <div class="px-3 mb-1">
      <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">Channels</div>
    </div>
    <div class="px-2 space-y-0.5" id="channel-list">
      <div class="channel-item active flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px]" data-channel="general" onclick="selectChannel(this)">
        <span class="text-gray-400">#</span>
        <span class="flex-1">general</span>
        <span class="bg-brand-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">2</span>
      </div>
      <div class="channel-item flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-gray-500" data-channel="engineering" onclick="selectChannel(this)">
        <span class="text-gray-400">#</span>
        <span>engineering</span>
      </div>
      <div class="channel-item flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-gray-500" data-channel="design" onclick="selectChannel(this)">
        <span class="text-gray-400">#</span>
        <span>design</span>
      </div>
      <div class="channel-item flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-gray-500" data-channel="random" onclick="selectChannel(this)">
        <span class="text-gray-400">#</span>
        <span>random</span>
      </div>
    </div>

    <!-- Direct Messages -->
    <div class="px-3 mt-4 mb-1">
      <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">Direct Messages</div>
    </div>
    <div class="px-2 space-y-0.5">
      <div class="channel-item flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-gray-500 cursor-pointer">
        <span class="relative flex-shrink-0">
          <span class="w-5 h-5 rounded-full bg-pink-100 text-pink-600 text-[9px] flex items-center justify-center font-bold">S</span>
          <span class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success-500 border border-white online-dot"></span>
        </span>
        <span>Sarah Chen</span>
      </div>
      <div class="channel-item flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-gray-500 cursor-pointer">
        <span class="relative flex-shrink-0">
          <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[9px] flex items-center justify-center font-bold">M</span>
          <span class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success-500 border border-white online-dot"></span>
        </span>
        <span>Mike Ross</span>
      </div>
      <div class="channel-item flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-gray-500 cursor-pointer">
        <span class="relative flex-shrink-0">
          <span class="w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-[9px] flex items-center justify-center font-bold">L</span>
          <span class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-gray-300 border border-white"></span>
        </span>
        <span class="text-gray-400">Lisa Park</span>
      </div>
    </div>
  </nav>
</aside>

<!-- CENTER: Top bar + Activity Feed -->
<div class="flex-1 flex flex-col min-h-screen">
  <!-- TOP BAR -->
  <header class="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-5 flex-shrink-0">
    <div class="flex items-center gap-3">
      <span class="text-[13px] font-bold text-gray-800"># general</span>
      <span class="text-[11px] text-gray-400">Team updates and activity</span>
    </div>
    <div class="flex items-center gap-3">
      <!-- Search -->
      <div class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 w-48">
        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" placeholder="Search..." class="bg-transparent text-[12px] text-gray-600 outline-none w-full placeholder-gray-400" id="search-input">
      </div>
      <!-- Notification bell -->
      <button class="relative p-1.5 rounded-lg hover:bg-gray-50 transition" onclick="toggleNotifications()">
        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
        <span class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center badge-notify">3</span>
      </button>
      <!-- User avatar -->
      <div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 text-sm flex items-center justify-center font-bold cursor-pointer hover:ring-2 hover:ring-brand-200 transition">
        Y
      </div>
    </div>
  </header>

  <!-- ACTIVITY FEED (Main View) -->
  <div class="flex-1 flex overflow-hidden">
    <div class="flex-1 flex flex-col">
      <!-- Feed entries -->
      <div class="flex-1 overflow-y-auto custom-scroll px-5 py-4 space-y-1" id="activity-feed">

        <!-- Entry 1: Task completed (green) -->
        <div class="feed-entry flex items-start gap-3 px-3 py-3 rounded-lg group">
          <div class="w-9 h-9 rounded-full bg-pink-100 text-pink-600 text-sm flex items-center justify-center font-bold flex-shrink-0">S</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[13px] font-bold text-gray-800">Sarah Chen</span>
              <span class="text-[13px] text-gray-500">completed</span>
              <span class="inline-flex items-center gap-1 bg-success-50 text-success-600 text-[12px] font-semibold px-2 py-0.5 rounded-full">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                API Documentation
              </span>
            </div>
            <div class="text-[11px] text-gray-400 mt-0.5">2 min ago</div>
            <!-- Reactions -->
            <div class="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="reaction-btn text-[12px] px-1.5 py-0.5 rounded-md bg-gray-100" onclick="toggleReaction(this)">&#128077;</span>
              <span class="reaction-btn text-[12px] px-1.5 py-0.5 rounded-md bg-gray-100" onclick="toggleReaction(this)">&#10084;&#65039;</span>
            </div>
          </div>
        </div>

        <!-- Entry 2: File shared (blue) -->
        <div class="feed-entry flex items-start gap-3 px-3 py-3 rounded-lg group">
          <div class="w-9 h-9 rounded-full bg-blue-100 text-blue-600 text-sm flex items-center justify-center font-bold flex-shrink-0">M</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[13px] font-bold text-gray-800">Mike Ross</span>
              <span class="text-[13px] text-gray-500">shared a file</span>
            </div>
            <!-- File card -->
            <div class="mt-2 inline-flex items-center gap-2.5 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2 cursor-pointer hover:bg-brand-100 transition">
              <svg class="w-5 h-5 text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>
              <div>
                <div class="text-[12px] font-semibold text-brand-700">Q1_report.pdf</div>
                <div class="text-[10px] text-brand-400">2.4 MB</div>
              </div>
            </div>
            <div class="text-[11px] text-gray-400 mt-1">15 min ago</div>
            <div class="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="reaction-btn text-[12px] px-1.5 py-0.5 rounded-md bg-gray-100" onclick="toggleReaction(this)">&#128077;</span>
              <span class="reaction-btn text-[12px] px-1.5 py-0.5 rounded-md bg-gray-100" onclick="toggleReaction(this)">&#10084;&#65039;</span>
            </div>
          </div>
        </div>

        <!-- Entry 3: Comment with preview -->
        <div class="feed-entry flex items-start gap-3 px-3 py-3 rounded-lg group">
          <div class="w-9 h-9 rounded-full bg-purple-100 text-purple-600 text-sm flex items-center justify-center font-bold flex-shrink-0">L</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[13px] font-bold text-gray-800">Lisa Park</span>
              <span class="text-[13px] text-gray-500">commented on</span>
              <span class="text-[13px] font-semibold text-brand-600 cursor-pointer hover:underline">Homepage Design</span>
            </div>
            <!-- Comment preview -->
            <div class="mt-2 bg-gray-50 border-l-2 border-brand-300 rounded-r-lg px-3 py-2">
              <p class="text-[12px] text-gray-600 leading-relaxed">The hero section looks great! Can we try a more subtle gradient for the CTA button? I think it would feel more cohesive with the overall palette.</p>
            </div>
            <div class="text-[11px] text-gray-400 mt-1">1h ago</div>
            <div class="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="reaction-btn text-[12px] px-1.5 py-0.5 rounded-md bg-gray-100" onclick="toggleReaction(this)">&#128077;</span>
              <span class="reaction-btn text-[12px] px-1.5 py-0.5 rounded-md bg-gray-100" onclick="toggleReaction(this)">&#10084;&#65039;</span>
            </div>
          </div>
        </div>

        <!-- Entry 4: System message - calendar event -->
        <div class="feed-entry flex items-start gap-3 px-3 py-3 rounded-lg">
          <div class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-[13px] text-gray-500">Team standup starts in <span class="font-semibold text-gray-700">30 minutes</span></span>
            </div>
            <div class="mt-1.5 inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-500">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Today at 2:00 PM &middot; Zoom
            </div>
            <div class="text-[11px] text-gray-400 mt-1">System</div>
          </div>
        </div>

        <!-- Entry 5: @mention (amber) -->
        <div class="feed-entry flex items-start gap-3 px-3 py-3 rounded-lg bg-mention-50/40 group">
          <div class="w-9 h-9 rounded-full bg-green-100 text-green-600 text-sm flex items-center justify-center font-bold flex-shrink-0">A</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[13px] font-bold text-gray-800">Alex Kim</span>
              <span class="text-[13px] text-gray-500">mentioned you in</span>
              <span class="text-[13px] font-semibold text-brand-600 cursor-pointer hover:underline">#design</span>
              <span class="inline-flex items-center gap-1 bg-mention-100 text-mention-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                @mention
              </span>
            </div>
            <div class="mt-2 bg-white border border-mention-200 rounded-lg px-3 py-2">
              <p class="text-[12px] text-gray-600"><span class="text-mention-600 font-semibold">@you</span> Can you review the updated wireframes for the settings page? I pushed the latest version.</p>
            </div>
            <div class="text-[11px] text-gray-400 mt-1">2h ago</div>
            <div class="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="reaction-btn text-[12px] px-1.5 py-0.5 rounded-md bg-gray-100" onclick="toggleReaction(this)">&#128077;</span>
              <span class="reaction-btn text-[12px] px-1.5 py-0.5 rounded-md bg-gray-100" onclick="toggleReaction(this)">&#10084;&#65039;</span>
            </div>
          </div>
        </div>

        <!-- Entry 6: Another completion -->
        <div class="feed-entry flex items-start gap-3 px-3 py-3 rounded-lg group">
          <div class="w-9 h-9 rounded-full bg-blue-100 text-blue-600 text-sm flex items-center justify-center font-bold flex-shrink-0">M</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[13px] font-bold text-gray-800">Mike Ross</span>
              <span class="text-[13px] text-gray-500">pushed 3 commits to</span>
              <span class="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[12px] font-mono px-2 py-0.5 rounded">
                feat/auth-flow
              </span>
            </div>
            <div class="text-[11px] text-gray-400 mt-0.5">3h ago</div>
            <div class="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="reaction-btn text-[12px] px-1.5 py-0.5 rounded-md bg-gray-100" onclick="toggleReaction(this)">&#128077;</span>
              <span class="reaction-btn text-[12px] px-1.5 py-0.5 rounded-md bg-gray-100" onclick="toggleReaction(this)">&#10084;&#65039;</span>
            </div>
          </div>
        </div>

        <!-- TYPING INDICATOR (Signature Element) -->
        <div class="flex items-center gap-3 px-3 py-2" id="typing-indicator">
          <div class="w-9 h-9 rounded-full bg-pink-100 text-pink-600 text-sm flex items-center justify-center font-bold flex-shrink-0">S</div>
          <div class="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
            <span class="text-[12px] text-gray-500 font-medium">Sarah is typing</span>
            <span class="flex items-center gap-1 ml-0.5">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </span>
          </div>
        </div>

      </div>

      <!-- MESSAGE INPUT (Bottom bar) -->
      <div class="border-t border-gray-100 bg-white px-5 py-3 flex-shrink-0">
        <div class="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-brand-200 transition">
          <!-- Attach -->
          <button class="p-1.5 rounded-lg hover:bg-gray-200 transition text-gray-400 hover:text-gray-600" title="Attach file">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <!-- Text input -->
          <input type="text" placeholder="Message #general..." class="flex-1 bg-transparent text-[13px] text-gray-700 outline-none placeholder-gray-400" id="message-input">
          <!-- Emoji -->
          <button class="p-1.5 rounded-lg hover:bg-gray-200 transition text-gray-400 hover:text-gray-600" title="Add emoji">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>
          </button>
          <!-- Send -->
          <button class="bg-brand-600 hover:bg-brand-700 text-white p-1.5 rounded-lg transition" id="send-btn" title="Send message">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- RIGHT SIDEBAR (240px) -->
    <aside class="w-[240px] bg-white border-l border-gray-100 flex-shrink-0 overflow-y-auto custom-scroll py-4">
      <!-- Team Members Online -->
      <div class="px-4 mb-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Team Members</span>
          <span class="text-[11px] text-gray-400">5 / 8 online</span>
        </div>
        <div class="space-y-2.5">
          <div class="flex items-center gap-2.5">
            <span class="relative flex-shrink-0">
              <span class="w-7 h-7 rounded-full bg-pink-100 text-pink-600 text-[10px] flex items-center justify-center font-bold">S</span>
              <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success-500 border-2 border-white online-dot"></span>
            </span>
            <div><div class="text-[12px] font-semibold text-gray-700">Sarah Chen</div><div class="text-[10px] text-gray-400">Design Lead</div></div>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="relative flex-shrink-0">
              <span class="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-[10px] flex items-center justify-center font-bold">M</span>
              <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success-500 border-2 border-white online-dot"></span>
            </span>
            <div><div class="text-[12px] font-semibold text-gray-700">Mike Ross</div><div class="text-[10px] text-gray-400">Frontend Dev</div></div>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="relative flex-shrink-0">
              <span class="w-7 h-7 rounded-full bg-green-100 text-green-600 text-[10px] flex items-center justify-center font-bold">A</span>
              <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success-500 border-2 border-white online-dot"></span>
            </span>
            <div><div class="text-[12px] font-semibold text-gray-700">Alex Kim</div><div class="text-[10px] text-gray-400">UX Designer</div></div>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="relative flex-shrink-0">
              <span class="w-7 h-7 rounded-full bg-amber-100 text-amber-600 text-[10px] flex items-center justify-center font-bold">J</span>
              <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success-500 border-2 border-white online-dot"></span>
            </span>
            <div><div class="text-[12px] font-semibold text-gray-700">Jordan Lee</div><div class="text-[10px] text-gray-400">Backend Dev</div></div>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="relative flex-shrink-0">
              <span class="w-7 h-7 rounded-full bg-brand-100 text-brand-600 text-[10px] flex items-center justify-center font-bold">Y</span>
              <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success-500 border-2 border-white online-dot"></span>
            </span>
            <div><div class="text-[12px] font-semibold text-gray-700">You</div><div class="text-[10px] text-gray-400">Product Manager</div></div>
          </div>
          <!-- Offline members -->
          <div class="flex items-center gap-2.5 opacity-50">
            <span class="relative flex-shrink-0">
              <span class="w-7 h-7 rounded-full bg-purple-100 text-purple-600 text-[10px] flex items-center justify-center font-bold">L</span>
              <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-white"></span>
            </span>
            <div><div class="text-[12px] font-semibold text-gray-700">Lisa Park</div><div class="text-[10px] text-gray-400">Copywriter</div></div>
          </div>
          <div class="flex items-center gap-2.5 opacity-50">
            <span class="relative flex-shrink-0">
              <span class="w-7 h-7 rounded-full bg-red-100 text-red-600 text-[10px] flex items-center justify-center font-bold">R</span>
              <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-white"></span>
            </span>
            <div><div class="text-[12px] font-semibold text-gray-700">Rachel Wu</div><div class="text-[10px] text-gray-400">QA Engineer</div></div>
          </div>
          <div class="flex items-center gap-2.5 opacity-50">
            <span class="relative flex-shrink-0">
              <span class="w-7 h-7 rounded-full bg-teal-100 text-teal-600 text-[10px] flex items-center justify-center font-bold">D</span>
              <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-white"></span>
            </span>
            <div><div class="text-[12px] font-semibold text-gray-700">David Cheng</div><div class="text-[10px] text-gray-400">DevOps</div></div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="border-t border-gray-50 mx-4 mb-4"></div>

      <!-- Pinned Items -->
      <div class="px-4 mb-5">
        <div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Pinned</div>
        <div class="space-y-2">
          <div class="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
            <svg class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <div>
              <div class="text-[12px] font-semibold text-gray-700 leading-tight">Sprint Goals v4</div>
              <div class="text-[10px] text-gray-400">Pinned by Sarah &middot; 3d ago</div>
            </div>
          </div>
          <div class="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
            <svg class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <div>
              <div class="text-[12px] font-semibold text-gray-700 leading-tight">Design System Link</div>
              <div class="text-[10px] text-gray-400">Pinned by Alex &middot; 1w ago</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="border-t border-gray-50 mx-4 mb-4"></div>

      <!-- Recent Files -->
      <div class="px-4">
        <div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Files</div>
        <div class="space-y-2">
          <div class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
            <svg class="w-4 h-4 text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
            <div class="min-w-0">
              <div class="text-[12px] font-semibold text-gray-700 truncate">Q1_report.pdf</div>
              <div class="text-[10px] text-gray-400">Mike &middot; 15m ago</div>
            </div>
          </div>
          <div class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
            <svg class="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <div class="min-w-0">
              <div class="text-[12px] font-semibold text-gray-700 truncate">homepage-v3.fig</div>
              <div class="text-[10px] text-gray-400">Sarah &middot; 1h ago</div>
            </div>
          </div>
          <div class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
            <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13h2v4H8z M14 11h2v6h-2z"/></svg>
            <div class="min-w-0">
              <div class="text-[12px] font-semibold text-gray-700 truncate">metrics-feb.xlsx</div>
              <div class="text-[10px] text-gray-400">Jordan &middot; 4h ago</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>
</div>

<script>
// Channel selection
function selectChannel(el) {
  document.querySelectorAll('.channel-item').forEach(function(item) {
    item.classList.remove('active');
  });
  el.classList.add('active');
  var channelName = el.getAttribute('data-channel') || el.textContent.trim();
  var headerLabel = document.querySelector('header .text-\\[13px\\].font-bold');
  if (headerLabel && el.getAttribute('data-channel')) {
    headerLabel.textContent = '# ' + el.getAttribute('data-channel');
  }
}

// Reaction toggle
function toggleReaction(btn) {
  btn.classList.toggle('reacted');
  if (btn.classList.contains('reacted')) {
    var count = btn.getAttribute('data-count');
    if (!count) {
      btn.setAttribute('data-count', '1');
      btn.innerHTML = btn.innerHTML.trim() + ' <span class="text-[10px] text-gray-500">1</span>';
    }
  } else {
    var span = btn.querySelector('span');
    if (span) span.remove();
    btn.removeAttribute('data-count');
  }
}

// Notification toggle
function toggleNotifications() {
  var badge = document.querySelector('.badge-notify');
  if (badge) {
    badge.style.display = badge.style.display === 'none' ? 'flex' : 'none';
  }
}

// Message input focus effect
var messageInput = document.getElementById('message-input');
if (messageInput) {
  messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && this.value.trim()) {
      addFeedEntry(this.value.trim());
      this.value = '';
    }
  });
}

// Send button
var sendBtn = document.getElementById('send-btn');
if (sendBtn) {
  sendBtn.addEventListener('click', function() {
    var input = document.getElementById('message-input');
    if (input && input.value.trim()) {
      addFeedEntry(input.value.trim());
      input.value = '';
    }
  });
}

// Add new feed entry
function addFeedEntry(text) {
  var feed = document.getElementById('activity-feed');
  var typing = document.getElementById('typing-indicator');
  var entry = document.createElement('div');
  entry.className = 'feed-entry flex items-start gap-3 px-3 py-3 rounded-lg group';
  entry.innerHTML = '<div class="w-9 h-9 rounded-full bg-brand-100 text-brand-600 text-sm flex items-center justify-center font-bold flex-shrink-0">Y</div>' +
    '<div class="flex-1 min-w-0">' +
    '<div class="flex items-center gap-2"><span class="text-[13px] font-bold text-gray-800">You</span><span class="text-[13px] text-gray-500">posted</span></div>' +
    '<div class="mt-1 text-[13px] text-gray-700">' + text + '</div>' +
    '<div class="text-[11px] text-gray-400 mt-0.5">Just now</div>' +
    '</div>';
  feed.insertBefore(entry, typing);
  entry.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// Search input filter
var searchInput = document.getElementById('search-input');
if (searchInput) {
  searchInput.addEventListener('input', function() {
    var query = this.value.toLowerCase();
    document.querySelectorAll('.feed-entry').forEach(function(entry) {
      var text = entry.textContent.toLowerCase();
      entry.style.display = text.includes(query) ? '' : 'none';
    });
  });
}
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
