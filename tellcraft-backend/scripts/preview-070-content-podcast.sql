INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '12218d24-0e62-44ec-9bc5-2571d6a1076d',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Signal Podcast</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      colors: {
        deep: { 800:'#581c87', 900:'#3b0764' },
        coral: { 400:'#fb7185', 500:'#f43f5e', 600:'#e11d48' },
        surface: { 900:'#0f0f0f', 800:'#1a1a1a', 700:'#242424', 600:'#2e2e2e' }
      }
    }
  }
}
</script>
<style>
* { font-family: 'Inter', sans-serif; }
h1, h2, h3, h4, .font-display { font-family: 'Space Grotesk', sans-serif; }
body { background: #0f0f0f; color: #f5f0eb; }

/* Waveform animation */
.wave-bar { transition: height 0.3s ease; }
.wave-bar-anim { animation: wavePulse 1.2s ease-in-out infinite; }
@keyframes wavePulse {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.5); }
}
.wave-bar:nth-child(odd) { animation-delay: 0.1s; }
.wave-bar:nth-child(3n) { animation-delay: 0.25s; }
.wave-bar:nth-child(4n) { animation-delay: 0.4s; }

/* Waveform divider hover */
.waveform-divider .wave-line { transition: transform 0.3s ease, opacity 0.3s ease; }
.waveform-divider:hover .wave-line { transform: scaleY(1.3); opacity: 0.9; }

/* Episode card */
.episode-card { transition: all 0.25s ease; }
.episode-card:hover { background: #1a1a1a; transform: translateX(4px); }
.episode-card:nth-child(even) { background: rgba(88, 28, 135, 0.04); }
.episode-card:nth-child(even):hover { background: rgba(88, 28, 135, 0.1); }

/* Play button */
.play-btn { transition: all 0.2s ease; }
.play-btn:hover { transform: scale(1.12); }

/* Platform button */
.platform-btn { transition: all 0.2s ease; }
.platform-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }

/* Progress waveform */
.progress-bar-container { cursor: pointer; }
.progress-bar-container:hover .progress-wave-bar { opacity: 1; }

/* Glow effects */
.glow-purple { box-shadow: 0 0 60px rgba(88, 28, 135, 0.3); }
.glow-coral { box-shadow: 0 0 40px rgba(244, 63, 94, 0.2); }
</style>
</head>
<body class="min-h-screen">

<!-- ========== HEADER ========== -->
<header class="sticky top-0 z-50 bg-surface-900/95 backdrop-blur-md border-b border-white/5">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-deep-800 to-coral-500 flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 10v2a7 7 0 01-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </div>
      <span class="font-display text-lg font-bold tracking-tight">The <span class="bg-gradient-to-r from-purple-400 to-coral-400 bg-clip-text text-transparent">Signal</span></span>
    </div>
    <nav class="flex items-center gap-8">
      <a class="text-sm text-white/50 hover:text-white transition cursor-pointer font-medium">Episodes</a>
      <a class="text-sm text-white/50 hover:text-white transition cursor-pointer font-medium">About</a>
      <a class="text-sm text-white/50 hover:text-white transition cursor-pointer font-medium">Subscribe</a>
    </nav>
  </div>
</header>

