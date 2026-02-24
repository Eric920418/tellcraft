INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'e6c42cea-45c8-4055-9b5d-f55f8bf52cb7',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Grand Hotel</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{linen:'#d4c5a9',charcoal:'#1c1917',gold:'#b8860b',cream:'#faf7f2','cream-dark':'#f0ebe0','linen-light':'#e8dcc8'},fontFamily:{display:['Cinzel','serif'],body:['Lato','sans-serif']}}}}
</script>
<style>
body{font-family:'Lato',sans-serif}
html{scroll-behavior:smooth}
.reveal{opacity:0;transform:translateY(24px);transition:all 0.9s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.room-number{font-family:'Cinzel',serif;font-size:clamp(120px,15vw,200px);opacity:0.06;position:absolute;font-weight:700;line-height:1;pointer-events:none;user-select:none}
.amenity-strip{display:flex;gap:2rem;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;scroll-snap-type:x mandatory}
.amenity-strip::-webkit-scrollbar{display:none}
.amenity-item{scroll-snap-align:start;flex-shrink:0}
.nav-link{position:relative}
.nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:#b8860b;transition:width 0.3s ease}
.nav-link:hover::after{width:100%}
.gold-line{width:40px;height:1px;background:#b8860b}
@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.hero-anim{animation:fadeInUp 1.2s cubic-bezier(0.4,0,0.2,1) forwards}
.hero-anim-delay-1{animation-delay:0.3s;opacity:0}
.hero-anim-delay-2{animation-delay:0.6s;opacity:0}
.hero-anim-delay-3{animation-delay:0.9s;opacity:0}
.hero-anim-delay-4{animation-delay:1.2s;opacity:0}
</style>
</head>
<body class="bg-cream text-charcoal overflow-x-hidden">

<!-- Nav -->
<nav id="mainNav" class="fixed top-0 w-full z-50 transition-all duration-500">
  <div class="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
    <a href="#" class="text-center">
      <div class="font-display text-lg font-medium tracking-[0.25em] text-cream">THE GRAND</div>
      <div class="text-[8px] tracking-[0.5em] text-cream/50 uppercase font-light">New York</div>
    </a>
    <div class="hidden md:flex items-center gap-10">
      <a href="#rooms" class="nav-link text-xs tracking-[0.25em] text-cream/70 hover:text-cream transition-colors uppercase cursor-pointer">Rooms</a>
      <a href="#dining" class="nav-link text-xs tracking-[0.25em] text-cream/70 hover:text-cream transition-colors uppercase cursor-pointer">Dining</a>
      <a href="#amenities" class="nav-link text-xs tracking-[0.25em] text-cream/70 hover:text-cream transition-colors uppercase cursor-pointer">Spa</a>
      <a href="#experience" class="nav-link text-xs tracking-[0.25em] text-cream/70 hover:text-cream transition-colors uppercase cursor-pointer">Events</a>
    </div>
    <div class="flex items-center gap-6">
      <select class="bg-transparent text-xs tracking-wider text-cream/50 cursor-pointer focus:outline-none">
        <option class="bg-charcoal">EN</option>
        <option class="bg-charcoal">FR</option>
        <option class="bg-charcoal">JP</option>
        <option class="bg-charcoal">中文</option>
      </select>
      <button onclick="document.getElementById('reserveModal').classList.remove('hidden')" class="border border-gold/60 text-gold px-6 py-2 text-xs tracking-[0.25em] uppercase hover:bg-gold hover:text-charcoal transition-all duration-300 cursor-pointer">Reserve</button>
    </div>
    <!-- Mobile menu button -->
    <button id="mobileMenuBtn" class="md:hidden text-cream" onclick="document.getElementById('mobileMenu').classList.toggle('hidden')">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <!-- Mobile menu -->
  <div id="mobileMenu" class="hidden md:hidden bg-charcoal/95 backdrop-blur-md border-t border-cream/10">
    <div class="px-8 py-6 space-y-4">
      <a href="#rooms" class="block text-xs tracking-[0.25em] text-cream/70 uppercase cursor-pointer" onclick="document.getElementById('mobileMenu').classList.add('hidden')">Rooms</a>
      <a href="#dining" class="block text-xs tracking-[0.25em] text-cream/70 uppercase cursor-pointer" onclick="document.getElementById('mobileMenu').classList.add('hidden')">Dining</a>
      <a href="#amenities" class="block text-xs tracking-[0.25em] text-cream/70 uppercase cursor-pointer" onclick="document.getElementById('mobileMenu').classList.add('hidden')">Spa</a>
      <a href="#experience" class="block text-xs tracking-[0.25em] text-cream/70 uppercase cursor-pointer" onclick="document.getElementById('mobileMenu').classList.add('hidden')">Events</a>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="min-h-screen flex flex-col justify-center relative">
  <!-- Warm gradient background simulating hotel interior -->
  <div class="absolute inset-0 bg-gradient-to-b from-charcoal via-charcoal/95 to-charcoal/85"></div>
  <div class="absolute inset-0 bg-gradient-to-br from-linen/5 via-transparent to-gold/5"></div>
  <!-- Decorative warm texture lines -->
  <div class="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-linen/8 to-transparent"></div>
  <div class="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/6 to-transparent"></div>

  <!-- Room number watermark -->
  <div class="room-number top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cream">101</div>

  <div class="relative z-10 text-center px-8 mt-20">
    <div class="hero-anim">
      <div class="gold-line mx-auto mb-8"></div>
    </div>
    <div class="hero-anim hero-anim-delay-1">
      <div class="text-cream/30 text-[10px] tracking-[0.6em] uppercase mb-6 font-light">Est. 1924 &middot; New York</div>
    </div>
    <div class="hero-anim hero-anim-delay-2">
      <h1 class="font-display text-3xl md:text-4xl lg:text-5xl font-medium tracking-[0.3em] text-cream leading-relaxed">THE GRAND HOTEL</h1>
    </div>
    <div class="hero-anim hero-anim-delay-3">
      <p class="text-cream/25 text-xs tracking-[0.4em] uppercase mt-4 font-light">Where timeless elegance meets modern luxury</p>
    </div>
  </div>

  <!-- Check-in form at bottom -->
  <div class="relative z-10 mt-auto mb-12 px-8 hero-anim hero-anim-delay-4">
    <div class="max-w-4xl mx-auto">
      <div class="bg-cream/5 backdrop-blur-sm border border-cream/10 p-6 md:p-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-end">
          <div>
            <label class="text-[10px] tracking-[0.3em] text-cream/30 uppercase block mb-2">Arrival</label>
            <input type="date" class="w-full bg-transparent border-b border-cream/20 text-cream/70 text-sm pb-2 focus:outline-none focus:border-gold transition-colors cursor-pointer">
          </div>
          <div>
            <label class="text-[10px] tracking-[0.3em] text-cream/30 uppercase block mb-2">Departure</label>
            <input type="date" class="w-full bg-transparent border-b border-cream/20 text-cream/70 text-sm pb-2 focus:outline-none focus:border-gold transition-colors cursor-pointer">
          </div>
          <div>
            <label class="text-[10px] tracking-[0.3em] text-cream/30 uppercase block mb-2">Guests</label>
            <select class="w-full bg-transparent border-b border-cream/20 text-cream/70 text-sm pb-2 focus:outline-none focus:border-gold transition-colors cursor-pointer appearance-none">
              <option class="bg-charcoal">1 Adult</option>
              <option class="bg-charcoal" selected>2 Adults</option>
              <option class="bg-charcoal">2 Adults, 1 Child</option>
              <option class="bg-charcoal">3 Adults</option>
              <option class="bg-charcoal">4 Adults</option>
            </select>
          </div>
          <button onclick="showToast('Searching available rooms...')" class="bg-gold text-charcoal text-xs tracking-[0.25em] uppercase py-3 hover:bg-gold/80 transition-colors cursor-pointer font-medium">Check Availability</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Room Number Section (SIGNATURE) -->
<section id="rooms" class="py-28 bg-cream relative">
  <div class="room-number top-8 right-8 md:right-16 text-charcoal">301</div>
  <div class="max-w-6xl mx-auto px-8">
    <div class="text-center mb-20 reveal">
      <div class="text-gold text-[10px] tracking-[0.5em] uppercase mb-4">Accommodations</div>
      <h2 class="font-display text-2xl md:text-3xl tracking-[0.2em]">Rooms & Suites</h2>
      <div class="gold-line mx-auto mt-6"></div>
    </div>

    <!-- Room 1: Deluxe -->
    <div class="mb-20 reveal">
      <div class="relative">
        <div class="room-number -top-8 -left-4 text-charcoal" style="font-size:clamp(80px,10vw,140px)">301</div>
        <div class="aspect-[16/7] bg-gradient-to-br from-linen/60 via-linen/30 to-cream-dark rounded-sm overflow-hidden relative">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-32 h-20 border border-linen rounded-sm opacity-30"></div>
          </div>
          <div class="absolute bottom-6 left-8">
            <div class="text-[10px] tracking-[0.4em] uppercase text-charcoal/40 mb-1">Starting from</div>
            <div class="font-display text-lg tracking-wider">$350 <span class="text-xs text-charcoal/40 font-body">/ night</span></div>
          </div>
        </div>
        <div class="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h3 class="font-display text-xl tracking-[0.15em]">Deluxe Room</h3>
            <p class="text-charcoal/35 text-xs mt-2 tracking-wider leading-relaxed max-w-md">Refined comfort with city views. King bed, marble bathroom, and bespoke furnishings curated for the discerning traveler.</p>
          </div>
          <button onclick="document.getElementById('reserveModal').classList.remove('hidden')" class="text-gold text-[10px] tracking-[0.3em] uppercase border-b border-gold/40 pb-0.5 hover:border-gold transition-colors cursor-pointer whitespace-nowrap self-start md:self-auto">View Details</button>
        </div>
      </div>
    </div>

    <!-- Room 2: Suite -->
    <div class="mb-20 reveal">
      <div class="relative">
        <div class="room-number -top-8 -right-4 text-right text-charcoal" style="font-size:clamp(80px,10vw,140px)">507</div>
        <div class="aspect-[16/7] bg-gradient-to-bl from-linen-light/60 via-gold/5 to-cream-dark rounded-sm overflow-hidden relative">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-40 h-24 border border-gold/20 rounded-sm opacity-30"></div>
          </div>
          <div class="absolute bottom-6 right-8 text-right">
            <div class="text-[10px] tracking-[0.4em] uppercase text-charcoal/40 mb-1">Starting from</div>
            <div class="font-display text-lg tracking-wider">$650 <span class="text-xs text-charcoal/40 font-body">/ night</span></div>
          </div>
        </div>
        <div class="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h3 class="font-display text-xl tracking-[0.15em]">The Grand Suite</h3>
            <p class="text-charcoal/35 text-xs mt-2 tracking-wider leading-relaxed max-w-md">A sanctuary of space and light. Separate living area, panoramic windows, and a soaking tub with skyline views.</p>
          </div>
          <button onclick="document.getElementById('reserveModal').classList.remove('hidden')" class="text-gold text-[10px] tracking-[0.3em] uppercase border-b border-gold/40 pb-0.5 hover:border-gold transition-colors cursor-pointer whitespace-nowrap self-start md:self-auto">View Details</button>
        </div>
      </div>
    </div>

    <!-- Room 3: Penthouse -->
    <div class="reveal">
      <div class="relative">
        <div class="room-number -top-8 -left-4 text-charcoal" style="font-size:clamp(80px,10vw,140px)">PH</div>
        <div class="aspect-[16/7] bg-gradient-to-br from-gold/10 via-linen/20 to-cream-dark rounded-sm overflow-hidden relative">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-48 h-28 border border-gold/15 rounded-sm opacity-30"></div>
          </div>
          <div class="absolute top-6 right-8">
            <div class="bg-gold text-charcoal text-[9px] tracking-[0.3em] uppercase px-4 py-1.5 font-medium">Signature</div>
          </div>
          <div class="absolute bottom-6 left-8">
            <div class="text-[10px] tracking-[0.4em] uppercase text-charcoal/40 mb-1">Starting from</div>
            <div class="font-display text-lg tracking-wider">$1,200 <span class="text-xs text-charcoal/40 font-body">/ night</span></div>
          </div>
        </div>
        <div class="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h3 class="font-display text-xl tracking-[0.15em]">The Penthouse</h3>
            <p class="text-charcoal/35 text-xs mt-2 tracking-wider leading-relaxed max-w-md">The crown jewel. Private terrace, grand piano, personal butler, and uninterrupted views of Central Park.</p>
          </div>
          <button onclick="document.getElementById('reserveModal').classList.remove('hidden')" class="text-gold text-[10px] tracking-[0.3em] uppercase border-b border-gold/40 pb-0.5 hover:border-gold transition-colors cursor-pointer whitespace-nowrap self-start md:self-auto">View Details</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Amenities: Horizontal scroll strip -->
<section id="amenities" class="py-16 bg-charcoal relative overflow-hidden">
  <div class="room-number top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cream">205</div>
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-12 reveal">
      <div class="text-gold text-[10px] tracking-[0.5em] uppercase mb-4">Facilities</div>
      <h2 class="font-display text-2xl tracking-[0.2em] text-cream">Amenities</h2>
    </div>
    <div class="amenity-strip pb-4 reveal">
      <!-- Pool -->
      <div class="amenity-item flex flex-col items-center gap-3 min-w-[120px]">
        <div class="w-16 h-16 border border-cream/15 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-gold/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1"><path d="M2 12c1.5-1.5 3-2 4.5-1s3 1 4.5 0 3-1 4.5 0 3 1.5 4.5 0M2 17c1.5-1.5 3-2 4.5-1s3 1 4.5 0 3-1 4.5 0 3 1.5 4.5 0M12 3v6m-3-3h6"/></svg>
        </div>
        <span class="text-[9px] tracking-[0.3em] uppercase text-cream/40">Pool</span>
      </div>
      <!-- Spa -->
      <div class="amenity-item flex flex-col items-center gap-3 min-w-[120px]">
        <div class="w-16 h-16 border border-cream/15 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-gold/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1"><path d="M12 21c-4.97 0-9-2.686-9-6V9c0-3.314 4.03-6 9-6s9 2.686 9 6v6c0 3.314-4.03 6-9 6z"/><path d="M12 3c2 4 2 8 0 12M8 5c1 3 1 7 0 10M16 5c-1 3-1 7 0 10"/></svg>
        </div>
        <span class="text-[9px] tracking-[0.3em] uppercase text-cream/40">Spa</span>
      </div>
      <!-- Restaurant -->
      <div class="amenity-item flex flex-col items-center gap-3 min-w-[120px]">
        <div class="w-16 h-16 border border-cream/15 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-gold/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>
        </div>
        <span class="text-[9px] tracking-[0.3em] uppercase text-cream/40">Restaurant</span>
      </div>
      <!-- Bar -->
      <div class="amenity-item flex flex-col items-center gap-3 min-w-[120px]">
        <div class="w-16 h-16 border border-cream/15 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-gold/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1"><path d="M8 21h8M12 15v6M3 3h18l-4 8H7L3 3zM7 11l5 4 5-4"/></svg>
        </div>
        <span class="text-[9px] tracking-[0.3em] uppercase text-cream/40">Bar</span>
      </div>
      <!-- Fitness -->
      <div class="amenity-item flex flex-col items-center gap-3 min-w-[120px]">
        <div class="w-16 h-16 border border-cream/15 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-gold/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1"><path d="M6.5 6.5l11 11M2 12h4M18 12h4M6 8v8M18 8v8"/></svg>
        </div>
        <span class="text-[9px] tracking-[0.3em] uppercase text-cream/40">Fitness</span>
      </div>
      <!-- Concierge -->
      <div class="amenity-item flex flex-col items-center gap-3 min-w-[120px]">
        <div class="w-16 h-16 border border-cream/15 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-gold/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1"><path d="M12 15l-2-2m0 0l2-2m-2 2h8m-4-8a4 4 0 11-8 0 4 4 0 018 0z"/><circle cx="12" cy="7" r="4"/><path d="M5.5 21c.5-4 3-6 6.5-6s6 2 6.5 6"/></svg>
        </div>
        <span class="text-[9px] tracking-[0.3em] uppercase text-cream/40">Concierge</span>
      </div>
    </div>
  </div>
</section>

<!-- Dining -->
<section id="dining" class="py-28 bg-cream relative">
  <div class="room-number bottom-8 left-8 md:left-16 text-charcoal">412</div>
  <div class="max-w-5xl mx-auto px-8">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div class="reveal">
        <div class="text-gold text-[10px] tracking-[0.5em] uppercase mb-4">Culinary</div>
        <h2 class="font-display text-2xl md:text-3xl tracking-[0.15em] mb-6">The Linen Room</h2>
        <div class="gold-line mb-8"></div>
        <p class="text-charcoal/35 text-xs leading-relaxed tracking-wider mb-6 max-w-sm">
          Contemporary French cuisine reinterpreted through seasonal New York ingredients.
          Chef Laurent Beaumont brings two decades of Michelin experience to every plate.
        </p>
        <div class="space-y-3 mb-8">
          <div class="flex items-center gap-3">
            <div class="w-1 h-1 bg-gold rounded-full"></div>
            <span class="text-[10px] tracking-[0.3em] uppercase text-charcoal/40">French Contemporary</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-1 h-1 bg-gold rounded-full"></div>
            <span class="text-[10px] tracking-[0.3em] uppercase text-charcoal/40">Breakfast 7:00 &ndash; 10:30</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-1 h-1 bg-gold rounded-full"></div>
            <span class="text-[10px] tracking-[0.3em] uppercase text-charcoal/40">Dinner 18:00 &ndash; 22:00</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-1 h-1 bg-gold rounded-full"></div>
            <span class="text-[10px] tracking-[0.3em] uppercase text-charcoal/40">Reservations Required</span>
          </div>
        </div>
        <button onclick="showToast('Reservation request noted. Our concierge will confirm shortly.')" class="text-gold text-[10px] tracking-[0.3em] uppercase border-b border-gold/40 pb-0.5 hover:border-gold transition-colors cursor-pointer">Reserve a Table</button>
      </div>
      <div class="reveal">
        <div class="aspect-[4/5] bg-gradient-to-br from-linen/50 via-gold/5 to-cream-dark rounded-sm relative overflow-hidden">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-24 h-24 border border-gold/15 rounded-full"></div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-cream/40 to-transparent"></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Experience / Events -->
<section id="experience" class="py-28 bg-cream-dark relative">
  <div class="room-number top-12 right-8 md:right-16 text-charcoal">718</div>
  <div class="max-w-5xl mx-auto px-8">
    <div class="text-center mb-16 reveal">
      <div class="text-gold text-[10px] tracking-[0.5em] uppercase mb-4">Events</div>
      <h2 class="font-display text-2xl md:text-3xl tracking-[0.2em]">Curated Experiences</h2>
      <div class="gold-line mx-auto mt-6"></div>
    </div>
    <div class="grid md:grid-cols-3 gap-12 reveal">
      <div class="text-center">
        <div class="w-20 h-20 border border-linen rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg class="w-7 h-7 text-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </div>
        <h3 class="font-display text-sm tracking-[0.2em] mb-3">Private Events</h3>
        <p class="text-charcoal/30 text-xs leading-relaxed tracking-wider">Ballrooms and intimate salons for celebrations of every scale, from 10 to 300 guests.</p>
      </div>
      <div class="text-center">
        <div class="w-20 h-20 border border-linen rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg class="w-7 h-7 text-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1"><path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/></svg>
        </div>
        <h3 class="font-display text-sm tracking-[0.2em] mb-3">Jazz Evenings</h3>
        <p class="text-charcoal/30 text-xs leading-relaxed tracking-wider">Live jazz in The Gold Bar every Friday and Saturday, 8pm. Complimentary for hotel guests.</p>
      </div>
      <div class="text-center">
        <div class="w-20 h-20 border border-linen rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg class="w-7 h-7 text-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        </div>
        <h3 class="font-display text-sm tracking-[0.2em] mb-3">Spa Rituals</h3>
        <p class="text-charcoal/30 text-xs leading-relaxed tracking-wider">Bespoke wellness journeys. Signature treatments using botanicals and ancient techniques.</p>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="py-32 bg-charcoal relative overflow-hidden">
  <div class="room-number top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cream" style="font-size:clamp(150px,20vw,280px)">G</div>
  <div class="absolute inset-0 bg-gradient-to-b from-charcoal via-charcoal/95 to-charcoal"></div>
  <div class="relative z-10 text-center px-8 reveal">
    <div class="gold-line mx-auto mb-8"></div>
    <h2 class="font-display text-2xl md:text-3xl tracking-[0.3em] text-cream mb-4">Experience Luxury</h2>
    <p class="text-cream/20 text-xs tracking-[0.3em] uppercase mb-10 font-light">A century of hospitality excellence</p>
    <button onclick="document.getElementById('reserveModal').classList.remove('hidden')" class="bg-gold text-charcoal px-12 py-4 text-xs tracking-[0.3em] uppercase hover:bg-gold/80 transition-colors cursor-pointer font-medium">Make a Reservation</button>
  </div>
</section>

<!-- Footer -->
<footer class="bg-charcoal border-t border-cream/5 py-12">
  <div class="max-w-6xl mx-auto px-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-10">
      <div>
        <div class="font-display text-sm text-cream tracking-[0.25em] mb-3">THE GRAND HOTEL</div>
        <div class="text-cream/20 text-[10px] tracking-[0.3em] uppercase">Est. 1924</div>
        <div class="flex gap-1 mt-3">
          <span class="text-gold text-xs">&#9733;</span>
          <span class="text-gold text-xs">&#9733;</span>
          <span class="text-gold text-xs">&#9733;</span>
          <span class="text-gold text-xs">&#9733;</span>
          <span class="text-gold text-xs">&#9733;</span>
        </div>
      </div>
      <div>
        <div class="text-cream/15 text-[9px] tracking-[0.3em] uppercase mb-3">Contact</div>
        <div class="space-y-1.5 text-cream/30 text-xs tracking-wider">
          <p>768 Fifth Avenue, New York, NY 10019</p>
          <p>+1 (212) 759-3000</p>
          <p>reservations@thegrandhotel.com</p>
        </div>
      </div>
      <div>
        <div class="text-cream/15 text-[9px] tracking-[0.3em] uppercase mb-3">Follow</div>
        <div class="flex gap-5 text-cream/25 text-xs tracking-wider">
          <span class="hover:text-gold transition-colors cursor-pointer">Instagram</span>
          <span class="hover:text-gold transition-colors cursor-pointer">Facebook</span>
          <span class="hover:text-gold transition-colors cursor-pointer">Twitter</span>
        </div>
      </div>
    </div>
    <div class="border-t border-cream/5 pt-6 text-center">
      <p class="text-cream/10 text-[10px] tracking-[0.2em]">&copy; 2026 The Grand Hotel. All rights reserved.</p>
    </div>
  </div>
</footer>

<!-- Reservation Modal -->
<div id="reserveModal" class="hidden fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="bg-cream rounded-sm p-8 md:p-10 max-w-lg w-full max-h-[90vh] overflow-y-auto">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h3 class="font-display text-xl tracking-[0.15em]">Reserve</h3>
        <p class="text-charcoal/30 text-[10px] mt-1 tracking-[0.2em] uppercase">The Grand Hotel, New York</p>
      </div>
      <button onclick="document.getElementById('reserveModal').classList.add('hidden')" class="w-8 h-8 flex items-center justify-center text-charcoal/30 hover:text-charcoal cursor-pointer text-lg">&times;</button>
    </div>
    <div class="space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-[9px] tracking-[0.3em] text-charcoal/30 uppercase block mb-2">Arrival</label>
          <input type="date" class="w-full border border-charcoal/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold">
        </div>
        <div>
          <label class="text-[9px] tracking-[0.3em] text-charcoal/30 uppercase block mb-2">Departure</label>
          <input type="date" class="w-full border border-charcoal/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold">
        </div>
      </div>
      <div>
        <label class="text-[9px] tracking-[0.3em] text-charcoal/30 uppercase block mb-2">Room Type</label>
        <select class="w-full border border-charcoal/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold cursor-pointer">
          <option>Deluxe Room &mdash; from $350/night</option>
          <option>The Grand Suite &mdash; from $650/night</option>
          <option>The Penthouse &mdash; from $1,200/night</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-[9px] tracking-[0.3em] text-charcoal/30 uppercase block mb-2">Guests</label>
          <select class="w-full border border-charcoal/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold cursor-pointer">
            <option>1 Adult</option><option selected>2 Adults</option><option>3 Adults</option><option>4 Adults</option>
          </select>
        </div>
        <div>
          <label class="text-[9px] tracking-[0.3em] text-charcoal/30 uppercase block mb-2">Children</label>
          <select class="w-full border border-charcoal/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold cursor-pointer">
            <option>0</option><option>1</option><option>2</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <input type="text" placeholder="Full Name" class="border border-charcoal/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold">
        <input type="email" placeholder="Email" class="border border-charcoal/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold">
      </div>
      <textarea placeholder="Special requests (dietary, accessibility, occasion...)" rows="2" class="w-full border border-charcoal/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold resize-none"></textarea>
      <button onclick="document.getElementById('reserveModal').classList.add('hidden');showToast('Reservation request submitted. Confirmation within 24 hours.')" class="w-full bg-charcoal text-cream py-4 text-xs tracking-[0.25em] uppercase hover:bg-charcoal/80 transition-colors cursor-pointer">Submit Reservation</button>
      <p class="text-charcoal/20 text-[10px] text-center tracking-wider">Our concierge team will confirm availability and rate</p>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 bg-charcoal text-cream px-6 py-3.5 shadow-2xl z-50 translate-y-20 opacity-0 transition-all duration-500 text-xs tracking-[0.15em] rounded-sm"></div>

<script>
// Toast
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3500)}

// Scroll reveal
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}})},{threshold:0.08});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();const target=document.querySelector(a.getAttribute('href'));if(target){target.scrollIntoView({behavior:'smooth'});document.getElementById('mobileMenu')?.classList.add('hidden')}})});

// Nav scroll effect
const nav=document.getElementById('mainNav');
window.addEventListener('scroll',()=>{if(window.scrollY>100){nav.style.background='rgba(28,25,23,0.95)';nav.style.backdropFilter='blur(12px)'}else{nav.style.background='transparent';nav.style.backdropFilter='none'}});

// Set default dates
(function(){const today=new Date();const tomorrow=new Date(today);tomorrow.setDate(tomorrow.getDate()+1);const dayAfter=new Date(today);dayAfter.setDate(dayAfter.getDate()+3);const fmt=d=>d.toISOString().split('T')[0];document.querySelectorAll('input[type="date"]').forEach((el,i)=>{el.min=fmt(today);if(i%2===0)el.value=fmt(tomorrow);else el.value=fmt(dayAfter)})})();
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
