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
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-blue-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><span class="text-xl">✝️</span><span class="serif text-lg font-bold text-gray-800">恩典教會</span><span class="text-[10px] text-grace-500 font-medium">GraceChurch</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-500">
      <a class="hover:text-grace-500 transition cursor-pointer">關於我們</a>
      <a class="hover:text-grace-500 transition cursor-pointer">主日崇拜</a>
      <a class="hover:text-grace-500 transition cursor-pointer">小組活動</a>
      <a class="hover:text-grace-500 transition cursor-pointer">新朋友</a>
      <button class="bg-grace-500 hover:bg-grace-600 text-white px-5 py-1.5 rounded-full text-sm font-medium transition">線上奉獻</button>
    </div>
  </div>
</nav>

<section class="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 relative overflow-hidden">
  <div class="absolute right-0 top-0 w-96 h-96 bg-grace-200/20 rounded-full blur-[100px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-14">
    <div class="flex-1">
      <span class="inline-block text-xs bg-grace-100 text-grace-600 px-3 py-1 rounded-full font-medium mb-4">🕊️ 歡迎回家</span>
      <h1 class="serif text-5xl font-bold text-gray-800 leading-tight mb-4">在恩典中<br>找到愛與盼望</h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-md">恩典教會是一個充滿溫暖與愛的大家庭。無論你是否有信仰背景，我們都歡迎你來這裡，一起經歷上帝的美好。</p>
      <div class="flex gap-3">
        <button class="bg-grace-500 hover:bg-grace-600 text-white px-8 py-3 rounded-full font-medium transition shadow-lg shadow-grace-200">主日崇拜資訊</button>
        <button class="border border-grace-400 text-grace-600 hover:bg-grace-50 px-8 py-3 rounded-full font-medium transition">我是新朋友</button>
      </div>
    </div>
    <div class="w-72 h-80 rounded-3xl bg-gradient-to-b from-grace-200 to-indigo-200 flex items-center justify-center text-8xl shadow-xl shadow-grace-100">⛪</div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-14">
  <div class="text-center mb-10"><h2 class="serif text-3xl font-bold text-gray-800 mb-2">主日崇拜</h2><p class="text-sm text-gray-400">每個主日，與我們一起敬拜</p></div>
  <div class="grid grid-cols-3 gap-6">
    <div class="bg-white rounded-2xl p-6 border border-blue-50 text-center hover:shadow-md transition cursor-pointer">
      <div class="text-3xl mb-3">🌅</div>
      <h3 class="font-bold text-gray-800">第一堂</h3>
      <div class="text-grace-500 font-medium text-sm mt-1">週日 09:00</div>
      <p class="text-xs text-gray-400 mt-2">華語崇拜 · 兒童主日學同步</p>
    </div>
    <div class="bg-white rounded-2xl p-6 border border-blue-50 text-center hover:shadow-md transition cursor-pointer">
      <div class="text-3xl mb-3">☀️</div>
      <h3 class="font-bold text-gray-800">第二堂</h3>
      <div class="text-grace-500 font-medium text-sm mt-1">週日 11:00</div>
      <p class="text-xs text-gray-400 mt-2">華語崇拜 · 青年敬拜團</p>
    </div>
    <div class="bg-white rounded-2xl p-6 border border-blue-50 text-center hover:shadow-md transition cursor-pointer">
      <div class="text-3xl mb-3">🌙</div>
      <h3 class="font-bold text-gray-800">晚崇拜</h3>
      <div class="text-grace-500 font-medium text-sm mt-1">週日 19:00</div>
      <p class="text-xs text-gray-400 mt-2">英語崇拜 · 國際事工</p>
    </div>
  </div>
</section>