<!-- ========== NOW PLAYING (HERO) ========== -->
<section class="relative overflow-hidden py-20">
  <!-- Background glow -->
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-deep-800/40 rounded-full blur-[120px]"></div>
    <div class="absolute bottom-0 right-1/4 w-72 h-72 bg-coral-500/15 rounded-full blur-[100px]"></div>
  </div>
  <div class="max-w-6xl mx-auto px-6 relative z-10">
    <div class="flex flex-col lg:flex-row items-center gap-12">
      <!-- Episode Art -->
      <div class="w-72 h-72 rounded-3xl bg-gradient-to-br from-deep-800 via-purple-700 to-coral-500 flex items-center justify-center flex-shrink-0 glow-purple relative group">
        <svg class="w-24 h-24 text-white/80" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 10v2a7 7 0 01-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        <div class="absolute -bottom-1 -right-1 text-xs bg-coral-500 text-white px-3 py-1 rounded-full font-display font-semibold tracking-wide">EP. 47</div>
      </div>
      <!-- Episode Info -->
      <div class="flex-1 text-center lg:text-left">
        <span class="inline-block text-xs tracking-widest uppercase text-coral-400 font-display font-semibold mb-3">Now Playing</span>
        <h1 class="font-display text-4xl lg:text-5xl font-bold leading-tight mb-4">The Future of AI<br>in Music</h1>
        <p class="text-white/50 text-base leading-relaxed mb-2 max-w-lg">Exploring how artificial intelligence is reshaping the creative process, from composition to production, and what it means for human artistry.</p>
        <div class="flex items-center gap-3 text-sm text-white/40 mb-8 justify-center lg:justify-start">
          <span>Guest: <span class="text-white/70">Maya Chen</span></span>
          <span class="text-white/20">|</span>
          <span>Feb 18, 2026</span>
          <span class="text-white/20">|</span>
          <span>45 min</span>
        </div>

        <!-- Audio Player -->
        <div class="bg-surface-800 rounded-2xl p-5 border border-white/5">
          <div class="flex items-center gap-4">
            <!-- Play Button -->
            <button id="mainPlayBtn" class="play-btn w-14 h-14 rounded-full bg-gradient-to-br from-deep-800 to-coral-500 flex items-center justify-center flex-shrink-0 glow-coral" onclick="toggleMainPlay()">
              <svg id="mainPlayIcon" class="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              <svg id="mainPauseIcon" class="w-6 h-6 text-white hidden" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <!-- Waveform Progress -->
            <div class="flex-1">
              <div class="progress-bar-container flex items-end gap-[2px] h-10" id="waveformProgress">
                <!-- 40 waveform bars generated by JS -->
              </div>
              <div class="flex justify-between mt-2 text-xs text-white/30 font-mono">
                <span id="currentTime">12:34</span>
                <span>45:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ========== WAVEFORM DIVIDER 1 ========== -->
<div class="waveform-divider max-w-4xl mx-auto px-6 py-4 flex items-center justify-center">
  <svg width="100%" height="32" viewBox="0 0 800 32" preserveAspectRatio="none" class="overflow-visible">
    <defs>
      <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#581c87;stop-opacity:0.6"/>
        <stop offset="50%" style="stop-color:#9333ea;stop-opacity:0.8"/>
        <stop offset="100%" style="stop-color:#f43f5e;stop-opacity:0.6"/>
      </linearGradient>
    </defs>
    <rect x="0" y="13" width="10" height="6" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="16" y="10" width="3" height="12" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="24" y="6" width="3" height="20" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="32" y="11" width="3" height="10" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="40" y="4" width="3" height="24" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="48" y="8" width="3" height="16" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="56" y="12" width="3" height="8" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="64" y="5" width="3" height="22" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="72" y="9" width="3" height="14" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="80" y="13" width="3" height="6" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="96" y="7" width="3" height="18" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="104" y="11" width="3" height="10" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="112" y="3" width="3" height="26" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="120" y="9" width="3" height="14" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="128" y="12" width="3" height="8" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="144" y="6" width="3" height="20" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="152" y="10" width="3" height="12" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="160" y="4" width="3" height="24" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="168" y="13" width="3" height="6" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="176" y="8" width="3" height="16" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="192" y="5" width="3" height="22" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="200" y="10" width="3" height="12" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="208" y="7" width="3" height="18" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="216" y="12" width="3" height="8" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="224" y="4" width="3" height="24" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <!-- Center section -->
    <rect x="280" y="3" width="3" height="26" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="288" y="8" width="3" height="16" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="296" y="5" width="3" height="22" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="304" y="11" width="3" height="10" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="312" y="6" width="3" height="20" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="360" y="9" width="3" height="14" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="368" y="4" width="3" height="24" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="376" y="12" width="3" height="8" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="384" y="7" width="3" height="18" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="392" y="13" width="3" height="6" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <!-- Right half -->
    <rect x="440" y="5" width="3" height="22" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="448" y="10" width="3" height="12" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="456" y="3" width="3" height="26" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="464" y="9" width="3" height="14" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="472" y="6" width="3" height="20" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="520" y="11" width="3" height="10" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="528" y="4" width="3" height="24" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="536" y="8" width="3" height="16" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="544" y="12" width="3" height="8" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="552" y="5" width="3" height="22" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="600" y="9" width="3" height="14" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="608" y="13" width="3" height="6" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="616" y="7" width="3" height="18" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="624" y="4" width="3" height="24" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="632" y="10" width="3" height="12" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="680" y="6" width="3" height="20" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="688" y="11" width="3" height="10" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="696" y="3" width="3" height="26" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="704" y="8" width="3" height="16" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="712" y="13" width="3" height="6" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="760" y="5" width="3" height="22" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="768" y="10" width="3" height="12" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="776" y="7" width="3" height="18" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="784" y="12" width="3" height="8" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
    <rect x="792" y="13" width="10" height="6" rx="1" fill="url(#waveGrad1)" class="wave-line"/>
  </svg>
