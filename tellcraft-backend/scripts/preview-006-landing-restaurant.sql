-- Template Preview: landing-restaurant (餐廳官網)
-- 暖色調深色背景，高端餐飲，完整菜單+預約+照片牆
-- Sections: Navigation, Hero, About, Menu (4 categories), Gallery, Reservation, Testimonials, Footer

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '315fa6df-6c2d-492c-be32-c291cdcd0c14',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>和 KAZU — 當代和食料理</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;500;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif TC', 'Georgia', 'serif']
      },
      colors: {
        warm: { 50: '#fdf8f0', 100: '#f5e6d0', 200: '#e8cda5', 300: '#d4a96e', 400: '#c4934f', 500: '#a67c3d', 600: '#8b6630', 700: '#6d4e24' },
        dark: { 800: '#1a1610', 900: '#110f0a', 950: '#0a0907' }
      }
    }
  }
}
</script>
<style>
  * { font-family: 'Outfit', system-ui, sans-serif; }
  .font-serif { font-family: 'Noto Serif TC', Georgia, serif; }
  html { scroll-behavior: smooth; }
  body { background: #110f0a; color: #f5e6d0; overflow-x: hidden; }

  .gold-text { color: #c4934f; }
  .gold-line { background: linear-gradient(90deg, transparent, #c4934f, transparent); height: 1px; }

  .nav-scrolled {
    background: rgba(17,15,10,0.95) !important;
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(196,147,79,0.1);
  }

  .menu-tab { transition: all 0.2s ease; }
  .menu-tab.active { color: #c4934f; border-bottom-color: #c4934f; }

  .gallery-item {
    transition: all 0.4s ease;
    overflow: hidden;
  }
  .gallery-item:hover .gallery-img {
    transform: scale(1.08);
  }
  .gallery-img {
    transition: transform 0.6s ease;
  }

  .reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  .reveal.active { opacity: 1; transform: translateY(0); }

  .form-input-dark {
    width: 100%;
    padding: 14px 16px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(196,147,79,0.2);
    border-radius: 8px;
    color: #f5e6d0;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
  }
  .form-input-dark:focus {
    border-color: #c4934f;
    background: rgba(255,255,255,0.08);
  }
  .form-input-dark::placeholder { color: rgba(245,230,208,0.3); }

  select.form-input-dark { appearance: auto; }

  .parallax-bg {
    background-attachment: fixed;
    background-size: cover;
    background-position: center;
  }
</style>
</head>
<body class="antialiased">

<!-- Navigation -->
<nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="flex items-center justify-between h-20">
      <a href="#" class="flex items-center gap-3">
        <span class="font-serif text-2xl gold-text">和</span>
        <span class="text-sm font-light tracking-[0.3em] text-warm-100">KAZU</span>
      </a>

      <div class="hidden md:flex items-center gap-8">
        <a href="#about" class="text-sm font-light text-warm-200/70 hover:text-warm-100 transition-colors">關於</a>
        <a href="#menu" class="text-sm font-light text-warm-200/70 hover:text-warm-100 transition-colors">菜單</a>
        <a href="#gallery" class="text-sm font-light text-warm-200/70 hover:text-warm-100 transition-colors">環境</a>
        <a href="#reviews" class="text-sm font-light text-warm-200/70 hover:text-warm-100 transition-colors">評價</a>
      </div>

      <div class="hidden md:flex items-center gap-4">
        <a href="#reservation" class="bg-warm-400 text-dark-900 text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-warm-300 transition-all cursor-pointer">
          立即訂位
        </a>
      </div>

      <button onclick="toggleMobileMenu()" class="md:hidden p-2 cursor-pointer text-warm-100">
        <svg id="menu-icon" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg id="close-icon" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" class="hidden"><path d="M6 6l12 12M6 18L18 6"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="md:hidden hidden bg-dark-900/95 backdrop-blur-xl border-t border-warm-400/10">
    <div class="px-6 py-4 space-y-3">
      <a href="#about" onclick="closeMobileMenu()" class="block text-warm-200/70 text-sm py-2">關於</a>
      <a href="#menu" onclick="closeMobileMenu()" class="block text-warm-200/70 text-sm py-2">菜單</a>
      <a href="#gallery" onclick="closeMobileMenu()" class="block text-warm-200/70 text-sm py-2">環境</a>
      <a href="#reviews" onclick="closeMobileMenu()" class="block text-warm-200/70 text-sm py-2">評價</a>
      <a href="#reservation" onclick="closeMobileMenu()" class="block bg-warm-400 text-dark-900 text-sm font-medium px-4 py-2.5 rounded-lg text-center mt-3">立即訂位</a>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="relative min-h-screen flex items-center justify-center overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900/80 to-dark-900"></div>
  <!-- Decorative pattern -->
  <div class="absolute inset-0 opacity-[0.03]" style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23c4934f&quot; fill-opacity=&quot;1&quot;%3E%3Cpath d=&quot;M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>

  <div class="relative text-center px-6">
    <div class="mb-6">
      <span class="font-serif text-7xl sm:text-8xl lg:text-9xl gold-text opacity-30">和</span>
    </div>
    <div class="gold-line max-w-32 mx-auto mb-8"></div>
    <h1 class="font-serif text-3xl sm:text-4xl lg:text-5xl text-warm-100 mb-4 leading-tight">
      當代和食料理
    </h1>
    <p class="text-warm-200/50 text-sm tracking-[0.2em] uppercase mb-12">CONTEMPORARY JAPANESE CUISINE</p>
    <div class="flex flex-wrap justify-center gap-4">
      <a href="#reservation" class="bg-warm-400 text-dark-900 text-sm font-medium px-8 py-3.5 rounded-lg hover:bg-warm-300 transition-all cursor-pointer">
        預約訂位
      </a>
      <a href="#menu" class="border border-warm-400/30 text-warm-200 text-sm font-light px-8 py-3.5 rounded-lg hover:bg-warm-400/5 transition-all cursor-pointer">
        瀏覽菜單
      </a>
    </div>
  </div>

  <!-- Scroll indicator -->
  <div class="absolute bottom-10 left-1/2 -translate-x-1/2">
    <div class="w-5 h-8 border border-warm-400/30 rounded-full flex justify-center">
      <div class="w-1 h-2 bg-warm-400/50 rounded-full mt-1.5 animate-bounce"></div>
    </div>
  </div>
</section>

<!-- About -->
<section id="about" class="py-24 lg:py-32">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div class="reveal">
        <span class="text-xs gold-text tracking-[0.3em] uppercase mb-4 block">我們的故事</span>
        <h2 class="font-serif text-3xl sm:text-4xl text-warm-100 mb-6 leading-snug">
          傳統與現代的<br>完美交融
        </h2>
        <p class="text-warm-200/60 text-base leading-relaxed mb-6">
          「和 KAZU」由主廚林和彥於 2018 年創立。融合日本傳統和食技法與台灣在地食材，每一道料理都是一段文化的對話。
        </p>
        <p class="text-warm-200/60 text-base leading-relaxed mb-8">
          我們堅持每日清晨從漁港直送的鮮魚，搭配嚴選的有機蔬果，以「旬」的概念呈現季節最美好的滋味。
        </p>
        <div class="grid grid-cols-3 gap-8">
          <div>
            <div class="font-serif text-3xl gold-text mb-1">7</div>
            <div class="text-warm-200/40 text-xs">年深耕料理</div>
          </div>
          <div>
            <div class="font-serif text-3xl gold-text mb-1">4.9</div>
            <div class="text-warm-200/40 text-xs">Google 評分</div>
          </div>
          <div>
            <div class="font-serif text-3xl gold-text mb-1">1</div>
            <div class="text-warm-200/40 text-xs">米其林推薦</div>
          </div>
        </div>
      </div>

      <div class="reveal grid grid-cols-2 gap-4">
        <div class="space-y-4">
          <div class="aspect-[3/4] bg-gradient-to-br from-warm-700/30 to-warm-600/10 rounded-2xl flex items-center justify-center border border-warm-400/10">
            <span class="font-serif text-4xl text-warm-400/20">匠</span>
          </div>
          <div class="aspect-square bg-gradient-to-br from-warm-600/20 to-warm-500/10 rounded-2xl flex items-center justify-center border border-warm-400/10">
            <span class="font-serif text-4xl text-warm-400/20">食</span>
          </div>
        </div>
        <div class="space-y-4 mt-8">
          <div class="aspect-square bg-gradient-to-br from-warm-500/20 to-warm-400/10 rounded-2xl flex items-center justify-center border border-warm-400/10">
            <span class="font-serif text-4xl text-warm-400/20">旬</span>
          </div>
          <div class="aspect-[3/4] bg-gradient-to-br from-warm-600/30 to-warm-700/10 rounded-2xl flex items-center justify-center border border-warm-400/10">
            <span class="font-serif text-4xl text-warm-400/20">美</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Menu Section -->
<section id="menu" class="py-24 lg:py-32 bg-dark-950/50">
  <div class="max-w-5xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-16 reveal">
      <span class="text-xs gold-text tracking-[0.3em] uppercase mb-4 block">菜單精選</span>
      <h2 class="font-serif text-3xl sm:text-4xl text-warm-100 mb-4">季節限定菜單</h2>
      <p class="text-warm-200/50 text-sm">2026 春 · 櫻花祭</p>
    </div>

    <!-- Menu Tabs -->
    <div class="flex justify-center gap-1 mb-12 border-b border-warm-400/10">
      <button onclick="showMenuTab('appetizer')" class="menu-tab active text-sm font-medium px-6 py-3 border-b-2 border-transparent cursor-pointer text-warm-200/50" data-tab="appetizer">前菜</button>
      <button onclick="showMenuTab('main')" class="menu-tab text-sm font-medium px-6 py-3 border-b-2 border-transparent cursor-pointer text-warm-200/50" data-tab="main">主菜</button>
      <button onclick="showMenuTab('dessert')" class="menu-tab text-sm font-medium px-6 py-3 border-b-2 border-transparent cursor-pointer text-warm-200/50" data-tab="dessert">甜點</button>
      <button onclick="showMenuTab('drink')" class="menu-tab text-sm font-medium px-6 py-3 border-b-2 border-transparent cursor-pointer text-warm-200/50" data-tab="drink">飲品</button>
    </div>

    <!-- Menu Content -->
    <div id="menu-appetizer" class="menu-content space-y-0">
      <div class="flex justify-between items-start py-6 border-b border-warm-400/10 group">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-1">
            <h4 class="font-serif text-base text-warm-100">季節刺身五點盛</h4>
            <span class="text-[10px] bg-warm-400/20 text-warm-400 px-2 py-0.5 rounded-full">主廚推薦</span>
          </div>
          <p class="text-warm-200/40 text-sm">當日鮮魚五種、山葵、紫蘇葉、蘿蔔絲</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$680</span>
      </div>
      <div class="flex justify-between items-start py-6 border-b border-warm-400/10">
        <div class="flex-1">
          <h4 class="font-serif text-base text-warm-100 mb-1">炙燒和牛握壽司</h4>
          <p class="text-warm-200/40 text-sm">A5 和牛、醋飯、松露鹽、蔥花</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$480</span>
      </div>
      <div class="flex justify-between items-start py-6 border-b border-warm-400/10">
        <div class="flex-1">
          <h4 class="font-serif text-base text-warm-100 mb-1">胡麻豆腐</h4>
          <p class="text-warm-200/40 text-sm">手作胡麻豆腐、柚子味噌、食用花</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$320</span>
      </div>
      <div class="flex justify-between items-start py-6 border-b border-warm-400/10">
        <div class="flex-1">
          <h4 class="font-serif text-base text-warm-100 mb-1">鮮蝦天婦羅</h4>
          <p class="text-warm-200/40 text-sm">大正蝦三尾、季節蔬菜、抹茶鹽</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$420</span>
      </div>
      <div class="flex justify-between items-start py-6">
        <div class="flex-1">
          <h4 class="font-serif text-base text-warm-100 mb-1">生海膽蒸蛋</h4>
          <p class="text-warm-200/40 text-sm">北海道馬糞海膽、柴魚高湯蒸蛋、金箔</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$580</span>
      </div>
    </div>

    <div id="menu-main" class="menu-content space-y-0 hidden">
      <div class="flex justify-between items-start py-6 border-b border-warm-400/10">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-1">
            <h4 class="font-serif text-base text-warm-100">A5 和牛西京燒</h4>
            <span class="text-[10px] bg-warm-400/20 text-warm-400 px-2 py-0.5 rounded-full">招牌</span>
          </div>
          <p class="text-warm-200/40 text-sm">宮崎 A5 和牛、白味噌醃漬、炭火燒烤、季節蔬菜</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$1,880</span>
      </div>
      <div class="flex justify-between items-start py-6 border-b border-warm-400/10">
        <div class="flex-1">
          <h4 class="font-serif text-base text-warm-100 mb-1">慢煮鰤魚照燒</h4>
          <p class="text-warm-200/40 text-sm">寒鰤魚、自家醬油照燒、蓮藕、山椒</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$980</span>
      </div>
      <div class="flex justify-between items-start py-6 border-b border-warm-400/10">
        <div class="flex-1">
          <h4 class="font-serif text-base text-warm-100 mb-1">松葉蟹壽喜鍋</h4>
          <p class="text-warm-200/40 text-sm">活松葉蟹、特製壽喜燒汁、有機蔬菜、蛋</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$2,480</span>
      </div>
      <div class="flex justify-between items-start py-6">
        <div class="flex-1">
          <h4 class="font-serif text-base text-warm-100 mb-1">鰻魚三吃</h4>
          <p class="text-warm-200/40 text-sm">日本產活鰻、蒲燒/白燒/茶泡飯</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$1,280</span>
      </div>
    </div>

    <div id="menu-dessert" class="menu-content space-y-0 hidden">
      <div class="flex justify-between items-start py-6 border-b border-warm-400/10">
        <div class="flex-1">
          <h4 class="font-serif text-base text-warm-100 mb-1">抹茶熔岩蛋糕</h4>
          <p class="text-warm-200/40 text-sm">京都宇治抹茶、白巧克力、香草冰淇淋</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$380</span>
      </div>
      <div class="flex justify-between items-start py-6 border-b border-warm-400/10">
        <div class="flex-1">
          <h4 class="font-serif text-base text-warm-100 mb-1">柚子雪酪</h4>
          <p class="text-warm-200/40 text-sm">高知柚子、接骨木花、薄荷</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$280</span>
      </div>
      <div class="flex justify-between items-start py-6">
        <div class="flex-1">
          <h4 class="font-serif text-base text-warm-100 mb-1">和風蕨餅</h4>
          <p class="text-warm-200/40 text-sm">手工蕨餅、黃豆粉、黑糖蜜</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$260</span>
      </div>
    </div>

    <div id="menu-drink" class="menu-content space-y-0 hidden">
      <div class="flex justify-between items-start py-6 border-b border-warm-400/10">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-1">
            <h4 class="font-serif text-base text-warm-100">獺祭 二割三分</h4>
            <span class="text-[10px] bg-warm-400/20 text-warm-400 px-2 py-0.5 rounded-full">清酒</span>
          </div>
          <p class="text-warm-200/40 text-sm">山口縣 · 純米大吟釀 · 一合</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$680</span>
      </div>
      <div class="flex justify-between items-start py-6 border-b border-warm-400/10">
        <div class="flex-1">
          <h4 class="font-serif text-base text-warm-100 mb-1">響 Japanese Harmony</h4>
          <p class="text-warm-200/40 text-sm">日本威士忌 · 調和 · 單杯</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$480</span>
      </div>
      <div class="flex justify-between items-start py-6 border-b border-warm-400/10">
        <div class="flex-1">
          <h4 class="font-serif text-base text-warm-100 mb-1">梅酒蘇打</h4>
          <p class="text-warm-200/40 text-sm">自家漬梅酒、氣泡水、紫蘇葉</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$280</span>
      </div>
      <div class="flex justify-between items-start py-6">
        <div class="flex-1">
          <h4 class="font-serif text-base text-warm-100 mb-1">手沖咖啡 / 日本茶</h4>
          <p class="text-warm-200/40 text-sm">淺焙手沖 / 煎茶 / 焙茶 / 玄米茶</p>
        </div>
        <span class="font-serif text-lg gold-text ml-4 whitespace-nowrap">$180</span>
      </div>
    </div>

    <div class="text-center mt-12">
      <button onclick="showToast('完整菜單 PDF 下載中...')" class="border border-warm-400/30 text-warm-200 text-sm font-light px-8 py-3 rounded-lg hover:bg-warm-400/5 transition-all cursor-pointer">
        下載完整菜單 PDF
      </button>
    </div>
  </div>
</section>

<!-- Gallery -->
<section id="gallery" class="py-24 lg:py-32">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-16 reveal">
      <span class="text-xs gold-text tracking-[0.3em] uppercase mb-4 block">空間環境</span>
      <h2 class="font-serif text-3xl sm:text-4xl text-warm-100">感受和的氛圍</h2>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="gallery-item col-span-2 row-span-2 aspect-square rounded-2xl bg-gradient-to-br from-warm-700/20 to-warm-600/5 border border-warm-400/10 flex items-center justify-center cursor-pointer" onclick="showToast('點擊查看大圖：主用餐區')">
        <div class="gallery-img text-center">
          <span class="font-serif text-5xl text-warm-400/15">庭</span>
          <p class="text-warm-200/30 text-xs mt-2">主用餐區</p>
        </div>
      </div>
      <div class="gallery-item aspect-square rounded-2xl bg-gradient-to-br from-warm-600/15 to-warm-500/5 border border-warm-400/10 flex items-center justify-center cursor-pointer" onclick="showToast('點擊查看大圖：吧台')">
        <div class="gallery-img text-center">
          <span class="font-serif text-3xl text-warm-400/15">座</span>
          <p class="text-warm-200/30 text-xs mt-2">吧台席</p>
        </div>
      </div>
      <div class="gallery-item aspect-square rounded-2xl bg-gradient-to-br from-warm-500/15 to-warm-400/5 border border-warm-400/10 flex items-center justify-center cursor-pointer" onclick="showToast('點擊查看大圖：料理')">
        <div class="gallery-img text-center">
          <span class="font-serif text-3xl text-warm-400/15">鮮</span>
          <p class="text-warm-200/30 text-xs mt-2">料理特寫</p>
        </div>
      </div>
      <div class="gallery-item aspect-square rounded-2xl bg-gradient-to-br from-warm-400/15 to-warm-300/5 border border-warm-400/10 flex items-center justify-center cursor-pointer" onclick="showToast('點擊查看大圖：包廂')">
        <div class="gallery-img text-center">
          <span class="font-serif text-3xl text-warm-400/15">閣</span>
          <p class="text-warm-200/30 text-xs mt-2">VIP 包廂</p>
        </div>
      </div>
      <div class="gallery-item aspect-square rounded-2xl bg-gradient-to-br from-warm-600/20 to-warm-700/5 border border-warm-400/10 flex items-center justify-center cursor-pointer" onclick="showToast('點擊查看大圖：庭園')">
        <div class="gallery-img text-center">
          <span class="font-serif text-3xl text-warm-400/15">園</span>
          <p class="text-warm-200/30 text-xs mt-2">枯山水庭園</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Reservation -->
<section id="reservation" class="py-24 lg:py-32 bg-dark-950/50">
  <div class="max-w-5xl mx-auto px-6 lg:px-8">
    <div class="grid lg:grid-cols-2 gap-16">
      <div class="reveal">
        <span class="text-xs gold-text tracking-[0.3em] uppercase mb-4 block">線上訂位</span>
        <h2 class="font-serif text-3xl sm:text-4xl text-warm-100 mb-6 leading-snug">
          預約您的<br>和食之旅
        </h2>
        <p class="text-warm-200/50 text-base leading-relaxed mb-10">
          建議提前 3 天預約，週末及國定假日請提前一週。包廂低消 NT$8,000，需預付訂金。
        </p>

        <div class="space-y-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-warm-400/10 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" fill="none" stroke="#c4934f" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <div class="text-sm font-medium text-warm-100">營業時間</div>
              <div class="text-warm-200/40 text-sm">午餐 11:30-14:30 · 晚餐 17:30-22:00</div>
              <div class="text-warm-200/40 text-sm">每週一公休</div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-warm-400/10 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" fill="none" stroke="#c4934f" stroke-width="1.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div>
              <div class="text-sm font-medium text-warm-100">地址</div>
              <div class="text-warm-200/40 text-sm">台北市大安區忠孝東路四段 218 號 2F</div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-warm-400/10 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" fill="none" stroke="#c4934f" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            </div>
            <div>
              <div class="text-sm font-medium text-warm-100">電話</div>
              <div class="text-warm-200/40 text-sm">02-2771-8888</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reservation Form -->
      <div class="reveal">
        <form onsubmit="handleReservation(event)" class="bg-white/[0.02] rounded-2xl border border-warm-400/10 p-8">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs text-warm-200/50 mb-2">姓名 *</label>
              <input type="text" class="form-input-dark" placeholder="您的大名" required>
            </div>
            <div>
              <label class="block text-xs text-warm-200/50 mb-2">電話 *</label>
              <input type="tel" class="form-input-dark" placeholder="0912-345-678" required>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs text-warm-200/50 mb-2">日期 *</label>
              <input type="date" class="form-input-dark" required>
            </div>
            <div>
              <label class="block text-xs text-warm-200/50 mb-2">時段 *</label>
              <select class="form-input-dark" required>
                <option value="">選擇時段</option>
                <option>午餐 11:30</option>
                <option>午餐 12:00</option>
                <option>午餐 12:30</option>
                <option>午餐 13:00</option>
                <option>晚餐 17:30</option>
                <option>晚餐 18:00</option>
                <option>晚餐 18:30</option>
                <option>晚餐 19:00</option>
                <option>晚餐 19:30</option>
                <option>晚餐 20:00</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs text-warm-200/50 mb-2">人數 *</label>
              <select class="form-input-dark" required>
                <option value="">選擇人數</option>
                <option>1 位</option>
                <option>2 位</option>
                <option>3 位</option>
                <option>4 位</option>
                <option>5 位</option>
                <option>6 位</option>
                <option>7-8 位（需包廂）</option>
                <option>9-12 位（需包廂）</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-warm-200/50 mb-2">座位偏好</label>
              <select class="form-input-dark">
                <option>無偏好</option>
                <option>吧台席</option>
                <option>窗邊</option>
                <option>包廂</option>
              </select>
            </div>
          </div>
          <div class="mb-6">
            <label class="block text-xs text-warm-200/50 mb-2">備註</label>
            <textarea class="form-input-dark" rows="3" placeholder="過敏原、特殊需求、慶祝場合..." style="resize: vertical;"></textarea>
          </div>
          <button type="submit" class="w-full bg-warm-400 text-dark-900 text-sm font-semibold py-4 rounded-lg hover:bg-warm-300 transition-all cursor-pointer">
            確認訂位
          </button>
          <p class="text-center text-warm-200/30 text-xs mt-3">我們會在 2 小時內以簡訊確認</p>
        </form>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section id="reviews" class="py-24 lg:py-32">
  <div class="max-w-5xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-16 reveal">
      <span class="text-xs gold-text tracking-[0.3em] uppercase mb-4 block">顧客評價</span>
      <h2 class="font-serif text-3xl sm:text-4xl text-warm-100">饕客們怎麼說</h2>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <div class="reveal bg-white/[0.02] border border-warm-400/10 rounded-2xl p-6">
        <div class="flex gap-1 mb-4">
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-warm-200/60 text-sm leading-relaxed mb-4">「刺身的鮮度令人驚豔，特別是那道生海膽蒸蛋，入口即化的口感搭配金箔，視覺與味覺的雙重享受。」</p>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-warm-400/20 flex items-center justify-center text-warm-400 text-xs font-bold">A</div>
          <div>
            <div class="text-xs font-medium text-warm-100">Alex C.</div>
            <div class="text-[10px] text-warm-200/30">Google 評論</div>
          </div>
        </div>
      </div>

      <div class="reveal bg-white/[0.02] border border-warm-400/10 rounded-2xl p-6">
        <div class="flex gap-1 mb-4">
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-warm-200/60 text-sm leading-relaxed mb-4">「每次來和 KAZU 都像一場儀式。從入口的枯山水到吧台前師傅的職人手藝，處處都是細節。結婚紀念日首選。」</p>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-warm-400/20 flex items-center justify-center text-warm-400 text-xs font-bold">莊</div>
          <div>
            <div class="text-xs font-medium text-warm-100">莊小姐</div>
            <div class="text-[10px] text-warm-200/30">Tabelog 評論</div>
          </div>
        </div>
      </div>

      <div class="reveal bg-white/[0.02] border border-warm-400/10 rounded-2xl p-6">
        <div class="flex gap-1 mb-4">
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg width="16" height="16" fill="#c4934f" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-warm-200/60 text-sm leading-relaxed mb-4">「A5 和牛西京燒是我吃過最完美的。外層焦香、內裡嫩滑、味噌的甘甜恰到好處。果斷加入常客名單！」</p>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-warm-400/20 flex items-center justify-center text-warm-400 text-xs font-bold">K</div>
          <div>
            <div class="text-xs font-medium text-warm-100">Kevin W.</div>
            <div class="text-[10px] text-warm-200/30">Instagram @foodie_kevin</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-warm-400/10 py-16">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
      <div>
        <div class="flex items-center gap-3 mb-4">
          <span class="font-serif text-2xl gold-text">和</span>
          <span class="text-sm font-light tracking-[0.3em] text-warm-200">KAZU</span>
        </div>
        <p class="text-warm-200/40 text-sm leading-relaxed">傳統與現代的完美交融<br>當代和食料理</p>
      </div>
      <div>
        <h4 class="text-sm font-medium text-warm-100 mb-4">營業時間</h4>
        <ul class="space-y-2 text-sm text-warm-200/40">
          <li>午餐 11:30 - 14:30</li>
          <li>晚餐 17:30 - 22:00</li>
          <li>每週一公休</li>
        </ul>
      </div>
      <div>
        <h4 class="text-sm font-medium text-warm-100 mb-4">聯絡</h4>
        <ul class="space-y-2 text-sm text-warm-200/40">
          <li>02-2771-8888</li>
          <li>info@kazu.tw</li>
          <li>台北市大安區</li>
          <li>忠孝東路四段 218 號 2F</li>
        </ul>
      </div>
      <div>
        <h4 class="text-sm font-medium text-warm-100 mb-4">追蹤我們</h4>
        <div class="flex gap-4">
          <button onclick="showToast('前往 Instagram @kazu_taipei')" class="w-10 h-10 rounded-lg bg-warm-400/10 flex items-center justify-center hover:bg-warm-400/20 transition-colors cursor-pointer">
            <svg width="16" height="16" fill="#c4934f" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </button>
          <button onclick="showToast('前往 Facebook')" class="w-10 h-10 rounded-lg bg-warm-400/10 flex items-center justify-center hover:bg-warm-400/20 transition-colors cursor-pointer">
            <svg width="16" height="16" fill="#c4934f" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </button>
          <button onclick="showToast('LINE ID: @kazu-taipei')" class="w-10 h-10 rounded-lg bg-warm-400/10 flex items-center justify-center hover:bg-warm-400/20 transition-colors cursor-pointer">
            <svg width="16" height="16" fill="#c4934f" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zM24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
          </button>
        </div>
      </div>
    </div>
    <div class="border-t border-warm-400/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
      <p class="text-warm-200/30 text-xs">© 2026 和 KAZU. All rights reserved.</p>
      <div class="flex gap-6 text-warm-200/30 text-xs">
        <button onclick="showToast('隱私政策頁面即將推出')" class="hover:text-warm-200 cursor-pointer transition-colors">隱私政策</button>
        <button onclick="showToast('使用條款頁面即將推出')" class="hover:text-warm-200 cursor-pointer transition-colors">使用條款</button>
      </div>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] opacity-0 pointer-events-none transition-all duration-300 translate-y-4">
  <div class="bg-warm-400 text-dark-900 px-6 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3">
    <svg width="16" height="16" fill="none" stroke="#110f0a" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
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
    const el = document.querySelector(t);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ========== Menu Tabs ==========
function showMenuTab(tab) {
  document.querySelectorAll('.menu-content').forEach(el => el.classList.add('hidden'));
  document.getElementById('menu-' + tab).classList.remove('hidden');
  document.querySelectorAll('.menu-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
}

// ========== Reservation ==========
function handleReservation(e) {
  e.preventDefault();
  showToast('訂位成功！我們會在 2 小時內以簡訊確認');
  e.target.reset();
}

// ========== Reveal ==========
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
}, { threshold: 0.1 });
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
