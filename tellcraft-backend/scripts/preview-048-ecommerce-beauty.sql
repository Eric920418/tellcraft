INSERT INTO template_previews (template_id, html_content, version)
VALUES ('678bc311-9132-4f1f-a65b-9fd7f6e28204', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ROSÉ BEAUTY 玫瑰美妝</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{rose:'#e11d73',blush:'#fdf2f8',cream:'#fef7f0',gold:'#c9a96e',nude:'#d4a59a',dark:'#1a1a1a'},fontFamily:{display:['Cormorant Garamond','serif'],body:['DM Sans','sans-serif']}}}}
</script>
<style>
body{font-family:'DM Sans',sans-serif}
html{scroll-behavior:smooth}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.shimmer{background:linear-gradient(110deg,transparent 40%,rgba(255,255,255,0.4) 50%,transparent 60%);background-size:200% 100%;animation:shimmer 3s infinite}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.product-card:hover .product-img{transform:scale(1.05)}
.product-img{transition:transform 0.5s cubic-bezier(0.4,0,0.2,1)}
</style>
</head>
<body class="bg-cream text-dark overflow-x-hidden">

<!-- Promo Bar -->
<div class="bg-rose text-white text-center py-2 text-xs tracking-wider font-medium">
  🌸 新會員首購 85 折｜滿 $1,500 免運｜輸入 ROSE15 再折 $150 🌸
</div>

<!-- Nav -->
<nav class="sticky top-0 bg-cream/95 backdrop-blur-sm z-50 border-b border-rose/10">
  <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <div>
      <div class="font-display text-2xl font-bold text-rose tracking-wider">ROSÉ</div>
      <div class="text-[9px] tracking-[0.4em] text-nude uppercase">Beauty & Skincare</div>
    </div>
    <div class="hidden md:flex items-center gap-8 text-sm">
      <a href="#new" class="text-dark/70 hover:text-rose transition-colors cursor-pointer">新品</a>
      <a href="#skincare" class="text-dark/70 hover:text-rose transition-colors cursor-pointer">保養</a>
      <a href="#makeup" class="text-dark/70 hover:text-rose transition-colors cursor-pointer">彩妝</a>
      <a href="#sets" class="text-dark/70 hover:text-rose transition-colors cursor-pointer">禮盒組</a>
      <a href="#reviews" class="text-dark/70 hover:text-rose transition-colors cursor-pointer">口碑</a>
    </div>
    <div class="flex items-center gap-4">
      <button class="text-dark/70 hover:text-rose transition-colors cursor-pointer">🔍</button>
      <button class="text-dark/70 hover:text-rose transition-colors cursor-pointer">♡</button>
      <button onclick="document.getElementById('cartModal').classList.remove('hidden')" class="relative text-dark/70 hover:text-rose transition-colors cursor-pointer">
        🛒
        <span id="cartCount" class="absolute -top-1.5 -right-2 bg-rose text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
      </button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="relative py-16 md:py-24 overflow-hidden">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <div class="reveal">
        <div class="inline-block bg-rose/10 text-rose text-xs font-bold px-3 py-1.5 rounded-full mb-6">NEW ARRIVAL 2026 春夏</div>
        <h1 class="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-dark leading-tight mb-6">
          綻放你的<br>
          <span class="text-rose italic">天然光采</span>
        </h1>
        <p class="text-dark/50 leading-relaxed mb-8 max-w-md">
          以純淨植萃配方，喚醒肌膚與生俱來的光澤。不只是保養，更是一種寵愛自己的生活儀式。
        </p>
        <div class="flex gap-4">
          <a href="#new" class="bg-rose text-white px-8 py-3.5 rounded-full text-sm font-bold hover:bg-pink-700 transition-all shadow-lg shadow-rose/20 cursor-pointer">探索新品</a>
          <a href="#sets" class="border border-dark/20 text-dark/70 px-8 py-3.5 rounded-full text-sm font-bold hover:border-rose hover:text-rose transition-all cursor-pointer">限定禮盒</a>
        </div>
      </div>
      <div class="relative reveal">
        <div class="bg-gradient-to-br from-blush to-rose/10 rounded-[3rem] aspect-square flex items-center justify-center relative overflow-hidden">
          <div class="text-center">
            <div class="w-32 h-40 bg-gradient-to-b from-rose/20 to-rose/40 rounded-full mx-auto mb-4 shimmer"></div>
            <div class="w-20 h-28 bg-gradient-to-b from-gold/30 to-gold/50 rounded-lg mx-auto absolute bottom-12 right-16 rotate-12 shimmer"></div>
            <div class="w-16 h-24 bg-gradient-to-b from-nude/40 to-nude/60 rounded-lg mx-auto absolute top-16 left-16 -rotate-12 shimmer"></div>
          </div>
          <div class="absolute bottom-6 left-6 bg-white rounded-2xl px-4 py-3 shadow-lg">
            <div class="flex items-center gap-2">
              <div class="flex -space-x-1.5">
                <div class="w-6 h-6 bg-rose/30 rounded-full border-2 border-white"></div>
                <div class="w-6 h-6 bg-gold/40 rounded-full border-2 border-white"></div>
                <div class="w-6 h-6 bg-nude/50 rounded-full border-2 border-white"></div>
              </div>
              <div class="text-xs"><span class="font-bold">12,000+</span> <span class="text-dark/40">好評</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Categories -->
