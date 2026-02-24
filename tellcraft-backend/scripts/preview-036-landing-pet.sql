INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '4a41bc4a-13fb-4a03-a0f9-63c9526f1589',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PawPals — Your Pet's Happy Place</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        orange: { 50:'#fff7ed', 100:'#ffedd5', 200:'#fed7aa', 300:'#fdba74', 400:'#fb923c', 500:'#ea580c', 600:'#c2410c', 700:'#9a3412', 800:'#7c2d12', 900:'#78350f' },
        sunny: { 50:'#fefce8', 100:'#fef9c3', 200:'#fef08a', 300:'#fde047', 400:'#facc15', 500:'#eab308', 600:'#ca8a04', 700:'#a16207', 800:'#854d0e', 900:'#713f12' },
        cream: { 50:'#fffef7', 100:'#fef9c3', 200:'#fef3c7' },
        choco: { 50:'#fdf8f0', 100:'#f5e6d0', 200:'#e8cba0', 300:'#d4a574', 400:'#b8834e', 500:'#9a6a3a', 600:'#78350f', 700:'#5c2a0e', 800:'#451f0a', 900:'#331708' }
      },
      fontFamily: {
        display: ['Baloo 2', 'Nunito', 'sans-serif'],
        body: ['Nunito', 'sans-serif']
      },
      borderRadius: {
        'playful': '1.25rem',
        'blob': '2rem'
      }
    }
  }
}
</script>
<style>
  * { font-family: 'Nunito', sans-serif; }
  h1, h2, h3, .font-display { font-family: 'Baloo 2', 'Nunito', sans-serif; }
  html { scroll-behavior: smooth; }

  /* Paw print dark pattern background */
  .paw-bg {
    background-color: #fef9c3;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='%2378350f' fill-opacity='0.04'%3E%3Cellipse cx='30' cy='38' rx='8' ry='10'/%3E%3Ccircle cx='20' cy='24' r='5'/%3E%3Ccircle cx='40' cy='24' r='5'/%3E%3Ccircle cx='16' cy='34' r='4'/%3E%3Ccircle cx='44' cy='34' r='4'/%3E%3C/g%3E%3C/svg%3E");
  }

  /* Offset card rotations */
  .card-tilt-1 { transform: rotate(-2deg); }
  .card-tilt-2 { transform: rotate(1.5deg); }
  .card-tilt-3 { transform: rotate(-1deg); }
  .card-tilt-4 { transform: rotate(2.5deg); }
  .card-tilt-1:hover, .card-tilt-2:hover, .card-tilt-3:hover, .card-tilt-4:hover {
    transform: rotate(0deg) scale(1.03);
  }

  /* Gallery offsets */
  .gallery-offset-1 { transform: rotate(-3deg) translateY(20px); }
  .gallery-offset-2 { transform: rotate(2deg) translateY(-10px); }
  .gallery-offset-3 { transform: rotate(-1.5deg) translateY(30px); }
  .gallery-offset-4 { transform: rotate(2.5deg) translateY(-15px); }
  .gallery-offset-5 { transform: rotate(-2deg) translateY(10px); }

  /* Paw trail */
  .paw-trail-print {
    opacity: 0;
    transform: scale(0.5) rotate(var(--paw-rotate, 0deg));
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .paw-trail-print.visible {
    opacity: 1;
    transform: scale(1) rotate(var(--paw-rotate, 0deg));
  }

  /* Reveal animation */
  .reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Wiggle on hover */
  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    20% { transform: rotate(-4deg); }
    40% { transform: rotate(4deg); }
    60% { transform: rotate(-3deg); }
    80% { transform: rotate(3deg); }
  }
  .wiggle:hover { animation: wiggle 0.5s ease-in-out; }

  /* Float animation */
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-14px); }
  }
  .float { animation: float 3s ease-in-out infinite; }
  .float-delay { animation: float 3s ease-in-out 1.5s infinite; }

  /* Bounce for paw icon */
  @keyframes paw-bounce {
    0%, 100% { transform: translateY(0) rotate(-15deg); }
    50% { transform: translateY(-8px) rotate(-15deg); }
  }
  .paw-bounce { animation: paw-bounce 2s ease-in-out infinite; }
