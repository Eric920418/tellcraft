INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '8bf9e061-b6fd-4df4-8450-14850634eec5',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>kevin.dev -- Terminal Portfolio</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#111111',
        'surface-alt': '#161616',
        border: '#262626',
        'border-hover': '#3f3f3f',
        terminal: '#22c55e',
        'terminal-dim': '#166534',
        link: '#a78bfa',
        'link-hover': '#c4b5fd',
        accent: '#22c55e',
        muted: '#737373',
        subtle: '#525252',
        warn: '#f59e0b',
        err: '#ef4444',
        cyan: '#22d3ee',
        dot: { red: '#ef4444', yellow: '#f59e0b', green: '#22c55e' }
      },
      fontFamily: {
        mono: ['"Fira Code"', 'ui-monospace', 'monospace'],
        body: ['"Inter"', 'system-ui', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Fira Code', monospace;
    color: #d4d4d4;
    background: #0a0a0a;
    -webkit-font-smoothing: antialiased;
  }

  /* Blinking cursor */
  .cursor { animation: blink 1s step-end infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* Scanline overlay */
  .scanline::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.03) 2px,
      rgba(0,0,0,0.03) 4px
    );
    pointer-events: none;
  }

  /* Terminal window chrome */
  .term-chrome {
    background: #161616;
    border: 1px solid #262626;
    border-radius: 10px;
    overflow: hidden;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .term-chrome:hover {
    border-color: #22c55e40;
    box-shadow: 0 0 20px rgba(34,197,94,0.06);
  }
  .term-titlebar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: #1a1a1a;
    border-bottom: 1px solid #262626;
  }
  .term-dots { display:flex; gap:6px; }
  .term-dots span { width:10px; height:10px; border-radius:50%; }
  .term-dots .d-r { background:#ef4444; }
  .term-dots .d-y { background:#f59e0b; }
  .term-dots .d-g { background:#22c55e; }
  .term-body { padding: 16px 18px; }

  /* Skill loading bars */
  .load-bar {
    font-family: 'Fira Code', monospace;
    font-size: 13px;
    line-height: 1;
  }
  .load-track {
    transition: width 1s cubic-bezier(0.22,1,0.36,1);
  }

  /* Reveal animation */
  .reveal { opacity:0; transform:translateY(16px); transition: all 0.5s cubic-bezier(0.22,1,0.36,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }

  /* Nav scroll */
  .nav-scrolled { background: rgba(10,10,10,0.92)!important; border-bottom:1px solid #262626; backdrop-filter:blur(8px); }

  /* Contribution cells */
  .contrib-cell { width:9px; height:9px; border-radius:2px; display:inline-block; }

  /* Toast */
  .toast {
    position:fixed; bottom:1.5rem; right:1.5rem; z-index:9999;
    background:#161616; border:1px solid #22c55e40; color:#22c55e;
    padding:10px 18px; border-radius:8px; font-size:13px;
    font-family:'Fira Code',monospace;
    transform:translateY(120%); opacity:0;
    transition: all 0.3s ease;
  }
  .toast.show { transform:translateY(0); opacity:1; }

  /* Git branch badge */
  .git-badge {
    display:inline-flex; align-items:center; gap:4px;
    font-size:11px; padding:2px 8px; border-radius:9999px;
    border:1px solid #262626; color:#737373;
  }

  /* Mobile menu */
  #mobileMenu a { font-family:'Fira Code',monospace; }

  /* Form inputs terminal style */
  .term-input {
    background: #0a0a0a;
    border: 1px solid #262626;
    color: #d4d4d4;
    font-family: 'Fira Code', monospace;
    font-size: 13px;
    padding: 10px 14px;
    border-radius: 6px;
    outline: none;
    width: 100%;
    transition: border-color 0.2s;
  }
  .term-input:focus { border-color:#22c55e60; }
  .term-input::placeholder { color:#525252; }

  /* Typing effect for hero */
  .typed-line { overflow:hidden; white-space:nowrap; border-right:2px solid #22c55e; animation: typing 2s steps(40) forwards, cursor-blink 0.8s step-end infinite; width:0; }
  @keyframes typing { to { width:100%; } }
  @keyframes cursor-blink { 0%,100%{border-color:#22c55e} 50%{border-color:transparent} }
</style>
</head>
<body>

<div id="toast" class="toast"></div>

<!-- ====== NAV ====== -->
<nav id="navbar" class="fixed top-0 w-full z-50 bg-transparent transition-all duration-300">
  <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
    <a href="#" class="text-terminal text-sm font-semibold tracking-tight">
      <span class="text-muted">~/</span>kevin<span class="text-link">.dev</span>
    </a>
    <div class="hidden md:flex items-center gap-5">
      <a href="#projects" class="text-xs text-muted hover:text-terminal transition-colors">./projects</a>
      <a href="#skills" class="text-xs text-muted hover:text-terminal transition-colors">./skills</a>
      <a href="#experience" class="text-xs text-muted hover:text-terminal transition-colors">./experience</a>
      <a href="#contact" class="text-xs text-muted hover:text-terminal transition-colors">./contact</a>
      <a href="#" class="text-xs text-muted hover:text-white transition-colors border border-border rounded px-3 py-1.5 hover:border-border-hover cursor-pointer flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        GitHub
      </a>
    </div>
    <button onclick="toggleMobile()" class="md:hidden w-8 h-8 flex items-center justify-center cursor-pointer">
      <svg class="w-5 h-5 text-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div id="mobileMenu" class="hidden md:hidden bg-bg border-t border-border px-6 pb-4">
    <a href="#projects" onclick="closeMobile()" class="block py-2.5 text-sm text-muted hover:text-terminal">./projects</a>
    <a href="#skills" onclick="closeMobile()" class="block py-2.5 text-sm text-muted hover:text-terminal">./skills</a>
    <a href="#experience" onclick="closeMobile()" class="block py-2.5 text-sm text-muted hover:text-terminal">./experience</a>
    <a href="#contact" onclick="closeMobile()" class="block py-2.5 text-sm text-muted hover:text-terminal">./contact</a>
  </div>
</nav>

<!-- ====== HERO ====== -->
<section class="min-h-screen flex items-center relative scanline">
  <div class="max-w-5xl mx-auto px-6 pt-20 pb-16 w-full">
    <div class="reveal">
      <!-- Hero terminal -->
      <div class="term-chrome">
        <div class="term-titlebar">
          <div class="term-dots"><span class="d-r"></span><span class="d-y"></span><span class="d-g"></span></div>
          <span class="text-xs text-subtle">kevin@arch ~ zsh</span>
          <span class="text-xs text-subtle ml-auto">pts/0</span>
        </div>
        <div class="term-body space-y-4 py-8 px-6 lg:px-10">
          <!-- Prompt line -->
          <div class="text-sm text-muted">
            <span class="text-terminal">kevin</span><span class="text-subtle">@</span><span class="text-cyan">arch</span>
            <span class="text-link ml-1">~</span>
            <span class="text-muted ml-1">$</span>
            <span class="text-white ml-2 font-semibold">cat developer.portfolio</span>
          </div>

          <div class="mt-6">
            <h1 class="text-3xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
              > developer.portfolio<span class="cursor text-terminal">_</span>
            </h1>
          </div>

          <div class="text-terminal text-lg lg:text-xl mt-2">Senior Frontend Engineer</div>

          <p class="text-muted text-sm lg:text-base leading-relaxed max-w-2xl font-body mt-4">
            5 年前端開發經驗，專注 React / Next.js 生態系。熱愛開源、追求效能極致、相信好的 DX 帶來好的 UX。目前在 Taipei 遠端工作中。
          </p>

          <!-- Tag badges -->
          <div class="flex flex-wrap gap-2 mt-6">
            <span class="text-xs bg-terminal/10 text-terminal border border-terminal/20 px-3 py-1 rounded-full"># open-to-work</span>
            <span class="text-xs bg-link/10 text-link border border-link/20 px-3 py-1 rounded-full"># react</span>
            <span class="text-xs bg-cyan/10 text-cyan border border-cyan/20 px-3 py-1 rounded-full"># typescript</span>
            <span class="text-xs bg-warn/10 text-warn border border-warn/20 px-3 py-1 rounded-full"># next.js</span>
          </div>

          <!-- CTA -->
          <div class="flex flex-wrap gap-3 mt-8">
            <button onclick="scrollTo('contact')" class="bg-terminal hover:bg-green-400 text-black px-6 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer">
              $ contact --me
            </button>
            <button onclick="scrollTo('projects')" class="border border-border hover:border-terminal/40 text-muted hover:text-terminal px-6 py-3 rounded-lg text-sm transition-all cursor-pointer">
              $ ls ./projects
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Contribution graph -->
    <div class="mt-8 reveal">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-xs text-subtle">$ gh contribution-graph --year=2025</span>
        <span class="cursor text-terminal text-xs">_</span>
      </div>
      <div class="flex gap-[3px] flex-wrap" id="contribGraph"></div>
      <div class="flex items-center gap-3 mt-2">
        <span class="text-[10px] text-subtle">Less</span>
        <div class="flex gap-1">
          <span class="contrib-cell" style="background:#161616"></span>
          <span class="contrib-cell" style="background:#0e4429"></span>
          <span class="contrib-cell" style="background:#006d32"></span>
          <span class="contrib-cell" style="background:#26a641"></span>
          <span class="contrib-cell" style="background:#39d353"></span>
        </div>
        <span class="text-[10px] text-subtle">More</span>
        <span class="text-[10px] text-muted ml-auto">1,247 contributions in 2025</span>
      </div>
    </div>
  </div>
</section>

<!-- ====== PROJECTS (Terminal Windows) ====== -->
<section id="projects" class="py-20">
  <div class="max-w-5xl mx-auto px-6">
    <div class="flex items-center gap-3 mb-10 reveal">
      <span class="text-terminal">$</span>
      <h2 class="text-lg font-bold text-white">ls ./projects <span class="text-muted font-normal">--sort=stars --format=terminal</span></h2>
      <span class="cursor text-terminal">_</span>
    </div>

    <div class="grid lg:grid-cols-2 gap-5">

      <!-- Project 1: Terminal Window -->
      <div class="term-chrome reveal cursor-pointer" onclick="showToast('$ open https://github.com/kevin/flux-ui')">
        <div class="term-titlebar">
          <div class="term-dots"><span class="d-r"></span><span class="d-y"></span><span class="d-g"></span></div>
          <span class="text-xs text-white font-medium ml-1">flux-ui</span>
          <span class="text-xs text-subtle ml-auto">~/projects/flux-ui</span>
        </div>
        <div class="term-body text-xs space-y-3">
          <!-- Git info line -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="git-badge">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>
              main
            </span>
            <span class="text-subtle">|</span>
            <span class="text-muted">234 commits</span>
            <span class="text-subtle">|</span>
            <span class="text-muted">12 contributors</span>
            <span class="text-subtle">|</span>
            <span class="text-warn">&#9733; 2.4k</span>
          </div>

          <div class="border-t border-border my-2"></div>

          <!-- Description -->
          <div>
            <span class="text-terminal">README.md</span>
            <span class="text-subtle ml-2">//</span>
          </div>
          <p class="text-muted leading-relaxed font-body text-[13px]">
            基於 Tailwind CSS 的 React UI 元件庫，支援暗色模式、可自訂主題、完整 TypeScript 型別定義。50+ 元件。
          </p>

          <!-- Code preview snippet -->
          <div class="bg-bg rounded-md p-3 border border-border mt-2">
            <div class="text-subtle text-[10px] mb-2">// src/components/Button.tsx</div>
            <div><span class="text-link">import</span> <span class="text-white">{ cn }</span> <span class="text-link">from</span> <span class="text-terminal">'../utils'</span></div>
            <div class="mt-1"><span class="text-link">export</span> <span class="text-cyan">function</span> <span class="text-warn">Button</span>({ children, variant }) {</div>
            <div class="pl-4"><span class="text-link">return</span> &lt;<span class="text-cyan">button</span> <span class="text-link">className</span>={<span class="text-warn">cn</span>(styles[variant])}&gt;</div>
            <div class="pl-4">  {children}</div>
            <div class="pl-4">&lt;/<span class="text-cyan">button</span>&gt;</div>
            <div>}</div>
          </div>

          <!-- Tech badges -->
          <div class="flex flex-wrap gap-1.5 mt-2">
            <span class="text-[10px] px-2 py-0.5 rounded bg-terminal/10 text-terminal border border-terminal/15">React</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-link/10 text-link border border-link/15">TypeScript</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/15">Tailwind</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-warn/10 text-warn border border-warn/15">Storybook</span>
          </div>
        </div>
      </div>

      <!-- Project 2: Terminal Window -->
      <div class="term-chrome reveal cursor-pointer" onclick="showToast('$ open https://github.com/kevin/next-intl-pro')">
        <div class="term-titlebar">
          <div class="term-dots"><span class="d-r"></span><span class="d-y"></span><span class="d-g"></span></div>
          <span class="text-xs text-white font-medium ml-1">next-intl-pro</span>
          <span class="text-xs text-subtle ml-auto">~/projects/next-intl-pro</span>
        </div>
        <div class="term-body text-xs space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="git-badge">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>
              main
            </span>
            <span class="text-subtle">|</span>
            <span class="text-muted">187 commits</span>
            <span class="text-subtle">|</span>
            <span class="text-muted">8 contributors</span>
            <span class="text-subtle">|</span>
            <span class="text-warn">&#9733; 890</span>
          </div>

          <div class="border-t border-border my-2"></div>

          <div>
            <span class="text-terminal">README.md</span>
          </div>
          <p class="text-muted leading-relaxed font-body text-[13px]">
            Next.js App Router 國際化方案，支援 SSG/ISR、自動語系偵測、pluralization 和 nested namespaces。
          </p>

          <div class="bg-bg rounded-md p-3 border border-border mt-2">
            <div class="text-subtle text-[10px] mb-2">// middleware.ts</div>
            <div><span class="text-link">import</span> <span class="text-white">{ createI18nMiddleware }</span></div>
            <div class="pl-4"><span class="text-link">from</span> <span class="text-terminal">'next-intl-pro'</span></div>
            <div class="mt-1"><span class="text-link">export default</span> <span class="text-warn">createI18nMiddleware</span>({</div>
            <div class="pl-4">locales: [<span class="text-terminal">'en'</span>, <span class="text-terminal">'zh-TW'</span>, <span class="text-terminal">'ja'</span>],</div>
            <div class="pl-4">defaultLocale: <span class="text-terminal">'zh-TW'</span></div>
            <div>})</div>
          </div>

          <div class="flex flex-wrap gap-1.5 mt-2">
            <span class="text-[10px] px-2 py-0.5 rounded bg-link/10 text-link border border-link/15">Next.js</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/15">i18n</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-terminal/10 text-terminal border border-terminal/15">App Router</span>
          </div>
        </div>
      </div>

      <!-- Project 3: Terminal Window -->
      <div class="term-chrome reveal cursor-pointer" onclick="showToast('$ open https://github.com/kevin/use-motion')">
        <div class="term-titlebar">
          <div class="term-dots"><span class="d-r"></span><span class="d-y"></span><span class="d-g"></span></div>
          <span class="text-xs text-white font-medium ml-1">use-motion</span>
          <span class="text-xs text-subtle ml-auto">~/projects/use-motion</span>
        </div>
        <div class="term-body text-xs space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="git-badge">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>
              main
            </span>
            <span class="text-subtle">|</span>
            <span class="text-muted">156 commits</span>
            <span class="text-subtle">|</span>
            <span class="text-muted">5 contributors</span>
            <span class="text-subtle">|</span>
            <span class="text-warn">&#9733; 560</span>
          </div>

          <div class="border-t border-border my-2"></div>

          <div>
            <span class="text-terminal">README.md</span>
          </div>
          <p class="text-muted leading-relaxed font-body text-[13px]">
            輕量 React hooks 動畫庫（2KB gzipped），基於 Web Animations API，零依賴，支援 spring physics。
          </p>

          <div class="bg-bg rounded-md p-3 border border-border mt-2">
            <div class="text-subtle text-[10px] mb-2">// hooks/useSpring.ts</div>
            <div><span class="text-link">export function</span> <span class="text-warn">useSpring</span>(target, config) {</div>
            <div class="pl-4"><span class="text-link">const</span> ref = <span class="text-cyan">useRef</span>()</div>
            <div class="pl-4"><span class="text-link">const</span> anim = <span class="text-cyan">useWAAPI</span>(ref, {</div>
            <div class="pl-8">transform: <span class="text-terminal">`scale(</span>${target}<span class="text-terminal">)`</span></div>
            <div class="pl-4">}, config)</div>
            <div class="pl-4"><span class="text-link">return</span> [ref, anim]</div>
            <div>}</div>
          </div>

          <div class="flex flex-wrap gap-1.5 mt-2">
            <span class="text-[10px] px-2 py-0.5 rounded bg-terminal/10 text-terminal border border-terminal/15">React</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-warn/10 text-warn border border-warn/15">Animation</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/15">WAAPI</span>
          </div>
        </div>
      </div>

      <!-- Project 4: Terminal Window -->
      <div class="term-chrome reveal cursor-pointer" onclick="showToast('$ open https://github.com/kevin/devfolio')">
        <div class="term-titlebar">
          <div class="term-dots"><span class="d-r"></span><span class="d-y"></span><span class="d-g"></span></div>
          <span class="text-xs text-white font-medium ml-1">devfolio</span>
          <span class="text-xs text-subtle ml-auto">~/projects/devfolio</span>
        </div>
        <div class="term-body text-xs space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="git-badge">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>
              main
            </span>
            <span class="text-subtle">|</span>
            <span class="text-muted">98 commits</span>
            <span class="text-subtle">|</span>
            <span class="text-muted">3 contributors</span>
            <span class="text-subtle">|</span>
            <span class="text-warn">&#9733; 340</span>
          </div>

          <div class="border-t border-border my-2"></div>

          <div>
            <span class="text-terminal">README.md</span>
          </div>
          <p class="text-muted leading-relaxed font-body text-[13px]">
            開發者作品集模板 -- 就是你現在看到的這個。Terminal 風格 + GitHub contribution graph + Markdown blog。
          </p>

          <div class="bg-bg rounded-md p-3 border border-border mt-2">
            <div class="text-subtle text-[10px] mb-2">// next.config.ts</div>
            <div><span class="text-link">import</span> <span class="text-white">mdx</span> <span class="text-link">from</span> <span class="text-terminal">'@next/mdx'</span></div>
            <div class="mt-1"><span class="text-link">export default</span> <span class="text-warn">mdx</span>({</div>
            <div class="pl-4">extension: <span class="text-terminal">/\.mdx?$/</span>,</div>
            <div class="pl-4">options: { rehypePlugins: [<span class="text-cyan">rehypePrism</span>] }</div>
            <div>})</div>
          </div>

          <div class="flex flex-wrap gap-1.5 mt-2">
            <span class="text-[10px] px-2 py-0.5 rounded bg-link/10 text-link border border-link/15">Next.js</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-warn/10 text-warn border border-warn/15">MDX</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-terminal/10 text-terminal border border-terminal/15">Vercel</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>

<!-- ====== SKILLS (Loading Bar Style) ====== -->
<section id="skills" class="py-20 border-t border-border">
  <div class="max-w-5xl mx-auto px-6">
    <div class="flex items-center gap-3 mb-10 reveal">
      <span class="text-terminal">$</span>
      <h2 class="text-lg font-bold text-white">cat skills.json <span class="text-muted font-normal">| format --bars</span></h2>
      <span class="cursor text-terminal">_</span>
    </div>

    <div class="grid md:grid-cols-2 gap-x-10 gap-y-6 reveal">
      <!-- Frontend Skills -->
      <div>
        <div class="text-xs text-subtle uppercase tracking-widest mb-5 flex items-center gap-2">
          <span class="text-terminal">//</span> Frontend
        </div>
        <div class="space-y-4">
          <div class="load-bar">
            <div class="flex justify-between mb-1"><span class="text-muted">React / Next.js</span></div>
            <div class="flex items-center gap-2">
              <span class="text-subtle">[</span>
              <div class="flex-1 h-3 bg-bg rounded-sm overflow-hidden border border-border">
                <div class="load-track h-full bg-terminal rounded-sm" style="width:0%" data-w="95"></div>
              </div>
              <span class="text-subtle">]</span>
              <span class="text-terminal text-xs w-8 text-right">95%</span>
            </div>
          </div>
          <div class="load-bar">
            <div class="flex justify-between mb-1"><span class="text-muted">TypeScript</span></div>
            <div class="flex items-center gap-2">
              <span class="text-subtle">[</span>
              <div class="flex-1 h-3 bg-bg rounded-sm overflow-hidden border border-border">
                <div class="load-track h-full bg-terminal rounded-sm" style="width:0%" data-w="92"></div>
              </div>
              <span class="text-subtle">]</span>
              <span class="text-terminal text-xs w-8 text-right">92%</span>
            </div>
          </div>
          <div class="load-bar">
            <div class="flex justify-between mb-1"><span class="text-muted">Tailwind CSS</span></div>
            <div class="flex items-center gap-2">
              <span class="text-subtle">[</span>
              <div class="flex-1 h-3 bg-bg rounded-sm overflow-hidden border border-border">
                <div class="load-track h-full bg-cyan rounded-sm" style="width:0%" data-w="90"></div>
              </div>
              <span class="text-subtle">]</span>
              <span class="text-cyan text-xs w-8 text-right">90%</span>
            </div>
          </div>
          <div class="load-bar">
            <div class="flex justify-between mb-1"><span class="text-muted">Vue.js / Nuxt</span></div>
            <div class="flex items-center gap-2">
              <span class="text-subtle">[</span>
              <div class="flex-1 h-3 bg-bg rounded-sm overflow-hidden border border-border">
                <div class="load-track h-full bg-link rounded-sm" style="width:0%" data-w="75"></div>
              </div>
              <span class="text-subtle">]</span>
              <span class="text-link text-xs w-8 text-right">75%</span>
            </div>
          </div>
          <div class="load-bar">
            <div class="flex justify-between mb-1"><span class="text-muted">Testing (Vitest/Playwright)</span></div>
            <div class="flex items-center gap-2">
              <span class="text-subtle">[</span>
              <div class="flex-1 h-3 bg-bg rounded-sm overflow-hidden border border-border">
                <div class="load-track h-full bg-link rounded-sm" style="width:0%" data-w="82"></div>
              </div>
              <span class="text-subtle">]</span>
              <span class="text-link text-xs w-8 text-right">82%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Backend & Tools -->
      <div>
        <div class="text-xs text-subtle uppercase tracking-widest mb-5 flex items-center gap-2">
          <span class="text-terminal">//</span> Backend & Infra
        </div>
        <div class="space-y-4">
          <div class="load-bar">
            <div class="flex justify-between mb-1"><span class="text-muted">Node.js / Express</span></div>
            <div class="flex items-center gap-2">
              <span class="text-subtle">[</span>
              <div class="flex-1 h-3 bg-bg rounded-sm overflow-hidden border border-border">
                <div class="load-track h-full bg-warn rounded-sm" style="width:0%" data-w="85"></div>
              </div>
              <span class="text-subtle">]</span>
              <span class="text-warn text-xs w-8 text-right">85%</span>
            </div>
          </div>
          <div class="load-bar">
            <div class="flex justify-between mb-1"><span class="text-muted">PostgreSQL / Redis</span></div>
            <div class="flex items-center gap-2">
              <span class="text-subtle">[</span>
              <div class="flex-1 h-3 bg-bg rounded-sm overflow-hidden border border-border">
                <div class="load-track h-full bg-warn rounded-sm" style="width:0%" data-w="78"></div>
              </div>
              <span class="text-subtle">]</span>
              <span class="text-warn text-xs w-8 text-right">78%</span>
            </div>
          </div>
          <div class="load-bar">
            <div class="flex justify-between mb-1"><span class="text-muted">Docker / CI-CD</span></div>
            <div class="flex items-center gap-2">
              <span class="text-subtle">[</span>
              <div class="flex-1 h-3 bg-bg rounded-sm overflow-hidden border border-border">
                <div class="load-track h-full bg-link rounded-sm" style="width:0%" data-w="80"></div>
              </div>
              <span class="text-subtle">]</span>
              <span class="text-link text-xs w-8 text-right">80%</span>
            </div>
          </div>
          <div class="load-bar">
            <div class="flex justify-between mb-1"><span class="text-muted">AWS / Vercel</span></div>
            <div class="flex items-center gap-2">
              <span class="text-subtle">[</span>
              <div class="flex-1 h-3 bg-bg rounded-sm overflow-hidden border border-border">
                <div class="load-track h-full bg-link rounded-sm" style="width:0%" data-w="82"></div>
              </div>
              <span class="text-subtle">]</span>
              <span class="text-link text-xs w-8 text-right">82%</span>
            </div>
          </div>
          <div class="load-bar">
            <div class="flex justify-between mb-1"><span class="text-muted">GraphQL / tRPC</span></div>
            <div class="flex items-center gap-2">
              <span class="text-subtle">[</span>
              <div class="flex-1 h-3 bg-bg rounded-sm overflow-hidden border border-border">
                <div class="load-track h-full bg-terminal rounded-sm" style="width:0%" data-w="70"></div>
              </div>
              <span class="text-subtle">]</span>
              <span class="text-terminal text-xs w-8 text-right">70%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ASCII skill summary -->
    <div class="mt-10 reveal">
      <div class="term-chrome">
        <div class="term-titlebar">
          <div class="term-dots"><span class="d-r"></span><span class="d-y"></span><span class="d-g"></span></div>
          <span class="text-xs text-subtle">skill-summary.sh</span>
        </div>
        <div class="term-body text-xs space-y-1">
          <div class="text-muted">$ neofetch --dev</div>
          <div class="mt-2 grid grid-cols-2 gap-x-8 gap-y-0.5">
            <div><span class="text-terminal">OS</span><span class="text-subtle">:</span> <span class="text-muted">macOS Sequoia 15.3</span></div>
            <div><span class="text-terminal">Editor</span><span class="text-subtle">:</span> <span class="text-muted">Neovim + VS Code</span></div>
            <div><span class="text-terminal">Shell</span><span class="text-subtle">:</span> <span class="text-muted">zsh + starship</span></div>
            <div><span class="text-terminal">Terminal</span><span class="text-subtle">:</span> <span class="text-muted">Ghostty</span></div>
            <div><span class="text-terminal">Languages</span><span class="text-subtle">:</span> <span class="text-muted">TS, JS, Rust, Go</span></div>
            <div><span class="text-terminal">Packages</span><span class="text-subtle">:</span> <span class="text-muted">pnpm (always)</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ====== EXPERIENCE (git log) ====== -->
<section id="experience" class="py-20 border-t border-border">
  <div class="max-w-5xl mx-auto px-6">
    <div class="flex items-center gap-3 mb-10 reveal">
      <span class="text-terminal">$</span>
      <h2 class="text-lg font-bold text-white">git log --oneline <span class="text-muted font-normal">career</span></h2>
      <span class="cursor text-terminal">_</span>
    </div>

    <div class="space-y-0 reveal">
      <!-- Entry 1 -->
      <div class="flex gap-5 pb-10 relative group cursor-pointer" onclick="showToast('$ git show HEAD -- Appier')">
        <div class="flex flex-col items-center">
          <div class="w-3 h-3 rounded-full border-2 border-border bg-bg z-10 group-hover:border-terminal group-hover:bg-terminal transition-all"></div>
          <div class="w-px flex-1 bg-border"></div>
        </div>
        <div class="pb-2">
          <div class="flex items-center gap-3 mb-1">
            <span class="text-xs text-warn font-mono">HEAD</span>
            <span class="text-[10px] text-subtle">2023 -- Present</span>
          </div>
          <h3 class="font-bold text-white text-sm">Senior Frontend Engineer</h3>
          <div class="text-link text-xs mt-0.5">@ Appier</div>
          <p class="text-muted text-xs mt-2 leading-relaxed font-body">
            負責 AI 行銷平台前端架構，導入 Next.js App Router、Module Federation 微前端架構。帶領 8 人團隊，mentor 2 位 junior engineer。
          </p>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span class="text-[10px] px-2 py-0.5 bg-surface-alt border border-border rounded text-muted">React</span>
            <span class="text-[10px] px-2 py-0.5 bg-surface-alt border border-border rounded text-muted">Next.js</span>
            <span class="text-[10px] px-2 py-0.5 bg-surface-alt border border-border rounded text-muted">Module Federation</span>
            <span class="text-[10px] px-2 py-0.5 bg-surface-alt border border-border rounded text-muted">Turborepo</span>
          </div>
        </div>
      </div>

      <!-- Entry 2 -->
      <div class="flex gap-5 pb-10 relative group cursor-pointer" onclick="showToast('$ git show HEAD~1 -- PicCollage')">
        <div class="flex flex-col items-center">
          <div class="w-3 h-3 rounded-full border-2 border-border bg-bg z-10 group-hover:border-terminal group-hover:bg-terminal transition-all"></div>
          <div class="w-px flex-1 bg-border"></div>
        </div>
        <div class="pb-2">
          <div class="flex items-center gap-3 mb-1">
            <span class="text-xs text-subtle font-mono">HEAD~1</span>
            <span class="text-[10px] text-subtle">2021 -- 2023</span>
          </div>
          <h3 class="font-bold text-white text-sm">Frontend Engineer</h3>
          <div class="text-link text-xs mt-0.5">@ PicCollage</div>
          <p class="text-muted text-xs mt-2 leading-relaxed font-body">
            開發 Web Editor 核心模組，處理圖片編輯、Canvas 渲染、WebGL shader 效能優化。首屏載入從 4.2s 降至 1.8s（-57%）。
          </p>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span class="text-[10px] px-2 py-0.5 bg-surface-alt border border-border rounded text-muted">Vue.js</span>
            <span class="text-[10px] px-2 py-0.5 bg-surface-alt border border-border rounded text-muted">Canvas</span>
            <span class="text-[10px] px-2 py-0.5 bg-surface-alt border border-border rounded text-muted">WebGL</span>
          </div>
        </div>
      </div>

      <!-- Entry 3 -->
      <div class="flex gap-5 relative group cursor-pointer" onclick="showToast('$ git show HEAD~2 -- Freelance')">
        <div class="flex flex-col items-center">
          <div class="w-3 h-3 rounded-full border-2 border-border bg-bg z-10 group-hover:border-terminal group-hover:bg-terminal transition-all"></div>
        </div>
        <div>
          <div class="flex items-center gap-3 mb-1">
            <span class="text-xs text-subtle font-mono">HEAD~2</span>
            <span class="text-[10px] text-subtle">2019 -- 2021</span>
          </div>
          <h3 class="font-bold text-white text-sm">Freelance Developer</h3>
          <div class="text-link text-xs mt-0.5">@ Independent</div>
          <p class="text-muted text-xs mt-2 leading-relaxed font-body">
            獨立承接 10+ 專案，從企業官網到 SaaS Dashboard。建立個人品牌並開始維護開源專案，培養全端開發能力。
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ====== CONTACT (Terminal Form) ====== -->
<section id="contact" class="py-20 border-t border-border">
  <div class="max-w-3xl mx-auto px-6">
    <div class="flex items-center gap-3 mb-10 reveal">
      <span class="text-terminal">$</span>
      <h2 class="text-lg font-bold text-white">send-message --to=dev</h2>
      <span class="cursor text-terminal">_</span>
    </div>

    <div class="term-chrome reveal">
      <div class="term-titlebar">
        <div class="term-dots"><span class="d-r"></span><span class="d-y"></span><span class="d-g"></span></div>
        <span class="text-xs text-subtle">send-message.sh</span>
        <span class="text-xs text-subtle ml-auto">stdin</span>
      </div>
      <div class="term-body">
        <form onsubmit="return handleContact(event)" class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-xs text-terminal mb-2">
              <span class="text-muted">$</span> read -p "name: " <span class="text-white">NAME</span> <span class="text-err">*</span>
            </label>
            <input type="text" id="cName" required placeholder="your_name" class="term-input">
          </div>
          <!-- Email -->
          <div>
            <label class="block text-xs text-terminal mb-2">
              <span class="text-muted">$</span> read -p "email: " <span class="text-white">EMAIL</span> <span class="text-err">*</span>
            </label>
            <input type="email" id="cEmail" required placeholder="dev@example.com" class="term-input">
          </div>
          <!-- Subject -->
          <div>
            <label class="block text-xs text-terminal mb-2">
              <span class="text-muted">$</span> read -p "subject: " <span class="text-white">SUBJECT</span>
            </label>
            <input type="text" id="cSubject" placeholder="collab | fulltime | freelance | coffee" class="term-input">
          </div>
          <!-- Message -->
          <div>
            <label class="block text-xs text-terminal mb-2">
              <span class="text-muted">$</span> cat &lt;&lt;EOF &gt; <span class="text-white">MESSAGE</span> <span class="text-err">*</span>
            </label>
            <textarea id="cMsg" required rows="5" placeholder="Hey Kevin, I'd like to chat about..." class="term-input resize-none"></textarea>
          </div>
          <!-- Submit -->
          <div class="pt-2">
            <button type="submit" class="w-full bg-terminal hover:bg-green-400 text-black py-3.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer">
              $ send-message --confirm
            </button>
            <div class="text-[10px] text-subtle mt-2 text-center">
              // process will exit with code 0 on success
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</section>

<!-- ====== FOOTER ====== -->
<footer class="border-t border-border py-8">
  <div class="max-w-5xl mx-auto px-6">
    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
      <div class="text-xs text-subtle">
        <span class="text-terminal">kevin</span><span class="text-subtle">@</span><span class="text-cyan">arch</span>
        <span class="text-muted ml-1">$</span>
        <span class="text-muted ml-1">echo</span>
        <span class="text-white ml-1">"Built with Next.js &amp; deployed on Vercel"</span>
        <span class="cursor text-terminal ml-1">_</span>
      </div>
      <div class="flex gap-4 items-center">
        <a href="#" class="text-muted hover:text-white transition-colors cursor-pointer" title="GitHub">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
        <a href="#" class="text-muted hover:text-white transition-colors cursor-pointer" title="X/Twitter">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href="#" class="text-muted hover:text-white transition-colors cursor-pointer" title="LinkedIn">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
        <span class="text-subtle">|</span>
        <span class="text-[10px] text-subtle">&copy; 2025 kevin.dev</span>
      </div>
    </div>
  </div>
</footer>

<script>
// ---- Utilities ----
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2800);
}
function toggleMobile() { document.getElementById('mobileMenu').classList.toggle('hidden'); }
function closeMobile() { document.getElementById('mobileMenu').classList.add('hidden'); }
function scrollTo(id) { document.getElementById(id).scrollIntoView({ behavior:'smooth' }); }

// ---- Nav scroll ----
window.addEventListener('scroll', function() {
  document.getElementById('navbar').classList.toggle('nav-scrolled', window.scrollY > 20);
});

// ---- Reveal on scroll ----
var revealObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      animateSkills();
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(function(el) { revealObs.observe(el); });

// ---- Skill loading bars animation ----
var skillsAnimated = false;
function animateSkills() {
  if (skillsAnimated) return;
  var bars = document.querySelectorAll('.load-track');
  bars.forEach(function(bar, i) {
    var w = bar.getAttribute('data-w');
    if (w) {
      setTimeout(function() { bar.style.width = w + '%'; }, 120 * i);
    }
  });
  skillsAnimated = true;
}

// ---- Contribution graph ----
(function() {
  var container = document.getElementById('contribGraph');
  var levels = ['#161616','#0e4429','#006d32','#26a641','#39d353'];
  for (var i = 0; i < 52 * 7; i++) {
    var cell = document.createElement('div');
    cell.className = 'contrib-cell';
    var rnd = Math.random();
    var level = 0;
    if (rnd > 0.35) level = 1;
    if (rnd > 0.55) level = 2;
    if (rnd > 0.72) level = 3;
    if (rnd > 0.9) level = 4;
    cell.style.backgroundColor = levels[level];
    container.appendChild(cell);
  }
})();

// ---- Contact form ----
function handleContact(e) {
  e.preventDefault();
  var name = document.getElementById('cName').value;
  var email = document.getElementById('cEmail').value;
  var msg = document.getElementById('cMsg').value;
  if (!name || !email || !msg) {
    showToast('$ error: missing required fields (exit 1)');
    return false;
  }
  showToast('$ message sent successfully (exit 0) -- reply within 24h, ' + name);
  e.target.reset();
  return false;
}
</script>

</body>
</html>
  $HTML$,
  3
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
