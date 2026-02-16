INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'b7a7c8c0-357d-4b8d-955a-7412027160f1',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>灶腳日誌 Kitchen Stories — 料理食譜部落格</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        cook: { 50:'#fff8f1', 100:'#feefdc', 200:'#fcdbb8', 300:'#f9c084', 400:'#f69c4e', 500:'#f37e28', 600:'#e4641e', 700:'#bd4b19', 800:'#963c1c', 900:'#79331a' },
        cream: { 50:'#fefdfb', 100:'#fdf9f2', 200:'#faf2e4', 300:'#f5e6ce', 400:'#edd5b0' },
        herb: { 50:'#f0fdf4', 100:'#dcfce7', 200:'#bbf7d0', 300:'#86efac', 400:'#4ade80', 500:'#22c55e', 600:'#16a34a' }
      },
      fontFamily: {
        display:['Playfair Display','Noto Sans TC','serif'],
        body:['Inter','Noto Sans TC','sans-serif']
      }
    }
  }
}
</script>
<style>
  body { font-family: 'Inter', 'Noto Sans TC', sans-serif; background: #fefdfb; }
  h1,h2,h3,.font-display { font-family: 'Playfair Display', 'Noto Sans TC', serif; }
  html { scroll-behavior: smooth; }
  .reveal { opacity:0; transform:translateY(24px); transition:all 0.6s cubic-bezier(0.16,1,0.3,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }
</style>
</head>
<body class="text-gray-800">

<!-- Navbar -->
<nav class="fixed top-0 w-full bg-cream-50/95 backdrop-blur-md z-50 border-b border-cream-200">
  <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
    <a href="#" onclick="showHome()" class="flex items-center gap-2">
      <span class="text-2xl">🍳</span>
      <span class="font-display text-xl font-bold text-cook-700">灶腳日誌</span>
    </a>
    <div class="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
      <button onclick="filterCategory('all')" class="hover:text-cook-600 transition-colors">全部食譜</button>
      <button onclick="filterCategory('chinese')" class="hover:text-cook-600 transition-colors">中式</button>
      <button onclick="filterCategory('japanese')" class="hover:text-cook-600 transition-colors">日式</button>
      <button onclick="filterCategory('western')" class="hover:text-cook-600 transition-colors">西式</button>
      <button onclick="filterCategory('dessert')" class="hover:text-cook-600 transition-colors">甜點</button>
      <button onclick="filterCategory('drink')" class="hover:text-cook-600 transition-colors">飲品</button>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="showToast('搜尋功能 Coming Soon')" class="text-gray-400 hover:text-cook-500">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </button>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-gray-500">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-cream-50 border-t border-cream-200 px-6 py-3 flex flex-wrap gap-2">
    <button onclick="filterCategory('all')" class="text-sm px-3 py-1 rounded-full bg-cream-200 text-gray-600">全部</button>
    <button onclick="filterCategory('chinese')" class="text-sm px-3 py-1 rounded-full bg-cream-200 text-gray-600">中式</button>
    <button onclick="filterCategory('japanese')" class="text-sm px-3 py-1 rounded-full bg-cream-200 text-gray-600">日式</button>
    <button onclick="filterCategory('western')" class="text-sm px-3 py-1 rounded-full bg-cream-200 text-gray-600">西式</button>
    <button onclick="filterCategory('dessert')" class="text-sm px-3 py-1 rounded-full bg-cream-200 text-gray-600">甜點</button>
    <button onclick="filterCategory('drink')" class="text-sm px-3 py-1 rounded-full bg-cream-200 text-gray-600">飲品</button>
  </div>
</nav>

<!-- Home View -->
<div id="home-view">
  <!-- Hero -->
  <section class="pt-20 pb-12 bg-gradient-to-b from-cream-100 to-cream-50">
    <div class="max-w-5xl mx-auto px-6">
      <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-cream-200 grid md:grid-cols-2">
        <div class="h-56 md:h-auto bg-gradient-to-br from-cook-100 to-cook-200 flex items-center justify-center text-8xl">🍝</div>
        <div class="p-8 flex flex-col justify-center">
          <span class="text-cook-500 text-xs font-semibold tracking-wider uppercase">本週精選</span>
          <h1 class="font-display text-3xl font-bold mt-2 mb-3 leading-tight">手打義大利麵<br>佐松露奶油醬</h1>
          <p class="text-gray-500 text-sm leading-relaxed mb-4">從揉麵到上桌只要 45 分鐘。自製麵條的 Q 彈口感，配上簡單的松露奶油醬，在家就能享受餐廳級美味。</p>
          <div class="flex items-center gap-4 text-xs text-gray-400 mb-4">
            <span>⏱ 45 分鐘</span><span>👤 2 人份</span><span>📊 中等</span>
          </div>
          <button onclick="showRecipe(0)" class="self-start bg-cook-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-cook-600 transition-colors">查看食譜 →</button>
        </div>
      </div>
    </div>
  </section>

  <!-- Recipe Grid -->
  <section class="py-12">
    <div class="max-w-5xl mx-auto px-6">
      <div class="flex items-center justify-between mb-8">
        <h2 class="font-display text-2xl font-bold">最新食譜</h2>
        <div class="hidden md:flex gap-2" id="category-filters">
          <button onclick="filterCategory('all')" class="cat-btn active text-xs px-3 py-1.5 rounded-full font-medium border transition-colors bg-cook-500 text-white border-cook-500">全部</button>
          <button onclick="filterCategory('chinese')" class="cat-btn text-xs px-3 py-1.5 rounded-full font-medium border transition-colors bg-white text-gray-500 border-cream-300 hover:border-cook-300">中式</button>
          <button onclick="filterCategory('japanese')" class="cat-btn text-xs px-3 py-1.5 rounded-full font-medium border transition-colors bg-white text-gray-500 border-cream-300 hover:border-cook-300">日式</button>
          <button onclick="filterCategory('western')" class="cat-btn text-xs px-3 py-1.5 rounded-full font-medium border transition-colors bg-white text-gray-500 border-cream-300 hover:border-cook-300">西式</button>
          <button onclick="filterCategory('dessert')" class="cat-btn text-xs px-3 py-1.5 rounded-full font-medium border transition-colors bg-white text-gray-500 border-cream-300 hover:border-cook-300">甜點</button>
          <button onclick="filterCategory('drink')" class="cat-btn text-xs px-3 py-1.5 rounded-full font-medium border transition-colors bg-white text-gray-500 border-cream-300 hover:border-cook-300">飲品</button>
        </div>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" id="recipe-grid">
      </div>
    </div>
  </section>

  <!-- Newsletter -->
  <section class="py-12 bg-cook-500">
    <div class="max-w-xl mx-auto px-6 text-center">
      <span class="text-3xl block mb-3">📬</span>
      <h2 class="font-display text-2xl font-bold text-white mb-2">每週新食譜直送信箱</h2>
      <p class="text-cook-100 text-sm mb-6">訂閱灶腳日誌，每週收到精選食譜、料理技巧和當季食材指南</p>
      <div class="flex gap-2 max-w-sm mx-auto">
        <input type="email" placeholder="your@email.com" class="flex-1 bg-white/20 border border-white/30 rounded-full px-5 py-2.5 text-sm text-white placeholder-cook-200 outline-none focus:bg-white/30">
        <button onclick="showToast('訂閱成功！🎉')" class="bg-white text-cook-600 px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-cream-100 transition-colors">訂閱</button>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-cream-100 py-10">
    <div class="max-w-5xl mx-auto px-6 text-center">
      <div class="flex items-center justify-center gap-2 mb-4">
        <span class="text-2xl">🍳</span>
        <span class="font-display text-xl font-bold text-cook-700">灶腳日誌</span>
      </div>
      <p class="text-gray-400 text-sm mb-4">用心做菜，用愛分享。每一道食譜都是家的味道。</p>
      <p class="text-gray-400 text-xs">© 2026 灶腳日誌 Kitchen Stories. All rights reserved.</p>
    </div>
  </footer>
</div>

<!-- Recipe Detail View -->
<div id="recipe-view" class="hidden pt-16">
  <div class="max-w-3xl mx-auto px-6 py-10">
    <button onclick="showHome()" class="flex items-center gap-1.5 text-cook-500 text-sm font-medium mb-6 hover:text-cook-600">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      返回食譜列表
    </button>
    <div id="recipe-detail"></div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"></div>

<script>
const recipes = [
  { title:'手打義大利麵佐松露奶油醬', emoji:'🍝', cat:'western', catLabel:'西式', time:'45min', serves:'2人', diff:'中等',
    intro:'自製手打麵條配上簡單的松露奶油醬，口感 Q 彈、香氣濃郁。在家也能做出餐廳等級的義大利麵。',
    ingredients:['中筋麵粉 200g','雞蛋 2 顆','鹽 1/2 小匙','橄欖油 1 大匙','鮮奶油 200ml','帕瑪森起司 50g','松露醬 1 大匙','黑胡椒適量','無鹽奶油 20g'],
    steps:['將麵粉過篩堆成火山狀，中間打入雞蛋、鹽、橄欖油','由內向外攪拌混合，揉成光滑麵團（約 8-10 分鐘）','包保鮮膜靜置 30 分鐘','擀薄至約 1mm，切成寬麵條','鍋中煮水加鹽，下麵煮 2-3 分鐘','另起鍋小火融奶油，加鮮奶油煮至微滾','加入松露醬、帕瑪森起司拌勻','撈麵入醬汁翻拌，撒黑胡椒即完成'] },
  { title:'日式咖哩飯', emoji:'🍛', cat:'japanese', catLabel:'日式', time:'60min', serves:'4人', diff:'簡單',
    intro:'濃郁順口的日式咖哩，搭配軟嫩馬鈴薯和紅蘿蔔，是一道大人小孩都愛的家常料理。',
    ingredients:['咖哩塊 1 盒','洋蔥 2 顆','馬鈴薯 2 顆','紅蘿蔔 1 根','豬肉片 300g','水 800ml','白飯適量','蘋果 1/2 顆（增甜）'],
    steps:['洋蔥切絲、馬鈴薯紅蘿蔔切塊','大火炒洋蔥至透明','加入肉片炒至變色','加入馬鈴薯、紅蘿蔔翻炒','倒入水煮沸，轉小火燉煮 20 分鐘','關火加入咖哩塊攪拌至溶化','再小火煮 10 分鐘至濃稠','盛飯，淋上咖哩即完成'] },
  { title:'蒜香奶油蝦', emoji:'🦐', cat:'western', catLabel:'西式', time:'20min', serves:'2人', diff:'簡單',
    intro:'西班牙風味的蒜香奶油蝦，大蒜、奶油、白酒的完美組合，搭配麵包沾醬汁超級好吃。',
    ingredients:['鮮蝦 300g','大蒜 6 瓣','無鹽奶油 40g','橄欖油 2 大匙','白酒 50ml','紅辣椒 1 根','巴西里適量','檸檬 1/2 顆','鹽、黑胡椒適量'],
    steps:['蝦去腸泥，蒜切片，辣椒切圈','鍋中加橄欖油和奶油，小火煸蒜片','蒜片微金黃加入辣椒，放入蝦子翻炒','倒入白酒，蓋鍋燜 2 分鐘','撒鹽、黑胡椒調味','擠檸檬汁，撒巴西里即完成'] },
  { title:'台式滷肉飯', emoji:'🍚', cat:'chinese', catLabel:'中式', time:'90min', serves:'6人', diff:'中等',
    intro:'台灣經典國民美食，肥瘦相間的五花肉搭配醬油滷汁，淋在白飯上就是幸福。',
    ingredients:['五花肉 600g','紅蔥頭 8 瓣','醬油 80ml','醬油膏 40ml','冰糖 2 大匙','米酒 50ml','五香粉 1/2 小匙','白胡椒粉適量','水 500ml','滷蛋 6 顆'],
    steps:['五花肉切 1cm 小丁，紅蔥頭切薄片','冷鍋下肉丁，中火煸出油脂','推到鍋邊，放紅蔥頭炸至金黃酥脆','加入冰糖炒出焦糖色','加醬油、醬油膏、米酒翻炒','加水、五香粉、白胡椒煮沸','轉小火蓋鍋滷 60 分鐘','最後 15 分鐘加入水煮蛋同滷'] },
  { title:'抹茶戚風蛋糕', emoji:'🍰', cat:'dessert', catLabel:'甜點', time:'50min', serves:'8人', diff:'進階',
    intro:'輕盈柔軟的抹茶戚風，搭配鮮奶油和紅豆，是最療癒的下午茶甜點。',
    ingredients:['低筋麵粉 90g','抹茶粉 10g','蛋黃 4 個','蛋白 4 個','砂糖 70g','植物油 40ml','牛奶 60ml','檸檬汁 少許'],
    steps:['蛋黃加 20g 糖打勻，加油和牛奶拌勻','篩入麵粉和抹茶粉拌至無顆粒','蛋白加檸檬汁打發，分次加 50g 糖至硬性發泡','取 1/3 蛋白切拌入蛋黃糊','再倒回剩餘蛋白輕柔翻拌','倒入戚風模，輕敲去氣泡','170°C 烤 35 分鐘','出爐倒扣放涼，脫模即完成'] },
  { title:'泰式打拋豬', emoji:'🌶️', cat:'chinese', catLabel:'中式', time:'15min', serves:'2人', diff:'簡單',
    intro:'超下飯的泰式打拋豬，蒜香辣椒配九層塔的香氣，15 分鐘快速上桌。',
    ingredients:['豬絞肉 300g','蒜頭 5 瓣','辣椒 2 根','九層塔一把','醬油 1.5 大匙','蠔油 1 大匙','魚露 1 大匙','糖 1 小匙','水 2 大匙'],
    steps:['蒜頭切末、辣椒切碎','大火熱油，爆香蒜末辣椒','加入絞肉炒散至變色','加醬油、蠔油、魚露、糖、水翻炒','收汁至濃稠','關火拌入九層塔即完成'] },
  { title:'焦糖布丁', emoji:'🍮', cat:'dessert', catLabel:'甜點', time:'40min', serves:'4人', diff:'中等',
    intro:'經典法式焦糖布丁，滑嫩細緻的蛋奶凍配上苦甜焦糖，優雅又療癒。',
    ingredients:['雞蛋 3 顆','牛奶 400ml','砂糖 80g（布丁 50g + 焦糖 30g）','香草精 1 小匙','水 2 大匙'],
    steps:['焦糖：糖加水小火煮至琥珀色','立即倒入布丁杯底','蛋打散（勿打發），加糖拌勻','牛奶加熱至微溫，慢慢倒入蛋液','加香草精拌勻，過篩兩次','倒入布丁杯，水浴法 160°C 烤 30 分鐘','冷藏 4 小時後倒扣脫模'] },
  { title:'桂花蜜柚茶', emoji:'🍵', cat:'drink', catLabel:'飲品', time:'10min', serves:'2杯', diff:'簡單',
    intro:'清香怡人的桂花蜜柚茶，酸甜交織，無論冷飲熱飲都很適合。',
    ingredients:['柚子 1/4 顆','桂花蜜 2 大匙','蜂蜜 1 大匙','熱水 400ml','冰塊適量（冷飲）'],
    steps:['柚子剝出果肉，撕成小塊','杯中放入柚子肉','加入桂花蜜和蜂蜜','倒入熱水攪拌均勻','熱飲直接享用，冷飲加冰塊','可用薄荷葉裝飾'] },
  { title:'照燒雞腿排', emoji:'🍗', cat:'japanese', catLabel:'日式', time:'25min', serves:'2人', diff:'簡單',
    intro:'外酥內嫩的照燒雞腿排，醬汁甜鹹濃郁，配飯配沙拉都超搭。',
    ingredients:['去骨雞腿排 2 片','醬油 3 大匙','味醂 2 大匙','清酒 2 大匙','砂糖 1 大匙','薑泥 1 小匙','白芝麻適量'],
    steps:['雞腿排戳洞幫助入味','混合醬油味醂清酒糖薑泥成照燒醬','雞皮朝下入鍋中火煎 5 分鐘至酥脆','翻面煎 3 分鐘','倒入照燒醬，小火收汁','醬汁濃稠後翻面讓雞皮裹上醬汁','切片盛盤撒白芝麻'] }
];

function renderGrid(filter='all'){
  const grid=document.getElementById('recipe-grid');
  grid.innerHTML='';
  const filtered=filter==='all'?recipes:recipes.filter(r=>r.cat===filter);
  filtered.forEach((r,i)=>{
    const idx=recipes.indexOf(r);
    grid.innerHTML+=`<div class="reveal recipe-item bg-white rounded-xl overflow-hidden shadow-sm border border-cream-200 hover:shadow-md transition-shadow cursor-pointer group" data-cat="${r.cat}" onclick="showRecipe(${idx})">
      <div class="h-40 bg-gradient-to-br from-cream-200 to-cream-300 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">${r.emoji}</div>
      <div class="p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cook-50 text-cook-600">${r.catLabel}</span>
          <span class="text-[10px] text-gray-400">⏱ ${r.time}</span>
        </div>
        <h3 class="font-display text-lg font-bold mb-1.5 group-hover:text-cook-600 transition-colors">${r.title}</h3>
        <p class="text-gray-400 text-xs leading-relaxed line-clamp-2">${r.intro}</p>
        <div class="flex items-center gap-3 mt-3 text-xs text-gray-400">
          <span>👤 ${r.serves}</span><span>📊 ${r.diff}</span>
        </div>
      </div>
    </div>`;
  });
  setTimeout(()=>{document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));},50);
}

