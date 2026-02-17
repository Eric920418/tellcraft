-- Template Preview V2: landing-yoga (靜心瑜珈 ZenYoga)
-- Enhanced version: Zen/calm aesthetic, sage greens, earth tones, lavender accents
-- Interactive: Booking modal, FAQ accordion, Schedule tabs, Smooth scroll
-- Sections: Nav, Hero, Stats, Classes, Schedule, Instructors, Pricing, Testimonials, Space, FAQ, Location, CTA, Footer

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'b56324ea-a163-4257-a2df-98d5c5ff9304',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>靜心瑜珈 ZenYoga — 在呼吸之間找到內在平靜</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif']
      },
      colors: {
        sage: { 50:'#f0fdf4', 100:'#dcfce7', 200:'#bbf7d0', 300:'#86efac', 400:'#4ade80', 500:'#22c55e', 600:'#16a34a', 700:'#15803d', 800:'#166534' },
        earth: { 50:'#faf7f2', 100:'#f3ece0', 200:'#e8dcc8', 300:'#d4c4a0', 400:'#bda878', 500:'#a68e5b', 600:'#8b7346', 700:'#6f5b38', 800:'#574830' },
        lavender: { 50:'#f5f3ff', 100:'#ede9fe', 200:'#ddd6fe', 300:'#c4b5fd', 400:'#a78bfa', 500:'#8b5cf6', 600:'#7c3aed' },
        warm: { 50:'#fefce8', 100:'#fef9c3' }
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', system-ui, sans-serif; background: #faf8f5; color: #3d3d3d; overflow-x: hidden; }
  html { scroll-behavior: smooth; }
  .font-serif { font-family: 'Cormorant Garamond', Georgia, serif; }

  /* Nav scroll effect */
  .nav-bar { transition: all 0.3s ease; }
  .nav-scrolled { background: rgba(250,248,245,0.97) !important; box-shadow: 0 1px 20px rgba(0,0,0,0.06); }

  /* Cards */
  .class-card { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); border: 1px solid rgba(34,197,94,0.08); }
  .class-card:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(22,101,52,0.08); border-color: rgba(34,197,94,0.2); }

  .instructor-card { transition: all 0.3s ease; }
  .instructor-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,0.08); }

  .pricing-card { transition: all 0.35s ease; border: 1px solid rgba(34,197,94,0.1); }
  .pricing-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(22,101,52,0.1); }
  .pricing-featured { border: 2px solid #a78bfa; box-shadow: 0 8px 32px rgba(167,139,250,0.12); }
  .pricing-featured:hover { box-shadow: 0 20px 56px rgba(167,139,250,0.18); }

  .testimonial-card { transition: all 0.3s ease; }
  .testimonial-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }

  .space-card { transition: all 0.3s ease; overflow: hidden; }
  .space-card:hover { transform: scale(1.02); box-shadow: 0 12px 36px rgba(0,0,0,0.08); }

  /* FAQ */
  .faq-item { border-bottom: 1px solid rgba(34,197,94,0.1); }
  .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.4s ease, padding 0.3s ease; }
  .faq-answer.open { max-height: 200px; }
  .faq-chevron { transition: transform 0.3s ease; }
  .faq-chevron.open { transform: rotate(180deg); }

  /* Schedule tabs */
  .schedule-tab { transition: all 0.25s ease; cursor: pointer; }
  .schedule-tab.active { background: #166534; color: white; }
  .schedule-tab:not(.active):hover { background: #dcfce7; }
  .schedule-content { display: none; }
  .schedule-content.active { display: block; }

  .schedule-row { transition: all 0.2s ease; border-bottom: 1px solid rgba(34,197,94,0.06); }
  .schedule-row:hover { background: rgba(34,197,94,0.04); }

  /* Modal */
  .modal-overlay { opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
  .modal-overlay.open { opacity: 1; pointer-events: all; }
  .modal-panel { transform: translateY(20px) scale(0.97); transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
  .modal-overlay.open .modal-panel { transform: translateY(0) scale(1); }

  /* Misc */
  .gradient-text { background: linear-gradient(135deg, #166534, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .breath-anim { animation: breathe 6s ease-in-out infinite; }
  @keyframes breathe { 0%,100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.08); opacity: 1; } }

  .leaf-float { animation: leafFloat 8s ease-in-out infinite; }
  @keyframes leafFloat { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-12px) rotate(5deg); } }

  .fade-in { opacity: 0; transform: translateY(24px); transition: all 0.7s cubic-bezier(0.4,0,0.2,1); }
  .fade-in.visible { opacity: 1; transform: translateY(0); }

  input:focus, select:focus, textarea:focus { outline: none; border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(167,139,250,0.15); }
  .btn-primary { background: #166534; color: white; transition: all 0.25s ease; }
  .btn-primary:hover { background: #15803d; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(22,101,52,0.2); }
  .btn-lavender { background: #a78bfa; color: white; transition: all 0.25s ease; }
  .btn-lavender:hover { background: #8b5cf6; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(167,139,250,0.3); }
</style>
</head>
<body>

<!-- ============ STICKY NAV ============ -->
<nav id="mainNav" class="nav-bar sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-sage-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <a href="#hero" class="flex items-center gap-2.5">
      <span class="text-2xl leaf-float">🍃</span>
      <span class="font-serif text-xl font-semibold text-sage-800 tracking-wide">ZenYoga</span>
    </a>
    <div class="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
      <a href="#classes" class="hover:text-sage-700 transition">課程介紹</a>
      <a href="#schedule" class="hover:text-sage-700 transition">本週課表</a>
      <a href="#instructors" class="hover:text-sage-700 transition">師資陣容</a>
      <a href="#pricing" class="hover:text-sage-700 transition">方案價格</a>
      <a href="#faq" class="hover:text-sage-700 transition">常見問題</a>
      <button onclick="openBookingModal()" class="btn-lavender px-5 py-2 rounded-full text-sm font-semibold">預約體驗</button>
    </div>
    <button onclick="openBookingModal()" class="md:hidden btn-lavender px-4 py-2 rounded-full text-xs font-semibold">預約體驗</button>
  </div>
</nav>

<!-- ============ HERO ============ -->
<section id="hero" class="relative min-h-[85vh] flex items-center justify-center bg-gradient-to-b from-sage-50 via-white to-earth-50 overflow-hidden">
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-20 left-10 w-64 h-64 bg-sage-200/30 rounded-full blur-3xl breath-anim"></div>
    <div class="absolute bottom-20 right-10 w-80 h-80 bg-lavender-200/20 rounded-full blur-3xl breath-anim" style="animation-delay:-3s"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-earth-100/20 rounded-full blur-3xl"></div>
  </div>
  <div class="relative z-10 text-center max-w-3xl mx-auto px-6 py-24">
    <div class="inline-flex items-center gap-2 bg-sage-100/80 backdrop-blur px-4 py-1.5 rounded-full text-sage-700 text-xs font-medium mb-8 tracking-wider uppercase">
      <span>🧘</span> 靜心瑜珈工作室
    </div>
    <h1 class="font-serif text-5xl md:text-7xl font-bold text-sage-800 leading-tight mb-6 tracking-tight">
      在呼吸之間<br><span class="gradient-text">找到內在平靜</span>
    </h1>
    <p class="text-gray-500 text-lg md:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
      結合傳統智慧與現代教學，ZenYoga 引導每一位學員探索身心的和諧與平衡。無論你是初學者還是進階練習者，這裡都是你的歸屬。
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <button onclick="openBookingModal()" class="btn-primary px-8 py-3.5 rounded-full text-base font-semibold flex items-center gap-2">
        <span>免費體驗一堂課</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
      <a href="#classes" class="text-sage-600 font-medium hover:text-sage-800 transition flex items-center gap-1.5 text-sm">
        探索課程 <span class="text-lg">↓</span>
      </a>
    </div>
  </div>
</section>

<!-- ============ STATS ============ -->
<section class="py-16 bg-sage-800">
  <div class="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    <div>
      <div class="font-serif text-4xl md:text-5xl font-bold text-white mb-1">10<span class="text-lavender-400">年</span></div>
      <div class="text-sage-300 text-sm">教學經驗</div>
    </div>
    <div>
      <div class="font-serif text-4xl md:text-5xl font-bold text-white mb-1">6000<span class="text-lavender-400">+</span></div>
      <div class="text-sage-300 text-sm">累計學員</div>
    </div>
    <div>
      <div class="font-serif text-4xl md:text-5xl font-bold text-white mb-1">8<span class="text-lavender-400">位</span></div>
      <div class="text-sage-300 text-sm">認證老師</div>
    </div>
    <div>
      <div class="font-serif text-4xl md:text-5xl font-bold text-white mb-1">30<span class="text-lavender-400">+</span></div>
      <div class="text-sage-300 text-sm">每週堂數</div>
    </div>
  </div>
</section>

<!-- ============ CLASSES ============ -->
<section id="classes" class="py-24 bg-earth-50/50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-sage-500 text-sm font-medium tracking-widest uppercase">Our Classes</span>
      <h2 class="font-serif text-4xl md:text-5xl font-bold text-sage-800 mt-3 mb-4">課程介紹</h2>
      <p class="text-gray-500 max-w-lg mx-auto">六大瑜珈課程，從動態流動到深度冥想，滿足不同階段的身心需求</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
      <!-- Card 1 -->
      <div class="class-card bg-white rounded-2xl p-7 cursor-pointer">
        <div class="w-14 h-14 bg-sage-100 rounded-2xl flex items-center justify-center text-2xl mb-5">🙏</div>
        <h3 class="font-serif text-xl font-bold text-sage-800 mb-2">哈達瑜珈</h3>
        <span class="inline-block bg-sage-100 text-sage-700 text-xs font-medium px-2.5 py-0.5 rounded-full mb-3">入門友善</span>
        <p class="text-gray-500 text-sm leading-relaxed mb-4">經典的瑜珈基礎課程，透過體位法與呼吸調息的結合，建立穩固的練習根基。適合所有程度的學員。</p>
        <div class="flex items-center gap-4 text-xs text-gray-400">
          <span>⏱ 60 分鐘</span><span>💪 初學～中級</span>
        </div>
      </div>
      <!-- Card 2 -->
      <div class="class-card bg-white rounded-2xl p-7 cursor-pointer">
        <div class="w-14 h-14 bg-lavender-100 rounded-2xl flex items-center justify-center text-2xl mb-5">🌊</div>
        <h3 class="font-serif text-xl font-bold text-sage-800 mb-2">流動瑜珈</h3>
        <span class="inline-block bg-lavender-100 text-lavender-600 text-xs font-medium px-2.5 py-0.5 rounded-full mb-3">活力動態</span>
        <p class="text-gray-500 text-sm leading-relaxed mb-4">以流暢的動作串連呼吸，在動態中找到平衡。強化核心力量，提升身體柔軟度與協調性。</p>
        <div class="flex items-center gap-4 text-xs text-gray-400">
          <span>⏱ 75 分鐘</span><span>💪 中級</span>
        </div>
      </div>
      <!-- Card 3 -->
      <div class="class-card bg-white rounded-2xl p-7 cursor-pointer">
        <div class="w-14 h-14 bg-earth-100 rounded-2xl flex items-center justify-center text-2xl mb-5">🌙</div>
        <h3 class="font-serif text-xl font-bold text-sage-800 mb-2">陰瑜珈</h3>
        <span class="inline-block bg-earth-100 text-earth-600 text-xs font-medium px-2.5 py-0.5 rounded-full mb-3">深層放鬆</span>
        <p class="text-gray-500 text-sm leading-relaxed mb-4">長時間停留在各個體式中，深入伸展結締組織與筋膜。搭配冥想引導，釋放深層壓力與情緒。</p>
        <div class="flex items-center gap-4 text-xs text-gray-400">
          <span>⏱ 75 分鐘</span><span>💪 所有程度</span>
        </div>
      </div>
      <!-- Card 4 -->
      <div class="class-card bg-white rounded-2xl p-7 cursor-pointer">
        <div class="w-14 h-14 bg-lavender-50 rounded-2xl flex items-center justify-center text-2xl mb-5">🎐</div>
        <h3 class="font-serif text-xl font-bold text-sage-800 mb-2">空中瑜珈</h3>
        <span class="inline-block bg-lavender-50 text-lavender-500 text-xs font-medium px-2.5 py-0.5 rounded-full mb-3">人氣課程</span>
        <p class="text-gray-500 text-sm leading-relaxed mb-4">利用懸吊絲帶輔助練習，在空中體驗無重力的自由感。強化上肢力量，深度延展脊椎。</p>
        <div class="flex items-center gap-4 text-xs text-gray-400">
          <span>⏱ 60 分鐘</span><span>💪 中級～進階</span>
        </div>
      </div>
      <!-- Card 5 -->
      <div class="class-card bg-white rounded-2xl p-7 cursor-pointer">
        <div class="w-14 h-14 bg-warm-50 rounded-2xl flex items-center justify-center text-2xl mb-5">🤰</div>
        <h3 class="font-serif text-xl font-bold text-sage-800 mb-2">孕婦瑜珈</h3>
        <span class="inline-block bg-warm-50 text-earth-500 text-xs font-medium px-2.5 py-0.5 rounded-full mb-3">專業指導</span>
        <p class="text-gray-500 text-sm leading-relaxed mb-4">專為準媽媽設計的溫和課程，緩解孕期不適，強化骨盆底肌群。在安全的環境中維持身心舒適。</p>
        <div class="flex items-center gap-4 text-xs text-gray-400">
          <span>⏱ 50 分鐘</span><span>💪 孕期專屬</span>
        </div>
      </div>
      <!-- Card 6 -->
      <div class="class-card bg-white rounded-2xl p-7 cursor-pointer">
        <div class="w-14 h-14 bg-sage-50 rounded-2xl flex items-center justify-center text-2xl mb-5">🧠</div>
        <h3 class="font-serif text-xl font-bold text-sage-800 mb-2">冥想正念</h3>
        <span class="inline-block bg-sage-50 text-sage-600 text-xs font-medium px-2.5 py-0.5 rounded-full mb-3">心靈成長</span>
        <p class="text-gray-500 text-sm leading-relaxed mb-4">結合呼吸法、身體掃描與引導式冥想，培養專注力與覺察力。幫助你在忙碌生活中找到內在寧靜。</p>
        <div class="flex items-center gap-4 text-xs text-gray-400">
          <span>⏱ 45 分鐘</span><span>💪 所有程度</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ SCHEDULE TABS ============ -->
<section id="schedule" class="py-24 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-sage-500 text-sm font-medium tracking-widest uppercase">Weekly Schedule</span>
      <h2 class="font-serif text-4xl md:text-5xl font-bold text-sage-800 mt-3 mb-4">本週課表</h2>
      <p class="text-gray-500 max-w-lg mx-auto">選擇適合你的時段，開始你的瑜珈旅程</p>
    </div>

    <!-- Day Tabs -->
    <div class="flex flex-wrap justify-center gap-2 mb-10">
      <button class="schedule-tab active px-5 py-2.5 rounded-full text-sm font-semibold bg-sage-100 text-sage-700" onclick="switchDay(this, 'mon')">週一</button>
      <button class="schedule-tab px-5 py-2.5 rounded-full text-sm font-semibold bg-sage-100 text-sage-700" onclick="switchDay(this, 'tue')">週二</button>
      <button class="schedule-tab px-5 py-2.5 rounded-full text-sm font-semibold bg-sage-100 text-sage-700" onclick="switchDay(this, 'wed')">週三</button>
      <button class="schedule-tab px-5 py-2.5 rounded-full text-sm font-semibold bg-sage-100 text-sage-700" onclick="switchDay(this, 'thu')">週四</button>
      <button class="schedule-tab px-5 py-2.5 rounded-full text-sm font-semibold bg-sage-100 text-sage-700" onclick="switchDay(this, 'fri')">週五</button>
      <button class="schedule-tab px-5 py-2.5 rounded-full text-sm font-semibold bg-sage-100 text-sage-700" onclick="switchDay(this, 'sat')">週六</button>
      <button class="schedule-tab px-5 py-2.5 rounded-full text-sm font-semibold bg-sage-100 text-sage-700" onclick="switchDay(this, 'sun')">週日</button>
    </div>

    <!-- Schedule Content -->
    <div class="bg-sage-50/50 rounded-2xl overflow-hidden border border-sage-100">
      <!-- Header -->
      <div class="grid grid-cols-4 gap-4 px-6 py-3 bg-sage-100/60 text-xs font-semibold text-sage-700 uppercase tracking-wider">
        <span>時間</span><span>課程</span><span>老師</span><span>教室</span>
      </div>

      <!-- Monday -->
      <div id="day-mon" class="schedule-content active">
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">09:00 - 10:00</span>
          <span class="text-sm text-gray-600">🙏 哈達瑜珈</span>
          <span class="text-sm text-gray-500">林靜怡</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">11:00 - 12:15</span>
          <span class="text-sm text-gray-600">🌊 流動瑜珈</span>
          <span class="text-sm text-gray-500">陳柔安</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">14:00 - 15:00</span>
          <span class="text-sm text-gray-600">🎐 空中瑜珈</span>
          <span class="text-sm text-gray-500">王曉薇</span>
          <span class="text-xs bg-lavender-100 text-lavender-600 px-2 py-0.5 rounded-full w-fit">小教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">19:00 - 20:15</span>
          <span class="text-sm text-gray-600">🌙 陰瑜珈</span>
          <span class="text-sm text-gray-500">林靜怡</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
      </div>

      <!-- Tuesday -->
      <div id="day-tue" class="schedule-content">
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">07:00 - 08:00</span>
          <span class="text-sm text-gray-600">🧠 冥想正念</span>
          <span class="text-sm text-gray-500">張心瑜</span>
          <span class="text-xs bg-earth-100 text-earth-600 px-2 py-0.5 rounded-full w-fit">小教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">10:00 - 11:15</span>
          <span class="text-sm text-gray-600">🌊 流動瑜珈</span>
          <span class="text-sm text-gray-500">陳柔安</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">15:00 - 15:50</span>
          <span class="text-sm text-gray-600">🤰 孕婦瑜珈</span>
          <span class="text-sm text-gray-500">林靜怡</span>
          <span class="text-xs bg-earth-100 text-earth-600 px-2 py-0.5 rounded-full w-fit">小教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">18:30 - 19:30</span>
          <span class="text-sm text-gray-600">🙏 哈達瑜珈</span>
          <span class="text-sm text-gray-500">李文宏</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
      </div>

      <!-- Wednesday -->
      <div id="day-wed" class="schedule-content">
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">09:30 - 10:45</span>
          <span class="text-sm text-gray-600">🌊 流動瑜珈</span>
          <span class="text-sm text-gray-500">陳柔安</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">13:00 - 14:00</span>
          <span class="text-sm text-gray-600">🎐 空中瑜珈</span>
          <span class="text-sm text-gray-500">王曉薇</span>
          <span class="text-xs bg-lavender-100 text-lavender-600 px-2 py-0.5 rounded-full w-fit">小教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">19:00 - 20:15</span>
          <span class="text-sm text-gray-600">🌙 陰瑜珈</span>
          <span class="text-sm text-gray-500">張心瑜</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
      </div>

      <!-- Thursday -->
      <div id="day-thu" class="schedule-content">
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">07:00 - 07:45</span>
          <span class="text-sm text-gray-600">🧠 冥想正念</span>
          <span class="text-sm text-gray-500">張心瑜</span>
          <span class="text-xs bg-earth-100 text-earth-600 px-2 py-0.5 rounded-full w-fit">小教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">10:00 - 11:00</span>
          <span class="text-sm text-gray-600">🙏 哈達瑜珈</span>
          <span class="text-sm text-gray-500">李文宏</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">14:00 - 15:00</span>
          <span class="text-sm text-gray-600">🎐 空中瑜珈</span>
          <span class="text-sm text-gray-500">王曉薇</span>
          <span class="text-xs bg-lavender-100 text-lavender-600 px-2 py-0.5 rounded-full w-fit">小教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">18:00 - 19:15</span>
          <span class="text-sm text-gray-600">🌊 流動瑜珈</span>
          <span class="text-sm text-gray-500">陳柔安</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
      </div>

      <!-- Friday -->
      <div id="day-fri" class="schedule-content">
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">09:00 - 10:00</span>
          <span class="text-sm text-gray-600">🙏 哈達瑜珈</span>
          <span class="text-sm text-gray-500">林靜怡</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">11:00 - 11:50</span>
          <span class="text-sm text-gray-600">🤰 孕婦瑜珈</span>
          <span class="text-sm text-gray-500">林靜怡</span>
          <span class="text-xs bg-earth-100 text-earth-600 px-2 py-0.5 rounded-full w-fit">小教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">19:30 - 20:45</span>
          <span class="text-sm text-gray-600">🌙 陰瑜珈</span>
          <span class="text-sm text-gray-500">張心瑜</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
      </div>

      <!-- Saturday -->
      <div id="day-sat" class="schedule-content">
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">08:00 - 08:45</span>
          <span class="text-sm text-gray-600">🧠 冥想正念</span>
          <span class="text-sm text-gray-500">張心瑜</span>
          <span class="text-xs bg-earth-100 text-earth-600 px-2 py-0.5 rounded-full w-fit">小教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">09:30 - 10:45</span>
          <span class="text-sm text-gray-600">🌊 流動瑜珈</span>
          <span class="text-sm text-gray-500">陳柔安</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">11:00 - 12:00</span>
          <span class="text-sm text-gray-600">🎐 空中瑜珈</span>
          <span class="text-sm text-gray-500">王曉薇</span>
          <span class="text-xs bg-lavender-100 text-lavender-600 px-2 py-0.5 rounded-full w-fit">小教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">14:00 - 15:00</span>
          <span class="text-sm text-gray-600">🙏 哈達瑜珈</span>
          <span class="text-sm text-gray-500">李文宏</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
      </div>

      <!-- Sunday -->
      <div id="day-sun" class="schedule-content">
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">09:00 - 10:15</span>
          <span class="text-sm text-gray-600">🌊 流動瑜珈</span>
          <span class="text-sm text-gray-500">陳柔安</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">10:30 - 11:45</span>
          <span class="text-sm text-gray-600">🌙 陰瑜珈</span>
          <span class="text-sm text-gray-500">林靜怡</span>
          <span class="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full w-fit">大教室</span>
        </div>
        <div class="schedule-row grid grid-cols-4 gap-4 px-6 py-4 items-center">
          <span class="text-sm font-medium text-sage-800">15:00 - 15:45</span>
          <span class="text-sm text-gray-600">🧠 冥想正念</span>
          <span class="text-sm text-gray-500">張心瑜</span>
          <span class="text-xs bg-earth-100 text-earth-600 px-2 py-0.5 rounded-full w-fit">小教室</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ INSTRUCTORS ============ -->
<section id="instructors" class="py-24 bg-sage-50/30">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-sage-500 text-sm font-medium tracking-widest uppercase">Our Team</span>
      <h2 class="font-serif text-4xl md:text-5xl font-bold text-sage-800 mt-3 mb-4">師資陣容</h2>
      <p class="text-gray-500 max-w-lg mx-auto">每位老師皆持有國際認證，用專業與熱忱引導你的練習</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-7">
      <!-- Instructor 1 -->
      <div class="instructor-card bg-white rounded-2xl overflow-hidden text-center">
        <div class="h-48 bg-gradient-to-br from-sage-200 to-sage-300 flex items-center justify-center">
          <span class="text-7xl">🧘‍♀️</span>
        </div>
        <div class="p-6">
          <h3 class="font-serif text-lg font-bold text-sage-800 mb-1">林靜怡</h3>
          <p class="text-lavender-500 text-xs font-medium mb-3">創辦人 / 主任教師</p>
          <div class="flex flex-wrap gap-1.5 justify-center mb-3">
            <span class="text-xs bg-sage-50 text-sage-600 px-2 py-0.5 rounded-full">RYT-500</span>
            <span class="text-xs bg-sage-50 text-sage-600 px-2 py-0.5 rounded-full">孕婦瑜珈認證</span>
          </div>
          <p class="text-gray-400 text-xs leading-relaxed">15 年教學經驗，曾赴印度 Rishikesh 深造，專精哈達與修復瑜珈。</p>
        </div>
      </div>
      <!-- Instructor 2 -->
      <div class="instructor-card bg-white rounded-2xl overflow-hidden text-center">
        <div class="h-48 bg-gradient-to-br from-lavender-200 to-lavender-300 flex items-center justify-center">
          <span class="text-7xl">🧘‍♀️</span>
        </div>
        <div class="p-6">
          <h3 class="font-serif text-lg font-bold text-sage-800 mb-1">陳柔安</h3>
          <p class="text-lavender-500 text-xs font-medium mb-3">流動瑜珈首席</p>
          <div class="flex flex-wrap gap-1.5 justify-center mb-3">
            <span class="text-xs bg-lavender-50 text-lavender-600 px-2 py-0.5 rounded-full">RYT-200</span>
            <span class="text-xs bg-lavender-50 text-lavender-600 px-2 py-0.5 rounded-full">Vinyasa 專修</span>
          </div>
          <p class="text-gray-400 text-xs leading-relaxed">舞蹈背景出身，擅長以音樂引導流暢的體式轉換，課堂充滿活力與創意。</p>
        </div>
      </div>
      <!-- Instructor 3 -->
      <div class="instructor-card bg-white rounded-2xl overflow-hidden text-center">
        <div class="h-48 bg-gradient-to-br from-earth-100 to-earth-200 flex items-center justify-center">
          <span class="text-7xl">🧘‍♂️</span>
        </div>
        <div class="p-6">
          <h3 class="font-serif text-lg font-bold text-sage-800 mb-1">李文宏</h3>
          <p class="text-lavender-500 text-xs font-medium mb-3">體適能瑜珈教師</p>
          <div class="flex flex-wrap gap-1.5 justify-center mb-3">
            <span class="text-xs bg-earth-50 text-earth-600 px-2 py-0.5 rounded-full">RYT-200</span>
            <span class="text-xs bg-earth-50 text-earth-600 px-2 py-0.5 rounded-full">NASM-CPT</span>
          </div>
          <p class="text-gray-400 text-xs leading-relaxed">運動科學碩士，結合健身與瑜珈，注重體態調整與核心力量訓練。</p>
        </div>
      </div>
      <!-- Instructor 4 -->
      <div class="instructor-card bg-white rounded-2xl overflow-hidden text-center">
        <div class="h-48 bg-gradient-to-br from-sage-100 to-lavender-100 flex items-center justify-center">
          <span class="text-7xl">🧘‍♀️</span>
        </div>
        <div class="p-6">
          <h3 class="font-serif text-lg font-bold text-sage-800 mb-1">張心瑜</h3>
          <p class="text-lavender-500 text-xs font-medium mb-3">冥想 / 陰瑜珈教師</p>
          <div class="flex flex-wrap gap-1.5 justify-center mb-3">
            <span class="text-xs bg-sage-50 text-sage-600 px-2 py-0.5 rounded-full">RYT-300</span>
            <span class="text-xs bg-sage-50 text-sage-600 px-2 py-0.5 rounded-full">正念引導師</span>
          </div>
          <p class="text-gray-400 text-xs leading-relaxed">心理諮商背景，擅長以溫柔的引導帶領冥想，幫助學員釋放壓力。</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ PRICING ============ -->
<section id="pricing" class="py-24 bg-white">
  <div class="max-w-5xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-sage-500 text-sm font-medium tracking-widest uppercase">Pricing</span>
      <h2 class="font-serif text-4xl md:text-5xl font-bold text-sage-800 mt-3 mb-4">方案價格</h2>
      <p class="text-gray-500 max-w-lg mx-auto">彈性方案，找到最適合你練習節奏的選擇</p>
    </div>
    <div class="grid md:grid-cols-3 gap-7">
      <!-- Single -->
      <div class="pricing-card bg-white rounded-2xl p-8">
        <div class="text-center mb-6">
          <span class="text-3xl mb-3 block">🌱</span>
          <h3 class="font-serif text-xl font-bold text-sage-800 mb-1">單堂體驗</h3>
          <p class="text-gray-400 text-sm">輕鬆體驗，無負擔</p>
        </div>
        <div class="text-center mb-6">
          <span class="font-serif text-5xl font-bold text-sage-800">$500</span>
          <span class="text-gray-400 text-sm ml-1">/ 堂</span>
        </div>
        <ul class="space-y-3 mb-8 text-sm text-gray-500">
          <li class="flex items-center gap-2"><span class="text-sage-500">&#10003;</span> 所有基礎課程</li>
          <li class="flex items-center gap-2"><span class="text-sage-500">&#10003;</span> 瑜珈墊免費提供</li>
          <li class="flex items-center gap-2"><span class="text-sage-500">&#10003;</span> 淋浴設施使用</li>
          <li class="flex items-center gap-2 text-gray-300"><span>&#10007;</span> 空中瑜珈需加價</li>
          <li class="flex items-center gap-2 text-gray-300"><span>&#10007;</span> 無專屬置物櫃</li>
        </ul>
        <button onclick="openBookingModal()" class="w-full py-3 rounded-full border-2 border-sage-200 text-sage-700 font-semibold text-sm hover:bg-sage-50 transition cursor-pointer">立即預約</button>
      </div>

      <!-- Monthly - Featured -->
      <div class="pricing-card pricing-featured bg-white rounded-2xl p-8 relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-lavender-400 text-white text-xs font-bold px-4 py-1 rounded-full">最受歡迎</div>
        <div class="text-center mb-6">
          <span class="text-3xl mb-3 block">🌿</span>
          <h3 class="font-serif text-xl font-bold text-sage-800 mb-1">月票方案</h3>
          <p class="text-gray-400 text-sm">每月不限堂數</p>
        </div>
        <div class="text-center mb-6">
          <span class="font-serif text-5xl font-bold text-lavender-500">$3,800</span>
          <span class="text-gray-400 text-sm ml-1">/ 月</span>
        </div>
        <ul class="space-y-3 mb-8 text-sm text-gray-500">
          <li class="flex items-center gap-2"><span class="text-lavender-500">&#10003;</span> 所有課程不限堂數</li>
          <li class="flex items-center gap-2"><span class="text-lavender-500">&#10003;</span> 含空中瑜珈</li>
          <li class="flex items-center gap-2"><span class="text-lavender-500">&#10003;</span> 專屬置物櫃</li>
          <li class="flex items-center gap-2"><span class="text-lavender-500">&#10003;</span> 會員專屬工作坊</li>
          <li class="flex items-center gap-2 text-gray-300"><span>&#10007;</span> 無好友共享</li>
        </ul>
        <button onclick="openBookingModal()" class="w-full py-3 rounded-full btn-lavender font-semibold text-sm cursor-pointer">立即加入</button>
      </div>

      <!-- Quarterly -->
      <div class="pricing-card bg-white rounded-2xl p-8">
        <div class="text-center mb-6">
          <span class="text-3xl mb-3 block">🌳</span>
          <h3 class="font-serif text-xl font-bold text-sage-800 mb-1">季票方案</h3>
          <p class="text-gray-400 text-sm">深度練習，最佳價值</p>
        </div>
        <div class="text-center mb-2">
          <span class="font-serif text-5xl font-bold text-sage-800">$9,800</span>
          <span class="text-gray-400 text-sm ml-1">/ 季</span>
        </div>
        <p class="text-center text-xs text-sage-500 mb-6">平均每月 $3,267，省 14%</p>
        <ul class="space-y-3 mb-8 text-sm text-gray-500">
          <li class="flex items-center gap-2"><span class="text-sage-500">&#10003;</span> 月票所有權益</li>
          <li class="flex items-center gap-2"><span class="text-sage-500">&#10003;</span> 每月 1 次免費私教</li>
          <li class="flex items-center gap-2"><span class="text-sage-500">&#10003;</span> 好友共享 2 堂/月</li>
          <li class="flex items-center gap-2"><span class="text-sage-500">&#10003;</span> 優先預約熱門課</li>
          <li class="flex items-center gap-2"><span class="text-sage-500">&#10003;</span> 合作品牌優惠</li>
        </ul>
        <button onclick="openBookingModal()" class="w-full py-3 rounded-full btn-primary font-semibold text-sm cursor-pointer">立即加入</button>
      </div>
    </div>
  </div>
</section>

<!-- ============ TESTIMONIALS ============ -->
<section class="py-24 bg-sage-50/50">
  <div class="max-w-5xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-sage-500 text-sm font-medium tracking-widest uppercase">Testimonials</span>
      <h2 class="font-serif text-4xl md:text-5xl font-bold text-sage-800 mt-3 mb-4">學員心聲</h2>
      <p class="text-gray-500 max-w-lg mx-auto">來自真實學員的分享與回饋</p>
    </div>
    <div class="grid md:grid-cols-3 gap-7">
      <div class="testimonial-card bg-white rounded-2xl p-7">
        <div class="flex gap-1 text-lavender-400 mb-4 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="text-gray-600 text-sm leading-relaxed mb-6">「在 ZenYoga 練習三個月後，我的失眠問題改善了八成。靜怡老師的陰瑜珈真的讓我學會如何放鬆，不只是身體，更是心靈。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-sage-200 rounded-full flex items-center justify-center text-sage-700 font-semibold text-sm">陳</div>
          <div>
            <p class="text-sm font-semibold text-sage-800">陳小姐</p>
            <p class="text-xs text-gray-400">上班族，練習 8 個月</p>
          </div>
        </div>
      </div>
      <div class="testimonial-card bg-white rounded-2xl p-7">
        <div class="flex gap-1 text-lavender-400 mb-4 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="text-gray-600 text-sm leading-relaxed mb-6">「空中瑜珈太有趣了！曉薇老師很有耐心，即使我一開始超緊張也慢慢引導我。現在每週最期待的就是上課時間。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-lavender-200 rounded-full flex items-center justify-center text-lavender-700 font-semibold text-sm">林</div>
          <div>
            <p class="text-sm font-semibold text-sage-800">林先生</p>
            <p class="text-xs text-gray-400">自由工作者，練習 1 年</p>
          </div>
        </div>
      </div>
      <div class="testimonial-card bg-white rounded-2xl p-7">
        <div class="flex gap-1 text-lavender-400 mb-4 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="text-gray-600 text-sm leading-relaxed mb-6">「孕期上課讓我很安心，靜怡老師會特別注意每個動作的安全性。產後恢復也比預期快很多，真的很感謝整個團隊。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-earth-200 rounded-full flex items-center justify-center text-earth-700 font-semibold text-sm">王</div>
          <div>
            <p class="text-sm font-semibold text-sage-800">王太太</p>
            <p class="text-xs text-gray-400">新手媽媽，練習 2 年</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ STUDIO SPACE ============ -->
<section class="py-24 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-sage-500 text-sm font-medium tracking-widest uppercase">Our Space</span>
      <h2 class="font-serif text-4xl md:text-5xl font-bold text-sage-800 mt-3 mb-4">空間環境</h2>
      <p class="text-gray-500 max-w-lg mx-auto">精心打造的練習空間，讓你沉浸在寧靜與舒適之中</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="space-card bg-sage-50 rounded-2xl p-8 text-center">
        <div class="text-5xl mb-5">🏛️</div>
        <h3 class="font-serif text-lg font-bold text-sage-800 mb-2">大教室</h3>
        <p class="text-gray-500 text-sm leading-relaxed">120 坪挑高空間，全落地窗引入自然光。紐西蘭進口軟木地板，可容納 25 位學員。</p>
      </div>
      <div class="space-card bg-lavender-50 rounded-2xl p-8 text-center">
        <div class="text-5xl mb-5">🎐</div>
        <h3 class="font-serif text-lg font-bold text-sage-800 mb-2">小教室</h3>
        <p class="text-gray-500 text-sm leading-relaxed">專為空中瑜珈設計，配備專業懸吊系統。小班制 10 人，溫馨私密的練習體驗。</p>
      </div>
      <div class="space-card bg-earth-50 rounded-2xl p-8 text-center">
        <div class="text-5xl mb-5">🚿</div>
        <h3 class="font-serif text-lg font-bold text-sage-800 mb-2">更衣室</h3>
        <p class="text-gray-500 text-sm leading-relaxed">獨立淋浴間、化妝區、吹風機。提供有機沐浴用品，課後清爽出門。</p>
      </div>
      <div class="space-card bg-warm-50 rounded-2xl p-8 text-center">
        <div class="text-5xl mb-5">☕</div>
        <h3 class="font-serif text-lg font-bold text-sage-800 mb-2">休息區</h3>
        <p class="text-gray-500 text-sm leading-relaxed">免費花草茶與輕食吧。舒適的沙發閱讀角，課前課後都能放鬆身心。</p>
      </div>
    </div>
  </div>
</section>

<!-- ============ FAQ ============ -->
<section id="faq" class="py-24 bg-sage-50/30">
  <div class="max-w-3xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-sage-500 text-sm font-medium tracking-widest uppercase">FAQ</span>
      <h2 class="font-serif text-4xl md:text-5xl font-bold text-sage-800 mt-3 mb-4">常見問題</h2>
    </div>
    <div class="space-y-0">
      <div class="faq-item py-5" onclick="toggleFaq(this)">
        <button class="w-full flex items-center justify-between text-left cursor-pointer bg-transparent border-none">
          <span class="font-semibold text-sage-800">完全沒有瑜珈經驗，適合來上課嗎？</span>
          <svg class="faq-chevron w-5 h-5 text-sage-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer">
          <p class="text-gray-500 text-sm leading-relaxed pt-3 pb-1">當然適合！我們的哈達瑜珈和冥想正念課程都非常適合零基礎的學員。老師會根據每個人的身體狀況給予不同的調整建議，你只需要穿著舒適的衣服來就好。我們也提供免費體驗課，讓你先感受氛圍再決定。</p>
        </div>
      </div>
      <div class="faq-item py-5" onclick="toggleFaq(this)">
        <button class="w-full flex items-center justify-between text-left cursor-pointer bg-transparent border-none">
          <span class="font-semibold text-sage-800">需要自己帶瑜珈墊嗎？上課需要準備什麼？</span>
          <svg class="faq-chevron w-5 h-5 text-sage-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer">
          <p class="text-gray-500 text-sm leading-relaxed pt-3 pb-1">不需要！教室提供專業等級的瑜珈墊、瑜珈磚、瑜珈帶等所有輔具。你只需要穿著方便活動的衣物，帶一瓶水即可。建議上課前 2 小時避免進食過飽。如果你有自己的瑜珈墊也歡迎帶來使用。</p>
        </div>
      </div>
      <div class="faq-item py-5" onclick="toggleFaq(this)">
        <button class="w-full flex items-center justify-between text-left cursor-pointer bg-transparent border-none">
          <span class="font-semibold text-sage-800">月票可以暫停嗎？出差或旅行怎麼辦？</span>
          <svg class="faq-chevron w-5 h-5 text-sage-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer">
          <p class="text-gray-500 text-sm leading-relaxed pt-3 pb-1">可以的！月票及季票方案每年享有最多 30 天的凍結額度，只要提前 3 天告知櫃檯即可啟用。出國旅行或身體不適都可以使用凍結功能，讓你的權益不會浪費。</p>
        </div>
      </div>
      <div class="faq-item py-5" onclick="toggleFaq(this)">
        <button class="w-full flex items-center justify-between text-left cursor-pointer bg-transparent border-none">
          <span class="font-semibold text-sage-800">空中瑜珈有體重或年齡限制嗎？</span>
          <svg class="faq-chevron w-5 h-5 text-sage-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer">
          <p class="text-gray-500 text-sm leading-relaxed pt-3 pb-1">我們的空中絲帶承重可達 300 公斤，所以體重不是問題。年齡建議 16 歲以上，65 歲以下。但如果有高血壓、青光眼、嚴重脊椎問題或懷孕中，建議先諮詢醫師再報名。首次上課老師會先做安全評估。</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ LOCATION & HOURS ============ -->
<section class="py-24 bg-white">
  <div class="max-w-5xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-sage-500 text-sm font-medium tracking-widest uppercase">Visit Us</span>
      <h2 class="font-serif text-4xl md:text-5xl font-bold text-sage-800 mt-3 mb-4">位置與營業時間</h2>
    </div>
    <div class="grid md:grid-cols-2 gap-10">
      <div class="bg-sage-50 rounded-2xl p-8">
        <h3 class="font-serif text-xl font-bold text-sage-800 mb-5 flex items-center gap-2">📍 交通資訊</h3>
        <div class="space-y-4 text-sm text-gray-600">
          <div>
            <p class="font-semibold text-sage-700 mb-1">地址</p>
            <p>台北市大安區仁愛路四段 123 號 3 樓</p>
          </div>
          <div>
            <p class="font-semibold text-sage-700 mb-1">捷運</p>
            <p>忠孝敦化站 3 號出口，步行 5 分鐘</p>
          </div>
          <div>
            <p class="font-semibold text-sage-700 mb-1">停車</p>
            <p>大樓地下停車場（出示會員卡折抵 1 小時）</p>
          </div>
          <div>
            <p class="font-semibold text-sage-700 mb-1">電話</p>
            <p>02-2771-0123</p>
          </div>
        </div>
      </div>
      <div class="bg-earth-50 rounded-2xl p-8">
        <h3 class="font-serif text-xl font-bold text-sage-800 mb-5 flex items-center gap-2">🕐 營業時間</h3>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between items-center py-2 border-b border-earth-100">
            <span class="text-gray-600">週一至週五</span>
            <span class="font-medium text-sage-700">07:00 - 21:00</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-earth-100">
            <span class="text-gray-600">週六</span>
            <span class="font-medium text-sage-700">08:00 - 18:00</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-earth-100">
            <span class="text-gray-600">週日</span>
            <span class="font-medium text-sage-700">09:00 - 17:00</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-gray-600">國定假日</span>
            <span class="font-medium text-earth-500">依公告調整</span>
          </div>
        </div>
        <p class="text-xs text-gray-400 mt-4">＊最後入場時間為課程開始前 10 分鐘</p>
      </div>
    </div>
  </div>
</section>

<!-- ============ CTA ============ -->
<section class="py-24 bg-gradient-to-br from-sage-800 via-sage-700 to-sage-800 relative overflow-hidden">
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-10 right-20 w-48 h-48 bg-lavender-400/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-10 left-20 w-64 h-64 bg-sage-400/10 rounded-full blur-3xl"></div>
  </div>
  <div class="relative z-10 text-center max-w-2xl mx-auto px-6">
    <span class="text-5xl block mb-6 breath-anim">🍃</span>
    <h2 class="font-serif text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
      開始你的瑜珈旅程
    </h2>
    <p class="text-sage-200 text-lg mb-10 leading-relaxed">
      第一堂體驗課完全免費，沒有任何壓力。<br>讓我們一起在呼吸之間，找到屬於你的平靜。
    </p>
    <button onclick="openBookingModal()" class="btn-lavender px-10 py-4 rounded-full text-base font-bold tracking-wide cursor-pointer inline-flex items-center gap-2">
      預約免費體驗課
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </button>
    <p class="text-sage-400 text-xs mt-5">無需綁約，體驗後再決定</p>
  </div>
</section>

<!-- ============ FOOTER ============ -->
<footer class="bg-sage-900 text-sage-300 py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid md:grid-cols-4 gap-10 mb-12">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <span class="text-xl">🍃</span>
          <span class="font-serif text-lg font-semibold text-white">ZenYoga</span>
        </div>
        <p class="text-sm leading-relaxed text-sage-400">在呼吸之間，找到內在平靜。ZenYoga 靜心瑜珈工作室，你的身心歸屬。</p>
      </div>
      <div>
        <h4 class="font-semibold text-white text-sm mb-4">快速連結</h4>
        <ul class="space-y-2 text-sm text-sage-400">
          <li><a href="#classes" class="hover:text-white transition">課程介紹</a></li>
          <li><a href="#schedule" class="hover:text-white transition">本週課表</a></li>
          <li><a href="#instructors" class="hover:text-white transition">師資陣容</a></li>
          <li><a href="#pricing" class="hover:text-white transition">方案價格</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold text-white text-sm mb-4">關注我們</h4>
        <ul class="space-y-2 text-sm text-sage-400">
          <li><a href="#" class="hover:text-white transition">Instagram</a></li>
          <li><a href="#" class="hover:text-white transition">Facebook</a></li>
          <li><a href="#" class="hover:text-white transition">LINE 官方帳號</a></li>
          <li><a href="#" class="hover:text-white transition">YouTube</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold text-white text-sm mb-4">聯絡資訊</h4>
        <ul class="space-y-2 text-sm text-sage-400">
          <li>台北市大安區仁愛路四段 123 號 3F</li>
          <li>02-2771-0123</li>
          <li>hello@zenyoga.tw</li>
          <li>週一至週五 07:00-21:00</li>
        </ul>
      </div>
    </div>
    <div class="border-t border-sage-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="text-xs text-sage-500">&copy; 2026 ZenYoga 靜心瑜珈工作室 All Rights Reserved.</p>
      <div class="flex gap-6 text-xs text-sage-500">
        <a href="#" class="hover:text-sage-300 transition">隱私權政策</a>
        <a href="#" class="hover:text-sage-300 transition">服務條款</a>
        <a href="#" class="hover:text-sage-300 transition">退費規則</a>
      </div>
    </div>
  </div>
</footer>

<!-- ============ BOOKING MODAL ============ -->
<div id="bookingModal" class="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4" style="background:rgba(0,0,0,0.5)">
  <div class="modal-panel bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
    <!-- Modal Header -->
    <div class="flex items-center justify-between p-6 border-b border-sage-100">
      <div>
        <h3 class="font-serif text-xl font-bold text-sage-800">預約體驗課程</h3>
        <p class="text-gray-400 text-sm mt-0.5">填寫以下資料，我們將盡快與您聯繫</p>
      </div>
      <button onclick="closeBookingModal()" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sage-100 transition text-gray-400 cursor-pointer text-lg">&times;</button>
    </div>

    <!-- Form -->
    <div id="bookingForm" class="p-6 space-y-5">
      <div>
        <label class="block text-sm font-medium text-sage-700 mb-1.5">姓名</label>
        <input type="text" placeholder="請輸入您的姓名" class="w-full px-4 py-2.5 rounded-xl border border-sage-200 text-sm bg-sage-50/50 transition">
      </div>
      <div>
        <label class="block text-sm font-medium text-sage-700 mb-1.5">手機號碼</label>
        <input type="tel" placeholder="0912-345-678" class="w-full px-4 py-2.5 rounded-xl border border-sage-200 text-sm bg-sage-50/50 transition">
      </div>
      <div>
        <label class="block text-sm font-medium text-sage-700 mb-1.5">想體驗的課程</label>
        <select class="w-full px-4 py-2.5 rounded-xl border border-sage-200 text-sm bg-sage-50/50 transition appearance-none cursor-pointer">
          <option value="">請選擇課程類型</option>
          <option value="hatha">🙏 哈達瑜珈（入門推薦）</option>
          <option value="flow">🌊 流動瑜珈</option>
          <option value="yin">🌙 陰瑜珈</option>
          <option value="aerial">🎐 空中瑜珈</option>
          <option value="prenatal">🤰 孕婦瑜珈</option>
          <option value="meditation">🧠 冥想正念</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-sage-700 mb-1.5">預約日期</label>
          <input type="date" class="w-full px-4 py-2.5 rounded-xl border border-sage-200 text-sm bg-sage-50/50 transition">
        </div>
        <div>
          <label class="block text-sm font-medium text-sage-700 mb-1.5">偏好時段</label>
          <select class="w-full px-4 py-2.5 rounded-xl border border-sage-200 text-sm bg-sage-50/50 transition appearance-none cursor-pointer">
            <option value="">選擇時段</option>
            <option value="morning">上午 (07-12)</option>
            <option value="afternoon">下午 (12-17)</option>
            <option value="evening">晚上 (17-21)</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-sage-700 mb-2.5">瑜珈經驗</label>
        <div class="flex flex-wrap gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="experience" value="none" class="w-4 h-4 accent-sage-600" checked>
            <span class="text-sm text-gray-600">完全沒有</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="experience" value="beginner" class="w-4 h-4 accent-sage-600">
            <span class="text-sm text-gray-600">初學（<1年）</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="experience" value="intermediate" class="w-4 h-4 accent-sage-600">
            <span class="text-sm text-gray-600">有經驗（1-3年）</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="experience" value="advanced" class="w-4 h-4 accent-sage-600">
            <span class="text-sm text-gray-600">進階（3年+）</span>
          </label>
        </div>
      </div>
      <button onclick="submitBooking()" class="w-full btn-primary py-3 rounded-full font-semibold text-sm cursor-pointer mt-2">送出預約</button>
    </div>

    <!-- Success State -->
    <div id="bookingSuccess" class="p-10 text-center hidden">
      <div class="text-5xl mb-4">🎉</div>
      <h3 class="font-serif text-2xl font-bold text-sage-800 mb-2">預約成功！</h3>
      <p class="text-gray-500 text-sm leading-relaxed mb-6">我們已收到您的預約資訊，將在 24 小時內以簡訊確認您的體驗時段。</p>
      <p class="text-xs text-gray-400 mb-6">如有任何問題，歡迎撥打 02-2771-0123</p>
      <button onclick="closeBookingModal()" class="btn-lavender px-8 py-2.5 rounded-full text-sm font-semibold cursor-pointer">好的，我知道了</button>
    </div>
  </div>
</div>

<!-- ============ JAVASCRIPT ============ -->
<script>
// === NAV SCROLL ===
window.addEventListener('scroll', function() {
  var nav = document.getElementById('mainNav');
  if (window.scrollY > 50) { nav.classList.add('nav-scrolled'); }
  else { nav.classList.remove('nav-scrolled'); }
});

// === SCHEDULE TABS ===
function switchDay(btn, dayId) {
  document.querySelectorAll('.schedule-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.schedule-content').forEach(function(c) { c.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById('day-' + dayId).classList.add('active');
}

// === FAQ ACCORDION ===
function toggleFaq(item) {
  var answer = item.querySelector('.faq-answer');
  var chevron = item.querySelector('.faq-chevron');
  var isOpen = answer.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-answer').forEach(function(a) { a.classList.remove('open'); });
  document.querySelectorAll('.faq-chevron').forEach(function(c) { c.classList.remove('open'); });

  // Toggle current
  if (!isOpen) {
    answer.classList.add('open');
    chevron.classList.add('open');
  }
}

// === BOOKING MODAL ===
function openBookingModal() {
  document.getElementById('bookingModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('open');
  document.body.style.overflow = '';
  // Reset form state
  setTimeout(function() {
    document.getElementById('bookingForm').classList.remove('hidden');
    document.getElementById('bookingSuccess').classList.add('hidden');
  }, 300);
}

function submitBooking() {
  document.getElementById('bookingForm').classList.add('hidden');
  document.getElementById('bookingSuccess').classList.remove('hidden');
}

// Close modal on overlay click
document.getElementById('bookingModal').addEventListener('click', function(e) {
  if (e.target === this) closeBookingModal();
});

// Close modal on Escape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeBookingModal();
});

// === SCROLL ANIMATION (Intersection Observer) ===
document.addEventListener('DOMContentLoaded', function() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.class-card, .instructor-card, .pricing-card, .testimonial-card, .space-card').forEach(function(el) {
    el.classList.add('fade-in');
    observer.observe(el);
  });
});
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
