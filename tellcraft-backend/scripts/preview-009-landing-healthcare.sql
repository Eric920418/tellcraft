-- Template Preview: landing-healthcare (醫療診所) v3
-- 不對稱 60/40 佈局、心電圖分隔線 signature、預約流程互動
-- Swap Test: 心電圖線條 + 臨床藍白色系 + 醫療十字 = 一看就是醫療
-- Signature: ECG 心電圖 SVG 動畫做 section 分隔線

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '69a7c629-45cd-43c3-864d-bc5b542fa300',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>悅恆診所 Everwell Clinic — 以人為本的全人醫療</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Source+Serif+4:wght@400;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Source Serif 4', 'serif'],
        body: ['Noto Sans TC', 'system-ui', 'sans-serif']
      },
      colors: {
        clinical: { 50: '#f0f7ff', 100: '#e0efff', 200: '#b8dbff', 300: '#7abfff', 400: '#3a9eff', 500: '#0070e0', 600: '#005bb5', 700: '#004080', 800: '#002b57', 900: '#001a33' },
        mint: { 50: '#f0fdf9', 100: '#ccfbef', 200: '#99f6e0', 300: '#5ceac8', 400: '#2dd4a8' },
        warm: { 50: '#fffbf5', 100: '#fff3e0', 200: '#ffe0b2' },
        trust: '#f8fafc'
      }
    }
  }
}
</script>
<style>
  * { font-family: 'Noto Sans TC', system-ui, sans-serif; }
  .font-display { font-family: 'Source Serif 4', serif; }
  html { scroll-behavior: smooth; }
  body { background: #f8fafc; overflow-x: hidden; }

  /* ===== SIGNATURE: 心電圖分隔線 ===== */
  .ecg-divider {
    width: 100%;
    height: 40px;
    overflow: hidden;
  }
  .ecg-line {
    stroke-dasharray: 800;
    stroke-dashoffset: 800;
    animation: ecg-draw 4s linear infinite;
  }
  @keyframes ecg-draw {
    0% { stroke-dashoffset: 800; }
    100% { stroke-dashoffset: 0; }
  }

  /* ===== 醫療十字裝飾 ===== */
  .cross-pattern {
    background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M18 0h4v18h18v4H22v18h-4V22H0v-4h18V0z' fill='%230070e0' opacity='0.02'/%3E%3C/svg%3E");
  }

  /* ===== 卡片 ===== */
  .service-card {
    transition: all 0.3s ease;
    border: 1px solid #e0efff;
  }
  .service-card:hover {
    border-color: #3a9eff;
    box-shadow: 0 8px 30px rgba(0,112,224,0.08);
  }

  /* ===== 步驟連接線 ===== */
  .step-connector {
    position: relative;
  }
  .step-connector::after {
    content: '';
    position: absolute;
    top: 24px;
    left: 24px;
    width: 2px;
    height: calc(100% - 24px);
    background: linear-gradient(to bottom, #b8dbff, transparent);
  }
  .step-connector:last-child::after {
    display: none;
  }

  /* ===== 入場 ===== */
  .reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .reveal.visible { opacity: 1; transform: none; }

  /* ===== 導航 ===== */
  .nav-scrolled {
    background: rgba(248,250,252,0.95) !important;
    backdrop-filter: blur(12px);
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  /* ===== 脈搏呼吸效果 ===== */
  .pulse-breathe {
    animation: breathe 3s ease-in-out infinite;
  }
  @keyframes breathe {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.05); opacity: 1; }
  }

  /* ===== 信任徽章 ===== */
  .trust-badge {
    transition: all 0.3s ease;
  }
  .trust-badge:hover {
    transform: scale(1.05);
  }
</style>
</head>
<body class="antialiased text-clinical-800">

<!-- Navigation -->
<nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between h-20">
      <a href="#" class="flex items-center gap-3">
        <!-- 醫療十字 Logo -->
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="10" fill="#0070e0"/>
          <path d="M15 8h6v8h8v6h-8v8h-6v-8H7v-6h8V8z" fill="white"/>
          <circle cx="18" cy="18" r="3" fill="#0070e0"/>
        </svg>
        <div>
          <span class="text-lg font-bold text-clinical-800">悅恆診所</span>
          <span class="block text-[10px] text-clinical-400 tracking-wider">EVERWELL CLINIC</span>
        </div>
      </a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#services" class="text-sm text-clinical-500 hover:text-clinical-700 transition-colors">診療項目</a>
        <a href="#team" class="text-sm text-clinical-500 hover:text-clinical-700 transition-colors">醫療團隊</a>
        <a href="#booking" class="text-sm text-clinical-500 hover:text-clinical-700 transition-colors">預約看診</a>
        <a href="#location" class="text-sm text-clinical-500 hover:text-clinical-700 transition-colors">交通資訊</a>
      </div>
      <button onclick="showToast('線上預約系統已開啟')" class="hidden md:flex items-center gap-2 text-sm font-semibold px-5 py-2.5 bg-clinical-500 text-white rounded-full hover:bg-clinical-600 transition-colors cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        預約掛號
      </button>
      <button onclick="toggleMobileMenu()" class="md:hidden p-2 cursor-pointer">
        <svg id="menu-icon" width="24" height="24" fill="none" stroke="#002b57" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg id="close-icon" width="24" height="24" fill="none" stroke="#002b57" stroke-width="2" class="hidden"><path d="M6 6l12 12M6 18L18 6"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="md:hidden hidden bg-trust border-t border-clinical-100">
    <div class="px-6 py-4 space-y-3">
      <a href="#services" onclick="closeMobileMenu()" class="block text-sm py-2">診療項目</a>
      <a href="#team" onclick="closeMobileMenu()" class="block text-sm py-2">醫療團隊</a>
      <a href="#booking" onclick="closeMobileMenu()" class="block text-sm py-2">預約看診</a>
      <a href="#location" onclick="closeMobileMenu()" class="block text-sm py-2">交通資訊</a>
    </div>
  </div>
</nav>

<!-- Hero: 不對稱 60/40 佈局 -->
<section class="relative pt-28 pb-20 lg:pt-36 lg:pb-28 cross-pattern overflow-hidden">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
      <!-- 左側 60% 文字 -->
      <div class="lg:col-span-3">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-clinical-50 border border-clinical-100 rounded-full mb-6">
          <div class="w-2 h-2 bg-mint-400 rounded-full pulse-breathe"></div>
          <span class="text-xs font-medium text-clinical-500">健保特約 · 夜間門診至 21:00</span>
        </div>
        <h1 class="font-display text-4xl lg:text-6xl font-bold leading-tight mb-6 text-clinical-900">
          以人為本的<br>
          <span class="text-clinical-500">全人醫療</span>
        </h1>
        <p class="text-base text-clinical-500 leading-relaxed max-w-lg mb-8">
          結合西醫精準診斷與預防醫學觀念，悅恆診所提供家庭醫學、內科、復健科、健康檢查等完整服務。不只治病，更守護您全家的健康。
        </p>
        <div class="flex flex-wrap gap-4 mb-12">
          <button onclick="showBooking()" class="flex items-center gap-2 px-8 py-4 bg-clinical-500 text-white font-semibold rounded-full hover:bg-clinical-600 transition-all hover:shadow-lg hover:shadow-clinical-500/20 cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            線上預約
          </button>
          <a href="#services" class="flex items-center gap-2 px-6 py-4 text-clinical-600 font-medium hover:text-clinical-800 transition-colors">
            診療項目
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h8M9 4l4 4-4 4"/></svg>
          </a>
        </div>

        <!-- 信任徽章 -->
        <div class="flex flex-wrap gap-4">
          <div class="trust-badge flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-clinical-100 cursor-default">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0070e0" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span class="text-xs font-medium text-clinical-700">衛福部認證</span>
          </div>
          <div class="trust-badge flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-clinical-100 cursor-default">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4a8" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            <span class="text-xs font-medium text-clinical-700">健保特約</span>
          </div>
          <div class="trust-badge flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-clinical-100 cursor-default">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0070e0" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span class="text-xs font-medium text-clinical-700">看診 25 年</span>
          </div>
        </div>
      </div>

      <!-- 右側 40%：預約卡片 -->
      <div class="lg:col-span-2">
        <div id="booking-card" class="bg-white rounded-3xl shadow-xl shadow-clinical-200/30 border border-clinical-100 p-8">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-clinical-50 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0070e0" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </div>
            <div>
              <div class="font-semibold text-clinical-800">快速預約</div>
              <div class="text-xs text-clinical-400">選擇科別即可線上掛號</div>
            </div>
          </div>

          <!-- 科別選擇 -->
          <div class="space-y-3 mb-6">
            <button onclick="selectDept(this, '家庭醫學科')" class="dept-btn w-full flex items-center gap-3 p-3 rounded-xl border border-clinical-100 hover:border-clinical-300 transition-all cursor-pointer text-left">
              <div class="w-8 h-8 rounded-lg bg-clinical-50 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0070e0" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
              </div>
              <div>
                <div class="text-sm font-medium text-clinical-800">家庭醫學科</div>
                <div class="text-[11px] text-clinical-400">感冒、慢性病、健檢</div>
              </div>
            </button>
            <button onclick="selectDept(this, '內科')" class="dept-btn w-full flex items-center gap-3 p-3 rounded-xl border border-clinical-100 hover:border-clinical-300 transition-all cursor-pointer text-left">
              <div class="w-8 h-8 rounded-lg bg-mint-50 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4a8" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div>
                <div class="text-sm font-medium text-clinical-800">內科</div>
                <div class="text-[11px] text-clinical-400">心臟、腸胃、新陳代謝</div>
              </div>
            </button>
            <button onclick="selectDept(this, '復健科')" class="dept-btn w-full flex items-center gap-3 p-3 rounded-xl border border-clinical-100 hover:border-clinical-300 transition-all cursor-pointer text-left">
              <div class="w-8 h-8 rounded-lg bg-warm-50 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="5" r="3"/><path d="M12 8v8M8 20l4-4 4 4"/></svg>
              </div>
              <div>
                <div class="text-sm font-medium text-clinical-800">復健科</div>
                <div class="text-[11px] text-clinical-400">物理治療、運動傷害</div>
              </div>
            </button>
          </div>

          <button onclick="showToast('預約成功！請於看診前 15 分鐘報到')" class="w-full py-3.5 bg-clinical-500 text-white font-semibold rounded-xl hover:bg-clinical-600 transition-colors cursor-pointer">
            確認預約
          </button>
          <p class="text-center text-[11px] text-clinical-400 mt-3">或致電 02-2755-8800 人工預約</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ECG 分隔線 SIGNATURE -->
<div class="ecg-divider">
  <svg viewBox="0 0 1440 40" preserveAspectRatio="none" class="w-full h-full">
    <path class="ecg-line" d="M0,20 L300,20 L340,20 L360,5 L380,35 L400,8 L420,32 L440,20 L700,20 L740,20 L760,3 L780,37 L800,6 L820,34 L840,20 L1100,20 L1140,20 L1160,4 L1180,36 L1200,7 L1220,33 L1240,20 L1440,20" stroke="#b8dbff" stroke-width="1.5" fill="none"/>
  </svg>
</div>

<!-- Services 診療項目 -->
<section id="services" class="py-20 lg:py-28">
  <div class="max-w-6xl mx-auto px-6">
    <div class="max-w-xl mb-16 reveal">
      <span class="inline-block text-xs font-semibold text-clinical-400 tracking-[0.2em] uppercase mb-3">Services</span>
      <h2 class="font-display text-3xl lg:text-4xl font-bold text-clinical-900 mb-4">完整的醫療服務</h2>
      <p class="text-clinical-500 leading-relaxed">從日常看診到專科治療，一站式照護全家健康。</p>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="service-card rounded-2xl p-6 bg-white reveal cursor-pointer" onclick="showToast('家醫科門診：週一至週六')">
        <div class="w-12 h-12 rounded-xl bg-clinical-50 flex items-center justify-center mb-5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0070e0" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
        </div>
        <h3 class="text-lg font-bold text-clinical-800 mb-2">家庭醫學</h3>
        <p class="text-sm text-clinical-500 leading-relaxed">全方位基礎醫療。感冒發燒、慢性病管理、疫苗接種、旅遊醫學。</p>
      </div>

      <div class="service-card rounded-2xl p-6 bg-white reveal cursor-pointer" onclick="showToast('內科門診：週一至週五')">
        <div class="w-12 h-12 rounded-xl bg-mint-50 flex items-center justify-center mb-5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2dd4a8" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <h3 class="text-lg font-bold text-clinical-800 mb-2">內科診療</h3>
        <p class="text-sm text-clinical-500 leading-relaxed">心臟超音波、腸胃鏡檢查、糖尿病照護、甲狀腺功能評估。</p>
      </div>

      <div class="service-card rounded-2xl p-6 bg-white reveal cursor-pointer" onclick="showToast('復健科門診：週一至週六')">
        <div class="w-12 h-12 rounded-xl bg-warm-50 flex items-center justify-center mb-5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="5" r="3"/><path d="M12 8v8M8 20l4-4 4 4M6 12h12"/></svg>
        </div>
        <h3 class="text-lg font-bold text-clinical-800 mb-2">復健治療</h3>
        <p class="text-sm text-clinical-500 leading-relaxed">物理治療、職能治療、運動傷害復健、痠痛管理。</p>
      </div>

      <div class="service-card rounded-2xl p-6 bg-white reveal cursor-pointer" onclick="showToast('健檢中心：需提前 3 天預約')">
        <div class="w-12 h-12 rounded-xl bg-clinical-50 flex items-center justify-center mb-5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0070e0" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        </div>
        <h3 class="text-lg font-bold text-clinical-800 mb-2">健康檢查</h3>
        <p class="text-sm text-clinical-500 leading-relaxed">基礎健檢、進階影像、癌症篩檢、企業團檢方案。</p>
      </div>

      <div class="service-card rounded-2xl p-6 bg-white reveal cursor-pointer" onclick="showToast('預防接種：請先電話確認疫苗庫存')">
        <div class="w-12 h-12 rounded-xl bg-mint-50 flex items-center justify-center mb-5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2dd4a8" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h3 class="text-lg font-bold text-clinical-800 mb-2">預防醫學</h3>
        <p class="text-sm text-clinical-500 leading-relaxed">流感/新冠疫苗、帶狀疱疹疫苗、HPV 疫苗、過敏原檢測。</p>
      </div>

      <div class="service-card rounded-2xl p-6 bg-white reveal cursor-pointer" onclick="showToast('夜間門診：週一三五 18:00-21:00')">
        <div class="w-12 h-12 rounded-xl bg-warm-50 flex items-center justify-center mb-5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <h3 class="text-lg font-bold text-clinical-800 mb-2">夜間門診</h3>
        <p class="text-sm text-clinical-500 leading-relaxed">週一、三、五晚間門診至 21:00。上班族也能安心看診。</p>
      </div>
    </div>
  </div>
</section>

<!-- ECG 分隔線 -->
<div class="ecg-divider">
  <svg viewBox="0 0 1440 40" preserveAspectRatio="none" class="w-full h-full">
    <path class="ecg-line" d="M0,20 L300,20 L340,20 L360,5 L380,35 L400,8 L420,32 L440,20 L700,20 L740,20 L760,3 L780,37 L800,6 L820,34 L840,20 L1100,20 L1140,20 L1160,4 L1180,36 L1200,7 L1220,33 L1240,20 L1440,20" stroke="#b8dbff" stroke-width="1.5" fill="none"/>
  </svg>
</div>

<!-- Team 醫療團隊 -->
<section id="team" class="py-20 lg:py-28 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="inline-block text-xs font-semibold text-clinical-400 tracking-[0.2em] uppercase mb-3">Medical Team</span>
      <h2 class="font-display text-3xl lg:text-4xl font-bold text-clinical-900">專業醫療團隊</h2>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="text-center reveal cursor-pointer" onclick="showToast('陳醫師門診：週一至週五上午')">
        <div class="w-24 h-24 mx-auto mb-4 rounded-full bg-clinical-50 border-2 border-clinical-200 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0070e0" stroke-width="1.5">
            <circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 10-16 0"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-clinical-800 mb-1">陳彥廷 醫師</h3>
        <p class="text-sm text-clinical-500 mb-2">院長 · 家庭醫學科</p>
        <div class="flex flex-wrap gap-1 justify-center">
          <span class="text-[10px] px-2 py-0.5 bg-clinical-50 text-clinical-500 rounded-full">台大醫學系</span>
          <span class="text-[10px] px-2 py-0.5 bg-clinical-50 text-clinical-500 rounded-full">25 年經驗</span>
        </div>
      </div>

      <div class="text-center reveal cursor-pointer" onclick="showToast('林醫師門診：週二四上午、週三下午')">
        <div class="w-24 h-24 mx-auto mb-4 rounded-full bg-mint-50 border-2 border-mint-200 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2dd4a8" stroke-width="1.5">
            <circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 10-16 0"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-clinical-800 mb-1">林佳穎 醫師</h3>
        <p class="text-sm text-clinical-500 mb-2">內科主治</p>
        <div class="flex flex-wrap gap-1 justify-center">
          <span class="text-[10px] px-2 py-0.5 bg-mint-50 text-clinical-500 rounded-full">陽明醫學系</span>
          <span class="text-[10px] px-2 py-0.5 bg-mint-50 text-clinical-500 rounded-full">心臟內科</span>
        </div>
      </div>

      <div class="text-center reveal cursor-pointer" onclick="showToast('張醫師門診：週一至週五下午')">
        <div class="w-24 h-24 mx-auto mb-4 rounded-full bg-warm-50 border-2 border-warm-200 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5">
            <circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 10-16 0"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-clinical-800 mb-1">張瀚文 醫師</h3>
        <p class="text-sm text-clinical-500 mb-2">復健科主治</p>
        <div class="flex flex-wrap gap-1 justify-center">
          <span class="text-[10px] px-2 py-0.5 bg-warm-50 text-clinical-500 rounded-full">成大醫學系</span>
          <span class="text-[10px] px-2 py-0.5 bg-warm-50 text-clinical-500 rounded-full">運動醫學</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Booking Flow 預約流程 -->
<section id="booking" class="py-20 lg:py-28">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid lg:grid-cols-5 gap-16 items-start">
      <!-- 左側文字 -->
      <div class="lg:col-span-3 reveal">
        <span class="inline-block text-xs font-semibold text-clinical-400 tracking-[0.2em] uppercase mb-3">How to Book</span>
        <h2 class="font-display text-3xl lg:text-4xl font-bold text-clinical-900 mb-4">簡單 3 步，完成預約</h2>
        <p class="text-clinical-500 leading-relaxed mb-12">線上預約省去現場等候時間。到院後直接報到，5 分鐘內看診。</p>

        <!-- 步驟（垂直連接線） -->
        <div class="space-y-0">
          <div class="step-connector flex gap-5 pb-10">
            <div class="w-12 h-12 rounded-full bg-clinical-500 flex items-center justify-center flex-shrink-0">
              <span class="text-white font-bold">1</span>
            </div>
            <div class="pt-2">
              <h3 class="font-semibold text-clinical-800 mb-1">選擇科別與時段</h3>
              <p class="text-sm text-clinical-500">線上選擇您需要的診療科別，查看可預約時段。</p>
            </div>
          </div>

          <div class="step-connector flex gap-5 pb-10">
            <div class="w-12 h-12 rounded-full bg-clinical-300 flex items-center justify-center flex-shrink-0">
              <span class="text-white font-bold">2</span>
            </div>
            <div class="pt-2">
              <h3 class="font-semibold text-clinical-800 mb-1">填寫基本資料</h3>
              <p class="text-sm text-clinical-500">首次就診需填寫姓名、電話與症狀概述，複診只需健保卡號。</p>
            </div>
          </div>

          <div class="step-connector flex gap-5">
            <div class="w-12 h-12 rounded-full bg-clinical-200 flex items-center justify-center flex-shrink-0">
              <span class="text-clinical-600 font-bold">3</span>
            </div>
            <div class="pt-2">
              <h3 class="font-semibold text-clinical-800 mb-1">到院報到看診</h3>
              <p class="text-sm text-clinical-500">看診前 15 分鐘到院，出示預約確認簡訊即可直接報到。</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側：看診時刻表 -->
      <div class="lg:col-span-2 reveal">
        <div class="bg-white rounded-2xl border border-clinical-100 shadow-sm overflow-hidden">
          <div class="bg-clinical-500 text-white px-6 py-4">
            <div class="font-semibold">門診時刻表</div>
            <div class="text-xs text-clinical-200 mt-1">2026 年 2 月</div>
          </div>
          <div class="p-6">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-clinical-400 text-xs">
                  <th class="pb-3 text-left font-medium">時段</th>
                  <th class="pb-3 text-center font-medium">一</th>
                  <th class="pb-3 text-center font-medium">二</th>
                  <th class="pb-3 text-center font-medium">三</th>
                  <th class="pb-3 text-center font-medium">四</th>
                  <th class="pb-3 text-center font-medium">五</th>
                  <th class="pb-3 text-center font-medium">六</th>
                </tr>
              </thead>
              <tbody class="text-clinical-600">
                <tr class="border-t border-clinical-50">
                  <td class="py-3 text-xs text-clinical-400">上午<br>09-12</td>
                  <td class="py-3 text-center"><span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-clinical-50 text-clinical-500 text-[10px]">陳</span></td>
                  <td class="py-3 text-center"><span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-mint-50 text-mint-400 text-[10px]">林</span></td>
                  <td class="py-3 text-center"><span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-clinical-50 text-clinical-500 text-[10px]">陳</span></td>
                  <td class="py-3 text-center"><span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-mint-50 text-mint-400 text-[10px]">林</span></td>
                  <td class="py-3 text-center"><span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-clinical-50 text-clinical-500 text-[10px]">陳</span></td>
                  <td class="py-3 text-center"><span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-warm-50 text-warm-200 text-[10px]">張</span></td>
                </tr>
                <tr class="border-t border-clinical-50">
                  <td class="py-3 text-xs text-clinical-400">下午<br>14-17</td>
                  <td class="py-3 text-center"><span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-warm-50 text-warm-200 text-[10px]">張</span></td>
                  <td class="py-3 text-center"><span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-clinical-50 text-clinical-500 text-[10px]">陳</span></td>
                  <td class="py-3 text-center"><span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-warm-50 text-warm-200 text-[10px]">張</span></td>
                  <td class="py-3 text-center"><span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-clinical-50 text-clinical-500 text-[10px]">陳</span></td>
                  <td class="py-3 text-center"><span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-warm-50 text-warm-200 text-[10px]">張</span></td>
                  <td class="py-3 text-center text-[10px] text-clinical-300">休</td>
                </tr>
                <tr class="border-t border-clinical-50">
                  <td class="py-3 text-xs text-clinical-400">夜間<br>18-21</td>
                  <td class="py-3 text-center"><span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-clinical-50 text-clinical-500 text-[10px]">陳</span></td>
                  <td class="py-3 text-center text-[10px] text-clinical-300">休</td>
                  <td class="py-3 text-center"><span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-mint-50 text-mint-400 text-[10px]">林</span></td>
                  <td class="py-3 text-center text-[10px] text-clinical-300">休</td>
                  <td class="py-3 text-center"><span class="w-6 h-6 inline-flex items-center justify-center rounded-full bg-clinical-50 text-clinical-500 text-[10px]">陳</span></td>
                  <td class="py-3 text-center text-[10px] text-clinical-300">休</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Location -->
<section id="location" class="py-20 lg:py-28 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <div class="reveal">
        <span class="inline-block text-xs font-semibold text-clinical-400 tracking-[0.2em] uppercase mb-3">Location</span>
        <h2 class="font-display text-3xl lg:text-4xl font-bold text-clinical-900 mb-8">交通資訊</h2>

        <div class="space-y-6">
          <div class="flex gap-4">
            <div class="w-10 h-10 rounded-xl bg-clinical-50 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0070e0" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <div class="font-semibold text-clinical-800 mb-1">地址</div>
              <div class="text-sm text-clinical-500">台北市大安區信義路四段 265 巷 12 號 1 樓</div>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="w-10 h-10 rounded-xl bg-clinical-50 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0070e0" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 6v12M2 12h20"/></svg>
            </div>
            <div>
              <div class="font-semibold text-clinical-800 mb-1">捷運</div>
              <div class="text-sm text-clinical-500">大安站 4 號出口步行 3 分鐘</div>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="w-10 h-10 rounded-xl bg-clinical-50 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0070e0" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            </div>
            <div>
              <div class="font-semibold text-clinical-800 mb-1">電話</div>
              <div class="text-sm text-clinical-500">02-2755-8800</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 地圖示意 -->
      <div class="reveal">
        <div class="rounded-2xl overflow-hidden bg-clinical-50 aspect-[4/3] relative border border-clinical-100">
          <svg viewBox="0 0 400 300" class="w-full h-full" fill="none">
            <!-- 街道網格 -->
            <line x1="0" y1="150" x2="400" y2="150" stroke="#b8dbff" stroke-width="3"/>
            <line x1="200" y1="0" x2="200" y2="300" stroke="#b8dbff" stroke-width="2"/>
            <line x1="0" y1="100" x2="400" y2="100" stroke="#e0efff" stroke-width="1"/>
            <line x1="0" y1="200" x2="400" y2="200" stroke="#e0efff" stroke-width="1"/>
            <line x1="100" y1="0" x2="100" y2="300" stroke="#e0efff" stroke-width="1"/>
            <line x1="300" y1="0" x2="300" y2="300" stroke="#e0efff" stroke-width="1"/>
            <!-- 路名 -->
            <text x="10" y="145" fill="#7abfff" font-size="10" font-family="Noto Sans TC">信義路四段</text>
            <text x="205" y="95" fill="#7abfff" font-size="9" font-family="Noto Sans TC" transform="rotate(-90, 205, 95)">建國南路</text>
            <!-- 診所標記 -->
            <circle cx="220" cy="170" r="16" fill="#0070e0"/>
            <path d="M216 170h8M220 166v8" stroke="white" stroke-width="2.5"/>
            <text x="220" y="200" text-anchor="middle" fill="#0070e0" font-size="10" font-weight="600" font-family="Noto Sans TC">悅恆診所</text>
            <!-- 捷運站 -->
            <rect x="160" y="135" width="16" height="16" rx="3" fill="#0070e0" opacity="0.3"/>
            <text x="168" y="147" text-anchor="middle" fill="white" font-size="8" font-family="Noto Sans TC">M</text>
            <text x="168" y="128" text-anchor="middle" fill="#3a9eff" font-size="8" font-family="Noto Sans TC">大安站</text>
          </svg>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-clinical-900 text-clinical-300 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="#0070e0"/>
            <path d="M15 8h6v8h8v6h-8v8h-6v-8H7v-6h8V8z" fill="white"/>
          </svg>
          <span class="text-white font-bold">悅恆診所</span>
        </div>
        <p class="text-sm leading-relaxed">以人為本，全人醫療。<br>守護您全家的健康。</p>
      </div>
      <div>
        <h4 class="text-white font-semibold text-sm mb-3">門診資訊</h4>
        <ul class="space-y-2 text-sm">
          <li>週一至週五 09:00-17:00</li>
          <li>夜間門診 18:00-21:00</li>
          <li>週六上午 09:00-12:00</li>
          <li class="text-clinical-500">週日及國定假日休診</li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold text-sm mb-3">聯絡方式</h4>
        <ul class="space-y-2 text-sm">
          <li>電話：02-2755-8800</li>
          <li>傳真：02-2755-8801</li>
          <li><a href="#" onclick="showToast('Email 已複製')" class="hover:text-white transition-colors cursor-pointer">info@everwell.tw</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold text-sm mb-3">追蹤我們</h4>
        <div class="flex gap-3">
          <a href="#" onclick="showToast('前往 Facebook')" class="w-9 h-9 rounded-lg bg-clinical-800 flex items-center justify-center hover:bg-clinical-700 transition-colors cursor-pointer">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
          </a>
          <a href="#" onclick="showToast('加入 LINE')" class="w-9 h-9 rounded-lg bg-clinical-800 flex items-center justify-center hover:bg-clinical-700 transition-colors cursor-pointer">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 5.82 2 10.5c0 2.92 1.56 5.47 4 7.08V22l3.8-2.09c.7.13 1.44.09 2.2.09 5.52 0 10-3.82 10-8.5S17.52 2 12 2z"/></svg>
          </a>
        </div>
      </div>
    </div>
    <div class="border-t border-clinical-800 pt-6 text-center text-xs text-clinical-500">
      © 2026 悅恆診所 Everwell Clinic. All rights reserved. · 醫療機構開業執照：北市衛醫字第 1234567890 號
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] opacity-0 pointer-events-none transition-all duration-300 translate-y-4">
  <div class="bg-clinical-900 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3">
    <svg width="16" height="16" fill="none" stroke="#2dd4a8" stroke-width="2.5"><path d="M3 8l3 3 7-7"/></svg>
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

// Nav scroll
const nav = document.getElementById('navbar');
window.addEventListener('scroll', () => nav.classList.toggle('nav-scrolled', window.scrollY > 60));

// Mobile menu
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

// Department selection
function selectDept(el, name) {
  document.querySelectorAll('.dept-btn').forEach(btn => {
    btn.style.borderColor = '';
    btn.style.background = '';
  });
  el.style.borderColor = '#0070e0';
  el.style.background = '#f0f7ff';
  showToast('已選擇 ' + name);
}

// Scroll to booking
function showBooking() {
  document.getElementById('booking-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('booking-card').style.boxShadow = '0 0 0 3px rgba(0,112,224,0.3), 0 20px 60px rgba(0,112,224,0.15)';
  setTimeout(() => {
    document.getElementById('booking-card').style.boxShadow = '';
  }, 2000);
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

// Reveal on scroll
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });
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
