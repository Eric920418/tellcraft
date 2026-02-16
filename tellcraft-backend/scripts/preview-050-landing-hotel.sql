INSERT INTO template_previews (template_id, html_content, version)
VALUES ('e6c42cea-45c8-4055-9b5d-f55f8bf52cb7', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>嵐山旅宿 ARASHIYAMA</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{ink:'#1c1917',sand:'#d6cfc4',linen:'#f5f0eb',moss:'#6b7c5e',terracotta:'#c4704b',gold:'#b8943e'},fontFamily:{display:['Cormorant Garamond','serif'],body:['DM Sans','sans-serif']}}}}
</script>
<style>
body{font-family:'DM Sans',sans-serif}
html{scroll-behavior:smooth}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.8s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.room-card:hover .room-img{transform:scale(1.05)}
.room-img{transition:transform 0.6s cubic-bezier(0.4,0,0.2,1)}
.parallax-slow{transition:transform 0.3s}
</style>
</head>
<body class="bg-linen text-ink overflow-x-hidden">

<!-- Nav -->
<nav class="fixed top-0 w-full bg-linen/95 backdrop-blur-sm z-50">
  <div class="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
    <div class="text-center">
      <div class="font-display text-xl font-semibold tracking-[0.15em]">嵐山旅宿</div>
      <div class="text-[9px] tracking-[0.4em] text-sand uppercase">Arashiyama Hotel</div>
    </div>
    <div class="hidden md:flex items-center gap-8 text-sm tracking-wider text-ink/50">
      <a href="#rooms" class="hover:text-ink transition-colors cursor-pointer">客房</a>
      <a href="#experience" class="hover:text-ink transition-colors cursor-pointer">體驗</a>
      <a href="#dining" class="hover:text-ink transition-colors cursor-pointer">餐飲</a>
      <a href="#gallery" class="hover:text-ink transition-colors cursor-pointer">風景</a>
      <a href="#contact" class="hover:text-ink transition-colors cursor-pointer">聯繫</a>
    </div>
    <button onclick="document.getElementById('bookingModal').classList.remove('hidden')" class="bg-ink text-linen px-5 py-2.5 text-sm tracking-wider hover:bg-ink/80 transition-colors cursor-pointer">
      預約訂房
    </button>
  </div>
</nav>

<!-- Hero -->
<section class="min-h-screen flex items-center justify-center relative pt-16">
  <div class="absolute inset-0 bg-gradient-to-b from-moss/5 via-transparent to-linen"></div>
  <div class="max-w-4xl mx-auto px-8 text-center relative z-10">
    <div class="reveal">
      <div class="text-sand text-xs tracking-[0.5em] uppercase mb-8">Since 1968 · Taipei · Taiwan</div>
      <h1 class="font-display text-5xl md:text-7xl lg:text-8xl font-medium leading-[1.1] mb-8">
        在城市裡<br>
        <span class="italic text-terracotta">找到山林</span>
      </h1>
      <div class="w-16 h-px bg-gold mx-auto mb-8"></div>
      <p class="text-ink/40 text-lg max-w-lg mx-auto leading-relaxed mb-10">
        融合日式侘寂美學與台灣在地風土，嵐山旅宿以自然素材與留白空間，為旅人打造一處身心安頓之所。
      </p>
      <div class="flex items-center justify-center gap-6">
        <button onclick="document.getElementById('bookingModal').classList.remove('hidden')" class="bg-ink text-linen px-10 py-4 text-sm tracking-wider hover:bg-ink/80 transition-colors cursor-pointer">
          立即訂房
        </button>
        <a href="#rooms" class="text-sm tracking-wider text-ink/50 border-b border-ink/30 pb-0.5 hover:text-ink hover:border-ink transition-colors cursor-pointer">
          瀏覽客房 →
        </a>
      </div>
    </div>
    <!-- Decorative elements -->
    <div class="mt-20 grid grid-cols-3 gap-8 reveal">
      <div class="bg-gradient-to-b from-moss/10 to-moss/5 aspect-[3/4] rounded-sm"></div>
      <div class="bg-gradient-to-b from-terracotta/10 to-terracotta/5 aspect-[3/4] rounded-sm -mt-8"></div>
      <div class="bg-gradient-to-b from-sand/30 to-sand/10 aspect-[3/4] rounded-sm"></div>
    </div>
  </div>
</section>

