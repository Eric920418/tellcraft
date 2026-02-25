INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '5b0fc7e1-2381-4025-9094-0423e49b3596',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FarmFresh Market</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Bitter:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={
  theme:{
    extend:{
      colors:{
        farm:{ green:'#166534', light:'#22c55e', pale:'#dcfce7', muted:'#86efac' },
        soil:{ brown:'#78350f', medium:'#a16207', light:'#fef3c7' },
        wheat:{ gold:'#d97706', light:'#fbbf24' },
        cream:'#fefce8',
        bark:'#451a03'
      },
      fontFamily:{
        display:['Bitter','Georgia','serif'],
        body:['Source Sans 3','system-ui','sans-serif']
      }
    }
  }
}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Source Sans 3',system-ui,sans-serif;background:#fefce8;color:#451a03;overflow-x:hidden}

/* Freshness Badges */
.badge-harvested{background:#dcfce7;color:#166534;border:1px solid #86efac}
.badge-fresh{background:#fef3c7;color:#92400e;border:1px solid #fbbf24}
.badge-direct{background:#fdf2e9;color:#78350f;border:1px solid #d97706}

/* Product Cards */
.product-card{background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e0d5;transition:all 0.35s ease;cursor:pointer}
.product-card:hover{transform:translateY(-6px);box-shadow:0 20px 40px rgba(22,101,52,0.1)}
.product-card:hover .card-add{opacity:1;transform:translateY(0)}
.card-add{opacity:0;transform:translateY(8px);transition:all 0.3s ease}

/* Journey Line */
.journey-dot{width:8px;height:8px;border-radius:50%;background:#86efac}
.journey-line{border-top:3px dashed #86efac}

/* Animations */
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s cubic-bezier(0.22,1,0.36,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.float-anim{animation:float 3s ease-in-out infinite}
@keyframes pulse-badge{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.3)}50%{box-shadow:0 0 0 8px rgba(34,197,94,0)}}
.badge-pulse{animation:pulse-badge 2s ease-in-out infinite}

/* Toast */
.toast{position:fixed;bottom:24px;right:24px;background:#166534;color:#fff;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:600;transform:translateY(100px);opacity:0;transition:all 0.4s ease;z-index:9999;font-family:'Source Sans 3',sans-serif}
.toast.show{transform:translateY(0);opacity:1}

/* Nav */
.nav-farm{backdrop-filter:blur(12px);background:rgba(254,252,232,0.92);border-bottom:1px solid #e5e0d5}

/* Subscription shimmer */
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.shimmer-border{background:linear-gradient(90deg,#86efac,#fbbf24,#86efac);background-size:200% 100%;animation:shimmer 3s linear infinite;padding:2px;border-radius:20px}

/* Scrollbar */
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:#fefce8}
::-webkit-scrollbar-thumb{background:#d4c9a8;border-radius:3px}
</style>
</head>
<body>

<div class="toast" id="toast"></div>

<!-- Leaf SVG defs -->
<svg style="position:absolute;width:0;height:0">
<defs>
  <symbol id="icon-leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89-.82L7 21l.61-1.22C10.23 16 13 13 17 8z"/><path d="M12.5 3.5C10 5 7.5 8 6 11"/>
  </symbol>
  <symbol id="icon-farm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/><line x1="12" y1="7" x2="12" y2="11"/>
  </symbol>
  <symbol id="icon-truck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </symbol>
  <symbol id="icon-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/>
  </symbol>
  <symbol id="icon-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </symbol>
  <symbol id="icon-cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
  </symbol>
</defs>
</svg>

<!-- Navigation -->
<nav class="nav-farm fixed top-0 left-0 right-0 z-50" style="padding:14px 0">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:10px;cursor:pointer">
      <svg width="28" height="28" style="color:#166534"><use href="#icon-leaf"/></svg>
      <span class="font-display" style="font-weight:700;font-size:22px;color:#166534">FarmFresh</span>
      <span style="font-size:12px;color:#78350f;font-weight:500;letter-spacing:1px">MARKET</span>
    </div>
    <div style="display:flex;align-items:center;gap:32px" id="nav-links">
      <a href="#products" style="text-decoration:none;color:#78350f;font-size:14px;font-weight:600;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#166534'" onmouseout="this.style.color='#78350f'">Shop</a>
      <a href="#farm-story" style="text-decoration:none;color:#78350f;font-size:14px;font-weight:600;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#166534'" onmouseout="this.style.color='#78350f'">Farms</a>
      <a href="#subscription" style="text-decoration:none;color:#78350f;font-size:14px;font-weight:600;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#166534'" onmouseout="this.style.color='#78350f'">About</a>
      <button onclick="openCart()" style="background:none;border:none;cursor:pointer;position:relative;display:flex;align-items:center;gap:6px;color:#78350f;font-size:14px;font-weight:600;padding:6px 14px;border-radius:99px;border:1.5px solid #e5e0d5;transition:all 0.2s" onmouseover="this.style.borderColor='#166534';this.style.color='#166534'" onmouseout="this.style.borderColor='#e5e0d5';this.style.color='#78350f'">
        <svg width="18" height="18"><use href="#icon-cart"/></svg>
        Cart
        <span id="cart-count" style="background:#166534;color:#fff;width:20px;height:20px;border-radius:50%;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center">3</span>
      </button>
    </div>
    <button style="display:none;background:none;border:none;cursor:pointer;padding:8px" id="mobile-toggle" onclick="toggleMobileNav()">
      <svg width="24" height="24" fill="none" stroke="#78350f" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <!-- Mobile menu -->
  <div id="mobile-menu" style="display:none;padding:16px 24px;border-top:1px solid #e5e0d5">
    <div style="display:flex;flex-direction:column;gap:16px">
      <a href="#products" style="text-decoration:none;color:#78350f;font-size:15px;font-weight:600" onclick="closeMobileNav()">Shop</a>
      <a href="#farm-story" style="text-decoration:none;color:#78350f;font-size:15px;font-weight:600" onclick="closeMobileNav()">Farms</a>
      <a href="#subscription" style="text-decoration:none;color:#78350f;font-size:15px;font-weight:600" onclick="closeMobileNav()">About</a>
      <button onclick="openCart();closeMobileNav()" style="background:#166534;color:#fff;border:none;padding:10px;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px">Cart (3)</button>
    </div>
  </div>
</nav>

<!-- Cart Drawer -->
<div id="cart-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(69,26,3,0.4);z-index:100;display:none" onclick="if(event.target===this)closeCart()">
  <div id="cart-drawer" style="position:fixed;top:0;right:-420px;width:400px;max-width:90vw;height:100vh;background:#fff;box-shadow:-8px 0 32px rgba(0,0,0,0.1);transition:right 0.35s ease;z-index:101;display:flex;flex-direction:column">
    <div style="padding:24px;border-bottom:1px solid #e5e0d5;display:flex;align-items:center;justify-content:space-between">
      <h3 class="font-display" style="font-size:18px;font-weight:700;color:#166534">Your Cart</h3>
      <button onclick="closeCart()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#78350f;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:background 0.2s" onmouseover="this.style.background='#fef3c7'" onmouseout="this.style.background='none'">&times;</button>
    </div>
    <div id="cart-items" style="flex:1;overflow-y:auto;padding:24px"></div>
    <div id="cart-footer" style="padding:24px;border-top:1px solid #e5e0d5;background:#fefce8"></div>
  </div>
</div>

<!-- Hero Section -->
<section style="padding:120px 24px 80px;position:relative;overflow:hidden">
  <div style="position:absolute;top:0;right:0;width:50%;height:100%;background:linear-gradient(135deg,#dcfce7 0%,#fef3c7 100%);border-radius:0 0 0 40%;opacity:0.4;z-index:0"></div>
  <div style="max-width:1200px;margin:0 auto;position:relative;z-index:1">
    <div style="text-align:center;max-width:800px;margin:0 auto">
      <div style="display:inline-flex;align-items:center;gap:8px;background:#dcfce7;padding:6px 16px;border-radius:99px;margin-bottom:24px;border:1px solid #86efac">
        <svg width="16" height="16" style="color:#166534"><use href="#icon-leaf"/></svg>
        <span style="font-size:13px;font-weight:600;color:#166534">100% Organic & Farm Direct</span>
      </div>
      <h1 class="font-display" style="font-size:clamp(2.4rem,5.5vw,4rem);font-weight:700;line-height:1.15;margin-bottom:20px;color:#451a03">
        From Farm<br>to Your Table
      </h1>
      <p style="font-size:18px;color:#78350f;line-height:1.7;margin-bottom:40px;max-width:560px;margin-left:auto;margin-right:auto;opacity:0.8">
        Fresh, organic produce delivered straight from local farms. Taste the difference that freshness makes.
      </p>

      <!-- Farm-to-Table Journey Illustration -->
      <div style="display:flex;align-items:center;justify-content:center;gap:0;margin-bottom:40px;flex-wrap:wrap">
        <!-- Farm -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px" class="float-anim">
          <div style="width:72px;height:72px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #86efac">
            <svg width="32" height="32" style="color:#166534"><use href="#icon-farm"/></svg>
          </div>
          <span style="font-size:13px;font-weight:600;color:#166534">Farm</span>
        </div>
        <!-- Dotted Line 1 -->
        <div style="width:80px;border-top:3px dashed #86efac;margin:0 8px;margin-bottom:24px"></div>
        <!-- Truck -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px" class="float-anim" style="animation-delay:0.5s">
          <div style="width:72px;height:72px;background:#fef3c7;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fbbf24">
            <svg width="32" height="32" style="color:#d97706"><use href="#icon-truck"/></svg>
          </div>
          <span style="font-size:13px;font-weight:600;color:#d97706">Deliver</span>
        </div>
        <!-- Dotted Line 2 -->
        <div style="width:80px;border-top:3px dashed #86efac;margin:0 8px;margin-bottom:24px"></div>
        <!-- Home -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px" class="float-anim" style="animation-delay:1s">
          <div style="width:72px;height:72px;background:#fdf2e9;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #d97706">
            <svg width="32" height="32" style="color:#78350f"><use href="#icon-home"/></svg>
          </div>
          <span style="font-size:13px;font-weight:600;color:#78350f">Your Table</span>
        </div>
      </div>

      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="#products" style="text-decoration:none;background:#166534;color:#fff;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;transition:all 0.3s;display:inline-block;cursor:pointer" onmouseover="this.style.background='#14532d';this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(22,101,52,0.25)'" onmouseout="this.style.background='#166534';this.style.transform='translateY(0)';this.style.boxShadow='none'">Shop Fresh Produce</a>
        <a href="#farm-story" style="text-decoration:none;border:2px solid #166534;color:#166534;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;transition:all 0.3s;display:inline-block;cursor:pointer" onmouseover="this.style.background='#dcfce7'" onmouseout="this.style.background='transparent'">Meet Our Farmers</a>
      </div>
    </div>
  </div>
</section>

<!-- Freshness Badge Legend -->
<section style="padding:40px 24px">
  <div style="max-width:800px;margin:0 auto">
    <div class="reveal" style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap">
      <div class="badge-harvested badge-pulse" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:99px;font-size:14px;font-weight:600">
        <svg width="18" height="18" style="color:#166534"><use href="#icon-leaf"/></svg>
        Harvested Today
      </div>
      <div class="badge-fresh" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:99px;font-size:14px;font-weight:600">
        <svg width="18" height="18" style="color:#92400e"><use href="#icon-clock"/></svg>
        3 Days Fresh
      </div>
      <div class="badge-direct" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:99px;font-size:14px;font-weight:600">
        <svg width="18" height="18" style="color:#78350f"><use href="#icon-farm"/></svg>
        Farm Direct
      </div>
    </div>
  </div>
</section>

<!-- Product Grid -->
<section id="products" style="padding:60px 24px 80px">
  <div style="max-width:1200px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:48px">
      <h2 class="font-display" style="font-size:clamp(1.8rem,3.5vw,2.6rem);font-weight:700;color:#451a03;margin-bottom:8px">Fresh From the Farm</h2>
      <p style="font-size:16px;color:#78350f;opacity:0.7">Hand-picked, organic, and delivered with care</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px" id="product-grid">
    </div>
  </div>
</section>

<!-- Farm Story -->
<section id="farm-story" style="padding:80px 24px;background:linear-gradient(180deg,#fefce8 0%,#dcfce7 100%)">
  <div style="max-width:1000px;margin:0 auto">
    <div class="reveal" style="display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center">
      <div>
        <!-- Farm illustration -->
        <div style="background:#fff;border-radius:24px;padding:40px;border:1px solid #86efac;position:relative;text-align:center">
          <div style="position:absolute;top:-12px;left:24px;background:#166534;color:#fff;padding:4px 16px;border-radius:99px;font-size:12px;font-weight:700">Partner Farm</div>
          <div style="font-size:80px;margin-bottom:16px">🌾</div>
          <div style="width:60px;height:60px;background:#dcfce7;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;border:2px solid #86efac;font-size:28px">
            👨‍🌾
          </div>
          <h4 class="font-display" style="font-size:18px;font-weight:700;color:#166534">Green Valley Farm</h4>
          <p style="font-size:13px;color:#78350f;opacity:0.7;margin-top:4px">Willamette Valley, Oregon</p>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:16px">
            <span class="badge-harvested" style="font-size:11px;padding:4px 10px;border-radius:99px;font-weight:600">Organic</span>
            <span class="badge-direct" style="font-size:11px;padding:4px 10px;border-radius:99px;font-weight:600">Est. 1987</span>
          </div>
        </div>
      </div>
      <div>
        <div style="font-size:13px;color:#166534;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px">Meet the Farmer</div>
        <h2 class="font-display" style="font-size:clamp(1.6rem,3vw,2.2rem);font-weight:700;color:#451a03;margin-bottom:16px;line-height:1.2">
          "I grow food the way<br>nature intended."
        </h2>
        <p style="font-size:15px;color:#78350f;line-height:1.8;margin-bottom:16px;opacity:0.85">
          Third-generation farmer Tom Henderson has been cultivating organic produce for over 35 years. His 120-acre farm uses traditional methods combined with modern sustainable practices.
        </p>
        <p style="font-size:15px;color:#78350f;line-height:1.8;margin-bottom:24px;opacity:0.85">
          "Every tomato, every herb, every egg comes from soil we've nurtured with care. When you taste our produce, you taste the difference real farming makes."
        </p>
        <div style="display:flex;gap:24px;flex-wrap:wrap">
          <div>
            <div class="font-display" style="font-size:28px;font-weight:700;color:#166534">35+</div>
            <div style="font-size:12px;color:#78350f;opacity:0.6">Years Farming</div>
          </div>
          <div>
            <div class="font-display" style="font-size:28px;font-weight:700;color:#166534">120</div>
            <div style="font-size:12px;color:#78350f;opacity:0.6">Acres Organic</div>
          </div>
          <div>
            <div class="font-display" style="font-size:28px;font-weight:700;color:#166534">50+</div>
            <div style="font-size:12px;color:#78350f;opacity:0.6">Crop Varieties</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Subscription Box -->
<section id="subscription" style="padding:80px 24px">
  <div style="max-width:900px;margin:0 auto">
    <div class="reveal">
      <div class="shimmer-border" style="display:inline-block;width:100%">
        <div style="background:#fff;border-radius:18px;padding:48px;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center">
          <div>
            <div style="display:inline-flex;align-items:center;gap:6px;background:#dcfce7;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;color:#166534;margin-bottom:16px">
              <svg width="14" height="14" style="color:#166534"><use href="#icon-leaf"/></svg>
              WEEKLY SUBSCRIPTION
            </div>
            <h2 class="font-display" style="font-size:clamp(1.6rem,3vw,2.2rem);font-weight:700;color:#451a03;margin-bottom:12px;line-height:1.2">
              Weekly Farm Box
            </h2>
            <p style="font-size:15px;color:#78350f;line-height:1.7;margin-bottom:20px;opacity:0.8">
              A curated selection of the freshest seasonal produce, delivered to your door every week. Never wonder what's for dinner again.
            </p>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:24px">
              <span class="font-display" style="font-size:36px;font-weight:700;color:#166534">$39.99</span>
              <span style="font-size:15px;color:#78350f;opacity:0.6">/week</span>
            </div>
            <button onclick="showToast('Subscribed to Weekly Farm Box!')" style="background:#166534;color:#fff;border:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer;transition:all 0.3s;font-family:'Source Sans 3',sans-serif" onmouseover="this.style.background='#14532d';this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#166534';this.style.transform='translateY(0)'">
              Subscribe Now
            </button>
          </div>
          <div>
            <div style="font-size:13px;font-weight:700;color:#166534;margin-bottom:16px">What's Inside This Week:</div>
            <div style="display:flex;flex-direction:column;gap:10px">
              <div style="display:flex;align-items:center;gap:12px;background:#fefce8;padding:10px 16px;border-radius:10px">
                <span style="font-size:24px">🍅</span>
                <div>
                  <div style="font-size:14px;font-weight:600;color:#451a03">Heirloom Tomatoes</div>
                  <div style="font-size:12px;color:#78350f;opacity:0.6">2 lbs</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;background:#fefce8;padding:10px 16px;border-radius:10px">
                <span style="font-size:24px">🥬</span>
                <div>
                  <div style="font-size:14px;font-weight:600;color:#451a03">Mixed Greens</div>
                  <div style="font-size:12px;color:#78350f;opacity:0.6">1 bunch</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;background:#fefce8;padding:10px 16px;border-radius:10px">
                <span style="font-size:24px">🥚</span>
                <div>
                  <div style="font-size:14px;font-weight:600;color:#451a03">Farm Eggs</div>
                  <div style="font-size:12px;color:#78350f;opacity:0.6">1 dozen</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;background:#fefce8;padding:10px 16px;border-radius:10px">
                <span style="font-size:24px">🌿</span>
                <div>
                  <div style="font-size:14px;font-weight:600;color:#451a03">Fresh Herbs Bundle</div>
                  <div style="font-size:12px;color:#78350f;opacity:0.6">Basil, Rosemary, Thyme</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;background:#fefce8;padding:10px 16px;border-radius:10px">
                <span style="font-size:24px">🍯</span>
                <div>
                  <div style="font-size:14px;font-weight:600;color:#451a03">Raw Honey</div>
                  <div style="font-size:12px;color:#78350f;opacity:0.6">8 oz jar</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer style="padding:60px 24px 32px;background:#166534;color:#dcfce7">
  <div style="max-width:1200px;margin:0 auto">
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:40px">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <svg width="24" height="24" style="color:#86efac"><use href="#icon-leaf"/></svg>
          <span class="font-display" style="font-weight:700;font-size:20px;color:#fff">FarmFresh</span>
        </div>
        <p style="font-size:14px;line-height:1.7;opacity:0.7;max-width:280px">
          Connecting local farms with your kitchen. Fresh, organic, sustainable produce delivered with care.
        </p>
        <div style="display:flex;gap:8px;margin-top:16px">
          <span style="background:rgba(255,255,255,0.1);padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600">USDA Organic</span>
          <span style="background:rgba(255,255,255,0.1);padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600">Non-GMO</span>
        </div>
      </div>
      <div>
        <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px">Delivery Areas</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <span style="font-size:13px;opacity:0.7">Portland Metro</span>
          <span style="font-size:13px;opacity:0.7">Salem / Corvallis</span>
          <span style="font-size:13px;opacity:0.7">Eugene / Springfield</span>
          <span style="font-size:13px;opacity:0.7">Seattle (Coming Soon)</span>
        </div>
      </div>
      <div>
        <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px">Farm Partners</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <span style="font-size:13px;opacity:0.7">Green Valley Farm</span>
          <span style="font-size:13px;opacity:0.7">Sunrise Orchards</span>
          <span style="font-size:13px;opacity:0.7">Heritage Poultry Co.</span>
          <span style="font-size:13px;opacity:0.7">View All Partners</span>
        </div>
      </div>
      <div>
        <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px">Certifications</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <span style="font-size:13px;opacity:0.7">USDA Organic</span>
          <span style="font-size:13px;opacity:0.7">Non-GMO Project</span>
          <span style="font-size:13px;opacity:0.7">Fair Trade Certified</span>
          <span style="font-size:13px;opacity:0.7">Rainforest Alliance</span>
        </div>
      </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.15);padding-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <p style="font-size:12px;opacity:0.5">&copy; 2026 FarmFresh Market. All rights reserved.</p>
      <div style="display:flex;gap:20px">
        <a style="font-size:12px;opacity:0.5;text-decoration:none;color:#dcfce7;cursor:pointer">Privacy</a>
        <a style="font-size:12px;opacity:0.5;text-decoration:none;color:#dcfce7;cursor:pointer">Terms</a>
        <a style="font-size:12px;opacity:0.5;text-decoration:none;color:#dcfce7;cursor:pointer">Contact</a>
      </div>
    </div>
  </div>
</footer>

<script>
// Product Data
const products = [
  { id:1, name:'Organic Tomatoes', price:'4.99', unit:'lb', emoji:'🍅', badge:'harvested', desc:'Vine-ripened heirloom tomatoes, picked this morning from our greenhouse.' },
  { id:2, name:'Fresh Basil', price:'2.50', unit:'bunch', emoji:'🌿', badge:'harvested', desc:'Fragrant sweet basil, hand-picked at peak aroma. Perfect for pesto.' },
  { id:3, name:'Farm Eggs', price:'6.99', unit:'dz', emoji:'🥚', badge:'direct', desc:'Free-range eggs from pasture-raised hens. Rich golden yolks.' },
  { id:4, name:'Raw Honey', price:'12.00', unit:'jar', emoji:'🍯', badge:'direct', desc:'Unfiltered wildflower honey from our own apiaries. Pure liquid gold.' },
  { id:5, name:'Sourdough Bread', price:'8.00', unit:'loaf', emoji:'🍞', badge:'fresh', desc:'Artisan sourdough made with heritage wheat flour. 48-hour ferment.' },
  { id:6, name:'Mixed Greens', price:'5.99', unit:'bag', emoji:'🥬', badge:'harvested', desc:'Tender spring mix with arugula, spinach, and baby kale.' }
];

// Cart (pre-populated with 3 items as per nav indicator)
let cart = [
  { ...products[0], qty:2 },
  { ...products[3], qty:1 }
];

function getBadgeHTML(badge) {
  if (badge === 'harvested') return '<div class="badge-harvested badge-pulse" style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700"><svg width="14" height="14" style="color:#166534"><use href="#icon-leaf"/></svg>Harvested Today</div>';
  if (badge === 'fresh') return '<div class="badge-fresh" style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700"><svg width="14" height="14" style="color:#92400e"><use href="#icon-clock"/></svg>3 Days Fresh</div>';
  return '<div class="badge-direct" style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700"><svg width="14" height="14" style="color:#78350f"><use href="#icon-farm"/></svg>Farm Direct</div>';
}

function getGradient(idx) {
  const grads = [
    'linear-gradient(135deg,#fecaca 0%,#fef3c7 100%)',
    'linear-gradient(135deg,#dcfce7 0%,#d1fae5 100%)',
    'linear-gradient(135deg,#fef3c7 0%,#fed7aa 100%)',
    'linear-gradient(135deg,#fde68a 0%,#fbbf24 40%,#fef3c7 100%)',
    'linear-gradient(135deg,#fef3c7 0%,#f5f0e1 100%)',
    'linear-gradient(135deg,#d1fae5 0%,#dcfce7 50%,#fefce8 100%)'
  ];
  return grads[idx % grads.length];
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = products.map((p, i) => `
    <div class="product-card reveal" style="animation-delay:${i * 0.1}s">
      <div style="background:${getGradient(i)};padding:40px;text-align:center;position:relative;min-height:180px;display:flex;align-items:center;justify-content:center">
        <span style="font-size:72px">${p.emoji}</span>
        <div style="position:absolute;top:12px;left:12px">${getBadgeHTML(p.badge)}</div>
      </div>
      <div style="padding:20px">
        <h3 class="font-display" style="font-size:17px;font-weight:700;color:#451a03;margin-bottom:6px">${p.name}</h3>
        <p style="font-size:13px;color:#78350f;opacity:0.65;line-height:1.6;margin-bottom:12px;min-height:40px">${p.desc}</p>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto">
          <div style="display:flex;align-items:baseline;gap:2px">
            <span class="font-display" style="font-size:22px;font-weight:700;color:#166534">$${p.price}</span>
            <span style="font-size:12px;color:#78350f;opacity:0.5">/${p.unit}</span>
          </div>
          <button class="card-add" onclick="event.stopPropagation();addToCart(${p.id})" style="background:#166534;color:#fff;border:none;padding:8px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:'Source Sans 3',sans-serif;display:flex;align-items:center;gap:6px" onmouseover="this.style.background='#14532d'" onmouseout="this.style.background='#166534'">
            <svg width="14" height="14" style="color:#fff"><use href="#icon-cart"/></svg>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `).join('');
  // Re-observe reveals
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
}

// Quantity selector for cart
function adjustCartQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { cart = cart.filter(c => c.id !== id); }
  updateCartUI();
}

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(c => c.id === id);
  if (existing) { existing.qty += 1; } else { cart.push({ ...p, qty: 1 }); }
  updateCartUI();
  showToast('Added "' + p.name + '" to cart!');
}

function updateCartUI() {
  const count = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cart-count').textContent = count;

  const items = document.getElementById('cart-items');
  const footer = document.getElementById('cart-footer');

  if (cart.length === 0) {
    items.innerHTML = '<div style="text-align:center;padding:48px 0;color:#78350f;opacity:0.5"><div style="font-size:48px;margin-bottom:12px">🧺</div><p>Your cart is empty</p></div>';
    footer.innerHTML = '';
    return;
  }

  items.innerHTML = cart.map(c => `
    <div style="display:flex;gap:14px;align-items:center;padding:14px 0;border-bottom:1px solid #e5e0d5">
      <div style="width:48px;height:48px;background:#dcfce7;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">${c.emoji}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:700;color:#451a03">${c.name}</div>
        <div style="font-size:12px;color:#78350f;opacity:0.6">$${c.price} / ${c.unit}</div>
      </div>
      <div style="display:flex;align-items:center;border:1px solid #e5e0d5;border-radius:8px;overflow:hidden">
        <button onclick="adjustCartQty(${c.id},-1)" style="padding:4px 10px;border:none;background:none;cursor:pointer;font-size:14px;color:#78350f">-</button>
        <span style="padding:4px 8px;font-size:13px;font-weight:700;border-left:1px solid #e5e0d5;border-right:1px solid #e5e0d5;min-width:28px;text-align:center">${c.qty}</span>
        <button onclick="adjustCartQty(${c.id},1)" style="padding:4px 10px;border:none;background:none;cursor:pointer;font-size:14px;color:#78350f">+</button>
      </div>
      <div style="font-weight:700;color:#166534;font-size:14px;min-width:50px;text-align:right">$${(parseFloat(c.price) * c.qty).toFixed(2)}</div>
    </div>
  `).join('');

  const total = cart.reduce((s, c) => s + parseFloat(c.price) * c.qty, 0);
  footer.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <span style="font-weight:700;color:#451a03">Total</span>
      <span class="font-display" style="font-size:22px;font-weight:700;color:#166534">$${total.toFixed(2)}</span>
    </div>
    <button onclick="showToast('Proceeding to checkout...');closeCart()" style="width:100%;background:#166534;color:#fff;border:none;padding:14px;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer;transition:all 0.2s;font-family:'Source Sans 3',sans-serif" onmouseover="this.style.background='#14532d'" onmouseout="this.style.background='#166534'">Checkout</button>
    <p style="font-size:11px;color:#78350f;opacity:0.5;text-align:center;margin-top:8px">Free delivery on orders over $50</p>
  `;
}

function openCart() {
  document.getElementById('cart-overlay').style.display = 'block';
  setTimeout(() => document.getElementById('cart-drawer').style.right = '0', 10);
  updateCartUI();
}

function closeCart() {
  document.getElementById('cart-drawer').style.right = '-420px';
  setTimeout(() => document.getElementById('cart-overlay').style.display = 'none', 350);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// Responsive nav
function checkNav() {
  const w = window.innerWidth;
  const links = document.getElementById('nav-links');
  const toggle = document.getElementById('mobile-toggle');
  if (w < 768) {
    links.style.display = 'none';
    toggle.style.display = 'block';
  } else {
    links.style.display = 'flex';
    toggle.style.display = 'none';
    closeMobileNav();
  }
}
function toggleMobileNav() {
  const menu = document.getElementById('mobile-menu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}
function closeMobileNav() {
  document.getElementById('mobile-menu').style.display = 'none';
}
window.addEventListener('resize', checkNav);
checkNav();

// Responsive product grid
function checkGrid() {
  const grid = document.getElementById('product-grid');
  const w = window.innerWidth;
  if (w < 640) grid.style.gridTemplateColumns = '1fr';
  else if (w < 900) grid.style.gridTemplateColumns = 'repeat(2,1fr)';
  else grid.style.gridTemplateColumns = 'repeat(3,1fr)';

  // Farm story grid
  const storySection = document.querySelector('#farm-story > div > .reveal');
  if (storySection) {
    storySection.style.gridTemplateColumns = w < 768 ? '1fr' : '1fr 1fr';
  }
  // Subscription grid
  const subGrid = document.querySelector('.shimmer-border > div');
  if (subGrid) {
    subGrid.style.gridTemplateColumns = w < 768 ? '1fr' : '1fr 1fr';
  }
  // Footer grid
  const footerGrid = document.querySelector('footer > div > div:first-child');
  if (footerGrid) {
    footerGrid.style.gridTemplateColumns = w < 640 ? '1fr' : w < 900 ? 'repeat(2,1fr)' : '2fr 1fr 1fr 1fr';
  }
}
window.addEventListener('resize', checkGrid);

// Scroll reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

// Init
renderProducts();
updateCartUI();
checkGrid();
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
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
