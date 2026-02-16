INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '902f15d8-0eaf-43d1-881c-3cb757d92efd',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>木白 Mubai — 個人部落格</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Noto+Serif+TC:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        ink: '#1a1a1a',
        paper: '#faf9f7',
        muted: '#8a8580',
        accent: '#c4a882',
        line: '#e8e4df',
        hover: '#f5f3f0'
      },
      fontFamily: {
        serif: ['Lora', 'Noto Serif TC', 'Georgia', 'serif'],
        sans: ['Inter', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Lora', 'Noto Serif TC', serif; background: #faf9f7; color: #1a1a1a; }

  /* Reading typography */
  .prose { font-size: 1.125rem; line-height: 1.9; letter-spacing: 0.01em; }
  .prose p { margin-bottom: 1.75rem; }
  .prose h2 { font-size: 1.5rem; font-weight: 600; margin: 2.5rem 0 1rem; }
  .prose h3 { font-size: 1.25rem; font-weight: 600; margin: 2rem 0 0.75rem; }
  .prose blockquote {
    border-left: 2px solid #c4a882;
    padding-left: 1.5rem;
    margin: 2rem 0;
    color: #8a8580;
    font-style: italic;
  }
  .prose ul { margin: 1.5rem 0; padding-left: 1.5rem; }
  .prose li { margin-bottom: 0.5rem; }
  .prose a { color: #c4a882; text-decoration: underline; text-underline-offset: 3px; }
  .prose img { width: 100%; border-radius: 4px; margin: 2rem 0; }

  /* Animations */
  .fade-up {
    opacity: 0; transform: translateY(20px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  .fade-up.visible { opacity: 1; transform: translateY(0); }

  /* Article hover */
  .article-card { transition: all 0.3s ease; }
  .article-card:hover { background: #f5f3f0; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #faf9f7; }
  ::-webkit-scrollbar-thumb { background: #d4d0cb; border-radius: 3px; }

  /* Tag */
  .tag { transition: all 0.2s ease; }
  .tag:hover { background: #c4a882; color: white; }
  .tag.active { background: #c4a882; color: white; }

  /* Category filter */
  .cat-btn { transition: all 0.2s ease; }
  .cat-btn:hover { color: #1a1a1a; }
  .cat-btn.active { color: #1a1a1a; border-bottom: 2px solid #c4a882; }

  /* Page transition */
  .page { display: none; opacity: 0; transition: opacity 0.4s ease; }
  .page.active { display: block; opacity: 1; }
</style>
</head>
<body>

<!-- Header -->
<header class="border-b border-line bg-paper/80 backdrop-blur-sm sticky top-0 z-50">
  <div class="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
    <a onclick="showPage('home')" class="cursor-pointer flex items-center gap-2">
      <span class="font-serif text-xl font-semibold text-ink tracking-wide">木白</span>
      <span class="text-muted text-xs font-sans tracking-wider uppercase">Mubai</span>
    </a>
    <nav class="hidden md:flex items-center gap-8">
      <a onclick="showPage('home')" class="cursor-pointer text-sm font-sans text-muted hover:text-ink transition-colors">文章</a>
      <a onclick="showPage('about')" class="cursor-pointer text-sm font-sans text-muted hover:text-ink transition-colors">關於</a>
      <a onclick="showPage('archive')" class="cursor-pointer text-sm font-sans text-muted hover:text-ink transition-colors">歸檔</a>
      <a onclick="handleAction('訂閱')" class="cursor-pointer text-sm font-sans text-accent hover:text-ink transition-colors">訂閱</a>
    </nav>
    <button onclick="toggleMobileMenu()" class="md:hidden text-muted hover:text-ink">
      <svg id="menuIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8h16M4 16h16"/></svg>
      <svg id="closeIcon" class="hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M6 18L18 6"/></svg>
    </button>
  </div>
  <!-- Mobile menu -->
  <div id="mobileMenu" class="hidden md:hidden border-t border-line bg-paper">
    <div class="px-6 py-4 space-y-3">
      <a onclick="showPage('home');toggleMobileMenu()" class="block text-sm font-sans text-muted hover:text-ink cursor-pointer">文章</a>
      <a onclick="showPage('about');toggleMobileMenu()" class="block text-sm font-sans text-muted hover:text-ink cursor-pointer">關於</a>
      <a onclick="showPage('archive');toggleMobileMenu()" class="block text-sm font-sans text-muted hover:text-ink cursor-pointer">歸檔</a>
      <a onclick="handleAction('訂閱');toggleMobileMenu()" class="block text-sm font-sans text-accent cursor-pointer">訂閱</a>
    </div>
  </div>
</header>

<!-- HOME PAGE -->
<div id="page-home" class="page active">

  <!-- Hero / Featured Article -->
  <section class="max-w-4xl mx-auto px-6 pt-16 pb-12 fade-up">
    <div class="mb-4">
      <span class="text-xs font-sans text-accent uppercase tracking-widest">精選文章</span>
    </div>
    <article onclick="showArticle(0)" class="cursor-pointer group">
      <!-- Featured image placeholder -->
      <div class="w-full aspect-[2/1] bg-gradient-to-br from-stone-200 via-stone-100 to-amber-50 rounded-lg mb-8 overflow-hidden relative">
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="text-6xl mb-3 opacity-30">🏔</div>
            <span class="text-muted/40 text-sm font-sans">Photo by 木白</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3 mb-4">
        <span class="text-xs font-sans text-muted">2026 年 2 月 8 日</span>
        <span class="text-line">·</span>
        <span class="text-xs font-sans text-muted">12 分鐘閱讀</span>
        <span class="text-line">·</span>
        <span class="text-xs font-sans text-accent">隨筆</span>
      </div>
      <h1 class="text-3xl md:text-4xl font-serif font-semibold leading-tight mb-4 group-hover:text-accent transition-colors">
        在無人的山徑上，我找回了遺失的時間感
      </h1>
      <p class="text-muted text-lg leading-relaxed max-w-2xl">
        城市把時間切割成無數碎片，每一片都貼著待辦事項的標籤。直到我獨自走進那條沒有訊號的山路，才發現：所謂「慢下來」，不是放慢速度，而是讓時間重新變得完整。
      </p>
    </article>
  </section>

  <!-- Divider -->
  <div class="max-w-4xl mx-auto px-6">
    <div class="border-t border-line"></div>
  </div>

  <!-- Category Filter -->
  <section class="max-w-4xl mx-auto px-6 pt-8 pb-4 fade-up">
    <div class="flex items-center gap-6 overflow-x-auto pb-2">
      <button onclick="filterCategory('all')" class="cat-btn text-sm font-sans text-ink pb-1 border-b-2 border-accent whitespace-nowrap active" data-cat="all">全部</button>
      <button onclick="filterCategory('essay')" class="cat-btn text-sm font-sans text-muted pb-1 border-b-2 border-transparent whitespace-nowrap" data-cat="essay">隨筆</button>
      <button onclick="filterCategory('reading')" class="cat-btn text-sm font-sans text-muted pb-1 border-b-2 border-transparent whitespace-nowrap" data-cat="reading">讀書</button>
      <button onclick="filterCategory('tech')" class="cat-btn text-sm font-sans text-muted pb-1 border-b-2 border-transparent whitespace-nowrap" data-cat="tech">技術</button>
      <button onclick="filterCategory('travel')" class="cat-btn text-sm font-sans text-muted pb-1 border-b-2 border-transparent whitespace-nowrap" data-cat="travel">旅行</button>
      <button onclick="filterCategory('life')" class="cat-btn text-sm font-sans text-muted pb-1 border-b-2 border-transparent whitespace-nowrap" data-cat="life">生活</button>
    </div>
  </section>

  <!-- Article List -->
  <section class="max-w-4xl mx-auto px-6 pb-20">
    <div id="articleList" class="divide-y divide-line">

      <!-- Article 1 -->
      <article class="article-card py-8 px-4 -mx-4 rounded-lg cursor-pointer fade-up" data-category="reading" onclick="showArticle(1)">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs font-sans text-muted">2026 年 1 月 28 日</span>
          <span class="text-line">·</span>
          <span class="text-xs font-sans text-muted">8 分鐘閱讀</span>
          <span class="text-line">·</span>
          <span class="text-xs font-sans text-accent">讀書</span>
        </div>
        <h2 class="text-xl font-serif font-semibold mb-3 leading-snug">重讀《小王子》：三十歲看見了不同的沙漠</h2>
        <p class="text-muted leading-relaxed">小時候讀《小王子》覺得是童話，二十歲讀覺得是哲學，三十歲再讀，才發現它是一封寫給大人的情書。那些我們以為「長大就會懂」的事，其實是「長大就會忘」的事。</p>
      </article>

      <!-- Article 2 -->
      <article class="article-card py-8 px-4 -mx-4 rounded-lg cursor-pointer fade-up" data-category="tech" onclick="showArticle(2)">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs font-sans text-muted">2026 年 1 月 15 日</span>
          <span class="text-line">·</span>
          <span class="text-xs font-sans text-muted">15 分鐘閱讀</span>
          <span class="text-line">·</span>
          <span class="text-xs font-sans text-accent">技術</span>
        </div>
        <h2 class="text-xl font-serif font-semibold mb-3 leading-snug">為什麼我從 Notion 搬回了純文字</h2>
        <p class="text-muted leading-relaxed">Notion 是一個優秀的工具，但它解決的是「組織」的問題，而我真正需要的是「思考」的空間。當我把所有筆記搬回 Markdown 純文字後，寫作頻率反而翻了三倍。</p>
      </article>

      <!-- Article 3 -->
      <article class="article-card py-8 px-4 -mx-4 rounded-lg cursor-pointer fade-up" data-category="travel" onclick="showArticle(3)">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs font-sans text-muted">2025 年 12 月 22 日</span>
          <span class="text-line">·</span>
          <span class="text-xs font-sans text-muted">10 分鐘閱讀</span>
          <span class="text-line">·</span>
          <span class="text-xs font-sans text-accent">旅行</span>
        </div>
        <h2 class="text-xl font-serif font-semibold mb-3 leading-snug">東京的早晨六點：一個人的築地散步</h2>
        <p class="text-muted leading-relaxed">旅行最好的時刻，往往不在景點，而在那些「還沒準備好被看見」的時間裡。凌晨六點的築地場外市場，沒有觀光客的喧囂，只有漁販的叫賣聲和熱騰騰的玉子燒。</p>
      </article>

      <!-- Article 4 -->
      <article class="article-card py-8 px-4 -mx-4 rounded-lg cursor-pointer fade-up" data-category="life" onclick="showArticle(4)">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs font-sans text-muted">2025 年 12 月 10 日</span>
          <span class="text-line">·</span>
          <span class="text-xs font-sans text-muted">6 分鐘閱讀</span>
          <span class="text-line">·</span>
          <span class="text-xs font-sans text-accent">生活</span>
        </div>
        <h2 class="text-xl font-serif font-semibold mb-3 leading-snug">咖啡、貓、和一個關於堅持的小故事</h2>
        <p class="text-muted leading-relaxed">養貓第三年，我終於理解了什麼叫做「被需要但不被控制」的關係。每天早上，牠會準時在六點十五分跳上我的書桌，不是因為餓了，而是因為那是我泡咖啡的時間。</p>
      </article>

      <!-- Article 5 -->
      <article class="article-card py-8 px-4 -mx-4 rounded-lg cursor-pointer fade-up" data-category="essay" onclick="showArticle(5)">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs font-sans text-muted">2025 年 11 月 30 日</span>
          <span class="text-line">·</span>
          <span class="text-xs font-sans text-muted">9 分鐘閱讀</span>
          <span class="text-line">·</span>
          <span class="text-xs font-sans text-accent">隨筆</span>
        </div>
        <h2 class="text-xl font-serif font-semibold mb-3 leading-snug">三十歲以後，我開始練習「不回答」</h2>
        <p class="text-muted leading-relaxed">年輕的時候急著表達立場，好像不回答就代表不聰明。三十歲以後才發現，有些問題最好的回應是沈默。不是沒有想法，而是有些想法需要更多時間醞釀。</p>
      </article>

      <!-- Article 6 -->
      <article class="article-card py-8 px-4 -mx-4 rounded-lg cursor-pointer fade-up" data-category="reading" onclick="showArticle(6)">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs font-sans text-muted">2025 年 11 月 12 日</span>
          <span class="text-line">·</span>
          <span class="text-xs font-sans text-muted">11 分鐘閱讀</span>
          <span class="text-line">·</span>
          <span class="text-xs font-sans text-accent">讀書</span>
        </div>
        <h2 class="text-xl font-serif font-semibold mb-3 leading-snug">村上春樹教會我的跑步哲學</h2>
        <p class="text-muted leading-relaxed">讀完《關於跑步，我說的其實是……》，我買了一雙跑鞋。三個月後還在跑，不是因為意志力，而是因為找到了一種「不需要意志力」的節奏。寫作也是如此。</p>
      </article>

    </div>

    <!-- Load More -->
    <div class="text-center pt-8">
      <button onclick="handleAction('載入更多文章')" class="text-sm font-sans text-muted hover:text-ink border border-line hover:border-muted px-6 py-2.5 rounded-full transition-all">
        載入更多
      </button>
    </div>
  </section>

</div>

<!-- ARTICLE DETAIL PAGE -->
<div id="page-article" class="page">
  <article class="max-w-3xl mx-auto px-6 pt-16 pb-20">
    <!-- Back -->
    <div class="mb-10">
      <a onclick="showPage('home')" class="cursor-pointer text-sm font-sans text-muted hover:text-ink transition-colors inline-flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
        返回文章列表
      </a>
    </div>

    <!-- Article Header -->
    <div id="articleHeader" class="mb-12">
      <!-- Populated by JS -->
    </div>

    <!-- Article Body -->
    <div id="articleBody" class="prose">
      <!-- Populated by JS -->
    </div>

    <!-- Article Footer -->
    <div class="border-t border-line mt-16 pt-8">
      <!-- Tags -->
      <div class="flex flex-wrap gap-2 mb-8" id="articleTags">
        <!-- Populated by JS -->
      </div>

      <!-- Share -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="text-xs font-sans text-muted uppercase tracking-wider">分享</span>
          <button onclick="handleAction('複製連結')" class="text-muted hover:text-ink transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          </button>
          <button onclick="handleAction('分享到 Twitter')" class="text-muted hover:text-ink transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </button>
        </div>
        <button onclick="handleAction('喜歡這篇文章')" class="flex items-center gap-2 text-muted hover:text-accent transition-colors group">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="group-hover:fill-accent/20"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <span class="text-sm font-sans">24</span>
        </button>
      </div>
    </div>

    <!-- Author Card -->
    <div class="bg-hover rounded-xl p-6 mt-8 flex items-start gap-5">
      <div class="w-14 h-14 rounded-full bg-gradient-to-br from-accent/40 to-accent/10 flex items-center justify-center flex-shrink-0">
        <span class="text-xl">🌿</span>
      </div>
      <div>
        <h4 class="font-serif font-semibold mb-1">木白</h4>
        <p class="text-sm text-muted leading-relaxed">寫字的人。住在台北，養了一隻叫做句號的貓。喜歡在清晨散步，相信文字是最安靜的陪伴。</p>
        <a onclick="showPage('about')" class="text-sm text-accent hover:text-ink cursor-pointer transition-colors mt-2 inline-block">更多關於我 →</a>
      </div>
    </div>
  </article>
</div>

<!-- ABOUT PAGE -->
<div id="page-about" class="page">
  <div class="max-w-3xl mx-auto px-6 pt-16 pb-20">
    <div class="mb-12 fade-up">
      <a onclick="showPage('home')" class="cursor-pointer text-sm font-sans text-muted hover:text-ink transition-colors inline-flex items-center gap-2 mb-10 block">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
        返回文章列表
      </a>

      <div class="flex flex-col md:flex-row gap-10 items-start">
        <!-- Avatar -->
        <div class="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-stone-200 via-amber-50 to-stone-100 flex items-center justify-center flex-shrink-0">
          <span class="text-5xl">🌿</span>
        </div>
        <div>
          <h1 class="text-3xl font-serif font-semibold mb-2">木白</h1>
          <p class="text-muted font-sans text-sm mb-6">寫作者 · 讀者 · 散步愛好者</p>
          <div class="prose">
            <p>我是木白，一個住在台北的寫字人。白天做著與文字無關的工作，夜晚把想法釀成文章。相信慢慢寫、好好活，是對抗焦慮最溫柔的方式。</p>
            <p>這個部落格沒有固定主題。有時候是讀完一本書後的碎碎念，有時候是旅途中的觀察筆記，偶爾也會寫一些技術心得。如果你在這裡讀到了什麼有共鳴的東西，那就是最好的相遇。</p>
            <p>養了一隻橘貓叫做「句號」，因為牠總是在我寫到一半的時候，跳上鍵盤替我結束段落。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-6 py-8 border-y border-line mb-12 fade-up">
      <div class="text-center">
        <div class="text-2xl font-serif font-semibold text-ink">142</div>
        <div class="text-xs font-sans text-muted mt-1">篇文章</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-serif font-semibold text-ink">3 年</div>
        <div class="text-xs font-sans text-muted mt-1">持續寫作</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-serif font-semibold text-ink">2.4K</div>
        <div class="text-xs font-sans text-muted mt-1">訂閱讀者</div>
      </div>
    </div>

    <!-- Currently -->
    <div class="fade-up">
      <h2 class="text-lg font-serif font-semibold mb-6">最近在做的事</h2>
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <span class="text-lg mt-0.5">📖</span>
          <div>
            <div class="font-serif font-medium text-sm">正在讀</div>
            <div class="text-muted text-sm">赫曼·赫塞《乞力馬札羅的雪》、松浦彌太郎《100 個基本》</div>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-lg mt-0.5">✍️</span>
          <div>
            <div class="font-serif font-medium text-sm">正在寫</div>
            <div class="text-muted text-sm">一系列關於「數位極簡」的長文</div>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-lg mt-0.5">🎧</span>
          <div>
            <div class="font-serif font-medium text-sm">正在聽</div>
            <div class="text-muted text-sm">坂本龍一《async》、Nils Frahm《All Melody》</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact -->
    <div class="mt-12 pt-8 border-t border-line fade-up">
      <h2 class="text-lg font-serif font-semibold mb-4">聯繫方式</h2>
      <p class="text-muted text-sm mb-4">歡迎寫信給我，不管是讀後感想、合作邀約、或只是想聊聊。</p>
      <a onclick="handleAction('寄送郵件')" class="cursor-pointer text-accent hover:text-ink text-sm font-sans transition-colors">hello@mubai.blog →</a>
    </div>
  </div>
</div>

<!-- ARCHIVE PAGE -->
<div id="page-archive" class="page">
  <div class="max-w-3xl mx-auto px-6 pt-16 pb-20">
    <a onclick="showPage('home')" class="cursor-pointer text-sm font-sans text-muted hover:text-ink transition-colors inline-flex items-center gap-2 mb-10 block">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
      返回文章列表
    </a>

    <h1 class="text-3xl font-serif font-semibold mb-2 fade-up">歸檔</h1>
    <p class="text-muted mb-12 fade-up">共 142 篇文章，持續更新中。</p>

    <!-- Year groups -->
    <div class="space-y-10">
      <!-- 2026 -->
      <div class="fade-up">
        <h2 class="text-lg font-serif font-semibold text-ink mb-4 flex items-center gap-3">
          <span>2026</span>
          <span class="text-xs font-sans text-muted font-normal">8 篇</span>
        </h2>
        <div class="space-y-3 pl-4 border-l-2 border-line">
          <div onclick="showArticle(0)" class="cursor-pointer flex items-baseline gap-4 group">
            <span class="text-xs font-sans text-muted w-12 flex-shrink-0">02/08</span>
            <span class="text-sm font-serif group-hover:text-accent transition-colors">在無人的山徑上，我找回了遺失的時間感</span>
          </div>
          <div onclick="showArticle(1)" class="cursor-pointer flex items-baseline gap-4 group">
            <span class="text-xs font-sans text-muted w-12 flex-shrink-0">01/28</span>
            <span class="text-sm font-serif group-hover:text-accent transition-colors">重讀《小王子》：三十歲看見了不同的沙漠</span>
          </div>
          <div onclick="showArticle(2)" class="cursor-pointer flex items-baseline gap-4 group">
            <span class="text-xs font-sans text-muted w-12 flex-shrink-0">01/15</span>
            <span class="text-sm font-serif group-hover:text-accent transition-colors">為什麼我從 Notion 搬回了純文字</span>
          </div>
        </div>
      </div>

      <!-- 2025 -->
      <div class="fade-up">
        <h2 class="text-lg font-serif font-semibold text-ink mb-4 flex items-center gap-3">
          <span>2025</span>
          <span class="text-xs font-sans text-muted font-normal">52 篇</span>
        </h2>
        <div class="space-y-3 pl-4 border-l-2 border-line">
          <div onclick="showArticle(3)" class="cursor-pointer flex items-baseline gap-4 group">
            <span class="text-xs font-sans text-muted w-12 flex-shrink-0">12/22</span>
            <span class="text-sm font-serif group-hover:text-accent transition-colors">東京的早晨六點：一個人的築地散步</span>
          </div>
          <div onclick="showArticle(4)" class="cursor-pointer flex items-baseline gap-4 group">
            <span class="text-xs font-sans text-muted w-12 flex-shrink-0">12/10</span>
            <span class="text-sm font-serif group-hover:text-accent transition-colors">咖啡、貓、和一個關於堅持的小故事</span>
          </div>
          <div onclick="showArticle(5)" class="cursor-pointer flex items-baseline gap-4 group">
            <span class="text-xs font-sans text-muted w-12 flex-shrink-0">11/30</span>
            <span class="text-sm font-serif group-hover:text-accent transition-colors">三十歲以後，我開始練習「不回答」</span>
          </div>
          <div onclick="showArticle(6)" class="cursor-pointer flex items-baseline gap-4 group">
            <span class="text-xs font-sans text-muted w-12 flex-shrink-0">11/12</span>
            <span class="text-sm font-serif group-hover:text-accent transition-colors">村上春樹教會我的跑步哲學</span>
          </div>
          <div class="cursor-pointer flex items-baseline gap-4 group">
            <span class="text-xs font-sans text-muted w-12 flex-shrink-0">10/28</span>
            <span class="text-sm font-serif group-hover:text-accent transition-colors">那些年，我在深夜便利商店學到的事</span>
          </div>
          <div class="cursor-pointer flex items-baseline gap-4 group">
            <span class="text-xs font-sans text-muted w-12 flex-shrink-0">10/05</span>
            <span class="text-sm font-serif group-hover:text-accent transition-colors">數位極簡主義（一）：先刪 App，再刪焦慮</span>
          </div>
          <div class="text-xs font-sans text-muted pl-16 pt-1">⋯ 還有 44 篇</div>
        </div>
      </div>

      <!-- 2024 -->
      <div class="fade-up">
        <h2 class="text-lg font-serif font-semibold text-ink mb-4 flex items-center gap-3">
          <span>2024</span>
          <span class="text-xs font-sans text-muted font-normal">48 篇</span>
        </h2>
        <div class="space-y-3 pl-4 border-l-2 border-line">
          <div class="cursor-pointer flex items-baseline gap-4 group">
            <span class="text-xs font-sans text-muted w-12 flex-shrink-0">12/31</span>
            <span class="text-sm font-serif group-hover:text-accent transition-colors">2024 年終回顧：寫了 48 篇文章之後</span>
          </div>
          <div class="cursor-pointer flex items-baseline gap-4 group">
            <span class="text-xs font-sans text-muted w-12 flex-shrink-0">11/15</span>
            <span class="text-sm font-serif group-hover:text-accent transition-colors">在京都發呆的三天</span>
          </div>
          <div class="text-xs font-sans text-muted pl-16 pt-1">⋯ 還有 46 篇</div>
        </div>
      </div>

      <!-- 2023 -->
      <div class="fade-up">
        <h2 class="text-lg font-serif font-semibold text-ink mb-4 flex items-center gap-3">
          <span>2023</span>
          <span class="text-xs font-sans text-muted font-normal">34 篇</span>
        </h2>
        <div class="space-y-3 pl-4 border-l-2 border-line">
          <div class="cursor-pointer flex items-baseline gap-4 group">
            <span class="text-xs font-sans text-muted w-12 flex-shrink-0">08/20</span>
            <span class="text-sm font-serif group-hover:text-accent transition-colors">第一篇文章：為什麼我決定開始寫部落格</span>
          </div>
          <div class="text-xs font-sans text-muted pl-16 pt-1">⋯ 還有 33 篇</div>
        </div>
      </div>
    </div>

    <!-- Tags Cloud -->
    <div class="mt-16 pt-8 border-t border-line fade-up">
      <h2 class="text-lg font-serif font-semibold mb-6">標籤</h2>
      <div class="flex flex-wrap gap-2">
        <span class="tag px-3 py-1 text-xs font-sans text-muted border border-line rounded-full cursor-pointer">隨筆 (28)</span>
        <span class="tag px-3 py-1 text-xs font-sans text-muted border border-line rounded-full cursor-pointer">讀書 (24)</span>
        <span class="tag px-3 py-1 text-xs font-sans text-muted border border-line rounded-full cursor-pointer">旅行 (19)</span>
        <span class="tag px-3 py-1 text-xs font-sans text-muted border border-line rounded-full cursor-pointer">生活 (22)</span>
        <span class="tag px-3 py-1 text-xs font-sans text-muted border border-line rounded-full cursor-pointer">技術 (15)</span>
        <span class="tag px-3 py-1 text-xs font-sans text-muted border border-line rounded-full cursor-pointer">寫作 (12)</span>
        <span class="tag px-3 py-1 text-xs font-sans text-muted border border-line rounded-full cursor-pointer">攝影 (8)</span>
        <span class="tag px-3 py-1 text-xs font-sans text-muted border border-line rounded-full cursor-pointer">音樂 (7)</span>
        <span class="tag px-3 py-1 text-xs font-sans text-muted border border-line rounded-full cursor-pointer">咖啡 (6)</span>
        <span class="tag px-3 py-1 text-xs font-sans text-muted border border-line rounded-full cursor-pointer">極簡主義 (5)</span>
        <span class="tag px-3 py-1 text-xs font-sans text-muted border border-line rounded-full cursor-pointer">東京 (4)</span>
        <span class="tag px-3 py-1 text-xs font-sans text-muted border border-line rounded-full cursor-pointer">京都 (3)</span>
      </div>
    </div>
  </div>
</div>

<!-- Footer -->
<footer class="border-t border-line bg-paper">
  <div class="max-w-4xl mx-auto px-6 py-12">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <div class="font-serif text-lg font-semibold text-ink mb-1">木白</div>
        <p class="text-xs text-muted font-sans">慢慢寫，好好活。</p>
      </div>
      <div class="flex items-center gap-6">
        <a onclick="handleAction('RSS 訂閱')" class="cursor-pointer text-muted hover:text-ink text-xs font-sans transition-colors">RSS</a>
        <a onclick="handleAction('Twitter')" class="cursor-pointer text-muted hover:text-ink text-xs font-sans transition-colors">Twitter</a>
        <a onclick="handleAction('GitHub')" class="cursor-pointer text-muted hover:text-ink text-xs font-sans transition-colors">GitHub</a>
        <a onclick="handleAction('Email')" class="cursor-pointer text-muted hover:text-ink text-xs font-sans transition-colors">Email</a>
      </div>
    </div>
    <div class="border-t border-line mt-8 pt-6 text-center">
      <p class="text-xs text-muted/60 font-sans">© 2023-2026 木白 Mubai. All rights reserved.</p>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-paper px-5 py-3 rounded-lg text-sm font-sans shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-50 max-w-sm text-center"></div>

<script>
// Articles data
const articles = [
  {
    title: '在無人的山徑上，我找回了遺失的時間感',
    date: '2026 年 2 月 8 日',
    readTime: '12 分鐘閱讀',
    category: '隨筆',
    tags: ['隨筆', '生活', '旅行', '極簡主義'],
    body: `
      <p>城市把時間切割成無數碎片，每一片都貼著待辦事項的標籤。行事曆上的格子像是蜂巢，我們在其中忙碌地穿梭，卻從來不問：這些蜂蜜，到底是誰的？</p>

      <h2>失去的不是時間，是感受時間的能力</h2>

      <p>上個月，我獨自去了一趟南投的山裡。不是什麼有名的百岳，只是一條當地人才知道的林道。沒有手機訊號，沒有標示牌，只有腳下踩著落葉的聲音。</p>

      <blockquote>走了大約兩個小時後，我停下來坐在一塊石頭上。那一刻我才意識到：我已經很久沒有「只是坐著」了。</blockquote>

      <p>城市裡的「坐著」永遠帶著目的——等人、等車、等餐、等會議開始。但在山裡的那塊石頭上，我什麼都不等。風吹過來，樹搖了搖，遠處有鳥叫了三聲。就這樣。</p>

      <h2>慢下來，不是放慢速度</h2>

      <p>我們常說「慢活」、「慢食」、「慢旅行」，但這些「慢」字其實都用錯了。真正的慢，不是把速度調低，而是讓時間重新變得「完整」。</p>

      <p>在山裡的三天，我沒有看手錶。日出就起來，天暗就睡覺。第一天覺得難以忍受的漫長，第二天開始習慣，第三天則覺得三天像是活了一個月。</p>

      <h3>具體的感受</h3>

      <ul>
        <li>煮一壺水需要十五分鐘，但這十五分鐘是完整的</li>
        <li>走路的時候只在走路，不在想別的事</li>
        <li>傍晚的光影變化可以看半小時</li>
        <li>睡覺前不需要「做點什麼」來填滿空虛</li>
      </ul>

      <p>回到台北的第一天，捷運上所有人都在滑手機。我也拿出手機，然後又放了回去。不是刻意裝文青，而是真的覺得——窗外的風景，比螢幕裡的任何東西都更值得看。</p>

      <h2>寫在最後</h2>

      <p>我不確定這種感覺能維持多久。也許一個星期後，我又會被城市的節奏帶走。但至少我知道了——那種「完整的時間」是存在的，它一直在那裡，只是被我們遺忘了。</p>

      <p>下次，如果你也覺得日子過得太碎，不妨找一條沒有訊號的路，走一走。不需要很遠，只需要夠安靜。</p>
    `
  },
  {
    title: '重讀《小王子》：三十歲看見了不同的沙漠',
    date: '2026 年 1 月 28 日',
    readTime: '8 分鐘閱讀',
    category: '讀書',
    tags: ['讀書', '隨筆', '生活'],
    body: `
      <p>小時候讀《小王子》覺得是童話。狐狸、玫瑰、星球——一切都很可愛。二十歲再讀，覺得它是哲學寓言。三十歲又翻開，才發現它是一封寫給大人的情書。</p>

      <h2>「馴服」這個詞，我花了十年才讀懂</h2>

      <blockquote>「對我而言，你不過是一個小男孩，跟其他成千上萬的小男孩沒什麼不同。我不需要你，你也不需要我。但是，如果你馴服了我，我們就彼此需要了。」</blockquote>

      <p>二十歲讀到這段，覺得狐狸在講愛情。三十歲再讀，才明白牠講的是所有的「關係」——友情、親情、和你與一杯每天早上固定時間喝的咖啡之間的關係。</p>

      <p>馴服，就是讓日子不再只是日子。讓星期四變得和其他日子不一樣。讓某一朵玫瑰，在五千朵裡變得獨一無二。</p>

      <h2>大人的問題</h2>

      <p>書裡有一段常被忽略的話：大人只對數字感興趣。你說「我認識一個人」，他們會問「他年薪多少」，而不是「他笑起來什麼樣子」。</p>

      <p>三十歲的我回頭看，發現自己不知不覺也變成了那種大人。認識新朋友會先看名片，買東西會先看評價，選餐廳會先看評分。我們用數字來衡量一切，卻忘了很多最重要的東西是無法量化的。</p>

      <p>重讀這本書，像是收到了十年前自己寄來的一封信。信上寫著：別忘了用心去看。</p>
    `
  },
  {
    title: '為什麼我從 Notion 搬回了純文字',
    date: '2026 年 1 月 15 日',
    readTime: '15 分鐘閱讀',
    category: '技術',
    tags: ['技術', '寫作', '極簡主義'],
    body: `
      <p>先說結論：Notion 是一個優秀的工具。但對我來說，它解決的是「組織」的問題，而我真正需要的是「思考」的空間。</p>

      <h2>工具的陷阱</h2>

      <p>我用了三年 Notion。資料庫、看板、模板、公式、Relation——全都用上了。我的 Notion 架構精美到可以當教學範本，但有一天我突然發現：我花在「整理」筆記的時間，比「寫」筆記的時間還多。</p>

      <blockquote>最危險的生產力陷阱，是讓你覺得自己「好像在做事」的工具。</blockquote>

      <p>搬回 Markdown 純文字後的前兩週很痛苦。沒有拖拉、沒有美麗的封面圖、沒有資料庫。但第三週開始，我發現寫作頻率翻了三倍。不是因為效率提高了，而是因為摩擦力消失了。</p>

      <h2>我現在的工作流</h2>

      <ul>
        <li>所有筆記用 .md 純文字，存在本機資料夾裡</li>
        <li>編輯器用 VS Code（是的，寫文章也用）</li>
        <li>用 Git 做版本控制（沒什麼比 git log 更好的寫作日記了）</li>
        <li>搜尋用 ripgrep，比任何 App 都快</li>
      </ul>

      <p>看起來很 geek？也許吧。但重點不在工具本身，而是：當工具簡單到幾乎「不存在」的時候，你才能真正專注在內容上。</p>
    `
  },
  {
    title: '東京的早晨六點：一個人的築地散步',
    date: '2025 年 12 月 22 日',
    readTime: '10 分鐘閱讀',
    category: '旅行',
    tags: ['旅行', '東京', '攝影'],
    body: `
      <p>旅行最好的時刻，往往不在景點，而在那些「還沒準備好被看見」的時間裡。</p>

      <p>凌晨六點的東京，和你在旅遊節目上看到的完全不同。新宿的霓虹燈大多熄了，只剩下清潔車的聲音和偶爾經過的計程車。空氣冷冽而清新，帶著一種「城市剛洗完澡」的乾淨感。</p>

      <h2>築地的六點</h2>

      <p>搭了始發電車到築地。場外市場已經醒了——不是為了觀光客醒的，而是為了生活。</p>

      <p>一個穿著白色圍裙的老伯伯正在燒玉子燒，手法快到像是在表演。旁邊的壽司店剛把暖簾掛出來，裡面坐著兩個穿西裝的上班族，安靜地吃著早餐。沒有人自拍。</p>

      <blockquote>我站在路邊吃了一串烤年糕。醬油的香氣在冷空氣裡特別濃。那是整趟旅行裡，我最快樂的五分鐘。</blockquote>

      <p>七點半以後，觀光客開始出現，築地又變回了「築地」。但我知道它剛才的樣子。那個安靜的、屬於當地人的築地。</p>

      <p>旅行的意義，也許就在這些「偷看到的」瞬間裡。</p>
    `
  },
  {
    title: '咖啡、貓、和一個關於堅持的小故事',
    date: '2025 年 12 月 10 日',
    readTime: '6 分鐘閱讀',
    category: '生活',
    tags: ['生活', '咖啡', '隨筆'],
    body: `
      <p>養貓第三年，我終於理解了什麼叫做「被需要但不被控制」的關係。</p>

      <p>句號（我的貓）每天早上六點十五分會跳上我的書桌。不是因為餓了——牠的自動餵食機在六點就會響。牠來書桌，是因為那是我泡咖啡的時間。</p>

      <h2>儀式感</h2>

      <p>我每天的寫作習慣是這樣的：六點起床，磨豆，手沖一杯咖啡，然後坐到書桌前。句號會在我右手邊蜷成一個完美的圈，開始打呼。我開始寫字。</p>

      <p>這個流程堅持了三年，風雨無阻。不是因為意志力，而是因為如果我某天沒有準時坐下來，句號會一直盯著空椅子看，然後喵一聲。</p>

      <blockquote>所謂堅持，也許不需要多大的決心。你只需要一杯咖啡，和一隻會在固定時間跳上桌的貓。</blockquote>
    `
  },
  {
    title: '三十歲以後，我開始練習「不回答」',
    date: '2025 年 11 月 30 日',
    readTime: '9 分鐘閱讀',
    category: '隨筆',
    tags: ['隨筆', '生活'],
    body: `
      <p>年輕的時候，我急著表達立場。別人問我「你覺得呢」，我一定要馬上給一個漂亮的回答。好像不回答，就代表不聰明。</p>

      <h2>沉默不是沒有想法</h2>

      <p>三十歲以後，我開始說「我不知道」和「讓我想想」。不是變笨了，而是終於明白：有些問題值得更多時間。</p>

      <blockquote>快速的回答取悅的是對方，深思熟慮的回答尊重的是問題本身。</blockquote>

      <p>社群媒體讓我們習慣了即時反應。一條新聞出來，十分鐘內就要有觀點。一個爭議發生，一小時內就要選邊站。但很多真正重要的問題，根本不是一小時能想清楚的。</p>

      <h2>練習的方法</h2>

      <ul>
        <li>被問到複雜問題時，先說「讓我想想」（然後真的去想）</li>
        <li>在社群上看到爭議時，先關掉 App，過一天再看</li>
        <li>寫文章時，寫完先放三天，三天後再決定要不要發</li>
        <li>被激怒的時候，先喝一杯水</li>
      </ul>

      <p>這些聽起來都很簡單，但做起來需要反覆練習。因為「馬上回答」是本能，「暫停一下」才是功夫。</p>
    `
  },
  {
    title: '村上春樹教會我的跑步哲學',
    date: '2025 年 11 月 12 日',
    readTime: '11 分鐘閱讀',
    category: '讀書',
    tags: ['讀書', '生活', '隨筆'],
    body: `
      <p>讀完《關於跑步，我說的其實是……》之後，我買了一雙跑鞋。本來以為會跟之前一樣三天打魚兩天曬網，結果三個月後竟然還在跑。</p>

      <h2>不需要意志力的節奏</h2>

      <p>村上說，跑步最重要的不是速度，而是找到「自己的節奏」。太快會受傷，太慢會無聊。找到那個「可以一直跑下去」的速度，比什麼都重要。</p>

      <blockquote>寫作也是如此。不是每天寫一萬字，而是每天寫五百字，然後持續十年。</blockquote>

      <p>我現在每天早上跑三十分鐘。不多不少，不快不慢。跑的時候不聽 Podcast、不聽音樂，就聽自己的呼吸聲。那是一天當中，最安靜的三十分鐘。</p>

      <h2>痛苦是禮物</h2>

      <p>村上還說了一句話，讓我印象深刻：「Pain is inevitable. Suffering is optional.」（痛苦無可避免，但要不要受苦是你的選擇。）</p>

      <p>跑步的時候膝蓋會痛、會喘、會想放棄。但如果你接受這些痛苦是過程的一部分，而不是需要逃避的敵人，一切就變得不一樣了。</p>

      <p>寫作、工作、人生，不也是這樣嗎？</p>
    `
  }
];

// Page navigation
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); });
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Re-trigger fade-up for new page
    setTimeout(() => {
      target.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    }, 100);
  }
}

// Show article detail
function showArticle(index) {
  const article = articles[index];
  if (!article) return;

  document.getElementById('articleHeader').innerHTML = `
    <div class="flex items-center gap-3 mb-4">
      <span class="text-xs font-sans text-muted">${article.date}</span>
      <span class="text-line">·</span>
      <span class="text-xs font-sans text-muted">${article.readTime}</span>
      <span class="text-line">·</span>
      <span class="text-xs font-sans text-accent">${article.category}</span>
    </div>
    <h1 class="text-3xl md:text-4xl font-serif font-semibold leading-tight">${article.title}</h1>
    <div class="flex items-center gap-3 mt-6">
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-accent/40 to-accent/10 flex items-center justify-center">
        <span class="text-sm">🌿</span>
      </div>
      <span class="text-sm font-sans text-muted">木白</span>
    </div>
  `;

  document.getElementById('articleBody').innerHTML = article.body;
  document.getElementById('articleTags').innerHTML = article.tags.map(t =>
    `<span class="tag px-3 py-1 text-xs font-sans text-muted border border-line rounded-full cursor-pointer">${t}</span>`
  ).join('');

  showPage('article');
}

// Category filter
let currentCategory = 'all';
function filterCategory(cat) {
  currentCategory = cat;
  // Update active button
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
    btn.classList.toggle('text-ink', btn.dataset.cat === cat);
    btn.classList.toggle('text-muted', btn.dataset.cat !== cat);
    if (btn.dataset.cat === cat) {
      btn.style.borderBottomColor = '#c4a882';
    } else {
      btn.style.borderBottomColor = 'transparent';
    }
  });

  // Filter articles
  const categoryMap = { essay: '隨筆', reading: '讀書', tech: '技術', travel: '旅行', life: '生活' };
  document.querySelectorAll('#articleList .article-card').forEach(card => {
    if (cat === 'all') {
      card.style.display = 'block';
    } else {
      const cardCat = card.dataset.category;
      card.style.display = cardCat === cat ? 'block' : 'none';
    }
  });
}

// Mobile menu
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const menuIcon = document.getElementById('menuIcon');
  const closeIcon = document.getElementById('closeIcon');
  const isOpen = !menu.classList.contains('hidden');
  menu.classList.toggle('hidden');
  menuIcon.classList.toggle('hidden', !isOpen);
  closeIcon.classList.toggle('hidden', isOpen);
}

// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translate(-50%, 0)';
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translate(-50%, 8px)';
  }, 2500);
}

function handleAction(action) {
  showToast(action + ' — 此為模板展示');
}

// Intersection Observer for fade-up
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// Initial trigger
setTimeout(() => {
  document.querySelectorAll('#page-home .fade-up').forEach(el => el.classList.add('visible'));
}, 100);
</script>

</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