</div>

<!-- ========== EPISODE LIST ========== -->
<section class="max-w-6xl mx-auto px-6 py-12">
  <h2 class="font-display text-2xl font-bold mb-8 flex items-center gap-3">
    <span>Latest Episodes</span>
    <span class="text-xs font-body font-normal text-white/30 bg-white/5 px-3 py-1 rounded-full">5 new</span>
  </h2>
  <div class="space-y-1">
    <!-- Episode 1 -->
    <div class="episode-card flex items-center gap-5 p-5 rounded-xl cursor-pointer group">
      <span class="text-2xl font-display font-bold text-white/10 w-12 text-right flex-shrink-0 group-hover:text-coral-500/30 transition">47</span>
      <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-deep-800 to-purple-600 flex items-center justify-center flex-shrink-0">
        <svg class="w-6 h-6 text-white/70" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-display font-semibold text-white/90 truncate">The Future of AI in Music</h3>
        <p class="text-sm text-white/35 mt-0.5 truncate">How machine learning algorithms are composing, producing, and transforming the music industry</p>
      </div>
      <span class="text-xs text-white/25 flex-shrink-0 font-mono">45:00</span>
      <button class="play-btn w-10 h-10 rounded-full bg-white/5 hover:bg-coral-500 flex items-center justify-center flex-shrink-0 transition group-hover:bg-coral-500/80">
        <svg class="w-4 h-4 text-white/50 group-hover:text-white ml-0.5 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
    <!-- Episode 2 -->
    <div class="episode-card flex items-center gap-5 p-5 rounded-xl cursor-pointer group">
      <span class="text-2xl font-display font-bold text-white/10 w-12 text-right flex-shrink-0 group-hover:text-coral-500/30 transition">46</span>
      <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-coral-500 to-rose-700 flex items-center justify-center flex-shrink-0">
        <svg class="w-6 h-6 text-white/70" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-display font-semibold text-white/90 truncate">The Psychology of Sound Design</h3>
        <p class="text-sm text-white/35 mt-0.5 truncate">Why certain frequencies trigger emotions and how game designers weaponize audio</p>
      </div>
      <span class="text-xs text-white/25 flex-shrink-0 font-mono">38:22</span>
      <button class="play-btn w-10 h-10 rounded-full bg-white/5 hover:bg-coral-500 flex items-center justify-center flex-shrink-0 transition group-hover:bg-coral-500/80">
        <svg class="w-4 h-4 text-white/50 group-hover:text-white ml-0.5 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
    <!-- Episode 3 -->
    <div class="episode-card flex items-center gap-5 p-5 rounded-xl cursor-pointer group">
      <span class="text-2xl font-display font-bold text-white/10 w-12 text-right flex-shrink-0 group-hover:text-coral-500/30 transition">45</span>
      <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center flex-shrink-0">
        <svg class="w-6 h-6 text-white/70" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-display font-semibold text-white/90 truncate">Underground Radio: The Rise of Pirate Stations</h3>
        <p class="text-sm text-white/35 mt-0.5 truncate">A deep dive into the rebel broadcasters who shaped modern music culture from hidden rooftops</p>
      </div>
      <span class="text-xs text-white/25 flex-shrink-0 font-mono">52:15</span>
      <button class="play-btn w-10 h-10 rounded-full bg-white/5 hover:bg-coral-500 flex items-center justify-center flex-shrink-0 transition group-hover:bg-coral-500/80">
        <svg class="w-4 h-4 text-white/50 group-hover:text-white ml-0.5 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
    <!-- Episode 4 -->
    <div class="episode-card flex items-center gap-5 p-5 rounded-xl cursor-pointer group">
      <span class="text-2xl font-display font-bold text-white/10 w-12 text-right flex-shrink-0 group-hover:text-coral-500/30 transition">44</span>
      <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center flex-shrink-0">
        <svg class="w-6 h-6 text-white/70" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-display font-semibold text-white/90 truncate">Vinyl Revival: Why Analog Sounds Better</h3>
        <p class="text-sm text-white/35 mt-0.5 truncate">Audio engineers explain the warmth debate and the science behind analog vs digital recording</p>
      </div>
      <span class="text-xs text-white/25 flex-shrink-0 font-mono">41:08</span>
      <button class="play-btn w-10 h-10 rounded-full bg-white/5 hover:bg-coral-500 flex items-center justify-center flex-shrink-0 transition group-hover:bg-coral-500/80">
        <svg class="w-4 h-4 text-white/50 group-hover:text-white ml-0.5 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
    <!-- Episode 5 -->
    <div class="episode-card flex items-center gap-5 p-5 rounded-xl cursor-pointer group">
      <span class="text-2xl font-display font-bold text-white/10 w-12 text-right flex-shrink-0 group-hover:text-coral-500/30 transition">43</span>
      <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-700 flex items-center justify-center flex-shrink-0">
        <svg class="w-6 h-6 text-white/70" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"/></svg>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-display font-semibold text-white/90 truncate">Scoring Silence: The Art of Film Soundtracks</h3>
        <p class="text-sm text-white/35 mt-0.5 truncate">Oscar-winning composer reveals how silence and space create the most powerful cinematic moments</p>
      </div>
      <span class="text-xs text-white/25 flex-shrink-0 font-mono">56:33</span>
      <button class="play-btn w-10 h-10 rounded-full bg-white/5 hover:bg-coral-500 flex items-center justify-center flex-shrink-0 transition group-hover:bg-coral-500/80">
        <svg class="w-4 h-4 text-white/50 group-hover:text-white ml-0.5 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
  </div>