</style>
</head>
<body class="paw-bg text-choco-600 overflow-x-hidden">

<!-- SVG Paw Print Definition (reusable) -->
<svg class="hidden">
  <defs>
    <symbol id="paw-icon" viewBox="0 0 60 60">
      <ellipse cx="30" cy="40" rx="10" ry="12" fill="currentColor"/>
      <circle cx="18" cy="24" r="6" fill="currentColor"/>
      <circle cx="42" cy="24" r="6" fill="currentColor"/>
      <circle cx="13" cy="36" r="5" fill="currentColor"/>
      <circle cx="47" cy="36" r="5" fill="currentColor"/>
    </symbol>
  </defs>
</svg>

<!-- Navbar -->
<nav class="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-orange-100">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2">
      <svg class="w-8 h-8 text-orange-500" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
      <span class="text-2xl font-display font-extrabold text-choco-600">Paw<span class="text-orange-500">Pals</span></span>
    </a>
    <div class="hidden md:flex items-center gap-8 text-sm font-bold text-choco-400">
      <a href="#services" class="hover:text-orange-500 transition-colors">Services</a>
      <a href="#about" class="hover:text-orange-500 transition-colors">About</a>
      <a href="#gallery" class="hover:text-orange-500 transition-colors">Gallery</a>
      <a href="#contact" class="hover:text-orange-500 transition-colors">Contact</a>
    </div>
    <div class="flex items-center gap-3">
      <a href="#contact" class="bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-extrabold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/25 wiggle cursor-pointer">
        Book Now
      </a>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-choco-500">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-white border-t px-6 py-4 space-y-3">
    <a href="#services" class="block text-sm font-bold text-choco-500 hover:text-orange-500">Services</a>
    <a href="#about" class="block text-sm font-bold text-choco-500 hover:text-orange-500">About</a>
    <a href="#gallery" class="block text-sm font-bold text-choco-500 hover:text-orange-500">Gallery</a>
    <a href="#contact" class="block text-sm font-bold text-choco-500 hover:text-orange-500">Contact</a>
  </div>
</nav>

<!-- Hero -->
<section class="pt-24 pb-20 overflow-hidden relative">
  <!-- Large decorative paw -->
  <svg class="absolute top-16 right-0 w-72 h-72 text-orange-500/10 paw-bounce hidden md:block" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="absolute bottom-0 left-0 w-48 h-48 text-sunny-500/10 float hidden lg:block" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>

  <div class="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
    <div class="relative" style="transform: rotate(-1deg);">
      <div class="inline-flex items-center gap-2 bg-sunny-100 text-choco-600 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
        <svg class="w-4 h-4 text-orange-500" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
        Professional Pet Care
      </div>
      <h1 class="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold leading-tight mb-6 text-choco-600">
        Your Pet's<br>
        <span class="text-orange-500">Happy</span><br>
        <span class="text-sunny-500">Place</span>
      </h1>
      <p class="text-choco-400 text-lg mb-8 leading-relaxed font-semibold max-w-md">
        Professional pet care with love. Grooming, walking, boarding & training — all under one playful roof.
      </p>
      <div class="flex flex-wrap gap-4">
        <a href="#contact" class="bg-orange-500 text-white px-8 py-4 rounded-full font-extrabold text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:-translate-y-1 cursor-pointer inline-block">
          Book a Visit
        </a>
        <a href="#services" class="border-3 border-choco-200 text-choco-500 px-8 py-4 rounded-full font-extrabold text-lg hover:border-orange-300 hover:text-orange-600 transition-all cursor-pointer inline-block" style="border-width: 3px;">
          Our Services
        </a>
      </div>
    </div>
    <div class="relative flex justify-center">
      <div class="relative">
        <!-- Main circle -->
        <div class="w-72 h-72 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-orange-200 via-sunny-100 to-cream-100 flex items-center justify-center relative" style="transform: rotate(3deg);">
          <svg class="w-40 h-40 md:w-52 md:h-52 text-orange-500 float" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
          <!-- Floating decorations -->
          <div class="absolute -top-4 -right-4 w-16 h-16 bg-sunny-200 rounded-full flex items-center justify-center text-2xl font-display font-bold text-choco-600 float-delay shadow-lg">Woof!</div>
          <div class="absolute -bottom-2 -left-6 w-14 h-14 bg-orange-200 rounded-full flex items-center justify-center float shadow-lg">
            <svg class="w-7 h-7 text-orange-600" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
          </div>
          <div class="absolute top-8 -left-8 w-12 h-12 bg-cream-100 rounded-full flex items-center justify-center text-lg float-delay shadow-md border-2 border-sunny-200">
            <svg class="w-6 h-6 text-sunny-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Paw Trail Section 1 -->