<!-- Rooms -->
<section id="rooms" class="py-24 bg-white">
  <div class="max-w-6xl mx-auto px-8">
    <div class="text-center mb-16 reveal">
      <div class="text-sand text-xs tracking-[0.4em] uppercase mb-3">Rooms</div>
      <h2 class="font-display text-4xl md:text-5xl">客房</h2>
      <p class="text-ink/30 mt-4 max-w-md mx-auto text-sm">每一間客房都是一首關於安靜的詩，天然木材與手作布藝，將山林的氣息引入室內。</p>
    </div>
    <div class="grid md:grid-cols-2 gap-8">
      <div class="room-card reveal cursor-pointer group">
        <div class="aspect-[4/3] bg-gradient-to-br from-sand/30 to-moss/10 overflow-hidden rounded-sm mb-5 relative">
          <div class="room-img w-full h-full flex items-center justify-center">
            <div class="w-40 h-24 border border-sand/40 rounded-sm flex items-center justify-center"><div class="w-8 h-8 bg-moss/20 rounded-full"></div></div>
          </div>
          <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-sm">
            <div class="text-xs tracking-wider">NTD <span class="font-display text-xl font-bold">3,800</span> / 晚</div>
          </div>
        </div>
        <h3 class="font-display text-2xl mb-1">山景雙人房</h3>
        <p class="text-ink/40 text-sm">18坪 · 山景陽台 · 檜木浴缸 · King Size</p>
      </div>
      <div class="room-card reveal cursor-pointer group" style="transition-delay:0.1s">
        <div class="aspect-[4/3] bg-gradient-to-br from-terracotta/10 to-sand/20 overflow-hidden rounded-sm mb-5 relative">
          <div class="room-img w-full h-full flex items-center justify-center">
            <div class="w-48 h-24 border border-sand/40 rounded-sm flex items-center justify-center"><div class="w-10 h-10 bg-terracotta/20 rounded-full"></div></div>
          </div>
          <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-sm">
            <div class="text-xs tracking-wider">NTD <span class="font-display text-xl font-bold">5,200</span> / 晚</div>
          </div>
        </div>
        <h3 class="font-display text-2xl mb-1">溪畔套房</h3>
        <p class="text-ink/40 text-sm">28坪 · 獨立客廳 · 戶外溫泉池 · 雙面採光</p>
      </div>
      <div class="room-card reveal cursor-pointer group" style="transition-delay:0.2s">
        <div class="aspect-[4/3] bg-gradient-to-br from-gold/10 to-sand/20 overflow-hidden rounded-sm mb-5 relative">
          <div class="room-img w-full h-full flex items-center justify-center">
            <div class="w-44 h-28 border border-gold/30 rounded-sm flex items-center justify-center"><div class="w-12 h-12 bg-gold/20 rounded-full"></div></div>
          </div>
          <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-sm">
            <div class="text-xs tracking-wider">NTD <span class="font-display text-xl font-bold">8,600</span> / 晚</div>
          </div>
          <div class="absolute top-4 right-4 bg-gold text-white text-xs px-3 py-1 rounded-sm tracking-wider">尊爵</div>
        </div>
        <h3 class="font-display text-2xl mb-1">嵐山別邸</h3>
        <p class="text-ink/40 text-sm">45坪 · 獨棟別墅 · 私人庭園 · 露天溫泉 · 管家服務</p>
      </div>
      <div class="room-card reveal cursor-pointer group" style="transition-delay:0.3s">
        <div class="aspect-[4/3] bg-gradient-to-br from-moss/10 to-green-50 overflow-hidden rounded-sm mb-5 relative">
          <div class="room-img w-full h-full flex items-center justify-center">
            <div class="w-36 h-24 border border-moss/30 rounded-sm flex items-center justify-center gap-4">
              <div class="w-6 h-6 bg-moss/20 rounded-full"></div>
              <div class="w-6 h-6 bg-moss/20 rounded-full"></div>
            </div>
          </div>
          <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-sm">
            <div class="text-xs tracking-wider">NTD <span class="font-display text-xl font-bold">4,500</span> / 晚</div>
          </div>
        </div>
        <h3 class="font-display text-2xl mb-1">和室家庭房</h3>
        <p class="text-ink/40 text-sm">22坪 · 和式榻榻米 · 可加床 · 兒童備品 · 庭園景</p>
      </div>
    </div>
  </div>
</section>

