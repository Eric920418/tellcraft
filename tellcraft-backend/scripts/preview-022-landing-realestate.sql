INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '21fa43b5-f7dc-4a5f-9519-a7a1e3cb2bd9',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>冠霆地產 Crown Realty</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        navy: '#0a1628',
        'navy-light': '#132038',
        gold: '#c9a86c',
        'gold-light': '#d4bc8e',
        'gold-soft': 'rgba(201,168,108,0.1)',
        cream: '#f8f6f1',
        warm: '#e8e2d8',
        ash: '#8a8580',
        slate: '#4a5568'
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['Inter', 'Noto Sans TC', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', 'Noto Sans TC', sans-serif; background: #f8f6f1; color: #0a1628; }

  /* Property card */
  .property-card { transition: all 0.3s ease; cursor: pointer; }
  .property-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(10,22,40,0.1); }
  .property-card .badge { transition: all 0.3s ease; }
  .property-card:hover .badge { background: #c9a86c; color: white; }

  /* Feature card */
  .feature-card { transition: all 0.3s ease; }
  .feature-card:hover { background: #0a1628; color: white; }
  .feature-card:hover .f-icon { background: rgba(201,168,108,0.2); }
  .feature-card:hover .f-desc { color: #8a8580; }

  /* Animations */
  .fade-up { opacity: 0; transform: translateY(20px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .fade-up.visible { opacity: 1; transform: translateY(0); }

  /* Counter animation */
  .counter { font-variant-numeric: tabular-nums; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #f8f6f1; }
  ::-webkit-scrollbar-thumb { background: #d4bc8e; border-radius: 3px; }
</style>
</head>
<body>

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-navy/95 backdrop-blur-md">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2">
      <div class="w-8 h-8 border border-gold rounded-sm flex items-center justify-center">
        <span class="font-display text-gold text-sm font-bold">C</span>
      </div>
      <div>
        <span class="text-white text-sm font-medium tracking-wider">冠霆地產</span>
        <span class="block text-[9px] text-gold-light tracking-[0.15em] uppercase -mt-0.5">Crown Realty</span>
      </div>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#properties" class="text-xs text-white/70 hover:text-gold transition-colors tracking-wider">精選物件</a>
      <a href="#services" class="text-xs text-white/70 hover:text-gold transition-colors tracking-wider">服務項目</a>
      <a href="#about" class="text-xs text-white/70 hover:text-gold transition-colors tracking-wider">關於我們</a>
      <a href="#contact" class="text-xs text-white/70 hover:text-gold transition-colors tracking-wider">聯繫</a>
      <button onclick="handleAction('免費估價')" class="px-5 py-2 border border-gold text-gold text-xs tracking-wider hover:bg-gold hover:text-navy transition-all rounded-sm">
        免費估價
      </button>
    </div>
    <button onclick="toggleMenu()" class="md:hidden text-white/70">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8h16M4 16h16"/></svg>
    </button>
  </div>
  <div id="mobileMenu" class="hidden md:hidden bg-navy border-t border-white/10">
    <div class="px-6 py-4 space-y-3">
      <a href="#properties" onclick="toggleMenu()" class="block text-sm text-white/70">精選物件</a>
      <a href="#services" onclick="toggleMenu()" class="block text-sm text-white/70">服務項目</a>
      <a href="#about" onclick="toggleMenu()" class="block text-sm text-white/70">關於我們</a>
      <a href="#contact" onclick="toggleMenu()" class="block text-sm text-white/70">聯繫</a>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="relative bg-navy text-white pt-16 overflow-hidden">
  <div class="max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
    <div class="fade-up">
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-gold-soft border border-gold/20 rounded-full mb-6">
        <span class="w-1.5 h-1.5 rounded-full bg-gold"></span>
        <span class="text-[10px] text-gold tracking-wider uppercase">2026 年精選建案</span>
      </div>
      <h1 class="font-display text-4xl md:text-6xl font-semibold leading-tight mb-6">
        為您找到<br><span class="text-gold italic">理想的家</span>
      </h1>
      <p class="text-sm text-white/60 max-w-md leading-relaxed mb-8">
        深耕大台北地區 18 年，冠霆地產以專業服務和精準眼光，為每一位客戶找到最適合的居住與投資選擇。
      </p>

      <!-- Search bar -->
      <div class="bg-navy-light border border-white/10 rounded-lg p-3 flex flex-col md:flex-row gap-2">
        <select class="flex-1 bg-transparent text-xs text-white/80 px-3 py-2 border border-white/10 rounded focus:outline-none focus:border-gold/50">
          <option>地區</option>
          <option>大安區</option>
          <option>信義區</option>
          <option>中山區</option>
          <option>內湖區</option>
          <option>松山區</option>
        </select>
        <select class="flex-1 bg-transparent text-xs text-white/80 px-3 py-2 border border-white/10 rounded focus:outline-none focus:border-gold/50">
          <option>類型</option>
          <option>住宅</option>
          <option>商辦</option>
          <option>店面</option>
          <option>土地</option>
        </select>
        <select class="flex-1 bg-transparent text-xs text-white/80 px-3 py-2 border border-white/10 rounded focus:outline-none focus:border-gold/50">
          <option>預算</option>
          <option>1000-2000 萬</option>
          <option>2000-4000 萬</option>
          <option>4000-6000 萬</option>
          <option>6000 萬以上</option>
        </select>
        <button onclick="handleAction('搜尋物件')" class="px-6 py-2 bg-gold text-navy text-xs font-semibold rounded hover:bg-gold-light transition-colors">
          搜尋
        </button>
      </div>
    </div>

    <!-- Hero image -->
    <div class="relative fade-up">
      <div class="aspect-[4/5] bg-gradient-to-b from-navy-light to-navy rounded-xl overflow-hidden relative border border-white/5">
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="text-7xl opacity-15">🏛</div>
            <div class="text-xs text-white/20 mt-2">信義豪宅實景</div>
          </div>
        </div>
        <!-- Price tag -->
        <div class="absolute bottom-4 left-4 right-4 bg-navy/80 backdrop-blur-md rounded-lg p-4 border border-white/10">
          <div class="text-xs text-gold mb-1">本月精選</div>
          <h3 class="font-display text-lg font-semibold text-white mb-1">信義之冠 · 頂層雙拼</h3>
          <div class="flex items-center justify-between">
            <span class="text-xs text-white/60">4房2廳 · 168 坪</span>
            <span class="text-gold font-semibold">NT$ 2.8 億</span>
          </div>
        </div>
      </div>
      <!-- Floating stat -->
      <div class="absolute -right-4 top-8 bg-white text-navy rounded-lg p-3 shadow-xl hidden md:block">
        <div class="text-2xl font-bold text-gold">98%</div>
        <div class="text-[10px] text-slate">客戶滿意度</div>
      </div>
    </div>
  </div>
</section>

<!-- Stats bar -->
<section class="bg-gold py-6 px-6">
  <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
    <div>
      <div class="counter text-2xl font-bold text-navy">18+</div>
      <div class="text-xs text-navy/60">年服務經驗</div>
    </div>
    <div>
      <div class="counter text-2xl font-bold text-navy">2,400+</div>
      <div class="text-xs text-navy/60">成交案件</div>
    </div>
    <div>
      <div class="counter text-2xl font-bold text-navy">$150 億</div>
      <div class="text-xs text-navy/60">累積成交額</div>
    </div>
    <div>
      <div class="counter text-2xl font-bold text-navy">96%</div>
      <div class="text-xs text-navy/60">轉介率</div>
    </div>
  </div>
</section>

<!-- Properties -->
<section id="properties" class="py-20 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="flex items-end justify-between mb-10 fade-up">
      <div>
        <span class="text-xs text-gold tracking-widest uppercase">Featured Properties</span>
        <h2 class="font-display text-3xl font-semibold mt-1">精選物件</h2>
      </div>
      <a onclick="handleAction('查看全部物件')" class="cursor-pointer text-xs text-gold hover:text-navy transition-colors hidden md:block">查看全部 →</a>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <!-- Property 1 -->
      <div class="property-card bg-white rounded-xl overflow-hidden shadow-sm fade-up" onclick="handleAction('查看 信義之冠')">
        <div class="aspect-[4/3] bg-gradient-to-b from-blue-50 to-blue-100 relative">
          <div class="absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-15">🏢</span></div>
          <div class="absolute top-3 left-3 badge px-2 py-1 bg-navy text-white text-[10px] rounded">精選</div>
          <div class="absolute top-3 right-3 px-2 py-1 bg-white/90 text-navy text-[10px] rounded">住宅</div>
        </div>
        <div class="p-5">
          <div class="flex items-center gap-1 text-[10px] text-gold mb-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            信義區
          </div>
          <h3 class="font-display text-lg font-semibold mb-2">信義之冠 · 頂層雙拼</h3>
          <div class="flex items-center gap-3 text-[10px] text-slate mb-3">
            <span>4 房</span><span>·</span><span>168 坪</span><span>·</span><span>42F</span>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-cream">
            <span class="text-lg font-bold text-navy">NT$ 2.8 億</span>
            <span class="text-[10px] text-ash">約 166 萬/坪</span>
          </div>
        </div>
      </div>

      <!-- Property 2 -->
      <div class="property-card bg-white rounded-xl overflow-hidden shadow-sm fade-up" onclick="handleAction('查看 大安逸境')">
        <div class="aspect-[4/3] bg-gradient-to-b from-green-50 to-emerald-50 relative">
          <div class="absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-15">🏠</span></div>
          <div class="absolute top-3 left-3 badge px-2 py-1 bg-gold text-white text-[10px] rounded">熱門</div>
          <div class="absolute top-3 right-3 px-2 py-1 bg-white/90 text-navy text-[10px] rounded">住宅</div>
        </div>
        <div class="p-5">
          <div class="flex items-center gap-1 text-[10px] text-gold mb-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            大安區
          </div>
          <h3 class="font-display text-lg font-semibold mb-2">大安逸境 · 花園別墅</h3>
          <div class="flex items-center gap-3 text-[10px] text-slate mb-3">
            <span>5 房</span><span>·</span><span>86 坪</span><span>·</span><span>3F</span>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-cream">
            <span class="text-lg font-bold text-navy">NT$ 8,800 萬</span>
            <span class="text-[10px] text-ash">約 102 萬/坪</span>
          </div>
        </div>
      </div>

      <!-- Property 3 -->
      <div class="property-card bg-white rounded-xl overflow-hidden shadow-sm fade-up" onclick="handleAction('查看 中山 ONE')">
        <div class="aspect-[4/3] bg-gradient-to-b from-purple-50 to-indigo-50 relative">
          <div class="absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-15">🏬</span></div>
          <div class="absolute top-3 left-3 badge px-2 py-1 bg-navy text-white text-[10px] rounded">新案</div>
          <div class="absolute top-3 right-3 px-2 py-1 bg-white/90 text-navy text-[10px] rounded">商辦</div>
        </div>
        <div class="p-5">
          <div class="flex items-center gap-1 text-[10px] text-gold mb-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            中山區
          </div>
          <h3 class="font-display text-lg font-semibold mb-2">中山 ONE · 頂級商辦</h3>
          <div class="flex items-center gap-3 text-[10px] text-slate mb-3">
            <span>開放格局</span><span>·</span><span>120 坪</span><span>·</span><span>22F</span>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-cream">
            <span class="text-lg font-bold text-navy">NT$ 1.2 億</span>
            <span class="text-[10px] text-ash">約 100 萬/坪</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-20 px-6 bg-navy text-white">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-12 fade-up">
      <span class="text-xs text-gold tracking-widest uppercase">Our Services</span>
      <h2 class="font-display text-3xl font-semibold mt-2 mb-3">專業服務</h2>
      <p class="text-sm text-white/50 max-w-lg mx-auto">18 年來，我們始終以客戶利益為核心，提供全方位的不動產服務。</p>
    </div>

    <div class="grid md:grid-cols-3 gap-5">
      <div class="feature-card border border-white/10 rounded-xl p-6 text-center fade-up">
        <div class="f-icon w-14 h-14 mx-auto bg-gold-soft rounded-xl flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a86c" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
        </div>
        <h3 class="font-display text-lg font-semibold mb-2">買賣仲介</h3>
        <p class="f-desc text-xs text-white/50 leading-relaxed">精準配對買家與賣家，從估價、帶看到成交，全程專人服務。成交速度平均比同業快 40%。</p>
      </div>

      <div class="feature-card border border-white/10 rounded-xl p-6 text-center fade-up">
        <div class="f-icon w-14 h-14 mx-auto bg-gold-soft rounded-xl flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a86c" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <h3 class="font-display text-lg font-semibold mb-2">投資顧問</h3>
        <p class="f-desc text-xs text-white/50 leading-relaxed">專業市場分析與投資建議。精選高潛力物件，協助客戶實現資產穩健增值。</p>
      </div>

      <div class="feature-card border border-white/10 rounded-xl p-6 text-center fade-up">
        <div class="f-icon w-14 h-14 mx-auto bg-gold-soft rounded-xl flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a86c" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
        </div>
        <h3 class="font-display text-lg font-semibold mb-2">租賃管理</h3>
        <p class="f-desc text-xs text-white/50 leading-relaxed">從招租、簽約到日常維護的一站式管理，讓房東安心收租，房客住得舒適。</p>
      </div>
    </div>
  </div>
</section>

<!-- About -->
<section id="about" class="py-20 px-6">
  <div class="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
    <div class="fade-up">
      <div class="aspect-square bg-gradient-to-br from-navy/5 to-gold/10 rounded-xl flex items-center justify-center relative overflow-hidden">
        <span class="text-8xl opacity-10">🤝</span>
        <div class="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-warm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-white font-display font-bold text-lg">C</div>
            <div>
              <div class="text-xs font-semibold">冠霆地產</div>
              <div class="text-[10px] text-ash">內政部不動產經紀業許可 (108) 字第 0001234 號</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="fade-up">
      <span class="text-xs text-gold tracking-widest uppercase">About Us</span>
      <h2 class="font-display text-3xl font-semibold mt-2 mb-6">以信賴為本<br>以專業致勝</h2>
      <p class="text-sm text-slate leading-relaxed mb-4">
        冠霆地產自 2008 年成立以來，始終秉持「以客為尊」的服務理念。我們的團隊由 24 位具備國家不動產經紀人資格的專業顧問組成，深耕大台北地區高端住宅與商辦市場。
      </p>
      <p class="text-sm text-slate leading-relaxed mb-8">
        我們不只是仲介，更是您的不動產策略夥伴。從市場趨勢分析到法律稅務諮詢，提供您最完整的服務。
      </p>
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-cream rounded-lg p-4">
          <div class="text-xl font-bold text-navy">24 位</div>
          <div class="text-[10px] text-ash mt-1">專業經紀人</div>
        </div>
        <div class="bg-cream rounded-lg p-4">
          <div class="text-xl font-bold text-navy">5 間</div>
          <div class="text-[10px] text-ash mt-1">服務據點</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="py-20 px-6 bg-cream">
  <div class="max-w-5xl mx-auto">
    <div class="text-center mb-12 fade-up">
      <span class="text-xs text-gold tracking-widest uppercase">Testimonials</span>
      <h2 class="font-display text-3xl font-semibold mt-2">客戶推薦</h2>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl p-6 shadow-sm fade-up">
        <div class="flex items-center gap-1 text-gold mb-4">
          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
        </div>
        <p class="text-sm text-slate leading-relaxed mb-4">
          "在冠霆的幫助下，我們找到了理想的學區房。周經理不厭其煩地帶看了十幾間房子，每次都會先做功課，告訴我們每間房子的優缺點。最後成交價還比開價低了 200 萬，非常感謝！"
        </p>
        <div class="flex items-center gap-3 pt-3 border-t border-cream">
          <div class="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">陳</div>
          <div>
            <div class="text-xs font-semibold">陳先生 & 王小姐</div>
            <div class="text-[10px] text-ash">大安區成交客戶</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-sm fade-up">
        <div class="flex items-center gap-1 text-gold mb-4">
          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
        </div>
        <p class="text-sm text-slate leading-relaxed mb-4">
          "做為投資客，我最在意的是數據和效率。冠霆的投資顧問團隊提供的市場分析報告非常專業，幫我在信義計畫區找到了一間年投報率 4.2% 的物件。後續的租賃管理也很省心。"
        </p>
        <div class="flex items-center gap-3 pt-3 border-t border-cream">
          <div class="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">林</div>
          <div>
            <div class="text-xs font-semibold">林董事長</div>
            <div class="text-[10px] text-ash">信義區投資客戶</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-20 px-6">
  <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
    <div class="fade-up">
      <span class="text-xs text-gold tracking-widest uppercase">Contact</span>
      <h2 class="font-display text-3xl font-semibold mt-2 mb-6">預約諮詢</h2>
      <p class="text-sm text-slate leading-relaxed mb-8">
        留下您的需求，專屬顧問將在 24 小時內與您聯繫。所有諮詢完全免費，絕無推銷壓力。
      </p>
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gold-soft rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a86c" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          </div>
          <div>
            <div class="text-xs text-ash">電話</div>
            <div class="text-sm font-medium">02-2755-8888</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gold-soft rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a86c" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
          </div>
          <div>
            <div class="text-xs text-ash">Email</div>
            <div class="text-sm font-medium">info@crownrealty.tw</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gold-soft rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" fill="#c9a86c"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <div>
            <div class="text-xs text-ash">總部</div>
            <div class="text-sm font-medium">台北市大安區敦化南路二段 168 號 12 樓</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div class="bg-white rounded-xl p-6 shadow-sm fade-up">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-[10px] text-ash uppercase tracking-wider mb-1 block">姓名</label>
            <input type="text" placeholder="您的姓名" class="w-full px-3 py-2.5 bg-cream border border-warm rounded text-sm focus:outline-none focus:border-gold">
          </div>
          <div>
            <label class="text-[10px] text-ash uppercase tracking-wider mb-1 block">電話</label>
            <input type="tel" placeholder="09xx-xxx-xxx" class="w-full px-3 py-2.5 bg-cream border border-warm rounded text-sm focus:outline-none focus:border-gold">
          </div>
        </div>
        <div>
          <label class="text-[10px] text-ash uppercase tracking-wider mb-1 block">需求類型</label>
          <select class="w-full px-3 py-2.5 bg-cream border border-warm rounded text-sm text-slate focus:outline-none focus:border-gold">
            <option>買屋</option>
            <option>賣屋</option>
            <option>租賃</option>
            <option>投資諮詢</option>
            <option>免費估價</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] text-ash uppercase tracking-wider mb-1 block">預算範圍</label>
          <select class="w-full px-3 py-2.5 bg-cream border border-warm rounded text-sm text-slate focus:outline-none focus:border-gold">
            <option>1,000-2,000 萬</option>
            <option>2,000-4,000 萬</option>
            <option>4,000-6,000 萬</option>
            <option>6,000-10,000 萬</option>
            <option>1 億以上</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] text-ash uppercase tracking-wider mb-1 block">備註</label>
          <textarea rows="3" placeholder="請描述您的需求..." class="w-full px-3 py-2.5 bg-cream border border-warm rounded text-sm resize-none focus:outline-none focus:border-gold"></textarea>
        </div>
        <button onclick="handleAction('提交諮詢')" class="w-full py-3 bg-navy text-white text-sm font-medium rounded hover:bg-gold transition-colors">
          預約免費諮詢
        </button>
        <p class="text-[10px] text-ash text-center">我們重視您的隱私，資料絕不外洩。</p>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-navy text-white py-12 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-7 h-7 border border-gold rounded-sm flex items-center justify-center">
            <span class="font-display text-gold text-xs font-bold">C</span>
          </div>
          <span class="text-sm font-medium">冠霆地產</span>
        </div>
        <p class="text-xs text-white/40 leading-relaxed">以信賴為本，以專業致勝。<br>深耕大台北 18 年。</p>
      </div>
      <div>
        <h4 class="text-xs font-medium text-gold mb-3">服務據點</h4>
        <div class="space-y-1.5 text-xs text-white/50">
          <div>大安旗艦店</div>
          <div>信義營業處</div>
          <div>中山營業處</div>
          <div>內湖營業處</div>
          <div>新板營業處</div>
        </div>
      </div>
      <div>
        <h4 class="text-xs font-medium text-gold mb-3">服務項目</h4>
        <div class="space-y-1.5 text-xs text-white/50">
          <a onclick="handleAction('買屋')" class="block cursor-pointer hover:text-white transition-colors">買屋服務</a>
          <a onclick="handleAction('賣屋')" class="block cursor-pointer hover:text-white transition-colors">賣屋服務</a>
          <a onclick="handleAction('租賃')" class="block cursor-pointer hover:text-white transition-colors">租賃管理</a>
          <a onclick="handleAction('投資')" class="block cursor-pointer hover:text-white transition-colors">投資顧問</a>
        </div>
      </div>
      <div>
        <h4 class="text-xs font-medium text-gold mb-3">聯繫我們</h4>
        <div class="space-y-1.5 text-xs text-white/50">
          <div>02-2755-8888</div>
          <div>info@crownrealty.tw</div>
          <div class="flex items-center gap-3 pt-2">
            <a onclick="handleAction('Facebook')" class="cursor-pointer text-white/50 hover:text-gold transition-colors text-sm">FB</a>
            <a onclick="handleAction('LINE')" class="cursor-pointer text-white/50 hover:text-gold transition-colors text-sm">LINE</a>
            <a onclick="handleAction('Instagram')" class="cursor-pointer text-white/50 hover:text-gold transition-colors text-sm">IG</a>
          </div>
        </div>
      </div>
    </div>
    <div class="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
      <p class="text-[10px] text-white/30">© 2008-2026 冠霆地產 Crown Realty. All rights reserved.</p>
      <p class="text-[10px] text-white/30">內政部不動產經紀業許可 (108) 字第 0001234 號</p>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-navy text-white px-5 py-3 rounded-lg text-xs shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-50 max-w-sm text-center border border-gold/20"></div>

<script>
function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('hidden'); }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1'; t.style.transform = 'translate(-50%, 0)';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translate(-50%, 8px)'; }, 2500);
}
function handleAction(a) { showToast(a + ' — 此為模板展示'); }

const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
</script>

</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
