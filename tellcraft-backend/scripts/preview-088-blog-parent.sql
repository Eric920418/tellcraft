INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'd864935f-b711-45af-a400-6fabf532c10f',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>童樂園 ParentHub</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = { theme: { extend: { colors: { parent: { 50:'#fef3c7',100:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b' }, sky: { 50:'#f0f9ff',100:'#e0f2fe',400:'#38bdf8',500:'#0ea5e9' }, pink: { 50:'#fdf2f8',100:'#fce7f3',400:'#f472b6',500:'#ec4899' } } } } } }
</script>
<style>
* { font-family: 'Nunito', sans-serif; }
body { background: #fffef7; }
.article-card { transition: all 0.3s; cursor: pointer; }
.article-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(245,158,11,0.1); }
.category-btn { transition: all 0.2s; }
.category-btn.active { background: #f59e0b; color: white; }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.faq-answer.open { max-height: 300px; }
</style>
</head>
<body>
<nav class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-yellow-100">
  <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-2"><span class="text-xl">🧒</span><span class="text-lg font-extrabold text-amber-700">童樂園</span><span class="text-xs text-amber-400 font-bold">ParentHub</span></div>
    <div class="flex items-center gap-6 text-sm text-gray-500 font-semibold">
      <a onclick="document.getElementById('articles').scrollIntoView({behavior:'smooth'})" class="hover:text-amber-500 transition cursor-pointer">育兒經</a>
      <a onclick="document.getElementById('travel').scrollIntoView({behavior:'smooth'})" class="hover:text-amber-500 transition cursor-pointer">親子遊</a>
      <a onclick="document.getElementById('education').scrollIntoView({behavior:'smooth'})" class="hover:text-amber-500 transition cursor-pointer">教育</a>
      <a onclick="document.getElementById('recommend').scrollIntoView({behavior:'smooth'})" class="hover:text-amber-500 transition cursor-pointer">好物推薦</a>
      <button onclick="document.getElementById('subscribeModal').classList.remove('hidden')" class="bg-amber-400 hover:bg-amber-500 text-white px-4 py-1.5 rounded-full text-sm font-bold transition">訂閱</button>
    </div>
  </div>
</nav>

<!-- Subscribe Modal -->
<div id="subscribeModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
    <button onclick="document.getElementById('subscribeModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
    <div class="text-center mb-6">
      <div class="text-4xl mb-2">📬</div>
      <h3 class="text-xl font-extrabold text-gray-800">訂閱童樂園電子報</h3>
      <p class="text-sm text-gray-400 mt-1">每週精選育兒好文直送信箱</p>
    </div>
    <div id="subForm">
      <input type="text" placeholder="你的暱稱" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-amber-400">
      <input type="email" placeholder="Email 地址" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-amber-400">
      <div class="text-xs text-gray-400 mb-3">感興趣的主題：</div>
      <div class="flex flex-wrap gap-2 mb-4">
        <label class="flex items-center gap-1 text-xs bg-yellow-50 px-3 py-1.5 rounded-full cursor-pointer"><input type="checkbox" class="accent-amber-500"> 育兒經驗</label>
        <label class="flex items-center gap-1 text-xs bg-sky-50 px-3 py-1.5 rounded-full cursor-pointer"><input type="checkbox" class="accent-sky-500"> 親子旅遊</label>
        <label class="flex items-center gap-1 text-xs bg-pink-50 px-3 py-1.5 rounded-full cursor-pointer"><input type="checkbox" class="accent-pink-500"> 教育觀點</label>
        <label class="flex items-center gap-1 text-xs bg-green-50 px-3 py-1.5 rounded-full cursor-pointer"><input type="checkbox" class="accent-green-500"> 好物推薦</label>
      </div>
      <button onclick="document.getElementById('subForm').innerHTML='<div class=\'text-center py-6\'><div class=\'text-5xl mb-3\'>🎉</div><p class=\'font-bold text-gray-800\'>訂閱成功！</p><p class=\'text-sm text-gray-400 mt-1\'>歡迎加入童樂園大家庭</p></div>'" class="w-full bg-amber-400 hover:bg-amber-500 text-white py-2.5 rounded-xl font-bold text-sm transition">確認訂閱</button>
    </div>
  </div>
</div>

<!-- Article Modal -->
<div id="articleModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div class="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl relative max-h-[80vh] overflow-y-auto">
    <button onclick="document.getElementById('articleModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
    <div id="articleContent"></div>
  </div>
</div>

<section class="py-14 bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50">
  <div class="max-w-6xl mx-auto px-6 flex items-center gap-12">
    <div class="flex-1">
      <span class="inline-block text-xs bg-pink-100 text-pink-500 px-3 py-1 rounded-full font-bold mb-3">🌟 本週精選</span>
      <h1 class="text-3xl font-extrabold text-gray-800 leading-snug mb-3">和孩子一起<br>探索世界的美好</h1>
      <p class="text-gray-500 text-sm leading-relaxed mb-6 max-w-md">分享育兒日常、親子旅遊、教育觀點與好物推薦。讓每個家庭都能找到屬於自己的幸福節奏。</p>
      <div class="flex gap-3">
        <button onclick="document.getElementById('articles').scrollIntoView({behavior:'smooth'})" class="bg-amber-400 hover:bg-amber-500 text-white px-6 py-2.5 rounded-full font-bold text-sm transition">開始閱讀</button>
        <button onclick="document.getElementById('subscribeModal').classList.remove('hidden')" class="border border-sky-400 text-sky-500 hover:bg-sky-50 px-6 py-2.5 rounded-full font-bold text-sm transition">加入社群</button>
      </div>
    </div>
    <div class="flex gap-3">
      <div class="w-44 h-56 rounded-2xl bg-gradient-to-b from-sky-200 to-sky-300 flex items-center justify-center text-6xl shadow-lg rotate-2">👶</div>
      <div class="w-44 h-56 rounded-2xl bg-gradient-to-b from-pink-200 to-pink-300 flex items-center justify-center text-6xl shadow-lg -rotate-2 mt-6">🎨</div>
    </div>
  </div>
</section>

<!-- Stats Bar -->
<section class="bg-white border-b border-yellow-50">
  <div class="max-w-6xl mx-auto px-6 py-6 grid grid-cols-4 gap-6 text-center">
    <div><div class="text-2xl font-extrabold text-amber-500">500+</div><div class="text-xs text-gray-400">精選文章</div></div>
    <div><div class="text-2xl font-extrabold text-sky-500">12,000+</div><div class="text-xs text-gray-400">訂閱讀者</div></div>
    <div><div class="text-2xl font-extrabold text-pink-500">50+</div><div class="text-xs text-gray-400">合作品牌</div></div>
    <div><div class="text-2xl font-extrabold text-green-500">8 位</div><div class="text-xs text-gray-400">專欄作者</div></div>
  </div>
</section>

<!-- Category Filter + Articles -->
<section id="articles" class="max-w-6xl mx-auto px-6 py-12">
  <div class="flex items-center justify-between mb-8">
    <h2 class="text-2xl font-extrabold text-gray-800">📖 最新文章</h2>
    <div class="flex gap-2">
      <button onclick="filterCategory('all')" class="category-btn active text-xs px-4 py-1.5 rounded-full border border-amber-200 font-bold">全部</button>
      <button onclick="filterCategory('parenting')" class="category-btn text-xs px-4 py-1.5 rounded-full border border-amber-200 text-amber-600 font-bold">育兒經</button>
      <button onclick="filterCategory('travel')" class="category-btn text-xs px-4 py-1.5 rounded-full border border-sky-200 text-sky-600 font-bold">親子遊</button>
      <button onclick="filterCategory('education')" class="category-btn text-xs px-4 py-1.5 rounded-full border border-pink-200 text-pink-600 font-bold">教育</button>
      <button onclick="filterCategory('recommend')" class="category-btn text-xs px-4 py-1.5 rounded-full border border-green-200 text-green-600 font-bold">好物</button>
    </div>
  </div>
  <div class="grid grid-cols-3 gap-6" id="articleGrid">
    <div class="article-card bg-white rounded-2xl overflow-hidden border border-yellow-50" data-category="parenting" onclick="showArticle('如何培養孩子的閱讀習慣','從嬰兒時期開始，每天固定 15 分鐘的親子共讀時光，選擇色彩鮮豔、觸感豐富的繪本。2-3 歲可以開始互動式閱讀，讓孩子指認圖片、翻頁。4 歲以上嘗試讓孩子看圖說故事，培養表達能力。關鍵是讓閱讀成為一種享受，而不是任務。')">
      <div class="h-36 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-5xl">📚</div>
      <div class="p-5"><span class="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold">育兒經</span><h3 class="font-bold text-gray-800 mt-2 text-sm">如何培養孩子的閱讀習慣</h3><p class="text-xs text-gray-400 mt-1 line-clamp-2">從親子共讀開始，讓閱讀成為每天最期待的時光…</p><div class="flex items-center gap-2 mt-3 text-[10px] text-gray-300"><span>2026/02/15</span><span>·</span><span>5 分鐘</span></div></div>
    </div>
    <div class="article-card bg-white rounded-2xl overflow-hidden border border-yellow-50" data-category="travel" onclick="showArticle('台北 10 大親子公園攻略','1. 大安森林公園 — 超大沙坑＋生態池 2. 榮星花園 — 蝴蝶步道適合觀察昆蟲 3. 花博新生園區 — 大草皮放風好去處 4. 碧湖公園 — 湖畔野餐首選 5. 前港公園 — 超長溜滑梯刺激好玩 6. 內湖運動公園 — 攀岩牆挑戰體能 7. 天母夢想樂園 — 9公尺高溜滑梯 8. 南港公園 — 森林系冒險遊戲場 9. 青年公園 — 水遊戲場夏天必去 10. 舞蝶共融遊戲場 — 輪椅也能玩')">
      <div class="h-36 bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center text-5xl">🏞️</div>
      <div class="p-5"><span class="text-[10px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full font-bold">親子遊</span><h3 class="font-bold text-gray-800 mt-2 text-sm">台北 10 大親子公園攻略</h3><p class="text-xs text-gray-400 mt-1 line-clamp-2">從大安森林公園到天母夢想樂園，假日遛孩子…</p><div class="flex items-center gap-2 mt-3 text-[10px] text-gray-300"><span>2026/02/12</span><span>·</span><span>8 分鐘</span></div></div>
    </div>
    <div class="article-card bg-white rounded-2xl overflow-hidden border border-yellow-50" data-category="education" onclick="showArticle('蒙特梭利在家也能做','蒙特梭利教育的核心是「跟隨孩子」。在家中可以做的事：1. 準備低矮開放式書架，讓孩子自己選書 2. 日常家務讓孩子參與（倒水、擦桌子、摺衣服）3. 感官教育：不同材質的觸摸盒 4. 數學啟蒙：實物計數比抽象數字有效 5. 自由選擇工作時段：尊重孩子的節奏。重點不是買昂貴教具，而是改變我們與孩子互動的方式。')">
      <div class="h-36 bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-5xl">🎓</div>
      <div class="p-5"><span class="text-[10px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full font-bold">教育</span><h3 class="font-bold text-gray-800 mt-2 text-sm">蒙特梭利在家也能做</h3><p class="text-xs text-gray-400 mt-1 line-clamp-2">不用昂貴教具，在家也能實踐蒙特梭利教育…</p><div class="flex items-center gap-2 mt-3 text-[10px] text-gray-300"><span>2026/02/10</span><span>·</span><span>6 分鐘</span></div></div>
    </div>
    <div class="article-card bg-white rounded-2xl overflow-hidden border border-yellow-50" data-category="recommend" onclick="showArticle('2026 兒童水壺評比 Top 5','1. Thermos 膳魔師 FHL-401F — 保冷 6 小時，彈蓋設計單手好開 2. 象印 SD-JK04 — 超輕量 230g，幼兒園首選 3. CamelBak eddy+ Kids — 咬嘴設計防漏效果最佳 4. ZOJIRUSHI SC-MC60 — 杯蓋兩用，CP 值最高 5. Hydro Flask Kids — 顏值擔當，保冷 24hr。選購重點：重量（<300g）、防漏、易清洗、BPA-free。')">
      <div class="h-36 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-5xl">🧴</div>
      <div class="p-5"><span class="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">好物推薦</span><h3 class="font-bold text-gray-800 mt-2 text-sm">2026 兒童水壺評比 Top 5</h3><p class="text-xs text-gray-400 mt-1 line-clamp-2">保冷、防漏、輕量，選水壺看這篇就夠了…</p><div class="flex items-center gap-2 mt-3 text-[10px] text-gray-300"><span>2026/02/08</span><span>·</span><span>4 分鐘</span></div></div>
    </div>
    <div class="article-card bg-white rounded-2xl overflow-hidden border border-yellow-50" data-category="parenting" onclick="showArticle('孩子鬧脾氣怎麼辦？正向教養實戰','當孩子崩潰大哭時：1. 先處理情緒，再處理事情 — 蹲下來與孩子平視 2. 說出孩子的感受「你很生氣對不對？」3. 等孩子平靜後再討論 4. 給選擇而非命令「你想先收玩具還是先刷牙？」5. 避免說「不准哭」，改說「哭完了我們再一起想辦法」。記住：每次衝突都是教孩子認識情緒的機會。')">
      <div class="h-36 bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center text-5xl">🫂</div>
      <div class="p-5"><span class="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold">育兒經</span><h3 class="font-bold text-gray-800 mt-2 text-sm">孩子鬧脾氣怎麼辦？正向教養實戰</h3><p class="text-xs text-gray-400 mt-1 line-clamp-2">正向教養不是不管教，而是用更有效的方式…</p><div class="flex items-center gap-2 mt-3 text-[10px] text-gray-300"><span>2026/02/05</span><span>·</span><span>7 分鐘</span></div></div>
    </div>
    <div class="article-card bg-white rounded-2xl overflow-hidden border border-yellow-50" data-category="travel" onclick="showArticle('帶 3 歲寶寶搭飛機全攻略','行前準備：1. 選直飛航班，避免轉機 2. 起飛降落準備棒棒糖或奶瓶（耳壓調節）3. 隨身攜帶貼紙書、小玩具、平板＋耳機 4. 多帶一套換洗衣物。機上技巧：5. 選靠走道位置方便上廁所 6. 善用起飛前放電時間讓孩子在候機室跑跳 7. 餐點選兒童餐要提前 24hr 預訂。心態最重要：接受不完美，其他旅客大多很包容。')">
      <div class="h-36 bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center text-5xl">✈️</div>
      <div class="p-5"><span class="text-[10px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full font-bold">親子遊</span><h3 class="font-bold text-gray-800 mt-2 text-sm">帶 3 歲寶寶搭飛機全攻略</h3><p class="text-xs text-gray-400 mt-1 line-clamp-2">第一次帶寶寶飛行？這些準備讓你輕鬆出發…</p><div class="flex items-center gap-2 mt-3 text-[10px] text-gray-300"><span>2026/02/01</span><span>·</span><span>10 分鐘</span></div></div>
    </div>
  </div>
</section>

<!-- Parenting Tips Section -->
<section id="education" class="bg-gradient-to-r from-sky-50 to-pink-50 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-2xl font-extrabold text-gray-800 mb-8 text-center">💡 育兒小百科</h2>
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5 text-center hover:shadow-md transition cursor-pointer">
        <div class="text-3xl mb-2">🍼</div>
        <h3 class="font-bold text-gray-800 text-sm">0-1 歲</h3>
        <p class="text-xs text-gray-400 mt-1">新生兒照護、副食品、睡眠訓練</p>
      </div>
      <div class="bg-white rounded-xl p-5 text-center hover:shadow-md transition cursor-pointer">
        <div class="text-3xl mb-2">🧸</div>
        <h3 class="font-bold text-gray-800 text-sm">1-3 歲</h3>
        <p class="text-xs text-gray-400 mt-1">語言發展、戒尿布、分離焦慮</p>
      </div>
      <div class="bg-white rounded-xl p-5 text-center hover:shadow-md transition cursor-pointer">
        <div class="text-3xl mb-2">🎒</div>
        <h3 class="font-bold text-gray-800 text-sm">3-6 歲</h3>
        <p class="text-xs text-gray-400 mt-1">幼兒園適應、社交技巧、情緒管理</p>
      </div>
      <div class="bg-white rounded-xl p-5 text-center hover:shadow-md transition cursor-pointer">
        <div class="text-3xl mb-2">📖</div>
        <h3 class="font-bold text-gray-800 text-sm">6+ 歲</h3>
        <p class="text-xs text-gray-400 mt-1">課業壓力、同儕關係、自主學習</p>
      </div>
    </div>
  </div>
</section>

<!-- Popular Travel Destinations -->
<section id="travel" class="max-w-6xl mx-auto px-6 py-12">
  <h2 class="text-2xl font-extrabold text-gray-800 mb-8">🗺️ 熱門親子旅遊</h2>
  <div class="grid grid-cols-3 gap-5">
    <div class="group relative h-48 rounded-2xl overflow-hidden cursor-pointer" onclick="showArticle('宜蘭 2 天 1 夜親子遊','Day 1：梅花湖騎腳踏車 → 羅東夜市 → 入住親子民宿。Day 2：蠟筆工廠 DIY → 幾米公園拍照 → 傳藝中心看布袋戲。推薦住宿：蘭城晶英（有超大遊戲室）。交通建議：自駕最方便，雪隧假日下午回程易塞車。')">
      <div class="absolute inset-0 bg-gradient-to-br from-sky-300 to-cyan-400 flex items-center justify-center text-6xl">🏔️</div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <div class="absolute bottom-4 left-4 text-white"><h3 class="font-bold">宜蘭 2 天 1 夜</h3><p class="text-xs text-white/70">梅花湖、傳藝中心、蠟筆工廠</p></div>
    </div>
    <div class="group relative h-48 rounded-2xl overflow-hidden cursor-pointer" onclick="showArticle('台中科博館＋草悟道一日遊','上午：國立自然科學博物館（太空劇場必看！）→ 中午：草悟道周邊美食 → 下午：勤美術館互動展覽 → 秋紅谷公園散步。科博館門票：一般展示 100 元、太空劇場 100 元（6 歲以下免費）。午餐推薦：肉蛋吐司、春水堂。')">
      <div class="absolute inset-0 bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center text-6xl">🦕</div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <div class="absolute bottom-4 left-4 text-white"><h3 class="font-bold">台中科博館一日遊</h3><p class="text-xs text-white/70">恐龍展、太空劇場、草悟道</p></div>
    </div>
    <div class="group relative h-48 rounded-2xl overflow-hidden cursor-pointer" onclick="showArticle('墾丁海生館住一晚','全台唯一可以「夜宿海生館」的體驗！晚上看魚群在頭頂游泳入睡。行程：15:30 報到 → 後場導覽 → 晚餐 → 夜間探索 → 就寢 → 隔天潮間帶觀察。費用：大人 2380/人、3-5 歲 1090/人。建議提前 2 個月預訂，暑假秒殺。')">
      <div class="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-6xl">🐠</div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <div class="absolute bottom-4 left-4 text-white"><h3 class="font-bold">夜宿海生館</h3><p class="text-xs text-white/70">與魚群共眠的奇幻體驗</p></div>
    </div>
  </div>
</section>

<!-- Recommended Products -->
<section id="recommend" class="bg-amber-50/50 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-2xl font-extrabold text-gray-800 mb-8 text-center">🌟 好物推薦排行榜</h2>
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5 text-center hover:shadow-md transition cursor-pointer border border-yellow-100">
        <div class="text-3xl mb-2">🧸</div>
        <div class="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full inline-block font-bold mb-2">TOP 1</div>
        <h3 class="font-bold text-gray-800 text-xs">LEGO DUPLO 動物園</h3>
        <p class="text-xs text-amber-500 font-bold mt-1">$1,299</p>
        <div class="text-[10px] text-gray-400 mt-1">⭐ 4.9（328 則評價）</div>
      </div>
      <div class="bg-white rounded-xl p-5 text-center hover:shadow-md transition cursor-pointer border border-yellow-100">
        <div class="text-3xl mb-2">📖</div>
        <div class="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full inline-block font-bold mb-2">TOP 2</div>
        <h3 class="font-bold text-gray-800 text-xs">小熊繪本套組（10冊）</h3>
        <p class="text-xs text-amber-500 font-bold mt-1">$899</p>
        <div class="text-[10px] text-gray-400 mt-1">⭐ 4.8（215 則評價）</div>
      </div>
      <div class="bg-white rounded-xl p-5 text-center hover:shadow-md transition cursor-pointer border border-yellow-100">
        <div class="text-3xl mb-2">🎨</div>
        <div class="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full inline-block font-bold mb-2">TOP 3</div>
        <h3 class="font-bold text-gray-800 text-xs">無毒蠟筆 24 色</h3>
        <p class="text-xs text-amber-500 font-bold mt-1">$450</p>
        <div class="text-[10px] text-gray-400 mt-1">⭐ 4.7（189 則評價）</div>
      </div>
      <div class="bg-white rounded-xl p-5 text-center hover:shadow-md transition cursor-pointer border border-yellow-100">
        <div class="text-3xl mb-2">🛁</div>
        <div class="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full inline-block font-bold mb-2">TOP 4</div>
        <h3 class="font-bold text-gray-800 text-xs">洗澡玩具釣魚組</h3>
        <p class="text-xs text-amber-500 font-bold mt-1">$350</p>
        <div class="text-[10px] text-gray-400 mt-1">⭐ 4.6（142 則評價）</div>
      </div>
    </div>
  </div>
</section>

<!-- FAQ Section -->
<section class="max-w-6xl mx-auto px-6 py-12">
  <h2 class="text-2xl font-extrabold text-gray-800 mb-8 text-center">❓ 常見問題</h2>
  <div class="max-w-2xl mx-auto space-y-3">
    <div class="bg-white rounded-xl border border-yellow-100 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-gray-800 hover:bg-yellow-50 transition"><span>如何投稿文章？</span><span class="text-amber-400 text-lg">+</span></button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500">歡迎所有爸媽投稿！請將文章寄到 editor@parenthub.tw，我們會在 3 個工作天內回覆。文章長度建議 800-2000 字，附上 2-3 張照片更佳。錄取稿件提供稿費 $500-2000。</div>
    </div>
    <div class="bg-white rounded-xl border border-yellow-100 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-gray-800 hover:bg-yellow-50 transition"><span>電子報多久發一次？</span><span class="text-amber-400 text-lg">+</span></button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500">每週五固定發送，內容包含當週精選文章、育兒小撇步和限定折扣碼。訂閱完全免費，隨時可以取消。</div>
    </div>
    <div class="bg-white rounded-xl border border-yellow-100 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-gray-800 hover:bg-yellow-50 transition"><span>可以轉載文章嗎？</span><span class="text-amber-400 text-lg">+</span></button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500">歡迎非營利轉載，請註明出處並附上原文連結。商業使用請來信洽詢授權：biz@parenthub.tw。</div>
    </div>
    <div class="bg-white rounded-xl border border-yellow-100 overflow-hidden">
      <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-gray-800 hover:bg-yellow-50 transition"><span>有合作邀約如何聯繫？</span><span class="text-amber-400 text-lg">+</span></button>
      <div class="faq-answer px-4 pb-4 text-xs text-gray-500">品牌合作、團購開箱、活動邀約請洽 biz@parenthub.tw。我們只推薦真心喜歡且實測過的產品，拒絕所有菸酒及不適合兒童的內容合作。</div>
    </div>
  </div>
</section>

<!-- Author Team -->
<section class="bg-gradient-to-r from-pink-50 to-amber-50 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-2xl font-extrabold text-gray-800 mb-8 text-center">✍️ 專欄作者群</h2>
    <div class="grid grid-cols-4 gap-5">
      <div class="bg-white rounded-xl p-5 text-center hover:shadow-md transition">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center text-2xl mx-auto mb-3">👩</div>
        <h3 class="font-bold text-gray-800 text-sm">小美媽媽</h3>
        <p class="text-[10px] text-amber-500 font-bold">育兒經 · 正向教養</p>
        <p class="text-xs text-gray-400 mt-1">二寶媽，正向教養講師</p>
      </div>
      <div class="bg-white rounded-xl p-5 text-center hover:shadow-md transition">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-sky-200 to-blue-300 flex items-center justify-center text-2xl mx-auto mb-3">👨</div>
        <h3 class="font-bold text-gray-800 text-sm">旅行老爸</h3>
        <p class="text-[10px] text-sky-500 font-bold">親子旅遊 · 露營</p>
        <p class="text-xs text-gray-400 mt-1">帶女兒走過 15 個國家</p>
      </div>
      <div class="bg-white rounded-xl p-5 text-center hover:shadow-md transition">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center text-2xl mx-auto mb-3">👩‍🏫</div>
        <h3 class="font-bold text-gray-800 text-sm">Amy 老師</h3>
        <p class="text-[10px] text-pink-500 font-bold">教育觀點 · 蒙特梭利</p>
        <p class="text-xs text-gray-400 mt-1">幼教系教授，15 年教學經驗</p>
      </div>
      <div class="bg-white rounded-xl p-5 text-center hover:shadow-md transition">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-green-200 to-emerald-300 flex items-center justify-center text-2xl mx-auto mb-3">🧑‍⚕️</div>
        <h3 class="font-bold text-gray-800 text-sm">陳醫師</h3>
        <p class="text-[10px] text-green-500 font-bold">兒童健康 · 發展評估</p>
        <p class="text-xs text-gray-400 mt-1">小兒科主治醫師</p>
      </div>
    </div>
  </div>
</section>

<!-- Newsletter CTA -->
<section class="max-w-6xl mx-auto px-6 py-12">
  <div class="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-10 text-center text-white">
    <div class="text-4xl mb-3">💌</div>
    <h2 class="text-2xl font-extrabold mb-2">加入 12,000+ 爸媽的育兒圈</h2>
    <p class="text-sm text-white/80 mb-6">每週五收到精選好文、育兒撇步和獨家折扣碼</p>
    <button onclick="document.getElementById('subscribeModal').classList.remove('hidden')" class="bg-white text-amber-600 px-8 py-3 rounded-full font-bold hover:bg-amber-50 transition shadow-lg">免費訂閱電子報</button>
  </div>
</section>

<footer class="bg-gray-800 text-gray-400 py-8">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2"><span class="text-xl">🧒</span><span class="text-white font-extrabold">童樂園</span></div>
      <div class="flex gap-6 text-xs">
        <a class="hover:text-white transition cursor-pointer">關於我們</a>
        <a class="hover:text-white transition cursor-pointer">投稿須知</a>
        <a class="hover:text-white transition cursor-pointer">隱私權政策</a>
        <a class="hover:text-white transition cursor-pointer">合作邀約</a>
      </div>
    </div>
    <div class="text-xs text-gray-500 mt-4 text-center">© 2026 ParentHub · 用愛陪伴每個成長瞬間</div>
  </div>
</footer>

<script>
function filterCategory(cat) {
  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('#articleGrid > div').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
  });
}
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const icon = btn.querySelector('span:last-child');
  answer.classList.toggle('open');
  icon.textContent = answer.classList.contains('open') ? '−' : '+';
}
function showArticle(title, content) {
  document.getElementById('articleContent').innerHTML = '<h3 class="text-xl font-extrabold text-gray-800 mb-4">' + title + '</h3><p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">' + content + '</p><button onclick="document.getElementById(\'articleModal\').classList.add(\'hidden\')" class="mt-6 bg-amber-400 hover:bg-amber-500 text-white px-6 py-2 rounded-full font-bold text-sm transition">返回</button>';
  document.getElementById('articleModal').classList.remove('hidden');
}
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
