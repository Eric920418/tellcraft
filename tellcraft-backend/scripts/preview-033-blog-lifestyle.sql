INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '0b5df05f-9a59-4f96-851e-24f26152bc34',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VELVET — Lifestyle Magazine</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Nunito:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config={
  theme:{
    extend:{
      colors:{
        blush:'#fce7f3',
        charcoal:'#292524',
        gold:'#b8860b',
        cream:'#fefaf6',
        'cream-dark':'#f5efe7',
        'warm-gray':'#78716c'
      },
      fontFamily:{
        display:['Playfair Display','Noto Sans TC','serif'],
        body:['Nunito','Noto Sans TC','sans-serif']
      }
    }
  }
}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Nunito','Noto Sans TC',sans-serif;background:#fefaf6;color:#292524;overflow-x:hidden}

/* Pull Quote Signature Element */
.pull-quote{
  position:relative;
  padding:32px 32px 32px 40px;
  margin:40px 0;
  border-left:3px solid #b8860b;
  background:linear-gradient(135deg,#fefaf6,#fce7f3 40%,#fefaf6);
}
.pull-quote::before{
  content:"\201C";
  position:absolute;
  top:-8px;
  left:12px;
  font-family:'Playfair Display',serif;
  font-size:64px;
  color:#b8860b;
  line-height:1;
  opacity:0.8;
}
.pull-quote::after{
  content:"\201D";
  position:absolute;
  bottom:-20px;
  right:24px;
  font-family:'Playfair Display',serif;
  font-size:64px;
  color:#b8860b;
  line-height:1;
  opacity:0.4;
}
.pull-quote p{
  font-family:'Playfair Display','Noto Sans TC',serif;
  font-style:italic;
  font-size:20px;
  line-height:1.7;
  color:#292524;
}
.pull-quote cite{
  display:block;
  margin-top:12px;
  font-family:'Nunito',sans-serif;
  font-style:normal;
  font-size:13px;
  color:#b8860b;
  font-weight:600;
}

.pill{
  display:inline-block;
  padding:8px 20px;
  border-radius:9999px;
  font-size:13px;
  font-weight:600;
  cursor:pointer;
  transition:all 0.3s;
  border:1.5px solid transparent;
}
.pill:hover{transform:translateY(-1px)}
.pill-active{background:#292524;color:#fefaf6;border-color:#292524}
.pill-inactive{background:transparent;color:#78716c;border-color:#d6d3d1}
.pill-inactive:hover{border-color:#292524;color:#292524}

.card{
  border-radius:12px;
  overflow:hidden;
  cursor:pointer;
  transition:all 0.4s ease;
  background:#fff;
}
.card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(41,37,36,0.08)}
.card img,.card-img{width:100%;object-fit:cover;display:block}

.reveal{opacity:0;transform:translateY(24px);transition:all 0.7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}

.mobile-menu{
  position:fixed;top:0;left:0;right:0;bottom:0;
  background:rgba(254,250,246,0.98);
  backdrop-filter:blur(12px);
  z-index:200;
  display:none;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:32px;
}
.mobile-menu.open{display:flex}

.toast{
  position:fixed;bottom:24px;right:24px;
  background:#292524;color:#fefaf6;
  padding:14px 28px;border-radius:9999px;
  font-size:14px;font-weight:500;
  transform:translateY(100px);opacity:0;
  transition:all 0.4s;z-index:9999;
  font-family:'Nunito',sans-serif;
}
.toast.show{transform:translateY(0);opacity:1}

.newsletter-input{
  border:1.5px solid #d6d3d1;
  border-radius:9999px;
  padding:14px 24px;
  font-size:14px;
  outline:none;
  width:100%;
  background:#fff;
  font-family:'Nunito',sans-serif;
  transition:border-color 0.3s;
}
.newsletter-input:focus{border-color:#b8860b}
.newsletter-input::placeholder{color:#a8a29e}

.btn-dark{
  background:#292524;color:#fefaf6;
  border:none;padding:14px 32px;
  border-radius:9999px;font-weight:600;
  cursor:pointer;transition:all 0.3s;
  font-size:14px;font-family:'Nunito',sans-serif;
}
.btn-dark:hover{background:#44403c;transform:translateY(-1px)}

.btn-gold{
  background:#b8860b;color:#fff;
  border:none;padding:14px 32px;
  border-radius:9999px;font-weight:600;
  cursor:pointer;transition:all 0.3s;
  font-size:14px;font-family:'Nunito',sans-serif;
}
.btn-gold:hover{background:#996f09;transform:translateY(-1px)}

@media(max-width:768px){
  .magazine-grid{grid-template-columns:1fr !important}
  .posts-grid{grid-template-columns:1fr !important}
  .posts-grid .large-card{grid-column:span 1 !important;grid-row:span 1 !important}
  .footer-grid{grid-template-columns:1fr !important;text-align:center}
  .pull-quote{padding:24px 24px 24px 32px;margin:24px 0}
  .pull-quote::before{font-size:48px;left:8px}
  .pull-quote p{font-size:17px}
  .nav-links{display:none !important}
  .mobile-toggle{display:flex !important}
}
@media(min-width:769px){
  .mobile-toggle{display:none !important}
}
</style>
</head>
<body>

<div class="toast" id="toast"></div>
<div class="mobile-menu" id="mobileMenu">
  <button onclick="toggleMobile()" style="position:absolute;top:20px;right:24px;background:none;border:none;font-size:28px;cursor:pointer;color:#292524">&times;</button>
  <a onclick="scrollToSection('featured');toggleMobile()" style="font-family:'Playfair Display',serif;font-size:24px;cursor:pointer;color:#292524;text-decoration:none">Home</a>
  <a onclick="scrollToSection('article');toggleMobile()" style="font-family:'Playfair Display',serif;font-size:24px;cursor:pointer;color:#292524;text-decoration:none">Style</a>
  <a onclick="scrollToSection('recent');toggleMobile()" style="font-family:'Playfair Display',serif;font-size:24px;cursor:pointer;color:#292524;text-decoration:none">Wellness</a>
  <a onclick="scrollToSection('categories');toggleMobile()" style="font-family:'Playfair Display',serif;font-size:24px;cursor:pointer;color:#292524;text-decoration:none">Travel</a>
  <a onclick="scrollToSection('newsletter');toggleMobile()" style="font-family:'Playfair Display',serif;font-size:24px;cursor:pointer;color:#292524;text-decoration:none">About</a>
</div>

<!-- Header -->
<header style="position:fixed;top:0;left:0;right:0;z-index:100;backdrop-filter:blur(16px);background:rgba(254,250,246,0.92);border-bottom:1px solid rgba(214,211,209,0.4)">
  <div style="max-width:1120px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between">
    <div style="cursor:pointer" onclick="window.scrollTo({top:0,behavior:'smooth'})">
      <span style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;letter-spacing:0.25em;color:#292524">VELVET</span>
    </div>
    <nav class="nav-links" style="display:flex;align-items:center;gap:32px">
      <a onclick="scrollToSection('featured')" style="font-size:13px;font-weight:500;color:#78716c;cursor:pointer;text-decoration:none;letter-spacing:0.05em;transition:color 0.2s" onmouseover="this.style.color='#292524'" onmouseout="this.style.color='#78716c'">Home</a>
      <a onclick="scrollToSection('article')" style="font-size:13px;font-weight:500;color:#78716c;cursor:pointer;text-decoration:none;letter-spacing:0.05em;transition:color 0.2s" onmouseover="this.style.color='#292524'" onmouseout="this.style.color='#78716c'">Style</a>
      <a onclick="scrollToSection('recent')" style="font-size:13px;font-weight:500;color:#78716c;cursor:pointer;text-decoration:none;letter-spacing:0.05em;transition:color 0.2s" onmouseover="this.style.color='#292524'" onmouseout="this.style.color='#78716c'">Wellness</a>
      <a onclick="scrollToSection('categories')" style="font-size:13px;font-weight:500;color:#78716c;cursor:pointer;text-decoration:none;letter-spacing:0.05em;transition:color 0.2s" onmouseover="this.style.color='#292524'" onmouseout="this.style.color='#78716c'">Travel</a>
      <a onclick="scrollToSection('newsletter')" style="font-size:13px;font-weight:500;color:#78716c;cursor:pointer;text-decoration:none;letter-spacing:0.05em;transition:color 0.2s" onmouseover="this.style.color='#292524'" onmouseout="this.style.color='#78716c'">About</a>
    </nav>
    <button class="mobile-toggle" onclick="toggleMobile()" style="background:none;border:none;cursor:pointer;display:flex;flex-direction:column;gap:5px;padding:4px">
      <span style="width:22px;height:1.5px;background:#292524;display:block"></span>
      <span style="width:22px;height:1.5px;background:#292524;display:block"></span>
      <span style="width:16px;height:1.5px;background:#292524;display:block"></span>
    </button>
  </div>
</header>

<!-- Featured Article Hero -->
<section id="featured" style="padding:100px 24px 0">
  <div class="reveal" style="max-width:1120px;margin:0 auto">
    <div style="position:relative;border-radius:16px;overflow:hidden;cursor:pointer" onclick="showToast('Opening featured article...')">
      <!-- Full-width hero image placeholder with pink gradient -->
      <div style="width:100%;height:480px;background:linear-gradient(160deg,#fce7f3 0%,#f9d4e8 30%,#f0c6d8 60%,#e8b4c8 100%);display:flex;align-items:center;justify-content:center;position:relative">
        <div style="position:absolute;top:24px;left:24px">
          <span style="background:rgba(255,255,255,0.85);backdrop-filter:blur(4px);padding:6px 16px;border-radius:9999px;font-size:12px;font-weight:600;color:#b8860b;letter-spacing:0.05em">FEATURED</span>
        </div>
        <div style="text-align:center;padding:0 40px">
          <span style="font-size:72px;display:block;margin-bottom:16px;opacity:0.3">&#10022;</span>
        </div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:200px;background:linear-gradient(to top,rgba(254,250,246,0.95),transparent)"></div>
      </div>
      <!-- Article info overlay at bottom -->
      <div style="position:absolute;bottom:0;left:0;right:0;padding:40px 48px">
        <span style="font-family:'Nunito',sans-serif;font-size:12px;font-weight:600;color:#b8860b;letter-spacing:0.15em;text-transform:uppercase;display:block;margin-bottom:12px">Style &middot; Wellness</span>
        <h1 style="font-family:'Playfair Display',serif;font-size:clamp(2rem,4.5vw,3.2rem);font-weight:700;line-height:1.15;color:#292524;margin-bottom:16px;max-width:680px">The Art of Slow Living: A Guide to Intentional Days</h1>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#b8860b,#d4a843);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;font-family:'Playfair Display',serif">C</div>
          <div>
            <span style="font-size:14px;font-weight:600;color:#292524">Claire Beaumont</span>
            <span style="font-size:13px;color:#78716c"> &middot; Feb 18, 2026 &middot; 12 min read</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Magazine Layout: Article + Sidebar -->
<section id="article" style="padding:64px 24px">
  <div class="reveal magazine-grid" style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:3fr 2fr;gap:56px;align-items:start">

    <!-- Main Article Column (60%) -->
    <article>
      <p style="font-size:17px;line-height:1.95;color:#44403c;margin-bottom:24px">
        There is a quiet revolution happening in the way we approach our mornings. Gone are the days of jolting awake to alarms and rushing through routines. Instead, a growing number of people are discovering that the most transformative thing you can do is simply slow down.
      </p>
      <p style="font-size:17px;line-height:1.95;color:#44403c;margin-bottom:24px">
        The concept is deceptively simple: rather than optimizing every minute for productivity, you optimize for presence. You let the coffee brew while you stand at the window. You read a few pages of a book before checking your phone. You notice how the morning light falls across the table.
      </p>

      <!-- SIGNATURE: Pull Quote -->
      <div class="pull-quote">
        <p>The greatest luxury of our time is not a handbag or a holiday &mdash; it is an unhurried morning with nowhere to be and nothing to prove.</p>
        <cite>&mdash; Claire Beaumont</cite>
      </div>

      <h2 style="font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#292524;margin-bottom:16px;margin-top:8px">Reclaiming Your Morning Ritual</h2>
      <p style="font-size:17px;line-height:1.95;color:#44403c;margin-bottom:24px">
        Start with one small act of rebellion against the rush. Set your alarm fifteen minutes earlier &mdash; not to do more, but to do less. Sit with your tea. Write three lines in a journal. Step outside barefoot if the weather permits. These are not indulgences; they are investments in your nervous system.
      </p>
      <p style="font-size:17px;line-height:1.95;color:#44403c;margin-bottom:24px">
        The Scandinavians have a word for this: <em>hygge</em>. The Japanese call it <em>ikigai</em>. In Italy, it is simply how life is lived. The common thread is intentionality &mdash; choosing quality of experience over quantity of tasks.
      </p>

      <!-- Second Pull Quote -->
      <div class="pull-quote">
        <p>Slow living is not about doing nothing. It is about making space for the things that actually matter.</p>
        <cite>&mdash; From "The Year of Less" by Cait Flanders</cite>
      </div>

      <h2 style="font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#292524;margin-bottom:16px;margin-top:8px">Building a Capsule Routine</h2>
      <p style="font-size:17px;line-height:1.95;color:#44403c;margin-bottom:24px">
        Much like a capsule wardrobe strips away excess to reveal what truly serves you, a capsule routine focuses on the five or six habits that anchor your day. Morning movement, a nourishing meal, creative time, connection, rest, and reflection. Everything else is negotiable.
      </p>
      <p style="font-size:17px;line-height:1.95;color:#44403c;margin-bottom:24px">
        The beauty of this approach is its flexibility. Some days your creative time is thirty minutes of watercolor; other days it is three minutes of humming in the shower. The structure holds, but the form breathes.
      </p>

      <h2 style="font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#292524;margin-bottom:16px;margin-top:8px">The Home as a Sanctuary</h2>
      <p style="font-size:17px;line-height:1.95;color:#44403c;margin-bottom:24px">
        Your environment shapes your pace. A cluttered counter creates a cluttered mind. Consider each object in your space: does it earn its place? Fresh flowers, a single scented candle, a linen throw draped over the arm of a chair &mdash; these small gestures tell your nervous system that you are safe, you are home, you can exhale.
      </p>

      <!-- Article Tags -->
      <div style="margin-top:40px;padding-top:32px;border-top:1px solid #e7e5e4;display:flex;gap:8px;flex-wrap:wrap">
        <span class="pill pill-inactive" style="font-size:12px;padding:6px 14px">Slow Living</span>
        <span class="pill pill-inactive" style="font-size:12px;padding:6px 14px">Wellness</span>
        <span class="pill pill-inactive" style="font-size:12px;padding:6px 14px">Mindfulness</span>
        <span class="pill pill-inactive" style="font-size:12px;padding:6px 14px">Lifestyle</span>
      </div>
    </article>

    <!-- Sidebar Column (40%) -->
    <aside style="position:sticky;top:88px">
      <!-- Author Card -->
      <div style="background:#fff;border-radius:16px;padding:32px;margin-bottom:32px;border:1px solid #f5f0eb">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
          <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#b8860b,#d4a843);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:700;font-family:'Playfair Display',serif">C</div>
          <div>
            <div style="font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:#292524">Claire Beaumont</div>
            <div style="font-size:13px;color:#78716c;margin-top:2px">Editor-in-Chief</div>
          </div>
        </div>
        <p style="font-size:14px;line-height:1.8;color:#57534e;margin-bottom:20px">Writer, slow-living advocate, and the voice behind VELVET. Based between Kyoto and the south of France.</p>
        <button class="btn-dark" style="width:100%;font-size:13px;padding:10px 24px" onclick="showToast('Following Claire!')">Follow</button>
      </div>

      <!-- Trending Posts -->
      <div style="background:#fff;border-radius:16px;padding:32px;margin-bottom:32px;border:1px solid #f5f0eb">
        <h3 style="font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:#292524;margin-bottom:20px">Trending on VELVET</h3>
        <div style="display:flex;flex-direction:column;gap:20px" id="sidebar-trending"></div>
      </div>

      <!-- Newsletter Mini -->
      <div style="background:linear-gradient(160deg,#fce7f3,#fefaf6);border-radius:16px;padding:32px;border:1px solid #f5f0eb">
        <div style="font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:#292524;margin-bottom:8px">Stay Inspired</div>
        <p style="font-size:13px;color:#78716c;line-height:1.7;margin-bottom:20px">Weekly letters on living beautifully. No spam, just velvet.</p>
        <input class="newsletter-input" placeholder="Your email" style="margin-bottom:10px;font-size:13px;padding:11px 18px">
        <button class="btn-gold" style="width:100%;font-size:13px;padding:10px 24px" onclick="showToast('Subscribed! Welcome to the community.')">Subscribe</button>
      </div>
    </aside>
  </div>
</section>

<!-- Recent Posts Grid (Masonry-ish: 1 large + 3 small) -->
<section id="recent" style="padding:40px 24px 64px">
  <div style="max-width:1120px;margin:0 auto">
    <div class="reveal" style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:40px">
      <h2 style="font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:#292524">Recent Stories</h2>
      <span style="font-size:13px;color:#b8860b;font-weight:600;cursor:pointer" onclick="showToast('Viewing all stories...')">View All &rarr;</span>
    </div>
    <div class="reveal posts-grid" style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto auto;gap:24px" id="recent-grid"></div>
  </div>
</section>

<!-- Categories -->
<section id="categories" style="padding:40px 24px 64px">
  <div class="reveal" style="max-width:1120px;margin:0 auto;text-align:center">
    <h2 style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#292524;margin-bottom:32px">Explore by Topic</h2>
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center" id="category-pills"></div>
  </div>
</section>

<!-- Newsletter Section -->
<section id="newsletter" style="padding:40px 24px 80px">
  <div class="reveal" style="max-width:640px;margin:0 auto;text-align:center;background:#fff;border-radius:20px;padding:56px 48px;border:1px solid #f5f0eb;position:relative;overflow:hidden">
    <div style="position:absolute;top:-20px;left:-20px;font-family:'Playfair Display',serif;font-size:120px;color:#fce7f3;line-height:1;pointer-events:none;opacity:0.6">&ldquo;</div>
    <div style="position:relative;z-index:1">
      <h2 style="font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:#292524;margin-bottom:8px">Join the Community</h2>
      <p style="font-size:15px;color:#78716c;margin-bottom:32px;line-height:1.8;max-width:440px;margin-left:auto;margin-right:auto">A weekly letter filled with quiet inspiration, curated reads, and the occasional recipe. Already loved by 18,000+ readers.</p>
      <div style="display:flex;gap:12px;max-width:420px;margin:0 auto">
        <input class="newsletter-input" placeholder="Enter your email" style="flex:1" id="newsletterInput">
        <button class="btn-dark" onclick="handleSubscribe()">Subscribe</button>
      </div>
      <p style="font-size:11px;color:#a8a29e;margin-top:16px">Unsubscribe anytime. We respect your inbox.</p>
    </div>
  </div>
</section>

<!-- Footer -->
<footer style="padding:56px 24px 40px;border-top:1px solid #e7e5e4;background:#fefaf6">
  <div class="footer-grid" style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:2.5fr 1fr 1fr 1fr;gap:48px">
    <div>
      <span style="font-family:'Playfair Display',serif;font-size:24px;font-weight:700;letter-spacing:0.2em;color:#292524;display:block;margin-bottom:16px">VELVET</span>
      <p style="font-size:14px;color:#78716c;line-height:1.8;max-width:280px">A digital magazine for those who believe life is best lived slowly, beautifully, and on your own terms.</p>
      <div style="display:flex;gap:16px;margin-top:20px">
        <span style="width:36px;height:36px;border-radius:50%;background:#fce7f3;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;transition:background 0.3s" onmouseover="this.style.background='#b8860b';this.style.color='#fff'" onmouseout="this.style.background='#fce7f3';this.style.color='#292524'" onclick="showToast('Opening Instagram...')">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        </span>
        <span style="width:36px;height:36px;border-radius:50%;background:#fce7f3;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;transition:background 0.3s" onmouseover="this.style.background='#b8860b';this.style.color='#fff'" onmouseout="this.style.background='#fce7f3';this.style.color='#292524'" onclick="showToast('Opening Pinterest...')">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
        </span>
        <span style="width:36px;height:36px;border-radius:50%;background:#fce7f3;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;transition:background 0.3s" onmouseover="this.style.background='#b8860b';this.style.color='#fff'" onmouseout="this.style.background='#fce7f3';this.style.color='#292524'" onclick="showToast('Opening YouTube...')">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
        </span>
      </div>
    </div>
    <div>
      <div style="font-size:12px;font-weight:700;color:#292524;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:20px">Topics</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <a style="font-size:14px;color:#78716c;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b8860b'" onmouseout="this.style.color='#78716c'">Style</a>
        <a style="font-size:14px;color:#78716c;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b8860b'" onmouseout="this.style.color='#78716c'">Wellness</a>
        <a style="font-size:14px;color:#78716c;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b8860b'" onmouseout="this.style.color='#78716c'">Travel</a>
        <a style="font-size:14px;color:#78716c;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b8860b'" onmouseout="this.style.color='#78716c'">Food</a>
      </div>
    </div>
    <div>
      <div style="font-size:12px;font-weight:700;color:#292524;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:20px">Social</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <a style="font-size:14px;color:#78716c;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b8860b'" onmouseout="this.style.color='#78716c'" onclick="showToast('Opening Instagram...')">Instagram</a>
        <a style="font-size:14px;color:#78716c;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b8860b'" onmouseout="this.style.color='#78716c'" onclick="showToast('Opening Pinterest...')">Pinterest</a>
        <a style="font-size:14px;color:#78716c;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b8860b'" onmouseout="this.style.color='#78716c'" onclick="showToast('Opening YouTube...')">YouTube</a>
        <a style="font-size:14px;color:#78716c;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b8860b'" onmouseout="this.style.color='#78716c'" onclick="showToast('Opening Threads...')">Threads</a>
      </div>
    </div>
    <div>
      <div style="font-size:12px;font-weight:700;color:#292524;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:20px">About</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <a style="font-size:14px;color:#78716c;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b8860b'" onmouseout="this.style.color='#78716c'">Our Story</a>
        <a style="font-size:14px;color:#78716c;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b8860b'" onmouseout="this.style.color='#78716c'">Write for Us</a>
        <a style="font-size:14px;color:#78716c;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b8860b'" onmouseout="this.style.color='#78716c'">Privacy</a>
        <a style="font-size:14px;color:#78716c;text-decoration:none;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#b8860b'" onmouseout="this.style.color='#78716c'">Contact</a>
      </div>
    </div>
  </div>
  <div style="max-width:1120px;margin:40px auto 0;padding-top:24px;border-top:1px solid #e7e5e4;text-align:center">
    <p style="font-size:12px;color:#a8a29e;letter-spacing:0.05em">&copy; 2026 VELVET Magazine. All rights reserved.</p>
  </div>
</footer>

<script>
/* Data */
const categories=['Style','Wellness','Food','Travel','Home'];
let activeCategory='all';

const recentPosts=[
  {id:1,title:'Weekend in Amalfi: Sun-Bleached Walls and Lemon Groves',category:'Travel',author:'Sofia Marchetti',avatar:'S',date:'Feb 15',readTime:'9 min',gradient:'linear-gradient(135deg,#fce7f3,#fde68a)',emoji:'&#9728;'},
  {id:2,title:'The 5-Minute Skincare Routine That Changed Everything',category:'Wellness',author:'Elena Park',avatar:'E',date:'Feb 12',readTime:'5 min',gradient:'linear-gradient(135deg,#fce7f3,#e0f2fe)',emoji:'&#10024;'},
  {id:3,title:'Capsule Wardrobe for Spring: 20 Pieces, Endless Looks',category:'Style',author:'Claire Beaumont',avatar:'C',date:'Feb 10',readTime:'7 min',gradient:'linear-gradient(135deg,#f5f0eb,#fce7f3)',emoji:'&#128090;'},
  {id:4,title:'Sourdough Sundays: A Beginner\'s Guide to Baking Joy',category:'Food',author:'Maya Lin',avatar:'M',date:'Feb 8',readTime:'11 min',gradient:'linear-gradient(135deg,#fef3c7,#fce7f3)',emoji:'&#127838;'}
];

const trendingPosts=[
  {title:'Morning Pages: Why Journaling Before Dawn Works',category:'Wellness',readTime:'6 min'},
  {title:'The Linen Edit: Our Favorite Summer Fabrics',category:'Style',readTime:'4 min'},
  {title:'Hidden Cafes of Lisbon You Need to Visit',category:'Travel',readTime:'8 min'},
  {title:'Indoor Herb Garden: From Windowsill to Plate',category:'Home',readTime:'5 min'}
];

/* Render Recent Posts Grid (masonry-ish: first card spans 2 rows) */
function renderRecentPosts(){
  const grid=document.getElementById('recent-grid');
  const filtered=activeCategory==='all'?recentPosts:recentPosts.filter(p=>p.category.toLowerCase()===activeCategory.toLowerCase());
  if(filtered.length===0){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:48px;color:#78716c;font-size:15px">No stories in this category yet.</div>';
    return;
  }
  grid.innerHTML=filtered.map((p,i)=>{
    const isLarge=i===0;
    return `
      <div class="card ${isLarge?'large-card':''}" style="${isLarge?'grid-row:span 2;':''}cursor:pointer" onclick="showToast('Reading: ${p.title.replace(/'/g,"\\'")}')">
        <div style="width:100%;height:${isLarge?'100%':'180px'};min-height:${isLarge?'360px':'180px'};background:${p.gradient};display:flex;align-items:center;justify-content:center;font-size:${isLarge?'64px':'40px'};position:relative">
          <span>${p.emoji}</span>
          <span style="position:absolute;top:16px;left:16px;background:rgba(255,255,255,0.85);backdrop-filter:blur(4px);padding:4px 12px;border-radius:9999px;font-size:11px;font-weight:600;color:#b8860b">${p.category}</span>
        </div>
        <div style="padding:${isLarge?'28px':'20px'}">
          <h3 style="font-family:'Playfair Display',serif;font-size:${isLarge?'22px':'16px'};font-weight:700;line-height:1.35;color:#292524;margin-bottom:12px">${p.title}</h3>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:${isLarge?'28px':'24px'};height:${isLarge?'28px':'24px'};border-radius:50%;background:linear-gradient(135deg,#b8860b,#d4a843);display:flex;align-items:center;justify-content:center;color:#fff;font-size:${isLarge?'12px':'10px'};font-weight:700;font-family:'Playfair Display',serif">${p.avatar}</div>
            <span style="font-size:12px;color:#78716c">${p.author} &middot; ${p.date} &middot; ${p.readTime}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* Render Sidebar Trending */
function renderTrending(){
  document.getElementById('sidebar-trending').innerHTML=trendingPosts.map((p,i)=>`
    <div style="display:flex;gap:14px;align-items:flex-start;cursor:pointer;padding-bottom:${i<trendingPosts.length-1?'20px':'0'};border-bottom:${i<trendingPosts.length-1?'1px solid #f5f0eb':'none'}" onclick="showToast('Reading: ${p.title.replace(/'/g,"\\'")}')">
      <span style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#fce7f3;line-height:1">${String(i+1).padStart(2,'0')}</span>
      <div>
        <div style="font-size:14px;font-weight:600;line-height:1.4;color:#292524;margin-bottom:4px">${p.title}</div>
        <span style="font-size:12px;color:#b8860b;font-weight:500">${p.category}</span>
        <span style="font-size:12px;color:#a8a29e"> &middot; ${p.readTime}</span>
      </div>
    </div>
  `).join('');
}

/* Render Category Pills */
function renderCategories(){
  const pills=['All',...categories];
  document.getElementById('category-pills').innerHTML=pills.map(c=>{
    const val=c==='All'?'all':c.toLowerCase();
    const isActive=activeCategory===val;
    return `<span class="pill ${isActive?'pill-active':'pill-inactive'}" onclick="filterCategory('${val}')">${c}</span>`;
  }).join('');
}

/* Filter */
function filterCategory(cat){
  activeCategory=cat;
  renderCategories();
  renderRecentPosts();
  showToast(cat==='all'?'Showing all stories':'Filtered: '+cat.charAt(0).toUpperCase()+cat.slice(1));
}

/* Toast */
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}

/* Newsletter */
function handleSubscribe(){
  const input=document.getElementById('newsletterInput');
  if(input.value.includes('@')){
    showToast('Welcome to VELVET! Check your inbox.');
    input.value='';
  } else {
    showToast('Please enter a valid email address.');
  }
}

/* Mobile menu */
function toggleMobile(){
  document.getElementById('mobileMenu').classList.toggle('open');
}

/* Scroll to section */
function scrollToSection(id){
  const el=document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
}

/* Scroll reveal */
function initReveal(){
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  },{threshold:0.1});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
}

/* Init */
renderRecentPosts();
renderTrending();
renderCategories();
initReveal();
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
