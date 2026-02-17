INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '1c442c32-3e52-4030-8503-3115d3ad50ac',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>毛孩醫院 PawCare</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { paw: { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',400:'#34d399',500:'#10b981',600:'#059669' }, warm: { 50:'#fffbeb',100:'#fef3c7' } } } } } }
</script>
<style>
* { font-family: 'Nunito', sans-serif; }
body { background: #f8fdf9; }
.service-card { transition: all 0.3s; cursor: pointer; }
.service-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(16,185,129,0.12); }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-green-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><span class="text-xl">🐾</span><span class="text-lg font-extrabold text-emerald-700">PawCare</span><span class="text-[10px] text-paw-500 font-bold">毛孩醫院</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-500 font-semibold">
      <a class="hover:text-paw-500 transition cursor-pointer">服務項目</a>
      <a class="hover:text-paw-500 transition cursor-pointer">醫療團隊</a>
      <a class="hover:text-paw-500 transition cursor-pointer">就診須知</a>
      <a class="hover:text-paw-500 transition cursor-pointer">寵物知識</a>
      <button class="bg-paw-500 hover:bg-paw-600 text-white px-5 py-1.5 rounded-full text-sm font-bold transition">線上預約</button>
    </div>
  </div>
</nav>

<section class="py-20 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
  <div class="absolute right-10 bottom-10 w-72 h-72 bg-paw-200/30 rounded-full blur-[80px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-14">
    <div class="flex-1">
      <span class="inline-block text-xs bg-paw-100 text-paw-600 px-3 py-1 rounded-full font-bold mb-4">🏥 專業寵物醫療</span>
      <h1 class="text-4xl font-extrabold text-gray-800 leading-tight mb-4">給毛孩最溫柔的<br>醫療照護</h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-md">擁有 15 年經驗的獸醫團隊，提供內外科、牙科、中醫、影像診斷等全方位服務。因為愛，所以我們用心守護每一個生命。</p>
      <div class="flex gap-3">
        <button class="bg-paw-500 hover:bg-paw-600 text-white px-8 py-3 rounded-full font-bold transition shadow-lg shadow-paw-200">立即預約</button>
        <button class="border border-paw-400 text-paw-600 hover:bg-paw-50 px-8 py-3 rounded-full font-bold transition">急診專線 ☎</button>
      </div>
    </div>
    <div class="relative">
      <div class="w-72 h-72 rounded-3xl bg-gradient-to-br from-paw-200 to-emerald-200 flex items-center justify-center text-8xl shadow-xl shadow-paw-100">🐕</div>
      <div class="absolute -bottom-3 -left-4 w-16 h-16 rounded-full bg-warm-100 flex items-center justify-center text-2xl shadow-md">🐱</div>
      <div class="absolute -top-2 -right-3 w-14 h-14 rounded-full bg-paw-100 flex items-center justify-center text-xl shadow-md">🩺</div>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-14">
  <div class="text-center mb-10"><h2 class="text-2xl font-extrabold text-gray-800 mb-2">服務項目</h2><p class="text-sm text-gray-400">完善的醫療服務，守護毛孩健康</p></div>
  <div class="grid grid-cols-4 gap-5">
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center"><div class="text-3xl mb-3">💉</div><h3 class="font-bold text-gray-800">預防醫學</h3><p class="text-xs text-gray-400 mt-1">疫苗接種 · 健康檢查 · 驅蟲</p></div>
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center"><div class="text-3xl mb-3">🔬</div><h3 class="font-bold text-gray-800">內科診療</h3><p class="text-xs text-gray-400 mt-1">血液檢查 · 超音波 · X光</p></div>
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center"><div class="text-3xl mb-3">🏥</div><h3 class="font-bold text-gray-800">外科手術</h3><p class="text-xs text-gray-400 mt-1">結紮 · 腫瘤切除 · 骨科</p></div>
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center"><div class="text-3xl mb-3">🦷</div><h3 class="font-bold text-gray-800">牙科護理</h3><p class="text-xs text-gray-400 mt-1">洗牙 · 拔牙 · 口腔檢查</p></div>
  </div>
</section>

<section class="bg-paw-600 text-white py-14">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-2xl font-extrabold mb-8 text-center">醫療團隊</h2>
    <div class="grid grid-cols-3 gap-6">
      <div class="text-center"><div class="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 text-4xl">👨‍⚕️</div><h3 class="font-bold">王建明 院長</h3><div class="text-xs text-paw-200 mt-0.5">台大獸醫碩士 · 15 年經驗</div><p class="text-xs text-white/60 mt-2">專長：內科、腫瘤科</p></div>
      <div class="text-center"><div class="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 text-4xl">👩‍⚕️</div><h3 class="font-bold">陳怡君 醫師</h3><div class="text-xs text-paw-200 mt-0.5">中興獸醫學士 · 10 年經驗</div><p class="text-xs text-white/60 mt-2">專長：外科、骨科</p></div>
      <div class="text-center"><div class="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 text-4xl">👨‍⚕️</div><h3 class="font-bold">林志偉 醫師</h3><div class="text-xs text-paw-200 mt-0.5">屏科大獸醫碩士 · 8 年經驗</div><p class="text-xs text-white/60 mt-2">專長：牙科、中獸醫</p></div>
    </div>
  </div>
</section>

<section class="max-w-6xl mx-auto px-6 py-12">
  <h2 class="text-xl font-extrabold text-gray-800 mb-6 text-center">看診時間</h2>
  <div class="max-w-2xl mx-auto bg-white rounded-2xl border border-green-50 overflow-hidden">
    <table class="w-full text-sm">
      <thead><tr class="bg-paw-50 text-paw-600 text-xs"><th class="py-2.5 px-4 text-left">時段</th><th class="py-2.5 px-4">週一至週五</th><th class="py-2.5 px-4">週六</th><th class="py-2.5 px-4">週日</th></tr></thead>
      <tbody class="text-center text-gray-600">
        <tr class="border-t border-gray-50"><td class="py-2.5 px-4 text-left text-gray-400 text-xs">上午</td><td class="py-2.5">09:00 - 12:00</td><td class="py-2.5">09:00 - 12:00</td><td class="py-2.5 text-gray-300">休診</td></tr>
        <tr class="border-t border-gray-50"><td class="py-2.5 px-4 text-left text-gray-400 text-xs">下午</td><td class="py-2.5">14:00 - 17:00</td><td class="py-2.5">14:00 - 17:00</td><td class="py-2.5 text-gray-300">休診</td></tr>
        <tr class="border-t border-gray-50"><td class="py-2.5 px-4 text-left text-gray-400 text-xs">夜診</td><td class="py-2.5">18:00 - 21:00</td><td class="py-2.5 text-gray-300">休診</td><td class="py-2.5 text-gray-300">休診</td></tr>
      </tbody>
    </table>
  </div>
  <p class="text-center text-xs text-red-400 mt-3 font-medium">🚨 急診 24 小時服務，請撥打 (02) 2888-5678</p>
</section>

<section class="bg-gradient-to-r from-paw-500 to-emerald-500 py-10 text-center text-white">
  <h2 class="text-2xl font-extrabold mb-2">預約看診</h2>
  <p class="text-white/80 text-sm mb-6">線上預約，減少等待時間</p>
  <button class="bg-white text-paw-600 px-10 py-3 rounded-full font-bold hover:bg-gray-50 transition">立即預約 →</button>
</section>

<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
    <div class="flex items-center gap-2"><span>🐾</span><span class="text-white font-extrabold">PawCare</span></div>
    <div class="text-xs">© 2026 毛孩醫院 · 台北市中山區南京東路三段 88 號</div>
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
