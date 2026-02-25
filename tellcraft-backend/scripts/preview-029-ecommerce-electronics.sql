INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '0cdd2c00-b1ed-431e-937d-bebdfe5166bc',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TechVault — Premium Electronics</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config={
  theme:{
    extend:{
      colors:{
        'ev-blue':'#0ea5e9',
        'ev-green':'#22c55e',
        'ev-dark':'#0a0a0a',
        'ev-panel':'#111115',
        'ev-card':'#161620',
        'ev-steel':'#374151',
        'ev-border':'#1e293b'
      },
      fontFamily:{
        'display':['Rajdhani','sans-serif'],
        'body':['Inter','sans-serif']
      }
    }
  }
}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#0a0a0a;color:#e2e8f0;overflow-x:hidden}

/* Circuit board trace SVG background */
.circuit-bg{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.04}
.circuit-bg svg{width:100%;height:100%}

.glow-blue{box-shadow:0 0 20px rgba(14,165,233,0.3),0 0 60px rgba(14,165,233,0.1)}
.glow-blue-sm{box-shadow:0 0 12px rgba(14,165,233,0.25)}
.glow-green{box-shadow:0 0 16px rgba(34,197,94,0.25)}

.btn-primary{background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;border:none;padding:14px 32px;border-radius:8px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:16px;letter-spacing:0.5px;cursor:pointer;transition:all 0.3s;text-transform:uppercase}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 0 24px rgba(14,165,233,0.4),0 8px 24px rgba(14,165,233,0.2)}

