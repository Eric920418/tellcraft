INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '69a7c629-45cd-43c3-864d-bc5b542fa300',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>康悅診所 Wellspring Clinic</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: { 50:'#eef9f5', 100:'#d5f1e8', 200:'#aee3d2', 400:'#4fc4a0', 500:'#2bab84', 600:'#228a6b', DEFAULT:'#228a6b' },
        accent: { 50:'#eff8ff', 100:'#dbeefe', 400:'#5bb5f5', 500:'#3b9fe8', DEFAULT:'#3b9fe8' },
        navy: { 800:'#1a2e44', 900:'#0f1f30' }
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
  body { font-family: 'Plus Jakarta Sans', 'Noto Sans TC', sans-serif; color: #1a2e44; background: #fff; }

  .reveal { opacity:0; transform:translateY(24px); transition: all 0.7s cubic-bezier(0.22,1,0.36,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }

  .toast {
    position:fixed; bottom:2rem; right:2rem; background:#228a6b; color:#fff;
    padding:0.875rem 1.5rem; border-radius:12px; font-size:0.9rem; font-weight:500;
    z-index:9999; transform:translateY(120%); opacity:0;
    transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
    box-shadow: 0 8px 32px rgba(34,138,107,0.3);
  }
  .toast.show { transform:translateY(0); opacity:1; }

  .service-card {
    transition: all 0.3s ease;
  }
  .service-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(34,138,107,0.12);
  }

  .doctor-card .doctor-overlay {
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .doctor-card:hover .doctor-overlay {
    opacity: 1;
  }

  .faq-answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease, padding 0.3s ease;
  }
  .faq-answer.open {
    max-height: 300px;
  }

  .nav-scrolled {
    background: rgba(255,255,255,0.97) !important;
    box-shadow: 0 2px 20px rgba(0,0,0,0.06);
  }

  .pulse-dot {
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%,100% { transform: scale(1); opacity:1; }
    50% { transform: scale(1.5); opacity:0.5; }
  }

  .booking-time.selected {
    background: #228a6b;
    color: #fff;
    border-color: #228a6b;
  }
</style>
</head>
<body>

<!-- Toast -->
<div id="toast" class="toast"></div>

<!-- Navigation -->
<nav id="navbar" class="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md transition-all duration-300">
  <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
    <a href="#" class="flex items-center gap-3">
      <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
      </div>
      <div>
        <span class="font-bold text-navy-900 text-lg tracking-tight">康悅診所</span>
        <span class="text-xs text-gray-400 block -mt-0.5">Wellspring Clinic</span>
      </div>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#services" class="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">診療服務</a>
      <a href="#doctors" class="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">醫療團隊</a>
      <a href="#testimonials" class="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">患者心聲</a>
      <a href="#faq" class="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">常見問題</a>
      <a href="#booking" class="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">預約掛號</a>
      <button onclick="scrollToBooking()" class="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer">
        立即預約
      </button>
    </div>
    <button onclick="toggleMobile()" class="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 cursor-pointer">
      <svg id="menuIcon" class="w-6 h-6 text-navy-800" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <!-- Mobile Menu -->
  <div id="mobileMenu" class="hidden md:hidden bg-white border-t border-gray-100 px-6 pb-6">
    <div class="flex flex-col gap-1 pt-4">
      <a href="#services" onclick="closeMobile()" class="py-3 text-gray-600 font-medium hover:text-primary-600">診療服務</a>
      <a href="#doctors" onclick="closeMobile()" class="py-3 text-gray-600 font-medium hover:text-primary-600">醫療團隊</a>
      <a href="#testimonials" onclick="closeMobile()" class="py-3 text-gray-600 font-medium hover:text-primary-600">患者心聲</a>
      <a href="#faq" onclick="closeMobile()" class="py-3 text-gray-600 font-medium hover:text-primary-600">常見問題</a>
      <button onclick="scrollToBooking();closeMobile()" class="mt-2 bg-primary-500 text-white py-3 rounded-xl font-semibold cursor-pointer">立即預約</button>
    </div>
  </div>
</nav>

<!-- Hero Section -->
<section class="relative pt-20 overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50"></div>
  <!-- Decorative -->
  <div class="absolute top-32 right-0 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl"></div>
  <div class="absolute bottom-0 left-0 w-80 h-80 bg-accent-100/30 rounded-full blur-3xl"></div>

  <div class="relative max-w-7xl mx-auto px-6 pt-20 pb-24">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <div>
        <div class="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-1.5 mb-6">
          <span class="w-2 h-2 bg-primary-500 rounded-full pulse-dot"></span>
          <span class="text-sm font-medium text-primary-600">線上預約開放中</span>
        </div>
        <h1 class="text-4xl lg:text-5xl xl:text-6xl font-bold text-navy-900 leading-tight mb-6 font-tc">
          用心守護<br>
          <span class="text-primary-500">您的每一刻健康</span>
        </h1>
        <p class="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
          康悅診所結合先進醫療設備與溫暖服務，提供家庭醫學、健康檢查、專科門診一站式醫療照護，讓每一次就診都安心。
        </p>
        <div class="flex flex-wrap gap-4">
          <button onclick="scrollToBooking()" class="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-primary-500/25 cursor-pointer">
            預約掛號
          </button>
          <a href="tel:02-2345-6789" class="flex items-center gap-3 border-2 border-gray-200 hover:border-primary-300 px-8 py-4 rounded-2xl font-semibold text-navy-800 transition-all cursor-pointer">
            <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            02-2345-6789
          </a>
        </div>
        <!-- Stats -->
        <div class="flex gap-10 mt-12 pt-8 border-t border-gray-100">
          <div>
            <div class="text-3xl font-bold text-navy-900 counter" data-target="15">0</div>
            <div class="text-sm text-gray-400 mt-1">年以上經驗</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-navy-900"><span class="counter" data-target="30000">0</span>+</div>
            <div class="text-sm text-gray-400 mt-1">累計服務人次</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-navy-900"><span class="counter" data-target="98">0</span>%</div>
            <div class="text-sm text-gray-400 mt-1">患者滿意度</div>
          </div>
        </div>
      </div>

      <!-- Hero Visual -->
      <div class="relative hidden lg:block">
        <div class="bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl aspect-[4/5] flex items-center justify-center overflow-hidden relative">
          <div class="text-center">
            <div class="text-8xl mb-4">🏥</div>
            <p class="text-primary-600/60 font-medium">診所實景照片</p>
          </div>
          <!-- Floating Cards -->
          <div class="absolute top-6 right-6 bg-white rounded-2xl shadow-lg shadow-black/5 p-4 flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <div class="text-sm font-semibold text-navy-800">預約成功</div>
              <div class="text-xs text-gray-400">明天 14:00 陳醫師</div>
            </div>
          </div>
          <div class="absolute bottom-8 left-6 bg-white rounded-2xl shadow-lg shadow-black/5 p-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-yellow-500">★★★★★</span>
              <span class="text-xs text-gray-400">5.0</span>
            </div>
            <p class="text-xs text-gray-500">"醫師很親切，環境很舒適"</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Services Section -->
<section id="services" class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-primary-500 font-semibold text-sm tracking-wider uppercase">Our Services</span>
      <h2 class="text-3xl lg:text-4xl font-bold text-navy-900 mt-3 font-tc">專業診療服務</h2>
      <p class="text-gray-400 mt-4 max-w-2xl mx-auto">涵蓋家庭醫學、專科門診及健康管理，為您和家人提供全方位的醫療照護。</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 reveal">
      <!-- Service 1 -->
      <div class="service-card bg-white border border-gray-100 rounded-2xl p-8 cursor-pointer" onclick="showToast('查看一般內科詳細資訊')">
        <div class="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
        </div>
        <h3 class="text-lg font-bold text-navy-900 mb-3">一般內科</h3>
        <p class="text-gray-400 text-sm leading-relaxed">感冒、腸胃不適、慢性病管理、高血壓/糖尿病追蹤，家庭醫學全方位照護。</p>
        <div class="flex items-center gap-2 mt-6 text-primary-500 text-sm font-semibold">
          <span>了解更多</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>
      <!-- Service 2 -->
      <div class="service-card bg-white border border-gray-100 rounded-2xl p-8 cursor-pointer" onclick="showToast('查看牙科門診詳細資訊')">
        <div class="w-14 h-14 bg-accent-50 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-accent-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"/></svg>
        </div>
        <h3 class="text-lg font-bold text-navy-900 mb-3">牙科門診</h3>
        <p class="text-gray-400 text-sm leading-relaxed">洗牙、補牙、根管治療、牙周治療、人工植牙、牙齒美白，專業設備完善。</p>
        <div class="flex items-center gap-2 mt-6 text-accent-500 text-sm font-semibold">
          <span>了解更多</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>
      <!-- Service 3 -->
      <div class="service-card bg-white border border-gray-100 rounded-2xl p-8 cursor-pointer" onclick="showToast('查看健康檢查詳細資訊')">
        <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/></svg>
        </div>
        <h3 class="text-lg font-bold text-navy-900 mb-3">健康檢查</h3>
        <p class="text-gray-400 text-sm leading-relaxed">基礎體檢、進階癌篩、心血管檢查，多元套組方案，專人一對一報告解說。</p>
        <div class="flex items-center gap-2 mt-6 text-emerald-500 text-sm font-semibold">
          <span>了解更多</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>
      <!-- Service 4 -->
      <div class="service-card bg-white border border-gray-100 rounded-2xl p-8 cursor-pointer" onclick="showToast('查看皮膚科詳細資訊')">
        <div class="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/></svg>
        </div>
        <h3 class="text-lg font-bold text-navy-900 mb-3">皮膚科</h3>
        <p class="text-gray-400 text-sm leading-relaxed">濕疹、青春痘、過敏性皮膚炎、蕁麻疹治療，醫學美容諮詢與雷射療程。</p>
        <div class="flex items-center gap-2 mt-6 text-rose-400 text-sm font-semibold">
          <span>了解更多</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>
      <!-- Service 5 -->
      <div class="service-card bg-white border border-gray-100 rounded-2xl p-8 cursor-pointer" onclick="showToast('查看小兒科詳細資訊')">
        <div class="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
        </div>
        <h3 class="text-lg font-bold text-navy-900 mb-3">小兒科</h3>
        <p class="text-gray-400 text-sm leading-relaxed">兒童預防接種、生長發育評估、過敏氣喘治療，親切的看診環境讓孩子不害怕。</p>
        <div class="flex items-center gap-2 mt-6 text-amber-500 text-sm font-semibold">
          <span>了解更多</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>
      <!-- Service 6 -->
      <div class="service-card bg-white border border-gray-100 rounded-2xl p-8 cursor-pointer" onclick="showToast('查看復健科詳細資訊')">
        <div class="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-violet-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M11.42 15.17l-5.1-5.1a1.5 1.5 0 010-2.12l5.1-5.1a1.5 1.5 0 012.12 0l5.1 5.1a1.5 1.5 0 010 2.12l-5.1 5.1a1.5 1.5 0 01-2.12 0zM3 21h18"/></svg>
        </div>
        <h3 class="text-lg font-bold text-navy-900 mb-3">復健科</h3>
        <p class="text-gray-400 text-sm leading-relaxed">物理治療、運動傷害復健、脊椎矯正、電療熱敷，專業治療師一對一指導。</p>
        <div class="flex items-center gap-2 mt-6 text-violet-500 text-sm font-semibold">
          <span>了解更多</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Doctors Section -->
<section id="doctors" class="py-24 bg-gray-50/50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-primary-500 font-semibold text-sm tracking-wider uppercase">Our Team</span>
      <h2 class="text-3xl lg:text-4xl font-bold text-navy-900 mt-3 font-tc">專業醫療團隊</h2>
      <p class="text-gray-400 mt-4 max-w-2xl mx-auto">每位醫師皆具備豐富臨床經驗與專科認證，致力提供最佳醫療品質。</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 reveal">
      <!-- Doctor 1 -->
      <div class="doctor-card bg-white rounded-2xl overflow-hidden group cursor-pointer" onclick="showToast('查看陳建宏醫師詳細介紹')">
        <div class="relative aspect-[3/4] bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
          <div class="text-6xl">👨‍⚕️</div>
          <div class="doctor-overlay absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent flex flex-col justify-end p-5">
            <div class="flex gap-3">
              <button class="w-9 h-9 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center hover:bg-white/30 cursor-pointer">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </button>
              <button onclick="event.stopPropagation();scrollToBooking()" class="flex-1 bg-primary-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-primary-600 cursor-pointer">預約掛號</button>
            </div>
          </div>
        </div>
        <div class="p-5">
          <h3 class="font-bold text-navy-900 text-lg">陳建宏 醫師</h3>
          <p class="text-primary-500 text-sm font-medium mt-1">院長 / 家庭醫學科</p>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span class="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">台大醫學系</span>
            <span class="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">家醫專科</span>
          </div>
        </div>
      </div>
      <!-- Doctor 2 -->
      <div class="doctor-card bg-white rounded-2xl overflow-hidden group cursor-pointer" onclick="showToast('查看林雅婷醫師詳細介紹')">
        <div class="relative aspect-[3/4] bg-gradient-to-br from-accent-100 to-accent-50 flex items-center justify-center">
          <div class="text-6xl">👩‍⚕️</div>
          <div class="doctor-overlay absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent flex flex-col justify-end p-5">
            <div class="flex gap-3">
              <button class="w-9 h-9 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center hover:bg-white/30 cursor-pointer">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </button>
              <button onclick="event.stopPropagation();scrollToBooking()" class="flex-1 bg-primary-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-primary-600 cursor-pointer">預約掛號</button>
            </div>
          </div>
        </div>
        <div class="p-5">
          <h3 class="font-bold text-navy-900 text-lg">林雅婷 醫師</h3>
          <p class="text-accent-500 text-sm font-medium mt-1">牙科主任</p>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span class="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">陽明牙醫</span>
            <span class="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">植牙專科</span>
          </div>
        </div>
      </div>
      <!-- Doctor 3 -->
      <div class="doctor-card bg-white rounded-2xl overflow-hidden group cursor-pointer" onclick="showToast('查看張明瑞醫師詳細介紹')">
        <div class="relative aspect-[3/4] bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
          <div class="text-6xl">👨‍⚕️</div>
          <div class="doctor-overlay absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent flex flex-col justify-end p-5">
            <div class="flex gap-3">
              <button class="w-9 h-9 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center hover:bg-white/30 cursor-pointer">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </button>
              <button onclick="event.stopPropagation();scrollToBooking()" class="flex-1 bg-primary-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-primary-600 cursor-pointer">預約掛號</button>
            </div>
          </div>
        </div>
        <div class="p-5">
          <h3 class="font-bold text-navy-900 text-lg">張明瑞 醫師</h3>
          <p class="text-emerald-500 text-sm font-medium mt-1">小兒科</p>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span class="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">成大醫學系</span>
            <span class="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">小兒專科</span>
          </div>
        </div>
      </div>
      <!-- Doctor 4 -->
      <div class="doctor-card bg-white rounded-2xl overflow-hidden group cursor-pointer" onclick="showToast('查看李佩君醫師詳細介紹')">
        <div class="relative aspect-[3/4] bg-gradient-to-br from-rose-100 to-rose-50 flex items-center justify-center">
          <div class="text-6xl">👩‍⚕️</div>
          <div class="doctor-overlay absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent flex flex-col justify-end p-5">
            <div class="flex gap-3">
              <button class="w-9 h-9 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center hover:bg-white/30 cursor-pointer">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </button>
              <button onclick="event.stopPropagation();scrollToBooking()" class="flex-1 bg-primary-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-primary-600 cursor-pointer">預約掛號</button>
            </div>
          </div>
        </div>
        <div class="p-5">
          <h3 class="font-bold text-navy-900 text-lg">李佩君 醫師</h3>
          <p class="text-rose-400 text-sm font-medium mt-1">皮膚科</p>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span class="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">北榮皮膚科</span>
            <span class="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">美容醫學</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section id="testimonials" class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-primary-500 font-semibold text-sm tracking-wider uppercase">Testimonials</span>
      <h2 class="text-3xl lg:text-4xl font-bold text-navy-900 mt-3 font-tc">患者好評推薦</h2>
      <p class="text-gray-400 mt-4">真實的就醫體驗，我們最驕傲的成績單。</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6 reveal">
      <div class="bg-primary-50/50 border border-primary-100 rounded-2xl p-8">
        <div class="flex gap-1 mb-4">
          <span class="text-yellow-500">★</span><span class="text-yellow-500">★</span><span class="text-yellow-500">★</span><span class="text-yellow-500">★</span><span class="text-yellow-500">★</span>
        </div>
        <p class="text-gray-600 leading-relaxed mb-6">"帶小朋友看張醫師的門診，醫師非常有耐心，會用可愛的方式跟孩子溝通，診所環境也很乾淨，完全不像傳統診所那樣令人緊張。"</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">王</div>
          <div>
            <div class="font-semibold text-navy-900 text-sm">王小姐</div>
            <div class="text-xs text-gray-400">小兒科 · Google 評論</div>
          </div>
        </div>
      </div>
      <div class="bg-accent-50/50 border border-accent-100 rounded-2xl p-8">
        <div class="flex gap-1 mb-4">
          <span class="text-yellow-500">★</span><span class="text-yellow-500">★</span><span class="text-yellow-500">★</span><span class="text-yellow-500">★</span><span class="text-yellow-500">★</span>
        </div>
        <p class="text-gray-600 leading-relaxed mb-6">"在林醫師這邊做了植牙手術，從諮詢到術後追蹤都非常仔細。術後恢復比預期快很多，現在吃東西完全沒問題，非常感謝！"</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-accent-200 rounded-full flex items-center justify-center text-accent-700 font-bold text-sm">陳</div>
          <div>
            <div class="font-semibold text-navy-900 text-sm">陳先生</div>
            <div class="text-xs text-gray-400">牙科植牙 · Google 評論</div>
          </div>
        </div>
      </div>
      <div class="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-8">
        <div class="flex gap-1 mb-4">
          <span class="text-yellow-500">★</span><span class="text-yellow-500">★</span><span class="text-yellow-500">★</span><span class="text-yellow-500">★</span><span class="text-yellow-500">★</span>
        </div>
        <p class="text-gray-600 leading-relaxed mb-6">"公司健檢選了康悅的進階方案，報告出來後醫師很詳細地一項一項解說，還幫我規劃了後續追蹤計畫。服務品質真的很好。"</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">劉</div>
          <div>
            <div class="font-semibold text-navy-900 text-sm">劉先生</div>
            <div class="text-xs text-gray-400">健康檢查 · 親友推薦</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section id="faq" class="py-24 bg-gray-50/50">
  <div class="max-w-3xl mx-auto px-6">
    <div class="text-center mb-16 reveal">
      <span class="text-primary-500 font-semibold text-sm tracking-wider uppercase">FAQ</span>
      <h2 class="text-3xl lg:text-4xl font-bold text-navy-900 mt-3 font-tc">常見問題</h2>
    </div>
    <div class="space-y-3 reveal">
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-6 text-left cursor-pointer">
          <span class="font-semibold text-navy-900">初診需要攜帶什麼文件？</span>
          <svg class="w-5 h-5 text-gray-400 faq-icon transition-transform duration-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer px-6 text-gray-500 text-sm leading-relaxed">
          <div class="pb-6">請攜帶健保卡及身分證。若有過往病歷資料或正在服用的藥物清單，也請一併帶來，有助於醫師更準確地評估您的健康狀況。</div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-6 text-left cursor-pointer">
          <span class="font-semibold text-navy-900">可以線上預約嗎？等候時間大約多久？</span>
          <svg class="w-5 h-5 text-gray-400 faq-icon transition-transform duration-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer px-6 text-gray-500 text-sm leading-relaxed">
          <div class="pb-6">可以！透過本網站線上預約，系統會自動安排看診時段。預約患者享有優先看診，平均等候時間約 10-15 分鐘。現場掛號則依序看診。</div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-6 text-left cursor-pointer">
          <span class="font-semibold text-navy-900">健康檢查的費用和項目有哪些？</span>
          <svg class="w-5 h-5 text-gray-400 faq-icon transition-transform duration-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer px-6 text-gray-500 text-sm leading-relaxed">
          <div class="pb-6">我們提供三種方案：基礎方案 NT$3,500（血液常規+尿液+X光）、進階方案 NT$8,800（含腹部超音波+腫瘤標記）、尊榮方案 NT$18,000（含全身 MRI+心臟超音波）。詳情請電話諮詢。</div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-6 text-left cursor-pointer">
          <span class="font-semibold text-navy-900">診所的營業時間是？</span>
          <svg class="w-5 h-5 text-gray-400 faq-icon transition-transform duration-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer px-6 text-gray-500 text-sm leading-relaxed">
          <div class="pb-6">週一至週五 08:30-12:00、14:00-17:30、18:30-21:00。週六 08:30-12:00。週日及國定假日休診。急診狀況請撥打 119 或前往最近的醫院急診室。</div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-6 text-left cursor-pointer">
          <span class="font-semibold text-navy-900">是否有停車場？</span>
          <svg class="w-5 h-5 text-gray-400 faq-icon transition-transform duration-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="faq-answer px-6 text-gray-500 text-sm leading-relaxed">
          <div class="pb-6">診所地下一樓設有專屬停車場（15 個車位），就診患者可免費停車 2 小時。另外診所旁 50 公尺處有公有停車場（嘟嘟房），步行約 1 分鐘。</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Booking Section -->
<section id="booking" class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid lg:grid-cols-2 gap-16">
      <!-- Left: Info -->
      <div class="reveal">
        <span class="text-primary-500 font-semibold text-sm tracking-wider uppercase">Appointment</span>
        <h2 class="text-3xl lg:text-4xl font-bold text-navy-900 mt-3 font-tc">線上預約掛號</h2>
        <p class="text-gray-400 mt-4 leading-relaxed">填寫以下表單即可完成預約，我們會在預約時段前以簡訊通知您。也可來電預約：</p>
        <a href="tel:02-2345-6789" class="inline-flex items-center gap-3 mt-6 text-2xl font-bold text-primary-600 hover:text-primary-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          02-2345-6789
        </a>
        <!-- Info Cards -->
        <div class="grid grid-cols-2 gap-4 mt-10">
          <div class="bg-primary-50 rounded-2xl p-5">
            <svg class="w-6 h-6 text-primary-500 mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
            <div class="font-semibold text-navy-900 text-sm">診所地址</div>
            <div class="text-gray-400 text-xs mt-1">台北市大安區忠孝東路四段 123 號 2 樓</div>
          </div>
          <div class="bg-accent-50 rounded-2xl p-5">
            <svg class="w-6 h-6 text-accent-500 mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div class="font-semibold text-navy-900 text-sm">看診時間</div>
            <div class="text-gray-400 text-xs mt-1">週一至五 08:30-21:00<br>週六 08:30-12:00</div>
          </div>
          <div class="bg-emerald-50 rounded-2xl p-5">
            <svg class="w-6 h-6 text-emerald-500 mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
            <div class="font-semibold text-navy-900 text-sm">健保特約</div>
            <div class="text-gray-400 text-xs mt-1">全民健康保險特約醫療院所</div>
          </div>
          <div class="bg-amber-50 rounded-2xl p-5">
            <svg class="w-6 h-6 text-amber-500 mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h-.375a3 3 0 01-3-3V6.75m19.5 7.5V6.75a3 3 0 00-3-3H6.375m0 0H3.75m2.625 0H17.25m0 0h2.625M17.25 3.75h-2.625"/></svg>
            <div class="font-semibold text-navy-900 text-sm">免費停車</div>
            <div class="text-gray-400 text-xs mt-1">B1 專屬停車場 15 個車位</div>
          </div>
        </div>
      </div>

      <!-- Right: Form -->
      <div class="reveal">
        <form id="bookingForm" class="bg-gray-50 rounded-3xl p-8 lg:p-10" onsubmit="return handleBooking(event)">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-navy-800 mb-2">姓名 *</label>
              <input type="text" id="bName" required placeholder="您的姓名" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium text-navy-800 mb-2">手機 *</label>
              <input type="tel" id="bPhone" required placeholder="0912-345-678" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all">
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-navy-800 mb-2">看診科別 *</label>
            <select id="bDept" required class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all bg-white cursor-pointer">
              <option value="">請選擇科別</option>
              <option value="一般內科">一般內科 — 陳建宏醫師</option>
              <option value="牙科">牙科 — 林雅婷醫師</option>
              <option value="小兒科">小兒科 — 張明瑞醫師</option>
              <option value="皮膚科">皮膚科 — 李佩君醫師</option>
              <option value="復健科">復健科</option>
              <option value="健康檢查">健康檢查</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-navy-800 mb-2">預約日期 *</label>
              <input type="date" id="bDate" required class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all cursor-pointer">
            </div>
            <div>
              <label class="block text-sm font-medium text-navy-800 mb-2">時段 *</label>
              <select id="bTime" required class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all bg-white cursor-pointer">
                <option value="">請選擇</option>
                <option value="上午">上午 08:30-12:00</option>
                <option value="下午">下午 14:00-17:30</option>
                <option value="晚上">晚上 18:30-21:00</option>
              </select>
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-navy-800 mb-2">身份證/居留證號</label>
            <input type="text" id="bId" placeholder="選填，加速報到流程" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all">
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-navy-800 mb-2">症狀描述</label>
            <textarea id="bSymptoms" rows="3" placeholder="簡述您的不適症狀（選填）" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all resize-none"></textarea>
          </div>
          <button type="submit" class="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-2xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-primary-500/25 cursor-pointer">
            確認預約
          </button>
          <p class="text-xs text-gray-400 text-center mt-4">預約成功後，將以簡訊通知您看診時段與注意事項。</p>
        </form>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-navy-900 text-white pt-16 pb-8">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
      <div class="md:col-span-2">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          </div>
          <div>
            <span class="font-bold text-lg">康悅診所</span>
            <span class="text-xs text-white/40 block -mt-0.5">Wellspring Clinic</span>
          </div>
        </div>
        <p class="text-white/50 text-sm leading-relaxed max-w-md">用心守護您的每一刻健康。結合先進醫療設備與溫暖服務，提供家庭醫學、健康檢查、專科門診一站式醫療照護。</p>
        <div class="flex gap-3 mt-6">
          <a href="#" class="w-10 h-10 bg-white/10 hover:bg-primary-500 rounded-xl flex items-center justify-center transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="#" class="w-10 h-10 bg-white/10 hover:bg-primary-500 rounded-xl flex items-center justify-center transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
          </a>
          <a href="#" class="w-10 h-10 bg-white/10 hover:bg-[#06C755] rounded-xl flex items-center justify-center transition-colors cursor-pointer">
            <span class="text-sm font-bold">LINE</span>
          </a>
        </div>
      </div>
      <div>
        <h4 class="font-semibold mb-4">快速連結</h4>
        <div class="flex flex-col gap-3">
          <a href="#services" class="text-white/50 hover:text-white text-sm transition-colors">診療服務</a>
          <a href="#doctors" class="text-white/50 hover:text-white text-sm transition-colors">醫療團隊</a>
          <a href="#booking" class="text-white/50 hover:text-white text-sm transition-colors">預約掛號</a>
          <a href="#faq" class="text-white/50 hover:text-white text-sm transition-colors">常見問題</a>
        </div>
      </div>
      <div>
        <h4 class="font-semibold mb-4">聯絡資訊</h4>
        <div class="flex flex-col gap-3 text-white/50 text-sm">
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
            台北市大安區忠孝東路四段 123 號 2F
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            02-2345-6789
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
            info@wellspring-clinic.tw
          </div>
        </div>
      </div>
    </div>
    <div class="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="text-white/30 text-xs">&copy; 2026 康悅診所 Wellspring Clinic. All rights reserved.</p>
      <div class="flex gap-6 text-white/30 text-xs">
        <a href="#" class="hover:text-white/60 transition-colors cursor-pointer">隱私權政策</a>
        <a href="#" class="hover:text-white/60 transition-colors cursor-pointer">服務條款</a>
        <a href="#" class="hover:text-white/60 transition-colors cursor-pointer">無障礙聲明</a>
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
  const m = document.getElementById('mobileMenu');
  m.classList.toggle('hidden');
}
function closeMobile() {
  document.getElementById('mobileMenu').classList.add('hidden');
}

