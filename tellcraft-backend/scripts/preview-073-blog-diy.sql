INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '9dde6d85-ef7d-41f2-9b78-be925dfabd51',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MakerSpace - DIY Projects & Workshop</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Titan+One&family=Work+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        titan: ['Titan One', 'cursive'],
        work: ['Work Sans', 'sans-serif']
      },
      colors: {
        wood: { 50:'#fdf8f0', 100:'#f5e6d0', 200:'#e8d0a9', 300:'#d4a574', 400:'#b8834a', 500:'#9a6b35', 600:'#78350f', 700:'#5c2a0e', 800:'#421e0a', 900:'#2d1507' },
        safety: { 50:'#fff7ed', 100:'#ffedd5', 200:'#fed7aa', 300:'#fdba74', 400:'#fb923c', 500:'#ea580c', 600:'#c2410c', 700:'#9a3412' },
        steel: { 50:'#fafafa', 100:'#f4f4f5', 200:'#e4e4e7', 300:'#d4d4d8', 400:'#a1a1aa', 500:'#71717a', 600:'#52525b', 700:'#3f3f46', 800:'#27272a' },
        craft: { 50:'#fefaf4', 100:'#fdf2e4', 200:'#f5e0c4', 300:'#d4a574' }
      }
    }
  }
}
</script>
<style>
* { font-family: 'Work Sans', sans-serif; }
body { background: #fefaf4; }
.font-titan { font-family: 'Titan One', cursive; }
.project-card { transition: all 0.35s cubic-bezier(0.25,0.46,0.45,0.94); cursor: pointer; }
.project-card:hover { transform: translateY(-6px); box-shadow: 0 16px 32px rgba(120,53,15,0.12); }
.difficulty-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #d4a574; }
.difficulty-dot.filled { background: #ea580c; border-color: #ea580c; }
.tool-icon { position: absolute; opacity: 0.06; }
.filter-btn { transition: all 0.25s; cursor: pointer; border: 2px solid #e4e4e7; }
.filter-btn:hover, .filter-btn.active { background: #78350f; color: white; border-color: #78350f; }
.tool-card { transition: all 0.3s; cursor: pointer; }
.tool-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(120,53,15,0.1); }
.scroll-reveal { opacity: 0; transform: translateY(24px); transition: all 0.7s cubic-bezier(0.25,0.46,0.45,0.94); }
.scroll-reveal.visible { opacity: 1; transform: translateY(0); }
</style>
</head>
<body>

<!-- SVG Defs for reusable tool icons -->
<svg style="display:none">
  <defs>
    <symbol id="icon-hammer" viewBox="0 0 64 64">
      <path d="M20 8l12 12-4 4 8 8 4-4 12 12-4 4-12-12-4 4-8-8 4-4L16 12z" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M28 36l-16 16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </symbol>
    <symbol id="icon-saw" viewBox="0 0 64 64">
      <path d="M8 20h40l8-8v8H8z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
      <path d="M8 20v28M16 20v4M22 20v6M28 20v4M34 20v6M40 20v4M46 20v6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </symbol>
    <symbol id="icon-paintbrush" viewBox="0 0 64 64">
      <path d="M40 8c-6 10-8 14-12 20-2 4-1 8 2 10s7 1 10-2c6-4 10-6 20-12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M30 38c-2 4-6 10-8 14-1 2-4 4-6 4s-4-4-2-8l6-12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </symbol>
    <symbol id="icon-wrench" viewBox="0 0 64 64">
      <path d="M42 8a14 14 0 00-18 18l-16 16a4 4 0 005.6 5.6l16-16A14 14 0 0042 8z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="38" cy="20" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
    </symbol>
    <symbol id="icon-ruler" viewBox="0 0 64 64">
      <rect x="6" y="24" width="52" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="3"/>
      <path d="M14 24v8M22 24v10M30 24v8M38 24v10M46 24v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </symbol>
    <symbol id="icon-drill" viewBox="0 0 64 64">
      <rect x="20" y="16" width="24" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>
      <path d="M32 36v16M28 52h8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <path d="M32 16v-8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <circle cx="32" cy="26" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
    </symbol>
  </defs>
</svg>

<!-- Nav -->
<nav class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-wood-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-3">
      <svg class="w-7 h-7 text-wood-600"><use href="#icon-wrench"/></svg>
      <span class="font-titan text-xl text-wood-600 tracking-wide">MakerSpace</span>
    </div>
    <div class="flex items-center gap-7 text-sm font-medium text-steel-500">
      <a class="hover:text-safety-500 transition cursor-pointer">Projects</a>
      <a class="hover:text-safety-500 transition cursor-pointer">Tools</a>
      <a class="hover:text-safety-500 transition cursor-pointer">Tips</a>
      <a class="hover:text-safety-500 transition cursor-pointer">Community</a>
    </div>
  </div>
</nav>

<!-- Hero / Featured Project -->
<section class="relative overflow-hidden py-20 bg-gradient-to-br from-wood-50 via-craft-50 to-safety-50">
  <!-- Decorative tool icons -->
  <svg class="tool-icon w-32 h-32 text-wood-600" style="top:10%;left:3%;transform:rotate(-20deg)"><use href="#icon-hammer"/></svg>
  <svg class="tool-icon w-24 h-24 text-safety-500" style="top:60%;left:8%;transform:rotate(15deg)"><use href="#icon-paintbrush"/></svg>
  <svg class="tool-icon w-28 h-28 text-wood-600" style="top:15%;right:5%;transform:rotate(25deg)"><use href="#icon-saw"/></svg>
  <svg class="tool-icon w-20 h-20 text-safety-500" style="bottom:10%;right:12%;transform:rotate(-10deg)"><use href="#icon-ruler"/></svg>

  <div class="max-w-6xl mx-auto px-6 flex items-start gap-12 relative z-10">
    <div class="flex-1">
      <span class="inline-block text-xs bg-safety-500 text-white px-3 py-1 rounded-full mb-4 font-semibold tracking-wide uppercase">Featured Project</span>
      <div class="flex items-start gap-6 mb-4">
        <span class="font-titan text-9xl text-wood-600 opacity-10 leading-none select-none" style="margin-top:-12px">01</span>
        <div>
          <h1 class="font-titan text-4xl text-wood-700 leading-tight mb-3">Build a Floating Shelf</h1>
          <p class="text-steel-500 leading-relaxed max-w-lg">Transform raw wood into a beautiful wall-mounted floating shelf with hidden brackets. A weekend project that adds warmth and character to any room.</p>
        </div>
      </div>
      <div class="flex items-center gap-5 mb-6 ml-2">
        <div class="flex items-center gap-2 text-sm text-steel-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span>3-4 hours</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-steel-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          <span>6 materials</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-steel-400">
          <span>Difficulty</span>
          <div class="flex gap-1">
            <div class="difficulty-dot filled"></div>
            <div class="difficulty-dot filled"></div>
            <div class="difficulty-dot filled"></div>
            <div class="difficulty-dot"></div>
            <div class="difficulty-dot"></div>
          </div>
        </div>
      </div>
      <button class="bg-wood-600 hover:bg-wood-700 text-white px-7 py-3 rounded-lg text-sm font-semibold transition shadow-lg shadow-wood-600/20">Start Building</button>
    </div>

    <!-- Materials sidebar -->
    <div class="w-64 bg-white/80 backdrop-blur rounded-2xl p-5 border border-wood-100 shadow-sm">
      <h3 class="font-titan text-sm text-wood-600 mb-3 uppercase tracking-wider">Materials List</h3>
      <ul class="space-y-2.5 text-sm text-steel-600">
        <li class="flex items-center gap-2"><span class="w-1.5 h-1.5 bg-safety-500 rounded-full"></span>Pine board (1x10x48")</li>
        <li class="flex items-center gap-2"><span class="w-1.5 h-1.5 bg-safety-500 rounded-full"></span>Hidden bracket kit</li>
        <li class="flex items-center gap-2"><span class="w-1.5 h-1.5 bg-safety-500 rounded-full"></span>Wood stain (walnut)</li>
        <li class="flex items-center gap-2"><span class="w-1.5 h-1.5 bg-safety-500 rounded-full"></span>Sandpaper (120/220)</li>
        <li class="flex items-center gap-2"><span class="w-1.5 h-1.5 bg-safety-500 rounded-full"></span>Polyurethane finish</li>
        <li class="flex items-center gap-2"><span class="w-1.5 h-1.5 bg-safety-500 rounded-full"></span>Wood filler</li>
      </ul>
    </div>
  </div>
</section>

<!-- Tool Icon Decoration Band -->
<div class="relative py-6 overflow-hidden bg-white border-y border-wood-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-center gap-16">
    <svg class="w-10 h-10 text-wood-200" style="transform:rotate(-12deg)"><use href="#icon-hammer"/></svg>
    <svg class="w-10 h-10 text-safety-200" style="transform:rotate(8deg)"><use href="#icon-saw"/></svg>
    <svg class="w-10 h-10 text-wood-200" style="transform:rotate(-5deg)"><use href="#icon-paintbrush"/></svg>
    <svg class="w-10 h-10 text-safety-200" style="transform:rotate(15deg)"><use href="#icon-ruler"/></svg>
    <svg class="w-10 h-10 text-wood-200" style="transform:rotate(-8deg)"><use href="#icon-drill"/></svg>
    <svg class="w-10 h-10 text-safety-200" style="transform:rotate(20deg)"><use href="#icon-wrench"/></svg>
  </div>
</div>

<!-- Difficulty Filter -->
<section class="max-w-6xl mx-auto px-6 pt-10 pb-2">
  <div class="flex items-center justify-between">
    <h2 class="font-titan text-2xl text-wood-700">Project Workshop</h2>
    <div class="flex items-center gap-3">
      <button class="filter-btn active px-5 py-2 rounded-lg text-sm font-semibold" data-filter="all">All</button>
      <button class="filter-btn px-5 py-2 rounded-lg text-sm font-semibold" data-filter="beginner">Beginner</button>
      <button class="filter-btn px-5 py-2 rounded-lg text-sm font-semibold" data-filter="intermediate">Intermediate</button>
      <button class="filter-btn px-5 py-2 rounded-lg text-sm font-semibold" data-filter="advanced">Advanced</button>
    </div>
  </div>
</section>

<!-- Project Grid -->
<section class="max-w-6xl mx-auto px-6 py-8">
  <div class="grid grid-cols-2 gap-6" id="projectGrid">
    <!-- Card 1 -->
    <div class="project-card bg-white rounded-2xl overflow-hidden border border-wood-100 relative scroll-reveal" data-level="beginner">
      <span class="absolute top-4 left-4 font-titan text-8xl text-wood-600 opacity-[0.05] leading-none select-none z-0">01</span>
      <div class="relative z-10 p-6">
        <div class="flex items-start justify-between mb-3">
          <span class="inline-block text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">Beginner</span>
          <svg class="w-6 h-6 text-wood-300"><use href="#icon-hammer"/></svg>
        </div>
        <h3 class="font-titan text-lg text-wood-700 mb-2">Wooden Picture Frame</h3>
        <p class="text-sm text-steel-400 mb-4 leading-relaxed">Hand-cut mitered corners and a rustic finish make this frame a personal keepsake for any photo.</p>
        <div class="flex items-center gap-5 text-xs text-steel-400">
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span>1-2 hrs</span>
          </div>
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <span>4 materials</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span>Difficulty</span>
            <div class="flex gap-0.5">
              <div class="difficulty-dot filled"></div>
              <div class="difficulty-dot"></div>
              <div class="difficulty-dot"></div>
              <div class="difficulty-dot"></div>
              <div class="difficulty-dot"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 2 -->
    <div class="project-card bg-white rounded-2xl overflow-hidden border border-wood-100 relative scroll-reveal" data-level="intermediate">
      <span class="absolute top-4 left-4 font-titan text-8xl text-wood-600 opacity-[0.05] leading-none select-none z-0">02</span>
      <div class="relative z-10 p-6">
        <div class="flex items-start justify-between mb-3">
          <span class="inline-block text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold">Intermediate</span>
          <svg class="w-6 h-6 text-wood-300"><use href="#icon-saw"/></svg>
        </div>
        <h3 class="font-titan text-lg text-wood-700 mb-2">Cutting Board with Inlay</h3>
        <p class="text-sm text-steel-400 mb-4 leading-relaxed">Combine walnut and maple strips for a stunning end-grain cutting board with a contrasting wood inlay pattern.</p>
        <div class="flex items-center gap-5 text-xs text-steel-400">
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span>4-5 hrs</span>
          </div>
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <span>5 materials</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span>Difficulty</span>
            <div class="flex gap-0.5">
              <div class="difficulty-dot filled"></div>
              <div class="difficulty-dot filled"></div>
              <div class="difficulty-dot filled"></div>
              <div class="difficulty-dot"></div>
              <div class="difficulty-dot"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 3 -->
    <div class="project-card bg-white rounded-2xl overflow-hidden border border-wood-100 relative scroll-reveal" data-level="beginner">
      <span class="absolute top-4 left-4 font-titan text-8xl text-wood-600 opacity-[0.05] leading-none select-none z-0">03</span>
      <div class="relative z-10 p-6">
        <div class="flex items-start justify-between mb-3">
          <span class="inline-block text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">Beginner</span>
          <svg class="w-6 h-6 text-wood-300"><use href="#icon-paintbrush"/></svg>
        </div>
        <h3 class="font-titan text-lg text-wood-700 mb-2">Painted Planter Box</h3>
        <p class="text-sm text-steel-400 mb-4 leading-relaxed">Build a cedar planter box with drainage holes, then finish with a weatherproof paint in your favorite color.</p>
        <div class="flex items-center gap-5 text-xs text-steel-400">
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span>2-3 hrs</span>
          </div>
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <span>5 materials</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span>Difficulty</span>
            <div class="flex gap-0.5">
              <div class="difficulty-dot filled"></div>
              <div class="difficulty-dot filled"></div>
              <div class="difficulty-dot"></div>
              <div class="difficulty-dot"></div>
              <div class="difficulty-dot"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 4 -->
    <div class="project-card bg-white rounded-2xl overflow-hidden border border-wood-100 relative scroll-reveal" data-level="advanced">
      <span class="absolute top-4 left-4 font-titan text-8xl text-wood-600 opacity-[0.05] leading-none select-none z-0">04</span>
      <div class="relative z-10 p-6">
        <div class="flex items-start justify-between mb-3">
          <span class="inline-block text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-semibold">Advanced</span>
          <svg class="w-6 h-6 text-wood-300"><use href="#icon-drill"/></svg>
        </div>
        <h3 class="font-titan text-lg text-wood-700 mb-2">Dovetail Jewelry Box</h3>
        <p class="text-sm text-steel-400 mb-4 leading-relaxed">Master traditional dovetail joinery in this heirloom-quality jewelry box with a velvet-lined interior and brass hinges.</p>
        <div class="flex items-center gap-5 text-xs text-steel-400">
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span>8-10 hrs</span>
          </div>
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <span>8 materials</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span>Difficulty</span>
            <div class="flex gap-0.5">
              <div class="difficulty-dot filled"></div>
              <div class="difficulty-dot filled"></div>
              <div class="difficulty-dot filled"></div>
              <div class="difficulty-dot filled"></div>
              <div class="difficulty-dot filled"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Scattered Tool Icons between sections -->
<div class="relative py-4 overflow-hidden">
  <svg class="tool-icon w-40 h-40 text-wood-600" style="top:-20px;left:5%;transform:rotate(30deg);opacity:0.04"><use href="#icon-saw"/></svg>
  <svg class="tool-icon w-28 h-28 text-safety-500" style="top:0;right:8%;transform:rotate(-18deg);opacity:0.04"><use href="#icon-drill"/></svg>
</div>

<!-- Tools List -->
<section class="bg-white border-y border-wood-100 py-14">
  <div class="max-w-6xl mx-auto px-6 scroll-reveal">
    <div class="flex items-center gap-3 mb-8">
      <svg class="w-7 h-7 text-safety-500"><use href="#icon-wrench"/></svg>
      <h2 class="font-titan text-2xl text-wood-700">Recommended Tools</h2>
    </div>
    <div class="grid grid-cols-3 gap-5">
      <div class="tool-card bg-craft-50 rounded-xl p-5 border border-wood-100">
        <div class="flex items-center gap-4 mb-3">
          <div class="w-12 h-12 bg-wood-600 rounded-lg flex items-center justify-center">
            <svg class="w-7 h-7 text-white"><use href="#icon-saw"/></svg>
          </div>
          <div>
            <h3 class="font-semibold text-wood-700 text-sm">Japanese Pull Saw</h3>
            <p class="text-xs text-steel-400">Precision cutting</p>
          </div>
        </div>
        <p class="text-xs text-steel-500 leading-relaxed">Thin kerf and pull-stroke design gives you cleaner, more accurate cuts than a Western push saw. Essential for joinery work.</p>
      </div>
      <div class="tool-card bg-craft-50 rounded-xl p-5 border border-wood-100">
        <div class="flex items-center gap-4 mb-3">
          <div class="w-12 h-12 bg-safety-500 rounded-lg flex items-center justify-center">
            <svg class="w-7 h-7 text-white"><use href="#icon-drill"/></svg>
          </div>
          <div>
            <h3 class="font-semibold text-wood-700 text-sm">Cordless Drill/Driver</h3>
            <p class="text-xs text-steel-400">Versatile power</p>
          </div>
        </div>
        <p class="text-xs text-steel-500 leading-relaxed">A 20V cordless drill with adjustable torque covers 90% of home workshop needs. Look for brushless motors for longer life.</p>
      </div>
      <div class="tool-card bg-craft-50 rounded-xl p-5 border border-wood-100">
        <div class="flex items-center gap-4 mb-3">
          <div class="w-12 h-12 bg-wood-400 rounded-lg flex items-center justify-center">
            <svg class="w-7 h-7 text-white"><use href="#icon-ruler"/></svg>
          </div>
          <div>
            <h3 class="font-semibold text-wood-700 text-sm">Combination Square</h3>
            <p class="text-xs text-steel-400">Measure & mark</p>
          </div>
        </div>
        <p class="text-xs text-steel-500 leading-relaxed">Measure, mark 90 and 45 degree angles, check squareness, and scribe lines. One tool that replaces three.</p>
      </div>
      <div class="tool-card bg-craft-50 rounded-xl p-5 border border-wood-100">
        <div class="flex items-center gap-4 mb-3">
          <div class="w-12 h-12 bg-steel-600 rounded-lg flex items-center justify-center">
            <svg class="w-7 h-7 text-white"><use href="#icon-hammer"/></svg>
          </div>
          <div>
            <h3 class="font-semibold text-wood-700 text-sm">Dead Blow Mallet</h3>
            <p class="text-xs text-steel-400">Assembly & fitting</p>
          </div>
        </div>
        <p class="text-xs text-steel-500 leading-relaxed">Non-marring face won't damage your workpiece. The sand-filled head eliminates bounce for precise assembly taps.</p>
      </div>
      <div class="tool-card bg-craft-50 rounded-xl p-5 border border-wood-100">
        <div class="flex items-center gap-4 mb-3">
          <div class="w-12 h-12 bg-wood-600 rounded-lg flex items-center justify-center">
            <svg class="w-7 h-7 text-white"><use href="#icon-paintbrush"/></svg>
          </div>
          <div>
            <h3 class="font-semibold text-wood-700 text-sm">Foam Brush Set</h3>
            <p class="text-xs text-steel-400">Smooth finishes</p>
          </div>
        </div>
        <p class="text-xs text-steel-500 leading-relaxed">Disposable foam brushes give streak-free finishes with stain and polyurethane. Keep various sizes on hand.</p>
      </div>
      <div class="tool-card bg-craft-50 rounded-xl p-5 border border-wood-100">
        <div class="flex items-center gap-4 mb-3">
          <div class="w-12 h-12 bg-safety-600 rounded-lg flex items-center justify-center">
            <svg class="w-7 h-7 text-white"><use href="#icon-wrench"/></svg>
          </div>
          <div>
            <h3 class="font-semibold text-wood-700 text-sm">Bar Clamp Set</h3>
            <p class="text-xs text-steel-400">Hold it tight</p>
          </div>
        </div>
        <p class="text-xs text-steel-500 leading-relaxed">You can never have too many clamps. Quick-release bar clamps in 6", 12", and 24" cover most glue-up scenarios.</p>
      </div>
    </div>
  </div>
</section>

<!-- Newsletter -->
<section class="relative overflow-hidden py-16 bg-wood-600">
  <!-- BG tool icons -->
  <svg class="absolute w-48 h-48 text-white opacity-[0.04]" style="top:-20px;left:5%;transform:rotate(-15deg)"><use href="#icon-hammer"/></svg>
  <svg class="absolute w-36 h-36 text-white opacity-[0.04]" style="bottom:-10px;right:8%;transform:rotate(20deg)"><use href="#icon-saw"/></svg>

  <div class="max-w-2xl mx-auto px-6 text-center relative z-10 scroll-reveal">
    <svg class="w-10 h-10 text-safety-400 mx-auto mb-4"><use href="#icon-wrench"/></svg>
    <h2 class="font-titan text-3xl text-white mb-3">Weekly DIY Inspiration</h2>
    <p class="text-wood-200 mb-8 text-sm leading-relaxed">New project plans, tool reviews, and workshop tips delivered every Saturday morning. Join 12,000+ makers.</p>
    <div class="flex items-center gap-3 max-w-md mx-auto">
      <div class="flex-1 relative">
        <input type="email" placeholder="your@email.com" class="w-full px-5 py-3 rounded-lg bg-wood-700 border border-wood-500 text-white placeholder-wood-300 text-sm focus:outline-none focus:border-safety-400 transition"/>
      </div>
      <button class="bg-safety-500 hover:bg-safety-600 text-white px-6 py-3 rounded-lg text-sm font-semibold transition whitespace-nowrap shadow-lg shadow-safety-500/30">Subscribe</button>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-wood-800 text-wood-300 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-start justify-between mb-8">
      <div>
        <div class="flex items-center gap-3 mb-3">
          <svg class="w-6 h-6 text-safety-400"><use href="#icon-wrench"/></svg>
          <span class="font-titan text-xl text-white">MakerSpace</span>
        </div>
        <p class="text-sm text-wood-400 max-w-xs">Empowering makers everywhere with step-by-step project guides and trusted tool recommendations.</p>
      </div>
      <div class="flex gap-12">
        <div>
          <h4 class="text-xs font-semibold text-wood-200 uppercase tracking-wider mb-3">Popular Categories</h4>
          <ul class="space-y-2 text-sm">
            <li><a class="hover:text-safety-400 transition cursor-pointer">Woodworking</a></li>
            <li><a class="hover:text-safety-400 transition cursor-pointer">Home Repair</a></li>
            <li><a class="hover:text-safety-400 transition cursor-pointer">Furniture</a></li>
            <li><a class="hover:text-safety-400 transition cursor-pointer">Outdoor</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-xs font-semibold text-wood-200 uppercase tracking-wider mb-3">Resources</h4>
          <ul class="space-y-2 text-sm">
            <li><a class="hover:text-safety-400 transition cursor-pointer">Tool Guides</a></li>
            <li><a class="hover:text-safety-400 transition cursor-pointer">Safety Tips</a></li>
            <li><a class="hover:text-safety-400 transition cursor-pointer">Wood Species</a></li>
            <li><a class="hover:text-safety-400 transition cursor-pointer">Finishing 101</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-xs font-semibold text-wood-200 uppercase tracking-wider mb-3">Community</h4>
          <ul class="space-y-2 text-sm">
            <li><a class="hover:text-safety-400 transition cursor-pointer">Forum</a></li>
            <li><a class="hover:text-safety-400 transition cursor-pointer">Gallery</a></li>
            <li><a class="hover:text-safety-400 transition cursor-pointer">Submit Project</a></li>
            <li><a class="hover:text-safety-400 transition cursor-pointer">About Us</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="pt-6 border-t border-wood-700 flex items-center justify-between text-xs text-wood-500">
      <span>&copy; 2026 MakerSpace. All Rights Reserved.</span>
      <span class="flex items-center gap-1">Built with <svg class="w-3 h-3 text-safety-500"><use href="#icon-hammer"/></svg> by makers, for makers.</span>
    </div>
  </div>
</footer>

<script>
// Difficulty filter
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('#projectGrid .project-card').forEach(card => {
      if (filter === 'all' || card.dataset.level === filter) {
        card.style.display = '';
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
        requestAnimationFrame(() => {
          card.style.transition = 'all 0.4s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        });
      } else {
        card.style.display = 'none';
      }
    });
  });
});

// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
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
