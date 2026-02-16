INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '033a0401-06d9-4ba7-b0d6-e69357985c9e',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>啟程學院 Launchpad Academy</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: { 50:'#f0f4ff', 100:'#dce4ff', 200:'#bfccff', 400:'#6b8aff', 500:'#4f6df5', 600:'#3b52d4', DEFAULT:'#4f6df5' },
        orange: { 400:'#fb923c', 500:'#f97316' },
        mint: { 400:'#34d399', 500:'#10b981' },
        grape: { 400:'#a78bfa', 500:'#8b5cf6' },
        navy: { 800:'#1e293b', 900:'#0f172a' }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans TC"', 'sans-serif'],
        tc: ['"Noto Sans TC"', 'sans-serif']
      }
    }
  }
}
</script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Plus Jakarta Sans', 'Noto Sans TC', sans-serif; color: #1e293b; background: #fff; }

  .reveal { opacity:0; transform:translateY(24px); transition: all 0.7s cubic-bezier(0.22,1,0.36,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }

  .toast {
    position:fixed; bottom:2rem; right:2rem; background:#4f6df5; color:#fff;
    padding:0.875rem 1.5rem; border-radius:12px; font-size:0.9rem; font-weight:500;
    z-index:9999; transform:translateY(120%); opacity:0;
    transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
    box-shadow: 0 8px 32px rgba(79,109,245,0.3);
  }
  .toast.show { transform:translateY(0); opacity:1; }

  .course-card {
    transition: all 0.3s ease;
  }
  .course-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.08);
  }

  .category-btn.active {
    background: #4f6df5;
    color: #fff;
    border-color: #4f6df5;
  }

  .nav-scrolled {
    background: rgba(255,255,255,0.97) !important;
    box-shadow: 0 2px 20px rgba(0,0,0,0.06);
  }

  .blob-1 { animation: blobFloat 8s ease-in-out infinite; }
  .blob-2 { animation: blobFloat 10s ease-in-out infinite reverse; }
  @keyframes blobFloat {
    0%,100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(20px,-15px) scale(1.05); }
    66% { transform: translate(-10px,10px) scale(0.95); }
  }

  .pricing-card.featured {
    border: 2px solid #4f6df5;
    box-shadow: 0 12px 48px rgba(79,109,245,0.15);
  }
</style>
</head>
<body>

<!-- Toast -->
<div id="toast" class="toast"></div>

