INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '90220197-6d0b-479a-9b90-db5807ab2568',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Metrix — 智能數據分析平台</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{surface:'#0b0f1a',card:'#111827',elevated:'#1f2937',border:'#374151',text:'#f9fafb',muted:'#9ca3af',dim:'#6b7280',primary:'#818cf8',secondary:'#a78bfa',accent:'#c084fc',cyan:'#22d3ee',pink:'#f472b6'},fontFamily:{sans:['Inter','Noto Sans TC','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'Inter','Noto Sans TC',sans-serif;background:#0b0f1a;color:#f9fafb}
.grad-text{background:linear-gradient(135deg,#818cf8,#c084fc,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.grad-bg{background:linear-gradient(135deg,#818cf8,#a78bfa,#c084fc)}
.grad-border{border-image:linear-gradient(135deg,#818cf8,#c084fc) 1}
.glow-card{transition:all .3s ease}.glow-card:hover{border-color:rgba(129,140,248,.3);box-shadow:0 0 30px rgba(129,140,248,.08)}
.feature-card{transition:all .3s ease}.feature-card:hover{transform:translateY(-4px);border-color:rgba(129,140,248,.3)}
.price-card{transition:all .3s ease}.price-card:hover{transform:translateY(-4px)}
.price-card.featured{border-color:rgba(129,140,248,.4);background:linear-gradient(180deg,rgba(129,140,248,.05),transparent)}
.fade-up{opacity:0;transform:translateY(20px);transition:opacity .7s ease,transform .7s ease}
.fade-up.visible{opacity:1;transform:translateY(0)}
.hero-mesh{position:relative;overflow:hidden}
.hero-mesh::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 30% 30%,rgba(129,140,248,.12) 0%,transparent 50%),radial-gradient(circle at 70% 70%,rgba(192,132,252,.08) 0%,transparent 50%);animation:float 20s ease-in-out infinite}
@keyframes float{0%,100%{transform:translate(0,0)}50%{transform:translate(2%,-2%)}}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0b0f1a}::-webkit-scrollbar-thumb{background:#374151;border-radius:3px}
</style>
</head>
<body>

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-border/50">
<div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
<div class="flex items-center gap-8">
<a href="#" class="flex items-center gap-2"><div class="w-7 h-7 grad-bg rounded-lg flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></div><span class="font-bold text-sm">Metrix</span></a>
<div class="hidden md:flex items-center gap-6">
<a href="#features" class="text-xs text-muted hover:text-text transition-colors">功能</a>
<a href="#pricing" class="text-xs text-muted hover:text-text transition-colors">價格</a>
<a href="#testimonials" class="text-xs text-muted hover:text-text transition-colors">客戶</a>
<a onclick="handleAction('文件')" class="cursor-pointer text-xs text-muted hover:text-text transition-colors">文件</a>
</div>
</div>
<div class="flex items-center gap-3">
<button onclick="handleAction('登入')" class="text-xs text-muted hover:text-text transition-colors hidden md:block">登入</button>
<button onclick="handleAction('免費試用')" class="px-4 py-1.5 grad-bg text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">免費試用</button>
</div>
</div>
</nav>

<!-- Hero -->
<section class="hero-mesh pt-14 min-h-screen flex items-center">
<div class="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
<div class="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-6 fade-up">
<span class="w-1.5 h-1.5 bg-cyan rounded-full animate-pulse"></span>
<span class="text-xs text-primary">全新 AI 洞察引擎已上線</span>
</div>
<h1 class="text-4xl md:text-6xl font-extrabold leading-tight mb-6 fade-up">
讓數據為你<br><span class="grad-text">說出故事</span>
</h1>
<p class="text-sm md:text-base text-muted max-w-xl mx-auto mb-10 leading-relaxed fade-up">
Metrix 是下一代數據分析平台。連接你的資料源，AI 自動發現趨勢、異常和機會。不需要寫 SQL，不需要等報表。
</p>
<div class="flex items-center justify-center gap-3 mb-16 fade-up">
<button onclick="handleAction('免費試用 14 天')" class="px-6 py-3 grad-bg text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">免費試用 14 天 →</button>
<button onclick="handleAction('觀看 Demo')" class="px-6 py-3 border border-border text-muted text-sm rounded-xl hover:border-primary/50 hover:text-text transition-all">
<span class="inline-flex items-center gap-2">▶ 觀看 Demo</span>
</button>
</div>

<!-- Product mock -->
<div class="max-w-4xl mx-auto fade-up">
<div class="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-primary/5">
<!-- Mock toolbar -->
<div class="flex items-center gap-2 px-4 py-3 bg-elevated border-b border-border">
<div class="flex gap-1.5"><span class="w-3 h-3 rounded-full bg-red-500/60"></span><span class="w-3 h-3 rounded-full bg-yellow-500/60"></span><span class="w-3 h-3 rounded-full bg-green-500/60"></span></div>
<div class="flex-1 flex justify-center"><div class="px-8 py-1 bg-surface rounded text-[10px] text-dim">app.metrix.io/dashboard</div></div>
</div>
<!-- Mock dashboard -->
<div class="p-6 grid grid-cols-4 gap-4">
<div class="bg-surface rounded-xl p-4 border border-border/50">
<div class="text-[10px] text-dim mb-1">月營收</div>
<div class="text-lg font-bold">$284.5K</div>
<div class="text-[10px] text-green-400">↑ 12.3%</div>
</div>
<div class="bg-surface rounded-xl p-4 border border-border/50">
<div class="text-[10px] text-dim mb-1">活躍用戶</div>
<div class="text-lg font-bold">45.2K</div>
<div class="text-[10px] text-green-400">↑ 8.7%</div>
</div>
<div class="bg-surface rounded-xl p-4 border border-border/50">
<div class="text-[10px] text-dim mb-1">轉換率</div>
<div class="text-lg font-bold">3.24%</div>
<div class="text-[10px] text-red-400">↓ 0.5%</div>
</div>
<div class="bg-surface rounded-xl p-4 border border-border/50">
<div class="text-[10px] text-dim mb-1">NPS</div>
<div class="text-lg font-bold">72</div>
<div class="text-[10px] text-green-400">↑ 4</div>
</div>
<!-- Chart area -->
<div class="col-span-4 bg-surface rounded-xl p-4 border border-border/50 h-32 flex items-end gap-1">
<div class="flex-1 bg-primary/20 rounded-t" style="height:40%"></div>
<div class="flex-1 bg-primary/30 rounded-t" style="height:55%"></div>
<div class="flex-1 bg-primary/20 rounded-t" style="height:45%"></div>
<div class="flex-1 bg-primary/40 rounded-t" style="height:65%"></div>
<div class="flex-1 bg-primary/30 rounded-t" style="height:50%"></div>
<div class="flex-1 bg-primary/50 rounded-t" style="height:75%"></div>
<div class="flex-1 bg-primary/40 rounded-t" style="height:60%"></div>
<div class="flex-1 bg-primary/60 rounded-t" style="height:85%"></div>
<div class="flex-1 bg-primary/50 rounded-t" style="height:70%"></div>
<div class="flex-1 bg-primary/70 rounded-t" style="height:90%"></div>
<div class="flex-1 bg-primary/60 rounded-t" style="height:80%"></div>
<div class="flex-1 bg-primary rounded-t" style="height:95%"></div>
</div>
</div>
</div>
</div>

<!-- Logos -->
<div class="mt-14 fade-up">
<p class="text-xs text-dim mb-4">超過 2,000 家企業信任</p>
<div class="flex items-center justify-center gap-8 flex-wrap opacity-40">
<span class="text-sm font-bold">Shopify</span>
<span class="text-sm font-bold">Stripe</span>
<span class="text-sm font-bold">Notion</span>
<span class="text-sm font-bold">Linear</span>
<span class="text-sm font-bold">Vercel</span>
</div>
</div>
</div>
</section>

<!-- Features -->
<section id="features" class="py-20 px-6">
<div class="max-w-6xl mx-auto">
<div class="text-center mb-12 fade-up">
<span class="text-xs text-primary font-semibold uppercase tracking-widest">Features</span>
<h2 class="text-3xl font-extrabold mt-2">為什麼選擇 Metrix</h2>
<p class="text-sm text-muted mt-2 max-w-md mx-auto">從資料連接到洞察產出，一站搞定。</p>
</div>
<div class="grid md:grid-cols-3 gap-4">
<div class="feature-card bg-card border border-border rounded-2xl p-6 fade-up">
<div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
<h3 class="font-bold mb-2">AI 自動洞察</h3>
<p class="text-xs text-muted leading-relaxed">不用問問題，AI 主動發現數據中的趨勢、異常和機會，每天推送個人化報告。</p>
</div>
<div class="feature-card bg-card border border-border rounded-2xl p-6 fade-up">
<div class="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center mb-4"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
<h3 class="font-bold mb-2">200+ 資料源</h3>
<p class="text-xs text-muted leading-relaxed">一鍵連接 Google Analytics、Stripe、Shopify、PostgreSQL 等 200+ 資料源，5 分鐘內開始分析。</p>
</div>
<div class="feature-card bg-card border border-border rounded-2xl p-6 fade-up">
<div class="w-10 h-10 bg-cyan/10 rounded-xl flex items-center justify-center mb-4"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></div>
<h3 class="font-bold mb-2">拖拉式儀表板</h3>
<p class="text-xs text-muted leading-relaxed">直覺的視覺化建構工具。拖拉圖表、設定篩選器、即時協作。不需要工程師介入。</p>
</div>
<div class="feature-card bg-card border border-border rounded-2xl p-6 fade-up">
<div class="w-10 h-10 bg-pink/10 rounded-xl flex items-center justify-center mb-4"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>
<h3 class="font-bold mb-2">團隊協作</h3>
<p class="text-xs text-muted leading-relaxed">分享儀表板、標註數據、設定告警。讓整個團隊都能用數據做決策。</p>
</div>
<div class="feature-card bg-card border border-border rounded-2xl p-6 fade-up">
<div class="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mb-4"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
<h3 class="font-bold mb-2">企業級安全</h3>
<p class="text-xs text-muted leading-relaxed">SOC 2 Type II 認證、端對端加密、RBAC 權限控制。你的數據只屬於你。</p>
</div>
<div class="feature-card bg-card border border-border rounded-2xl p-6 fade-up">
<div class="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg></div>
<h3 class="font-bold mb-2">排程報表</h3>
<p class="text-xs text-muted leading-relaxed">設定每日 / 每週自動報表，推送到 Email、Slack 或 LINE。再也不用手動截圖。</p>
</div>
</div>
</div>
</section>

<!-- Pricing -->
<section id="pricing" class="py-20 px-6 bg-card/50">
<div class="max-w-5xl mx-auto">
<div class="text-center mb-12 fade-up">
<span class="text-xs text-primary font-semibold uppercase tracking-widest">Pricing</span>
<h2 class="text-3xl font-extrabold mt-2">簡單透明的價格</h2>
<p class="text-sm text-muted mt-2">14 天免費試用，不需要信用卡。</p>
</div>
<div class="grid md:grid-cols-3 gap-5">
<div class="price-card bg-card border border-border rounded-2xl p-6 fade-up">
<div class="text-xs text-muted mb-4 uppercase tracking-wider">Starter</div>
<div class="flex items-baseline gap-1 mb-1"><span class="text-3xl font-extrabold">$29</span><span class="text-sm text-dim">/月</span></div>
<p class="text-xs text-dim mb-6">適合個人和小團隊</p>
<ul class="space-y-2 mb-8 text-xs text-muted">
<li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>5 個資料源</li>
<li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>10 個儀表板</li>
<li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>基礎 AI 洞察</li>
<li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>3 位成員</li>
</ul>
<button onclick="handleAction('Starter 方案')" class="w-full py-2.5 border border-border text-muted rounded-xl text-sm hover:border-primary hover:text-text transition-all">開始試用</button>
</div>

<div class="price-card featured bg-card border border-primary/30 rounded-2xl p-6 relative fade-up">
<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 grad-bg text-white text-[10px] font-bold rounded-full">推薦</div>
<div class="text-xs text-primary mb-4 uppercase tracking-wider">Pro</div>
<div class="flex items-baseline gap-1 mb-1"><span class="text-3xl font-extrabold grad-text">$79</span><span class="text-sm text-dim">/月</span></div>
<p class="text-xs text-dim mb-6">適合成長中的團隊</p>
<ul class="space-y-2 mb-8 text-xs text-muted">
<li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>無限資料源</li>
<li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>無限儀表板</li>
<li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>進階 AI 洞察 + 預測</li>
<li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>15 位成員</li>
<li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>排程報表 + Slack</li>
</ul>
<button onclick="handleAction('Pro 方案')" class="w-full py-2.5 grad-bg text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">開始試用</button>
</div>

<div class="price-card bg-card border border-border rounded-2xl p-6 fade-up">
<div class="text-xs text-muted mb-4 uppercase tracking-wider">Enterprise</div>
<div class="flex items-baseline gap-1 mb-1"><span class="text-3xl font-extrabold">客製</span></div>
<p class="text-xs text-dim mb-6">適合大型企業</p>
<ul class="space-y-2 mb-8 text-xs text-muted">
<li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>所有 Pro 功能</li>
<li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>SSO / SAML</li>
<li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>專屬客戶經理</li>
<li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>SLA 99.9%</li>
<li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>自建部署選項</li>
</ul>
<button onclick="handleAction('Enterprise 方案')" class="w-full py-2.5 border border-border text-muted rounded-xl text-sm hover:border-primary hover:text-text transition-all">聯繫銷售</button>
</div>
</div>
</div>
</section>

<!-- Testimonials -->
<section id="testimonials" class="py-20 px-6">
<div class="max-w-5xl mx-auto">
<div class="text-center mb-12 fade-up">
<h2 class="text-3xl font-extrabold">客戶怎麼說</h2>
</div>
<div class="grid md:grid-cols-3 gap-4">
<div class="glow-card bg-card border border-border rounded-2xl p-5 fade-up">
<div class="flex items-center gap-1 text-yellow-400 mb-3 text-xs">★★★★★</div>
<p class="text-xs text-muted leading-relaxed mb-4">"以前每週花 4 小時做報表，現在 Metrix 的 AI 自動幫我做好，而且洞察比我手動分析的還準確。"</p>
<div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">K</div><div><div class="text-xs font-semibold">Kevin Lin</div><div class="text-[10px] text-dim">數據分析師 @ PChome</div></div></div>
</div>
<div class="glow-card bg-card border border-border rounded-2xl p-5 fade-up">
<div class="flex items-center gap-1 text-yellow-400 mb-3 text-xs">★★★★★</div>
<p class="text-xs text-muted leading-relaxed mb-4">"團隊裡不會 SQL 的 PM 也能自己建儀表板了。Metrix 真正實現了『數據民主化』。"</p>
<div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary">S</div><div><div class="text-xs font-semibold">Sarah Wu</div><div class="text-[10px] text-dim">VP of Product @ 91APP</div></div></div>
</div>
<div class="glow-card bg-card border border-border rounded-2xl p-5 fade-up">
<div class="flex items-center gap-1 text-yellow-400 mb-3 text-xs">★★★★★</div>
<p class="text-xs text-muted leading-relaxed mb-4">"從 Tableau 遷移到 Metrix，成本降了 60%，速度反而快了。AI 預測功能是殺手級應用。"</p>
<div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-cyan/20 flex items-center justify-center text-[10px] font-bold text-cyan">J</div><div><div class="text-xs font-semibold">Jason Chen</div><div class="text-[10px] text-dim">CTO @ 新創公司</div></div></div>
</div>
</div>
</div>
</section>

<!-- CTA -->
<section class="py-20 px-6 relative overflow-hidden">
<div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10"></div>
<div class="relative z-10 max-w-2xl mx-auto text-center fade-up">
<h2 class="text-3xl font-extrabold mb-4">準備好讓數據說話了嗎？</h2>
<p class="text-sm text-muted mb-8">14 天免費試用，不需要信用卡。5 分鐘內連接你的第一個資料源。</p>
<button onclick="handleAction('開始免費試用')" class="px-8 py-3.5 grad-bg text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">開始免費試用 →</button>
</div>
</section>

<!-- Footer -->
<footer class="border-t border-border py-10 px-6">
<div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
<div>
<div class="flex items-center gap-2 mb-3"><div class="w-6 h-6 grad-bg rounded-md flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></div><span class="font-bold text-sm">Metrix</span></div>
<p class="text-xs text-dim max-w-xs">下一代數據分析平台。讓每個人都能用數據做出更好的決策。</p>
</div>
<div class="grid grid-cols-3 gap-10">
<div><h4 class="text-xs font-semibold mb-3">產品</h4><div class="space-y-1.5"><a onclick="handleAction('功能')" class="block text-xs text-dim hover:text-text cursor-pointer transition-colors">功能</a><a onclick="handleAction('價格')" class="block text-xs text-dim hover:text-text cursor-pointer transition-colors">價格</a><a onclick="handleAction('整合')" class="block text-xs text-dim hover:text-text cursor-pointer transition-colors">整合</a><a onclick="handleAction('Changelog')" class="block text-xs text-dim hover:text-text cursor-pointer transition-colors">Changelog</a></div></div>
<div><h4 class="text-xs font-semibold mb-3">資源</h4><div class="space-y-1.5"><a onclick="handleAction('文件')" class="block text-xs text-dim hover:text-text cursor-pointer transition-colors">文件</a><a onclick="handleAction('API')" class="block text-xs text-dim hover:text-text cursor-pointer transition-colors">API</a><a onclick="handleAction('Blog')" class="block text-xs text-dim hover:text-text cursor-pointer transition-colors">Blog</a></div></div>
<div><h4 class="text-xs font-semibold mb-3">公司</h4><div class="space-y-1.5"><a onclick="handleAction('關於我們')" class="block text-xs text-dim hover:text-text cursor-pointer transition-colors">關於我們</a><a onclick="handleAction('隱私權')" class="block text-xs text-dim hover:text-text cursor-pointer transition-colors">隱私權</a><a onclick="handleAction('聯繫')" class="block text-xs text-dim hover:text-text cursor-pointer transition-colors">聯繫</a></div></div>
</div>
</div>
<div class="max-w-6xl mx-auto border-t border-border mt-8 pt-6 text-center"><p class="text-[10px] text-dim">© 2024-2026 Metrix Inc. All rights reserved.</p></div>
</footer>

<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-primary/20 text-text px-5 py-3 rounded-xl text-xs shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-50 max-w-sm text-center"></div>
<script>
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.style.opacity='1';t.style.transform='translate(-50%,0)';setTimeout(()=>{t.style.opacity='0';t.style.transform='translate(-50%,8px)'},2500)}
function handleAction(a){showToast(a+' — 此為模板展示')}
const obs=new IntersectionObserver(e=>{e.forEach(el=>{if(el.isIntersecting)el.target.classList.add('visible')})},{threshold:.1});document.querySelectorAll('.fade-up').forEach(el=>obs.observe(el))
</script>
</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
