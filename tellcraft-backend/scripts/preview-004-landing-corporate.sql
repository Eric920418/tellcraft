-- Template Preview: landing-corporate (Corporate Website) v3
-- 潤色：加入企業建築幾何線條 signature
-- Swap Test: 建築幾何線條 + 深海軍藍 + 金色點綴 = 一看就是企業顧問
-- Signature: 建築藍圖風格的幾何線條裝飾 + 結構化網格佈局

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
        gold: { 300: '#fcd34d', 400: '#f5c542', 500: '#d4a017', 600: '#b8860b' }
      }
    }
  }
}
</script>
<style>
  * { font-family: 'DM Sans', system-ui, sans-serif; }
  .font-serif { font-family: 'DM Serif Display', Georgia, serif; }
  html { scroll-behavior: smooth; }
  body { overflow-x: hidden; }

  /* ===== SIGNATURE: 建築幾何線條 ===== */
  .blueprint-grid {
    background-image:
      linear-gradient(rgba(30,58,95,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(30,58,95,0.06) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .geo-line {
    position: absolute;
    background: linear-gradient(90deg, transparent, rgba(30,58,95,0.15), transparent);
    height: 1px;
  }

  .geo-corner {
    position: absolute;
    width: 40px;
    height: 40px;
    border: 1px solid rgba(30,58,95,0.12);
  }
  .geo-corner-tl { border-right: none; border-bottom: none; }
  .geo-corner-tr { border-left: none; border-bottom: none; }
  .geo-corner-bl { border-right: none; border-top: none; }
  .geo-corner-br { border-left: none; border-top: none; }

  .architect-line {
    stroke-dasharray: 8 4;
    animation: dash-flow 20s linear infinite;
  }
  @keyframes dash-flow {
    to { stroke-dashoffset: -240; }
  }

  /* ===== 金色分隔線 ===== */
  .gold-divider {
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, #d4a017, #f5c542);
  }

  /* ===== 導航 ===== */
  .nav-scrolled {
    background: rgba(255,255,255,0.98) !important;
    backdrop-filter: blur(20px);
    box-shadow: 0 1px 0 rgba(0,0,0,0.06);
  }

  /* ===== 卡片 ===== */
  .service-card {
    transition: all 0.4s ease;
    border: 1px solid #e5e7eb;
    position: relative;
    overflow: hidden;
  }
  .service-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 0;
    background: linear-gradient(to bottom, #d4a017, #1e3a5f);
    transition: height 0.4s ease;
  }
  .service-card:hover {
    border-color: #1e3a5f;
    box-shadow: 0 8px 30px rgba(30,58,95,0.08);
    transform: translateY(-4px);
  }
  .service-card:hover::before {
    height: 100%;
  }

  /* ===== 入場 ===== */
  .reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .reveal.visible { opacity: 1; transform: none; }

  /* ===== 數字計數 ===== */
  .stat-value {
    transition: color 0.3s ease;
  }
  .stat-value:hover {
    color: #d4a017;
  }
</style>
</head>
<body class="bg-white text-gray-900 antialiased">

<!-- Navigation -->
<nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="flex items-center justify-between h-20">
      <a href="#" class="flex items-center gap-3">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <!-- 建築幾何 Logo -->
          <rect x="2" y="2" width="32" height="32" rx="4" fill="#1e3a5f"/>
          <path d="M10 28V12l8-6 8 6v16" stroke="#d4a017" stroke-width="1.5" fill="none"/>
          <rect x="15" y="18" width="6" height="10" fill="#d4a017" opacity="0.3"/>
          <line x1="18" y1="6" x2="18" y2="28" stroke="#d4a017" stroke-width="0.5" opacity="0.4"/>
        </svg>
        <div>
          <span class="text-lg font-bold text-navy-700 tracking-tight">NEXUS</span>
          <span class="block text-[9px] text-navy-400 tracking-[0.3em] uppercase">Consulting Group</span>
        </div>
      </a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#services" class="text-sm text-gray-600 hover:text-navy-700 transition-colors font-medium">服務項目</a>
        <a href="#about" class="text-sm text-gray-600 hover:text-navy-700 transition-colors font-medium">關於我們</a>
        <a href="#team" class="text-sm text-gray-600 hover:text-navy-700 transition-colors font-medium">專業團隊</a>
        <a href="#contact" class="text-sm text-gray-600 hover:text-navy-700 transition-colors font-medium">聯繫我們</a>
      </div>
      <button onclick="showToast('專人將於 1 個工作天內與您聯繫')" class="hidden md:block text-sm font-semibold px-6 py-2.5 bg-navy-700 text-white rounded-lg hover:bg-navy-800 transition-colors cursor-pointer">
        免費諮詢
      </button>
      <button onclick="toggleMobileMenu()" class="md:hidden p-2 cursor-pointer">
        <svg id="menu-icon" width="24" height="24" fill="none" stroke="#172b4d" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg id="close-icon" width="24" height="24" fill="none" stroke="#172b4d" stroke-width="2" class="hidden"><path d="M6 6l12 12M6 18L18 6"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="md:hidden hidden bg-white border-t border-gray-100">
    <div class="px-6 py-4 space-y-3">
      <a href="#services" onclick="closeMobileMenu()" class="block text-sm font-medium py-2">服務項目</a>
      <a href="#about" onclick="closeMobileMenu()" class="block text-sm font-medium py-2">關於我們</a>
      <a href="#team" onclick="closeMobileMenu()" class="block text-sm font-medium py-2">專業團隊</a>
      <a href="#contact" onclick="closeMobileMenu()" class="block text-sm font-medium py-2">聯繫我們</a>
    </div>
  </div>
</nav>

<!-- Hero: 建築風格 + 幾何線條 -->
<section class="relative pt-32 pb-24 lg:pt-40 lg:pb-32 bg-navy-800 overflow-hidden">
  <!-- SIGNATURE: 建築幾何線條背景 -->
  <svg class="absolute inset-0 w-full h-full" fill="none" preserveAspectRatio="none">
    <!-- 水平線 -->
    <line x1="0" y1="30%" x2="100%" y2="30%" class="architect-line" stroke="rgba(212,160,23,0.1)" stroke-width="1"/>
    <line x1="0" y1="60%" x2="100%" y2="60%" class="architect-line" stroke="rgba(212,160,23,0.08)" stroke-width="1"/>
    <line x1="0" y1="85%" x2="100%" y2="85%" class="architect-line" stroke="rgba(212,160,23,0.06)" stroke-width="1"/>
    <!-- 垂直線 -->
    <line x1="20%" y1="0" x2="20%" y2="100%" class="architect-line" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    <line x1="50%" y1="0" x2="50%" y2="100%" class="architect-line" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    <line x1="80%" y1="0" x2="80%" y2="100%" class="architect-line" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    <!-- 對角線裝飾 -->
    <line x1="0" y1="100%" x2="40%" y2="0" stroke="rgba(212,160,23,0.05)" stroke-width="1"/>
    <line x1="60%" y1="100%" x2="100%" y2="0" stroke="rgba(212,160,23,0.05)" stroke-width="1"/>
  </svg>

  <!-- 幾何角落裝飾 -->
  <div class="geo-corner geo-corner-tl absolute top-24 left-12 opacity-20" style="border-color: #d4a017;"></div>
  <div class="geo-corner geo-corner-br absolute bottom-12 right-12 opacity-20" style="border-color: #d4a017;"></div>

  <div class="relative max-w-7xl mx-auto px-6 lg:px-8">
    <div class="max-w-3xl">
      <div class="gold-divider mb-8"></div>
      <h1 class="font-serif text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6">
        建構企業的<br>
        <span class="text-gold-400">下一個十年</span>
      </h1>
      <p class="text-lg text-navy-200 max-w-xl mb-10 leading-relaxed">
        Nexus 顧問集團深耕亞太市場 25 年。我們以數據驅動策略、跨領域整合能力，協助企業在變動中找到成長的結構力。
      </p>
      <div class="flex flex-wrap gap-4">
        <button onclick="showToast('免費諮詢已預約，顧問將於 1 個工作天內聯繫您')" class="px-8 py-4 bg-gold-500 text-navy-900 font-semibold rounded-lg hover:bg-gold-400 transition-all cursor-pointer">
          預約免費諮詢
        </button>
        <a href="#services" class="flex items-center gap-2 px-6 py-4 text-white/80 font-medium hover:text-white transition-colors">
          了解我們的服務
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h8M9 4l4 4-4 4"/></svg>
        </a>
      </div>

      <!-- 客戶 Logo 條 -->
      <div class="mt-16 pt-8 border-t border-white/10">
        <p class="text-xs text-navy-300 mb-6 tracking-wider uppercase">服務超過 200 家企業客戶</p>
        <div class="flex flex-wrap gap-x-12 gap-y-4 opacity-30">
          <span class="text-lg font-bold text-white tracking-tight">TSMC</span>
          <span class="text-lg font-bold text-white tracking-tight">Cathay</span>
          <span class="text-lg font-bold text-white tracking-tight">Foxconn</span>
          <span class="text-lg font-bold text-white tracking-tight">Acer</span>
          <span class="text-lg font-bold text-white tracking-tight">Delta</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Stats Bar -->
<section class="bg-white py-12 border-b border-gray-100">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
      <div>
        <div class="font-serif text-4xl text-navy-700 stat-value cursor-default">25+</div>
        <div class="text-sm text-gray-500 mt-1">年專業經驗</div>
      </div>
      <div>
        <div class="font-serif text-4xl text-navy-700 stat-value cursor-default">200+</div>
        <div class="text-sm text-gray-500 mt-1">企業客戶</div>
      </div>
      <div>
        <div class="font-serif text-4xl text-navy-700 stat-value cursor-default">$12B</div>
        <div class="text-sm text-gray-500 mt-1">管理資產總額</div>
      </div>
      <div>
        <div class="font-serif text-4xl text-navy-700 stat-value cursor-default">96%</div>
        <div class="text-sm text-gray-500 mt-1">客戶續約率</div>
      </div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-24 lg:py-32 blueprint-grid">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="max-w-xl mb-16 reveal">
      <div class="gold-divider mb-6"></div>
      <h2 class="font-serif text-3xl lg:text-4xl text-navy-800 mb-4">服務項目</h2>
      <p class="text-gray-500 leading-relaxed">我們提供全方位的策略顧問服務，從戰略規劃到執行落地，陪伴企業走過每一個關鍵轉折。</p>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="service-card rounded-xl p-8 bg-white reveal cursor-pointer" onclick="showToast('策略顧問：與合夥人進行初步討論')">
        <div class="w-12 h-12 rounded-lg bg-navy-50 flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="1.5">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-navy-800 mb-3">策略顧問</h3>
        <p class="text-sm text-gray-500 leading-relaxed">市場進入策略、競爭分析、商業模式設計。用結構化方法論拆解複雜問題。</p>
      </div>

      <div class="service-card rounded-xl p-8 bg-white reveal cursor-pointer" onclick="showToast('數位轉型：安排需求訪談')">
        <div class="w-12 h-12 rounded-lg bg-gold-300/20 flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-navy-800 mb-3">數位轉型</h3>
        <p class="text-sm text-gray-500 leading-relaxed">流程數位化、系統整合、AI 策略導入。讓技術成為競爭優勢而非成本中心。</p>
      </div>

      <div class="service-card rounded-xl p-8 bg-white reveal cursor-pointer" onclick="showToast('財務諮詢：安排初步評估')">
        <div class="w-12 h-12 rounded-lg bg-navy-50 flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="1.5">
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-navy-800 mb-3">財務諮詢</h3>
        <p class="text-sm text-gray-500 leading-relaxed">M&A 交易諮詢、估值分析、財務重組。幫助企業在關鍵時刻做出最優決策。</p>
      </div>

      <div class="service-card rounded-xl p-8 bg-white reveal cursor-pointer" onclick="showToast('人才策略：安排組織診斷')">
        <div class="w-12 h-12 rounded-lg bg-gold-300/20 flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-navy-800 mb-3">人才策略</h3>
        <p class="text-sm text-gray-500 leading-relaxed">組織設計、領導力發展、薪酬規劃。打造高績效組織的人才引擎。</p>
      </div>

      <div class="service-card rounded-xl p-8 bg-white reveal cursor-pointer" onclick="showToast('風險管理：安排風險評估')">
        <div class="w-12 h-12 rounded-lg bg-navy-50 flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-navy-800 mb-3">風險管理</h3>
        <p class="text-sm text-gray-500 leading-relaxed">合規審查、內控建置、風險量化。在不確定的環境中建立確定性。</p>
      </div>

      <div class="service-card rounded-xl p-8 bg-white reveal cursor-pointer" onclick="showToast('ESG 永續：安排永續策略工作坊')">
        <div class="w-12 h-12 rounded-lg bg-gold-300/20 flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-navy-800 mb-3">ESG 永續</h3>
        <p class="text-sm text-gray-500 leading-relaxed">永續報告、碳盤查、ESG 策略藍圖。讓永續不只是報告，而是競爭力。</p>
      </div>
    </div>
  </div>
</section>

<!-- About -->
<section id="about" class="py-24 lg:py-32 bg-navy-800 relative overflow-hidden">
  <!-- 幾何線條裝飾 -->
  <svg class="absolute inset-0 w-full h-full" fill="none">
    <line x1="10%" y1="0" x2="10%" y2="100%" stroke="rgba(212,160,23,0.06)" stroke-width="1"/>
    <line x1="90%" y1="0" x2="90%" y2="100%" stroke="rgba(212,160,23,0.06)" stroke-width="1"/>
  </svg>

  <div class="relative max-w-7xl mx-auto px-6 lg:px-8">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div class="reveal">
        <div class="gold-divider mb-6"></div>
        <h2 class="font-serif text-3xl lg:text-4xl text-white mb-6">為什麼選擇 Nexus</h2>
        <p class="text-navy-200 leading-relaxed mb-8">
          25 年來，我們與超過 200 家企業並肩作戰。我們不做空泛的建議——每一個策略，都有清晰的執行路徑和可衡量的成果。
        </p>
        <div class="space-y-6">
          <div class="flex gap-4">
            <div class="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" fill="none" stroke="#d4a017" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <div class="text-white font-semibold mb-1">數據驅動決策</div>
              <div class="text-sm text-navy-300">每一個建議都有數據支撐，不靠直覺或經驗法則。</div>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" fill="none" stroke="#d4a017" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <div class="text-white font-semibold mb-1">深度產業理解</div>
              <div class="text-sm text-navy-300">顧問團隊具備平均 15 年產業經驗，不只懂理論。</div>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" fill="none" stroke="#d4a017" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <div class="text-white font-semibold mb-1">從策略到落地</div>
              <div class="text-sm text-navy-300">不做做完就走的報告，陪伴執行直到看見成果。</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側：建築幾何視覺 -->
      <div class="reveal">
        <div class="relative aspect-square max-w-md mx-auto">
          <svg viewBox="0 0 400 400" class="w-full h-full" fill="none">
            <!-- 建築幾何圖形 -->
            <rect x="50" y="50" width="300" height="300" stroke="#d4a017" stroke-width="0.5" opacity="0.2"/>
            <rect x="80" y="80" width="240" height="240" stroke="#d4a017" stroke-width="0.5" opacity="0.15"/>
            <rect x="110" y="110" width="180" height="180" stroke="#d4a017" stroke-width="0.5" opacity="0.1"/>
            <!-- 建築物剪影 -->
            <rect x="140" y="160" width="40" height="130" fill="rgba(212,160,23,0.15)"/>
            <rect x="190" y="120" width="50" height="170" fill="rgba(212,160,23,0.1)"/>
            <rect x="250" y="180" width="35" height="110" fill="rgba(212,160,23,0.12)"/>
            <!-- 對角線 -->
            <line x1="50" y1="50" x2="350" y2="350" stroke="#d4a017" stroke-width="0.5" opacity="0.1"/>
            <line x1="350" y1="50" x2="50" y2="350" stroke="#d4a017" stroke-width="0.5" opacity="0.1"/>
            <!-- 圓弧 -->
            <circle cx="200" cy="200" r="130" stroke="#d4a017" stroke-width="0.5" opacity="0.08"/>
            <!-- 中心文字 -->
            <text x="200" y="370" text-anchor="middle" fill="#d4a017" font-size="11" font-family="DM Sans" opacity="0.4">NEXUS · SINCE 2001</text>
          </svg>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Team -->
<section id="team" class="py-24 lg:py-32 blueprint-grid">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="max-w-xl mb-16 reveal">
      <div class="gold-divider mb-6"></div>
      <h2 class="font-serif text-3xl lg:text-4xl text-navy-800 mb-4">領導團隊</h2>
      <p class="text-gray-500 leading-relaxed">來自頂尖企業與顧問公司的資深夥伴，為您的企業注入洞見與行動力。</p>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <div class="reveal cursor-pointer" onclick="showToast('查看陳合夥人完整經歷')">
        <div class="aspect-[3/4] rounded-xl bg-gradient-to-br from-navy-100 to-navy-200 mb-4 flex items-center justify-center overflow-hidden relative group">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="1"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 10-16 0"/></svg>
          <div class="absolute inset-0 bg-navy-800/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span class="text-white text-sm font-medium">查看經歷 →</span>
          </div>
        </div>
        <h3 class="font-bold text-navy-800">陳建宏</h3>
        <p class="text-sm text-gray-500">管理合夥人</p>
        <p class="text-xs text-gold-500 mt-1">McKinsey · 20 年經驗</p>
      </div>

      <div class="reveal cursor-pointer" onclick="showToast('查看林合夥人完整經歷')">
        <div class="aspect-[3/4] rounded-xl bg-gradient-to-br from-navy-100 to-navy-200 mb-4 flex items-center justify-center overflow-hidden relative group">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="1"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 10-16 0"/></svg>
          <div class="absolute inset-0 bg-navy-800/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span class="text-white text-sm font-medium">查看經歷 →</span>
          </div>
        </div>
        <h3 class="font-bold text-navy-800">林雅琪</h3>
        <p class="text-sm text-gray-500">數位轉型負責人</p>
        <p class="text-xs text-gold-500 mt-1">Google · 15 年經驗</p>
      </div>

      <div class="reveal cursor-pointer" onclick="showToast('查看張合夥人完整經歷')">
        <div class="aspect-[3/4] rounded-xl bg-gradient-to-br from-navy-100 to-navy-200 mb-4 flex items-center justify-center overflow-hidden relative group">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="1"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 10-16 0"/></svg>
          <div class="absolute inset-0 bg-navy-800/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span class="text-white text-sm font-medium">查看經歷 →</span>
          </div>
        </div>
        <h3 class="font-bold text-navy-800">張明德</h3>
        <p class="text-sm text-gray-500">財務諮詢負責人</p>
        <p class="text-xs text-gold-500 mt-1">Goldman Sachs · 18 年經驗</p>
      </div>

      <div class="reveal cursor-pointer" onclick="showToast('查看王合夥人完整經歷')">
        <div class="aspect-[3/4] rounded-xl bg-gradient-to-br from-navy-100 to-navy-200 mb-4 flex items-center justify-center overflow-hidden relative group">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="1"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 10-16 0"/></svg>
          <div class="absolute inset-0 bg-navy-800/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span class="text-white text-sm font-medium">查看經歷 →</span>
          </div>
        </div>
        <h3 class="font-bold text-navy-800">王淑芬</h3>
        <p class="text-sm text-gray-500">ESG 永續負責人</p>
        <p class="text-xs text-gold-500 mt-1">Deloitte · 12 年經驗</p>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-24 lg:py-32">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="grid lg:grid-cols-2 gap-16">
      <div class="reveal">
        <div class="gold-divider mb-6"></div>
        <h2 class="font-serif text-3xl lg:text-4xl text-navy-800 mb-6">讓我們聊聊</h2>
        <p class="text-gray-500 leading-relaxed mb-8">
          無論您正在思考什麼企業挑戰，我們都樂意傾聽。第一次諮詢完全免費。
        </p>

        <div class="space-y-6">
          <div class="flex gap-4">
            <div class="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <div class="font-semibold text-navy-800">台北總部</div>
              <div class="text-sm text-gray-500">台北市信義區松仁路 100 號 28 樓</div>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            </div>
            <div>
              <div class="font-semibold text-navy-800">電話</div>
              <div class="text-sm text-gray-500">+886 2-8780-6600</div>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
            </div>
            <div>
              <div class="font-semibold text-navy-800">Email</div>
              <div class="text-sm text-gray-500">contact@nexus-consulting.com</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 聯繫表單 -->
      <div class="reveal">
        <div class="bg-gray-50 rounded-2xl p-8 border border-gray-100">
          <h3 class="text-lg font-bold text-navy-800 mb-6">預約免費諮詢</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">公司名稱</label>
              <input type="text" placeholder="例：台積電" class="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy-400 transition-colors">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">聯絡人</label>
              <input type="text" placeholder="您的姓名" class="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy-400 transition-colors">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" placeholder="email@company.com" class="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy-400 transition-colors">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">需求概述</label>
              <textarea rows="3" placeholder="簡述您的挑戰或需求..." class="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy-400 transition-colors resize-none"></textarea>
            </div>
            <button onclick="showToast('感謝您的諮詢！我們將於 1 個工作天內與您聯繫')" class="w-full py-3.5 bg-navy-700 text-white font-semibold rounded-lg hover:bg-navy-800 transition-colors cursor-pointer">
              送出諮詢
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-navy-900 text-navy-300 py-16">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none"><rect x="2" y="2" width="32" height="32" rx="4" fill="#1e3a5f"/><path d="M10 28V12l8-6 8 6v16" stroke="#d4a017" stroke-width="1.5" fill="none"/></svg>
          <span class="text-white font-bold">NEXUS</span>
        </div>
        <p class="text-sm leading-relaxed">驅動商業卓越，建構企業的下一個十年。</p>
      </div>
      <div>
        <h4 class="text-white font-semibold text-sm mb-4">服務</h4>
        <ul class="space-y-3 text-sm">
          <li><a href="#services" class="hover:text-white transition-colors">策略顧問</a></li>
          <li><a href="#services" class="hover:text-white transition-colors">數位轉型</a></li>
          <li><a href="#services" class="hover:text-white transition-colors">財務諮詢</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold text-sm mb-4">公司</h4>
        <ul class="space-y-3 text-sm">
          <li><a href="#about" class="hover:text-white transition-colors">關於我們</a></li>
          <li><a href="#team" class="hover:text-white transition-colors">團隊</a></li>
          <li><a href="#" onclick="showToast('徵才頁面即將上線')" class="hover:text-white transition-colors cursor-pointer">加入我們</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold text-sm mb-4">據點</h4>
        <ul class="space-y-3 text-sm">
          <li>台北（總部）</li>
          <li>新加坡</li>
          <li>東京</li>
        </ul>
      </div>
    </div>
    <div class="border-t border-navy-800 pt-8 text-center text-xs">
      © 2026 Nexus Consulting Group. All rights reserved.
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] opacity-0 pointer-events-none transition-all duration-300 translate-y-4">
  <div class="bg-navy-900 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3">
    <svg width="16" height="16" fill="none" stroke="#d4a017" stroke-width="2.5"><path d="M3 8l3 3 7-7"/></svg>
    <span id="toast-text">操作成功</span>
  </div>
</div>

<script>
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-text').textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  t.style.pointerEvents = 'auto';
  clearTimeout(window._tt);
  window._tt = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(16px)';
    t.style.pointerEvents = 'none';
  }, 2500);
}

const nav = document.getElementById('navbar');
window.addEventListener('scroll', () => nav.classList.toggle('nav-scrolled', window.scrollY > 60));

function toggleMobileMenu() {
  const m = document.getElementById('mobile-menu');
  const mi = document.getElementById('menu-icon');
  const ci = document.getElementById('close-icon');
  const open = m.classList.contains('hidden');
  m.classList.toggle('hidden', !open);
  mi.classList.toggle('hidden', open);
  ci.classList.toggle('hidden', !open);
}
function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.add('hidden');
  document.getElementById('menu-icon').classList.remove('hidden');
  document.getElementById('close-icon').classList.add('hidden');
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const t = this.getAttribute('href');
    if (t === '#') return;
    e.preventDefault();
    document.querySelector(t)?.scrollIntoView({ behavior: 'smooth' });
  });
});

const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
</script>

</body>
</html>$HTML$,
  3
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content,
             version = EXCLUDED.version,
             updated_at = now();
