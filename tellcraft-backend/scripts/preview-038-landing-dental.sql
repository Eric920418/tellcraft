INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '9baf3f43-34e1-4a0f-b4bd-da302ddaaa67',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SmileCare Dental</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        clinical: { 50:'#f0f9ff', 100:'#e0f2fe', 200:'#bae6fd', 300:'#7dd3fc', 400:'#38bdf8', 500:'#0284c7', 600:'#0369a1', 700:'#075985', 800:'#0c4a6e', 900:'#0a3553' },
        mint: { 50:'#ecfdf5', 100:'#d1fae5', 200:'#a7f3d0', 300:'#6ee7b7', 400:'#34d399', 500:'#10b981', 600:'#059669' },
        slate: { 50:'#f8fafc', 100:'#f1f5f9', 200:'#e2e8f0', 300:'#cbd5e1', 400:'#94a3b8', 500:'#64748b', 600:'#475569', 700:'#334155', 800:'#1e293b', 900:'#0f172a' }
      },
      fontFamily: { outfit:['Outfit','Inter','sans-serif'], inter:['Inter','sans-serif'] }
    }
  }
}
</script>
<style>
  * { font-family: 'Inter', sans-serif; }
  h1,h2,h3,h4,h5,h6,.font-display { font-family: 'Outfit', sans-serif; }
  html { scroll-behavior: smooth; }
  .reveal { opacity:0; transform:translateY(20px); transition:all 0.7s cubic-bezier(0.16,1,0.3,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }

  @keyframes sparkle {
    0%, 100% { opacity:0; transform:scale(0.5) rotate(0deg); }
    50% { opacity:1; transform:scale(1) rotate(180deg); }
  }
  @keyframes float {
    0%, 100% { transform:translateY(0); }
    50% { transform:translateY(-8px); }
  }
  .tooth-divider { position:relative; display:flex; align-items:center; justify-content:center; padding:24px 0; }
  .tooth-divider .sparkle-star {
    position:absolute;
    width:8px; height:8px;
    background:#0284c7;
    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
    animation: sparkle 2.5s ease-in-out infinite;
  }
  .tooth-divider .sparkle-star:nth-child(2) { animation-delay: 0.8s; }
  .tooth-divider .sparkle-star:nth-child(3) { animation-delay: 1.6s; }
  .hero-tooth { animation: float 4s ease-in-out infinite; }
</style>
</head>
<body class="bg-slate-50 text-slate-800">

<!-- Nav -->
<nav class="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-slate-100">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2.5">
      <div class="w-9 h-9 bg-clinical-500 rounded-xl flex items-center justify-center">
        <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-2.5 0-4.5 1-5.5 2.5C5.5 6 5 8 5 10c0 1.5.5 3 1.5 4.5L9 20c.5 1.2 1.5 2 2.5 2h1c1 0 2-.8 2.5-2l2.5-5.5C18.5 13 19 11.5 19 10c0-2-0.5-4-1.5-5.5C16.5 3 14.5 2 12 2zm-1 6a1 1 0 110 2 1 1 0 010-2zm2 0a1 1 0 110 2 1 1 0 010-2z"/></svg>
      </div>
      <span class="text-lg font-bold font-display text-slate-900">SmileCare<span class="text-clinical-500"> Dental</span></span>
    </a>
    <div class="hidden md:flex items-center gap-7 text-sm font-medium text-slate-500">
      <a href="#services" class="hover:text-clinical-500 transition-colors">Services</a>
      <a href="#doctors" class="hover:text-clinical-500 transition-colors">Doctors</a>
      <a href="#technology" class="hover:text-clinical-500 transition-colors">Technology</a>
      <a href="#insurance" class="hover:text-clinical-500 transition-colors">Insurance</a>
      <a href="#contact" class="hover:text-clinical-500 transition-colors">Contact</a>
    </div>
    <div class="flex items-center gap-3">
      <a href="tel:+15551234567" class="hidden sm:flex items-center gap-1.5 text-clinical-600 text-sm font-semibold">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
        (555) 123-4567
      </a>
      <button onclick="document.getElementById('booking-modal').classList.remove('hidden')" class="bg-clinical-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-clinical-600 transition-colors shadow-md shadow-clinical-500/20">
        Book Appointment
      </button>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-slate-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-white border-t px-6 py-4 space-y-3">
    <a href="#services" class="block text-sm font-medium text-slate-600">Services</a>
    <a href="#doctors" class="block text-sm font-medium text-slate-600">Doctors</a>
    <a href="#technology" class="block text-sm font-medium text-slate-600">Technology</a>
    <a href="#insurance" class="block text-sm font-medium text-slate-600">Insurance</a>
    <a href="#contact" class="block text-sm font-medium text-slate-600">Contact</a>
  </div>
</nav>

<!-- Hero: Asymmetric 60/40 -->
<section class="pt-24 pb-16 bg-white overflow-hidden">
  <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-5 gap-8 items-center min-h-[70vh]">
    <!-- LEFT 60% (3fr) -->
    <div class="md:col-span-3">
      <div class="inline-flex items-center gap-2 bg-mint-50 text-mint-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-mint-200">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
        Accepting New Patients
      </div>
      <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display leading-[1.1] mb-6 text-slate-900">
        Your Smile,<br>Our <span class="text-clinical-500">Passion</span>
      </h1>
      <p class="text-slate-500 text-lg md:text-xl mb-8 leading-relaxed max-w-xl">
        Comprehensive dental care for your entire family. From routine cleanings to transformative cosmetic work, we make every visit comfortable.
      </p>
      <div class="flex flex-wrap gap-4 mb-10">
        <button onclick="document.getElementById('booking-modal').classList.remove('hidden')" class="bg-clinical-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-clinical-600 transition-colors shadow-lg shadow-clinical-500/25 text-base">
          Book Now
        </button>
        <a href="#services" class="border-2 border-slate-200 text-slate-600 px-8 py-3.5 rounded-xl font-semibold hover:border-clinical-200 hover:text-clinical-600 transition-colors text-base">
          View Services
        </a>
      </div>
      <!-- Trust Badges -->
      <div class="flex flex-wrap gap-3">
        <span class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-600">
          <svg class="w-4 h-4 text-clinical-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          ADA Member
        </span>
        <span class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-600">
          <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          5-Star Rated
        </span>
        <span class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-600">
          <svg class="w-4 h-4 text-mint-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          15+ Years
        </span>
      </div>
    </div>
    <!-- RIGHT 40% (2fr): Tooth SVG with sparkle -->
    <div class="md:col-span-2 flex justify-center relative">
      <div class="hero-tooth relative">
        <svg viewBox="0 0 200 240" class="w-56 h-64 md:w-72 md:h-80 drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Tooth body -->
          <path d="M100 20 C130 20 155 40 160 70 C165 100 155 120 145 145 L130 195 C125 210 115 220 110 220 L105 220 C100 220 98 210 100 195 L100 185 C100 210 95 220 90 220 L85 220 C80 220 70 210 65 195 L50 145 C40 120 35 100 40 70 C45 40 70 20 100 20Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/>
          <!-- Tooth highlights -->
          <path d="M75 50 C80 40 90 35 100 35 C110 35 120 40 125 50" stroke="#7dd3fc" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>
          <ellipse cx="85" cy="65" rx="8" ry="12" fill="white" opacity="0.5"/>
          <!-- Crown line -->
          <path d="M55 100 Q78 115 100 100 Q122 85 145 100" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.4"/>
          <!-- Sparkle stars -->
          <g class="sparkle-star-svg">
            <polygon points="170,40 173,48 182,48 175,53 177,62 170,57 163,62 165,53 158,48 167,48" fill="#0284c7" opacity="0">
              <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite"/>
              <animateTransform attributeName="transform" type="scale" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" additive="sum" />
            </polygon>
            <polygon points="35,55 37,60 42,60 38,63 39,68 35,65 31,68 32,63 28,60 33,60" fill="#10b981" opacity="0">
              <animate attributeName="opacity" values="0;1;0" dur="3s" begin="0.8s" repeatCount="indefinite"/>
              <animateTransform attributeName="transform" type="scale" values="0.5;1;0.5" dur="3s" begin="0.8s" repeatCount="indefinite" additive="sum"/>
            </polygon>
            <polygon points="155,160 157,165 162,165 158,168 159,173 155,170 151,173 152,168 148,165 153,165" fill="#38bdf8" opacity="0">
              <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1.5s" repeatCount="indefinite"/>
              <animateTransform attributeName="transform" type="scale" values="0.5;1;0.5" dur="2s" begin="1.5s" repeatCount="indefinite" additive="sum"/>
            </polygon>
          </g>
        </svg>
      </div>
      <!-- Floating stat cards -->
      <div class="absolute -bottom-2 -left-2 md:left-0 bg-white rounded-2xl p-3.5 shadow-lg border border-slate-100">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 bg-mint-50 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-mint-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-medium">Satisfaction</p>
            <p class="text-base font-bold text-slate-900">98.5%</p>
          </div>
        </div>
      </div>
      <div class="absolute -top-2 -right-2 md:right-0 bg-white rounded-2xl p-3.5 shadow-lg border border-slate-100">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 bg-clinical-50 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-clinical-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-medium">Wait Time</p>
            <p class="text-base font-bold text-slate-900">&lt; 10 min</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Tooth Divider 1 -->
<div class="tooth-divider bg-slate-50">
  <svg viewBox="0 0 60 40" class="w-10 h-7 text-clinical-300 opacity-60" fill="currentColor"><path d="M30 2c8 0 14 5 15 12s-2 14-6 22c-1 2-3 3-4 3h-1c-1 0-2-.5-2.5-2L30 32l-1.5 5c-.5 1.5-1.5 2-2.5 2h-1c-1 0-3-1-4-3-4-8-7-15-6-22S22 2 30 2z"/></svg>
  <span class="sparkle-star" style="top:8px;right:calc(50% - 30px);"></span>
  <span class="sparkle-star" style="top:4px;right:calc(50% - 40px);animation-delay:1s;"></span>
  <span class="sparkle-star" style="bottom:8px;left:calc(50% - 35px);animation-delay:1.8s;"></span>
</div>

<!-- Services -->
<section id="services" class="py-20 bg-slate-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="mb-14 reveal">
      <span class="text-clinical-500 font-semibold text-sm tracking-widest uppercase font-display">Our Services</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 text-slate-900 font-display">Complete Dental Care</h2>
      <p class="text-slate-400 mt-3 max-w-lg">From preventive to restorative, we offer every service your smile needs under one roof.</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <!-- Cleaning -->
      <div class="reveal group bg-white border border-slate-200 rounded-2xl p-7 hover:shadow-lg hover:border-clinical-200 transition-all cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-clinical-50 flex items-center justify-center mb-4 group-hover:bg-clinical-100 transition-colors">
          <svg class="w-6 h-6 text-clinical-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
        </div>
        <h3 class="font-bold text-lg font-display mb-2">Professional Cleaning</h3>
        <p class="text-slate-400 text-sm leading-relaxed">Deep cleaning, scaling, and polishing to keep your teeth and gums healthy.</p>
        <p class="text-clinical-500 text-sm font-semibold mt-3">From $99</p>
      </div>
      <!-- Whitening -->
      <div class="reveal group bg-white border border-slate-200 rounded-2xl p-7 hover:shadow-lg hover:border-clinical-200 transition-all cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-mint-50 flex items-center justify-center mb-4 group-hover:bg-mint-100 transition-colors">
          <svg class="w-6 h-6 text-mint-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-2.5 0-4.5 1-5.5 2.5C5.5 6 5 8 5 10c0 1.5.5 3 1.5 4.5L9 20c.5 1.2 1.5 2 2.5 2h1c1 0 2-.8 2.5-2l2.5-5.5C18.5 13 19 11.5 19 10c0-2-.5-4-1.5-5.5C16.5 3 14.5 2 12 2z" opacity="0.9"/><circle cx="10" cy="8" r="1.5" fill="white" opacity="0.5"/></svg>
        </div>
        <h3 class="font-bold text-lg font-display mb-2">Teeth Whitening</h3>
        <p class="text-slate-400 text-sm leading-relaxed">In-office and take-home whitening solutions for a brighter, confident smile.</p>
        <p class="text-clinical-500 text-sm font-semibold mt-3">From $299</p>
      </div>
      <!-- Implants -->
      <div class="reveal group bg-white border border-slate-200 rounded-2xl p-7 hover:shadow-lg hover:border-clinical-200 transition-all cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-clinical-50 flex items-center justify-center mb-4 group-hover:bg-clinical-100 transition-colors">
          <svg class="w-6 h-6 text-clinical-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
        </div>
        <h3 class="font-bold text-lg font-display mb-2">Dental Implants</h3>
        <p class="text-slate-400 text-sm leading-relaxed">Permanent tooth replacement with titanium implants and natural-looking crowns.</p>
        <p class="text-clinical-500 text-sm font-semibold mt-3">From $2,500</p>
      </div>
      <!-- Orthodontics -->
      <div class="reveal group bg-white border border-slate-200 rounded-2xl p-7 hover:shadow-lg hover:border-clinical-200 transition-all cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-mint-50 flex items-center justify-center mb-4 group-hover:bg-mint-100 transition-colors">
          <svg class="w-6 h-6 text-mint-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
        </div>
        <h3 class="font-bold text-lg font-display mb-2">Orthodontics</h3>
        <p class="text-slate-400 text-sm leading-relaxed">Invisalign clear aligners and traditional braces for a perfectly aligned smile.</p>
        <p class="text-clinical-500 text-sm font-semibold mt-3">From $3,500</p>
      </div>
      <!-- Emergency -->
      <div class="reveal group bg-white border border-slate-200 rounded-2xl p-7 hover:shadow-lg hover:border-clinical-200 transition-all cursor-pointer sm:col-span-2 lg:col-span-1">
        <div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
          <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h3 class="font-bold text-lg font-display mb-2">Emergency Care</h3>
        <p class="text-slate-400 text-sm leading-relaxed">Same-day emergency appointments for toothaches, broken teeth, and urgent needs.</p>
        <p class="text-red-500 text-sm font-semibold mt-3">Call Now: (555) 123-4567</p>
      </div>
    </div>
  </div>
</section>

<!-- Tooth Divider 2 -->
<div class="tooth-divider bg-white">
  <svg viewBox="0 0 60 40" class="w-10 h-7 text-mint-300 opacity-60" fill="currentColor"><path d="M30 2c8 0 14 5 15 12s-2 14-6 22c-1 2-3 3-4 3h-1c-1 0-2-.5-2.5-2L30 32l-1.5 5c-.5 1.5-1.5 2-2.5 2h-1c-1 0-3-1-4-3-4-8-7-15-6-22S22 2 30 2z"/></svg>
  <span class="sparkle-star" style="top:6px;right:calc(50% - 28px);"></span>
  <span class="sparkle-star" style="bottom:6px;left:calc(50% - 32px);animation-delay:0.6s;"></span>
  <span class="sparkle-star" style="top:12px;right:calc(50% + 20px);animation-delay:1.3s;"></span>
</div>

<!-- Why Choose Us: Asymmetric trust blocks -->
<section id="technology" class="py-20 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="mb-14 reveal">
      <span class="text-clinical-500 font-semibold text-sm tracking-widest uppercase font-display">Why Choose Us</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 text-slate-900 font-display">Trusted By Thousands</h2>
    </div>
    <div class="grid md:grid-cols-2 gap-5">
      <!-- Large block -->
      <div class="reveal bg-clinical-500 text-white rounded-2xl p-8 md:p-10 md:row-span-2 flex flex-col justify-between">
        <div>
          <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
            <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
          </div>
          <p class="text-5xl md:text-6xl font-extrabold font-display mb-2">5,000+</p>
          <h3 class="text-xl font-bold font-display mb-3">Happy Patients</h3>
          <p class="text-clinical-100 leading-relaxed">Families across the community trust SmileCare for their dental health. Our patient-first approach has earned us a 98.5% satisfaction rate.</p>
        </div>
        <div class="flex items-center gap-2 mt-6">
          <div class="flex -space-x-2">
            <div class="w-8 h-8 rounded-full bg-clinical-300 border-2 border-clinical-500 flex items-center justify-center text-xs font-bold">J</div>
            <div class="w-8 h-8 rounded-full bg-clinical-200 border-2 border-clinical-500 flex items-center justify-center text-xs font-bold text-clinical-700">S</div>
            <div class="w-8 h-8 rounded-full bg-clinical-300 border-2 border-clinical-500 flex items-center justify-center text-xs font-bold">M</div>
          </div>
          <span class="text-clinical-100 text-sm">Join our community</span>
        </div>
      </div>
      <!-- Top right -->
      <div class="reveal bg-slate-50 border border-slate-200 rounded-2xl p-7 flex items-start gap-5">
        <div class="w-14 h-14 bg-mint-50 rounded-2xl flex items-center justify-center flex-shrink-0">
          <svg class="w-7 h-7 text-mint-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>
        </div>
        <div>
          <h3 class="font-bold text-lg font-display mb-1">State-of-Art Technology</h3>
          <p class="text-slate-400 text-sm leading-relaxed">Digital X-rays, 3D scanning, laser dentistry, and CAD/CAM same-day crowns for precise, comfortable treatment.</p>
        </div>
      </div>
      <!-- Bottom left -->
      <div class="reveal bg-slate-50 border border-slate-200 rounded-2xl p-7 flex items-start gap-5">
        <div class="w-14 h-14 bg-clinical-50 rounded-2xl flex items-center justify-center flex-shrink-0">
          <svg class="w-7 h-7 text-clinical-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </div>
        <div>
          <h3 class="font-bold text-lg font-display mb-1">Insurance Accepted</h3>
          <p class="text-slate-400 text-sm leading-relaxed">We accept most major insurance plans including Delta Dental, Cigna, Aetna, MetLife, and offer flexible payment plans.</p>
        </div>
      </div>
      <!-- Bottom right -->
      <div class="reveal bg-mint-500 text-white rounded-2xl p-7 flex items-start gap-5">
        <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div>
          <h3 class="font-bold text-lg font-display mb-1">Same-Day Appointments</h3>
          <p class="text-mint-100 text-sm leading-relaxed">Emergency slots available daily. Walk-ins welcome. Evening and Saturday hours for your convenience.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Tooth Divider 3 -->
<div class="tooth-divider bg-slate-50">
  <svg viewBox="0 0 60 40" class="w-10 h-7 text-clinical-300 opacity-60" fill="currentColor"><path d="M30 2c8 0 14 5 15 12s-2 14-6 22c-1 2-3 3-4 3h-1c-1 0-2-.5-2.5-2L30 32l-1.5 5c-.5 1.5-1.5 2-2.5 2h-1c-1 0-3-1-4-3-4-8-7-15-6-22S22 2 30 2z"/></svg>
  <span class="sparkle-star" style="top:5px;left:calc(50% - 30px);"></span>
  <span class="sparkle-star" style="bottom:5px;right:calc(50% - 28px);animation-delay:0.9s;"></span>
  <span class="sparkle-star" style="top:14px;left:calc(50% + 18px);animation-delay:1.5s;"></span>
</div>

<!-- Doctors -->
<section id="doctors" class="py-20 bg-slate-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="mb-14 reveal">
      <span class="text-clinical-500 font-semibold text-sm tracking-widest uppercase font-display">Our Team</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 text-slate-900 font-display">Meet Your Dentists</h2>
      <p class="text-slate-400 mt-3 max-w-lg">Board-certified professionals committed to your comfort and care.</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Doctor 1 -->
      <div class="reveal bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
        <div class="h-48 bg-gradient-to-br from-clinical-50 to-clinical-100 flex items-center justify-center relative">
          <div class="w-28 h-28 rounded-full bg-gradient-to-br from-clinical-200 to-clinical-300 flex items-center justify-center">
            <svg class="w-16 h-16 text-clinical-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
          </div>
          <div class="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg px-2 py-1 text-xs font-semibold text-clinical-600">Lead Dentist</div>
        </div>
        <div class="p-6">
          <h4 class="font-bold text-lg font-display">Dr. Sarah Mitchell</h4>
          <p class="text-clinical-500 text-sm font-semibold mt-0.5">General & Cosmetic Dentistry</p>
          <!-- Star rating -->
          <div class="flex items-center gap-1 mt-3">
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span class="text-xs text-slate-400 ml-1">4.9 (320 reviews)</span>
          </div>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span class="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full">DDS, NYU</span>
            <span class="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full">ADA Fellow</span>
            <span class="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full">18 yrs exp</span>
          </div>
        </div>
      </div>
      <!-- Doctor 2 -->
      <div class="reveal bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
        <div class="h-48 bg-gradient-to-br from-mint-50 to-mint-100 flex items-center justify-center relative">
          <div class="w-28 h-28 rounded-full bg-gradient-to-br from-mint-200 to-mint-300 flex items-center justify-center">
            <svg class="w-16 h-16 text-mint-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
          </div>
          <div class="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg px-2 py-1 text-xs font-semibold text-mint-600">Orthodontist</div>
        </div>
        <div class="p-6">
          <h4 class="font-bold text-lg font-display">Dr. James Park</h4>
          <p class="text-mint-600 text-sm font-semibold mt-0.5">Orthodontics & Invisalign</p>
          <div class="flex items-center gap-1 mt-3">
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span class="text-xs text-slate-400 ml-1">5.0 (215 reviews)</span>
          </div>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span class="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full">DMD, UPenn</span>
            <span class="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full">Invisalign Diamond</span>
            <span class="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full">12 yrs exp</span>
          </div>
        </div>
      </div>
      <!-- Doctor 3 -->
      <div class="reveal bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
        <div class="h-48 bg-gradient-to-br from-slate-50 to-clinical-50 flex items-center justify-center relative">
          <div class="w-28 h-28 rounded-full bg-gradient-to-br from-slate-200 to-clinical-200 flex items-center justify-center">
            <svg class="w-16 h-16 text-clinical-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
          </div>
          <div class="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg px-2 py-1 text-xs font-semibold text-clinical-600">Oral Surgeon</div>
        </div>
        <div class="p-6">
          <h4 class="font-bold text-lg font-display">Dr. Emily Chen</h4>
          <p class="text-clinical-500 text-sm font-semibold mt-0.5">Implants & Oral Surgery</p>
          <div class="flex items-center gap-1 mt-3">
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span class="text-xs text-slate-400 ml-1">4.8 (189 reviews)</span>
          </div>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span class="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full">DDS, Columbia</span>
            <span class="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full">Board Certified</span>
            <span class="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full">15 yrs exp</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Tooth Divider 4 -->
<div class="tooth-divider bg-white">
  <svg viewBox="0 0 60 40" class="w-10 h-7 text-clinical-300 opacity-60" fill="currentColor"><path d="M30 2c8 0 14 5 15 12s-2 14-6 22c-1 2-3 3-4 3h-1c-1 0-2-.5-2.5-2L30 32l-1.5 5c-.5 1.5-1.5 2-2.5 2h-1c-1 0-3-1-4-3-4-8-7-15-6-22S22 2 30 2z"/></svg>
  <span class="sparkle-star" style="top:8px;right:calc(50% - 25px);"></span>
  <span class="sparkle-star" style="bottom:4px;left:calc(50% - 30px);animation-delay:1.1s;"></span>
  <span class="sparkle-star" style="top:3px;left:calc(50% + 22px);animation-delay:2s;"></span>
</div>

<!-- Insurance Section -->
<section id="insurance" class="py-20 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-5 gap-10 items-center">
      <div class="md:col-span-3 reveal">
        <span class="text-clinical-500 font-semibold text-sm tracking-widest uppercase font-display">Insurance & Payment</span>
        <h2 class="text-3xl md:text-4xl font-bold mt-3 mb-4 text-slate-900 font-display">We Work With Your Insurance</h2>
        <p class="text-slate-400 text-lg leading-relaxed mb-6">We accept most major dental insurance plans. No insurance? No problem. We offer affordable payment plans to make quality dental care accessible to everyone.</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <p class="font-bold text-sm text-slate-700">Delta Dental</p>
          </div>
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <p class="font-bold text-sm text-slate-700">Cigna</p>
          </div>
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <p class="font-bold text-sm text-slate-700">Aetna</p>
          </div>
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <p class="font-bold text-sm text-slate-700">MetLife</p>
          </div>
        </div>
        <p class="text-slate-400 text-sm">+ 20 more plans accepted. <a href="#contact" class="text-clinical-500 font-semibold hover:underline">Contact us</a> to verify your coverage.</p>
      </div>
      <div class="md:col-span-2 reveal">
        <div class="bg-clinical-50 border border-clinical-100 rounded-2xl p-8">
          <div class="w-12 h-12 bg-clinical-500 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 class="font-bold text-lg font-display mb-2">Flexible Payment Plans</h3>
          <ul class="space-y-2 text-sm text-slate-600">
            <li class="flex items-center gap-2"><svg class="w-4 h-4 text-mint-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> 0% interest financing available</li>
            <li class="flex items-center gap-2"><svg class="w-4 h-4 text-mint-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> CareCredit accepted</li>
            <li class="flex items-center gap-2"><svg class="w-4 h-4 text-mint-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> In-house membership plan</li>
            <li class="flex items-center gap-2"><svg class="w-4 h-4 text-mint-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> All major credit cards</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Appointment CTA Form -->
<section id="contact" class="py-20 bg-clinical-500 text-white">
  <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-5 gap-10 items-center">
    <div class="md:col-span-3 reveal">
      <h2 class="text-3xl md:text-4xl font-bold font-display mb-4">Schedule Your Visit</h2>
      <p class="text-clinical-100 text-lg mb-8 leading-relaxed">Fill out the form and our team will confirm your appointment within 1 hour. Same-day appointments available for emergencies.</p>
      <div class="bg-white/10 backdrop-blur rounded-2xl p-6 md:p-8">
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-semibold text-clinical-100 mb-1.5 block">Full Name</label>
            <input type="text" placeholder="John Smith" class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-clinical-200 focus:ring-2 focus:ring-white/30 outline-none">
          </div>
          <div>
            <label class="text-sm font-semibold text-clinical-100 mb-1.5 block">Phone Number</label>
            <input type="tel" placeholder="(555) 000-0000" class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-clinical-200 focus:ring-2 focus:ring-white/30 outline-none">
          </div>
          <div>
            <label class="text-sm font-semibold text-clinical-100 mb-1.5 block">Preferred Date</label>
            <input type="date" class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-white/30 outline-none">
          </div>
          <div>
            <label class="text-sm font-semibold text-clinical-100 mb-1.5 block">Service Needed</label>
            <select class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-white/30 outline-none">
              <option class="text-slate-800">Cleaning & Checkup</option>
              <option class="text-slate-800">Teeth Whitening</option>
              <option class="text-slate-800">Dental Implants</option>
              <option class="text-slate-800">Orthodontics / Invisalign</option>
              <option class="text-slate-800">Emergency Care</option>
              <option class="text-slate-800">Other / Consultation</option>
            </select>
          </div>
        </div>
        <button onclick="showToast('Appointment request sent! We will call you within 1 hour to confirm.')" class="mt-5 w-full sm:w-auto bg-white text-clinical-600 px-8 py-3 rounded-xl font-bold hover:bg-clinical-50 transition-colors shadow-lg">
          Request Appointment
        </button>
      </div>
    </div>
    <div class="md:col-span-2 reveal space-y-4">
      <div class="bg-white/10 backdrop-blur rounded-2xl p-6">
        <h4 class="font-bold font-display text-lg mb-3">Office Hours</h4>
        <div class="space-y-2 text-sm text-clinical-100">
          <div class="flex justify-between"><span>Monday - Friday</span><span class="font-semibold text-white">8:00 AM - 7:00 PM</span></div>
          <div class="flex justify-between"><span>Saturday</span><span class="font-semibold text-white">9:00 AM - 4:00 PM</span></div>
          <div class="flex justify-between"><span>Sunday</span><span class="font-semibold text-white">Closed</span></div>
        </div>
      </div>
      <div class="bg-red-500/20 border border-red-400/30 rounded-2xl p-6">
        <h4 class="font-bold font-display text-lg mb-2 flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
          Emergency?
        </h4>
        <p class="text-clinical-100 text-sm mb-3">For dental emergencies, call our 24/7 emergency line:</p>
        <a href="tel:+15559110000" class="text-xl font-bold font-display">(555) 911-0000</a>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-slate-900 text-slate-400 py-14">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 bg-clinical-500 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-2.5 0-4.5 1-5.5 2.5C5.5 6 5 8 5 10c0 1.5.5 3 1.5 4.5L9 20c.5 1.2 1.5 2 2.5 2h1c1 0 2-.8 2.5-2l2.5-5.5C18.5 13 19 11.5 19 10c0-2-.5-4-1.5-5.5C16.5 3 14.5 2 12 2z"/></svg>
          </div>
          <span class="text-white font-bold font-display">SmileCare Dental</span>
        </div>
        <p class="text-sm leading-relaxed">Comprehensive dental care for your entire family. Your smile is our mission.</p>
      </div>
      <div>
        <h4 class="text-white font-semibold font-display mb-3">Quick Links</h4>
        <div class="space-y-2 text-sm">
          <a href="#services" class="block hover:text-clinical-400 transition-colors">Services</a>
          <a href="#doctors" class="block hover:text-clinical-400 transition-colors">Our Doctors</a>
          <a href="#technology" class="block hover:text-clinical-400 transition-colors">Technology</a>
          <a href="#insurance" class="block hover:text-clinical-400 transition-colors">Insurance</a>
        </div>
      </div>
      <div>
        <h4 class="text-white font-semibold font-display mb-3">Office Hours</h4>
        <div class="space-y-1 text-sm">
          <p>Mon - Fri: 8:00 AM - 7:00 PM</p>
          <p>Saturday: 9:00 AM - 4:00 PM</p>
          <p>Sunday: Closed</p>
          <p class="text-red-400 font-semibold mt-2">Emergency: (555) 911-0000</p>
        </div>
      </div>
      <div>
        <h4 class="text-white font-semibold font-display mb-3">Location</h4>
        <div class="space-y-1 text-sm">
          <p>123 Smile Avenue, Suite 200</p>
          <p>Springfield, CA 90210</p>
          <p class="mt-2">Phone: (555) 123-4567</p>
          <p>Email: hello@smilecare.com</p>
        </div>
      </div>
    </div>
    <!-- Insurance logos row -->
    <div class="border-t border-slate-800 pt-6 mb-6">
      <p class="text-xs text-slate-500 mb-3">Accepted Insurance:</p>
      <div class="flex flex-wrap gap-4">
        <span class="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-lg font-medium">Delta Dental</span>
        <span class="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-lg font-medium">Cigna</span>
        <span class="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-lg font-medium">Aetna</span>
        <span class="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-lg font-medium">MetLife</span>
        <span class="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-lg font-medium">United Healthcare</span>
        <span class="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-lg font-medium">Guardian</span>
      </div>
    </div>
    <div class="border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
      &copy; 2026 SmileCare Dental. All rights reserved. | <a href="#" class="hover:text-clinical-400 transition-colors">Privacy Policy</a> | <a href="#" class="hover:text-clinical-400 transition-colors">Terms of Service</a>
    </div>
  </div>
</footer>

<!-- Booking Modal -->
<div id="booking-modal" class="hidden fixed inset-0 z-[60] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="this.parentElement.classList.add('hidden')"></div>
  <div class="relative bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
    <button onclick="this.closest('#booking-modal').classList.add('hidden')" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
    <h3 class="text-2xl font-bold font-display mb-2">Book Appointment</h3>
    <p class="text-slate-400 text-sm mb-6">We'll confirm your appointment via phone within 1 hour.</p>
    <div class="space-y-4">
      <div><label class="text-sm font-semibold text-slate-600 mb-1 block">Full Name</label><input type="text" placeholder="Your name" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-clinical-300 outline-none"></div>
      <div><label class="text-sm font-semibold text-slate-600 mb-1 block">Phone</label><input type="tel" placeholder="(555) 000-0000" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-clinical-300 outline-none"></div>
      <div><label class="text-sm font-semibold text-slate-600 mb-1 block">Service</label>
        <select class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-clinical-300 outline-none">
          <option>Cleaning & Checkup</option><option>Teeth Whitening</option><option>Dental Implants</option><option>Orthodontics / Invisalign</option><option>Emergency Care</option><option>Other</option>
        </select>
      </div>
      <div><label class="text-sm font-semibold text-slate-600 mb-1 block">Preferred Date</label><input type="date" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-clinical-300 outline-none"></div>
      <div><label class="text-sm font-semibold text-slate-600 mb-1 block">Preferred Time</label>
        <div class="grid grid-cols-3 gap-2">
          <button type="button" onclick="this.classList.toggle('ring-2');this.classList.toggle('ring-clinical-500');this.classList.toggle('bg-clinical-50');this.parentElement.querySelectorAll('button').forEach(b=>{if(b!==this){b.classList.remove('ring-2','ring-clinical-500','bg-clinical-50')}})" class="border border-slate-200 rounded-lg py-2 text-sm font-medium hover:border-clinical-300 transition-colors">Morning</button>
          <button type="button" onclick="this.classList.toggle('ring-2');this.classList.toggle('ring-clinical-500');this.classList.toggle('bg-clinical-50');this.parentElement.querySelectorAll('button').forEach(b=>{if(b!==this){b.classList.remove('ring-2','ring-clinical-500','bg-clinical-50')}})" class="border border-slate-200 rounded-lg py-2 text-sm font-medium hover:border-clinical-300 transition-colors">Afternoon</button>
          <button type="button" onclick="this.classList.toggle('ring-2');this.classList.toggle('ring-clinical-500');this.classList.toggle('bg-clinical-50');this.parentElement.querySelectorAll('button').forEach(b=>{if(b!==this){b.classList.remove('ring-2','ring-clinical-500','bg-clinical-50')}})" class="border border-slate-200 rounded-lg py-2 text-sm font-medium hover:border-clinical-300 transition-colors">Evening</button>
        </div>
      </div>
      <button onclick="showToast('Appointment booked! We will call you shortly to confirm.');this.closest('#booking-modal').classList.add('hidden')" class="w-full bg-clinical-500 text-white py-3 rounded-xl font-bold hover:bg-clinical-600 transition-colors shadow-lg">Submit Request</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-semibold translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"></div>

<script>
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3000);}
const obs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',()=>{document.getElementById('mobile-menu').classList.add('hidden');});});
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
