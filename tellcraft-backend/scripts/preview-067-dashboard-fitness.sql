INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '3bfcabd0-c27f-4730-b01c-663a381a3ab4',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FitTrack Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Exo 2', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      colors: {
        lime: { 400: '#a3e635', 500: '#84cc16', 600: '#65a30d' },
        surface: { 900: '#0f0f0f', 800: '#1a1a1a', 700: '#252525', 600: '#2f2f2f' }
      }
    }
  }
}
</script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', sans-serif; background: #0f0f0f; color: #e5e5e5; min-height: 100vh; }
h1, h2, h3, .font-display { font-family: 'Exo 2', sans-serif; }

/* Activity Ring Animations */
@keyframes ring-fill-move {
  from { stroke-dashoffset: var(--ring-circumference); }
  to { stroke-dashoffset: var(--ring-target); }
}
.activity-ring {
  transform-origin: center;
  transform: rotate(-90deg);
}
.ring-track { fill: none; opacity: 0.15; }
.ring-progress {
  fill: none;
  stroke-linecap: round;
  animation: ring-fill-move 1.5s ease-out forwards;
}
.ring-move .ring-track { stroke: #84cc16; }
.ring-move .ring-progress { stroke: #84cc16; }
.ring-exercise .ring-track { stroke: #f97316; }
.ring-exercise .ring-progress { stroke: #f97316; animation-delay: 0.3s; stroke-dashoffset: var(--ring-circumference); }
.ring-stand .ring-track { stroke: #06b6d4; }
.ring-stand .ring-progress { stroke: #06b6d4; animation-delay: 0.6s; stroke-dashoffset: var(--ring-circumference); }

/* Body Diagram */
.muscle-region { transition: all 0.3s ease; cursor: pointer; }
.muscle-region:hover { filter: brightness(1.4); }
.tooltip-box {
  position: absolute;
  background: #252525;
  border: 1px solid #3f3f3f;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
  white-space: nowrap;
  z-index: 50;
}
.tooltip-box.visible { opacity: 1; }

/* Bar chart animation */
@keyframes bar-grow {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
.bar-animated {
  transform-origin: bottom;
  animation: bar-grow 0.8s ease-out forwards;
}

/* Workout card hover */
.workout-card { transition: transform 0.2s, background 0.2s; }
.workout-card:hover { transform: translateY(-2px); background: #252525; }

/* Tab active */
.tab-item { transition: all 0.2s; }
.tab-item:hover { color: #84cc16; }
.tab-item.active { color: #84cc16; border-bottom: 2px solid #84cc16; }
</style>
</head>
<body class="font-body">

<!-- Top Bar -->
<header class="sticky top-0 z-40 bg-surface-800/80 backdrop-blur-md border-b border-white/5">
  <div class="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
    <div class="flex items-center gap-8">
      <!-- Logo -->
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-lime-500 flex items-center justify-center">
          <svg class="w-5 h-5 text-surface-900" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <span class="font-display font-bold text-lg text-white tracking-tight">FitTrack</span>
      </div>
      <!-- Tabs -->
      <nav class="flex items-center gap-1">
        <button class="tab-item active px-4 py-4 text-sm font-medium">Dashboard</button>
        <button class="tab-item px-4 py-4 text-sm font-medium text-gray-500">Workouts</button>
        <button class="tab-item px-4 py-4 text-sm font-medium text-gray-500">Nutrition</button>
      </nav>
    </div>
    <!-- User Avatar -->
    <div class="flex items-center gap-3">
      <div class="text-right hidden sm:block">
        <div class="text-xs text-gray-400">Good morning</div>
        <div class="text-sm font-medium text-white">Alex Chen</div>
      </div>
      <div class="w-9 h-9 rounded-full bg-gradient-to-br from-lime-500 to-lime-600 flex items-center justify-center text-surface-900 font-display font-bold text-sm">A</div>
    </div>
  </div>
</header>

<!-- Main Content -->
<main class="max-w-7xl mx-auto px-6 py-6 space-y-6">

  <!-- Row 1: Activity Rings + Body Diagram -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

    <!-- Activity Rings -->
    <div class="bg-surface-800 rounded-2xl p-6 border border-white/5">
      <h2 class="font-display font-semibold text-white text-base mb-5">Activity Rings</h2>
      <div class="flex items-center gap-8">
        <!-- SVG Rings -->
        <div class="relative w-48 h-48 flex-shrink-0">
          <svg viewBox="0 0 200 200" class="w-full h-full">
            <!-- Move Ring (outer) - 78% -->
            <g class="activity-ring ring-move">
              <circle class="ring-track" cx="100" cy="100" r="88" stroke-width="14"/>
              <circle class="ring-progress" cx="100" cy="100" r="88" stroke-width="14"
                stroke-dasharray="553"
                style="--ring-circumference: 553; --ring-target: 121.66;"
              />
            </g>
            <!-- Exercise Ring (middle) - 92% -->
            <g class="activity-ring ring-exercise">
              <circle class="ring-track" cx="100" cy="100" r="70" stroke-width="14"/>
              <circle class="ring-progress" cx="100" cy="100" r="70" stroke-width="14"
                stroke-dasharray="440"
                style="--ring-circumference: 440; --ring-target: 35.2;"
              />
            </g>
            <!-- Stand Ring (inner) - 65% -->
            <g class="activity-ring ring-stand">
              <circle class="ring-track" cx="100" cy="100" r="52" stroke-width="14"/>
              <circle class="ring-progress" cx="100" cy="100" r="52" stroke-width="14"
                stroke-dasharray="327"
                style="--ring-circumference: 327; --ring-target: 114.45;"
              />
            </g>
          </svg>
          <!-- Center heart -->
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <svg class="w-5 h-5 text-red-500 mb-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span class="text-white font-display font-bold text-sm">72</span>
            <span class="text-gray-500 text-[10px]">bpm</span>
          </div>
        </div>
        <!-- Ring Legend -->
        <div class="space-y-4 flex-1">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <div class="w-3 h-3 rounded-full bg-lime-500"></div>
              <span class="text-sm font-medium text-white">Move</span>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="font-display font-bold text-2xl text-lime-500">1,240</span>
              <span class="text-xs text-gray-500">/ 1,600 cal</span>
            </div>
            <div class="w-full bg-white/5 rounded-full h-1.5 mt-1.5">
              <div class="bg-lime-500 h-1.5 rounded-full" style="width:78%"></div>
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <div class="w-3 h-3 rounded-full bg-orange-500"></div>
              <span class="text-sm font-medium text-white">Exercise</span>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="font-display font-bold text-2xl text-orange-500">46</span>
              <span class="text-xs text-gray-500">/ 50 min</span>
            </div>
            <div class="w-full bg-white/5 rounded-full h-1.5 mt-1.5">
              <div class="bg-orange-500 h-1.5 rounded-full" style="width:92%"></div>
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <div class="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span class="text-sm font-medium text-white">Stand</span>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="font-display font-bold text-2xl text-cyan-500">8</span>
              <span class="text-xs text-gray-500">/ 12 hrs</span>
            </div>
            <div class="w-full bg-white/5 rounded-full h-1.5 mt-1.5">
              <div class="bg-cyan-500 h-1.5 rounded-full" style="width:65%"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Body Diagram (SIGNATURE) -->
    <div class="bg-surface-800 rounded-2xl p-6 border border-white/5 relative">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-display font-semibold text-white text-base">Muscle Map</h2>
        <span class="text-xs text-gray-500">Today's activation</span>
      </div>
      <div class="flex items-start gap-6">
        <!-- SVG Body Silhouette -->
        <div class="relative flex-shrink-0" id="bodyDiagram" style="width:160px; height:300px;">
          <svg viewBox="0 0 160 300" class="w-full h-full">
            <!-- Body outline (front view) -->
            <!-- Head -->
            <ellipse cx="80" cy="28" rx="18" ry="22" fill="none" stroke="#3f3f3f" stroke-width="1.5"/>
            <!-- Neck -->
            <rect x="72" y="48" width="16" height="12" rx="4" fill="none" stroke="#3f3f3f" stroke-width="1.5"/>

            <!-- Chest region - orange (moderate) -->
            <path class="muscle-region" data-muscle="Chest" data-status="Moderate" data-detail="Worked yesterday - bench press, flyes"
              d="M48,62 L112,62 Q118,62 118,68 L118,100 Q118,106 112,106 L48,106 Q42,106 42,100 L42,68 Q42,62 48,62 Z"
              fill="#f97316" fill-opacity="0.35" stroke="#f97316" stroke-width="1.5" stroke-opacity="0.6"/>

            <!-- Core region - orange (moderate) -->
            <path class="muscle-region" data-muscle="Core" data-status="Moderate" data-detail="Ab circuit 2 days ago"
              d="M56,108 L104,108 Q108,108 108,112 L108,152 Q108,156 104,156 L56,156 Q52,156 52,152 L52,112 Q52,108 56,108 Z"
              fill="#f97316" fill-opacity="0.3" stroke="#f97316" stroke-width="1.5" stroke-opacity="0.5"/>

            <!-- Left Arm - lime (active) -->
            <path class="muscle-region" data-muscle="Left Arm" data-status="Active" data-detail="Bicep curls, hammer curls today"
              d="M38,64 L26,64 Q20,64 18,70 L10,110 Q8,116 12,118 L22,118 Q26,116 28,110 L38,78 Z"
              fill="#84cc16" fill-opacity="0.4" stroke="#84cc16" stroke-width="1.5" stroke-opacity="0.7"/>
            <!-- Right Arm - lime (active) -->
            <path class="muscle-region" data-muscle="Right Arm" data-status="Active" data-detail="Tricep dips, pushdowns today"
              d="M122,64 L134,64 Q140,64 142,70 L150,110 Q152,116 148,118 L138,118 Q134,116 132,110 L122,78 Z"
              fill="#84cc16" fill-opacity="0.4" stroke="#84cc16" stroke-width="1.5" stroke-opacity="0.7"/>

            <!-- Back indicator (shown as upper back on front view) - gray (rest) -->
            <path class="muscle-region" data-muscle="Back" data-status="Rest" data-detail="3 days since last back workout"
              d="M58,64 L102,64 L102,72 L58,72 Z"
              fill="#6b7280" fill-opacity="0.2" stroke="#6b7280" stroke-width="1" stroke-opacity="0.4"/>

            <!-- Left Leg - lime (active) -->
            <path class="muscle-region" data-muscle="Left Leg" data-status="Active" data-detail="Squats, leg press today"
              d="M52,158 L76,158 Q80,158 80,162 L80,250 Q80,258 76,262 L68,278 Q64,284 60,284 L52,284 Q48,284 46,278 L42,258 Q40,250 42,240 L48,162 Q48,158 52,158 Z"
              fill="#84cc16" fill-opacity="0.35" stroke="#84cc16" stroke-width="1.5" stroke-opacity="0.6"/>
            <!-- Right Leg - lime (active) -->
            <path class="muscle-region" data-muscle="Right Leg" data-status="Active" data-detail="Lunges, calf raises today"
              d="M84,158 L108,158 Q112,158 112,162 L118,240 Q120,250 118,258 L114,278 Q112,284 108,284 L100,284 Q96,284 92,278 L84,262 Q80,258 80,250 L80,162 Q80,158 84,158 Z"
              fill="#84cc16" fill-opacity="0.35" stroke="#84cc16" stroke-width="1.5" stroke-opacity="0.6"/>
          </svg>
          <!-- Tooltip -->
          <div id="bodyTooltip" class="tooltip-box"></div>
        </div>
        <!-- Legend + Stats -->
        <div class="flex-1 space-y-4">
          <!-- Legend -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-sm" style="background:#84cc16"></div>
              <span class="text-xs text-gray-400">Active (today)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-sm" style="background:#f97316"></div>
              <span class="text-xs text-gray-400">Moderate (1-2 days)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-sm" style="background:#6b7280"></div>
              <span class="text-xs text-gray-400">Rest (3+ days)</span>
            </div>
          </div>
          <!-- Muscle Breakdown -->
          <div class="bg-surface-700/50 rounded-xl p-4 space-y-3">
            <div class="text-xs font-medium text-gray-400 uppercase tracking-wider">Breakdown</div>
            <div class="space-y-2.5">
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-300">Arms</span>
                  <span class="text-lime-500 font-medium">Active</span>
                </div>
                <div class="w-full bg-white/5 rounded-full h-1.5"><div class="bg-lime-500 h-1.5 rounded-full" style="width:90%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-300">Legs</span>
                  <span class="text-lime-500 font-medium">Active</span>
                </div>
                <div class="w-full bg-white/5 rounded-full h-1.5"><div class="bg-lime-500 h-1.5 rounded-full" style="width:85%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-300">Chest</span>
                  <span class="text-orange-500 font-medium">Moderate</span>
                </div>
                <div class="w-full bg-white/5 rounded-full h-1.5"><div class="bg-orange-500 h-1.5 rounded-full" style="width:55%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-300">Core</span>
                  <span class="text-orange-500 font-medium">Moderate</span>
                </div>
                <div class="w-full bg-white/5 rounded-full h-1.5"><div class="bg-orange-500 h-1.5 rounded-full" style="width:45%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-300">Back</span>
                  <span class="text-gray-500 font-medium">Rest</span>
                </div>
                <div class="w-full bg-white/5 rounded-full h-1.5"><div class="bg-gray-600 h-1.5 rounded-full" style="width:15%"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Row 2: Weekly Overview -->
  <div class="bg-surface-800 rounded-2xl p-6 border border-white/5">
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-display font-semibold text-white text-base">Weekly Overview</h2>
      <span class="text-xs text-gray-500">Feb 17 - Feb 23</span>
    </div>
    <div class="flex items-end gap-3" style="height:140px;">
      <!-- Mon -->
      <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
        <div class="w-full bg-lime-500/80 rounded-t-md bar-animated" style="height:55%; animation-delay:0.1s;"></div>
        <span class="text-[11px] text-gray-500">Mon</span>
        <span class="text-[10px] text-gray-600">42m</span>
      </div>
      <!-- Tue -->
      <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
        <div class="w-full bg-lime-500/80 rounded-t-md bar-animated" style="height:70%; animation-delay:0.2s;"></div>
        <span class="text-[11px] text-gray-500">Tue</span>
        <span class="text-[10px] text-gray-600">55m</span>
      </div>
      <!-- Wed -->
      <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
        <div class="w-full bg-gray-700/50 rounded-t-md bar-animated" style="height:8%; animation-delay:0.3s;"></div>
        <span class="text-[11px] text-gray-500">Wed</span>
        <span class="text-[10px] text-gray-600">Rest</span>
      </div>
      <!-- Thu -->
      <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
        <div class="w-full bg-lime-500/80 rounded-t-md bar-animated" style="height:85%; animation-delay:0.4s;"></div>
        <span class="text-[11px] text-gray-500">Thu</span>
        <span class="text-[10px] text-gray-600">65m</span>
      </div>
      <!-- Fri -->
      <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
        <div class="w-full bg-lime-500/80 rounded-t-md bar-animated" style="height:50%; animation-delay:0.5s;"></div>
        <span class="text-[11px] text-gray-500">Fri</span>
        <span class="text-[10px] text-gray-600">38m</span>
      </div>
      <!-- Sat -->
      <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
        <div class="w-full bg-lime-500/80 rounded-t-md bar-animated" style="height:90%; animation-delay:0.6s;"></div>
        <span class="text-[11px] text-gray-500">Sat</span>
        <span class="text-[10px] text-gray-600">72m</span>
      </div>
      <!-- Sun (today, highlighted) -->
      <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
        <div class="w-full rounded-t-md bar-animated relative" style="height:60%; animation-delay:0.7s;">
          <div class="absolute inset-0 bg-lime-500 rounded-t-md"></div>
          <div class="absolute inset-0 bg-lime-400/30 rounded-t-md animate-pulse"></div>
          <div class="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-lime-400 font-medium whitespace-nowrap">46m</div>
        </div>
        <span class="text-[11px] text-lime-500 font-semibold">Today</span>
        <span class="text-[10px] text-lime-600 font-medium">In progress</span>
      </div>
    </div>
    <!-- Weekly Summary -->
    <div class="flex items-center gap-6 mt-4 pt-4 border-t border-white/5">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-lime-500/10 flex items-center justify-center">
          <svg class="w-4 h-4 text-lime-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <div>
          <div class="text-xs text-gray-500">Total Time</div>
          <div class="text-sm font-display font-semibold text-white">318 min</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2c.5 4-3 6-3 10a6 6 0 0012 0c0-4-3.5-6-3-10-2 2-4 2-6 0z"/></svg>
        </div>
        <div>
          <div class="text-xs text-gray-500">Calories</div>
          <div class="text-sm font-display font-semibold text-white">2,480 kcal</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <svg class="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        </div>
        <div>
          <div class="text-xs text-gray-500">Workouts</div>
          <div class="text-sm font-display font-semibold text-white">6 sessions</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
          <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </div>
        <div>
          <div class="text-xs text-gray-500">Avg Heart Rate</div>
          <div class="text-sm font-display font-semibold text-white">128 bpm</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Row 3: Recent Workouts -->
  <div>
    <h2 class="font-display font-semibold text-white text-base mb-4">Recent Workouts</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Upper Body -->
      <div class="workout-card bg-surface-800 rounded-2xl p-5 border border-white/5 cursor-pointer">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl bg-lime-500/15 flex items-center justify-center">
            <svg class="w-5 h-5 text-lime-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6.5 6.5h11M6.5 17.5h11M3 12h3m12 0h3M9 6.5v11M15 6.5v11"/></svg>
          </div>
          <span class="text-[10px] uppercase tracking-wider text-lime-500 bg-lime-500/10 px-2 py-0.5 rounded-full font-medium">Strength</span>
        </div>
        <h3 class="font-display font-semibold text-white mb-1">Upper Body</h3>
        <p class="text-xs text-gray-500 mb-4">Chest, shoulders, triceps</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span class="text-xs text-gray-400">45 min</span>
            </div>
            <div class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2c.5 4-3 6-3 10a6 6 0 0012 0c0-4-3.5-6-3-10-2 2-4 2-6 0z"/></svg>
              <span class="text-xs text-gray-400">320 cal</span>
            </div>
          </div>
          <span class="text-[10px] text-gray-600">Today</span>
        </div>
      </div>

      <!-- HIIT -->
      <div class="workout-card bg-surface-800 rounded-2xl p-5 border border-white/5 cursor-pointer">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
            <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <span class="text-[10px] uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full font-medium">HIIT</span>
        </div>
        <h3 class="font-display font-semibold text-white mb-1">HIIT Circuit</h3>
        <p class="text-xs text-gray-500 mb-4">Full body, high intensity</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span class="text-xs text-gray-400">30 min</span>
            </div>
            <div class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2c.5 4-3 6-3 10a6 6 0 0012 0c0-4-3.5-6-3-10-2 2-4 2-6 0z"/></svg>
              <span class="text-xs text-gray-400">450 cal</span>
            </div>
          </div>
          <span class="text-[10px] text-gray-600">Yesterday</span>
        </div>
      </div>

      <!-- Yoga -->
      <div class="workout-card bg-surface-800 rounded-2xl p-5 border border-white/5 cursor-pointer">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center">
            <svg class="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2a4 4 0 100 8 4 4 0 000-8zM12 14c-5 0-8 2-8 4v2h16v-2c0-2-3-4-8-4z"/></svg>
          </div>
          <span class="text-[10px] uppercase tracking-wider text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full font-medium">Recovery</span>
        </div>
        <h3 class="font-display font-semibold text-white mb-1">Yoga Flow</h3>
        <p class="text-xs text-gray-500 mb-4">Flexibility, mindfulness</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span class="text-xs text-gray-400">60 min</span>
            </div>
            <div class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2c.5 4-3 6-3 10a6 6 0 0012 0c0-4-3.5-6-3-10-2 2-4 2-6 0z"/></svg>
              <span class="text-xs text-gray-400">180 cal</span>
            </div>
          </div>
          <span class="text-[10px] text-gray-600">2 days ago</span>
        </div>
      </div>
    </div>
  </div>

</main>

<script>
// Activity Ring Animation
document.addEventListener('DOMContentLoaded', function() {
  const rings = document.querySelectorAll('.ring-progress');
  rings.forEach(function(ring) {
    const circumference = parseFloat(ring.style.getPropertyValue('--ring-circumference'));
    ring.style.strokeDashoffset = circumference;
  });

  // Body Diagram Tooltip
  var tooltip = document.getElementById('bodyTooltip');
  var diagram = document.getElementById('bodyDiagram');
  var regions = document.querySelectorAll('.muscle-region');

  regions.forEach(function(region) {
    region.addEventListener('mouseenter', function(e) {
      var muscle = this.getAttribute('data-muscle');
      var status = this.getAttribute('data-status');
      var detail = this.getAttribute('data-detail');
      var color = status === 'Active' ? '#84cc16' : status === 'Moderate' ? '#f97316' : '#6b7280';

      tooltip.innerHTML = '<div style="font-weight:600;color:' + color + ';margin-bottom:2px;">' + muscle + ' <span style="font-weight:400;color:#9ca3af;">(' + status + ')</span></div><div style="color:#9ca3af;">' + detail + '</div>';
      tooltip.classList.add('visible');
    });

    region.addEventListener('mousemove', function(e) {
      var rect = diagram.getBoundingClientRect();
      var x = e.clientX - rect.left + 12;
      var y = e.clientY - rect.top - 10;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    });

    region.addEventListener('mouseleave', function() {
      tooltip.classList.remove('visible');
    });
  });
});
</script>
</body>
</html>
$HTML$,
  3
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
