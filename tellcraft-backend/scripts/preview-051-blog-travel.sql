INSERT INTO template_previews (template_id, html_content, version)
VALUES ('5735888e-3eba-4ca7-845c-e8541a5ff240', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>浪跡天涯 Wanderlust Diary</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{ocean:'#0369a1',sunset:'#ea580c',sand:'#d4a373',forest:'#365314',sky:'#e0f2fe',cream:'#fef9f0',dark:'#1a1a1a'},fontFamily:{display:['Playfair Display','serif'],body:['DM Sans','sans-serif']}}}}
</script>
<style>
body{font-family:'DM Sans',sans-serif}
html{scroll-behavior:smooth}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.article-card:hover .article-img{transform:scale(1.05)}
.article-img{transition:transform 0.6s cubic-bezier(0.4,0,0.2,1)}
</style>
</head>
<body class="bg-cream text-dark overflow-x-hidden">

<!-- Nav -->
<nav class="fixed top-0 w-full bg-cream/95 backdrop-blur-sm z-50 border-b border-dark/5">
  <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
    <div>
      <div class="font-display text-xl font-bold">浪跡天涯</div>
      <div class="text-[9px] tracking-[0.3em] text-dark/30 uppercase">Wanderlust Diary</div>
    </div>
    <div class="hidden md:flex items-center gap-6 text-sm">
      <button onclick="filterArticles('all')" class="text-dark/50 hover:text-dark transition-colors cursor-pointer font-medium">全部</button>
      <button onclick="filterArticles('asia')" class="text-dark/50 hover:text-dark transition-colors cursor-pointer font-medium">亞洲</button>
      <button onclick="filterArticles('europe')" class="text-dark/50 hover:text-dark transition-colors cursor-pointer font-medium">歐洲</button>
      <button onclick="filterArticles('adventure')" class="text-dark/50 hover:text-dark transition-colors cursor-pointer font-medium">冒險</button>
      <button onclick="filterArticles('food')" class="text-dark/50 hover:text-dark transition-colors cursor-pointer font-medium">美食</button>
    </div>
    <button class="text-dark/50 hover:text-dark transition-colors cursor-pointer">🔍</button>
  </div>
</nav>

<!-- Hero Featured -->
<section class="pt-24 pb-16">
  <div class="max-w-5xl mx-auto px-6">
    <div class="relative bg-gradient-to-br from-ocean/20 via-ocean/10 to-sky rounded-2xl overflow-hidden cursor-pointer group reveal" onclick="showArticle('featured')">
      <div class="grid md:grid-cols-2 gap-0">
        <div class="p-8 md:p-12 flex flex-col justify-center">
          <div class="flex items-center gap-2 mb-4">
            <span class="bg-sunset text-white text-[10px] font-bold px-2.5 py-1 rounded-full">精選文章</span>
            <span class="text-dark/30 text-xs">2026.02.10</span>
          </div>
          <h1 class="font-display text-3xl md:text-4xl font-bold leading-tight mb-4 group-hover:text-ocean transition-colors">
            冰島環島 14 天：追極光、泡溫泉、與冰河共舞
          </h1>
          <p class="text-dark/50 leading-relaxed mb-6 text-sm">從雷克雅維克出發，沿著一號公路環島一圈。冰川健行、藍湖溫泉、鑽石沙灘、極光舞動的夜晚⋯這是一趟改變人生的旅程。</p>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-ocean/20 rounded-full flex items-center justify-center text-xs">✈️</div>
            <div>
              <div class="font-bold text-xs">旅行者阿翔</div>
              <div class="text-dark/30 text-[10px]">15 min read · 2.4k 次閱讀</div>
            </div>
          </div>
        </div>
        <div class="aspect-[4/3] md:aspect-auto bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center">
          <div class="text-center">
            <div class="text-6xl mb-2">🇮🇸</div>
            <div class="text-white/80 text-xs tracking-wider font-bold">ICELAND</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Articles Grid -->
