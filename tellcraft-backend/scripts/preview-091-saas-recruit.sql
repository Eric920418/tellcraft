-- ============================================================
-- Template Preview: saas-recruit (SaaS Recruitment ATS)
-- 執行: psql -U tellcraft_user -d tellcraft -f preview-091-saas-recruit.sql
-- ============================================================

INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '8461b27f-2131-4873-a149-1267152dbd87',
  $HTML$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TalentFlow - Recruitment Pipeline</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { sans: ['DM Sans', 'sans-serif'] },
      colors: {
        indigo: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
          800: '#3730a3', 900: '#312e81'
        },
        cream: { 50: '#fefdfb', 100: '#fdf8f0', 200: '#faf0e0', 300: '#f5e6cc' }
      }
    }
  }
}
</script>
<style>
* { font-family: 'DM Sans', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
body { background: #fefdfb; color: #1e1b4b; }
.pipeline-cols { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 16px; min-height: 520px; }
.pipeline-col { min-width: 280px; flex: 1; }
.candidate-card { background: #fff; border: 1px solid #e8e4df; border-radius: 12px; padding: 14px; transition: all 0.2s ease; cursor: grab; }
.candidate-card:hover { border-color: #c7d2fe; box-shadow: 0 4px 20px rgba(67,56,202,0.08); }
.candidate-card:hover .radar-chart { transform: scale(1.15); }
.radar-chart { transition: transform 0.25s ease; }
.source-pill { font-size: 10px; padding: 2px 8px; border-radius: 9999px; font-weight: 500; }
.funnel-arrow { color: #a5b4fc; font-size: 18px; line-height: 1; }
.col-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 10px; margin-bottom: 12px; }
::-webkit-scrollbar { height: 6px; }
::-webkit-scrollbar-track { background: #faf0e0; border-radius: 3px; }
::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 3px; }
</style>
</head>
<body class="min-h-screen">

<!-- Top Bar -->
<header class="bg-white border-b border-cream-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
  <div class="flex items-center gap-6">
    <div class="flex items-center gap-2.5">
      <div class="w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      </div>
      <span class="text-lg font-bold text-indigo-900 tracking-tight">TalentFlow</span>
    </div>
    <!-- Job Selector -->
    <div class="flex items-center gap-2 bg-cream-100 border border-cream-200 rounded-lg px-3 py-1.5 cursor-pointer hover:border-indigo-300 transition">
      <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
      <span class="text-sm font-medium text-gray-800">Senior Developer</span>
      <span class="text-xs text-indigo-500 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">12 applicants</span>
      <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
    </div>
  </div>
  <div class="flex items-center gap-3">
    <div class="relative">
      <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input type="text" placeholder="Search candidates..." class="bg-cream-50 border border-cream-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 w-56 transition">
    </div>
    <button class="flex items-center gap-1.5 text-sm text-gray-600 bg-cream-50 border border-cream-200 rounded-lg px-3 py-2 hover:bg-cream-100 transition cursor-pointer">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
      Filters
    </button>
    <button class="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-indigo-200">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
      Post Job
    </button>
  </div>
</header>

<!-- Pipeline Funnel Stats -->
<div class="px-6 py-4 bg-white border-b border-cream-200">
  <div class="flex items-center justify-center gap-2 flex-wrap">
    <div class="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2">
      <div class="w-2 h-2 rounded-full bg-blue-400"></div>
      <span class="text-xs font-medium text-gray-600">Applied</span>
      <span class="text-lg font-bold text-gray-900">12</span>
    </div>
    <span class="funnel-arrow">&rarr;</span>
    <div class="flex items-center gap-2 bg-amber-50 rounded-lg px-4 py-2">
      <div class="w-2 h-2 rounded-full bg-amber-400"></div>
      <span class="text-xs font-medium text-gray-600">Screening</span>
      <span class="text-lg font-bold text-gray-900">8</span>
    </div>
    <span class="funnel-arrow">&rarr;</span>
    <div class="flex items-center gap-2 bg-purple-50 rounded-lg px-4 py-2">
      <div class="w-2 h-2 rounded-full bg-purple-400"></div>
      <span class="text-xs font-medium text-gray-600">Interview</span>
      <span class="text-lg font-bold text-gray-900">4</span>
    </div>
    <span class="funnel-arrow">&rarr;</span>
    <div class="flex items-center gap-2 bg-indigo-50 rounded-lg px-4 py-2">
      <div class="w-2 h-2 rounded-full bg-indigo-400"></div>
      <span class="text-xs font-medium text-gray-600">Offer</span>
      <span class="text-lg font-bold text-gray-900">2</span>
    </div>
    <span class="funnel-arrow">&rarr;</span>
    <div class="flex items-center gap-2 bg-green-50 rounded-lg px-4 py-2">
      <div class="w-2 h-2 rounded-full bg-green-500"></div>
      <span class="text-xs font-medium text-gray-600">Hired</span>
      <span class="text-lg font-bold text-gray-900">1</span>
    </div>
    <!-- Conversion Rate -->
    <div class="ml-4 pl-4 border-l border-cream-200 flex items-center gap-1.5">
      <span class="text-xs text-gray-400">Conversion</span>
      <span class="text-sm font-bold text-indigo-700">8.3%</span>
    </div>
  </div>
</div>

<!-- Pipeline Columns -->
<div class="px-6 pt-5 pb-6">
  <div class="pipeline-cols">

    <!-- APPLIED Column -->
    <div class="pipeline-col">
      <div class="col-header bg-blue-50">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
          <span class="text-sm font-semibold text-gray-800">Applied</span>
        </div>
        <span class="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">6</span>
      </div>
      <div class="space-y-3">

        <!-- Candidate 1 - Sarah Chen -->
        <div class="candidate-card">
          <div class="flex items-start justify-between mb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">SC</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Sarah Chen</div>
                <div class="text-[11px] text-gray-400">Stripe &middot; Frontend Lead</div>
              </div>
            </div>
            <span class="source-pill bg-blue-50 text-blue-600">LinkedIn</span>
          </div>
          <div class="flex items-center gap-3">
            <svg class="radar-chart" width="60" height="60" viewBox="0 0 120 120">
              <!-- Grid lines -->
              <polygon points="60,10 107,35 107,85 60,110 13,85 13,35" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,25 94,42 94,78 60,95 26,78 26,42" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,40 81,50 81,70 60,80 39,70 39,50" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <!-- Axes -->
              <line x1="60" y1="10" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <!-- Data: Frontend:95 Backend:60 Design:80 Comm:70 Exp:85 -->
              <polygon points="60,12 88,43 98,78 22,73 18,38" fill="rgba(67,56,202,0.15)" stroke="#4338ca" stroke-width="1.5"/>
              <!-- Dots -->
              <circle cx="60" cy="12" r="2.5" fill="#4338ca"/><circle cx="88" cy="43" r="2.5" fill="#4338ca"/><circle cx="98" cy="78" r="2.5" fill="#4338ca"/><circle cx="22" cy="73" r="2.5" fill="#4338ca"/><circle cx="18" cy="38" r="2.5" fill="#4338ca"/>
              <!-- Labels -->
              <text x="60" y="6" text-anchor="middle" font-size="7" fill="#6366f1" font-weight="600">FE</text>
              <text x="114" y="37" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">BE</text>
              <text x="114" y="90" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">DS</text>
              <text x="6" y="90" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">CM</text>
              <text x="6" y="37" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">EX</text>
            </svg>
            <div class="flex-1 text-[10px] text-gray-400 space-y-0.5">
              <div>Applied <span class="text-gray-600 font-medium">2 days ago</span></div>
              <div class="flex gap-1 flex-wrap mt-1">
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">React</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">TypeScript</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Next.js</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Candidate 2 - Marcus Rivera -->
        <div class="candidate-card">
          <div class="flex items-start justify-between mb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">MR</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Marcus Rivera</div>
                <div class="text-[11px] text-gray-400">Shopify &middot; Sr. Engineer</div>
              </div>
            </div>
            <span class="source-pill bg-green-50 text-green-600">Referral</span>
          </div>
          <div class="flex items-center gap-3">
            <svg class="radar-chart" width="60" height="60" viewBox="0 0 120 120">
              <polygon points="60,10 107,35 107,85 60,110 13,85 13,35" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,25 94,42 94,78 60,95 26,78 26,42" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,40 81,50 81,70 60,80 39,70 39,50" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <line x1="60" y1="10" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <!-- Data: Frontend:70 Backend:90 Design:40 Comm:80 Exp:90 -->
              <polygon points="60,18 102,38 79,82 20,68 15,35" fill="rgba(67,56,202,0.15)" stroke="#4338ca" stroke-width="1.5"/>
              <circle cx="60" cy="18" r="2.5" fill="#4338ca"/><circle cx="102" cy="38" r="2.5" fill="#4338ca"/><circle cx="79" cy="82" r="2.5" fill="#4338ca"/><circle cx="20" cy="68" r="2.5" fill="#4338ca"/><circle cx="15" cy="35" r="2.5" fill="#4338ca"/>
              <text x="60" y="6" text-anchor="middle" font-size="7" fill="#6366f1" font-weight="600">FE</text>
              <text x="114" y="37" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">BE</text>
              <text x="114" y="90" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">DS</text>
              <text x="6" y="90" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">CM</text>
              <text x="6" y="37" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">EX</text>
            </svg>
            <div class="flex-1 text-[10px] text-gray-400 space-y-0.5">
              <div>Applied <span class="text-gray-600 font-medium">3 days ago</span></div>
              <div class="flex gap-1 flex-wrap mt-1">
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Node.js</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Python</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">AWS</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Candidate 3 - Yuki Tanaka -->
        <div class="candidate-card">
          <div class="flex items-start justify-between mb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-sm font-bold text-rose-700">YT</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Yuki Tanaka</div>
                <div class="text-[11px] text-gray-400">Figma &middot; Design Engineer</div>
              </div>
            </div>
            <span class="source-pill bg-purple-50 text-purple-600">Website</span>
          </div>
          <div class="flex items-center gap-3">
            <svg class="radar-chart" width="60" height="60" viewBox="0 0 120 120">
              <polygon points="60,10 107,35 107,85 60,110 13,85 13,35" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,25 94,42 94,78 60,95 26,78 26,42" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,40 81,50 81,70 60,80 39,70 39,50" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <line x1="60" y1="10" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <!-- Data: Frontend:85 Backend:30 Design:95 Comm:75 Exp:60 -->
              <polygon points="60,13 74,47 104,78 19,75 23,40" fill="rgba(67,56,202,0.15)" stroke="#4338ca" stroke-width="1.5"/>
              <circle cx="60" cy="13" r="2.5" fill="#4338ca"/><circle cx="74" cy="47" r="2.5" fill="#4338ca"/><circle cx="104" cy="78" r="2.5" fill="#4338ca"/><circle cx="19" cy="75" r="2.5" fill="#4338ca"/><circle cx="23" cy="40" r="2.5" fill="#4338ca"/>
              <text x="60" y="6" text-anchor="middle" font-size="7" fill="#6366f1" font-weight="600">FE</text>
              <text x="114" y="37" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">BE</text>
              <text x="114" y="90" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">DS</text>
              <text x="6" y="90" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">CM</text>
              <text x="6" y="37" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">EX</text>
            </svg>
            <div class="flex-1 text-[10px] text-gray-400 space-y-0.5">
              <div>Applied <span class="text-gray-600 font-medium">5 days ago</span></div>
              <div class="flex gap-1 flex-wrap mt-1">
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Figma</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">CSS</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Motion</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Candidate 4 - Alex Kim -->
        <div class="candidate-card">
          <div class="flex items-start justify-between mb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center text-sm font-bold text-cyan-700">AK</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Alex Kim</div>
                <div class="text-[11px] text-gray-400">Google &middot; SWE III</div>
              </div>
            </div>
            <span class="source-pill bg-blue-50 text-blue-600">LinkedIn</span>
          </div>
          <div class="flex items-center gap-3">
            <svg class="radar-chart" width="60" height="60" viewBox="0 0 120 120">
              <polygon points="60,10 107,35 107,85 60,110 13,85 13,35" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,25 94,42 94,78 60,95 26,78 26,42" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,40 81,50 81,70 60,80 39,70 39,50" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <line x1="60" y1="10" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <!-- Data: Frontend:80 Backend:85 Design:50 Comm:65 Exp:75 -->
              <polygon points="60,15 100,39 85,80 25,72 19,39" fill="rgba(67,56,202,0.15)" stroke="#4338ca" stroke-width="1.5"/>
              <circle cx="60" cy="15" r="2.5" fill="#4338ca"/><circle cx="100" cy="39" r="2.5" fill="#4338ca"/><circle cx="85" cy="80" r="2.5" fill="#4338ca"/><circle cx="25" cy="72" r="2.5" fill="#4338ca"/><circle cx="19" cy="39" r="2.5" fill="#4338ca"/>
              <text x="60" y="6" text-anchor="middle" font-size="7" fill="#6366f1" font-weight="600">FE</text>
              <text x="114" y="37" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">BE</text>
              <text x="114" y="90" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">DS</text>
              <text x="6" y="90" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">CM</text>
              <text x="6" y="37" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">EX</text>
            </svg>
            <div class="flex-1 text-[10px] text-gray-400 space-y-0.5">
              <div>Applied <span class="text-gray-600 font-medium">1 day ago</span></div>
              <div class="flex gap-1 flex-wrap mt-1">
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Go</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">React</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">K8s</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Candidate 5 - Priya Patel -->
        <div class="candidate-card">
          <div class="flex items-start justify-between mb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">PP</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Priya Patel</div>
                <div class="text-[11px] text-gray-400">Meta &middot; Tech Lead</div>
              </div>
            </div>
            <span class="source-pill bg-orange-50 text-orange-600">Indeed</span>
          </div>
          <div class="flex items-center gap-3">
            <svg class="radar-chart" width="60" height="60" viewBox="0 0 120 120">
              <polygon points="60,10 107,35 107,85 60,110 13,85 13,35" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,25 94,42 94,78 60,95 26,78 26,42" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,40 81,50 81,70 60,80 39,70 39,50" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <line x1="60" y1="10" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <!-- Data: Frontend:75 Backend:75 Design:45 Comm:90 Exp:95 -->
              <polygon points="60,17 95,40 83,81 14,70 14,33" fill="rgba(67,56,202,0.15)" stroke="#4338ca" stroke-width="1.5"/>
              <circle cx="60" cy="17" r="2.5" fill="#4338ca"/><circle cx="95" cy="40" r="2.5" fill="#4338ca"/><circle cx="83" cy="81" r="2.5" fill="#4338ca"/><circle cx="14" cy="70" r="2.5" fill="#4338ca"/><circle cx="14" cy="33" r="2.5" fill="#4338ca"/>
              <text x="60" y="6" text-anchor="middle" font-size="7" fill="#6366f1" font-weight="600">FE</text>
              <text x="114" y="37" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">BE</text>
              <text x="114" y="90" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">DS</text>
              <text x="6" y="90" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">CM</text>
              <text x="6" y="37" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">EX</text>
            </svg>
            <div class="flex-1 text-[10px] text-gray-400 space-y-0.5">
              <div>Applied <span class="text-gray-600 font-medium">4 days ago</span></div>
              <div class="flex gap-1 flex-wrap mt-1">
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Java</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">System Design</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Candidate 6 - Jordan Lee -->
        <div class="candidate-card">
          <div class="flex items-start justify-between mb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700">JL</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Jordan Lee</div>
                <div class="text-[11px] text-gray-400">Vercel &middot; Engineer</div>
              </div>
            </div>
            <span class="source-pill bg-green-50 text-green-600">Referral</span>
          </div>
          <div class="flex items-center gap-3">
            <svg class="radar-chart" width="60" height="60" viewBox="0 0 120 120">
              <polygon points="60,10 107,35 107,85 60,110 13,85 13,35" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,25 94,42 94,78 60,95 26,78 26,42" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,40 81,50 81,70 60,80 39,70 39,50" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <line x1="60" y1="10" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <!-- Data: Frontend:90 Backend:70 Design:65 Comm:60 Exp:55 -->
              <polygon points="60,12 90,42 90,82 27,75 23,42" fill="rgba(67,56,202,0.15)" stroke="#4338ca" stroke-width="1.5"/>
              <circle cx="60" cy="12" r="2.5" fill="#4338ca"/><circle cx="90" cy="42" r="2.5" fill="#4338ca"/><circle cx="90" cy="82" r="2.5" fill="#4338ca"/><circle cx="27" cy="75" r="2.5" fill="#4338ca"/><circle cx="23" cy="42" r="2.5" fill="#4338ca"/>
              <text x="60" y="6" text-anchor="middle" font-size="7" fill="#6366f1" font-weight="600">FE</text>
              <text x="114" y="37" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">BE</text>
              <text x="114" y="90" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">DS</text>
              <text x="6" y="90" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">CM</text>
              <text x="6" y="37" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">EX</text>
            </svg>
            <div class="flex-1 text-[10px] text-gray-400 space-y-0.5">
              <div>Applied <span class="text-gray-600 font-medium">today</span></div>
              <div class="flex gap-1 flex-wrap mt-1">
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Next.js</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Svelte</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- SCREENING Column -->
    <div class="pipeline-col">
      <div class="col-header bg-amber-50">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
          <span class="text-sm font-semibold text-gray-800">Screening</span>
        </div>
        <span class="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">3</span>
      </div>
      <div class="space-y-3">

        <!-- Screening 1 - Emily Watson -->
        <div class="candidate-card">
          <div class="flex items-start justify-between mb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-sm font-bold text-pink-700">EW</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Emily Watson</div>
                <div class="text-[11px] text-gray-400">Netflix &middot; Sr. Frontend</div>
              </div>
            </div>
            <span class="source-pill bg-blue-50 text-blue-600">LinkedIn</span>
          </div>
          <div class="flex items-center gap-3 mb-2">
            <svg class="radar-chart" width="60" height="60" viewBox="0 0 120 120">
              <polygon points="60,10 107,35 107,85 60,110 13,85 13,35" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,25 94,42 94,78 60,95 26,78 26,42" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,40 81,50 81,70 60,80 39,70 39,50" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <line x1="60" y1="10" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <!-- Data: Frontend:92 Backend:55 Design:70 Comm:85 Exp:80 -->
              <polygon points="60,12 82,45 93,78 17,69 16,36" fill="rgba(67,56,202,0.15)" stroke="#4338ca" stroke-width="1.5"/>
              <circle cx="60" cy="12" r="2.5" fill="#4338ca"/><circle cx="82" cy="45" r="2.5" fill="#4338ca"/><circle cx="93" cy="78" r="2.5" fill="#4338ca"/><circle cx="17" cy="69" r="2.5" fill="#4338ca"/><circle cx="16" cy="36" r="2.5" fill="#4338ca"/>
              <text x="60" y="6" text-anchor="middle" font-size="7" fill="#6366f1" font-weight="600">FE</text>
              <text x="114" y="37" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">BE</text>
              <text x="114" y="90" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">DS</text>
              <text x="6" y="90" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">CM</text>
              <text x="6" y="37" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">EX</text>
            </svg>
            <div class="flex-1 text-[10px] text-gray-400 space-y-0.5">
              <div class="flex gap-1 flex-wrap">
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">React</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Vue</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">GraphQL</span>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-400">Screening Score</span>
            <span class="text-xs font-bold text-white bg-indigo-600 px-2.5 py-0.5 rounded-full">92/100</span>
          </div>
        </div>

        <!-- Screening 2 - David Okonkwo -->
        <div class="candidate-card">
          <div class="flex items-start justify-between mb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-sm font-bold text-teal-700">DO</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">David Okonkwo</div>
                <div class="text-[11px] text-gray-400">Airbnb &middot; Staff Eng</div>
              </div>
            </div>
            <span class="source-pill bg-purple-50 text-purple-600">Website</span>
          </div>
          <div class="flex items-center gap-3 mb-2">
            <svg class="radar-chart" width="60" height="60" viewBox="0 0 120 120">
              <polygon points="60,10 107,35 107,85 60,110 13,85 13,35" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,25 94,42 94,78 60,95 26,78 26,42" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,40 81,50 81,70 60,80 39,70 39,50" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <line x1="60" y1="10" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <!-- Data: Frontend:65 Backend:95 Design:35 Comm:70 Exp:95 -->
              <polygon points="60,19 105,36 78,84 22,72 14,33" fill="rgba(67,56,202,0.15)" stroke="#4338ca" stroke-width="1.5"/>
              <circle cx="60" cy="19" r="2.5" fill="#4338ca"/><circle cx="105" cy="36" r="2.5" fill="#4338ca"/><circle cx="78" cy="84" r="2.5" fill="#4338ca"/><circle cx="22" cy="72" r="2.5" fill="#4338ca"/><circle cx="14" cy="33" r="2.5" fill="#4338ca"/>
              <text x="60" y="6" text-anchor="middle" font-size="7" fill="#6366f1" font-weight="600">FE</text>
              <text x="114" y="37" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">BE</text>
              <text x="114" y="90" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">DS</text>
              <text x="6" y="90" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">CM</text>
              <text x="6" y="37" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">EX</text>
            </svg>
            <div class="flex-1 text-[10px] text-gray-400 space-y-0.5">
              <div class="flex gap-1 flex-wrap">
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Rust</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Go</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Distributed</span>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-400">Screening Score</span>
            <span class="text-xs font-bold text-white bg-indigo-600 px-2.5 py-0.5 rounded-full">88/100</span>
          </div>
        </div>

        <!-- Screening 3 - Lisa Zhang -->
        <div class="candidate-card">
          <div class="flex items-start justify-between mb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-700">LZ</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Lisa Zhang</div>
                <div class="text-[11px] text-gray-400">Atlassian &middot; Senior FE</div>
              </div>
            </div>
            <span class="source-pill bg-green-50 text-green-600">Referral</span>
          </div>
          <div class="flex items-center gap-3 mb-2">
            <svg class="radar-chart" width="60" height="60" viewBox="0 0 120 120">
              <polygon points="60,10 107,35 107,85 60,110 13,85 13,35" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,25 94,42 94,78 60,95 26,78 26,42" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,40 81,50 81,70 60,80 39,70 39,50" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <line x1="60" y1="10" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <!-- Data: Frontend:88 Backend:60 Design:55 Comm:80 Exp:70 -->
              <polygon points="60,13 88,43 87,80 20,68 18,38" fill="rgba(67,56,202,0.15)" stroke="#4338ca" stroke-width="1.5"/>
              <circle cx="60" cy="13" r="2.5" fill="#4338ca"/><circle cx="88" cy="43" r="2.5" fill="#4338ca"/><circle cx="87" cy="80" r="2.5" fill="#4338ca"/><circle cx="20" cy="68" r="2.5" fill="#4338ca"/><circle cx="18" cy="38" r="2.5" fill="#4338ca"/>
              <text x="60" y="6" text-anchor="middle" font-size="7" fill="#6366f1" font-weight="600">FE</text>
              <text x="114" y="37" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">BE</text>
              <text x="114" y="90" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">DS</text>
              <text x="6" y="90" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">CM</text>
              <text x="6" y="37" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">EX</text>
            </svg>
            <div class="flex-1 text-[10px] text-gray-400 space-y-0.5">
              <div class="flex gap-1 flex-wrap">
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Angular</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">RxJS</span>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-400">Screening Score</span>
            <span class="text-xs font-bold text-white bg-indigo-500 px-2.5 py-0.5 rounded-full">79/100</span>
          </div>
        </div>

      </div>
    </div>

    <!-- INTERVIEW Column -->
    <div class="pipeline-col">
      <div class="col-header bg-purple-50">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-purple-400"></div>
          <span class="text-sm font-semibold text-gray-800">Interview</span>
        </div>
        <span class="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">2</span>
      </div>
      <div class="space-y-3">

        <!-- Interview 1 - James Park -->
        <div class="candidate-card">
          <div class="flex items-start justify-between mb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-700">JP</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">James Park</div>
                <div class="text-[11px] text-gray-400">Amazon &middot; SDE II</div>
              </div>
            </div>
            <span class="source-pill bg-blue-50 text-blue-600">LinkedIn</span>
          </div>
          <div class="flex items-center gap-3 mb-2.5">
            <svg class="radar-chart" width="60" height="60" viewBox="0 0 120 120">
              <polygon points="60,10 107,35 107,85 60,110 13,85 13,35" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,25 94,42 94,78 60,95 26,78 26,42" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,40 81,50 81,70 60,80 39,70 39,50" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <line x1="60" y1="10" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <!-- Data: Frontend:78 Backend:88 Design:42 Comm:82 Exp:85 -->
              <polygon points="60,16 101,38 82,82 18,68 15,35" fill="rgba(67,56,202,0.15)" stroke="#4338ca" stroke-width="1.5"/>
              <circle cx="60" cy="16" r="2.5" fill="#4338ca"/><circle cx="101" cy="38" r="2.5" fill="#4338ca"/><circle cx="82" cy="82" r="2.5" fill="#4338ca"/><circle cx="18" cy="68" r="2.5" fill="#4338ca"/><circle cx="15" cy="35" r="2.5" fill="#4338ca"/>
              <text x="60" y="6" text-anchor="middle" font-size="7" fill="#6366f1" font-weight="600">FE</text>
              <text x="114" y="37" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">BE</text>
              <text x="114" y="90" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">DS</text>
              <text x="6" y="90" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">CM</text>
              <text x="6" y="37" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">EX</text>
            </svg>
            <div class="flex-1 text-[10px] text-gray-400 space-y-0.5">
              <div class="flex gap-1 flex-wrap">
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Java</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Spring</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">React</span>
              </div>
            </div>
          </div>
          <div class="bg-purple-50 rounded-lg px-3 py-2 flex items-center gap-2">
            <svg class="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span class="text-[11px] font-medium text-purple-700">Feb 26, 2:00 PM - Technical</span>
          </div>
        </div>

        <!-- Interview 2 - Mia Thompson -->
        <div class="candidate-card">
          <div class="flex items-start justify-between mb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-lime-100 flex items-center justify-center text-sm font-bold text-lime-700">MT</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Mia Thompson</div>
                <div class="text-[11px] text-gray-400">Spotify &middot; Frontend</div>
              </div>
            </div>
            <span class="source-pill bg-orange-50 text-orange-600">Indeed</span>
          </div>
          <div class="flex items-center gap-3 mb-2.5">
            <svg class="radar-chart" width="60" height="60" viewBox="0 0 120 120">
              <polygon points="60,10 107,35 107,85 60,110 13,85 13,35" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,25 94,42 94,78 60,95 26,78 26,42" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,40 81,50 81,70 60,80 39,70 39,50" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <line x1="60" y1="10" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <!-- Data: Frontend:94 Backend:45 Design:80 Comm:75 Exp:65 -->
              <polygon points="60,11 78,46 97,79 19,73 21,40" fill="rgba(67,56,202,0.15)" stroke="#4338ca" stroke-width="1.5"/>
              <circle cx="60" cy="11" r="2.5" fill="#4338ca"/><circle cx="78" cy="46" r="2.5" fill="#4338ca"/><circle cx="97" cy="79" r="2.5" fill="#4338ca"/><circle cx="19" cy="73" r="2.5" fill="#4338ca"/><circle cx="21" cy="40" r="2.5" fill="#4338ca"/>
              <text x="60" y="6" text-anchor="middle" font-size="7" fill="#6366f1" font-weight="600">FE</text>
              <text x="114" y="37" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">BE</text>
              <text x="114" y="90" text-anchor="start" font-size="7" fill="#6366f1" font-weight="600">DS</text>
              <text x="6" y="90" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">CM</text>
              <text x="6" y="37" text-anchor="end" font-size="7" fill="#6366f1" font-weight="600">EX</text>
            </svg>
            <div class="flex-1 text-[10px] text-gray-400 space-y-0.5">
              <div class="flex gap-1 flex-wrap">
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">React</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">a11y</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium">Perf</span>
              </div>
            </div>
          </div>
          <div class="bg-purple-50 rounded-lg px-3 py-2 flex items-center gap-2">
            <svg class="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span class="text-[11px] font-medium text-purple-700">Feb 28, 10:00 AM - Culture Fit</span>
          </div>
        </div>

      </div>
    </div>

    <!-- OFFER Column -->
    <div class="pipeline-col">
      <div class="col-header bg-indigo-50">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-indigo-400"></div>
          <span class="text-sm font-semibold text-gray-800">Offer</span>
        </div>
        <span class="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">1</span>
      </div>
      <div class="space-y-3">

        <!-- Offer 1 - Noah Williams -->
        <div class="candidate-card border-indigo-200 bg-indigo-50/30">
          <div class="flex items-start justify-between mb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-800">NW</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Noah Williams</div>
                <div class="text-[11px] text-gray-400">Twitch &middot; Lead Eng</div>
              </div>
            </div>
            <span class="source-pill bg-green-50 text-green-600">Referral</span>
          </div>
          <div class="flex items-center gap-3 mb-3">
            <svg class="radar-chart" width="60" height="60" viewBox="0 0 120 120">
              <polygon points="60,10 107,35 107,85 60,110 13,85 13,35" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,25 94,42 94,78 60,95 26,78 26,42" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <polygon points="60,40 81,50 81,70 60,80 39,70 39,50" fill="none" stroke="#e0e7ff" stroke-width="1"/>
              <line x1="60" y1="10" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="107" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="85" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <line x1="13" y1="35" x2="60" y2="60" stroke="#e0e7ff" stroke-width="0.5"/>
              <!-- Data: Frontend:90 Backend:85 Design:60 Comm:88 Exp:92 -->
              <polygon points="60,12 99,37 88,80 15,67 14,34" fill="rgba(67,56,202,0.2)" stroke="#4338ca" stroke-width="2"/>
              <circle cx="60" cy="12" r="2.5" fill="#4338ca"/><circle cx="99" cy="37" r="2.5" fill="#4338ca"/><circle cx="88" cy="80" r="2.5" fill="#4338ca"/><circle cx="15" cy="67" r="2.5" fill="#4338ca"/><circle cx="14" cy="34" r="2.5" fill="#4338ca"/>
              <text x="60" y="6" text-anchor="middle" font-size="7" fill="#4338ca" font-weight="700">FE</text>
              <text x="114" y="37" text-anchor="start" font-size="7" fill="#4338ca" font-weight="700">BE</text>
              <text x="114" y="90" text-anchor="start" font-size="7" fill="#4338ca" font-weight="700">DS</text>
              <text x="6" y="90" text-anchor="end" font-size="7" fill="#4338ca" font-weight="700">CM</text>
              <text x="6" y="37" text-anchor="end" font-size="7" fill="#4338ca" font-weight="700">EX</text>
            </svg>
            <div class="flex-1 text-[10px] text-gray-400 space-y-0.5">
              <div class="flex gap-1 flex-wrap">
                <span class="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-medium">Full Stack</span>
                <span class="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-medium">Leadership</span>
              </div>
            </div>
          </div>
          <div class="bg-white border border-indigo-200 rounded-lg p-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-gray-400">Offer Amount</span>
              <span class="text-sm font-bold text-indigo-700">$185,000</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-gray-400">Equity</span>
              <span class="text-xs font-medium text-gray-700">0.15% (4yr vest)</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-gray-400">Status</span>
              <span class="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending Review</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- HIRED Column -->
    <div class="pipeline-col">
      <div class="col-header bg-green-50">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          <span class="text-sm font-semibold text-gray-800">Hired</span>
        </div>
        <span class="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">1</span>
      </div>
      <div class="space-y-3">

        <!-- Hired 1 - Ana Kovacs -->
        <div class="candidate-card border-green-200 bg-green-50/30">
          <div class="flex items-start justify-between mb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-sm font-bold text-green-800">AV</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Ana Kovacs</div>
                <div class="text-[11px] text-gray-400">Canva &middot; Sr. Frontend</div>
              </div>
            </div>
            <span class="source-pill bg-blue-50 text-blue-600">LinkedIn</span>
          </div>
          <div class="flex items-center gap-3 mb-3">
            <svg class="radar-chart" width="60" height="60" viewBox="0 0 120 120">
              <polygon points="60,10 107,35 107,85 60,110 13,85 13,35" fill="none" stroke="#d1fae5" stroke-width="1"/>
              <polygon points="60,25 94,42 94,78 60,95 26,78 26,42" fill="none" stroke="#d1fae5" stroke-width="1"/>
              <polygon points="60,40 81,50 81,70 60,80 39,70 39,50" fill="none" stroke="#d1fae5" stroke-width="1"/>
              <line x1="60" y1="10" x2="60" y2="60" stroke="#d1fae5" stroke-width="0.5"/>
              <line x1="107" y1="35" x2="60" y2="60" stroke="#d1fae5" stroke-width="0.5"/>
              <line x1="107" y1="85" x2="60" y2="60" stroke="#d1fae5" stroke-width="0.5"/>
              <line x1="13" y1="85" x2="60" y2="60" stroke="#d1fae5" stroke-width="0.5"/>
              <line x1="13" y1="35" x2="60" y2="60" stroke="#d1fae5" stroke-width="0.5"/>
              <!-- Data: Frontend:95 Backend:70 Design:85 Comm:90 Exp:80 -->
              <polygon points="60,11 90,42 100,78 14,66 16,37" fill="rgba(22,163,74,0.15)" stroke="#16a34a" stroke-width="2"/>
              <circle cx="60" cy="11" r="2.5" fill="#16a34a"/><circle cx="90" cy="42" r="2.5" fill="#16a34a"/><circle cx="100" cy="78" r="2.5" fill="#16a34a"/><circle cx="14" cy="66" r="2.5" fill="#16a34a"/><circle cx="16" cy="37" r="2.5" fill="#16a34a"/>
              <text x="60" y="6" text-anchor="middle" font-size="7" fill="#16a34a" font-weight="700">FE</text>
              <text x="114" y="37" text-anchor="start" font-size="7" fill="#16a34a" font-weight="700">BE</text>
              <text x="114" y="90" text-anchor="start" font-size="7" fill="#16a34a" font-weight="700">DS</text>
              <text x="6" y="90" text-anchor="end" font-size="7" fill="#16a34a" font-weight="700">CM</text>
              <text x="6" y="37" text-anchor="end" font-size="7" fill="#16a34a" font-weight="700">EX</text>
            </svg>
            <div class="flex-1 text-[10px] text-gray-400 space-y-0.5">
              <div class="flex gap-1 flex-wrap">
                <span class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-medium">React</span>
                <span class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-medium">Design Systems</span>
              </div>
            </div>
          </div>
          <div class="bg-green-100 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
            <div>
              <div class="text-[11px] font-semibold text-green-800">Offer Accepted</div>
              <div class="text-[10px] text-green-600">Start date: Mar 10, 2026</div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</div>

<script>
// Hover tooltip for radar chart skill labels
document.querySelectorAll('.candidate-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-2px)';
  });
  card.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0)';
  });
});

// Column drag visual placeholder (non-functional demo)
document.querySelectorAll('.candidate-card').forEach(card => {
  card.setAttribute('draggable', 'true');
  card.addEventListener('dragstart', function(e) {
    this.style.opacity = '0.5';
    e.dataTransfer.setData('text/plain', '');
  });
  card.addEventListener('dragend', function() {
    this.style.opacity = '1';
  });
});

document.querySelectorAll('.pipeline-col').forEach(col => {
  col.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.querySelector('.col-header').style.boxShadow = '0 0 0 2px #4338ca';
  });
  col.addEventListener('dragleave', function() {
    this.querySelector('.col-header').style.boxShadow = 'none';
  });
  col.addEventListener('drop', function() {
    this.querySelector('.col-header').style.boxShadow = 'none';
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
