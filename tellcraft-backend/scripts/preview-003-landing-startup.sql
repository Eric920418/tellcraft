-- Template Preview: landing-startup (Startup Landing Page) v3
-- 潤色：加入代碼終端風格 hero 動畫 signature
-- Swap Test: 終端打字動畫 + 代碼語法高亮 + 開發者美學 = 一看就是科技新創
-- Signature: Hero 區域的程式碼終端自動打字 + 語法高亮

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'd772938c-fd0e-4aa4-a88e-c079b0c9e82c',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Launchly — 讓你的產品飛速起跑</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        brand: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c' },
        accent: { 400: '#f472b6', 500: '#ec4899', 600: '#db2777' },
        terminal: { bg: '#0f1117', header: '#1a1d27', text: '#a0aec0', green: '#4ade80', blue: '#60a5fa', purple: '#c084fc', orange: '#fb923c', pink: '#f472b6' }
      }
    }
  }
}
</script>
<style>
  * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  .font-mono { font-family: 'JetBrains Mono', monospace; }
  html { scroll-behavior: smooth; }
  body { overflow-x: hidden; }

  .gradient-hero {
    background: linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%);
  }
  .gradient-text {
    background: linear-gradient(135deg, #f97316, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .gradient-btn {
    background: linear-gradient(135deg, #f97316, #ec4899);
    transition: all 0.3s ease;
  }
  .gradient-btn:hover {
    background: linear-gradient(135deg, #ea580c, #db2777);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(249, 115, 22, 0.35);
  }

  /* ===== SIGNATURE: 終端打字動畫 ===== */
  .terminal-cursor {
    display: inline-block;
    width: 8px;
    height: 16px;
    background: #4ade80;
    animation: blink 1s step-end infinite;
    vertical-align: middle;
    margin-left: 2px;
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  .typing-line {
    opacity: 0;
    transform: translateX(-8px);
    animation: type-in 0.3s ease forwards;
  }

  @keyframes type-in {
    to { opacity: 1; transform: translateX(0); }
  }

  .terminal-glow {
    box-shadow: 0 0 80px rgba(249,115,22,0.15), 0 20px 60px rgba(0,0,0,0.3);
  }

  /* ===== 卡片 ===== */
  .card-hover {
    transition: all 0.3s ease;
  }
  .card-hover:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
  }
  .feature-icon {
    transition: all 0.3s ease;
  }
  .card-hover:hover .feature-icon {
    transform: scale(1.1) rotate(5deg);
  }

  /* ===== 動畫 ===== */
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up { animation: fade-in-up 0.8s ease forwards; }
  .animate-delay-1 { animation-delay: 0.1s; opacity: 0; }
  .animate-delay-2 { animation-delay: 0.2s; opacity: 0; }
  .animate-delay-3 { animation-delay: 0.3s; opacity: 0; }
  .animate-delay-4 { animation-delay: 0.4s; opacity: 0; }

  .nav-scrolled {
    background: rgba(255,255,255,0.95) !important;
    backdrop-filter: blur(20px);
    box-shadow: 0 1px 20px rgba(0,0,0,0.06);
  }
  .nav-scrolled .nav-link { color: #1f2937 !important; }
  .nav-scrolled .nav-logo { color: #f97316 !important; }

  .pricing-toggle-active {
    background: linear-gradient(135deg, #f97316, #ec4899);
    color: white;
  }

  .blob {
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    filter: blur(60px);
    opacity: 0.15;
  }

  .reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .reveal.visible { opacity: 1; transform: none; }
</style>
</head>
<body class="bg-white text-gray-900 antialiased">

<!-- Navigation -->
<nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style="background: transparent;">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="flex items-center justify-between h-20">
      <a href="#" class="nav-logo flex items-center gap-2 text-white font-bold text-xl transition-colors">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="url(#logo-grad)"/>
          <path d="M10 22V10l6 4-6 4V22zm6-8l6 4-6 4V14z" fill="white"/>
          <defs><linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
            <stop stop-color="#f97316"/><stop offset="1" stop-color="#ec4899"/>
          </linearGradient></defs>
        </svg>
        Launchly
      </a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#features" class="nav-link text-white/90 text-sm font-medium hover:text-white transition-colors">功能</a>
        <a href="#how-it-works" class="nav-link text-white/90 text-sm font-medium hover:text-white transition-colors">流程</a>
        <a href="#testimonials" class="nav-link text-white/90 text-sm font-medium hover:text-white transition-colors">用戶好評</a>
        <a href="#pricing" class="nav-link text-white/90 text-sm font-medium hover:text-white transition-colors">方案</a>
      </div>
      <div class="hidden md:flex items-center gap-4">
        <button onclick="showToast('登入功能開發中')" class="nav-link text-white/90 text-sm font-medium hover:text-white transition-colors cursor-pointer">登入</button>
        <button onclick="showToast('歡迎加入！免費試用已開通')" class="gradient-btn text-white text-sm font-semibold px-5 py-2.5 rounded-full cursor-pointer">免費試用</button>
      </div>
      <button onclick="toggleMobileMenu()" class="md:hidden nav-link text-white p-2 cursor-pointer">
        <svg id="menu-icon" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg id="close-icon" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" class="hidden"><path d="M6 6l12 12M6 18L18 6"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="md:hidden hidden bg-white border-t border-gray-100 shadow-lg">
    <div class="px-6 py-4 space-y-3">
      <a href="#features" onclick="closeMobileMenu()" class="block text-gray-700 text-sm font-medium py-2">功能</a>
      <a href="#how-it-works" onclick="closeMobileMenu()" class="block text-gray-700 text-sm font-medium py-2">流程</a>
      <a href="#testimonials" onclick="closeMobileMenu()" class="block text-gray-700 text-sm font-medium py-2">用戶好評</a>
      <a href="#pricing" onclick="closeMobileMenu()" class="block text-gray-700 text-sm font-medium py-2">方案</a>
    </div>
  </div>
</nav>

<!-- Hero Section -->
<section class="gradient-hero relative min-h-screen flex items-center overflow-hidden">
  <div class="absolute top-20 left-10 w-96 h-96 bg-yellow-300 blob"></div>
  <div class="absolute bottom-20 right-10 w-80 h-80 bg-purple-400 blob"></div>

  <div class="relative max-w-7xl mx-auto px-6 lg:px-8 py-32 lg:py-0">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div>
        <div class="animate-fade-in-up">
          <span class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full mb-8">
            <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            全新 2.0 版本正式上線
          </span>
        </div>
        <h1 class="animate-fade-in-up animate-delay-1 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
          讓你的產品<br>
          <span class="text-yellow-200">飛速起跑</span>
        </h1>
        <p class="animate-fade-in-up animate-delay-2 text-lg text-white/80 max-w-xl mb-10 leading-relaxed">
          Launchly 幫助新創團隊在幾分鐘內建立專業網站、追蹤數據、整合支付，讓你專注在真正重要的事——打造偉大的產品。
        </p>
        <div class="animate-fade-in-up animate-delay-3 flex flex-wrap gap-4">
          <button onclick="showToast('歡迎加入！14 天免費試用已開通')" class="bg-white text-gray-900 font-semibold px-8 py-4 rounded-full text-base hover:bg-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
            免費開始 →
          </button>
          <button onclick="showToast('播放產品介紹影片')" class="flex items-center gap-3 text-white font-medium px-6 py-4 rounded-full border-2 border-white/30 hover:bg-white/10 transition-all cursor-pointer">
            <span class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg width="16" height="16" fill="white" viewBox="0 0 16 16"><path d="M4 2l10 6-10 6V2z"/></svg>
            </span>
            觀看介紹
          </button>
        </div>
        <div class="animate-fade-in-up animate-delay-4 flex items-center gap-6 mt-10">
          <div class="flex -space-x-3">
            <div class="w-10 h-10 rounded-full bg-yellow-300 border-2 border-white flex items-center justify-center text-xs font-bold text-yellow-800">A</div>
            <div class="w-10 h-10 rounded-full bg-blue-300 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-800">B</div>
            <div class="w-10 h-10 rounded-full bg-green-300 border-2 border-white flex items-center justify-center text-xs font-bold text-green-800">C</div>
            <div class="w-10 h-10 rounded-full bg-pink-300 border-2 border-white flex items-center justify-center text-xs font-bold text-pink-800">D</div>
          </div>
          <div class="text-white/80 text-sm"><span class="text-white font-semibold">2,400+</span> 團隊正在使用</div>
        </div>
      </div>

      <!-- SIGNATURE: 代碼終端動畫（替代舊的 dashboard mockup） -->
      <div class="animate-fade-in-up animate-delay-4 hidden lg:block">
        <div class="relative">
          <div class="bg-white/10 backdrop-blur-md rounded-2xl p-1 shadow-2xl terminal-glow">
            <div class="bg-terminal-bg rounded-xl overflow-hidden">
              <!-- Terminal header -->
              <div class="flex items-center gap-2 px-4 py-3 bg-terminal-header">
                <div class="flex gap-1.5">
                  <div class="w-3 h-3 rounded-full bg-red-400"></div>
                  <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div class="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div class="flex-1 mx-4 text-center">
                  <span class="text-xs text-terminal-text/50 font-mono">launchly.config.ts</span>
                </div>
              </div>
              <!-- Terminal content: 打字動畫代碼 -->
              <div id="terminal-code" class="p-5 font-mono text-[13px] leading-6 min-h-[280px]">
                <!-- Lines will be populated by JS -->
              </div>
            </div>
          </div>
          <!-- Floating status badge -->
          <div class="absolute -bottom-4 -left-8 bg-white rounded-xl shadow-xl p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg width="20" height="20" fill="none" stroke="#16a34a" stroke-width="2.5"><path d="M4 10l4 4 8-8"/></svg>
              </div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Build 成功</div>
                <div class="text-xs text-gray-500">2.3s · 0 errors</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="absolute bottom-0 left-0 right-0">
    <svg viewBox="0 0 1440 120" fill="none" class="w-full">
      <path d="M0,80 C360,120 720,40 1080,80 C1260,100 1380,90 1440,80 V120 H0 Z" fill="white"/>
    </svg>
  </div>
</section>

<!-- Logos Strip -->
<section class="py-16 border-b border-gray-100">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <p class="text-center text-sm text-gray-400 font-medium mb-10 tracking-wider uppercase">超過 2,400 家企業信賴使用</p>
    <div class="flex flex-wrap justify-center items-center gap-x-16 gap-y-6 opacity-40">
      <span class="text-2xl font-bold text-gray-400 tracking-tight">Notion</span>
      <span class="text-2xl font-bold text-gray-400 tracking-tight">Stripe</span>
      <span class="text-2xl font-bold text-gray-400 tracking-tight">Vercel</span>
      <span class="text-2xl font-bold text-gray-400 tracking-tight">Linear</span>
      <span class="text-2xl font-bold text-gray-400 tracking-tight">Figma</span>
      <span class="text-2xl font-bold text-gray-400 tracking-tight">Slack</span>
    </div>
  </div>
</section>

<!-- Features -->
<section id="features" class="py-24 lg:py-32">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-20">
      <span class="inline-block text-sm font-semibold gradient-text mb-4 tracking-wider uppercase">核心功能</span>
      <h2 class="text-3xl sm:text-4xl font-extrabold mb-6">你需要的一切，都在這裡</h2>
      <p class="text-gray-500 text-lg">從建站到分析，從支付到自動化，Launchly 是你的一站式成長工具箱。</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="card-hover bg-white border border-gray-100 rounded-2xl p-8 reveal">
        <div class="feature-icon w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
          <svg width="28" height="28" fill="none" stroke="#f97316" stroke-width="1.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <h3 class="text-lg font-bold mb-3">閃電建站</h3>
        <p class="text-gray-500 text-sm leading-relaxed">拖放式編輯器 + AI 輔助，幾分鐘內建立響應式網站。不需要任何程式碼知識。</p>
      </div>
      <div class="card-hover bg-white border border-gray-100 rounded-2xl p-8 reveal">
        <div class="feature-icon w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mb-6">
          <svg width="28" height="28" fill="none" stroke="#ec4899" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        </div>
        <h3 class="text-lg font-bold mb-3">即時分析</h3>
        <p class="text-gray-500 text-sm leading-relaxed">精美的即時儀表板，追蹤訪客、轉換率、營收等關鍵指標。</p>
      </div>
      <div class="card-hover bg-white border border-gray-100 rounded-2xl p-8 reveal">
        <div class="feature-icon w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
          <svg width="28" height="28" fill="none" stroke="#8b5cf6" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
        </div>
        <h3 class="text-lg font-bold mb-3">內建支付</h3>
        <p class="text-gray-500 text-sm leading-relaxed">整合 Stripe / PayPal，一鍵開通訂閱制、一次性付款。</p>
      </div>
      <div class="card-hover bg-white border border-gray-100 rounded-2xl p-8 reveal">
        <div class="feature-icon w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
          <svg width="28" height="28" fill="none" stroke="#3b82f6" stroke-width="1.5" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </div>
        <h3 class="text-lg font-bold mb-3">團隊協作</h3>
        <p class="text-gray-500 text-sm leading-relaxed">多人即時編輯，角色權限管理，評論標註。</p>
      </div>
      <div class="card-hover bg-white border border-gray-100 rounded-2xl p-8 reveal">
        <div class="feature-icon w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
          <svg width="28" height="28" fill="none" stroke="#16a34a" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </div>
        <h3 class="text-lg font-bold mb-3">自動化工作流</h3>
        <p class="text-gray-500 text-sm leading-relaxed">設定觸發條件，自動發送歡迎信、推播通知、CRM 同步。</p>
      </div>
      <div class="card-hover bg-white border border-gray-100 rounded-2xl p-8 reveal">
        <div class="feature-icon w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
          <svg width="28" height="28" fill="none" stroke="#d97706" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <h3 class="text-lg font-bold mb-3">企業級安全</h3>
        <p class="text-gray-500 text-sm leading-relaxed">SSL 加密、GDPR 合規、SOC 2 認證、SSO 登入。</p>
      </div>
    </div>
  </div>
</section>

<!-- How It Works -->
<section id="how-it-works" class="py-24 lg:py-32 bg-gray-50">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-20">
      <span class="inline-block text-sm font-semibold gradient-text mb-4 tracking-wider uppercase">簡單三步</span>
      <h2 class="text-3xl sm:text-4xl font-extrabold mb-6">從零到上線，只需 3 步</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-12 lg:gap-16">
      <div class="text-center reveal">
        <div class="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-hero mb-8">
          <span class="text-white text-2xl font-extrabold">1</span>
        </div>
        <h3 class="text-xl font-bold mb-3">選擇模板</h3>
        <p class="text-gray-500 text-sm leading-relaxed">從 100+ 精美模板中挑選，或讓 AI 根據你的產業自動推薦。</p>
      </div>
      <div class="text-center reveal">
        <div class="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-hero mb-8">
          <span class="text-white text-2xl font-extrabold">2</span>
        </div>
        <h3 class="text-xl font-bold mb-3">客製內容</h3>
        <p class="text-gray-500 text-sm leading-relaxed">拖放元件、修改文字、上傳圖片。所見即所得，即時預覽。</p>
      </div>
      <div class="text-center reveal">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-hero mb-8">
          <span class="text-white text-2xl font-extrabold">3</span>
        </div>
        <h3 class="text-xl font-bold mb-3">一鍵上線</h3>
        <p class="text-gray-500 text-sm leading-relaxed">連結你的網域，按下發佈按鈕。自動 SSL、全球 CDN。</p>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section id="testimonials" class="py-24 lg:py-32">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-20">
      <span class="inline-block text-sm font-semibold gradient-text mb-4 tracking-wider uppercase">用戶好評</span>
      <h2 class="text-3xl sm:text-4xl font-extrabold mb-6">他們怎麼說</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-white border border-gray-100 rounded-2xl p-8 reveal">
        <div class="flex gap-1 mb-4">
          <svg width="18" height="18" fill="#f97316" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="18" height="18" fill="#f97316" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="18" height="18" fill="#f97316" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="18" height="18" fill="#f97316" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="18" height="18" fill="#f97316" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed mb-6">「我們用 Launchly 在一個下午就把產品頁面從零建到上線了。真的太不可思議了。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">陳</div>
          <div><div class="text-sm font-semibold">陳奕安</div><div class="text-xs text-gray-400">AppWorks / CTO</div></div>
        </div>
      </div>
      <div class="bg-white border border-gray-100 rounded-2xl p-8 reveal">
        <div class="flex gap-1 mb-4">
          <svg width="18" height="18" fill="#ec4899" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="18" height="18" fill="#ec4899" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="18" height="18" fill="#ec4899" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="18" height="18" fill="#ec4899" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="18" height="18" fill="#ec4899" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed mb-6">「分析儀表板超清楚！我終於知道哪些行銷渠道帶來最多轉換了。ROI 提升了 3 倍。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold">林</div>
          <div><div class="text-sm font-semibold">林佳穎</div><div class="text-xs text-gray-400">GrowthHack / 行銷總監</div></div>
        </div>
      </div>
      <div class="bg-white border border-gray-100 rounded-2xl p-8 reveal">
        <div class="flex gap-1 mb-4">
          <svg width="18" height="18" fill="#8b5cf6" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="18" height="18" fill="#8b5cf6" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="18" height="18" fill="#8b5cf6" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="18" height="18" fill="#8b5cf6" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="18" height="18" fill="#8b5cf6" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed mb-6">「身為設計師，我對 UI 的要求很高。Launchly 的模板品質完全超出預期。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-sm font-bold">黃</div>
          <div><div class="text-sm font-semibold">黃柏翰</div><div class="text-xs text-gray-400">自由接案設計師</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Pricing -->
<section id="pricing" class="py-24 lg:py-32 bg-gray-50">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <span class="inline-block text-sm font-semibold gradient-text mb-4 tracking-wider uppercase">價格方案</span>
      <h2 class="text-3xl sm:text-4xl font-extrabold mb-6">簡單透明的定價</h2>
      <div class="inline-flex items-center bg-white border border-gray-200 rounded-full p-1">
        <button id="btn-monthly" onclick="togglePricing('monthly')" class="pricing-toggle-active px-6 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer">月付</button>
        <button id="btn-yearly" onclick="togglePricing('yearly')" class="px-6 py-2 rounded-full text-sm font-semibold text-gray-500 transition-all cursor-pointer">年付 <span class="text-xs text-green-500 font-bold">省 20%</span></button>
      </div>
    </div>
    <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <div class="card-hover bg-white border border-gray-100 rounded-2xl p-8 reveal">
        <h3 class="text-lg font-bold mb-2">Free</h3>
        <p class="text-gray-400 text-sm mb-6">適合個人專案</p>
        <div class="mb-8"><span class="text-4xl font-extrabold">$0</span><span class="text-gray-400 text-sm"> /月</span></div>
        <ul class="space-y-4 mb-8">
          <li class="flex items-center gap-3 text-sm text-gray-600"><svg width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>1 個網站</li>
          <li class="flex items-center gap-3 text-sm text-gray-600"><svg width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>基本分析</li>
          <li class="flex items-center gap-3 text-sm text-gray-300"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>自訂網域</li>
        </ul>
        <button onclick="showToast('Free 方案已開通！')" class="w-full py-3.5 border-2 border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:border-gray-300 transition-all cursor-pointer">開始使用</button>
      </div>
      <div class="card-hover relative bg-white border-2 border-orange-400 rounded-2xl p-8 shadow-xl shadow-orange-100 reveal">
        <div class="absolute -top-4 left-1/2 -translate-x-1/2"><span class="gradient-btn text-white text-xs font-bold px-4 py-1.5 rounded-full">最受歡迎</span></div>
        <h3 class="text-lg font-bold mb-2">Pro</h3>
        <p class="text-gray-400 text-sm mb-6">適合成長中的團隊</p>
        <div class="mb-8"><span id="price-pro" class="text-4xl font-extrabold">$29</span><span class="text-gray-400 text-sm"> /<span id="period-pro">月</span></span></div>
        <ul class="space-y-4 mb-8">
          <li class="flex items-center gap-3 text-sm text-gray-600"><svg width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>無限網站</li>
          <li class="flex items-center gap-3 text-sm text-gray-600"><svg width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>進階分析 + A/B 測試</li>
          <li class="flex items-center gap-3 text-sm text-gray-600"><svg width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>自訂網域 + SSL</li>
        </ul>
        <button onclick="showToast('Pro 方案 14 天免費試用已開通！')" class="w-full py-3.5 gradient-btn text-white rounded-full text-sm font-semibold cursor-pointer">免費試用 14 天</button>
      </div>
      <div class="card-hover bg-white border border-gray-100 rounded-2xl p-8 reveal">
        <h3 class="text-lg font-bold mb-2">Enterprise</h3>
        <p class="text-gray-400 text-sm mb-6">適合大型組織</p>
        <div class="mb-8"><span id="price-enterprise" class="text-4xl font-extrabold">$99</span><span class="text-gray-400 text-sm"> /<span id="period-enterprise">月</span></span></div>
        <ul class="space-y-4 mb-8">
          <li class="flex items-center gap-3 text-sm text-gray-600"><svg width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>所有 Pro 功能</li>
          <li class="flex items-center gap-3 text-sm text-gray-600"><svg width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>SSO / SAML 登入</li>
          <li class="flex items-center gap-3 text-sm text-gray-600"><svg width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>SLA 99.9%</li>
        </ul>
        <button onclick="showToast('已安排產品顧問聯繫您')" class="w-full py-3.5 border-2 border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:border-gray-300 transition-all cursor-pointer">聯絡銷售團隊</button>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="py-24 lg:py-32 relative overflow-hidden">
  <div class="absolute inset-0 gradient-hero opacity-95"></div>
  <div class="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
    <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">準備好讓你的產品<br>飛速起跑了嗎？</h2>
    <p class="text-white/80 text-lg max-w-2xl mx-auto mb-10">加入超過 2,400 個團隊的行列。免費開始，不需要信用卡。</p>
    <button onclick="showToast('帳號已建立！歡迎使用 Launchly')" class="bg-white text-gray-900 font-semibold px-10 py-4 rounded-full text-base hover:bg-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">免費註冊 →</button>
  </div>
</section>

<!-- Footer -->
<footer class="bg-gray-900 text-gray-400 py-16">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#f-logo)"/><path d="M10 22V10l6 4-6 4V22zm6-8l6 4-6 4V14z" fill="white"/><defs><linearGradient id="f-logo" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#f97316"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs></svg>
          <span class="text-white font-bold text-lg">Launchly</span>
        </div>
        <p class="text-sm leading-relaxed">讓每個創業者都能輕鬆建立專業的數位門面。</p>
      </div>
      <div>
        <h4 class="text-white font-semibold text-sm mb-4">產品</h4>
        <ul class="space-y-3 text-sm">
          <li><a href="#features" class="hover:text-white transition-colors">功能</a></li>
          <li><a href="#pricing" class="hover:text-white transition-colors">價格</a></li>
          <li><a href="#" onclick="showToast('模板庫開發中')" class="hover:text-white transition-colors cursor-pointer">模板</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold text-sm mb-4">資源</h4>
        <ul class="space-y-3 text-sm">
          <li><a href="#" onclick="showToast('文件即將推出')" class="hover:text-white transition-colors cursor-pointer">開發文件</a></li>
          <li><a href="#" onclick="showToast('API 文件即將推出')" class="hover:text-white transition-colors cursor-pointer">API</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold text-sm mb-4">公司</h4>
        <ul class="space-y-3 text-sm">
          <li><a href="#" onclick="showToast('關於我們')" class="hover:text-white transition-colors cursor-pointer">關於我們</a></li>
          <li><a href="#" onclick="showToast('隱私政策')" class="hover:text-white transition-colors cursor-pointer">隱私政策</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-gray-800 pt-8 text-center text-xs">© 2026 Launchly. All rights reserved.</div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] opacity-0 pointer-events-none transition-all duration-300 translate-y-4">
  <div class="bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3">
    <svg width="18" height="18" fill="none" stroke="#22c55e" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
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

// SIGNATURE: 終端打字動畫
const codeLines = [
  { text: '<span style="color:#c084fc">import</span> { <span style="color:#4ade80">Launchly</span> } <span style="color:#c084fc">from</span> <span style="color:#fb923c">"@launchly/sdk"</span>', delay: 0 },
  { text: '', delay: 300 },
  { text: '<span style="color:#c084fc">const</span> <span style="color:#60a5fa">app</span> = <span style="color:#4ade80">Launchly</span>.<span style="color:#f472b6">create</span>({', delay: 600 },
  { text: '  <span style="color:#4ade80">name</span>: <span style="color:#fb923c">"我的新創產品"</span>,', delay: 900 },
  { text: '  <span style="color:#4ade80">template</span>: <span style="color:#fb923c">"startup-pro"</span>,', delay: 1200 },
  { text: '  <span style="color:#4ade80">analytics</span>: <span style="color:#c084fc">true</span>,', delay: 1500 },
  { text: '  <span style="color:#4ade80">payments</span>: <span style="color:#fb923c">"stripe"</span>,', delay: 1800 },
  { text: '})', delay: 2100 },
  { text: '', delay: 2400 },
  { text: '<span style="color:#a0aec0">// 一鍵部署到全球 CDN</span>', delay: 2700 },
  { text: '<span style="color:#c084fc">await</span> <span style="color:#60a5fa">app</span>.<span style="color:#f472b6">deploy</span>() <span style="color:#a0aec0">// ✓ 上線完成！</span>', delay: 3000 },
];

const terminalEl = document.getElementById('terminal-code');
codeLines.forEach((line, i) => {
  setTimeout(() => {
    const div = document.createElement('div');
    div.className = 'typing-line';
    div.style.animationDelay = '0s';
    if (line.text === '') {
      div.innerHTML = '&nbsp;';
    } else {
      div.innerHTML = '<span style="color:#4a5568;user-select:none">' + String(i+1).padStart(2) + ' </span>' + line.text;
      if (i === codeLines.length - 1) {
        div.innerHTML += '<span class="terminal-cursor"></span>';
      }
    }
    terminalEl.appendChild(div);
  }, line.delay);
});

// Nav
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('nav-scrolled', window.scrollY > 80));

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

// Pricing toggle
function togglePricing(plan) {
  const bm = document.getElementById('btn-monthly');
  const by = document.getElementById('btn-yearly');
  const pp = document.getElementById('price-pro');
  const pe = document.getElementById('price-enterprise');
  if (plan === 'monthly') {
    bm.classList.add('pricing-toggle-active'); by.classList.remove('pricing-toggle-active');
    pp.textContent = '$29'; pe.textContent = '$99';
  } else {
    by.classList.add('pricing-toggle-active'); bm.classList.remove('pricing-toggle-active');
    pp.textContent = '$23'; pe.textContent = '$79';
  }
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const t = this.getAttribute('href');
    if (t === '#') return;
    e.preventDefault();
    document.querySelector(t)?.scrollIntoView({ behavior: 'smooth' });
  });
});

// Reveal
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
