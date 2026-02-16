INSERT INTO template_previews (template_id, html_content, version)
VALUES ('7c788e4d-c777-4371-a0f7-5339a5c2fc9a', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>光域 LUMINAL — 當代藝術展覽</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{gallery:'#fafaf9',ink:'#1c1917',stone:'#a8a29e',accent:'#dc2626',warm:'#f5f0eb'},fontFamily:{display:['Cormorant Garamond','serif'],body:['Space Grotesk','sans-serif']}}}}
</script>
<style>
body{font-family:'Space Grotesk',sans-serif}
html{scroll-behavior:smooth}
.reveal{opacity:0;transform:translateY(40px);transition:all 0.8s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.artwork:hover .artwork-overlay{opacity:1}
.artwork-overlay{opacity:0;transition:opacity 0.5s}
.marquee{animation:marquee 20s linear infinite}
@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
</style>
</head>
<body class="bg-gallery text-ink overflow-x-hidden">

<!-- Nav -->
<nav class="fixed top-0 w-full bg-gallery/95 backdrop-blur-sm z-50">
  <div class="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
    <div>
      <div class="font-display text-xl font-semibold tracking-wider italic">LUMINAL</div>
      <div class="text-[9px] tracking-[0.4em] text-stone uppercase">Contemporary Art</div>
    </div>
    <div class="hidden md:flex items-center gap-8 text-sm tracking-wider text-stone">
      <a href="#exhibition" class="hover:text-ink transition-colors cursor-pointer">展覽</a>
      <a href="#artists" class="hover:text-ink transition-colors cursor-pointer">藝術家</a>
      <a href="#events" class="hover:text-ink transition-colors cursor-pointer">活動</a>
      <a href="#visit" class="hover:text-ink transition-colors cursor-pointer">參觀資訊</a>
    </div>
    <button onclick="document.getElementById('ticketModal').classList.remove('hidden')" class="border border-ink text-ink px-5 py-2 text-sm tracking-wider hover:bg-ink hover:text-gallery transition-all cursor-pointer">
      購票入場
    </button>
  </div>
  <div class="h-px bg-stone/20"></div>
</nav>

<!-- Marquee -->
<div class="bg-accent text-white py-2 overflow-hidden mt-[72px]">
  <div class="marquee whitespace-nowrap text-xs tracking-wider">
    <span class="mx-8">光域 LUMINAL — 2026.03.01 至 2026.06.30</span>
    <span class="mx-8">台北當代藝術館</span>
    <span class="mx-8">8 位國際藝術家</span>
    <span class="mx-8">沉浸式光影體驗</span>
    <span class="mx-8">光域 LUMINAL — 2026.03.01 至 2026.06.30</span>
    <span class="mx-8">台北當代藝術館</span>
    <span class="mx-8">8 位國際藝術家</span>
    <span class="mx-8">沉浸式光影體驗</span>
  </div>
</div>

<!-- Hero -->
<section class="py-24 md:py-32">
  <div class="max-w-5xl mx-auto px-8 text-center">
    <div class="reveal">
      <div class="text-stone text-xs tracking-[0.5em] uppercase mb-6">2026.03.01 — 06.30 · 台北當代藝術館</div>
      <h1 class="font-display text-6xl md:text-8xl lg:text-9xl font-medium italic leading-[0.95] mb-8">
        光<span class="text-accent">域</span>
      </h1>
      <div class="w-20 h-px bg-ink mx-auto mb-8"></div>
      <p class="text-stone text-lg max-w-xl mx-auto leading-relaxed mb-10">
        當光成為媒材，空間成為畫布。八位來自世界各地的藝術家，以光、影、聲音與科技，重新定義我們對「看見」的想像。
      </p>
      <div class="flex items-center justify-center gap-6">
        <button onclick="document.getElementById('ticketModal').classList.remove('hidden')" class="bg-ink text-gallery px-10 py-4 text-sm tracking-wider hover:bg-accent transition-colors cursor-pointer">
          立即購票
        </button>
        <a href="#exhibition" class="text-sm tracking-wider border-b border-ink pb-0.5 hover:text-accent hover:border-accent transition-colors cursor-pointer">
          探索展覽 →
        </a>
      </div>
    </div>
    <!-- Abstract art -->
    <div class="mt-20 grid grid-cols-5 gap-3 max-w-3xl mx-auto reveal">
      <div class="aspect-[2/3] bg-gradient-to-b from-accent/5 to-accent/20 rounded-sm"></div>
      <div class="aspect-[2/3] bg-gradient-to-b from-stone/10 to-stone/30 rounded-sm mt-8"></div>
      <div class="aspect-[2/3] bg-gradient-to-b from-ink/5 to-ink/15 rounded-sm"></div>
      <div class="aspect-[2/3] bg-gradient-to-b from-amber-100/50 to-amber-200/30 rounded-sm mt-12"></div>
      <div class="aspect-[2/3] bg-gradient-to-b from-accent/10 to-accent/30 rounded-sm mt-4"></div>
    </div>
  </div>
</section>

<!-- Exhibition -->
<section id="exhibition" class="py-24 bg-ink text-gallery">
  <div class="max-w-6xl mx-auto px-8">
    <div class="text-center mb-20 reveal">
      <div class="text-accent text-xs tracking-[0.4em] uppercase mb-3">Exhibition</div>
      <h2 class="font-display text-4xl md:text-5xl italic">展區導覽</h2>
      <p class="text-stone mt-4 max-w-md mx-auto text-sm">四個主題展區，從微觀到宏觀，從內在到宇宙</p>
    </div>
    <div class="grid md:grid-cols-2 gap-8">
      <div class="border border-white/10 p-8 reveal group hover:border-accent/30 transition-colors cursor-pointer">
        <div class="text-accent font-display text-3xl mb-4">01</div>
        <h3 class="font-display text-2xl italic mb-3">折射 · Refraction</h3>
        <p class="text-stone text-sm leading-relaxed mb-4">光穿越稜鏡，分裂為無限色彩。三件裝置作品探索光的物理特性與情感隱喻。</p>
        <div class="flex gap-2">
          <span class="text-[10px] tracking-wider text-stone border border-white/10 px-2 py-0.5">裝置藝術</span>
          <span class="text-[10px] tracking-wider text-stone border border-white/10 px-2 py-0.5">互動</span>
        </div>
      </div>
      <div class="border border-white/10 p-8 reveal group hover:border-accent/30 transition-colors cursor-pointer" style="transition-delay:0.1s">
        <div class="text-accent font-display text-3xl mb-4">02</div>
        <h3 class="font-display text-2xl italic mb-3">暗室 · Darkroom</h3>
        <p class="text-stone text-sm leading-relaxed mb-4">在完全的黑暗中，重新發現光的存在。聲音與微光引導你走過一段感官之旅。</p>
        <div class="flex gap-2">
          <span class="text-[10px] tracking-wider text-stone border border-white/10 px-2 py-0.5">沉浸式</span>
          <span class="text-[10px] tracking-wider text-stone border border-white/10 px-2 py-0.5">聲音藝術</span>
        </div>
      </div>
      <div class="border border-white/10 p-8 reveal group hover:border-accent/30 transition-colors cursor-pointer" style="transition-delay:0.2s">
        <div class="text-accent font-display text-3xl mb-4">03</div>
        <h3 class="font-display text-2xl italic mb-3">映像 · Projection</h3>
        <p class="text-stone text-sm leading-relaxed mb-4">巨幅投影將建築化為流動的光之畫布。AI 演算法即時生成永不重複的視覺詩篇。</p>
        <div class="flex gap-2">
          <span class="text-[10px] tracking-wider text-stone border border-white/10 px-2 py-0.5">新媒體</span>
          <span class="text-[10px] tracking-wider text-stone border border-white/10 px-2 py-0.5">AI 生成</span>
        </div>
      </div>
      <div class="border border-white/10 p-8 reveal group hover:border-accent/30 transition-colors cursor-pointer" style="transition-delay:0.3s">
        <div class="text-accent font-display text-3xl mb-4">04</div>
        <h3 class="font-display text-2xl italic mb-3">餘暉 · Afterglow</h3>
        <p class="text-stone text-sm leading-relaxed mb-4">當光離開之後，留下了什麼？磷光材料與記憶的對話，探索存在與消逝。</p>
        <div class="flex gap-2">
          <span class="text-[10px] tracking-wider text-stone border border-white/10 px-2 py-0.5">雕塑</span>
          <span class="text-[10px] tracking-wider text-stone border border-white/10 px-2 py-0.5">磷光</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Artists -->
<section id="artists" class="py-24 bg-gallery">
  <div class="max-w-6xl mx-auto px-8">
    <div class="text-center mb-16 reveal">
      <div class="text-accent text-xs tracking-[0.4em] uppercase mb-3">Artists</div>
      <h2 class="font-display text-4xl md:text-5xl italic">參展藝術家</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div class="text-center reveal cursor-pointer group">
        <div class="aspect-square bg-gradient-to-br from-stone/20 to-stone/5 rounded-sm mb-4 flex items-center justify-center overflow-hidden">
          <div class="w-16 h-16 bg-accent/10 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>
        <h3 class="font-display text-lg italic">Olafur Eliasson</h3>
        <p class="text-stone text-xs">冰島/丹麥</p>
      </div>
      <div class="text-center reveal cursor-pointer group" style="transition-delay:0.05s">
        <div class="aspect-square bg-gradient-to-br from-amber-100/50 to-amber-50/30 rounded-sm mb-4 flex items-center justify-center overflow-hidden">
          <div class="w-16 h-16 bg-amber-200/30 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>
        <h3 class="font-display text-lg italic">James Turrell</h3>
        <p class="text-stone text-xs">美國</p>
      </div>
      <div class="text-center reveal cursor-pointer group" style="transition-delay:0.1s">
        <div class="aspect-square bg-gradient-to-br from-blue-100/50 to-blue-50/30 rounded-sm mb-4 flex items-center justify-center overflow-hidden">
          <div class="w-16 h-16 bg-blue-200/30 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>
        <h3 class="font-display text-lg italic">teamLab</h3>
        <p class="text-stone text-xs">日本</p>
      </div>
      <div class="text-center reveal cursor-pointer group" style="transition-delay:0.15s">
        <div class="aspect-square bg-gradient-to-br from-pink-100/50 to-pink-50/30 rounded-sm mb-4 flex items-center justify-center overflow-hidden">
          <div class="w-16 h-16 bg-pink-200/30 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>
        <h3 class="font-display text-lg italic">陳萬仁</h3>
        <p class="text-stone text-xs">台灣</p>
      </div>
      <div class="text-center reveal cursor-pointer group" style="transition-delay:0.2s">
        <div class="aspect-square bg-gradient-to-br from-purple-100/50 to-purple-50/30 rounded-sm mb-4 flex items-center justify-center overflow-hidden">
          <div class="w-16 h-16 bg-purple-200/30 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>
        <h3 class="font-display text-lg italic">Ryoji Ikeda</h3>
        <p class="text-stone text-xs">日本</p>
      </div>
      <div class="text-center reveal cursor-pointer group" style="transition-delay:0.25s">
        <div class="aspect-square bg-gradient-to-br from-emerald-100/50 to-emerald-50/30 rounded-sm mb-4 flex items-center justify-center overflow-hidden">
          <div class="w-16 h-16 bg-emerald-200/30 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>
        <h3 class="font-display text-lg italic">Ann Veronica Janssens</h3>
        <p class="text-stone text-xs">比利時</p>
      </div>
      <div class="text-center reveal cursor-pointer group" style="transition-delay:0.3s">
        <div class="aspect-square bg-gradient-to-br from-red-100/50 to-red-50/30 rounded-sm mb-4 flex items-center justify-center overflow-hidden">
          <div class="w-16 h-16 bg-red-200/30 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>
        <h3 class="font-display text-lg italic">林明弘</h3>
        <p class="text-stone text-xs">台灣</p>
      </div>
      <div class="text-center reveal cursor-pointer group" style="transition-delay:0.35s">
        <div class="aspect-square bg-gradient-to-br from-cyan-100/50 to-cyan-50/30 rounded-sm mb-4 flex items-center justify-center overflow-hidden">
          <div class="w-16 h-16 bg-cyan-200/30 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>
        <h3 class="font-display text-lg italic">Refik Anadol</h3>
        <p class="text-stone text-xs">土耳其/美國</p>
      </div>
    </div>
  </div>
</section>

<!-- Events -->
<section id="events" class="py-24 bg-warm">
  <div class="max-w-5xl mx-auto px-8">
    <div class="text-center mb-16 reveal">
      <div class="text-accent text-xs tracking-[0.4em] uppercase mb-3">Events</div>
      <h2 class="font-display text-4xl md:text-5xl italic">週邊活動</h2>
    </div>
    <div class="space-y-6 reveal">
      <div class="flex items-center gap-6 p-6 bg-white rounded-sm hover:shadow-lg transition-all cursor-pointer group">
        <div class="flex-shrink-0 text-center">
          <div class="text-accent font-display text-3xl font-bold">03</div>
          <div class="text-stone text-xs">MAR</div>
        </div>
        <div class="flex-1">
          <h3 class="font-display text-lg italic group-hover:text-accent transition-colors">開幕之夜 · Opening Night</h3>
          <p class="text-stone text-sm">藝術家親臨導覽 + DJ Live Set + 香檳酒會</p>
        </div>
        <div class="text-right">
          <div class="text-xs text-stone">18:00 - 22:00</div>
          <div class="text-xs text-accent font-bold mt-1">邀請制</div>
        </div>
      </div>
      <div class="flex items-center gap-6 p-6 bg-white rounded-sm hover:shadow-lg transition-all cursor-pointer group">
        <div class="flex-shrink-0 text-center">
          <div class="text-accent font-display text-3xl font-bold">15</div>
          <div class="text-stone text-xs">MAR</div>
        </div>
        <div class="flex-1">
          <h3 class="font-display text-lg italic group-hover:text-accent transition-colors">光與科技工作坊</h3>
          <p class="text-stone text-sm">與 Refik Anadol 團隊共同探索 AI 藝術創作</p>
        </div>
        <div class="text-right">
          <div class="text-xs text-stone">14:00 - 17:00</div>
          <div class="text-xs text-accent font-bold mt-1">NT$800</div>
        </div>
      </div>
      <div class="flex items-center gap-6 p-6 bg-white rounded-sm hover:shadow-lg transition-all cursor-pointer group">
        <div class="flex-shrink-0 text-center">
          <div class="text-accent font-display text-3xl font-bold">29</div>
          <div class="text-stone text-xs">MAR</div>
        </div>
        <div class="flex-1">
          <h3 class="font-display text-lg italic group-hover:text-accent transition-colors">策展人對談 · Curator Talk</h3>
          <p class="text-stone text-sm">「光的政治學：當代藝術中的光影敘事」</p>
        </div>
        <div class="text-right">
          <div class="text-xs text-stone">19:00 - 21:00</div>
          <div class="text-xs text-ink font-bold mt-1">免費</div>
        </div>
      </div>
      <div class="flex items-center gap-6 p-6 bg-white rounded-sm hover:shadow-lg transition-all cursor-pointer group">
        <div class="flex-shrink-0 text-center">
          <div class="text-accent font-display text-3xl font-bold">每週六</div>
        </div>
        <div class="flex-1">
          <h3 class="font-display text-lg italic group-hover:text-accent transition-colors">夜間特別場 · After Dark</h3>
          <p class="text-stone text-sm">全館熄燈，僅靠作品發光引導參觀。限 50 人。</p>
        </div>
        <div class="text-right">
          <div class="text-xs text-stone">20:00 - 22:00</div>
          <div class="text-xs text-accent font-bold mt-1">NT$600</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Visit Info -->
<section id="visit" class="py-24 bg-ink text-gallery">
  <div class="max-w-6xl mx-auto px-8">
    <div class="grid lg:grid-cols-2 gap-16">
      <div class="reveal">
        <div class="text-accent text-xs tracking-[0.4em] uppercase mb-4">Visit</div>
        <h2 class="font-display text-4xl md:text-5xl italic mb-8">參觀資訊</h2>
        <div class="space-y-6">
          <div class="flex gap-4">
            <div class="w-10 text-right text-accent text-sm font-bold flex-shrink-0">📍</div>
            <div><div class="font-medium mb-0.5">地點</div><p class="text-stone text-sm">台北市大同區長安西路 39 號（台北當代藝術館）</p></div>
          </div>
          <div class="flex gap-4">
            <div class="w-10 text-right text-accent text-sm font-bold flex-shrink-0">📅</div>
            <div><div class="font-medium mb-0.5">展期</div><p class="text-stone text-sm">2026.03.01（六）— 2026.06.30（二）</p></div>
          </div>
          <div class="flex gap-4">
            <div class="w-10 text-right text-accent text-sm font-bold flex-shrink-0">⏰</div>
            <div><div class="font-medium mb-0.5">開放時間</div><p class="text-stone text-sm">週二至週日 10:00 - 18:00（週一休館）<br>夜間特別場：每週六 20:00 - 22:00</p></div>
          </div>
          <div class="flex gap-4">
            <div class="w-10 text-right text-accent text-sm font-bold flex-shrink-0">🚇</div>
            <div><div class="font-medium mb-0.5">交通</div><p class="text-stone text-sm">捷運中山站 R9 出口步行 3 分鐘</p></div>
          </div>
        </div>
      </div>
      <div class="reveal">
        <h3 class="font-display text-2xl italic mb-6">票價</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-5 border border-white/10 rounded-sm hover:border-accent/30 transition-colors cursor-pointer" onclick="document.getElementById('ticketModal').classList.remove('hidden')">
            <div>
              <div class="font-medium">全票</div>
              <div class="text-stone text-xs">一般觀眾</div>
            </div>
            <div class="text-accent font-display text-2xl font-bold">NT$350</div>
          </div>
          <div class="flex items-center justify-between p-5 border border-white/10 rounded-sm hover:border-accent/30 transition-colors cursor-pointer" onclick="document.getElementById('ticketModal').classList.remove('hidden')">
            <div>
              <div class="font-medium">優待票</div>
              <div class="text-stone text-xs">學生 / 65歲以上 / 身心障礙</div>
            </div>
            <div class="text-accent font-display text-2xl font-bold">NT$200</div>
          </div>
          <div class="flex items-center justify-between p-5 border border-white/10 rounded-sm hover:border-accent/30 transition-colors cursor-pointer" onclick="document.getElementById('ticketModal').classList.remove('hidden')">
            <div>
              <div class="font-medium">夜間特別場</div>
              <div class="text-stone text-xs">每週六 20:00 · 限 50 人</div>
            </div>
            <div class="text-accent font-display text-2xl font-bold">NT$600</div>
          </div>
          <div class="flex items-center justify-between p-5 border border-white/10 rounded-sm">
            <div>
              <div class="font-medium">免費</div>
              <div class="text-stone text-xs">6歲以下兒童 / 北美館之友</div>
            </div>
            <div class="text-stone font-display text-2xl">FREE</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-ink border-t border-white/5 py-8">
  <div class="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
    <div class="font-display text-gallery italic tracking-wider">LUMINAL</div>
    <div class="text-stone/40 text-xs">© 2026 台北當代藝術館 × 光域策展團隊</div>
    <div class="flex gap-4 text-stone/50 text-xs tracking-wider">
      <span class="hover:text-accent transition-colors cursor-pointer">Instagram</span>
      <span class="hover:text-accent transition-colors cursor-pointer">Facebook</span>
    </div>
  </div>
</footer>

<!-- Ticket Modal -->
<div id="ticketModal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="bg-gallery rounded-sm p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
    <div class="flex items-center justify-between mb-6">
      <h3 class="font-display text-2xl italic">購票</h3>
      <button onclick="document.getElementById('ticketModal').classList.add('hidden')" class="w-8 h-8 bg-stone/10 flex items-center justify-center text-stone hover:bg-stone/20 cursor-pointer rounded-sm">✕</button>
    </div>
    <div class="space-y-4">
      <div>
        <label class="text-xs text-stone mb-1 block tracking-wider">參觀日期</label>
        <input type="date" class="w-full border border-stone/20 px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-accent">
      </div>
      <div>
        <label class="text-xs text-stone mb-1 block tracking-wider">票種</label>
        <select class="w-full border border-stone/20 px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-accent cursor-pointer">
          <option>全票 NT$350</option>
          <option>優待票 NT$200</option>
          <option>夜間特別場 NT$600（週六限定）</option>
        </select>
      </div>
      <div>
        <label class="text-xs text-stone mb-1 block tracking-wider">數量</label>
        <select class="w-full border border-stone/20 px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-accent cursor-pointer">
          <option>1 張</option><option>2 張</option><option>3 張</option><option>4 張</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <input type="text" placeholder="姓名" class="border border-stone/20 px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-accent">
        <input type="email" placeholder="Email" class="border border-stone/20 px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-accent">
      </div>
      <button onclick="document.getElementById('ticketModal').classList.add('hidden');showToast('購票成功！電子票券已寄至您的 Email。')" class="w-full bg-ink text-gallery py-4 text-sm tracking-wider hover:bg-accent transition-colors cursor-pointer">
        確認購票
      </button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 bg-ink text-gallery px-6 py-3.5 shadow-2xl z-[60] translate-y-20 opacity-0 transition-all duration-500 text-sm tracking-wider rounded-sm"></div>

<script>
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3000)}
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}})},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'})})});
</script>
</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
