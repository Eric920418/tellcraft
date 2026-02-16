INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'c25f4767-d700-41d6-9451-c323ed99ceb8',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Code & Coffee — 技術筆記</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        elevated: 'var(--elevated)',
        border: 'var(--border-color)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'code-bg': 'var(--code-bg)'
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }

  /* Theme variables */
  :root {
    --surface: #0f172a;
    --elevated: #1e293b;
    --border-color: #334155;
    --text: #f1f5f9;
    --text-secondary: #94a3b8;
    --text-tertiary: #64748b;
    --accent: #38bdf8;
    --accent-soft: rgba(56, 189, 248, 0.1);
    --code-bg: #0d1321;
  }

  [data-theme="light"] {
    --surface: #ffffff;
    --elevated: #f8fafc;
    --border-color: #e2e8f0;
    --text: #0f172a;
    --text-secondary: #475569;
    --text-tertiary: #94a3b8;
    --accent: #0284c7;
    --accent-soft: rgba(2, 132, 199, 0.08);
    --code-bg: #f1f5f9;
  }

  body {
    font-family: 'Inter', 'Noto Sans TC', sans-serif;
    background: var(--surface);
    color: var(--text);
    transition: background 0.3s ease, color 0.3s ease;
  }

  /* Code blocks */
  .code-block {
    background: var(--code-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.875rem;
    line-height: 1.7;
  }
  .code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: var(--elevated);
    border-bottom: 1px solid var(--border-color);
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }
  .code-dots { display: flex; gap: 6px; }
  .code-dots span { width: 10px; height: 10px; border-radius: 50%; }
  .code-content { padding: 16px; overflow-x: auto; }

  /* Syntax colors */
  .syn-keyword { color: #c084fc; }
  .syn-string { color: #86efac; }
  .syn-func { color: #60a5fa; }
  .syn-comment { color: #64748b; font-style: italic; }
  .syn-type { color: #fbbf24; }
  .syn-num { color: #f472b6; }
  .syn-tag { color: #38bdf8; }
  .syn-attr { color: #a78bfa; }
  .syn-punct { color: #94a3b8; }
  [data-theme="light"] .syn-keyword { color: #7c3aed; }
  [data-theme="light"] .syn-string { color: #16a34a; }
  [data-theme="light"] .syn-func { color: #2563eb; }
  [data-theme="light"] .syn-comment { color: #94a3b8; }
  [data-theme="light"] .syn-type { color: #d97706; }
  [data-theme="light"] .syn-num { color: #db2777; }
  [data-theme="light"] .syn-tag { color: #0284c7; }

  /* Prose */
  .prose p { margin-bottom: 1.5rem; line-height: 1.85; color: var(--text-secondary); }
  .prose h2 { font-size: 1.375rem; font-weight: 600; margin: 2.5rem 0 1rem; color: var(--text); }
  .prose h3 { font-size: 1.125rem; font-weight: 600; margin: 2rem 0 0.75rem; color: var(--text); }
  .prose ul, .prose ol { margin: 1.25rem 0; padding-left: 1.5rem; color: var(--text-secondary); }
  .prose li { margin-bottom: 0.5rem; line-height: 1.7; }
  .prose blockquote {
    border-left: 3px solid var(--accent);
    padding-left: 1.25rem;
    margin: 1.5rem 0;
    color: var(--text-tertiary);
    font-style: italic;
  }
  .prose code:not(.code-content code) {
    background: var(--accent-soft);
    color: var(--accent);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.875em;
  }
  .prose a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }

  /* Animations */
  .fade-up {
    opacity: 0; transform: translateY(16px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .fade-up.visible { opacity: 1; transform: translateY(0); }

  /* Page system */
  .page { display: none; opacity: 0; transition: opacity 0.3s ease; }
  .page.active { display: block; opacity: 1; }

  /* Tag */
  .tag-pill {
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .tag-pill:hover { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }

  /* TOC */
  .toc-link {
    transition: all 0.2s ease;
    border-left: 2px solid transparent;
  }
  .toc-link:hover, .toc-link.active {
    color: var(--accent);
    border-left-color: var(--accent);
    background: var(--accent-soft);
  }

  /* Article card */
  .article-row { transition: all 0.2s ease; }
  .article-row:hover { background: var(--elevated); }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px; }
</style>
</head>
<body>

<!-- Header -->
<header class="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
  <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
    <div class="flex items-center gap-6">
      <a onclick="showPage('home')" class="cursor-pointer flex items-center gap-2">
        <div class="w-7 h-7 rounded-md bg-accent/20 flex items-center justify-center">
          <span class="font-mono text-accent text-xs font-bold">&lt;/&gt;</span>
        </div>
        <span class="font-semibold text-sm text-text">Code & Coffee</span>
      </a>
      <nav class="hidden md:flex items-center gap-5">
        <a onclick="showPage('home')" class="cursor-pointer text-xs text-text-secondary hover:text-text transition-colors">文章</a>
        <a onclick="filterTag('all')" class="cursor-pointer text-xs text-text-secondary hover:text-text transition-colors">標籤</a>
        <a onclick="showPage('about')" class="cursor-pointer text-xs text-text-secondary hover:text-text transition-colors">關於</a>
      </nav>
    </div>
    <div class="flex items-center gap-3">
      <!-- Search -->
      <button onclick="handleAction('搜尋')" class="w-44 hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-text-tertiary border border-border rounded-md hover:border-text-tertiary transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        搜尋文章...
        <span class="ml-auto text-[10px] border border-border rounded px-1 py-0.5">⌘K</span>
      </button>
      <!-- Theme toggle -->
      <button onclick="toggleTheme()" class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-elevated transition-colors" title="切換主題">
        <svg id="themeIconDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <svg id="themeIconLight" class="hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      </button>
      <!-- GitHub -->
      <a onclick="handleAction('GitHub')" class="cursor-pointer w-8 h-8 flex items-center justify-center rounded-md hover:bg-elevated transition-colors text-text-secondary hover:text-text">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
      </a>
    </div>
  </div>
</header>

<!-- HOME PAGE -->
<div id="page-home" class="page active">

  <!-- Hero -->
  <section class="max-w-6xl mx-auto px-6 pt-12 pb-8 fade-up">
    <div class="flex items-start gap-4 mb-2">
      <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/30 to-purple-500/20 flex items-center justify-center flex-shrink-0">
        <span class="text-xl">☕</span>
      </div>
      <div>
        <h1 class="text-2xl font-semibold text-text mb-1">Code & Coffee</h1>
        <p class="text-sm text-text-secondary">前端工程師的技術筆記。記錄 React、TypeScript、系統設計和偶爾的人生感悟。</p>
      </div>
    </div>
  </section>

  <!-- Tags -->
  <section class="max-w-6xl mx-auto px-6 pb-6 fade-up">
    <div class="flex items-center gap-2 overflow-x-auto pb-2" id="tagFilters">
      <button onclick="filterTag('all')" class="tag-pill px-3 py-1 text-xs rounded-full border border-accent bg-accent/10 text-accent whitespace-nowrap" data-tag="all">全部</button>
      <button onclick="filterTag('react')" class="tag-pill px-3 py-1 text-xs rounded-full border border-border text-text-secondary whitespace-nowrap" data-tag="react">React</button>
      <button onclick="filterTag('typescript')" class="tag-pill px-3 py-1 text-xs rounded-full border border-border text-text-secondary whitespace-nowrap" data-tag="typescript">TypeScript</button>
      <button onclick="filterTag('nextjs')" class="tag-pill px-3 py-1 text-xs rounded-full border border-border text-text-secondary whitespace-nowrap" data-tag="nextjs">Next.js</button>
      <button onclick="filterTag('system')" class="tag-pill px-3 py-1 text-xs rounded-full border border-border text-text-secondary whitespace-nowrap" data-tag="system">系統設計</button>
      <button onclick="filterTag('css')" class="tag-pill px-3 py-1 text-xs rounded-full border border-border text-text-secondary whitespace-nowrap" data-tag="css">CSS</button>
      <button onclick="filterTag('career')" class="tag-pill px-3 py-1 text-xs rounded-full border border-border text-text-secondary whitespace-nowrap" data-tag="career">職涯</button>
      <button onclick="filterTag('tooling')" class="tag-pill px-3 py-1 text-xs rounded-full border border-border text-text-secondary whitespace-nowrap" data-tag="tooling">工具</button>
    </div>
  </section>

  <!-- Featured -->
  <section class="max-w-6xl mx-auto px-6 pb-8 fade-up">
    <article onclick="showArticle(0)" class="cursor-pointer group border border-border rounded-xl overflow-hidden hover:border-accent/40 transition-all" data-tags="react,typescript">
      <div class="flex flex-col md:flex-row">
        <div class="md:w-2/5 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-cyan-500/20 aspect-video md:aspect-auto flex items-center justify-center relative">
          <div class="text-center p-8">
            <div class="font-mono text-4xl text-accent/60 mb-2">{...}</div>
            <div class="text-xs text-text-tertiary font-mono">react-patterns.tsx</div>
          </div>
          <div class="absolute top-3 left-3 px-2 py-0.5 bg-accent/20 text-accent text-[10px] font-mono rounded">FEATURED</div>
        </div>
        <div class="md:w-3/5 p-6 md:p-8">
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2 py-0.5 text-[10px] font-mono bg-cyan-500/10 text-cyan-400 rounded">React</span>
            <span class="px-2 py-0.5 text-[10px] font-mono bg-yellow-500/10 text-yellow-400 rounded">TypeScript</span>
            <span class="text-text-tertiary text-xs ml-auto">2026/02/12</span>
          </div>
          <h2 class="text-lg font-semibold text-text mb-3 group-hover:text-accent transition-colors leading-snug">
            React Server Components 完全指南：從概念到實戰
          </h2>
          <p class="text-sm text-text-secondary leading-relaxed mb-4">
            RSC 不只是一個新功能，它重新定義了 React 應用的架構方式。本文從渲染模型的根本差異出發，帶你理解 Server/Client 組件的邊界、資料流設計，以及遷移策略。
          </p>
          <div class="flex items-center gap-4 text-xs text-text-tertiary">
            <span>18 分鐘閱讀</span>
            <span>·</span>
            <span>2.4K 瀏覽</span>
            <span>·</span>
            <span>86 讚</span>
          </div>
        </div>
      </div>
    </article>
  </section>

  <!-- Article List -->
  <section class="max-w-6xl mx-auto px-6 pb-20">
    <div class="text-xs text-text-tertiary font-mono mb-4 uppercase tracking-wider">最新文章</div>
    <div id="articleList" class="border border-border rounded-xl overflow-hidden divide-y divide-border">

      <article class="article-row p-5 cursor-pointer" data-tags="typescript" onclick="showArticle(1)">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 text-[10px] font-mono bg-yellow-500/10 text-yellow-400 rounded">TypeScript</span>
            </div>
            <h3 class="font-semibold text-text text-sm mb-1.5 hover:text-accent transition-colors">TypeScript 5.4 的 NoInfer：終於解決了泛型推斷的痛點</h3>
            <p class="text-xs text-text-secondary line-clamp-2">新的 NoInfer 工具型別讓你精確控制泛型推斷的方向。不再被 TypeScript 的「好心推斷」搞到崩潰。</p>
          </div>
          <div class="text-right flex-shrink-0 hidden sm:block">
            <div class="text-xs text-text-tertiary">02/06</div>
            <div class="text-xs text-text-tertiary mt-1">10 min</div>
          </div>
        </div>
      </article>

      <article class="article-row p-5 cursor-pointer" data-tags="nextjs,react" onclick="showArticle(2)">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 text-[10px] font-mono bg-purple-500/10 text-purple-400 rounded">Next.js</span>
              <span class="px-2 py-0.5 text-[10px] font-mono bg-cyan-500/10 text-cyan-400 rounded">React</span>
            </div>
            <h3 class="font-semibold text-text text-sm mb-1.5 hover:text-accent transition-colors">Next.js App Router 的快取策略：你可能搞錯了</h3>
            <p class="text-xs text-text-secondary line-clamp-2">App Router 有四層快取機制。大多數人只知道其中一層，然後在 production 被其他三層搞到懷疑人生。</p>
          </div>
          <div class="text-right flex-shrink-0 hidden sm:block">
            <div class="text-xs text-text-tertiary">01/28</div>
            <div class="text-xs text-text-tertiary mt-1">14 min</div>
          </div>
        </div>
      </article>

      <article class="article-row p-5 cursor-pointer" data-tags="css" onclick="showArticle(3)">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 text-[10px] font-mono bg-pink-500/10 text-pink-400 rounded">CSS</span>
            </div>
            <h3 class="font-semibold text-text text-sm mb-1.5 hover:text-accent transition-colors">CSS Container Queries 實戰：組件級響應式設計</h3>
            <p class="text-xs text-text-secondary line-clamp-2">Media Queries 是頁面級的，Container Queries 是組件級的。這個差異改變了我們思考響應式設計的方式。</p>
          </div>
          <div class="text-right flex-shrink-0 hidden sm:block">
            <div class="text-xs text-text-tertiary">01/20</div>
            <div class="text-xs text-text-tertiary mt-1">8 min</div>
          </div>
        </div>
      </article>

      <article class="article-row p-5 cursor-pointer" data-tags="system" onclick="showArticle(4)">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 rounded">系統設計</span>
            </div>
            <h3 class="font-semibold text-text text-sm mb-1.5 hover:text-accent transition-colors">從 WebSocket 到 SSE：即時通訊方案選擇指南</h3>
            <p class="text-xs text-text-secondary line-clamp-2">不是所有「即時」都需要 WebSocket。根據你的場景選擇合適的方案，可能省下 80% 的複雜度。</p>
          </div>
          <div class="text-right flex-shrink-0 hidden sm:block">
            <div class="text-xs text-text-tertiary">01/12</div>
            <div class="text-xs text-text-tertiary mt-1">12 min</div>
          </div>
        </div>
      </article>

      <article class="article-row p-5 cursor-pointer" data-tags="tooling" onclick="showArticle(5)">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 text-[10px] font-mono bg-orange-500/10 text-orange-400 rounded">工具</span>
            </div>
            <h3 class="font-semibold text-text text-sm mb-1.5 hover:text-accent transition-colors">Biome vs ESLint + Prettier：2026 年的 Linter 之爭</h3>
            <p class="text-xs text-text-secondary line-clamp-2">在三個真實專案中實測 Biome。速度確實快了 35 倍，但「快」不是唯一該考慮的事。</p>
          </div>
          <div class="text-right flex-shrink-0 hidden sm:block">
            <div class="text-xs text-text-tertiary">01/05</div>
            <div class="text-xs text-text-tertiary mt-1">11 min</div>
          </div>
        </div>
      </article>

      <article class="article-row p-5 cursor-pointer" data-tags="career" onclick="showArticle(6)">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 text-[10px] font-mono bg-blue-500/10 text-blue-400 rounded">職涯</span>
            </div>
            <h3 class="font-semibold text-text text-sm mb-1.5 hover:text-accent transition-colors">寫了五年程式後，我對「資深工程師」的重新定義</h3>
            <p class="text-xs text-text-secondary line-clamp-2">資深不是寫更多程式碼，而是知道什麼時候不應該寫。技術深度很重要，但判斷力更重要。</p>
          </div>
          <div class="text-right flex-shrink-0 hidden sm:block">
            <div class="text-xs text-text-tertiary">12/28</div>
            <div class="text-xs text-text-tertiary mt-1">9 min</div>
          </div>
        </div>
      </article>

    </div>

    <div class="text-center pt-6">
      <button onclick="handleAction('載入更多文章')" class="text-xs font-mono text-text-tertiary hover:text-accent border border-border hover:border-accent px-5 py-2 rounded-lg transition-all">
        LOAD MORE →
      </button>
    </div>
  </section>
</div>

<!-- ARTICLE DETAIL PAGE -->
<div id="page-article" class="page">
  <div class="max-w-6xl mx-auto px-6 pt-8 pb-20">
    <div class="flex gap-8">
      <!-- Main Content -->
      <div class="flex-1 min-w-0 max-w-3xl">
        <!-- Back -->
        <a onclick="showPage('home')" class="cursor-pointer text-xs font-mono text-text-tertiary hover:text-accent transition-colors inline-flex items-center gap-1 mb-8">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
          cd ..
        </a>

        <!-- Article Header -->
        <div id="articleHeader" class="mb-10"></div>

        <!-- Article Body -->
        <div id="articleBody" class="prose"></div>

        <!-- Article Footer -->
        <div class="border-t border-border mt-12 pt-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3" id="articleTagsFooter"></div>
            <div class="flex items-center gap-3">
              <button onclick="handleAction('複製連結')" class="text-text-tertiary hover:text-accent transition-colors p-2 rounded-md hover:bg-elevated">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
              </button>
              <button onclick="handleAction('分享到 Twitter')" class="text-text-tertiary hover:text-accent transition-colors p-2 rounded-md hover:bg-elevated">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Author -->
        <div class="border border-border rounded-xl p-5 mt-6 flex items-start gap-4">
          <div class="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
            <span class="text-lg">☕</span>
          </div>
          <div>
            <div class="font-semibold text-sm text-text">林彥廷 Yan</div>
            <p class="text-xs text-text-secondary mt-1">前端工程師 @ 某科技公司。寫 React，喝手沖，偶爾打桌球。相信好的程式碼應該像好的文章一樣容易讀。</p>
          </div>
        </div>
      </div>

      <!-- TOC Sidebar -->
      <aside class="hidden lg:block w-56 flex-shrink-0">
        <div class="sticky top-20">
          <div class="text-[10px] font-mono text-text-tertiary uppercase tracking-wider mb-3">目錄</div>
          <nav id="tocNav" class="space-y-0.5 text-xs">
            <!-- Populated by JS -->
          </nav>
          <!-- Reading progress -->
          <div class="mt-6 pt-4 border-t border-border">
            <div class="text-[10px] font-mono text-text-tertiary mb-2">閱讀進度</div>
            <div class="w-full h-1 bg-elevated rounded-full overflow-hidden">
              <div id="readProgress" class="h-full bg-accent rounded-full transition-all duration-200" style="width: 0%"></div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</div>

<!-- ABOUT PAGE -->
<div id="page-about" class="page">
  <div class="max-w-3xl mx-auto px-6 pt-12 pb-20">
    <a onclick="showPage('home')" class="cursor-pointer text-xs font-mono text-text-tertiary hover:text-accent transition-colors inline-flex items-center gap-1 mb-8">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
      cd ..
    </a>

    <div class="flex items-start gap-6 mb-10 fade-up">
      <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-accent/30 to-purple-500/20 flex items-center justify-center flex-shrink-0">
        <span class="text-2xl">☕</span>
      </div>
      <div>
        <h1 class="text-xl font-semibold text-text mb-1">林彥廷 Yan</h1>
        <p class="text-sm text-text-secondary">前端工程師 · 技術寫作者 · 咖啡愛好者</p>
      </div>
    </div>

    <div class="prose fade-up">
      <p>嗨，我是彥廷。在台北的某科技公司寫前端，主要用 React + TypeScript。工作第五年，終於搞清楚「資深」不是年資的問題。</p>
      <p>這個部落格記錄我在開發過程中的學習心得。我相信最好的學習方式是把東西寫下來——如果你沒辦法用文字解釋清楚，表示你其實還沒完全理解。</p>
    </div>

    <!-- Tech stack -->
    <div class="mt-10 border border-border rounded-xl overflow-hidden fade-up">
      <div class="code-header">
        <div class="code-dots">
          <span style="background:#ff5f57"></span>
          <span style="background:#febc2e"></span>
          <span style="background:#28c840"></span>
        </div>
        <span>about.ts</span>
      </div>
      <div class="code-content font-mono text-sm leading-relaxed">
        <div><span class="syn-keyword">const</span> <span class="syn-func">techStack</span> <span class="syn-punct">=</span> <span class="syn-punct">{</span></div>
        <div>&nbsp;&nbsp;<span class="syn-attr">frontend</span><span class="syn-punct">:</span> <span class="syn-punct">[</span><span class="syn-string">'React'</span><span class="syn-punct">,</span> <span class="syn-string">'Next.js'</span><span class="syn-punct">,</span> <span class="syn-string">'TypeScript'</span><span class="syn-punct">,</span> <span class="syn-string">'Tailwind'</span><span class="syn-punct">],</span></div>
        <div>&nbsp;&nbsp;<span class="syn-attr">backend</span><span class="syn-punct">:</span> <span class="syn-punct">[</span><span class="syn-string">'Node.js'</span><span class="syn-punct">,</span> <span class="syn-string">'Express'</span><span class="syn-punct">,</span> <span class="syn-string">'PostgreSQL'</span><span class="syn-punct">],</span></div>
        <div>&nbsp;&nbsp;<span class="syn-attr">tools</span><span class="syn-punct">:</span> <span class="syn-punct">[</span><span class="syn-string">'Neovim'</span><span class="syn-punct">,</span> <span class="syn-string">'Warp'</span><span class="syn-punct">,</span> <span class="syn-string">'Figma'</span><span class="syn-punct">,</span> <span class="syn-string">'Linear'</span><span class="syn-punct">],</span></div>
        <div>&nbsp;&nbsp;<span class="syn-attr">coffee</span><span class="syn-punct">:</span> <span class="syn-string">'衣索比亞 耶加雪菲 淺焙'</span><span class="syn-punct">,</span></div>
        <div>&nbsp;&nbsp;<span class="syn-attr">cupsPerDay</span><span class="syn-punct">:</span> <span class="syn-num">3</span><span class="syn-punct">,</span></div>
        <div><span class="syn-punct">}</span></div>
      </div>
    </div>

    <div class="mt-10 grid grid-cols-3 gap-4 fade-up">
      <div class="border border-border rounded-lg p-4 text-center">
        <div class="text-xl font-semibold text-text">86</div>
        <div class="text-xs text-text-tertiary mt-1">篇文章</div>
      </div>
      <div class="border border-border rounded-lg p-4 text-center">
        <div class="text-xl font-semibold text-text">45K</div>
        <div class="text-xs text-text-tertiary mt-1">總瀏覽</div>
      </div>
      <div class="border border-border rounded-lg p-4 text-center">
        <div class="text-xl font-semibold text-text">1.8K</div>
        <div class="text-xs text-text-tertiary mt-1">訂閱者</div>
      </div>
    </div>

    <div class="mt-8 pt-6 border-t border-border fade-up">
      <p class="text-xs text-text-tertiary mb-3 font-mono">// 聯繫方式</p>
      <div class="flex items-center gap-4">
        <a onclick="handleAction('GitHub')" class="cursor-pointer text-xs text-text-secondary hover:text-accent transition-colors">GitHub</a>
        <a onclick="handleAction('Twitter')" class="cursor-pointer text-xs text-text-secondary hover:text-accent transition-colors">Twitter</a>
        <a onclick="handleAction('Email')" class="cursor-pointer text-xs text-text-secondary hover:text-accent transition-colors">Email</a>
        <a onclick="handleAction('RSS')" class="cursor-pointer text-xs text-text-secondary hover:text-accent transition-colors">RSS</a>
      </div>
    </div>
  </div>
</div>

<!-- Footer -->
<footer class="border-t border-border">
  <div class="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
    <div class="flex items-center gap-2">
      <span class="font-mono text-xs text-text-tertiary">&lt;/&gt;</span>
      <span class="text-xs text-text-tertiary">Code & Coffee © 2024-2026</span>
    </div>
    <div class="flex items-center gap-4">
      <a onclick="handleAction('RSS')" class="cursor-pointer text-xs text-text-tertiary hover:text-accent transition-colors">RSS</a>
      <a onclick="handleAction('GitHub')" class="cursor-pointer text-xs text-text-tertiary hover:text-accent transition-colors">GitHub</a>
      <a onclick="handleAction('Twitter')" class="cursor-pointer text-xs text-text-tertiary hover:text-accent transition-colors">Twitter</a>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-elevated border border-border text-text px-5 py-3 rounded-lg text-xs font-mono shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-50 max-w-sm text-center"></div>

<script>
// Articles data with full content
const articles = [
  {
    title: 'React Server Components 完全指南：從概念到實戰',
    date: '2026/02/12',
    readTime: '18 分鐘閱讀',
    views: '2.4K',
    likes: 86,
    tags: ['React', 'TypeScript'],
    tagColors: ['cyan', 'yellow'],
    toc: ['什麼是 Server Components', '渲染模型的根本差異', 'Client 與 Server 的邊界', '資料流設計模式', '效能考量', '遷移策略'],
    body: `
      <p>React Server Components（RSC）不只是 React 的一個新功能——它重新定義了我們思考 React 應用架構的方式。如果你還在用「這只是 SSR 的升級版」來理解它，那你可能會在實際使用時踩到很多坑。</p>

      <h2 id="toc-0">什麼是 Server Components</h2>
      <p>簡單來說：Server Components 是只在伺服器上執行的 React 組件。它們永遠不會被送到客戶端，所以可以直接存取資料庫、讀取檔案系統、使用伺服器端的 API。</p>

      <div class="code-block my-6">
        <div class="code-header">
          <div class="code-dots">
            <span style="background:#ff5f57"></span>
            <span style="background:#febc2e"></span>
            <span style="background:#28c840"></span>
          </div>
          <span>UserProfile.tsx (Server Component)</span>
        </div>
        <div class="code-content">
<span class="syn-comment">// 這個組件只在伺服器上執行</span>
<span class="syn-comment">// 不需要 'use client'，不需要 useEffect，不需要 loading state</span>
<span class="syn-keyword">async</span> <span class="syn-keyword">function</span> <span class="syn-func">UserProfile</span><span class="syn-punct">({</span> <span class="syn-attr">userId</span> <span class="syn-punct">}: {</span> <span class="syn-attr">userId</span><span class="syn-punct">:</span> <span class="syn-type">string</span> <span class="syn-punct">}) {</span>
  <span class="syn-keyword">const</span> user <span class="syn-punct">=</span> <span class="syn-keyword">await</span> <span class="syn-func">db</span><span class="syn-punct">.</span><span class="syn-func">query</span><span class="syn-punct">(</span><span class="syn-string">'SELECT * FROM users WHERE id = $1'</span><span class="syn-punct">,</span> <span class="syn-punct">[</span>userId<span class="syn-punct">])</span>

  <span class="syn-keyword">return</span> <span class="syn-punct">(</span>
    <span class="syn-punct">&lt;</span><span class="syn-tag">div</span><span class="syn-punct">&gt;</span>
      <span class="syn-punct">&lt;</span><span class="syn-tag">h1</span><span class="syn-punct">&gt;{</span>user<span class="syn-punct">.</span>name<span class="syn-punct">}&lt;/</span><span class="syn-tag">h1</span><span class="syn-punct">&gt;</span>
      <span class="syn-punct">&lt;</span><span class="syn-tag">p</span><span class="syn-punct">&gt;{</span>user<span class="syn-punct">.</span>email<span class="syn-punct">}&lt;/</span><span class="syn-tag">p</span><span class="syn-punct">&gt;</span>
    <span class="syn-punct">&lt;/</span><span class="syn-tag">div</span><span class="syn-punct">&gt;</span>
  <span class="syn-punct">)</span>
<span class="syn-punct">}</span>
        </div>
      </div>

      <h2 id="toc-1">渲染模型的根本差異</h2>
      <p>傳統的 React SSR 流程是：伺服器渲染 HTML → 客戶端下載 JS → Hydration → 互動。整個組件樹最終都要在客戶端重新執行一遍。</p>
      <p>RSC 的流程是：伺服器渲染 Server Components → 序列化結果 → 客戶端只渲染 Client Components。Server Components 的程式碼永遠不會出現在 bundle 裡。</p>

      <blockquote>這意味著：你的 Server Component 可以 import 一個 50KB 的 Markdown 解析庫，但客戶端的 bundle size 完全不受影響。</blockquote>

      <h2 id="toc-2">Client 與 Server 的邊界</h2>
      <p>最重要的概念：<code>'use client'</code> 不是在標記「這是一個 Client Component」，而是在標記「這裡是 Server 和 Client 的邊界」。邊界以下的所有組件都會成為 Client Components。</p>

      <h2 id="toc-3">資料流設計模式</h2>
      <p>RSC 的資料流是單向的：Server → Client。Server Components 可以把資料透過 props 傳給 Client Components，但反過來不行。這迫使你重新思考應用的資料架構。</p>

      <ul>
        <li><strong>Pattern 1：Server Component 做資料獲取</strong>，Client Component 做互動</li>
        <li><strong>Pattern 2：Composition Pattern</strong> — 用 children prop 在 Server 和 Client 之間穿插</li>
        <li><strong>Pattern 3：Server Actions</strong> — Client 透過 form action 或 useTransition 回傳資料</li>
      </ul>

      <h2 id="toc-4">效能考量</h2>
      <p>RSC 不是銀彈。如果你的頁面需要大量即時互動（比如 Figma 這種），把組件放在伺服器上反而會增加延遲。選擇的關鍵是：<strong>這個組件的「計算」和「互動」分別有多少？</strong></p>

      <h2 id="toc-5">遷移策略</h2>
      <p>如果你有一個現有的 React 應用想遷移到 RSC，建議從「葉子節點」開始。先把那些純展示、不需要互動的組件改成 Server Components。不要試圖一次性重構整個應用。</p>
      <p>記住：最好的遷移策略，是讓使用者完全感覺不到你在遷移。</p>
    `
  },
  {
    title: 'TypeScript 5.4 的 NoInfer：終於解決了泛型推斷的痛點',
    date: '2026/02/06', readTime: '10 分鐘閱讀', views: '1.8K', likes: 62,
    tags: ['TypeScript'], tagColors: ['yellow'],
    toc: ['問題場景', 'NoInfer 怎麼用', '實際範例', '注意事項'],
    body: `<p>如果你寫過複雜的 TypeScript 泛型函數，你一定遇過這個問題：TypeScript 的型別推斷太「聰明」了，聰明到會從錯誤的位置推斷出你不想要的型別。</p>
      <h2 id="toc-0">問題場景</h2>
      <p>假設你有一個函數，接受一個泛型 <code>T</code> 和一個型別為 <code>T</code> 的預設值：</p>
      <div class="code-block my-6"><div class="code-header"><div class="code-dots"><span style="background:#ff5f57"></span><span style="background:#febc2e"></span><span style="background:#28c840"></span></div><span>example.ts</span></div><div class="code-content">
<span class="syn-keyword">function</span> <span class="syn-func">createState</span><span class="syn-punct">&lt;</span><span class="syn-type">T</span><span class="syn-punct">&gt;(</span><span class="syn-attr">initial</span><span class="syn-punct">:</span> <span class="syn-type">T</span><span class="syn-punct">,</span> <span class="syn-attr">fallback</span><span class="syn-punct">:</span> <span class="syn-type">T</span><span class="syn-punct">):</span> <span class="syn-type">T</span> <span class="syn-punct">{</span>
  <span class="syn-keyword">return</span> initial <span class="syn-punct">??</span> fallback
<span class="syn-punct">}</span>

<span class="syn-comment">// 你期望 T 是 'a' | 'b'</span>
<span class="syn-comment">// 但 TS 從 fallback 推斷出 T = 'a' | 'b' | 'c'</span>
<span class="syn-func">createState</span><span class="syn-punct">&lt;</span><span class="syn-string">'a'</span> <span class="syn-punct">|</span> <span class="syn-string">'b'</span><span class="syn-punct">&gt;(</span><span class="syn-string">'a'</span><span class="syn-punct">,</span> <span class="syn-string">'c'</span><span class="syn-punct">)</span> <span class="syn-comment">// 不報錯！但應該報錯</span>
      </div></div>
      <h2 id="toc-1">NoInfer 怎麼用</h2>
      <p>TypeScript 5.4 新增的 <code>NoInfer&lt;T&gt;</code> 工具型別，讓你可以告訴編譯器：「不要從這個位置推斷 T」。</p>
      <div class="code-block my-6"><div class="code-header"><div class="code-dots"><span style="background:#ff5f57"></span><span style="background:#febc2e"></span><span style="background:#28c840"></span></div><span>fixed.ts</span></div><div class="code-content">
<span class="syn-keyword">function</span> <span class="syn-func">createState</span><span class="syn-punct">&lt;</span><span class="syn-type">T</span><span class="syn-punct">&gt;(</span><span class="syn-attr">initial</span><span class="syn-punct">:</span> <span class="syn-type">T</span><span class="syn-punct">,</span> <span class="syn-attr">fallback</span><span class="syn-punct">:</span> <span class="syn-type">NoInfer</span><span class="syn-punct">&lt;</span><span class="syn-type">T</span><span class="syn-punct">&gt;):</span> <span class="syn-type">T</span> <span class="syn-punct">{</span>
  <span class="syn-keyword">return</span> initial <span class="syn-punct">??</span> fallback
<span class="syn-punct">}</span>

<span class="syn-func">createState</span><span class="syn-punct">&lt;</span><span class="syn-string">'a'</span> <span class="syn-punct">|</span> <span class="syn-string">'b'</span><span class="syn-punct">&gt;(</span><span class="syn-string">'a'</span><span class="syn-punct">,</span> <span class="syn-string">'c'</span><span class="syn-punct">)</span> <span class="syn-comment">// Error! 'c' 不在 'a' | 'b' 裡</span>
      </div></div>
      <h2 id="toc-2">實際範例</h2>
      <p>這在設計 React Hook 時特別有用。例如 <code>useReducer</code> 的 dispatch 型別推斷，以及 API 回應的型別驗證。</p>
      <h2 id="toc-3">注意事項</h2>
      <p><code>NoInfer</code> 不會改變執行時行為，它只是一個型別層面的提示。而且不要過度使用——只在你確定推斷方向有問題時才加。</p>`
  },
  {
    title: 'Next.js App Router 的快取策略：你可能搞錯了',
    date: '2026/01/28', readTime: '14 分鐘閱讀', views: '3.1K', likes: 95,
    tags: ['Next.js', 'React'], tagColors: ['purple', 'cyan'],
    toc: ['四層快取', 'Request Memoization', 'Data Cache', 'Full Route Cache', '踩坑經驗'],
    body: `<p>App Router 有四層快取機制。大多數人只知道其中一層（<code>fetch</code> 的 cache 選項），然後在 production 環境被其他三層搞到懷疑人生。</p>
      <h2 id="toc-0">四層快取</h2>
      <ol><li><strong>Request Memoization</strong>：同一個 render pass 內去重</li><li><strong>Data Cache</strong>：<code>fetch</code> 結果的持久化快取</li><li><strong>Full Route Cache</strong>：整個頁面的 HTML/RSC Payload 快取</li><li><strong>Router Cache</strong>：客戶端的路由快取</li></ol>
      <h2 id="toc-1">Request Memoization</h2>
      <p>如果同一個 render 中多個 Server Component 都呼叫相同的 <code>fetch</code>，React 會自動去重。這是好事，但前提是 URL 和選項完全一致。</p>
      <h2 id="toc-2">Data Cache</h2>
      <p>Next.js 會把 <code>fetch</code> 的結果快取到 Data Cache 中。注意：<code>force-cache</code> 是預設行為！如果你想要每次都重新抓資料，必須明確指定 <code>no-store</code>。</p>
      <h2 id="toc-3">Full Route Cache</h2>
      <p>靜態頁面在 build time 就會被完整快取。動態頁面則在第一次請求時快取。要判斷你的頁面是靜態還是動態，看的是組件裡有沒有使用動態 API（<code>cookies()</code>、<code>headers()</code>）。</p>
      <h2 id="toc-4">踩坑經驗</h2>
      <blockquote>在 development 模式下，快取行為和 production 完全不同。很多 bug 是因為在本地測試時「看起來正常」，部署後才爆發。</blockquote>
      <p>我的建議：開發時就把 <code>next.config.js</code> 裡的快取設定和 production 對齊。痛苦一次，勝過每次部署後 debug。</p>`
  },
  {
    title: 'CSS Container Queries 實戰：組件級響應式設計',
    date: '2026/01/20', readTime: '8 分鐘閱讀', views: '1.2K', likes: 43,
    tags: ['CSS'], tagColors: ['pink'],
    toc: ['為什麼需要 Container Queries', '基本用法', '實際案例', '瀏覽器支援'],
    body: `<p>Media Queries 看的是整個 viewport。但組件不在乎 viewport 有多寬，它只在乎自己的容器有多寬。</p>
      <h2 id="toc-0">為什麼需要 Container Queries</h2>
      <p>想像一個卡片組件：在側邊欄裡要垂直排列，在主內容區要水平排列。用 Media Queries 做不到——因為側邊欄和主內容區的寬度和 viewport 無關。</p>
      <h2 id="toc-1">基本用法</h2>
      <div class="code-block my-6"><div class="code-header"><div class="code-dots"><span style="background:#ff5f57"></span><span style="background:#febc2e"></span><span style="background:#28c840"></span></div><span>card.css</span></div><div class="code-content">
<span class="syn-comment">/* 定義容器 */</span>
<span class="syn-tag">.card-wrapper</span> <span class="syn-punct">{</span>
  <span class="syn-attr">container-type</span><span class="syn-punct">:</span> <span class="syn-string">inline-size</span><span class="syn-punct">;</span>
  <span class="syn-attr">container-name</span><span class="syn-punct">:</span> <span class="syn-string">card</span><span class="syn-punct">;</span>
<span class="syn-punct">}</span>

<span class="syn-comment">/* 根據容器寬度調整 */</span>
<span class="syn-keyword">@container</span> card <span class="syn-punct">(</span><span class="syn-attr">min-width</span><span class="syn-punct">:</span> <span class="syn-num">400px</span><span class="syn-punct">)</span> <span class="syn-punct">{</span>
  <span class="syn-tag">.card</span> <span class="syn-punct">{</span>
    <span class="syn-attr">display</span><span class="syn-punct">:</span> <span class="syn-string">flex</span><span class="syn-punct">;</span>
    <span class="syn-attr">flex-direction</span><span class="syn-punct">:</span> <span class="syn-string">row</span><span class="syn-punct">;</span>
  <span class="syn-punct">}</span>
<span class="syn-punct">}</span>
      </div></div>
      <h2 id="toc-2">實際案例</h2>
      <p>我在最近的專案中把所有的 dashboard widget 都改用了 Container Queries。效果是：同一個組件可以無縫適配 1/4、1/3、1/2、full-width 四種佈局，零額外 CSS。</p>
      <h2 id="toc-3">瀏覽器支援</h2>
      <p>截至 2026 年，所有主流瀏覽器都已支援。Safari 15.4+ 也沒問題。可以放心在 production 使用了。</p>`
  },
  {
    title: '從 WebSocket 到 SSE：即時通訊方案選擇指南',
    date: '2026/01/12', readTime: '12 分鐘閱讀', views: '2.0K', likes: 71,
    tags: ['系統設計'], tagColors: ['emerald'],
    toc: ['選擇矩陣', 'WebSocket 適用場景', 'SSE 適用場景', 'Long Polling 還活著', '結論'],
    body: `<p>「即時」有很多種：聊天室的即時、股票報價的即時、通知的即時。它們對「延遲」和「雙向性」的要求完全不同。</p>
      <h2 id="toc-0">選擇矩陣</h2>
      <ul><li><strong>雙向 + 低延遲</strong>：WebSocket（聊天、協作編輯、遊戲）</li><li><strong>單向 + 低延遲</strong>：SSE（通知、即時更新、AI 串流）</li><li><strong>單向 + 可接受延遲</strong>：Long Polling（相容性要求高的場景）</li></ul>
      <h2 id="toc-1">WebSocket 適用場景</h2>
      <p>WebSocket 是全雙工的，建立連線後，客戶端和伺服器可以隨時互相發送資料。但維護成本高：需要心跳、重連、狀態同步。</p>
      <h2 id="toc-2">SSE 適用場景</h2>
      <p>如果你只需要伺服器推送到客戶端（這涵蓋了 80% 的「即時」需求），SSE 是更簡單的選擇。它基於 HTTP，天然支援重連和事件 ID。</p>
      <blockquote>OpenAI 的 streaming API 用的就是 SSE，不是 WebSocket。如果 GPT-4 的串流回應不需要 WebSocket，你的通知系統大概也不需要。</blockquote>
      <h2 id="toc-3">Long Polling 還活著</h2>
      <p>是的，2026 年了 Long Polling 還是有用武之地。特別是在需要穿越企業防火牆或不支援 WebSocket 的環境中。</p>
      <h2 id="toc-4">結論</h2>
      <p>不要因為 WebSocket 看起來更「專業」就選它。選擇最簡單的能滿足需求的方案，永遠是正確的工程決策。</p>`
  },
  {
    title: 'Biome vs ESLint + Prettier：2026 年的 Linter 之爭',
    date: '2026/01/05', readTime: '11 分鐘閱讀', views: '1.5K', likes: 54,
    tags: ['工具'], tagColors: ['orange'],
    toc: ['效能實測', '規則覆蓋率', '遷移成本', '結論'],
    body: `<p>Biome（前身是 Rome）在 2025 年底發布了 2.0，終於支援了插件系統。我在三個真實專案中做了實測。</p>
      <h2 id="toc-0">效能實測</h2>
      <p>在一個 2000 個檔案的 monorepo 中：ESLint + Prettier 需要 28 秒，Biome 只需要 0.8 秒。35 倍的差距。但這個差距在 CI 中比在本地更重要——因為本地通常只 lint 改動的檔案。</p>
      <h2 id="toc-1">規則覆蓋率</h2>
      <p>Biome 2.0 覆蓋了 ESLint 核心規則的 ~90%，但 eslint-plugin-react、eslint-plugin-import 等第三方套件的覆蓋率只有 ~60%。如果你重度依賴這些套件，遷移會有陣痛。</p>
      <h2 id="toc-2">遷移成本</h2>
      <p>Biome 提供了 <code>biome migrate eslint</code> 指令，可以自動轉換大部分規則。但總有 10-20% 需要手動調整。在大型專案中，這意味著幾天的工作量。</p>
      <h2 id="toc-3">結論</h2>
      <p>新專案？用 Biome。現有專案？看你的痛點。如果 CI 時間是瓶頸，值得遷移。如果現有設定已經穩定，暫時不需要為了追新而換。</p>`
  },
  {
    title: '寫了五年程式後，我對「資深工程師」的重新定義',
    date: '2025/12/28', readTime: '9 分鐘閱讀', views: '4.2K', likes: 128,
    tags: ['職涯'], tagColors: ['blue'],
    toc: ['技術深度的天花板', '判斷力', '教學能力', '我的定義'],
    body: `<p>五年前我覺得「資深」就是知道更多框架、寫更複雜的程式碼。現在回頭看，那個想法大概只對了 30%。</p>
      <h2 id="toc-0">技術深度的天花板</h2>
      <p>技術深度很重要。你需要理解底層原理，才能在遇到奇怪 bug 時快速定位。但技術深度有天花板——到了某個程度後，更深的知識帶來的邊際效益會急劇下降。</p>
      <h2 id="toc-1">判斷力</h2>
      <p>什麼時候該重構、什麼時候該忍耐技術債。什麼需求值得花三天做到完美、什麼需求用 hack 搞定就好。這些決策能力，才是資深工程師最核心的價值。</p>
      <blockquote>Junior 知道怎麼寫程式。Senior 知道什麼時候不應該寫程式。</blockquote>
      <h2 id="toc-2">教學能力</h2>
      <p>如果你寫了一段很精妙的程式碼，但團隊裡沒有第二個人看得懂，那這段程式碼就是負債，不是資產。資深工程師的職責包括把知識傳遞出去。</p>
      <h2 id="toc-3">我的定義</h2>
      <p>資深工程師 = 技術深度 × 判斷力 × 影響力。三者缺一不可。純技術高手不是資深工程師，那叫「專家」——很有價值，但不一樣。</p>`
  }
];

// State
let currentTheme = 'dark';

// Theme toggle
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  document.getElementById('themeIconDark').classList.toggle('hidden', currentTheme === 'light');
  document.getElementById('themeIconLight').classList.toggle('hidden', currentTheme === 'dark');
}

// Page navigation
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0 });
    setTimeout(() => {
      target.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    }, 100);
  }
}

// Show article
function showArticle(index) {
  const a = articles[index];
  if (!a) return;

  const tagHTML = a.tags.map((t, i) => {
    const c = a.tagColors[i] || 'cyan';
    return '<span class="px-2 py-0.5 text-[10px] font-mono bg-' + c + '-500/10 text-' + c + '-400 rounded">' + t + '</span>';
  }).join('');

  document.getElementById('articleHeader').innerHTML = `
    <div class="flex items-center gap-2 mb-3">${tagHTML}</div>
    <h1 class="text-2xl font-semibold text-text leading-snug mb-4">${a.title}</h1>
    <div class="flex items-center gap-4 text-xs text-text-tertiary">
      <span>${a.date}</span><span>·</span><span>${a.readTime}</span><span>·</span><span>${a.views} 瀏覽</span><span>·</span><span>${a.likes} 讚</span>
    </div>
  `;
  document.getElementById('articleBody').innerHTML = a.body;
  document.getElementById('articleTagsFooter').innerHTML = a.tags.map((t, i) => {
    const c = a.tagColors[i] || 'cyan';
    return '<span class="px-2 py-0.5 text-[10px] font-mono bg-' + c + '-500/10 text-' + c + '-400 rounded">' + t + '</span>';
  }).join('');

  // Build TOC
  if (a.toc) {
    document.getElementById('tocNav').innerHTML = a.toc.map((t, i) =>
      '<a href="#toc-' + i + '" class="toc-link block px-3 py-1.5 text-text-secondary hover:text-accent rounded-r" data-toc="' + i + '">' + t + '</a>'
    ).join('');
  }

  showPage('article');
}

// Tag filter
function filterTag(tag) {
  document.querySelectorAll('#tagFilters .tag-pill').forEach(btn => {
    const isActive = btn.dataset.tag === tag;
    btn.classList.toggle('border-accent', isActive);
    btn.classList.toggle('bg-accent/10', isActive);
    btn.classList.toggle('text-accent', isActive);
    btn.classList.toggle('border-border', !isActive);
    btn.classList.toggle('text-text-secondary', !isActive);
  });

  document.querySelectorAll('#articleList .article-row').forEach(row => {
    if (tag === 'all') {
      row.style.display = 'block';
    } else {
      const tags = row.dataset.tags.split(',');
      row.style.display = tags.includes(tag) ? 'block' : 'none';
    }
  });

  // Also show/hide featured
  const featured = document.querySelector('[data-tags="react,typescript"]');
  if (featured) {
    if (tag === 'all' || tag === 'react' || tag === 'typescript') {
      featured.closest('section').style.display = 'block';
    } else {
      featured.closest('section').style.display = 'none';
    }
  }
}

// Reading progress
window.addEventListener('scroll', () => {
  const bar = document.getElementById('readProgress');
  if (!bar || !document.getElementById('page-article').classList.contains('active')) return;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
  bar.style.width = Math.min(pct, 100) + '%';
});

// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1'; t.style.transform = 'translate(-50%, 0)';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translate(-50%, 8px)'; }, 2500);
}
function handleAction(a) { showToast(a + ' — 此為模板展示'); }

// Intersection Observer
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
setTimeout(() => { document.querySelectorAll('#page-home .fade-up').forEach(el => el.classList.add('visible')); }, 100);
</script>

</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