</section>

<!-- ========== WAVEFORM DIVIDER 2 ========== -->
<div class="waveform-divider max-w-4xl mx-auto px-6 py-4 flex items-center justify-center">
  <svg width="100%" height="28" viewBox="0 0 800 28" preserveAspectRatio="none" class="overflow-visible">
    <defs>
      <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#f43f5e;stop-opacity:0.5"/>
        <stop offset="50%" style="stop-color:#9333ea;stop-opacity:0.7"/>
        <stop offset="100%" style="stop-color:#581c87;stop-opacity:0.5"/>
      </linearGradient>
    </defs>
    <rect x="10" y="11" width="3" height="6" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="18" y="8" width="3" height="12" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="26" y="4" width="3" height="20" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="34" y="9" width="3" height="10" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="42" y="3" width="3" height="22" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="50" y="7" width="3" height="14" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="58" y="10" width="3" height="8" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="66" y="5" width="3" height="18" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="74" y="11" width="3" height="6" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="90" y="6" width="3" height="16" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="98" y="2" width="3" height="24" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="106" y="8" width="3" height="12" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="114" y="4" width="3" height="20" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="122" y="10" width="3" height="8" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="150" y="7" width="3" height="14" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="158" y="3" width="3" height="22" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="166" y="11" width="3" height="6" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="174" y="5" width="3" height="18" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="182" y="9" width="3" height="10" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="230" y="4" width="3" height="20" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="238" y="8" width="3" height="12" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="246" y="2" width="3" height="24" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="254" y="7" width="3" height="14" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="262" y="11" width="3" height="6" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="350" y="5" width="3" height="18" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="358" y="10" width="3" height="8" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="366" y="3" width="3" height="22" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="374" y="9" width="3" height="10" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="382" y="6" width="3" height="16" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="430" y="4" width="3" height="20" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="438" y="11" width="3" height="6" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="446" y="7" width="3" height="14" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="454" y="2" width="3" height="24" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="462" y="8" width="3" height="12" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="530" y="5" width="3" height="18" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="538" y="10" width="3" height="8" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="546" y="3" width="3" height="22" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="554" y="9" width="3" height="10" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="562" y="6" width="3" height="16" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="620" y="2" width="3" height="24" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="628" y="8" width="3" height="12" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="636" y="4" width="3" height="20" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="644" y="11" width="3" height="6" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="652" y="7" width="3" height="14" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="710" y="5" width="3" height="18" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="718" y="9" width="3" height="10" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="726" y="3" width="3" height="22" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="734" y="10" width="3" height="8" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="742" y="6" width="3" height="16" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="780" y="11" width="3" height="6" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
    <rect x="788" y="8" width="3" height="12" rx="1" fill="url(#waveGrad2)" class="wave-line"/>
  </svg>