<!-- Navigation -->
<nav id="navbar" class="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md transition-all duration-300">
  <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2.5">
      <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white font-extrabold text-lg">L</div>
      <div>
        <span class="font-bold text-navy-900 text-lg">啟程學院</span>
        <span class="text-[10px] text-gray-400 block -mt-0.5 tracking-wider">LAUNCHPAD ACADEMY</span>
      </div>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#courses" class="text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors">熱門課程</a>
      <a href="#instructors" class="text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors">明星師資</a>
      <a href="#pricing" class="text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors">方案價格</a>
      <a href="#testimonials" class="text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors">學員好評</a>
      <button onclick="showToast('前往報名頁面')" class="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer">
        免費試聽
      </button>
    </div>
    <button onclick="toggleMobile()" class="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 cursor-pointer">
      <svg class="w-6 h-6 text-navy-800" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div id="mobileMenu" class="hidden md:hidden bg-white border-t border-gray-100 px-6 pb-6">
    <div class="flex flex-col gap-1 pt-4">
      <a href="#courses" onclick="closeMobile()" class="py-3 text-gray-600 font-medium">熱門課程</a>
      <a href="#instructors" onclick="closeMobile()" class="py-3 text-gray-600 font-medium">明星師資</a>
      <a href="#pricing" onclick="closeMobile()" class="py-3 text-gray-600 font-medium">方案價格</a>
      <a href="#testimonials" onclick="closeMobile()" class="py-3 text-gray-600 font-medium">學員好評</a>
      <button onclick="showToast('前往報名頁面');closeMobile()" class="mt-2 bg-primary-500 text-white py-3 rounded-xl font-semibold cursor-pointer">免費試聽</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="relative pt-20 overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-orange-50/30"></div>
  <div class="absolute top-40 -right-20 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl blob-1"></div>
  <div class="absolute bottom-0 -left-20 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl blob-2"></div>

  <div class="relative max-w-7xl mx-auto px-6 pt-20 pb-24">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div>
        <div class="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 mb-6">
          <span class="text-orange-500 text-sm">🔥</span>
          <span class="text-sm font-medium text-orange-600">2026 春季班熱烈招生中</span>
        </div>
        <h1 class="text-4xl lg:text-5xl xl:text-6xl font-black text-navy-900 leading-tight mb-6 font-tc">
          學習新技能<br>
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 via-grape-400 to-orange-500">打造未來競爭力</span>
        </h1>
        <p class="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
          從程式設計到商業思維，超過 200+ 門實戰課程。業界頂尖講師授課，完課率高達 92%，讓學習真正產生改變。
        </p>
        <div class="flex flex-wrap gap-4">
          <button onclick="showToast('開始免費試聽體驗！')" class="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-primary-500/25 cursor-pointer">
            免費試聽 →
          </button>
          <button onclick="document.getElementById('courses').scrollIntoView({behavior:'smooth'})" class="flex items-center gap-3 border-2 border-gray-200 hover:border-primary-300 px-8 py-4 rounded-2xl font-semibold text-navy-800 transition-all cursor-pointer">
            <svg class="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            瀏覽課程
          </button>
        </div>
        <!-- Stats -->
        <div class="flex gap-8 mt-12 pt-8 border-t border-gray-100">
          <div class="text-center">
            <div class="text-2xl font-extrabold text-navy-900">200+</div>
            <div class="text-xs text-gray-400 mt-0.5">線上課程</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-extrabold text-navy-900">50K+</div>
            <div class="text-xs text-gray-400 mt-0.5">學員人數</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-extrabold text-navy-900">92%</div>
            <div class="text-xs text-gray-400 mt-0.5">完課率</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-extrabold text-navy-900">4.9</div>
            <div class="text-xs text-gray-400 mt-0.5">平均評分</div>
          </div>
        </div>
      </div>

      <!-- Hero Visual -->
      <div class="relative hidden lg:block">
        <div class="bg-gradient-to-br from-primary-100 via-grape-100/50 to-orange-100 rounded-3xl p-8 relative">
          <!-- Course Cards Stack -->
          <div class="space-y-4">
            <div class="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div class="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center text-3xl shrink-0">💻</div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-navy-900 text-sm">Python 全端開發實戰</div>
                <div class="text-xs text-gray-400 mt-1">陳柏翰 · 32 小時 · 4.9 ★</div>
                <div class="flex items-center gap-2 mt-2">
                  <div class="h-1.5 bg-primary-100 rounded-full flex-1"><div class="h-full bg-primary-500 rounded-full" style="width:78%"></div></div>
                  <span class="text-[10px] text-primary-500 font-bold">78%</span>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div class="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center text-3xl shrink-0">📊</div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-navy-900 text-sm">數據分析與視覺化</div>
                <div class="text-xs text-gray-400 mt-1">林品妤 · 24 小時 · 4.8 ★</div>
                <div class="flex items-center gap-2 mt-2">
                  <div class="h-1.5 bg-orange-100 rounded-full flex-1"><div class="h-full bg-orange-500 rounded-full" style="width:45%"></div></div>
                  <span class="text-[10px] text-orange-500 font-bold">45%</span>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div class="w-16 h-16 bg-mint-400/20 rounded-xl flex items-center justify-center text-3xl shrink-0">🎨</div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-navy-900 text-sm">UI/UX 設計思考</div>
                <div class="text-xs text-gray-400 mt-1">蔡宜軒 · 28 小時 · 4.9 ★</div>
                <div class="flex items-center gap-2 mt-2">
                  <div class="h-1.5 bg-emerald-100 rounded-full flex-1"><div class="h-full bg-emerald-500 rounded-full" style="width:100%"></div></div>
                  <span class="text-[10px] text-emerald-500 font-bold">完成 ✓</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Floating badge -->
          <div class="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg shadow-black/5 p-3 flex items-center gap-2">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-xs font-bold text-navy-800">獲得結業證書！</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Courses Section -->
