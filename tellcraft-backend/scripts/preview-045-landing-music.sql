INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '6c3b45bb-3e73-40b9-890d-aaf995f33575',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SoundWave — Feel the Music</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        sw: {
          black: '#09090b',
          dark: '#0f0f11',
          card: '#141416',
          border: '#1e1e22',
          purple: '#a855f7',
          'purple-dark': '#7c3aed',
          pink: '#ec4899',
          amber: '#f59e0b',
          'amber-dark': '#d97706',
          muted: '#71717a',
          light: '#e4e4e7'
        }
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #09090b; color: #e4e4e7; overflow-x: hidden; }
  h1, h2, h3, h4, .font-display { font-family: 'Unbounded', sans-serif; }
  html { scroll-behavior: smooth; }

  /* Equalizer Animation */
  @keyframes eq-bounce {
    0%, 100% { height: 8px; }
    10% { height: 45%; }
    20% { height: 20%; }
    30% { height: 70%; }
    40% { height: 15%; }
    50% { height: 90%; }
    60% { height: 35%; }
    70% { height: 60%; }
    80% { height: 25%; }
    90% { height: 75%; }
  }
  @keyframes eq-bounce-alt {
    0%, 100% { height: 12px; }
    15% { height: 80%; }
    25% { height: 30%; }
    35% { height: 55%; }
    45% { height: 85%; }
    55% { height: 20%; }
    65% { height: 65%; }
    75% { height: 40%; }
    85% { height: 70%; }
    95% { height: 15%; }
  }
  .eq-bar {
    animation: eq-bounce 1.8s ease-in-out infinite;
    transform-origin: bottom;
    min-height: 8px;
  }
  .eq-bar:nth-child(odd) {
    animation-name: eq-bounce-alt;
  }
  .eq-bar:nth-child(1)  { animation-delay: 0s; animation-duration: 1.6s; }
  .eq-bar:nth-child(2)  { animation-delay: 0.15s; animation-duration: 1.4s; }
  .eq-bar:nth-child(3)  { animation-delay: 0.05s; animation-duration: 1.9s; }
  .eq-bar:nth-child(4)  { animation-delay: 0.25s; animation-duration: 1.5s; }
  .eq-bar:nth-child(5)  { animation-delay: 0.1s; animation-duration: 1.7s; }
  .eq-bar:nth-child(6)  { animation-delay: 0.3s; animation-duration: 1.3s; }
  .eq-bar:nth-child(7)  { animation-delay: 0.08s; animation-duration: 2.0s; }
  .eq-bar:nth-child(8)  { animation-delay: 0.2s; animation-duration: 1.6s; }
  .eq-bar:nth-child(9)  { animation-delay: 0.12s; animation-duration: 1.8s; }
  .eq-bar:nth-child(10) { animation-delay: 0.22s; animation-duration: 1.4s; }
  .eq-bar:nth-child(11) { animation-delay: 0.07s; animation-duration: 1.9s; }
  .eq-bar:nth-child(12) { animation-delay: 0.28s; animation-duration: 1.5s; }
  .eq-bar:nth-child(13) { animation-delay: 0.03s; animation-duration: 1.7s; }
  .eq-bar:nth-child(14) { animation-delay: 0.18s; animation-duration: 2.1s; }
  .eq-bar:nth-child(15) { animation-delay: 0.35s; animation-duration: 1.6s; }
  .eq-bar:nth-child(16) { animation-delay: 0.09s; animation-duration: 1.8s; }

  .eq-bar-small {
    animation: eq-bounce 1.2s ease-in-out infinite;
    transform-origin: bottom;
    min-height: 4px;
  }
  .eq-bar-small:nth-child(odd) { animation-name: eq-bounce-alt; }
  .eq-bar-small:nth-child(1) { animation-delay: 0s; }
  .eq-bar-small:nth-child(2) { animation-delay: 0.1s; }
  .eq-bar-small:nth-child(3) { animation-delay: 0.2s; }
  .eq-bar-small:nth-child(4) { animation-delay: 0.05s; }
  .eq-bar-small:nth-child(5) { animation-delay: 0.15s; }

  /* Gradient text */
  .gradient-text {
    background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f59e0b 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .gradient-text-purple {
    background: linear-gradient(135deg, #a855f7, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Gradient backgrounds */
  .gradient-purple-pink { background: linear-gradient(135deg, #a855f7, #ec4899); }
  .gradient-btn:hover { box-shadow: 0 0 30px rgba(168, 85, 247, 0.4); }

  /* Vinyl texture overlay */
  .vinyl-texture {
    background:
      radial-gradient(ellipse at 20% 50%, rgba(168,85,247,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 50%, rgba(236,72,153,0.04) 0%, transparent 50%);
  }

  /* Scroll reveal */
  .reveal { opacity: 0; transform: translateY(28px); transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  /* Horizontal scroll for artist cards */
  .artist-scroll { display: flex; gap: 1.25rem; overflow-x: auto; padding-bottom: 1rem; scroll-snap-type: x mandatory; -ms-overflow-style: none; scrollbar-width: none; }
  .artist-scroll::-webkit-scrollbar { display: none; }
  .artist-scroll > * { scroll-snap-align: start; flex-shrink: 0; }

  /* Player progress */
  .progress-track { position: relative; height: 4px; background: #1e1e22; border-radius: 2px; cursor: pointer; }
  .progress-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #a855f7, #ec4899); transition: width 0.3s; }
  .progress-track:hover .progress-fill { height: 6px; margin-top: -1px; }

  /* Neon glow */
  .neon-purple { text-shadow: 0 0 40px rgba(168,85,247,0.5), 0 0 80px rgba(168,85,247,0.2); }
  .glow-ring { box-shadow: 0 0 0 2px rgba(168,85,247,0.3), 0 0 20px rgba(168,85,247,0.15); }

  /* Event card left border */
  .event-border-purple { border-left: 3px solid #a855f7; }
  .event-border-pink { border-left: 3px solid #ec4899; }
  .event-border-amber { border-left: 3px solid #f59e0b; }

  /* Player bar safe space */
  body { padding-bottom: 80px; }
</style>
</head>
<body>

<!-- ==================== NAVBAR ==================== -->
<nav class="fixed top-0 w-full bg-sw-black/90 backdrop-blur-xl z-50 border-b border-sw-border/50">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-3 group">
      <!-- Audio wave icon -->
      <div class="flex items-end gap-[3px] h-6">
        <div class="eq-bar-small w-[3px] bg-sw-purple rounded-full"></div>
        <div class="eq-bar-small w-[3px] bg-sw-pink rounded-full"></div>
        <div class="eq-bar-small w-[3px] bg-sw-purple rounded-full"></div>
        <div class="eq-bar-small w-[3px] bg-sw-pink rounded-full"></div>
        <div class="eq-bar-small w-[3px] bg-sw-purple rounded-full"></div>
      </div>
      <span class="font-display font-bold text-lg tracking-tight">SoundWave</span>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#artists" class="text-sm text-sw-muted hover:text-sw-purple transition-colors font-medium">Artists</a>
      <a href="#events" class="text-sm text-sw-muted hover:text-sw-purple transition-colors font-medium">Events</a>
      <a href="#studio" class="text-sm text-sw-muted hover:text-sw-purple transition-colors font-medium">Studio</a>
      <a href="#listen" class="text-sm text-sw-muted hover:text-sw-purple transition-colors font-medium">Listen</a>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="document.getElementById('cta-modal').classList.remove('hidden')" class="gradient-purple-pink gradient-btn text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer">
        Get Started
      </button>
      <button onclick="document.getElementById('mobile-nav').classList.toggle('hidden')" class="md:hidden text-sw-muted hover:text-white cursor-pointer">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <!-- Mobile menu -->
  <div id="mobile-nav" class="hidden md:hidden bg-sw-dark border-t border-sw-border/50 px-6 py-4 space-y-3">
    <a href="#artists" class="block text-sm text-sw-muted hover:text-sw-purple">Artists</a>
    <a href="#events" class="block text-sm text-sw-muted hover:text-sw-purple">Events</a>
    <a href="#studio" class="block text-sm text-sw-muted hover:text-sw-purple">Studio</a>
    <a href="#listen" class="block text-sm text-sw-muted hover:text-sw-purple">Listen</a>
  </div>
</nav>

<!-- ==================== HERO WITH EQUALIZER ==================== -->
<section class="pt-16 min-h-screen flex items-center relative overflow-hidden vinyl-texture">
  <!-- Background blur orbs -->
  <div class="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-sw-purple/10 blur-[150px]"></div>
  <div class="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-sw-pink/8 blur-[120px]"></div>

  <div class="relative z-10 max-w-7xl mx-auto px-6 w-full">
    <div class="text-center">
      <!-- SIGNATURE: Equalizer Bars -->
      <div class="flex items-end justify-center gap-[6px] h-48 md:h-64 mb-10" id="hero-equalizer">
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-purple to-sw-pink opacity-80"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-pink to-sw-amber opacity-90"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-purple to-sw-pink opacity-70"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-amber to-sw-pink opacity-85"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-purple to-sw-amber opacity-75"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-pink to-sw-purple opacity-95"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-purple to-sw-pink opacity-80"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-amber to-sw-purple opacity-70"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-pink to-sw-amber opacity-90"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-purple to-sw-pink opacity-85"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-pink to-sw-purple opacity-75"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-amber to-sw-pink opacity-80"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-purple to-sw-amber opacity-90"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-pink to-sw-purple opacity-70"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-purple to-sw-pink opacity-85"></div>
        <div class="eq-bar w-3 md:w-4 rounded-t-sm bg-gradient-to-t from-sw-amber to-sw-purple opacity-80"></div>
      </div>

      <!-- Hero text overlaid -->
      <h1 class="font-display text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-6 neon-purple">
        <span class="gradient-text-purple">Feel the</span><br>
        <span class="gradient-text">Music</span>
      </h1>
      <p class="text-sw-muted text-lg md:text-xl max-w-2xl mx-auto mb-10 font-body leading-relaxed">
        Discover emerging artists, experience live events, and immerse yourself in sound like never before.
      </p>

      <!-- Play button -->
      <div class="flex justify-center mb-8">
        <button id="hero-play-btn" onclick="toggleHeroPlay()" class="w-20 h-20 rounded-full gradient-purple-pink flex items-center justify-center shadow-xl shadow-sw-purple/30 hover:scale-110 transition-transform duration-300 glow-ring cursor-pointer">
          <svg id="play-icon" class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          <svg id="pause-icon" class="w-8 h-8 text-white hidden" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
        </button>
      </div>

      <div class="flex justify-center gap-6 text-sm text-sw-muted">
        <span class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-sw-purple animate-pulse"></span>
          Live Streaming
        </span>
        <span class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-sw-pink animate-pulse"></span>
          50K+ Tracks
        </span>
        <span class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-sw-amber animate-pulse"></span>
          200+ Artists
        </span>
      </div>
    </div>
  </div>
</section>

<!-- ==================== WAVEFORM DIVIDER 1 ==================== -->
<div class="w-full overflow-hidden" style="margin-top: -2px;">
  <svg viewBox="0 0 1440 120" preserveAspectRatio="none" class="w-full h-16 md:h-24" fill="none">
    <defs>
      <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#a855f7" stop-opacity="0.6"/>
        <stop offset="50%" stop-color="#ec4899" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#a855f7" stop-opacity="0.6"/>
      </linearGradient>
    </defs>
    <path d="M0,60 C120,20 240,100 360,60 C480,20 600,100 720,60 C840,20 960,100 1080,60 C1200,20 1320,100 1440,60" stroke="url(#wave-grad-1)" stroke-width="2" fill="none"/>
    <path d="M0,70 C120,30 240,110 360,70 C480,30 600,110 720,70 C840,30 960,110 1080,70 C1200,30 1320,110 1440,70" stroke="url(#wave-grad-1)" stroke-width="1" fill="none" opacity="0.4"/>
    <path d="M0,50 C120,10 240,90 360,50 C480,10 600,90 720,50 C840,10 960,90 1080,50 C1200,10 1320,90 1440,50" stroke="url(#wave-grad-1)" stroke-width="1" fill="none" opacity="0.3"/>
  </svg>
</div>

<!-- ==================== FEATURED ARTISTS ==================== -->
<section id="artists" class="py-20 md:py-28 vinyl-texture">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex items-end justify-between mb-10 reveal">
      <div>
        <span class="text-sw-purple text-xs tracking-[0.3em] uppercase font-semibold font-body">Featured</span>
        <h2 class="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">Trending Artists</h2>
      </div>
      <a href="#" class="hidden md:flex items-center gap-2 text-sm text-sw-muted hover:text-sw-purple transition-colors font-medium">
        View All
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </a>
    </div>
    <!-- Horizontal scroll -->
    <div class="artist-scroll reveal">
      <!-- Artist 1 -->
      <div class="w-56 bg-sw-card border border-sw-border rounded-2xl p-5 hover:border-sw-purple/40 transition-all group cursor-pointer hover:shadow-lg hover:shadow-sw-purple/5">
        <div class="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-sw-purple/30 to-sw-pink/20 border-2 border-sw-purple/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
          <svg class="w-10 h-10 text-sw-purple/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
        <h3 class="font-display font-bold text-center text-sm mb-1">Luna Echo</h3>
        <p class="text-center text-xs text-sw-muted mb-3">Electronic / Ambient</p>
        <div class="flex justify-center">
          <span class="px-3 py-1 rounded-full text-[10px] font-semibold bg-sw-purple/15 text-sw-purple border border-sw-purple/20">Trending</span>
        </div>
      </div>
      <!-- Artist 2 -->
      <div class="w-56 bg-sw-card border border-sw-border rounded-2xl p-5 hover:border-sw-pink/40 transition-all group cursor-pointer hover:shadow-lg hover:shadow-sw-pink/5">
        <div class="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-sw-pink/30 to-sw-amber/20 border-2 border-sw-pink/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
          <svg class="w-10 h-10 text-sw-pink/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
        <h3 class="font-display font-bold text-center text-sm mb-1">Neon Drift</h3>
        <p class="text-center text-xs text-sw-muted mb-3">Synthwave / Pop</p>
        <div class="flex justify-center">
          <span class="px-3 py-1 rounded-full text-[10px] font-semibold bg-sw-pink/15 text-sw-pink border border-sw-pink/20">New Release</span>
        </div>
      </div>
      <!-- Artist 3 -->
      <div class="w-56 bg-sw-card border border-sw-border rounded-2xl p-5 hover:border-sw-amber/40 transition-all group cursor-pointer hover:shadow-lg hover:shadow-sw-amber/5">
        <div class="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-sw-amber/30 to-sw-purple/20 border-2 border-sw-amber/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
          <svg class="w-10 h-10 text-sw-amber/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
        <h3 class="font-display font-bold text-center text-sm mb-1">Velvet Bass</h3>
        <p class="text-center text-xs text-sw-muted mb-3">Hip-Hop / R&B</p>
        <div class="flex justify-center">
          <span class="px-3 py-1 rounded-full text-[10px] font-semibold bg-sw-amber/15 text-sw-amber border border-sw-amber/20">Featured</span>
        </div>
      </div>
      <!-- Artist 4 -->
      <div class="w-56 bg-sw-card border border-sw-border rounded-2xl p-5 hover:border-sw-purple/40 transition-all group cursor-pointer hover:shadow-lg hover:shadow-sw-purple/5">
        <div class="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-sw-purple/30 to-sw-pink/20 border-2 border-sw-purple/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
          <svg class="w-10 h-10 text-sw-purple/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
        <h3 class="font-display font-bold text-center text-sm mb-1">Kira Waves</h3>
        <p class="text-center text-xs text-sw-muted mb-3">Indie / Dream Pop</p>
        <div class="flex justify-center">
          <span class="px-3 py-1 rounded-full text-[10px] font-semibold bg-sw-purple/15 text-sw-purple border border-sw-purple/20">Rising</span>
        </div>
      </div>
      <!-- Artist 5 -->
      <div class="w-56 bg-sw-card border border-sw-border rounded-2xl p-5 hover:border-sw-pink/40 transition-all group cursor-pointer hover:shadow-lg hover:shadow-sw-pink/5">
        <div class="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-sw-pink/30 to-sw-purple/20 border-2 border-sw-pink/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
          <svg class="w-10 h-10 text-sw-pink/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
        <h3 class="font-display font-bold text-center text-sm mb-1">PRISM</h3>
        <p class="text-center text-xs text-sw-muted mb-3">EDM / House</p>
        <div class="flex justify-center">
          <span class="px-3 py-1 rounded-full text-[10px] font-semibold bg-sw-pink/15 text-sw-pink border border-sw-pink/20">Hot</span>
        </div>
      </div>
      <!-- Artist 6 -->
      <div class="w-56 bg-sw-card border border-sw-border rounded-2xl p-5 hover:border-sw-amber/40 transition-all group cursor-pointer hover:shadow-lg hover:shadow-sw-amber/5">
        <div class="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-sw-amber/30 to-sw-pink/20 border-2 border-sw-amber/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
          <svg class="w-10 h-10 text-sw-amber/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
        <h3 class="font-display font-bold text-center text-sm mb-1">Axel Storm</h3>
        <p class="text-center text-xs text-sw-muted mb-3">Rock / Alternative</p>
        <div class="flex justify-center">
          <span class="px-3 py-1 rounded-full text-[10px] font-semibold bg-sw-amber/15 text-sw-amber border border-sw-amber/20">Live Soon</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ==================== WAVEFORM DIVIDER 2 ==================== -->
<div class="w-full overflow-hidden">
  <svg viewBox="0 0 1440 100" preserveAspectRatio="none" class="w-full h-12 md:h-20" fill="none">
    <defs>
      <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ec4899" stop-opacity="0.5"/>
        <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#ec4899" stop-opacity="0.5"/>
      </linearGradient>
    </defs>
    <path d="M0,50 C80,20 160,80 240,50 C320,20 400,80 480,50 C560,20 640,80 720,50 C800,20 880,80 960,50 C1040,20 1120,80 1200,50 C1280,20 1360,80 1440,50" stroke="url(#wave-grad-2)" stroke-width="2" fill="none"/>
    <path d="M0,55 C80,25 160,85 240,55 C320,25 400,85 480,55 C560,25 640,85 720,55 C800,25 880,85 960,55 C1040,25 1120,85 1200,55 C1280,25 1360,85 1440,55" stroke="url(#wave-grad-2)" stroke-width="1" fill="none" opacity="0.35"/>
  </svg>
</div>

<!-- ==================== UPCOMING EVENTS ==================== -->
<section id="events" class="py-20 md:py-28">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-sw-pink text-xs tracking-[0.3em] uppercase font-semibold font-body">Upcoming</span>
      <h2 class="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">Live Events</h2>
      <p class="text-sw-muted mt-3 max-w-lg mx-auto">Experience the energy of live music. Grab your tickets before they sell out.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6 reveal">
      <!-- Event 1 -->
      <div class="bg-sw-card border border-sw-border rounded-xl overflow-hidden event-border-purple hover:border-sw-purple/30 transition-all group cursor-pointer">
        <div class="p-6">
          <div class="flex items-start gap-4 mb-4">
            <div class="text-center flex-shrink-0">
              <div class="text-3xl font-black text-sw-amber font-display leading-none">28</div>
              <div class="text-xs text-sw-amber font-semibold uppercase">MAR</div>
            </div>
            <div>
              <h3 class="font-display font-bold text-base mb-1">Neon Nights Festival</h3>
              <p class="text-sw-muted text-sm flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                The Warehouse, Brooklyn
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-1.5 mb-5">
            <span class="px-2 py-0.5 rounded text-[10px] bg-sw-purple/10 text-sw-purple font-medium">Luna Echo</span>
            <span class="px-2 py-0.5 rounded text-[10px] bg-sw-pink/10 text-sw-pink font-medium">PRISM</span>
            <span class="px-2 py-0.5 rounded text-[10px] bg-sw-amber/10 text-sw-amber font-medium">+4 more</span>
          </div>
          <button onclick="showToast('Redirecting to tickets...')" class="w-full py-2.5 rounded-lg text-sm font-semibold border border-sw-purple/40 text-sw-purple hover:bg-sw-purple/10 transition-colors cursor-pointer">Get Tickets</button>
        </div>
      </div>
      <!-- Event 2 -->
      <div class="bg-sw-card border border-sw-border rounded-xl overflow-hidden event-border-pink hover:border-sw-pink/30 transition-all group cursor-pointer">
        <div class="p-6">
          <div class="flex items-start gap-4 mb-4">
            <div class="text-center flex-shrink-0">
              <div class="text-3xl font-black text-sw-amber font-display leading-none">12</div>
              <div class="text-xs text-sw-amber font-semibold uppercase">APR</div>
            </div>
            <div>
              <h3 class="font-display font-bold text-base mb-1">Bass Drop Underground</h3>
              <p class="text-sw-muted text-sm flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Fabric, London
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-1.5 mb-5">
            <span class="px-2 py-0.5 rounded text-[10px] bg-sw-pink/10 text-sw-pink font-medium">Velvet Bass</span>
            <span class="px-2 py-0.5 rounded text-[10px] bg-sw-purple/10 text-sw-purple font-medium">Neon Drift</span>
            <span class="px-2 py-0.5 rounded text-[10px] bg-sw-amber/10 text-sw-amber font-medium">+2 more</span>
          </div>
          <button onclick="showToast('Redirecting to tickets...')" class="w-full py-2.5 rounded-lg text-sm font-semibold border border-sw-pink/40 text-sw-pink hover:bg-sw-pink/10 transition-colors cursor-pointer">Get Tickets</button>
        </div>
      </div>
      <!-- Event 3 -->
      <div class="bg-sw-card border border-sw-border rounded-xl overflow-hidden event-border-amber hover:border-sw-amber/30 transition-all group cursor-pointer">
        <div class="p-6">
          <div class="flex items-start gap-4 mb-4">
            <div class="text-center flex-shrink-0">
              <div class="text-3xl font-black text-sw-amber font-display leading-none">05</div>
              <div class="text-xs text-sw-amber font-semibold uppercase">MAY</div>
            </div>
            <div>
              <h3 class="font-display font-bold text-base mb-1">Echoes Open Air</h3>
              <p class="text-sw-muted text-sm flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Berghain, Berlin
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-1.5 mb-5">
            <span class="px-2 py-0.5 rounded text-[10px] bg-sw-amber/10 text-sw-amber font-medium">Kira Waves</span>
            <span class="px-2 py-0.5 rounded text-[10px] bg-sw-purple/10 text-sw-purple font-medium">Axel Storm</span>
            <span class="px-2 py-0.5 rounded text-[10px] bg-sw-pink/10 text-sw-pink font-medium">+6 more</span>
          </div>
          <button onclick="showToast('Redirecting to tickets...')" class="w-full py-2.5 rounded-lg text-sm font-semibold border border-sw-amber/40 text-sw-amber hover:bg-sw-amber/10 transition-colors cursor-pointer">Get Tickets</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ==================== WAVEFORM DIVIDER 3 ==================== -->
<div class="w-full overflow-hidden">
  <svg viewBox="0 0 1440 80" preserveAspectRatio="none" class="w-full h-10 md:h-16" fill="none">
    <defs>
      <linearGradient id="wave-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#a855f7" stop-opacity="0.4"/>
        <stop offset="30%" stop-color="#ec4899" stop-opacity="0.3"/>
        <stop offset="70%" stop-color="#f59e0b" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#a855f7" stop-opacity="0.4"/>
      </linearGradient>
    </defs>
    <path d="M0,40 C60,15 120,65 180,40 C240,15 300,65 360,40 C420,15 480,65 540,40 C600,15 660,65 720,40 C780,15 840,65 900,40 C960,15 1020,65 1080,40 C1140,15 1200,65 1260,40 C1320,15 1380,65 1440,40" stroke="url(#wave-grad-3)" stroke-width="1.5" fill="none"/>
  </svg>
</div>

<!-- ==================== STUDIO SERVICES ==================== -->
<section id="studio" class="py-20 md:py-28 vinyl-texture">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-sw-amber text-xs tracking-[0.3em] uppercase font-semibold font-body">Services</span>
      <h2 class="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">Studio Services</h2>
      <p class="text-sw-muted mt-3">Professional audio production from recording to release.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8 reveal">
      <!-- Recording -->
      <div class="bg-sw-card border border-sw-border rounded-2xl p-8 text-center hover:border-sw-purple/30 transition-all group cursor-pointer">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-sw-purple/10 border border-sw-purple/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <!-- Microphone SVG -->
          <svg class="w-8 h-8 text-sw-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 10v2a7 7 0 01-14 0v-2"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 19v4m-4 0h8"/>
          </svg>
        </div>
        <h3 class="font-display font-bold text-xl mb-3">Recording</h3>
        <p class="text-sw-muted text-sm leading-relaxed mb-5">State-of-the-art recording suites with world-class acoustics, vintage gear, and experienced engineers.</p>
        <div class="flex flex-wrap justify-center gap-2">
          <span class="px-2.5 py-1 bg-sw-dark border border-sw-border rounded-md text-[11px] text-sw-muted">Vocals</span>
          <span class="px-2.5 py-1 bg-sw-dark border border-sw-border rounded-md text-[11px] text-sw-muted">Live Band</span>
          <span class="px-2.5 py-1 bg-sw-dark border border-sw-border rounded-md text-[11px] text-sw-muted">Podcast</span>
        </div>
      </div>
      <!-- Mixing -->
      <div class="bg-sw-card border border-sw-border rounded-2xl p-8 text-center hover:border-sw-pink/30 transition-all group cursor-pointer relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 gradient-purple-pink text-white px-3 py-0.5 rounded-full text-[10px] font-bold">Most Popular</div>
        <div class="w-16 h-16 mx-auto rounded-2xl bg-sw-pink/10 border border-sw-pink/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <!-- Mixer/Sliders SVG -->
          <svg class="w-8 h-8 text-sw-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6v12M12 4v16M20 8v8"/>
            <circle cx="4" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
            <circle cx="20" cy="14" r="1.5" fill="currentColor"/>
          </svg>
        </div>
        <h3 class="font-display font-bold text-xl mb-3">Mixing</h3>
        <p class="text-sw-muted text-sm leading-relaxed mb-5">Balance, EQ, compression, and spatial processing to make every track shine with clarity and punch.</p>
        <div class="flex flex-wrap justify-center gap-2">
          <span class="px-2.5 py-1 bg-sw-dark border border-sw-border rounded-md text-[11px] text-sw-muted">Stereo</span>
          <span class="px-2.5 py-1 bg-sw-dark border border-sw-border rounded-md text-[11px] text-sw-muted">Dolby Atmos</span>
          <span class="px-2.5 py-1 bg-sw-dark border border-sw-border rounded-md text-[11px] text-sw-muted">Stem Mix</span>
        </div>
      </div>
      <!-- Mastering -->
      <div class="bg-sw-card border border-sw-border rounded-2xl p-8 text-center hover:border-sw-amber/30 transition-all group cursor-pointer">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-sw-amber/10 border border-sw-amber/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <!-- Headphones SVG -->
          <svg class="w-8 h-8 text-sw-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 18v-6a9 9 0 0118 0v6"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"/>
          </svg>
        </div>
        <h3 class="font-display font-bold text-xl mb-3">Mastering</h3>
        <p class="text-sw-muted text-sm leading-relaxed mb-5">Final polish for streaming, vinyl, and broadcast. Loudness optimization and format delivery included.</p>
        <div class="flex flex-wrap justify-center gap-2">
          <span class="px-2.5 py-1 bg-sw-dark border border-sw-border rounded-md text-[11px] text-sw-muted">Spotify</span>
          <span class="px-2.5 py-1 bg-sw-dark border border-sw-border rounded-md text-[11px] text-sw-muted">Apple Music</span>
          <span class="px-2.5 py-1 bg-sw-dark border border-sw-border rounded-md text-[11px] text-sw-muted">Vinyl</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ==================== LISTEN / TRACKS SECTION ==================== -->
<section id="listen" class="py-20 md:py-28">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-sw-purple text-xs tracking-[0.3em] uppercase font-semibold font-body">Listen</span>
      <h2 class="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">Top Tracks</h2>
    </div>
    <div class="max-w-3xl mx-auto space-y-3 reveal">
      <!-- Track 1 -->
      <div class="flex items-center gap-4 bg-sw-card border border-sw-border rounded-xl px-5 py-4 hover:border-sw-purple/30 transition-all group cursor-pointer" onclick="playTrack(this, 'Midnight Pulse', 'Luna Echo')">
        <span class="text-sw-muted text-sm font-mono w-6 text-right">01</span>
        <div class="w-10 h-10 rounded-lg bg-sw-purple/15 flex items-center justify-center flex-shrink-0 group-hover:bg-sw-purple/25 transition-colors">
          <svg class="w-4 h-4 text-sw-purple" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-sm truncate">Midnight Pulse</h4>
          <p class="text-sw-muted text-xs truncate">Luna Echo</p>
        </div>
        <span class="text-sw-muted text-xs font-mono">3:42</span>
        <!-- Mini equalizer (visible on hover) -->
        <div class="hidden group-hover:flex items-end gap-[2px] h-4">
          <div class="eq-bar-small w-[2px] bg-sw-purple rounded-full"></div>
          <div class="eq-bar-small w-[2px] bg-sw-purple rounded-full"></div>
          <div class="eq-bar-small w-[2px] bg-sw-purple rounded-full"></div>
        </div>
      </div>
      <!-- Track 2 -->
      <div class="flex items-center gap-4 bg-sw-card border border-sw-border rounded-xl px-5 py-4 hover:border-sw-pink/30 transition-all group cursor-pointer" onclick="playTrack(this, 'Electric Dreams', 'Neon Drift')">
        <span class="text-sw-muted text-sm font-mono w-6 text-right">02</span>
        <div class="w-10 h-10 rounded-lg bg-sw-pink/15 flex items-center justify-center flex-shrink-0 group-hover:bg-sw-pink/25 transition-colors">
          <svg class="w-4 h-4 text-sw-pink" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-sm truncate">Electric Dreams</h4>
          <p class="text-sw-muted text-xs truncate">Neon Drift</p>
        </div>
        <span class="text-sw-muted text-xs font-mono">4:15</span>
        <div class="hidden group-hover:flex items-end gap-[2px] h-4">
          <div class="eq-bar-small w-[2px] bg-sw-pink rounded-full"></div>
          <div class="eq-bar-small w-[2px] bg-sw-pink rounded-full"></div>
          <div class="eq-bar-small w-[2px] bg-sw-pink rounded-full"></div>
        </div>
      </div>
      <!-- Track 3 -->
      <div class="flex items-center gap-4 bg-sw-card border border-sw-border rounded-xl px-5 py-4 hover:border-sw-amber/30 transition-all group cursor-pointer" onclick="playTrack(this, 'Low Frequency', 'Velvet Bass')">
        <span class="text-sw-muted text-sm font-mono w-6 text-right">03</span>
        <div class="w-10 h-10 rounded-lg bg-sw-amber/15 flex items-center justify-center flex-shrink-0 group-hover:bg-sw-amber/25 transition-colors">
          <svg class="w-4 h-4 text-sw-amber" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-sm truncate">Low Frequency</h4>
          <p class="text-sw-muted text-xs truncate">Velvet Bass</p>
        </div>
        <span class="text-sw-muted text-xs font-mono">3:58</span>
        <div class="hidden group-hover:flex items-end gap-[2px] h-4">
          <div class="eq-bar-small w-[2px] bg-sw-amber rounded-full"></div>
          <div class="eq-bar-small w-[2px] bg-sw-amber rounded-full"></div>
          <div class="eq-bar-small w-[2px] bg-sw-amber rounded-full"></div>
        </div>
      </div>
      <!-- Track 4 -->
      <div class="flex items-center gap-4 bg-sw-card border border-sw-border rounded-xl px-5 py-4 hover:border-sw-purple/30 transition-all group cursor-pointer" onclick="playTrack(this, 'Daydream Haze', 'Kira Waves')">
        <span class="text-sw-muted text-sm font-mono w-6 text-right">04</span>
        <div class="w-10 h-10 rounded-lg bg-sw-purple/15 flex items-center justify-center flex-shrink-0 group-hover:bg-sw-purple/25 transition-colors">
          <svg class="w-4 h-4 text-sw-purple" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-sm truncate">Daydream Haze</h4>
          <p class="text-sw-muted text-xs truncate">Kira Waves</p>
        </div>
        <span class="text-sw-muted text-xs font-mono">5:01</span>
        <div class="hidden group-hover:flex items-end gap-[2px] h-4">
          <div class="eq-bar-small w-[2px] bg-sw-purple rounded-full"></div>
          <div class="eq-bar-small w-[2px] bg-sw-purple rounded-full"></div>
          <div class="eq-bar-small w-[2px] bg-sw-purple rounded-full"></div>
        </div>
      </div>
      <!-- Track 5 -->
      <div class="flex items-center gap-4 bg-sw-card border border-sw-border rounded-xl px-5 py-4 hover:border-sw-pink/30 transition-all group cursor-pointer" onclick="playTrack(this, 'Supernova', 'PRISM')">
        <span class="text-sw-muted text-sm font-mono w-6 text-right">05</span>
        <div class="w-10 h-10 rounded-lg bg-sw-pink/15 flex items-center justify-center flex-shrink-0 group-hover:bg-sw-pink/25 transition-colors">
          <svg class="w-4 h-4 text-sw-pink" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-sm truncate">Supernova</h4>
          <p class="text-sw-muted text-xs truncate">PRISM</p>
        </div>
        <span class="text-sw-muted text-xs font-mono">4:33</span>
        <div class="hidden group-hover:flex items-end gap-[2px] h-4">
          <div class="eq-bar-small w-[2px] bg-sw-pink rounded-full"></div>
          <div class="eq-bar-small w-[2px] bg-sw-pink rounded-full"></div>
          <div class="eq-bar-small w-[2px] bg-sw-pink rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ==================== NEWSLETTER / CTA ==================== -->
<section class="py-20 md:py-28 vinyl-texture">
  <div class="max-w-7xl mx-auto px-6">
    <div class="max-w-2xl mx-auto text-center reveal">
      <div class="flex justify-center mb-6">
        <!-- Equalizer mini signature -->
        <div class="flex items-end gap-[4px] h-10">
          <div class="eq-bar w-2 rounded-t-sm bg-sw-purple opacity-70"></div>
          <div class="eq-bar w-2 rounded-t-sm bg-sw-pink opacity-80"></div>
          <div class="eq-bar w-2 rounded-t-sm bg-sw-amber opacity-70"></div>
          <div class="eq-bar w-2 rounded-t-sm bg-sw-purple opacity-90"></div>
          <div class="eq-bar w-2 rounded-t-sm bg-sw-pink opacity-75"></div>
          <div class="eq-bar w-2 rounded-t-sm bg-sw-amber opacity-85"></div>
          <div class="eq-bar w-2 rounded-t-sm bg-sw-purple opacity-70"></div>
          <div class="eq-bar w-2 rounded-t-sm bg-sw-pink opacity-80"></div>
        </div>
      </div>
      <h2 class="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">Stay in <span class="gradient-text-purple">Tune</span></h2>
      <p class="text-sw-muted mb-8">Get weekly drops of new music, exclusive pre-sale access, and behind-the-scenes content.</p>
      <div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input type="email" placeholder="your@email.com" class="flex-1 bg-sw-card border border-sw-border rounded-full px-5 py-3 text-sm text-white placeholder-sw-muted/50 focus:border-sw-purple focus:outline-none">
        <button onclick="showToast('Subscribed! Welcome to the wave.')" class="gradient-purple-pink gradient-btn text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 flex-shrink-0 cursor-pointer">Subscribe</button>
      </div>
    </div>
  </div>
</section>

<!-- ==================== FOOTER ==================== -->
<footer class="border-t border-sw-border py-12">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-4 gap-10 mb-10">
      <!-- Brand -->
      <div>
        <div class="flex items-center gap-2.5 mb-4">
          <div class="flex items-end gap-[3px] h-5">
            <div class="eq-bar-small w-[3px] bg-sw-purple rounded-full"></div>
            <div class="eq-bar-small w-[3px] bg-sw-pink rounded-full"></div>
            <div class="eq-bar-small w-[3px] bg-sw-purple rounded-full"></div>
          </div>
          <span class="font-display font-bold text-sm">SoundWave</span>
        </div>
        <p class="text-sw-muted text-sm leading-relaxed">Connecting artists, fans, and sound. The future of music discovery.</p>
      </div>
      <!-- Quick Links -->
      <div>
        <h4 class="font-display font-bold text-sm mb-4">Explore</h4>
        <div class="space-y-2.5">
          <a href="#artists" class="block text-sm text-sw-muted hover:text-sw-purple transition-colors">Artists</a>
          <a href="#events" class="block text-sm text-sw-muted hover:text-sw-purple transition-colors">Events</a>
          <a href="#studio" class="block text-sm text-sw-muted hover:text-sw-purple transition-colors">Studio</a>
          <a href="#listen" class="block text-sm text-sw-muted hover:text-sw-purple transition-colors">Top Tracks</a>
        </div>
      </div>
      <!-- Streaming -->
      <div>
        <h4 class="font-display font-bold text-sm mb-4">Listen On</h4>
        <div class="space-y-2.5">
          <a href="#" class="block text-sm text-sw-muted hover:text-sw-pink transition-colors">Spotify</a>
          <a href="#" class="block text-sm text-sw-muted hover:text-sw-pink transition-colors">Apple Music</a>
          <a href="#" class="block text-sm text-sw-muted hover:text-sw-pink transition-colors">YouTube Music</a>
          <a href="#" class="block text-sm text-sw-muted hover:text-sw-pink transition-colors">SoundCloud</a>
        </div>
      </div>
      <!-- Social -->
      <div>
        <h4 class="font-display font-bold text-sm mb-4">Connect</h4>
        <div class="flex gap-3">
          <!-- Instagram -->
          <a href="#" class="w-9 h-9 rounded-lg bg-sw-card border border-sw-border flex items-center justify-center text-sw-muted hover:text-sw-purple hover:border-sw-purple/30 transition-all">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <!-- Twitter/X -->
          <a href="#" class="w-9 h-9 rounded-lg bg-sw-card border border-sw-border flex items-center justify-center text-sw-muted hover:text-sw-purple hover:border-sw-purple/30 transition-all">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <!-- TikTok -->
          <a href="#" class="w-9 h-9 rounded-lg bg-sw-card border border-sw-border flex items-center justify-center text-sw-muted hover:text-sw-purple hover:border-sw-purple/30 transition-all">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.17V12a4.85 4.85 0 01-3.58-1.63V6.69h3.58z"/></svg>
          </a>
          <!-- YouTube -->
          <a href="#" class="w-9 h-9 rounded-lg bg-sw-card border border-sw-border flex items-center justify-center text-sw-muted hover:text-sw-purple hover:border-sw-purple/30 transition-all">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
      </div>
    </div>
    <div class="border-t border-sw-border pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
      <p class="text-sw-muted/50 text-xs">&copy; 2026 SoundWave. All rights reserved.</p>
      <div class="flex gap-6 text-xs text-sw-muted/50">
        <a href="#" class="hover:text-sw-muted transition-colors">Privacy</a>
        <a href="#" class="hover:text-sw-muted transition-colors">Terms</a>
        <a href="#" class="hover:text-sw-muted transition-colors">Cookies</a>
      </div>
    </div>
  </div>
</footer>

<!-- ==================== STICKY PLAYER BAR ==================== -->
<div id="player-bar" class="fixed bottom-0 left-0 right-0 bg-sw-dark/95 backdrop-blur-xl border-t border-sw-border z-50 h-[72px]">
  <div class="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center gap-4">
    <!-- Track info -->
    <div class="flex items-center gap-3 min-w-0 flex-shrink-0 w-48 md:w-64">
      <div class="w-10 h-10 rounded-lg bg-sw-card border border-sw-border flex items-center justify-center flex-shrink-0">
        <div class="flex items-end gap-[2px] h-5" id="player-eq">
          <div class="eq-bar-small w-[2px] bg-sw-purple rounded-full"></div>
          <div class="eq-bar-small w-[2px] bg-sw-pink rounded-full"></div>
          <div class="eq-bar-small w-[2px] bg-sw-purple rounded-full"></div>
        </div>
      </div>
      <div class="min-w-0">
        <p class="text-sm font-semibold truncate" id="player-track">Midnight Pulse</p>
        <p class="text-xs text-sw-muted truncate" id="player-artist">Luna Echo</p>
      </div>
    </div>
    <!-- Controls -->
    <div class="flex-1 flex flex-col items-center gap-1">
      <div class="flex items-center gap-4">
        <button class="text-sw-muted hover:text-white transition-colors cursor-pointer">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        <button id="player-play-btn" onclick="togglePlayerPlay()" class="w-9 h-9 rounded-full gradient-purple-pink flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
          <svg id="player-play-icon" class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          <svg id="player-pause-icon" class="w-4 h-4 text-white hidden" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
        </button>
        <button class="text-sw-muted hover:text-white transition-colors cursor-pointer">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>
      <!-- Progress bar -->
      <div class="w-full max-w-md flex items-center gap-2">
        <span class="text-[10px] text-sw-muted font-mono" id="player-current">1:24</span>
        <div class="progress-track flex-1" onclick="seekProgress(event, this)">
          <div class="progress-fill" id="player-progress" style="width: 35%;"></div>
        </div>
        <span class="text-[10px] text-sw-muted font-mono" id="player-duration">3:42</span>
      </div>
    </div>
    <!-- Volume (hidden on mobile) -->
    <div class="hidden md:flex items-center gap-2 w-32 flex-shrink-0">
      <svg class="w-4 h-4 text-sw-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M12 6l-4 4H4v4h4l4 4V6z"/></svg>
      <div class="progress-track flex-1" onclick="setVolume(event, this)">
        <div class="progress-fill" id="volume-fill" style="width: 70%;"></div>
      </div>
    </div>
  </div>
</div>

<!-- ==================== CTA MODAL ==================== -->
<div id="cta-modal" class="hidden fixed inset-0 z-[60] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="this.parentElement.classList.add('hidden')"></div>
  <div class="relative bg-sw-card border border-sw-border rounded-2xl p-8 max-w-md w-full shadow-2xl">
    <button onclick="this.closest('#cta-modal').classList.add('hidden')" class="absolute top-4 right-4 text-sw-muted hover:text-white text-lg cursor-pointer">&times;</button>
    <div class="flex justify-center mb-5">
      <div class="flex items-end gap-[3px] h-8">
        <div class="eq-bar w-2 rounded-t-sm bg-sw-purple opacity-80"></div>
        <div class="eq-bar w-2 rounded-t-sm bg-sw-pink opacity-70"></div>
        <div class="eq-bar w-2 rounded-t-sm bg-sw-amber opacity-80"></div>
        <div class="eq-bar w-2 rounded-t-sm bg-sw-purple opacity-70"></div>
        <div class="eq-bar w-2 rounded-t-sm bg-sw-pink opacity-80"></div>
      </div>
    </div>
    <h3 class="font-display text-2xl font-bold text-center mb-2">Join SoundWave</h3>
    <p class="text-sw-muted text-sm text-center mb-6">Create your free account and start exploring.</p>
    <div class="space-y-3">
      <input type="text" placeholder="Your name" class="w-full bg-sw-dark border border-sw-border rounded-xl px-4 py-3 text-sm text-white placeholder-sw-muted/40 focus:border-sw-purple focus:outline-none">
      <input type="email" placeholder="Email address" class="w-full bg-sw-dark border border-sw-border rounded-xl px-4 py-3 text-sm text-white placeholder-sw-muted/40 focus:border-sw-purple focus:outline-none">
      <button onclick="showToast('Welcome to SoundWave!');this.closest('#cta-modal').classList.add('hidden')" class="w-full gradient-purple-pink text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-sw-purple/30 transition-all cursor-pointer">Get Started Free</button>
    </div>
  </div>
</div>

<!-- ==================== TOAST ==================== -->
<div id="toast" class="fixed top-6 right-6 z-[70] gradient-purple-pink text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-semibold translate-y-[-100px] opacity-0 transition-all duration-400 pointer-events-none"></div>

<!-- ==================== SCRIPTS ==================== -->
<script>
// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('translate-y-[-100px]', 'opacity-0');
  t.classList.add('translate-y-0', 'opacity-100');
  setTimeout(() => {
    t.classList.add('translate-y-[-100px]', 'opacity-0');
    t.classList.remove('translate-y-0', 'opacity-100');
  }, 2800);
}

// Scroll reveal
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// Close mobile menu on nav click
document.querySelectorAll('#mobile-nav a').forEach(a => {
  a.addEventListener('click', () => document.getElementById('mobile-nav').classList.add('hidden'));
});

// Hero play button
let heroPlaying = false;
function toggleHeroPlay() {
  heroPlaying = !heroPlaying;
  document.getElementById('play-icon').classList.toggle('hidden', heroPlaying);
  document.getElementById('pause-icon').classList.toggle('hidden', !heroPlaying);
  // Also sync player bar
  if (heroPlaying) {
    document.getElementById('player-play-icon').classList.add('hidden');
    document.getElementById('player-pause-icon').classList.remove('hidden');
  }
}

// Player bar controls
let playerPlaying = false;
function togglePlayerPlay() {
  playerPlaying = !playerPlaying;
  document.getElementById('player-play-icon').classList.toggle('hidden', playerPlaying);
  document.getElementById('player-pause-icon').classList.toggle('hidden', !playerPlaying);
  // Simulate progress
  if (playerPlaying) startProgress();
}

// Simulate progress
let progressInterval;
function startProgress() {
  clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    const bar = document.getElementById('player-progress');
    let w = parseFloat(bar.style.width) || 0;
    w += 0.3;
    if (w > 100) { w = 0; }
    bar.style.width = w + '%';
    // Update time display
    const totalSec = 222; // 3:42
    const cur = Math.floor(totalSec * w / 100);
    const m = Math.floor(cur / 60);
    const s = cur % 60;
    document.getElementById('player-current').textContent = m + ':' + (s < 10 ? '0' : '') + s;
  }, 300);
}

// Seek
function seekProgress(e, el) {
  const rect = el.getBoundingClientRect();
  const pct = ((e.clientX - rect.left) / rect.width) * 100;
  document.getElementById('player-progress').style.width = Math.max(0, Math.min(100, pct)) + '%';
}

// Volume
function setVolume(e, el) {
  const rect = el.getBoundingClientRect();
  const pct = ((e.clientX - rect.left) / rect.width) * 100;
  document.getElementById('volume-fill').style.width = Math.max(0, Math.min(100, pct)) + '%';
}

// Play track from list
function playTrack(el, title, artist) {
  document.getElementById('player-track').textContent = title;
  document.getElementById('player-artist').textContent = artist;
  document.getElementById('player-progress').style.width = '0%';
  document.getElementById('player-current').textContent = '0:00';
  // Auto-play
  playerPlaying = true;
  document.getElementById('player-play-icon').classList.add('hidden');
  document.getElementById('player-pause-icon').classList.remove('hidden');
  startProgress();
  showToast('Now playing: ' + title);
}

// Randomize hero equalizer heights on load for variety
document.addEventListener('DOMContentLoaded', () => {
  const bars = document.querySelectorAll('#hero-equalizer .eq-bar');
  bars.forEach(bar => {
    const randomDelay = (Math.random() * 0.5).toFixed(2);
    const randomDuration = (1.3 + Math.random() * 0.9).toFixed(2);
    bar.style.animationDelay = randomDelay + 's';
    bar.style.animationDuration = randomDuration + 's';
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