<div class="relative h-32 overflow-hidden" id="paw-trail-1">
  <svg class="paw-trail-print absolute w-8 h-8 text-orange-400/40" style="left:10%; top:20%; --paw-rotate:-25deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-7 h-7 text-orange-400/30" style="left:22%; top:55%; --paw-rotate:-15deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-9 h-9 text-orange-400/35" style="left:35%; top:25%; --paw-rotate:-30deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-7 h-7 text-sunny-500/30" style="left:48%; top:60%; --paw-rotate:-10deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-8 h-8 text-orange-400/35" style="left:60%; top:20%; --paw-rotate:-35deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-6 h-6 text-sunny-500/25" style="left:72%; top:50%; --paw-rotate:-20deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-9 h-9 text-orange-400/30" style="left:85%; top:15%; --paw-rotate:-28deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
</div>

<!-- Services -->
<section id="services" class="py-20 bg-white/80 backdrop-blur-sm relative">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-orange-500 font-extrabold text-sm tracking-widest uppercase font-body">What We Do</span>
      <h2 class="text-4xl md:text-5xl font-display font-extrabold mt-3 text-choco-600">Our Services</h2>
      <p class="text-choco-400 mt-3 max-w-lg mx-auto font-semibold">Tail-wagging care for every furry friend</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <!-- Grooming -->
      <div class="reveal card-tilt-1 bg-gradient-to-br from-orange-50 to-sunny-50 rounded-blob p-7 shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-orange-100">
        <div class="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-5">
          <svg class="w-9 h-9 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/></svg>
        </div>
        <h3 class="font-display font-bold text-xl mb-2 text-choco-600">Grooming</h3>
        <p class="text-choco-400 text-sm leading-relaxed mb-3">Full spa treatment: bath, haircut, nail trim & ear cleaning. Your pet leaves looking fabulous.</p>
        <span class="inline-block text-orange-500 font-extrabold text-sm">From $45</span>
      </div>
      <!-- Walking -->
      <div class="reveal card-tilt-2 bg-gradient-to-br from-sunny-50 to-cream-100 rounded-blob p-7 shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-sunny-200">
        <div class="w-16 h-16 rounded-2xl bg-sunny-100 flex items-center justify-center mb-5">
          <svg class="w-9 h-9 text-sunny-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
        </div>
        <h3 class="font-display font-bold text-xl mb-2 text-choco-600">Walking</h3>
        <p class="text-choco-400 text-sm leading-relaxed mb-3">Daily adventures in the park with GPS tracking. Solo or group walks available.</p>
        <span class="inline-block text-sunny-600 font-extrabold text-sm">From $20/walk</span>
      </div>
      <!-- Boarding -->
      <div class="reveal card-tilt-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-blob p-7 shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-orange-100">
        <div class="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-5">
          <svg class="w-9 h-9 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        </div>
        <h3 class="font-display font-bold text-xl mb-2 text-choco-600">Boarding</h3>
        <p class="text-choco-400 text-sm leading-relaxed mb-3">A home away from home. Cozy suites, playtime, and 24/7 supervision while you're away.</p>
        <span class="inline-block text-orange-600 font-extrabold text-sm">From $55/night</span>
      </div>
      <!-- Training -->
      <div class="reveal card-tilt-4 bg-gradient-to-br from-sunny-50 to-orange-50 rounded-blob p-7 shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-sunny-200">
        <div class="w-16 h-16 rounded-2xl bg-sunny-100 flex items-center justify-center mb-5">
          <svg class="w-9 h-9 text-choco-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
        </div>
        <h3 class="font-display font-bold text-xl mb-2 text-choco-600">Training</h3>
        <p class="text-choco-400 text-sm leading-relaxed mb-3">Positive reinforcement methods. Puppy classes, obedience, and behavior correction.</p>
        <span class="inline-block text-choco-500 font-extrabold text-sm">From $65/session</span>
      </div>
    </div>
  </div>
