-- Template Preview: landing-cafe (咖啡廳)
-- 大地色系溫馨咖啡廳，手寫感字體，完整菜單+故事+位置
-- Sections: Navigation, Hero, About, Menu (飲品+甜點), Gallery, Location/Hours, Footer

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'ade3d3f6-bf0f-44be-8a0b-473a378f3241',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>日常咖啡 Daily Brew — 每一天，從好咖啡開始</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        hand: ['Caveat', 'cursive']
      },
      colors: {
        earth: { 50: '#faf8f5', 100: '#f3ede4', 200: '#e8ddd0', 300: '#d4c4ad', 400: '#b8a080', 500: '#9c8060', 600: '#7a6248', 700: '#5c4a36', 800: '#3d3225', 900: '#2a2118' },
        cream: '#faf8f5',
        coffee: '#3d3225'
      }
    }
  }
}
</script>
<style>
  * { font-family: 'Outfit', system-ui, sans-serif; }
  .font-hand { font-family: 'Caveat', cursive; }
  html { scroll-behavior: smooth; }
  body { background: #faf8f5; overflow-x: hidden; }

  .nav-scrolled {
    background: rgba(250,248,245,0.95) !important;
    backdrop-filter: blur(16px);
    box-shadow: 0 1px 0 rgba(0,0,0,0.04);
  }

  .menu-card {
    transition: all 0.3s ease;
  }
  .menu-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(61,50,37,0.08);
  }

  .gallery-item {
    transition: all 0.4s ease;
    overflow: hidden;
    border-radius: 16px;
  }
  .gallery-item:hover .gallery-inner {
    transform: scale(1.06);
  }
  .gallery-inner {
    transition: transform 0.5s ease;
  }

  .reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  .reveal.active { opacity: 1; transform: translateY(0); }

  .bean-pattern {
    background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%239c8060' opacity='0.07'/%3E%3C/svg%3E");
  }

  .squiggle {
    text-decoration-style: wavy;
    text-underline-offset: 6px;
    text-decoration-thickness: 1.5px;
    text-decoration-color: #b8a080;
  }
</style>
</head>
<body class="text-coffee antialiased">

