INSERT INTO template_previews (template_id, html_content, version)
VALUES ('753b3d03-6295-4c41-8d50-9aeee7c86f1b', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FinVault — 智慧理財儀表板</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans TC',sans-serif;background:#0a0f0d;color:#e2e8f0;overflow-x:hidden}
.mono{font-family:'JetBrains Mono',monospace}
.accent{color:#10b981}
.bg-accent{background:#10b981}
.sidebar{width:240px;background:#0d1210;border-right:1px solid #1a2e23;height:100vh;position:fixed;left:0;top:0;padding:20px 16px;display:flex;flex-direction:column;z-index:50;transition:transform 0.3s}
.sidebar-item{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;cursor:pointer;transition:all 0.2s;font-size:14px;color:#6b7280;font-weight:500}
.sidebar-item:hover{background:rgba(16,185,129,0.08);color:#10b981}
.sidebar-item.active{background:rgba(16,185,129,0.12);color:#10b981;font-weight:600}
.main{margin-left:240px;padding:24px;min-height:100vh}
.card{background:#111916;border:1px solid #1a2e23;border-radius:16px;padding:24px;transition:all 0.3s}
.card:hover{border-color:#10b981;box-shadow:0 0 20px rgba(16,185,129,0.05)}
.metric-card{background:#111916;border:1px solid #1a2e23;border-radius:16px;padding:20px;position:relative;overflow:hidden}
.metric-card::after{content:'';position:absolute;top:0;right:0;width:60px;height:60px;border-radius:0 16px 0 60px;opacity:0.06}
.trend-up{color:#10b981}
.trend-down{color:#ef4444}
.badge-green{background:rgba(16,185,129,0.12);color:#10b981;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600}
.badge-red{background:rgba(239,68,68,0.12);color:#ef4444;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600}
.chart-bar{border-radius:4px 4px 0 0;background:linear-gradient(180deg,#10b981,#065f46);transition:height 0.8s ease}
.table-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:12px;padding:12px 16px;border-bottom:1px solid #1a2e23;align-items:center;font-size:13px;transition:background 0.2s;cursor:pointer}
.table-row:hover{background:rgba(16,185,129,0.04)}
.tab-btn{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:none;transition:all 0.2s;background:transparent;color:#6b7280}
.tab-btn.active{background:rgba(16,185,129,0.12);color:#10b981}
.toast{position:fixed;bottom:24px;right:24px;background:#10b981;color:#0a0f0d;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:600;transform:translateY(100px);opacity:0;transition:all 0.4s;z-index:9999}
.toast.show{transform:translateY(0);opacity:1}
.donut-ring{fill:none;stroke-width:6;stroke-linecap:round;transition:stroke-dashoffset 1.5s ease}
.page{display:none}
.page.active{display:block}
</style>
</head>
<body>

<div class="toast" id="toast"></div>

<!-- Sidebar -->
<aside class="sidebar" id="sidebar">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;padding:0 4px">
    <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;font-size:16px">💰</div>
    <span style="font-weight:700;font-size:17px">FinVault</span>
  </div>
  <div style="font-size:11px;color:#374151;font-weight:600;letter-spacing:1px;padding:0 14px;margin-bottom:8px">總覽</div>
  <div class="sidebar-item active" onclick="switchPage('overview',this)">📊 &nbsp;儀表板</div>
  <div class="sidebar-item" onclick="switchPage('portfolio',this)">💼 &nbsp;投資組合</div>
  <div class="sidebar-item" onclick="switchPage('transactions',this)">📋 &nbsp;交易紀錄</div>
  <div style="font-size:11px;color:#374151;font-weight:600;letter-spacing:1px;padding:0 14px;margin:20px 0 8px">工具</div>
  <div class="sidebar-item" onclick="switchPage('budget',this)">📈 &nbsp;預算追蹤</div>
  <div class="sidebar-item" onclick="showToast('目標功能開發中')">🎯 &nbsp;理財目標</div>
  <div class="sidebar-item" onclick="showToast('報告功能開發中')">📄 &nbsp;報表匯出</div>
  <div style="flex:1"></div>
  <div class="sidebar-item" onclick="showToast('設定頁面開發中')">⚙️ &nbsp;設定</div>
</aside>

<!-- Main -->
<div class="main">
  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
    <div>
      <h1 style="font-size:22px;font-weight:700;margin-bottom:2px">早安，Kevin 👋</h1>
      <p style="font-size:13px;color:#6b7280">2026 年 2 月 16 日 · 市場已開盤</p>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <button onclick="showToast('🔔 暫無通知')" style="background:#111916;border:1px solid #1a2e23;border-radius:10px;padding:8px 12px;cursor:pointer;color:#6b7280;font-size:16px">🔔</button>
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#0a0f0d;cursor:pointer" onclick="showToast('個人設定')">K</div>
    </div>
  </div>

  <!-- Overview Page -->
  <div class="page active" id="page-overview">
    <!-- Metrics Row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">
      <div class="metric-card" style="border-top:3px solid #10b981">
        <div style="font-size:12px;color:#6b7280;margin-bottom:4px">總資產</div>
        <div style="font-size:28px;font-weight:800;margin-bottom:4px" class="mono">$2,847,320</div>
        <div class="trend-up" style="font-size:12px;font-weight:600">↑ 12.4% 本月</div>
      </div>
      <div class="metric-card">
        <div style="font-size:12px;color:#6b7280;margin-bottom:4px">投資報酬</div>
        <div style="font-size:28px;font-weight:800;margin-bottom:4px" class="mono">+$342,180</div>
        <div class="trend-up" style="font-size:12px;font-weight:600">↑ 8.7% YTD</div>
      </div>
      <div class="metric-card">
        <div style="font-size:12px;color:#6b7280;margin-bottom:4px">月支出</div>
        <div style="font-size:28px;font-weight:800;margin-bottom:4px" class="mono">$68,450</div>
        <div class="trend-down" style="font-size:12px;font-weight:600">↑ 3.2% 較上月</div>
      </div>
      <div class="metric-card">
        <div style="font-size:12px;color:#6b7280;margin-bottom:4px">儲蓄率</div>
        <div style="font-size:28px;font-weight:800;margin-bottom:4px" class="mono">34.2%</div>
        <div class="trend-up" style="font-size:12px;font-weight:600">↑ 2.1% 較上月</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:24px">
      <!-- Monthly Chart -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <h3 style="font-size:15px;font-weight:600">資產趨勢</h3>
          <div style="display:flex;gap:4px">
            <button class="tab-btn active">6M</button>
            <button class="tab-btn">1Y</button>
            <button class="tab-btn">ALL</button>
          </div>
        </div>
        <div style="display:flex;align-items:flex-end;gap:8px;height:180px;padding:0 8px">
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <div class="chart-bar" style="width:100%;height:65%"></div>
            <span style="font-size:10px;color:#6b7280">Sep</span>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <div class="chart-bar" style="width:100%;height:70%"></div>
            <span style="font-size:10px;color:#6b7280">Oct</span>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <div class="chart-bar" style="width:100%;height:62%"></div>
            <span style="font-size:10px;color:#6b7280">Nov</span>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <div class="chart-bar" style="width:100%;height:78%"></div>
            <span style="font-size:10px;color:#6b7280">Dec</span>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <div class="chart-bar" style="width:100%;height:85%"></div>
            <span style="font-size:10px;color:#6b7280">Jan</span>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <div class="chart-bar" style="width:100%;height:92%;background:linear-gradient(180deg,#10b981,#047857)"></div>
            <span style="font-size:10px;color:#10b981;font-weight:600">Feb</span>
          </div>
        </div>
      </div>

      <!-- Allocation Donut -->
      <div class="card">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:20px">資產配置</h3>
        <div style="text-align:center;margin-bottom:16px">
          <svg width="140" height="140" viewBox="0 0 140 140" style="margin:0 auto">
            <circle cx="70" cy="70" r="56" class="donut-ring" stroke="#1a2e23" stroke-dasharray="352" stroke-dashoffset="0"/>
            <circle cx="70" cy="70" r="56" class="donut-ring" stroke="#10b981" stroke-dasharray="352" stroke-dashoffset="176" transform="rotate(-90 70 70)"/>
            <circle cx="70" cy="70" r="56" class="donut-ring" stroke="#3b82f6" stroke-dasharray="352" stroke-dashoffset="282" transform="rotate(-90 70 70)"/>
            <circle cx="70" cy="70" r="56" class="donut-ring" stroke="#f59e0b" stroke-dasharray="352" stroke-dashoffset="317" transform="rotate(-90 70 70)"/>
            <text x="70" y="66" text-anchor="middle" style="font-size:20px;font-weight:800;fill:#e2e8f0;font-family:Inter">$2.8M</text>
            <text x="70" y="82" text-anchor="middle" style="font-size:11px;fill:#6b7280;font-family:Inter">總資產</text>
          </svg>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px">
            <div style="display:flex;align-items:center;gap:8px"><div style="width:10px;height:10px;border-radius:3px;background:#10b981"></div>股票</div>
            <span class="mono" style="font-weight:600">50%</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px">
            <div style="display:flex;align-items:center;gap:8px"><div style="width:10px;height:10px;border-radius:3px;background:#3b82f6"></div>債券</div>
            <span class="mono" style="font-weight:600">30%</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px">
            <div style="display:flex;align-items:center;gap:8px"><div style="width:10px;height:10px;border-radius:3px;background:#f59e0b"></div>現金</div>
            <span class="mono" style="font-weight:600">10%</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px">
            <div style="display:flex;align-items:center;gap:8px"><div style="width:10px;height:10px;border-radius:3px;background:#1a2e23"></div>其他</div>
            <span class="mono" style="font-weight:600">10%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h3 style="font-size:15px;font-weight:600">近期交易</h3>
        <button style="font-size:13px;color:#10b981;background:none;border:none;cursor:pointer;font-weight:500" onclick="switchPage('transactions',document.querySelectorAll('.sidebar-item')[2])">查看全部 →</button>
      </div>
      <div class="table-row" style="color:#6b7280;font-weight:600;font-size:12px;border-bottom:2px solid #1a2e23">
        <span>名稱</span><span>類型</span><span>數量</span><span>金額</span><span>狀態</span>
      </div>
      <div class="table-row" onclick="showToast('查看 TSMC 交易詳情')">
        <div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:6px;background:#10b981;display:flex;align-items:center;justify-content:center;font-size:12px;color:#0a0f0d;font-weight:700">T</div>台積電 2330</div>
        <span>買入</span>
        <span class="mono">100 股</span>
        <span class="mono" style="font-weight:600">$89,500</span>
        <span class="badge-green">已成交</span>
      </div>
      <div class="table-row" onclick="showToast('查看 ETF 交易詳情')">
        <div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:6px;background:#3b82f6;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:700">V</div>VT 全球股票</div>
        <span>定期定額</span>
        <span class="mono">50 股</span>
        <span class="mono" style="font-weight:600">$5,250</span>
        <span class="badge-green">已成交</span>
      </div>
      <div class="table-row" onclick="showToast('查看轉帳詳情')">
        <div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:6px;background:#f59e0b;display:flex;align-items:center;justify-content:center;font-size:12px;color:#0a0f0d;font-weight:700">$</div>薪資入帳</div>
        <span>收入</span>
        <span class="mono">—</span>
        <span class="mono trend-up" style="font-weight:600">+$185,000</span>
        <span class="badge-green">已到帳</span>
      </div>
      <div class="table-row" onclick="showToast('查看 Apple 交易詳情')">
        <div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:6px;background:#6b7280;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:700">A</div>AAPL 蘋果</div>
        <span>賣出</span>
        <span class="mono">20 股</span>
        <span class="mono trend-down" style="font-weight:600">-$12,400</span>
        <span class="badge-green">已成交</span>
      </div>
    </div>
  </div>

  <!-- Portfolio Page -->
  <div class="page" id="page-portfolio">
    <h2 style="font-size:20px;font-weight:700;margin-bottom:20px">投資組合</h2>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px">
      <div class="card" onclick="showToast('查看台積電持倉詳情')">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:8px;background:#10b981;display:flex;align-items:center;justify-content:center;font-weight:700;color:#0a0f0d">T</div>
            <div><div style="font-weight:600">台積電 2330</div><div style="font-size:12px;color:#6b7280">1,000 股</div></div>
          </div>
          <span class="badge-green">↑ 18.3%</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:#6b7280">現值</span><span class="mono" style="font-weight:600">$895,000</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:#6b7280">成本</span><span class="mono">$756,200</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:#6b7280">損益</span><span class="mono trend-up" style="font-weight:600">+$138,800</span>
        </div>
      </div>
      <div class="card" onclick="showToast('查看 VT 持倉詳情')">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:8px;background:#3b82f6;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff">V</div>
            <div><div style="font-weight:600">VT 全球股票</div><div style="font-size:12px;color:#6b7280">500 股</div></div>
          </div>
          <span class="badge-green">↑ 9.2%</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:#6b7280">現值</span><span class="mono" style="font-weight:600">$525,000</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:#6b7280">成本</span><span class="mono">$480,800</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:#6b7280">損益</span><span class="mono trend-up" style="font-weight:600">+$44,200</span>
        </div>
      </div>
      <div class="card" onclick="showToast('查看 AAPL 持倉詳情')">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:8px;background:#6b7280;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff">A</div>
            <div><div style="font-weight:600">AAPL 蘋果</div><div style="font-size:12px;color:#6b7280">80 股</div></div>
          </div>
          <span class="badge-red">↓ 2.1%</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:#6b7280">現值</span><span class="mono" style="font-weight:600">$496,000</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:#6b7280">成本</span><span class="mono">$506,400</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:#6b7280">損益</span><span class="mono trend-down" style="font-weight:600">-$10,400</span>
        </div>
      </div>
      <div class="card" onclick="showToast('查看債券持倉詳情')">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:8px;background:#f59e0b;display:flex;align-items:center;justify-content:center;font-weight:700;color:#0a0f0d">B</div>
            <div><div style="font-weight:600">AGG 綜合債券</div><div style="font-size:12px;color:#6b7280">300 股</div></div>
          </div>
          <span class="badge-green">↑ 3.5%</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:#6b7280">現值</span><span class="mono" style="font-weight:600">$312,000</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:#6b7280">成本</span><span class="mono">$301,500</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:#6b7280">損益</span><span class="mono trend-up" style="font-weight:600">+$10,500</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Transactions Page -->
  <div class="page" id="page-transactions">
    <h2 style="font-size:20px;font-weight:700;margin-bottom:20px">交易紀錄</h2>
    <div class="card">
      <div class="table-row" style="color:#6b7280;font-weight:600;font-size:12px;border-bottom:2px solid #1a2e23">
        <span>日期/名稱</span><span>類型</span><span>數量</span><span>金額</span><span>狀態</span>
      </div>
      <div class="table-row" onclick="showToast('交易詳情')"><div><div style="font-weight:600">台積電 2330</div><div style="font-size:11px;color:#6b7280">2026/02/15</div></div><span>買入</span><span class="mono">100 股</span><span class="mono" style="font-weight:600">$89,500</span><span class="badge-green">已成交</span></div>
      <div class="table-row" onclick="showToast('交易詳情')"><div><div style="font-weight:600">VT 全球股票</div><div style="font-size:11px;color:#6b7280">2026/02/14</div></div><span>定期定額</span><span class="mono">50 股</span><span class="mono" style="font-weight:600">$5,250</span><span class="badge-green">已成交</span></div>
      <div class="table-row" onclick="showToast('交易詳情')"><div><div style="font-weight:600">薪資入帳</div><div style="font-size:11px;color:#6b7280">2026/02/10</div></div><span>收入</span><span class="mono">—</span><span class="mono trend-up" style="font-weight:600">+$185,000</span><span class="badge-green">已到帳</span></div>
      <div class="table-row" onclick="showToast('交易詳情')"><div><div style="font-weight:600">AAPL 蘋果</div><div style="font-size:11px;color:#6b7280">2026/02/08</div></div><span>賣出</span><span class="mono">20 股</span><span class="mono trend-down" style="font-weight:600">-$12,400</span><span class="badge-green">已成交</span></div>
      <div class="table-row" onclick="showToast('交易詳情')"><div><div style="font-weight:600">房租</div><div style="font-size:11px;color:#6b7280">2026/02/05</div></div><span>支出</span><span class="mono">—</span><span class="mono" style="font-weight:600">$28,000</span><span class="badge-green">已扣款</span></div>
      <div class="table-row" onclick="showToast('交易詳情')"><div><div style="font-weight:600">AGG 綜合債券</div><div style="font-size:11px;color:#6b7280">2026/02/01</div></div><span>定期定額</span><span class="mono">30 股</span><span class="mono" style="font-weight:600">$3,120</span><span class="badge-green">已成交</span></div>
    </div>
  </div>

  <!-- Budget Page -->
  <div class="page" id="page-budget">
    <h2 style="font-size:20px;font-weight:700;margin-bottom:20px">預算追蹤 · 2 月</h2>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px">
      <div class="card">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="font-size:14px;font-weight:600">🏠 居住</span>
          <span class="mono" style="font-size:14px;font-weight:600">$28,000 / $30,000</span>
        </div>
        <div style="height:8px;border-radius:4px;background:#1a2e23;overflow:hidden">
          <div style="height:100%;width:93%;border-radius:4px;background:#f59e0b"></div>
        </div>
        <div style="font-size:11px;color:#f59e0b;margin-top:4px;font-weight:500">93% — 接近上限</div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="font-size:14px;font-weight:600">🍽️ 飲食</span>
          <span class="mono" style="font-size:14px;font-weight:600">$12,800 / $20,000</span>
        </div>
        <div style="height:8px;border-radius:4px;background:#1a2e23;overflow:hidden">
          <div style="height:100%;width:64%;border-radius:4px;background:#10b981"></div>
        </div>
        <div style="font-size:11px;color:#10b981;margin-top:4px;font-weight:500">64% — 正常</div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="font-size:14px;font-weight:600">🚗 交通</span>
          <span class="mono" style="font-size:14px;font-weight:600">$4,200 / $8,000</span>
        </div>
        <div style="height:8px;border-radius:4px;background:#1a2e23;overflow:hidden">
          <div style="height:100%;width:52%;border-radius:4px;background:#10b981"></div>
        </div>
        <div style="font-size:11px;color:#10b981;margin-top:4px;font-weight:500">52% — 正常</div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="font-size:14px;font-weight:600">🎮 娛樂</span>
          <span class="mono" style="font-size:14px;font-weight:600">$9,500 / $10,000</span>
        </div>
        <div style="height:8px;border-radius:4px;background:#1a2e23;overflow:hidden">
          <div style="height:100%;width:95%;border-radius:4px;background:#ef4444"></div>
        </div>
        <div style="font-size:11px;color:#ef4444;margin-top:4px;font-weight:500">95% — 超標警告！</div>
      </div>
    </div>
  </div>
</div>

<script>
function switchPage(page,el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
  if(el)el.classList.add('active');
}
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
</script>

</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
