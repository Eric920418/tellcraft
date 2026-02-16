INSERT INTO template_previews (template_id, html_content, version)
VALUES ('ba7c15b5-d9fd-42f9-a9c6-1d3ca253a9f6', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>小太陽幼兒園 SunKids</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{sun:'#f59e0b',sky:'#38bdf8',grass:'#4ade80',berry:'#f472b6',cloud:'#f0f9ff',sand:'#fef3c7'},fontFamily:{nunito:['Nunito','sans-serif']}}}}
</script>
<style>
*{font-family:'Nunito',sans-serif}
html{scroll-behavior:smooth}
.float-slow{animation:floatSlow 6s ease-in-out infinite}
.float-mid{animation:floatSlow 4s ease-in-out infinite 1s}
.float-fast{animation:floatSlow 3s ease-in-out infinite 0.5s}
@keyframes floatSlow{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}
.bounce-in{animation:bounceIn 0.6s cubic-bezier(0.68,-0.55,0.265,1.55)}
@keyframes bounceIn{0%{opacity:0;transform:scale(0.3)}100%{opacity:1;transform:scale(1)}}
.cloud-move{animation:cloudMove 20s linear infinite}
@keyframes cloudMove{0%{transform:translateX(-100%)}100%{transform:translateX(calc(100vw + 100%))}}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.wiggle:hover{animation:wiggle 0.5s ease-in-out}
@keyframes wiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}
</style>
</head>
<body class="bg-cloud overflow-x-hidden">

<!-- Floating Clouds -->
<div class="fixed top-10 left-0 z-0 opacity-30 pointer-events-none">
  <div class="cloud-move text-7xl" style="animation-delay:0s">☁️</div>
</div>
<div class="fixed top-32 left-0 z-0 opacity-20 pointer-events-none">
  <div class="cloud-move text-5xl" style="animation-delay:-8s">☁️</div>
</div>
<div class="fixed top-56 left-0 z-0 opacity-15 pointer-events-none">
  <div class="cloud-move text-6xl" style="animation-delay:-14s">☁️</div>
</div>

<!-- Nav -->
<nav class="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 shadow-sm">
  <div class="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-3xl">🌞</span>
      <span class="text-xl font-black text-sun">小太陽幼兒園</span>
    </div>
    <div class="hidden md:flex items-center gap-6 text-sm font-bold text-gray-600">
      <a href="#about" class="hover:text-sun transition-colors cursor-pointer">關於我們</a>
      <a href="#programs" class="hover:text-sun transition-colors cursor-pointer">課程介紹</a>
      <a href="#teachers" class="hover:text-sun transition-colors cursor-pointer">師資陣容</a>
      <a href="#gallery" class="hover:text-sun transition-colors cursor-pointer">生活花絮</a>
      <a href="#contact" class="hover:text-sun transition-colors cursor-pointer">聯絡我們</a>
    </div>
    <button onclick="document.getElementById('enrollModal').classList.remove('hidden')" class="bg-sun text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-amber-600 transition-colors cursor-pointer shadow-lg shadow-amber-200">
      立即報名 🎒
    </button>
  </div>
</nav>