</section>

<!-- Paw Trail Section 2 -->
<div class="relative h-28 overflow-hidden" id="paw-trail-2">
  <svg class="paw-trail-print absolute w-9 h-9 text-choco-600/15" style="left:8%; top:30%; --paw-rotate:15deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-7 h-7 text-orange-400/25" style="left:20%; top:60%; --paw-rotate:25deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-8 h-8 text-choco-600/12" style="left:33%; top:20%; --paw-rotate:10deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-10 h-10 text-sunny-500/20" style="left:47%; top:50%; --paw-rotate:30deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-7 h-7 text-orange-400/20" style="left:62%; top:15%; --paw-rotate:18deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-9 h-9 text-choco-600/10" style="left:78%; top:55%; --paw-rotate:22deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-8 h-8 text-sunny-500/18" style="left:90%; top:25%; --paw-rotate:12deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
</div>

<!-- About -->
<section id="about" class="py-20 bg-white/60">
  <div class="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-center">
    <div class="reveal">
      <span class="text-orange-500 font-extrabold text-sm tracking-widest uppercase">About Us</span>
      <h2 class="text-4xl md:text-5xl font-display font-extrabold mt-3 mb-6 text-choco-600">Why PawPals?</h2>
      <p class="text-choco-400 leading-relaxed mb-4 font-semibold text-lg">
        We started PawPals because we believe every pet deserves the same love and attention they give us. Our team of certified pet care professionals treats your furry family like our own.
      </p>
      <p class="text-choco-400 leading-relaxed mb-8">
        With over 10 years of experience and thousands of happy tails, we've built a space where pets feel at home and owners feel at ease.
      </p>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-orange-50 rounded-playful p-4 text-center border-2 border-orange-100" style="transform: rotate(-1deg);">
          <span class="block text-3xl font-display font-extrabold text-orange-500">2k+</span>
          <span class="text-xs font-bold text-choco-400">Happy Pets</span>
        </div>
        <div class="bg-sunny-50 rounded-playful p-4 text-center border-2 border-sunny-200" style="transform: rotate(1.5deg);">
          <span class="block text-3xl font-display font-extrabold text-sunny-600">10+</span>
          <span class="text-xs font-bold text-choco-400">Years Care</span>
        </div>
        <div class="bg-orange-50 rounded-playful p-4 text-center border-2 border-orange-100" style="transform: rotate(-2deg);">
          <span class="block text-3xl font-display font-extrabold text-choco-500">15</span>
          <span class="text-xs font-bold text-choco-400">Team Members</span>
        </div>
      </div>
    </div>
    <div class="reveal relative">
      <div class="grid grid-cols-2 gap-5">
        <div class="bg-gradient-to-br from-orange-200 to-sunny-100 rounded-blob h-48 flex items-center justify-center shadow-lg" style="transform: rotate(-3deg);">
          <svg class="w-20 h-20 text-orange-500/60" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
        </div>
        <div class="bg-gradient-to-br from-sunny-200 to-cream-100 rounded-blob h-56 flex items-center justify-center shadow-lg mt-8" style="transform: rotate(2deg);">
          <svg class="w-16 h-16 text-sunny-600/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        </div>
        <div class="bg-gradient-to-br from-cream-100 to-orange-100 rounded-blob h-52 flex items-center justify-center shadow-lg" style="transform: rotate(1.5deg);">
          <svg class="w-14 h-14 text-choco-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="bg-gradient-to-br from-orange-100 to-sunny-200 rounded-blob h-44 flex items-center justify-center shadow-lg -mt-4" style="transform: rotate(-2deg);">
          <svg class="w-16 h-16 text-orange-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Paw Trail Section 3 -->