<!-- Navigation -->
<nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between h-18 py-4">
      <a href="#" class="flex items-center gap-2">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="#9c8060" stroke-width="1.5"/>
          <path d="M10 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#9c8060" stroke-width="1.5" fill="none"/>
          <path d="M8 18h16" stroke="#9c8060" stroke-width="1.5"/>
          <path d="M10 22h12" stroke="#9c8060" stroke-width="1.5"/>
          <path d="M13 14v-2m3 2v-3m3 3v-2" stroke="#9c8060" stroke-width="1" opacity="0.5"/>
        </svg>
        <div>
          <span class="font-hand text-xl text-earth-700">日常咖啡</span>
          <span class="text-[10px] text-earth-400 tracking-widest block -mt-1">DAILY BREW</span>
        </div>
      </a>

      <div class="hidden md:flex items-center gap-8">
        <a href="#about" class="text-sm text-earth-500 hover:text-earth-700 transition-colors">故事</a>
        <a href="#menu" class="text-sm text-earth-500 hover:text-earth-700 transition-colors">菜單</a>
        <a href="#gallery" class="text-sm text-earth-500 hover:text-earth-700 transition-colors">空間</a>
        <a href="#location" class="text-sm text-earth-500 hover:text-earth-700 transition-colors">位置</a>
      </div>

      <div class="hidden md:flex items-center gap-3">
        <button onclick="showToast('線上訂餐功能即將推出！')" class="bg-earth-700 text-cream text-sm font-medium px-5 py-2.5 rounded-full hover:bg-earth-800 transition-all cursor-pointer">
          線上點餐
        </button>
      </div>

      <button onclick="toggleMobileMenu()" class="md:hidden p-2 cursor-pointer">
        <svg id="menu-icon" width="24" height="24" fill="none" stroke="#5c4a36" stroke-width="1.5"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        <svg id="close-icon" width="24" height="24" fill="none" stroke="#5c4a36" stroke-width="1.5" class="hidden"><path d="M6 6l12 12M6 18L18 6"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="md:hidden hidden bg-cream border-t border-earth-100">
    <div class="px-6 py-4 space-y-3">
      <a href="#about" onclick="closeMobileMenu()" class="block text-earth-600 text-sm py-2">故事</a>
      <a href="#menu" onclick="closeMobileMenu()" class="block text-earth-600 text-sm py-2">菜單</a>
      <a href="#gallery" onclick="closeMobileMenu()" class="block text-earth-600 text-sm py-2">空間</a>
      <a href="#location" onclick="closeMobileMenu()" class="block text-earth-600 text-sm py-2">位置</a>
      <button onclick="showToast('線上訂餐功能即將推出！')" class="w-full bg-earth-700 text-cream text-sm font-medium py-2.5 rounded-full cursor-pointer mt-2">線上點餐</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="relative min-h-[90vh] flex items-center bean-pattern overflow-hidden">
  <div class="absolute top-20 right-20 w-64 h-64 bg-earth-200/30 rounded-full blur-3xl"></div>
  <div class="absolute bottom-20 left-10 w-48 h-48 bg-earth-300/20 rounded-full blur-3xl"></div>

  <div class="relative max-w-6xl mx-auto px-6 py-32 w-full">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div>
        <span class="font-hand text-2xl text-earth-400 mb-2 block">Welcome to</span>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-light text-earth-800 leading-tight mb-6">
          每一天，<br>
          從好咖啡<br>
          <span class="font-hand text-earth-500" style="font-size: 1.1em;">開始。</span>
        </h1>
        <p class="text-earth-400 text-base max-w-md mb-10 leading-relaxed">
          我們精選世界各地的精品咖啡豆，以職人手沖呈現每支豆子最完整的風味。搭配每日新鮮烘焙的甜點，讓日常也能有小確幸。
        </p>
        <div class="flex flex-wrap gap-4">
          <a href="#menu" class="bg-earth-700 text-cream text-sm font-medium px-7 py-3.5 rounded-full hover:bg-earth-800 transition-all cursor-pointer">
            看看菜單
          </a>
          <a href="#location" class="text-earth-600 border border-earth-300 text-sm font-medium px-7 py-3.5 rounded-full hover:bg-earth-100 transition-all cursor-pointer">
            怎麼到達
          </a>
        </div>

        <div class="flex items-center gap-6 mt-10 pt-8 border-t border-earth-200">
          <div class="text-center">
            <div class="font-hand text-3xl text-earth-600">4.8</div>
            <div class="text-xs text-earth-400">Google 評分</div>
          </div>
          <div class="w-px h-10 bg-earth-200"></div>
          <div class="text-center">
            <div class="font-hand text-3xl text-earth-600">2019</div>
            <div class="text-xs text-earth-400">創立年份</div>
          </div>
          <div class="w-px h-10 bg-earth-200"></div>
          <div class="text-center">
            <div class="font-hand text-3xl text-earth-600">SCA</div>
            <div class="text-xs text-earth-400">認證烘豆師</div>
          </div>
        </div>
      </div>

      <!-- Hero Visual -->
      <div class="hidden lg:block">
        <div class="relative">
          <div class="w-full aspect-square bg-earth-200/50 rounded-[40px] flex items-center justify-center border border-earth-200">
            <div class="text-center">
              <div class="font-hand text-8xl text-earth-300/60 mb-4">☕</div>
              <div class="font-hand text-2xl text-earth-400/60">hand-dripped</div>
              <div class="font-hand text-lg text-earth-300/50">with love</div>
            </div>
          </div>
          <!-- Floating badge -->
          <div class="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg p-4 border border-earth-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-earth-100 rounded-full flex items-center justify-center text-lg">🫘</div>
              <div>
                <div class="text-sm font-medium text-earth-700">本週精選</div>
                <div class="text-xs text-earth-400">衣索比亞 耶加雪菲</div>
              </div>
            </div>
          </div>
          <!-- Floating hours -->
          <div class="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg p-4 border border-earth-100">
            <div class="text-xs text-earth-400 mb-1">營業中</div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span class="text-sm font-medium text-earth-700">08:00 - 18:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- About -->
