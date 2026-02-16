INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '9baf3f43-34e1-4a0f-b4bd-da302ddaaa67',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>悅光牙醫 BrightSmile Dental</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        dental: { 50:'#eff6ff', 100:'#dbeafe', 200:'#bfdbfe', 300:'#93c5fd', 400:'#60a5fa', 500:'#3b82f6', 600:'#2563eb', 700:'#1d4ed8', 800:'#1e40af', 900:'#1e3a8a' },
        clean: { 50:'#f0fdfa', 100:'#ccfbf1', 200:'#99f6e4', 300:'#5eead4', 400:'#2dd4bf', 500:'#14b8a6', 600:'#0d9488' },
        soft: { 50:'#fafbff', 100:'#f5f7ff', 200:'#eef1f8', 300:'#e2e6f0', 400:'#9ca3af', 500:'#6b7280', 600:'#4b5563', 700:'#374151', 800:'#1f2937', 900:'#111827' }
      },
      fontFamily: { jakarta:['Plus Jakarta Sans','Noto Sans TC','sans-serif'] }
    }
  }
}
</script>
<style>
  * { font-family: 'Plus Jakarta Sans', 'Noto Sans TC', sans-serif; }
  html { scroll-behavior: smooth; }
  .reveal { opacity:0; transform:translateY(24px); transition:all 0.6s cubic-bezier(0.16,1,0.3,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }
  .tooth-bg { background: radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.04) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(20,184,166,0.04) 0%, transparent 50%); }
</style>
</head>
<body class="bg-soft-50 text-soft-800">

<!-- Navbar -->
<nav class="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-soft-200">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2.5">
      <div class="w-9 h-9 bg-dental-500 rounded-xl flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8 2 5 5.5 5 9c0 2 .8 3.5 2 5l3 7c.3.6 1 1 1.7 1h.6c.7 0 1.4-.4 1.7-1l3-7c1.2-1.5 2-3 2-5 0-3.5-3-7-7-7z"/></svg>
      </div>
      <div>
        <span class="text-lg font-bold text-soft-900 block leading-tight">悅光牙醫</span>
        <span class="text-[10px] text-soft-400 font-medium tracking-wider">BRIGHTSMILE DENTAL</span>
      </div>
    </a>
    <div class="hidden md:flex items-center gap-8 text-sm font-medium text-soft-500">
      <a href="#services" class="hover:text-dental-600 transition-colors">診療項目</a>
      <a href="#team" class="hover:text-dental-600 transition-colors">醫師團隊</a>
      <a href="#environment" class="hover:text-dental-600 transition-colors">診所環境</a>
      <a href="#faq" class="hover:text-dental-600 transition-colors">常見問題</a>
    </div>
    <div class="flex items-center gap-3">
      <a href="tel:0227081234" class="hidden sm:flex items-center gap-1.5 text-dental-600 text-sm font-semibold">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
        (02) 2708-1234
      </a>
      <button onclick="document.getElementById('booking-modal').classList.remove('hidden')" class="bg-dental-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-dental-600 transition-colors shadow-md shadow-dental-500/20">
        線上預約
      </button>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-soft-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-white border-t px-6 py-4 space-y-3">
    <a href="#services" class="block text-sm font-medium text-soft-600">診療項目</a>
    <a href="#team" class="block text-sm font-medium text-soft-600">醫師團隊</a>
    <a href="#environment" class="block text-sm font-medium text-soft-600">診所環境</a>
    <a href="#faq" class="block text-sm font-medium text-soft-600">常見問題</a>
  </div>
</nav>