<!-- Hero -->
<section class="relative pt-28 pb-20 overflow-hidden">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex flex-col lg:flex-row items-center gap-12">
      <div class="flex-1 text-center lg:text-left">
        <div class="inline-block bg-sand text-sun px-4 py-1.5 rounded-full text-sm font-bold mb-6">🌈 2026 秋季班招生中</div>
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-black text-gray-800 leading-tight mb-6">
          用<span class="text-sun">愛</span>與<span class="text-sky">陪伴</span><br>
          點亮每一顆<span class="text-berry">小星星</span>
        </h1>
        <p class="text-gray-500 text-lg mb-8 max-w-lg mx-auto lg:mx-0">
          我們相信每個孩子都是獨特的，透過遊戲中學習、探索中成長，讓小小世界充滿無限可能。
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
          <button onclick="document.getElementById('enrollModal').classList.remove('hidden')" class="bg-sun text-white px-8 py-3.5 rounded-full font-bold text-lg hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer">
            預約參觀 →
          </button>
          <a href="#programs" class="border-2 border-gray-300 text-gray-600 px-8 py-3.5 rounded-full font-bold text-lg hover:border-sun hover:text-sun transition-all cursor-pointer text-center">
            了解課程
          </a>
        </div>
        <div class="flex gap-8 mt-10 justify-center lg:justify-start">
          <div class="text-center">
            <div class="text-2xl font-black text-sun">15+</div>
            <div class="text-xs text-gray-400 font-bold">年辦學經驗</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-black text-grass">200+</div>
            <div class="text-xs text-gray-400 font-bold">快樂小朋友</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-black text-sky">98%</div>
            <div class="text-xs text-gray-400 font-bold">家長滿意度</div>
          </div>
        </div>
      </div>
      <div class="flex-1 relative">
        <div class="bg-gradient-to-br from-sand via-amber-100 to-sky/20 rounded-[3rem] p-8 relative">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white rounded-2xl p-6 text-center shadow-md float-slow wiggle">
              <div class="text-5xl mb-2">🎨</div>
              <div class="font-bold text-gray-700 text-sm">創意美術</div>
            </div>
            <div class="bg-white rounded-2xl p-6 text-center shadow-md float-mid wiggle">
              <div class="text-5xl mb-2">🎵</div>
              <div class="font-bold text-gray-700 text-sm">音樂律動</div>
            </div>
            <div class="bg-white rounded-2xl p-6 text-center shadow-md float-fast wiggle">
              <div class="text-5xl mb-2">🌱</div>
              <div class="font-bold text-gray-700 text-sm">自然探索</div>
            </div>
            <div class="bg-white rounded-2xl p-6 text-center shadow-md float-slow wiggle">
              <div class="text-5xl mb-2">📚</div>
              <div class="font-bold text-gray-700 text-sm">繪本故事</div>
            </div>
          </div>
          <div class="absolute -top-4 -right-4 text-4xl float-fast">⭐</div>
          <div class="absolute -bottom-4 -left-4 text-4xl float-mid">🌈</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- About -->
<section id="about" class="py-20 bg-white relative">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-4xl">🏫</span>
      <h2 class="text-3xl md:text-4xl font-black text-gray-800 mt-4">關於小太陽</h2>
      <p class="text-gray-400 mt-3 max-w-md mx-auto">一個讓孩子安心成長、快樂學習的溫暖家園</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-gradient-to-br from-amber-50 to-sand p-8 rounded-3xl text-center reveal group hover:shadow-xl transition-all">
        <div class="w-16 h-16 bg-sun/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl group-hover:scale-110 transition-transform">🌟</div>
        <h3 class="font-black text-gray-800 text-lg mb-3">啟發式教學</h3>
        <p class="text-gray-500 text-sm leading-relaxed">不以填鴨式教育為目標，透過主題式教學引導孩子主動探索，培養獨立思考能力與好奇心。</p>
      </div>
      <div class="bg-gradient-to-br from-sky/10 to-blue-50 p-8 rounded-3xl text-center reveal group hover:shadow-xl transition-all" style="transition-delay:0.1s">
        <div class="w-16 h-16 bg-sky/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl group-hover:scale-110 transition-transform">🤗</div>
        <h3 class="font-black text-gray-800 text-lg mb-3">安全友善環境</h3>
        <p class="text-gray-500 text-sm leading-relaxed">全園區安全防護、即時監控系統、空氣清淨設備，讓每位家長安心託付。</p>
      </div>
      <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-3xl text-center reveal group hover:shadow-xl transition-all" style="transition-delay:0.2s">
        <div class="w-16 h-16 bg-grass/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl group-hover:scale-110 transition-transform">🌍</div>
        <h3 class="font-black text-gray-800 text-lg mb-3">雙語沉浸</h3>
        <p class="text-gray-500 text-sm leading-relaxed">中英雙語環境，外籍教師日常互動，讓語言學習自然而然融入生活。</p>
      </div>
    </div>
  </div>
</section>