<section class="pb-20">
  <div class="max-w-5xl mx-auto px-6">
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6" id="articlesGrid">
      <!-- Article 1 -->
      <article class="article-card reveal cursor-pointer group" data-cat="asia" onclick="showArticle('kyoto')">
        <div class="aspect-[4/3] bg-gradient-to-br from-pink-200 to-pink-100 rounded-xl overflow-hidden mb-4 relative">
          <div class="article-img w-full h-full flex items-center justify-center">
            <div class="text-5xl">🌸</div>
          </div>
          <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full">亞洲</div>
        </div>
        <div class="flex items-center gap-2 text-[10px] text-dark/30 mb-2">
          <span>2026.01.28</span><span>·</span><span>8 min read</span>
        </div>
        <h3 class="font-display text-lg font-bold mb-2 group-hover:text-ocean transition-colors">京都私房散步：5 條在地人才知道的小徑</h3>
        <p class="text-dark/40 text-sm leading-relaxed line-clamp-2">避開觀光客的秘密路線，從哲學之道的盡頭開始，穿越竹林、古寺、隱藏在巷弄中的百年茶屋⋯</p>
      </article>

      <!-- Article 2 -->
      <article class="article-card reveal cursor-pointer group" data-cat="europe" onclick="showArticle('portugal')" style="transition-delay:0.05s">
        <div class="aspect-[4/3] bg-gradient-to-br from-amber-200 to-orange-100 rounded-xl overflow-hidden mb-4 relative">
          <div class="article-img w-full h-full flex items-center justify-center">
            <div class="text-5xl">🇵🇹</div>
          </div>
          <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full">歐洲</div>
        </div>
        <div class="flex items-center gap-2 text-[10px] text-dark/30 mb-2">
          <span>2026.01.15</span><span>·</span><span>12 min read</span>
        </div>
        <h3 class="font-display text-lg font-bold mb-2 group-hover:text-ocean transition-colors">里斯本 7 天：歐洲最被低估的首都</h3>
        <p class="text-dark/40 text-sm leading-relaxed line-clamp-2">彩色磁磚、叮噹響的電車、懸崖邊的日落、一杯蛋塔配黑咖啡⋯里斯本有種讓人不想離開的魔力。</p>
      </article>

      <!-- Article 3 -->
      <article class="article-card reveal cursor-pointer group" data-cat="adventure" onclick="showArticle('nepal')" style="transition-delay:0.1s">
        <div class="aspect-[4/3] bg-gradient-to-br from-emerald-200 to-green-100 rounded-xl overflow-hidden mb-4 relative">
          <div class="article-img w-full h-full flex items-center justify-center">
            <div class="text-5xl">🏔️</div>
          </div>
          <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full">冒險</div>
        </div>
        <div class="flex items-center gap-2 text-[10px] text-dark/30 mb-2">
          <span>2025.12.20</span><span>·</span><span>15 min read</span>
        </div>
        <h3 class="font-display text-lg font-bold mb-2 group-hover:text-ocean transition-colors">尼泊爾 ABC 健行：人生第一座 4,130m</h3>
        <p class="text-dark/40 text-sm leading-relaxed line-clamp-2">十天的安娜普納基地營健行，從亞熱帶叢林走到雪線之上，每一步都在重新定義自己的極限。</p>
      </article>

      <!-- Article 4 -->
      <article class="article-card reveal cursor-pointer group" data-cat="food" onclick="showArticle('bangkok')" style="transition-delay:0.15s">
        <div class="aspect-[4/3] bg-gradient-to-br from-red-200 to-orange-100 rounded-xl overflow-hidden mb-4 relative">
          <div class="article-img w-full h-full flex items-center justify-center">
            <div class="text-5xl">🍜</div>
          </div>
          <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full">美食</div>
        </div>
        <div class="flex items-center gap-2 text-[10px] text-dark/30 mb-2">
          <span>2025.12.05</span><span>·</span><span>10 min read</span>
        </div>
        <h3 class="font-display text-lg font-bold mb-2 group-hover:text-ocean transition-colors">曼谷街頭美食地圖：30 攤必吃清單</h3>
        <p class="text-dark/40 text-sm leading-relaxed line-clamp-2">從耀華力路的海鮮大排檔到勝利紀念碑的船麵，從米其林小攤到深夜才出現的秘密燒烤⋯</p>
      </article>

      <!-- Article 5 -->
      <article class="article-card reveal cursor-pointer group" data-cat="europe" onclick="showArticle('swiss')" style="transition-delay:0.2s">
        <div class="aspect-[4/3] bg-gradient-to-br from-sky to-blue-100 rounded-xl overflow-hidden mb-4 relative">
          <div class="article-img w-full h-full flex items-center justify-center">
            <div class="text-5xl">🇨🇭</div>
          </div>
          <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full">歐洲</div>
        </div>
        <div class="flex items-center gap-2 text-[10px] text-dark/30 mb-2">
          <span>2025.11.18</span><span>·</span><span>11 min read</span>
        </div>
        <h3 class="font-display text-lg font-bold mb-2 group-hover:text-ocean transition-colors">瑞士少女峰鐵道之旅：火車窗外的人間仙境</h3>
        <p class="text-dark/40 text-sm leading-relaxed line-clamp-2">從因特拉肯搭上齒軌火車，穿越瀑布、牧場、阿爾卑斯山村，最後抵達歐洲之巔。</p>
      </article>

      <!-- Article 6 -->
      <article class="article-card reveal cursor-pointer group" data-cat="asia" onclick="showArticle('bali')" style="transition-delay:0.25s">
        <div class="aspect-[4/3] bg-gradient-to-br from-teal-200 to-emerald-100 rounded-xl overflow-hidden mb-4 relative">
          <div class="article-img w-full h-full flex items-center justify-center">
            <div class="text-5xl">🌴</div>
          </div>
          <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full">亞洲</div>
        </div>
        <div class="flex items-center gap-2 text-[10px] text-dark/30 mb-2">
          <span>2025.11.02</span><span>·</span><span>9 min read</span>
        </div>
        <h3 class="font-display text-lg font-bold mb-2 group-hover:text-ocean transition-colors">峇里島 Ubud：瑜伽、梯田與靈性之旅</h3>
        <p class="text-dark/40 text-sm leading-relaxed line-clamp-2">在烏布的稻田間練瑜伽、在猴林漫步、品嚐有機咖啡，尋找身心靈的平衡點。</p>
      </article>
    </div>
  </div>