</div>

<!-- ========== SUBSCRIBE ========== -->
<section class="py-16">
  <div class="max-w-4xl mx-auto px-6 text-center">
    <h2 class="font-display text-3xl font-bold mb-3">Never Miss an Episode</h2>
    <p class="text-white/40 mb-10 max-w-md mx-auto">Subscribe on your favorite platform and get notified when new episodes drop every Tuesday.</p>
    <div class="flex flex-wrap items-center justify-center gap-4">
      <!-- Spotify -->
      <button class="platform-btn flex items-center gap-3 bg-[#1DB954]/15 hover:bg-[#1DB954]/25 border border-[#1DB954]/20 text-[#1DB954] px-6 py-3.5 rounded-xl font-display font-semibold text-sm">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
        Spotify
      </button>
      <!-- Apple Podcasts -->
      <button class="platform-btn flex items-center gap-3 bg-[#9333ea]/15 hover:bg-[#9333ea]/25 border border-[#9333ea]/20 text-purple-400 px-6 py-3.5 rounded-xl font-display font-semibold text-sm">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M5.34 0A5.328 5.328 0 000 5.34v13.32A5.328 5.328 0 005.34 24h13.32A5.328 5.328 0 0024 18.66V5.34A5.328 5.328 0 0018.66 0H5.34zm6.525 2.568c2.336 0 4.448.902 6.056 2.587 1.224 1.272 1.912 2.619 2.264 4.392.12.6-.12 1.2-.6 1.5s-1.14.24-1.5-.24c-.12-.18-.24-.42-.3-.66-.24-1.2-.78-2.22-1.68-3.12-1.26-1.26-2.76-1.86-4.44-1.86-1.74 0-3.18.6-4.44 1.86-.84.84-1.38 1.86-1.68 3-.06.3-.18.54-.36.72-.42.42-1.08.48-1.56.12s-.66-.96-.48-1.5c.36-1.68 1.08-3.06 2.28-4.32 1.608-1.685 3.72-2.467 6.42-2.467zM11.88 6.72c3.24 0 5.76 2.28 6.24 5.16.06.36-.06.78-.36 1.02-.3.3-.72.36-1.08.24-.42-.18-.66-.48-.72-.9-.3-1.92-1.86-3.24-3.84-3.36-2.16-.06-4.02 1.38-4.38 3.3-.06.42-.3.72-.72.9-.36.12-.78.06-1.08-.24-.3-.3-.42-.66-.36-1.08.24-1.38.96-2.58 2.1-3.54 1.14-.96 2.52-1.5 4.14-1.5zm.24 4.92c1.44 0 2.58 1.14 2.58 2.58 0 1.02-.6 1.92-1.44 2.34v4.14c0 .66-.48 1.14-1.14 1.14s-1.14-.48-1.14-1.14v-4.14c-.84-.42-1.44-1.32-1.44-2.34 0-1.44 1.14-2.58 2.58-2.58z"/></svg>
        Apple Podcasts
      </button>
      <!-- Google Podcasts -->
      <button class="platform-btn flex items-center gap-3 bg-[#4285F4]/15 hover:bg-[#4285F4]/25 border border-[#4285F4]/20 text-blue-400 px-6 py-3.5 rounded-xl font-display font-semibold text-sm">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M1.2 12.6c-.66 0-1.2-.54-1.2-1.2V10.2c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2v1.2c0 .66-.54 1.2-1.2 1.2zm4.8 4.2c-.66 0-1.2-.54-1.2-1.2V8.4c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2v7.2c0 .66-.54 1.2-1.2 1.2zM12 24c-.66 0-1.2-.54-1.2-1.2V1.2C10.8.54 11.34 0 12 0s1.2.54 1.2 1.2v21.6c0 .66-.54 1.2-1.2 1.2zm6-7.2c-.66 0-1.2-.54-1.2-1.2V8.4c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2v7.2c0 .66-.54 1.2-1.2 1.2zm4.8-4.2c-.66 0-1.2-.54-1.2-1.2v-1.2c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2v1.2c0 .66-.54 1.2-1.2 1.2z"/></svg>
        Google Podcasts
      </button>
      <!-- RSS -->
      <button class="platform-btn flex items-center gap-3 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/20 text-orange-400 px-6 py-3.5 rounded-xl font-display font-semibold text-sm">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6.18 15.64a2.18 2.18 0 010 4.36 2.18 2.18 0 010-4.36zM4 4.44A15.56 15.56 0 0119.56 20h-2.83A12.73 12.73 0 004 7.27V4.44zm0 5.66a9.9 9.9 0 019.9 9.9h-2.83A7.07 7.07 0 004 12.93V10.1z"/></svg>
        RSS Feed
      </button>
    </div>
  </div>
