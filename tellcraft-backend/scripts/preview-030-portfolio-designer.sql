INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '63f10fcb-e3ee-4542-88b1-e9ddcced645b',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Yuki Chen — UI/UX Designer</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--charcoal:#1c1917;--coral:#f43f5e;--coral-light:#fff1f2;--gray-100:#f5f5f4;--gray-200:#e7e5e4;--gray-400:#a8a29e;--gray-500:#78716c;--gray-600:#57534e;--white:#ffffff}
body{font-family:'DM Sans',system-ui,sans-serif;background:var(--white);color:var(--charcoal);overflow-x:hidden;-webkit-font-smoothing:antialiased}
h1,h2,h3,.syne{font-family:'Syne','DM Sans',system-ui,sans-serif}

/* Scroll reveal */
.sr{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}
.sr.vis{opacity:1;transform:translateY(0)}

/* Nav */
.nav{position:fixed;top:0;left:0;right:0;z-index:90;padding:20px 0;transition:background .3s,box-shadow .3s}
.nav.scrolled{background:rgba(255,255,255,.92);backdrop-filter:blur(16px);box-shadow:0 1px 0 var(--gray-200)}
.nav-inner{max-width:1120px;margin:0 auto;padding:0 32px;display:flex;align-items:center;justify-content:space-between}
.nav-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;letter-spacing:-.02em;color:var(--charcoal);text-decoration:none}
.nav-logo span{color:var(--coral)}
.nav-links{display:flex;gap:32px;align-items:center}
.nav-links a{font-size:13px;font-weight:500;color:var(--gray-500);text-decoration:none;letter-spacing:.03em;text-transform:uppercase;transition:color .2s}
.nav-links a:hover{color:var(--coral)}
.nav-cta{font-size:13px;font-weight:600;color:var(--coral);text-decoration:none;letter-spacing:.03em;text-transform:uppercase;border:1.5px solid var(--coral);padding:8px 20px;border-radius:6px;transition:all .2s}
.nav-cta:hover{background:var(--coral);color:#fff}

/* Hero */
.hero{padding:160px 32px 100px;max-width:1120px;margin:0 auto}
.hero-label{font-size:13px;font-weight:500;color:var(--gray-400);letter-spacing:.12em;text-transform:uppercase;margin-bottom:24px}
.hero-title{font-family:'Syne',sans-serif;font-size:clamp(3.2rem,8.5vw,7rem);font-weight:800;line-height:.92;letter-spacing:-.04em;color:var(--charcoal);margin-bottom:40px}
.hero-title .coral{color:var(--coral)}
.hero-bottom{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:32px}
.hero-desc{max-width:380px;font-size:15px;line-height:1.7;color:var(--gray-500)}
.hero-stats{display:flex;gap:48px}
.stat-val{font-family:'Syne',sans-serif;font-size:clamp(2rem,4vw,3rem);font-weight:700;color:var(--charcoal);letter-spacing:-.03em}
.stat-label{font-size:12px;color:var(--gray-400);text-transform:uppercase;letter-spacing:.08em;margin-top:2px}

/* Divider line */
.divider{border:none;border-top:1px solid var(--gray-200);margin:0}

/* Section titles */
.section-label{font-size:12px;font-weight:600;color:var(--coral);letter-spacing:.15em;text-transform:uppercase;margin-bottom:12px}
.section-title{font-family:'Syne',sans-serif;font-size:clamp(1.5rem,3vw,2rem);font-weight:700;letter-spacing:-.02em}

/* ============================================
   PROJECT GRID — Drag-Reveal Cards
   ============================================ */
.projects{padding:80px 32px;max-width:1120px;margin:0 auto}
.projects-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:48px}
.projects-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.proj-card{position:relative;border-radius:16px;overflow:hidden;cursor:pointer;aspect-ratio:4/5;background:var(--gray-100)}
.proj-card .thumb{width:100%;height:100%;display:flex;align-items:center;justify-content:center;transition:transform .5s cubic-bezier(.23,1,.32,1)}
.proj-card:hover .thumb{transform:scale(1.03)}