<section id="about" class="py-24 lg:py-32 bg-earth-700 text-cream overflow-hidden">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <!-- Photo grid -->
      <div class="reveal grid grid-cols-2 gap-4">
        <div class="aspect-[4/5] bg-earth-600/50 rounded-2xl flex items-center justify-center border border-earth-500/20">
          <span class="font-hand text-4xl text-earth-400/40">烘</span>
        </div>
        <div class="aspect-[4/5] bg-earth-600/50 rounded-2xl flex items-center justify-center border border-earth-500/20 mt-8">
          <span class="font-hand text-4xl text-earth-400/40">沖</span>
        </div>
      </div>

      <div class="reveal">
        <span class="font-hand text-2xl text-earth-300 mb-2 block">Our Story</span>
        <h2 class="text-3xl sm:text-4xl font-light mb-6">
          一杯咖啡的<br>
          <span class="font-hand" style="font-size: 1.1em;">堅持與溫度</span>
        </h2>
        <p class="text-earth-200/70 text-base leading-relaxed mb-6">
          2019 年，兩個咖啡瘋子決定在台北巷弄裡開一間小小的咖啡店。沒有花俏的裝潢，只有認真對待每一顆咖啡豆的心意。
        </p>
        <p class="text-earth-200/70 text-base leading-relaxed mb-8">
          我們每週自家烘焙，從生豆採購、烘焙曲線到萃取比例，每一個環節都堅持用最好的方式來呈現。因為我們相信，好咖啡不該只存在精品咖啡館裡，它應該是每個人日常生活的一部分。
        </p>
        <div class="flex flex-wrap gap-3">
          <span class="text-xs border border-earth-500/30 px-3 py-1.5 rounded-full text-earth-300">自家烘焙</span>
          <span class="text-xs border border-earth-500/30 px-3 py-1.5 rounded-full text-earth-300">精品咖啡</span>
          <span class="text-xs border border-earth-500/30 px-3 py-1.5 rounded-full text-earth-300">手作甜點</span>
          <span class="text-xs border border-earth-500/30 px-3 py-1.5 rounded-full text-earth-300">友善空間</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Menu -->
<section id="menu" class="py-24 lg:py-32">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="font-hand text-2xl text-earth-400 mb-2 block">Our Menu</span>
      <h2 class="text-3xl sm:text-4xl font-light text-earth-800">今日菜單</h2>
    </div>

    <!-- Menu Tabs -->
    <div class="flex justify-center gap-4 mb-12">
      <button onclick="showMenuTab('drinks')" id="tab-drinks" class="text-sm font-medium px-6 py-2.5 rounded-full border cursor-pointer transition-all bg-earth-700 text-cream border-earth-700">咖啡 & 飲品</button>
      <button onclick="showMenuTab('sweets')" id="tab-sweets" class="text-sm font-medium px-6 py-2.5 rounded-full border cursor-pointer transition-all bg-transparent text-earth-500 border-earth-300 hover:border-earth-400">甜點 & 輕食</button>
      <button onclick="showMenuTab('beans')" id="tab-beans" class="text-sm font-medium px-6 py-2.5 rounded-full border cursor-pointer transition-all bg-transparent text-earth-500 border-earth-300 hover:border-earth-400">咖啡豆</button>
    </div>

    <!-- Drinks -->
    <div id="menu-drinks" class="menu-content">
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">手沖單品</h4>
              <p class="text-xs text-earth-400">Hand Drip Single Origin</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$180</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">每日精選產區，由吧台師推薦最佳沖煮方式</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">熱 / 冰</span>
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">⭐ 人氣</span>
          </div>
        </div>

        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">經典拿鐵</h4>
              <p class="text-xs text-earth-400">Classic Latte</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$150</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">雙份濃縮 + 綿密蒸奶，溫潤順口的經典選擇</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">熱 / 冰</span>
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">可選燕麥奶</span>
          </div>
        </div>

        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">卡布奇諾</h4>
              <p class="text-xs text-earth-400">Cappuccino</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$140</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">完美比例的奶泡藝術，口感豐富層次分明</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">僅供熱飲</span>
          </div>
        </div>

        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">Dirty 髒咖啡</h4>
              <p class="text-xs text-earth-400">Dirty Coffee</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$160</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">濃縮直接倒入冰牛奶，看漸層色彩的美麗碰撞</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">僅供冰飲</span>
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">📸 必拍</span>
          </div>
        </div>

        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">抹茶拿鐵</h4>
              <p class="text-xs text-earth-400">Matcha Latte</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$170</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">京都宇治抹茶 + 蒸奶，微苦回甘的日式風味</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">熱 / 冰</span>
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">非咖啡因</span>
          </div>
        </div>

        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">氣泡美式</h4>
              <p class="text-xs text-earth-400">Sparkling Americano</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$150</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">濃縮 + 氣泡水 + 檸檬片，夏日消暑首選</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">僅供冰飲</span>
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">🌿 清爽</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sweets -->
    <div id="menu-sweets" class="menu-content hidden">
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">巴斯克乳酪蛋糕</h4>
              <p class="text-xs text-earth-400">Basque Cheesecake</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$160</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">每日限量手作，外焦內融的完美口感</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">⭐ 招牌</span>
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">限量</span>
          </div>
        </div>

        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">肉桂捲</h4>
              <p class="text-xs text-earth-400">Cinnamon Roll</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$120</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">現烤出爐，滿室肉桂香氣，搭配糖霜</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">現烤</span>
          </div>
        </div>

        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">司康 & 手工果醬</h4>
              <p class="text-xs text-earth-400">Scone Set</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$140</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">原味/伯爵茶口味，附奶油與當季手工果醬</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">午茶推薦</span>
          </div>
        </div>

        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">酪梨吐司</h4>
              <p class="text-xs text-earth-400">Avocado Toast</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$200</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">手工酸種吐司、新鮮酪梨、半熟蛋、微辣調味</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">早午餐</span>
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">🥑</span>
          </div>
        </div>

        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">提拉米蘇</h4>
              <p class="text-xs text-earth-400">Tiramisu</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$180</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">用我們自烘的咖啡浸潤，搭配馬斯卡彭起司</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">咖啡搭配</span>
          </div>
        </div>

        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">可頌</h4>
              <p class="text-xs text-earth-400">Croissant</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$90</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">法國 AOP 認證奶油，72 小時低溫發酵</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">現烤</span>
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">🥐</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Beans -->
    <div id="menu-beans" class="menu-content hidden">
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">衣索比亞 耶加雪菲</h4>
              <p class="text-xs text-earth-400">Ethiopia Yirgacheffe</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$550</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">花香、柑橘、蜂蜜 · 水洗 · 淺焙</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">半磅</span>
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">⭐ 本週推薦</span>
          </div>
        </div>

        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">哥倫比亞 薇拉</h4>
              <p class="text-xs text-earth-400">Colombia Huila</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$480</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">焦糖、堅果、巧克力 · 水洗 · 中焙</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">半磅</span>
          </div>
        </div>

        <div class="menu-card bg-white rounded-2xl p-6 border border-earth-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-earth-800 mb-0.5">日常配方豆</h4>
              <p class="text-xs text-earth-400">Daily Blend</p>
            </div>
            <span class="font-hand text-xl text-earth-500">$420</span>
          </div>
          <p class="text-earth-400 text-sm leading-relaxed mb-3">均衡、甜感、好入口 · 中深焙 · 適合牛奶基底</p>
          <div class="flex gap-2">
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">半磅</span>
            <span class="text-[10px] bg-earth-50 text-earth-500 px-2 py-1 rounded-full">最多人買</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Gallery -->
