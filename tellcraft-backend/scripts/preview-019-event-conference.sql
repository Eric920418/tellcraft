INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '9db13e1a-a855-4421-9154-138b6fba26fd',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SYNTAX 台北 2026 — 前端技術研討會</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        dark: '#0a0a0f',
        surface: '#12121a',
        card: '#1a1a26',
        border: '#2a2a3a',
        text: '#e8e8f0',
        muted: '#8888a0',
        dim: '#55556a',
        primary: '#818cf8',
        secondary: '#c084fc',
        accent: '#22d3ee',
        hot: '#f472b6'
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Noto Sans TC', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Space Grotesk', 'Noto Sans TC', sans-serif; background: #0a0a0f; color: #e8e8f0; }

  /* Gradient mesh bg */
  .hero-bg {
    position: relative;
    overflow: hidden;
  }
  .hero-bg::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: radial-gradient(circle at 30% 40%, rgba(129,140,248,0.15) 0%, transparent 50%),
                radial-gradient(circle at 70% 60%, rgba(192,132,252,0.12) 0%, transparent 50%),
                radial-gradient(circle at 50% 80%, rgba(34,211,238,0.08) 0%, transparent 50%);
    animation: meshFloat 20s ease-in-out infinite;
  }
  @keyframes meshFloat {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(2%, -1%) rotate(1deg); }
    66% { transform: translate(-1%, 2%) rotate(-1deg); }
  }

  /* Countdown */
  .countdown-box {
    background: rgba(26, 26, 38, 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(129, 140, 248, 0.2);
  }

  /* Schedule tabs */
  .day-tab { transition: all 0.3s ease; }
  .day-tab:hover { color: #e8e8f0; }
  .day-tab.active {
    background: linear-gradient(135deg, #818cf8, #c084fc);
    color: white;
  }

  /* Schedule track */
  .track-item { transition: all 0.2s ease; }
  .track-item:hover { background: #1a1a26; border-color: rgba(129,140,248,0.3); }

  /* Speaker card */
  .speaker-card { transition: all 0.3s ease; }
  .speaker-card:hover { transform: translateY(-4px); border-color: rgba(129,140,248,0.4); }

  /* Pricing */
  .price-card { transition: all 0.3s ease; }
  .price-card:hover { transform: translateY(-4px); }
  .price-card.featured { border-color: rgba(129,140,248,0.5); }

  /* Animations */
  .fade-up {
    opacity: 0; transform: translateY(24px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .fade-up.visible { opacity: 1; transform: translateY(0); }

  /* Gradient text */
  .grad-text {
    background: linear-gradient(135deg, #818cf8, #c084fc, #22d3ee);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Sponsor logos */
  .sponsor-logo {
    transition: all 0.3s ease;
    filter: grayscale(1) brightness(0.6);
  }
  .sponsor-logo:hover { filter: grayscale(0) brightness(1); }

  /* Glow button */
  .glow-btn {
    position: relative;
    background: linear-gradient(135deg, #818cf8, #c084fc);
    transition: all 0.3s ease;
  }
  .glow-btn:hover {
    box-shadow: 0 0 30px rgba(129, 140, 248, 0.4);
    transform: translateY(-1px);
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0a0a0f; }
  ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 3px; }
</style>
</head>
<body>

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-dark/80 backdrop-blur-md border-b border-border/50">
  <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-lg font-bold grad-text">SYNTAX</span>
      <span class="text-xs text-dim font-medium">TAIPEI 2026</span>
    </div>
    <div class="hidden md:flex items-center gap-6">
      <a href="#speakers" class="text-xs text-muted hover:text-text transition-colors">講者</a>
      <a href="#schedule" class="text-xs text-muted hover:text-text transition-colors">議程</a>
      <a href="#pricing" class="text-xs text-muted hover:text-text transition-colors">票價</a>
      <a href="#sponsors" class="text-xs text-muted hover:text-text transition-colors">贊助</a>
      <button onclick="handleAction('報名')" class="glow-btn text-xs text-white px-4 py-1.5 rounded-full font-medium">立即報名</button>
    </div>
    <button onclick="toggleMobileMenu()" class="md:hidden text-muted">
      <svg id="menuIcon" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>
    </button>
  </div>
  <div id="mobileMenu" class="hidden md:hidden border-t border-border bg-dark/95 backdrop-blur-md">
    <div class="px-6 py-4 space-y-3">
      <a href="#speakers" onclick="closeMobile()" class="block text-sm text-muted">講者</a>
      <a href="#schedule" onclick="closeMobile()" class="block text-sm text-muted">議程</a>
      <a href="#pricing" onclick="closeMobile()" class="block text-sm text-muted">票價</a>
      <button onclick="handleAction('報名');closeMobile()" class="glow-btn w-full text-sm text-white py-2 rounded-lg font-medium mt-2">立即報名</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="hero-bg min-h-screen flex items-center justify-center relative pt-14">
  <div class="relative z-10 text-center px-6 max-w-4xl mx-auto">
    <!-- Badge -->
    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-8 fade-up">
      <span class="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
      <span class="text-xs text-primary font-medium">2026 年 5 月 17-18 日 · 台北國際會議中心</span>
    </div>

    <h1 class="text-5xl md:text-7xl font-bold mb-4 tracking-tight fade-up">
      <span class="grad-text">SYNTAX</span>
    </h1>
    <h2 class="text-xl md:text-2xl text-muted font-medium mb-6 fade-up">台北前端技術研討會 2026</h2>
    <p class="text-sm md:text-base text-dim max-w-xl mx-auto mb-10 leading-relaxed fade-up">
      兩天 · 20+ 場演講 · 500+ 開發者<br>
      從 React 到 AI，從效能到架構，一次掌握前端最前沿的技術趨勢。
    </p>

    <!-- CTA buttons -->
    <div class="flex items-center justify-center gap-4 mb-16 fade-up">
      <button onclick="handleAction('報名')" class="glow-btn px-8 py-3 rounded-full text-white font-semibold text-sm">
        立即報名 →
      </button>
      <a href="#schedule" class="px-6 py-3 rounded-full border border-border text-muted hover:text-text hover:border-primary/50 transition-all text-sm font-medium">
        查看議程
      </a>
    </div>

    <!-- Countdown -->
    <div class="flex items-center justify-center gap-3 md:gap-4 fade-up">
      <div class="countdown-box rounded-xl px-4 md:px-6 py-3 text-center min-w-[72px]">
        <div id="cd-days" class="text-2xl md:text-3xl font-bold grad-text">90</div>
        <div class="text-[10px] text-dim uppercase tracking-wider mt-1">DAYS</div>
      </div>
      <span class="text-dim text-xl">:</span>
      <div class="countdown-box rounded-xl px-4 md:px-6 py-3 text-center min-w-[72px]">
        <div id="cd-hours" class="text-2xl md:text-3xl font-bold grad-text">14</div>
        <div class="text-[10px] text-dim uppercase tracking-wider mt-1">HOURS</div>
      </div>
      <span class="text-dim text-xl">:</span>
      <div class="countdown-box rounded-xl px-4 md:px-6 py-3 text-center min-w-[72px]">
        <div id="cd-mins" class="text-2xl md:text-3xl font-bold grad-text">32</div>
        <div class="text-[10px] text-dim uppercase tracking-wider mt-1">MINS</div>
      </div>
      <span class="text-dim text-xl">:</span>
      <div class="countdown-box rounded-xl px-4 md:px-6 py-3 text-center min-w-[72px]">
        <div id="cd-secs" class="text-2xl md:text-3xl font-bold grad-text">05</div>
        <div class="text-[10px] text-dim uppercase tracking-wider mt-1">SECS</div>
      </div>
    </div>
  </div>

  <!-- Scroll indicator -->
  <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
    <div class="w-5 h-8 border border-dim/50 rounded-full flex justify-center pt-1.5">
      <div class="w-1 h-2 bg-primary/60 rounded-full animate-bounce"></div>
    </div>
  </div>
</section>

<!-- Speakers -->
<section id="speakers" class="py-20 px-6">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12 fade-up">
      <span class="text-xs text-primary uppercase tracking-widest font-medium">SPEAKERS</span>
      <h2 class="text-3xl font-bold mt-2 mb-3">講者陣容</h2>
      <p class="text-sm text-muted max-w-lg mx-auto">來自 Google、Meta、Vercel、獨立開發者社群的頂尖技術專家</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <!-- Speaker 1 -->
      <div class="speaker-card border border-border rounded-xl p-5 text-center cursor-pointer fade-up" onclick="handleAction('查看講者 Sarah Chen 詳細')">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center mb-4">
          <span class="text-3xl">👩‍💻</span>
        </div>
        <h3 class="font-semibold text-sm text-text">Sarah Chen</h3>
        <p class="text-xs text-primary mt-1">React Core Team</p>
        <p class="text-xs text-dim mt-1">@ Meta</p>
        <div class="mt-3 px-2 py-1 bg-card rounded text-[10px] text-muted">Server Components 深度解析</div>
      </div>

      <!-- Speaker 2 -->
      <div class="speaker-card border border-border rounded-xl p-5 text-center cursor-pointer fade-up" onclick="handleAction('查看講者 林柏翰 詳細')">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center mb-4">
          <span class="text-3xl">🧑‍💻</span>
        </div>
        <h3 class="font-semibold text-sm text-text">林柏翰</h3>
        <p class="text-xs text-accent mt-1">DX Engineer</p>
        <p class="text-xs text-dim mt-1">@ Vercel</p>
        <div class="mt-3 px-2 py-1 bg-card rounded text-[10px] text-muted">Next.js 16 新架構實戰</div>
      </div>

      <!-- Speaker 3 -->
      <div class="speaker-card border border-border rounded-xl p-5 text-center cursor-pointer fade-up" onclick="handleAction('查看講者 Yuki Tanaka 詳細')">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-hot/30 to-secondary/20 flex items-center justify-center mb-4">
          <span class="text-3xl">👩‍🎨</span>
        </div>
        <h3 class="font-semibold text-sm text-text">Yuki Tanaka</h3>
        <p class="text-xs text-hot mt-1">Design Engineer</p>
        <p class="text-xs text-dim mt-1">@ Figma</p>
        <div class="mt-3 px-2 py-1 bg-card rounded text-[10px] text-muted">Design System at Scale</div>
      </div>

      <!-- Speaker 4 -->
      <div class="speaker-card border border-border rounded-xl p-5 text-center cursor-pointer fade-up" onclick="handleAction('查看講者 王家豪 詳細')">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500/30 to-accent/20 flex items-center justify-center mb-4">
          <span class="text-3xl">🧑‍🔬</span>
        </div>
        <h3 class="font-semibold text-sm text-text">王家豪</h3>
        <p class="text-xs text-green-400 mt-1">AI/ML Engineer</p>
        <p class="text-xs text-dim mt-1">@ Google</p>
        <div class="mt-3 px-2 py-1 bg-card rounded text-[10px] text-muted">AI-Powered Web Dev</div>
      </div>

      <!-- Speaker 5-8 -->
      <div class="speaker-card border border-border rounded-xl p-5 text-center cursor-pointer fade-up" onclick="handleAction('查看講者 Alex Rim 詳細')">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-500/30 to-primary/20 flex items-center justify-center mb-4">
          <span class="text-3xl">🧑‍💻</span>
        </div>
        <h3 class="font-semibold text-sm text-text">Alex Rim</h3>
        <p class="text-xs text-yellow-400 mt-1">Performance Lead</p>
        <p class="text-xs text-dim mt-1">@ Shopify</p>
        <div class="mt-3 px-2 py-1 bg-card rounded text-[10px] text-muted">Web Vitals 極限優化</div>
      </div>

      <div class="speaker-card border border-border rounded-xl p-5 text-center cursor-pointer fade-up" onclick="handleAction('查看講者 陳雅琳 詳細')">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-secondary/30 to-hot/20 flex items-center justify-center mb-4">
          <span class="text-3xl">👩‍💻</span>
        </div>
        <h3 class="font-semibold text-sm text-text">陳雅琳</h3>
        <p class="text-xs text-secondary mt-1">Tech Lead</p>
        <p class="text-xs text-dim mt-1">@ LINE</p>
        <div class="mt-3 px-2 py-1 bg-card rounded text-[10px] text-muted">大規模前端架構治理</div>
      </div>

      <div class="speaker-card border border-border rounded-xl p-5 text-center cursor-pointer fade-up" onclick="handleAction('查看講者 Mike Park 詳細')">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-accent/30 to-green-500/20 flex items-center justify-center mb-4">
          <span class="text-3xl">🧑‍🏫</span>
        </div>
        <h3 class="font-semibold text-sm text-text">Mike Park</h3>
        <p class="text-xs text-accent mt-1">OSS Maintainer</p>
        <p class="text-xs text-dim mt-1">Vitest / Vite</p>
        <div class="mt-3 px-2 py-1 bg-card rounded text-[10px] text-muted">現代測試框架的未來</div>
      </div>

      <div class="speaker-card border border-border rounded-xl p-5 text-center cursor-pointer fade-up" onclick="handleAction('查看講者 張書涵 詳細')">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center mb-4">
          <span class="text-3xl">👩‍🚀</span>
        </div>
        <h3 class="font-semibold text-sm text-text">張書涵</h3>
        <p class="text-xs text-primary mt-1">Indie Hacker</p>
        <p class="text-xs text-dim mt-1">獨立開發者</p>
        <div class="mt-3 px-2 py-1 bg-card rounded text-[10px] text-muted">一人團隊的全端之路</div>
      </div>
    </div>
  </div>
</section>

<!-- Schedule -->
<section id="schedule" class="py-20 px-6 bg-surface">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-10 fade-up">
      <span class="text-xs text-primary uppercase tracking-widest font-medium">SCHEDULE</span>
      <h2 class="text-3xl font-bold mt-2 mb-3">議程表</h2>
    </div>

    <!-- Day tabs -->
    <div class="flex items-center justify-center gap-2 mb-8 fade-up">
      <button onclick="switchDay(1)" class="day-tab active px-6 py-2 rounded-full text-sm font-medium text-white" data-day="1">
        Day 1 · 5/17 (六)
      </button>
      <button onclick="switchDay(2)" class="day-tab px-6 py-2 rounded-full text-sm font-medium text-dim border border-border" data-day="2">
        Day 2 · 5/18 (日)
      </button>
    </div>

    <!-- Day 1 schedule -->
    <div id="day1" class="space-y-3 max-w-3xl mx-auto">
      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-primary">09:00</div>
          <div class="text-[10px] text-dim">30 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded mb-2">Opening</div>
          <h3 class="font-semibold text-sm mb-1">開幕演講：前端的下一個十年</h3>
          <p class="text-xs text-muted">SYNTAX 主辦團隊</p>
        </div>
      </div>

      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-primary">09:40</div>
          <div class="text-[10px] text-dim">45 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-cyan-500/10 text-accent text-[10px] rounded mb-2">Keynote</div>
          <h3 class="font-semibold text-sm mb-1">React Server Components 深度解析</h3>
          <p class="text-xs text-muted">Sarah Chen · React Core Team @ Meta</p>
        </div>
      </div>

      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-dim">10:30</div>
          <div class="text-[10px] text-dim">15 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-dim/20 text-dim text-[10px] rounded mb-2">Break</div>
          <h3 class="font-medium text-sm text-dim">☕ 茶歇</h3>
        </div>
      </div>

      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-primary">10:45</div>
          <div class="text-[10px] text-dim">40 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] rounded mb-2">Talk</div>
          <h3 class="font-semibold text-sm mb-1">Next.js 16 新架構實戰：PPR 與 Streaming</h3>
          <p class="text-xs text-muted">林柏翰 · DX Engineer @ Vercel</p>
        </div>
      </div>

      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-primary">11:30</div>
          <div class="text-[10px] text-dim">40 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-hot/10 text-hot text-[10px] rounded mb-2">Talk</div>
          <h3 class="font-semibold text-sm mb-1">Design System at Scale：從 Token 到 Component</h3>
          <p class="text-xs text-muted">Yuki Tanaka · Design Engineer @ Figma</p>
        </div>
      </div>

      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-dim">12:15</div>
          <div class="text-[10px] text-dim">75 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-dim/20 text-dim text-[10px] rounded mb-2">Lunch</div>
          <h3 class="font-medium text-sm text-dim">🍱 午餐 + Networking</h3>
        </div>
      </div>

      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-primary">13:30</div>
          <div class="text-[10px] text-dim">40 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] rounded mb-2">Keynote</div>
          <h3 class="font-semibold text-sm mb-1">AI-Powered Web Dev：當 AI 成為你的結對夥伴</h3>
          <p class="text-xs text-muted">王家豪 · AI/ML Engineer @ Google</p>
        </div>
      </div>

      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-primary">14:15</div>
          <div class="text-[10px] text-dim">40 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-[10px] rounded mb-2">Talk</div>
          <h3 class="font-semibold text-sm mb-1">Web Vitals 極限優化：從 3 秒到 0.3 秒</h3>
          <p class="text-xs text-muted">Alex Rim · Performance Lead @ Shopify</p>
        </div>
      </div>

      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-primary">15:30</div>
          <div class="text-[10px] text-dim">60 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] rounded mb-2">Panel</div>
          <h3 class="font-semibold text-sm mb-1">圓桌論壇：前端工程師的職涯發展</h3>
          <p class="text-xs text-muted">多位講者 · 主持：SYNTAX 團隊</p>
        </div>
      </div>

      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-dim">17:00</div>
          <div class="text-[10px] text-dim">120 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-hot/10 text-hot text-[10px] rounded mb-2">After Party</div>
          <h3 class="font-medium text-sm">🎉 Day 1 After Party</h3>
          <p class="text-xs text-dim">飲料 · 點心 · 自由交流</p>
        </div>
      </div>
    </div>

    <!-- Day 2 schedule -->
    <div id="day2" class="hidden space-y-3 max-w-3xl mx-auto">
      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up visible">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-primary">09:30</div>
          <div class="text-[10px] text-dim">40 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] rounded mb-2">Talk</div>
          <h3 class="font-semibold text-sm mb-1">大規模前端架構治理：Monorepo 實戰</h3>
          <p class="text-xs text-muted">陳雅琳 · Tech Lead @ LINE</p>
        </div>
      </div>

      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up visible">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-primary">10:15</div>
          <div class="text-[10px] text-dim">40 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-accent/10 text-accent text-[10px] rounded mb-2">Talk</div>
          <h3 class="font-semibold text-sm mb-1">現代測試框架的未來：Vitest 2.0 深度</h3>
          <p class="text-xs text-muted">Mike Park · OSS Maintainer, Vitest</p>
        </div>
      </div>

      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up visible">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-primary">11:15</div>
          <div class="text-[10px] text-dim">40 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded mb-2">Talk</div>
          <h3 class="font-semibold text-sm mb-1">一人團隊的全端之路：從 Side Project 到月入百萬</h3>
          <p class="text-xs text-muted">張書涵 · 獨立開發者</p>
        </div>
      </div>

      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up visible">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-dim">12:00</div>
          <div class="text-[10px] text-dim">60 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-dim/20 text-dim text-[10px] rounded mb-2">Lunch</div>
          <h3 class="font-medium text-sm text-dim">🍱 午餐</h3>
        </div>
      </div>

      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up visible">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-primary">13:00</div>
          <div class="text-[10px] text-dim">180 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-hot/10 text-hot text-[10px] rounded mb-2">Workshop</div>
          <h3 class="font-semibold text-sm mb-1">Hands-on Workshop（四選一）</h3>
          <div class="mt-2 space-y-1 text-xs text-muted">
            <div>A. React Server Components 實作</div>
            <div>B. AI Agent 開發實戰</div>
            <div>C. Design System 從零建構</div>
            <div>D. 效能優化 Masterclass</div>
          </div>
        </div>
      </div>

      <div class="track-item border border-border rounded-lg p-4 flex items-start gap-4 fade-up visible">
        <div class="w-20 flex-shrink-0 text-right">
          <div class="text-sm font-semibold text-primary">16:30</div>
          <div class="text-[10px] text-dim">30 min</div>
        </div>
        <div class="flex-1">
          <div class="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded mb-2">Closing</div>
          <h3 class="font-semibold text-sm">閉幕 + 抽獎</h3>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Pricing -->
<section id="pricing" class="py-20 px-6">
  <div class="max-w-5xl mx-auto">
    <div class="text-center mb-12 fade-up">
      <span class="text-xs text-primary uppercase tracking-widest font-medium">TICKETS</span>
      <h2 class="text-3xl font-bold mt-2 mb-3">票價方案</h2>
      <p class="text-sm text-muted">早鳥票限量 100 張，售完為止</p>
    </div>

    <div class="grid md:grid-cols-3 gap-5">
      <!-- Early Bird -->
      <div class="price-card border border-border rounded-xl p-6 relative fade-up">
        <div class="absolute -top-3 left-6 px-3 py-0.5 bg-accent text-dark text-[10px] font-bold rounded-full uppercase">Early Bird</div>
        <div class="text-sm text-muted mb-4 mt-2">早鳥票</div>
        <div class="flex items-baseline gap-1 mb-1">
          <span class="text-3xl font-bold text-text">$1,990</span>
          <span class="text-sm text-dim">TWD</span>
        </div>
        <div class="text-xs text-dim line-through mb-6">$2,990</div>
        <ul class="space-y-2 mb-8 text-sm text-muted">
          <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>兩日議程通行</li>
          <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>午餐 × 2</li>
          <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>After Party</li>
          <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>SYNTAX T-Shirt</li>
          <li class="flex items-center gap-2 text-dim"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#55556a" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>Workshop（需加購）</li>
        </ul>
        <button onclick="handleAction('購買早鳥票')" class="w-full py-2.5 border border-accent text-accent rounded-lg text-sm font-medium hover:bg-accent/10 transition-all">
          搶購早鳥 →
        </button>
        <div class="text-center mt-3 text-[10px] text-dim">剩餘 23 / 100 張</div>
      </div>

      <!-- Regular (Featured) -->
      <div class="price-card featured border border-primary/30 rounded-xl p-6 relative bg-card fade-up">
        <div class="absolute -top-3 left-6 px-3 py-0.5 bg-gradient-to-r from-primary to-secondary text-white text-[10px] font-bold rounded-full">推薦</div>
        <div class="text-sm text-muted mb-4 mt-2">一般票</div>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-3xl font-bold grad-text">$2,990</span>
          <span class="text-sm text-dim">TWD</span>
        </div>
        <ul class="space-y-2 mb-8 text-sm text-muted">
          <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>兩日議程通行</li>
          <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>午餐 × 2</li>
          <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>After Party</li>
          <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>SYNTAX T-Shirt</li>
          <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>Workshop 一場</li>
        </ul>
        <button onclick="handleAction('購買一般票')" class="glow-btn w-full py-2.5 rounded-lg text-white text-sm font-medium">
          立即購票 →
        </button>
      </div>

      <!-- VIP -->
      <div class="price-card border border-border rounded-xl p-6 relative fade-up">
        <div class="absolute -top-3 left-6 px-3 py-0.5 bg-hot text-white text-[10px] font-bold rounded-full uppercase">VIP</div>
        <div class="text-sm text-muted mb-4 mt-2">VIP 票</div>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-3xl font-bold text-text">$5,990</span>
          <span class="text-sm text-dim">TWD</span>
        </div>
        <ul class="space-y-2 mb-8 text-sm text-muted">
          <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>所有一般票權益</li>
          <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>VIP 前排座位</li>
          <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>講者晚宴邀請</li>
          <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>Workshop 全選</li>
          <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>限量紀念禮包</li>
        </ul>
        <button onclick="handleAction('購買 VIP 票')" class="w-full py-2.5 border border-hot text-hot rounded-lg text-sm font-medium hover:bg-hot/10 transition-all">
          VIP 報名 →
        </button>
        <div class="text-center mt-3 text-[10px] text-dim">剩餘 8 / 30 張</div>
      </div>
    </div>
  </div>
</section>

<!-- Sponsors -->
<section id="sponsors" class="py-20 px-6 bg-surface">
  <div class="max-w-5xl mx-auto text-center">
    <div class="fade-up">
      <span class="text-xs text-primary uppercase tracking-widest font-medium">SPONSORS</span>
      <h2 class="text-3xl font-bold mt-2 mb-10">贊助夥伴</h2>
    </div>

    <!-- Platinum -->
    <div class="mb-10 fade-up">
      <div class="text-[10px] text-dim uppercase tracking-wider mb-4">白金贊助</div>
      <div class="flex items-center justify-center gap-10 flex-wrap">
        <div class="sponsor-logo w-28 h-12 bg-card rounded-lg flex items-center justify-center border border-border cursor-pointer" onclick="handleAction('Vercel')">
          <span class="text-lg font-bold text-text">▲ Vercel</span>
        </div>
        <div class="sponsor-logo w-28 h-12 bg-card rounded-lg flex items-center justify-center border border-border cursor-pointer" onclick="handleAction('Google')">
          <span class="text-lg font-bold text-text">G Google</span>
        </div>
      </div>
    </div>

    <!-- Gold -->
    <div class="mb-10 fade-up">
      <div class="text-[10px] text-dim uppercase tracking-wider mb-4">金級贊助</div>
      <div class="flex items-center justify-center gap-6 flex-wrap">
        <div class="sponsor-logo w-24 h-10 bg-card rounded-lg flex items-center justify-center border border-border cursor-pointer" onclick="handleAction('LINE')">
          <span class="text-sm font-bold text-text">LINE</span>
        </div>
        <div class="sponsor-logo w-24 h-10 bg-card rounded-lg flex items-center justify-center border border-border cursor-pointer" onclick="handleAction('Shopify')">
          <span class="text-sm font-bold text-text">Shopify</span>
        </div>
        <div class="sponsor-logo w-24 h-10 bg-card rounded-lg flex items-center justify-center border border-border cursor-pointer" onclick="handleAction('Figma')">
          <span class="text-sm font-bold text-text">Figma</span>
        </div>
      </div>
    </div>

    <!-- Community -->
    <div class="fade-up">
      <div class="text-[10px] text-dim uppercase tracking-wider mb-4">社群夥伴</div>
      <div class="flex items-center justify-center gap-4 flex-wrap">
        <div class="sponsor-logo px-4 h-8 bg-card rounded flex items-center justify-center border border-border cursor-pointer text-xs text-muted" onclick="handleAction('React Taipei')">React Taipei</div>
        <div class="sponsor-logo px-4 h-8 bg-card rounded flex items-center justify-center border border-border cursor-pointer text-xs text-muted" onclick="handleAction('Frontend Meetup')">Frontend Meetup</div>
        <div class="sponsor-logo px-4 h-8 bg-card rounded flex items-center justify-center border border-border cursor-pointer text-xs text-muted" onclick="handleAction('JSDC')">JSDC</div>
        <div class="sponsor-logo px-4 h-8 bg-card rounded flex items-center justify-center border border-border cursor-pointer text-xs text-muted" onclick="handleAction('MOPCON')">MOPCON</div>
      </div>
    </div>

    <div class="mt-10 fade-up">
      <button onclick="handleAction('成為贊助商')" class="text-xs text-primary border border-primary/30 hover:bg-primary/10 px-5 py-2 rounded-full transition-all">
        成為贊助夥伴 →
      </button>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="py-20 px-6 relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10"></div>
  <div class="relative z-10 max-w-2xl mx-auto text-center fade-up">
    <h2 class="text-3xl font-bold mb-4">準備好了嗎？</h2>
    <p class="text-sm text-muted mb-8">加入 500+ 前端開發者，一起探索技術的未來。<br>2026 年 5 月 17-18 日，台北國際會議中心。</p>
    <button onclick="handleAction('報名')" class="glow-btn px-10 py-3.5 rounded-full text-white font-semibold text-sm">
      立即報名 SYNTAX 2026 →
    </button>
    <div class="mt-4 text-xs text-dim">或訂閱電子報，搶先獲得最新消息</div>
    <div class="mt-3 flex items-center justify-center gap-2 max-w-xs mx-auto">
      <input type="email" placeholder="your@email.com" class="flex-1 px-4 py-2 bg-card border border-border rounded-lg text-sm text-text placeholder:text-dim focus:outline-none focus:border-primary/50">
      <button onclick="handleAction('訂閱電子報')" class="px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors">
        訂閱
      </button>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-border py-10 px-6">
  <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
    <div class="flex items-center gap-2">
      <span class="font-bold grad-text">SYNTAX</span>
      <span class="text-xs text-dim">TAIPEI 2026</span>
    </div>
    <div class="flex items-center gap-6">
      <a onclick="handleAction('行為準則')" class="cursor-pointer text-xs text-dim hover:text-text transition-colors">行為準則</a>
      <a onclick="handleAction('FAQ')" class="cursor-pointer text-xs text-dim hover:text-text transition-colors">FAQ</a>
      <a onclick="handleAction('聯繫我們')" class="cursor-pointer text-xs text-dim hover:text-text transition-colors">聯繫我們</a>
      <a onclick="handleAction('Twitter')" class="cursor-pointer text-xs text-dim hover:text-text transition-colors">Twitter</a>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-primary/30 text-text px-5 py-3 rounded-lg text-xs font-medium shadow-xl shadow-primary/10 opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-50 max-w-sm text-center"></div>

<script>
// Countdown timer
function updateCountdown() {
  const target = new Date('2026-05-17T09:00:00+08:00');
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) return;
  const d = Math.floor(diff / (1000*60*60*24));
  const h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  const m = Math.floor((diff % (1000*60*60)) / (1000*60));
  const s = Math.floor((diff % (1000*60)) / 1000);
  document.getElementById('cd-days').textContent = String(d).padStart(2, '0');
  document.getElementById('cd-hours').textContent = String(h).padStart(2, '0');
  document.getElementById('cd-mins').textContent = String(m).padStart(2, '0');
  document.getElementById('cd-secs').textContent = String(s).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

// Day tabs
function switchDay(day) {
  document.querySelectorAll('.day-tab').forEach(t => {
    const isActive = parseInt(t.dataset.day) === day;
    t.classList.toggle('active', isActive);
    if (isActive) {
      t.classList.remove('text-dim', 'border', 'border-border');
    } else {
      t.classList.add('text-dim', 'border', 'border-border');
      t.classList.remove('text-white');
    }
  });
  document.getElementById('day1').classList.toggle('hidden', day !== 1);
  document.getElementById('day2').classList.toggle('hidden', day !== 2);
}

// Mobile menu
function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('hidden');
}
function closeMobile() {
  document.getElementById('mobileMenu').classList.add('hidden');
}

// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1'; t.style.transform = 'translate(-50%, 0)';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translate(-50%, 8px)'; }, 2500);
}
function handleAction(a) { showToast(a + ' — 此為模板展示'); }

// IntersectionObserver
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
