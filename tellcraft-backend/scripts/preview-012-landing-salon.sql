INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '82d6c3f8-7d80-4809-9e90-4115d131d283',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Luxe Salon</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        rosegold: { DEFAULT: '#b76e79', light: '#d4959e', dark: '#9a5561' },
        marble: { DEFAULT: '#f5f0eb', light: '#faf7f4', dark: '#ede8e3', deep: '#e5ddd6' },
        charcoal: { DEFAULT: '#1c1917', light: '#44403c', medium: '#292524' },
        blush: { DEFAULT: '#fce7f3', light: '#fdf2f8', dark: '#f9d5ea' }
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Raleway"', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Raleway', sans-serif; color: #1c1917; background: #f5f0eb; overflow-x: hidden; }

  /* Marble texture pattern */
  .marble-bg {
    background:
      linear-gradient(135deg, #f5f0eb 0%, #ede8e3 25%, #f5f0eb 50%, #e5ddd6 75%, #f5f0eb 100%);
  }
  .marble-subtle {
    background:
      linear-gradient(160deg, #faf7f4 0%, #f5f0eb 30%, #ede8e3 60%, #f5f0eb 100%);
  }
  .marble-card {
    background:
      linear-gradient(145deg, #faf7f4 0%, #f5f0eb 40%, #ede8e3 70%, #f5f0eb 100%);
  }

  /* Mirror shimmer animation */
  @keyframes shimmer {
    0% { transform: translateX(-150%) skewX(-20deg); }
    100% { transform: translateX(250%) skewX(-20deg); }
  }
  .shimmer-effect {
    position: relative;
    overflow: hidden;
  }
  .shimmer-effect::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 40%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(183, 110, 121, 0.06) 30%,
      rgba(255, 255, 255, 0.25) 50%,
      rgba(183, 110, 121, 0.06) 70%,
      transparent 100%
    );
    animation: shimmer 4s ease-in-out infinite;
    pointer-events: none;
  }

  /* Scroll reveal */
  .reveal { opacity: 0; transform: translateY(30px); transition: all 0.9s cubic-bezier(0.22, 1, 0.36, 1); }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-left { opacity: 0; transform: translateX(-40px); transition: all 0.9s cubic-bezier(0.22, 1, 0.36, 1); }
  .reveal-left.visible { opacity: 1; transform: translateX(0); }
  .reveal-right { opacity: 0; transform: translateX(40px); transition: all 0.9s cubic-bezier(0.22, 1, 0.36, 1); }
  .reveal-right.visible { opacity: 1; transform: translateX(0); }

  /* Nav scroll state */
  .nav-scrolled {
    background: rgba(245, 240, 235, 0.95) !important;
    backdrop-filter: blur(20px);
    box-shadow: 0 1px 30px rgba(28, 25, 23, 0.06);
  }

  /* Rose gold line accent */
  .rosegold-line {
    width: 48px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #b76e79, transparent);
  }

  /* Service card hover */
  .service-card {
    transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .service-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 60px rgba(183, 110, 121, 0.12);
  }
  .service-card:hover .service-icon {
    transform: scale(1.08);
  }
  .service-icon { transition: transform 0.4s ease; }

  /* Gallery masonry */
  .masonry-grid {
    columns: 3;
    column-gap: 16px;
  }
  @media (max-width: 768px) {
    .masonry-grid { columns: 2; }
  }
  .masonry-item {
    break-inside: avoid;
    margin-bottom: 16px;
    transition: all 0.4s ease;
    cursor: pointer;
  }
  .masonry-item:hover {
    transform: scale(1.02);
  }
  .masonry-item:hover .masonry-overlay {
    opacity: 1;
  }
  .masonry-overlay {
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  /* Team card */
  .team-card { transition: all 0.4s ease; }
  .team-card:hover { transform: translateY(-4px); }
  .team-card:hover .team-img { transform: scale(1.05); }
  .team-img { transition: transform 0.5s ease; }

  /* Booking form inputs */
  .form-input {
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .form-input:focus {
    border-color: #b76e79;
    box-shadow: 0 0 0 3px rgba(183, 110, 121, 0.1);
  }

  /* Toast */
  .toast {
    position: fixed; bottom: 2rem; right: 2rem;
    background: linear-gradient(135deg, #b76e79, #d4959e);
    color: #fff; padding: 1rem 1.5rem; border-radius: 12px;
    font-size: 0.875rem; font-weight: 500; z-index: 9999;
    transform: translateY(120%); opacity: 0;
    transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    box-shadow: 0 10px 40px rgba(183, 110, 121, 0.3);
    font-family: 'Raleway', sans-serif;
  }
  .toast.show { transform: translateY(0); opacity: 1; }

  /* Rose gold gradient button */
  .btn-rosegold {
    background: linear-gradient(135deg, #b76e79 0%, #d4959e 100%);
    transition: all 0.3s ease;
  }
  .btn-rosegold:hover {
    box-shadow: 0 8px 30px rgba(183, 110, 121, 0.35);
    transform: translateY(-1px);
  }

  /* Overlapping image offset */
  .overlap-offset {
    transform: translate(-40px, 20px);
  }
  @media (max-width: 1024px) {
    .overlap-offset { transform: translate(-20px, 12px); }
  }
</style>
</head>
<body>

<div id="toast" class="toast"></div>

<!-- Navigation -->
<nav id="navbar" class="fixed top-0 w-full z-50 transition-all duration-500">
  <div class="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2">
      <span class="font-display text-2xl font-semibold text-charcoal tracking-[0.15em]">Luxe Salon</span>
    </a>
    <div class="hidden md:flex items-center gap-10">
      <a href="#services" class="font-body text-sm font-light text-charcoal-light hover:text-rosegold transition-colors tracking-wide">Services</a>
      <a href="#gallery" class="font-body text-sm font-light text-charcoal-light hover:text-rosegold transition-colors tracking-wide">Gallery</a>
      <a href="#team" class="font-body text-sm font-light text-charcoal-light hover:text-rosegold transition-colors tracking-wide">Team</a>
      <a href="#booking" class="btn-rosegold text-white px-7 py-2.5 rounded-full text-sm font-medium tracking-wide cursor-pointer">
        Book Now
      </a>
    </div>
    <button onclick="toggleMobile()" class="md:hidden w-10 h-10 flex items-center justify-center cursor-pointer" aria-label="Menu">
      <svg id="menuIcon" class="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
  <!-- Mobile menu -->
  <div id="mobileMenu" class="hidden md:hidden marble-bg border-t border-rosegold/10 px-6 pb-6">
    <div class="flex flex-col gap-1 pt-4">
      <a href="#services" onclick="closeMobile()" class="py-3 font-body text-charcoal-light font-light tracking-wide">Services</a>
      <a href="#gallery" onclick="closeMobile()" class="py-3 font-body text-charcoal-light font-light tracking-wide">Gallery</a>
      <a href="#team" onclick="closeMobile()" class="py-3 font-body text-charcoal-light font-light tracking-wide">Team</a>
      <button onclick="smoothScroll('booking');closeMobile()" class="mt-3 btn-rosegold text-white py-3 rounded-full font-medium cursor-pointer">Book Now</button>
    </div>
  </div>
</nav>

<!-- Hero Section -->
<section class="relative pt-20 min-h-screen flex items-center marble-bg shimmer-effect overflow-hidden">
  <!-- Decorative blobs -->
  <div class="absolute top-20 right-0 w-[500px] h-[500px] bg-blush/30 rounded-full blur-[100px]"></div>
  <div class="absolute bottom-0 left-10 w-[300px] h-[300px] bg-rosegold/5 rounded-full blur-[80px]"></div>

  <div class="relative max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-0 w-full">
    <div class="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
      <!-- Left: Text -->
      <div class="reveal-left">
        <div class="flex items-center gap-3 mb-8">
          <div class="rosegold-line"></div>
          <span class="text-rosegold text-xs font-body tracking-[0.3em] uppercase font-medium">Luxury Beauty Experience</span>
        </div>
        <h1 class="font-display text-5xl lg:text-6xl xl:text-7xl text-charcoal leading-[1.1] mb-6 font-light">
          Elevate<br>Your
          <span class="italic text-rosegold font-light">Beauty</span>
        </h1>
        <p class="font-body text-charcoal-light/70 text-base lg:text-lg leading-relaxed mb-10 max-w-md font-light">
          Where artistry meets elegance. Our master stylists craft personalized beauty experiences in an atmosphere of refined luxury.
        </p>
        <div class="flex flex-wrap gap-4">
          <button onclick="smoothScroll('booking')" class="btn-rosegold text-white px-10 py-4 rounded-full font-body font-medium text-sm tracking-wider cursor-pointer">
            BOOK APPOINTMENT
          </button>
          <button onclick="smoothScroll('services')" class="border border-charcoal/15 hover:border-rosegold text-charcoal px-10 py-4 rounded-full font-body font-light text-sm tracking-wider transition-all cursor-pointer">
            OUR SERVICES
          </button>
        </div>
      </div>

      <!-- Right: Overlapping images -->
      <div class="relative hidden lg:flex justify-center items-center reveal-right">
        <!-- Large image (back) -->
        <div class="relative w-[340px] h-[440px] rounded-[2rem] overflow-hidden shadow-2xl shadow-charcoal/10 shimmer-effect">
          <div class="absolute inset-0 marble-card flex items-center justify-center">
            <div class="text-center">
              <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-rosegold/10 flex items-center justify-center">
                <svg class="w-8 h-8 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              </div>
              <p class="font-display text-charcoal/30 italic text-sm">Salon Interior</p>
            </div>
          </div>
          <div class="absolute top-0 left-0 w-full h-full border border-rosegold/10 rounded-[2rem] pointer-events-none"></div>
        </div>
        <!-- Small overlapping image (front) -->
        <div class="absolute overlap-offset w-[260px] h-[320px] rounded-[1.5rem] overflow-hidden shadow-xl shadow-charcoal/10 shimmer-effect" style="right: 0; bottom: -20px;">
          <div class="absolute inset-0 bg-gradient-to-br from-blush-light via-blush to-rosegold/10 flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-white/50 flex items-center justify-center">
                <svg class="w-7 h-7 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"/></svg>
              </div>
              <p class="font-display text-charcoal/30 italic text-sm">Styling Suite</p>
            </div>
          </div>
          <div class="absolute top-0 left-0 w-full h-full border border-rosegold/10 rounded-[1.5rem] pointer-events-none"></div>
        </div>
        <!-- Floating badge -->
        <div class="absolute -left-4 bottom-12 bg-white/90 backdrop-blur-md rounded-2xl px-5 py-4 shadow-lg shadow-charcoal/5 border border-rosegold/10">
          <div class="flex items-center gap-2 mb-1">
            <div class="flex -space-x-1">
              <div class="w-5 h-5 rounded-full bg-rosegold/30 border border-white"></div>
              <div class="w-5 h-5 rounded-full bg-blush border border-white"></div>
              <div class="w-5 h-5 rounded-full bg-rosegold/20 border border-white"></div>
            </div>
            <span class="text-[10px] font-body text-charcoal-light/50">500+ clients</span>
          </div>
          <div class="flex gap-0.5 text-rosegold text-xs">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom decorative marble vein -->
  <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rosegold/20 to-transparent"></div>
</section>

<!-- Services Section -->
<section id="services" class="py-28 bg-white relative">
  <div class="absolute inset-0 marble-subtle opacity-30"></div>
  <div class="relative max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-20 reveal">
      <div class="rosegold-line mx-auto mb-5"></div>
      <span class="text-rosegold text-xs font-body tracking-[0.3em] uppercase font-medium">Our Expertise</span>
      <h2 class="font-display text-4xl lg:text-5xl text-charcoal mt-4 font-light">Services</h2>
      <p class="font-body text-charcoal-light/50 mt-4 font-light max-w-md mx-auto">Curated beauty treatments designed to bring out your most radiant self.</p>
    </div>

    <div class="grid md:grid-cols-3 gap-8 reveal">
      <!-- Hair -->
      <div class="service-card marble-card rounded-3xl p-8 border border-rosegold/10 cursor-pointer relative shimmer-effect" style="margin-top: 0px;" onclick="showToast('View Hair services')">
        <div class="service-icon w-16 h-16 rounded-2xl bg-rosegold/10 flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"/></svg>
        </div>
        <h3 class="font-display text-2xl text-charcoal mb-2">Hair</h3>
        <p class="font-body text-charcoal-light/50 text-sm font-light leading-relaxed mb-6">
          Precision cuts, artful coloring, and transformative styling by our master colorists.
        </p>
        <div class="space-y-3 border-t border-rosegold/10 pt-6">
          <div class="flex justify-between items-center">
            <span class="font-body text-sm text-charcoal-light">Signature Cut</span>
            <span class="font-display text-lg text-rosegold">$85</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-body text-sm text-charcoal-light">Full Color</span>
            <span class="font-display text-lg text-rosegold">$180</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-body text-sm text-charcoal-light">Balayage</span>
            <span class="font-display text-lg text-rosegold">$250</span>
          </div>
        </div>
      </div>

      <!-- Skin -->
      <div class="service-card marble-card rounded-3xl p-8 border border-rosegold/10 cursor-pointer relative shimmer-effect" style="margin-top: 24px;" onclick="showToast('View Skin services')">
        <div class="service-icon w-16 h-16 rounded-2xl bg-blush/60 flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"/></svg>
        </div>
        <h3 class="font-display text-2xl text-charcoal mb-2">Skin</h3>
        <p class="font-body text-charcoal-light/50 text-sm font-light leading-relaxed mb-6">
          Rejuvenating facials and advanced skincare rituals for a luminous complexion.
        </p>
        <div class="space-y-3 border-t border-rosegold/10 pt-6">
          <div class="flex justify-between items-center">
            <span class="font-body text-sm text-charcoal-light">Luxe Facial</span>
            <span class="font-display text-lg text-rosegold">$120</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-body text-sm text-charcoal-light">Hydra Glow</span>
            <span class="font-display text-lg text-rosegold">$160</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-body text-sm text-charcoal-light">Anti-Age Ritual</span>
            <span class="font-display text-lg text-rosegold">$220</span>
          </div>
        </div>
      </div>

      <!-- Nails -->
      <div class="service-card marble-card rounded-3xl p-8 border border-rosegold/10 cursor-pointer relative shimmer-effect" style="margin-top: 48px;" onclick="showToast('View Nail services')">
        <div class="service-icon w-16 h-16 rounded-2xl bg-rosegold/8 flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"/></svg>
        </div>
        <h3 class="font-display text-2xl text-charcoal mb-2">Nails</h3>
        <p class="font-body text-charcoal-light/50 text-sm font-light leading-relaxed mb-6">
          Exquisite manicures and nail artistry that complement your personal style.
        </p>
        <div class="space-y-3 border-t border-rosegold/10 pt-6">
          <div class="flex justify-between items-center">
            <span class="font-body text-sm text-charcoal-light">Classic Manicure</span>
            <span class="font-display text-lg text-rosegold">$45</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-body text-sm text-charcoal-light">Gel Extensions</span>
            <span class="font-display text-lg text-rosegold">$75</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-body text-sm text-charcoal-light">Nail Art</span>
            <span class="font-display text-lg text-rosegold">$95</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Gallery Section (Masonry) -->
<section id="gallery" class="py-28 marble-bg relative">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-20 reveal">
      <div class="rosegold-line mx-auto mb-5"></div>
      <span class="text-rosegold text-xs font-body tracking-[0.3em] uppercase font-medium">Portfolio</span>
      <h2 class="font-display text-4xl lg:text-5xl text-charcoal mt-4 font-light">Gallery</h2>
    </div>

    <div class="masonry-grid reveal">
      <!-- Tall item -->
      <div class="masonry-item rounded-2xl overflow-hidden relative group" onclick="showToast('View: Balayage Collection')">
        <div class="aspect-[3/4] bg-gradient-to-br from-blush via-blush-dark to-rosegold/20 flex items-center justify-center">
          <div class="text-center">
            <div class="w-14 h-14 mx-auto mb-3 rounded-full bg-white/40 flex items-center justify-center">
              <svg class="w-6 h-6 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"/></svg>
            </div>
            <p class="font-display text-charcoal/40 italic text-sm">Balayage Collection</p>
          </div>
        </div>
        <div class="masonry-overlay absolute inset-0 bg-charcoal/40 flex items-end p-5">
          <span class="font-display text-white text-lg italic">Balayage</span>
        </div>
      </div>

      <!-- Short item -->
      <div class="masonry-item rounded-2xl overflow-hidden relative group" onclick="showToast('View: Bridal Updo')">
        <div class="aspect-square bg-gradient-to-br from-marble-dark to-rosegold/10 flex items-center justify-center">
          <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-rosegold/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
            </div>
            <p class="font-display text-charcoal/40 italic text-sm">Bridal Updo</p>
          </div>
        </div>
        <div class="masonry-overlay absolute inset-0 bg-charcoal/40 flex items-end p-5">
          <span class="font-display text-white text-lg italic">Bridal</span>
        </div>
      </div>

      <!-- Medium item -->
      <div class="masonry-item rounded-2xl overflow-hidden relative group" onclick="showToast('View: Nail Art')">
        <div class="aspect-[4/5] bg-gradient-to-br from-blush-light to-marble-deep flex items-center justify-center">
          <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-blush/50 flex items-center justify-center">
              <svg class="w-5 h-5 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
            </div>
            <p class="font-display text-charcoal/40 italic text-sm">Nail Art</p>
          </div>
        </div>
        <div class="masonry-overlay absolute inset-0 bg-charcoal/40 flex items-end p-5">
          <span class="font-display text-white text-lg italic">Nail Art</span>
        </div>
      </div>

      <!-- Square item -->
      <div class="masonry-item rounded-2xl overflow-hidden relative group" onclick="showToast('View: Color Correction')">
        <div class="aspect-square bg-gradient-to-br from-rosegold/15 via-blush to-marble flex items-center justify-center">
          <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-white/50 flex items-center justify-center">
              <svg class="w-5 h-5 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"/></svg>
            </div>
            <p class="font-display text-charcoal/40 italic text-sm">Color Correction</p>
          </div>
        </div>
        <div class="masonry-overlay absolute inset-0 bg-charcoal/40 flex items-end p-5">
          <span class="font-display text-white text-lg italic">Color</span>
        </div>
      </div>

      <!-- Tall item -->
      <div class="masonry-item rounded-2xl overflow-hidden relative group" onclick="showToast('View: Skincare Ritual')">
        <div class="aspect-[3/5] bg-gradient-to-br from-marble-light via-marble to-blush/30 flex items-center justify-center">
          <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-rosegold/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/></svg>
            </div>
            <p class="font-display text-charcoal/40 italic text-sm">Skincare Ritual</p>
          </div>
        </div>
        <div class="masonry-overlay absolute inset-0 bg-charcoal/40 flex items-end p-5">
          <span class="font-display text-white text-lg italic">Skincare</span>
        </div>
      </div>

      <!-- Wide item -->
      <div class="masonry-item rounded-2xl overflow-hidden relative group" onclick="showToast('View: Rose Gold Nails')">
        <div class="aspect-[5/4] bg-gradient-to-br from-rosegold/10 via-blush-light to-marble-dark flex items-center justify-center">
          <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-rosegold/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h.096c.5 0 .905.405.905.905 0 .714-.211 1.412-.608 2.006L4 14.25l1.904 4.5z"/></svg>
            </div>
            <p class="font-display text-charcoal/40 italic text-sm">Rose Gold Nails</p>
          </div>
        </div>
        <div class="masonry-overlay absolute inset-0 bg-charcoal/40 flex items-end p-5">
          <span class="font-display text-white text-lg italic">Nails</span>
        </div>
      </div>

      <!-- Short item -->
      <div class="masonry-item rounded-2xl overflow-hidden relative group" onclick="showToast('View: Luxury Blowout')">
        <div class="aspect-[4/3] bg-gradient-to-br from-blush to-rosegold/15 flex items-center justify-center">
          <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-white/50 flex items-center justify-center">
              <svg class="w-5 h-5 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/></svg>
            </div>
            <p class="font-display text-charcoal/40 italic text-sm">Luxury Blowout</p>
          </div>
        </div>
        <div class="masonry-overlay absolute inset-0 bg-charcoal/40 flex items-end p-5">
          <span class="font-display text-white text-lg italic">Blowout</span>
        </div>
      </div>

      <!-- Medium item -->
      <div class="masonry-item rounded-2xl overflow-hidden relative group" onclick="showToast('View: Spa Treatment')">
        <div class="aspect-[3/4] bg-gradient-to-br from-marble-deep via-marble to-blush/20 flex items-center justify-center">
          <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-rosegold/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/></svg>
            </div>
            <p class="font-display text-charcoal/40 italic text-sm">Spa Treatment</p>
          </div>
        </div>
        <div class="masonry-overlay absolute inset-0 bg-charcoal/40 flex items-end p-5">
          <span class="font-display text-white text-lg italic">Spa</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Team Section -->
<section id="team" class="py-28 bg-white relative">
  <div class="absolute inset-0 marble-subtle opacity-20"></div>
  <div class="relative max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-20 reveal">
      <div class="rosegold-line mx-auto mb-5"></div>
      <span class="text-rosegold text-xs font-body tracking-[0.3em] uppercase font-medium">Meet the Artists</span>
      <h2 class="font-display text-4xl lg:text-5xl text-charcoal mt-4 font-light">Our Team</h2>
    </div>

    <div class="grid md:grid-cols-3 gap-10 reveal">
      <!-- Stylist 1 -->
      <div class="team-card text-center cursor-pointer" onclick="showToast('Book with Isabelle')">
        <div class="w-48 h-48 mx-auto rounded-full overflow-hidden mb-6 border-2 border-rosegold/20 p-1">
          <div class="w-full h-full rounded-full bg-gradient-to-br from-blush via-rosegold/10 to-marble-deep flex items-center justify-center team-img">
            <div class="text-center">
              <div class="w-12 h-12 mx-auto rounded-full bg-white/50 flex items-center justify-center mb-1">
                <svg class="w-6 h-6 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
              </div>
            </div>
          </div>
        </div>
        <h3 class="font-display text-2xl text-charcoal font-light italic">Isabelle</h3>
        <p class="font-body text-rosegold text-xs tracking-[0.2em] uppercase mt-2 font-medium">Creative Director</p>
        <p class="font-body text-charcoal-light/50 text-sm mt-3 font-light max-w-[240px] mx-auto">Master colorist with 12 years of experience. Specializing in balayage and color correction.</p>
      </div>

      <!-- Stylist 2 -->
      <div class="team-card text-center cursor-pointer" onclick="showToast('Book with Camille')">
        <div class="w-48 h-48 mx-auto rounded-full overflow-hidden mb-6 border-2 border-rosegold/20 p-1">
          <div class="w-full h-full rounded-full bg-gradient-to-br from-marble-dark via-blush/30 to-rosegold/10 flex items-center justify-center team-img">
            <div class="text-center">
              <div class="w-12 h-12 mx-auto rounded-full bg-white/50 flex items-center justify-center mb-1">
                <svg class="w-6 h-6 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
              </div>
            </div>
          </div>
        </div>
        <h3 class="font-display text-2xl text-charcoal font-light italic">Camille</h3>
        <p class="font-body text-rosegold text-xs tracking-[0.2em] uppercase mt-2 font-medium">Senior Stylist</p>
        <p class="font-body text-charcoal-light/50 text-sm mt-3 font-light max-w-[240px] mx-auto">Precision cutting expert. Known for creating elegant, face-framing styles with effortless movement.</p>
      </div>

      <!-- Stylist 3 -->
      <div class="team-card text-center cursor-pointer" onclick="showToast('Book with Vivienne')">
        <div class="w-48 h-48 mx-auto rounded-full overflow-hidden mb-6 border-2 border-rosegold/20 p-1">
          <div class="w-full h-full rounded-full bg-gradient-to-br from-rosegold/10 via-blush-light to-marble flex items-center justify-center team-img">
            <div class="text-center">
              <div class="w-12 h-12 mx-auto rounded-full bg-white/50 flex items-center justify-center mb-1">
                <svg class="w-6 h-6 text-rosegold" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
              </div>
            </div>
          </div>
        </div>
        <h3 class="font-display text-2xl text-charcoal font-light italic">Vivienne</h3>
        <p class="font-body text-rosegold text-xs tracking-[0.2em] uppercase mt-2 font-medium">Skin &amp; Nail Specialist</p>
        <p class="font-body text-charcoal-light/50 text-sm mt-3 font-light max-w-[240px] mx-auto">Licensed aesthetician and nail artist. Transforming skincare routines and creating stunning nail designs.</p>
      </div>
    </div>
  </div>
</section>

<!-- Booking CTA Section -->
<section id="booking" class="py-28 relative overflow-hidden">
  <!-- Rose gold gradient background -->
  <div class="absolute inset-0 bg-gradient-to-br from-rosegold via-rosegold-dark to-charcoal-medium"></div>
  <div class="absolute inset-0 shimmer-effect"></div>
  <!-- Marble vein overlay -->
  <div class="absolute inset-0 opacity-5">
    <div class="absolute top-0 left-1/4 w-px h-full bg-white/30 rotate-12"></div>
    <div class="absolute top-0 left-2/4 w-px h-full bg-white/20 -rotate-6"></div>
    <div class="absolute top-0 left-3/4 w-px h-full bg-white/20 rotate-3"></div>
  </div>

  <div class="relative max-w-3xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-14 reveal">
      <div class="w-12 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mb-5"></div>
      <span class="text-white/70 text-xs font-body tracking-[0.3em] uppercase font-medium">Reservation</span>
      <h2 class="font-display text-4xl lg:text-5xl text-white mt-4 font-light">Book Your <span class="italic">Experience</span></h2>
      <p class="font-body text-white/50 mt-4 font-light">Reserve your appointment and begin your journey to elevated beauty.</p>
    </div>

    <form onsubmit="return handleBooking(event)" class="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-8 lg:p-12 reveal">
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label class="block text-sm text-white/70 mb-2 font-body font-light">Full Name *</label>
          <input type="text" id="bName" required placeholder="Your name"
            class="form-input w-full px-5 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 outline-none text-sm font-body font-light">
        </div>
        <div>
          <label class="block text-sm text-white/70 mb-2 font-body font-light">Service *</label>
          <select id="bService" required
            class="form-input w-full px-5 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white outline-none text-sm font-body cursor-pointer">
            <option value="" class="text-charcoal">Select service</option>
            <option value="Signature Cut" class="text-charcoal">Signature Cut - $85</option>
            <option value="Full Color" class="text-charcoal">Full Color - $180</option>
            <option value="Balayage" class="text-charcoal">Balayage - $250</option>
            <option value="Luxe Facial" class="text-charcoal">Luxe Facial - $120</option>
            <option value="Hydra Glow" class="text-charcoal">Hydra Glow - $160</option>
            <option value="Classic Manicure" class="text-charcoal">Classic Manicure - $45</option>
            <option value="Nail Art" class="text-charcoal">Nail Art - $95</option>
          </select>
        </div>
      </div>
      <div class="grid md:grid-cols-3 gap-6 mb-6">
        <div>
          <label class="block text-sm text-white/70 mb-2 font-body font-light">Date *</label>
          <input type="date" id="bDate" required
            class="form-input w-full px-5 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white outline-none text-sm font-body cursor-pointer">
        </div>
        <div>
          <label class="block text-sm text-white/70 mb-2 font-body font-light">Time *</label>
          <select id="bTime" required
            class="form-input w-full px-5 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white outline-none text-sm font-body cursor-pointer">
            <option value="" class="text-charcoal">Select time</option>
            <option value="10:00 AM" class="text-charcoal">10:00 AM</option>
            <option value="11:00 AM" class="text-charcoal">11:00 AM</option>
            <option value="12:00 PM" class="text-charcoal">12:00 PM</option>
            <option value="1:00 PM" class="text-charcoal">1:00 PM</option>
            <option value="2:00 PM" class="text-charcoal">2:00 PM</option>
            <option value="3:00 PM" class="text-charcoal">3:00 PM</option>
            <option value="4:00 PM" class="text-charcoal">4:00 PM</option>
            <option value="5:00 PM" class="text-charcoal">5:00 PM</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-white/70 mb-2 font-body font-light">Stylist</label>
          <select id="bStylist"
            class="form-input w-full px-5 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white outline-none text-sm font-body cursor-pointer">
            <option value="No preference" class="text-charcoal">No preference</option>
            <option value="Isabelle" class="text-charcoal">Isabelle</option>
            <option value="Camille" class="text-charcoal">Camille</option>
            <option value="Vivienne" class="text-charcoal">Vivienne</option>
          </select>
        </div>
      </div>
      <button type="submit"
        class="w-full bg-white text-rosegold py-4 rounded-full font-body font-semibold text-sm tracking-wider hover:bg-marble transition-all hover:shadow-lg cursor-pointer">
        CONFIRM BOOKING
      </button>
      <p class="text-xs text-white/30 text-center mt-4 font-body font-light">We will confirm your appointment via email within 2 hours.</p>
    </form>
  </div>
</section>

<!-- Footer -->
<footer class="py-16 bg-charcoal relative">
  <!-- Subtle marble texture overlay -->
  <div class="absolute inset-0 opacity-[0.03]" style="background: linear-gradient(135deg, #f5f0eb 25%, transparent 25%, transparent 50%, #f5f0eb 50%, #f5f0eb 75%, transparent 75%, transparent); background-size: 200px 200px;"></div>
  <div class="relative max-w-7xl mx-auto px-6 lg:px-8">
    <div class="flex flex-col md:flex-row justify-between items-start gap-12 pb-12 border-b border-white/8">
      <div>
        <span class="font-display text-2xl font-semibold text-white tracking-[0.15em]">Luxe Salon</span>
        <p class="font-body text-white/30 text-sm mt-3 font-light max-w-xs">Where artistry meets elegance. Elevating beauty since 2015.</p>
        <div class="flex gap-3 mt-6">
          <a href="#" class="w-9 h-9 rounded-full border border-white/10 hover:border-rosegold hover:bg-rosegold/10 flex items-center justify-center transition-all cursor-pointer" aria-label="Instagram">
            <svg class="w-4 h-4 text-white/50 hover:text-rosegold" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="#" class="w-9 h-9 rounded-full border border-white/10 hover:border-rosegold hover:bg-rosegold/10 flex items-center justify-center transition-all cursor-pointer" aria-label="Facebook">
            <svg class="w-4 h-4 text-white/50 hover:text-rosegold" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="#" class="w-9 h-9 rounded-full border border-white/10 hover:border-rosegold hover:bg-rosegold/10 flex items-center justify-center transition-all cursor-pointer" aria-label="Pinterest">
            <svg class="w-4 h-4 text-white/50 hover:text-rosegold" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>
          </a>
        </div>
      </div>
      <div class="flex gap-16">
        <div>
          <h4 class="font-body text-sm font-medium text-white/80 mb-4 tracking-wide">Hours</h4>
          <div class="font-body text-white/30 text-xs space-y-2 font-light">
            <p>Tue - Sat: 10am - 8pm</p>
            <p>Sunday: 10am - 5pm</p>
            <p>Monday: Closed</p>
          </div>
        </div>
        <div>
          <h4 class="font-body text-sm font-medium text-white/80 mb-4 tracking-wide">Contact</h4>
          <div class="font-body text-white/30 text-xs space-y-2 font-light">
            <p>123 Marble Avenue, Suite 200</p>
            <p>New York, NY 10001</p>
            <p>(212) 555-0188</p>
          </div>
        </div>
      </div>
    </div>
    <div class="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="font-body text-white/15 text-xs font-light">&copy; 2026 Luxe Salon. All rights reserved.</p>
      <div class="flex gap-6">
        <a href="#" class="font-body text-white/20 hover:text-rosegold/60 text-xs transition-colors cursor-pointer">Privacy</a>
        <a href="#" class="font-body text-white/20 hover:text-rosegold/60 text-xs transition-colors cursor-pointer">Terms</a>
      </div>
    </div>
  </div>
</footer>

<script>
// Toast notification
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// Mobile menu
function toggleMobile() {
  document.getElementById('mobileMenu').classList.toggle('hidden');
}
function closeMobile() {
  document.getElementById('mobileMenu').classList.add('hidden');
}

// Smooth scroll
function smoothScroll(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// Nav scroll effect
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  nav.classList.toggle('nav-scrolled', window.scrollY > 30);
});

// Scroll reveal - IntersectionObserver
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
  revealObserver.observe(el);
});

// Booking form handler
function handleBooking(e) {
  e.preventDefault();
  const name = document.getElementById('bName').value;
  const service = document.getElementById('bService').value;
  const date = document.getElementById('bDate').value;
  const time = document.getElementById('bTime').value;
  const stylist = document.getElementById('bStylist').value;

  if (!name || !service || !date || !time) {
    showToast('Please fill in all required fields');
    return false;
  }

  showToast('Booking confirmed! ' + name + ', ' + service + ' on ' + date + ' at ' + time + ' with ' + stylist);
  e.target.reset();
  return false;
}

// Set minimum date to tomorrow
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('bDate');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
  }
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
