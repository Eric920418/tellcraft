INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '9f08d3b2-0814-4888-ba6b-6e4b26d4facd',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CalendarFlow</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{cream:'#fefaf6',creamDark:'#faf5ed',warmBg:'#fdf8f0',amber50:'#fffbeb',amber100:'#fef3c7',amber600:'#d97706',amber800:'#92400e',stone100:'#f5f5f4',stone600:'#57534e',stone800:'#44403c',indigo50:'#eef2ff',indigo100:'#e0e7ff',indigo600:'#4f46e5',indigo800:'#3730a3',ring:'#f59e0b',weekendBg:'#f9f4ea',density1:'#fefcf7',density2:'#fdf6e9',density3:'#fbf0da',density4:'#f8e8c8'},fontFamily:{display:['Sora','sans-serif'],body:['Work Sans','sans-serif']},boxShadow:{cell:'0 1px 3px rgba(0,0,0,0.04)',cellHover:'0 4px 12px rgba(0,0,0,0.08)',panel:'0 2px 16px rgba(0,0,0,0.06)'}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Work Sans',sans-serif;background:#fefaf6;overflow:hidden;height:100vh}
.cal-cell{min-height:0;transition:all .2s ease;cursor:pointer;position:relative}
.cal-cell:hover{box-shadow:0 4px 12px rgba(0,0,0,0.08);z-index:2;transform:translateY(-1px)}
.cal-cell.is-today{ring:2px;ring-color:#f59e0b;outline:2px solid #f59e0b;outline-offset:-2px;z-index:3}
.event-pill{font-size:11px;padding:2px 8px;border-radius:9999px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;line-height:1.4;transition:opacity .15s}
.event-pill:hover{opacity:.8}
.pill-morning{background:#fef3c7;color:#92400e}
.pill-afternoon{background:#f5f5f4;color:#44403c}
.pill-evening{background:#e0e7ff;color:#3730a3}
.timeline-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;border:2px solid #fefaf6}
.timeline-line{width:2px;background:#e5e2dc;flex-shrink:0}
.density-0{background:#fefaf6}
.density-1{background:#fefcf7}
.density-2{background:#fdf6e9}
.density-3{background:#fbf0da}
.density-4{background:#f8e8c8}
.weekend-col{background:#f9f4ea}
.other-month{opacity:.3}
.view-toggle{transition:all .2s}
.view-toggle.active{background:#f59e0b;color:#fff;box-shadow:0 2px 8px rgba(245,158,11,0.3)}
.side-panel{box-shadow:-4px 0 24px rgba(0,0,0,0.04)}
.fade-in{animation:fadeIn .25s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#e5d5be;border-radius:99px}
</style>
</head>
<body>
<div class="flex flex-col h-screen">
  <!-- Top Bar -->
  <header class="h-14 bg-white/80 backdrop-blur border-b border-amber-100/60 flex items-center justify-between px-6 flex-shrink-0">
    <div class="flex items-center gap-5">
      <!-- Logo -->
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:linear-gradient(135deg,#f59e0b,#4f46e5)">
          <svg width="16" height="16" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <span class="font-display font-bold text-base text-stone-800 tracking-tight">CalendarFlow</span>
      </div>
      <!-- Month Navigation -->
      <div class="flex items-center gap-2">
        <button onclick="navMonth(-1)" class="w-7 h-7 rounded-full hover:bg-amber-50 flex items-center justify-center text-stone-400 hover:text-amber-600 transition">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 id="monthTitle" class="font-display font-semibold text-lg text-stone-800 min-w-[160px] text-center">January 2024</h1>
        <button onclick="navMonth(1)" class="w-7 h-7 rounded-full hover:bg-amber-50 flex items-center justify-center text-stone-400 hover:text-amber-600 transition">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <button onclick="goToday()" class="text-sm font-medium text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition border border-amber-200/60">Today</button>
    </div>
    <div class="flex items-center gap-3">
      <!-- View Toggles -->
      <div class="flex bg-stone-100 rounded-lg p-0.5 gap-0.5">
        <button id="toggleMonth" onclick="setView('month')" class="view-toggle active text-xs font-medium px-3 py-1.5 rounded-md">Month</button>
        <button id="toggleWeek" onclick="setView('week')" class="view-toggle text-xs font-medium px-3 py-1.5 rounded-md text-stone-500 hover:text-stone-700">Week</button>
        <button id="toggleDay" onclick="setView('day')" class="view-toggle text-xs font-medium px-3 py-1.5 rounded-md text-stone-500 hover:text-stone-700">Day</button>
      </div>
      <!-- Add Event -->
      <button class="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition shadow-sm">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
  </header>

  <!-- Main Content: Calendar Grid + Side Panel -->
  <div class="flex flex-1 overflow-hidden">
    <!-- Calendar Grid (85% viewport) -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Day Headers -->
      <div class="grid grid-cols-7 border-b border-amber-100/60 flex-shrink-0">
        <div class="text-center py-2.5 text-xs font-medium text-stone-400 font-display tracking-wide">Mon</div>
        <div class="text-center py-2.5 text-xs font-medium text-stone-400 font-display tracking-wide">Tue</div>
        <div class="text-center py-2.5 text-xs font-medium text-stone-400 font-display tracking-wide">Wed</div>
        <div class="text-center py-2.5 text-xs font-medium text-stone-400 font-display tracking-wide">Thu</div>
        <div class="text-center py-2.5 text-xs font-medium text-stone-400 font-display tracking-wide">Fri</div>
        <div class="text-center py-2.5 text-xs font-medium text-stone-400 font-display tracking-wide bg-[#f9f4ea]">Sat</div>
        <div class="text-center py-2.5 text-xs font-medium text-stone-400 font-display tracking-wide bg-[#f9f4ea]">Sun</div>
      </div>
      <!-- Calendar Grid - 5 rows -->
      <div id="calendarGrid" class="grid grid-cols-7 flex-1 auto-rows-fr">
        <!-- Row 1: Mon 1 - Sun 7 -->
        <div class="cal-cell density-1 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(1)">
          <span class="text-xs font-display font-semibold text-stone-700">1</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">9am Kickoff Meeting</span>
          </div>
        </div>
        <div class="cal-cell density-0 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(2)">
          <span class="text-xs font-display font-semibold text-stone-700">2</span>
        </div>
        <div class="cal-cell density-2 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(3)">
          <span class="text-xs font-display font-semibold text-stone-700">3</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">10am Design Review</span>
            <span class="event-pill pill-evening">7pm Book Club</span>
          </div>
        </div>
        <div class="cal-cell density-1 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(4)">
          <span class="text-xs font-display font-semibold text-stone-700">4</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-afternoon">1pm Lunch w/ Alex</span>
          </div>
        </div>
        <div class="cal-cell density-0 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(5)">
          <span class="text-xs font-display font-semibold text-stone-700">5</span>
        </div>
        <div class="cal-cell density-1 weekend-col border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(6)">
          <span class="text-xs font-display font-semibold text-stone-500">6</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">10am Farmers Market</span>
          </div>
        </div>
        <div class="cal-cell density-0 weekend-col border-b border-amber-100/40 p-1.5" onclick="selectDay(7)">
          <span class="text-xs font-display font-semibold text-stone-500">7</span>
        </div>

        <!-- Row 2: Mon 8 - Sun 14 -->
        <div class="cal-cell density-3 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(8)">
          <span class="text-xs font-display font-semibold text-stone-700">8</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">9am Team Standup</span>
            <span class="event-pill pill-afternoon">2pm Client Call</span>
            <span class="event-pill pill-evening">7pm Dinner</span>
          </div>
        </div>
        <div class="cal-cell density-2 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(9)">
          <span class="text-xs font-display font-semibold text-stone-700">9</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">8am Yoga</span>
            <span class="event-pill pill-afternoon">3pm 1-on-1</span>
          </div>
        </div>
        <div class="cal-cell density-4 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(10)">
          <span class="text-xs font-display font-semibold text-stone-700">10</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">9am Sprint Planning</span>
            <span class="event-pill pill-morning">11am Brunch</span>
            <span class="event-pill pill-afternoon">2pm Workshop</span>
            <span class="event-pill pill-afternoon">4pm Code Review</span>
            <span class="event-pill pill-evening">8pm Jazz Night</span>
          </div>
        </div>
        <div class="cal-cell density-1 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(11)">
          <span class="text-xs font-display font-semibold text-stone-700">11</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-evening">6pm Cooking Class</span>
          </div>
        </div>
        <div class="cal-cell density-2 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(12)">
          <span class="text-xs font-display font-semibold text-stone-700">12</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">10am Presentation</span>
            <span class="event-pill pill-evening">9pm Movie Night</span>
          </div>
        </div>
        <div class="cal-cell density-0 weekend-col border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(13)">
          <span class="text-xs font-display font-semibold text-stone-500">13</span>
        </div>
        <div class="cal-cell density-1 weekend-col border-b border-amber-100/40 p-1.5" onclick="selectDay(14)">
          <span class="text-xs font-display font-semibold text-stone-500">14</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-afternoon">12pm Sunday Brunch</span>
          </div>
        </div>

        <!-- Row 3: Mon 15 - Sun 21 (TODAY = 17) -->
        <div class="cal-cell density-2 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(15)">
          <span class="text-xs font-display font-semibold text-stone-700">15</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">9am All-Hands</span>
            <span class="event-pill pill-afternoon">3pm Dentist</span>
          </div>
        </div>
        <div class="cal-cell density-1 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(16)">
          <span class="text-xs font-display font-semibold text-stone-700">16</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-evening">7pm Board Game</span>
          </div>
        </div>
        <div class="cal-cell is-today density-3 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(17)">
          <div class="flex items-center gap-1">
            <span class="text-xs font-display font-bold text-amber-700 bg-amber-100 w-5 h-5 rounded-full flex items-center justify-center">17</span>
            <span class="text-[9px] text-amber-500 font-medium">TODAY</span>
          </div>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">9am Team Standup</span>
            <span class="event-pill pill-afternoon">2pm Client Review</span>
            <span class="event-pill pill-evening">7pm Dinner w/ Sarah</span>
          </div>
        </div>
        <div class="cal-cell density-0 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(18)">
          <span class="text-xs font-display font-semibold text-stone-700">18</span>
        </div>
        <div class="cal-cell density-1 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(19)">
          <span class="text-xs font-display font-semibold text-stone-700">19</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-afternoon">4pm Happy Hour</span>
          </div>
        </div>
        <div class="cal-cell density-2 weekend-col border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(20)">
          <span class="text-xs font-display font-semibold text-stone-500">20</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">8am Hiking</span>
            <span class="event-pill pill-evening">6pm BBQ Party</span>
          </div>
        </div>
        <div class="cal-cell density-1 weekend-col border-b border-amber-100/40 p-1.5" onclick="selectDay(21)">
          <span class="text-xs font-display font-semibold text-stone-500">21</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">10am Yoga Retreat</span>
          </div>
        </div>

        <!-- Row 4: Mon 22 - Sun 28 -->
        <div class="cal-cell density-1 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(22)">
          <span class="text-xs font-display font-semibold text-stone-700">22</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">9am Sprint Review</span>
          </div>
        </div>
        <div class="cal-cell density-0 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(23)">
          <span class="text-xs font-display font-semibold text-stone-700">23</span>
        </div>
        <div class="cal-cell density-3 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(24)">
          <span class="text-xs font-display font-semibold text-stone-700">24</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">10am Strategy Mtg</span>
            <span class="event-pill pill-afternoon">1pm Team Lunch</span>
            <span class="event-pill pill-evening">8pm Concert</span>
          </div>
        </div>
        <div class="cal-cell density-2 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(25)">
          <span class="text-xs font-display font-semibold text-stone-700">25</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">7am Gym</span>
            <span class="event-pill pill-afternoon">3pm Demo Day</span>
          </div>
        </div>
        <div class="cal-cell density-1 border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(26)">
          <span class="text-xs font-display font-semibold text-stone-700">26</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-evening">7pm Wine Tasting</span>
          </div>
        </div>
        <div class="cal-cell density-3 weekend-col border-b border-r border-amber-100/40 p-1.5" onclick="selectDay(27)">
          <span class="text-xs font-display font-semibold text-stone-500">27</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">9am Flea Market</span>
            <span class="event-pill pill-afternoon">2pm Art Gallery</span>
            <span class="event-pill pill-evening">7pm Family Dinner</span>
          </div>
        </div>
        <div class="cal-cell density-0 weekend-col border-b border-amber-100/40 p-1.5" onclick="selectDay(28)">
          <span class="text-xs font-display font-semibold text-stone-500">28</span>
        </div>

        <!-- Row 5: Mon 29 - Sun 31 + next month -->
        <div class="cal-cell density-2 border-r border-amber-100/40 p-1.5" onclick="selectDay(29)">
          <span class="text-xs font-display font-semibold text-stone-700">29</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-morning">9am Standup</span>
            <span class="event-pill pill-evening">6pm Farewell Party</span>
          </div>
        </div>
        <div class="cal-cell density-1 border-r border-amber-100/40 p-1.5" onclick="selectDay(30)">
          <span class="text-xs font-display font-semibold text-stone-700">30</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-afternoon">2pm Quarter Review</span>
          </div>
        </div>
        <div class="cal-cell density-1 border-r border-amber-100/40 p-1.5" onclick="selectDay(31)">
          <span class="text-xs font-display font-semibold text-stone-700">31</span>
          <div class="mt-1 space-y-0.5">
            <span class="event-pill pill-evening">9pm New Year Eve</span>
          </div>
        </div>
        <div class="cal-cell other-month density-0 border-r border-amber-100/40 p-1.5">
          <span class="text-xs font-display font-semibold text-stone-300">1</span>
        </div>
        <div class="cal-cell other-month density-0 border-r border-amber-100/40 p-1.5">
          <span class="text-xs font-display font-semibold text-stone-300">2</span>
        </div>
        <div class="cal-cell other-month density-0 weekend-col border-r border-amber-100/40 p-1.5">
          <span class="text-xs font-display font-semibold text-stone-300">3</span>
        </div>
        <div class="cal-cell other-month density-0 weekend-col border-amber-100/40 p-1.5">
          <span class="text-xs font-display font-semibold text-stone-300">4</span>
        </div>
      </div>
    </div>

    <!-- Side Panel (260px) -->
    <aside class="w-[260px] bg-white side-panel border-l border-amber-100/60 flex flex-col flex-shrink-0 overflow-y-auto">
      <!-- Today Header -->
      <div class="p-5 border-b border-amber-50">
        <div class="text-xs text-stone-400 font-body font-medium uppercase tracking-wider mb-1">Today</div>
        <div class="font-display font-bold text-3xl text-stone-800">Jan 17</div>
        <div class="font-display text-sm text-stone-400 mt-0.5">Wednesday</div>
        <div class="mt-3 flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
          <span class="text-sm text-stone-500 font-body" id="eventCountLabel">3 events today</span>
        </div>
      </div>

      <!-- Timeline -->
      <div class="p-5 flex-1" id="sideTimeline">
        <div class="text-xs font-display font-semibold text-stone-400 uppercase tracking-wider mb-4">Schedule</div>

        <!-- Morning event -->
        <div class="flex gap-3 mb-1">
          <div class="flex flex-col items-center">
            <div class="timeline-dot bg-amber-400" style="border-color:#fef3c7"></div>
            <div class="timeline-line flex-1 mt-1" style="background:#fef3c7"></div>
          </div>
          <div class="pb-5 flex-1">
            <div class="text-[10px] text-amber-600 font-medium font-display uppercase tracking-wider">Morning</div>
            <div class="bg-amber-50 rounded-xl p-3 mt-1.5 border border-amber-100/60">
              <div class="font-display font-semibold text-sm text-stone-800">Team Standup</div>
              <div class="text-xs text-amber-700 mt-0.5 font-body">9:00 AM - 9:30 AM</div>
              <div class="text-xs text-stone-400 mt-1 font-body">Daily sync with engineering</div>
            </div>
          </div>
        </div>

        <!-- Afternoon event -->
        <div class="flex gap-3 mb-1">
          <div class="flex flex-col items-center">
            <div class="timeline-dot bg-stone-400" style="border-color:#f5f5f4"></div>
            <div class="timeline-line flex-1 mt-1" style="background:#f5f5f4"></div>
          </div>
          <div class="pb-5 flex-1">
            <div class="text-[10px] text-stone-500 font-medium font-display uppercase tracking-wider">Afternoon</div>
            <div class="bg-stone-50 rounded-xl p-3 mt-1.5 border border-stone-100">
              <div class="font-display font-semibold text-sm text-stone-800">Client Review</div>
              <div class="text-xs text-stone-500 mt-0.5 font-body">2:00 PM - 3:00 PM</div>
              <div class="text-xs text-stone-400 mt-1 font-body">Q1 progress presentation</div>
            </div>
          </div>
        </div>

        <!-- Evening event -->
        <div class="flex gap-3">
          <div class="flex flex-col items-center">
            <div class="timeline-dot bg-indigo-500" style="border-color:#e0e7ff"></div>
          </div>
          <div class="flex-1">
            <div class="text-[10px] text-indigo-500 font-medium font-display uppercase tracking-wider">Evening</div>
            <div class="bg-indigo-50 rounded-xl p-3 mt-1.5 border border-indigo-100/60">
              <div class="font-display font-semibold text-sm text-stone-800">Dinner w/ Sarah</div>
              <div class="text-xs text-indigo-600 mt-0.5 font-body">7:00 PM - 9:00 PM</div>
              <div class="text-xs text-stone-400 mt-1 font-body">Italian place downtown</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Color Legend -->
      <div class="p-5 border-t border-amber-50">
        <div class="text-xs font-display font-semibold text-stone-400 uppercase tracking-wider mb-3">Color Legend</div>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <div class="w-4 h-2.5 rounded-full bg-amber-200"></div>
            <span class="text-xs text-stone-500 font-body">Morning (6am-11am)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-2.5 rounded-full bg-stone-200"></div>
            <span class="text-xs text-stone-500 font-body">Afternoon (12pm-5pm)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-2.5 rounded-full bg-indigo-200"></div>
            <span class="text-xs text-stone-500 font-body">Evening (6pm-11pm)</span>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-amber-50/80">
          <div class="text-[10px] text-stone-400 font-body">Cell shading = event density</div>
          <div class="flex items-center gap-1 mt-1.5">
            <div class="w-5 h-3 rounded density-0 border border-amber-100/40"></div>
            <div class="w-5 h-3 rounded density-1 border border-amber-100/40"></div>
            <div class="w-5 h-3 rounded density-2 border border-amber-100/40"></div>
            <div class="w-5 h-3 rounded density-3 border border-amber-100/40"></div>
            <div class="w-5 h-3 rounded density-4 border border-amber-100/40"></div>
            <span class="text-[10px] text-stone-400 ml-1">0 &rarr; 5+</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</div>

<script>
// Event data for each day (for side panel)
const events={
  1:[{t:'9:00 AM',end:'10:00 AM',name:'Kickoff Meeting',desc:'Project kickoff with new team',period:'morning'}],
  3:[{t:'10:00 AM',end:'11:00 AM',name:'Design Review',desc:'Review new dashboard mockups',period:'morning'},{t:'7:00 PM',end:'8:30 PM',name:'Book Club',desc:'Discussing "Atomic Habits"',period:'evening'}],
  4:[{t:'1:00 PM',end:'2:00 PM',name:'Lunch w/ Alex',desc:'Catch up at the new cafe',period:'afternoon'}],
  6:[{t:'10:00 AM',end:'12:00 PM',name:'Farmers Market',desc:'Weekly groceries run',period:'morning'}],
  8:[{t:'9:00 AM',end:'9:30 AM',name:'Team Standup',desc:'Daily engineering sync',period:'morning'},{t:'2:00 PM',end:'3:00 PM',name:'Client Call',desc:'Follow up on proposal',period:'afternoon'},{t:'7:00 PM',end:'9:00 PM',name:'Dinner',desc:'With college friends',period:'evening'}],
  9:[{t:'8:00 AM',end:'9:00 AM',name:'Yoga',desc:'Morning flow class',period:'morning'},{t:'3:00 PM',end:'3:30 PM',name:'1-on-1',desc:'With direct report',period:'afternoon'}],
  10:[{t:'9:00 AM',end:'10:30 AM',name:'Sprint Planning',desc:'Plan sprint 14 items',period:'morning'},{t:'11:00 AM',end:'12:00 PM',name:'Brunch',desc:'Team building brunch',period:'morning'},{t:'2:00 PM',end:'4:00 PM',name:'Workshop',desc:'React performance deep dive',period:'afternoon'},{t:'4:00 PM',end:'5:00 PM',name:'Code Review',desc:'Review PR #432',period:'afternoon'},{t:'8:00 PM',end:'10:00 PM',name:'Jazz Night',desc:'Blue Note downtown',period:'evening'}],
  11:[{t:'6:00 PM',end:'8:00 PM',name:'Cooking Class',desc:'Italian pasta making',period:'evening'}],
  12:[{t:'10:00 AM',end:'11:00 AM',name:'Presentation',desc:'Q4 results to leadership',period:'morning'},{t:'9:00 PM',end:'11:00 PM',name:'Movie Night',desc:'New sci-fi release',period:'evening'}],
  14:[{t:'12:00 PM',end:'2:00 PM',name:'Sunday Brunch',desc:'Family brunch at home',period:'afternoon'}],
  15:[{t:'9:00 AM',end:'10:00 AM',name:'All-Hands',desc:'Company all-hands meeting',period:'morning'},{t:'3:00 PM',end:'4:00 PM',name:'Dentist',desc:'Routine check-up',period:'afternoon'}],
  16:[{t:'7:00 PM',end:'10:00 PM',name:'Board Game',desc:'Game night at Mike\'s',period:'evening'}],
  17:[{t:'9:00 AM',end:'9:30 AM',name:'Team Standup',desc:'Daily sync with engineering',period:'morning'},{t:'2:00 PM',end:'3:00 PM',name:'Client Review',desc:'Q1 progress presentation',period:'afternoon'},{t:'7:00 PM',end:'9:00 PM',name:'Dinner w/ Sarah',desc:'Italian place downtown',period:'evening'}],
  19:[{t:'4:00 PM',end:'6:00 PM',name:'Happy Hour',desc:'Team outing at rooftop bar',period:'afternoon'}],
  20:[{t:'8:00 AM',end:'12:00 PM',name:'Hiking',desc:'Mountain trail with group',period:'morning'},{t:'6:00 PM',end:'9:00 PM',name:'BBQ Party',desc:'Backyard BBQ at Tom\'s',period:'evening'}],
  21:[{t:'10:00 AM',end:'12:00 PM',name:'Yoga Retreat',desc:'Weekend wellness session',period:'morning'}],
  22:[{t:'9:00 AM',end:'10:00 AM',name:'Sprint Review',desc:'Demo sprint results',period:'morning'}],
  24:[{t:'10:00 AM',end:'11:30 AM',name:'Strategy Mtg',desc:'2024 roadmap discussion',period:'morning'},{t:'1:00 PM',end:'2:00 PM',name:'Team Lunch',desc:'New restaurant downtown',period:'afternoon'},{t:'8:00 PM',end:'11:00 PM',name:'Concert',desc:'Live indie band show',period:'evening'}],
  25:[{t:'7:00 AM',end:'8:00 AM',name:'Gym',desc:'Strength training day',period:'morning'},{t:'3:00 PM',end:'5:00 PM',name:'Demo Day',desc:'Product demo to stakeholders',period:'afternoon'}],
  26:[{t:'7:00 PM',end:'9:00 PM',name:'Wine Tasting',desc:'New vineyard event',period:'evening'}],
  27:[{t:'9:00 AM',end:'11:00 AM',name:'Flea Market',desc:'Vintage finds hunt',period:'morning'},{t:'2:00 PM',end:'4:00 PM',name:'Art Gallery',desc:'New exhibition opening',period:'afternoon'},{t:'7:00 PM',end:'9:00 PM',name:'Family Dinner',desc:'Monthly family gathering',period:'evening'}],
  29:[{t:'9:00 AM',end:'9:30 AM',name:'Standup',desc:'Morning sync',period:'morning'},{t:'6:00 PM',end:'8:00 PM',name:'Farewell Party',desc:'Farewell for departing colleague',period:'evening'}],
  30:[{t:'2:00 PM',end:'4:00 PM',name:'Quarter Review',desc:'Q1 financial review',period:'afternoon'}],
  31:[{t:'9:00 PM',end:'12:00 AM',name:'New Year Eve',desc:'Countdown celebration!',period:'evening'}]
};

function selectDay(day){
  const dayEvents=events[day]||[];
  const panel=document.getElementById('sideTimeline');
  const label=document.getElementById('eventCountLabel');
  const count=dayEvents.length;
  label.textContent=count===0?'No events':count===1?'1 event':count+' events';

  // Update header date
  const headerDate=document.querySelector('aside .font-bold.text-3xl');
  headerDate.textContent='Jan '+day;

  // Group by period
  const groups={morning:[],afternoon:[],evening:[]};
  dayEvents.forEach(e=>groups[e.period].push(e));

  const periodConfig={
    morning:{label:'Morning',dotBg:'bg-amber-400',dotBorder:'#fef3c7',lineBg:'#fef3c7',labelColor:'text-amber-600',cardBg:'bg-amber-50',cardBorder:'border-amber-100/60',timeColor:'text-amber-700'},
    afternoon:{label:'Afternoon',dotBg:'bg-stone-400',dotBorder:'#f5f5f4',lineBg:'#f5f5f4',labelColor:'text-stone-500',cardBg:'bg-stone-50',cardBorder:'border-stone-100',timeColor:'text-stone-500'},
    evening:{label:'Evening',dotBg:'bg-indigo-500',dotBorder:'#e0e7ff',lineBg:'#e0e7ff',labelColor:'text-indigo-500',cardBg:'bg-indigo-50',cardBorder:'border-indigo-100/60',timeColor:'text-indigo-600'}
  };

  let html='<div class="text-xs font-display font-semibold text-stone-400 uppercase tracking-wider mb-4">Schedule</div>';

  if(count===0){
    html+='<div class="text-center py-8"><div class="text-stone-300 mb-2"><svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" class="mx-auto"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div class="text-sm text-stone-400 font-body">Free day!</div></div>';
  } else {
    const periods=['morning','afternoon','evening'];
    const activePeriods=periods.filter(p=>groups[p].length>0);
    activePeriods.forEach((p,pi)=>{
      const cfg=periodConfig[p];
      const isLast=pi===activePeriods.length-1;
      groups[p].forEach((ev,ei)=>{
        const showLine=!(isLast && ei===groups[p].length-1);
        html+='<div class="flex gap-3 mb-1">';
        html+='<div class="flex flex-col items-center">';
        html+='<div class="timeline-dot '+cfg.dotBg+'" style="border-color:'+cfg.dotBorder+'"></div>';
        if(showLine) html+='<div class="timeline-line flex-1 mt-1" style="background:'+cfg.lineBg+'"></div>';
        html+='</div>';
        html+='<div class="'+(showLine?'pb-5':'')+' flex-1">';
        if(ei===0) html+='<div class="text-[10px] '+cfg.labelColor+' font-medium font-display uppercase tracking-wider">'+cfg.label+'</div>';
        html+='<div class="'+cfg.cardBg+' rounded-xl p-3 mt-1.5 border '+cfg.cardBorder+'">';
        html+='<div class="font-display font-semibold text-sm text-stone-800">'+ev.name+'</div>';
        html+='<div class="text-xs '+cfg.timeColor+' mt-0.5 font-body">'+ev.t+' - '+ev.end+'</div>';
        html+='<div class="text-xs text-stone-400 mt-1 font-body">'+ev.desc+'</div>';
        html+='</div></div></div>';
      });
    });
  }
  panel.innerHTML=html;
}

// Month navigation
let currentMonth=0; // January 2024
const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
function navMonth(dir){
  currentMonth+=dir;
  const m=((currentMonth%12)+12)%12;
  const y=2024+Math.floor((currentMonth+12*100)/12)-100;
  document.getElementById('monthTitle').textContent=monthNames[m]+' '+y;
}
function goToday(){
  currentMonth=0;
  document.getElementById('monthTitle').textContent='January 2024';
}

// View toggle
function setView(view){
  ['Month','Week','Day'].forEach(v=>{
    const btn=document.getElementById('toggle'+v);
    btn.classList.remove('active');
    btn.classList.add('text-stone-500');
  });
  const active=document.getElementById('toggle'+view.charAt(0).toUpperCase()+view.slice(1));
  active.classList.add('active');
  active.classList.remove('text-stone-500');
}
</script>
</body>
</html>$HTML$,
  3
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
