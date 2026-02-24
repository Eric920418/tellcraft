-- Template Preview: landing-cafe (咖啡廳) v3
-- 手沖咖啡意象、暖木質色系、蒸氣動畫 signature
-- 非標準佈局：水平滾動菜單 + 偏移重疊 section + 手繪 SVG 裝飾
-- Swap Test: 蒸氣動畫 + 咖啡豆紋路 + 木紋色系 = 一看就是咖啡廳
-- Signature: 蒸氣從杯子升起的 CSS 動畫

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'ade3d3f6-bf0f-44be-8a0b-473a378f3241',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>山霧珈琲 Yamakiri Coffee — 海拔 800 公尺的一杯日常</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif']
      },
      colors: {
        bark: { 50: '#faf6f1', 100: '#f0e6d6', 200: '#e0ccad', 300: '#c9a97a', 400: '#b08b52', 500: '#8b6914', 600: '#6b4f10', 700: '#4a370b', 800: '#2e2207', 900: '#1a1304' },
        roast: { light: '#c4956a', medium: '#8b5e3c', dark: '#3b2314', espresso: '#1e110a' },
        cream: '#faf6f1',
        latte: '#e8d5c0'
      }
    }
  }
}
</script>
<style>
  * { font-family: 'DM Sans', system-ui, sans-serif; }
  .font-display { font-family: 'Cormorant Garamond', serif; }
  html { scroll-behavior: smooth; }
  body { background: #faf6f1; overflow-x: hidden; }

  /* ===== SIGNATURE: 蒸氣動畫 ===== */
  .steam-container { position: relative; width: 60px; height: 80px; }
  .steam {
    position: absolute;
    bottom: 0;
    width: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,0.6);
    filter: blur(6px);
    animation: steam-rise 3s ease-out infinite;
    opacity: 0;
  }
  .steam:nth-child(1) { left: 10px; animation-delay: 0s; height: 20px; }
  .steam:nth-child(2) { left: 26px; animation-delay: 0.8s; height: 28px; }
  .steam:nth-child(3) { left: 42px; animation-delay: 1.6s; height: 16px; }
  .steam:nth-child(4) { left: 18px; animation-delay: 2.2s; height: 24px; }
  .steam:nth-child(5) { left: 36px; animation-delay: 0.4s; height: 18px; }

  @keyframes steam-rise {
    0%   { transform: translateY(0) scaleX(1); opacity: 0; }
    15%  { opacity: 0.8; }
    50%  { transform: translateY(-60px) scaleX(1.8); opacity: 0.4; }
    100% { transform: translateY(-120px) scaleX(2.5); opacity: 0; }
  }

  /* ===== 咖啡豆紋路背景 ===== */
  .bean-texture {
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 15c-3 0-5.5 2-6.5 5s-.5 6.5 1.5 8.5c2 2 5.5 2.5 8.5 1.5s5-3.5 5-6.5c0-4.5-4-8.5-8.5-8.5zm0 2c1 2 .5 4-.5 5s-3 1.5-4 .5 0-3.5 1-4.5 2.5-1.5 3.5-1z' fill='%238b6914' opacity='0.04'/%3E%3C/svg%3E");
  }

  /* ===== 手繪底線裝飾 ===== */
  .hand-underline {
    position: relative;
    display: inline-block;
  }
  .hand-underline::after {
    content: '';
    position: absolute;
    left: -4px;
    right: -4px;
    bottom: -4px;
    height: 8px;
    background: url("data:image/svg+xml,%3Csvg width='200' height='8' viewBox='0 0 200 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 5 Q25 1 50 4 T100 5 T150 3 T200 5' stroke='%23c4956a' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") repeat-x;
    background-size: 200px 8px;
  }

  /* ===== 滴漏動畫 ===== */
  .drip-line {
    width: 2px;
    background: linear-gradient(to bottom, #c4956a, transparent);
    animation: drip 4s ease-in-out infinite;
  }
  @keyframes drip {
    0%, 100% { height: 0; opacity: 0; }
    20% { opacity: 1; }
    60% { height: 80px; opacity: 1; }
    80% { height: 80px; opacity: 0; }
  }

  /* ===== 菜單卡片 ===== */
  .menu-item {
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .menu-item:hover {
    transform: rotate(-2deg) scale(1.03);
  }

  /* ===== 入場動畫 ===== */
  .reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  .reveal.visible { opacity: 1; transform: none; }
  .reveal-left {
    opacity: 0;
    transform: translateX(-40px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  .reveal-left.visible { opacity: 1; transform: none; }
  .reveal-right {
    opacity: 0;
    transform: translateX(40px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  .reveal-right.visible { opacity: 1; transform: none; }

  /* ===== 圓形圖片框 ===== */
  .organic-shape {
    border-radius: 60% 40% 50% 50% / 50% 60% 40% 50%;
    transition: border-radius 0.6s ease;
  }
  .organic-shape:hover {
    border-radius: 40% 60% 50% 50% / 60% 40% 50% 60%;
  }

  /* ===== 導航 ===== */
  .nav-scrolled {
    background: rgba(250,246,241,0.95) !important;
    backdrop-filter: blur(12px);
    box-shadow: 0 1px 0 rgba(139,105,20,0.08);
  }

  /* ===== 水平滾動菜單 ===== */
  .menu-scroll {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .menu-scroll::-webkit-scrollbar { display: none; }

  /* ===== 杯子 SVG ===== */
  .cup-wobble {
    animation: wobble 4s ease-in-out infinite;
  }
  @keyframes wobble {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(2deg); }
    75% { transform: rotate(-2deg); }
  }
</style>
</head>
<body class="text-roast-dark antialiased">

<!-- Navigation -->
<nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-500">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between h-20">
      <a href="#" class="flex items-center gap-3">
        <svg class="cup-wobble" width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M6 12h16v2c0 6-3 10-8 10S6 20 6 14v-2z" fill="#3b2314"/>
          <path d="M22 14h3c1.5 0 3 1 3 3s-1.5 3-3 3h-3" stroke="#3b2314" stroke-width="2" fill="none"/>
          <ellipse cx="14" cy="12" rx="9" ry="2" fill="#8b5e3c"/>
          <rect x="8" y="26" width="12" height="2" rx="1" fill="#c4956a"/>
        </svg>
        <span class="font-display text-xl font-bold tracking-wide">山霧珈琲</span>
      </a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#story" class="text-sm font-medium text-roast-medium hover:text-roast-dark transition-colors">我們的故事</a>
        <a href="#menu" class="text-sm font-medium text-roast-medium hover:text-roast-dark transition-colors">飲品</a>
        <a href="#space" class="text-sm font-medium text-roast-medium hover:text-roast-dark transition-colors">空間</a>
        <a href="#visit" class="text-sm font-medium text-roast-medium hover:text-roast-dark transition-colors">造訪</a>
      </div>
      <button onclick="showToast('線上訂位即將開放')" class="hidden md:block text-sm font-semibold px-5 py-2.5 bg-roast-dark text-cream rounded-full hover:bg-roast-espresso transition-colors cursor-pointer">
        預約座位
      </button>
      <button onclick="toggleMobileMenu()" class="md:hidden p-2 cursor-pointer">
        <svg id="menu-icon" width="24" height="24" fill="none" stroke="#3b2314" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg id="close-icon" width="24" height="24" fill="none" stroke="#3b2314" stroke-width="2" class="hidden"><path d="M6 6l12 12M6 18L18 6"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="md:hidden hidden bg-cream border-t border-bark-200">
    <div class="px-6 py-4 space-y-3">
      <a href="#story" onclick="closeMobileMenu()" class="block text-sm font-medium py-2">我們的故事</a>
      <a href="#menu" onclick="closeMobileMenu()" class="block text-sm font-medium py-2">飲品</a>
      <a href="#space" onclick="closeMobileMenu()" class="block text-sm font-medium py-2">空間</a>
      <a href="#visit" onclick="closeMobileMenu()" class="block text-sm font-medium py-2">造訪</a>
    </div>
  </div>
</nav>

<!-- Hero: 非居中式，偏移重疊佈局 -->
<section class="relative min-h-screen flex items-end pb-20 pt-32 overflow-hidden bean-texture">
  <!-- 背景大圓形裝飾 -->
  <div class="absolute top-1/2 right-0 translate-x-1/3 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-latte/40"></div>

  <div class="relative max-w-6xl mx-auto px-6 w-full">
    <div class="grid lg:grid-cols-12 gap-8 items-end">
      <!-- 左側文字 -->
      <div class="lg:col-span-5 lg:pb-12">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-bark-100 rounded-full mb-8">
          <span class="w-2 h-2 bg-roast-light rounded-full"></span>
          <span class="text-xs font-medium text-bark-600 tracking-wide">海拔 800m · 阿里山產區直送</span>
        </div>
        <h1 class="font-display text-5xl lg:text-7xl font-bold leading-[1.1] mb-6 text-roast-espresso">
          每一杯，<br>
          都是一座<br>
          <span class="hand-underline italic text-roast-medium">山的故事</span>
        </h1>
        <p class="text-base text-bark-500 leading-relaxed max-w-md mb-10">
          我們在嘉義海拔 800 公尺的茶園旁烘豆。晨霧、紅土、檜木香，這些風土都會留在你的杯子裡。
        </p>
        <div class="flex items-center gap-4">
          <button onclick="showToast('歡迎來坐！已為您預留座位')" class="px-8 py-4 bg-roast-dark text-cream font-semibold rounded-full hover:bg-roast-espresso transition-all hover:shadow-lg hover:shadow-roast-dark/20 cursor-pointer">
            今日菜單
          </button>
          <a href="#story" class="flex items-center gap-2 text-sm font-medium text-bark-500 hover:text-roast-dark transition-colors">
            <span>認識我們</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h8M9 4l4 4-4 4"/></svg>
          </a>
        </div>
      </div>

      <!-- 右側：咖啡杯視覺 + 蒸氣動畫 -->
      <div class="lg:col-span-7 relative">
        <div class="relative">
          <!-- 蒸氣 SIGNATURE -->
          <div class="steam-container absolute -top-20 left-1/2 -translate-x-1/2 z-10">
            <div class="steam"></div>
            <div class="steam"></div>
            <div class="steam"></div>
            <div class="steam"></div>
            <div class="steam"></div>
          </div>
          <!-- 咖啡杯圖示 -->
          <div class="organic-shape w-full aspect-square max-w-lg mx-auto bg-gradient-to-br from-roast-light via-bark-300 to-roast-medium flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 300 300" class="w-3/4 h-3/4" fill="none">
              <!-- 杯碟 -->
              <ellipse cx="140" cy="240" rx="100" ry="20" fill="#e0ccad"/>
              <!-- 杯身 -->
              <path d="M70 120 h140 l-15 100 c-2 14-14 24-28 24 H113 c-14 0-26-10-28-24 L70 120z" fill="#faf6f1" stroke="#c9a97a" stroke-width="2"/>
              <!-- 把手 -->
              <path d="M210 140 c20 0 35 15 35 35 s-15 35-35 35" stroke="#c9a97a" stroke-width="3" fill="none"/>
              <!-- 咖啡液面 -->
              <ellipse cx="140" cy="130" rx="65" ry="12" fill="#8b5e3c"/>
              <!-- 拉花 -->
              <path d="M140 124 Q130 128 140 132 Q150 128 140 124z" fill="#e8d5c0" opacity="0.7"/>
              <path d="M140 120 Q125 126 140 134 Q155 126 140 120z" fill="#e8d5c0" opacity="0.4"/>
              <!-- 咖啡豆裝飾 -->
              <g transform="translate(60, 50) rotate(-20)">
                <ellipse cx="12" cy="8" rx="10" ry="14" fill="#3b2314"/>
                <path d="M12 0 Q8 8 12 16" stroke="#1e110a" stroke-width="1.5" fill="none"/>
              </g>
              <g transform="translate(230, 70) rotate(15)">
                <ellipse cx="12" cy="8" rx="8" ry="11" fill="#3b2314" opacity="0.6"/>
                <path d="M12 0 Q9 6 12 14" stroke="#1e110a" stroke-width="1" fill="none" opacity="0.6"/>
              </g>
            </svg>
          </div>
        </div>

        <!-- 偏移的小卡片 -->
        <div class="absolute -bottom-4 -left-4 lg:left-8 bg-white rounded-2xl shadow-xl shadow-bark-200/50 p-5 max-w-[200px]">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-roast-dark flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#faf6f1" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <div class="text-xs font-semibold text-roast-dark">單品手沖</div>
              <div class="text-[10px] text-bark-400">現點現沖</div>
            </div>
          </div>
          <div class="text-xs text-bark-500">阿里山日曬 · 淺焙蜜處理</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 底部滴漏裝飾 -->
  <div class="absolute bottom-0 left-1/2 -translate-x-1/2">
    <div class="drip-line mx-auto"></div>
  </div>
</section>

<!-- Story 故事：非對稱佈局 -->
<section id="story" class="py-24 lg:py-32">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid lg:grid-cols-12 gap-16 items-center">
      <!-- 左側圖片群組 -->
      <div class="lg:col-span-5 relative reveal-left">
        <div class="organic-shape w-full aspect-[4/5] bg-gradient-to-br from-bark-200 to-roast-light overflow-hidden">
          <div class="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 200 250" fill="none" class="w-2/3">
              <!-- 山景剪影 -->
              <path d="M0 200 L40 120 L70 160 L100 80 L140 140 L180 100 L200 200 Z" fill="#4a370b" opacity="0.15"/>
              <path d="M0 200 L50 150 L80 180 L120 110 L160 160 L200 130 L200 200 Z" fill="#6b4f10" opacity="0.1"/>
              <!-- 咖啡樹 -->
              <circle cx="100" cy="100" r="35" fill="#8b6914" opacity="0.2"/>
              <circle cx="100" cy="85" r="25" fill="#8b6914" opacity="0.25"/>
              <rect x="98" y="120" width="4" height="50" fill="#4a370b" opacity="0.3"/>
              <!-- 咖啡果實 -->
              <circle cx="85" cy="95" r="5" fill="#c4956a"/>
              <circle cx="115" cy="90" r="4" fill="#c4956a"/>
              <circle cx="95" cy="78" r="4.5" fill="#b08b52"/>
            </svg>
          </div>
        </div>
        <!-- 偏移年份標記 -->
        <div class="absolute -bottom-6 -right-6 bg-roast-dark text-cream px-6 py-4 rounded-2xl">
          <div class="font-display text-3xl font-bold">2019</div>
          <div class="text-xs text-cream/70">創立於嘉義</div>
        </div>
      </div>

      <!-- 右側文字 -->
      <div class="lg:col-span-6 lg:col-start-7 reveal-right">
        <span class="inline-block text-xs font-semibold text-bark-500 tracking-[0.2em] uppercase mb-4">Our Story</span>
        <h2 class="font-display text-4xl lg:text-5xl font-bold leading-tight mb-8 text-roast-espresso">
          從一顆種子<br>到你手中的溫度
        </h2>
        <div class="space-y-6 text-bark-500 leading-relaxed">
          <p>
            2019 年，我們在阿里山石棹的茶園旁找到一塊被遺忘的坡地。海拔 800 公尺的晨霧、火山紅土、夏天的午後雷雨——這裡擁有種出好咖啡的一切條件。
          </p>
          <p>
            我們不追求烘焙的花俏技巧。每一批豆子，都用最簡單的方式處理：日曬、蜜處理、水洗。讓風土自己說話。
          </p>
        </div>
        <!-- 數據條 -->
        <div class="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-bark-200">
          <div>
            <div class="font-display text-3xl font-bold text-roast-dark">800m</div>
            <div class="text-xs text-bark-400 mt-1">種植海拔</div>
          </div>
          <div>
            <div class="font-display text-3xl font-bold text-roast-dark">72hr</div>
            <div class="text-xs text-bark-400 mt-1">從烘焙到出杯</div>
          </div>
          <div>
            <div class="font-display text-3xl font-bold text-roast-dark">4</div>
            <div class="text-xs text-bark-400 mt-1">處理法</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Menu 飲品：水平捲動 + 手寫風價格 -->
<section id="menu" class="py-24 lg:py-32 bg-roast-espresso text-cream overflow-hidden">
  <div class="max-w-6xl mx-auto px-6 mb-12">
    <div class="flex items-end justify-between">
      <div class="reveal">
        <span class="inline-block text-xs font-semibold text-bark-300 tracking-[0.2em] uppercase mb-4">Menu</span>
        <h2 class="font-display text-4xl lg:text-5xl font-bold">今日飲品</h2>
      </div>
      <div class="hidden md:flex gap-3 reveal">
        <button onclick="scrollMenu(-1)" class="w-10 h-10 rounded-full border border-cream/20 flex items-center justify-center hover:bg-cream/10 transition-colors cursor-pointer">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 4L6 8l4 4"/></svg>
        </button>
        <button onclick="scrollMenu(1)" class="w-10 h-10 rounded-full border border-cream/20 flex items-center justify-center hover:bg-cream/10 transition-colors cursor-pointer">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4l4 4-4 4"/></svg>
        </button>
      </div>
    </div>
  </div>

  <!-- 水平滾動菜單 -->
  <div id="menu-scroll" class="menu-scroll flex gap-6 overflow-x-auto px-6 pb-8 snap-x snap-mandatory" style="scroll-padding: 24px;">
    <!-- 手沖單品 -->
    <div class="menu-item flex-none w-72 snap-start bg-roast-dark rounded-3xl p-6 group cursor-pointer" onclick="showToast('阿里山日曬・淺焙蜜香，NT$180')">
      <div class="w-full aspect-square rounded-2xl bg-gradient-to-br from-roast-medium to-bark-400 mb-5 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 100 100" class="w-16 h-16">
          <circle cx="50" cy="60" r="30" fill="none" stroke="#faf6f1" stroke-width="1.5"/>
          <path d="M35 60 Q42 40 50 60 Q58 40 65 60" stroke="#faf6f1" stroke-width="1.5" fill="none"/>
          <path d="M50 30 Q48 20 50 10" stroke="#faf6f1" stroke-width="1" opacity="0.5"/>
          <path d="M45 32 Q42 22 44 14" stroke="#faf6f1" stroke-width="1" opacity="0.3"/>
          <path d="M55 32 Q58 22 56 14" stroke="#faf6f1" stroke-width="1" opacity="0.3"/>
        </svg>
      </div>
      <div class="flex items-start justify-between mb-2">
        <h3 class="text-lg font-semibold">手沖單品</h3>
        <span class="font-display text-2xl font-bold text-roast-light">180</span>
      </div>
      <p class="text-sm text-cream/50 leading-relaxed">阿里山日曬・淺焙蜜香<br>柑橘・焦糖・黑巧克力尾韻</p>
      <div class="mt-4 flex gap-2">
        <span class="text-[10px] px-2 py-1 rounded-full border border-cream/20 text-cream/40">淺焙</span>
        <span class="text-[10px] px-2 py-1 rounded-full border border-cream/20 text-cream/40">日曬</span>
      </div>
    </div>

    <!-- 山霧拿鐵 -->
    <div class="menu-item flex-none w-72 snap-start bg-roast-dark rounded-3xl p-6 cursor-pointer" onclick="showToast('山霧拿鐵・柔滑牛奶遇上淺焙果酸，NT$160')">
      <div class="w-full aspect-square rounded-2xl bg-gradient-to-br from-latte to-bark-200 mb-5 flex items-center justify-center">
        <svg viewBox="0 0 100 100" class="w-16 h-16">
          <path d="M30 75 L35 35 h30 l5 40 z" fill="#faf6f1" stroke="#c9a97a" stroke-width="1.5"/>
          <ellipse cx="50" cy="35" rx="17" ry="4" fill="#e8d5c0"/>
          <path d="M65 45 c8 0 14 6 14 14 s-6 14-14 14" stroke="#c9a97a" stroke-width="1.5" fill="none"/>
          <path d="M50 32 Q46 35 50 38 Q54 35 50 32z" fill="#c4956a" opacity="0.5"/>
        </svg>
      </div>
      <div class="flex items-start justify-between mb-2">
        <h3 class="text-lg font-semibold">山霧拿鐵</h3>
        <span class="font-display text-2xl font-bold text-roast-light">160</span>
      </div>
      <p class="text-sm text-cream/50 leading-relaxed">柔滑牛奶遇上淺焙果酸<br>肉桂・奶油・細緻泡沫</p>
      <div class="mt-4 flex gap-2">
        <span class="text-[10px] px-2 py-1 rounded-full border border-cream/20 text-cream/40">招牌</span>
        <span class="text-[10px] px-2 py-1 rounded-full border border-cream/20 text-cream/40">牛奶</span>
      </div>
    </div>

    <!-- 冰釀冷萃 -->
    <div class="menu-item flex-none w-72 snap-start bg-roast-dark rounded-3xl p-6 cursor-pointer" onclick="showToast('冰釀冷萃・12 小時低溫萃取，NT$150')">
      <div class="w-full aspect-square rounded-2xl bg-gradient-to-br from-bark-300 to-roast-dark mb-5 flex items-center justify-center">
        <svg viewBox="0 0 100 100" class="w-16 h-16">
          <rect x="32" y="25" width="36" height="55" rx="4" fill="none" stroke="#faf6f1" stroke-width="1.5"/>
          <rect x="35" y="40" width="30" height="37" rx="2" fill="#8b5e3c" opacity="0.5"/>
          <circle cx="50" cy="55" r="3" fill="#faf6f1" opacity="0.3"/>
          <circle cx="42" cy="50" r="2" fill="#faf6f1" opacity="0.2"/>
          <circle cx="56" cy="60" r="2.5" fill="#faf6f1" opacity="0.2"/>
          <path d="M44 22 v-6 M50 22 v-8 M56 22 v-5" stroke="#faf6f1" stroke-width="1" opacity="0.4"/>
        </svg>
      </div>
      <div class="flex items-start justify-between mb-2">
        <h3 class="text-lg font-semibold">冰釀冷萃</h3>
        <span class="font-display text-2xl font-bold text-roast-light">150</span>
      </div>
      <p class="text-sm text-cream/50 leading-relaxed">12 小時低溫萃取<br>黑醋栗・堅果・絲綢口感</p>
      <div class="mt-4 flex gap-2">
        <span class="text-[10px] px-2 py-1 rounded-full border border-cream/20 text-cream/40">冰飲</span>
        <span class="text-[10px] px-2 py-1 rounded-full border border-cream/20 text-cream/40">冷萃</span>
      </div>
    </div>

    <!-- 黑糖 Dirty -->
    <div class="menu-item flex-none w-72 snap-start bg-roast-dark rounded-3xl p-6 cursor-pointer" onclick="showToast('黑糖 Dirty・視覺系漸層，NT$170')">
      <div class="w-full aspect-square rounded-2xl bg-gradient-to-b from-cream via-roast-light to-roast-espresso mb-5 flex items-center justify-center">
        <svg viewBox="0 0 100 100" class="w-16 h-16">
          <rect x="30" y="20" width="40" height="65" rx="6" fill="none" stroke="#faf6f1" stroke-width="1.5"/>
          <rect x="33" y="23" width="34" height="59" rx="4" fill="url(#dirty-grad)"/>
          <defs>
            <linearGradient id="dirty-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#faf6f1"/>
              <stop offset="40%" stop-color="#e8d5c0"/>
              <stop offset="70%" stop-color="#8b5e3c"/>
              <stop offset="100%" stop-color="#1e110a"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div class="flex items-start justify-between mb-2">
        <h3 class="text-lg font-semibold">黑糖 Dirty</h3>
        <span class="font-display text-2xl font-bold text-roast-light">170</span>
      </div>
      <p class="text-sm text-cream/50 leading-relaxed">視覺系漸層咖啡<br>黑糖・濃縮・鮮奶碰撞</p>
      <div class="mt-4 flex gap-2">
        <span class="text-[10px] px-2 py-1 rounded-full border border-cream/20 text-cream/40">人氣</span>
        <span class="text-[10px] px-2 py-1 rounded-full border border-cream/20 text-cream/40">甜味</span>
      </div>
    </div>

    <!-- 季節限定 -->
    <div class="menu-item flex-none w-72 snap-start bg-roast-dark rounded-3xl p-6 cursor-pointer" onclick="showToast('桂花金萱拿鐵・季節限定，NT$190')">
      <div class="w-full aspect-square rounded-2xl bg-gradient-to-br from-amber-200/40 to-bark-400 mb-5 flex items-center justify-center">
        <svg viewBox="0 0 100 100" class="w-16 h-16">
          <circle cx="50" cy="50" r="25" fill="none" stroke="#faf6f1" stroke-width="1"/>
          <circle cx="50" cy="50" r="18" fill="none" stroke="#faf6f1" stroke-width="1" opacity="0.5"/>
          <path d="M50 32 L53 43 L64 43 L55 50 L58 61 L50 54 L42 61 L45 50 L36 43 L47 43Z" fill="#faf6f1" opacity="0.3"/>
          <text x="50" y="54" text-anchor="middle" fill="#faf6f1" font-size="8" font-family="serif">限定</text>
        </svg>
      </div>
      <div class="flex items-start justify-between mb-2">
        <h3 class="text-lg font-semibold">桂花金萱拿鐵</h3>
        <span class="font-display text-2xl font-bold text-roast-light">190</span>
      </div>
      <p class="text-sm text-cream/50 leading-relaxed">在地金萱茶 × 桂花蜜<br>花香・茶韻・季節限定</p>
      <div class="mt-4 flex gap-2">
        <span class="text-[10px] px-2 py-1 rounded-full bg-roast-light/20 text-roast-light">季節限定</span>
      </div>
    </div>
  </div>
</section>

<!-- Space 空間 -->
<section id="space" class="py-24 lg:py-32 bean-texture">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="inline-block text-xs font-semibold text-bark-500 tracking-[0.2em] uppercase mb-4">Our Space</span>
      <h2 class="font-display text-4xl lg:text-5xl font-bold text-roast-espresso">坐下來，慢慢喝</h2>
    </div>

    <!-- Bento 風格空間展示 -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <div class="col-span-2 row-span-2 rounded-3xl overflow-hidden bg-gradient-to-br from-bark-200 to-latte aspect-square flex items-center justify-center reveal group cursor-pointer" onclick="showToast('歡迎來到吧台區')">
        <div class="text-center p-8">
          <svg viewBox="0 0 120 80" class="w-32 mx-auto mb-4" fill="none">
            <!-- 吧台剪影 -->
            <rect x="10" y="40" width="100" height="5" rx="2" fill="#4a370b" opacity="0.3"/>
            <rect x="20" y="20" width="8" height="25" rx="2" fill="#8b5e3c" opacity="0.4"/>
            <rect x="35" y="15" width="8" height="30" rx="2" fill="#8b5e3c" opacity="0.3"/>
            <rect x="50" y="22" width="8" height="23" rx="2" fill="#8b5e3c" opacity="0.35"/>
            <circle cx="80" cy="32" r="8" fill="#c4956a" opacity="0.3"/>
            <rect x="10" y="45" width="100" height="30" rx="4" fill="#4a370b" opacity="0.1"/>
          </svg>
          <h3 class="font-display text-2xl font-bold text-roast-espresso mb-2">吧台區</h3>
          <p class="text-sm text-bark-500">看手沖的最佳位置</p>
        </div>
      </div>

      <div class="rounded-3xl overflow-hidden bg-gradient-to-br from-roast-dark to-roast-espresso p-6 flex flex-col justify-end reveal cursor-pointer" onclick="showToast('窗邊有陽光的閱讀區')">
        <h3 class="font-display text-xl font-bold text-cream mb-1">窗邊區</h3>
        <p class="text-xs text-cream/50">陽光 · 閱讀 · 發呆</p>
      </div>

      <div class="rounded-3xl overflow-hidden bg-latte p-6 flex flex-col justify-end reveal cursor-pointer" onclick="showToast('適合辦公與討論的長桌')">
        <h3 class="font-display text-xl font-bold text-roast-espresso mb-1">長桌區</h3>
        <p class="text-xs text-bark-500">工作 · 討論 · 充電</p>
      </div>

      <div class="rounded-3xl overflow-hidden bg-bark-100 p-6 flex flex-col justify-end reveal cursor-pointer" onclick="showToast('包場活動歡迎洽詢')">
        <h3 class="font-display text-xl font-bold text-roast-espresso mb-1">包場空間</h3>
        <p class="text-xs text-bark-500">最多 12 人 · 投影設備</p>
      </div>

      <div class="rounded-3xl overflow-hidden bg-gradient-to-br from-bark-300 to-roast-medium p-6 flex flex-col justify-end reveal cursor-pointer" onclick="showToast('手沖教學每月開班')">
        <h3 class="font-display text-xl font-bold text-cream mb-1">手沖教室</h3>
        <p class="text-xs text-cream/60">每月開班 · 豆子帶回家</p>
      </div>
    </div>
  </div>
</section>

<!-- Visit 造訪 -->
<section id="visit" class="py-24 lg:py-32">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div class="reveal-left">
        <span class="inline-block text-xs font-semibold text-bark-500 tracking-[0.2em] uppercase mb-4">Visit Us</span>
        <h2 class="font-display text-4xl lg:text-5xl font-bold leading-tight mb-8 text-roast-espresso">
          來山上<br>坐一下午
        </h2>

        <div class="space-y-8">
          <!-- 地址 -->
          <div class="flex gap-4">
            <div class="w-12 h-12 rounded-2xl bg-bark-100 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b6914" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <div class="font-semibold text-roast-dark mb-1">地址</div>
              <div class="text-sm text-bark-500">嘉義縣竹崎鄉石棹 38-5 號<br>阿里山公路旁，茶園入口處</div>
            </div>
          </div>

          <!-- 營業時間 -->
          <div class="flex gap-4">
            <div class="w-12 h-12 rounded-2xl bg-bark-100 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b6914" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div>
              <div class="font-semibold text-roast-dark mb-1">營業時間</div>
              <div class="text-sm text-bark-500">
                週二至週日 09:00 — 18:00<br>
                <span class="text-bark-400">週一公休（遇國定假日正常營業）</span>
              </div>
            </div>
          </div>

          <!-- 電話 -->
          <div class="flex gap-4">
            <div class="w-12 h-12 rounded-2xl bg-bark-100 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b6914" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div>
              <div class="font-semibold text-roast-dark mb-1">電話</div>
              <div class="text-sm text-bark-500">05-256-1838</div>
            </div>
          </div>
        </div>

        <button onclick="showToast('已複製地址到剪貼簿')" class="mt-10 inline-flex items-center gap-2 px-6 py-3 bg-roast-dark text-cream font-semibold rounded-full hover:bg-roast-espresso transition-colors cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          導航前往
        </button>
      </div>

      <!-- 右側地圖模擬 -->
      <div class="reveal-right">
        <div class="rounded-3xl overflow-hidden bg-bark-100 aspect-square relative">
          <!-- 等高線地圖裝飾 -->
          <svg viewBox="0 0 400 400" class="w-full h-full" fill="none">
            <ellipse cx="200" cy="200" rx="150" ry="120" stroke="#c9a97a" stroke-width="0.5" opacity="0.3"/>
            <ellipse cx="200" cy="200" rx="120" ry="95" stroke="#c9a97a" stroke-width="0.5" opacity="0.35"/>
            <ellipse cx="200" cy="195" rx="90" ry="70" stroke="#c9a97a" stroke-width="0.5" opacity="0.4"/>
            <ellipse cx="200" cy="190" rx="60" ry="45" stroke="#c9a97a" stroke-width="0.5" opacity="0.45"/>
            <ellipse cx="200" cy="185" rx="30" ry="22" stroke="#c9a97a" stroke-width="0.5" opacity="0.5"/>
            <!-- 標記點 -->
            <circle cx="200" cy="185" r="8" fill="#3b2314"/>
            <circle cx="200" cy="185" r="4" fill="#faf6f1"/>
            <text x="200" y="170" text-anchor="middle" fill="#3b2314" font-size="11" font-weight="600" font-family="DM Sans">山霧珈琲</text>
            <!-- 路線 -->
            <path d="M60 340 Q120 300 160 260 Q200 220 200 185" stroke="#8b6914" stroke-width="1.5" stroke-dasharray="6 4" fill="none"/>
            <text x="80" y="350" fill="#8b5e3c" font-size="9" font-family="DM Sans">阿里山公路</text>
          </svg>
          <!-- 海拔標記 -->
          <div class="absolute top-6 right-6 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2">
            <div class="text-xs text-bark-500">海拔</div>
            <div class="font-display text-xl font-bold text-roast-dark">800m</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-roast-espresso text-cream/60 py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
      <div class="lg:col-span-2">
        <div class="flex items-center gap-3 mb-4">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M6 12h16v2c0 6-3 10-8 10S6 20 6 14v-2z" fill="#faf6f1"/>
            <path d="M22 14h3c1.5 0 3 1 3 3s-1.5 3-3 3h-3" stroke="#faf6f1" stroke-width="2" fill="none"/>
            <ellipse cx="14" cy="12" rx="9" ry="2" fill="#c4956a"/>
          </svg>
          <span class="font-display text-xl font-bold text-cream">山霧珈琲</span>
        </div>
        <p class="text-sm leading-relaxed max-w-sm">在海拔 800 公尺的山上，我們用最簡單的方式，做最好喝的咖啡。每一杯，都是一座山的故事。</p>
      </div>
      <div>
        <h4 class="text-cream font-semibold text-sm mb-4">快速連結</h4>
        <ul class="space-y-3 text-sm">
          <li><a href="#story" class="hover:text-cream transition-colors">我們的故事</a></li>
          <li><a href="#menu" class="hover:text-cream transition-colors">飲品菜單</a></li>
          <li><a href="#space" class="hover:text-cream transition-colors">空間介紹</a></li>
          <li><a href="#visit" class="hover:text-cream transition-colors">造訪我們</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-cream font-semibold text-sm mb-4">社群</h4>
        <ul class="space-y-3 text-sm">
          <li><a href="#" onclick="showToast('前往 Instagram')" class="hover:text-cream transition-colors cursor-pointer">Instagram</a></li>
          <li><a href="#" onclick="showToast('前往 Facebook')" class="hover:text-cream transition-colors cursor-pointer">Facebook</a></li>
          <li><a href="#" onclick="showToast('加入 LINE 好友')" class="hover:text-cream transition-colors cursor-pointer">LINE 官方帳號</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-cream/10 pt-8 text-center text-xs">
      © 2026 山霧珈琲 Yamakiri Coffee. All rights reserved.
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] opacity-0 pointer-events-none transition-all duration-300 translate-y-4">
  <div class="bg-roast-espresso text-cream px-6 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4956a" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg>
    <span id="toast-text">操作成功</span>
  </div>
</div>

<script>
// Toast
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
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav-scrolled', window.scrollY > 60);
});

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

// Menu horizontal scroll
function scrollMenu(dir) {
  const el = document.getElementById('menu-scroll');
  el.scrollBy({ left: dir * 300, behavior: 'smooth' });
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
document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => obs.observe(el));
</script>

</body>
</html>$HTML$,
  3
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content,
             version = EXCLUDED.version,
             updated_at = now();
