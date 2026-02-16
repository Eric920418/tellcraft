INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '6c3b45bb-3e73-40b9-890d-aaf995f33575',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RESONANCE — 音樂工作室</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        res: { 50:'#faf5ff', 100:'#f3e8ff', 200:'#e9d5ff', 300:'#d8b4fe', 400:'#c084fc', 500:'#a855f7', 600:'#9333ea', 700:'#7e22ce', 800:'#6b21a8', 900:'#581c87' },
        sonic: { 50:'#f5f3ff', 100:'#ede9fe', 200:'#ddd6fe', 300:'#c4b5fd', 400:'#a78bfa', 500:'#8b5cf6' },
        dark: { 50:'#18181b', 100:'#111113', 200:'#0c0c0e', 300:'#070709' }
      },
      fontFamily: { space:['Space Grotesk','Noto Sans TC','sans-serif'] }
    }
  }
}
</script>
<style>
  * { font-family: 'Space Grotesk', 'Noto Sans TC', sans-serif; }
  html { scroll-behavior: smooth; }
  body { background: #070709; color: #e5e5e5; }
  .reveal { opacity:0; transform:translateY(20px); transition:all 0.6s cubic-bezier(0.16,1,0.3,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }
  .purple-glow { text-shadow: 0 0 30px rgba(168,85,247,0.4); }
  .eq-bar { animation: eq 1.2s ease-in-out infinite; }
  .eq-bar:nth-child(2) { animation-delay: 0.2s; }
  .eq-bar:nth-child(3) { animation-delay: 0.4s; }
  .eq-bar:nth-child(4) { animation-delay: 0.1s; }
  .eq-bar:nth-child(5) { animation-delay: 0.3s; }
  @keyframes eq { 0%,100%{ height:8px; } 50%{ height:24px; } }
  .wave-bg { background: linear-gradient(180deg, rgba(168,85,247,0.05) 0%, transparent 50%), linear-gradient(0deg, rgba(139,92,246,0.03) 0%, transparent 30%); }
</style>
</head>
<body>

<!-- Navbar -->
<nav class="fixed top-0 w-full bg-dark-300/90 backdrop-blur-md z-50 border-b border-white/5">
  <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2.5">
      <div class="flex items-end gap-0.5 h-5">
        <div class="eq-bar w-1 bg-res-500 rounded-full"></div>
        <div class="eq-bar w-1 bg-res-400 rounded-full"></div>
        <div class="eq-bar w-1 bg-res-500 rounded-full"></div>
        <div class="eq-bar w-1 bg-res-400 rounded-full"></div>
        <div class="eq-bar w-1 bg-res-500 rounded-full"></div>
      </div>
      <span class="text-lg font-bold tracking-tight">RESONANCE</span>
    </a>
    <div class="hidden md:flex items-center gap-8 text-sm font-medium text-white/50">
      <a href="#services" class="hover:text-res-400 transition-colors">服務</a>
      <a href="#studio" class="hover:text-res-400 transition-colors">錄音室</a>
      <a href="#works" class="hover:text-res-400 transition-colors">作品</a>
      <a href="#pricing" class="hover:text-res-400 transition-colors">價格</a>
      <a href="#contact" class="hover:text-res-400 transition-colors">聯絡</a>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="document.getElementById('booking-modal').classList.remove('hidden')" class="bg-res-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-res-600 transition-colors shadow-lg shadow-res-500/25">
        預約錄音
      </button>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-white/50">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-dark-300 border-t border-white/5 px-6 py-4 space-y-3">
    <a href="#services" class="block text-sm text-white/50">服務</a>
    <a href="#studio" class="block text-sm text-white/50">錄音室</a>
    <a href="#works" class="block text-sm text-white/50">作品</a>
    <a href="#pricing" class="block text-sm text-white/50">價格</a>
    <a href="#contact" class="block text-sm text-white/50">聯絡</a>
  </div>
</nav>

<!-- Hero -->
<section class="pt-14 min-h-screen flex items-center relative overflow-hidden wave-bg">
  <div class="absolute inset-0 flex items-center justify-center opacity-10">
    <div class="w-[500px] h-[500px] rounded-full bg-res-500 blur-[200px]"></div>
  </div>
  <div class="relative z-10 max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
    <div>
      <div class="inline-flex items-center gap-2 border border-res-500/30 text-res-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
        <span class="w-2 h-2 bg-res-500 rounded-full animate-pulse"></span>
        Professional Recording Studio
      </div>
      <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none mb-6">
        讓你的音樂<br>
        <span class="text-res-400 purple-glow">被世界聽見</span>
      </h1>
      <p class="text-white/40 text-lg leading-relaxed mb-8 max-w-lg">
        RESONANCE 提供專業錄音、混音、母帶後期、音樂製作等全方位服務。配備頂級器材，由金曲獎級製作人為你的音樂注入靈魂。
      </p>
      <div class="flex flex-wrap gap-4">
        <button onclick="document.getElementById('booking-modal').classList.remove('hidden')" class="bg-res-500 text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-res-600 transition-colors shadow-xl shadow-res-500/30">
          立即預約 →
        </button>
        <a href="#works" class="border border-white/15 text-white/70 px-8 py-3.5 rounded-lg font-semibold hover:border-res-400/50 hover:text-res-400 transition-colors">
          聆聽作品
        </a>
      </div>
    </div>
    <div class="flex justify-center">
      <div class="relative w-72 h-72 md:w-80 md:h-80">
        <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-res-600/20 to-sonic-500/20 border border-res-500/20 flex items-center justify-center">
          <span class="text-[120px] opacity-80">🎙️</span>
        </div>
        <div class="absolute -bottom-3 -right-3 bg-dark-100 border border-white/10 rounded-xl p-3 shadow-xl">
          <div class="flex items-center gap-2">
            <div class="flex items-end gap-0.5 h-6">
              <div class="eq-bar w-1.5 bg-res-500 rounded-full"></div>
              <div class="eq-bar w-1.5 bg-res-400 rounded-full"></div>
              <div class="eq-bar w-1.5 bg-res-500 rounded-full"></div>
              <div class="eq-bar w-1.5 bg-res-400 rounded-full"></div>
            </div>
            <div><p class="text-xs font-semibold">Recording</p><p class="text-[10px] text-res-400">Live Session</p></div>
          </div>
        </div>
        <div class="absolute -top-3 -left-3 bg-dark-100 border border-white/10 rounded-xl p-3 shadow-xl">
          <p class="text-xs text-white/40">合作藝人</p>
          <p class="text-lg font-bold text-res-400">200+</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-24 border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-res-400 text-xs tracking-[0.3em] uppercase font-medium">Services</span>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight mt-2">專業服務</h2>
      <p class="text-white/40 mt-3">從錄音到發行，一站式音樂製作</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl p-6 hover:border-res-500/30 transition-all group cursor-pointer">
        <span class="text-3xl block mb-4 group-hover:scale-110 transition-transform">🎙️</span>
        <h3 class="font-bold text-lg mb-2">錄音</h3>
        <p class="text-white/40 text-sm leading-relaxed">歌曲錄音、配音、Podcast 錄製。Neumann U87 × AMS Neve 前級。</p>
      </div>
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl p-6 hover:border-res-500/30 transition-all group cursor-pointer">
        <span class="text-3xl block mb-4 group-hover:scale-110 transition-transform">🎛️</span>
        <h3 class="font-bold text-lg mb-2">混音</h3>
        <p class="text-white/40 text-sm leading-relaxed">立體聲 / 杜比全景聲混音。金曲獎混音師操刀，每軌精雕細琢。</p>
      </div>
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl p-6 hover:border-res-500/30 transition-all group cursor-pointer">
        <span class="text-3xl block mb-4 group-hover:scale-110 transition-transform">💿</span>
        <h3 class="font-bold text-lg mb-2">母帶後期</h3>
        <p class="text-white/40 text-sm leading-relaxed">Mastering 讓音樂達到發行品質。支援 Apple Digital Masters。</p>
      </div>
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl p-6 hover:border-res-500/30 transition-all group cursor-pointer">
        <span class="text-3xl block mb-4 group-hover:scale-110 transition-transform">🎹</span>
        <h3 class="font-bold text-lg mb-2">音樂製作</h3>
        <p class="text-white/40 text-sm leading-relaxed">詞曲創作、編曲、Beat 製作。流行/嘻哈/電子/獨立全風格。</p>
      </div>
    </div>
  </div>
</section>

<!-- Studio -->
<section id="studio" class="py-24 border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-res-400 text-xs tracking-[0.3em] uppercase font-medium">Studios</span>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight mt-2">錄音室空間</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-5">
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl overflow-hidden group cursor-pointer hover:border-res-500/20 transition-colors">
        <div class="h-44 bg-gradient-to-br from-res-900/50 to-dark-200 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">🎤</div>
        <div class="p-5">
          <h3 class="font-bold text-lg">Studio A — 主錄音室</h3>
          <p class="text-white/40 text-sm mt-2 leading-relaxed">30 坪隔音空間 · SSL 混音台 · 可容納 12 人樂團同步錄音</p>
          <p class="text-res-400 text-sm font-semibold mt-3">$3,000/hr</p>
        </div>
      </div>
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl overflow-hidden group cursor-pointer hover:border-res-500/20 transition-colors">
        <div class="h-44 bg-gradient-to-br from-sonic-900/50 to-dark-200 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">🎧</div>
        <div class="p-5">
          <h3 class="font-bold text-lg">Studio B — 混音室</h3>
          <p class="text-white/40 text-sm mt-2 leading-relaxed">15 坪 · Genelec 7.1.4 監聽 · 杜比全景聲認證空間</p>
          <p class="text-res-400 text-sm font-semibold mt-3">$2,000/hr</p>
        </div>
      </div>
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl overflow-hidden group cursor-pointer hover:border-res-500/20 transition-colors">
        <div class="h-44 bg-gradient-to-br from-purple-900/50 to-dark-200 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">🎵</div>
        <div class="p-5">
          <h3 class="font-bold text-lg">Studio C — 製作室</h3>
          <p class="text-white/40 text-sm mt-2 leading-relaxed">10 坪 · 配備頂級軟體音源 · 適合編曲/Beat 製作</p>
          <p class="text-res-400 text-sm font-semibold mt-3">$1,200/hr</p>
        </div>
      </div>
    </div>
    <!-- Equipment -->
    <div class="mt-12 reveal">
      <h3 class="text-lg font-bold text-center mb-6">頂級器材</h3>
      <div class="flex flex-wrap justify-center gap-3">
        <span class="px-4 py-2 bg-dark-100 border border-white/5 rounded-lg text-sm text-white/50">Neumann U87</span>
        <span class="px-4 py-2 bg-dark-100 border border-white/5 rounded-lg text-sm text-white/50">SSL 4000G+</span>
        <span class="px-4 py-2 bg-dark-100 border border-white/5 rounded-lg text-sm text-white/50">AMS Neve 1073</span>
        <span class="px-4 py-2 bg-dark-100 border border-white/5 rounded-lg text-sm text-white/50">Universal Audio</span>
        <span class="px-4 py-2 bg-dark-100 border border-white/5 rounded-lg text-sm text-white/50">Genelec 8351</span>
        <span class="px-4 py-2 bg-dark-100 border border-white/5 rounded-lg text-sm text-white/50">Pro Tools HDX</span>
        <span class="px-4 py-2 bg-dark-100 border border-white/5 rounded-lg text-sm text-white/50">Ableton Live</span>
        <span class="px-4 py-2 bg-dark-100 border border-white/5 rounded-lg text-sm text-white/50">Yamaha C7 Grand</span>
      </div>
    </div>
  </div>
</section>

<!-- Works -->
<section id="works" class="py-24 border-t border-white/5 wave-bg">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-res-400 text-xs tracking-[0.3em] uppercase font-medium">Portfolio</span>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight mt-2">精選作品</h2>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl p-5 hover:border-res-500/20 transition-colors cursor-pointer group">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 rounded-lg bg-res-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎵</div>
          <div><h4 class="font-bold text-sm">夜行動物</h4><p class="text-white/40 text-xs">9m88 · 專輯製作</p></div>
        </div>
        <div class="flex items-center gap-3 text-xs text-white/30">
          <span>🏆 金曲獎入圍</span><span>·</span><span>Spotify 500 萬+</span>
        </div>
      </div>
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl p-5 hover:border-res-500/20 transition-colors cursor-pointer group">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 rounded-lg bg-sonic-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎶</div>
          <div><h4 class="font-bold text-sm">Soft Storm</h4><p class="text-white/40 text-xs">落日飛車 · 混音</p></div>
        </div>
        <div class="flex items-center gap-3 text-xs text-white/30">
          <span>🌍 海外巡迴</span><span>·</span><span>YouTube 1000 萬+</span>
        </div>
      </div>
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl p-5 hover:border-res-500/20 transition-colors cursor-pointer group">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎤</div>
          <div><h4 class="font-bold text-sm">浪子回頭</h4><p class="text-white/40 text-xs">茄子蛋 · 錄音</p></div>
        </div>
        <div class="flex items-center gap-3 text-xs text-white/30">
          <span>🏆 金曲獎最佳台語專輯</span>
        </div>
      </div>
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl p-5 hover:border-res-500/20 transition-colors cursor-pointer group">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎙️</div>
          <div><h4 class="font-bold text-sm">百靈果 Podcast</h4><p class="text-white/40 text-xs">錄音 + 後製</p></div>
        </div>
        <div class="flex items-center gap-3 text-xs text-white/30">
          <span>🎧 Apple Podcast Top 10</span>
        </div>
      </div>
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl p-5 hover:border-res-500/20 transition-colors cursor-pointer group">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎸</div>
          <div><h4 class="font-bold text-sm">遙遠的你</h4><p class="text-white/40 text-xs">告五人 · 母帶後期</p></div>
        </div>
        <div class="flex items-center gap-3 text-xs text-white/30">
          <span>🎵 KKBOX 年度排行</span>
        </div>
      </div>
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl p-5 hover:border-res-500/20 transition-colors cursor-pointer group">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎹</div>
          <div><h4 class="font-bold text-sm">Brand Film Score</h4><p class="text-white/40 text-xs">Apple Taiwan · 配樂</p></div>
        </div>
        <div class="flex items-center gap-3 text-xs text-white/30">
          <span>📺 全球播出</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Pricing -->
<section id="pricing" class="py-24 border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14 reveal">
      <span class="text-res-400 text-xs tracking-[0.3em] uppercase font-medium">Pricing</span>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight mt-2">透明報價</h2>
      <p class="text-white/40 mt-3">依需求彈性選擇，含工程師服務費</p>
    </div>
    <div class="grid md:grid-cols-3 gap-5">
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl p-7 hover:border-res-500/20 transition-colors">
        <h3 class="font-bold text-lg">基礎錄音</h3>
        <p class="text-white/40 text-sm mt-1 mb-5">歌曲錄音 + 基本修音</p>
        <div class="mb-6"><span class="text-3xl font-bold text-res-400">$3,000</span><span class="text-white/40">/hr</span></div>
        <div class="space-y-2 text-sm text-white/50 mb-6">
          <div class="flex items-center gap-2"><span class="text-res-400">✓</span>Studio A 或 B</div>
          <div class="flex items-center gap-2"><span class="text-res-400">✓</span>錄音工程師</div>
          <div class="flex items-center gap-2"><span class="text-res-400">✓</span>基本修音 / Editing</div>
          <div class="flex items-center gap-2"><span class="text-res-400">✓</span>WAV 交付</div>
        </div>
        <button onclick="showToast('已收到詢價！我們會盡快回覆')" class="w-full border border-res-500/50 text-res-400 py-2.5 rounded-lg font-semibold text-sm hover:bg-res-500/10 transition-colors">預約詢價</button>
      </div>
      <div class="reveal bg-dark-100 border-2 border-res-500 rounded-xl p-7 relative shadow-lg shadow-res-500/10">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-res-500 text-white px-3 py-0.5 rounded-full text-xs font-bold">最受歡迎</div>
        <h3 class="font-bold text-lg">完整製作</h3>
        <p class="text-white/40 text-sm mt-1 mb-5">錄音 + 混音 + 母帶</p>
        <div class="mb-6"><span class="text-3xl font-bold text-res-400">$35,000</span><span class="text-white/40">/首</span></div>
        <div class="space-y-2 text-sm text-white/50 mb-6">
          <div class="flex items-center gap-2"><span class="text-res-400">✓</span>8 小時錄音</div>
          <div class="flex items-center gap-2"><span class="text-res-400">✓</span>專業混音</div>
          <div class="flex items-center gap-2"><span class="text-res-400">✓</span>母帶後期 Mastering</div>
          <div class="flex items-center gap-2"><span class="text-res-400">✓</span>2 次免費修改</div>
        </div>
        <button onclick="showToast('已收到詢價！我們會盡快回覆')" class="w-full bg-res-500 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-res-600 transition-colors">預約詢價</button>
      </div>
      <div class="reveal bg-dark-100 border border-white/5 rounded-xl p-7 hover:border-res-500/20 transition-colors">
        <h3 class="font-bold text-lg">專輯製作</h3>
        <p class="text-white/40 text-sm mt-1 mb-5">全專輯 A&R + 製作</p>
        <div class="mb-6"><span class="text-3xl font-bold text-res-400">客製</span></div>
        <div class="space-y-2 text-sm text-white/50 mb-6">
          <div class="flex items-center gap-2"><span class="text-res-400">✓</span>全專輯監製</div>
          <div class="flex items-center gap-2"><span class="text-res-400">✓</span>詞曲創作 / 編曲</div>
          <div class="flex items-center gap-2"><span class="text-res-400">✓</span>錄音 + 混音 + 母帶</div>
          <div class="flex items-center gap-2"><span class="text-res-400">✓</span>發行平台上架</div>
        </div>
        <button onclick="showToast('已收到詢價！我們會盡快回覆')" class="w-full border border-res-500/50 text-res-400 py-2.5 rounded-lg font-semibold text-sm hover:bg-res-500/10 transition-colors">洽談合作</button>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact" class="py-24 border-t border-white/5">
  <div class="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16">
    <div class="reveal">
      <span class="text-res-400 text-xs tracking-[0.3em] uppercase font-medium">Contact</span>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight mt-2 mb-6">讓我們聊聊</h2>
      <p class="text-white/40 leading-relaxed mb-8">無論你是獨立音樂人、Podcast 主持人、還是品牌方，歡迎來 RESONANCE 聊聊你的音樂計畫。</p>
      <div class="space-y-4">
        <div class="flex items-center gap-3"><span class="w-8 h-8 rounded-lg bg-dark-100 border border-white/5 flex items-center justify-center text-sm">📍</span><span class="text-white/60 text-sm">台北市大安區敦化南路二段 99 號 B1</span></div>
        <div class="flex items-center gap-3"><span class="w-8 h-8 rounded-lg bg-dark-100 border border-white/5 flex items-center justify-center text-sm">📞</span><span class="text-white/60 text-sm">(02) 2700-5566</span></div>
        <div class="flex items-center gap-3"><span class="w-8 h-8 rounded-lg bg-dark-100 border border-white/5 flex items-center justify-center text-sm">📧</span><span class="text-white/60 text-sm">hello@resonance.studio</span></div>
        <div class="flex items-center gap-3"><span class="w-8 h-8 rounded-lg bg-dark-100 border border-white/5 flex items-center justify-center text-sm">⏰</span><span class="text-white/60 text-sm">週一至週六 10:00 - 02:00（預約制）</span></div>
      </div>
    </div>
    <div class="reveal">
      <div class="bg-dark-100 border border-white/5 rounded-xl p-7">
        <h3 class="font-bold text-lg mb-5">預約表單</h3>
        <div class="space-y-4">
          <div><label class="text-xs text-white/40 mb-1 block">姓名 / 藝名</label><input type="text" placeholder="你的名字" class="w-full bg-dark-200 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-res-500 outline-none"></div>
          <div><label class="text-xs text-white/40 mb-1 block">聯絡方式</label><input type="text" placeholder="Email 或電話" class="w-full bg-dark-200 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-res-500 outline-none"></div>
          <div><label class="text-xs text-white/40 mb-1 block">需求類型</label>
            <select class="w-full bg-dark-200 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-res-500 outline-none">
              <option>歌曲錄音</option><option>混音</option><option>母帶後期</option><option>音樂製作 / 編曲</option><option>Podcast 錄製</option><option>配樂 / 商業音樂</option><option>其他</option>
            </select>
          </div>
          <div><label class="text-xs text-white/40 mb-1 block">描述你的專案</label><textarea rows="3" placeholder="風格、預算、時程..." class="w-full bg-dark-200 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-res-500 outline-none resize-none"></textarea></div>
          <button onclick="showToast('收到！我們會在 24 小時內回覆 🎵')" class="w-full bg-res-500 text-white py-3 rounded-lg font-bold hover:bg-res-600 transition-colors shadow-lg shadow-res-500/25">送出預約</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-white/5 py-10">
  <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
    <div class="flex items-center gap-2">
      <div class="flex items-end gap-0.5 h-4">
        <div class="eq-bar w-1 bg-res-500 rounded-full" style="height:4px"></div>
        <div class="eq-bar w-1 bg-res-400 rounded-full" style="height:8px"></div>
        <div class="eq-bar w-1 bg-res-500 rounded-full" style="height:6px"></div>
      </div>
      <span class="font-bold text-sm">RESONANCE</span>
    </div>
    <p class="text-white/20 text-xs">© 2026 RESONANCE Studio. All rights reserved.</p>
  </div>
</footer>

<!-- Booking Modal -->
<div id="booking-modal" class="hidden fixed inset-0 z-[60] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="this.parentElement.classList.add('hidden')"></div>
  <div class="relative bg-dark-100 border border-white/10 rounded-xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
    <button onclick="this.closest('#booking-modal').classList.add('hidden')" class="absolute top-4 right-4 text-white/30 hover:text-white text-xl">✕</button>
    <h3 class="text-2xl font-bold mb-2">預約錄音 🎙️</h3>
    <p class="text-white/40 text-sm mb-6">選擇錄音室和時段</p>
    <div class="space-y-4">
      <div><label class="text-xs text-white/40 mb-1 block">錄音室</label>
        <select class="w-full bg-dark-200 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-res-500 outline-none">
          <option>Studio A — 主錄音室 ($3,000/hr)</option><option>Studio B — 混音室 ($2,000/hr)</option><option>Studio C — 製作室 ($1,200/hr)</option>
        </select>
      </div>
      <div><label class="text-xs text-white/40 mb-1 block">日期</label><input type="date" class="w-full bg-dark-200 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-res-500 outline-none"></div>
      <div><label class="text-xs text-white/40 mb-1 block">時段</label>
        <select class="w-full bg-dark-200 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-res-500 outline-none">
          <option>10:00 - 14:00 (4hr)</option><option>14:00 - 18:00 (4hr)</option><option>18:00 - 22:00 (4hr)</option><option>22:00 - 02:00 (4hr)</option><option>全天 10:00 - 22:00 (12hr)</option>
        </select>
      </div>
      <div><label class="text-xs text-white/40 mb-1 block">聯絡人</label><input type="text" placeholder="姓名 + 電話" class="w-full bg-dark-200 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-res-500 outline-none"></div>
      <button onclick="showToast('預約成功！確認信已寄出 📧');this.closest('#booking-modal').classList.add('hidden')" class="w-full bg-res-500 text-white py-3 rounded-lg font-bold hover:bg-res-600 transition-colors">確認預約</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-[70] bg-res-500 text-white px-6 py-3 rounded-lg shadow-2xl text-sm font-semibold translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"></div>

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
