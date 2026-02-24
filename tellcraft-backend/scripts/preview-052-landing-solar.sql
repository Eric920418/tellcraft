-- Template Preview: landing-solar (Solar Energy Landing Page) v3
-- Angular geometric splits + diagonal clip-paths + SVG sunburst signature
-- Swap Test: Diagonal cuts + radiating sunburst + solar panel grid = unmistakably solar energy
-- Signature: Slowly rotating SVG sunburst at hero center + parallelogram solar grid pattern

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'e181b936-28ea-492d-91c7-66c48226fef2',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SolarPeak - Power Your Future with Solar</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{gold:'#f59e0b','gold-dark':'#d97706','gold-light':'#fbbf24',sky:'#0ea5e9','sky-dark':'#0284c7','sky-light':'#38bdf8',navy:'#0f172a','navy-light':'#1e293b',clean:'#ffffff',cream:'#fffbeb'},fontFamily:{display:['Montserrat','sans-serif'],body:['Open Sans','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Open Sans',sans-serif;overflow-x:hidden;background:#fff;color:#0f172a}
h1,h2,h3,h4,h5,h6,.font-display{font-family:'Montserrat',sans-serif}
html{scroll-behavior:smooth}

/* Sunburst rotation */
@keyframes sunRotate{
  from{transform:rotate(0deg)}
  to{transform:rotate(360deg)}
}
.sunburst{animation:sunRotate 60s linear infinite}

/* Sunburst pulse glow */
@keyframes sunPulse{
  0%,100%{opacity:0.6;filter:drop-shadow(0 0 20px rgba(245,158,11,0.3))}
  50%{opacity:1;filter:drop-shadow(0 0 40px rgba(245,158,11,0.6))}
}
.sun-glow{animation:sunPulse 4s ease-in-out infinite}

/* Counter animation */
@keyframes countUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.counter-animate{animation:countUp 0.6s ease-out forwards}

/* Scroll reveal */
.reveal{opacity:0;transform:translateY(40px);transition:all 0.8s cubic-bezier(0.25,0.46,0.45,0.94)}
.reveal.visible{opacity:1;transform:translateY(0)}
.reveal-left{opacity:0;transform:translateX(-40px);transition:all 0.8s cubic-bezier(0.25,0.46,0.45,0.94)}
.reveal-left.visible{opacity:1;transform:translateX(0)}
.reveal-right{opacity:0;transform:translateX(40px);transition:all 0.8s cubic-bezier(0.25,0.46,0.45,0.94)}
.reveal-right.visible{opacity:1;transform:translateX(0)}

/* Solar panel grid pattern */
.solar-grid{
  background:
    linear-gradient(135deg, rgba(14,165,233,0.08) 25%, transparent 25%),
    linear-gradient(225deg, rgba(14,165,233,0.08) 25%, transparent 25%),
    linear-gradient(315deg, rgba(14,165,233,0.06) 25%, transparent 25%),
    linear-gradient(45deg, rgba(14,165,233,0.06) 25%, transparent 25%);
  background-size: 60px 30px;
  background-position: 0 0, 0 0, 30px 15px, 30px 15px;
}

/* Diagonal hero clip */
.hero-diagonal-navy{
  clip-path:polygon(0 0, 55% 0, 40% 100%, 0 100%);
}
.hero-diagonal-gold{
  clip-path:polygon(42% 0, 100% 0, 100% 100%, 57% 100%);
}

/* Angled section */
.angle-top{
  clip-path:polygon(0 60px, 100% 0, 100% 100%, 0 100%);
  margin-top:-60px;
  padding-top:120px;
}
.angle-bottom{
  clip-path:polygon(0 0, 100% 0, 100% calc(100% - 60px), 0 100%);
  padding-bottom:120px;
}
.angle-both{
  clip-path:polygon(0 60px, 100% 0, 100% calc(100% - 60px), 0 100%);
  margin-top:-60px;
  padding-top:120px;
  padding-bottom:120px;
}

/* Tilted benefit cards */
.tilt-card:nth-child(odd){transform:rotate(-2deg)}
.tilt-card:nth-child(even){transform:rotate(2deg)}
.tilt-card:hover{transform:rotate(0deg) scale(1.05)!important}

/* Range slider styling */
input[type=range]{-webkit-appearance:none;height:8px;border-radius:4px;background:linear-gradient(90deg,#f59e0b,#0ea5e9);outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#f59e0b;cursor:pointer;box-shadow:0 2px 8px rgba(245,158,11,0.4);border:3px solid #fff}
input[type=range]::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:#f59e0b;cursor:pointer;box-shadow:0 2px 8px rgba(245,158,11,0.4);border:3px solid #fff}

/* Diagonal connector lines */
.step-connector{position:relative}
.step-connector::after{
  content:'';position:absolute;top:50%;right:-40px;width:80px;height:3px;
  background:linear-gradient(90deg,#f59e0b,#0ea5e9);transform:rotate(-15deg);transform-origin:left center;
}
.step-connector:last-child::after{display:none}

/* Gold gradient button */
.btn-gold{
  background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);
  transition:all 0.3s ease;
}
.btn-gold:hover{
  background:linear-gradient(135deg,#d97706 0%,#b45309 100%);
  transform:translateY(-2px);
  box-shadow:0 8px 30px rgba(245,158,11,0.35);
}

/* Testimonial bill card */
.bill-card{
  background:repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(0,0,0,0.03) 28px,rgba(0,0,0,0.03) 29px);
  border-left:4px solid;
}
</style>
</head>
<body class="font-body">

<!-- Nav -->
<nav class="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-100">
  <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2.5">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="10" fill="#f59e0b"/>
        <g stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="1" x2="18" y2="6"/>
          <line x1="18" y1="30" x2="18" y2="35"/>
          <line x1="1" y1="18" x2="6" y2="18"/>
          <line x1="30" y1="18" x2="35" y2="18"/>
          <line x1="5.9" y1="5.9" x2="9.4" y2="9.4"/>
          <line x1="26.6" y1="26.6" x2="30.1" y2="30.1"/>
          <line x1="5.9" y1="30.1" x2="9.4" y2="26.6"/>
          <line x1="26.6" y1="9.4" x2="30.1" y2="5.9"/>
        </g>
      </svg>
      <span class="font-display font-bold text-xl text-navy">Solar<span class="text-gold">Peak</span></span>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#solutions" class="text-sm font-medium text-navy/60 hover:text-gold transition-colors cursor-pointer">Solutions</a>
      <a href="#how-it-works" class="text-sm font-medium text-navy/60 hover:text-gold transition-colors cursor-pointer">How It Works</a>
      <a href="#savings" class="text-sm font-medium text-navy/60 hover:text-gold transition-colors cursor-pointer">Savings</a>
      <a href="#contact" class="text-sm font-medium text-navy/60 hover:text-gold transition-colors cursor-pointer">Contact</a>
    </div>
    <button onclick="document.getElementById('quoteModal').classList.remove('hidden')" class="btn-gold text-white px-6 py-2.5 rounded-lg font-display font-bold text-sm cursor-pointer">
      Get Quote
    </button>
  </div>
</nav>

<!-- Hero: Diagonal Split -->
<section class="relative min-h-screen flex items-center overflow-hidden pt-20">
  <!-- Navy Triangle (left) -->
  <div class="absolute inset-0 bg-navy hero-diagonal-navy z-10"></div>
  <!-- Gold/White Triangle (right) -->
  <div class="absolute inset-0 bg-gradient-to-br from-cream to-white hero-diagonal-gold z-10"></div>

  <!-- Sunburst SVG (center, between diagonals) -->
  <div class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
    <div class="sun-glow">
      <svg class="sunburst" width="320" height="320" viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="160" cy="160" r="40" fill="#f59e0b" opacity="0.9"/>
        <circle cx="160" cy="160" r="28" fill="#fbbf24"/>
        <circle cx="160" cy="160" r="16" fill="#fff" opacity="0.6"/>
        <!-- Radiating rays -->
        <g stroke="#f59e0b" stroke-width="2" opacity="0.5">
          <line x1="160" y1="10" x2="160" y2="110"/>
          <line x1="160" y1="210" x2="160" y2="310"/>
          <line x1="10" y1="160" x2="110" y2="160"/>
          <line x1="210" y1="160" x2="310" y2="160"/>
          <line x1="53" y1="53" x2="119" y2="119"/>
          <line x1="201" y1="201" x2="267" y2="267"/>
          <line x1="267" y1="53" x2="201" y2="119"/>
          <line x1="53" y1="267" x2="119" y2="201"/>
        </g>
        <!-- Secondary thinner rays -->
        <g stroke="#fbbf24" stroke-width="1" opacity="0.3">
          <line x1="160" y1="30" x2="160" y2="100"/>
          <line x1="160" y1="220" x2="160" y2="290"/>
          <line x1="30" y1="160" x2="100" y2="160"/>
          <line x1="220" y1="160" x2="290" y2="160"/>
          <line x1="82" y1="37" x2="129" y2="110"/>
          <line x1="191" y1="210" x2="238" y2="283"/>
          <line x1="37" y1="82" x2="110" y2="129"/>
          <line x1="210" y1="191" x2="283" y2="238"/>
          <line x1="238" y1="37" x2="191" y2="110"/>
          <line x1="129" y1="210" x2="82" y2="283"/>
          <line x1="283" y1="82" x2="210" y2="129"/>
          <line x1="37" y1="238" x2="110" y2="191"/>
        </g>
        <!-- Outer decorative ring -->
        <circle cx="160" cy="160" r="70" stroke="#f59e0b" stroke-width="0.5" fill="none" opacity="0.2"/>
        <circle cx="160" cy="160" r="100" stroke="#f59e0b" stroke-width="0.5" fill="none" opacity="0.1" stroke-dasharray="8 4"/>
        <circle cx="160" cy="160" r="140" stroke="#fbbf24" stroke-width="0.3" fill="none" opacity="0.08" stroke-dasharray="4 8"/>
      </svg>
    </div>
  </div>

  <!-- Hero Content -->
  <div class="relative z-30 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center min-h-screen py-32">
    <!-- Left: Text on navy -->
    <div class="reveal-left">
      <div class="inline-flex items-center gap-2 bg-gold/20 text-gold text-xs font-display font-bold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
        <span class="w-2 h-2 bg-gold rounded-full animate-pulse"></span>
        30% Federal Tax Credit Available
      </div>
      <h1 class="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 text-white">
        Power Your<br>
        <span class="text-gold">Future</span> with<br>
        Solar
      </h1>
      <p class="text-white/70 text-lg leading-relaxed mb-8 max-w-md font-body">
        Clean energy for your home and business. Zero down payment, 25-year warranty, and savings from day one.
      </p>
      <div class="flex flex-wrap gap-4">
        <button onclick="document.getElementById('quoteModal').classList.remove('hidden')" class="btn-gold text-white px-8 py-4 rounded-xl font-display font-bold text-base cursor-pointer">
          Get Free Quote &rarr;
        </button>
        <a href="#savings" class="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-display font-bold text-base hover:border-gold hover:text-gold transition-all cursor-pointer inline-block text-center">
          Calculate Savings
        </a>
      </div>
    </div>

    <!-- Right: Calculator Preview Card on gold/white -->
    <div class="reveal-right">
      <div class="bg-white rounded-2xl shadow-2xl p-8 border border-gold/10 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-bl-full"></div>
        <div class="relative">
          <div class="flex items-center gap-2 mb-6">
            <div class="w-3 h-3 bg-gold rounded-full"></div>
            <span class="font-display font-bold text-sm text-navy/60">Savings Preview</span>
          </div>
          <div class="text-center mb-6">
            <div class="text-sm text-navy/50 mb-1 font-body">Your Estimated Annual Savings</div>
            <div class="font-display font-black text-5xl text-gold" id="heroSavings">$2,400</div>
            <div class="text-xs text-navy/40 mt-1">Based on average home</div>
          </div>
          <div class="grid grid-cols-3 gap-3 mb-6">
            <div class="bg-cream rounded-xl p-3 text-center">
              <div class="font-display font-bold text-lg text-navy">$200</div>
              <div class="text-[10px] text-navy/40">Monthly</div>
            </div>
            <div class="bg-sky/5 rounded-xl p-3 text-center">
              <div class="font-display font-bold text-lg text-sky">72%</div>
              <div class="text-[10px] text-navy/40">Bill Reduction</div>
            </div>
            <div class="bg-green-50 rounded-xl p-3 text-center">
              <div class="font-display font-bold text-lg text-green-600">4.2t</div>
              <div class="text-[10px] text-navy/40">CO2 Saved/yr</div>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs text-navy/40">
            <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            <span>Zero down payment &bull; Starts saving immediately</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Solar Grid Pattern Divider -->
<div class="solar-grid h-20 relative">
  <div class="absolute inset-0 flex items-center justify-center">
    <div class="flex gap-2">
      <div class="w-12 h-6 bg-sky/10 transform skew-x-12 rounded-sm"></div>
      <div class="w-12 h-6 bg-sky/15 transform skew-x-12 rounded-sm"></div>
      <div class="w-12 h-6 bg-sky/10 transform skew-x-12 rounded-sm"></div>
      <div class="w-12 h-6 bg-sky/20 transform skew-x-12 rounded-sm"></div>
      <div class="w-12 h-6 bg-sky/10 transform skew-x-12 rounded-sm"></div>
      <div class="w-12 h-6 bg-sky/15 transform skew-x-12 rounded-sm"></div>
      <div class="w-12 h-6 bg-sky/10 transform skew-x-12 rounded-sm"></div>
      <div class="w-12 h-6 bg-sky/20 transform skew-x-12 rounded-sm"></div>
      <div class="w-12 h-6 bg-sky/10 transform skew-x-12 rounded-sm hidden md:block"></div>
      <div class="w-12 h-6 bg-sky/15 transform skew-x-12 rounded-sm hidden md:block"></div>
      <div class="w-12 h-6 bg-sky/10 transform skew-x-12 rounded-sm hidden lg:block"></div>
      <div class="w-12 h-6 bg-sky/20 transform skew-x-12 rounded-sm hidden lg:block"></div>
    </div>
  </div>
</div>

<!-- Savings Calculator -->
<section id="savings" class="angle-top bg-navy text-white py-24">
  <div class="max-w-4xl mx-auto px-6">
    <div class="text-center mb-12 reveal">
      <div class="text-gold text-xs tracking-[0.25em] uppercase font-display font-bold mb-3">Savings Calculator</div>
      <h2 class="font-display font-bold text-3xl md:text-4xl mb-3">See How Much You'll Save</h2>
      <p class="text-white/50 max-w-lg mx-auto">Adjust your roof size and location to get an instant estimate of your solar savings.</p>
    </div>
    <div class="bg-navy-light rounded-2xl p-8 md:p-10 border border-white/10 reveal">
      <!-- Roof Size Slider -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <label class="font-display font-bold text-sm">Roof Size (sq ft)</label>
          <span id="roofValue" class="font-display font-bold text-gold text-lg">1,500</span>
        </div>
        <input type="range" id="roofSlider" min="500" max="5000" value="1500" step="100" class="w-full cursor-pointer" oninput="updateCalc()">
        <div class="flex justify-between text-xs text-white/30 mt-1">
          <span>500 sq ft</span><span>5,000 sq ft</span>
        </div>
      </div>
      <!-- Location Dropdown -->
      <div class="mb-8">
        <label class="font-display font-bold text-sm mb-3 block">Your Location</label>
        <select id="locationSelect" onchange="updateCalc()" class="w-full bg-white/5 border border-white/20 rounded-xl px-5 py-3.5 text-white text-sm cursor-pointer focus:outline-none focus:border-gold appearance-none">
          <option value="1.3" style="color:#0f172a">Southwest (AZ, NV, NM)</option>
          <option value="1.2" selected style="color:#0f172a">Southeast (FL, TX, GA)</option>
          <option value="1.0" style="color:#0f172a">Midwest (IL, OH, MI)</option>
          <option value="0.9" style="color:#0f172a">Northeast (NY, MA, PA)</option>
          <option value="1.15" style="color:#0f172a">West Coast (CA, OR, WA)</option>
        </select>
      </div>
      <!-- Results -->
      <div class="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div class="text-xs text-white/40 mb-1">System Size</div>
            <div class="font-display font-bold text-2xl text-sky" id="calcSize">7.5 kW</div>
          </div>
          <div>
            <div class="text-xs text-white/40 mb-1">Monthly Savings</div>
            <div class="font-display font-bold text-2xl text-gold" id="calcMonthly">$142</div>
          </div>
          <div>
            <div class="text-xs text-white/40 mb-1 font-display font-bold">Annual Savings</div>
            <div class="font-display font-black text-3xl text-gold" id="calcAnnual">$1,704</div>
          </div>
          <div>
            <div class="text-xs text-white/40 mb-1">Payback Period</div>
            <div class="font-display font-bold text-2xl text-green-400" id="calcPayback">6.2 yrs</div>
          </div>
        </div>
      </div>
      <div class="bg-gold/10 rounded-xl p-4 flex items-center justify-between mb-6">
        <div>
          <div class="text-xs text-gold/70">25-Year Total Savings</div>
          <div class="font-display font-black text-2xl text-gold" id="calc25y">$42,600</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-green-400/70">Tax Credit (30%)</div>
          <div class="font-display font-bold text-lg text-green-400" id="calcCredit">-$4,725</div>
        </div>
      </div>
      <button onclick="document.getElementById('quoteModal').classList.remove('hidden')" class="w-full btn-gold text-white py-4 rounded-xl font-display font-bold cursor-pointer">
        Get Your Custom Quote &rarr;
      </button>
    </div>
  </div>
</section>

<!-- Solar Grid Pattern Divider 2 -->
<div class="solar-grid h-16 bg-white relative">
  <div class="absolute inset-0">
    <div class="flex flex-wrap justify-center gap-1.5 py-3">
      <div class="w-10 h-5 bg-sky/8 transform skew-x-12 rounded-sm"></div>
      <div class="w-10 h-5 bg-sky/12 transform skew-x-12 rounded-sm"></div>
      <div class="w-10 h-5 bg-gold/8 transform skew-x-12 rounded-sm"></div>
      <div class="w-10 h-5 bg-sky/10 transform skew-x-12 rounded-sm"></div>
      <div class="w-10 h-5 bg-sky/8 transform skew-x-12 rounded-sm"></div>
      <div class="w-10 h-5 bg-gold/10 transform skew-x-12 rounded-sm"></div>
      <div class="w-10 h-5 bg-sky/12 transform skew-x-12 rounded-sm"></div>
      <div class="w-10 h-5 bg-sky/8 transform skew-x-12 rounded-sm"></div>
      <div class="w-10 h-5 bg-gold/8 transform skew-x-12 rounded-sm"></div>
      <div class="w-10 h-5 bg-sky/10 transform skew-x-12 rounded-sm hidden md:block"></div>
      <div class="w-10 h-5 bg-sky/8 transform skew-x-12 rounded-sm hidden md:block"></div>
      <div class="w-10 h-5 bg-gold/12 transform skew-x-12 rounded-sm hidden md:block"></div>
      <div class="w-10 h-5 bg-sky/8 transform skew-x-12 rounded-sm hidden lg:block"></div>
      <div class="w-10 h-5 bg-sky/10 transform skew-x-12 rounded-sm hidden lg:block"></div>
    </div>
  </div>
</div>

<!-- How It Works: 4 Steps with Diagonal Connectors -->
<section id="how-it-works" class="py-24 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <div class="text-gold text-xs tracking-[0.25em] uppercase font-display font-bold mb-3">Process</div>
      <h2 class="font-display font-bold text-3xl md:text-4xl text-navy">How It Works</h2>
      <p class="text-navy/50 mt-3 max-w-md mx-auto">From consultation to savings in 4 simple steps</p>
    </div>
    <div class="grid md:grid-cols-4 gap-6 md:gap-4 relative">
      <!-- SVG Diagonal Connectors (desktop only) -->
      <svg class="absolute top-16 left-0 w-full h-8 hidden md:block" viewBox="0 0 1200 40" fill="none" preserveAspectRatio="none">
        <line x1="175" y1="35" x2="350" y2="5" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6 4" opacity="0.4"/>
        <line x1="475" y1="35" x2="650" y2="5" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="6 4" opacity="0.4"/>
        <line x1="775" y1="35" x2="950" y2="5" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6 4" opacity="0.4"/>
      </svg>
      <!-- Step 1 -->
      <div class="reveal text-center relative">
        <div class="w-20 h-20 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-5 relative" style="transform:rotate(-6deg)">
          <svg class="w-8 h-8 text-gold" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          <div class="absolute -top-2 -right-2 w-7 h-7 bg-gold text-white rounded-full flex items-center justify-center font-display font-bold text-xs">1</div>
        </div>
        <h3 class="font-display font-bold text-lg mb-2 text-navy">Consultation</h3>
        <p class="text-navy/50 text-sm">Free home assessment and custom system design tailored to your needs.</p>
      </div>
      <!-- Step 2 -->
      <div class="reveal text-center relative" style="transition-delay:0.15s">
        <div class="w-20 h-20 bg-sky/10 rounded-2xl flex items-center justify-center mx-auto mb-5 relative" style="transform:rotate(4deg)">
          <svg class="w-8 h-8 text-sky" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>
          <div class="absolute -top-2 -right-2 w-7 h-7 bg-sky text-white rounded-full flex items-center justify-center font-display font-bold text-xs">2</div>
        </div>
        <h3 class="font-display font-bold text-lg mb-2 text-navy">Design</h3>
        <p class="text-navy/50 text-sm">Engineering team creates your optimal panel layout with 3D modeling.</p>
      </div>
      <!-- Step 3 -->
      <div class="reveal text-center relative" style="transition-delay:0.3s">
        <div class="w-20 h-20 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-5 relative" style="transform:rotate(-3deg)">
          <svg class="w-8 h-8 text-gold" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <div class="absolute -top-2 -right-2 w-7 h-7 bg-gold text-white rounded-full flex items-center justify-center font-display font-bold text-xs">3</div>
        </div>
        <h3 class="font-display font-bold text-lg mb-2 text-navy">Install</h3>
        <p class="text-navy/50 text-sm">Professional installation completed in 1-3 days by certified technicians.</p>
      </div>
      <!-- Step 4 -->
      <div class="reveal text-center relative" style="transition-delay:0.45s">
        <div class="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5 relative" style="transform:rotate(5deg)">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <div class="absolute -top-2 -right-2 w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center font-display font-bold text-xs">4</div>
        </div>
        <h3 class="font-display font-bold text-lg mb-2 text-navy">Save</h3>
        <p class="text-navy/50 text-sm">Start saving from day one with net metering and energy credits.</p>
      </div>
    </div>
  </div>
</section>

<!-- Solar Panel Grid Signature Section -->
<section class="py-12 bg-gradient-to-r from-sky/5 via-white to-gold/5 overflow-hidden">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid grid-cols-8 md:grid-cols-16 gap-1.5 reveal">
      <div class="h-8 bg-sky/10 transform skew-x-12 rounded-sm col-span-2"></div>
      <div class="h-8 bg-sky/15 transform skew-x-12 rounded-sm"></div>
      <div class="h-8 bg-gold/10 transform skew-x-12 rounded-sm col-span-2"></div>
      <div class="h-8 bg-sky/8 transform skew-x-12 rounded-sm"></div>
      <div class="h-8 bg-sky/12 transform skew-x-12 rounded-sm col-span-2"></div>
      <div class="h-8 bg-sky/20 transform skew-x-12 rounded-sm col-span-2 hidden md:block"></div>
      <div class="h-8 bg-gold/8 transform skew-x-12 rounded-sm hidden md:block"></div>
      <div class="h-8 bg-sky/10 transform skew-x-12 rounded-sm hidden md:block"></div>
      <div class="h-8 bg-sky/15 transform skew-x-12 rounded-sm col-span-2 hidden md:block"></div>
      <div class="h-8 bg-gold/12 transform skew-x-12 rounded-sm hidden md:block"></div>
      <div class="h-8 bg-sky/8 transform skew-x-12 rounded-sm hidden lg:block"></div>
    </div>
    <div class="grid grid-cols-8 md:grid-cols-16 gap-1.5 mt-1.5 reveal" style="transition-delay:0.1s">
      <div class="h-8 bg-sky/8 transform skew-x-12 rounded-sm"></div>
      <div class="h-8 bg-sky/12 transform skew-x-12 rounded-sm col-span-2"></div>
      <div class="h-8 bg-gold/15 transform skew-x-12 rounded-sm"></div>
      <div class="h-8 bg-sky/10 transform skew-x-12 rounded-sm"></div>
      <div class="h-8 bg-sky/18 transform skew-x-12 rounded-sm col-span-2"></div>
      <div class="h-8 bg-gold/8 transform skew-x-12 rounded-sm"></div>
      <div class="h-8 bg-sky/12 transform skew-x-12 rounded-sm hidden md:block"></div>
      <div class="h-8 bg-sky/8 transform skew-x-12 rounded-sm col-span-2 hidden md:block"></div>
      <div class="h-8 bg-gold/10 transform skew-x-12 rounded-sm hidden md:block"></div>
      <div class="h-8 bg-sky/15 transform skew-x-12 rounded-sm hidden md:block"></div>
      <div class="h-8 bg-sky/10 transform skew-x-12 rounded-sm col-span-2 hidden md:block"></div>
      <div class="h-8 bg-gold/8 transform skew-x-12 rounded-sm hidden lg:block"></div>
    </div>
    <div class="grid grid-cols-8 md:grid-cols-16 gap-1.5 mt-1.5 reveal" style="transition-delay:0.2s">
      <div class="h-8 bg-gold/10 transform skew-x-12 rounded-sm col-span-2"></div>
      <div class="h-8 bg-sky/12 transform skew-x-12 rounded-sm"></div>
      <div class="h-8 bg-sky/8 transform skew-x-12 rounded-sm"></div>
      <div class="h-8 bg-sky/15 transform skew-x-12 rounded-sm col-span-2"></div>
      <div class="h-8 bg-gold/12 transform skew-x-12 rounded-sm"></div>
      <div class="h-8 bg-sky/10 transform skew-x-12 rounded-sm"></div>
      <div class="h-8 bg-sky/18 transform skew-x-12 rounded-sm col-span-2 hidden md:block"></div>
      <div class="h-8 bg-sky/8 transform skew-x-12 rounded-sm hidden md:block"></div>
      <div class="h-8 bg-gold/10 transform skew-x-12 rounded-sm col-span-2 hidden md:block"></div>
      <div class="h-8 bg-sky/12 transform skew-x-12 rounded-sm hidden md:block"></div>
      <div class="h-8 bg-sky/8 transform skew-x-12 rounded-sm hidden md:block"></div>
      <div class="h-8 bg-gold/8 transform skew-x-12 rounded-sm hidden lg:block"></div>
    </div>
  </div>
</section>

<!-- Benefits: Angled/Tilted Cards -->
<section id="solutions" class="angle-top bg-gradient-to-br from-navy via-navy-light to-navy py-24 text-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <div class="text-gold text-xs tracking-[0.25em] uppercase font-display font-bold mb-3">Benefits</div>
      <h2 class="font-display font-bold text-3xl md:text-4xl">Why Go Solar with SolarPeak</h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="tilt-card bg-white/5 border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 cursor-pointer hover:bg-white/10 reveal">
        <div class="w-16 h-16 bg-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gold" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>
        </div>
        <div class="font-display font-black text-3xl text-gold mb-1">30%</div>
        <h3 class="font-display font-bold mb-2">Tax Credit</h3>
        <p class="text-white/50 text-sm">Federal Investment Tax Credit covers 30% of your system cost.</p>
      </div>
      <div class="tilt-card bg-white/5 border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 cursor-pointer hover:bg-white/10 reveal" style="transition-delay:0.1s">
        <div class="w-16 h-16 bg-sky/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-sky" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="font-display font-black text-3xl text-sky mb-1">$0</div>
        <h3 class="font-display font-bold mb-2">Zero Down</h3>
        <p class="text-white/50 text-sm">Start with zero upfront cost. Multiple financing options available.</p>
      </div>
      <div class="tilt-card bg-white/5 border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 cursor-pointer hover:bg-white/10 reveal" style="transition-delay:0.2s">
        <div class="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </div>
        <div class="font-display font-black text-3xl text-green-400 mb-1">25yr</div>
        <h3 class="font-display font-bold mb-2">Warranty</h3>
        <p class="text-white/50 text-sm">Industry-leading 25-year warranty on panels and workmanship.</p>
      </div>
      <div class="tilt-card bg-white/5 border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 cursor-pointer hover:bg-white/10 reveal" style="transition-delay:0.3s">
        <div class="w-16 h-16 bg-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gold" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <div class="font-display font-black text-3xl text-gold mb-1">$0</div>
        <h3 class="font-display font-bold mb-2">Electric Bill</h3>
        <p class="text-white/50 text-sm">Many customers eliminate their electric bill entirely with net metering.</p>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials: Before/After Bills -->
<section class="py-24 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <div class="text-gold text-xs tracking-[0.25em] uppercase font-display font-bold mb-3">Testimonials</div>
      <h2 class="font-display font-bold text-3xl md:text-4xl text-navy">Real Savings, Real People</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Testimonial 1 -->
      <div class="reveal">
        <div class="bg-cream/50 rounded-2xl p-6 border border-gold/10 mb-4">
          <div class="flex gap-1 mb-3">
            <span class="text-gold text-sm">&#9733;</span><span class="text-gold text-sm">&#9733;</span><span class="text-gold text-sm">&#9733;</span><span class="text-gold text-sm">&#9733;</span><span class="text-gold text-sm">&#9733;</span>
          </div>
          <p class="text-navy/70 text-sm leading-relaxed mb-4">"Our electricity bill went from $280 to $12 per month. The installation was seamless and the team was incredibly professional."</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center font-display font-bold text-gold text-sm">JM</div>
            <div>
              <div class="font-display font-bold text-sm text-navy">James Mitchell</div>
              <div class="text-xs text-navy/40">Phoenix, AZ</div>
            </div>
          </div>
        </div>
        <!-- Before/After Bill -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bill-card border-red-400 bg-red-50 rounded-lg p-3">
            <div class="text-[10px] text-red-400 font-bold mb-1">BEFORE</div>
            <div class="font-display font-bold text-xl text-red-500">$280</div>
            <div class="text-[10px] text-navy/30">/month</div>
          </div>
          <div class="bill-card border-green-500 bg-green-50 rounded-lg p-3">
            <div class="text-[10px] text-green-500 font-bold mb-1">AFTER</div>
            <div class="font-display font-bold text-xl text-green-600">$12</div>
            <div class="text-[10px] text-navy/30">/month</div>
          </div>
        </div>
      </div>
      <!-- Testimonial 2 -->
      <div class="reveal" style="transition-delay:0.15s">
        <div class="bg-sky/5 rounded-2xl p-6 border border-sky/10 mb-4">
          <div class="flex gap-1 mb-3">
            <span class="text-gold text-sm">&#9733;</span><span class="text-gold text-sm">&#9733;</span><span class="text-gold text-sm">&#9733;</span><span class="text-gold text-sm">&#9733;</span><span class="text-gold text-sm">&#9733;</span>
          </div>
          <p class="text-navy/70 text-sm leading-relaxed mb-4">"The 30% tax credit made it a no-brainer. We're now producing more energy than we use and getting credits from the utility company."</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-sky/20 rounded-full flex items-center justify-center font-display font-bold text-sky text-sm">SR</div>
            <div>
              <div class="font-display font-bold text-sm text-navy">Sarah Rodriguez</div>
              <div class="text-xs text-navy/40">Austin, TX</div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="bill-card border-red-400 bg-red-50 rounded-lg p-3">
            <div class="text-[10px] text-red-400 font-bold mb-1">BEFORE</div>
            <div class="font-display font-bold text-xl text-red-500">$340</div>
            <div class="text-[10px] text-navy/30">/month</div>
          </div>
          <div class="bill-card border-green-500 bg-green-50 rounded-lg p-3">
            <div class="text-[10px] text-green-500 font-bold mb-1">AFTER</div>
            <div class="font-display font-bold text-xl text-green-600">-$8</div>
            <div class="text-[10px] text-navy/30">credit!</div>
          </div>
        </div>
      </div>
      <!-- Testimonial 3 -->
      <div class="reveal" style="transition-delay:0.3s">
        <div class="bg-cream/50 rounded-2xl p-6 border border-gold/10 mb-4">
          <div class="flex gap-1 mb-3">
            <span class="text-gold text-sm">&#9733;</span><span class="text-gold text-sm">&#9733;</span><span class="text-gold text-sm">&#9733;</span><span class="text-gold text-sm">&#9733;</span><span class="text-navy/20 text-sm">&#9733;</span>
          </div>
          <p class="text-navy/70 text-sm leading-relaxed mb-4">"Best investment we've made for our home. The system paid for itself in under 5 years, and now it's pure savings."</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center font-display font-bold text-gold text-sm">DK</div>
            <div>
              <div class="font-display font-bold text-sm text-navy">David Kim</div>
              <div class="text-xs text-navy/40">San Diego, CA</div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="bill-card border-red-400 bg-red-50 rounded-lg p-3">
            <div class="text-[10px] text-red-400 font-bold mb-1">BEFORE</div>
            <div class="font-display font-bold text-xl text-red-500">$195</div>
            <div class="text-[10px] text-navy/30">/month</div>
          </div>
          <div class="bill-card border-green-500 bg-green-50 rounded-lg p-3">
            <div class="text-[10px] text-green-500 font-bold mb-1">AFTER</div>
            <div class="font-display font-bold text-xl text-green-600">$22</div>
            <div class="text-[10px] text-navy/30">/month</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA: Start Saving Today with Zip Code -->
<section id="contact" class="angle-top bg-gradient-to-br from-gold via-gold-dark to-gold py-24 relative overflow-hidden">
  <!-- Background sunburst -->
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
    <svg class="sunburst" width="600" height="600" viewBox="0 0 600 600" fill="none">
      <circle cx="300" cy="300" r="80" fill="#fff"/>
      <g stroke="#fff" stroke-width="2" opacity="0.6">
        <line x1="300" y1="20" x2="300" y2="200"/>
        <line x1="300" y1="400" x2="300" y2="580"/>
        <line x1="20" y1="300" x2="200" y2="300"/>
        <line x1="400" y1="300" x2="580" y2="300"/>
        <line x1="102" y1="102" x2="220" y2="220"/>
        <line x1="380" y1="380" x2="498" y2="498"/>
        <line x1="498" y1="102" x2="380" y2="220"/>
        <line x1="102" y1="498" x2="220" y2="380"/>
      </g>
      <g stroke="#fff" stroke-width="1" opacity="0.3">
        <line x1="155" y1="60" x2="240" y2="200"/>
        <line x1="360" y1="400" x2="445" y2="540"/>
        <line x1="60" y1="155" x2="200" y2="240"/>
        <line x1="400" y1="360" x2="540" y2="445"/>
        <line x1="445" y1="60" x2="360" y2="200"/>
        <line x1="240" y1="400" x2="155" y2="540"/>
        <line x1="540" y1="155" x2="400" y2="240"/>
        <line x1="60" y1="445" x2="200" y2="360"/>
      </g>
    </svg>
  </div>
  <div class="max-w-3xl mx-auto px-6 text-center relative z-10">
    <div class="reveal">
      <h2 class="font-display font-black text-4xl md:text-5xl text-white mb-4">Start Saving Today</h2>
      <p class="text-white/80 text-lg mb-10 max-w-lg mx-auto">Enter your zip code for an instant estimate. No commitment, no pressure &mdash; just numbers.</p>
      <div class="bg-white rounded-2xl p-3 flex flex-col sm:flex-row gap-3 shadow-2xl max-w-lg mx-auto">
        <input type="text" id="zipInput" placeholder="Enter your zip code" maxlength="5" class="flex-1 px-6 py-4 text-navy font-display font-bold text-lg rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 placeholder:text-navy/30" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
        <button onclick="handleZipSubmit()" class="bg-navy text-white px-8 py-4 rounded-xl font-display font-bold hover:bg-navy-light transition-colors cursor-pointer whitespace-nowrap">
          Get Instant Quote &rarr;
        </button>
      </div>
      <div class="flex items-center justify-center gap-6 mt-8 text-white/70 text-sm">
        <span class="flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          Free Assessment
        </span>
        <span class="flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          No Obligation
        </span>
        <span class="flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          2-Min Result
        </span>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-navy text-white py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid md:grid-cols-4 gap-10 mb-12">
      <div>
        <div class="flex items-center gap-2.5 mb-4">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="10" fill="#f59e0b"/>
            <g stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="1" x2="18" y2="6"/>
              <line x1="18" y1="30" x2="18" y2="35"/>
              <line x1="1" y1="18" x2="6" y2="18"/>
              <line x1="30" y1="18" x2="35" y2="18"/>
              <line x1="5.9" y1="5.9" x2="9.4" y2="9.4"/>
              <line x1="26.6" y1="26.6" x2="30.1" y2="30.1"/>
              <line x1="5.9" y1="30.1" x2="9.4" y2="26.6"/>
              <line x1="26.6" y1="9.4" x2="30.1" y2="5.9"/>
            </g>
          </svg>
          <span class="font-display font-bold text-lg">Solar<span class="text-gold">Peak</span></span>
        </div>
        <p class="text-white/40 text-sm leading-relaxed">Making solar energy accessible, affordable, and beautiful since 2015.</p>
      </div>
      <div>
        <h4 class="font-display font-bold text-sm mb-4">Service Areas</h4>
        <ul class="space-y-2 text-sm text-white/40">
          <li class="hover:text-gold transition-colors cursor-pointer">California</li>
          <li class="hover:text-gold transition-colors cursor-pointer">Arizona</li>
          <li class="hover:text-gold transition-colors cursor-pointer">Texas</li>
          <li class="hover:text-gold transition-colors cursor-pointer">Florida</li>
          <li class="hover:text-gold transition-colors cursor-pointer">Nevada</li>
        </ul>
      </div>
      <div>
        <h4 class="font-display font-bold text-sm mb-4">Certifications</h4>
        <div class="space-y-2">
          <div class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 inline-block mr-2">NABCEP Certified</div>
          <div class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 inline-block mr-2">Tesla Powerwall</div>
          <div class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 inline-block mr-2">SunPower Elite</div>
          <div class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 inline-block mr-2">BBB A+ Rated</div>
          <div class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 inline-block">EnergyStar</div>
        </div>
      </div>
      <div>
        <h4 class="font-display font-bold text-sm mb-4">Financing Partners</h4>
        <div class="space-y-2">
          <div class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 inline-block mr-2">Mosaic</div>
          <div class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 inline-block mr-2">GoodLeap</div>
          <div class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 inline-block mr-2">Sunlight Financial</div>
          <div class="bg-gold/10 border border-gold/20 rounded-lg px-3 py-2 text-xs text-gold inline-block">0% APR Available</div>
        </div>
      </div>
    </div>
    <div class="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-white/30 text-xs">&copy; 2026 SolarPeak Energy Inc. All rights reserved. License #1098234</p>
      <div class="flex gap-6 text-xs text-white/30">
        <a href="#" class="hover:text-gold transition-colors cursor-pointer">Privacy</a>
        <a href="#" class="hover:text-gold transition-colors cursor-pointer">Terms</a>
        <a href="#" class="hover:text-gold transition-colors cursor-pointer">Sitemap</a>
      </div>
    </div>
  </div>
</footer>

<!-- Quote Modal -->
<div id="quoteModal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
    <div class="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-bl-full"></div>
    <div class="flex items-center justify-between mb-6 relative">
      <div>
        <h3 class="font-display font-bold text-xl text-navy">Get Your Free Quote</h3>
        <p class="text-navy/40 text-sm">We'll respond within 24 hours</p>
      </div>
      <button onclick="document.getElementById('quoteModal').classList.add('hidden')" class="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 cursor-pointer transition-colors">&times;</button>
    </div>
    <div class="space-y-4 relative">
      <div class="grid grid-cols-2 gap-3">
        <input type="text" placeholder="First Name" class="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 font-body">
        <input type="text" placeholder="Last Name" class="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 font-body">
      </div>
      <input type="email" placeholder="Email Address" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 font-body">
      <input type="tel" placeholder="Phone Number" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 font-body">
      <input type="text" placeholder="Street Address" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 font-body">
      <select class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy/40 focus:outline-none focus:border-gold cursor-pointer font-body">
        <option>What best describes you?</option>
        <option>Homeowner</option>
        <option>Business Owner</option>
        <option>Property Manager</option>
        <option>Just Exploring</option>
      </select>
      <div class="flex items-center gap-2 text-xs text-navy/40 bg-cream rounded-xl px-4 py-3">
        <svg class="w-4 h-4 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
        Your information is secure and never shared with third parties.
      </div>
      <button onclick="document.getElementById('quoteModal').classList.add('hidden');showToast('Quote request received! Our solar expert will contact you within 24 hours.')" class="w-full btn-gold text-white py-4 rounded-xl font-display font-bold cursor-pointer">
        Request Free Quote &rarr;
      </button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 bg-navy text-white px-6 py-4 rounded-xl shadow-2xl z-[70] translate-y-24 opacity-0 transition-all duration-500 text-sm font-medium max-w-sm flex items-center gap-3">
  <svg class="w-5 h-5 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
  <span id="toastText"></span>
</div>

<script>
// Toast
function showToast(msg){
  const t=document.getElementById('toast');
  document.getElementById('toastText').textContent=msg;
  t.classList.remove('translate-y-24','opacity-0');
  setTimeout(()=>t.classList.add('translate-y-24','opacity-0'),4000);
}

// Zip code submit
function handleZipSubmit(){
  const zip=document.getElementById('zipInput').value;
  if(zip.length===5){
    document.getElementById('quoteModal').classList.remove('hidden');
  }else{
    showToast('Please enter a valid 5-digit zip code');
  }
}

// Savings Calculator
function updateCalc(){
  const roof=parseInt(document.getElementById('roofSlider').value);
  const loc=parseFloat(document.getElementById('locationSelect').value);
  document.getElementById('roofValue').textContent=roof.toLocaleString();

  const kw=Math.max(3,Math.round((roof/200)*loc*10)/10);
  const monthlySave=Math.round(kw*18*loc);
  const annualSave=monthlySave*12;
  const systemCost=Math.round(kw*2800);
  const afterCredit=Math.round(systemCost*0.7);
  const payback=(afterCredit/(annualSave)).toFixed(1);
  const total25=annualSave*25;
  const credit=Math.round(systemCost*0.3);

  document.getElementById('calcSize').textContent=kw+' kW';
  document.getElementById('calcMonthly').textContent='$'+monthlySave.toLocaleString();
  document.getElementById('calcAnnual').textContent='$'+annualSave.toLocaleString();
  document.getElementById('calcPayback').textContent=payback+' yrs';
  document.getElementById('calc25y').textContent='$'+total25.toLocaleString();
  document.getElementById('calcCredit').textContent='-$'+credit.toLocaleString();

  // Update hero preview
  document.getElementById('heroSavings').textContent='$'+annualSave.toLocaleString();
}

// Counter animation
function animateCounter(el,target,prefix,suffix){
  prefix=prefix||'';suffix=suffix||'';
  let current=0;
  const step=Math.max(1,Math.ceil(target/50));
  const timer=setInterval(()=>{
    current+=step;
    if(current>=target){current=target;clearInterval(timer)}
    el.textContent=prefix+current.toLocaleString()+suffix;
  },30);
}

// Scroll reveal observer
const revealObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
},{threshold:0.1,rootMargin:'0px 0px -40px 0px'});

document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el=>revealObs.observe(el));

// Initialize
updateCalc();

// Smooth nav scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    const target=document.querySelector(a.getAttribute('href'));
    if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
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
