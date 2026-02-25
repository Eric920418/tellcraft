INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '53a393f4-e62a-458e-b296-dd6219317e74',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>City Marathon 2024</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        stadium: { 900:'#111827', 800:'#1f2937', 700:'#374151' },
        board: { red:'#ef4444', redDark:'#b91c1c' },
        field: { green:'#166534', greenLight:'#22c55e' },
        gold: '#eab308',
        goldDark: '#a16207'
      },
      fontFamily: {
        scoreboard: ['Orbitron', 'monospace'],
        body: ['Inter', 'sans-serif']
      }
    }
  }
}
</script>
<style>
body { font-family: 'Inter', sans-serif; background: #111827; color: #e5e7eb; }
.font-scoreboard { font-family: 'Orbitron', monospace; }

/* LED dot matrix effect */
.led-number {
  font-family: 'Orbitron', monospace;
  text-shadow:
    0 0 8px rgba(239,68,68,0.9),
    0 0 20px rgba(239,68,68,0.5),
    0 0 40px rgba(239,68,68,0.3);
  color: #ef4444;
  position: relative;
}
.led-number-gold {
  font-family: 'Orbitron', monospace;
  text-shadow:
    0 0 8px rgba(234,179,8,0.9),
    0 0 20px rgba(234,179,8,0.5),
    0 0 40px rgba(234,179,8,0.3);
  color: #eab308;
}
.led-number-green {
  font-family: 'Orbitron', monospace;
  text-shadow:
    0 0 8px rgba(34,197,94,0.9),
    0 0 20px rgba(34,197,94,0.5),
    0 0 40px rgba(34,197,94,0.3);
  color: #22c55e;
}

/* Scoreboard panel */
.scoreboard-panel {
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
  border: 2px solid #333;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.5);
}

/* LED digit segment style */
.led-segment {
  background: #0a0a0a;
  border-radius: 4px;
  padding: 8px 14px;
  border: 1px solid #222;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.6);
}

/* Dot matrix texture overlay */
.dot-matrix {
  position: relative;
}
.dot-matrix::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 4px 4px;
  pointer-events: none;
  border-radius: inherit;
}

/* Field stripe pattern */
.field-stripes {
  background: repeating-linear-gradient(
    90deg,
    #166534 0px,
    #166534 60px,
    #15803d 60px,
    #15803d 120px
  );
}

/* Glow pulse for countdown */
.countdown-pulse {
  animation: countPulse 2s ease-in-out infinite;
}
@keyframes countPulse {
  0%, 100% { text-shadow: 0 0 8px rgba(239,68,68,0.9), 0 0 20px rgba(239,68,68,0.5); }
  50% { text-shadow: 0 0 12px rgba(239,68,68,1), 0 0 30px rgba(239,68,68,0.7), 0 0 60px rgba(239,68,68,0.4); }
}

/* Category card hover */
.category-card {
  transition: all 0.3s ease;
  border: 1px solid #333;
}
.category-card:hover {
  border-color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(239,68,68,0.15);
}

/* Sponsor strip */
.sponsor-logo {
  filter: grayscale(1) brightness(0.6);
  transition: filter 0.3s;
}
.sponsor-logo:hover {
  filter: grayscale(0) brightness(1);
}

/* Form input */
.form-input {
  background: #1f2937;
  border: 1px solid #374151;
  color: #e5e7eb;
  transition: border-color 0.2s;
}
.form-input:focus {
  outline: none;
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239,68,68,0.2);
}

