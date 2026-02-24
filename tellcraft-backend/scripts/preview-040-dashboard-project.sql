INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '6b55a394-e05f-4ed9-b601-7b921c8c0981',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Website Redesign — Project Board</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        ocean: { 50:'#f0f9ff', 100:'#e0f2fe', 200:'#bae6fd', 300:'#7dd3fc', 400:'#38bdf8', 500:'#0ea5e9', 600:'#0284c7', 700:'#0369a1', 800:'#075985', 900:'#0c4a6e' },
        stone: { 50:'#fafaf9', 100:'#f5f5f4', 200:'#e7e5e3', 300:'#d6d3d1', 400:'#a8a29e', 500:'#78716c', 600:'#57534e', 700:'#44403c', 800:'#292524', 900:'#1c1917' },
        slate: { 50:'#f8fafc', 100:'#f1f5f9', 200:'#e2e8f0', 300:'#cbd5e1', 400:'#94a3b8', 500:'#64748b', 600:'#475569', 700:'#334155', 800:'#1e293b', 900:'#0f172a' }
      },
      fontFamily: { jakarta: ['Plus Jakarta Sans', 'sans-serif'] }
    }
  }
}
</script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }

/* Drag handle wiggle animation */
@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-2deg); }
  40% { transform: rotate(2deg); }
  60% { transform: rotate(-1.5deg); }
  80% { transform: rotate(1.5deg); }
}

@keyframes wiggle-pulse {
  0%, 100% { opacity: 0.3; transform: rotate(0deg) scale(1); }
  25% { opacity: 0.7; transform: rotate(-2deg) scale(1.05); }
  50% { opacity: 0.5; transform: rotate(2deg) scale(1); }
  75% { opacity: 0.7; transform: rotate(-1.5deg) scale(1.05); }
}

.drag-handle {
  display: flex;
  flex-direction: column;
  gap: 2px;
  opacity: 0.25;
  transition: opacity 0.2s ease;
  cursor: grab;
  padding: 4px 2px;
  flex-shrink: 0;
}
.drag-handle:active { cursor: grabbing; }

.drag-handle .dot-row {
  display: flex;
  gap: 3px;
}

.drag-handle .dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
}

.task-card:hover .drag-handle {
  opacity: 0.7;
  animation: wiggle-pulse 0.8s ease-in-out infinite;
}

.task-card {
  cursor: grab;
  transition: border-color 0.15s ease;
}
.task-card:active { cursor: grabbing; }

/* Column collapse */
.column-body.collapsed {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  margin-top: 0;
}
.column-body {
  max-height: 2000px;
  opacity: 1;
  transition: max-height 0.35s ease, opacity 0.25s ease, margin-top 0.25s ease;
}

.chevron-icon {
  transition: transform 0.25s ease;
}
.chevron-icon.rotated {
  transform: rotate(-90deg);
}

