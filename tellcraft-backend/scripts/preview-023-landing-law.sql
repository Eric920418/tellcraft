INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '0a2f85be-5fd2-4a09-8bee-0c80b8935e92',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>正衡國際法律事務所</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Noto+Serif+TC:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        dark: '#0c1220',
        surface: '#141e30',
        card: '#1a2640',
        border: '#2a3a55',
        text: '#e8ecf2',
        muted: '#8899b0',
        dim: '#5a6a80',
        gold: '#b8976a',
        'gold-light': '#d4b88c',
        'gold-soft': 'rgba(184,151,106,0.1)',
        cream: '#f5f2ed'
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Noto Serif TC', 'serif'],
        body: ['Inter', 'Noto Serif TC', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', 'Noto Serif TC', sans-serif; background: #0c1220; color: #e8ecf2; }

  /* Service card */
  .service-card { transition: all 0.3s ease; cursor: pointer; }
  .service-card:hover { background: #1a2640; border-color: rgba(184,151,106,0.3); transform: translateY(-2px); }
  .service-card:hover .s-icon { color: #b8976a; }

  /* Team card */
  .team-card { transition: all 0.3s ease; cursor: pointer; }
  .team-card:hover { transform: translateY(-4px); }
  .team-card:hover .team-overlay { opacity: 1; }
  .team-overlay { opacity: 0; transition: opacity 0.3s ease; }

  /* FAQ */
  .faq-item { transition: all 0.2s ease; }
  .faq-item:hover { background: #1a2640; }

  .fade-up { opacity: 0; transform: translateY(20px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .fade-up.visible { opacity: 1; transform: translateY(0); }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #0c1220; }
  ::-webkit-scrollbar-thumb { background: #2a3a55; border-radius: 3px; }
</style>
</head>
<body>

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-dark/90 backdrop-blur-md border-b border-border/50">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-3">
      <div class="flex items-center gap-0.5">
        <div class="w-1 h-8 bg-gold"></div>
        <div class="w-1 h-8 bg-gold/60 ml-0.5"></div>
      </div>
      <div>
        <div class="font-display text-sm font-semibold tracking-wider text-text">正衡國際</div>
        <div class="text-[8px] text-gold tracking-[0.2em] uppercase -mt-0.5">Justus & Partners</div>
      </div>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#services" class="text-xs text-muted hover:text-text transition-colors">業務領域</a>
      <a href="#team" class="text-xs text-muted hover:text-text transition-colors">律師團隊</a>
      <a href="#cases" class="text-xs text-muted hover:text-text transition-colors">成功案例</a>
      <a href="#contact" class="text-xs text-muted hover:text-text transition-colors">聯繫我們</a>
      <button onclick="handleAction('預約諮詢')" class="px-5 py-2 border border-gold text-gold text-xs hover:bg-gold hover:text-dark transition-all">
        預約諮詢
      </button>
    </div>
    <button onclick="toggleMenu()" class="md:hidden text-muted">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8h16M4 16h16"/></svg>
    </button>
  </div>
  <div id="mobileMenu" class="hidden md:hidden bg-dark border-t border-border">
    <div class="px-6 py-4 space-y-3">
      <a href="#services" onclick="toggleMenu()" class="block text-sm text-muted">業務領域</a>
      <a href="#team" onclick="toggleMenu()" class="block text-sm text-muted">律師團隊</a>
      <a href="#cases" onclick="toggleMenu()" class="block text-sm text-muted">成功案例</a>
      <a href="#contact" onclick="toggleMenu()" class="block text-sm text-muted">聯繫我們</a>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="pt-16 min-h-[85vh] flex items-center relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-b from-dark via-surface/50 to-dark"></div>
  <div class="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gold/5 to-transparent"></div>
  <div class="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full">
    <div class="max-w-2xl">
      <div class="flex items-center gap-3 mb-8 fade-up">
        <div class="w-12 h-px bg-gold"></div>
        <span class="text-xs text-gold tracking-[0.2em] uppercase">Since 2005</span>
      </div>
      <h1 class="font-display text-4xl md:text-6xl font-semibold leading-tight mb-6 fade-up">
        以法律守護<br>您的權益與<span class="text-gold italic">未來</span>
      </h1>
      <p class="text-sm text-muted max-w-lg leading-relaxed mb-10 fade-up">
        正衡國際法律事務所，匯集 12 位資深律師，專精企業法務、智慧財產、跨境訴訟與家事法律。
        近 20 年來，我們以嚴謹的態度和專業的能力，為客戶提供最可靠的法律服務。
      </p>
      <div class="flex items-center gap-4 fade-up">
        <button onclick="handleAction('預約免費諮詢')" class="px-6 py-3 bg-gold text-dark text-sm font-medium hover:bg-gold-light transition-colors">
          預約免費諮詢
        </button>
        <a href="#services" class="text-sm text-muted hover:text-text transition-colors border-b border-muted pb-0.5">
          了解服務 →
        </a>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border fade-up">
        <div>
          <div class="text-3xl font-display font-bold text-gold">2,400+</div>
          <div class="text-xs text-dim mt-1">處理案件</div>
        </div>
        <div>
          <div class="text-3xl font-display font-bold text-gold">94%</div>
          <div class="text-xs text-dim mt-1">勝訴率</div>
        </div>
        <div>
          <div class="text-3xl font-display font-bold text-gold">19</div>
          <div class="text-xs text-dim mt-1">年執業經驗</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-20 px-6">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12 fade-up">
      <div class="flex items-center justify-center gap-3 mb-3">
        <div class="w-8 h-px bg-gold"></div>
        <span class="text-xs text-gold tracking-[0.2em] uppercase">Practice Areas</span>
        <div class="w-8 h-px bg-gold"></div>
      </div>
      <h2 class="font-display text-3xl font-semibold">業務領域</h2>
    </div>

    <div class="grid md:grid-cols-3 gap-4">
      <div class="service-card border border-border rounded-lg p-6 fade-up" onclick="handleAction('企業法務')">
        <div class="s-icon text-dim mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>
        </div>
        <h3 class="font-display text-lg font-semibold mb-2">企業法務</h3>
        <p class="text-xs text-muted leading-relaxed">公司設立、股東協議、合併收購、合規審查、上市輔導。為企業的每一個成長階段提供法律護航。</p>
      </div>

      <div class="service-card border border-border rounded-lg p-6 fade-up" onclick="handleAction('智慧財產')">
        <div class="s-icon text-dim mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <h3 class="font-display text-lg font-semibold mb-2">智慧財產</h3>
        <p class="text-xs text-muted leading-relaxed">專利申請、商標保護、著作權、營業秘密、技術授權。守護您的創新成果與品牌價值。</p>
      </div>

      <div class="service-card border border-border rounded-lg p-6 fade-up" onclick="handleAction('跨境訴訟')">
        <div class="s-icon text-dim mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
        </div>
        <h3 class="font-display text-lg font-semibold mb-2">跨境訴訟</h3>
        <p class="text-xs text-muted leading-relaxed">國際商事仲裁、跨境爭端解決、外國判決承認與執行。與全球 15 國律師事務所合作。</p>
      </div>

      <div class="service-card border border-border rounded-lg p-6 fade-up" onclick="handleAction('家事法律')">
        <div class="s-icon text-dim mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        </div>
        <h3 class="font-display text-lg font-semibold mb-2">家事法律</h3>
        <p class="text-xs text-muted leading-relaxed">離婚協議、監護權、遺產繼承、財產分配。以同理心與專業，陪伴您度過人生轉折。</p>
      </div>

      <div class="service-card border border-border rounded-lg p-6 fade-up" onclick="handleAction('刑事辯護')">
        <div class="s-icon text-dim mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h3 class="font-display text-lg font-semibold mb-2">刑事辯護</h3>
        <p class="text-xs text-muted leading-relaxed">經濟犯罪、白領犯罪、毒品案件、交通事故。全力捍衛當事人的合法權益。</p>
      </div>

      <div class="service-card border border-border rounded-lg p-6 fade-up" onclick="handleAction('不動產法律')">
        <div class="s-icon text-dim mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
        </div>
        <h3 class="font-display text-lg font-semibold mb-2">不動產法律</h3>
        <p class="text-xs text-muted leading-relaxed">買賣糾紛、土地開發、都更法律、租賃爭議。精通不動產法令的專業團隊。</p>
      </div>
    </div>
  </div>
</section>

<!-- Team -->
<section id="team" class="py-20 px-6 bg-surface">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12 fade-up">
      <div class="flex items-center justify-center gap-3 mb-3">
        <div class="w-8 h-px bg-gold"></div>
        <span class="text-xs text-gold tracking-[0.2em] uppercase">Our Team</span>
        <div class="w-8 h-px bg-gold"></div>
      </div>
      <h2 class="font-display text-3xl font-semibold">律師團隊</h2>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
      <div class="team-card fade-up" onclick="handleAction('周正衡律師')">
        <div class="aspect-[3/4] bg-gradient-to-b from-card to-dark rounded-lg relative overflow-hidden mb-3">
          <div class="absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-15">👨‍⚖️</span></div>
          <div class="team-overlay absolute inset-0 bg-gold/90 flex items-center justify-center rounded-lg">
            <div class="text-center text-dark">
              <div class="text-xs font-medium mb-1">台大法律 / 哈佛法學碩士</div>
              <div class="text-xs">前台北地院法官</div>
            </div>
          </div>
        </div>
        <h3 class="font-display text-base font-semibold">周正衡</h3>
        <p class="text-xs text-gold">所長 / 主持律師</p>
        <p class="text-[10px] text-dim mt-0.5">企業法務・跨境訴訟</p>
      </div>

      <div class="team-card fade-up" onclick="handleAction('陳曉薇律師')">
        <div class="aspect-[3/4] bg-gradient-to-b from-card to-dark rounded-lg relative overflow-hidden mb-3">
          <div class="absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-15">👩‍⚖️</span></div>
          <div class="team-overlay absolute inset-0 bg-gold/90 flex items-center justify-center rounded-lg">
            <div class="text-center text-dark">
              <div class="text-xs font-medium mb-1">政大法律 / 倫敦大學碩士</div>
              <div class="text-xs">智財專利訴訟 300+ 件</div>
            </div>
          </div>
        </div>
        <h3 class="font-display text-base font-semibold">陳曉薇</h3>
        <p class="text-xs text-gold">資深合夥人</p>
        <p class="text-[10px] text-dim mt-0.5">智慧財產・技術授權</p>
      </div>

      <div class="team-card fade-up" onclick="handleAction('林哲瀚律師')">
        <div class="aspect-[3/4] bg-gradient-to-b from-card to-dark rounded-lg relative overflow-hidden mb-3">
          <div class="absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-15">👨‍💼</span></div>
          <div class="team-overlay absolute inset-0 bg-gold/90 flex items-center justify-center rounded-lg">
            <div class="text-center text-dark">
              <div class="text-xs font-medium mb-1">成大法律 / 司法官特考</div>
              <div class="text-xs">前檢察官 12 年資歷</div>
            </div>
          </div>
        </div>
        <h3 class="font-display text-base font-semibold">林哲瀚</h3>
        <p class="text-xs text-gold">合夥人</p>
        <p class="text-[10px] text-dim mt-0.5">刑事辯護・白領犯罪</p>
      </div>

      <div class="team-card fade-up" onclick="handleAction('許雅筑律師')">
        <div class="aspect-[3/4] bg-gradient-to-b from-card to-dark rounded-lg relative overflow-hidden mb-3">
          <div class="absolute inset-0 flex items-center justify-center"><span class="text-5xl opacity-15">👩‍💼</span></div>
          <div class="team-overlay absolute inset-0 bg-gold/90 flex items-center justify-center rounded-lg">
            <div class="text-center text-dark">
              <div class="text-xs font-medium mb-1">北大法律 / 家事調解委員</div>
              <div class="text-xs">家事案件處理 500+ 件</div>
            </div>
          </div>
        </div>
        <h3 class="font-display text-base font-semibold">許雅筑</h3>
        <p class="text-xs text-gold">合夥人</p>
        <p class="text-[10px] text-dim mt-0.5">家事法律・遺產繼承</p>
      </div>
    </div>
  </div>
</section>

<!-- Cases -->
<section id="cases" class="py-20 px-6">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12 fade-up">
      <div class="flex items-center justify-center gap-3 mb-3">
        <div class="w-8 h-px bg-gold"></div>
        <span class="text-xs text-gold tracking-[0.2em] uppercase">Case Studies</span>
        <div class="w-8 h-px bg-gold"></div>
      </div>
      <h2 class="font-display text-3xl font-semibold">成功案例</h2>
    </div>

    <div class="space-y-4">
      <div class="border border-border rounded-lg p-6 hover:border-gold/30 transition-all cursor-pointer fade-up" onclick="handleAction('案例：跨國專利侵權')">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 bg-gold-soft text-gold text-[10px] rounded">智慧財產</span>
              <span class="px-2 py-0.5 bg-gold-soft text-gold text-[10px] rounded">跨境訴訟</span>
            </div>
            <h3 class="font-display text-lg font-semibold mb-2">跨國科技公司專利侵權訴訟</h3>
            <p class="text-xs text-muted leading-relaxed">代理台灣半導體公司對抗國際大廠的專利侵權指控，涉及金額達 NT$ 15 億。經過兩年半的訴訟，成功為客戶取得有利和解，獲得反授權。</p>
          </div>
          <div class="text-right flex-shrink-0 hidden md:block">
            <div class="text-2xl font-display font-bold text-gold">勝訴</div>
            <div class="text-[10px] text-dim">2024</div>
          </div>
        </div>
      </div>

      <div class="border border-border rounded-lg p-6 hover:border-gold/30 transition-all cursor-pointer fade-up" onclick="handleAction('案例：上市公司合併')">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 bg-gold-soft text-gold text-[10px] rounded">企業法務</span>
            </div>
            <h3 class="font-display text-lg font-semibold mb-2">上市公司跨境合併案</h3>
            <p class="text-xs text-muted leading-relaxed">協助台灣上市電子公司完成對東南亞子公司的合併重組，涉及四國法律體系。在 8 個月內完成所有法律程序，無任何合規問題。</p>
          </div>
          <div class="text-right flex-shrink-0 hidden md:block">
            <div class="text-2xl font-display font-bold text-gold">完成</div>
            <div class="text-[10px] text-dim">2025</div>
          </div>
        </div>
      </div>

      <div class="border border-border rounded-lg p-6 hover:border-gold/30 transition-all cursor-pointer fade-up" onclick="handleAction('案例：遺產繼承糾紛')">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 bg-gold-soft text-gold text-[10px] rounded">家事法律</span>
            </div>
            <h3 class="font-display text-lg font-semibold mb-2">高額遺產繼承糾紛</h3>
            <p class="text-xs text-muted leading-relaxed">代理委託人處理涉及 NT$ 8 億遺產的繼承爭議。透過調解與訴訟並行策略，在保護委託人權益的同時，維護了家族關係。</p>
          </div>
          <div class="text-right flex-shrink-0 hidden md:block">
            <div class="text-2xl font-display font-bold text-gold">和解</div>
            <div class="text-[10px] text-dim">2025</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="py-20 px-6 bg-surface">
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-12 fade-up">
      <h2 class="font-display text-3xl font-semibold">客戶推薦</h2>
    </div>
    <div class="space-y-6">
      <div class="border-l-2 border-gold pl-6 fade-up">
        <p class="font-display text-lg italic leading-relaxed mb-4 text-text/90">
          "周律師和他的團隊在我們面臨專利訴訟時展現了非凡的專業能力。他們不僅精通法律，更重要的是真正理解科技產業。這場勝利對公司的意義，遠超金錢所能衡量。"
        </p>
        <div class="text-xs text-muted">張總經理 · 某半導體公司</div>
      </div>
      <div class="border-l-2 border-gold/50 pl-6 fade-up">
        <p class="font-display text-lg italic leading-relaxed mb-4 text-text/90">
          "在人生最困難的時期，許律師不只提供了專業的法律建議，更給予了情感上的支持。她讓我相信法律可以是溫暖的。"
        </p>
        <div class="text-xs text-muted">王女士 · 家事案件委託人</div>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-20 px-6">
  <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
    <div class="fade-up">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-8 h-px bg-gold"></div>
        <span class="text-xs text-gold tracking-[0.2em] uppercase">Contact</span>
      </div>
      <h2 class="font-display text-3xl font-semibold mb-6">預約諮詢</h2>
      <p class="text-sm text-muted leading-relaxed mb-8">
        首次法律諮詢免費。請留下您的基本資訊與問題概述，我們將指派最適合的律師為您服務。
      </p>
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gold-soft rounded flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b8976a" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          </div>
          <div>
            <div class="text-[10px] text-dim">電話</div>
            <div class="text-sm">02-2700-6800</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gold-soft rounded flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b8976a" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
          </div>
          <div>
            <div class="text-[10px] text-dim">Email</div>
            <div class="text-sm">contact@justus-law.tw</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gold-soft rounded flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b8976a" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div>
            <div class="text-[10px] text-dim">營業時間</div>
            <div class="text-sm">週一至週五 09:00-18:00</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gold-soft rounded flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#b8976a"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <div>
            <div class="text-[10px] text-dim">地址</div>
            <div class="text-sm">台北市中正區重慶南路一段 120 號 18 樓</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div class="bg-card border border-border rounded-lg p-6 fade-up">
      <h3 class="font-display text-lg font-semibold mb-4">線上預約</h3>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-[10px] text-dim mb-1 block">姓名 *</label>
            <input type="text" placeholder="您的姓名" class="w-full px-3 py-2.5 bg-dark border border-border rounded text-sm text-text focus:outline-none focus:border-gold/50">
          </div>
          <div>
            <label class="text-[10px] text-dim mb-1 block">電話 *</label>
            <input type="tel" placeholder="聯繫電話" class="w-full px-3 py-2.5 bg-dark border border-border rounded text-sm text-text focus:outline-none focus:border-gold/50">
          </div>
        </div>
        <div>
          <label class="text-[10px] text-dim mb-1 block">Email</label>
          <input type="email" placeholder="your@email.com" class="w-full px-3 py-2.5 bg-dark border border-border rounded text-sm text-text focus:outline-none focus:border-gold/50">
        </div>
        <div>
          <label class="text-[10px] text-dim mb-1 block">諮詢領域</label>
          <select class="w-full px-3 py-2.5 bg-dark border border-border rounded text-sm text-muted focus:outline-none focus:border-gold/50">
            <option>請選擇</option>
            <option>企業法務</option>
            <option>智慧財產</option>
            <option>跨境訴訟</option>
            <option>家事法律</option>
            <option>刑事辯護</option>
            <option>不動產法律</option>
            <option>其他</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] text-dim mb-1 block">問題概述</label>
          <textarea rows="4" placeholder="請簡述您的法律問題..." class="w-full px-3 py-2.5 bg-dark border border-border rounded text-sm text-text resize-none focus:outline-none focus:border-gold/50"></textarea>
        </div>
        <button onclick="handleAction('送出預約')" class="w-full py-3 bg-gold text-dark text-sm font-semibold hover:bg-gold-light transition-colors">
          送出預約
        </button>
        <p class="text-[10px] text-dim text-center">您的資訊受律師保密義務保護。</p>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-border py-10 px-6">
  <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-0.5">
        <div class="w-0.5 h-5 bg-gold"></div>
        <div class="w-0.5 h-5 bg-gold/60 ml-0.5"></div>
      </div>
      <div>
        <span class="text-xs font-medium">正衡國際法律事務所</span>
        <span class="text-[9px] text-dim block">© 2005-2026 Justus & Partners. All rights reserved.</span>
      </div>
    </div>
    <div class="text-[10px] text-dim">律師公會會員字第 0012345 號</div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-gold/20 text-text px-5 py-3 rounded text-xs shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-50 max-w-sm text-center"></div>

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