<section class="bg-grace-600 text-white py-14">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between mb-8"><h2 class="serif text-2xl font-bold">📅 近期活動</h2><a class="text-sm text-white/70 hover:text-white cursor-pointer">查看全部 →</a></div>
    <div class="grid grid-cols-3 gap-5">
      <div class="event-card bg-white/10 rounded-xl p-5 border border-white/10">
        <div class="text-xs text-grace-200">2/22（六）14:00</div>
        <h3 class="font-bold mt-2">春季福音茶會</h3>
        <p class="text-xs text-white/60 mt-1">歡迎帶朋友一起來！有茶點、音樂和見證分享。</p>
        <button class="mt-3 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition">立即報名</button>
      </div>
      <div class="event-card bg-white/10 rounded-xl p-5 border border-white/10">
        <div class="text-xs text-grace-200">3/01（六）09:00</div>
        <h3 class="font-bold mt-2">社區愛心送餐</h3>
        <p class="text-xs text-white/60 mt-1">為社區獨居長者準備愛心便當，需要 20 位志工。</p>
        <button class="mt-3 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition">我要參加</button>
      </div>
      <div class="event-card bg-white/10 rounded-xl p-5 border border-white/10">
        <div class="text-xs text-grace-200">3/08 - 3/09</div>
        <h3 class="font-bold mt-2">青年退修會</h3>
        <p class="text-xs text-white/60 mt-1">兩天一夜，在自然中安靜、敬拜、團契。</p>
        <button class="mt-3 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition">了解詳情</button>
      </div>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-14">
  <h2 class="serif text-2xl font-bold text-gray-800 mb-8 text-center">小組生活</h2>
  <div class="grid grid-cols-4 gap-5">
    <div class="bg-white rounded-xl p-5 border border-blue-50 text-center hover:shadow-md transition cursor-pointer"><div class="text-3xl mb-2">👨‍👩‍👧‍👦</div><h3 class="font-bold text-gray-800 text-sm">家庭小組</h3><p class="text-xs text-gray-400 mt-1">週三 19:30</p></div>
    <div class="bg-white rounded-xl p-5 border border-blue-50 text-center hover:shadow-md transition cursor-pointer"><div class="text-3xl mb-2">🎓</div><h3 class="font-bold text-gray-800 text-sm">青年小組</h3><p class="text-xs text-gray-400 mt-1">週五 19:00</p></div>
    <div class="bg-white rounded-xl p-5 border border-blue-50 text-center hover:shadow-md transition cursor-pointer"><div class="text-3xl mb-2">👵</div><h3 class="font-bold text-gray-800 text-sm">松年小組</h3><p class="text-xs text-gray-400 mt-1">週二 10:00</p></div>
    <div class="bg-white rounded-xl p-5 border border-blue-50 text-center hover:shadow-md transition cursor-pointer"><div class="text-3xl mb-2">🌍</div><h3 class="font-bold text-gray-800 text-sm">國際小組</h3><p class="text-xs text-gray-400 mt-1">週日 13:00 (English)</p></div>
  </div>
</section>

<section class="bg-warm-50 py-12">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <h2 class="serif text-2xl font-bold text-gray-800 mb-2">💝 本週金句</h2>
    <blockquote class="serif text-xl text-gray-600 italic my-6 leading-relaxed">「你們要將一切的憂慮卸給神，因為祂顧念你們。」</blockquote>
    <cite class="text-sm text-gray-400">— 彼得前書 5:7</cite>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-12">
  <div class="bg-white rounded-2xl p-8 border border-blue-50 flex items-center gap-8">
    <div class="flex-1">
      <h2 class="serif text-xl font-bold text-gray-800 mb-2">交通資訊</h2>
      <p class="text-sm text-gray-500 mb-3">📍 台北市中正區忠孝東路一段 108 號 3F</p>
      <div class="text-xs text-gray-400 space-y-1">
        <p>🚇 捷運善導寺站 5 號出口，步行 3 分鐘</p>
        <p>🚗 忠孝新生站地下停車場（教會補助停車費）</p>
        <p>📞 (02) 2394-5678</p>
      </div>
    </div>
    <div class="w-48 h-32 rounded-xl bg-grace-100 flex items-center justify-center text-4xl">🗺️</div>
  </div>
</section>

<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
    <div class="flex items-center gap-2"><span>✝️</span><span class="serif text-white font-bold">恩典教會</span></div>
    <div class="text-xs">© 2026 GraceChurch · 用愛連結每一個生命</div>
  </div>
</footer>
</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
