INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '0a2f85be-5fd2-4a09-8bee-0c80b8935e92',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sterling & Associates | Attorneys at Law</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        leather: '#44240e',
        'leather-light': '#5c3317',
        gold: '#b8860b',
        'gold-light': '#d4a017',
        'gold-muted': '#a07608',
        parchment: '#fdf6e3',
        'parchment-dark': '#f5ead0',
        charcoal: '#1c1917',
        'warm-gray': '#44403c',
        'warm-gray-light': '#78716c',
        'warm-border': '#d6cfc7'
      },
      fontFamily: {
        display: ['EB Garamond', 'Georgia', 'serif'],
        body: ['Source Sans 3', 'system-ui', 'sans-serif']
      },
      maxWidth: {
        'document': '672px'
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Source Sans 3', system-ui, sans-serif;
    background: #fdf6e3;
    color: #1c1917;
  }

  /* Parchment texture hint */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 50%, rgba(68,36,14,0.03) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(184,134,11,0.02) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 80%, rgba(68,36,14,0.02) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  /* Gold horizontal rules */
  .gold-rule {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, #b8860b, transparent);
    margin: 0 auto;
  }

  /* Practice area rows */
  .practice-row {
    border-left: 3px solid transparent;
    transition: all 0.3s ease;
    cursor: pointer;
  }
  .practice-row:hover {
    border-left-color: #b8860b;
    background: rgba(184,134,11,0.04);
    padding-left: 1.5rem;
  }
  .practice-row:hover .practice-arrow {
    opacity: 1;
    transform: translateX(0);
  }
  .practice-arrow {
    opacity: 0;
    transform: translateX(-8px);
    transition: all 0.3s ease;
  }

  /* Form focus */
  .form-field:focus {
    outline: none;
    border-color: #b8860b;
    box-shadow: 0 0 0 2px rgba(184,134,11,0.1);
  }

  /* Scroll reveal */
  .reveal {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Mobile nav */
  .nav-open { max-height: 280px; opacity: 1; }
  .nav-closed { max-height: 0; opacity: 0; overflow: hidden; }
  #mobileNav { transition: max-height 0.3s ease, opacity 0.3s ease; }

  /* Quotation mark */
  .quote-mark {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 6rem;
    line-height: 1;
    color: #b8860b;
    opacity: 0.25;
  }

  /* Scale animation */
  @keyframes balanceScale {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(1.5deg); }
    75% { transform: rotate(-1.5deg); }
  }
  .scale-balance {
    animation: balanceScale 6s ease-in-out infinite;
    transform-origin: 50% 18px;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #fdf6e3; }
  ::-webkit-scrollbar-thumb { background: #d6cfc7; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #b8860b; }
</style>
</head>
<body class="relative">

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-parchment/95 backdrop-blur-sm border-b border-warm-border">
  <div class="max-w-document mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2">
      <div class="w-5 h-5 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b8860b" stroke-width="1.5" stroke-linecap="round">
          <line x1="12" y1="3" x2="12" y2="7"/>
          <line x1="4" y1="7" x2="20" y2="7"/>
          <line x1="6" y1="7" x2="4" y2="14"/>
          <line x1="18" y1="7" x2="20" y2="14"/>
          <path d="M2 14 a3 3 0 0 0 5 0" fill="none"/>
          <path d="M17 14 a3 3 0 0 0 5 0" fill="none"/>
          <line x1="12" y1="7" x2="12" y2="21"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
        </svg>
      </div>
      <span class="font-display text-lg font-semibold text-leather tracking-wide">Sterling & Associates</span>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#practice" class="font-body text-sm text-warm-gray-light hover:text-leather transition-colors">Practice Areas</a>
      <a href="#attorneys" class="font-body text-sm text-warm-gray-light hover:text-leather transition-colors">Attorneys</a>
      <a href="#results" class="font-body text-sm text-warm-gray-light hover:text-leather transition-colors">Results</a>
      <a href="#contact" class="font-body text-sm text-warm-gray-light hover:text-leather transition-colors">Contact</a>
      <button onclick="handleAction('Free Consultation')" class="px-5 py-2 bg-gold text-white text-sm font-body font-semibold hover:bg-gold-light transition-colors cursor-pointer">
        Free Consultation
      </button>
    </div>
    <button onclick="toggleMobileNav()" class="md:hidden text-warm-gray">
      <svg id="navIcon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
  <div id="mobileNav" class="nav-closed md:hidden bg-parchment border-t border-warm-border">
    <div class="max-w-document mx-auto px-6 py-4 space-y-3">
      <a href="#practice" onclick="toggleMobileNav()" class="block text-sm text-warm-gray hover:text-leather">Practice Areas</a>
      <a href="#attorneys" onclick="toggleMobileNav()" class="block text-sm text-warm-gray hover:text-leather">Attorneys</a>
      <a href="#results" onclick="toggleMobileNav()" class="block text-sm text-warm-gray hover:text-leather">Results</a>
      <a href="#contact" onclick="toggleMobileNav()" class="block text-sm text-warm-gray hover:text-leather">Contact</a>
      <button onclick="handleAction('Free Consultation'); toggleMobileNav();" class="w-full py-2.5 bg-gold text-white text-sm font-semibold cursor-pointer">Free Consultation</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="pt-24 pb-16 relative z-10">
  <div class="max-w-document mx-auto px-6">

    <!-- Justice Scale SVG -->
    <div class="flex justify-center mb-8 reveal">
      <svg class="scale-balance" width="80" height="72" viewBox="0 0 80 72" fill="none" stroke="#b8860b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
        <!-- Pillar -->
        <line x1="40" y1="18" x2="40" y2="62"/>
        <!-- Base -->
        <line x1="28" y1="62" x2="52" y2="62"/>
        <line x1="32" y1="65" x2="48" y2="65"/>
        <!-- Crown circle -->
        <circle cx="40" cy="14" r="4" fill="none"/>
        <!-- Beam -->
        <line x1="10" y1="18" x2="70" y2="18" stroke-width="1.5"/>
        <!-- Left chain -->
        <line x1="10" y1="18" x2="6" y2="36"/>
        <line x1="10" y1="18" x2="14" y2="36"/>
        <!-- Left pan -->
        <path d="M2 36 Q6 36 10 36 Q14 36 18 36" stroke-width="1"/>
        <path d="M2 36 C2 42 10 44 10 44 C10 44 18 42 18 36" fill="rgba(184,134,11,0.08)"/>
        <!-- Right chain -->
        <line x1="70" y1="18" x2="66" y2="36"/>
        <line x1="70" y1="18" x2="74" y2="36"/>
        <!-- Right pan -->
        <path d="M62 36 Q66 36 70 36 Q74 36 78 36" stroke-width="1"/>
        <path d="M62 36 C62 42 70 44 70 44 C70 44 78 42 78 36" fill="rgba(184,134,11,0.08)"/>
      </svg>
    </div>

    <hr class="gold-rule w-24 mb-8 reveal">

    <h1 class="font-display text-4xl md:text-5xl font-semibold text-charcoal text-center leading-tight tracking-wide reveal">
      Justice. Integrity. Results.
    </h1>

    <hr class="gold-rule w-24 mt-8 mb-8 reveal">

    <p class="font-body text-base md:text-lg text-warm-gray text-center leading-relaxed max-w-lg mx-auto reveal">
      For over 35 years, Sterling & Associates has provided distinguished legal counsel to individuals and businesses. Our commitment to principled advocacy has earned the trust of clients across the nation.
    </p>

    <div class="flex justify-center mt-8 reveal">
      <button onclick="handleAction('Schedule Free Consultation')" class="px-8 py-3 bg-gold text-white font-body font-semibold text-sm hover:bg-gold-light transition-colors cursor-pointer tracking-wide">
        Schedule a Free Consultation
      </button>
    </div>
  </div>
</section>

<hr class="gold-rule w-full max-w-document mx-auto">

<!-- Practice Areas -->
<section id="practice" class="py-16 relative z-10">
  <div class="max-w-document mx-auto px-6">
    <p class="font-body text-xs text-gold tracking-[0.2em] uppercase text-center mb-2 reveal">Practice Areas</p>
    <h2 class="font-display text-3xl font-semibold text-charcoal text-center mb-10 reveal">Areas of Expertise</h2>

    <div class="space-y-0 reveal">
      <!-- Corporate Law -->
      <div class="practice-row py-5 px-4 border-b border-warm-border flex items-start justify-between gap-4" onclick="handleAction('Corporate Law')">
        <div>
          <h3 class="font-display text-xl font-semibold text-leather mb-1">Corporate Law</h3>
          <p class="font-body text-sm text-warm-gray-light leading-relaxed">Mergers & acquisitions, corporate governance, securities compliance, and business formation for enterprises of all sizes.</p>
        </div>
        <span class="practice-arrow text-gold mt-1 flex-shrink-0">&rarr;</span>
      </div>

      <!-- Litigation -->
      <div class="practice-row py-5 px-4 border-b border-warm-border flex items-start justify-between gap-4" onclick="handleAction('Litigation')">
        <div>
          <h3 class="font-display text-xl font-semibold text-leather mb-1">Litigation</h3>
          <p class="font-body text-sm text-warm-gray-light leading-relaxed">Complex commercial disputes, class actions, appellate advocacy, and alternative dispute resolution with a proven track record.</p>
        </div>
        <span class="practice-arrow text-gold mt-1 flex-shrink-0">&rarr;</span>
      </div>

      <!-- Real Estate -->
      <div class="practice-row py-5 px-4 border-b border-warm-border flex items-start justify-between gap-4" onclick="handleAction('Real Estate')">
        <div>
          <h3 class="font-display text-xl font-semibold text-leather mb-1">Real Estate</h3>
          <p class="font-body text-sm text-warm-gray-light leading-relaxed">Commercial and residential transactions, zoning and land use, construction law, and real estate investment structuring.</p>
        </div>
        <span class="practice-arrow text-gold mt-1 flex-shrink-0">&rarr;</span>
      </div>

      <!-- Estate Planning -->
      <div class="practice-row py-5 px-4 border-b border-warm-border flex items-start justify-between gap-4" onclick="handleAction('Estate Planning')">
        <div>
          <h3 class="font-display text-xl font-semibold text-leather mb-1">Estate Planning</h3>
          <p class="font-body text-sm text-warm-gray-light leading-relaxed">Wills and trusts, probate administration, wealth preservation strategies, and multigenerational asset protection planning.</p>
        </div>
        <span class="practice-arrow text-gold mt-1 flex-shrink-0">&rarr;</span>
      </div>

      <!-- Criminal Defense -->
      <div class="practice-row py-5 px-4 border-b border-warm-border flex items-start justify-between gap-4" onclick="handleAction('Criminal Defense')">
        <div>
          <h3 class="font-display text-xl font-semibold text-leather mb-1">Criminal Defense</h3>
          <p class="font-body text-sm text-warm-gray-light leading-relaxed">White-collar crime, federal investigations, DUI defense, and aggressive courtroom advocacy to protect your rights and freedom.</p>
        </div>
        <span class="practice-arrow text-gold mt-1 flex-shrink-0">&rarr;</span>
      </div>
    </div>
  </div>
</section>

<hr class="gold-rule w-full max-w-document mx-auto">

<!-- Results -->
<section id="results" class="py-16 relative z-10">
  <div class="max-w-document mx-auto px-6 text-center">
    <p class="font-body text-xs text-gold tracking-[0.2em] uppercase mb-2 reveal">Track Record</p>
    <h2 class="font-display text-3xl font-semibold text-charcoal mb-12 reveal">Results That Speak</h2>

    <div class="space-y-10 reveal">
      <div>
        <div class="font-display text-5xl md:text-6xl font-bold text-leather">$150M+</div>
        <div class="font-body text-sm text-warm-gray-light mt-2 tracking-wide uppercase">Recovered for Clients</div>
        <hr class="gold-rule w-16 mt-4">
      </div>

      <div>
        <div class="font-display text-5xl md:text-6xl font-bold text-leather">2,000+</div>
        <div class="font-body text-sm text-warm-gray-light mt-2 tracking-wide uppercase">Cases Won</div>
        <hr class="gold-rule w-16 mt-4">
      </div>

      <div>
        <div class="font-display text-5xl md:text-6xl font-bold text-leather">35+</div>
        <div class="font-body text-sm text-warm-gray-light mt-2 tracking-wide uppercase">Years of Experience</div>
      </div>
    </div>
  </div>
</section>

<hr class="gold-rule w-full max-w-document mx-auto">

<!-- Attorneys -->
<section id="attorneys" class="py-16 relative z-10">
  <div class="max-w-document mx-auto px-6">
    <p class="font-body text-xs text-gold tracking-[0.2em] uppercase text-center mb-2 reveal">Our Team</p>
    <h2 class="font-display text-3xl font-semibold text-charcoal text-center mb-10 reveal">Meet Our Attorneys</h2>

    <div class="space-y-8">
      <!-- Attorney 1 -->
      <div class="flex items-start gap-6 reveal">
        <div class="w-24 h-28 flex-shrink-0 bg-gradient-to-b from-leather/10 to-leather/5 border border-warm-border flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#44240e" stroke-width="1" opacity="0.4"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
        </div>
        <div>
          <h3 class="font-display text-xl font-semibold text-charcoal">Robert J. Sterling</h3>
          <p class="font-body text-sm text-gold font-medium mb-2">Founding Partner</p>
          <p class="font-body text-sm text-warm-gray-light leading-relaxed mb-1">Harvard Law School, J.D. | Georgetown University, B.A.</p>
          <p class="font-body text-xs text-warm-gray-light">Admitted: New York State Bar, U.S. District Court (SDNY), U.S. Supreme Court</p>
        </div>
      </div>

      <hr class="gold-rule w-12">

      <!-- Attorney 2 -->
      <div class="flex items-start gap-6 reveal">
        <div class="w-24 h-28 flex-shrink-0 bg-gradient-to-b from-leather/10 to-leather/5 border border-warm-border flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#44240e" stroke-width="1" opacity="0.4"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
        </div>
        <div>
          <h3 class="font-display text-xl font-semibold text-charcoal">Catherine A. Monroe</h3>
          <p class="font-body text-sm text-gold font-medium mb-2">Senior Partner, Litigation</p>
          <p class="font-body text-sm text-warm-gray-light leading-relaxed mb-1">Yale Law School, J.D. | University of Virginia, B.A.</p>
          <p class="font-body text-xs text-warm-gray-light">Admitted: New York State Bar, Connecticut Bar, U.S. Court of Appeals (2nd Circuit)</p>
        </div>
      </div>

      <hr class="gold-rule w-12">

      <!-- Attorney 3 -->
      <div class="flex items-start gap-6 reveal">
        <div class="w-24 h-28 flex-shrink-0 bg-gradient-to-b from-leather/10 to-leather/5 border border-warm-border flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#44240e" stroke-width="1" opacity="0.4"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
        </div>
        <div>
          <h3 class="font-display text-xl font-semibold text-charcoal">William D. Chen</h3>
          <p class="font-body text-sm text-gold font-medium mb-2">Partner, Corporate & Real Estate</p>
          <p class="font-body text-sm text-warm-gray-light leading-relaxed mb-1">Columbia Law School, J.D. | NYU Stern, M.B.A.</p>
          <p class="font-body text-xs text-warm-gray-light">Admitted: New York State Bar, New Jersey Bar, U.S. Tax Court</p>
        </div>
      </div>
    </div>
  </div>
</section>

<hr class="gold-rule w-full max-w-document mx-auto">

<!-- Testimonial -->
<section class="py-16 relative z-10">
  <div class="max-w-document mx-auto px-6 text-center reveal">
    <div class="quote-mark leading-none mb-[-1rem]">&ldquo;</div>
    <blockquote class="font-display text-xl md:text-2xl italic text-charcoal leading-relaxed max-w-lg mx-auto">
      Sterling & Associates fought for our company when everything was at stake. Their preparation was meticulous, their counsel was unwavering, and the result exceeded every expectation. They are not merely attorneys&mdash;they are advocates in the truest sense.
    </blockquote>
    <div class="mt-6">
      <p class="font-body text-sm font-semibold text-leather">James Hartford</p>
      <p class="font-body text-xs text-warm-gray-light">CEO, Hartford Industries &mdash; $42M Commercial Litigation</p>
    </div>
  </div>
</section>

<hr class="gold-rule w-full max-w-document mx-auto">

<!-- Contact -->
<section id="contact" class="py-16 relative z-10">
  <div class="max-w-document mx-auto px-6">
    <p class="font-body text-xs text-gold tracking-[0.2em] uppercase text-center mb-2 reveal">Contact</p>
    <h2 class="font-display text-3xl font-semibold text-charcoal text-center mb-3 reveal">Request a Consultation</h2>
    <p class="font-body text-sm text-warm-gray-light text-center mb-10 reveal">Your initial consultation is complimentary and confidential.</p>

    <form id="contactForm" class="space-y-5 reveal" onsubmit="return validateForm(event)">
      <div>
        <label class="font-body text-xs font-semibold text-warm-gray uppercase tracking-wider block mb-1.5">Full Name <span class="text-gold">*</span></label>
        <input id="fname" type="text" placeholder="Your full name" class="form-field w-full px-4 py-3 bg-white border border-warm-border font-body text-sm text-charcoal placeholder-warm-gray-light transition-colors">
        <p id="fnameError" class="text-xs text-red-600 mt-1 hidden">Please enter your name.</p>
      </div>

      <div>
        <label class="font-body text-xs font-semibold text-warm-gray uppercase tracking-wider block mb-1.5">Email Address <span class="text-gold">*</span></label>
        <input id="femail" type="email" placeholder="your@email.com" class="form-field w-full px-4 py-3 bg-white border border-warm-border font-body text-sm text-charcoal placeholder-warm-gray-light transition-colors">
        <p id="femailError" class="text-xs text-red-600 mt-1 hidden">Please enter a valid email address.</p>
      </div>

      <div>
        <label class="font-body text-xs font-semibold text-warm-gray uppercase tracking-wider block mb-1.5">Case Type</label>
        <select id="fcasetype" class="form-field w-full px-4 py-3 bg-white border border-warm-border font-body text-sm text-charcoal transition-colors cursor-pointer">
          <option value="">Select a practice area</option>
          <option value="corporate">Corporate Law</option>
          <option value="litigation">Litigation</option>
          <option value="realestate">Real Estate</option>
          <option value="estate">Estate Planning</option>
          <option value="criminal">Criminal Defense</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label class="font-body text-xs font-semibold text-warm-gray uppercase tracking-wider block mb-1.5">Message</label>
        <textarea id="fmessage" rows="5" placeholder="Briefly describe your legal matter..." class="form-field w-full px-4 py-3 bg-white border border-warm-border font-body text-sm text-charcoal placeholder-warm-gray-light resize-none transition-colors"></textarea>
      </div>

      <button type="submit" class="w-full py-3.5 bg-gold text-white font-body font-semibold text-sm hover:bg-gold-light transition-colors cursor-pointer tracking-wide">
        Request Consultation
      </button>
    </form>
  </div>
</section>

<hr class="gold-rule w-full max-w-document mx-auto">

<!-- Footer -->
<footer class="py-12 relative z-10">
  <div class="max-w-document mx-auto px-6">
    <!-- Firm info -->
    <div class="text-center mb-8">
      <p class="font-display text-lg font-semibold text-leather tracking-wide mb-1">Sterling & Associates</p>
      <p class="font-body text-xs text-warm-gray-light">Attorneys at Law</p>
    </div>

    <div class="text-center mb-8 space-y-1">
      <p class="font-body text-sm text-warm-gray">One Liberty Plaza, Suite 3200</p>
      <p class="font-body text-sm text-warm-gray">New York, NY 10006</p>
      <p class="font-body text-sm text-warm-gray">(212) 555-0140 &middot; contact@sterlinglaw.com</p>
    </div>

    <hr class="gold-rule w-16 mb-8">

    <!-- Legal disclaimer -->
    <div class="text-center space-y-3">
      <p class="font-body text-[11px] text-warm-gray-light leading-relaxed max-w-lg mx-auto">
        Attorney Advertising. Prior results do not guarantee a similar outcome. This website is designed for general information only. The information presented at this site should not be construed as formal legal advice nor the formation of a lawyer/client relationship.
      </p>
      <p class="font-body text-[11px] text-warm-gray-light leading-relaxed max-w-lg mx-auto">
        Sterling & Associates LLP is a New York limited liability partnership. Members of the firm are admitted to practice in New York, Connecticut, New Jersey, and various federal courts. Individual attorney qualifications available upon request.
      </p>
      <p class="font-body text-[11px] text-warm-gray-light mt-4">
        &copy; 1991&ndash;2026 Sterling & Associates LLP. All rights reserved.
      </p>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal text-parchment px-6 py-3 text-sm font-body shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2 z-50 max-w-sm text-center border border-gold/20"></div>

<script>
// Mobile nav toggle
function toggleMobileNav() {
  var nav = document.getElementById('mobileNav');
  nav.classList.toggle('nav-open');
  nav.classList.toggle('nav-closed');
}

// Toast
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translate(-50%, 0)';
  setTimeout(function() {
    t.style.opacity = '0';
    t.style.transform = 'translate(-50%, 8px)';
  }, 2500);
}

function handleAction(action) {
  showToast(action + ' \u2014 This is a template preview');
}

// Form validation
function validateForm(e) {
  e.preventDefault();
  var valid = true;
  var name = document.getElementById('fname');
  var email = document.getElementById('femail');
  var nameErr = document.getElementById('fnameError');
  var emailErr = document.getElementById('femailError');

  nameErr.classList.add('hidden');
  emailErr.classList.add('hidden');

  if (!name.value.trim()) {
    nameErr.classList.remove('hidden');
    valid = false;
  }
  if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailErr.classList.remove('hidden');
    valid = false;
  }

  if (valid) {
    showToast('Consultation request submitted \u2014 Template preview');
    document.getElementById('contactForm').reset();
  }
  return false;
}

// Scroll reveal
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(function(el) {
  observer.observe(el);
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