// Nav scroll
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('nav-scrolled', window.scrollY > 20);
});

// Smooth scroll
function scrollToBooking() {
  document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
}

// Reveal animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Counter animation
function animateCounters() {
  document.querySelectorAll('.counter').forEach(el => {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const start = performance.now();
    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { animateCounters(); counterObserver.unobserve(e.target); }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el.closest('div')));

// FAQ toggle
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const icon = btn.querySelector('.faq-icon');
  const isOpen = answer.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-icon').forEach(i => i.style.transform = '');
  if (!isOpen) {
    answer.classList.add('open');
    icon.style.transform = 'rotate(180deg)';
  }
}

// Booking form
function handleBooking(e) {
  e.preventDefault();
  const name = document.getElementById('bName').value;
  const dept = document.getElementById('bDept').value;
  const date = document.getElementById('bDate').value;
  const time = document.getElementById('bTime').value;
  if (!name || !dept || !date || !time) {
    showToast('請填寫所有必填欄位');
    return false;
  }
  showToast(`預約成功！${name}，${date} ${time} ${dept}門診，請準時報到`);
  e.target.reset();
  return false;
}

// Set min date for booking
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('bDate');
  if (dateInput) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
  }
});
</script>

</body>
</html>
  $HTML$,
  1
)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