</section>

<!-- Article Detail Modal -->
<div id="articleModal" class="hidden fixed inset-0 bg-cream z-50 overflow-y-auto">
  <div class="max-w-3xl mx-auto px-6 py-8">
    <button onclick="document.getElementById('articleModal').classList.add('hidden')" class="mb-8 flex items-center gap-2 text-dark/40 hover:text-dark transition-colors cursor-pointer text-sm">
      ← 返回文章列表
    </button>
    <div id="articleContent"></div>
  </div>
</div>

<!-- Newsletter -->
<section class="py-16 bg-gradient-to-r from-ocean to-blue-700 text-white">
  <div class="max-w-3xl mx-auto px-6 text-center reveal">
    <h2 class="font-display text-3xl font-bold mb-3">訂閱旅行靈感 ✉️</h2>
    <p class="text-white/60 mb-8 text-sm">每週一封，精選目的地推薦、旅行攻略、機票優惠</p>
    <div class="flex gap-3 max-w-md mx-auto">
      <input type="email" placeholder="輸入 Email" class="flex-1 px-5 py-3.5 rounded-full text-dark text-sm focus:outline-none">
      <button onclick="showToast('訂閱成功！歡迎加入浪跡天涯的旅程 🌍')" class="bg-sunset text-white px-6 py-3.5 rounded-full text-sm font-bold hover:bg-orange-700 transition-colors cursor-pointer whitespace-nowrap">訂閱</button>
    </div>
  </div>
</section>