</section>

<!-- ========== WAVEFORM DIVIDER 3 ========== -->
<div class="waveform-divider max-w-4xl mx-auto px-6 py-4 flex items-center justify-center">
  <svg width="100%" height="24" viewBox="0 0 800 24" preserveAspectRatio="none" class="overflow-visible">
    <defs>
      <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#581c87;stop-opacity:0.4"/>
        <stop offset="40%" style="stop-color:#9333ea;stop-opacity:0.6"/>
        <stop offset="60%" style="stop-color:#f43f5e;stop-opacity:0.6"/>
        <stop offset="100%" style="stop-color:#581c87;stop-opacity:0.4"/>
      </linearGradient>
    </defs>
    <rect x="20" y="9" width="3" height="6" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="30" y="6" width="3" height="12" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="40" y="3" width="3" height="18" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="50" y="7" width="3" height="10" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="60" y="2" width="3" height="20" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="70" y="5" width="3" height="14" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="80" y="9" width="3" height="6" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="100" y="4" width="3" height="16" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="110" y="8" width="3" height="8" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="120" y="2" width="3" height="20" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="160" y="6" width="3" height="12" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="170" y="3" width="3" height="18" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="180" y="9" width="3" height="6" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="190" y="5" width="3" height="14" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="250" y="7" width="3" height="10" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="260" y="2" width="3" height="20" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="270" y="8" width="3" height="8" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="280" y="4" width="3" height="16" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="350" y="6" width="3" height="12" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="360" y="2" width="3" height="20" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="370" y="9" width="3" height="6" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="380" y="5" width="3" height="14" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="390" y="3" width="3" height="18" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="450" y="7" width="3" height="10" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="460" y="4" width="3" height="16" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="470" y="8" width="3" height="8" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="480" y="2" width="3" height="20" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="540" y="6" width="3" height="12" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="550" y="3" width="3" height="18" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="560" y="9" width="3" height="6" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="570" y="5" width="3" height="14" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="620" y="2" width="3" height="20" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="630" y="7" width="3" height="10" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="640" y="4" width="3" height="16" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="700" y="8" width="3" height="8" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="710" y="3" width="3" height="18" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="720" y="6" width="3" height="12" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="730" y="9" width="3" height="6" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="770" y="5" width="3" height="14" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
    <rect x="780" y="9" width="3" height="6" rx="1" fill="url(#waveGrad3)" class="wave-line"/>
  </svg>