<section id="gallery" class="py-24 lg:py-32 bg-earth-100/50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="font-hand text-2xl text-earth-400 mb-2 block">Our Space</span>
      <h2 class="text-3xl sm:text-4xl font-light text-earth-800">來坐坐吧</h2>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="gallery-item col-span-2 lg:col-span-1 lg:row-span-2 aspect-square lg:aspect-auto bg-earth-200/60 border border-earth-200 flex items-center justify-center cursor-pointer" onclick="showToast('吧台區：觀賞手沖過程的最佳位置')">
        <div class="gallery-inner text-center p-8">
          <div class="text-4xl mb-3">☕</div>
          <div class="font-hand text-xl text-earth-600">吧台區</div>
          <div class="text-xs text-earth-400 mt-1">看師傅手沖的最佳位置</div>
        </div>
      </div>
      <div class="gallery-item aspect-square bg-earth-200/40 border border-earth-200 flex items-center justify-center cursor-pointer" onclick="showToast('窗邊座位：自然光+綠植，最受歡迎')">
        <div class="gallery-inner text-center p-6">
          <div class="text-3xl mb-2">🪴</div>
          <div class="font-hand text-lg text-earth-600">窗邊座位</div>
        </div>
      </div>
      <div class="gallery-item aspect-square bg-earth-300/30 border border-earth-200 flex items-center justify-center cursor-pointer" onclick="showToast('閱讀角落：安靜的獨處空間')">
        <div class="gallery-inner text-center p-6">
          <div class="text-3xl mb-2">📚</div>
          <div class="font-hand text-lg text-earth-600">閱讀角落</div>
        </div>
      </div>
      <div class="gallery-item aspect-square bg-earth-200/50 border border-earth-200 flex items-center justify-center cursor-pointer" onclick="showToast('烘豆室：透明玻璃隔間，觀賞烘焙過程')">
        <div class="gallery-inner text-center p-6">
          <div class="text-3xl mb-2">🫘</div>
          <div class="font-hand text-lg text-earth-600">烘豆室</div>
        </div>
      </div>
      <div class="gallery-item aspect-square bg-earth-200/30 border border-earth-200 flex items-center justify-center cursor-pointer" onclick="showToast('戶外座位：天氣好的時候超舒服')">
        <div class="gallery-inner text-center p-6">
          <div class="text-3xl mb-2">🌿</div>
          <div class="font-hand text-lg text-earth-600">戶外露台</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Location -->
