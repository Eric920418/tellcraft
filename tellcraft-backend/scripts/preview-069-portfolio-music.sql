INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '0ff54a39-6ad9-4fef-a69a-cecec0e1c5ac',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VINYL NOVA — 音樂人作品集</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      colors: {
        vinyl: { 900:'#0a0a0a', 800:'#141414', 700:'#1e1e1e', 600:'#2a2a2a' },
        neon: { 300:'#f9a8d4', 400:'#f472b6', 500:'#ec4899', 600:'#db2777' },
        amber: { 300:'#fcd34d', 400:'#fbbf24', 500:'#d97706', 600:'#b45309' },
        cream: { 50:'#fefce8', 100:'#fef9c3', 200:'#fef3c7', 300:'#fde68a' }
      }
    }
  }
}
</script>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Inter',sans-serif; background:#0a0a0a; color:#e5e5e5; overflow-x:hidden; }
.font-display { font-family:'Unbounded',sans-serif; }

/* --- Vinyl Record Reveal --- */
.vinyl-card {
  position: relative;
  perspective: 800px;
  cursor: pointer;
}
.vinyl-card .cover {
  position: relative;
  z-index: 2;
  transition: transform 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.5s ease;
  transform-origin: left center;
  border-radius: 8px;
  overflow: hidden;
}
.vinyl-card:hover .cover {
  transform: rotate(-5deg) translateX(-12px);
  box-shadow: -8px 8px 30px rgba(0,0,0,0.6);
}
.vinyl-card .vinyl-disc {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 88%;
  height: 88%;
  border-radius: 50%;
  z-index: 1;
  transition: transform 0.8s cubic-bezier(0.23,1,0.32,1);
}
.vinyl-card:hover .vinyl-disc {
  transform: translate(-30%, -50%) rotate(30deg);
}
/* Vinyl disc visual */
.vinyl-disc-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle,
    #1a1a1a 0%,
    #0d0d0d 20%,
    #1a1a1a 21%,
    #111 24%,
    #1a1a1a 25%,
    #111 30%,
    #1a1a1a 31%,
    #111 36%,
    #1a1a1a 37%,
    #111 42%,
    #1a1a1a 43%,
    #111 48%,
    #1a1a1a 49%,
    #111 54%,
    #1a1a1a 55%,
    #111 60%
  );
  position: relative;
}
.vinyl-disc-inner::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  width: 28%;
  height: 28%;
  border-radius: 50%;
  background: radial-gradient(circle, #2a2a2a 30%, #ec4899 31%, #ec4899 50%, #2a2a2a 51%);
}
.vinyl-disc-inner::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%);
}

