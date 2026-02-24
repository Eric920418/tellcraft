INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'b3caf4c2-7b37-44c7-b914-90623d270684',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SocialHub - Social Media Manager</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{fontFamily:{dm:['DM Sans','sans-serif']},colors:{ig:'#E1306C',tw:'#1DA1F2',fb:'#1877F2',li:'#0A66C2',surface:'#F8F9FB',dark:'#1A1D26'}}}}
</script>
<style>
*{font-family:'DM Sans',sans-serif}
body{background:#F8F9FB}
.platform-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px 2px 4px;border-radius:9999px;font-size:11px;font-weight:600}
.post-card{transition:all 0.2s ease;border:1px solid #e5e7eb}
.post-card:hover{box-shadow:0 8px 24px rgba(0,0,0,0.08);transform:translateY(-2px)}
.post-card:hover .post-actions{opacity:1}
.post-actions{opacity:0;transition:opacity 0.2s}
.filter-btn{transition:all 0.15s}
.filter-btn:hover{transform:scale(1.04)}
.filter-btn.active{box-shadow:0 2px 8px rgba(0,0,0,0.12)}
.heatmap-cell{border-radius:2px;transition:opacity 0.15s}
.heatmap-cell:hover{opacity:1 !important;outline:1px solid #333}
.status-published{background:#dcfce7;color:#15803d}
.status-scheduled{background:#dbeafe;color:#1d4ed8}
.status-draft{background:#f3f4f6;color:#6b7280}
</style>
</head>
<body class="min-h-screen bg-surface text-dark">

<!-- Top Bar -->
<header class="bg-white border-b border-gray-200 sticky top-0 z-30">
  <div class="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-ig via-purple-500 to-fb flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>
      </div>
      <span class="font-bold text-base text-dark">Social<span class="bg-gradient-to-r from-ig to-fb bg-clip-text text-transparent">Hub</span></span>
    </div>
    <div class="flex items-center gap-4">
      <!-- Connected Accounts -->
      <div class="flex items-center gap-1.5">
        <div class="w-7 h-7 rounded-full bg-gradient-to-br from-ig to-pink-400 flex items-center justify-center" title="Instagram">
          <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
        </div>
        <div class="w-7 h-7 rounded-full bg-tw flex items-center justify-center" title="X / Twitter">
          <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </div>
        <div class="w-7 h-7 rounded-full bg-fb flex items-center justify-center" title="Facebook">
          <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </div>
        <div class="w-7 h-7 rounded-full bg-li flex items-center justify-center" title="LinkedIn">
          <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </div>
      </div>
      <div class="h-5 w-px bg-gray-200"></div>
      <!-- Date Range -->
      <div class="flex items-center gap-1.5 bg-surface rounded-lg px-3 py-1.5 text-xs text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
        <span>Feb 17 - Feb 24</span>
      </div>
      <!-- Create Post -->
      <button onclick="showToast('Create Post modal coming soon')" class="bg-gradient-to-r from-ig via-purple-500 to-fb text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
        Create Post
      </button>
    </div>
  </div>
</header>

<div class="max-w-[1440px] mx-auto flex">

  <!-- Main Feed Area -->
  <div class="flex-1 min-w-0 px-6 py-5">

    <!-- Platform Overview Strip -->
    <div class="grid grid-cols-4 gap-3 mb-6">
      <!-- Instagram -->
      <div class="post-card bg-white rounded-xl p-4 border-l-4 border-l-ig cursor-pointer" onclick="filterPlatform('ig')">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-6 h-6 rounded-full bg-gradient-to-br from-ig to-pink-400 flex items-center justify-center">
            <svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="17.5" cy="6.5" r="1.2"/></svg>
          </div>
          <span class="text-xs font-semibold text-gray-500">Instagram</span>
        </div>
        <div class="text-xl font-bold text-dark">12.4K</div>
        <div class="text-xs text-green-600 font-medium mt-0.5">+2.3% <span class="text-green-500">&#8593;</span></div>
      </div>
      <!-- Twitter/X -->
      <div class="post-card bg-white rounded-xl p-4 border-l-4 border-l-tw cursor-pointer" onclick="filterPlatform('tw')">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-6 h-6 rounded-full bg-tw flex items-center justify-center">
            <svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </div>
          <span class="text-xs font-semibold text-gray-500">X / Twitter</span>
        </div>
        <div class="text-xl font-bold text-dark">8.7K</div>
        <div class="text-xs text-red-500 font-medium mt-0.5">-0.5% <span class="text-red-400">&#8595;</span></div>
      </div>
      <!-- Facebook -->
      <div class="post-card bg-white rounded-xl p-4 border-l-4 border-l-fb cursor-pointer" onclick="filterPlatform('fb')">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-6 h-6 rounded-full bg-fb flex items-center justify-center">
            <svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </div>
          <span class="text-xs font-semibold text-gray-500">Facebook</span>
        </div>
        <div class="text-xl font-bold text-dark">15.2K</div>
        <div class="text-xs text-green-600 font-medium mt-0.5">+1.1% <span class="text-green-500">&#8593;</span></div>
      </div>
      <!-- LinkedIn -->
      <div class="post-card bg-white rounded-xl p-4 border-l-4 border-l-li cursor-pointer" onclick="filterPlatform('li')">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-6 h-6 rounded-full bg-li flex items-center justify-center">
            <svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </div>
          <span class="text-xs font-semibold text-gray-500">LinkedIn</span>
        </div>
        <div class="text-xl font-bold text-dark">5.8K</div>
        <div class="text-xs text-green-600 font-medium mt-0.5">+4.2% <span class="text-green-500">&#8593;</span></div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="flex items-center gap-2 mb-5">
      <button onclick="filterPlatform('all')" class="filter-btn active bg-dark text-white px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer" data-platform="all">All Platforms</button>
      <button onclick="filterPlatform('ig')" class="filter-btn bg-white text-gray-500 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border border-gray-200 hover:border-ig hover:text-ig" data-platform="ig">Instagram</button>
      <button onclick="filterPlatform('tw')" class="filter-btn bg-white text-gray-500 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border border-gray-200 hover:border-tw hover:text-tw" data-platform="tw">X / Twitter</button>
      <button onclick="filterPlatform('fb')" class="filter-btn bg-white text-gray-500 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border border-gray-200 hover:border-fb hover:text-fb" data-platform="fb">Facebook</button>
      <button onclick="filterPlatform('li')" class="filter-btn bg-white text-gray-500 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border border-gray-200 hover:border-li hover:text-li" data-platform="li">LinkedIn</button>
    </div>

    <!-- Feed -->
    <div id="feed" class="space-y-4">

      <!-- Instagram Post - Image -->
      <div class="post-card bg-white rounded-xl overflow-hidden" data-platform="ig">
        <div class="p-4 pb-3 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="platform-badge bg-ig/10 text-ig">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="17.5" cy="6.5" r="1.2"/></svg>
              Instagram
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold status-published">Published</span>
          </div>
          <div class="post-actions flex items-center gap-1.5">
            <button class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
            </button>
            <button class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
            </button>
          </div>
        </div>
        <!-- Image placeholder -->
        <div class="mx-4 h-48 rounded-xl bg-gradient-to-br from-ig via-purple-400 to-yellow-300 flex items-center justify-center">
          <div class="text-center text-white/90">
            <svg class="w-10 h-10 mx-auto mb-2 opacity-60" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"/></svg>
            <div class="text-xs font-medium opacity-80">New Collection Launch</div>
          </div>
        </div>
        <div class="p-4">
          <p class="text-sm text-gray-700 leading-relaxed mb-3">Introducing our Spring 2026 collection. Designed for those who dare to stand out. Link in bio to explore all pieces. <span class="text-ig font-medium">#SpringCollection #Fashion2026</span></p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4 text-xs text-gray-400">
              <span class="flex items-center gap-1"><span class="text-red-400">&#10084;</span> 234</span>
              <span class="flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"/></svg> 18</span>
              <span class="flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"/></svg> 42</span>
            </div>
            <span class="text-[11px] text-gray-300">Published 2h ago</span>
          </div>
        </div>
      </div>

      <!-- Twitter/X Post - Text Only -->
      <div class="post-card bg-white rounded-xl overflow-hidden" data-platform="tw">
        <div class="p-4 pb-3 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="platform-badge bg-tw/10 text-tw">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X / Twitter
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold status-scheduled">Scheduled</span>
          </div>
          <div class="post-actions flex items-center gap-1.5">
            <button class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
            </button>
            <button class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
            </button>
          </div>
        </div>
        <div class="px-4 pb-4">
          <div class="bg-tw/5 rounded-xl p-4 border-l-3 border-l-tw" style="border-left:3px solid #1DA1F2">
            <p class="text-sm text-gray-800 leading-relaxed">The future of social commerce isn't just selling products - it's building communities around shared values. We're seeing 3x engagement when brands lead with storytelling over promotions.</p>
            <p class="text-tw text-xs font-medium mt-2">#SocialCommerce #DigitalMarketing #BrandStrategy</p>
          </div>
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-4 text-xs text-gray-400">
              <span class="flex items-center gap-1"><span class="text-red-400">&#10084;</span> --</span>
              <span class="flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"/></svg> --</span>
            </div>
            <span class="text-[11px] text-blue-400 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Scheduled for today 3:00 PM
            </span>
          </div>
        </div>
      </div>

      <!-- Facebook Post - Link Preview -->
      <div class="post-card bg-white rounded-xl overflow-hidden" data-platform="fb">
        <div class="p-4 pb-3 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="platform-badge bg-fb/10 text-fb">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold status-published">Published</span>
          </div>
          <div class="post-actions flex items-center gap-1.5">
            <button class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
            </button>
            <button class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
            </button>
          </div>
        </div>
        <div class="px-4 pb-1">
          <p class="text-sm text-gray-700 mb-3">Great read on why community-driven brands are outperforming traditional marketing in 2026.</p>
        </div>
        <!-- Link preview card -->
        <div class="mx-4 mb-4 rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors">
          <div class="h-32 bg-gradient-to-r from-fb/20 via-blue-50 to-fb/10 flex items-center justify-center">
            <svg class="w-12 h-12 text-fb/30" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.44a4.5 4.5 0 00-6.364-6.364L4.343 5.28a4.5 4.5 0 001.242 7.244"/></svg>
          </div>
          <div class="p-3 bg-gray-50/50">
            <div class="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">marketingweekly.com</div>
            <div class="text-sm font-semibold text-gray-800 leading-snug">Community-First Branding: The 2026 Playbook for Social Engagement</div>
            <div class="text-xs text-gray-400 mt-1 line-clamp-2">How leading brands are shifting from broadcast marketing to community building, and seeing 5x return on engagement.</div>
          </div>
        </div>
        <div class="px-4 pb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4 text-xs text-gray-400">
              <span class="flex items-center gap-1"><svg class="w-3.5 h-3.5 text-fb" viewBox="0 0 24 24" fill="currentColor"><path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/></svg> 56</span>
              <span class="flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"/></svg> 12</span>
              <span class="flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"/></svg> 8</span>
            </div>
            <span class="text-[11px] text-gray-300">Published yesterday</span>
          </div>
        </div>
      </div>

      <!-- LinkedIn Post - Article -->
      <div class="post-card bg-white rounded-xl overflow-hidden" data-platform="li">
        <div class="p-4 pb-3 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="platform-badge bg-li/10 text-li">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold status-draft">Draft</span>
          </div>
          <div class="post-actions flex items-center gap-1.5">
            <button class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
            </button>
            <button class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
            </button>
          </div>
        </div>
        <div class="px-4 pb-4">
          <!-- Article card -->
          <div class="rounded-xl border border-gray-200 overflow-hidden">
            <div class="h-28 bg-gradient-to-r from-li/10 via-blue-50 to-li/5 flex items-center justify-center relative">
              <div class="absolute top-3 left-3">
                <span class="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-semibold text-li">Article</span>
              </div>
              <svg class="w-10 h-10 text-li/20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            </div>
            <div class="p-3">
              <div class="text-sm font-semibold text-gray-800 leading-snug mb-1">5 Lessons We Learned Scaling Our B2B Social Strategy from 0 to 50K Followers</div>
              <div class="text-xs text-gray-400 line-clamp-2">After 18 months of experimentation, here are the non-obvious tactics that actually moved the needle for our B2B brand on LinkedIn...</div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-4 text-xs text-gray-400">
              <span class="flex items-center gap-1"><span class="text-gray-300">&#10084;</span> --</span>
              <span class="flex items-center gap-1 text-gray-300"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"/></svg> --</span>
            </div>
            <span class="text-[11px] text-gray-300 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
              Draft
            </span>
          </div>
        </div>
      </div>

      <!-- Instagram Post 2 - Carousel -->
      <div class="post-card bg-white rounded-xl overflow-hidden" data-platform="ig">
        <div class="p-4 pb-3 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="platform-badge bg-ig/10 text-ig">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="17.5" cy="6.5" r="1.2"/></svg>
              Instagram
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold status-scheduled">Scheduled</span>
          </div>
          <div class="post-actions flex items-center gap-1.5">
            <button class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
            </button>
            <button class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
            </button>
          </div>
        </div>
        <div class="mx-4 flex gap-2 mb-3">
          <div class="flex-1 h-32 rounded-lg bg-gradient-to-br from-pink-300 to-ig/60 flex items-center justify-center text-white/70 text-xs">Slide 1</div>
          <div class="flex-1 h-32 rounded-lg bg-gradient-to-br from-purple-300 to-ig/40 flex items-center justify-center text-white/70 text-xs">Slide 2</div>
          <div class="flex-1 h-32 rounded-lg bg-gradient-to-br from-orange-300 to-yellow-300 flex items-center justify-center text-white/70 text-xs">Slide 3</div>
        </div>
        <div class="px-4 pb-4">
          <p class="text-sm text-gray-700 mb-3">Behind the scenes of our latest photoshoot. Swipe to see the full setup and final results.</p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4 text-xs text-gray-400">
              <span class="flex items-center gap-1"><span class="text-red-400">&#10084;</span> --</span>
              <span class="flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"/></svg> --</span>
            </div>
            <span class="text-[11px] text-blue-400 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Scheduled for tomorrow 10:00 AM
            </span>
          </div>
        </div>
      </div>

      <!-- Facebook Post 2 - Status Update -->
      <div class="post-card bg-white rounded-xl overflow-hidden" data-platform="fb">
        <div class="p-4 pb-3 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="platform-badge bg-fb/10 text-fb">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold status-published">Published</span>
          </div>
          <div class="post-actions flex items-center gap-1.5">
            <button class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
            </button>
            <button class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
            </button>
          </div>
        </div>
        <div class="px-4 pb-4">
          <p class="text-sm text-gray-700 leading-relaxed mb-3">We just hit 15K followers on Facebook! Thank you to every single one of you for being part of this journey. To celebrate, we are running a special giveaway this weekend. Stay tuned for details!</p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4 text-xs text-gray-400">
              <span class="flex items-center gap-1"><svg class="w-3.5 h-3.5 text-fb" viewBox="0 0 24 24" fill="currentColor"><path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/></svg> 128</span>
              <span class="flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"/></svg> 34</span>
              <span class="flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"/></svg> 22</span>
            </div>
            <span class="text-[11px] text-gray-300">Published 3 days ago</span>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Right Sidebar -->
  <aside class="w-[260px] flex-shrink-0 border-l border-gray-200 bg-white py-5 px-4 space-y-6 overflow-y-auto" style="max-height:calc(100vh - 56px);position:sticky;top:56px">

    <!-- Best Time to Post Heatmap -->
    <div>
      <h3 class="text-sm font-bold text-dark mb-3">Best Time to Post</h3>
      <div class="text-[9px] text-gray-400 mb-1.5 flex">
        <div class="w-7"></div>
        <div class="flex-1 grid grid-cols-6 text-center">
          <span>6a</span><span>9a</span><span>12p</span><span>3p</span><span>6p</span><span>9p</span>
        </div>
      </div>
      <div class="space-y-0.5" id="heatmap">
        <!-- Mon -->
        <div class="flex items-center gap-1"><span class="text-[9px] text-gray-400 w-6 text-right">Mon</span><div class="flex-1 grid grid-cols-6 gap-0.5"><div class="heatmap-cell h-4 bg-ig/15 rounded-sm"></div><div class="heatmap-cell h-4 bg-ig/35 rounded-sm"></div><div class="heatmap-cell h-4 bg-ig/60 rounded-sm"></div><div class="heatmap-cell h-4 bg-ig/80 rounded-sm"></div><div class="heatmap-cell h-4 bg-ig/45 rounded-sm"></div><div class="heatmap-cell h-4 bg-ig/20 rounded-sm"></div></div></div>
        <!-- Tue -->
        <div class="flex items-center gap-1"><span class="text-[9px] text-gray-400 w-6 text-right">Tue</span><div class="flex-1 grid grid-cols-6 gap-0.5"><div class="heatmap-cell h-4 bg-tw/20 rounded-sm"></div><div class="heatmap-cell h-4 bg-tw/50 rounded-sm"></div><div class="heatmap-cell h-4 bg-tw/70 rounded-sm"></div><div class="heatmap-cell h-4 bg-tw/40 rounded-sm"></div><div class="heatmap-cell h-4 bg-tw/60 rounded-sm"></div><div class="heatmap-cell h-4 bg-tw/25 rounded-sm"></div></div></div>
        <!-- Wed -->
        <div class="flex items-center gap-1"><span class="text-[9px] text-gray-400 w-6 text-right">Wed</span><div class="flex-1 grid grid-cols-6 gap-0.5"><div class="heatmap-cell h-4 bg-fb/10 rounded-sm"></div><div class="heatmap-cell h-4 bg-fb/30 rounded-sm"></div><div class="heatmap-cell h-4 bg-fb/55 rounded-sm"></div><div class="heatmap-cell h-4 bg-fb/90 rounded-sm"></div><div class="heatmap-cell h-4 bg-fb/50 rounded-sm"></div><div class="heatmap-cell h-4 bg-fb/15 rounded-sm"></div></div></div>
        <!-- Thu -->
        <div class="flex items-center gap-1"><span class="text-[9px] text-gray-400 w-6 text-right">Thu</span><div class="flex-1 grid grid-cols-6 gap-0.5"><div class="heatmap-cell h-4 bg-li/15 rounded-sm"></div><div class="heatmap-cell h-4 bg-li/45 rounded-sm"></div><div class="heatmap-cell h-4 bg-li/75 rounded-sm"></div><div class="heatmap-cell h-4 bg-li/60 rounded-sm"></div><div class="heatmap-cell h-4 bg-li/35 rounded-sm"></div><div class="heatmap-cell h-4 bg-li/10 rounded-sm"></div></div></div>
        <!-- Fri -->
        <div class="flex items-center gap-1"><span class="text-[9px] text-gray-400 w-6 text-right">Fri</span><div class="flex-1 grid grid-cols-6 gap-0.5"><div class="heatmap-cell h-4 bg-ig/20 rounded-sm"></div><div class="heatmap-cell h-4 bg-ig/40 rounded-sm"></div><div class="heatmap-cell h-4 bg-ig/50 rounded-sm"></div><div class="heatmap-cell h-4 bg-ig/70 rounded-sm"></div><div class="heatmap-cell h-4 bg-ig/55 rounded-sm"></div><div class="heatmap-cell h-4 bg-ig/30 rounded-sm"></div></div></div>
        <!-- Sat -->
        <div class="flex items-center gap-1"><span class="text-[9px] text-gray-400 w-6 text-right">Sat</span><div class="flex-1 grid grid-cols-6 gap-0.5"><div class="heatmap-cell h-4 bg-tw/10 rounded-sm"></div><div class="heatmap-cell h-4 bg-tw/15 rounded-sm"></div><div class="heatmap-cell h-4 bg-tw/35 rounded-sm"></div><div class="heatmap-cell h-4 bg-tw/55 rounded-sm"></div><div class="heatmap-cell h-4 bg-tw/70 rounded-sm"></div><div class="heatmap-cell h-4 bg-tw/40 rounded-sm"></div></div></div>
        <!-- Sun -->
        <div class="flex items-center gap-1"><span class="text-[9px] text-gray-400 w-6 text-right">Sun</span><div class="flex-1 grid grid-cols-6 gap-0.5"><div class="heatmap-cell h-4 bg-fb/10 rounded-sm"></div><div class="heatmap-cell h-4 bg-fb/10 rounded-sm"></div><div class="heatmap-cell h-4 bg-fb/25 rounded-sm"></div><div class="heatmap-cell h-4 bg-fb/40 rounded-sm"></div><div class="heatmap-cell h-4 bg-fb/60 rounded-sm"></div><div class="heatmap-cell h-4 bg-fb/35 rounded-sm"></div></div></div>
      </div>
      <div class="flex items-center justify-between mt-2 text-[9px] text-gray-300">
        <span>Low engagement</span>
        <div class="flex gap-0.5">
          <div class="w-3 h-3 rounded-sm bg-gray-100"></div>
          <div class="w-3 h-3 rounded-sm bg-ig/25"></div>
          <div class="w-3 h-3 rounded-sm bg-ig/50"></div>
          <div class="w-3 h-3 rounded-sm bg-ig/75"></div>
          <div class="w-3 h-3 rounded-sm bg-ig"></div>
        </div>
        <span>High</span>
      </div>
    </div>

    <div class="h-px bg-gray-100"></div>

    <!-- Upcoming Scheduled -->
    <div>
      <h3 class="text-sm font-bold text-dark mb-3">Upcoming Posts</h3>
      <div class="space-y-3">
        <div class="flex items-start gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-tw/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-3.5 h-3.5 text-tw" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </div>
          <div class="min-w-0">
            <div class="text-xs font-medium text-gray-700 truncate">Social commerce thread</div>
            <div class="text-[10px] text-gray-400">Today 3:00 PM</div>
          </div>
        </div>
        <div class="flex items-start gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-ig/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-3.5 h-3.5 text-ig" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="17.5" cy="6.5" r="1.2"/></svg>
          </div>
          <div class="min-w-0">
            <div class="text-xs font-medium text-gray-700 truncate">BTS photoshoot carousel</div>
            <div class="text-[10px] text-gray-400">Tomorrow 10:00 AM</div>
          </div>
        </div>
        <div class="flex items-start gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-fb/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-3.5 h-3.5 text-fb" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </div>
          <div class="min-w-0">
            <div class="text-xs font-medium text-gray-700 truncate">Weekend giveaway announce</div>
            <div class="text-[10px] text-gray-400">Fri 9:00 AM</div>
          </div>
        </div>
        <div class="flex items-start gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-li/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-3.5 h-3.5 text-li" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </div>
          <div class="min-w-0">
            <div class="text-xs font-medium text-gray-700 truncate">B2B scaling article</div>
            <div class="text-[10px] text-gray-400 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
              Draft - needs review
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="h-px bg-gray-100"></div>

    <!-- Quick Stats -->
    <div>
      <h3 class="text-sm font-bold text-dark mb-3">This Week</h3>
      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">Total Reach</span>
          <span class="text-xs font-bold text-dark">48.2K</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">Engagement Rate</span>
          <span class="text-xs font-bold text-green-600">4.7%</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">Posts Published</span>
          <span class="text-xs font-bold text-dark">12</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">New Followers</span>
          <span class="text-xs font-bold text-green-600">+342</span>
        </div>
      </div>
    </div>
  </aside>

</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-dark text-white px-6 py-3 rounded-xl shadow-2xl z-50 translate-y-20 opacity-0 transition-all duration-500 text-sm font-medium pointer-events-none"></div>

<script>
// Platform filter
let currentFilter = 'all';
function filterPlatform(platform) {
  currentFilter = platform;
  const cards = document.querySelectorAll('#feed > .post-card');
  cards.forEach(card => {
    if (platform === 'all' || card.dataset.platform === platform) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
  // Update filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active','bg-dark','text-white');
    btn.classList.add('bg-white','text-gray-500');
    if (btn.dataset.platform === platform) {
      btn.classList.add('active','bg-dark','text-white');
      btn.classList.remove('bg-white','text-gray-500');
    }
  });
}

// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('translate-y-20','opacity-0');
  setTimeout(() => t.classList.add('translate-y-20','opacity-0'), 2500);
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
