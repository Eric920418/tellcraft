-- Template Preview: landing-fitness (健身房)
-- 高對比深色主題，螢光綠點綴，大膽粗體排版
-- Sections: Nav, Hero, Features, Class Schedule, Trainers, Pricing, CTA, Footer

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '605ca341-572c-4a23-8adf-b98a89ff2441',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FORGE — 鍛造你的極限</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { sans: ['Outfit', 'system-ui', 'sans-serif'] },
      colors: {
        neon: { 400: '#a3e635', 500: '#84cc16' },
        dark: { 800: '#111111', 900: '#0a0a0a', 950: '#050505' }
      }
    }
  }
}
</script>
<style>
  * { font-family: 'Outfit', system-ui, sans-serif; }
  body { background: #0a0a0a; color: #ffffff; overflow-x: hidden; }
  html { scroll-behavior: smooth; }

  .neon-text { color: #a3e635; }
  .neon-bg { background: #a3e635; }
  .neon-glow { box-shadow: 0 0 30px rgba(163,230,53,0.15); }

  .nav-scrolled {
    background: rgba(10,10,10,0.95) !important;
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(163,230,53,0.1);
  }

  .feature-card {
    transition: all 0.3s ease;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .feature-card:hover {
    border-color: rgba(163,230,53,0.3);
    transform: translateY(-4px);
    box-shadow: 0 20px 60px rgba(163,230,53,0.06);
  }

  .trainer-card:hover .trainer-overlay { opacity: 1; }

  .schedule-row { transition: all 0.2s ease; }
  .schedule-row:hover { background: rgba(163,230,53,0.05); }

  .pricing-card { transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.06); }
  .pricing-card:hover { transform: translateY(-4px); }
  .pricing-popular { border-color: #a3e635; }

  .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.8s ease, transform 0.8s ease; }
  .reveal.active { opacity: 1; transform: translateY(0); }

  .diagonal-stripe {
    background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(163,230,53,0.03) 10px, rgba(163,230,53,0.03) 20px);
  }
</style>
</head>
<body class="antialiased">

<!-- Nav -->
<nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="flex items-center justify-between h-20">
      <a href="#" class="flex items-center gap-2">
        <div class="w-10 h-10 neon-bg rounded-lg flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2.5"><path d="M6 12h12M4 8h2v8H4zM18 8h2v8h-2z"/></svg>
        </div>
        <span class="font-black text-xl tracking-tighter">FORGE</span>
      </a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#features" class="text-sm text-white/60 hover:text-white transition-colors">設施</a>
        <a href="#schedule" class="text-sm text-white/60 hover:text-white transition-colors">課表</a>
        <a href="#trainers" class="text-sm text-white/60 hover:text-white transition-colors">教練</a>
        <a href="#pricing" class="text-sm text-white/60 hover:text-white transition-colors">方案</a>
      </div>
      <div class="hidden md:flex items-center gap-3">
        <button onclick="showToast('會員登入功能開發中')" class="text-sm text-white/60 hover:text-white transition-colors cursor-pointer">登入</button>
        <button onclick="showToast('🎉 歡迎加入 FORGE！7 天免費體驗已開通')" class="neon-bg text-dark-900 text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-lime-400 transition-all cursor-pointer">
          免費體驗
        </button>
      </div>
      <button onclick="toggleMobileMenu()" class="md:hidden p-2 cursor-pointer">
        <svg id="menu-icon" width="24" height="24" fill="none" stroke="white" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg id="close-icon" width="24" height="24" fill="none" stroke="white" stroke-width="2" class="hidden"><path d="M6 6l12 12M6 18L18 6"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="md:hidden hidden bg-dark-900/95 backdrop-blur-xl border-t border-white/5">
    <div class="px-6 py-4 space-y-3">
      <a href="#features" onclick="closeMobileMenu()" class="block text-white/60 text-sm py-2">設施</a>
      <a href="#schedule" onclick="closeMobileMenu()" class="block text-white/60 text-sm py-2">課表</a>
      <a href="#trainers" onclick="closeMobileMenu()" class="block text-white/60 text-sm py-2">教練</a>
      <a href="#pricing" onclick="closeMobileMenu()" class="block text-white/60 text-sm py-2">方案</a>
      <button onclick="showToast('🎉 7 天免費體驗已開通')" class="w-full neon-bg text-dark-900 text-sm font-bold py-2.5 rounded-lg mt-2 cursor-pointer">免費體驗</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="relative min-h-screen flex items-center diagonal-stripe overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-b from-dark-950 via-transparent to-dark-900"></div>
  <div class="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-lime-500/5 to-transparent"></div>

  <div class="relative max-w-7xl mx-auto px-6 lg:px-8 py-32 w-full">
    <div class="max-w-3xl">
      <div class="inline-flex items-center gap-2 bg-white/5 text-neon-400 text-xs font-bold px-4 py-2 rounded-full mb-8 border border-neon-400/20">
        <span class="w-2 h-2 bg-neon-400 rounded-full animate-pulse"></span>
        新會員 7 天免費體驗
      </div>
      <h1 class="text-5xl sm:text-6xl lg:text-8xl font-black leading-none mb-6 tracking-tighter">
        鍛造<br>
        <span class="neon-text">你的極限</span>
      </h1>
      <p class="text-white/50 text-lg max-w-lg mb-10 leading-relaxed">
        FORGE 不只是一間健身房。這裡是你突破自我、重塑身心的鍛造場。頂級設備、專業教練、科學化訓練。
      </p>
      <div class="flex flex-wrap gap-4">
        <button onclick="showToast('🎉 歡迎加入 FORGE！7 天免費體驗已開通')" class="neon-bg text-dark-900 font-bold px-8 py-4 rounded-xl text-sm hover:bg-lime-400 transition-all cursor-pointer">
          立即加入 →
        </button>
        <button onclick="showToast('播放場館介紹影片')" class="border border-white/20 text-white font-medium px-8 py-4 rounded-xl text-sm hover:bg-white/5 transition-all flex items-center gap-3 cursor-pointer">
          <span class="w-8 h-8 border border-white/30 rounded-full flex items-center justify-center">
            <svg width="12" height="12" fill="white" viewBox="0 0 16 16"><path d="M4 2l10 6-10 6V2z"/></svg>
          </span>
          場館導覽
        </button>
      </div>

      <!-- Stats -->
      <div class="flex flex-wrap gap-12 mt-16 pt-8 border-t border-white/10">
        <div>
          <div class="text-3xl font-black neon-text">3000+</div>
          <div class="text-white/40 text-sm mt-1">活躍會員</div>
        </div>
        <div>
          <div class="text-3xl font-black neon-text">50+</div>
          <div class="text-white/40 text-sm mt-1">專業教練</div>
        </div>
        <div>
          <div class="text-3xl font-black neon-text">24/7</div>
          <div class="text-white/40 text-sm mt-1">全天候開放</div>
        </div>
        <div>
          <div class="text-3xl font-black neon-text">2</div>
          <div class="text-white/40 text-sm mt-1">台北據點</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Features -->
<section id="features" class="py-24 lg:py-32 bg-dark-800">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16 reveal">
      <span class="neon-text text-xs font-bold tracking-widest uppercase mb-4 block">場館設施</span>
      <h2 class="text-3xl sm:text-4xl font-black tracking-tight">不妥協的<span class="neon-text">硬體配備</span></h2>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="feature-card bg-dark-900 rounded-2xl p-8 reveal">
        <div class="w-14 h-14 bg-neon-400/10 rounded-2xl flex items-center justify-center mb-6">
          <svg width="28" height="28" fill="none" stroke="#a3e635" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 12h12M4 8h2v8H4zM18 8h2v8h-2z"/></svg>
        </div>
        <h3 class="text-lg font-bold mb-3">自由重量區</h3>
        <p class="text-white/40 text-sm leading-relaxed">Rogue 全套器材，啞鈴 2-60kg、奧林匹克槓鈴、8 座深蹲架。</p>
      </div>
      <div class="feature-card bg-dark-900 rounded-2xl p-8 reveal">
        <div class="w-14 h-14 bg-neon-400/10 rounded-2xl flex items-center justify-center mb-6">
          <svg width="28" height="28" fill="none" stroke="#a3e635" stroke-width="1.5" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <h3 class="text-lg font-bold mb-3">有氧訓練區</h3>
        <p class="text-white/40 text-sm leading-relaxed">30 台跑步機、20 台飛輪、划船機、登階機，全配 Netflix 螢幕。</p>
      </div>
      <div class="feature-card bg-dark-900 rounded-2xl p-8 reveal">
        <div class="w-14 h-14 bg-neon-400/10 rounded-2xl flex items-center justify-center mb-6">
          <svg width="28" height="28" fill="none" stroke="#a3e635" stroke-width="1.5" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </div>
        <h3 class="text-lg font-bold mb-3">團體課教室</h3>
        <p class="text-white/40 text-sm leading-relaxed">200 坪隔音空間，每週 40+ 堂課，從 HIIT 到瑜伽應有盡有。</p>
      </div>
      <div class="feature-card bg-dark-900 rounded-2xl p-8 reveal">
        <div class="w-14 h-14 bg-neon-400/10 rounded-2xl flex items-center justify-center mb-6">
          <svg width="28" height="28" fill="none" stroke="#a3e635" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        </div>
        <h3 class="text-lg font-bold mb-3">運動恢復中心</h3>
        <p class="text-white/40 text-sm leading-relaxed">冷熱水池、三溫暖、筋膜放鬆區、運動按摩。訓練後的完整恢復。</p>
      </div>
      <div class="feature-card bg-dark-900 rounded-2xl p-8 reveal">
        <div class="w-14 h-14 bg-neon-400/10 rounded-2xl flex items-center justify-center mb-6">
          <svg width="28" height="28" fill="none" stroke="#a3e635" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        </div>
        <h3 class="text-lg font-bold mb-3">InBody 體脂檢測</h3>
        <p class="text-white/40 text-sm leading-relaxed">免費 InBody 570 檢測，科學追蹤肌肉量、體脂率、水份比例。</p>
      </div>
      <div class="feature-card bg-dark-900 rounded-2xl p-8 reveal">
        <div class="w-14 h-14 bg-neon-400/10 rounded-2xl flex items-center justify-center mb-6">
          <svg width="28" height="28" fill="none" stroke="#a3e635" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <h3 class="text-lg font-bold mb-3">智能門禁</h3>
        <p class="text-white/40 text-sm leading-relaxed">App 掃碼進場，24 小時不打烊。深夜、凌晨，你的時間你做主。</p>
      </div>
    </div>
  </div>
</section>

<!-- Class Schedule -->
<section id="schedule" class="py-24 lg:py-32">
  <div class="max-w-5xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-16 reveal">
      <span class="neon-text text-xs font-bold tracking-widest uppercase mb-4 block">本週課表</span>
      <h2 class="text-3xl sm:text-4xl font-black tracking-tight">每週 <span class="neon-text">40+</span> 堂團體課</h2>
    </div>

    <!-- Day Tabs -->
    <div class="flex gap-2 mb-8 overflow-x-auto pb-2">
      <button onclick="showDay('mon')" id="day-mon" class="neon-bg text-dark-900 text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap cursor-pointer">週一</button>
      <button onclick="showDay('tue')" id="day-tue" class="bg-white/5 text-white/60 text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors">週二</button>
      <button onclick="showDay('wed')" id="day-wed" class="bg-white/5 text-white/60 text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors">週三</button>
      <button onclick="showDay('thu')" id="day-thu" class="bg-white/5 text-white/60 text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors">週四</button>
      <button onclick="showDay('fri')" id="day-fri" class="bg-white/5 text-white/60 text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors">週五</button>
      <button onclick="showDay('sat')" id="day-sat" class="bg-white/5 text-white/60 text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors">週六</button>
      <button onclick="showDay('sun')" id="day-sun" class="bg-white/5 text-white/60 text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors">週日</button>
    </div>

    <!-- Schedule Table -->
    <div class="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
      <div class="grid grid-cols-12 gap-0 text-xs text-white/30 font-medium border-b border-white/5 px-6 py-3">
        <div class="col-span-2">時間</div>
        <div class="col-span-4">課程</div>
        <div class="col-span-3">教練</div>
        <div class="col-span-2">強度</div>
        <div class="col-span-1 text-right">名額</div>
      </div>

      <div id="schedule-content">
        <div class="schedule-row grid grid-cols-12 gap-0 items-center px-6 py-4 border-b border-white/5 cursor-pointer" onclick="showToast('已預約：晨間 HIIT 07:00')">
          <div class="col-span-2 text-sm font-medium">07:00</div>
          <div class="col-span-4"><span class="text-sm font-medium">晨間 HIIT</span><span class="text-xs text-white/30 ml-2">45 min</span></div>
          <div class="col-span-3 text-sm text-white/50">Coach Danny</div>
          <div class="col-span-2"><div class="flex gap-1"><span class="w-2 h-2 bg-neon-400 rounded-full"></span><span class="w-2 h-2 bg-neon-400 rounded-full"></span><span class="w-2 h-2 bg-neon-400 rounded-full"></span><span class="w-2 h-2 bg-white/10 rounded-full"></span></div></div>
          <div class="col-span-1 text-right"><span class="text-xs neon-text font-bold">8/20</span></div>
        </div>
        <div class="schedule-row grid grid-cols-12 gap-0 items-center px-6 py-4 border-b border-white/5 cursor-pointer" onclick="showToast('已預約：拳擊有氧 09:00')">
          <div class="col-span-2 text-sm font-medium">09:00</div>
          <div class="col-span-4"><span class="text-sm font-medium">拳擊有氧</span><span class="text-xs text-white/30 ml-2">50 min</span></div>
          <div class="col-span-3 text-sm text-white/50">Coach 小美</div>
          <div class="col-span-2"><div class="flex gap-1"><span class="w-2 h-2 bg-neon-400 rounded-full"></span><span class="w-2 h-2 bg-neon-400 rounded-full"></span><span class="w-2 h-2 bg-neon-400 rounded-full"></span><span class="w-2 h-2 bg-neon-400 rounded-full"></span></div></div>
          <div class="col-span-1 text-right"><span class="text-xs neon-text font-bold">5/15</span></div>
        </div>
        <div class="schedule-row grid grid-cols-12 gap-0 items-center px-6 py-4 border-b border-white/5 cursor-pointer" onclick="showToast('已預約：瑜伽流動 12:00')">
          <div class="col-span-2 text-sm font-medium">12:00</div>
          <div class="col-span-4"><span class="text-sm font-medium">瑜伽流動</span><span class="text-xs text-white/30 ml-2">60 min</span></div>
          <div class="col-span-3 text-sm text-white/50">Coach Yuki</div>
          <div class="col-span-2"><div class="flex gap-1"><span class="w-2 h-2 bg-neon-400 rounded-full"></span><span class="w-2 h-2 bg-white/10 rounded-full"></span><span class="w-2 h-2 bg-white/10 rounded-full"></span><span class="w-2 h-2 bg-white/10 rounded-full"></span></div></div>
          <div class="col-span-1 text-right"><span class="text-xs neon-text font-bold">12/25</span></div>
        </div>
        <div class="schedule-row grid grid-cols-12 gap-0 items-center px-6 py-4 border-b border-white/5 cursor-pointer" onclick="showToast('已預約：CrossFit 18:30')">
          <div class="col-span-2 text-sm font-medium">18:30</div>
          <div class="col-span-4"><span class="text-sm font-medium">CrossFit WOD</span><span class="text-xs text-white/30 ml-2">60 min</span></div>
          <div class="col-span-3 text-sm text-white/50">Coach 阿凱</div>
          <div class="col-span-2"><div class="flex gap-1"><span class="w-2 h-2 bg-neon-400 rounded-full"></span><span class="w-2 h-2 bg-neon-400 rounded-full"></span><span class="w-2 h-2 bg-neon-400 rounded-full"></span><span class="w-2 h-2 bg-neon-400 rounded-full"></span></div></div>
          <div class="col-span-1 text-right"><span class="text-xs text-red-400 font-bold">額滿</span></div>
        </div>
        <div class="schedule-row grid grid-cols-12 gap-0 items-center px-6 py-4 cursor-pointer" onclick="showToast('已預約：夜間飛輪 20:00')">
          <div class="col-span-2 text-sm font-medium">20:00</div>
          <div class="col-span-4"><span class="text-sm font-medium">夜間飛輪</span><span class="text-xs text-white/30 ml-2">45 min</span></div>
          <div class="col-span-3 text-sm text-white/50">Coach Danny</div>
          <div class="col-span-2"><div class="flex gap-1"><span class="w-2 h-2 bg-neon-400 rounded-full"></span><span class="w-2 h-2 bg-neon-400 rounded-full"></span><span class="w-2 h-2 bg-neon-400 rounded-full"></span><span class="w-2 h-2 bg-white/10 rounded-full"></span></div></div>
          <div class="col-span-1 text-right"><span class="text-xs neon-text font-bold">3/20</span></div>
        </div>
      </div>
    </div>

    <div class="text-center mt-6">
      <button onclick="showToast('完整課表已發送到您的 Email')" class="text-sm text-white/40 hover:text-white transition-colors underline cursor-pointer">查看完整週課表 →</button>
    </div>
  </div>
</section>

<!-- Trainers -->
<section id="trainers" class="py-24 lg:py-32 bg-dark-800">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-16 reveal">
      <span class="neon-text text-xs font-bold tracking-widest uppercase mb-4 block">專業教練團</span>
      <h2 class="text-3xl sm:text-4xl font-black tracking-tight">你的目標，<span class="neon-text">我們的使命</span></h2>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="trainer-card reveal">
        <div class="relative aspect-[3/4] bg-gradient-to-b from-white/5 to-white/[0.02] rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center mb-4">
          <span class="text-6xl font-black text-white/5">D</span>
          <div class="trainer-overlay absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-0 transition-all flex items-end p-6">
            <div class="flex gap-2">
              <button onclick="showToast('查看 Danny 的 IG')" class="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z"/></svg>
              </button>
              <button onclick="showToast('預約 Danny 的 1 對 1 教練課')" class="flex-1 bg-neon-400 text-dark-900 text-xs font-bold py-2 rounded-lg cursor-pointer">預約教練課</button>
            </div>
          </div>
        </div>
        <h4 class="font-bold text-sm">Coach Danny</h4>
        <p class="text-white/40 text-xs mb-1">肌力與體能 · HIIT · 飛輪</p>
        <p class="text-neon-400 text-[10px] font-bold">NSCA-CSCS · ACE-CPT</p>
      </div>

      <div class="trainer-card reveal">
        <div class="relative aspect-[3/4] bg-gradient-to-b from-white/5 to-white/[0.02] rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center mb-4">
          <span class="text-6xl font-black text-white/5">Y</span>
          <div class="trainer-overlay absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-0 transition-all flex items-end p-6">
            <div class="flex gap-2">
              <button onclick="showToast('查看 Yuki 的 IG')" class="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z"/></svg>
              </button>
              <button onclick="showToast('預約 Yuki 的 1 對 1 教練課')" class="flex-1 bg-neon-400 text-dark-900 text-xs font-bold py-2 rounded-lg cursor-pointer">預約教練課</button>
            </div>
          </div>
        </div>
        <h4 class="font-bold text-sm">Coach Yuki</h4>
        <p class="text-white/40 text-xs mb-1">瑜伽 · 皮拉提斯 · 伸展</p>
        <p class="text-neon-400 text-[10px] font-bold">RYT-500 · Stott Pilates</p>
      </div>

      <div class="trainer-card reveal">
        <div class="relative aspect-[3/4] bg-gradient-to-b from-white/5 to-white/[0.02] rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center mb-4">
          <span class="text-6xl font-black text-white/5">K</span>
          <div class="trainer-overlay absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-0 transition-all flex items-end p-6">
            <div class="flex gap-2">
              <button onclick="showToast('查看阿凱的 IG')" class="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z"/></svg>
              </button>
              <button onclick="showToast('預約阿凱的 1 對 1 教練課')" class="flex-1 bg-neon-400 text-dark-900 text-xs font-bold py-2 rounded-lg cursor-pointer">預約教練課</button>
            </div>
          </div>
        </div>
        <h4 class="font-bold text-sm">Coach 阿凱</h4>
        <p class="text-white/40 text-xs mb-1">CrossFit · 拳擊 · 功能性訓練</p>
        <p class="text-neon-400 text-[10px] font-bold">CrossFit L3 · NASM-CPT</p>
      </div>

      <div class="trainer-card reveal">
        <div class="relative aspect-[3/4] bg-gradient-to-b from-white/5 to-white/[0.02] rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center mb-4">
          <span class="text-6xl font-black text-white/5">M</span>
          <div class="trainer-overlay absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-0 transition-all flex items-end p-6">
            <div class="flex gap-2">
              <button onclick="showToast('查看小美的 IG')" class="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z"/></svg>
              </button>
              <button onclick="showToast('預約小美的 1 對 1 教練課')" class="flex-1 bg-neon-400 text-dark-900 text-xs font-bold py-2 rounded-lg cursor-pointer">預約教練課</button>
            </div>
          </div>
        </div>
        <h4 class="font-bold text-sm">Coach 小美</h4>
        <p class="text-white/40 text-xs mb-1">有氧 · 拳擊 · 體態雕塑</p>
        <p class="text-neon-400 text-[10px] font-bold">ACE-CPT · Les Mills</p>
      </div>
    </div>
  </div>
</section>

<!-- Pricing -->
<section id="pricing" class="py-24 lg:py-32">
  <div class="max-w-5xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-16 reveal">
      <span class="neon-text text-xs font-bold tracking-widest uppercase mb-4 block">會員方案</span>
      <h2 class="text-3xl sm:text-4xl font-black tracking-tight">選擇你的 <span class="neon-text">鍛造計畫</span></h2>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <!-- Basic -->
      <div class="pricing-card bg-white/[0.02] rounded-2xl p-8 reveal">
        <h3 class="font-bold text-lg mb-1">BASIC</h3>
        <p class="text-white/30 text-xs mb-6">適合自主訓練者</p>
        <div class="mb-6">
          <span class="text-4xl font-black">$1,280</span>
          <span class="text-white/30 text-sm"> /月</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-sm text-white/60"><svg width="16" height="16" fill="none" stroke="#a3e635" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>24/7 自由進出</li>
          <li class="flex items-center gap-3 text-sm text-white/60"><svg width="16" height="16" fill="none" stroke="#a3e635" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>全區域器材使用</li>
          <li class="flex items-center gap-3 text-sm text-white/60"><svg width="16" height="16" fill="none" stroke="#a3e635" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>InBody 月檢測</li>
          <li class="flex items-center gap-3 text-sm text-white/20"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>團體課程</li>
          <li class="flex items-center gap-3 text-sm text-white/20"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>恢復中心</li>
        </ul>
        <button onclick="showToast('已選擇 BASIC 方案，前往付款')" class="w-full py-3.5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/5 transition-all cursor-pointer">
          選擇方案
        </button>
      </div>

      <!-- Pro -->
      <div class="pricing-card pricing-popular bg-white/[0.03] rounded-2xl p-8 neon-glow reveal relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2">
          <span class="neon-bg text-dark-900 text-[10px] font-black px-4 py-1.5 rounded-full uppercase">最受歡迎</span>
        </div>
        <h3 class="font-bold text-lg mb-1">PRO</h3>
        <p class="text-white/30 text-xs mb-6">最完整的訓練體驗</p>
        <div class="mb-6">
          <span class="text-4xl font-black neon-text">$1,880</span>
          <span class="text-white/30 text-sm"> /月</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-sm text-white/60"><svg width="16" height="16" fill="none" stroke="#a3e635" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>BASIC 全部權益</li>
          <li class="flex items-center gap-3 text-sm text-white/60"><svg width="16" height="16" fill="none" stroke="#a3e635" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>無限團體課程</li>
          <li class="flex items-center gap-3 text-sm text-white/60"><svg width="16" height="16" fill="none" stroke="#a3e635" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>恢復中心使用</li>
          <li class="flex items-center gap-3 text-sm text-white/60"><svg width="16" height="16" fill="none" stroke="#a3e635" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>每月 1 堂私人教練</li>
          <li class="flex items-center gap-3 text-sm text-white/60"><svg width="16" height="16" fill="none" stroke="#a3e635" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>毛巾 & 置物櫃</li>
        </ul>
        <button onclick="showToast('🎉 已選擇 PRO 方案，7 天免費體驗開始！')" class="w-full py-3.5 neon-bg text-dark-900 rounded-xl text-sm font-black hover:bg-lime-400 transition-all cursor-pointer">
          免費體驗 7 天
        </button>
      </div>

      <!-- Elite -->
      <div class="pricing-card bg-white/[0.02] rounded-2xl p-8 reveal">
        <h3 class="font-bold text-lg mb-1">ELITE</h3>
        <p class="text-white/30 text-xs mb-6">極致的個人化訓練</p>
        <div class="mb-6">
          <span class="text-4xl font-black">$3,880</span>
          <span class="text-white/30 text-sm"> /月</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-sm text-white/60"><svg width="16" height="16" fill="none" stroke="#a3e635" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>PRO 全部權益</li>
          <li class="flex items-center gap-3 text-sm text-white/60"><svg width="16" height="16" fill="none" stroke="#a3e635" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>每週 2 堂私人教練</li>
          <li class="flex items-center gap-3 text-sm text-white/60"><svg width="16" height="16" fill="none" stroke="#a3e635" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>客製化訓練計畫</li>
          <li class="flex items-center gap-3 text-sm text-white/60"><svg width="16" height="16" fill="none" stroke="#a3e635" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>營養諮詢</li>
          <li class="flex items-center gap-3 text-sm text-white/60"><svg width="16" height="16" fill="none" stroke="#a3e635" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>雙館通行</li>
        </ul>
        <button onclick="showToast('已選擇 ELITE 方案，顧問將聯繫您')" class="w-full py-3.5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/5 transition-all cursor-pointer">
          選擇方案
        </button>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="py-24 lg:py-32 bg-dark-800 diagonal-stripe relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-r from-dark-800 via-transparent to-dark-800"></div>
  <div class="relative max-w-4xl mx-auto px-6 text-center">
    <h2 class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-6">
      停止觀望<br><span class="neon-text">開始行動</span>
    </h2>
    <p class="text-white/40 text-lg max-w-xl mx-auto mb-10">
      你的第一步，從 7 天免費體驗開始。沒有綁約，沒有壓力。
    </p>
    <button onclick="showToast('🔥 歡迎加入 FORGE！免費體驗已開通')" class="neon-bg text-dark-900 font-black px-12 py-5 rounded-xl text-base hover:bg-lime-400 transition-all cursor-pointer">
      立即免費體驗 →
    </button>
    <p class="text-white/20 text-xs mt-4">不需信用卡 · 隨時取消</p>
  </div>
</section>

<!-- Footer -->
<footer class="py-12 border-t border-white/5">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 neon-bg rounded-lg flex items-center justify-center">
            <svg width="16" height="16" fill="none" stroke="#0a0a0a" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 12h12M4 8h2v8H4zM18 8h2v8h-2z"/></svg>
          </div>
          <span class="font-black text-lg">FORGE</span>
        </div>
        <p class="text-white/30 text-sm">鍛造你的極限。</p>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-4">據點</h4>
        <ul class="space-y-2 text-sm text-white/40">
          <li>信義旗艦館 — 信義區松仁路 100 號 B1</li>
          <li>大安館 — 大安區復興南路一段 200 號 3F</li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-4">快速連結</h4>
        <ul class="space-y-2 text-sm text-white/40">
          <li><a href="#features" class="hover:text-white transition-colors">設施</a></li>
          <li><a href="#schedule" class="hover:text-white transition-colors">課表</a></li>
          <li><a href="#pricing" class="hover:text-white transition-colors">方案</a></li>
          <li><button onclick="showToast('徵才頁面即將推出')" class="hover:text-white transition-colors cursor-pointer">加入我們</button></li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-4">聯繫</h4>
        <ul class="space-y-2 text-sm text-white/40">
          <li>02-2720-8888</li>
          <li>hello@forge.fit</li>
        </ul>
        <div class="flex gap-3 mt-4">
          <button onclick="showToast('前往 Instagram @forge.fit')" class="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
            <svg width="14" height="14" fill="white" opacity="0.5" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z"/></svg>
          </button>
          <button onclick="showToast('前往 YouTube')" class="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
            <svg width="14" height="14" fill="white" opacity="0.5" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </button>
        </div>
      </div>
    </div>
    <div class="border-t border-white/5 pt-8 text-center">
      <p class="text-white/20 text-xs">© 2026 FORGE Fitness. All rights reserved.</p>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] opacity-0 pointer-events-none transition-all duration-300 translate-y-4">
  <div class="bg-neon-400 text-dark-900 px-6 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-2">
    <span>⚡</span>
    <span id="toast-text"></span>
  </div>
</div>

<script>
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-text').textContent = msg;
  t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; t.style.pointerEvents = 'auto';
  clearTimeout(window._t);
  window._t = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(16px)'; t.style.pointerEvents = 'none'; }, 2500);
}
window.addEventListener('scroll', () => { document.getElementById('navbar').classList.toggle('nav-scrolled', window.scrollY > 60); });
function toggleMobileMenu() { const m = document.getElementById('mobile-menu'); const o = m.classList.contains('hidden'); m.classList.toggle('hidden'); document.getElementById('menu-icon').classList.toggle('hidden', o); document.getElementById('close-icon').classList.toggle('hidden', !o); }
function closeMobileMenu() { document.getElementById('mobile-menu').classList.add('hidden'); document.getElementById('menu-icon').classList.remove('hidden'); document.getElementById('close-icon').classList.add('hidden'); }
document.querySelectorAll('a[href^="#"]').forEach(a => { a.addEventListener('click', function(e) { const t = this.getAttribute('href'); if (t === '#') return; e.preventDefault(); document.querySelector(t)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); });

// Day tabs (just visual toggle, content stays same for demo)
function showDay(day) {
  ['mon','tue','wed','thu','fri','sat','sun'].forEach(d => {
    const btn = document.getElementById('day-' + d);
    if (d === day) { btn.classList.add('neon-bg', 'text-dark-900'); btn.classList.remove('bg-white/5', 'text-white/60'); }
    else { btn.classList.remove('neon-bg', 'text-dark-900'); btn.classList.add('bg-white/5', 'text-white/60'); }
  });
  showToast('已切換至' + {mon:'週一',tue:'週二',wed:'週三',thu:'週四',fri:'週五',sat:'週六',sun:'週日'}[day] + '課表');
}

const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); }); }, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
</script>

</body>
</html>$HTML$,
  2
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content,
             version = EXCLUDED.version,
             updated_at = now();