/* --- Music Player Bar --- */
.player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 90;
  background: rgba(14,14,14,0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255,255,255,0.06);
}
.progress-track {
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255,255,255,0.08);
  cursor: pointer;
}
.progress-track:hover { height: 5px; top:-4px; }
.progress-fill {
  height: 100%;
  width: 35%;
  background: linear-gradient(90deg, #ec4899, #d97706);
  border-radius: 0 2px 2px 0;
  transition: width 0.1s;
}

/* --- Equalizer animation --- */
.eq-bar { animation: eq 0.8s ease infinite alternate; }
.eq-bar:nth-child(2) { animation-delay:0.15s; }
.eq-bar:nth-child(3) { animation-delay:0.3s; }
.eq-bar:nth-child(4) { animation-delay:0.1s; }
.eq-bar:nth-child(5) { animation-delay:0.25s; }
@keyframes eq { from{height:4px} to{height:18px} }

/* --- Streaming button hover --- */
.stream-btn {
  transition: all 0.3s cubic-bezier(0.23,1,0.32,1);
  border: 1px solid rgba(255,255,255,0.1);
}
.stream-btn:hover {
  border-color: #ec4899;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(236,72,153,0.15);
}

/* --- Show item --- */
.show-item {
  transition: all 0.3s;
  border: 1px solid rgba(255,255,255,0.04);
}
.show-item:hover {
  border-color: rgba(236,72,153,0.3);
  background: rgba(255,255,255,0.03);
}

/* --- Track list hover --- */
.track-row {
  transition: all 0.2s;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.track-row:hover {
  background: rgba(255,255,255,0.03);
}
.track-row:hover .track-num { opacity:0; }
.track-row:hover .track-play { opacity:1; }

/* --- Nav --- */
.nav-link { transition: color 0.2s; }
.nav-link:hover { color: #ec4899; }

/* --- Reveal anim --- */
.reveal { opacity:0; transform:translateY(28px); transition: all 0.7s cubic-bezier(0.16,1,0.3,1); }
.reveal.visible { opacity:1; transform:translateY(0); }

/* --- Spinning disc in player --- */
@keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
.spin-disc { animation: spin-slow 4s linear infinite; }
</style>
</head>
<body class="pb-20">

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-vinyl-900/80 backdrop-blur-xl border-b border-white/[0.04]">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <a class="flex items-center gap-3 cursor-pointer">
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-neon-500 to-amber-500 flex items-center justify-center">
        <div class="w-2 h-2 rounded-full bg-vinyl-900"></div>
      </div>
      <span class="font-display text-base font-semibold tracking-tight">VINYL NOVA</span>
    </a>
    <div class="flex items-center gap-8 text-sm text-gray-500 font-medium">
      <a class="nav-link cursor-pointer">Music</a>
      <a class="nav-link cursor-pointer">Shows</a>
      <a class="nav-link cursor-pointer">About</a>
      <a class="nav-link cursor-pointer">Contact</a>
      <button class="bg-neon-500 hover:bg-neon-600 text-white px-5 py-2 rounded-full text-sm font-semibold transition cursor-pointer">Listen Now</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="pt-36 pb-24 relative overflow-hidden">
  <div class="absolute inset-0">
    <div class="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-neon-500/10 blur-[150px]"></div>
    <div class="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/8 blur-[120px]"></div>
  </div>
  <div class="max-w-6xl mx-auto px-6 relative">
    <div class="flex items-center gap-16">
      <!-- Left text -->
      <div class="flex-1">
        <div class="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-full px-4 py-1.5 mb-8">
          <div class="flex gap-[3px] items-end h-4">
            <div class="eq-bar w-[3px] bg-neon-500 rounded-full"></div>
            <div class="eq-bar w-[3px] bg-neon-400 rounded-full"></div>
            <div class="eq-bar w-[3px] bg-amber-500 rounded-full"></div>
            <div class="eq-bar w-[3px] bg-neon-500 rounded-full"></div>
            <div class="eq-bar w-[3px] bg-amber-400 rounded-full"></div>
          </div>
          <span class="text-xs text-gray-400 font-medium">Now Streaming Worldwide</span>
        </div>
        <h1 class="font-display text-7xl font-bold tracking-tight leading-[0.9] mb-6">
          <span class="block text-white">NOVA</span>
          <span class="block bg-gradient-to-r from-neon-500 to-amber-500 bg-clip-text text-transparent">SOUND</span>
        </h1>
        <p class="text-gray-400 text-lg leading-relaxed max-w-md mb-10 font-light">Electronic music producer & DJ. Blending dark techno, deep house, and ambient textures into hypnotic sonic journeys.</p>
        <div class="flex items-center gap-4">
          <button class="bg-gradient-to-r from-neon-500 to-neon-600 hover:brightness-110 text-white px-8 py-3.5 rounded-full font-semibold transition cursor-pointer flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Play Latest
          </button>
          <button class="border border-white/10 hover:border-white/25 text-white px-8 py-3.5 rounded-full font-medium transition cursor-pointer">View Discography</button>
        </div>
        <div class="flex items-center gap-10 mt-14">
          <div><div class="font-display text-3xl font-bold text-white">8</div><div class="text-xs text-gray-600 mt-1 uppercase tracking-wider">Albums</div></div>
          <div class="w-px h-10 bg-white/[0.06]"></div>
          <div><div class="font-display text-3xl font-bold text-white">2.4M</div><div class="text-xs text-gray-600 mt-1 uppercase tracking-wider">Streams</div></div>
          <div class="w-px h-10 bg-white/[0.06]"></div>
          <div><div class="font-display text-3xl font-bold text-white">52</div><div class="text-xs text-gray-600 mt-1 uppercase tracking-wider">Shows</div></div>
        </div>
      </div>
      <!-- Right vinyl hero image -->
      <div class="flex-shrink-0 relative" style="width:380px;height:380px;">
        <div class="absolute inset-0 rounded-2xl overflow-hidden" style="background:linear-gradient(135deg,#1a0a2e,#0a0a0a 50%,#1a0f0a);"></div>
        <div class="absolute inset-4 rounded-xl overflow-hidden bg-gradient-to-br from-neon-600/40 to-amber-600/30 flex items-center justify-center">
          <div class="w-48 h-48 rounded-full border-[6px] border-vinyl-600/60 relative">
            <div class="w-full h-full rounded-full bg-gradient-to-br from-vinyl-800 to-vinyl-900 relative spin-disc">
              <div class="absolute inset-0 rounded-full" style="background:repeating-radial-gradient(circle,transparent,transparent 8px,rgba(255,255,255,0.02) 9px,transparent 10px);"></div>
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-neon-500/80 border-2 border-vinyl-900"></div>
            </div>
          </div>
        </div>
        <div class="absolute bottom-6 left-6 right-6">
          <div class="font-display text-xs font-bold text-white/60 uppercase tracking-[0.2em]">Latest Release</div>
          <div class="font-display text-lg font-bold text-white mt-1">Midnight Pulse EP</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Albums Section — Vinyl Reveal Grid -->
<section class="py-20 relative" id="music">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-end justify-between mb-12">
      <div>
        <span class="text-xs text-neon-500 uppercase tracking-[0.2em] font-semibold font-display">Discography</span>
        <h2 class="font-display text-4xl font-bold mt-2">Albums &amp; EPs</h2>
      </div>
      <a class="text-sm text-gray-500 hover:text-neon-400 transition cursor-pointer">View all releases &rarr;</a>
    </div>
    <div class="grid grid-cols-3 gap-8">
      <!-- Album 1 -->
      <div class="vinyl-card group">
        <div class="vinyl-disc">
          <div class="vinyl-disc-inner"></div>
        </div>
        <div class="cover aspect-square bg-gradient-to-br from-fuchsia-900 via-neon-600 to-purple-950 flex items-center justify-center">
          <div class="text-center px-6">
            <div class="font-display text-4xl font-black text-white/90 leading-tight">MIDNIGHT<br>PULSE</div>
            <div class="text-xs text-white/40 mt-3 uppercase tracking-[0.15em]">EP &bull; 2026</div>
          </div>
          <div class="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="mt-4">
          <h3 class="font-semibold text-sm text-white">Midnight Pulse</h3>
          <p class="text-xs text-gray-600 mt-0.5">5 tracks &bull; 22 min</p>
        </div>
      </div>
      <!-- Album 2 -->
      <div class="vinyl-card group">
        <div class="vinyl-disc">
          <div class="vinyl-disc-inner"></div>
        </div>
        <div class="cover aspect-square bg-gradient-to-br from-amber-800 via-amber-600 to-yellow-950 flex items-center justify-center">
          <div class="text-center px-6">
            <div class="font-display text-4xl font-black text-white/90 leading-tight">GOLDEN<br>HOUR</div>
            <div class="text-xs text-white/40 mt-3 uppercase tracking-[0.15em]">Album &bull; 2025</div>
          </div>
          <div class="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="mt-4">
          <h3 class="font-semibold text-sm text-white">Golden Hour</h3>
          <p class="text-xs text-gray-600 mt-0.5">12 tracks &bull; 54 min</p>
        </div>
      </div>
      <!-- Album 3 -->
      <div class="vinyl-card group">
        <div class="vinyl-disc">
          <div class="vinyl-disc-inner"></div>
        </div>
        <div class="cover aspect-square bg-gradient-to-br from-cyan-900 via-teal-700 to-slate-950 flex items-center justify-center">
          <div class="text-center px-6">
            <div class="font-display text-4xl font-black text-white/90 leading-tight">OCEAN<br>FLOOR</div>
            <div class="text-xs text-white/40 mt-3 uppercase tracking-[0.15em]">EP &bull; 2025</div>
          </div>
          <div class="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="mt-4">
          <h3 class="font-semibold text-sm text-white">Ocean Floor</h3>
          <p class="text-xs text-gray-600 mt-0.5">6 tracks &bull; 28 min</p>
        </div>
      </div>
      <!-- Album 4 -->
      <div class="vinyl-card group">
        <div class="vinyl-disc">
          <div class="vinyl-disc-inner"></div>
        </div>
        <div class="cover aspect-square bg-gradient-to-br from-rose-950 via-red-800 to-orange-950 flex items-center justify-center">
          <div class="text-center px-6">
            <div class="font-display text-4xl font-black text-white/90 leading-tight">EMBER<br>STATE</div>
            <div class="text-xs text-white/40 mt-3 uppercase tracking-[0.15em]">Album &bull; 2024</div>
          </div>
          <div class="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="mt-4">
          <h3 class="font-semibold text-sm text-white">Ember State</h3>
          <p class="text-xs text-gray-600 mt-0.5">10 tracks &bull; 46 min</p>
        </div>
      </div>
      <!-- Album 5 -->
      <div class="vinyl-card group">
        <div class="vinyl-disc">
          <div class="vinyl-disc-inner"></div>
        </div>
        <div class="cover aspect-square bg-gradient-to-br from-indigo-900 via-violet-700 to-slate-950 flex items-center justify-center">
          <div class="text-center px-6">
            <div class="font-display text-4xl font-black text-white/90 leading-tight">VOID<br>ECHO</div>
            <div class="text-xs text-white/40 mt-3 uppercase tracking-[0.15em]">Album &bull; 2024</div>
          </div>
          <div class="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="mt-4">
          <h3 class="font-semibold text-sm text-white">Void Echo</h3>
          <p class="text-xs text-gray-600 mt-0.5">8 tracks &bull; 38 min</p>
        </div>
      </div>
      <!-- Album 6 -->
      <div class="vinyl-card group">
        <div class="vinyl-disc">
          <div class="vinyl-disc-inner"></div>
        </div>
        <div class="cover aspect-square bg-gradient-to-br from-emerald-900 via-green-800 to-teal-950 flex items-center justify-center">
          <div class="text-center px-6">
            <div class="font-display text-4xl font-black text-white/90 leading-tight">FOREST<br>FREQ</div>
            <div class="text-xs text-white/40 mt-3 uppercase tracking-[0.15em]">EP &bull; 2023</div>
          </div>
          <div class="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="mt-4">
          <h3 class="font-semibold text-sm text-white">Forest Frequency</h3>
          <p class="text-xs text-gray-600 mt-0.5">4 tracks &bull; 20 min</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Featured Album — Track Listing -->
<section class="py-20 bg-white/[0.015]">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex gap-16 items-start">
      <!-- Album art large -->
      <div class="flex-shrink-0 w-80">
        <div class="aspect-square rounded-2xl bg-gradient-to-br from-fuchsia-900 via-neon-600 to-purple-950 flex items-center justify-center relative overflow-hidden">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.08),transparent)]"></div>
          <div class="text-center px-8 relative">
            <div class="font-display text-5xl font-black text-white/90 leading-tight">MIDNIGHT<br>PULSE</div>
            <div class="text-sm text-white/40 mt-4 uppercase tracking-[0.15em]">2026 &bull; EP</div>
          </div>
        </div>
        <div class="mt-6 flex gap-3">
          <button class="flex-1 bg-neon-500 hover:bg-neon-600 text-white py-3 rounded-xl font-semibold text-sm transition cursor-pointer flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Play All
          </button>
          <button class="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center text-gray-400 hover:text-neon-400 hover:border-neon-500/30 transition cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>
      <!-- Track listing -->
      <div class="flex-1">
        <div class="mb-8">
          <span class="text-xs text-neon-500 uppercase tracking-[0.2em] font-semibold font-display">Featured Release</span>
          <h2 class="font-display text-3xl font-bold mt-2">Midnight Pulse</h2>
          <p class="text-gray-500 text-sm mt-2 leading-relaxed">A five-track journey through the after-hours, blending driving techno rhythms with atmospheric pads and haunting vocal fragments.</p>
        </div>
        <div class="rounded-xl overflow-hidden">
          <div class="track-row flex items-center gap-4 px-4 py-3.5 cursor-pointer group">
            <div class="relative w-6 text-center">
              <span class="track-num text-xs text-gray-600">01</span>
              <svg class="track-play w-4 h-4 text-neon-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div class="flex-1"><span class="text-sm font-medium text-white">Electric Horizon</span></div>
            <span class="text-xs text-gray-600">4:32</span>
          </div>
          <div class="track-row flex items-center gap-4 px-4 py-3.5 cursor-pointer group">
            <div class="relative w-6 text-center">
              <span class="track-num text-xs text-gray-600">02</span>
              <svg class="track-play w-4 h-4 text-neon-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div class="flex-1"><span class="text-sm font-medium text-white">Pulse Code</span></div>
            <span class="text-xs text-gray-600">5:18</span>
          </div>
          <div class="track-row flex items-center gap-4 px-4 py-3.5 cursor-pointer group bg-neon-500/[0.04]">
            <div class="relative w-6 text-center">
              <div class="flex gap-[2px] items-end h-3 justify-center">
                <div class="eq-bar w-[2px] bg-neon-500 rounded-full"></div>
                <div class="eq-bar w-[2px] bg-neon-500 rounded-full"></div>
                <div class="eq-bar w-[2px] bg-neon-500 rounded-full"></div>
              </div>
            </div>
            <div class="flex-1"><span class="text-sm font-semibold text-neon-400">After Dark (feat. Yua)</span></div>
            <span class="text-xs text-neon-500/60">3:42</span>
          </div>
          <div class="track-row flex items-center gap-4 px-4 py-3.5 cursor-pointer group">
            <div class="relative w-6 text-center">
              <span class="track-num text-xs text-gray-600">04</span>
              <svg class="track-play w-4 h-4 text-neon-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div class="flex-1"><span class="text-sm font-medium text-white">Binary Sunrise</span></div>
            <span class="text-xs text-gray-600">4:56</span>
          </div>
          <div class="track-row flex items-center gap-4 px-4 py-3.5 cursor-pointer group" style="border-bottom:none;">
            <div class="relative w-6 text-center">
              <span class="track-num text-xs text-gray-600">05</span>
              <svg class="track-play w-4 h-4 text-neon-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div class="flex-1"><span class="text-sm font-medium text-white">Dissolve</span></div>
            <span class="text-xs text-gray-600">3:54</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Upcoming Shows -->
