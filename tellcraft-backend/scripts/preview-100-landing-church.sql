INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'a9b9acab-f63f-4043-8a5d-43a204280ad4',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>恩典教會 Grace Church</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        royal: { 50:'#f5f0ff', 100:'#ede5ff', 200:'#d4c4ff', 400:'#7c3aed', 500:'#6d28d9', 600:'#5b21b6', 700:'#4c1d95', 800:'#3b1578', 900:'#2e1065' },
        gold: { 50:'#fefce8', 100:'#fef9c3', 200:'#fef08a', 300:'#fde047', 400:'#d4a017', 500:'#b8860b', 600:'#996f09', 700:'#7a5807' },
        cathedral: { 50:'#fef2f2', 100:'#fee2e2', 400:'#b91c1c', 500:'#991b1b', 600:'#7f1d1d' },
        ivory: { 50:'#fefce8', 100:'#fef9e7', 200:'#fdf6d8' },
        wood: { 50:'#f9f3ed', 100:'#f0e4d4', 200:'#e0c9a8', 400:'#8b5e3c', 500:'#6b4226', 600:'#44240e', 700:'#331a0a' }
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        lato: ['Lato', 'sans-serif']
      }
    }
  }
}
</script>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Lato', sans-serif; background: #fefce8; color: #331a0a; overflow-x: hidden; }
.font-cinzel { font-family: 'Cinzel', serif; }

/* ============ KEYFRAMES ============ */
@keyframes stainedGlassGlow {
  0% { filter: hue-rotate(0deg) brightness(1); opacity: 0.7; }
  25% { filter: hue-rotate(15deg) brightness(1.2); opacity: 0.9; }
  50% { filter: hue-rotate(-10deg) brightness(1.4); opacity: 1; }
  75% { filter: hue-rotate(20deg) brightness(1.1); opacity: 0.85; }
  100% { filter: hue-rotate(0deg) brightness(1); opacity: 0.7; }
}

@keyframes candleFlicker {
  0%, 100% { opacity: 1; transform: scale(1) translateY(0); }
  10% { opacity: 0.85; transform: scale(0.97) translateY(-1px); }
  20% { opacity: 1; transform: scale(1.02) translateY(0); }
  30% { opacity: 0.9; transform: scale(0.98) translateY(-0.5px); }
  50% { opacity: 1; transform: scale(1.01) translateY(0); }
  70% { opacity: 0.88; transform: scale(0.99) translateY(-1px); }
  80% { opacity: 1; transform: scale(1); }
}

@keyframes fadeReveal {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes lightBeam {
  0% { transform: rotate(-5deg) scaleY(1); opacity: 0.15; }
  50% { transform: rotate(5deg) scaleY(1.1); opacity: 0.25; }
  100% { transform: rotate(-5deg) scaleY(1); opacity: 0.15; }
}

@keyframes roseSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulseGold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(184,134,11,0.3); }
  50% { box-shadow: 0 0 20px 5px rgba(184,134,11,0.15); }
}

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* ============ SCROLL REVEAL ============ */
.reveal-section {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.reveal-section.revealed {
  opacity: 1;
  transform: translateY(0);
}
.reveal-delay-1 { transition-delay: 0.15s; }
.reveal-delay-2 { transition-delay: 0.3s; }
.reveal-delay-3 { transition-delay: 0.45s; }
.reveal-delay-4 { transition-delay: 0.6s; }

/* ============ NAV ============ */
.nav-glass {
  background: transparent;
  transition: background 0.4s, box-shadow 0.4s, border-color 0.4s;
}
.nav-glass.scrolled {
  background: rgba(46, 16, 101, 0.95);
  box-shadow: 0 2px 20px rgba(76, 29, 149, 0.3);
  backdrop-filter: blur(12px);
}

/* ============ STAINED GLASS ============ */
.stained-glass-glow {
  animation: stainedGlassGlow 8s ease-in-out infinite;
}
.candle-flicker {
  animation: candleFlicker 3s ease-in-out infinite;
}
.light-beam {
  animation: lightBeam 6s ease-in-out infinite;
}
.rose-spin {
  animation: roseSpin 120s linear infinite;
}

/* ============ ARCH CARDS ============ */
.arch-card {
  clip-path: polygon(0 15%, 5% 5%, 15% 1%, 50% 0%, 85% 1%, 95% 5%, 100% 15%, 100% 100%, 0% 100%);
  transition: box-shadow 0.4s ease, border-color 0.4s ease;
}
.arch-card:hover {
  box-shadow: 0 8px 30px rgba(76, 29, 149, 0.15);
  border-color: #b8860b;
}

/* ============ ACCORDION ============ */
.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1), padding 0.4s ease;
  padding: 0 1.5rem;
}
.accordion-content.open {
  max-height: 200px;
  padding: 0 1.5rem 1rem;
}
.accordion-chevron {
  transition: transform 0.3s ease;
}
.accordion-chevron.rotated {
  transform: rotate(180deg);
}

/* ============ HORIZONTAL SCROLL ============ */
.events-scroll {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 1rem;
  scrollbar-width: thin;
  scrollbar-color: #b8860b transparent;
}
.events-scroll::-webkit-scrollbar { height: 6px; }
.events-scroll::-webkit-scrollbar-track { background: transparent; }
.events-scroll::-webkit-scrollbar-thumb { background: #b8860b; border-radius: 3px; }
.events-scroll > div {
  flex: 0 0 320px;
  scroll-snap-align: start;
}

/* ============ TIMELINE ============ */
.timeline-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #b8860b, #4c1d95, #b8860b);
  transform: translateX(-50%);
}

