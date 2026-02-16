INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '14abaa24-c33a-424c-bd39-03b1bfb66df1',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>養生堂 HerbClinic</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        herb: { 50:'#f0fdf4', 100:'#dcfce7', 200:'#bbf7d0', 300:'#86efac', 400:'#4ade80', 500:'#22c55e', 600:'#16a34a', 700:'#15803d', 800:'#166534' },
        gold: { 300:'#fcd34d', 400:'#fbbf24', 500:'#f59e0b' }
      }
    }
  }
}
</script>
<style>
body { font-family: 'Noto Sans TC', sans-serif; background: #fafdf7; }
.serif { font-family: 'Noto Serif TC', serif; }
.service-card { transition: all 0.3s; cursor: pointer; }
.service-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(22,163,74,0.1); }
.doctor-card { transition: all 0.3s; }
.doctor-card:hover { transform: scale(1.02); }
.reveal { opacity: 0; transform: translateY(20px); transition: all 0.6s; }
.reveal.visible { opacity: 1; transform: translateY(0); }
</style>
</head>
<body>

<!-- Nav -->
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-green-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-2">
      <span class="text-2xl">🌿</span>
      <span class="serif text-xl font-bold text-herb-800">養生堂</span>
    </div>
    <div class="flex items-center gap-6 text-sm text-gray-600">
      <a href="#services" class="hover:text-herb-600 transition cursor-pointer">診療項目</a>
      <a href="#doctors" class="hover:text-herb-600 transition cursor-pointer">醫師團隊</a>
      <a href="#knowledge" class="hover:text-herb-600 transition cursor-pointer">養生知識</a>
      <button class="bg-herb-600 hover:bg-herb-700 text-white px-5 py-2 rounded-full text-sm font-medium transition" onclick="document.getElementById('bookModal').classList.remove('hidden')">線上預約</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="py-20 bg-gradient-to-br from-green-50 via-emerald-50 to-amber-50 relative overflow-hidden">
  <div class="absolute right-0 top-0 w-96 h-96 bg-herb-200/30 rounded-full blur-[100px]"></div>
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-14 relative">
    <div class="flex-1">
      <div class="inline-flex items-center gap-2 bg-herb-100 text-herb-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
        <span>🏥</span> 傳承三代 · 40 年經驗
      </div>
      <h1 class="serif text-4xl font-bold text-gray-800 leading-snug mb-4">順應自然<br>調理身心平衡</h1>
      <p class="text-gray-500 leading-relaxed mb-8 max-w-md">結合傳統中醫智慧與現代醫學檢測，提供個人化的調理方案，讓您找回身體的自癒力。</p>
      <div class="flex gap-3">
        <button class="bg-herb-600 hover:bg-herb-700 text-white px-7 py-3 rounded-full text-sm font-medium transition" onclick="document.getElementById('bookModal').classList.remove('hidden')">預約掛號</button>
        <button class="border border-herb-600 text-herb-600 hover:bg-herb-600 hover:text-white px-7 py-3 rounded-full text-sm font-medium transition">了解更多</button>
      </div>
    </div>
    <div class="w-80 h-80 rounded-3xl bg-gradient-to-br from-herb-300 to-emerald-400 flex items-center justify-center shadow-xl shadow-herb-200/50 relative">
      <span class="text-8xl">🧑‍⚕️</span>
      <div class="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3">
        <div class="text-xs text-gray-400">患者好評</div>
        <div class="flex items-center gap-1 text-gold-500 text-sm">★★★★★</div>
        <div class="text-xs text-gray-500 mt-0.5">4.9 / 2,380 則</div>
      </div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="max-w-6xl mx-auto px-6 py-16">
  <div class="text-center mb-10">
    <h2 class="serif text-2xl font-bold text-gray-800 mb-2">診療項目</h2>
    <p class="text-sm text-gray-400">全方位中醫調理，從根本改善體質</p>
  </div>
  <div class="grid grid-cols-4 gap-5">
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center">
      <div class="w-14 h-14 rounded-2xl bg-herb-50 flex items-center justify-center mx-auto mb-3 text-2xl">🌡️</div>
      <h3 class="font-bold text-gray-800 mb-1">內科調理</h3>
      <p class="text-xs text-gray-400">感冒、腸胃、過敏<br>慢性病體質調整</p>
    </div>
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center">
      <div class="w-14 h-14 rounded-2xl bg-herb-50 flex items-center justify-center mx-auto mb-3 text-2xl">📍</div>
      <h3 class="font-bold text-gray-800 mb-1">針灸治療</h3>
      <p class="text-xs text-gray-400">經絡疏通、疼痛緩解<br>運動傷害恢復</p>
    </div>
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center">
      <div class="w-14 h-14 rounded-2xl bg-herb-50 flex items-center justify-center mx-auto mb-3 text-2xl">💆</div>
      <h3 class="font-bold text-gray-800 mb-1">推拿整復</h3>
      <p class="text-xs text-gray-400">筋骨調整、肩頸痠痛<br>脊椎側彎矯正</p>
    </div>
    <div class="service-card bg-white rounded-2xl p-6 border border-green-50 text-center">
      <div class="w-14 h-14 rounded-2xl bg-herb-50 flex items-center justify-center mx-auto mb-3 text-2xl">🌸</div>
      <h3 class="font-bold text-gray-800 mb-1">婦科調理</h3>
      <p class="text-xs text-gray-400">月經調理、備孕助孕<br>更年期保健</p>
    </div>
  </div>