</div>

<!-- ========== HOST SECTION ========== -->
<section class="py-16">
  <div class="max-w-4xl mx-auto px-6">
    <div class="bg-surface-800 rounded-3xl border border-white/5 p-10 flex flex-col md:flex-row items-center gap-10">
      <!-- Host Avatar -->
      <div class="w-40 h-40 rounded-full bg-gradient-to-br from-deep-800 via-purple-600 to-coral-500 flex items-center justify-center flex-shrink-0 relative">
        <svg class="w-16 h-16 text-white/80" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
        </svg>
        <div class="absolute -bottom-1 -right-1 w-8 h-8 bg-coral-500 rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 004 7.48V22h2v-2.52a9 9 0 004 0V22h2v-2.52A9 9 0 0021 12v-2h-2z"/></svg>
        </div>
      </div>
      <!-- Host Info -->
      <div class="flex-1 text-center md:text-left">
        <span class="text-xs tracking-widest uppercase text-coral-400 font-display font-semibold mb-2 block">Your Host</span>
        <h3 class="font-display text-2xl font-bold mb-3">Alex Rivera</h3>
        <p class="text-white/40 leading-relaxed mb-6">Audio engineer turned storyteller. After 15 years in recording studios across Tokyo, Berlin, and LA, Alex now explores the intersection of sound, technology, and human creativity. Each episode is a signal through the noise.</p>
        <div class="flex items-center gap-4 justify-center md:justify-start">
          <a class="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition cursor-pointer">
            <svg class="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a class="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition cursor-pointer">
            <svg class="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a class="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition cursor-pointer">
            <svg class="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ========== FOOTER ========== -->
<footer class="border-t border-white/5 py-8">
  <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/25">
    <div class="flex items-center gap-2">
      <div class="w-5 h-5 rounded bg-gradient-to-br from-deep-800 to-coral-500 flex items-center justify-center">
        <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/></svg>
      </div>
      <span>&copy; 2026 The Signal. All rights reserved.</span>
    </div>
    <div class="flex items-center gap-6">
      <a class="hover:text-white/50 transition cursor-pointer flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6.18 15.64a2.18 2.18 0 010 4.36 2.18 2.18 0 010-4.36zM4 4.44A15.56 15.56 0 0119.56 20h-2.83A12.73 12.73 0 004 7.27V4.44zm0 5.66a9.9 9.9 0 019.9 9.9h-2.83A7.07 7.07 0 004 12.93V10.1z"/></svg>
        RSS Feed
      </a>
      <a class="hover:text-white/50 transition cursor-pointer">Privacy</a>
      <a class="hover:text-white/50 transition cursor-pointer">Contact</a>
    </div>
  </div>
