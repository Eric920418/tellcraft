INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '57274695-924b-437b-a2ef-75367f2fa15a',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>博覽天下 ExpoWorld</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { expo: { 50:'#fef3c7',100:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706' }, deep: { 800:'#1e1b4b',900:'#0f0a2e' } } } } } }
</script>
<style>
* { font-family: 'Outfit', sans-serif; }
body { background: #0f0a2e; color: #e2e8f0; }
.booth-card { transition: all 0.3s; cursor: pointer; }
.booth-card:hover { transform: translateY(-4px); border-color: rgba(251,191,36,0.3); }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.faq-answer.open { max-height: 300px; }
.schedule-tab { transition: all 0.2s; }
.schedule-tab.active { background: linear-gradient(to right, #fbbf24, #f97316); color: #0f0a2e; }
</style>
</head>
<body>
<nav class="fixed top-0 w-full z-50 bg-deep-900/80 backdrop-blur border-b border-white/5">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><div class="w-7 h-7 rounded bg-gradient-to-br from-expo-400 to-orange-500 flex items-center justify-center text-xs font-bold text-deep-900">EW</div><span class="font-bold tracking-wide">ExpoWorld</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-400">
      <a onclick="document.getElementById('schedule').scrollIntoView({behavior:'smooth'})" class="hover:text-expo-400 transition cursor-pointer">展覽資訊</a>
      <a onclick="document.getElementById('exhibitors').scrollIntoView({behavior:'smooth'})" class="hover:text-expo-400 transition cursor-pointer">參展商</a>
      <a onclick="document.getElementById('forum').scrollIntoView({behavior:'smooth'})" class="hover:text-expo-400 transition cursor-pointer">論壇</a>
      <a onclick="document.getElementById('transport').scrollIntoView({behavior:'smooth'})" class="hover:text-expo-400 transition cursor-pointer">交通指南</a>
      <button onclick="document.getElementById('ticketModal').classList.remove('hidden')" class="bg-gradient-to-r from-expo-400 to-orange-500 text-deep-900 px-5 py-1.5 rounded-full text-sm font-bold hover:opacity-90 transition">購票入場</button>
    </div>
  </div>
</nav>

<!-- Ticket Modal -->
<div id="ticketModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
  <div class="bg-deep-800 rounded-2xl p-8 w-full max-w-md shadow-2xl relative border border-white/10">
    <button onclick="document.getElementById('ticketModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
    <div class="text-center mb-6">
      <div class="text-4xl mb-2">🎫</div>
      <h3 class="text-xl font-bold">購買門票</h3>
      <p class="text-sm text-gray-400 mt-1">亞洲科技博覽會 2026</p>
    </div>
    <div id="ticketForm">
      <div class="space-y-2 mb-4">
        <label class="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-expo-400/30 transition">
          <div class="flex items-center gap-3"><input type="radio" name="ticket" class="accent-yellow-500" checked><div><div class="font-bold text-sm">早鳥票</div><div class="text-[10px] text-gray-400">4 日全通 · 限量 2000 張</div></div></div>
          <div class="font-bold text-expo-400">$480</div>
        </label>
        <label class="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-expo-400/30 transition">
          <div class="flex items-center gap-3"><input type="radio" name="ticket" class="accent-yellow-500"><div><div class="font-bold text-sm">一般票</div><div class="text-[10px] text-gray-400">4 日全通</div></div></div>
          <div class="font-bold text-expo-400">$780</div>
        </label>
        <label class="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-expo-400/30 transition">
          <div class="flex items-center gap-3"><input type="radio" name="ticket" class="accent-yellow-500"><div><div class="font-bold text-sm">VIP 通行證</div><div class="text-[10px] text-gray-400">4 日 + VIP 休息室 + 講者見面</div></div></div>
          <div class="font-bold text-expo-400">$2,480</div>
        </label>
      </div>
      <input type="text" placeholder="姓名" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-expo-400 text-white placeholder-gray-500">
      <input type="email" placeholder="Email" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-expo-400 text-white placeholder-gray-500">
      <input type="tel" placeholder="手機號碼" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-expo-400 text-white placeholder-gray-500">
      <button onclick="document.getElementById('ticketForm').innerHTML='<div class=\'text-center py-8\'><div class=\'text-5xl mb-3\'>🎉</div><p class=\'font-bold text-lg\'>購票成功！</p><p class=\'text-sm text-gray-400 mt-1\'>電子票券已寄送至您的 Email</p><p class=\'text-xs text-gray-500 mt-3\'>訂單編號：EW2026-' + Math.floor(Math.random()*90000+10000) + '</p></div>'" class="w-full bg-gradient-to-r from-expo-400 to-orange-500 text-deep-900 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition">確認購買</button>
    </div>
  </div>
</div>

<section class="min-h-[80vh] flex items-center relative overflow-hidden pt-14">
  <div class="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-transparent to-transparent"></div>
  <div class="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-expo-500/5 rounded-full blur-[150px]"></div>
  <div class="max-w-6xl mx-auto px-6 text-center relative">
    <div class="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs mb-6">
      <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
      <span class="text-gray-400">2026 年度科技盛會</span>
    </div>
    <h1 class="text-6xl font-extrabold mb-4">亞洲科技<span class="bg-gradient-to-r from-expo-300 to-orange-400 bg-clip-text text-transparent">博覽會</span></h1>
    <p class="text-gray-400 max-w-lg mx-auto mb-3">匯聚全球 200+ 科技品牌、50+ 場論壇演講、現場體驗最前沿的 AI、XR 與機器人技術。</p>
    <div class="flex items-center justify-center gap-6 text-sm text-gray-500 mb-8">
      <span>📅 2026/05/15 - 05/18</span><span>📍 南港展覽館 1 & 2 館</span><span>👥 預計 80,000+ 人次</span>
    </div>
    <div class="flex gap-4 justify-center">
      <button onclick="document.getElementById('ticketModal').classList.remove('hidden')" class="bg-gradient-to-r from-expo-400 to-orange-500 text-deep-900 px-10 py-3 rounded-full font-bold hover:opacity-90 transition shadow-lg shadow-expo-500/20">早鳥票 $480</button>
      <button onclick="document.getElementById('inviteModal').classList.remove('hidden')" class="border border-expo-400/30 text-expo-400 px-10 py-3 rounded-full font-bold hover:border-expo-400/60 transition">免費索取邀請碼</button>
    </div>
    <!-- Countdown -->
    <div class="flex justify-center gap-6 mt-10">
      <div class="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center"><div class="text-2xl font-extrabold text-expo-400">87</div><div class="text-[10px] text-gray-500">天</div></div>
      <div class="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center"><div class="text-2xl font-extrabold text-expo-400">14</div><div class="text-[10px] text-gray-500">時</div></div>
      <div class="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center"><div class="text-2xl font-extrabold text-expo-400">32</div><div class="text-[10px] text-gray-500">分</div></div>
      <div class="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center"><div class="text-2xl font-extrabold text-expo-400">08</div><div class="text-[10px] text-gray-500">秒</div></div>
    </div>
  </div>
</section>

<!-- Invite Code Modal -->
<div id="inviteModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
  <div class="bg-deep-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl relative border border-white/10">
    <button onclick="document.getElementById('inviteModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
    <div class="text-center">
      <div class="text-4xl mb-3">🎟️</div>
      <h3 class="font-bold text-lg mb-1">免費邀請碼</h3>
      <p class="text-xs text-gray-400 mb-4">輸入 Email 即可獲得邀請碼</p>
      <div id="inviteForm">
        <input type="email" placeholder="your@email.com" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-expo-400 text-white placeholder-gray-500">
        <button onclick="document.getElementById('inviteForm').innerHTML='<div class=\'py-4\'><p class=\'text-expo-400 font-bold text-lg mono\'>EW-FREE-2026</p><p class=\'text-xs text-gray-400 mt-2\'>邀請碼已寄送至您的信箱</p></div>'" class="w-full bg-gradient-to-r from-expo-400 to-orange-500 text-deep-900 py-2.5 rounded-xl font-bold text-sm transition">取得邀請碼</button>
      </div>
    </div>
  </div>
</div>

<!-- Stats -->
<section class="border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6 py-8 grid grid-cols-4 gap-6 text-center">
    <div><div class="text-3xl font-extrabold bg-gradient-to-r from-expo-300 to-orange-400 bg-clip-text text-transparent">200+</div><div class="text-xs text-gray-500">參展品牌</div></div>
    <div><div class="text-3xl font-extrabold bg-gradient-to-r from-expo-300 to-orange-400 bg-clip-text text-transparent">50+</div><div class="text-xs text-gray-500">論壇場次</div></div>
    <div><div class="text-3xl font-extrabold bg-gradient-to-r from-expo-300 to-orange-400 bg-clip-text text-transparent">80K+</div><div class="text-xs text-gray-500">預估人次</div></div>
    <div><div class="text-3xl font-extrabold bg-gradient-to-r from-expo-300 to-orange-400 bg-clip-text text-transparent">4 天</div><div class="text-xs text-gray-500">精彩展期</div></div>
  </div>
</section>

<!-- Exhibition Zones -->
<section id="exhibitors" class="max-w-6xl mx-auto px-6 py-12">
  <h2 class="text-2xl font-bold mb-8 text-center">🏛️ 六大展區</h2>
  <div class="grid grid-cols-3 gap-5">
    <div class="booth-card bg-white/5 rounded-xl p-6 border border-white/5">
      <div class="text-3xl mb-3">🤖</div>
      <h3 class="font-bold">AI 智慧區</h3>
      <p class="text-xs text-gray-400 mt-2">生成式 AI、大語言模型、AI Agent、智慧客服、自動駕駛。</p>
      <div class="text-[10px] text-expo-400 mt-3 font-medium">42 家參展 · 1 館 A 區</div>
    </div>
    <div class="booth-card bg-white/5 rounded-xl p-6 border border-white/5">
      <div class="text-3xl mb-3">🥽</div>
      <h3 class="font-bold">XR 沉浸區</h3>
      <p class="text-xs text-gray-400 mt-2">VR 遊戲、AR 導覽、MR 教育、空間計算、數位孿生。</p>
      <div class="text-[10px] text-expo-400 mt-3 font-medium">28 家參展 · 1 館 B 區</div>
    </div>
    <div class="booth-card bg-white/5 rounded-xl p-6 border border-white/5">
      <div class="text-3xl mb-3">🦾</div>
      <h3 class="font-bold">機器人區</h3>
      <p class="text-xs text-gray-400 mt-2">人形機器人、工業手臂、倉儲物流、醫療機器人。</p>
      <div class="text-[10px] text-expo-400 mt-3 font-medium">35 家參展 · 2 館 A 區</div>
    </div>
    <div class="booth-card bg-white/5 rounded-xl p-6 border border-white/5">
      <div class="text-3xl mb-3">🔋</div>
      <h3 class="font-bold">綠能科技區</h3>
      <p class="text-xs text-gray-400 mt-2">固態電池、氫能源、太陽能、碳捕捉、智慧電網。</p>
      <div class="text-[10px] text-expo-400 mt-3 font-medium">30 家參展 · 2 館 B 區</div>
    </div>
    <div class="booth-card bg-white/5 rounded-xl p-6 border border-white/5">
      <div class="text-3xl mb-3">🧬</div>
      <h3 class="font-bold">生技醫療區</h3>
      <p class="text-xs text-gray-400 mt-2">基因定序、精準醫療、遠距醫療、腦機介面。</p>
      <div class="text-[10px] text-expo-400 mt-3 font-medium">38 家參展 · 2 館 C 區</div>
    </div>
    <div class="booth-card bg-white/5 rounded-xl p-6 border border-white/5">
      <div class="text-3xl mb-3">🚀</div>
      <h3 class="font-bold">新創專區</h3>
      <p class="text-xs text-gray-400 mt-2">100+ 新創 Pitch、投資媒合、Startup Battle 競賽。</p>
      <div class="text-[10px] text-expo-400 mt-3 font-medium">100+ 新創 · 1 館 C 區</div>
    </div>
  </div>
</section>

<!-- Schedule -->
<section id="schedule" class="bg-white/[0.02] py-12">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-2xl font-bold mb-6 text-center">📋 活動議程</h2>
    <div class="flex justify-center gap-2 mb-8">
      <button onclick="switchDay('day1',this)" class="schedule-tab active px-5 py-2 rounded-full text-sm font-bold border border-white/10">Day 1 · 5/15</button>
      <button onclick="switchDay('day2',this)" class="schedule-tab px-5 py-2 rounded-full text-sm font-bold border border-white/10 text-gray-400">Day 2 · 5/16</button>
      <button onclick="switchDay('day3',this)" class="schedule-tab px-5 py-2 rounded-full text-sm font-bold border border-white/10 text-gray-400">Day 3 · 5/17</button>
      <button onclick="switchDay('day4',this)" class="schedule-tab px-5 py-2 rounded-full text-sm font-bold border border-white/10 text-gray-400">Day 4 · 5/18</button>
    </div>
    <div id="day1" class="schedule-content space-y-3">
      <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
        <div class="text-xs text-expo-400 font-bold w-16 shrink-0">09:00</div>
        <div class="flex-1"><h4 class="font-bold text-sm">開幕典禮</h4><p class="text-xs text-gray-400">主持：陳文茜 · 主舞台</p></div>
        <span class="text-[10px] bg-expo-400/10 text-expo-400 px-2 py-0.5 rounded-full">主舞台</span>
      </div>
      <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
        <div class="text-xs text-expo-400 font-bold w-16 shrink-0">10:00</div>
        <div class="flex-1"><h4 class="font-bold text-sm">Keynote: AI 的下一個十年</h4><p class="text-xs text-gray-400">講者：Anthropic CTO · 主舞台</p></div>
        <span class="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">🔥 熱門</span>
      </div>
      <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
        <div class="text-xs text-expo-400 font-bold w-16 shrink-0">11:30</div>
        <div class="flex-1"><h4 class="font-bold text-sm">Panel: 自動駕駛在台灣的機會與挑戰</h4><p class="text-xs text-gray-400">特斯拉、鴻海、Waymo 代表 · 論壇廳 A</p></div>
        <span class="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">論壇</span>
      </div>
      <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
        <div class="text-xs text-expo-400 font-bold w-16 shrink-0">14:00</div>
        <div class="flex-1"><h4 class="font-bold text-sm">Workshop: 用 Claude 建構 AI Agent</h4><p class="text-xs text-gray-400">實作工作坊 · Workshop 教室（限 50 人）</p></div>
        <span class="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">工作坊</span>
      </div>
      <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
        <div class="text-xs text-expo-400 font-bold w-16 shrink-0">16:00</div>
        <div class="flex-1"><h4 class="font-bold text-sm">Startup Battle 初賽（第一組）</h4><p class="text-xs text-gray-400">20 組新創 × 5 分鐘 Pitch · 新創舞台</p></div>
        <span class="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">競賽</span>
      </div>
    </div>
    <div id="day2" class="schedule-content hidden space-y-3">
      <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
        <div class="text-xs text-expo-400 font-bold w-16 shrink-0">09:30</div>
        <div class="flex-1"><h4 class="font-bold text-sm">Keynote: XR 與空間計算的未來</h4><p class="text-xs text-gray-400">Apple Vision Pro 產品總監 · 主舞台</p></div>
        <span class="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">🔥 熱門</span>
      </div>
      <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
        <div class="text-xs text-expo-400 font-bold w-16 shrink-0">11:00</div>
        <div class="flex-1"><h4 class="font-bold text-sm">Panel: 半導體供應鏈重塑</h4><p class="text-xs text-gray-400">TSMC、三星、Intel 代表 · 論壇廳 A</p></div>
        <span class="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">論壇</span>
      </div>
      <div class="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
        <div class="text-xs text-expo-400 font-bold w-16 shrink-0">14:00</div>
        <div class="flex-1"><h4 class="font-bold text-sm">Workshop: 機器人 ROS2 入門實作</h4><p class="text-xs text-gray-400">動手操作工業手臂 · Workshop 教室</p></div>
        <span class="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">工作坊</span>
      </div>
    </div>
    <div id="day3" class="schedule-content hidden"><div class="text-center py-8 text-gray-500 text-sm">Day 3 議程即將公布，敬請期待 🎉</div></div>
    <div id="day4" class="schedule-content hidden"><div class="text-center py-8 text-gray-500 text-sm">Day 4 議程即將公布，敬請期待 🎉</div></div>
  </div>
</section>

<!-- Forum Speakers -->
<section id="forum" class="max-w-6xl mx-auto px-6 py-12">
  <h2 class="text-2xl font-bold mb-8 text-center">🎤 重量級講者</h2>
  <div class="grid grid-cols-4 gap-5">
    <div class="bg-white/5 rounded-xl p-5 text-center border border-white/5 hover:border-expo-400/20 transition cursor-pointer">
      <div class="w-16 h-16 rounded-full bg-gradient-to-br from-expo-400 to-orange-500 flex items-center justify-center text-2xl mx-auto mb-3">🧑‍💼</div>
      <h4 class="font-bold text-sm">Dario Amodei</h4>
      <p class="text-[10px] text-expo-400">Anthropic CEO</p>
      <p class="text-[10px] text-gray-500 mt-1">AI Safety & Alignment</p>
    </div>
    <div class="bg-white/5 rounded-xl p-5 text-center border border-white/5 hover:border-expo-400/20 transition cursor-pointer">
      <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-2xl mx-auto mb-3">👩‍💻</div>
      <h4 class="font-bold text-sm">Lisa Su</h4>
      <p class="text-[10px] text-expo-400">AMD CEO</p>
      <p class="text-[10px] text-gray-500 mt-1">AI 晶片與運算未來</p>
    </div>
    <div class="bg-white/5 rounded-xl p-5 text-center border border-white/5 hover:border-expo-400/20 transition cursor-pointer">
      <div class="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-2xl mx-auto mb-3">🧑‍🔬</div>
      <h4 class="font-bold text-sm">黃仁勳</h4>
      <p class="text-[10px] text-expo-400">NVIDIA CEO</p>
      <p class="text-[10px] text-gray-500 mt-1">GPU 與 AI 基礎設施</p>
    </div>
    <div class="bg-white/5 rounded-xl p-5 text-center border border-white/5 hover:border-expo-400/20 transition cursor-pointer">
      <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-2xl mx-auto mb-3">👩‍🏫</div>
      <h4 class="font-bold text-sm">唐鳳</h4>
      <p class="text-[10px] text-expo-400">前數位部長</p>
      <p class="text-[10px] text-gray-500 mt-1">數位民主與開放治理</p>
    </div>
  </div>
</section>

<!-- Sponsors -->
<section class="bg-white/[0.02] py-10">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-lg font-bold mb-6 text-center text-gray-400">🤝 贊助夥伴</h2>
    <div class="flex justify-center gap-8 items-center flex-wrap">
      <div class="bg-white/5 rounded-lg px-6 py-3 text-sm font-bold text-gray-400 border border-white/5">NVIDIA</div>
      <div class="bg-white/5 rounded-lg px-6 py-3 text-sm font-bold text-gray-400 border border-white/5">TSMC</div>
      <div class="bg-white/5 rounded-lg px-6 py-3 text-sm font-bold text-gray-400 border border-white/5">Google</div>
      <div class="bg-white/5 rounded-lg px-6 py-3 text-sm font-bold text-gray-400 border border-white/5">Microsoft</div>
      <div class="bg-white/5 rounded-lg px-6 py-3 text-sm font-bold text-gray-400 border border-white/5">Anthropic</div>
      <div class="bg-white/5 rounded-lg px-6 py-3 text-sm font-bold text-gray-400 border border-white/5">AMD</div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="max-w-6xl mx-auto px-6 py-12">
  <h2 class="text-2xl font-bold mb-8 text-center">❓ 常見問題</h2>
  <div class="max-w-2xl mx-auto space-y-3">
    <div class="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm hover:bg-white/5 transition"><span>可以現場購票嗎？</span><span class="text-expo-400 text-lg">+</span></button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-400">可以，但建議提前線上購票。現場購票為原價 $980，不享早鳥優惠。VIP 通行證僅限線上預購。</div>
    </div>
    <div class="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm hover:bg-white/5 transition"><span>有提供停車場嗎？</span><span class="text-expo-400 text-lg">+</span></button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-400">南港展覽館地下停車場約 2,500 個車位，展覽期間收費每小時 $40。建議搭乘捷運板南線至「南港展覽館站」最方便。</div>
    </div>
    <div class="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm hover:bg-white/5 transition"><span>工作坊需要另外報名嗎？</span><span class="text-expo-400 text-lg">+</span></button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-400">是的，工作坊名額有限（通常 30-50 人），需要另外在官網報名。VIP 通行證持有者享優先報名權。部分工作坊需額外付費。</div>
    </div>
  </div>
</section>

<!-- Transport -->
<section id="transport" class="max-w-6xl mx-auto px-6 py-10">
  <div class="bg-white/5 rounded-2xl p-8 border border-white/5">
    <h2 class="font-bold text-lg mb-4">🚇 交通指南</h2>
    <div class="grid grid-cols-2 gap-6">
      <div class="space-y-2 text-xs text-gray-400">
        <p>📍 台北市南港區經貿二路 1 號（南港展覽館 1 & 2 館）</p>
        <p>🚇 捷運板南線「南港展覽館站」1 號出口直達</p>
        <p>🚄 高鐵「南港站」步行 10 分鐘</p>
        <p>🚌 公車 212、270、藍 25 在「南港展覽館」站下車</p>
        <p>🚗 國道 1 號南港交流道下，沿經貿二路直行</p>
      </div>
      <div class="bg-white/5 rounded-xl h-40 flex items-center justify-center text-4xl">🗺️</div>
    </div>
  </div>
</section>

<footer class="border-t border-white/5 py-6">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-gray-500">
    <div class="flex items-center gap-2"><div class="w-6 h-6 rounded bg-gradient-to-br from-expo-400 to-orange-500 flex items-center justify-center text-[10px] font-bold text-deep-900">EW</div><span class="text-white font-medium">ExpoWorld 2026</span></div>
    <div>© 2026 ExpoWorld · 探索科技的無限可能</div>
  </div>
</footer>

<script>
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const icon = btn.querySelector('span:last-child');
  answer.classList.toggle('open');
  icon.textContent = answer.classList.contains('open') ? '−' : '+';
}
function switchDay(dayId, btn) {
  document.querySelectorAll('.schedule-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.schedule-content').forEach(c => c.classList.add('hidden'));
  document.getElementById(dayId).classList.remove('hidden');
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