<section class="py-20" id="shows">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-end justify-between mb-12">
      <div>
        <span class="text-xs text-amber-500 uppercase tracking-[0.2em] font-semibold font-display">Live</span>
        <h2 class="font-display text-4xl font-bold mt-2">Upcoming Shows</h2>
      </div>
      <a class="text-sm text-gray-500 hover:text-amber-400 transition cursor-pointer">All dates &rarr;</a>
    </div>
    <div class="space-y-3">
      <div class="show-item flex items-center justify-between p-5 rounded-2xl bg-white/[0.02]">
        <div class="flex items-center gap-6">
          <div class="text-center w-16">
            <div class="font-display text-xs font-bold text-amber-500 uppercase">Mar</div>
            <div class="font-display text-3xl font-bold text-white">08</div>
          </div>
          <div class="w-px h-12 bg-white/[0.06]"></div>
          <div>
            <div class="font-semibold text-white">Revolver &mdash; Taipei</div>
            <div class="text-xs text-gray-500 mt-1">w/ DJ Koda &bull; Doors 22:00</div>
          </div>
        </div>
        <button class="bg-white/[0.06] hover:bg-neon-500 text-gray-300 hover:text-white px-6 py-2.5 rounded-full text-sm font-semibold transition cursor-pointer">Get Tickets</button>
      </div>
      <div class="show-item flex items-center justify-between p-5 rounded-2xl bg-white/[0.02]">
        <div class="flex items-center gap-6">
          <div class="text-center w-16">
            <div class="font-display text-xs font-bold text-amber-500 uppercase">Mar</div>
            <div class="font-display text-3xl font-bold text-white">22</div>
          </div>
          <div class="w-px h-12 bg-white/[0.06]"></div>
          <div>
            <div class="font-semibold text-white">WOMB &mdash; Tokyo</div>
            <div class="text-xs text-gray-500 mt-1">Techno Underground &bull; Doors 23:00</div>
          </div>
        </div>
        <button class="bg-white/[0.06] hover:bg-neon-500 text-gray-300 hover:text-white px-6 py-2.5 rounded-full text-sm font-semibold transition cursor-pointer">Get Tickets</button>
      </div>
      <div class="show-item flex items-center justify-between p-5 rounded-2xl bg-white/[0.02]">
        <div class="flex items-center gap-6">
          <div class="text-center w-16">
            <div class="font-display text-xs font-bold text-neon-500 uppercase">Apr</div>
            <div class="font-display text-3xl font-bold text-white">12</div>
          </div>
          <div class="w-px h-12 bg-white/[0.06]"></div>
          <div>
            <div class="font-semibold text-white">Berghain &mdash; Berlin</div>
            <div class="text-xs text-gray-500 mt-1">Panorama Bar &bull; Doors 00:00</div>
          </div>
        </div>
        <span class="text-neon-400 text-sm font-semibold px-6 py-2.5">Almost Sold Out</span>
      </div>
      <div class="show-item flex items-center justify-between p-5 rounded-2xl bg-white/[0.02]">
        <div class="flex items-center gap-6">
          <div class="text-center w-16">
            <div class="font-display text-xs font-bold text-amber-500 uppercase">May</div>
            <div class="font-display text-3xl font-bold text-white">03</div>
          </div>
          <div class="w-px h-12 bg-white/[0.06]"></div>
          <div>
            <div class="font-semibold text-white">Fabric &mdash; London</div>
            <div class="text-xs text-gray-500 mt-1">Room One &bull; Doors 23:00</div>
          </div>
        </div>
        <button class="bg-white/[0.06] hover:bg-neon-500 text-gray-300 hover:text-white px-6 py-2.5 rounded-full text-sm font-semibold transition cursor-pointer">Get Tickets</button>
      </div>
    </div>
  </div>