<section id="location" class="py-24 lg:py-32">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid lg:grid-cols-2 gap-16">
      <div class="reveal">
        <span class="font-hand text-2xl text-earth-400 mb-2 block">Find Us</span>
        <h2 class="text-3xl sm:text-4xl font-light text-earth-800 mb-8">來找我們</h2>

        <div class="space-y-6 mb-10">
          <div class="flex items-start gap-4">
            <div class="w-11 h-11 bg-earth-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="18" height="18" fill="none" stroke="#9c8060" stroke-width="1.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div>
              <div class="font-medium text-sm text-earth-700 mb-0.5">地址</div>
              <div class="text-earth-400 text-sm">台北市大安區永康街 23 巷 7 號</div>
              <button onclick="showToast('已複製地址到剪貼簿')" class="text-xs text-earth-500 underline mt-1 cursor-pointer">複製地址</button>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-11 h-11 bg-earth-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="18" height="18" fill="none" stroke="#9c8060" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <div class="font-medium text-sm text-earth-700 mb-0.5">營業時間</div>
              <div class="text-earth-400 text-sm space-y-1">
                <div class="flex justify-between gap-8"><span>週一至週五</span><span>08:00 — 18:00</span></div>
                <div class="flex justify-between gap-8"><span>週六、週日</span><span>09:00 — 19:00</span></div>
                <div class="flex justify-between gap-8"><span>國定假日</span><span>10:00 — 17:00</span></div>
              </div>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-11 h-11 bg-earth-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="18" height="18" fill="none" stroke="#9c8060" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            </div>
            <div>
              <div class="font-medium text-sm text-earth-700 mb-0.5">電話 & 社群</div>
              <div class="text-earth-400 text-sm">02-2321-8888</div>
              <div class="text-earth-400 text-sm">IG: @dailybrew.taipei</div>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button onclick="showToast('導航至日常咖啡（Google Maps）')" class="bg-earth-700 text-cream text-sm font-medium px-6 py-3 rounded-full hover:bg-earth-800 transition-all cursor-pointer">
            Google Maps 導航
          </button>
          <button onclick="showToast('LINE ID: @dailybrew')" class="border border-earth-300 text-earth-600 text-sm font-medium px-6 py-3 rounded-full hover:bg-earth-50 transition-all cursor-pointer">
            LINE 聯繫
          </button>
        </div>
      </div>

      <!-- Map placeholder -->
      <div class="reveal">
        <div class="w-full aspect-[4/3] bg-earth-100 rounded-2xl border border-earth-200 flex items-center justify-center cursor-pointer relative overflow-hidden" onclick="showToast('開啟 Google Maps')">
          <div class="absolute inset-0 opacity-10" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect width=%2240%22 height=%2240%22 fill=%22none%22 stroke=%22%239c8060%22 stroke-width=%220.5%22/%3E%3C/svg%3E');"></div>
          <div class="text-center relative">
            <svg class="mx-auto mb-3" width="40" height="40" fill="none" stroke="#9c8060" stroke-width="1.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <div class="font-hand text-xl text-earth-600 mb-1">日常咖啡</div>
            <div class="text-xs text-earth-400">永康街 23 巷 7 號</div>
            <div class="text-xs text-earth-500 mt-2 underline">點擊開啟地圖 →</div>
          </div>
        </div>
        <!-- Transport info -->
        <div class="grid grid-cols-3 gap-4 mt-4">
          <div class="bg-white rounded-xl p-3 border border-earth-100 text-center">
            <div class="text-lg mb-1">🚇</div>
            <div class="text-xs text-earth-600 font-medium">東門站 5 號出口</div>
            <div class="text-[10px] text-earth-400">步行 3 分鐘</div>
          </div>
          <div class="bg-white rounded-xl p-3 border border-earth-100 text-center">
            <div class="text-lg mb-1">🚌</div>
            <div class="text-xs text-earth-600 font-medium">永康街口站</div>
            <div class="text-[10px] text-earth-400">0 / 204 / 672</div>
          </div>
          <div class="bg-white rounded-xl p-3 border border-earth-100 text-center">
            <div class="text-lg mb-1">🅿️</div>
            <div class="text-xs text-earth-600 font-medium">永康公園地下</div>
            <div class="text-[10px] text-earth-400">步行 1 分鐘</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Newsletter CTA -->
