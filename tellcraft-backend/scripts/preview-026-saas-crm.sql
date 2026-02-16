INSERT INTO template_previews (template_id, html_content, version)
VALUES ('fc3fdafe-3022-49fc-b814-97b10c276dd3', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SalesPilot — 智慧 CRM 銷售平台</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans TC',sans-serif;background:#ffffff;color:#1a1a2e;overflow-x:hidden}
.gradient-text{background:linear-gradient(135deg,#16a34a,#059669);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-glow{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(22,163,74,0.08),transparent 70%);pointer-events:none}
.card-hover{transition:all 0.3s ease}
.card-hover:hover{transform:translateY(-4px);box-shadow:0 20px 40px rgba(0,0,0,0.08)}
.btn-primary{background:linear-gradient(135deg,#16a34a,#059669);color:#fff;border:none;padding:12px 28px;border-radius:10px;font-weight:600;cursor:pointer;transition:all 0.3s;font-size:15px}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(22,163,74,0.3)}
.btn-outline{border:1.5px solid #d1d5db;color:#374151;padding:12px 28px;border-radius:10px;font-weight:500;cursor:pointer;transition:all 0.3s;background:transparent;font-size:15px}
.btn-outline:hover{border-color:#16a34a;color:#16a34a}
.feature-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px}
.stat-card{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:24px;text-align:center}
.pricing-card{border:1.5px solid #e5e7eb;border-radius:20px;padding:36px;transition:all 0.3s;position:relative;background:#fff}
.pricing-card.popular{border-color:#16a34a;box-shadow:0 8px 32px rgba(22,163,74,0.12)}
.pricing-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,0.08)}
.check-icon{color:#16a34a;margin-right:8px;font-weight:700}
.pipeline-col{min-width:260px;background:#f9fafb;border-radius:12px;padding:16px}
.deal-card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:10px;cursor:grab;transition:all 0.2s}
.deal-card:hover{box-shadow:0 4px 12px rgba(0,0,0,0.06)}
.avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#fff}
.nav-blur{backdrop-filter:blur(12px);background:rgba(255,255,255,0.85)}
.toast{position:fixed;bottom:24px;right:24px;background:#065f46;color:#fff;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:500;transform:translateY(100px);opacity:0;transition:all 0.4s;z-index:9999}
.toast.show{transform:translateY(0);opacity:1}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.tab-btn{padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:500;font-size:14px;border:none;transition:all 0.2s;background:transparent;color:#6b7280}
.tab-btn.active{background:#16a34a;color:#fff}
.integrations-scroll{display:flex;gap:24px;animation:scroll-logos 20s linear infinite}
@keyframes scroll-logos{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.metric-bar{height:8px;border-radius:4px;background:#e5e7eb;overflow:hidden}
.metric-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#16a34a,#059669);transition:width 1.5s ease}
</style>
</head>
<body>

<!-- Toast -->
<div class="toast" id="toast"></div>

<!-- Nav -->
<nav class="nav-blur fixed top-0 left-0 right-0 z-50 border-b border-gray-100" style="padding:14px 0">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:8px;cursor:pointer" onclick="scrollToTop()">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#16a34a,#059669);display:flex;align-items:center;justify-content:center">
        <svg width="20" height="20" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      </div>
      <span style="font-weight:700;font-size:18px">SalesPilot</span>
    </div>
    <div style="display:flex;align-items:center;gap:32px" id="nav-links">
      <a href="#features" style="text-decoration:none;color:#6b7280;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#6b7280'">功能</a>
      <a href="#demo" style="text-decoration:none;color:#6b7280;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#6b7280'">產品演示</a>
      <a href="#pricing" style="text-decoration:none;color:#6b7280;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#6b7280'">方案</a>
      <a href="#testimonials" style="text-decoration:none;color:#6b7280;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#6b7280'">客戶評價</a>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <button class="btn-outline" style="padding:8px 20px;font-size:13px" onclick="showToast('登入功能開發中')">登入</button>
      <button class="btn-primary" style="padding:8px 20px;font-size:13px" onclick="showToast('🎉 歡迎試用！')">免費試用</button>
    </div>
    <button style="display:none;background:none;border:none;cursor:pointer;padding:8px" id="mobile-toggle" onclick="toggleMobile()">
      <svg width="24" height="24" fill="none" stroke="#374151" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div id="mobile-menu" style="display:none;padding:16px 24px;border-top:1px solid #f3f4f6">
    <a href="#features" style="display:block;padding:10px 0;color:#374151;text-decoration:none;font-weight:500" onclick="toggleMobile()">功能</a>
    <a href="#demo" style="display:block;padding:10px 0;color:#374151;text-decoration:none;font-weight:500" onclick="toggleMobile()">產品演示</a>
    <a href="#pricing" style="display:block;padding:10px 0;color:#374151;text-decoration:none;font-weight:500" onclick="toggleMobile()">方案</a>
    <a href="#testimonials" style="display:block;padding:10px 0;color:#374151;text-decoration:none;font-weight:500" onclick="toggleMobile()">客戶評價</a>
    <button class="btn-primary" style="width:100%;margin-top:12px" onclick="showToast('🎉 歡迎試用！');toggleMobile()">免費試用</button>
  </div>
</nav>

<!-- Hero -->
<section style="padding:140px 24px 80px;position:relative;overflow:hidden">
  <div class="hero-glow" style="top:-200px;right:-100px"></div>
  <div class="hero-glow" style="bottom:-300px;left:-200px"></div>
  <div style="max-width:1200px;margin:0 auto;text-align:center;position:relative;z-index:1">
    <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:6px 16px;font-size:13px;color:#16a34a;font-weight:500;margin-bottom:24px">
      🚀 全新 AI 助手功能上線 — 自動化銷售流程
    </div>
    <h1 style="font-size:clamp(2.2rem,5vw,3.8rem);font-weight:800;line-height:1.15;margin-bottom:20px;letter-spacing:-0.03em">
      讓每一筆交易<br><span class="gradient-text">加速成交</span>
    </h1>
    <p style="font-size:18px;color:#6b7280;max-width:560px;margin:0 auto 36px;line-height:1.7">
      SalesPilot 整合客戶管理、銷售漏斗、自動化工作流，<br>幫助你的團隊用更少時間達成更多目標。
    </p>
    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:48px">
      <button class="btn-primary" style="padding:14px 32px;font-size:16px" onclick="showToast('🎉 14 天免費試用開始！')">免費試用 14 天</button>
      <button class="btn-outline" style="padding:14px 32px;font-size:16px" onclick="document.getElementById('demo').scrollIntoView({behavior:'smooth'})">
        <span style="margin-right:6px">▶</span> 觀看演示
      </button>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;max-width:700px;margin:0 auto">
      <div class="stat-card">
        <div style="font-size:28px;font-weight:800;color:#16a34a">3,200+</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px">企業客戶</div>
      </div>
      <div class="stat-card">
        <div style="font-size:28px;font-weight:800;color:#16a34a">47%</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px">成交率提升</div>
      </div>
      <div class="stat-card">
        <div style="font-size:28px;font-weight:800;color:#16a34a">$2.8B</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px">管理交易額</div>
      </div>
      <div class="stat-card">
        <div style="font-size:28px;font-weight:800;color:#16a34a">99.9%</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px">服務可用率</div>
      </div>
    </div>
  </div>
</section>

<!-- Trusted by -->
<section style="padding:40px 24px 60px;border-top:1px solid #f3f4f6">
  <div style="max-width:1200px;margin:0 auto;text-align:center">
    <p style="font-size:13px;color:#9ca3af;font-weight:500;text-transform:uppercase;letter-spacing:2px;margin-bottom:24px">超過 3,200 家企業信賴</p>
    <div style="display:flex;justify-content:center;gap:48px;align-items:center;flex-wrap:wrap;opacity:0.4">
      <span style="font-size:20px;font-weight:700;color:#374151">Shopee</span>
      <span style="font-size:20px;font-weight:700;color:#374151">LINE</span>
      <span style="font-size:20px;font-weight:700;color:#374151">91APP</span>
      <span style="font-size:20px;font-weight:700;color:#374151">Pinkoi</span>
      <span style="font-size:20px;font-weight:700;color:#374151">KKday</span>
      <span style="font-size:20px;font-weight:700;color:#374151">Dcard</span>
    </div>
  </div>
</section>

<!-- Features -->
<section id="features" style="padding:80px 24px;background:#f9fafb">
  <div style="max-width:1200px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:60px">
      <div style="font-size:13px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">核心功能</div>
      <h2 style="font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;letter-spacing:-0.02em;margin-bottom:16px">一站式銷售管理工具</h2>
      <p style="color:#6b7280;font-size:16px;max-width:500px;margin:0 auto">從潛在客戶到成交，每個環節都有 SalesPilot 陪你。</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      <div class="reveal card-hover" style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
        <div class="feature-icon" style="background:#f0fdf4;margin-bottom:16px">📊</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">智能銷售漏斗</h3>
        <p style="color:#6b7280;font-size:14px;line-height:1.7">可視化銷售管線，拖拽管理交易進度。AI 自動預測成交機率與最佳跟進時機。</p>
      </div>
      <div class="reveal card-hover" style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
        <div class="feature-icon" style="background:#eff6ff;margin-bottom:16px">🤖</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">AI 銷售助手</h3>
        <p style="color:#6b7280;font-size:14px;line-height:1.7">根據客戶行為自動生成跟進建議、郵件草稿、通話摘要，大幅節省行政時間。</p>
      </div>
      <div class="reveal card-hover" style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
        <div class="feature-icon" style="background:#fef3c7;margin-bottom:16px">⚡</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">自動化工作流</h3>
        <p style="color:#6b7280;font-size:14px;line-height:1.7">設定觸發條件與動作，自動分配潛在客戶、發送提醒、更新階段，零手動介入。</p>
      </div>
      <div class="reveal card-hover" style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
        <div class="feature-icon" style="background:#fce7f3;margin-bottom:16px">👥</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">360° 客戶檢視</h3>
        <p style="color:#6b7280;font-size:14px;line-height:1.7">集中管理聯絡人、通話紀錄、郵件往來、會議排程，一頁掌握客戶全貌。</p>
      </div>
      <div class="reveal card-hover" style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
        <div class="feature-icon" style="background:#f0fdf4;margin-bottom:16px">📈</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">即時業績報表</h3>
        <p style="color:#6b7280;font-size:14px;line-height:1.7">個人與團隊目標追蹤，自動生成週報月報。多維度交叉分析銷售數據。</p>
      </div>
      <div class="reveal card-hover" style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
        <div class="feature-icon" style="background:#ede9fe;margin-bottom:16px">🔗</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">200+ 串接整合</h3>
        <p style="color:#6b7280;font-size:14px;line-height:1.7">Gmail、Slack、Zoom、LINE、Google Calendar、Notion 等工具一鍵串接。</p>
      </div>
    </div>
  </div>
</section>

<!-- Product Demo - Pipeline -->
<section id="demo" style="padding:80px 24px">
  <div style="max-width:1200px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:48px">
      <div style="font-size:13px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">產品演示</div>
      <h2 style="font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;letter-spacing:-0.02em;margin-bottom:16px">直覺式銷售管線</h2>
      <p style="color:#6b7280;font-size:16px">拖拽交易卡片，即時更新銷售進度。</p>
    </div>
    <div class="reveal" style="background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:24px;overflow-x:auto;box-shadow:0 4px 24px rgba(0,0,0,0.04)">
      <!-- Pipeline Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding:0 8px">
        <div style="display:flex;gap:8px">
          <button class="tab-btn active" onclick="switchPipeView(this,'pipeline')">管線檢視</button>
          <button class="tab-btn" onclick="switchPipeView(this,'list')">列表檢視</button>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-size:13px;color:#9ca3af">總交易額</span>
          <span style="font-size:18px;font-weight:700;color:#16a34a">$4,285,000</span>
        </div>
      </div>
      <!-- Pipeline Columns -->
      <div style="display:flex;gap:16px;min-width:1100px">
        <!-- Lead -->
        <div class="pipeline-col">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span style="font-size:13px;font-weight:600;color:#6b7280">潛在客戶</span>
            <span style="background:#e5e7eb;border-radius:10px;padding:2px 8px;font-size:12px;font-weight:600">4</span>
          </div>
          <div class="deal-card" onclick="showToast('查看交易：台積電 ERP 升級')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;font-weight:600">台積電 ERP 升級</span>
              <div class="avatar" style="background:#7c3aed">林</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:#16a34a;margin-bottom:6px">$1,200,000</div>
            <div class="metric-bar"><div class="metric-fill" style="width:25%"></div></div>
            <div style="font-size:11px;color:#9ca3af;margin-top:4px">25% 成交率</div>
          </div>
          <div class="deal-card" onclick="showToast('查看交易：鴻海自動化方案')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;font-weight:600">鴻海自動化方案</span>
              <div class="avatar" style="background:#2563eb">陳</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:#16a34a;margin-bottom:6px">$850,000</div>
            <div class="metric-bar"><div class="metric-fill" style="width:15%"></div></div>
            <div style="font-size:11px;color:#9ca3af;margin-top:4px">15% 成交率</div>
          </div>
          <div class="deal-card" onclick="showToast('查看交易：聯發科 AI 模組')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;font-weight:600">聯發科 AI 模組</span>
              <div class="avatar" style="background:#ea580c">王</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:#16a34a">$680,000</div>
          </div>
          <div class="deal-card" onclick="showToast('查看交易：遠東百貨 POS')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;font-weight:600">遠東百貨 POS</span>
              <div class="avatar" style="background:#0891b2">張</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:#16a34a">$320,000</div>
          </div>
        </div>
        <!-- Qualified -->
        <div class="pipeline-col">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span style="font-size:13px;font-weight:600;color:#6b7280">需求確認</span>
            <span style="background:#dbeafe;border-radius:10px;padding:2px 8px;font-size:12px;font-weight:600;color:#2563eb">3</span>
          </div>
          <div class="deal-card" onclick="showToast('查看交易：國泰金控')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;font-weight:600">國泰金控 CMS</span>
              <div class="avatar" style="background:#16a34a">李</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:#16a34a;margin-bottom:6px">$560,000</div>
            <div class="metric-bar"><div class="metric-fill" style="width:45%"></div></div>
            <div style="font-size:11px;color:#9ca3af;margin-top:4px">45% 成交率</div>
          </div>
          <div class="deal-card" onclick="showToast('查看交易：MOMO 數據平台')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;font-weight:600">MOMO 數據平台</span>
              <div class="avatar" style="background:#dc2626">黃</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:#16a34a">$420,000</div>
          </div>
          <div class="deal-card" onclick="showToast('查看交易：誠品書店')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;font-weight:600">誠品書店 OMO</span>
              <div class="avatar" style="background:#7c3aed">趙</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:#16a34a">$185,000</div>
          </div>
        </div>
        <!-- Proposal -->
        <div class="pipeline-col">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span style="font-size:13px;font-weight:600;color:#6b7280">提案中</span>
            <span style="background:#fef3c7;border-radius:10px;padding:2px 8px;font-size:12px;font-weight:600;color:#d97706">2</span>
          </div>
          <div class="deal-card" onclick="showToast('查看交易：富邦人壽')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;font-weight:600">富邦人壽系統</span>
              <div class="avatar" style="background:#2563eb">林</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:#16a34a;margin-bottom:6px">$780,000</div>
            <div class="metric-bar"><div class="metric-fill" style="width:65%"></div></div>
            <div style="font-size:11px;color:#9ca3af;margin-top:4px">65% 成交率</div>
          </div>
          <div class="deal-card" onclick="showToast('查看交易：長榮航空')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;font-weight:600">長榮航空 DX</span>
              <div class="avatar" style="background:#ea580c">吳</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:#16a34a">$650,000</div>
          </div>
        </div>
        <!-- Negotiation -->
        <div class="pipeline-col" style="background:#f0fdf4">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span style="font-size:13px;font-weight:600;color:#16a34a">即將成交 🔥</span>
            <span style="background:#bbf7d0;border-radius:10px;padding:2px 8px;font-size:12px;font-weight:600;color:#16a34a">2</span>
          </div>
          <div class="deal-card" style="border-color:#bbf7d0" onclick="showToast('🎉 預計本週成交！')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;font-weight:600">中華電信雲端</span>
              <div class="avatar" style="background:#16a34a">劉</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:#16a34a;margin-bottom:6px">$920,000</div>
            <div class="metric-bar"><div class="metric-fill" style="width:90%"></div></div>
            <div style="font-size:11px;color:#16a34a;margin-top:4px;font-weight:600">90% 成交率 — 預計本週簽約</div>
          </div>
          <div class="deal-card" style="border-color:#bbf7d0" onclick="showToast('🎉 合約審核中！')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;font-weight:600">台灣大哥大 IoT</span>
              <div class="avatar" style="background:#059669">許</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:#16a34a;margin-bottom:6px">$540,000</div>
            <div class="metric-bar"><div class="metric-fill" style="width:85%"></div></div>
            <div style="font-size:11px;color:#16a34a;margin-top:4px;font-weight:600">85% 成交率 — 合約審核中</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- How it works -->
<section style="padding:80px 24px;background:#f9fafb">
  <div style="max-width:1000px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:60px">
      <h2 style="font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;letter-spacing:-0.02em;margin-bottom:16px">三步開始使用</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:40px">
      <div class="reveal" style="text-align:center">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;margin:0 auto 20px">1</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">匯入客戶資料</h3>
        <p style="font-size:14px;color:#6b7280;line-height:1.7">從 Excel、Google Sheets 或其他 CRM 一鍵匯入，自動去重與欄位對應。</p>
      </div>
      <div class="reveal" style="text-align:center">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;margin:0 auto 20px">2</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">設定銷售管線</h3>
        <p style="font-size:14px;color:#6b7280;line-height:1.7">自訂銷售階段、自動化規則，讓每個潛在客戶都不會被遺漏。</p>
      </div>
      <div class="reveal" style="text-align:center">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;margin:0 auto 20px">3</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">開始成交</h3>
        <p style="font-size:14px;color:#6b7280;line-height:1.7">AI 推薦最佳跟進策略，自動排程、發送郵件、追蹤進度。</p>
      </div>
    </div>
  </div>
</section>

<!-- Pricing -->
<section id="pricing" style="padding:80px 24px">
  <div style="max-width:1100px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:60px">
      <div style="font-size:13px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">定價方案</div>
      <h2 style="font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;letter-spacing:-0.02em;margin-bottom:16px">選擇適合你的方案</h2>
      <p style="color:#6b7280;font-size:16px">所有方案皆含 14 天免費試用，無需信用卡。</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;align-items:start">
      <!-- Starter -->
      <div class="reveal pricing-card">
        <div style="font-size:14px;font-weight:600;color:#6b7280;margin-bottom:4px">Starter</div>
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:16px">
          <span style="font-size:40px;font-weight:800">$590</span>
          <span style="font-size:14px;color:#9ca3af">/月/用戶</span>
        </div>
        <p style="font-size:14px;color:#6b7280;margin-bottom:24px;line-height:1.6">適合小型團隊，基本客戶管理和銷售追蹤。</p>
        <button class="btn-outline" style="width:100%;margin-bottom:24px" onclick="showToast('開始 Starter 試用')">開始試用</button>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="font-size:14px"><span class="check-icon">✓</span> 最多 3 位用戶</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> 1,000 筆聯絡人</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> 基本銷售管線</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> 郵件整合</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> 行動 App</div>
        </div>
      </div>
      <!-- Pro -->
      <div class="reveal pricing-card popular">
        <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#16a34a,#059669);color:#fff;padding:4px 16px;border-radius:20px;font-size:12px;font-weight:600">最受歡迎</div>
        <div style="font-size:14px;font-weight:600;color:#16a34a;margin-bottom:4px">Pro</div>
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:16px">
          <span style="font-size:40px;font-weight:800">$1,290</span>
          <span style="font-size:14px;color:#9ca3af">/月/用戶</span>
        </div>
        <p style="font-size:14px;color:#6b7280;margin-bottom:24px;line-height:1.6">適合成長團隊，進階自動化與分析功能。</p>
        <button class="btn-primary" style="width:100%;margin-bottom:24px" onclick="showToast('🎉 開始 Pro 試用！')">開始試用</button>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="font-size:14px"><span class="check-icon">✓</span> 最多 20 位用戶</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> 無限聯絡人</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> AI 銷售助手</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> 自動化工作流</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> 進階報表</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> API 存取</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> 優先支援</div>
        </div>
      </div>
      <!-- Enterprise -->
      <div class="reveal pricing-card">
        <div style="font-size:14px;font-weight:600;color:#6b7280;margin-bottom:4px">Enterprise</div>
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:16px">
          <span style="font-size:40px;font-weight:800">客製</span>
        </div>
        <p style="font-size:14px;color:#6b7280;margin-bottom:24px;line-height:1.6">大型企業，專屬部署、SSO、SLA 保證。</p>
        <button class="btn-outline" style="width:100%;margin-bottom:24px" onclick="showToast('已發送聯繫請求')">聯繫銷售</button>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="font-size:14px"><span class="check-icon">✓</span> 無限用戶</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> 無限一切</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> SSO / SAML</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> 專屬客戶經理</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> 99.99% SLA</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> 客製化整合</div>
          <div style="font-size:14px"><span class="check-icon">✓</span> 現場導入培訓</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section id="testimonials" style="padding:80px 24px;background:#f9fafb">
  <div style="max-width:1100px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:60px">
      <div style="font-size:13px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">客戶評價</div>
      <h2 style="font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;letter-spacing:-0.02em">他們怎麼說</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      <div class="reveal card-hover" style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
        <div style="color:#f59e0b;margin-bottom:12px">★★★★★</div>
        <p style="font-size:14px;color:#374151;line-height:1.8;margin-bottom:20px">「導入 SalesPilot 後，我們的銷售團隊效率提升了 40%。AI 自動跟進功能讓業務可以專注在高價值客戶。」</p>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="avatar" style="background:#16a34a;width:40px;height:40px;font-size:15px">林</div>
          <div>
            <div style="font-size:14px;font-weight:600">林柏翰</div>
            <div style="font-size:12px;color:#9ca3af">91APP 銷售總監</div>
          </div>
        </div>
      </div>
      <div class="reveal card-hover" style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
        <div style="color:#f59e0b;margin-bottom:12px">★★★★★</div>
        <p style="font-size:14px;color:#374151;line-height:1.8;margin-bottom:20px">「從 Salesforce 遷移過來後，我們的使用率從 30% 提升到 92%。介面直覺，團隊幾乎零學習成本。」</p>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="avatar" style="background:#2563eb;width:40px;height:40px;font-size:15px">陳</div>
          <div>
            <div style="font-size:14px;font-weight:600">陳雅婷</div>
            <div style="font-size:12px;color:#9ca3af">Pinkoi 營運長</div>
          </div>
        </div>
      </div>
      <div class="reveal card-hover" style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
        <div style="color:#f59e0b;margin-bottom:12px">★★★★★</div>
        <p style="font-size:14px;color:#374151;line-height:1.8;margin-bottom:20px">「自動化工作流幫我們省下每週 15 小時的行政作業。客戶分配、提醒、報告全自動，太神了。」</p>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="avatar" style="background:#ea580c;width:40px;height:40px;font-size:15px">張</div>
          <div>
            <div style="font-size:14px;font-weight:600">張威銘</div>
            <div style="font-size:12px;color:#9ca3af">KKday 商務拓展</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section style="padding:80px 24px">
  <div class="reveal" style="max-width:800px;margin:0 auto;background:linear-gradient(135deg,#16a34a,#059669);border-radius:24px;padding:60px 40px;text-align:center;position:relative;overflow:hidden">
    <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.1)"></div>
    <div style="position:absolute;bottom:-60px;left:-30px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.08)"></div>
    <h2 style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:800;color:#fff;margin-bottom:16px;position:relative">準備好加速你的銷售了嗎？</h2>
    <p style="color:rgba(255,255,255,0.85);font-size:16px;margin-bottom:32px;position:relative">加入 3,200+ 企業，14 天免費體驗，無需信用卡。</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;position:relative">
      <button style="background:#fff;color:#16a34a;border:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:16px;cursor:pointer;transition:all 0.3s" onclick="showToast('🎉 開始免費試用！')" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">免費開始</button>
      <button style="background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,0.5);padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px;cursor:pointer;transition:all 0.3s" onclick="showToast('已預約產品演示')" onmouseover="this.style.borderColor='#fff'" onmouseout="this.style.borderColor='rgba(255,255,255,0.5)'">預約演示</button>
    </div>
  </div>
</section>

<!-- Footer -->
<footer style="padding:48px 24px;border-top:1px solid #e5e7eb;background:#fff">
  <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px">
    <div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#16a34a,#059669);display:flex;align-items:center;justify-content:center">
          <svg width="16" height="16" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <span style="font-weight:700">SalesPilot</span>
      </div>
      <p style="font-size:13px;color:#9ca3af;line-height:1.7;max-width:280px">智慧 CRM 銷售管理平台，讓你的團隊用更少時間達成更多目標。</p>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:16px">產品</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a style="font-size:13px;color:#9ca3af;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#9ca3af'">功能總覽</a>
        <a style="font-size:13px;color:#9ca3af;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#9ca3af'">定價方案</a>
        <a style="font-size:13px;color:#9ca3af;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#9ca3af'">串接整合</a>
        <a style="font-size:13px;color:#9ca3af;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#9ca3af'">更新日誌</a>
      </div>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:16px">資源</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a style="font-size:13px;color:#9ca3af;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#9ca3af'">幫助中心</a>
        <a style="font-size:13px;color:#9ca3af;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#9ca3af'">API 文件</a>
        <a style="font-size:13px;color:#9ca3af;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#9ca3af'">部落格</a>
        <a style="font-size:13px;color:#9ca3af;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#9ca3af'">社群論壇</a>
      </div>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:16px">公司</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a style="font-size:13px;color:#9ca3af;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#9ca3af'">關於我們</a>
        <a style="font-size:13px;color:#9ca3af;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#9ca3af'">加入團隊</a>
        <a style="font-size:13px;color:#9ca3af;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#9ca3af'">隱私政策</a>
        <a style="font-size:13px;color:#9ca3af;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#16a34a'" onmouseout="this.style.color='#9ca3af'">服務條款</a>
      </div>
    </div>
  </div>
  <div style="max-width:1200px;margin:32px auto 0;padding-top:24px;border-top:1px solid #f3f4f6;text-align:center">
    <p style="font-size:12px;color:#9ca3af">© 2026 SalesPilot. All rights reserved.</p>
  </div>
</footer>

<script>
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
function scrollToTop(){window.scrollTo({top:0,behavior:'smooth'})}
function toggleMobile(){const m=document.getElementById('mobile-menu');m.style.display=m.style.display==='none'?'block':'none'}
function switchPipeView(btn,view){document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');showToast(view==='pipeline'?'管線檢視':'列表檢視')}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();const t=document.querySelector(a.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth'})})});

// Reveal on scroll
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}})},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

// Responsive nav
function checkNav(){const w=window.innerWidth;const links=document.getElementById('nav-links');const toggle=document.getElementById('mobile-toggle');if(w<768){links.style.display='none';toggle.style.display='block'}else{links.style.display='flex';toggle.style.display='none';document.getElementById('mobile-menu').style.display='none'}}
window.addEventListener('resize',checkNav);checkNav();

// Animate metric bars on scroll
const barObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){const fills=e.target.querySelectorAll('.metric-fill');fills.forEach(f=>{const w=f.style.width;f.style.width='0';setTimeout(()=>f.style.width=w,100)});barObserver.unobserve(e.target)}})},{threshold:0.3});
document.querySelectorAll('.pipeline-col').forEach(col=>barObserver.observe(col));
</script>

</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
