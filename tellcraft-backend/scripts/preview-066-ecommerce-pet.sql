INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'c0977dd8-bfe2-4df6-a817-9e0161e69a3c',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>毛孩星球 PetPlanet</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{primary:'#f97316',primaryLight:'#fb923c',warm:'#fef3c7',bark:'#78350f',sky:'#0ea5e9',mint:'#10b981',rose:'#f43f5e'},fontFamily:{sans:['Nunito','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Nunito',sans-serif;background:#fffbf5;color:#1c1917}
.paw{display:inline-block;transform:rotate(-15deg)}
.product-card{transition:all .25s}
.product-card:hover{transform:translateY(-6px);box-shadow:0 12px 24px rgba(249,115,22,.15)}
.cat-btn{transition:all .2s}
.cat-btn:hover,.cat-btn.active{background:#f97316;color:white;border-color:#f97316}
.fade-up{opacity:0;transform:translateY(20px);transition:all .5s}
.fade-up.visible{opacity:1;transform:translateY(0)}
.cart-badge{position:absolute;top:-6px;right:-6px;background:#f43f5e;color:white;font-size:10px;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700}
.toast{position:fixed;bottom:24px;right:24px;background:#10b981;color:white;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;z-index:999;transform:translateY(100px);opacity:0;transition:all .3s}
.toast.show{transform:translateY(0);opacity:1}
</style>
</head>
<body>
<!-- Header -->
<header class="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-orange-100">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-2xl">🐾</span>
      <span class="font-extrabold text-xl text-bark">PetPlanet</span>
    </div>
    <nav class="hidden md:flex items-center gap-6 text-sm font-semibold text-stone-600">
      <a href="#products" class="hover:text-primary transition">商品</a>
      <a href="#categories" class="hover:text-primary transition">分類</a>
      <a href="#knowledge" class="hover:text-primary transition">毛孩知識</a>
      <a href="#about" class="hover:text-primary transition">關於我們</a>
    </nav>
    <div class="flex items-center gap-4">
      <div class="relative cursor-pointer" id="cartIcon">
        <svg width="22" height="22" fill="none" stroke="#78350f" stroke-width="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
        <div class="cart-badge" id="cartCount">0</div>
      </div>
    </div>
  </div>
</header>

<!-- Hero -->
<section class="relative overflow-hidden bg-gradient-to-br from-warm via-orange-50 to-white py-20">
  <div class="max-w-6xl mx-auto px-6 flex items-center">
    <div class="flex-1">
      <div class="inline-block bg-primary/10 text-primary text-sm font-bold px-4 py-1.5 rounded-full mb-4">🐶 新會員首購 85 折</div>
      <h1 class="text-5xl font-extrabold leading-tight mb-4 text-bark">給毛孩最好的<br><span class="text-primary">幸福生活</span></h1>
      <p class="text-lg text-stone-500 mb-8 max-w-md">嚴選全球頂級寵物用品，從營養飼料到舒適窩墊，讓每一位毛孩家人都能享受最棒的呵護。</p>
      <div class="flex gap-3">
        <a href="#products" class="bg-primary text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-primaryLight transition shadow-lg shadow-primary/30">立即選購</a>
        <a href="#knowledge" class="bg-white text-bark font-bold px-8 py-3.5 rounded-2xl border-2 border-bark/20 hover:border-primary hover:text-primary transition">毛孩指南</a>
      </div>
    </div>
    <div class="flex-1 text-center text-[120px] leading-none hidden md:block">🐕🐈</div>
  </div>
</section>

<!-- Categories -->
<section id="categories" class="py-16 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-3xl font-extrabold text-center mb-10">商品分類</h2>
    <div class="grid grid-cols-6 gap-4">
      <div class="text-center p-4 bg-orange-50 rounded-2xl hover:bg-orange-100 transition cursor-pointer">
        <div class="text-4xl mb-2">🍖</div><div class="text-sm font-bold text-bark">飼料</div>
      </div>
      <div class="text-center p-4 bg-sky-50 rounded-2xl hover:bg-sky-100 transition cursor-pointer">
        <div class="text-4xl mb-2">🧸</div><div class="text-sm font-bold text-bark">玩具</div>
      </div>
      <div class="text-center p-4 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition cursor-pointer">
        <div class="text-4xl mb-2">🛏️</div><div class="text-sm font-bold text-bark">窩墊</div>
      </div>
      <div class="text-center p-4 bg-rose-50 rounded-2xl hover:bg-rose-100 transition cursor-pointer">
        <div class="text-4xl mb-2">🧴</div><div class="text-sm font-bold text-bark">清潔</div>
      </div>
      <div class="text-center p-4 bg-violet-50 rounded-2xl hover:bg-violet-100 transition cursor-pointer">
        <div class="text-4xl mb-2">👔</div><div class="text-sm font-bold text-bark">服飾</div>
      </div>
      <div class="text-center p-4 bg-amber-50 rounded-2xl hover:bg-amber-100 transition cursor-pointer">
        <div class="text-4xl mb-2">💊</div><div class="text-sm font-bold text-bark">保健</div>
      </div>
    </div>
  </div>
</section>

<!-- Products -->
<section id="products" class="py-16 bg-stone-50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-3xl font-extrabold">熱銷商品</h2>
      <div class="flex gap-2">
        <button class="cat-btn active border-2 border-primary bg-primary text-white text-sm font-bold px-4 py-1.5 rounded-full" onclick="filterProducts('all',this)">全部</button>
        <button class="cat-btn border-2 border-stone-200 text-stone-500 text-sm font-bold px-4 py-1.5 rounded-full" onclick="filterProducts('dog',this)">🐶 狗狗</button>
        <button class="cat-btn border-2 border-stone-200 text-stone-500 text-sm font-bold px-4 py-1.5 rounded-full" onclick="filterProducts('cat',this)">🐱 貓咪</button>
      </div>
    </div>
    <div class="grid grid-cols-4 gap-6" id="productGrid">
      <div class="product-card bg-white rounded-2xl overflow-hidden border border-orange-100" data-pet="dog">
        <div class="h-44 bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center text-6xl">🦴</div>
        <div class="p-4">
          <div class="text-xs text-primary font-bold mb-1">狗狗 ・ 飼料</div>
          <h3 class="font-bold text-bark mb-1">頂級鮮肉犬糧 2kg</h3>
          <p class="text-xs text-stone-400 mb-3">澳洲放牧牛肉 × 紐西蘭鹿肉</p>
          <div class="flex items-center justify-between">
            <span class="text-lg font-extrabold text-primary">$890</span>
            <button onclick="addToCart()" class="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-primaryLight transition">加入購物車</button>
          </div>
        </div>
      </div>
      <div class="product-card bg-white rounded-2xl overflow-hidden border border-orange-100" data-pet="cat">
        <div class="h-44 bg-gradient-to-br from-sky-100 to-blue-50 flex items-center justify-center text-6xl">🐟</div>
        <div class="p-4">
          <div class="text-xs text-sky font-bold mb-1">貓咪 ・ 飼料</div>
          <h3 class="font-bold text-bark mb-1">深海魚貓糧 1.5kg</h3>
          <p class="text-xs text-stone-400 mb-3">野生鮭魚 × Omega-3 配方</p>
          <div class="flex items-center justify-between">
            <span class="text-lg font-extrabold text-sky">$780</span>
            <button onclick="addToCart()" class="bg-sky text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:opacity-80 transition">加入購物車</button>
          </div>
        </div>
      </div>
      <div class="product-card bg-white rounded-2xl overflow-hidden border border-orange-100" data-pet="dog">
        <div class="h-44 bg-gradient-to-br from-emerald-100 to-green-50 flex items-center justify-center text-6xl">🧸</div>
        <div class="p-4">
          <div class="text-xs text-mint font-bold mb-1">狗狗 ・ 玩具</div>
          <h3 class="font-bold text-bark mb-1">耐咬磨牙球組</h3>
          <p class="text-xs text-stone-400 mb-3">天然橡膠 × 無毒安全</p>
          <div class="flex items-center justify-between">
            <span class="text-lg font-extrabold text-mint">$350</span>
            <button onclick="addToCart()" class="bg-mint text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:opacity-80 transition">加入購物車</button>
          </div>
        </div>
      </div>
      <div class="product-card bg-white rounded-2xl overflow-hidden border border-orange-100" data-pet="cat">
        <div class="h-44 bg-gradient-to-br from-rose-100 to-pink-50 flex items-center justify-center text-6xl">🏠</div>
        <div class="p-4">
          <div class="text-xs text-rose font-bold mb-1">貓咪 ・ 窩墊</div>
          <h3 class="font-bold text-bark mb-1">雲朵貓窩（冬暖夏涼）</h3>
          <p class="text-xs text-stone-400 mb-3">記憶棉 × 可拆洗絨面</p>
          <div class="flex items-center justify-between">
            <span class="text-lg font-extrabold text-rose">$1,280</span>
            <button onclick="addToCart()" class="bg-rose text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:opacity-80 transition">加入購物車</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Knowledge -->
<section id="knowledge" class="py-16 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-3xl font-extrabold text-center mb-10">毛孩知識專欄</h2>
    <div class="grid grid-cols-3 gap-6">
      <article class="bg-warm rounded-2xl p-6 hover:shadow-lg transition cursor-pointer">
        <div class="text-3xl mb-3">🥗</div>
        <h3 class="font-bold text-bark mb-2">幼犬營養指南：從斷奶到成犬</h3>
        <p class="text-sm text-stone-500 mb-3">了解幼犬各階段的營養需求，選擇最適合的飼料與餵食方式...</p>
        <span class="text-xs text-primary font-bold">閱讀更多 →</span>
      </article>
      <article class="bg-sky-50 rounded-2xl p-6 hover:shadow-lg transition cursor-pointer">
        <div class="text-3xl mb-3">🐱</div>
        <h3 class="font-bold text-bark mb-2">貓咪行為解密：尾巴的秘密語言</h3>
        <p class="text-sm text-stone-500 mb-3">透過尾巴的擺動方式，讀懂貓主子的心情與需求...</p>
        <span class="text-xs text-sky font-bold">閱讀更多 →</span>
      </article>
      <article class="bg-emerald-50 rounded-2xl p-6 hover:shadow-lg transition cursor-pointer">
        <div class="text-3xl mb-3">🏥</div>
        <h3 class="font-bold text-bark mb-2">定期健檢清單：毛孩的必做項目</h3>
        <p class="text-sm text-stone-500 mb-3">每年必做的健康檢查項目一覽，預防勝於治療...</p>
        <span class="text-xs text-mint font-bold">閱讀更多 →</span>
      </article>
    </div>
  </div>
</section>

<!-- Benefits -->
<section class="py-12 bg-gradient-to-r from-primary to-primaryLight text-white">
  <div class="max-w-6xl mx-auto px-6 grid grid-cols-4 gap-8 text-center">
    <div><div class="text-3xl mb-2">🚚</div><div class="font-bold">滿 $999 免運</div><div class="text-sm text-white/70">全台宅配到府</div></div>
    <div><div class="text-3xl mb-2">🔄</div><div class="font-bold">7 天鑑賞期</div><div class="text-sm text-white/70">不滿意可退換</div></div>
    <div><div class="text-3xl mb-2">✅</div><div class="font-bold">正品保證</div><div class="text-sm text-white/70">原廠授權代理</div></div>
    <div><div class="text-3xl mb-2">💬</div><div class="font-bold">專業諮詢</div><div class="text-sm text-white/70">獸醫師線上答</div></div>
  </div>
</section>

<!-- Footer -->
<footer id="about" class="bg-bark text-white py-12">
  <div class="max-w-6xl mx-auto px-6 grid grid-cols-4 gap-8">
    <div>
      <div class="flex items-center gap-2 mb-4"><span class="text-2xl">🐾</span><span class="font-extrabold text-lg">PetPlanet</span></div>
      <p class="text-sm text-white/60">讓每一位毛孩家人<br>都值得被好好愛</p>
    </div>
    <div>
      <h4 class="font-bold mb-3">商品分類</h4>
      <div class="space-y-2 text-sm text-white/60"><div>飼料</div><div>玩具</div><div>窩墊</div><div>清潔</div></div>
    </div>
    <div>
      <h4 class="font-bold mb-3">客服資訊</h4>
      <div class="space-y-2 text-sm text-white/60"><div>LINE：@petplanet</div><div>客服時間 10:00-18:00</div><div>service@petplanet.tw</div></div>
    </div>
    <div>
      <h4 class="font-bold mb-3">訂閱電子報</h4>
      <p class="text-sm text-white/60 mb-3">獲取最新優惠與毛孩知識</p>
      <div class="flex gap-2"><input type="email" placeholder="您的 Email" class="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"><button class="bg-primary px-4 rounded-xl text-sm font-bold hover:bg-primaryLight transition">訂閱</button></div>
    </div>
  </div>
  <div class="max-w-6xl mx-auto px-6 mt-8 pt-6 border-t border-white/10 text-center text-xs text-white/30">© 2026 PetPlanet 毛孩星球. All rights reserved.</div>
</footer>

<div class="toast" id="toast">🛒 已加入購物車！</div>

<script>
let cartNum=0;
function addToCart(){
  cartNum++;
  document.getElementById('cartCount').textContent=cartNum;
  const t=document.getElementById('toast');
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2000);
}
function filterProducts(pet,btn){
  document.querySelectorAll('.cat-btn').forEach(b=>{b.classList.remove('active');b.style.background='';b.style.color='';b.style.borderColor=''});
  btn.classList.add('active');
  document.querySelectorAll('.product-card').forEach(c=>{
    c.style.display=(pet==='all'||c.dataset.pet===pet)?'block':'none';
  });
}
// Scroll reveal
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')})},{threshold:.1});
document.querySelectorAll('.fade-up').forEach(el=>obs.observe(el));
</script>
</body>
</html>$HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