<!-- Programs -->
<section id="programs" class="py-20 bg-gradient-to-b from-cloud to-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-4xl">📖</span>
      <h2 class="text-3xl md:text-4xl font-black text-gray-800 mt-4">特色課程</h2>
      <p class="text-gray-400 mt-3">六大領域均衡發展，每一天都充滿驚喜</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all reveal group cursor-pointer border-2 border-transparent hover:border-sun/30">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🎨</div>
          <div>
            <h3 class="font-black text-gray-800">創意美術</h3>
            <span class="text-xs text-red-400 font-bold">2-6 歲</span>
          </div>
        </div>
        <p class="text-gray-500 text-sm leading-relaxed">水彩、黏土、拼貼、手作⋯用雙手探索色彩的無限可能，每件作品都是獨一無二的創作。</p>
        <div class="flex gap-2 mt-4">
          <span class="bg-red-50 text-red-400 text-xs px-2.5 py-1 rounded-full font-bold">水彩</span>
          <span class="bg-red-50 text-red-400 text-xs px-2.5 py-1 rounded-full font-bold">黏土</span>
          <span class="bg-red-50 text-red-400 text-xs px-2.5 py-1 rounded-full font-bold">手作</span>
        </div>
      </div>
      <div class="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all reveal group cursor-pointer border-2 border-transparent hover:border-sun/30" style="transition-delay:0.05s">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🎵</div>
          <div>
            <h3 class="font-black text-gray-800">音樂律動</h3>
            <span class="text-xs text-purple-400 font-bold">2-6 歲</span>
          </div>
        </div>
        <p class="text-gray-500 text-sm leading-relaxed">奧福音樂教學法，透過唱歌、打擊樂器、肢體律動，培養節奏感與音樂素養。</p>
        <div class="flex gap-2 mt-4">
          <span class="bg-purple-50 text-purple-400 text-xs px-2.5 py-1 rounded-full font-bold">奧福</span>
          <span class="bg-purple-50 text-purple-400 text-xs px-2.5 py-1 rounded-full font-bold">打擊樂</span>
          <span class="bg-purple-50 text-purple-400 text-xs px-2.5 py-1 rounded-full font-bold">律動</span>
        </div>
      </div>
      <div class="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all reveal group cursor-pointer border-2 border-transparent hover:border-sun/30" style="transition-delay:0.1s">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🌱</div>
          <div>
            <h3 class="font-black text-gray-800">自然生態</h3>
            <span class="text-xs text-green-500 font-bold">3-6 歲</span>
          </div>
        </div>
        <p class="text-gray-500 text-sm leading-relaxed">校園菜圃、昆蟲觀察、戶外探索⋯親近大自然，認識四季變化與生命循環。</p>
        <div class="flex gap-2 mt-4">
          <span class="bg-green-50 text-green-500 text-xs px-2.5 py-1 rounded-full font-bold">菜圃</span>
          <span class="bg-green-50 text-green-500 text-xs px-2.5 py-1 rounded-full font-bold">觀察</span>
          <span class="bg-green-50 text-green-500 text-xs px-2.5 py-1 rounded-full font-bold">探索</span>
        </div>
      </div>
      <div class="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all reveal group cursor-pointer border-2 border-transparent hover:border-sun/30" style="transition-delay:0.15s">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🔤</div>
          <div>
            <h3 class="font-black text-gray-800">雙語教學</h3>
            <span class="text-xs text-blue-400 font-bold">3-6 歲</span>
          </div>
        </div>
        <p class="text-gray-500 text-sm leading-relaxed">外籍教師帶領，透過歌曲、遊戲、繪本，讓英文成為生活的一部分。</p>
        <div class="flex gap-2 mt-4">
          <span class="bg-blue-50 text-blue-400 text-xs px-2.5 py-1 rounded-full font-bold">外師</span>
          <span class="bg-blue-50 text-blue-400 text-xs px-2.5 py-1 rounded-full font-bold">繪本</span>
          <span class="bg-blue-50 text-blue-400 text-xs px-2.5 py-1 rounded-full font-bold">遊戲</span>
        </div>
      </div>
      <div class="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all reveal group cursor-pointer border-2 border-transparent hover:border-sun/30" style="transition-delay:0.2s">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🧮</div>
          <div>
            <h3 class="font-black text-gray-800">邏輯思維</h3>
            <span class="text-xs text-amber-500 font-bold">4-6 歲</span>
          </div>
        </div>
        <p class="text-gray-500 text-sm leading-relaxed">積木、拼圖、桌遊、簡易編程⋯在遊戲中培養邏輯推理與問題解決能力。</p>
        <div class="flex gap-2 mt-4">
          <span class="bg-amber-50 text-amber-500 text-xs px-2.5 py-1 rounded-full font-bold">積木</span>
          <span class="bg-amber-50 text-amber-500 text-xs px-2.5 py-1 rounded-full font-bold">桌遊</span>
          <span class="bg-amber-50 text-amber-500 text-xs px-2.5 py-1 rounded-full font-bold">編程</span>
        </div>
      </div>
      <div class="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all reveal group cursor-pointer border-2 border-transparent hover:border-sun/30" style="transition-delay:0.25s">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🤸</div>
          <div>
            <h3 class="font-black text-gray-800">體適能</h3>
            <span class="text-xs text-pink-400 font-bold">2-6 歲</span>
          </div>
        </div>
        <p class="text-gray-500 text-sm leading-relaxed">感覺統合、體操、球類運動⋯強健體魄，培養團隊合作與運動精神。</p>
        <div class="flex gap-2 mt-4">
          <span class="bg-pink-50 text-pink-400 text-xs px-2.5 py-1 rounded-full font-bold">體操</span>
          <span class="bg-pink-50 text-pink-400 text-xs px-2.5 py-1 rounded-full font-bold">統合</span>
          <span class="bg-pink-50 text-pink-400 text-xs px-2.5 py-1 rounded-full font-bold">球類</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Daily Schedule -->