<!-- Hero -->
<section class="pt-24 pb-16 tooth-bg">
  <div class="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
    <div>
      <div class="inline-flex items-center gap-2 bg-clean-50 text-clean-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-clean-200">
        <span class="w-2 h-2 bg-clean-500 rounded-full"></span>
        健保特約 · 夜間門診
      </div>
      <h1 class="text-4xl md:text-5xl font-bold leading-tight mb-6 text-soft-900">
        專業溫柔<br>
        讓每次看牙<br>
        都是<span class="text-dental-500">安心體驗</span>
      </h1>
      <p class="text-soft-400 text-lg mb-8 leading-relaxed">
        悅光牙醫結合先進設備與溫暖照護，從一般洗牙到隱形矯正，為您打造最舒適的看診體驗。
      </p>
      <div class="flex flex-wrap gap-4">
        <button onclick="document.getElementById('booking-modal').classList.remove('hidden')" class="bg-dental-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-dental-600 transition-colors shadow-lg shadow-dental-500/25">
          立即預約 →
        </button>
        <a href="#services" class="border-2 border-soft-200 text-soft-600 px-8 py-3.5 rounded-xl font-semibold hover:border-dental-200 hover:text-dental-600 transition-colors">
          瀏覽項目
        </a>
      </div>
      <!-- Trust badges -->
      <div class="flex flex-wrap gap-3 mt-10">
        <span class="bg-white border border-soft-200 rounded-lg px-3 py-1.5 text-xs font-medium text-soft-500">🏥 衛福部認證</span>
        <span class="bg-white border border-soft-200 rounded-lg px-3 py-1.5 text-xs font-medium text-soft-500">🦷 隱適美認證醫師</span>
        <span class="bg-white border border-soft-200 rounded-lg px-3 py-1.5 text-xs font-medium text-soft-500">⭐ Google 4.9 評分</span>
        <span class="bg-white border border-soft-200 rounded-lg px-3 py-1.5 text-xs font-medium text-soft-500">📋 15,000+ 看診人次</span>
      </div>
    </div>
    <div class="flex justify-center">
      <div class="relative">
        <div class="w-72 h-72 md:w-80 md:h-80 rounded-3xl bg-gradient-to-br from-dental-100 to-clean-100 flex items-center justify-center shadow-xl">
          <span class="text-[120px]">😁</span>
        </div>
        <div class="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-lg border border-soft-100">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🦷</span>
            <div>
              <p class="text-xs text-soft-400">看診滿意度</p>
              <p class="text-lg font-bold text-dental-600">98.7%</p>
            </div>
          </div>
        </div>
        <div class="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-lg border border-soft-100">
          <div class="flex items-center gap-2">
            <span class="text-2xl">⏰</span>
            <div>
              <p class="text-xs text-soft-400">平均等候</p>
              <p class="text-lg font-bold text-clean-600">< 10 min</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-dental-500 font-semibold text-sm tracking-widest uppercase">Services</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 text-soft-900">診療項目</h2>
      <p class="text-soft-400 mt-3 max-w-lg mx-auto">從基礎保健到專科治療，全方位照顧您的口腔健康</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div class="reveal group border border-soft-200 rounded-2xl p-7 hover:shadow-lg hover:border-dental-200 transition-all cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-dental-50 flex items-center justify-center text-2xl mb-4 group-hover:bg-dental-100 transition-colors">🪥</div>
        <h3 class="font-bold text-lg mb-2">一般牙科</h3>
        <p class="text-soft-400 text-sm leading-relaxed">洗牙、補牙、根管治療、拔牙。健保給付，定期維護口腔健康。</p>
        <p class="text-dental-500 text-sm font-semibold mt-3">健保給付 →</p>
      </div>
      <div class="reveal group border border-soft-200 rounded-2xl p-7 hover:shadow-lg hover:border-dental-200 transition-all cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-clean-50 flex items-center justify-center text-2xl mb-4 group-hover:bg-clean-100 transition-colors">✨</div>
        <h3 class="font-bold text-lg mb-2">美白牙齒</h3>
        <p class="text-soft-400 text-sm leading-relaxed">冷光美白、居家美白套組，安全有效提升齒色 3-8 個色階。</p>
        <p class="text-dental-500 text-sm font-semibold mt-3">NT$ 8,000 起 →</p>
      </div>
      <div class="reveal group border border-soft-200 rounded-2xl p-7 hover:shadow-lg hover:border-dental-200 transition-all cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl mb-4 group-hover:bg-purple-100 transition-colors">😊</div>
        <h3 class="font-bold text-lg mb-2">隱形矯正</h3>
        <p class="text-soft-400 text-sm leading-relaxed">隱適美認證醫師，透明牙套不影響外觀，3D 數位模擬成果。</p>
        <p class="text-dental-500 text-sm font-semibold mt-3">NT$ 150,000 起 →</p>
      </div>
      <div class="reveal group border border-soft-200 rounded-2xl p-7 hover:shadow-lg hover:border-dental-200 transition-all cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl mb-4 group-hover:bg-amber-100 transition-colors">🔩</div>
        <h3 class="font-bold text-lg mb-2">人工植牙</h3>
        <p class="text-soft-400 text-sm leading-relaxed">瑞典 Nobel Biocare 植體，數位導航精準植入，5 年保固。</p>
        <p class="text-dental-500 text-sm font-semibold mt-3">NT$ 65,000 起 →</p>
      </div>
      <div class="reveal group border border-soft-200 rounded-2xl p-7 hover:shadow-lg hover:border-dental-200 transition-all cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-2xl mb-4 group-hover:bg-rose-100 transition-colors">👶</div>
        <h3 class="font-bold text-lg mb-2">兒童牙科</h3>
        <p class="text-soft-400 text-sm leading-relaxed">親子友善環境、塗氟防蛀、溝隙封填，讓孩子不再怕看牙。</p>
        <p class="text-dental-500 text-sm font-semibold mt-3">健保給付 →</p>
      </div>
      <div class="reveal group border border-soft-200 rounded-2xl p-7 hover:shadow-lg hover:border-dental-200 transition-all cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-4 group-hover:bg-blue-100 transition-colors">💎</div>
        <h3 class="font-bold text-lg mb-2">全瓷冠 / 貼片</h3>
        <p class="text-soft-400 text-sm leading-relaxed">德國 E.max 全瓷材料，自然擬真，同日完成數位製作。</p>
        <p class="text-dental-500 text-sm font-semibold mt-3">NT$ 18,000 起 →</p>
      </div>
    </div>
  </div>