<!-- About Author -->
<section class="py-20 bg-cream">
  <div class="max-w-3xl mx-auto px-6 text-center reveal">
    <div class="w-20 h-20 bg-gradient-to-br from-ocean to-sunset rounded-full mx-auto mb-6 flex items-center justify-center text-3xl">✈️</div>
    <h3 class="font-display text-2xl font-bold mb-2">旅行者阿翔</h3>
    <p class="text-dark/30 text-sm mb-4">前工程師，現全職旅行者。已造訪 47 個國家，最愛偏門目的地。</p>
    <p class="text-dark/50 text-sm leading-relaxed max-w-lg mx-auto">「旅行不是逃避，是為了帶著新的眼光回到日常。每一次出發都讓我更確定：世界很大，人生很短，不要等。」</p>
    <div class="flex justify-center gap-4 mt-6">
      <div class="w-10 h-10 bg-dark/5 rounded-full flex items-center justify-center text-sm hover:bg-ocean hover:text-white transition-colors cursor-pointer">📷</div>
      <div class="w-10 h-10 bg-dark/5 rounded-full flex items-center justify-center text-sm hover:bg-ocean hover:text-white transition-colors cursor-pointer">📺</div>
      <div class="w-10 h-10 bg-dark/5 rounded-full flex items-center justify-center text-sm hover:bg-ocean hover:text-white transition-colors cursor-pointer">📘</div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-dark text-white py-10">
  <div class="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
    <div class="font-display text-lg">浪跡天涯</div>
    <p class="text-white/30 text-xs">© 2026 Wanderlust Diary. All rights reserved.</p>
    <div class="flex gap-4 text-white/30 text-xs">
      <span class="hover:text-white transition-colors cursor-pointer">關於</span>
      <span class="hover:text-white transition-colors cursor-pointer">合作</span>
      <span class="hover:text-white transition-colors cursor-pointer">隱私政策</span>
    </div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 bg-dark text-white px-6 py-3.5 rounded-2xl shadow-2xl z-[60] translate-y-20 opacity-0 transition-all duration-500 text-sm font-medium"></div>