<section class="py-20 bg-white">
  <div class="max-w-4xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-4xl">⏰</span>
      <h2 class="text-3xl md:text-4xl font-black text-gray-800 mt-4">一日作息</h2>
      <p class="text-gray-400 mt-3">規律中有彈性，讓每一天都充實又快樂</p>
    </div>
    <div class="space-y-4 reveal">
      <div class="flex items-center gap-4 bg-amber-50 rounded-2xl p-4 hover:shadow-md transition-all">
        <div class="w-16 h-16 bg-sun rounded-xl flex flex-col items-center justify-center text-white font-black flex-shrink-0">
          <div class="text-xs">AM</div><div class="text-lg">7:30</div>
        </div>
        <div>
          <h4 class="font-bold text-gray-800">入園迎接 ☀️</h4>
          <p class="text-gray-500 text-sm">晨間自由探索、角落活動</p>
        </div>
      </div>
      <div class="flex items-center gap-4 bg-sky/5 rounded-2xl p-4 hover:shadow-md transition-all">
        <div class="w-16 h-16 bg-sky rounded-xl flex flex-col items-center justify-center text-white font-black flex-shrink-0">
          <div class="text-xs">AM</div><div class="text-lg">9:00</div>
        </div>
        <div>
          <h4 class="font-bold text-gray-800">主題教學 📖</h4>
          <p class="text-gray-500 text-sm">中英雙語課程、團體活動</p>
        </div>
      </div>
      <div class="flex items-center gap-4 bg-green-50 rounded-2xl p-4 hover:shadow-md transition-all">
        <div class="w-16 h-16 bg-grass rounded-xl flex flex-col items-center justify-center text-white font-black flex-shrink-0">
          <div class="text-xs">AM</div><div class="text-lg">10:30</div>
        </div>
        <div>
          <h4 class="font-bold text-gray-800">戶外活動 🌳</h4>
          <p class="text-gray-500 text-sm">操場遊戲、體適能、自然觀察</p>
        </div>
      </div>
      <div class="flex items-center gap-4 bg-red-50 rounded-2xl p-4 hover:shadow-md transition-all">
        <div class="w-16 h-16 bg-red-400 rounded-xl flex flex-col items-center justify-center text-white font-black flex-shrink-0">
          <div class="text-xs">PM</div><div class="text-lg">12:00</div>
        </div>
        <div>
          <h4 class="font-bold text-gray-800">營養午餐 🍱</h4>
          <p class="text-gray-500 text-sm">專業營養師設計、新鮮食材現煮</p>
        </div>
      </div>
      <div class="flex items-center gap-4 bg-purple-50 rounded-2xl p-4 hover:shadow-md transition-all">
        <div class="w-16 h-16 bg-purple-400 rounded-xl flex flex-col items-center justify-center text-white font-black flex-shrink-0">
          <div class="text-xs">PM</div><div class="text-lg">1:00</div>
        </div>
        <div>
          <h4 class="font-bold text-gray-800">午休時光 😴</h4>
          <p class="text-gray-500 text-sm">舒適休息環境，輕柔音樂伴入眠</p>
        </div>
      </div>
      <div class="flex items-center gap-4 bg-pink-50 rounded-2xl p-4 hover:shadow-md transition-all">
        <div class="w-16 h-16 bg-berry rounded-xl flex flex-col items-center justify-center text-white font-black flex-shrink-0">
          <div class="text-xs">PM</div><div class="text-lg">2:30</div>
        </div>
        <div>
          <h4 class="font-bold text-gray-800">特色課程 🎨</h4>
          <p class="text-gray-500 text-sm">美術 / 音樂 / 體操 / 程式 輪替</p>
        </div>
      </div>
      <div class="flex items-center gap-4 bg-amber-50 rounded-2xl p-4 hover:shadow-md transition-all">
        <div class="w-16 h-16 bg-amber-500 rounded-xl flex flex-col items-center justify-center text-white font-black flex-shrink-0">
          <div class="text-xs">PM</div><div class="text-lg">4:30</div>
        </div>
        <div>
          <h4 class="font-bold text-gray-800">放學接送 🚗</h4>
          <p class="text-gray-500 text-sm">點心時間、整理書包、快樂回家</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Teachers -->