/* The slide-up reveal overlay */
.proj-reveal{position:absolute;bottom:0;left:0;right:0;padding:28px 24px;background:var(--white);transform:translateY(100%);transition:transform .45s cubic-bezier(.23,1,.32,1);border-top:1px solid var(--gray-200)}
.proj-card:hover .proj-reveal{transform:translateY(0)}
.proj-reveal-tag{font-size:11px;font-weight:600;color:var(--coral);letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px}
.proj-reveal-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;letter-spacing:-.01em;margin-bottom:4px}
.proj-reveal-meta{font-size:12px;color:var(--gray-400);margin-bottom:8px;display:flex;gap:8px;align-items:center}
.proj-reveal-meta span.dot{width:3px;height:3px;border-radius:50%;background:var(--gray-400);display:inline-block}
.proj-reveal-desc{font-size:13px;color:var(--gray-500);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.proj-reveal-arrow{position:absolute;top:28px;right:24px;width:32px;height:32px;border-radius:50%;background:var(--coral);display:flex;align-items:center;justify-content:center;transition:transform .3s}
.proj-card:hover .proj-reveal-arrow{transform:rotate(-45deg)}

/* Drag hint on cards */
.drag-hint{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);font-size:11px;color:var(--gray-400);letter-spacing:.06em;text-transform:uppercase;opacity:1;transition:opacity .3s}
.proj-card:hover .drag-hint{opacity:0}

/* Project Detail Modal */
.modal-bg{position:fixed;inset:0;background:rgba(28,25,23,.6);z-index:100;display:none;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(4px)}
.modal-bg.open{display:flex}
.modal-panel{background:var(--white);border-radius:20px;max-width:860px;width:100%;max-height:90vh;overflow-y:auto;position:relative;animation:modalIn .35s ease}
@keyframes modalIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.modal-close{position:absolute;top:20px;right:20px;width:36px;height:36px;border-radius:50%;border:1px solid var(--gray-200);background:var(--white);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:var(--gray-500);transition:all .2s;z-index:2}
.modal-close:hover{border-color:var(--coral);color:var(--coral)}
.modal-hero{padding:56px 48px;text-align:center;border-radius:20px 20px 0 0}
.modal-body{padding:40px 48px 48px}
.modal-tag{font-size:11px;font-weight:600;color:var(--coral);letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px}
.modal-title{font-family:'Syne',sans-serif;font-size:26px;font-weight:700;letter-spacing:-.02em;margin-bottom:6px}
.modal-meta{font-size:13px;color:var(--gray-400);margin-bottom:24px;display:flex;gap:12px;justify-content:center}
.modal-desc{font-size:14px;color:var(--gray-500);line-height:1.8;margin-bottom:28px}
.modal-section{margin-bottom:24px}
.modal-section h4{font-size:13px;font-weight:600;color:var(--charcoal);letter-spacing:.04em;text-transform:uppercase;margin-bottom:12px}
.impact-item{display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:14px;color:var(--gray-600)}
.impact-arrow{color:var(--coral);font-weight:700;font-size:15px}
.tool-tag{display:inline-block;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:500;border:1px solid var(--gray-200);background:var(--white);margin:3px;transition:all .2s}
.tool-tag:hover{border-color:var(--coral);color:var(--coral)}

/* ============================================
   ABOUT
   ============================================ */