<section class="py-16 bg-earth-700">
  <div class="max-w-2xl mx-auto px-6 text-center">
    <span class="font-hand text-2xl text-earth-300 mb-2 block">Stay Connected</span>
    <h3 class="text-xl font-light text-cream mb-3">訂閱電子報，搶先知道新品上架</h3>
    <p class="text-earth-300/60 text-sm mb-6">每月一封，不打擾。新豆上架、限定甜點、小活動通知。</p>
    <div class="flex gap-2 max-w-md mx-auto">
      <input type="email" placeholder="your@email.com" class="flex-1 px-4 py-3 bg-white/10 border border-earth-500/30 rounded-full text-cream text-sm outline-none placeholder:text-earth-400/40 focus:border-earth-400">
      <button onclick="showToast('訂閱成功！歡迎加入日常咖啡的朋友圈 ☕')" class="bg-cream text-earth-700 text-sm font-medium px-6 py-3 rounded-full hover:bg-earth-50 transition-all cursor-pointer whitespace-nowrap">
        訂閱
      </button>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="py-12 border-t border-earth-200">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex flex-col sm:flex-row justify-between items-center gap-6">
      <div class="flex items-center gap-2">
        <span class="font-hand text-lg text-earth-500">日常咖啡</span>
        <span class="text-[10px] text-earth-300 tracking-widest">DAILY BREW</span>
      </div>
      <div class="flex gap-5">
        <button onclick="showToast('前往 Instagram @dailybrew.taipei')" class="w-9 h-9 bg-earth-100 rounded-full flex items-center justify-center hover:bg-earth-200 transition-colors cursor-pointer">
          <svg width="16" height="16" fill="#9c8060" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </button>
        <button onclick="showToast('前往 Facebook')" class="w-9 h-9 bg-earth-100 rounded-full flex items-center justify-center hover:bg-earth-200 transition-colors cursor-pointer">
          <svg width="16" height="16" fill="#9c8060" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </button>
        <button onclick="showToast('LINE ID: @dailybrew')" class="w-9 h-9 bg-earth-100 rounded-full flex items-center justify-center hover:bg-earth-200 transition-colors cursor-pointer">
          <svg width="16" height="16" fill="#9c8060" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zM24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
        </button>
      </div>
      <p class="text-xs text-earth-300">© 2026 日常咖啡 Daily Brew</p>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] opacity-0 pointer-events-none transition-all duration-300 translate-y-4">
  <div class="bg-earth-700 text-cream px-6 py-3 rounded-full shadow-2xl text-sm font-medium flex items-center gap-3">
    <span>☕</span>
    <span id="toast-text"></span>
  </div>
</div>

<script>
// ========== Toast ==========
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-text').textContent = msg;
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

// ========== Nav ==========
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('nav-scrolled', window.scrollY > 60);
});
function toggleMobileMenu() {
  const m = document.getElementById('mobile-menu');
  const o = m.classList.contains('hidden');
  m.classList.toggle('hidden');
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
    document.querySelector(t)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ========== Menu Tabs ==========
function showMenuTab(tab) {
  document.querySelectorAll('.menu-content').forEach(el => el.classList.add('hidden'));
  document.getElementById('menu-' + tab).classList.remove('hidden');

  ['drinks', 'sweets', 'beans'].forEach(t => {
    const btn = document.getElementById('tab-' + t);
    if (t === tab) {
      btn.classList.add('bg-earth-700', 'text-cream', 'border-earth-700');
      btn.classList.remove('bg-transparent', 'text-earth-500', 'border-earth-300');
    } else {
      btn.classList.remove('bg-earth-700', 'text-cream', 'border-earth-700');
      btn.classList.add('bg-transparent', 'text-earth-500', 'border-earth-300');
    }
  });
}

// ========== Reveal ==========
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
</script>

</body>
</html>$HTML$,
  3
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content,
             version = EXCLUDED.version,
             updated_at = now();
