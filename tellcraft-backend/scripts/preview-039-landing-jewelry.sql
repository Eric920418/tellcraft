INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '2b03734b-1777-4384-9507-35804f525f20',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LUMIÈRE — 珠寶精品</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500&family=Noto+Serif+TC:wght@400;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        gold: { 50:'#fefdf4', 100:'#fef9e0', 200:'#fdf0b8', 300:'#fce37f', 400:'#fad24a', 500:'#e8b810', 600:'#c9960d', 700:'#a06f0e', 800:'#845812', 900:'#6d4815' },
        lux: { 50:'#fafaf9', 100:'#f5f5f4', 200:'#e7e5e4', 300:'#d6d3d1', 400:'#a8a29e', 500:'#78716c', 600:'#57534e', 700:'#44403c', 800:'#292524', 900:'#1c1917', 950:'#0c0a09' }
      },
      fontFamily: {
        serif:['Cormorant Garamond','Noto Serif TC','serif'],
        sans:['Inter','sans-serif']
      }
    }
  }
}
</script>
<style>
  body { font-family: 'Inter', sans-serif; }
  h1,h2,h3,.font-serif { font-family: 'Cormorant Garamond', 'Noto Serif TC', serif; }
  html { scroll-behavior: smooth; }
  .reveal { opacity:0; transform:translateY(20px); transition:all 0.8s cubic-bezier(0.16,1,0.3,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }
  .shimmer { background: linear-gradient(110deg, transparent 30%, rgba(232,184,16,0.08) 50%, transparent 70%); background-size: 200% 100%; animation: shimmer 3s ease-in-out infinite; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .product-card:hover .product-img { transform: scale(1.05); }
</style>
</head>
<body class="bg-lux-950 text-lux-100">

<!-- Navbar -->
<nav class="fixed top-0 w-full bg-lux-950/95 backdrop-blur-md z-50 border-b border-lux-800/50">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="font-serif text-2xl font-semibold tracking-[0.2em] text-gold-400">LUMIÈRE</a>
    <div class="hidden md:flex items-center gap-8 text-xs tracking-[0.15em] uppercase text-lux-400 font-medium">
      <a href="#collections" class="hover:text-gold-400 transition-colors">系列</a>
      <a href="#story" class="hover:text-gold-400 transition-colors">品牌故事</a>
      <a href="#craftsmanship" class="hover:text-gold-400 transition-colors">工藝</a>
      <a href="#bestsellers" class="hover:text-gold-400 transition-colors">暢銷</a>
      <a href="#contact" class="hover:text-gold-400 transition-colors">聯繫</a>
    </div>
    <div class="flex items-center gap-4">
      <button onclick="showToast('購物車功能即將上線')" class="relative text-lux-300 hover:text-gold-400 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        <span class="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 text-lux-950 text-[10px] rounded-full flex items-center justify-center font-bold">0</span>
      </button>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-lux-300">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-lux-950 border-t border-lux-800/50 px-6 py-4 space-y-3">
    <a href="#collections" class="block text-xs tracking-[0.15em] uppercase text-lux-400">系列</a>
    <a href="#story" class="block text-xs tracking-[0.15em] uppercase text-lux-400">品牌故事</a>
    <a href="#craftsmanship" class="block text-xs tracking-[0.15em] uppercase text-lux-400">工藝</a>
    <a href="#bestsellers" class="block text-xs tracking-[0.15em] uppercase text-lux-400">暢銷</a>
    <a href="#contact" class="block text-xs tracking-[0.15em] uppercase text-lux-400">聯繫</a>
  </div>
</nav>

<!-- Hero -->
<section class="pt-16 min-h-screen flex items-center justify-center relative overflow-hidden">
  <div class="absolute inset-0 shimmer"></div>
  <div class="relative text-center px-6 max-w-3xl mx-auto">
    <p class="text-gold-400 text-xs tracking-[0.3em] uppercase mb-6 font-medium">Since 2008 · Taipei</p>
    <h1 class="text-5xl md:text-7xl lg:text-8xl font-serif font-semibold tracking-wide mb-6 leading-tight">
      璀璨<span class="text-gold-400">光芒</span><br>源自匠心
    </h1>
    <p class="text-lux-400 text-lg md:text-xl mb-10 leading-relaxed font-light max-w-xl mx-auto">
      每一件 LUMIÈRE 珠寶，都是時間與熱情的結晶。<br>從設計到鑲嵌，只為點亮你獨一無二的光芒。
    </p>
    <div class="flex flex-wrap justify-center gap-4">
      <a href="#collections" class="bg-gold-500 text-lux-950 px-10 py-3.5 text-sm tracking-[0.1em] uppercase font-medium hover:bg-gold-400 transition-colors">
        探索系列
      </a>
      <a href="#story" class="border border-lux-600 text-lux-300 px-10 py-3.5 text-sm tracking-[0.1em] uppercase font-medium hover:border-gold-500 hover:text-gold-400 transition-colors">
        品牌故事
      </a>
    </div>
  </div>
  <!-- Decorative elements -->
  <div class="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-lux-600">
    <span class="text-xs tracking-widest uppercase">Scroll</span>
    <div class="w-px h-8 bg-gradient-to-b from-lux-600 to-transparent"></div>
  </div>
</section>

<!-- Collections -->
<section id="collections" class="py-24 border-t border-lux-800/50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <p class="text-gold-400 text-xs tracking-[0.3em] uppercase mb-3 font-medium">Collections</p>
      <h2 class="text-4xl md:text-5xl font-serif">經典系列</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="reveal group cursor-pointer">
        <div class="aspect-[3/4] bg-gradient-to-br from-lux-800 to-lux-900 rounded-sm overflow-hidden mb-5 relative">
          <div class="absolute inset-0 flex items-center justify-center text-8xl opacity-80 group-hover:scale-110 transition-transform duration-700">💎</div>
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-lux-950/80 to-transparent p-6">
            <span class="text-gold-400 text-xs tracking-[0.2em] uppercase">New Collection</span>
          </div>
        </div>
        <h3 class="font-serif text-2xl mb-1">Étoile 星芒</h3>
        <p class="text-lux-400 text-sm font-light">以星空為靈感，每顆鑽石如星辰閃耀</p>
      </div>
      <div class="reveal group cursor-pointer">
        <div class="aspect-[3/4] bg-gradient-to-br from-lux-800 to-lux-900 rounded-sm overflow-hidden mb-5 relative">
          <div class="absolute inset-0 flex items-center justify-center text-8xl opacity-80 group-hover:scale-110 transition-transform duration-700">🌹</div>
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-lux-950/80 to-transparent p-6">
            <span class="text-gold-400 text-xs tracking-[0.2em] uppercase">Signature</span>
          </div>
        </div>
        <h3 class="font-serif text-2xl mb-1">Rose Éternelle 永恆玫瑰</h3>
        <p class="text-lux-400 text-sm font-light">玫瑰金與紅寶石的浪漫詩篇</p>
      </div>
      <div class="reveal group cursor-pointer">
        <div class="aspect-[3/4] bg-gradient-to-br from-lux-800 to-lux-900 rounded-sm overflow-hidden mb-5 relative">
          <div class="absolute inset-0 flex items-center justify-center text-8xl opacity-80 group-hover:scale-110 transition-transform duration-700">🌊</div>
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-lux-950/80 to-transparent p-6">
            <span class="text-gold-400 text-xs tracking-[0.2em] uppercase">Limited</span>
          </div>
        </div>
        <h3 class="font-serif text-2xl mb-1">Océan 蔚藍海洋</h3>
        <p class="text-lux-400 text-sm font-light">藍寶石與白金的海洋意象</p>
      </div>
    </div>
  </div>
</section>

<!-- Story -->
<section id="story" class="py-24 border-t border-lux-800/50">
  <div class="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
    <div class="reveal">
      <div class="aspect-square bg-gradient-to-br from-lux-800 to-lux-900 rounded-sm flex items-center justify-center relative overflow-hidden">
        <span class="text-[140px] opacity-60">✨</span>
        <div class="absolute bottom-6 left-6 right-6 text-center">
          <p class="text-gold-400 font-serif text-xl italic">"Every jewel tells a story"</p>
        </div>
      </div>
    </div>
    <div class="reveal">
      <p class="text-gold-400 text-xs tracking-[0.3em] uppercase mb-4 font-medium">Our Story</p>
      <h2 class="text-4xl md:text-5xl font-serif mb-6">源自台北<br>的珠寶世家</h2>
      <p class="text-lux-400 leading-relaxed mb-4 font-light">
        2008 年，珠寶設計師陳玉華女士在台北創立 LUMIÈRE。她相信，真正的奢華不在於價格，而在於作品背後的故事與情感。
      </p>
      <p class="text-lux-400 leading-relaxed mb-6 font-light">
        從一間小小的工作室起步，到今日擁有三家精品店，LUMIÈRE 始終堅持手工鑲嵌、嚴選寶石，為每一位客人打造獨一無二的珍藏。
      </p>
      <div class="grid grid-cols-3 gap-6">
        <div><span class="block font-serif text-3xl text-gold-400">17</span><span class="text-xs text-lux-500 tracking-wider uppercase">年歷史</span></div>
        <div><span class="block font-serif text-3xl text-gold-400">3,000+</span><span class="text-xs text-lux-500 tracking-wider uppercase">件作品</span></div>
        <div><span class="block font-serif text-3xl text-gold-400">GIA</span><span class="text-xs text-lux-500 tracking-wider uppercase">認證寶石</span></div>
      </div>
    </div>
  </div>
</section>

<!-- Craftsmanship -->
<section id="craftsmanship" class="py-24 border-t border-lux-800/50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <p class="text-gold-400 text-xs tracking-[0.3em] uppercase mb-3 font-medium">Craftsmanship</p>
      <h2 class="text-4xl md:text-5xl font-serif">匠心工藝</h2>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="reveal text-center group">
        <div class="w-20 h-20 mx-auto rounded-full border border-gold-500/30 flex items-center justify-center text-3xl mb-4 group-hover:bg-gold-500/10 transition-colors">💎</div>
        <h4 class="font-serif text-lg mb-2">嚴選寶石</h4>
        <p class="text-lux-500 text-sm font-light leading-relaxed">每顆寶石皆附 GIA 或 IGI 國際鑑定證書，確保品質與價值。</p>
      </div>
      <div class="reveal text-center group">
        <div class="w-20 h-20 mx-auto rounded-full border border-gold-500/30 flex items-center justify-center text-3xl mb-4 group-hover:bg-gold-500/10 transition-colors">✏️</div>
        <h4 class="font-serif text-lg mb-2">原創設計</h4>
        <p class="text-lux-500 text-sm font-light leading-relaxed">駐店設計師手繪每一件作品，融合東方美學與當代風格。</p>
      </div>
      <div class="reveal text-center group">
        <div class="w-20 h-20 mx-auto rounded-full border border-gold-500/30 flex items-center justify-center text-3xl mb-4 group-hover:bg-gold-500/10 transition-colors">🔨</div>
        <h4 class="font-serif text-lg mb-2">手工鑲嵌</h4>
        <p class="text-lux-500 text-sm font-light leading-relaxed">資深金工師傅手工鑲嵌，每件作品耗時 40-120 小時。</p>
      </div>
      <div class="reveal text-center group">
        <div class="w-20 h-20 mx-auto rounded-full border border-gold-500/30 flex items-center justify-center text-3xl mb-4 group-hover:bg-gold-500/10 transition-colors">📜</div>
        <h4 class="font-serif text-lg mb-2">終身保養</h4>
        <p class="text-lux-500 text-sm font-light leading-relaxed">免費終身清潔拋光、鬆石檢測，陪伴您一生的承諾。</p>
      </div>
    </div>
  </div>
</section>

<!-- Bestsellers -->
<section id="bestsellers" class="py-24 border-t border-lux-800/50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <p class="text-gold-400 text-xs tracking-[0.3em] uppercase mb-3 font-medium">Bestsellers</p>
      <h2 class="text-4xl md:text-5xl font-serif">人氣珍品</h2>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="reveal product-card group cursor-pointer">
        <div class="aspect-square bg-gradient-to-br from-lux-800 to-lux-900 rounded-sm overflow-hidden mb-4 relative">
          <div class="product-img absolute inset-0 flex items-center justify-center text-6xl transition-transform duration-500">💍</div>
          <div class="absolute top-3 right-3 bg-gold-500 text-lux-950 text-[10px] px-2 py-0.5 tracking-wider uppercase font-medium">Bestseller</div>
        </div>
        <h4 class="font-serif text-lg">Solitaire 經典鑽戒</h4>
        <p class="text-lux-500 text-xs mt-1 font-light">18K 白金 · 0.5ct GIA 鑽石</p>
        <p class="text-gold-400 font-serif text-lg mt-2">NT$ 68,000</p>
      </div>
      <div class="reveal product-card group cursor-pointer">
        <div class="aspect-square bg-gradient-to-br from-lux-800 to-lux-900 rounded-sm overflow-hidden mb-4 relative">
          <div class="product-img absolute inset-0 flex items-center justify-center text-6xl transition-transform duration-500">📿</div>
        </div>
        <h4 class="font-serif text-lg">Rose Pendant 玫瑰墜鍊</h4>
        <p class="text-lux-500 text-xs mt-1 font-light">玫瑰金 · 紅寶石 · 鑽石</p>
        <p class="text-gold-400 font-serif text-lg mt-2">NT$ 42,000</p>
      </div>
      <div class="reveal product-card group cursor-pointer">
        <div class="aspect-square bg-gradient-to-br from-lux-800 to-lux-900 rounded-sm overflow-hidden mb-4 relative">
          <div class="product-img absolute inset-0 flex items-center justify-center text-6xl transition-transform duration-500">✨</div>
        </div>
        <h4 class="font-serif text-lg">Étoile Earrings 星芒耳環</h4>
        <p class="text-lux-500 text-xs mt-1 font-light">18K 金 · 鑽石 0.3ct × 2</p>
        <p class="text-gold-400 font-serif text-lg mt-2">NT$ 35,000</p>
      </div>
      <div class="reveal product-card group cursor-pointer">
        <div class="aspect-square bg-gradient-to-br from-lux-800 to-lux-900 rounded-sm overflow-hidden mb-4 relative">
          <div class="product-img absolute inset-0 flex items-center justify-center text-6xl transition-transform duration-500">💎</div>
          <div class="absolute top-3 right-3 bg-lux-600 text-lux-200 text-[10px] px-2 py-0.5 tracking-wider uppercase font-medium">Limited</div>
        </div>
        <h4 class="font-serif text-lg">Océan Bracelet 海洋手環</h4>
        <p class="text-lux-500 text-xs mt-1 font-light">白金 · 藍寶石 · 鑽石</p>
        <p class="text-gold-400 font-serif text-lg mt-2">NT$ 88,000</p>
      </div>
    </div>
  </div>
</section>

<!-- Bespoke -->
<section class="py-24 border-t border-lux-800/50 bg-lux-900/50">
  <div class="max-w-4xl mx-auto px-6 text-center reveal">
    <p class="text-gold-400 text-xs tracking-[0.3em] uppercase mb-3 font-medium">Bespoke</p>
    <h2 class="text-4xl md:text-5xl font-serif mb-6">訂製服務</h2>
    <p class="text-lux-400 text-lg leading-relaxed mb-8 font-light max-w-2xl mx-auto">
      從求婚鑽戒到結婚對戒，從生日禮物到傳家珍藏。與我們的設計師一對一諮詢，打造獨一無二的珠寶作品。
    </p>
    <div class="grid sm:grid-cols-3 gap-6 mb-10">
      <div class="border border-lux-700 rounded-sm p-6">
        <span class="text-3xl block mb-3">1</span>
        <h4 class="font-serif text-lg mb-2">諮詢設計</h4>
        <p class="text-lux-500 text-sm font-light">了解需求，手繪設計稿，選擇寶石與金屬</p>
      </div>
      <div class="border border-lux-700 rounded-sm p-6">
        <span class="text-3xl block mb-3">2</span>
        <h4 class="font-serif text-lg mb-2">3D 建模</h4>
        <p class="text-lux-500 text-sm font-light">精密 3D 建模確認尺寸，蠟模試戴</p>
      </div>
      <div class="border border-lux-700 rounded-sm p-6">
        <span class="text-3xl block mb-3">3</span>
        <h4 class="font-serif text-lg mb-2">手工製作</h4>
        <p class="text-lux-500 text-sm font-light">匠心鑲嵌拋光，附鑑定證書交付</p>
      </div>
    </div>
    <button onclick="document.getElementById('contact-modal').classList.remove('hidden')" class="bg-gold-500 text-lux-950 px-10 py-3.5 text-sm tracking-[0.1em] uppercase font-medium hover:bg-gold-400 transition-colors">
      預約諮詢
    </button>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-24 border-t border-lux-800/50">
  <div class="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16">
    <div class="reveal">
      <p class="text-gold-400 text-xs tracking-[0.3em] uppercase mb-4 font-medium">Visit Us</p>
      <h2 class="text-4xl font-serif mb-6">歡迎蒞臨</h2>
      <div class="space-y-5">
        <div>
          <h4 class="font-serif text-lg text-gold-400 mb-1">旗艦店 — 信義</h4>
          <p class="text-lux-400 text-sm font-light">台北市信義區松仁路 28 號 1F</p>
          <p class="text-lux-500 text-xs mt-1">週一至週日 11:00 - 21:00</p>
        </div>
        <div>
          <h4 class="font-serif text-lg text-gold-400 mb-1">精品店 — 中山</h4>
          <p class="text-lux-400 text-sm font-light">台北市中山區中山北路二段 68 號</p>
          <p class="text-lux-500 text-xs mt-1">週一至週六 11:00 - 20:00</p>
        </div>
        <div>
          <h4 class="font-serif text-lg text-gold-400 mb-1">工坊 — 大稻埕</h4>
          <p class="text-lux-400 text-sm font-light">台北市大同區迪化街一段 156 號 2F</p>
          <p class="text-lux-500 text-xs mt-1">預約制 · 週三至週日</p>
        </div>
        <div class="pt-4 border-t border-lux-800/50">
          <p class="text-lux-400 text-sm font-light">📞 (02) 2720-8888</p>
          <p class="text-lux-400 text-sm font-light">📧 concierge@lumiere.tw</p>
        </div>
      </div>
    </div>
    <div class="reveal">
      <div class="bg-lux-900 border border-lux-800 rounded-sm p-8">
        <h3 class="font-serif text-2xl mb-2">私人預約</h3>
        <p class="text-lux-500 text-sm font-light mb-6">尊享一對一服務，請留下聯繫方式</p>
        <div class="space-y-4">
          <div><label class="text-xs tracking-wider uppercase text-lux-400 mb-1 block">姓名</label><input type="text" placeholder="您的姓名" class="w-full bg-lux-800 border border-lux-700 rounded-sm px-4 py-2.5 text-sm text-lux-100 placeholder-lux-600 focus:border-gold-500 outline-none"></div>
          <div><label class="text-xs tracking-wider uppercase text-lux-400 mb-1 block">電話</label><input type="tel" placeholder="09xx-xxx-xxx" class="w-full bg-lux-800 border border-lux-700 rounded-sm px-4 py-2.5 text-sm text-lux-100 placeholder-lux-600 focus:border-gold-500 outline-none"></div>
          <div><label class="text-xs tracking-wider uppercase text-lux-400 mb-1 block">需求</label>
            <select class="w-full bg-lux-800 border border-lux-700 rounded-sm px-4 py-2.5 text-sm text-lux-100 focus:border-gold-500 outline-none">
              <option>訂製珠寶</option><option>求婚鑽戒</option><option>結婚對戒</option><option>禮品選購</option><option>寶石鑑定</option><option>保養維修</option>
            </select>
          </div>
          <div><label class="text-xs tracking-wider uppercase text-lux-400 mb-1 block">備註</label><textarea rows="2" placeholder="任何想說的..." class="w-full bg-lux-800 border border-lux-700 rounded-sm px-4 py-2.5 text-sm text-lux-100 placeholder-lux-600 focus:border-gold-500 outline-none resize-none"></textarea></div>
          <button onclick="showToast('已收到您的預約，專人將於 24 小時內回覆')" class="w-full bg-gold-500 text-lux-950 py-3 text-sm tracking-[0.1em] uppercase font-medium hover:bg-gold-400 transition-colors">送出預約</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-lux-800/50 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex flex-col md:flex-row justify-between items-center gap-6">
      <span class="font-serif text-xl tracking-[0.2em] text-gold-400">LUMIÈRE</span>
      <p class="text-lux-600 text-xs tracking-wider">© 2026 LUMIÈRE Joaillerie. All rights reserved.</p>
    </div>
  </div>
</footer>

<!-- Contact Modal -->
<div id="contact-modal" class="hidden fixed inset-0 z-[60] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="this.parentElement.classList.add('hidden')"></div>
  <div class="relative bg-lux-900 border border-lux-700 rounded-sm p-8 max-w-md w-full shadow-2xl">
    <button onclick="this.closest('#contact-modal').classList.add('hidden')" class="absolute top-4 right-4 text-lux-500 hover:text-lux-300 transition-colors text-xl">✕</button>
    <h3 class="font-serif text-2xl mb-2">訂製諮詢</h3>
    <p class="text-lux-500 text-sm font-light mb-6">留下資訊，設計師將親自與您聯繫</p>
    <div class="space-y-4">
      <input type="text" placeholder="姓名" class="w-full bg-lux-800 border border-lux-700 rounded-sm px-4 py-2.5 text-sm text-lux-100 placeholder-lux-600 focus:border-gold-500 outline-none">
      <input type="tel" placeholder="電話" class="w-full bg-lux-800 border border-lux-700 rounded-sm px-4 py-2.5 text-sm text-lux-100 placeholder-lux-600 focus:border-gold-500 outline-none">
      <textarea rows="3" placeholder="描述您的訂製需求..." class="w-full bg-lux-800 border border-lux-700 rounded-sm px-4 py-2.5 text-sm text-lux-100 placeholder-lux-600 focus:border-gold-500 outline-none resize-none"></textarea>
      <button onclick="showToast('諮詢預約已送出，我們會在 24 小時內回覆');this.closest('#contact-modal').classList.add('hidden')" class="w-full bg-gold-500 text-lux-950 py-3 text-sm tracking-[0.1em] uppercase font-medium hover:bg-gold-400 transition-colors">送出</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-gold-500 text-lux-950 px-6 py-3 rounded-sm shadow-2xl text-sm font-medium translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"></div>

<script>
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),2500);}
const obs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:0.15});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',()=>{document.getElementById('mobile-menu').classList.add('hidden');});});
</script>
</body>
</html>
$HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
