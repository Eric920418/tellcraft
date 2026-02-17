INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'a9b9acab-f63f-4043-8a5d-43a204280ad4',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>恩典教會 GraceChurch</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { grace: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',400:'#60a5fa',500:'#3b82f6',600:'#2563eb' }, warm: { 50:'#fffbeb',100:'#fef3c7',400:'#fbbf24',500:'#f59e0b' } } } } } }
</script>
<style>
body { font-family: 'DM Sans', sans-serif; background: #fafbff; }
.serif { font-family: 'Cormorant Garamond', serif; }
.event-card { transition: all 0.3s; cursor: pointer; }
.event-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(59,130,246,0.1); }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.faq-answer.open { max-height: 300px; }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-blue-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><span class="text-xl">✝️</span><span class="serif text-lg font-bold text-gray-800">恩典教會</span><span class="text-[10px] text-grace-500 font-medium">GraceChurch</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-500">
      <a onclick="document.getElementById('about').scrollIntoView({behavior:'smooth'})" class="hover:text-grace-500 transition cursor-pointer">關於我們</a>
      <a onclick="document.getElementById('worship').scrollIntoView({behavior:'smooth'})" class="hover:text-grace-500 transition cursor-pointer">主日崇拜</a>
      <a onclick="document.getElementById('groups').scrollIntoView({behavior:'smooth'})" class="hover:text-grace-500 transition cursor-pointer">小組活動</a>
      <a onclick="document.getElementById('newcomer').scrollIntoView({behavior:'smooth'})" class="hover:text-grace-500 transition cursor-pointer">新朋友</a>
      <button onclick="document.getElementById('offeringModal').classList.remove('hidden')" class="bg-grace-500 hover:bg-grace-600 text-white px-5 py-1.5 rounded-full text-sm font-medium transition">線上奉獻</button>
    </div>
  </div>
</nav>

<!-- Offering Modal -->
<div id="offeringModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
    <button onclick="document.getElementById('offeringModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
    <div class="text-center mb-6">
      <div class="text-4xl mb-2">💝</div>
      <h3 class="serif text-xl font-bold text-gray-800">線上奉獻</h3>
      <p class="text-sm text-gray-400 mt-1">感謝您的慷慨奉獻</p>
    </div>
    <div id="offerForm">
      <input type="text" placeholder="姓名" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-grace-400">
      <div class="text-xs text-gray-500 mb-2">奉獻類別</div>
      <div class="grid grid-cols-2 gap-2 mb-3">
        <label class="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded-lg cursor-pointer"><input type="radio" name="type" class="accent-blue-500" checked> 什一奉獻</label>
        <label class="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded-lg cursor-pointer"><input type="radio" name="type" class="accent-blue-500"> 感恩奉獻</label>
        <label class="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded-lg cursor-pointer"><input type="radio" name="type" class="accent-blue-500"> 宣教基金</label>
        <label class="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded-lg cursor-pointer"><input type="radio" name="type" class="accent-blue-500"> 建堂基金</label>
      </div>
      <input type="text" placeholder="奉獻金額（NTD）" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-grace-400">
      <div class="text-xs text-gray-500 mb-2">付款方式</div>
      <div class="flex gap-2 mb-4">
        <button class="flex-1 text-xs bg-grace-50 border border-grace-200 text-grace-600 py-2 rounded-lg font-medium">信用卡</button>
        <button class="flex-1 text-xs bg-gray-50 border border-gray-200 text-gray-500 py-2 rounded-lg font-medium">銀行轉帳</button>
        <button class="flex-1 text-xs bg-gray-50 border border-gray-200 text-gray-500 py-2 rounded-lg font-medium">Line Pay</button>
      </div>
      <button onclick="document.getElementById('offerForm').innerHTML='<div class=\'text-center py-6\'><div class=\'text-5xl mb-3\'>🙏</div><p class=\'serif text-lg font-bold text-gray-800\'>感謝您的奉獻</p><p class=\'text-sm text-gray-400 mt-1\'>願上帝賜福予您</p></div>'" class="w-full bg-grace-500 hover:bg-grace-600 text-white py-2.5 rounded-xl font-medium text-sm transition">確認奉獻</button>
    </div>
  </div>
</div>

<!-- Event Registration Modal -->
<div id="eventModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
    <button onclick="document.getElementById('eventModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
    <div class="text-center mb-6">
      <div class="text-4xl mb-2">📋</div>
      <h3 class="serif text-xl font-bold text-gray-800">活動報名</h3>
      <p class="text-sm text-gray-400 mt-1" id="eventTitle"></p>
    </div>
    <div id="eventForm">
      <input type="text" placeholder="姓名" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-grace-400">
      <input type="tel" placeholder="手機號碼" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-grace-400">
      <input type="number" placeholder="參加人數" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-grace-400">
      <textarea placeholder="備註（如素食、兒童人數等）" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-grace-400 h-20 resize-none"></textarea>
      <button onclick="document.getElementById('eventForm').innerHTML='<div class=\'text-center py-6\'><div class=\'text-5xl mb-3\'>✅</div><p class=\'font-bold text-gray-800\'>報名成功！</p><p class=\'text-sm text-gray-400 mt-1\'>我們會發送確認簡訊給您</p></div>'" class="w-full bg-grace-500 hover:bg-grace-600 text-white py-2.5 rounded-xl font-medium text-sm transition">確認報名</button>
    </div>
  </div>
</div>

<section class="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 relative overflow-hidden">
  <div class="absolute right-0 top-0 w-96 h-96 bg-grace-200/20 rounded-full blur-[100px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-14">
    <div class="flex-1">
      <span class="inline-block text-xs bg-grace-100 text-grace-600 px-3 py-1 rounded-full font-medium mb-4">🕊️ 歡迎回家</span>
      <h1 class="serif text-5xl font-bold text-gray-800 leading-tight mb-4">在恩典中<br>找到愛與盼望</h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-md">恩典教會是一個充滿溫暖與愛的大家庭。無論你是否有信仰背景，我們都歡迎你來這裡，一起經歷上帝的美好。</p>
      <div class="flex gap-3">
        <button onclick="document.getElementById('worship').scrollIntoView({behavior:'smooth'})" class="bg-grace-500 hover:bg-grace-600 text-white px-8 py-3 rounded-full font-medium transition shadow-lg shadow-grace-200">主日崇拜資訊</button>
        <button onclick="document.getElementById('newcomer').scrollIntoView({behavior:'smooth'})" class="border border-grace-400 text-grace-600 hover:bg-grace-50 px-8 py-3 rounded-full font-medium transition">我是新朋友</button>
      </div>
    </div>
    <div class="w-72 h-80 rounded-3xl bg-gradient-to-b from-grace-200 to-indigo-200 flex items-center justify-center text-8xl shadow-xl shadow-grace-100">⛪</div>
  </div>
</section>

<!-- Stats -->
<section class="bg-white border-b border-blue-50">
  <div class="max-w-6xl mx-auto px-6 py-6 grid grid-cols-4 gap-6 text-center">
    <div><div class="text-2xl font-bold text-grace-500">35</div><div class="text-xs text-gray-400">年歷史</div></div>
    <div><div class="text-2xl font-bold text-grace-500">800+</div><div class="text-xs text-gray-400">會友人數</div></div>
    <div><div class="text-2xl font-bold text-grace-500">12</div><div class="text-xs text-gray-400">小組數目</div></div>
    <div><div class="text-2xl font-bold text-grace-500">3</div><div class="text-xs text-gray-400">堂主日崇拜</div></div>
  </div>
</section>

<!-- About -->
<section id="about" class="max-w-6xl mx-auto px-6 py-14">
  <div class="flex gap-12 items-center">
    <div class="flex-1">
      <h2 class="serif text-3xl font-bold text-gray-800 mb-4">關於恩典教會</h2>
      <p class="text-sm text-gray-500 leading-relaxed mb-4">恩典教會成立於 1991 年，從一間只有 20 人的家庭聚會，到今天成為擁有 800+ 位會友的溫馨教會。我們的異象是「用恩典連結生命，用愛改變社區」。</p>
      <p class="text-sm text-gray-500 leading-relaxed mb-4">我們相信每一個人都是上帝獨特的傑作，無論你的背景如何，都能在這裡找到歸屬感。教會不只是週日的聚會，更是生活中彼此扶持的大家庭。</p>
      <div class="flex gap-4 mt-6">
        <div class="bg-grace-50 rounded-xl px-5 py-3 text-center"><div class="text-lg">🎯</div><div class="text-xs font-medium text-grace-600 mt-1">異象</div><div class="text-[10px] text-gray-400">用愛改變社區</div></div>
        <div class="bg-grace-50 rounded-xl px-5 py-3 text-center"><div class="text-lg">📖</div><div class="text-xs font-medium text-grace-600 mt-1">使命</div><div class="text-[10px] text-gray-400">裝備門徒</div></div>
        <div class="bg-grace-50 rounded-xl px-5 py-3 text-center"><div class="text-lg">❤️</div><div class="text-xs font-medium text-grace-600 mt-1">核心</div><div class="text-[10px] text-gray-400">恩典與真理</div></div>
      </div>
    </div>
    <div class="w-80 h-60 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-200 flex items-center justify-center text-6xl">🤝</div>
  </div>
</section>

<!-- Worship -->
<section id="worship" class="bg-gradient-to-b from-blue-50 to-white py-14">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-10"><h2 class="serif text-3xl font-bold text-gray-800 mb-2">主日崇拜</h2><p class="text-sm text-gray-400">每個主日，與我們一起敬拜</p></div>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-white rounded-2xl p-6 border border-blue-50 text-center hover:shadow-md transition cursor-pointer">
        <div class="text-3xl mb-3">🌅</div>
        <h3 class="font-bold text-gray-800">第一堂</h3>
        <div class="text-grace-500 font-medium text-sm mt-1">週日 09:00</div>
        <p class="text-xs text-gray-400 mt-2">華語崇拜 · 兒童主日學同步</p>
        <div class="mt-3 text-[10px] text-gray-300">講員：王牧師 · 約 90 分鐘</div>
      </div>
      <div class="bg-white rounded-2xl p-6 border border-blue-50 text-center hover:shadow-md transition cursor-pointer">
        <div class="text-3xl mb-3">☀️</div>
        <h3 class="font-bold text-gray-800">第二堂</h3>
        <div class="text-grace-500 font-medium text-sm mt-1">週日 11:00</div>
        <p class="text-xs text-gray-400 mt-2">華語崇拜 · 青年敬拜團</p>
        <div class="mt-3 text-[10px] text-gray-300">講員：李傳道 · 約 90 分鐘</div>
      </div>
      <div class="bg-white rounded-2xl p-6 border border-blue-50 text-center hover:shadow-md transition cursor-pointer">
        <div class="text-3xl mb-3">🌙</div>
        <h3 class="font-bold text-gray-800">晚崇拜</h3>
        <div class="text-grace-500 font-medium text-sm mt-1">週日 19:00</div>
        <p class="text-xs text-gray-400 mt-2">英語崇拜 · 國際事工</p>
        <div class="mt-3 text-[10px] text-gray-300">講員：Pastor John · ~75 min</div>
      </div>
    </div>
    <div class="mt-6 text-center"><p class="text-xs text-gray-400">🎥 無法親臨？我們提供<a class="text-grace-500 font-medium cursor-pointer hover:underline">線上直播</a>，每堂崇拜同步播出</p></div>
  </div>
</section>

<!-- Events -->
<section class="bg-grace-600 text-white py-14">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between mb-8"><h2 class="serif text-2xl font-bold">📅 近期活動</h2><a class="text-sm text-white/70 hover:text-white cursor-pointer">查看全部 →</a></div>
    <div class="grid grid-cols-3 gap-5">
      <div class="event-card bg-white/10 rounded-xl p-5 border border-white/10">
        <div class="text-xs text-grace-200">2/22（六）14:00</div>
        <h3 class="font-bold mt-2">春季福音茶會</h3>
        <p class="text-xs text-white/60 mt-1">歡迎帶朋友一起來！有茶點、音樂和見證分享。</p>
        <div class="flex items-center gap-2 mt-2 text-[10px] text-white/40"><span>📍 副堂</span><span>·</span><span>👥 限額 80 人</span></div>
        <button onclick="document.getElementById('eventTitle').textContent='春季福音茶會 2/22（六）14:00';document.getElementById('eventModal').classList.remove('hidden')" class="mt-3 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition">立即報名</button>
      </div>
      <div class="event-card bg-white/10 rounded-xl p-5 border border-white/10">
        <div class="text-xs text-grace-200">3/01（六）09:00</div>
        <h3 class="font-bold mt-2">社區愛心送餐</h3>
        <p class="text-xs text-white/60 mt-1">為社區獨居長者準備愛心便當，需要 20 位志工。</p>
        <div class="flex items-center gap-2 mt-2 text-[10px] text-white/40"><span>📍 教會廚房</span><span>·</span><span>🙋 需 20 位志工</span></div>
        <button onclick="document.getElementById('eventTitle').textContent='社區愛心送餐 3/01（六）09:00';document.getElementById('eventModal').classList.remove('hidden')" class="mt-3 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition">我要參加</button>
      </div>
      <div class="event-card bg-white/10 rounded-xl p-5 border border-white/10">
        <div class="text-xs text-grace-200">3/08 - 3/09</div>
        <h3 class="font-bold mt-2">青年退修會</h3>
        <p class="text-xs text-white/60 mt-1">兩天一夜，在自然中安靜、敬拜、團契。</p>
        <div class="flex items-center gap-2 mt-2 text-[10px] text-white/40"><span>📍 石碇靈修中心</span><span>·</span><span>💰 $800/人</span></div>
        <button onclick="document.getElementById('eventTitle').textContent='青年退修會 3/08-09';document.getElementById('eventModal').classList.remove('hidden')" class="mt-3 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition">了解詳情</button>
      </div>
    </div>
  </div>
</section>

<!-- Groups -->
<section id="groups" class="max-w-6xl mx-auto px-6 py-14">
  <h2 class="serif text-2xl font-bold text-gray-800 mb-2 text-center">小組生活</h2>
  <p class="text-sm text-gray-400 text-center mb-8">教會不只是週日，更是一週七天的彼此關懷</p>
  <div class="grid grid-cols-4 gap-5">
    <div class="bg-white rounded-xl p-5 border border-blue-50 text-center hover:shadow-md transition cursor-pointer">
      <div class="text-3xl mb-2">👨‍👩‍👧‍👦</div>
      <h3 class="font-bold text-gray-800 text-sm">家庭小組</h3>
      <p class="text-xs text-gray-400 mt-1">週三 19:30</p>
      <p class="text-[10px] text-gray-300 mt-1">已婚夫妻及家庭 · 4 組</p>
    </div>
    <div class="bg-white rounded-xl p-5 border border-blue-50 text-center hover:shadow-md transition cursor-pointer">
      <div class="text-3xl mb-2">🎓</div>
      <h3 class="font-bold text-gray-800 text-sm">青年小組</h3>
      <p class="text-xs text-gray-400 mt-1">週五 19:00</p>
      <p class="text-[10px] text-gray-300 mt-1">18-35 歲 · 3 組</p>
    </div>
    <div class="bg-white rounded-xl p-5 border border-blue-50 text-center hover:shadow-md transition cursor-pointer">
      <div class="text-3xl mb-2">👵</div>
      <h3 class="font-bold text-gray-800 text-sm">松年小組</h3>
      <p class="text-xs text-gray-400 mt-1">週二 10:00</p>
      <p class="text-[10px] text-gray-300 mt-1">60 歲以上長輩 · 2 組</p>
    </div>
    <div class="bg-white rounded-xl p-5 border border-blue-50 text-center hover:shadow-md transition cursor-pointer">
      <div class="text-3xl mb-2">🌍</div>
      <h3 class="font-bold text-gray-800 text-sm">國際小組</h3>
      <p class="text-xs text-gray-400 mt-1">週日 13:00 (English)</p>
      <p class="text-[10px] text-gray-300 mt-1">International · 3 groups</p>
    </div>
  </div>
</section>

<!-- Sermon Series -->
<section class="bg-gradient-to-r from-indigo-50 to-blue-50 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold text-gray-800 mb-8 text-center">🎙️ 最新講道系列</h2>
    <div class="grid grid-cols-3 gap-5">
      <div class="bg-white rounded-xl p-5 border border-blue-50 hover:shadow-md transition cursor-pointer">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-grace-400 to-indigo-500 flex items-center justify-center text-white text-lg">01</div>
          <div><h3 class="font-bold text-gray-800 text-sm">恩典之路</h3><p class="text-[10px] text-gray-400">2026/02/16 · 王牧師</p></div>
        </div>
        <p class="text-xs text-gray-500">從以弗所書看上帝的恩典如何改變我們的生命…</p>
        <button class="mt-3 text-xs text-grace-500 font-medium hover:underline">▶ 收聽錄音</button>
      </div>
      <div class="bg-white rounded-xl p-5 border border-blue-50 hover:shadow-md transition cursor-pointer">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-grace-400 to-indigo-500 flex items-center justify-center text-white text-lg">02</div>
          <div><h3 class="font-bold text-gray-800 text-sm">信心的旅程</h3><p class="text-[10px] text-gray-400">2026/02/09 · 李傳道</p></div>
        </div>
        <p class="text-xs text-gray-500">希伯來書 11 章的信心英雄，給我們今天什麼啟示…</p>
        <button class="mt-3 text-xs text-grace-500 font-medium hover:underline">▶ 收聽錄音</button>
      </div>
      <div class="bg-white rounded-xl p-5 border border-blue-50 hover:shadow-md transition cursor-pointer">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-grace-400 to-indigo-500 flex items-center justify-center text-white text-lg">03</div>
          <div><h3 class="font-bold text-gray-800 text-sm">愛的語言</h3><p class="text-[10px] text-gray-400">2026/02/02 · 王牧師</p></div>
        </div>
        <p class="text-xs text-gray-500">哥林多前書 13 章的愛，如何實踐在日常關係中…</p>
        <button class="mt-3 text-xs text-grace-500 font-medium hover:underline">▶ 收聽錄音</button>
      </div>
    </div>
  </div>
</section>

<!-- Weekly Scripture -->
<section class="bg-warm-50 py-12">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <h2 class="serif text-2xl font-bold text-gray-800 mb-2">💝 本週金句</h2>
    <blockquote class="serif text-xl text-gray-600 italic my-6 leading-relaxed">「你們要將一切的憂慮卸給神，因為祂顧念你們。」</blockquote>
    <cite class="text-sm text-gray-400">— 彼得前書 5:7</cite>
  </div>
</section>

<!-- Newcomer Section -->
<section id="newcomer" class="max-w-6xl mx-auto px-6 py-14">
  <div class="bg-gradient-to-r from-grace-50 to-indigo-50 rounded-2xl p-10">
    <h2 class="serif text-2xl font-bold text-gray-800 mb-2 text-center">🤗 新朋友專區</h2>
    <p class="text-sm text-gray-400 text-center mb-8">第一次來教會？別緊張，我們準備了一些資訊給你</p>
    <div class="grid grid-cols-3 gap-6">
      <div class="text-center">
        <div class="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl mx-auto mb-3">1️⃣</div>
        <h3 class="font-bold text-gray-800 text-sm">提早 10 分鐘到</h3>
        <p class="text-xs text-gray-400 mt-1">接待同工會在門口歡迎你，帶你熟悉環境</p>
      </div>
      <div class="text-center">
        <div class="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl mx-auto mb-3">2️⃣</div>
        <h3 class="font-bold text-gray-800 text-sm">自在參與</h3>
        <p class="text-xs text-gray-400 mt-1">崇拜約 90 分鐘，可以坐著聆聽，不用勉強任何事</p>
      </div>
      <div class="text-center">
        <div class="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl mx-auto mb-3">3️⃣</div>
        <h3 class="font-bold text-gray-800 text-sm">留下來聊聊</h3>
        <p class="text-xs text-gray-400 mt-1">崇拜後有茶點時間，歡迎認識新朋友</p>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="max-w-6xl mx-auto px-6 py-8">
  <h2 class="serif text-2xl font-bold text-gray-800 mb-8 text-center">❓ 常見問題</h2>
  <div class="max-w-2xl mx-auto space-y-3">
    <div class="bg-white rounded-xl border border-blue-50 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-gray-800 hover:bg-blue-50 transition"><span>我沒有信仰背景，可以來嗎？</span><span class="text-grace-400 text-lg">+</span></button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500">當然可以！恩典教會歡迎所有人，無論你有沒有信仰背景。你可以先來參加主日崇拜，感受教會的氛圍。如果你想更深入了解基督信仰，我們有專門為慕道友開設的「信仰探索班」。</div>
    </div>
    <div class="bg-white rounded-xl border border-blue-50 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-gray-800 hover:bg-blue-50 transition"><span>有停車場嗎？</span><span class="text-grace-400 text-lg">+</span></button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500">教會旁有忠孝新生站地下停車場，教會補助主日停車費（憑停車單至服務台蓋章）。也可以搭捷運到善導寺站 5 號出口，步行 3 分鐘即到。</div>
    </div>
    <div class="bg-white rounded-xl border border-blue-50 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-gray-800 hover:bg-blue-50 transition"><span>小孩可以一起來嗎？</span><span class="text-grace-400 text-lg">+</span></button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500">非常歡迎！第一堂和第二堂崇拜都有同步的兒童主日學（3-12 歲）。2 歲以下的寶寶可以到「愛的小屋」嬰兒室，有專人照顧，家長可以安心參加崇拜。</div>
    </div>
    <div class="bg-white rounded-xl border border-blue-50 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-gray-800 hover:bg-blue-50 transition"><span>如何加入小組？</span><span class="text-grace-400 text-lg">+</span></button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500">崇拜後可以到服務台詢問，我們會根據你的年齡、興趣和所在區域推薦適合的小組。也可以先來「體驗」1-2 次，覺得合適再正式加入。</div>
    </div>
  </div>
</section>

<!-- Location -->
<section class="max-w-6xl mx-auto px-6 py-10">
  <div class="bg-white rounded-2xl p-8 border border-blue-50 flex items-center gap-8">
    <div class="flex-1">
      <h2 class="serif text-xl font-bold text-gray-800 mb-2">交通資訊</h2>
      <p class="text-sm text-gray-500 mb-3">📍 台北市中正區忠孝東路一段 108 號 3F</p>
      <div class="text-xs text-gray-400 space-y-1">
        <p>🚇 捷運善導寺站 5 號出口，步行 3 分鐘</p>
        <p>🚗 忠孝新生站地下停車場（教會補助停車費）</p>
        <p>🚌 公車 205、212、232 在「善導寺」站下車</p>
        <p>📞 (02) 2394-5678</p>
        <p>📧 info@gracechurch.tw</p>
      </div>
    </div>
    <div class="w-48 h-36 rounded-xl bg-grace-100 flex items-center justify-center text-4xl">🗺️</div>
  </div>
</section>

<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2"><span>✝️</span><span class="serif text-white font-bold">恩典教會</span></div>
      <div class="flex gap-6 text-xs">
        <a class="hover:text-white transition cursor-pointer">聚會時間</a>
        <a class="hover:text-white transition cursor-pointer">線上奉獻</a>
        <a class="hover:text-white transition cursor-pointer">聯絡我們</a>
        <a class="hover:text-white transition cursor-pointer">隱私政策</a>
      </div>
    </div>
    <div class="text-xs text-gray-500 text-center">© 2026 GraceChurch · 用愛連結每一個生命</div>
  </div>
</footer>

<script>
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const icon = btn.querySelector('span:last-child');
  answer.classList.toggle('open');
  icon.textContent = answer.classList.contains('open') ? '−' : '+';
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
