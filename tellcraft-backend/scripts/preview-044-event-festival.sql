INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '36e03a29-2e65-49f7-8bd0-0f9c4bb4d441',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NEONWAVE 霓光祭 2026</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        neon: { pink:'#ff2d95', cyan:'#00f0ff', yellow:'#ffe600', purple:'#bf5af2', green:'#30d158' },
        dark: { 50:'#18181b', 100:'#111113', 200:'#0a0a0c', 300:'#050506' }
      },
      fontFamily: { space:['Space Grotesk','Noto Sans TC','sans-serif'] }
    }
  }
}
</script>
<style>
  * { font-family: 'Space Grotesk', 'Noto Sans TC', sans-serif; }
  html { scroll-behavior: smooth; }
  body { background: #050506; color: #e5e5e5; }
  .neon-glow-pink { text-shadow: 0 0 20px rgba(255,45,149,0.5), 0 0 40px rgba(255,45,149,0.3); }
  .neon-glow-cyan { text-shadow: 0 0 20px rgba(0,240,255,0.5), 0 0 40px rgba(0,240,255,0.3); }
  .neon-border-pink { box-shadow: 0 0 15px rgba(255,45,149,0.3), inset 0 0 15px rgba(255,45,149,0.1); border-color: #ff2d95; }
  .neon-border-cyan { box-shadow: 0 0 15px rgba(0,240,255,0.3), inset 0 0 15px rgba(0,240,255,0.1); border-color: #00f0ff; }
  .reveal { opacity:0; transform:translateY(24px); transition:all 0.6s cubic-bezier(0.16,1,0.3,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }
  @keyframes pulse-neon { 0%,100%{ opacity:1; } 50%{ opacity:0.7; } }
  .pulse-neon { animation: pulse-neon 2s ease-in-out infinite; }
  .grid-bg { background-image: linear-gradient(rgba(0,240,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.05) 1px, transparent 1px); background-size: 40px 40px; }
</style>
</head>
<body class="grid-bg">

<!-- Navbar -->
<nav class="fixed top-0 w-full bg-dark-300/90 backdrop-blur-md z-50 border-b border-white/5">
  <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
    <a href="#" class="text-xl font-bold tracking-tight">
      <span class="text-neon-pink">NEON</span><span class="text-neon-cyan">WAVE</span>
    </a>
    <div class="hidden md:flex items-center gap-8 text-sm font-medium text-white/50">
      <a href="#lineup" class="hover:text-neon-cyan transition-colors">陣容</a>
      <a href="#schedule" class="hover:text-neon-cyan transition-colors">時間表</a>
      <a href="#stages" class="hover:text-neon-cyan transition-colors">舞台</a>
      <a href="#tickets" class="hover:text-neon-cyan transition-colors">購票</a>
      <a href="#info" class="hover:text-neon-cyan transition-colors">資訊</a>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="document.getElementById('ticket-modal').classList.remove('hidden')" class="bg-neon-pink text-white px-5 py-2 rounded-sm text-sm font-bold hover:bg-pink-600 transition-colors neon-border-pink border">
        搶票 →
      </button>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-white/50">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-dark-300 border-t border-white/5 px-6 py-4 space-y-3">
    <a href="#lineup" class="block text-sm text-white/50">陣容</a>
    <a href="#schedule" class="block text-sm text-white/50">時間表</a>
    <a href="#stages" class="block text-sm text-white/50">舞台</a>
    <a href="#tickets" class="block text-sm text-white/50">購票</a>
    <a href="#info" class="block text-sm text-white/50">資訊</a>
  </div>
</nav>

<!-- Hero -->
<section class="pt-14 min-h-screen flex items-center justify-center relative overflow-hidden">
  <div class="absolute inset-0 flex items-center justify-center opacity-20">
    <div class="w-[600px] h-[600px] rounded-full bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan blur-[150px]"></div>
  </div>
  <div class="relative z-10 text-center px-6 max-w-4xl mx-auto">
    <div class="inline-flex items-center gap-2 border border-neon-cyan/30 text-neon-cyan px-4 py-1.5 rounded-sm text-sm font-medium mb-8 pulse-neon">
      <span class="w-2 h-2 bg-neon-cyan rounded-full"></span>
      2026.04.18-19 · 台北大佳河濱公園
    </div>
    <h1 class="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-none mb-4">
      <span class="text-neon-pink neon-glow-pink">NEON</span><br>
      <span class="text-neon-cyan neon-glow-cyan">WAVE</span>
    </h1>
    <p class="text-2xl md:text-3xl font-bold text-neon-yellow mt-2 mb-2">霓光祭 2026</p>
    <p class="text-white/40 text-lg mb-10 max-w-lg mx-auto">兩天兩夜 · 四大舞台 · 60+ 組藝人 · 10 萬人共同狂歡</p>
    <!-- Countdown -->
    <div class="flex justify-center gap-4 mb-10" id="countdown">
      <div class="bg-dark-50 border border-white/10 rounded-sm p-4 min-w-[70px]"><span class="block text-3xl font-bold text-neon-pink" id="cd-days">--</span><span class="text-[10px] text-white/40 uppercase tracking-wider">Days</span></div>
      <div class="bg-dark-50 border border-white/10 rounded-sm p-4 min-w-[70px]"><span class="block text-3xl font-bold text-neon-cyan" id="cd-hours">--</span><span class="text-[10px] text-white/40 uppercase tracking-wider">Hours</span></div>
      <div class="bg-dark-50 border border-white/10 rounded-sm p-4 min-w-[70px]"><span class="block text-3xl font-bold text-neon-yellow" id="cd-mins">--</span><span class="text-[10px] text-white/40 uppercase tracking-wider">Mins</span></div>
      <div class="bg-dark-50 border border-white/10 rounded-sm p-4 min-w-[70px]"><span class="block text-3xl font-bold text-neon-green" id="cd-secs">--</span><span class="text-[10px] text-white/40 uppercase tracking-wider">Secs</span></div>
    </div>
    <button onclick="document.getElementById('ticket-modal').classList.remove('hidden')" class="bg-neon-pink text-white px-10 py-4 rounded-sm font-bold text-lg neon-border-pink border hover:bg-pink-600 transition-colors">
      立即購票 🎟️
    </button>
  </div>
</section>

<!-- Lineup -->
<section id="lineup" class="py-24 border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-neon-cyan text-xs tracking-[0.3em] uppercase font-medium">Lineup</span>
      <h2 class="text-4xl md:text-5xl font-bold tracking-tight mt-2">演出陣容</h2>
    </div>
    <!-- Headliners -->
    <div class="grid md:grid-cols-3 gap-4 mb-8">
      <div class="reveal bg-gradient-to-br from-neon-pink/20 to-dark-100 border border-neon-pink/30 rounded-sm p-6 text-center group cursor-pointer hover:neon-border-pink transition-all">
        <span class="text-6xl block mb-4 group-hover:scale-110 transition-transform">🎤</span>
        <span class="text-[10px] text-neon-pink tracking-wider uppercase font-medium">Headliner</span>
        <h3 class="text-2xl font-bold mt-1">9m88</h3>
        <p class="text-white/40 text-sm mt-1">Neo-Soul / R&B</p>
      </div>
      <div class="reveal bg-gradient-to-br from-neon-cyan/20 to-dark-100 border border-neon-cyan/30 rounded-sm p-6 text-center group cursor-pointer hover:neon-border-cyan transition-all">
        <span class="text-6xl block mb-4 group-hover:scale-110 transition-transform">🎸</span>
        <span class="text-[10px] text-neon-cyan tracking-wider uppercase font-medium">Headliner</span>
        <h3 class="text-2xl font-bold mt-1">落日飛車</h3>
        <p class="text-white/40 text-sm mt-1">Indie Pop / Synth</p>
      </div>
      <div class="reveal bg-gradient-to-br from-neon-yellow/20 to-dark-100 border border-neon-yellow/30 rounded-sm p-6 text-center group cursor-pointer">
        <span class="text-6xl block mb-4 group-hover:scale-110 transition-transform">🎧</span>
        <span class="text-[10px] text-neon-yellow tracking-wider uppercase font-medium">Special Guest</span>
        <h3 class="text-2xl font-bold mt-1">Peggy Gou</h3>
        <p class="text-white/40 text-sm mt-1">House / Techno</p>
      </div>
    </div>
    <!-- More Artists -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 reveal">
      <div class="bg-dark-50 border border-white/5 rounded-sm p-3 text-center hover:border-neon-pink/30 transition-colors cursor-pointer"><p class="font-bold text-sm">草東沒有派對</p><p class="text-[10px] text-white/30">Indie Rock</p></div>
      <div class="bg-dark-50 border border-white/5 rounded-sm p-3 text-center hover:border-neon-cyan/30 transition-colors cursor-pointer"><p class="font-bold text-sm">Leo王</p><p class="text-[10px] text-white/30">Hip-Hop</p></div>
      <div class="bg-dark-50 border border-white/5 rounded-sm p-3 text-center hover:border-neon-yellow/30 transition-colors cursor-pointer"><p class="font-bold text-sm">DSPS</p><p class="text-[10px] text-white/30">Dream Pop</p></div>
      <div class="bg-dark-50 border border-white/5 rounded-sm p-3 text-center hover:border-neon-purple/30 transition-colors cursor-pointer"><p class="font-bold text-sm">Sonia Calico</p><p class="text-[10px] text-white/30">Electronic</p></div>
      <div class="bg-dark-50 border border-white/5 rounded-sm p-3 text-center hover:border-neon-green/30 transition-colors cursor-pointer"><p class="font-bold text-sm">告五人</p><p class="text-[10px] text-white/30">Pop Rock</p></div>
      <div class="bg-dark-50 border border-white/5 rounded-sm p-3 text-center hover:border-neon-pink/30 transition-colors cursor-pointer"><p class="font-bold text-sm">鄭宜農</p><p class="text-[10px] text-white/30">Folk / Pop</p></div>
      <div class="bg-dark-50 border border-white/5 rounded-sm p-3 text-center hover:border-neon-cyan/30 transition-colors cursor-pointer"><p class="font-bold text-sm">百合花</p><p class="text-[10px] text-white/30">台語 Rock</p></div>
      <div class="bg-dark-50 border border-white/5 rounded-sm p-3 text-center hover:border-neon-yellow/30 transition-colors cursor-pointer"><p class="font-bold text-sm">Julia Wu</p><p class="text-[10px] text-white/30">R&B / Pop</p></div>
      <div class="bg-dark-50 border border-white/5 rounded-sm p-3 text-center hover:border-neon-purple/30 transition-colors cursor-pointer"><p class="font-bold text-sm">DJ RayRay</p><p class="text-[10px] text-white/30">Bass Music</p></div>
      <div class="bg-dark-50 border border-white/5 rounded-sm p-3 text-center hover:border-neon-green/30 transition-colors cursor-pointer"><p class="font-bold text-sm">老王樂隊</p><p class="text-[10px] text-white/30">Indie Folk</p></div>
      <div class="bg-dark-50 border border-white/5 rounded-sm p-3 text-center hover:border-neon-pink/30 transition-colors cursor-pointer"><p class="font-bold text-sm">夕陽武士</p><p class="text-[10px] text-white/30">Shoegaze</p></div>
      <div class="bg-dark-50 border border-white/5 rounded-sm p-3 text-center hover:border-neon-cyan/30 transition-colors cursor-pointer"><p class="font-bold text-sm">+ 更多</p><p class="text-[10px] text-white/30">即將公布</p></div>
    </div>
  </div>
</section>

<!-- Schedule -->
<section id="schedule" class="py-24 border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-neon-yellow text-xs tracking-[0.3em] uppercase font-medium">Schedule</span>
      <h2 class="text-4xl md:text-5xl font-bold tracking-tight mt-2">演出時間表</h2>
    </div>
    <div class="flex justify-center gap-3 mb-8 reveal">
      <button onclick="switchDay('day1')" id="btn-day1" class="day-btn bg-neon-pink text-white px-6 py-2.5 rounded-sm font-bold text-sm">DAY 1 · 4/18 (六)</button>
      <button onclick="switchDay('day2')" id="btn-day2" class="day-btn bg-dark-50 text-white/50 border border-white/10 px-6 py-2.5 rounded-sm font-bold text-sm hover:text-white transition-colors">DAY 2 · 4/19 (日)</button>
    </div>
    <div id="schedule-day1" class="space-y-2 reveal">
      <div class="grid grid-cols-[80px_1fr_120px] items-center bg-dark-50 border border-white/5 rounded-sm px-4 py-3"><span class="text-sm text-neon-cyan font-mono">14:00</span><span class="font-semibold text-sm">DSPS</span><span class="text-[10px] text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded text-center">霓虹舞台</span></div>
      <div class="grid grid-cols-[80px_1fr_120px] items-center bg-dark-50 border border-white/5 rounded-sm px-4 py-3"><span class="text-sm text-neon-pink font-mono">14:00</span><span class="font-semibold text-sm">百合花</span><span class="text-[10px] text-neon-pink bg-neon-pink/10 px-2 py-0.5 rounded text-center">脈動舞台</span></div>
      <div class="grid grid-cols-[80px_1fr_120px] items-center bg-dark-50 border border-white/5 rounded-sm px-4 py-3"><span class="text-sm text-neon-cyan font-mono">15:30</span><span class="font-semibold text-sm">老王樂隊</span><span class="text-[10px] text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded text-center">霓虹舞台</span></div>
      <div class="grid grid-cols-[80px_1fr_120px] items-center bg-dark-50 border border-white/5 rounded-sm px-4 py-3"><span class="text-sm text-neon-yellow font-mono">16:00</span><span class="font-semibold text-sm">Sonia Calico</span><span class="text-[10px] text-neon-yellow bg-neon-yellow/10 px-2 py-0.5 rounded text-center">電波舞台</span></div>
      <div class="grid grid-cols-[80px_1fr_120px] items-center bg-dark-50 border border-white/5 rounded-sm px-4 py-3"><span class="text-sm text-neon-cyan font-mono">17:30</span><span class="font-semibold text-sm">告五人</span><span class="text-[10px] text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded text-center">霓虹舞台</span></div>
      <div class="grid grid-cols-[80px_1fr_120px] items-center bg-dark-50 border border-neon-pink/20 rounded-sm px-4 py-3"><span class="text-sm text-neon-pink font-mono font-bold">19:00</span><span class="font-bold text-sm text-neon-pink">9m88 ⭐</span><span class="text-[10px] text-neon-pink bg-neon-pink/10 px-2 py-0.5 rounded text-center">脈動舞台</span></div>
      <div class="grid grid-cols-[80px_1fr_120px] items-center bg-dark-50 border border-white/5 rounded-sm px-4 py-3"><span class="text-sm text-neon-yellow font-mono">21:00</span><span class="font-semibold text-sm">DJ RayRay</span><span class="text-[10px] text-neon-yellow bg-neon-yellow/10 px-2 py-0.5 rounded text-center">電波舞台</span></div>
      <div class="grid grid-cols-[80px_1fr_120px] items-center bg-dark-50 border border-neon-cyan/20 rounded-sm px-4 py-3"><span class="text-sm text-neon-cyan font-mono font-bold">21:30</span><span class="font-bold text-sm text-neon-cyan">落日飛車 ⭐</span><span class="text-[10px] text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded text-center">霓虹舞台</span></div>
    </div>
    <div id="schedule-day2" class="space-y-2 reveal hidden">
      <div class="grid grid-cols-[80px_1fr_120px] items-center bg-dark-50 border border-white/5 rounded-sm px-4 py-3"><span class="text-sm text-neon-pink font-mono">13:00</span><span class="font-semibold text-sm">夕陽武士</span><span class="text-[10px] text-neon-pink bg-neon-pink/10 px-2 py-0.5 rounded text-center">脈動舞台</span></div>
      <div class="grid grid-cols-[80px_1fr_120px] items-center bg-dark-50 border border-white/5 rounded-sm px-4 py-3"><span class="text-sm text-neon-cyan font-mono">14:30</span><span class="font-semibold text-sm">鄭宜農</span><span class="text-[10px] text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded text-center">霓虹舞台</span></div>
      <div class="grid grid-cols-[80px_1fr_120px] items-center bg-dark-50 border border-white/5 rounded-sm px-4 py-3"><span class="text-sm text-neon-pink font-mono">16:00</span><span class="font-semibold text-sm">Leo王</span><span class="text-[10px] text-neon-pink bg-neon-pink/10 px-2 py-0.5 rounded text-center">脈動舞台</span></div>
      <div class="grid grid-cols-[80px_1fr_120px] items-center bg-dark-50 border border-white/5 rounded-sm px-4 py-3"><span class="text-sm text-neon-cyan font-mono">17:30</span><span class="font-semibold text-sm">Julia Wu</span><span class="text-[10px] text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded text-center">霓虹舞台</span></div>
      <div class="grid grid-cols-[80px_1fr_120px] items-center bg-dark-50 border border-neon-pink/20 rounded-sm px-4 py-3"><span class="text-sm text-neon-pink font-mono font-bold">19:00</span><span class="font-bold text-sm text-neon-pink">草東沒有派對 ⭐</span><span class="text-[10px] text-neon-pink bg-neon-pink/10 px-2 py-0.5 rounded text-center">脈動舞台</span></div>
      <div class="grid grid-cols-[80px_1fr_120px] items-center bg-dark-50 border border-neon-yellow/20 rounded-sm px-4 py-3"><span class="text-sm text-neon-yellow font-mono font-bold">21:00</span><span class="font-bold text-sm text-neon-yellow">Peggy Gou ⭐</span><span class="text-[10px] text-neon-yellow bg-neon-yellow/10 px-2 py-0.5 rounded text-center">電波舞台</span></div>
    </div>
  </div>
</section>

<!-- Stages -->
<section id="stages" class="py-24 border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-neon-green text-xs tracking-[0.3em] uppercase font-medium">Stages</span>
      <h2 class="text-4xl md:text-5xl font-bold tracking-tight mt-2">四大舞台</h2>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="reveal bg-dark-50 border border-neon-cyan/20 rounded-sm p-6 text-center hover:neon-border-cyan transition-all cursor-pointer">
        <span class="text-4xl block mb-3">🌈</span>
        <h3 class="font-bold text-neon-cyan text-lg">霓虹舞台</h3>
        <p class="text-white/40 text-sm mt-2">主舞台 · 容量 30,000</p>
        <p class="text-white/30 text-xs mt-1">Indie / Rock / Pop</p>
      </div>
      <div class="reveal bg-dark-50 border border-neon-pink/20 rounded-sm p-6 text-center hover:neon-border-pink transition-all cursor-pointer">
        <span class="text-4xl block mb-3">💓</span>
        <h3 class="font-bold text-neon-pink text-lg">脈動舞台</h3>
        <p class="text-white/40 text-sm mt-2">次舞台 · 容量 15,000</p>
        <p class="text-white/30 text-xs mt-1">Hip-Hop / R&B / Soul</p>
      </div>
      <div class="reveal bg-dark-50 border border-neon-yellow/20 rounded-sm p-6 text-center cursor-pointer">
        <span class="text-4xl block mb-3">⚡</span>
        <h3 class="font-bold text-neon-yellow text-lg">電波舞台</h3>
        <p class="text-white/40 text-sm mt-2">電音區 · 容量 10,000</p>
        <p class="text-white/30 text-xs mt-1">House / Techno / Bass</p>
      </div>
      <div class="reveal bg-dark-50 border border-neon-green/20 rounded-sm p-6 text-center cursor-pointer">
        <span class="text-4xl block mb-3">🌿</span>
        <h3 class="font-bold text-neon-green text-lg">秘境舞台</h3>
        <p class="text-white/40 text-sm mt-2">草地區 · 容量 5,000</p>
        <p class="text-white/30 text-xs mt-1">Folk / Acoustic / Chill</p>
      </div>
    </div>
  </div>
</section>

<!-- Tickets -->
<section id="tickets" class="py-24 border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-neon-pink text-xs tracking-[0.3em] uppercase font-medium">Tickets</span>
      <h2 class="text-4xl md:text-5xl font-bold tracking-tight mt-2">票種方案</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-5">
      <div class="reveal bg-dark-50 border border-white/10 rounded-sm p-7 hover:border-neon-cyan/30 transition-colors">
        <h3 class="font-bold text-lg">單日票</h3>
        <p class="text-white/40 text-sm mt-1 mb-5">任選一天入場</p>
        <div class="mb-6"><span class="text-4xl font-bold text-neon-cyan">$2,800</span></div>
        <div class="space-y-2 text-sm text-white/50 mb-6">
          <div class="flex items-center gap-2"><span class="text-neon-cyan">✓</span>單日四大舞台通行</div>
          <div class="flex items-center gap-2"><span class="text-neon-cyan">✓</span>市集消費折扣</div>
          <div class="flex items-center gap-2 text-white/20"><span>✕</span>VIP 休息區</div>
          <div class="flex items-center gap-2 text-white/20"><span>✕</span>限定周邊</div>
        </div>
        <button onclick="showToast('單日票已加入購物車 🎟️')" class="w-full border border-neon-cyan/50 text-neon-cyan py-2.5 rounded-sm font-bold text-sm hover:bg-neon-cyan/10 transition-colors">選擇</button>
      </div>
      <div class="reveal bg-dark-50 border-2 border-neon-pink rounded-sm p-7 neon-border-pink relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-neon-pink text-white px-3 py-0.5 rounded-sm text-xs font-bold">熱賣中 🔥</div>
        <h3 class="font-bold text-lg">雙日票</h3>
        <p class="text-white/40 text-sm mt-1 mb-5">兩天全程通行</p>
        <div class="mb-6"><span class="text-4xl font-bold text-neon-pink">$4,800</span><span class="text-white/30 text-sm line-through ml-2">$5,600</span></div>
        <div class="space-y-2 text-sm text-white/50 mb-6">
          <div class="flex items-center gap-2"><span class="text-neon-pink">✓</span>雙日四大舞台通行</div>
          <div class="flex items-center gap-2"><span class="text-neon-pink">✓</span>市集消費折扣</div>
          <div class="flex items-center gap-2"><span class="text-neon-pink">✓</span>限定紀念手環</div>
          <div class="flex items-center gap-2 text-white/20"><span>✕</span>VIP 休息區</div>
        </div>
        <button onclick="showToast('雙日票已加入購物車 🎟️')" class="w-full bg-neon-pink text-white py-2.5 rounded-sm font-bold text-sm hover:bg-pink-600 transition-colors">選擇</button>
      </div>
      <div class="reveal bg-dark-50 border border-neon-yellow/30 rounded-sm p-7">
        <h3 class="font-bold text-lg">VIP 雙日</h3>
        <p class="text-white/40 text-sm mt-1 mb-5">極致體驗</p>
        <div class="mb-6"><span class="text-4xl font-bold text-neon-yellow">$9,800</span></div>
        <div class="space-y-2 text-sm text-white/50 mb-6">
          <div class="flex items-center gap-2"><span class="text-neon-yellow">✓</span>雙日四大舞台通行</div>
          <div class="flex items-center gap-2"><span class="text-neon-yellow">✓</span>VIP 專屬休息區</div>
          <div class="flex items-center gap-2"><span class="text-neon-yellow">✓</span>免費酒水暢飲</div>
          <div class="flex items-center gap-2"><span class="text-neon-yellow">✓</span>限定周邊禮包</div>
        </div>
        <button onclick="showToast('VIP 票已加入購物車 🎟️')" class="w-full border border-neon-yellow/50 text-neon-yellow py-2.5 rounded-sm font-bold text-sm hover:bg-neon-yellow/10 transition-colors">選擇</button>
      </div>
    </div>
    <div class="text-center mt-8 reveal">
      <div class="inline-flex items-center gap-2 text-sm text-white/30">
        <span class="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>
        剩餘票數：雙日票 剩 1,247 張 · VIP 剩 89 張
      </div>
    </div>
  </div>
</section>

<!-- Info -->
<section id="info" class="py-24 border-t border-white/5">
  <div class="max-w-4xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-neon-purple text-xs tracking-[0.3em] uppercase font-medium">Info</span>
      <h2 class="text-4xl font-bold tracking-tight mt-2">活動資訊</h2>
    </div>
    <div class="grid sm:grid-cols-2 gap-4 reveal">
      <div class="bg-dark-50 border border-white/5 rounded-sm p-5"><span class="text-xl mb-2 block">📍</span><h4 class="font-bold text-sm">地點</h4><p class="text-white/40 text-sm mt-1">台北大佳河濱公園（中山區濱江街）</p></div>
      <div class="bg-dark-50 border border-white/5 rounded-sm p-5"><span class="text-xl mb-2 block">📅</span><h4 class="font-bold text-sm">日期</h4><p class="text-white/40 text-sm mt-1">2026/4/18 (六) - 4/19 (日)</p></div>
      <div class="bg-dark-50 border border-white/5 rounded-sm p-5"><span class="text-xl mb-2 block">⏰</span><h4 class="font-bold text-sm">時間</h4><p class="text-white/40 text-sm mt-1">DAY1 12:00-23:00 · DAY2 12:00-22:00</p></div>
      <div class="bg-dark-50 border border-white/5 rounded-sm p-5"><span class="text-xl mb-2 block">🚇</span><h4 class="font-bold text-sm">交通</h4><p class="text-white/40 text-sm mt-1">捷運圓山站 1 號出口，接駁車 5 分鐘</p></div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-white/5 py-10">
  <div class="max-w-6xl mx-auto px-6 text-center">
    <p class="text-xl font-bold mb-3"><span class="text-neon-pink">NEON</span><span class="text-neon-cyan">WAVE</span> <span class="text-neon-yellow">2026</span></p>
    <p class="text-white/30 text-xs">© 2026 NEONWAVE 霓光祭. All rights reserved.</p>
  </div>
</footer>

<!-- Ticket Modal -->
<div id="ticket-modal" class="hidden fixed inset-0 z-[60] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="this.parentElement.classList.add('hidden')"></div>
  <div class="relative bg-dark-100 border border-white/10 rounded-sm p-8 max-w-md w-full shadow-2xl">
    <button onclick="this.closest('#ticket-modal').classList.add('hidden')" class="absolute top-4 right-4 text-white/30 hover:text-white text-xl">✕</button>
    <h3 class="text-2xl font-bold mb-2">購票 <span class="text-neon-pink">🎟️</span></h3>
    <p class="text-white/40 text-sm mb-6">選擇票種並填寫資訊</p>
    <div class="space-y-4">
      <div><label class="text-xs text-white/40 mb-1 block">姓名</label><input type="text" placeholder="真實姓名（入場核對）" class="w-full bg-dark-50 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-neon-pink outline-none"></div>
      <div><label class="text-xs text-white/40 mb-1 block">Email</label><input type="email" placeholder="接收電子票券" class="w-full bg-dark-50 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-neon-pink outline-none"></div>
      <div><label class="text-xs text-white/40 mb-1 block">票種</label>
        <select class="w-full bg-dark-50 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:border-neon-pink outline-none">
          <option>單日票 $2,800</option><option>雙日票 $4,800（熱賣中）</option><option>VIP 雙日 $9,800</option>
        </select>
      </div>
      <div><label class="text-xs text-white/40 mb-1 block">張數</label>
        <select class="w-full bg-dark-50 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:border-neon-pink outline-none">
          <option>1 張</option><option>2 張</option><option>3 張</option><option>4 張（上限）</option>
        </select>
      </div>
      <button onclick="showToast('購票成功！電子票券已寄至信箱 🎉');this.closest('#ticket-modal').classList.add('hidden')" class="w-full bg-neon-pink text-white py-3 rounded-sm font-bold hover:bg-pink-600 transition-colors neon-border-pink border">確認購票</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-neon-pink text-white px-6 py-3 rounded-sm shadow-2xl text-sm font-bold translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"></div>

<script>
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),2500);}
function switchDay(day){
  document.getElementById('schedule-day1').classList.toggle('hidden',day!=='day1');
  document.getElementById('schedule-day2').classList.toggle('hidden',day!=='day2');
  document.getElementById('btn-day1').className=day==='day1'?'day-btn bg-neon-pink text-white px-6 py-2.5 rounded-sm font-bold text-sm':'day-btn bg-dark-50 text-white/50 border border-white/10 px-6 py-2.5 rounded-sm font-bold text-sm hover:text-white transition-colors';
  document.getElementById('btn-day2').className=day==='day2'?'day-btn bg-neon-pink text-white px-6 py-2.5 rounded-sm font-bold text-sm':'day-btn bg-dark-50 text-white/50 border border-white/10 px-6 py-2.5 rounded-sm font-bold text-sm hover:text-white transition-colors';
}
// Countdown
const target=new Date('2026-04-18T12:00:00+08:00').getTime();
function updateCD(){const n=Date.now(),d=target-n;if(d<0)return;document.getElementById('cd-days').textContent=Math.floor(d/86400000);document.getElementById('cd-hours').textContent=Math.floor((d%86400000)/3600000);document.getElementById('cd-mins').textContent=Math.floor((d%3600000)/60000);document.getElementById('cd-secs').textContent=Math.floor((d%60000)/1000);}
updateCD();setInterval(updateCD,1000);
const obs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:0.15});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',()=>{document.getElementById('mobile-menu').classList.add('hidden');});});
</script>
</body>
</html>
$HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
