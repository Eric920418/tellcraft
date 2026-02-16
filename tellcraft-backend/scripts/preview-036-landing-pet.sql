INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '4a41bc4a-13fb-4a03-a0f9-63c9526f1589',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>毛孩星球 PawPlanet — 寵物店 & 獸醫診所</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        paw: { 50:'#fef7ee', 100:'#fdecd3', 200:'#fad5a5', 300:'#f6b86d', 400:'#f19333', 500:'#ef7d1a', 600:'#d45e0a', 700:'#b1440c', 800:'#8d3711', 900:'#763011' },
        mint: { 50:'#effef4', 100:'#d9fce6', 200:'#b5f8cf', 300:'#7cf1ab', 400:'#3ce17f', 500:'#14c95e', 600:'#0ba64b', 700:'#0d823e', 800:'#106635', 900:'#0e542d' },
        bark: { 50:'#f9f6f3', 100:'#f0ebe3', 200:'#dfd4c5', 300:'#ccb9a1', 400:'#b89b7d', 500:'#a88466', 600:'#9a735a', 700:'#80604c', 800:'#6a5042', 900:'#584338' }
      },
      fontFamily: { nunito:['Nunito','Noto Sans TC','sans-serif'] }
    }
  }
}
</script>
<style>
  * { font-family: 'Nunito', 'Noto Sans TC', sans-serif; }
  html { scroll-behavior: smooth; }
  .paw-pattern { background-image: radial-gradient(circle, rgba(241,147,51,0.08) 1px, transparent 1px); background-size: 32px 32px; }
  .float { animation: float 3s ease-in-out infinite; }
  .float-delay { animation: float 3s ease-in-out 1.5s infinite; }
  @keyframes float { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-12px); } }
  @keyframes wiggle { 0%,100%{ transform:rotate(0deg); } 25%{ transform:rotate(-5deg); } 75%{ transform:rotate(5deg); } }
  .wiggle:hover { animation: wiggle 0.4s ease-in-out; }
  .reveal { opacity:0; transform:translateY(30px); transition:all 0.7s cubic-bezier(0.16,1,0.3,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }
</style>
</head>
<body class="bg-paw-50 text-bark-900">

<!-- Navbar -->
<nav class="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-paw-100">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2">
      <span class="text-3xl">🐾</span>
      <span class="text-xl font-extrabold text-paw-600">毛孩星球</span>
      <span class="text-xs font-semibold text-bark-400 hidden sm:inline">PawPlanet</span>
    </a>
    <div class="hidden md:flex items-center gap-8 text-sm font-semibold text-bark-600">
      <a href="#services" class="hover:text-paw-500 transition-colors">服務項目</a>
      <a href="#about" class="hover:text-paw-500 transition-colors">關於我們</a>
      <a href="#team" class="hover:text-paw-500 transition-colors">醫療團隊</a>
      <a href="#shop" class="hover:text-paw-500 transition-colors">寵物商城</a>
      <a href="#contact" class="hover:text-paw-500 transition-colors">聯絡我們</a>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="document.getElementById('booking-modal').classList.remove('hidden')" class="bg-paw-500 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-paw-600 transition-colors shadow-lg shadow-paw-500/25 wiggle">
        立即預約 🐶
      </button>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-bark-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-white border-t px-6 py-4 space-y-3">
    <a href="#services" class="block text-sm font-semibold text-bark-600 hover:text-paw-500">服務項目</a>
    <a href="#about" class="block text-sm font-semibold text-bark-600 hover:text-paw-500">關於我們</a>
    <a href="#team" class="block text-sm font-semibold text-bark-600 hover:text-paw-500">醫療團隊</a>
    <a href="#shop" class="block text-sm font-semibold text-bark-600 hover:text-paw-500">寵物商城</a>
    <a href="#contact" class="block text-sm font-semibold text-bark-600 hover:text-paw-500">聯絡我們</a>
  </div>
</nav>

<!-- Hero -->
<section class="pt-24 pb-16 paw-pattern overflow-hidden">
  <div class="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
    <div>
      <div class="inline-flex items-center gap-2 bg-mint-100 text-mint-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
        <span>🏥</span> 專業獸醫 · 溫暖照護
      </div>
      <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
        給毛孩<br>
        <span class="text-paw-500">最溫柔的</span><br>
        呵護 🧡
      </h1>
      <p class="text-bark-500 text-lg mb-8 leading-relaxed">
        從健康檢查到美容洗澡，從營養諮詢到 24 小時急診。<br>
        毛孩星球陪伴每一位毛寶貝健康快樂成長。
      </p>
      <div class="flex flex-wrap gap-4">
        <button onclick="document.getElementById('booking-modal').classList.remove('hidden')" class="bg-paw-500 text-white px-8 py-3.5 rounded-full font-bold text-lg hover:bg-paw-600 transition-all shadow-xl shadow-paw-500/30 hover:shadow-2xl hover:-translate-y-0.5">
          預約看診 →
        </button>
        <a href="#services" class="border-2 border-bark-200 text-bark-600 px-8 py-3.5 rounded-full font-bold text-lg hover:border-paw-300 hover:text-paw-600 transition-all">
          了解服務
        </a>
      </div>
      <div class="flex items-center gap-6 mt-10">
        <div class="text-center"><span class="block text-2xl font-extrabold text-paw-600">12+</span><span class="text-xs text-bark-400">專業獸醫師</span></div>
        <div class="w-px h-8 bg-bark-200"></div>
        <div class="text-center"><span class="block text-2xl font-extrabold text-mint-600">8,000+</span><span class="text-xs text-bark-400">快樂毛孩</span></div>
        <div class="w-px h-8 bg-bark-200"></div>
        <div class="text-center"><span class="block text-2xl font-extrabold text-bark-600">15年</span><span class="text-xs text-bark-400">服務經驗</span></div>
      </div>
    </div>
    <div class="relative flex justify-center">
      <div class="w-80 h-80 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-paw-200 to-paw-100 flex items-center justify-center relative">
        <span class="text-[150px] float">🐕</span>
        <span class="absolute top-4 right-8 text-5xl float-delay">🦴</span>
        <span class="absolute bottom-8 left-4 text-4xl float">❤️</span>
        <span class="absolute top-12 left-0 text-3xl float-delay">⭐</span>
      </div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-paw-500 font-bold text-sm tracking-widest uppercase">Our Services</span>
      <h2 class="text-3xl md:text-4xl font-extrabold mt-3">我們的服務 🩺</h2>
      <p class="text-bark-400 mt-3 max-w-lg mx-auto">全方位照顧您的毛寶貝，從預防保健到專科治療</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="reveal group bg-paw-50 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all border border-paw-100 cursor-pointer">
        <div class="w-14 h-14 rounded-xl bg-paw-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">🩺</div>
        <h3 class="font-bold text-lg mb-2">一般健檢</h3>
        <p class="text-bark-400 text-sm leading-relaxed">年度綜合健康檢查，血液、X 光、超音波完整報告，早期發現潛在問題。</p>
        <span class="inline-block mt-3 text-paw-500 font-bold text-sm">NT$ 1,200 起 →</span>
      </div>
      <div class="reveal group bg-mint-50 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all border border-mint-100 cursor-pointer">
        <div class="w-14 h-14 rounded-xl bg-mint-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">💉</div>
        <h3 class="font-bold text-lg mb-2">疫苗接種</h3>
        <p class="text-bark-400 text-sm leading-relaxed">犬貓核心疫苗、狂犬病疫苗、萊姆病疫苗，完整免疫計畫。</p>
        <span class="inline-block mt-3 text-mint-600 font-bold text-sm">NT$ 800 起 →</span>
      </div>
      <div class="reveal group bg-blue-50 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all border border-blue-100 cursor-pointer">
        <div class="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">🦷</div>
        <h3 class="font-bold text-lg mb-2">牙科護理</h3>
        <p class="text-bark-400 text-sm leading-relaxed">超音波洗牙、拔牙手術、口腔健康評估，告別口臭問題。</p>
        <span class="inline-block mt-3 text-blue-600 font-bold text-sm">NT$ 2,500 起 →</span>
      </div>
      <div class="reveal group bg-purple-50 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all border border-purple-100 cursor-pointer">
        <div class="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">✂️</div>
        <h3 class="font-bold text-lg mb-2">美容 SPA</h3>
        <p class="text-bark-400 text-sm leading-relaxed">專業洗澡、造型修剪、SPA 護膚、指甲修剪，給毛孩尊榮享受。</p>
        <span class="inline-block mt-3 text-purple-600 font-bold text-sm">NT$ 600 起 →</span>
      </div>
      <div class="reveal group bg-rose-50 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all border border-rose-100 cursor-pointer">
        <div class="w-14 h-14 rounded-xl bg-rose-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">🏨</div>
        <h3 class="font-bold text-lg mb-2">住院照護</h3>
        <p class="text-bark-400 text-sm leading-relaxed">24 小時獸醫師值班、獨立隔離病房、每日視訊報告回覆飼主。</p>
        <span class="inline-block mt-3 text-rose-600 font-bold text-sm">NT$ 1,500/天 起 →</span>
      </div>
      <div class="reveal group bg-amber-50 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all border border-amber-100 cursor-pointer">
        <div class="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">🚑</div>
        <h3 class="font-bold text-lg mb-2">24H 急診</h3>
        <p class="text-bark-400 text-sm leading-relaxed">全年無休急診服務，配備完整急救設備，10 分鐘內回應。</p>
        <span class="inline-block mt-3 text-amber-600 font-bold text-sm">緊急專線 →</span>
      </div>
    </div>
  </div>
</section>

<!-- About -->
<section id="about" class="py-20 paw-pattern">
  <div class="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-center">
    <div class="reveal">
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white rounded-2xl p-6 shadow-lg text-center">
          <span class="text-5xl block mb-3">🐱</span>
          <span class="text-2xl font-extrabold text-paw-600">3,200+</span>
          <p class="text-bark-400 text-sm mt-1">貓咪看診數</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-lg text-center mt-8">
          <span class="text-5xl block mb-3">🐶</span>
          <span class="text-2xl font-extrabold text-mint-600">4,800+</span>
          <p class="text-bark-400 text-sm mt-1">狗狗看診數</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-lg text-center">
          <span class="text-5xl block mb-3">🐰</span>
          <span class="text-2xl font-extrabold text-blue-600">650+</span>
          <p class="text-bark-400 text-sm mt-1">特殊寵物</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-lg text-center mt-8">
          <span class="text-5xl block mb-3">⭐</span>
          <span class="text-2xl font-extrabold text-amber-600">4.9</span>
          <p class="text-bark-400 text-sm mt-1">Google 評分</p>
        </div>
      </div>
    </div>
    <div class="reveal">
      <span class="text-paw-500 font-bold text-sm tracking-widest uppercase">About Us</span>
      <h2 class="text-3xl md:text-4xl font-extrabold mt-3 mb-6">因為愛，所以用心 💛</h2>
      <p class="text-bark-500 leading-relaxed mb-4">
        毛孩星球成立於 2011 年，由一群熱愛動物的獸醫師創立。我們相信每一個毛孩都值得被溫柔對待，每一位飼主都值得安心的醫療服務。
      </p>
      <p class="text-bark-500 leading-relaxed mb-6">
        我們引進日本、美國最先進的醫療設備，並持續進修學習，只為給您的寶貝最好的照護。
      </p>
      <div class="space-y-3">
        <div class="flex items-center gap-3"><span class="w-8 h-8 rounded-full bg-mint-100 flex items-center justify-center text-mint-600 font-bold text-sm">✓</span><span class="text-sm font-semibold">日本進口數位 X 光 & 高階超音波</span></div>
        <div class="flex items-center gap-3"><span class="w-8 h-8 rounded-full bg-mint-100 flex items-center justify-center text-mint-600 font-bold text-sm">✓</span><span class="text-sm font-semibold">獨立無菌手術室 × 3</span></div>
        <div class="flex items-center gap-3"><span class="w-8 h-8 rounded-full bg-mint-100 flex items-center justify-center text-mint-600 font-bold text-sm">✓</span><span class="text-sm font-semibold">犬貓分離候診區，降低緊迫感</span></div>
        <div class="flex items-center gap-3"><span class="w-8 h-8 rounded-full bg-mint-100 flex items-center justify-center text-mint-600 font-bold text-sm">✓</span><span class="text-sm font-semibold">24 小時 ICU 重症照護</span></div>
      </div>
    </div>
  </div>
</section>

<!-- Team -->
<section id="team" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-paw-500 font-bold text-sm tracking-widest uppercase">Our Team</span>
      <h2 class="text-3xl md:text-4xl font-extrabold mt-3">專業醫療團隊 👨‍⚕️</h2>
      <p class="text-bark-400 mt-3">每一位都是經驗豐富、充滿愛心的動物守護者</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="reveal group text-center">
        <div class="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-paw-200 to-paw-300 flex items-center justify-center text-6xl mb-4 group-hover:scale-105 transition-transform shadow-lg">👨‍⚕️</div>
        <h4 class="font-bold text-lg">陳志明 院長</h4>
        <p class="text-paw-500 text-sm font-semibold">外科 / 腫瘤科</p>
        <p class="text-bark-400 text-xs mt-1">臺大獸醫系 · 日本麻布大學研修</p>
      </div>
      <div class="reveal group text-center">
        <div class="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-mint-200 to-mint-300 flex items-center justify-center text-6xl mb-4 group-hover:scale-105 transition-transform shadow-lg">👩‍⚕️</div>
        <h4 class="font-bold text-lg">林雅婷 醫師</h4>
        <p class="text-mint-600 text-sm font-semibold">內科 / 心臟科</p>
        <p class="text-bark-400 text-xs mt-1">中興獸醫系 · 美國 ACVIM 認證</p>
      </div>
      <div class="reveal group text-center">
        <div class="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center text-6xl mb-4 group-hover:scale-105 transition-transform shadow-lg">👨‍⚕️</div>
        <h4 class="font-bold text-lg">王建宏 醫師</h4>
        <p class="text-blue-600 text-sm font-semibold">骨科 / 復健科</p>
        <p class="text-bark-400 text-xs mt-1">嘉大獸醫系 · CCRP 復健認證</p>
      </div>
      <div class="reveal group text-center">
        <div class="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-purple-200 to-purple-300 flex items-center justify-center text-6xl mb-4 group-hover:scale-105 transition-transform shadow-lg">👩‍⚕️</div>
        <h4 class="font-bold text-lg">張文馨 醫師</h4>
        <p class="text-purple-600 text-sm font-semibold">皮膚科 / 特殊寵物</p>
        <p class="text-bark-400 text-xs mt-1">屏科大獸醫系 · 兔科專科醫師</p>
      </div>
    </div>
  </div>
</section>

<!-- Shop -->
<section id="shop" class="py-20 paw-pattern">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-paw-500 font-bold text-sm tracking-widest uppercase">Pet Shop</span>
      <h2 class="text-3xl md:text-4xl font-extrabold mt-3">嚴選寵物商城 🛒</h2>
      <p class="text-bark-400 mt-3">獸醫師把關，只給毛孩最好的</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="reveal bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group cursor-pointer">
        <div class="h-44 bg-gradient-to-br from-paw-100 to-paw-200 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">🍖</div>
        <div class="p-5">
          <span class="text-xs font-bold text-paw-500 bg-paw-50 px-2 py-0.5 rounded-full">狗狗飼料</span>
          <h4 class="font-bold mt-2">有機鮮雞無穀糧</h4>
          <p class="text-bark-400 text-xs mt-1">2kg · 紐西蘭放養雞肉</p>
          <div class="flex items-center justify-between mt-3">
            <span class="font-extrabold text-paw-600">NT$ 890</span>
            <button onclick="showToast('已加入購物車 🛒')" class="w-8 h-8 rounded-full bg-paw-500 text-white flex items-center justify-center text-sm hover:bg-paw-600 transition-colors">+</button>
          </div>
        </div>
      </div>
      <div class="reveal bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group cursor-pointer">
        <div class="h-44 bg-gradient-to-br from-mint-100 to-mint-200 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">🐟</div>
        <div class="p-5">
          <span class="text-xs font-bold text-mint-600 bg-mint-50 px-2 py-0.5 rounded-full">貓咪飼料</span>
          <h4 class="font-bold mt-2">深海鮭魚凍乾糧</h4>
          <p class="text-bark-400 text-xs mt-1">1.5kg · 阿拉斯加野生鮭魚</p>
          <div class="flex items-center justify-between mt-3">
            <span class="font-extrabold text-mint-600">NT$ 1,280</span>
            <button onclick="showToast('已加入購物車 🛒')" class="w-8 h-8 rounded-full bg-mint-500 text-white flex items-center justify-center text-sm hover:bg-mint-600 transition-colors">+</button>
          </div>
        </div>
      </div>
      <div class="reveal bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group cursor-pointer">
        <div class="h-44 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">🧸</div>
        <div class="p-5">
          <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">玩具</span>
          <h4 class="font-bold mt-2">智能漏食球</h4>
          <p class="text-bark-400 text-xs mt-1">益智解壓 · 可調難度</p>
          <div class="flex items-center justify-between mt-3">
            <span class="font-extrabold text-blue-600">NT$ 450</span>
            <button onclick="showToast('已加入購物車 🛒')" class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm hover:bg-blue-600 transition-colors">+</button>
          </div>
        </div>
      </div>
      <div class="reveal bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group cursor-pointer">
        <div class="h-44 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">🧴</div>
        <div class="p-5">
          <span class="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">清潔</span>
          <h4 class="font-bold mt-2">草本低敏洗毛精</h4>
          <p class="text-bark-400 text-xs mt-1">500ml · 薰衣草茶樹配方</p>
          <div class="flex items-center justify-between mt-3">
            <span class="font-extrabold text-purple-600">NT$ 380</span>
            <button onclick="showToast('已加入購物車 🛒')" class="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm hover:bg-purple-600 transition-colors">+</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-paw-500 font-bold text-sm tracking-widest uppercase">Reviews</span>
      <h2 class="text-3xl md:text-4xl font-extrabold mt-3">飼主怎麼說 💬</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="reveal bg-paw-50 rounded-2xl p-7 border border-paw-100">
        <div class="flex text-paw-400 text-lg mb-3">⭐⭐⭐⭐⭐</div>
        <p class="text-bark-600 text-sm leading-relaxed mb-4">「我家柴柴 Mochi 超怕看醫生，但林醫師每次都好有耐心，還會準備零食安撫。現在 Mochi 反而很期待來看診！」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-paw-200 flex items-center justify-center text-xl">🐕</div>
          <div><p class="font-bold text-sm">小美 & Mochi</p><p class="text-bark-400 text-xs">柴犬 · 3 歲</p></div>
        </div>
      </div>
      <div class="reveal bg-mint-50 rounded-2xl p-7 border border-mint-100">
        <div class="flex text-paw-400 text-lg mb-3">⭐⭐⭐⭐⭐</div>
        <p class="text-bark-600 text-sm leading-relaxed mb-4">「半夜三點阿咪突然嘔吐，打急診電話馬上有人接。到了之後立刻處理，真的是救了一命。謝謝毛孩星球！」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-mint-200 flex items-center justify-center text-xl">🐈</div>
          <div><p class="font-bold text-sm">阿哲 & 阿咪</p><p class="text-bark-400 text-xs">米克斯貓 · 7 歲</p></div>
        </div>
      </div>
      <div class="reveal bg-blue-50 rounded-2xl p-7 border border-blue-100">
        <div class="flex text-paw-400 text-lg mb-3">⭐⭐⭐⭐⭐</div>
        <p class="text-bark-600 text-sm leading-relaxed mb-4">「帶兔兔來看張醫師，她是我遇過最專業的兔科獸醫！環境乾淨，價格透明，強力推薦給所有兔奴。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-xl">🐰</div>
          <div><p class="font-bold text-sm">小雯 & 棉花糖</p><p class="text-bark-400 text-xs">荷蘭垂耳兔 · 2 歲</p></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-20 bg-gradient-to-br from-paw-500 to-paw-600 text-white">
  <div class="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-14">
    <div class="reveal">
      <h2 class="text-3xl md:text-4xl font-extrabold mb-6">聯絡我們 📞</h2>
      <p class="text-paw-100 mb-8 leading-relaxed">有任何關於毛孩健康的問題，歡迎隨時與我們聯繫。</p>
      <div class="space-y-4">
        <div class="flex items-center gap-4"><span class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">📍</span><div><p class="font-bold text-sm">地址</p><p class="text-paw-100 text-sm">台北市大安區和平東路二段 168 號</p></div></div>
        <div class="flex items-center gap-4"><span class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">📞</span><div><p class="font-bold text-sm">電話</p><p class="text-paw-100 text-sm">(02) 2708-8899</p></div></div>
        <div class="flex items-center gap-4"><span class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">🚑</span><div><p class="font-bold text-sm">24H 急診專線</p><p class="text-paw-100 text-sm">0800-PAW-911</p></div></div>
        <div class="flex items-center gap-4"><span class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">🕐</span><div><p class="font-bold text-sm">看診時間</p><p class="text-paw-100 text-sm">週一至週六 09:00-21:00 · 週日 10:00-18:00</p></div></div>
      </div>
    </div>
    <div class="reveal">
      <div class="bg-white rounded-2xl p-8 text-bark-900">
        <h3 class="font-extrabold text-xl mb-5">快速留言 ✉️</h3>
        <div class="space-y-4">
          <div><label class="text-sm font-semibold text-bark-600 mb-1 block">飼主姓名</label><input type="text" placeholder="您的姓名" class="w-full border border-bark-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-paw-300 focus:border-paw-300 outline-none"></div>
          <div><label class="text-sm font-semibold text-bark-600 mb-1 block">毛孩名字 & 品種</label><input type="text" placeholder="例：Mochi · 柴犬" class="w-full border border-bark-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-paw-300 focus:border-paw-300 outline-none"></div>
          <div><label class="text-sm font-semibold text-bark-600 mb-1 block">聯絡電話</label><input type="tel" placeholder="09xx-xxx-xxx" class="w-full border border-bark-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-paw-300 focus:border-paw-300 outline-none"></div>
          <div><label class="text-sm font-semibold text-bark-600 mb-1 block">問題描述</label><textarea rows="3" placeholder="請描述您想諮詢的問題..." class="w-full border border-bark-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-paw-300 focus:border-paw-300 outline-none resize-none"></textarea></div>
          <button onclick="showToast('留言已送出！我們會盡快回覆您 🐾')" class="w-full bg-paw-500 text-white py-3 rounded-xl font-bold hover:bg-paw-600 transition-colors">送出留言 🐾</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-bark-900 text-bark-300 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex flex-col md:flex-row justify-between items-center gap-6">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🐾</span>
        <span class="text-lg font-extrabold text-white">毛孩星球 PawPlanet</span>
      </div>
      <div class="flex gap-4">
        <a href="#" class="w-10 h-10 rounded-full bg-bark-800 flex items-center justify-center hover:bg-paw-500 transition-colors">📘</a>
        <a href="#" class="w-10 h-10 rounded-full bg-bark-800 flex items-center justify-center hover:bg-paw-500 transition-colors">📸</a>
        <a href="#" class="w-10 h-10 rounded-full bg-bark-800 flex items-center justify-center hover:bg-paw-500 transition-colors">🎵</a>
        <a href="#" class="w-10 h-10 rounded-full bg-bark-800 flex items-center justify-center hover:bg-mint-500 transition-colors">💬</a>
      </div>
    </div>
    <div class="border-t border-bark-800 mt-8 pt-8 text-center text-sm text-bark-500">
      © 2026 毛孩星球 PawPlanet. All rights reserved. 用愛守護每一個毛寶貝 ❤️
    </div>
  </div>
</footer>

<!-- Booking Modal -->
<div id="booking-modal" class="hidden fixed inset-0 z-[60] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="this.parentElement.classList.add('hidden')"></div>
  <div class="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
    <button onclick="this.closest('#booking-modal').classList.add('hidden')" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-bark-100 flex items-center justify-center text-bark-500 hover:bg-bark-200 transition-colors">✕</button>
    <h3 class="text-2xl font-extrabold mb-2">預約看診 🏥</h3>
    <p class="text-bark-400 text-sm mb-6">填寫以下資訊，我們會盡快確認您的預約</p>
    <div class="space-y-4">
      <div><label class="text-sm font-semibold text-bark-600 mb-1 block">飼主姓名</label><input type="text" placeholder="您的姓名" class="w-full border border-bark-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-paw-300 outline-none"></div>
      <div><label class="text-sm font-semibold text-bark-600 mb-1 block">聯絡電話</label><input type="tel" placeholder="09xx-xxx-xxx" class="w-full border border-bark-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-paw-300 outline-none"></div>
      <div><label class="text-sm font-semibold text-bark-600 mb-1 block">毛孩種類</label>
        <div class="flex gap-2">
          <button onclick="this.classList.toggle('ring-2');this.classList.toggle('ring-paw-500')" class="flex-1 border border-bark-200 rounded-xl py-2.5 text-sm font-semibold hover:border-paw-300 transition-colors">🐶 狗狗</button>
          <button onclick="this.classList.toggle('ring-2');this.classList.toggle('ring-paw-500')" class="flex-1 border border-bark-200 rounded-xl py-2.5 text-sm font-semibold hover:border-paw-300 transition-colors">🐱 貓咪</button>
          <button onclick="this.classList.toggle('ring-2');this.classList.toggle('ring-paw-500')" class="flex-1 border border-bark-200 rounded-xl py-2.5 text-sm font-semibold hover:border-paw-300 transition-colors">🐰 其他</button>
        </div>
      </div>
      <div><label class="text-sm font-semibold text-bark-600 mb-1 block">預約科別</label>
        <select class="w-full border border-bark-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-paw-300 outline-none">
          <option>一般健檢</option><option>疫苗接種</option><option>牙科護理</option><option>外科手術</option><option>皮膚科</option><option>內科</option><option>骨科 / 復健</option>
        </select>
      </div>
      <div><label class="text-sm font-semibold text-bark-600 mb-1 block">症狀描述</label><textarea rows="2" placeholder="簡述毛孩的狀況..." class="w-full border border-bark-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-paw-300 outline-none resize-none"></textarea></div>
      <button onclick="showToast('預約已送出！我們會在 2 小時內致電確認 📞');this.closest('#booking-modal').classList.add('hidden')" class="w-full bg-paw-500 text-white py-3 rounded-xl font-bold text-lg hover:bg-paw-600 transition-colors shadow-lg">確認預約 🐾</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-bark-900 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-semibold translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"></div>

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
