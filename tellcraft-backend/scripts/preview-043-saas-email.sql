INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'a91a9897-0bd4-4c9c-8ef6-c1318ccfdb88',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MailPulse — Email 行銷平台</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        mp: { 50:'#eef2ff', 100:'#e0e7ff', 200:'#c7d2fe', 300:'#a5b4fc', 400:'#818cf8', 500:'#6366f1', 600:'#4f46e5', 700:'#4338ca', 800:'#3730a3', 900:'#312e81' },
        sky: { 50:'#f0f9ff', 100:'#e0f2fe', 200:'#bae6fd', 300:'#7dd3fc', 400:'#38bdf8', 500:'#0ea5e9', 600:'#0284c7' }
      },
      fontFamily: { inter:['Inter','Noto Sans TC','sans-serif'] }
    }
  }
}
</script>
<style>
  * { font-family: 'Inter', 'Noto Sans TC', sans-serif; }
  html { scroll-behavior: smooth; }
  .reveal { opacity:0; transform:translateY(24px); transition:all 0.6s cubic-bezier(0.16,1,0.3,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }
  .gradient-bg { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 30%, #818cf8 60%, #38bdf8 100%); }
  .mesh-bg { background-image: radial-gradient(at 40% 20%, rgba(99,102,241,0.08) 0px, transparent 50%), radial-gradient(at 80% 70%, rgba(56,189,248,0.06) 0px, transparent 50%); }
</style>
</head>
<body class="bg-white text-gray-800">

<!-- Navbar -->
<nav class="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-100">
  <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2">
      <div class="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
      </div>
      <span class="font-bold text-lg">MailPulse</span>
    </a>
    <div class="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
      <a href="#features" class="hover:text-mp-600 transition-colors">功能</a>
      <a href="#templates" class="hover:text-mp-600 transition-colors">模板</a>
      <a href="#pricing" class="hover:text-mp-600 transition-colors">方案</a>
      <a href="#integrations" class="hover:text-mp-600 transition-colors">整合</a>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="showToast('登入功能 Coming Soon')" class="text-sm font-medium text-gray-600 hover:text-mp-600 transition-colors hidden sm:block">登入</button>
      <button onclick="showToast('感謝註冊！我們會盡快開放 🎉')" class="bg-mp-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-mp-600 transition-colors shadow-md shadow-mp-500/20">免費試用</button>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-gray-500">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-white border-t px-6 py-4 space-y-3">
    <a href="#features" class="block text-sm font-medium text-gray-600">功能</a>
    <a href="#templates" class="block text-sm font-medium text-gray-600">模板</a>
    <a href="#pricing" class="block text-sm font-medium text-gray-600">方案</a>
    <a href="#integrations" class="block text-sm font-medium text-gray-600">整合</a>
  </div>
</nav>

<!-- Hero -->
<section class="pt-24 pb-16 mesh-bg">
  <div class="max-w-6xl mx-auto px-6 text-center">
    <div class="inline-flex items-center gap-2 bg-mp-50 text-mp-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-mp-200">
      <span class="w-2 h-2 bg-mp-500 rounded-full animate-pulse"></span>
      全新 AI 寫信助手上線
    </div>
    <h1 class="text-4xl md:text-6xl font-bold leading-tight mb-6 tracking-tight">
      讓每封 Email<br>
      都<span class="bg-clip-text text-transparent gradient-bg">精準觸達</span>
    </h1>
    <p class="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
      MailPulse 是為成長型團隊打造的 Email 行銷平台。拖拉式編輯器、AI 文案、智能分群、A/B 測試，讓你的開信率飆升 47%。
    </p>
    <div class="flex flex-wrap justify-center gap-4 mb-12">
      <button onclick="showToast('感謝註冊！我們會盡快開放 🎉')" class="bg-mp-500 text-white px-8 py-3.5 rounded-lg font-semibold text-lg hover:bg-mp-600 transition-colors shadow-xl shadow-mp-500/25">
        免費開始 — 永久免費方案 →
      </button>
    </div>
    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
      <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"><p class="text-2xl font-bold text-mp-600">47%</p><p class="text-gray-400 text-xs mt-1">平均開信率提升</p></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"><p class="text-2xl font-bold text-sky-600">12,000+</p><p class="text-gray-400 text-xs mt-1">活躍用戶</p></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"><p class="text-2xl font-bold text-mp-600">5 億+</p><p class="text-gray-400 text-xs mt-1">已發送 Email</p></div>
      <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"><p class="text-2xl font-bold text-sky-600">99.8%</p><p class="text-gray-400 text-xs mt-1">送達率</p></div>
    </div>
  </div>
</section>

<!-- Features -->
<section id="features" class="py-20 bg-gray-50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-mp-500 font-semibold text-sm tracking-widest uppercase">Features</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 tracking-tight">強大功能，簡單上手</h2>
      <p class="text-gray-400 mt-3 max-w-lg mx-auto">從設計到分析，MailPulse 涵蓋 Email 行銷的每一個環節</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div class="reveal bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-mp-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">✏️</div>
        <h3 class="font-bold text-lg mb-2">拖拉式編輯器</h3>
        <p class="text-gray-400 text-sm leading-relaxed">零程式碼建立精美 Email。50+ 區塊元件，拖拉排列，即時預覽。</p>
      </div>
      <div class="reveal bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🤖</div>
        <h3 class="font-bold text-lg mb-2">AI 文案助手</h3>
        <p class="text-gray-400 text-sm leading-relaxed">輸入產品描述，AI 自動生成吸睛標題和內文。支援多國語言。</p>
      </div>
      <div class="reveal bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">👥</div>
        <h3 class="font-bold text-lg mb-2">智能分群</h3>
        <p class="text-gray-400 text-sm leading-relaxed">依行為、購買紀錄、互動程度自動分群。精準投遞，提高轉換率。</p>
      </div>
      <div class="reveal bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🔬</div>
        <h3 class="font-bold text-lg mb-2">A/B 測試</h3>
        <p class="text-gray-400 text-sm leading-relaxed">標題、內容、發送時間全部可測試。數據驅動，找出最佳組合。</p>
      </div>
      <div class="reveal bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">⚡</div>
        <h3 class="font-bold text-lg mb-2">自動化流程</h3>
        <p class="text-gray-400 text-sm leading-relaxed">歡迎信、購物車提醒、生日祝福…設定一次，自動運行。</p>
      </div>
      <div class="reveal bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📊</div>
        <h3 class="font-bold text-lg mb-2">即時分析</h3>
        <p class="text-gray-400 text-sm leading-relaxed">開信率、點擊率、轉換率、退訂率。豐富圖表，一目了然。</p>
      </div>
    </div>
  </div>
</section>

<!-- Email Editor Preview -->
<section id="templates" class="py-20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-mp-500 font-semibold text-sm tracking-widest uppercase">Editor</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 tracking-tight">直覺式郵件編輯器</h2>
      <p class="text-gray-400 mt-3">拖拉元件、即時預覽、一鍵發送</p>
    </div>
    <div class="reveal bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
      <!-- Editor Toolbar -->
      <div class="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-red-400"></span>
          <span class="w-3 h-3 rounded-full bg-yellow-400"></span>
          <span class="w-3 h-3 rounded-full bg-green-400"></span>
          <span class="text-sm text-gray-400 ml-3">新年促銷活動 — 草稿</span>
        </div>
        <div class="flex items-center gap-2">
          <button class="text-xs px-3 py-1.5 bg-gray-100 rounded-lg text-gray-500 font-medium">預覽</button>
          <button class="text-xs px-3 py-1.5 bg-mp-500 rounded-lg text-white font-medium">發送</button>
        </div>
      </div>
      <!-- Editor Body -->
      <div class="grid md:grid-cols-[240px_1fr] min-h-[360px]">
        <!-- Sidebar -->
        <div class="bg-white border-r border-gray-200 p-4 hidden md:block">
          <p class="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-3">元件</p>
          <div class="space-y-2">
            <div class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 cursor-pointer hover:border-mp-300 transition-colors">📝 文字區塊</div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 cursor-pointer hover:border-mp-300 transition-colors">🖼️ 圖片</div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 cursor-pointer hover:border-mp-300 transition-colors">🔘 按鈕</div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 cursor-pointer hover:border-mp-300 transition-colors">➗ 分隔線</div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 cursor-pointer hover:border-mp-300 transition-colors">📊 產品卡片</div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 cursor-pointer hover:border-mp-300 transition-colors">🎨 社群連結</div>
          </div>
          <p class="text-[10px] text-gray-400 uppercase tracking-wider font-medium mt-5 mb-3">模板</p>
          <div class="space-y-2">
            <div class="bg-mp-50 border border-mp-200 rounded-lg px-3 py-2 text-xs text-mp-700 cursor-pointer font-medium">🎉 新年促銷</div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 cursor-pointer">📬 歡迎信</div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 cursor-pointer">🛒 購物車提醒</div>
          </div>
        </div>
        <!-- Canvas -->
        <div class="p-6 bg-gray-100 flex justify-center">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-md overflow-hidden">
            <div class="gradient-bg p-8 text-center text-white">
              <p class="text-sm font-medium opacity-80">🎆 新年限時優惠</p>
              <h2 class="text-2xl font-bold mt-2">全站 8 折起</h2>
              <p class="text-sm opacity-80 mt-2">即日起至 2/28，錯過再等一年</p>
            </div>
            <div class="p-6">
              <p class="text-sm text-gray-600 leading-relaxed mb-4">親愛的會員你好，感謝你一路的支持！為迎接新年，我們特別推出限時優惠活動。</p>
              <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="bg-gray-50 rounded-lg p-3 text-center"><span class="text-2xl block">👕</span><p class="text-xs text-gray-600 mt-1 font-medium">上衣 8 折</p></div>
                <div class="bg-gray-50 rounded-lg p-3 text-center"><span class="text-2xl block">👖</span><p class="text-xs text-gray-600 mt-1 font-medium">褲裝 75 折</p></div>
              </div>
              <button class="w-full gradient-bg text-white py-2.5 rounded-lg text-sm font-semibold">立即選購 →</button>
              <p class="text-center text-[10px] text-gray-400 mt-4">如不想收到此類郵件，請點擊取消訂閱</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Pricing -->
<section id="pricing" class="py-20 bg-gray-50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-mp-500 font-semibold text-sm tracking-widest uppercase">Pricing</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 tracking-tight">簡單透明的價格</h2>
      <p class="text-gray-400 mt-3">從個人到企業，找到最適合你的方案</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="reveal bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
        <h3 class="font-bold text-lg">Free</h3>
        <p class="text-gray-400 text-sm mb-5">適合剛開始的個人</p>
        <div class="mb-6"><span class="text-4xl font-bold">$0</span><span class="text-gray-400">/月</span></div>
        <div class="space-y-3 text-sm mb-8">
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>500 位訂閱者</div>
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>1,000 封/月</div>
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>拖拉編輯器</div>
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>基本分析報表</div>
          <div class="flex items-center gap-2 text-gray-300"><span>✕</span>AI 文案助手</div>
          <div class="flex items-center gap-2 text-gray-300"><span>✕</span>A/B 測試</div>
        </div>
        <button onclick="showToast('免費方案已開通 🎉')" class="w-full border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:border-mp-300 transition-colors">免費開始</button>
      </div>
      <div class="reveal bg-white rounded-2xl p-8 border-2 border-mp-500 relative shadow-lg shadow-mp-500/10">
        <div class="absolute -top-4 left-1/2 -translate-x-1/2 gradient-bg text-white px-4 py-1 rounded-full text-sm font-bold">最受歡迎</div>
        <h3 class="font-bold text-lg">Growth</h3>
        <p class="text-gray-400 text-sm mb-5">適合成長中的團隊</p>
        <div class="mb-6"><span class="text-4xl font-bold">$990</span><span class="text-gray-400">/月</span></div>
        <div class="space-y-3 text-sm mb-8">
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>10,000 位訂閱者</div>
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>50,000 封/月</div>
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>拖拉編輯器</div>
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>進階分析 + 熱點圖</div>
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>AI 文案助手</div>
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>A/B 測試</div>
        </div>
        <button onclick="showToast('Growth 方案已選擇 🚀')" class="w-full gradient-bg text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">開始試用</button>
      </div>
      <div class="reveal bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
        <h3 class="font-bold text-lg">Enterprise</h3>
        <p class="text-gray-400 text-sm mb-5">適合大型企業</p>
        <div class="mb-6"><span class="text-4xl font-bold">客製</span></div>
        <div class="space-y-3 text-sm mb-8">
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>無限訂閱者</div>
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>無限發送量</div>
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>所有 Growth 功能</div>
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>專屬 IP</div>
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>API 整合</div>
          <div class="flex items-center gap-2"><span class="text-mp-500">✓</span>24/7 客服</div>
        </div>
        <button onclick="showToast('我們會盡快與您聯繫 📞')" class="w-full border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:border-mp-300 transition-colors">聯繫業務</button>
      </div>
    </div>
  </div>
</section>

<!-- Integrations -->
<section id="integrations" class="py-20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-mp-500 font-semibold text-sm tracking-widest uppercase">Integrations</span>
      <h2 class="text-3xl md:text-4xl font-bold mt-3 tracking-tight">與你的工具無縫整合</h2>
      <p class="text-gray-400 mt-3">一鍵串接，資料自動同步</p>
    </div>
    <div class="grid grid-cols-3 md:grid-cols-6 gap-3 reveal">
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-center h-16 text-sm font-semibold text-gray-500 hover:border-mp-300 transition-colors cursor-pointer">Shopify</div>
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-center h-16 text-sm font-semibold text-gray-500 hover:border-mp-300 transition-colors cursor-pointer">WordPress</div>
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-center h-16 text-sm font-semibold text-gray-500 hover:border-mp-300 transition-colors cursor-pointer">Slack</div>
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-center h-16 text-sm font-semibold text-gray-500 hover:border-mp-300 transition-colors cursor-pointer">Zapier</div>
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-center h-16 text-sm font-semibold text-gray-500 hover:border-mp-300 transition-colors cursor-pointer">GA4</div>
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-center h-16 text-sm font-semibold text-gray-500 hover:border-mp-300 transition-colors cursor-pointer">HubSpot</div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="py-20 gradient-bg">
  <div class="max-w-3xl mx-auto px-6 text-center reveal">
    <h2 class="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">準備好提升你的 Email 行銷了嗎？</h2>
    <p class="text-white/80 text-lg mb-8">免費方案永久有效，不需信用卡</p>
    <button onclick="showToast('歡迎加入 MailPulse！🎉')" class="bg-white text-mp-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-xl">
      免費開始 →
    </button>
  </div>
</section>

<!-- Footer -->
<footer class="bg-gray-900 text-gray-400 py-12">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid md:grid-cols-4 gap-8 mb-8">
      <div>
        <div class="flex items-center gap-2 mb-3"><div class="w-7 h-7 gradient-bg rounded-md flex items-center justify-center"><svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></div><span class="text-white font-bold">MailPulse</span></div>
        <p class="text-sm">讓每封 Email 都精準觸達。</p>
      </div>
      <div><h4 class="text-white font-semibold mb-3 text-sm">產品</h4><p class="text-sm">功能介紹</p><p class="text-sm">模板市集</p><p class="text-sm">API 文件</p></div>
      <div><h4 class="text-white font-semibold mb-3 text-sm">資源</h4><p class="text-sm">部落格</p><p class="text-sm">教學中心</p><p class="text-sm">客戶案例</p></div>
      <div><h4 class="text-white font-semibold mb-3 text-sm">公司</h4><p class="text-sm">關於我們</p><p class="text-sm">隱私政策</p><p class="text-sm">服務條款</p></div>
    </div>
    <div class="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">© 2026 MailPulse. All rights reserved.</div>
  </div>
</footer>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-semibold translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"></div>

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
