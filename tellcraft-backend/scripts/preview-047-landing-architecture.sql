INSERT INTO template_previews (template_id, html_content, version)
VALUES ('aa8f39d8-122f-4677-841f-d791fa119d86', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>構築設計 ARCHIFORMA</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{arch:'#1a1a1a',stone:'#a8a29e',warm:'#f5f0eb',accent:'#c8a97e'},fontFamily:{display:['Playfair Display','serif'],body:['DM Sans','sans-serif']}}}}
</script>
<style>
body{font-family:'DM Sans',sans-serif}
html{scroll-behavior:smooth}
.reveal{opacity:0;transform:translateY(40px);transition:all 0.8s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.line-reveal{width:0;transition:width 1.2s cubic-bezier(0.4,0,0.2,1)}
.line-reveal.visible{width:100%}
.img-reveal{clip-path:inset(0 100% 0 0);transition:clip-path 1s cubic-bezier(0.4,0,0.2,1)}
.img-reveal.visible{clip-path:inset(0 0 0 0)}
.hover-lift{transition:transform 0.5s cubic-bezier(0.4,0,0.2,1)}
.hover-lift:hover{transform:translateY(-8px)}
.project-card:hover .project-overlay{opacity:1}
.project-overlay{opacity:0;transition:opacity 0.5s}
</style>
</head>
<body class="bg-warm text-arch overflow-x-hidden">

<!-- Nav -->
<nav class="fixed top-0 w-full bg-warm/95 backdrop-blur-sm z-50">
  <div class="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
    <div>
      <div class="text-xl font-bold tracking-[0.2em] uppercase">Archiforma</div>
      <div class="text-[10px] tracking-[0.3em] text-stone uppercase">Architecture Studio</div>
    </div>
    <div class="hidden md:flex items-center gap-10 text-sm tracking-wider">
      <a href="#work" class="text-stone hover:text-arch transition-colors cursor-pointer">作品</a>
      <a href="#about" class="text-stone hover:text-arch transition-colors cursor-pointer">理念</a>
      <a href="#services" class="text-stone hover:text-arch transition-colors cursor-pointer">服務</a>
      <a href="#awards" class="text-stone hover:text-arch transition-colors cursor-pointer">獎項</a>
      <a href="#contact" class="text-arch border-b border-arch pb-0.5 cursor-pointer">聯繫</a>
    </div>
  </div>
  <div class="h-px bg-stone/20"></div>
</nav>

<!-- Hero -->
<section class="min-h-screen flex items-center pt-20">
  <div class="max-w-7xl mx-auto px-8 w-full">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div>
        <div class="text-stone text-sm tracking-[0.3em] uppercase mb-6 reveal">Est. 2008 — Taipei</div>
        <h1 class="font-display text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.1] mb-8 reveal">
          空間，<br>
          是生活的<br>
          <span class="italic text-accent">藝術</span>
        </h1>
        <div class="h-px bg-arch/20 my-8 line-reveal"></div>
        <p class="text-stone text-lg leading-relaxed max-w-md mb-10 reveal">
          我們相信建築不只是結構與材料，而是光線、空氣與人之間的對話。每一個案子，都是一次重新定義空間與生活關係的機會。
        </p>
        <div class="flex items-center gap-8 reveal">
          <a href="#work" class="bg-arch text-warm px-8 py-4 text-sm tracking-wider hover:bg-arch/80 transition-colors cursor-pointer">探索作品</a>
          <a href="#contact" class="text-sm tracking-wider border-b border-arch pb-0.5 hover:text-accent hover:border-accent transition-colors cursor-pointer">預約諮詢 →</a>
        </div>
      </div>
      <div class="relative reveal">
        <div class="bg-gradient-to-br from-stone/20 to-stone/5 aspect-[3/4] rounded-sm overflow-hidden img-reveal">
          <div class="w-full h-full bg-gradient-to-br from-stone/30 via-arch/10 to-warm flex items-center justify-center">
            <div class="text-center">
              <div class="w-32 h-32 border border-stone/30 mx-auto mb-4 flex items-center justify-center">
                <div class="w-20 h-20 border border-stone/40 flex items-center justify-center">
                  <div class="w-8 h-8 bg-accent/60"></div>
                </div>
              </div>
              <p class="text-stone/60 text-xs tracking-[0.3em] uppercase">Featured Project</p>
            </div>
          </div>
        </div>
        <div class="absolute -bottom-6 -left-6 bg-white p-6 shadow-lg">
          <div class="text-3xl font-display font-bold">25+</div>
          <div class="text-xs text-stone tracking-wider">國際設計獎項</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Projects -->
<section id="work" class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-8">
    <div class="flex items-end justify-between mb-16 reveal">
      <div>
        <div class="text-stone text-sm tracking-[0.3em] uppercase mb-3">Selected Works</div>
        <h2 class="font-display text-4xl md:text-5xl">精選作品</h2>
      </div>
      <div class="hidden md:flex gap-4">
        <button class="px-4 py-2 text-sm border border-arch bg-arch text-warm cursor-pointer" onclick="filterProjects('all')">全部</button>
        <button class="px-4 py-2 text-sm border border-stone/30 text-stone hover:border-arch hover:text-arch transition-colors cursor-pointer" onclick="filterProjects('residential')">住宅</button>
        <button class="px-4 py-2 text-sm border border-stone/30 text-stone hover:border-arch hover:text-arch transition-colors cursor-pointer" onclick="filterProjects('commercial')">商業</button>
        <button class="px-4 py-2 text-sm border border-stone/30 text-stone hover:border-arch hover:text-arch transition-colors cursor-pointer" onclick="filterProjects('public')">公共</button>
      </div>
    </div>
    <div class="grid md:grid-cols-2 gap-8" id="projectGrid">
      <div class="project-card group cursor-pointer reveal hover-lift" data-cat="residential">
        <div class="relative aspect-[4/3] bg-gradient-to-br from-stone/20 to-stone/5 overflow-hidden mb-6">
          <div class="w-full h-full flex items-center justify-center">
            <div class="w-40 h-28 border border-stone/20 flex items-end">
              <div class="w-1/3 h-full bg-stone/10 border-r border-stone/20"></div>
              <div class="w-1/3 h-3/4 bg-stone/15 border-r border-stone/20"></div>
              <div class="w-1/3 h-1/2 bg-stone/10"></div>
            </div>
          </div>
          <div class="project-overlay absolute inset-0 bg-arch/80 flex items-center justify-center">
            <span class="text-warm text-sm tracking-[0.3em] uppercase">查看詳情</span>
          </div>
        </div>
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-display text-xl mb-1">雲居 Cloud Residence</h3>
            <p class="text-stone text-sm">台北・私人住宅・2024</p>
          </div>
          <span class="text-accent text-sm">→</span>
        </div>
      </div>
      <div class="project-card group cursor-pointer reveal hover-lift" data-cat="commercial" style="transition-delay:0.1s">
        <div class="relative aspect-[4/3] bg-gradient-to-br from-accent/10 to-warm overflow-hidden mb-6">
          <div class="w-full h-full flex items-center justify-center">
            <div class="space-y-2">
              <div class="w-48 h-6 bg-stone/10"></div>
              <div class="w-48 h-16 bg-stone/15 flex items-center justify-center"><div class="w-8 h-8 border border-stone/30"></div></div>
              <div class="w-48 h-6 bg-stone/10"></div>
            </div>
          </div>
          <div class="project-overlay absolute inset-0 bg-arch/80 flex items-center justify-center">
            <span class="text-warm text-sm tracking-[0.3em] uppercase">查看詳情</span>
          </div>
        </div>
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-display text-xl mb-1">方圓 Gallery CUBE</h3>
            <p class="text-stone text-sm">台中・藝廊空間・2023</p>
          </div>
          <span class="text-accent text-sm">→</span>
        </div>
      </div>
      <div class="project-card group cursor-pointer reveal hover-lift" data-cat="public" style="transition-delay:0.2s">
        <div class="relative aspect-[4/3] bg-gradient-to-br from-stone/15 to-stone/5 overflow-hidden mb-6">
          <div class="w-full h-full flex items-center justify-center">
            <div class="relative">
              <div class="w-40 h-20 border-t-2 border-l-2 border-r-2 border-stone/30 rounded-t-full"></div>
              <div class="w-40 h-12 border border-stone/20 flex">
                <div class="w-1/4 h-full border-r border-stone/15"></div>
                <div class="w-1/4 h-full border-r border-stone/15"></div>
                <div class="w-1/4 h-full border-r border-stone/15"></div>
                <div class="w-1/4 h-full"></div>
              </div>
            </div>
          </div>
          <div class="project-overlay absolute inset-0 bg-arch/80 flex items-center justify-center">
            <span class="text-warm text-sm tracking-[0.3em] uppercase">查看詳情</span>
          </div>
        </div>
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-display text-xl mb-1">澄波圖書館</h3>
            <p class="text-stone text-sm">嘉義・公共建築・2023</p>
          </div>
          <span class="text-accent text-sm">→</span>
        </div>
      </div>
      <div class="project-card group cursor-pointer reveal hover-lift" data-cat="residential" style="transition-delay:0.3s">
        <div class="relative aspect-[4/3] bg-gradient-to-br from-accent/5 to-stone/10 overflow-hidden mb-6">
          <div class="w-full h-full flex items-center justify-center">
            <div class="grid grid-cols-3 gap-1">
              <div class="w-12 h-16 bg-stone/15"></div>
              <div class="w-12 h-20 bg-stone/10"></div>
              <div class="w-12 h-14 bg-stone/20"></div>
              <div class="w-12 h-10 bg-accent/15"></div>
              <div class="w-12 h-12 bg-stone/10"></div>
              <div class="w-12 h-16 bg-stone/15"></div>
            </div>
          </div>
          <div class="project-overlay absolute inset-0 bg-arch/80 flex items-center justify-center">
            <span class="text-warm text-sm tracking-[0.3em] uppercase">查看詳情</span>
          </div>
        </div>
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-display text-xl mb-1">層疊 Strata House</h3>
            <p class="text-stone text-sm">新竹・獨棟別墅・2024</p>
          </div>
          <span class="text-accent text-sm">→</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- About / Philosophy -->
<section id="about" class="py-24 bg-arch text-warm">
  <div class="max-w-7xl mx-auto px-8">
    <div class="grid lg:grid-cols-2 gap-20 items-center">
      <div class="reveal">
        <div class="text-accent text-sm tracking-[0.3em] uppercase mb-4">Philosophy</div>
        <h2 class="font-display text-4xl md:text-5xl mb-8 leading-tight">
          我們不造房子，<br>我們<span class="italic text-accent">雕琢光影</span>
        </h2>
        <div class="h-px bg-warm/20 my-8"></div>
        <p class="text-stone leading-relaxed mb-6">
          構築設計成立於 2008 年，由建築師林承翰主持。我們深信建築是一門關於「如何居住」的藝術。每一道牆、每一扇窗，都經過對光線、風向、動線的反覆推敲。
        </p>
        <p class="text-stone leading-relaxed mb-10">
          從住宅到公共空間，我們追求的不是炫目的造型，而是與環境和諧共生、讓使用者在不知不覺中感到舒適的空間品質。
        </p>
        <div class="grid grid-cols-3 gap-8">
          <div>
            <div class="text-3xl font-display text-accent mb-1">16</div>
            <div class="text-xs text-stone tracking-wider">年設計經驗</div>
          </div>
          <div>
            <div class="text-3xl font-display text-accent mb-1">80+</div>
            <div class="text-xs text-stone tracking-wider">完成專案</div>
          </div>
          <div>
            <div class="text-3xl font-display text-accent mb-1">25</div>
            <div class="text-xs text-stone tracking-wider">國際獎項</div>
          </div>
        </div>
      </div>
      <div class="reveal">
        <div class="bg-warm/5 aspect-square flex items-center justify-center border border-warm/10">
          <div class="text-center">
            <div class="w-24 h-24 rounded-full border border-accent/40 mx-auto mb-6 flex items-center justify-center">
              <div class="text-3xl">👤</div>
            </div>
            <div class="font-display text-2xl mb-1">林承翰</div>
            <div class="text-accent text-sm tracking-wider">主持建築師</div>
            <div class="text-stone text-xs mt-2">AA School London / 成大建築</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-24 bg-warm">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-20 reveal">
      <div class="text-stone text-sm tracking-[0.3em] uppercase mb-3">Services</div>
      <h2 class="font-display text-4xl md:text-5xl">服務項目</h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-stone/20">
      <div class="bg-warm p-8 reveal hover-lift cursor-pointer group">
        <div class="text-3xl mb-6 group-hover:text-accent transition-colors">01</div>
        <h3 class="font-display text-xl mb-3">建築設計</h3>
        <p class="text-stone text-sm leading-relaxed">從概念到落成，完整的建築設計服務。住宅、商業、公共空間。</p>
        <div class="h-px bg-accent w-0 group-hover:w-12 transition-all mt-6"></div>
      </div>
      <div class="bg-warm p-8 reveal hover-lift cursor-pointer group" style="transition-delay:0.1s">
        <div class="text-3xl mb-6 group-hover:text-accent transition-colors">02</div>
        <h3 class="font-display text-xl mb-3">室內設計</h3>
        <p class="text-stone text-sm leading-relaxed">空間規劃、材質選配、家具設計，打造量身訂製的生活場域。</p>
        <div class="h-px bg-accent w-0 group-hover:w-12 transition-all mt-6"></div>
      </div>
      <div class="bg-warm p-8 reveal hover-lift cursor-pointer group" style="transition-delay:0.2s">
        <div class="text-3xl mb-6 group-hover:text-accent transition-colors">03</div>
        <h3 class="font-display text-xl mb-3">都市規劃</h3>
        <p class="text-stone text-sm leading-relaxed">社區營造、街區再生、公共空間設計，創造人與城市的對話。</p>
        <div class="h-px bg-accent w-0 group-hover:w-12 transition-all mt-6"></div>
      </div>
      <div class="bg-warm p-8 reveal hover-lift cursor-pointer group" style="transition-delay:0.3s">
        <div class="text-3xl mb-6 group-hover:text-accent transition-colors">04</div>
        <h3 class="font-display text-xl mb-3">顧問諮詢</h3>
        <p class="text-stone text-sm leading-relaxed">空間評估、可行性研究、設計審查，提供專業的建築諮詢服務。</p>
        <div class="h-px bg-accent w-0 group-hover:w-12 transition-all mt-6"></div>
      </div>
    </div>
  </div>
</section>

<!-- Awards -->
<section id="awards" class="py-24 bg-white">
  <div class="max-w-5xl mx-auto px-8">
    <div class="text-center mb-16 reveal">
      <div class="text-stone text-sm tracking-[0.3em] uppercase mb-3">Awards & Recognition</div>
      <h2 class="font-display text-4xl md:text-5xl">榮譽獎項</h2>
    </div>
    <div class="space-y-0 reveal">
      <div class="flex items-center justify-between py-6 border-b border-stone/15 hover:bg-warm/50 transition-colors px-4 -mx-4 cursor-pointer group">
        <div class="flex items-center gap-6">
          <span class="text-accent font-display text-lg">2024</span>
          <span class="font-medium">A' Design Award — Gold</span>
        </div>
        <span class="text-stone text-sm group-hover:text-accent transition-colors">雲居 Cloud Residence →</span>
      </div>
      <div class="flex items-center justify-between py-6 border-b border-stone/15 hover:bg-warm/50 transition-colors px-4 -mx-4 cursor-pointer group">
        <div class="flex items-center gap-6">
          <span class="text-accent font-display text-lg">2024</span>
          <span class="font-medium">台灣建築獎 — 佳作</span>
        </div>
        <span class="text-stone text-sm group-hover:text-accent transition-colors">澄波圖書館 →</span>
      </div>
      <div class="flex items-center justify-between py-6 border-b border-stone/15 hover:bg-warm/50 transition-colors px-4 -mx-4 cursor-pointer group">
        <div class="flex items-center gap-6">
          <span class="text-accent font-display text-lg">2023</span>
          <span class="font-medium">iF Design Award</span>
        </div>
        <span class="text-stone text-sm group-hover:text-accent transition-colors">方圓 Gallery CUBE →</span>
      </div>
      <div class="flex items-center justify-between py-6 border-b border-stone/15 hover:bg-warm/50 transition-colors px-4 -mx-4 cursor-pointer group">
        <div class="flex items-center gap-6">
          <span class="text-accent font-display text-lg">2023</span>
          <span class="font-medium">ArchDaily Building of the Year — 入圍</span>
        </div>
        <span class="text-stone text-sm group-hover:text-accent transition-colors">澄波圖書館 →</span>
      </div>
      <div class="flex items-center justify-between py-6 border-b border-stone/15 hover:bg-warm/50 transition-colors px-4 -mx-4 cursor-pointer group">
        <div class="flex items-center gap-6">
          <span class="text-accent font-display text-lg">2022</span>
          <span class="font-medium">Red Dot Design Award</span>
        </div>
        <span class="text-stone text-sm group-hover:text-accent transition-colors">織光宅 Loom House →</span>
      </div>
      <div class="flex items-center justify-between py-6 hover:bg-warm/50 transition-colors px-4 -mx-4 cursor-pointer group">
        <div class="flex items-center gap-6">
          <span class="text-accent font-display text-lg">2022</span>
          <span class="font-medium">World Architecture Festival — Shortlist</span>
        </div>
        <span class="text-stone text-sm group-hover:text-accent transition-colors">山語聚落 →</span>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-24 bg-arch text-warm">
  <div class="max-w-7xl mx-auto px-8">
    <div class="grid lg:grid-cols-2 gap-20">
      <div class="reveal">
        <div class="text-accent text-sm tracking-[0.3em] uppercase mb-4">Get in Touch</div>
        <h2 class="font-display text-4xl md:text-5xl mb-8">開始您的<br><span class="italic text-accent">建築之旅</span></h2>
        <div class="space-y-6 text-stone">
          <div>
            <div class="text-warm text-xs tracking-[0.2em] uppercase mb-1">地址</div>
            <p>台北市大安區仁愛路四段 88 號 12 樓</p>
          </div>
          <div>
            <div class="text-warm text-xs tracking-[0.2em] uppercase mb-1">電話</div>
            <p>(02) 2771-0088</p>
          </div>
          <div>
            <div class="text-warm text-xs tracking-[0.2em] uppercase mb-1">Email</div>
            <p>studio@archiforma.tw</p>
          </div>
          <div>
            <div class="text-warm text-xs tracking-[0.2em] uppercase mb-1">營業時間</div>
            <p>週一至週五 09:00 - 18:00</p>
          </div>
        </div>
      </div>
      <div class="reveal">
        <div class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs tracking-[0.2em] uppercase text-stone mb-2 block">姓名</label>
              <input type="text" class="w-full bg-transparent border-b border-warm/20 py-3 text-warm focus:border-accent focus:outline-none transition-colors">
            </div>
            <div>
              <label class="text-xs tracking-[0.2em] uppercase text-stone mb-2 block">電話</label>
              <input type="tel" class="w-full bg-transparent border-b border-warm/20 py-3 text-warm focus:border-accent focus:outline-none transition-colors">
            </div>
          </div>
          <div>
            <label class="text-xs tracking-[0.2em] uppercase text-stone mb-2 block">Email</label>
            <input type="email" class="w-full bg-transparent border-b border-warm/20 py-3 text-warm focus:border-accent focus:outline-none transition-colors">
          </div>
          <div>
            <label class="text-xs tracking-[0.2em] uppercase text-stone mb-2 block">專案類型</label>
            <select class="w-full bg-transparent border-b border-warm/20 py-3 text-stone focus:border-accent focus:outline-none transition-colors cursor-pointer">
              <option class="bg-arch">請選擇</option>
              <option class="bg-arch">住宅設計</option>
              <option class="bg-arch">商業空間</option>
              <option class="bg-arch">公共建築</option>
              <option class="bg-arch">室內設計</option>
              <option class="bg-arch">諮詢服務</option>
            </select>
          </div>
          <div>
            <label class="text-xs tracking-[0.2em] uppercase text-stone mb-2 block">專案描述</label>
            <textarea rows="4" class="w-full bg-transparent border-b border-warm/20 py-3 text-warm focus:border-accent focus:outline-none transition-colors resize-none"></textarea>
          </div>
          <button onclick="showToast('感謝您的來信，我們將在 48 小時內回覆。')" class="border border-warm text-warm px-10 py-4 text-sm tracking-wider hover:bg-warm hover:text-arch transition-all cursor-pointer mt-4">
            送出諮詢
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-arch border-t border-warm/10 py-8">
  <div class="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
    <div class="text-stone text-xs tracking-[0.2em]">© 2026 ARCHIFORMA. All rights reserved.</div>
    <div class="flex gap-6 text-stone text-xs tracking-wider">
      <span class="hover:text-accent transition-colors cursor-pointer">Instagram</span>
      <span class="hover:text-accent transition-colors cursor-pointer">Behance</span>
      <span class="hover:text-accent transition-colors cursor-pointer">ArchDaily</span>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 bg-warm text-arch px-6 py-3.5 shadow-2xl z-50 translate-y-20 opacity-0 transition-all duration-500 text-sm tracking-wider"></div>

<script>
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3000)}

function filterProjects(cat){
  document.querySelectorAll('.project-card').forEach(c=>{
    if(cat==='all'||c.dataset.cat===cat){c.style.display=''}
    else{c.style.display='none'}
  });
  document.querySelectorAll('#work button').forEach(b=>{
    b.classList.remove('bg-arch','text-warm');
    b.classList.add('border-stone/30','text-stone');
  });
  event.target.classList.add('bg-arch','text-warm');
  event.target.classList.remove('border-stone/30','text-stone');
}

const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}})
},{threshold:0.1});
document.querySelectorAll('.reveal,.line-reveal,.img-reveal').forEach(el=>obs.observe(el));

document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'})});
});
</script>
</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