</section>

<!-- Bio / About -->
<section class="py-20 bg-white/[0.015]" id="about">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex gap-16 items-center">
      <div class="flex-1">
        <span class="text-xs text-neon-500 uppercase tracking-[0.2em] font-semibold font-display">About</span>
        <h2 class="font-display text-4xl font-bold mt-2 mb-6">The Story Behind<br>the Sound</h2>
        <div class="space-y-4 text-gray-400 leading-relaxed">
          <p>Starting from the underground rave scenes of Taipei, Nova has carved a sonic identity that bridges the gap between mechanical precision and raw emotional energy.</p>
          <p>With influences spanning from Detroit techno pioneers to Japanese ambient masters, each production is a carefully sculpted world of rhythm, texture, and space. The music lives in the tension between darkness and light.</p>
          <p>After years of late-night sets in warehouses and club basements, Nova now performs on stages across Asia and Europe, bringing the intimate energy of underground culture to every venue.</p>
        </div>
        <div class="flex gap-6 mt-10">
          <div class="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-6 py-4 text-center">
            <div class="font-display text-2xl font-bold text-white">6</div>
            <div class="text-xs text-gray-600 mt-1">Years Active</div>
          </div>
          <div class="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-6 py-4 text-center">
            <div class="font-display text-2xl font-bold text-white">14</div>
            <div class="text-xs text-gray-600 mt-1">Countries</div>
          </div>
          <div class="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-6 py-4 text-center">
            <div class="font-display text-2xl font-bold text-white">3</div>
            <div class="text-xs text-gray-600 mt-1">Residencies</div>
          </div>
        </div>
      </div>
      <!-- Photo placeholder -->
      <div class="flex-shrink-0 w-96 h-[480px] rounded-3xl overflow-hidden relative bg-gradient-to-b from-vinyl-700 to-vinyl-900">
        <div class="absolute inset-0 bg-gradient-to-t from-vinyl-900 via-transparent to-transparent"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="w-24 h-24 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <svg class="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
            </div>
            <div class="text-sm text-gray-600">Artist Photo</div>
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-vinyl-900 via-vinyl-900/80 to-transparent">
          <div class="font-display text-xs text-neon-500/60 uppercase tracking-[0.2em]">DJ &bull; Producer &bull; Sound Designer</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Streaming Links -->
