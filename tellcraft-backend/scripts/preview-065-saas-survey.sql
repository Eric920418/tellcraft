INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '4dace529-085a-4903-901f-98d4b056d9d3',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>問卷達人 FormCraft</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{primary:'#8b5cf6',primaryLight:'#a78bfa',primaryDark:'#7c3aed',surface:'#faf5ff',sidebar:'#1a1025',accent:'#f59e0b',success:'#10b981',danger:'#ef4444',sky:'#0ea5e9',rose:'#f43f5e',teal:'#14b8a6'},fontFamily:{sans:['Inter','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#f8fafc;overflow:hidden;height:100vh}
.sidebar-item{transition:all .2s}
.sidebar-item:hover,.sidebar-item.active{background:rgba(255,255,255,.1);border-radius:8px}
.survey-card{transition:all .2s}
.survey-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08)}
.question-type{transition:all .15s;cursor:pointer}
.question-type:hover{background:#f5f3ff;border-color:#8b5cf6}
.question-type.selected{background:#8b5cf6;color:white;border-color:#8b5cf6}
.option-row{transition:all .15s}
.option-row:hover{background:#faf5ff}
.fade-in{animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#c4b5fd;border-radius:99px}
</style>
</head>
<body>
<div class="flex h-screen">
  <aside class="w-56 bg-sidebar text-white flex flex-col flex-shrink-0">
    <div class="p-4 flex items-center gap-2.5 border-b border-white/10">
      <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
      </div>
      <span class="font-bold text-base">FormCraft</span>
    </div>
    <nav class="flex-1 p-3 space-y-1">
      <div onclick="switchPage('surveys')" class="sidebar-item active flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="surveys">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>我的問卷</span>
        <span class="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">6</span>
      </div>
      <div onclick="switchPage('builder')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="builder">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
        <span>問卷編輯</span>
      </div>
      <div onclick="switchPage('responses')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="responses">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        <span>回覆統計</span>
      </div>
      <div onclick="switchPage('analytics')" class="sidebar-item flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm" data-page="analytics">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>
        <span>圖表分析</span>
      </div>
    </nav>
    <div class="p-3 border-t border-white/10">
      <div class="flex items-center gap-3 px-3 py-2">
        <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold">研</div>
        <div class="text-sm"><div class="font-medium">研究團隊</div><div class="text-xs text-white/50">專業版</div></div>
      </div>
    </div>
  </aside>

  <main class="flex-1 flex flex-col overflow-hidden">
    <header class="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <h1 class="font-semibold text-gray-900" id="pageTitle">我的問卷</h1>
      <button class="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primaryDark transition flex items-center gap-1.5">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        建立問卷
      </button>
    </header>

    <!-- My Surveys -->
    <div id="page-surveys" class="flex-1 overflow-auto p-6 fade-in">
      <div class="grid grid-cols-3 gap-4">
        <div class="survey-card bg-white rounded-2xl p-5 border border-gray-100 cursor-pointer" onclick="switchPage('responses')">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">收集中</span>
            <span class="text-xs text-gray-400">建立於 2/10</span>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1">2026 Q1 客戶滿意度調查</h3>
          <p class="text-xs text-gray-400 mb-3">了解客戶對產品和服務的滿意程度</p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 text-xs text-gray-500">
              <span>12 題</span>
              <span>•</span>
              <span class="font-bold text-primary">342 回覆</span>
            </div>
            <div class="w-16 bg-gray-100 rounded-full h-1.5"><div class="bg-primary rounded-full h-1.5" style="width:68%"></div></div>
          </div>
        </div>

        <div class="survey-card bg-white rounded-2xl p-5 border border-gray-100 cursor-pointer">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">收集中</span>
            <span class="text-xs text-gray-400">建立於 2/5</span>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1">新功能需求調查</h3>
          <p class="text-xs text-gray-400 mb-3">蒐集用戶對新功能的期望和優先級</p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 text-xs text-gray-500">
              <span>8 題</span>
              <span>•</span>
              <span class="font-bold text-primary">189 回覆</span>
            </div>
            <div class="w-16 bg-gray-100 rounded-full h-1.5"><div class="bg-primary rounded-full h-1.5" style="width:45%"></div></div>
          </div>
        </div>

        <div class="survey-card bg-white rounded-2xl p-5 border border-gray-100 cursor-pointer">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">已結束</span>
            <span class="text-xs text-gray-400">建立於 1/15</span>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1">員工工作環境滿意度</h3>
          <p class="text-xs text-gray-400 mb-3">年度員工滿意度調查</p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 text-xs text-gray-500">
              <span>20 題</span>
              <span>•</span>
              <span class="font-bold text-gray-500">86 回覆</span>
            </div>
            <div class="w-16 bg-gray-100 rounded-full h-1.5"><div class="bg-gray-400 rounded-full h-1.5" style="width:100%"></div></div>
          </div>
        </div>

        <div class="survey-card bg-white rounded-2xl p-5 border border-gray-100 cursor-pointer">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-medium">草稿</span>
            <span class="text-xs text-gray-400">建立於 2/14</span>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1">活動回饋問卷</h3>
          <p class="text-xs text-gray-400 mb-3">春季技術研討會參加者回饋</p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 text-xs text-gray-500">
              <span>6 題</span>
              <span>•</span>
              <span class="text-gray-400">尚未發佈</span>
            </div>
          </div>
        </div>

        <div class="survey-card bg-white rounded-2xl p-5 border border-gray-100 cursor-pointer">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">已結束</span>
            <span class="text-xs text-gray-400">建立於 12/20</span>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1">品牌認知度調查</h3>
          <p class="text-xs text-gray-400 mb-3">市場對品牌的認知和印象</p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 text-xs text-gray-500">
              <span>15 題</span>
              <span>•</span>
              <span class="font-bold text-gray-500">521 回覆</span>
            </div>
            <div class="w-16 bg-gray-100 rounded-full h-1.5"><div class="bg-gray-400 rounded-full h-1.5" style="width:100%"></div></div>
          </div>
        </div>

        <div class="survey-card bg-white rounded-2xl p-5 border border-dashed border-gray-300 cursor-pointer flex items-center justify-center hover:border-primary hover:bg-primary/5">
          <div class="text-center">
            <svg class="mx-auto mb-2 text-gray-300" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span class="text-sm text-gray-400">建立新問卷</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Builder -->
    <div id="page-builder" class="flex-1 overflow-auto fade-in hidden">
      <div class="flex h-full">
        <!-- Question types panel -->
        <div class="w-56 bg-gray-50 border-r border-gray-100 p-4 flex-shrink-0">
          <div class="text-xs text-gray-400 uppercase tracking-wider mb-3">題型</div>
          <div class="space-y-2">
            <div class="question-type selected border border-gray-200 rounded-xl p-3 flex items-center gap-2 text-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              單選題
            </div>
            <div class="question-type border border-gray-200 rounded-xl p-3 flex items-center gap-2 text-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>
              多選題
            </div>
            <div class="question-type border border-gray-200 rounded-xl p-3 flex items-center gap-2 text-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
              文字題
            </div>
            <div class="question-type border border-gray-200 rounded-xl p-3 flex items-center gap-2 text-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              評分題
            </div>
            <div class="question-type border border-gray-200 rounded-xl p-3 flex items-center gap-2 text-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>
              量表題
            </div>
          </div>
        </div>

        <!-- Question editor -->
        <div class="flex-1 p-6 overflow-auto">
          <div class="max-w-2xl mx-auto space-y-4">
            <div class="bg-primary/5 border-2 border-primary rounded-2xl p-5">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Q1 ・ 單選題</span>
                <div class="flex gap-1"><button class="text-gray-400 hover:text-gray-600 p-1"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg></button><button class="text-gray-400 hover:text-gray-600 p-1"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></button><button class="text-gray-400 hover:text-danger p-1"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div>
              </div>
              <input type="text" value="您對我們的產品整體滿意度如何？" class="w-full text-base font-medium text-gray-900 bg-transparent border-b-2 border-primary/30 pb-2 focus:outline-none focus:border-primary mb-4">
              <div class="space-y-2">
                <div class="option-row flex items-center gap-3 p-2 rounded-lg"><div class="w-4 h-4 rounded-full border-2 border-primary"></div><input type="text" value="非常滿意" class="flex-1 text-sm bg-transparent focus:outline-none"></div>
                <div class="option-row flex items-center gap-3 p-2 rounded-lg"><div class="w-4 h-4 rounded-full border-2 border-gray-300"></div><input type="text" value="滿意" class="flex-1 text-sm bg-transparent focus:outline-none"></div>
                <div class="option-row flex items-center gap-3 p-2 rounded-lg"><div class="w-4 h-4 rounded-full border-2 border-gray-300"></div><input type="text" value="普通" class="flex-1 text-sm bg-transparent focus:outline-none"></div>
                <div class="option-row flex items-center gap-3 p-2 rounded-lg"><div class="w-4 h-4 rounded-full border-2 border-gray-300"></div><input type="text" value="不滿意" class="flex-1 text-sm bg-transparent focus:outline-none"></div>
                <div class="option-row flex items-center gap-3 p-2 rounded-lg"><div class="w-4 h-4 rounded-full border-2 border-gray-300"></div><input type="text" value="非常不滿意" class="flex-1 text-sm bg-transparent focus:outline-none"></div>
              </div>
              <div class="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                <label class="flex items-center gap-1.5 text-xs text-gray-500"><input type="checkbox" checked class="accent-primary">必填</label>
                <label class="flex items-center gap-1.5 text-xs text-gray-500"><input type="checkbox" class="accent-primary">邏輯跳題</label>
              </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-2xl p-5 hover:border-primary/30 transition cursor-pointer">
              <div class="flex items-center justify-between mb-3"><span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Q2 ・ 評分題</span></div>
              <div class="font-medium text-gray-900 mb-3">您會推薦我們的產品給朋友嗎？（NPS）</div>
              <div class="flex gap-1.5">{[0,1,2,3,4,5,6,7,8,9,10].map(n=>`<div class="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-500 hover:bg-primary hover:text-white hover:border-primary transition cursor-pointer">${n}</div>`).join('')}</div>
            </div>

            <div class="bg-white border border-gray-200 rounded-2xl p-5 hover:border-primary/30 transition cursor-pointer">
              <div class="flex items-center justify-between mb-3"><span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Q3 ・ 多選題</span></div>
              <div class="font-medium text-gray-900 mb-3">您最常使用哪些功能？（可多選）</div>
              <div class="space-y-2">
                <div class="flex items-center gap-2"><div class="w-4 h-4 rounded border-2 border-gray-300"></div><span class="text-sm text-gray-600">數據分析</span></div>
                <div class="flex items-center gap-2"><div class="w-4 h-4 rounded border-2 border-gray-300"></div><span class="text-sm text-gray-600">報表匯出</span></div>
                <div class="flex items-center gap-2"><div class="w-4 h-4 rounded border-2 border-gray-300"></div><span class="text-sm text-gray-600">團隊協作</span></div>
                <div class="flex items-center gap-2"><div class="w-4 h-4 rounded border-2 border-gray-300"></div><span class="text-sm text-gray-600">自動化流程</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Responses -->
    <div id="page-responses" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-2xl p-4 border border-gray-100"><div class="text-xs text-gray-500 mb-1">總回覆數</div><div class="text-2xl font-bold text-primary">342</div></div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100"><div class="text-xs text-gray-500 mb-1">完成率</div><div class="text-2xl font-bold text-success">89%</div></div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100"><div class="text-xs text-gray-500 mb-1">平均作答時間</div><div class="text-2xl font-bold text-accent">4:32</div></div>
        <div class="bg-white rounded-2xl p-4 border border-gray-100"><div class="text-xs text-gray-500 mb-1">NPS 分數</div><div class="text-2xl font-bold text-teal">72</div></div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-gray-100 mb-6">
        <h3 class="font-semibold text-gray-900 mb-4">Q1: 您對我們的產品整體滿意度如何？</h3>
        <div class="space-y-2">
          <div class="flex items-center gap-3"><span class="text-sm w-24 text-gray-600">非常滿意</span><div class="flex-1 bg-gray-100 rounded-full h-6"><div class="bg-primary rounded-full h-6 flex items-center justify-end pr-2" style="width:42%"><span class="text-xs text-white font-bold">42%</span></div></div><span class="text-sm text-gray-400 w-12 text-right">144</span></div>
          <div class="flex items-center gap-3"><span class="text-sm w-24 text-gray-600">滿意</span><div class="flex-1 bg-gray-100 rounded-full h-6"><div class="bg-primaryLight rounded-full h-6 flex items-center justify-end pr-2" style="width:31%"><span class="text-xs text-white font-bold">31%</span></div></div><span class="text-sm text-gray-400 w-12 text-right">106</span></div>
          <div class="flex items-center gap-3"><span class="text-sm w-24 text-gray-600">普通</span><div class="flex-1 bg-gray-100 rounded-full h-6"><div class="bg-accent rounded-full h-6 flex items-center justify-end pr-2" style="width:18%"><span class="text-xs text-white font-bold">18%</span></div></div><span class="text-sm text-gray-400 w-12 text-right">62</span></div>
          <div class="flex items-center gap-3"><span class="text-sm w-24 text-gray-600">不滿意</span><div class="flex-1 bg-gray-100 rounded-full h-6"><div class="bg-warning rounded-full h-6 flex items-center justify-end pr-2" style="width:7%"><span class="text-xs text-white font-bold">7%</span></div></div><span class="text-sm text-gray-400 w-12 text-right">24</span></div>
          <div class="flex items-center gap-3"><span class="text-sm w-24 text-gray-600">非常不滿意</span><div class="flex-1 bg-gray-100 rounded-full h-6"><div class="bg-danger rounded-full h-6 flex items-center justify-end pr-2" style="width:2%"></div></div><span class="text-sm text-gray-400 w-12 text-right">6</span></div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-gray-100">
        <h3 class="font-semibold text-gray-900 mb-4">回覆時間趨勢</h3>
        <div class="flex items-end gap-2 h-32">
          <div class="flex-1 flex flex-col items-center"><div class="w-full bg-primary/20 rounded-t" style="height:30%"></div><span class="text-xs text-gray-400 mt-1">2/10</span></div>
          <div class="flex-1 flex flex-col items-center"><div class="w-full bg-primary/30 rounded-t" style="height:65%"></div><span class="text-xs text-gray-400 mt-1">2/11</span></div>
          <div class="flex-1 flex flex-col items-center"><div class="w-full bg-primary/40 rounded-t" style="height:90%"></div><span class="text-xs text-gray-400 mt-1">2/12</span></div>
          <div class="flex-1 flex flex-col items-center"><div class="w-full bg-primary rounded-t" style="height:75%"></div><span class="text-xs text-gray-400 mt-1">2/13</span></div>
          <div class="flex-1 flex flex-col items-center"><div class="w-full bg-primary/50 rounded-t" style="height:45%"></div><span class="text-xs text-gray-400 mt-1">2/14</span></div>
          <div class="flex-1 flex flex-col items-center"><div class="w-full bg-primary/30 rounded-t" style="height:35%"></div><span class="text-xs text-gray-400 mt-1">2/15</span></div>
          <div class="flex-1 flex flex-col items-center"><div class="w-full bg-primary/20 rounded-t" style="height:20%"></div><span class="text-xs text-gray-400 mt-1">2/16</span></div>
        </div>
      </div>
    </div>

    <!-- Analytics -->
    <div id="page-analytics" class="flex-1 overflow-auto p-6 fade-in hidden">
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 class="font-semibold text-gray-900 mb-4">功能使用分佈（Q3 多選）</h3>
          <div class="flex justify-center mb-4">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#e2e8f0" stroke-width="20"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#8b5cf6" stroke-width="20" stroke-dasharray="120 257" stroke-dashoffset="0" style="transform:rotate(-90deg);transform-origin:center"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#0ea5e9" stroke-width="20" stroke-dasharray="90 287" stroke-dashoffset="-120" style="transform:rotate(-90deg);transform-origin:center"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#10b981" stroke-width="20" stroke-dasharray="85 292" stroke-dashoffset="-210" style="transform:rotate(-90deg);transform-origin:center"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#f59e0b" stroke-width="20" stroke-dasharray="82 295" stroke-dashoffset="-295" style="transform:rotate(-90deg);transform-origin:center"/>
            </svg>
          </div>
          <div class="space-y-1.5 text-sm">
            <div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-primary"></div>數據分析</div><span class="font-bold">32%</span></div>
            <div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-sky"></div>報表匯出</div><span class="font-bold">24%</span></div>
            <div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-success"></div>團隊協作</div><span class="font-bold">22%</span></div>
            <div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-accent"></div>自動化流程</div><span class="font-bold">22%</span></div>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 class="font-semibold text-gray-900 mb-4">NPS 分佈</h3>
          <div class="flex items-end gap-1 h-32 mb-4">
            <div class="flex-1 bg-danger/60 rounded-t" style="height:8%" title="0"></div>
            <div class="flex-1 bg-danger/50 rounded-t" style="height:4%" title="1"></div>
            <div class="flex-1 bg-danger/40 rounded-t" style="height:6%" title="2"></div>
            <div class="flex-1 bg-danger/30 rounded-t" style="height:5%" title="3"></div>
            <div class="flex-1 bg-accent/40 rounded-t" style="height:8%" title="4"></div>
            <div class="flex-1 bg-accent/50 rounded-t" style="height:10%" title="5"></div>
            <div class="flex-1 bg-accent/60 rounded-t" style="height:12%" title="6"></div>
            <div class="flex-1 bg-success/40 rounded-t" style="height:18%" title="7"></div>
            <div class="flex-1 bg-success/60 rounded-t" style="height:35%" title="8"></div>
            <div class="flex-1 bg-success/80 rounded-t" style="height:55%" title="9"></div>
            <div class="flex-1 bg-success rounded-t" style="height:80%" title="10"></div>
          </div>
          <div class="flex justify-between text-xs"><span class="text-danger">批評者 (0-6): 15%</span><span class="text-accent">被動者 (7-8): 28%</span><span class="text-success">推薦者 (9-10): 57%</span></div>
          <div class="mt-3 p-3 bg-teal/5 rounded-xl text-center"><span class="text-sm text-gray-600">NPS 分數：</span><span class="text-2xl font-bold text-teal ml-1">+72</span></div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-gray-100">
        <h3 class="font-semibold text-gray-900 mb-3">交叉分析摘要</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="p-3 bg-primary/5 rounded-xl"><div class="text-xs text-gray-500 mb-1">最滿意族群</div><div class="font-bold text-sm text-primary">25-34 歲女性</div><div class="text-xs text-gray-400">滿意度 4.6/5</div></div>
          <div class="p-3 bg-success/5 rounded-xl"><div class="text-xs text-gray-500 mb-1">最受歡迎功能</div><div class="font-bold text-sm text-success">數據分析</div><div class="text-xs text-gray-400">32% 用戶選擇</div></div>
          <div class="p-3 bg-danger/5 rounded-xl"><div class="text-xs text-gray-500 mb-1">需改善</div><div class="font-bold text-sm text-danger">載入速度</div><div class="text-xs text-gray-400">28% 用戶提及</div></div>
        </div>
      </div>
    </div>
  </main>
</div>

<script>
function switchPage(page){
  document.querySelectorAll('[id^="page-"]').forEach(p=>p.classList.add('hidden'));
  document.getElementById('page-'+page).classList.remove('hidden');
  document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
  const el=document.querySelector('[data-page="'+page+'"]');
  if(el)el.classList.add('active');
  const titles={surveys:'我的問卷',builder:'問卷編輯',responses:'回覆統計',analytics:'圖表分析'};
  document.getElementById('pageTitle').textContent=titles[page]||page;
}
</script>
</body>
</html>$HTML$,
  1
)
ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  version = template_previews.version + 1,
  updated_at = NOW();
