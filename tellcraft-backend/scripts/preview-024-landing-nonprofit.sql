-- Template Preview: landing-nonprofit (Nonprofit Landing Page) v3
-- Swap Test: Hand-drawn SVG underlines + full-width impact strip + earth-tone palette = unmistakably humanitarian
-- Signature: Hand-drawn wavy/sketchy SVG underlines under key text, like pen strokes

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '2bd4de9e-b1e3-4179-99c4-48990a016488',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Helping Hands — Together We Make a Difference</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bitter:wght@400;500;600;700;800&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Bitter', 'Georgia', 'serif'],
        body: ['Open Sans', 'system-ui', 'sans-serif']
      },
      colors: {
        earth: { DEFAULT: '#166534', light: '#1a7d40', dark: '#14532d' },
        terra: { DEFAULT: '#c2410c', light: '#dc5a1a', dark: '#9a3412' },
        sand: { DEFAULT: '#d4a574', light: '#e0be96', pale: '#f0e0cc' },
        cream: { DEFAULT: '#fefce8', warm: '#fdf8db' },
        bark: '#3e2c1c',
        clay: '#8b6f47'
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Open Sans', system-ui, sans-serif; background: #fefce8; color: #3e2c1c; }
  h1, h2, h3, h4, h5, h6 { font-family: 'Bitter', Georgia, serif; }

  /* Hand-drawn underline animation */
  .hand-underline svg { opacity: 0; transition: opacity 0.4s ease; }
  .hand-underline.drawn svg { opacity: 1; }
  .hand-underline svg path {
    stroke-dasharray: 300;
    stroke-dashoffset: 300;
  }
  .hand-underline.drawn svg path {
    animation: draw-line 1.2s ease-out forwards;
  }
  @keyframes draw-line {
    to { stroke-dashoffset: 0; }
  }

  /* Fade up on scroll */
  .fade-up { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .fade-up.visible { opacity: 1; transform: translateY(0); }

  /* Counter numbers */
  .counter-num { font-variant-numeric: tabular-nums; }

  /* Program card hand-drawn border */
  .program-card {
    position: relative;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .program-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(22,101,52,0.1); }
  .program-card::before {
    content: '';
    position: absolute;
    inset: -3px;
    border: 2px dashed #d4a574;
    border-radius: 18px;
    opacity: 0.5;
    pointer-events: none;
  }

  /* Donation amount button */
  .amt-btn { transition: all 0.2s ease; cursor: pointer; }
  .amt-btn:hover { border-color: #c2410c; background: #fdf8db; }
  .amt-btn.active { background: #c2410c; color: white; border-color: #c2410c; }

  /* Toggle button */
  .freq-btn { transition: all 0.2s ease; cursor: pointer; }
  .freq-btn.active { background: #166534; color: white; border-color: #166534; }

  /* Progress bar fill */
  .progress-fill { transition: width 2s cubic-bezier(0.4, 0, 0.2, 1); }

  /* Story quote */
  .story-quote { position: relative; }
  .story-quote::before {
    content: '\201C';
    font-family: 'Bitter', Georgia, serif;
    font-size: 6rem;
    line-height: 1;
    color: #d4a574;
    opacity: 0.3;
    position: absolute;
    top: -24px;
    left: -8px;
  }

  /* Organic blob background */
  .organic-bg {
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #fefce8; }
  ::-webkit-scrollbar-thumb { background: #d4a574; border-radius: 3px; }
</style>
</head>
<body>

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-cream/95 backdrop-blur-md border-b border-sand/40">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2.5">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="15" fill="#166534"/>
        <path d="M10 20c0-4 3-8 6-10 3 2 6 6 6 10" stroke="#fefce8" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M16 10v12" stroke="#fefce8" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M13 15c1.5 0 3 1 3 3" stroke="#fefce8" stroke-width="1.2" stroke-linecap="round" fill="none"/>
        <path d="M19 14c-1.5 0.5-3 1.5-3 3.5" stroke="#fefce8" stroke-width="1.2" stroke-linecap="round" fill="none"/>
      </svg>
      <span class="font-display text-lg font-bold text-earth">Helping Hands</span>
    </a>
    <div class="hidden md:flex items-center gap-7">
      <a href="#mission" class="text-sm text-clay hover:text-earth transition-colors font-medium">Our Mission</a>
      <a href="#programs" class="text-sm text-clay hover:text-earth transition-colors font-medium">Programs</a>
      <a href="#impact" class="text-sm text-clay hover:text-earth transition-colors font-medium">Impact</a>
      <a href="#donate" class="text-sm text-clay hover:text-earth transition-colors font-medium">Donate</a>
      <button onclick="scrollTo('#donate')" class="px-5 py-2.5 bg-terra text-white text-sm font-semibold rounded-full hover:bg-terra-dark transition-colors cursor-pointer">
        Donate Now
      </button>
    </div>
    <button onclick="toggleMenu()" class="md:hidden text-clay cursor-pointer">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
  <!-- Mobile menu -->
  <div id="mobileMenu" class="hidden md:hidden bg-cream border-t border-sand/40">
    <div class="px-6 py-4 space-y-3">
      <a href="#mission" onclick="toggleMenu()" class="block text-sm text-clay font-medium">Our Mission</a>
      <a href="#programs" onclick="toggleMenu()" class="block text-sm text-clay font-medium">Programs</a>
      <a href="#impact" onclick="toggleMenu()" class="block text-sm text-clay font-medium">Impact</a>
      <a href="#donate" onclick="toggleMenu()" class="block text-sm text-clay font-medium">Donate</a>
      <button onclick="scrollTo('#donate');toggleMenu()" class="w-full py-2.5 bg-terra text-white text-sm font-semibold rounded-full cursor-pointer">Donate Now</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="pt-16 relative overflow-hidden organic-bg">
  <div class="max-w-6xl mx-auto px-6 py-24 md:py-32">
    <div class="max-w-3xl fade-up">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-earth/10 rounded-full mb-6">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="#166534"><path d="M8 1.5c-1 2-4 4-4 6.5a4 4 0 108 0c0-2.5-3-4.5-4-6.5z"/></svg>
        <span class="text-sm text-earth font-medium">Serving communities since 2009</span>
      </div>
      <h1 class="font-display text-4xl md:text-6xl font-extrabold text-bark leading-tight mb-2">
        Together, We Can
      </h1>
      <h1 class="font-display text-4xl md:text-6xl font-extrabold text-bark leading-tight mb-2">
        <span class="relative inline-block hand-underline" id="heroUnderline">Change
          <svg class="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none">
            <path d="M2 8 C30 2, 50 10, 80 5 C110 0, 140 9, 170 4 C185 2, 195 6, 198 5" stroke="#c2410c" stroke-width="3" stroke-linecap="round" fill="none"/>
          </svg>
        </span>
        <span class="text-terra">10,000</span> Lives
      </h1>
      <h1 class="font-display text-4xl md:text-6xl font-extrabold text-bark leading-tight mb-8">
        This Year
      </h1>
      <p class="text-base md:text-lg text-clay leading-relaxed max-w-xl mb-10 font-body">
        Helping Hands empowers underprivileged communities through nutrition, education, housing, and outreach. Every dollar you give plants a seed of lasting change.
      </p>
      <div class="flex flex-wrap items-center gap-4">
        <button onclick="scrollTo('#donate')" class="px-8 py-3.5 bg-terra text-white text-base font-bold rounded-full hover:bg-terra-dark transition-colors shadow-lg shadow-terra/20 cursor-pointer">
          Donate Now
        </button>
        <a href="#mission" class="group px-8 py-3.5 border-2 border-earth text-earth text-base font-bold rounded-full hover:bg-earth hover:text-white transition-all cursor-pointer inline-flex items-center gap-2">
          Learn More
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" class="group-hover:translate-x-1 transition-transform"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
        </a>
      </div>
    </div>
  </div>
  <!-- Organic wave divider -->
  <svg viewBox="0 0 1440 80" class="w-full block" preserveAspectRatio="none" style="margin-bottom:-1px">
    <path d="M0 40 C120 70, 240 10, 360 40 C480 70, 600 10, 720 35 C840 60, 960 15, 1080 40 C1200 65, 1320 20, 1440 45 L1440 80 L0 80Z" fill="#c2410c"/>
  </svg>
</section>

<!-- Impact Numbers Strip (SIGNATURE) -->
<section id="impact" class="bg-terra relative overflow-hidden">
  <!-- Subtle hand-drawn texture overlay -->
  <div class="absolute inset-0 opacity-5" style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;40&quot; height=&quot;40&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cpath d=&quot;M0 20 Q10 15 20 20 Q30 25 40 20&quot; stroke=&quot;white&quot; fill=&quot;none&quot; stroke-width=&quot;0.5&quot;/%3E%3C/svg%3E'); background-size: 40px 40px;"></div>
  <div class="max-w-6xl mx-auto px-6 py-16 md:py-20">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center text-white relative z-10">
      <div class="fade-up">
        <div class="text-4xl md:text-5xl font-display font-extrabold counter-num" data-target="45000">0</div>
        <div class="mt-2 relative inline-block">
          <span class="text-sm md:text-base font-medium text-white/80">Meals Served</span>
          <svg class="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 100 6" fill="none" preserveAspectRatio="none">
            <path d="M2 4 C25 1, 50 5, 75 2 C88 1, 95 3, 98 3" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          </svg>
        </div>
      </div>
      <div class="fade-up">
        <div class="text-4xl md:text-5xl font-display font-extrabold counter-num" data-target="12000">0</div>
        <div class="mt-2 relative inline-block">
          <span class="text-sm md:text-base font-medium text-white/80">Children Educated</span>
          <svg class="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 100 6" fill="none" preserveAspectRatio="none">
            <path d="M2 3 C20 5, 45 1, 70 4 C85 5, 95 2, 98 3" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          </svg>
        </div>
      </div>
      <div class="fade-up">
        <div class="text-4xl md:text-5xl font-display font-extrabold counter-num" data-target="8500">0</div>
        <div class="mt-2 relative inline-block">
          <span class="text-sm md:text-base font-medium text-white/80">Families Housed</span>
          <svg class="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 100 6" fill="none" preserveAspectRatio="none">
            <path d="M2 4 C30 1, 55 5, 80 2 C90 1, 96 4, 98 3" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          </svg>
        </div>
      </div>
      <div class="fade-up">
        <div class="text-4xl md:text-5xl font-display font-extrabold counter-num" data-target="200">0</div>
        <div class="mt-2 relative inline-block">
          <span class="text-sm md:text-base font-medium text-white/80">Communities Reached</span>
          <svg class="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 100 6" fill="none" preserveAspectRatio="none">
            <path d="M2 3 C15 5, 40 1, 65 4 C80 5, 92 2, 98 3" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
  <!-- Bottom wave -->
  <svg viewBox="0 0 1440 60" class="w-full block" preserveAspectRatio="none" style="margin-bottom:-1px">
    <path d="M0 30 C180 55, 360 5, 540 30 C720 55, 900 5, 1080 25 C1260 45, 1380 15, 1440 30 L1440 60 L0 60Z" fill="#fefce8"/>
  </svg>
</section>

<!-- Mission -->
<section id="mission" class="py-20 px-6">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-14 fade-up">
      <span class="text-sm text-terra font-semibold uppercase tracking-widest font-body">Our Mission</span>
      <h2 class="font-display text-3xl md:text-4xl font-extrabold text-bark mt-3">
        Nourishing Lives, Building
        <span class="relative inline-block hand-underline">Futures
          <svg class="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 160 10" fill="none" preserveAspectRatio="none">
            <path d="M2 7 C40 2, 60 8, 100 4 C130 1, 150 6, 158 5" stroke="#d4a574" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          </svg>
        </span>
      </h2>
      <p class="text-base text-clay mt-4 max-w-2xl mx-auto font-body leading-relaxed">We believe everyone deserves access to basic needs. Our programs address food insecurity, educational gaps, housing instability, and community isolation.</p>
    </div>
  </div>
</section>

<!-- Programs -->
<section id="programs" class="pb-20 px-6">
  <div class="max-w-6xl mx-auto">
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Program 1 -->
      <div class="program-card bg-white rounded-2xl p-7 fade-up">
        <div class="w-14 h-14 bg-earth/10 rounded-xl flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="1.8" stroke-linecap="round"><path d="M12 2C8 6 4 10 4 14a8 8 0 0016 0c0-4-4-8-8-12z"/><path d="M12 22V12"/><path d="M8 16c2-1 4 1 4-4"/><path d="M16 15c-2-0.5-3 1-4-3"/></svg>
        </div>
        <h3 class="font-display text-xl font-bold text-bark mb-2">Community Nutrition</h3>
        <p class="text-sm text-clay leading-relaxed mb-4 font-body">Our food banks and community kitchens serve hot meals daily, ensuring no family goes to bed hungry. We partner with local farms for fresh produce distribution.</p>
        <a href="#" onclick="handleAction('Learn about Community Nutrition');return false" class="inline-flex items-center gap-1.5 text-sm text-terra font-semibold hover:gap-3 transition-all cursor-pointer">
          Learn More
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
        </a>
      </div>
      <!-- Program 2 -->
      <div class="program-card bg-white rounded-2xl p-7 fade-up">
        <div class="w-14 h-14 bg-terra/10 rounded-xl flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c2410c" stroke-width="1.8" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><path d="M8 7h8M8 11h5"/></svg>
        </div>
        <h3 class="font-display text-xl font-bold text-bark mb-2">Youth Education</h3>
        <p class="text-sm text-clay leading-relaxed mb-4 font-body">After-school tutoring, scholarship programs, and mentorship initiatives give young people the tools they need to break the cycle of poverty through learning.</p>
        <a href="#" onclick="handleAction('Learn about Youth Education');return false" class="inline-flex items-center gap-1.5 text-sm text-terra font-semibold hover:gap-3 transition-all cursor-pointer">
          Learn More
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
        </a>
      </div>
      <!-- Program 3 -->
      <div class="program-card bg-white rounded-2xl p-7 fade-up">
        <div class="w-14 h-14 bg-sand/40 rounded-xl flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b6f47" stroke-width="1.8" stroke-linecap="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/></svg>
        </div>
        <h3 class="font-display text-xl font-bold text-bark mb-2">Family Housing</h3>
        <p class="text-sm text-clay leading-relaxed mb-4 font-body">From emergency shelters to long-term transitional housing, we help families find stability. Our housing counselors provide ongoing support for sustainable independence.</p>
        <a href="#" onclick="handleAction('Learn about Family Housing');return false" class="inline-flex items-center gap-1.5 text-sm text-terra font-semibold hover:gap-3 transition-all cursor-pointer">
          Learn More
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Beneficiary Story -->
<section id="story" class="py-20 px-6 organic-bg relative">
  <div class="absolute inset-0 bg-gradient-to-b from-sand-pale/60 to-cream/80"></div>
  <div class="max-w-4xl mx-auto relative z-10 fade-up">
    <div class="text-center mb-8">
      <span class="text-sm text-terra font-semibold uppercase tracking-widest font-body">A Story of Hope</span>
    </div>
    <div class="bg-white rounded-3xl p-10 md:p-14 shadow-sm border border-sand/30">
      <div class="story-quote pl-4 md:pl-8">
        <p class="font-display text-xl md:text-2xl text-bark leading-relaxed italic">
          When I lost my job, I didn't know how we would feed our kids. Helping Hands didn't just give us meals &mdash; they gave us hope. Now my children are in school, we have a roof over our heads, and I've completed a job training program. They saw us as
          <span class="relative inline-block hand-underline not-italic font-bold text-terra">people
            <svg class="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 100 8" fill="none" preserveAspectRatio="none">
              <path d="M2 5 C20 2, 40 7, 60 3 C75 1, 90 5, 98 4" stroke="#c2410c" stroke-width="2" stroke-linecap="round" fill="none"/>
            </svg>
          </span>, not just a statistic.
        </p>
      </div>
      <div class="mt-8 flex items-center gap-4 pl-4 md:pl-8">
        <div class="w-14 h-14 rounded-full bg-gradient-to-br from-sand to-terra/20 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c2410c" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-4 3-7 7-7s7 3 7 7"/></svg>
        </div>
        <div>
          <div class="font-display font-bold text-bark text-lg">Maria Santos</div>
          <div class="text-sm text-clay font-body">Single mother of three, Oakland, CA</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Donation CTA -->
<section id="donate" class="py-20 px-6">
  <div class="max-w-2xl mx-auto fade-up">
    <div class="text-center mb-10">
      <span class="text-sm text-terra font-semibold uppercase tracking-widest font-body">Make a Difference</span>
      <h2 class="font-display text-3xl md:text-4xl font-extrabold text-bark mt-3">
        Your Generosity
        <span class="relative inline-block hand-underline">Matters
          <svg class="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 140 10" fill="none" preserveAspectRatio="none">
            <path d="M2 7 C35 2, 55 8, 90 4 C115 1, 130 6, 138 5" stroke="#c2410c" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          </svg>
        </span>
      </h2>
    </div>

    <div class="bg-white rounded-3xl p-8 md:p-10 border border-sand/40 shadow-sm">
      <!-- Progress bar -->
      <div class="mb-8 p-5 bg-cream rounded-2xl border border-sand/30">
        <div class="flex items-center justify-between mb-3">
          <span class="font-display font-bold text-bark text-base">Annual Campaign 2026</span>
          <span class="text-sm text-terra font-bold font-body">72% funded</span>
        </div>
        <div class="w-full h-3.5 bg-sand/40 rounded-full overflow-hidden">
          <div class="progress-fill h-full bg-gradient-to-r from-terra to-terra-light rounded-full" id="progressBar" style="width: 0%"></div>
        </div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs text-clay font-body">$360,000 raised</span>
          <span class="text-xs text-clay font-body">Goal: $500,000</span>
        </div>
      </div>

      <!-- Frequency toggle -->
      <div class="flex items-center gap-2 mb-6 p-1 bg-cream rounded-xl">
        <button onclick="selectFreq(this, 'once')" class="freq-btn active flex-1 py-2.5 rounded-lg text-sm font-semibold font-body border border-transparent text-center">One-time</button>
        <button onclick="selectFreq(this, 'monthly')" class="freq-btn flex-1 py-2.5 rounded-lg text-sm font-semibold font-body border border-transparent text-center text-clay">Monthly</button>
      </div>

      <!-- Preset amounts -->
      <div class="grid grid-cols-5 gap-2 mb-4">
        <button onclick="selectAmount(this, 25)" class="amt-btn py-3 border-2 border-sand/60 rounded-xl text-sm font-bold text-bark font-display">$25</button>
        <button onclick="selectAmount(this, 50)" class="amt-btn py-3 border-2 border-sand/60 rounded-xl text-sm font-bold text-bark font-display">$50</button>
        <button onclick="selectAmount(this, 100)" class="amt-btn active py-3 border-2 rounded-xl text-sm font-bold font-display">$100</button>
        <button onclick="selectAmount(this, 250)" class="amt-btn py-3 border-2 border-sand/60 rounded-xl text-sm font-bold text-bark font-display">$250</button>
        <button onclick="selectAmount(this, 0)" class="amt-btn py-3 border-2 border-sand/60 rounded-xl text-xs font-bold text-bark font-body" id="customBtn">Custom</button>
      </div>
      <input type="number" id="customInput" placeholder="Enter custom amount" class="hidden w-full px-4 py-3 bg-cream border-2 border-sand/40 rounded-xl text-sm font-body focus:outline-none focus:border-terra transition-all mb-4">

      <!-- What your donation does -->
      <div class="bg-cream/70 rounded-xl p-4 mb-6 border border-sand/20" id="impactInfo">
        <div class="text-xs text-clay mb-2 font-bold font-body">Your $100 provides:</div>
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-sm text-bark font-body">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#166534"><path d="M6.5 12L2 7.5l1.5-1.5L6.5 9 12.5 3 14 4.5z"/></svg>
            40 nutritious meals for families in need
          </div>
          <div class="flex items-center gap-2 text-sm text-bark font-body">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#166534"><path d="M6.5 12L2 7.5l1.5-1.5L6.5 9 12.5 3 14 4.5z"/></svg>
            School supplies for 3 children for a month
          </div>
          <div class="flex items-center gap-2 text-sm text-bark font-body">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#166534"><path d="M6.5 12L2 7.5l1.5-1.5L6.5 9 12.5 3 14 4.5z"/></svg>
            2 nights of emergency shelter
          </div>
        </div>
      </div>

      <button onclick="handleAction('Donate $100')" id="donateBtn" class="w-full py-4 bg-terra text-white text-base font-bold rounded-xl hover:bg-terra-dark transition-colors font-display shadow-lg shadow-terra/20 cursor-pointer">
        Donate $100
      </button>
      <div class="flex items-center justify-center gap-6 mt-4">
        <span class="text-xs text-clay font-body flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#8b6f47" stroke-width="1.5"><rect x="2" y="6" width="12" height="8" rx="2"/><path d="M5 6V4a3 3 0 016 0v2"/></svg>
          Secure & encrypted
        </span>
        <span class="text-xs text-clay font-body flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#8b6f47" stroke-width="1.5"><path d="M13.5 5.5L6 13 2.5 9.5"/></svg>
          Tax-deductible
        </span>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-earth-dark text-white pt-16 pb-8 px-6">
  <div class="max-w-6xl mx-auto">
    <!-- Newsletter -->
    <div class="text-center mb-14 pb-14 border-b border-white/10">
      <h3 class="font-display text-2xl font-bold mb-3">Stay Connected</h3>
      <p class="text-sm text-white/60 font-body mb-6 max-w-md mx-auto">Join our newsletter for stories of impact, volunteer opportunities, and ways you can help.</p>
      <div class="flex max-w-md mx-auto gap-2">
        <input type="email" placeholder="Your email address" class="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 font-body focus:outline-none focus:border-white/40">
        <button onclick="handleAction('Newsletter signup')" class="px-6 py-3 bg-terra text-white text-sm font-semibold rounded-xl hover:bg-terra-light transition-colors font-body cursor-pointer">Subscribe</button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" fill="rgba(255,255,255,0.1)"/>
            <path d="M10 20c0-4 3-8 6-10 3 2 6 6 6 10" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
            <path d="M16 10v12" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span class="font-display text-base font-bold">Helping Hands</span>
        </div>
        <p class="text-xs text-white/50 font-body leading-relaxed">Together, building a world where every person has what they need to thrive.</p>
      </div>
      <div>
        <h4 class="font-display text-sm font-bold mb-4">Organization</h4>
        <div class="space-y-2">
          <a onclick="handleAction('About Us')" class="block text-xs text-white/50 hover:text-white/80 cursor-pointer transition-colors font-body">About Us</a>
          <a onclick="handleAction('Our Team')" class="block text-xs text-white/50 hover:text-white/80 cursor-pointer transition-colors font-body">Our Team</a>
          <a onclick="handleAction('Annual Report')" class="block text-xs text-white/50 hover:text-white/80 cursor-pointer transition-colors font-body">Annual Report</a>
          <a onclick="handleAction('Financial Transparency')" class="block text-xs text-white/50 hover:text-white/80 cursor-pointer transition-colors font-body">Financials</a>
        </div>
      </div>
      <div>
        <h4 class="font-display text-sm font-bold mb-4">Get Involved</h4>
        <div class="space-y-2">
          <a onclick="scrollTo('#donate')" class="block text-xs text-white/50 hover:text-white/80 cursor-pointer transition-colors font-body">Donate</a>
          <a onclick="handleAction('Volunteer')" class="block text-xs text-white/50 hover:text-white/80 cursor-pointer transition-colors font-body">Volunteer</a>
          <a onclick="handleAction('Corporate Partners')" class="block text-xs text-white/50 hover:text-white/80 cursor-pointer transition-colors font-body">Corporate Partners</a>
          <a onclick="handleAction('Fundraise')" class="block text-xs text-white/50 hover:text-white/80 cursor-pointer transition-colors font-body">Fundraise for Us</a>
        </div>
      </div>
      <div>
        <h4 class="font-display text-sm font-bold mb-4">Contact</h4>
        <div class="space-y-2 text-xs text-white/50 font-body">
          <div>(415) 555-0192</div>
          <div>hello@helpinghands.org</div>
          <div>1847 Mission Street<br>San Francisco, CA 94103</div>
          <div class="flex items-center gap-4 pt-3">
            <a onclick="handleAction('Facebook')" class="cursor-pointer hover:text-white/80 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a onclick="handleAction('Instagram')" class="cursor-pointer hover:text-white/80 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a onclick="handleAction('Twitter')" class="cursor-pointer hover:text-white/80 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-xs text-white/40 font-body">&copy; 2009&ndash;2026 Helping Hands Foundation. All rights reserved.</p>
      <p class="text-xs text-white/40 font-body">EIN: 94-3218765 &middot; 501(c)(3) tax-exempt nonprofit</p>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-earth text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-50 max-w-sm text-center font-body"></div>

<script>
/* ---- Amount & Frequency ---- */
let selectedAmount = 100;
let selectedFreq = 'once';

const impactData = {
  25:  ['10 nutritious meals for a family', 'School supplies for 1 child', '1 night of emergency shelter'],
  50:  ['20 nutritious meals for families', 'School supplies for 2 children', 'After-school tutoring for 1 week'],
  100: ['40 nutritious meals for families in need', 'School supplies for 3 children for a month', '2 nights of emergency shelter'],
  250: ['100 meals across 3 community kitchens', 'Full semester of tutoring for 1 student', '1 week of transitional housing support']
};

function selectAmount(el, amt) {
  document.querySelectorAll('.amt-btn').forEach(b => {
    b.classList.remove('active');
    b.classList.add('border-sand/60', 'text-bark');
  });
  el.classList.add('active');
  el.classList.remove('border-sand/60', 'text-bark');

  const customInput = document.getElementById('customInput');
  if (amt === 0) {
    customInput.classList.remove('hidden');
    customInput.focus();
    selectedAmount = 0;
    document.getElementById('donateBtn').textContent = 'Donate';
    return;
  }
  customInput.classList.add('hidden');
  selectedAmount = amt;
  document.getElementById('donateBtn').textContent = 'Donate $' + amt;
  updateImpact(amt);
}

function updateImpact(amt) {
  const info = document.getElementById('impactInfo');
  const items = impactData[amt];
  if (!items) return;
  info.innerHTML = '<div class="text-xs text-clay mb-2 font-bold font-body">Your $' + amt + ' provides:</div><div class="space-y-1.5">' +
    items.map(i => '<div class="flex items-center gap-2 text-sm text-bark font-body"><svg width="14" height="14" viewBox="0 0 16 16" fill="#166534"><path d="M6.5 12L2 7.5l1.5-1.5L6.5 9 12.5 3 14 4.5z"/></svg>' + i + '</div>').join('') +
    '</div>';
}

document.getElementById('customInput').addEventListener('input', function() {
  const v = parseInt(this.value);
  if (v > 0) {
    selectedAmount = v;
    document.getElementById('donateBtn').textContent = 'Donate $' + v.toLocaleString();
  }
});

function selectFreq(el, freq) {
  selectedFreq = freq;
  document.querySelectorAll('.freq-btn').forEach(b => {
    b.classList.remove('active');
    b.classList.add('text-clay');
  });
  el.classList.add('active');
  el.classList.remove('text-clay');
}

/* ---- Navigation ---- */
function scrollTo(sel) { document.querySelector(sel).scrollIntoView({ behavior: 'smooth' }); }
function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('hidden'); }

/* ---- Toast ---- */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1'; t.style.transform = 'translate(-50%, 0)';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translate(-50%, 8px)'; }, 2500);
}
function handleAction(a) { showToast(a + ' — this is a template preview'); }

/* ---- Counter Animation ---- */
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    el.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* ---- Hand-drawn Underline Animation ---- */
function drawUnderlines() {
  document.querySelectorAll('.hand-underline').forEach(el => {
    el.classList.add('drawn');
  });
}

/* ---- Progress Bar Animation ---- */
function animateProgress() {
  document.getElementById('progressBar').style.width = '72%';
}

/* ---- IntersectionObserver for all animations ---- */
const fadeObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => fadeObs.observe(el));

const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && !e.target.dataset.animated) {
      e.target.dataset.animated = 'true';
      animateCounter(e.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.counter-num').forEach(el => counterObs.observe(el));

const progressObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && !e.target.dataset.animated) {
      e.target.dataset.animated = 'true';
      animateProgress();
    }
  });
}, { threshold: 0.3 });
progressObs.observe(document.getElementById('progressBar'));

/* ---- Hero underline draw on load ---- */
window.addEventListener('load', () => {
  setTimeout(drawUnderlines, 500);
});

/* ---- Activate hand-drawn underlines on scroll for non-hero ones ---- */
const underlineObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('drawn');
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.hand-underline:not(#heroUnderline)').forEach(el => underlineObs.observe(el));
</script>

</body>
</html>$HTML$,
  3
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