</footer>

<script>
// ===== Waveform Progress Bar Generation =====
(function() {
  var container = document.getElementById('waveformProgress');
  if (!container) return;
  var barCount = 45;
  var progress = 0.28; // 12:34 / 45:00
  var heights = [12,28,18,35,14,30,22,38,16,26,20,34,10,32,24,36,14,28,18,40,12,30,22,36,16,34,20,28,14,38,24,32,18,26,12,36,20,30,16,34,22,28,14,40,18];
  for (var i = 0; i < barCount; i++) {
    var bar = document.createElementNS('http://www.w3.org/2000/svg','svg');
    bar.style.display = 'inline-block';
    var pct = i / barCount;
    var h = heights[i] || 20;
    var el = document.createElement('div');
    el.style.width = '3px';
    el.style.height = h + 'px';
    el.style.borderRadius = '2px';
    el.style.flexShrink = '0';
    el.style.transition = 'background 0.2s, height 0.3s';
    if (pct < progress) {
      el.style.background = 'linear-gradient(to top, #581c87, #f43f5e)';
      el.style.opacity = '1';
    } else {
      el.style.background = 'rgba(255,255,255,0.12)';
      el.style.opacity = '0.7';
    }
    el.className = 'wave-bar';
    el.setAttribute('data-index', i);
    container.appendChild(el);
  }
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.gap = '2px';

  // Hover effect on waveform
  container.addEventListener('mousemove', function(e) {
    var rect = container.getBoundingClientRect();
    var hoverPct = (e.clientX - rect.left) / rect.width;
    var bars = container.querySelectorAll('.wave-bar');
    bars.forEach(function(bar, idx) {
      var barPct = idx / bars.length;
      if (barPct <= hoverPct) {
        bar.style.background = 'linear-gradient(to top, #581c87, #f43f5e)';
        bar.style.opacity = '1';
      } else if (barPct < progress) {
        bar.style.background = 'linear-gradient(to top, #581c87, #f43f5e)';
        bar.style.opacity = '0.7';
      } else {
        bar.style.background = 'rgba(255,255,255,0.12)';
        bar.style.opacity = '0.7';
      }
    });
  });
  container.addEventListener('mouseleave', function() {
    var bars = container.querySelectorAll('.wave-bar');
    bars.forEach(function(bar, idx) {
      var barPct = idx / bars.length;
      if (barPct < progress) {
        bar.style.background = 'linear-gradient(to top, #581c87, #f43f5e)';
        bar.style.opacity = '1';
      } else {
        bar.style.background = 'rgba(255,255,255,0.12)';
        bar.style.opacity = '0.7';
      }
    });
  });
})();

// ===== Play Button Toggle =====
var isPlaying = false;
function toggleMainPlay() {
  isPlaying = !isPlaying;
  document.getElementById('mainPlayIcon').style.display = isPlaying ? 'none' : 'block';
  document.getElementById('mainPauseIcon').style.display = isPlaying ? 'block' : 'none';

  // Animate waveform bars when playing
  var bars = document.querySelectorAll('#waveformProgress .wave-bar');
  bars.forEach(function(bar, i) {
    if (isPlaying) {
      bar.classList.add('wave-bar-anim');
      bar.style.animationDelay = (i * 0.05 % 0.6) + 's';
    } else {
      bar.classList.remove('wave-bar-anim');
    }
  });
}

// ===== Waveform Divider Hover Animation =====
document.querySelectorAll('.waveform-divider').forEach(function(divider) {
  divider.addEventListener('mouseenter', function() {
    var lines = divider.querySelectorAll('.wave-line');
    lines.forEach(function(line, i) {
      line.style.animationDelay = (i * 0.03) + 's';
    });
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
