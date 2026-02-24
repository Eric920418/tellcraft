INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '4dace529-085a-4903-901f-98d4b056d9d3',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SurveyBuild</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{purple:'#7c3aed',purpleLight:'#8b5cf6',purpleSoft:'#a78bfa',lavender:'#f5f3ff',lavenderMid:'#ede9fe',lavenderDeep:'#ddd6fe',mcBlue:'#3b82f6',mcAmber:'#f59e0b',mcGreen:'#10b981',mcPurple:'#8b5cf6',mcTeal:'#14b8a6'},fontFamily:{display:['Quicksand','sans-serif'],body:['Quicksand','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Quicksand',sans-serif;background:#f8f7ff;overflow:hidden;height:100vh}
.icon-strip-item{transition:all .18s ease;cursor:pointer;position:relative}
.icon-strip-item:hover{background:rgba(255,255,255,.15);transform:scale(1.08)}
.icon-strip-item.active{background:rgba(255,255,255,.2)}
.icon-strip-item.active::after{content:'';position:absolute;right:0;top:50%;transform:translateY(-50%);width:3px;height:20px;background:white;border-radius:3px 0 0 3px}
.q-card{transition:all .2s ease;cursor:pointer;border:2px solid transparent}
.q-card:hover{border-color:#ddd6fe;box-shadow:0 2px 12px rgba(124,58,237,.08)}
.q-card.selected{border-color:#7c3aed;background:#faf8ff;box-shadow:0 2px 16px rgba(124,58,237,.12)}
.drag-dots{cursor:grab;opacity:.3;transition:opacity .15s}
.q-card:hover .drag-dots{opacity:.7}
.toggle-track{width:36px;height:20px;border-radius:10px;background:#d4d4d8;transition:background .2s;cursor:pointer;position:relative}
.toggle-track.on{background:#7c3aed}
.toggle-knob{width:16px;height:16px;border-radius:50%;background:white;position:absolute;top:2px;left:2px;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.15)}
.toggle-track.on .toggle-knob{left:18px}
.preview-star{cursor:pointer;transition:color .15s}
.preview-star:hover{transform:scale(1.15)}
.nps-dot{width:32px;height:32px;border-radius:8px;border:2px solid #e5e7eb;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;color:#6b7280}
.nps-dot:hover,.nps-dot.active{background:#7c3aed;border-color:#7c3aed;color:white}
.add-q-btn{transition:all .2s;border:2px dashed #d4d4d8}
.add-q-btn:hover{border-color:#7c3aed;background:#faf8ff;color:#7c3aed}
.resize-bar{width:4px;background:#e5e7eb;cursor:col-resize;transition:background .2s;flex-shrink:0}
.resize-bar:hover{background:#7c3aed}
.progress-fill{transition:width .4s ease}
.fade-in{animation:fadeIn .25s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#c4b5fd;border-radius:99px}
.type-badge{font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px;display:inline-flex;align-items:center;gap:4px}
</style>
</head>
<body>

<!-- Top Bar -->
<header class="h-13 bg-white border-b border-gray-200/80 flex items-center justify-between px-5 flex-shrink-0" style="height:52px">
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-xl bg-purple flex items-center justify-center">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
      </div>
      <span class="font-bold text-gray-900 text-base" style="font-family:'Quicksand',sans-serif">SurveyBuild</span>
    </div>
    <div class="w-px h-6 bg-gray-200 mx-1"></div>
    <span class="text-sm text-gray-600 font-medium">Customer Satisfaction Q1</span>
  </div>
  <div class="flex items-center gap-3">
    <div class="flex bg-lavender rounded-lg p-0.5">
      <button id="tabEdit" onclick="switchTab('edit')" class="px-3.5 py-1.5 text-xs font-bold rounded-md bg-purple text-white transition">Edit</button>
      <button id="tabPreview" onclick="switchTab('preview')" class="px-3.5 py-1.5 text-xs font-bold rounded-md text-purple transition">Preview</button>
    </div>
    <div class="flex items-center gap-1.5 bg-lavender text-purple px-3 py-1.5 rounded-lg">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
      <span class="text-xs font-bold">24 responses</span>
    </div>
    <button class="bg-purple hover:bg-purpleLight text-white text-xs font-bold px-4 py-2 rounded-lg transition flex items-center gap-1.5">
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      Share
    </button>
  </div>
</header>

<div class="flex" style="height:calc(100vh - 52px)">

  <!-- SIGNATURE: Question Type Icon Strip -->
  <div class="flex flex-col items-center py-3 gap-1 flex-shrink-0 bg-gradient-to-b from-purple to-purpleLight" style="width:44px">
    <div class="icon-strip-item active flex items-center justify-center w-9 h-9 rounded-lg" data-type="rating" onclick="selectType('rating')" title="Rating">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#fbbf24"/></svg>
    </div>
    <div class="icon-strip-item flex items-center justify-center w-9 h-9 rounded-lg" data-type="multiple" onclick="selectType('multiple')" title="Multiple Choice">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="6" r="3" fill="#3b82f6" opacity=".3"/><circle cx="12" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><circle cx="4" cy="12" r="3"/><circle cx="20" cy="12" r="3"/></svg>
    </div>
    <div class="icon-strip-item flex items-center justify-center w-9 h-9 rounded-lg" data-type="text" onclick="selectType('text')" title="Text Input">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#10b981" stroke-width="2"><path d="M17 10H3"/><path d="M21 6H3"/><path d="M21 14H3"/><path d="M17 18H3"/></svg>
    </div>
    <div class="icon-strip-item flex items-center justify-center w-9 h-9 rounded-lg" data-type="scale" onclick="selectType('scale')" title="NPS Scale">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#8b5cf6" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="9" y1="21" x2="9" y2="10"/><line x1="14" y1="21" x2="14" y2="6"/><line x1="19" y1="21" x2="19" y2="3"/></svg>
    </div>
    <div class="icon-strip-item flex items-center justify-center w-9 h-9 rounded-lg" data-type="dropdown" onclick="selectType('dropdown')" title="Dropdown">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#14b8a6" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="8 10 12 14 16 10"/></svg>
    </div>
    <div class="flex-1"></div>
    <div class="w-6 h-px bg-white/20 my-1"></div>
    <div class="icon-strip-item flex items-center justify-center w-9 h-9 rounded-lg opacity-60" title="Settings">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.73 12.73l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
    </div>
  </div>

  <!-- Left Panel: Builder (45%) -->
  <div id="builderPanel" class="flex flex-col bg-white overflow-hidden" style="width:45%">
    <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
        <span class="text-sm font-bold text-gray-800">Builder</span>
        <span class="text-xs text-gray-400 font-medium ml-1">4 questions</span>
      </div>
      <button class="text-xs text-purple font-bold hover:text-purpleLight transition flex items-center gap-1">
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Logic
      </button>
    </div>

    <div class="flex-1 overflow-auto p-4 space-y-3" id="questionList">

      <!-- Q1: Rating -->
      <div class="q-card selected rounded-xl p-4 bg-white border-2" id="qcard-0" onclick="selectQuestion(0)">
        <div class="flex items-start gap-2.5">
          <div class="drag-dots flex flex-col gap-0.5 pt-1.5">
            <div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div>
            <div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div>
            <div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-purple bg-lavender px-2 py-0.5 rounded-md">Q1</span>
                <span class="type-badge bg-amber-50 text-amber-600"><svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Rating</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400 font-medium">Required</span>
                <div class="toggle-track on" onclick="event.stopPropagation();toggleRequired(this)"><div class="toggle-knob"></div></div>
              </div>
            </div>
            <input type="text" value="How satisfied are you with our product?" class="w-full text-sm font-semibold text-gray-800 bg-transparent focus:outline-none focus:bg-lavender/50 rounded px-1 py-0.5 -ml-1 transition" oninput="updatePreview()" data-q="0">
            <div class="flex gap-1 mt-2.5">
              <svg class="text-amber-400" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg class="text-amber-400" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg class="text-amber-400" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg class="text-amber-400" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg class="text-gray-200" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Q2: Multiple Choice -->
      <div class="q-card rounded-xl p-4 bg-white border-2" id="qcard-1" onclick="selectQuestion(1)">
        <div class="flex items-start gap-2.5">
          <div class="drag-dots flex flex-col gap-0.5 pt-1.5">
            <div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div>
            <div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div>
            <div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-purple bg-lavender px-2 py-0.5 rounded-md">Q2</span>
                <span class="type-badge bg-blue-50 text-blue-600"><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="5"/></svg>Multiple Choice</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400 font-medium">Required</span>
                <div class="toggle-track on" onclick="event.stopPropagation();toggleRequired(this)"><div class="toggle-knob"></div></div>
              </div>
            </div>
            <input type="text" value="What feature do you use most?" class="w-full text-sm font-semibold text-gray-800 bg-transparent focus:outline-none focus:bg-lavender/50 rounded px-1 py-0.5 -ml-1 transition" oninput="updatePreview()" data-q="1">
            <div class="space-y-1.5 mt-2.5">
              <div class="flex items-center gap-2"><div class="w-3.5 h-3.5 rounded-full border-2 border-purple/40"></div><span class="text-xs text-gray-600">Dashboard Analytics</span></div>
              <div class="flex items-center gap-2"><div class="w-3.5 h-3.5 rounded-full border-2 border-gray-300"></div><span class="text-xs text-gray-600">Report Builder</span></div>
              <div class="flex items-center gap-2"><div class="w-3.5 h-3.5 rounded-full border-2 border-gray-300"></div><span class="text-xs text-gray-600">Team Collaboration</span></div>
              <div class="flex items-center gap-2"><div class="w-3.5 h-3.5 rounded-full border-2 border-gray-300"></div><span class="text-xs text-gray-600">Automation Workflows</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Q3: Text -->
      <div class="q-card rounded-xl p-4 bg-white border-2" id="qcard-2" onclick="selectQuestion(2)">
        <div class="flex items-start gap-2.5">
          <div class="drag-dots flex flex-col gap-0.5 pt-1.5">
            <div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div>
            <div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div>
            <div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-purple bg-lavender px-2 py-0.5 rounded-md">Q3</span>
                <span class="type-badge bg-green-50 text-green-600"><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M17 10H3"/><path d="M21 6H3"/></svg>Text</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400 font-medium">Required</span>
                <div class="toggle-track" onclick="event.stopPropagation();toggleRequired(this)"><div class="toggle-knob"></div></div>
              </div>
            </div>
            <input type="text" value="Any suggestions for improvement?" class="w-full text-sm font-semibold text-gray-800 bg-transparent focus:outline-none focus:bg-lavender/50 rounded px-1 py-0.5 -ml-1 transition" oninput="updatePreview()" data-q="2">
            <div class="mt-2.5 border border-gray-200 rounded-lg p-2 bg-gray-50/50">
              <div class="text-xs text-gray-300 italic">Long text answer...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Q4: NPS Scale -->
      <div class="q-card rounded-xl p-4 bg-white border-2" id="qcard-3" onclick="selectQuestion(3)">
        <div class="flex items-start gap-2.5">
          <div class="drag-dots flex flex-col gap-0.5 pt-1.5">
            <div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div>
            <div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div>
            <div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-purple bg-lavender px-2 py-0.5 rounded-md">Q4</span>
                <span class="type-badge bg-purple/10 text-purple"><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="4" y1="21" x2="4" y2="14"/><line x1="12" y1="21" x2="12" y2="8"/><line x1="20" y1="21" x2="20" y2="3"/></svg>Scale</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400 font-medium">Required</span>
                <div class="toggle-track on" onclick="event.stopPropagation();toggleRequired(this)"><div class="toggle-knob"></div></div>
              </div>
            </div>
            <input type="text" value="How likely to recommend us? (1-10)" class="w-full text-sm font-semibold text-gray-800 bg-transparent focus:outline-none focus:bg-lavender/50 rounded px-1 py-0.5 -ml-1 transition" oninput="updatePreview()" data-q="3">
            <div class="flex gap-1 mt-2.5 flex-wrap">
              <div class="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400 font-bold">1</div>
              <div class="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400 font-bold">2</div>
              <div class="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400 font-bold">3</div>
              <div class="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400 font-bold">4</div>
              <div class="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400 font-bold">5</div>
              <div class="w-6 h-6 rounded border border-purple/40 bg-lavender flex items-center justify-center text-xs text-purple font-bold">6</div>
              <div class="w-6 h-6 rounded border border-purple/40 bg-lavender flex items-center justify-center text-xs text-purple font-bold">7</div>
              <div class="w-6 h-6 rounded border border-purple bg-purple flex items-center justify-center text-xs text-white font-bold">8</div>
              <div class="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400 font-bold">9</div>
              <div class="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400 font-bold">10</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Question Button -->
      <button class="add-q-btn w-full rounded-xl p-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 bg-white" onclick="addQuestion()">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Question
      </button>
    </div>
  </div>

  <!-- Resize Bar -->
  <div class="resize-bar"></div>

  <!-- Right Panel: Live Preview (55%) -->
  <div id="previewPanel" class="flex-1 flex flex-col bg-lavender/40 overflow-hidden">
    <div class="px-5 py-3 border-b border-gray-200/50 flex items-center justify-between bg-white/60 backdrop-blur-sm">
      <div class="flex items-center gap-2">
        <div class="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
        <span class="text-sm font-bold text-gray-700">Live Preview</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-purple hover:border-purple transition bg-white" title="Mobile">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
        </button>
        <button class="w-7 h-7 rounded-md border border-purple bg-lavender flex items-center justify-center text-purple transition" title="Desktop">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-auto p-6">
      <div class="max-w-lg mx-auto">

        <!-- Progress Bar -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-purple" id="progressLabel">Question 1 of 4</span>
            <span class="text-xs font-semibold text-gray-400" id="progressPercent">25%</span>
          </div>
          <div class="w-full bg-lavenderDeep rounded-full h-2">
            <div class="progress-fill bg-gradient-to-r from-purple to-purpleSoft rounded-full h-2" id="progressBar" style="width:25%"></div>
          </div>
        </div>

        <!-- Survey Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          <!-- Survey Header -->
          <div class="bg-gradient-to-r from-purple to-purpleSoft p-5">
            <h2 class="text-white font-bold text-lg">Customer Satisfaction Q1</h2>
            <p class="text-white/70 text-sm mt-1">We value your feedback. This takes about 2 minutes.</p>
          </div>

          <!-- Preview Questions -->
          <div class="p-5 space-y-6" id="previewContent">

            <!-- Preview Q1: Rating -->
            <div class="fade-in" id="preview-q0">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs font-bold text-purple bg-lavender w-6 h-6 rounded-lg flex items-center justify-center">1</span>
                <h3 class="text-sm font-bold text-gray-800" id="prevTitle0">How satisfied are you with our product?</h3>
                <span class="text-red-400 text-sm">*</span>
              </div>
              <div class="flex gap-2 ml-8" id="prevBody0">
                <svg class="preview-star text-amber-400 hover:text-amber-500" width="28" height="28" fill="currentColor" viewBox="0 0 24 24" onclick="rateStar(1)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg class="preview-star text-amber-400 hover:text-amber-500" width="28" height="28" fill="currentColor" viewBox="0 0 24 24" onclick="rateStar(2)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg class="preview-star text-amber-400 hover:text-amber-500" width="28" height="28" fill="currentColor" viewBox="0 0 24 24" onclick="rateStar(3)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg class="preview-star text-amber-400 hover:text-amber-500" width="28" height="28" fill="currentColor" viewBox="0 0 24 24" onclick="rateStar(4)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg class="preview-star text-gray-200 hover:text-amber-300" width="28" height="28" fill="currentColor" viewBox="0 0 24 24" onclick="rateStar(5)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
            </div>

            <!-- Preview Q2: Multiple Choice -->
            <div class="fade-in" id="preview-q1">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs font-bold text-purple bg-lavender w-6 h-6 rounded-lg flex items-center justify-center">2</span>
                <h3 class="text-sm font-bold text-gray-800" id="prevTitle1">What feature do you use most?</h3>
                <span class="text-red-400 text-sm">*</span>
              </div>
              <div class="space-y-2 ml-8" id="prevBody1">
                <label class="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-purple/40 hover:bg-lavender/30 cursor-pointer transition">
                  <div class="w-4 h-4 rounded-full border-2 border-purple flex items-center justify-center"><div class="w-2 h-2 rounded-full bg-purple"></div></div>
                  <span class="text-sm text-gray-700">Dashboard Analytics</span>
                </label>
                <label class="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-purple/40 hover:bg-lavender/30 cursor-pointer transition">
                  <div class="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                  <span class="text-sm text-gray-700">Report Builder</span>
                </label>
                <label class="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-purple/40 hover:bg-lavender/30 cursor-pointer transition">
                  <div class="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                  <span class="text-sm text-gray-700">Team Collaboration</span>
                </label>
                <label class="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-purple/40 hover:bg-lavender/30 cursor-pointer transition">
                  <div class="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                  <span class="text-sm text-gray-700">Automation Workflows</span>
                </label>
              </div>
            </div>

            <!-- Preview Q3: Text -->
            <div class="fade-in" id="preview-q2">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs font-bold text-purple bg-lavender w-6 h-6 rounded-lg flex items-center justify-center">3</span>
                <h3 class="text-sm font-bold text-gray-800" id="prevTitle2">Any suggestions for improvement?</h3>
              </div>
              <div class="ml-8" id="prevBody2">
                <textarea placeholder="Type your answer here..." rows="3" class="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/20 resize-none transition"></textarea>
              </div>
            </div>

            <!-- Preview Q4: NPS Scale -->
            <div class="fade-in" id="preview-q3">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs font-bold text-purple bg-lavender w-6 h-6 rounded-lg flex items-center justify-center">4</span>
                <h3 class="text-sm font-bold text-gray-800" id="prevTitle3">How likely to recommend us? (1-10)</h3>
                <span class="text-red-400 text-sm">*</span>
              </div>
              <div class="ml-8" id="prevBody3">
                <div class="flex gap-1.5 flex-wrap">
                  <div class="nps-dot" onclick="selectNps(this,1)">1</div>
                  <div class="nps-dot" onclick="selectNps(this,2)">2</div>
                  <div class="nps-dot" onclick="selectNps(this,3)">3</div>
                  <div class="nps-dot" onclick="selectNps(this,4)">4</div>
                  <div class="nps-dot" onclick="selectNps(this,5)">5</div>
                  <div class="nps-dot" onclick="selectNps(this,6)">6</div>
                  <div class="nps-dot" onclick="selectNps(this,7)">7</div>
                  <div class="nps-dot active" onclick="selectNps(this,8)">8</div>
                  <div class="nps-dot" onclick="selectNps(this,9)">9</div>
                  <div class="nps-dot" onclick="selectNps(this,10)">10</div>
                </div>
                <div class="flex justify-between mt-1.5 text-xs text-gray-400">
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Next Button -->
          <div class="px-5 pb-5">
            <button class="w-full bg-purple hover:bg-purpleLight text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2" onclick="advanceProgress()">
              Next
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        <!-- Powered by -->
        <div class="text-center mt-4">
          <span class="text-xs text-gray-400">Powered by <span class="font-bold text-purple/60">SurveyBuild</span></span>
        </div>
      </div>
    </div>
  </div>

</div>

<script>
var currentQ=0;
var currentStep=0;
var totalQ=4;

function selectQuestion(idx){
  document.querySelectorAll('.q-card').forEach(function(c){c.classList.remove('selected')});
  var el=document.getElementById('qcard-'+idx);
  if(el)el.classList.add('selected');
  currentQ=idx;
  highlightPreviewQ(idx);
}

function highlightPreviewQ(idx){
  document.querySelectorAll('[id^="preview-q"]').forEach(function(p){
    p.style.opacity='0.4';
    p.style.transform='scale(0.98)';
    p.style.transition='all .2s ease';
  });
  var pe=document.getElementById('preview-q'+idx);
  if(pe){
    pe.style.opacity='1';
    pe.style.transform='scale(1)';
  }
  var step=idx+1;
  document.getElementById('progressLabel').textContent='Question '+step+' of '+totalQ;
  var pct=Math.round((step/totalQ)*100);
  document.getElementById('progressPercent').textContent=pct+'%';
  document.getElementById('progressBar').style.width=pct+'%';
}

function selectType(type){
  document.querySelectorAll('.icon-strip-item').forEach(function(i){i.classList.remove('active')});
  var el=document.querySelector('[data-type="'+type+'"]');
  if(el)el.classList.add('active');
}

function toggleRequired(el){
  el.classList.toggle('on');
}

function updatePreview(){
  var inputs=document.querySelectorAll('[data-q]');
  inputs.forEach(function(inp){
    var qi=inp.getAttribute('data-q');
    var titleEl=document.getElementById('prevTitle'+qi);
    if(titleEl)titleEl.textContent=inp.value;
  });
}

function rateStar(n){
  var stars=document.querySelectorAll('#prevBody0 .preview-star');
  stars.forEach(function(s,i){
    if(i<n){s.classList.remove('text-gray-200');s.classList.add('text-amber-400');}
    else{s.classList.remove('text-amber-400');s.classList.add('text-gray-200');}
  });
}

function selectNps(el,val){
  el.parentElement.querySelectorAll('.nps-dot').forEach(function(d){d.classList.remove('active')});
  el.classList.add('active');
}

function advanceProgress(){
  currentStep=(currentStep+1)%totalQ;
  selectQuestion(currentStep);
  var card=document.getElementById('qcard-'+currentStep);
  if(card)card.scrollIntoView({behavior:'smooth',block:'center'});
}

function addQuestion(){
  totalQ++;
  var list=document.getElementById('questionList');
  var btn=list.querySelector('.add-q-btn');
  var card=document.createElement('div');
  card.className='q-card rounded-xl p-4 bg-white border-2 fade-in';
  card.id='qcard-'+(totalQ-1);
  card.onclick=function(){selectQuestion(totalQ-1)};
  var qi=totalQ;
  card.innerHTML='<div class="flex items-start gap-2.5"><div class="drag-dots flex flex-col gap-0.5 pt-1.5"><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-gray-400"></div><div class="w-1 h-1 rounded-full bg-gray-400"></div></div></div><div class="flex-1 min-w-0"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><span class="text-xs font-bold text-purple bg-lavender px-2 py-0.5 rounded-md">Q'+qi+'</span><span class="type-badge bg-blue-50 text-blue-600">New Question</span></div><div class="flex items-center gap-2"><span class="text-xs text-gray-400 font-medium">Required</span><div class="toggle-track" onclick="event.stopPropagation();toggleRequired(this)"><div class="toggle-knob"></div></div></div></div><input type="text" value="New question..." class="w-full text-sm font-semibold text-gray-800 bg-transparent focus:outline-none focus:bg-lavender/50 rounded px-1 py-0.5 -ml-1 transition" oninput="updatePreview()" data-q="'+(qi-1)+'"></div></div>';
  list.insertBefore(card,btn);

  var preview=document.getElementById('previewContent');
  var pq=document.createElement('div');
  pq.className='fade-in';
  pq.id='preview-q'+(qi-1);
  pq.innerHTML='<div class="flex items-center gap-2 mb-3"><span class="text-xs font-bold text-purple bg-lavender w-6 h-6 rounded-lg flex items-center justify-center">'+qi+'</span><h3 class="text-sm font-bold text-gray-800" id="prevTitle'+(qi-1)+'">New question...</h3></div><div class="ml-8"><textarea placeholder="Type your answer here..." rows="2" class="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:outline-none focus:border-purple resize-none transition"></textarea></div>';
  preview.appendChild(pq);

  selectQuestion(qi-1);
  document.getElementById('progressLabel').textContent='Question '+qi+' of '+totalQ;
  var pct=Math.round((qi/totalQ)*100);
  document.getElementById('progressPercent').textContent=pct+'%';
  document.getElementById('progressBar').style.width=pct+'%';
}

function switchTab(tab){
  var editBtn=document.getElementById('tabEdit');
  var prevBtn=document.getElementById('tabPreview');
  if(tab==='edit'){
    editBtn.className='px-3.5 py-1.5 text-xs font-bold rounded-md bg-purple text-white transition';
    prevBtn.className='px-3.5 py-1.5 text-xs font-bold rounded-md text-purple transition';
    document.getElementById('builderPanel').style.display='flex';
    document.querySelector('.resize-bar').style.display='block';
  }else{
    prevBtn.className='px-3.5 py-1.5 text-xs font-bold rounded-md bg-purple text-white transition';
    editBtn.className='px-3.5 py-1.5 text-xs font-bold rounded-md text-purple transition';
    document.getElementById('builderPanel').style.display='none';
    document.querySelector('.resize-bar').style.display='none';
  }
}

// Initialize: highlight Q1 in preview
highlightPreviewQ(0);
setTimeout(function(){
  document.querySelectorAll('[id^="preview-q"]').forEach(function(p){
    p.style.opacity='1';
    p.style.transform='scale(1)';
  });
},600);
</script>
</body>
</html>$HTML$,
  3
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = EXCLUDED.version,
  updated_at = NOW();
