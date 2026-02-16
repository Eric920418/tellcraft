INSERT INTO template_previews (template_id, html_content, version)
VALUES ('63f10fcb-e3ee-4542-88b1-e9ddcced645b', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Yuki Chen — UI/UX Designer</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Space Grotesk','Noto Sans TC',sans-serif;background:#fafafa;color:#0a0a0a;overflow-x:hidden}
.accent{color:#e11d48}
.bg-accent{background:#e11d48}
.hero-title{font-size:clamp(3rem,10vw,8rem);font-weight:700;line-height:0.95;letter-spacing:-0.04em}
.project-card{position:relative;border-radius:20px;overflow:hidden;cursor:pointer;aspect-ratio:4/3;transition:all 0.4s}
.project-card:hover{transform:scale(1.02)}
.project-card:hover .project-overlay{opacity:1}
.project-overlay{position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,rgba(0,0,0,0.8));display:flex;flex-direction:column;justify-content:flex-end;padding:32px;opacity:0;transition:opacity 0.4s}
.project-thumb{width:100%;height:100%;object-fit:cover;display:flex;align-items:center;justify-content:center;font-size:64px}
.skill-tag{display:inline-block;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:500;border:1px solid #e5e5e5;background:#fff;transition:all 0.2s}
.skill-tag:hover{border-color:#e11d48;color:#e11d48}
.timeline-item{position:relative;padding-left:32px;padding-bottom:32px;border-left:2px solid #e5e5e5}
.timeline-item::before{content:'';position:absolute;left:-6px;top:4px;width:10px;height:10px;border-radius:50%;background:#e11d48}
.btn-dark{background:#0a0a0a;color:#fafafa;border:none;padding:14px 32px;border-radius:10px;font-weight:600;cursor:pointer;transition:all 0.3s;font-size:15px}
.btn-dark:hover{background:#e11d48;transform:translateY(-2px)}
.btn-outline{border:1.5px solid #d4d4d4;color:#0a0a0a;padding:14px 32px;border-radius:10px;font-weight:500;cursor:pointer;transition:all 0.3s;background:transparent;font-size:15px}
.btn-outline:hover{border-color:#e11d48;color:#e11d48}
.toast{position:fixed;bottom:24px;right:24px;background:#0a0a0a;color:#fafafa;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:500;transform:translateY(100px);opacity:0;transition:all 0.4s;z-index:9999}
.toast.show{transform:translateY(0);opacity:1}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.nav-blur{backdrop-filter:blur(12px);background:rgba(250,250,250,0.85)}
.marquee{overflow:hidden;white-space:nowrap}
.marquee-inner{display:inline-block;animation:marquee 25s linear infinite}
@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.stat-num{font-size:clamp(2rem,5vw,3.5rem);font-weight:700;letter-spacing:-0.03em}
.detail-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:100;display:none;align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto}
.detail-panel{background:#fff;border-radius:24px;max-width:900px;width:100%;position:relative;margin:60px auto}
</style>
</head>
<body>

<div class="toast" id="toast"></div>

<!-- Project Detail Overlay -->
<div class="detail-overlay" id="detail-overlay" onclick="if(event.target===this)closeProject()">
  <div class="detail-panel" id="detail-panel"></div>
</div>

<!-- Nav -->
<nav class="nav-blur fixed top-0 left-0 right-0 z-50" style="padding:16px 0">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between">
    <div style="font-weight:700;font-size:18px;cursor:pointer" onclick="window.scrollTo({top:0,behavior:'smooth'})">
      <span class="accent">Y</span>uki.
    </div>
    <div style="display:flex;align-items:center;gap:28px" id="nav-links">
      <a href="#work" style="text-decoration:none;color:#737373;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#e11d48'" onmouseout="this.style.color='#737373'">作品</a>
      <a href="#about" style="text-decoration:none;color:#737373;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#e11d48'" onmouseout="this.style.color='#737373'">關於</a>
      <a href="#experience" style="text-decoration:none;color:#737373;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#e11d48'" onmouseout="this.style.color='#737373'">經歷</a>
      <a href="#contact" style="text-decoration:none;color:#737373;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#e11d48'" onmouseout="this.style.color='#737373'">聯繫</a>
    </div>
    <a href="#contact" class="btn-dark" style="padding:8px 20px;font-size:13px;text-decoration:none;color:#fafafa">Say Hello</a>
  </div>
</nav>

<!-- Hero -->
<section style="padding:140px 24px 80px;position:relative">
  <div style="max-width:1200px;margin:0 auto">
    <div class="reveal" style="margin-bottom:40px">
      <p style="font-size:16px;color:#737373;margin-bottom:16px">UI/UX Designer × 台北</p>
      <h1 class="hero-title">
        CRAFTING<br>
        <span class="accent">DIGITAL</span><br>
        EXPERIENCES
      </h1>
    </div>
    <div class="reveal" style="display:flex;justify-content:space-between;align-items:end;flex-wrap:wrap;gap:24px">
      <p style="font-size:16px;color:#737373;max-width:400px;line-height:1.7">
        專注於創造直覺、美觀且有意義的數位體驗。<br>
        6 年產品設計經驗，服務過 SaaS、FinTech、電商。
      </p>
      <div style="display:flex;gap:40px">
        <div>
          <div class="stat-num">42+</div>
          <div style="font-size:13px;color:#737373">專案</div>
        </div>
        <div>
          <div class="stat-num">6</div>
          <div style="font-size:13px;color:#737373">年經驗</div>
        </div>
        <div>
          <div class="stat-num">15</div>
          <div style="font-size:13px;color:#737373">品牌客戶</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Marquee -->
<section style="padding:24px 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;overflow:hidden">
  <div class="marquee">
    <div class="marquee-inner" style="font-size:14px;color:#a3a3a3;font-weight:500;letter-spacing:4px">
      UI DESIGN &nbsp;•&nbsp; UX RESEARCH &nbsp;•&nbsp; DESIGN SYSTEM &nbsp;•&nbsp; PROTOTYPING &nbsp;•&nbsp; USER TESTING &nbsp;•&nbsp; BRANDING &nbsp;•&nbsp; MOTION DESIGN &nbsp;•&nbsp; FIGMA &nbsp;•&nbsp; UI DESIGN &nbsp;•&nbsp; UX RESEARCH &nbsp;•&nbsp; DESIGN SYSTEM &nbsp;•&nbsp; PROTOTYPING &nbsp;•&nbsp; USER TESTING &nbsp;•&nbsp; BRANDING &nbsp;•&nbsp; MOTION DESIGN &nbsp;•&nbsp; FIGMA &nbsp;•&nbsp;
    </div>
  </div>
</section>

<!-- Work -->
<section id="work" style="padding:80px 24px">
  <div style="max-width:1200px;margin:0 auto">
    <div class="reveal" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:48px">
      <h2 style="font-size:32px;font-weight:700">Selected Work</h2>
      <span style="font-size:14px;color:#737373">2022 — 2026</span>
    </div>
    <!-- Project Grid: 2-column asymmetric -->
    <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:24px;margin-bottom:24px">
      <div class="reveal project-card" style="background:#1a1a2e" onclick="showProject(0)">
        <div class="project-thumb" style="background:linear-gradient(135deg,#1a1a2e,#3730a3)">
          <span style="font-size:80px">📊</span>
        </div>
        <div class="project-overlay">
          <span style="font-size:12px;color:#a78bfa;font-weight:600;letter-spacing:2px;margin-bottom:8px">FINTECH</span>
          <h3 style="font-size:24px;font-weight:700;color:#fff;margin-bottom:6px">WealthFlow Dashboard</h3>
          <p style="font-size:14px;color:rgba(255,255,255,0.7)">投資組合管理平台 — 重新定義理財體驗</p>
        </div>
      </div>
      <div class="reveal project-card" style="background:#fef2f2" onclick="showProject(1)">
        <div class="project-thumb" style="background:linear-gradient(135deg,#fef2f2,#fecaca)">
          <span style="font-size:80px">🛍️</span>
        </div>
        <div class="project-overlay">
          <span style="font-size:12px;color:#e11d48;font-weight:600;letter-spacing:2px;margin-bottom:8px">E-COMMERCE</span>
          <h3 style="font-size:24px;font-weight:700;color:#fff;margin-bottom:6px">LUXE Marketplace</h3>
          <p style="font-size:14px;color:rgba(255,255,255,0.7)">精品二手交易平台 App 設計</p>
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:0.8fr 1.2fr;gap:24px;margin-bottom:24px">
      <div class="reveal project-card" style="background:#ecfdf5" onclick="showProject(2)">
        <div class="project-thumb" style="background:linear-gradient(135deg,#ecfdf5,#a7f3d0)">
          <span style="font-size:80px">🏥</span>
        </div>
        <div class="project-overlay">
          <span style="font-size:12px;color:#10b981;font-weight:600;letter-spacing:2px;margin-bottom:8px">HEALTH TECH</span>
          <h3 style="font-size:24px;font-weight:700;color:#fff;margin-bottom:6px">MediConnect</h3>
          <p style="font-size:14px;color:rgba(255,255,255,0.7)">遠距醫療 App — 患者端體驗設計</p>
        </div>
      </div>
      <div class="reveal project-card" style="background:#0a0a0a" onclick="showProject(3)">
        <div class="project-thumb" style="background:linear-gradient(135deg,#0a0a0a,#262626)">
          <span style="font-size:80px">🎵</span>
        </div>
        <div class="project-overlay">
          <span style="font-size:12px;color:#fbbf24;font-weight:600;letter-spacing:2px;margin-bottom:8px">SAAS</span>
          <h3 style="font-size:24px;font-weight:700;color:#fff;margin-bottom:6px">SoundForge Studio</h3>
          <p style="font-size:14px;color:rgba(255,255,255,0.7)">線上音樂工作站 — Design System</p>
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <div class="reveal project-card" style="background:#faf5ff" onclick="showProject(4)">
        <div class="project-thumb" style="background:linear-gradient(135deg,#faf5ff,#e9d5ff)">
          <span style="font-size:80px">✈️</span>
        </div>
        <div class="project-overlay">
          <span style="font-size:12px;color:#a855f7;font-weight:600;letter-spacing:2px;margin-bottom:8px">TRAVEL</span>
          <h3 style="font-size:24px;font-weight:700;color:#fff;margin-bottom:6px">Wanderlust</h3>
          <p style="font-size:14px;color:rgba(255,255,255,0.7)">旅遊行程 AI 規劃 App</p>
        </div>
      </div>
      <div class="reveal project-card" style="background:#fff7ed" onclick="showProject(5)">
        <div class="project-thumb" style="background:linear-gradient(135deg,#fff7ed,#fed7aa)">
          <span style="font-size:80px">🍽️</span>
        </div>
        <div class="project-overlay">
          <span style="font-size:12px;color:#ea580c;font-weight:600;letter-spacing:2px;margin-bottom:8px">FOOD TECH</span>
          <h3 style="font-size:24px;font-weight:700;color:#fff;margin-bottom:6px">FoodieMap</h3>
          <p style="font-size:14px;color:rgba(255,255,255,0.7)">美食地圖社群 — 品牌識別與 App</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- About -->
<section id="about" style="padding:80px 24px;background:#f5f5f5">
  <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1.5fr;gap:60px;align-items:center">
    <div class="reveal">
      <div style="background:linear-gradient(135deg,#e11d48,#f43f5e);border-radius:24px;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
        <span style="font-size:120px;filter:grayscale(0.3)">👩‍🎨</span>
        <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.6));padding:24px">
          <div style="font-size:24px;font-weight:700;color:#fff">Yuki Chen</div>
          <div style="font-size:14px;color:rgba(255,255,255,0.8)">陳雨琪</div>
        </div>
      </div>
    </div>
    <div class="reveal">
      <div style="font-size:13px;color:#e11d48;font-weight:600;letter-spacing:2px;margin-bottom:12px">ABOUT ME</div>
      <h2 style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700;margin-bottom:20px;line-height:1.3">
        設計不只是畫面，<br>是解決問題的過程。
      </h2>
      <p style="font-size:15px;color:#525252;line-height:1.8;margin-bottom:16px">
        Hi，我是 Yuki。台北出生，在倫敦 Goldsmiths 唸完互動設計碩士後，回到台灣投入產品設計領域。
        曾在 Pinkoi、LINE、街口支付的設計團隊工作，現為獨立設計師。
      </p>
      <p style="font-size:15px;color:#525252;line-height:1.8;margin-bottom:24px">
        我相信好的設計來自於深入理解用戶需求。每個專案我都從用戶研究開始，透過原型測試迭代，
        直到找到「對」的解法。擅長將複雜的系統簡化為直覺的介面。
      </p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:32px">
        <span class="skill-tag">Figma</span>
        <span class="skill-tag">Framer</span>
        <span class="skill-tag">Principle</span>
        <span class="skill-tag">User Research</span>
        <span class="skill-tag">Design System</span>
        <span class="skill-tag">Prototyping</span>
        <span class="skill-tag">A/B Testing</span>
        <span class="skill-tag">HTML/CSS</span>
        <span class="skill-tag">React</span>
      </div>
      <div style="display:flex;gap:12px">
        <button class="btn-dark" onclick="showToast('📄 履歷下載中...')">下載履歷</button>
        <button class="btn-outline" onclick="document.getElementById('contact').scrollIntoView({behavior:'smooth'})">聊聊合作</button>
      </div>
    </div>
  </div>
</section>

<!-- Experience -->
<section id="experience" style="padding:80px 24px">
  <div style="max-width:800px;margin:0 auto">
    <div class="reveal" style="margin-bottom:48px">
      <div style="font-size:13px;color:#e11d48;font-weight:600;letter-spacing:2px;margin-bottom:12px">EXPERIENCE</div>
      <h2 style="font-size:32px;font-weight:700">工作經歷</h2>
    </div>
    <div class="reveal timeline-item">
      <div style="font-size:12px;color:#e11d48;font-weight:600;margin-bottom:4px">2024 — Present</div>
      <h3 style="font-size:18px;font-weight:700;margin-bottom:4px">獨立設計師</h3>
      <p style="font-size:14px;color:#737373;margin-bottom:4px">Freelance</p>
      <p style="font-size:13px;color:#525252;line-height:1.7">服務 FinTech、SaaS、電商客戶。主導 UI/UX 全流程，從研究到交付。</p>
    </div>
    <div class="reveal timeline-item">
      <div style="font-size:12px;color:#e11d48;font-weight:600;margin-bottom:4px">2022 — 2024</div>
      <h3 style="font-size:18px;font-weight:700;margin-bottom:4px">Senior Product Designer</h3>
      <p style="font-size:14px;color:#737373;margin-bottom:4px">LINE Taiwan</p>
      <p style="font-size:13px;color:#525252;line-height:1.7">負責 LINE Pay 與 LINE Shopping 的產品設計，帶領 3 人小組。建立設計系統。</p>
    </div>
    <div class="reveal timeline-item">
      <div style="font-size:12px;color:#e11d48;font-weight:600;margin-bottom:4px">2020 — 2022</div>
      <h3 style="font-size:18px;font-weight:700;margin-bottom:4px">Product Designer</h3>
      <p style="font-size:14px;color:#737373;margin-bottom:4px">Pinkoi</p>
      <p style="font-size:13px;color:#525252;line-height:1.7">設計師體驗與買家旅程優化。參與國際化設計，支援日本與泰國市場。</p>
    </div>
    <div class="reveal timeline-item" style="border:none">
      <div style="font-size:12px;color:#e11d48;font-weight:600;margin-bottom:4px">2018 — 2020</div>
      <h3 style="font-size:18px;font-weight:700;margin-bottom:4px">UI Designer</h3>
      <p style="font-size:14px;color:#737373;margin-bottom:4px">街口支付 JKOPAY</p>
      <p style="font-size:13px;color:#525252;line-height:1.7">App 介面設計、行銷活動頁面設計。從 Junior 成長為團隊核心設計師。</p>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" style="padding:80px 24px;background:#0a0a0a;color:#fafafa">
  <div style="max-width:800px;margin:0 auto;text-align:center">
    <div class="reveal">
      <div style="font-size:13px;color:#e11d48;font-weight:600;letter-spacing:2px;margin-bottom:16px">GET IN TOUCH</div>
      <h2 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:700;margin-bottom:16px">
        有專案想聊？
      </h2>
      <p style="font-size:16px;color:#737373;margin-bottom:40px">
        歡迎來信討論合作機會，我通常會在 24 小時內回覆。
      </p>
    </div>
    <div class="reveal" style="background:#18181b;border-radius:20px;padding:40px;text-align:left">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div>
          <label style="font-size:13px;color:#a3a3a3;display:block;margin-bottom:6px">姓名</label>
          <input type="text" placeholder="你的名字" style="width:100%;padding:12px 16px;border:1px solid #27272a;border-radius:8px;background:#0a0a0a;color:#fafafa;font-size:14px;outline:none" onfocus="this.style.borderColor='#e11d48'" onblur="this.style.borderColor='#27272a'">
        </div>
        <div>
          <label style="font-size:13px;color:#a3a3a3;display:block;margin-bottom:6px">Email</label>
          <input type="email" placeholder="email@example.com" style="width:100%;padding:12px 16px;border:1px solid #27272a;border-radius:8px;background:#0a0a0a;color:#fafafa;font-size:14px;outline:none" onfocus="this.style.borderColor='#e11d48'" onblur="this.style.borderColor='#27272a'">
        </div>
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:13px;color:#a3a3a3;display:block;margin-bottom:6px">專案類型</label>
        <select style="width:100%;padding:12px 16px;border:1px solid #27272a;border-radius:8px;background:#0a0a0a;color:#fafafa;font-size:14px;outline:none">
          <option>UI/UX 設計</option>
          <option>Design System</option>
          <option>品牌識別</option>
          <option>App 設計</option>
          <option>其他</option>
        </select>
      </div>
      <div style="margin-bottom:24px">
        <label style="font-size:13px;color:#a3a3a3;display:block;margin-bottom:6px">訊息</label>
        <textarea rows="4" placeholder="描述你的專案..." style="width:100%;padding:12px 16px;border:1px solid #27272a;border-radius:8px;background:#0a0a0a;color:#fafafa;font-size:14px;outline:none;resize:vertical" onfocus="this.style.borderColor='#e11d48'" onblur="this.style.borderColor='#27272a'"></textarea>
      </div>
      <button class="btn-dark" style="width:100%;background:#e11d48;padding:14px" onclick="showToast('📨 訊息已送出，感謝聯繫！')" onmouseover="this.style.background='#be123c'" onmouseout="this.style.background='#e11d48'">送出訊息</button>
    </div>
    <div style="display:flex;justify-content:center;gap:32px;margin-top:32px">
      <a style="font-size:14px;color:#737373;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#e11d48'" onmouseout="this.style.color='#737373'">Dribbble</a>
      <a style="font-size:14px;color:#737373;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#e11d48'" onmouseout="this.style.color='#737373'">Behance</a>
      <a style="font-size:14px;color:#737373;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#e11d48'" onmouseout="this.style.color='#737373'">LinkedIn</a>
      <a style="font-size:14px;color:#737373;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#e11d48'" onmouseout="this.style.color='#737373'">Instagram</a>
    </div>
  </div>
</section>

<!-- Footer -->
<footer style="padding:24px;background:#0a0a0a;border-top:1px solid #1a1a1a;text-align:center">
  <p style="font-size:12px;color:#525252">© 2026 Yuki Chen. Designed with ♥ in Taipei.</p>
</footer>

<script>
const projects=[
  {title:'WealthFlow Dashboard',cat:'FINTECH',color:'#6366f1',emoji:'📊',role:'Lead Designer',year:'2025',desc:'為新創投資平台打造全新的 Dashboard 體驗。從用戶訪談開始，歷經 3 輪原型測試，最終設計出一套能讓用戶 3 秒內掌握投資組合狀態的介面。',impact:['用戶留存率提升 34%','NPS 從 38 提升到 67','獲 Red Dot Design 提名'],tools:['Figma','Principle','Maze','Notion']},
  {title:'LUXE Marketplace',cat:'E-COMMERCE',color:'#e11d48',emoji:'🛍️',role:'Product Designer',year:'2024',desc:'精品二手交易 App，解決信任與鑑定問題。設計了獨特的「AI 鑑定流程」與「安心交易」體驗，讓買賣雙方都感到安全。',impact:['成交率提升 52%','首月 GMV 達 $3.2M','App Store 精選推薦'],tools:['Figma','Framer','UserTesting','Miro']},
  {title:'MediConnect',cat:'HEALTH TECH',color:'#10b981',emoji:'🏥',role:'UX Designer',year:'2024',desc:'遠距醫療 App 患者端設計。挑戰是讓年長用戶也能輕鬆使用視訊看診功能。進行了 30+ 場用戶測試，設計出極簡流程。',impact:['60+ 歲用戶完成率 89%','看診預約時間縮短 70%','獲 iF Design Award'],tools:['Figma','Lookback','Optimal Workshop']},
  {title:'SoundForge Studio',cat:'SAAS',color:'#eab308',emoji:'🎵',role:'Design System Lead',year:'2023',desc:'線上音樂工作站的 Design System 建構。從 0 到 1 建立包含 200+ 元件的系統，支援深淺色主題與無障礙設計。',impact:['開發效率提升 3x','設計一致性達 98%','200+ 元件庫'],tools:['Figma','Storybook','ZeroHeight']},
  {title:'Wanderlust',cat:'TRAVEL',color:'#a855f7',emoji:'✈️',role:'Product Designer',year:'2023',desc:'AI 旅遊行程規劃 App。用自然語言描述想去的地方，AI 自動規劃路線、推薦景點、預訂住宿。',impact:['Beta 用戶 50K+','平均行程規劃時間 2 分鐘','被 TechCrunch 報導'],tools:['Figma','ProtoPie','Hotjar']},
  {title:'FoodieMap',cat:'FOOD TECH',color:'#ea580c',emoji:'🍽️',role:'Brand & Product Designer',year:'2022',desc:'美食地圖社群 App，從品牌識別到產品設計的完整案例。創造了獨特的「味覺地圖」互動方式。',impact:['下載量 120K+','日活用戶 15K','獲 Golden Pin 設計獎'],tools:['Figma','After Effects','Illustrator']}
];

function showProject(i){
  const p=projects[i];
  document.getElementById('detail-panel').innerHTML=`
    <button onclick="closeProject()" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:#737373;z-index:1">✕</button>
    <div style="background:linear-gradient(135deg,${p.color}22,${p.color}11);padding:60px;text-align:center;border-radius:24px 24px 0 0">
      <span style="font-size:100px">${p.emoji}</span>
    </div>
    <div style="padding:40px">
      <div style="font-size:12px;color:${p.color};font-weight:600;letter-spacing:2px;margin-bottom:8px">${p.cat}</div>
      <h2 style="font-size:28px;font-weight:700;margin-bottom:8px">${p.title}</h2>
      <div style="display:flex;gap:16px;margin-bottom:24px;font-size:13px;color:#737373">
        <span>${p.role}</span><span>•</span><span>${p.year}</span>
      </div>
      <p style="font-size:15px;color:#525252;line-height:1.8;margin-bottom:24px">${p.desc}</p>
      <div style="margin-bottom:24px">
        <h4 style="font-size:14px;font-weight:600;margin-bottom:12px">Impact</h4>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${p.impact.map(imp=>`<div style="display:flex;align-items:center;gap:8px"><span style="color:#e11d48;font-weight:700">→</span><span style="font-size:14px">${imp}</span></div>`).join('')}
        </div>
      </div>
      <div>
        <h4 style="font-size:14px;font-weight:600;margin-bottom:12px">Tools</h4>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${p.tools.map(t=>`<span class="skill-tag" style="font-size:12px;padding:4px 12px">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
  document.getElementById('detail-overlay').style.display='flex';
}
function closeProject(){document.getElementById('detail-overlay').style.display='none'}

function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}

document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();const t=document.querySelector(a.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth'})})});
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}})},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
</script>

</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
