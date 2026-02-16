INSERT INTO template_previews (template_id, html_content, version)
VALUES ('0cdd2c00-b1ed-431e-937d-bebdfe5166bc', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VOLTEX — 科技選物</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans TC',sans-serif;background:#09090b;color:#fafafa;overflow-x:hidden}
.accent{color:#6366f1}
.accent-bg{background:#6366f1}
.glow{box-shadow:0 0 30px rgba(99,102,241,0.15)}
.product-card{background:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;transition:all 0.3s;cursor:pointer}
.product-card:hover{border-color:#6366f1;transform:translateY(-6px);box-shadow:0 20px 40px rgba(99,102,241,0.1)}
.product-img{width:100%;aspect-ratio:1;background:#111113;display:flex;align-items:center;justify-content:center;font-size:56px;position:relative;overflow:hidden}
.product-badge{position:absolute;top:12px;left:12px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600}
.badge-hot{background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3)}
.badge-new{background:rgba(99,102,241,0.15);color:#818cf8;border:1px solid rgba(99,102,241,0.3)}
.badge-sale{background:rgba(234,179,8,0.15);color:#eab308;border:1px solid rgba(234,179,8,0.3)}
.quick-add{position:absolute;bottom:-44px;left:0;right:0;background:rgba(99,102,241,0.95);color:#fff;padding:12px;text-align:center;font-size:13px;font-weight:600;transition:bottom 0.3s;cursor:pointer}
.product-card:hover .quick-add{bottom:0}
.btn-primary{background:#6366f1;color:#fff;border:none;padding:12px 28px;border-radius:10px;font-weight:600;cursor:pointer;transition:all 0.3s;font-size:15px}
.btn-primary:hover{background:#4f46e5;transform:translateY(-2px);box-shadow:0 8px 24px rgba(99,102,241,0.3)}
.btn-ghost{border:1px solid #3f3f46;color:#fafafa;padding:12px 28px;border-radius:10px;font-weight:500;cursor:pointer;transition:all 0.3s;background:transparent;font-size:15px}
.btn-ghost:hover{border-color:#6366f1;color:#818cf8}
.cat-btn{padding:8px 20px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;border:1px solid #27272a;background:transparent;color:#a1a1aa}
.cat-btn.active{background:#6366f1;color:#fff;border-color:#6366f1}
.spec-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #27272a;font-size:13px}
.toast{position:fixed;bottom:24px;right:24px;background:#6366f1;color:#fff;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:600;transform:translateY(100px);opacity:0;transition:all 0.4s;z-index:9999}
.toast.show{transform:translateY(0);opacity:1}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.nav-dark{backdrop-filter:blur(12px);background:rgba(9,9,11,0.85)}
.cart-count{position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;width:18px;height:18px;border-radius:50%;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center}
.detail-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:100;display:none;align-items:center;justify-content:center;padding:24px}
.detail-panel{background:#18181b;border:1px solid #27272a;border-radius:20px;max-width:900px;width:100%;max-height:90vh;overflow-y:auto;position:relative}
.star{color:#eab308}
</style>
</head>
<body>

<div class="toast" id="toast"></div>

<!-- Detail Overlay -->
<div class="detail-overlay" id="detail-overlay" onclick="if(event.target===this)closeDetail()">
  <div class="detail-panel" id="detail-panel"></div>
</div>

<!-- Cart Drawer -->
<div id="cart-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100;display:none" onclick="if(event.target===this)closeCart()">
  <div id="cart-drawer" style="position:fixed;top:0;right:-420px;width:400px;max-width:90vw;height:100vh;background:#18181b;border-left:1px solid #27272a;transition:right 0.35s;z-index:101;display:flex;flex-direction:column">
    <div style="padding:24px;border-bottom:1px solid #27272a;display:flex;align-items:center;justify-content:space-between">
      <h3 style="font-size:18px;font-weight:700">購物車</h3>
      <button onclick="closeCart()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#a1a1aa">✕</button>
    </div>
    <div id="cart-items" style="flex:1;overflow-y:auto;padding:24px"></div>
    <div id="cart-footer" style="padding:24px;border-top:1px solid #27272a"></div>
  </div>
</div>

<!-- Nav -->
<nav class="nav-dark fixed top-0 left-0 right-0 z-50 border-b" style="border-color:#27272a;padding:12px 0">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:8px;cursor:pointer" onclick="window.scrollTo({top:0,behavior:'smooth'})">
      <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:16px">⚡</div>
      <span style="font-weight:800;font-size:18px;letter-spacing:2px">VOLTEX</span>
    </div>
    <div style="display:flex;align-items:center;gap:28px" id="nav-links">
      <a href="#products" style="text-decoration:none;color:#71717a;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#818cf8'" onmouseout="this.style.color='#71717a'">全部商品</a>
      <a href="#brands" style="text-decoration:none;color:#71717a;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#818cf8'" onmouseout="this.style.color='#71717a'">品牌</a>
      <a href="#deals" style="text-decoration:none;color:#71717a;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#818cf8'" onmouseout="this.style.color='#71717a'">優惠</a>
    </div>
    <div style="display:flex;align-items:center;gap:16px">
      <button onclick="showToast('搜尋功能開發中')" style="background:none;border:none;cursor:pointer;color:#71717a;font-size:18px">🔍</button>
      <button onclick="openCart()" style="background:none;border:none;cursor:pointer;position:relative;font-size:18px;color:#fafafa">
        🛒<span class="cart-count" id="cart-count" style="display:none">0</span>
      </button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section style="padding:120px 24px 60px;position:relative;overflow:hidden">
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 0%,rgba(99,102,241,0.08),transparent 60%);pointer-events:none"></div>
  <div style="max-width:1200px;margin:0 auto;text-align:center;position:relative">
    <div style="display:inline-block;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:20px;padding:6px 16px;font-size:13px;color:#818cf8;font-weight:500;margin-bottom:24px">
      🔥 新春科技祭 — 全站 85 折起
    </div>
    <h1 style="font-size:clamp(2.2rem,5vw,4rem);font-weight:900;line-height:1.1;margin-bottom:20px;letter-spacing:-0.03em">
      探索科技<span class="accent">新境界</span>
    </h1>
    <p style="font-size:17px;color:#71717a;max-width:500px;margin:0 auto 36px;line-height:1.7">
      嚴選全球頂尖科技產品，從耳機到鍵盤，從充電器到智慧家電。極速到貨，完美售後。
    </p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn-primary" style="padding:14px 32px;font-size:16px" onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})">立即選購</button>
      <button class="btn-ghost" style="padding:14px 32px;font-size:16px" onclick="document.getElementById('deals').scrollIntoView({behavior:'smooth'})">查看優惠</button>
    </div>
  </div>
</section>

<!-- Products -->
<section id="products" style="padding:60px 24px">
  <div style="max-width:1200px;margin:0 auto">
    <div class="reveal" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:16px">
      <h2 style="font-size:24px;font-weight:800">全部商品</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="cat-btn active" onclick="filterCat(this,'all')">全部</button>
        <button class="cat-btn" onclick="filterCat(this,'audio')">音訊</button>
        <button class="cat-btn" onclick="filterCat(this,'keyboard')">鍵盤</button>
        <button class="cat-btn" onclick="filterCat(this,'charger')">充電</button>
        <button class="cat-btn" onclick="filterCat(this,'smart')">智慧家居</button>
        <button class="cat-btn" onclick="filterCat(this,'accessory')">配件</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px" id="product-grid"></div>
  </div>
</section>

<!-- Deals Banner -->
<section id="deals" style="padding:60px 24px">
  <div class="reveal" style="max-width:1200px;margin:0 auto;background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:24px;padding:48px;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;position:relative;overflow:hidden">
    <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:rgba(99,102,241,0.2)"></div>
    <div style="position:relative">
      <div style="font-size:13px;color:#818cf8;font-weight:600;letter-spacing:2px;margin-bottom:8px">LIMITED DEAL</div>
      <h2 style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:800;margin-bottom:12px">AirPods Pro 3 限時特價</h2>
      <p style="color:#a5b4fc;font-size:15px;margin-bottom:20px;line-height:1.7">降噪再升級，H3 晶片加持。限量 50 組，售完為止。</p>
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:24px">
        <span style="font-size:32px;font-weight:900;color:#fff">$6,490</span>
        <span style="font-size:18px;color:#71717a;text-decoration:line-through">$7,990</span>
        <span style="background:rgba(239,68,68,0.2);color:#ef4444;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600">-19%</span>
      </div>
      <button class="btn-primary" onclick="showToast('🛒 已加入購物車')">立即搶購</button>
    </div>
    <div style="text-align:center;font-size:100px;position:relative">
      🎧
    </div>
  </div>
</section>

<!-- Brands -->
<section id="brands" style="padding:60px 24px;border-top:1px solid #27272a">
  <div style="max-width:1000px;margin:0 auto;text-align:center">
    <p style="font-size:13px;color:#52525b;font-weight:500;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px">合作品牌</p>
    <div style="display:flex;justify-content:center;gap:48px;align-items:center;flex-wrap:wrap;opacity:0.4">
      <span style="font-size:20px;font-weight:700">Apple</span>
      <span style="font-size:20px;font-weight:700">Sony</span>
      <span style="font-size:20px;font-weight:700">Bose</span>
      <span style="font-size:20px;font-weight:700">Samsung</span>
      <span style="font-size:20px;font-weight:700">Keychron</span>
      <span style="font-size:20px;font-weight:700">Anker</span>
    </div>
  </div>
</section>

<!-- Reviews -->
<section style="padding:60px 24px">
  <div style="max-width:1100px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:40px">
      <h2 style="font-size:24px;font-weight:800;margin-bottom:8px">買家好評</h2>
      <p style="color:#71717a;font-size:15px">超過 12,000+ 五星評價</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
      <div class="reveal" style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:24px">
        <div class="star" style="margin-bottom:12px">★★★★★</div>
        <p style="font-size:14px;color:#a1a1aa;line-height:1.7;margin-bottom:16px">「Keychron K2 手感超棒，打字聲音非常療癒。配送速度也很快，下單隔天就到了。」</p>
        <div style="font-size:13px;font-weight:600">Kevin L.</div>
        <div style="font-size:12px;color:#52525b">購買：Keychron K2 Pro</div>
      </div>
      <div class="reveal" style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:24px">
        <div class="star" style="margin-bottom:12px">★★★★★</div>
        <p style="font-size:14px;color:#a1a1aa;line-height:1.7;margin-bottom:16px">「MagSafe 充電座質感很好，三機同充超方便。終於不用一堆線纏在一起了。」</p>
        <div style="font-size:13px;font-weight:600">Mia C.</div>
        <div style="font-size:12px;color:#52525b">購買：MagSafe 三合一充電座</div>
      </div>
      <div class="reveal" style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:24px">
        <div class="star" style="margin-bottom:12px">★★★★★</div>
        <p style="font-size:14px;color:#a1a1aa;line-height:1.7;margin-bottom:16px">「Sony WH-1000XM6 降噪效果驚人，在辦公室戴一整天也不會不舒服。推薦！」</p>
        <div style="font-size:13px;font-weight:600">Alex W.</div>
        <div style="font-size:12px;color:#52525b">購買：Sony WH-1000XM6</div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer style="padding:48px 24px;border-top:1px solid #27272a">
  <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px">
    <div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <div style="width:28px;height:28px;border-radius:6px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:14px">⚡</div>
        <span style="font-weight:800;letter-spacing:2px">VOLTEX</span>
      </div>
      <p style="font-size:13px;color:#52525b;line-height:1.7;max-width:280px">嚴選全球科技好物。極速到貨，完美售後。</p>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;margin-bottom:16px">商品分類</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a style="font-size:13px;color:#52525b;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#818cf8'" onmouseout="this.style.color='#52525b'">音訊設備</a>
        <a style="font-size:13px;color:#52525b;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#818cf8'" onmouseout="this.style.color='#52525b'">鍵盤滑鼠</a>
        <a style="font-size:13px;color:#52525b;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#818cf8'" onmouseout="this.style.color='#52525b'">充電配件</a>
        <a style="font-size:13px;color:#52525b;text-decoration:none;cursor:pointer" onmouseover="this.style.color='#818cf8'" onmouseout="this.style.color='#52525b'">智慧家居</a>
      </div>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;margin-bottom:16px">客戶服務</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a style="font-size:13px;color:#52525b;text-decoration:none;cursor:pointer">訂單查詢</a>
        <a style="font-size:13px;color:#52525b;text-decoration:none;cursor:pointer">退換貨政策</a>
        <a style="font-size:13px;color:#52525b;text-decoration:none;cursor:pointer">常見問題</a>
        <a style="font-size:13px;color:#52525b;text-decoration:none;cursor:pointer">聯繫客服</a>
      </div>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;margin-bottom:16px">保障</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <span style="font-size:13px;color:#52525b">✓ 正品保證</span>
        <span style="font-size:13px;color:#52525b">✓ 7 天退換</span>
        <span style="font-size:13px;color:#52525b">✓ 24H 出貨</span>
        <span style="font-size:13px;color:#52525b">✓ 安全金流</span>
      </div>
    </div>
  </div>
  <div style="max-width:1200px;margin:32px auto 0;padding-top:24px;border-top:1px solid #27272a;text-align:center">
    <p style="font-size:12px;color:#52525b">© 2026 VOLTEX. All rights reserved.</p>
  </div>
</footer>

<script>
const products=[
  {id:1,name:'AirPods Pro 3',price:7990,sale:6490,emoji:'🎧',cat:'audio',badge:'hot',brand:'Apple',specs:{driver:'H3 晶片',anc:'自適應降噪',battery:'6 小時',rating:'4.9'}},
  {id:2,name:'Sony WH-1000XM6',price:10900,emoji:'🎧',cat:'audio',badge:'new',brand:'Sony',specs:{driver:'40mm',anc:'V2 處理器',battery:'40 小時',rating:'4.8'}},
  {id:3,name:'Keychron K2 Pro',price:3490,emoji:'⌨️',cat:'keyboard',badge:'hot',brand:'Keychron',specs:{switch:'Gateron Pro',layout:'75%',connect:'藍牙/有線',rating:'4.7'}},
  {id:4,name:'Anker 100W 充電器',price:1690,emoji:'🔌',cat:'charger',badge:'sale',brand:'Anker',specs:{power:'100W GaN',ports:'3 USB-C + 1 USB-A',size:'掌心大小',rating:'4.8'}},
  {id:5,name:'HomePod mini',price:3290,emoji:'🔊',cat:'smart',badge:'',brand:'Apple',specs:{driver:'全頻驅動',assistant:'Siri',connect:'AirPlay 2',rating:'4.5'}},
  {id:6,name:'Logitech MX Master 3S',price:3490,emoji:'🖱️',cat:'accessory',badge:'hot',brand:'Logitech',specs:{sensor:'8000 DPI',battery:'70 天',connect:'藍牙/USB-C',rating:'4.9'}},
  {id:7,name:'Samsung T7 SSD 2TB',price:4990,sale:3990,emoji:'💾',cat:'accessory',badge:'sale',brand:'Samsung',specs:{capacity:'2TB',speed:'1050 MB/s',encrypt:'AES 256',rating:'4.7'}},
  {id:8,name:'MagSafe 三合一充電座',price:2990,emoji:'🔋',cat:'charger',badge:'new',brand:'Belkin',specs:{power:'15W MagSafe',devices:'iPhone+Watch+AirPods',material:'鋁合金',rating:'4.6'}},
  {id:9,name:'HHKB Professional',price:8900,emoji:'⌨️',cat:'keyboard',badge:'',brand:'PFU',specs:{switch:'Topre 45g',layout:'60%',connect:'藍牙/USB-C',rating:'4.9'}},
  {id:10,name:'Ring 門鈴攝影機',price:4590,emoji:'🔔',cat:'smart',badge:'new',brand:'Ring',specs:{resolution:'1080p HDR',fov:'160°',power:'可充電電池',rating:'4.4'}},
  {id:11,name:'Bose QC Ultra 耳塞',price:8990,emoji:'🎵',cat:'audio',badge:'',brand:'Bose',specs:{driver:'CustomTune',anc:'自適應降噪',battery:'6 小時',rating:'4.7'}},
  {id:12,name:'Apple Watch 充電線',price:890,emoji:'⚡',cat:'charger',badge:'',brand:'Apple',specs:{length:'1m',type:'磁力充電',compatible:'全系列 Apple Watch',rating:'4.5'}}
];
let cart=[];

function renderGrid(){
  const cat=document.querySelector('.cat-btn.active')?.dataset?.cat||'all';
  const filtered=cat==='all'?products:products.filter(p=>p.cat===cat);
  document.getElementById('product-grid').innerHTML=filtered.map(p=>`
    <div class="product-card" onclick="showDetail(${p.id})">
      <div class="product-img">
        <span style="font-size:56px">${p.emoji}</span>
        ${p.badge==='hot'?'<span class="product-badge badge-hot">熱賣</span>':p.badge==='new'?'<span class="product-badge badge-new">新品</span>':p.badge==='sale'?'<span class="product-badge badge-sale">特價</span>':''}
        <div class="quick-add" onclick="event.stopPropagation();addToCart(${p.id})">+ 加入購物車</div>
      </div>
      <div style="padding:16px">
        <div style="font-size:11px;color:#52525b;margin-bottom:4px">${p.brand}</div>
        <h3 style="font-size:14px;font-weight:600;margin-bottom:8px">${p.name}</h3>
        <div style="display:flex;align-items:baseline;gap:8px">
          ${p.sale?`<span style="font-size:18px;font-weight:800;color:#ef4444">$${p.sale.toLocaleString()}</span><span style="font-size:13px;color:#52525b;text-decoration:line-through">$${p.price.toLocaleString()}</span>`:`<span style="font-size:18px;font-weight:800">$${p.price.toLocaleString()}</span>`}
        </div>
      </div>
    </div>
  `).join('');
}

function filterCat(btn,cat){
  document.querySelectorAll('.cat-btn').forEach(b=>{b.classList.remove('active');b.dataset.cat=b.dataset.cat||b.textContent});
  btn.classList.add('active');btn.dataset.cat=cat;
  renderGrid();
}
document.querySelectorAll('.cat-btn').forEach((b,i)=>{b.dataset.cat=['all','audio','keyboard','charger','smart','accessory'][i]});

function showDetail(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  const sp=p.specs;
  document.getElementById('detail-panel').innerHTML=`
    <button onclick="closeDetail()" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:#71717a;z-index:1">✕</button>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
      <div style="background:#111113;padding:60px;text-align:center;border-radius:20px 0 0 20px;display:flex;align-items:center;justify-content:center">
        <span style="font-size:120px">${p.emoji}</span>
      </div>
      <div style="padding:40px">
        <div style="font-size:12px;color:#818cf8;font-weight:600;margin-bottom:8px">${p.brand}</div>
        <h2 style="font-size:24px;font-weight:800;margin-bottom:12px">${p.name}</h2>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <span class="star">★★★★★</span>
          <span style="font-size:13px;color:#71717a">${sp.rating} (${Math.floor(Math.random()*500+100)} 評價)</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:24px">
          ${p.sale?`<span style="font-size:32px;font-weight:900;color:#ef4444">$${p.sale.toLocaleString()}</span><span style="font-size:18px;color:#52525b;text-decoration:line-through">$${p.price.toLocaleString()}</span>`:`<span style="font-size:32px;font-weight:900">$${p.price.toLocaleString()}</span>`}
        </div>
        <div style="margin-bottom:24px;border:1px solid #27272a;border-radius:12px;padding:16px">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:#a1a1aa">規格</div>
          ${Object.entries(sp).filter(([k])=>k!=='rating').map(([k,v])=>`<div class="spec-row"><span style="color:#71717a">${k}</span><span style="font-weight:500">${v}</span></div>`).join('')}
        </div>
        <button class="btn-primary" style="width:100%;padding:14px;font-size:16px" onclick="addToCart(${p.id});closeDetail()">加入購物車</button>
        <div style="display:flex;gap:16px;margin-top:16px;justify-content:center">
          <span style="font-size:12px;color:#52525b">✓ 正品保證</span>
          <span style="font-size:12px;color:#52525b">✓ 7天退換</span>
          <span style="font-size:12px;color:#52525b">✓ 24H出貨</span>
        </div>
      </div>
    </div>
  `;
  document.getElementById('detail-overlay').style.display='flex';
}
function closeDetail(){document.getElementById('detail-overlay').style.display='none'}

function addToCart(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  const existing=cart.find(c=>c.id===id);
  if(existing)existing.qty++;else cart.push({...p,qty:1});
  updateCartUI();showToast('🛒 已加入「'+p.name+'」');
}
function removeFromCart(id){cart=cart.filter(c=>c.id!==id);updateCartUI()}
function updateCartUI(){
  const count=cart.reduce((s,c)=>s+c.qty,0);
  const el=document.getElementById('cart-count');
  if(count>0){el.style.display='flex';el.textContent=count}else{el.style.display='none'}
  const items=document.getElementById('cart-items');
  const footer=document.getElementById('cart-footer');
  if(cart.length===0){
    items.innerHTML='<div style="text-align:center;padding:48px 0;color:#52525b"><div style="font-size:48px;margin-bottom:12px">🛒</div><p>購物車是空的</p></div>';
    footer.innerHTML='';return;
  }
  items.innerHTML=cart.map(c=>`
    <div style="display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #27272a">
      <div style="width:48px;height:48px;background:#111113;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">${c.emoji}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600">${c.name}</div>
        <div style="font-size:12px;color:#52525b">$${(c.sale||c.price).toLocaleString()} × ${c.qty}</div>
      </div>
      <div style="font-weight:700;color:#818cf8">$${((c.sale||c.price)*c.qty).toLocaleString()}</div>
      <button onclick="removeFromCart(${c.id})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px">✕</button>
    </div>
  `).join('');
  const total=cart.reduce((s,c)=>s+(c.sale||c.price)*c.qty,0);
  footer.innerHTML=`
    <div style="display:flex;justify-content:space-between;margin-bottom:16px">
      <span style="font-weight:600">小計</span>
      <span style="font-size:20px;font-weight:800;color:#818cf8">$${total.toLocaleString()}</span>
    </div>
    <button class="btn-primary" style="width:100%" onclick="showToast('🎉 前往結帳中...');closeCart()">前往結帳</button>
    <p style="font-size:11px;color:#52525b;text-align:center;margin-top:8px">滿 $3,000 免運費</p>
  `;
}

function openCart(){document.getElementById('cart-overlay').style.display='block';setTimeout(()=>document.getElementById('cart-drawer').style.right='0',10)}
function closeCart(){document.getElementById('cart-drawer').style.right='-420px';setTimeout(()=>document.getElementById('cart-overlay').style.display='none',350)}
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}

renderGrid();
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();const t=document.querySelector(a.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth'})})});
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}})},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
</script>

</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
