INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '36e03a29-2e65-49f7-8bd0-0f9c4bb4d441',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PULSE FEST 2024</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        neon: { pink:'#ec4899', yellow:'#eab308' },
        dark: { 900:'#000000', 800:'#0a0a0a', 700:'#111111', 600:'#1a1a1a', 500:'#222222' }
      },
      fontFamily: {
        display:['Unbounded','sans-serif'],
        body:['Inter','sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#000; color:#fff; }
  h1,h2,h3,h4,.font-display { font-family:'Unbounded',sans-serif; }
  html { scroll-behavior:smooth; }

  .neon-pink-glow { text-shadow:0 0 40px rgba(236,72,153,0.6),0 0 80px rgba(236,72,153,0.3),0 0 120px rgba(236,72,153,0.15); }
  .neon-yellow-glow { text-shadow:0 0 40px rgba(234,179,8,0.6),0 0 80px rgba(234,179,8,0.3); }
  .box-glow-pink { box-shadow:0 0 20px rgba(236,72,153,0.3),0 0 40px rgba(236,72,153,0.1); }
  .box-glow-yellow { box-shadow:0 0 20px rgba(234,179,8,0.3),0 0 40px rgba(234,179,8,0.1); }

  .stage-col { border-right:1px solid rgba(255,255,255,0.06); }
  .stage-col:last-child { border-right:none; }
  .time-block { position:relative; transition:all 0.2s ease; }
  .time-block:hover { transform:scale(1.02); z-index:10; }

  .reveal { opacity:0; transform:translateY(30px); transition:all 0.7s cubic-bezier(0.16,1,0.3,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }

  .scanline { background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(236,72,153,0.03) 2px,rgba(236,72,153,0.03) 4px); pointer-events:none; }

  @keyframes pulse-dot { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  .pulse-dot { animation:pulse-dot 2s ease-in-out infinite; }

  @keyframes flicker { 0%,100%{opacity:1;} 92%{opacity:1;} 93%{opacity:0.8;} 94%{opacity:1;} 96%{opacity:0.7;} 97%{opacity:1;} }
  .flicker { animation:flicker 4s ease-in-out infinite; }

  .faq-answer { max-height:0; overflow:hidden; transition:max-height 0.3s ease; }
  .faq-answer.open { max-height:200px; }
</style>
</head>
<body>

<!-- Navbar -->
<nav class="fixed top-0 w-full bg-black/90 backdrop-blur-md z-50 border-b border-white/5">
  <div class="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
    <a href="#" class="font-display text-lg font-bold tracking-tight">
      <span class="text-neon-pink">PULSE</span><span class="text-neon-yellow">FEST</span>
    </a>
    <div class="hidden md:flex items-center gap-8 text-sm font-medium text-white/40">
      <a href="#lineup" class="hover:text-neon-pink transition-colors">Lineup</a>
      <a href="#timetable" class="hover:text-neon-pink transition-colors">Timetable</a>
      <a href="#venue" class="hover:text-neon-pink transition-colors">Venue</a>
      <a href="#tickets" class="hover:text-neon-pink transition-colors">Tickets</a>
      <a href="#faq" class="hover:text-neon-pink transition-colors">FAQ</a>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="document.getElementById('tickets').scrollIntoView({behavior:'smooth'})" class="bg-neon-pink text-black px-5 py-2 rounded-none text-sm font-bold font-display tracking-wide hover:bg-pink-400 transition-colors">
        GET TICKETS
      </button>
      <button onclick="document.getElementById('mobile-nav').classList.toggle('hidden')" class="md:hidden text-white/50">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-nav" class="hidden md:hidden bg-black border-t border-white/5 px-6 py-4 space-y-3">
    <a href="#lineup" class="block text-sm text-white/40 hover:text-neon-pink">Lineup</a>
    <a href="#timetable" class="block text-sm text-white/40 hover:text-neon-pink">Timetable</a>
    <a href="#venue" class="block text-sm text-white/40 hover:text-neon-pink">Venue</a>
    <a href="#tickets" class="block text-sm text-white/40 hover:text-neon-pink">Tickets</a>
    <a href="#faq" class="block text-sm text-white/40 hover:text-neon-pink">FAQ</a>
  </div>
</nav>

<!-- Hero -->
<section class="relative min-h-screen flex items-center justify-center overflow-hidden pt-14">
  <!-- Background effects -->
  <div class="absolute inset-0">
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-pink/20 rounded-full blur-[180px]"></div>
    <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-yellow/15 rounded-full blur-[150px]"></div>
  </div>
  <div class="absolute inset-0 scanline"></div>

  <div class="relative z-10 text-center px-6 max-w-5xl mx-auto">
    <!-- Date strip -->
    <div class="inline-flex items-center gap-3 border border-neon-pink/30 px-5 py-2 mb-10">
      <span class="w-2 h-2 bg-neon-pink rounded-full pulse-dot"></span>
      <span class="text-sm font-medium text-neon-pink tracking-widest font-display">JULY 12-14 &bull; CENTRAL PARK</span>
    </div>

    <!-- Festival name -->
    <h1 class="font-display font-black tracking-tighter leading-[0.85] mb-6 flicker">
      <span class="block text-[clamp(4rem,15vw,12rem)] text-neon-pink neon-pink-glow">PULSE</span>
      <span class="block text-[clamp(4rem,15vw,12rem)] text-neon-yellow neon-yellow-glow">FEST</span>
    </h1>
    <div class="font-display font-bold text-2xl md:text-3xl text-white/60 tracking-widest mb-3">2 0 2 4</div>
    <p class="text-white/30 text-base md:text-lg max-w-lg mx-auto mb-10 leading-relaxed">Three days. Three stages. One unforgettable weekend of music, art, and community.</p>

    <div class="flex flex-col sm:flex-row justify-center gap-4">
      <button onclick="document.getElementById('tickets').scrollIntoView({behavior:'smooth'})" class="bg-neon-pink text-black px-10 py-4 font-display font-bold text-sm tracking-wider hover:bg-pink-400 transition-colors box-glow-pink">
        GET TICKETS &rarr;
      </button>
      <button onclick="document.getElementById('lineup').scrollIntoView({behavior:'smooth'})" class="border border-white/20 text-white px-10 py-4 font-display font-bold text-sm tracking-wider hover:border-neon-yellow hover:text-neon-yellow transition-colors">
        VIEW LINEUP
      </button>
    </div>
  </div>
</section>

<!-- Lineup -->
<section id="lineup" class="py-28 border-t border-white/5">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-neon-yellow text-xs tracking-[0.4em] uppercase font-display font-bold">The Artists</span>
      <h2 class="text-5xl md:text-6xl font-display font-black tracking-tighter mt-3">LINEUP</h2>
    </div>

    <!-- Headliners -->
    <div class="grid md:grid-cols-3 gap-5 mb-6 reveal">
      <div class="bg-dark-600 border border-neon-pink/20 p-8 text-center group cursor-pointer hover:border-neon-pink/60 transition-all hover:box-glow-pink">
        <span class="text-[10px] tracking-[0.3em] uppercase text-neon-pink font-display font-bold block mb-3">Headliner &bull; Friday</span>
        <h3 class="font-display font-black text-3xl tracking-tight group-hover:text-neon-pink transition-colors">AURORA SKIES</h3>
        <p class="text-white/30 text-sm mt-2">Electronic / Ambient</p>
        <p class="text-white/15 text-xs mt-1">Main Stage &bull; 10:00 PM</p>
      </div>
      <div class="bg-dark-600 border border-neon-yellow/20 p-8 text-center group cursor-pointer hover:border-neon-yellow/60 transition-all hover:box-glow-yellow">
        <span class="text-[10px] tracking-[0.3em] uppercase text-neon-yellow font-display font-bold block mb-3">Headliner &bull; Saturday</span>
        <h3 class="font-display font-black text-3xl tracking-tight group-hover:text-neon-yellow transition-colors">THE VELVET RIOTS</h3>
        <p class="text-white/30 text-sm mt-2">Indie Rock / Alt</p>
        <p class="text-white/15 text-xs mt-1">Main Stage &bull; 10:00 PM</p>
      </div>
      <div class="bg-dark-600 border border-neon-pink/20 p-8 text-center group cursor-pointer hover:border-neon-pink/60 transition-all hover:box-glow-pink">
        <span class="text-[10px] tracking-[0.3em] uppercase text-neon-pink font-display font-bold block mb-3">Headliner &bull; Sunday</span>
        <h3 class="font-display font-black text-3xl tracking-tight group-hover:text-neon-pink transition-colors">DJ NEXUS</h3>
        <p class="text-white/30 text-sm mt-2">House / Techno</p>
        <p class="text-white/15 text-xs mt-1">Electronic Stage &bull; 11:00 PM</p>
      </div>
    </div>

    <!-- More artists -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 reveal">
      <div class="bg-dark-700 border border-white/5 p-3 text-center hover:border-neon-pink/30 transition-colors cursor-pointer"><p class="font-display font-bold text-sm">Midnight Echo</p><p class="text-[10px] text-white/25 mt-0.5">Synth Pop</p></div>
      <div class="bg-dark-700 border border-white/5 p-3 text-center hover:border-neon-yellow/30 transition-colors cursor-pointer"><p class="font-display font-bold text-sm">Glass Animals</p><p class="text-[10px] text-white/25 mt-0.5">Psychedelic Pop</p></div>
      <div class="bg-dark-700 border border-white/5 p-3 text-center hover:border-neon-pink/30 transition-colors cursor-pointer"><p class="font-display font-bold text-sm">Neon Dusk</p><p class="text-[10px] text-white/25 mt-0.5">Dream Pop</p></div>
      <div class="bg-dark-700 border border-white/5 p-3 text-center hover:border-neon-yellow/30 transition-colors cursor-pointer"><p class="font-display font-bold text-sm">Rustic Haze</p><p class="text-[10px] text-white/25 mt-0.5">Folk Rock</p></div>
      <div class="bg-dark-700 border border-white/5 p-3 text-center hover:border-neon-pink/30 transition-colors cursor-pointer"><p class="font-display font-bold text-sm">Cipher</p><p class="text-[10px] text-white/25 mt-0.5">Techno</p></div>
      <div class="bg-dark-700 border border-white/5 p-3 text-center hover:border-neon-yellow/30 transition-colors cursor-pointer"><p class="font-display font-bold text-sm">Solar Flare</p><p class="text-[10px] text-white/25 mt-0.5">Indie Electronic</p></div>
      <div class="bg-dark-700 border border-white/5 p-3 text-center hover:border-neon-pink/30 transition-colors cursor-pointer"><p class="font-display font-bold text-sm">The Wanderers</p><p class="text-[10px] text-white/25 mt-0.5">Alt Country</p></div>
      <div class="bg-dark-700 border border-white/5 p-3 text-center hover:border-neon-yellow/30 transition-colors cursor-pointer"><p class="font-display font-bold text-sm">Pixel Hearts</p><p class="text-[10px] text-white/25 mt-0.5">Chiptune</p></div>
      <div class="bg-dark-700 border border-white/5 p-3 text-center hover:border-neon-pink/30 transition-colors cursor-pointer"><p class="font-display font-bold text-sm">Vox Machine</p><p class="text-[10px] text-white/25 mt-0.5">Post-Punk</p></div>
      <div class="bg-dark-700 border border-white/5 p-3 text-center hover:border-neon-yellow/30 transition-colors cursor-pointer"><p class="font-display font-bold text-sm">Luna Bay</p><p class="text-[10px] text-white/25 mt-0.5">Shoegaze</p></div>
      <div class="bg-dark-700 border border-white/5 p-3 text-center hover:border-neon-pink/30 transition-colors cursor-pointer"><p class="font-display font-bold text-sm">Bass Prophet</p><p class="text-[10px] text-white/25 mt-0.5">Drum & Bass</p></div>
      <div class="bg-dark-700 border border-white/5 p-3 text-center hover:border-neon-yellow/30 transition-colors cursor-pointer"><p class="font-display font-bold text-sm">+ 20 more</p><p class="text-[10px] text-white/25 mt-0.5">TBA</p></div>
    </div>
  </div>
</section>

<!-- Timetable (Signature: multi-stage columns) -->
<section id="timetable" class="py-28 border-t border-white/5">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-neon-pink text-xs tracking-[0.4em] uppercase font-display font-bold">Stage Schedule</span>
      <h2 class="text-5xl md:text-6xl font-display font-black tracking-tighter mt-3">TIMETABLE</h2>
    </div>

    <!-- Day tabs -->
    <div class="flex justify-center gap-2 mb-10 reveal">
      <button onclick="switchDay('fri')" id="btn-fri" class="day-tab bg-neon-pink text-black px-6 py-2.5 font-display font-bold text-sm tracking-wider">FRI JUL 12</button>
      <button onclick="switchDay('sat')" id="btn-sat" class="day-tab bg-dark-600 text-white/40 border border-white/10 px-6 py-2.5 font-display font-bold text-sm tracking-wider hover:text-white transition-colors">SAT JUL 13</button>
      <button onclick="switchDay('sun')" id="btn-sun" class="day-tab bg-dark-600 text-white/40 border border-white/10 px-6 py-2.5 font-display font-bold text-sm tracking-wider hover:text-white transition-colors">SUN JUL 14</button>
    </div>

    <!-- Friday timetable -->
    <div id="day-fri" class="reveal">
      <div class="overflow-x-auto">
        <div class="min-w-[720px]">
          <!-- Stage headers -->
          <div class="grid grid-cols-[80px_1fr_1fr_1fr] border-b border-white/10 pb-3 mb-2">
            <div class="text-xs text-white/20 font-display">TIME</div>
            <div class="text-center"><span class="font-display font-bold text-sm text-neon-pink">MAIN STAGE</span><br><span class="text-[10px] text-white/20">Capacity 15,000</span></div>
            <div class="text-center"><span class="font-display font-bold text-sm text-neon-yellow">INDIE STAGE</span><br><span class="text-[10px] text-white/20">Capacity 5,000</span></div>
            <div class="text-center"><span class="font-display font-bold text-sm text-white/60">ELECTRONIC STAGE</span><br><span class="text-[10px] text-white/20">Capacity 8,000</span></div>
          </div>
          <!-- Time rows -->
          <div class="grid grid-cols-[80px_1fr_1fr_1fr] items-stretch gap-y-1">
            <div class="text-xs text-white/25 font-mono py-3 pr-2 text-right">2:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-neon-pink/10 border border-neon-pink/20 p-3 text-center"><p class="font-display font-bold text-sm">Solar Flare</p><p class="text-[10px] text-white/30">Indie Electronic</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/10 border border-neon-yellow/20 p-3 text-center"><p class="font-display font-bold text-sm">Rustic Haze</p><p class="text-[10px] text-white/30">Folk Rock</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-white/5 border border-white/10 p-3 text-center"><p class="font-display font-bold text-sm text-white/50">Pixel Hearts</p><p class="text-[10px] text-white/20">Chiptune</p></div></div>

            <div class="text-xs text-white/25 font-mono py-3 pr-2 text-right">4:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-neon-pink/10 border border-neon-pink/20 p-3 text-center"><p class="font-display font-bold text-sm">Midnight Echo</p><p class="text-[10px] text-white/30">Synth Pop</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/10 border border-neon-yellow/20 p-3 text-center"><p class="font-display font-bold text-sm">The Wanderers</p><p class="text-[10px] text-white/30">Alt Country</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-white/5 border border-white/10 p-3 text-center"><p class="font-display font-bold text-sm text-white/50">Cipher</p><p class="text-[10px] text-white/20">Techno</p></div></div>

            <div class="text-xs text-white/25 font-mono py-3 pr-2 text-right">6:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-neon-pink/10 border border-neon-pink/20 p-3 text-center"><p class="font-display font-bold text-sm">Neon Dusk</p><p class="text-[10px] text-white/30">Dream Pop</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/10 border border-neon-yellow/20 p-3 text-center"><p class="font-display font-bold text-sm">Luna Bay</p><p class="text-[10px] text-white/30">Shoegaze</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-white/5 border border-white/10 p-3 text-center"><p class="font-display font-bold text-sm text-white/50">Bass Prophet</p><p class="text-[10px] text-white/20">Drum & Bass</p></div></div>

            <div class="text-xs text-white/25 font-mono py-3 pr-2 text-right">8:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-neon-pink/15 border border-neon-pink/30 p-3 text-center"><p class="font-display font-bold text-sm">Glass Animals</p><p class="text-[10px] text-white/30">Psychedelic Pop</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/15 border border-neon-yellow/30 p-3 text-center"><p class="font-display font-bold text-sm">Vox Machine</p><p class="text-[10px] text-white/30">Post-Punk</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-white/5 border border-white/10 p-3 text-center"><p class="font-display font-bold text-sm text-white/50">DJ Set: Opener</p><p class="text-[10px] text-white/20">Deep House</p></div></div>

            <div class="text-xs text-neon-pink font-mono py-3 pr-2 text-right font-bold">10:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-neon-pink/20 border-2 border-neon-pink/50 p-4 text-center box-glow-pink"><p class="font-display font-black text-lg text-neon-pink">AURORA SKIES</p><p class="text-[10px] text-neon-pink/60">HEADLINER</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/10 border border-neon-yellow/20 p-3 text-center"><p class="font-display font-bold text-sm">Neon Dusk</p><p class="text-[10px] text-white/30">Late Set</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-white/5 border border-white/10 p-3 text-center"><p class="font-display font-bold text-sm text-white/50">Cipher</p><p class="text-[10px] text-white/20">Closing Set</p></div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Saturday timetable -->
    <div id="day-sat" class="hidden reveal">
      <div class="overflow-x-auto">
        <div class="min-w-[720px]">
          <div class="grid grid-cols-[80px_1fr_1fr_1fr] border-b border-white/10 pb-3 mb-2">
            <div class="text-xs text-white/20 font-display">TIME</div>
            <div class="text-center"><span class="font-display font-bold text-sm text-neon-pink">MAIN STAGE</span></div>
            <div class="text-center"><span class="font-display font-bold text-sm text-neon-yellow">INDIE STAGE</span></div>
            <div class="text-center"><span class="font-display font-bold text-sm text-white/60">ELECTRONIC STAGE</span></div>
          </div>
          <div class="grid grid-cols-[80px_1fr_1fr_1fr] items-stretch gap-y-1">
            <div class="text-xs text-white/25 font-mono py-3 pr-2 text-right">2:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-neon-pink/10 border border-neon-pink/20 p-3 text-center"><p class="font-display font-bold text-sm">Pixel Hearts</p><p class="text-[10px] text-white/30">Chiptune</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/10 border border-neon-yellow/20 p-3 text-center"><p class="font-display font-bold text-sm">Luna Bay</p><p class="text-[10px] text-white/30">Shoegaze</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-white/5 border border-white/10 p-3 text-center"><p class="font-display font-bold text-sm text-white/50">Ambient Set</p><p class="text-[10px] text-white/20">Chill</p></div></div>

            <div class="text-xs text-white/25 font-mono py-3 pr-2 text-right">4:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-neon-pink/10 border border-neon-pink/20 p-3 text-center"><p class="font-display font-bold text-sm">Solar Flare</p><p class="text-[10px] text-white/30">Indie Electronic</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/10 border border-neon-yellow/20 p-3 text-center"><p class="font-display font-bold text-sm">Rustic Haze</p><p class="text-[10px] text-white/30">Folk Rock</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-white/5 border border-white/10 p-3 text-center"><p class="font-display font-bold text-sm text-white/50">Bass Prophet</p><p class="text-[10px] text-white/20">Drum & Bass</p></div></div>

            <div class="text-xs text-white/25 font-mono py-3 pr-2 text-right">6:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-neon-pink/10 border border-neon-pink/20 p-3 text-center"><p class="font-display font-bold text-sm">Midnight Echo</p><p class="text-[10px] text-white/30">Synth Pop</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/15 border border-neon-yellow/30 p-3 text-center"><p class="font-display font-bold text-sm">The Wanderers</p><p class="text-[10px] text-white/30">Alt Country</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-white/5 border border-white/10 p-3 text-center"><p class="font-display font-bold text-sm text-white/50">Cipher</p><p class="text-[10px] text-white/20">Techno</p></div></div>

            <div class="text-xs text-white/25 font-mono py-3 pr-2 text-right">8:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-neon-pink/15 border border-neon-pink/30 p-3 text-center"><p class="font-display font-bold text-sm">Neon Dusk</p><p class="text-[10px] text-white/30">Dream Pop</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/10 border border-neon-yellow/20 p-3 text-center"><p class="font-display font-bold text-sm">Vox Machine</p><p class="text-[10px] text-white/30">Post-Punk</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-white/8 border border-white/15 p-3 text-center"><p class="font-display font-bold text-sm">DJ Nexus</p><p class="text-[10px] text-white/30">Warm-up Set</p></div></div>

            <div class="text-xs text-neon-yellow font-mono py-3 pr-2 text-right font-bold">10:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/20 border-2 border-neon-yellow/50 p-4 text-center box-glow-yellow"><p class="font-display font-black text-lg text-neon-yellow">THE VELVET RIOTS</p><p class="text-[10px] text-neon-yellow/60">HEADLINER</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/10 border border-neon-yellow/20 p-3 text-center"><p class="font-display font-bold text-sm">Luna Bay</p><p class="text-[10px] text-white/30">Late Set</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-white/5 border border-white/10 p-3 text-center"><p class="font-display font-bold text-sm text-white/50">Bass Prophet</p><p class="text-[10px] text-white/20">Late Night</p></div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sunday timetable -->
    <div id="day-sun" class="hidden reveal">
      <div class="overflow-x-auto">
        <div class="min-w-[720px]">
          <div class="grid grid-cols-[80px_1fr_1fr_1fr] border-b border-white/10 pb-3 mb-2">
            <div class="text-xs text-white/20 font-display">TIME</div>
            <div class="text-center"><span class="font-display font-bold text-sm text-neon-pink">MAIN STAGE</span></div>
            <div class="text-center"><span class="font-display font-bold text-sm text-neon-yellow">INDIE STAGE</span></div>
            <div class="text-center"><span class="font-display font-bold text-sm text-white/60">ELECTRONIC STAGE</span></div>
          </div>
          <div class="grid grid-cols-[80px_1fr_1fr_1fr] items-stretch gap-y-1">
            <div class="text-xs text-white/25 font-mono py-3 pr-2 text-right">2:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-neon-pink/10 border border-neon-pink/20 p-3 text-center"><p class="font-display font-bold text-sm">The Wanderers</p><p class="text-[10px] text-white/30">Alt Country</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/10 border border-neon-yellow/20 p-3 text-center"><p class="font-display font-bold text-sm">Pixel Hearts</p><p class="text-[10px] text-white/30">Chiptune</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-white/5 border border-white/10 p-3 text-center"><p class="font-display font-bold text-sm text-white/50">Solar Flare</p><p class="text-[10px] text-white/20">Indie Electronic</p></div></div>

            <div class="text-xs text-white/25 font-mono py-3 pr-2 text-right">4:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-neon-pink/10 border border-neon-pink/20 p-3 text-center"><p class="font-display font-bold text-sm">Glass Animals</p><p class="text-[10px] text-white/30">Psychedelic Pop</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/10 border border-neon-yellow/20 p-3 text-center"><p class="font-display font-bold text-sm">Vox Machine</p><p class="text-[10px] text-white/30">Post-Punk</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-white/5 border border-white/10 p-3 text-center"><p class="font-display font-bold text-sm text-white/50">Cipher</p><p class="text-[10px] text-white/20">Techno</p></div></div>

            <div class="text-xs text-white/25 font-mono py-3 pr-2 text-right">6:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-neon-pink/15 border border-neon-pink/30 p-3 text-center"><p class="font-display font-bold text-sm">Aurora Skies</p><p class="text-[10px] text-white/30">Special Set</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/15 border border-neon-yellow/30 p-3 text-center"><p class="font-display font-bold text-sm">Rustic Haze</p><p class="text-[10px] text-white/30">Folk Rock</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-white/8 border border-white/15 p-3 text-center"><p class="font-display font-bold text-sm">Midnight Echo</p><p class="text-[10px] text-white/30">Synth Pop</p></div></div>

            <div class="text-xs text-white/25 font-mono py-3 pr-2 text-right">8:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-neon-pink/15 border border-neon-pink/30 p-3 text-center"><p class="font-display font-bold text-sm">The Velvet Riots</p><p class="text-[10px] text-white/30">Closing Set</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-yellow/10 border border-neon-yellow/20 p-3 text-center"><p class="font-display font-bold text-sm">Neon Dusk</p><p class="text-[10px] text-white/30">Dream Pop</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-white/8 border border-white/15 p-3 text-center"><p class="font-display font-bold text-sm">Bass Prophet</p><p class="text-[10px] text-white/30">Drum & Bass</p></div></div>

            <div class="text-xs text-neon-pink font-mono py-3 pr-2 text-right font-bold">11:00 PM</div>
            <div class="stage-col px-2"><div class="time-block bg-dark-600 border border-white/5 p-3 text-center"><p class="font-display font-bold text-sm text-white/20">--</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-dark-600 border border-white/5 p-3 text-center"><p class="font-display font-bold text-sm text-white/20">--</p></div></div>
            <div class="stage-col px-2"><div class="time-block bg-neon-pink/20 border-2 border-neon-pink/50 p-4 text-center box-glow-pink"><p class="font-display font-black text-lg text-neon-pink">DJ NEXUS</p><p class="text-[10px] text-neon-pink/60">CLOSING HEADLINER</p></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Venue Map -->
<section id="venue" class="py-28 border-t border-white/5">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-neon-yellow text-xs tracking-[0.4em] uppercase font-display font-bold">Find Your Way</span>
      <h2 class="text-5xl md:text-6xl font-display font-black tracking-tighter mt-3">VENUE MAP</h2>
      <p class="text-white/30 text-sm mt-3">Central Park &bull; North Meadow</p>
    </div>

    <div class="reveal">
      <div class="bg-dark-700 border border-white/10 p-6 md:p-10 relative overflow-hidden">
        <!-- SVG Venue Map -->
        <svg viewBox="0 0 800 500" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          <!-- Ground -->
          <rect x="0" y="0" width="800" height="500" fill="#0a0a0a" rx="4"/>

          <!-- Paths / Roads -->
          <path d="M50 250 L750 250" stroke="#222" stroke-width="12" stroke-linecap="round"/>
          <path d="M400 50 L400 450" stroke="#222" stroke-width="12" stroke-linecap="round"/>
          <path d="M50 400 L350 400 L350 300" stroke="#222" stroke-width="8" stroke-linecap="round" fill="none"/>
          <path d="M450 300 L450 400 L750 400" stroke="#222" stroke-width="8" stroke-linecap="round" fill="none"/>
          <path d="M200 100 L200 200" stroke="#1a1a1a" stroke-width="6" stroke-linecap="round"/>
          <path d="M600 100 L600 200" stroke="#1a1a1a" stroke-width="6" stroke-linecap="round"/>

          <!-- Main Stage -->
          <rect x="130" y="70" width="140" height="80" rx="4" fill="#ec4899" fill-opacity="0.15" stroke="#ec4899" stroke-width="2"/>
          <rect x="160" y="95" width="80" height="30" rx="2" fill="#ec4899" fill-opacity="0.3"/>
          <text x="200" y="90" text-anchor="middle" fill="#ec4899" font-family="Unbounded,sans-serif" font-size="11" font-weight="800">MAIN STAGE</text>
          <text x="200" y="115" text-anchor="middle" fill="#ec4899" font-family="Inter,sans-serif" font-size="8" opacity="0.6">15,000 cap</text>
          <!-- Stage front indicator -->
          <rect x="155" y="155" width="90" height="4" rx="2" fill="#ec4899" fill-opacity="0.4"/>

          <!-- Indie Stage -->
          <rect x="530" y="70" width="140" height="80" rx="4" fill="#eab308" fill-opacity="0.15" stroke="#eab308" stroke-width="2"/>
          <rect x="560" y="95" width="80" height="30" rx="2" fill="#eab308" fill-opacity="0.3"/>
          <text x="600" y="90" text-anchor="middle" fill="#eab308" font-family="Unbounded,sans-serif" font-size="11" font-weight="800">INDIE STAGE</text>
          <text x="600" y="115" text-anchor="middle" fill="#eab308" font-family="Inter,sans-serif" font-size="8" opacity="0.6">5,000 cap</text>
          <rect x="555" y="155" width="90" height="4" rx="2" fill="#eab308" fill-opacity="0.4"/>

          <!-- Electronic Stage -->
          <rect x="330" y="310" width="140" height="80" rx="4" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.4"/>
          <rect x="360" y="335" width="80" height="30" rx="2" fill="#ffffff" fill-opacity="0.1"/>
          <text x="400" y="330" text-anchor="middle" fill="#ffffff" font-family="Unbounded,sans-serif" font-size="10" font-weight="800" opacity="0.7">ELECTRONIC</text>
          <text x="400" y="345" text-anchor="middle" fill="#ffffff" font-family="Unbounded,sans-serif" font-size="10" font-weight="800" opacity="0.7">STAGE</text>
          <text x="400" y="360" text-anchor="middle" fill="#ffffff" font-family="Inter,sans-serif" font-size="8" opacity="0.3">8,000 cap</text>

          <!-- Food Area 1 -->
          <rect x="50" y="300" width="100" height="60" rx="4" fill="#22c55e" fill-opacity="0.1" stroke="#22c55e" stroke-width="1" stroke-opacity="0.4"/>
          <text x="100" y="325" text-anchor="middle" fill="#22c55e" font-family="Inter,sans-serif" font-size="9" font-weight="600" opacity="0.7">FOOD</text>
          <text x="100" y="340" text-anchor="middle" fill="#22c55e" font-family="Inter,sans-serif" font-size="9" font-weight="600" opacity="0.7">VILLAGE</text>
          <!-- Food icons -->
          <circle cx="70" cy="350" r="4" fill="#22c55e" fill-opacity="0.3"/>
          <circle cx="85" cy="350" r="4" fill="#22c55e" fill-opacity="0.3"/>
          <circle cx="100" cy="350" r="4" fill="#22c55e" fill-opacity="0.3"/>
          <circle cx="115" cy="350" r="4" fill="#22c55e" fill-opacity="0.3"/>
          <circle cx="130" cy="350" r="4" fill="#22c55e" fill-opacity="0.3"/>

          <!-- Food Area 2 -->
          <rect x="650" y="300" width="100" height="60" rx="4" fill="#22c55e" fill-opacity="0.1" stroke="#22c55e" stroke-width="1" stroke-opacity="0.4"/>
          <text x="700" y="325" text-anchor="middle" fill="#22c55e" font-family="Inter,sans-serif" font-size="9" font-weight="600" opacity="0.7">FOOD</text>
          <text x="700" y="340" text-anchor="middle" fill="#22c55e" font-family="Inter,sans-serif" font-size="9" font-weight="600" opacity="0.7">COURT</text>
          <circle cx="670" cy="350" r="4" fill="#22c55e" fill-opacity="0.3"/>
          <circle cx="685" cy="350" r="4" fill="#22c55e" fill-opacity="0.3"/>
          <circle cx="700" cy="350" r="4" fill="#22c55e" fill-opacity="0.3"/>
          <circle cx="715" cy="350" r="4" fill="#22c55e" fill-opacity="0.3"/>
          <circle cx="730" cy="350" r="4" fill="#22c55e" fill-opacity="0.3"/>

          <!-- Merch -->
          <rect x="340" y="190" width="120" height="40" rx="4" fill="#a855f7" fill-opacity="0.1" stroke="#a855f7" stroke-width="1" stroke-opacity="0.4"/>
          <text x="400" y="215" text-anchor="middle" fill="#a855f7" font-family="Inter,sans-serif" font-size="9" font-weight="600" opacity="0.7">MERCH + ART</text>

          <!-- VIP Area -->
          <rect x="50" y="170" width="60" height="60" rx="4" fill="#ec4899" fill-opacity="0.08" stroke="#ec4899" stroke-width="1" stroke-dasharray="4 2" stroke-opacity="0.5"/>
          <text x="80" y="200" text-anchor="middle" fill="#ec4899" font-family="Inter,sans-serif" font-size="9" font-weight="700" opacity="0.7">VIP</text>
          <text x="80" y="215" text-anchor="middle" fill="#ec4899" font-family="Inter,sans-serif" font-size="7" opacity="0.4">LOUNGE</text>

          <!-- Backstage -->
          <rect x="690" y="170" width="60" height="60" rx="4" fill="#eab308" fill-opacity="0.08" stroke="#eab308" stroke-width="1" stroke-dasharray="4 2" stroke-opacity="0.5"/>
          <text x="720" y="200" text-anchor="middle" fill="#eab308" font-family="Inter,sans-serif" font-size="8" font-weight="700" opacity="0.7">BACK</text>
          <text x="720" y="212" text-anchor="middle" fill="#eab308" font-family="Inter,sans-serif" font-size="8" font-weight="700" opacity="0.7">STAGE</text>

          <!-- Parking -->
          <rect x="50" y="420" width="160" height="50" rx="4" fill="#3b82f6" fill-opacity="0.08" stroke="#3b82f6" stroke-width="1" stroke-opacity="0.3"/>
          <text x="130" y="448" text-anchor="middle" fill="#3b82f6" font-family="Inter,sans-serif" font-size="10" font-weight="600" opacity="0.6">PARKING LOT A</text>
          <!-- Car slots -->
          <line x1="80" y1="430" x2="80" y2="460" stroke="#3b82f6" stroke-width="0.5" stroke-opacity="0.3"/>
          <line x1="100" y1="430" x2="100" y2="460" stroke="#3b82f6" stroke-width="0.5" stroke-opacity="0.3"/>
          <line x1="120" y1="430" x2="120" y2="460" stroke="#3b82f6" stroke-width="0.5" stroke-opacity="0.3"/>
          <line x1="140" y1="430" x2="140" y2="460" stroke="#3b82f6" stroke-width="0.5" stroke-opacity="0.3"/>
          <line x1="160" y1="430" x2="160" y2="460" stroke="#3b82f6" stroke-width="0.5" stroke-opacity="0.3"/>
          <line x1="180" y1="430" x2="180" y2="460" stroke="#3b82f6" stroke-width="0.5" stroke-opacity="0.3"/>

          <!-- Parking B -->
          <rect x="590" y="420" width="160" height="50" rx="4" fill="#3b82f6" fill-opacity="0.08" stroke="#3b82f6" stroke-width="1" stroke-opacity="0.3"/>
          <text x="670" y="448" text-anchor="middle" fill="#3b82f6" font-family="Inter,sans-serif" font-size="10" font-weight="600" opacity="0.6">PARKING LOT B</text>
          <line x1="620" y1="430" x2="620" y2="460" stroke="#3b82f6" stroke-width="0.5" stroke-opacity="0.3"/>
          <line x1="640" y1="430" x2="640" y2="460" stroke="#3b82f6" stroke-width="0.5" stroke-opacity="0.3"/>
          <line x1="660" y1="430" x2="660" y2="460" stroke="#3b82f6" stroke-width="0.5" stroke-opacity="0.3"/>
          <line x1="680" y1="430" x2="680" y2="460" stroke="#3b82f6" stroke-width="0.5" stroke-opacity="0.3"/>
          <line x1="700" y1="430" x2="700" y2="460" stroke="#3b82f6" stroke-width="0.5" stroke-opacity="0.3"/>
          <line x1="720" y1="430" x2="720" y2="460" stroke="#3b82f6" stroke-width="0.5" stroke-opacity="0.3"/>

          <!-- Entrance -->
          <rect x="350" y="460" width="100" height="30" rx="4" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.4"/>
          <text x="400" y="480" text-anchor="middle" fill="#ffffff" font-family="Unbounded,sans-serif" font-size="10" font-weight="700" opacity="0.6">ENTRANCE</text>
          <!-- Arrow -->
          <path d="M400 495 L400 500 M395 496 L400 500 L405 496" stroke="#ffffff" stroke-width="1.5" fill="none" stroke-opacity="0.4"/>

          <!-- Restrooms indicators -->
          <circle cx="280" cy="250" r="10" fill="#6b7280" fill-opacity="0.15" stroke="#6b7280" stroke-width="1" stroke-opacity="0.3"/>
          <text x="280" y="253" text-anchor="middle" fill="#6b7280" font-family="Inter,sans-serif" font-size="7" opacity="0.6">WC</text>
          <circle cx="520" cy="250" r="10" fill="#6b7280" fill-opacity="0.15" stroke="#6b7280" stroke-width="1" stroke-opacity="0.3"/>
          <text x="520" y="253" text-anchor="middle" fill="#6b7280" font-family="Inter,sans-serif" font-size="7" opacity="0.6">WC</text>

          <!-- First Aid -->
          <rect x="240" y="410" width="50" height="30" rx="4" fill="#ef4444" fill-opacity="0.1" stroke="#ef4444" stroke-width="1" stroke-opacity="0.4"/>
          <text x="265" y="425" text-anchor="middle" fill="#ef4444" font-family="Inter,sans-serif" font-size="7" font-weight="700" opacity="0.7">FIRST</text>
          <text x="265" y="435" text-anchor="middle" fill="#ef4444" font-family="Inter,sans-serif" font-size="7" font-weight="700" opacity="0.7">AID</text>

          <!-- Water station -->
          <circle cx="400" cy="270" r="8" fill="#06b6d4" fill-opacity="0.15" stroke="#06b6d4" stroke-width="1" stroke-opacity="0.3"/>
          <text x="400" y="273" text-anchor="middle" fill="#06b6d4" font-family="Inter,sans-serif" font-size="6" opacity="0.6">H2O</text>

          <!-- Trees / Green areas -->
          <circle cx="300" cy="160" r="15" fill="#22c55e" fill-opacity="0.06"/>
          <circle cx="320" cy="175" r="12" fill="#22c55e" fill-opacity="0.06"/>
          <circle cx="480" cy="160" r="15" fill="#22c55e" fill-opacity="0.06"/>
          <circle cx="500" cy="175" r="12" fill="#22c55e" fill-opacity="0.06"/>
        </svg>

        <!-- Map Legend -->
        <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 text-xs">
          <div class="flex items-center gap-2"><span class="w-3 h-3 bg-neon-pink/30 border border-neon-pink/50"></span><span class="text-white/40">Main Stage</span></div>
          <div class="flex items-center gap-2"><span class="w-3 h-3 bg-neon-yellow/30 border border-neon-yellow/50"></span><span class="text-white/40">Indie Stage</span></div>
          <div class="flex items-center gap-2"><span class="w-3 h-3 bg-white/10 border border-white/30"></span><span class="text-white/40">Electronic Stage</span></div>
          <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full" style="background:#22c55e33;border:1px solid #22c55e66"></span><span class="text-white/40">Food</span></div>
          <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full" style="background:#3b82f633;border:1px solid #3b82f666"></span><span class="text-white/40">Parking</span></div>
          <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full" style="background:#ef444433;border:1px solid #ef444466"></span><span class="text-white/40">First Aid</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Tickets -->
<section id="tickets" class="py-28 border-t border-white/5">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-neon-pink text-xs tracking-[0.4em] uppercase font-display font-bold">Don't Miss Out</span>
      <h2 class="text-5xl md:text-6xl font-display font-black tracking-tighter mt-3">TICKETS</h2>
    </div>

    <div class="grid md:grid-cols-3 gap-5 reveal">
      <!-- GA -->
      <div class="bg-dark-700 border border-white/10 p-8 hover:border-neon-yellow/30 transition-all group">
        <span class="text-[10px] tracking-[0.3em] uppercase text-white/30 font-display font-bold">3-Day Pass</span>
        <h3 class="font-display font-black text-2xl mt-2">GENERAL<br>ADMISSION</h3>
        <div class="mt-6 mb-8">
          <span class="font-display font-black text-5xl text-neon-yellow">$89</span>
        </div>
        <div class="space-y-3 text-sm text-white/40 mb-8">
          <div class="flex items-center gap-2"><svg class="w-4 h-4 text-neon-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Access to all 3 stages</div>
          <div class="flex items-center gap-2"><svg class="w-4 h-4 text-neon-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>All 3 festival days</div>
          <div class="flex items-center gap-2"><svg class="w-4 h-4 text-neon-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Food vendor access</div>
          <div class="flex items-center gap-2 text-white/15"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>VIP lounge</div>
          <div class="flex items-center gap-2 text-white/15"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>Backstage access</div>
        </div>
        <button onclick="showToast('GA ticket added to cart')" class="w-full border border-neon-yellow/40 text-neon-yellow py-3 font-display font-bold text-sm tracking-wider hover:bg-neon-yellow/10 transition-colors">SELECT</button>
      </div>

      <!-- VIP -->
      <div class="bg-dark-700 border-2 border-neon-pink p-8 box-glow-pink relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-neon-pink text-black px-4 py-1 text-[10px] font-display font-bold tracking-wider">MOST POPULAR</div>
        <span class="text-[10px] tracking-[0.3em] uppercase text-neon-pink font-display font-bold">3-Day Pass</span>
        <h3 class="font-display font-black text-2xl mt-2">VIP</h3>
        <div class="mt-6 mb-8">
          <span class="font-display font-black text-5xl text-neon-pink">$199</span>
        </div>
        <div class="space-y-3 text-sm text-white/40 mb-8">
          <div class="flex items-center gap-2"><svg class="w-4 h-4 text-neon-pink flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Access to all 3 stages</div>
          <div class="flex items-center gap-2"><svg class="w-4 h-4 text-neon-pink flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>All 3 festival days</div>
          <div class="flex items-center gap-2"><svg class="w-4 h-4 text-neon-pink flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>VIP lounge + premium bar</div>
          <div class="flex items-center gap-2"><svg class="w-4 h-4 text-neon-pink flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Priority viewing areas</div>
          <div class="flex items-center gap-2 text-white/15"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>Backstage access</div>
        </div>
        <button onclick="showToast('VIP ticket added to cart')" class="w-full bg-neon-pink text-black py-3 font-display font-bold text-sm tracking-wider hover:bg-pink-400 transition-colors">SELECT</button>
      </div>

      <!-- Backstage -->
      <div class="bg-dark-700 border border-neon-yellow/20 p-8 hover:border-neon-yellow/50 transition-all">
        <span class="text-[10px] tracking-[0.3em] uppercase text-neon-yellow font-display font-bold">3-Day Pass</span>
        <h3 class="font-display font-black text-2xl mt-2">BACKSTAGE</h3>
        <div class="mt-6 mb-8">
          <span class="font-display font-black text-5xl text-neon-yellow">$399</span>
        </div>
        <div class="space-y-3 text-sm text-white/40 mb-8">
          <div class="flex items-center gap-2"><svg class="w-4 h-4 text-neon-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Everything in VIP</div>
          <div class="flex items-center gap-2"><svg class="w-4 h-4 text-neon-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Backstage access</div>
          <div class="flex items-center gap-2"><svg class="w-4 h-4 text-neon-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Meet & greet artists</div>
          <div class="flex items-center gap-2"><svg class="w-4 h-4 text-neon-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Exclusive merch pack</div>
          <div class="flex items-center gap-2"><svg class="w-4 h-4 text-neon-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Complimentary parking</div>
        </div>
        <button onclick="showToast('Backstage pass added to cart')" class="w-full border border-neon-yellow/40 text-neon-yellow py-3 font-display font-bold text-sm tracking-wider hover:bg-neon-yellow/10 transition-colors">SELECT</button>
      </div>
    </div>

    <div class="text-center mt-8 reveal">
      <div class="inline-flex items-center gap-2 text-sm text-white/25">
        <span class="w-2 h-2 bg-neon-pink rounded-full pulse-dot"></span>
        Limited availability &mdash; Backstage passes: only 150 remaining
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section id="faq" class="py-28 border-t border-white/5">
  <div class="max-w-3xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-neon-yellow text-xs tracking-[0.4em] uppercase font-display font-bold">Questions?</span>
      <h2 class="text-5xl md:text-6xl font-display font-black tracking-tighter mt-3">FAQ</h2>
    </div>

    <div class="space-y-2 reveal">
      <div class="bg-dark-700 border border-white/5">
        <button onclick="toggleFaq(this)" class="w-full text-left px-6 py-4 flex items-center justify-between group">
          <span class="font-display font-bold text-sm group-hover:text-neon-pink transition-colors">What are the festival hours?</span>
          <svg class="w-4 h-4 text-white/20 transition-transform faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer px-6 text-sm text-white/40 leading-relaxed"><div class="pb-4">Gates open at 12:00 PM each day. Music starts at 2:00 PM. Friday and Saturday end at midnight, Sunday wraps up at 11:30 PM. Last entry is 2 hours before closing.</div></div>
      </div>

      <div class="bg-dark-700 border border-white/5">
        <button onclick="toggleFaq(this)" class="w-full text-left px-6 py-4 flex items-center justify-between group">
          <span class="font-display font-bold text-sm group-hover:text-neon-pink transition-colors">Can I bring food and drinks?</span>
          <svg class="w-4 h-4 text-white/20 transition-transform faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer px-6 text-sm text-white/40 leading-relaxed"><div class="pb-4">Sealed water bottles are allowed. No outside food or alcohol. We have 25+ food vendors and multiple bars on-site with diverse cuisine options.</div></div>
      </div>

      <div class="bg-dark-700 border border-white/5">
        <button onclick="toggleFaq(this)" class="w-full text-left px-6 py-4 flex items-center justify-between group">
          <span class="font-display font-bold text-sm group-hover:text-neon-pink transition-colors">Is there parking available?</span>
          <svg class="w-4 h-4 text-white/20 transition-transform faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer px-6 text-sm text-white/40 leading-relaxed"><div class="pb-4">Two parking lots are available at $25/day. Backstage pass holders get complimentary parking. We recommend taking public transit -- the venue is a 5-minute walk from the 86th St subway station.</div></div>
      </div>

      <div class="bg-dark-700 border border-white/5">
        <button onclick="toggleFaq(this)" class="w-full text-left px-6 py-4 flex items-center justify-between group">
          <span class="font-display font-bold text-sm group-hover:text-neon-pink transition-colors">What is the refund policy?</span>
          <svg class="w-4 h-4 text-white/20 transition-transform faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer px-6 text-sm text-white/40 leading-relaxed"><div class="pb-4">Full refund up to 30 days before the event. 50% refund up to 14 days before. No refunds within 14 days of the festival. Tickets are transferable to another person at any time.</div></div>
      </div>

      <div class="bg-dark-700 border border-white/5">
        <button onclick="toggleFaq(this)" class="w-full text-left px-6 py-4 flex items-center justify-between group">
          <span class="font-display font-bold text-sm group-hover:text-neon-pink transition-colors">Are there age restrictions?</span>
          <svg class="w-4 h-4 text-white/20 transition-transform faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer px-6 text-sm text-white/40 leading-relaxed"><div class="pb-4">All ages welcome! Under 16 must be accompanied by an adult. Wristband system for 21+ bar access. Family-friendly activities available near the food village area.</div></div>
      </div>

      <div class="bg-dark-700 border border-white/5">
        <button onclick="toggleFaq(this)" class="w-full text-left px-6 py-4 flex items-center justify-between group">
          <span class="font-display font-bold text-sm group-hover:text-neon-pink transition-colors">What should I bring?</span>
          <svg class="w-4 h-4 text-white/20 transition-transform faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer px-6 text-sm text-white/40 leading-relaxed"><div class="pb-4">Sunscreen, comfortable shoes, a portable phone charger, and your ticket (digital or printed). Blankets and low-back chairs are welcome on the lawn areas. No umbrellas, professional cameras, or drones.</div></div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-white/5 py-12">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <p class="font-display font-black text-xl"><span class="text-neon-pink">PULSE</span><span class="text-neon-yellow">FEST</span> <span class="text-white/30">2024</span></p>
        <p class="text-white/20 text-xs mt-1">July 12-14 &bull; Central Park, New York</p>
      </div>
      <div class="flex items-center gap-6 text-white/20 text-xs">
        <a href="#" class="hover:text-neon-pink transition-colors">Instagram</a>
        <a href="#" class="hover:text-neon-pink transition-colors">Twitter</a>
        <a href="#" class="hover:text-neon-pink transition-colors">TikTok</a>
        <a href="#" class="hover:text-neon-pink transition-colors">Spotify</a>
      </div>
    </div>
    <div class="mt-8 pt-6 border-t border-white/5 text-center">
      <p class="text-white/15 text-xs">&copy; 2024 Pulse Fest. All rights reserved. &bull; <a href="#" class="hover:text-white/30">Privacy</a> &bull; <a href="#" class="hover:text-white/30">Terms</a></p>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-neon-pink text-black px-6 py-3 text-sm font-display font-bold translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"></div>

<script>
// Toast
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.remove('translate-y-20','opacity-0');
  setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),2500);
}

