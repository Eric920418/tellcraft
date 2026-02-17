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
tailwind.config = { theme: { extend: { colors: { paw: { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857' }, warm: { 50:'#fffbeb',100:'#fef3c7' } } } } } }
</script>
<style>
* { font-family: 'Nunito', sans-serif; }
body { background: #f8fdf9; }
.service-card { transition: all 0.3s; cursor: pointer; }
.service-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(16,185,129,0.12); }
.faq-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.faq-content.open { max-height: 200px; }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-green-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><span class="text-xl">🐾</span><span class="text-lg font-extrabold text-emerald-700">PawCare</span><span class="text-[10px] text-paw-500 font-bold">毛孩醫院</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-500 font-semibold">
      <a onclick="document.getElementById('services').scrollIntoView({behavior:'smooth'})" class="hover:text-paw-500 transition cursor-pointer">服務項目</a>
      <a onclick="document.getElementById('team').scrollIntoView({behavior:'smooth'})" class="hover:text-paw-500 transition cursor-pointer">醫療團隊</a>
      <a onclick="document.getElementById('hours').scrollIntoView({behavior:'smooth'})" class="hover:text-paw-500 transition cursor-pointer">就診須知</a>
      <a onclick="document.getElementById('knowledge').scrollIntoView({behavior:'smooth'})" class="hover:text-paw-500 transition cursor-pointer">寵物知識</a>
      <button onclick="document.getElementById('bookingModal').classList.remove('hidden')" class="bg-paw-500 hover:bg-paw-600 text-white px-5 py-1.5 rounded-full text-sm font-bold transition cursor-pointer">線上預約</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="py-20 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
  <div class="absolute right-10 bottom-10 w-72 h-72 bg-paw-200/30 rounded-full blur-[80px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-14">
    <div class="flex-1">
      <span class="inline-block text-xs bg-paw-100 text-paw-600 px-3 py-1 rounded-full font-bold mb-4">🏥 專業寵物醫療 · 15 年經驗</span>
      <h1 class="text-4xl font-extrabold text-gray-800 leading-tight mb-4">給毛孩最溫柔的<br>醫療照護</h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-md">擁有 15 年經驗的獸醫團隊，提供內外科、牙科、中醫、影像診斷等全方位服務。因為愛，所以我們用心守護每一個生命。</p>
      <div class="flex gap-3">
        <button onclick="document.getElementById('bookingModal').classList.remove('hidden')" class="bg-paw-500 hover:bg-paw-600 text-white px-8 py-3 rounded-full font-bold transition shadow-lg shadow-paw-200 cursor-pointer">立即預約</button>
        <a href="tel:0228885678" class="border border-paw-400 text-paw-600 hover:bg-paw-50 px-8 py-3 rounded-full font-bold transition cursor-pointer">急診專線 ☎</a>
      </div>
      <div class="flex gap-8 mt-8">
        <div><div class="text-2xl font-extrabold text-paw-600">15+</div><div class="text-xs text-gray-400">年經驗</div></div>
        <div><div class="text-2xl font-extrabold text-paw-600">30K+</div><div class="text-xs text-gray-400">診療案例</div></div>
        <div><div class="text-2xl font-extrabold text-paw-600">4.9</div><div class="text-xs text-gray-400">Google 評分</div></div>
      </div>
    </div>
    <div class="relative">
      <div class="w-72 h-72 rounded-3xl bg-gradient-to-br from-paw-200 to-emerald-200 flex items-center justify-center text-8xl shadow-xl shadow-paw-100">🐕</div>
      <div class="absolute -bottom-3 -left-4 w-16 h-16 rounded-full bg-warm-100 flex items-center justify-center text-2xl shadow-md">🐱</div>
      <div class="absolute -top-2 -right-3 w-14 h-14 rounded-full bg-paw-100 flex items-center justify-center text-xl shadow-md">🩺</div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="max-w-6xl mx-auto px-6 py-14">
  <div class="text-center mb-10"><h2 class="text-2xl font-extrabold text-gray-800 mb-2">服務項目</h2><p class="text-sm text-gray-400">完善的醫療服務，守護毛孩健康</p></div>
  <div class="grid grid-cols-4 gap-5">
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center"><div class="text-3xl mb-3">💉</div><h3 class="font-bold text-gray-800">預防醫學</h3><p class="text-xs text-gray-400 mt-1">疫苗接種 · 健康檢查 · 驅蟲</p><div class="text-xs text-paw-500 mt-3 font-medium">基礎守護</div></div>
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center"><div class="text-3xl mb-3">🔬</div><h3 class="font-bold text-gray-800">內科診療</h3><p class="text-xs text-gray-400 mt-1">血液檢查 · 超音波 · X 光</p><div class="text-xs text-paw-500 mt-3 font-medium">精密檢查</div></div>
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center"><div class="text-3xl mb-3">🏥</div><h3 class="font-bold text-gray-800">外科手術</h3><p class="text-xs text-gray-400 mt-1">結紮 · 腫瘤切除 · 骨科</p><div class="text-xs text-paw-500 mt-3 font-medium">專業團隊</div></div>
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center"><div class="text-3xl mb-3">🦷</div><h3 class="font-bold text-gray-800">牙科護理</h3><p class="text-xs text-gray-400 mt-1">洗牙 · 拔牙 · 口腔檢查</p><div class="text-xs text-paw-500 mt-3 font-medium">專科設備</div></div>
  </div>
  <div class="grid grid-cols-4 gap-5 mt-5">
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center"><div class="text-3xl mb-3">🧬</div><h3 class="font-bold text-gray-800">皮膚科</h3><p class="text-xs text-gray-400 mt-1">過敏檢測 · 黴菌 · 寄生蟲</p></div>
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center"><div class="text-3xl mb-3">🌿</div><h3 class="font-bold text-gray-800">中獸醫</h3><p class="text-xs text-gray-400 mt-1">針灸 · 中藥調理 · 推拿</p></div>
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center"><div class="text-3xl mb-3">✂️</div><h3 class="font-bold text-gray-800">美容寄宿</h3><p class="text-xs text-gray-400 mt-1">洗澡美容 · 安親住宿</p></div>
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center"><div class="text-3xl mb-3">🚑</div><h3 class="font-bold text-gray-800">24H 急診</h3><p class="text-xs text-gray-400 mt-1">全天候急診 · 重症加護</p></div>
  </div>
</section>

<!-- Team -->
<section id="team" class="bg-paw-600 text-white py-14">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-2xl font-extrabold mb-8 text-center">醫療團隊</h2>
    <div class="grid grid-cols-4 gap-6">
      <div class="text-center"><div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 text-3xl">👨‍⚕️</div><h3 class="font-bold">王建明 院長</h3><div class="text-xs text-paw-200 mt-0.5">台大獸醫碩士 · 15 年</div><p class="text-xs text-white/60 mt-1">內科 · 腫瘤科</p></div>
      <div class="text-center"><div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 text-3xl">👩‍⚕️</div><h3 class="font-bold">陳怡君 醫師</h3><div class="text-xs text-paw-200 mt-0.5">中興獸醫學士 · 10 年</div><p class="text-xs text-white/60 mt-1">外科 · 骨科</p></div>
      <div class="text-center"><div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 text-3xl">👨‍⚕️</div><h3 class="font-bold">林志偉 醫師</h3><div class="text-xs text-paw-200 mt-0.5">屏科大碩士 · 8 年</div><p class="text-xs text-white/60 mt-1">牙科 · 中獸醫</p></div>
      <div class="text-center"><div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 text-3xl">👩‍⚕️</div><h3 class="font-bold">張雅琳 醫師</h3><div class="text-xs text-paw-200 mt-0.5">嘉義大學 · 6 年</div><p class="text-xs text-white/60 mt-1">皮膚科 · 預防醫學</p></div>
    </div>
  </div>
</section>

<!-- Schedule -->
<section id="hours" class="max-w-6xl mx-auto px-6 py-12">
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

<!-- Knowledge -->
<section id="knowledge" class="bg-white border-y border-green-50 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-xl font-extrabold text-gray-800 mb-6 text-center">📚 寵物知識</h2>
    <div class="grid grid-cols-3 gap-5">
      <div class="bg-paw-50 rounded-xl p-5 hover:bg-paw-100 transition cursor-pointer"><span class="text-xs bg-paw-200 text-paw-700 px-2 py-0.5 rounded-full font-bold">狗狗</span><h3 class="font-bold text-gray-800 mt-2 text-sm">幼犬疫苗接種時間表完整指南</h3><p class="text-xs text-gray-400 mt-1">從 6 週齡到 1 歲，每個階段該打什麼疫苗？</p><div class="text-xs text-paw-500 mt-2 font-medium">閱讀更多 →</div></div>
      <div class="bg-paw-50 rounded-xl p-5 hover:bg-paw-100 transition cursor-pointer"><span class="text-xs bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-bold">貓咪</span><h3 class="font-bold text-gray-800 mt-2 text-sm">貓咪嘔吐的 7 個常見原因</h3><p class="text-xs text-gray-400 mt-1">哪些是正常的？什麼情況需要就醫？</p><div class="text-xs text-paw-500 mt-2 font-medium">閱讀更多 →</div></div>
      <div class="bg-paw-50 rounded-xl p-5 hover:bg-paw-100 transition cursor-pointer"><span class="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-bold">照護</span><h3 class="font-bold text-gray-800 mt-2 text-sm">老年犬的日常照護 5 大重點</h3><p class="text-xs text-gray-400 mt-1">飲食、運動、關節保養、定期檢查...</p><div class="text-xs text-paw-500 mt-2 font-medium">閱讀更多 →</div></div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="max-w-6xl mx-auto px-6 py-12">
  <h2 class="text-xl font-extrabold text-gray-800 mb-6 text-center">💬 飼主好評</h2>
  <div class="grid grid-cols-3 gap-5">
    <div class="bg-white rounded-xl p-5 border border-green-50"><div class="flex text-amber-400 text-xs mb-2">⭐⭐⭐⭐⭐</div><p class="text-sm text-gray-600 italic">「王院長對我家柴犬非常有耐心，檢查很仔細。環境乾淨，護士也很親切。」</p><div class="flex items-center gap-2 mt-3"><div class="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-xs">🐕</div><div class="text-xs text-gray-400">小柴媽咪 · Google 評論</div></div></div>
    <div class="bg-white rounded-xl p-5 border border-green-50"><div class="flex text-amber-400 text-xs mb-2">⭐⭐⭐⭐⭐</div><p class="text-sm text-gray-600 italic">「帶貓來洗牙，陳醫師術前說明很詳細，術後也有追蹤。真的很放心。」</p><div class="flex items-center gap-2 mt-3"><div class="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs">🐱</div><div class="text-xs text-gray-400">橘貓爸爸 · Google 評論</div></div></div>
    <div class="bg-white rounded-xl p-5 border border-green-50"><div class="flex text-amber-400 text-xs mb-2">⭐⭐⭐⭐⭐</div><p class="text-sm text-gray-600 italic">「半夜狗狗突然不舒服，急診很快就接診了。感謝 PawCare 救了我家毛寶貝！」</p><div class="flex items-center gap-2 mt-3"><div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">🐕</div><div class="text-xs text-gray-400">Lucky 的主人 · Google 評論</div></div></div>
  </div>
</section>

<!-- FAQ -->
<section class="bg-gray-50 border-t border-gray-100 py-12">
  <div class="max-w-3xl mx-auto px-6">
    <h2 class="text-xl font-extrabold text-gray-800 mb-6 text-center">❓ 常見問題</h2>
    <div class="space-y-3">
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="w-full flex items-center justify-between p-4 text-left cursor-pointer"><span class="font-medium text-gray-800 text-sm">第一次看診需要帶什麼？</span><span class="text-gray-400 text-sm">+</span></button>
        <div class="hidden px-4 pb-4 text-sm text-gray-500">請攜帶寵物的疫苗手冊（如有）、之前的病歷資料，以及穩固的外出籠或牽繩。初次看診我們會進行基礎健康評估。</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="w-full flex items-center justify-between p-4 text-left cursor-pointer"><span class="font-medium text-gray-800 text-sm">結紮手術需要多少費用？</span><span class="text-gray-400 text-sm">+</span></button>
        <div class="hidden px-4 pb-4 text-sm text-gray-500">公犬約 $3,000-5,000，母犬約 $5,000-8,000，貓咪約 $2,000-4,000。實際費用依體重和健康狀況而定，術前檢查另計。</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="w-full flex items-center justify-between p-4 text-left cursor-pointer"><span class="font-medium text-gray-800 text-sm">急診要怎麼掛號？</span><span class="text-gray-400 text-sm">+</span></button>
        <div class="hidden px-4 pb-4 text-sm text-gray-500">急診不需預約，直接撥打急診專線 (02) 2888-5678 或直接帶毛孩到院。我們 24 小時都有值班獸醫。</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="w-full flex items-center justify-between p-4 text-left cursor-pointer"><span class="font-medium text-gray-800 text-sm">可以刷卡嗎？有寵物保險嗎？</span><span class="text-gray-400 text-sm">+</span></button>
        <div class="hidden px-4 pb-4 text-sm text-gray-500">我們接受現金、信用卡和行動支付。也配合多家寵物保險公司（富邦、國泰、明台等），可直接理賠。</div>
      </div>
    </div>
  </div>
</section>

<!-- Location -->
<section class="max-w-6xl mx-auto px-6 py-12">
  <div class="bg-white rounded-2xl p-8 border border-green-50 flex items-center gap-8">
    <div class="flex-1">
      <h2 class="text-xl font-extrabold text-gray-800 mb-3">交通資訊</h2>
      <div class="space-y-2 text-sm text-gray-500">
        <p>📍 台北市中山區南京東路三段 88 號 1F</p>
        <p>🚇 捷運南京復興站 3 號出口，步行 5 分鐘</p>
        <p>🅿️ 附近有嘟嘟房停車場（步行 2 分鐘）</p>
        <p>📞 一般門診：(02) 2888-5678</p>
        <p>🚨 急診專線：(02) 2888-9999</p>
      </div>
    </div>
    <div class="w-56 h-40 rounded-xl bg-paw-100 flex items-center justify-center text-5xl shrink-0">🗺️</div>
  </div>
</section>

<!-- CTA -->
<section class="bg-gradient-to-r from-paw-500 to-emerald-500 py-10 text-center text-white">
  <h2 class="text-2xl font-extrabold mb-2">預約看診</h2>
  <p class="text-white/80 text-sm mb-6">線上預約，減少等待時間</p>
  <button onclick="document.getElementById('bookingModal').classList.remove('hidden')" class="bg-white text-paw-600 px-10 py-3 rounded-full font-bold hover:bg-gray-50 transition cursor-pointer">立即預約 →</button>
</section>

<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
    <div class="flex items-center gap-2"><span>🐾</span><span class="text-white font-extrabold">PawCare</span></div>
    <div class="flex gap-4 text-xs"><a class="hover:text-white cursor-pointer">Facebook</a><a class="hover:text-white cursor-pointer">Instagram</a><a class="hover:text-white cursor-pointer">LINE</a></div>
    <div class="text-xs">© 2026 毛孩醫院</div>
  </div>
</footer>

<!-- Booking Modal -->
<div id="bookingModal" class="hidden fixed inset-0 z-50 flex items-center justify-center">
  <div class="absolute inset-0 bg-black/50" onclick="document.getElementById('bookingModal').classList.add('hidden')"></div>
  <div class="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
    <button onclick="document.getElementById('bookingModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer text-lg">✕</button>
    <div class="text-center mb-6"><div class="text-3xl mb-2">📋</div><h3 class="text-xl font-extrabold text-gray-800">線上預約</h3><p class="text-xs text-gray-400 mt-1">填寫以下資訊，我們會盡快確認</p></div>
    <div class="space-y-3">
      <input type="text" placeholder="飼主姓名" class="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-paw-200">
      <input type="tel" placeholder="聯絡電話" class="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-paw-200">
      <input type="text" placeholder="寵物名字 & 品種" class="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-paw-200">
      <select class="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 outline-none focus:ring-2 focus:ring-paw-200">
        <option>選擇看診項目</option>
        <option>一般門診</option>
        <option>疫苗接種</option>
        <option>健康檢查</option>
        <option>牙科護理</option>
        <option>結紮手術諮詢</option>
        <option>皮膚問題</option>
        <option>其他</option>
      </select>
      <select class="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 outline-none focus:ring-2 focus:ring-paw-200">
        <option>選擇時段</option>
        <option>週一至週五 上午 09:00-12:00</option>
        <option>週一至週五 下午 14:00-17:00</option>
        <option>週一至週五 夜診 18:00-21:00</option>
        <option>週六 上午 09:00-12:00</option>
        <option>週六 下午 14:00-17:00</option>
      </select>
      <textarea placeholder="症狀描述（選填）" rows="2" class="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-paw-200 resize-none"></textarea>
      <button onclick="this.textContent='✓ 預約成功！我們會電話確認';this.classList.replace('bg-paw-500','bg-green-500');setTimeout(()=>{document.getElementById('bookingModal').classList.add('hidden');this.textContent='送出預約';this.classList.replace('bg-green-500','bg-paw-500')},2000)" class="w-full bg-paw-500 hover:bg-paw-600 text-white py-3 rounded-lg font-bold transition cursor-pointer">送出預約</button>
    </div>
  </div>
</div>
</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