</section>

<!-- Process -->
<section class="py-20 tooth-bg">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-dental-500 font-semibold text-sm tracking-widest uppercase">Process</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 text-soft-900">看診四步驟</h2>
      <p class="text-soft-400 mt-3">簡單流暢，輕鬆完成就醫</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="reveal text-center">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-dental-500 text-white flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-dental-500/25">1</div>
        <h4 class="font-bold mb-2">線上預約</h4>
        <p class="text-soft-400 text-sm">網站或 LINE 預約，選擇方便的時段</p>
      </div>
      <div class="reveal text-center">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-dental-400 text-white flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-dental-400/25">2</div>
        <h4 class="font-bold mb-2">到院報到</h4>
        <p class="text-soft-400 text-sm">提前 10 分鐘到院，填寫健康問卷</p>
      </div>
      <div class="reveal text-center">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-clean-500 text-white flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-clean-500/25">3</div>
        <h4 class="font-bold mb-2">詳細諮詢</h4>
        <p class="text-soft-400 text-sm">醫師親自說明、數位影像輔助溝通</p>
      </div>
      <div class="reveal text-center">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-clean-400 text-white flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-clean-400/25">4</div>
        <h4 class="font-bold mb-2">安心治療</h4>
        <p class="text-soft-400 text-sm">舒適環境、先進設備，全程無痛看診</p>
      </div>
    </div>
  </div>
</section>

<!-- Team -->
<section id="team" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-dental-500 font-semibold text-sm tracking-widest uppercase">Doctors</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 text-soft-900">醫師團隊</h2>
      <p class="text-soft-400 mt-3">專業認證、持續進修，您的口腔健康守護者</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="reveal border border-soft-200 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
        <div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-dental-100 to-dental-200 flex items-center justify-center text-5xl mb-4">👨‍⚕️</div>
        <h4 class="font-bold text-lg">陳柏安 院長</h4>
        <p class="text-dental-500 text-sm font-semibold mt-1">植牙 · 全口重建</p>
        <div class="flex flex-wrap justify-center gap-1.5 mt-3">
          <span class="bg-soft-100 text-soft-500 text-xs px-2 py-0.5 rounded-full">台大牙醫</span>
          <span class="bg-soft-100 text-soft-500 text-xs px-2 py-0.5 rounded-full">Nobel 認證</span>
          <span class="bg-soft-100 text-soft-500 text-xs px-2 py-0.5 rounded-full">20年經驗</span>
        </div>
      </div>
      <div class="reveal border border-soft-200 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
        <div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-clean-100 to-clean-200 flex items-center justify-center text-5xl mb-4">👩‍⚕️</div>
        <h4 class="font-bold text-lg">林佳蓉 醫師</h4>
        <p class="text-clean-600 text-sm font-semibold mt-1">隱形矯正 · 美學修復</p>
        <div class="flex flex-wrap justify-center gap-1.5 mt-3">
          <span class="bg-soft-100 text-soft-500 text-xs px-2 py-0.5 rounded-full">北醫牙醫</span>
          <span class="bg-soft-100 text-soft-500 text-xs px-2 py-0.5 rounded-full">隱適美白金</span>
          <span class="bg-soft-100 text-soft-500 text-xs px-2 py-0.5 rounded-full">12年經驗</span>
        </div>
      </div>
      <div class="reveal border border-soft-200 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
        <div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-5xl mb-4">👨‍⚕️</div>
        <h4 class="font-bold text-lg">張宏宇 醫師</h4>
        <p class="text-purple-600 text-sm font-semibold mt-1">兒童牙科 · 預防牙醫</p>
        <div class="flex flex-wrap justify-center gap-1.5 mt-3">
          <span class="bg-soft-100 text-soft-500 text-xs px-2 py-0.5 rounded-full">中山牙醫</span>
          <span class="bg-soft-100 text-soft-500 text-xs px-2 py-0.5 rounded-full">兒牙專科</span>
          <span class="bg-soft-100 text-soft-500 text-xs px-2 py-0.5 rounded-full">8年經驗</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Environment -->