<section class="py-20">
  <div class="max-w-6xl mx-auto px-6 text-center">
    <span class="text-xs text-amber-500 uppercase tracking-[0.2em] font-semibold font-display">Listen Everywhere</span>
    <h2 class="font-display text-4xl font-bold mt-2 mb-12">Stream My Music</h2>
    <div class="grid grid-cols-4 gap-4 max-w-3xl mx-auto">
      <a class="stream-btn rounded-2xl p-6 flex flex-col items-center gap-3 bg-white/[0.02] cursor-pointer group">
        <svg class="w-10 h-10 text-[#1DB954] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
        <span class="text-sm font-semibold text-white">Spotify</span>
      </a>
      <a class="stream-btn rounded-2xl p-6 flex flex-col items-center gap-3 bg-white/[0.02] cursor-pointer group">
        <svg class="w-10 h-10 text-[#FA243C] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0 0 19.7.263C18.96.1 18.21.036 17.457.024 16.916.01 16.375.004 15.835 0h-7.672C7.61.003 7.058.01 6.506.025 5.766.036 5.028.1 4.3.263a5.02 5.02 0 0 0-1.878.628C1.303 1.633.558 2.633.24 3.944A8.957 8.957 0 0 0 0 6.134v11.732c0 .738.065 1.47.24 2.19.318 1.31 1.063 2.31 2.182 3.043A5.02 5.02 0 0 0 4.3 23.727c.738.163 1.487.228 2.24.24.552.014 1.104.02 1.656.024h7.672c.553-.004 1.106-.01 1.658-.024.752-.012 1.5-.077 2.24-.24a5.021 5.021 0 0 0 1.877-.628c1.118-.733 1.863-1.733 2.18-3.043.176-.72.24-1.452.24-2.19V6.124zm-3.6 11.505c-.008.178-.025.354-.063.527-.12.548-.396.94-.864 1.185a2.07 2.07 0 0 1-.645.22c-.315.06-.634.08-.954.092-.383.012-.766.02-1.15.024H7.283c-.383-.004-.766-.012-1.15-.024-.32-.012-.64-.032-.955-.092a2.074 2.074 0 0 1-.644-.22c-.467-.244-.744-.636-.864-1.185a3.496 3.496 0 0 1-.063-.527V6.37c.008-.178.025-.354.063-.527.12-.548.397-.94.864-1.185.19-.1.394-.17.644-.22.316-.06.636-.08.955-.092.384-.012.767-.02 1.15-.024h9.05c.384.004.767.012 1.15.024.32.012.64.032.955.092.25.05.455.12.644.22.468.244.744.637.864 1.185.038.173.055.349.063.527v11.259zm-4.622-5.2l-5.04-2.912a.644.644 0 0 0-.644 0 .644.644 0 0 0-.322.558v5.824c0 .23.122.442.322.558.1.058.21.086.322.086s.222-.03.322-.086l5.04-2.912a.644.644 0 0 0 .322-.558.644.644 0 0 0-.322-.558z"/></svg>
        <span class="text-sm font-semibold text-white">Apple Music</span>
      </a>
      <a class="stream-btn rounded-2xl p-6 flex flex-col items-center gap-3 bg-white/[0.02] cursor-pointer group">
        <svg class="w-10 h-10 text-[#FF5500] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.172 1.282c.013.06.045.094.104.094.057 0 .09-.037.104-.094l.2-1.282-.2-1.332c-.014-.057-.047-.094-.104-.094m1.8-1.283c-.063 0-.1.044-.11.103l-.21 2.607.209 2.545c.009.06.047.101.11.101.063 0 .1-.04.11-.1l.233-2.546-.234-2.608c-.009-.06-.047-.103-.11-.103m.89-.271c-.065 0-.104.044-.114.103l-.198 2.877.197 2.707c.01.06.05.101.114.101.065 0 .103-.04.114-.1l.218-2.708-.219-2.877c-.011-.06-.049-.103-.114-.103m.93-.262c-.074 0-.114.047-.12.11l-.178 3.14.178 2.828c.006.064.046.11.12.11.072 0 .112-.046.12-.11l.196-2.828-.197-3.14c-.008-.063-.048-.11-.12-.11m.882-.176c-.077 0-.116.045-.126.111l-.167 3.316.167 2.878c.01.067.049.113.126.113.077 0 .117-.046.126-.113l.184-2.878-.184-3.316c-.009-.066-.049-.111-.126-.111m.94-.26c-.08 0-.12.05-.13.117l-.15 3.575.15 2.9c.01.07.05.117.13.117.08 0 .12-.047.13-.117l.167-2.9-.168-3.575c-.009-.068-.049-.117-.13-.117m.91-.05c-.083 0-.126.05-.135.12l-.137 3.625.137 2.92c.009.073.052.12.135.12.084 0 .126-.047.135-.12l.152-2.92-.152-3.624c-.009-.072-.05-.121-.135-.121m.94.135c-.086 0-.13.054-.14.127l-.122 3.49.122 2.933c.01.073.054.127.14.127.087 0 .13-.054.14-.127l.135-2.933-.135-3.49c-.01-.073-.053-.127-.14-.127m.94-.215c-.089 0-.133.054-.143.127l-.11 3.705.11 2.941c.01.076.054.127.143.127.09 0 .133-.051.143-.127l.123-2.941-.123-3.705c-.01-.073-.053-.127-.143-.127m.94.107c-.092 0-.137.057-.147.134l-.097 3.598.097 2.95c.01.076.055.133.147.133.09 0 .137-.057.147-.133l.107-2.95-.107-3.598c-.01-.077-.057-.134-.147-.134m.94-.15c-.095 0-.14.06-.15.137l-.088 3.748.087 2.956c.01.08.055.137.15.137.096 0 .14-.057.15-.137l.097-2.956-.097-3.748c-.01-.077-.054-.137-.15-.137m.94.39c-.098 0-.144.06-.153.14l-.074 3.358.074 2.963c.009.08.055.14.153.14.096 0 .143-.06.153-.14l.083-2.963-.083-3.359c-.01-.08-.057-.14-.153-.14m.94-.39c-.1 0-.146.063-.157.143l-.063 3.748.063 2.966c.01.08.057.143.157.143.099 0 .146-.063.157-.143l.07-2.966-.07-3.748c-.01-.08-.058-.143-.157-.143m.94.507c-.103 0-.15.063-.16.146l-.05 3.241.05 2.97c.01.083.057.146.16.146.102 0 .15-.063.16-.146l.056-2.97-.057-3.241c-.009-.083-.057-.146-.16-.146m.94-.176c-.105 0-.152.066-.163.15l-.04 3.417.04 2.973c.01.083.058.149.163.149.104 0 .152-.066.162-.149l.045-2.973-.045-3.418c-.01-.083-.058-.149-.162-.149m.94.107c-.108 0-.155.066-.166.15l-.027 3.31.027 2.98c.011.083.058.149.166.149s.155-.066.166-.15l.03-2.979-.03-3.31c-.011-.083-.058-.15-.166-.15m.94-.225c-.11 0-.157.07-.17.154l-.015 3.535.016 2.983c.012.087.06.154.17.154.108 0 .157-.07.168-.154l.018-2.983-.018-3.535c-.011-.084-.06-.154-.168-.154m.94.64c-.112 0-.16.07-.172.157l-.003 2.895.003 2.987c.012.087.06.157.172.157.11 0 .16-.07.172-.157l.003-2.987-.003-2.895c-.012-.087-.062-.157-.172-.157m.94-.382c-.114 0-.162.073-.174.16v5.652c.012.088.06.16.174.16.113 0 .162-.072.174-.16V12.4c-.012-.088-.06-.16-.174-.16M24 14.48v-.001c-.115 0-.163.073-.175.16V14.8c.012.088.06.16.175.16.114 0 .162-.072.175-.16V14.64c-.013-.087-.06-.16-.175-.16"/></svg>
        <span class="text-sm font-semibold text-white">SoundCloud</span>
      </a>
      <a class="stream-btn rounded-2xl p-6 flex flex-col items-center gap-3 bg-white/[0.02] cursor-pointer group">
        <svg class="w-10 h-10 text-white/70 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 17.403c-.222.364-.695.479-1.059.256-2.898-1.77-6.547-2.17-10.847-1.189-.414.095-.828-.164-.923-.579-.095-.414.164-.828.579-.922 4.7-1.074 8.728-.612 11.993 1.375.364.222.479.695.257 1.059zm1.57-3.451c-.281.459-.878.603-1.337.322-3.318-2.04-8.374-2.632-12.294-1.44-.501.152-1.03-.13-1.182-.63-.15-.501.131-1.03.632-1.182 4.476-1.362 10.037-.702 13.86 1.593.459.28.603.878.322 1.337zm.134-3.594C15.558 7.953 9.04 7.748 5.266 8.896c-.6.183-1.234-.155-1.416-.755-.183-.6.155-1.234.756-1.417 4.334-1.32 11.537-1.065 16.09 1.672.553.322.734 1.03.413 1.583-.322.553-1.031.734-1.584.413l.073-.034z"/></svg>
        <span class="text-sm font-semibold text-white">Bandcamp</span>
      </a>
    </div>
  </div>
