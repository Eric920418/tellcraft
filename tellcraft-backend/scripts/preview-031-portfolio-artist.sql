INSERT INTO template_previews (template_id, html_content, version)
VALUES ('5a839472-c0f3-4184-b565-9cabf107e3b8', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>林若水 — 插畫與藝術創作</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600&family=Noto+Serif+TC:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Serif TC',serif;background:#fdf8f3;color:#2c2420;overflow-x:hidden}
.serif{font-family:'Cormorant Garamond','Noto Serif TC',serif}
.warm{color:#b45309}
.bg-warm{background:#b45309}
.gallery-item{position:relative;border-radius:12px;overflow:hidden;cursor:pointer;transition:all 0.4s}
.gallery-item:hover{transform:translateY(-6px);box-shadow:0 20px 40px rgba(0,0,0,0.1)}
.gallery-item:hover .gallery-overlay{opacity:1}
.gallery-overlay{position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(44,36,32,0.85));display:flex;flex-direction:column;justify-content:flex-end;padding:24px;opacity:0;transition:opacity 0.4s}
.gallery-thumb{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}
.btn-warm{background:#b45309;color:#fdf8f3;border:none;padding:12px 28px;border-radius:8px;font-weight:600;cursor:pointer;transition:all 0.3s;font-size:14px}
.btn-warm:hover{background:#92400e;transform:translateY(-2px)}
.btn-outline{border:1.5px solid #d6ccc2;color:#2c2420;padding:12px 28px;border-radius:8px;font-weight:500;cursor:pointer;transition:all 0.3s;background:transparent;font-size:14px}
.btn-outline:hover{border-color:#b45309;color:#b45309}
.toast{position:fixed;bottom:24px;right:24px;background:#2c2420;color:#fdf8f3;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:500;transform:translateY(100px);opacity:0;transition:all 0.4s;z-index:9999}
.toast.show{transform:translateY(0);opacity:1}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.cat-btn{padding:8px 18px;border-radius:20px;font-size:13px;cursor:pointer;transition:all 0.2s;border:1px solid #d6ccc2;background:transparent;color:#78716c;font-weight:500}
.cat-btn.active{background:#2c2420;color:#fdf8f3;border-color:#2c2420}
.lightbox{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(44,36,32,0.92);z-index:100;display:none;align-items:center;justify-content:center;padding:24px;flex-direction:column}
.lightbox-content{max-width:800px;width:100%;text-align:center}
</style>
</head>
<body>

<div class="toast" id="toast"></div>

<!-- Lightbox -->
<div class="lightbox" id="lightbox" onclick="closeLightbox()">
  <div class="lightbox-content" id="lightbox-content" onclick="event.stopPropagation()"></div>
  <button onclick="closeLightbox()" style="position:absolute;top:24px;right:24px;background:none;border:none;color:#fdf8f3;font-size:28px;cursor:pointer">✕</button>
  <div style="position:absolute;bottom:24px;display:flex;gap:16px">
    <button onclick="navLightbox(-1)" style="background:rgba(255,255,255,0.1);border:none;color:#fdf8f3;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:14px">← 上一幅</button>
    <button onclick="navLightbox(1)" style="background:rgba(255,255,255,0.1);border:none;color:#fdf8f3;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:14px">下一幅 →</button>
  </div>
</div>

<!-- Nav -->
<nav style="position:fixed;top:0;left:0;right:0;z-index:50;backdrop-filter:blur(12px);background:rgba(253,248,243,0.9);padding:16px 0;border-bottom:1px solid #ebe5db">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between">
    <div style="cursor:pointer" onclick="showPage('home');window.scrollTo({top:0,behavior:'smooth'})">
      <span class="serif" style="font-size:22px;font-weight:700;color:#2c2420">若水</span>
      <span style="font-size:11px;color:#a8a29e;margin-left:8px;letter-spacing:2px">RUOSHUI</span>
    </div>
    <div style="display:flex;align-items:center;gap:28px" id="nav-links">
      <a onclick="showPage('home')" style="text-decoration:none;color:#a8a29e;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b45309'" onmouseout="this.style.color='#a8a29e'">作品</a>
      <a onclick="showPage('about')" style="text-decoration:none;color:#a8a29e;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b45309'" onmouseout="this.style.color='#a8a29e'">關於</a>
      <a onclick="showPage('exhibitions')" style="text-decoration:none;color:#a8a29e;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b45309'" onmouseout="this.style.color='#a8a29e'">展覽</a>
      <a onclick="showPage('shop')" style="text-decoration:none;color:#a8a29e;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b45309'" onmouseout="this.style.color='#a8a29e'">商店</a>
      <a onclick="showPage('contact')" style="text-decoration:none;color:#a8a29e;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b45309'" onmouseout="this.style.color='#a8a29e'">聯繫</a>
    </div>
  </div>
</nav>

<!-- Home Page -->
<div id="page-home">
<!-- Hero -->
<section style="padding:120px 24px 60px">
  <div style="max-width:1200px;margin:0 auto;text-align:center">
    <div class="reveal" style="margin-bottom:40px">
      <p style="font-size:14px;color:#a8a29e;letter-spacing:3px;margin-bottom:16px">ILLUSTRATOR & ARTIST</p>
      <h1 class="serif" style="font-size:clamp(2.5rem,7vw,5rem);font-weight:700;line-height:1.05;margin-bottom:20px">
        以畫筆描繪<br><span class="warm">世界的溫度</span>
      </h1>
      <p style="font-size:16px;color:#78716c;max-width:500px;margin:0 auto;line-height:1.8">
        在水彩與數位之間遊走，捕捉日常生活中被忽略的美好。每一幅畫都是一段靜默的對話。
      </p>
    </div>
  </div>
</section>

<!-- Gallery Filter -->
<section style="padding:0 24px 24px">
  <div style="max-width:1200px;margin:0 auto;text-align:center">
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:32px">
      <button class="cat-btn active" onclick="filterGallery(this,'all')">全部</button>
      <button class="cat-btn" onclick="filterGallery(this,'watercolor')">水彩</button>
      <button class="cat-btn" onclick="filterGallery(this,'digital')">數位插畫</button>
      <button class="cat-btn" onclick="filterGallery(this,'ink')">水墨</button>
      <button class="cat-btn" onclick="filterGallery(this,'sketch')">速寫</button>
    </div>
  </div>
</section>

<!-- Gallery Grid -->
<section style="padding:0 24px 80px">
  <div style="max-width:1200px;margin:0 auto">
    <div id="gallery-grid" style="columns:3;column-gap:20px"></div>
  </div>
</section>
</div>

<!-- About Page -->
<div id="page-about" style="display:none">
<section style="padding:100px 24px 80px">
  <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1.3fr;gap:60px;align-items:start">
    <div>
      <div style="background:linear-gradient(135deg,#fde68a,#f59e0b);border-radius:20px;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;position:relative">
        <span style="font-size:120px">👩‍🎨</span>
      </div>
    </div>
    <div>
      <div style="font-size:13px;color:#b45309;font-weight:600;letter-spacing:2px;margin-bottom:12px">ABOUT</div>
      <h2 class="serif" style="font-size:clamp(1.8rem,3vw,2.8rem);font-weight:700;margin-bottom:20px;line-height:1.3">
        林若水<br>Ruoshui Lin
      </h2>
      <p style="font-size:15px;color:#57534e;line-height:1.9;margin-bottom:16px">
        1992 年生於台南，台北藝術大學美術系畢業，後赴英國皇家藝術學院（RCA）攻讀插畫碩士。
        作品曾入選 Bologna 兒童插畫展、3×3 國際插畫獎，並在台北、東京、倫敦舉辦過個展。
      </p>
      <p style="font-size:15px;color:#57534e;line-height:1.9;margin-bottom:16px">
        創作靈感來自日常觀察：菜市場的色彩、老城區的光影、雨後的街道氣味。
        擅長以水彩的透明層次與數位繪畫的精確構圖，創造充滿溫度與詩意的畫面。
      </p>
      <p class="serif" style="font-size:20px;color:#b45309;font-style:italic;margin-bottom:24px;line-height:1.6">
        "我畫的不是物件本身，而是物件與光之間的關係。"
      </p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
        <div style="background:#fff;border-radius:12px;padding:20px;text-align:center;border:1px solid #ebe5db">
          <div style="font-size:28px;font-weight:700;color:#b45309">12</div>
          <div style="font-size:12px;color:#a8a29e">個展</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:20px;text-align:center;border:1px solid #ebe5db">
          <div style="font-size:28px;font-weight:700;color:#b45309">200+</div>
          <div style="font-size:12px;color:#a8a29e">作品</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:20px;text-align:center;border:1px solid #ebe5db">
          <div style="font-size:28px;font-weight:700;color:#b45309">8</div>
          <div style="font-size:12px;color:#a8a29e">獎項</div>
        </div>
      </div>
    </div>
  </div>
</section>
</div>

<!-- Exhibitions Page -->
<div id="page-exhibitions" style="display:none">
<section style="padding:100px 24px 80px">
  <div style="max-width:800px;margin:0 auto">
    <h1 class="serif" style="font-size:36px;font-weight:700;margin-bottom:40px;text-align:center">展覽紀錄</h1>
    <div style="display:flex;flex-direction:column;gap:24px">
      <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #ebe5db;display:flex;gap:24px;align-items:center;transition:all 0.3s;cursor:pointer" onmouseover="this.style.boxShadow='0 8px 24px rgba(0,0,0,0.06)'" onmouseout="this.style.boxShadow='none'" onclick="showToast('展覽詳情頁面開發中')">
        <div style="min-width:80px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#b45309">2026</div>
          <div style="font-size:12px;color:#a8a29e">MAR</div>
        </div>
        <div>
          <div style="font-size:11px;color:#b45309;font-weight:600;margin-bottom:4px">個展</div>
          <h3 style="font-size:18px;font-weight:700;margin-bottom:4px">水的記憶</h3>
          <p style="font-size:13px;color:#78716c">台北市立美術館 · 2026.03.15 — 05.30</p>
        </div>
      </div>
      <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #ebe5db;display:flex;gap:24px;align-items:center;cursor:pointer" onclick="showToast('展覽詳情頁面開發中')">
        <div style="min-width:80px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#b45309">2025</div>
          <div style="font-size:12px;color:#a8a29e">NOV</div>
        </div>
        <div>
          <div style="font-size:11px;color:#78716c;font-weight:600;margin-bottom:4px">聯展</div>
          <h3 style="font-size:18px;font-weight:700;margin-bottom:4px">亞洲當代插畫展</h3>
          <p style="font-size:13px;color:#78716c">東京都美術館 · 2025.11.01 — 12.20</p>
        </div>
      </div>
      <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #ebe5db;display:flex;gap:24px;align-items:center;cursor:pointer" onclick="showToast('展覽詳情頁面開發中')">
        <div style="min-width:80px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#b45309">2025</div>
          <div style="font-size:12px;color:#a8a29e">JUN</div>
        </div>
        <div>
          <div style="font-size:11px;color:#b45309;font-weight:600;margin-bottom:4px">個展</div>
          <h3 style="font-size:18px;font-weight:700;margin-bottom:4px">日常的詩</h3>
          <p style="font-size:13px;color:#78716c">倫敦 Somerset House · 2025.06.10 — 08.15</p>
        </div>
      </div>
      <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #ebe5db;display:flex;gap:24px;align-items:center;cursor:pointer" onclick="showToast('展覽詳情頁面開發中')">
        <div style="min-width:80px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#b45309">2024</div>
          <div style="font-size:12px;color:#a8a29e">SEP</div>
        </div>
        <div>
          <div style="font-size:11px;color:#78716c;font-weight:600;margin-bottom:4px">受邀</div>
          <h3 style="font-size:18px;font-weight:700;margin-bottom:4px">Bologna 兒童插畫展</h3>
          <p style="font-size:13px;color:#78716c">義大利波隆那 · 入選作品展出</p>
        </div>
      </div>
    </div>
  </div>
</section>
</div>

<!-- Shop Page -->
<div id="page-shop" style="display:none">
<section style="padding:100px 24px 80px">
  <div style="max-width:1000px;margin:0 auto">
    <h1 class="serif" style="font-size:36px;font-weight:700;margin-bottom:8px;text-align:center">藝術商店</h1>
    <p style="text-align:center;color:#a8a29e;font-size:15px;margin-bottom:40px">限量版畫、原作、周邊商品</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #ebe5db;transition:all 0.3s;cursor:pointer" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='';this.style.boxShadow=''" onclick="showToast('🛒 已加入購物車')">
        <div style="background:#fef3c7;padding:40px;text-align:center;font-size:64px">🖼️</div>
        <div style="padding:20px">
          <div style="font-size:11px;color:#b45309;font-weight:600;margin-bottom:4px">限量版畫</div>
          <h3 style="font-size:16px;font-weight:700;margin-bottom:4px">晨光市場</h3>
          <p style="font-size:12px;color:#a8a29e;margin-bottom:8px">Giclée 微噴 · 40×50cm · 限量 30</p>
          <div style="font-size:18px;font-weight:700;color:#b45309">$4,800</div>
        </div>
      </div>
      <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #ebe5db;transition:all 0.3s;cursor:pointer" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='';this.style.boxShadow=''" onclick="showToast('🛒 已加入購物車')">
        <div style="background:#dbeafe;padding:40px;text-align:center;font-size:64px">📒</div>
        <div style="padding:20px">
          <div style="font-size:11px;color:#78716c;font-weight:600;margin-bottom:4px">插畫集</div>
          <h3 style="font-size:16px;font-weight:700;margin-bottom:4px">日常的詩 作品集</h3>
          <p style="font-size:12px;color:#a8a29e;margin-bottom:8px">精裝 · 160頁 · 含作者簽名</p>
          <div style="font-size:18px;font-weight:700;color:#b45309">$1,280</div>
        </div>
      </div>
      <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #ebe5db;transition:all 0.3s;cursor:pointer" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='';this.style.boxShadow=''" onclick="showToast('🛒 已加入購物車')">
        <div style="background:#fce7f3;padding:40px;text-align:center;font-size:64px">🎴</div>
        <div style="padding:20px">
          <div style="font-size:11px;color:#78716c;font-weight:600;margin-bottom:4px">周邊</div>
          <h3 style="font-size:16px;font-weight:700;margin-bottom:4px">水彩明信片組</h3>
          <p style="font-size:12px;color:#a8a29e;margin-bottom:8px">8 張一組 · 350g 棉漿紙</p>
          <div style="font-size:18px;font-weight:700;color:#b45309">$380</div>
        </div>
      </div>
    </div>
  </div>
</section>
</div>

<!-- Contact Page -->
<div id="page-contact" style="display:none">
<section style="padding:100px 24px 80px">
  <div style="max-width:600px;margin:0 auto;text-align:center">
    <div style="font-size:13px;color:#b45309;font-weight:600;letter-spacing:2px;margin-bottom:16px">CONTACT</div>
    <h1 class="serif" style="font-size:36px;font-weight:700;margin-bottom:16px">合作洽詢</h1>
    <p style="font-size:15px;color:#78716c;margin-bottom:40px;line-height:1.7">接受插畫委託、展覽邀約、出版合作。歡迎來信。</p>
    <div style="background:#fff;border-radius:20px;padding:36px;border:1px solid #ebe5db;text-align:left">
      <div style="margin-bottom:16px">
        <label style="font-size:13px;color:#78716c;display:block;margin-bottom:6px">姓名</label>
        <input type="text" placeholder="你的名字" style="width:100%;padding:12px 16px;border:1px solid #d6ccc2;border-radius:8px;font-size:14px;outline:none;background:#fdf8f3" onfocus="this.style.borderColor='#b45309'" onblur="this.style.borderColor='#d6ccc2'">
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:13px;color:#78716c;display:block;margin-bottom:6px">Email</label>
        <input type="email" placeholder="email@example.com" style="width:100%;padding:12px 16px;border:1px solid #d6ccc2;border-radius:8px;font-size:14px;outline:none;background:#fdf8f3" onfocus="this.style.borderColor='#b45309'" onblur="this.style.borderColor='#d6ccc2'">
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:13px;color:#78716c;display:block;margin-bottom:6px">合作類型</label>
        <select style="width:100%;padding:12px 16px;border:1px solid #d6ccc2;border-radius:8px;font-size:14px;outline:none;background:#fdf8f3">
          <option>插畫委託</option>
          <option>展覽邀約</option>
          <option>出版合作</option>
          <option>其他</option>
        </select>
      </div>
      <div style="margin-bottom:24px">
        <label style="font-size:13px;color:#78716c;display:block;margin-bottom:6px">訊息</label>
        <textarea rows="4" placeholder="描述你的需求..." style="width:100%;padding:12px 16px;border:1px solid #d6ccc2;border-radius:8px;font-size:14px;outline:none;resize:vertical;background:#fdf8f3" onfocus="this.style.borderColor='#b45309'" onblur="this.style.borderColor='#d6ccc2'"></textarea>
      </div>
      <button class="btn-warm" style="width:100%;padding:14px" onclick="showToast('📨 已送出，感謝來信！')">送出</button>
    </div>
    <div style="display:flex;justify-content:center;gap:28px;margin-top:32px">
      <a style="font-size:14px;color:#a8a29e;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#b45309'" onmouseout="this.style.color='#a8a29e'">Instagram</a>
      <a style="font-size:14px;color:#a8a29e;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#b45309'" onmouseout="this.style.color='#a8a29e'">Behance</a>
      <a style="font-size:14px;color:#a8a29e;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#b45309'" onmouseout="this.style.color='#a8a29e'">Twitter</a>
    </div>
  </div>
</section>
</div>

<!-- Footer -->
<footer style="padding:36px 24px;border-top:1px solid #ebe5db;text-align:center;background:#fff">
  <p class="serif" style="font-size:18px;color:#2c2420;margin-bottom:4px">林若水 Ruoshui Lin</p>
  <p style="font-size:12px;color:#a8a29e">© 2026 All rights reserved. Art & Illustration.</p>
</footer>

<script>
const works=[
  {id:0,title:'晨光市場',cat:'watercolor',medium:'水彩 · 40×50cm',year:'2026',emoji:'🌅',colors:['#fef3c7','#f59e0b'],desc:'清晨五點的南門市場，蔬果攤在暖光下甦醒。'},
  {id:1,title:'雨後巷弄',cat:'watercolor',medium:'水彩 · 30×40cm',year:'2025',emoji:'🌧️',colors:['#dbeafe','#93c5fd'],desc:'大稻埕的窄巷，雨水在磚牆上留下的光影。'},
  {id:2,title:'貓與窗台',cat:'digital',medium:'數位插畫 · 4K',year:'2025',emoji:'🐱',colors:['#fce7f3','#f9a8d4'],desc:'午後陽光灑進窗台，橘貓在花盆間打盹。'},
  {id:3,title:'山嵐',cat:'ink',medium:'水墨 · 60×90cm',year:'2025',emoji:'🏔️',colors:['#f3f4f6','#9ca3af'],desc:'阿里山雲霧繚繞，樹影在霧中若隱若現。'},
  {id:4,title:'咖啡館速寫',cat:'sketch',medium:'鋼筆 · A5',year:'2025',emoji:'☕',colors:['#fef3c7','#d97706'],desc:'民生社區的小咖啡館，老闆在吧台後專注沖泡。'},
  {id:5,title:'夏日海岸',cat:'watercolor',medium:'水彩 · 50×70cm',year:'2024',emoji:'🌊',colors:['#cffafe','#22d3ee'],desc:'墾丁的午後海岸線，浪花與天空融為一體。'},
  {id:6,title:'森林精靈',cat:'digital',medium:'數位插畫 · 4K',year:'2024',emoji:'🧚',colors:['#dcfce7','#86efac'],desc:'童書插畫系列，森林裡住著發光的小精靈。'},
  {id:7,title:'老屋門扉',cat:'ink',medium:'水墨 · 40×60cm',year:'2024',emoji:'🚪',colors:['#fef3c7','#a8a29e'],desc:'台南安平老街，斑駁的木門訴說著歲月。'},
  {id:8,title:'夜市人生',cat:'digital',medium:'數位插畫 · 4K',year:'2024',emoji:'🏮',colors:['#fef2f2','#fca5a5'],desc:'饒河夜市的繁忙與煙火氣，霓虹映照在濕漉漉的地面。'},
  {id:9,title:'竹林風聲',cat:'ink',medium:'水墨 · 50×80cm',year:'2023',emoji:'🎋',colors:['#ecfdf5','#6ee7b7'],desc:'嘉義竹崎，風過竹林的聲音化為墨色。'},
  {id:10,title:'花店女孩',cat:'watercolor',medium:'水彩 · 30×40cm',year:'2023',emoji:'💐',colors:['#fdf2f8','#f9a8d4'],desc:'師大路上的小花店，女孩在修剪枝葉。'},
  {id:11,title:'車站速寫',cat:'sketch',medium:'鋼筆+淡彩 · A5',year:'2023',emoji:'🚂',colors:['#f5f5f4','#a8a29e'],desc:'台北車站大廳，人們在光束下穿梭。'}
];
let currentLightboxIdx=0;

function renderGallery(cat){
  const filtered=cat==='all'?works:works.filter(w=>w.cat===cat);
  const grid=document.getElementById('gallery-grid');
  grid.innerHTML=filtered.map((w,i)=>{
    const heights=['240px','320px','280px','360px','240px','300px'];
    const h=heights[i%6];
    return `<div class="gallery-item reveal visible" style="break-inside:avoid;margin-bottom:20px" onclick="openLightbox(${w.id})">
      <div class="gallery-thumb" style="background:linear-gradient(135deg,${w.colors[0]},${w.colors[1]});height:${h};border-radius:12px">
        <span style="font-size:56px">${w.emoji}</span>
      </div>
      <div class="gallery-overlay">
        <span style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:1px;margin-bottom:4px">${w.medium}</span>
        <h3 style="font-size:18px;font-weight:700;color:#fff">${w.title}</h3>
      </div>
    </div>`;
  }).join('');
}

function filterGallery(btn,cat){
  document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  renderGallery(cat);
}

function openLightbox(id){
  currentLightboxIdx=id;
  renderLightbox();
  document.getElementById('lightbox').style.display='flex';
}
function closeLightbox(){document.getElementById('lightbox').style.display='none'}
function navLightbox(dir){
  currentLightboxIdx=(currentLightboxIdx+dir+works.length)%works.length;
  renderLightbox();
}
function renderLightbox(){
  const w=works[currentLightboxIdx];
  document.getElementById('lightbox-content').innerHTML=`
    <div style="background:linear-gradient(135deg,${w.colors[0]},${w.colors[1]});border-radius:16px;padding:60px;margin-bottom:24px;display:flex;align-items:center;justify-content:center">
      <span style="font-size:120px">${w.emoji}</span>
    </div>
    <h2 class="serif" style="font-size:28px;font-weight:700;color:#fdf8f3;margin-bottom:8px">${w.title}</h2>
    <p style="font-size:14px;color:#a8a29e;margin-bottom:8px">${w.medium} · ${w.year}</p>
    <p style="font-size:15px;color:#d6d3d1;line-height:1.7;max-width:500px;margin:0 auto">${w.desc}</p>
  `;
}

function showPage(page){
  ['home','about','exhibitions','shop','contact'].forEach(p=>{document.getElementById('page-'+p).style.display=p===page?'block':'none'});
  window.scrollTo({top:0,behavior:'smooth'});
}

function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}

renderGallery('all');
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}})},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
</script>

</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