<section id="environment" class="py-20 tooth-bg">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-dental-500 font-semibold text-sm tracking-widest uppercase">Environment</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 text-soft-900">診所環境</h2>
      <p class="text-soft-400 mt-3">溫馨明亮，讓您放鬆看診</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="reveal bg-white rounded-xl overflow-hidden shadow-sm border border-soft-100 hover:shadow-lg transition-shadow">
        <div class="h-40 bg-gradient-to-br from-dental-50 to-clean-50 flex items-center justify-center text-5xl">🏥</div>
        <div class="p-4"><p class="font-semibold text-sm">明亮候診區</p><p class="text-soft-400 text-xs mt-1">舒適沙發、免費 Wi-Fi、兒童遊戲區</p></div>
      </div>
      <div class="reveal bg-white rounded-xl overflow-hidden shadow-sm border border-soft-100 hover:shadow-lg transition-shadow">
        <div class="h-40 bg-gradient-to-br from-clean-50 to-dental-50 flex items-center justify-center text-5xl">🖥️</div>
        <div class="p-4"><p class="font-semibold text-sm">數位診療室</p><p class="text-soft-400 text-xs mt-1">口掃機、3D 斷層掃描、數位印模</p></div>
      </div>
      <div class="reveal bg-white rounded-xl overflow-hidden shadow-sm border border-soft-100 hover:shadow-lg transition-shadow">
        <div class="h-40 bg-gradient-to-br from-purple-50 to-dental-50 flex items-center justify-center text-5xl">🪥</div>
        <div class="p-4"><p class="font-semibold text-sm">獨立手術室</p><p class="text-soft-400 text-xs mt-1">HEPA 空氣淨化、正壓無塵環境</p></div>
      </div>
    </div>
  </div>
</section>