<section id="courses" class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-12 reveal">
      <span class="text-primary-500 font-semibold text-sm tracking-wider uppercase">Popular Courses</span>
      <h2 class="text-3xl lg:text-4xl font-bold text-navy-900 mt-3 font-tc">熱門課程推薦</h2>
      <p class="text-gray-400 mt-4 max-w-2xl mx-auto">精選最受歡迎的實戰課程，由業界講師親自授課，學完即可上手。</p>
    </div>
    <!-- Category Filter -->
    <div class="flex flex-wrap gap-2 justify-center mb-10 reveal">
      <button class="category-btn active px-5 py-2 rounded-full text-sm font-medium border border-gray-200 transition-all cursor-pointer" onclick="filterCourses('all', this)">全部</button>
      <button class="category-btn px-5 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-500 hover:border-primary-300 transition-all cursor-pointer" onclick="filterCourses('dev', this)">程式開發</button>
      <button class="category-btn px-5 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-500 hover:border-primary-300 transition-all cursor-pointer" onclick="filterCourses('design', this)">設計創意</button>
      <button class="category-btn px-5 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-500 hover:border-primary-300 transition-all cursor-pointer" onclick="filterCourses('biz', this)">商業行銷</button>
      <button class="category-btn px-5 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-500 hover:border-primary-300 transition-all cursor-pointer" onclick="filterCourses('data', this)">數據科學</button>
    </div>
    <!-- Course Grid -->
    <div id="courseGrid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 reveal">
      <!-- Course 1 -->
      <div class="course-card bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer" data-cat="dev" onclick="showToast('查看課程：React 前端開發實戰班')">
        <div class="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
          <span class="text-5xl">⚛️</span>
          <div class="absolute top-4 left-4 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">熱門</div>
          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur text-navy-800 text-xs font-bold px-3 py-1 rounded-full">NT$3,600</div>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">程式開發</span>
            <span class="text-xs text-gray-400">36 小時</span>
          </div>
          <h3 class="font-bold text-navy-900 text-lg mb-2">React 前端開發實戰班</h3>
          <p class="text-gray-400 text-sm mb-4">從零開始學 React 18，hooks、state 管理、API 串接到部署，打造完整作品集。</p>
          <div class="flex items-center justify-between pt-4 border-t border-gray-50">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 bg-primary-200 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-700">陳</div>
              <span class="text-xs text-gray-500">陳柏翰</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-yellow-500 text-xs">★</span>
              <span class="text-xs font-semibold text-navy-800">4.9</span>
              <span class="text-xs text-gray-400">(328)</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Course 2 -->
      <div class="course-card bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer" data-cat="design" onclick="showToast('查看課程：Figma UI 設計完全攻略')">
        <div class="relative h-48 bg-gradient-to-br from-grape-100 to-grape-200/60 flex items-center justify-center">
          <span class="text-5xl">🎨</span>
          <div class="absolute top-4 left-4 bg-grape-500 text-white text-xs font-bold px-3 py-1 rounded-full">新上架</div>
          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur text-navy-800 text-xs font-bold px-3 py-1 rounded-full">NT$2,800</div>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs bg-grape-50 text-grape-500 px-2 py-0.5 rounded-full font-medium">設計創意</span>
            <span class="text-xs text-gray-400">28 小時</span>
          </div>
          <h3 class="font-bold text-navy-900 text-lg mb-2">Figma UI 設計完全攻略</h3>
          <p class="text-gray-400 text-sm mb-4">從線框稿到高保真原型，學會元件化設計、Auto Layout 和 Design System。</p>
          <div class="flex items-center justify-between pt-4 border-t border-gray-50">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 bg-grape-200 rounded-full flex items-center justify-center text-[10px] font-bold text-grape-700">蔡</div>
              <span class="text-xs text-gray-500">蔡宜軒</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-yellow-500 text-xs">★</span>
              <span class="text-xs font-semibold text-navy-800">4.9</span>
              <span class="text-xs text-gray-400">(256)</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Course 3 -->
      <div class="course-card bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer" data-cat="biz" onclick="showToast('查看課程：數位行銷全攻略')">
        <div class="relative h-48 bg-gradient-to-br from-orange-100 to-orange-200/60 flex items-center justify-center">
          <span class="text-5xl">📣</span>
          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur text-navy-800 text-xs font-bold px-3 py-1 rounded-full">NT$2,400</div>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">商業行銷</span>
            <span class="text-xs text-gray-400">20 小時</span>
          </div>
          <h3 class="font-bold text-navy-900 text-lg mb-2">數位行銷全攻略</h3>
          <p class="text-gray-400 text-sm mb-4">SEO、Google Ads、社群經營、內容行銷到數據追蹤，全方位數位行銷實務。</p>
          <div class="flex items-center justify-between pt-4 border-t border-gray-50">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 bg-orange-200 rounded-full flex items-center justify-center text-[10px] font-bold text-orange-700">黃</div>
              <span class="text-xs text-gray-500">黃思涵</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-yellow-500 text-xs">★</span>
              <span class="text-xs font-semibold text-navy-800">4.8</span>
              <span class="text-xs text-gray-400">(412)</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Course 4 -->
      <div class="course-card bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer" data-cat="data" onclick="showToast('查看課程：Python 數據分析與機器學習')">
        <div class="relative h-48 bg-gradient-to-br from-mint-400/20 to-emerald-100 flex items-center justify-center">
          <span class="text-5xl">🤖</span>
          <div class="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">暢銷</div>
          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur text-navy-800 text-xs font-bold px-3 py-1 rounded-full">NT$4,200</div>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">數據科學</span>
            <span class="text-xs text-gray-400">40 小時</span>
          </div>
          <h3 class="font-bold text-navy-900 text-lg mb-2">Python 數據分析與機器學習</h3>
          <p class="text-gray-400 text-sm mb-4">Pandas、NumPy、Scikit-learn 實戰，從資料清洗到模型部署完整流程。</p>
          <div class="flex items-center justify-between pt-4 border-t border-gray-50">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 bg-emerald-200 rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-700">林</div>
              <span class="text-xs text-gray-500">林品妤</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-yellow-500 text-xs">★</span>
              <span class="text-xs font-semibold text-navy-800">4.8</span>
              <span class="text-xs text-gray-400">(285)</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Course 5 -->
      <div class="course-card bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer" data-cat="dev" onclick="showToast('查看課程：Node.js 後端開發')">
        <div class="relative h-48 bg-gradient-to-br from-lime-100 to-emerald-100 flex items-center justify-center">
          <span class="text-5xl">🔧</span>
          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur text-navy-800 text-xs font-bold px-3 py-1 rounded-full">NT$3,200</div>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">程式開發</span>
            <span class="text-xs text-gray-400">30 小時</span>
          </div>
          <h3 class="font-bold text-navy-900 text-lg mb-2">Node.js 後端開發實務</h3>
          <p class="text-gray-400 text-sm mb-4">Express、MongoDB、REST API 設計到 Docker 部署，打造完整後端服務。</p>
          <div class="flex items-center justify-between pt-4 border-t border-gray-50">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 bg-lime-200 rounded-full flex items-center justify-center text-[10px] font-bold text-lime-700">王</div>
              <span class="text-xs text-gray-500">王志明</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-yellow-500 text-xs">★</span>
              <span class="text-xs font-semibold text-navy-800">4.7</span>
              <span class="text-xs text-gray-400">(198)</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Course 6 -->
      <div class="course-card bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer" data-cat="biz" onclick="showToast('查看課程：商業簡報力')">
        <div class="relative h-48 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
          <span class="text-5xl">📈</span>
          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur text-navy-800 text-xs font-bold px-3 py-1 rounded-full">NT$1,800</div>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">商業行銷</span>
            <span class="text-xs text-gray-400">12 小時</span>
          </div>
          <h3 class="font-bold text-navy-900 text-lg mb-2">商業簡報力：從架構到表達</h3>
          <p class="text-gray-400 text-sm mb-4">學會用故事力打動人心，資訊視覺化、版面設計、上台表達全方位訓練。</p>
          <div class="flex items-center justify-between pt-4 border-t border-gray-50">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 bg-rose-200 rounded-full flex items-center justify-center text-[10px] font-bold text-rose-700">張</div>
              <span class="text-xs text-gray-500">張雅琪</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-yellow-500 text-xs">★</span>
              <span class="text-xs font-semibold text-navy-800">4.9</span>
              <span class="text-xs text-gray-400">(156)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Instructors -->
