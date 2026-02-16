INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '8bf9e061-b6fd-4df4-8450-14850634eec5',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>kevin.dev — 前端工程師</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        bg: '#0d1117',
        surface: '#161b22',
        border: '#30363d',
        green: { 400:'#3fb950', 500:'#238636' },
        blue: { 400:'#58a6ff' },
        purple: { 400:'#bc8cff' },
        orange: { 400:'#d29922' },
        red: { 400:'#f85149' },
        muted: '#8b949e',
        subtle: '#6e7681'
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Noto Sans TC"', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'JetBrains Mono', 'Noto Sans TC', monospace; color: #c9d1d9; background: #0d1117; }

  .reveal { opacity:0; transform:translateY(20px); transition: all 0.6s cubic-bezier(0.22,1,0.36,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }

  .toast {
    position:fixed; bottom:2rem; right:2rem; background:#238636; color:#fff;
    padding:0.75rem 1.25rem; border-radius:8px; font-size:0.85rem;
    font-family:'JetBrains Mono', monospace;
    z-index:9999; transform:translateY(120%); opacity:0;
    transition: all 0.3s ease;
  }
  .toast.show { transform:translateY(0); opacity:1; }

  .project-card {
    transition: all 0.3s ease;
    border: 1px solid #30363d;
  }
  .project-card:hover {
    border-color: #58a6ff;
    transform: translateY(-2px);
  }

  .skill-bar { transition: width 1.2s cubic-bezier(0.22,1,0.36,1); }

  .timeline-dot {
    width: 12px; height: 12px; border-radius: 50%;
    border: 2px solid #30363d; background: #0d1117;
    transition: all 0.3s ease;
  }
  .timeline-item:hover .timeline-dot {
    border-color: #3fb950; background: #3fb950;
  }

  .typing-cursor {
    animation: blink 1s infinite;
  }
  @keyframes blink {
    0%,100% { opacity:1; }
    50% { opacity:0; }
  }

  .nav-scrolled {
    background: rgba(13,17,23,0.95) !important;
    border-bottom: 1px solid #30363d;
  }

  .contribution-cell {
    width: 10px; height: 10px; border-radius: 2px;
    display: inline-block;
  }

  .tab-btn.active { color: #c9d1d9; border-bottom-color: #f78166; }
</style>
</head>
<body>

<div id="toast" class="toast"></div>

<!-- Nav -->
<nav id="navbar" class="fixed top-0 w-full z-50 bg-transparent transition-all duration-300">
  <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="text-green-400 font-bold text-sm">
      <span class="text-muted">~/</span>kevin<span class="text-blue-400">.dev</span>
    </a>
    <div class="hidden md:flex items-center gap-6">
      <a href="#projects" class="text-xs text-muted hover:text-blue-400 transition-colors">/projects</a>
      <a href="#skills" class="text-xs text-muted hover:text-blue-400 transition-colors">/skills</a>
      <a href="#experience" class="text-xs text-muted hover:text-blue-400 transition-colors">/experience</a>
      <a href="#contact" class="text-xs text-muted hover:text-blue-400 transition-colors">/contact</a>
      <a href="#" class="text-xs text-muted hover:text-white transition-colors flex items-center gap-1.5 border border-border rounded-md px-3 py-1.5 hover:border-muted cursor-pointer">
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        GitHub
      </a>
    </div>
    <button onclick="toggleMobile()" class="md:hidden w-8 h-8 flex items-center justify-center cursor-pointer">
      <svg class="w-5 h-5 text-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div id="mobileMenu" class="hidden md:hidden bg-bg border-t border-border px-6 pb-4">
    <a href="#projects" onclick="closeMobile()" class="block py-2.5 text-sm text-muted">/projects</a>
    <a href="#skills" onclick="closeMobile()" class="block py-2.5 text-sm text-muted">/skills</a>
    <a href="#experience" onclick="closeMobile()" class="block py-2.5 text-sm text-muted">/experience</a>
    <a href="#contact" onclick="closeMobile()" class="block py-2.5 text-sm text-muted">/contact</a>
  </div>
</nav>

<!-- Hero -->
<section class="min-h-screen flex items-center">
  <div class="max-w-5xl mx-auto px-6 pt-24 pb-16 w-full">
    <div class="reveal">
      <!-- Terminal header -->
      <div class="bg-surface border border-border rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <div class="flex gap-1.5">
          <div class="w-3 h-3 rounded-full bg-red-400"></div>
          <div class="w-3 h-3 rounded-full bg-orange-400"></div>
          <div class="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <span class="text-xs text-muted ml-2">kevin@macbook — zsh</span>
      </div>
      <!-- Terminal body -->
      <div class="bg-surface/50 border border-t-0 border-border rounded-b-xl p-6 lg:p-10">
        <div class="text-muted text-sm mb-1">
          <span class="text-green-400">kevin</span>@<span class="text-blue-400">dev</span> <span class="text-purple-400">~</span> $
          <span class="text-white ml-2">whoami</span>
        </div>
        <div class="mt-6 mb-2">
          <h1 class="text-3xl lg:text-5xl font-bold text-white leading-tight">
            Kevin Lin<span class="typing-cursor text-green-400">_</span>
          </h1>
        </div>
        <div class="text-blue-400 text-lg lg:text-xl mb-6">Senior Frontend Engineer</div>
        <p class="text-muted text-sm lg:text-base leading-relaxed max-w-2xl mb-8">
          5 年前端開發經驗，專注 React/Next.js 生態系。熱愛開源、追求效能極致、相信好的 DX 會帶來好的 UX。目前在 Taipei 遠端工作中。
        </p>
        <div class="flex flex-wrap gap-3 mb-8">
          <span class="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full"># open-to-work</span>
          <span class="text-xs bg-blue-400/10 text-blue-400 border border-blue-400/20 px-3 py-1 rounded-full"># react</span>
          <span class="text-xs bg-purple-400/10 text-purple-400 border border-purple-400/20 px-3 py-1 rounded-full"># typescript</span>
          <span class="text-xs bg-orange-400/10 text-orange-400 border border-orange-400/20 px-3 py-1 rounded-full"># next.js</span>
        </div>
        <div class="flex gap-4">
          <button onclick="scrollTo('contact')" class="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer">
            $ contact --me
          </button>
          <button onclick="scrollTo('projects')" class="border border-border hover:border-muted text-muted hover:text-white px-6 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer">
            $ ls projects/
          </button>
        </div>
      </div>
    </div>

    <!-- Contribution graph mini -->
    <div class="mt-10 reveal">
      <div class="text-xs text-subtle mb-3">Contributions in 2025</div>
      <div class="flex gap-0.5 flex-wrap" id="contribGraph"></div>
    </div>
  </div>
</section>

<!-- Projects -->
<section id="projects" class="py-20">
  <div class="max-w-5xl mx-auto px-6">
    <div class="flex items-center gap-3 mb-10 reveal">
      <span class="text-green-400">$</span>
      <h2 class="text-xl font-bold text-white">ls projects/ <span class="text-muted font-normal">--sort=stars</span></h2>
    </div>

    <div class="grid md:grid-cols-2 gap-4 reveal">
      <!-- Project 1 -->
      <div class="project-card bg-surface rounded-xl p-6 cursor-pointer" onclick="showToast('前往 GitHub: flux-ui')">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
            <span class="text-blue-400 font-medium text-sm">flux-ui</span>
          </div>
          <div class="flex items-center gap-3 text-xs text-muted">
            <span class="flex items-center gap-1">⭐ 2.4k</span>
            <span class="flex items-center gap-1">🍴 186</span>
          </div>
        </div>
        <p class="text-muted text-sm mb-4">一套基於 Tailwind CSS 的 React UI 元件庫，支援暗色模式、可自訂主題、完整 TypeScript 型別。</p>
        <div class="flex flex-wrap gap-2">
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/15">React</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/15">TypeScript</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/15">Tailwind</span>
        </div>
      </div>
      <!-- Project 2 -->
      <div class="project-card bg-surface rounded-xl p-6 cursor-pointer" onclick="showToast('前往 GitHub: next-intl-pro')">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
            <span class="text-blue-400 font-medium text-sm">next-intl-pro</span>
          </div>
          <div class="flex items-center gap-3 text-xs text-muted">
            <span class="flex items-center gap-1">⭐ 890</span>
            <span class="flex items-center gap-1">🍴 67</span>
          </div>
        </div>
        <p class="text-muted text-sm mb-4">Next.js App Router 國際化方案，支援 SSG/ISR、自動語系偵測、pluralization。</p>
        <div class="flex flex-wrap gap-2">
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400 border border-purple-400/15">Next.js</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400 border border-purple-400/15">i18n</span>
        </div>
      </div>
      <!-- Project 3 -->
      <div class="project-card bg-surface rounded-xl p-6 cursor-pointer" onclick="showToast('前往 GitHub: use-motion')">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
            <span class="text-blue-400 font-medium text-sm">use-motion</span>
          </div>
          <div class="flex items-center gap-3 text-xs text-muted">
            <span class="flex items-center gap-1">⭐ 560</span>
            <span class="flex items-center gap-1">🍴 42</span>
          </div>
        </div>
        <p class="text-muted text-sm mb-4">輕量 React hooks 動畫庫（2KB gzipped），基於 Web Animations API，零依賴。</p>
        <div class="flex flex-wrap gap-2">
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/15">React</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/15">Animation</span>
        </div>
      </div>
      <!-- Project 4 -->
      <div class="project-card bg-surface rounded-xl p-6 cursor-pointer" onclick="showToast('前往 GitHub: devfolio')">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
            <span class="text-blue-400 font-medium text-sm">devfolio</span>
          </div>
          <div class="flex items-center gap-3 text-xs text-muted">
            <span class="flex items-center gap-1">⭐ 340</span>
            <span class="flex items-center gap-1">🍴 89</span>
          </div>
        </div>
        <p class="text-muted text-sm mb-4">開發者個人網站模板（就是你現在看到的），Terminal 風格 + 自動 GitHub contribution graph。</p>
        <div class="flex flex-wrap gap-2">
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-orange-400/10 text-orange-400 border border-orange-400/15">Next.js</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-orange-400/10 text-orange-400 border border-orange-400/15">MDX</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Skills -->
<section id="skills" class="py-20 border-t border-border">
  <div class="max-w-5xl mx-auto px-6">
    <div class="flex items-center gap-3 mb-10 reveal">
      <span class="text-green-400">$</span>
      <h2 class="text-xl font-bold text-white">cat skills.json</h2>
    </div>
    <div class="grid md:grid-cols-2 gap-8 reveal">
      <div>
        <h3 class="text-sm text-muted mb-6 uppercase tracking-wider">Frontend</h3>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-1.5"><span>React / Next.js</span><span class="text-green-400">95%</span></div>
            <div class="h-1.5 bg-border rounded-full"><div class="skill-bar h-full bg-green-400 rounded-full" style="width:0%" data-width="95"></div></div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1.5"><span>TypeScript</span><span class="text-green-400">92%</span></div>
            <div class="h-1.5 bg-border rounded-full"><div class="skill-bar h-full bg-green-400 rounded-full" style="width:0%" data-width="92"></div></div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1.5"><span>Tailwind CSS</span><span class="text-blue-400">90%</span></div>
            <div class="h-1.5 bg-border rounded-full"><div class="skill-bar h-full bg-blue-400 rounded-full" style="width:0%" data-width="90"></div></div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1.5"><span>Vue.js / Nuxt</span><span class="text-blue-400">75%</span></div>
            <div class="h-1.5 bg-border rounded-full"><div class="skill-bar h-full bg-blue-400 rounded-full" style="width:0%" data-width="75"></div></div>
          </div>
        </div>
      </div>
      <div>
        <h3 class="text-sm text-muted mb-6 uppercase tracking-wider">Backend & Tools</h3>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-1.5"><span>Node.js / Express</span><span class="text-purple-400">85%</span></div>
            <div class="h-1.5 bg-border rounded-full"><div class="skill-bar h-full bg-purple-400 rounded-full" style="width:0%" data-width="85"></div></div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1.5"><span>PostgreSQL / Redis</span><span class="text-purple-400">78%</span></div>
            <div class="h-1.5 bg-border rounded-full"><div class="skill-bar h-full bg-purple-400 rounded-full" style="width:0%" data-width="78"></div></div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1.5"><span>Docker / CI/CD</span><span class="text-orange-400">80%</span></div>
            <div class="h-1.5 bg-border rounded-full"><div class="skill-bar h-full bg-orange-400 rounded-full" style="width:0%" data-width="80"></div></div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1.5"><span>AWS / Vercel</span><span class="text-orange-400">82%</span></div>
            <div class="h-1.5 bg-border rounded-full"><div class="skill-bar h-full bg-orange-400 rounded-full" style="width:0%" data-width="82"></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Experience -->
<section id="experience" class="py-20 border-t border-border">
  <div class="max-w-5xl mx-auto px-6">
    <div class="flex items-center gap-3 mb-10 reveal">
      <span class="text-green-400">$</span>
      <h2 class="text-xl font-bold text-white">git log --oneline <span class="text-muted font-normal">career</span></h2>
    </div>
    <div class="space-y-0 reveal">
      <div class="timeline-item flex gap-6 pb-10 relative cursor-pointer" onclick="showToast('查看 Appier 工作經歷')">
        <div class="flex flex-col items-center">
          <div class="timeline-dot z-10"></div>
          <div class="w-px flex-1 bg-border"></div>
        </div>
        <div class="pb-2">
          <div class="text-xs text-subtle mb-1">2023 — Present</div>
          <h3 class="font-bold text-white">Senior Frontend Engineer</h3>
          <div class="text-blue-400 text-sm mt-0.5">Appier</div>
          <p class="text-muted text-sm mt-2 leading-relaxed">負責 AI 行銷平台前端架構，導入 Next.js App Router、微前端架構。團隊 8 人，mentor 2 位 junior。</p>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span class="text-[10px] px-2 py-0.5 bg-surface border border-border rounded text-muted">React</span>
            <span class="text-[10px] px-2 py-0.5 bg-surface border border-border rounded text-muted">Next.js</span>
            <span class="text-[10px] px-2 py-0.5 bg-surface border border-border rounded text-muted">Module Federation</span>
          </div>
        </div>
      </div>
      <div class="timeline-item flex gap-6 pb-10 relative cursor-pointer" onclick="showToast('查看 PicCollage 工作經歷')">
        <div class="flex flex-col items-center">
          <div class="timeline-dot z-10"></div>
          <div class="w-px flex-1 bg-border"></div>
        </div>
        <div class="pb-2">
          <div class="text-xs text-subtle mb-1">2021 — 2023</div>
          <h3 class="font-bold text-white">Frontend Engineer</h3>
          <div class="text-blue-400 text-sm mt-0.5">PicCollage</div>
          <p class="text-muted text-sm mt-2 leading-relaxed">開發 Web Editor，處理圖片編輯、Canvas 渲染、效能優化。將首屏載入時間從 4.2s 降至 1.8s。</p>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span class="text-[10px] px-2 py-0.5 bg-surface border border-border rounded text-muted">Vue.js</span>
            <span class="text-[10px] px-2 py-0.5 bg-surface border border-border rounded text-muted">Canvas</span>
            <span class="text-[10px] px-2 py-0.5 bg-surface border border-border rounded text-muted">WebGL</span>
          </div>
        </div>
      </div>
      <div class="timeline-item flex gap-6 relative cursor-pointer" onclick="showToast('查看 Freelance 經歷')">
        <div class="flex flex-col items-center">
          <div class="timeline-dot z-10"></div>
        </div>
        <div>
          <div class="text-xs text-subtle mb-1">2019 — 2021</div>
          <h3 class="font-bold text-white">Freelance Developer</h3>
          <div class="text-blue-400 text-sm mt-0.5">自由接案</div>
          <p class="text-muted text-sm mt-2 leading-relaxed">獨立承接 10+ 專案，從官網到 SaaS Dashboard。建立個人品牌，開始維護開源專案。</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-20 border-t border-border">
  <div class="max-w-3xl mx-auto px-6">
    <div class="flex items-center gap-3 mb-10 reveal">
      <span class="text-green-400">$</span>
      <h2 class="text-xl font-bold text-white">mail --to kevin</h2>
    </div>
    <form onsubmit="return handleContact(event)" class="reveal">
      <div class="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-xs text-muted mb-2">name <span class="text-red-400">*</span></label>
          <input type="text" id="cName" required placeholder="你的名字" class="w-full px-4 py-3 rounded-lg bg-surface border border-border text-white placeholder-subtle focus:border-blue-400 outline-none text-sm font-mono">
        </div>
        <div>
          <label class="block text-xs text-muted mb-2">email <span class="text-red-400">*</span></label>
          <input type="email" id="cEmail" required placeholder="email@example.com" class="w-full px-4 py-3 rounded-lg bg-surface border border-border text-white placeholder-subtle focus:border-blue-400 outline-none text-sm font-mono">
        </div>
      </div>
      <div class="mb-4">
        <label class="block text-xs text-muted mb-2">subject</label>
        <input type="text" placeholder="合作洽談 / 全職 / 自由案" class="w-full px-4 py-3 rounded-lg bg-surface border border-border text-white placeholder-subtle focus:border-blue-400 outline-none text-sm font-mono">
      </div>
      <div class="mb-6">
        <label class="block text-xs text-muted mb-2">message <span class="text-red-400">*</span></label>
        <textarea id="cMsg" required rows="4" placeholder="嗨 Kevin，我想跟你聊聊..." class="w-full px-4 py-3 rounded-lg bg-surface border border-border text-white placeholder-subtle focus:border-blue-400 outline-none text-sm font-mono resize-none"></textarea>
      </div>
      <button type="submit" class="w-full bg-green-500 hover:bg-green-400 text-white py-3.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
        $ send --message
      </button>
    </form>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-border py-10">
  <div class="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
    <div class="text-xs text-subtle">
      <span class="text-green-400">kevin</span>@<span class="text-blue-400">dev</span> ~ $ echo "Built with Next.js & deployed on Vercel"
    </div>
    <div class="flex gap-4">
      <a href="#" class="text-muted hover:text-white transition-colors cursor-pointer">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
      </a>
      <a href="#" class="text-muted hover:text-white transition-colors cursor-pointer">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a href="#" class="text-muted hover:text-white transition-colors cursor-pointer">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </a>
    </div>
  </div>
</footer>

<script>
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = '> ' + msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
function toggleMobile() { document.getElementById('mobileMenu').classList.toggle('hidden'); }
function closeMobile() { document.getElementById('mobileMenu').classList.add('hidden'); }
function scrollTo(id) { document.getElementById(id).scrollIntoView({ behavior:'smooth' }); }

window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('nav-scrolled', window.scrollY > 20);
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); animateSkills(); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Skill bars animation
let skillsAnimated = false;
function animateSkills() {
  if (skillsAnimated) return;
  document.querySelectorAll('.skill-bar').forEach(bar => {
    const w = bar.dataset.width;
    if (w) { setTimeout(() => { bar.style.width = w + '%'; }, 200); skillsAnimated = true; }
  });
}

// Contribution graph
function generateContribGraph() {
  const container = document.getElementById('contribGraph');
  const levels = ['#161b22','#0e4429','#006d32','#26a641','#39d353'];
  for (let i = 0; i < 52*7; i++) {
    const cell = document.createElement('div');
    cell.className = 'contribution-cell';
    const rnd = Math.random();
    let level = 0;
    if (rnd > 0.3) level = 1;
    if (rnd > 0.5) level = 2;
    if (rnd > 0.7) level = 3;
    if (rnd > 0.88) level = 4;
    cell.style.backgroundColor = levels[level];
    container.appendChild(cell);
  }
}
generateContribGraph();

function handleContact(e) {
  e.preventDefault();
  const name = document.getElementById('cName').value;
  if (!name) { showToast('Error: name is required'); return false; }
  showToast(`Message sent! Thanks ${name}, I will reply within 24h`);
  e.target.reset();
  return false;
}
</script>

</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
