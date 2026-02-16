INSERT INTO template_previews (template_id, html_content, version)
VALUES ('6875e8d4-0aec-4ffb-8978-3f3bfb2c718b', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CRAFT CAMP — 設計思考工作坊</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans TC',sans-serif;background:#fffbf5;color:#1a1a1a;overflow-x:hidden}
.grotesk{font-family:'Space Grotesk','Noto Sans TC',sans-serif}
.orange{color:#ea580c}
.yellow{color:#d97706}
.bg-orange{background:#ea580c}
.bg-warm{background:#fff7ed}
.badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
.badge-orange{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa}
.badge-green{background:#ecfdf5;color:#059669;border:1px solid #a7f3d0}
.badge-blue{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
.btn-orange{background:linear-gradient(135deg,#ea580c,#d97706);color:#fff;border:none;padding:14px 32px;border-radius:12px;font-weight:700;cursor:pointer;transition:all 0.3s;font-size:15px}
.btn-orange:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(234,88,12,0.3)}
.btn-outline{border:2px solid #d4d4d4;color:#1a1a1a;padding:14px 32px;border-radius:12px;font-weight:600;cursor:pointer;transition:all 0.3s;background:transparent;font-size:15px}
.btn-outline:hover{border-color:#ea580c;color:#ea580c}
.workshop-card{background:#fff;border:2px solid #f3f4f6;border-radius:20px;padding:32px;transition:all 0.3s;cursor:pointer;position:relative;overflow:hidden}
.workshop-card:hover{border-color:#ea580c;transform:translateY(-4px);box-shadow:0 16px 40px rgba(234,88,12,0.08)}
.instructor-card{background:#fff;border:2px solid #f3f4f6;border-radius:20px;padding:24px;text-align:center;transition:all 0.3s}
.instructor-card:hover{border-color:#ea580c;transform:translateY(-4px)}
.schedule-block{background:#fff;border-radius:16px;padding:24px;border:2px solid #f3f4f6;transition:all 0.2s}
.schedule-block:hover{border-color:#fed7aa}
.faq-item{border-bottom:1px solid #e5e5e5;padding:16px 0;cursor:pointer}
.faq-q{display:flex;justify-content:space-between;align-items:center;font-weight:600;font-size:15px}
.faq-a{max-height:0;overflow:hidden;transition:max-height 0.3s;font-size:14px;color:#737373;line-height:1.7}
.faq-item.open .faq-a{max-height:200px;padding-top:12px}
.faq-item.open .faq-arrow{transform:rotate(180deg)}
.toast{position:fixed;bottom:24px;right:24px;background:#ea580c;color:#fff;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:600;transform:translateY(100px);opacity:0;transition:all 0.4s;z-index:9999}
.toast.show{transform:translateY(0);opacity:1}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.nav-warm{backdrop-filter:blur(12px);background:rgba(255,251,245,0.9)}
.seats-bar{height:8px;border-radius:4px;background:#f3f4f6;overflow:hidden}
.seats-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#ea580c,#d97706);transition:width 1s ease}
.count-circle{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#ea580c,#d97706);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;flex-shrink:0}
</style>
</head>
<body>

<div class="toast" id="toast"></div>

<!-- Nav -->
<nav class="nav-warm fixed top-0 left-0 right-0 z-50 border-b" style="border-color:#fed7aa;padding:14px 0">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:8px;cursor:pointer" onclick="window.scrollTo({top:0,behavior:'smooth'})">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#ea580c,#d97706);display:flex;align-items:center;justify-content:center;font-size:18px">🔥</div>
      <span class="grotesk" style="font-weight:700;font-size:18px">CRAFT CAMP</span>
    </div>
    <div style="display:flex;align-items:center;gap:24px" id="nav-links">
      <a href="#workshops" style="text-decoration:none;color:#737373;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#ea580c'" onmouseout="this.style.color='#737373'">工作坊</a>
      <a href="#schedule" style="text-decoration:none;color:#737373;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#ea580c'" onmouseout="this.style.color='#737373'">課程表</a>
      <a href="#instructors" style="text-decoration:none;color:#737373;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#ea580c'" onmouseout="this.style.color='#737373'">講師</a>
      <a href="#faq" style="text-decoration:none;color:#737373;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#ea580c'" onmouseout="this.style.color='#737373'">FAQ</a>
    </div>
    <button class="btn-orange" style="padding:8px 20px;font-size:13px" onclick="document.getElementById('register').scrollIntoView({behavior:'smooth'})">立即報名</button>
  </div>
</nav>

<!-- Hero -->
<section style="padding:120px 24px 60px;position:relative;overflow:hidden">
  <div style="position:absolute;top:-100px;right:-100px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(234,88,12,0.06),transparent 70%);pointer-events:none"></div>
  <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1.2fr 0.8fr;gap:48px;align-items:center">
    <div>
      <div style="display:flex;gap:8px;margin-bottom:20px">
        <span class="badge badge-orange">🔥 限額 40 人</span>
        <span class="badge badge-green">✓ 早鳥優惠中</span>
      </div>
      <h1 class="grotesk" style="font-size:clamp(2rem,5vw,3.5rem);font-weight:700;line-height:1.1;margin-bottom:16px;letter-spacing:-0.02em">
        設計思考<br>實戰工作坊
      </h1>
      <p style="font-size:16px;color:#737373;line-height:1.7;margin-bottom:24px;max-width:460px">
        兩天密集實作，從問題定義到原型測試。由 Google、LINE 前設計主管親自帶領，小班制確保每位學員都能得到指導。
      </p>
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:24px;font-size:14px;color:#737373">
        <span>📅 2026/03/22-23</span>
        <span>📍 台北 · 三創</span>
        <span>⏱️ 09:00-17:00</span>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">
        <button class="btn-orange" onclick="document.getElementById('register').scrollIntoView({behavior:'smooth'})">立即報名 — 早鳥 $4,800</button>
        <button class="btn-outline" onclick="document.getElementById('schedule').scrollIntoView({behavior:'smooth'})">查看課程表</button>
      </div>
      <!-- Seats -->
      <div style="max-width:300px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
          <span style="color:#ea580c;font-weight:600">剩餘 12 個名額</span>
          <span style="color:#a3a3a3">40 人滿額</span>
        </div>
        <div class="seats-bar"><div class="seats-fill" style="width:70%"></div></div>
      </div>
    </div>
    <!-- Hero Visual -->
    <div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);border-radius:24px;padding:48px;text-align:center;position:relative">
      <div style="font-size:80px;margin-bottom:16px">🎨</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
        <div style="background:#fff;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;margin-bottom:4px">💡</div>
          <div style="font-size:12px;font-weight:600">問題定義</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;margin-bottom:4px">👥</div>
          <div style="font-size:12px;font-weight:600">使用者訪談</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;margin-bottom:4px">✏️</div>
          <div style="font-size:12px;font-weight:600">快速原型</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;margin-bottom:4px">🧪</div>
          <div style="font-size:12px;font-weight:600">測試驗證</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- What you learn -->
<section style="padding:60px 24px;background:#fff;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6">
  <div style="max-width:1100px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:40px">
      <h2 class="grotesk" style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700;margin-bottom:8px">你會學到什麼</h2>
      <p style="color:#737373;font-size:15px">不只是理論，每一個環節都有實作練習。</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
      <div class="reveal" style="display:flex;gap:16px;align-items:start">
        <div class="count-circle">1</div>
        <div>
          <h3 style="font-size:15px;font-weight:700;margin-bottom:4px">問題框架</h3>
          <p style="font-size:13px;color:#737373;line-height:1.6">用 HMW 方法重新定義問題，找到真正值得解決的痛點。</p>
        </div>
      </div>
      <div class="reveal" style="display:flex;gap:16px;align-items:start">
        <div class="count-circle">2</div>
        <div>
          <h3 style="font-size:15px;font-weight:700;margin-bottom:4px">用戶同理</h3>
          <p style="font-size:13px;color:#737373;line-height:1.6">實際操作用戶訪談，建立 Persona 和 Journey Map。</p>
        </div>
      </div>
      <div class="reveal" style="display:flex;gap:16px;align-items:start">
        <div class="count-circle">3</div>
        <div>
          <h3 style="font-size:15px;font-weight:700;margin-bottom:4px">快速原型</h3>
          <p style="font-size:13px;color:#737373;line-height:1.6">用紙筆和 Figma 在 2 小時內做出可測試的原型。</p>
        </div>
      </div>
      <div class="reveal" style="display:flex;gap:16px;align-items:start">
        <div class="count-circle">4</div>
        <div>
          <h3 style="font-size:15px;font-weight:700;margin-bottom:4px">測試迭代</h3>
          <p style="font-size:13px;color:#737373;line-height:1.6">真人測試你的原型，收集回饋，快速迭代改良。</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Workshops -->
<section id="workshops" style="padding:60px 24px">
  <div style="max-width:1100px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:40px">
      <span class="badge badge-orange" style="margin-bottom:12px">4 個主題工作坊</span>
      <h2 class="grotesk" style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700">選擇你的學習軌道</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px">
      <div class="reveal workshop-card" onclick="showToast('已選擇：設計思考基礎')">
        <span class="badge badge-green" style="margin-bottom:12px;display:inline-block">初學者友善</span>
        <div style="font-size:36px;margin-bottom:12px">💡</div>
        <h3 class="grotesk" style="font-size:20px;font-weight:700;margin-bottom:6px">設計思考基礎</h3>
        <p style="font-size:14px;color:#737373;line-height:1.7;margin-bottom:16px">從零開始學習 Design Thinking 五步驟，適合沒有設計背景的人。</p>
        <div style="display:flex;gap:16px;font-size:13px;color:#a3a3a3">
          <span>📅 Day 1 上午</span>
          <span>⏱️ 3 小時</span>
          <span>👥 40 人</span>
        </div>
      </div>
      <div class="reveal workshop-card" onclick="showToast('已選擇：用戶研究實戰')">
        <span class="badge badge-blue" style="margin-bottom:12px;display:inline-block">進階</span>
        <div style="font-size:36px;margin-bottom:12px">👥</div>
        <h3 class="grotesk" style="font-size:20px;font-weight:700;margin-bottom:6px">用戶研究實戰</h3>
        <p style="font-size:14px;color:#737373;line-height:1.7;margin-bottom:16px">學習訪談技巧、親和圖分析、Persona 建構。實際訪問真人用戶。</p>
        <div style="display:flex;gap:16px;font-size:13px;color:#a3a3a3">
          <span>📅 Day 1 下午</span>
          <span>⏱️ 3 小時</span>
          <span>👥 40 人</span>
        </div>
      </div>
      <div class="reveal workshop-card" onclick="showToast('已選擇：Figma 快速原型')">
        <span class="badge badge-orange" style="margin-bottom:12px;display:inline-block">實作</span>
        <div style="font-size:36px;margin-bottom:12px">✏️</div>
        <h3 class="grotesk" style="font-size:20px;font-weight:700;margin-bottom:6px">Figma 快速原型</h3>
        <p style="font-size:14px;color:#737373;line-height:1.7;margin-bottom:16px">2 小時內用 Figma 從草稿到可互動原型。學會 Auto Layout 和元件化。</p>
        <div style="display:flex;gap:16px;font-size:13px;color:#a3a3a3">
          <span>📅 Day 2 上午</span>
          <span>⏱️ 3 小時</span>
          <span>💻 需自備筆電</span>
        </div>
      </div>
      <div class="reveal workshop-card" onclick="showToast('已選擇：用戶測試與迭代')">
        <span class="badge badge-green" style="margin-bottom:12px;display:inline-block">最終實作</span>
        <div style="font-size:36px;margin-bottom:12px">🧪</div>
        <h3 class="grotesk" style="font-size:20px;font-weight:700;margin-bottom:6px">用戶測試與迭代</h3>
        <p style="font-size:14px;color:#737373;line-height:1.7;margin-bottom:16px">帶著你的原型實際測試，學習如何收集有效回饋並快速改進。</p>
        <div style="display:flex;gap:16px;font-size:13px;color:#a3a3a3">
          <span>📅 Day 2 下午</span>
          <span>⏱️ 3 小時</span>
          <span>🏆 成果發表</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Instructors -->
<section id="instructors" style="padding:60px 24px;background:#fff">
  <div style="max-width:1100px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:40px">
      <h2 class="grotesk" style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700;margin-bottom:8px">講師陣容</h2>
      <p style="color:#737373;font-size:15px">來自 Google、LINE、Pinkoi 的實戰專家</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      <div class="reveal instructor-card">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#ea580c,#d97706);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px">👨‍🏫</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:2px">陳柏翰</h3>
        <p style="font-size:13px;color:#ea580c;font-weight:500;margin-bottom:8px">前 Google UX Lead</p>
        <p style="font-size:13px;color:#737373;line-height:1.6">曾主導 Google Maps 台灣在地化設計，擁有 12 年產品設計經驗。</p>
      </div>
      <div class="reveal instructor-card">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#6d28d9);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px">👩‍🏫</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:2px">林佳穎</h3>
        <p style="font-size:13px;color:#8b5cf6;font-weight:500;margin-bottom:8px">LINE 設計總監</p>
        <p style="font-size:13px;color:#737373;line-height:1.6">LINE Pay、LINE Shopping 設計主管，專精用戶研究與設計系統。</p>
      </div>
      <div class="reveal instructor-card">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#059669,#047857);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px">👨‍💻</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:2px">張威銘</h3>
        <p style="font-size:13px;color:#059669;font-weight:500;margin-bottom:8px">Pinkoi 產品設計主管</p>
        <p style="font-size:13px;color:#737373;line-height:1.6">帶領 Pinkoi 設計團隊完成國際化改版，擅長 Figma 原型與設計系統。</p>
      </div>
    </div>
  </div>
</section>

<!-- Schedule -->
<section id="schedule" style="padding:60px 24px">
  <div style="max-width:900px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:40px">
      <h2 class="grotesk" style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700;margin-bottom:8px">兩日課程表</h2>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <!-- Day 1 -->
      <div class="reveal">
        <h3 class="grotesk" style="font-size:18px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px"><span style="background:#ea580c;color:#fff;padding:2px 10px;border-radius:6px;font-size:13px">DAY 1</span> 3/22 (六)</h3>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div class="schedule-block"><span style="font-size:12px;color:#ea580c;font-weight:600">09:00</span><div style="font-weight:600;margin-top:2px">開場 & 破冰</div></div>
          <div class="schedule-block"><span style="font-size:12px;color:#ea580c;font-weight:600">09:30</span><div style="font-weight:600;margin-top:2px">設計思考基礎</div><div style="font-size:12px;color:#737373">HMW 框架 · 問題定義</div></div>
          <div class="schedule-block" style="background:#fff7ed"><span style="font-size:12px;color:#a3a3a3">12:00</span><div style="font-weight:500;margin-top:2px;color:#737373">午餐 & 交流</div></div>
          <div class="schedule-block"><span style="font-size:12px;color:#ea580c;font-weight:600">13:30</span><div style="font-weight:600;margin-top:2px">用戶研究實戰</div><div style="font-size:12px;color:#737373">訪談技巧 · Persona · Journey Map</div></div>
          <div class="schedule-block"><span style="font-size:12px;color:#ea580c;font-weight:600">16:30</span><div style="font-weight:600;margin-top:2px">Day 1 總結 & 回家作業</div></div>
        </div>
      </div>
      <!-- Day 2 -->
      <div class="reveal">
        <h3 class="grotesk" style="font-size:18px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px"><span style="background:#d97706;color:#fff;padding:2px 10px;border-radius:6px;font-size:13px">DAY 2</span> 3/23 (日)</h3>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div class="schedule-block"><span style="font-size:12px;color:#d97706;font-weight:600">09:00</span><div style="font-weight:600;margin-top:2px">作業回顧 & 暖身</div></div>
          <div class="schedule-block"><span style="font-size:12px;color:#d97706;font-weight:600">09:30</span><div style="font-weight:600;margin-top:2px">Figma 快速原型</div><div style="font-size:12px;color:#737373">Auto Layout · 元件 · 互動原型</div></div>
          <div class="schedule-block" style="background:#fff7ed"><span style="font-size:12px;color:#a3a3a3">12:00</span><div style="font-weight:500;margin-top:2px;color:#737373">午餐 & 交流</div></div>
          <div class="schedule-block"><span style="font-size:12px;color:#d97706;font-weight:600">13:30</span><div style="font-weight:600;margin-top:2px">用戶測試與迭代</div><div style="font-size:12px;color:#737373">真人測試 · 回饋收集 · 快速改進</div></div>
          <div class="schedule-block" style="border-color:#ea580c"><span style="font-size:12px;color:#ea580c;font-weight:600">16:00</span><div style="font-weight:600;margin-top:2px">🏆 成果發表 & 頒獎</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Pricing -->
<section id="register" style="padding:60px 24px;background:#fff">
  <div style="max-width:800px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:40px">
      <h2 class="grotesk" style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700;margin-bottom:8px">報名方案</h2>
      <p style="color:#737373;font-size:15px">早鳥優惠至 3 月 1 日截止</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <div class="reveal" style="background:#fff;border:2px solid #f3f4f6;border-radius:20px;padding:36px;text-align:center">
        <div style="font-size:14px;font-weight:600;color:#737373;margin-bottom:4px">早鳥票</div>
        <div style="display:flex;align-items:baseline;justify-content:center;gap:4px;margin-bottom:4px">
          <span style="font-size:40px;font-weight:800;color:#ea580c">$4,800</span>
        </div>
        <div style="font-size:13px;color:#a3a3a3;text-decoration:line-through;margin-bottom:16px">原價 $6,800</div>
        <p style="font-size:14px;color:#737373;margin-bottom:20px;line-height:1.6">兩天完整課程 + 午餐 + 結業證書</p>
        <button class="btn-orange" style="width:100%;margin-bottom:16px" onclick="showToast('🎉 報名成功！將收到確認信')">立即報名</button>
        <div style="font-size:12px;color:#a3a3a3;text-align:left">
          <div>✓ 兩天完整課程</div>
          <div>✓ 精緻午餐 × 2</div>
          <div>✓ 結業證書</div>
          <div>✓ 講義電子檔</div>
          <div>✓ 課後社群加入</div>
        </div>
      </div>
      <div class="reveal" style="background:linear-gradient(135deg,#fff7ed,#fef3c7);border:2px solid #ea580c;border-radius:20px;padding:36px;text-align:center;position:relative">
        <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#ea580c;color:#fff;padding:4px 16px;border-radius:20px;font-size:12px;font-weight:700">推薦</div>
        <div style="font-size:14px;font-weight:600;color:#ea580c;margin-bottom:4px">VIP 票</div>
        <div style="display:flex;align-items:baseline;justify-content:center;gap:4px;margin-bottom:4px">
          <span style="font-size:40px;font-weight:800;color:#ea580c">$7,800</span>
        </div>
        <div style="font-size:13px;color:#a3a3a3;text-decoration:line-through;margin-bottom:16px">原價 $9,800</div>
        <p style="font-size:14px;color:#737373;margin-bottom:20px;line-height:1.6">完整課程 + 1 對 1 講師指導 30 分鐘</p>
        <button class="btn-orange" style="width:100%;margin-bottom:16px" onclick="showToast('🎉 VIP 報名成功！')">VIP 報名</button>
        <div style="font-size:12px;color:#737373;text-align:left">
          <div>✓ 一切早鳥票權益</div>
          <div>✓ 1v1 講師指導 30 分鐘</div>
          <div>✓ 作品集回饋</div>
          <div>✓ VIP 前排座位</div>
          <div>✓ 講師推薦信（限額）</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section id="faq" style="padding:60px 24px">
  <div style="max-width:700px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:40px">
      <h2 class="grotesk" style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700">常見問題</h2>
    </div>
    <div class="reveal">
      <div class="faq-item" onclick="toggleFaq(this)">
        <div class="faq-q">需要設計經驗嗎？<span class="faq-arrow" style="transition:transform 0.3s">▼</span></div>
        <div class="faq-a">完全不需要！我們的課程從基礎開始，適合所有背景的人。PM、工程師、行銷人員都歡迎。</div>
      </div>
      <div class="faq-item" onclick="toggleFaq(this)">
        <div class="faq-q">需要自備筆電嗎？<span class="faq-arrow" style="transition:transform 0.3s">▼</span></div>
        <div class="faq-a">Day 2 的 Figma 工作坊需要自備筆電。Figma 是免費的瀏覽器工具，我們會提前寄送安裝指引。</div>
      </div>
      <div class="faq-item" onclick="toggleFaq(this)">
        <div class="faq-q">可以退費嗎？<span class="faq-arrow" style="transition:transform 0.3s">▼</span></div>
        <div class="faq-a">活動 14 天前可全額退費，7 天前退 50%，7 天內恕不退費但可轉讓名額給朋友。</div>
      </div>
      <div class="faq-item" onclick="toggleFaq(this)">
        <div class="faq-q">有提供結業證書嗎？<span class="faq-arrow" style="transition:transform 0.3s">▼</span></div>
        <div class="faq-a">有！完成兩天課程並參與成果發表的學員，將獲得 CRAFT CAMP 結業證書。VIP 學員另有講師推薦信。</div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section style="padding:60px 24px">
  <div class="reveal" style="max-width:800px;margin:0 auto;background:linear-gradient(135deg,#ea580c,#d97706);border-radius:24px;padding:48px;text-align:center;position:relative;overflow:hidden">
    <div style="position:absolute;top:-30px;right:-30px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,0.1)"></div>
    <h2 class="grotesk" style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700;color:#fff;margin-bottom:12px;position:relative">名額有限，手刀報名！</h2>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;margin-bottom:24px;position:relative">早鳥優惠 $4,800（原價 $6,800）· 含午餐 & 結業證書</p>
    <button style="background:#fff;color:#ea580c;border:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;cursor:pointer;transition:all 0.3s;position:relative" onclick="showToast('🎉 報名成功！')" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">立即報名</button>
  </div>
</section>

<!-- Footer -->
<footer style="padding:36px 24px;border-top:1px solid #f3f4f6;text-align:center">
  <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px">
    <span style="font-size:18px">🔥</span>
    <span class="grotesk" style="font-weight:700;font-size:16px">CRAFT CAMP</span>
  </div>
  <p style="font-size:12px;color:#a3a3a3">© 2026 Craft Camp. 台北最有溫度的設計工作坊。</p>
</footer>

<script>
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
function toggleFaq(el){el.classList.toggle('open')}
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();const t=document.querySelector(a.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth'})})});
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}})},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
</script>

</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