<section id="teachers" class="py-20 bg-gradient-to-b from-cloud to-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-4xl">👩‍🏫</span>
      <h2 class="text-3xl md:text-4xl font-black text-gray-800 mt-4">師資陣容</h2>
      <p class="text-gray-400 mt-3">每一位老師都擁有幼教專業證照與滿滿的愛心</p>
    </div>
    <div class="grid md:grid-cols-4 gap-6">
      <div class="bg-white rounded-3xl p-6 text-center shadow-md hover:shadow-xl transition-all reveal wiggle cursor-pointer">
        <div class="w-20 h-20 bg-gradient-to-br from-sun to-amber-400 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">👩‍🏫</div>
        <h3 class="font-black text-gray-800">陳園長</h3>
        <p class="text-sun text-xs font-bold mb-2">園長 · 20年經驗</p>
        <p class="text-gray-400 text-xs">幼兒教育碩士，蒙特梭利國際認證，堅持每個孩子都值得最好的教育。</p>
      </div>
      <div class="bg-white rounded-3xl p-6 text-center shadow-md hover:shadow-xl transition-all reveal wiggle cursor-pointer" style="transition-delay:0.1s">
        <div class="w-20 h-20 bg-gradient-to-br from-sky to-blue-400 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">👩‍🎨</div>
        <h3 class="font-black text-gray-800">林老師</h3>
        <p class="text-sky text-xs font-bold mb-2">美術老師 · 8年經驗</p>
        <p class="text-gray-400 text-xs">美術系畢業，擅長引導孩子用色彩表達情感，作品曾獲全國幼兒美術獎。</p>
      </div>
      <div class="bg-white rounded-3xl p-6 text-center shadow-md hover:shadow-xl transition-all reveal wiggle cursor-pointer" style="transition-delay:0.2s">
        <div class="w-20 h-20 bg-gradient-to-br from-grass to-emerald-400 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">🧑‍🏫</div>
        <h3 class="font-black text-gray-800">Sarah</h3>
        <p class="text-grass text-xs font-bold mb-2">外籍教師 · TESOL認證</p>
        <p class="text-gray-400 text-xs">來自加拿大，活潑熱情，讓孩子在歡笑中自然學會英文對話。</p>
      </div>
      <div class="bg-white rounded-3xl p-6 text-center shadow-md hover:shadow-xl transition-all reveal wiggle cursor-pointer" style="transition-delay:0.3s">
        <div class="w-20 h-20 bg-gradient-to-br from-berry to-pink-400 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">👩‍⚕️</div>
        <h3 class="font-black text-gray-800">李護理師</h3>
        <p class="text-berry text-xs font-bold mb-2">校護 · 12年經驗</p>
        <p class="text-gray-400 text-xs">護理系畢業，擁有CPR急救證照，時刻守護每位小朋友的健康安全。</p>
      </div>
    </div>
  </div>