<section class="py-12 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-blush rounded-2xl p-6 text-center cursor-pointer hover:shadow-lg transition-all reveal group">
        <div class="text-3xl mb-3 group-hover:scale-110 transition-transform">💧</div>
        <h3 class="font-bold text-sm">保濕系列</h3>
        <p class="text-dark/40 text-xs mt-1">32 件商品</p>
      </div>
      <div class="bg-rose/5 rounded-2xl p-6 text-center cursor-pointer hover:shadow-lg transition-all reveal group" style="transition-delay:0.05s">
        <div class="text-3xl mb-3 group-hover:scale-110 transition-transform">✨</div>
        <h3 class="font-bold text-sm">美白亮膚</h3>
        <p class="text-dark/40 text-xs mt-1">28 件商品</p>
      </div>
      <div class="bg-amber-50 rounded-2xl p-6 text-center cursor-pointer hover:shadow-lg transition-all reveal group" style="transition-delay:0.1s">
        <div class="text-3xl mb-3 group-hover:scale-110 transition-transform">💄</div>
        <h3 class="font-bold text-sm">彩妝系列</h3>
        <p class="text-dark/40 text-xs mt-1">45 件商品</p>
      </div>
      <div class="bg-green-50 rounded-2xl p-6 text-center cursor-pointer hover:shadow-lg transition-all reveal group" style="transition-delay:0.15s">
        <div class="text-3xl mb-3 group-hover:scale-110 transition-transform">🌿</div>
        <h3 class="font-bold text-sm">有機純淨</h3>
        <p class="text-dark/40 text-xs mt-1">18 件商品</p>
      </div>
    </div>
  </div>
</section>