<section id="instructors" class="py-24 bg-gray-50/50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-primary-500 font-semibold text-sm tracking-wider uppercase">Instructors</span>
      <h2 class="text-3xl lg:text-4xl font-bold text-navy-900 mt-3 font-tc">明星講師陣容</h2>
      <p class="text-gray-400 mt-4 max-w-2xl mx-auto">每一位講師都是業界實戰專家，用真實案例帶你從入門到精通。</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 reveal">
      <div class="bg-white rounded-2xl p-6 text-center cursor-pointer hover:shadow-lg transition-shadow" onclick="showToast('查看陳柏翰講師介紹')">
        <div class="w-20 h-20 bg-gradient-to-br from-primary-200 to-primary-100 rounded-full mx-auto flex items-center justify-center text-4xl mb-4">👨‍💻</div>
        <h3 class="font-bold text-navy-900">陳柏翰</h3>
        <p class="text-primary-500 text-sm font-medium mt-1">全端工程師</p>
        <p class="text-gray-400 text-xs mt-3">前 Google 工程師，10 年開發經驗。專精 React、Node.js。</p>
        <div class="flex justify-center gap-4 mt-4 text-xs text-gray-400">
          <span>⭐ 4.9</span>
          <span>👤 12,000+</span>
          <span>📚 5 門課</span>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-6 text-center cursor-pointer hover:shadow-lg transition-shadow" onclick="showToast('查看蔡宜軒講師介紹')">
        <div class="w-20 h-20 bg-gradient-to-br from-grape-200 to-grape-100 rounded-full mx-auto flex items-center justify-center text-4xl mb-4">👩‍🎨</div>
        <h3 class="font-bold text-navy-900">蔡宜軒</h3>
        <p class="text-grape-500 text-sm font-medium mt-1">UI/UX 設計師</p>
        <p class="text-gray-400 text-xs mt-3">Apple WWDC Scholar，曾任 LINE 設計主管。Figma 認證講師。</p>
        <div class="flex justify-center gap-4 mt-4 text-xs text-gray-400">
          <span>⭐ 4.9</span>
          <span>👤 8,500+</span>
          <span>📚 3 門課</span>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-6 text-center cursor-pointer hover:shadow-lg transition-shadow" onclick="showToast('查看林品妤講師介紹')">
        <div class="w-20 h-20 bg-gradient-to-br from-emerald-200 to-emerald-100 rounded-full mx-auto flex items-center justify-center text-4xl mb-4">👩‍🔬</div>
        <h3 class="font-bold text-navy-900">林品妤</h3>
        <p class="text-emerald-500 text-sm font-medium mt-1">資料科學家</p>
        <p class="text-gray-400 text-xs mt-3">台大資工碩士，曾任 Shopee 數據分析師。Kaggle Expert。</p>
        <div class="flex justify-center gap-4 mt-4 text-xs text-gray-400">
          <span>⭐ 4.8</span>
          <span>👤 6,200+</span>
          <span>📚 4 門課</span>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-6 text-center cursor-pointer hover:shadow-lg transition-shadow" onclick="showToast('查看黃思涵講師介紹')">
        <div class="w-20 h-20 bg-gradient-to-br from-orange-200 to-orange-100 rounded-full mx-auto flex items-center justify-center text-4xl mb-4">👩‍💼</div>
        <h3 class="font-bold text-navy-900">黃思涵</h3>
        <p class="text-orange-500 text-sm font-medium mt-1">行銷總監</p>
        <p class="text-gray-400 text-xs mt-3">前奧美行銷策略總監，Google Ads 認證講師。15 年行銷實戰。</p>
        <div class="flex justify-center gap-4 mt-4 text-xs text-gray-400">
          <span>⭐ 4.8</span>
          <span>👤 9,800+</span>
          <span>📚 3 門課</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Pricing -->