<div class="relative h-28 overflow-hidden" id="paw-trail-3">
  <svg class="paw-trail-print absolute w-8 h-8 text-sunny-500/25" style="left:5%; top:45%; --paw-rotate:-20deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-10 h-10 text-orange-400/20" style="left:18%; top:15%; --paw-rotate:-35deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-7 h-7 text-choco-600/10" style="left:32%; top:55%; --paw-rotate:-12deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-9 h-9 text-orange-400/25" style="left:50%; top:20%; --paw-rotate:-28deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-8 h-8 text-sunny-500/20" style="left:65%; top:60%; --paw-rotate:-15deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-7 h-7 text-orange-400/18" style="left:80%; top:30%; --paw-rotate:-32deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-10 h-10 text-choco-600/12" style="left:93%; top:50%; --paw-rotate:-22deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
</div>

<!-- Gallery -->
<section id="gallery" class="py-20 bg-white/80">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-orange-500 font-extrabold text-sm tracking-widest uppercase">Happy Moments</span>
      <h2 class="text-4xl md:text-5xl font-display font-extrabold mt-3 text-choco-600">Our Gallery</h2>
      <p class="text-choco-400 mt-3 max-w-lg mx-auto font-semibold">Some of our favorite furry friends in action</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div class="gallery-offset-1 rounded-blob overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer col-span-1 row-span-1">
        <div class="h-48 bg-gradient-to-br from-orange-200 via-orange-100 to-sunny-100 flex items-center justify-center">
          <svg class="w-16 h-16 text-orange-400/50" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
        </div>
      </div>
      <div class="gallery-offset-2 rounded-blob overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer col-span-1 row-span-1 lg:col-span-2">
        <div class="h-56 bg-gradient-to-br from-sunny-200 via-sunny-100 to-cream-100 flex items-center justify-center">
          <svg class="w-20 h-20 text-sunny-500/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        </div>
      </div>
      <div class="gallery-offset-3 rounded-blob overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer">
        <div class="h-44 bg-gradient-to-br from-orange-100 to-cream-100 flex items-center justify-center">
          <svg class="w-12 h-12 text-choco-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
      </div>
      <div class="gallery-offset-4 rounded-blob overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer">
        <div class="h-52 bg-gradient-to-br from-cream-100 via-sunny-100 to-orange-100 flex items-center justify-center">
          <svg class="w-14 h-14 text-orange-500/40" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
        </div>
      </div>
      <div class="gallery-offset-5 rounded-blob overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer col-span-2 md:col-span-1">
        <div class="h-40 bg-gradient-to-br from-sunny-100 to-orange-200 flex items-center justify-center">
          <svg class="w-14 h-14 text-sunny-600/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
        </div>
      </div>
      <div class="gallery-offset-1 rounded-blob overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer col-span-2">
        <div class="h-44 bg-gradient-to-br from-orange-100 via-sunny-100 to-cream-200 flex items-center justify-center">
          <div class="flex items-center gap-3">
            <svg class="w-10 h-10 text-orange-400/50" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
            <svg class="w-8 h-8 text-sunny-500/40" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
            <svg class="w-12 h-12 text-choco-400/30" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Paw Trail Section 4 -->
<div class="relative h-24 overflow-hidden" id="paw-trail-4">
  <svg class="paw-trail-print absolute w-7 h-7 text-orange-400/30" style="left:12%; top:35%; --paw-rotate:8deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-9 h-9 text-sunny-500/22" style="left:28%; top:55%; --paw-rotate:-5deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-8 h-8 text-choco-600/10" style="left:45%; top:20%; --paw-rotate:15deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-10 h-10 text-orange-400/20" style="left:63%; top:50%; --paw-rotate:-18deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-7 h-7 text-sunny-500/28" style="left:82%; top:30%; --paw-rotate:25deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
</div>

