INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'aa8f39d8-122f-4677-841f-d791fa119d86',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ATELIER — Architecture Studio</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        concrete: '#a8a29e',
        charcoal: '#292524',
        steel: '#475569',
        offwhite: '#fafaf9',
        gridline: '#e7e5e4'
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['Roboto', 'sans-serif']
      }
    }
  }
}
</script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Roboto', sans-serif; font-weight: 300; color: #292524; background: #fafaf9; }
html { scroll-behavior: smooth; }
.font-display { font-family: 'Bebas Neue', sans-serif; }
.grid-bg {
  background-image: linear-gradient(#e7e5e4 1px, transparent 1px), linear-gradient(90deg, #e7e5e4 1px, transparent 1px);
  background-size: 80px 80px;
}
.reveal { opacity: 0; transform: translateY(30px); transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
.reveal.visible { opacity: 1; transform: translateY(0); }
.line-grow { width: 0; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
.line-grow.visible { width: 100%; }
.project-info { opacity: 0; transition: opacity 0.4s ease; }
.project-cell:hover .project-info { opacity: 1; }
.project-cell:hover .project-img { opacity: 0.3; }
.project-img { transition: opacity 0.4s ease; }
</style>
</head>
<body class="grid-bg overflow-x-hidden">

<!-- Architectural SVG Line Drawings - Background Layer -->
<svg class="fixed inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <!-- Building elevation - top right -->
  <g stroke="#a8a29e" stroke-width="0.5" fill="none" opacity="0.08" transform="translate(700, 60)">
    <rect x="0" y="80" width="200" height="280"/>
    <rect x="20" y="100" width="40" height="60"/>
    <rect x="80" y="100" width="40" height="60"/>
    <rect x="140" y="100" width="40" height="60"/>
    <rect x="20" y="180" width="40" height="60"/>
    <rect x="80" y="180" width="40" height="60"/>
    <rect x="140" y="180" width="40" height="60"/>
    <rect x="70" y="280" width="60" height="80"/>
    <line x1="0" y1="80" x2="100" y2="20"/>
    <line x1="100" y1="20" x2="200" y2="80"/>
    <rect x="200" y="160" width="120" height="200"/>
    <rect x="220" y="180" width="30" height="40"/>
    <rect x="270" y="180" width="30" height="40"/>
    <rect x="220" y="240" width="30" height="40"/>
    <rect x="270" y="240" width="30" height="40"/>
    <rect x="240" y="300" width="40" height="60"/>
  </g>
  <!-- Floor plan outline - bottom left -->
  <g stroke="#a8a29e" stroke-width="0.5" fill="none" opacity="0.06" transform="translate(50, 600)">
    <rect x="0" y="0" width="300" height="200"/>
    <line x1="120" y1="0" x2="120" y2="200"/>
    <line x1="0" y1="100" x2="120" y2="100"/>
    <line x1="120" y1="80" x2="300" y2="80"/>
    <rect x="130" y="90" width="60" height="40"/>
    <rect x="10" y="10" width="40" height="30"/>
    <rect x="10" y="110" width="50" height="35"/>
    <line x1="200" y1="80" x2="200" y2="200"/>
    <rect x="210" y="90" width="30" height="30"/>
    <circle cx="60" cy="60" r="15"/>
    <rect x="240" y="140" width="50" height="50"/>
    <!-- Door arcs -->
    <path d="M 120 95 Q 135 95 135 80" />
    <path d="M 200 85 Q 215 85 215 100" />
  </g>
  <!-- Structural detail - mid right -->
  <g stroke="#a8a29e" stroke-width="0.5" fill="none" opacity="0.05" transform="translate(900, 500)">
    <line x1="0" y1="0" x2="0" y2="300"/>
    <line x1="40" y1="0" x2="40" y2="300"/>
    <line x1="0" y1="0" x2="40" y2="0"/>
    <line x1="0" y1="60" x2="40" y2="60"/>
    <line x1="0" y1="120" x2="40" y2="120"/>
    <line x1="0" y1="180" x2="40" y2="180"/>
    <line x1="0" y1="240" x2="40" y2="240"/>
    <line x1="0" y1="300" x2="40" y2="300"/>
    <line x1="-30" y1="60" x2="70" y2="60"/>
    <line x1="-30" y1="180" x2="70" y2="180"/>
    <line x1="-30" y1="300" x2="70" y2="300"/>
    <!-- Cross bracing -->
    <line x1="0" y1="0" x2="40" y2="60"/>
    <line x1="40" y1="0" x2="0" y2="60"/>
    <line x1="0" y1="120" x2="40" y2="180"/>
    <line x1="40" y1="120" x2="0" y2="180"/>
  </g>
  <!-- Section cut - bottom right -->
  <g stroke="#a8a29e" stroke-width="0.5" fill="none" opacity="0.06" transform="translate(750, 900)">
    <polyline points="0,200 0,50 50,0 150,0 200,50 200,200"/>
    <line x1="0" y1="200" x2="200" y2="200"/>
    <line x1="0" y1="120" x2="200" y2="120"/>
    <rect x="20" y="130" width="30" height="50"/>
    <rect x="80" y="130" width="40" height="70"/>
    <rect x="150" y="130" width="30" height="50"/>
    <line x1="30" y1="0" x2="30" y2="120"/>
    <line x1="170" y1="0" x2="170" y2="120"/>
    <!-- Ground line -->
    <line x1="-30" y1="200" x2="230" y2="200"/>
    <line x1="-30" y1="205" x2="230" y2="205"/>
  </g>
</svg>

<!-- Nav -->
<nav class="fixed top-0 w-full bg-offwhite/90 backdrop-blur-sm z-50 border-b border-gridline">
  <div class="max-w-6xl mx-auto px-10 py-5 flex items-center justify-between">
    <div class="font-display text-2xl tracking-[0.3em]">ATELIER</div>
    <div class="hidden md:flex items-center gap-12 text-xs font-body font-light tracking-[0.2em] uppercase text-concrete">
      <a href="#projects" class="hover:text-charcoal transition-colors cursor-pointer">Projects</a>
      <a href="#about" class="hover:text-charcoal transition-colors cursor-pointer">About</a>
      <a href="#awards" class="hover:text-charcoal transition-colors cursor-pointer">Awards</a>
      <a href="#contact" class="hover:text-charcoal transition-colors cursor-pointer">Contact</a>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="min-h-screen flex items-end pb-24 pt-32 relative z-10">
  <div class="max-w-6xl mx-auto px-10 w-full">
    <div class="reveal">
      <div class="text-xs tracking-[0.4em] uppercase text-concrete mb-8 font-light">Architecture & Design Studio</div>
      <h1 class="font-display text-7xl md:text-8xl lg:text-9xl leading-[0.9] tracking-[0.05em] mb-10">
        WE DESIGN<br>
        SPACES THAT<br>
        <span class="text-steel">INSPIRE</span>
      </h1>
      <div class="h-px bg-charcoal/20 line-grow mb-8"></div>
      <div class="flex items-end justify-between">
        <p class="text-concrete text-sm font-light leading-relaxed max-w-md">
          Disciplined design rooted in modernist principles. Every line deliberate, every space purposeful.
        </p>
        <div class="hidden md:block text-right">
          <div class="text-xs tracking-[0.3em] uppercase text-concrete">Est. 2009</div>
          <div class="text-xs tracking-[0.3em] uppercase text-concrete mt-1">New York / Tokyo</div>
        </div>
      </div>
    </div>
  </div>
  <!-- Hero architectural line SVG overlay -->
  <svg class="absolute right-10 top-1/2 -translate-y-1/2 w-80 h-96 hidden lg:block" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#a8a29e" stroke-width="0.6" opacity="0.12">
    <rect x="40" y="80" width="180" height="250"/>
    <rect x="60" y="100" width="35" height="50"/>
    <rect x="110" y="100" width="35" height="50"/>
    <rect x="160" y="100" width="35" height="50"/>
    <rect x="60" y="170" width="35" height="50"/>
    <rect x="110" y="170" width="35" height="50"/>
    <rect x="160" y="170" width="35" height="50"/>
    <rect x="100" y="260" width="50" height="70"/>
    <line x1="40" y1="80" x2="130" y2="30"/>
    <line x1="130" y1="30" x2="220" y2="80"/>
    <line x1="130" y1="30" x2="130" y2="0"/>
    <!-- Chimney -->
    <rect x="170" y="40" width="15" height="40"/>
    <!-- Ground -->
    <line x1="20" y1="330" x2="240" y2="330"/>
    <!-- Steps -->
    <line x1="90" y1="330" x2="90" y2="325"/>
    <line x1="90" y1="325" x2="160" y2="325"/>
    <line x1="160" y1="325" x2="160" y2="330"/>
  </svg>
</section>

<!-- Projects Grid -->
<section id="projects" class="py-24 relative z-10">
  <div class="max-w-6xl mx-auto px-10">
    <div class="flex items-end justify-between mb-16 reveal">
      <div>
        <div class="text-xs tracking-[0.4em] uppercase text-concrete mb-3 font-light">Selected Work</div>
        <h2 class="font-display text-5xl md:text-6xl tracking-[0.05em]">PROJECTS</h2>
      </div>
      <div class="text-xs tracking-[0.2em] uppercase text-concrete font-light">2020 — 2025</div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-charcoal/10">
      <!-- Project 1 -->
      <div class="project-cell relative bg-offwhite cursor-pointer group" style="aspect-ratio:1/0.85">
        <div class="project-img absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
          <svg width="200" height="140" fill="none" stroke="#78716c" stroke-width="0.8" opacity="0.5">
            <rect x="10" y="30" width="180" height="100"/>
            <rect x="30" y="50" width="30" height="35"/>
            <rect x="85" y="50" width="30" height="35"/>
            <rect x="140" y="50" width="30" height="35"/>
            <rect x="75" y="95" width="40" height="35"/>
            <line x1="10" y1="30" x2="100" y2="5"/>
            <line x1="100" y1="5" x2="190" y2="30"/>
          </svg>
        </div>
        <div class="project-info absolute inset-0 flex flex-col justify-end p-8 bg-offwhite/95">
          <p class="text-concrete text-xs tracking-[0.2em] uppercase font-light mb-2">Residential / Tokyo</p>
          <h3 class="font-display text-3xl tracking-[0.05em] mb-2">HORIZON HOUSE</h3>
          <p class="text-concrete text-sm font-light leading-relaxed">A cantilevered residence merging interior volume with panoramic landscape. 320 sqm of disciplined geometry.</p>
        </div>
        <div class="absolute top-6 right-6 text-xs tracking-[0.2em] text-concrete font-light">2024</div>
      </div>
      <!-- Project 2 -->
      <div class="project-cell relative bg-offwhite cursor-pointer group" style="aspect-ratio:1/0.85">
        <div class="project-img absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
          <svg width="200" height="140" fill="none" stroke="#78716c" stroke-width="0.8" opacity="0.5">
            <rect x="20" y="20" width="70" height="110"/>
            <rect x="90" y="40" width="90" height="90"/>
            <rect x="30" y="35" width="20" height="30"/>
            <rect x="55" y="35" width="20" height="30"/>
            <rect x="30" y="80" width="20" height="30"/>
            <rect x="110" y="55" width="25" height="35"/>
            <rect x="145" y="55" width="25" height="35"/>
            <rect x="125" y="100" width="30" height="30"/>
          </svg>
        </div>
        <div class="project-info absolute inset-0 flex flex-col justify-end p-8 bg-offwhite/95">
          <p class="text-concrete text-xs tracking-[0.2em] uppercase font-light mb-2">Cultural / New York</p>
          <h3 class="font-display text-3xl tracking-[0.05em] mb-2">FORUM GALLERY</h3>
          <p class="text-concrete text-sm font-light leading-relaxed">A contemporary art space defined by raw concrete walls and controlled natural light. 1,200 sqm exhibition hall.</p>
        </div>
        <div class="absolute top-6 right-6 text-xs tracking-[0.2em] text-concrete font-light">2023</div>
      </div>
      <!-- Project 3 -->
      <div class="project-cell relative bg-offwhite cursor-pointer group" style="aspect-ratio:1/0.85">
        <div class="project-img absolute inset-0 bg-gradient-to-br from-stone-300 to-zinc-200 flex items-center justify-center">
          <svg width="200" height="140" fill="none" stroke="#78716c" stroke-width="0.8" opacity="0.5">
            <rect x="10" y="50" width="180" height="80"/>
            <rect x="30" y="60" width="15" height="25"/>
            <rect x="55" y="60" width="15" height="25"/>
            <rect x="80" y="60" width="15" height="25"/>
            <rect x="105" y="60" width="15" height="25"/>
            <rect x="130" y="60" width="15" height="25"/>
            <rect x="155" y="60" width="15" height="25"/>
            <rect x="80" y="100" width="40" height="30"/>
            <!-- Flat roof overhang -->
            <line x1="0" y1="50" x2="200" y2="50"/>
            <line x1="5" y1="47" x2="195" y2="47"/>
          </svg>
        </div>
        <div class="project-info absolute inset-0 flex flex-col justify-end p-8 bg-offwhite/95">
          <p class="text-concrete text-xs tracking-[0.2em] uppercase font-light mb-2">Civic / Osaka</p>
          <h3 class="font-display text-3xl tracking-[0.05em] mb-2">CIVIC PAVILION</h3>
          <p class="text-concrete text-sm font-light leading-relaxed">Public gathering space with exposed steel framework. A transparent dialogue between structure and community.</p>
        </div>
        <div class="absolute top-6 right-6 text-xs tracking-[0.2em] text-concrete font-light">2023</div>
      </div>
      <!-- Project 4 -->
      <div class="project-cell relative bg-offwhite cursor-pointer group" style="aspect-ratio:1/0.85">
        <div class="project-img absolute inset-0 bg-gradient-to-br from-zinc-200 to-stone-200 flex items-center justify-center">
          <svg width="200" height="140" fill="none" stroke="#78716c" stroke-width="0.8" opacity="0.5">
            <!-- Tower -->
            <rect x="60" y="10" width="80" height="120"/>
            <rect x="70" y="20" width="20" height="25"/>
            <rect x="110" y="20" width="20" height="25"/>
            <rect x="70" y="55" width="20" height="25"/>
            <rect x="110" y="55" width="20" height="25"/>
            <rect x="70" y="90" width="20" height="25"/>
            <rect x="110" y="90" width="20" height="25"/>
            <rect x="85" y="105" width="30" height="25"/>
            <!-- Base -->
            <rect x="30" y="100" width="140" height="30"/>
          </svg>
        </div>
        <div class="project-info absolute inset-0 flex flex-col justify-end p-8 bg-offwhite/95">
          <p class="text-concrete text-xs tracking-[0.2em] uppercase font-light mb-2">Commercial / Seoul</p>
          <h3 class="font-display text-3xl tracking-[0.05em] mb-2">MONOLITH TOWER</h3>
          <p class="text-concrete text-sm font-light leading-relaxed">A 22-story office tower in board-formed concrete. Precision grid facade with operable steel louvers.</p>
        </div>
        <div class="absolute top-6 right-6 text-xs tracking-[0.2em] text-concrete font-light">2022</div>
      </div>
    </div>
  </div>
</section>

<!-- Awards -->
<section id="awards" class="py-24 relative z-10 border-t border-charcoal/10">
  <div class="max-w-6xl mx-auto px-10">
    <div class="mb-16 reveal">
      <div class="text-xs tracking-[0.4em] uppercase text-concrete mb-3 font-light">Recognition</div>
      <h2 class="font-display text-5xl md:text-6xl tracking-[0.05em]">AWARDS</h2>
    </div>
    <div class="reveal">
      <div class="flex items-center justify-between py-5 border-b border-charcoal/10">
        <span class="text-sm font-light tracking-[0.1em]">AIA Honor Award 2024</span>
        <span class="text-xs tracking-[0.2em] text-concrete font-light">Horizon House</span>
      </div>
      <div class="flex items-center justify-between py-5 border-b border-charcoal/10">
        <span class="text-sm font-light tracking-[0.1em]">Pritzker Nomination 2023</span>
        <span class="text-xs tracking-[0.2em] text-concrete font-light">Body of Work</span>
      </div>
      <div class="flex items-center justify-between py-5 border-b border-charcoal/10">
        <span class="text-sm font-light tracking-[0.1em]">RIBA Gold Medal 2023</span>
        <span class="text-xs tracking-[0.2em] text-concrete font-light">Forum Gallery</span>
      </div>
      <div class="flex items-center justify-between py-5 border-b border-charcoal/10">
        <span class="text-sm font-light tracking-[0.1em]">Mies Crown Hall Americas Prize 2022</span>
        <span class="text-xs tracking-[0.2em] text-concrete font-light">Civic Pavilion</span>
      </div>
      <div class="flex items-center justify-between py-5 border-b border-charcoal/10">
        <span class="text-sm font-light tracking-[0.1em]">Architizer A+ Award 2022</span>
        <span class="text-xs tracking-[0.2em] text-concrete font-light">Monolith Tower</span>
      </div>
      <div class="flex items-center justify-between py-5">
        <span class="text-sm font-light tracking-[0.1em]">World Architecture Festival 2021</span>
        <span class="text-xs tracking-[0.2em] text-concrete font-light">Threshold Residence</span>
      </div>
    </div>
  </div>
</section>

<!-- About -->
<section id="about" class="py-24 relative z-10 border-t border-charcoal/10">
  <div class="max-w-6xl mx-auto px-10">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
      <div class="reveal">
        <h2 class="font-display text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-[0.03em]">
          ARCHITECTURE<br>IS THE LEARNED<br>GAME, CORRECT<br>AND MAGNIFICENT,<br>OF FORMS<br>ASSEMBLED<br><span class="text-steel">IN THE LIGHT.</span>
        </h2>
        <div class="h-px bg-charcoal/15 mt-8"></div>
        <p class="text-xs tracking-[0.2em] uppercase text-concrete mt-4 font-light">Le Corbusier</p>
      </div>
      <div class="reveal">
        <div class="text-xs tracking-[0.4em] uppercase text-concrete mb-6 font-light">About</div>
        <p class="text-sm font-light leading-[1.8] text-charcoal/80 mb-6">
          ATELIER is a practice founded on the conviction that architecture must serve both purpose and beauty. Established in 2009, we operate from New York and Tokyo, designing buildings that engage their context with disciplined clarity.
        </p>
        <p class="text-sm font-light leading-[1.8] text-charcoal/80 mb-6">
          Our work is rooted in modernist principles: honest materials, structural expression, and the primacy of light and space. We reject decoration in favor of proportion. Every project begins with the site, the program, and the aspiration to create spaces where people thrive.
        </p>
        <p class="text-sm font-light leading-[1.8] text-charcoal/80">
          The studio is led by principal architects Kenji Tanaka and Sarah Chen, with a team of 24 architects, engineers, and designers committed to the craft of building.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- Process -->
<section class="py-24 relative z-10 border-t border-charcoal/10">
  <div class="max-w-6xl mx-auto px-10">
    <div class="mb-16 reveal">
      <div class="text-xs tracking-[0.4em] uppercase text-concrete mb-3 font-light">Methodology</div>
      <h2 class="font-display text-5xl md:text-6xl tracking-[0.05em]">PROCESS</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-px bg-charcoal/10">
      <div class="bg-offwhite p-10 reveal">
        <div class="font-display text-7xl md:text-8xl text-charcoal/10 leading-none mb-6">01</div>
        <h3 class="font-display text-2xl tracking-[0.1em] mb-4">CONCEPT</h3>
        <p class="text-sm font-light leading-[1.8] text-concrete">Site analysis, program definition, and conceptual exploration. We study light, wind, view, and material to establish the project's foundational idea.</p>
      </div>
      <div class="bg-offwhite p-10 reveal">
        <div class="font-display text-7xl md:text-8xl text-charcoal/10 leading-none mb-6">02</div>
        <h3 class="font-display text-2xl tracking-[0.1em] mb-4">DESIGN</h3>
        <p class="text-sm font-light leading-[1.8] text-concrete">Iterative refinement of form, structure, and detail. Physical models, digital simulations, and full-scale mock-ups ensure precision at every scale.</p>
      </div>
      <div class="bg-offwhite p-10 reveal">
        <div class="font-display text-7xl md:text-8xl text-charcoal/10 leading-none mb-6">03</div>
        <h3 class="font-display text-2xl tracking-[0.1em] mb-4">BUILD</h3>
        <p class="text-sm font-light leading-[1.8] text-concrete">Rigorous construction oversight with on-site presence. We work with contractors who share our commitment to craft and material integrity.</p>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-24 relative z-10 border-t border-charcoal/10">
  <div class="max-w-6xl mx-auto px-10">
    <div class="mb-16 reveal">
      <div class="text-xs tracking-[0.4em] uppercase text-concrete mb-3 font-light">Inquiries</div>
      <h2 class="font-display text-5xl md:text-6xl tracking-[0.05em]">CONTACT</h2>
    </div>
    <div class="reveal">
      <div class="text-sm font-light leading-[2.2] text-charcoal/70">
        <p>421 West 13th Street, New York, NY 10014</p>
        <p>studio@atelier-arch.com</p>
        <p>+1 (212) 555 0190</p>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="py-8 relative z-10 border-t border-charcoal/10">
  <div class="max-w-6xl mx-auto px-10">
    <div class="text-xs tracking-[0.2em] uppercase text-concrete font-light">&copy; 2025 ATELIER. All rights reserved.</div>
  </div>
</footer>

<script>
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal, .line-grow').forEach(el => obs.observe(el));

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
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