</section>

<!-- Fixed Music Player Bar -->
<div class="player-bar">
  <div class="progress-track">
    <div class="progress-fill"></div>
  </div>
  <div class="max-w-6xl mx-auto px-6 h-[72px] flex items-center justify-between">
    <!-- Left: track info -->
    <div class="flex items-center gap-4 min-w-0 flex-1">
      <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-fuchsia-900 to-neon-600 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
        <div class="w-8 h-8 rounded-full bg-vinyl-800 spin-disc relative">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-neon-500"></div>
        </div>
      </div>
      <div class="min-w-0">
        <div class="text-sm font-semibold text-white truncate">After Dark (feat. Yua)</div>
        <div class="text-xs text-gray-600 truncate">Midnight Pulse &mdash; Track 03</div>
      </div>
      <button class="ml-2 text-gray-600 hover:text-neon-400 transition cursor-pointer flex-shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
    </div>
    <!-- Center: controls -->
    <div class="flex items-center gap-5">
      <button class="text-gray-500 hover:text-white transition cursor-pointer">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629v-2.34l6.945 3.968c1.25.714 2.805-.188 2.805-1.628V7.19c0-1.44-1.555-2.342-2.805-1.628L12 9.53V7.19c0-1.44-1.555-2.342-2.805-1.628l-6.945 3.97c-1.25.713-1.25 2.543 0 3.256l6.945 3.652z"/></svg>
      </button>
      <button class="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition cursor-pointer">
        <svg class="w-4 h-4 text-vinyl-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
      <button class="text-gray-500 hover:text-white transition cursor-pointer">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14.805 5.56c-1.25-.714-2.805.189-2.805 1.628v2.34L5.055 5.56C3.805 4.846 2.25 5.748 2.25 7.188v9.624c0 1.44 1.555 2.342 2.805 1.628L12 14.47v2.342c0 1.44 1.555 2.342 2.805 1.628l6.945-3.968c1.25-.714 1.25-2.543 0-3.256L14.805 5.56z"/></svg>
      </button>
    </div>
    <!-- Right: time + volume -->
    <div class="flex items-center gap-4 justify-end flex-1">
      <span class="text-xs text-gray-600 tabular-nums">1:18 / 3:42</span>
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11.553 3.064A.75.75 0 0112 3.75v16.5a.75.75 0 01-1.255.555L5.46 16H2.75A.75.75 0 012 15.25v-6.5A.75.75 0 012.75 8H5.46l5.285-4.805z"/><path d="M14.47 8.47a.75.75 0 011.06 0 5 5 0 010 7.071.75.75 0 01-1.06-1.06 3.5 3.5 0 000-4.95.75.75 0 010-1.061z"/><path d="M16.59 6.344a.75.75 0 011.06 0 8 8 0 010 11.314.75.75 0 01-1.06-1.06 6.5 6.5 0 000-9.193.75.75 0 010-1.06z"/></svg>
        <div class="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
          <div class="h-full w-3/4 bg-white/40 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Footer -->
