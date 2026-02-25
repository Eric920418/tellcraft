INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '9db13e1a-a855-4421-9154-138b6fba26fd',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TechConf 2024 — San Francisco</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        indigo: { deep: '#312e81', mid: '#3730a3', light: '#4f46e5', pale: '#eef2ff' },
        teal: { electric: '#14b8a6', light: '#5eead4', dark: '#0d9488', pale: '#f0fdfa' },
        surface: { dark: '#1e1b4b', card: '#f8fafc', muted: '#f1f5f9', border: '#e2e8f0' },
        txt: { primary: '#1e293b', secondary: '#475569', muted: '#94a3b8', light: '#cbd5e1', white: '#ffffff' }
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['Open Sans', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Open Sans', sans-serif; background: #ffffff; color: #1e293b; }
  h1, h2, h3, h4, h5, h6 { font-family: 'Montserrat', sans-serif; }

  /* Dark hero gradient */
  .hero-bg {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%);
    position: relative;
    overflow: hidden;
  }
  .hero-bg::before {
    content: '';
    position: absolute;
    top: -40%; right: -20%;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%);
    border-radius: 50%;
  }
  .hero-bg::after {
    content: '';
    position: absolute;
    bottom: -30%; left: -10%;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%);
    border-radius: 50%;
  }

  /* Countdown */
  .countdown-unit {
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
  }

  /* Speaker flip card */
  .speaker-flip {
    perspective: 800px;
    cursor: pointer;
  }
  .speaker-flip-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
    transform-style: preserve-3d;
  }
  .speaker-flip:hover .speaker-flip-inner {
    transform: rotateY(180deg);
  }
  .speaker-front, .speaker-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-radius: 16px;
    overflow: hidden;
  }
  .speaker-back {
    transform: rotateY(180deg);
    background: linear-gradient(135deg, #312e81, #1e1b4b);
  }

  /* Timeline */
  .timeline-line {
    position: absolute;
    left: 23px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, #14b8a6, #312e81);
  }
  .timeline-dot {
    position: absolute;
    left: 16px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 3px solid #14b8a6;
    background: #ffffff;
    z-index: 2;
  }
  .timeline-dot.break-dot {
    border-color: #94a3b8;
    background: #f1f5f9;
  }

  /* Day tabs */
  .day-tab {
    transition: all 0.3s ease;
    font-family: 'Montserrat', sans-serif;
  }
  .day-tab.active {
    background: linear-gradient(135deg, #312e81, #14b8a6);
    color: white;
    box-shadow: 0 4px 15px rgba(49,46,129,0.3);
  }

  /* Sponsor */
  .sponsor-item {
    filter: grayscale(1) opacity(0.5);
    transition: all 0.3s ease;
  }
  .sponsor-item:hover {
    filter: grayscale(0) opacity(1);
  }

  /* Scroll animation */
  .fade-up {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .fade-up.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Teal accent underline */
  .teal-underline {
    position: relative;
    display: inline-block;
  }
  .teal-underline::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 0;
    width: 60px;
    height: 3px;
    background: #14b8a6;
    border-radius: 2px;
  }

  /* CTA button */
  .cta-btn {
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(20,184,166,0.3);
  }
  .cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(20,184,166,0.4);
  }

  .cta-btn-outline {
    border: 2px solid rgba(255,255,255,0.3);
    transition: all 0.3s ease;
  }
  .cta-btn-outline:hover {
    border-color: #14b8a6;
    background: rgba(20,184,166,0.1);
  }

  /* Section divider */
  .section-alt { background: #f8fafc; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
</style>
</head>
<body>

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-surface-border shadow-sm">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg bg-indigo-deep flex items-center justify-center">
        <span class="text-white font-display font-bold text-sm">TC</span>
      </div>
      <span class="font-display font-bold text-indigo-deep text-lg tracking-tight">TechConf</span>
    </div>
    <div class="hidden md:flex items-center gap-8">
      <a href="#speakers" class="text-sm text-txt-secondary hover:text-indigo-deep transition-colors font-medium">Speakers</a>
      <a href="#schedule" class="text-sm text-txt-secondary hover:text-indigo-deep transition-colors font-medium">Schedule</a>
      <a href="#venue" class="text-sm text-txt-secondary hover:text-indigo-deep transition-colors font-medium">Venue</a>
      <a href="#tickets" class="text-sm text-txt-secondary hover:text-indigo-deep transition-colors font-medium">Tickets</a>
      <button onclick="handleAction('Get Tickets')" class="cta-btn text-white text-sm font-display font-semibold px-5 py-2 rounded-full">Get Tickets</button>
    </div>
    <button onclick="toggleMobileMenu()" class="md:hidden text-txt-secondary">
      <svg id="menuIcon" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>
    </button>
  </div>
  <div id="mobileMenu" class="hidden md:hidden bg-white border-t border-surface-border">
    <div class="px-6 py-4 space-y-3">
      <a href="#speakers" onclick="closeMobile()" class="block text-sm text-txt-secondary font-medium">Speakers</a>
      <a href="#schedule" onclick="closeMobile()" class="block text-sm text-txt-secondary font-medium">Schedule</a>
      <a href="#venue" onclick="closeMobile()" class="block text-sm text-txt-secondary font-medium">Venue</a>
      <a href="#tickets" onclick="closeMobile()" class="block text-sm text-txt-secondary font-medium">Tickets</a>
      <button onclick="handleAction('Get Tickets');closeMobile()" class="cta-btn w-full text-white text-sm font-display font-semibold py-2.5 rounded-full mt-2">Get Tickets</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="hero-bg min-h-screen flex items-center relative pt-16">
  <div class="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full">
    <div class="max-w-3xl">
      <!-- Date badge -->
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur mb-8 fade-up">
        <span class="w-2 h-2 rounded-full bg-teal-electric animate-pulse"></span>
        <span class="text-xs text-teal-light font-display font-medium tracking-wide">MARCH 15-17, 2024 &middot; SAN FRANCISCO, CA</span>
      </div>

      <h1 class="text-5xl md:text-7xl lg:text-8xl font-display font-black text-white leading-none mb-6 fade-up">
        Tech<span class="text-teal-electric">Conf</span><br>
        <span class="text-3xl md:text-4xl lg:text-5xl font-bold text-white/60">2024</span>
      </h1>

      <p class="text-base md:text-lg text-white/60 max-w-xl mb-10 leading-relaxed fade-up font-body">
        Three days of cutting-edge talks, hands-on workshops, and unparalleled networking with 2,000+ developers, designers, and tech leaders.
      </p>

      <!-- CTAs -->
      <div class="flex flex-wrap items-center gap-4 mb-14 fade-up">
        <button onclick="handleAction('Get Tickets')" class="cta-btn px-8 py-3.5 rounded-full text-white font-display font-bold text-sm tracking-wide">
          Get Tickets &rarr;
        </button>
        <a href="#schedule" class="cta-btn-outline px-6 py-3 rounded-full text-white/80 font-display font-semibold text-sm">
          View Schedule
        </a>
      </div>

      <!-- Countdown -->
      <div class="flex items-center gap-3 fade-up">
        <div class="countdown-unit px-5 py-3 text-center min-w-[76px]">
          <div id="cd-days" class="text-2xl md:text-3xl font-display font-bold text-white">42</div>
          <div class="text-[10px] text-white/40 font-display uppercase tracking-widest mt-0.5">Days</div>
        </div>
        <span class="text-white/30 text-2xl font-light">:</span>
        <div class="countdown-unit px-5 py-3 text-center min-w-[76px]">
          <div id="cd-hours" class="text-2xl md:text-3xl font-display font-bold text-white">08</div>
          <div class="text-[10px] text-white/40 font-display uppercase tracking-widest mt-0.5">Hours</div>
        </div>
        <span class="text-white/30 text-2xl font-light">:</span>
        <div class="countdown-unit px-5 py-3 text-center min-w-[76px]">
          <div id="cd-mins" class="text-2xl md:text-3xl font-display font-bold text-white">24</div>
          <div class="text-[10px] text-white/40 font-display uppercase tracking-widest mt-0.5">Mins</div>
        </div>
        <span class="text-white/30 text-2xl font-light">:</span>
        <div class="countdown-unit px-5 py-3 text-center min-w-[76px]">
          <div id="cd-secs" class="text-2xl md:text-3xl font-display font-bold text-white">51</div>
          <div class="text-[10px] text-white/40 font-display uppercase tracking-widest mt-0.5">Secs</div>
        </div>
      </div>
    </div>

    <!-- Stats strip -->
    <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 fade-up">
      <div class="text-center">
        <div class="text-3xl font-display font-bold text-teal-electric">50+</div>
        <div class="text-xs text-white/50 mt-1 font-display uppercase tracking-wider">Speakers</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-display font-bold text-teal-electric">3</div>
        <div class="text-xs text-white/50 mt-1 font-display uppercase tracking-wider">Days</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-display font-bold text-teal-electric">6</div>
        <div class="text-xs text-white/50 mt-1 font-display uppercase tracking-wider">Tracks</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-display font-bold text-teal-electric">2,000+</div>
        <div class="text-xs text-white/50 mt-1 font-display uppercase tracking-wider">Attendees</div>
      </div>
    </div>
  </div>
</section>

<!-- Speakers -->
<section id="speakers" class="py-24 px-6">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-16 fade-up">
      <span class="text-xs text-teal-electric font-display font-semibold uppercase tracking-widest">Featured Speakers</span>
      <h2 class="text-3xl md:text-4xl font-display font-bold text-indigo-deep mt-3 mb-4">Meet Our Experts</h2>
      <p class="text-sm text-txt-secondary max-w-lg mx-auto">World-class engineers, architects, and thought leaders sharing their insights on the future of technology.</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
      <!-- Speaker 1 -->
      <div class="speaker-flip h-72 fade-up" onclick="handleAction('View Dr. Sarah Chen')">
        <div class="speaker-flip-inner">
          <div class="speaker-front bg-white border border-surface-border rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-deep to-indigo-light flex items-center justify-center mb-4 shadow-lg">
              <span class="text-3xl font-display font-bold text-white">SC</span>
            </div>
            <h3 class="font-display font-bold text-txt-primary text-sm">Dr. Sarah Chen</h3>
            <p class="text-xs text-teal-electric font-semibold mt-1">VP of Engineering</p>
            <p class="text-xs text-txt-muted mt-0.5">Google Cloud</p>
          </div>
          <div class="speaker-back p-6 flex flex-col items-center justify-center text-center">
            <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <span class="text-lg font-display font-bold text-teal-light">SC</span>
            </div>
            <h3 class="font-display font-bold text-white text-sm mb-2">Dr. Sarah Chen</h3>
            <p class="text-xs text-teal-light font-semibold mb-3">"Scaling AI Infrastructure"</p>
            <p class="text-[11px] text-white/60 leading-relaxed">15+ years building distributed systems. Led GCP's ML platform serving 10M+ requests/day. PhD in Computer Science, Stanford.</p>
          </div>
        </div>
      </div>

      <!-- Speaker 2 -->
      <div class="speaker-flip h-72 fade-up" onclick="handleAction('View Marcus Rivera')">
        <div class="speaker-flip-inner">
          <div class="speaker-front bg-white border border-surface-border rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-teal-dark to-teal-electric flex items-center justify-center mb-4 shadow-lg">
              <span class="text-3xl font-display font-bold text-white">MR</span>
            </div>
            <h3 class="font-display font-bold text-txt-primary text-sm">Marcus Rivera</h3>
            <p class="text-xs text-teal-electric font-semibold mt-1">CTO</p>
            <p class="text-xs text-txt-muted mt-0.5">Stripe</p>
          </div>
          <div class="speaker-back p-6 flex flex-col items-center justify-center text-center">
            <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <span class="text-lg font-display font-bold text-teal-light">MR</span>
            </div>
            <h3 class="font-display font-bold text-white text-sm mb-2">Marcus Rivera</h3>
            <p class="text-xs text-teal-light font-semibold mb-3">"Zero-Downtime Migrations"</p>
            <p class="text-[11px] text-white/60 leading-relaxed">Architect behind Stripe's payment infrastructure. Expert in distributed databases and real-time systems processing $1T+ annually.</p>
          </div>
        </div>
      </div>

      <!-- Speaker 3 -->
      <div class="speaker-flip h-72 fade-up" onclick="handleAction('View Aisha Patel')">
        <div class="speaker-flip-inner">
          <div class="speaker-front bg-white border border-surface-border rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-purple-700 to-indigo-light flex items-center justify-center mb-4 shadow-lg">
              <span class="text-3xl font-display font-bold text-white">AP</span>
            </div>
            <h3 class="font-display font-bold text-txt-primary text-sm">Aisha Patel</h3>
            <p class="text-xs text-teal-electric font-semibold mt-1">Staff Engineer</p>
            <p class="text-xs text-txt-muted mt-0.5">Meta</p>
          </div>
          <div class="speaker-back p-6 flex flex-col items-center justify-center text-center">
            <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <span class="text-lg font-display font-bold text-teal-light">AP</span>
            </div>
            <h3 class="font-display font-bold text-white text-sm mb-2">Aisha Patel</h3>
            <p class="text-xs text-teal-light font-semibold mb-3">"React at Scale: 2024 & Beyond"</p>
            <p class="text-[11px] text-white/60 leading-relaxed">Core contributor to React. Building UI frameworks used by billions. Passionate about developer experience and performance optimization.</p>
          </div>
        </div>
      </div>

      <!-- Speaker 4 -->
      <div class="speaker-flip h-72 fade-up" onclick="handleAction('View James Okonkwo')">
        <div class="speaker-flip-inner">
          <div class="speaker-front bg-white border border-surface-border rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-teal-electric to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
              <span class="text-3xl font-display font-bold text-white">JO</span>
            </div>
            <h3 class="font-display font-bold text-txt-primary text-sm">James Okonkwo</h3>
            <p class="text-xs text-teal-electric font-semibold mt-1">Principal Architect</p>
            <p class="text-xs text-txt-muted mt-0.5">Netflix</p>
          </div>
          <div class="speaker-back p-6 flex flex-col items-center justify-center text-center">
            <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <span class="text-lg font-display font-bold text-teal-light">JO</span>
            </div>
            <h3 class="font-display font-bold text-white text-sm mb-2">James Okonkwo</h3>
            <p class="text-xs text-teal-light font-semibold mb-3">"Microservices Observability"</p>
            <p class="text-[11px] text-white/60 leading-relaxed">Designed Netflix's distributed tracing system. Speaker at KubeCon, QCon. Authored "Production-Ready Microservices" (O'Reilly).</p>
          </div>
        </div>
      </div>

      <!-- Speaker 5 -->
      <div class="speaker-flip h-72 fade-up" onclick="handleAction('View Elena Voss')">
        <div class="speaker-flip-inner">
          <div class="speaker-front bg-white border border-surface-border rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-mid to-violet-600 flex items-center justify-center mb-4 shadow-lg">
              <span class="text-3xl font-display font-bold text-white">EV</span>
            </div>
            <h3 class="font-display font-bold text-txt-primary text-sm">Elena Voss</h3>
            <p class="text-xs text-teal-electric font-semibold mt-1">Head of Security</p>
            <p class="text-xs text-txt-muted mt-0.5">Cloudflare</p>
          </div>
          <div class="speaker-back p-6 flex flex-col items-center justify-center text-center">
            <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <span class="text-lg font-display font-bold text-teal-light">EV</span>
            </div>
            <h3 class="font-display font-bold text-white text-sm mb-2">Elena Voss</h3>
            <p class="text-xs text-teal-light font-semibold mb-3">"Zero Trust in Practice"</p>
            <p class="text-[11px] text-white/60 leading-relaxed">Former NSA researcher. Built Cloudflare's zero-trust framework protecting 20%+ of the internet. DEF CON speaker.</p>
          </div>
        </div>
      </div>

      <!-- Speaker 6 -->
      <div class="speaker-flip h-72 fade-up" onclick="handleAction('View David Kim')">
        <div class="speaker-flip-inner">
          <div class="speaker-front bg-white border border-surface-border rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-amber-600 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
              <span class="text-3xl font-display font-bold text-white">DK</span>
            </div>
            <h3 class="font-display font-bold text-txt-primary text-sm">David Kim</h3>
            <p class="text-xs text-teal-electric font-semibold mt-1">Founder & CEO</p>
            <p class="text-xs text-txt-muted mt-0.5">DevToolsCo</p>
          </div>
          <div class="speaker-back p-6 flex flex-col items-center justify-center text-center">
            <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <span class="text-lg font-display font-bold text-teal-light">DK</span>
            </div>
            <h3 class="font-display font-bold text-white text-sm mb-2">David Kim</h3>
            <p class="text-xs text-teal-light font-semibold mb-3">"The Future of Developer Tooling"</p>
            <p class="text-[11px] text-white/60 leading-relaxed">Serial entrepreneur. YC alum. Building the next generation of AI-powered development tools. Forbes 30 Under 30.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="text-center mt-10 fade-up">
      <button onclick="handleAction('View All Speakers')" class="text-sm text-indigo-deep font-display font-semibold border-2 border-indigo-deep/20 hover:border-indigo-deep/50 px-6 py-2.5 rounded-full transition-all hover:bg-indigo-pale">
        View All 50+ Speakers &rarr;
      </button>
    </div>
  </div>
</section>

<!-- Schedule -->
<section id="schedule" class="py-24 px-6 section-alt">
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-14 fade-up">
      <span class="text-xs text-teal-electric font-display font-semibold uppercase tracking-widest">Conference Schedule</span>
      <h2 class="text-3xl md:text-4xl font-display font-bold text-indigo-deep mt-3 mb-4">Three Days of Innovation</h2>
      <p class="text-sm text-txt-secondary">Keynotes, deep-dives, workshops, and networking across 6 tracks.</p>
    </div>

    <!-- Day Tabs -->
    <div class="flex items-center justify-center gap-2 mb-12 fade-up">
      <button onclick="switchDay(1)" class="day-tab active px-6 py-2.5 rounded-full text-sm font-semibold" data-day="1">
        Day 1 &middot; Mar 15
      </button>
      <button onclick="switchDay(2)" class="day-tab px-6 py-2.5 rounded-full text-sm font-semibold text-txt-secondary border-2 border-surface-border bg-white" data-day="2">
        Day 2 &middot; Mar 16
      </button>
      <button onclick="switchDay(3)" class="day-tab px-6 py-2.5 rounded-full text-sm font-semibold text-txt-secondary border-2 border-surface-border bg-white" data-day="3">
        Day 3 &middot; Mar 17
      </button>
    </div>

    <!-- Day 1 Timeline -->
    <div id="day1" class="relative pl-14">
      <div class="timeline-line"></div>

      <!-- 8:00 Registration -->
      <div class="relative mb-8 fade-up">
        <div class="timeline-dot break-dot" style="top:6px;"></div>
        <div class="bg-white border border-surface-border rounded-xl p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <span class="text-xs font-display font-bold text-txt-muted uppercase tracking-wider">8:00 AM</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-txt-muted font-medium">Lobby</span>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">Registration & Breakfast</h3>
          <p class="text-xs text-txt-muted mt-1">Badge pickup, coffee, pastries, and early networking</p>
        </div>
      </div>

      <!-- 9:00 Keynote -->
      <div class="relative mb-8 fade-up">
        <div class="timeline-dot" style="top:6px;"></div>
        <div class="bg-white border-2 border-indigo-deep/20 rounded-xl p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <span class="text-xs font-display font-bold text-indigo-deep uppercase tracking-wider">9:00 AM</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-pale text-indigo-deep font-semibold">Keynote</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-txt-muted font-medium">Main Hall</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">Opening Keynote: The State of Tech in 2024</h3>
          <p class="text-xs text-txt-secondary mt-1">Dr. Sarah Chen &middot; VP of Engineering, Google Cloud</p>
          <p class="text-xs text-txt-muted mt-1">60 min</p>
        </div>
      </div>

      <!-- 10:15 Talk -->
      <div class="relative mb-8 fade-up">
        <div class="timeline-dot" style="top:6px;"></div>
        <div class="bg-white border border-surface-border rounded-xl p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <span class="text-xs font-display font-bold text-teal-electric uppercase tracking-wider">10:15 AM</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-teal-pale text-teal-dark font-semibold">Talk</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-txt-muted font-medium">Room A</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">Zero-Downtime Database Migrations at Scale</h3>
          <p class="text-xs text-txt-secondary mt-1">Marcus Rivera &middot; CTO, Stripe</p>
          <p class="text-xs text-txt-muted mt-1">45 min &middot; Track: Infrastructure</p>
        </div>
      </div>

      <!-- 10:15 Parallel -->
      <div class="relative mb-8 fade-up">
        <div class="timeline-dot" style="top:6px; border-color: #4f46e5;"></div>
        <div class="bg-white border border-surface-border rounded-xl p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <span class="text-xs font-display font-bold text-indigo-light uppercase tracking-wider">10:15 AM</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-pale text-indigo-light font-semibold">Talk</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-txt-muted font-medium">Room B</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">React at Scale: Server Components & Beyond</h3>
          <p class="text-xs text-txt-secondary mt-1">Aisha Patel &middot; Staff Engineer, Meta</p>
          <p class="text-xs text-txt-muted mt-1">45 min &middot; Track: Frontend</p>
        </div>
      </div>

      <!-- 11:15 Break -->
      <div class="relative mb-8 fade-up">
        <div class="timeline-dot break-dot" style="top:6px;"></div>
        <div class="bg-surface-muted border border-surface-border rounded-xl p-4">
          <div class="flex items-center gap-2">
            <span class="text-xs font-display font-bold text-txt-muted uppercase tracking-wider">11:15 AM</span>
            <span class="text-xs text-txt-muted">&middot; 30 min</span>
          </div>
          <h3 class="font-display font-semibold text-txt-muted text-sm mt-1">Coffee Break & Expo Hall</h3>
        </div>
      </div>

      <!-- 11:45 Talk -->
      <div class="relative mb-8 fade-up">
        <div class="timeline-dot" style="top:6px;"></div>
        <div class="bg-white border border-surface-border rounded-xl p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <span class="text-xs font-display font-bold text-teal-electric uppercase tracking-wider">11:45 AM</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-teal-pale text-teal-dark font-semibold">Talk</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-txt-muted font-medium">Room C</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">Microservices Observability: From Chaos to Clarity</h3>
          <p class="text-xs text-txt-secondary mt-1">James Okonkwo &middot; Principal Architect, Netflix</p>
          <p class="text-xs text-txt-muted mt-1">45 min &middot; Track: DevOps</p>
        </div>
      </div>

      <!-- 12:30 Lunch -->
      <div class="relative mb-8 fade-up">
        <div class="timeline-dot break-dot" style="top:6px;"></div>
        <div class="bg-surface-muted border border-surface-border rounded-xl p-4">
          <div class="flex items-center gap-2">
            <span class="text-xs font-display font-bold text-txt-muted uppercase tracking-wider">12:30 PM</span>
            <span class="text-xs text-txt-muted">&middot; 90 min</span>
          </div>
          <h3 class="font-display font-semibold text-txt-muted text-sm mt-1">Lunch, Networking & Lightning Talks</h3>
          <p class="text-xs text-txt-muted mt-0.5">Courtyard &middot; Sponsored by Stripe</p>
        </div>
      </div>

      <!-- 14:00 Talk -->
      <div class="relative mb-8 fade-up">
        <div class="timeline-dot" style="top:6px;"></div>
        <div class="bg-white border border-surface-border rounded-xl p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <span class="text-xs font-display font-bold text-teal-electric uppercase tracking-wider">2:00 PM</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold">Security</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-txt-muted font-medium">Room A</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">Zero Trust in Practice: Lessons from the Frontline</h3>
          <p class="text-xs text-txt-secondary mt-1">Elena Voss &middot; Head of Security, Cloudflare</p>
          <p class="text-xs text-txt-muted mt-1">45 min &middot; Track: Security</p>
        </div>
      </div>

      <!-- 15:00 Panel -->
      <div class="relative mb-8 fade-up">
        <div class="timeline-dot" style="top:6px; border-color:#312e81;"></div>
        <div class="bg-white border-2 border-indigo-deep/15 rounded-xl p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <span class="text-xs font-display font-bold text-indigo-deep uppercase tracking-wider">3:00 PM</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold">Panel</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-txt-muted font-medium">Main Hall</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">Panel: AI's Impact on Software Engineering</h3>
          <p class="text-xs text-txt-secondary mt-1">Chen, Rivera, Patel, Kim &middot; Moderated by TechConf</p>
          <p class="text-xs text-txt-muted mt-1">60 min</p>
        </div>
      </div>

      <!-- 17:00 Happy Hour -->
      <div class="relative fade-up">
        <div class="timeline-dot" style="top:6px; border-color:#14b8a6; background:#f0fdfa;"></div>
        <div class="bg-gradient-to-r from-teal-pale to-white border border-teal-electric/20 rounded-xl p-5">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-display font-bold text-teal-dark uppercase tracking-wider">5:00 PM</span>
            <span class="text-xs text-teal-dark">&middot; Rooftop Terrace</span>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">Welcome Reception & Happy Hour</h3>
          <p class="text-xs text-txt-secondary mt-1">Drinks, hors d'oeuvres, and city views. Sponsored by Netflix.</p>
        </div>
      </div>
    </div>

    <!-- Day 2 Timeline -->
    <div id="day2" class="hidden relative pl-14">
      <div class="timeline-line"></div>

      <div class="relative mb-8 fade-up visible">
        <div class="timeline-dot break-dot" style="top:6px;"></div>
        <div class="bg-surface-muted border border-surface-border rounded-xl p-4">
          <div class="flex items-center gap-2">
            <span class="text-xs font-display font-bold text-txt-muted uppercase tracking-wider">8:30 AM</span>
          </div>
          <h3 class="font-display font-semibold text-txt-muted text-sm mt-1">Breakfast & Networking</h3>
        </div>
      </div>

      <div class="relative mb-8 fade-up visible">
        <div class="timeline-dot" style="top:6px;"></div>
        <div class="bg-white border-2 border-indigo-deep/20 rounded-xl p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <span class="text-xs font-display font-bold text-indigo-deep uppercase tracking-wider">9:00 AM</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-pale text-indigo-deep font-semibold">Keynote</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-txt-muted font-medium">Main Hall</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">The Future of Developer Tooling</h3>
          <p class="text-xs text-txt-secondary mt-1">David Kim &middot; Founder & CEO, DevToolsCo</p>
          <p class="text-xs text-txt-muted mt-1">60 min</p>
        </div>
      </div>

      <div class="relative mb-8 fade-up visible">
        <div class="timeline-dot" style="top:6px;"></div>
        <div class="bg-white border border-surface-border rounded-xl p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <span class="text-xs font-display font-bold text-teal-electric uppercase tracking-wider">10:15 AM</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-teal-pale text-teal-dark font-semibold">Talk</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-txt-muted font-medium">Room A</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">Building LLM-Powered Applications in Production</h3>
          <p class="text-xs text-txt-secondary mt-1">Dr. Wei Zhang &middot; ML Lead, OpenAI</p>
          <p class="text-xs text-txt-muted mt-1">45 min &middot; Track: AI/ML</p>
        </div>
      </div>

      <div class="relative mb-8 fade-up visible">
        <div class="timeline-dot" style="top:6px; border-color:#4f46e5;"></div>
        <div class="bg-white border border-surface-border rounded-xl p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <span class="text-xs font-display font-bold text-indigo-light uppercase tracking-wider">10:15 AM</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">Workshop</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-txt-muted font-medium">Room D</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">Hands-on: Building Resilient Distributed Systems</h3>
          <p class="text-xs text-txt-secondary mt-1">James Okonkwo &middot; Principal Architect, Netflix</p>
          <p class="text-xs text-txt-muted mt-1">120 min &middot; Track: Infrastructure &middot; Laptop required</p>
        </div>
      </div>

      <div class="relative mb-8 fade-up visible">
        <div class="timeline-dot break-dot" style="top:6px;"></div>
        <div class="bg-surface-muted border border-surface-border rounded-xl p-4">
          <div class="flex items-center gap-2">
            <span class="text-xs font-display font-bold text-txt-muted uppercase tracking-wider">12:30 PM</span>
            <span class="text-xs text-txt-muted">&middot; 90 min</span>
          </div>
          <h3 class="font-display font-semibold text-txt-muted text-sm mt-1">Lunch & Unconference Sessions</h3>
        </div>
      </div>

      <div class="relative mb-8 fade-up visible">
        <div class="timeline-dot" style="top:6px;"></div>
        <div class="bg-white border border-surface-border rounded-xl p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <span class="text-xs font-display font-bold text-teal-electric uppercase tracking-wider">2:00 PM</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-teal-pale text-teal-dark font-semibold">Talk</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-txt-muted font-medium">Room B</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">Edge Computing: Moving Logic Closer to Users</h3>
          <p class="text-xs text-txt-secondary mt-1">Priya Sharma &middot; Edge Platform Lead, Cloudflare</p>
          <p class="text-xs text-txt-muted mt-1">45 min &middot; Track: Infrastructure</p>
        </div>
      </div>

      <div class="relative fade-up visible">
        <div class="timeline-dot" style="top:6px; border-color:#14b8a6; background:#f0fdfa;"></div>
        <div class="bg-gradient-to-r from-teal-pale to-white border border-teal-electric/20 rounded-xl p-5">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-display font-bold text-teal-dark uppercase tracking-wider">7:00 PM</span>
            <span class="text-xs text-teal-dark">&middot; The Grand Ballroom</span>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">TechConf Gala Dinner</h3>
          <p class="text-xs text-txt-secondary mt-1">Awards ceremony, live music, three-course dinner. VIP & All-Access only.</p>
        </div>
      </div>
    </div>

    <!-- Day 3 Timeline -->
    <div id="day3" class="hidden relative pl-14">
      <div class="timeline-line"></div>

      <div class="relative mb-8 fade-up visible">
        <div class="timeline-dot break-dot" style="top:6px;"></div>
        <div class="bg-surface-muted border border-surface-border rounded-xl p-4">
          <div class="flex items-center gap-2">
            <span class="text-xs font-display font-bold text-txt-muted uppercase tracking-wider">9:00 AM</span>
          </div>
          <h3 class="font-display font-semibold text-txt-muted text-sm mt-1">Coffee & Open Discussions</h3>
        </div>
      </div>

      <div class="relative mb-8 fade-up visible">
        <div class="timeline-dot" style="top:6px;"></div>
        <div class="bg-white border border-surface-border rounded-xl p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <span class="text-xs font-display font-bold text-teal-electric uppercase tracking-wider">9:30 AM</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">Workshop</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-txt-muted font-medium">Room A</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">Workshop: Advanced TypeScript Patterns</h3>
          <p class="text-xs text-txt-secondary mt-1">Aisha Patel &middot; Staff Engineer, Meta</p>
          <p class="text-xs text-txt-muted mt-1">120 min &middot; Track: Frontend &middot; Laptop required</p>
        </div>
      </div>

      <div class="relative mb-8 fade-up visible">
        <div class="timeline-dot" style="top:6px; border-color:#4f46e5;"></div>
        <div class="bg-white border border-surface-border rounded-xl p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <span class="text-xs font-display font-bold text-indigo-light uppercase tracking-wider">9:30 AM</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">Workshop</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-txt-muted font-medium">Room C</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">Workshop: Threat Modeling for Modern Apps</h3>
          <p class="text-xs text-txt-secondary mt-1">Elena Voss &middot; Head of Security, Cloudflare</p>
          <p class="text-xs text-txt-muted mt-1">120 min &middot; Track: Security &middot; Laptop required</p>
        </div>
      </div>

      <div class="relative mb-8 fade-up visible">
        <div class="timeline-dot break-dot" style="top:6px;"></div>
        <div class="bg-surface-muted border border-surface-border rounded-xl p-4">
          <div class="flex items-center gap-2">
            <span class="text-xs font-display font-bold text-txt-muted uppercase tracking-wider">12:00 PM</span>
            <span class="text-xs text-txt-muted">&middot; 60 min</span>
          </div>
          <h3 class="font-display font-semibold text-txt-muted text-sm mt-1">Farewell Lunch</h3>
        </div>
      </div>

      <div class="relative mb-8 fade-up visible">
        <div class="timeline-dot" style="top:6px; border-color:#312e81;"></div>
        <div class="bg-white border-2 border-indigo-deep/20 rounded-xl p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <span class="text-xs font-display font-bold text-indigo-deep uppercase tracking-wider">1:00 PM</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-pale text-indigo-deep font-semibold">Closing</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-txt-muted font-medium">Main Hall</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">Closing Keynote: What Comes Next</h3>
          <p class="text-xs text-txt-secondary mt-1">Dr. Sarah Chen &middot; VP of Engineering, Google Cloud</p>
          <p class="text-xs text-txt-muted mt-1">45 min</p>
        </div>
      </div>

      <div class="relative fade-up visible">
        <div class="timeline-dot" style="top:6px; border-color:#14b8a6; background:#f0fdfa;"></div>
        <div class="bg-gradient-to-r from-teal-pale to-white border border-teal-electric/20 rounded-xl p-5">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-display font-bold text-teal-dark uppercase tracking-wider">2:00 PM</span>
          </div>
          <h3 class="font-display font-bold text-txt-primary text-sm">Community Farewell & Group Photo</h3>
          <p class="text-xs text-txt-secondary mt-1">See you at TechConf 2025!</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Venue -->
<section id="venue" class="py-24 px-6">
  <div class="max-w-6xl mx-auto">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div class="fade-up">
        <span class="text-xs text-teal-electric font-display font-semibold uppercase tracking-widest">Venue</span>
        <h2 class="text-3xl md:text-4xl font-display font-bold text-indigo-deep mt-3 mb-6">Moscone Center</h2>
        <p class="text-sm text-txt-secondary leading-relaxed mb-6">
          Located in the heart of San Francisco's SoMa district, Moscone Center offers 700,000 sq ft of flexible event space with state-of-the-art technology infrastructure.
        </p>
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-indigo-pale flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" fill="none" stroke="#312e81" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <h4 class="text-sm font-display font-semibold text-txt-primary">Address</h4>
              <p class="text-xs text-txt-secondary">747 Howard St, San Francisco, CA 94103</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-teal-pale flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" fill="none" stroke="#0d9488" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
            </div>
            <div>
              <h4 class="text-sm font-display font-semibold text-txt-primary">Capacity</h4>
              <p class="text-xs text-txt-secondary">Main Hall: 2,000 seats &middot; 6 breakout rooms (50-200 seats each)</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-indigo-pale flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" fill="none" stroke="#312e81" stroke-width="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <div>
              <h4 class="text-sm font-display font-semibold text-txt-primary">Amenities</h4>
              <p class="text-xs text-txt-secondary">Free Wi-Fi, charging stations, prayer room, nursing room, accessibility ramps</p>
            </div>
          </div>
        </div>
      </div>
      <div class="fade-up">
        <div class="bg-surface-muted rounded-2xl overflow-hidden border border-surface-border aspect-[4/3] relative">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-deep/5 to-teal-electric/5 flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto rounded-full bg-indigo-deep/10 flex items-center justify-center mb-3">
                <svg width="28" height="28" fill="none" stroke="#312e81" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <p class="text-sm font-display font-semibold text-indigo-deep">Moscone Center</p>
              <p class="text-xs text-txt-muted mt-1">San Francisco, CA</p>
              <button onclick="handleAction('Open Map')" class="mt-4 text-xs text-teal-electric font-semibold hover:underline">View on Google Maps &rarr;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Sponsors -->
<section class="py-20 px-6 section-alt">
  <div class="max-w-5xl mx-auto text-center">
    <div class="fade-up">
      <span class="text-xs text-teal-electric font-display font-semibold uppercase tracking-widest">Our Partners</span>
      <h2 class="text-3xl font-display font-bold text-indigo-deep mt-3 mb-12">Sponsors & Partners</h2>
    </div>

    <!-- Platinum -->
    <div class="mb-10 fade-up">
      <div class="text-[10px] text-txt-muted font-display uppercase tracking-widest mb-5 font-semibold">Platinum</div>
      <div class="flex items-center justify-center gap-10 flex-wrap">
        <div class="sponsor-item w-32 h-14 bg-white rounded-xl flex items-center justify-center border border-surface-border shadow-sm cursor-pointer" onclick="handleAction('Google Cloud')">
          <span class="text-lg font-display font-bold text-txt-primary">Google Cloud</span>
        </div>
        <div class="sponsor-item w-32 h-14 bg-white rounded-xl flex items-center justify-center border border-surface-border shadow-sm cursor-pointer" onclick="handleAction('AWS')">
          <span class="text-lg font-display font-bold text-txt-primary">AWS</span>
        </div>
        <div class="sponsor-item w-32 h-14 bg-white rounded-xl flex items-center justify-center border border-surface-border shadow-sm cursor-pointer" onclick="handleAction('Microsoft')">
          <span class="text-lg font-display font-bold text-txt-primary">Microsoft</span>
        </div>
      </div>
    </div>

    <!-- Gold -->
    <div class="mb-10 fade-up">
      <div class="text-[10px] text-txt-muted font-display uppercase tracking-widest mb-5 font-semibold">Gold</div>
      <div class="flex items-center justify-center gap-6 flex-wrap">
        <div class="sponsor-item w-28 h-11 bg-white rounded-lg flex items-center justify-center border border-surface-border cursor-pointer" onclick="handleAction('Stripe')">
          <span class="text-sm font-display font-bold text-txt-primary">Stripe</span>
        </div>
        <div class="sponsor-item w-28 h-11 bg-white rounded-lg flex items-center justify-center border border-surface-border cursor-pointer" onclick="handleAction('Netflix')">
          <span class="text-sm font-display font-bold text-txt-primary">Netflix</span>
        </div>
        <div class="sponsor-item w-28 h-11 bg-white rounded-lg flex items-center justify-center border border-surface-border cursor-pointer" onclick="handleAction('Vercel')">
          <span class="text-sm font-display font-bold text-txt-primary">Vercel</span>
        </div>
        <div class="sponsor-item w-28 h-11 bg-white rounded-lg flex items-center justify-center border border-surface-border cursor-pointer" onclick="handleAction('Datadog')">
          <span class="text-sm font-display font-bold text-txt-primary">Datadog</span>
        </div>
      </div>
    </div>

    <!-- Community -->
    <div class="fade-up">
      <div class="text-[10px] text-txt-muted font-display uppercase tracking-widest mb-5 font-semibold">Community</div>
      <div class="flex items-center justify-center gap-4 flex-wrap">
        <div class="sponsor-item px-4 h-9 bg-white rounded-lg flex items-center justify-center border border-surface-border cursor-pointer text-xs text-txt-secondary font-medium" onclick="handleAction('Dev.to')">Dev.to</div>
        <div class="sponsor-item px-4 h-9 bg-white rounded-lg flex items-center justify-center border border-surface-border cursor-pointer text-xs text-txt-secondary font-medium" onclick="handleAction('Hashnode')">Hashnode</div>
        <div class="sponsor-item px-4 h-9 bg-white rounded-lg flex items-center justify-center border border-surface-border cursor-pointer text-xs text-txt-secondary font-medium" onclick="handleAction('SF Dev Meetup')">SF Dev Meetup</div>
        <div class="sponsor-item px-4 h-9 bg-white rounded-lg flex items-center justify-center border border-surface-border cursor-pointer text-xs text-txt-secondary font-medium" onclick="handleAction('Women Who Code')">Women Who Code</div>
      </div>
    </div>

    <div class="mt-10 fade-up">
      <button onclick="handleAction('Become a Sponsor')" class="text-xs text-indigo-deep font-display font-semibold border-2 border-indigo-deep/20 hover:border-indigo-deep/50 px-5 py-2 rounded-full transition-all hover:bg-indigo-pale">
        Become a Sponsor &rarr;
      </button>
    </div>
  </div>
</section>

<!-- Tickets / Registration CTA -->
<section id="tickets" class="py-24 px-6">
  <div class="max-w-5xl mx-auto">
    <div class="text-center mb-14 fade-up">
      <span class="text-xs text-teal-electric font-display font-semibold uppercase tracking-widest">Registration</span>
      <h2 class="text-3xl md:text-4xl font-display font-bold text-indigo-deep mt-3 mb-4">Get Your Tickets</h2>
      <p class="text-sm text-txt-secondary">Early bird pricing ends February 15. Don't miss out.</p>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <!-- Early Bird -->
      <div class="bg-white border-2 border-teal-electric/30 rounded-2xl p-7 relative fade-up hover:shadow-lg transition-shadow">
        <div class="absolute -top-3 left-6 px-3 py-1 bg-teal-electric text-white text-[10px] font-display font-bold rounded-full uppercase tracking-wider">Early Bird</div>
        <div class="text-sm text-txt-secondary font-display font-medium mb-5 mt-2">Conference Pass</div>
        <div class="flex items-baseline gap-1 mb-1">
          <span class="text-4xl font-display font-black text-indigo-deep">$499</span>
          <span class="text-sm text-txt-muted">USD</span>
        </div>
        <div class="text-xs text-txt-muted line-through mb-6">$799</div>
        <ul class="space-y-3 mb-8 text-sm text-txt-secondary">
          <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>3-day full access</li>
          <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>All keynotes & talks</li>
          <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>Lunch & coffee daily</li>
          <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>Welcome reception</li>
          <li class="flex items-center gap-2.5 text-txt-muted"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>Workshops (add $99)</li>
        </ul>
        <button onclick="handleAction('Buy Early Bird')" class="w-full py-3 border-2 border-teal-electric text-teal-electric rounded-xl text-sm font-display font-bold hover:bg-teal-pale transition-all">
          Get Early Bird &rarr;
        </button>
        <div class="text-center mt-3 text-[11px] text-txt-muted font-display">Only 47 of 200 remaining</div>
      </div>

      <!-- All-Access (Featured) -->
      <div class="bg-gradient-to-b from-indigo-deep to-surface-dark rounded-2xl p-7 relative fade-up hover:shadow-xl transition-shadow transform md:-translate-y-2">
        <div class="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-teal-electric to-teal-dark text-white text-[10px] font-display font-bold rounded-full uppercase tracking-wider">Best Value</div>
        <div class="text-sm text-white/60 font-display font-medium mb-5 mt-2">All-Access Pass</div>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-4xl font-display font-black text-white">$899</span>
          <span class="text-sm text-white/40">USD</span>
        </div>
        <ul class="space-y-3 mb-8 text-sm text-white/80">
          <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5eead4" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>Everything in Conference</li>
          <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5eead4" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>All workshops included</li>
          <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5eead4" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>Gala dinner access</li>
          <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5eead4" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>Recording access (90 days)</li>
          <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5eead4" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>TechConf swag bag</li>
        </ul>
        <button onclick="handleAction('Buy All-Access')" class="cta-btn w-full py-3 rounded-xl text-white text-sm font-display font-bold">
          Get All-Access &rarr;
        </button>
      </div>

      <!-- VIP -->
      <div class="bg-white border-2 border-indigo-deep/20 rounded-2xl p-7 relative fade-up hover:shadow-lg transition-shadow">
        <div class="absolute -top-3 left-6 px-3 py-1 bg-indigo-deep text-white text-[10px] font-display font-bold rounded-full uppercase tracking-wider">VIP</div>
        <div class="text-sm text-txt-secondary font-display font-medium mb-5 mt-2">VIP Experience</div>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-4xl font-display font-black text-indigo-deep">$1,999</span>
          <span class="text-sm text-txt-muted">USD</span>
        </div>
        <ul class="space-y-3 mb-8 text-sm text-txt-secondary">
          <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#312e81" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>All-Access benefits</li>
          <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#312e81" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>Front-row reserved seating</li>
          <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#312e81" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>Speaker meet & greet</li>
          <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#312e81" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>Private lounge access</li>
          <li class="flex items-center gap-2.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#312e81" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>Lifetime recording access</li>
        </ul>
        <button onclick="handleAction('Buy VIP')" class="w-full py-3 border-2 border-indigo-deep text-indigo-deep rounded-xl text-sm font-display font-bold hover:bg-indigo-pale transition-all">
          Get VIP &rarr;
        </button>
        <div class="text-center mt-3 text-[11px] text-txt-muted font-display">Only 12 of 50 remaining</div>
      </div>
    </div>

    <!-- Group discount -->
    <div class="mt-10 text-center fade-up">
      <div class="inline-flex items-center gap-3 px-6 py-3 bg-surface-muted rounded-xl border border-surface-border">
        <svg width="18" height="18" fill="none" stroke="#312e81" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        <span class="text-sm text-txt-secondary">Sending a team? <button onclick="handleAction('Group Discount')" class="text-indigo-deep font-display font-bold hover:underline">Get 20% off for 5+ tickets &rarr;</button></span>
      </div>
    </div>
  </div>
</section>

<!-- Final CTA -->
<section class="py-24 px-6 hero-bg relative overflow-hidden">
  <div class="relative z-10 max-w-2xl mx-auto text-center fade-up">
    <h2 class="text-3xl md:text-4xl font-display font-bold text-white mb-4">Don't Miss TechConf 2024</h2>
    <p class="text-sm text-white/60 mb-10 leading-relaxed">
      March 15-17 at Moscone Center, San Francisco.<br>
      Join 2,000+ developers, designers, and tech leaders.
    </p>
    <button onclick="handleAction('Get Tickets')" class="cta-btn px-10 py-4 rounded-full text-white font-display font-bold text-sm tracking-wide">
      Get Your Tickets Now &rarr;
    </button>
    <div class="mt-6 text-xs text-white/40">Need to convince your boss? <button onclick="handleAction('Convince Letter')" class="text-teal-light hover:underline">Download our convince letter template</button></div>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-surface-border py-12 px-6 bg-white">
  <div class="max-w-6xl mx-auto">
    <div class="grid md:grid-cols-4 gap-8 mb-10">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 rounded-lg bg-indigo-deep flex items-center justify-center">
            <span class="text-white font-display font-bold text-sm">TC</span>
          </div>
          <span class="font-display font-bold text-indigo-deep">TechConf 2024</span>
        </div>
        <p class="text-xs text-txt-muted leading-relaxed">The premier technology conference bringing together the brightest minds in software engineering.</p>
      </div>
      <div>
        <h4 class="font-display font-semibold text-sm text-txt-primary mb-3">Event</h4>
        <div class="space-y-2">
          <a onclick="handleAction('Schedule')" class="block text-xs text-txt-muted hover:text-indigo-deep cursor-pointer transition-colors">Schedule</a>
          <a onclick="handleAction('Speakers')" class="block text-xs text-txt-muted hover:text-indigo-deep cursor-pointer transition-colors">Speakers</a>
          <a onclick="handleAction('Workshops')" class="block text-xs text-txt-muted hover:text-indigo-deep cursor-pointer transition-colors">Workshops</a>
          <a onclick="handleAction('Venue')" class="block text-xs text-txt-muted hover:text-indigo-deep cursor-pointer transition-colors">Venue & Travel</a>
        </div>
      </div>
      <div>
        <h4 class="font-display font-semibold text-sm text-txt-primary mb-3">Info</h4>
        <div class="space-y-2">
          <a onclick="handleAction('Code of Conduct')" class="block text-xs text-txt-muted hover:text-indigo-deep cursor-pointer transition-colors">Code of Conduct</a>
          <a onclick="handleAction('FAQ')" class="block text-xs text-txt-muted hover:text-indigo-deep cursor-pointer transition-colors">FAQ</a>
          <a onclick="handleAction('Scholarships')" class="block text-xs text-txt-muted hover:text-indigo-deep cursor-pointer transition-colors">Diversity Scholarships</a>
          <a onclick="handleAction('Refund Policy')" class="block text-xs text-txt-muted hover:text-indigo-deep cursor-pointer transition-colors">Refund Policy</a>
        </div>
      </div>
      <div>
        <h4 class="font-display font-semibold text-sm text-txt-primary mb-3">Stay Updated</h4>
        <div class="flex gap-2 mb-4">
          <input type="email" placeholder="your@email.com" class="flex-1 px-3 py-2 bg-surface-muted border border-surface-border rounded-lg text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-indigo-deep/50">
          <button onclick="handleAction('Subscribe')" class="px-3 py-2 bg-indigo-deep text-white rounded-lg text-xs font-display font-semibold hover:bg-indigo-mid transition-colors">Go</button>
        </div>
        <div class="flex items-center gap-3">
          <a onclick="handleAction('Twitter')" class="cursor-pointer w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center border border-surface-border hover:border-indigo-deep/30 transition-colors">
            <svg width="14" height="14" fill="#475569" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a onclick="handleAction('LinkedIn')" class="cursor-pointer w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center border border-surface-border hover:border-indigo-deep/30 transition-colors">
            <svg width="14" height="14" fill="#475569" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          <a onclick="handleAction('YouTube')" class="cursor-pointer w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center border border-surface-border hover:border-indigo-deep/30 transition-colors">
            <svg width="14" height="14" fill="#475569" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
      </div>
    </div>
    <div class="border-t border-surface-border pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
      <p class="text-xs text-txt-muted">&copy; 2024 TechConf. All rights reserved.</p>
      <p class="text-xs text-txt-muted">Made with care in San Francisco.</p>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-deep text-white px-6 py-3 rounded-xl text-xs font-display font-semibold shadow-xl opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-50 max-w-sm text-center"></div>

<script>
// Countdown
function updateCountdown() {
  const target = new Date('2024-03-15T09:00:00-08:00');
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) {
    document.getElementById('cd-days').textContent = '00';
    document.getElementById('cd-hours').textContent = '00';
    document.getElementById('cd-mins').textContent = '00';
    document.getElementById('cd-secs').textContent = '00';
    return;
  }
  const d = Math.floor(diff / (1000*60*60*24));
  const h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  const m = Math.floor((diff % (1000*60*60)) / (1000*60));
  const s = Math.floor((diff % (1000*60)) / 1000);
  document.getElementById('cd-days').textContent = String(d).padStart(2,'0');
  document.getElementById('cd-hours').textContent = String(h).padStart(2,'0');
  document.getElementById('cd-mins').textContent = String(m).padStart(2,'0');
  document.getElementById('cd-secs').textContent = String(s).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

// Day tabs
function switchDay(day) {
  document.querySelectorAll('.day-tab').forEach(t => {
    const isActive = parseInt(t.dataset.day) === day;
    if (isActive) {
      t.classList.add('active');
      t.classList.remove('text-txt-secondary', 'border-2', 'border-surface-border', 'bg-white');
    } else {
      t.classList.remove('active');
      t.classList.add('text-txt-secondary', 'border-2', 'border-surface-border', 'bg-white');
    }
  });
  document.getElementById('day1').classList.toggle('hidden', day !== 1);
  document.getElementById('day2').classList.toggle('hidden', day !== 2);
  document.getElementById('day3').classList.toggle('hidden', day !== 3);
}

// Mobile menu
function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('hidden');
}
function closeMobile() {
  document.getElementById('mobileMenu').classList.add('hidden');
}

// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translate(-50%, 0)';
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translate(-50%, 8px)';
  }, 2500);
}
function handleAction(a) { showToast(a + ' — This is a template preview'); }

// Scroll animation
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
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