</section>

<!-- Gallery -->
<section id="gallery" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-4xl">📸</span>
      <h2 class="text-3xl md:text-4xl font-black text-gray-800 mt-4">生活花絮</h2>
      <p class="text-gray-400 mt-3">記錄每一個成長的珍貴瞬間</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 reveal">
      <div class="bg-gradient-to-br from-red-100 to-red-200 rounded-2xl aspect-square flex items-center justify-center text-6xl hover:scale-105 transition-transform cursor-pointer">🎨</div>
      <div class="bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl aspect-square flex items-center justify-center text-6xl hover:scale-105 transition-transform cursor-pointer">🏃‍♂️</div>
      <div class="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl aspect-square flex items-center justify-center text-6xl hover:scale-105 transition-transform cursor-pointer">🌻</div>
      <div class="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl aspect-square flex items-center justify-center text-6xl hover:scale-105 transition-transform cursor-pointer">📚</div>
      <div class="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl aspect-square flex items-center justify-center text-6xl hover:scale-105 transition-transform cursor-pointer">🎶</div>
      <div class="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl aspect-square flex items-center justify-center text-6xl hover:scale-105 transition-transform cursor-pointer">🎂</div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="py-20 bg-gradient-to-b from-sand/30 to-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-4xl">💬</span>
      <h2 class="text-3xl md:text-4xl font-black text-gray-800 mt-4">家長好評</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="bg-white rounded-3xl p-6 shadow-md reveal">
        <div class="flex gap-1 text-sun mb-3">★★★★★</div>
        <p class="text-gray-600 text-sm leading-relaxed mb-4">「女兒從害羞不說話，到現在每天開心唱歌回家。老師們真的很用心，能感受到滿滿的愛。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">👩</div>
          <div>
            <div class="font-bold text-gray-800 text-sm">小安媽媽</div>
            <div class="text-gray-400 text-xs">中班家長</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-3xl p-6 shadow-md reveal" style="transition-delay:0.1s">
        <div class="flex gap-1 text-sun mb-3">★★★★★</div>
        <p class="text-gray-600 text-sm leading-relaxed mb-4">「環境很乾淨、餐點營養均衡，最棒的是雙語教學，兒子回家會蹦出英文單字了！」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">👨</div>
          <div>
            <div class="font-bold text-gray-800 text-sm">小宇爸爸</div>
            <div class="text-gray-400 text-xs">大班家長</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-3xl p-6 shadow-md reveal" style="transition-delay:0.2s">
        <div class="flex gap-1 text-sun mb-3">★★★★★</div>
        <p class="text-gray-600 text-sm leading-relaxed mb-4">「比較了好幾家幼兒園，小太陽的師生比和課程規劃最讓人放心，推薦給身邊的家長朋友。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">👩</div>
          <div>
            <div class="font-bold text-gray-800 text-sm">小恩媽媽</div>
            <div class="text-gray-400 text-xs">小班家長</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-4xl">📍</span>
      <h2 class="text-3xl md:text-4xl font-black text-gray-800 mt-4">聯絡我們</h2>
    </div>
    <div class="grid md:grid-cols-2 gap-12 reveal">
      <div>
        <div class="space-y-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-sun/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">📍</div>
            <div>
              <h4 class="font-bold text-gray-800">地址</h4>
              <p class="text-gray-500 text-sm">台北市大安區和平東路二段 123 號</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-sky/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">📞</div>
            <div>
              <h4 class="font-bold text-gray-800">電話</h4>
              <p class="text-gray-500 text-sm">(02) 2700-1234</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-grass/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">⏰</div>
            <div>
              <h4 class="font-bold text-gray-800">開放時間</h4>
              <p class="text-gray-500 text-sm">週一至週五 07:30 - 18:00<br>週六參觀日 09:00 - 12:00（需預約）</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-berry/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🚌</div>
            <div>
              <h4 class="font-bold text-gray-800">交通</h4>
              <p class="text-gray-500 text-sm">捷運科技大樓站步行 5 分鐘<br>附設家長接送專用停車區</p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div class="bg-cloud rounded-3xl p-8">
          <h3 class="font-black text-gray-800 text-lg mb-6">✉️ 預約參觀</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <input type="text" placeholder="家長姓名" class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sun focus:outline-none text-sm">
              <input type="tel" placeholder="聯絡電話" class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sun focus:outline-none text-sm">
            </div>
            <input type="text" placeholder="小朋友年齡（如：3 歲）" class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sun focus:outline-none text-sm">
            <select class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sun focus:outline-none text-sm text-gray-500">
              <option>想了解的班級</option>
              <option>幼幼班（2-3歲）</option>
              <option>小班（3-4歲）</option>
              <option>中班（4-5歲）</option>
              <option>大班（5-6歲）</option>
            </select>
            <textarea placeholder="想詢問的問題..." rows="3" class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sun focus:outline-none text-sm resize-none"></textarea>
            <button onclick="showToast('已收到您的預約！我們將在 24 小時內與您聯繫 ☀️')" class="w-full bg-sun text-white py-3.5 rounded-xl font-bold hover:bg-amber-600 transition-colors cursor-pointer shadow-lg shadow-amber-200">
              送出預約 🌟
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-gray-800 text-white py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🌞</span>
        <span class="font-black text-lg">小太陽幼兒園 SunKids</span>
      </div>
      <div class="flex gap-4">
        <div class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-sun transition-colors cursor-pointer">📘</div>
        <div class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-sun transition-colors cursor-pointer">📷</div>
        <div class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-sun transition-colors cursor-pointer">📺</div>
        <div class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-grass transition-colors cursor-pointer">💬</div>
      </div>
      <p class="text-gray-400 text-sm">© 2026 小太陽幼兒園 SunKids. All rights reserved.</p>
    </div>
  </div>