</section>

<!-- Doctors -->
<section id="doctors" class="bg-white border-y border-green-50 py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-10">
      <h2 class="serif text-2xl font-bold text-gray-800 mb-2">醫師團隊</h2>
      <p class="text-sm text-gray-400">經驗豐富的中醫師，用心守護您的健康</p>
    </div>
    <div class="grid grid-cols-3 gap-6">
      <div class="doctor-card bg-gradient-to-b from-herb-50 to-white rounded-2xl p-6 text-center border border-green-50 cursor-pointer">
        <div class="w-20 h-20 rounded-full bg-herb-200 flex items-center justify-center mx-auto mb-3 text-3xl">👨‍⚕️</div>
        <h3 class="font-bold text-gray-800">林正道 醫師</h3>
        <div class="text-xs text-herb-600 font-medium mt-1">院長 · 內科專家</div>
        <p class="text-xs text-gray-400 mt-2">中國醫藥大學中醫學系<br>40 年臨床經驗</p>
        <div class="flex items-center justify-center gap-1 mt-3 text-gold-500 text-xs">★★★★★ <span class="text-gray-400 ml-1">4.9</span></div>
      </div>
      <div class="doctor-card bg-gradient-to-b from-herb-50 to-white rounded-2xl p-6 text-center border border-green-50 cursor-pointer">
        <div class="w-20 h-20 rounded-full bg-herb-200 flex items-center justify-center mx-auto mb-3 text-3xl">👩‍⚕️</div>
        <h3 class="font-bold text-gray-800">陳雅芳 醫師</h3>
        <div class="text-xs text-herb-600 font-medium mt-1">副院長 · 婦科專家</div>
        <p class="text-xs text-gray-400 mt-2">長庚大學中醫學系<br>15 年臨床經驗</p>
        <div class="flex items-center justify-center gap-1 mt-3 text-gold-500 text-xs">★★★★★ <span class="text-gray-400 ml-1">4.8</span></div>
      </div>
      <div class="doctor-card bg-gradient-to-b from-herb-50 to-white rounded-2xl p-6 text-center border border-green-50 cursor-pointer">
        <div class="w-20 h-20 rounded-full bg-herb-200 flex items-center justify-center mx-auto mb-3 text-3xl">👨‍⚕️</div>
        <h3 class="font-bold text-gray-800">張明翰 醫師</h3>
        <div class="text-xs text-herb-600 font-medium mt-1">主治醫師 · 針灸專家</div>
        <p class="text-xs text-gray-400 mt-2">台北醫學大學中醫學系<br>10 年臨床經驗</p>
        <div class="flex items-center justify-center gap-1 mt-3 text-gold-500 text-xs">★★★★★ <span class="text-gray-400 ml-1">4.9</span></div>
      </div>
    </div>
  </div>
</section>