// Day switching
function switchDay(day){
  ['fri','sat','sun'].forEach(d=>{
    const el=document.getElementById('day-'+d);
    const btn=document.getElementById('btn-'+d);
    if(d===day){
      el.classList.remove('hidden');
      btn.className='day-tab bg-neon-pink text-black px-6 py-2.5 font-display font-bold text-sm tracking-wider';
    } else {
      el.classList.add('hidden');
      btn.className='day-tab bg-dark-600 text-white/40 border border-white/10 px-6 py-2.5 font-display font-bold text-sm tracking-wider hover:text-white transition-colors';
    }
  });
}

// FAQ toggle
function toggleFaq(btn){
  const answer=btn.nextElementSibling;
  const icon=btn.querySelector('.faq-icon');
  const isOpen=answer.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-answer').forEach(a=>a.classList.remove('open'));
  document.querySelectorAll('.faq-icon').forEach(i=>i.style.transform='');
  if(!isOpen){
    answer.classList.add('open');
    icon.style.transform='rotate(180deg)';
  }
}

// Scroll reveal
const obs=new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}
  });
},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

// Mobile nav close on link click
document.querySelectorAll('#mobile-nav a').forEach(a=>{
  a.addEventListener('click',()=>document.getElementById('mobile-nav').classList.add('hidden'));
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
