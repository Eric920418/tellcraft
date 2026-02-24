INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'dde421fe-44d5-4392-842f-4b82b203e925',
  $HTML$<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Notes</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{brown:{50:'#fdf8f0',100:'#f5ead6',200:'#e8d5b0',300:'#d4b896',400:'#b8946a',500:'#96704a',600:'#78350f',700:'#633012',800:'#4a2410',900:'#361a0c'},paper:'#faf9f6',paperDark:'#f5f3ef',paperBorder:'#e8e4dd',warmGray:{50:'#faf9f7',100:'#f0eee9',200:'#e2dfd8',300:'#ccc8be',400:'#a8a196',500:'#8a8279',600:'#6b6459',700:'#524d44',800:'#3d3831',900:'#2a2622'}},fontFamily:{serif:['Lora','Georgia','serif'],sans:['Source Sans 3','system-ui','sans-serif']}}}}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Source Sans 3',sans-serif;background:#faf9f6;overflow:hidden;height:100vh;color:#3d3831}

/* Sidebar */
.tree-item{display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:4px;cursor:pointer;transition:background .15s;font-size:14px;color:#6b6459;user-select:none}
.tree-item:hover{background:#f0eee9}
.tree-item.active{background:#f5ead6;color:#78350f;font-weight:600}
.tree-toggle{width:16px;height:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .15s}
.tree-toggle.open{transform:rotate(90deg)}
.tree-children{overflow:hidden;transition:max-height .2s ease}
.tree-children.collapsed{max-height:0}
.tree-children.expanded{max-height:500px}

/* Editor */
.editor-title{font-family:'Lora',Georgia,serif;font-size:32px;font-weight:700;color:#2a2622;line-height:1.3;outline:none;border:none;width:100%}
.editor-title::placeholder{color:#ccc8be}
.editor-block{position:relative;font-family:'Lora',Georgia,serif;line-height:1.8;color:#3d3831}
.editor-block h2{font-family:'Lora',Georgia,serif;font-size:20px;font-weight:600;color:#2a2622;margin-bottom:6px}
.editor-block p{margin-bottom:4px;font-size:15.5px}
.editor-block ul{padding-left:24px;margin-bottom:4px;font-size:15.5px}
.editor-block ul li{margin-bottom:3px;color:#524d44}
.editor-block ul li::marker{color:#b8946a}

/* Block insert cursor */
.block-divider{position:relative;height:2px;margin:2px 0;opacity:0;transition:opacity .2s}
.block-divider:hover,.block-divider.visible{opacity:1}
.block-divider::before{content:'';position:absolute;top:50%;left:0;right:0;height:1px;background:#e8e4dd;transform:translateY(-50%)}
.block-insert-btn{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:50%;background:#faf9f6;border:1px solid #d4b896;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2;transition:all .2s;color:#96704a}
.block-insert-btn:hover{background:#78350f;border-color:#78350f;color:#fff}
.block-divider:hover .block-insert-btn,.block-divider.visible .block-insert-btn{animation:pulseGlow 2s ease-in-out infinite}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(120,53,15,.15)}50%{box-shadow:0 0 0 8px rgba(120,53,15,.0)}}

/* Table */
.note-table{width:100%;border-collapse:collapse;font-family:'Source Sans 3',sans-serif;font-size:14px;margin:4px 0}
.note-table th{text-align:left;padding:8px 12px;font-weight:600;color:#78350f;background:#fdf8f0;border:1px solid #e8e4dd;font-size:13px}
.note-table td{padding:8px 12px;border:1px solid #e8e4dd;color:#524d44}

/* Toggle/callout block */
.toggle-block{border:1px solid #e8e4dd;border-radius:6px;overflow:hidden}
.toggle-header{display:flex;align-items:center;gap:8px;padding:10px 14px;cursor:pointer;font-weight:600;color:#2a2622;font-size:15px;font-family:'Source Sans 3',sans-serif;transition:background .15s}
.toggle-header:hover{background:#f5f3ef}
.toggle-arrow{transition:transform .2s;flex-shrink:0}
.toggle-arrow.open{transform:rotate(90deg)}
.toggle-content{padding:0 14px 12px 36px;font-family:'Lora',Georgia,serif;font-size:14.5px;line-height:1.7;color:#524d44;display:none}
.toggle-content.open{display:block}

/* Word count bar */
.word-bar{height:3px;background:#e8e4dd;border-radius:99px;overflow:hidden;width:120px}
.word-bar-fill{height:100%;background:#b8946a;border-radius:99px;transition:width .3s}

/* Breadcrumb */
.breadcrumb{font-family:'Source Sans 3',sans-serif;font-size:13px;color:#a8a196;display:flex;align-items:center;gap:4px}
.breadcrumb span.crumb{cursor:pointer;transition:color .15s}
.breadcrumb span.crumb:hover{color:#78350f}

/* Scrollbar */
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#ccc8be;border-radius:99px}
::-webkit-scrollbar-track{background:transparent}
</style>
</head>
<body>
<div class="flex h-screen">

  <!-- Left Sidebar: Page Tree -->
  <aside class="w-60 bg-paper border-r border-paperBorder flex flex-col flex-shrink-0" style="border-right:1px solid #e8e4dd">
    <!-- Workspace name -->
    <div class="px-3 pt-4 pb-3 flex items-center justify-between" style="border-bottom:1px solid #e8e4dd">
      <div class="flex items-center gap-2 cursor-pointer group">
        <div class="w-6 h-6 rounded bg-brown-600 flex items-center justify-center flex-shrink-0">
          <span class="text-white text-xs font-bold" style="font-family:'Source Sans 3',sans-serif">M</span>
        </div>
        <span class="font-semibold text-sm text-warmGray-800" style="font-family:'Source Sans 3',sans-serif">My Notes</span>
        <svg class="text-warmGray-400 group-hover:text-warmGray-600 transition-colors" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>

    <!-- Page tree -->
    <nav class="flex-1 overflow-auto px-2 py-3 space-y-0.5">
      <!-- Getting Started (page) -->
      <div class="tree-item" onclick="selectPage(this,'getting-started')">
        <span class="tree-toggle" style="visibility:hidden"></span>
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" class="flex-shrink-0" style="color:#a8a196"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>Getting Started</span>
      </div>

      <!-- Projects (folder, expanded) -->
      <div>
        <div class="tree-item" onclick="toggleFolder(this)">
          <span class="tree-toggle open"><svg width="10" height="10" fill="currentColor" viewBox="0 0 10 10"><polygon points="3,1 8,5 3,9"/></svg></span>
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" class="flex-shrink-0" style="color:#b8946a"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          <span>Projects</span>
        </div>
        <div class="tree-children expanded" style="padding-left:16px">
          <div class="tree-item" onclick="selectPage(this,'project-alpha')" style="padding-left:12px">
            <span class="tree-toggle" style="visibility:hidden"></span>
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" class="flex-shrink-0" style="color:#a8a196"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Project Alpha</span>
          </div>
          <div class="tree-item active" onclick="selectPage(this,'q1-planning')" style="padding-left:12px">
            <span class="tree-toggle" style="visibility:hidden"></span>
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" class="flex-shrink-0" style="color:#a8a196"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span style="font-weight:600">Q1 Planning</span>
          </div>
          <div class="tree-item" onclick="selectPage(this,'meeting-notes')" style="padding-left:12px">
            <span class="tree-toggle" style="visibility:hidden"></span>
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" class="flex-shrink-0" style="color:#a8a196"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Meeting Notes</span>
          </div>
        </div>
      </div>

      <!-- Personal (folder, collapsed) -->
      <div>
        <div class="tree-item" onclick="toggleFolder(this)">
          <span class="tree-toggle"><svg width="10" height="10" fill="currentColor" viewBox="0 0 10 10"><polygon points="3,1 8,5 3,9"/></svg></span>
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" class="flex-shrink-0" style="color:#b8946a"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          <span>Personal</span>
        </div>
        <div class="tree-children collapsed" style="padding-left:16px">
          <div class="tree-item" onclick="selectPage(this,'reading-list')" style="padding-left:12px">
            <span class="tree-toggle" style="visibility:hidden"></span>
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" class="flex-shrink-0" style="color:#a8a196"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Reading List</span>
          </div>
          <div class="tree-item" onclick="selectPage(this,'ideas')" style="padding-left:12px">
            <span class="tree-toggle" style="visibility:hidden"></span>
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" class="flex-shrink-0" style="color:#a8a196"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Ideas</span>
          </div>
        </div>
      </div>

      <!-- Quick Notes (page) -->
      <div class="tree-item" onclick="selectPage(this,'quick-notes')">
        <span class="tree-toggle" style="visibility:hidden"></span>
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" class="flex-shrink-0" style="color:#a8a196"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>Quick Notes</span>
      </div>
    </nav>

    <!-- New Page button -->
    <div class="px-3 pb-3" style="border-top:1px solid #e8e4dd;padding-top:12px">
      <button class="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors" style="font-family:'Source Sans 3',sans-serif;color:#78350f;background:#fdf8f0;border:1px solid #e8e4dd" onmouseover="this.style.background='#f5ead6'" onmouseout="this.style.background='#fdf8f0'">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Page
      </button>
    </div>
  </aside>

  <!-- Editor Area -->
  <main class="flex-1 flex flex-col overflow-hidden" style="background:#faf9f6">

    <!-- Breadcrumb bar -->
    <div class="px-10 pt-6 pb-0">
      <div class="breadcrumb">
        <span class="crumb">Projects</span>
        <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        <span class="crumb" style="color:#78350f;font-weight:500">Q1 Planning</span>
      </div>
    </div>

    <!-- Editor content -->
    <div class="flex-1 overflow-auto px-10 py-6" id="editor-scroll">
      <div style="max-width:680px">

        <!-- Title -->
        <div class="editor-title" style="margin-bottom:24px">Q1 Planning 2024</div>

        <!-- Block: H2 Objectives -->
        <div class="editor-block" style="margin-bottom:4px">
          <h2>Objectives</h2>
        </div>

        <!-- Block: Bullet list -->
        <div class="editor-block" style="margin-bottom:4px">
          <ul>
            <li>Launch the redesigned dashboard to 100% of users by end of February</li>
            <li>Reduce average page load time below 1.2 seconds across all key flows</li>
            <li>Ship mobile-responsive editor and achieve 30% mobile engagement lift</li>
          </ul>
        </div>

        <!-- SIGNATURE: Block insert cursor (visible for demo) -->
        <div class="block-divider visible" id="signature-divider">
          <div class="block-insert-btn">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>

        <!-- Block: H2 Timeline -->
        <div class="editor-block" style="margin-bottom:4px">
          <h2>Timeline</h2>
        </div>

        <!-- Block: Table -->
        <div class="editor-block" style="margin-bottom:6px">
          <table class="note-table">
            <thead>
              <tr>
                <th style="width:30%">Phase</th>
                <th style="width:35%">Dates</th>
                <th style="width:35%">Owner</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Research & Scoping</td>
                <td>Jan 8 &ndash; Jan 19</td>
                <td>Emily Chen</td>
              </tr>
              <tr>
                <td>Design & Prototype</td>
                <td>Jan 22 &ndash; Feb 9</td>
                <td>Marcus Lee</td>
              </tr>
              <tr>
                <td>Implementation</td>
                <td>Feb 12 &ndash; Mar 15</td>
                <td>Dev Team</td>
              </tr>
              <tr>
                <td>QA & Launch</td>
                <td>Mar 18 &ndash; Mar 29</td>
                <td>Sarah Kim</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Hidden block divider (shows on hover) -->
        <div class="block-divider" onmouseenter="this.classList.add('visible')" onmouseleave="this.classList.remove('visible')">
          <div class="block-insert-btn">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>

        <!-- Block: Toggle/callout -->
        <div class="editor-block" style="margin-bottom:6px">
          <div class="toggle-block">
            <div class="toggle-header" onclick="toggleExpand(this)">
              <span class="toggle-arrow open"><svg width="10" height="10" fill="currentColor" viewBox="0 0 10 10"><polygon points="3,1 8,5 3,9"/></svg></span>
              <span style="font-size:16px;margin-right:2px">&#128204;</span>
              <span>Key Decisions</span>
            </div>
            <div class="toggle-content open">
              <p style="margin-bottom:6px">Agreed to prioritize mobile editor over desktop feature parity for Q1. The mobile user base has grown 47% since Q3, and current mobile experience is significantly behind.</p>
              <p>Budget allocated: $45K for external design review. Timeline risk: dependency on API team for the new real-time sync endpoint (ETA Feb 2).</p>
            </div>
          </div>
        </div>

        <!-- Hidden block divider -->
        <div class="block-divider" onmouseenter="this.classList.add('visible')" onmouseleave="this.classList.remove('visible')">
          <div class="block-insert-btn">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>

        <!-- Block: Paragraph -->
        <div class="editor-block" style="margin-bottom:4px">
          <p>Next sync is scheduled for January 15th. Bring updated wireframes and the competitor analysis doc. Stakeholder review will happen on the 19th&mdash;make sure the prototype is interactive by then.</p>
        </div>

        <!-- Final block divider -->
        <div class="block-divider" onmouseenter="this.classList.add('visible')" onmouseleave="this.classList.remove('visible')">
          <div class="block-insert-btn">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>

      </div>
    </div>

    <!-- Word Count Bar -->
    <div class="flex items-center justify-between px-10 flex-shrink-0" style="height:36px;border-top:1px solid #e8e4dd;background:#f5f3ef;font-family:'Source Sans 3',sans-serif">
      <div class="flex items-center gap-5 text-xs" style="color:#8a8279">
        <span>342 words</span>
        <span>&bull;</span>
        <span>1,847 characters</span>
        <span>&bull;</span>
        <span>Last edited 2h ago</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="word-bar">
          <div class="word-bar-fill" style="width:34%"></div>
        </div>
        <span class="text-xs" style="color:#a8a196">342 / 1000</span>
      </div>
    </div>

  </main>
</div>

<script>
// Tree item selection
function selectPage(el, id) {
  document.querySelectorAll('.tree-item').forEach(function(item) {
    item.classList.remove('active');
  });
  el.classList.add('active');
}

// Folder toggle
function toggleFolder(el) {
  var toggle = el.querySelector('.tree-toggle');
  var children = el.parentElement.querySelector('.tree-children');
  if (!children) return;
  if (children.classList.contains('expanded')) {
    children.classList.remove('expanded');
    children.classList.add('collapsed');
    toggle.classList.remove('open');
  } else {
    children.classList.remove('collapsed');
    children.classList.add('expanded');
    toggle.classList.add('open');
  }
}

// Toggle/callout expand/collapse
function toggleExpand(header) {
  var arrow = header.querySelector('.toggle-arrow');
  var content = header.nextElementSibling;
  if (content.classList.contains('open')) {
    content.classList.remove('open');
    arrow.classList.remove('open');
  } else {
    content.classList.add('open');
    arrow.classList.add('open');
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
