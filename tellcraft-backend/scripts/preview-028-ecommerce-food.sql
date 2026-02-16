INSERT INTO template_previews (template_id, html_content, version)
VALUES ('5b0fc7e1-2381-4025-9094-0423e49b3596', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>穀光 Grain & Glow — 有機食材選物</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans TC',sans-serif;background:#faf7f2;color:#2c1810;overflow-x:hidden}
.serif{font-family:'Playfair Display','Noto Sans TC',serif}
.text-warm{color:#8b5e3c}
.bg-cream{background:#faf7f2}
.bg-linen{background:#f5efe6}
.btn-warm{background:#8b5e3c;color:#faf7f2;border:none;padding:12px 28px;border-radius:8px;font-weight:600;cursor:pointer;transition:all 0.3s;font-size:14px}
.btn-warm:hover{background:#6d4a2f;transform:translateY(-2px);box-shadow:0 8px 20px rgba(139,94,60,0.2)}
.btn-outline{border:1.5px solid #d4c4b0;color:#8b5e3c;padding:12px 28px;border-radius:8px;font-weight:500;cursor:pointer;transition:all 0.3s;background:transparent;font-size:14px}
.btn-outline:hover{border-color:#8b5e3c;background:rgba(139,94,60,0.05)}
.product-card{background:#fff;border-radius:16px;overflow:hidden;transition:all 0.3s;border:1px solid #ebe5db;cursor:pointer}
.product-card:hover{transform:translateY(-6px);box-shadow:0 16px 40px rgba(139,94,60,0.1)}
.product-img{width:100%;aspect-ratio:1;object-fit:cover;background:#f5efe6;display:flex;align-items:center;justify-content:center;font-size:64px;position:relative;overflow:hidden}
.product-badge{position:absolute;top:12px;left:12px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600}
.badge-organic{background:#d4edda;color:#1e7e34}
.badge-new{background:#fff3cd;color:#856404}
.badge-sale{background:#f8d7da;color:#721c24}
.quick-add{position:absolute;bottom:-40px;left:0;right:0;background:rgba(139,94,60,0.95);color:#fff;padding:10px;text-align:center;font-size:13px;font-weight:600;transition:bottom 0.3s;cursor:pointer}
.product-card:hover .quick-add{bottom:0}
.category-btn{padding:8px 20px;border-radius:20px;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;border:1px solid #d4c4b0;background:transparent;color:#8b5e3c}
.category-btn.active{background:#8b5e3c;color:#faf7f2;border-color:#8b5e3c}
.toast{position:fixed;bottom:24px;right:24px;background:#8b5e3c;color:#faf7f2;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:500;transform:translateY(100px);opacity:0;transition:all 0.4s;z-index:9999}
.toast.show{transform:translateY(0);opacity:1}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.nav-warm{backdrop-filter:blur(12px);background:rgba(250,247,242,0.9)}
.cart-count{position:absolute;top:-6px;right:-6px;background:#c0392b;color:#fff;width:18px;height:18px;border-radius:50%;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center}
.recipe-card{background:#fff;border-radius:16px;overflow:hidden;border:1px solid #ebe5db;transition:all 0.3s}
.recipe-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,0.06)}
.detail-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100;display:none;align-items:center;justify-content:center;padding:24px}
.detail-panel{background:#fff;border-radius:20px;max-width:800px;width:100%;max-height:90vh;overflow-y:auto;position:relative}
</style>
</head>
<body>

<div class="toast" id="toast"></div>

<!-- Product Detail Overlay -->
<div class="detail-overlay" id="detail-overlay" onclick="if(event.target===this)closeDetail()">
  <div class="detail-panel" id="detail-panel"></div>
</div>

<!-- Cart Drawer -->
<div id="cart-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:100;display:none" onclick="if(event.target===this)closeCart()">
  <div id="cart-drawer" style="position:fixed;top:0;right:-420px;width:400px;max-width:90vw;height:100vh;background:#fff;box-shadow:-4px 0 24px rgba(0,0,0,0.1);transition:right 0.35s;z-index:101;display:flex;flex-direction:column">
    <div style="padding:24px;border-bottom:1px solid #ebe5db;display:flex;align-items:center;justify-content:space-between">
      <h3 style="font-size:18px;font-weight:700">購物車</h3>
      <button onclick="closeCart()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#8b5e3c">✕</button>
    </div>
    <div id="cart-items" style="flex:1;overflow-y:auto;padding:24px"></div>
    <div id="cart-footer" style="padding:24px;border-top:1px solid #ebe5db"></div>
  </div>
</div>

<!-- Nav -->
<nav class="nav-warm fixed top-0 left-0 right-0 z-50 border-b" style="border-color:#ebe5db;padding:14px 0">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:8px;cursor:pointer" onclick="showPage('home')">
      <span style="font-size:24px">🌾</span>
      <span class="serif" style="font-weight:700;font-size:20px;color:#8b5e3c">穀光</span>
      <span style="font-size:11px;color:#a08b74;font-weight:500;letter-spacing:1px">GRAIN & GLOW</span>
    </div>
    <div style="display:flex;align-items:center;gap:28px" id="nav-links">
      <a onclick="showPage('home')" style="text-decoration:none;color:#a08b74;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#8b5e3c'" onmouseout="this.style.color='#a08b74'">首頁</a>
      <a onclick="showPage('shop')" style="text-decoration:none;color:#a08b74;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#8b5e3c'" onmouseout="this.style.color='#a08b74'">選物</a>
      <a onclick="showPage('recipes')" style="text-decoration:none;color:#a08b74;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#8b5e3c'" onmouseout="this.style.color='#a08b74'">食譜</a>
      <a onclick="showPage('about')" style="text-decoration:none;color:#a08b74;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#8b5e3c'" onmouseout="this.style.color='#a08b74'">關於</a>
    </div>
    <div style="display:flex;align-items:center;gap:16px">
      <button onclick="openCart()" style="background:none;border:none;cursor:pointer;position:relative;font-size:20px">
        🛒<span class="cart-count" id="cart-count" style="display:none">0</span>
      </button>
    </div>
    <button style="display:none;background:none;border:none;cursor:pointer;padding:8px" id="mobile-toggle" onclick="toggleMobile()">
      <svg width="24" height="24" fill="none" stroke="#8b5e3c" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
</nav>

<!-- Pages Container -->
<div id="page-home">
<!-- Hero -->
<section style="padding:120px 24px 60px;position:relative">
  <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center">
    <div>
      <div style="font-size:13px;color:#a08b74;font-weight:500;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px">Taiwan Organic Selection</div>
      <h1 class="serif" style="font-size:clamp(2.2rem,5vw,3.6rem);font-weight:700;line-height:1.15;margin-bottom:20px;color:#2c1810">
        來自土地的<br>真實味道
      </h1>
      <p style="font-size:16px;color:#7a6b5d;line-height:1.8;margin-bottom:32px;max-width:440px">
        嚴選台灣在地有機農產，從產地到餐桌，每一口都是對土地的感謝。無農藥、無化肥，只有最純粹的美味。
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn-warm" onclick="showPage('shop')">開始選購</button>
        <button class="btn-outline" onclick="showPage('about')">認識穀光</button>
      </div>
    </div>
    <div style="background:#f5efe6;border-radius:24px;padding:60px;text-align:center;position:relative">
      <div style="font-size:120px;line-height:1">🥑</div>
      <div style="position:absolute;top:20px;right:30px;font-size:48px">🍋</div>
      <div style="position:absolute;bottom:30px;left:20px;font-size:40px">🫒</div>
      <div style="position:absolute;top:40px;left:30px;font-size:32px">🌿</div>
    </div>
  </div>
</section>

<!-- Trust badges -->
<section style="padding:40px 24px">
  <div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center">
    <div style="padding:20px">
      <div style="font-size:32px;margin-bottom:8px">🌱</div>
      <div style="font-size:13px;font-weight:600;color:#8b5e3c">100% 有機認證</div>
    </div>
    <div style="padding:20px">
      <div style="font-size:32px;margin-bottom:8px">🚚</div>
      <div style="font-size:13px;font-weight:600;color:#8b5e3c">冷鏈宅配到府</div>
    </div>
    <div style="padding:20px">
      <div style="font-size:32px;margin-bottom:8px">🔄</div>
      <div style="font-size:13px;font-weight:600;color:#8b5e3c">不滿意退換貨</div>
    </div>
    <div style="padding:20px">
      <div style="font-size:32px;margin-bottom:8px">👨‍🌾</div>
      <div style="font-size:13px;font-weight:600;color:#8b5e3c">小農直送</div>
    </div>
  </div>
</section>

<!-- Featured Products -->
<section style="padding:60px 24px">
  <div style="max-width:1200px;margin:0 auto">
    <div class="reveal" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:40px">
      <div>
        <h2 class="serif" style="font-size:28px;font-weight:700;margin-bottom:4px">本季精選</h2>
        <p style="font-size:14px;color:#a08b74">當季最新鮮的有機食材</p>
      </div>
      <button class="btn-outline" style="padding:8px 20px;font-size:13px" onclick="showPage('shop')">查看全部 →</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px" id="featured-grid"></div>
  </div>
</section>

<!-- Story Section -->
<section class="bg-linen" style="padding:80px 24px">
  <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center">
    <div class="reveal" style="background:#faf7f2;border-radius:24px;padding:48px;text-align:center">
      <div style="font-size:80px">👨‍🌾</div>
      <p class="serif" style="font-size:18px;color:#8b5e3c;margin-top:16px;font-style:italic">"種出讓家人安心吃的食物"</p>
      <p style="font-size:13px;color:#a08b74;margin-top:8px">— 花蓮壽豐 陳阿公</p>
    </div>
    <div class="reveal">
      <div style="font-size:13px;color:#a08b74;font-weight:500;letter-spacing:2px;margin-bottom:12px">OUR STORY</div>
      <h2 class="serif" style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700;margin-bottom:16px">從產地到餐桌<br>每一步都用心</h2>
      <p style="font-size:15px;color:#7a6b5d;line-height:1.8;margin-bottom:16px">
        穀光成立於 2020 年，我們走訪台灣各地有機農場，與在地小農建立長期合作關係。
        每一款商品都經過嚴格的有機認證，確保從種植、採收到包裝都符合最高標準。
      </p>
      <p style="font-size:15px;color:#7a6b5d;line-height:1.8;margin-bottom:24px">
        我們相信，好的食物不需要太多調味，大自然就是最好的料理師。
      </p>
      <button class="btn-outline" onclick="showPage('about')">了解更多</button>
    </div>
  </div>
</section>
</div>

<!-- Shop Page -->
<div id="page-shop" style="display:none">
<section style="padding:100px 24px 60px">
  <div style="max-width:1200px;margin:0 auto">
    <h1 class="serif" style="font-size:32px;font-weight:700;margin-bottom:24px;text-align:center">有機選物</h1>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:40px">
      <button class="category-btn active" onclick="filterProducts(this,'all')">全部</button>
      <button class="category-btn" onclick="filterProducts(this,'vegetable')">蔬菜</button>
      <button class="category-btn" onclick="filterProducts(this,'fruit')">水果</button>
      <button class="category-btn" onclick="filterProducts(this,'grain')">穀物</button>
      <button class="category-btn" onclick="filterProducts(this,'oil')">油品調味</button>
      <button class="category-btn" onclick="filterProducts(this,'tea')">茶飲</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px" id="shop-grid"></div>
  </div>
</section>
</div>

<!-- Recipes Page -->
<div id="page-recipes" style="display:none">
<section style="padding:100px 24px 60px">
  <div style="max-width:1000px;margin:0 auto">
    <h1 class="serif" style="font-size:32px;font-weight:700;margin-bottom:8px;text-align:center">穀光食譜</h1>
    <p style="text-align:center;color:#a08b74;font-size:15px;margin-bottom:40px">簡單料理，美好生活</p>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px">
      <div class="recipe-card" onclick="showToast('食譜載入中...')">
        <div style="background:#f5efe6;padding:40px;text-align:center;font-size:64px">🥗</div>
        <div style="padding:24px">
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <span style="background:#d4edda;color:#1e7e34;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">素食</span>
            <span style="background:#e8f4fd;color:#0c5460;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">15 分鐘</span>
          </div>
          <h3 style="font-size:18px;font-weight:700;margin-bottom:6px">酪梨鷹嘴豆沙拉碗</h3>
          <p style="font-size:13px;color:#a08b74;line-height:1.7">新鮮酪梨搭配有機鷹嘴豆，淋上初榨橄欖油與檸檬汁，清爽營養的一餐。</p>
        </div>
      </div>
      <div class="recipe-card" onclick="showToast('食譜載入中...')">
        <div style="background:#f5efe6;padding:40px;text-align:center;font-size:64px">🍲</div>
        <div style="padding:24px">
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <span style="background:#fff3cd;color:#856404;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">暖胃</span>
            <span style="background:#e8f4fd;color:#0c5460;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">40 分鐘</span>
          </div>
          <h3 style="font-size:18px;font-weight:700;margin-bottom:6px">五穀養生粥</h3>
          <p style="font-size:13px;color:#a08b74;line-height:1.7">紅藜、小米、燕麥、紅豆與糙米慢熬，加入枸杞與紅棗，冬日最佳早餐。</p>
        </div>
      </div>
      <div class="recipe-card" onclick="showToast('食譜載入中...')">
        <div style="background:#f5efe6;padding:40px;text-align:center;font-size:64px">🫖</div>
        <div style="padding:24px">
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <span style="background:#d4edda;color:#1e7e34;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">無咖啡因</span>
            <span style="background:#e8f4fd;color:#0c5460;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">5 分鐘</span>
          </div>
          <h3 style="font-size:18px;font-weight:700;margin-bottom:6px">洛神花蜜茶</h3>
          <p style="font-size:13px;color:#a08b74;line-height:1.7">台東有機洛神花乾搭配龍眼蜜，酸甜平衡，冷熱皆宜的療癒飲品。</p>
        </div>
      </div>
      <div class="recipe-card" onclick="showToast('食譜載入中...')">
        <div style="background:#f5efe6;padding:40px;text-align:center;font-size:64px">🍳</div>
        <div style="padding:24px">
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <span style="background:#fff3cd;color:#856404;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">蛋奶素</span>
            <span style="background:#e8f4fd;color:#0c5460;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">20 分鐘</span>
          </div>
          <h3 style="font-size:18px;font-weight:700;margin-bottom:6px">苦茶油煎蛋拌麵線</h3>
          <p style="font-size:13px;color:#a08b74;line-height:1.7">手工麵線搭配苦茶油荷包蛋，撒上現磨白胡椒，簡單卻令人感動的古早味。</p>
        </div>
      </div>
    </div>
  </div>
</section>
</div>

<!-- About Page -->
<div id="page-about" style="display:none">
<section style="padding:100px 24px 60px">
  <div style="max-width:900px;margin:0 auto;text-align:center">
    <div style="font-size:13px;color:#a08b74;font-weight:500;letter-spacing:2px;margin-bottom:16px">ABOUT GRAIN & GLOW</div>
    <h1 class="serif" style="font-size:clamp(2rem,4vw,3rem);font-weight:700;margin-bottom:24px">穀光的故事</h1>
    <p style="font-size:16px;color:#7a6b5d;line-height:1.9;max-width:700px;margin:0 auto 40px">
      2020 年，兩位在食品業工作多年的夥伴，厭倦了大量添加物和農藥的食品工業，決定回歸最本質的飲食。
      我們開著一台小貨車走遍台灣，拜訪每一位堅持有機種植的小農，聽他們的故事，品嚐他們的作物。
    </p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:40px">
      <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #ebe5db">
        <div style="font-size:36px;font-weight:800;color:#8b5e3c">47</div>
        <div style="font-size:13px;color:#a08b74;margin-top:4px">合作小農</div>
      </div>
      <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #ebe5db">
        <div style="font-size:36px;font-weight:800;color:#8b5e3c">200+</div>
        <div style="font-size:13px;color:#a08b74;margin-top:4px">有機商品</div>
      </div>
      <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #ebe5db">
        <div style="font-size:36px;font-weight:800;color:#8b5e3c">15,000+</div>
        <div style="font-size:13px;color:#a08b74;margin-top:4px">幸福會員</div>
      </div>
    </div>
    <div style="background:#f5efe6;border-radius:20px;padding:48px;text-align:left;max-width:700px;margin:0 auto">
      <h3 class="serif" style="font-size:22px;font-weight:700;margin-bottom:16px">我們的承諾</h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:start;gap:12px">
          <span style="color:#8b5e3c;font-weight:700;font-size:18px">01</span>
          <div>
            <div style="font-weight:600;margin-bottom:4px">100% 有機認證</div>
            <div style="font-size:14px;color:#a08b74">每一款商品都通過台灣有機農產品認證</div>
          </div>
        </div>
        <div style="display:flex;align-items:start;gap:12px">
          <span style="color:#8b5e3c;font-weight:700;font-size:18px">02</span>
          <div>
            <div style="font-weight:600;margin-bottom:4px">公平貿易</div>
            <div style="font-size:14px;color:#a08b74">以合理價格向小農收購，確保農友永續經營</div>
          </div>
        </div>
        <div style="display:flex;align-items:start;gap:12px">
          <span style="color:#8b5e3c;font-weight:700;font-size:18px">03</span>
          <div>
            <div style="font-weight:600;margin-bottom:4px">減塑包裝</div>
            <div style="font-size:14px;color:#a08b74">使用可分解材質包裝，減少 80% 塑料使用</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
</div>

<!-- Footer -->
<footer style="padding:48px 24px;border-top:1px solid #ebe5db;background:#fff">
  <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px">
    <div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <span style="font-size:20px">🌾</span>
        <span class="serif" style="font-weight:700;font-size:18px;color:#8b5e3c">穀光</span>
      </div>
      <p style="font-size:13px;color:#a08b74;line-height:1.7;max-width:280px">嚴選台灣在地有機食材，從產地到餐桌，每一口都是對土地的感謝。</p>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;color:#8b5e3c;margin-bottom:16px">選購</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a style="font-size:13px;color:#a08b74;text-decoration:none;cursor:pointer" onclick="showPage('shop')">有機蔬果</a>
        <a style="font-size:13px;color:#a08b74;text-decoration:none;cursor:pointer" onclick="showPage('shop')">穀物雜糧</a>
        <a style="font-size:13px;color:#a08b74;text-decoration:none;cursor:pointer" onclick="showPage('shop')">油品調味</a>
        <a style="font-size:13px;color:#a08b74;text-decoration:none;cursor:pointer" onclick="showPage('shop')">茶飲沖泡</a>
      </div>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;color:#8b5e3c;margin-bottom:16px">關於</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a style="font-size:13px;color:#a08b74;text-decoration:none;cursor:pointer" onclick="showPage('about')">品牌故事</a>
        <a style="font-size:13px;color:#a08b74;text-decoration:none;cursor:pointer" onclick="showPage('recipes')">穀光食譜</a>
        <a style="font-size:13px;color:#a08b74;text-decoration:none;cursor:pointer">合作農場</a>
        <a style="font-size:13px;color:#a08b74;text-decoration:none;cursor:pointer">常見問題</a>
      </div>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;color:#8b5e3c;margin-bottom:16px">客服</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <span style="font-size:13px;color:#a08b74">service@grainandglow.tw</span>
        <span style="font-size:13px;color:#a08b74">02-2712-8899</span>
        <span style="font-size:13px;color:#a08b74">週一至週五 9:00-18:00</span>
      </div>
    </div>
  </div>
  <div style="max-width:1200px;margin:32px auto 0;padding-top:24px;border-top:1px solid #ebe5db;text-align:center">
    <p style="font-size:12px;color:#a08b74">© 2026 穀光 Grain & Glow. All rights reserved.</p>
  </div>
</footer>

<script>
const products=[
  {id:1,name:'有機酪梨',price:189,unit:'顆',emoji:'🥑',cat:'fruit',badge:'organic',desc:'屏東在地種植，Hass品種，口感綿密'},
  {id:2,name:'紅藜麥',price:320,unit:'500g',emoji:'🌾',cat:'grain',badge:'new',desc:'台東原住民部落栽培，蛋白質之王'},
  {id:3,name:'苦茶油',price:680,unit:'250ml',emoji:'🫒',cat:'oil',badge:'organic',desc:'南投手工壓榨，料理首選好油'},
  {id:4,name:'有機小番茄',price:129,unit:'盒',emoji:'🍅',cat:'vegetable',badge:'organic',desc:'嘉義溫室栽培，甜度高達12度'},
  {id:5,name:'日月潭紅茶',price:450,unit:'75g',emoji:'🍵',cat:'tea',badge:'organic',desc:'台18號紅玉，肉桂薄荷獨特香氣'},
  {id:6,name:'有機香蕉',price:89,unit:'把',emoji:'🍌',cat:'fruit',badge:'sale',desc:'花蓮有機農場，自然熟成無催熟'},
  {id:7,name:'糙米',price:168,unit:'1kg',emoji:'🍚',cat:'grain',badge:'organic',desc:'池上有機米，保留完整營養與口感'},
  {id:8,name:'有機地瓜',price:99,unit:'600g',emoji:'🍠',cat:'vegetable',badge:'organic',desc:'雲林台農57號，烤箱直出蜜糖香'},
  {id:9,name:'有機檸檬',price:149,unit:'5入',emoji:'🍋',cat:'fruit',badge:'organic',desc:'屏東無蠟處理，整顆都能安心用'},
  {id:10,name:'黑芝麻醬',price:280,unit:'180g',emoji:'🫘',cat:'oil',badge:'new',desc:'台南手工研磨，拌麵拌飯萬用醬'},
  {id:11,name:'阿里山烏龍',price:520,unit:'100g',emoji:'🍃',cat:'tea',badge:'organic',desc:'海拔1200m高山茶園，花香韻味'},
  {id:12,name:'有機青花菜',price:79,unit:'朵',emoji:'🥦',cat:'vegetable',badge:'organic',desc:'彰化溫室有機栽培，營養密度極高'}
];
let cart=[];
let currentCat='all';

function renderProducts(containerId,items){
  const g=document.getElementById(containerId);
  g.innerHTML=items.map(p=>`
    <div class="product-card" data-cat="${p.cat}" onclick="showDetail(${p.id})">
      <div class="product-img">
        <span style="font-size:64px">${p.emoji}</span>
        ${p.badge==='organic'?'<span class="product-badge badge-organic">有機認證</span>':p.badge==='new'?'<span class="product-badge badge-new">新品</span>':'<span class="product-badge badge-sale">特價</span>'}
        <div class="quick-add" onclick="event.stopPropagation();addToCart(${p.id})">+ 加入購物車</div>
      </div>
      <div style="padding:16px">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:4px">${p.name}</h3>
        <p style="font-size:12px;color:#a08b74;margin-bottom:8px;line-height:1.5">${p.desc}</p>
        <div style="display:flex;align-items:baseline;gap:4px">
          <span style="font-size:18px;font-weight:700;color:#8b5e3c">$${p.price}</span>
          <span style="font-size:12px;color:#a08b74">/${p.unit}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function filterProducts(btn,cat){
  document.querySelectorAll('.category-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  currentCat=cat;
  const filtered=cat==='all'?products:products.filter(p=>p.cat===cat);
  renderProducts('shop-grid',filtered);
}

function showDetail(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  document.getElementById('detail-panel').innerHTML=`
    <button onclick="closeDetail()" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:#8b5e3c;z-index:1">✕</button>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
      <div style="background:#f5efe6;padding:60px;text-align:center;border-radius:20px 0 0 20px">
        <div style="font-size:120px">${p.emoji}</div>
      </div>
      <div style="padding:40px">
        <div style="margin-bottom:12px">${p.badge==='organic'?'<span class="product-badge badge-organic" style="position:static">有機認證</span>':p.badge==='new'?'<span class="product-badge badge-new" style="position:static">新品</span>':'<span class="product-badge badge-sale" style="position:static">特價</span>'}</div>
        <h2 class="serif" style="font-size:28px;font-weight:700;margin-bottom:8px">${p.name}</h2>
        <p style="color:#a08b74;font-size:14px;margin-bottom:16px;line-height:1.7">${p.desc}</p>
        <div style="font-size:28px;font-weight:800;color:#8b5e3c;margin-bottom:24px">$${p.price} <span style="font-size:14px;font-weight:400;color:#a08b74">/${p.unit}</span></div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
          <span style="font-size:14px;color:#7a6b5d">數量</span>
          <div style="display:flex;align-items:center;border:1px solid #d4c4b0;border-radius:8px;overflow:hidden">
            <button onclick="adjustQty(-1)" style="padding:8px 14px;border:none;background:none;cursor:pointer;font-size:16px">−</button>
            <span id="detail-qty" style="padding:8px 16px;border-left:1px solid #d4c4b0;border-right:1px solid #d4c4b0;font-weight:600">1</span>
            <button onclick="adjustQty(1)" style="padding:8px 14px;border:none;background:none;cursor:pointer;font-size:16px">+</button>
          </div>
        </div>
        <button class="btn-warm" style="width:100%;padding:14px" onclick="addToCart(${p.id});closeDetail()">加入購物車</button>
        <details style="margin-top:20px;border-top:1px solid #ebe5db;padding-top:16px">
          <summary style="cursor:pointer;font-size:14px;font-weight:600;color:#8b5e3c">產品資訊</summary>
          <p style="font-size:13px;color:#a08b74;margin-top:8px;line-height:1.7">產地：台灣在地有機農場<br>認證：台灣有機農產品標章<br>保存：冷藏 / 常溫（依商品）<br>包裝：環保可分解材質</p>
        </details>
      </div>
    </div>
  `;
  document.getElementById('detail-overlay').style.display='flex';
}
let detailQty=1;
function adjustQty(d){detailQty=Math.max(1,detailQty+d);document.getElementById('detail-qty').textContent=detailQty}
function closeDetail(){document.getElementById('detail-overlay').style.display='none';detailQty=1}

function addToCart(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  const existing=cart.find(c=>c.id===id);
  if(existing){existing.qty+=detailQty}else{cart.push({...p,qty:detailQty})}
  detailQty=1;
  updateCartUI();showToast(`🛒 已加入「${p.name}」`);
}
function removeFromCart(id){cart=cart.filter(c=>c.id!==id);updateCartUI()}
function updateCartUI(){
  const count=cart.reduce((s,c)=>s+c.qty,0);
  const el=document.getElementById('cart-count');
  if(count>0){el.style.display='flex';el.textContent=count}else{el.style.display='none'}
  const items=document.getElementById('cart-items');
  const footer=document.getElementById('cart-footer');
  if(cart.length===0){
    items.innerHTML='<div style="text-align:center;padding:48px 0;color:#a08b74"><div style="font-size:48px;margin-bottom:12px">🛒</div><p>購物車是空的</p></div>';
    footer.innerHTML='';
    return;
  }
  items.innerHTML=cart.map(c=>`
    <div style="display:flex;gap:16px;align-items:center;padding:12px 0;border-bottom:1px solid #ebe5db">
      <div style="width:48px;height:48px;background:#f5efe6;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">${c.emoji}</div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:600">${c.name}</div>
        <div style="font-size:12px;color:#a08b74">$${c.price} × ${c.qty}</div>
      </div>
      <div style="font-weight:700;color:#8b5e3c">$${c.price*c.qty}</div>
      <button onclick="removeFromCart(${c.id})" style="background:none;border:none;color:#c0392b;cursor:pointer;font-size:16px">✕</button>
    </div>
  `).join('');
  const total=cart.reduce((s,c)=>s+c.price*c.qty,0);
  footer.innerHTML=`
    <div style="display:flex;justify-content:space-between;margin-bottom:16px">
      <span style="font-weight:600">小計</span>
      <span style="font-size:20px;font-weight:800;color:#8b5e3c">$${total.toLocaleString()}</span>
    </div>
    <button class="btn-warm" style="width:100%" onclick="showToast('🎉 前往結帳中...');closeCart()">前往結帳</button>
    <p style="font-size:11px;color:#a08b74;text-align:center;margin-top:8px">滿 $999 免運費</p>
  `;
}

function openCart(){
  document.getElementById('cart-overlay').style.display='block';
  setTimeout(()=>document.getElementById('cart-drawer').style.right='0',10);
}
function closeCart(){
  document.getElementById('cart-drawer').style.right='-420px';
  setTimeout(()=>document.getElementById('cart-overlay').style.display='none',350);
}

function showPage(page){
  ['home','shop','recipes','about'].forEach(p=>{document.getElementById('page-'+p).style.display=p===page?'block':'none'});
  window.scrollTo({top:0,behavior:'smooth'});
}

function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
function toggleMobile(){const m=document.getElementById('mobile-menu');if(m)m.style.display=m.style.display==='none'?'block':'none'}

// Init
renderProducts('featured-grid',products.slice(0,4));
renderProducts('shop-grid',products);

const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}})},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

function checkNav(){const w=window.innerWidth;const links=document.getElementById('nav-links');const toggle=document.getElementById('mobile-toggle');if(w<768){links.style.display='none';toggle.style.display='block'}else{links.style.display='flex';toggle.style.display='none'}}
window.addEventListener('resize',checkNav);checkNav();
</script>

</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