.btn-outline{border:1px solid #0ea5e9;color:#0ea5e9;background:transparent;padding:12px 28px;border-radius:8px;font-family:'Rajdhani',sans-serif;font-weight:600;font-size:15px;cursor:pointer;transition:all 0.3s;text-transform:uppercase}
.btn-outline:hover{background:rgba(14,165,233,0.1);box-shadow:0 0 16px rgba(14,165,233,0.2)}

.product-card{background:#111115;border:1px solid #1e293b;border-radius:12px;overflow:hidden;transition:all 0.35s;cursor:pointer}
.product-card:hover{border-color:#0ea5e9;transform:translateY(-6px);box-shadow:0 12px 40px rgba(14,165,233,0.12)}

.spec-mono{font-family:'Rajdhani',monospace;font-size:13px;color:#94a3b8;letter-spacing:0.3px}

.compare-check{width:16px;height:16px;accent-color:#0ea5e9;cursor:pointer}
.compare-label{font-size:12px;color:#64748b;cursor:pointer;user-select:none;font-family:'Rajdhani',sans-serif;font-weight:500;letter-spacing:0.5px;text-transform:uppercase}

.comparison-winner{background:rgba(34,197,94,0.08);color:#22c55e;font-weight:700}
.comparison-cell{padding:12px 16px;font-size:14px;border-bottom:1px solid #1e293b;font-family:'Inter',sans-serif}
.comparison-header{padding:12px 16px;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-family:'Rajdhani',sans-serif;font-weight:600;color:#64748b;border-bottom:1px solid #1e293b}

.countdown-digit{background:linear-gradient(180deg,#161620,#111115);border:1px solid #1e293b;border-radius:8px;padding:8px 12px;font-family:'Rajdhani',sans-serif;font-size:28px;font-weight:700;color:#0ea5e9;min-width:56px;text-align:center;letter-spacing:1px}
.countdown-sep{font-family:'Rajdhani',sans-serif;font-size:28px;font-weight:700;color:#374151;padding:0 4px}

.cat-pill{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 20px;border-radius:12px;border:1px solid #1e293b;background:#111115;cursor:pointer;transition:all 0.3s;min-width:110px;text-align:center}
.cat-pill:hover{border-color:#0ea5e9;background:rgba(14,165,233,0.05)}
.cat-pill svg{width:32px;height:32px;stroke:#64748b;transition:stroke 0.3s}
.cat-pill:hover svg{stroke:#0ea5e9}
.cat-pill span{font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:600;color:#94a3b8;letter-spacing:0.5px;text-transform:uppercase}

.reveal{opacity:0;transform:translateY(24px);transition:all 0.6s ease}
.reveal.visible{opacity:1;transform:translateY(0)}

.toast{position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:600;transform:translateY(100px);opacity:0;transition:all 0.4s;z-index:9999;font-family:'Inter',sans-serif}
.toast.show{transform:translateY(0);opacity:1}

.nav-glass{backdrop-filter:blur(16px);background:rgba(10,10,10,0.85);border-bottom:1px solid rgba(30,41,59,0.6)}

@keyframes pulseGlow{0%,100%{box-shadow:0 0 20px rgba(14,165,233,0.3)}50%{box-shadow:0 0 32px rgba(14,165,233,0.5)}}
.pulse-glow{animation:pulseGlow 2.5s ease-in-out infinite}

.star-rating{color:#eab308;font-size:13px;letter-spacing:1px}
</style>
</head>
<body>

<!-- Circuit Board Trace Background (SIGNATURE) -->
<div class="circuit-bg">
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <defs>
    <pattern id="circuit" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
      <!-- Horizontal traces -->
      <line x1="0" y1="40" x2="80" y2="40" stroke="#0ea5e9" stroke-width="1"/>
      <line x1="120" y1="40" x2="200" y2="40" stroke="#0ea5e9" stroke-width="1"/>
      <line x1="0" y1="100" x2="60" y2="100" stroke="#0ea5e9" stroke-width="1"/>
      <line x1="140" y1="100" x2="200" y2="100" stroke="#0ea5e9" stroke-width="1"/>
      <line x1="30" y1="160" x2="170" y2="160" stroke="#0ea5e9" stroke-width="1"/>
      <!-- Vertical traces -->
      <line x1="80" y1="0" x2="80" y2="40" stroke="#0ea5e9" stroke-width="1"/>
      <line x1="120" y1="40" x2="120" y2="100" stroke="#0ea5e9" stroke-width="1"/>
      <line x1="60" y1="100" x2="60" y2="160" stroke="#0ea5e9" stroke-width="1"/>
      <line x1="140" y1="100" x2="140" y2="160" stroke="#0ea5e9" stroke-width="1"/>
      <line x1="170" y1="160" x2="170" y2="200" stroke="#0ea5e9" stroke-width="1"/>
      <line x1="30" y1="160" x2="30" y2="200" stroke="#0ea5e9" stroke-width="1"/>
      <!-- Corner traces -->
      <line x1="80" y1="40" x2="120" y2="40" stroke="#0ea5e9" stroke-width="1" stroke-dasharray="4,4"/>
      <line x1="60" y1="100" x2="140" y2="100" stroke="#0ea5e9" stroke-width="1" stroke-dasharray="4,4"/>
      <!-- Circular nodes -->
      <circle cx="80" cy="40" r="3" fill="none" stroke="#0ea5e9" stroke-width="1"/>
      <circle cx="120" cy="40" r="3" fill="none" stroke="#0ea5e9" stroke-width="1"/>
      <circle cx="60" cy="100" r="3" fill="none" stroke="#0ea5e9" stroke-width="1"/>
      <circle cx="140" cy="100" r="3" fill="none" stroke="#0ea5e9" stroke-width="1"/>
      <circle cx="30" cy="160" r="3" fill="none" stroke="#0ea5e9" stroke-width="1"/>
      <circle cx="170" cy="160" r="3" fill="none" stroke="#0ea5e9" stroke-width="1"/>
      <!-- Filled nodes (solder points) -->
      <circle cx="80" cy="40" r="1.5" fill="#0ea5e9"/>
      <circle cx="120" cy="40" r="1.5" fill="#0ea5e9"/>
      <circle cx="60" cy="100" r="1.5" fill="#0ea5e9"/>
      <circle cx="140" cy="100" r="1.5" fill="#0ea5e9"/>
      <circle cx="30" cy="160" r="1.5" fill="#0ea5e9"/>
      <circle cx="170" cy="160" r="1.5" fill="#0ea5e9"/>
      <!-- IC chip outline -->
      <rect x="90" y="70" width="20" height="24" rx="2" fill="none" stroke="#0ea5e9" stroke-width="0.8"/>
      <line x1="90" y1="76" x2="85" y2="76" stroke="#0ea5e9" stroke-width="0.6"/>
      <line x1="90" y1="82" x2="85" y2="82" stroke="#0ea5e9" stroke-width="0.6"/>
      <line x1="90" y1="88" x2="85" y2="88" stroke="#0ea5e9" stroke-width="0.6"/>
      <line x1="110" y1="76" x2="115" y2="76" stroke="#0ea5e9" stroke-width="0.6"/>
      <line x1="110" y1="82" x2="115" y2="82" stroke="#0ea5e9" stroke-width="0.6"/>
      <line x1="110" y1="88" x2="115" y2="88" stroke="#0ea5e9" stroke-width="0.6"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#circuit)"/>
</svg>
</div>

<div class="toast" id="toast"></div>

<!-- Navigation -->
<nav class="nav-glass fixed top-0 left-0 right-0 z-50" style="padding:14px 0">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:10px;cursor:pointer" onclick="window.scrollTo({top:0,behavior:'smooth'})">
      <!-- Circuit icon -->
      <div style="width:36px;height:36px;border-radius:8px;background:#0a0a0a;border:1px solid #0ea5e9;display:flex;align-items:center;justify-content:center;position:relative" class="glow-blue-sm">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="8" height="8" rx="1" stroke="#0ea5e9" stroke-width="1.5"/>
          <line x1="10" y1="2" x2="10" y2="6" stroke="#0ea5e9" stroke-width="1.5"/>
          <line x1="10" y1="14" x2="10" y2="18" stroke="#0ea5e9" stroke-width="1.5"/>
          <line x1="2" y1="10" x2="6" y2="10" stroke="#0ea5e9" stroke-width="1.5"/>
          <line x1="14" y1="10" x2="18" y2="10" stroke="#0ea5e9" stroke-width="1.5"/>
          <circle cx="10" cy="2" r="1" fill="#0ea5e9"/>
          <circle cx="10" cy="18" r="1" fill="#0ea5e9"/>
          <circle cx="2" cy="10" r="1" fill="#0ea5e9"/>
          <circle cx="18" cy="10" r="1" fill="#0ea5e9"/>
        </svg>
      </div>
      <span style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:22px;letter-spacing:3px;color:#e2e8f0">TECHVAULT</span>
    </div>
    <div style="display:flex;align-items:center;gap:32px" id="nav-links">
      <a href="#products" style="text-decoration:none;color:#64748b;font-size:13px;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:1px;text-transform:uppercase;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#64748b'">New Arrivals</a>
      <a href="#compare" style="text-decoration:none;color:#64748b;font-size:13px;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:1px;text-transform:uppercase;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#64748b'">Compare</a>
      <a href="#deals" style="text-decoration:none;color:#64748b;font-size:13px;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:1px;text-transform:uppercase;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#64748b'">Deals</a>
    </div>
    <div style="display:flex;align-items:center;gap:16px">
      <button onclick="showToast('Search coming soon')" style="background:none;border:none;cursor:pointer;color:#64748b;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#64748b'">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="6"/><line x1="12.5" y1="12.5" x2="17" y2="17"/></svg>
      </button>
      <button onclick="showToast('Cart: 2 items')" style="background:none;border:none;cursor:pointer;position:relative;color:#e2e8f0;font-size:16px">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/><path d="M1 1h3l2.5 13h11L20 5H6"/></svg>
        <span style="position:absolute;top:-6px;right:-8px;background:#0ea5e9;color:#fff;width:16px;height:16px;border-radius:50%;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif">2</span>
      </button>
    </div>
  </div>
</nav>

<!-- Hero Section -->
<section style="padding:140px 24px 80px;position:relative;z-index:1">
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 60% 20%,rgba(14,165,233,0.08),transparent 60%);pointer-events:none;z-index:0"></div>
  <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;position:relative;z-index:1">
    <div>
      <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.2);border-radius:20px;padding:6px 16px;font-size:12px;color:#0ea5e9;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:24px">
        <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block"></span>
        NEW RELEASE
      </div>
      <h1 style="font-family:'Rajdhani',sans-serif;font-size:clamp(2.4rem,5vw,3.8rem);font-weight:700;line-height:1.1;margin-bottom:16px;letter-spacing:-0.02em;color:#f1f5f9">
        ProMax Wireless<br><span style="color:#0ea5e9">Earbuds</span>
      </h1>
      <div style="display:flex;gap:16px;margin-bottom:24px">
        <span class="spec-mono" style="background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.15);padding:6px 14px;border-radius:6px;font-size:14px;font-weight:600;color:#0ea5e9">ANC</span>
        <span class="spec-mono" style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.15);padding:6px 14px;border-radius:6px;font-size:14px;font-weight:600;color:#22c55e">32h Battery</span>
        <span class="spec-mono" style="background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.15);padding:6px 14px;border-radius:6px;font-size:14px;font-weight:600;color:#0ea5e9">IPX5</span>
      </div>
      <p style="font-size:15px;color:#64748b;max-width:440px;line-height:1.7;margin-bottom:32px">
        Immersive sound meets all-day comfort. Active noise cancellation, 32-hour battery life, and IPX5 water resistance. Engineered for audiophiles.
      </p>
      <div style="display:flex;align-items:center;gap:24px;margin-bottom:36px">
        <span style="font-family:'Rajdhani',sans-serif;font-size:48px;font-weight:700;color:#f1f5f9">$149<span style="font-size:28px;color:#64748b">.99</span></span>
        <span style="font-size:18px;color:#475569;text-decoration:line-through;font-family:'Rajdhani',sans-serif">$199.99</span>
      </div>
      <div style="display:flex;gap:12px">
        <button class="btn-primary pulse-glow" style="font-size:17px;padding:16px 40px">Buy Now</button>
        <button class="btn-outline">Learn More</button>
      </div>
    </div>
    <div style="display:flex;justify-content:center;align-items:center;position:relative">
      <div style="width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(14,165,233,0.1),transparent 70%);display:flex;align-items:center;justify-content:center;position:relative">
        <div style="width:260px;height:260px;border-radius:50%;border:1px solid rgba(14,165,233,0.15);display:flex;align-items:center;justify-content:center">
          <div style="width:180px;height:180px;border-radius:50%;background:linear-gradient(135deg,#111115,#161620);border:1px solid #1e293b;display:flex;align-items:center;justify-content:center;font-size:80px" class="glow-blue">
            🎧
          </div>
        </div>
        <!-- Orbiting spec badges -->
        <div style="position:absolute;top:20px;right:30px;background:#111115;border:1px solid rgba(14,165,233,0.2);border-radius:8px;padding:6px 12px">
          <span style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:600;color:#0ea5e9;letter-spacing:0.5px">BLUETOOTH 5.3</span>
        </div>
        <div style="position:absolute;bottom:30px;left:10px;background:#111115;border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:6px 12px">
          <span style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:600;color:#22c55e;letter-spacing:0.5px">LOSSLESS AUDIO</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Products Grid -->
<section id="products" style="padding:60px 24px;position:relative;z-index:1">
  <div style="max-width:1200px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:40px">
      <h2 style="font-family:'Rajdhani',sans-serif;font-size:32px;font-weight:700;letter-spacing:1px;margin-bottom:8px">NEW ARRIVALS</h2>
      <p style="color:#64748b;font-size:14px">Cutting-edge tech, curated for you</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px" id="product-grid">

      <!-- Product 1 -->
      <div class="product-card reveal">
        <div style="height:200px;background:linear-gradient(135deg,#0c0c14,#111120);display:flex;align-items:center;justify-content:center;font-size:64px;position:relative">
          🎧
          <div style="position:absolute;top:10px;right:10px;display:flex;align-items:center;gap:4px">
            <input type="checkbox" class="compare-check" id="cmp1" onchange="updateCompare()">
            <label for="cmp1" class="compare-label">Compare</label>
          </div>
        </div>
        <div style="padding:16px">
          <h3 style="font-size:15px;font-weight:700;margin-bottom:6px;font-family:'Inter',sans-serif">ProMax ANC Earbuds</h3>
          <div class="spec-mono" style="margin-bottom:8px">ANC | 32h | IPX5 | BT 5.3</div>
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:8px">
            <span class="star-rating">&#9733;&#9733;&#9733;&#9733;&#9734;</span>
            <span style="font-size:12px;color:#64748b;font-family:'Rajdhani',sans-serif;font-weight:500">4.5</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700;color:#f1f5f9">$149.99</span>
            <button onclick="showToast('Added to cart!')" style="background:#0ea5e9;border:none;color:#fff;padding:8px 16px;border-radius:6px;font-family:'Rajdhani',sans-serif;font-weight:600;font-size:13px;cursor:pointer;letter-spacing:0.5px;text-transform:uppercase;transition:all 0.3s" onmouseover="this.style.boxShadow='0 0 12px rgba(14,165,233,0.3)'" onmouseout="this.style.boxShadow='none'">Add to Cart</button>
          </div>
        </div>
      </div>

      <!-- Product 2 -->
      <div class="product-card reveal">
        <div style="height:200px;background:linear-gradient(135deg,#0c0c14,#111120);display:flex;align-items:center;justify-content:center;font-size:64px;position:relative">
          💻
          <div style="position:absolute;top:10px;right:10px;display:flex;align-items:center;gap:4px">
            <input type="checkbox" class="compare-check" id="cmp2" onchange="updateCompare()">
            <label for="cmp2" class="compare-label">Compare</label>
          </div>
        </div>
        <div style="padding:16px">
          <h3 style="font-size:15px;font-weight:700;margin-bottom:6px;font-family:'Inter',sans-serif">VoltBook Pro 15"</h3>
          <div class="spec-mono" style="margin-bottom:8px">i9 | 32GB | 1TB SSD | RTX 4070</div>
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:8px">
            <span class="star-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
            <span style="font-size:12px;color:#64748b;font-family:'Rajdhani',sans-serif;font-weight:500">4.8</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700;color:#f1f5f9">$1,899.99</span>
            <button onclick="showToast('Added to cart!')" style="background:#0ea5e9;border:none;color:#fff;padding:8px 16px;border-radius:6px;font-family:'Rajdhani',sans-serif;font-weight:600;font-size:13px;cursor:pointer;letter-spacing:0.5px;text-transform:uppercase;transition:all 0.3s" onmouseover="this.style.boxShadow='0 0 12px rgba(14,165,233,0.3)'" onmouseout="this.style.boxShadow='none'">Add to Cart</button>
          </div>
        </div>
      </div>

      <!-- Product 3 -->
      <div class="product-card reveal">
        <div style="height:200px;background:linear-gradient(135deg,#0c0c14,#111120);display:flex;align-items:center;justify-content:center;font-size:64px;position:relative">
          📷
          <div style="position:absolute;top:10px;right:10px;display:flex;align-items:center;gap:4px">
            <input type="checkbox" class="compare-check" id="cmp3" onchange="updateCompare()">
            <label for="cmp3" class="compare-label">Compare</label>
          </div>
        </div>
        <div style="padding:16px">
          <h3 style="font-size:15px;font-weight:700;margin-bottom:6px;font-family:'Inter',sans-serif">PixelFrame 4K Camera</h3>
          <div class="spec-mono" style="margin-bottom:8px">48MP | 4K120fps | OIS | WiFi 6E</div>
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:8px">
            <span class="star-rating">&#9733;&#9733;&#9733;&#9733;&#9734;</span>
            <span style="font-size:12px;color:#64748b;font-family:'Rajdhani',sans-serif;font-weight:500">4.3</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700;color:#f1f5f9">$749.99</span>
            <button onclick="showToast('Added to cart!')" style="background:#0ea5e9;border:none;color:#fff;padding:8px 16px;border-radius:6px;font-family:'Rajdhani',sans-serif;font-weight:600;font-size:13px;cursor:pointer;letter-spacing:0.5px;text-transform:uppercase;transition:all 0.3s" onmouseover="this.style.boxShadow='0 0 12px rgba(14,165,233,0.3)'" onmouseout="this.style.boxShadow='none'">Add to Cart</button>
          </div>
        </div>
      </div>

      <!-- Product 4 -->
      <div class="product-card reveal">
        <div style="height:200px;background:linear-gradient(135deg,#0c0c14,#111120);display:flex;align-items:center;justify-content:center;font-size:64px;position:relative">
          ⌚
          <div style="position:absolute;top:10px;right:10px;display:flex;align-items:center;gap:4px">
            <input type="checkbox" class="compare-check" id="cmp4" onchange="updateCompare()">
            <label for="cmp4" class="compare-label">Compare</label>
          </div>
        </div>
        <div style="padding:16px">
          <h3 style="font-size:15px;font-weight:700;margin-bottom:6px;font-family:'Inter',sans-serif">NexGen Smartwatch X</h3>
          <div class="spec-mono" style="margin-bottom:8px">AMOLED | SpO2 | GPS | 7-day</div>
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:8px">
            <span class="star-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
            <span style="font-size:12px;color:#64748b;font-family:'Rajdhani',sans-serif;font-weight:500">4.7</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700;color:#f1f5f9">$299.99</span>
            <button onclick="showToast('Added to cart!')" style="background:#0ea5e9;border:none;color:#fff;padding:8px 16px;border-radius:6px;font-family:'Rajdhani',sans-serif;font-weight:600;font-size:13px;cursor:pointer;letter-spacing:0.5px;text-transform:uppercase;transition:all 0.3s" onmouseover="this.style.boxShadow='0 0 12px rgba(14,165,233,0.3)'" onmouseout="this.style.boxShadow='none'">Add to Cart</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>

<!-- Spec Comparison Table -->
<section id="compare" style="padding:60px 24px;position:relative;z-index:1">
  <div style="max-width:900px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:32px">
      <h2 style="font-family:'Rajdhani',sans-serif;font-size:28px;font-weight:700;letter-spacing:1px;margin-bottom:8px">SPEC COMPARISON</h2>
      <p style="color:#64748b;font-size:14px">Side-by-side breakdown of top picks</p>
    </div>
    <div class="reveal" id="comparison-table" style="background:#111115;border:1px solid #1e293b;border-radius:12px;overflow:hidden">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:2px solid #1e293b">
            <th class="comparison-header" style="text-align:left;width:28%">SPEC</th>
            <th class="comparison-header" style="text-align:center;width:36%">
              <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                <span style="font-size:28px">🎧</span>
                <span style="color:#0ea5e9;font-size:13px;font-weight:700">ProMax ANC Earbuds</span>
              </div>
            </th>
            <th class="comparison-header" style="text-align:center;width:36%">
              <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                <span style="font-size:28px">⌚</span>
                <span style="color:#94a3b8;font-size:13px;font-weight:700">NexGen Smartwatch X</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="comparison-cell" style="color:#94a3b8;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;font-size:12px">Battery</td>
            <td class="comparison-cell comparison-winner" style="text-align:center;font-family:'Rajdhani',sans-serif;font-weight:600">32 hours &#9733;</td>
            <td class="comparison-cell" style="text-align:center;color:#94a3b8;font-family:'Rajdhani',sans-serif">7 days</td>
          </tr>
          <tr>
            <td class="comparison-cell" style="color:#94a3b8;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;font-size:12px">Weight</td>
            <td class="comparison-cell comparison-winner" style="text-align:center;font-family:'Rajdhani',sans-serif;font-weight:600">5.4g (each) &#9733;</td>
            <td class="comparison-cell" style="text-align:center;color:#94a3b8;font-family:'Rajdhani',sans-serif">42g</td>
          </tr>
          <tr>
            <td class="comparison-cell" style="color:#94a3b8;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;font-size:12px">Price</td>
            <td class="comparison-cell comparison-winner" style="text-align:center;font-family:'Rajdhani',sans-serif;font-weight:600">$149.99 &#9733;</td>
            <td class="comparison-cell" style="text-align:center;color:#94a3b8;font-family:'Rajdhani',sans-serif">$299.99</td>
          </tr>
          <tr>
            <td class="comparison-cell" style="color:#94a3b8;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;font-size:12px">Rating</td>
            <td class="comparison-cell" style="text-align:center;color:#94a3b8;font-family:'Rajdhani',sans-serif">4.5 / 5</td>
            <td class="comparison-cell comparison-winner" style="text-align:center;font-family:'Rajdhani',sans-serif;font-weight:600">4.7 / 5 &#9733;</td>
          </tr>
          <tr>
            <td class="comparison-cell" style="color:#94a3b8;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;font-size:12px">Features</td>
            <td class="comparison-cell comparison-winner" style="text-align:center;font-family:'Rajdhani',sans-serif;font-weight:600;font-size:13px">ANC, Transparency, Spatial Audio &#9733;</td>
            <td class="comparison-cell" style="text-align:center;color:#94a3b8;font-family:'Rajdhani',sans-serif;font-size:13px">SpO2, ECG, GPS, NFC</td>
          </tr>
          <tr>
            <td class="comparison-cell" style="color:#94a3b8;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;font-size:12px;border:none">Water Resist</td>
            <td class="comparison-cell" style="text-align:center;color:#94a3b8;font-family:'Rajdhani',sans-serif;border:none">IPX5</td>
            <td class="comparison-cell comparison-winner" style="text-align:center;font-family:'Rajdhani',sans-serif;font-weight:600;border:none">5ATM &#9733;</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<!-- Flash Sale / Deals Banner with Countdown -->
<section id="deals" style="padding:60px 24px;position:relative;z-index:1">
  <div class="reveal" style="max-width:1100px;margin:0 auto;background:linear-gradient(135deg,#0c1929,#0a1628);border:1px solid rgba(14,165,233,0.2);border-radius:16px;padding:48px;display:grid;grid-template-columns:1fr auto;gap:40px;align-items:center;position:relative;overflow:hidden">
    <!-- Subtle circuit accent in banner -->
    <div style="position:absolute;top:-20px;right:-20px;width:200px;height:200px;opacity:0.06">
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        <line x1="0" y1="100" x2="200" y2="100" stroke="#0ea5e9" stroke-width="1"/>
        <line x1="100" y1="0" x2="100" y2="200" stroke="#0ea5e9" stroke-width="1"/>
        <circle cx="100" cy="100" r="4" fill="#0ea5e9"/>
        <circle cx="50" cy="100" r="3" fill="none" stroke="#0ea5e9" stroke-width="1"/>
        <circle cx="150" cy="100" r="3" fill="none" stroke="#0ea5e9" stroke-width="1"/>
        <circle cx="100" cy="50" r="3" fill="none" stroke="#0ea5e9" stroke-width="1"/>
        <circle cx="100" cy="150" r="3" fill="none" stroke="#0ea5e9" stroke-width="1"/>
      </svg>
    </div>
    <div style="position:relative">
      <div style="display:inline-flex;align-items:center;gap:6px;margin-bottom:12px">
        <span style="font-size:11px;font-family:'Rajdhani',sans-serif;font-weight:700;color:#22c55e;letter-spacing:2px;text-transform:uppercase;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);padding:4px 10px;border-radius:4px">FLASH SALE</span>
      </div>
      <h2 style="font-family:'Rajdhani',sans-serif;font-size:clamp(1.8rem,3vw,2.6rem);font-weight:700;margin-bottom:8px;color:#f1f5f9;letter-spacing:0.5px">30% Off All Headphones</h2>
      <p style="color:#64748b;font-size:15px;margin-bottom:24px;line-height:1.7">Limited time offer on our premium audio collection. Don't miss out on flagship noise-canceling headphones at unbeatable prices.</p>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:28px">
        <div class="countdown-digit" id="cd-hours">04</div>
        <span class="countdown-sep">:</span>
        <div class="countdown-digit" id="cd-minutes">32</div>
        <span class="countdown-sep">:</span>
        <div class="countdown-digit" id="cd-seconds">17</div>
      </div>
      <button class="btn-primary" onclick="showToast('Heading to deals...')" style="font-size:15px;padding:14px 36px" class="glow-blue">Shop the Sale</button>
    </div>
    <div style="text-align:center;font-size:100px;position:relative;display:flex;align-items:center;justify-content:center">
      <div style="width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(14,165,233,0.12),transparent 70%);display:flex;align-items:center;justify-content:center">
        🎧
      </div>
    </div>
  </div>
</section>

<!-- Categories (Horizontal scroll) -->
<section style="padding:60px 24px;position:relative;z-index:1">
  <div style="max-width:1200px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:32px">
      <h2 style="font-family:'Rajdhani',sans-serif;font-size:24px;font-weight:700;letter-spacing:1px;margin-bottom:8px">BROWSE CATEGORIES</h2>
    </div>
    <div class="reveal" style="display:flex;gap:16px;overflow-x:auto;padding-bottom:12px;justify-content:center;flex-wrap:wrap">

      <div class="cat-pill" onclick="showToast('Headphones category')">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 18v-6a9 9 0 0118 0v6"/>
          <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"/>
        </svg>
        <span>Headphones</span>
      </div>

      <div class="cat-pill" onclick="showToast('Laptops category')">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path d="M2 17h20"/>
          <path d="M6 21h12"/>
          <path d="M12 17v4"/>
        </svg>
        <span>Laptops</span>
      </div>

      <div class="cat-pill" onclick="showToast('Cameras category')">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span>Cameras</span>
      </div>

      <div class="cat-pill" onclick="showToast('Wearables category')">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="7"/>
          <path d="M12 18h.01"/>
          <path d="M12 6v6l3 3"/>
        </svg>
        <span>Wearables</span>
      </div>

      <div class="cat-pill" onclick="showToast('Accessories category')">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/>
          <line x1="4" y1="21" x2="20" y2="21"/>
          <line x1="12" y1="16" x2="12" y2="21"/>
        </svg>
        <span>Accessories</span>
      </div>

    </div>
  </div>
</section>

<!-- Footer -->
<footer style="padding:48px 24px;border-top:1px solid #1e293b;position:relative;z-index:1;background:#0a0a0a">
  <div style="max-width:1200px;margin:0 auto">
    <!-- Warranty / Shipping / Support badges -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:40px">
      <div style="text-align:center;padding:20px;border:1px solid #1e293b;border-radius:10px;background:#111115">
        <div style="font-size:24px;margin-bottom:8px">🛡️</div>
        <div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:14px;color:#e2e8f0;letter-spacing:0.5px;margin-bottom:4px">2-YEAR WARRANTY</div>
        <div style="font-size:12px;color:#64748b">Full coverage on all products</div>
      </div>
      <div style="text-align:center;padding:20px;border:1px solid #1e293b;border-radius:10px;background:#111115">
        <div style="font-size:24px;margin-bottom:8px">🚚</div>
        <div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:14px;color:#e2e8f0;letter-spacing:0.5px;margin-bottom:4px">FREE SHIPPING</div>
        <div style="font-size:12px;color:#64748b">On orders over $50</div>
      </div>
      <div style="text-align:center;padding:20px;border:1px solid #1e293b;border-radius:10px;background:#111115">
        <div style="font-size:24px;margin-bottom:8px">🔄</div>
        <div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:14px;color:#e2e8f0;letter-spacing:0.5px;margin-bottom:4px">30-DAY RETURNS</div>
        <div style="font-size:12px;color:#64748b">No questions asked</div>
      </div>
      <div style="text-align:center;padding:20px;border:1px solid #1e293b;border-radius:10px;background:#111115">
        <div style="font-size:24px;margin-bottom:8px">💬</div>
        <div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:14px;color:#e2e8f0;letter-spacing:0.5px;margin-bottom:4px">24/7 SUPPORT</div>
        <div style="font-size:12px;color:#64748b">Expert help anytime</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:32px">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:28px;height:28px;border-radius:6px;background:#0a0a0a;border:1px solid #0ea5e9;display:flex;align-items:center;justify-content:center">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <rect x="6" y="6" width="8" height="8" rx="1" stroke="#0ea5e9" stroke-width="1.5"/>
              <line x1="10" y1="2" x2="10" y2="6" stroke="#0ea5e9" stroke-width="1.5"/>
              <line x1="10" y1="14" x2="10" y2="18" stroke="#0ea5e9" stroke-width="1.5"/>
              <line x1="2" y1="10" x2="6" y2="10" stroke="#0ea5e9" stroke-width="1.5"/>
              <line x1="14" y1="10" x2="18" y2="10" stroke="#0ea5e9" stroke-width="1.5"/>
            </svg>
          </div>
          <span style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:18px;letter-spacing:2px;color:#e2e8f0">TECHVAULT</span>
        </div>
        <p style="font-size:13px;color:#475569;line-height:1.7;max-width:300px">Premium electronics curated for tech enthusiasts. Quality guaranteed, expertly selected.</p>
      </div>
      <div>
        <div style="font-size:12px;font-family:'Rajdhani',sans-serif;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px">Shop</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <a style="font-size:13px;color:#475569;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#475569'">New Arrivals</a>
          <a style="font-size:13px;color:#475569;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#475569'">Best Sellers</a>
          <a style="font-size:13px;color:#475569;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#475569'">On Sale</a>
          <a style="font-size:13px;color:#475569;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#475569'">Gift Cards</a>
        </div>
      </div>
      <div>
        <div style="font-size:12px;font-family:'Rajdhani',sans-serif;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px">Support</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <a style="font-size:13px;color:#475569;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#475569'">Help Center</a>
          <a style="font-size:13px;color:#475569;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#475569'">Returns</a>
          <a style="font-size:13px;color:#475569;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#475569'">Warranty</a>
          <a style="font-size:13px;color:#475569;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#475569'">Contact Us</a>
        </div>
      </div>
      <div>
        <div style="font-size:12px;font-family:'Rajdhani',sans-serif;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px">Company</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <a style="font-size:13px;color:#475569;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#475569'">About Us</a>
          <a style="font-size:13px;color:#475569;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#475569'">Careers</a>
          <a style="font-size:13px;color:#475569;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#475569'">Press</a>
          <a style="font-size:13px;color:#475569;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='#475569'">Privacy Policy</a>
        </div>
      </div>
    </div>

    <div style="padding-top:24px;border-top:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between">
      <p style="font-size:12px;color:#374151">&copy; 2026 TechVault. All rights reserved.</p>
      <div style="display:flex;gap:16px">
        <span style="font-size:12px;color:#374151;font-family:'Rajdhani',sans-serif;letter-spacing:0.5px">Visa</span>
        <span style="font-size:12px;color:#374151;font-family:'Rajdhani',sans-serif;letter-spacing:0.5px">Mastercard</span>
        <span style="font-size:12px;color:#374151;font-family:'Rajdhani',sans-serif;letter-spacing:0.5px">PayPal</span>
        <span style="font-size:12px;color:#374151;font-family:'Rajdhani',sans-serif;letter-spacing:0.5px">Apple Pay</span>
      </div>
    </div>
  </div>
</footer>

<script>
// Countdown Timer
function startCountdown(){
  let totalSeconds=4*3600+32*60+17;
  function tick(){
    if(totalSeconds<=0)return;
    totalSeconds--;
    const h=Math.floor(totalSeconds/3600);
    const m=Math.floor((totalSeconds%3600)/60);
    const s=totalSeconds%60;
    document.getElementById('cd-hours').textContent=String(h).padStart(2,'0');
    document.getElementById('cd-minutes').textContent=String(m).padStart(2,'0');
    document.getElementById('cd-seconds').textContent=String(s).padStart(2,'0');
  }
  setInterval(tick,1000);
}
startCountdown();

// Toast
function showToast(m){
  const t=document.getElementById('toast');
  t.textContent=m;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}

// Comparison checkbox
function updateCompare(){
  const checks=document.querySelectorAll('.compare-check:checked');
  if(checks.length===2){
    showToast('Compare mode: 2 products selected');
    document.getElementById('compare').scrollIntoView({behavior:'smooth'});
  }
}

// Reveal on scroll
const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

// Smooth anchor scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    const t=document.querySelector(a.getAttribute('href'));
    if(t)t.scrollIntoView({behavior:'smooth'});
  });
});
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
