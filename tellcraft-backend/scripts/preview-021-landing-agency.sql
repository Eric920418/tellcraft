INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'b12e9af6-9b38-4812-8016-b37e84accf40',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PARALLAX — 視差創意工作室</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        paper: '#ffffff',
        mid: '#888888',
        light: '#cccccc',
        edge: '#e5e5e5',
        pop: '#ff3300'
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Noto Sans TC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Space Grotesk', 'Noto Sans TC', sans-serif; background: #fff; color: #000; }

  /* Hero oversized text */
  .hero-title {
    font-size: clamp(3rem, 12vw, 10rem);
    line-height: 0.9;
    font-weight: 700;
    letter-spacing: -0.04em;
  }

  /* Project card */
  .project-card { cursor: pointer; overflow: hidden; }
  .project-card .overlay {
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .project-card:hover .overlay { opacity: 1; }
  .project-card img, .project-card .placeholder {
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .project-card:hover img, .project-card:hover .placeholder { transform: scale(1.05); }

  /* Service row */
  .service-row {
    transition: all 0.3s ease;
    cursor: pointer;
  }
  .service-row:hover {
    padding-left: 2rem;
    background: #000;
    color: #fff;
  }
  .service-row:hover .service-num { color: #ff3300; }
  .service-row:hover .arrow { transform: translateX(8px); opacity: 1; }
  .arrow { opacity: 0; transition: all 0.3s ease; }

  /* Team member */
  .team-card { transition: all 0.3s ease; }
  .team-card:hover { transform: translateY(-4px); }

  /* Marquee */
  .marquee-track {
    display: flex;
    animation: marquee 30s linear infinite;
  }
  @keyframes marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  /* Stats counter */
  .stat-num { font-variant-numeric: tabular-nums; }

  /* Fade */
  .fade-up {
    opacity: 0; transform: translateY(24px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .fade-up.visible { opacity: 1; transform: translateY(0); }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #fff; }
  ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
</style>
</head>
<body>

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-paper/90 backdrop-blur-md mix-blend-difference" style="mix-blend-mode: normal;">
  <div class="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between border-b border-edge">
    <a href="#" class="font-bold text-sm tracking-[0.2em] uppercase">Parallax</a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#work" class="text-xs text-mid hover:text-ink transition-colors tracking-wider uppercase">作品</a>
      <a href="#services" class="text-xs text-mid hover:text-ink transition-colors tracking-wider uppercase">服務</a>
      <a href="#team" class="text-xs text-mid hover:text-ink transition-colors tracking-wider uppercase">團隊</a>
      <a href="#contact" class="text-xs text-mid hover:text-ink transition-colors tracking-wider uppercase">聯繫</a>
    </div>
    <button onclick="handleAction('開始專案')" class="px-4 py-1.5 bg-ink text-paper text-xs tracking-wider rounded-full hover:bg-pop transition-colors">
      開始專案
    </button>
  </div>
</nav>

<!-- Hero -->
<section class="min-h-screen flex flex-col justify-center px-6 pt-14 relative overflow-hidden">
  <div class="max-w-7xl mx-auto w-full">
    <!-- Mono label -->
    <div class="font-mono text-xs text-mid mb-6 fade-up">
      <span class="text-pop">●</span> CREATIVE STUDIO / EST. 2019
    </div>

    <!-- Big title -->
    <h1 class="hero-title mb-8 fade-up">
      <span class="block">WE</span>
      <span class="block">DESIGN</span>
      <span class="block text-pop italic" style="font-style: italic;">FUTURES</span>
    </h1>

    <!-- Subtext -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 fade-up">
      <p class="text-sm text-mid max-w-md leading-relaxed">
        PARALLAX 是一間位於台北的設計工作室。我們為有野心的品牌打造視覺系統、數位體驗和策略。
      </p>
      <div class="flex items-center gap-4">
        <a href="#work" class="text-xs tracking-wider uppercase border-b border-ink pb-0.5 hover:text-pop hover:border-pop transition-colors">
          瀏覽作品 ↓
        </a>
      </div>
    </div>
  </div>

  <!-- Scroll line -->
  <div class="absolute bottom-8 left-6 flex items-center gap-3">
    <div class="w-px h-12 bg-edge relative overflow-hidden">
      <div class="w-full h-4 bg-ink animate-bounce"></div>
    </div>
    <span class="font-mono text-[10px] text-mid uppercase tracking-widest -rotate-90 origin-left translate-x-2">Scroll</span>
  </div>
</section>

<!-- Marquee -->
<div class="py-4 border-y border-edge overflow-hidden">
  <div class="marquee-track whitespace-nowrap">
    <span class="text-5xl font-bold tracking-tight mx-8">BRANDING</span>
    <span class="text-5xl font-bold tracking-tight text-pop mx-8">·</span>
    <span class="text-5xl font-bold tracking-tight mx-8">DIGITAL</span>
    <span class="text-5xl font-bold tracking-tight text-pop mx-8">·</span>
    <span class="text-5xl font-bold tracking-tight mx-8">MOTION</span>
    <span class="text-5xl font-bold tracking-tight text-pop mx-8">·</span>
    <span class="text-5xl font-bold tracking-tight mx-8">STRATEGY</span>
    <span class="text-5xl font-bold tracking-tight text-pop mx-8">·</span>
    <span class="text-5xl font-bold tracking-tight mx-8">BRANDING</span>
    <span class="text-5xl font-bold tracking-tight text-pop mx-8">·</span>
    <span class="text-5xl font-bold tracking-tight mx-8">DIGITAL</span>
    <span class="text-5xl font-bold tracking-tight text-pop mx-8">·</span>
    <span class="text-5xl font-bold tracking-tight mx-8">MOTION</span>
    <span class="text-5xl font-bold tracking-tight text-pop mx-8">·</span>
    <span class="text-5xl font-bold tracking-tight mx-8">STRATEGY</span>
    <span class="text-5xl font-bold tracking-tight text-pop mx-8">·</span>
  </div>
</div>

<!-- Work -->
<section id="work" class="py-20 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="flex items-end justify-between mb-12 fade-up">
      <div>
        <span class="font-mono text-xs text-mid">[01]</span>
        <h2 class="text-4xl font-bold mt-1">精選作品</h2>
      </div>
      <a onclick="handleAction('查看全部作品')" class="cursor-pointer text-xs text-mid hover:text-ink tracking-wider uppercase transition-colors hidden md:block">
        查看全部 →
      </a>
    </div>

    <div class="grid md:grid-cols-2 gap-4">
      <!-- Project 1 -->
      <div class="project-card rounded-lg relative group fade-up" onclick="handleAction('查看 LUMIÈRE 專案')">
        <div class="aspect-[4/3] bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg relative overflow-hidden">
          <div class="placeholder absolute inset-0 flex items-center justify-center">
            <span class="text-7xl opacity-10">💎</span>
          </div>
          <div class="overlay absolute inset-0 bg-ink/80 flex items-center justify-center">
            <div class="text-center text-paper">
              <div class="font-mono text-xs mb-2 text-pop">品牌識別 + 網站</div>
              <div class="text-2xl font-bold">查看專案 →</div>
            </div>
          </div>
        </div>
        <div class="mt-4 flex items-start justify-between">
          <div>
            <h3 class="font-bold text-lg">LUMIÈRE</h3>
            <p class="text-xs text-mid">高端珠寶品牌全案重塑</p>
          </div>
          <span class="font-mono text-xs text-mid">2025</span>
        </div>
      </div>

      <!-- Project 2 -->
      <div class="project-card rounded-lg relative group fade-up" onclick="handleAction('查看 WAYPOINT 專案')">
        <div class="aspect-[4/3] bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg relative overflow-hidden">
          <div class="placeholder absolute inset-0 flex items-center justify-center">
            <span class="text-7xl opacity-20 grayscale">🗺️</span>
          </div>
          <div class="overlay absolute inset-0 bg-pop/90 flex items-center justify-center">
            <div class="text-center text-paper">
              <div class="font-mono text-xs mb-2">Web App + Design System</div>
              <div class="text-2xl font-bold">查看專案 →</div>
            </div>
          </div>
        </div>
        <div class="mt-4 flex items-start justify-between">
          <div>
            <h3 class="font-bold text-lg">WAYPOINT</h3>
            <p class="text-xs text-mid">旅遊科技平台 UI/UX 設計</p>
          </div>
          <span class="font-mono text-xs text-mid">2025</span>
        </div>
      </div>

      <!-- Project 3 -->
      <div class="project-card rounded-lg relative group fade-up" onclick="handleAction('查看 BREW 專案')">
        <div class="aspect-[4/3] bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg relative overflow-hidden">
          <div class="placeholder absolute inset-0 flex items-center justify-center">
            <span class="text-7xl opacity-10">☕</span>
          </div>
          <div class="overlay absolute inset-0 bg-ink/80 flex items-center justify-center">
            <div class="text-center text-paper">
              <div class="font-mono text-xs mb-2 text-pop">包裝 + 品牌空間</div>
              <div class="text-2xl font-bold">查看專案 →</div>
            </div>
          </div>
        </div>
        <div class="mt-4 flex items-start justify-between">
          <div>
            <h3 class="font-bold text-lg">BREW CULTURE</h3>
            <p class="text-xs text-mid">精品咖啡品牌識別設計</p>
          </div>
          <span class="font-mono text-xs text-mid">2024</span>
        </div>
      </div>

      <!-- Project 4 -->
      <div class="project-card rounded-lg relative group fade-up" onclick="handleAction('查看 NEXUS 專案')">
        <div class="aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg relative overflow-hidden">
          <div class="placeholder absolute inset-0 flex items-center justify-center">
            <span class="text-7xl opacity-10">🔮</span>
          </div>
          <div class="overlay absolute inset-0 bg-ink/80 flex items-center justify-center">
            <div class="text-center text-paper">
              <div class="font-mono text-xs mb-2 text-pop">SaaS Dashboard</div>
              <div class="text-2xl font-bold">查看專案 →</div>
            </div>
          </div>
        </div>
        <div class="mt-4 flex items-start justify-between">
          <div>
            <h3 class="font-bold text-lg">NEXUS AI</h3>
            <p class="text-xs text-mid">AI 數據分析平台產品設計</p>
          </div>
          <span class="font-mono text-xs text-mid">2024</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Stats -->
<section class="py-12 px-6 bg-ink text-paper">
  <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center fade-up">
    <div>
      <div class="stat-num text-4xl font-bold">86</div>
      <div class="font-mono text-xs text-mid mt-1">完成專案</div>
    </div>
    <div>
      <div class="stat-num text-4xl font-bold">12</div>
      <div class="font-mono text-xs text-mid mt-1">設計獎項</div>
    </div>
    <div>
      <div class="stat-num text-4xl font-bold">40+</div>
      <div class="font-mono text-xs text-mid mt-1">合作品牌</div>
    </div>
    <div>
      <div class="stat-num text-4xl font-bold">6</div>
      <div class="font-mono text-xs text-mid mt-1">年專業經驗</div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-20 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="mb-12 fade-up">
      <span class="font-mono text-xs text-mid">[02]</span>
      <h2 class="text-4xl font-bold mt-1">我們的服務</h2>
    </div>

    <div class="border-t border-edge">
      <div class="service-row flex items-center justify-between py-6 px-4 border-b border-edge fade-up" onclick="handleAction('品牌識別設計')">
        <div class="flex items-center gap-6">
          <span class="service-num font-mono text-xs text-mid">01</span>
          <div>
            <h3 class="text-xl font-bold">品牌識別設計</h3>
            <p class="text-xs text-mid mt-1">Logo · 色彩系統 · 字體規範 · 品牌手冊</p>
          </div>
        </div>
        <span class="arrow text-xl">→</span>
      </div>

      <div class="service-row flex items-center justify-between py-6 px-4 border-b border-edge fade-up" onclick="handleAction('數位產品設計')">
        <div class="flex items-center gap-6">
          <span class="service-num font-mono text-xs text-mid">02</span>
          <div>
            <h3 class="text-xl font-bold">數位產品設計</h3>
            <p class="text-xs text-mid mt-1">UI/UX · Design System · 原型 · 前端開發</p>
          </div>
        </div>
        <span class="arrow text-xl">→</span>
      </div>

      <div class="service-row flex items-center justify-between py-6 px-4 border-b border-edge fade-up" onclick="handleAction('動態與影像')">
        <div class="flex items-center gap-6">
          <span class="service-num font-mono text-xs text-mid">03</span>
          <div>
            <h3 class="text-xl font-bold">動態與影像</h3>
            <p class="text-xs text-mid mt-1">Motion Graphics · 品牌影片 · 互動動畫</p>
          </div>
        </div>
        <span class="arrow text-xl">→</span>
      </div>

      <div class="service-row flex items-center justify-between py-6 px-4 border-b border-edge fade-up" onclick="handleAction('品牌策略')">
        <div class="flex items-center gap-6">
          <span class="service-num font-mono text-xs text-mid">04</span>
          <div>
            <h3 class="text-xl font-bold">品牌策略</h3>
            <p class="text-xs text-mid mt-1">市場定位 · 品牌敘事 · 競品分析 · 命名</p>
          </div>
        </div>
        <span class="arrow text-xl">→</span>
      </div>
    </div>
  </div>
</section>

<!-- Team -->
<section id="team" class="py-20 px-6 bg-neutral-50">
  <div class="max-w-7xl mx-auto">
    <div class="mb-12 fade-up">
      <span class="font-mono text-xs text-mid">[03]</span>
      <h2 class="text-4xl font-bold mt-1">團隊</h2>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div class="team-card fade-up">
        <div class="aspect-[3/4] bg-gradient-to-b from-neutral-200 to-neutral-300 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
          <span class="text-5xl opacity-20">👨‍🎨</span>
        </div>
        <h3 class="font-bold text-sm">劉承翰</h3>
        <p class="text-xs text-mid">創辦人 / 創意總監</p>
      </div>

      <div class="team-card fade-up">
        <div class="aspect-[3/4] bg-gradient-to-b from-neutral-200 to-neutral-300 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
          <span class="text-5xl opacity-20">👩‍💻</span>
        </div>
        <h3 class="font-bold text-sm">陳芷晴</h3>
        <p class="text-xs text-mid">設計總監</p>
      </div>

      <div class="team-card fade-up">
        <div class="aspect-[3/4] bg-gradient-to-b from-neutral-200 to-neutral-300 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
          <span class="text-5xl opacity-20">🧑‍💻</span>
        </div>
        <h3 class="font-bold text-sm">張維森</h3>
        <p class="text-xs text-mid">技術總監</p>
      </div>

      <div class="team-card fade-up">
        <div class="aspect-[3/4] bg-gradient-to-b from-neutral-200 to-neutral-300 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
          <span class="text-5xl opacity-20">👩‍🎨</span>
        </div>
        <h3 class="font-bold text-sm">林欣蓓</h3>
        <p class="text-xs text-mid">動態設計師</p>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="py-20 px-6">
  <div class="max-w-4xl mx-auto">
    <div class="mb-12 fade-up">
      <span class="font-mono text-xs text-mid">[04]</span>
      <h2 class="text-4xl font-bold mt-1">客戶怎麼說</h2>
    </div>

    <div class="space-y-8">
      <div class="border-l-2 border-ink pl-6 fade-up">
        <p class="text-lg leading-relaxed mb-4">
          "PARALLAX 團隊對細節的執著讓我驚豔。他們不只是設計了一個 Logo，而是真正理解了我們品牌的靈魂，然後用視覺語言精準地表達出來。"
        </p>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm">L</div>
          <div>
            <div class="text-xs font-bold">Li Wei</div>
            <div class="text-xs text-mid">LUMIÈRE 創辦人</div>
          </div>
        </div>
      </div>

      <div class="border-l-2 border-pop pl-6 fade-up">
        <p class="text-lg leading-relaxed mb-4">
          "合作過十幾家設計公司，PARALLAX 是唯一一個能在創意和商業目標之間找到完美平衡的團隊。我們的轉換率在重新設計後提升了 240%。"
        </p>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm">W</div>
          <div>
            <div class="text-xs font-bold">陳韋宏</div>
            <div class="text-xs text-mid">WAYPOINT CEO</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA / Contact -->
<section id="contact" class="py-24 px-6 bg-ink text-paper">
  <div class="max-w-4xl mx-auto text-center fade-up">
    <span class="font-mono text-xs text-mid">[05]</span>
    <h2 class="text-4xl md:text-6xl font-bold mt-4 mb-6 leading-tight">
      有個瘋狂的<br><span class="text-pop italic">想法</span>嗎？
    </h2>
    <p class="text-sm text-mid max-w-md mx-auto mb-10">
      我們喜歡挑戰。不管是品牌重塑、產品設計還是一個「我不確定能不能做到」的念頭——先聊聊。
    </p>
    <div class="flex items-center justify-center gap-4">
      <button onclick="handleAction('預約諮詢')" class="px-8 py-3 bg-pop text-paper text-sm font-bold tracking-wider rounded-full hover:bg-paper hover:text-ink transition-all">
        預約免費諮詢
      </button>
      <a onclick="handleAction('Email')" class="cursor-pointer text-sm text-mid hover:text-paper transition-colors underline underline-offset-4">
        hello@parallax.studio
      </a>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="py-10 px-6 border-t border-edge">
  <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
    <div class="flex items-center gap-6">
      <span class="font-bold text-sm tracking-[0.15em] uppercase">Parallax</span>
      <span class="text-xs text-mid">© 2019-2026</span>
    </div>
    <div class="flex items-center gap-6">
      <a onclick="handleAction('Instagram')" class="cursor-pointer font-mono text-xs text-mid hover:text-ink transition-colors">IG</a>
      <a onclick="handleAction('Behance')" class="cursor-pointer font-mono text-xs text-mid hover:text-ink transition-colors">BE</a>
      <a onclick="handleAction('Dribbble')" class="cursor-pointer font-mono text-xs text-mid hover:text-ink transition-colors">DR</a>
      <a onclick="handleAction('LinkedIn')" class="cursor-pointer font-mono text-xs text-mid hover:text-ink transition-colors">LI</a>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-paper px-5 py-3 rounded-lg text-xs shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-50 max-w-sm text-center"></div>

<script>
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