<!-- Experience -->
<section id="experience" class="py-24 bg-ink text-linen">
  <div class="max-w-6xl mx-auto px-8">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div class="reveal">
        <div class="text-gold text-xs tracking-[0.4em] uppercase mb-4">Experience</div>
        <h2 class="font-display text-4xl md:text-5xl mb-8 leading-tight">
          不只是住宿<br>
          是一場<span class="italic text-terracotta">感官旅行</span>
        </h2>
        <div class="h-px bg-linen/10 my-8"></div>
        <div class="space-y-6">
          <div class="flex gap-4">
            <div class="w-10 h-10 bg-moss/20 rounded-full flex items-center justify-center flex-shrink-0 text-lg">🍵</div>
            <div>
              <h3 class="font-display text-xl mb-1">茶道體驗</h3>
              <p class="text-sand text-sm leading-relaxed">由日本裏千家茶道老師親授，在茶室中感受一期一會的禪意。</p>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="w-10 h-10 bg-terracotta/20 rounded-full flex items-center justify-center flex-shrink-0 text-lg">♨️</div>
            <div>
              <h3 class="font-display text-xl mb-1">溫泉湯屋</h3>
              <p class="text-sand text-sm leading-relaxed">引用北投白磺泉，室內外湯池各二，四季皆宜的暖身之旅。</p>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0 text-lg">🧘</div>
            <div>
              <h3 class="font-display text-xl mb-1">晨間瑜伽</h3>
              <p class="text-sand text-sm leading-relaxed">每日清晨七點，在山景露台上，隨著晨光開始一天的靜心練習。</p>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="w-10 h-10 bg-linen/10 rounded-full flex items-center justify-center flex-shrink-0 text-lg">🌿</div>
            <div>
              <h3 class="font-display text-xl mb-1">植物染工作坊</h3>
              <p class="text-sand text-sm leading-relaxed">採集園區植物，由在地藝術家帶領手作染布，帶一份自然回家。</p>
            </div>
          </div>
        </div>
      </div>
      <div class="reveal">
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gradient-to-br from-moss/20 to-moss/5 aspect-square rounded-sm"></div>
          <div class="bg-gradient-to-br from-terracotta/15 to-terracotta/5 aspect-square rounded-sm mt-8"></div>
          <div class="bg-gradient-to-br from-gold/15 to-gold/5 aspect-square rounded-sm -mt-8"></div>
          <div class="bg-gradient-to-br from-sand/20 to-sand/5 aspect-square rounded-sm"></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Dining -->
<section id="dining" class="py-24 bg-linen">
  <div class="max-w-6xl mx-auto px-8">
    <div class="text-center mb-16 reveal">
      <div class="text-sand text-xs tracking-[0.4em] uppercase mb-3">Dining</div>
      <h2 class="font-display text-4xl md:text-5xl">餐飲</h2>
      <p class="text-ink/30 mt-4 max-w-md mx-auto text-sm">當令食材、在地風味，每一道料理都是土地的故事</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="reveal group cursor-pointer">
        <div class="aspect-square bg-gradient-to-br from-gold/10 to-sand/20 rounded-sm mb-5 flex items-center justify-center overflow-hidden">
          <div class="text-5xl group-hover:scale-110 transition-transform">🍱</div>
        </div>
        <h3 class="font-display text-xl mb-1">嵐 · 早食</h3>
        <p class="text-ink/40 text-sm leading-relaxed">手作日式一汁三菜，搭配在地小農鮮蔬與現磨豆漿，開啟美好的一天。</p>
        <p class="text-terracotta text-xs mt-2 tracking-wider">07:00 - 10:00 · 含房價</p>
      </div>
      <div class="reveal group cursor-pointer" style="transition-delay:0.1s">
        <div class="aspect-square bg-gradient-to-br from-moss/10 to-green-50 rounded-sm mb-5 flex items-center justify-center overflow-hidden">
          <div class="text-5xl group-hover:scale-110 transition-transform">🍜</div>
        </div>
        <h3 class="font-display text-xl mb-1">溪 · 午膳</h3>
        <p class="text-ink/40 text-sm leading-relaxed">台法融合料理，以本土食材演繹法式手法，季節限定 5 道式午間套餐。</p>
        <p class="text-terracotta text-xs mt-2 tracking-wider">11:30 - 14:00 · NTD 1,200 起</p>
      </div>
      <div class="reveal group cursor-pointer" style="transition-delay:0.2s">
        <div class="aspect-square bg-gradient-to-br from-terracotta/10 to-sand/20 rounded-sm mb-5 flex items-center justify-center overflow-hidden">
          <div class="text-5xl group-hover:scale-110 transition-transform">🥂</div>
        </div>
        <h3 class="font-display text-xl mb-1">月 · 晚席</h3>
        <p class="text-ink/40 text-sm leading-relaxed">八道式 Omakase 無菜單料理，主廚根據當日最佳食材即興創作。需提前預約。</p>
        <p class="text-terracotta text-xs mt-2 tracking-wider">18:00 - 21:00 · NTD 3,600 / 人</p>
      </div>
    </div>
  </div>