<script>
const articles={
  featured:{
    title:'冰島環島 14 天：追極光、泡溫泉、與冰河共舞',
    date:'2026.02.10',
    tag:'精選',
    emoji:'🇮🇸',
    content:`<p>從雷克雅維克出發的那一刻起，冰島就不斷讓我驚嘆。</p>
    <h3>Day 1-3：南岸的壯闊</h3>
    <p>沿著一號公路南下，塞里雅蘭瀑布如絲綢般垂落，Skógafoss 的彩虹在水霧中若隱若現。Reynisfjara 黑沙灘上的玄武岩柱，彷彿大自然的管風琴。</p>
    <h3>Day 4-6：冰川健行</h3>
    <p>在 Sólheimajökull 冰川上穿上冰爪，踏入一片藍白交織的世界。冰川裂縫中透出的藍光，是我見過最純粹的顏色。Jökulsárlón 冰河湖的浮冰在夕陽下閃爍，鑽石沙灘上的冰塊像寶石一樣散落。</p>
    <h3>Day 7-10：東部峽灣與北部</h3>
    <p>東部峽灣是冰島最不被打擾的角落。每一個轉彎都是一片新的風景——瀑布、羊群、孤獨的漁村。到了米湖，火山地熱區冒著蒸汽，像是走進了另一個星球。</p>
    <h3>Day 11-14：極光與溫泉</h3>
    <p>北部的冬夜，終於等到了極光。綠色的光帶在天空中舞動，慢慢轉為紫色、粉色，整個天幕都在呼吸。我站在藍湖溫泉裡，仰頭看極光，那一刻覺得這趟旅程值得所有的等待。</p>`
  },
  kyoto:{
    title:'京都私房散步：5 條在地人才知道的小徑',
    date:'2026.01.28',
    tag:'亞洲',
    emoji:'🌸',
    content:`<p>京都的美，藏在觀光客看不見的地方。</p>
    <h3>1. 哲學之道延伸段</h3>
    <p>多數人走到銀閣寺就折返，但繼續往北走 15 分鐘，會經過一段沒有人煙的小溪步道，春天時兩側的山櫻花靜靜綻放，只有你和流水的聲音。</p>
    <h3>2. 嵯峨野竹林的後門</h3>
    <p>不要從正門進竹林，從野宮神社後方的小路繞進去，清晨六點的竹林裡只有鳥鳴和光影。</p>
    <h3>3. 東山小路</h3>
    <p>從清水寺下坡後，不走二年坂，而是轉進一條不起眼的石板巷，穿過一扇半掩的木門，裡面是一座百年町家改建的茶屋。一杯抹茶、一塊和菓子、窗外是苔蘚覆蓋的庭園。</p>`
  },
  portugal:{title:'里斯本 7 天：歐洲最被低估的首都',date:'2026.01.15',tag:'歐洲',emoji:'🇵🇹',content:'<p>里斯本的故事，寫在每一面彩色磁磚牆上⋯</p><h3>Alfama 老城區</h3><p>迷失在 Alfama 的巷弄裡，是里斯本最好的體驗。每一個轉角都是驚喜——一扇藍色的門、一隻曬太陽的貓、一家只有三張桌子的小酒館。</p>'},
  nepal:{title:'尼泊爾 ABC 健行：人生第一座 4,130m',date:'2025.12.20',tag:'冒險',emoji:'🏔️',content:'<p>十天的安娜普納基地營健行，是我做過最正確的決定⋯</p><h3>從亞熱帶到雪線</h3><p>第一天穿著短袖走在水田間，第五天就在雪地裡裹著所有衣服。海拔每升高一千公尺，世界就換一個面貌。</p>'},
  bangkok:{title:'曼谷街頭美食地圖：30 攤必吃清單',date:'2025.12.05',tag:'美食',emoji:'🍜',content:'<p>曼谷的街頭美食，是這個城市最迷人的語言⋯</p><h3>TOP 5 必吃</h3><p>1. 耀華力路 T&K 海鮮 — 巨大的咖哩螃蟹<br>2. 勝利紀念碑船麵 — 10 泰銖一碗的極致美味<br>3. Raan Jay Fai — 唯一的米其林街頭小吃<br>4. Som Tam Nua — 排到天荒地老的青木瓜沙拉<br>5. Charoen Saeng Silom — 深夜海南雞飯</p>'},
  swiss:{title:'瑞士少女峰鐵道之旅',date:'2025.11.18',tag:'歐洲',emoji:'🇨🇭',content:'<p>從因特拉肯到少女峰，每一個車站都是一幅明信片⋯</p>'},
  bali:{title:'峇里島 Ubud：瑜伽、梯田與靈性之旅',date:'2025.11.02',tag:'亞洲',emoji:'🌴',content:'<p>烏布不是峇里島的海灘派對，而是靈魂的避風港⋯</p>'}
};

function showArticle(id){
  const a=articles[id];if(!a)return;
  document.getElementById('articleContent').innerHTML=`
    <div class="bg-gradient-to-br from-ocean/10 to-sky rounded-xl aspect-[2/1] flex items-center justify-center mb-8">
      <div class="text-7xl">${a.emoji}</div>
    </div>
    <div class="flex items-center gap-3 mb-4">
      <span class="bg-ocean/10 text-ocean text-xs font-bold px-2.5 py-1 rounded-full">${a.tag}</span>
      <span class="text-dark/30 text-xs">${a.date}</span>
    </div>
    <h1 class="font-display text-3xl md:text-4xl font-bold mb-6 leading-tight">${a.title}</h1>
    <div class="flex items-center gap-3 mb-8 pb-8 border-b border-dark/10">
      <div class="w-10 h-10 bg-ocean/20 rounded-full flex items-center justify-center text-sm">✈️</div>
      <div><div class="font-bold text-sm">旅行者阿翔</div><div class="text-dark/30 text-xs">47 國 · 全職旅行者</div></div>
    </div>
    <div class="prose prose-lg max-w-none text-dark/70 leading-relaxed space-y-4 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-dark [&_h3]:mt-8 [&_h3]:mb-3">${a.content}</div>
  `;
  document.getElementById('articleModal').classList.remove('hidden');
  window.scrollTo(0,0);
}

function filterArticles(cat){
  document.querySelectorAll('.article-card').forEach(c=>{
    if(cat==='all'||c.dataset.cat===cat)c.style.display='';
    else c.style.display='none';
  });
}

function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3000)}

const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}})},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
</script>
</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
