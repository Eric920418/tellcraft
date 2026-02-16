-- Template Preview: landing-corporate (Corporate Website)
-- 專業企業官網，穩重深藍配色，清晰資訊層次
-- Sections: Navigation, Hero, Services, About/Stats, Team, Contact, Footer

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'c38beab8-3209-483a-98c0-bf8695eb45cd',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nexus Consulting — 驅動商業卓越</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif']
      },
      colors: {
        navy: { 50: '#f0f4ff', 100: '#dbe4ff', 200: '#bac8ff', 300: '#91a7ff', 400: '#5c7cfa', 500: '#364fc7', 600: '#1e3a5f', 700: '#172b4d', 800: '#0f1f3a', 900: '#091428' },
        gold: { 400: '#f5c542', 500: '#d4a017' }
      }
    }
  }
}
</script>
<style>
  * { font-family: 'DM Sans', system-ui, sans-serif; }
  html { scroll-behavior: smooth; }
  body { overflow-x: hidden; }
  .font-serif { font-family: 'DM Serif Display', Georgia, serif; }

  .nav-scrolled {
    background: rgba(255,255,255,0.98) !important;
    backdrop-filter: blur(20px);
    box-shadow: 0 1px 0 rgba(0,0,0,0.06);
  }

  .reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  .reveal.active {
    opacity: 1;
    transform: translateY(0);
  }

  .service-card {
    transition: all 0.4s ease;
    border: 1px solid #e5e7eb;
  }
  .service-card:hover {
    border-color: #1e3a5f;
    box-shadow: 0 16px 48px rgba(30,58,95,0.08);
    transform: translateY(-4px);
  }
  .service-card:hover .service-num {
    color: #1e3a5f;
  }

  .team-card {
    transition: all 0.3s ease;
  }
  .team-card:hover {
    transform: translateY(-6px);
  }
  .team-card:hover .team-overlay {
    opacity: 1;
  }

  .stat-item {
    position: relative;
  }
  .stat-item::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 60%;
    background: rgba(255,255,255,0.2);
  }
  .stat-item:last-child::after { display: none; }

  .form-input {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s ease;
    outline: none;
    background: #f9fafb;
  }
  .form-input:focus {
    border-color: #1e3a5f;
    background: white;
    box-shadow: 0 0 0 3px rgba(30,58,95,0.08);
  }

  .subtle-grid {
    background-image: radial-gradient(circle, #e5e7eb 1px, transparent 1px);
    background-size: 32px 32px;
  }
</style>
</head>
<body class="bg-white text-gray-900 antialiased">

<!-- Navigation -->
<nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-transparent">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="flex items-center justify-between h-20">
      <a href="#" class="flex items-center gap-3">
        <div class="w-10 h-10 bg-navy-600 rounded-lg flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="font-bold text-lg text-navy-700">NEXUS</span>
      </a>

      <div class="hidden md:flex items-center gap-8">
        <a href="#services" class="text-sm font-medium text-gray-600 hover:text-navy-600 transition-colors">服務項目</a>
        <a href="#about" class="text-sm font-medium text-gray-600 hover:text-navy-600 transition-colors">關於我們</a>
        <a href="#team" class="text-sm font-medium text-gray-600 hover:text-navy-600 transition-colors">專業團隊</a>
        <a href="#contact" class="text-sm font-medium text-gray-600 hover:text-navy-600 transition-colors">聯絡我們</a>
      </div>

      <div class="hidden md:flex items-center gap-4">
        <button onclick="showToast('客戶入口即將開放')" class="text-sm font-medium text-gray-600 hover:text-navy-600 transition-colors cursor-pointer">客戶入口</button>
        <button onclick="showToast('已為您安排免費諮詢')" class="bg-navy-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-navy-700 transition-all cursor-pointer">免費諮詢</button>
      </div>

      <button onclick="toggleMobileMenu()" class="md:hidden p-2 cursor-pointer">
        <svg id="menu-icon" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg id="close-icon" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" class="hidden"><path d="M6 6l12 12M6 18L18 6"/></svg>
      </button>
    </div>
  </div>

  <div id="mobile-menu" class="md:hidden hidden bg-white border-t border-gray-100">
    <div class="px-6 py-4 space-y-3">
      <a href="#services" onclick="closeMobileMenu()" class="block text-gray-600 text-sm font-medium py-2">服務項目</a>
      <a href="#about" onclick="closeMobileMenu()" class="block text-gray-600 text-sm font-medium py-2">關於我們</a>
      <a href="#team" onclick="closeMobileMenu()" class="block text-gray-600 text-sm font-medium py-2">專業團隊</a>
      <a href="#contact" onclick="closeMobileMenu()" class="block text-gray-600 text-sm font-medium py-2">聯絡我們</a>
      <div class="pt-3 border-t border-gray-100">
        <button onclick="showToast('已為您安排免費諮詢')" class="w-full bg-navy-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg cursor-pointer">免費諮詢</button>
      </div>
    </div>
  </div>
</nav>

<!-- Hero Section -->
<section class="relative min-h-screen flex items-center bg-navy-900 overflow-hidden">
  <!-- Subtle pattern -->
  <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 40px 40px;"></div>
  <!-- Decorative shapes -->
  <div class="absolute top-0 right-0 w-1/3 h-full bg-navy-800 clip-diagonal hidden lg:block" style="clip-path: polygon(30% 0, 100% 0, 100% 100%, 0 100%);"></div>
  <div class="absolute bottom-0 left-0 w-64 h-64 border border-white/5 rounded-full -translate-x-1/2 translate-y-1/2"></div>
  <div class="absolute top-20 right-20 w-32 h-32 border border-white/5 rounded-full"></div>

  <div class="relative max-w-7xl mx-auto px-6 lg:px-8 py-32 lg:py-0 w-full">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div>
        <div class="inline-flex items-center gap-2 bg-white/10 text-white/70 text-xs font-medium px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
          <span class="w-2 h-2 bg-gold-400 rounded-full"></span>
          成立於 2008 年 · 深耕顧問服務 18 年
        </div>
        <h1 class="font-serif text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-8">
          驅動商業<br>
          <span class="text-gold-400">卓越成長</span>
        </h1>
        <p class="text-gray-400 text-lg max-w-xl mb-10 leading-relaxed">
          Nexus Consulting 為亞太區企業提供世界級的策略諮詢、數位轉型與組織優化服務。我們不只提出建議，更陪伴您落地執行。
        </p>
        <div class="flex flex-wrap gap-4">
          <button onclick="showToast('已為您安排免費策略諮詢')" class="bg-white text-navy-700 font-semibold px-8 py-4 rounded-lg text-sm hover:bg-gray-100 transition-all cursor-pointer">
            預約免費諮詢
          </button>
          <button onclick="showToast('下載公司簡介 PDF')" class="text-white border border-white/20 font-medium px-8 py-4 rounded-lg text-sm hover:bg-white/5 transition-all cursor-pointer">
            下載公司簡介
          </button>
        </div>
      </div>

      <!-- Hero Stats Card -->
      <div class="hidden lg:block">
        <div class="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8">
          <div class="grid grid-cols-2 gap-8">
            <div>
              <div class="text-gold-400 font-serif text-5xl mb-2">18+</div>
              <div class="text-gray-400 text-sm">年產業經驗</div>
            </div>
            <div>
              <div class="text-gold-400 font-serif text-5xl mb-2">500+</div>
              <div class="text-gray-400 text-sm">成功案例</div>
            </div>
            <div>
              <div class="text-gold-400 font-serif text-5xl mb-2">96%</div>
              <div class="text-gray-400 text-sm">客戶續約率</div>
            </div>
            <div>
              <div class="text-gold-400 font-serif text-5xl mb-2">$2B+</div>
              <div class="text-gray-400 text-sm">管理資產規模</div>
            </div>
          </div>
          <div class="mt-8 pt-6 border-t border-white/10">
            <div class="flex items-center gap-3">
              <div class="flex -space-x-2">
                <div class="w-8 h-8 rounded-full bg-navy-400 border-2 border-navy-800 flex items-center justify-center text-xs text-white font-bold">J</div>
                <div class="w-8 h-8 rounded-full bg-navy-300 border-2 border-navy-800 flex items-center justify-center text-xs text-navy-800 font-bold">K</div>
                <div class="w-8 h-8 rounded-full bg-gold-400 border-2 border-navy-800 flex items-center justify-center text-xs text-navy-800 font-bold">L</div>
              </div>
              <div class="text-gray-400 text-xs">
                <span class="text-white font-medium">120+ 專業顧問</span> 遍佈亞太
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Clients Strip -->
<section class="py-12 border-b border-gray-100 bg-gray-50">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <p class="text-center text-xs text-gray-400 font-medium mb-8 tracking-widest uppercase">受信賴的合作夥伴</p>
    <div class="flex flex-wrap justify-center items-center gap-x-16 gap-y-6 opacity-30">
      <span class="text-xl font-bold text-gray-500">TSMC</span>
      <span class="text-xl font-bold text-gray-500">Foxconn</span>
      <span class="text-xl font-bold text-gray-500">ASUS</span>
      <span class="text-xl font-bold text-gray-500">MediaTek</span>
      <span class="text-xl font-bold text-gray-500">Delta</span>
      <span class="text-xl font-bold text-gray-500">Acer</span>
    </div>
  </div>
</section>

<!-- Services Section -->
<section id="services" class="py-24 lg:py-32">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="grid lg:grid-cols-12 gap-16 items-start">
      <div class="lg:col-span-4 lg:sticky lg:top-28">
        <span class="text-xs font-semibold text-navy-600 tracking-widest uppercase mb-4 block">我們的服務</span>
        <h2 class="font-serif text-3xl sm:text-4xl mb-6">全方位<br>專業服務</h2>
        <p class="text-gray-500 text-sm leading-relaxed mb-8">
          從策略規劃到執行落地，我們的跨領域團隊為您提供端到端的解決方案，確保每個環節都達到最高標準。
        </p>
        <button onclick="showToast('已安排服務總監與您聯繫')" class="bg-navy-600 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-navy-700 transition-all cursor-pointer">
          了解更多 →
        </button>
      </div>

      <div class="lg:col-span-8 space-y-6">
        <!-- Service 1 -->
        <div class="service-card bg-white rounded-xl p-8 reveal">
          <div class="flex items-start gap-6">
            <span class="service-num text-5xl font-serif text-gray-200 transition-colors">01</span>
            <div class="flex-1">
              <h3 class="text-lg font-bold mb-3">企業策略諮詢</h3>
              <p class="text-gray-500 text-sm leading-relaxed mb-4">
                市場進入策略、競爭分析、業務模式創新。我們的策略團隊擁有平均 15 年的產業經驗，協助您做出精準的商業決策。
              </p>
              <div class="flex flex-wrap gap-2">
                <span class="text-xs bg-navy-50 text-navy-600 px-3 py-1 rounded-full">市場分析</span>
                <span class="text-xs bg-navy-50 text-navy-600 px-3 py-1 rounded-full">競爭策略</span>
                <span class="text-xs bg-navy-50 text-navy-600 px-3 py-1 rounded-full">商業模式</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Service 2 -->
        <div class="service-card bg-white rounded-xl p-8 reveal">
          <div class="flex items-start gap-6">
            <span class="service-num text-5xl font-serif text-gray-200 transition-colors">02</span>
            <div class="flex-1">
              <h3 class="text-lg font-bold mb-3">數位轉型</h3>
              <p class="text-gray-500 text-sm leading-relaxed mb-4">
                從技術架構評估到系統導入，幫助傳統企業擁抱數位化。我們不只導入工具，更重塑流程與組織文化。
              </p>
              <div class="flex flex-wrap gap-2">
                <span class="text-xs bg-navy-50 text-navy-600 px-3 py-1 rounded-full">雲端遷移</span>
                <span class="text-xs bg-navy-50 text-navy-600 px-3 py-1 rounded-full">流程優化</span>
                <span class="text-xs bg-navy-50 text-navy-600 px-3 py-1 rounded-full">AI 應用</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Service 3 -->
        <div class="service-card bg-white rounded-xl p-8 reveal">
          <div class="flex items-start gap-6">
            <span class="service-num text-5xl font-serif text-gray-200 transition-colors">03</span>
            <div class="flex-1">
              <h3 class="text-lg font-bold mb-3">組織優化與人才發展</h3>
              <p class="text-gray-500 text-sm leading-relaxed mb-4">
                組織架構重整、領導力培訓、績效管理體系設計。讓你的團隊發揮最大潛能，成為企業持續成長的引擎。
              </p>
              <div class="flex flex-wrap gap-2">
                <span class="text-xs bg-navy-50 text-navy-600 px-3 py-1 rounded-full">組織設計</span>
                <span class="text-xs bg-navy-50 text-navy-600 px-3 py-1 rounded-full">領導力</span>
                <span class="text-xs bg-navy-50 text-navy-600 px-3 py-1 rounded-full">人才策略</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Service 4 -->
        <div class="service-card bg-white rounded-xl p-8 reveal">
          <div class="flex items-start gap-6">
            <span class="service-num text-5xl font-serif text-gray-200 transition-colors">04</span>
            <div class="flex-1">
              <h3 class="text-lg font-bold mb-3">財務顧問與併購</h3>
              <p class="text-gray-500 text-sm leading-relaxed mb-4">
                盡職調查、企業估值、併購整合。我們的財務團隊已完成超過 200 筆交易，總規模超過 US$2B。
              </p>
              <div class="flex flex-wrap gap-2">
                <span class="text-xs bg-navy-50 text-navy-600 px-3 py-1 rounded-full">M&A</span>
                <span class="text-xs bg-navy-50 text-navy-600 px-3 py-1 rounded-full">盡職調查</span>
                <span class="text-xs bg-navy-50 text-navy-600 px-3 py-1 rounded-full">資本市場</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- About / Stats Section -->
<section id="about" class="py-24 lg:py-32 bg-navy-900 text-white overflow-hidden">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="grid lg:grid-cols-2 gap-16 items-center mb-20">
      <div>
        <span class="text-xs font-semibold text-gold-400 tracking-widest uppercase mb-4 block">關於 NEXUS</span>
        <h2 class="font-serif text-3xl sm:text-4xl mb-6 text-white">
          以人為本的<br>顧問哲學
        </h2>
        <p class="text-gray-400 text-base leading-relaxed mb-6">
          自 2008 年成立以來，Nexus Consulting 始終堅持一個信念：最好的策略不是紙上談兵，而是能被執行的策略。
        </p>
        <p class="text-gray-400 text-base leading-relaxed mb-8">
          我們的團隊由來自麥肯錫、BCG、高盛等頂尖機構的資深顧問組成，結合在地產業知識與全球視野，為客戶創造真正的商業價值。
        </p>
        <div class="flex gap-4">
          <button onclick="showToast('下載年度報告 PDF')" class="bg-white text-navy-700 font-semibold px-6 py-3 rounded-lg text-sm hover:bg-gray-100 transition-all cursor-pointer">下載年度報告</button>
          <button onclick="showToast('觀看品牌影片')" class="text-white border border-white/20 font-medium px-6 py-3 rounded-lg text-sm hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer">
            <svg width="16" height="16" fill="white" viewBox="0 0 16 16"><path d="M4 2l10 6-10 6V2z"/></svg>
            品牌影片
          </button>
        </div>
      </div>

      <!-- Values -->
      <div class="grid grid-cols-2 gap-6">
        <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
          <div class="w-12 h-12 bg-gold-400/10 rounded-lg flex items-center justify-center mb-4">
            <svg width="24" height="24" fill="none" stroke="#f5c542" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <h4 class="font-bold text-sm mb-2 text-white">策略深度</h4>
          <p class="text-gray-400 text-xs leading-relaxed">深入產業本質，不做表面文章</p>
        </div>
        <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
          <div class="w-12 h-12 bg-gold-400/10 rounded-lg flex items-center justify-center mb-4">
            <svg width="24" height="24" fill="none" stroke="#f5c542" stroke-width="1.5" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <h4 class="font-bold text-sm mb-2 text-white">以人為本</h4>
          <p class="text-gray-400 text-xs leading-relaxed">每個解方都考慮人的因素</p>
        </div>
        <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
          <div class="w-12 h-12 bg-gold-400/10 rounded-lg flex items-center justify-center mb-4">
            <svg width="24" height="24" fill="none" stroke="#f5c542" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h4 class="font-bold text-sm mb-2 text-white">結果導向</h4>
          <p class="text-gray-400 text-xs leading-relaxed">不只出報告，更陪伴到結果產出</p>
        </div>
        <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
          <div class="w-12 h-12 bg-gold-400/10 rounded-lg flex items-center justify-center mb-4">
            <svg width="24" height="24" fill="none" stroke="#f5c542" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h4 class="font-bold text-sm mb-2 text-white">全球視野</h4>
          <p class="text-gray-400 text-xs leading-relaxed">結合國際趨勢與在地洞察</p>
        </div>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div class="stat-item text-center">
          <div class="font-serif text-4xl text-gold-400 mb-2" id="stat-1">0</div>
          <div class="text-gray-400 text-sm">年產業經驗</div>
        </div>
        <div class="stat-item text-center">
          <div class="font-serif text-4xl text-gold-400 mb-2" id="stat-2">0</div>
          <div class="text-gray-400 text-sm">成功專案</div>
        </div>
        <div class="stat-item text-center">
          <div class="font-serif text-4xl text-gold-400 mb-2" id="stat-3">0%</div>
          <div class="text-gray-400 text-sm">客戶滿意度</div>
        </div>
        <div class="stat-item text-center">
          <div class="font-serif text-4xl text-gold-400 mb-2" id="stat-4">0+</div>
          <div class="text-gray-400 text-sm">專業顧問</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Team Section -->
<section id="team" class="py-24 lg:py-32">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <span class="text-xs font-semibold text-navy-600 tracking-widest uppercase mb-4 block">領導團隊</span>
      <h2 class="font-serif text-3xl sm:text-4xl mb-6">認識我們的核心團隊</h2>
      <p class="text-gray-500 text-base">來自全球頂尖機構的資深專業人士，為您的企業注入世界級的專業知識。</p>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <!-- Member 1 -->
      <div class="team-card text-center">
        <div class="relative mb-6 rounded-2xl overflow-hidden bg-gray-100 aspect-[3/4]">
          <div class="absolute inset-0 bg-gradient-to-b from-navy-600 to-navy-800 flex items-center justify-center">
            <span class="text-6xl font-serif text-white/30">張</span>
          </div>
          <div class="team-overlay absolute inset-0 bg-navy-900/60 backdrop-blur-sm opacity-0 transition-all flex items-end justify-center pb-6">
            <div class="flex gap-3">
              <button onclick="showToast('前往 LinkedIn')" class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer">
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/></svg>
              </button>
              <button onclick="showToast('發送 Email')" class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer">
                <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </button>
            </div>
          </div>
        </div>
        <h4 class="font-bold text-base mb-1">張文豪</h4>
        <p class="text-gray-500 text-sm mb-1">執行長 CEO</p>
        <p class="text-gray-400 text-xs">前 McKinsey 合夥人</p>
      </div>

      <!-- Member 2 -->
      <div class="team-card text-center">
        <div class="relative mb-6 rounded-2xl overflow-hidden bg-gray-100 aspect-[3/4]">
          <div class="absolute inset-0 bg-gradient-to-b from-navy-500 to-navy-700 flex items-center justify-center">
            <span class="text-6xl font-serif text-white/30">李</span>
          </div>
          <div class="team-overlay absolute inset-0 bg-navy-900/60 backdrop-blur-sm opacity-0 transition-all flex items-end justify-center pb-6">
            <div class="flex gap-3">
              <button onclick="showToast('前往 LinkedIn')" class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer">
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/></svg>
              </button>
              <button onclick="showToast('發送 Email')" class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer">
                <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </button>
            </div>
          </div>
        </div>
        <h4 class="font-bold text-base mb-1">李美玲</h4>
        <p class="text-gray-500 text-sm mb-1">策略長 CSO</p>
        <p class="text-gray-400 text-xs">前 BCG 資深顧問</p>
      </div>

      <!-- Member 3 -->
      <div class="team-card text-center">
        <div class="relative mb-6 rounded-2xl overflow-hidden bg-gray-100 aspect-[3/4]">
          <div class="absolute inset-0 bg-gradient-to-b from-navy-400 to-navy-600 flex items-center justify-center">
            <span class="text-6xl font-serif text-white/30">王</span>
          </div>
          <div class="team-overlay absolute inset-0 bg-navy-900/60 backdrop-blur-sm opacity-0 transition-all flex items-end justify-center pb-6">
            <div class="flex gap-3">
              <button onclick="showToast('前往 LinkedIn')" class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer">
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/></svg>
              </button>
              <button onclick="showToast('發送 Email')" class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer">
                <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </button>
            </div>
          </div>
        </div>
        <h4 class="font-bold text-base mb-1">王建華</h4>
        <p class="text-gray-500 text-sm mb-1">數位長 CDO</p>
        <p class="text-gray-400 text-xs">前 Google APAC Lead</p>
      </div>

      <!-- Member 4 -->
      <div class="team-card text-center">
        <div class="relative mb-6 rounded-2xl overflow-hidden bg-gray-100 aspect-[3/4]">
          <div class="absolute inset-0 bg-gradient-to-b from-navy-300 to-navy-500 flex items-center justify-center">
            <span class="text-6xl font-serif text-white/30">陳</span>
          </div>
          <div class="team-overlay absolute inset-0 bg-navy-900/60 backdrop-blur-sm opacity-0 transition-all flex items-end justify-center pb-6">
            <div class="flex gap-3">
              <button onclick="showToast('前往 LinkedIn')" class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer">
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/></svg>
              </button>
              <button onclick="showToast('發送 Email')" class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer">
                <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </button>
            </div>
          </div>
        </div>
        <h4 class="font-bold text-base mb-1">陳雅琪</h4>
        <p class="text-gray-500 text-sm mb-1">財務長 CFO</p>
        <p class="text-gray-400 text-xs">前 Goldman Sachs VP</p>
      </div>
    </div>
  </div>
</section>

<!-- Contact Section -->
<section id="contact" class="py-24 lg:py-32 bg-gray-50">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="grid lg:grid-cols-2 gap-16">
      <div>
        <span class="text-xs font-semibold text-navy-600 tracking-widest uppercase mb-4 block">聯絡我們</span>
        <h2 class="font-serif text-3xl sm:text-4xl mb-6">讓我們開始<br>合作吧</h2>
        <p class="text-gray-500 text-base leading-relaxed mb-10">
          無論您是需要策略諮詢、數位轉型還是組織優化，我們的團隊都準備好為您服務。填寫表單或直接聯繫我們。
        </p>

        <div class="space-y-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" fill="none" stroke="#1e3a5f" stroke-width="1.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div>
              <div class="font-semibold text-sm">台北總部</div>
              <div class="text-gray-500 text-sm">台北市信義區信義路五段 7 號 38F</div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" fill="none" stroke="#1e3a5f" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            </div>
            <div>
              <div class="font-semibold text-sm">電話</div>
              <div class="text-gray-500 text-sm">+886 2 8101 8888</div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" fill="none" stroke="#1e3a5f" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <div>
              <div class="font-semibold text-sm">Email</div>
              <div class="text-gray-500 text-sm">contact@nexusconsulting.tw</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Form -->
      <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <form id="contact-form" onsubmit="handleSubmit(event)">
          <div class="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">姓名 *</label>
              <input type="text" class="form-input" placeholder="您的姓名" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">公司名稱</label>
              <input type="text" class="form-input" placeholder="公司名稱">
            </div>
          </div>
          <div class="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input type="email" class="form-input" placeholder="you@company.com" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">電話</label>
              <input type="tel" class="form-input" placeholder="+886 9xx xxx xxx">
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">需求類型</label>
            <select class="form-input cursor-pointer" style="appearance: auto;">
              <option>策略諮詢</option>
              <option>數位轉型</option>
              <option>組織優化</option>
              <option>財務顧問</option>
              <option>其他</option>
            </select>
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">訊息 *</label>
            <textarea class="form-input" rows="4" placeholder="請簡述您的需求..." required style="resize: vertical;"></textarea>
          </div>
          <button type="submit" class="w-full bg-navy-600 text-white font-semibold py-3.5 rounded-lg hover:bg-navy-700 transition-all cursor-pointer text-sm">
            送出諮詢
          </button>
          <p class="text-xs text-gray-400 text-center mt-3">我們會在 1 個工作日內回覆您</p>
        </form>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-navy-900 text-gray-400 py-16">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
      <div>
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="text-white font-bold text-lg">NEXUS</span>
        </div>
        <p class="text-sm leading-relaxed">驅動亞太企業的卓越成長。</p>
      </div>
      <div>
        <h4 class="text-white font-semibold text-sm mb-4">服務</h4>
        <ul class="space-y-3 text-sm">
          <li><a href="#services" class="hover:text-white transition-colors cursor-pointer">企業策略</a></li>
          <li><a href="#services" class="hover:text-white transition-colors cursor-pointer">數位轉型</a></li>
          <li><a href="#services" class="hover:text-white transition-colors cursor-pointer">組織優化</a></li>
          <li><a href="#services" class="hover:text-white transition-colors cursor-pointer">財務顧問</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold text-sm mb-4">公司</h4>
        <ul class="space-y-3 text-sm">
          <li><a href="#about" class="hover:text-white transition-colors cursor-pointer">關於我們</a></li>
          <li><a href="#team" class="hover:text-white transition-colors cursor-pointer">團隊</a></li>
          <li><a href="#" onclick="showToast('徵才頁面即將推出')" class="hover:text-white transition-colors cursor-pointer">加入我們</a></li>
          <li><a href="#" onclick="showToast('新聞室即將推出')" class="hover:text-white transition-colors cursor-pointer">新聞室</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold text-sm mb-4">辦公室</h4>
        <ul class="space-y-3 text-sm">
          <li>台北（總部）</li>
          <li>上海</li>
          <li>新加坡</li>
          <li>東京</li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
      <p class="text-xs">© 2026 Nexus Consulting. All rights reserved.</p>
      <div class="flex gap-6">
        <a href="#" onclick="showToast('前往 LinkedIn')" class="hover:text-white transition-colors cursor-pointer">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
        <a href="#" onclick="showToast('前往 Twitter')" class="hover:text-white transition-colors cursor-pointer">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
      </div>
    </div>
  </div>
</footer>

<!-- Toast Notification -->
<div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] opacity-0 pointer-events-none transition-all duration-300 translate-y-4">
  <div class="bg-navy-800 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3">
    <svg width="18" height="18" fill="none" stroke="#f5c542" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
    <span id="toast-text">操作成功</span>
  </div>