<!-- New Arrivals -->
<section id="new" class="py-20 bg-cream">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <div class="text-rose text-xs tracking-[0.3em] uppercase font-bold mb-2">New Arrivals</div>
      <h2 class="font-display text-3xl md:text-4xl font-bold">春夏新品</h2>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-6" id="productGrid">
      <div class="product-card bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all reveal group cursor-pointer">
        <div class="relative aspect-square bg-gradient-to-br from-blush to-rose/10 overflow-hidden flex items-center justify-center">
          <div class="product-img w-16 h-24 bg-gradient-to-b from-rose/30 to-rose/50 rounded-xl"></div>
          <div class="absolute top-3 left-3 bg-rose text-white text-[10px] font-bold px-2 py-1 rounded-full">NEW</div>
          <button onclick="event.stopPropagation();toggleWishlist(this)" class="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-sm hover:bg-white transition-colors cursor-pointer">♡</button>
        </div>
        <div class="p-4">
          <p class="text-dark/40 text-xs mb-1">保養 · 精華液</p>
          <h3 class="font-bold text-sm mb-2">玫瑰光采精華 30ml</h3>
          <div class="flex items-center justify-between">
            <div>
              <span class="font-bold text-rose">$1,680</span>
            </div>
            <button onclick="event.stopPropagation();addToCart('玫瑰光采精華',1680)" class="w-8 h-8 bg-rose/10 rounded-full flex items-center justify-center text-rose text-sm hover:bg-rose hover:text-white transition-colors cursor-pointer">+</button>
          </div>
        </div>
      </div>
      <div class="product-card bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all reveal group cursor-pointer" style="transition-delay:0.05s">
        <div class="relative aspect-square bg-gradient-to-br from-amber-50 to-gold/10 overflow-hidden flex items-center justify-center">
          <div class="product-img w-14 h-20 bg-gradient-to-b from-gold/30 to-gold/50 rounded-lg"></div>
          <button onclick="event.stopPropagation();toggleWishlist(this)" class="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-sm hover:bg-white transition-colors cursor-pointer">♡</button>
        </div>
        <div class="p-4">
          <p class="text-dark/40 text-xs mb-1">保養 · 乳霜</p>
          <h3 class="font-bold text-sm mb-2">蜂蜜修護面霜 50ml</h3>
          <div class="flex items-center justify-between">
            <div>
              <span class="text-dark/30 line-through text-xs mr-1">$2,200</span>
              <span class="font-bold text-rose">$1,880</span>
            </div>
            <button onclick="event.stopPropagation();addToCart('蜂蜜修護面霜',1880)" class="w-8 h-8 bg-rose/10 rounded-full flex items-center justify-center text-rose text-sm hover:bg-rose hover:text-white transition-colors cursor-pointer">+</button>
          </div>
        </div>
      </div>
      <div class="product-card bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all reveal group cursor-pointer" style="transition-delay:0.1s">
        <div class="relative aspect-square bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden flex items-center justify-center">
          <div class="product-img w-12 h-18 bg-gradient-to-b from-emerald-200/40 to-emerald-300/50 rounded-lg"></div>
          <div class="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">有機</div>
          <button onclick="event.stopPropagation();toggleWishlist(this)" class="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-sm hover:bg-white transition-colors cursor-pointer">♡</button>
        </div>
        <div class="p-4">
          <p class="text-dark/40 text-xs mb-1">保養 · 化妝水</p>
          <h3 class="font-bold text-sm mb-2">茶樹淨膚化妝水 200ml</h3>
          <div class="flex items-center justify-between">
            <span class="font-bold text-rose">$980</span>
            <button onclick="event.stopPropagation();addToCart('茶樹淨膚化妝水',980)" class="w-8 h-8 bg-rose/10 rounded-full flex items-center justify-center text-rose text-sm hover:bg-rose hover:text-white transition-colors cursor-pointer">+</button>
          </div>
        </div>
      </div>
      <div class="product-card bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all reveal group cursor-pointer" style="transition-delay:0.15s">
        <div class="relative aspect-square bg-gradient-to-br from-rose/5 to-blush overflow-hidden flex items-center justify-center">
          <div class="product-img w-20 h-6 bg-gradient-to-r from-rose/30 via-nude/40 to-gold/30 rounded-full"></div>
          <div class="absolute top-3 left-3 bg-dark text-white text-[10px] font-bold px-2 py-1 rounded-full">HOT</div>
          <button onclick="event.stopPropagation();toggleWishlist(this)" class="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-sm hover:bg-white transition-colors cursor-pointer">♡</button>
        </div>
        <div class="p-4">
          <p class="text-dark/40 text-xs mb-1">彩妝 · 唇膏</p>
          <h3 class="font-bold text-sm mb-2">絲絨霧感唇膏 #03 裸粉</h3>
          <div class="flex items-center justify-between">
            <span class="font-bold text-rose">$880</span>
            <button onclick="event.stopPropagation();addToCart('絲絨霧感唇膏',880)" class="w-8 h-8 bg-rose/10 rounded-full flex items-center justify-center text-rose text-sm hover:bg-rose hover:text-white transition-colors cursor-pointer">+</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Bestsellers with Skincare Routine -->
