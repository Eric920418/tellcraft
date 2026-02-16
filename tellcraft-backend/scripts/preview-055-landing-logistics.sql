INSERT INTO template_previews (template_id, html_content, version)
VALUES ('b36ad469-eaa8-40c1-8665-142980f889f3', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>捷達物流 SwiftChain</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{navy:'#0f172a',steel:'#334155',accent:'#3b82f6',neon:'#22d3ee',success:'#10b981',warning:'#f59e0b',surface:'#f1f5f9'},fontFamily:{sans:['Space Grotesk','sans-serif']}}}}
</script>
<style>
*{font-family:'Space Grotesk',sans-serif}
html{scroll-behavior:smooth}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.pulse-dot{animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
.tracking-line{background:repeating-linear-gradient(90deg,#3b82f6 0,#3b82f6 8px,transparent 8px,transparent 16px);height:2px}
</style>
</head>
<body class="bg-white text-navy overflow-x-hidden">

<!-- Nav -->
<nav class="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
  <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 bg-navy rounded-lg flex items-center justify-center text-neon font-bold text-sm">⚡</div>
      <span class="font-bold text-lg">Swift<span class="text-accent">Chain</span></span>
    </div>
    <div class="hidden md:flex items-center gap-8 text-sm text-steel">
      <a href="#services" class="hover:text-accent transition-colors cursor-pointer">服務項目</a>
      <a href="#tracking" class="hover:text-accent transition-colors cursor-pointer">即時追蹤</a>
      <a href="#network" class="hover:text-accent transition-colors cursor-pointer">物流網絡</a>
      <a href="#solutions" class="hover:text-accent transition-colors cursor-pointer">行業方案</a>
      <a href="#contact" class="hover:text-accent transition-colors cursor-pointer">聯繫我們</a>
    </div>
    <button onclick="document.getElementById('quoteModal').classList.remove('hidden')" class="bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors cursor-pointer">
      免費報價
    </button>
  </div>
</nav>

<!-- Hero -->
<section class="pt-28 pb-20 bg-gradient-to-br from-navy via-slate-800 to-navy text-white relative overflow-hidden">
  <!-- Grid bg -->
  <div class="absolute inset-0 opacity-10" style="background-image:linear-gradient(rgba(59,130,246,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.3) 1px,transparent 1px);background-size:60px 60px"></div>
  <div class="max-w-6xl mx-auto px-6 relative z-10">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div class="reveal">
        <div class="inline-flex items-center gap-2 bg-accent/20 text-neon text-xs font-bold px-3 py-1.5 rounded-full mb-6">
          <span class="w-2 h-2 bg-neon rounded-full pulse-dot"></span>
          即時追蹤 · AI 路線優化 · 全台 24hr 到貨
        </div>
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
          供應鏈<span class="text-neon">智慧化</span><br>
          物流<span class="text-accent">零斷點</span>
        </h1>
        <p class="text-white/50 text-lg leading-relaxed mb-8 max-w-lg">
          從倉儲到最後一哩，捷達物流以科技驅動的全方位物流解決方案，為您的供應鏈注入效率與透明度。
        </p>
        <div class="flex gap-4 mb-10">
          <button onclick="document.getElementById('quoteModal').classList.remove('hidden')" class="bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-accent/30">
            取得免費報價 →
          </button>
          <a href="#tracking" class="border border-white/20 text-white/70 px-8 py-4 rounded-xl font-bold hover:border-neon hover:text-neon transition-all cursor-pointer text-center">
            查件追蹤
          </a>
        </div>
        <div class="flex gap-10">
          <div><div class="text-2xl font-bold text-neon">99.7%</div><div class="text-xs text-white/30">準時到達率</div></div>
          <div><div class="text-2xl font-bold text-accent">50+</div><div class="text-xs text-white/30">物流據點</div></div>
          <div><div class="text-2xl font-bold text-white">3,000+</div><div class="text-xs text-white/30">企業客戶</div></div>
        </div>
      </div>
      <div class="relative reveal">
        <!-- Tracking visualization -->
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs text-white/50">即時物流地圖</span>
            <span class="flex items-center gap-1.5 text-xs text-neon"><span class="w-1.5 h-1.5 bg-neon rounded-full pulse-dot"></span>Live</span>
          </div>
          <div class="bg-navy/50 rounded-xl p-4 mb-4">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-2"><div class="w-3 h-3 bg-accent rounded-full"></div><span class="text-xs text-white/60">台北</span></div>
              <div class="flex-1 mx-3 tracking-line relative"><div class="absolute top-1/2 left-[60%] -translate-y-1/2 w-4 h-4 bg-neon rounded-full shadow-lg shadow-neon/50 flex items-center justify-center text-[8px] text-navy font-bold">📦</div></div>
              <div class="flex items-center gap-2"><span class="text-xs text-white/60">高雄</span><div class="w-3 h-3 bg-success rounded-full"></div></div>
            </div>
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-2"><div class="w-3 h-3 bg-accent rounded-full"></div><span class="text-xs text-white/60">桃園</span></div>
              <div class="flex-1 mx-3 tracking-line relative"><div class="absolute top-1/2 left-[35%] -translate-y-1/2 w-4 h-4 bg-warning rounded-full shadow-lg shadow-warning/50 flex items-center justify-center text-[8px] text-navy font-bold">🚛</div></div>
              <div class="flex items-center gap-2"><span class="text-xs text-white/60">台中</span><div class="w-3 h-3 bg-success rounded-full"></div></div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2"><div class="w-3 h-3 bg-accent rounded-full"></div><span class="text-xs text-white/60">新竹</span></div>
              <div class="flex-1 mx-3 tracking-line relative"><div class="absolute top-1/2 left-[85%] -translate-y-1/2 w-4 h-4 bg-success rounded-full shadow-lg shadow-success/50 flex items-center justify-center text-[8px] text-navy font-bold">✓</div></div>
              <div class="flex items-center gap-2"><span class="text-xs text-white/60">台南</span><div class="w-3 h-3 bg-success rounded-full"></div></div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-white/5 rounded-lg p-3 text-center">
              <div class="text-neon text-lg font-bold">1,247</div>
              <div class="text-[10px] text-white/30">運送中</div>
            </div>
            <div class="bg-white/5 rounded-lg p-3 text-center">
              <div class="text-success text-lg font-bold">3,891</div>
              <div class="text-[10px] text-white/30">今日完成</div>
            </div>
            <div class="bg-white/5 rounded-lg p-3 text-center">
              <div class="text-warning text-lg font-bold">23</div>
              <div class="text-[10px] text-white/30">待處理</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <div class="text-accent text-xs tracking-[0.2em] uppercase font-bold mb-2">Services</div>
      <h2 class="text-3xl md:text-4xl font-bold">全方位物流服務</h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-surface rounded-2xl p-6 reveal hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-accent/20">
        <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">🚛</div>
        <h3 class="font-bold text-lg mb-2">陸運配送</h3>
        <p class="text-steel text-sm leading-relaxed">全台灣隔日到貨，偏遠地區 +1 天。溫控車隊、危險品專車一應俱全。</p>
        <div class="mt-4 flex gap-2">
          <span class="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">常溫</span>
          <span class="bg-neon/10 text-cyan-600 text-[10px] font-bold px-2 py-0.5 rounded-full">冷鏈</span>
          <span class="bg-warning/10 text-warning text-[10px] font-bold px-2 py-0.5 rounded-full">危品</span>
        </div>
      </div>
      <div class="bg-surface rounded-2xl p-6 reveal hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-accent/20" style="transition-delay:0.05s">
        <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">🏭</div>
        <h3 class="font-bold text-lg mb-2">倉儲管理</h3>
        <p class="text-steel text-sm leading-relaxed">全台 8 座倉儲中心，WMS 系統即時庫存管理，支援 SKU 10 萬+。</p>
        <div class="mt-4 flex gap-2">
          <span class="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">WMS</span>
          <span class="bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded-full">自動化</span>
        </div>
      </div>
      <div class="bg-surface rounded-2xl p-6 reveal hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-accent/20" style="transition-delay:0.1s">
        <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">📦</div>
        <h3 class="font-bold text-lg mb-2">電商物流</h3>
        <p class="text-steel text-sm leading-relaxed">與蝦皮、MOMO、PChome 系統串接。揀貨、包裝、出貨一條龍服務。</p>
        <div class="mt-4 flex gap-2">
          <span class="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">API 串接</span>
          <span class="bg-neon/10 text-cyan-600 text-[10px] font-bold px-2 py-0.5 rounded-full">代出貨</span>
        </div>
      </div>
      <div class="bg-surface rounded-2xl p-6 reveal hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-accent/20" style="transition-delay:0.15s">
        <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">✈️</div>
        <h3 class="font-bold text-lg mb-2">國際貨運</h3>
        <p class="text-steel text-sm leading-relaxed">海運、空運、快遞。報關、清關一站式服務。覆蓋亞太、歐美主要市場。</p>
        <div class="mt-4 flex gap-2">
          <span class="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">海運</span>
          <span class="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">空運</span>
          <span class="bg-warning/10 text-warning text-[10px] font-bold px-2 py-0.5 rounded-full">報關</span>
        </div>
      </div>
      <div class="bg-surface rounded-2xl p-6 reveal hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-accent/20" style="transition-delay:0.2s">
        <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">🔄</div>
        <h3 class="font-bold text-lg mb-2">逆向物流</h3>
        <p class="text-steel text-sm leading-relaxed">退貨處理、商品回收、維修轉運。完善的退貨流程降低客訴率。</p>
        <div class="mt-4 flex gap-2">
          <span class="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">退貨</span>
          <span class="bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded-full">回收</span>
        </div>
      </div>
      <div class="bg-surface rounded-2xl p-6 reveal hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-accent/20" style="transition-delay:0.25s">
        <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">📊</div>
        <h3 class="font-bold text-lg mb-2">供應鏈顧問</h3>
        <p class="text-steel text-sm leading-relaxed">物流架構優化、成本分析、路線規劃。AI 驅動的數據決策輔助。</p>
        <div class="mt-4 flex gap-2">
          <span class="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">AI</span>
          <span class="bg-neon/10 text-cyan-600 text-[10px] font-bold px-2 py-0.5 rounded-full">數據</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Tracking -->
<section id="tracking" class="py-20 bg-surface">
  <div class="max-w-3xl mx-auto px-6">
    <div class="text-center mb-12 reveal">
      <div class="text-accent text-xs tracking-[0.2em] uppercase font-bold mb-2">Track</div>
      <h2 class="text-3xl md:text-4xl font-bold">查件追蹤</h2>
    </div>
    <div class="bg-white rounded-2xl p-8 shadow-lg reveal">
      <div class="flex gap-3 mb-6">
        <input type="text" id="trackInput" placeholder="輸入貨件編號（如 SC-2026021600001）" class="flex-1 border border-gray-200 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-accent">
        <button onclick="showTracking()" class="bg-accent text-white px-6 py-3.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors cursor-pointer">查詢</button>
      </div>
      <div id="trackResult" class="hidden">
        <div class="flex items-center justify-between mb-4">
          <div><div class="font-bold">SC-2026021600001</div><div class="text-xs text-steel">台北 → 高雄 · 一般陸運</div></div>
          <span class="bg-neon/10 text-cyan-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"><span class="w-1.5 h-1.5 bg-neon rounded-full pulse-dot"></span>運送中</span>
        </div>
        <div class="space-y-0 ml-4 border-l-2 border-accent/20 pl-6">
          <div class="relative pb-6">
            <div class="absolute -left-[31px] w-4 h-4 bg-success rounded-full border-2 border-white"></div>
            <div class="font-bold text-sm">已送達目的地倉庫</div>
            <div class="text-xs text-steel">2026-02-16 14:32 · 高雄楠梓倉儲中心</div>
          </div>
          <div class="relative pb-6">
            <div class="absolute -left-[31px] w-4 h-4 bg-accent rounded-full border-2 border-white pulse-dot"></div>
            <div class="font-bold text-sm text-accent">運送中 — 國道一號南下</div>
            <div class="text-xs text-steel">2026-02-16 08:15 · 預計 16:00 到達</div>
          </div>
          <div class="relative pb-6">
            <div class="absolute -left-[31px] w-4 h-4 bg-gray-300 rounded-full border-2 border-white"></div>
            <div class="font-bold text-sm text-steel">已離開轉運站</div>
            <div class="text-xs text-steel">2026-02-16 06:40 · 台中烏日轉運中心</div>
          </div>
          <div class="relative pb-6">
            <div class="absolute -left-[31px] w-4 h-4 bg-gray-300 rounded-full border-2 border-white"></div>
            <div class="font-bold text-sm text-steel">已出庫</div>
            <div class="text-xs text-steel">2026-02-15 22:10 · 台北內湖物流中心</div>
          </div>
          <div class="relative">
            <div class="absolute -left-[31px] w-4 h-4 bg-gray-300 rounded-full border-2 border-white"></div>
            <div class="font-bold text-sm text-steel">已收件</div>
            <div class="text-xs text-steel">2026-02-15 18:30 · 台北信義區取件</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Network Stats -->
<section id="network" class="py-20 bg-navy text-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <div class="text-neon text-xs tracking-[0.2em] uppercase font-bold mb-2">Network</div>
      <h2 class="text-3xl md:text-4xl font-bold">物流網絡</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
      <div class="text-center reveal bg-white/5 rounded-xl p-6 border border-white/10">
        <div class="text-3xl font-bold text-neon mb-1">50+</div>
        <div class="text-xs text-white/40">服務據點</div>
      </div>
      <div class="text-center reveal bg-white/5 rounded-xl p-6 border border-white/10" style="transition-delay:0.1s">
        <div class="text-3xl font-bold text-accent mb-1">800+</div>
        <div class="text-xs text-white/40">自有車隊</div>
      </div>
      <div class="text-center reveal bg-white/5 rounded-xl p-6 border border-white/10" style="transition-delay:0.2s">
        <div class="text-3xl font-bold text-success mb-1">15萬㎡</div>
        <div class="text-xs text-white/40">倉儲面積</div>
      </div>
      <div class="text-center reveal bg-white/5 rounded-xl p-6 border border-white/10" style="transition-delay:0.3s">
        <div class="text-3xl font-bold text-warning mb-1">30+</div>
        <div class="text-xs text-white/40">國際航線</div>
      </div>
    </div>
    <!-- Client logos -->
    <div class="reveal">
      <p class="text-center text-white/20 text-xs tracking-wider mb-6">深受信賴的合作夥伴</p>
      <div class="grid grid-cols-3 md:grid-cols-6 gap-4">
        <div class="bg-white/5 rounded-lg p-4 flex items-center justify-center text-white/20 text-xs font-bold h-14">TSMC</div>
        <div class="bg-white/5 rounded-lg p-4 flex items-center justify-center text-white/20 text-xs font-bold h-14">ASUS</div>
        <div class="bg-white/5 rounded-lg p-4 flex items-center justify-center text-white/20 text-xs font-bold h-14">PChome</div>
        <div class="bg-white/5 rounded-lg p-4 flex items-center justify-center text-white/20 text-xs font-bold h-14">MOMO</div>
        <div class="bg-white/5 rounded-lg p-4 flex items-center justify-center text-white/20 text-xs font-bold h-14">Costco</div>
        <div class="bg-white/5 rounded-lg p-4 flex items-center justify-center text-white/20 text-xs font-bold h-14">Shopee</div>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid lg:grid-cols-2 gap-16">
      <div class="reveal">
        <div class="text-accent text-xs tracking-[0.2em] uppercase font-bold mb-4">Contact</div>
        <h2 class="text-3xl md:text-4xl font-bold mb-8">讓我們為您<br>量身打造物流方案</h2>
        <div class="space-y-4 text-steel text-sm">
          <div class="flex items-center gap-3"><span>📍</span>台北市內湖區瑞光路 388 號 8F</div>
          <div class="flex items-center gap-3"><span>📞</span>02-8752-6800</div>
          <div class="flex items-center gap-3"><span>🆘</span>24hr 客服專線：0800-088-168</div>
          <div class="flex items-center gap-3"><span>✉️</span>sales@swiftchain.tw</div>
        </div>
      </div>
      <div class="reveal">
        <div class="bg-surface rounded-2xl p-8">
          <h3 class="font-bold text-lg mb-6">取得免費報價</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <input type="text" placeholder="公司名稱" class="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent">
              <input type="text" placeholder="聯絡人" class="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <input type="tel" placeholder="電話" class="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent">
              <input type="email" placeholder="Email" class="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent">
            </div>
            <select class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent cursor-pointer text-steel">
              <option>需求服務</option>
              <option>陸運配送</option>
              <option>倉儲管理</option>
              <option>電商物流</option>
              <option>國際貨運</option>
              <option>逆向物流</option>
              <option>供應鏈顧問</option>
            </select>
            <textarea rows="3" placeholder="補充說明（月出貨量、品項類型等）" class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent resize-none"></textarea>
            <button onclick="showToast('報價需求已收到！業務專員將於 1 個工作天內聯繫您 📋')" class="w-full bg-accent text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors cursor-pointer">
              送出報價需求
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-navy text-white py-8">
  <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
    <div class="flex items-center gap-2">
      <div class="w-6 h-6 bg-accent rounded flex items-center justify-center text-white text-xs font-bold">⚡</div>
      <span class="font-bold text-sm">SwiftChain 捷達物流</span>
    </div>
    <p class="text-white/30 text-xs">© 2026 SwiftChain Logistics Co., Ltd. All rights reserved.</p>
  </div>
</footer>

<!-- Quote Modal -->
<div id="quoteModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="bg-white rounded-2xl p-8 max-w-md w-full">
    <div class="flex items-center justify-between mb-6">
      <h3 class="font-bold text-lg">📋 快速報價</h3>
      <button onclick="document.getElementById('quoteModal').classList.add('hidden')" class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 cursor-pointer">✕</button>
    </div>
    <div class="space-y-4">
      <input type="text" placeholder="公司名稱" class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent">
      <input type="tel" placeholder="聯絡電話" class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent">
      <select class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent cursor-pointer text-steel">
        <option>月出貨量</option>
        <option>100 件以下</option>
        <option>100 - 1,000 件</option>
        <option>1,000 - 10,000 件</option>
        <option>10,000 件以上</option>
      </select>
      <button onclick="document.getElementById('quoteModal').classList.add('hidden');showToast('報價需求已送出！我們會盡快回覆 ⚡')" class="w-full bg-accent text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors cursor-pointer">
        取得報價 →
      </button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 bg-navy text-white px-6 py-3.5 rounded-xl shadow-2xl z-[60] translate-y-20 opacity-0 transition-all duration-500 text-sm font-medium"></div>

<script>
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3000)}
function showTracking(){document.getElementById('trackResult').classList.remove('hidden')}
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
