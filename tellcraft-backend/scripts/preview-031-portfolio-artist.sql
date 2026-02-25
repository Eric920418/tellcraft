INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '5a839472-c0f3-4184-b565-9cabf107e3b8',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>林若水 — 藝術創作</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Lato:wght@300;400;700&family=Noto+Serif+TC:wght@400;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{wall:'#fafaf9',wallDeep:'#f5f0eb',frame:'#78350f',frameLight:'#92400e',mat:'#fefdfb',cream:'#fdf8f0',ink:'#1c1917',warm:'#b45309',muted:'#a8a29e',subtle:'#d6ccc2'},fontFamily:{display:['"Playfair Display"','"Noto Serif TC"','serif'],body:['"Lato"','sans-serif']}}}}
</script>
<style>
body{font-family:'Lato','sans-serif';background:#fafaf9;color:#1c1917;overflow-x:hidden}

/* Wall texture */
.wall-texture{background-color:#fafaf9;background-image:url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='40' height='40' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E")}

/* Picture frames */
.picture-frame{
  position:relative;
  background:#fefdfb;
  border:8px solid #78350f;
  box-shadow:
    inset 0 0 0 2px #92400e,
    inset 0 0 0 4px rgba(120,53,15,0.15),
    4px 6px 20px rgba(0,0,0,0.18),
    8px 12px 40px rgba(0,0,0,0.1),
    1px 1px 0 rgba(120,53,15,0.3);
  transition:all 0.5s cubic-bezier(0.4,0,0.2,1);
  cursor:pointer;
}
.picture-frame::before{
  content:'';position:absolute;inset:0;
  border:12px solid #fefdfb;
  pointer-events:none;
  z-index:1;
}
.picture-frame:hover{
  transform:translateY(-4px) scale(1.01);
  box-shadow:
    inset 0 0 0 2px #92400e,
    inset 0 0 0 4px rgba(120,53,15,0.15),
    6px 10px 30px rgba(0,0,0,0.22),
    12px 18px 50px rgba(0,0,0,0.12),
    1px 1px 0 rgba(120,53,15,0.3);
}

/* Thin elegant frame variant */
.picture-frame-thin{
  position:relative;
  background:#fefdfb;
  border:3px solid #1c1917;
  box-shadow:
    inset 0 0 0 6px #fefdfb,
    inset 0 0 0 7px #d6ccc2,
    3px 5px 16px rgba(0,0,0,0.14),
    6px 10px 30px rgba(0,0,0,0.08);
  transition:all 0.5s cubic-bezier(0.4,0,0.2,1);
  cursor:pointer;
}
.picture-frame-thin:hover{
  transform:translateY(-3px);
  box-shadow:
    inset 0 0 0 6px #fefdfb,
    inset 0 0 0 7px #d6ccc2,
    5px 8px 24px rgba(0,0,0,0.18),
    10px 14px 40px rgba(0,0,0,0.1);
}

/* Gold ornate frame variant */
.picture-frame-gold{
  position:relative;
  background:#fefdfb;
  border:10px solid #92400e;
  border-image:linear-gradient(135deg,#d97706,#78350f 30%,#b45309 50%,#78350f 70%,#d97706) 1;
  box-shadow:
    inset 0 0 0 3px #fefdfb,
    inset 0 0 0 5px rgba(180,83,9,0.2),
    5px 8px 24px rgba(0,0,0,0.2),
    10px 16px 44px rgba(0,0,0,0.12);
  transition:all 0.5s cubic-bezier(0.4,0,0.2,1);
  cursor:pointer;
}
.picture-frame-gold:hover{
  transform:translateY(-4px) rotate(-0.3deg);
  box-shadow:
    inset 0 0 0 3px #fefdfb,
    inset 0 0 0 5px rgba(180,83,9,0.2),
    8px 12px 32px rgba(0,0,0,0.24),
    14px 20px 50px rgba(0,0,0,0.14);
}

/* Exhibition info cards */
.exhibit-card{
  font-family:'Lato',sans-serif;
  text-align:center;
  padding:16px 8px 0;
}
.exhibit-card .title{font-family:'Playfair Display','Noto Serif TC',serif;font-size:15px;font-weight:600;font-style:italic;color:#1c1917;margin-bottom:3px}
.exhibit-card .meta{font-size:11px;color:#a8a29e;letter-spacing:0.5px;line-height:1.6}

/* Warm lighting effect on wall */
.warm-light{
  position:fixed;top:-200px;left:50%;transform:translateX(-50%);
  width:800px;height:400px;
  background:radial-gradient(ellipse,rgba(253,248,240,0.4) 0%,transparent 70%);
  pointer-events:none;z-index:0;
}

/* Reveal animation */
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.reveal-delay-1{transition-delay:0.1s}
.reveal-delay-2{transition-delay:0.2s}
.reveal-delay-3{transition-delay:0.3s}
.reveal-delay-4{transition-delay:0.4s}

/* Hanging wire */
.hanging-wire{
  position:absolute;top:-28px;left:50%;transform:translateX(-50%);
  width:40px;height:28px;
  border-bottom:2px solid #d6ccc2;
  border-radius:0 0 50% 50%;
}
.hanging-wire::before{
  content:'';position:absolute;top:-3px;left:50%;transform:translateX(-50%);
  width:6px;height:6px;background:#a8a29e;border-radius:50%;
}

/* Spotlight glow on hover */
.spotlight-glow:hover::after{
  content:'';position:absolute;top:-20px;left:10%;right:10%;height:20px;
  background:linear-gradient(to bottom,rgba(253,248,240,0.6),transparent);
  pointer-events:none;
}

/* Toast */
.toast{position:fixed;bottom:24px;right:24px;background:#1c1917;color:#fafaf9;padding:14px 24px;border-radius:8px;font-size:14px;font-weight:500;transform:translateY(100px);opacity:0;transition:all 0.4s;z-index:9999}
.toast.show{transform:translateY(0);opacity:1}

/* Lightbox */
.lightbox{position:fixed;inset:0;background:rgba(28,25,23,0.94);z-index:100;display:none;align-items:center;justify-content:center;padding:24px;flex-direction:column}

/* Scrollbar */
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:#fafaf9}
::-webkit-scrollbar-thumb{background:#d6ccc2;border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:#a8a29e}

/* Gallery rail */
.gallery-rail{
  width:100%;height:2px;
  background:linear-gradient(90deg,transparent,#d6ccc2 10%,#d6ccc2 90%,transparent);
  margin-bottom:60px;
}
</style>
</head>
<body class="wall-texture">

<div class="warm-light"></div>
<div class="toast" id="toast"></div>

<!-- Lightbox -->
<div class="lightbox" id="lightbox" onclick="closeLightbox()">
  <div id="lightbox-content" style="max-width:700px;width:100%;text-align:center" onclick="event.stopPropagation()"></div>
  <button onclick="closeLightbox()" style="position:absolute;top:24px;right:24px;background:none;border:none;color:#fafaf9;font-size:24px;cursor:pointer;font-family:'Lato',sans-serif;letter-spacing:2px">CLOSE</button>
  <div style="position:absolute;bottom:32px;display:flex;gap:20px">
    <button onclick="navLightbox(-1)" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fafaf9;padding:10px 24px;cursor:pointer;font-size:13px;font-family:'Lato',sans-serif;letter-spacing:1px;transition:all 0.3s" onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">&#8592; PREV</button>
    <button onclick="navLightbox(1)" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fafaf9;padding:10px 24px;cursor:pointer;font-size:13px;font-family:'Lato',sans-serif;letter-spacing:1px;transition:all 0.3s" onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">NEXT &#8594;</button>
  </div>
</div>

<!-- Nav -->
<nav style="position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(250,250,249,0.92);backdrop-filter:blur(10px);border-bottom:1px solid #ebe5db">
  <div style="max-width:1100px;margin:0 auto;padding:16px 32px;display:flex;align-items:center;justify-content:between">
    <div style="flex:1;cursor:pointer" onclick="navigateTo('hero')">
      <span style="font-family:'Playfair Display','Noto Serif TC',serif;font-size:20px;font-weight:700;color:#1c1917;letter-spacing:1px">RUOSHUI</span>
      <span style="font-size:10px;color:#a8a29e;margin-left:8px;letter-spacing:3px;font-weight:300">GALLERY</span>
    </div>
    <div style="display:flex;align-items:center;gap:32px">
      <a onclick="navigateTo('gallery')" style="text-decoration:none;color:#a8a29e;font-size:12px;font-weight:400;cursor:pointer;letter-spacing:2px;transition:color 0.3s" onmouseover="this.style.color='#78350f'" onmouseout="this.style.color='#a8a29e'">WORKS</a>
      <a onclick="navigateTo('about')" style="text-decoration:none;color:#a8a29e;font-size:12px;font-weight:400;cursor:pointer;letter-spacing:2px;transition:color 0.3s" onmouseover="this.style.color='#78350f'" onmouseout="this.style.color='#a8a29e'">ARTIST</a>
      <a onclick="navigateTo('exhibitions')" style="text-decoration:none;color:#a8a29e;font-size:12px;font-weight:400;cursor:pointer;letter-spacing:2px;transition:color 0.3s" onmouseover="this.style.color='#78350f'" onmouseout="this.style.color='#a8a29e'">EXHIBITIONS</a>
      <a onclick="navigateTo('contact')" style="text-decoration:none;color:#a8a29e;font-size:12px;font-weight:400;cursor:pointer;letter-spacing:2px;transition:color 0.3s" onmouseover="this.style.color='#78350f'" onmouseout="this.style.color='#a8a29e'">INQUIRIES</a>
    </div>
  </div>
</nav>

<!-- Hero: Gallery entrance -->
<section id="sec-hero" style="padding:130px 32px 40px;text-align:center;position:relative">
  <div style="max-width:800px;margin:0 auto" class="reveal">
    <div style="font-size:11px;color:#a8a29e;letter-spacing:5px;margin-bottom:20px;font-weight:300">CONTEMPORARY ART &amp; ILLUSTRATION</div>
    <h1 style="font-family:'Playfair Display','Noto Serif TC',serif;font-size:clamp(2.5rem,6vw,4.5rem);font-weight:700;line-height:1.1;margin-bottom:20px;color:#1c1917">
      林若水<br><span style="font-style:italic;color:#78350f">Gallery</span>
    </h1>
    <p style="font-size:15px;color:#a8a29e;max-width:480px;margin:0 auto;line-height:1.9;font-weight:300">
      以水彩、油畫與水墨捕捉光影之間的對話。<br>每一幅作品都是一段凝固的時光。
    </p>
  </div>
</section>

<!-- Featured Work: Large hero frame -->
<section style="padding:20px 32px 60px">
  <div style="max-width:700px;margin:0 auto;position:relative" class="reveal">
    <div class="hanging-wire"></div>
    <div class="picture-frame-gold spotlight-glow" onclick="openLightbox(0)" style="padding:16px">
      <div style="background:linear-gradient(135deg,#fef3c7 0%,#f59e0b 60%,#d97706 100%);aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
        <div style="position:absolute;inset:0;background:linear-gradient(45deg,rgba(255,255,255,0) 40%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0) 60%);pointer-events:none"></div>
        <span style="font-size:80px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.1))">🌅</span>
      </div>
    </div>
    <div class="exhibit-card">
      <div class="title">Untitled #1 &mdash; 晨光市場</div>
      <div class="meta">2026 &middot; Oil on Canvas &middot; 100 &times; 62 cm</div>
      <div class="meta" style="margin-top:2px;font-style:italic;color:#b45309">Private Collection</div>
    </div>
  </div>
</section>

<!-- Gallery Rail Divider -->
<div style="max-width:1100px;margin:0 auto;padding:0 32px">
  <div class="gallery-rail"></div>
</div>

<!-- Gallery Wall Section -->
<section id="sec-gallery" style="padding:0 32px 40px">
  <div style="max-width:1100px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:48px">
      <div style="font-size:11px;color:#a8a29e;letter-spacing:4px;margin-bottom:12px;font-weight:300">SELECTED WORKS</div>
      <h2 style="font-family:'Playfair Display','Noto Serif TC',serif;font-size:32px;font-weight:700">The Gallery Wall</h2>
    </div>

    <!-- Filter buttons styled as gallery labels -->
    <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:48px" class="reveal reveal-delay-1">
      <button onclick="filterGallery(this,'all')" class="filter-btn active" style="padding:6px 16px;font-size:11px;letter-spacing:2px;cursor:pointer;border:1px solid #1c1917;background:#1c1917;color:#fafaf9;font-family:'Lato',sans-serif;transition:all 0.3s">ALL</button>
      <button onclick="filterGallery(this,'watercolor')" class="filter-btn" style="padding:6px 16px;font-size:11px;letter-spacing:2px;cursor:pointer;border:1px solid #d6ccc2;background:transparent;color:#a8a29e;font-family:'Lato',sans-serif;transition:all 0.3s">WATERCOLOR</button>
      <button onclick="filterGallery(this,'oil')" class="filter-btn" style="padding:6px 16px;font-size:11px;letter-spacing:2px;cursor:pointer;border:1px solid #d6ccc2;background:transparent;color:#a8a29e;font-family:'Lato',sans-serif;transition:all 0.3s">OIL</button>
      <button onclick="filterGallery(this,'ink')" class="filter-btn" style="padding:6px 16px;font-size:11px;letter-spacing:2px;cursor:pointer;border:1px solid #d6ccc2;background:transparent;color:#a8a29e;font-family:'Lato',sans-serif;transition:all 0.3s">INK</button>
      <button onclick="filterGallery(this,'mixed')" class="filter-btn" style="padding:6px 16px;font-size:11px;letter-spacing:2px;cursor:pointer;border:1px solid #d6ccc2;background:transparent;color:#a8a29e;font-family:'Lato',sans-serif;transition:all 0.3s">MIXED MEDIA</button>
    </div>

    <!-- Gallery Wall Grid: salon-style hanging -->
    <div id="gallery-wall"></div>
  </div>
</section>

<!-- Gallery Rail Divider -->
<div style="max-width:1100px;margin:0 auto;padding:0 32px">
  <div class="gallery-rail"></div>
</div>

<!-- About / Artist Bio -->
<section id="sec-about" style="padding:60px 32px 80px">
  <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1.4fr;gap:60px;align-items:start">
    <!-- Artist portrait in frame -->
    <div class="reveal" style="position:relative">
      <div class="hanging-wire" style="top:-28px"></div>
      <div class="picture-frame" style="padding:12px">
        <div style="background:linear-gradient(135deg,#fde68a,#f59e0b);aspect-ratio:3/4;display:flex;align-items:center;justify-content:center">
          <span style="font-size:100px">👩‍🎨</span>
        </div>
      </div>
      <div class="exhibit-card">
        <div class="meta">Self-Portrait, Studio, 2024</div>
      </div>
    </div>
    <!-- Bio text -->
    <div class="reveal reveal-delay-2">
      <div style="font-size:11px;color:#78350f;letter-spacing:4px;margin-bottom:16px;font-weight:700">ARTIST STATEMENT</div>
      <h2 style="font-family:'Playfair Display','Noto Serif TC',serif;font-size:clamp(1.8rem,3vw,2.6rem);font-weight:700;line-height:1.3;margin-bottom:20px">
        林若水<br><span style="font-weight:400;font-style:italic;color:#78350f">Ruoshui Lin</span>
      </h2>
      <p style="font-size:15px;color:#57534e;line-height:2;margin-bottom:16px;font-weight:300">
        1992 年生於台南。台北藝術大學美術系畢業，後赴英國皇家藝術學院（RCA）攻讀繪畫碩士。作品以水彩的透明層次與油畫的厚實質感交織，捕捉日常生活中被忽視的光影瞬間。
      </p>
      <p style="font-size:15px;color:#57534e;line-height:2;margin-bottom:24px;font-weight:300">
        曾入選 Bologna 兒童插畫展、3&times;3 國際插畫獎，並在台北、東京、倫敦舉辦過個展。創作靈感來自菜市場的色彩、老城區的光影、雨後街道的氣味。
      </p>
      <blockquote style="font-family:'Playfair Display','Noto Serif TC',serif;font-size:20px;color:#78350f;font-style:italic;line-height:1.7;padding-left:20px;border-left:2px solid #78350f;margin-bottom:28px">
        &ldquo;I paint not the object itself, but the conversation between the object and light.&rdquo;
      </blockquote>
      <!-- Stats in gallery label style -->
      <div style="display:flex;gap:32px;padding-top:20px;border-top:1px solid #ebe5db">
        <div style="text-align:center">
          <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#78350f">12</div>
          <div style="font-size:11px;color:#a8a29e;letter-spacing:2px">SOLO SHOWS</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#78350f">200+</div>
          <div style="font-size:11px;color:#a8a29e;letter-spacing:2px">WORKS</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#78350f">8</div>
          <div style="font-size:11px;color:#a8a29e;letter-spacing:2px">AWARDS</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Exhibitions -->
<section id="sec-exhibitions" style="padding:60px 32px 80px;background:linear-gradient(180deg,#f5f0eb 0%,#fafaf9 100%)">
  <div style="max-width:800px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:48px">
      <div style="font-size:11px;color:#a8a29e;letter-spacing:4px;margin-bottom:12px;font-weight:300">CURRICULUM VITAE</div>
      <h2 style="font-family:'Playfair Display','Noto Serif TC',serif;font-size:32px;font-weight:700">Exhibitions</h2>
    </div>

    <!-- Upcoming -->
    <div class="reveal reveal-delay-1" style="margin-bottom:36px">
      <div style="font-size:11px;color:#78350f;letter-spacing:3px;font-weight:700;margin-bottom:20px;padding-bottom:8px;border-bottom:1px solid #ebe5db">UPCOMING</div>
      <div style="background:#fff;padding:28px;border:1px solid #ebe5db;display:flex;gap:24px;align-items:flex-start;transition:all 0.3s;cursor:pointer;position:relative;overflow:hidden" onmouseover="this.style.boxShadow='0 4px 20px rgba(0,0,0,0.06)'" onmouseout="this.style.boxShadow='none'" onclick="showToast('Exhibition details coming soon')">
        <div style="position:absolute;top:0;left:0;bottom:0;width:3px;background:#78350f"></div>
        <div style="min-width:64px;text-align:center;padding-left:12px">
          <div style="font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:#78350f;line-height:1">MAR</div>
          <div style="font-size:12px;color:#a8a29e">2026</div>
        </div>
        <div>
          <div style="font-size:10px;color:#78350f;font-weight:700;letter-spacing:2px;margin-bottom:4px">SOLO EXHIBITION</div>
          <h3 style="font-family:'Playfair Display','Noto Serif TC',serif;font-size:20px;font-weight:700;margin-bottom:6px;font-style:italic">水的記憶 &mdash; Memory of Water</h3>
          <p style="font-size:13px;color:#78716c;line-height:1.7">Taipei Fine Arts Museum &middot; March 15 &ndash; May 30, 2026</p>
          <p style="font-size:12px;color:#a8a29e;margin-top:4px">Curated by Chen Wei-Ming &middot; 32 new works</p>
        </div>
      </div>
    </div>

    <!-- Past -->
    <div class="reveal reveal-delay-2">
      <div style="font-size:11px;color:#a8a29e;letter-spacing:3px;font-weight:700;margin-bottom:20px;padding-bottom:8px;border-bottom:1px solid #ebe5db">SELECTED PAST EXHIBITIONS</div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div style="padding:20px 24px;border:1px solid #ebe5db;display:flex;gap:20px;align-items:center;cursor:pointer;transition:all 0.3s;background:#fff" onmouseover="this.style.borderColor='#78350f'" onmouseout="this.style.borderColor='#ebe5db'" onclick="showToast('Exhibition archive')">
          <div style="font-size:13px;color:#a8a29e;min-width:40px;font-weight:700">2025</div>
          <div style="flex:1">
            <span style="font-family:'Playfair Display',serif;font-size:15px;font-weight:600;font-style:italic">Asian Contemporary Illustration</span>
            <span style="font-size:13px;color:#a8a29e"> &mdash; Tokyo Metropolitan Art Museum</span>
          </div>
          <div style="font-size:10px;color:#a8a29e;letter-spacing:1px">GROUP</div>
        </div>
        <div style="padding:20px 24px;border:1px solid #ebe5db;display:flex;gap:20px;align-items:center;cursor:pointer;transition:all 0.3s;background:#fff" onmouseover="this.style.borderColor='#78350f'" onmouseout="this.style.borderColor='#ebe5db'" onclick="showToast('Exhibition archive')">
          <div style="font-size:13px;color:#a8a29e;min-width:40px;font-weight:700">2025</div>
          <div style="flex:1">
            <span style="font-family:'Playfair Display',serif;font-size:15px;font-weight:600;font-style:italic">日常的詩 &mdash; Poetry of the Everyday</span>
            <span style="font-size:13px;color:#a8a29e"> &mdash; Somerset House, London</span>
          </div>
          <div style="font-size:10px;color:#78350f;letter-spacing:1px;font-weight:700">SOLO</div>
        </div>
        <div style="padding:20px 24px;border:1px solid #ebe5db;display:flex;gap:20px;align-items:center;cursor:pointer;transition:all 0.3s;background:#fff" onmouseover="this.style.borderColor='#78350f'" onmouseout="this.style.borderColor='#ebe5db'" onclick="showToast('Exhibition archive')">
          <div style="font-size:13px;color:#a8a29e;min-width:40px;font-weight:700">2024</div>
          <div style="flex:1">
            <span style="font-family:'Playfair Display',serif;font-size:15px;font-weight:600;font-style:italic">Bologna Children&rsquo;s Book Fair</span>
            <span style="font-size:13px;color:#a8a29e"> &mdash; Illustrators Exhibition, Selected</span>
          </div>
          <div style="font-size:10px;color:#a8a29e;letter-spacing:1px">SELECTED</div>
        </div>
        <div style="padding:20px 24px;border:1px solid #ebe5db;display:flex;gap:20px;align-items:center;cursor:pointer;transition:all 0.3s;background:#fff" onmouseover="this.style.borderColor='#78350f'" onmouseout="this.style.borderColor='#ebe5db'" onclick="showToast('Exhibition archive')">
          <div style="font-size:13px;color:#a8a29e;min-width:40px;font-weight:700">2024</div>
          <div style="flex:1">
            <span style="font-family:'Playfair Display',serif;font-size:15px;font-weight:600;font-style:italic">光與影的邊界</span>
            <span style="font-size:13px;color:#a8a29e"> &mdash; Kaohsiung Museum of Fine Arts</span>
          </div>
          <div style="font-size:10px;color:#78350f;letter-spacing:1px;font-weight:700">SOLO</div>
        </div>
        <div style="padding:20px 24px;border:1px solid #ebe5db;display:flex;gap:20px;align-items:center;cursor:pointer;transition:all 0.3s;background:#fff" onmouseover="this.style.borderColor='#78350f'" onmouseout="this.style.borderColor='#ebe5db'" onclick="showToast('Exhibition archive')">
          <div style="font-size:13px;color:#a8a29e;min-width:40px;font-weight:700">2023</div>
          <div style="flex:1">
            <span style="font-family:'Playfair Display',serif;font-size:15px;font-weight:600;font-style:italic">3&times;3 International Illustration Awards</span>
            <span style="font-size:13px;color:#a8a29e"> &mdash; Distinguished Merit</span>
          </div>
          <div style="font-size:10px;color:#a8a29e;letter-spacing:1px">AWARD</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Commission Inquiries / Contact -->
<section id="sec-contact" style="padding:80px 32px">
  <div style="max-width:600px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:40px">
      <div style="font-size:11px;color:#a8a29e;letter-spacing:4px;margin-bottom:12px;font-weight:300">GET IN TOUCH</div>
      <h2 style="font-family:'Playfair Display','Noto Serif TC',serif;font-size:32px;font-weight:700">Commission Inquiries</h2>
      <p style="font-size:14px;color:#a8a29e;margin-top:12px;line-height:1.8;font-weight:300">
        Accepting commissions for original paintings, illustration projects,<br>exhibition invitations, and publication collaborations.
      </p>
    </div>
    <div class="reveal reveal-delay-1" style="background:#fff;border:1px solid #ebe5db;padding:36px">
      <div style="margin-bottom:20px">
        <label style="font-size:11px;color:#a8a29e;display:block;margin-bottom:6px;letter-spacing:2px">NAME</label>
        <input type="text" placeholder="Your name" style="width:100%;padding:12px 0;border:none;border-bottom:1px solid #ebe5db;font-size:14px;outline:none;background:transparent;font-family:'Lato',sans-serif;color:#1c1917" onfocus="this.style.borderBottomColor='#78350f'" onblur="this.style.borderBottomColor='#ebe5db'">
      </div>
      <div style="margin-bottom:20px">
        <label style="font-size:11px;color:#a8a29e;display:block;margin-bottom:6px;letter-spacing:2px">EMAIL</label>
        <input type="email" placeholder="email@example.com" style="width:100%;padding:12px 0;border:none;border-bottom:1px solid #ebe5db;font-size:14px;outline:none;background:transparent;font-family:'Lato',sans-serif;color:#1c1917" onfocus="this.style.borderBottomColor='#78350f'" onblur="this.style.borderBottomColor='#ebe5db'">
      </div>
      <div style="margin-bottom:20px">
        <label style="font-size:11px;color:#a8a29e;display:block;margin-bottom:6px;letter-spacing:2px">INQUIRY TYPE</label>
        <select style="width:100%;padding:12px 0;border:none;border-bottom:1px solid #ebe5db;font-size:14px;outline:none;background:transparent;font-family:'Lato',sans-serif;color:#1c1917;cursor:pointer">
          <option>Commission &mdash; Original Painting</option>
          <option>Commission &mdash; Illustration</option>
          <option>Exhibition Invitation</option>
          <option>Publication Collaboration</option>
          <option>Print Inquiry</option>
          <option>Other</option>
        </select>
      </div>
      <div style="margin-bottom:24px">
        <label style="font-size:11px;color:#a8a29e;display:block;margin-bottom:6px;letter-spacing:2px">MESSAGE</label>
        <textarea rows="4" placeholder="Describe your project or inquiry..." style="width:100%;padding:12px 0;border:none;border-bottom:1px solid #ebe5db;font-size:14px;outline:none;resize:vertical;background:transparent;font-family:'Lato',sans-serif;color:#1c1917;line-height:1.7" onfocus="this.style.borderBottomColor='#78350f'" onblur="this.style.borderBottomColor='#ebe5db'"></textarea>
      </div>
      <button onclick="showToast('Inquiry sent. Thank you.')" style="width:100%;padding:14px;background:#78350f;color:#fafaf9;border:none;font-size:12px;letter-spacing:3px;cursor:pointer;font-family:'Lato',sans-serif;font-weight:700;transition:all 0.3s" onmouseover="this.style.background='#92400e'" onmouseout="this.style.background='#78350f'">SEND INQUIRY</button>
    </div>
    <!-- Social / gallery links -->
    <div class="reveal reveal-delay-2" style="display:flex;justify-content:center;gap:32px;margin-top:28px">
      <a style="font-size:11px;color:#a8a29e;text-decoration:none;cursor:pointer;letter-spacing:2px;transition:color 0.3s" onmouseover="this.style.color='#78350f'" onmouseout="this.style.color='#a8a29e'">INSTAGRAM</a>
      <a style="font-size:11px;color:#a8a29e;text-decoration:none;cursor:pointer;letter-spacing:2px;transition:color 0.3s" onmouseover="this.style.color='#78350f'" onmouseout="this.style.color='#a8a29e'">BEHANCE</a>
      <a style="font-size:11px;color:#a8a29e;text-decoration:none;cursor:pointer;letter-spacing:2px;transition:color 0.3s" onmouseover="this.style.color='#78350f'" onmouseout="this.style.color='#a8a29e'">ARTSY</a>
    </div>
  </div>
</section>

<!-- Footer -->
<footer style="padding:40px 32px;border-top:1px solid #ebe5db;text-align:center;background:#f5f0eb">
  <div style="font-family:'Playfair Display','Noto Serif TC',serif;font-size:16px;font-weight:600;color:#1c1917;margin-bottom:4px">林若水 Ruoshui Lin</div>
  <div style="font-size:11px;color:#a8a29e;letter-spacing:1px">&copy; 2026 All rights reserved. Art &amp; Illustration.</div>
  <div style="font-size:10px;color:#d6ccc2;margin-top:8px;letter-spacing:1px">Represented by Whitespace Gallery, Taipei</div>
</footer>

<script>
// Artwork data with art-world metadata
const works=[
  {id:0,title:'晨光市場',titleEn:'Morning Market',cat:'oil',medium:'Oil on Canvas',dim:'100 × 62 cm',year:'2026',emoji:'🌅',colors:['#fef3c7','#f59e0b'],desc:'清晨五點的南門市場，蔬果攤在暖光下甦醒。',frame:'gold',collection:'Private Collection'},
  {id:1,title:'雨後巷弄',titleEn:'After the Rain, Alley',cat:'watercolor',medium:'Watercolor on Paper',dim:'56 × 76 cm',year:'2025',emoji:'🌧️',colors:['#dbeafe','#93c5fd'],desc:'大稻埕的窄巷，雨水在磚牆上留下的光影。',frame:'classic',collection:'Artist Collection'},
  {id:2,title:'貓與窗台',titleEn:'Cat on the Sill',cat:'watercolor',medium:'Watercolor on Paper',dim:'38 × 46 cm',year:'2025',emoji:'🐱',colors:['#fce7f3','#f9a8d4'],desc:'午後陽光灑進窗台，橘貓在花盆間打盹。',frame:'thin',collection:''},
  {id:3,title:'山嵐',titleEn:'Mountain Mist',cat:'ink',medium:'Ink on Xuan Paper',dim:'90 × 60 cm',year:'2025',emoji:'🏔️',colors:['#f3f4f6','#9ca3af'],desc:'阿里山雲霧繚繞，樹影在霧中若隱若現。',frame:'classic',collection:'Kaohsiung Museum of Fine Arts'},
  {id:4,title:'咖啡館',titleEn:'The Coffee House',cat:'mixed',medium:'Mixed Media on Board',dim:'30 × 30 cm',year:'2025',emoji:'☕',colors:['#fef3c7','#d97706'],desc:'民生社區的小咖啡館，老闆在吧台後專注沖泡。',frame:'thin',collection:''},
  {id:5,title:'夏日海岸',titleEn:'Summer Coast',cat:'oil',medium:'Oil on Canvas',dim:'120 × 80 cm',year:'2024',emoji:'🌊',colors:['#cffafe','#22d3ee'],desc:'墾丁的午後海岸線，浪花與天空融為一體。',frame:'gold',collection:'Private Collection'},
  {id:6,title:'森林精靈',titleEn:'Forest Spirit',cat:'watercolor',medium:'Watercolor on Paper',dim:'42 × 56 cm',year:'2024',emoji:'🧚',colors:['#dcfce7','#86efac'],desc:'童書插畫系列，森林裡住著發光的小精靈。',frame:'classic',collection:''},
  {id:7,title:'老屋門扉',titleEn:'The Old Door',cat:'ink',medium:'Ink on Xuan Paper',dim:'68 × 45 cm',year:'2024',emoji:'🚪',colors:['#fef3c7','#a8a29e'],desc:'台南安平老街，斑駁的木門訴說著歲月。',frame:'thin',collection:''},
  {id:8,title:'夜市人生',titleEn:'Night Market Life',cat:'oil',medium:'Oil on Canvas',dim:'90 × 60 cm',year:'2024',emoji:'🏮',colors:['#fef2f2','#fca5a5'],desc:'饒河夜市的繁忙與煙火氣。',frame:'classic',collection:'Taipei Fine Arts Museum'},
  {id:9,title:'竹林風聲',titleEn:'Bamboo Wind',cat:'ink',medium:'Ink on Xuan Paper',dim:'120 × 50 cm',year:'2023',emoji:'🎋',colors:['#ecfdf5','#6ee7b7'],desc:'嘉義竹崎，風過竹林的聲音化為墨色。',frame:'gold',collection:''},
  {id:10,title:'花店女孩',titleEn:'The Flower Girl',cat:'watercolor',medium:'Watercolor on Paper',dim:'38 × 46 cm',year:'2023',emoji:'💐',colors:['#fdf2f8','#f9a8d4'],desc:'師大路上的小花店，女孩在修剪枝葉。',frame:'thin',collection:'Private Collection'},
  {id:11,title:'車站光影',titleEn:'Station Light',cat:'mixed',medium:'Charcoal & Wash on Paper',dim:'56 × 76 cm',year:'2023',emoji:'🚂',colors:['#f5f5f4','#a8a29e'],desc:'台北車站大廳，人們在光束下穿梭。',frame:'classic',collection:''}
];

let currentLightboxIdx=0;

// Frame class map
const frameClass={gold:'picture-frame-gold',classic:'picture-frame',thin:'picture-frame-thin'};

// Varied sizes simulating salon-style hanging
const sizePresets=[
  {w:'100%',h:'280px',pad:'14px'},
  {w:'100%',h:'220px',pad:'10px'},
  {w:'100%',h:'320px',pad:'16px'},
  {w:'100%',h:'240px',pad:'12px'},
  {w:'100%',h:'260px',pad:'10px'},
  {w:'100%',h:'300px',pad:'14px'},
];

function renderGallery(cat){
  const filtered=cat==='all'?works:works.filter(w=>w.cat===cat);
  const wall=document.getElementById('gallery-wall');

  // 3-column salon-style layout
  wall.innerHTML=`<div style="columns:3;column-gap:32px">
    ${filtered.map((w,i)=>{
      const size=sizePresets[i%sizePresets.length];
      const fc=frameClass[w.frame]||'picture-frame';
      const collectionLine=w.collection?`<div class="meta" style="font-style:italic;color:#b45309">${w.collection}</div>`:'';
      return `<div style="break-inside:avoid;margin-bottom:40px;position:relative" class="reveal visible">
        <div style="position:relative">
          <div class="hanging-wire"></div>
          <div class="${fc} spotlight-glow" onclick="openLightbox(${w.id})" style="padding:${size.pad}">
            <div style="background:linear-gradient(135deg,${w.colors[0]},${w.colors[1]});height:${size.h};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
              <div style="position:absolute;inset:0;background:linear-gradient(45deg,rgba(255,255,255,0) 40%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0) 60%);pointer-events:none"></div>
              <span style="font-size:48px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.08))">${w.emoji}</span>
            </div>
          </div>
        </div>
        <div class="exhibit-card">
          <div class="title">${w.titleEn}</div>
          <div class="meta">${w.year} &middot; ${w.medium} &middot; ${w.dim}</div>
          ${collectionLine}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function filterGallery(btn,cat){
  document.querySelectorAll('.filter-btn').forEach(b=>{
    b.style.background='transparent';b.style.color='#a8a29e';b.style.borderColor='#d6ccc2';b.classList.remove('active');
  });
  btn.style.background='#1c1917';btn.style.color='#fafaf9';btn.style.borderColor='#1c1917';btn.classList.add('active');
  renderGallery(cat);
}

function openLightbox(id){
  currentLightboxIdx=works.findIndex(w=>w.id===id);
  if(currentLightboxIdx<0)currentLightboxIdx=0;
  renderLightbox();
  document.getElementById('lightbox').style.display='flex';
  document.body.style.overflow='hidden';
}
function closeLightbox(){
  document.getElementById('lightbox').style.display='none';
  document.body.style.overflow='';
}
function navLightbox(dir){
  currentLightboxIdx=(currentLightboxIdx+dir+works.length)%works.length;
  renderLightbox();
}
function renderLightbox(){
  const w=works[currentLightboxIdx];
  const collectionLine=w.collection?`<div style="font-size:12px;color:#b45309;font-style:italic;margin-top:4px">${w.collection}</div>`:'';
  document.getElementById('lightbox-content').innerHTML=`
    <div style="display:inline-block;background:#fefdfb;border:8px solid #78350f;box-shadow:inset 0 0 0 12px #fefdfb,4px 6px 20px rgba(0,0,0,0.3);padding:16px;margin-bottom:24px">
      <div style="background:linear-gradient(135deg,${w.colors[0]},${w.colors[1]});width:100%;min-height:300px;display:flex;align-items:center;justify-content:center;padding:60px">
        <span style="font-size:100px">${w.emoji}</span>
      </div>
    </div>
    <h2 style="font-family:'Playfair Display','Noto Serif TC',serif;font-size:24px;font-weight:700;color:#fafaf9;margin-bottom:4px;font-style:italic">${w.titleEn}</h2>
    <div style="font-family:'Playfair Display','Noto Serif TC',serif;font-size:16px;color:#a8a29e;margin-bottom:8px">${w.title}</div>
    <div style="font-size:13px;color:#78716c;margin-bottom:4px">${w.year} &middot; ${w.medium} &middot; ${w.dim}</div>
    ${collectionLine}
    <p style="font-size:14px;color:#d6d3d1;line-height:1.8;max-width:500px;margin:12px auto 0">${w.desc}</p>
  `;
}

function navigateTo(id){
  const el=document.getElementById('sec-'+id);
  if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
}

function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}

// Init
renderGallery('all');

// Intersection observer for reveal animations
const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}});
},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
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