<section id="skincare" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <div class="text-rose text-xs tracking-[0.3em] uppercase font-bold mb-2">Skincare Routine</div>
      <h2 class="font-display text-3xl md:text-4xl font-bold">完美保養步驟</h2>
      <p class="text-dark/40 mt-3 max-w-md mx-auto text-sm">跟著 ROSÉ 的保養哲學，四步驟打造水潤透亮肌</p>
    </div>
    <div class="grid md:grid-cols-4 gap-6">
      <div class="text-center reveal group cursor-pointer">
        <div class="relative">
          <div class="w-24 h-24 bg-sky-50 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">💧</div>
          <div class="absolute -top-1 -right-1 w-8 h-8 bg-rose text-white rounded-full flex items-center justify-center text-xs font-black">1</div>
        </div>
        <h3 class="font-bold mb-1">潔淨</h3>
        <p class="text-dark/40 text-xs">溫和胺基酸潔顏<br>帶走髒污不緊繃</p>
        <p class="text-rose text-sm font-bold mt-2">$680</p>
        <button onclick="addToCart('胺基酸潔顏乳',680)" class="mt-2 text-xs bg-rose/10 text-rose px-4 py-1.5 rounded-full hover:bg-rose hover:text-white transition-colors cursor-pointer font-bold">加入購物車</button>
      </div>
      <div class="text-center reveal group cursor-pointer" style="transition-delay:0.1s">
        <div class="relative">
          <div class="w-24 h-24 bg-blue-50 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🧪</div>
          <div class="absolute -top-1 -right-1 w-8 h-8 bg-rose text-white rounded-full flex items-center justify-center text-xs font-black">2</div>
        </div>
        <h3 class="font-bold mb-1">調理</h3>
        <p class="text-dark/40 text-xs">玻尿酸化妝水<br>補水打底鎖住水分</p>
        <p class="text-rose text-sm font-bold mt-2">$880</p>
        <button onclick="addToCart('玻尿酸化妝水',880)" class="mt-2 text-xs bg-rose/10 text-rose px-4 py-1.5 rounded-full hover:bg-rose hover:text-white transition-colors cursor-pointer font-bold">加入購物車</button>
      </div>
      <div class="text-center reveal group cursor-pointer" style="transition-delay:0.2s">
        <div class="relative">
          <div class="w-24 h-24 bg-rose/10 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">✨</div>
          <div class="absolute -top-1 -right-1 w-8 h-8 bg-rose text-white rounded-full flex items-center justify-center text-xs font-black">3</div>
        </div>
        <h3 class="font-bold mb-1">修護</h3>
        <p class="text-dark/40 text-xs">玫瑰光采精華<br>深層滲透亮膚修護</p>
        <p class="text-rose text-sm font-bold mt-2">$1,680</p>
        <button onclick="addToCart('玫瑰光采精華',1680)" class="mt-2 text-xs bg-rose/10 text-rose px-4 py-1.5 rounded-full hover:bg-rose hover:text-white transition-colors cursor-pointer font-bold">加入購物車</button>
      </div>
      <div class="text-center reveal group cursor-pointer" style="transition-delay:0.3s">
        <div class="relative">
          <div class="w-24 h-24 bg-amber-50 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🌙</div>
          <div class="absolute -top-1 -right-1 w-8 h-8 bg-rose text-white rounded-full flex items-center justify-center text-xs font-black">4</div>
        </div>
        <h3 class="font-bold mb-1">滋養</h3>
        <p class="text-dark/40 text-xs">蜂蜜修護面霜<br>封存養分整夜修復</p>
        <p class="text-rose text-sm font-bold mt-2">$1,880</p>
        <button onclick="addToCart('蜂蜜修護面霜',1880)" class="mt-2 text-xs bg-rose/10 text-rose px-4 py-1.5 rounded-full hover:bg-rose hover:text-white transition-colors cursor-pointer font-bold">加入購物車</button>
      </div>
    </div>
    <div class="text-center mt-10 reveal">
      <button onclick="addToCart('完美四步驟保養組',4580)" class="bg-rose text-white px-10 py-4 rounded-full font-bold hover:bg-pink-700 transition-all shadow-lg shadow-rose/20 cursor-pointer">
        一次帶走完美四步驟 — <span class="line-through opacity-70">$5,120</span> $4,580
      </button>
    </div>
  </div>