<!-- Reviews -->
<section class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-dental-500 font-semibold text-sm tracking-widest uppercase">Reviews</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 text-soft-900">患者好評</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="reveal bg-soft-50 rounded-2xl p-6 border border-soft-100">
        <div class="flex text-amber-400 mb-3">⭐⭐⭐⭐⭐</div>
        <p class="text-soft-600 text-sm leading-relaxed mb-4">「超怕看牙的我，第一次在看診時完全放鬆。陳院長技術超好，打針完全不痛！環境也很乾淨漂亮。」</p>
        <p class="font-semibold text-sm">— 小雯 / 洗牙 + 補牙</p>
      </div>
      <div class="reveal bg-soft-50 rounded-2xl p-6 border border-soft-100">
        <div class="flex text-amber-400 mb-3">⭐⭐⭐⭐⭐</div>
        <p class="text-soft-600 text-sm leading-relaxed mb-4">「林醫師幫我做的隱適美，效果超乎預期！每次回診都很仔細調整，過程中也不會不舒服。大推！」</p>
        <p class="font-semibold text-sm">— Jason / 隱形矯正</p>
      </div>
      <div class="reveal bg-soft-50 rounded-2xl p-6 border border-soft-100">
        <div class="flex text-amber-400 mb-3">⭐⭐⭐⭐⭐</div>
        <p class="text-soft-600 text-sm leading-relaxed mb-4">「帶小朋友來看張醫師，他超有耐心！孩子從怕到笑，現在每半年回診都很期待，覺得像在玩遊戲。」</p>
        <p class="font-semibold text-sm">— 王媽媽 / 兒童牙科</p>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section id="faq" class="py-20 tooth-bg">
  <div class="max-w-3xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-dental-500 font-semibold text-sm tracking-widest uppercase">FAQ</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 text-soft-900">常見問題</h2>
    </div>
    <div class="space-y-3">
      <div class="reveal bg-white rounded-xl border border-soft-200 overflow-hidden">
        <button onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('span:last-child').textContent=this.nextElementSibling.classList.contains('hidden')?'+':'−'" class="w-full flex justify-between items-center p-5 text-left font-semibold text-sm hover:bg-soft-50 transition-colors">
          <span>初診需要準備什麼？</span><span class="text-dental-500 text-xl">+</span>
        </button>
        <div class="hidden px-5 pb-5 text-soft-500 text-sm leading-relaxed">請攜帶健保卡。如有其他醫院的 X 光片或病歷，也歡迎帶來供醫師參考。建議提前 10 分鐘到院填寫資料。</div>
      </div>
      <div class="reveal bg-white rounded-xl border border-soft-200 overflow-hidden">
        <button onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('span:last-child').textContent=this.nextElementSibling.classList.contains('hidden')?'+':'−'" class="w-full flex justify-between items-center p-5 text-left font-semibold text-sm hover:bg-soft-50 transition-colors">
          <span>隱形矯正的療程大約多久？</span><span class="text-dental-500 text-xl">+</span>
        </button>
        <div class="hidden px-5 pb-5 text-soft-500 text-sm leading-relaxed">一般療程約 12-24 個月，視個人齒列狀況而定。初診時醫師會透過 3D 掃描進行模擬，讓您預覽治療後的效果。</div>
      </div>
      <div class="reveal bg-white rounded-xl border border-soft-200 overflow-hidden">
        <button onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('span:last-child').textContent=this.nextElementSibling.classList.contains('hidden')?'+':'−'" class="w-full flex justify-between items-center p-5 text-left font-semibold text-sm hover:bg-soft-50 transition-colors">
          <span>植牙費用可以分期嗎？</span><span class="text-dental-500 text-xl">+</span>
        </button>
        <div class="hidden px-5 pb-5 text-soft-500 text-sm leading-relaxed">可以。我們提供 3/6/12 期零利率分期付款，也接受各大信用卡。詳細方案歡迎洽詢櫃台。</div>
      </div>
      <div class="reveal bg-white rounded-xl border border-soft-200 overflow-hidden">
        <button onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('span:last-child').textContent=this.nextElementSibling.classList.contains('hidden')?'+':'−'" class="w-full flex justify-between items-center p-5 text-left font-semibold text-sm hover:bg-soft-50 transition-colors">
          <span>看診時間是？有夜間門診嗎？</span><span class="text-dental-500 text-xl">+</span>
        </button>
        <div class="hidden px-5 pb-5 text-soft-500 text-sm leading-relaxed">週一至週五 09:00-21:00（含夜間門診），週六 09:00-17:00，週日休診。國定假日另行公告。</div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="py-20 bg-gradient-to-r from-dental-500 to-dental-600 text-white">
  <div class="max-w-3xl mx-auto px-6 text-center reveal">
    <h2 class="text-3xl md:text-4xl font-bold mb-4">笑容，從好的牙齒開始</h2>
    <p class="text-dental-100 text-lg mb-8">立即預約免費諮詢，讓我們為您規劃專屬治療方案</p>
    <div class="flex flex-wrap justify-center gap-4">
      <button onclick="document.getElementById('booking-modal').classList.remove('hidden')" class="bg-white text-dental-600 px-8 py-3.5 rounded-xl font-bold hover:bg-dental-50 transition-colors shadow-xl">
        線上預約 →
      </button>
      <a href="tel:0227081234" class="border-2 border-white/50 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/10 transition-colors">
        📞 (02) 2708-1234
      </a>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-soft-900 text-soft-400 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid md:grid-cols-3 gap-8 mb-8">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 bg-dental-500 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8 2 5 5.5 5 9c0 2 .8 3.5 2 5l3 7c.3.6 1 1 1.7 1h.6c.7 0 1.4-.4 1.7-1l3-7c1.2-1.5 2-3 2-5 0-3.5-3-7-7-7z"/></svg>
          </div>
          <span class="text-white font-bold">悅光牙醫</span>
        </div>
        <p class="text-sm leading-relaxed">專業溫柔的牙科照護，讓每一次看診都是安心體驗。</p>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-3">看診資訊</h4>
        <p class="text-sm">週一至週五 09:00 - 21:00</p>
        <p class="text-sm">週六 09:00 - 17:00</p>
        <p class="text-sm">週日休診</p>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-3">聯絡方式</h4>
        <p class="text-sm">📍 台北市大安區和平東路二段 88 號 2F</p>
        <p class="text-sm">📞 (02) 2708-1234</p>
        <p class="text-sm">📧 info@brightsmile.tw</p>
      </div>
    </div>
    <div class="border-t border-soft-800 pt-8 text-center text-sm text-soft-500">
      © 2026 悅光牙醫診所 BrightSmile Dental. All rights reserved.
    </div>
  </div>
