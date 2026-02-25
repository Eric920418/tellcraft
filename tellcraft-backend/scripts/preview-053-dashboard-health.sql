INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '103f608b-7c79-4b0c-805e-b0903d25608b',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VitalPulse - Health Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{cardio:'#EF4444','cardio-light':'#FEE2E2',oxygen:'#3B82F6','oxygen-light':'#DBEAFE',sleep:'#8B5CF6','sleep-light':'#EDE9FE',nutrition:'#10B981','nutrition-light':'#D1FAE5',activity:'#F59E0B','activity-light':'#FEF3C7',surface:'#FFFFFF',base:'#FAFBFC',border:'#F1F3F5',textPrimary:'#1A1D23',textSecondary:'#6B7280',textMuted:'#9CA3AF'},fontFamily:{heading:['Nunito','sans-serif'],body:['DM Sans','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{font-family:'DM Sans',sans-serif;background:#FAFBFC;color:#1A1D23;overflow-x:hidden}
h1,h2,h3,h4,h5,h6,.font-heading{font-family:'Nunito',sans-serif}

/* ECG Header Animation */
.ecg-container{position:relative;width:100%;height:48px;overflow:hidden;background:#FAFBFC;border-bottom:1px solid #F1F3F5}
.ecg-line{position:absolute;top:0;left:0;width:200%;height:100%;animation:ecg-scroll 4s linear infinite}
@keyframes ecg-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.ecg-path{fill:none;stroke:#EF4444;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 3px rgba(239,68,68,0.4))}
.ecg-glow{fill:none;stroke:#EF4444;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;opacity:0.15}
.ecg-dot{fill:#EF4444;animation:ecg-pulse 1.2s ease-in-out infinite}
@keyframes ecg-pulse{0%,100%{opacity:0.4;r:3}50%{opacity:1;r:5}}

/* Tab System */
.tab-bar{display:flex;align-items:center;gap:4px;background:#FFFFFF;padding:6px;border-radius:16px;border:1px solid #F1F3F5;position:relative;overflow:hidden}
.tab-btn{position:relative;z-index:2;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:600;color:#6B7280;cursor:pointer;transition:color 0.3s;border:none;background:transparent;font-family:'DM Sans',sans-serif;white-space:nowrap}
.tab-btn.active{color:#1A1D23}
.tab-indicator{position:absolute;height:calc(100% - 12px);background:#FAFBFC;border-radius:12px;border:1px solid #F1F3F5;transition:left 0.35s cubic-bezier(0.4,0,0.2,1),width 0.35s cubic-bezier(0.4,0,0.2,1);z-index:1;top:6px;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
.tab-page{display:none;animation:tab-enter 0.4s ease-out}
.tab-page.active{display:block}
@keyframes tab-enter{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* Body Silhouette */
.body-zone{cursor:pointer;transition:all 0.3s;opacity:0.7}
.body-zone:hover{opacity:1;filter:drop-shadow(0 0 8px currentColor)}
.body-zone.active{opacity:1;filter:drop-shadow(0 0 12px currentColor)}
.zone-label{pointer-events:none;font-size:10px;font-weight:700;font-family:'DM Sans',sans-serif}

/* Health Score Ring */
.score-ring{transform:rotate(-90deg)}
.score-ring-bg{fill:none;stroke:#F1F3F5;stroke-width:8}
.score-ring-fg{fill:none;stroke-width:8;stroke-linecap:round;stroke-dasharray:0 283;animation:ring-draw 2s ease-out 0.5s forwards}
@keyframes ring-draw{to{stroke-dasharray:var(--score-dash) 283}}

/* ECG Waveform (side panel) */
.ecg-wave-container{position:relative;height:60px;overflow:hidden;border-radius:8px;background:linear-gradient(180deg,rgba(239,68,68,0.03) 0%,transparent 100%)}
.ecg-wave-line{animation:ecg-wave-scroll 3s linear infinite}
@keyframes ecg-wave-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

/* Pulse glow for heart rate */
.pulse-glow{animation:pulse-glow 1.5s ease-in-out infinite}
@keyframes pulse-glow{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.2)}50%{box-shadow:0 0 0 12px rgba(239,68,68,0)}}

/* Medication checkbox */
.med-check{width:20px;height:20px;border-radius:6px;border:2px solid #D1D5DB;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0}
.med-check.checked{background:#10B981;border-color:#10B981}
.med-check.checked svg{opacity:1}
.med-check svg{opacity:0;transition:opacity 0.2s}

/* Scroll reveal */
.reveal-item{opacity:0;transform:translateY(16px);transition:opacity 0.6s ease-out,transform 0.6s ease-out}
.reveal-item.revealed{opacity:1;transform:translateY(0)}

/* Heart beat counter */
.hr-counter{font-variant-numeric:tabular-nums}
.hr-pulse{animation:hr-beat 1s ease-in-out infinite}
@keyframes hr-beat{0%,100%{transform:scale(1)}15%{transform:scale(1.15)}30%{transform:scale(1)}45%{transform:scale(1.08)}60%{transform:scale(1)}}

/* Breathing ring */
.breathe-ring{animation:breathe 4s ease-in-out infinite}
@keyframes breathe{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.08);opacity:1}}

/* Toast */
.toast{position:fixed;bottom:24px;right:24px;background:#1A1D23;color:#fff;padding:14px 24px;border-radius:14px;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;z-index:100;transform:translateY(100px);opacity:0;transition:all 0.5s cubic-bezier(0.4,0,0.2,1);display:flex;align-items:center;gap:10px;box-shadow:0 12px 40px rgba(0,0,0,0.15);max-width:360px}
.toast.show{transform:translateY(0);opacity:1}

/* Zone detail panel */
.zone-detail{position:absolute;background:#FFFFFF;border-radius:16px;padding:16px;border:1px solid #F1F3F5;box-shadow:0 8px 32px rgba(0,0,0,0.08);z-index:20;min-width:220px;opacity:0;transform:scale(0.95);transition:all 0.25s ease-out;pointer-events:none}
.zone-detail.show{opacity:1;transform:scale(1);pointer-events:auto}

/* Vitals shimmer */
.vital-shimmer{background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.4) 50%,transparent 100%);background-size:200% 100%;animation:shimmer 3s ease-in-out infinite}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* Medication timeline */
.med-timeline{position:relative}
.med-timeline::before{content:'';position:absolute;left:16px;top:0;bottom:0;width:2px;background:linear-gradient(180deg,#10B981 0%,#F1F3F5 100%)}
.med-item{position:relative;padding-left:42px;padding-bottom:20px}
.med-dot{position:absolute;left:10px;top:4px;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #D1D5DB}
.med-dot.done{background:#10B981;box-shadow:0 0 0 2px #10B981}
.med-dot.current{background:#F59E0B;box-shadow:0 0 0 2px #F59E0B;animation:pulse-glow-sm 2s infinite}
.med-dot.upcoming{background:#F1F3F5;box-shadow:0 0 0 2px #D1D5DB}
@keyframes pulse-glow-sm{0%,100%{box-shadow:0 0 0 2px #F59E0B}50%{box-shadow:0 0 0 6px rgba(245,158,11,0.2)}}

/* Responsive */
@media(max-width:1200px){.main-grid{grid-template-columns:1fr !important}.side-panel{display:none}}
@media(max-width:768px){.tab-bar{overflow-x:auto;scrollbar-width:none}.tab-bar::-webkit-scrollbar{display:none}.stat-grid{grid-template-columns:repeat(2,1fr) !important}}
</style>
</head>
<body>

<!-- ECG Header Line -->
<div class="ecg-container" id="ecgHeader">
  <svg class="ecg-line" viewBox="0 0 2400 48" preserveAspectRatio="none">
    <path class="ecg-glow" d="M0,24 L80,24 L100,24 L110,8 L120,40 L130,4 L140,44 L150,24 L160,24 L240,24 L320,24 L400,24 L420,24 L430,8 L440,40 L450,4 L460,44 L470,24 L480,24 L560,24 L640,24 L720,24 L740,24 L750,8 L760,40 L770,4 L780,44 L790,24 L800,24 L880,24 L960,24 L1040,24 L1060,24 L1070,8 L1080,40 L1090,4 L1100,44 L1110,24 L1120,24 L1200,24"/>
    <path class="ecg-path" d="M0,24 L80,24 L100,24 L110,8 L120,40 L130,4 L140,44 L150,24 L160,24 L240,24 L320,24 L400,24 L420,24 L430,8 L440,40 L450,4 L460,44 L470,24 L480,24 L560,24 L640,24 L720,24 L740,24 L750,8 L760,40 L770,4 L780,44 L790,24 L800,24 L880,24 L960,24 L1040,24 L1060,24 L1070,8 L1080,40 L1090,4 L1100,44 L1110,24 L1120,24 L1200,24"/>
    <circle class="ecg-dot" cx="130" cy="4" r="3"/>
  </svg>
</div>

<!-- Top Navigation -->
<header class="sticky top-0 z-30 bg-base">
  <div class="max-w-[1440px] mx-auto px-6 py-4">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-cardio/10 rounded-xl flex items-center justify-center pulse-glow">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </div>
        <div>
          <h1 class="font-heading text-xl font-900 tracking-tight">Vital<span class="text-cardio">Pulse</span></h1>
          <p class="text-textMuted text-xs font-body">2026 年 2 月 25 日 &#183; 星期三</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="showToast('裝置同步中...')" class="flex items-center gap-2 bg-surface border border-border px-4 py-2.5 rounded-xl text-xs font-600 text-textSecondary cursor-pointer hover:border-cardio/30 hover:text-cardio transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          同步裝置
        </button>
        <button class="relative w-10 h-10 bg-surface border border-border rounded-xl flex items-center justify-center cursor-pointer hover:border-cardio/30 transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span class="absolute -top-1 -right-1 w-4 h-4 bg-cardio rounded-full flex items-center justify-center text-[9px] text-white font-700">2</span>
        </button>
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-oxygen to-sleep flex items-center justify-center text-white text-sm font-700 font-heading">CA</div>
      </div>
    </div>

    <!-- Pill Tabs -->
    <div class="tab-bar" id="tabBar">
      <div class="tab-indicator" id="tabIndicator"></div>
      <button class="tab-btn active" data-tab="vitals" onclick="switchTab('vitals')">
        <span class="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Vitals
        </span>
      </button>
      <button class="tab-btn" data-tab="activity" onclick="switchTab('activity')">
        <span class="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
          Activity
        </span>
      </button>
      <button class="tab-btn" data-tab="nutrition" onclick="switchTab('nutrition')">
        <span class="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 2h2v20H2z"/><path d="M6 12V2h2v10"/><path d="M10 2v10"/><path d="M14 2v4a4 4 0 0 0 8 0V2"/><path d="M18 2v20"/></svg>
          Nutrition
        </span>
      </button>
      <button class="tab-btn" data-tab="sleep" onclick="switchTab('sleep')">
        <span class="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          Sleep
        </span>
      </button>
      <button class="tab-btn" data-tab="medication" onclick="switchTab('medication')">
        <span class="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
          Medication
        </span>
      </button>
    </div>
  </div>
</header>

<!-- ==================== VITALS TAB ==================== -->
<div id="tab-vitals" class="tab-page active">
  <div class="max-w-[1440px] mx-auto px-6 py-6">
    <div class="main-grid" style="display:grid;grid-template-columns:1fr 320px;gap:24px">
      <!-- Left: Body Silhouette + Health Score -->
      <div>
        <!-- Top Stats Row -->
        <div class="stat-grid reveal-item" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">
          <!-- Heart Rate -->
          <div class="bg-surface rounded-2xl p-5 border border-border relative overflow-hidden">
            <div class="flex items-center justify-between mb-3">
              <span class="text-textMuted text-xs font-500">Heart Rate</span>
              <div class="w-8 h-8 bg-cardio/8 rounded-lg flex items-center justify-center hr-pulse">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#EF4444" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </div>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-800 font-heading hr-counter" id="heartRateValue">72</span>
              <span class="text-textMuted text-xs">bpm</span>
            </div>
            <div class="text-nutrition text-[11px] font-600 mt-1">Normal range</div>
            <!-- Mini ECG -->
            <div class="mt-3 ecg-wave-container">
              <svg class="ecg-wave-line" width="400" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
                <path d="M0,30 L30,30 L40,30 L45,12 L50,48 L55,8 L60,52 L65,30 L75,30 L100,30 L130,30 L140,30 L145,12 L150,48 L155,8 L160,52 L165,30 L175,30 L200,30 L230,30 L240,30 L245,12 L250,48 L255,8 L260,52 L265,30 L275,30 L300,30 L330,30 L340,30 L345,12 L350,48 L355,8 L360,52 L365,30 L375,30 L400,30" fill="none" stroke="#EF4444" stroke-width="1.5" opacity="0.6"/>
              </svg>
            </div>
          </div>

          <!-- Blood Pressure -->
          <div class="bg-surface rounded-2xl p-5 border border-border">
            <div class="flex items-center justify-between mb-3">
              <span class="text-textMuted text-xs font-500">Blood Pressure</span>
              <div class="w-8 h-8 bg-oxygen/8 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"><path d="M2 12h6l3-9 3 18 3-9h5"/></svg>
              </div>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-800 font-heading">120</span>
              <span class="text-textMuted text-sm">/</span>
              <span class="text-xl font-700 font-heading text-textSecondary">78</span>
            </div>
            <div class="text-nutrition text-[11px] font-600 mt-1">Optimal</div>
            <div class="flex gap-1 mt-3">
              <div class="flex-1 h-2 rounded-full bg-nutrition/20"><div class="h-2 rounded-full bg-nutrition" style="width:65%"></div></div>
            </div>
            <div class="flex justify-between mt-1">
              <span class="text-[9px] text-textMuted">Low</span>
              <span class="text-[9px] text-textMuted">High</span>
            </div>
          </div>

          <!-- SpO2 -->
          <div class="bg-surface rounded-2xl p-5 border border-border">
            <div class="flex items-center justify-between mb-3">
              <span class="text-textMuted text-xs font-500">SpO2</span>
              <div class="w-8 h-8 bg-oxygen/8 rounded-lg flex items-center justify-center breathe-ring">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg>
              </div>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-800 font-heading">98</span>
              <span class="text-textMuted text-xs">%</span>
            </div>
            <div class="text-nutrition text-[11px] font-600 mt-1">Excellent</div>
            <div class="mt-3 flex items-center gap-2">
              <div class="flex-1 h-6 bg-oxygen/5 rounded-lg overflow-hidden flex items-end">
                <div class="w-[8%] h-3 bg-oxygen/30 rounded-sm mx-px"></div>
                <div class="w-[8%] h-4 bg-oxygen/40 rounded-sm mx-px"></div>
                <div class="w-[8%] h-5 bg-oxygen/50 rounded-sm mx-px"></div>
                <div class="w-[8%] h-6 bg-oxygen/60 rounded-sm mx-px"></div>
                <div class="w-[8%] h-5 bg-oxygen/50 rounded-sm mx-px"></div>
                <div class="w-[8%] h-6 bg-oxygen/70 rounded-sm mx-px"></div>
                <div class="w-[8%] h-5 bg-oxygen/50 rounded-sm mx-px"></div>
                <div class="w-[8%] h-4 bg-oxygen/40 rounded-sm mx-px"></div>
              </div>
            </div>
          </div>

          <!-- Body Temp -->
          <div class="bg-surface rounded-2xl p-5 border border-border">
            <div class="flex items-center justify-between mb-3">
              <span class="text-textMuted text-xs font-500">Temperature</span>
              <div class="w-8 h-8 bg-activity/8 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z"/></svg>
              </div>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-800 font-heading">36.5</span>
              <span class="text-textMuted text-xs">&deg;C</span>
            </div>
            <div class="text-nutrition text-[11px] font-600 mt-1">Normal</div>
            <div class="mt-3 h-2 bg-gradient-to-r from-oxygen via-nutrition via-activity to-cardio rounded-full relative">
              <div class="absolute w-3 h-3 bg-white border-2 border-nutrition rounded-full top-1/2 -translate-y-1/2" style="left:38%"></div>
            </div>
          </div>
        </div>

        <!-- Body Silhouette Section -->
        <div class="bg-surface rounded-2xl border border-border p-6 reveal-item relative" id="bodySection">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="font-heading font-800 text-base">Body Health Map</h3>
              <p class="text-textMuted text-xs mt-0.5">Click a zone to view detailed metrics</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-textMuted px-2 py-1 bg-base rounded-lg border border-border">Last updated: 2 min ago</span>
            </div>
          </div>

          <div class="flex items-start gap-8">
            <!-- SVG Body Silhouette -->
            <div class="relative flex-shrink-0" style="width:240px;height:480px" id="bodyMap">
              <svg width="240" height="480" viewBox="0 0 240 480" fill="none">
                <!-- Body outline -->
                <path d="M120,20 C105,20 95,35 95,50 C95,65 105,78 120,78 C135,78 145,65 145,50 C145,35 135,20 120,20Z" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="1.5"/>
                <!-- Neck -->
                <path d="M110,78 L110,95 L130,95 L130,78" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="1.5"/>
                <!-- Torso -->
                <path d="M80,95 L110,95 L110,100 L75,105 L65,170 L70,240 L80,280 L95,280 L95,240 L120,240 L145,240 L145,280 L160,280 L170,240 L175,170 L165,105 L130,100 L130,95 L160,95" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="1.5"/>
                <!-- Left arm -->
                <path d="M75,105 L55,130 L40,180 L35,220 L30,250 L38,252 L48,222 L58,185 L65,170" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="1.5"/>
                <!-- Right arm -->
                <path d="M165,105 L185,130 L200,180 L205,220 L210,250 L202,252 L192,222 L182,185 L175,170" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="1.5"/>
                <!-- Left leg -->
                <path d="M95,280 L90,340 L85,400 L82,450 L75,470 L95,470 L100,450 L105,400 L110,340 L120,280" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="1.5"/>
                <!-- Right leg -->
                <path d="M145,280 L150,340 L155,400 L158,450 L165,470 L145,470 L140,450 L135,400 L130,340 L120,280" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="1.5"/>

                <!-- Clickable zones with colored indicators -->
                <!-- Head/Brain -->
                <circle class="body-zone" data-zone="brain" cx="120" cy="48" r="22" fill="rgba(139,92,246,0.08)" stroke="#8B5CF6" stroke-width="2" stroke-dasharray="4 3" onclick="showZoneDetail('brain')"/>
                <text class="zone-label" x="120" y="15" text-anchor="middle" fill="#8B5CF6">Brain</text>

                <!-- Heart/Chest -->
                <circle class="body-zone" data-zone="heart" cx="108" cy="140" r="20" fill="rgba(239,68,68,0.08)" stroke="#EF4444" stroke-width="2" stroke-dasharray="4 3" onclick="showZoneDetail('heart')"/>
                <text class="zone-label" x="55" y="140" text-anchor="end" fill="#EF4444">Heart</text>
                <line x1="58" y1="138" x2="88" y2="138" stroke="#EF4444" stroke-width="1" stroke-dasharray="2 2"/>

                <!-- Lungs -->
                <ellipse class="body-zone" data-zone="lungs" cx="140" cy="145" rx="15" ry="22" fill="rgba(59,130,246,0.08)" stroke="#3B82F6" stroke-width="2" stroke-dasharray="4 3" onclick="showZoneDetail('lungs')"/>
                <text class="zone-label" x="190" y="145" text-anchor="start" fill="#3B82F6">Lungs</text>
                <line x1="155" y1="143" x2="187" y2="143" stroke="#3B82F6" stroke-width="1" stroke-dasharray="2 2"/>

                <!-- Stomach/Gut -->
                <ellipse class="body-zone" data-zone="stomach" cx="120" cy="200" rx="25" ry="18" fill="rgba(16,185,129,0.08)" stroke="#10B981" stroke-width="2" stroke-dasharray="4 3" onclick="showZoneDetail('stomach')"/>
                <text class="zone-label" x="55" y="205" text-anchor="end" fill="#10B981">Gut</text>
                <line x1="58" y1="203" x2="95" y2="203" stroke="#10B981" stroke-width="1" stroke-dasharray="2 2"/>

                <!-- Left Arm (BP) -->
                <ellipse class="body-zone" data-zone="bp" cx="47" cy="195" rx="12" ry="25" fill="rgba(59,130,246,0.08)" stroke="#3B82F6" stroke-width="2" stroke-dasharray="4 3" onclick="showZoneDetail('bp')"/>
                <text class="zone-label" x="15" y="178" text-anchor="start" fill="#3B82F6">BP</text>

                <!-- Legs (Activity) -->
                <ellipse class="body-zone" data-zone="activity" cx="103" cy="380" rx="18" ry="50" fill="rgba(245,158,11,0.08)" stroke="#F59E0B" stroke-width="2" stroke-dasharray="4 3" onclick="showZoneDetail('activity')"/>
                <text class="zone-label" x="55" y="385" text-anchor="end" fill="#F59E0B">Mobility</text>
                <line x1="58" y1="383" x2="85" y2="383" stroke="#F59E0B" stroke-width="1" stroke-dasharray="2 2"/>
              </svg>

              <!-- Zone detail popups -->
              <div class="zone-detail" id="zone-brain" style="top:10px;left:160px">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-6 h-6 bg-sleep/10 rounded-md flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"><path d="M12 2a9 9 0 0 0-9 9c0 3.07 1.64 5.64 4 7.56V22h10v-3.44c2.36-1.92 4-4.49 4-7.56a9 9 0 0 0-9-9Z"/><path d="M12 6v6"/><path d="M9 14h6"/></svg>
                  </div>
                  <span class="font-heading font-700 text-sm">Brain Health</span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Stress Level</span><span class="font-600 text-sleep">Low</span></div>
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Focus Score</span><span class="font-600">85/100</span></div>
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Mood</span><span class="font-600 text-nutrition">Positive</span></div>
                </div>
              </div>

              <div class="zone-detail" id="zone-heart" style="top:100px;left:160px">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-6 h-6 bg-cardio/10 rounded-md flex items-center justify-center hr-pulse">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#EF4444" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  </div>
                  <span class="font-heading font-700 text-sm">Heart</span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Resting HR</span><span class="font-600 text-cardio">72 bpm</span></div>
                  <div class="flex justify-between text-xs"><span class="text-textMuted">HRV</span><span class="font-600">48 ms</span></div>
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Recovery</span><span class="font-600 text-nutrition">Good</span></div>
                </div>
              </div>

              <div class="zone-detail" id="zone-lungs" style="top:90px;left:170px">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-6 h-6 bg-oxygen/10 rounded-md flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"><path d="M6.5 12H2a10 10 0 0 0 20 0h-4.5"/><path d="M12 2v10"/></svg>
                  </div>
                  <span class="font-heading font-700 text-sm">Respiratory</span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-xs"><span class="text-textMuted">SpO2</span><span class="font-600 text-oxygen">98%</span></div>
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Resp Rate</span><span class="font-600">16/min</span></div>
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Status</span><span class="font-600 text-nutrition">Clear</span></div>
                </div>
              </div>

              <div class="zone-detail" id="zone-stomach" style="top:180px;left:165px">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-6 h-6 bg-nutrition/10 rounded-md flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round"><path d="M2 2h2v20H2z"/><path d="M6 12V2h2v10"/><path d="M10 2v10"/></svg>
                  </div>
                  <span class="font-heading font-700 text-sm">Digestive</span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Calories Today</span><span class="font-600">1,420 kcal</span></div>
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Hydration</span><span class="font-600 text-oxygen">1.6 L</span></div>
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Gut Health</span><span class="font-600 text-nutrition">Good</span></div>
                </div>
              </div>

              <div class="zone-detail" id="zone-bp" style="top:155px;left:-185px">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-6 h-6 bg-oxygen/10 rounded-md flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  </div>
                  <span class="font-heading font-700 text-sm">Blood Pressure</span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Systolic</span><span class="font-600">120 mmHg</span></div>
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Diastolic</span><span class="font-600">78 mmHg</span></div>
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Status</span><span class="font-600 text-nutrition">Optimal</span></div>
                </div>
              </div>

              <div class="zone-detail" id="zone-activity" style="top:330px;left:160px">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-6 h-6 bg-activity/10 rounded-md flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="5" r="3"/><path d="m7 20 1.5-5H10l2-5 2 5h1.5L17 20"/></svg>
                  </div>
                  <span class="font-heading font-700 text-sm">Mobility</span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Steps</span><span class="font-600 text-activity">8,432</span></div>
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Distance</span><span class="font-600">5.8 km</span></div>
                  <div class="flex justify-between text-xs"><span class="text-textMuted">Joint Health</span><span class="font-600 text-nutrition">Good</span></div>
                </div>
              </div>
            </div>

            <!-- Health Summary next to body -->
            <div class="flex-1 space-y-4">
              <!-- Weekly Health Score Ring -->
              <div class="bg-base rounded-2xl p-5 border border-border">
                <h4 class="font-heading font-700 text-sm mb-4">Weekly Health Score</h4>
                <div class="flex items-center gap-6">
                  <div class="relative" style="width:110px;height:110px">
                    <svg class="score-ring" width="110" height="110" viewBox="0 0 110 110">
                      <circle class="score-ring-bg" cx="55" cy="55" r="45"/>
                      <circle class="score-ring-fg" cx="55" cy="55" r="45" stroke="url(#scoreGrad)" style="--score-dash:247"/>
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#10B981"/>
                          <stop offset="50%" stop-color="#3B82F6"/>
                          <stop offset="100%" stop-color="#8B5CF6"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                      <span class="text-2xl font-900 font-heading">87</span>
                      <span class="text-[10px] text-textMuted">/ 100</span>
                    </div>
                  </div>
                  <div class="flex-1 space-y-2.5">
                    <div>
                      <div class="flex justify-between text-xs mb-1"><span class="text-textMuted">Cardio</span><span class="font-600 text-cardio">92</span></div>
                      <div class="h-1.5 bg-base rounded-full border border-border"><div class="h-full bg-cardio rounded-full" style="width:92%"></div></div>
                    </div>
                    <div>
                      <div class="flex justify-between text-xs mb-1"><span class="text-textMuted">Respiratory</span><span class="font-600 text-oxygen">88</span></div>
                      <div class="h-1.5 bg-base rounded-full border border-border"><div class="h-full bg-oxygen rounded-full" style="width:88%"></div></div>
                    </div>
                    <div>
                      <div class="flex justify-between text-xs mb-1"><span class="text-textMuted">Nutrition</span><span class="font-600 text-nutrition">79</span></div>
                      <div class="h-1.5 bg-base rounded-full border border-border"><div class="h-full bg-nutrition rounded-full" style="width:79%"></div></div>
                    </div>
                    <div>
                      <div class="flex justify-between text-xs mb-1"><span class="text-textMuted">Sleep</span><span class="font-600 text-sleep">85</span></div>
                      <div class="h-1.5 bg-base rounded-full border border-border"><div class="h-full bg-sleep rounded-full" style="width:85%"></div></div>
                    </div>
                    <div>
                      <div class="flex justify-between text-xs mb-1"><span class="text-textMuted">Activity</span><span class="font-600 text-activity">91</span></div>
                      <div class="h-1.5 bg-base rounded-full border border-border"><div class="h-full bg-activity rounded-full" style="width:91%"></div></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Weekly Trend Chart -->
              <div class="bg-base rounded-2xl p-5 border border-border">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="font-heading font-700 text-sm">7-Day Trend</h4>
                  <div class="flex gap-3 text-[10px] text-textMuted">
                    <span class="flex items-center gap-1"><span class="w-2 h-2 bg-cardio rounded-full"></span>HR</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 bg-oxygen rounded-full"></span>SpO2</span>
                  </div>
                </div>
                <div class="flex items-end gap-2 h-28">
                  <div class="flex-1 flex flex-col items-center gap-1">
                    <div class="w-full flex gap-0.5 items-end justify-center h-full">
                      <div class="w-2.5 bg-cardio/70 rounded-t-sm" style="height:68%"></div>
                      <div class="w-2.5 bg-oxygen/70 rounded-t-sm" style="height:95%"></div>
                    </div>
                    <span class="text-[9px] text-textMuted">Mon</span>
                  </div>
                  <div class="flex-1 flex flex-col items-center gap-1">
                    <div class="w-full flex gap-0.5 items-end justify-center h-full">
                      <div class="w-2.5 bg-cardio/70 rounded-t-sm" style="height:72%"></div>
                      <div class="w-2.5 bg-oxygen/70 rounded-t-sm" style="height:97%"></div>
                    </div>
                    <span class="text-[9px] text-textMuted">Tue</span>
                  </div>
                  <div class="flex-1 flex flex-col items-center gap-1">
                    <div class="w-full flex gap-0.5 items-end justify-center h-full">
                      <div class="w-2.5 bg-cardio/70 rounded-t-sm" style="height:65%"></div>
                      <div class="w-2.5 bg-oxygen/70 rounded-t-sm" style="height:96%"></div>
                    </div>
                    <span class="text-[9px] text-textMuted">Wed</span>
                  </div>
                  <div class="flex-1 flex flex-col items-center gap-1">
                    <div class="w-full flex gap-0.5 items-end justify-center h-full">
                      <div class="w-2.5 bg-cardio/70 rounded-t-sm" style="height:78%"></div>
                      <div class="w-2.5 bg-oxygen/70 rounded-t-sm" style="height:98%"></div>
                    </div>
                    <span class="text-[9px] text-textMuted">Thu</span>
                  </div>
                  <div class="flex-1 flex flex-col items-center gap-1">
                    <div class="w-full flex gap-0.5 items-end justify-center h-full">
                      <div class="w-2.5 bg-cardio/70 rounded-t-sm" style="height:60%"></div>
                      <div class="w-2.5 bg-oxygen/70 rounded-t-sm" style="height:94%"></div>
                    </div>
                    <span class="text-[9px] text-textMuted">Fri</span>
                  </div>
                  <div class="flex-1 flex flex-col items-center gap-1">
                    <div class="w-full flex gap-0.5 items-end justify-center h-full">
                      <div class="w-2.5 bg-cardio/70 rounded-t-sm" style="height:70%"></div>
                      <div class="w-2.5 bg-oxygen/70 rounded-t-sm" style="height:96%"></div>
                    </div>
                    <span class="text-[9px] text-textMuted">Sat</span>
                  </div>
                  <div class="flex-1 flex flex-col items-center gap-1">
                    <div class="w-full flex gap-0.5 items-end justify-center h-full">
                      <div class="w-2.5 bg-cardio/60 rounded-t-sm border border-cardio/30 border-dashed" style="height:72%"></div>
                      <div class="w-2.5 bg-oxygen/60 rounded-t-sm border border-oxygen/30 border-dashed" style="height:98%"></div>
                    </div>
                    <span class="text-[9px] text-cardio font-600">Today</span>
                  </div>
                </div>
              </div>

              <!-- Today's Goals -->
              <div class="bg-base rounded-2xl p-5 border border-border">
                <h4 class="font-heading font-700 text-sm mb-3">Today's Goals</h4>
                <div class="space-y-3">
                  <div>
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-textMuted flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5"><circle cx="12" cy="5" r="3"/><path d="m7 20 1.5-5H10l2-5 2 5h1.5L17 20"/></svg>
                        Steps
                      </span>
                      <span class="font-600">8,432 <span class="text-textMuted font-400">/ 10,000</span></span>
                    </div>
                    <div class="h-2 bg-border rounded-full"><div class="h-2 bg-activity rounded-full transition-all" style="width:84%"></div></div>
                  </div>
                  <div>
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-textMuted flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><path d="M12 22c-4.97 0-9-2.24-9-5v-5l9-7 9 7v5c0 2.76-4.03 5-9 5Z"/></svg>
                        Calories
                      </span>
                      <span class="font-600">420 <span class="text-textMuted font-400">/ 500 kcal</span></span>
                    </div>
                    <div class="h-2 bg-border rounded-full"><div class="h-2 bg-cardio rounded-full transition-all" style="width:84%"></div></div>
                  </div>
                  <div>
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-textMuted flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2.5"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z"/></svg>
                        Water
                      </span>
                      <span class="font-600">1.6 <span class="text-textMuted font-400">/ 2.0 L</span></span>
                    </div>
                    <div class="h-2 bg-border rounded-full"><div class="h-2 bg-oxygen rounded-full transition-all" style="width:80%"></div></div>
                  </div>
                </div>
                <button onclick="showToast('已記錄一杯水 (250ml)')" class="w-full mt-4 bg-oxygen/8 text-oxygen py-2.5 rounded-xl text-xs font-600 cursor-pointer hover:bg-oxygen/15 transition-colors border border-oxygen/15">
                  <span class="flex items-center justify-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                    Record Water Intake
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side Panel: Live Vitals -->
      <div class="side-panel space-y-4">
        <!-- Live ECG -->
        <div class="bg-surface rounded-2xl border border-border p-5 reveal-item">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-heading font-700 text-sm">Live ECG</h4>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 bg-cardio rounded-full pulse-glow" style="animation-duration:1s"></span>
              <span class="text-[10px] text-cardio font-600">LIVE</span>
            </div>
          </div>
          <div class="ecg-wave-container" style="height:80px;border:1px solid #F1F3F5">
            <svg class="ecg-wave-line" width="600" height="80" viewBox="0 0 600 80" preserveAspectRatio="none">
              <path d="M0,40 L40,40 L55,40 L60,15 L65,65 L70,5 L75,75 L80,40 L95,40 L130,40 L155,40 L160,15 L165,65 L170,5 L175,75 L180,40 L195,40 L230,40 L255,40 L260,15 L265,65 L270,5 L275,75 L280,40 L295,40 L330,40 L355,40 L360,15 L365,65 L370,5 L375,75 L380,40 L395,40 L430,40 L455,40 L460,15 L465,65 L470,5 L475,75 L480,40 L495,40 L530,40 L555,40 L560,15 L565,65 L570,5 L575,75 L580,40 L600,40" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#EF4444" class="hr-pulse"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              <span class="text-xl font-800 font-heading hr-counter" id="liveHR">72</span>
              <span class="text-textMuted text-xs">bpm</span>
            </div>
            <span class="text-[10px] text-nutrition font-600 px-2 py-0.5 bg-nutrition/8 rounded-md">Sinus Rhythm</span>
          </div>
        </div>

        <!-- Vital Signs Summary -->
        <div class="bg-surface rounded-2xl border border-border p-5 reveal-item">
          <h4 class="font-heading font-700 text-sm mb-4">Vital Signs</h4>
          <div class="space-y-4">
            <div class="flex items-center gap-3 p-3 bg-base rounded-xl border border-border">
              <div class="w-9 h-9 bg-cardio/8 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div class="flex-1">
                <div class="text-xs text-textMuted">Heart Rate</div>
                <div class="font-700 text-sm">72 bpm</div>
              </div>
              <span class="text-[10px] font-600 text-nutrition bg-nutrition/8 px-2 py-0.5 rounded-md">Normal</span>
            </div>
            <div class="flex items-center gap-3 p-3 bg-base rounded-xl border border-border">
              <div class="w-9 h-9 bg-oxygen/8 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z"/></svg>
              </div>
              <div class="flex-1">
                <div class="text-xs text-textMuted">Blood Oxygen</div>
                <div class="font-700 text-sm">98%</div>
              </div>
              <span class="text-[10px] font-600 text-nutrition bg-nutrition/8 px-2 py-0.5 rounded-md">Normal</span>
            </div>
            <div class="flex items-center gap-3 p-3 bg-base rounded-xl border border-border">
              <div class="w-9 h-9 bg-oxygen/8 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"><path d="M2 12h6l3-9 3 18 3-9h5"/></svg>
              </div>
              <div class="flex-1">
                <div class="text-xs text-textMuted">Blood Pressure</div>
                <div class="font-700 text-sm">120/78 mmHg</div>
              </div>
              <span class="text-[10px] font-600 text-nutrition bg-nutrition/8 px-2 py-0.5 rounded-md">Optimal</span>
            </div>
            <div class="flex items-center gap-3 p-3 bg-base rounded-xl border border-border">
              <div class="w-9 h-9 bg-activity/8 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z"/></svg>
              </div>
              <div class="flex-1">
                <div class="text-xs text-textMuted">Temperature</div>
                <div class="font-700 text-sm">36.5 &deg;C</div>
              </div>
              <span class="text-[10px] font-600 text-nutrition bg-nutrition/8 px-2 py-0.5 rounded-md">Normal</span>
            </div>
            <div class="flex items-center gap-3 p-3 bg-base rounded-xl border border-border">
              <div class="w-9 h-9 bg-sleep/8 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              </div>
              <div class="flex-1">
                <div class="text-xs text-textMuted">Sleep Score</div>
                <div class="font-700 text-sm">82/100</div>
              </div>
              <span class="text-[10px] font-600 text-nutrition bg-nutrition/8 px-2 py-0.5 rounded-md">Good</span>
            </div>
          </div>
        </div>

        <!-- Quick Medication -->
        <div class="bg-surface rounded-2xl border border-border p-5 reveal-item">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-heading font-700 text-sm">Upcoming Meds</h4>
            <span class="text-[10px] text-activity font-600 px-2 py-0.5 bg-activity/8 rounded-md">2 remaining</span>
          </div>
          <div class="space-y-3">
            <div class="flex items-center gap-3 p-2.5 bg-activity/5 rounded-xl border border-activity/15">
              <div class="med-check" onclick="toggleMed(this)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div class="flex-1">
                <div class="text-xs font-600">Vitamin D3</div>
                <div class="text-[10px] text-textMuted">2:00 PM - 1000 IU</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div class="flex items-center gap-3 p-2.5 bg-base rounded-xl border border-border">
              <div class="med-check" onclick="toggleMed(this)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div class="flex-1">
                <div class="text-xs font-600">Omega-3</div>
                <div class="text-[10px] text-textMuted">8:00 PM - 1000mg</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ==================== ACTIVITY TAB ==================== -->
<div id="tab-activity" class="tab-page">
  <div class="max-w-[1440px] mx-auto px-6 py-6">
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-surface rounded-2xl p-5 border border-border reveal-item">
        <div class="flex items-center justify-between mb-3">
          <span class="text-textMuted text-xs">Steps</span>
          <div class="w-8 h-8 bg-activity/8 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="5" r="3"/><path d="m7 20 1.5-5H10l2-5 2 5h1.5L17 20"/></svg>
          </div>
        </div>
        <div class="text-3xl font-800 font-heading">8,432</div>
        <div class="text-activity text-[11px] font-600 mt-1">84% of daily goal</div>
        <div class="h-2 bg-border rounded-full mt-3"><div class="h-2 bg-activity rounded-full" style="width:84%"></div></div>
      </div>
      <div class="bg-surface rounded-2xl p-5 border border-border reveal-item">
        <div class="flex items-center justify-between mb-3">
          <span class="text-textMuted text-xs">Calories Burned</span>
          <div class="w-8 h-8 bg-cardio/8 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round"><path d="M12 22c-4.97 0-9-2.24-9-5v-5l9-7 9 7v5c0 2.76-4.03 5-9 5Z"/></svg>
          </div>
        </div>
        <div class="text-3xl font-800 font-heading">420</div>
        <div class="text-cardio text-[11px] font-600 mt-1">kcal active burn</div>
        <div class="h-2 bg-border rounded-full mt-3"><div class="h-2 bg-cardio rounded-full" style="width:84%"></div></div>
      </div>
      <div class="bg-surface rounded-2xl p-5 border border-border reveal-item">
        <div class="flex items-center justify-between mb-3">
          <span class="text-textMuted text-xs">Distance</span>
          <div class="w-8 h-8 bg-nutrition/8 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>
          </div>
        </div>
        <div class="text-3xl font-800 font-heading">5.8<span class="text-lg font-600 text-textMuted"> km</span></div>
        <div class="text-nutrition text-[11px] font-600 mt-1">76% of daily goal</div>
        <div class="h-2 bg-border rounded-full mt-3"><div class="h-2 bg-nutrition rounded-full" style="width:76%"></div></div>
      </div>
    </div>

    <!-- Activities List -->
    <div class="bg-surface rounded-2xl border border-border p-5 reveal-item">
      <h3 class="font-heading font-700 text-sm mb-4">Today's Activities</h3>
      <div class="space-y-3">
        <div class="flex items-center gap-4 p-4 bg-base rounded-xl border border-border">
          <div class="w-11 h-11 bg-activity/8 rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="5" r="3"/><path d="m7 20 1.5-5H10l2-5 2 5h1.5L17 20"/></svg>
          </div>
          <div class="flex-1">
            <div class="font-600 text-sm">Morning Run</div>
            <div class="text-[11px] text-textMuted">06:30 - 07:05 &middot; 4.2 km</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-700 text-cardio">286 kcal</div>
            <div class="text-[10px] text-textMuted">35 min</div>
          </div>
        </div>
        <div class="flex items-center gap-4 p-4 bg-base rounded-xl border border-border">
          <div class="w-11 h-11 bg-nutrition/8 rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round"><path d="M13 4v16"/><path d="M17 4v16"/><path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13"/></svg>
          </div>
          <div class="flex-1">
            <div class="font-600 text-sm">Lunch Walk</div>
            <div class="text-[11px] text-textMuted">12:15 - 12:45 &middot; 1.8 km</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-700 text-cardio">98 kcal</div>
            <div class="text-[10px] text-textMuted">30 min</div>
          </div>
        </div>
        <div class="flex items-center gap-4 p-4 bg-base rounded-xl border border-border">
          <div class="w-11 h-11 bg-sleep/8 rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"><path d="M12 2a9 9 0 0 0-9 9c0 3.07 1.64 5.64 4 7.56V22h10v-3.44c2.36-1.92 4-4.49 4-7.56a9 9 0 0 0-9-9Z"/><path d="M12 8v4l2 2"/></svg>
          </div>
          <div class="flex-1">
            <div class="font-600 text-sm">Meditation</div>
            <div class="text-[11px] text-textMuted">21:00 - 21:15</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-700 text-sleep">36 kcal</div>
            <div class="text-[10px] text-textMuted">15 min</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hourly Steps -->
    <div class="bg-surface rounded-2xl border border-border p-5 mt-4 reveal-item">
      <h3 class="font-heading font-700 text-sm mb-4">Hourly Steps</h3>
      <div class="flex items-end gap-1 h-24">
        <div class="flex-1 bg-activity/15 rounded-t-sm" style="height:10%" title="6am"></div>
        <div class="flex-1 bg-activity/40 rounded-t-sm" style="height:65%" title="7am"></div>
        <div class="flex-1 bg-activity/25 rounded-t-sm" style="height:20%" title="8am"></div>
        <div class="flex-1 bg-activity/20 rounded-t-sm" style="height:15%" title="9am"></div>
        <div class="flex-1 bg-activity/20 rounded-t-sm" style="height:12%" title="10am"></div>
        <div class="flex-1 bg-activity/25 rounded-t-sm" style="height:18%" title="11am"></div>
        <div class="flex-1 bg-activity/35 rounded-t-sm" style="height:45%" title="12pm"></div>
        <div class="flex-1 bg-activity/20 rounded-t-sm" style="height:14%" title="1pm"></div>
        <div class="flex-1 bg-activity/15 rounded-t-sm" style="height:8%" title="2pm"></div>
        <div class="flex-1 bg-activity/20 rounded-t-sm" style="height:16%" title="3pm"></div>
        <div class="flex-1 bg-activity/15 rounded-t-sm" style="height:10%" title="4pm"></div>
        <div class="flex-1 bg-activity/10 rounded-t-sm border border-activity/20 border-dashed" style="height:5%" title="5pm"></div>
      </div>
      <div class="flex justify-between mt-1 text-[8px] text-textMuted">
        <span>6am</span><span>8am</span><span>10am</span><span>12pm</span><span>2pm</span><span>4pm</span>
      </div>
    </div>
  </div>
</div>

<!-- ==================== NUTRITION TAB ==================== -->
<div id="tab-nutrition" class="tab-page">
  <div class="max-w-[1440px] mx-auto px-6 py-6">
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-surface rounded-2xl p-5 border border-border reveal-item">
        <div class="text-textMuted text-xs mb-2">Calories</div>
        <div class="text-2xl font-800 font-heading text-cardio">1,420</div>
        <div class="text-[11px] text-textMuted mt-1">of 1,800 kcal goal</div>
        <div class="h-1.5 bg-border rounded-full mt-2"><div class="h-1.5 bg-cardio rounded-full" style="width:79%"></div></div>
      </div>
      <div class="bg-surface rounded-2xl p-5 border border-border reveal-item">
        <div class="text-textMuted text-xs mb-2">Protein</div>
        <div class="text-2xl font-800 font-heading text-nutrition">68<span class="text-sm">g</span></div>
        <div class="text-[11px] text-textMuted mt-1">of 90g goal</div>
        <div class="h-1.5 bg-border rounded-full mt-2"><div class="h-1.5 bg-nutrition rounded-full" style="width:76%"></div></div>
      </div>
      <div class="bg-surface rounded-2xl p-5 border border-border reveal-item">
        <div class="text-textMuted text-xs mb-2">Carbs</div>
        <div class="text-2xl font-800 font-heading text-activity">185<span class="text-sm">g</span></div>
        <div class="text-[11px] text-textMuted mt-1">of 225g goal</div>
        <div class="h-1.5 bg-border rounded-full mt-2"><div class="h-1.5 bg-activity rounded-full" style="width:82%"></div></div>
      </div>
      <div class="bg-surface rounded-2xl p-5 border border-border reveal-item">
        <div class="text-textMuted text-xs mb-2">Fat</div>
        <div class="text-2xl font-800 font-heading text-sleep">42<span class="text-sm">g</span></div>
        <div class="text-[11px] text-textMuted mt-1">of 60g goal</div>
        <div class="h-1.5 bg-border rounded-full mt-2"><div class="h-1.5 bg-sleep rounded-full" style="width:70%"></div></div>
      </div>
    </div>

    <!-- Macro Ring -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-surface rounded-2xl border border-border p-5 reveal-item">
        <h3 class="font-heading font-700 text-sm mb-4">Macro Distribution</h3>
        <div class="flex items-center justify-center">
          <div class="relative" style="width:160px;height:160px">
            <svg width="160" height="160" viewBox="0 0 160 160" style="transform:rotate(-90deg)">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#F1F3F5" stroke-width="20"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#10B981" stroke-width="20" stroke-dasharray="92 285" stroke-dashoffset="0"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#F59E0B" stroke-width="20" stroke-dasharray="138 285" stroke-dashoffset="-92"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#8B5CF6" stroke-width="20" stroke-dasharray="55 285" stroke-dashoffset="-230"/>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-lg font-800 font-heading">1,420</span>
              <span class="text-[10px] text-textMuted">kcal</span>
            </div>
          </div>
        </div>
        <div class="flex justify-center gap-5 mt-4 text-xs">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 bg-nutrition rounded-sm"></span>Protein 23%</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 bg-activity rounded-sm"></span>Carbs 52%</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 bg-sleep rounded-sm"></span>Fat 25%</span>
        </div>
      </div>

      <!-- Meal Log -->
      <div class="bg-surface rounded-2xl border border-border p-5 reveal-item">
        <h3 class="font-heading font-700 text-sm mb-4">Meals Today</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-3 p-3 bg-base rounded-xl border border-border">
            <div class="w-10 h-10 bg-activity/8 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M12 12v10"/></svg>
            </div>
            <div class="flex-1">
              <div class="text-xs font-600">Breakfast</div>
              <div class="text-[10px] text-textMuted">Oatmeal, blueberries, coffee</div>
            </div>
            <span class="text-xs font-700">380 kcal</span>
          </div>
          <div class="flex items-center gap-3 p-3 bg-base rounded-xl border border-border">
            <div class="w-10 h-10 bg-nutrition/8 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round"><path d="M2 2h2v20H2z"/><path d="M6 12V2h2v10"/><path d="M10 2v10"/></svg>
            </div>
            <div class="flex-1">
              <div class="text-xs font-600">Lunch</div>
              <div class="text-[10px] text-textMuted">Chicken salad, brown rice</div>
            </div>
            <span class="text-xs font-700">520 kcal</span>
          </div>
          <div class="flex items-center gap-3 p-3 bg-base rounded-xl border border-border">
            <div class="w-10 h-10 bg-sleep/8 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"><path d="m7 20 1.5-5H10l2-5 2 5h1.5L17 20"/><circle cx="12" cy="5" r="3"/></svg>
            </div>
            <div class="flex-1">
              <div class="text-xs font-600">Snack</div>
              <div class="text-[10px] text-textMuted">Banana, mixed nuts</div>
            </div>
            <span class="text-xs font-700">180 kcal</span>
          </div>
          <div class="flex items-center gap-3 p-3 bg-base rounded-xl border border-border">
            <div class="w-10 h-10 bg-cardio/8 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round"><path d="M18 2h-2a4 4 0 0 0-4 4v10"/><path d="M14 2v4a4 4 0 0 0 8 0V2"/><path d="M18 2v20"/></svg>
            </div>
            <div class="flex-1">
              <div class="text-xs font-600">Dinner</div>
              <div class="text-[10px] text-textMuted">Salmon set, miso soup</div>
            </div>
            <span class="text-xs font-700">340 kcal</span>
          </div>
        </div>
        <button onclick="showToast('Food logging feature coming soon')" class="w-full mt-4 bg-nutrition/8 text-nutrition py-2.5 rounded-xl text-xs font-600 cursor-pointer hover:bg-nutrition/15 transition-colors border border-nutrition/15">
          <span class="flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Log Food
          </span>
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ==================== SLEEP TAB ==================== -->
<div id="tab-sleep" class="tab-page">
  <div class="max-w-[1440px] mx-auto px-6 py-6">
    <!-- Sleep Summary -->
    <div class="bg-gradient-to-br from-sleep/5 to-transparent rounded-2xl border border-sleep/10 p-6 mb-6 reveal-item">
      <div class="flex items-center justify-between mb-5">
        <div>
          <div class="text-xs text-textMuted mb-1">Last Night's Sleep</div>
          <div class="text-4xl font-900 font-heading">7h 24m</div>
        </div>
        <div class="relative" style="width:80px;height:80px">
          <svg class="score-ring" width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="#F1F3F5" stroke-width="6"/>
            <circle cx="40" cy="40" r="32" fill="none" stroke="#8B5CF6" stroke-width="6" stroke-linecap="round" stroke-dasharray="165 201"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-lg font-800 font-heading text-sleep">82</span>
            <span class="text-[8px] text-textMuted">score</span>
          </div>
        </div>
      </div>

      <!-- Sleep Stages Bar -->
      <div class="bg-surface rounded-xl p-4 border border-border">
        <div class="flex justify-between text-[10px] text-textMuted mb-2">
          <span>23:30</span><span>00:30</span><span>02:00</span><span>03:30</span><span>05:00</span><span>06:54</span>
        </div>
        <div class="flex h-8 rounded-lg overflow-hidden gap-px">
          <div class="bg-sleep/15 flex-shrink-0" style="width:5%" title="Awake"></div>
          <div class="bg-sleep/40 flex-shrink-0" style="width:15%" title="Light"></div>
          <div class="bg-sleep flex-shrink-0" style="width:20%" title="Deep"></div>
          <div class="bg-sleep/40 flex-shrink-0" style="width:12%" title="Light"></div>
          <div class="bg-indigo-400 flex-shrink-0" style="width:10%" title="REM"></div>
          <div class="bg-sleep flex-shrink-0" style="width:18%" title="Deep"></div>
          <div class="bg-sleep/40 flex-shrink-0" style="width:13%" title="Light"></div>
          <div class="bg-sleep/15 flex-shrink-0" style="width:7%" title="Awake"></div>
        </div>
        <div class="flex flex-wrap gap-4 mt-3 text-[10px] text-textMuted">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-sleep rounded-sm"></span>Deep 2h 50m</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-sleep/40 rounded-sm"></span>Light 3h 00m</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-indigo-400 rounded-sm"></span>REM 48m</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-sleep/15 rounded-sm"></span>Awake 46m</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-surface rounded-2xl p-5 border border-border text-center reveal-item">
        <div class="w-10 h-10 bg-sleep/8 rounded-xl flex items-center justify-center mx-auto mb-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </div>
        <div class="font-800 font-heading text-lg">23:30</div>
        <div class="text-xs text-textMuted">Bedtime</div>
      </div>
      <div class="bg-surface rounded-2xl p-5 border border-border text-center reveal-item">
        <div class="w-10 h-10 bg-activity/8 rounded-xl flex items-center justify-center mx-auto mb-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        </div>
        <div class="font-800 font-heading text-lg">06:54</div>
        <div class="text-xs text-textMuted">Wake up</div>
      </div>
      <div class="bg-surface rounded-2xl p-5 border border-border text-center reveal-item">
        <div class="w-10 h-10 bg-oxygen/8 rounded-xl flex items-center justify-center mx-auto mb-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <div class="font-800 font-heading text-lg">12 min</div>
        <div class="text-xs text-textMuted">Time to fall asleep</div>
      </div>
    </div>

    <!-- Sleep Trends -->
    <div class="bg-surface rounded-2xl border border-border p-5 reveal-item">
      <h3 class="font-heading font-700 text-sm mb-4">7-Night Sleep Duration</h3>
      <div class="flex items-end gap-3 h-28">
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full bg-sleep/30 rounded-t-lg" style="height:85%"></div>
          <span class="text-[9px] text-textMuted">Mon</span>
          <span class="text-[9px] font-600">7h 10m</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full bg-sleep/40 rounded-t-lg" style="height:92%"></div>
          <span class="text-[9px] text-textMuted">Tue</span>
          <span class="text-[9px] font-600">7h 45m</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full bg-sleep/25 rounded-t-lg" style="height:70%"></div>
          <span class="text-[9px] text-textMuted">Wed</span>
          <span class="text-[9px] font-600">6h 30m</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full bg-sleep/45 rounded-t-lg" style="height:95%"></div>
          <span class="text-[9px] text-textMuted">Thu</span>
          <span class="text-[9px] font-600">8h 00m</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full bg-sleep/30 rounded-t-lg" style="height:80%"></div>
          <span class="text-[9px] text-textMuted">Fri</span>
          <span class="text-[9px] font-600">6h 50m</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full bg-sleep/50 rounded-t-lg" style="height:100%"></div>
          <span class="text-[9px] text-textMuted">Sat</span>
          <span class="text-[9px] font-600">8h 20m</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full bg-sleep/35 rounded-t-lg border border-sleep/30 border-dashed" style="height:88%"></div>
          <span class="text-[9px] text-sleep font-600">Sun</span>
          <span class="text-[9px] font-600">7h 24m</span>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ==================== MEDICATION TAB ==================== -->
<div id="tab-medication" class="tab-page">
  <div class="max-w-[1440px] mx-auto px-6 py-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-surface rounded-2xl p-5 border border-border reveal-item">
        <div class="text-textMuted text-xs mb-2">Today's Meds</div>
        <div class="text-3xl font-800 font-heading">4</div>
        <div class="text-nutrition text-[11px] font-600 mt-1">2 taken, 2 remaining</div>
      </div>
      <div class="bg-surface rounded-2xl p-5 border border-border reveal-item">
        <div class="text-textMuted text-xs mb-2">Adherence</div>
        <div class="text-3xl font-800 font-heading text-nutrition">94<span class="text-sm">%</span></div>
        <div class="text-nutrition text-[11px] font-600 mt-1">This week</div>
      </div>
      <div class="bg-surface rounded-2xl p-5 border border-border reveal-item">
        <div class="text-textMuted text-xs mb-2">Streak</div>
        <div class="text-3xl font-800 font-heading text-activity">12</div>
        <div class="text-activity text-[11px] font-600 mt-1">days perfect</div>
      </div>
    </div>

    <!-- Medication Timeline -->
    <div class="bg-surface rounded-2xl border border-border p-6 reveal-item">
      <h3 class="font-heading font-700 text-base mb-6">Today's Schedule</h3>
      <div class="med-timeline">
        <!-- Morning -->
        <div class="med-item">
          <div class="med-dot done"></div>
          <div class="bg-nutrition/5 rounded-xl p-4 border border-nutrition/15">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-textMuted font-500 bg-base px-2 py-0.5 rounded-md">08:00 AM</span>
                <span class="text-[10px] text-nutrition font-600 bg-nutrition/8 px-2 py-0.5 rounded-md">Taken</span>
              </div>
              <div class="med-check checked" onclick="toggleMed(this)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-nutrition/10 rounded-xl flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
              </div>
              <div>
                <div class="font-600 text-sm">Metformin 500mg</div>
                <div class="text-[11px] text-textMuted">With breakfast &middot; Blood sugar control</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Late Morning -->
        <div class="med-item">
          <div class="med-dot done"></div>
          <div class="bg-nutrition/5 rounded-xl p-4 border border-nutrition/15">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-textMuted font-500 bg-base px-2 py-0.5 rounded-md">10:00 AM</span>
                <span class="text-[10px] text-nutrition font-600 bg-nutrition/8 px-2 py-0.5 rounded-md">Taken</span>
              </div>
              <div class="med-check checked" onclick="toggleMed(this)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-activity/10 rounded-xl flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/></svg>
              </div>
              <div>
                <div class="font-600 text-sm">Vitamin D3 1000 IU</div>
                <div class="text-[11px] text-textMuted">With snack &middot; Bone health</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Afternoon (current) -->
        <div class="med-item">
          <div class="med-dot current"></div>
          <div class="bg-activity/5 rounded-xl p-4 border border-activity/20">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-textMuted font-500 bg-base px-2 py-0.5 rounded-md">02:00 PM</span>
                <span class="text-[10px] text-activity font-600 bg-activity/8 px-2 py-0.5 rounded-md animate-pulse">Due Now</span>
              </div>
              <div class="med-check" onclick="toggleMed(this)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-oxygen/10 rounded-xl flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
              </div>
              <div>
                <div class="font-600 text-sm">Fish Oil Omega-3 1000mg</div>
                <div class="text-[11px] text-textMuted">After lunch &middot; Heart health</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Evening -->
        <div class="med-item" style="padding-bottom:0">
          <div class="med-dot upcoming"></div>
          <div class="bg-base rounded-xl p-4 border border-border">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-textMuted font-500 bg-base px-2 py-0.5 rounded-md border border-border">08:00 PM</span>
                <span class="text-[10px] text-textMuted font-500">Upcoming</span>
              </div>
              <div class="med-check" onclick="toggleMed(this)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-sleep/10 rounded-xl flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              </div>
              <div>
                <div class="font-600 text-sm">Magnesium 400mg</div>
                <div class="text-[11px] text-textMuted">Before bed &middot; Sleep quality</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Adherence Chart -->
    <div class="bg-surface rounded-2xl border border-border p-5 mt-4 reveal-item">
      <h3 class="font-heading font-700 text-sm mb-4">Weekly Adherence</h3>
      <div class="flex items-end gap-3 h-20">
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full bg-nutrition rounded-t-lg" style="height:100%"></div>
          <span class="text-[9px] text-textMuted">Mon</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full bg-nutrition rounded-t-lg" style="height:100%"></div>
          <span class="text-[9px] text-textMuted">Tue</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full bg-nutrition/60 rounded-t-lg" style="height:75%"></div>
          <span class="text-[9px] text-textMuted">Wed</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full bg-nutrition rounded-t-lg" style="height:100%"></div>
          <span class="text-[9px] text-textMuted">Thu</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full bg-nutrition rounded-t-lg" style="height:100%"></div>
          <span class="text-[9px] text-textMuted">Fri</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full bg-nutrition rounded-t-lg" style="height:100%"></div>
          <span class="text-[9px] text-textMuted">Sat</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full bg-nutrition/40 rounded-t-lg border border-nutrition/30 border-dashed" style="height:50%"></div>
          <span class="text-[9px] text-nutrition font-600">Sun</span>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Toast Notification -->
<div class="toast" id="toast">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
  <span id="toastMsg"></span>
</div>

<!-- Medication Reminder Toast (auto-show) -->
<div class="toast" id="medToast" style="background:linear-gradient(135deg,#F59E0B,#D97706);bottom:80px">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
  <span>Time for your afternoon medication</span>
</div>

<script>
// ==================== Tab Switching ====================
const tabs = ['vitals','activity','nutrition','sleep','medication'];
let currentTab = 'vitals';

function switchTab(tab) {
  currentTab = tab;
  // Hide all pages
  tabs.forEach(t => {
    const page = document.getElementById('tab-' + t);
    if (page) page.classList.remove('active');
  });
  // Show target page
  const target = document.getElementById('tab-' + tab);
  if (target) target.classList.add('active');

  // Update button styles
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Move indicator
  updateTabIndicator(tab);

  // Re-trigger reveals on new page
  setTimeout(() => initScrollReveal(), 100);
}

function updateTabIndicator(tab) {
  const bar = document.getElementById('tabBar');
  const indicator = document.getElementById('tabIndicator');
  const btn = bar.querySelector('[data-tab="' + tab + '"]');
  if (!btn || !indicator) return;
  const barRect = bar.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  indicator.style.left = (btnRect.left - barRect.left) + 'px';
  indicator.style.width = btnRect.width + 'px';
}

// Init indicator on load
window.addEventListener('load', () => {
  setTimeout(() => updateTabIndicator('vitals'), 100);
});
window.addEventListener('resize', () => updateTabIndicator(currentTab));

// ==================== Body Zone Details ====================
let activeZone = null;

function showZoneDetail(zone) {
  // Close previous
  if (activeZone) {
    const prev = document.getElementById('zone-' + activeZone);
    if (prev) prev.classList.remove('show');
    document.querySelectorAll('.body-zone').forEach(z => z.classList.remove('active'));
  }

  if (activeZone === zone) {
    activeZone = null;
    return;
  }

  activeZone = zone;
  const detail = document.getElementById('zone-' + zone);
  if (detail) detail.classList.add('show');
  const circle = document.querySelector('[data-zone="' + zone + '"]');
  if (circle) circle.classList.add('active');
}

// Close zone on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.body-zone') && !e.target.closest('.zone-detail') && activeZone) {
    const prev = document.getElementById('zone-' + activeZone);
    if (prev) prev.classList.remove('show');
    document.querySelectorAll('.body-zone').forEach(z => z.classList.remove('active'));
    activeZone = null;
  }
});

// ==================== Medication Checkboxes ====================
function toggleMed(el) {
  el.classList.toggle('checked');
  if (el.classList.contains('checked')) {
    showToast('Medication marked as taken');
  } else {
    showToast('Medication unmarked');
  }
}

// ==================== Toast ====================
let toastTimeout = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toastMsg');
  msgEl.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==================== Heart Rate Counter ====================
function animateHeartRate() {
  const hrEl = document.getElementById('heartRateValue');
  const liveEl = document.getElementById('liveHR');
  if (!hrEl) return;

  setInterval(() => {
    const base = 72;
    const variation = Math.floor(Math.random() * 5) - 2;
    const val = base + variation;
    hrEl.textContent = val;
    if (liveEl) liveEl.textContent = val;
  }, 2000);
}
animateHeartRate();

// ==================== IntersectionObserver Scroll Reveal ====================
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal-item:not(.revealed)');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  items.forEach(item => observer.observe(item));
}

// Init on load
window.addEventListener('load', () => {
  initScrollReveal();

  // Auto-show medication reminder after 3 seconds
  setTimeout(() => {
    const medToast = document.getElementById('medToast');
    if (medToast) {
      medToast.classList.add('show');
      setTimeout(() => medToast.classList.remove('show'), 5000);
    }
  }, 3000);
});

// ==================== Responsive: recalc tab indicator ====================
const resizeObserver = new ResizeObserver(() => updateTabIndicator(currentTab));
const tabBarEl = document.getElementById('tabBar');
if (tabBarEl) resizeObserver.observe(tabBarEl);
</script>
</body>
</html>
$HTML$,
  2
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
