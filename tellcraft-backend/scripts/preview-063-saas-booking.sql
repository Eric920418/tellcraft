INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '7b0195c0-0876-4ce0-8ca1-0807ffb2a0f0',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BookIt - Smart Scheduling</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{coral:'#e11d48',coralLight:'#fff1f2',coralMid:'#fecdd3',cream:'#fffbeb',creamDark:'#fef3c7',avail:'#16a34a',availLight:'#dcfce7',availBorder:'#86efac',past:'#9ca3af',pastLight:'#f3f4f6',pastBorder:'#d1d5db',surface:'#fefce8'},fontFamily:{sans:['Poppins','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Poppins',sans-serif;background:#fffdf7;overflow:hidden;height:100vh}
.service-pill{transition:all .2s;cursor:pointer;user-select:none}
.service-pill:hover{transform:translateY(-1px);box-shadow:0 2px 8px rgba(225,29,72,.15)}
.service-pill.active{background:#e11d48;color:white;border-color:#e11d48}
.timeline-slot{transition:all .15s;cursor:pointer;position:relative}
.timeline-slot:hover{filter:brightness(0.95);transform:scaleY(1.02)}
.timeline-slot.selected{outline:2px solid #e11d48;outline-offset:1px;z-index:5}
.staff-row{position:relative}
.time-cursor{position:absolute;top:0;bottom:0;width:2px;border-left:2px dashed #e11d48;z-index:20;pointer-events:none;transition:left .3s ease}
.time-cursor::before{content:'';position:absolute;top:-4px;left:-5px;width:10px;height:10px;background:#e11d48;border-radius:50%}
.time-cursor::after{content:'Now';position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:600;color:#e11d48;white-space:nowrap;background:white;padding:1px 6px;border-radius:4px;border:1px solid #fecdd3}
.sidebar-card{animation:slideIn .3s ease}
@keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
.hour-label{font-variant-numeric:tabular-nums}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-thumb{background:#fecdd3;border-radius:99px}
::-webkit-scrollbar-thumb:hover{background:#e11d48}
.booked-block{border-left:3px solid #e11d48}
.available-block{border:1.5px dashed #86efac}
.past-block{border-left:3px solid #d1d5db}
.past-block .block-text{text-decoration:line-through;opacity:.5}
</style>
</head>
<body>
<div class="flex flex-col h-screen">

  <!-- Top Bar -->
  <header class="h-14 bg-white border-b border-amber-100 flex items-center justify-between px-5 flex-shrink-0">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-coral flex items-center justify-center">
        <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <span class="font-bold text-lg text-gray-900 tracking-tight">BookIt</span>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="shiftDate(-1)" class="w-8 h-8 rounded-lg border border-amber-200 bg-cream flex items-center justify-center text-gray-500 hover:bg-creamDark transition cursor-pointer">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button onclick="goToday()" class="px-4 py-1.5 text-sm font-semibold text-coral bg-coralLight rounded-lg hover:bg-coralMid transition cursor-pointer" id="dateLabel">Today, Feb 24</button>
      <button onclick="shiftDate(1)" class="w-8 h-8 rounded-lg border border-amber-200 bg-cream flex items-center justify-center text-gray-500 hover:bg-creamDark transition cursor-pointer">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <div class="ml-3 flex bg-cream rounded-lg border border-amber-200 p-0.5">
        <button onclick="setView('day')" id="viewDay" class="px-3 py-1 text-xs font-semibold rounded-md bg-coral text-white transition cursor-pointer">Day</button>
        <button onclick="setView('week')" id="viewWeek" class="px-3 py-1 text-xs font-semibold rounded-md text-gray-500 hover:text-gray-700 transition cursor-pointer">Week</button>
      </div>
    </div>
    <button onclick="openNewBooking()" class="bg-coral text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-rose-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-coral/20">
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      +New Booking
    </button>
  </header>

  <!-- Service Selector -->
  <div class="h-12 bg-white border-b border-amber-100 flex items-center gap-2 px-5 flex-shrink-0 overflow-x-auto">
    <span class="text-xs text-gray-400 font-medium mr-1 flex-shrink-0">Services:</span>
    <div class="service-pill active rounded-full px-4 py-1.5 text-xs font-semibold border border-coral bg-coral text-white" onclick="toggleService(this,'all')">All</div>
    <div class="service-pill rounded-full px-4 py-1.5 text-xs font-medium border border-amber-200 bg-cream text-gray-700" onclick="toggleService(this,'haircut')">
      <span class="inline-block w-2 h-2 rounded-full bg-coral mr-1.5"></span>Haircut (30m)
    </div>
    <div class="service-pill rounded-full px-4 py-1.5 text-xs font-medium border border-amber-200 bg-cream text-gray-700" onclick="toggleService(this,'color')">
      <span class="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>Color (60m)
    </div>
    <div class="service-pill rounded-full px-4 py-1.5 text-xs font-medium border border-amber-200 bg-cream text-gray-700" onclick="toggleService(this,'styling')">
      <span class="inline-block w-2 h-2 rounded-full bg-violet-500 mr-1.5"></span>Styling (45m)
    </div>
    <div class="service-pill rounded-full px-4 py-1.5 text-xs font-medium border border-amber-200 bg-cream text-gray-700" onclick="toggleService(this,'massage')">
      <span class="inline-block w-2 h-2 rounded-full bg-teal-500 mr-1.5"></span>Massage (90m)
    </div>
  </div>

  <!-- Main Content: Timeline + Sidebar -->
  <div class="flex flex-1 overflow-hidden">

    <!-- Timeline Area -->
    <div class="flex-1 overflow-auto bg-gradient-to-b from-cream/30 to-white" id="timelineArea">
      <div class="min-w-[900px] p-4">

        <!-- Hour Headers -->
        <div class="flex mb-1" style="margin-left:80px">
          <div class="flex-1 grid" style="grid-template-columns: repeat(18, 1fr)">
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100 pl-1">9 AM</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100/50 pl-1">9:30</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100 pl-1">10 AM</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100/50 pl-1">10:30</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100 pl-1">11 AM</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100/50 pl-1">11:30</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100 pl-1">12 PM</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100/50 pl-1">12:30</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100 pl-1">1 PM</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100/50 pl-1">1:30</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100 pl-1">2 PM</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100/50 pl-1">2:30</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100 pl-1">3 PM</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100/50 pl-1">3:30</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100 pl-1">4 PM</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100/50 pl-1">4:30</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100 pl-1">5 PM</div>
            <div class="hour-label text-[10px] text-gray-400 font-medium text-center border-l border-amber-100/50 pl-1">5:30</div>
          </div>
        </div>

        <!-- Staff Rows Container (relative for cursor) -->
        <div class="relative" id="staffContainer">

          <!-- Time Cursor -->
          <div class="time-cursor" id="timeCursor" style="left:calc(80px + 55.56%)"></div>

          <!-- Staff Row: Sarah -->
          <div class="staff-row flex items-stretch mb-2">
            <div class="w-[80px] flex-shrink-0 flex items-center gap-2 pr-2">
              <div class="w-8 h-8 rounded-full bg-coralLight flex items-center justify-center text-xs font-bold text-coral">S</div>
              <div>
                <div class="text-xs font-semibold text-gray-800 leading-tight">Sarah</div>
                <div class="text-[10px] text-gray-400">Senior</div>
              </div>
            </div>
            <div class="flex-1 relative bg-white rounded-xl border border-amber-100 overflow-hidden" style="height:72px">
              <div class="absolute inset-0 grid" style="grid-template-columns: repeat(18, 1fr)">
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
              </div>
              <!-- Past: 9:00-9:30 Haircut - Emma W. -->
              <div class="past-block timeline-slot absolute top-1.5 bottom-1.5 bg-pastLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:0%;width:5.56%" data-booking="sarah-1" onclick="selectBooking(this)">
                <div class="block-text text-[9px] font-medium text-past truncate">Emma</div>
                <div class="block-text text-[8px] text-past truncate">Haircut</div>
              </div>
              <!-- Past: 9:30-10:30 Color - Diana P. -->
              <div class="past-block timeline-slot absolute top-1.5 bottom-1.5 bg-pastLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:5.56%;width:11.11%" data-booking="sarah-2" onclick="selectBooking(this)">
                <div class="block-text text-[10px] font-medium text-past truncate">Diana P.</div>
                <div class="block-text text-[8px] text-past truncate">Color</div>
              </div>
              <!-- Past: 10:30-11:00 Available (past) -->
              <div class="past-block timeline-slot absolute top-2 bottom-2 rounded-lg border-dashed" style="left:16.67%;width:5.56%;border:1.5px dashed #d1d5db">
              </div>
              <!-- Past: 11:00-11:45 Styling - Maya K. -->
              <div class="past-block timeline-slot absolute top-1.5 bottom-1.5 bg-pastLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:22.22%;width:8.33%" data-booking="sarah-3" onclick="selectBooking(this)">
                <div class="block-text text-[10px] font-medium text-past truncate">Maya K.</div>
                <div class="block-text text-[8px] text-past truncate">Styling</div>
              </div>
              <!-- Past: 12:00-1:00 Lunch -->
              <div class="absolute top-2 bottom-2 bg-gray-50 rounded-lg flex items-center justify-center" style="left:33.33%;width:11.11%">
                <span class="text-[9px] text-gray-300 font-medium">Lunch</span>
              </div>
              <!-- Booked: 1:00-2:30 Massage - Olivia R. (CURRENT - overlaps now) -->
              <div class="booked-block timeline-slot absolute top-1.5 bottom-1.5 bg-coralLight rounded-lg px-2 py-1 flex flex-col justify-center shadow-sm" style="left:44.44%;width:16.67%" data-booking="sarah-4" onclick="selectBooking(this)">
                <div class="text-[10px] font-semibold text-coral truncate">Olivia R.</div>
                <div class="text-[8px] text-coral/70 truncate">Massage - 90m</div>
                <div class="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-coral animate-pulse"></div>
              </div>
              <!-- Available: 2:30-3:00 -->
              <div class="available-block timeline-slot absolute top-2 bottom-2 bg-availLight/40 rounded-lg flex items-center justify-center" style="left:61.11%;width:5.56%" data-avail="sarah-a1" onclick="selectAvail(this)">
                <span class="text-[9px] text-avail font-medium">Open</span>
              </div>
              <!-- Booked: 3:00-4:00 Color - Sophia L. -->
              <div class="booked-block timeline-slot absolute top-1.5 bottom-1.5 bg-coralLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:66.67%;width:11.11%" data-booking="sarah-5" onclick="selectBooking(this)">
                <div class="text-[10px] font-semibold text-coral truncate">Sophia L.</div>
                <div class="text-[8px] text-coral/70 truncate">Color - 60m</div>
              </div>
              <!-- Available: 4:00-5:00 -->
              <div class="available-block timeline-slot absolute top-2 bottom-2 bg-availLight/40 rounded-lg flex items-center justify-center" style="left:77.78%;width:11.11%" data-avail="sarah-a2" onclick="selectAvail(this)">
                <span class="text-[9px] text-avail font-medium">Open</span>
              </div>
              <!-- Booked: 5:00-5:30 Haircut - Zoe T. -->
              <div class="booked-block timeline-slot absolute top-1.5 bottom-1.5 bg-coralLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:88.89%;width:5.56%" data-booking="sarah-6" onclick="selectBooking(this)">
                <div class="text-[9px] font-semibold text-coral truncate">Zoe T.</div>
                <div class="text-[8px] text-coral/70 truncate">Haircut</div>
              </div>
            </div>
          </div>

          <!-- Staff Row: Mike -->
          <div class="staff-row flex items-stretch mb-2">
            <div class="w-[80px] flex-shrink-0 flex items-center gap-2 pr-2">
              <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600">M</div>
              <div>
                <div class="text-xs font-semibold text-gray-800 leading-tight">Mike</div>
                <div class="text-[10px] text-gray-400">Stylist</div>
              </div>
            </div>
            <div class="flex-1 relative bg-white rounded-xl border border-amber-100 overflow-hidden" style="height:72px">
              <div class="absolute inset-0 grid" style="grid-template-columns: repeat(18, 1fr)">
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
              </div>
              <!-- Past: 9:00-10:00 Color - Jake M. -->
              <div class="past-block timeline-slot absolute top-1.5 bottom-1.5 bg-pastLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:0%;width:11.11%" data-booking="mike-1" onclick="selectBooking(this)">
                <div class="block-text text-[10px] font-medium text-past truncate">Jake M.</div>
                <div class="block-text text-[8px] text-past truncate">Color</div>
              </div>
              <!-- Past: 10:00-10:30 Haircut - Tom R. -->
              <div class="past-block timeline-slot absolute top-1.5 bottom-1.5 bg-pastLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:11.11%;width:5.56%" data-booking="mike-2" onclick="selectBooking(this)">
                <div class="block-text text-[9px] font-medium text-past truncate">Tom</div>
                <div class="block-text text-[8px] text-past truncate">Haircut</div>
              </div>
              <!-- Past: 10:30-12:00 Massage - Noah S. -->
              <div class="past-block timeline-slot absolute top-1.5 bottom-1.5 bg-pastLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:16.67%;width:16.67%" data-booking="mike-3" onclick="selectBooking(this)">
                <div class="block-text text-[10px] font-medium text-past truncate">Noah S.</div>
                <div class="block-text text-[8px] text-past truncate">Massage - 90m</div>
              </div>
              <!-- Past: 12:00-1:00 Lunch -->
              <div class="absolute top-2 bottom-2 bg-gray-50 rounded-lg flex items-center justify-center" style="left:33.33%;width:11.11%">
                <span class="text-[9px] text-gray-300 font-medium">Lunch</span>
              </div>
              <!-- Booked: 1:00-1:45 Styling - Liam B. -->
              <div class="booked-block timeline-slot absolute top-1.5 bottom-1.5 bg-coralLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:44.44%;width:8.33%" data-booking="mike-4" onclick="selectBooking(this)">
                <div class="text-[10px] font-semibold text-coral truncate">Liam B.</div>
                <div class="text-[8px] text-coral/70 truncate">Styling - 45m</div>
              </div>
              <!-- Booked: 2:00-2:30 Haircut - Ryan D. (current) -->
              <div class="booked-block timeline-slot absolute top-1.5 bottom-1.5 bg-coralLight rounded-lg px-2 py-1 flex flex-col justify-center shadow-sm" style="left:55.56%;width:5.56%" data-booking="mike-5" onclick="selectBooking(this)">
                <div class="text-[9px] font-semibold text-coral truncate">Ryan D.</div>
                <div class="text-[8px] text-coral/70 truncate">Haircut</div>
                <div class="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-coral animate-pulse"></div>
              </div>
              <!-- Available: 2:30-3:30 -->
              <div class="available-block timeline-slot absolute top-2 bottom-2 bg-availLight/40 rounded-lg flex items-center justify-center" style="left:61.11%;width:11.11%" data-avail="mike-a1" onclick="selectAvail(this)">
                <span class="text-[9px] text-avail font-medium">Open - 60m</span>
              </div>
              <!-- Booked: 3:30-5:00 Massage - Ethan K. -->
              <div class="booked-block timeline-slot absolute top-1.5 bottom-1.5 bg-coralLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:72.22%;width:16.67%" data-booking="mike-6" onclick="selectBooking(this)">
                <div class="text-[10px] font-semibold text-coral truncate">Ethan K.</div>
                <div class="text-[8px] text-coral/70 truncate">Massage - 90m</div>
              </div>
              <!-- Available: 5:00-6:00 -->
              <div class="available-block timeline-slot absolute top-2 bottom-2 bg-availLight/40 rounded-lg flex items-center justify-center" style="left:88.89%;width:11.11%" data-avail="mike-a2" onclick="selectAvail(this)">
                <span class="text-[9px] text-avail font-medium">Open</span>
              </div>
            </div>
          </div>

          <!-- Staff Row: Lisa -->
          <div class="staff-row flex items-stretch mb-2">
            <div class="w-[80px] flex-shrink-0 flex items-center gap-2 pr-2">
              <div class="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center text-xs font-bold text-violet-600">L</div>
              <div>
                <div class="text-xs font-semibold text-gray-800 leading-tight">Lisa</div>
                <div class="text-[10px] text-gray-400">Junior</div>
              </div>
            </div>
            <div class="flex-1 relative bg-white rounded-xl border border-amber-100 overflow-hidden" style="height:72px">
              <div class="absolute inset-0 grid" style="grid-template-columns: repeat(18, 1fr)">
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
              </div>
              <!-- Past: 9:00-9:45 Styling - Anna L. -->
              <div class="past-block timeline-slot absolute top-1.5 bottom-1.5 bg-pastLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:0%;width:8.33%" data-booking="lisa-1" onclick="selectBooking(this)">
                <div class="block-text text-[10px] font-medium text-past truncate">Anna L.</div>
                <div class="block-text text-[8px] text-past truncate">Styling</div>
              </div>
              <!-- Past: 10:00-10:30 Available (past) -->
              <div class="past-block timeline-slot absolute top-2 bottom-2 rounded-lg" style="left:11.11%;width:5.56%;border:1.5px dashed #d1d5db">
              </div>
              <!-- Past: 10:30-11:30 Color - Bella F. -->
              <div class="past-block timeline-slot absolute top-1.5 bottom-1.5 bg-pastLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:16.67%;width:11.11%" data-booking="lisa-2" onclick="selectBooking(this)">
                <div class="block-text text-[10px] font-medium text-past truncate">Bella F.</div>
                <div class="block-text text-[8px] text-past truncate">Color - 60m</div>
              </div>
              <!-- Past: 11:30-12:00 Haircut - Chloe G. -->
              <div class="past-block timeline-slot absolute top-1.5 bottom-1.5 bg-pastLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:27.78%;width:5.56%" data-booking="lisa-3" onclick="selectBooking(this)">
                <div class="block-text text-[9px] font-medium text-past truncate">Chloe</div>
                <div class="block-text text-[8px] text-past truncate">Haircut</div>
              </div>
              <!-- Past: 12:00-1:00 Lunch -->
              <div class="absolute top-2 bottom-2 bg-gray-50 rounded-lg flex items-center justify-center" style="left:33.33%;width:11.11%">
                <span class="text-[9px] text-gray-300 font-medium">Lunch</span>
              </div>
              <!-- Booked: 1:00-2:00 Color - Mia H. -->
              <div class="booked-block timeline-slot absolute top-1.5 bottom-1.5 bg-coralLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:44.44%;width:11.11%" data-booking="lisa-4" onclick="selectBooking(this)">
                <div class="text-[10px] font-semibold text-coral truncate">Mia H.</div>
                <div class="text-[8px] text-coral/70 truncate">Color - 60m</div>
              </div>
              <!-- Available: 2:00-2:30 -->
              <div class="available-block timeline-slot absolute top-2 bottom-2 bg-availLight/40 rounded-lg flex items-center justify-center" style="left:55.56%;width:5.56%" data-avail="lisa-a1" onclick="selectAvail(this)">
                <span class="text-[9px] text-avail font-medium">Open</span>
              </div>
              <!-- Booked: 2:30-3:15 Styling - Ivy N. (current) -->
              <div class="booked-block timeline-slot absolute top-1.5 bottom-1.5 bg-coralLight rounded-lg px-2 py-1 flex flex-col justify-center shadow-sm" style="left:61.11%;width:8.33%" data-booking="lisa-5" onclick="selectBooking(this)">
                <div class="text-[10px] font-semibold text-coral truncate">Ivy N.</div>
                <div class="text-[8px] text-coral/70 truncate">Styling - 45m</div>
                <div class="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-coral animate-pulse"></div>
              </div>
              <!-- Available: 3:30-4:00 -->
              <div class="available-block timeline-slot absolute top-2 bottom-2 bg-availLight/40 rounded-lg flex items-center justify-center" style="left:72.22%;width:5.56%" data-avail="lisa-a2" onclick="selectAvail(this)">
                <span class="text-[9px] text-avail font-medium">Open</span>
              </div>
              <!-- Booked: 4:00-5:30 Massage - Ruby W. -->
              <div class="booked-block timeline-slot absolute top-1.5 bottom-1.5 bg-coralLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:77.78%;width:16.67%" data-booking="lisa-6" onclick="selectBooking(this)">
                <div class="text-[10px] font-semibold text-coral truncate">Ruby W.</div>
                <div class="text-[8px] text-coral/70 truncate">Massage - 90m</div>
              </div>
              <!-- Available: 5:30-6:00 -->
              <div class="available-block timeline-slot absolute top-2 bottom-2 bg-availLight/40 rounded-lg flex items-center justify-center" style="left:94.44%;width:5.56%" data-avail="lisa-a3" onclick="selectAvail(this)">
                <span class="text-[9px] text-avail font-medium">Open</span>
              </div>
            </div>
          </div>

          <!-- Staff Row: Alex -->
          <div class="staff-row flex items-stretch mb-2">
            <div class="w-[80px] flex-shrink-0 flex items-center gap-2 pr-2">
              <div class="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-xs font-bold text-emerald-600">A</div>
              <div>
                <div class="text-xs font-semibold text-gray-800 leading-tight">Alex</div>
                <div class="text-[10px] text-gray-400">Colorist</div>
              </div>
            </div>
            <div class="flex-1 relative bg-white rounded-xl border border-amber-100 overflow-hidden" style="height:72px">
              <div class="absolute inset-0 grid" style="grid-template-columns: repeat(18, 1fr)">
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
                <div class="border-l border-amber-50"></div><div class="border-l border-amber-50/50"></div>
              </div>
              <!-- Past: 9:00-10:00 Color - Grace P. -->
              <div class="past-block timeline-slot absolute top-1.5 bottom-1.5 bg-pastLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:0%;width:11.11%" data-booking="alex-1" onclick="selectBooking(this)">
                <div class="block-text text-[10px] font-medium text-past truncate">Grace P.</div>
                <div class="block-text text-[8px] text-past truncate">Color - 60m</div>
              </div>
              <!-- Past: 10:00-11:30 Massage - Hana Q. -->
              <div class="past-block timeline-slot absolute top-1.5 bottom-1.5 bg-pastLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:11.11%;width:16.67%" data-booking="alex-2" onclick="selectBooking(this)">
                <div class="block-text text-[10px] font-medium text-past truncate">Hana Q.</div>
                <div class="block-text text-[8px] text-past truncate">Massage - 90m</div>
              </div>
              <!-- Past: 11:30-12:00 Available (past) -->
              <div class="past-block timeline-slot absolute top-2 bottom-2 rounded-lg" style="left:27.78%;width:5.56%;border:1.5px dashed #d1d5db">
              </div>
              <!-- Past: 12:00-1:00 Lunch -->
              <div class="absolute top-2 bottom-2 bg-gray-50 rounded-lg flex items-center justify-center" style="left:33.33%;width:11.11%">
                <span class="text-[9px] text-gray-300 font-medium">Lunch</span>
              </div>
              <!-- Booked: 1:00-1:30 Haircut - Leo J. -->
              <div class="booked-block timeline-slot absolute top-1.5 bottom-1.5 bg-coralLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:44.44%;width:5.56%" data-booking="alex-3" onclick="selectBooking(this)">
                <div class="text-[9px] font-semibold text-coral truncate">Leo J.</div>
                <div class="text-[8px] text-coral/70 truncate">Haircut</div>
              </div>
              <!-- Available: 1:30-2:30 -->
              <div class="available-block timeline-slot absolute top-2 bottom-2 bg-availLight/40 rounded-lg flex items-center justify-center" style="left:50%;width:11.11%" data-avail="alex-a1" onclick="selectAvail(this)">
                <span class="text-[9px] text-avail font-medium">Open - 60m</span>
              </div>
              <!-- Booked: 2:30-3:30 Color - Nora C. (current) -->
              <div class="booked-block timeline-slot absolute top-1.5 bottom-1.5 bg-coralLight rounded-lg px-2 py-1 flex flex-col justify-center shadow-sm" style="left:61.11%;width:11.11%" data-booking="alex-4" onclick="selectBooking(this)">
                <div class="text-[10px] font-semibold text-coral truncate">Nora C.</div>
                <div class="text-[8px] text-coral/70 truncate">Color - 60m</div>
                <div class="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-coral animate-pulse"></div>
              </div>
              <!-- Available: 3:30-4:30 -->
              <div class="available-block timeline-slot absolute top-2 bottom-2 bg-availLight/40 rounded-lg flex items-center justify-center" style="left:72.22%;width:11.11%" data-avail="alex-a2" onclick="selectAvail(this)">
                <span class="text-[9px] text-avail font-medium">Open - 60m</span>
              </div>
              <!-- Booked: 4:30-5:15 Styling - Quinn E. -->
              <div class="booked-block timeline-slot absolute top-1.5 bottom-1.5 bg-coralLight rounded-lg px-2 py-1 flex flex-col justify-center" style="left:83.33%;width:8.33%" data-booking="alex-5" onclick="selectBooking(this)">
                <div class="text-[10px] font-semibold text-coral truncate">Quinn E.</div>
                <div class="text-[8px] text-coral/70 truncate">Styling - 45m</div>
              </div>
              <!-- Available: 5:15-6:00 -->
              <div class="available-block timeline-slot absolute top-2 bottom-2 bg-availLight/40 rounded-lg flex items-center justify-center" style="left:91.67%;width:8.33%" data-avail="alex-a3" onclick="selectAvail(this)">
                <span class="text-[9px] text-avail font-medium">Open</span>
              </div>
            </div>
          </div>

        </div><!-- /staffContainer -->

        <!-- Legend -->
        <div class="flex items-center gap-5 mt-3 ml-[80px]">
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-sm bg-coralLight border-l-2 border-coral"></div>
            <span class="text-[10px] text-gray-500">Booked</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-sm bg-availLight/60 border border-dashed border-availBorder"></div>
            <span class="text-[10px] text-gray-500">Available</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-sm bg-pastLight border-l-2 border-pastBorder"></div>
            <span class="text-[10px] text-gray-500">Past</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-0.5 border-t-2 border-dashed border-coral"></div>
            <span class="text-[10px] text-gray-500">Now</span>
          </div>
        </div>

      </div>
    </div>

    <!-- Right Sidebar: Booking Details -->
    <div class="w-[240px] bg-white border-l border-amber-100 flex flex-col flex-shrink-0 overflow-auto" id="detailSidebar">
      <!-- Default state -->
      <div id="sidebarDefault" class="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div class="w-12 h-12 rounded-full bg-cream flex items-center justify-center mb-3">
          <svg width="20" height="20" fill="none" stroke="#e11d48" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <p class="text-xs text-gray-400 leading-relaxed">Click a booking to see details, or click an open slot to create a new one.</p>
      </div>

      <!-- Booking detail (hidden by default) -->
      <div id="sidebarDetail" class="hidden flex-1 flex flex-col">
        <div class="p-4 border-b border-amber-100">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" id="detailStatus">In Progress</span>
            <button onclick="closeSidebar()" class="text-gray-300 hover:text-gray-500 cursor-pointer">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <h3 class="font-bold text-gray-900 text-sm mb-0.5" id="detailClient">Olivia R.</h3>
          <p class="text-[10px] text-gray-400" id="detailPhone">+1 (555) 234-5678</p>
        </div>
        <div class="p-4 space-y-3 flex-1">
          <div>
            <div class="text-[10px] text-gray-400 mb-0.5">Service</div>
            <div class="text-xs font-semibold text-gray-800" id="detailService">Massage</div>
          </div>
          <div class="flex gap-3">
            <div>
              <div class="text-[10px] text-gray-400 mb-0.5">Time</div>
              <div class="text-xs font-semibold text-gray-800" id="detailTime">1:00 - 2:30 PM</div>
            </div>
            <div>
              <div class="text-[10px] text-gray-400 mb-0.5">Duration</div>
              <div class="text-xs font-semibold text-gray-800" id="detailDuration">90 min</div>
            </div>
          </div>
          <div>
            <div class="text-[10px] text-gray-400 mb-0.5">Staff</div>
            <div class="text-xs font-semibold text-gray-800" id="detailStaff">Sarah</div>
          </div>
          <div>
            <div class="text-[10px] text-gray-400 mb-0.5">Price</div>
            <div class="text-lg font-bold text-coral" id="detailPrice">$120</div>
          </div>
          <div class="pt-2 border-t border-amber-100">
            <div class="text-[10px] text-gray-400 mb-1.5">Notes</div>
            <div class="text-[11px] text-gray-600 bg-cream rounded-lg p-2.5 leading-relaxed" id="detailNotes">Prefers medium pressure. Allergic to lavender oil.</div>
          </div>
        </div>
        <div class="p-3 border-t border-amber-100 flex gap-2">
          <button class="flex-1 text-[11px] font-semibold text-coral border border-coral rounded-lg py-2 hover:bg-coralLight transition cursor-pointer">Reschedule</button>
          <button class="flex-1 text-[11px] font-semibold text-white bg-coral rounded-lg py-2 hover:bg-rose-700 transition cursor-pointer">Check In</button>
        </div>
      </div>
    </div>

  </div>

  <!-- Bottom Stats -->
  <div class="h-10 bg-white border-t border-amber-100 flex items-center justify-center gap-6 px-5 flex-shrink-0">
    <div class="flex items-center gap-1.5">
      <div class="w-2 h-2 rounded-full bg-coral"></div>
      <span class="text-[11px] text-gray-600"><span class="font-semibold text-gray-800">8</span> bookings</span>
    </div>
    <div class="w-px h-4 bg-amber-200"></div>
    <div class="flex items-center gap-1.5">
      <div class="w-2 h-2 rounded-full bg-avail"></div>
      <span class="text-[11px] text-gray-600"><span class="font-semibold text-gray-800">2</span> available</span>
    </div>
    <div class="w-px h-4 bg-amber-200"></div>
    <div class="flex items-center gap-1.5">
      <svg width="12" height="12" fill="none" stroke="#e11d48" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
      <span class="text-[11px] text-gray-600"><span class="font-bold text-coral">$1,240</span> revenue</span>
    </div>
    <div class="w-px h-4 bg-amber-200"></div>
    <div class="flex items-center gap-1.5">
      <svg width="12" height="12" fill="none" stroke="#9ca3af" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span class="text-[11px] text-gray-400">Updated just now</span>
    </div>
  </div>

</div>

<script>
// Booking data for sidebar
const bookings={
  'sarah-1':{client:'Emma W.',phone:'+1 (555) 111-2233',service:'Haircut',time:'9:00 - 9:30 AM',duration:'30 min',staff:'Sarah',price:'$35',status:'completed',statusColor:'bg-gray-100 text-gray-500',notes:'Regular client. Prefers layers.'},
  'sarah-2':{client:'Diana P.',phone:'+1 (555) 222-3344',service:'Color',time:'9:30 - 10:30 AM',duration:'60 min',staff:'Sarah',price:'$95',status:'completed',statusColor:'bg-gray-100 text-gray-500',notes:'Balayage touch-up, warm tones.'},
  'sarah-3':{client:'Maya K.',phone:'+1 (555) 333-4455',service:'Styling',time:'11:00 - 11:45 AM',duration:'45 min',staff:'Sarah',price:'$65',status:'completed',statusColor:'bg-gray-100 text-gray-500',notes:'Updo for evening event.'},
  'sarah-4':{client:'Olivia R.',phone:'+1 (555) 234-5678',service:'Massage',time:'1:00 - 2:30 PM',duration:'90 min',staff:'Sarah',price:'$120',status:'In Progress',statusColor:'bg-coralLight text-coral',notes:'Prefers medium pressure. Allergic to lavender oil.'},
  'sarah-5':{client:'Sophia L.',phone:'+1 (555) 444-5566',service:'Color',time:'3:00 - 4:00 PM',duration:'60 min',staff:'Sarah',price:'$95',status:'Confirmed',statusColor:'bg-availLight text-avail',notes:'Full highlights, cool blonde.'},
  'sarah-6':{client:'Zoe T.',phone:'+1 (555) 555-6677',service:'Haircut',time:'5:00 - 5:30 PM',duration:'30 min',staff:'Sarah',price:'$35',status:'Confirmed',statusColor:'bg-availLight text-avail',notes:'Trim only, no wash needed.'},
  'mike-1':{client:'Jake M.',phone:'+1 (555) 666-7788',service:'Color',time:'9:00 - 10:00 AM',duration:'60 min',staff:'Mike',price:'$95',status:'completed',statusColor:'bg-gray-100 text-gray-500',notes:'Grey coverage. Natural brown.'},
  'mike-2':{client:'Tom R.',phone:'+1 (555) 777-8899',service:'Haircut',time:'10:00 - 10:30 AM',duration:'30 min',staff:'Mike',price:'$35',status:'completed',statusColor:'bg-gray-100 text-gray-500',notes:'Fade, medium length top.'},
  'mike-3':{client:'Noah S.',phone:'+1 (555) 888-9900',service:'Massage',time:'10:30 - 12:00 PM',duration:'90 min',staff:'Mike',price:'$120',status:'completed',statusColor:'bg-gray-100 text-gray-500',notes:'Deep tissue. Focus on shoulders.'},
  'mike-4':{client:'Liam B.',phone:'+1 (555) 999-0011',service:'Styling',time:'1:00 - 1:45 PM',duration:'45 min',staff:'Mike',price:'$65',status:'Confirmed',statusColor:'bg-availLight text-avail',notes:'Blowout for photoshoot.'},
  'mike-5':{client:'Ryan D.',phone:'+1 (555) 101-2233',service:'Haircut',time:'2:00 - 2:30 PM',duration:'30 min',staff:'Mike',price:'$35',status:'In Progress',statusColor:'bg-coralLight text-coral',notes:'Buzz cut, #3 guard.'},
  'mike-6':{client:'Ethan K.',phone:'+1 (555) 112-3344',service:'Massage',time:'3:30 - 5:00 PM',duration:'90 min',staff:'Mike',price:'$120',status:'Confirmed',statusColor:'bg-availLight text-avail',notes:'First visit. Consultation needed.'},
  'lisa-1':{client:'Anna L.',phone:'+1 (555) 123-4455',service:'Styling',time:'9:00 - 9:45 AM',duration:'45 min',staff:'Lisa',price:'$65',status:'completed',statusColor:'bg-gray-100 text-gray-500',notes:'Beach waves, heat protectant.'},
  'lisa-2':{client:'Bella F.',phone:'+1 (555) 134-5566',service:'Color',time:'10:30 - 11:30 AM',duration:'60 min',staff:'Lisa',price:'$95',status:'completed',statusColor:'bg-gray-100 text-gray-500',notes:'Ombre, dark roots to light ends.'},
  'lisa-3':{client:'Chloe G.',phone:'+1 (555) 145-6677',service:'Haircut',time:'11:30 - 12:00 PM',duration:'30 min',staff:'Lisa',price:'$35',status:'completed',statusColor:'bg-gray-100 text-gray-500',notes:'Bob cut. Keep length above shoulders.'},
  'lisa-4':{client:'Mia H.',phone:'+1 (555) 156-7788',service:'Color',time:'1:00 - 2:00 PM',duration:'60 min',staff:'Lisa',price:'$95',status:'Confirmed',statusColor:'bg-availLight text-avail',notes:'Vivid red, full head.'},
  'lisa-5':{client:'Ivy N.',phone:'+1 (555) 167-8899',service:'Styling',time:'2:30 - 3:15 PM',duration:'45 min',staff:'Lisa',price:'$65',status:'In Progress',statusColor:'bg-coralLight text-coral',notes:'Half-up half-down for dinner.'},
  'lisa-6':{client:'Ruby W.',phone:'+1 (555) 178-9900',service:'Massage',time:'4:00 - 5:30 PM',duration:'90 min',staff:'Lisa',price:'$120',status:'Confirmed',statusColor:'bg-availLight text-avail',notes:'Relaxation massage. Light pressure.'},
  'alex-1':{client:'Grace P.',phone:'+1 (555) 189-0011',service:'Color',time:'9:00 - 10:00 AM',duration:'60 min',staff:'Alex',price:'$95',status:'completed',statusColor:'bg-gray-100 text-gray-500',notes:'Platinum blonde touchup.'},
  'alex-2':{client:'Hana Q.',phone:'+1 (555) 190-1122',service:'Massage',time:'10:00 - 11:30 AM',duration:'90 min',staff:'Alex',price:'$120',status:'completed',statusColor:'bg-gray-100 text-gray-500',notes:'Sports massage. Athletic recovery.'},
  'alex-3':{client:'Leo J.',phone:'+1 (555) 201-2233',service:'Haircut',time:'1:00 - 1:30 PM',duration:'30 min',staff:'Alex',price:'$35',status:'Confirmed',statusColor:'bg-availLight text-avail',notes:'Classic taper. Side part.'},
  'alex-4':{client:'Nora C.',phone:'+1 (555) 212-3344',service:'Color',time:'2:30 - 3:30 PM',duration:'60 min',staff:'Alex',price:'$95',status:'In Progress',statusColor:'bg-coralLight text-coral',notes:'Pastel pink highlights.'},
  'alex-5':{client:'Quinn E.',phone:'+1 (555) 223-4455',service:'Styling',time:'4:30 - 5:15 PM',duration:'45 min',staff:'Alex',price:'$65',status:'Confirmed',statusColor:'bg-availLight text-avail',notes:'Sleek straight blowout.'}
};

// Select a booked slot
function selectBooking(el){
  document.querySelectorAll('.timeline-slot').forEach(s=>s.classList.remove('selected'));
  el.classList.add('selected');
  const id=el.dataset.booking;
  const b=bookings[id];
  if(!b)return;
  document.getElementById('sidebarDefault').classList.add('hidden');
  const det=document.getElementById('sidebarDetail');
  det.classList.remove('hidden');
  det.querySelector('.sidebar-card')?.remove();
  document.getElementById('detailClient').textContent=b.client;
  document.getElementById('detailPhone').textContent=b.phone;
  document.getElementById('detailService').textContent=b.service;
  document.getElementById('detailTime').textContent=b.time;
  document.getElementById('detailDuration').textContent=b.duration;
  document.getElementById('detailStaff').textContent=b.staff;
  document.getElementById('detailPrice').textContent=b.price;
  document.getElementById('detailNotes').textContent=b.notes;
  const st=document.getElementById('detailStatus');
  st.textContent=b.status;
  st.className='text-[10px] font-semibold px-2 py-0.5 rounded-full '+b.statusColor;
}

// Select available slot
function selectAvail(el){
  document.querySelectorAll('.timeline-slot').forEach(s=>s.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('sidebarDefault').classList.add('hidden');
  const det=document.getElementById('sidebarDetail');
  det.classList.remove('hidden');
  document.getElementById('detailClient').textContent='New Booking';
  document.getElementById('detailPhone').textContent='Click +New Booking';
  document.getElementById('detailService').textContent='Select a service';
  document.getElementById('detailTime').textContent='Available';
  document.getElementById('detailDuration').textContent='-';
  document.getElementById('detailStaff').textContent='-';
  document.getElementById('detailPrice').textContent='-';
  document.getElementById('detailNotes').textContent='This slot is open for booking.';
  const st=document.getElementById('detailStatus');
  st.textContent='Available';
  st.className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-availLight text-avail';
}

function closeSidebar(){
  document.querySelectorAll('.timeline-slot').forEach(s=>s.classList.remove('selected'));
  document.getElementById('sidebarDetail').classList.add('hidden');
  document.getElementById('sidebarDefault').classList.remove('hidden');
}

// Service pill toggle
function toggleService(el,type){
  document.querySelectorAll('.service-pill').forEach(p=>{
    p.classList.remove('active');
    p.style.background='';p.style.color='';p.style.borderColor='';
  });
  el.classList.add('active');
}

// View toggle
function setView(v){
  const d=document.getElementById('viewDay'),w=document.getElementById('viewWeek');
  if(v==='day'){d.className='px-3 py-1 text-xs font-semibold rounded-md bg-coral text-white transition cursor-pointer';w.className='px-3 py-1 text-xs font-semibold rounded-md text-gray-500 hover:text-gray-700 transition cursor-pointer';}
  else{w.className='px-3 py-1 text-xs font-semibold rounded-md bg-coral text-white transition cursor-pointer';d.className='px-3 py-1 text-xs font-semibold rounded-md text-gray-500 hover:text-gray-700 transition cursor-pointer';}
}

// Date navigation (visual only)
let dayOffset=0;
const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function updateDateLabel(){
  const d=new Date(2026,1,24);
  d.setDate(d.getDate()+dayOffset);
  const label=dayOffset===0?'Today, ':days[d.getDay()]+', ';
  document.getElementById('dateLabel').textContent=label+months[d.getMonth()]+' '+d.getDate();
}
function shiftDate(dir){dayOffset+=dir;updateDateLabel();}
function goToday(){dayOffset=0;updateDateLabel();}

function openNewBooking(){
  alert('New booking form would open here');
}

// Animate time cursor position (simulated at 2:30 PM = 55.56% of 9-to-6 range)
// 2:30 PM = 5.5 hours from 9 AM. 9 hours total. 5.5/9 = 61.11%
// But visually we show half-hours: 18 slots. 2:30 = slot 11 of 18 = 61.11%
function updateCursor(){
  const cursor=document.getElementById('timeCursor');
  // Simulate: 2:30 PM position
  const pct=61.11;
  cursor.style.left='calc(80px + '+pct+'%)';
}

// Auto-select Sarah's current booking on load
window.addEventListener('DOMContentLoaded',function(){
  updateCursor();
  const defaultSlot=document.querySelector('[data-booking="sarah-4"]');
  if(defaultSlot) selectBooking(defaultSlot);
});
</script>
</body>
</html>$HTML$,
  3
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