</section>

<!-- Gallery -->
<section id="gallery" class="py-24 bg-white">
  <div class="max-w-6xl mx-auto px-8">
    <div class="text-center mb-16 reveal">
      <div class="text-sand text-xs tracking-[0.4em] uppercase mb-3">Gallery</div>
      <h2 class="font-display text-4xl md:text-5xl">四季風景</h2>
    </div>
    <div class="grid grid-cols-3 gap-4 reveal">
      <div class="aspect-square bg-gradient-to-br from-pink-100 to-pink-50 rounded-sm flex items-center justify-center text-4xl hover:scale-[1.02] transition-transform cursor-pointer">🌸</div>
      <div class="aspect-[2/1] col-span-2 bg-gradient-to-br from-green-100 to-green-50 rounded-sm flex items-center justify-center text-4xl hover:scale-[1.02] transition-transform cursor-pointer">🌿</div>
      <div class="aspect-[2/1] col-span-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-sm flex items-center justify-center text-4xl hover:scale-[1.02] transition-transform cursor-pointer">🍂</div>
      <div class="aspect-square bg-gradient-to-br from-blue-100 to-blue-50 rounded-sm flex items-center justify-center text-4xl hover:scale-[1.02] transition-transform cursor-pointer">❄️</div>
    </div>
  </div>
</section>

<!-- Reviews -->
<section class="py-24 bg-linen">
  <div class="max-w-4xl mx-auto px-8">
    <div class="text-center mb-16 reveal">
      <div class="text-sand text-xs tracking-[0.4em] uppercase mb-3">Guest Reviews</div>
      <h2 class="font-display text-4xl">旅人心聲</h2>
    </div>
    <div class="space-y-8 reveal">
      <div class="border-l-2 border-gold pl-8">
        <p class="font-display text-xl italic leading-relaxed text-ink/70 mb-4">「走進房間的瞬間，整個人就安靜下來了。檜木的香氣、窗外的綠意、浴缸裡的溫泉水⋯這裡是真正能讓人放空的地方。」</p>
        <div class="text-sm text-ink/40">— Mika T. · 來自東京 · 2025.12</div>
      </div>
      <div class="border-l-2 border-terracotta pl-8">
        <p class="font-display text-xl italic leading-relaxed text-ink/70 mb-4">「我們住了嵐山別邸，私人庭園和露天溫泉太奢侈了。管家的服務細膩到每個細節，值得每一分錢。」</p>
        <div class="text-sm text-ink/40">— James & Sarah · 來自倫敦 · 2026.01</div>
      </div>
      <div class="border-l-2 border-moss pl-8">
        <p class="font-display text-xl italic leading-relaxed text-ink/70 mb-4">「帶孩子一起參加植物染工作坊，是這趟旅行最棒的回憶。早餐的手作豆漿和味噌湯，孩子到現在還在念念不忘。」</p>
        <div class="text-sm text-ink/40">— 小米家庭 · 台北 · 2026.02</div>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-24 bg-ink text-linen">
  <div class="max-w-6xl mx-auto px-8">
    <div class="grid lg:grid-cols-2 gap-16">
      <div class="reveal">
        <div class="text-gold text-xs tracking-[0.4em] uppercase mb-4">Contact</div>
        <h2 class="font-display text-4xl md:text-5xl mb-8">期待與您<br><span class="italic text-terracotta">相遇</span></h2>
        <div class="space-y-6 text-sand">
          <div>
            <div class="text-linen text-xs tracking-[0.2em] uppercase mb-1">地址</div>
            <p>台北市北投區泉源路 168 號</p>
          </div>
          <div>
            <div class="text-linen text-xs tracking-[0.2em] uppercase mb-1">電話</div>
            <p>(02) 2891-6800</p>
          </div>
          <div>
            <div class="text-linen text-xs tracking-[0.2em] uppercase mb-1">Email</div>
            <p>reserve@arashiyama.tw</p>
          </div>
          <div>
            <div class="text-linen text-xs tracking-[0.2em] uppercase mb-1">交通</div>
            <p>捷運新北投站 · 免費接駁車（每 30 分鐘一班）</p>
          </div>
        </div>
      </div>
      <div class="reveal">
        <div class="bg-linen/5 border border-linen/10 rounded-sm p-8">
          <h3 class="font-display text-xl mb-6">預約諮詢</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <input type="text" placeholder="姓名" class="w-full bg-transparent border-b border-linen/20 py-3 text-linen focus:border-gold focus:outline-none transition-colors text-sm">
              <input type="tel" placeholder="電話" class="w-full bg-transparent border-b border-linen/20 py-3 text-linen focus:border-gold focus:outline-none transition-colors text-sm">
            </div>
            <input type="email" placeholder="Email" class="w-full bg-transparent border-b border-linen/20 py-3 text-linen focus:border-gold focus:outline-none transition-colors text-sm">
            <div class="grid grid-cols-2 gap-4">
              <input type="date" class="w-full bg-transparent border-b border-linen/20 py-3 text-sand focus:border-gold focus:outline-none transition-colors text-sm">
              <select class="w-full bg-transparent border-b border-linen/20 py-3 text-sand focus:border-gold focus:outline-none transition-colors text-sm cursor-pointer">
                <option class="bg-ink">住宿天數</option>
                <option class="bg-ink">1 晚</option>
                <option class="bg-ink">2 晚</option>
                <option class="bg-ink">3 晚以上</option>
              </select>
            </div>
            <textarea rows="3" placeholder="特殊需求..." class="w-full bg-transparent border-b border-linen/20 py-3 text-linen focus:border-gold focus:outline-none transition-colors text-sm resize-none"></textarea>
            <button onclick="showToast('感謝您的詢問，我們將盡快回覆。')" class="bg-linen text-ink px-8 py-3.5 text-sm tracking-wider hover:bg-gold hover:text-white transition-all cursor-pointer mt-2">
              送出諮詢
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-ink border-t border-linen/10 py-8">
  <div class="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
    <div>
      <div class="font-display text-sm text-linen tracking-[0.15em]">嵐山旅宿 ARASHIYAMA</div>
    </div>
    <div class="text-sand/40 text-xs">© 2026 嵐山旅宿. All rights reserved.</div>
    <div class="flex gap-4 text-sand/50 text-xs tracking-wider">
      <span class="hover:text-gold transition-colors cursor-pointer">Instagram</span>
      <span class="hover:text-gold transition-colors cursor-pointer">Facebook</span>
    </div>
  </div>