<!-- Knowledge -->
<section id="knowledge" class="max-w-6xl mx-auto px-6 py-16">
  <h2 class="serif text-2xl font-bold text-gray-800 mb-6">🍵 養生知識</h2>
  <div class="grid grid-cols-3 gap-5">
    <div class="bg-white rounded-xl p-5 border border-green-50 hover:shadow-md transition cursor-pointer">
      <span class="text-xs bg-herb-100 text-herb-700 px-2 py-0.5 rounded-full font-medium">體質</span>
      <h3 class="font-bold text-gray-800 mt-2 mb-1">你是哪種體質？中醫九大體質自我檢測</h3>
      <p class="text-xs text-gray-400 line-clamp-2">了解自己的體質類型，才能選擇最適合的食補方式...</p>
      <div class="text-xs text-gray-400 mt-3">2 天前 · 3 分鐘閱讀</div>
    </div>
    <div class="bg-white rounded-xl p-5 border border-green-50 hover:shadow-md transition cursor-pointer">
      <span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">食療</span>
      <h3 class="font-bold text-gray-800 mt-2 mb-1">冬天手腳冰冷？五道暖身養生湯方</h3>
      <p class="text-xs text-gray-400 line-clamp-2">從黃耆枸杞到當歸生薑，教你在家就能煮的暖身湯...</p>
      <div class="text-xs text-gray-400 mt-3">5 天前 · 4 分鐘閱讀</div>
    </div>
    <div class="bg-white rounded-xl p-5 border border-green-50 hover:shadow-md transition cursor-pointer">
      <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">穴道</span>
      <h3 class="font-bold text-gray-800 mt-2 mb-1">辦公室必學！5 個緩解肩頸痠痛的穴道按摩</h3>
      <p class="text-xs text-gray-400 line-clamp-2">風池穴、肩井穴、合谷穴...每天按壓 5 分鐘有效舒緩...</p>
      <div class="text-xs text-gray-400 mt-3">1 週前 · 2 分鐘閱讀</div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="bg-herb-700 py-12 text-white text-center">
  <div class="max-w-3xl mx-auto px-6">
    <h2 class="serif text-2xl font-bold mb-2">開始您的健康之旅</h2>
    <p class="text-white/70 text-sm mb-6">首次就診免掛號費，讓我們為您量身打造調理方案</p>
    <button class="bg-white text-herb-700 px-8 py-3 rounded-full font-bold text-sm hover:bg-herb-50 transition" onclick="document.getElementById('bookModal').classList.remove('hidden')">立即預約 →</button>
  </div>
</section>

<!-- Booking Modal -->
<div id="bookModal" class="hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="bg-white rounded-2xl w-full max-w-md p-6 mx-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="serif text-lg font-bold text-gray-800">線上預約掛號</h3>
      <button onclick="document.getElementById('bookModal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">&times;</button>
    </div>
    <div class="space-y-3">
      <div>
        <label class="text-xs font-medium text-gray-500 mb-1 block">看診醫師</label>
        <select class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-herb-300">
          <option>林正道 醫師（內科）</option><option>陳雅芳 醫師（婦科）</option><option>張明翰 醫師（針灸）</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs font-medium text-gray-500 mb-1 block">預約日期</label><input type="date" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-herb-300"></div>
        <div><label class="text-xs font-medium text-gray-500 mb-1 block">時段</label><select class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-herb-300"><option>上午 09:00-12:00</option><option>下午 14:00-17:00</option><option>晚間 18:00-21:00</option></select></div>
      </div>
      <div><label class="text-xs font-medium text-gray-500 mb-1 block">姓名</label><input type="text" placeholder="請輸入姓名" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-herb-300"></div>
      <div><label class="text-xs font-medium text-gray-500 mb-1 block">電話</label><input type="tel" placeholder="0912-345-678" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-herb-300"></div>
      <div><label class="text-xs font-medium text-gray-500 mb-1 block">症狀描述</label><textarea rows="2" placeholder="請簡述您的不適症狀..." class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-herb-300 resize-none"></textarea></div>
    </div>
    <button class="mt-4 w-full bg-herb-600 hover:bg-herb-700 text-white py-2.5 rounded-lg text-sm font-bold transition">確認預約</button>
  </div>
</div>

<!-- Footer -->
<footer class="bg-gray-900 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
    <div class="flex items-center gap-2"><span>🌿</span><span class="serif text-white font-bold">養生堂</span></div>
    <div class="text-xs">© 2026 養生堂 HerbClinic · 台北市大安區仁愛路四段 123 號</div>
  </div>
</footer>

<script>
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
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
