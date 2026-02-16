INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '2bd4de9e-b1e3-4179-99c4-48990a016488',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>綠芽基金會 GreenSprout</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        forest: '#1a6b3c',
        'forest-dark': '#145530',
        leaf: '#22c55e',
        'leaf-light': '#86efac',
        sun: '#f59e0b',
        'sun-light': '#fcd34d',
        earth: '#92400e',
        warm: '#fef3c7',
        cream: '#fefdf7',
        sand: '#f5f0e8',
        bark: '#44403c',
        stone: '#78716c'
      },
      fontFamily: {
        sans: ['Nunito', 'Noto Sans TC', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Nunito', 'Noto Sans TC', sans-serif; background: #fefdf7; color: #44403c; }

  .fade-up { opacity: 0; transform: translateY(20px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .fade-up.visible { opacity: 1; transform: translateY(0); }

  /* Impact counter animation */
  .impact-card { transition: all 0.3s ease; }
  .impact-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(26,107,60,0.1); }

  /* Story card */
  .story-card { transition: all 0.3s ease; cursor: pointer; }
  .story-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }

  /* Donation amount */
  .amount-btn { transition: all 0.2s ease; }
  .amount-btn:hover { border-color: #22c55e; color: #1a6b3c; }
  .amount-btn.active { background: #1a6b3c; color: white; border-color: #1a6b3c; }

  /* Progress bar */
  .progress-fill { transition: width 1.5s ease; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #fefdf7; }
  ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 3px; }
</style>
</head>
<body>

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-cream/90 backdrop-blur-md border-b border-sand">
  <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2">
      <div class="w-8 h-8 bg-forest rounded-full flex items-center justify-center">
        <span class="text-sm">🌱</span>
      </div>
      <div>
        <span class="text-sm font-bold text-forest">綠芽基金會</span>
      </div>
    </a>
    <div class="hidden md:flex items-center gap-6">
      <a href="#impact" class="text-xs text-stone hover:text-forest transition-colors font-medium">影響力</a>
      <a href="#stories" class="text-xs text-stone hover:text-forest transition-colors font-medium">故事</a>
      <a href="#programs" class="text-xs text-stone hover:text-forest transition-colors font-medium">計畫</a>
      <a href="#team" class="text-xs text-stone hover:text-forest transition-colors font-medium">團隊</a>
      <button onclick="scrollToDonate()" class="px-5 py-2 bg-forest text-white text-xs font-bold rounded-full hover:bg-forest-dark transition-colors">
        立即捐款 💚
      </button>
    </div>
    <button onclick="toggleMenu()" class="md:hidden text-stone">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h16M4 16h16"/></svg>
    </button>
  </div>
  <div id="mobileMenu" class="hidden md:hidden bg-cream border-t border-sand">
    <div class="px-6 py-4 space-y-3">
      <a href="#impact" onclick="toggleMenu()" class="block text-sm text-stone">影響力</a>
      <a href="#stories" onclick="toggleMenu()" class="block text-sm text-stone">故事</a>
      <a href="#programs" onclick="toggleMenu()" class="block text-sm text-stone">計畫</a>
      <button onclick="scrollToDonate();toggleMenu()" class="w-full py-2 bg-forest text-white text-sm font-bold rounded-full">立即捐款 💚</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="pt-14 relative overflow-hidden">
  <div class="bg-gradient-to-b from-forest to-forest-dark text-white">
    <div class="max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div class="max-w-2xl fade-up">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-6 text-xs">
          <span>🌍</span>
          <span class="text-leaf-light">已幫助超過 12,000 名孩童</span>
        </div>
        <h1 class="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
          每一顆種子<br>都值得發芽的<span class="text-sun-light">機會</span>
        </h1>
        <p class="text-sm text-white/70 leading-relaxed max-w-lg mb-8">
          綠芽基金會致力於偏鄉教育與環境保育。我們相信每個孩子都有權利獲得優質教育，每片土地都值得被守護。您的每一份支持，都是一顆改變世界的種子。
        </p>
        <div class="flex items-center gap-4">
          <button onclick="scrollToDonate()" class="px-6 py-3 bg-sun text-earth text-sm font-bold rounded-full hover:bg-sun-light transition-colors">
            捐款支持 →
          </button>
          <a href="#stories" class="text-sm text-white/70 hover:text-white transition-colors underline underline-offset-4">
            聽他們的故事
          </a>
        </div>
      </div>
    </div>
    <!-- Wave -->
    <svg viewBox="0 0 1200 80" class="w-full block" preserveAspectRatio="none" style="margin-bottom:-1px"><path d="M0 40C200 80 400 0 600 40C800 80 1000 0 1200 40V80H0Z" fill="#fefdf7"/></svg>
  </div>
</section>

<!-- Impact Stats -->
<section id="impact" class="py-16 px-6">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12 fade-up">
      <span class="text-xs text-forest font-bold uppercase tracking-widest">Our Impact</span>
      <h2 class="text-3xl font-extrabold text-bark mt-2">我們的影響力</h2>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="impact-card bg-white rounded-2xl p-6 text-center border border-sand fade-up">
        <div class="text-3xl mb-2">🎓</div>
        <div class="text-3xl font-extrabold text-forest">12,400</div>
        <div class="text-xs text-stone mt-1">受助孩童</div>
      </div>
      <div class="impact-card bg-white rounded-2xl p-6 text-center border border-sand fade-up">
        <div class="text-3xl mb-2">🏫</div>
        <div class="text-3xl font-extrabold text-forest">86</div>
        <div class="text-xs text-stone mt-1">合作學校</div>
      </div>
      <div class="impact-card bg-white rounded-2xl p-6 text-center border border-sand fade-up">
        <div class="text-3xl mb-2">🌳</div>
        <div class="text-3xl font-extrabold text-forest">45,000</div>
        <div class="text-xs text-stone mt-1">種植樹木</div>
      </div>
      <div class="impact-card bg-white rounded-2xl p-6 text-center border border-sand fade-up">
        <div class="text-3xl mb-2">🤝</div>
        <div class="text-3xl font-extrabold text-forest">3,200</div>
        <div class="text-xs text-stone mt-1">志工夥伴</div>
      </div>
    </div>

    <!-- Current campaign progress -->
    <div class="mt-10 bg-white rounded-2xl p-6 border border-sand fade-up">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h3 class="font-bold text-bark">🎯 2026 年度募款目標</h3>
          <p class="text-xs text-stone mt-1">「閱讀種子計畫」— 為 30 所偏鄉小學建立圖書角</p>
        </div>
        <div class="text-right">
          <div class="text-xl font-extrabold text-forest">NT$ 3,240,000</div>
          <div class="text-xs text-stone">目標 NT$ 5,000,000</div>
        </div>
      </div>
      <div class="w-full h-3 bg-sand rounded-full overflow-hidden">
        <div class="progress-fill h-full bg-gradient-to-r from-leaf to-forest rounded-full" style="width: 64.8%"></div>
      </div>
      <div class="flex items-center justify-between mt-2">
        <span class="text-xs text-stone">已達成 64.8%</span>
        <span class="text-xs text-sun font-bold">還差 NT$ 1,760,000</span>
      </div>
    </div>
  </div>
</section>

<!-- Stories -->
<section id="stories" class="py-16 px-6 bg-sand">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12 fade-up">
      <span class="text-xs text-forest font-bold uppercase tracking-widest">Stories</span>
      <h2 class="text-3xl font-extrabold text-bark mt-2">他們的故事</h2>
      <p class="text-sm text-stone mt-2 max-w-md mx-auto">每一份捐款背後，都有一個被改變的生命。</p>
    </div>

    <div class="grid md:grid-cols-3 gap-5">
      <div class="story-card bg-white rounded-2xl overflow-hidden fade-up" onclick="handleAction('閱讀小雨的故事')">
        <div class="aspect-video bg-gradient-to-br from-leaf/20 to-sun/10 flex items-center justify-center">
          <span class="text-5xl opacity-40">👧</span>
        </div>
        <div class="p-5">
          <div class="text-xs text-sun font-bold mb-2">閱讀種子計畫</div>
          <h3 class="font-bold text-bark mb-2">小雨的第一本書</h3>
          <p class="text-xs text-stone leading-relaxed">「以前放學回家只能看電視，現在我最喜歡的事情是坐在圖書角看故事書。」來自花蓮偏鄉的小雨，因為「閱讀種子」計畫第一次擁有了自己的借書證。</p>
          <a class="inline-block text-xs text-forest font-bold mt-3">閱讀全文 →</a>
        </div>
      </div>

      <div class="story-card bg-white rounded-2xl overflow-hidden fade-up" onclick="handleAction('閱讀阿光的故事')">
        <div class="aspect-video bg-gradient-to-br from-forest/10 to-leaf/10 flex items-center justify-center">
          <span class="text-5xl opacity-40">👦</span>
        </div>
        <div class="p-5">
          <div class="text-xs text-leaf font-bold mb-2">科學探索營</div>
          <h3 class="font-bold text-bark mb-2">阿光的星空夢</h3>
          <p class="text-xs text-stone leading-relaxed">在台東的科學營裡，阿光第一次用望遠鏡看到土星環。「原來課本上的東西是真的！」那天晚上，他決定以後要當天文學家。</p>
          <a class="inline-block text-xs text-forest font-bold mt-3">閱讀全文 →</a>
        </div>
      </div>

      <div class="story-card bg-white rounded-2xl overflow-hidden fade-up" onclick="handleAction('閱讀社區的故事')">
        <div class="aspect-video bg-gradient-to-br from-earth/10 to-sun/10 flex items-center justify-center">
          <span class="text-5xl opacity-40">🌳</span>
        </div>
        <div class="p-5">
          <div class="text-xs text-forest font-bold mb-2">社區綠化計畫</div>
          <h3 class="font-bold text-bark mb-2">從荒地到森林的旅程</h3>
          <p class="text-xs text-stone leading-relaxed">三年前這裡還是一片廢棄的空地。現在，45 棵台灣原生種樹木在這裡扎了根，成為社區居民的「後花園」。</p>
          <a class="inline-block text-xs text-forest font-bold mt-3">閱讀全文 →</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Programs -->
<section id="programs" class="py-16 px-6">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12 fade-up">
      <span class="text-xs text-forest font-bold uppercase tracking-widest">Programs</span>
      <h2 class="text-3xl font-extrabold text-bark mt-2">進行中的計畫</h2>
    </div>

    <div class="grid md:grid-cols-2 gap-5">
      <div class="bg-white rounded-2xl p-6 border border-sand fade-up hover:shadow-md transition-all">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-leaf/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="text-2xl">📚</span>
          </div>
          <div>
            <h3 class="font-bold text-bark mb-1">閱讀種子計畫</h3>
            <p class="text-xs text-stone leading-relaxed mb-3">為偏鄉小學建立圖書角、培訓閱讀志工、定期送書到校。目標：2026 年底前覆蓋 30 所學校。</p>
            <div class="flex items-center gap-3">
              <span class="px-2 py-0.5 bg-leaf/10 text-forest text-[10px] rounded-full font-bold">進行中</span>
              <span class="text-[10px] text-stone">已完成 18/30 所</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-sand fade-up hover:shadow-md transition-all">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-sun/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="text-2xl">🔬</span>
          </div>
          <div>
            <h3 class="font-bold text-bark mb-1">科學探索營</h3>
            <p class="text-xs text-stone leading-relaxed mb-3">寒暑假期間在偏鄉舉辦科學營，由大學生擔任講師。讓偏鄉孩子也能體驗動手做科學的樂趣。</p>
            <div class="flex items-center gap-3">
              <span class="px-2 py-0.5 bg-sun/10 text-earth text-[10px] rounded-full font-bold">招募中</span>
              <span class="text-[10px] text-stone">2026 暑假梯次報名中</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-sand fade-up hover:shadow-md transition-all">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="text-2xl">🌱</span>
          </div>
          <div>
            <h3 class="font-bold text-bark mb-1">社區綠化計畫</h3>
            <p class="text-xs text-stone leading-relaxed mb-3">與地方社區合作，在閒置空地種植台灣原生種樹木。2025 年已種下 12,000 棵，2026 年目標 20,000 棵。</p>
            <div class="flex items-center gap-3">
              <span class="px-2 py-0.5 bg-leaf/10 text-forest text-[10px] rounded-full font-bold">進行中</span>
              <span class="text-[10px] text-stone">已種植 45,000 棵</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-sand fade-up hover:shadow-md transition-all">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-warm rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="text-2xl">🎨</span>
          </div>
          <div>
            <h3 class="font-bold text-bark mb-1">藝術啟蒙計畫</h3>
            <p class="text-xs text-stone leading-relaxed mb-3">邀請藝術家進駐偏鄉學校，帶領孩子透過繪畫、音樂、戲劇探索自我。每年服務 15 所學校。</p>
            <div class="flex items-center gap-3">
              <span class="px-2 py-0.5 bg-warm text-earth text-[10px] rounded-full font-bold">規劃中</span>
              <span class="text-[10px] text-stone">2026 下半年啟動</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Team -->
<section id="team" class="py-16 px-6 bg-sand">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12 fade-up">
      <span class="text-xs text-forest font-bold uppercase tracking-widest">Team</span>
      <h2 class="text-3xl font-extrabold text-bark mt-2">核心團隊</h2>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
      <div class="text-center fade-up">
        <div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-leaf/20 to-forest/10 flex items-center justify-center mb-3">
          <span class="text-3xl">👩</span>
        </div>
        <h3 class="font-bold text-sm text-bark">林雅芳</h3>
        <p class="text-xs text-forest">執行長</p>
        <p class="text-[10px] text-stone mt-1">前教育部偏鄉計畫主持人</p>
      </div>
      <div class="text-center fade-up">
        <div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-sun/20 to-warm flex items-center justify-center mb-3">
          <span class="text-3xl">👨</span>
        </div>
        <h3 class="font-bold text-sm text-bark">陳志遠</h3>
        <p class="text-xs text-forest">計畫總監</p>
        <p class="text-[10px] text-stone mt-1">15 年 NGO 計畫管理經驗</p>
      </div>
      <div class="text-center fade-up">
        <div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-leaf/20 to-sun/10 flex items-center justify-center mb-3">
          <span class="text-3xl">👩</span>
        </div>
        <h3 class="font-bold text-sm text-bark">黃品萱</h3>
        <p class="text-xs text-forest">募款主任</p>
        <p class="text-[10px] text-stone mt-1">社會企業行銷專家</p>
      </div>
      <div class="text-center fade-up">
        <div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-forest/10 to-leaf/20 flex items-center justify-center mb-3">
          <span class="text-3xl">👨</span>
        </div>
        <h3 class="font-bold text-sm text-bark">張宏義</h3>
        <p class="text-xs text-forest">環境顧問</p>
        <p class="text-[10px] text-stone mt-1">台大森林系副教授</p>
      </div>
    </div>
  </div>
</section>

<!-- Donation -->
<section id="donate" class="py-16 px-6">
  <div class="max-w-3xl mx-auto">
    <div class="bg-white rounded-2xl p-8 border border-sand shadow-sm fade-up">
      <div class="text-center mb-8">
        <div class="text-4xl mb-3">💚</div>
        <h2 class="text-2xl font-extrabold text-bark">您的支持，是改變的開始</h2>
        <p class="text-sm text-stone mt-2">每一份捐款都 100% 投入計畫執行。我們承諾財務完全透明。</p>
      </div>

      <!-- Amount selection -->
      <div class="mb-6">
        <div class="text-xs text-stone mb-3 font-bold">選擇金額</div>
        <div class="grid grid-cols-4 gap-2 mb-3">
          <button onclick="selectAmount(this, 300)" class="amount-btn py-3 border border-sand rounded-xl text-sm font-bold text-bark">$300</button>
          <button onclick="selectAmount(this, 500)" class="amount-btn active py-3 border border-forest bg-forest text-white rounded-xl text-sm font-bold">$500</button>
          <button onclick="selectAmount(this, 1000)" class="amount-btn py-3 border border-sand rounded-xl text-sm font-bold text-bark">$1,000</button>
          <button onclick="selectAmount(this, 3000)" class="amount-btn py-3 border border-sand rounded-xl text-sm font-bold text-bark">$3,000</button>
        </div>
        <input type="number" placeholder="自訂金額" class="w-full px-4 py-3 bg-sand border border-sand rounded-xl text-sm focus:outline-none focus:border-forest focus:bg-white transition-all">
      </div>

      <!-- What your donation does -->
      <div class="bg-sand rounded-xl p-4 mb-6">
        <div class="text-xs text-stone mb-2 font-bold">您的 $500 可以：</div>
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-xs text-bark">
            <span class="text-leaf">✓</span> 為一位偏鄉學童購買 10 本課外讀物
          </div>
          <div class="flex items-center gap-2 text-xs text-bark">
            <span class="text-leaf">✓</span> 種植 5 棵台灣原生種樹苗
          </div>
          <div class="flex items-center gap-2 text-xs text-bark">
            <span class="text-leaf">✓</span> 支持科學營一位學員的材料費
          </div>
        </div>
      </div>

      <!-- Frequency -->
      <div class="flex items-center gap-2 mb-6">
        <button onclick="selectFreq(this, '單次')" class="flex-1 py-2.5 border border-forest bg-forest text-white rounded-xl text-xs font-bold freq-btn active">單次捐款</button>
        <button onclick="selectFreq(this, '每月')" class="flex-1 py-2.5 border border-sand text-bark rounded-xl text-xs font-bold freq-btn">每月定期</button>
      </div>

      <!-- Donor info -->
      <div class="space-y-3 mb-6">
        <div class="grid grid-cols-2 gap-3">
          <input type="text" placeholder="姓名" class="px-4 py-2.5 bg-sand border border-sand rounded-xl text-sm focus:outline-none focus:border-forest focus:bg-white">
          <input type="email" placeholder="Email" class="px-4 py-2.5 bg-sand border border-sand rounded-xl text-sm focus:outline-none focus:border-forest focus:bg-white">
        </div>
        <input type="tel" placeholder="電話（選填，用於寄送收據）" class="w-full px-4 py-2.5 bg-sand border border-sand rounded-xl text-sm focus:outline-none focus:border-forest focus:bg-white">
      </div>

      <button onclick="handleAction('捐款 NT$ 500')" class="w-full py-3.5 bg-forest text-white text-sm font-bold rounded-xl hover:bg-forest-dark transition-colors">
        捐款 NT$ 500 💚
      </button>
      <div class="flex items-center justify-center gap-4 mt-4">
        <span class="text-[10px] text-stone">🔒 安全加密付款</span>
        <span class="text-[10px] text-stone">📧 可開立捐款收據</span>
      </div>
    </div>
  </div>
</section>

<!-- Partners -->
<section class="py-12 px-6 bg-sand">
  <div class="max-w-4xl mx-auto text-center fade-up">
    <div class="text-xs text-stone mb-6">合作夥伴</div>
    <div class="flex items-center justify-center gap-8 flex-wrap opacity-50">
      <span class="text-sm font-bold text-bark">教育部</span>
      <span class="text-sm font-bold text-bark">林務局</span>
      <span class="text-sm font-bold text-bark">誠品基金會</span>
      <span class="text-sm font-bold text-bark">Google.org</span>
      <span class="text-sm font-bold text-bark">遠傳電信</span>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="py-16 px-6 bg-forest text-white text-center">
  <div class="max-w-2xl mx-auto fade-up">
    <h2 class="text-3xl font-extrabold mb-4">每一份力量都有意義</h2>
    <p class="text-sm text-white/70 mb-8">不管是捐款、當志工、或只是分享我們的故事，<br>你都在為偏鄉的孩子種下一顆希望的種子。</p>
    <div class="flex items-center justify-center gap-4">
      <button onclick="scrollToDonate()" class="px-6 py-3 bg-sun text-earth text-sm font-bold rounded-full hover:bg-sun-light transition-colors">
        立即捐款
      </button>
      <button onclick="handleAction('成為志工')" class="px-6 py-3 border border-white/30 text-white text-sm font-bold rounded-full hover:bg-white/10 transition-colors">
        成為志工
      </button>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="py-10 px-6 border-t border-sand bg-cream">
  <div class="max-w-6xl mx-auto">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
      <div>
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🌱</span>
          <span class="font-bold text-sm text-forest">綠芽基金會</span>
        </div>
        <p class="text-xs text-stone leading-relaxed">每一顆種子，都值得發芽的機會。</p>
        <p class="text-[10px] text-stone mt-2">衛福部勸募許可字號<br>衛部救字第 1141234567 號</p>
      </div>
      <div>
        <h4 class="text-xs font-bold text-bark mb-3">關於我們</h4>
        <div class="space-y-1.5">
          <a onclick="handleAction('組織沿革')" class="block text-xs text-stone hover:text-forest cursor-pointer transition-colors">組織沿革</a>
          <a onclick="handleAction('年度報告')" class="block text-xs text-stone hover:text-forest cursor-pointer transition-colors">年度報告</a>
          <a onclick="handleAction('財務公開')" class="block text-xs text-stone hover:text-forest cursor-pointer transition-colors">財務公開</a>
        </div>
      </div>
      <div>
        <h4 class="text-xs font-bold text-bark mb-3">參與方式</h4>
        <div class="space-y-1.5">
          <a onclick="scrollToDonate()" class="block text-xs text-stone hover:text-forest cursor-pointer transition-colors">線上捐款</a>
          <a onclick="handleAction('成為志工')" class="block text-xs text-stone hover:text-forest cursor-pointer transition-colors">志工報名</a>
          <a onclick="handleAction('企業合作')" class="block text-xs text-stone hover:text-forest cursor-pointer transition-colors">企業合作</a>
        </div>
      </div>
      <div>
        <h4 class="text-xs font-bold text-bark mb-3">聯繫我們</h4>
        <div class="space-y-1.5 text-xs text-stone">
          <div>02-2345-6789</div>
          <div>hello@greensprout.org.tw</div>
          <div>台北市中正區和平東路一段 88 號 3 樓</div>
          <div class="flex items-center gap-3 pt-2">
            <a onclick="handleAction('Facebook')" class="cursor-pointer hover:text-forest transition-colors">FB</a>
            <a onclick="handleAction('Instagram')" class="cursor-pointer hover:text-forest transition-colors">IG</a>
            <a onclick="handleAction('YouTube')" class="cursor-pointer hover:text-forest transition-colors">YT</a>
            <a onclick="handleAction('LINE')" class="cursor-pointer hover:text-forest transition-colors">LINE</a>
          </div>
        </div>
      </div>
    </div>
    <div class="border-t border-sand pt-6 text-center">
      <p class="text-[10px] text-stone">© 2018-2026 財團法人綠芽教育基金會. All rights reserved.</p>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-forest text-white px-5 py-3 rounded-xl text-xs font-bold shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-50 max-w-sm text-center"></div>

<script>
let selectedAmount = 500;

function selectAmount(el, amt) {
  selectedAmount = amt;
  document.querySelectorAll('.amount-btn').forEach(b => {
    b.classList.remove('active', 'bg-forest', 'text-white', 'border-forest');
    b.classList.add('border-sand', 'text-bark');
  });
  el.classList.add('active', 'bg-forest', 'text-white', 'border-forest');
  el.classList.remove('border-sand', 'text-bark');
}

function selectFreq(el, freq) {
  document.querySelectorAll('.freq-btn').forEach(b => {
    b.classList.remove('active', 'bg-forest', 'text-white', 'border-forest');
    b.classList.add('border-sand', 'text-bark');
  });
  el.classList.add('active', 'bg-forest', 'text-white', 'border-forest');
  el.classList.remove('border-sand', 'text-bark');
}

function scrollToDonate() {
  document.getElementById('donate').scrollIntoView({ behavior: 'smooth' });
}

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