</footer>

<!-- Booking Modal -->
<div id="bookingModal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="bg-linen rounded-sm p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h3 class="font-display text-2xl">預約訂房</h3>
        <p class="text-ink/40 text-xs mt-1">選擇日期與房型，開始您的旅程</p>
      </div>
      <button onclick="document.getElementById('bookingModal').classList.add('hidden')" class="w-8 h-8 bg-ink/5 flex items-center justify-center text-ink/40 hover:bg-ink/10 cursor-pointer rounded-sm">✕</button>
    </div>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs text-ink/40 mb-1 block tracking-wider">入住日期</label>
          <input type="date" class="w-full border border-ink/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold">
        </div>
        <div>
          <label class="text-xs text-ink/40 mb-1 block tracking-wider">退房日期</label>
          <input type="date" class="w-full border border-ink/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold">
        </div>
      </div>
      <div>
        <label class="text-xs text-ink/40 mb-1 block tracking-wider">房型</label>
        <select class="w-full border border-ink/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold cursor-pointer">
          <option>山景雙人房 — NTD 3,800/晚</option>
          <option>溪畔套房 — NTD 5,200/晚</option>
          <option>嵐山別邸 — NTD 8,600/晚</option>
          <option>和室家庭房 — NTD 4,500/晚</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs text-ink/40 mb-1 block tracking-wider">成人</label>
          <select class="w-full border border-ink/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold cursor-pointer">
            <option>1 位</option><option>2 位</option><option>3 位</option><option>4 位</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-ink/40 mb-1 block tracking-wider">兒童</label>
          <select class="w-full border border-ink/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold cursor-pointer">
            <option>0 位</option><option>1 位</option><option>2 位</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <input type="text" placeholder="姓名" class="border border-ink/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold">
        <input type="tel" placeholder="聯絡電話" class="border border-ink/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold">
      </div>
      <textarea placeholder="特殊需求（如：素食、嬰兒床、無障礙...）" rows="2" class="w-full border border-ink/10 bg-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-gold resize-none"></textarea>
      <button onclick="document.getElementById('bookingModal').classList.add('hidden');showToast('訂房申請已送出，我們將於 24 小時內確認。')" class="w-full bg-ink text-linen py-4 text-sm tracking-wider hover:bg-ink/80 transition-colors cursor-pointer">
        確認訂房
      </button>
      <p class="text-ink/30 text-xs text-center">提交後將由專人確認房間與報價</p>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 bg-ink text-linen px-6 py-3.5 shadow-2xl z-50 translate-y-20 opacity-0 transition-all duration-500 text-sm tracking-wider rounded-sm"></div>

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