<!-- Testimonials -->
<section class="py-20 bg-gradient-to-br from-orange-50 to-sunny-50">
  <div class="max-w-5xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-orange-500 font-extrabold text-sm tracking-widest uppercase">Testimonials</span>
      <h2 class="text-4xl md:text-5xl font-display font-extrabold mt-3 text-choco-600">Happy Tails</h2>
    </div>
    <div class="grid md:grid-cols-2 gap-8">
      <div class="reveal bg-white rounded-blob p-8 shadow-lg border-2 border-orange-100 relative" style="transform: rotate(-1deg);">
        <div class="absolute -top-5 -left-3">
          <svg class="w-10 h-10 text-orange-300/60" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
        </div>
        <div class="flex items-center gap-3 mb-4">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-orange-200 to-sunny-100 flex items-center justify-center shadow-md">
            <svg class="w-7 h-7 text-orange-500" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
          </div>
          <div>
            <span class="font-display font-bold text-lg text-choco-600">Luna</span>
            <div class="flex text-sunny-500 text-sm gap-0.5">
              <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
            </div>
          </div>
        </div>
        <p class="text-choco-400 leading-relaxed mb-4">
          "Luna absolutely loves going to PawPals! She gets so excited every time we pull into the parking lot. The groomers are gentle and patient, and Luna always comes home looking and smelling amazing. Best pet care in town!"
        </p>
        <span class="text-xs font-bold text-choco-300">- Sarah M., Luna's Human</span>
      </div>
      <div class="reveal bg-white rounded-blob p-8 shadow-lg border-2 border-sunny-200 relative" style="transform: rotate(1.5deg);">
        <div class="absolute -top-5 -right-3">
          <svg class="w-10 h-10 text-sunny-400/50" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
        </div>
        <div class="flex items-center gap-3 mb-4">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-sunny-200 to-orange-100 flex items-center justify-center shadow-md">
            <svg class="w-7 h-7 text-sunny-600" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
          </div>
          <div>
            <span class="font-display font-bold text-lg text-choco-600">Max</span>
            <div class="flex text-sunny-500 text-sm gap-0.5">
              <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
            </div>
          </div>
        </div>
        <p class="text-choco-400 leading-relaxed mb-4">
          "We boarded Max here for two weeks while on vacation and he had the time of his life! The daily photo updates put our minds at ease. Their training sessions also worked wonders on his leash behavior."
        </p>
        <span class="text-xs font-bold text-choco-300">- James & Amy, Max's Family</span>
      </div>
    </div>
  </div>
</section>

<!-- Paw Trail Section 5 -->
<div class="relative h-24 overflow-hidden" id="paw-trail-5">
  <svg class="paw-trail-print absolute w-8 h-8 text-orange-400/25" style="left:7%; top:40%; --paw-rotate:-30deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-9 h-9 text-choco-600/12" style="left:25%; top:15%; --paw-rotate:-18deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-7 h-7 text-sunny-500/22" style="left:42%; top:55%; --paw-rotate:-25deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-10 h-10 text-orange-400/18" style="left:58%; top:25%; --paw-rotate:-10deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-8 h-8 text-choco-600/15" style="left:75%; top:50%; --paw-rotate:-35deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="paw-trail-print absolute w-7 h-7 text-sunny-500/20" style="left:92%; top:20%; --paw-rotate:-8deg;" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
</div>