</section>

<!-- Gift Sets -->
<section id="sets" class="py-20 bg-gradient-to-b from-blush to-cream">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <div class="text-rose text-xs tracking-[0.3em] uppercase font-bold mb-2">Gift Sets</div>
      <h2 class="font-display text-3xl md:text-4xl font-bold">春日限定禮盒</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all reveal group cursor-pointer">
        <div class="aspect-[4/3] bg-gradient-to-br from-blush to-rose/20 flex items-center justify-center relative overflow-hidden">
          <div class="flex gap-3">
            <div class="w-8 h-14 bg-rose/30 rounded-md shimmer"></div>
            <div class="w-8 h-16 bg-rose/40 rounded-md shimmer"></div>
            <div class="w-8 h-12 bg-rose/25 rounded-md shimmer"></div>
          </div>
          <div class="absolute top-4 right-4 bg-rose text-white text-xs font-bold px-3 py-1 rounded-full">限量</div>
        </div>
        <div class="p-6">
          <h3 class="font-bold text-lg mb-1">春日花語禮盒</h3>
          <p class="text-dark/40 text-xs mb-3">精華 + 面霜 + 唇膏 三件組</p>
          <div class="flex items-center justify-between">
            <div>
              <span class="text-dark/30 line-through text-sm">$4,440</span>
              <span class="text-rose font-bold text-lg ml-2">$3,580</span>
            </div>
            <button onclick="addToCart('春日花語禮盒',3580)" class="bg-rose text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-pink-700 transition-colors cursor-pointer">加入</button>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all reveal group cursor-pointer" style="transition-delay:0.1s">
        <div class="aspect-[4/3] bg-gradient-to-br from-amber-50 to-gold/10 flex items-center justify-center relative overflow-hidden">
          <div class="flex gap-3">
            <div class="w-10 h-14 bg-gold/30 rounded-md shimmer"></div>
            <div class="w-10 h-18 bg-gold/40 rounded-md shimmer"></div>
          </div>
          <div class="absolute top-4 right-4 bg-gold text-white text-xs font-bold px-3 py-1 rounded-full">經典</div>
        </div>
        <div class="p-6">
          <h3 class="font-bold text-lg mb-1">蜜光奢養禮盒</h3>
          <p class="text-dark/40 text-xs mb-3">潔顏 + 化妝水 + 面霜 三件組</p>
          <div class="flex items-center justify-between">
            <div>
              <span class="text-dark/30 line-through text-sm">$3,440</span>
              <span class="text-rose font-bold text-lg ml-2">$2,780</span>
            </div>
            <button onclick="addToCart('蜜光奢養禮盒',2780)" class="bg-rose text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-pink-700 transition-colors cursor-pointer">加入</button>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all reveal group cursor-pointer" style="transition-delay:0.2s">
        <div class="aspect-[4/3] bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center relative overflow-hidden">
          <div class="flex gap-2">
            <div class="w-8 h-12 bg-emerald-200/40 rounded-md shimmer"></div>
            <div class="w-8 h-14 bg-emerald-200/50 rounded-md shimmer"></div>
            <div class="w-8 h-10 bg-emerald-200/30 rounded-md shimmer"></div>
            <div class="w-8 h-12 bg-emerald-200/40 rounded-md shimmer"></div>
          </div>
          <div class="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">超值</div>
        </div>
        <div class="p-6">
          <h3 class="font-bold text-lg mb-1">純淨完整組</h3>
          <p class="text-dark/40 text-xs mb-3">全四步驟 + 面膜5入 + 化妝包</p>
          <div class="flex items-center justify-between">
            <div>
              <span class="text-dark/30 line-through text-sm">$6,500</span>
              <span class="text-rose font-bold text-lg ml-2">$4,980</span>
            </div>
            <button onclick="addToCart('純淨完整組',4980)" class="bg-rose text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-pink-700 transition-colors cursor-pointer">加入</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Reviews -->
