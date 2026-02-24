INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '10e0a380-e2f8-423a-b69c-539be60572ae',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TaskFlow</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Karla:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{orange:'#ea580c',orangeLight:'#fed7aa',orangeMuted:'#fdba74',paper:'#fdf8f3',paperDark:'#f5ebe0',charcoal:'#292524',charcoalMid:'#57534e',charcoalLight:'#a8a29e'},fontFamily:{karla:['Karla','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Karla',sans-serif;background:#fdf8f3;overflow:hidden;height:100vh}

/* Checkbox */
.task-check{width:22px;height:22px;border:2px solid #d6d3d1;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .3s cubic-bezier(.4,0,.2,1)}
.task-check.done{border-color:#ea580c;background:#ea580c;transform:scale(1.1)}
.task-check.done svg{opacity:1;stroke-dashoffset:0}
.task-check svg{opacity:0;stroke-dashoffset:20;transition:all .35s cubic-bezier(.4,0,.2,1)}

/* Strikethrough */
.task-title{position:relative;display:inline;transition:color .3s}
.task-title.struck{color:#a8a29e}
.task-title.struck::after{content:'';position:absolute;left:0;top:50%;width:100%;height:1.5px;background:#a8a29e;animation:strikeAnim .3s ease forwards}
@keyframes strikeAnim{from{width:0}to{width:100%}}

/* Focus mode */
.focusable{transition:filter .4s ease,opacity .4s ease}
body.focus-active .focusable{filter:blur(3px);opacity:.25}
body.focus-active .focusable.focus-target{filter:none;opacity:1;border-color:#ea580c;box-shadow:0 0 0 2px rgba(234,88,12,.15)}

/* Priority tags */
.pri-1{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
.pri-2{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa}
.pri-3{background:#f5f5f4;color:#78716c;border:1px solid #e7e5e3}

/* Filter tab */
.filter-tab{cursor:pointer;transition:all .2s}
.filter-tab.active{color:#ea580c;border-bottom:2px solid #ea580c}

/* Completion arc animation */
@keyframes arcFill{from{stroke-dashoffset:157}to{stroke-dashoffset:var(--arc-target)}}

/* Scrollbar */
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:#d6d3d1;border-radius:99px}
::-webkit-scrollbar-track{background:transparent}

/* Subtask check */
.sub-check{width:16px;height:16px;border:1.5px solid #d6d3d1;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .25s}
.sub-check.done{border-color:#ea580c;background:#ea580c}
.sub-check.done svg{opacity:1}
.sub-check svg{opacity:0;transition:opacity .2s}
</style>
</head>
<body class="font-karla text-charcoal">

<!-- Top Bar -->
<header class="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-5 flex-shrink-0">
  <div class="flex items-center gap-4">
    <!-- Logo -->
    <div class="flex items-center gap-2">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="#ea580c"/>
        <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="font-bold text-lg tracking-tight">Task<span class="text-orange">Flow</span></span>
    </div>

    <!-- Completion Arc -->
    <div class="flex items-center gap-2 ml-4">
      <svg width="36" height="22" viewBox="0 0 36 22">
        <path d="M 3 20 A 15 15 0 0 1 33 20" fill="none" stroke="#e7e5e3" stroke-width="3" stroke-linecap="round"/>
        <path id="arcFill" d="M 3 20 A 15 15 0 0 1 33 20" fill="none" stroke="#ea580c" stroke-width="3" stroke-linecap="round"
              stroke-dasharray="47.1" stroke-dashoffset="47.1" style="--arc-target:18.84;animation:arcFill 1.2s ease-out .5s forwards"/>
      </svg>
      <span class="text-xs text-charcoalMid font-medium">6/10</span>
    </div>
  </div>

  <div class="flex items-center gap-1">
    <!-- Filter Tabs -->
    <button class="filter-tab active text-sm font-medium px-3 py-1" onclick="setFilter(this)">Today</button>
    <button class="filter-tab text-sm font-medium px-3 py-1 text-charcoalLight" onclick="setFilter(this)">This Week</button>
    <button class="filter-tab text-sm font-medium px-3 py-1 text-charcoalLight" onclick="setFilter(this)">All</button>

    <!-- Add button -->
    <button class="ml-4 w-8 h-8 bg-orange text-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-orange/90 transition">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </button>
  </div>
</header>

<!-- Split Panel -->
<div class="flex" style="height:calc(100vh - 56px)">

  <!-- Left Panel: Task List (40%) -->
  <div id="leftPanel" class="focusable w-2/5 border-r border-stone-200 bg-white flex flex-col overflow-hidden">
    <!-- Section header -->
    <div class="px-5 pt-4 pb-3 border-b border-stone-100">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-charcoal uppercase tracking-wide">Today</h2>
        <span class="text-xs text-charcoalLight">6 tasks</span>
      </div>
    </div>

    <!-- Task List -->
    <div class="flex-1 overflow-y-auto" id="taskList">
      <!-- Pending tasks -->
      <div class="task-item focusable px-5 py-3.5 border-b border-stone-100 flex items-center gap-3 cursor-pointer" data-task="0" onclick="selectTask(this)" ondblclick="toggleFocus(this)">
        <div class="task-check" onclick="event.stopPropagation();toggleDone(this.parentElement)">
          <svg width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="task-title text-sm font-medium text-charcoal">Redesign landing page hero section</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="pri-1 text-[10px] font-semibold px-1.5 py-0.5 rounded">P1</span>
            <span class="text-[11px] text-charcoalLight">Due 9:00 AM</span>
          </div>
        </div>
      </div>

      <div class="task-item focusable px-5 py-3.5 border-b border-stone-100 flex items-center gap-3 cursor-pointer" data-task="1" onclick="selectTask(this)" ondblclick="toggleFocus(this)">
        <div class="task-check" onclick="event.stopPropagation();toggleDone(this.parentElement)">
          <svg width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="task-title text-sm font-medium text-charcoal">Write API documentation for v2 endpoints</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="pri-1 text-[10px] font-semibold px-1.5 py-0.5 rounded">P1</span>
            <span class="text-[11px] text-charcoalLight">Due 11:00 AM</span>
          </div>
        </div>
      </div>

      <div class="task-item focusable px-5 py-3.5 border-b border-stone-100 flex items-center gap-3 cursor-pointer bg-orange/[0.04]" data-task="2" onclick="selectTask(this)" ondblclick="toggleFocus(this)" id="activeTask">
        <div class="task-check" onclick="event.stopPropagation();toggleDone(this.parentElement)">
          <svg width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="task-title text-sm font-medium text-charcoal">Review pull requests from design team</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="pri-2 text-[10px] font-semibold px-1.5 py-0.5 rounded">P2</span>
            <span class="text-[11px] text-charcoalLight">Due 2:00 PM</span>
          </div>
        </div>
      </div>

      <div class="task-item focusable px-5 py-3.5 border-b border-stone-100 flex items-center gap-3 cursor-pointer" data-task="3" onclick="selectTask(this)" ondblclick="toggleFocus(this)">
        <div class="task-check" onclick="event.stopPropagation();toggleDone(this.parentElement)">
          <svg width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="task-title text-sm font-medium text-charcoal">Prepare slide deck for Friday standup</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="pri-2 text-[10px] font-semibold px-1.5 py-0.5 rounded">P2</span>
            <span class="text-[11px] text-charcoalLight">Due 4:00 PM</span>
          </div>
        </div>
      </div>

      <div class="task-item focusable px-5 py-3.5 border-b border-stone-100 flex items-center gap-3 cursor-pointer" data-task="4" onclick="selectTask(this)" ondblclick="toggleFocus(this)">
        <div class="task-check" onclick="event.stopPropagation();toggleDone(this.parentElement)">
          <svg width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="task-title text-sm font-medium text-charcoal">Update user onboarding flow copy</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="pri-3 text-[10px] font-semibold px-1.5 py-0.5 rounded">P3</span>
            <span class="text-[11px] text-charcoalLight">Due 5:30 PM</span>
          </div>
        </div>
      </div>

      <div class="task-item focusable px-5 py-3.5 border-b border-stone-100 flex items-center gap-3 cursor-pointer" data-task="5" onclick="selectTask(this)" ondblclick="toggleFocus(this)">
        <div class="task-check" onclick="event.stopPropagation();toggleDone(this.parentElement)">
          <svg width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="task-title text-sm font-medium text-charcoal">Set up staging environment for QA</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="pri-3 text-[10px] font-semibold px-1.5 py-0.5 rounded">P3</span>
            <span class="text-[11px] text-charcoalLight">Due 6:00 PM</span>
          </div>
        </div>
      </div>

      <!-- Completed section -->
      <div class="px-5 pt-4 pb-2">
        <span class="text-[11px] font-semibold text-charcoalLight uppercase tracking-wider">Completed</span>
      </div>

      <div class="task-item focusable px-5 py-3 border-b border-stone-100 flex items-center gap-3 cursor-pointer opacity-50" data-task="6" onclick="selectTask(this)" ondblclick="toggleFocus(this)">
        <div class="task-check done" onclick="event.stopPropagation();toggleDone(this.parentElement)">
          <svg width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <span class="task-title struck text-sm font-medium">Morning standup sync with team</span>
          <div class="flex items-center gap-2 mt-1">
            <span class="pri-3 text-[10px] font-semibold px-1.5 py-0.5 rounded">P3</span>
            <span class="text-[11px] text-charcoalLight">9:00 AM</span>
          </div>
        </div>
      </div>

      <div class="task-item focusable px-5 py-3 border-b border-stone-100 flex items-center gap-3 cursor-pointer opacity-50" data-task="7" onclick="selectTask(this)" ondblclick="toggleFocus(this)">
        <div class="task-check done" onclick="event.stopPropagation();toggleDone(this.parentElement)">
          <svg width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <span class="task-title struck text-sm font-medium">Fix auth token refresh bug</span>
          <div class="flex items-center gap-2 mt-1">
            <span class="pri-1 text-[10px] font-semibold px-1.5 py-0.5 rounded">P1</span>
            <span class="text-[11px] text-charcoalLight">8:30 AM</span>
          </div>
        </div>
      </div>

      <div class="task-item focusable px-5 py-3 border-b border-stone-100 flex items-center gap-3 cursor-pointer opacity-50" data-task="8" onclick="selectTask(this)" ondblclick="toggleFocus(this)">
        <div class="task-check done" onclick="event.stopPropagation();toggleDone(this.parentElement)">
          <svg width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <span class="task-title struck text-sm font-medium">Reply to client feedback email</span>
          <div class="flex items-center gap-2 mt-1">
            <span class="pri-2 text-[10px] font-semibold px-1.5 py-0.5 rounded">P2</span>
            <span class="text-[11px] text-charcoalLight">10:15 AM</span>
          </div>
        </div>
      </div>

      <div class="task-item focusable px-5 py-3 border-b border-stone-100 flex items-center gap-3 cursor-pointer opacity-50" data-task="9" onclick="selectTask(this)" ondblclick="toggleFocus(this)">
        <div class="task-check done" onclick="event.stopPropagation();toggleDone(this.parentElement)">
          <svg width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <span class="task-title struck text-sm font-medium">Deploy hotfix to production</span>
          <div class="flex items-center gap-2 mt-1">
            <span class="pri-1 text-[10px] font-semibold px-1.5 py-0.5 rounded">P1</span>
            <span class="text-[11px] text-charcoalLight">11:45 AM</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Right Panel: Task Detail (60%) -->
  <div id="rightPanel" class="focusable w-3/5 bg-paper flex flex-col overflow-y-auto">
    <div class="flex-1 px-8 py-6" id="detailContent">
      <!-- Task Title -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-charcoal leading-tight mb-2" id="detailTitle">Review pull requests from design team</h1>
        <div class="flex items-center gap-3">
          <span class="pri-2 text-xs font-semibold px-2 py-0.5 rounded">P2</span>
          <span class="text-xs text-charcoalLight">Due today at 2:00 PM</span>
        </div>
      </div>

      <!-- Description -->
      <div class="mb-6">
        <label class="text-xs font-semibold text-charcoalMid uppercase tracking-wider mb-2 block">Description</label>
        <div class="text-sm text-charcoalMid leading-relaxed bg-white border border-stone-200 rounded-lg p-4">
          Go through the 3 open PRs from the design team. Check the component library updates, verify the new color tokens match the design system, and ensure responsive breakpoints are correct. Leave inline comments on any issues.
        </div>
      </div>

      <!-- Subtasks -->
      <div class="mb-6">
        <label class="text-xs font-semibold text-charcoalMid uppercase tracking-wider mb-3 block">Subtasks</label>
        <div class="space-y-2">
          <div class="flex items-center gap-3 bg-white border border-stone-200 rounded-lg px-4 py-3 cursor-pointer" onclick="toggleSub(this)">
            <div class="sub-check done">
              <svg width="10" height="10" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span class="text-sm text-charcoalLight line-through">Review color token PR #247</span>
          </div>
          <div class="flex items-center gap-3 bg-white border border-stone-200 rounded-lg px-4 py-3 cursor-pointer" onclick="toggleSub(this)">
            <div class="sub-check">
              <svg width="10" height="10" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span class="text-sm text-charcoal">Review component library PR #251</span>
          </div>
          <div class="flex items-center gap-3 bg-white border border-stone-200 rounded-lg px-4 py-3 cursor-pointer" onclick="toggleSub(this)">
            <div class="sub-check">
              <svg width="10" height="10" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span class="text-sm text-charcoal">Check responsive breakpoints on PR #253</span>
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div class="mb-6">
        <label class="text-xs font-semibold text-charcoalMid uppercase tracking-wider mb-2 block">Tags</label>
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium bg-orange/10 text-orange border border-orange/20 px-2.5 py-1 rounded-full">code-review</span>
          <span class="text-xs font-medium bg-stone-100 text-charcoalMid border border-stone-200 px-2.5 py-1 rounded-full">design-system</span>
          <span class="text-xs font-medium bg-stone-100 text-charcoalMid border border-stone-200 px-2.5 py-1 rounded-full">frontend</span>
        </div>
      </div>

      <!-- Meta row -->
      <div class="flex items-center gap-6 mb-6">
        <div>
          <label class="text-xs font-semibold text-charcoalMid uppercase tracking-wider mb-1.5 block">Due Date</label>
          <div class="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2">
            <svg width="14" height="14" fill="none" stroke="#a8a29e" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span class="text-sm text-charcoal">Today, 2:00 PM</span>
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold text-charcoalMid uppercase tracking-wider mb-1.5 block">Priority</label>
          <div class="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg px-3 py-2">
            <div class="w-2.5 h-2.5 rounded-full bg-orange"></div>
            <span class="text-sm text-charcoal">Medium</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="mb-8">
        <label class="text-xs font-semibold text-charcoalMid uppercase tracking-wider mb-2 block">Notes</label>
        <div class="text-sm text-charcoalMid leading-relaxed bg-white border border-stone-200 rounded-lg p-4 min-h-[80px]">
          Sarah mentioned the button component has a new variant. Double-check it works with both light and dark themes. Also ask about the icon set update timeline.
        </div>
      </div>

      <!-- Mark Complete Button -->
      <button class="bg-orange text-white font-semibold px-6 py-3 rounded-lg cursor-pointer hover:bg-orange/90 transition flex items-center gap-2" onclick="completeActive()">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        Mark Complete
      </button>
    </div>
  </div>
</div>

<script>
// Task data for detail panel
const tasks=[
  {title:'Redesign landing page hero section',pri:'P1',priClass:'pri-1',due:'Today, 9:00 AM',priLabel:'High',desc:'Overhaul the hero section with new brand illustrations, updated copy from marketing, and the animated gradient background. Must be mobile-first and pass Lighthouse accessibility audit.',subs:['Gather new brand assets from design drive','Update hero copy with marketing-approved text','Implement animated gradient background'],tags:['design','frontend','brand'],notes:'Check with Maya about the illustration delivery date. The gradient should use the new warm orange palette, not the old blue.'},
  {title:'Write API documentation for v2 endpoints',pri:'P1',priClass:'pri-1',due:'Today, 11:00 AM',priLabel:'High',desc:'Document all 12 new v2 REST endpoints including request/response schemas, authentication requirements, rate limits, and error codes. Use the OpenAPI 3.0 spec format.',subs:['Document authentication endpoints','Document resource CRUD endpoints','Add rate limit and error code tables'],tags:['documentation','api','backend'],notes:'Use the same format as v1 docs. James has the Postman collection with example responses.'},
  {title:'Review pull requests from design team',pri:'P2',priClass:'pri-2',due:'Today, 2:00 PM',priLabel:'Medium',desc:'Go through the 3 open PRs from the design team. Check the component library updates, verify the new color tokens match the design system, and ensure responsive breakpoints are correct. Leave inline comments on any issues.',subs:['Review color token PR #247','Review component library PR #251','Check responsive breakpoints on PR #253'],tags:['code-review','design-system','frontend'],notes:'Sarah mentioned the button component has a new variant. Double-check it works with both light and dark themes. Also ask about the icon set update timeline.'},
  {title:'Prepare slide deck for Friday standup',pri:'P2',priClass:'pri-2',due:'Today, 4:00 PM',priLabel:'Medium',desc:'Create a 10-slide presentation covering this sprint achievements, blockers, and next sprint priorities. Include the burndown chart and velocity metrics.',subs:['Pull metrics from Jira dashboard','Draft achievement highlights','Add blocker summary and action items'],tags:['presentation','team','sprint'],notes:'Use the company slide template. Tom wants to see the customer feedback stats included this time.'},
  {title:'Update user onboarding flow copy',pri:'P3',priClass:'pri-3',due:'Today, 5:30 PM',priLabel:'Low',desc:'Revise the 5-step onboarding wizard text based on the latest UX research findings. Focus on reducing cognitive load and improving completion rates.',subs:['Rewrite welcome screen copy','Simplify step 3 instructions','Add contextual help tooltips'],tags:['ux-writing','onboarding'],notes:'The UX research report is in Notion. Key finding: users drop off at step 3 because the instructions are too technical.'},
  {title:'Set up staging environment for QA',pri:'P3',priClass:'pri-3',due:'Today, 6:00 PM',priLabel:'Low',desc:'Provision a fresh staging server, deploy the latest release candidate, seed the test database with fixtures, and share access credentials with the QA team.',subs:['Provision staging server','Deploy RC build','Seed test data and share credentials'],tags:['devops','qa','infrastructure'],notes:'Use the new Docker compose setup. QA needs access by end of day for the regression test cycle starting tomorrow.'},
  {title:'Morning standup sync with team',pri:'P3',priClass:'pri-3',due:'9:00 AM',priLabel:'Low',desc:'Daily 15-minute sync. Share blockers, align on priorities.',subs:[],tags:['meeting'],notes:''},
  {title:'Fix auth token refresh bug',pri:'P1',priClass:'pri-1',due:'8:30 AM',priLabel:'High',desc:'The refresh token was not rotating properly causing session drops after 30 minutes.',subs:['Identify root cause','Apply fix','Write regression test'],tags:['bugfix','auth'],notes:'Root cause was a race condition in the token rotation middleware.'},
  {title:'Reply to client feedback email',pri:'P2',priClass:'pri-2',due:'10:15 AM',priLabel:'Medium',desc:'Addressed the 3 concerns raised in the feedback and proposed next steps.',subs:['Draft response','Get approval from PM'],tags:['client','communication'],notes:'Client was happy with the turnaround.'},
  {title:'Deploy hotfix to production',pri:'P1',priClass:'pri-1',due:'11:45 AM',priLabel:'High',desc:'Emergency deploy to fix the auth token issue affecting all users.',subs:['Run pre-deploy checks','Deploy to production','Monitor error rates'],tags:['deployment','hotfix'],notes:'Rollback plan documented in the incident channel.'}
];

let selectedIdx=2;

function selectTask(el){
  // Remove previous selection highlight
  document.querySelectorAll('.task-item').forEach(t=>{
    t.classList.remove('bg-orange/[0.04]');
    t.removeAttribute('id');
  });
  el.classList.add('bg-orange/[0.04]');
  el.id='activeTask';
  const idx=parseInt(el.dataset.task);
  selectedIdx=idx;
  renderDetail(idx);
}

function renderDetail(idx){
  const t=tasks[idx];
  const subsHtml=t.subs.map((s,i)=>{
    const done=i===0&&idx===2;
    return `<div class="flex items-center gap-3 bg-white border border-stone-200 rounded-lg px-4 py-3 cursor-pointer" onclick="toggleSub(this)">
      <div class="sub-check${done?' done':''}"><svg width="10" height="10" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
      <span class="text-sm ${done?'text-charcoalLight line-through':'text-charcoal'}">${s}</span>
    </div>`;
  }).join('');
  const tagsHtml=t.tags.map((tg,i)=>{
    const isFirst=i===0;
    return `<span class="text-xs font-medium ${isFirst?'bg-orange/10 text-orange border-orange/20':'bg-stone-100 text-charcoalMid border-stone-200'} border px-2.5 py-1 rounded-full">${tg}</span>`;
  }).join('');
  document.getElementById('detailContent').innerHTML=`
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-charcoal leading-tight mb-2">${t.title}</h1>
      <div class="flex items-center gap-3">
        <span class="${t.priClass} text-xs font-semibold px-2 py-0.5 rounded">${t.pri}</span>
        <span class="text-xs text-charcoalLight">Due ${t.due}</span>
      </div>
    </div>
    <div class="mb-6">
      <label class="text-xs font-semibold text-charcoalMid uppercase tracking-wider mb-2 block">Description</label>
      <div class="text-sm text-charcoalMid leading-relaxed bg-white border border-stone-200 rounded-lg p-4">${t.desc}</div>
    </div>
    ${t.subs.length?`<div class="mb-6">
      <label class="text-xs font-semibold text-charcoalMid uppercase tracking-wider mb-3 block">Subtasks</label>
      <div class="space-y-2">${subsHtml}</div>
    </div>`:''}
    <div class="mb-6">
      <label class="text-xs font-semibold text-charcoalMid uppercase tracking-wider mb-2 block">Tags</label>
      <div class="flex items-center gap-2 flex-wrap">${tagsHtml}</div>
    </div>
    <div class="flex items-center gap-6 mb-6">
      <div>
        <label class="text-xs font-semibold text-charcoalMid uppercase tracking-wider mb-1.5 block">Due Date</label>
        <div class="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2">
          <svg width="14" height="14" fill="none" stroke="#a8a29e" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span class="text-sm text-charcoal">${t.due}</span>
        </div>
      </div>
      <div>
        <label class="text-xs font-semibold text-charcoalMid uppercase tracking-wider mb-1.5 block">Priority</label>
        <div class="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg px-3 py-2">
          <div class="w-2.5 h-2.5 rounded-full ${t.pri==='P1'?'bg-red-500':t.pri==='P2'?'bg-orange':'bg-charcoalLight'}"></div>
          <span class="text-sm text-charcoal">${t.priLabel}</span>
        </div>
      </div>
    </div>
    ${t.notes?`<div class="mb-8">
      <label class="text-xs font-semibold text-charcoalMid uppercase tracking-wider mb-2 block">Notes</label>
      <div class="text-sm text-charcoalMid leading-relaxed bg-white border border-stone-200 rounded-lg p-4 min-h-[80px]">${t.notes}</div>
    </div>`:''}
    <button class="bg-orange text-white font-semibold px-6 py-3 rounded-lg cursor-pointer hover:bg-orange/90 transition flex items-center gap-2" onclick="completeActive()">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
      Mark Complete
    </button>
  `;
}

// Checkbox toggle
function toggleDone(taskEl){
  const cb=taskEl.querySelector('.task-check');
  const title=taskEl.querySelector('.task-title');
  const isDone=cb.classList.contains('done');
  if(isDone){
    cb.classList.remove('done');
    taskEl.classList.remove('opacity-50');
    if(title){title.classList.remove('struck')}
  }else{
    cb.classList.add('done');
    taskEl.classList.add('opacity-50');
    if(title){title.classList.add('struck')}
  }
}

// Focus mode: double-click
let focusEl=null;
function toggleFocus(el){
  if(focusEl===el){
    // Exit focus
    document.body.classList.remove('focus-active');
    el.classList.remove('focus-target');
    document.getElementById('rightPanel').classList.remove('focus-target');
    focusEl=null;
  }else{
    // Enter focus
    if(focusEl){
      focusEl.classList.remove('focus-target');
    }
    document.body.classList.add('focus-active');
    el.classList.add('focus-target');
    // Also keep right panel visible for the focused task
    document.getElementById('rightPanel').classList.add('focus-target');
    focusEl=el;
    // Also select the task
    selectTask(el);
  }
}

// Exit focus on Escape
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&focusEl){
    document.body.classList.remove('focus-active');
    focusEl.classList.remove('focus-target');
    document.getElementById('rightPanel').classList.remove('focus-target');
    focusEl=null;
  }
});

// Subtask toggle
function toggleSub(el){
  const cb=el.querySelector('.sub-check');
  const text=el.querySelector('span');
  cb.classList.toggle('done');
  text.classList.toggle('line-through');
  text.classList.toggle('text-charcoalLight');
  text.classList.toggle('text-charcoal');
}

// Filter tabs
function setFilter(btn){
  document.querySelectorAll('.filter-tab').forEach(t=>{
    t.classList.remove('active');
    t.classList.add('text-charcoalLight');
  });
  btn.classList.add('active');
  btn.classList.remove('text-charcoalLight');
}

// Complete active task
function completeActive(){
  const el=document.getElementById('activeTask');
  if(el){
    toggleDone(el);
  }
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
