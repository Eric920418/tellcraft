-- Template Preview: landing-agency (Digital Agency Landing Page) v2
-- Swap Test: 水平滾動案例展示 + 游標軌跡 + 對角線揭示 + 玻璃擬態 = 一看就是數位創意機構
-- Signature: 滑鼠游標軌跡效果 + 可展開案例卡片 + 對角線文字揭示動畫

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'b12e9af6-9b38-4812-8016-b37e84accf40',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VORTEX — Digital Agency</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        indigo: { electric: '#4F46E5', light: '#6366F1', dark: '#3730A3' },
        pink: { hot: '#EC4899', light: '#F472B6', dark: '#DB2777' },
        navy: { DEFAULT: '#0F172A', light: '#1E293B', lighter: '#334155' },
        smoke: '#1E293B',
        snow: '#F8FAFC'
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', sans-serif; background: #0F172A; color: #F8FAFC; overflow-x: hidden; }
  h1, h2, h3, h4, h5 { font-family: 'Syne', sans-serif; }

  /* ===== NOISE TEXTURE OVERLAY ===== */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 9998;
    pointer-events: none;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 256px 256px;
  }

  /* ===== CURSOR TRAIL ===== */
  .cursor-dot {
    position: fixed;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4F46E5;
    pointer-events: none;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.1s;
    mix-blend-mode: screen;
  }

  /* ===== GRADIENT MESH BG ===== */
  .gradient-mesh {
    background:
      radial-gradient(ellipse at 20% 50%, rgba(79,70,229,0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(236,72,153,0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 80%, rgba(79,70,229,0.08) 0%, transparent 50%),
      #0F172A;
  }

  .gradient-mesh-contact {
    background:
      radial-gradient(ellipse at 30% 30%, rgba(79,70,229,0.2) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 70%, rgba(236,72,153,0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 60%),
      #0F172A;
  }

  /* ===== GLASSMORPHISM ===== */
  .glass {
    background: rgba(30, 41, 59, 0.5);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(248, 250, 252, 0.08);
  }
  .glass-strong {
    background: rgba(30, 41, 59, 0.7);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid rgba(248, 250, 252, 0.1);
  }

  /* ===== DIAGONAL WIPE REVEAL ===== */
  .diag-reveal {
    opacity: 0;
    clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
    transition: all 1s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .diag-reveal.visible {
    opacity: 1;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }

  .fade-up {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .fade-up.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .scale-in {
    opacity: 0;
    transform: scale(0.9);
    transition: all 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .scale-in.visible {
    opacity: 1;
    transform: scale(1);
  }

  /* ===== HORIZONTAL SCROLL HERO ===== */
  .hero-scroll {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .hero-scroll::-webkit-scrollbar { display: none; }
  .hero-scroll-item {
    flex: 0 0 85vw;
    scroll-snap-align: start;
    margin-right: 24px;
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.5s cubic-bezier(0.22,1,0.36,1);
  }
  .hero-scroll-item:hover { transform: scale(1.02); }
  @media (min-width: 768px) {
    .hero-scroll-item { flex: 0 0 60vw; }
  }
  @media (min-width: 1280px) {
    .hero-scroll-item { flex: 0 0 45vw; }
  }

  /* ===== CASE STUDY EXPAND ===== */
  .case-card {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.6s cubic-bezier(0.22,1,0.36,1);
  }
  .case-card .case-details {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.6s cubic-bezier(0.22,1,0.36,1), padding 0.4s ease;
    padding: 0 2rem;
  }
  .case-card.expanded .case-details {
    max-height: 600px;
    padding: 1.5rem 2rem 2rem;
  }
  .case-card .expand-icon {
    transition: transform 0.4s ease;
  }
  .case-card.expanded .expand-icon {
    transform: rotate(45deg);
  }

  /* ===== MARQUEE ===== */
  .marquee-track {
    display: flex;
    animation: marquee-scroll 25s linear infinite;
    width: max-content;
  }
  @keyframes marquee-scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  /* ===== TEAM FLIP CARD ===== */
  .flip-card { perspective: 1000px; cursor: pointer; }
  .flip-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.7s cubic-bezier(0.22,1,0.36,1);
    transform-style: preserve-3d;
  }
  .flip-card:hover .flip-inner { transform: rotateY(180deg); }
  .flip-front, .flip-back {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    border-radius: 20px;
    overflow: hidden;
  }
  .flip-back {
    transform: rotateY(180deg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  /* ===== ACCORDION ===== */
  .accordion-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.5s cubic-bezier(0.22,1,0.36,1), padding 0.3s ease;
    padding: 0 1.5rem;
  }
  .accordion-item.open .accordion-content {
    max-height: 300px;
    padding: 0 1.5rem 1.5rem;
  }
  .accordion-item .acc-icon {
    transition: transform 0.3s ease;
  }
  .accordion-item.open .acc-icon {
    transform: rotate(45deg);
  }
  .accordion-item {
    border-bottom: 1px solid rgba(248,250,252,0.06);
    transition: background 0.3s ease;
  }
  .accordion-item:hover {
    background: rgba(79,70,229,0.04);
  }

  /* ===== COUNTER ANIMATION ===== */
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(79,70,229,0.2); }
    50% { box-shadow: 0 0 40px rgba(79,70,229,0.4); }
  }

  /* ===== GRADIENT TEXT ===== */
  .gradient-text {
    background: linear-gradient(135deg, #4F46E5, #EC4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .gradient-text-reverse {
    background: linear-gradient(135deg, #EC4899, #4F46E5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ===== NAV ===== */
  .nav-blur {
    transition: all 0.4s ease;
  }
  .nav-blur.scrolled {
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(248,250,252,0.06);
  }

  /* ===== TOAST ===== */
  .toast-msg {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 1.75rem;
    border-radius: 16px;
    font-size: 0.9rem;
    font-weight: 500;
    z-index: 10000;
    transform: translateY(120%);
    opacity: 0;
    transition: all 0.5s cubic-bezier(0.22,1,0.36,1);
  }
  .toast-msg.show {
    transform: translateY(0);
    opacity: 1;
  }

  /* ===== SPLIT SECTIONS ===== */
  .split-left {
    opacity: 0;
    transform: translateX(-60px);
    transition: all 1s cubic-bezier(0.22,1,0.36,1);
  }
  .split-left.visible {
    opacity: 1;
    transform: translateX(0);
  }
  .split-right {
    opacity: 0;
    transform: translateX(60px);
    transition: all 1s cubic-bezier(0.22,1,0.36,1);
  }
  .split-right.visible {
    opacity: 1;
    transform: translateX(0);
  }

  /* ===== FLOATING METRICS ===== */
  @keyframes float-up {
    0% { transform: translateY(10px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(10px); }
  }
  .float-anim {
    animation: float-up 4s ease-in-out infinite;
  }
  .float-anim:nth-child(2) { animation-delay: 0.5s; }
  .float-anim:nth-child(3) { animation-delay: 1s; }
  .float-anim:nth-child(4) { animation-delay: 1.5s; }

  /* ===== SCROLL INDICATOR ===== */
  @keyframes scroll-hint {
    0%, 100% { transform: translateX(0); opacity: 0.6; }
    50% { transform: translateX(10px); opacity: 1; }
  }

  /* ===== DIAGONAL STRIPE BG ===== */
  .stripe-bg {
    background-image: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 40px,
      rgba(79,70,229,0.03) 40px,
      rgba(79,70,229,0.03) 80px
    );
  }

  /* ===== BUTTON STYLES ===== */
  .btn-primary {
    background: linear-gradient(135deg, #4F46E5, #6366F1);
    color: #F8FAFC;
    border: none;
    border-radius: 14px;
    padding: 0.875rem 2rem;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
    position: relative;
    overflow: hidden;
  }
  .btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #EC4899, #4F46E5);
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .btn-primary:hover::before { opacity: 1; }
  .btn-primary:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(79,70,229,0.4);
  }
  .btn-primary span { position: relative; z-index: 1; }

  .btn-ghost {
    background: transparent;
    color: #F8FAFC;
    border: 1px solid rgba(248,250,252,0.15);
    border-radius: 14px;
    padding: 0.875rem 2rem;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.4s ease;
  }
  .btn-ghost:hover {
    border-color: #4F46E5;
    background: rgba(79,70,229,0.1);
    transform: scale(1.05);
  }

  /* ===== FORM ===== */
  .form-input {
    background: rgba(248,250,252,0.05);
    border: 1px solid rgba(248,250,252,0.1);
    border-radius: 12px;
    padding: 0.875rem 1.25rem;
    color: #F8FAFC;
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    width: 100%;
    outline: none;
    transition: all 0.3s ease;
  }
  .form-input::placeholder { color: rgba(248,250,252,0.3); }
  .form-input:focus {
    border-color: #4F46E5;
    box-shadow: 0 0 0 3px rgba(79,70,229,0.15);
    background: rgba(248,250,252,0.08);
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 768px) {
    .hero-title { font-size: 2.5rem !important; }
    .section-title { font-size: 2rem !important; }
    .metrics-grid { flex-direction: column; gap: 1.5rem !important; }
    .team-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .split-section { flex-direction: column !important; }
    .split-section.reverse { flex-direction: column !important; }
    .works-grid { grid-template-columns: 1fr !important; }
  }
</style>
</head>
<body class="gradient-mesh">

<!-- Cursor Trail Container -->
<div id="cursorTrail"></div>

<!-- Toast -->
<div id="toast" class="toast-msg glass-strong"></div>

<!-- ===== NAVIGATION ===== -->
<nav id="mainNav" class="nav-blur fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-5">
  <div class="max-w-7xl mx-auto flex items-center justify-between">
    <a href="#" class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-electric to-pink-hot flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/></svg>
      </div>
      <span class="font-display font-bold text-xl text-snow tracking-tight">VORTEX</span>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#works" class="text-sm text-snow/60 hover:text-snow transition-colors font-medium">Works</a>
      <a href="#services" class="text-sm text-snow/60 hover:text-snow transition-colors font-medium">Services</a>
      <a href="#team" class="text-sm text-snow/60 hover:text-snow transition-colors font-medium">Team</a>
      <a href="#contact" class="text-sm text-snow/60 hover:text-snow transition-colors font-medium">Contact</a>
    </div>
    <button class="btn-primary text-sm py-2.5 px-5" onclick="handleAction('Start a project')">
      <span>Let's Talk</span>
    </button>
  </div>
</nav>

<!-- ===== HERO SECTION ===== -->
<section class="pt-32 pb-8 px-6 lg:px-12 gradient-mesh min-h-screen flex flex-col justify-center">
  <div class="max-w-7xl mx-auto w-full mb-12">
    <div class="diag-reveal">
      <p class="font-body text-sm font-medium tracking-[0.2em] uppercase text-indigo-electric/80 mb-4">Digital Agency — Est. 2019</p>
    </div>
    <h1 class="hero-title font-display font-extrabold text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-6 diag-reveal" style="transition-delay:0.15s">
      We craft<br>
      <span class="gradient-text">digital</span> experiences<br>
      that <span class="gradient-text-reverse">matter</span>
    </h1>
    <p class="font-body text-lg text-snow/50 max-w-xl mb-6 diag-reveal" style="transition-delay:0.3s">
      Strategy, design, and technology — woven together to build brands that stand out in the digital landscape.
    </p>
    <div class="flex items-center gap-3 text-snow/40 text-sm diag-reveal" style="transition-delay:0.45s">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      <span style="animation: scroll-hint 2s ease-in-out infinite">Scroll to explore our work</span>
    </div>
  </div>

  <!-- Horizontal Scroll Case Studies -->
  <div class="hero-scroll pb-8 pl-6 lg:pl-12" id="heroScroll">
    <!-- Case 1 -->
    <div class="hero-scroll-item h-[400px] md:h-[480px]" onclick="expandHeroCase(0)">
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-electric/30 to-pink-hot/20"></div>
      <div class="absolute inset-0" style="background: url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%234F46E5%22 fill-opacity=%220.06%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E') repeat;"></div>
      <div class="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-navy/90 to-transparent">
        <div class="flex items-center gap-2 mb-3">
          <span class="px-3 py-1 rounded-full text-xs font-medium bg-indigo-electric/20 text-indigo-electric border border-indigo-electric/30">Branding</span>
          <span class="px-3 py-1 rounded-full text-xs font-medium bg-pink-hot/20 text-pink-hot border border-pink-hot/30">Web Design</span>
        </div>
        <h3 class="font-display font-bold text-2xl md:text-3xl mb-2">Nebula Finance</h3>
        <p class="font-body text-snow/50 text-sm">Complete digital rebrand for a fintech startup — from identity to product design.</p>
      </div>
      <div class="absolute top-6 right-6 w-10 h-10 rounded-full glass flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
      </div>
    </div>

    <!-- Case 2 -->
    <div class="hero-scroll-item h-[400px] md:h-[480px]" onclick="expandHeroCase(1)">
      <div class="absolute inset-0 bg-gradient-to-br from-pink-hot/30 to-indigo-electric/20"></div>
      <div class="absolute inset-0" style="background: linear-gradient(45deg, rgba(236,72,153,0.1) 25%, transparent 25%, transparent 75%, rgba(236,72,153,0.1) 75%), linear-gradient(45deg, rgba(236,72,153,0.1) 25%, transparent 25%, transparent 75%, rgba(236,72,153,0.1) 75%); background-size: 40px 40px; background-position: 0 0, 20px 20px;"></div>
      <div class="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-navy/90 to-transparent">
        <div class="flex items-center gap-2 mb-3">
          <span class="px-3 py-1 rounded-full text-xs font-medium bg-pink-hot/20 text-pink-hot border border-pink-hot/30">E-Commerce</span>
          <span class="px-3 py-1 rounded-full text-xs font-medium bg-indigo-electric/20 text-indigo-electric border border-indigo-electric/30">UX Strategy</span>
        </div>
        <h3 class="font-display font-bold text-2xl md:text-3xl mb-2">Aurelia Beauty</h3>
        <p class="font-body text-snow/50 text-sm">Luxury e-commerce platform with AI-powered personalization and 340% conversion boost.</p>
      </div>
      <div class="absolute top-6 right-6 w-10 h-10 rounded-full glass flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
      </div>
    </div>

    <!-- Case 3 -->
    <div class="hero-scroll-item h-[400px] md:h-[480px]" onclick="expandHeroCase(2)">
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-electric/20 via-purple-500/20 to-pink-hot/30"></div>
      <div class="absolute inset-0" style="background: radial-gradient(circle at 30% 50%, rgba(79,70,229,0.12) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(236,72,153,0.1) 0%, transparent 50%);"></div>
      <div class="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-navy/90 to-transparent">
        <div class="flex items-center gap-2 mb-3">
          <span class="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">SaaS</span>
          <span class="px-3 py-1 rounded-full text-xs font-medium bg-indigo-electric/20 text-indigo-electric border border-indigo-electric/30">Product Design</span>
        </div>
        <h3 class="font-display font-bold text-2xl md:text-3xl mb-2">Quantum Analytics</h3>
        <p class="font-body text-snow/50 text-sm">Enterprise analytics dashboard with real-time data visualization for 50K+ daily users.</p>
      </div>
      <div class="absolute top-6 right-6 w-10 h-10 rounded-full glass flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
      </div>
    </div>

    <!-- Case 4 -->
    <div class="hero-scroll-item h-[400px] md:h-[480px]" onclick="expandHeroCase(3)">
      <div class="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-indigo-electric/20"></div>
      <div class="absolute inset-0" style="background: conic-gradient(from 45deg at 50% 50%, rgba(79,70,229,0.05) 0%, rgba(236,72,153,0.08) 25%, rgba(79,70,229,0.05) 50%, rgba(236,72,153,0.08) 75%, rgba(79,70,229,0.05) 100%);"></div>
      <div class="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-navy/90 to-transparent">
        <div class="flex items-center gap-2 mb-3">
          <span class="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">Mobile App</span>
          <span class="px-3 py-1 rounded-full text-xs font-medium bg-indigo-electric/20 text-indigo-electric border border-indigo-electric/30">UI/UX</span>
        </div>
        <h3 class="font-display font-bold text-2xl md:text-3xl mb-2">Pulse Fitness</h3>
        <p class="font-body text-snow/50 text-sm">Award-winning fitness app — Apple Design Award finalist with 2M+ downloads.</p>
      </div>
      <div class="absolute top-6 right-6 w-10 h-10 rounded-full glass flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
      </div>
    </div>

    <!-- Spacer -->
    <div style="flex: 0 0 40px;"></div>
  </div>
</section>

<!-- ===== METRICS BAR ===== -->
<section class="py-20 px-6 lg:px-12 relative stripe-bg" id="metrics">
  <div class="max-w-6xl mx-auto">
    <div class="metrics-grid flex flex-wrap justify-center gap-6 lg:gap-10">
      <div class="float-anim glass rounded-2xl px-8 py-7 text-center min-w-[200px] fade-up" style="animation: pulse-glow 3s ease-in-out infinite;">
        <div class="font-display font-extrabold text-4xl md:text-5xl gradient-text counter" data-target="500" data-suffix="+">0</div>
        <div class="font-body text-snow/40 text-sm mt-2 tracking-wide">Projects Delivered</div>
      </div>
      <div class="float-anim glass rounded-2xl px-8 py-7 text-center min-w-[200px] fade-up" style="transition-delay:0.1s; animation: pulse-glow 3s ease-in-out infinite 0.5s;">
        <div class="font-display font-extrabold text-4xl md:text-5xl gradient-text-reverse counter" data-target="120" data-suffix="+">0</div>
        <div class="font-body text-snow/40 text-sm mt-2 tracking-wide">Happy Clients</div>
      </div>
      <div class="float-anim glass rounded-2xl px-8 py-7 text-center min-w-[200px] fade-up" style="transition-delay:0.2s; animation: pulse-glow 3s ease-in-out infinite 1s;">
        <div class="font-display font-extrabold text-4xl md:text-5xl gradient-text counter" data-target="15" data-suffix="">0</div>
        <div class="font-body text-snow/40 text-sm mt-2 tracking-wide">Design Awards</div>
      </div>
      <div class="float-anim glass rounded-2xl px-8 py-7 text-center min-w-[200px] fade-up" style="transition-delay:0.3s; animation: pulse-glow 3s ease-in-out infinite 1.5s;">
        <div class="font-display font-extrabold text-4xl md:text-5xl gradient-text-reverse counter" data-target="98" data-suffix="%">0</div>
        <div class="font-body text-snow/40 text-sm mt-2 tracking-wide">Client Retention</div>
      </div>
    </div>
  </div>
</section>

<!-- ===== SERVICES (Accordion) ===== -->
<section class="py-24 px-6 lg:px-12" id="services">
  <div class="max-w-6xl mx-auto">
    <div class="flex flex-col lg:flex-row gap-16 items-start">
      <div class="lg:w-1/3 lg:sticky lg:top-32">
        <p class="font-body text-xs font-semibold tracking-[0.25em] uppercase text-indigo-electric mb-4 diag-reveal">What we do</p>
        <h2 class="section-title font-display font-extrabold text-4xl md:text-5xl leading-tight mb-6 diag-reveal" style="transition-delay:0.1s">
          Services built for <span class="gradient-text">impact</span>
        </h2>
        <p class="font-body text-snow/40 leading-relaxed diag-reveal" style="transition-delay:0.2s">
          From strategy to execution, we deliver end-to-end digital solutions that drive real business results.
        </p>
      </div>

      <div class="lg:w-2/3 w-full fade-up" style="transition-delay:0.2s">
        <div class="accordion-item open" onclick="toggleAccordion(this)">
          <div class="flex items-center justify-between px-6 py-6 cursor-pointer">
            <div class="flex items-center gap-5">
              <div class="w-12 h-12 rounded-xl bg-indigo-electric/10 flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </div>
              <h3 class="font-display font-bold text-lg text-snow">Brand Strategy & Identity</h3>
            </div>
            <div class="acc-icon w-8 h-8 rounded-full border border-snow/10 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
          </div>
          <div class="accordion-content">
            <p class="font-body text-snow/40 leading-relaxed text-sm pb-2">We define your brand's DNA through deep research, competitive analysis, and creative exploration. From naming and visual identity to tone of voice and brand guidelines — everything your brand needs to resonate with its audience and stand the test of time.</p>
            <div class="flex flex-wrap gap-2 mt-3">
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">Logo Design</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">Brand Guidelines</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">Naming</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">Positioning</span>
            </div>
          </div>
        </div>

        <div class="accordion-item" onclick="toggleAccordion(this)">
          <div class="flex items-center justify-between px-6 py-6 cursor-pointer">
            <div class="flex items-center gap-5">
              <div class="w-12 h-12 rounded-xl bg-pink-hot/10 flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <h3 class="font-display font-bold text-lg text-snow">UI/UX Design</h3>
            </div>
            <div class="acc-icon w-8 h-8 rounded-full border border-snow/10 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
          </div>
          <div class="accordion-content">
            <p class="font-body text-snow/40 leading-relaxed text-sm pb-2">User-centered design that balances beauty and function. We create interfaces that delight users and drive business metrics. Our process includes user research, wireframing, prototyping, and pixel-perfect design systems that scale.</p>
            <div class="flex flex-wrap gap-2 mt-3">
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">User Research</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">Wireframing</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">Prototyping</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">Design Systems</span>
            </div>
          </div>
        </div>

        <div class="accordion-item" onclick="toggleAccordion(this)">
          <div class="flex items-center justify-between px-6 py-6 cursor-pointer">
            <div class="flex items-center gap-5">
              <div class="w-12 h-12 rounded-xl bg-indigo-electric/10 flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              </div>
              <h3 class="font-display font-bold text-lg text-snow">Web Development</h3>
            </div>
            <div class="acc-icon w-8 h-8 rounded-full border border-snow/10 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
          </div>
          <div class="accordion-content">
            <p class="font-body text-snow/40 leading-relaxed text-sm pb-2">High-performance web applications built with modern technologies. We specialize in React, Next.js, and headless architectures that deliver blazing-fast experiences. Every line of code is optimized for speed, SEO, and accessibility.</p>
            <div class="flex flex-wrap gap-2 mt-3">
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">React / Next.js</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">Headless CMS</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">API Integration</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">Performance</span>
            </div>
          </div>
        </div>

        <div class="accordion-item" onclick="toggleAccordion(this)">
          <div class="flex items-center justify-between px-6 py-6 cursor-pointer">
            <div class="flex items-center gap-5">
              <div class="w-12 h-12 rounded-xl bg-pink-hot/10 flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              </div>
              <h3 class="font-display font-bold text-lg text-snow">Growth & Analytics</h3>
            </div>
            <div class="acc-icon w-8 h-8 rounded-full border border-snow/10 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
          </div>
          <div class="accordion-content">
            <p class="font-body text-snow/40 leading-relaxed text-sm pb-2">Data-driven growth strategies that turn visitors into customers. We set up analytics pipelines, A/B testing frameworks, and conversion optimization funnels. Our approach combines creative marketing with rigorous data analysis.</p>
            <div class="flex flex-wrap gap-2 mt-3">
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">SEO</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">A/B Testing</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">CRO</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">Analytics</span>
            </div>
          </div>
        </div>

        <div class="accordion-item" onclick="toggleAccordion(this)">
          <div class="flex items-center justify-between px-6 py-6 cursor-pointer">
            <div class="flex items-center gap-5">
              <div class="w-12 h-12 rounded-xl bg-indigo-electric/10 flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              </div>
              <h3 class="font-display font-bold text-lg text-snow">Mobile Applications</h3>
            </div>
            <div class="acc-icon w-8 h-8 rounded-full border border-snow/10 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
          </div>
          <div class="accordion-content">
            <p class="font-body text-snow/40 leading-relaxed text-sm pb-2">Native and cross-platform mobile experiences that users love. From concept to App Store, we handle everything — including the tricky parts like offline-first architecture, push notifications, and smooth 60fps animations.</p>
            <div class="flex flex-wrap gap-2 mt-3">
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">React Native</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">iOS / Android</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">App Store</span>
              <span class="px-3 py-1 rounded-full text-xs bg-snow/5 text-snow/50">Push Notifications</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===== SELECTED WORKS (Expandable) ===== -->
<section class="py-24 px-6 lg:px-12 stripe-bg" id="works">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <p class="font-body text-xs font-semibold tracking-[0.25em] uppercase text-pink-hot mb-4 diag-reveal">Portfolio</p>
      <h2 class="section-title font-display font-extrabold text-4xl md:text-5xl diag-reveal" style="transition-delay:0.1s">Selected <span class="gradient-text-reverse">Works</span></h2>
    </div>

    <div class="works-grid grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="case-card glass fade-up" onclick="toggleCaseCard(this)">
        <div class="h-56 bg-gradient-to-br from-indigo-electric/20 to-pink-hot/10 relative overflow-hidden">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-electric to-pink-hot opacity-30 blur-xl"></div>
            <svg class="absolute" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </div>
          <div class="absolute top-4 right-4"><span class="px-3 py-1 rounded-full text-xs font-medium bg-navy/60 text-snow/80 backdrop-blur-sm">2024</span></div>
        </div>
        <div class="p-6 flex items-start justify-between">
          <div>
            <h3 class="font-display font-bold text-xl text-snow mb-1">MoodBoard AI</h3>
            <p class="font-body text-snow/40 text-sm">AI-powered design inspiration platform</p>
          </div>
          <div class="expand-icon w-8 h-8 rounded-full border border-snow/10 flex items-center justify-center flex-shrink-0 mt-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>
        <div class="case-details">
          <div class="border-t border-snow/5 pt-4">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div><p class="text-xs text-snow/30 mb-1">Role</p><p class="text-sm text-snow/70">Full Stack Design & Dev</p></div>
              <div><p class="text-xs text-snow/30 mb-1">Timeline</p><p class="text-sm text-snow/70">4 months</p></div>
              <div><p class="text-xs text-snow/30 mb-1">Tech Stack</p><p class="text-sm text-snow/70">Next.js, OpenAI, Supabase</p></div>
              <div><p class="text-xs text-snow/30 mb-1">Result</p><p class="text-sm text-indigo-electric">50K+ users in 3 months</p></div>
            </div>
            <p class="text-sm text-snow/40 leading-relaxed">Built an AI-powered platform that generates design mood boards from text prompts. The system uses GPT-4 Vision for style analysis and generates cohesive color palettes, typography pairings, and layout suggestions.</p>
            <button class="btn-ghost text-xs mt-4 py-2 px-4" onclick="event.stopPropagation(); handleAction('View MoodBoard AI case study')">View Full Case Study</button>
          </div>
        </div>
      </div>

      <div class="case-card glass fade-up" style="transition-delay:0.1s" onclick="toggleCaseCard(this)">
        <div class="h-56 bg-gradient-to-br from-pink-hot/20 to-amber-500/10 relative overflow-hidden">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-hot to-amber-500 opacity-30 blur-xl"></div>
            <svg class="absolute" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          </div>
          <div class="absolute top-4 right-4"><span class="px-3 py-1 rounded-full text-xs font-medium bg-navy/60 text-snow/80 backdrop-blur-sm">2024</span></div>
        </div>
        <div class="p-6 flex items-start justify-between">
          <div>
            <h3 class="font-display font-bold text-xl text-snow mb-1">Luxe Market</h3>
            <p class="font-body text-snow/40 text-sm">Premium fashion marketplace</p>
          </div>
          <div class="expand-icon w-8 h-8 rounded-full border border-snow/10 flex items-center justify-center flex-shrink-0 mt-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>
        <div class="case-details">
          <div class="border-t border-snow/5 pt-4">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div><p class="text-xs text-snow/30 mb-1">Role</p><p class="text-sm text-snow/70">UX Strategy & Frontend</p></div>
              <div><p class="text-xs text-snow/30 mb-1">Timeline</p><p class="text-sm text-snow/70">6 months</p></div>
              <div><p class="text-xs text-snow/30 mb-1">Tech Stack</p><p class="text-sm text-snow/70">React, Shopify, Algolia</p></div>
              <div><p class="text-xs text-snow/30 mb-1">Result</p><p class="text-sm text-pink-hot">340% conversion increase</p></div>
            </div>
            <p class="text-sm text-snow/40 leading-relaxed">Redesigned the entire shopping experience for a luxury fashion brand. Implemented AI-powered size recommendations, AR try-on features, and a lightning-fast search experience powered by Algolia.</p>
            <button class="btn-ghost text-xs mt-4 py-2 px-4" onclick="event.stopPropagation(); handleAction('View Luxe Market case study')">View Full Case Study</button>
          </div>
        </div>
      </div>

      <div class="case-card glass fade-up" style="transition-delay:0.15s" onclick="toggleCaseCard(this)">
        <div class="h-56 bg-gradient-to-br from-green-500/20 to-indigo-electric/10 relative overflow-hidden">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500 to-indigo-electric opacity-30 blur-xl"></div>
            <svg class="absolute" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <div class="absolute top-4 right-4"><span class="px-3 py-1 rounded-full text-xs font-medium bg-navy/60 text-snow/80 backdrop-blur-sm">2023</span></div>
        </div>
        <div class="p-6 flex items-start justify-between">
          <div>
            <h3 class="font-display font-bold text-xl text-snow mb-1">DataVault Pro</h3>
            <p class="font-body text-snow/40 text-sm">Enterprise data management platform</p>
          </div>
          <div class="expand-icon w-8 h-8 rounded-full border border-snow/10 flex items-center justify-center flex-shrink-0 mt-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>
        <div class="case-details">
          <div class="border-t border-snow/5 pt-4">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div><p class="text-xs text-snow/30 mb-1">Role</p><p class="text-sm text-snow/70">Product Design & Frontend</p></div>
              <div><p class="text-xs text-snow/30 mb-1">Timeline</p><p class="text-sm text-snow/70">8 months</p></div>
              <div><p class="text-xs text-snow/30 mb-1">Tech Stack</p><p class="text-sm text-snow/70">React, D3.js, GraphQL</p></div>
              <div><p class="text-xs text-snow/30 mb-1">Result</p><p class="text-sm text-green-400">60% faster data queries</p></div>
            </div>
            <p class="text-sm text-snow/40 leading-relaxed">Designed and built a complex data visualization dashboard serving 50K+ enterprise users. Implemented real-time collaborative editing, custom chart builders, and an intuitive query language interface.</p>
            <button class="btn-ghost text-xs mt-4 py-2 px-4" onclick="event.stopPropagation(); handleAction('View DataVault Pro case study')">View Full Case Study</button>
          </div>
        </div>
      </div>

      <div class="case-card glass fade-up" style="transition-delay:0.2s" onclick="toggleCaseCard(this)">
        <div class="h-56 bg-gradient-to-br from-amber-500/20 to-pink-hot/10 relative overflow-hidden">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-pink-hot opacity-30 blur-xl"></div>
            <svg class="absolute" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="1.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
          </div>
          <div class="absolute top-4 right-4"><span class="px-3 py-1 rounded-full text-xs font-medium bg-navy/60 text-snow/80 backdrop-blur-sm">2023</span></div>
        </div>
        <div class="p-6 flex items-start justify-between">
          <div>
            <h3 class="font-display font-bold text-xl text-snow mb-1">Trailblazer</h3>
            <p class="font-body text-snow/40 text-sm">Adventure travel booking app</p>
          </div>
          <div class="expand-icon w-8 h-8 rounded-full border border-snow/10 flex items-center justify-center flex-shrink-0 mt-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>
        <div class="case-details">
          <div class="border-t border-snow/5 pt-4">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div><p class="text-xs text-snow/30 mb-1">Role</p><p class="text-sm text-snow/70">End-to-End Design & Dev</p></div>
              <div><p class="text-xs text-snow/30 mb-1">Timeline</p><p class="text-sm text-snow/70">5 months</p></div>
              <div><p class="text-xs text-snow/30 mb-1">Tech Stack</p><p class="text-sm text-snow/70">React Native, Node.js, Maps</p></div>
              <div><p class="text-xs text-snow/30 mb-1">Result</p><p class="text-sm text-amber-400">2M+ app downloads</p></div>
            </div>
            <p class="text-sm text-snow/40 leading-relaxed">Created a mobile-first adventure travel platform with interactive trail maps, real-time weather integration, and a community-driven review system. Featured as App of the Day on the App Store.</p>
            <button class="btn-ghost text-xs mt-4 py-2 px-4" onclick="event.stopPropagation(); handleAction('View Trailblazer case study')">View Full Case Study</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===== CLIENT LOGOS MARQUEE ===== -->
<section class="py-16 overflow-hidden border-y border-snow/5">
  <div class="mb-8 text-center">
    <p class="font-body text-xs font-semibold tracking-[0.25em] uppercase text-snow/30">Trusted by industry leaders</p>
  </div>
  <div class="relative">
    <div class="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-navy to-transparent z-10"></div>
    <div class="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-navy to-transparent z-10"></div>
    <div class="marquee-track">
      <div class="flex items-center gap-16 px-8">
        <div class="glass rounded-xl px-8 py-4 flex items-center gap-3 flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span class="font-display font-bold text-snow/60 text-lg whitespace-nowrap">TechCorp</span>
        </div>
        <div class="glass rounded-xl px-8 py-4 flex items-center gap-3 flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <span class="font-display font-bold text-snow/60 text-lg whitespace-nowrap">Amour Fashion</span>
        </div>
        <div class="glass rounded-xl px-8 py-4 flex items-center gap-3 flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span class="font-display font-bold text-snow/60 text-lg whitespace-nowrap">Stellar Finance</span>
        </div>
        <div class="glass rounded-xl px-8 py-4 flex items-center gap-3 flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span class="font-display font-bold text-snow/60 text-lg whitespace-nowrap">GeoVenture</span>
        </div>
        <div class="glass rounded-xl px-8 py-4 flex items-center gap-3 flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.5"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg>
          <span class="font-display font-bold text-snow/60 text-lg whitespace-nowrap">HomeSmart</span>
        </div>
        <div class="glass rounded-xl px-8 py-4 flex items-center gap-3 flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          <span class="font-display font-bold text-snow/60 text-lg whitespace-nowrap">AlertNow</span>
        </div>
      </div>
      <div class="flex items-center gap-16 px-8">
        <div class="glass rounded-xl px-8 py-4 flex items-center gap-3 flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span class="font-display font-bold text-snow/60 text-lg whitespace-nowrap">TechCorp</span>
        </div>
        <div class="glass rounded-xl px-8 py-4 flex items-center gap-3 flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <span class="font-display font-bold text-snow/60 text-lg whitespace-nowrap">Amour Fashion</span>
        </div>
        <div class="glass rounded-xl px-8 py-4 flex items-center gap-3 flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span class="font-display font-bold text-snow/60 text-lg whitespace-nowrap">Stellar Finance</span>
        </div>
        <div class="glass rounded-xl px-8 py-4 flex items-center gap-3 flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span class="font-display font-bold text-snow/60 text-lg whitespace-nowrap">GeoVenture</span>
        </div>
        <div class="glass rounded-xl px-8 py-4 flex items-center gap-3 flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.5"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg>
          <span class="font-display font-bold text-snow/60 text-lg whitespace-nowrap">HomeSmart</span>
        </div>
        <div class="glass rounded-xl px-8 py-4 flex items-center gap-3 flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          <span class="font-display font-bold text-snow/60 text-lg whitespace-nowrap">AlertNow</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===== TEAM GRID WITH HOVER FLIP ===== -->
<section class="py-24 px-6 lg:px-12" id="team">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <p class="font-body text-xs font-semibold tracking-[0.25em] uppercase text-indigo-electric mb-4 diag-reveal">Our People</p>
      <h2 class="section-title font-display font-extrabold text-4xl md:text-5xl diag-reveal" style="transition-delay:0.1s">The <span class="gradient-text">minds</span> behind the magic</h2>
    </div>
    <div class="team-grid grid grid-cols-2 md:grid-cols-4 gap-6">
      <div class="flip-card h-[320px] fade-up">
        <div class="flip-inner">
          <div class="flip-front bg-gradient-to-br from-indigo-electric/20 to-smoke flex flex-col items-center justify-end p-6">
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-electric to-pink-hot mb-4 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h4 class="font-display font-bold text-snow text-base">Alex Chen</h4>
            <p class="font-body text-snow/40 text-sm">Creative Director</p>
          </div>
          <div class="flip-back glass p-6 text-center">
            <h4 class="font-display font-bold text-snow text-base mb-2">Alex Chen</h4>
            <p class="font-body text-snow/40 text-xs leading-relaxed mb-4">15 years crafting digital experiences. Previously at IDEO and Pentagram. Obsessed with the intersection of art and technology.</p>
            <div class="flex justify-center gap-3">
              <a href="#" class="w-8 h-8 rounded-full bg-snow/5 flex items-center justify-center hover:bg-indigo-electric/20 transition-colors" onclick="event.stopPropagation(); handleAction('Visit LinkedIn')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#F8FAFC"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              <a href="#" class="w-8 h-8 rounded-full bg-snow/5 flex items-center justify-center hover:bg-indigo-electric/20 transition-colors" onclick="event.stopPropagation(); handleAction('Visit Twitter')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#F8FAFC"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div class="flip-card h-[320px] fade-up" style="transition-delay:0.1s">
        <div class="flip-inner">
          <div class="flip-front bg-gradient-to-br from-pink-hot/20 to-smoke flex flex-col items-center justify-end p-6">
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-pink-hot to-indigo-electric mb-4 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h4 class="font-display font-bold text-snow text-base">Sarah Kim</h4>
            <p class="font-body text-snow/40 text-sm">Lead Designer</p>
          </div>
          <div class="flip-back glass p-6 text-center">
            <h4 class="font-display font-bold text-snow text-base mb-2">Sarah Kim</h4>
            <p class="font-body text-snow/40 text-xs leading-relaxed mb-4">Award-winning UI designer with a passion for micro-interactions. Turns complex problems into elegant, intuitive interfaces.</p>
            <div class="flex justify-center gap-3">
              <a href="#" class="w-8 h-8 rounded-full bg-snow/5 flex items-center justify-center hover:bg-pink-hot/20 transition-colors" onclick="event.stopPropagation()"><svg width="14" height="14" viewBox="0 0 24 24" fill="#F8FAFC"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
              <a href="#" class="w-8 h-8 rounded-full bg-snow/5 flex items-center justify-center hover:bg-pink-hot/20 transition-colors" onclick="event.stopPropagation()"><svg width="14" height="14" viewBox="0 0 24 24" fill="#F8FAFC"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
            </div>
          </div>
        </div>
      </div>
      <div class="flip-card h-[320px] fade-up" style="transition-delay:0.15s">
        <div class="flip-inner">
          <div class="flip-front bg-gradient-to-br from-indigo-electric/15 to-smoke flex flex-col items-center justify-end p-6">
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-electric via-purple-500 to-pink-hot mb-4 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h4 class="font-display font-bold text-snow text-base">Marcus Rivera</h4>
            <p class="font-body text-snow/40 text-sm">Tech Lead</p>
          </div>
          <div class="flip-back glass p-6 text-center">
            <h4 class="font-display font-bold text-snow text-base mb-2">Marcus Rivera</h4>
            <p class="font-body text-snow/40 text-xs leading-relaxed mb-4">Full-stack architect who loves performance optimization. Open-source contributor. Thinks in systems, builds with precision.</p>
            <div class="flex justify-center gap-3">
              <a href="#" class="w-8 h-8 rounded-full bg-snow/5 flex items-center justify-center hover:bg-indigo-electric/20 transition-colors" onclick="event.stopPropagation()"><svg width="14" height="14" viewBox="0 0 24 24" fill="#F8FAFC"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg></a>
              <a href="#" class="w-8 h-8 rounded-full bg-snow/5 flex items-center justify-center hover:bg-indigo-electric/20 transition-colors" onclick="event.stopPropagation()"><svg width="14" height="14" viewBox="0 0 24 24" fill="#F8FAFC"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
            </div>
          </div>
        </div>
      </div>
      <div class="flip-card h-[320px] fade-up" style="transition-delay:0.2s">
        <div class="flip-inner">
          <div class="flip-front bg-gradient-to-br from-pink-hot/15 to-smoke flex flex-col items-center justify-end p-6">
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-pink-hot via-purple-500 to-indigo-electric mb-4 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h4 class="font-display font-bold text-snow text-base">Yuki Tanaka</h4>
            <p class="font-body text-snow/40 text-sm">Strategy Director</p>
          </div>
          <div class="flip-back glass p-6 text-center">
            <h4 class="font-display font-bold text-snow text-base mb-2">Yuki Tanaka</h4>
            <p class="font-body text-snow/40 text-xs leading-relaxed mb-4">10 years in digital strategy. Bridges the gap between business goals and user needs. Data whisperer and workshop facilitator extraordinaire.</p>
            <div class="flex justify-center gap-3">
              <a href="#" class="w-8 h-8 rounded-full bg-snow/5 flex items-center justify-center hover:bg-pink-hot/20 transition-colors" onclick="event.stopPropagation()"><svg width="14" height="14" viewBox="0 0 24 24" fill="#F8FAFC"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
              <a href="#" class="w-8 h-8 rounded-full bg-snow/5 flex items-center justify-center hover:bg-pink-hot/20 transition-colors" onclick="event.stopPropagation()"><svg width="14" height="14" viewBox="0 0 24 24" fill="#F8FAFC"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===== TESTIMONIAL PULL QUOTE ===== -->
<section class="py-24 px-6 lg:px-12 stripe-bg">
  <div class="max-w-4xl mx-auto text-center">
    <div class="scale-in">
      <svg class="mx-auto mb-8 opacity-20" width="64" height="64" viewBox="0 0 24 24" fill="#4F46E5"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4.017v10H0z"/></svg>
      <blockquote class="font-display font-bold text-3xl md:text-4xl lg:text-5xl leading-tight text-snow mb-8">
        VORTEX didn't just build our website &mdash; they <span class="gradient-text">reimagined</span> our entire digital presence. The results speak for themselves.
      </blockquote>
      <div class="flex items-center justify-center gap-4">
        <div class="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-electric to-pink-hot flex items-center justify-center">
          <span class="font-display font-bold text-snow text-lg">JW</span>
        </div>
        <div class="text-left">
          <p class="font-display font-semibold text-snow">James Wilson</p>
          <p class="font-body text-snow/40 text-sm">CEO, Nebula Finance</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===== CONTACT FORM ===== -->
<section class="py-24 px-6 lg:px-12 gradient-mesh-contact" id="contact">
  <div class="max-w-5xl mx-auto">
    <div class="flex flex-col lg:flex-row gap-16">
      <div class="lg:w-1/2">
        <p class="font-body text-xs font-semibold tracking-[0.25em] uppercase text-pink-hot mb-4 diag-reveal">Get in Touch</p>
        <h2 class="section-title font-display font-extrabold text-4xl md:text-5xl leading-tight mb-6 diag-reveal" style="transition-delay:0.1s">
          Let's build something <span class="gradient-text-reverse">great</span> together
        </h2>
        <p class="font-body text-snow/40 leading-relaxed mb-8 diag-reveal" style="transition-delay:0.2s">
          Have a project in mind? We'd love to hear about it. Drop us a line and we'll get back to you within 24 hours.
        </p>
        <div class="space-y-4 diag-reveal" style="transition-delay:0.3s">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-indigo-electric/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <span class="font-body text-snow/60 text-sm">hello@vortex.agency</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-pink-hot/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <span class="font-body text-snow/60 text-sm">Taipei, Taiwan</span>
          </div>
        </div>
      </div>
      <div class="lg:w-1/2 fade-up" style="transition-delay:0.2s">
        <form class="glass-strong rounded-2xl p-8 space-y-5" onsubmit="event.preventDefault(); submitForm();" id="contactForm">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-body text-snow/40 text-xs mb-2 font-medium">Name</label>
              <input type="text" class="form-input" placeholder="John Doe" required>
            </div>
            <div>
              <label class="block font-body text-snow/40 text-xs mb-2 font-medium">Email</label>
              <input type="email" class="form-input" placeholder="john@company.com" required>
            </div>
          </div>
          <div>
            <label class="block font-body text-snow/40 text-xs mb-2 font-medium">Company</label>
            <input type="text" class="form-input" placeholder="Your Company">
          </div>
          <div>
            <label class="block font-body text-snow/40 text-xs mb-2 font-medium">Budget Range</label>
            <select class="form-input cursor-pointer" style="appearance: none; background-image: url('data:image/svg+xml,%3Csvg width=%2712%27 height=%278%27 viewBox=%270 0 12 8%27 fill=%27none%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M1 1.5L6 6.5L11 1.5%27 stroke=%27%23F8FAFC%27 stroke-width=%271.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: right 1rem center;">
              <option value="" style="background:#1E293B">Select a range</option>
              <option value="10k-25k" style="background:#1E293B">$10K - $25K</option>
              <option value="25k-50k" style="background:#1E293B">$25K - $50K</option>
              <option value="50k-100k" style="background:#1E293B">$50K - $100K</option>
              <option value="100k+" style="background:#1E293B">$100K+</option>
            </select>
          </div>
          <div>
            <label class="block font-body text-snow/40 text-xs mb-2 font-medium">Tell us about your project</label>
            <textarea class="form-input" rows="4" placeholder="Describe your project, goals, and timeline..." required></textarea>
          </div>
          <button type="submit" class="btn-primary w-full py-4 text-base">
            <span>Send Message</span>
          </button>
          <p class="font-body text-snow/20 text-xs text-center">We'll respond within 24 hours. No spam, ever.</p>
        </form>
      </div>
    </div>
  </div>
</section>

<!-- ===== FOOTER ===== -->
<footer class="py-16 px-6 lg:px-12 border-t border-snow/5">
  <div class="max-w-6xl mx-auto">
    <div class="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
      <div>
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-electric to-pink-hot flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/></svg>
          </div>
          <span class="font-display font-bold text-xl text-snow">VORTEX</span>
        </div>
        <p class="font-body text-snow/30 text-sm max-w-xs leading-relaxed">Crafting digital experiences that push boundaries and drive real results.</p>
      </div>
      <div class="flex gap-16">
        <div>
          <h4 class="font-display font-semibold text-snow text-sm mb-4">Agency</h4>
          <div class="space-y-2">
            <a href="#works" class="block font-body text-snow/40 text-sm hover:text-snow transition-colors">Works</a>
            <a href="#services" class="block font-body text-snow/40 text-sm hover:text-snow transition-colors">Services</a>
            <a href="#team" class="block font-body text-snow/40 text-sm hover:text-snow transition-colors">Team</a>
            <a href="#contact" class="block font-body text-snow/40 text-sm hover:text-snow transition-colors">Contact</a>
          </div>
        </div>
        <div>
          <h4 class="font-display font-semibold text-snow text-sm mb-4">Connect</h4>
          <div class="space-y-2">
            <a href="#" class="block font-body text-snow/40 text-sm hover:text-snow transition-colors" onclick="handleAction('Twitter')">Twitter</a>
            <a href="#" class="block font-body text-snow/40 text-sm hover:text-snow transition-colors" onclick="handleAction('Dribbble')">Dribbble</a>
            <a href="#" class="block font-body text-snow/40 text-sm hover:text-snow transition-colors" onclick="handleAction('LinkedIn')">LinkedIn</a>
            <a href="#" class="block font-body text-snow/40 text-sm hover:text-snow transition-colors" onclick="handleAction('GitHub')">GitHub</a>
          </div>
        </div>
      </div>
    </div>
    <div class="border-t border-snow/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="font-body text-snow/20 text-xs">&copy; 2024 VORTEX Agency. All rights reserved.</p>
      <p class="font-body text-snow/20 text-xs">Designed & built with care in Taipei.</p>
    </div>
  </div>
</footer>

<!-- ===== JAVASCRIPT ===== -->
<script>
// ===== TOAST =====
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast-msg glass-strong show';
  setTimeout(function() { t.className = 'toast-msg glass-strong'; }, 3000);
}
function handleAction(a) { showToast(a + ' — This is a template preview'); }

// Initial toast
setTimeout(function() { showToast("Let's build something great together"); }, 2000);

// ===== CURSOR TRAIL =====
var trailDots = [];
var trailMax = 18;
var mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', function(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  spawnTrailDot(e.clientX, e.clientY);
});

function spawnTrailDot(x, y) {
  var dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.style.left = x + 'px';
  dot.style.top = y + 'px';
  dot.style.opacity = '0.6';
  dot.style.transform = 'scale(1)';
  document.getElementById('cursorTrail').appendChild(dot);
  trailDots.push(dot);

  var fadeStart = performance.now();
  function fadeDot(now) {
    var elapsed = now - fadeStart;
    var progress = Math.min(elapsed / 800, 1);
    dot.style.opacity = String(0.6 * (1 - progress));
    dot.style.transform = 'scale(' + (1 - progress * 0.5) + ')';
    if (progress < 1) {
      requestAnimationFrame(fadeDot);
    } else {
      dot.remove();
      var idx = trailDots.indexOf(dot);
      if (idx > -1) trailDots.splice(idx, 1);
    }
  }
  requestAnimationFrame(fadeDot);

  while (trailDots.length > trailMax) {
    var old = trailDots.shift();
    if (old && old.parentNode) old.remove();
  }
}

// ===== NAVIGATION SCROLL =====
var nav = document.getElementById('mainNav');
window.addEventListener('scroll', function() {
  if (window.scrollY > 80) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// ===== INTERSECTION OBSERVER — SCROLL REVEAL =====
var revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.diag-reveal, .fade-up, .scale-in, .split-left, .split-right').forEach(function(el) {
  revealObserver.observe(el);
});

// ===== COUNTER ANIMATION =====
var counterObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(function(el) {
  counterObserver.observe(el);
});

function animateCounter(el) {
  var target = parseInt(el.getAttribute('data-target'));
  var suffix = el.getAttribute('data-suffix') || '';
  var duration = 2000;
  var start = performance.now();

  function update(now) {
    var elapsed = now - start;
    var progress = Math.min(elapsed / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    var current = Math.round(eased * target);
    el.textContent = current + suffix;
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}

// ===== ACCORDION =====
function toggleAccordion(item) {
  var wasOpen = item.classList.contains('open');
  document.querySelectorAll('.accordion-item').forEach(function(ai) {
    ai.classList.remove('open');
  });
  if (!wasOpen) {
    item.classList.add('open');
  }
}

// ===== CASE CARD EXPAND =====
function toggleCaseCard(card) {
  var wasExpanded = card.classList.contains('expanded');
  document.querySelectorAll('.case-card').forEach(function(c) {
    c.classList.remove('expanded');
  });
  if (!wasExpanded) {
    card.classList.add('expanded');
  }
}

// ===== HERO CASE EXPAND =====
function expandHeroCase(index) {
  var cases = ['Nebula Finance', 'Aurelia Beauty', 'Quantum Analytics', 'Pulse Fitness'];
  showToast('Opening case study: ' + cases[index]);
}

// ===== FORM SUBMIT =====
function submitForm() {
  var form = document.getElementById('contactForm');
  var inputs = form.querySelectorAll('input, textarea');
  var allFilled = true;
  inputs.forEach(function(inp) {
    if (inp.required && !inp.value.trim()) {
      allFilled = false;
      inp.style.borderColor = '#EC4899';
      setTimeout(function() { inp.style.borderColor = ''; }, 2000);
    }
  });
  if (allFilled) {
    showToast('Message sent! We will get back to you soon.');
    form.reset();
  } else {
    showToast('Please fill in all required fields.');
  }
}

// ===== SMOOTH SCROLL FOR NAV LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(function(link) {
  link.addEventListener('click', function(e) {
    var target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ===== HERO SCROLL DRAG =====
var heroScroll = document.getElementById('heroScroll');
var isDown = false, startX, scrollLeft;
heroScroll.addEventListener('mousedown', function(e) {
  isDown = true;
  heroScroll.style.cursor = 'grabbing';
  startX = e.pageX - heroScroll.offsetLeft;
  scrollLeft = heroScroll.scrollLeft;
});
heroScroll.addEventListener('mouseleave', function() { isDown = false; heroScroll.style.cursor = ''; });
heroScroll.addEventListener('mouseup', function() { isDown = false; heroScroll.style.cursor = ''; });
heroScroll.addEventListener('mousemove', function(e) {
  if (!isDown) return;
  e.preventDefault();
  var x = e.pageX - heroScroll.offsetLeft;
  var walk = (x - startX) * 1.5;
  heroScroll.scrollLeft = scrollLeft - walk;
});
</script>

</body>
</html>
$HTML$,
  2
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