<!-- CTA + Booking Form -->
<section id="contact" class="py-20 bg-gradient-to-br from-choco-600 to-orange-900 text-white relative overflow-hidden">
  <!-- Background paw prints -->
  <svg class="absolute top-10 left-10 w-32 h-32 text-white/5" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="absolute bottom-10 right-10 w-40 h-40 text-white/5" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
  <svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 text-white/[0.02]" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>

  <div class="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-center relative z-10">
    <div class="reveal">
      <h2 class="text-4xl md:text-5xl font-display font-extrabold mb-6 leading-tight">
        Give Your Pet<br>the <span class="text-sunny-300">Best</span>
      </h2>
      <p class="text-orange-200 text-lg leading-relaxed mb-8">
        Book your visit today and let us show your furry friend what real pampering feels like. First-time visitors get 20% off!
      </p>
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          </div>
          <div>
            <p class="font-bold text-sm">Emergency Line</p>
            <p class="text-orange-200 text-sm">(555) PAW-9111 — 24/7</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div>
            <p class="font-bold text-sm">Location</p>
            <p class="text-orange-200 text-sm">123 Paw Street, Petville, CA 90210</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <p class="font-bold text-sm">Hours</p>
            <p class="text-orange-200 text-sm">Mon-Sat 8AM-7PM, Sun 9AM-5PM</p>
          </div>
        </div>
      </div>
    </div>
    <div class="reveal">
      <div class="bg-white rounded-blob p-8 text-choco-600 shadow-2xl" style="transform: rotate(1deg);">
        <h3 class="font-display font-extrabold text-2xl mb-2">Book a Visit</h3>
        <p class="text-choco-400 text-sm mb-6">Fill in the details and we'll confirm your appointment.</p>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-bold text-choco-500 mb-1 block">Pet's Name</label>
            <input type="text" placeholder="e.g. Luna, Max, Buddy..." class="w-full border-2 border-orange-100 rounded-playful px-4 py-3 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none bg-orange-50/30">
          </div>
          <div>
            <label class="text-sm font-bold text-choco-500 mb-1 block">Service</label>
            <select class="w-full border-2 border-orange-100 rounded-playful px-4 py-3 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none bg-orange-50/30 cursor-pointer">
              <option>Grooming</option>
              <option>Walking</option>
              <option>Boarding</option>
              <option>Training</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-bold text-choco-500 mb-1 block">Preferred Date</label>
            <input type="date" class="w-full border-2 border-orange-100 rounded-playful px-4 py-3 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none bg-orange-50/30">
          </div>
          <button onclick="showToast('Booking confirmed! We\'ll see your furry friend soon!')" class="w-full bg-orange-500 text-white py-3.5 rounded-playful font-extrabold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl wiggle cursor-pointer">
            Book Now
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-choco-600 text-orange-200 py-12" style="background-color: #3d1a08;">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex flex-col md:flex-row justify-between items-center gap-8">
      <div class="flex items-center gap-3">
        <svg class="w-8 h-8 text-orange-400" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
        <span class="text-xl font-display font-extrabold text-white">PawPals</span>
      </div>
      <div class="flex items-center gap-6 text-sm font-bold">
        <a href="#services" class="hover:text-orange-400 transition-colors">Services</a>
        <a href="#about" class="hover:text-orange-400 transition-colors">About</a>
        <a href="#gallery" class="hover:text-orange-400 transition-colors">Gallery</a>
        <a href="#contact" class="hover:text-orange-400 transition-colors">Contact</a>
      </div>
      <div class="flex gap-3">
        <a href="#" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-orange-500 transition-colors cursor-pointer">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <a href="#" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-orange-500 transition-colors cursor-pointer">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>
        </a>
        <a href="#" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-orange-500 transition-colors cursor-pointer">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </a>
      </div>
    </div>
    <div class="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="text-sm text-orange-300/60">&copy; 2026 PawPals. All rights reserved.</p>
      <div class="flex items-center gap-2 text-sm text-orange-300/60">
        <svg class="w-4 h-4" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
        <span>Made with love for pets everywhere</span>
        <svg class="w-4 h-4" viewBox="0 0 60 60"><use href="#paw-icon"/></svg>
      </div>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-choco-600 text-white px-6 py-3 rounded-playful shadow-2xl text-sm font-bold translate-y-20 opacity-0 transition-all duration-300 pointer-events-none" style="background-color: #78350f;"></div>

<script>
// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3000);
}

// Reveal on scroll
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// Paw trail — sequential reveal with stagger
const pawTrailObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const prints = e.target.querySelectorAll('.paw-trail-print');
      prints.forEach((p, i) => {
        setTimeout(() => p.classList.add('visible'), i * 150);
      });
      pawTrailObs.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('[id^="paw-trail-"]').forEach(el => pawTrailObs.observe(el));

// Mobile menu close on nav click
document.querySelectorAll('#mobile-menu a').forEach(a => {
  a.addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.add('hidden');
  });
});

// Card hover straighten (already handled by CSS, but add subtle scale for extra feel)
document.querySelectorAll('[class*="card-tilt-"]').forEach(card => {
  card.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease';
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
