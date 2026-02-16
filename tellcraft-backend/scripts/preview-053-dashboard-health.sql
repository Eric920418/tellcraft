INSERT INTO template_previews (template_id, html_content, version)
VALUES ('103f608b-7c79-4b0c-805e-b0903d25608b', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VitalSync 健康管理</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{health:'#06b6d4',heart:'#ef4444',energy:'#f59e0b',sleep:'#8b5cf6',steps:'#10b981',surface:'#f0fdfa',dark:'#0f172a'},fontFamily:{sans:['Inter','sans-serif']}}}}
</script>
<style>
*{font-family:'Inter',sans-serif}
.sidebar-item.active{background:rgba(6,182,212,0.1);color:#06b6d4;border-right:3px solid #06b6d4}
.ring-progress{transform:rotate(-90deg)}
</style>
</head>
<body class="bg-surface text-dark overflow-x-hidden">

<div class="flex h-screen">
  <!-- Sidebar -->
  <aside class="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
    <div class="p-5 border-b border-gray-50">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-health rounded-lg flex items-center justify-center text-white text-sm font-bold">V</div>
        <span class="font-bold">Vital<span class="text-health">Sync</span></span>
      </div>
    </div>
    <nav class="flex-1 py-4">
      <div class="space-y-1 px-2">
        <button onclick="switchPage('overview')" class="sidebar-item active w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer hover:bg-health/5 transition-colors text-left" data-page="overview">
          <span>📊</span> 健康總覽
        </button>
        <button onclick="switchPage('activity')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-400 hover:bg-health/5 transition-colors text-left" data-page="activity">
          <span>🏃</span> 活動紀錄
        </button>
        <button onclick="switchPage('nutrition')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-400 hover:bg-health/5 transition-colors text-left" data-page="nutrition">
          <span>🍎</span> 營養追蹤
        </button>
        <button onclick="switchPage('sleep')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-400 hover:bg-health/5 transition-colors text-left" data-page="sleep">
          <span>😴</span> 睡眠分析
        </button>
        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-400 hover:bg-health/5 transition-colors text-left">
          <span>💊</span> 用藥提醒
        </button>
        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-gray-400 hover:bg-health/5 transition-colors text-left">
          <span>⚙️</span> 設定
        </button>
      </div>
    </nav>
    <div class="p-4 border-t border-gray-50">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-health/10 rounded-full flex items-center justify-center text-sm">👤</div>
        <div>
          <div class="font-bold text-xs">陳小安</div>
          <div class="text-[10px] text-gray-400">Premium Plan</div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Main -->
  <main class="flex-1 overflow-y-auto">
    <header class="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 id="pageTitle" class="font-bold text-lg">健康總覽</h1>
        <p class="text-gray-400 text-xs">2026 年 2 月 16 日 · 星期一</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="bg-health/10 text-health px-4 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-health/20 transition-colors">📱 同步裝置</button>
        <button class="relative w-9 h-9 bg-surface rounded-lg flex items-center justify-center text-sm hover:bg-gray-200 transition-colors cursor-pointer">🔔</button>
      </div>
    </header>

    <!-- Overview Page -->
    <div id="page-overview" class="p-6">
      <!-- Health Score -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="col-span-1 bg-gradient-to-br from-health to-cyan-600 rounded-xl p-5 text-white">
          <div class="text-xs font-medium opacity-80 mb-1">健康分數</div>
          <div class="text-4xl font-black">87</div>
          <div class="text-xs opacity-60 mt-1">↑ 3 分 vs 上週</div>
          <div class="w-full bg-white/20 rounded-full h-1.5 mt-3"><div class="bg-white rounded-full h-1.5" style="width:87%"></div></div>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-400 text-xs">步數</span>
            <span class="w-7 h-7 bg-steps/10 rounded-lg flex items-center justify-center text-xs">👟</span>
          </div>
          <div class="text-2xl font-bold">8,432</div>
          <div class="text-steps text-xs font-medium mt-1">目標 10,000 · 84%</div>
          <div class="w-full bg-gray-100 rounded-full h-1.5 mt-2"><div class="bg-steps rounded-full h-1.5" style="width:84%"></div></div>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-400 text-xs">心率</span>
            <span class="w-7 h-7 bg-heart/10 rounded-lg flex items-center justify-center text-xs">❤️</span>
          </div>
          <div class="text-2xl font-bold">72 <span class="text-xs font-normal text-gray-400">bpm</span></div>
          <div class="text-heart text-xs font-medium mt-1">靜息心率 正常範圍</div>
          <div class="flex gap-0.5 mt-2">
            <div class="flex-1 h-4 bg-heart/20 rounded-sm"></div>
            <div class="flex-1 h-6 bg-heart/30 rounded-sm"></div>
            <div class="flex-1 h-5 bg-heart/25 rounded-sm"></div>
            <div class="flex-1 h-3 bg-heart/15 rounded-sm"></div>
            <div class="flex-1 h-4 bg-heart/20 rounded-sm"></div>
            <div class="flex-1 h-7 bg-heart/35 rounded-sm"></div>
            <div class="flex-1 h-4 bg-heart/20 rounded-sm"></div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-400 text-xs">睡眠</span>
            <span class="w-7 h-7 bg-sleep/10 rounded-lg flex items-center justify-center text-xs">🌙</span>
          </div>
          <div class="text-2xl font-bold">7h 24m</div>
          <div class="text-sleep text-xs font-medium mt-1">品質分數 82/100</div>
          <div class="flex gap-0.5 mt-2 h-4">
            <div class="w-[15%] bg-sleep/40 rounded-l-sm" title="深睡"></div>
            <div class="w-[35%] bg-sleep/25" title="淺睡"></div>
            <div class="w-[20%] bg-sleep/40" title="深睡"></div>
            <div class="w-[25%] bg-sleep/25" title="淺睡"></div>
            <div class="w-[5%] bg-sleep/10 rounded-r-sm" title="清醒"></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <!-- Weekly Activity Chart -->
        <div class="col-span-2 bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-sm">本週活動量</h3>
            <div class="flex gap-4 text-xs text-gray-400">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-health rounded-sm"></span>步數</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-energy rounded-sm"></span>消耗卡路里</span>
            </div>
          </div>
          <div class="flex items-end gap-4 h-36">
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full flex gap-1 items-end justify-center h-full">
                <div class="w-3 bg-health rounded-t" style="height:70%"></div>
                <div class="w-3 bg-energy rounded-t" style="height:55%"></div>
              </div>
              <span class="text-[10px] text-gray-400">一</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full flex gap-1 items-end justify-center h-full">
                <div class="w-3 bg-health rounded-t" style="height:85%"></div>
                <div class="w-3 bg-energy rounded-t" style="height:72%"></div>
              </div>
              <span class="text-[10px] text-gray-400">二</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full flex gap-1 items-end justify-center h-full">
                <div class="w-3 bg-health rounded-t" style="height:60%"></div>
                <div class="w-3 bg-energy rounded-t" style="height:48%"></div>
              </div>
              <span class="text-[10px] text-gray-400">三</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full flex gap-1 items-end justify-center h-full">
                <div class="w-3 bg-health rounded-t" style="height:92%"></div>
                <div class="w-3 bg-energy rounded-t" style="height:80%"></div>
              </div>
              <span class="text-[10px] text-gray-400">四</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full flex gap-1 items-end justify-center h-full">
                <div class="w-3 bg-health rounded-t" style="height:45%"></div>
                <div class="w-3 bg-energy rounded-t" style="height:35%"></div>
              </div>
              <span class="text-[10px] text-gray-400">五</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full flex gap-1 items-end justify-center h-full">
                <div class="w-3 bg-health rounded-t" style="height:78%"></div>
                <div class="w-3 bg-energy rounded-t" style="height:65%"></div>
              </div>
              <span class="text-[10px] text-gray-400">六</span>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full flex gap-1 items-end justify-center h-full">
                <div class="w-3 bg-health/30 rounded-t" style="height:84%"></div>
                <div class="w-3 bg-energy/30 rounded-t" style="height:0%"></div>
              </div>
              <span class="text-[10px] text-health font-bold">今</span>
            </div>
          </div>
        </div>

        <!-- Goals -->
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <h3 class="font-bold text-sm mb-4">今日目標</h3>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-xs mb-1"><span class="text-gray-500">🏃 步數</span><span class="font-bold">8,432 / 10,000</span></div>
              <div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-steps rounded-full h-2" style="width:84%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-xs mb-1"><span class="text-gray-500">🔥 卡路里</span><span class="font-bold">420 / 500 kcal</span></div>
              <div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-energy rounded-full h-2" style="width:84%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-xs mb-1"><span class="text-gray-500">💧 飲水</span><span class="font-bold">1.6 / 2.0 L</span></div>
              <div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-health rounded-full h-2" style="width:80%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-xs mb-1"><span class="text-gray-500">🧘 正念</span><span class="font-bold">10 / 15 min</span></div>
              <div class="w-full bg-gray-100 rounded-full h-2"><div class="bg-sleep rounded-full h-2" style="width:67%"></div></div>
            </div>
          </div>
          <button onclick="showToast('已記錄一杯水 💧')" class="w-full mt-4 bg-health/10 text-health py-2.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-health/20 transition-colors">+ 記錄飲水</button>
        </div>
      </div>

      <!-- Body Metrics -->
      <div class="mt-6 bg-white rounded-xl p-5 border border-gray-100">
        <h3 class="font-bold text-sm mb-4">身體數據趨勢</h3>
        <div class="grid grid-cols-5 gap-4">
          <div class="text-center p-3 bg-surface rounded-xl">
            <div class="text-lg mb-1">⚖️</div>
            <div class="font-bold">68.5 kg</div>
            <div class="text-[10px] text-steps">↓ 0.3 kg</div>
          </div>
          <div class="text-center p-3 bg-surface rounded-xl">
            <div class="text-lg mb-1">📏</div>
            <div class="font-bold">BMI 22.1</div>
            <div class="text-[10px] text-steps">正常</div>
          </div>
          <div class="text-center p-3 bg-surface rounded-xl">
            <div class="text-lg mb-1">💪</div>
            <div class="font-bold">18.5%</div>
            <div class="text-[10px] text-gray-400">體脂率</div>
          </div>
          <div class="text-center p-3 bg-surface rounded-xl">
            <div class="text-lg mb-1">🩸</div>
            <div class="font-bold">120/78</div>
            <div class="text-[10px] text-steps">血壓正常</div>
          </div>
          <div class="text-center p-3 bg-surface rounded-xl">
            <div class="text-lg mb-1">🫀</div>
            <div class="font-bold">95%</div>
            <div class="text-[10px] text-steps">血氧正常</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Page -->
    <div id="page-activity" class="p-6 hidden">
      <div class="bg-white rounded-xl p-5 border border-gray-100 mb-6">
        <h3 class="font-bold text-sm mb-4">今日活動</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-4 p-3 bg-surface rounded-xl">
            <div class="w-10 h-10 bg-steps/10 rounded-xl flex items-center justify-center text-lg">🏃</div>
            <div class="flex-1">
              <div class="font-bold text-sm">晨跑</div>
              <div class="text-[10px] text-gray-400">06:30 - 07:05 · 4.2 km</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold text-energy">286 kcal</div>
              <div class="text-[10px] text-gray-400">35 分鐘</div>
            </div>
          </div>
          <div class="flex items-center gap-4 p-3 bg-surface rounded-xl">
            <div class="w-10 h-10 bg-health/10 rounded-xl flex items-center justify-center text-lg">🚶</div>
            <div class="flex-1">
              <div class="font-bold text-sm">午間散步</div>
              <div class="text-[10px] text-gray-400">12:15 - 12:45 · 1.8 km</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold text-energy">98 kcal</div>
              <div class="text-[10px] text-gray-400">30 分鐘</div>
            </div>
          </div>
          <div class="flex items-center gap-4 p-3 bg-surface rounded-xl">
            <div class="w-10 h-10 bg-sleep/10 rounded-xl flex items-center justify-center text-lg">🧘</div>
            <div class="flex-1">
              <div class="font-bold text-sm">正念冥想</div>
              <div class="text-[10px] text-gray-400">21:00 - 21:10</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold text-sleep">36 kcal</div>
              <div class="text-[10px] text-gray-400">10 分鐘</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Nutrition Page -->
    <div id="page-nutrition" class="p-6 hidden">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-energy">1,420</div>
          <div class="text-xs text-gray-400">已攝取 kcal</div>
          <div class="text-[10px] text-gray-300 mt-1">目標 1,800</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-heart">68g</div>
          <div class="text-xs text-gray-400">蛋白質</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-energy">185g</div>
          <div class="text-xs text-gray-400">碳水</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-sleep">42g</div>
          <div class="text-xs text-gray-400">脂肪</div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 border border-gray-100">
        <h3 class="font-bold text-sm mb-4">今日飲食紀錄</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-4 p-3 bg-surface rounded-xl">
            <div class="text-2xl">🥣</div>
            <div class="flex-1"><div class="font-bold text-sm">早餐</div><div class="text-[10px] text-gray-400">燕麥粥 + 藍莓 + 黑咖啡</div></div>
            <div class="text-sm font-bold">380 kcal</div>
          </div>
          <div class="flex items-center gap-4 p-3 bg-surface rounded-xl">
            <div class="text-2xl">🥗</div>
            <div class="flex-1"><div class="font-bold text-sm">午餐</div><div class="text-[10px] text-gray-400">雞胸沙拉 + 糙米飯</div></div>
            <div class="text-sm font-bold">520 kcal</div>
          </div>
          <div class="flex items-center gap-4 p-3 bg-surface rounded-xl">
            <div class="text-2xl">🍌</div>
            <div class="flex-1"><div class="font-bold text-sm">點心</div><div class="text-[10px] text-gray-400">香蕉 + 堅果一把</div></div>
            <div class="text-sm font-bold">180 kcal</div>
          </div>
          <div class="flex items-center gap-4 p-3 bg-surface rounded-xl">
            <div class="text-2xl">🍱</div>
            <div class="flex-1"><div class="font-bold text-sm">晚餐</div><div class="text-[10px] text-gray-400">鮭魚定食 + 味噌湯</div></div>
            <div class="text-sm font-bold">340 kcal</div>
          </div>
        </div>
        <button onclick="showToast('食物紀錄功能開發中 📸')" class="w-full mt-4 bg-energy/10 text-energy py-2.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-energy/20 transition-colors">+ 記錄食物</button>
      </div>
    </div>

    <!-- Sleep Page -->
    <div id="page-sleep" class="p-6 hidden">
      <div class="bg-gradient-to-br from-sleep/10 to-indigo-50 rounded-xl p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="text-sm text-gray-500">昨晚睡眠</div>
            <div class="text-3xl font-bold">7h 24m</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-sleep">82</div>
            <div class="text-xs text-gray-400">睡眠品質</div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-4">
          <div class="flex justify-between text-xs text-gray-400 mb-2"><span>23:30</span><span>00:00</span><span>02:00</span><span>04:00</span><span>06:00</span><span>06:54</span></div>
          <div class="flex h-8 rounded-lg overflow-hidden">
            <div class="bg-sleep/20" style="width:5%" title="清醒"></div>
            <div class="bg-sleep/50" style="width:15%" title="淺睡"></div>
            <div class="bg-sleep" style="width:20%" title="深睡"></div>
            <div class="bg-sleep/50" style="width:15%" title="淺睡"></div>
            <div class="bg-indigo-400" style="width:10%" title="REM"></div>
            <div class="bg-sleep" style="width:15%" title="深睡"></div>
            <div class="bg-sleep/50" style="width:15%" title="淺睡"></div>
            <div class="bg-sleep/20" style="width:5%" title="清醒"></div>
          </div>
          <div class="flex gap-4 mt-3 text-[10px] text-gray-400">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 bg-sleep rounded-sm"></span>深睡 2h 36m</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 bg-sleep/50 rounded-sm"></span>淺睡 3h 22m</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 bg-indigo-400 rounded-sm"></span>REM 48m</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 bg-sleep/20 rounded-sm"></span>清醒 38m</span>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-lg mb-1">🌙</div>
          <div class="font-bold">23:30</div>
          <div class="text-xs text-gray-400">入睡時間</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-lg mb-1">☀️</div>
          <div class="font-bold">06:54</div>
          <div class="text-xs text-gray-400">起床時間</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-lg mb-1">⏱️</div>
          <div class="font-bold">12 min</div>
          <div class="text-xs text-gray-400">入睡花費</div>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 bg-dark text-white px-6 py-3.5 rounded-xl shadow-2xl z-50 translate-y-20 opacity-0 transition-all duration-500 text-sm font-medium"></div>

<script>
function switchPage(page){
  document.querySelectorAll('[id^="page-"]').forEach(p=>p.classList.add('hidden'));
  document.getElementById('page-'+page).classList.remove('hidden');
  document.querySelectorAll('.sidebar-item').forEach(i=>{i.classList.remove('active');if(i.dataset.page===page)i.classList.add('active')});
  const titles={overview:'健康總覽',activity:'活動紀錄',nutrition:'營養追蹤',sleep:'睡眠分析'};
  document.getElementById('pageTitle').textContent=titles[page]||page;
}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('translate-y-20','opacity-0');setTimeout(()=>t.classList.add('translate-y-20','opacity-0'),3000)}
</script>
</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
