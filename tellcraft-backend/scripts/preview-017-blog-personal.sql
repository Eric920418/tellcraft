INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '902f15d8-0eaf-43d1-881c-3cb757d92efd',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Journal — A Personal Blog</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        cream: '#fef9ef',
        ink: '#1e3a5f',
        rose: '#fda4af',
        tan: '#d4a574',
        'tan-light': '#e8c9a0',
        'cream-dark': '#f5eddf',
        muted: '#7a8a9a'
      },
      fontFamily: {
        hand: ['Caveat', 'cursive'],
        serif: ['Lora', 'Georgia', 'serif']
      }
    }
  }
}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Lora', Georgia, serif;
    background: #fef9ef;
    color: #1e3a5f;
    min-height: 100vh;
    background-image: linear-gradient(180deg, #fef9ef 0%, #fdf6e8 50%, #fef9ef 100%);
  }

  /* Page fold corner on post cards */
  .post-card {
    position: relative;
    background: #fff;
    border: 1px solid #e8c9a0;
    border-radius: 2px;
    transition: box-shadow 0.3s ease, transform 0.3s ease;
  }
  .post-card:hover {
    box-shadow: 0 8px 24px rgba(30, 58, 95, 0.08);
    transform: translateY(-2px);
  }
  .post-card::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 0 28px 28px;
    border-color: transparent transparent #d4a574 transparent;
    transition: border-width 0.3s ease;
  }
  .post-card:hover::after {
    border-width: 0 0 34px 34px;
  }
  /* Fold shadow illusion */
  .post-card::before {
    content: '';
    position: absolute;
    bottom: 0;
    right: 28px;
    width: 12px;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(30, 58, 95, 0.06));
    z-index: 1;
    transition: right 0.3s ease;
  }
  .post-card:hover::before {
    right: 34px;
  }

  /* Handwriting underline */
  .hand-underline {
    background-image: linear-gradient(to right, #fda4af 0%, #fda4af 100%);
    background-size: 100% 2px;
    background-position: 0 100%;
    background-repeat: no-repeat;
  }

  /* Scroll reveal */
  .reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #fef9ef; }
  ::-webkit-scrollbar-thumb { background: #d4a574; border-radius: 3px; }

  /* Horizontal rule with dot */
  .journal-divider {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #d4a574;
  }
  .journal-divider::before,
  .journal-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e8c9a0;
  }

  /* Article detail prose */
  .prose-journal p { margin-bottom: 1.5rem; line-height: 1.9; font-size: 1.05rem; }
  .prose-journal h2 { font-family: 'Caveat', cursive; font-size: 1.75rem; margin: 2rem 0 1rem; color: #1e3a5f; }
  .prose-journal blockquote {
    border-left: 3px solid #fda4af;
    padding-left: 1.25rem;
    margin: 1.5rem 0;
    color: #7a8a9a;
    font-style: italic;
  }
  .prose-journal ul { margin: 1.25rem 0; padding-left: 1.5rem; }
  .prose-journal li { margin-bottom: 0.5rem; line-height: 1.8; }

  /* Page transitions */
  .page { display: none; }
  .page.active { display: block; }

  /* Toast */
  #toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(8px);
    background: #1e3a5f; color: #fef9ef; padding: 12px 24px; border-radius: 8px;
    font-family: 'Lora', serif; font-size: 14px; opacity: 0; pointer-events: none;
    transition: all 0.3s ease; z-index: 100; max-width: 320px; text-align: center;
  }

  /* Ink spot decorations */
  .ink-spot {
    width: 4px; height: 4px; border-radius: 50%; background: #d4a574; display: inline-block;
  }

  /* Subscribe input */
  .subscribe-input {
    background: transparent;
    border: none;
    border-bottom: 1px dashed #d4a574;
    padding: 8px 4px;
    font-family: 'Lora', serif;
    font-size: 14px;
    color: #1e3a5f;
    outline: none;
    width: 220px;
  }
  .subscribe-input::placeholder { color: #d4a574; opacity: 0.7; }
  .subscribe-input:focus { border-bottom-color: #1e3a5f; }
</style>
</head>
<body>

<!-- Toast -->
<div id="toast"></div>

<!-- ===== MAIN PAGE ===== -->
<div id="page-main" class="page active">

  <!-- Header -->
  <header class="sticky top-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-tan-light/50">
    <div class="max-w-xl mx-auto px-6 h-14 flex items-center justify-between">
      <a onclick="showPage('main')" class="cursor-pointer font-hand text-2xl font-semibold text-ink tracking-wide">My Journal</a>
      <nav class="flex items-center gap-6">
        <a onclick="showPage('about')" class="cursor-pointer font-serif text-sm text-muted hover:text-ink transition-colors">about</a>
        <a onclick="showPage('archive')" class="cursor-pointer font-serif text-sm text-muted hover:text-ink transition-colors">archive</a>
      </nav>
    </div>
  </header>

  <!-- Hero: Greeting -->
  <section class="max-w-xl mx-auto px-6 pt-16 pb-12 reveal">
    <p class="font-hand text-3xl md:text-4xl text-ink leading-snug mb-4">
      Welcome to my corner<br>of the internet.
    </p>
    <p class="font-serif text-muted text-base leading-relaxed max-w-md">
      I write about quiet mornings, unfinished books, and the small things that make ordinary days feel a little more meaningful. Pull up a chair and stay awhile.
    </p>
    <div class="flex items-center gap-2 mt-6">
      <span class="ink-spot"></span>
      <span class="ink-spot"></span>
      <span class="ink-spot"></span>
    </div>
  </section>

  <!-- Divider -->
  <div class="max-w-xl mx-auto px-6">
    <div class="journal-divider">
      <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="#d4a574"/></svg>
    </div>
  </div>

  <!-- Blog Posts -->
  <section class="max-w-xl mx-auto px-6 pt-10 pb-20">

    <!-- Post 1 -->
    <article class="post-card p-6 mb-8 cursor-pointer reveal" onclick="showArticle(0)">
      <div class="mb-3">
        <span class="font-hand text-xl text-tan">January 15, 2024</span>
      </div>
      <h2 class="font-serif text-xl font-semibold text-ink leading-snug mb-3">
        Reflections on a Quiet Morning
      </h2>
      <p class="font-serif text-muted text-sm leading-relaxed mb-4">
        There is something about the hour before the world wakes up. The light is different, softer somehow, as if the sun itself is still half-asleep. I made my coffee in the dark today and sat by the window, watching the neighborhood slowly come alive...
      </p>
      <span class="font-hand text-base text-rose hover:text-ink transition-colors">read more →</span>
    </article>

    <!-- Post 2 -->
    <article class="post-card p-6 mb-8 cursor-pointer reveal" onclick="showArticle(1)">
      <div class="mb-3">
        <span class="font-hand text-xl text-tan">January 8, 2024</span>
      </div>
      <h2 class="font-serif text-xl font-semibold text-ink leading-snug mb-3">
        The Art of Doing Nothing
      </h2>
      <p class="font-serif text-muted text-sm leading-relaxed mb-4">
        We have forgotten how to be bored. Every idle moment is filled with a screen, a scroll, a notification. But boredom used to be the birthplace of our best ideas. Last Sunday, I turned off my phone and spent the entire afternoon on the porch...
      </p>
      <span class="font-hand text-base text-rose hover:text-ink transition-colors">read more →</span>
    </article>

    <!-- Post 3 -->
    <article class="post-card p-6 mb-8 cursor-pointer reveal" onclick="showArticle(2)">
      <div class="mb-3">
        <span class="font-hand text-xl text-tan">December 29, 2023</span>
      </div>
      <h2 class="font-serif text-xl font-semibold text-ink leading-snug mb-3">
        Year in Review: Lessons Learned
      </h2>
      <p class="font-serif text-muted text-sm leading-relaxed mb-4">
        Another year come and gone. I used to dread these end-of-year reflections, but this time feels different. Maybe it is because I finally stopped measuring my years in achievements and started measuring them in moments of genuine peace...
      </p>
      <span class="font-hand text-base text-rose hover:text-ink transition-colors">read more →</span>
    </article>

  </section>

  <!-- Footer -->
  <footer class="border-t border-tan-light/50 bg-cream">
    <div class="max-w-xl mx-auto px-6 py-12">
      <div class="text-center mb-8">
        <p class="font-hand text-2xl text-ink mb-1">Written with love</p>
        <div class="flex items-center justify-center gap-2 mt-2">
          <span class="ink-spot"></span>
          <span class="ink-spot"></span>
          <span class="ink-spot"></span>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
        <a onclick="handleAction('RSS Feed')" class="cursor-pointer font-serif text-sm text-muted hover:text-ink transition-colors">rss</a>
        <span class="hidden sm:inline text-tan-light">|</span>
        <div class="flex items-center gap-2">
          <input type="email" placeholder="your@email.com" class="subscribe-input" id="emailInput">
          <button onclick="handleAction('Subscribe')" class="font-hand text-base text-ink hover:text-rose transition-colors cursor-pointer">subscribe</button>
        </div>
      </div>
      <p class="text-center font-serif text-xs text-muted/60">&copy; 2024 My Journal. A quiet place on the internet.</p>
    </div>
  </footer>

</div>

<!-- ===== ARTICLE DETAIL PAGE ===== -->
<div id="page-article" class="page">
  <header class="sticky top-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-tan-light/50">
    <div class="max-w-xl mx-auto px-6 h-14 flex items-center justify-between">
      <a onclick="showPage('main')" class="cursor-pointer font-hand text-2xl font-semibold text-ink tracking-wide">My Journal</a>
      <nav class="flex items-center gap-6">
        <a onclick="showPage('about')" class="cursor-pointer font-serif text-sm text-muted hover:text-ink transition-colors">about</a>
        <a onclick="showPage('archive')" class="cursor-pointer font-serif text-sm text-muted hover:text-ink transition-colors">archive</a>
      </nav>
    </div>
  </header>

  <article class="max-w-xl mx-auto px-6 pt-12 pb-20">
    <a onclick="showPage('main')" class="cursor-pointer font-serif text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-2 mb-10">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
      back to journal
    </a>
    <div id="articleDate" class="mb-3"></div>
    <h1 id="articleTitle" class="font-serif text-2xl md:text-3xl font-semibold text-ink leading-snug mb-6"></h1>
    <div class="journal-divider mb-8">
      <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="#d4a574"/></svg>
    </div>
    <div id="articleBody" class="prose-journal font-serif text-ink"></div>
    <div class="journal-divider mt-12 mb-6">
      <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="#d4a574"/></svg>
    </div>
    <div class="text-center">
      <p class="font-hand text-lg text-tan mb-2">Thanks for reading.</p>
      <a onclick="showPage('main')" class="cursor-pointer font-serif text-sm text-rose hover:text-ink transition-colors">← more entries</a>
    </div>
  </article>
</div>

<!-- ===== ABOUT PAGE ===== -->
<div id="page-about" class="page">
  <header class="sticky top-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-tan-light/50">
    <div class="max-w-xl mx-auto px-6 h-14 flex items-center justify-between">
      <a onclick="showPage('main')" class="cursor-pointer font-hand text-2xl font-semibold text-ink tracking-wide">My Journal</a>
      <nav class="flex items-center gap-6">
        <a onclick="showPage('about')" class="cursor-pointer font-serif text-sm text-ink transition-colors">about</a>
        <a onclick="showPage('archive')" class="cursor-pointer font-serif text-sm text-muted hover:text-ink transition-colors">archive</a>
      </nav>
    </div>
  </header>

  <div class="max-w-xl mx-auto px-6 pt-12 pb-20">
    <a onclick="showPage('main')" class="cursor-pointer font-serif text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-2 mb-10">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
      back to journal
    </a>

    <div class="reveal">
      <p class="font-hand text-3xl text-ink mb-6">A little about me.</p>
      <div class="post-card p-6 mb-8">
        <div class="flex items-start gap-5">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-rose/30 to-tan/30 flex items-center justify-center flex-shrink-0 border border-tan-light">
            <span class="font-hand text-2xl text-ink">me</span>
          </div>
          <div class="font-serif text-sm text-muted leading-relaxed">
            <p class="mb-3">Hello. I am a writer, a reader, and an occasional collector of interesting coffee mugs. I started this journal because I wanted a quiet space to think out loud, somewhere between a diary and a letter to a friend.</p>
            <p class="mb-3">I believe in long walks, handwritten notes, and the kind of conversations that last until the restaurant closes. Most of what I write here comes from those moments, the ones too small for social media but too important to forget.</p>
            <p>When I am not writing, you will probably find me in a used bookstore, on a park bench, or making my third cup of tea.</p>
          </div>
        </div>
      </div>

      <div class="text-center">
        <p class="font-hand text-lg text-tan mb-1">Say hello</p>
        <a onclick="handleAction('Send email')" class="cursor-pointer font-serif text-sm text-rose hover:text-ink transition-colors">hello@myjournal.com</a>
      </div>
    </div>
  </div>
</div>

<!-- ===== ARCHIVE PAGE ===== -->
<div id="page-archive" class="page">
  <header class="sticky top-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-tan-light/50">
    <div class="max-w-xl mx-auto px-6 h-14 flex items-center justify-between">
      <a onclick="showPage('main')" class="cursor-pointer font-hand text-2xl font-semibold text-ink tracking-wide">My Journal</a>
      <nav class="flex items-center gap-6">
        <a onclick="showPage('about')" class="cursor-pointer font-serif text-sm text-muted hover:text-ink transition-colors">about</a>
        <a onclick="showPage('archive')" class="cursor-pointer font-serif text-sm text-ink transition-colors">archive</a>
      </nav>
    </div>
  </header>

  <div class="max-w-xl mx-auto px-6 pt-12 pb-20">
    <a onclick="showPage('main')" class="cursor-pointer font-serif text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-2 mb-10">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
      back to journal
    </a>

    <p class="font-hand text-3xl text-ink mb-8 reveal">All entries.</p>

    <!-- 2024 -->
    <div class="mb-10 reveal">
      <p class="font-hand text-xl text-tan mb-4">2024</p>
      <div class="space-y-3 pl-4 border-l border-tan-light">
        <div onclick="showArticle(0)" class="cursor-pointer flex items-baseline gap-4 group">
          <span class="font-hand text-base text-tan w-20 flex-shrink-0">Jan 15</span>
          <span class="font-serif text-sm text-ink group-hover:text-rose transition-colors">Reflections on a Quiet Morning</span>
        </div>
        <div onclick="showArticle(1)" class="cursor-pointer flex items-baseline gap-4 group">
          <span class="font-hand text-base text-tan w-20 flex-shrink-0">Jan 8</span>
          <span class="font-serif text-sm text-ink group-hover:text-rose transition-colors">The Art of Doing Nothing</span>
        </div>
      </div>
    </div>

    <!-- 2023 -->
    <div class="mb-10 reveal">
      <p class="font-hand text-xl text-tan mb-4">2023</p>
      <div class="space-y-3 pl-4 border-l border-tan-light">
        <div onclick="showArticle(2)" class="cursor-pointer flex items-baseline gap-4 group">
          <span class="font-hand text-base text-tan w-20 flex-shrink-0">Dec 29</span>
          <span class="font-serif text-sm text-ink group-hover:text-rose transition-colors">Year in Review: Lessons Learned</span>
        </div>
        <div class="cursor-pointer flex items-baseline gap-4 group">
          <span class="font-hand text-base text-tan w-20 flex-shrink-0">Nov 14</span>
          <span class="font-serif text-sm text-ink group-hover:text-rose transition-colors">Letters I Never Sent</span>
        </div>
        <div class="cursor-pointer flex items-baseline gap-4 group">
          <span class="font-hand text-base text-tan w-20 flex-shrink-0">Oct 3</span>
          <span class="font-serif text-sm text-ink group-hover:text-rose transition-colors">On Collecting Bookmarks</span>
        </div>
        <div class="cursor-pointer flex items-baseline gap-4 group">
          <span class="font-hand text-base text-tan w-20 flex-shrink-0">Sep 17</span>
          <span class="font-serif text-sm text-ink group-hover:text-rose transition-colors">The Neighborhood Cat</span>
        </div>
        <div class="cursor-pointer flex items-baseline gap-4 group">
          <span class="font-hand text-base text-tan w-20 flex-shrink-0">Aug 5</span>
          <span class="font-serif text-sm text-ink group-hover:text-rose transition-colors">Rainy Days and Rearranged Shelves</span>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
// Articles data
const articles = [
  {
    date: 'January 15, 2024',
    title: 'Reflections on a Quiet Morning',
    body: `
      <p>There is something about the hour before the world wakes up. The light is different, softer somehow, as if the sun itself is still half-asleep. I made my coffee in the dark today and sat by the window, watching the neighborhood slowly come alive.</p>

      <h2>The First Light</h2>

      <p>The streetlamp outside my window flickered off at exactly 6:47. I have been keeping track. There is a strange comfort in knowing that certain things happen at the same time every day, without anyone deciding they should.</p>

      <blockquote>I think we underestimate the power of a slow morning. Not a productive morning, not a mindful morning. Just a slow one, where the only agenda is to notice things.</blockquote>

      <p>A woman walked past with her dog, a small terrier with more energy than sense. The dog stopped to investigate every leaf, every crack in the sidewalk, as if each one contained the answer to some great mystery. Maybe they do. Maybe we just walk too fast to notice.</p>

      <h2>What I Am Learning</h2>

      <p>I have been trying to spend the first hour of every day without my phone. It started as an experiment and has quietly become the most important part of my routine. Not because it is productive, but because it is the only hour that feels entirely mine.</p>

      <ul>
        <li>Coffee tastes better when you are not also reading the news</li>
        <li>The world does not end if you reply to messages an hour late</li>
        <li>Boredom, it turns out, is just another word for paying attention</li>
      </ul>

      <p>Tomorrow I will probably wake up and do the same thing. Make coffee, sit by the window, watch the streetlamp turn off. And that is enough.</p>
    `
  },
  {
    date: 'January 8, 2024',
    title: 'The Art of Doing Nothing',
    body: `
      <p>We have forgotten how to be bored. Every idle moment is filled with a screen, a scroll, a notification. But boredom used to be the birthplace of our best ideas. Last Sunday, I turned off my phone and spent the entire afternoon on the porch, doing absolutely nothing.</p>

      <h2>A Sunday Experiment</h2>

      <p>The first twenty minutes were unbearable. My hand kept reaching for my pocket. My mind raced through all the things I should be doing, could be doing, would normally be doing. Then, around minute thirty, something shifted.</p>

      <blockquote>Doing nothing is not the absence of activity. It is the presence of awareness. You start to hear the wind. You notice the way shadows move across the floor. You remember things you had forgotten.</blockquote>

      <p>I watched a spider build a web in the corner of the porch railing. It took about forty minutes. I could not tell you the last time I spent forty uninterrupted minutes watching anything. It was, without exaggeration, one of the most fascinating things I have witnessed all year.</p>

      <h2>What the Dutch Know</h2>

      <p>The Dutch have a word for this: niksen. It means to do nothing, to be idle, to be purposeless. They consider it a valid and healthy activity, not a sign of laziness. I think they are on to something.</p>

      <p>I am not going to turn this into a self-improvement project. That would defeat the purpose. But I would like to do nothing more often. And I think that sentence makes perfect sense.</p>
    `
  },
  {
    date: 'December 29, 2023',
    title: 'Year in Review: Lessons Learned',
    body: `
      <p>Another year come and gone. I used to dread these end-of-year reflections, but this time feels different. Maybe it is because I finally stopped measuring my years in achievements and started measuring them in moments of genuine peace.</p>

      <h2>Things I Learned This Year</h2>

      <ul>
        <li>Saying no is a complete sentence</li>
        <li>Most worries never actually happen, and the ones that do are never as bad as imagined</li>
        <li>A good book reread is better than a mediocre book read for the first time</li>
        <li>Friendships need tending, like gardens. Neglect them and they go quiet</li>
        <li>It is okay to outgrow things that once fit perfectly</li>
      </ul>

      <h2>The Unplanned Moments</h2>

      <p>The best parts of this year were not on any calendar. A spontaneous road trip in October. A four-hour conversation with a stranger at a bookstore. An afternoon spent rearranging my bookshelves while it rained outside. None of these were planned. All of them mattered.</p>

      <blockquote>The older I get, the more I realize that the things I will remember are never the things I thought I would remember. Memory has its own priorities, and they rarely align with our ambitions.</blockquote>

      <p>Here is to another year of paying attention. Of writing things down. Of being surprised by ordinary days.</p>
    `
  }
];

// Page navigation
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      target.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    }, 150);
  }
}

// Show article detail
function showArticle(index) {
  const article = articles[index];
  if (!article) return;

  document.getElementById('articleDate').innerHTML =
    '<span class="font-hand text-xl text-tan">' + article.date + '</span>';
  document.getElementById('articleTitle').textContent = article.title;
  document.getElementById('articleBody').innerHTML = article.body;

  showPage('article');
}

// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(8px)';
  }, 2500);
}

function handleAction(action) {
  showToast(action + ' — this is a template preview');
}

// Intersection Observer for scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Initial reveal for visible elements
setTimeout(() => {
  document.querySelectorAll('#page-main .reveal').forEach(el => el.classList.add('visible'));
}, 100);
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