<section id="reviews" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <div class="text-rose text-xs tracking-[0.3em] uppercase font-bold mb-2">Reviews</div>
      <h2 class="font-display text-3xl md:text-4xl font-bold">真實口碑</h2>
      <div class="flex items-center justify-center gap-2 mt-4">
        <div class="flex text-rose">★★★★★</div>
        <span class="text-sm text-dark/40">4.9 / 5（12,387 則評價）</span>
      </div>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="bg-blush rounded-2xl p-6 reveal">
        <div class="flex text-rose text-sm mb-3">★★★★★</div>
        <p class="text-dark/70 text-sm leading-relaxed mb-4">「用了玫瑰精華兩週，朋友都問我是不是去做了什麼醫美，皮膚真的變透亮了！而且味道好舒服，每天保養都是享受。」</p>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-rose/20 rounded-full flex items-center justify-center text-xs">🌸</div>
          <div>
            <div class="font-bold text-xs">Amber L.</div>
            <div class="text-dark/30 text-xs">已購入：玫瑰光采精華</div>
          </div>
        </div>
      </div>
      <div class="bg-amber-50 rounded-2xl p-6 reveal" style="transition-delay:0.1s">
        <div class="flex text-rose text-sm mb-3">★★★★★</div>
        <p class="text-dark/70 text-sm leading-relaxed mb-4">「蜂蜜面霜質地很特別，不黏膩但超滋潤。冬天用也不會乾，隔天起床臉摸起來嫩嫩的，回購第三罐了。」</p>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center text-xs">🍯</div>
          <div>
            <div class="font-bold text-xs">小雨</div>
            <div class="text-dark/30 text-xs">已購入：蜂蜜修護面霜</div>
          </div>
        </div>
      </div>
      <div class="bg-green-50 rounded-2xl p-6 reveal" style="transition-delay:0.2s">
        <div class="flex text-rose text-sm mb-3">★★★★★</div>
        <p class="text-dark/70 text-sm leading-relaxed mb-4">「敏感肌找好久終於找到適合的品牌。茶樹化妝水用了不刺激，痘痘慢慢消了。包裝也很美，送禮很有面子。」</p>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-xs">🌿</div>
          <div>
            <div class="font-bold text-xs">Tracy W.</div>
            <div class="text-dark/30 text-xs">已購入：純淨完整組</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Newsletter -->
<section class="py-16 bg-gradient-to-r from-rose to-pink-600 text-white">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <h2 class="font-display text-3xl font-bold mb-3">加入 ROSÉ Family 🌹</h2>
    <p class="text-white/70 mb-8 text-sm">訂閱電子報，搶先獲得新品資訊、獨家優惠、美妝教學</p>
    <div class="flex gap-3 max-w-md mx-auto">
      <input type="email" placeholder="輸入 Email" class="flex-1 px-5 py-3.5 rounded-full text-dark text-sm focus:outline-none">
      <button onclick="showToast('歡迎加入 ROSÉ Family！首購 85 折優惠碼已寄出 💌')" class="bg-dark text-white px-6 py-3.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap">訂閱</button>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-dark text-white py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid md:grid-cols-4 gap-8 mb-8">
      <div>
        <div class="font-display text-xl font-bold text-rose mb-3">ROSÉ</div>
        <p class="text-white/40 text-xs leading-relaxed">以純淨植萃配方，綻放你的天然光采。</p>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-3">購物指南</h4>
        <div class="space-y-2 text-white/40 text-xs">
          <p class="hover:text-rose transition-colors cursor-pointer">新品上市</p>
          <p class="hover:text-rose transition-colors cursor-pointer">暢銷排行</p>
          <p class="hover:text-rose transition-colors cursor-pointer">禮盒專區</p>
          <p class="hover:text-rose transition-colors cursor-pointer">會員優惠</p>
        </div>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-3">顧客服務</h4>
        <div class="space-y-2 text-white/40 text-xs">
          <p class="hover:text-rose transition-colors cursor-pointer">訂單查詢</p>
          <p class="hover:text-rose transition-colors cursor-pointer">退換貨政策</p>
          <p class="hover:text-rose transition-colors cursor-pointer">常見問題</p>
          <p class="hover:text-rose transition-colors cursor-pointer">聯絡客服</p>
        </div>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-3">關注我們</h4>
        <div class="flex gap-3">
          <div class="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-sm hover:bg-rose transition-colors cursor-pointer">📷</div>
          <div class="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-sm hover:bg-rose transition-colors cursor-pointer">📘</div>
          <div class="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-sm hover:bg-rose transition-colors cursor-pointer">💬</div>
        </div>
      </div>
    </div>
    <div class="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-white/30 text-xs">© 2026 ROSÉ BEAUTY. All rights reserved.</p>
      <div class="flex gap-4 text-white/30 text-xs">
        <span class="cursor-pointer hover:text-white/60">隱私政策</span>
        <span class="cursor-pointer hover:text-white/60">服務條款</span>
      </div>
    </div>
  </div>
