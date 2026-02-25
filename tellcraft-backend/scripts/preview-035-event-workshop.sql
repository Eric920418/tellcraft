-- ============================================================
-- Template Preview: event-workshop (Hands-On UX Design Workshop)
-- Signature: Remaining seats dot indicator (filled vs empty circles)
-- 執行: psql -U tellcraft_user -d tellcraft -f preview-035-event-workshop.sql
-- ============================================================

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '6875e8d4-0aec-4ffb-8978-3f3bfb2c718b',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hands-On UX Design Workshop</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{amber:{50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f'},charcoal:{50:'#f7f7f7',100:'#e3e3e3',200:'#c8c8c8',300:'#a4a4a4',400:'#818181',500:'#666666',600:'#515151',700:'#434343',800:'#383838',900:'#1c1917'},cream:{50:'#fefdfb',100:'#fdf8f0',200:'#faf0e0'},coral:{400:'#f87171',500:'#ef4444',600:'#dc2626'}},fontFamily:{display:['Sora','sans-serif'],body:['Work Sans','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Work Sans',sans-serif;background:#fefdfb;color:#1c1917;overflow-x:hidden;-webkit-font-smoothing:antialiased}
.font-display{font-family:'Sora',sans-serif}

/* Seat Dots */
.seat-dot{width:14px;height:14px;border-radius:50%;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);flex-shrink:0}
.seat-dot.filled{background:#d97706;box-shadow:0 0 0 2px rgba(217,119,6,0.2)}
.seat-dot.empty{background:#e5e5e5;border:2px solid #d4d4d4}
.seat-dot:hover{transform:scale(1.3)}

/* Numbered Circle */
.num-circle{width:44px;height:44px;border-radius:50%;background:#d97706;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Sora',sans-serif;font-weight:700;font-size:18px;flex-shrink:0}

/* Registration Steps */
.reg-step{display:flex;align-items:center;gap:12px;padding:16px 0;position:relative}
.reg-step:not(:last-child)::after{content:'';position:absolute;left:17px;top:52px;width:2px;height:calc(100% - 36px);background:#fde68a}
.step-num{width:36px;height:36px;border-radius:50%;border:2px solid #d97706;color:#d97706;display:flex;align-items:center;justify-content:center;font-family:'Sora',sans-serif;font-weight:700;font-size:14px;flex-shrink:0;background:#fff;z-index:1;transition:all 0.3s}
.step-num.active{background:#d97706;color:#fff}

/* Card */
.ws-card{background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:28px;transition:all 0.35s cubic-bezier(0.4,0,0.2,1)}
.ws-card:hover{border-color:#d97706;box-shadow:0 12px 32px rgba(217,119,6,0.08);transform:translateY(-3px)}

/* Instructor Card */
.instructor-card{background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:24px;display:flex;gap:16px;align-items:start;transition:all 0.3s}
.instructor-card:hover{border-color:#fbbf24;box-shadow:0 8px 24px rgba(217,119,6,0.06)}

/* Badge */
.ws-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;font-family:'Sora',sans-serif}

/* Buttons */
.btn-amber{background:#d97706;color:#fff;border:none;padding:14px 28px;border-radius:12px;font-weight:600;font-family:'Sora',sans-serif;cursor:pointer;transition:all 0.3s;font-size:15px;letter-spacing:-0.01em}
.btn-amber:hover{background:#b45309;box-shadow:0 8px 24px rgba(217,119,6,0.25);transform:translateY(-2px)}
.btn-ghost{background:transparent;color:#1c1917;border:2px solid #d4d4d4;padding:14px 28px;border-radius:12px;font-weight:600;font-family:'Sora',sans-serif;cursor:pointer;transition:all 0.3s;font-size:15px}
.btn-ghost:hover{border-color:#d97706;color:#d97706}

/* Form */
.form-field{width:100%;padding:12px 16px;border:2px solid #e5e5e5;border-radius:10px;font-size:14px;font-family:'Work Sans',sans-serif;transition:all 0.2s;background:#fff;color:#1c1917;outline:none}
.form-field:focus{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.1)}
.form-field::placeholder{color:#a4a4a4}
.form-label{display:block;font-size:13px;font-weight:600;color:#434343;margin-bottom:6px;font-family:'Sora',sans-serif}

/* FAQ */
.faq-item{border-bottom:1px solid #e5e5e5;overflow:hidden}
.faq-q{display:flex;justify-content:space-between;align-items:center;padding:18px 0;cursor:pointer;font-weight:600;font-size:15px;font-family:'Sora',sans-serif;transition:color 0.2s}
.faq-q:hover{color:#d97706}
.faq-a{max-height:0;overflow:hidden;transition:max-height 0.35s ease,padding 0.35s ease;font-size:14px;color:#666;line-height:1.7;padding:0}
.faq-item.open .faq-a{max-height:200px;padding-bottom:18px}
.faq-arrow{transition:transform 0.3s;font-size:12px;color:#a4a4a4}
.faq-item.open .faq-arrow{transform:rotate(180deg);color:#d97706}

/* Pricing */
.price-card{background:#fff;border:2px solid #e5e5e5;border-radius:20px;padding:32px;position:relative;transition:all 0.3s}
.price-card:hover{border-color:#fbbf24}
.price-card.featured{border-color:#d97706;background:linear-gradient(180deg,#fffbeb 0%,#fff 40%)}

/* Reveal animation */
.reveal{opacity:0;transform:translateY(24px);transition:all 0.6s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}

/* Urgency pulse */
@keyframes pulse-amber{0%,100%{box-shadow:0 0 0 0 rgba(217,119,6,0.3)}50%{box-shadow:0 0 0 8px rgba(217,119,6,0)}}
.pulse-amber{animation:pulse-amber 2s ease-in-out infinite}

/* Toast */
.toast{position:fixed;bottom:24px;right:24px;background:#1c1917;color:#fff;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:600;transform:translateY(100px);opacity:0;transition:all 0.4s;z-index:9999;font-family:'Sora',sans-serif}
.toast.show{transform:translateY(0);opacity:1}

/* Material chip */
.material-chip{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#fef3c7;border:1px solid #fde68a;border-radius:10px;font-size:13px;font-weight:500;color:#92400e}

/* Scroll bar */
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#d4d4d4;border-radius:3px}
</style>
</head>
<body>

<div class="toast" id="toast"></div>

<!-- ========== NAV ========== -->
<nav style="position:fixed;top:0;left:0;right:0;z-index:50;backdrop-filter:blur(12px);background:rgba(254,253,251,0.92);border-bottom:1px solid #e5e5e5;padding:12px 0">
  <div style="max-width:1080px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:10px;cursor:pointer" onclick="window.scrollTo({top:0,behavior:'smooth'})">
      <div style="width:34px;height:34px;border-radius:8px;background:#d97706;display:flex;align-items:center;justify-content:center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
      </div>
      <span class="font-display" style="font-weight:700;font-size:17px;letter-spacing:-0.02em">UX Workshop</span>
    </div>
    <div style="display:flex;align-items:center;gap:24px">
      <a href="#learn" style="text-decoration:none;color:#666;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#d97706'" onmouseout="this.style.color='#666'">Curriculum</a>
      <a href="#instructor" style="text-decoration:none;color:#666;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#d97706'" onmouseout="this.style.color='#666'">Instructor</a>
      <a href="#pricing" style="text-decoration:none;color:#666;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#d97706'" onmouseout="this.style.color='#666'">Pricing</a>
      <a href="#faq" style="text-decoration:none;color:#666;font-size:14px;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='#d97706'" onmouseout="this.style.color='#666'">FAQ</a>
    </div>
    <button class="btn-amber" style="padding:8px 20px;font-size:13px" onclick="document.getElementById('register').scrollIntoView({behavior:'smooth'})">Register Now</button>
  </div>
</nav>

<!-- ========== HERO ========== -->
<section style="padding:110px 24px 48px;position:relative;overflow:hidden">
  <div style="position:absolute;top:60px;right:-120px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(217,119,6,0.06),transparent 70%);pointer-events:none"></div>
  <div style="position:absolute;bottom:-60px;left:-80px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(251,191,36,0.05),transparent 70%);pointer-events:none"></div>
  <div style="max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1.3fr 0.7fr;gap:48px;align-items:center">
    <div>
      <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
        <span class="ws-badge" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a">Hands-On Workshop</span>
        <span class="ws-badge" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">Limited Seats</span>
      </div>
      <h1 class="font-display" style="font-size:clamp(2.2rem,5vw,3.4rem);font-weight:800;line-height:1.08;margin-bottom:16px;letter-spacing:-0.03em;color:#1c1917">
        Hands-On<br>UX Design<br>Workshop
      </h1>
      <p style="font-size:16px;color:#666;line-height:1.7;margin-bottom:24px;max-width:480px">
        A full-day intensive workshop covering user research, wireframing, prototyping, and usability testing. Walk away with a complete project in your portfolio.
      </p>
      <!-- Date/Time/Location strip -->
      <div style="display:flex;gap:20px;margin-bottom:28px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:#434343">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style="font-weight:500">March 22, 2026</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:#434343">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style="font-weight:500">9:00 AM - 5:00 PM</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:#434343">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style="font-weight:500">The Design Hub, SF</span>
        </div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn-amber pulse-amber" onclick="document.getElementById('register').scrollIntoView({behavior:'smooth'})">Reserve Your Seat</button>
        <button class="btn-ghost" onclick="document.getElementById('learn').scrollIntoView({behavior:'smooth'})">View Curriculum</button>
      </div>
    </div>
    <!-- Hero visual: Seat indicator preview -->
    <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border-radius:24px;padding:40px 32px;position:relative">
      <div style="text-align:center;margin-bottom:24px">
        <div class="font-display" style="font-size:13px;font-weight:600;color:#92400e;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Workshop Capacity</div>
        <div class="font-display" style="font-size:56px;font-weight:800;color:#d97706;line-height:1">11<span style="font-size:24px;color:#a4a4a4;font-weight:500">/15</span></div>
        <div style="font-size:13px;color:#666;margin-top:4px">seats filled</div>
      </div>
      <!-- SIGNATURE: Seat dots grid -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:20px" id="hero-seats">
        <div class="seat-dot filled"></div>
        <div class="seat-dot filled"></div>
        <div class="seat-dot filled"></div>
        <div class="seat-dot filled"></div>
        <div class="seat-dot filled"></div>
        <div class="seat-dot filled"></div>
        <div class="seat-dot filled"></div>
        <div class="seat-dot filled"></div>
        <div class="seat-dot filled"></div>
        <div class="seat-dot filled"></div>
        <div class="seat-dot filled"></div>
        <div class="seat-dot empty"></div>
        <div class="seat-dot empty"></div>
        <div class="seat-dot empty"></div>
        <div class="seat-dot empty"></div>
      </div>
      <div style="text-align:center">
        <span class="font-display" style="font-size:14px;font-weight:700;color:#dc2626;background:#fef2f2;padding:6px 14px;border-radius:20px;border:1px solid #fecaca">Only 4 spots left!</span>
      </div>
    </div>
  </div>
</section>

<!-- ========== WHAT YOU'LL LEARN ========== -->
<section id="learn" style="padding:64px 24px;background:#fff;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6">
  <div style="max-width:1080px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:48px">
      <span class="ws-badge" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;margin-bottom:12px">Curriculum</span>
      <h2 class="font-display" style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700;margin-top:12px;letter-spacing:-0.02em">What You'll Learn</h2>
      <p style="color:#666;font-size:15px;margin-top:8px">Four core competencies, each with hands-on exercises.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px">
      <div class="reveal ws-card" style="display:flex;gap:18px;align-items:start">
        <div class="num-circle">1</div>
        <div>
          <h3 class="font-display" style="font-size:16px;font-weight:700;margin-bottom:6px">User Research Methods</h3>
          <p style="font-size:14px;color:#666;line-height:1.65">Conduct stakeholder interviews, create user personas, and map customer journey flows that reveal real pain points.</p>
        </div>
      </div>
      <div class="reveal ws-card" style="display:flex;gap:18px;align-items:start">
        <div class="num-circle">2</div>
        <div>
          <h3 class="font-display" style="font-size:16px;font-weight:700;margin-bottom:6px">Wireframing & Information Architecture</h3>
          <p style="font-size:14px;color:#666;line-height:1.65">Structure content hierarchies, sketch low-fidelity wireframes, and validate navigation patterns with card sorting.</p>
        </div>
      </div>
      <div class="reveal ws-card" style="display:flex;gap:18px;align-items:start">
        <div class="num-circle">3</div>
        <div>
          <h3 class="font-display" style="font-size:16px;font-weight:700;margin-bottom:6px">Interactive Prototyping</h3>
          <p style="font-size:14px;color:#666;line-height:1.65">Build clickable prototypes in Figma with micro-interactions, transitions, and responsive breakpoints in under 2 hours.</p>
        </div>
      </div>
      <div class="reveal ws-card" style="display:flex;gap:18px;align-items:start">
        <div class="num-circle">4</div>
        <div>
          <h3 class="font-display" style="font-size:16px;font-weight:700;margin-bottom:6px">Usability Testing & Iteration</h3>
          <p style="font-size:14px;color:#666;line-height:1.65">Run moderated usability tests, synthesize findings with affinity diagrams, and iterate your design based on real feedback.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ========== INSTRUCTOR ========== -->
<section id="instructor" style="padding:64px 24px">
  <div style="max-width:1080px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:48px">
      <h2 class="font-display" style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700;letter-spacing:-0.02em">Meet Your Instructor</h2>
    </div>
    <div class="reveal" style="max-width:640px;margin:0 auto">
      <div class="instructor-card" style="padding:32px;gap:24px">
        <div style="flex-shrink:0">
          <div style="width:88px;height:88px;border-radius:16px;background:linear-gradient(135deg,#d97706,#f59e0b);display:flex;align-items:center;justify-content:center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>
        <div>
          <h3 class="font-display" style="font-size:20px;font-weight:700;margin-bottom:2px">Sarah Chen</h3>
          <p style="font-size:14px;color:#d97706;font-weight:600;margin-bottom:10px">Senior UX Lead, ex-Google</p>
          <p style="font-size:14px;color:#666;line-height:1.65;margin-bottom:14px">
            12+ years designing products used by millions. Led UX for Google Maps local experiences and mentored 40+ junior designers. Stanford d.school facilitator.
          </p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="ws-badge" style="background:#f3f4f6;color:#434343">Google</span>
            <span class="ws-badge" style="background:#f3f4f6;color:#434343">Stanford d.school</span>
            <span class="ws-badge" style="background:#f3f4f6;color:#434343">40+ Mentees</span>
            <span class="ws-badge" style="background:#f3f4f6;color:#434343">Speaker at Config</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ========== SEAT INDICATOR (SIGNATURE SECTION) ========== -->
<section style="padding:48px 24px;background:#fff;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6">
  <div style="max-width:640px;margin:0 auto;text-align:center">
    <div class="reveal">
      <div class="font-display" style="font-size:13px;font-weight:600;color:#d97706;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px">Live Availability</div>
      <h3 class="font-display" style="font-size:24px;font-weight:700;margin-bottom:24px;letter-spacing:-0.02em">Seats Are Filling Up</h3>
      <!-- SIGNATURE: Large seat dot row -->
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">
        <div class="seat-dot filled" style="width:20px;height:20px" title="Taken"></div>
        <div class="seat-dot filled" style="width:20px;height:20px" title="Taken"></div>
        <div class="seat-dot filled" style="width:20px;height:20px" title="Taken"></div>
        <div class="seat-dot filled" style="width:20px;height:20px" title="Taken"></div>
        <div class="seat-dot filled" style="width:20px;height:20px" title="Taken"></div>
        <div class="seat-dot filled" style="width:20px;height:20px" title="Taken"></div>
        <div class="seat-dot filled" style="width:20px;height:20px" title="Taken"></div>
        <div class="seat-dot filled" style="width:20px;height:20px" title="Taken"></div>
        <div class="seat-dot filled" style="width:20px;height:20px" title="Taken"></div>
        <div class="seat-dot filled" style="width:20px;height:20px" title="Taken"></div>
        <div class="seat-dot filled" style="width:20px;height:20px" title="Taken"></div>
        <div class="seat-dot empty" style="width:20px;height:20px" title="Available"></div>
        <div class="seat-dot empty" style="width:20px;height:20px" title="Available"></div>
        <div class="seat-dot empty" style="width:20px;height:20px" title="Available"></div>
        <div class="seat-dot empty" style="width:20px;height:20px" title="Available"></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:16px;font-size:13px;color:#666;margin-bottom:8px">
        <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:50%;background:#d97706;display:inline-block"></span> Taken (11)</span>
        <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:50%;background:#e5e5e5;border:2px solid #d4d4d4;display:inline-block"></span> Available (4)</span>
      </div>
      <p style="font-size:15px;font-weight:700;color:#dc2626;margin-top:12px" class="font-display">Only 4 spots left -- register before they're gone!</p>
    </div>
  </div>
</section>

<!-- ========== PRICING ========== -->
<section id="pricing" style="padding:64px 24px">
  <div style="max-width:820px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:48px">
      <h2 class="font-display" style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700;letter-spacing:-0.02em">Workshop Pricing</h2>
      <p style="color:#666;font-size:15px;margin-top:8px">Early Bird ends March 8, 2026</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <!-- Early Bird -->
      <div class="reveal price-card featured">
        <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%)">
          <span class="ws-badge" style="background:#d97706;color:#fff;padding:5px 14px;font-size:12px">Early Bird</span>
        </div>
        <div style="text-align:center;margin-bottom:20px;margin-top:8px">
          <div style="display:flex;align-items:baseline;justify-content:center;gap:2px">
            <span style="font-size:16px;color:#666;font-weight:500">$</span>
            <span class="font-display" style="font-size:48px;font-weight:800;color:#d97706;letter-spacing:-0.03em">99</span>
          </div>
          <div style="font-size:13px;color:#a4a4a4;text-decoration:line-through">Regular $149</div>
        </div>
        <div style="border-top:1px solid #fde68a;padding-top:16px;margin-bottom:20px">
          <div style="font-size:13px;color:#434343;line-height:2">
            <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Full-day intensive (8 hours)</div>
            <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> All materials provided</div>
            <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Certificate of completion</div>
            <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Lunch & refreshments</div>
            <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Post-workshop community</div>
          </div>
        </div>
        <button class="btn-amber" style="width:100%" onclick="document.getElementById('register').scrollIntoView({behavior:'smooth'})">Get Early Bird Price</button>
      </div>
      <!-- Regular -->
      <div class="reveal price-card">
        <div style="text-align:center;margin-bottom:20px;margin-top:20px">
          <div style="display:flex;align-items:baseline;justify-content:center;gap:2px">
            <span style="font-size:16px;color:#666;font-weight:500">$</span>
            <span class="font-display" style="font-size:48px;font-weight:800;color:#1c1917;letter-spacing:-0.03em">149</span>
          </div>
          <div style="font-size:13px;color:#a4a4a4">After March 8</div>
        </div>
        <div style="border-top:1px solid #e5e5e5;padding-top:16px;margin-bottom:20px">
          <div style="font-size:13px;color:#434343;line-height:2">
            <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a4a4a4" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Full-day intensive (8 hours)</div>
            <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a4a4a4" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> All materials provided</div>
            <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a4a4a4" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Certificate of completion</div>
            <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a4a4a4" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Lunch & refreshments</div>
            <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a4a4a4" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Post-workshop community</div>
          </div>
        </div>
        <button class="btn-ghost" style="width:100%" onclick="document.getElementById('register').scrollIntoView({behavior:'smooth'})">Register at Full Price</button>
      </div>
    </div>
  </div>
</section>

<!-- ========== MATERIALS PROVIDED ========== -->
<section style="padding:48px 24px;background:#fff;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6">
  <div style="max-width:800px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:32px">
      <h2 class="font-display" style="font-size:20px;font-weight:700;letter-spacing:-0.01em">Materials Provided</h2>
      <p style="color:#666;font-size:14px;margin-top:6px">Everything you need is included. Just bring your laptop.</p>
    </div>
    <div class="reveal" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <div class="material-chip">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        UX Workbook (printed)
      </div>
      <div class="material-chip">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        Figma template files
      </div>
      <div class="material-chip">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        Sticky notes & markers
      </div>
      <div class="material-chip">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        Interview script templates
      </div>
      <div class="material-chip">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        Persona canvas sheets
      </div>
      <div class="material-chip">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        Usability test checklists
      </div>
    </div>
  </div>
</section>

<!-- ========== REGISTRATION FORM ========== -->
<section id="register" style="padding:64px 24px">
  <div style="max-width:560px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:36px">
      <h2 class="font-display" style="font-size:clamp(1.6rem,3vw,2.2rem);font-weight:700;letter-spacing:-0.02em">Register for the Workshop</h2>
      <p style="color:#666;font-size:14px;margin-top:8px">Complete the steps below to reserve your seat.</p>
    </div>
    <div class="reveal">
      <!-- Registration Steps Indicator -->
      <div style="margin-bottom:32px">
        <div class="reg-step">
          <div class="step-num active" id="step-1">1</div>
          <div>
            <div class="font-display" style="font-size:14px;font-weight:600">Your Information</div>
            <div style="font-size:12px;color:#a4a4a4">Name and contact details</div>
          </div>
        </div>
        <div class="reg-step">
          <div class="step-num" id="step-2">2</div>
          <div>
            <div class="font-display" style="font-size:14px;font-weight:600">Experience Level</div>
            <div style="font-size:12px;color:#a4a4a4">Help us tailor the workshop</div>
          </div>
        </div>
        <div class="reg-step">
          <div class="step-num" id="step-3">3</div>
          <div>
            <div class="font-display" style="font-size:14px;font-weight:600">Confirm & Pay</div>
            <div style="font-size:12px;color:#a4a4a4">Secure your spot</div>
          </div>
        </div>
      </div>
      <!-- Form -->
      <div style="background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:28px">
        <div style="margin-bottom:16px">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-field" placeholder="Jane Doe" onfocus="activateStep(1)">
        </div>
        <div style="margin-bottom:16px">
          <label class="form-label">Email Address</label>
          <input type="email" class="form-field" placeholder="jane@company.com" onfocus="activateStep(1)">
        </div>
        <div style="margin-bottom:20px">
          <label class="form-label">Experience Level</label>
          <select class="form-field" style="appearance:auto;cursor:pointer" onfocus="activateStep(2)" onchange="activateStep(2)">
            <option value="" disabled selected>Select your experience</option>
            <option value="beginner">Beginner -- New to UX design</option>
            <option value="intermediate">Intermediate -- Some UX knowledge</option>
            <option value="advanced">Advanced -- Working UX professional</option>
          </select>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding:14px 16px;background:#fffbeb;border-radius:10px;border:1px solid #fde68a">
          <div>
            <div class="font-display" style="font-size:13px;font-weight:600;color:#92400e">Early Bird Price</div>
            <div class="font-display" style="font-size:24px;font-weight:800;color:#d97706">$99 <span style="font-size:13px;color:#a4a4a4;text-decoration:line-through;font-weight:400">$149</span></div>
          </div>
          <div style="display:flex;gap:4px">
            <div class="seat-dot filled" style="width:10px;height:10px"></div>
            <div class="seat-dot filled" style="width:10px;height:10px"></div>
            <div class="seat-dot filled" style="width:10px;height:10px"></div>
            <div class="seat-dot empty" style="width:10px;height:10px"></div>
            <div class="seat-dot empty" style="width:10px;height:10px"></div>
          </div>
        </div>
        <button class="btn-amber" style="width:100%;padding:16px;font-size:16px" onclick="handleRegister()">Complete Registration</button>
        <p style="text-align:center;font-size:12px;color:#a4a4a4;margin-top:12px">You'll receive a confirmation email with workshop details.</p>
      </div>
    </div>
  </div>
</section>

<!-- ========== FAQ ========== -->
<section id="faq" style="padding:64px 24px;background:#fff;border-top:1px solid #f3f4f6">
  <div style="max-width:680px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:40px">
      <h2 class="font-display" style="font-size:clamp(1.6rem,3vw,2.2rem);font-weight:700;letter-spacing:-0.02em">Frequently Asked Questions</h2>
    </div>
    <div class="reveal">
      <div class="faq-item" onclick="toggleFaq(this)">
        <div class="faq-q">Do I need prior design experience? <span class="faq-arrow">&#9662;</span></div>
        <div class="faq-a">Not at all! This workshop is designed for all skill levels. Whether you're a product manager, developer, or marketing professional, you'll gain practical UX skills you can apply immediately.</div>
      </div>
      <div class="faq-item" onclick="toggleFaq(this)">
        <div class="faq-q">What should I bring? <span class="faq-arrow">&#9662;</span></div>
        <div class="faq-a">Just your laptop with a modern browser. Figma is free and browser-based -- we'll send setup instructions a week before the workshop. All physical materials (workbooks, sticky notes, markers) are provided.</div>
      </div>
      <div class="faq-item" onclick="toggleFaq(this)">
        <div class="faq-q">Is lunch included? <span class="faq-arrow">&#9662;</span></div>
        <div class="faq-a">Yes! A catered lunch and coffee/tea breaks are included in the ticket price. Please let us know about any dietary restrictions when you register.</div>
      </div>
      <div class="faq-item" onclick="toggleFaq(this)">
        <div class="faq-q">What's the refund policy? <span class="faq-arrow">&#9662;</span></div>
        <div class="faq-a">Full refund up to 14 days before the workshop. 50% refund between 7-14 days. Within 7 days, we can't offer refunds but you're welcome to transfer your ticket to a colleague.</div>
      </div>
      <div class="faq-item" onclick="toggleFaq(this)">
        <div class="faq-q">Will I get a certificate? <span class="faq-arrow">&#9662;</span></div>
        <div class="faq-a">Yes, all participants who complete the full-day workshop will receive a digital certificate of completion. You'll also walk away with a portfolio-ready project from the hands-on exercises.</div>
      </div>
      <div class="faq-item" onclick="toggleFaq(this)">
        <div class="faq-q">What skill level is the workshop for? <span class="faq-arrow">&#9662;</span></div>
        <div class="faq-a">We cover beginner through intermediate content. Advanced professionals can still benefit from the research methodology sections and portfolio project. The hands-on format means everyone progresses at their own pace.</div>
      </div>
    </div>
  </div>
</section>

<!-- ========== CTA ========== -->
<section style="padding:64px 24px">
  <div class="reveal" style="max-width:800px;margin:0 auto;background:#1c1917;border-radius:24px;padding:52px 40px;text-align:center;position:relative;overflow:hidden">
    <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;border-radius:50%;background:rgba(217,119,6,0.15);pointer-events:none"></div>
    <div style="position:absolute;bottom:-60px;left:-30px;width:140px;height:140px;border-radius:50%;background:rgba(217,119,6,0.08);pointer-events:none"></div>
    <h2 class="font-display" style="font-size:clamp(1.6rem,3vw,2.2rem);font-weight:700;color:#fff;margin-bottom:12px;position:relative;letter-spacing:-0.02em">Don't Miss This Workshop</h2>
    <p style="color:rgba(255,255,255,0.65);font-size:15px;margin-bottom:8px;position:relative">March 22, 2026 -- The Design Hub, San Francisco</p>
    <!-- Mini seat indicator in CTA -->
    <div style="display:flex;gap:6px;justify-content:center;margin:16px 0;position:relative">
      <div style="width:12px;height:12px;border-radius:50%;background:#d97706"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:#d97706"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:#d97706"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:#d97706"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:#d97706"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:#d97706"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:#d97706"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:#d97706"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:#d97706"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:#d97706"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:#d97706"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.3)"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.3)"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.3)"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.3)"></div>
    </div>
    <p style="font-size:14px;color:#fbbf24;font-weight:600;margin-bottom:20px;position:relative" class="font-display">4 seats remaining</p>
    <button style="background:#d97706;color:#fff;border:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:16px;cursor:pointer;transition:all 0.3s;position:relative;font-family:'Sora',sans-serif" onclick="document.getElementById('register').scrollIntoView({behavior:'smooth'})" onmouseover="this.style.background='#f59e0b';this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#d97706';this.style.transform=''">Reserve Your Seat -- $99 Early Bird</button>
  </div>
</section>

<!-- ========== FOOTER ========== -->
<footer style="padding:32px 24px;border-top:1px solid #f3f4f6;text-align:center">
  <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px">
    <div style="width:24px;height:24px;border-radius:6px;background:#d97706;display:flex;align-items:center;justify-content:center">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
    </div>
    <span class="font-display" style="font-weight:700;font-size:15px">UX Workshop</span>
  </div>
  <p style="font-size:12px;color:#a4a4a4">2026 UX Design Workshop. Crafted with care in San Francisco.</p>
</footer>

<script>
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000)}

function toggleFaq(el){
  el.parentElement.querySelectorAll('.faq-item').forEach(i=>{if(i!==el)i.classList.remove('open')});
  el.classList.toggle('open');
}

function activateStep(n){
  for(let i=1;i<=3;i++){
    const el=document.getElementById('step-'+i);
    if(el){el.classList.toggle('active',i<=n)}
  }
}

function handleRegister(){
  activateStep(3);
  showToast('Registration successful! Check your email for confirmation.');
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();const t=document.querySelector(a.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth'})})});

// Reveal on scroll
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}})},{threshold:0.08});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

// Seat dot entrance animation
setTimeout(()=>{
  document.querySelectorAll('.seat-dot.filled').forEach((dot,i)=>{
    dot.style.opacity='0';dot.style.transform='scale(0)';
    setTimeout(()=>{dot.style.opacity='1';dot.style.transform='scale(1)'},i*80);
  });
},500);
</script>

</body>
</html>$HTML$,
  3
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