.about{padding:80px 32px;max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1fr 1.6fr;gap:64px;align-items:start}
.about-portrait{border-radius:20px;overflow:hidden;aspect-ratio:3/4;position:relative}
.about-portrait-bg{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:120px;filter:grayscale(.2)}
.about-portrait-caption{position:absolute;bottom:0;left:0;right:0;padding:24px 28px;background:linear-gradient(transparent,rgba(28,25,23,.7))}
.about-portrait-caption h3{font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#fff}
.about-portrait-caption p{font-size:13px;color:rgba(255,255,255,.75)}
.about-text h2{font-family:'Syne',sans-serif;font-size:clamp(1.5rem,3vw,2.2rem);font-weight:700;line-height:1.3;letter-spacing:-.02em;margin-bottom:20px}
.about-text p{font-size:14px;color:var(--gray-500);line-height:1.8;margin-bottom:16px}
.skills-wrap{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0 28px}
.skill-pill{display:inline-block;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:500;border:1px solid var(--gray-200);background:var(--white);transition:all .2s;cursor:default}
.skill-pill:hover{border-color:var(--coral);color:var(--coral)}
.about-btns{display:flex;gap:12px}
.btn-dark{font-family:'DM Sans',sans-serif;background:var(--charcoal);color:#fff;border:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;transition:all .25s}
.btn-dark:hover{background:var(--coral);transform:translateY(-1px)}
.btn-ghost{font-family:'DM Sans',sans-serif;background:transparent;color:var(--charcoal);border:1.5px solid var(--gray-200);padding:12px 28px;border-radius:8px;font-weight:500;font-size:14px;cursor:pointer;transition:all .25s}
.btn-ghost:hover{border-color:var(--coral);color:var(--coral)}

/* ============================================
   TOOLS
   ============================================ */
.tools{padding:80px 32px;background:var(--gray-100)}
.tools-inner{max-width:1120px;margin:0 auto}
.tools-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:48px}
.tool-card{background:var(--white);border-radius:14px;padding:32px 24px;text-align:center;border:1px solid var(--gray-200);transition:all .3s}
.tool-card:hover{border-color:var(--coral);transform:translateY(-4px);box-shadow:0 8px 24px rgba(244,63,94,.08)}
.tool-icon{width:48px;height:48px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center}
.tool-icon svg{width:40px;height:40px}
.tool-card h4{font-family:'Syne',sans-serif;font-size:15px;font-weight:600;margin-bottom:4px}
.tool-card p{font-size:12px;color:var(--gray-400)}

/* ============================================
   EXPERIENCE TIMELINE
   ============================================ */
.experience{padding:80px 32px;max-width:800px;margin:0 auto}
.timeline{margin-top:48px}
.tl-item{position:relative;padding-left:28px;padding-bottom:32px;border-left:2px solid var(--gray-200)}
.tl-item:last-child{border-left:2px solid transparent}
.tl-item::before{content:'';position:absolute;left:-5px;top:4px;width:8px;height:8px;border-radius:50%;background:var(--coral)}
.tl-year{font-size:11px;font-weight:600;color:var(--coral);letter-spacing:.08em;margin-bottom:4px}
.tl-role{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;margin-bottom:3px}
.tl-company{font-size:13px;color:var(--gray-400);margin-bottom:4px}
.tl-desc{font-size:13px;color:var(--gray-500);line-height:1.7}

/* ============================================
   CONTACT
   ============================================ */
.contact{padding:80px 32px;background:var(--charcoal);color:#fff}
.contact-inner{max-width:720px;margin:0 auto;text-align:center}
.contact-title{font-family:'Syne',sans-serif;font-size:clamp(2rem,5vw,3rem);font-weight:700;margin-bottom:12px;letter-spacing:-.03em}
.contact-sub{font-size:15px;color:var(--gray-400);margin-bottom:40px}
.contact-form{background:rgba(255,255,255,.05);border-radius:16px;padding:36px;text-align:left;border:1px solid rgba(255,255,255,.08)}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.form-group{margin-bottom:14px}
.form-group label{display:block;font-size:12px;color:var(--gray-400);margin-bottom:5px;letter-spacing:.04em;text-transform:uppercase}
.form-input{width:100%;padding:11px 16px;border:1px solid rgba(255,255,255,.1);border-radius:8px;background:rgba(255,255,255,.04);color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .2s}
.form-input:focus{border-color:var(--coral)}
.form-input::placeholder{color:var(--gray-500)}
textarea.form-input{resize:vertical;min-height:100px}
.form-submit{width:100%;padding:13px;border:none;border-radius:8px;background:var(--coral);color:#fff;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .25s;margin-top:6px}
.form-submit:hover{background:#e11d48;transform:translateY(-1px)}
.contact-socials{display:flex;justify-content:center;gap:28px;margin-top:28px}
.contact-socials a{font-size:13px;color:var(--gray-400);text-decoration:none;letter-spacing:.03em;transition:color .2s}
.contact-socials a:hover{color:var(--coral)}

/* Footer */
.footer{padding:20px 32px;background:var(--charcoal);border-top:1px solid rgba(255,255,255,.06);text-align:center}
.footer p{font-size:11px;color:var(--gray-500)}

/* Toast */
.toast{position:fixed;bottom:24px;right:24px;background:var(--charcoal);color:#fff;padding:13px 24px;border-radius:10px;font-size:13px;font-weight:500;transform:translateY(80px);opacity:0;transition:all .35s;z-index:200}
.toast.show{transform:translateY(0);opacity:1}

/* ============================================
   RESPONSIVE
   ============================================ */
@media(max-width:900px){
  .projects-grid{grid-template-columns:repeat(2,1fr)}
  .about{grid-template-columns:1fr;gap:40px}
  .tools-grid{grid-template-columns:repeat(2,1fr)}
  .form-row{grid-template-columns:1fr}
  .nav-links{display:none}
}
@media(max-width:560px){
  .projects-grid{grid-template-columns:1fr}
  .hero-bottom{flex-direction:column;align-items:flex-start}
  .hero-stats{gap:32px}
  .tools-grid{grid-template-columns:1fr 1fr}
  .modal-body{padding:28px 24px 32px}
  .modal-hero{padding:40px 24px}
  .contact-form{padding:24px}
}
</style>
</head>
<body>

<div class="toast" id="toast"></div>

<!-- Project Detail Modal -->
<div class="modal-bg" id="modal" onclick="if(event.target===this)closeModal()">
  <div class="modal-panel" id="modal-panel"></div>
</div>

<!-- Nav -->
<nav class="nav" id="nav">
  <div class="nav-inner">
    <a href="#" class="nav-logo" onclick="window.scrollTo({top:0,behavior:'smooth'});return false"><span>Y</span>uki.</a>
    <div class="nav-links">
      <a href="#work">Work</a>
      <a href="#about">About</a>
      <a href="#tools">Tools</a>
      <a href="#experience">Experience</a>
    </div>
    <a href="#contact" class="nav-cta">Say Hello</a>
  </div>
</nav>

<!-- Hero -->
<section class="hero">
  <div class="sr">
    <p class="hero-label">UI/UX Designer &mdash; Taipei</p>
    <h1 class="hero-title">CRAFTING<br><span class="coral">DIGITAL</span><br>EXPERIENCES</h1>
  </div>
  <div class="sr hero-bottom">
    <p class="hero-desc">
      Focused on building intuitive, meaningful digital products.<br>
      6 years designing for SaaS, FinTech, and e-commerce.
    </p>
    <div class="hero-stats">
      <div><div class="stat-val">42<span style="color:var(--coral)">+</span></div><div class="stat-label">Projects</div></div>
      <div><div class="stat-val">6</div><div class="stat-label">Yrs Exp</div></div>
      <div><div class="stat-val">15</div><div class="stat-label">Brands</div></div>
    </div>
  </div>
</section>

<hr class="divider">

<!-- Work -->
<section id="work" class="projects">
  <div class="sr projects-header">
    <div>
      <div class="section-label">Selected Work</div>
      <h2 class="section-title">Projects</h2>
    </div>
    <span style="font-size:13px;color:var(--gray-400)">2022 &mdash; 2026</span>
  </div>
  <div class="projects-grid">
    <!-- Card 0 -->
    <div class="sr proj-card" onclick="openProject(0)">
      <div class="thumb" style="background:linear-gradient(135deg,#1e1b4b,#4338ca)">
        <span style="font-size:64px">&#128202;</span>
      </div>
      <div class="proj-reveal">
        <div class="proj-reveal-arrow"><svg width="14" height="14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M1 13L13 1M13 1H3M13 1v10"/></svg></div>
        <div class="proj-reveal-tag">Fintech</div>
        <div class="proj-reveal-title">WealthFlow</div>
        <div class="proj-reveal-meta">Lead Designer <span class="dot"></span> 2025</div>
        <div class="proj-reveal-desc">Investment portfolio dashboard &mdash; redefining wealth management UX.</div>
      </div>
      <div class="drag-hint">Hover to reveal</div>
    </div>
    <!-- Card 1 -->
    <div class="sr proj-card" onclick="openProject(1)">
      <div class="thumb" style="background:linear-gradient(135deg,#fff1f2,#fda4af)">
        <span style="font-size:64px">&#128717;&#65039;</span>
      </div>
      <div class="proj-reveal">
        <div class="proj-reveal-arrow"><svg width="14" height="14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M1 13L13 1M13 1H3M13 1v10"/></svg></div>
        <div class="proj-reveal-tag">E-Commerce</div>
        <div class="proj-reveal-title">LUXE Market</div>
        <div class="proj-reveal-meta">Product Designer <span class="dot"></span> 2024</div>
        <div class="proj-reveal-desc">Luxury resale marketplace with AI authentication flow.</div>
      </div>
      <div class="drag-hint">Hover to reveal</div>
    </div>
    <!-- Card 2 -->
    <div class="sr proj-card" onclick="openProject(2)">
      <div class="thumb" style="background:linear-gradient(135deg,#ecfdf5,#6ee7b7)">
        <span style="font-size:64px">&#127973;</span>
      </div>
      <div class="proj-reveal">
        <div class="proj-reveal-arrow"><svg width="14" height="14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M1 13L13 1M13 1H3M13 1v10"/></svg></div>
        <div class="proj-reveal-tag">Health Tech</div>
        <div class="proj-reveal-title">MediConnect</div>
        <div class="proj-reveal-meta">UX Designer <span class="dot"></span> 2024</div>
        <div class="proj-reveal-desc">Telehealth app &mdash; accessible patient-side experience design.</div>
      </div>
      <div class="drag-hint">Hover to reveal</div>
    </div>
    <!-- Card 3 -->
    <div class="sr proj-card" onclick="openProject(3)">
      <div class="thumb" style="background:linear-gradient(135deg,#0a0a0a,#262626)">
        <span style="font-size:64px">&#127925;</span>
      </div>
      <div class="proj-reveal">
        <div class="proj-reveal-arrow"><svg width="14" height="14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M1 13L13 1M13 1H3M13 1v10"/></svg></div>
        <div class="proj-reveal-tag">SaaS</div>
        <div class="proj-reveal-title">SoundForge</div>
        <div class="proj-reveal-meta">Design System Lead <span class="dot"></span> 2023</div>
        <div class="proj-reveal-desc">Online DAW design system &mdash; 200+ components, dark/light themes.</div>
      </div>
      <div class="drag-hint">Hover to reveal</div>
    </div>
    <!-- Card 4 -->
    <div class="sr proj-card" onclick="openProject(4)">
      <div class="thumb" style="background:linear-gradient(135deg,#faf5ff,#d8b4fe)">
        <span style="font-size:64px">&#9992;&#65039;</span>
      </div>
      <div class="proj-reveal">
        <div class="proj-reveal-arrow"><svg width="14" height="14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M1 13L13 1M13 1H3M13 1v10"/></svg></div>
        <div class="proj-reveal-tag">Travel</div>
        <div class="proj-reveal-title">Wanderlust</div>
        <div class="proj-reveal-meta">Product Designer <span class="dot"></span> 2023</div>
        <div class="proj-reveal-desc">AI-powered travel itinerary planner app.</div>
      </div>
      <div class="drag-hint">Hover to reveal</div>
    </div>
    <!-- Card 5 -->
    <div class="sr proj-card" onclick="openProject(5)">
      <div class="thumb" style="background:linear-gradient(135deg,#fff7ed,#fdba74)">
        <span style="font-size:64px">&#127869;&#65039;</span>
      </div>
      <div class="proj-reveal">
        <div class="proj-reveal-arrow"><svg width="14" height="14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M1 13L13 1M13 1H3M13 1v10"/></svg></div>
        <div class="proj-reveal-tag">Food Tech</div>
        <div class="proj-reveal-title">FoodieMap</div>
        <div class="proj-reveal-meta">Brand &amp; Product <span class="dot"></span> 2022</div>
        <div class="proj-reveal-desc">Food discovery community &mdash; branding &amp; app design.</div>
      </div>
      <div class="drag-hint">Hover to reveal</div>
    </div>
  </div>
</section>

<hr class="divider">

<!-- About -->
<section id="about">
  <div class="about">
    <div class="sr about-portrait">
      <div class="about-portrait-bg" style="background:linear-gradient(135deg,var(--coral),#fb7185)">
        <span>&#128105;&zwj;&#127912;</span>
      </div>
      <div class="about-portrait-caption">
        <h3>Yuki Chen</h3>
        <p>陳雨琪</p>
      </div>
    </div>
    <div class="sr about-text">
      <div class="section-label">About Me</div>
      <h2>Design is not just visuals &mdash;<br>it&rsquo;s solving problems.</h2>
      <p>Hi, I&rsquo;m Yuki. Born in Taipei, studied Interactive Design at Goldsmiths, London. After returning to Taiwan I spent 6 years in product design at Pinkoi, LINE, and JKOPAY. Now freelancing.</p>
      <p>I believe great design starts with deep user understanding. Every project begins with research, iterates through prototyping, and refines until the &ldquo;right&rdquo; solution emerges. I specialise in turning complex systems into intuitive interfaces.</p>
      <div class="skills-wrap">
        <span class="skill-pill">Figma</span>
        <span class="skill-pill">Framer</span>
        <span class="skill-pill">Principle</span>
        <span class="skill-pill">User Research</span>
        <span class="skill-pill">Design Systems</span>
        <span class="skill-pill">Prototyping</span>
        <span class="skill-pill">A/B Testing</span>
        <span class="skill-pill">HTML / CSS</span>
        <span class="skill-pill">React</span>
      </div>
      <div class="about-btns">
        <button class="btn-dark" onclick="showToast('Resume downloading...')">Download CV</button>
        <button class="btn-ghost" onclick="document.getElementById('contact').scrollIntoView({behavior:'smooth'})">Let&rsquo;s Talk</button>
      </div>
    </div>
  </div>
</section>

<!-- Tools -->
<section id="tools" class="tools">
  <div class="tools-inner">
    <div class="sr" style="text-align:center">
      <div class="section-label">Design Stack</div>
      <h2 class="section-title">Tools I Use</h2>
    </div>
    <div class="tools-grid">
      <div class="sr tool-card">
        <div class="tool-icon">
          <svg viewBox="0 0 38 57" fill="none"><path d="M19 28.5A9.5 9.5 0 0 1 28.5 19H19v9.5z" fill="#1ABCFE"/><path d="M9.5 38A9.5 9.5 0 0 1 19 28.5V38H9.5z" fill="#0ACF83"/><path d="M9.5 19a9.5 9.5 0 0 0 9.5 9.5V9.5H9.5A9.5 9.5 0 0 0 9.5 19z" fill="#F24E1E"/><path d="M9.5 0A9.5 9.5 0 0 0 9.5 9.5H19V0H9.5z" fill="#FF7262"/><path d="M19 0h9.5A9.5 9.5 0 0 1 19 9.5V0z" fill="#A259FF"/></svg>
        </div>
        <h4>Figma</h4>
        <p>UI Design &amp; Prototyping</p>
      </div>
      <div class="sr tool-card">
        <div class="tool-icon">
          <svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#1c1917"/><path d="M14 14h20v20H14z" fill="none" stroke="#f43f5e" stroke-width="2"/><circle cx="24" cy="24" r="6" fill="#f43f5e"/></svg>
        </div>
        <h4>Sketch</h4>
        <p>Vector Design</p>
      </div>
      <div class="sr tool-card">
        <div class="tool-icon">
          <svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#300"/><text x="8" y="34" fill="#ff3366" font-size="24" font-weight="700" font-family="Syne,sans-serif">Ae</text></svg>
        </div>
        <h4>After Effects</h4>
        <p>Motion Design</p>
      </div>
      <div class="sr tool-card">
        <div class="tool-icon">
          <svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#001e36"/><text x="8" y="34" fill="#31a8ff" font-size="24" font-weight="700" font-family="Syne,sans-serif">Ps</text></svg>
        </div>
        <h4>Photoshop</h4>
        <p>Image Editing</p>
      </div>
      <div class="sr tool-card">
        <div class="tool-icon">
          <svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#330000"/><text x="8" y="34" fill="#ff9a00" font-size="24" font-weight="700" font-family="Syne,sans-serif">Ai</text></svg>
        </div>
        <h4>Illustrator</h4>
        <p>Vector &amp; Branding</p>
      </div>
      <div class="sr tool-card">
        <div class="tool-icon">
          <svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#0055ff"/><circle cx="24" cy="24" r="12" fill="none" stroke="#fff" stroke-width="2"/><circle cx="24" cy="24" r="4" fill="#fff"/></svg>
        </div>
        <h4>Framer</h4>
        <p>Interactive Prototypes</p>
      </div>
      <div class="sr tool-card">
        <div class="tool-icon">
          <svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#f5f5f4"/><path d="M12 36V12l12 12 12-12v24" fill="none" stroke="#1c1917" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h4>Maze</h4>
        <p>User Testing</p>
      </div>
      <div class="sr tool-card">
        <div class="tool-icon">
          <svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="#1c1917"/><path d="M14 24h20M24 14v20" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>
        </div>
        <h4>Notion</h4>
        <p>Documentation</p>
      </div>
    </div>
  </div>
</section>

<!-- Experience -->
<section id="experience" class="experience">
  <div class="sr">
    <div class="section-label">Experience</div>
    <h2 class="section-title">Career Path</h2>
  </div>
  <div class="timeline">
    <div class="sr tl-item">
      <div class="tl-year">2024 &mdash; Present</div>
      <div class="tl-role">Independent Designer</div>
      <div class="tl-company">Freelance</div>
      <div class="tl-desc">End-to-end UI/UX for FinTech, SaaS, and e-commerce clients. Research to delivery.</div>
    </div>
    <div class="sr tl-item">
      <div class="tl-year">2022 &mdash; 2024</div>
      <div class="tl-role">Senior Product Designer</div>
      <div class="tl-company">LINE Taiwan</div>
      <div class="tl-desc">Led design for LINE Pay &amp; LINE Shopping. Managed a 3-person team. Built design system.</div>
    </div>
    <div class="sr tl-item">
      <div class="tl-year">2020 &mdash; 2022</div>
      <div class="tl-role">Product Designer</div>
      <div class="tl-company">Pinkoi</div>
      <div class="tl-desc">Seller experience and buyer journey optimization. Internationalization for Japan &amp; Thailand.</div>
    </div>
    <div class="sr tl-item">
      <div class="tl-year">2018 &mdash; 2020</div>
      <div class="tl-role">UI Designer</div>
      <div class="tl-company">JKOPAY</div>
      <div class="tl-desc">App interface and campaign page design. Grew from junior to core team designer.</div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="contact">
  <div class="contact-inner">
    <div class="sr">
      <div class="section-label" style="color:var(--coral)">Get in Touch</div>
      <h2 class="contact-title">Have a project in mind?</h2>
      <p class="contact-sub">I usually respond within 24 hours.</p>
    </div>
    <div class="sr contact-form">
      <div class="form-row">
        <div>
          <label>Name</label>
          <input class="form-input" type="text" placeholder="Your name">
        </div>
        <div>
          <label>Email</label>
          <input class="form-input" type="email" placeholder="email@example.com">
        </div>
      </div>
      <div class="form-group">
        <label>Project Type</label>
        <select class="form-input"><option>UI/UX Design</option><option>Design System</option><option>Branding</option><option>App Design</option><option>Other</option></select>
      </div>
      <div class="form-group">
        <label>Message</label>
        <textarea class="form-input" placeholder="Tell me about your project..."></textarea>
      </div>
      <button class="form-submit" onclick="showToast('Message sent. Thanks for reaching out!')">Send Message</button>
    </div>
    <div class="contact-socials">
      <a href="#">Dribbble</a>
      <a href="#">Behance</a>
      <a href="#">LinkedIn</a>
      <a href="#">Instagram</a>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="footer">
  <p>&copy; 2026 Yuki Chen. Designed with care in Taipei.</p>
</footer>

<script>
/* ---- Project Data ---- */
var projects=[
  {title:'WealthFlow Dashboard',cat:'FINTECH',color:'#4338ca',emoji:'&#128202;',role:'Lead Designer',year:'2025',
   desc:'Built a brand-new dashboard experience for an investment startup. Starting from user interviews, iterating through 3 rounds of prototype testing, we designed an interface that lets users grasp portfolio status in under 3 seconds.',
   impact:['User retention up 34%','NPS from 38 to 67','Red Dot Design nomination'],tools:['Figma','Principle','Maze','Notion']},
  {title:'LUXE Marketplace',cat:'E-COMMERCE',color:'#f43f5e',emoji:'&#128717;&#65039;',role:'Product Designer',year:'2024',
   desc:'Luxury resale app solving trust and authentication challenges. Designed a unique AI-authentication flow and secure transaction experience that gives both buyers and sellers confidence.',
   impact:['Conversion rate up 52%','$3.2M GMV in month one','App Store Featured'],tools:['Figma','Framer','UserTesting','Miro']},
  {title:'MediConnect',cat:'HEALTH TECH',color:'#10b981',emoji:'&#127973;',role:'UX Designer',year:'2024',
   desc:'Telehealth app patient-side design. The challenge: making video consultations effortless for elderly users. Conducted 30+ user tests and designed a minimal-friction flow.',
   impact:['89% completion rate for 60+','Booking time reduced 70%','iF Design Award'],tools:['Figma','Lookback','Optimal Workshop']},
  {title:'SoundForge Studio',cat:'SAAS',color:'#eab308',emoji:'&#127925;',role:'Design System Lead',year:'2023',
   desc:'Built a design system from zero for an online music workstation. 200+ components, dark/light themes, and WCAG accessibility compliance throughout.',
   impact:['3x dev efficiency','98% design consistency','200+ component library'],tools:['Figma','Storybook','ZeroHeight']},
  {title:'Wanderlust',cat:'TRAVEL',color:'#a855f7',emoji:'&#9992;&#65039;',role:'Product Designer',year:'2023',
   desc:'AI travel itinerary planner. Describe where you want to go in natural language, and AI plans routes, recommends spots, and books accommodation.',
   impact:['50K+ beta users','Avg planning time: 2 min','Featured on TechCrunch'],tools:['Figma','ProtoPie','Hotjar']},
  {title:'FoodieMap',cat:'FOOD TECH',color:'#ea580c',emoji:'&#127869;&#65039;',role:'Brand & Product Designer',year:'2022',
   desc:'Food discovery community app, from brand identity to product design. Created a unique "taste map" interaction pattern.',
   impact:['120K+ downloads','15K DAU','Golden Pin Design Award'],tools:['Figma','After Effects','Illustrator']}
];

/* ---- Modal ---- */
function openProject(i){
  var p=projects[i];
  var html='<button class="modal-close" onclick="closeModal()">&times;</button>';
  html+='<div class="modal-hero" style="background:linear-gradient(135deg,'+p.color+'18,'+p.color+'08)">';
  html+='<span style="font-size:80px">'+p.emoji+'</span></div>';
  html+='<div class="modal-body">';
  html+='<div class="modal-tag">'+p.cat+'</div>';
  html+='<div class="modal-title">'+p.title+'</div>';
  html+='<div class="modal-meta"><span>'+p.role+'</span><span style="color:var(--gray-400)">&bull;</span><span>'+p.year+'</span></div>';
  html+='<div class="modal-desc">'+p.desc+'</div>';
  html+='<div class="modal-section"><h4>Impact</h4>';
  for(var j=0;j<p.impact.length;j++){
    html+='<div class="impact-item"><span class="impact-arrow">&rarr;</span><span>'+p.impact[j]+'</span></div>';
  }
  html+='</div>';
  html+='<div class="modal-section"><h4>Tools</h4><div>';
  for(var k=0;k<p.tools.length;k++){
    html+='<span class="tool-tag">'+p.tools[k]+'</span>';
  }
  html+='</div></div></div>';
  document.getElementById('modal-panel').innerHTML=html;
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModal(){
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow='';
}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal()});

/* ---- Toast ---- */
function showToast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(function(){t.classList.remove('show')},2500)}

/* ---- Smooth scroll ---- */
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    e.preventDefault();
    var el=document.querySelector(a.getAttribute('href'));
    if(el)el.scrollIntoView({behavior:'smooth'});
  });
});

/* ---- Nav scroll ---- */
window.addEventListener('scroll',function(){
  document.getElementById('nav').classList.toggle('scrolled',window.scrollY>60);
});

/* ---- Scroll reveal ---- */
var obs=new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('vis');obs.unobserve(e.target)}
  });
},{threshold:0.1});
document.querySelectorAll('.sr').forEach(function(el){obs.observe(el)});
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
