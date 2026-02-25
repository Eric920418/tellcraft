INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'c25f4767-d700-41d6-9451-c323ed99ceb8',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>> tech_blog</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        base: '#0a0a0a',
        surface: '#111111',
        elevated: '#1a1a1a',
        border: '#2a2a2a',
        'term-green': '#22c55e',
        'term-green-dim': '#16a34a',
        'code-purple': '#a78bfa',
        'code-blue': '#60a5fa',
        'code-orange': '#fb923c',
        'code-pink': '#f472b6',
        'code-yellow': '#fbbf24',
        'warm-white': '#e8e6e3',
        'warm-gray': '#a8a29e',
        'warm-dim': '#78716c'
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        body: ['Inter', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'JetBrains Mono', monospace;
    background: #0a0a0a;
    color: #e8e6e3;
  }

  /* Blinking cursor */
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  .cursor-blink {
    display: inline-block;
    width: 8px;
    height: 16px;
    background: #22c55e;
    animation: blink 1s step-end infinite;
    vertical-align: middle;
    margin-left: 2px;
  }
  .cursor-blink-sm {
    display: inline-block;
    width: 6px;
    height: 13px;
    background: #22c55e;
    animation: blink 1s step-end infinite;
    vertical-align: middle;
    margin-left: 2px;
  }

  /* Terminal window */
  .terminal-window {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.3s ease, transform 0.2s ease;
  }
  .terminal-window:hover {
    border-color: #22c55e40;
    transform: translateY(-2px);
  }
  .terminal-titlebar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: #151515;
    border-bottom: 1px solid #2a2a2a;
  }
  .terminal-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .dot-red { background: #ff5f57; }
  .dot-yellow { background: #febc2e; }
  .dot-green { background: #28c840; }
  .terminal-body {
    padding: 16px;
  }

  /* Syntax highlighting */
  .syn-keyword { color: #c084fc; }
  .syn-string { color: #22c55e; }
  .syn-func { color: #60a5fa; }
  .syn-comment { color: #78716c; font-style: italic; }
  .syn-number { color: #fb923c; }
  .syn-type { color: #fbbf24; }
  .syn-punct { color: #a8a29e; }
  .syn-method { color: #f472b6; }
  .syn-const { color: #a78bfa; }
  .syn-param { color: #e8e6e3; }
  .syn-operator { color: #22c55e; }
  .syn-property { color: #60a5fa; }

  /* Tag badge */
  .tag-code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    padding: 2px 8px;
    background: #22c55e15;
    color: #22c55e;
    border: 1px solid #22c55e30;
    border-radius: 4px;
    display: inline-block;
  }
  .tag-code.purple {
    background: #a78bfa15;
    color: #a78bfa;
    border-color: #a78bfa30;
  }
  .tag-code.blue {
    background: #60a5fa15;
    color: #60a5fa;
    border-color: #60a5fa30;
  }
  .tag-code.orange {
    background: #fb923c15;
    color: #fb923c;
    border-color: #fb923c30;
  }
  .tag-code.pink {
    background: #f472b615;
    color: #f472b6;
    border-color: #f472b630;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0a0a0a; }
  ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }

  /* Scroll reveal */
  .reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ASCII line */
  .ascii-line {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #2a2a2a;
    letter-spacing: 2px;
    user-select: none;
    overflow: hidden;
    white-space: nowrap;
  }

  /* Nav command hover */
  .nav-cmd {
    transition: color 0.2s ease;
    cursor: pointer;
  }
  .nav-cmd:hover {
    color: #22c55e;
  }

  /* Newsletter input */
  .term-input {
    background: #111111;
    border: 1px solid #2a2a2a;
    color: #22c55e;
    font-family: 'JetBrains Mono', monospace;
    outline: none;
    transition: border-color 0.2s ease;
  }
  .term-input:focus {
    border-color: #22c55e;
  }
  .term-input::placeholder {
    color: #78716c;
  }

  /* Active tag filter */
  .tag-filter.active {
    background: #22c55e20;
    border-color: #22c55e;
    color: #22c55e;
  }

  /* Featured glow */
  .featured-glow {
    box-shadow: 0 0 30px rgba(34, 197, 94, 0.05);
  }
</style>
</head>
<body>

<!-- Header -->
<header class="border-b border-border bg-base/90 backdrop-blur-md sticky top-0 z-50">
  <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
    <div class="flex items-center gap-8">
      <a onclick="showSection('home')" class="cursor-pointer flex items-center gap-2 group">
        <span class="text-term-green text-sm font-mono font-semibold">&gt;</span>
        <span class="font-mono text-sm font-semibold text-warm-white group-hover:text-term-green transition-colors">tech_blog</span>
        <span class="cursor-blink-sm"></span>
      </a>
      <nav class="hidden md:flex items-center gap-6">
        <a onclick="showSection('home')" class="nav-cmd font-mono text-xs text-warm-dim">$ cd /posts</a>
        <a onclick="handleAction('about')" class="nav-cmd font-mono text-xs text-warm-dim">$ cat /about</a>
        <a onclick="handleAction('projects')" class="nav-cmd font-mono text-xs text-warm-dim">$ ls /projects</a>
        <a onclick="handleAction('search')" class="nav-cmd font-mono text-xs text-warm-dim">$ grep /search</a>
      </nav>
    </div>
    <div class="flex items-center gap-3">
      <a onclick="handleAction('GitHub')" class="cursor-pointer text-warm-dim hover:text-term-green transition-colors p-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
      </a>
      <a onclick="handleAction('RSS')" class="cursor-pointer text-warm-dim hover:text-term-green transition-colors p-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11a9 9 0 019 9"/><path d="M4 4a16 16 0 0116 16"/><circle cx="5" cy="19" r="1" fill="currentColor"/></svg>
      </a>
    </div>
  </div>
</header>

<!-- HOME -->
<div id="section-home">

  <!-- Featured Post -->
  <section class="max-w-5xl mx-auto px-6 pt-10 pb-8 reveal">
    <div class="terminal-window featured-glow cursor-pointer" onclick="showArticle(0)">
      <div class="terminal-titlebar">
        <div class="flex items-center gap-2">
          <span class="terminal-dot dot-red"></span>
          <span class="terminal-dot dot-yellow"></span>
          <span class="terminal-dot dot-green"></span>
        </div>
        <span class="font-mono text-xs text-warm-dim ml-2">featured_post.md</span>
        <span class="ml-auto font-mono text-[10px] text-term-green border border-term-green/30 px-2 py-0.5 rounded">PINNED</span>
      </div>
      <div class="terminal-body p-6 md:p-8">
        <div class="flex items-center gap-2 mb-4">
          <span class="font-mono text-xs text-warm-dim">$</span>
          <span class="font-mono text-xs text-term-green">cat</span>
          <span class="font-mono text-xs text-warm-gray">--date</span>
          <span class="font-mono text-xs text-code-purple">2024-01-15T09:00:00Z</span>
        </div>
        <h2 class="font-mono text-xl md:text-2xl font-bold text-warm-white mb-4 leading-tight">Building a Real-time API with WebSockets</h2>
        <p class="font-body text-sm text-warm-gray leading-relaxed mb-5">From connection handshake to production-grade scaling. How we built a real-time API handling 50K concurrent connections with Node.js, Redis pub/sub, and a custom heartbeat protocol.</p>
        <div class="flex flex-wrap items-center gap-2 mb-5">
          <span class="tag-code">websocket</span>
          <span class="tag-code purple">node.js</span>
          <span class="tag-code orange">performance</span>
        </div>
        <div class="flex items-center gap-4 text-xs">
          <span class="font-mono text-warm-dim">8 min read</span>
          <span class="text-border">|</span>
          <span class="font-mono text-warm-dim">2.4K views</span>
          <span class="text-border">|</span>
          <span class="font-mono text-term-green cursor-pointer hover:underline">$ read more<span class="cursor-blink-sm"></span></span>
        </div>
      </div>
    </div>
  </section>

  <!-- Tag Filters -->
  <section class="max-w-5xl mx-auto px-6 pb-6 reveal">
    <div class="flex items-center gap-2 mb-2">
      <span class="font-mono text-xs text-warm-dim">$</span>
      <span class="font-mono text-xs text-term-green">filter</span>
      <span class="font-mono text-xs text-warm-gray">--tag</span>
    </div>
    <div class="flex items-center gap-2 flex-wrap" id="tagFilters">
      <button onclick="filterTag('all')" class="tag-filter font-mono text-xs px-3 py-1 rounded border border-term-green/40 bg-term-green/10 text-term-green transition-all active" data-tag="all">*</button>
      <button onclick="filterTag('websocket')" class="tag-filter font-mono text-xs px-3 py-1 rounded border border-border text-warm-dim hover:border-term-green/40 hover:text-term-green transition-all" data-tag="websocket">websocket</button>
      <button onclick="filterTag('react')" class="tag-filter font-mono text-xs px-3 py-1 rounded border border-border text-warm-dim hover:border-term-green/40 hover:text-term-green transition-all" data-tag="react">react</button>
      <button onclick="filterTag('typescript')" class="tag-filter font-mono text-xs px-3 py-1 rounded border border-border text-warm-dim hover:border-term-green/40 hover:text-term-green transition-all" data-tag="typescript">typescript</button>
      <button onclick="filterTag('rust')" class="tag-filter font-mono text-xs px-3 py-1 rounded border border-border text-warm-dim hover:border-term-green/40 hover:text-term-green transition-all" data-tag="rust">rust</button>
      <button onclick="filterTag('devops')" class="tag-filter font-mono text-xs px-3 py-1 rounded border border-border text-warm-dim hover:border-term-green/40 hover:text-term-green transition-all" data-tag="devops">devops</button>
    </div>
  </section>

  <!-- Post List -->
  <section class="max-w-5xl mx-auto px-6 pb-8">
    <div class="font-mono text-xs text-warm-dim mb-4">
      <span class="text-term-green">~</span>/posts <span class="text-warm-dim">$</span> <span class="text-term-green">ls -la</span> <span class="text-warm-gray">--sort=date</span>
    </div>
    <div class="space-y-4" id="postList">

      <!-- Post 1 -->
      <article class="terminal-window cursor-pointer reveal" data-tags="typescript,react" onclick="showArticle(1)">
        <div class="terminal-titlebar">
          <div class="flex items-center gap-2">
            <span class="terminal-dot dot-red"></span>
            <span class="terminal-dot dot-yellow"></span>
            <span class="terminal-dot dot-green"></span>
          </div>
          <span class="font-mono text-xs text-warm-dim ml-2">advanced-typescript-patterns.md</span>
          <span class="ml-auto font-mono text-[10px] text-warm-dim">2024-01-10</span>
        </div>
        <div class="terminal-body">
          <h3 class="font-mono text-sm font-semibold text-warm-white mb-2">Advanced TypeScript Patterns for React Hooks</h3>
          <p class="font-body text-xs text-warm-gray leading-relaxed mb-3">Discriminated unions, branded types, and conditional inference -- patterns that make your custom hooks bulletproof and your API impossible to misuse.</p>
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <span class="tag-code">typescript</span>
            <span class="tag-code blue">react</span>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="font-mono text-warm-dim">12 min read</span>
            <span class="ml-auto font-mono text-term-green text-xs">$ read more<span class="cursor-blink-sm"></span></span>
          </div>
        </div>
      </article>

      <!-- Post 2 -->
      <article class="terminal-window cursor-pointer reveal" data-tags="rust" onclick="showArticle(2)">
        <div class="terminal-titlebar">
          <div class="flex items-center gap-2">
            <span class="terminal-dot dot-red"></span>
            <span class="terminal-dot dot-yellow"></span>
            <span class="terminal-dot dot-green"></span>
          </div>
          <span class="font-mono text-xs text-warm-dim ml-2">rust-error-handling.md</span>
          <span class="ml-auto font-mono text-[10px] text-warm-dim">2024-01-05</span>
        </div>
        <div class="terminal-body">
          <h3 class="font-mono text-sm font-semibold text-warm-white mb-2">Error Handling in Rust: Beyond Result and Option</h3>
          <p class="font-body text-xs text-warm-gray leading-relaxed mb-3">Custom error types, the thiserror/anyhow ecosystem, and building error hierarchies that your future self will thank you for.</p>
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <span class="tag-code orange">rust</span>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="font-mono text-warm-dim">15 min read</span>
            <span class="ml-auto font-mono text-term-green text-xs">$ read more<span class="cursor-blink-sm"></span></span>
          </div>
        </div>
      </article>

      <!-- Post 3 -->
      <article class="terminal-window cursor-pointer reveal" data-tags="devops" onclick="showArticle(3)">
        <div class="terminal-titlebar">
          <div class="flex items-center gap-2">
            <span class="terminal-dot dot-red"></span>
            <span class="terminal-dot dot-yellow"></span>
            <span class="terminal-dot dot-green"></span>
          </div>
          <span class="font-mono text-xs text-warm-dim ml-2">docker-multi-stage.md</span>
          <span class="ml-auto font-mono text-[10px] text-warm-dim">2023-12-28</span>
        </div>
        <div class="terminal-body">
          <h3 class="font-mono text-sm font-semibold text-warm-white mb-2">Docker Multi-Stage Builds: Shrink Your Images by 90%</h3>
          <p class="font-body text-xs text-warm-gray leading-relaxed mb-3">A practical guide to multi-stage Docker builds. From a 1.2GB Node.js image to 120MB -- with zero functionality loss and faster CI pipelines.</p>
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <span class="tag-code pink">devops</span>
            <span class="tag-code">docker</span>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="font-mono text-warm-dim">10 min read</span>
            <span class="ml-auto font-mono text-term-green text-xs">$ read more<span class="cursor-blink-sm"></span></span>
          </div>
        </div>
      </article>

      <!-- Post 4 -->
      <article class="terminal-window cursor-pointer reveal" data-tags="react" onclick="showArticle(4)">
        <div class="terminal-titlebar">
          <div class="flex items-center gap-2">
            <span class="terminal-dot dot-red"></span>
            <span class="terminal-dot dot-yellow"></span>
            <span class="terminal-dot dot-green"></span>
          </div>
          <span class="font-mono text-xs text-warm-dim ml-2">react-server-components.md</span>
          <span class="ml-auto font-mono text-[10px] text-warm-dim">2023-12-20</span>
        </div>
        <div class="terminal-body">
          <h3 class="font-mono text-sm font-semibold text-warm-white mb-2">React Server Components: What Actually Changes</h3>
          <p class="font-body text-xs text-warm-gray leading-relaxed mb-3">Forget the hype. Here is what RSC actually means for your architecture, your bundle size, and your mental model of React rendering.</p>
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <span class="tag-code blue">react</span>
            <span class="tag-code purple">next.js</span>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="font-mono text-warm-dim">14 min read</span>
            <span class="ml-auto font-mono text-term-green text-xs">$ read more<span class="cursor-blink-sm"></span></span>
          </div>
        </div>
      </article>

    </div>
  </section>

  <!-- Code Snippet Section -->
  <section class="max-w-5xl mx-auto px-6 pb-10 reveal">
    <div class="font-mono text-xs text-warm-dim mb-4">
      <span class="text-term-green">~</span>/snippets <span class="text-warm-dim">$</span> <span class="text-term-green">cat</span> <span class="text-warm-gray">websocket-server.js</span>
    </div>
    <div class="terminal-window">
      <div class="terminal-titlebar">
        <div class="flex items-center gap-2">
          <span class="terminal-dot dot-red"></span>
          <span class="terminal-dot dot-yellow"></span>
          <span class="terminal-dot dot-green"></span>
        </div>
        <span class="font-mono text-xs text-warm-dim ml-2">websocket-server.js</span>
        <span class="ml-auto font-mono text-[10px] text-warm-dim">JavaScript</span>
      </div>
      <div class="terminal-body font-mono text-sm leading-relaxed overflow-x-auto">
        <div class="flex">
          <div class="select-none text-right pr-4 text-warm-dim/40 text-xs leading-relaxed" style="min-width:32px;">
            <div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div><div>7</div><div>8</div><div>9</div><div>10</div><div>11</div><div>12</div><div>13</div><div>14</div><div>15</div><div>16</div><div>17</div><div>18</div><div>19</div><div>20</div>
          </div>
          <div class="text-xs leading-relaxed">
<div><span class="syn-keyword">import</span> <span class="syn-punct">{</span> <span class="syn-const">WebSocketServer</span> <span class="syn-punct">}</span> <span class="syn-keyword">from</span> <span class="syn-string">'ws'</span><span class="syn-punct">;</span></div>
<div><span class="syn-keyword">import</span> <span class="syn-punct">{</span> <span class="syn-const">createClient</span> <span class="syn-punct">}</span> <span class="syn-keyword">from</span> <span class="syn-string">'redis'</span><span class="syn-punct">;</span></div>
<div></div>
<div><span class="syn-keyword">const</span> <span class="syn-const">wss</span> <span class="syn-operator">=</span> <span class="syn-keyword">new</span> <span class="syn-func">WebSocketServer</span><span class="syn-punct">({</span> <span class="syn-property">port</span><span class="syn-punct">:</span> <span class="syn-number">8080</span> <span class="syn-punct">});</span></div>
<div><span class="syn-keyword">const</span> <span class="syn-const">redis</span> <span class="syn-operator">=</span> <span class="syn-keyword">await</span> <span class="syn-func">createClient</span><span class="syn-punct">().</span><span class="syn-method">connect</span><span class="syn-punct">();</span></div>
<div></div>
<div><span class="syn-comment">// Subscribe to Redis pub/sub channel</span></div>
<div><span class="syn-keyword">const</span> <span class="syn-const">subscriber</span> <span class="syn-operator">=</span> <span class="syn-const">redis</span><span class="syn-punct">.</span><span class="syn-method">duplicate</span><span class="syn-punct">();</span></div>
<div><span class="syn-keyword">await</span> <span class="syn-const">subscriber</span><span class="syn-punct">.</span><span class="syn-method">connect</span><span class="syn-punct">();</span></div>
<div></div>
<div><span class="syn-const">wss</span><span class="syn-punct">.</span><span class="syn-method">on</span><span class="syn-punct">(</span><span class="syn-string">'connection'</span><span class="syn-punct">,</span> <span class="syn-punct">(</span><span class="syn-param">ws</span><span class="syn-punct">,</span> <span class="syn-param">req</span><span class="syn-punct">)</span> <span class="syn-operator">=></span> <span class="syn-punct">{</span></div>
<div>  <span class="syn-keyword">const</span> <span class="syn-const">clientId</span> <span class="syn-operator">=</span> <span class="syn-const">crypto</span><span class="syn-punct">.</span><span class="syn-method">randomUUID</span><span class="syn-punct">();</span></div>
<div>  <span class="syn-func">console</span><span class="syn-punct">.</span><span class="syn-method">log</span><span class="syn-punct">(</span><span class="syn-string">`[+] Client connected: </span><span class="syn-punct">${</span><span class="syn-const">clientId</span><span class="syn-punct">}</span><span class="syn-string">`</span><span class="syn-punct">);</span></div>
<div></div>
<div>  <span class="syn-comment">// Heartbeat every 30s</span></div>
<div>  <span class="syn-keyword">const</span> <span class="syn-const">heartbeat</span> <span class="syn-operator">=</span> <span class="syn-func">setInterval</span><span class="syn-punct">(() =></span> <span class="syn-punct">{</span></div>
<div>    <span class="syn-keyword">if</span> <span class="syn-punct">(</span><span class="syn-param">ws</span><span class="syn-punct">.</span><span class="syn-property">readyState</span> <span class="syn-operator">===</span> <span class="syn-const">ws</span><span class="syn-punct">.</span><span class="syn-const">OPEN</span><span class="syn-punct">)</span></div>
<div>      <span class="syn-param">ws</span><span class="syn-punct">.</span><span class="syn-method">ping</span><span class="syn-punct">();</span></div>
<div>  <span class="syn-punct">},</span> <span class="syn-number">30_000</span><span class="syn-punct">);</span></div>
<div></div>
<div>  <span class="syn-param">ws</span><span class="syn-punct">.</span><span class="syn-method">on</span><span class="syn-punct">(</span><span class="syn-string">'close'</span><span class="syn-punct">,</span> <span class="syn-punct">()</span> <span class="syn-operator">=></span> <span class="syn-func">clearInterval</span><span class="syn-punct">(</span><span class="syn-const">heartbeat</span><span class="syn-punct">));</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Newsletter -->
  <section class="max-w-5xl mx-auto px-6 pb-12 reveal">
    <div class="terminal-window">
      <div class="terminal-titlebar">
        <div class="flex items-center gap-2">
          <span class="terminal-dot dot-red"></span>
          <span class="terminal-dot dot-yellow"></span>
          <span class="terminal-dot dot-green"></span>
        </div>
        <span class="font-mono text-xs text-warm-dim ml-2">subscribe.sh</span>
      </div>
      <div class="terminal-body p-6">
        <div class="font-mono text-xs text-warm-dim mb-1">
          <span class="text-term-green">~</span> $ <span class="text-warm-gray">./subscribe.sh</span>
        </div>
        <div class="font-mono text-sm text-warm-white mb-4">
          Get new posts delivered to your terminal. No spam, unsubscribe anytime.
        </div>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="flex items-center gap-2 flex-1">
            <span class="font-mono text-xs text-term-green hidden sm:inline">&gt;</span>
            <span class="font-mono text-xs text-warm-gray hidden sm:inline">subscribe --email</span>
            <input type="email" placeholder="you@domain.com" class="term-input flex-1 px-3 py-2 rounded text-sm" onclick="handleAction('subscribe')">
          </div>
          <button onclick="handleAction('subscribe')" class="font-mono text-xs px-4 py-2 bg-term-green/10 border border-term-green/40 text-term-green rounded hover:bg-term-green/20 transition-all cursor-pointer whitespace-nowrap">
            --enter
          </button>
        </div>
      </div>
    </div>
  </section>

</div>

<!-- ARTICLE DETAIL -->
<div id="section-article" class="hidden">
  <div class="max-w-3xl mx-auto px-6 pt-8 pb-20">
    <a onclick="showSection('home')" class="cursor-pointer font-mono text-xs text-warm-dim hover:text-term-green transition-colors inline-flex items-center gap-2 mb-8">
      <span class="text-term-green">$</span> cd ..
    </a>
    <div id="articleContent"></div>
  </div>
</div>

<!-- Footer -->
<footer class="border-t border-border mt-8">
  <div class="max-w-5xl mx-auto px-6 py-6">
    <div class="ascii-line mb-4">+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-</div>
    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
      <div class="font-mono text-xs text-warm-dim">
        <span class="text-warm-gray">&copy; 2024</span> <span class="text-border">|</span> Built with <span class="text-code-pink">&hearts;</span> and <span class="text-code-orange">caffeine</span>
      </div>
      <div class="flex items-center gap-4 font-mono text-xs">
        <a onclick="handleAction('GitHub')" class="cursor-pointer text-warm-dim hover:text-term-green transition-colors">github</a>
        <span class="text-border">|</span>
        <a onclick="handleAction('Twitter')" class="cursor-pointer text-warm-dim hover:text-term-green transition-colors">twitter</a>
        <span class="text-border">|</span>
        <a onclick="handleAction('RSS')" class="cursor-pointer text-warm-dim hover:text-term-green transition-colors">rss</a>
        <span class="text-border">|</span>
        <a onclick="handleAction('Email')" class="cursor-pointer text-warm-dim hover:text-term-green transition-colors">email</a>
      </div>
    </div>
    <div class="font-mono text-[10px] text-warm-dim/40 mt-3 text-center md:text-left">
      PID 4821 | uptime: 365d 12h 34m | load: 0.42
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-elevated border border-term-green/30 text-term-green px-5 py-3 rounded-lg text-xs font-mono shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-50 max-w-sm text-center"></div>

<script>
// Articles data
const articles = [
  {
    title: 'Building a Real-time API with WebSockets',
    filename: 'websocket-realtime-api.md',
    date: '2024-01-15T09:00:00Z',
    readTime: '8 min read',
    tags: ['websocket', 'node.js', 'performance'],
    tagClasses: ['', 'purple', 'orange'],
    body: `
      <p class="font-body text-sm text-warm-gray leading-relaxed mb-6">WebSockets enable full-duplex communication between client and server. But building a production-grade real-time API requires much more than just <code class="font-mono text-xs bg-term-green/10 text-term-green px-1.5 py-0.5 rounded">new WebSocket()</code>. Let me walk you through the architecture we built to handle 50K concurrent connections.</p>

      <h2 class="font-mono text-base font-semibold text-warm-white mb-3 mt-8">## Connection Management</h2>
      <p class="font-body text-sm text-warm-gray leading-relaxed mb-4">Every connected client gets assigned a UUID. We store connection metadata in Redis with a TTL of 60 seconds, refreshed on each heartbeat. This gives us accurate connection counts without expensive in-memory tracking.</p>

      <div class="terminal-window my-6">
        <div class="terminal-titlebar">
          <div class="flex items-center gap-2"><span class="terminal-dot dot-red"></span><span class="terminal-dot dot-yellow"></span><span class="terminal-dot dot-green"></span></div>
          <span class="font-mono text-xs text-warm-dim ml-2">connection-manager.ts</span>
        </div>
        <div class="terminal-body font-mono text-xs leading-relaxed">
<div><span class="syn-keyword">interface</span> <span class="syn-type">ConnectionMeta</span> <span class="syn-punct">{</span></div>
<div>  <span class="syn-property">clientId</span><span class="syn-punct">:</span> <span class="syn-type">string</span><span class="syn-punct">;</span></div>
<div>  <span class="syn-property">connectedAt</span><span class="syn-punct">:</span> <span class="syn-type">number</span><span class="syn-punct">;</span></div>
<div>  <span class="syn-property">lastHeartbeat</span><span class="syn-punct">:</span> <span class="syn-type">number</span><span class="syn-punct">;</span></div>
<div>  <span class="syn-property">subscriptions</span><span class="syn-punct">:</span> <span class="syn-type">Set</span><span class="syn-punct">&lt;</span><span class="syn-type">string</span><span class="syn-punct">&gt;;</span></div>
<div><span class="syn-punct">}</span></div>
        </div>
      </div>

      <h2 class="font-mono text-base font-semibold text-warm-white mb-3 mt-8">## Scaling with Redis Pub/Sub</h2>
      <p class="font-body text-sm text-warm-gray leading-relaxed mb-4">A single Node.js process can handle ~10K WebSocket connections. Beyond that, you need horizontal scaling. Redis pub/sub acts as the message bus between instances -- a message published by Instance A is received by all clients connected to Instance B, C, and D.</p>

      <blockquote class="border-l-2 border-term-green pl-4 my-6 font-body text-sm text-warm-gray italic">The key insight: your WebSocket server should be stateless. All state lives in Redis. This means any instance can handle any client's reconnection.</blockquote>

      <h2 class="font-mono text-base font-semibold text-warm-white mb-3 mt-8">## The Heartbeat Protocol</h2>
      <p class="font-body text-sm text-warm-gray leading-relaxed">Ping every 30s, pong expected within 5s. Three missed pongs = connection terminated. Sounds simple, but getting the timing right across different network conditions took weeks of production tuning.</p>
    `
  },
  {
    title: 'Advanced TypeScript Patterns for React Hooks',
    filename: 'advanced-typescript-patterns.md',
    date: '2024-01-10T14:30:00Z',
    readTime: '12 min read',
    tags: ['typescript', 'react'],
    tagClasses: ['', 'blue'],
    body: `
      <p class="font-body text-sm text-warm-gray leading-relaxed mb-6">TypeScript generics and React hooks are both powerful on their own. Combined, they let you build APIs that are almost impossible to misuse. Here are the patterns I reach for most often.</p>

      <h2 class="font-mono text-base font-semibold text-warm-white mb-3 mt-8">## Discriminated Union States</h2>
      <p class="font-body text-sm text-warm-gray leading-relaxed mb-4">Instead of <code class="font-mono text-xs bg-term-green/10 text-term-green px-1.5 py-0.5 rounded">{ loading: boolean; error?: Error; data?: T }</code>, use a discriminated union. The compiler will enforce that you handle all states.</p>

      <div class="terminal-window my-6">
        <div class="terminal-titlebar">
          <div class="flex items-center gap-2"><span class="terminal-dot dot-red"></span><span class="terminal-dot dot-yellow"></span><span class="terminal-dot dot-green"></span></div>
          <span class="font-mono text-xs text-warm-dim ml-2">useAsync.ts</span>
        </div>
        <div class="terminal-body font-mono text-xs leading-relaxed">
<div><span class="syn-keyword">type</span> <span class="syn-type">AsyncState</span><span class="syn-punct">&lt;</span><span class="syn-type">T</span><span class="syn-punct">&gt;</span> <span class="syn-operator">=</span></div>
<div>  <span class="syn-punct">|</span> <span class="syn-punct">{</span> <span class="syn-property">status</span><span class="syn-punct">:</span> <span class="syn-string">'idle'</span> <span class="syn-punct">}</span></div>
<div>  <span class="syn-punct">|</span> <span class="syn-punct">{</span> <span class="syn-property">status</span><span class="syn-punct">:</span> <span class="syn-string">'loading'</span> <span class="syn-punct">}</span></div>
<div>  <span class="syn-punct">|</span> <span class="syn-punct">{</span> <span class="syn-property">status</span><span class="syn-punct">:</span> <span class="syn-string">'success'</span><span class="syn-punct">;</span> <span class="syn-property">data</span><span class="syn-punct">:</span> <span class="syn-type">T</span> <span class="syn-punct">}</span></div>
<div>  <span class="syn-punct">|</span> <span class="syn-punct">{</span> <span class="syn-property">status</span><span class="syn-punct">:</span> <span class="syn-string">'error'</span><span class="syn-punct">;</span> <span class="syn-property">error</span><span class="syn-punct">:</span> <span class="syn-type">Error</span> <span class="syn-punct">};</span></div>
        </div>
      </div>

      <p class="font-body text-sm text-warm-gray leading-relaxed">Now <code class="font-mono text-xs bg-code-purple/10 text-code-purple px-1.5 py-0.5 rounded">state.data</code> is only accessible when <code class="font-mono text-xs bg-code-purple/10 text-code-purple px-1.5 py-0.5 rounded">status === 'success'</code>. No more runtime <code class="font-mono text-xs bg-code-purple/10 text-code-purple px-1.5 py-0.5 rounded">if (data)</code> guards everywhere.</p>
    `
  },
  {
    title: 'Error Handling in Rust: Beyond Result and Option',
    filename: 'rust-error-handling.md',
    date: '2024-01-05T10:00:00Z',
    readTime: '15 min read',
    tags: ['rust'],
    tagClasses: ['orange'],
    body: `
      <p class="font-body text-sm text-warm-gray leading-relaxed mb-6">Rust's <code class="font-mono text-xs bg-code-orange/10 text-code-orange px-1.5 py-0.5 rounded">Result&lt;T, E&gt;</code> is elegant, but real applications need more than just <code class="font-mono text-xs bg-code-orange/10 text-code-orange px-1.5 py-0.5 rounded">?</code> propagation. Here is how to build error hierarchies that scale.</p>

      <h2 class="font-mono text-base font-semibold text-warm-white mb-3 mt-8">## The Error Ecosystem</h2>
      <p class="font-body text-sm text-warm-gray leading-relaxed mb-4"><strong class="text-warm-white">thiserror</strong> for library code (structured, derive-based). <strong class="text-warm-white">anyhow</strong> for application code (flexible, context-rich). Never the other way around.</p>

      <blockquote class="border-l-2 border-code-orange pl-4 my-6 font-body text-sm text-warm-gray italic">If your library returns anyhow::Error, you are forcing every consumer to depend on anyhow. That is not a library, that is a liability.</blockquote>

      <p class="font-body text-sm text-warm-gray leading-relaxed">The <code class="font-mono text-xs bg-code-orange/10 text-code-orange px-1.5 py-0.5 rounded">#[from]</code> attribute in thiserror lets you build error type trees that mirror your module structure. Each layer catches and wraps errors from the layer below.</p>
    `
  },
  {
    title: 'Docker Multi-Stage Builds: Shrink Your Images by 90%',
    filename: 'docker-multi-stage.md',
    date: '2023-12-28T08:00:00Z',
    readTime: '10 min read',
    tags: ['devops', 'docker'],
    tagClasses: ['pink', ''],
    body: `
      <p class="font-body text-sm text-warm-gray leading-relaxed mb-6">Your production Docker image should not contain build tools, dev dependencies, or source maps. Multi-stage builds make this trivial.</p>

      <div class="terminal-window my-6">
        <div class="terminal-titlebar">
          <div class="flex items-center gap-2"><span class="terminal-dot dot-red"></span><span class="terminal-dot dot-yellow"></span><span class="terminal-dot dot-green"></span></div>
          <span class="font-mono text-xs text-warm-dim ml-2">Dockerfile</span>
        </div>
        <div class="terminal-body font-mono text-xs leading-relaxed">
<div><span class="syn-comment"># Stage 1: Build</span></div>
<div><span class="syn-keyword">FROM</span> <span class="syn-string">node:20-alpine</span> <span class="syn-keyword">AS</span> <span class="syn-type">builder</span></div>
<div><span class="syn-keyword">WORKDIR</span> <span class="syn-string">/app</span></div>
<div><span class="syn-keyword">COPY</span> package*.json ./</div>
<div><span class="syn-keyword">RUN</span> npm ci</div>
<div><span class="syn-keyword">COPY</span> . .</div>
<div><span class="syn-keyword">RUN</span> npm run build</div>
<div></div>
<div><span class="syn-comment"># Stage 2: Production</span></div>
<div><span class="syn-keyword">FROM</span> <span class="syn-string">node:20-alpine</span></div>
<div><span class="syn-keyword">WORKDIR</span> <span class="syn-string">/app</span></div>
<div><span class="syn-keyword">COPY</span> <span class="syn-func">--from=builder</span> /app/dist ./dist</div>
<div><span class="syn-keyword">COPY</span> <span class="syn-func">--from=builder</span> /app/package*.json ./</div>
<div><span class="syn-keyword">RUN</span> npm ci <span class="syn-func">--production</span></div>
<div><span class="syn-keyword">CMD</span> <span class="syn-punct">[</span><span class="syn-string">"node"</span>, <span class="syn-string">"dist/index.js"</span><span class="syn-punct">]</span></div>
        </div>
      </div>

      <p class="font-body text-sm text-warm-gray leading-relaxed">Result: <code class="font-mono text-xs bg-term-green/10 text-term-green px-1.5 py-0.5 rounded">1.2GB -> 120MB</code>. Faster pulls, faster deploys, smaller attack surface.</p>
    `
  },
  {
    title: 'React Server Components: What Actually Changes',
    filename: 'react-server-components.md',
    date: '2023-12-20T11:00:00Z',
    readTime: '14 min read',
    tags: ['react', 'next.js'],
    tagClasses: ['blue', 'purple'],
    body: `
      <p class="font-body text-sm text-warm-gray leading-relaxed mb-6">RSC is not "SSR but better." It is a fundamentally different rendering model. Server Components never ship JavaScript to the client. Client Components still hydrate. The boundary between them is the architecture decision that matters most.</p>

      <h2 class="font-mono text-base font-semibold text-warm-white mb-3 mt-8">## The Mental Model</h2>
      <p class="font-body text-sm text-warm-gray leading-relaxed mb-4">Think of it as two React trees: one on the server, one on the client. Server tree renders first, serializes to a special format (RSC Payload), and the client tree fills in the interactive parts.</p>

      <blockquote class="border-l-2 border-code-blue pl-4 my-6 font-body text-sm text-warm-gray italic">'use client' does not mean "this component runs on the client." It means "this is the boundary where the server tree ends and the client tree begins."</blockquote>

      <p class="font-body text-sm text-warm-gray leading-relaxed">The practical impact: your 200KB charting library stays on the server. Your 50KB date picker that needs onClick? Client component. Choose the boundary wisely.</p>
    `
  }
];

// Show / hide sections
function showSection(name) {
  document.getElementById('section-home').classList.toggle('hidden', name !== 'home');
  document.getElementById('section-article').classList.toggle('hidden', name !== 'article');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'home') {
    setTimeout(revealAll, 100);
  }
}

// Show article detail
function showArticle(index) {
  const a = articles[index];
  if (!a) return;

  const tagHTML = a.tags.map((t, i) => {
    const cls = a.tagClasses[i] ? ' ' + a.tagClasses[i] : '';
    return '<span class="tag-code' + cls + '">' + t + '</span>';
  }).join(' ');

  document.getElementById('articleContent').innerHTML = `
    <div class="terminal-window mb-8">
      <div class="terminal-titlebar">
        <div class="flex items-center gap-2">
          <span class="terminal-dot dot-red"></span>
          <span class="terminal-dot dot-yellow"></span>
          <span class="terminal-dot dot-green"></span>
        </div>
        <span class="font-mono text-xs text-warm-dim ml-2">${a.filename}</span>
      </div>
      <div class="terminal-body p-6 md:p-8">
        <div class="flex items-center gap-2 mb-4">
          <span class="font-mono text-xs text-warm-dim">$</span>
          <span class="font-mono text-xs text-term-green">cat</span>
          <span class="font-mono text-xs text-warm-gray">--date</span>
          <span class="font-mono text-xs text-code-purple">${a.date}</span>
          <span class="font-mono text-xs text-warm-gray ml-2">--read-time</span>
          <span class="font-mono text-xs text-warm-dim">${a.readTime}</span>
        </div>
        <h1 class="font-mono text-xl md:text-2xl font-bold text-warm-white mb-5 leading-tight">${a.title}</h1>
        <div class="flex flex-wrap items-center gap-2">${tagHTML}</div>
      </div>
    </div>
    <div class="article-body">${a.body}</div>
    <div class="border-t border-border mt-10 pt-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">${tagHTML}</div>
        <div class="flex items-center gap-3">
          <button onclick="handleAction('Copy link')" class="font-mono text-xs text-warm-dim hover:text-term-green transition-colors cursor-pointer">$ cp link</button>
          <button onclick="handleAction('Share')" class="font-mono text-xs text-warm-dim hover:text-term-green transition-colors cursor-pointer">$ share</button>
        </div>
      </div>
    </div>
  `;
  showSection('article');
}

// Tag filter
function filterTag(tag) {
  document.querySelectorAll('#tagFilters .tag-filter').forEach(btn => {
    const isActive = btn.dataset.tag === tag;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('border-term-green/40', isActive);
    btn.classList.toggle('bg-term-green/10', isActive);
    btn.classList.toggle('text-term-green', isActive);
    btn.classList.toggle('border-border', !isActive);
    btn.classList.toggle('text-warm-dim', !isActive);
  });

  document.querySelectorAll('#postList article').forEach(card => {
    if (tag === 'all') {
      card.style.display = 'block';
    } else {
      const tags = card.dataset.tags ? card.dataset.tags.split(',') : [];
      card.style.display = tags.includes(tag) ? 'block' : 'none';
    }
  });

  // Also handle featured post
  const featured = document.querySelector('.featured-glow');
  if (featured) {
    if (tag === 'all' || tag === 'websocket') {
      featured.closest('section').style.display = 'block';
    } else {
      featured.closest('section').style.display = 'none';
    }
  }
}

// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = '> ' + msg;
  t.style.opacity = '1';
  t.style.transform = 'translate(-50%, 0)';
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translate(-50%, 8px)';
  }, 2500);
}
function handleAction(a) { showToast(a + ' -- preview only'); }

// Scroll reveal
function revealAll() {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
}

const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// Initial reveal for visible elements
setTimeout(revealAll, 200);
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