</footer>

<!-- Booking Modal -->
<div id="booking-modal" class="hidden fixed inset-0 z-[60] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="this.parentElement.classList.add('hidden')"></div>
  <div class="relative bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
    <button onclick="this.closest('#booking-modal').classList.add('hidden')" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-soft-100 flex items-center justify-center text-soft-500 hover:bg-soft-200 transition-colors">✕</button>
    <h3 class="text-2xl font-bold mb-2">線上預約</h3>
    <p class="text-soft-400 text-sm mb-6">填寫資訊後，我們會以簡訊確認預約時間</p>
    <div class="space-y-4">
      <div><label class="text-sm font-semibold text-soft-600 mb-1 block">姓名</label><input type="text" placeholder="您的姓名" class="w-full border border-soft-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-dental-300 outline-none"></div>
      <div><label class="text-sm font-semibold text-soft-600 mb-1 block">手機</label><input type="tel" placeholder="09xx-xxx-xxx" class="w-full border border-soft-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-dental-300 outline-none"></div>
      <div><label class="text-sm font-semibold text-soft-600 mb-1 block">預約項目</label>
        <select class="w-full border border-soft-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-dental-300 outline-none">
          <option>一般洗牙 / 檢查</option><option>補牙 / 根管治療</option><option>美白諮詢</option><option>隱形矯正諮詢</option><option>植牙諮詢</option><option>兒童牙科</option><option>全瓷冠 / 貼片</option>
        </select>
      </div>
      <div><label class="text-sm font-semibold text-soft-600 mb-1 block">希望日期</label><input type="date" class="w-full border border-soft-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-dental-300 outline-none"></div>
      <div><label class="text-sm font-semibold text-soft-600 mb-1 block">時段偏好</label>
        <div class="grid grid-cols-3 gap-2">
          <button type="button" onclick="this.classList.toggle('ring-2');this.classList.toggle('ring-dental-500');this.classList.toggle('bg-dental-50')" class="border border-soft-200 rounded-lg py-2 text-sm font-medium hover:border-dental-300 transition-colors">上午</button>
          <button type="button" onclick="this.classList.toggle('ring-2');this.classList.toggle('ring-dental-500');this.classList.toggle('bg-dental-50')" class="border border-soft-200 rounded-lg py-2 text-sm font-medium hover:border-dental-300 transition-colors">下午</button>
          <button type="button" onclick="this.classList.toggle('ring-2');this.classList.toggle('ring-dental-500');this.classList.toggle('bg-dental-50')" class="border border-soft-200 rounded-lg py-2 text-sm font-medium hover:border-dental-300 transition-colors">夜間</button>
        </div>
      </div>
      <button onclick="showToast('預約成功！我們會在 1 小時內簡訊確認 📱');this.closest('#booking-modal').classList.add('hidden')" class="w-full bg-dental-500 text-white py-3 rounded-xl font-bold hover:bg-dental-600 transition-colors shadow-lg">送出預約</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-soft-900 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-semibold translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"></div>

<script>
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),2500);}
const obs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:0.15});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',()=>{document.getElementById('mobile-menu').classList.add('hidden');});});
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
