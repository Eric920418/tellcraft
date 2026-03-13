INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'f4e8830a-7dba-4af5-9124-7daf8947c268',
  $GALA_V2$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>璀璨之夜 GalaLight - 2026 年度慈善晚宴</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        dark: { 900:'#0a0a1a', 800:'#0f0f24', 700:'#16162e', 600:'#1e1e3a' },
        gold: { 200:'#f5e6b8', 300:'#e8d48b', 400:'#d4a853', 500:'#c49a3c', 600:'#a67c28', 700:'#8a6420' },
        cream: { 100:'#faf6ee', 200:'#f0e8d6' }
      }
    }
  }
}
</script>
<style>
body { font-family: 'DM Sans', sans-serif; background: #0a0a1a; color: #e2dcd0; }
.serif { font-family: 'Playfair Display', serif; }
.gold-glow { text-shadow: 0 0 40px rgba(212,168,83,0.3); }
.card-hover { transition: all 0.4s cubic-bezier(0.25,0.46,0.45,0.94); }
.card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(212,168,83,0.08); }
.shimmer-bg { background: linear-gradient(120deg, transparent 30%, rgba(212,168,83,0.06) 50%, transparent 70%); background-size: 200% 100%; animation: shimmer 4s ease-in-out infinite; }
@keyframes shimmer { 0%,100% { background-position: 200% 0; } 50% { background-position: -200% 0; } }
@keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
@keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
.float { animation: float 6s ease-in-out infinite; }
.fade-in { animation: fadeInUp 0.8s ease-out forwards; }
.divider-gold { height:1px; background: linear-gradient(90deg, transparent, #d4a853, transparent); }
.faq-content { max-height:0; overflow:hidden; transition: max-height 0.4s ease, padding 0.4s ease; }
.faq-content.open { max-height:200px; }
.faq-icon { transition: transform 0.3s ease; }
.faq-icon.open { transform: rotate(45deg); }
.modal-overlay { opacity:0; pointer-events:none; transition: opacity 0.3s ease; }
.modal-overlay.active { opacity:1; pointer-events:auto; }
.modal-box { transform: scale(0.9) translateY(20px); transition: transform 0.3s ease; }
.modal-overlay.active .modal-box { transform: scale(1) translateY(0); }
@keyframes checkmark { 0% { transform:scale(0) rotate(-45deg); opacity:0; } 50% { transform:scale(1.2) rotate(-45deg); } 100% { transform:scale(1) rotate(0deg); opacity:1; } }
.success-check { animation: checkmark 0.6s ease forwards; }
.ticket-tier { transition: all 0.3s ease; cursor:pointer; }
.ticket-tier:hover { transform: translateY(-4px); border-color: rgba(212,168,83,0.5); }
.ticket-tier.selected { border-color: #d4a853; background: rgba(212,168,83,0.08); }
.timeline-dot { width:14px; height:14px; border-radius:50%; border:2px solid #d4a853; background:#0a0a1a; position:relative; z-index:2; }
.timeline-dot::after { content:''; position:absolute; inset:3px; border-radius:50%; background:#d4a853; }
</style>
</head>
<body>

<!-- Sticky Nav -->
<nav id="mainNav" class="fixed top-0 w-full z-50 bg-dark-900/80 backdrop-blur-md border-b border-gold-400/10">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-sm font-bold text-dark-900">G</div>
      <span class="serif text-lg font-bold text-gold-300 tracking-wide">GalaLight</span>
    </div>
    <div class="hidden md:flex items-center gap-8 text-sm text-gray-400">
      <a onclick="scrollToSection('highlights')" class="hover:text-gold-400 transition cursor-pointer">活動亮點</a>
      <a onclick="scrollToSection('program')" class="hover:text-gold-400 transition cursor-pointer">活動流程</a>
      <a onclick="scrollToSection('performers')" class="hover:text-gold-400 transition cursor-pointer">表演嘉賓</a>
      <a onclick="scrollToSection('tickets')" class="hover:text-gold-400 transition cursor-pointer">購票資訊</a>
      <a onclick="scrollToSection('faq')" class="hover:text-gold-400 transition cursor-pointer">常見問題</a>
      <button onclick="openTicketModal()" class="bg-gradient-to-r from-gold-400 to-gold-600 text-dark-900 px-6 py-2 rounded-full text-sm font-bold hover:shadow-lg hover:shadow-gold-400/20 transition">立即購票</button>
    </div>
  </div>
</nav>

<!-- Hero Section -->
<section class="min-h-screen flex items-center relative overflow-hidden pt-16">
  <div class="absolute inset-0 bg-gradient-to-b from-gold-400/5 via-transparent to-transparent"></div>
  <div class="absolute top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gold-400/5 rounded-full blur-[200px]"></div>
  <div class="absolute top-24 right-1/4 w-2 h-2 bg-gold-400 rounded-full animate-pulse"></div>
  <div class="absolute top-40 left-1/5 w-1.5 h-1.5 bg-gold-300 rounded-full animate-pulse" style="animation-delay:1s"></div>
  <div class="absolute bottom-32 right-1/3 w-1 h-1 bg-gold-200 rounded-full animate-pulse" style="animation-delay:2s"></div>
  <div class="absolute top-60 left-[10%] w-1 h-1 bg-gold-400/60 rounded-full animate-pulse" style="animation-delay:0.5s"></div>
  <div class="absolute bottom-48 left-1/4 w-1.5 h-1.5 bg-gold-300/40 rounded-full animate-pulse" style="animation-delay:1.5s"></div>
  <div class="max-w-6xl mx-auto px-6 text-center relative">
    <div class="inline-flex items-center gap-2 border border-gold-400/20 rounded-full px-5 py-2 mb-8 bg-gold-400/5">
      <span class="w-2 h-2 bg-gold-400 rounded-full animate-pulse"></span>
      <span class="text-xs text-gold-400 tracking-[0.25em] uppercase font-medium">2026 Annual Charity Gala</span>
    </div>
    <h1 class="serif text-7xl md:text-8xl font-bold mb-6 gold-glow">
      <span class="bg-gradient-to-r from-gold-200 via-gold-400 to-gold-300 bg-clip-text text-transparent">璀璨之夜</span>
    </h1>
    <p class="serif text-2xl text-gold-400/80 mb-4 italic">GalaLight</p>
    <p class="text-gray-400 max-w-2xl mx-auto mb-3 leading-relaxed text-lg">一場融合藝術、音樂與頂級美食的年度慈善盛典<br>在星光璀璨中，與五百位菁英共度一個難忘的夜晚</p>
    <div class="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 mt-6 mb-10">
      <span class="flex items-center gap-2"><span class="text-lg">&#128197;</span> 2026 / 04 / 12（六）</span>
      <span class="w-1 h-1 bg-gold-400/40 rounded-full"></span>
      <span class="flex items-center gap-2"><span class="text-lg">&#9201;</span> 18:00 - 23:30</span>
      <span class="w-1 h-1 bg-gold-400/40 rounded-full"></span>
      <span class="flex items-center gap-2"><span class="text-lg">&#128205;</span> 台北文華東方酒店 Grand Ballroom</span>
    </div>
    <div class="flex gap-4 justify-center">
      <button onclick="openTicketModal()" class="bg-gradient-to-r from-gold-400 to-gold-600 text-dark-900 px-10 py-3.5 rounded-full font-bold text-sm hover:shadow-xl hover:shadow-gold-400/20 transition transform hover:scale-105">立即搶購入場券</button>
      <button onclick="scrollToSection('program')" class="border border-gold-400/30 text-gold-400 px-10 py-3.5 rounded-full font-bold text-sm hover:border-gold-400/60 hover:bg-gold-400/5 transition">瀏覽活動詳情</button>
    </div>
  </div>
</section>

<!-- Stats Bar -->
<section class="py-12 border-y border-gold-400/10 shimmer-bg">
  <div class="max-w-4xl mx-auto px-6">
    <div class="flex items-center justify-around">
      <div class="text-center">
        <div class="serif text-4xl font-bold text-white">500+</div>
        <div class="text-sm text-gold-400/70 mt-1">嘉賓席位</div>
      </div>
      <div class="w-px h-14 bg-gold-400/15"></div>
      <div class="text-center">
        <div class="serif text-4xl font-bold text-white">12</div>
        <div class="text-sm text-gold-400/70 mt-1">表演節目</div>
      </div>
      <div class="w-px h-14 bg-gold-400/15"></div>
      <div class="text-center">
        <div class="serif text-4xl font-bold text-white">1</div>
        <div class="text-sm text-gold-400/70 mt-1">難忘夜晚</div>
      </div>
    </div>
  </div>
</section>

<!-- Event Highlights -->
<section id="highlights" class="py-20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14">
      <span class="text-xs text-gold-400 tracking-[0.2em] uppercase">Event Highlights</span>
      <h2 class="serif text-4xl font-bold text-white mt-3 mb-4">活動亮點</h2>
      <p class="text-gray-400 max-w-xl mx-auto">四大精心策劃的環節，為您打造一場畢生難忘的璀璨饗宴</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card-hover rounded-2xl border border-gold-400/10 bg-dark-800/50 p-7 text-center group">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 flex items-center justify-center mx-auto mb-5 text-3xl group-hover:scale-110 transition">&#127919;</div>
        <h3 class="serif text-lg font-bold text-white mb-2">紅毯迎賓</h3>
        <p class="text-sm text-gray-400 leading-relaxed">踏上星光紅毯，享受專業攝影團隊的鎂光燈禮遇，品味迎賓香檳與精緻小點</p>
      </div>
      <div class="card-hover rounded-2xl border border-gold-400/10 bg-dark-800/50 p-7 text-center group">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 flex items-center justify-center mx-auto mb-5 text-3xl group-hover:scale-110 transition">&#127860;</div>
        <h3 class="serif text-lg font-bold text-white mb-2">頂級晚宴</h3>
        <p class="text-sm text-gray-400 leading-relaxed">米其林星級主廚精心打造八道式法餐，搭配侍酒師嚴選波爾多年份佳釀</p>
      </div>
      <div class="card-hover rounded-2xl border border-gold-400/10 bg-dark-800/50 p-7 text-center group">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 flex items-center justify-center mx-auto mb-5 text-3xl group-hover:scale-110 transition">&#127926;</div>
        <h3 class="serif text-lg font-bold text-white mb-2">精彩表演</h3>
        <p class="text-sm text-gray-400 leading-relaxed">十二組國際級藝術家輪番獻藝，從古典音樂到當代舞蹈，感動每一刻</p>
      </div>
      <div class="card-hover rounded-2xl border border-gold-400/10 bg-dark-800/50 p-7 text-center group">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 flex items-center justify-center mx-auto mb-5 text-3xl group-hover:scale-110 transition">&#128142;</div>
        <h3 class="serif text-lg font-bold text-white mb-2">慈善拍賣</h3>
        <p class="text-sm text-gray-400 leading-relaxed">珍稀藝術品與獨家體驗競標，所得全數捐贈偏鄉教育基金，讓愛延續</p>
      </div>
    </div>
  </div>
</section>

<!-- Program Timeline -->
<section id="program" class="py-20 bg-dark-800/30">
  <div class="max-w-4xl mx-auto px-6">
    <div class="text-center mb-14">
      <span class="text-xs text-gold-400 tracking-[0.2em] uppercase">Schedule</span>
      <h2 class="serif text-4xl font-bold text-white mt-3 mb-4">活動流程</h2>
      <p class="text-gray-400">一晚五幕，環環相扣的璀璨體驗</p>
    </div>
    <div class="relative">
      <div class="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-gold-400/40 via-gold-400/20 to-transparent"></div>
      <div class="space-y-8">
        <div class="flex gap-6 items-start">
          <div class="flex flex-col items-center pt-1"><div class="timeline-dot"></div></div>
          <div class="card-hover flex-1 rounded-xl border border-gold-400/10 bg-dark-900/60 p-5">
            <div class="flex items-baseline gap-3 mb-2">
              <span class="serif text-xl font-bold text-gold-400">18:00</span>
              <span class="text-white font-semibold">紅毯入場</span>
            </div>
            <p class="text-sm text-gray-400">星光紅毯迎賓，專業攝影留影。迎賓區備有頂級香檳與精緻 Canape，現場弦樂四重奏伴奏。</p>
          </div>
        </div>
        <div class="flex gap-6 items-start">
          <div class="flex flex-col items-center pt-1"><div class="timeline-dot"></div></div>
          <div class="card-hover flex-1 rounded-xl border border-gold-400/10 bg-dark-900/60 p-5">
            <div class="flex items-baseline gap-3 mb-2">
              <span class="serif text-xl font-bold text-gold-400">19:00</span>
              <span class="text-white font-semibold">晚宴時光</span>
            </div>
            <p class="text-sm text-gray-400">米其林主廚精心設計的八道式法餐正式開席。侍酒師為每道佳餚搭配年份紅白酒，味蕾與視覺的雙重饗宴。</p>
          </div>
        </div>
        <div class="flex gap-6 items-start">
          <div class="flex flex-col items-center pt-1"><div class="timeline-dot"></div></div>
          <div class="card-hover flex-1 rounded-xl border border-gold-400/10 bg-dark-900/60 p-5">
            <div class="flex items-baseline gap-3 mb-2">
              <span class="serif text-xl font-bold text-gold-400">20:30</span>
              <span class="text-white font-semibold">精彩表演</span>
            </div>
            <p class="text-sm text-gray-400">十二組國際藝術家輪番登台：爵士歌后、小提琴大師、鋼琴詩人、當代舞團。感動與驚喜交織的藝術饗宴。</p>
          </div>
        </div>
        <div class="flex gap-6 items-start">
          <div class="flex flex-col items-center pt-1"><div class="timeline-dot"></div></div>
          <div class="card-hover flex-1 rounded-xl border border-gold-400/10 bg-dark-900/60 p-5">
            <div class="flex items-baseline gap-3 mb-2">
              <span class="serif text-xl font-bold text-gold-400">21:30</span>
              <span class="text-white font-semibold">慈善拍賣</span>
            </div>
            <p class="text-sm text-gray-400">珍稀藝術品、限量設計師作品、獨家私人體驗等逾二十件珍品競標。所得全數捐贈偏鄉教育發展基金。</p>
          </div>
        </div>
        <div class="flex gap-6 items-start">
          <div class="flex flex-col items-center pt-1"><div class="timeline-dot"></div></div>
          <div class="card-hover flex-1 rounded-xl border border-gold-400/10 bg-dark-900/60 p-5">
            <div class="flex items-baseline gap-3 mb-2">
              <span class="serif text-xl font-bold text-gold-400">22:30</span>
              <span class="text-white font-semibold">After Party</span>
            </div>
            <p class="text-sm text-gray-400">移師酒店露台，在台北夜景下享受 DJ 精選音樂與特調雞尾酒。璀璨之夜的完美尾聲，星光不散場。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Performers -->
<section id="performers" class="py-20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14">
      <span class="text-xs text-gold-400 tracking-[0.2em] uppercase">Artists</span>
      <h2 class="serif text-4xl font-bold text-white mt-3 mb-4">表演嘉賓</h2>
      <p class="text-gray-400">來自世界各地的頂尖藝術家，齊聚璀璨之夜</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card-hover rounded-2xl border border-gold-400/10 bg-dark-800/40 p-6 text-center">
        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 mx-auto mb-4 flex items-center justify-center text-5xl float" style="animation-delay:0s">&#127908;</div>
        <h3 class="serif text-lg font-bold text-white">Sarah Lin</h3>
        <p class="text-gold-400 text-sm mt-1">Jazz Vocalist</p>
        <p class="text-xs text-gray-500 mt-2">葛萊美提名爵士歌后，擁有天鵝絨般的嗓音</p>
      </div>
      <div class="card-hover rounded-2xl border border-gold-400/10 bg-dark-800/40 p-6 text-center">
        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-300 to-indigo-600 mx-auto mb-4 flex items-center justify-center text-5xl float" style="animation-delay:0.5s">&#127931;</div>
        <h3 class="serif text-lg font-bold text-white">Alex Chen</h3>
        <p class="text-gold-400 text-sm mt-1">Violin Virtuoso</p>
        <p class="text-xs text-gray-500 mt-2">柏林愛樂前首席，技巧與情感的完美結合</p>
      </div>
      <div class="card-hover rounded-2xl border border-gold-400/10 bg-dark-800/40 p-6 text-center">
        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 to-orange-600 mx-auto mb-4 flex items-center justify-center text-5xl float" style="animation-delay:1s">&#127929;</div>
        <h3 class="serif text-lg font-bold text-white">Yuki Tanaka</h3>
        <p class="text-gold-400 text-sm mt-1">Piano Virtuoso</p>
        <p class="text-xs text-gray-500 mt-2">蕭邦大賽金獎得主，詩意盎然的琴鍵魔術師</p>
      </div>
      <div class="card-hover rounded-2xl border border-gold-400/10 bg-dark-800/40 p-6 text-center">
        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-rose-300 to-pink-600 mx-auto mb-4 flex items-center justify-center text-5xl float" style="animation-delay:1.5s">&#128131;</div>
        <h3 class="serif text-lg font-bold text-white">Luna Rossi</h3>
        <p class="text-gold-400 text-sm mt-1">Contemporary Dance</p>
        <p class="text-xs text-gray-500 mt-2">米蘭當代舞團首席，肢體詩篇的創作者</p>
      </div>
    </div>
  </div>
</section>

<!-- Seating Tiers -->
<section id="tickets" class="py-20 bg-dark-800/30">
  <div class="max-w-5xl mx-auto px-6">
    <div class="text-center mb-14">
      <span class="text-xs text-gold-400 tracking-[0.2em] uppercase">Tickets</span>
      <h2 class="serif text-4xl font-bold text-white mt-3 mb-4">選擇您的席位</h2>
      <p class="text-gray-400">三種尊享方案，為您量身打造完美的璀璨之夜體驗</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <!-- General -->
      <div class="ticket-tier rounded-2xl border border-white/10 bg-dark-900/70 p-7">
        <div class="text-center mb-6">
          <span class="text-sm text-gray-400">一般席</span>
          <div class="serif text-4xl font-bold text-white mt-2">$1,800</div>
          <p class="text-xs text-gray-500 mt-1">/ 每位</p>
        </div>
        <div class="divider-gold mb-6 opacity-20"></div>
        <ul class="space-y-3 text-sm text-gray-300 mb-8">
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> 標準席位入場</li>
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> 精緻自助晚餐</li>
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> 全場表演觀賞</li>
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> 迎賓飲品一杯</li>
          <li class="flex items-center gap-3 text-gray-600"><span>&#10007;</span> VIP Lounge</li>
          <li class="flex items-center gap-3 text-gray-600"><span>&#10007;</span> 嘉賓合照機會</li>
        </ul>
        <button onclick="openTicketModal('general')" class="w-full py-3 rounded-full border border-gold-400/30 text-gold-400 text-sm font-semibold hover:bg-gold-400/10 transition">選擇一般席</button>
      </div>
      <!-- Premium - Featured -->
      <div class="ticket-tier rounded-2xl border border-gold-400/40 bg-gradient-to-b from-gold-400/8 to-dark-900/70 p-7 relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2">
          <span class="bg-gradient-to-r from-gold-400 to-gold-600 text-dark-900 px-4 py-1 rounded-full text-xs font-bold tracking-wide">最受歡迎</span>
        </div>
        <div class="text-center mb-6 pt-2">
          <span class="text-sm text-gold-400">精選席</span>
          <div class="serif text-4xl font-bold text-white mt-2">$3,800</div>
          <p class="text-xs text-gray-500 mt-1">/ 每位</p>
        </div>
        <div class="divider-gold mb-6 opacity-40"></div>
        <ul class="space-y-3 text-sm text-gray-300 mb-8">
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> 前排精選席位</li>
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> 八道式法餐全席</li>
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> 全場表演觀賞</li>
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> 精選紅白酒無限暢飲</li>
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> After Party 入場</li>
          <li class="flex items-center gap-3 text-gray-600"><span>&#10007;</span> 後台導覽</li>
        </ul>
        <button onclick="openTicketModal('premium')" class="w-full py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 text-dark-900 text-sm font-bold hover:shadow-lg hover:shadow-gold-400/20 transition">選擇精選席</button>
      </div>
      <!-- VIP -->
      <div class="ticket-tier rounded-2xl border border-white/10 bg-dark-900/70 p-7">
        <div class="text-center mb-6">
          <span class="text-sm text-gray-400">貴賓席</span>
          <div class="serif text-4xl font-bold text-white mt-2">$5,800</div>
          <p class="text-xs text-gray-500 mt-1">/ 每位</p>
        </div>
        <div class="divider-gold mb-6 opacity-20"></div>
        <ul class="space-y-3 text-sm text-gray-300 mb-8">
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> 最前排 VIP 圓桌</li>
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> 主廚特製菜單</li>
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> 全場表演觀賞</li>
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> 頂級年份酒窖精選</li>
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> 嘉賓合照 + 後台導覽</li>
          <li class="flex items-center gap-3"><span class="text-gold-400">&#10003;</span> VIP Lounge 專屬空間</li>
        </ul>
        <button onclick="openTicketModal('vip')" class="w-full py-3 rounded-full border border-gold-400/30 text-gold-400 text-sm font-semibold hover:bg-gold-400/10 transition">選擇貴賓席</button>
      </div>
    </div>
  </div>
</section>

<!-- Sponsors -->
<section class="py-20">
  <div class="max-w-5xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs text-gold-400 tracking-[0.2em] uppercase">Sponsors</span>
      <h2 class="serif text-3xl font-bold text-white mt-3 mb-4">感謝贊助夥伴</h2>
      <p class="text-gray-500 text-sm">攜手共創璀璨，讓愛與藝術延續</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div class="card-hover rounded-xl border border-white/5 bg-dark-800/30 py-6 px-4 text-center">
        <div class="text-2xl mb-2">&#9830;</div>
        <span class="text-sm text-gray-400 font-medium">鼎泰豐集團</span>
      </div>
      <div class="card-hover rounded-xl border border-white/5 bg-dark-800/30 py-6 px-4 text-center">
        <div class="text-2xl mb-2">&#9733;</div>
        <span class="text-sm text-gray-400 font-medium">誠品生活</span>
      </div>
      <div class="card-hover rounded-xl border border-white/5 bg-dark-800/30 py-6 px-4 text-center">
        <div class="text-2xl mb-2">&#9827;</div>
        <span class="text-sm text-gray-400 font-medium">國泰金控</span>
      </div>
      <div class="card-hover rounded-xl border border-white/5 bg-dark-800/30 py-6 px-4 text-center">
        <div class="text-2xl mb-2">&#9829;</div>
        <span class="text-sm text-gray-400 font-medium">雲門舞集</span>
      </div>
      <div class="card-hover rounded-xl border border-white/5 bg-dark-800/30 py-6 px-4 text-center">
        <div class="text-2xl mb-2">&#10070;</div>
        <span class="text-sm text-gray-400 font-medium">故宮博物院</span>
      </div>
      <div class="card-hover rounded-xl border border-white/5 bg-dark-800/30 py-6 px-4 text-center">
        <div class="text-2xl mb-2">&#10022;</div>
        <span class="text-sm text-gray-400 font-medium">遠東飯店</span>
      </div>
    </div>
  </div>
</section>

<!-- Dress Code -->
<section class="py-20 bg-dark-800/30">
  <div class="max-w-4xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs text-gold-400 tracking-[0.2em] uppercase">Dress Code</span>
      <h2 class="serif text-3xl font-bold text-white mt-3 mb-4">著裝指南</h2>
      <p class="text-gray-400">Black Tie Optional - 展現您最優雅的一面</p>
    </div>
    <div class="grid md:grid-cols-2 gap-8">
      <div class="card-hover rounded-2xl border border-gold-400/10 bg-dark-900/60 p-8">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-dark-600 to-dark-700 border border-gold-400/20 flex items-center justify-center text-2xl">&#128372;</div>
          <div>
            <h3 class="serif text-xl font-bold text-white">男士 Gentlemen</h3>
            <p class="text-xs text-gold-400/70">Black Tie / Formal Suit</p>
          </div>
        </div>
        <ul class="space-y-3 text-sm text-gray-400">
          <li class="flex items-start gap-3"><span class="text-gold-400 mt-0.5">&#9679;</span> 深色西裝或禮服（黑色、深藍色為佳）</li>
          <li class="flex items-start gap-3"><span class="text-gold-400 mt-0.5">&#9679;</span> 白色或淺色襯衫，搭配領帶或領結</li>
          <li class="flex items-start gap-3"><span class="text-gold-400 mt-0.5">&#9679;</span> 皮質正裝鞋，避免運動鞋或涼鞋</li>
          <li class="flex items-start gap-3"><span class="text-gold-400 mt-0.5">&#9679;</span> 可搭配袖扣、領帶夾等精緻配件</li>
        </ul>
      </div>
      <div class="card-hover rounded-2xl border border-gold-400/10 bg-dark-900/60 p-8">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-dark-600 to-dark-700 border border-gold-400/20 flex items-center justify-center text-2xl">&#128151;</div>
          <div>
            <h3 class="serif text-xl font-bold text-white">女士 Ladies</h3>
            <p class="text-xs text-gold-400/70">Evening Gown / Cocktail Dress</p>
          </div>
        </div>
        <ul class="space-y-3 text-sm text-gray-400">
          <li class="flex items-start gap-3"><span class="text-gold-400 mt-0.5">&#9679;</span> 晚禮服、洋裝或優雅套裝</li>
          <li class="flex items-start gap-3"><span class="text-gold-400 mt-0.5">&#9679;</span> 深色、金色、酒紅色等典雅色系</li>
          <li class="flex items-start gap-3"><span class="text-gold-400 mt-0.5">&#9679;</span> 搭配高跟鞋或精緻平底鞋</li>
          <li class="flex items-start gap-3"><span class="text-gold-400 mt-0.5">&#9679;</span> 珠寶首飾與手拿包增添優雅氣質</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- FAQ Accordion -->
<section id="faq" class="py-20">
  <div class="max-w-3xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs text-gold-400 tracking-[0.2em] uppercase">FAQ</span>
      <h2 class="serif text-3xl font-bold text-white mt-3 mb-4">常見問題</h2>
    </div>
    <div class="space-y-3">
      <div class="rounded-xl border border-white/8 bg-dark-800/40 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition">
          <span class="font-medium text-white text-sm">購票後可以退票或更換票種嗎？</span>
          <span class="faq-icon text-gold-400 text-xl leading-none font-light">+</span>
        </button>
        <div class="faq-content px-5 pb-0">
          <p class="text-sm text-gray-400 leading-relaxed pb-5">活動日 14 天前可免費退票或升級票種（需補差額）。活動日 7-14 天內退票將收取 30% 手續費。活動日 7 天內恕不接受退票，但可轉讓給他人出席，請提前通知我們更新賓客資料。</p>
        </div>
      </div>
      <div class="rounded-xl border border-white/8 bg-dark-800/40 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition">
          <span class="font-medium text-white text-sm">現場有提供停車服務嗎？</span>
          <span class="faq-icon text-gold-400 text-xl leading-none font-light">+</span>
        </button>
        <div class="faq-content px-5 pb-0">
          <p class="text-sm text-gray-400 leading-relaxed pb-5">文華東方酒店提供代客泊車服務（VIP 貴賓席免費，其他席位優惠價 NT$300）。酒店地下停車場也開放使用，建議提早抵達。我們也鼓勵搭乘計程車或代駕服務，讓您安心享用美酒佳餚。</p>
        </div>
      </div>
      <div class="rounded-xl border border-white/8 bg-dark-800/40 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition">
          <span class="font-medium text-white text-sm">有特殊飲食需求怎麼辦？</span>
          <span class="faq-icon text-gold-400 text-xl leading-none font-light">+</span>
        </button>
        <div class="faq-content px-5 pb-0">
          <p class="text-sm text-gray-400 leading-relaxed pb-5">我們提供素食、純素、無麩質及其他特殊飲食選項。購票時請在備註欄填寫您的飲食需求，或在活動前 7 天透過客服信箱告知。我們的米其林主廚團隊將為您量身打造同等精緻的特別菜單。</p>
        </div>
      </div>
      <div class="rounded-xl border border-white/8 bg-dark-800/40 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition">
          <span class="font-medium text-white text-sm">慈善拍賣的款項用途為何？</span>
          <span class="faq-icon text-gold-400 text-xl leading-none font-light">+</span>
        </button>
        <div class="faq-content px-5 pb-0">
          <p class="text-sm text-gray-400 leading-relaxed pb-5">所有拍賣所得 100% 捐贈「台灣偏鄉教育發展基金會」，用於改善偏鄉學校的教學設備與師資培訓。過去三年，我們已累計募款超過 NT$2,800 萬，幫助 120 所學校的 15,000 名學童。活動後將公開完整財務報告。</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Location -->
<section id="location" class="py-20 bg-dark-800/30">
  <div class="max-w-4xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs text-gold-400 tracking-[0.2em] uppercase">Venue</span>
      <h2 class="serif text-3xl font-bold text-white mt-3 mb-4">活動地點</h2>
    </div>
    <div class="rounded-2xl border border-gold-400/10 bg-dark-900/60 p-8 md:p-10">
      <div class="grid md:grid-cols-2 gap-8">
        <div>
          <h3 class="serif text-xl font-bold text-white mb-2">台北文華東方酒店</h3>
          <p class="text-gold-400 text-sm mb-4">Mandarin Oriental, Taipei</p>
          <div class="space-y-4 text-sm text-gray-400">
            <div class="flex items-start gap-3">
              <span class="text-gold-400 mt-0.5">&#9906;</span>
              <div>
                <p class="text-white font-medium">地址</p>
                <p>台北市松山區敦化北路 158 號 B2<br>Grand Ballroom 大宴會廳</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <span class="text-gold-400 mt-0.5">&#128222;</span>
              <div>
                <p class="text-white font-medium">聯繫方式</p>
                <p>電話：02-2715-6888</p>
                <p>信箱：gala@galalight.tw</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h4 class="text-white font-medium text-sm mb-4">交通方式</h4>
          <div class="space-y-3 text-sm text-gray-400">
            <div class="flex items-start gap-3">
              <span class="text-gold-400">&#9642;</span>
              <p><span class="text-white">捷運</span>：南京復興站 4 號出口，步行約 8 分鐘</p>
            </div>
            <div class="flex items-start gap-3">
              <span class="text-gold-400">&#9642;</span>
              <p><span class="text-white">公車</span>：敦化北路站（285、292、630 路）</p>
            </div>
            <div class="flex items-start gap-3">
              <span class="text-gold-400">&#9642;</span>
              <p><span class="text-white">開車</span>：酒店提供代客泊車，或使用 B3-B5 停車場</p>
            </div>
            <div class="flex items-start gap-3">
              <span class="text-gold-400">&#9642;</span>
              <p><span class="text-white">計程車</span>：建議搭乘台灣大車隊，代碼「GalaLight」享優惠</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA Before Footer -->
<section class="py-20">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <h2 class="serif text-3xl font-bold text-white mb-4">準備好迎接璀璨之夜了嗎？</h2>
    <p class="text-gray-400 mb-8">席位有限，售完即止。立即購票，與我們共度這場年度盛典。</p>
    <button onclick="openTicketModal()" class="bg-gradient-to-r from-gold-400 to-gold-600 text-dark-900 px-12 py-4 rounded-full font-bold hover:shadow-xl hover:shadow-gold-400/20 transition transform hover:scale-105">立即購票</button>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-gold-400/10 py-10">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-sm font-bold text-dark-900">G</div>
        <span class="serif text-lg font-bold text-gold-300">GalaLight</span>
        <span class="text-gray-600 text-sm ml-2">| 2026 璀璨之夜</span>
      </div>
      <div class="flex items-center gap-6 text-sm text-gray-500">
        <a class="hover:text-gold-400 transition cursor-pointer">Instagram</a>
        <a class="hover:text-gold-400 transition cursor-pointer">Facebook</a>
        <a class="hover:text-gold-400 transition cursor-pointer">LINE</a>
        <a class="hover:text-gold-400 transition cursor-pointer">聯絡我們</a>
      </div>
    </div>
    <div class="divider-gold opacity-10 my-6"></div>
    <div class="flex flex-col md:flex-row items-center justify-between text-xs text-gray-600 gap-2">
      <span>Copyright 2026 GalaLight. All rights reserved.</span>
      <div class="flex gap-4">
        <a class="hover:text-gold-400 transition cursor-pointer">隱私權政策</a>
        <a class="hover:text-gold-400 transition cursor-pointer">服務條款</a>
        <a class="hover:text-gold-400 transition cursor-pointer">退票政策</a>
      </div>
    </div>
  </div>
</footer>

<!-- Ticket Purchase Modal -->
<div id="ticketModal" class="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="closeTicketModal()"></div>
  <div class="modal-box relative bg-dark-800 border border-gold-400/20 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
    <!-- Form View -->
    <div id="ticketForm">
      <div class="p-6 border-b border-white/5">
        <div class="flex items-center justify-between">
          <h3 class="serif text-xl font-bold text-white">購票資訊</h3>
          <button onclick="closeTicketModal()" class="text-gray-500 hover:text-white transition text-2xl leading-none">&times;</button>
        </div>
        <p class="text-sm text-gray-400 mt-1">璀璨之夜 2026 | 04/12（六）</p>
      </div>
      <div class="p-6 space-y-5">
        <div>
          <label class="block text-sm text-gray-300 mb-1.5">姓名 <span class="text-gold-400">*</span></label>
          <input id="formName" type="text" placeholder="請輸入您的姓名" class="w-full bg-dark-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-400/50 transition">
        </div>
        <div>
          <label class="block text-sm text-gray-300 mb-1.5">Email <span class="text-gold-400">*</span></label>
          <input id="formEmail" type="email" placeholder="your@email.com" class="w-full bg-dark-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-400/50 transition">
        </div>
        <div>
          <label class="block text-sm text-gray-300 mb-1.5">聯絡電話 <span class="text-gold-400">*</span></label>
          <input id="formPhone" type="tel" placeholder="0912-345-678" class="w-full bg-dark-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-400/50 transition">
        </div>
        <div>
          <label class="block text-sm text-gray-300 mb-2">選擇票種 <span class="text-gold-400">*</span></label>
          <div class="grid grid-cols-3 gap-3" id="tierSelector">
            <button onclick="selectTier(this,'general')" data-tier="general" class="tier-btn rounded-lg border border-white/10 bg-dark-900 p-3 text-center hover:border-gold-400/30 transition text-sm">
              <div class="text-gray-400">一般席</div>
              <div class="text-white font-bold mt-1">$1,800</div>
            </button>
            <button onclick="selectTier(this,'premium')" data-tier="premium" class="tier-btn rounded-lg border border-white/10 bg-dark-900 p-3 text-center hover:border-gold-400/30 transition text-sm">
              <div class="text-gray-400">精選席</div>
              <div class="text-white font-bold mt-1">$3,800</div>
            </button>
            <button onclick="selectTier(this,'vip')" data-tier="vip" class="tier-btn rounded-lg border border-white/10 bg-dark-900 p-3 text-center hover:border-gold-400/30 transition text-sm">
              <div class="text-gray-400">貴賓席</div>
              <div class="text-white font-bold mt-1">$5,800</div>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm text-gray-300 mb-2">付款方式</label>
          <div class="space-y-2" id="paymentMethods">
            <label class="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-dark-900 cursor-pointer hover:border-gold-400/20 transition">
              <input type="radio" name="payment" value="credit" checked class="accent-yellow-500">
              <span class="text-sm text-gray-300">信用卡 / 簽帳金融卡</span>
            </label>
            <label class="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-dark-900 cursor-pointer hover:border-gold-400/20 transition">
              <input type="radio" name="payment" value="transfer" class="accent-yellow-500">
              <span class="text-sm text-gray-300">銀行轉帳 / ATM</span>
            </label>
            <label class="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-dark-900 cursor-pointer hover:border-gold-400/20 transition">
              <input type="radio" name="payment" value="linepay" class="accent-yellow-500">
              <span class="text-sm text-gray-300">LINE Pay</span>
            </label>
          </div>
        </div>
        <div id="formError" class="hidden text-sm text-red-400 bg-red-400/10 rounded-lg p-3"></div>
        <button onclick="submitTicket()" class="w-full py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 text-dark-900 font-bold text-sm hover:shadow-lg hover:shadow-gold-400/20 transition">確認購票</button>
        <p class="text-xs text-gray-600 text-center">點擊確認即表示您同意活動條款與退票政策</p>
      </div>
    </div>
    <!-- Success View -->
    <div id="ticketSuccess" class="hidden p-10 text-center">
      <div class="w-20 h-20 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 mx-auto mb-6 flex items-center justify-center success-check">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0a0a1a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <h3 class="serif text-2xl font-bold text-white mb-3">購票成功！</h3>
      <p class="text-gray-400 text-sm mb-2">感謝您的購買，確認信已發送至您的信箱</p>
      <p class="text-gold-400 text-sm font-medium mb-6" id="successDetail"></p>
      <div class="rounded-xl border border-gold-400/10 bg-dark-900/60 p-4 mb-6 text-sm text-gray-400">
        <p>活動日期：2026 / 04 / 12（六）18:00</p>
        <p>活動地點：台北文華東方酒店 Grand Ballroom</p>
      </div>
      <button onclick="closeTicketModal()" class="px-8 py-2.5 rounded-full border border-gold-400/30 text-gold-400 text-sm font-medium hover:bg-gold-400/10 transition">返回頁面</button>
    </div>
  </div>
</div>

<script>
// Smooth scroll navigation
function scrollToSection(id) {
  var el = document.getElementById(id);
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

// FAQ accordion toggle
function toggleFaq(btn) {
  var content = btn.nextElementSibling;
  var icon = btn.querySelector('.faq-icon');
  var isOpen = content.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-content').forEach(function(c) { c.classList.remove('open'); c.style.paddingBottom = '0'; });
  document.querySelectorAll('.faq-icon').forEach(function(i) { i.classList.remove('open'); });
  // Open clicked if was closed
  if (!isOpen) {
    content.classList.add('open');
    content.style.paddingBottom = '0';
    icon.classList.add('open');
  }
}

// Ticket modal
var selectedTier = 'premium';
var tierNames = { general: '一般席', premium: '精選席', vip: '貴賓席' };
var tierPrices = { general: '$1,800', premium: '$3,800', vip: '$5,800' };

function openTicketModal(tier) {
  if (tier) { selectedTier = tier; }
  document.getElementById('ticketModal').classList.add('active');
  document.getElementById('ticketForm').classList.remove('hidden');
  document.getElementById('ticketSuccess').classList.add('hidden');
  document.getElementById('formError').classList.add('hidden');
  document.body.style.overflow = 'hidden';
  updateTierSelection();
}

function closeTicketModal() {
  document.getElementById('ticketModal').classList.remove('active');
  document.body.style.overflow = '';
}

function selectTier(btn, tier) {
  selectedTier = tier;
  updateTierSelection();
}

function updateTierSelection() {
  document.querySelectorAll('.tier-btn').forEach(function(b) {
    b.classList.remove('border-gold-400', 'bg-gold-400/10');
    b.classList.add('border-white/10');
  });
  var active = document.querySelector('[data-tier="' + selectedTier + '"]');
  if (active) {
    active.classList.add('border-gold-400', 'bg-gold-400/10');
    active.classList.remove('border-white/10');
  }
}

function submitTicket() {
  var name = document.getElementById('formName').value.trim();
  var email = document.getElementById('formEmail').value.trim();
  var phone = document.getElementById('formPhone').value.trim();
  var errEl = document.getElementById('formError');
  if (!name || !email || !phone) {
    errEl.textContent = '請填寫所有必填欄位';
    errEl.classList.remove('hidden');
    return;
  }
  if (!email.includes('@')) {
    errEl.textContent = '請輸入有效的 Email 地址';
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');
  document.getElementById('ticketForm').classList.add('hidden');
  document.getElementById('ticketSuccess').classList.remove('hidden');
  document.getElementById('successDetail').textContent = tierNames[selectedTier] + ' x 1 - ' + tierPrices[selectedTier];
}

// Nav scroll effect
window.addEventListener('scroll', function() {
  var nav = document.getElementById('mainNav');
  if (window.scrollY > 50) {
    nav.style.borderBottomColor = 'rgba(212,168,83,0.15)';
    nav.style.backgroundColor = 'rgba(10,10,26,0.95)';
  } else {
    nav.style.borderBottomColor = 'rgba(212,168,83,0.1)';
    nav.style.backgroundColor = 'rgba(10,10,26,0.8)';
  }
});

// Close modal on Escape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeTicketModal(); }
});
</script>

</body>
</html>
  $GALA_V2$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