</div>

<script>
// ========== Toast ==========
function showToast(message) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-text').textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  toast.style.pointerEvents = 'auto';
  clearTimeout(window._t);
  window._t = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(16px)';
    toast.style.pointerEvents = 'none';
  }, 2500);
}

// ========== Nav Scroll ==========
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('nav-scrolled', window.scrollY > 60);
});

// ========== Mobile Menu ==========
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const o = menu.classList.contains('hidden');
  menu.classList.toggle('hidden');
  document.getElementById('menu-icon').classList.toggle('hidden', o);
  document.getElementById('close-icon').classList.toggle('hidden', !o);
}
function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.add('hidden');
  document.getElementById('menu-icon').classList.remove('hidden');
  document.getElementById('close-icon').classList.add('hidden');
}

// ========== Smooth Scroll ==========
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const t = this.getAttribute('href');
    if (t === '#') return;
    e.preventDefault();
    const el = document.querySelector(t);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ========== Reveal on Scroll ==========
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('active');
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ========== Counter Animation ==========
const statsData = [
  { id: 'stat-1', target: 18, suffix: '' },
  { id: 'stat-2', target: 500, suffix: '+' },
  { id: 'stat-3', target: 96, suffix: '%' },
  { id: 'stat-4', target: 120, suffix: '+' }
];
let statsAnimated = false;
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !statsAnimated) {
      statsAnimated = true;
      statsData.forEach(item => {
        const el = document.getElementById(item.id);
        let current = 0;
        const step = Math.max(1, Math.floor(item.target / 60));
        const timer = setInterval(() => {
          current += step;
          if (current >= item.target) {
            current = item.target;
            clearInterval(timer);
          }
          el.textContent = current + item.suffix;
        }, 25);
      });
    }
  });
}, { threshold: 0.3 });
const statsSection = document.getElementById('stat-1');
if (statsSection) statsObserver.observe(statsSection.closest('.bg-white\\/5') || statsSection);

// ========== Form Submit ==========
function handleSubmit(e) {
  e.preventDefault();
  showToast('感謝您的諮詢！我們會在 1 個工作日內回覆');
  e.target.reset();
}
</script>

</body>
</html>$HTML$,
  2
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content,
             version = EXCLUDED.version,
             updated_at = now();
