INSERT INTO template_previews (template_id, html_content, version)
VALUES ('6c45e04a-aa32-44bf-b61e-2d6f42ccacde', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DevForge — 開發者工具鏈平台</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans TC',sans-serif;background:#0a0a0f;color:#e2e8f0;overflow-x:hidden}
code,.mono{font-family:'JetBrains Mono',monospace}
.glow-green{text-shadow:0 0 20px rgba(74,222,128,0.3)}
.terminal{background:#0f1117;border:1px solid #1e293b;border-radius:12px;overflow:hidden;font-family:'JetBrains Mono',monospace}
.terminal-bar{background:#161b22;padding:10px 16px;display:flex;align-items:center;gap:8px}
.terminal-dot{width:12px;height:12px;border-radius:50%}
.terminal-body{padding:20px;font-size:13px;line-height:1.8;color:#94a3b8}
.keyword{color:#c084fc}
.string{color:#4ade80}
.func{color:#60a5fa}
.comment{color:#475569}
.num{color:#fbbf24}
.type{color:#f472b6}
.op{color:#94a3b8}
.card{background:#111318;border:1px solid #1e293b;border-radius:16px;padding:32px;transition:all 0.3s}
.card:hover{border-color:#4ade80;transform:translateY(-4px);box-shadow:0 0 30px rgba(74,222,128,0.06)}
.btn-green{background:#4ade80;color:#0a0a0f;border:none;padding:12px 28px;border-radius:10px;font-weight:700;cursor:pointer;transition:all 0.3s;font-size:15px}
.btn-green:hover{background:#22c55e;transform:translateY(-2px);box-shadow:0 8px 24px rgba(74,222,128,0.2)}
.btn-ghost{border:1px solid #374151;color:#e2e8f0;padding:12px 28px;border-radius:10px;font-weight:500;cursor:pointer;transition:all 0.3s;background:transparent;font-size:15px}
.btn-ghost:hover{border-color:#4ade80;color:#4ade80}
.badge{display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600}
.badge-green{background:rgba(74,222,128,0.1);color:#4ade80;border:1px solid rgba(74,222,128,0.2)}
.badge-blue{background:rgba(96,165,250,0.1);color:#60a5fa;border:1px solid rgba(96,165,250,0.2)}
.badge-purple{background:rgba(192,132,252,0.1);color:#c084fc;border:1px solid rgba(192,132,252,0.2)}
.pricing-card{background:#111318;border:1px solid #1e293b;border-radius:20px;padding:36px;transition:all 0.3s;position:relative}
.pricing-card.popular{border-color:#4ade80;box-shadow:0 0 40px rgba(74,222,128,0.08)}
.pricing-card:hover{transform:translateY(-4px)}
.feature-check{color:#4ade80;margin-right:8px}
.nav-dark{backdrop-filter:blur(12px);background:rgba(10,10,15,0.85)}
.toast{position:fixed;bottom:24px;right:24px;background:#4ade80;color:#0a0a0f;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:600;transform:translateY(100px);opacity:0;transition:all 0.4s;z-index:9999;font-family:'JetBrains Mono',monospace}
.toast.show{transform:translateY(0);opacity:1}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.grid-bg{background-image:linear-gradient(rgba(74,222,128,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.03) 1px,transparent 1px);background-size:60px 60px}
.typing-cursor{display:inline-block;width:2px;height:16px;background:#4ade80;animation:blink 1s infinite;vertical-align:middle;margin-left:2px}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.sdk-tab{padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;transition:all 0.2s;background:transparent;color:#6b7280;border:none;font-family:'JetBrains Mono',monospace}
.sdk-tab.active{background:#1e293b;color:#4ade80}
.api-method{display:inline-block;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace}
.api-get{background:rgba(96,165,250,0.15);color:#60a5fa}
.api-post{background:rgba(74,222,128,0.15);color:#4ade80}
.api-put{background:rgba(251,191,36,0.15);color:#fbbf24}
.api-delete{background:rgba(248,113,113,0.15);color:#f87171}
</style>
</head>
<body class="grid-bg">

<div class="toast" id="toast"></div>

<!-- Nav -->
<nav class="nav-dark fixed top-0 left-0 right-0 z-50 border-b border-gray-800" style="padding:12px 0">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:10px;cursor:pointer" onclick="scrollToTop()">
      <div style="font-size:20px;font-weight:800;color:#4ade80;font-family:'JetBrains Mono',monospace">&gt;_</div>
      <span style="font-weight:700;font-size:18px">DevForge</span>
    </div>
    <div style="display:flex;align-items:center;gap:28px" id="nav-links">
      <a href="#features" style="text-decoration:none;color:#6b7280;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">功能</a>
      <a href="#docs" style="text-decoration:none;color:#6b7280;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">文件</a>
      <a href="#pricing" style="text-decoration:none;color:#6b7280;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">方案</a>
      <a href="#changelog" style="text-decoration:none;color:#6b7280;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">更新</a>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <button class="btn-ghost" style="padding:8px 20px;font-size:13px" onclick="showToast('$ devforge login')">登入</button>
      <button class="btn-green" style="padding:8px 20px;font-size:13px" onclick="showToast('$ npm i -g @devforge/cli')">Get Started</button>
    </div>
    <button style="display:none;background:none;border:none;cursor:pointer;padding:8px" id="mobile-toggle" onclick="toggleMobile()">
      <svg width="24" height="24" fill="none" stroke="#e2e8f0" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div id="mobile-menu" style="display:none;padding:16px 24px;border-top:1px solid #1e293b">
    <a href="#features" style="display:block;padding:10px 0;color:#94a3b8;text-decoration:none" onclick="toggleMobile()">功能</a>
    <a href="#docs" style="display:block;padding:10px 0;color:#94a3b8;text-decoration:none" onclick="toggleMobile()">文件</a>
    <a href="#pricing" style="display:block;padding:10px 0;color:#94a3b8;text-decoration:none" onclick="toggleMobile()">方案</a>
    <button class="btn-green" style="width:100%;margin-top:12px" onclick="showToast('$ npm i -g @devforge/cli');toggleMobile()">Get Started</button>
  </div>
</nav>

<!-- Hero -->
<section style="padding:140px 24px 80px;position:relative">
  <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center">
    <div>
      <div style="display:flex;gap:8px;margin-bottom:24px">
        <span class="badge badge-green">v3.2 Released</span>
        <span class="badge badge-purple">CLI + SDK + API</span>
      </div>
      <h1 style="font-size:clamp(2rem,4.5vw,3.5rem);font-weight:800;line-height:1.1;margin-bottom:20px;letter-spacing:-0.03em">
        Build. Ship.<br><span style="color:#4ade80" class="glow-green">Deploy.</span>
      </h1>
      <p style="font-size:17px;color:#94a3b8;line-height:1.7;margin-bottom:32px;max-width:460px">
        DevForge 統一你的開發工具鏈 — CLI 一行部署、SDK 深度整合、API 完整控制。專為現代開發團隊打造。
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:32px">
        <button class="btn-green" onclick="showToast('✓ 已複製安裝指令')">npm install @devforge/cli</button>
        <button class="btn-ghost" onclick="document.getElementById('docs').scrollIntoView({behavior:'smooth'})">查看文件 →</button>
      </div>
      <!-- Install command -->
      <div class="terminal" style="max-width:440px">
        <div class="terminal-bar">
          <div class="terminal-dot" style="background:#ff5f57"></div>
          <div class="terminal-dot" style="background:#ffbd2e"></div>
          <div class="terminal-dot" style="background:#28c840"></div>
          <span style="margin-left:8px;font-size:12px;color:#6b7280;font-family:'JetBrains Mono',monospace">terminal</span>
        </div>
        <div class="terminal-body" style="padding:16px 20px">
          <div><span class="string">$</span> npm i -g @devforge/cli</div>
          <div><span class="string">$</span> devforge init my-project</div>
          <div><span class="string">$</span> devforge deploy --prod</div>
          <div style="margin-top:8px"><span class="string">✓</span> <span style="color:#4ade80">Deployed to production in 12s</span><span class="typing-cursor"></span></div>
        </div>
      </div>
    </div>
    <!-- Hero right: code snippet -->
    <div class="terminal" style="box-shadow:0 20px 60px rgba(0,0,0,0.4)">
      <div class="terminal-bar">
        <div class="terminal-dot" style="background:#ff5f57"></div>
        <div class="terminal-dot" style="background:#ffbd2e"></div>
        <div class="terminal-dot" style="background:#28c840"></div>
        <span style="margin-left:auto;font-size:11px;color:#6b7280;font-family:'JetBrains Mono',monospace">devforge.config.ts</span>
      </div>
      <div class="terminal-body" style="font-size:13px;line-height:2">
        <div><span class="keyword">import</span> { <span class="func">defineConfig</span> } <span class="keyword">from</span> <span class="string">'@devforge/sdk'</span></div>
        <div>&nbsp;</div>
        <div><span class="keyword">export default</span> <span class="func">defineConfig</span>({</div>
        <div>&nbsp;&nbsp;<span class="type">project</span>: <span class="string">'my-saas'</span>,</div>
        <div>&nbsp;&nbsp;<span class="type">runtime</span>: <span class="string">'node-20'</span>,</div>
        <div>&nbsp;&nbsp;<span class="type">regions</span>: [<span class="string">'ap-east'</span>, <span class="string">'us-west'</span>],</div>
        <div>&nbsp;&nbsp;<span class="type">build</span>: {</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;<span class="type">command</span>: <span class="string">'pnpm build'</span>,</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;<span class="type">output</span>: <span class="string">'dist'</span>,</div>
        <div>&nbsp;&nbsp;},</div>
        <div>&nbsp;&nbsp;<span class="type">env</span>: {</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;<span class="type">DATABASE_URL</span>: { <span class="type">secret</span>: <span class="keyword">true</span> },</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;<span class="type">API_KEY</span>: { <span class="type">secret</span>: <span class="keyword">true</span> },</div>
        <div>&nbsp;&nbsp;},</div>
        <div>&nbsp;&nbsp;<span class="type">deploy</span>: {</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;<span class="type">preview</span>: <span class="keyword">true</span>,</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;<span class="type">autoScale</span>: { <span class="type">min</span>: <span class="num">1</span>, <span class="type">max</span>: <span class="num">10</span> },</div>
        <div>&nbsp;&nbsp;},</div>
        <div>})</div>
      </div>
    </div>
  </div>
</section>

<!-- Stats bar -->
<section style="padding:40px 24px;border-top:1px solid #1e293b;border-bottom:1px solid #1e293b">
  <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center">
    <div>
      <div style="font-size:28px;font-weight:800;color:#4ade80" class="glow-green">50K+</div>
      <div style="font-size:13px;color:#6b7280;margin-top:4px">開發者</div>
    </div>
    <div>
      <div style="font-size:28px;font-weight:800;color:#4ade80" class="glow-green">2M+</div>
      <div style="font-size:13px;color:#6b7280;margin-top:4px">部署次數</div>
    </div>
    <div>
      <div style="font-size:28px;font-weight:800;color:#4ade80" class="glow-green">99.99%</div>
      <div style="font-size:13px;color:#6b7280;margin-top:4px">可用率</div>
    </div>
    <div>
      <div style="font-size:28px;font-weight:800;color:#4ade80" class="glow-green">&lt;200ms</div>
      <div style="font-size:13px;color:#6b7280;margin-top:4px">全球延遲</div>
    </div>
  </div>
</section>

<!-- Features -->
<section id="features" style="padding:80px 24px">
  <div style="max-width:1200px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:60px">
      <span class="badge badge-green" style="margin-bottom:16px">FEATURES</span>
      <h2 style="font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;letter-spacing:-0.02em;margin-bottom:16px">開發者需要的一切</h2>
      <p style="color:#6b7280;font-size:16px;max-width:500px;margin:0 auto">從本地開發到全球部署，一套工具搞定。</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
      <div class="reveal card">
        <div style="font-size:28px;margin-bottom:16px">⚡</div>
        <h3 style="font-size:17px;font-weight:700;margin-bottom:8px">12 秒部署</h3>
        <p style="color:#6b7280;font-size:14px;line-height:1.7">Git push 觸發自動部署。增量構建、智能快取，平均部署時間 12 秒。</p>
      </div>
      <div class="reveal card">
        <div style="font-size:28px;margin-bottom:16px">🌍</div>
        <h3 style="font-size:17px;font-weight:700;margin-bottom:8px">全球邊緣網路</h3>
        <p style="color:#6b7280;font-size:14px;line-height:1.7">32 個區域節點，自動就近路由。靜態資產 CDN 加速，API 邊緣運算。</p>
      </div>
      <div class="reveal card">
        <div style="font-size:28px;margin-bottom:16px">🔒</div>
        <h3 style="font-size:17px;font-weight:700;margin-bottom:8px">零信任安全</h3>
        <p style="color:#6b7280;font-size:14px;line-height:1.7">端到端加密、自動 SSL、環境變數保險庫、SOC2 / ISO 27001 認證。</p>
      </div>
      <div class="reveal card">
        <div style="font-size:28px;margin-bottom:16px">📊</div>
        <h3 style="font-size:17px;font-weight:700;margin-bottom:8px">即時觀測</h3>
        <p style="color:#6b7280;font-size:14px;line-height:1.7">內建日誌、指標、追蹤。即時錯誤告警，與 PagerDuty / Slack 整合。</p>
      </div>
      <div class="reveal card">
        <div style="font-size:28px;margin-bottom:16px">🔄</div>
        <h3 style="font-size:17px;font-weight:700;margin-bottom:8px">Preview 環境</h3>
        <p style="color:#6b7280;font-size:14px;line-height:1.7">每個 PR 自動生成獨立預覽環境，附帶完整 URL。合併後自動清除。</p>
      </div>
      <div class="reveal card">
        <div style="font-size:28px;margin-bottom:16px">🧩</div>
        <h3 style="font-size:17px;font-weight:700;margin-bottom:8px">SDK 全語言支援</h3>
        <p style="color:#6b7280;font-size:14px;line-height:1.7">TypeScript、Python、Go、Rust SDK。完整型別定義、自動補全支援。</p>
      </div>
    </div>
  </div>
</section>

<!-- SDK/API Docs -->
<section id="docs" style="padding:80px 24px;background:rgba(17,19,24,0.5)">
  <div style="max-width:1100px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:48px">
      <span class="badge badge-blue" style="margin-bottom:16px">DOCS</span>
      <h2 style="font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;letter-spacing:-0.02em;margin-bottom:16px">強大的 API 與 SDK</h2>
      <p style="color:#6b7280;font-size:16px">RESTful API + 多語言 SDK，5 分鐘完成整合。</p>
    </div>
    <!-- SDK Tabs -->
    <div class="reveal" style="margin-bottom:24px;display:flex;gap:4px;justify-content:center;background:#0f1117;border-radius:10px;padding:6px;max-width:fit-content;margin-left:auto;margin-right:auto">
      <button class="sdk-tab active" onclick="switchSDK(this,'ts')">TypeScript</button>
      <button class="sdk-tab" onclick="switchSDK(this,'py')">Python</button>
      <button class="sdk-tab" onclick="switchSDK(this,'go')">Go</button>
    </div>
    <!-- Code examples -->
    <div class="reveal">
      <div id="sdk-ts" class="terminal" style="max-width:700px;margin:0 auto">
        <div class="terminal-bar">
          <div class="terminal-dot" style="background:#ff5f57"></div>
          <div class="terminal-dot" style="background:#ffbd2e"></div>
          <div class="terminal-dot" style="background:#28c840"></div>
          <span style="margin-left:auto;font-size:11px;color:#6b7280;font-family:'JetBrains Mono',monospace">deploy.ts</span>
        </div>
        <div class="terminal-body" style="font-size:13px;line-height:2">
          <div><span class="keyword">import</span> { DevForge } <span class="keyword">from</span> <span class="string">'@devforge/sdk'</span></div>
          <div>&nbsp;</div>
          <div><span class="keyword">const</span> <span class="func">forge</span> = <span class="keyword">new</span> <span class="func">DevForge</span>({ <span class="type">token</span>: process.env.<span class="type">DEVFORGE_TOKEN</span> })</div>
          <div>&nbsp;</div>
          <div><span class="comment">// Deploy to production</span></div>
          <div><span class="keyword">const</span> deployment = <span class="keyword">await</span> forge.<span class="func">deploy</span>({</div>
          <div>&nbsp;&nbsp;<span class="type">project</span>: <span class="string">'my-saas'</span>,</div>
          <div>&nbsp;&nbsp;<span class="type">branch</span>: <span class="string">'main'</span>,</div>
          <div>&nbsp;&nbsp;<span class="type">env</span>: <span class="string">'production'</span>,</div>
          <div>})</div>
          <div>&nbsp;</div>
          <div>console.<span class="func">log</span>(<span class="string">`Deployed: <span class="op">${</span>deployment.url<span class="op">}</span>`</span>)</div>
          <div><span class="comment">// → Deployed: https://my-saas.devforge.app</span></div>
        </div>
      </div>
      <div id="sdk-py" class="terminal" style="max-width:700px;margin:0 auto;display:none">
        <div class="terminal-bar">
          <div class="terminal-dot" style="background:#ff5f57"></div>
          <div class="terminal-dot" style="background:#ffbd2e"></div>
          <div class="terminal-dot" style="background:#28c840"></div>
          <span style="margin-left:auto;font-size:11px;color:#6b7280;font-family:'JetBrains Mono',monospace">deploy.py</span>
        </div>
        <div class="terminal-body" style="font-size:13px;line-height:2">
          <div><span class="keyword">from</span> devforge <span class="keyword">import</span> DevForge</div>
          <div>&nbsp;</div>
          <div><span class="func">forge</span> = DevForge(<span class="type">token</span>=os.environ[<span class="string">"DEVFORGE_TOKEN"</span>])</div>
          <div>&nbsp;</div>
          <div><span class="comment"># Deploy to production</span></div>
          <div>deployment = forge.<span class="func">deploy</span>(</div>
          <div>&nbsp;&nbsp;<span class="type">project</span>=<span class="string">"my-saas"</span>,</div>
          <div>&nbsp;&nbsp;<span class="type">branch</span>=<span class="string">"main"</span>,</div>
          <div>&nbsp;&nbsp;<span class="type">env</span>=<span class="string">"production"</span>,</div>
          <div>)</div>
          <div>&nbsp;</div>
          <div><span class="func">print</span>(<span class="string">f"Deployed: <span class="op">{</span>deployment.url<span class="op">}</span>"</span>)</div>
          <div><span class="comment"># → Deployed: https://my-saas.devforge.app</span></div>
        </div>
      </div>
      <div id="sdk-go" class="terminal" style="max-width:700px;margin:0 auto;display:none">
        <div class="terminal-bar">
          <div class="terminal-dot" style="background:#ff5f57"></div>
          <div class="terminal-dot" style="background:#ffbd2e"></div>
          <div class="terminal-dot" style="background:#28c840"></div>
          <span style="margin-left:auto;font-size:11px;color:#6b7280;font-family:'JetBrains Mono',monospace">main.go</span>
        </div>
        <div class="terminal-body" style="font-size:13px;line-height:2">
          <div><span class="keyword">package</span> main</div>
          <div>&nbsp;</div>
          <div><span class="keyword">import</span> <span class="string">"github.com/devforge/sdk-go"</span></div>
          <div>&nbsp;</div>
          <div><span class="keyword">func</span> <span class="func">main</span>() {</div>
          <div>&nbsp;&nbsp;forge := devforge.<span class="func">New</span>(os.<span class="func">Getenv</span>(<span class="string">"DEVFORGE_TOKEN"</span>))</div>
          <div>&nbsp;</div>
          <div>&nbsp;&nbsp;d, _ := forge.<span class="func">Deploy</span>(&devforge.DeployConfig{</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;Project: <span class="string">"my-saas"</span>,</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;Branch:  <span class="string">"main"</span>,</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;Env:     <span class="string">"production"</span>,</div>
          <div>&nbsp;&nbsp;})</div>
          <div>&nbsp;&nbsp;fmt.<span class="func">Printf</span>(<span class="string">"Deployed: %s\n"</span>, d.URL)</div>
          <div>}</div>
        </div>
      </div>
    </div>

    <!-- API Reference -->
    <div class="reveal" style="margin-top:48px">
      <h3 style="font-size:18px;font-weight:700;text-align:center;margin-bottom:24px">API 快速參考</h3>
      <div style="max-width:700px;margin:0 auto;display:flex;flex-direction:column;gap:8px">
        <div class="card" style="padding:16px 20px;display:flex;align-items:center;gap:16px;cursor:pointer" onclick="showToast('GET /v1/projects')">
          <span class="api-method api-get">GET</span>
          <span class="mono" style="font-size:13px;color:#94a3b8">/v1/projects</span>
          <span style="margin-left:auto;font-size:12px;color:#6b7280">列出所有專案</span>
        </div>
        <div class="card" style="padding:16px 20px;display:flex;align-items:center;gap:16px;cursor:pointer" onclick="showToast('POST /v1/deployments')">
          <span class="api-method api-post">POST</span>
          <span class="mono" style="font-size:13px;color:#94a3b8">/v1/deployments</span>
          <span style="margin-left:auto;font-size:12px;color:#6b7280">建立部署</span>
        </div>
        <div class="card" style="padding:16px 20px;display:flex;align-items:center;gap:16px;cursor:pointer" onclick="showToast('GET /v1/deployments/:id/logs')">
          <span class="api-method api-get">GET</span>
          <span class="mono" style="font-size:13px;color:#94a3b8">/v1/deployments/:id/logs</span>
          <span style="margin-left:auto;font-size:12px;color:#6b7280">查看部署日誌</span>
        </div>
        <div class="card" style="padding:16px 20px;display:flex;align-items:center;gap:16px;cursor:pointer" onclick="showToast('PUT /v1/env/:project')">
          <span class="api-method api-put">PUT</span>
          <span class="mono" style="font-size:13px;color:#94a3b8">/v1/env/:project</span>
          <span style="margin-left:auto;font-size:12px;color:#6b7280">更新環境變數</span>
        </div>
        <div class="card" style="padding:16px 20px;display:flex;align-items:center;gap:16px;cursor:pointer" onclick="showToast('DELETE /v1/deployments/:id')">
          <span class="api-method api-delete">DELETE</span>
          <span class="mono" style="font-size:13px;color:#94a3b8">/v1/deployments/:id</span>
          <span style="margin-left:auto;font-size:12px;color:#6b7280">刪除部署</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Pricing -->
<section id="pricing" style="padding:80px 24px">
  <div style="max-width:1100px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:60px">
      <span class="badge badge-green" style="margin-bottom:16px">PRICING</span>
      <h2 style="font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;letter-spacing:-0.02em;margin-bottom:16px">開源免費，按需付費</h2>
      <p style="color:#6b7280;font-size:16px">Hobby 永久免費。成長後再升級。</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;align-items:start">
      <div class="reveal pricing-card">
        <div style="font-size:14px;font-weight:600;color:#6b7280;margin-bottom:4px">Hobby</div>
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:16px">
          <span style="font-size:40px;font-weight:800;color:#4ade80">$0</span>
          <span style="font-size:14px;color:#6b7280">/月</span>
        </div>
        <p style="font-size:14px;color:#6b7280;margin-bottom:24px">個人開發者，Side project。</p>
        <button class="btn-ghost" style="width:100%;margin-bottom:24px" onclick="showToast('$ devforge signup --free')">開始使用</button>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 3 個專案</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 100 次部署/月</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 共享運算資源</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 社群支援</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 自動 SSL</div>
        </div>
      </div>
      <div class="reveal pricing-card popular">
        <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#4ade80;color:#0a0a0f;padding:4px 16px;border-radius:20px;font-size:12px;font-weight:700">推薦</div>
        <div style="font-size:14px;font-weight:600;color:#4ade80;margin-bottom:4px">Pro</div>
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:16px">
          <span style="font-size:40px;font-weight:800;color:#4ade80">$20</span>
          <span style="font-size:14px;color:#6b7280">/月/成員</span>
        </div>
        <p style="font-size:14px;color:#6b7280;margin-bottom:24px">團隊協作，正式產品。</p>
        <button class="btn-green" style="width:100%;margin-bottom:24px" onclick="showToast('✓ Pro plan activated')">升級 Pro</button>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 無限專案</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 無限部署</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 專屬運算資源</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> Preview 環境</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 團隊管理</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 優先支援</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 進階分析</div>
        </div>
      </div>
      <div class="reveal pricing-card">
        <div style="font-size:14px;font-weight:600;color:#6b7280;margin-bottom:4px">Enterprise</div>
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:16px">
          <span style="font-size:40px;font-weight:800;color:#e2e8f0">客製</span>
        </div>
        <p style="font-size:14px;color:#6b7280;margin-bottom:24px">大規模部署，合規需求。</p>
        <button class="btn-ghost" style="width:100%;margin-bottom:24px" onclick="showToast('已發送聯繫請求')">聯繫我們</button>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 一切 Pro 功能</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> SSO / SAML</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 99.99% SLA</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> SOC2 報告</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 專屬客戶經理</div>
          <div style="font-size:13px;color:#94a3b8"><span class="feature-check">✓</span> 私有部署</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Changelog -->
<section id="changelog" style="padding:80px 24px;background:rgba(17,19,24,0.5)">
  <div style="max-width:700px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:48px">
      <span class="badge badge-purple" style="margin-bottom:16px">CHANGELOG</span>
      <h2 style="font-size:clamp(1.8rem,3vw,2.4rem);font-weight:800;letter-spacing:-0.02em">最近更新</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:24px">
      <div class="reveal card" style="padding:24px;border-left:3px solid #4ade80">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <span class="badge badge-green">v3.2.0</span>
          <span style="font-size:12px;color:#6b7280">2026-02-10</span>
        </div>
        <h4 style="font-size:15px;font-weight:600;margin-bottom:6px">AI 部署助手 + Edge Functions</h4>
        <p style="font-size:13px;color:#6b7280;line-height:1.7">AI 自動分析建構錯誤並修復。全新 Edge Functions 支援，延遲降低 60%。</p>
      </div>
      <div class="reveal card" style="padding:24px;border-left:3px solid #60a5fa">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <span class="badge badge-blue">v3.1.0</span>
          <span style="font-size:12px;color:#6b7280">2026-01-28</span>
        </div>
        <h4 style="font-size:15px;font-weight:600;margin-bottom:6px">多語言 SDK + Preview 環境</h4>
        <p style="font-size:13px;color:#6b7280;line-height:1.7">新增 Python 和 Go SDK。每個 PR 自動生成 Preview 環境。</p>
      </div>
      <div class="reveal card" style="padding:24px;border-left:3px solid #c084fc">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <span class="badge badge-purple">v3.0.0</span>
          <span style="font-size:12px;color:#6b7280">2026-01-15</span>
        </div>
        <h4 style="font-size:15px;font-weight:600;margin-bottom:6px">DevForge v3 — 完整重寫</h4>
        <p style="font-size:13px;color:#6b7280;line-height:1.7">全新 Rust 核心引擎，部署速度提升 3x。新 CLI、新 Dashboard、新 API。</p>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section style="padding:80px 24px">
  <div class="reveal" style="max-width:800px;margin:0 auto">
    <div class="terminal" style="text-align:center;padding:0">
      <div class="terminal-bar">
        <div class="terminal-dot" style="background:#ff5f57"></div>
        <div class="terminal-dot" style="background:#ffbd2e"></div>
        <div class="terminal-dot" style="background:#28c840"></div>
        <span style="margin-left:auto;font-size:11px;color:#6b7280;font-family:'JetBrains Mono',monospace">get-started</span>
      </div>
      <div style="padding:48px 40px">
        <h2 style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:800;margin-bottom:16px">Ready to <span style="color:#4ade80" class="glow-green">ship</span>?</h2>
        <p style="color:#6b7280;font-size:15px;margin-bottom:28px;max-width:400px;margin-left:auto;margin-right:auto">加入 50,000+ 開發者，用 DevForge 部署你的下一個專案。</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn-green" onclick="showToast('$ npm i -g @devforge/cli ✓')">npm install @devforge/cli</button>
          <button class="btn-ghost" onclick="showToast('文件已在新分頁開啟')">閱讀文件</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer style="padding:48px 24px;border-top:1px solid #1e293b">
  <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px">
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <span style="font-size:20px;font-weight:800;color:#4ade80;font-family:'JetBrains Mono',monospace">&gt;_</span>
        <span style="font-weight:700">DevForge</span>
      </div>
      <p style="font-size:13px;color:#6b7280;line-height:1.7;max-width:280px">現代開發者工具鏈。Build, ship, scale — all in one.</p>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;margin-bottom:16px">產品</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a style="font-size:13px;color:#6b7280;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">CLI</a>
        <a style="font-size:13px;color:#6b7280;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">SDK</a>
        <a style="font-size:13px;color:#6b7280;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">Dashboard</a>
        <a style="font-size:13px;color:#6b7280;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">Edge Functions</a>
      </div>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;margin-bottom:16px">開發者</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a style="font-size:13px;color:#6b7280;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">文件</a>
        <a style="font-size:13px;color:#6b7280;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">API 參考</a>
        <a style="font-size:13px;color:#6b7280;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">狀態頁面</a>
        <a style="font-size:13px;color:#6b7280;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">GitHub</a>
      </div>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;margin-bottom:16px">公司</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a style="font-size:13px;color:#6b7280;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">關於</a>
        <a style="font-size:13px;color:#6b7280;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">部落格</a>
        <a style="font-size:13px;color:#6b7280;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">隱私政策</a>
        <a style="font-size:13px;color:#6b7280;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#4ade80'" onmouseout="this.style.color='#6b7280'">服務條款</a>
      </div>
    </div>
  </div>
  <div style="max-width:1200px;margin:32px auto 0;padding-top:24px;border-top:1px solid #1e293b;text-align:center">
    <p style="font-size:12px;color:#6b7280">© 2026 DevForge. Built with ❤️ for developers.</p>
  </div>
</footer>

<script>
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
function scrollToTop(){window.scrollTo({top:0,behavior:'smooth'})}
function toggleMobile(){const m=document.getElementById('mobile-menu');m.style.display=m.style.display==='none'?'block':'none'}
function switchSDK(btn,lang){document.querySelectorAll('.sdk-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');['ts','py','go'].forEach(l=>{document.getElementById('sdk-'+l).style.display=l===lang?'block':'none'})}
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();const t=document.querySelector(a.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth'})})});
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}})},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
function checkNav(){const w=window.innerWidth;document.getElementById('nav-links').style.display=w<768?'none':'flex';document.getElementById('mobile-toggle').style.display=w<768?'block':'none';if(w>=768)document.getElementById('mobile-menu').style.display='none'}
window.addEventListener('resize',checkNav);checkNav();
</script>

</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