/* ============ MODAL ============ */
.modal-overlay {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.modal-overlay.active {
  opacity: 1;
  pointer-events: auto;
}
.modal-overlay .modal-box {
  transform: scale(0.9) translateY(20px);
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.modal-overlay.active .modal-box {
  transform: scale(1) translateY(0);
}

/* ============ TOAST ============ */
.toast-container {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.toast {
  background: #2e1065;
  color: #fefce8;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  box-shadow: 0 8px 30px rgba(46, 16, 101, 0.4);
  border-left: 3px solid #b8860b;
  transform: translateX(120%);
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  max-width: 320px;
}
.toast.show {
  transform: translateX(0);
}

/* ============ HAMBURGER ============ */
.hamburger span {
  display: block;
  width: 24px;
  height: 2px;
  background: #fefce8;
  transition: all 0.3s;
  border-radius: 2px;
}
.hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.hamburger.open span:nth-child(2) { opacity: 0; }
.hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

.mobile-menu {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.mobile-menu.open {
  max-height: 400px;
}

/* ============ SEPARATOR ============ */
.glass-separator {
  height: 40px;
  background: linear-gradient(90deg,
    transparent 0%, #b8860b33 10%, #4c1d9533 25%, #991b1b33 40%,
    #b8860b55 50%, #991b1b33 60%, #4c1d9533 75%, #b8860b33 90%, transparent 100%
  );
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 40'%3E%3Cpath d='M0,20 Q25,5 50,20 T100,20 T150,20 T200,20' fill='none' stroke='black' stroke-width='8'/%3E%3Ccircle cx='100' cy='20' r='10' fill='black'/%3E%3Ccircle cx='50' cy='20' r='5' fill='black'/%3E%3Ccircle cx='150' cy='20' r='5' fill='black'/%3E%3C/svg%3E");
  mask-size: 100% 100%;
  mask-repeat: no-repeat;
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 40'%3E%3Cpath d='M0,20 Q25,5 50,20 T100,20 T150,20 T200,20' fill='none' stroke='black' stroke-width='8'/%3E%3Ccircle cx='100' cy='20' r='10' fill='black'/%3E%3Ccircle cx='50' cy='20' r='5' fill='black'/%3E%3Ccircle cx='150' cy='20' r='5' fill='black'/%3E%3C/svg%3E");
  -webkit-mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
}

/* ============ MISC ============ */
.gold-shimmer {
  background: linear-gradient(90deg, #b8860b, #d4a017, #fde047, #d4a017, #b8860b);
  background-size: 400% 100%;
  animation: shimmer 4s ease-in-out infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-number {
  animation: pulseGold 3s ease-in-out infinite;
  border-radius: 1rem;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: #b8860b;
  box-shadow: 0 0 0 3px rgba(184,134,11,0.15);
}

@media (max-width: 768px) {
  .desktop-nav { display: none !important; }
  .mobile-toggle { display: flex !important; }
  .hero-grid { grid-template-columns: 1fr !important; text-align: center; }
  .hero-rose { width: 200px !important; height: 200px !important; margin: 0 auto; }
  .about-grid { grid-template-columns: 1fr !important; }
  .timeline-desktop { display: none !important; }
  .timeline-mobile { display: block !important; }
  .events-scroll > div { flex: 0 0 280px; }
  .groups-grid { grid-template-columns: 1fr !important; }
  .footer-grid { grid-template-columns: 1fr !important; text-align: center; }
  .steps-grid { grid-template-columns: 1fr !important; }
  .steps-connector { display: none !important; }
}

@media (min-width: 769px) {
  .mobile-toggle { display: none !important; }
}
</style>
</head>
<body>

<!-- ============ TOAST CONTAINER ============ -->
<div class="toast-container" id="toastContainer"></div>

<!-- ============ NAV ============ -->
<nav id="mainNav" class="nav-glass fixed top-0 left-0 right-0 z-50 border-b border-transparent">
  <div class="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
    <a href="#" class="flex items-center gap-3">
      <!-- Cross SVG -->
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="0" width="8" height="36" rx="1" fill="#b8860b"/>
        <rect x="0" y="8" width="28" height="8" rx="1" fill="#b8860b"/>
        <rect x="11" y="1" width="6" height="34" rx="0.5" fill="#d4a017" opacity="0.5"/>
        <rect x="1" y="9" width="26" height="6" rx="0.5" fill="#d4a017" opacity="0.5"/>
      </svg>
      <div>
        <span class="font-cinzel text-lg font-bold text-ivory-50 tracking-wide">恩典教會</span>
        <span class="block text-[10px] text-gold-400 font-cinzel tracking-widest">GRACE CHURCH</span>
      </div>
    </a>
    <!-- Desktop Nav -->
    <div class="desktop-nav flex items-center gap-8">
      <a onclick="smoothScroll('about')" class="text-sm text-ivory-100 hover:text-gold-400 transition-colors cursor-pointer font-lato">關於我們</a>
      <a onclick="smoothScroll('worship')" class="text-sm text-ivory-100 hover:text-gold-400 transition-colors cursor-pointer font-lato">崇拜時間</a>
      <a onclick="smoothScroll('events')" class="text-sm text-ivory-100 hover:text-gold-400 transition-colors cursor-pointer font-lato">近期活動</a>
      <a onclick="smoothScroll('groups')" class="text-sm text-ivory-100 hover:text-gold-400 transition-colors cursor-pointer font-lato">小組生活</a>
      <a onclick="smoothScroll('newcomer')" class="text-sm text-ivory-100 hover:text-gold-400 transition-colors cursor-pointer font-lato">新朋友</a>
      <button onclick="openModal('offeringModal')" class="bg-gold-500 hover:bg-gold-600 text-ivory-50 px-6 py-2 rounded font-cinzel text-sm tracking-wider transition-colors cursor-pointer border border-gold-400">
        線上奉獻
      </button>
    </div>
    <!-- Mobile Toggle -->
    <button class="mobile-toggle hamburger flex flex-col gap-1.5 cursor-pointer p-2" id="hamburgerBtn" onclick="toggleMobileMenu()">
      <span></span><span></span><span></span>
    </button>
  </div>
  <!-- Mobile Menu -->
  <div class="mobile-menu bg-royal-900/95 backdrop-blur-lg" id="mobileMenu">
    <div class="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3">
      <a onclick="smoothScroll('about');toggleMobileMenu()" class="text-ivory-100 py-2 border-b border-royal-700 cursor-pointer">關於我們</a>
      <a onclick="smoothScroll('worship');toggleMobileMenu()" class="text-ivory-100 py-2 border-b border-royal-700 cursor-pointer">崇拜時間</a>
      <a onclick="smoothScroll('events');toggleMobileMenu()" class="text-ivory-100 py-2 border-b border-royal-700 cursor-pointer">近期活動</a>
      <a onclick="smoothScroll('groups');toggleMobileMenu()" class="text-ivory-100 py-2 border-b border-royal-700 cursor-pointer">小組生活</a>
      <a onclick="smoothScroll('newcomer');toggleMobileMenu()" class="text-ivory-100 py-2 border-b border-royal-700 cursor-pointer">新朋友</a>
      <button onclick="openModal('offeringModal');toggleMobileMenu()" class="bg-gold-500 text-ivory-50 py-2.5 rounded font-cinzel text-sm tracking-wider mt-2 cursor-pointer">線上奉獻</button>
    </div>
  </div>
</nav>

<!-- ============ HERO ============ -->
<section class="relative min-h-screen flex items-center justify-center overflow-hidden" style="background: linear-gradient(135deg, #2e1065 0%, #1a0a3e 30%, #0f0520 60%, #1a0a3e 100%);">
  <!-- Light beams -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="light-beam absolute top-0 left-1/4 w-32 h-full bg-gradient-to-b from-gold-400/20 via-gold-500/5 to-transparent" style="transform-origin: top center;"></div>
    <div class="light-beam absolute top-0 right-1/3 w-24 h-full bg-gradient-to-b from-cathedral-400/15 via-cathedral-500/5 to-transparent" style="transform-origin: top center; animation-delay: -2s;"></div>
    <div class="light-beam absolute top-0 left-1/2 w-20 h-full bg-gradient-to-b from-royal-400/10 via-royal-500/5 to-transparent" style="transform-origin: top center; animation-delay: -4s;"></div>
  </div>

  <div class="relative z-10 max-w-7xl mx-auto px-6 py-32 grid grid-cols-2 gap-16 items-center hero-grid">
    <!-- Left: Text -->
    <div>
      <div class="flex items-center gap-2 mb-6">
        <!-- Dove SVG -->
        <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8,18 Q4,14 2,8 Q4,6 8,7 Q6,4 8,2 Q12,4 12,8 Q14,4 18,3 Q20,5 18,9 Q22,6 26,6 Q28,9 24,14 Q20,18 14,20 Q10,20 8,18 Z" fill="#b8860b" opacity="0.9"/>
          <path d="M14,20 Q16,22 20,22 Q18,20 16,18" fill="#d4a017" opacity="0.7"/>
          <circle cx="10" cy="8" r="1" fill="#2e1065"/>
        </svg>
        <span class="text-gold-400 font-cinzel text-sm tracking-widest uppercase">歡迎回家</span>
      </div>
      <h1 class="font-cinzel text-5xl md:text-6xl lg:text-7xl font-bold text-ivory-50 leading-tight mb-6">
        在恩典中<br><span class="gold-shimmer">找到愛與盼望</span>
      </h1>
      <p class="text-ivory-200/80 text-lg leading-relaxed mb-10 max-w-lg font-lato">
        恩典教會是一個充滿溫暖與愛的大家庭。無論你是否有信仰背景，我們都歡迎你來這裡，一起經歷上帝的美好。
      </p>
      <div class="flex flex-wrap gap-4">
        <button onclick="smoothScroll('worship')" class="bg-gold-500 hover:bg-gold-600 text-ivory-50 px-8 py-3.5 rounded font-cinzel tracking-wider transition-colors cursor-pointer border border-gold-400 text-sm">
          主日崇拜資訊
        </button>
        <button onclick="smoothScroll('newcomer')" class="border border-ivory-100/30 text-ivory-100 hover:border-gold-400 hover:text-gold-400 px-8 py-3.5 rounded font-cinzel tracking-wider transition-colors cursor-pointer text-sm">
          我是新朋友
        </button>
      </div>
    </div>
    <!-- Right: Rose Window SVG -->
    <div class="flex items-center justify-center">
      <div class="hero-rose relative" style="width:380px;height:380px;">
        <!-- Outer glow -->
        <div class="absolute inset-0 rounded-full stained-glass-glow" style="background: radial-gradient(circle, rgba(184,134,11,0.2) 0%, rgba(76,29,149,0.15) 40%, transparent 70%); filter: blur(30px);"></div>
        <!-- Rose Window -->
        <svg viewBox="0 0 400 400" class="w-full h-full rose-spin" xmlns="http://www.w3.org/2000/svg">
          <!-- Outer ring -->
          <circle cx="200" cy="200" r="190" fill="none" stroke="#b8860b" stroke-width="3" opacity="0.8"/>
          <circle cx="200" cy="200" r="180" fill="none" stroke="#4c1d95" stroke-width="1.5" opacity="0.6"/>
          <!-- Petal pattern (8 petals) -->
          <g opacity="0.7">
            <ellipse cx="200" cy="100" rx="35" ry="60" fill="#991b1b" opacity="0.5" transform="rotate(0,200,200)"/>
            <ellipse cx="200" cy="100" rx="35" ry="60" fill="#4c1d95" opacity="0.5" transform="rotate(45,200,200)"/>
            <ellipse cx="200" cy="100" rx="35" ry="60" fill="#b8860b" opacity="0.5" transform="rotate(90,200,200)"/>
            <ellipse cx="200" cy="100" rx="35" ry="60" fill="#991b1b" opacity="0.5" transform="rotate(135,200,200)"/>
            <ellipse cx="200" cy="100" rx="35" ry="60" fill="#4c1d95" opacity="0.5" transform="rotate(180,200,200)"/>
            <ellipse cx="200" cy="100" rx="35" ry="60" fill="#b8860b" opacity="0.5" transform="rotate(225,200,200)"/>
            <ellipse cx="200" cy="100" rx="35" ry="60" fill="#991b1b" opacity="0.5" transform="rotate(270,200,200)"/>
            <ellipse cx="200" cy="100" rx="35" ry="60" fill="#4c1d95" opacity="0.5" transform="rotate(315,200,200)"/>
          </g>
          <!-- Inner petals (smaller) -->
          <g opacity="0.6">
            <ellipse cx="200" cy="130" rx="22" ry="40" fill="#d4a017" opacity="0.6" transform="rotate(22.5,200,200)"/>
            <ellipse cx="200" cy="130" rx="22" ry="40" fill="#fde047" opacity="0.4" transform="rotate(67.5,200,200)"/>
            <ellipse cx="200" cy="130" rx="22" ry="40" fill="#d4a017" opacity="0.6" transform="rotate(112.5,200,200)"/>
            <ellipse cx="200" cy="130" rx="22" ry="40" fill="#fde047" opacity="0.4" transform="rotate(157.5,200,200)"/>
            <ellipse cx="200" cy="130" rx="22" ry="40" fill="#d4a017" opacity="0.6" transform="rotate(202.5,200,200)"/>
            <ellipse cx="200" cy="130" rx="22" ry="40" fill="#fde047" opacity="0.4" transform="rotate(247.5,200,200)"/>
            <ellipse cx="200" cy="130" rx="22" ry="40" fill="#d4a017" opacity="0.6" transform="rotate(292.5,200,200)"/>
            <ellipse cx="200" cy="130" rx="22" ry="40" fill="#fde047" opacity="0.4" transform="rotate(337.5,200,200)"/>
          </g>
          <!-- Decorative rings -->
          <circle cx="200" cy="200" r="140" fill="none" stroke="#b8860b" stroke-width="1" opacity="0.4"/>
          <circle cx="200" cy="200" r="95" fill="none" stroke="#d4a017" stroke-width="1.5" opacity="0.5"/>
          <circle cx="200" cy="200" r="55" fill="none" stroke="#b8860b" stroke-width="2" opacity="0.6"/>
          <!-- Center cross -->
          <rect x="195" y="175" width="10" height="50" rx="2" fill="#b8860b" opacity="0.9"/>
          <rect x="182" y="185" width="36" height="10" rx="2" fill="#b8860b" opacity="0.9"/>
          <!-- 8 outer diamonds -->
          <g opacity="0.5">
            <polygon points="200,20 210,40 200,60 190,40" fill="#b8860b" transform="rotate(0,200,200)"/>
            <polygon points="200,20 210,40 200,60 190,40" fill="#991b1b" transform="rotate(45,200,200)"/>
            <polygon points="200,20 210,40 200,60 190,40" fill="#b8860b" transform="rotate(90,200,200)"/>
            <polygon points="200,20 210,40 200,60 190,40" fill="#991b1b" transform="rotate(135,200,200)"/>
            <polygon points="200,20 210,40 200,60 190,40" fill="#b8860b" transform="rotate(180,200,200)"/>
            <polygon points="200,20 210,40 200,60 190,40" fill="#991b1b" transform="rotate(225,200,200)"/>
            <polygon points="200,20 210,40 200,60 190,40" fill="#b8860b" transform="rotate(270,200,200)"/>
            <polygon points="200,20 210,40 200,60 190,40" fill="#991b1b" transform="rotate(315,200,200)"/>
          </g>
          <!-- Small circle accents around center -->
          <circle cx="200" cy="155" r="6" fill="#991b1b" opacity="0.7"/>
          <circle cx="245" cy="200" r="6" fill="#b8860b" opacity="0.7"/>
          <circle cx="200" cy="245" r="6" fill="#991b1b" opacity="0.7"/>
          <circle cx="155" cy="200" r="6" fill="#b8860b" opacity="0.7"/>
          <!-- Trefoil arches between petals -->
          <g opacity="0.3" fill="none" stroke="#d4a017" stroke-width="1">
            <path d="M200,60 Q220,80 200,95 Q180,80 200,60"/>
            <path d="M340,200 Q320,220 305,200 Q320,180 340,200" transform="rotate(0,200,200)"/>
            <path d="M340,200 Q320,220 305,200 Q320,180 340,200" transform="rotate(90,200,200)"/>
            <path d="M340,200 Q320,220 305,200 Q320,180 340,200" transform="rotate(180,200,200)"/>
            <path d="M340,200 Q320,220 305,200 Q320,180 340,200" transform="rotate(270,200,200)"/>
          </g>
        </svg>
        <!-- Stained glass color overlay that pulses -->
        <div class="absolute inset-0 rounded-full stained-glass-glow pointer-events-none" style="background: radial-gradient(circle at 30% 30%, rgba(153,27,27,0.15), transparent 50%), radial-gradient(circle at 70% 70%, rgba(76,29,149,0.15), transparent 50%);"></div>
      </div>
    </div>
  </div>

  <!-- Scroll indicator -->
  <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
    <span class="text-gold-400/60 text-xs font-cinzel tracking-widest">SCROLL</span>
    <div class="w-px h-8 bg-gradient-to-b from-gold-400/60 to-transparent"></div>
  </div>
</section>

<!-- ============ GLASS SEPARATOR ============ -->
<div class="glass-separator"></div>

<!-- ============ ABOUT (60/40 Asymmetric) ============ -->
<section id="about" class="py-24 bg-ivory-50">
  <div class="max-w-7xl mx-auto px-6 reveal-section">
    <div class="grid grid-cols-5 gap-12 items-center about-grid">
      <!-- Left 60% text -->
      <div class="col-span-3">
        <div class="flex items-center gap-3 mb-4">
          <!-- Bible SVG -->
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="2" width="22" height="24" rx="2" fill="#44240e"/>
            <rect x="5" y="3" width="18" height="22" rx="1" fill="#6b4226"/>
            <rect x="12" y="5" width="4" height="18" rx="0.5" fill="#b8860b" opacity="0.8"/>
            <rect x="7" y="12" width="14" height="4" rx="0.5" fill="#b8860b" opacity="0.8"/>
            <path d="M5,3 Q14,5 14,14 Q14,5 23,3" fill="none" stroke="#d4a017" stroke-width="0.5" opacity="0.5"/>
          </svg>
          <span class="text-gold-500 font-cinzel text-sm tracking-widest uppercase">Our Story</span>
        </div>
        <h2 class="font-cinzel text-4xl font-bold text-wood-700 mb-6">關於恩典教會</h2>
        <p class="text-wood-500 leading-relaxed mb-4 text-lg font-lato">
          恩典教會成立於 1991 年，從一間只有 20 人的家庭聚會，到今天成為擁有 800+ 位會友的溫馨教會。我們的異象是「用恩典連結生命，用愛改變社區」。
        </p>
        <p class="text-wood-400 leading-relaxed mb-8 font-lato">
          我們相信每一個人都是上帝獨特的傑作，無論你的背景如何，都能在這裡找到歸屬感。教會不只是週日的聚會，更是生活中彼此扶持的大家庭。
        </p>
        <div class="flex flex-wrap gap-6">
          <div class="flex items-center gap-3 bg-ivory-100 rounded-lg px-5 py-3 border border-gold-200/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#b8860b" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="#b8860b"/><path d="M12,2 L12,7 M12,17 L12,22 M2,12 L7,12 M17,12 L22,12" stroke="#b8860b" stroke-width="1" opacity="0.5"/></svg>
            <div><div class="text-xs font-cinzel text-gold-600 font-bold">異象</div><div class="text-xs text-wood-400">用愛改變社區</div></div>
          </div>
          <div class="flex items-center gap-3 bg-ivory-100 rounded-lg px-5 py-3 border border-gold-200/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1" stroke="#b8860b" stroke-width="1.5"/><path d="M8,7 L16,7 M8,11 L16,11 M8,15 L13,15" stroke="#b8860b" stroke-width="1" opacity="0.6"/></svg>
            <div><div class="text-xs font-cinzel text-gold-600 font-bold">使命</div><div class="text-xs text-wood-400">裝備門徒</div></div>
          </div>
          <div class="flex items-center gap-3 bg-ivory-100 rounded-lg px-5 py-3 border border-gold-200/30">
            <!-- Heart SVG -->
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12,21 L3,12 Q0,8 3,5 Q6,2 9,5 L12,8 L15,5 Q18,2 21,5 Q24,8 21,12 Z" fill="#991b1b" opacity="0.8"/><path d="M12,21 L3,12 Q0,8 3,5 Q6,2 9,5 L12,8 L15,5 Q18,2 21,5 Q24,8 21,12 Z" fill="none" stroke="#b8860b" stroke-width="0.5"/></svg>
            <div><div class="text-xs font-cinzel text-gold-600 font-bold">核心</div><div class="text-xs text-wood-400">恩典與真理</div></div>
          </div>
        </div>
      </div>
      <!-- Right 40% stats -->
      <div class="col-span-2 space-y-6">
        <div class="stat-number bg-royal-900 rounded-2xl p-6 text-center border border-royal-700">
          <div class="font-cinzel text-5xl font-bold gold-shimmer">35</div>
          <div class="text-ivory-200/70 text-sm mt-1 font-lato">年歷史</div>
        </div>
        <div class="stat-number bg-royal-900 rounded-2xl p-6 text-center border border-royal-700" style="animation-delay: 0.5s;">
          <div class="font-cinzel text-5xl font-bold gold-shimmer">800+</div>
          <div class="text-ivory-200/70 text-sm mt-1 font-lato">會友人數</div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="stat-number bg-royal-900 rounded-xl p-4 text-center border border-royal-700" style="animation-delay: 1s;">
            <div class="font-cinzel text-3xl font-bold gold-shimmer">12</div>
            <div class="text-ivory-200/70 text-xs mt-1 font-lato">小組數目</div>
          </div>
          <div class="stat-number bg-royal-900 rounded-xl p-4 text-center border border-royal-700" style="animation-delay: 1.5s;">
            <div class="font-cinzel text-3xl font-bold gold-shimmer">3</div>
            <div class="text-ivory-200/70 text-xs mt-1 font-lato">堂崇拜</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ GLASS SEPARATOR ============ -->
<div class="glass-separator"></div>

<!-- ============ WORSHIP TIMES (Timeline) ============ -->
<section id="worship" class="py-24" style="background: linear-gradient(180deg, #2e1065 0%, #1a0a3e 100%);">
  <div class="max-w-5xl mx-auto px-6 reveal-section">
    <div class="text-center mb-16">
      <!-- Candle SVG -->
      <div class="inline-block mb-4">
        <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="candle-flicker">
          <ellipse cx="16" cy="10" rx="5" ry="8" fill="#fde047" opacity="0.9"/>
          <ellipse cx="16" cy="10" rx="3" ry="5" fill="#fff" opacity="0.6"/>
          <rect x="14" y="16" width="4" height="2" fill="#d4a017"/>
          <rect x="10" y="18" width="12" height="26" rx="2" fill="#fef9e7"/>
          <rect x="10" y="18" width="12" height="26" rx="2" stroke="#d4a017" stroke-width="0.5" fill="none"/>
          <ellipse cx="16" cy="44" rx="6" ry="2" fill="#d4a017" opacity="0.3"/>
        </svg>
      </div>
      <h2 class="font-cinzel text-4xl font-bold text-ivory-50 mb-3">主日崇拜</h2>
      <p class="text-ivory-200/60 font-lato">每個主日，與我們一起在敬拜中經歷神的同在</p>
    </div>

    <!-- Desktop Timeline -->
    <div class="relative timeline-desktop">
      <div class="timeline-line"></div>
      <!-- Service 1 - Left -->
      <div class="grid grid-cols-2 gap-12 mb-16 reveal-section reveal-delay-1">
        <div class="text-right pr-12">
          <div class="inline-flex items-center gap-2 mb-2">
            <svg width="20" height="28" viewBox="0 0 20 28" fill="none" class="candle-flicker" style="animation-delay:-0.5s">
              <ellipse cx="10" cy="5" rx="3" ry="5" fill="#fde047" opacity="0.9"/>
              <ellipse cx="10" cy="5" rx="2" ry="3" fill="#fff" opacity="0.5"/>
              <rect x="8" y="9" width="4" height="1.5" fill="#d4a017"/>
              <rect x="6" y="10.5" width="8" height="15" rx="1.5" fill="#fef9e7"/>
              <rect x="6" y="10.5" width="8" height="15" rx="1.5" stroke="#d4a017" stroke-width="0.3" fill="none"/>
            </svg>
            <span class="font-cinzel text-gold-400 text-2xl font-bold">09:00</span>
          </div>
          <h3 class="font-cinzel text-xl font-bold text-ivory-50 mb-1">第一堂 華語崇拜</h3>
          <p class="text-ivory-200/60 text-sm font-lato">兒童主日學同步進行</p>
          <p class="text-ivory-200/40 text-xs mt-2 font-lato">講員：王牧師 | 約 90 分鐘</p>
        </div>
        <div></div>
      </div>
      <!-- Service 2 - Right -->
      <div class="grid grid-cols-2 gap-12 mb-16 reveal-section reveal-delay-2">
        <div></div>
        <div class="pl-12">
          <div class="inline-flex items-center gap-2 mb-2">
            <span class="font-cinzel text-gold-400 text-2xl font-bold">11:00</span>
            <svg width="20" height="28" viewBox="0 0 20 28" fill="none" class="candle-flicker" style="animation-delay:-1s">
              <ellipse cx="10" cy="5" rx="3" ry="5" fill="#fde047" opacity="0.9"/>
              <ellipse cx="10" cy="5" rx="2" ry="3" fill="#fff" opacity="0.5"/>
              <rect x="8" y="9" width="4" height="1.5" fill="#d4a017"/>
              <rect x="6" y="10.5" width="8" height="15" rx="1.5" fill="#fef9e7"/>
              <rect x="6" y="10.5" width="8" height="15" rx="1.5" stroke="#d4a017" stroke-width="0.3" fill="none"/>
            </svg>
          </div>
          <h3 class="font-cinzel text-xl font-bold text-ivory-50 mb-1">第二堂 青年崇拜</h3>
          <p class="text-ivory-200/60 text-sm font-lato">現代敬拜團帶領</p>
          <p class="text-ivory-200/40 text-xs mt-2 font-lato">講員：李傳道 | 約 90 分鐘</p>
        </div>
      </div>
      <!-- Service 3 - Left -->
      <div class="grid grid-cols-2 gap-12 reveal-section reveal-delay-3">
        <div class="text-right pr-12">
          <div class="inline-flex items-center gap-2 mb-2">
            <svg width="20" height="28" viewBox="0 0 20 28" fill="none" class="candle-flicker" style="animation-delay:-1.5s">
              <ellipse cx="10" cy="5" rx="3" ry="5" fill="#fde047" opacity="0.9"/>
              <ellipse cx="10" cy="5" rx="2" ry="3" fill="#fff" opacity="0.5"/>
              <rect x="8" y="9" width="4" height="1.5" fill="#d4a017"/>
              <rect x="6" y="10.5" width="8" height="15" rx="1.5" fill="#fef9e7"/>
              <rect x="6" y="10.5" width="8" height="15" rx="1.5" stroke="#d4a017" stroke-width="0.3" fill="none"/>
            </svg>
            <span class="font-cinzel text-gold-400 text-2xl font-bold">19:00</span>
          </div>
          <h3 class="font-cinzel text-xl font-bold text-ivory-50 mb-1">晚間 英語崇拜</h3>
          <p class="text-ivory-200/60 text-sm font-lato">International Ministry</p>
          <p class="text-ivory-200/40 text-xs mt-2 font-lato">Speaker: Pastor John | ~75 min</p>
        </div>
        <div></div>
      </div>
    </div>

    <!-- Mobile Timeline -->
    <div class="timeline-mobile hidden space-y-8">
      <div class="flex gap-4 items-start reveal-section">
        <div class="flex-shrink-0 w-16 text-center">
          <svg width="20" height="28" viewBox="0 0 20 28" fill="none" class="candle-flicker mx-auto mb-1">
            <ellipse cx="10" cy="5" rx="3" ry="5" fill="#fde047" opacity="0.9"/><ellipse cx="10" cy="5" rx="2" ry="3" fill="#fff" opacity="0.5"/>
            <rect x="8" y="9" width="4" height="1.5" fill="#d4a017"/><rect x="6" y="10.5" width="8" height="15" rx="1.5" fill="#fef9e7"/>
          </svg>
          <span class="font-cinzel text-gold-400 font-bold text-sm">09:00</span>
        </div>
        <div class="border-l-2 border-gold-500/30 pl-4">
          <h3 class="font-cinzel text-lg font-bold text-ivory-50">第一堂 華語崇拜</h3>
          <p class="text-ivory-200/60 text-sm">兒童主日學同步 | 王牧師 | 約 90 分鐘</p>
        </div>
      </div>
      <div class="flex gap-4 items-start reveal-section">
        <div class="flex-shrink-0 w-16 text-center">
          <svg width="20" height="28" viewBox="0 0 20 28" fill="none" class="candle-flicker mx-auto mb-1" style="animation-delay:-1s">
            <ellipse cx="10" cy="5" rx="3" ry="5" fill="#fde047" opacity="0.9"/><ellipse cx="10" cy="5" rx="2" ry="3" fill="#fff" opacity="0.5"/>
            <rect x="8" y="9" width="4" height="1.5" fill="#d4a017"/><rect x="6" y="10.5" width="8" height="15" rx="1.5" fill="#fef9e7"/>
          </svg>
          <span class="font-cinzel text-gold-400 font-bold text-sm">11:00</span>
        </div>
        <div class="border-l-2 border-gold-500/30 pl-4">
          <h3 class="font-cinzel text-lg font-bold text-ivory-50">第二堂 青年崇拜</h3>
          <p class="text-ivory-200/60 text-sm">敬拜團帶領 | 李傳道 | 約 90 分鐘</p>
        </div>
      </div>
      <div class="flex gap-4 items-start reveal-section">
        <div class="flex-shrink-0 w-16 text-center">
          <svg width="20" height="28" viewBox="0 0 20 28" fill="none" class="candle-flicker mx-auto mb-1" style="animation-delay:-1.5s">
            <ellipse cx="10" cy="5" rx="3" ry="5" fill="#fde047" opacity="0.9"/><ellipse cx="10" cy="5" rx="2" ry="3" fill="#fff" opacity="0.5"/>
            <rect x="8" y="9" width="4" height="1.5" fill="#d4a017"/><rect x="6" y="10.5" width="8" height="15" rx="1.5" fill="#fef9e7"/>
          </svg>
          <span class="font-cinzel text-gold-400 font-bold text-sm">19:00</span>
        </div>
        <div class="border-l-2 border-gold-500/30 pl-4">
          <h3 class="font-cinzel text-lg font-bold text-ivory-50">晚間 英語崇拜</h3>
          <p class="text-ivory-200/60 text-sm">International | Pastor John | ~75 min</p>
        </div>
      </div>
    </div>

    <div class="mt-12 text-center reveal-section">
      <div class="inline-flex items-center gap-2 bg-royal-800/50 rounded-lg px-5 py-3 border border-royal-600/30">
        <!-- Music Note SVG -->
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M7,16 L7,4 L17,2 L17,14" stroke="#b8860b" stroke-width="1.5" fill="none"/>
          <circle cx="5" cy="16" r="3" fill="#b8860b" opacity="0.8"/>
          <circle cx="15" cy="14" r="3" fill="#b8860b" opacity="0.8"/>
          <path d="M7,6 L17,4" stroke="#d4a017" stroke-width="0.5"/>
        </svg>
        <span class="text-ivory-200/70 text-sm font-lato">無法親臨？我們提供<a class="text-gold-400 font-bold cursor-pointer hover:text-gold-300 transition-colors">線上直播</a>，每堂崇拜同步播出</span>
      </div>
    </div>
  </div>
</section>

<!-- ============ GLASS SEPARATOR ============ -->
<div class="glass-separator"></div>

<!-- ============ EVENTS (Horizontal Scroll + Arch Cards) ============ -->
<section id="events" class="py-24 bg-ivory-50">
  <div class="max-w-7xl mx-auto px-6 reveal-section">
    <div class="flex items-center justify-between mb-12">
      <div>
        <span class="text-gold-500 font-cinzel text-sm tracking-widest uppercase block mb-2">Upcoming</span>
        <h2 class="font-cinzel text-4xl font-bold text-wood-700">近期活動</h2>
      </div>
      <a class="text-gold-600 font-cinzel text-sm tracking-wider cursor-pointer hover:text-gold-500 transition-colors">查看全部 &rarr;</a>
    </div>

    <div class="events-scroll">
      <!-- Event Card 1 -->
      <div class="arch-card bg-white border border-gold-200/30 rounded-b-xl pt-12 pb-6 px-6 reveal-section reveal-delay-1">
        <div class="w-full h-2 bg-gradient-to-r from-cathedral-500 via-gold-500 to-royal-700 rounded-full mb-4"></div>
        <div class="text-xs text-gold-600 font-cinzel tracking-wider mb-2">2/22（六）14:00</div>
        <h3 class="font-cinzel text-lg font-bold text-wood-700 mb-2">春季福音茶會</h3>
        <p class="text-wood-400 text-sm font-lato mb-4 leading-relaxed">歡迎帶朋友一起來！有茶點、音樂和見證分享，在溫馨的氛圍中認識信仰。</p>
        <div class="flex items-center gap-3 text-xs text-wood-400/70 mb-4">
          <!-- Map Pin SVG -->
          <span class="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7,1 Q11,1 11,5 Q11,9 7,13 Q3,9 3,5 Q3,1 7,1 Z" stroke="#b8860b" stroke-width="1" fill="none"/><circle cx="7" cy="5" r="1.5" fill="#b8860b"/></svg>
            副堂
          </span>
          <span>|</span>
          <span>限額 80 人</span>
        </div>
        <button onclick="openEventModal('春季福音茶會 2/22（六）14:00')" class="w-full bg-royal-700 hover:bg-royal-800 text-ivory-50 py-2.5 rounded font-cinzel text-sm tracking-wider transition-colors cursor-pointer">
          立即報名
        </button>
      </div>

      <!-- Event Card 2 -->
      <div class="arch-card bg-white border border-gold-200/30 rounded-b-xl pt-12 pb-6 px-6 reveal-section reveal-delay-2">
        <div class="w-full h-2 bg-gradient-to-r from-gold-500 via-cathedral-500 to-royal-700 rounded-full mb-4"></div>
        <div class="text-xs text-gold-600 font-cinzel tracking-wider mb-2">3/01（六）09:00</div>
        <h3 class="font-cinzel text-lg font-bold text-wood-700 mb-2">社區愛心送餐</h3>
        <p class="text-wood-400 text-sm font-lato mb-4 leading-relaxed">為社區獨居長者準備愛心便當，用行動實踐愛鄰如己的誡命。</p>
        <div class="flex items-center gap-3 text-xs text-wood-400/70 mb-4">
          <span class="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7,1 Q11,1 11,5 Q11,9 7,13 Q3,9 3,5 Q3,1 7,1 Z" stroke="#b8860b" stroke-width="1" fill="none"/><circle cx="7" cy="5" r="1.5" fill="#b8860b"/></svg>
            教會廚房
          </span>
          <span>|</span>
          <span>需 20 位志工</span>
        </div>
        <button onclick="openEventModal('社區愛心送餐 3/01（六）09:00')" class="w-full bg-royal-700 hover:bg-royal-800 text-ivory-50 py-2.5 rounded font-cinzel text-sm tracking-wider transition-colors cursor-pointer">
          我要參加
        </button>
      </div>

      <!-- Event Card 3 -->
      <div class="arch-card bg-white border border-gold-200/30 rounded-b-xl pt-12 pb-6 px-6 reveal-section reveal-delay-3">
        <div class="w-full h-2 bg-gradient-to-r from-royal-700 via-gold-500 to-cathedral-500 rounded-full mb-4"></div>
        <div class="text-xs text-gold-600 font-cinzel tracking-wider mb-2">3/08 - 3/09</div>
        <h3 class="font-cinzel text-lg font-bold text-wood-700 mb-2">青年退修會</h3>
        <p class="text-wood-400 text-sm font-lato mb-4 leading-relaxed">兩天一夜，在自然中安靜、敬拜、團契。遠離城市喧囂，聆聽上帝的聲音。</p>
        <div class="flex items-center gap-3 text-xs text-wood-400/70 mb-4">
          <span class="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7,1 Q11,1 11,5 Q11,9 7,13 Q3,9 3,5 Q3,1 7,1 Z" stroke="#b8860b" stroke-width="1" fill="none"/><circle cx="7" cy="5" r="1.5" fill="#b8860b"/></svg>
            石碇靈修中心
          </span>
          <span>|</span>
          <span>$800/人</span>
        </div>
        <button onclick="openEventModal('青年退修會 3/08-09')" class="w-full bg-royal-700 hover:bg-royal-800 text-ivory-50 py-2.5 rounded font-cinzel text-sm tracking-wider transition-colors cursor-pointer">
          了解詳情
        </button>
      </div>

      <!-- Event Card 4 -->
      <div class="arch-card bg-white border border-gold-200/30 rounded-b-xl pt-12 pb-6 px-6 reveal-section reveal-delay-4">
        <div class="w-full h-2 bg-gradient-to-r from-cathedral-500 via-royal-700 to-gold-500 rounded-full mb-4"></div>
        <div class="text-xs text-gold-600 font-cinzel tracking-wider mb-2">3/15（六）15:00</div>
        <h3 class="font-cinzel text-lg font-bold text-wood-700 mb-2">詩班音樂會</h3>
        <p class="text-wood-400 text-sm font-lato mb-4 leading-relaxed">恩典詩班年度音樂獻演，古典聖詩與現代敬拜的美好交融。</p>
        <div class="flex items-center gap-3 text-xs text-wood-400/70 mb-4">
          <span class="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7,1 Q11,1 11,5 Q11,9 7,13 Q3,9 3,5 Q3,1 7,1 Z" stroke="#b8860b" stroke-width="1" fill="none"/><circle cx="7" cy="5" r="1.5" fill="#b8860b"/></svg>
            主堂
          </span>
          <span>|</span>
          <span>自由入場</span>
        </div>
        <button onclick="openEventModal('詩班音樂會 3/15（六）15:00')" class="w-full bg-royal-700 hover:bg-royal-800 text-ivory-50 py-2.5 rounded font-cinzel text-sm tracking-wider transition-colors cursor-pointer">
          立即報名
        </button>
      </div>
    </div>
  </div>
</section>

<!-- ============ GROUPS (Accordion) ============ -->
<section id="groups" class="py-24" style="background: linear-gradient(180deg, #44240e 0%, #331a0a 100%);">
  <div class="max-w-5xl mx-auto px-6 reveal-section">
    <div class="text-center mb-16">
      <!-- Heart SVG -->
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" class="mx-auto mb-4">
        <path d="M18,32 L4,18 Q0,12 4,7 Q8,2 13,7 L18,12 L23,7 Q28,2 32,7 Q36,12 32,18 Z" fill="#991b1b" opacity="0.7"/>
        <path d="M18,32 L4,18 Q0,12 4,7 Q8,2 13,7 L18,12 L23,7 Q28,2 32,7 Q36,12 32,18 Z" fill="none" stroke="#b8860b" stroke-width="1"/>
        <path d="M18,28 L7,18 Q4,13 7,10 Q10,7 13,10 L18,15 L23,10 Q26,7 29,10 Q32,13 29,18 Z" fill="#b8860b" opacity="0.3"/>
      </svg>
      <h2 class="font-cinzel text-4xl font-bold text-ivory-50 mb-3">小組生活</h2>
      <p class="text-ivory-200/60 font-lato">教會不只是週日，更是一週七天的彼此關懷</p>
    </div>

    <div class="groups-grid grid grid-cols-2 gap-6">
      <!-- Group 1 -->
      <div class="bg-wood-600/30 border border-gold-500/20 rounded-xl overflow-hidden reveal-section reveal-delay-1">
        <button onclick="toggleGroup(this)" class="w-full flex items-center gap-4 p-5 text-left cursor-pointer hover:bg-wood-600/20 transition-colors">
          <div class="w-12 h-12 rounded-full bg-royal-700/50 flex items-center justify-center flex-shrink-0 border border-gold-500/30">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="6" r="4" stroke="#b8860b" stroke-width="1.2" fill="none"/>
              <path d="M2,18 Q2,12 10,12 Q18,12 18,18" stroke="#b8860b" stroke-width="1.2" fill="none"/>
              <circle cx="16" cy="5" r="2.5" stroke="#d4a017" stroke-width="0.8" fill="none"/>
              <circle cx="4" cy="5" r="2.5" stroke="#d4a017" stroke-width="0.8" fill="none"/>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="font-cinzel text-lg font-bold text-ivory-50">家庭小組</h3>
            <p class="text-ivory-200/50 text-sm font-lato">週三 19:30 | 已婚夫妻及家庭 | 4 組</p>
          </div>
          <svg class="accordion-chevron flex-shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5,8 L10,13 L15,8" stroke="#b8860b" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
        </button>
        <div class="accordion-content text-ivory-200/70 text-sm font-lato leading-relaxed">
          家庭小組是已婚夫妻和有孩子的家庭一起成長的空間。我們分享育兒心得、婚姻經營的智慧，並在禱告中彼此扶持。每月一次的家庭聚餐是孩子們最期待的時光。
        </div>
      </div>

      <!-- Group 2 -->
      <div class="bg-wood-600/30 border border-gold-500/20 rounded-xl overflow-hidden reveal-section reveal-delay-2">
        <button onclick="toggleGroup(this)" class="w-full flex items-center gap-4 p-5 text-left cursor-pointer hover:bg-wood-600/20 transition-colors">
          <div class="w-12 h-12 rounded-full bg-royal-700/50 flex items-center justify-center flex-shrink-0 border border-gold-500/30">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="4" stroke="#b8860b" stroke-width="1.2" fill="none"/>
              <path d="M3,18 Q3,12 10,12 Q17,12 17,18" stroke="#b8860b" stroke-width="1.2" fill="none"/>
              <path d="M8,4 L12,4" stroke="#d4a017" stroke-width="1"/>
              <path d="M7,6 L13,6" stroke="#d4a017" stroke-width="0.5"/>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="font-cinzel text-lg font-bold text-ivory-50">青年小組</h3>
            <p class="text-ivory-200/50 text-sm font-lato">週五 19:00 | 18-35 歲 | 3 組</p>
          </div>
          <svg class="accordion-chevron flex-shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5,8 L10,13 L15,8" stroke="#b8860b" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
        </button>
        <div class="accordion-content text-ivory-200/70 text-sm font-lato leading-relaxed">
          青年小組充滿活力與創意！我們一起查經、討論信仰與生活的交匯、定期舉辦運動日和外出活動。無論你是大學生還是職場新鮮人，都能在這裡找到同行的夥伴。
        </div>
      </div>

      <!-- Group 3 -->
      <div class="bg-wood-600/30 border border-gold-500/20 rounded-xl overflow-hidden reveal-section reveal-delay-3">
        <button onclick="toggleGroup(this)" class="w-full flex items-center gap-4 p-5 text-left cursor-pointer hover:bg-wood-600/20 transition-colors">
          <div class="w-12 h-12 rounded-full bg-royal-700/50 flex items-center justify-center flex-shrink-0 border border-gold-500/30">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="4" stroke="#b8860b" stroke-width="1.2" fill="none"/>
              <path d="M3,18 Q3,13 10,13 Q17,13 17,18" stroke="#b8860b" stroke-width="1.2" fill="none"/>
              <path d="M8,9 Q10,11 12,9" stroke="#d4a017" stroke-width="0.8" fill="none"/>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="font-cinzel text-lg font-bold text-ivory-50">松年小組</h3>
            <p class="text-ivory-200/50 text-sm font-lato">週二 10:00 | 60 歲以上 | 2 組</p>
          </div>
          <svg class="accordion-chevron flex-shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5,8 L10,13 L15,8" stroke="#b8860b" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
        </button>
        <div class="accordion-content text-ivory-200/70 text-sm font-lato leading-relaxed">
          松年小組是長輩們溫馨的聚會。每週一起唱詩歌、分享生活、互相代禱。我們也會安排健康講座、節期慶祝，讓長輩們在教會中感受被愛與被重視。
        </div>
      </div>

      <!-- Group 4 -->
      <div class="bg-wood-600/30 border border-gold-500/20 rounded-xl overflow-hidden reveal-section reveal-delay-4">
        <button onclick="toggleGroup(this)" class="w-full flex items-center gap-4 p-5 text-left cursor-pointer hover:bg-wood-600/20 transition-colors">
          <div class="w-12 h-12 rounded-full bg-royal-700/50 flex items-center justify-center flex-shrink-0 border border-gold-500/30">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="7" cy="7" r="3" stroke="#b8860b" stroke-width="1" fill="none"/>
              <circle cx="13" cy="7" r="3" stroke="#d4a017" stroke-width="1" fill="none"/>
              <path d="M1,18 Q1,13 7,13 Q10,13 10,16" stroke="#b8860b" stroke-width="1" fill="none"/>
              <path d="M10,16 Q10,13 13,13 Q19,13 19,18" stroke="#d4a017" stroke-width="1" fill="none"/>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="font-cinzel text-lg font-bold text-ivory-50">國際小組</h3>
            <p class="text-ivory-200/50 text-sm font-lato">週日 13:00 (English) | 3 groups</p>
          </div>
          <svg class="accordion-chevron flex-shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5,8 L10,13 L15,8" stroke="#b8860b" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
        </button>
        <div class="accordion-content text-ivory-200/70 text-sm font-lato leading-relaxed">
          Our international groups welcome English speakers from all backgrounds. We share meals from different cultures, study the Bible together, and support each other through life in Taiwan. A truly multicultural family!
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ GLASS SEPARATOR ============ -->
<div class="glass-separator"></div>

<!-- ============ WEEKLY SCRIPTURE ============ -->
<section class="py-24 relative overflow-hidden" style="background: linear-gradient(135deg, #2e1065 0%, #1a0a3e 50%, #2e1065 100%);">
  <!-- Decorative elements -->
  <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
    <div class="absolute top-1/2 left-10 -translate-y-1/2 w-16 h-16 candle-flicker opacity-30">
      <svg viewBox="0 0 32 48" fill="none"><ellipse cx="16" cy="10" rx="5" ry="8" fill="#fde047"/><rect x="10" y="18" width="12" height="26" rx="2" fill="#fef9e7" opacity="0.5"/></svg>
    </div>
    <div class="absolute top-1/2 right-10 -translate-y-1/2 w-16 h-16 candle-flicker opacity-30" style="animation-delay:-1.5s;">
      <svg viewBox="0 0 32 48" fill="none"><ellipse cx="16" cy="10" rx="5" ry="8" fill="#fde047"/><rect x="10" y="18" width="12" height="26" rx="2" fill="#fef9e7" opacity="0.5"/></svg>
    </div>
  </div>
  <div class="max-w-4xl mx-auto px-6 text-center relative z-10 reveal-section">
    <div class="mb-8">
      <svg width="48" height="40" viewBox="0 0 48 40" fill="none" class="mx-auto opacity-40">
        <path d="M0,30 Q0,10 15,10 L15,15 Q5,15 5,25 L15,25 L15,40 L0,40 Z" fill="#b8860b"/>
        <path d="M25,30 Q25,10 40,10 L40,15 Q30,15 30,25 L40,25 L40,40 L25,40 Z" fill="#b8860b"/>
      </svg>
    </div>
    <blockquote class="font-cinzel text-3xl md:text-4xl text-ivory-50 italic leading-relaxed mb-8 font-medium">
      你們要將一切的憂慮卸給神，<br>因為祂顧念你們。
    </blockquote>
    <cite class="text-gold-400 font-cinzel text-lg tracking-wider not-italic">-- 彼得前書 5:7</cite>
    <div class="mt-8">
      <svg width="48" height="40" viewBox="0 0 48 40" fill="none" class="mx-auto opacity-40" style="transform:rotate(180deg)">
        <path d="M0,30 Q0,10 15,10 L15,15 Q5,15 5,25 L15,25 L15,40 L0,40 Z" fill="#b8860b"/>
        <path d="M25,30 Q25,10 40,10 L40,15 Q30,15 30,25 L40,25 L40,40 L25,40 Z" fill="#b8860b"/>
      </svg>
    </div>
  </div>
</section>

<!-- ============ NEWCOMER (Steps Timeline) ============ -->
<section id="newcomer" class="py-24 bg-ivory-50">
  <div class="max-w-5xl mx-auto px-6 reveal-section">
    <div class="text-center mb-16">
      <!-- Dove SVG -->
      <svg width="40" height="32" viewBox="0 0 32 24" fill="none" class="mx-auto mb-4">
        <path d="M8,18 Q4,14 2,8 Q4,6 8,7 Q6,4 8,2 Q12,4 12,8 Q14,4 18,3 Q20,5 18,9 Q22,6 26,6 Q28,9 24,14 Q20,18 14,20 Q10,20 8,18 Z" fill="#b8860b" opacity="0.8"/>
        <path d="M14,20 Q16,22 20,22 Q18,20 16,18" fill="#d4a017" opacity="0.6"/>
        <circle cx="10" cy="8" r="1" fill="#44240e"/>
      </svg>
      <h2 class="font-cinzel text-4xl font-bold text-wood-700 mb-3">新朋友專區</h2>
      <p class="text-wood-400 font-lato">第一次來教會？別緊張，我們準備了一些資訊給你</p>
    </div>

    <div class="steps-grid grid grid-cols-3 gap-8 relative">
      <!-- Connector lines -->
      <div class="steps-connector absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent opacity-30" style="left:16%;right:16%"></div>

      <!-- Step 1 -->
      <div class="text-center reveal-section reveal-delay-1">
        <div class="w-16 h-16 rounded-full bg-royal-700 flex items-center justify-center mx-auto mb-6 border-2 border-gold-500" style="box-shadow: 0 0 20px rgba(184,134,11,0.2);">
          <span class="font-cinzel text-2xl font-bold text-gold-400">1</span>
        </div>
        <h3 class="font-cinzel text-lg font-bold text-wood-700 mb-2">提早 10 分鐘到</h3>
        <p class="text-wood-400 text-sm font-lato leading-relaxed">接待同工會在門口歡迎你，帶你熟悉環境，找到舒適的座位。</p>
      </div>

      <!-- Step 2 -->
      <div class="text-center reveal-section reveal-delay-2">
        <div class="w-16 h-16 rounded-full bg-royal-700 flex items-center justify-center mx-auto mb-6 border-2 border-gold-500" style="box-shadow: 0 0 20px rgba(184,134,11,0.2);">
          <span class="font-cinzel text-2xl font-bold text-gold-400">2</span>
        </div>
        <h3 class="font-cinzel text-lg font-bold text-wood-700 mb-2">自在參與</h3>
        <p class="text-wood-400 text-sm font-lato leading-relaxed">崇拜約 90 分鐘，可以坐著聆聽，不用勉強做任何事。</p>
      </div>

      <!-- Step 3 -->
      <div class="text-center reveal-section reveal-delay-3">
        <div class="w-16 h-16 rounded-full bg-royal-700 flex items-center justify-center mx-auto mb-6 border-2 border-gold-500" style="box-shadow: 0 0 20px rgba(184,134,11,0.2);">
          <span class="font-cinzel text-2xl font-bold text-gold-400">3</span>
        </div>
        <h3 class="font-cinzel text-lg font-bold text-wood-700 mb-2">留下來聊聊</h3>
        <p class="text-wood-400 text-sm font-lato leading-relaxed">崇拜後有茶點時間，歡迎認識新朋友，我們很想聽你的故事。</p>
      </div>
    </div>
  </div>
</section>

<!-- ============ FAQ ============ -->
<section class="py-24" style="background: linear-gradient(180deg, #fefce8 0%, #fef9e7 100%);">
  <div class="max-w-3xl mx-auto px-6 reveal-section">
    <div class="text-center mb-12">
      <h2 class="font-cinzel text-4xl font-bold text-wood-700 mb-3">常見問題</h2>
      <p class="text-wood-400 font-lato">有任何疑問，歡迎隨時聯絡我們</p>
    </div>

    <div class="space-y-4">
      <div class="bg-white rounded-xl border border-gold-200/30 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left font-cinzel font-bold text-wood-700 hover:bg-ivory-100 transition-colors cursor-pointer">
          <span>我沒有信仰背景，可以來嗎？</span>
          <svg class="accordion-chevron flex-shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5,8 L10,13 L15,8" stroke="#b8860b" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
        </button>
        <div class="accordion-content text-wood-400 text-sm font-lato leading-relaxed">
          當然可以！恩典教會歡迎所有人，無論你有沒有信仰背景。你可以先來參加主日崇拜，感受教會的氛圍。如果你想更深入了解基督信仰，我們有專門為慕道友開設的「信仰探索班」。
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gold-200/30 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left font-cinzel font-bold text-wood-700 hover:bg-ivory-100 transition-colors cursor-pointer">
          <span>有停車場嗎？</span>
          <svg class="accordion-chevron flex-shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5,8 L10,13 L15,8" stroke="#b8860b" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
        </button>
        <div class="accordion-content text-wood-400 text-sm font-lato leading-relaxed">
          教會旁有忠孝新生站地下停車場，教會補助主日停車費（憑停車單至服務台蓋章）。也可以搭捷運到善導寺站 5 號出口，步行 3 分鐘即到。
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gold-200/30 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left font-cinzel font-bold text-wood-700 hover:bg-ivory-100 transition-colors cursor-pointer">
          <span>小孩可以一起來嗎？</span>
          <svg class="accordion-chevron flex-shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5,8 L10,13 L15,8" stroke="#b8860b" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
        </button>
        <div class="accordion-content text-wood-400 text-sm font-lato leading-relaxed">
          非常歡迎！第一堂和第二堂崇拜都有同步的兒童主日學（3-12 歲）。2 歲以下的寶寶可以到「愛的小屋」嬰兒室，有專人照顧，家長可以安心參加崇拜。
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gold-200/30 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left font-cinzel font-bold text-wood-700 hover:bg-ivory-100 transition-colors cursor-pointer">
          <span>如何加入小組？</span>
          <svg class="accordion-chevron flex-shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5,8 L10,13 L15,8" stroke="#b8860b" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
        </button>
        <div class="accordion-content text-wood-400 text-sm font-lato leading-relaxed">
          崇拜後可以到服務台詢問，我們會根據你的年齡、興趣和所在區域推薦適合的小組。也可以先來「體驗」1-2 次，覺得合適再正式加入。
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gold-200/30 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left font-cinzel font-bold text-wood-700 hover:bg-ivory-100 transition-colors cursor-pointer">
          <span>可以線上參與崇拜嗎？</span>
          <svg class="accordion-chevron flex-shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5,8 L10,13 L15,8" stroke="#b8860b" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
        </button>
        <div class="accordion-content text-wood-400 text-sm font-lato leading-relaxed">
          可以！我們每堂崇拜都有線上直播。如果你因為身體不適、出差或其他原因無法到場，歡迎透過我們的 YouTube 頻道即時收看。
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ CONTACT + FOOTER ============ -->
<footer class="py-16" style="background: linear-gradient(180deg, #1a0a3e 0%, #0f0520 100%);">
  <div class="max-w-7xl mx-auto px-6 reveal-section">
    <div class="footer-grid grid grid-cols-3 gap-12 mb-12">
      <!-- Info -->
      <div>
        <div class="flex items-center gap-3 mb-6">
          <svg width="24" height="32" viewBox="0 0 28 36" fill="none">
            <rect x="10" y="0" width="8" height="36" rx="1" fill="#b8860b"/>
            <rect x="0" y="8" width="28" height="8" rx="1" fill="#b8860b"/>
          </svg>
          <div>
            <span class="font-cinzel text-lg font-bold text-ivory-50">恩典教會</span>
            <span class="block text-[10px] text-gold-400 font-cinzel tracking-widest">GRACE CHURCH</span>
          </div>
        </div>
        <p class="text-ivory-200/50 text-sm font-lato leading-relaxed">用恩典連結生命，用愛改變社區。歡迎每一個人回到這個屬於你的家。</p>
      </div>

      <!-- Location -->
      <div>
        <h3 class="font-cinzel text-lg font-bold text-ivory-50 mb-4">交通資訊</h3>
        <div class="space-y-3 text-ivory-200/60 text-sm font-lato">
          <p class="flex items-start gap-2">
            <!-- Map Pin -->
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="flex-shrink-0 mt-0.5"><path d="M8,1 Q13,1 13,6 Q13,11 8,15 Q3,11 3,6 Q3,1 8,1 Z" stroke="#b8860b" stroke-width="1" fill="none"/><circle cx="8" cy="6" r="2" fill="#b8860b"/></svg>
            台北市中正區忠孝東路一段 108 號 3F
          </p>
          <p class="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="flex-shrink-0 mt-0.5"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="#b8860b" stroke-width="1" fill="none"/><path d="M2,5 L8,9 L14,5" stroke="#b8860b" stroke-width="1" fill="none"/></svg>
            info@gracechurch.tw
          </p>
          <p class="flex items-start gap-2">
            <!-- Phone -->
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="flex-shrink-0 mt-0.5"><path d="M3,2 Q2,2 2,3 L2,5 Q2,10 6,13 L8,14 Q9,14 10,13 L12,11 Q12.5,10.5 12,10 L10,8 Q9.5,7.5 9,8 L8,9 Q6,8 5,6 L6,5 Q6.5,4.5 6,4 L4,2 Q3.5,1.5 3,2 Z" stroke="#b8860b" stroke-width="1" fill="none"/></svg>
            (02) 2394-5678
          </p>
        </div>
      </div>

      <!-- Transport -->
      <div>
        <h3 class="font-cinzel text-lg font-bold text-ivory-50 mb-4">如何前來</h3>
        <div class="space-y-3 text-ivory-200/60 text-sm font-lato">
          <p>捷運善導寺站 5 號出口，步行 3 分鐘</p>
          <p>忠孝新生站地下停車場（教會補助停車費）</p>
          <p>公車 205、212、232 在「善導寺」站下車</p>
        </div>
      </div>
    </div>

    <div class="border-t border-royal-800 pt-8 flex flex-wrap items-center justify-between gap-4">
      <div class="text-ivory-200/40 text-xs font-lato">&copy; 2026 Grace Church &middot; 用愛連結每一個生命</div>
      <div class="flex gap-6">
        <a class="text-ivory-200/40 text-xs hover:text-gold-400 transition-colors cursor-pointer font-lato">聚會時間</a>
        <a onclick="openModal('offeringModal')" class="text-ivory-200/40 text-xs hover:text-gold-400 transition-colors cursor-pointer font-lato">線上奉獻</a>
        <a class="text-ivory-200/40 text-xs hover:text-gold-400 transition-colors cursor-pointer font-lato">隱私政策</a>
      </div>
    </div>
  </div>
</footer>

<!-- ============ OFFERING MODAL ============ -->
<div id="offeringModal" class="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
  <div class="modal-box bg-ivory-50 rounded-2xl p-8 w-full max-w-md shadow-2xl relative border border-gold-200/30" style="box-shadow: 0 25px 60px rgba(46,16,101,0.3);">
    <button onclick="closeModal('offeringModal')" class="absolute top-4 right-4 text-wood-400 hover:text-wood-700 transition-colors cursor-pointer">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6,6 L18,18 M18,6 L6,18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <div class="text-center mb-6">
      <!-- Cross in circle -->
      <div class="w-16 h-16 rounded-full bg-royal-700 flex items-center justify-center mx-auto mb-3 border-2 border-gold-500">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="10" y="4" width="4" height="16" rx="1" fill="#b8860b"/>
          <rect x="4" y="8" width="16" height="4" rx="1" fill="#b8860b"/>
        </svg>
      </div>
      <h3 class="font-cinzel text-xl font-bold text-wood-700">線上奉獻</h3>
      <p class="text-wood-400 text-sm font-lato mt-1">感謝您的慷慨奉獻</p>
    </div>
    <div id="offerForm">
      <input type="text" placeholder="姓名" class="w-full border border-gold-200/50 rounded-lg px-4 py-2.5 text-sm mb-3 bg-white font-lato text-wood-700">
      <div class="text-xs text-wood-500 font-cinzel mb-2 tracking-wider">奉獻類別</div>
      <div class="grid grid-cols-2 gap-2 mb-3">
        <label class="flex items-center gap-2 text-sm bg-royal-50 px-3 py-2 rounded-lg cursor-pointer border border-royal-100 font-lato"><input type="radio" name="offerType" class="accent-purple-700" checked> 什一奉獻</label>
        <label class="flex items-center gap-2 text-sm bg-royal-50 px-3 py-2 rounded-lg cursor-pointer border border-royal-100 font-lato"><input type="radio" name="offerType" class="accent-purple-700"> 感恩奉獻</label>
        <label class="flex items-center gap-2 text-sm bg-royal-50 px-3 py-2 rounded-lg cursor-pointer border border-royal-100 font-lato"><input type="radio" name="offerType" class="accent-purple-700"> 宣教基金</label>
        <label class="flex items-center gap-2 text-sm bg-royal-50 px-3 py-2 rounded-lg cursor-pointer border border-royal-100 font-lato"><input type="radio" name="offerType" class="accent-purple-700"> 建堂基金</label>
      </div>
      <input type="text" placeholder="奉獻金額（NTD）" class="w-full border border-gold-200/50 rounded-lg px-4 py-2.5 text-sm mb-3 bg-white font-lato text-wood-700">
      <div class="text-xs text-wood-500 font-cinzel mb-2 tracking-wider">付款方式</div>
      <div class="flex gap-2 mb-5">
        <button class="flex-1 text-xs bg-royal-700 text-ivory-50 py-2 rounded-lg font-cinzel tracking-wider cursor-pointer">信用卡</button>
        <button class="flex-1 text-xs bg-ivory-100 border border-gold-200/30 text-wood-500 py-2 rounded-lg font-cinzel tracking-wider cursor-pointer hover:bg-ivory-200 transition-colors">銀行轉帳</button>
        <button class="flex-1 text-xs bg-ivory-100 border border-gold-200/30 text-wood-500 py-2 rounded-lg font-cinzel tracking-wider cursor-pointer hover:bg-ivory-200 transition-colors">Line Pay</button>
      </div>
      <button onclick="submitOffering()" class="w-full bg-gold-500 hover:bg-gold-600 text-ivory-50 py-3 rounded-lg font-cinzel tracking-wider transition-colors cursor-pointer text-sm">確認奉獻</button>
    </div>
  </div>
</div>

<!-- ============ EVENT MODAL ============ -->
<div id="eventModal" class="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
  <div class="modal-box bg-ivory-50 rounded-2xl p-8 w-full max-w-md shadow-2xl relative border border-gold-200/30" style="box-shadow: 0 25px 60px rgba(46,16,101,0.3);">
    <button onclick="closeModal('eventModal')" class="absolute top-4 right-4 text-wood-400 hover:text-wood-700 transition-colors cursor-pointer">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6,6 L18,18 M18,6 L6,18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <div class="text-center mb-6">
      <div class="w-16 h-16 rounded-full bg-royal-700 flex items-center justify-center mx-auto mb-3 border-2 border-gold-500">
        <!-- Bible/Event icon -->
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="2" width="16" height="20" rx="2" stroke="#b8860b" stroke-width="1.5" fill="none"/>
          <path d="M8,7 L16,7 M8,11 L16,11 M8,15 L12,15" stroke="#b8860b" stroke-width="1"/>
        </svg>
      </div>
      <h3 class="font-cinzel text-xl font-bold text-wood-700">活動報名</h3>
      <p class="text-wood-400 text-sm font-lato mt-1" id="eventTitle"></p>
    </div>
    <div id="eventForm">
      <input type="text" placeholder="姓名" class="w-full border border-gold-200/50 rounded-lg px-4 py-2.5 text-sm mb-3 bg-white font-lato text-wood-700">
      <input type="tel" placeholder="手機號碼" class="w-full border border-gold-200/50 rounded-lg px-4 py-2.5 text-sm mb-3 bg-white font-lato text-wood-700">
      <input type="number" placeholder="參加人數" class="w-full border border-gold-200/50 rounded-lg px-4 py-2.5 text-sm mb-3 bg-white font-lato text-wood-700">
      <textarea placeholder="備註（如素食、兒童人數等）" class="w-full border border-gold-200/50 rounded-lg px-4 py-2.5 text-sm mb-4 bg-white font-lato text-wood-700 h-20 resize-none"></textarea>
      <button onclick="submitEvent()" class="w-full bg-gold-500 hover:bg-gold-600 text-ivory-50 py-3 rounded-lg font-cinzel tracking-wider transition-colors cursor-pointer text-sm">確認報名</button>
    </div>
  </div>
</div>

<!-- ============ JAVASCRIPT ============ -->
<script>
/* ---- Smooth scroll ---- */
function smoothScroll(id) {
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---- Nav scroll effect ---- */
var nav = document.getElementById('mainNav');
window.addEventListener('scroll', function() {
  if (window.scrollY > 80) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

/* ---- Mobile Menu ---- */
function toggleMobileMenu() {
  var btn = document.getElementById('hamburgerBtn');
  var menu = document.getElementById('mobileMenu');
  btn.classList.toggle('open');
  menu.classList.toggle('open');
}

/* ---- IntersectionObserver for scroll reveal ---- */
(function() {
  var sections = document.querySelectorAll('.reveal-section');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    sections.forEach(function(section) {
      observer.observe(section);
    });
  } else {
    /* Fallback: show all */
    sections.forEach(function(s) { s.classList.add('revealed'); });
  }
})();

/* ---- FAQ Accordion (only one open at a time) ---- */
function toggleFaq(btn) {
  var parent = btn.parentElement;
  var allItems = parent.parentElement.querySelectorAll('.bg-white');
  var content = btn.nextElementSibling;
  var chevron = btn.querySelector('.accordion-chevron');
  var isOpen = content.classList.contains('open');

  /* Close all */
  allItems.forEach(function(item) {
    var c = item.querySelector('.accordion-content');
    var ch = item.querySelector('.accordion-chevron');
    if (c) c.classList.remove('open');
    if (ch) ch.classList.remove('rotated');
  });

  /* Open clicked if was closed */
  if (!isOpen) {
    content.classList.add('open');
    chevron.classList.add('rotated');
  }
}

/* ---- Group Accordion (only one open at a time) ---- */
function toggleGroup(btn) {
  var parent = btn.parentElement;
  var allGroups = parent.parentElement.querySelectorAll('.bg-wood-600\\/30');
  var content = parent.querySelector('.accordion-content');
  var chevron = btn.querySelector('.accordion-chevron');
  var isOpen = content.classList.contains('open');

  allGroups.forEach(function(g) {
    var c = g.querySelector('.accordion-content');
    var ch = g.querySelector('.accordion-chevron');
    if (c) c.classList.remove('open');
    if (ch) ch.classList.remove('rotated');
  });

  if (!isOpen) {
    content.classList.add('open');
    chevron.classList.add('rotated');
  }
}

/* ---- Modal ---- */
function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}
function openEventModal(title) {
  document.getElementById('eventTitle').textContent = title;
  openModal('eventModal');
}

/* Close modal on overlay click */
document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
});

/* ---- Toast ---- */
function showToast(message) {
  var container = document.getElementById('toastContainer');
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  /* Trigger animation */
  setTimeout(function() { toast.classList.add('show'); }, 10);
  /* Auto remove */
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 400);
  }, 3500);
}

/* ---- Form Submissions ---- */
function submitOffering() {
  var form = document.getElementById('offerForm');
  form.innerHTML = '<div class="text-center py-8"><div class="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center mx-auto mb-4"><svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M8,16 L14,22 L24,10" stroke="#b8860b" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div><p class="font-cinzel text-lg font-bold text-wood-700">感謝您的奉獻</p><p class="text-wood-400 text-sm mt-2 font-lato">願上帝賜福予您</p></div>';
  showToast('奉獻已成功送出，感謝您的慷慨！');
}

function submitEvent() {
  var form = document.getElementById('eventForm');
  form.innerHTML = '<div class="text-center py-8"><div class="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center mx-auto mb-4"><svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M8,16 L14,22 L24,10" stroke="#b8860b" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div><p class="font-cinzel text-lg font-bold text-wood-700">報名成功！</p><p class="text-wood-400 text-sm mt-2 font-lato">我們會發送確認簡訊給您</p></div>';
  showToast('活動報名成功！我們會盡快與您確認。');
}
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
