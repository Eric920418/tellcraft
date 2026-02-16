INSERT INTO template_previews (template_id, html_content, version)
VALUES ('e181b936-28ea-492d-91c7-66c48226fef2', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>日光能源 SolarPeak</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{solar:'#eab308',leaf:'#16a34a',sky:'#0ea5e9',dark:'#0a0a0a',slate:'#1e293b',surface:'#f0fdf4'},fontFamily:{sans:['Space Grotesk','sans-serif']}}}}
</script>
<style>
*{font-family:'Space Grotesk',sans-serif}
html{scroll-behavior:smooth}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s cubic-bezier(0.4,0,0.2,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.glow-solar{box-shadow:0 0 40px rgba(234,179,8,0.15)}
.counter{font-variant-numeric:tabular-nums}
</style>
</head>
<body class="bg-white text-slate overflow-x-hidden">

<!-- Nav -->
<nav class="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
  <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 bg-solar rounded-lg flex items-center justify-center text-white font-bold text-sm">☀</div>
      <span class="font-bold text-lg">Solar<span class="text-solar">Peak</span></span>
    </div>
    <div class="hidden md:flex items-center gap-8 text-sm">
      <a href="#solutions" class="text-slate/50 hover:text-slate transition-colors cursor-pointer">解決方案</a>
      <a href="#benefits" class="text-slate/50 hover:text-slate transition-colors cursor-pointer">為什麼選我們</a>
      <a href="#projects" class="text-slate/50 hover:text-slate transition-colors cursor-pointer">案例實績</a>
      <a href="#calculator" class="text-slate/50 hover:text-slate transition-colors cursor-pointer">省電試算</a>
      <a href="#contact" class="text-slate/50 hover:text-slate transition-colors cursor-pointer">聯繫</a>
    </div>
    <button onclick="document.getElementById('consultModal').classList.remove('hidden')" class="bg-solar text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-yellow-600 transition-colors cursor-pointer shadow-lg shadow-solar/20">
      免費諮詢
    </button>
  </div>
</nav>

<!-- Hero -->
<section class="pt-28 pb-20 bg-gradient-to-b from-surface to-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div class="reveal">
        <div class="inline-flex items-center gap-2 bg-leaf/10 text-leaf text-xs font-bold px-3 py-1.5 rounded-full mb-6">
          <span class="w-2 h-2 bg-leaf rounded-full animate-pulse"></span>
          2026 政府補助最高 40% · 限時申請中
        </div>
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
          讓<span class="text-solar">陽光</span>為你<br>
          賺<span class="text-leaf">綠金</span>
        </h1>
        <p class="text-slate/50 text-lg leading-relaxed mb-8 max-w-lg">
          專業太陽能系統設計與安裝，為家庭、企業、農地提供客製化綠能方案。20 年保固，每月帳單省 70% 以上。
        </p>
        <div class="flex gap-4 mb-10">
          <button onclick="document.getElementById('consultModal').classList.remove('hidden')" class="bg-solar text-white px-8 py-4 rounded-xl font-bold hover:bg-yellow-600 transition-all shadow-lg shadow-solar/20 cursor-pointer">
            免費到府評估 →
          </button>
          <a href="#calculator" class="border border-slate/20 text-slate/70 px-8 py-4 rounded-xl font-bold hover:border-solar hover:text-solar transition-all cursor-pointer text-center">
            省電試算
          </a>
        </div>
        <div class="flex gap-10">
          <div>
            <div class="text-3xl font-bold text-solar counter" id="stat1">0</div>
            <div class="text-xs text-slate/40 mt-1">MW 累計裝置量</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-leaf counter" id="stat2">0</div>
            <div class="text-xs text-slate/40 mt-1">座安裝案場</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-sky counter" id="stat3">0</div>
            <div class="text-xs text-slate/40 mt-1">噸 CO₂ 年減碳</div>
          </div>
        </div>
      </div>
      <div class="relative reveal">
        <div class="bg-gradient-to-br from-solar/10 to-leaf/10 rounded-3xl p-8 glow-solar">
          <div class="grid grid-cols-3 gap-3">
            <div class="col-span-3 bg-gradient-to-r from-solar/30 to-solar/20 rounded-xl h-32 flex items-center justify-center">
              <div class="text-center">
                <div class="text-4xl mb-1">☀️</div>
                <div class="text-xs text-slate/60 font-medium">太陽能板陣列</div>
              </div>
            </div>
            <div class="bg-white rounded-xl p-4 text-center shadow-sm">
              <div class="text-xl mb-1">⚡</div>
              <div class="text-xs font-bold">逆變器</div>
              <div class="text-[10px] text-leaf">運作中</div>
            </div>
            <div class="bg-white rounded-xl p-4 text-center shadow-sm">
              <div class="text-xl mb-1">🔋</div>
              <div class="text-xs font-bold">儲能電池</div>
              <div class="text-[10px] text-solar">85%</div>
            </div>
            <div class="bg-white rounded-xl p-4 text-center shadow-sm">
              <div class="text-xl mb-1">📊</div>
              <div class="text-xs font-bold">監控系統</div>
              <div class="text-[10px] text-sky">即時</div>
            </div>
          </div>
          <div class="mt-4 bg-white rounded-xl p-4 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold">今日發電量</span>
              <span class="text-solar text-xs font-bold">28.5 kWh</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2">
              <div class="bg-gradient-to-r from-solar to-leaf rounded-full h-2" style="width:72%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-slate/30 mt-1">
              <span>0 kWh</span><span>目標 40 kWh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Solutions -->
<section id="solutions" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <div class="text-solar text-xs tracking-[0.2em] uppercase font-bold mb-2">Solutions</div>
      <h2 class="text-3xl md:text-4xl font-bold">解決方案</h2>
      <p class="text-slate/40 mt-3 max-w-md mx-auto text-sm">不論是自家屋頂、廠房、或農地，我們都能量身打造最佳方案</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="bg-surface rounded-2xl p-8 reveal hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-solar/20">
        <div class="w-14 h-14 bg-solar/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🏠</div>
        <h3 class="font-bold text-lg mb-3">住宅太陽能</h3>
        <p class="text-slate/50 text-sm leading-relaxed mb-4">3-10kW 屋頂型系統，每月省電 60-80%。搭配儲能電池，停電也不怕。</p>
        <ul class="space-y-2 text-sm text-slate/60">
          <li class="flex items-center gap-2"><span class="text-leaf">✓</span> 免費屋頂評估</li>
          <li class="flex items-center gap-2"><span class="text-leaf">✓</span> 政府補助 NT$30,000/kW</li>
          <li class="flex items-center gap-2"><span class="text-leaf">✓</span> 20 年產品保固</li>
        </ul>
        <div class="mt-6 text-solar font-bold text-sm group-hover:underline">了解更多 →</div>
      </div>
      <div class="bg-surface rounded-2xl p-8 reveal hover:shadow-xl transition-all cursor-pointer group border-2 border-solar/30 relative" style="transition-delay:0.1s">
        <div class="absolute -top-3 right-6 bg-solar text-white text-xs font-bold px-3 py-1 rounded-full">最受歡迎</div>
        <div class="w-14 h-14 bg-solar/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🏭</div>
        <h3 class="font-bold text-lg mb-3">企業 / 工廠</h3>
        <p class="text-slate/50 text-sm leading-relaxed mb-4">50-500kW 大型屋頂或地面系統。台電餘電回售，投資報酬率 8-12%。</p>
        <ul class="space-y-2 text-sm text-slate/60">
          <li class="flex items-center gap-2"><span class="text-leaf">✓</span> 客製化系統設計</li>
          <li class="flex items-center gap-2"><span class="text-leaf">✓</span> 台電併聯申請代辦</li>
          <li class="flex items-center gap-2"><span class="text-leaf">✓</span> ESG 碳足跡報告</li>
          <li class="flex items-center gap-2"><span class="text-leaf">✓</span> 遠端監控系統</li>
        </ul>
        <div class="mt-6 text-solar font-bold text-sm group-hover:underline">了解更多 →</div>
      </div>
      <div class="bg-surface rounded-2xl p-8 reveal hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-solar/20" style="transition-delay:0.2s">
        <div class="w-14 h-14 bg-solar/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🌾</div>
        <h3 class="font-bold text-lg mb-3">農地 / 畜牧</h3>
        <p class="text-slate/50 text-sm leading-relaxed mb-4">農電共生方案，上方發電、下方耕作。養雞場、養菇場遮陽棚整合。</p>
        <ul class="space-y-2 text-sm text-slate/60">
          <li class="flex items-center gap-2"><span class="text-leaf">✓</span> 農業用電優惠費率</li>
          <li class="flex items-center gap-2"><span class="text-leaf">✓</span> 種電收入穩定</li>
          <li class="flex items-center gap-2"><span class="text-leaf">✓</span> 合法用地變更</li>
        </ul>
        <div class="mt-6 text-solar font-bold text-sm group-hover:underline">了解更多 →</div>
      </div>
    </div>
  </div>
</section>

<!-- Benefits -->
<section id="benefits" class="py-20 bg-slate text-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <div class="text-solar text-xs tracking-[0.2em] uppercase font-bold mb-2">Why SolarPeak</div>
      <h2 class="text-3xl md:text-4xl font-bold">為什麼選日光能源</h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="text-center reveal">
        <div class="w-16 h-16 bg-solar/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🏅</div>
        <h3 class="font-bold mb-2">15 年經驗</h3>
        <p class="text-white/50 text-sm">全台最大太陽能系統商之一，累計安裝超過 500 座案場。</p>
      </div>
      <div class="text-center reveal" style="transition-delay:0.1s">
        <div class="w-16 h-16 bg-leaf/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🔧</div>
        <h3 class="font-bold mb-2">一站式服務</h3>
        <p class="text-white/50 text-sm">從評估、設計、安裝到維運，全程由自有工班完成，品質有保障。</p>
      </div>
      <div class="text-center reveal" style="transition-delay:0.2s">
        <div class="w-16 h-16 bg-sky/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">📡</div>
        <h3 class="font-bold mb-2">智慧監控</h3>
        <p class="text-white/50 text-sm">24/7 即時發電監控，手機 APP 隨時查看發電量與收益。</p>
      </div>
      <div class="text-center reveal" style="transition-delay:0.3s">
        <div class="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">💰</div>
        <h3 class="font-bold mb-2">補助代辦</h3>
        <p class="text-white/50 text-sm">免費協助申請政府補助、台電併聯、銀行綠能貸款，省心省力。</p>
      </div>
    </div>
  </div>
</section>

<!-- Calculator -->
<section id="calculator" class="py-20 bg-surface">
  <div class="max-w-3xl mx-auto px-6">
    <div class="text-center mb-12 reveal">
      <div class="text-solar text-xs tracking-[0.2em] uppercase font-bold mb-2">Calculator</div>
      <h2 class="text-3xl md:text-4xl font-bold">省電試算</h2>
      <p class="text-slate/40 mt-3 text-sm">輸入您的月均電費，看看太陽能能省多少錢</p>
    </div>
    <div class="bg-white rounded-2xl p-8 shadow-lg reveal">
      <div class="mb-6">
        <label class="text-sm font-bold mb-2 block">您每月平均電費（NTD）</label>
        <input type="range" id="billSlider" min="1000" max="50000" value="5000" step="500" class="w-full accent-solar cursor-pointer" oninput="calculate()">
        <div class="flex justify-between text-xs text-slate/40 mt-1">
          <span>$1,000</span>
          <span id="billValue" class="text-solar font-bold text-lg">$5,000</span>
          <span>$50,000</span>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label class="text-sm font-bold mb-2 block">屋頂類型</label>
          <select class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-solar cursor-pointer" onchange="calculate()">
            <option>斜屋頂（鐵皮）</option>
            <option>平屋頂（RC）</option>
            <option>地面型</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-bold mb-2 block">所在區域</label>
          <select id="region" class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-solar cursor-pointer" onchange="calculate()">
            <option value="1.1">北部</option>
            <option value="1.2">中部</option>
            <option value="1.35" selected>南部</option>
            <option value="1.0">東部</option>
          </select>
        </div>
      </div>
      <div class="bg-surface rounded-xl p-6">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-xs text-slate/40 mb-1">建議系統規模</div>
            <div class="text-2xl font-bold text-solar" id="calcKw">5 kW</div>
          </div>
          <div>
            <div class="text-xs text-slate/40 mb-1">預估月省金額</div>
            <div class="text-2xl font-bold text-leaf" id="calcSave">$3,500</div>
          </div>
          <div>
            <div class="text-xs text-slate/40 mb-1">投資回收年限</div>
            <div class="text-2xl font-bold text-sky" id="calcRoi">5.2 年</div>
          </div>
        </div>
        <div class="mt-4 bg-white rounded-lg p-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate/50">20 年累計節省</span>
            <span class="font-bold text-leaf text-lg" id="calc20y">$840,000</span>
          </div>
        </div>
      </div>
      <button onclick="document.getElementById('consultModal').classList.remove('hidden')" class="w-full mt-6 bg-solar text-white py-4 rounded-xl font-bold hover:bg-yellow-600 transition-colors cursor-pointer shadow-lg shadow-solar/20">
        立即預約免費評估 →
      </button>
    </div>
  </div>
</section>

<!-- Projects -->
<section id="projects" class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <div class="text-solar text-xs tracking-[0.2em] uppercase font-bold mb-2">Projects</div>
      <h2 class="text-3xl md:text-4xl font-bold">案例實績</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="bg-surface rounded-2xl overflow-hidden reveal group cursor-pointer">
        <div class="aspect-[4/3] bg-gradient-to-br from-solar/20 to-solar/5 flex items-center justify-center">
          <div class="text-5xl group-hover:scale-110 transition-transform">🏭</div>
        </div>
        <div class="p-5">
          <h3 class="font-bold mb-1">台中精密工業 — 280kW</h3>
          <p class="text-slate/40 text-xs mb-3">屋頂型 · 年發電 33 萬度 · 年省 $120 萬</p>
          <div class="flex gap-2">
            <span class="bg-solar/10 text-solar text-[10px] font-bold px-2 py-0.5 rounded-full">工業廠房</span>
            <span class="bg-leaf/10 text-leaf text-[10px] font-bold px-2 py-0.5 rounded-full">ESG 認證</span>
          </div>
        </div>
      </div>
      <div class="bg-surface rounded-2xl overflow-hidden reveal group cursor-pointer" style="transition-delay:0.1s">
        <div class="aspect-[4/3] bg-gradient-to-br from-leaf/20 to-leaf/5 flex items-center justify-center">
          <div class="text-5xl group-hover:scale-110 transition-transform">🌾</div>
        </div>
        <div class="p-5">
          <h3 class="font-bold mb-1">屏東農電共生 — 500kW</h3>
          <p class="text-slate/40 text-xs mb-3">地面型 · 養雞場整合 · 雙重收入</p>
          <div class="flex gap-2">
            <span class="bg-solar/10 text-solar text-[10px] font-bold px-2 py-0.5 rounded-full">農地</span>
            <span class="bg-sky/10 text-sky text-[10px] font-bold px-2 py-0.5 rounded-full">補助案</span>
          </div>
        </div>
      </div>
      <div class="bg-surface rounded-2xl overflow-hidden reveal group cursor-pointer" style="transition-delay:0.2s">
        <div class="aspect-[4/3] bg-gradient-to-br from-sky/20 to-sky/5 flex items-center justify-center">
          <div class="text-5xl group-hover:scale-110 transition-transform">🏠</div>
        </div>
        <div class="p-5">
          <h3 class="font-bold mb-1">新竹透天別墅 — 8kW</h3>
          <p class="text-slate/40 text-xs mb-3">屋頂型 + 儲能 · 月省 $4,200 · 停電備援</p>
          <div class="flex gap-2">
            <span class="bg-solar/10 text-solar text-[10px] font-bold px-2 py-0.5 rounded-full">住宅</span>
            <span class="bg-leaf/10 text-leaf text-[10px] font-bold px-2 py-0.5 rounded-full">儲能</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-20 bg-slate text-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid lg:grid-cols-2 gap-16">
      <div class="reveal">
        <div class="text-solar text-xs tracking-[0.2em] uppercase font-bold mb-4">Contact</div>
        <h2 class="text-3xl md:text-4xl font-bold mb-8">開始您的<br>綠能之旅</h2>
        <div class="space-y-4 text-white/60 text-sm">
          <div class="flex items-center gap-3"><span>📍</span>台北市信義區松仁路 100 號 15 樓</div>
          <div class="flex items-center gap-3"><span>📞</span>0800-888-168（免費專線）</div>
          <div class="flex items-center gap-3"><span>✉️</span>hello@solarpeak.tw</div>
          <div class="flex items-center gap-3"><span>⏰</span>週一至週六 09:00 - 18:00</div>
        </div>
        <div class="flex gap-4 mt-8">
          <span class="bg-white/10 px-4 py-2 rounded-lg text-xs font-bold">ISO 9001</span>
          <span class="bg-white/10 px-4 py-2 rounded-lg text-xs font-bold">ISO 14001</span>
          <span class="bg-solar/20 text-solar px-4 py-2 rounded-lg text-xs font-bold">經濟部認證</span>
        </div>
      </div>
      <div class="reveal">
        <div class="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h3 class="font-bold text-lg mb-6">免費諮詢表單</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <input type="text" placeholder="姓名" class="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-solar">
              <input type="tel" placeholder="電話" class="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-solar">
            </div>
            <select class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/50 focus:outline-none focus:border-solar cursor-pointer">
              <option>您的需求</option>
              <option>住宅屋頂太陽能</option>
              <option>企業/工廠屋頂</option>
              <option>農地/畜牧場</option>
              <option>儲能系統</option>
              <option>其他</option>
            </select>
            <textarea rows="3" placeholder="補充說明（屋頂面積、月電費等）" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-solar resize-none"></textarea>
            <button onclick="showToast('已收到您的諮詢！專員將於 24 小時內聯繫您 ☀️')" class="w-full bg-solar text-white py-4 rounded-xl font-bold hover:bg-yellow-600 transition-colors cursor-pointer">
              送出免費諮詢
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-dark text-white py-8">
  <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
    <div class="flex items-center gap-2">
      <div class="w-6 h-6 bg-solar rounded flex items-center justify-center text-white text-xs font-bold">☀</div>
      <span class="font-bold">SolarPeak 日光能源</span>
    </div>
    <p class="text-white/30 text-xs">© 2026 SolarPeak Energy Co., Ltd. All rights reserved.</p>
  </div>
</footer>

<!-- Consult Modal -->
<div id="consultModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="bg-white rounded-2xl p-8 max-w-md w-full">
    <div class="flex items-center justify-between mb-6">
      <h3 class="font-bold text-lg">☀️ 免費到府評估</h3>
      <button onclick="document.getElementById('consultModal').classList.add('hidden')" class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 cursor-pointer">✕</button>
    </div>
    <div class="space-y-4">
      <input type="text" placeholder="姓名" class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-solar">
      <input type="tel" placeholder="電話" class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-solar">
      <input type="text" placeholder="安裝地址" class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-solar">
      <select class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-solar cursor-pointer text-slate/50">
        <option>屋頂類型</option>
        <option>鐵皮屋頂</option>
        <option>RC 平頂</option>
        <option>斜屋頂（瓦片）</option>
        <option>地面空地</option>
      </select>
      <button onclick="document.getElementById('consultModal').classList.add('hidden');showToast('預約成功！工程師將在 2 個工作天內到府評估 🔧')" class="w-full bg-solar text-white py-4 rounded-xl font-bold hover:bg-yellow-600 transition-colors cursor-pointer shadow-lg shadow-solar/20">
        確認預約 →
      </button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 bg-slate text-white px-6 py-3.5 rounded-xl shadow-2xl z-[60] translate-y-20 opacity-0 transition-all duration-500 text-sm font-medium"></div>

<script>
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3000)}

function calculate(){
  const bill=parseInt(document.getElementById('billSlider').value);
  const region=parseFloat(document.getElementById('region').value);
  document.getElementById('billValue').textContent='$'+bill.toLocaleString();
  const kw=Math.max(3,Math.round(bill/800));
  const save=Math.round(bill*0.7);
  const cost=kw*55000;
  const roi=(cost/(save*12)).toFixed(1);
  const total=save*12*20;
  document.getElementById('calcKw').textContent=kw+' kW';
  document.getElementById('calcSave').textContent='$'+save.toLocaleString();
  document.getElementById('calcRoi').textContent=roi+' 年';
  document.getElementById('calc20y').textContent='$'+total.toLocaleString();
}

// Counter animation
function animateCounter(el,target,suffix=''){
  let current=0;const step=Math.ceil(target/60);
  const timer=setInterval(()=>{current+=step;if(current>=target){current=target;clearInterval(timer)}el.textContent=current.toLocaleString()+suffix},30);
}

const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}})},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

// Animate stats on load
setTimeout(()=>{
  animateCounter(document.getElementById('stat1'),85);
  animateCounter(document.getElementById('stat2'),520);
  animateCounter(document.getElementById('stat3'),12800);
},500);

calculate();
</script>
</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
