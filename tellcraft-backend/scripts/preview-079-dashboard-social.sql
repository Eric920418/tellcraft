INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'b3caf4c2-7b37-44c7-b914-90623d270684',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>社群脈動 SocialPulse</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { fontFamily: { dm: ['DM Sans','sans-serif'] }, colors: { pulse: { 50:'#fdf4ff',100:'#fae8ff',400:'#e879f9',500:'#d946ef',600:'#c026d3' }, ig: '#E4405F', fb: '#1877F2', yt: '#FF0000', tw: '#1DA1F2' } } } }
</script>
<style>
* { font-family: 'DM Sans', sans-serif; }
body { background: #fafafa; }
.sidebar-item { transition: all 0.2s; }
.sidebar-item:hover, .sidebar-item.active { background: rgba(217,70,239,0.08); color: #c026d3; }
.platform-card { transition: transform 0.2s; }
.platform-card:hover { transform: translateY(-2px); }
</style>
</head>
<body class="min-h-screen flex">
<aside class="w-56 bg-white border-r border-gray-100 flex flex-col min-h-screen">
  <div class="p-4 border-b border-gray-50"><div class="flex items-center gap-2"><div class="w-8 h-8 rounded-lg bg-gradient-to-br from-pulse-500 to-pink-500 flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div><span class="font-bold text-gray-800 text-sm">SocialPulse</span></div></div>
  <nav class="flex-1 p-2 space-y-0.5">
    <div class="sidebar-item active flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer" onclick="switchPage('overview')">📊 總覽</div>
    <div class="sidebar-item flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('posts')">📝 貼文分析</div>
    <div class="sidebar-item flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('audience')">👥 受眾洞察</div>
    <div class="sidebar-item flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 cursor-pointer" onclick="switchPage('competitor')">🔍 競品分析</div>
  </nav>
</aside>

<main class="flex-1 overflow-auto">
  <div id="page-overview" class="page p-6 space-y-5">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-bold text-gray-800">社群數據總覽</h1>
      <select class="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500 outline-none"><option>過去 7 天</option><option>過去 30 天</option></select>
    </div>

    <!-- Platform Cards -->
    <div class="grid grid-cols-4 gap-4">
      <div class="platform-card bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex items-center justify-between mb-2"><span class="text-xs text-gray-400">Instagram</span><span class="text-ig text-lg">📸</span></div>
        <div class="text-xl font-bold text-gray-800">24.5K</div>
        <div class="text-xs text-green-500 mt-1">↑ 3.2% 粉絲增長</div>
      </div>
      <div class="platform-card bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex items-center justify-between mb-2"><span class="text-xs text-gray-400">Facebook</span><span class="text-fb text-lg">👍</span></div>
        <div class="text-xl font-bold text-gray-800">18.2K</div>
        <div class="text-xs text-green-500 mt-1">↑ 1.8% 粉絲增長</div>
      </div>
      <div class="platform-card bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex items-center justify-between mb-2"><span class="text-xs text-gray-400">YouTube</span><span class="text-yt text-lg">▶️</span></div>
        <div class="text-xl font-bold text-gray-800">8.7K</div>
        <div class="text-xs text-green-500 mt-1">↑ 5.1% 訂閱增長</div>
      </div>
      <div class="platform-card bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex items-center justify-between mb-2"><span class="text-xs text-gray-400">X (Twitter)</span><span class="text-lg">🐦</span></div>
        <div class="text-xl font-bold text-gray-800">6.3K</div>
        <div class="text-xs text-red-400 mt-1">↓ 0.4% 追蹤減少</div>
      </div>
    </div>

    <!-- Engagement Chart -->
    <div class="grid grid-cols-3 gap-4">
      <div class="col-span-2 bg-white rounded-xl p-5 border border-gray-100">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">互動趨勢</h3>
        <div class="flex items-end gap-3 h-32">
          <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full flex flex-col gap-0.5"><div class="bg-pink-400 rounded-t" style="height:40px"></div><div class="bg-blue-400 rounded-b" style="height:25px"></div></div><span class="text-[10px] text-gray-400">一</span></div>
          <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full flex flex-col gap-0.5"><div class="bg-pink-400 rounded-t" style="height:60px"></div><div class="bg-blue-400 rounded-b" style="height:30px"></div></div><span class="text-[10px] text-gray-400">二</span></div>
          <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full flex flex-col gap-0.5"><div class="bg-pink-400 rounded-t" style="height:45px"></div><div class="bg-blue-400 rounded-b" style="height:20px"></div></div><span class="text-[10px] text-gray-400">三</span></div>
          <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full flex flex-col gap-0.5"><div class="bg-pink-400 rounded-t" style="height:80px"></div><div class="bg-blue-400 rounded-b" style="height:35px"></div></div><span class="text-[10px] text-gray-400">四</span></div>
          <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full flex flex-col gap-0.5"><div class="bg-pink-400 rounded-t" style="height:55px"></div><div class="bg-blue-400 rounded-b" style="height:28px"></div></div><span class="text-[10px] text-gray-400">五</span></div>
          <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full flex flex-col gap-0.5"><div class="bg-pink-400 rounded-t" style="height:90px"></div><div class="bg-blue-400 rounded-b" style="height:40px"></div></div><span class="text-[10px] text-gray-400">六</span></div>
          <div class="flex-1 flex flex-col items-center gap-1"><div class="w-full flex flex-col gap-0.5"><div class="bg-pink-400 rounded-t" style="height:70px"></div><div class="bg-blue-400 rounded-b" style="height:32px"></div></div><span class="text-[10px] text-gray-400">日</span></div>
        </div>
        <div class="flex gap-4 mt-3 text-[10px] text-gray-400"><span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-pink-400"></span>按讚</span><span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-400"></span>留言</span></div>
      </div>
      <!-- Top Posts -->
      <div class="bg-white rounded-xl p-5 border border-gray-100">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">熱門貼文</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-2"><div class="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-lg">📸</div><div class="flex-1 min-w-0"><div class="text-xs font-medium text-gray-700 truncate">新品發布會花絮</div><div class="text-[10px] text-gray-400">❤️ 2.4K · 💬 186</div></div></div>
          <div class="flex items-center gap-2"><div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-lg">🎬</div><div class="flex-1 min-w-0"><div class="text-xs font-medium text-gray-700 truncate">幕後製作 Vlog</div><div class="text-[10px] text-gray-400">▶️ 8.2K · 💬 324</div></div></div>
          <div class="flex items-center gap-2"><div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-lg">🎁</div><div class="flex-1 min-w-0"><div class="text-xs font-medium text-gray-700 truncate">抽獎活動</div><div class="text-[10px] text-gray-400">🔄 1.8K · 💬 892</div></div></div>
        </div>
      </div>
    </div>
  </div>

  <div id="page-posts" class="page hidden p-6">
    <h1 class="text-lg font-bold text-gray-800 mb-5">貼文分析</h1>
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table class="w-full text-sm">
        <thead><tr class="border-b border-gray-50 text-xs text-gray-400 bg-gray-50/50"><th class="text-left px-4 py-2">貼文</th><th class="text-center px-4 py-2">平台</th><th class="text-center px-4 py-2">觸及</th><th class="text-center px-4 py-2">互動</th><th class="text-center px-4 py-2">互動率</th></tr></thead>
        <tbody>
          <tr class="border-b border-gray-50"><td class="px-4 py-3 text-gray-700 font-medium">新品發布會花絮</td><td class="px-4 py-3 text-center">📸 IG</td><td class="px-4 py-3 text-center text-gray-500">45.2K</td><td class="px-4 py-3 text-center text-gray-500">2.6K</td><td class="px-4 py-3 text-center"><span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">5.8%</span></td></tr>
          <tr class="border-b border-gray-50"><td class="px-4 py-3 text-gray-700 font-medium">幕後製作 Vlog</td><td class="px-4 py-3 text-center">▶️ YT</td><td class="px-4 py-3 text-center text-gray-500">12.8K</td><td class="px-4 py-3 text-center text-gray-500">1.2K</td><td class="px-4 py-3 text-center"><span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">9.4%</span></td></tr>
          <tr><td class="px-4 py-3 text-gray-700 font-medium">產品教學短片</td><td class="px-4 py-3 text-center">📸 IG</td><td class="px-4 py-3 text-center text-gray-500">32.1K</td><td class="px-4 py-3 text-center text-gray-500">1.8K</td><td class="px-4 py-3 text-center"><span class="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">5.6%</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div id="page-audience" class="page hidden p-6">
    <h1 class="text-lg font-bold text-gray-800 mb-5">受眾洞察</h1>
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white rounded-xl p-5 border border-gray-100">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">年齡分佈</h3>
        <div class="space-y-2">
          <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-12">18-24</span><div class="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-pulse-400 rounded-full" style="width:35%"></div></div><span class="text-xs text-gray-500 w-8">35%</span></div>
          <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-12">25-34</span><div class="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-pulse-500 rounded-full" style="width:42%"></div></div><span class="text-xs text-gray-500 w-8">42%</span></div>
          <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-12">35-44</span><div class="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-pulse-300 rounded-full" style="width:15%"></div></div><span class="text-xs text-gray-500 w-8">15%</span></div>
          <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-12">45+</span><div class="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-pulse-200 rounded-full" style="width:8%"></div></div><span class="text-xs text-gray-500 w-8">8%</span></div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 border border-gray-100">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">性別比例</h3>
        <div class="flex items-center justify-center gap-8 mt-4">
          <div class="text-center"><svg viewBox="0 0 60 60" class="w-24 h-24"><circle cx="30" cy="30" r="25" fill="none" stroke="#e5e7eb" stroke-width="8"/><circle cx="30" cy="30" r="25" fill="none" stroke="#d946ef" stroke-width="8" stroke-dasharray="96 60" stroke-dashoffset="-15" transform="rotate(-90 30 30)"/><circle cx="30" cy="30" r="25" fill="none" stroke="#60a5fa" stroke-width="8" stroke-dasharray="60 96" stroke-dashoffset="-111" transform="rotate(-90 30 30)"/></svg></div>
          <div class="space-y-2"><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-pulse-500"></span><span class="text-sm text-gray-600">女性 62%</span></div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-blue-400"></span><span class="text-sm text-gray-600">男性 38%</span></div></div>
        </div>
      </div>
    </div>
  </div>

  <div id="page-competitor" class="page hidden p-6">
    <h1 class="text-lg font-bold text-gray-800 mb-5">競品分析</h1>
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table class="w-full text-sm">
        <thead><tr class="border-b border-gray-50 text-xs text-gray-400 bg-gray-50/50"><th class="text-left px-4 py-2">品牌</th><th class="text-center px-4 py-2">IG 粉絲</th><th class="text-center px-4 py-2">FB 粉絲</th><th class="text-center px-4 py-2">互動率</th><th class="text-center px-4 py-2">發文頻率</th></tr></thead>
        <tbody>
          <tr class="border-b border-gray-50 bg-pulse-50/30"><td class="px-4 py-3 font-bold text-pulse-600">我們</td><td class="px-4 py-3 text-center">24.5K</td><td class="px-4 py-3 text-center">18.2K</td><td class="px-4 py-3 text-center"><span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">5.8%</span></td><td class="px-4 py-3 text-center">5次/週</td></tr>
          <tr class="border-b border-gray-50"><td class="px-4 py-3 font-medium text-gray-700">競品 A</td><td class="px-4 py-3 text-center text-gray-500">32.1K</td><td class="px-4 py-3 text-center text-gray-500">22.8K</td><td class="px-4 py-3 text-center"><span class="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">3.2%</span></td><td class="px-4 py-3 text-center text-gray-500">7次/週</td></tr>
          <tr><td class="px-4 py-3 font-medium text-gray-700">競品 B</td><td class="px-4 py-3 text-center text-gray-500">15.6K</td><td class="px-4 py-3 text-center text-gray-500">28.4K</td><td class="px-4 py-3 text-center"><span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">4.5%</span></td><td class="px-4 py-3 text-center text-gray-500">3次/週</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</main>

<script>
function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + page).classList.remove('hidden');
  document.querySelectorAll('.sidebar-item').forEach(i => { i.classList.remove('active'); i.classList.add('text-gray-500'); });
  event.currentTarget.classList.add('active');
  event.currentTarget.classList.remove('text-gray-500');
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
