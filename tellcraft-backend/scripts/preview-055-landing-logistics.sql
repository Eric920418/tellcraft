INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'b36ad469-eaa8-40c1-8665-142980f889f3',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SwiftShip Logistics</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{industrial:'#1e40af',warn:'#ea580c',metal:'#71717a','metal-light':'#a1a1aa','metal-dark':'#52525b',surface:'#f4f4f5',complete:'#16a34a','pending-gray':'#d4d4d8'},fontFamily:{display:['Barlow','sans-serif'],body:['Inter','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif}
h1,h2,h3,h4,h5,h6,.font-display{font-family:'Barlow',sans-serif}
html{scroll-behavior:smooth}
.reveal{opacity:0;transform:translateY(24px);transition:all 0.6s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}

/* Dashed route animation */
@keyframes dash-move{
  to{stroke-dashoffset:-40}
}
.route-line{animation:dash-move 1.5s linear infinite}

/* Truck drive animation */
@keyframes truck-drive{
  0%{offset-distance:0%}
  100%{offset-distance:100%}
}

/* Pulse for current stage */
@keyframes stage-pulse{
  0%,100%{box-shadow:0 0 0 0 rgba(30,64,175,0.4)}
  50%{box-shadow:0 0 0 10px rgba(30,64,175,0)}
}
.pulse-stage{animation:stage-pulse 2s ease-in-out infinite}

/* Metal texture overlay */
.metal-texture{background:linear-gradient(135deg,#fafafa 0%,#e4e4e7 25%,#f4f4f5 50%,#e4e4e7 75%,#fafafa 100%)}

/* Industrial stripe accent */
.industrial-stripe{background:repeating-linear-gradient(45deg,#ea580c,#ea580c 2px,transparent 2px,transparent 12px)}

.tracking-input:focus{outline:none;border-color:#1e40af;box-shadow:0 0 0 3px rgba(30,64,175,0.15)}
</style>
</head>
<body class="bg-white text-zinc-800 overflow-x-hidden">

<!-- Nav -->
<nav class="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-zinc-200">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <div class="flex items-center gap-2.5">
      <div class="w-9 h-9 bg-industrial rounded-lg flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12h15l3-8h4l-1 8h-2l-1 5H5l-1-5H1z"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></svg>
      </div>
      <span class="font-display font-bold text-xl tracking-tight">Swift<span class="text-industrial">Ship</span></span>
    </div>
    <div class="hidden md:flex items-center gap-7 text-sm font-medium text-metal-dark">
      <a href="#services" class="hover:text-industrial transition-colors cursor-pointer">Services</a>
      <a href="#tracking" class="hover:text-industrial transition-colors cursor-pointer">Track</a>
      <a href="#fleet" class="hover:text-industrial transition-colors cursor-pointer">Fleet</a>
      <a href="#quote" class="hover:text-industrial transition-colors cursor-pointer">Contact</a>
    </div>
    <div class="flex items-center gap-3">
      <div class="hidden lg:flex items-center gap-2 border border-zinc-200 rounded-lg px-3 py-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" placeholder="Tracking #" class="text-xs w-28 bg-transparent outline-none text-metal-dark placeholder:text-metal-light font-body">
      </div>
      <button onclick="document.getElementById('quoteSection').scrollIntoView({behavior:'smooth'})" class="bg-industrial text-white px-5 py-2 rounded-lg text-sm font-display font-semibold hover:bg-blue-800 transition-colors cursor-pointer">Get a Quote</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="pt-24 pb-16 lg:pb-20 bg-zinc-50 relative overflow-hidden">
  <!-- Subtle industrial texture bg -->
  <div class="absolute inset-0 opacity-[0.03]" style="background-image:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><rect width=%2260%22 height=%2260%22 fill=%22none%22/><path d=%22M0 30h60M30 0v60%22 stroke=%22%2371717a%22 stroke-width=%220.5%22/></svg>')"></div>
  <div class="max-w-7xl mx-auto px-6 relative z-10">
    <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <!-- Left: Text -->
      <div class="reveal">
        <div class="inline-flex items-center gap-2 bg-industrial/10 text-industrial text-xs font-display font-semibold px-3 py-1.5 rounded-full mb-5 tracking-wide uppercase">
          <span class="w-1.5 h-1.5 bg-warn rounded-full"></span>
          Global Logistics Solutions
        </div>
        <h1 class="font-display font-extrabold text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] mb-5 text-zinc-900">
          Delivering<br>Excellence<br><span class="text-industrial">Worldwide</span>
        </h1>
        <p class="text-metal text-base leading-relaxed mb-8 max-w-md font-body">
          From warehouse to doorstep, SwiftShip provides reliable, trackable, and efficient shipping solutions for businesses of every size.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 mb-4">
          <div class="flex-1 flex gap-2">
            <input type="text" id="heroTrackInput" placeholder="Enter tracking number" class="tracking-input flex-1 border border-zinc-300 rounded-lg px-4 py-3 text-sm font-body bg-white">
            <button onclick="showTracking()" class="bg-zinc-800 text-white px-4 py-3 rounded-lg text-sm font-display font-semibold hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap">Track Shipment</button>
          </div>
        </div>
        <button onclick="document.getElementById('quoteSection').scrollIntoView({behavior:'smooth'})" class="bg-industrial text-white px-8 py-3.5 rounded-lg text-sm font-display font-bold hover:bg-blue-800 transition-colors cursor-pointer shadow-lg shadow-industrial/20">
          Ship Now &rarr;
        </button>
      </div>

      <!-- Right: Dashed route line SVG -->
      <div class="reveal relative">
        <div class="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-display font-semibold text-metal-dark uppercase tracking-wider">Live Route</span>
            <span class="flex items-center gap-1.5 text-xs font-display font-semibold text-complete"><span class="w-1.5 h-1.5 bg-complete rounded-full" style="animation:stage-pulse 2s infinite"></span>Active</span>
          </div>
          <svg viewBox="0 0 480 280" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full">
            <!-- Route path - dashed line -->
            <path id="routePath" d="M40 240 C40 240, 80 200, 120 180 C160 160, 180 100, 240 80 C300 60, 340 120, 380 100 C420 80, 440 50, 450 40" stroke="#1e40af" stroke-width="3" stroke-dasharray="12 8" fill="none" class="route-line"/>
            <!-- Static background path for visual depth -->
            <path d="M40 240 C40 240, 80 200, 120 180 C160 160, 180 100, 240 80 C300 60, 340 120, 380 100 C420 80, 440 50, 450 40" stroke="#e4e4e7" stroke-width="3" fill="none"/>
            <!-- Dashed animated overlay -->
            <path d="M40 240 C40 240, 80 200, 120 180 C160 160, 180 100, 240 80 C300 60, 340 120, 380 100 C420 80, 440 50, 450 40" stroke="#1e40af" stroke-width="3" stroke-dasharray="12 8" fill="none" class="route-line"/>
            <!-- Point A -->
            <circle cx="40" cy="240" r="8" fill="#1e40af"/>
            <circle cx="40" cy="240" r="4" fill="white"/>
            <text x="40" y="264" text-anchor="middle" font-family="Barlow" font-weight="600" font-size="11" fill="#52525b">Origin</text>
            <!-- Waypoints -->
            <circle cx="160" cy="160" r="5" fill="#16a34a"/>
            <text x="160" y="150" text-anchor="middle" font-family="Barlow" font-size="9" fill="#71717a">Sorted</text>
            <circle cx="300" cy="90" r="5" fill="#16a34a"/>
            <text x="300" y="80" text-anchor="middle" font-family="Barlow" font-size="9" fill="#71717a">In Transit</text>
            <!-- Point B -->
            <circle cx="450" cy="40" r="8" fill="#ea580c"/>
            <circle cx="450" cy="40" r="4" fill="white"/>
            <text x="450" y="64" text-anchor="middle" font-family="Barlow" font-weight="600" font-size="11" fill="#52525b">Destination</text>
            <!-- Truck icon on the route (positioned at ~60%) -->
            <g transform="translate(340, 106)">
              <rect x="-16" y="-10" width="32" height="20" rx="3" fill="#1e40af"/>
              <rect x="-22" y="-6" width="8" height="16" rx="2" fill="#1e3a8a"/>
              <rect x="-14" y="-7" width="20" height="11" rx="1" fill="#93c5fd" opacity="0.5"/>
              <circle cx="-12" cy="12" r="3.5" fill="#52525b"/>
              <circle cx="-12" cy="12" r="1.5" fill="#d4d4d8"/>
              <circle cx="10" cy="12" r="3.5" fill="#52525b"/>
              <circle cx="10" cy="12" r="1.5" fill="#d4d4d8"/>
            </g>
          </svg>
          <div class="flex items-center justify-between mt-3 px-2 text-xs text-metal">
            <span class="font-body">Shanghai, CN</span>
            <span class="font-display font-semibold text-industrial">ETA: 2 days</span>
            <span class="font-body">Los Angeles, US</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Tracking Timeline (SIGNATURE) -->
<section id="tracking" class="py-16 lg:py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-12 reveal">
      <span class="text-xs font-display font-semibold text-warn uppercase tracking-widest">Real-Time Tracking</span>
      <h2 class="font-display font-bold text-3xl md:text-4xl mt-2 text-zinc-900">Shipment Timeline</h2>
      <p class="text-metal text-sm mt-3 max-w-lg mx-auto font-body">Track every step of your package's journey from pickup to delivery.</p>
    </div>

    <!-- Horizontal Timeline -->
    <div class="reveal overflow-x-auto pb-4">
      <div class="flex items-start min-w-[700px] relative px-4">
        <!-- Connecting dashed line -->
        <div class="absolute top-[28px] left-[60px] right-[60px] h-0.5 border-t-2 border-dashed border-zinc-300"></div>
        <div class="absolute top-[28px] left-[60px] h-0.5 border-t-2 border-dashed border-complete" style="width:55%"></div>

        <!-- Stage 1: Pickup (complete) -->
        <div class="flex-1 flex flex-col items-center text-center relative z-10 group cursor-pointer" onmouseenter="showStageDetail(0)" onmouseleave="hideStageDetail(0)">
          <div class="w-14 h-14 rounded-full bg-complete flex items-center justify-center mb-3 shadow-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span class="font-display font-bold text-sm text-zinc-900">Pickup</span>
          <span class="text-[11px] text-metal mt-0.5 font-body">Feb 20, 9:15 AM</span>
          <div id="stage-detail-0" class="hidden absolute top-20 bg-zinc-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap font-body shadow-lg">Package collected from warehouse</div>
        </div>

        <!-- Stage 2: Processing (complete) -->
        <div class="flex-1 flex flex-col items-center text-center relative z-10 group cursor-pointer" onmouseenter="showStageDetail(1)" onmouseleave="hideStageDetail(1)">
          <div class="w-14 h-14 rounded-full bg-complete flex items-center justify-center mb-3 shadow-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span class="font-display font-bold text-sm text-zinc-900">Processing</span>
          <span class="text-[11px] text-metal mt-0.5 font-body">Feb 20, 2:30 PM</span>
          <div id="stage-detail-1" class="hidden absolute top-20 bg-zinc-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap font-body shadow-lg">Sorted & scanned at hub</div>
        </div>

        <!-- Stage 3: In Transit (current - blue pulsing) -->
        <div class="flex-1 flex flex-col items-center text-center relative z-10 group cursor-pointer" onmouseenter="showStageDetail(2)" onmouseleave="hideStageDetail(2)">
          <div class="w-14 h-14 rounded-full bg-industrial flex items-center justify-center mb-3 pulse-stage">
            <!-- Truck SVG icon -->
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 5v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <span class="font-display font-bold text-sm text-industrial">In Transit</span>
          <span class="text-[11px] text-industrial mt-0.5 font-display font-semibold">Currently here</span>
          <div id="stage-detail-2" class="hidden absolute top-20 bg-industrial text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap font-body shadow-lg">On the road - Interstate 10 West</div>
        </div>

        <!-- Stage 4: Out for Delivery (pending) -->
        <div class="flex-1 flex flex-col items-center text-center relative z-10 group cursor-pointer" onmouseenter="showStageDetail(3)" onmouseleave="hideStageDetail(3)">
          <div class="w-14 h-14 rounded-full bg-pending-gray flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <span class="font-display font-bold text-sm text-metal-light">Out for Delivery</span>
          <span class="text-[11px] text-metal-light mt-0.5 font-body">Pending</span>
          <div id="stage-detail-3" class="hidden absolute top-20 bg-zinc-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap font-body shadow-lg">Estimated: Feb 22, 10 AM</div>
        </div>

        <!-- Stage 5: Delivered (pending) -->
        <div class="flex-1 flex flex-col items-center text-center relative z-10 group cursor-pointer" onmouseenter="showStageDetail(4)" onmouseleave="hideStageDetail(4)">
          <div class="w-14 h-14 rounded-full bg-pending-gray flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
          <span class="font-display font-bold text-sm text-metal-light">Delivered</span>
          <span class="text-[11px] text-metal-light mt-0.5 font-body">Pending</span>
          <div id="stage-detail-4" class="hidden absolute top-20 bg-zinc-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap font-body shadow-lg">Estimated: Feb 22, 12 PM</div>
        </div>
      </div>
    </div>

    <!-- Tracking Input -->
    <div class="reveal mt-8 max-w-lg mx-auto">
      <div class="flex gap-2">
        <input type="text" id="trackInputMain" placeholder="Enter your tracking number (e.g., SS-20260220-0001)" class="tracking-input flex-1 border border-zinc-300 rounded-lg px-4 py-3 text-sm font-body bg-white">
        <button onclick="showTracking()" class="bg-industrial text-white px-6 py-3 rounded-lg text-sm font-display font-bold hover:bg-blue-800 transition-colors cursor-pointer">Track</button>
      </div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-16 lg:py-20 bg-zinc-50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-12 reveal">
      <span class="text-xs font-display font-semibold text-industrial uppercase tracking-widest">Our Services</span>
      <h2 class="font-display font-bold text-3xl md:text-4xl mt-2 text-zinc-900">Shipping Solutions</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-0 reveal">
      <!-- Express Shipping -->
      <div class="border border-zinc-200 bg-white p-8 group hover:bg-industrial hover:text-white transition-all duration-300 cursor-pointer relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-warn opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="flex items-center gap-3 mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-warn group-hover:text-white transition-colors"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <h3 class="font-display font-bold text-xl">Express Shipping</h3>
        </div>
        <p class="text-metal text-sm leading-relaxed font-body group-hover:text-white/80 transition-colors mb-4">Next-day and same-day delivery for urgent shipments. Priority handling from pickup to final mile.</p>
        <div class="flex items-center justify-between text-xs text-metal group-hover:text-white/60 transition-colors font-body border-t border-zinc-100 group-hover:border-white/20 pt-4">
          <span>Up to 500 mi</span>
          <span class="font-display font-semibold text-warn group-hover:text-white">12-24 hrs</span>
        </div>
      </div>

      <!-- Freight -->
      <div class="border border-zinc-200 bg-white p-8 group hover:bg-industrial hover:text-white transition-all duration-300 cursor-pointer border-l-0 border-r-0 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-warn opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="flex items-center gap-3 mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-industrial group-hover:text-white transition-colors"><rect x="1" y="6" width="22" height="12" rx="2"/><path d="M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/><line x1="12" y1="10" x2="12" y2="14"/></svg>
          <h3 class="font-display font-bold text-xl">Freight</h3>
        </div>
        <p class="text-metal text-sm leading-relaxed font-body group-hover:text-white/80 transition-colors mb-4">Full truckload and LTL solutions for heavy cargo. Temperature-controlled and hazmat options available.</p>
        <div class="flex items-center justify-between text-xs text-metal group-hover:text-white/60 transition-colors font-body border-t border-zinc-100 group-hover:border-white/20 pt-4">
          <span>Nationwide</span>
          <span class="font-display font-semibold text-industrial group-hover:text-white">2-5 days</span>
        </div>
      </div>

      <!-- Warehousing -->
      <div class="border border-zinc-200 bg-white p-8 group hover:bg-industrial hover:text-white transition-all duration-300 cursor-pointer relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-warn opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="flex items-center gap-3 mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-metal-dark group-hover:text-white transition-colors"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <h3 class="font-display font-bold text-xl">Warehousing</h3>
        </div>
        <p class="text-metal text-sm leading-relaxed font-body group-hover:text-white/80 transition-colors mb-4">Strategically located fulfillment centers with real-time WMS inventory management. Pick, pack & ship.</p>
        <div class="flex items-center justify-between text-xs text-metal group-hover:text-white/60 transition-colors font-body border-t border-zinc-100 group-hover:border-white/20 pt-4">
          <span>12 Locations</span>
          <span class="font-display font-semibold text-metal-dark group-hover:text-white">100K+ SKUs</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Fleet -->
<section id="fleet" class="py-16 lg:py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-12 reveal">
      <span class="text-xs font-display font-semibold text-metal uppercase tracking-widest">Our Fleet</span>
      <h2 class="font-display font-bold text-3xl md:text-4xl mt-2 text-zinc-900">Vehicle Types</h2>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 reveal">
      <!-- Truck -->
      <div class="border border-zinc-200 rounded-xl p-6 text-center hover:border-industrial hover:shadow-lg transition-all cursor-pointer group">
        <div class="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
            <rect x="2" y="10" width="38" height="24" rx="3" fill="#e4e4e7" class="group-hover:fill-blue-100 transition-colors"/>
            <rect x="40" y="18" width="16" height="16" rx="2" fill="#d4d4d8" class="group-hover:fill-blue-200 transition-colors"/>
            <rect x="44" y="20" width="10" height="8" rx="1" fill="#93c5fd" opacity="0.6"/>
            <circle cx="14" cy="38" r="5" fill="#52525b"/><circle cx="14" cy="38" r="2" fill="#d4d4d8"/>
            <circle cx="48" cy="38" r="5" fill="#52525b"/><circle cx="48" cy="38" r="2" fill="#d4d4d8"/>
          </svg>
        </div>
        <h3 class="font-display font-bold text-base text-zinc-900">Truck</h3>
        <p class="text-xs text-metal mt-1 font-body">26ft Box / Flatbed</p>
        <span class="inline-block mt-2 text-[10px] font-display font-semibold text-industrial bg-industrial/10 px-2 py-0.5 rounded-full">Up to 26,000 lbs</span>
      </div>

      <!-- Van -->
      <div class="border border-zinc-200 rounded-xl p-6 text-center hover:border-industrial hover:shadow-lg transition-all cursor-pointer group">
        <div class="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
            <rect x="4" y="14" width="50" height="22" rx="4" fill="#e4e4e7" class="group-hover:fill-blue-100 transition-colors"/>
            <path d="M50 14h4a6 6 0 0 1 6 6v10H50V14z" fill="#d4d4d8" class="group-hover:fill-blue-200 transition-colors"/>
            <rect x="52" y="18" width="6" height="6" rx="1" fill="#93c5fd" opacity="0.6"/>
            <circle cx="16" cy="38" r="5" fill="#52525b"/><circle cx="16" cy="38" r="2" fill="#d4d4d8"/>
            <circle cx="50" cy="38" r="5" fill="#52525b"/><circle cx="50" cy="38" r="2" fill="#d4d4d8"/>
          </svg>
        </div>
        <h3 class="font-display font-bold text-base text-zinc-900">Van</h3>
        <p class="text-xs text-metal mt-1 font-body">Sprinter / Cargo Van</p>
        <span class="inline-block mt-2 text-[10px] font-display font-semibold text-complete bg-complete/10 px-2 py-0.5 rounded-full">Last Mile</span>
      </div>

      <!-- Container -->
      <div class="border border-zinc-200 rounded-xl p-6 text-center hover:border-industrial hover:shadow-lg transition-all cursor-pointer group">
        <div class="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
            <rect x="2" y="8" width="60" height="30" rx="2" fill="#e4e4e7" class="group-hover:fill-blue-100 transition-colors"/>
            <rect x="6" y="12" width="10" height="22" rx="1" fill="#d4d4d8"/><rect x="18" y="12" width="10" height="22" rx="1" fill="#d4d4d8"/>
            <rect x="30" y="12" width="10" height="22" rx="1" fill="#d4d4d8"/><rect x="42" y="12" width="10" height="22" rx="1" fill="#d4d4d8"/>
            <rect x="56" y="16" width="4" height="14" rx="1" fill="#1e40af" opacity="0.3"/>
            <line x1="2" y1="40" x2="62" y2="40" stroke="#52525b" stroke-width="2"/>
          </svg>
        </div>
        <h3 class="font-display font-bold text-base text-zinc-900">Container</h3>
        <p class="text-xs text-metal mt-1 font-body">20ft / 40ft ISO</p>
        <span class="inline-block mt-2 text-[10px] font-display font-semibold text-warn bg-warn/10 px-2 py-0.5 rounded-full">International</span>
      </div>

      <!-- Air Cargo -->
      <div class="border border-zinc-200 rounded-xl p-6 text-center hover:border-industrial hover:shadow-lg transition-all cursor-pointer group">
        <div class="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
            <ellipse cx="32" cy="26" rx="28" ry="8" fill="#e4e4e7" class="group-hover:fill-blue-100 transition-colors"/>
            <path d="M10 26 L32 8 L54 26" fill="#d4d4d8" class="group-hover:fill-blue-200 transition-colors"/>
            <path d="M8 26 L2 20 L14 24" fill="#a1a1aa"/>
            <path d="M56 26 L62 20 L50 24" fill="#a1a1aa"/>
            <path d="M26 28 L20 40 L36 28" fill="#a1a1aa"/>
            <circle cx="32" cy="14" r="4" fill="#93c5fd" opacity="0.6"/>
          </svg>
        </div>
        <h3 class="font-display font-bold text-base text-zinc-900">Air Cargo</h3>
        <p class="text-xs text-metal mt-1 font-body">ULD / Charter</p>
        <span class="inline-block mt-2 text-[10px] font-display font-semibold text-industrial bg-industrial/10 px-2 py-0.5 rounded-full">Express Global</span>
      </div>
    </div>
  </div>
</section>

<!-- Stats Strip -->
<section class="py-0">
  <div class="bg-industrial">
    <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/20">
      <div class="py-8 px-6 text-center reveal">
        <div class="font-display font-extrabold text-3xl text-white mb-1">50M+</div>
        <div class="text-xs text-white/60 font-body">Packages Delivered</div>
      </div>
      <div class="py-8 px-6 text-center reveal" style="transition-delay:0.08s">
        <div class="font-display font-extrabold text-3xl text-white mb-1">98.5%</div>
        <div class="text-xs text-white/60 font-body">On-Time Rate</div>
      </div>
      <div class="py-8 px-6 text-center reveal" style="transition-delay:0.16s">
        <div class="font-display font-extrabold text-3xl text-white mb-1">120</div>
        <div class="text-xs text-white/60 font-body">Countries Served</div>
      </div>
      <div class="py-8 px-6 text-center reveal" style="transition-delay:0.24s">
        <div class="font-display font-extrabold text-3xl text-white mb-1">24/7</div>
        <div class="text-xs text-white/60 font-body">Live Support</div>
      </div>
    </div>
  </div>
  <!-- Orange industrial stripe -->
  <div class="industrial-stripe h-1.5"></div>
</section>

<!-- CTA: Quote Calculator -->
<section id="quoteSection" class="py-16 lg:py-20 bg-zinc-50">
  <div class="max-w-4xl mx-auto px-6">
    <div class="text-center mb-10 reveal">
      <span class="text-xs font-display font-semibold text-warn uppercase tracking-widest">Get Started</span>
      <h2 class="font-display font-bold text-3xl md:text-4xl mt-2 text-zinc-900">Request a Quote</h2>
      <p class="text-metal text-sm mt-3 font-body">Tell us about your shipment and get an instant estimate.</p>
    </div>
    <div class="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm reveal">
      <div class="grid md:grid-cols-2 gap-5">
        <div>
          <label class="block text-xs font-display font-semibold text-metal-dark mb-1.5 uppercase tracking-wider">Origin City</label>
          <input type="text" placeholder="e.g., New York, NY" class="tracking-input w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm font-body">
        </div>
        <div>
          <label class="block text-xs font-display font-semibold text-metal-dark mb-1.5 uppercase tracking-wider">Destination City</label>
          <input type="text" placeholder="e.g., Los Angeles, CA" class="tracking-input w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm font-body">
        </div>
        <div>
          <label class="block text-xs font-display font-semibold text-metal-dark mb-1.5 uppercase tracking-wider">Weight (lbs)</label>
          <input type="number" placeholder="500" class="tracking-input w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm font-body">
        </div>
        <div>
          <label class="block text-xs font-display font-semibold text-metal-dark mb-1.5 uppercase tracking-wider">Dimensions (L x W x H in.)</label>
          <div class="flex gap-2">
            <input type="number" placeholder="48" class="tracking-input w-full border border-zinc-300 rounded-lg px-3 py-3 text-sm font-body">
            <input type="number" placeholder="40" class="tracking-input w-full border border-zinc-300 rounded-lg px-3 py-3 text-sm font-body">
            <input type="number" placeholder="36" class="tracking-input w-full border border-zinc-300 rounded-lg px-3 py-3 text-sm font-body">
          </div>
        </div>
      </div>
      <div class="mt-5 grid md:grid-cols-2 gap-5">
        <div>
          <label class="block text-xs font-display font-semibold text-metal-dark mb-1.5 uppercase tracking-wider">Service Type</label>
          <select class="tracking-input w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm font-body cursor-pointer text-metal-dark">
            <option>Express Shipping (12-24 hrs)</option>
            <option>Standard Freight (2-5 days)</option>
            <option>Economy (5-10 days)</option>
            <option>Air Cargo (1-3 days)</option>
          </select>
        </div>
        <div class="flex items-end">
          <button onclick="showToast('Quote request submitted! Our team will contact you within 1 hour.')" class="w-full bg-industrial text-white py-3 rounded-lg font-display font-bold text-sm hover:bg-blue-800 transition-colors cursor-pointer shadow-lg shadow-industrial/20">
            Get Instant Quote &rarr;
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-zinc-900 text-white pt-14 pb-8">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-4 gap-10 mb-10">
      <!-- Brand & Map placeholder -->
      <div class="md:col-span-2">
        <div class="flex items-center gap-2.5 mb-4">
          <div class="w-8 h-8 bg-industrial rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M1 12h15l3-8h4l-1 8h-2l-1 5H5l-1-5H1z"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></svg>
          </div>
          <span class="font-display font-bold text-lg">SwiftShip</span>
        </div>
        <p class="text-zinc-400 text-sm font-body leading-relaxed mb-4 max-w-xs">Reliable logistics solutions connecting businesses across 120 countries with industry-leading on-time delivery rates.</p>
        <!-- Service areas map placeholder -->
        <div class="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
          <div class="flex items-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span class="text-xs font-display font-semibold text-zinc-400 uppercase tracking-wider">Service Areas</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-[10px] text-zinc-500 font-body">
            <span>North America</span><span>Europe</span><span>East Asia</span>
            <span>Southeast Asia</span><span>Middle East</span><span>Oceania</span>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div>
        <h4 class="font-display font-bold text-sm mb-4 uppercase tracking-wider text-zinc-300">Company</h4>
        <ul class="space-y-2.5 text-sm text-zinc-400 font-body">
          <li><a href="#" class="hover:text-white transition-colors cursor-pointer">About Us</a></li>
          <li><a href="#" class="hover:text-white transition-colors cursor-pointer">Careers</a></li>
          <li><a href="#" class="hover:text-white transition-colors cursor-pointer">Press</a></li>
          <li><a href="#" class="hover:text-white transition-colors cursor-pointer">Sustainability</a></li>
        </ul>
      </div>

      <!-- Partners & Certifications -->
      <div>
        <h4 class="font-display font-bold text-sm mb-4 uppercase tracking-wider text-zinc-300">Certifications</h4>
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-xs text-zinc-400 font-body">
            <div class="w-8 h-8 bg-zinc-800 rounded border border-zinc-700 flex items-center justify-center text-[10px] font-display font-bold text-zinc-500">ISO</div>
            <span>ISO 9001:2015</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-zinc-400 font-body">
            <div class="w-8 h-8 bg-zinc-800 rounded border border-zinc-700 flex items-center justify-center text-[10px] font-display font-bold text-zinc-500">C-TPAT</div>
            <span>C-TPAT Certified</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-zinc-400 font-body">
            <div class="w-8 h-8 bg-zinc-800 rounded border border-zinc-700 flex items-center justify-center text-[10px] font-display font-bold text-zinc-500">AEO</div>
            <span>AEO Authorized</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-zinc-400 font-body">
            <div class="w-8 h-8 bg-zinc-800 rounded border border-zinc-700 flex items-center justify-center text-[10px] font-display font-bold text-complete">IATA</div>
            <span>IATA Member</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Partners row -->
    <div class="border-t border-zinc-800 pt-6 mb-6">
      <p class="text-[10px] text-zinc-600 font-display uppercase tracking-widest mb-3 text-center">Trusted Partners</p>
      <div class="flex justify-center gap-8">
        <span class="text-zinc-600 text-xs font-display font-bold">FedEx</span>
        <span class="text-zinc-600 text-xs font-display font-bold">Maersk</span>
        <span class="text-zinc-600 text-xs font-display font-bold">DHL</span>
        <span class="text-zinc-600 text-xs font-display font-bold">UPS</span>
        <span class="text-zinc-600 text-xs font-display font-bold">CMA CGM</span>
      </div>
    </div>

    <div class="border-t border-zinc-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
      <p class="text-zinc-500 text-xs font-body">&copy; 2026 SwiftShip Logistics Inc. All rights reserved.</p>
      <div class="flex gap-4 text-zinc-500 text-xs font-body">
        <a href="#" class="hover:text-white transition-colors cursor-pointer">Privacy</a>
        <a href="#" class="hover:text-white transition-colors cursor-pointer">Terms</a>
        <a href="#" class="hover:text-white transition-colors cursor-pointer">Cookie Policy</a>
      </div>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 bg-zinc-800 text-white px-6 py-3.5 rounded-xl shadow-2xl z-[60] translate-y-20 opacity-0 transition-all duration-500 text-sm font-display font-medium border border-zinc-700"></div>

<script>
// Toast
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.remove('translate-y-20','opacity-0');
  setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3500);
}

// Tracking demo
function showTracking(){
  showToast('Tracking SS-20260220-0001: In Transit - Interstate 10 West, ETA Feb 22');
}

// Stage detail hover
function showStageDetail(i){document.getElementById('stage-detail-'+i).classList.remove('hidden')}
function hideStageDetail(i){document.getElementById('stage-detail-'+i).classList.add('hidden')}

// Scroll reveal
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}
  });
},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'});
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
