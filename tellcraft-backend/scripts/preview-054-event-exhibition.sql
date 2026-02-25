INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '7c788e4d-c777-4371-a0f7-5339a5c2fc9a',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Visions of Tomorrow — Metropolitan Museum of Contemporary Art</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --gallery:#fafaf9;--charcoal:#292524;--accent:#dc2626;--frame:#8b6914;
  --frame-shadow:#6b4f10;--label-bg:#f5f5f0;--warm-white:#fefdfb;
}
body{font-family:'Lato',sans-serif;background:var(--gallery);color:var(--charcoal);overflow-x:hidden}
h1,h2,h3,h4,.font-display{font-family:'Cormorant Garamond',serif}

/* Nav */
.nav{position:fixed;top:0;width:100%;background:rgba(250,250,249,0.97);backdrop-filter:blur(8px);z-index:50;border-bottom:1px solid rgba(41,37,36,0.08)}
.nav-inner{max-width:1200px;margin:0 auto;padding:16px 32px;display:flex;align-items:center;justify-content:space-between}
.nav-logo{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;letter-spacing:0.15em;color:var(--charcoal)}
.nav-logo span{font-size:10px;display:block;letter-spacing:0.3em;font-family:'Lato',sans-serif;color:#a8a29e;font-weight:400;margin-top:2px}
.nav-links{display:flex;gap:28px;align-items:center}
.nav-links a{font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#78716c;text-decoration:none;transition:color 0.3s}
.nav-links a:hover{color:var(--charcoal)}
.nav-ticket{border:1px solid var(--charcoal);padding:8px 20px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;background:none;color:var(--charcoal);cursor:pointer;transition:all 0.3s;font-family:'Lato',sans-serif}
.nav-ticket:hover{background:var(--charcoal);color:var(--gallery)}

/* Hero */
.hero{padding:140px 32px 80px;text-align:center;max-width:900px;margin:0 auto}
.hero-date{font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#a8a29e;margin-bottom:24px}
.hero h1{font-size:clamp(48px,8vw,96px);font-weight:400;font-style:italic;line-height:1;margin-bottom:16px;color:var(--charcoal)}
.hero-museum{font-size:14px;letter-spacing:0.2em;color:#78716c;margin-bottom:8px}
.hero-divider{width:60px;height:1px;background:var(--accent);margin:32px auto}
.hero-tagline{font-size:16px;color:#78716c;font-weight:300;max-width:500px;margin:0 auto 40px;line-height:1.7}
.hero-cta{display:inline-block;background:var(--charcoal);color:var(--gallery);padding:14px 40px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;border:none;cursor:pointer;transition:background 0.3s;font-family:'Lato',sans-serif}
.hero-cta:hover{background:var(--accent)}

/* Gallery Walk Section */
.gallery-section{padding:80px 0 40px;background:var(--charcoal)}
.gallery-header{text-align:center;padding:0 32px 48px}
.gallery-header h2{font-size:42px;font-weight:400;font-style:italic;color:var(--gallery);margin-bottom:8px}
.gallery-header p{font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#a8a29e}
.gallery-instruction{text-align:center;color:#a8a29e;font-size:12px;letter-spacing:0.15em;margin-bottom:32px;display:flex;align-items:center;justify-content:center;gap:8px}
.gallery-instruction .arrow{display:inline-block;animation:slideArrow 1.5s ease-in-out infinite}
@keyframes slideArrow{0%,100%{transform:translateX(0)}50%{transform:translateX(8px)}}

/* Horizontal Scroll Container */
.gallery-walk{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;height:75vh;min-height:520px}
.gallery-walk::-webkit-scrollbar{display:none}

/* Gallery Rooms */
.room{flex:0 0 100vw;width:100vw;scroll-snap-align:start;display:flex;align-items:center;justify-content:center;padding:40px;position:relative}
.room::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none}

/* Room backgrounds */
.room-1{background:linear-gradient(135deg,#1c1917 0%,#292524 50%,#1c1917 100%)}
.room-2{background:linear-gradient(135deg,#292524 0%,#1c1917 50%,#292524 100%)}
.room-3{background:linear-gradient(135deg,#1c1917 0%,#292524 100%)}

.room-label{position:absolute;top:24px;left:40px;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#78716c}
.room-counter{position:absolute;top:24px;right:40px;font-size:10px;letter-spacing:0.2em;color:#78716c}

/* Artwork layout */
.room-content{display:flex;gap:40px;align-items:center;justify-content:center;height:100%}
.room-1 .room-content{gap:48px}
.room-2 .room-content{gap:32px}

/* Artwork Frame */
.artwork{position:relative;transition:transform 0.5s cubic-bezier(0.4,0,0.2,1)}
.artwork:hover{transform:scale(1.02)}
.artwork-frame{border:8px solid var(--frame);box-shadow:inset 0 0 0 2px rgba(139,105,20,0.3),4px 4px 20px rgba(0,0,0,0.4),0 0 60px rgba(0,0,0,0.2);background:var(--warm-white);position:relative}
.artwork-frame::before{content:'';position:absolute;inset:4px;border:1px solid rgba(139,105,20,0.2);pointer-events:none}
.artwork-inner{overflow:hidden;position:relative}

/* Artwork sizes */
.artwork-large .artwork-frame{width:320px;height:400px;padding:12px}
.artwork-large .artwork-inner{width:100%;height:100%}
.artwork-medium .artwork-frame{width:220px;height:300px;padding:10px}
.artwork-medium .artwork-inner{width:100%;height:100%}
.artwork-install .artwork-frame{width:520px;height:380px;padding:14px;border-width:10px}
.artwork-install .artwork-inner{width:100%;height:100%}

/* Artwork content (abstract art placeholders) */
.art-piece{width:100%;height:100%;position:relative;overflow:hidden}
.art-1{background:linear-gradient(160deg,#1a1a2e 0%,#16213e 40%,#0f3460 70%,#e94560 100%)}
.art-1::after{content:'';position:absolute;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(233,69,96,0.6),transparent);top:30%;left:20%;filter:blur(20px)}
.art-2{background:linear-gradient(45deg,#fefdf7 0%,#f5ebe0 30%,#d5c4a1 60%,#8b7355 100%)}
.art-2::before{content:'';position:absolute;width:80%;height:2px;background:var(--charcoal);top:45%;left:10%;opacity:0.3}
.art-2::after{content:'';position:absolute;width:60px;height:60px;border:2px solid var(--charcoal);border-radius:50%;bottom:25%;right:20%;opacity:0.2}
.art-3{background:linear-gradient(180deg,#2d1b69 0%,#11998e 50%,#38ef7d 100%);opacity:0.9}
.art-3::after{content:'';position:absolute;inset:15%;border:1px solid rgba(255,255,255,0.15);transform:rotate(12deg)}
.art-4{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}
.art-4::before{content:'';position:absolute;width:100px;height:100px;background:rgba(255,255,255,0.1);border-radius:50%;top:20%;left:30%}
.art-4::after{content:'';position:absolute;width:60px;height:60px;background:rgba(255,255,255,0.08);border-radius:50%;bottom:20%;right:25%}
.art-5{background:#1a1a1a;position:relative}
.art-5::before{content:'';position:absolute;inset:10%;background:repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(220,38,38,0.15) 8px,rgba(220,38,38,0.15) 9px);transform:rotate(-3deg)}
.art-5::after{content:'';position:absolute;width:40%;height:40%;border:3px solid rgba(220,38,38,0.4);top:30%;left:30%}
.art-6{background:linear-gradient(to bottom,#0c0c0c,#1a1a2e);position:relative;overflow:hidden}
.art-6::before{content:'';position:absolute;width:200%;height:200%;background:conic-gradient(from 0deg at 50% 50%,transparent 0deg,rgba(233,69,96,0.1) 60deg,transparent 120deg,rgba(102,126,234,0.1) 180deg,transparent 240deg,rgba(56,239,125,0.08) 300deg,transparent 360deg);animation:installSpin 20s linear infinite;top:-50%;left:-50%}
@keyframes installSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

/* Museum Label */
.museum-label{background:var(--label-bg);padding:12px 16px;margin-top:12px;border-left:2px solid var(--frame);min-width:180px}
.museum-label .label-artist{font-family:'Cormorant Garamond',serif;font-size:14px;font-weight:600;color:var(--charcoal);margin-bottom:2px}
.museum-label .label-title{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;color:#57534e;margin-bottom:4px}
.museum-label .label-meta{font-size:10px;color:#a8a29e;letter-spacing:0.05em;line-height:1.5}

/* Room Progress Dots */
.room-dots{display:flex;justify-content:center;gap:12px;padding:24px 0 48px;background:var(--charcoal)}
.room-dot{width:8px;height:8px;border-radius:50%;background:#57534e;transition:all 0.3s;cursor:pointer}
.room-dot.active{background:var(--accent);transform:scale(1.3)}

/* Current + Upcoming */
.exhibitions-section{padding:80px 32px;max-width:1100px;margin:0 auto}
.section-label{font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
.section-title{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:400;font-style:italic;margin-bottom:40px;color:var(--charcoal)}
.current-exhibition{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-bottom:80px;align-items:center}
.current-art{aspect-ratio:4/3;background:linear-gradient(135deg,#1c1917,#292524);position:relative;overflow:hidden}
.current-art::after{content:'NOW SHOWING';position:absolute;top:16px;left:16px;background:var(--accent);color:white;font-size:9px;letter-spacing:0.2em;padding:4px 10px}
.current-art .art-preview{width:100%;height:100%;background:linear-gradient(160deg,#1a1a2e 0%,#16213e 40%,#0f3460 70%,#e94560 100%);opacity:0.7}
.current-info h3{font-family:'Cormorant Garamond',serif;font-size:32px;font-style:italic;margin-bottom:12px}
.current-info .dates{font-size:12px;letter-spacing:0.15em;color:#a8a29e;margin-bottom:16px}
.current-info p{font-size:14px;line-height:1.8;color:#57534e;margin-bottom:20px}
.current-link{font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--charcoal);text-decoration:none;border-bottom:1px solid var(--charcoal);padding-bottom:2px;transition:color 0.3s,border-color 0.3s}
.current-link:hover{color:var(--accent);border-color:var(--accent)}

.upcoming-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.upcoming-card{border:1px solid rgba(41,37,36,0.1);padding:24px;transition:all 0.3s;cursor:pointer}
.upcoming-card:hover{border-color:var(--accent);transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,0.06)}
.upcoming-card .card-date{font-size:10px;letter-spacing:0.2em;color:var(--accent);margin-bottom:12px;text-transform:uppercase}
.upcoming-card h4{font-family:'Cormorant Garamond',serif;font-size:20px;font-style:italic;margin-bottom:8px}
.upcoming-card p{font-size:12px;color:#78716c;line-height:1.6}

/* Visitor Info */
.visitor-section{padding:80px 32px;background:var(--charcoal);color:var(--gallery)}
.visitor-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px}
.visitor-col h2{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:400;font-style:italic;margin-bottom:32px}
.info-row{display:flex;gap:16px;margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.06)}
.info-row:last-child{border-bottom:none}
.info-icon{width:36px;height:36px;border:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.info-content h4{font-size:13px;font-weight:700;letter-spacing:0.05em;margin-bottom:4px}
.info-content p{font-size:13px;color:#a8a29e;line-height:1.6}
.admission-table{width:100%;margin-top:8px}
.admission-row{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06)}
.admission-row:last-child{border-bottom:none}
.admission-type{font-size:13px}
.admission-type span{display:block;font-size:11px;color:#78716c;margin-top:2px}
.admission-price{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--accent)}
.guided-tours{margin-top:32px;padding:20px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.02)}
.guided-tours h4{font-size:12px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:12px;color:var(--accent)}
.tour-time{display:flex;justify-content:space-between;font-size:12px;color:#a8a29e;padding:6px 0}

/* Footer */
.footer{padding:40px 32px;border-top:1px solid rgba(41,37,36,0.08);text-align:center}
.footer-logo{font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:600;letter-spacing:0.15em;margin-bottom:8px}
.footer-copy{font-size:11px;color:#a8a29e;letter-spacing:0.1em}

/* Reveal Animation */
.reveal{opacity:0;transform:translateY(30px);transition:opacity 0.8s cubic-bezier(0.4,0,0.2,1),transform 0.8s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}

/* Responsive */
@media(max-width:768px){
  .nav-links{display:none}
  .hero h1{font-size:48px}
  .room{padding:20px}
  .artwork-large .artwork-frame{width:200px;height:260px}
  .artwork-medium .artwork-frame{width:160px;height:220px}
  .artwork-install .artwork-frame{width:300px;height:240px}
  .room-content{gap:16px}
  .room-2 .room-content{flex-wrap:wrap;gap:12px}
  .museum-label{min-width:140px;padding:8px 12px}
  .museum-label .label-artist{font-size:12px}
  .museum-label .label-title{font-size:11px}
  .museum-label .label-meta{font-size:9px}
  .current-exhibition{grid-template-columns:1fr}
  .upcoming-grid{grid-template-columns:1fr}
  .visitor-inner{grid-template-columns:1fr}
  .exhibitions-section{padding:60px 24px}
}
</style>
</head>
<body>

<!-- Navigation -->
<nav class="nav">
  <div class="nav-inner">
    <div class="nav-logo">
      MMCA
      <span>Metropolitan Museum of Contemporary Art</span>
    </div>
    <div class="nav-links">
      <a href="#gallery">Gallery</a>
      <a href="#exhibitions">Exhibitions</a>
      <a href="#visit">Plan Your Visit</a>
    </div>
    <button class="nav-ticket" onclick="document.getElementById('ticketModal').style.display='flex'">Buy Tickets</button>
  </div>
</nav>

<!-- Hero -->
<section class="hero reveal">
  <div class="hero-date">March 15 — September 7, 2026</div>
  <h1>Visions of Tomorrow</h1>
  <div class="hero-museum">Metropolitan Museum of Contemporary Art</div>
  <div class="hero-divider"></div>
  <p class="hero-tagline">A journey through six gallery rooms exploring how contemporary artists envision the future through painting, sculpture, and installation.</p>
  <button class="hero-cta" onclick="document.getElementById('gallery').scrollIntoView({behavior:'smooth'})">Enter the Gallery</button>
</section>

<!-- Horizontal Scroll Gallery -->
<section id="gallery">
  <div class="gallery-section">
    <div class="gallery-header reveal">
      <p>The Exhibition</p>
      <h2>Gallery Walk-Through</h2>
    </div>
    <div class="gallery-instruction">
      <span>Scroll horizontally to walk through the gallery</span>
      <span class="arrow">&rarr;</span>
    </div>

    <div class="gallery-walk" id="galleryWalk">
      <!-- Room 1: Two Large Works -->
      <div class="room room-1">
        <div class="room-label">Room I &mdash; Horizons</div>
        <div class="room-counter">1 / 3</div>
        <div class="room-content">
          <div class="artwork artwork-large">
            <div class="artwork-frame">
              <div class="artwork-inner">
                <div class="art-piece art-1"></div>
              </div>
            </div>
            <div class="museum-label">
              <div class="label-artist">Elena Vasquez</div>
              <div class="label-title">Threshold of Dawn</div>
              <div class="label-meta">Oil on canvas, 2024<br>72 &times; 96 in.</div>
            </div>
          </div>
          <div class="artwork artwork-large">
            <div class="artwork-frame">
              <div class="artwork-inner">
                <div class="art-piece art-2"></div>
              </div>
            </div>
            <div class="museum-label">
              <div class="label-artist">Kenji Morimoto</div>
              <div class="label-title">The Last Cartography</div>
              <div class="label-meta">Mixed media on panel, 2025<br>68 &times; 84 in.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Room 2: Three Medium Works -->
      <div class="room room-2">
        <div class="room-label">Room II &mdash; Fragments</div>
        <div class="room-counter">2 / 3</div>
        <div class="room-content">
          <div class="artwork artwork-medium">
            <div class="artwork-frame">
              <div class="artwork-inner">
                <div class="art-piece art-3"></div>
              </div>
            </div>
            <div class="museum-label">
              <div class="label-artist">Amara Osei</div>
              <div class="label-title">Verdant Signal</div>
              <div class="label-meta">Acrylic &amp; resin, 2025<br>48 &times; 60 in.</div>
            </div>
          </div>
          <div class="artwork artwork-medium">
            <div class="artwork-frame">
              <div class="artwork-inner">
                <div class="art-piece art-4"></div>
              </div>
            </div>
            <div class="museum-label">
              <div class="label-artist">Sofia Lindberg</div>
              <div class="label-title">Orbital Memory</div>
              <div class="label-meta">Digital print on aluminum, 2024<br>40 &times; 54 in.</div>
            </div>
          </div>
          <div class="artwork artwork-medium">
            <div class="artwork-frame">
              <div class="artwork-inner">
                <div class="art-piece art-5"></div>
              </div>
            </div>
            <div class="museum-label">
              <div class="label-artist">Ravi Krishnan</div>
              <div class="label-title">Grid Dissolution No. 7</div>
              <div class="label-meta">Charcoal &amp; pigment, 2025<br>44 &times; 52 in.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Room 3: Single Installation -->
      <div class="room room-3">
        <div class="room-label">Room III &mdash; Convergence</div>
        <div class="room-counter">3 / 3</div>
        <div class="room-content">
          <div class="artwork artwork-install">
            <div class="artwork-frame">
              <div class="artwork-inner">
                <div class="art-piece art-6"></div>
              </div>
            </div>
            <div class="museum-label">
              <div class="label-artist">Collective Iris</div>
              <div class="label-title">Event Horizon (Installation)</div>
              <div class="label-meta">Light, glass, steel, projection, 2026<br>Dimensions variable &mdash; Site-specific commission</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Room Progress Dots -->
    <div class="room-dots">
      <div class="room-dot active" data-room="0"></div>
      <div class="room-dot" data-room="1"></div>
      <div class="room-dot" data-room="2"></div>
    </div>
  </div>
</section>

<!-- Current + Upcoming Exhibitions -->
<section id="exhibitions" class="exhibitions-section">
  <div class="reveal">
    <div class="section-label">Now Showing</div>
    <div class="section-title">Current Exhibition</div>
  </div>
  <div class="current-exhibition reveal">
    <div class="current-art">
      <div class="art-preview"></div>
    </div>
    <div class="current-info">
      <h3>Visions of Tomorrow</h3>
      <div class="dates">March 15 &mdash; September 7, 2026</div>
      <p>Six gallery rooms trace a path from intimate canvases to an immersive site-specific installation, asking what it means to imagine the future in an age of uncertainty. Featuring works by Elena Vasquez, Kenji Morimoto, Amara Osei, Sofia Lindberg, Ravi Krishnan, and a commissioned installation by Collective Iris.</p>
      <a href="#gallery" class="current-link">Walk Through the Gallery &rarr;</a>
    </div>
  </div>

  <div class="reveal" style="transition-delay:0.15s">
    <div class="section-label">Coming Soon</div>
    <div class="section-title">Upcoming Exhibitions</div>
  </div>
  <div class="upcoming-grid reveal" style="transition-delay:0.2s">
    <div class="upcoming-card">
      <div class="card-date">Oct 2026 &mdash; Jan 2027</div>
      <h4>Material Whispers</h4>
      <p>Textile and fiber art from twelve emerging artists redefining craft in the digital age.</p>
    </div>
    <div class="upcoming-card">
      <div class="card-date">Feb &mdash; May 2027</div>
      <h4>After the Archive</h4>
      <p>Photography, video, and AI-generated imagery explore the boundaries of memory and documentation.</p>
    </div>
    <div class="upcoming-card">
      <div class="card-date">Jun &mdash; Sep 2027</div>
      <h4>Sound as Sculpture</h4>
      <p>A multi-sensory exhibition where sonic vibrations shape physical form in real time.</p>
    </div>
  </div>
</section>

<!-- Visitor Info -->
<section id="visit" class="visitor-section">
  <div class="visitor-inner">
    <div class="visitor-col reveal">
      <div class="section-label" style="color:var(--accent)">Plan Your Visit</div>
      <h2>Visitor Information</h2>
      <div class="info-row">
        <div class="info-icon">&#9719;</div>
        <div class="info-content">
          <h4>Hours</h4>
          <p>Wednesday &mdash; Monday: 10:00 AM &ndash; 6:00 PM<br>Thursday late opening: until 9:00 PM<br>Closed Tuesdays</p>
        </div>
      </div>
      <div class="info-row">
        <div class="info-icon">&#9873;</div>
        <div class="info-content">
          <h4>Location</h4>
          <p>245 Contemporary Avenue<br>Arts District, New York, NY 10013</p>
        </div>
      </div>
      <div class="info-row">
        <div class="info-icon">&#9743;</div>
        <div class="info-content">
          <h4>Contact</h4>
          <p>info@mmca.org<br>(212) 555-0187</p>
        </div>
      </div>
    </div>

    <div class="visitor-col reveal" style="transition-delay:0.15s">
      <h2>Admission</h2>
      <div class="admission-row">
        <div class="admission-type">Adults</div>
        <div class="admission-price">$18</div>
      </div>
      <div class="admission-row">
        <div class="admission-type">Students<span>Valid student ID required</span></div>
        <div class="admission-price">$12</div>
      </div>
      <div class="admission-row">
        <div class="admission-type">Seniors (65+)</div>
        <div class="admission-price">$14</div>
      </div>
      <div class="admission-row">
        <div class="admission-type">Children under 12</div>
        <div class="admission-price" style="color:var(--gallery);font-size:14px;letter-spacing:0.1em">FREE</div>
      </div>
      <div class="admission-row">
        <div class="admission-type">Members</div>
        <div class="admission-price" style="color:var(--gallery);font-size:14px;letter-spacing:0.1em">FREE</div>
      </div>

      <div class="guided-tours">
        <h4>Guided Tours</h4>
        <div class="tour-time"><span>Daily Exhibition Tour</span><span>11:00 AM &amp; 2:00 PM</span></div>
        <div class="tour-time"><span>Thursday Evening Tour</span><span>6:30 PM</span></div>
        <div class="tour-time"><span>Weekend Family Tour</span><span>Saturday 10:30 AM</span></div>
        <div class="tour-time"><span>Curator-Led Tour (Monthly)</span><span>First Sunday, 1:00 PM</span></div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="footer">
  <div class="footer-logo">MMCA</div>
  <div class="footer-copy">&copy; 2026 Metropolitan Museum of Contemporary Art. All rights reserved.</div>
</footer>

<!-- Ticket Modal -->
<div id="ticketModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:60;align-items:center;justify-content:center;padding:16px" onclick="if(event.target===this)this.style.display='none'">
  <div style="background:var(--gallery);padding:32px;max-width:420px;width:100%;position:relative">
    <button onclick="document.getElementById('ticketModal').style.display='none'" style="position:absolute;top:12px;right:12px;width:32px;height:32px;border:none;background:rgba(41,37,36,0.05);cursor:pointer;font-size:16px;color:#78716c;display:flex;align-items:center;justify-content:center">&times;</button>
    <h3 style="font-family:'Cormorant Garamond',serif;font-size:24px;font-style:italic;margin-bottom:20px">Purchase Tickets</h3>
    <div style="margin-bottom:16px">
      <label style="font-size:11px;letter-spacing:0.1em;color:#78716c;display:block;margin-bottom:4px;text-transform:uppercase">Visit Date</label>
      <input type="date" style="width:100%;border:1px solid rgba(41,37,36,0.15);padding:10px 14px;font-size:14px;font-family:'Lato',sans-serif;outline:none">
    </div>
    <div style="margin-bottom:16px">
      <label style="font-size:11px;letter-spacing:0.1em;color:#78716c;display:block;margin-bottom:4px;text-transform:uppercase">Ticket Type</label>
      <select style="width:100%;border:1px solid rgba(41,37,36,0.15);padding:10px 14px;font-size:14px;font-family:'Lato',sans-serif;outline:none;cursor:pointer;background:white">
        <option>Adult &mdash; $18</option>
        <option>Student &mdash; $12</option>
        <option>Senior (65+) &mdash; $14</option>
      </select>
    </div>
    <div style="margin-bottom:16px">
      <label style="font-size:11px;letter-spacing:0.1em;color:#78716c;display:block;margin-bottom:4px;text-transform:uppercase">Quantity</label>
      <select style="width:100%;border:1px solid rgba(41,37,36,0.15);padding:10px 14px;font-size:14px;font-family:'Lato',sans-serif;outline:none;cursor:pointer;background:white">
        <option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
      </select>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <input type="text" placeholder="Full Name" style="border:1px solid rgba(41,37,36,0.15);padding:10px 14px;font-size:14px;font-family:'Lato',sans-serif;outline:none">
      <input type="email" placeholder="Email" style="border:1px solid rgba(41,37,36,0.15);padding:10px 14px;font-size:14px;font-family:'Lato',sans-serif;outline:none">
    </div>
    <button onclick="document.getElementById('ticketModal').style.display='none';showToast('Tickets confirmed! A confirmation email has been sent.')" style="width:100%;background:var(--charcoal);color:var(--gallery);border:none;padding:14px;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer;font-family:'Lato',sans-serif;transition:background 0.3s" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#292524'">Complete Purchase</button>
  </div>
</div>

<!-- Toast -->
<div id="toast" style="position:fixed;bottom:24px;right:24px;background:var(--charcoal);color:var(--gallery);padding:14px 24px;font-size:13px;letter-spacing:0.05em;z-index:70;transform:translateY(80px);opacity:0;transition:all 0.5s cubic-bezier(0.4,0,0.2,1)"></div>

<script>
// Toast
function showToast(msg){
  var t=document.getElementById('toast');
  t.textContent=msg;
  t.style.transform='translateY(0)';
  t.style.opacity='1';
  setTimeout(function(){t.style.transform='translateY(80px)';t.style.opacity='0'},3500);
}

// Reveal on scroll
var obs=new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}
  });
},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el)});

// Gallery horizontal scroll - room dot tracking
var walk=document.getElementById('galleryWalk');
var dots=document.querySelectorAll('.room-dot');
walk.addEventListener('scroll',function(){
  var scrollLeft=walk.scrollLeft;
  var roomWidth=walk.children[0].offsetWidth;
  var activeRoom=Math.round(scrollLeft/roomWidth);
  dots.forEach(function(d,i){
    d.classList.toggle('active',i===activeRoom);
  });
});

// Click dots to navigate
dots.forEach(function(dot){
  dot.addEventListener('click',function(){
    var roomIndex=parseInt(this.getAttribute('data-room'));
    var roomWidth=walk.children[0].offsetWidth;
    walk.scrollTo({left:roomIndex*roomWidth,behavior:'smooth'});
  });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    e.preventDefault();
    var target=document.querySelector(this.getAttribute('href'));
    if(target)target.scrollIntoView({behavior:'smooth'});
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
