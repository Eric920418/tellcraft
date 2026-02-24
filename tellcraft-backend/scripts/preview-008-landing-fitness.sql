-- Template Preview: landing-fitness (健身房) v3
-- 金屬/碳纖維質感、斜切分割佈局、心跳脈搏動畫 signature
-- Swap Test: 斜切分割 + 脈搏線 + 碳纖維紋理 = 一看就是健身
-- Signature: 心跳脈搏 SVG 動畫貫穿整個頁面

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '605ca341-572c-4a23-8adf-b98a89ff2441',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FORGE Athletics — 鍛造你的極限</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        steel: { 50: '#f5f6f7', 100: '#e2e4e8', 200: '#c5c9d1', 300: '#a0a7b3', 400: '#747d8c', 500: '#4a5568', 600: '#2d3748', 700: '#1a202c', 800: '#111318', 900: '#0a0b0e' },
        volt: { DEFAULT: '#c8ff00', dim: '#9ecc00', glow: 'rgba(200,255,0,0.15)' },
        carbon: '#0d0d0d'
      }
    }
  }
}
</script>
<style>
  * { font-family: 'Inter', system-ui, sans-serif; }
  .font-display { font-family: 'Bebas Neue', sans-serif; }
  html { scroll-behavior: smooth; }
  body { background: #0d0d0d; color: #e2e4e8; overflow-x: hidden; }

  /* ===== SIGNATURE: 心跳脈搏動畫 ===== */
  .heartbeat-line {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: pulse-draw 3s ease-in-out infinite;
  }
  @keyframes pulse-draw {
    0% { stroke-dashoffset: 1000; }
    100% { stroke-dashoffset: 0; }
  }

  .pulse-dot {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  @keyframes pulse-glow {
    0%, 100% { r: 4; opacity: 0.6; }
    50% { r: 8; opacity: 1; }
  }

  /* ===== 碳纖維紋理 ===== */
  .carbon-texture {
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px),
      repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px);
  }

  /* ===== 斜切分割 ===== */
  .skew-cut {
    clip-path: polygon(0 8%, 100% 0, 100% 92%, 0 100%);
  }
  .skew-cut-reverse {
    clip-path: polygon(0 0, 100% 8%, 100% 100%, 0 92%);
  }

  /* ===== 金屬光澤 ===== */
  .metal-shine {
    background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 60%);
    background-size: 200% 100%;
    animation: metal-sweep 4s ease-in-out infinite;
  }
  @keyframes metal-sweep {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ===== 計數動畫 ===== */
  .stat-number {
    display: inline-block;
    transition: transform 0.3s ease;
  }
  .stat-number:hover {
    transform: scale(1.1);
    color: #c8ff00;
  }

  /* ===== 卡片效果 ===== */
  .program-card {
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    border: 1px solid rgba(255,255,255,0.06);
  }
  .program-card:hover {
    border-color: rgba(200,255,0,0.3);
    box-shadow: 0 0 40px rgba(200,255,0,0.08);
    transform: translateY(-4px);
  }

  /* ===== 入場 ===== */
  .reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .reveal.visible { opacity: 1; transform: none; }

  /* ===== 導航 ===== */
  .nav-scrolled {
    background: rgba(13,13,13,0.95) !important;
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  /* ===== 進度條動畫 ===== */
  .progress-fill {
    transition: width 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
</style>
</head>
<body class="antialiased carbon-texture">

<!-- Navigation -->
<nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex items-center justify-between h-20">
      <a href="#" class="flex items-center gap-3">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="2" y="14" width="32" height="8" rx="2" fill="#c8ff00"/>
          <rect x="8" y="8" width="4" height="20" rx="1" fill="#e2e4e8"/>
          <rect x="24" y="8" width="4" height="20" rx="1" fill="#e2e4e8"/>
          <rect x="0" y="10" width="8" height="4" rx="1" fill="#a0a7b3"/>
          <rect x="28" y="10" width="8" height="4" rx="1" fill="#a0a7b3"/>
          <rect x="0" y="22" width="8" height="4" rx="1" fill="#a0a7b3"/>
          <rect x="28" y="22" width="8" height="4" rx="1" fill="#a0a7b3"/>
        </svg>
        <span class="font-display text-2xl tracking-wider text-white">FORGE</span>
      </a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#programs" class="text-sm text-steel-300 hover:text-volt transition-colors">訓練課表</a>
        <a href="#coaches" class="text-sm text-steel-300 hover:text-volt transition-colors">教練團</a>
        <a href="#facility" class="text-sm text-steel-300 hover:text-volt transition-colors">場館</a>
        <a href="#pricing" class="text-sm text-steel-300 hover:text-volt transition-colors">方案</a>
      </div>
      <button onclick="showToast('免費體驗課預約成功！教練將於 24 小時內聯繫您')" class="hidden md:block text-sm font-bold px-6 py-3 bg-volt text-carbon rounded-lg hover:bg-volt-dim transition-colors cursor-pointer tracking-wide">
        免費體驗
      </button>
      <button onclick="toggleMobileMenu()" class="md:hidden p-2 cursor-pointer text-white">
        <svg id="menu-icon" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg id="close-icon" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" class="hidden"><path d="M6 6l12 12M6 18L18 6"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="md:hidden hidden bg-carbon border-t border-steel-700">
    <div class="px-6 py-4 space-y-3">
      <a href="#programs" onclick="closeMobileMenu()" class="block text-sm py-2 text-steel-300">訓練課表</a>
      <a href="#coaches" onclick="closeMobileMenu()" class="block text-sm py-2 text-steel-300">教練團</a>
      <a href="#facility" onclick="closeMobileMenu()" class="block text-sm py-2 text-steel-300">場館</a>
      <a href="#pricing" onclick="closeMobileMenu()" class="block text-sm py-2 text-steel-300">方案</a>
      <button onclick="showToast('免費體驗課預約成功！')" class="w-full mt-2 text-sm font-bold px-6 py-3 bg-volt text-carbon rounded-lg cursor-pointer">免費體驗</button>
    </div>
  </div>
</nav>

<!-- Hero: 斜切分割佈局 -->
<section class="relative min-h-screen flex items-center overflow-hidden pt-20">
  <!-- 脈搏線背景 SIGNATURE -->
  <div class="absolute inset-0 flex items-center">
    <svg viewBox="0 0 1440 200" class="w-full opacity-10" preserveAspectRatio="none">
      <path class="heartbeat-line" d="M0,100 L200,100 L230,100 L250,30 L270,170 L290,60 L310,140 L330,100 L500,100 L530,100 L550,20 L570,180 L590,50 L610,150 L630,100 L800,100 L830,100 L850,40 L870,160 L890,70 L910,130 L930,100 L1100,100 L1130,100 L1150,25 L1170,175 L1190,55 L1210,145 L1230,100 L1440,100"
        stroke="#c8ff00" stroke-width="2" fill="none"/>
    </svg>
  </div>

  <!-- 斜切裝飾塊 -->
  <div class="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-volt/5 to-transparent" style="clip-path: polygon(30% 0, 100% 0, 100% 100%, 0% 100%);"></div>

  <div class="relative max-w-7xl mx-auto px-6 w-full">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <div class="inline-flex items-center gap-2 mb-8">
          <span class="w-8 h-[2px] bg-volt"></span>
          <span class="text-xs font-semibold text-volt tracking-[0.3em] uppercase">Est. 2020</span>
        </div>
        <h1 class="font-display text-6xl sm:text-7xl lg:text-8xl text-white leading-none mb-6 tracking-wide">
          FORGE<br>
          YOUR<br>
          <span class="text-volt">LIMIT</span>
        </h1>
        <p class="text-steel-400 text-base max-w-md mb-10 leading-relaxed">
          不是健身房，是鍛造廠。在這裡，每一滴汗都會變成你身上的鎧甲。專業教練團 × 科學化訓練 × 運動數據追蹤。
        </p>
        <div class="flex flex-wrap gap-4">
          <button onclick="showToast('免費體驗課預約成功！')" class="px-8 py-4 bg-volt text-carbon font-bold rounded-lg hover:bg-volt-dim transition-all cursor-pointer tracking-wide text-sm">
            免費體驗課 →
          </button>
          <button onclick="showToast('課表已下載')" class="px-8 py-4 border border-steel-600 text-steel-300 font-medium rounded-lg hover:border-volt/50 hover:text-volt transition-all cursor-pointer text-sm">
            查看課表
          </button>
        </div>

        <!-- 統計數據條 -->
        <div class="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-steel-800">
          <div>
            <div class="font-display text-4xl text-white stat-number cursor-default">2,400+</div>
            <div class="text-xs text-steel-500 mt-1">活躍會員</div>
          </div>
          <div>
            <div class="font-display text-4xl text-white stat-number cursor-default">15</div>
            <div class="text-xs text-steel-500 mt-1">專業教練</div>
          </div>
          <div>
            <div class="font-display text-4xl text-white stat-number cursor-default">98%</div>
            <div class="text-xs text-steel-500 mt-1">續約率</div>
          </div>
        </div>
      </div>

      <!-- 右側：運動員剪影 + 數據面板 -->
      <div class="relative hidden lg:block">
        <div class="relative">
          <svg viewBox="0 0 400 500" class="w-full" fill="none">
            <circle cx="200" cy="250" r="180" fill="url(#hero-glow)"/>
            <defs>
              <radialGradient id="hero-glow">
                <stop offset="0%" stop-color="#c8ff00" stop-opacity="0.08"/>
                <stop offset="100%" stop-color="#c8ff00" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="200" cy="80" r="25" fill="#1a202c" stroke="#c8ff00" stroke-width="1"/>
            <path d="M200 105 L200 220" stroke="#1a202c" stroke-width="20" stroke-linecap="round"/>
            <path d="M200 130 L140 180 L120 160" stroke="#1a202c" stroke-width="16" stroke-linecap="round"/>
            <path d="M200 130 L260 180 L280 160" stroke="#1a202c" stroke-width="16" stroke-linecap="round"/>
            <path d="M200 220 L160 320 L150 380" stroke="#1a202c" stroke-width="18" stroke-linecap="round"/>
            <path d="M200 220 L240 320 L250 380" stroke="#1a202c" stroke-width="18" stroke-linecap="round"/>
            <rect x="90" y="150" width="220" height="6" rx="3" fill="#4a5568"/>
            <rect x="80" y="138" width="20" height="30" rx="3" fill="#747d8c"/>
            <rect x="300" y="138" width="20" height="30" rx="3" fill="#747d8c"/>
            <rect x="50" y="400" width="120" height="60" rx="12" fill="#111318" stroke="#c8ff00" stroke-width="0.5" opacity="0.8"/>
            <text x="68" y="425" fill="#747d8c" font-size="10" font-family="Inter">心率</text>
            <text x="68" y="448" fill="#c8ff00" font-size="22" font-weight="700" font-family="Bebas Neue">156 BPM</text>
            <rect x="230" y="400" width="120" height="60" rx="12" fill="#111318" stroke="rgba(255,255,255,0.06)" stroke-width="1" opacity="0.8"/>
            <text x="248" y="425" fill="#747d8c" font-size="10" font-family="Inter">消耗</text>
            <text x="248" y="448" fill="#e2e4e8" font-size="22" font-weight="700" font-family="Bebas Neue">847 KCAL</text>
          </svg>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Programs: 斜切 section -->
<section id="programs" class="relative py-32 skew-cut bg-steel-800/30 metal-shine -mt-16">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex items-end justify-between mb-16 reveal">
      <div>
        <span class="inline-flex items-center gap-2 mb-4">
          <span class="w-8 h-[2px] bg-volt"></span>
          <span class="text-xs font-semibold text-volt tracking-[0.3em] uppercase">Programs</span>
        </span>
        <h2 class="font-display text-5xl lg:text-6xl text-white tracking-wide">訓練課表</h2>
      </div>
      <p class="hidden md:block text-sm text-steel-400 max-w-sm">科學化週期訓練，從初學者到運動員都能找到適合的課程。</p>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="program-card rounded-2xl p-6 bg-steel-900/50 backdrop-blur-sm reveal cursor-pointer" onclick="showToast('肌力訓練課表已加入您的行程')">
        <div class="w-12 h-12 rounded-xl bg-volt/10 flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c8ff00" stroke-width="2">
            <rect x="1" y="10" width="5" height="4" rx="1"/><rect x="18" y="10" width="5" height="4" rx="1"/>
            <rect x="6" y="8" width="3" height="8" rx="1"/><rect x="15" y="8" width="3" height="8" rx="1"/>
            <path d="M9 12h6"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-white mb-2">肌力訓練</h3>
        <p class="text-sm text-steel-400 leading-relaxed mb-4">漸進式超負荷，打造純粹力量。深蹲、硬舉、臥推三大項為核心。</p>
        <div class="flex items-center justify-between text-xs text-steel-500">
          <span>60 min</span>
          <span class="text-volt">中-高強度</span>
        </div>
        <div class="mt-4 h-1 bg-steel-700 rounded-full overflow-hidden">
          <div class="progress-fill h-full bg-volt rounded-full" style="width: 0%;" data-width="80%"></div>
        </div>
      </div>

      <div class="program-card rounded-2xl p-6 bg-steel-900/50 backdrop-blur-sm reveal cursor-pointer" onclick="showToast('HIIT 間歇訓練已加入您的行程')">
        <div class="w-12 h-12 rounded-xl bg-volt/10 flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c8ff00" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-white mb-2">HIIT 間歇</h3>
        <p class="text-sm text-steel-400 leading-relaxed mb-4">高強度間歇訓練。30 秒衝刺 + 15 秒恢復，最大效率燃脂。</p>
        <div class="flex items-center justify-between text-xs text-steel-500">
          <span>45 min</span>
          <span class="text-volt">高強度</span>
        </div>
        <div class="mt-4 h-1 bg-steel-700 rounded-full overflow-hidden">
          <div class="progress-fill h-full bg-volt rounded-full" style="width: 0%;" data-width="95%"></div>
        </div>
      </div>

      <div class="program-card rounded-2xl p-6 bg-steel-900/50 backdrop-blur-sm reveal cursor-pointer" onclick="showToast('瑜伽伸展課已加入您的行程')">
        <div class="w-12 h-12 rounded-xl bg-volt/10 flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c8ff00" stroke-width="2">
            <circle cx="12" cy="4" r="2"/><path d="M12 6v6M8 18l4-6 4 6M6 12h12"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-white mb-2">瑜伽伸展</h3>
        <p class="text-sm text-steel-400 leading-relaxed mb-4">提升柔軟度與核心穩定。搭配重訓，減少受傷風險，加速恢復。</p>
        <div class="flex items-center justify-between text-xs text-steel-500">
          <span>50 min</span>
          <span class="text-volt">低-中強度</span>
        </div>
        <div class="mt-4 h-1 bg-steel-700 rounded-full overflow-hidden">
          <div class="progress-fill h-full bg-volt rounded-full" style="width: 0%;" data-width="40%"></div>
        </div>
      </div>

      <div class="program-card rounded-2xl p-6 bg-steel-900/50 backdrop-blur-sm reveal cursor-pointer" onclick="showToast('1 對 1 私教已預約成功')">
        <div class="w-12 h-12 rounded-xl bg-volt/10 flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c8ff00" stroke-width="2">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-white mb-2">1 對 1 私教</h3>
        <p class="text-sm text-steel-400 leading-relaxed mb-4">專屬訓練計劃、營養諮詢、即時動作矯正。最高效的投資。</p>
        <div class="flex items-center justify-between text-xs text-steel-500">
          <span>60 min</span>
          <span class="text-volt">客製強度</span>
        </div>
        <div class="mt-4 h-1 bg-steel-700 rounded-full overflow-hidden">
          <div class="progress-fill h-full bg-gradient-to-r from-volt/50 to-volt rounded-full" style="width: 0%;" data-width="70%"></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Coaches -->
<section id="coaches" class="py-24 lg:py-32">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="inline-flex items-center gap-2 justify-center mb-4">
        <span class="w-8 h-[2px] bg-volt"></span>
        <span class="text-xs font-semibold text-volt tracking-[0.3em] uppercase">Coaches</span>
        <span class="w-8 h-[2px] bg-volt"></span>
      </span>
      <h2 class="font-display text-5xl lg:text-6xl text-white tracking-wide">教練團</h2>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="group reveal cursor-pointer" onclick="showToast('預約陳教練的體驗課')">
        <div class="aspect-[3/4] rounded-2xl bg-gradient-to-br from-steel-800 to-steel-900 overflow-hidden relative mb-4">
          <svg viewBox="0 0 300 400" class="w-full h-full" fill="none">
            <circle cx="150" cy="120" r="50" fill="#1a202c"/>
            <rect x="110" y="170" width="80" height="120" rx="8" fill="#1a202c"/>
            <rect x="100" y="170" width="30" height="80" rx="6" fill="#111318"/>
            <rect x="170" y="170" width="30" height="80" rx="6" fill="#111318"/>
          </svg>
          <div class="absolute bottom-4 left-4 right-4 flex gap-2">
            <span class="text-[10px] px-2 py-1 bg-carbon/80 backdrop-blur-sm text-volt rounded-md">肌力</span>
            <span class="text-[10px] px-2 py-1 bg-carbon/80 backdrop-blur-sm text-steel-300 rounded-md">CrossFit</span>
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-volt/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <h3 class="text-lg font-bold text-white">陳柏安 Coach An</h3>
        <p class="text-sm text-steel-500">NSCA-CSCS 認證 · 8 年經驗</p>
      </div>

      <div class="group reveal cursor-pointer" onclick="showToast('預約林教練的體驗課')">
        <div class="aspect-[3/4] rounded-2xl bg-gradient-to-br from-steel-800 to-steel-900 overflow-hidden relative mb-4">
          <svg viewBox="0 0 300 400" class="w-full h-full" fill="none">
            <circle cx="150" cy="120" r="50" fill="#1a202c"/>
            <rect x="110" y="170" width="80" height="120" rx="8" fill="#1a202c"/>
            <rect x="100" y="170" width="30" height="80" rx="6" fill="#111318"/>
            <rect x="170" y="170" width="30" height="80" rx="6" fill="#111318"/>
          </svg>
          <div class="absolute bottom-4 left-4 right-4 flex gap-2">
            <span class="text-[10px] px-2 py-1 bg-carbon/80 backdrop-blur-sm text-volt rounded-md">瑜伽</span>
            <span class="text-[10px] px-2 py-1 bg-carbon/80 backdrop-blur-sm text-steel-300 rounded-md">皮拉提斯</span>
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-volt/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <h3 class="text-lg font-bold text-white">林雅婷 Coach Ting</h3>
        <p class="text-sm text-steel-500">RYT-500 瑜伽教師 · 6 年經驗</p>
      </div>

      <div class="group reveal cursor-pointer" onclick="showToast('預約張教練的體驗課')">
        <div class="aspect-[3/4] rounded-2xl bg-gradient-to-br from-steel-800 to-steel-900 overflow-hidden relative mb-4">
          <svg viewBox="0 0 300 400" class="w-full h-full" fill="none">
            <circle cx="150" cy="120" r="50" fill="#1a202c"/>
            <rect x="110" y="170" width="80" height="120" rx="8" fill="#1a202c"/>
            <rect x="100" y="170" width="30" height="80" rx="6" fill="#111318"/>
            <rect x="170" y="170" width="30" height="80" rx="6" fill="#111318"/>
          </svg>
          <div class="absolute bottom-4 left-4 right-4 flex gap-2">
            <span class="text-[10px] px-2 py-1 bg-carbon/80 backdrop-blur-sm text-volt rounded-md">HIIT</span>
            <span class="text-[10px] px-2 py-1 bg-carbon/80 backdrop-blur-sm text-steel-300 rounded-md">拳擊</span>
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-volt/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <h3 class="text-lg font-bold text-white">張凱文 Coach KW</h3>
        <p class="text-sm text-steel-500">ACE-CPT 認證 · 10 年經驗</p>
      </div>
    </div>
  </div>
</section>

<!-- Pricing: 斜切 -->
<section id="pricing" class="relative py-32 skew-cut-reverse bg-steel-800/20">
  <div class="max-w-5xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="inline-flex items-center gap-2 justify-center mb-4">
        <span class="w-8 h-[2px] bg-volt"></span>
        <span class="text-xs font-semibold text-volt tracking-[0.3em] uppercase">Pricing</span>
        <span class="w-8 h-[2px] bg-volt"></span>
      </span>
      <h2 class="font-display text-5xl lg:text-6xl text-white tracking-wide">投資自己</h2>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <div class="program-card rounded-2xl p-8 bg-steel-900/50 reveal">
        <h3 class="font-display text-2xl text-white tracking-wide mb-2">BASIC</h3>
        <p class="text-sm text-steel-500 mb-6">自主訓練</p>
        <div class="mb-8">
          <span class="font-display text-5xl text-white">$1,200</span>
          <span class="text-steel-500 text-sm">/月</span>
        </div>
        <ul class="space-y-3 mb-8 text-sm text-steel-400">
          <li class="flex items-center gap-3">
            <svg width="16" height="16" fill="none" stroke="#c8ff00" stroke-width="2.5"><path d="M3 8l3 3 7-7"/></svg>
            全場館使用
          </li>
          <li class="flex items-center gap-3">
            <svg width="16" height="16" fill="none" stroke="#c8ff00" stroke-width="2.5"><path d="M3 8l3 3 7-7"/></svg>
            團體課程
          </li>
          <li class="flex items-center gap-3">
            <svg width="16" height="16" fill="none" stroke="#4a5568" stroke-width="2"><path d="M4 12l8-8M4 4l8 8"/></svg>
            <span class="text-steel-600">私人教練</span>
          </li>
        </ul>
        <button onclick="showToast('Basic 方案已開通！')" class="w-full py-3 border border-steel-600 text-steel-300 font-semibold rounded-lg hover:border-volt/50 hover:text-volt transition-all cursor-pointer text-sm">
          選擇方案
        </button>
      </div>

      <div class="program-card rounded-2xl p-8 bg-steel-900/50 border-volt/30 relative reveal">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2">
          <span class="bg-volt text-carbon text-xs font-bold px-4 py-1 rounded-full">最受歡迎</span>
        </div>
        <h3 class="font-display text-2xl text-white tracking-wide mb-2">PRO</h3>
        <p class="text-sm text-steel-500 mb-6">教練指導</p>
        <div class="mb-8">
          <span class="font-display text-5xl text-volt">$2,800</span>
          <span class="text-steel-500 text-sm">/月</span>
        </div>
        <ul class="space-y-3 mb-8 text-sm text-steel-400">
          <li class="flex items-center gap-3">
            <svg width="16" height="16" fill="none" stroke="#c8ff00" stroke-width="2.5"><path d="M3 8l3 3 7-7"/></svg>
            所有 Basic 內容
          </li>
          <li class="flex items-center gap-3">
            <svg width="16" height="16" fill="none" stroke="#c8ff00" stroke-width="2.5"><path d="M3 8l3 3 7-7"/></svg>
            每月 8 堂私教課
          </li>
          <li class="flex items-center gap-3">
            <svg width="16" height="16" fill="none" stroke="#c8ff00" stroke-width="2.5"><path d="M3 8l3 3 7-7"/></svg>
            營養計劃
          </li>
        </ul>
        <button onclick="showToast('Pro 方案已開通！教練將於 24 小時內聯繫您')" class="w-full py-3 bg-volt text-carbon font-bold rounded-lg hover:bg-volt-dim transition-all cursor-pointer text-sm">
          選擇方案
        </button>
      </div>

      <div class="program-card rounded-2xl p-8 bg-steel-900/50 reveal">
        <h3 class="font-display text-2xl text-white tracking-wide mb-2">ELITE</h3>
        <p class="text-sm text-steel-500 mb-6">全面菁英</p>
        <div class="mb-8">
          <span class="font-display text-5xl text-white">$5,500</span>
          <span class="text-steel-500 text-sm">/月</span>
        </div>
        <ul class="space-y-3 mb-8 text-sm text-steel-400">
          <li class="flex items-center gap-3">
            <svg width="16" height="16" fill="none" stroke="#c8ff00" stroke-width="2.5"><path d="M3 8l3 3 7-7"/></svg>
            所有 Pro 內容
          </li>
          <li class="flex items-center gap-3">
            <svg width="16" height="16" fill="none" stroke="#c8ff00" stroke-width="2.5"><path d="M3 8l3 3 7-7"/></svg>
            無限私教課
          </li>
          <li class="flex items-center gap-3">
            <svg width="16" height="16" fill="none" stroke="#c8ff00" stroke-width="2.5"><path d="M3 8l3 3 7-7"/></svg>
            運動表現檢測
          </li>
        </ul>
        <button onclick="showToast('Elite 方案已開通！')" class="w-full py-3 border border-steel-600 text-steel-300 font-semibold rounded-lg hover:border-volt/50 hover:text-volt transition-all cursor-pointer text-sm">
          選擇方案
        </button>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="py-24 lg:py-32 relative">
  <div class="absolute top-1/2 left-0 right-0 -translate-y-1/2">
    <svg viewBox="0 0 1440 100" class="w-full opacity-20" preserveAspectRatio="none">
      <path class="heartbeat-line" d="M0,50 L400,50 L430,50 L450,10 L470,90 L490,20 L510,80 L530,50 L900,50 L930,50 L950,15 L970,85 L990,25 L1010,75 L1030,50 L1440,50" stroke="#c8ff00" stroke-width="2" fill="none"/>
    </svg>
  </div>

  <div class="relative max-w-3xl mx-auto px-6 text-center">
    <h2 class="font-display text-5xl lg:text-7xl text-white tracking-wide mb-6">
      START<br><span class="text-volt">FORGING</span>
    </h2>
    <p class="text-steel-400 text-base mb-10 max-w-lg mx-auto">第一堂體驗課完全免費。帶上運動鞋，其他的交給我們。</p>
    <button onclick="showToast('免費體驗課預約成功！我們將於 24 小時內聯繫您')" class="px-10 py-4 bg-volt text-carbon font-bold rounded-lg hover:bg-volt-dim transition-all cursor-pointer tracking-wide text-base">
      立即預約免費體驗 →
    </button>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-steel-800 py-12">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex flex-col md:flex-row justify-between items-center gap-6">
      <div class="flex items-center gap-3">
        <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
          <rect x="2" y="14" width="32" height="8" rx="2" fill="#c8ff00"/>
          <rect x="8" y="8" width="4" height="20" rx="1" fill="#e2e4e8"/>
          <rect x="24" y="8" width="4" height="20" rx="1" fill="#e2e4e8"/>
        </svg>
        <span class="font-display text-lg tracking-wider text-white">FORGE</span>
      </div>
      <div class="flex gap-8 text-sm text-steel-500">
        <a href="#" onclick="showToast('隱私政策')" class="hover:text-volt transition-colors cursor-pointer">隱私政策</a>
        <a href="#" onclick="showToast('服務條款')" class="hover:text-volt transition-colors cursor-pointer">服務條款</a>
        <a href="#" onclick="showToast('前往 Instagram')" class="hover:text-volt transition-colors cursor-pointer">Instagram</a>
      </div>
      <p class="text-xs text-steel-600">© 2026 FORGE Athletics</p>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] opacity-0 pointer-events-none transition-all duration-300 translate-y-4">
  <div class="bg-carbon border border-volt/30 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3">
    <svg width="16" height="16" fill="none" stroke="#c8ff00" stroke-width="2.5"><path d="M3 8l3 3 7-7"/></svg>
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

const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      e.target.querySelectorAll('.progress-fill').forEach(bar => {
        const w = bar.dataset.width;
        if (w) setTimeout(() => { bar.style.width = w; }, 300);
      });
    }
  });
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