</footer>

<!-- Cart Modal -->
<div id="cartModal" class="hidden fixed inset-0 bg-black/50 z-50 flex justify-end" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="bg-white w-full max-w-md h-full overflow-y-auto p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="font-bold text-lg">🛒 購物車</h3>
      <button onclick="document.getElementById('cartModal').classList.add('hidden')" class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 cursor-pointer">✕</button>
    </div>
    <div id="cartItems" class="space-y-4 mb-6"></div>
    <div id="cartEmpty" class="text-center py-12 text-dark/30">
      <div class="text-4xl mb-3">🛒</div>
      <p>購物車是空的</p>
    </div>
    <div id="cartSummary" class="hidden border-t border-gray-200 pt-4">
      <div class="flex justify-between mb-2 text-sm"><span class="text-dark/50">小計</span><span id="cartSubtotal" class="font-bold">$0</span></div>
      <div class="flex justify-between mb-4 text-sm"><span class="text-dark/50">運費</span><span class="text-emerald-500 font-bold">免運</span></div>
      <button onclick="showToast('結帳功能開發中，敬請期待！');document.getElementById('cartModal').classList.add('hidden')" class="w-full bg-rose text-white py-3.5 rounded-full font-bold hover:bg-pink-700 transition-colors cursor-pointer">前往結帳</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 bg-dark text-white px-6 py-3.5 rounded-2xl shadow-2xl z-[60] translate-y-20 opacity-0 transition-all duration-500 text-sm font-medium"></div>

<script>
let cart=[];
function addToCart(name,price){
  const existing=cart.find(i=>i.name===name);
  if(existing){existing.qty++}
  else{cart.push({name,price,qty:1})}
  updateCart();
  showToast(`已加入 ${name} 🛒`);
}
function removeFromCart(idx){cart.splice(idx,1);updateCart()}
function updateCart(){
  document.getElementById('cartCount').textContent=cart.reduce((s,i)=>s+i.qty,0);
  const items=document.getElementById('cartItems');
  const empty=document.getElementById('cartEmpty');
  const summary=document.getElementById('cartSummary');
  if(cart.length===0){items.innerHTML='';empty.classList.remove('hidden');summary.classList.add('hidden');return}
  empty.classList.add('hidden');summary.classList.remove('hidden');
  items.innerHTML=cart.map((item,i)=>`
    <div class="flex items-center gap-4 bg-gray-50 rounded-xl p-3">
      <div class="w-12 h-12 bg-rose/10 rounded-lg flex items-center justify-center text-lg">🧴</div>
      <div class="flex-1">
        <div class="font-bold text-sm">${item.name}</div>
        <div class="text-rose text-sm font-bold">$${item.price.toLocaleString()} × ${item.qty}</div>
      </div>
      <button onclick="removeFromCart(${i})" class="text-dark/30 hover:text-rose cursor-pointer">✕</button>
    </div>
  `).join('');
  document.getElementById('cartSubtotal').textContent='$'+cart.reduce((s,i)=>s+i.price*i.qty,0).toLocaleString();
}
function toggleWishlist(btn){btn.textContent=btn.textContent==='♡'?'♥':'♡';btn.classList.toggle('text-rose')}
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