/* Progress ring */
.progress-ring-bg { stroke: #e7e5e3; }
.progress-ring-fill { transition: stroke-dashoffset 0.3s ease; stroke-linecap: round; }

/* Fade in cards */
.task-card { animation: fadeSlideIn 0.3s ease forwards; opacity: 0; }
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.task-card:nth-child(1) { animation-delay: 0.05s; }
.task-card:nth-child(2) { animation-delay: 0.1s; }
.task-card:nth-child(3) { animation-delay: 0.15s; }
.task-card:nth-child(4) { animation-delay: 0.2s; }

/* Done column cards */
.done-card { opacity: 0.55; }
.done-card:hover { opacity: 0.75; }
</style>
</head>
<body class="bg-stone-50 text-slate-800 min-h-screen flex flex-col">

<!-- Top Bar -->
<header class="h-14 bg-white border-b border-stone-200 flex items-center px-5 gap-4 flex-shrink-0">
  <div class="flex items-center gap-3">
    <div class="w-7 h-7 bg-ocean-700 rounded-lg flex items-center justify-center">
      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>
    </div>
    <h1 class="font-bold text-slate-900 text-sm tracking-tight">Website Redesign</h1>
  </div>

  <!-- Progress Overview -->
  <div class="flex items-center gap-2 ml-2">
    <div class="flex items-center gap-1.5 bg-ocean-50 border border-ocean-200 rounded-full px-3 py-1">
      <svg class="w-0 h-0 absolute">
        <defs>
          <circle id="header-ring-bg" cx="10" cy="10" r="7" fill="none" stroke="#bae6fd" stroke-width="2.5"/>
        </defs>
      </svg>
      <svg width="20" height="20" viewBox="0 0 20 20" class="flex-shrink-0">
        <circle cx="10" cy="10" r="7" fill="none" stroke="#bae6fd" stroke-width="2.5"/>
        <circle cx="10" cy="10" r="7" fill="none" stroke="#0369a1" stroke-width="2.5" stroke-linecap="round"
          stroke-dasharray="43.98" stroke-dashoffset="14.07" transform="rotate(-90 10 10)"/>
      </svg>
      <span class="text-xs font-semibold text-ocean-800">68%</span>
      <span class="text-xs text-ocean-600 hidden sm:inline">complete</span>
    </div>
  </div>

  <div class="flex-1"></div>

  <!-- Team Avatars -->
  <div class="flex items-center gap-3">
    <div class="flex -space-x-2">
      <div class="w-7 h-7 rounded-full bg-ocean-700 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold" title="Alex M.">AM</div>
      <div class="w-7 h-7 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold" title="Sara K.">SK</div>
      <div class="w-7 h-7 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold" title="Jordan P.">JP</div>
      <div class="w-7 h-7 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold" title="Taylor W.">TW</div>
    </div>

    <button onclick="showToast('Task added!')" class="bg-ocean-700 hover:bg-ocean-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
      Add Task
    </button>
  </div>
</header>

<!-- Kanban Board -->
<div class="flex-1 overflow-auto p-5">
  <div class="flex gap-4 h-full min-h-[calc(100vh-76px)]">

    <!-- Column: To Do -->
    <div class="flex-shrink-0 w-72 flex flex-col">
      <div class="flex items-center justify-between mb-3 px-1">
        <div class="flex items-center gap-2">
          <button onclick="toggleColumn(this, 'col-todo')" class="flex items-center gap-2 cursor-pointer hover:opacity-80">
            <svg class="w-4 h-4 text-slate-400 chevron-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            <div class="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
            <h3 class="text-sm font-bold text-slate-700 tracking-tight">To Do</h3>
          </button>
          <span class="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 w-5 h-5 rounded-full flex items-center justify-center">4</span>
        </div>
      </div>
      <div id="col-todo" class="column-body space-y-2.5 flex-1">

        <!-- Card: Design homepage mockup -->
        <div class="task-card bg-white border border-stone-200 rounded-lg p-3 flex gap-2.5 hover:border-ocean-300">
          <div class="drag-handle text-slate-400 mt-1">
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" title="High"></span>
              <span class="text-[10px] font-medium text-rose-600">High</span>
            </div>
            <p class="text-sm font-semibold text-slate-800 mb-2 leading-snug">Design homepage mockup</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span class="text-[10px] text-slate-500">Jan 20</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-ocean-700 flex items-center justify-center text-[8px] text-white font-bold">AM</div>
                <!-- Progress ring 0% -->
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#e7e5e3" stroke-width="3"/>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"
                    stroke-dasharray="75.4" stroke-dashoffset="75.4" transform="rotate(-90 16 16)"/>
                  <text x="16" y="17" text-anchor="middle" dominant-baseline="middle" class="text-[8px] font-bold fill-slate-400">0%</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Card: Write API docs -->
        <div class="task-card bg-white border border-stone-200 rounded-lg p-3 flex gap-2.5 hover:border-ocean-300">
          <div class="drag-handle text-slate-400 mt-1">
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Medium"></span>
              <span class="text-[10px] font-medium text-amber-600">Medium</span>
            </div>
            <p class="text-sm font-semibold text-slate-800 mb-2 leading-snug">Write API docs</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span class="text-[10px] text-slate-500">Jan 22</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-white font-bold">SK</div>
                <!-- Progress ring 15% -->
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#e7e5e3" stroke-width="3"/>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#0369a1" stroke-width="3" stroke-linecap="round"
                    stroke-dasharray="75.4" stroke-dashoffset="64.09" transform="rotate(-90 16 16)"/>
                  <text x="16" y="17" text-anchor="middle" dominant-baseline="middle" class="text-[8px] font-bold fill-ocean-700">15</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Card: Set up CI/CD pipeline -->
        <div class="task-card bg-white border border-stone-200 rounded-lg p-3 flex gap-2.5 hover:border-ocean-300">
          <div class="drag-handle text-slate-400 mt-1">
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" title="Low"></span>
              <span class="text-[10px] font-medium text-slate-500">Low</span>
            </div>
            <p class="text-sm font-semibold text-slate-800 mb-2 leading-snug">Set up CI/CD pipeline</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span class="text-[10px] text-slate-500">Jan 25</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] text-white font-bold">JP</div>
                <!-- Progress ring 0% -->
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#e7e5e3" stroke-width="3"/>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"
                    stroke-dasharray="75.4" stroke-dashoffset="75.4" transform="rotate(-90 16 16)"/>
                  <text x="16" y="17" text-anchor="middle" dominant-baseline="middle" class="text-[8px] font-bold fill-slate-400">0%</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Card: Create style guide -->
        <div class="task-card bg-white border border-stone-200 rounded-lg p-3 flex gap-2.5 hover:border-ocean-300">
          <div class="drag-handle text-slate-400 mt-1">
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Medium"></span>
              <span class="text-[10px] font-medium text-amber-600">Medium</span>
            </div>
            <p class="text-sm font-semibold text-slate-800 mb-2 leading-snug">Create style guide</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span class="text-[10px] text-slate-500">Jan 24</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-[8px] text-white font-bold">TW</div>
                <!-- Progress ring 0% -->
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#e7e5e3" stroke-width="3"/>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"
                    stroke-dasharray="75.4" stroke-dashoffset="75.4" transform="rotate(-90 16 16)"/>
                  <text x="16" y="17" text-anchor="middle" dominant-baseline="middle" class="text-[8px] font-bold fill-slate-400">0%</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Column: In Progress -->
    <div class="flex-shrink-0 w-72 flex flex-col">
      <div class="flex items-center justify-between mb-3 px-1">
        <div class="flex items-center gap-2">
          <button onclick="toggleColumn(this, 'col-progress')" class="flex items-center gap-2 cursor-pointer hover:opacity-80">
            <svg class="w-4 h-4 text-slate-400 chevron-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            <div class="w-2.5 h-2.5 rounded-full bg-ocean-600"></div>
            <h3 class="text-sm font-bold text-slate-700 tracking-tight">In Progress</h3>
          </button>
          <span class="text-[11px] font-semibold text-ocean-700 bg-ocean-50 border border-ocean-200 w-5 h-5 rounded-full flex items-center justify-center">3</span>
        </div>
      </div>
      <div id="col-progress" class="column-body space-y-2.5 flex-1">

        <!-- Card: Build auth system -->
        <div class="task-card bg-white border border-stone-200 rounded-lg p-3 flex gap-2.5 hover:border-ocean-300">
          <div class="drag-handle text-slate-400 mt-1">
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" title="High"></span>
              <span class="text-[10px] font-medium text-rose-600">High</span>
            </div>
            <p class="text-sm font-semibold text-slate-800 mb-2 leading-snug">Build auth system</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span class="text-[10px] text-slate-500">Jan 18</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] text-white font-bold">JP</div>
                <!-- Progress ring 65% -->
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#e7e5e3" stroke-width="3"/>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#0369a1" stroke-width="3" stroke-linecap="round"
                    stroke-dasharray="75.4" stroke-dashoffset="26.39" transform="rotate(-90 16 16)"/>
                  <text x="16" y="17" text-anchor="middle" dominant-baseline="middle" class="text-[8px] font-bold fill-ocean-700">65</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Card: Database migration -->
        <div class="task-card bg-white border border-stone-200 rounded-lg p-3 flex gap-2.5 hover:border-ocean-300">
          <div class="drag-handle text-slate-400 mt-1">
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Medium"></span>
              <span class="text-[10px] font-medium text-amber-600">Medium</span>
            </div>
            <p class="text-sm font-semibold text-slate-800 mb-2 leading-snug">Database migration</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span class="text-[10px] text-slate-500">Jan 21</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-ocean-700 flex items-center justify-center text-[8px] text-white font-bold">AM</div>
                <!-- Progress ring 40% -->
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#e7e5e3" stroke-width="3"/>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#0369a1" stroke-width="3" stroke-linecap="round"
                    stroke-dasharray="75.4" stroke-dashoffset="45.24" transform="rotate(-90 16 16)"/>
                  <text x="16" y="17" text-anchor="middle" dominant-baseline="middle" class="text-[8px] font-bold fill-ocean-700">40</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Card: Integrate payment gateway -->
        <div class="task-card bg-white border border-stone-200 rounded-lg p-3 flex gap-2.5 hover:border-ocean-300">
          <div class="drag-handle text-slate-400 mt-1">
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" title="High"></span>
              <span class="text-[10px] font-medium text-rose-600">High</span>
            </div>
            <p class="text-sm font-semibold text-slate-800 mb-2 leading-snug">Integrate payment gateway</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span class="text-[10px] text-slate-500">Jan 19</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-white font-bold">SK</div>
                <!-- Progress ring 25% -->
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#e7e5e3" stroke-width="3"/>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#0369a1" stroke-width="3" stroke-linecap="round"
                    stroke-dasharray="75.4" stroke-dashoffset="56.55" transform="rotate(-90 16 16)"/>
                  <text x="16" y="17" text-anchor="middle" dominant-baseline="middle" class="text-[8px] font-bold fill-ocean-700">25</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Column: Review -->
    <div class="flex-shrink-0 w-72 flex flex-col">
      <div class="flex items-center justify-between mb-3 px-1">
        <div class="flex items-center gap-2">
          <button onclick="toggleColumn(this, 'col-review')" class="flex items-center gap-2 cursor-pointer hover:opacity-80">
            <svg class="w-4 h-4 text-slate-400 chevron-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            <div class="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <h3 class="text-sm font-bold text-slate-700 tracking-tight">Review</h3>
          </button>
          <span class="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 w-5 h-5 rounded-full flex items-center justify-center">2</span>
        </div>
      </div>
      <div id="col-review" class="column-body space-y-2.5 flex-1">

        <!-- Card: Landing page -->
        <div class="task-card bg-white border border-stone-200 rounded-lg p-3 flex gap-2.5 hover:border-amber-300">
          <div class="drag-handle text-slate-400 mt-1">
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Medium"></span>
              <span class="text-[10px] font-medium text-amber-600">Medium</span>
            </div>
            <p class="text-sm font-semibold text-slate-800 mb-2 leading-snug">Landing page</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span class="text-[10px] text-slate-500">Jan 16</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-[8px] text-white font-bold">TW</div>
                <!-- Progress ring 90% -->
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#e7e5e3" stroke-width="3"/>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"
                    stroke-dasharray="75.4" stroke-dashoffset="7.54" transform="rotate(-90 16 16)"/>
                  <text x="16" y="17" text-anchor="middle" dominant-baseline="middle" class="text-[8px] font-bold fill-amber-600">90</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Card: Unit tests -->
        <div class="task-card bg-white border border-stone-200 rounded-lg p-3 flex gap-2.5 hover:border-amber-300">
          <div class="drag-handle text-slate-400 mt-1">
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" title="High"></span>
              <span class="text-[10px] font-medium text-rose-600">High</span>
            </div>
            <p class="text-sm font-semibold text-slate-800 mb-2 leading-snug">Unit tests</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span class="text-[10px] text-slate-500">Jan 17</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] text-white font-bold">JP</div>
                <!-- Progress ring 85% -->
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#e7e5e3" stroke-width="3"/>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"
                    stroke-dasharray="75.4" stroke-dashoffset="11.31" transform="rotate(-90 16 16)"/>
                  <text x="16" y="17" text-anchor="middle" dominant-baseline="middle" class="text-[8px] font-bold fill-amber-600">85</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Column: Done -->
    <div class="flex-shrink-0 w-72 flex flex-col">
      <div class="flex items-center justify-between mb-3 px-1">
        <div class="flex items-center gap-2">
          <button onclick="toggleColumn(this, 'col-done')" class="flex items-center gap-2 cursor-pointer hover:opacity-80">
            <svg class="w-4 h-4 text-slate-400 chevron-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            <div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <h3 class="text-sm font-bold text-slate-700 tracking-tight">Done</h3>
          </button>
          <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 w-5 h-5 rounded-full flex items-center justify-center">3</span>
        </div>
      </div>
      <div id="col-done" class="column-body space-y-2.5 flex-1">

        <!-- Card: Project kickoff doc -->
        <div class="task-card done-card bg-white border border-stone-200 rounded-lg p-3 flex gap-2.5">
          <div class="drag-handle text-slate-300 mt-1">
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-500 mb-2 leading-snug line-through">Project kickoff doc</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                <span class="text-[10px] text-emerald-500 font-medium">Completed</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-ocean-700 flex items-center justify-center text-[8px] text-white font-bold">AM</div>
                <!-- Progress ring 100% -->
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#d1fae5" stroke-width="3"/>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"
                    stroke-dasharray="75.4" stroke-dashoffset="0" transform="rotate(-90 16 16)"/>
                  <svg x="10" y="10" width="12" height="12" viewBox="0 0 24 24" fill="#10b981"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Card: Wireframes v1 -->
        <div class="task-card done-card bg-white border border-stone-200 rounded-lg p-3 flex gap-2.5">
          <div class="drag-handle text-slate-300 mt-1">
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-500 mb-2 leading-snug line-through">Wireframes v1</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                <span class="text-[10px] text-emerald-500 font-medium">Completed</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-[8px] text-white font-bold">TW</div>
                <!-- Progress ring 100% -->
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#d1fae5" stroke-width="3"/>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"
                    stroke-dasharray="75.4" stroke-dashoffset="0" transform="rotate(-90 16 16)"/>
                  <svg x="10" y="10" width="12" height="12" viewBox="0 0 24 24" fill="#10b981"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Card: Tech stack decision -->
        <div class="task-card done-card bg-white border border-stone-200 rounded-lg p-3 flex gap-2.5">
          <div class="drag-handle text-slate-300 mt-1">
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
            <div class="dot-row"><span class="dot"></span><span class="dot"></span></div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-500 mb-2 leading-snug line-through">Tech stack decision</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                <span class="text-[10px] text-emerald-500 font-medium">Completed</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-white font-bold">SK</div>
                <!-- Progress ring 100% -->
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#d1fae5" stroke-width="3"/>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"
                    stroke-dasharray="75.4" stroke-dashoffset="0" transform="rotate(-90 16 16)"/>
                  <svg x="10" y="10" width="12" height="12" viewBox="0 0 24 24" fill="#10b981"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                </svg>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-5 right-5 z-50 bg-ocean-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold translate-y-16 opacity-0 transition-all duration-300 pointer-events-none border border-ocean-600"></div>

<script>
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('translate-y-16', 'opacity-0');
  setTimeout(function() { t.classList.add('translate-y-16', 'opacity-0'); }, 2200);
}

function toggleColumn(btn, colId) {
  var col = document.getElementById(colId);
  var chevron = btn.querySelector('.chevron-icon');
  col.classList.toggle('collapsed');
  chevron.classList.toggle('rotated');
}
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