/* FAQ accordion */
.faq-item { border-bottom: 1px solid #1f2937; }
.faq-item:last-child { border-bottom: none; }
</style>
</head>
<body>

<!-- Navigation -->
<nav class="sticky top-0 z-50 bg-stadium-900/95 backdrop-blur-md border-b border-white/5">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded bg-board-red flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      </div>
      <span class="font-scoreboard text-sm font-bold tracking-widest text-white">CITY<span class="text-board-red">RUN</span></span>
    </div>
    <div class="flex items-center gap-6 text-sm text-gray-400">
      <a class="hover:text-white transition cursor-pointer">Race Info</a>
      <a class="hover:text-white transition cursor-pointer">Course</a>
      <a class="hover:text-white transition cursor-pointer">Results</a>
      <a class="hover:text-white transition cursor-pointer">FAQ</a>
      <button class="bg-board-red hover:bg-board-redDark text-white px-4 py-1.5 rounded text-sm font-semibold transition font-scoreboard tracking-wide text-xs">REGISTER</button>
    </div>
  </div>
</nav>

<!-- Hero with Scoreboard Countdown -->
<section class="relative overflow-hidden py-20">
  <div class="absolute inset-0 bg-gradient-to-b from-field-green/10 via-transparent to-transparent"></div>
  <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-board-red to-transparent opacity-60"></div>
  <div class="max-w-5xl mx-auto px-6 relative text-center">
    <div class="inline-flex items-center gap-2 mb-6">
      <span class="w-2 h-2 rounded-full bg-field-greenLight animate-pulse"></span>
      <span class="font-scoreboard text-xs tracking-[0.3em] text-field-greenLight uppercase">Registration Open</span>
    </div>
    <h1 class="font-scoreboard text-5xl md:text-6xl font-black tracking-tight text-white mb-3">CITY MARATHON</h1>
    <p class="font-scoreboard text-xl text-gold tracking-[0.2em] mb-10">2024</p>

    <!-- LED Countdown Scoreboard -->
    <div class="scoreboard-panel dot-matrix rounded-xl p-8 max-w-2xl mx-auto mb-10">
      <p class="font-scoreboard text-[10px] tracking-[0.3em] text-gray-500 uppercase mb-4">Race Day Countdown</p>
      <div class="flex items-center justify-center gap-3 md:gap-5">
        <div class="text-center">
          <div class="led-segment">
            <span class="led-number countdown-pulse text-4xl md:text-5xl font-black">42</span>
          </div>
          <span class="font-scoreboard text-[9px] tracking-[0.2em] text-gray-500 mt-2 block uppercase">Days</span>
        </div>
        <span class="led-number text-3xl font-bold mt-[-20px]">:</span>
        <div class="text-center">
          <div class="led-segment">
            <span class="led-number countdown-pulse text-4xl md:text-5xl font-black">08</span>
          </div>
          <span class="font-scoreboard text-[9px] tracking-[0.2em] text-gray-500 mt-2 block uppercase">Hours</span>
        </div>
        <span class="led-number text-3xl font-bold mt-[-20px]">:</span>
        <div class="text-center">
          <div class="led-segment">
            <span class="led-number countdown-pulse text-4xl md:text-5xl font-black">35</span>
          </div>
          <span class="font-scoreboard text-[9px] tracking-[0.2em] text-gray-500 mt-2 block uppercase">Mins</span>
        </div>
        <span class="led-number text-3xl font-bold mt-[-20px]">:</span>
        <div class="text-center">
          <div class="led-segment">
            <span class="led-number countdown-pulse text-4xl md:text-5xl font-black">17</span>
          </div>
          <span class="font-scoreboard text-[9px] tracking-[0.2em] text-gray-500 mt-2 block uppercase">Secs</span>
        </div>
      </div>
    </div>

    <!-- Race Stats Scoreboard -->
    <div class="scoreboard-panel dot-matrix rounded-lg p-5 max-w-xl mx-auto">
      <div class="flex items-center justify-center divide-x divide-gray-700">
        <div class="px-6 text-center">
          <div class="led-number-gold text-2xl font-black">5,000</div>
          <div class="font-scoreboard text-[9px] tracking-[0.2em] text-gray-500 mt-1 uppercase">Runners</div>
        </div>
        <div class="px-6 text-center">
          <div class="led-number-gold text-2xl font-black">42.2</div>
          <div class="font-scoreboard text-[9px] tracking-[0.2em] text-gray-500 mt-1 uppercase">KM</div>
        </div>
        <div class="px-6 text-center">
          <div class="led-number-gold text-2xl font-black">3</div>
          <div class="font-scoreboard text-[9px] tracking-[0.2em] text-gray-500 mt-1 uppercase">Categories</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Course Map -->
<section class="max-w-5xl mx-auto px-6 pb-16">
  <div class="flex items-center gap-3 mb-6">
    <div class="w-1 h-6 bg-field-greenLight rounded-full"></div>
    <h2 class="font-scoreboard text-xl font-bold tracking-wide text-white">COURSE MAP</h2>
  </div>
  <div class="scoreboard-panel dot-matrix rounded-xl p-6 relative overflow-hidden">
    <svg viewBox="0 0 800 300" class="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background grid -->
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f2937" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="800" height="300" fill="url(#grid)"/>
      <!-- Route path -->
      <path d="M 60 250 Q 60 180 120 150 Q 200 100 300 120 Q 380 135 420 80 Q 460 25 540 50 Q 620 75 660 130 Q 700 185 740 150 L 740 150" stroke="#22c55e" stroke-width="3" stroke-dasharray="8 4" opacity="0.8"/>
      <path d="M 60 250 Q 60 180 120 150 Q 200 100 300 120 Q 380 135 420 80 Q 460 25 540 50 Q 620 75 660 130 Q 700 185 740 150" stroke="#22c55e" stroke-width="1.5" opacity="0.3"/>
      <!-- Start marker -->
      <circle cx="60" cy="250" r="8" fill="#ef4444" stroke="#fff" stroke-width="2"/>
      <text x="60" y="278" text-anchor="middle" fill="#ef4444" font-family="Orbitron" font-size="9" font-weight="700">START</text>
      <!-- KM markers -->
      <circle cx="200" cy="110" r="4" fill="#eab308"/>
      <text x="200" y="98" text-anchor="middle" fill="#eab308" font-family="Orbitron" font-size="8">10K</text>
      <circle cx="380" cy="125" r="4" fill="#eab308"/>
      <text x="380" y="113" text-anchor="middle" fill="#eab308" font-family="Orbitron" font-size="8">21K</text>
      <circle cx="540" cy="48" r="4" fill="#eab308"/>
      <text x="540" y="36" text-anchor="middle" fill="#eab308" font-family="Orbitron" font-size="8">30K</text>
      <!-- Water stations -->
      <rect x="145" y="128" width="14" height="14" rx="2" fill="#3b82f6" opacity="0.7"/>
      <text x="152" y="139" text-anchor="middle" fill="white" font-size="8">W</text>
      <rect x="325" y="118" width="14" height="14" rx="2" fill="#3b82f6" opacity="0.7"/>
      <text x="332" y="129" text-anchor="middle" fill="white" font-size="8">W</text>
      <rect x="480" y="42" width="14" height="14" rx="2" fill="#3b82f6" opacity="0.7"/>
      <text x="487" y="53" text-anchor="middle" fill="white" font-size="8">W</text>
      <rect x="650" y="120" width="14" height="14" rx="2" fill="#3b82f6" opacity="0.7"/>
      <text x="657" y="131" text-anchor="middle" fill="white" font-size="8">W</text>
      <!-- Finish marker -->
      <rect x="730" y="138" width="20" height="24" fill="none" stroke="white" stroke-width="2">
        <animate attributeName="stroke-opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
      </rect>
      <line x1="730" y1="138" x2="750" y2="138" stroke="white" stroke-width="2"/>
      <line x1="730" y1="144" x2="750" y2="144" stroke="white" stroke-width="2"/>
      <line x1="730" y1="150" x2="750" y2="150" stroke="white" stroke-width="2"/>
      <line x1="730" y1="156" x2="750" y2="156" stroke="white" stroke-width="2"/>
      <text x="740" y="178" text-anchor="middle" fill="#22c55e" font-family="Orbitron" font-size="9" font-weight="700">FINISH</text>
      <!-- Legend -->
      <circle cx="40" cy="20" r="3" fill="#3b82f6"/>
      <text x="50" y="24" fill="#9ca3af" font-family="Inter" font-size="9">Water Station</text>
      <circle cx="160" cy="20" r="3" fill="#eab308"/>
      <text x="170" y="24" fill="#9ca3af" font-family="Inter" font-size="9">KM Marker</text>
    </svg>
    <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-700/50">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 text-xs text-gray-400"><span class="w-3 h-0.5 bg-field-greenLight rounded inline-block"></span>Full Marathon (42.2 km)</div>
        <div class="flex items-center gap-2 text-xs text-gray-400"><span class="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>4 Water Stations</div>
      </div>
      <span class="font-scoreboard text-[10px] text-gray-500 tracking-wider">ELEVATION: +180m / -180m</span>
    </div>
  </div>
</section>

<!-- Race Categories -->
<section class="max-w-5xl mx-auto px-6 pb-16">
  <div class="flex items-center gap-3 mb-6">
    <div class="w-1 h-6 bg-board-red rounded-full"></div>
    <h2 class="font-scoreboard text-xl font-bold tracking-wide text-white">RACE CATEGORIES</h2>
  </div>
  <div class="grid md:grid-cols-3 gap-5">
    <!-- Full Marathon -->
    <div class="category-card scoreboard-panel dot-matrix rounded-xl p-6 relative overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-0.5 bg-board-red"></div>
      <div class="flex items-center justify-between mb-4">
        <span class="font-scoreboard text-[10px] tracking-[0.2em] text-board-red uppercase">Full Marathon</span>
        <span class="text-[10px] bg-board-red/20 text-board-red px-2 py-0.5 rounded font-semibold">72% FILLED</span>
      </div>
      <div class="led-number text-4xl font-black mb-1">42.2<span class="text-lg ml-1">KM</span></div>
      <p class="text-sm text-gray-400 mb-4 leading-relaxed">The ultimate challenge. Certified AIMS course through the city's iconic landmarks.</p>
      <div class="space-y-2 mb-5">
        <div class="flex justify-between text-xs"><span class="text-gray-500">Cut-off Time</span><span class="font-scoreboard text-gray-300">6:00:00</span></div>
        <div class="flex justify-between text-xs"><span class="text-gray-500">Min. Age</span><span class="font-scoreboard text-gray-300">18+</span></div>
        <div class="flex justify-between text-xs"><span class="text-gray-500">Slots</span><span class="font-scoreboard text-gray-300">2,000</span></div>
      </div>
      <!-- Capacity bar -->
      <div class="w-full h-1.5 bg-gray-800 rounded-full mb-4">
        <div class="h-full bg-board-red rounded-full" style="width:72%"></div>
      </div>
      <div class="flex items-end justify-between">
        <div>
          <span class="font-scoreboard text-[10px] text-gray-500 line-through block">$120</span>
          <span class="led-number-gold text-xl font-black">$89</span>
          <span class="text-[10px] text-gray-500 ml-1">early bird</span>
        </div>
        <button class="bg-board-red hover:bg-board-redDark text-white px-4 py-2 rounded font-scoreboard text-xs tracking-wider transition">REGISTER</button>
      </div>
    </div>

    <!-- Half Marathon -->
    <div class="category-card scoreboard-panel dot-matrix rounded-xl p-6 relative overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-0.5 bg-gold"></div>
      <div class="flex items-center justify-between mb-4">
        <span class="font-scoreboard text-[10px] tracking-[0.2em] text-gold uppercase">Half Marathon</span>
        <span class="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded font-semibold">55% FILLED</span>
      </div>
      <div class="led-number-gold text-4xl font-black mb-1">21.1<span class="text-lg ml-1">KM</span></div>
      <p class="text-sm text-gray-400 mb-4 leading-relaxed">The perfect middle distance. Fast, scenic, and achievable for trained runners.</p>
      <div class="space-y-2 mb-5">
        <div class="flex justify-between text-xs"><span class="text-gray-500">Cut-off Time</span><span class="font-scoreboard text-gray-300">3:30:00</span></div>
        <div class="flex justify-between text-xs"><span class="text-gray-500">Min. Age</span><span class="font-scoreboard text-gray-300">16+</span></div>
        <div class="flex justify-between text-xs"><span class="text-gray-500">Slots</span><span class="font-scoreboard text-gray-300">2,000</span></div>
      </div>
      <div class="w-full h-1.5 bg-gray-800 rounded-full mb-4">
        <div class="h-full bg-gold rounded-full" style="width:55%"></div>
      </div>
      <div class="flex items-end justify-between">
        <div>
          <span class="font-scoreboard text-[10px] text-gray-500 line-through block">$80</span>
          <span class="led-number-gold text-xl font-black">$59</span>
          <span class="text-[10px] text-gray-500 ml-1">early bird</span>
        </div>
        <button class="bg-gold hover:bg-goldDark text-stadium-900 px-4 py-2 rounded font-scoreboard text-xs tracking-wider font-bold transition">REGISTER</button>
      </div>
    </div>

    <!-- 10K Fun Run -->
    <div class="category-card scoreboard-panel dot-matrix rounded-xl p-6 relative overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-0.5 bg-field-greenLight"></div>
      <div class="flex items-center justify-between mb-4">
        <span class="font-scoreboard text-[10px] tracking-[0.2em] text-field-greenLight uppercase">10K Fun Run</span>
        <span class="text-[10px] bg-field-greenLight/20 text-field-greenLight px-2 py-0.5 rounded font-semibold">38% FILLED</span>
      </div>
      <div class="led-number-green text-4xl font-black mb-1">10<span class="text-lg ml-1">KM</span></div>
      <p class="text-sm text-gray-400 mb-4 leading-relaxed">Fun for everyone. Family-friendly course with entertainment along the route.</p>
      <div class="space-y-2 mb-5">
        <div class="flex justify-between text-xs"><span class="text-gray-500">Cut-off Time</span><span class="font-scoreboard text-gray-300">1:30:00</span></div>
        <div class="flex justify-between text-xs"><span class="text-gray-500">Min. Age</span><span class="font-scoreboard text-gray-300">12+</span></div>
        <div class="flex justify-between text-xs"><span class="text-gray-500">Slots</span><span class="font-scoreboard text-gray-300">1,000</span></div>
      </div>
      <div class="w-full h-1.5 bg-gray-800 rounded-full mb-4">
        <div class="h-full bg-field-greenLight rounded-full" style="width:38%"></div>
      </div>
      <div class="flex items-end justify-between">
        <div>
          <span class="font-scoreboard text-[10px] text-gray-500 line-through block">$45</span>
          <span class="led-number-green text-xl font-black">$29</span>
          <span class="text-[10px] text-gray-500 ml-1">early bird</span>
        </div>
        <button class="bg-field-greenLight hover:bg-field-green text-white px-4 py-2 rounded font-scoreboard text-xs tracking-wider font-bold transition">REGISTER</button>
      </div>
    </div>
  </div>
</section>

<!-- Past Results -->
<section class="max-w-5xl mx-auto px-6 pb-16">
  <div class="flex items-center gap-3 mb-6">
    <div class="w-1 h-6 bg-gold rounded-full"></div>
    <h2 class="font-scoreboard text-xl font-bold tracking-wide text-white">PAST RESULTS</h2>
  </div>
  <div class="grid md:grid-cols-3 gap-5">
    <!-- 2023 -->
    <div class="scoreboard-panel dot-matrix rounded-xl overflow-hidden">
      <div class="bg-gradient-to-r from-board-red/20 to-transparent px-5 py-3 border-b border-gray-800">
        <span class="font-scoreboard text-sm font-bold text-board-red">2023</span>
        <span class="text-xs text-gray-500 ml-2">3rd Edition</span>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs text-gold">&#9733;</span>
            <span class="text-xs text-gray-400">Full Marathon Winner</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-white">James Kariuki</span>
            <span class="led-number text-lg font-black">2:18:42</span>
          </div>
        </div>
        <div class="border-t border-gray-800 pt-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs text-gold">&#9733;</span>
            <span class="text-xs text-gray-400">Half Marathon Winner</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-white">Sarah Chen</span>
            <span class="led-number-gold text-lg font-black">1:12:05</span>
          </div>
        </div>
        <div class="border-t border-gray-800 pt-3">
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>Total Finishers</span>
            <span class="font-scoreboard text-gray-300">4,312</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2022 -->
    <div class="scoreboard-panel dot-matrix rounded-xl overflow-hidden">
      <div class="bg-gradient-to-r from-board-red/20 to-transparent px-5 py-3 border-b border-gray-800">
        <span class="font-scoreboard text-sm font-bold text-board-red">2022</span>
        <span class="text-xs text-gray-500 ml-2">2nd Edition</span>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs text-gold">&#9733;</span>
            <span class="text-xs text-gray-400">Full Marathon Winner</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-white">Daniel Wanjiru</span>
            <span class="led-number text-lg font-black">2:21:17</span>
          </div>
        </div>
        <div class="border-t border-gray-800 pt-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs text-gold">&#9733;</span>
            <span class="text-xs text-gray-400">Half Marathon Winner</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-white">Emily Tanaka</span>
            <span class="led-number-gold text-lg font-black">1:14:33</span>
          </div>
        </div>
        <div class="border-t border-gray-800 pt-3">
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>Total Finishers</span>
            <span class="font-scoreboard text-gray-300">3,876</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2021 -->
    <div class="scoreboard-panel dot-matrix rounded-xl overflow-hidden">
      <div class="bg-gradient-to-r from-board-red/20 to-transparent px-5 py-3 border-b border-gray-800">
        <span class="font-scoreboard text-sm font-bold text-board-red">2021</span>
        <span class="text-xs text-gray-500 ml-2">Inaugural</span>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs text-gold">&#9733;</span>
            <span class="text-xs text-gray-400">Full Marathon Winner</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-white">Kofi Asante</span>
            <span class="led-number text-lg font-black">2:24:08</span>
          </div>
        </div>
        <div class="border-t border-gray-800 pt-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs text-gold">&#9733;</span>
            <span class="text-xs text-gray-400">Half Marathon Winner</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-white">Maria Silva</span>
            <span class="led-number-gold text-lg font-black">1:16:51</span>
          </div>
        </div>
        <div class="border-t border-gray-800 pt-3">
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>Total Finishers</span>
            <span class="font-scoreboard text-gray-300">2,540</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Registration Form -->
<section class="relative py-16">
  <div class="absolute inset-0 field-stripes opacity-[0.03]"></div>
  <div class="max-w-2xl mx-auto px-6 relative">
    <div class="text-center mb-8">
      <div class="flex items-center justify-center gap-3 mb-3">
        <div class="w-1 h-6 bg-board-red rounded-full"></div>
        <h2 class="font-scoreboard text-xl font-bold tracking-wide text-white">REGISTRATION</h2>
        <div class="w-1 h-6 bg-board-red rounded-full"></div>
      </div>
      <p class="text-sm text-gray-400">Early bird pricing ends March 15, 2024</p>
    </div>
    <div class="scoreboard-panel dot-matrix rounded-xl p-8">
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="font-scoreboard text-[10px] tracking-wider text-gray-400 block mb-1.5 uppercase">First Name</label>
          <input type="text" class="form-input w-full px-3 py-2.5 rounded text-sm" placeholder="John">
        </div>
        <div>
          <label class="font-scoreboard text-[10px] tracking-wider text-gray-400 block mb-1.5 uppercase">Last Name</label>
          <input type="text" class="form-input w-full px-3 py-2.5 rounded text-sm" placeholder="Doe">
        </div>
      </div>
      <div class="mb-4">
        <label class="font-scoreboard text-[10px] tracking-wider text-gray-400 block mb-1.5 uppercase">Email</label>
        <input type="email" class="form-input w-full px-3 py-2.5 rounded text-sm" placeholder="john@example.com">
      </div>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="font-scoreboard text-[10px] tracking-wider text-gray-400 block mb-1.5 uppercase">Date of Birth</label>
          <input type="date" class="form-input w-full px-3 py-2.5 rounded text-sm">
        </div>
        <div>
          <label class="font-scoreboard text-[10px] tracking-wider text-gray-400 block mb-1.5 uppercase">Gender</label>
          <select class="form-input w-full px-3 py-2.5 rounded text-sm">
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Non-binary</option>
          </select>
        </div>
      </div>
      <div class="mb-4">
        <label class="font-scoreboard text-[10px] tracking-wider text-gray-400 block mb-1.5 uppercase">Race Category</label>
        <select class="form-input w-full px-3 py-2.5 rounded text-sm">
          <option value="">Select category</option>
          <option>Full Marathon (42.2 KM) - $89</option>
          <option>Half Marathon (21.1 KM) - $59</option>
          <option>10K Fun Run - $29</option>
        </select>
      </div>
      <div class="mb-4">
        <label class="font-scoreboard text-[10px] tracking-wider text-gray-400 block mb-1.5 uppercase">T-shirt Size</label>
        <div class="flex gap-2">
          <button class="form-input px-4 py-2 rounded text-sm hover:border-board-red transition">XS</button>
          <button class="form-input px-4 py-2 rounded text-sm hover:border-board-red transition">S</button>
          <button class="form-input px-4 py-2 rounded text-sm border-board-red bg-board-red/10 text-board-red">M</button>
          <button class="form-input px-4 py-2 rounded text-sm hover:border-board-red transition">L</button>
          <button class="form-input px-4 py-2 rounded text-sm hover:border-board-red transition">XL</button>
          <button class="form-input px-4 py-2 rounded text-sm hover:border-board-red transition">XXL</button>
        </div>
      </div>
      <div class="mb-6">
        <label class="flex items-start gap-2 text-xs text-gray-400 cursor-pointer">
          <input type="checkbox" class="mt-0.5 accent-board-red">
          <span>I agree to the race rules, waiver, and <a class="text-board-red hover:underline">terms of participation</a>.</span>
        </label>
      </div>
      <button class="w-full bg-board-red hover:bg-board-redDark text-white py-3 rounded font-scoreboard text-sm tracking-widest font-bold transition">REGISTER NOW</button>
    </div>
  </div>
</section>

<!-- Sponsors -->
<section class="border-t border-white/5 py-12">
  <div class="max-w-5xl mx-auto px-6">
    <p class="font-scoreboard text-[10px] tracking-[0.3em] text-gray-500 text-center mb-8 uppercase">Official Partners & Sponsors</p>
    <div class="flex items-center justify-center gap-10 flex-wrap">
      <div class="sponsor-logo flex flex-col items-center gap-1 cursor-pointer">
        <div class="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <span class="text-[9px] text-gray-600 font-scoreboard tracking-wider">POWERCO</span>
      </div>
      <div class="sponsor-logo flex flex-col items-center gap-1 cursor-pointer">
        <div class="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>
        </div>
        <span class="text-[9px] text-gray-600 font-scoreboard tracking-wider">VITAHEALTH</span>
      </div>
      <div class="sponsor-logo flex flex-col items-center gap-1 cursor-pointer">
        <div class="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <span class="text-[9px] text-gray-600 font-scoreboard tracking-wider">STRATECH</span>
      </div>
      <div class="sponsor-logo flex flex-col items-center gap-1 cursor-pointer">
        <div class="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>
        </div>
        <span class="text-[9px] text-gray-600 font-scoreboard tracking-wider">FITZONE</span>
      </div>
      <div class="sponsor-logo flex flex-col items-center gap-1 cursor-pointer">
        <div class="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>
        </div>
        <span class="text-[9px] text-gray-600 font-scoreboard tracking-wider">MEDIAPRO</span>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="max-w-3xl mx-auto px-6 pb-16 pt-4">
  <div class="flex items-center gap-3 mb-6">
    <div class="w-1 h-6 bg-field-greenLight rounded-full"></div>
    <h2 class="font-scoreboard text-xl font-bold tracking-wide text-white">FAQ</h2>
  </div>
  <div class="scoreboard-panel rounded-xl overflow-hidden">
    <div class="faq-item p-5">
      <div class="flex items-center justify-between cursor-pointer">
        <span class="text-sm font-medium text-white">What is the race day schedule?</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <p class="text-sm text-gray-400 mt-3 leading-relaxed">Full Marathon starts at 5:30 AM, Half Marathon at 6:00 AM, and 10K Fun Run at 7:00 AM. All runners must be at the starting pen 30 minutes before gun time.</p>
    </div>
    <div class="faq-item p-5">
      <div class="flex items-center justify-between cursor-pointer">
        <span class="text-sm font-medium text-white">Is there a bag deposit service?</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
    </div>
    <div class="faq-item p-5">
      <div class="flex items-center justify-between cursor-pointer">
        <span class="text-sm font-medium text-white">Can I transfer my registration to someone else?</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
    </div>
    <div class="faq-item p-5">
      <div class="flex items-center justify-between cursor-pointer">
        <span class="text-sm font-medium text-white">What happens if it rains on race day?</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
    </div>
    <div class="faq-item p-5">
      <div class="flex items-center justify-between cursor-pointer">
        <span class="text-sm font-medium text-white">Are there pace groups available?</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
    </div>
    <div class="faq-item p-5">
      <div class="flex items-center justify-between cursor-pointer">
        <span class="text-sm font-medium text-white">Will there be medal and finisher t-shirt?</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-white/5 py-10">
  <div class="max-w-5xl mx-auto px-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-7 h-7 rounded bg-board-red flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <span class="font-scoreboard text-sm font-bold tracking-widest text-white">CITY<span class="text-board-red">RUN</span></span>
      </div>
      <div class="flex items-center gap-4">
        <a class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#9ca3af"><path d="M24 4.557a9.83 9.83 0 01-2.828.775 4.932 4.932 0 002.165-2.724 9.864 9.864 0 01-3.127 1.195 4.916 4.916 0 00-8.38 4.482A13.944 13.944 0 011.671 3.149a4.916 4.916 0 001.523 6.574 4.897 4.897 0 01-2.229-.616v.061a4.916 4.916 0 003.946 4.827 4.996 4.996 0 01-2.224.084 4.917 4.917 0 004.6 3.417A9.867 9.867 0 010 19.54a13.94 13.94 0 007.548 2.212c9.057 0 14.01-7.503 14.01-14.01 0-.213-.005-.425-.014-.636A10.012 10.012 0 0024 4.557z"/></svg>
        </a>
        <a class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#9ca3af"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5" fill="#111827"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
        </a>
        <a class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#9ca3af"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 001.88-2.38 8.59 8.59 0 01-2.72 1.04 4.28 4.28 0 00-7.32 3.91A12.16 12.16 0 013 4.79a4.28 4.28 0 001.32 5.72 4.24 4.24 0 01-1.94-.54v.05a4.28 4.28 0 003.43 4.2 4.27 4.27 0 01-1.93.07 4.29 4.29 0 004 2.98A8.59 8.59 0 012 19.54a12.13 12.13 0 006.56 1.92c7.88 0 12.2-6.53 12.2-12.2l-.01-.56A8.72 8.72 0 0024 6.56l-1.54.44z"/></svg>
        </a>
      </div>
    </div>
    <div class="flex items-center justify-between text-xs text-gray-500">
      <span>&copy; 2024 City Marathon. All rights reserved.</span>
      <div class="flex gap-5">
        <a class="hover:text-white transition cursor-pointer">Race Rules</a>
        <a class="hover:text-white transition cursor-pointer">Privacy Policy</a>
        <a class="hover:text-white transition cursor-pointer">Contact Us</a>
      </div>
    </div>
  </div>
</footer>

</body>
</html>
  $HTML$,
  3
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