function filterCategory(cat){
  document.querySelectorAll('.cat-btn').forEach(b=>{b.className='cat-btn text-xs px-3 py-1.5 rounded-full font-medium border transition-colors bg-white text-gray-500 border-cream-300 hover:border-cook-300';});
  if(cat==='all'){document.querySelector('.cat-btn').className='cat-btn active text-xs px-3 py-1.5 rounded-full font-medium border transition-colors bg-cook-500 text-white border-cook-500';}
  else{const btns=document.querySelectorAll('.cat-btn');const labels={'chinese':'中式','japanese':'日式','western':'西式','dessert':'甜點','drink':'飲品'};btns.forEach(b=>{if(b.textContent===labels[cat])b.className='cat-btn active text-xs px-3 py-1.5 rounded-full font-medium border transition-colors bg-cook-500 text-white border-cook-500';});}
  renderGrid(cat);
}

function showRecipe(idx){
  const r=recipes[idx];
  document.getElementById('home-view').classList.add('hidden');
  document.getElementById('recipe-view').classList.remove('hidden');
  window.scrollTo(0,0);
  document.getElementById('recipe-detail').innerHTML=`
    <div class="bg-gradient-to-br from-cream-200 to-cream-300 rounded-2xl h-60 flex items-center justify-center text-[100px] mb-8">${r.emoji}</div>
    <div class="flex items-center gap-2 mb-3">
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-cook-50 text-cook-600">${r.catLabel}</span>
      <span class="text-xs text-gray-400">⏱ ${r.time}</span>
      <span class="text-xs text-gray-400">👤 ${r.serves}</span>
      <span class="text-xs text-gray-400">📊 ${r.diff}</span>
    </div>
    <h1 class="font-display text-3xl md:text-4xl font-bold mb-4">${r.title}</h1>
    <p class="text-gray-500 leading-relaxed mb-8">${r.intro}</p>
    <div class="grid md:grid-cols-2 gap-8">
      <div>
        <h3 class="font-display text-xl font-bold mb-4 flex items-center gap-2">🧂 食材</h3>
        <ul class="space-y-2">
          ${r.ingredients.map(i=>`<li class="flex items-center gap-2 text-sm text-gray-600"><span class="w-1.5 h-1.5 rounded-full bg-cook-400"></span>${i}</li>`).join('')}
        </ul>
      </div>
      <div>
        <h3 class="font-display text-xl font-bold mb-4 flex items-center gap-2">👩‍🍳 步驟</h3>
        <ol class="space-y-3">
          ${r.steps.map((s,i)=>`<li class="flex gap-3 text-sm text-gray-600"><span class="flex-shrink-0 w-6 h-6 rounded-full bg-cook-500 text-white text-xs flex items-center justify-center font-bold">${i+1}</span><span class="pt-0.5">${s}</span></li>`).join('')}
        </ol>
      </div>
    </div>
    <div class="mt-10 p-6 bg-herb-50 rounded-xl border border-herb-200">
      <h4 class="font-display text-lg font-bold text-herb-600 mb-2">💡 小撇步</h4>
      <p class="text-sm text-gray-600 leading-relaxed">料理的樂趣在於實驗！可以根據個人口味調整調味料的比例。第一次做不完美也沒關係，多做幾次就會找到屬於你的最佳味道。</p>
    </div>
    <div class="mt-8 flex items-center justify-between">
      <button onclick="showToast('已收藏食譜 ❤️')" class="flex items-center gap-2 text-sm text-gray-500 hover:text-cook-500 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>收藏食譜</button>
      <button onclick="showToast('已複製連結 📋')" class="flex items-center gap-2 text-sm text-gray-500 hover:text-cook-500 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>分享</button>
    </div>`;
}

function showHome(){
  document.getElementById('recipe-view').classList.add('hidden');
  document.getElementById('home-view').classList.remove('hidden');
  window.scrollTo(0,0);
}

function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),2500);}
const obs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:0.15});

renderGrid();
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
