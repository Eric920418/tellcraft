INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'fba66d17-4111-4242-8b19-cdb967245b90',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ChatBot Builder</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { inter: ['Inter', 'sans-serif'], fira: ['Fira Code', 'monospace'] },
      colors: {
        violet: { 50:'#f5f3ff', 100:'#ede9fe', 200:'#ddd6fe', 300:'#c4b5fd', 400:'#a78bfa', 500:'#7c3aed', 600:'#6d28d9', 700:'#5b21b6' },
        warm: { 50:'#fefdfb', 100:'#faf8f5' }
      }
    }
  }
}
</script>
<style>
* { font-family: 'Inter', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
body { background: #fefdfb; }
.fira { font-family: 'Fira Code', monospace; }

@keyframes thinking-wave {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.4); opacity: 1; }
}
.thinking-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #7c3aed;
  animation: thinking-wave 1.2s ease-in-out infinite;
}
.thinking-dot:nth-child(2) { animation-delay: 0.15s; }
.thinking-dot:nth-child(3) { animation-delay: 0.3s; }

.msg-enter { animation: msgSlide 0.3s ease-out; }
@keyframes msgSlide {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.sidebar-item { transition: background 0.15s, color 0.15s; }
.sidebar-item:hover { background: #f5f3ff; }
.sidebar-item.active { background: #ede9fe; color: #7c3aed; }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
</style>
</head>
<body class="h-screen flex overflow-hidden">

<!-- Left Sidebar -->
<aside class="w-[220px] bg-white border-r border-gray-100 flex flex-col h-screen shrink-0">
  <!-- Logo -->
  <div class="px-4 py-3 border-b border-gray-50">
    <div class="flex items-center gap-2">
      <div class="w-7 h-7 rounded-lg bg-violet-500 flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
      </div>
      <span class="font-semibold text-gray-800 text-sm">ChatBot Builder</span>
    </div>
  </div>

  <!-- New Chat Button -->
  <div class="px-3 pt-3">
    <button onclick="startNewChat()" class="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-violet-300 text-violet-500 text-sm font-medium hover:bg-violet-50 transition cursor-pointer">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
      New Chat
    </button>
  </div>

  <!-- Conversation List -->
  <div class="flex-1 overflow-auto px-3 pt-3 pb-2">
    <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Recent</div>
    <div class="space-y-0.5" id="conv-list">
      <div class="sidebar-item active flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer" onclick="selectConv(this)">
        <svg class="w-3.5 h-3.5 text-violet-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
        <div class="min-w-0 flex-1">
          <div class="text-xs font-medium text-gray-700 truncate">Password reset help</div>
          <div class="text-[10px] text-gray-400 truncate">How do I reset my password?</div>
        </div>
        <span class="text-[10px] text-gray-300 shrink-0">2m</span>
      </div>
      <div class="sidebar-item flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer" onclick="selectConv(this)">
        <svg class="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
        <div class="min-w-0 flex-1">
          <div class="text-xs font-medium text-gray-700 truncate">Billing inquiry</div>
          <div class="text-[10px] text-gray-400 truncate">Can I upgrade my plan?</div>
        </div>
        <span class="text-[10px] text-gray-300 shrink-0">1h</span>
      </div>
      <div class="sidebar-item flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer" onclick="selectConv(this)">
        <svg class="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
        <div class="min-w-0 flex-1">
          <div class="text-xs font-medium text-gray-700 truncate">API integration</div>
          <div class="text-[10px] text-gray-400 truncate">How to connect webhook...</div>
        </div>
        <span class="text-[10px] text-gray-300 shrink-0">3h</span>
      </div>
      <div class="sidebar-item flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer" onclick="selectConv(this)">
        <svg class="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
        <div class="min-w-0 flex-1">
          <div class="text-xs font-medium text-gray-700 truncate">Feature request</div>
          <div class="text-[10px] text-gray-400 truncate">Multi-language support?</div>
        </div>
        <span class="text-[10px] text-gray-300 shrink-0">1d</span>
      </div>
    </div>
  </div>

  <!-- Bot Config Section -->
  <div class="border-t border-gray-100 px-3 py-3">
    <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-1 mb-2">Bot Config</div>
    <div class="space-y-1.5 text-[11px]">
      <div class="flex items-center justify-between px-2 py-1">
        <span class="text-gray-500">Personality</span>
        <span class="text-violet-600 font-medium">Friendly</span>
      </div>
      <div class="flex items-center justify-between px-2 py-1">
        <span class="text-gray-500">Knowledge Base</span>
        <span class="text-violet-600 font-medium">24 docs</span>
      </div>
      <div class="flex items-center justify-between px-2 py-1">
        <span class="text-gray-500">Response Length</span>
        <span class="text-violet-600 font-medium">Medium</span>
      </div>
    </div>
  </div>
</aside>

<!-- Main Content -->
<div class="flex-1 flex flex-col h-screen min-w-0">
  <!-- Top Bar -->
  <header class="h-12 bg-white border-b border-gray-100 flex items-center justify-between px-5 shrink-0">
    <div class="flex items-center gap-3">
      <div class="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
        <svg class="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.494 4.316a2.25 2.25 0 01-2.122 1.534H8.616a2.25 2.25 0 01-2.122-1.534L5 14.5m14 0H5"/></svg>
      </div>
      <div>
        <span class="text-sm font-semibold text-gray-800">Support Bot v2.1</span>
        <span class="inline-flex items-center gap-1 ml-2 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Active
        </span>
      </div>
    </div>
    <div class="flex items-center gap-1">
      <button class="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition cursor-pointer" title="Analytics">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
      </button>
      <button class="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition cursor-pointer" title="Settings">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      </button>
    </div>
  </header>

  <!-- Chat Area -->
  <div class="flex-1 flex min-h-0">
    <!-- Messages -->
    <div class="flex-1 flex flex-col min-w-0">
      <div class="flex-1 overflow-auto px-6 py-5" id="chat-messages">
        <div class="max-w-2xl mx-auto space-y-5">

          <!-- Bot Welcome -->
          <div class="flex gap-3 msg-enter">
            <div class="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.494 4.316a2.25 2.25 0 01-2.122 1.534H8.616a2.25 2.25 0 01-2.122-1.534L5 14.5m14 0H5"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-semibold text-gray-700">Support Bot</span>
                <span class="text-[10px] text-gray-400">10:30 AM</span>
              </div>
              <div class="bg-white border-l-[3px] border-violet-400 rounded-lg rounded-tl-none px-4 py-3 text-sm text-gray-700 leading-relaxed shadow-sm">
                Hi! I'm your support assistant. How can I help you today?
              </div>
            </div>
          </div>

          <!-- User Message -->
          <div class="flex gap-3 justify-end msg-enter">
            <div class="max-w-md">
              <div class="flex items-center gap-2 mb-1 justify-end">
                <span class="text-[10px] text-gray-400">10:32 AM</span>
                <span class="text-xs font-semibold text-gray-700">You</span>
              </div>
              <div class="bg-gray-100 rounded-lg rounded-tr-none px-4 py-3 text-sm text-gray-700 leading-relaxed">
                How do I reset my password?
              </div>
            </div>
            <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
            </div>
          </div>

          <!-- Bot Reply with code block -->
          <div class="flex gap-3 msg-enter">
            <div class="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.494 4.316a2.25 2.25 0 01-2.122 1.534H8.616a2.25 2.25 0 01-2.122-1.534L5 14.5m14 0H5"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-semibold text-gray-700">Support Bot</span>
                <span class="text-[10px] text-gray-400">10:32 AM</span>
              </div>
              <div class="bg-white border-l-[3px] border-violet-400 rounded-lg rounded-tl-none px-4 py-3 text-sm text-gray-700 leading-relaxed shadow-sm">
                <p class="mb-2">Here's how to reset your password:</p>
                <ol class="list-decimal list-inside space-y-1.5 mb-3">
                  <li>Go to the login page and click <strong>"Forgot Password"</strong></li>
                  <li>Enter the email address associated with your account</li>
                  <li>Check your inbox for the reset link (expires in 24 hours)</li>
                  <li>Click the link and set your new password</li>
                </ol>
                <p class="mb-2 text-gray-500 text-xs">Direct link:</p>
                <div class="bg-gray-900 rounded-md px-3 py-2 mt-1">
                  <code class="fira text-xs text-emerald-400">https://app.example.com/auth/reset-password</code>
                </div>
                <p class="mt-3 text-gray-500 text-xs">Your password must be at least 8 characters with one uppercase letter and one number.</p>
                <!-- Feedback -->
                <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <span class="text-[10px] text-gray-400">Was this helpful?</span>
                  <button onclick="this.classList.add('bg-violet-100','text-violet-600');this.nextElementSibling.classList.remove('bg-violet-100','text-violet-600')" class="p-1 rounded hover:bg-gray-100 text-gray-400 transition cursor-pointer text-xs">&#128077;</button>
                  <button onclick="this.classList.add('bg-violet-100','text-violet-600');this.previousElementSibling.classList.remove('bg-violet-100','text-violet-600')" class="p-1 rounded hover:bg-gray-100 text-gray-400 transition cursor-pointer text-xs">&#128078;</button>
                </div>
              </div>
            </div>
          </div>

          <!-- User Follow-up -->
          <div class="flex gap-3 justify-end msg-enter">
            <div class="max-w-md">
              <div class="flex items-center gap-2 mb-1 justify-end">
                <span class="text-[10px] text-gray-400">10:33 AM</span>
                <span class="text-xs font-semibold text-gray-700">You</span>
              </div>
              <div class="bg-gray-100 rounded-lg rounded-tr-none px-4 py-3 text-sm text-gray-700 leading-relaxed">
                Thanks! Can you also explain 2FA?
              </div>
            </div>
            <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
            </div>
          </div>

          <!-- Bot Reply with bullets and feedback -->
          <div class="flex gap-3 msg-enter">
            <div class="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.494 4.316a2.25 2.25 0 01-2.122 1.534H8.616a2.25 2.25 0 01-2.122-1.534L5 14.5m14 0H5"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-semibold text-gray-700">Support Bot</span>
                <span class="text-[10px] text-gray-400">10:33 AM</span>
              </div>
              <div class="bg-white border-l-[3px] border-violet-400 rounded-lg rounded-tl-none px-4 py-3 text-sm text-gray-700 leading-relaxed shadow-sm">
                <p class="mb-2"><strong>Two-Factor Authentication (2FA)</strong> adds an extra layer of security to your account.</p>
                <p class="mb-2 font-medium text-gray-800">How it works:</p>
                <ul class="space-y-1.5 mb-3">
                  <li class="flex gap-2"><span class="text-violet-400 shrink-0">&#x2022;</span><span><strong>SMS verification</strong> &mdash; receive a 6-digit code via text message</span></li>
                  <li class="flex gap-2"><span class="text-violet-400 shrink-0">&#x2022;</span><span><strong>Authenticator app</strong> &mdash; use Google Authenticator or Authy for time-based codes</span></li>
                  <li class="flex gap-2"><span class="text-violet-400 shrink-0">&#x2022;</span><span><strong>Security key</strong> &mdash; physical USB key (YubiKey, etc.) for maximum security</span></li>
                </ul>
                <p class="mb-2 text-gray-500 text-xs">To enable 2FA:</p>
                <div class="bg-gray-900 rounded-md px-3 py-2 mt-1">
                  <code class="fira text-xs text-emerald-400">Settings &gt; Security &gt; Two-Factor Authentication &gt; Enable</code>
                </div>
                <p class="mt-3 text-gray-500 text-xs">We recommend the authenticator app method for the best balance of security and convenience.</p>
                <!-- Feedback -->
                <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <span class="text-[10px] text-gray-400">Was this helpful?</span>
                  <button onclick="this.classList.add('bg-violet-100','text-violet-600');this.nextElementSibling.classList.remove('bg-violet-100','text-violet-600')" class="p-1 rounded hover:bg-gray-100 text-gray-400 transition cursor-pointer text-xs">&#128077;</button>
                  <button onclick="this.classList.add('bg-violet-100','text-violet-600');this.previousElementSibling.classList.remove('bg-violet-100','text-violet-600')" class="p-1 rounded hover:bg-gray-100 text-gray-400 transition cursor-pointer text-xs">&#128078;</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Thinking indicator (hidden by default, shown via JS) -->
          <div class="flex gap-3 msg-enter hidden" id="thinking-indicator">
            <div class="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.494 4.316a2.25 2.25 0 01-2.122 1.534H8.616a2.25 2.25 0 01-2.122-1.534L5 14.5m14 0H5"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-semibold text-gray-700">Support Bot</span>
                <span class="text-[10px] text-violet-400">is thinking...</span>
              </div>
              <div class="bg-white border-l-[3px] border-violet-300 rounded-lg rounded-tl-none px-4 py-4 shadow-sm inline-flex items-center gap-2">
                <div class="thinking-dot"></div>
                <div class="thinking-dot"></div>
                <div class="thinking-dot"></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Input Area -->
      <div class="border-t border-gray-100 bg-white px-6 py-3 shrink-0">
        <div class="max-w-2xl mx-auto">
          <div class="flex items-center gap-2">
            <button class="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-500 transition cursor-pointer" title="Attach file">
              <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/></svg>
            </button>
            <div class="flex-1 relative">
              <input type="text" id="msg-input" placeholder="Type a message..." class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition placeholder:text-gray-400" onkeydown="if(event.key==='Enter')sendMessage()" autofocus>
            </div>
            <button class="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-500 transition cursor-pointer" title="Emoji">
              <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"/></svg>
            </button>
            <button onclick="sendMessage()" class="bg-violet-500 hover:bg-violet-600 text-white p-2.5 rounded-xl transition cursor-pointer shadow-sm" title="Send">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
            </button>
          </div>
          <div class="flex items-center gap-3 mt-2 px-1">
            <span class="text-[10px] text-gray-400">Powered by AI</span>
            <span class="text-[10px] text-gray-300">|</span>
            <span class="text-[10px] text-gray-400">Response time: ~1.2s</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Analytics Panel -->
    <aside class="w-[200px] bg-white border-l border-gray-100 p-4 shrink-0 overflow-auto hidden lg:block">
      <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">Analytics</div>
      <div class="space-y-4">
        <div>
          <div class="text-[10px] text-gray-400 mb-1">Avg Response Time</div>
          <div class="text-lg font-bold text-gray-800">1.2s</div>
          <div class="w-full bg-gray-100 rounded-full h-1 mt-1.5"><div class="bg-violet-400 h-1 rounded-full" style="width:85%"></div></div>
        </div>
        <div>
          <div class="text-[10px] text-gray-400 mb-1">Satisfaction</div>
          <div class="text-lg font-bold text-gray-800">92%</div>
          <div class="w-full bg-gray-100 rounded-full h-1 mt-1.5"><div class="bg-emerald-400 h-1 rounded-full" style="width:92%"></div></div>
        </div>
        <div>
          <div class="text-[10px] text-gray-400 mb-1">Resolution Rate</div>
          <div class="text-lg font-bold text-gray-800">87%</div>
          <div class="w-full bg-gray-100 rounded-full h-1 mt-1.5"><div class="bg-violet-300 h-1 rounded-full" style="width:87%"></div></div>
        </div>
        <div class="pt-2 border-t border-gray-50">
          <div class="text-[10px] text-gray-400 mb-2">This Session Topics</div>
          <div class="flex flex-wrap gap-1">
            <span class="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">Password</span>
            <span class="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">2FA</span>
            <span class="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">Security</span>
          </div>
        </div>
        <div class="pt-2 border-t border-gray-50">
          <div class="text-[10px] text-gray-400 mb-2">Messages Today</div>
          <div class="flex items-end gap-[3px] h-10">
            <div class="w-3 bg-violet-100 rounded-t" style="height:30%"></div>
            <div class="w-3 bg-violet-100 rounded-t" style="height:50%"></div>
            <div class="w-3 bg-violet-200 rounded-t" style="height:40%"></div>
            <div class="w-3 bg-violet-200 rounded-t" style="height:70%"></div>
            <div class="w-3 bg-violet-300 rounded-t" style="height:60%"></div>
            <div class="w-3 bg-violet-300 rounded-t" style="height:80%"></div>
            <div class="w-3 bg-violet-400 rounded-t" style="height:90%"></div>
            <div class="w-3 bg-violet-500 rounded-t" style="height:100%"></div>
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-[9px] text-gray-300">9am</span>
            <span class="text-[9px] text-gray-300">now</span>
          </div>
        </div>
        <div class="pt-2 border-t border-gray-50">
          <div class="text-[10px] text-gray-400 mb-2">Sentiment</div>
          <div class="flex items-center gap-2">
            <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden flex">
              <div class="bg-emerald-400 h-full" style="width:72%"></div>
              <div class="bg-amber-400 h-full" style="width:20%"></div>
              <div class="bg-red-400 h-full" style="width:8%"></div>
            </div>
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-[9px] text-emerald-500">72% positive</span>
            <span class="text-[9px] text-red-400">8%</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</div>

<script>
const botReplies = [
  {
    text: '<p class="mb-2">Great question! Here are the <strong>most common account settings</strong> you can customize:</p><ul class="space-y-1.5 mb-3"><li class="flex gap-2"><span class="text-violet-400 shrink-0">&#x2022;</span><span><strong>Profile</strong> &mdash; update your name, avatar, and bio</span></li><li class="flex gap-2"><span class="text-violet-400 shrink-0">&#x2022;</span><span><strong>Notifications</strong> &mdash; control email and push alert preferences</span></li><li class="flex gap-2"><span class="text-violet-400 shrink-0">&#x2022;</span><span><strong>Privacy</strong> &mdash; manage data sharing and visibility settings</span></li></ul><div class="bg-gray-900 rounded-md px-3 py-2"><code class="fira text-xs text-emerald-400">Settings &gt; Account &gt; Preferences</code></div>',
  },
  {
    text: '<p class="mb-2">To <strong>export your data</strong>, follow these steps:</p><ol class="list-decimal list-inside space-y-1.5 mb-3"><li>Navigate to <strong>Settings &gt; Privacy</strong></li><li>Click <strong>"Export My Data"</strong></li><li>Choose your format (JSON or CSV)</li><li>You\'ll receive a download link via email within 24 hours</li></ol><p class="text-gray-500 text-xs mt-2">Note: Data exports include all your messages, settings, and activity logs.</p>',
  },
  {
    text: '<p class="mb-2">I\'d be happy to help with <strong>API integration</strong>!</p><p class="mb-2">Here\'s a quick example using our REST API:</p><div class="bg-gray-900 rounded-md px-3 py-2 mb-3"><code class="fira text-xs text-emerald-400">curl -X POST https://api.example.com/v1/chat \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -d \'{"message": "Hello"}\'</code></div><p class="text-gray-500 text-xs">Full docs: <span class="text-violet-500 underline">docs.example.com/api</span></p>',
  },
];
let replyIndex = 0;

function getTimeStr() {
  const now = new Date();
  let h = now.getHours(), m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
}

function sendMessage() {
  const input = document.getElementById('msg-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const container = document.querySelector('#chat-messages .max-w-2xl');
  const time = getTimeStr();

  // User message
  const userDiv = document.createElement('div');
  userDiv.className = 'flex gap-3 justify-end msg-enter';
  userDiv.innerHTML = '<div class="max-w-md"><div class="flex items-center gap-2 mb-1 justify-end"><span class="text-[10px] text-gray-400">' + time + '</span><span class="text-xs font-semibold text-gray-700">You</span></div><div class="bg-gray-100 rounded-lg rounded-tr-none px-4 py-3 text-sm text-gray-700 leading-relaxed">' + text.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div></div><div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5"><svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg></div>';
  container.appendChild(userDiv);

  // Show thinking
  const thinking = document.getElementById('thinking-indicator');
  thinking.classList.remove('hidden');
  container.appendChild(thinking);
  scrollToBottom();

  // Bot reply after delay
  setTimeout(function() {
    thinking.classList.add('hidden');
    const reply = botReplies[replyIndex % botReplies.length];
    replyIndex++;
    const botDiv = document.createElement('div');
    botDiv.className = 'flex gap-3 msg-enter';
    botDiv.innerHTML = '<div class="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5"><svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.494 4.316a2.25 2.25 0 01-2.122 1.534H8.616a2.25 2.25 0 01-2.122-1.534L5 14.5m14 0H5"/></svg></div><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><span class="text-xs font-semibold text-gray-700">Support Bot</span><span class="text-[10px] text-gray-400">' + time + '</span></div><div class="bg-white border-l-[3px] border-violet-400 rounded-lg rounded-tl-none px-4 py-3 text-sm text-gray-700 leading-relaxed shadow-sm">' + reply.text + '<div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100"><span class="text-[10px] text-gray-400">Was this helpful?</span><button onclick="this.classList.add(\'bg-violet-100\',\'text-violet-600\');this.nextElementSibling.classList.remove(\'bg-violet-100\',\'text-violet-600\')" class="p-1 rounded hover:bg-gray-100 text-gray-400 transition cursor-pointer text-xs">&#128077;</button><button onclick="this.classList.add(\'bg-violet-100\',\'text-violet-600\');this.previousElementSibling.classList.remove(\'bg-violet-100\',\'text-violet-600\')" class="p-1 rounded hover:bg-gray-100 text-gray-400 transition cursor-pointer text-xs">&#128078;</button></div></div></div>';
    container.appendChild(botDiv);
    scrollToBottom();
  }, 1800);
}

function scrollToBottom() {
  const el = document.getElementById('chat-messages');
  setTimeout(function() { el.scrollTop = el.scrollHeight; }, 50);
}

function selectConv(el) {
  document.querySelectorAll('#conv-list .sidebar-item').forEach(function(item) {
    item.classList.remove('active');
  });
  el.classList.add('active');
}

function startNewChat() {
  const container = document.querySelector('#chat-messages .max-w-2xl');
  // Keep only the welcome message (first child)
  const children = Array.from(container.children);
  const thinking = document.getElementById('thinking-indicator');
  children.forEach(function(child, i) {
    if (i > 0 && child !== thinking) container.removeChild(child);
  });
  thinking.classList.add('hidden');
  container.appendChild(thinking);
  document.getElementById('msg-input').focus();
}

// Auto-scroll on load
scrollToBottom();
document.getElementById('msg-input').focus();
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