<section id="pricing" class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-primary-500 font-semibold text-sm tracking-wider uppercase">Pricing</span>
      <h2 class="text-3xl lg:text-4xl font-bold text-navy-900 mt-3 font-tc">選擇學習方案</h2>
      <p class="text-gray-400 mt-4">彈性方案，找到最適合你的學習節奏。</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto reveal">
      <!-- Free -->
      <div class="pricing-card bg-white border border-gray-200 rounded-2xl p-8 flex flex-col">
        <div class="text-center mb-8">
          <h3 class="text-lg font-bold text-navy-900">免費體驗</h3>
          <p class="text-gray-400 text-sm mt-2">先試再買，零風險</p>
          <div class="mt-6">
            <span class="text-4xl font-extrabold text-navy-900">$0</span>
          </div>
        </div>
        <ul class="space-y-3 mb-8 flex-1">
          <li class="flex items-start gap-3 text-sm text-gray-600"><svg class="w-5 h-5 text-primary-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>3 門免費課程</li>
          <li class="flex items-start gap-3 text-sm text-gray-600"><svg class="w-5 h-5 text-primary-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>社群討論區</li>
          <li class="flex items-start gap-3 text-sm text-gray-600"><svg class="w-5 h-5 text-primary-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>學習進度追蹤</li>
          <li class="flex items-start gap-3 text-sm text-gray-400"><svg class="w-5 h-5 text-gray-300 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>完課證書</li>
          <li class="flex items-start gap-3 text-sm text-gray-400"><svg class="w-5 h-5 text-gray-300 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>講師問答</li>
        </ul>
        <button onclick="showToast('免費帳號註冊成功！')" class="w-full py-3.5 rounded-xl font-semibold border-2 border-gray-200 text-navy-800 hover:border-primary-300 hover:text-primary-600 transition-all cursor-pointer">
          免費開始
        </button>
      </div>
      <!-- Pro (Featured) -->
      <div class="pricing-card featured bg-white rounded-2xl p-8 flex flex-col relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-full">最多人選擇</div>
        <div class="text-center mb-8">
          <h3 class="text-lg font-bold text-navy-900">Pro 學習者</h3>
          <p class="text-gray-400 text-sm mt-2">最佳性價比方案</p>
          <div class="mt-6">
            <span class="text-4xl font-extrabold text-primary-500">$599</span>
            <span class="text-gray-400 text-sm"> /月</span>
          </div>
        </div>
        <ul class="space-y-3 mb-8 flex-1">
          <li class="flex items-start gap-3 text-sm text-gray-600"><svg class="w-5 h-5 text-primary-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg><strong>所有課程</strong>無限觀看</li>
          <li class="flex items-start gap-3 text-sm text-gray-600"><svg class="w-5 h-5 text-primary-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>完課證書下載</li>
          <li class="flex items-start gap-3 text-sm text-gray-600"><svg class="w-5 h-5 text-primary-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>講師線上問答</li>
          <li class="flex items-start gap-3 text-sm text-gray-600"><svg class="w-5 h-5 text-primary-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>專屬學習路徑</li>
          <li class="flex items-start gap-3 text-sm text-gray-400"><svg class="w-5 h-5 text-gray-300 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>1 對 1 輔導</li>
        </ul>
        <button onclick="showToast('Pro 方案訂閱成功！開始你的學習旅程')" class="w-full py-3.5 rounded-xl font-semibold bg-primary-500 hover:bg-primary-600 text-white transition-all cursor-pointer">
          立即訂閱
        </button>
      </div>
      <!-- Enterprise -->
      <div class="pricing-card bg-white border border-gray-200 rounded-2xl p-8 flex flex-col">
        <div class="text-center mb-8">
          <h3 class="text-lg font-bold text-navy-900">企業方案</h3>
          <p class="text-gray-400 text-sm mt-2">團隊培訓最佳選擇</p>
          <div class="mt-6">
            <span class="text-4xl font-extrabold text-navy-900">$399</span>
            <span class="text-gray-400 text-sm"> /人/月</span>
          </div>
        </div>
        <ul class="space-y-3 mb-8 flex-1">
          <li class="flex items-start gap-3 text-sm text-gray-600"><svg class="w-5 h-5 text-primary-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>Pro 方案全部功能</li>
          <li class="flex items-start gap-3 text-sm text-gray-600"><svg class="w-5 h-5 text-primary-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>團隊管理後台</li>
          <li class="flex items-start gap-3 text-sm text-gray-600"><svg class="w-5 h-5 text-primary-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>1 對 1 講師輔導</li>
          <li class="flex items-start gap-3 text-sm text-gray-600"><svg class="w-5 h-5 text-primary-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>客製化課程安排</li>
          <li class="flex items-start gap-3 text-sm text-gray-600"><svg class="w-5 h-5 text-primary-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>專屬客服經理</li>
        </ul>
        <button onclick="showToast('已收到企業方案需求，將有專人與您聯繫')" class="w-full py-3.5 rounded-xl font-semibold border-2 border-gray-200 text-navy-800 hover:border-primary-300 hover:text-primary-600 transition-all cursor-pointer">
          聯絡我們
        </button>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section id="testimonials" class="py-24 bg-gray-50/50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-primary-500 font-semibold text-sm tracking-wider uppercase">Testimonials</span>
      <h2 class="text-3xl lg:text-4xl font-bold text-navy-900 mt-3 font-tc">學員真實好評</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6 reveal">
      <div class="bg-white rounded-2xl p-8 border border-gray-100">
        <div class="flex gap-1 mb-4">
          <span class="text-yellow-500">★★★★★</span>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed mb-6">"從完全不會寫程式到能獨立做出作品，React 課程的教學節奏剛好，每一章節都有實作練習，學完馬上就能用在工作上。"</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-600 text-sm">A</div>
          <div>
            <div class="font-semibold text-navy-900 text-sm">Alex Chen</div>
            <div class="text-xs text-gray-400">前端工程師 · React 實戰班</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-8 border border-gray-100">
        <div class="flex gap-1 mb-4">
          <span class="text-yellow-500">★★★★★</span>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed mb-6">"我是行銷轉職學數據分析，林老師用很生活化的例子解釋統計概念，Python 程式碼也都有手把手教學，半年後成功轉職數據分析師！"</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-600 text-sm">周</div>
          <div>
            <div class="font-semibold text-navy-900 text-sm">周小萱</div>
            <div class="text-xs text-gray-400">數據分析師 · Python 數據班</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-8 border border-gray-100">
        <div class="flex gap-1 mb-4">
          <span class="text-yellow-500">★★★★★</span>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed mb-6">"公司買了企業方案給整個行銷團隊上課，現在大家都會用 GA4 看數據、會投 Google Ads，ROI 提升了 40%，CP 值超高。"</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600 text-sm">李</div>
          <div>
            <div class="font-semibold text-navy-900 text-sm">李經理</div>
            <div class="text-xs text-gray-400">行銷主管 · 企業方案</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="py-24 bg-gradient-to-r from-primary-500 via-grape-400 to-orange-500 relative overflow-hidden">
  <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
  <div class="relative max-w-4xl mx-auto px-6 text-center">
    <h2 class="text-3xl lg:text-5xl font-black text-white mb-6 font-tc reveal">開始你的學習旅程</h2>
    <p class="text-white/80 text-lg mb-10 max-w-2xl mx-auto reveal">超過 50,000 名學員已經在啟程學院找到方向。現在加入，第一個月完全免費！</p>
    <div class="flex flex-wrap gap-4 justify-center reveal">
      <button onclick="showToast('免費帳號註冊成功！歡迎加入啟程學院')" class="bg-white text-primary-600 px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all cursor-pointer">
        免費試聽 — 立即加入
      </button>
      <button onclick="showToast('下載課程目錄 PDF')" class="border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/10 transition-all cursor-pointer">
        下載課程目錄
      </button>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-navy-900 text-white pt-16 pb-8">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
      <div class="md:col-span-2">
        <div class="flex items-center gap-2.5 mb-4">
          <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white font-extrabold text-lg">L</div>
          <div>
            <span class="font-bold text-lg">啟程學院</span>
            <span class="text-[10px] text-white/40 block -mt-0.5 tracking-wider">LAUNCHPAD ACADEMY</span>
          </div>
        </div>
        <p class="text-white/50 text-sm leading-relaxed max-w-md">讓學習成為最好的投資。我們致力於提供最高品質的線上課程，幫助每個人實現職涯突破。</p>
      </div>
      <div>
        <h4 class="font-semibold mb-4">探索</h4>
        <div class="flex flex-col gap-3">
          <a href="#courses" class="text-white/50 hover:text-white text-sm transition-colors">熱門課程</a>
          <a href="#instructors" class="text-white/50 hover:text-white text-sm transition-colors">講師團隊</a>
          <a href="#pricing" class="text-white/50 hover:text-white text-sm transition-colors">方案價格</a>
          <a href="#" class="text-white/50 hover:text-white text-sm transition-colors">企業合作</a>
        </div>
      </div>
      <div>
        <h4 class="font-semibold mb-4">支援</h4>
        <div class="flex flex-col gap-3">
          <a href="#" class="text-white/50 hover:text-white text-sm transition-colors">常見問題</a>
          <a href="#" class="text-white/50 hover:text-white text-sm transition-colors">聯絡客服</a>
          <a href="#" class="text-white/50 hover:text-white text-sm transition-colors">退費政策</a>
          <a href="#" class="text-white/50 hover:text-white text-sm transition-colors">隱私權政策</a>
        </div>
      </div>
    </div>
    <div class="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="text-white/30 text-xs">&copy; 2026 啟程學院 Launchpad Academy. All rights reserved.</p>
      <div class="flex gap-3">
        <a href="#" class="w-9 h-9 bg-white/10 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors cursor-pointer">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <a href="#" class="w-9 h-9 bg-white/10 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors cursor-pointer">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </a>
        <a href="#" class="w-9 h-9 bg-white/10 hover:bg-[#FF0000] rounded-lg flex items-center justify-center transition-colors cursor-pointer">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
        </a>
      </div>
    </div>
  </div>
</footer>

<script>
// Toast
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// Mobile menu
function toggleMobile() {
  document.getElementById('mobileMenu').classList.toggle('hidden');
}
function closeMobile() {
  document.getElementById('mobileMenu').classList.add('hidden');
}

// Nav scroll
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('nav-scrolled', window.scrollY > 20);
});

// Reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Course filter
function filterCourses(cat, btn) {
  // Update buttons
  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Filter cards
  document.querySelectorAll('.course-card').forEach(card => {
    if (cat === 'all' || card.dataset.cat === cat) {
      card.style.display = '';
      card.style.opacity = '0';
      card.style.transform = 'translateY(12px)';
      setTimeout(() => {
        card.style.transition = 'all 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 50);
    } else {
      card.style.display = 'none';
    }
  });
}
</script>

</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
