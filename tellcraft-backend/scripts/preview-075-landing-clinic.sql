INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '14abaa24-c33a-424c-bd39-03b1bfb66df1',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MedCare Clinic</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Open+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        teal: { 50:'#f0fdfa', 100:'#ccfbf1', 200:'#99f6e4', 300:'#5eead4', 400:'#2dd4bf', 500:'#14b8a6', 600:'#0d9488', 700:'#0f766e', 800:'#115e59', 900:'#134e4a' },
        warm: { 50:'#fafaf9', 100:'#f5f5f4', 200:'#e7e5e4', 300:'#d6d3d1', 400:'#a8a29e', 500:'#78716c', 600:'#57534e', 700:'#44403c', 800:'#292524', 900:'#1c1917' },
        mint: { 50:'#f0fdfa', 100:'#ccfbf1', 200:'#a7f3d0' },
        emergency: { 500:'#ef4444', 600:'#dc2626', 700:'#b91c1c' }
      },
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
        body: ['Open Sans', 'sans-serif']
      }
    }
  }
}
</script>
<style>
body { font-family: 'Open Sans', sans-serif; background: #ffffff; }
.font-display { font-family: 'Nunito', sans-serif; }
.card-hover { transition: all 0.3s ease; }
.card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(13,148,136,0.12); }
.reveal { opacity: 0; transform: translateY(24px); transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
.reveal.visible { opacity: 1; transform: translateY(0); }
.cross-deco {
  position: absolute;
  pointer-events: none;
}
.cross-deco svg { display: block; }
.dept-card { cursor: pointer; transition: all 0.3s ease; }
.dept-card:hover { box-shadow: 0 8px 32px rgba(13,148,136,0.10); }
.dept-card.active { border-color: #0d9488; background: #f0fdfa; }
.avail-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.avail-green { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.5); }
.avail-amber { background: #f59e0b; box-shadow: 0 0 6px rgba(245,158,11,0.5); }
.avail-red { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.5); }
.form-input { transition: border-color 0.2s, box-shadow 0.2s; }
.form-input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
</style>
</head>
<body class="antialiased">

<!-- Medical Cross SVG Defs -->
<svg style="position:absolute;width:0;height:0">
  <defs>
    <symbol id="med-cross" viewBox="0 0 24 24">
      <rect x="9" y="2" width="6" height="20" rx="1.5" fill="currentColor"/>
      <rect x="2" y="9" width="20" height="6" rx="1.5" fill="currentColor"/>
    </symbol>
  </defs>
</svg>

<!-- Nav -->
<nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-teal-50">
  <div class="max-w-7xl mx-auto px-8 flex items-center justify-between h-18" style="height:72px">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
        <svg class="w-5 h-5 text-white"><use href="#med-cross"/></svg>
      </div>
      <span class="font-display text-xl font-800 text-warm-800">MedCare</span>
      <span class="font-display text-xl font-400 text-warm-400">Clinic</span>
    </div>
    <div class="hidden md:flex items-center gap-8 text-sm font-medium text-warm-500">
      <a href="#departments" class="hover:text-teal-600 transition cursor-pointer">Departments</a>
      <a href="#doctors" class="hover:text-teal-600 transition cursor-pointer">Doctors</a>
      <a href="#appointment" class="hover:text-teal-600 transition cursor-pointer">Appointments</a>
      <a href="#insurance" class="hover:text-teal-600 transition cursor-pointer">Insurance</a>
      <a href="#footer" class="hover:text-emergency-600 transition cursor-pointer font-semibold">Emergency</a>
    </div>
    <div class="flex items-center gap-5">
      <a href="tel:+15551234567" class="hidden lg:flex items-center gap-2 text-sm text-warm-600 hover:text-teal-600 transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
        <span class="font-semibold">(555) 123-4567</span>
      </a>
      <button onclick="document.getElementById('appointment').scrollIntoView({behavior:'smooth'})" class="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-full text-sm font-bold font-display transition shadow-lg shadow-teal-600/20 cursor-pointer">Book Now</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="relative py-24 px-8 bg-white overflow-hidden">
  <!-- Cross decorations -->
  <div class="cross-deco top-12 left-12 opacity-[0.06]" style="transform:rotate(15deg)">
    <svg class="w-20 h-20 text-teal-600"><use href="#med-cross"/></svg>
  </div>
  <div class="cross-deco top-32 right-20 opacity-[0.04]" style="transform:rotate(-12deg)">
    <svg class="w-14 h-14 text-teal-600"><use href="#med-cross"/></svg>
  </div>
  <div class="cross-deco bottom-16 left-1/4 opacity-[0.05]" style="transform:rotate(25deg)">
    <svg class="w-10 h-10 text-teal-600"><use href="#med-cross"/></svg>
  </div>
  <div class="cross-deco bottom-24 right-12 opacity-[0.07]" style="transform:rotate(-20deg)">
    <svg class="w-16 h-16 text-teal-600"><use href="#med-cross"/></svg>
  </div>

  <div class="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative">
    <div class="flex-1 max-w-xl">
      <div class="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
        <svg class="w-3.5 h-3.5"><use href="#med-cross"/></svg>
        Trusted by 12,000+ Patients
      </div>
      <h1 class="font-display text-5xl font-800 text-warm-900 leading-tight mb-6">
        Your Health,<br>
        <span class="text-teal-600">Our Priority</span>
      </h1>
      <p class="text-warm-500 text-lg leading-relaxed mb-10 font-light">
        Comprehensive medical care with a personal touch. Our board-certified physicians combine cutting-edge technology with compassionate treatment to keep you and your family healthy.
      </p>
      <div class="flex flex-wrap gap-4">
        <button onclick="document.getElementById('appointment').scrollIntoView({behavior:'smooth'})" class="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-2xl text-sm font-bold font-display transition shadow-xl shadow-teal-600/25 cursor-pointer">
          Book Appointment
        </button>
        <a href="tel:911" class="flex items-center gap-2 border-2 border-emergency-500 text-emergency-600 hover:bg-emergency-500 hover:text-white px-8 py-4 rounded-2xl text-sm font-bold font-display transition cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          Emergency: Call 911
        </a>
      </div>
      <!-- Stats -->
      <div class="flex gap-10 mt-12 pt-8 border-t border-warm-100">
        <div>
          <div class="font-display text-2xl font-800 text-warm-800">25+</div>
          <div class="text-xs text-warm-400 mt-0.5">Years of Care</div>
        </div>
        <div>
          <div class="font-display text-2xl font-800 text-warm-800">50+</div>
          <div class="text-xs text-warm-400 mt-0.5">Specialists</div>
        </div>
        <div>
          <div class="font-display text-2xl font-800 text-warm-800">98%</div>
          <div class="text-xs text-warm-400 mt-0.5">Patient Satisfaction</div>
        </div>
      </div>
    </div>

    <!-- Hero Visual: Floating Cards -->
    <div class="flex-1 relative w-full max-w-lg h-96">
      <div class="absolute inset-0 bg-gradient-to-br from-teal-50 to-mint-100 rounded-3xl"></div>
      <!-- Main card -->
      <div class="absolute top-8 left-8 right-8 bg-white rounded-2xl shadow-xl shadow-teal-900/8 p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center">
            <svg class="w-7 h-7 text-teal-600"><use href="#med-cross"/></svg>
          </div>
          <div>
            <div class="font-display font-700 text-warm-800">Next Appointment</div>
            <div class="text-sm text-warm-400">Dr. Sarah Chen - Cardiology</div>
          </div>
        </div>
        <div class="bg-teal-50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div class="text-xs text-warm-400">Date & Time</div>
            <div class="font-display font-700 text-warm-800">Mar 15, 2:30 PM</div>
          </div>
          <div class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold font-display">Confirmed</div>
        </div>
      </div>
      <!-- Floating mini card -->
      <div class="absolute bottom-12 right-4 bg-white rounded-xl shadow-lg shadow-teal-900/8 p-4 w-48">
        <div class="flex items-center gap-2 mb-2">
          <span class="avail-dot avail-green"></span>
          <span class="text-xs font-semibold text-warm-700">3 Doctors Available</span>
        </div>
        <div class="text-xs text-warm-400">Walk-in welcome today</div>
      </div>
      <!-- Cross decoration on visual -->
      <div class="absolute -top-3 -right-3 opacity-10" style="transform:rotate(20deg)">
        <svg class="w-12 h-12 text-teal-600"><use href="#med-cross"/></svg>
      </div>
    </div>
  </div>
</section>

<!-- Cross Decoration Divider -->
<div class="relative py-6 flex items-center justify-center gap-6">
  <div class="h-px flex-1 bg-gradient-to-r from-transparent to-teal-100"></div>
  <svg class="w-5 h-5 text-teal-300 opacity-60" style="transform:rotate(15deg)"><use href="#med-cross"/></svg>
  <svg class="w-3 h-3 text-teal-200 opacity-40" style="transform:rotate(-10deg)"><use href="#med-cross"/></svg>
  <svg class="w-5 h-5 text-teal-300 opacity-60" style="transform:rotate(25deg)"><use href="#med-cross"/></svg>
  <div class="h-px flex-1 bg-gradient-to-l from-transparent to-teal-100"></div>
</div>

<!-- Departments -->
<section id="departments" class="py-20 px-8 bg-warm-50">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-14 reveal">
      <div class="inline-flex items-center gap-2 text-teal-600 text-xs font-bold font-display uppercase tracking-wider mb-3">
        <svg class="w-3.5 h-3.5"><use href="#med-cross"/></svg>
        Our Specialties
      </div>
      <h2 class="font-display text-3xl font-800 text-warm-800 mb-3">Medical Departments</h2>
      <p class="text-warm-400 max-w-md mx-auto">Expert care across a wide range of medical specialties, all under one roof.</p>
    </div>

    <!-- Department Filter -->
    <div class="flex justify-center gap-3 mb-10 reveal" id="deptFilter">
      <button class="dept-filter-btn active bg-teal-600 text-white px-5 py-2 rounded-full text-xs font-bold font-display transition cursor-pointer" data-filter="all">All</button>
      <button class="dept-filter-btn bg-white text-warm-500 px-5 py-2 rounded-full text-xs font-bold font-display transition border border-warm-200 hover:border-teal-300 cursor-pointer" data-filter="primary">Primary</button>
      <button class="dept-filter-btn bg-white text-warm-500 px-5 py-2 rounded-full text-xs font-bold font-display transition border border-warm-200 hover:border-teal-300 cursor-pointer" data-filter="specialist">Specialist</button>
      <button class="dept-filter-btn bg-white text-warm-500 px-5 py-2 rounded-full text-xs font-bold font-display transition border border-warm-200 hover:border-teal-300 cursor-pointer" data-filter="pediatric">Pediatric</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="deptGrid">
      <!-- General Medicine -->
      <div class="dept-card card-hover bg-white rounded-2xl p-7 border border-warm-100 reveal" data-dept="primary">
        <div class="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-5">
          <svg class="w-7 h-7 text-teal-600"><use href="#med-cross"/></svg>
        </div>
        <h3 class="font-display font-700 text-warm-800 text-lg mb-2">General Medicine</h3>
        <p class="text-warm-400 text-sm leading-relaxed mb-4">Comprehensive primary care for adults including preventive screenings, chronic disease management, and acute care.</p>
        <a href="#" class="text-teal-600 text-sm font-semibold hover:text-teal-700 transition inline-flex items-center gap-1 cursor-pointer">
          Learn More <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </a>
      </div>
      <!-- Cardiology -->
      <div class="dept-card card-hover bg-white rounded-2xl p-7 border border-warm-100 reveal" data-dept="specialist">
        <div class="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
          <svg class="w-7 h-7 text-red-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
        </div>
        <h3 class="font-display font-700 text-warm-800 text-lg mb-2">Cardiology</h3>
        <p class="text-warm-400 text-sm leading-relaxed mb-4">Advanced heart care with state-of-the-art diagnostics, including EKG, echocardiography, and stress testing.</p>
        <a href="#" class="text-teal-600 text-sm font-semibold hover:text-teal-700 transition inline-flex items-center gap-1 cursor-pointer">
          Learn More <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </a>
      </div>
      <!-- Orthopedics -->
      <div class="dept-card card-hover bg-white rounded-2xl p-7 border border-warm-100 reveal" data-dept="specialist">
        <div class="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
          <svg class="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
        </div>
        <h3 class="font-display font-700 text-warm-800 text-lg mb-2">Orthopedics</h3>
        <p class="text-warm-400 text-sm leading-relaxed mb-4">Bone, joint, and muscle care including sports medicine, fracture treatment, and physical rehabilitation.</p>
        <a href="#" class="text-teal-600 text-sm font-semibold hover:text-teal-700 transition inline-flex items-center gap-1 cursor-pointer">
          Learn More <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </a>
      </div>
      <!-- Pediatrics -->
      <div class="dept-card card-hover bg-white rounded-2xl p-7 border border-warm-100 reveal" data-dept="pediatric">
        <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
          <svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"/></svg>
        </div>
        <h3 class="font-display font-700 text-warm-800 text-lg mb-2">Pediatrics</h3>
        <p class="text-warm-400 text-sm leading-relaxed mb-4">Specialized care for infants, children, and adolescents. Vaccinations, developmental screening, and sick visits.</p>
        <a href="#" class="text-teal-600 text-sm font-semibold hover:text-teal-700 transition inline-flex items-center gap-1 cursor-pointer">
          Learn More <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </a>
      </div>
      <!-- Dermatology -->
      <div class="dept-card card-hover bg-white rounded-2xl p-7 border border-warm-100 reveal" data-dept="specialist">
        <div class="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center mb-5">
          <svg class="w-7 h-7 text-pink-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/></svg>
        </div>
        <h3 class="font-display font-700 text-warm-800 text-lg mb-2">Dermatology</h3>
        <p class="text-warm-400 text-sm leading-relaxed mb-4">Skin health expertise covering acne treatment, mole screening, eczema management, and cosmetic procedures.</p>
        <a href="#" class="text-teal-600 text-sm font-semibold hover:text-teal-700 transition inline-flex items-center gap-1 cursor-pointer">
          Learn More <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </a>
      </div>
      <!-- Neurology -->
      <div class="dept-card card-hover bg-white rounded-2xl p-7 border border-warm-100 reveal" data-dept="specialist">
        <div class="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-5">
          <svg class="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>
        </div>
        <h3 class="font-display font-700 text-warm-800 text-lg mb-2">Neurology</h3>
        <p class="text-warm-400 text-sm leading-relaxed mb-4">Brain and nervous system care including migraine treatment, epilepsy management, and cognitive assessments.</p>
        <a href="#" class="text-teal-600 text-sm font-semibold hover:text-teal-700 transition inline-flex items-center gap-1 cursor-pointer">
          Learn More <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Cross Decoration Divider -->
<div class="relative py-6 flex items-center justify-center gap-8 bg-white">
  <div class="h-px flex-1 bg-gradient-to-r from-transparent to-teal-100"></div>
  <svg class="w-4 h-4 text-teal-200 opacity-50" style="transform:rotate(-15deg)"><use href="#med-cross"/></svg>
  <svg class="w-6 h-6 text-teal-300 opacity-40" style="transform:rotate(30deg)"><use href="#med-cross"/></svg>
  <svg class="w-4 h-4 text-teal-200 opacity-50" style="transform:rotate(10deg)"><use href="#med-cross"/></svg>
  <div class="h-px flex-1 bg-gradient-to-l from-transparent to-teal-100"></div>
</div>

<!-- Doctors -->
<section id="doctors" class="py-20 px-8 bg-white relative overflow-hidden">
  <!-- Background crosses -->
  <div class="cross-deco top-10 right-16 opacity-[0.03]" style="transform:rotate(35deg)">
    <svg class="w-24 h-24 text-teal-600"><use href="#med-cross"/></svg>
  </div>
  <div class="cross-deco bottom-10 left-10 opacity-[0.04]" style="transform:rotate(-18deg)">
    <svg class="w-16 h-16 text-teal-600"><use href="#med-cross"/></svg>
  </div>

  <div class="max-w-7xl mx-auto relative">
    <div class="text-center mb-14 reveal">
      <div class="inline-flex items-center gap-2 text-teal-600 text-xs font-bold font-display uppercase tracking-wider mb-3">
        <svg class="w-3.5 h-3.5"><use href="#med-cross"/></svg>
        Expert Team
      </div>
      <h2 class="font-display text-3xl font-800 text-warm-800 mb-3">Our Doctors</h2>
      <p class="text-warm-400 max-w-md mx-auto">Board-certified physicians dedicated to providing exceptional patient care.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Doctor 1 -->
      <div class="card-hover bg-white rounded-2xl border border-warm-100 overflow-hidden reveal">
        <div class="h-48 bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center relative">
          <div class="w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center">
            <svg class="w-16 h-16 text-teal-300" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
          </div>
          <div class="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur rounded-full px-3 py-1">
            <span class="avail-dot avail-green"></span>
            <span class="text-xs font-semibold text-green-700">Available Today</span>
          </div>
        </div>
        <div class="p-6">
          <h3 class="font-display font-700 text-warm-800 text-lg">Dr. Sarah Chen</h3>
          <div class="text-teal-600 text-sm font-semibold mt-1">Cardiologist</div>
          <div class="text-warm-400 text-xs mt-1">MD, FACC | Johns Hopkins</div>
          <div class="flex flex-wrap gap-1.5 mt-4">
            <span class="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full text-xs font-medium">Heart Disease</span>
            <span class="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full text-xs font-medium">Hypertension</span>
            <span class="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full text-xs font-medium">Preventive</span>
          </div>
          <div class="mt-4 pt-4 border-t border-warm-100 flex items-center justify-between">
            <div class="text-xs text-warm-400">15+ years experience</div>
            <button onclick="document.getElementById('appointment').scrollIntoView({behavior:'smooth'})" class="text-teal-600 text-xs font-bold hover:text-teal-700 transition cursor-pointer">Book Visit</button>
          </div>
        </div>
      </div>

      <!-- Doctor 2 -->
      <div class="card-hover bg-white rounded-2xl border border-warm-100 overflow-hidden reveal">
        <div class="h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative">
          <div class="w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center">
            <svg class="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
          </div>
          <div class="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur rounded-full px-3 py-1">
            <span class="avail-dot avail-amber"></span>
            <span class="text-xs font-semibold text-amber-700">Limited Slots</span>
          </div>
        </div>
        <div class="p-6">
          <h3 class="font-display font-700 text-warm-800 text-lg">Dr. Michael Torres</h3>
          <div class="text-teal-600 text-sm font-semibold mt-1">Pediatrician</div>
          <div class="text-warm-400 text-xs mt-1">MD, FAAP | Stanford</div>
          <div class="flex flex-wrap gap-1.5 mt-4">
            <span class="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">Child Care</span>
            <span class="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">Vaccinations</span>
            <span class="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">Development</span>
          </div>
          <div class="mt-4 pt-4 border-t border-warm-100 flex items-center justify-between">
            <div class="text-xs text-warm-400">12+ years experience</div>
            <button onclick="document.getElementById('appointment').scrollIntoView({behavior:'smooth'})" class="text-teal-600 text-xs font-bold hover:text-teal-700 transition cursor-pointer">Book Visit</button>
          </div>
        </div>
      </div>

      <!-- Doctor 3 -->
      <div class="card-hover bg-white rounded-2xl border border-warm-100 overflow-hidden reveal">
        <div class="h-48 bg-gradient-to-br from-violet-50 to-violet-100 flex items-center justify-center relative">
          <div class="w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center">
            <svg class="w-16 h-16 text-violet-300" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
          </div>
          <div class="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur rounded-full px-3 py-1">
            <span class="avail-dot avail-green"></span>
            <span class="text-xs font-semibold text-green-700">Available Today</span>
          </div>
        </div>
        <div class="p-6">
          <h3 class="font-display font-700 text-warm-800 text-lg">Dr. Emily Nakamura</h3>
          <div class="text-teal-600 text-sm font-semibold mt-1">Neurologist</div>
          <div class="text-warm-400 text-xs mt-1">MD, PhD | Mayo Clinic</div>
          <div class="flex flex-wrap gap-1.5 mt-4">
            <span class="bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full text-xs font-medium">Migraines</span>
            <span class="bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full text-xs font-medium">Epilepsy</span>
            <span class="bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full text-xs font-medium">Cognitive</span>
          </div>
          <div class="mt-4 pt-4 border-t border-warm-100 flex items-center justify-between">
            <div class="text-xs text-warm-400">20+ years experience</div>
            <button onclick="document.getElementById('appointment').scrollIntoView({behavior:'smooth'})" class="text-teal-600 text-xs font-bold hover:text-teal-700 transition cursor-pointer">Book Visit</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Insurance -->
<section id="insurance" class="py-20 px-8 bg-warm-50">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-12 reveal">
      <div class="inline-flex items-center gap-2 text-teal-600 text-xs font-bold font-display uppercase tracking-wider mb-3">
        <svg class="w-3.5 h-3.5"><use href="#med-cross"/></svg>
        Insurance
      </div>
      <h2 class="font-display text-3xl font-800 text-warm-800 mb-3">We Accept</h2>
      <p class="text-warm-400 max-w-md mx-auto">We work with most major insurance providers. Contact us to verify your coverage.</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 reveal">
      <div class="bg-white rounded-2xl p-5 border border-warm-100 flex flex-col items-center justify-center gap-2 card-hover">
        <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <span class="text-blue-600 font-display font-800 text-sm">BC</span>
        </div>
        <span class="text-xs text-warm-500 font-semibold text-center">Blue Cross<br>Blue Shield</span>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-warm-100 flex flex-col items-center justify-center gap-2 card-hover">
        <div class="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
          <span class="text-red-600 font-display font-800 text-sm">AE</span>
        </div>
        <span class="text-xs text-warm-500 font-semibold text-center">Aetna</span>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-warm-100 flex flex-col items-center justify-center gap-2 card-hover">
        <div class="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
          <span class="text-orange-600 font-display font-800 text-sm">UH</span>
        </div>
        <span class="text-xs text-warm-500 font-semibold text-center">United<br>Healthcare</span>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-warm-100 flex flex-col items-center justify-center gap-2 card-hover">
        <div class="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
          <span class="text-teal-600 font-display font-800 text-sm">CG</span>
        </div>
        <span class="text-xs text-warm-500 font-semibold text-center">Cigna</span>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-warm-100 flex flex-col items-center justify-center gap-2 card-hover">
        <div class="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
          <span class="text-purple-600 font-display font-800 text-sm">HM</span>
        </div>
        <span class="text-xs text-warm-500 font-semibold text-center">Humana</span>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-warm-100 flex flex-col items-center justify-center gap-2 card-hover">
        <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
          <span class="text-green-600 font-display font-800 text-sm">KP</span>
        </div>
        <span class="text-xs text-warm-500 font-semibold text-center">Kaiser<br>Permanente</span>
      </div>
    </div>
    <div class="text-center mt-6 reveal">
      <p class="text-warm-400 text-sm">Don't see your insurance? <a href="#" class="text-teal-600 font-semibold hover:underline cursor-pointer">Contact us to check coverage</a></p>
    </div>
  </div>
</section>

<!-- Appointment Form -->
<section id="appointment" class="py-20 px-8 bg-white relative overflow-hidden">
  <!-- Cross decorations -->
  <div class="cross-deco top-16 left-8 opacity-[0.04]" style="transform:rotate(22deg)">
    <svg class="w-14 h-14 text-teal-600"><use href="#med-cross"/></svg>
  </div>
  <div class="cross-deco bottom-12 right-16 opacity-[0.05]" style="transform:rotate(-15deg)">
    <svg class="w-18 h-18 text-teal-600"><use href="#med-cross"/></svg>
  </div>

  <div class="max-w-3xl mx-auto relative">
    <div class="text-center mb-12 reveal">
      <div class="inline-flex items-center gap-2 text-teal-600 text-xs font-bold font-display uppercase tracking-wider mb-3">
        <svg class="w-3.5 h-3.5"><use href="#med-cross"/></svg>
        Schedule a Visit
      </div>
      <h2 class="font-display text-3xl font-800 text-warm-800 mb-3">Book an Appointment</h2>
      <p class="text-warm-400 max-w-md mx-auto">Fill out the form below and our team will confirm your appointment within 24 hours.</p>
    </div>

    <div class="bg-white rounded-3xl border border-warm-100 shadow-xl shadow-warm-900/5 p-8 md:p-10 reveal">
      <form onsubmit="event.preventDefault(); document.getElementById('formSuccess').classList.remove('hidden'); this.classList.add('hidden');">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Preferred Date -->
          <div>
            <label class="text-sm font-semibold text-warm-700 mb-2 block font-display">Preferred Date</label>
            <input type="date" class="form-input w-full border border-warm-200 rounded-xl px-4 py-3 text-sm outline-none text-warm-700">
          </div>
          <!-- Preferred Time -->
          <div>
            <label class="text-sm font-semibold text-warm-700 mb-2 block font-display">Preferred Time</label>
            <select class="form-input w-full border border-warm-200 rounded-xl px-4 py-3 text-sm outline-none text-warm-700 bg-white">
              <option>Morning (8:00 AM - 12:00 PM)</option>
              <option>Afternoon (12:00 PM - 5:00 PM)</option>
              <option>Evening (5:00 PM - 8:00 PM)</option>
            </select>
          </div>
          <!-- Department -->
          <div>
            <label class="text-sm font-semibold text-warm-700 mb-2 block font-display">Department</label>
            <select id="apptDept" onchange="updateDoctorOptions()" class="form-input w-full border border-warm-200 rounded-xl px-4 py-3 text-sm outline-none text-warm-700 bg-white">
              <option value="general">General Medicine</option>
              <option value="cardiology">Cardiology</option>
              <option value="orthopedics">Orthopedics</option>
              <option value="pediatrics">Pediatrics</option>
              <option value="dermatology">Dermatology</option>
              <option value="neurology">Neurology</option>
            </select>
          </div>
          <!-- Preferred Doctor -->
          <div>
            <label class="text-sm font-semibold text-warm-700 mb-2 block font-display">Preferred Doctor</label>
            <select id="apptDoctor" class="form-input w-full border border-warm-200 rounded-xl px-4 py-3 text-sm outline-none text-warm-700 bg-white">
              <option value="">No Preference</option>
              <option value="chen">Dr. Sarah Chen</option>
              <option value="torres">Dr. Michael Torres</option>
              <option value="nakamura">Dr. Emily Nakamura</option>
            </select>
          </div>
          <!-- Full Name -->
          <div>
            <label class="text-sm font-semibold text-warm-700 mb-2 block font-display">Full Name</label>
            <input type="text" placeholder="John Smith" class="form-input w-full border border-warm-200 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-warm-300">
          </div>
          <!-- Phone -->
          <div>
            <label class="text-sm font-semibold text-warm-700 mb-2 block font-display">Phone Number</label>
            <input type="tel" placeholder="(555) 000-0000" class="form-input w-full border border-warm-200 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-warm-300">
          </div>
          <!-- Email -->
          <div class="md:col-span-2">
            <label class="text-sm font-semibold text-warm-700 mb-2 block font-display">Email Address</label>
            <input type="email" placeholder="john@example.com" class="form-input w-full border border-warm-200 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-warm-300">
          </div>
          <!-- Reason -->
          <div class="md:col-span-2">
            <label class="text-sm font-semibold text-warm-700 mb-2 block font-display">Reason for Visit</label>
            <textarea rows="3" placeholder="Please briefly describe your symptoms or reason for the appointment..." class="form-input w-full border border-warm-200 rounded-xl px-4 py-3 text-sm outline-none resize-none placeholder:text-warm-300"></textarea>
          </div>
        </div>
        <button type="submit" class="mt-6 w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-bold font-display text-sm transition shadow-lg shadow-teal-600/20 cursor-pointer flex items-center justify-center gap-2">
          <svg class="w-4 h-4"><use href="#med-cross"/></svg>
          Request Appointment
        </button>
        <p class="text-xs text-warm-400 text-center mt-4">We'll confirm your appointment via email and SMS within 24 hours.</p>
      </form>
      <!-- Success state -->
      <div id="formSuccess" class="hidden text-center py-8">
        <div class="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M4.5 12.75l6 6 9-13.5"/></svg>
        </div>
        <h3 class="font-display font-700 text-warm-800 text-xl mb-2">Request Submitted!</h3>
        <p class="text-warm-400 text-sm max-w-sm mx-auto">Thank you for choosing MedCare Clinic. We'll reach out within 24 hours to confirm your appointment.</p>
      </div>
    </div>
  </div>
</section>

<!-- Footer with Emergency -->
<footer id="footer">
  <!-- Emergency Banner -->
  <div class="bg-emergency-600 py-8 px-8">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white"><use href="#med-cross"/></svg>
        </div>
        <div>
          <div class="font-display font-800 text-white text-lg">Medical Emergency?</div>
          <div class="text-white/80 text-sm">If you're experiencing a life-threatening emergency, call immediately.</div>
        </div>
      </div>
      <a href="tel:911" class="bg-white text-emergency-600 px-8 py-3 rounded-full font-bold font-display text-sm hover:bg-emergency-50 transition cursor-pointer flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
        Call 911
      </a>
    </div>
  </div>

  <!-- Main Footer -->
  <div class="bg-warm-900 py-16 px-8">
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
      <!-- Brand -->
      <div>
        <div class="flex items-center gap-3 mb-4">
          <div class="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-white"><use href="#med-cross"/></svg>
          </div>
          <span class="font-display text-xl font-800 text-white">MedCare</span>
        </div>
        <p class="text-warm-400 text-sm leading-relaxed">Providing comprehensive, compassionate healthcare to our community for over 25 years.</p>
        <div class="flex gap-3 mt-4">
          <a href="#" class="w-8 h-8 bg-warm-800 rounded-lg flex items-center justify-center text-warm-400 hover:text-white hover:bg-teal-600 transition cursor-pointer">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
          </a>
          <a href="#" class="w-8 h-8 bg-warm-800 rounded-lg flex items-center justify-center text-warm-400 hover:text-white hover:bg-teal-600 transition cursor-pointer">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
          </a>
          <a href="#" class="w-8 h-8 bg-warm-800 rounded-lg flex items-center justify-center text-warm-400 hover:text-white hover:bg-teal-600 transition cursor-pointer">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
        </div>
      </div>

      <!-- Hours -->
      <div>
        <h4 class="font-display font-700 text-white text-sm mb-4 uppercase tracking-wider">Clinic Hours</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between text-warm-400"><span>Mon - Fri</span><span class="text-white font-medium">8:00 AM - 8:00 PM</span></div>
          <div class="flex justify-between text-warm-400"><span>Saturday</span><span class="text-white font-medium">9:00 AM - 5:00 PM</span></div>
          <div class="flex justify-between text-warm-400"><span>Sunday</span><span class="text-white font-medium">10:00 AM - 2:00 PM</span></div>
          <div class="flex justify-between text-warm-400 pt-2 border-t border-warm-800"><span>Emergency</span><span class="text-emergency-500 font-bold">24/7</span></div>
        </div>
      </div>

      <!-- Departments -->
      <div>
        <h4 class="font-display font-700 text-white text-sm mb-4 uppercase tracking-wider">Departments</h4>
        <div class="space-y-2">
          <a href="#" class="block text-warm-400 text-sm hover:text-teal-400 transition cursor-pointer">General Medicine</a>
          <a href="#" class="block text-warm-400 text-sm hover:text-teal-400 transition cursor-pointer">Cardiology</a>
          <a href="#" class="block text-warm-400 text-sm hover:text-teal-400 transition cursor-pointer">Orthopedics</a>
          <a href="#" class="block text-warm-400 text-sm hover:text-teal-400 transition cursor-pointer">Pediatrics</a>
          <a href="#" class="block text-warm-400 text-sm hover:text-teal-400 transition cursor-pointer">Dermatology</a>
          <a href="#" class="block text-warm-400 text-sm hover:text-teal-400 transition cursor-pointer">Neurology</a>
        </div>
      </div>

      <!-- Directions -->
      <div>
        <h4 class="font-display font-700 text-white text-sm mb-4 uppercase tracking-wider">Find Us</h4>
        <div class="text-warm-400 text-sm leading-relaxed mb-3">
          1234 Healthcare Blvd, Suite 200<br>
          San Francisco, CA 94102
        </div>
        <a href="#" class="text-teal-400 text-sm font-semibold hover:text-teal-300 transition cursor-pointer inline-flex items-center gap-1">
          Get Directions
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"/></svg>
        </a>
        <div class="mt-4 pt-4 border-t border-warm-800">
          <div class="text-warm-500 text-xs mb-1">General Inquiries</div>
          <a href="tel:+15551234567" class="text-white font-semibold text-sm hover:text-teal-400 transition cursor-pointer">(555) 123-4567</a>
        </div>
        <div class="mt-2">
          <div class="text-warm-500 text-xs mb-1">Email</div>
          <a href="mailto:info@medcare.clinic" class="text-white font-semibold text-sm hover:text-teal-400 transition cursor-pointer">info@medcare.clinic</a>
        </div>
      </div>
    </div>

    <!-- Copyright -->
    <div class="max-w-7xl mx-auto mt-12 pt-8 border-t border-warm-800 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="text-warm-500 text-xs">&copy; 2026 MedCare Clinic. All rights reserved.</div>
      <div class="flex gap-6 text-xs text-warm-500">
        <a href="#" class="hover:text-warm-300 transition cursor-pointer">Privacy Policy</a>
        <a href="#" class="hover:text-warm-300 transition cursor-pointer">Terms of Service</a>
        <a href="#" class="hover:text-warm-300 transition cursor-pointer">HIPAA Notice</a>
        <a href="#" class="hover:text-warm-300 transition cursor-pointer">Accessibility</a>
      </div>
    </div>
  </div>
</footer>

<script>
// Scroll Reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Department Filter
const filterBtns = document.querySelectorAll('.dept-filter-btn');
const deptCards = document.querySelectorAll('#deptGrid > div');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => {
      b.classList.remove('bg-teal-600', 'text-white', 'active');
      b.classList.add('bg-white', 'text-warm-500', 'border', 'border-warm-200');
    });
    btn.classList.add('bg-teal-600', 'text-white', 'active');
    btn.classList.remove('bg-white', 'text-warm-500', 'border', 'border-warm-200');

    const filter = btn.dataset.filter;
    deptCards.forEach(card => {
      if (filter === 'all' || card.dataset.dept === filter) {
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

// Update doctor options based on department
function updateDoctorOptions() {
  const dept = document.getElementById('apptDept').value;
  const doctorSelect = document.getElementById('apptDoctor');
  const doctors = {
    general: [['', 'No Preference'], ['chen', 'Dr. Sarah Chen'], ['torres', 'Dr. Michael Torres']],
    cardiology: [['', 'No Preference'], ['chen', 'Dr. Sarah Chen']],
    orthopedics: [['', 'No Preference']],
    pediatrics: [['', 'No Preference'], ['torres', 'Dr. Michael Torres']],
    dermatology: [['', 'No Preference']],
    neurology: [['', 'No Preference'], ['nakamura', 'Dr. Emily Nakamura']]
  };
  doctorSelect.innerHTML = '';
  (doctors[dept] || [['', 'No Preference']]).forEach(([val, label]) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    doctorSelect.appendChild(opt);
  });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
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
