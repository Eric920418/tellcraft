INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'a9c5d2cb-89bc-4577-a01c-c79928fa06c5',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HIVE — 共享辦公空間</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        hive: { 50:'#fefce8', 100:'#fef9c3', 200:'#fef08a', 300:'#fde047', 400:'#facc15', 500:'#eab308', 600:'#ca8a04', 700:'#a16207', 800:'#854d0e', 900:'#713f12' },
        urban: { 50:'#f8fafc', 100:'#f1f5f9', 200:'#e2e8f0', 300:'#cbd5e1', 400:'#94a3b8', 500:'#64748b', 600:'#475569', 700:'#334155', 800:'#1e293b', 900:'#0f172a', 950:'#020617' }
      },
      fontFamily: { dm:['DM Sans','Noto Sans TC','sans-serif'] }
    }
  }
}
</script>
<style>
  * { font-family: 'DM Sans', 'Noto Sans TC', sans-serif; }
  html { scroll-behavior: smooth; }
  .grain { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"); }
  .reveal { opacity:0; transform:translateY(30px); transition:all 0.7s cubic-bezier(0.16,1,0.3,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }
  .space-active { border-color: #eab308 !important; background-color: #fefce8 !important; }
</style>
</head>
<body class="bg-urban-50 text-urban-900 grain">

<!-- Navbar -->
<nav class="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-urban-100">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2">
      <div class="w-8 h-8 bg-hive-400 rounded-lg flex items-center justify-center">
        <svg class="w-5 h-5 text-urban-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      </div>
      <span class="text-xl font-bold tracking-tight">HIVE</span>
    </a>
    <div class="hidden md:flex items-center gap-8 text-sm font-medium text-urban-500">
      <a href="#spaces" class="hover:text-urban-900 transition-colors">空間方案</a>
      <a href="#amenities" class="hover:text-urban-900 transition-colors">設施服務</a>
      <a href="#community" class="hover:text-urban-900 transition-colors">社群活動</a>
      <a href="#pricing" class="hover:text-urban-900 transition-colors">價格方案</a>
      <a href="#location" class="hover:text-urban-900 transition-colors">交通位置</a>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="document.getElementById('tour-modal').classList.remove('hidden')" class="bg-urban-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-urban-800 transition-colors">
        預約參觀
      </button>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-urban-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-white border-t px-6 py-4 space-y-3">
    <a href="#spaces" class="block text-sm font-medium text-urban-600">空間方案</a>
    <a href="#amenities" class="block text-sm font-medium text-urban-600">設施服務</a>
    <a href="#community" class="block text-sm font-medium text-urban-600">社群活動</a>
    <a href="#pricing" class="block text-sm font-medium text-urban-600">價格方案</a>
    <a href="#location" class="block text-sm font-medium text-urban-600">交通位置</a>
  </div>
</nav>

<!-- Hero -->
<section class="pt-28 pb-20 overflow-hidden">
  <div class="max-w-6xl mx-auto px-6">
    <div class="max-w-3xl">
      <div class="inline-flex items-center gap-2 bg-hive-100 text-hive-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
        <span class="w-2 h-2 bg-hive-500 rounded-full animate-pulse"></span>
        座位開放中 · 即日起可入駐
      </div>
      <h1 class="text-4xl md:text-6xl font-bold leading-tight mb-6 tracking-tight">
        不只是辦公空間<br>
        是你的<span class="text-hive-500">第二個家</span>
      </h1>
      <p class="text-urban-400 text-lg md:text-xl mb-10 leading-relaxed max-w-xl">
        HIVE 提供彈性座位、獨立辦公室、會議室到活動場地。在這裡，遇見志同道合的夥伴，激發無限可能。
      </p>
      <div class="flex flex-wrap gap-4">
        <button onclick="document.getElementById('tour-modal').classList.remove('hidden')" class="bg-hive-400 text-urban-900 px-8 py-3.5 rounded-lg font-bold text-lg hover:bg-hive-500 transition-colors shadow-lg shadow-hive-400/30">
          免費參觀 →
        </button>
        <a href="#pricing" class="border-2 border-urban-200 text-urban-600 px-8 py-3.5 rounded-lg font-bold text-lg hover:border-urban-300 transition-colors">
          查看方案
        </a>
      </div>
    </div>
    <!-- Stats Bar -->
    <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5 border border-urban-100">
        <p class="text-3xl font-bold">450+</p>
        <p class="text-urban-400 text-sm mt-1">進駐會員</p>
      </div>
      <div class="bg-white rounded-xl p-5 border border-urban-100">
        <p class="text-3xl font-bold">3<span class="text-hive-500">F</span></p>
        <p class="text-urban-400 text-sm mt-1">樓層空間</p>
      </div>
      <div class="bg-white rounded-xl p-5 border border-urban-100">
        <p class="text-3xl font-bold">24/7</p>
        <p class="text-urban-400 text-sm mt-1">全天候開放</p>
      </div>
      <div class="bg-white rounded-xl p-5 border border-urban-100">
        <p class="text-3xl font-bold">98<span class="text-hive-500">%</span></p>
        <p class="text-urban-400 text-sm mt-1">續約率</p>
      </div>
    </div>
  </div>
</section>

<!-- Spaces -->
<section id="spaces" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-hive-600 font-semibold text-sm tracking-widest uppercase">Spaces</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 tracking-tight">選擇你的空間</h2>
      <p class="text-urban-400 mt-3 max-w-lg mx-auto">從一人座位到 30 人辦公室，我們有最適合你的方案</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5" id="space-grid">
      <div class="reveal space-card border-2 border-urban-100 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all group" onclick="selectSpace(this,'hot')">
        <div class="w-14 h-14 rounded-xl bg-hive-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">💺</div>
        <h3 class="font-bold text-lg">流動座位</h3>
        <p class="text-urban-400 text-sm mt-2 leading-relaxed">不固定座位，每天換個位置，認識新朋友。適合自由工作者。</p>
        <div class="mt-4 pt-4 border-t border-urban-100">
          <span class="text-2xl font-bold">$3,500</span><span class="text-urban-400 text-sm">/月</span>
        </div>
      </div>
      <div class="reveal space-card border-2 border-urban-100 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all group" onclick="selectSpace(this,'dedicated')">
        <div class="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🖥️</div>
        <h3 class="font-bold text-lg">固定座位</h3>
        <p class="text-urban-400 text-sm mt-2 leading-relaxed">專屬桌位 + 收納櫃，打造你的個人工作角落。</p>
        <div class="mt-4 pt-4 border-t border-urban-100">
          <span class="text-2xl font-bold">$5,800</span><span class="text-urban-400 text-sm">/月</span>
        </div>
      </div>
      <div class="reveal space-card border-2 border-urban-100 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all group" onclick="selectSpace(this,'office')">
        <div class="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🏢</div>
        <h3 class="font-bold text-lg">獨立辦公室</h3>
        <p class="text-urban-400 text-sm mt-2 leading-relaxed">2-30 人私密空間，含門禁、專屬信箱、公司登記。</p>
        <div class="mt-4 pt-4 border-t border-urban-100">
          <span class="text-2xl font-bold">$12,000</span><span class="text-urban-400 text-sm">/月起</span>
        </div>
      </div>
      <div class="reveal space-card border-2 border-urban-100 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all group" onclick="selectSpace(this,'meeting')">
        <div class="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📊</div>
        <h3 class="font-bold text-lg">會議室</h3>
        <p class="text-urban-400 text-sm mt-2 leading-relaxed">4-16 人會議室，65 吋螢幕、視訊設備、白板。</p>
        <div class="mt-4 pt-4 border-t border-urban-100">
          <span class="text-2xl font-bold">$500</span><span class="text-urban-400 text-sm">/時</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Amenities -->
<section id="amenities" class="py-20 bg-urban-950 text-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-hive-400 font-semibold text-sm tracking-widest uppercase">Amenities</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 tracking-tight">全方位設施</h2>
      <p class="text-urban-400 mt-3">讓你專注工作，其他的交給我們</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div class="reveal bg-urban-900 rounded-xl p-6 border border-urban-800 hover:border-hive-400/30 transition-colors">
        <span class="text-3xl mb-3 block">☕</span>
        <h4 class="font-bold">無限咖啡 & 茶飲</h4>
        <p class="text-urban-400 text-sm mt-2">精品咖啡機、日本茶、鮮奶，全天候供應。</p>
      </div>
      <div class="reveal bg-urban-900 rounded-xl p-6 border border-urban-800 hover:border-hive-400/30 transition-colors">
        <span class="text-3xl mb-3 block">📶</span>
        <h4 class="font-bold">千兆光纖網路</h4>
        <p class="text-urban-400 text-sm mt-2">企業級 1Gbps 對稱頻寬，雙迴路備援。</p>
      </div>
      <div class="reveal bg-urban-900 rounded-xl p-6 border border-urban-800 hover:border-hive-400/30 transition-colors">
        <span class="text-3xl mb-3 block">🖨️</span>
        <h4 class="font-bold">列印 & 掃描</h4>
        <p class="text-urban-400 text-sm mt-2">彩色雷射列印、A3 掃描，每月含 100 頁。</p>
      </div>
      <div class="reveal bg-urban-900 rounded-xl p-6 border border-urban-800 hover:border-hive-400/30 transition-colors">
        <span class="text-3xl mb-3 block">📬</span>
        <h4 class="font-bold">商務地址 & 信箱</h4>
        <p class="text-urban-400 text-sm mt-2">台北市精華地段地址，公司登記、收發信件。</p>
      </div>
      <div class="reveal bg-urban-900 rounded-xl p-6 border border-urban-800 hover:border-hive-400/30 transition-colors">
        <span class="text-3xl mb-3 block">🛋️</span>
        <h4 class="font-bold">休憩區 & 冥想室</h4>
        <p class="text-urban-400 text-sm mt-2">懶骨頭沙發、午睡艙、冥想室，充電再出發。</p>
      </div>
      <div class="reveal bg-urban-900 rounded-xl p-6 border border-urban-800 hover:border-hive-400/30 transition-colors">
        <span class="text-3xl mb-3 block">🔐</span>
        <h4 class="font-bold">24H 門禁安全</h4>
        <p class="text-urban-400 text-sm mt-2">人臉辨識 + 手機 NFC 解鎖，全時段監控。</p>
      </div>
    </div>
  </div>
</section>

<!-- Community -->
<section id="community" class="py-20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-hive-600 font-semibold text-sm tracking-widest uppercase">Community</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 tracking-tight">不只辦公，更是社群</h2>
      <p class="text-urban-400 mt-3">每月精心策劃的活動，讓你的人脈網絡持續擴展</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="reveal bg-white rounded-2xl overflow-hidden shadow-sm border border-urban-100 hover:shadow-lg transition-shadow group cursor-pointer">
        <div class="h-40 bg-gradient-to-br from-hive-200 to-hive-300 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">🎤</div>
        <div class="p-6">
          <span class="text-xs font-semibold text-hive-600 bg-hive-50 px-2.5 py-1 rounded-full">每月舉辦</span>
          <h4 class="font-bold text-lg mt-3">Founder Talks</h4>
          <p class="text-urban-400 text-sm mt-2">邀請成功創業者分享經驗，Q&A 深度交流。每月第二個週四晚上。</p>
        </div>
      </div>
      <div class="reveal bg-white rounded-2xl overflow-hidden shadow-sm border border-urban-100 hover:shadow-lg transition-shadow group cursor-pointer">
        <div class="h-40 bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">🍻</div>
        <div class="p-6">
          <span class="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">每週五</span>
          <h4 class="font-bold text-lg mt-3">Friday Mixer</h4>
          <p class="text-urban-400 text-sm mt-2">每週五下午 6 點，精釀啤酒 + 輕食，認識不同領域的夥伴。</p>
        </div>
      </div>
      <div class="reveal bg-white rounded-2xl overflow-hidden shadow-sm border border-urban-100 hover:shadow-lg transition-shadow group cursor-pointer">
        <div class="h-40 bg-gradient-to-br from-green-200 to-green-300 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">💡</div>
        <div class="p-6">
          <span class="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">不定期</span>
          <h4 class="font-bold text-lg mt-3">Workshop 工作坊</h4>
          <p class="text-urban-400 text-sm mt-2">AI、設計、行銷、財務…會員自主開課，互相學習成長。</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Pricing -->
<section id="pricing" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-hive-600 font-semibold text-sm tracking-widest uppercase">Pricing</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 tracking-tight">透明價格，彈性方案</h2>
      <p class="text-urban-400 mt-3">月繳、季繳、年繳皆可，無隱藏費用</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="reveal border-2 border-urban-100 rounded-2xl p-8 hover:shadow-lg transition-shadow">
        <h3 class="font-bold text-lg mb-1">流動座位</h3>
        <p class="text-urban-400 text-sm mb-6">適合遠端工作者</p>
        <div class="mb-6"><span class="text-4xl font-bold">$3,500</span><span class="text-urban-400">/月</span></div>
        <div class="space-y-3 text-sm mb-8">
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>開放區不固定座位</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>24/7 空間使用</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>無限咖啡茶飲</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>Wi-Fi 1Gbps</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>會議室 2hr/月</div>
          <div class="flex items-center gap-2 text-urban-300"><span>✕</span>個人置物櫃</div>
          <div class="flex items-center gap-2 text-urban-300"><span>✕</span>商務地址</div>
        </div>
        <button onclick="showToast('已收到！我們會盡快與您聯繫 📞')" class="w-full border-2 border-urban-200 text-urban-700 py-3 rounded-xl font-semibold hover:border-hive-300 hover:text-hive-700 transition-colors">開始入駐</button>
      </div>
      <div class="reveal border-2 border-hive-400 rounded-2xl p-8 relative shadow-lg shadow-hive-400/10">
        <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-hive-400 text-urban-900 px-4 py-1 rounded-full text-sm font-bold">最受歡迎</div>
        <h3 class="font-bold text-lg mb-1">固定座位</h3>
        <p class="text-urban-400 text-sm mb-6">適合個人或小團隊</p>
        <div class="mb-6"><span class="text-4xl font-bold">$5,800</span><span class="text-urban-400">/月</span></div>
        <div class="space-y-3 text-sm mb-8">
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>專屬固定桌位</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>24/7 空間使用</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>無限咖啡茶飲</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>Wi-Fi 1Gbps</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>會議室 5hr/月</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>個人置物櫃</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>商務地址</div>
        </div>
        <button onclick="showToast('已收到！我們會盡快與您聯繫 📞')" class="w-full bg-hive-400 text-urban-900 py-3 rounded-xl font-bold hover:bg-hive-500 transition-colors">開始入駐</button>
      </div>
      <div class="reveal border-2 border-urban-100 rounded-2xl p-8 hover:shadow-lg transition-shadow">
        <h3 class="font-bold text-lg mb-1">獨立辦公室</h3>
        <p class="text-urban-400 text-sm mb-6">適合成長中的團隊</p>
        <div class="mb-6"><span class="text-4xl font-bold">$12,000</span><span class="text-urban-400">/月起</span></div>
        <div class="space-y-3 text-sm mb-8">
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>獨立隔間 2-30 人</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>24/7 空間使用</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>無限咖啡茶飲</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>Wi-Fi 1Gbps</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>會議室 10hr/月</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>公司登記</div>
          <div class="flex items-center gap-2"><span class="text-hive-500">✓</span>專屬門禁</div>
        </div>
        <button onclick="showToast('已收到！我們會盡快與您聯繫 📞')" class="w-full border-2 border-urban-200 text-urban-700 py-3 rounded-xl font-semibold hover:border-hive-300 hover:text-hive-700 transition-colors">洽談方案</button>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="py-20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-hive-600 font-semibold text-sm tracking-widest uppercase">Testimonials</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 tracking-tight">會員怎麼說</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="reveal bg-white rounded-2xl p-7 border border-urban-100 shadow-sm">
        <p class="text-urban-600 text-sm leading-relaxed mb-5">「離開咖啡廳的流浪生涯，在 HIVE 找到真正能專注的地方。認識了現在的合夥人，一起創業到現在。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-hive-200 flex items-center justify-center font-bold text-hive-800">JC</div>
          <div><p class="font-bold text-sm">Jimmy Chen</p><p class="text-urban-400 text-xs">AppWorx 共同創辦人</p></div>
        </div>
      </div>
      <div class="reveal bg-white rounded-2xl p-7 border border-urban-100 shadow-sm">
        <p class="text-urban-600 text-sm leading-relaxed mb-5">「我們從 2 人的流動座位開始，現在團隊 15 人有自己的辦公室。HIVE 陪我們一起成長，彈性方案真的很棒。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-800">SL</div>
          <div><p class="font-bold text-sm">Sandy Lin</p><p class="text-urban-400 text-xs">DataBridge CEO</p></div>
        </div>
      </div>
      <div class="reveal bg-white rounded-2xl p-7 border border-urban-100 shadow-sm">
        <p class="text-urban-600 text-sm leading-relaxed mb-5">「Friday Mixer 讓我認識了好多不同領域的人！設計師、工程師、行銷人，跨界交流超有價值。」</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-800">AW</div>
          <div><p class="font-bold text-sm">Alex Wang</p><p class="text-urban-400 text-xs">自由品牌設計師</p></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Location -->
<section id="location" class="py-20 bg-urban-950 text-white">
  <div class="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-center">
    <div class="reveal">
      <span class="text-hive-400 font-semibold text-sm tracking-widest uppercase">Location</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 mb-6 tracking-tight">交通位置</h2>
      <p class="text-urban-400 mb-8 leading-relaxed">位於信義區核心地段，捷運步行 3 分鐘，生活機能完善。</p>
      <div class="space-y-4">
        <div class="flex items-center gap-4"><span class="w-10 h-10 rounded-lg bg-urban-800 flex items-center justify-center">📍</span><div><p class="font-semibold text-sm">地址</p><p class="text-urban-400 text-sm">台北市信義區忠孝東路五段 236 號 8F</p></div></div>
        <div class="flex items-center gap-4"><span class="w-10 h-10 rounded-lg bg-urban-800 flex items-center justify-center">🚇</span><div><p class="font-semibold text-sm">捷運</p><p class="text-urban-400 text-sm">板南線市政府站 3 號出口步行 3 分鐘</p></div></div>
        <div class="flex items-center gap-4"><span class="w-10 h-10 rounded-lg bg-urban-800 flex items-center justify-center">🅿️</span><div><p class="font-semibold text-sm">停車</p><p class="text-urban-400 text-sm">大樓地下停車場，會員享優惠月租</p></div></div>
        <div class="flex items-center gap-4"><span class="w-10 h-10 rounded-lg bg-urban-800 flex items-center justify-center">📞</span><div><p class="font-semibold text-sm">聯絡</p><p class="text-urban-400 text-sm">(02) 2758-1234 · hello@hive.space</p></div></div>
      </div>
    </div>
    <div class="reveal bg-urban-900 rounded-2xl p-1 border border-urban-800">
      <div class="bg-urban-800 rounded-xl h-72 flex items-center justify-center text-urban-500">
        <div class="text-center">
          <span class="text-6xl block mb-4">🗺️</span>
          <p class="font-semibold">信義區忠孝東路五段</p>
          <p class="text-sm text-urban-500 mt-1">市政府站步行 3 分鐘</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="py-20 bg-hive-400">
  <div class="max-w-3xl mx-auto px-6 text-center reveal">
    <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-urban-900 mb-4">準備好開始了嗎？</h2>
    <p class="text-urban-700 text-lg mb-8">預約免費參觀，親自感受 HIVE 的氛圍</p>
    <button onclick="document.getElementById('tour-modal').classList.remove('hidden')" class="bg-urban-900 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-urban-800 transition-colors shadow-xl">
      立即預約參觀 →
    </button>
  </div>
</section>

<!-- Footer -->
<footer class="bg-urban-950 text-urban-400 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex flex-col md:flex-row justify-between items-center gap-6">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 bg-hive-400 rounded-md flex items-center justify-center">
          <svg class="w-4 h-4 text-urban-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <span class="text-lg font-bold text-white">HIVE</span>
      </div>
      <p class="text-sm">© 2026 HIVE Coworking. All rights reserved.</p>
    </div>
  </div>
</footer>

<!-- Tour Modal -->
<div id="tour-modal" class="hidden fixed inset-0 z-[60] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="this.parentElement.classList.add('hidden')"></div>
  <div class="relative bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
    <button onclick="this.closest('#tour-modal').classList.add('hidden')" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-urban-100 flex items-center justify-center text-urban-500 hover:bg-urban-200 transition-colors">✕</button>
    <h3 class="text-2xl font-bold mb-2">預約免費參觀</h3>
    <p class="text-urban-400 text-sm mb-6">填寫資訊，我們會在 1 個工作天內回覆</p>
    <div class="space-y-4">
      <div><label class="text-sm font-semibold text-urban-600 mb-1 block">姓名</label><input type="text" placeholder="您的姓名" class="w-full border border-urban-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-hive-300 outline-none"></div>
      <div><label class="text-sm font-semibold text-urban-600 mb-1 block">Email</label><input type="email" placeholder="you@company.com" class="w-full border border-urban-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-hive-300 outline-none"></div>
      <div><label class="text-sm font-semibold text-urban-600 mb-1 block">團隊人數</label>
        <select class="w-full border border-urban-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-hive-300 outline-none">
          <option>1 人（個人）</option><option>2-5 人</option><option>6-15 人</option><option>16-30 人</option><option>30 人以上</option>
        </select>
      </div>
      <div><label class="text-sm font-semibold text-urban-600 mb-1 block">希望參觀時間</label><input type="date" class="w-full border border-urban-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-hive-300 outline-none"></div>
      <button onclick="showToast('預約成功！我們會盡快回覆確認時間 📧');this.closest('#tour-modal').classList.add('hidden')" class="w-full bg-hive-400 text-urban-900 py-3 rounded-xl font-bold hover:bg-hive-500 transition-colors">送出預約</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-urban-900 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-semibold translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"></div>

<script>
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),2500);}
function selectSpace(el,type){document.querySelectorAll('.space-card').forEach(c=>{c.classList.remove('space-active');c.style.borderColor='';c.style.backgroundColor='';});el.classList.add('space-active');showToast('已選擇方案！點擊下方按鈕開始入駐');}
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