<footer class="border-t border-white/[0.04] py-16 pb-28">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-start justify-between">
      <div>
        <a class="flex items-center gap-3 cursor-pointer mb-4">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-neon-500 to-amber-500 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-vinyl-900"></div>
          </div>
          <span class="font-display text-base font-semibold tracking-tight">VINYL NOVA</span>
        </a>
        <p class="text-sm text-gray-600 max-w-xs leading-relaxed">Electronic music producer and DJ based in Taipei. Blending techno, deep house, and ambient into hypnotic sets.</p>
      </div>
      <div class="flex gap-16">
        <div>
          <h4 class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">Navigate</h4>
          <div class="space-y-3 text-sm text-gray-500">
            <a class="block hover:text-white transition cursor-pointer">Music</a>
            <a class="block hover:text-white transition cursor-pointer">Shows</a>
            <a class="block hover:text-white transition cursor-pointer">About</a>
            <a class="block hover:text-white transition cursor-pointer">Contact</a>
          </div>
        </div>
        <div>
          <h4 class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">Listen</h4>
          <div class="space-y-3 text-sm text-gray-500">
            <a class="block hover:text-[#1DB954] transition cursor-pointer">Spotify</a>
            <a class="block hover:text-[#FA243C] transition cursor-pointer">Apple Music</a>
            <a class="block hover:text-[#FF5500] transition cursor-pointer">SoundCloud</a>
            <a class="block hover:text-amber-400 transition cursor-pointer">Bandcamp</a>
          </div>
        </div>
        <div>
          <h4 class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">Connect</h4>
          <div class="space-y-3 text-sm text-gray-500">
            <a class="block hover:text-white transition cursor-pointer">Instagram</a>
            <a class="block hover:text-white transition cursor-pointer">Twitter/X</a>
            <a class="block hover:text-white transition cursor-pointer">YouTube</a>
            <a class="block hover:text-white transition cursor-pointer">Booking</a>
          </div>
        </div>
      </div>
    </div>
    <div class="border-t border-white/[0.04] mt-12 pt-8 flex items-center justify-between">
      <span class="text-xs text-gray-700">&copy; 2026 VINYL NOVA. All rights reserved.</span>
      <div class="flex items-center gap-2 text-xs text-gray-700">
        <div class="flex gap-[2px] items-end h-3">
          <div class="eq-bar w-[2px] bg-neon-500/30 rounded-full" style="animation-duration:1.2s"></div>
          <div class="eq-bar w-[2px] bg-neon-400/30 rounded-full" style="animation-duration:0.9s"></div>
          <div class="eq-bar w-[2px] bg-amber-500/30 rounded-full" style="animation-duration:1.1s"></div>
        </div>
        <span>Always playing</span>
      </div>
    </div>
  </div>
</footer>

<script>
// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const obs = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
},{threshold:0.15});
revealEls.forEach(el=>obs.observe(el));
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