</footer>

<!-- Enroll Modal -->
<div id="enrollModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
    <div class="flex items-center justify-between mb-6">
      <h3 class="font-black text-xl text-gray-800">🎒 立即報名</h3>
      <button onclick="document.getElementById('enrollModal').classList.add('hidden')" class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 cursor-pointer">✕</button>
    </div>
    <div class="space-y-4">
      <input type="text" placeholder="家長姓名" class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sun focus:outline-none text-sm">
      <input type="tel" placeholder="聯絡電話" class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sun focus:outline-none text-sm">
      <input type="email" placeholder="Email" class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sun focus:outline-none text-sm">
      <input type="text" placeholder="小朋友姓名" class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sun focus:outline-none text-sm">
      <div class="grid grid-cols-2 gap-4">
        <input type="text" placeholder="出生日期" class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sun focus:outline-none text-sm">
        <select class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sun focus:outline-none text-sm text-gray-500">
          <option>性別</option>
          <option>男</option>
          <option>女</option>
        </select>
      </div>
      <select class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sun focus:outline-none text-sm text-gray-500">
        <option>欲申請班級</option>
        <option>幼幼班（2-3歲）</option>
        <option>小班（3-4歲）</option>
        <option>中班（4-5歲）</option>
        <option>大班（5-6歲）</option>
      </select>
      <div class="bg-sand rounded-xl p-4">
        <p class="text-xs text-amber-700 font-bold">📌 提醒事項</p>
        <ul class="text-xs text-amber-600 mt-2 space-y-1">
          <li>· 報名後 3 個工作天內會安排參觀</li>
          <li>· 請攜帶戶口名簿影本及健康手冊</li>
          <li>· 2026 秋季班名額有限，額滿為止</li>
        </ul>
      </div>
      <button onclick="document.getElementById('enrollModal').classList.add('hidden');showToast('報名申請已送出！我們會盡快與您聯繫 🌞')" class="w-full bg-sun text-white py-3.5 rounded-xl font-bold hover:bg-amber-600 transition-colors cursor-pointer shadow-lg shadow-amber-200">
        確認送出報名 →
      </button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 bg-gray-800 text-white px-6 py-3.5 rounded-2xl shadow-2xl z-50 translate-y-20 opacity-0 transition-all duration-500 font-bold text-sm"></div>

<script>
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.remove('translate-y-20','opacity-0');
  setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3000);
}

// Reveal on scroll
const obs=new IntersectionObserver((entries)=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}})
},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'});
  });
});
</script>
</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
