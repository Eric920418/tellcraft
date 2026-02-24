INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  '6c45e04a-aa32-44bf-b61e-2d6f42ccacde',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DevTools Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        surface: '#1a1a1a',
        deep: '#0a0a0a',
        border: '#2a2a2a',
        'term-green': '#22c55e',
        'term-red': '#ef4444',
        'term-amber': '#fbbf24',
        'term-purple': '#a78bfa',
        'term-blue': '#60a5fa',
        'term-gray': '#6b7280',
        'term-dim': '#3f3f46',
        'term-text': '#d4d4d8',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    }
  }
}
</script>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'JetBrains Mono',monospace;background:#0a0a0a;color:#d4d4d8;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.cursor-blink{display:inline-block;width:8px;height:16px;background:#22c55e;animation:blink 1s step-end infinite;vertical-align:middle;margin-left:4px}
@keyframes flame-grow{from{width:0}to{width:var(--target-w)}}
.flame-bar{height:100%;animation:flame-grow 0.8s ease-out forwards;width:0}
@keyframes log-appear{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.log-entry{animation:log-appear 0.3s ease-out forwards}
.log-entry.hidden-log{opacity:0;transform:translateY(8px)}
@keyframes fade-in{from{opacity:0}to{opacity:1}}
.fade-in{animation:fade-in 0.4s ease-out forwards}
.tab-btn{border:none;background:transparent;color:#6b7280;font-family:'JetBrains Mono',monospace;font-size:12px;padding:8px 16px;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.15s ease;display:flex;align-items:center;gap:6px;white-space:nowrap}
.tab-btn:hover{color:#d4d4d8;background:#1a1a1a}
.tab-btn.active{color:#22c55e;border-bottom-color:#22c55e;background:#1a1a1a}
.tab-close{font-size:10px;opacity:0;transition:opacity 0.15s;padding:2px;border-radius:2px;line-height:1}
.tab-btn:hover .tab-close{opacity:0.6}
.tab-close:hover{opacity:1 !important;background:#2a2a2a}
.tooltip{position:absolute;background:#1a1a1a;border:1px solid #2a2a2a;padding:8px 12px;font-size:11px;pointer-events:none;z-index:50;opacity:0;transition:opacity 0.15s;white-space:nowrap}
.tooltip.show{opacity:1}
.panel{display:none}
.panel.active{display:block}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:#0a0a0a}
::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:#3f3f46}
</style>
</head>
<body>

<!-- IDE Chrome: Title Bar -->
<div style="background:#141414;border-bottom:1px solid #2a2a2a;padding:6px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
  <div style="display:flex;align-items:center;gap:8px">
    <div style="display:flex;gap:6px">
      <div style="width:10px;height:10px;border-radius:50%;background:#ef4444"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:#fbbf24"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:#22c55e"></div>
    </div>
    <span style="font-size:12px;color:#6b7280;margin-left:8px">DevTools_<span class="cursor-blink"></span></span>
  </div>
  <div style="display:flex;align-items:center;gap:16px">
    <span style="font-size:11px;color:#3f3f46">v2.4.1</span>
    <span style="font-size:11px;color:#22c55e">&#9679; Connected</span>
  </div>
</div>

<!-- Tab Bar -->
<div style="background:#141414;border-bottom:1px solid #2a2a2a;display:flex;align-items:stretch;flex-shrink:0;overflow-x:auto">
  <button class="tab-btn active" onclick="switchTab(this,'overview')" data-tab="overview">
    <span style="color:#22c55e;font-size:10px">&#9632;</span> Overview
    <span class="tab-close" onclick="event.stopPropagation()">&times;</span>
  </button>
  <button class="tab-btn" onclick="switchTab(this,'requests')" data-tab="requests">
    <span style="color:#60a5fa;font-size:10px">&#9632;</span> Requests
    <span class="tab-close" onclick="event.stopPropagation()">&times;</span>
  </button>
  <button class="tab-btn" onclick="switchTab(this,'logs')" data-tab="logs">
    <span style="color:#fbbf24;font-size:10px">&#9632;</span> Logs
    <span class="tab-close" onclick="event.stopPropagation()">&times;</span>
  </button>
  <div style="flex:1;border-bottom:1px solid #2a2a2a"></div>
</div>

<!-- Panel: Overview -->
<div id="panel-overview" class="panel active" style="flex:1;overflow-y:auto;display:flex;flex-direction:column">

  <!-- Terminal Header -->
  <div style="background:#0f0f0f;border-bottom:1px solid #2a2a2a;padding:20px 24px">
    <div style="font-size:13px;color:#6b7280;margin-bottom:8px">
      <span style="color:#22c55e">$</span> devtools --status<span class="cursor-blink"></span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px 32px;margin-top:12px;font-size:13px">
      <div>
        <span style="color:#6b7280">Uptime:</span>
        <span style="color:#22c55e;font-weight:600">99.97%</span>
      </div>
      <span style="color:#2a2a2a">|</span>
      <div>
        <span style="color:#6b7280">Requests/s:</span>
        <span style="color:#22c55e;font-weight:600">1,247</span>
      </div>
      <span style="color:#2a2a2a">|</span>
      <div>
        <span style="color:#6b7280">P95 Latency:</span>
        <span style="color:#fbbf24;font-weight:600">142ms</span>
      </div>
      <span style="color:#2a2a2a">|</span>
      <div>
        <span style="color:#6b7280">Error Rate:</span>
        <span style="color:#22c55e;font-weight:600">0.03%</span>
      </div>
    </div>
  </div>

  <!-- Flame Graph Section -->
  <div style="padding:20px 24px;flex:1">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Latency Flame Graph</div>
      <div style="font-size:11px;color:#3f3f46">Last 5 requests</div>
    </div>

    <!-- Legend -->
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px;font-size:11px">
      <div style="display:flex;align-items:center;gap:4px"><div style="width:10px;height:10px;background:#3f3f46"></div><span style="color:#6b7280">DNS</span></div>
      <div style="display:flex;align-items:center;gap:4px"><div style="width:10px;height:10px;background:#60a5fa"></div><span style="color:#6b7280">TCP</span></div>
      <div style="display:flex;align-items:center;gap:4px"><div style="width:10px;height:10px;background:#a78bfa"></div><span style="color:#6b7280">TLS</span></div>
      <div style="display:flex;align-items:center;gap:4px"><div style="width:10px;height:10px;background:#22c55e"></div><span style="color:#6b7280">Server</span></div>
      <div style="display:flex;align-items:center;gap:4px"><div style="width:10px;height:10px;background:#fbbf24"></div><span style="color:#6b7280">Transfer</span></div>
    </div>

    <!-- Flame Graph Rows -->
    <div id="flame-graph" style="display:flex;flex-direction:column;gap:6px">
    </div>

    <!-- Tooltip -->
    <div id="flame-tooltip" class="tooltip"></div>
  </div>

  <!-- Mini Log Preview -->
  <div style="border-top:1px solid #2a2a2a;padding:16px 24px;background:#0f0f0f">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Recent Logs</span>
      <span style="font-size:11px;color:#a78bfa;cursor:pointer" onclick="switchTab(document.querySelector('[data-tab=logs]'),'logs')">View All &rarr;</span>
    </div>
    <div style="font-size:12px;display:flex;flex-direction:column;gap:3px">
      <div style="color:#6b7280"><span style="color:#3f3f46">[14:23:05]</span> <span style="color:#22c55e">INFO</span>  GET /api/health <span style="color:#22c55e">200</span> <span style="color:#3f3f46">12ms</span></div>
      <div style="color:#6b7280"><span style="color:#3f3f46">[14:23:06]</span> <span style="color:#fbbf24">WARN</span>  GET /api/search <span style="color:#fbbf24">200</span> <span style="color:#fbbf24">891ms</span> <span style="color:#fbbf24">(slow)</span></div>
      <div style="color:#6b7280"><span style="color:#3f3f46">[14:23:07]</span> <span style="color:#22c55e">INFO</span>  POST /api/auth <span style="color:#22c55e">201</span> <span style="color:#3f3f46">45ms</span></div>
    </div>
  </div>

</div>

<!-- Panel: Requests (Flame Graph Detail) -->
<div id="panel-requests" class="panel" style="flex:1;overflow-y:auto">

  <!-- Request Header -->
  <div style="background:#0f0f0f;border-bottom:1px solid #2a2a2a;padding:20px 24px">
    <div style="font-size:13px;color:#6b7280;margin-bottom:8px">
      <span style="color:#60a5fa">$</span> devtools requests --trace<span class="cursor-blink"></span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px 32px;margin-top:12px;font-size:13px">
      <div><span style="color:#6b7280">Total:</span> <span style="color:#d4d4d8;font-weight:600">14,892</span></div>
      <span style="color:#2a2a2a">|</span>
      <div><span style="color:#6b7280">2xx:</span> <span style="color:#22c55e;font-weight:600">14,743</span></div>
      <span style="color:#2a2a2a">|</span>
      <div><span style="color:#6b7280">4xx:</span> <span style="color:#fbbf24;font-weight:600">138</span></div>
      <span style="color:#2a2a2a">|</span>
      <div><span style="color:#6b7280">5xx:</span> <span style="color:#ef4444;font-weight:600">11</span></div>
    </div>
  </div>

  <!-- Request List -->
  <div style="padding:16px 24px">
    <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Request Traces</div>

    <!-- Request table header -->
    <div style="display:grid;grid-template-columns:60px 1fr 50px 70px 1fr;gap:8px;padding:8px 12px;font-size:11px;color:#3f3f46;border-bottom:1px solid #2a2a2a">
      <span>Method</span><span>Endpoint</span><span>Status</span><span>Time</span><span>Waterfall</span>
    </div>

    <!-- Rows -->
    <div id="request-rows" style="display:flex;flex-direction:column"></div>
  </div>

</div>

<!-- Panel: Logs -->
<div id="panel-logs" class="panel" style="flex:1;overflow-y:auto;display:flex;flex-direction:column">

  <!-- Log Header -->
  <div style="background:#0f0f0f;border-bottom:1px solid #2a2a2a;padding:20px 24px">
    <div style="font-size:13px;color:#6b7280;margin-bottom:8px">
      <span style="color:#fbbf24">$</span> devtools logs --follow --level=all<span class="cursor-blink"></span>
    </div>
    <div style="display:flex;gap:12px;margin-top:12px">
      <button class="log-filter active-filter" onclick="filterLogs(this,'all')" style="background:#1a1a1a;border:1px solid #2a2a2a;color:#d4d4d8;font-family:'JetBrains Mono',monospace;font-size:11px;padding:4px 10px;cursor:pointer">ALL</button>
      <button class="log-filter" onclick="filterLogs(this,'info')" style="background:transparent;border:1px solid #2a2a2a;color:#6b7280;font-family:'JetBrains Mono',monospace;font-size:11px;padding:4px 10px;cursor:pointer">INFO</button>
      <button class="log-filter" onclick="filterLogs(this,'warn')" style="background:transparent;border:1px solid #2a2a2a;color:#6b7280;font-family:'JetBrains Mono',monospace;font-size:11px;padding:4px 10px;cursor:pointer">WARN</button>
      <button class="log-filter" onclick="filterLogs(this,'error')" style="background:transparent;border:1px solid #2a2a2a;color:#6b7280;font-family:'JetBrains Mono',monospace;font-size:11px;padding:4px 10px;cursor:pointer">ERROR</button>
    </div>
  </div>

  <!-- Log Stream -->
  <div id="log-stream" style="flex:1;overflow-y:auto;padding:12px 24px;font-size:12px;line-height:1.8"></div>

</div>

<!-- Status Bar (VS Code style) -->
<div style="background:#141414;border-top:1px solid #2a2a2a;padding:3px 12px;display:flex;align-items:center;justify-content:space-between;font-size:11px;flex-shrink:0">
  <div style="display:flex;align-items:center;gap:16px">
    <span style="color:#a78bfa">&#9736; main</span>
    <span style="color:#22c55e">&#9679; connected</span>
    <span style="color:#6b7280">ws://localhost:3100</span>
  </div>
  <div style="display:flex;align-items:center;gap:16px">
    <span style="color:#6b7280">Mem: <span style="color:#d4d4d8">247MB</span></span>
    <span style="color:#6b7280">CPU: <span style="color:#22c55e">12%</span></span>
    <span style="color:#6b7280">Node 20.11</span>
    <span style="color:#3f3f46">UTF-8</span>
  </div>
</div>

<script>
/* === Data === */
var flameData = [
  {endpoint:'GET /api/users',status:200,dns:5,tcp:12,tls:23,server:89,transfer:13,total:142},
  {endpoint:'POST /api/deploy',status:201,dns:3,tcp:8,tls:18,server:234,transfer:42,total:305},
  {endpoint:'GET /api/health',status:200,dns:2,tcp:5,tls:0,server:8,transfer:2,total:17},
  {endpoint:'GET /api/search',status:200,dns:4,tcp:10,tls:20,server:412,transfer:89,total:535},
  {endpoint:'POST /api/auth',status:200,dns:3,tcp:9,tls:22,server:45,transfer:6,total:85},
  {endpoint:'GET /api/projects',status:200,dns:4,tcp:11,tls:21,server:67,transfer:18,total:121},
  {endpoint:'PUT /api/settings',status:200,dns:3,tcp:7,tls:19,server:156,transfer:8,total:193},
  {endpoint:'DELETE /api/cache',status:204,dns:2,tcp:6,tls:15,server:12,transfer:1,total:36}
];

var logData = [
  {time:'14:22:58',level:'info',method:'GET',path:'/api/health',status:200,ms:8},
  {time:'14:22:59',level:'info',method:'GET',path:'/api/users',status:200,ms:142},
  {time:'14:23:00',level:'info',method:'POST',path:'/api/auth/login',status:200,ms:67},
  {time:'14:23:01',level:'info',method:'GET',path:'/api/projects',status:200,ms:89},
  {time:'14:23:01',level:'warn',method:'GET',path:'/api/search?q=deploy',status:200,ms:892,note:'slow'},
  {time:'14:23:02',level:'info',method:'PUT',path:'/api/settings',status:200,ms:156},
  {time:'14:23:02',level:'error',method:'POST',path:'/api/deploy',status:500,ms:34,note:'Internal Server Error'},
  {time:'14:23:03',level:'info',method:'GET',path:'/api/metrics',status:200,ms:23},
  {time:'14:23:04',level:'warn',method:'GET',path:'/api/logs?limit=1000',status:200,ms:1247,note:'slow'},
  {time:'14:23:05',level:'info',method:'DELETE',path:'/api/cache/stale',status:204,ms:12},
  {time:'14:23:06',level:'error',method:'POST',path:'/api/webhooks/notify',status:502,ms:5002,note:'Bad Gateway'},
  {time:'14:23:07',level:'info',method:'GET',path:'/api/health',status:200,ms:6},
  {time:'14:23:08',level:'info',method:'POST',path:'/api/deploy',status:201,ms:305},
  {time:'14:23:09',level:'info',method:'GET',path:'/api/users/me',status:200,ms:34},
  {time:'14:23:10',level:'warn',method:'GET',path:'/api/analytics',status:200,ms:756,note:'slow'},
  {time:'14:23:11',level:'info',method:'PATCH',path:'/api/projects/42',status:200,ms:98},
  {time:'14:23:12',level:'info',method:'GET',path:'/api/deployments',status:200,ms:112},
  {time:'14:23:13',level:'error',method:'POST',path:'/api/build',status:500,ms:18,note:'Build failed: OOM'},
  {time:'14:23:14',level:'info',method:'GET',path:'/api/health',status:200,ms:5},
  {time:'14:23:15',level:'info',method:'GET',path:'/api/projects',status:200,ms:78}
];

var currentLogFilter = 'all';

/* === Tab Switching === */
function switchTab(btn, name) {
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active');p.style.display='none'});
  var panel = document.getElementById('panel-'+name);
  panel.classList.add('active');
  panel.style.display = 'flex';
  if(name === 'logs') startLogStream();
  if(name === 'requests') buildRequestRows();
}

/* === Flame Graph === */
function buildFlameGraph() {
  var container = document.getElementById('flame-graph');
  container.innerHTML = '';
  var maxTotal = 0;
  flameData.forEach(function(d){ if(d.total > maxTotal) maxTotal = d.total; });

  flameData.forEach(function(d, idx) {
    var row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:180px 1fr 60px;gap:12px;align-items:center;padding:6px 12px;border:1px solid #2a2a2a;background:#0f0f0f';

    var statusColor = d.status < 300 ? '#22c55e' : d.status < 400 ? '#60a5fa' : d.status < 500 ? '#fbbf24' : '#ef4444';

    row.innerHTML = '<div style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><span style="color:'+statusColor+';font-size:11px">'+d.status+'</span> <span style="color:#d4d4d8">'+d.endpoint+'</span></div>'
      + '<div style="height:22px;display:flex;position:relative;background:#141414;overflow:hidden" data-row="'+idx+'">'
        + '<div class="flame-bar" style="--target-w:'+pct(d.dns,maxTotal)+'%;background:#3f3f46;animation-delay:'+(idx*0.1)+'s" data-label="DNS '+d.dns+'ms"></div>'
        + '<div class="flame-bar" style="--target-w:'+pct(d.tcp,maxTotal)+'%;background:#60a5fa;animation-delay:'+(idx*0.1+0.05)+'s" data-label="TCP '+d.tcp+'ms"></div>'
        + '<div class="flame-bar" style="--target-w:'+pct(d.tls,maxTotal)+'%;background:#a78bfa;animation-delay:'+(idx*0.1+0.1)+'s" data-label="TLS '+d.tls+'ms"></div>'
        + '<div class="flame-bar" style="--target-w:'+pct(d.server,maxTotal)+'%;background:#22c55e;animation-delay:'+(idx*0.1+0.15)+'s" data-label="Server '+d.server+'ms"></div>'
        + '<div class="flame-bar" style="--target-w:'+pct(d.transfer,maxTotal)+'%;background:#fbbf24;animation-delay:'+(idx*0.1+0.2)+'s" data-label="Transfer '+d.transfer+'ms"></div>'
      + '</div>'
      + '<div style="font-size:11px;text-align:right;color:#6b7280">'+d.total+'ms</div>';

    container.appendChild(row);
  });

  // Tooltip on hover
  var tooltip = document.getElementById('flame-tooltip');
  container.addEventListener('mousemove', function(e) {
    var bar = e.target.closest('.flame-bar');
    if (bar) {
      tooltip.textContent = bar.getAttribute('data-label');
      tooltip.style.left = (e.clientX + 12) + 'px';
      tooltip.style.top = (e.clientY - 30) + 'px';
      tooltip.classList.add('show');
    } else {
      tooltip.classList.remove('show');
    }
  });
  container.addEventListener('mouseleave', function() {
    tooltip.classList.remove('show');
  });
}

function pct(val, max) {
  return Math.max(((val / max) * 100).toFixed(1), 1.5);
}

/* === Request Rows (Requests Tab) === */
function buildRequestRows() {
  var container = document.getElementById('request-rows');
  if (container.children.length > 0) return;
  var maxTotal = 0;
  flameData.forEach(function(d){ if(d.total > maxTotal) maxTotal = d.total; });

  flameData.forEach(function(d, idx) {
    var parts = d.endpoint.split(' ');
    var method = parts[0];
    var path = parts[1];
    var methodColor = method === 'GET' ? '#60a5fa' : method === 'POST' ? '#22c55e' : method === 'PUT' ? '#fbbf24' : method === 'DELETE' ? '#ef4444' : '#6b7280';
    var statusColor = d.status < 300 ? '#22c55e' : d.status < 400 ? '#60a5fa' : d.status < 500 ? '#fbbf24' : '#ef4444';
    var timeColor = d.total < 100 ? '#22c55e' : d.total < 300 ? '#fbbf24' : '#ef4444';

    var row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:60px 1fr 50px 70px 1fr;gap:8px;padding:10px 12px;font-size:12px;border-bottom:1px solid #1a1a1a;align-items:center;transition:background 0.1s;cursor:default';
    row.onmouseenter = function(){this.style.background='#141414'};
    row.onmouseleave = function(){this.style.background='transparent'};

    row.innerHTML = '<span style="color:'+methodColor+';font-weight:600;font-size:11px">'+method+'</span>'
      + '<span style="color:#d4d4d8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+path+'</span>'
      + '<span style="color:'+statusColor+'">'+d.status+'</span>'
      + '<span style="color:'+timeColor+'">'+d.total+'ms</span>'
      + '<div style="height:14px;display:flex;background:#141414;overflow:hidden;border:1px solid #2a2a2a">'
        + '<div style="width:'+pct(d.dns,maxTotal)+'%;background:#3f3f46;height:100%"></div>'
        + '<div style="width:'+pct(d.tcp,maxTotal)+'%;background:#60a5fa;height:100%"></div>'
        + '<div style="width:'+pct(d.tls,maxTotal)+'%;background:#a78bfa;height:100%"></div>'
        + '<div style="width:'+pct(d.server,maxTotal)+'%;background:#22c55e;height:100%"></div>'
        + '<div style="width:'+pct(d.transfer,maxTotal)+'%;background:#fbbf24;height:100%"></div>'
      + '</div>';

    container.appendChild(row);
  });
}

/* === Log Stream === */
var logStreamRunning = false;
var logIndex = 0;

function startLogStream() {
  if (logStreamRunning) return;
  logStreamRunning = true;
  logIndex = 0;
  var container = document.getElementById('log-stream');
  container.innerHTML = '';
  addNextLog();
}

function addNextLog() {
  if (logIndex >= logData.length) {
    // Loop: restart after a pause
    setTimeout(function(){
      logIndex = 0;
      var container = document.getElementById('log-stream');
      container.innerHTML = '';
      logStreamRunning = false;
      // Only restart if logs tab is visible
      if(document.getElementById('panel-logs').classList.contains('active')) startLogStream();
    }, 2000);
    return;
  }

  var entry = logData[logIndex];
  var container = document.getElementById('log-stream');

  if (currentLogFilter !== 'all' && entry.level !== currentLogFilter) {
    logIndex++;
    addNextLog();
    return;
  }

  var levelColor = entry.level === 'info' ? '#22c55e' : entry.level === 'warn' ? '#fbbf24' : '#ef4444';
  var statusColor = entry.status < 300 ? '#22c55e' : entry.status < 400 ? '#60a5fa' : entry.status < 500 ? '#fbbf24' : '#ef4444';
  var msColor = entry.ms < 100 ? '#3f3f46' : entry.ms < 500 ? '#fbbf24' : '#ef4444';
  var levelPad = entry.level === 'info' ? 'INFO ' : entry.level === 'warn' ? 'WARN ' : 'ERROR';

  var line = document.createElement('div');
  line.className = 'log-entry';
  line.setAttribute('data-level', entry.level);
  line.innerHTML = '<span style="color:#3f3f46">[2026-02-24 '+entry.time+']</span> '
    + '<span style="color:'+levelColor+';font-weight:500">'+levelPad+'</span> '
    + '<span style="color:#6b7280">'+entry.method+'</span> '
    + '<span style="color:#d4d4d8">'+entry.path+'</span> '
    + '<span style="color:'+statusColor+'">'+entry.status+'</span> '
    + '<span style="color:'+msColor+'">'+entry.ms+'ms</span>'
    + (entry.note ? ' <span style="color:'+levelColor+'">('+entry.note+')</span>' : '');

  container.appendChild(line);
  container.scrollTop = container.scrollHeight;

  logIndex++;
  setTimeout(addNextLog, 180 + Math.random() * 220);
}

function filterLogs(btn, level) {
  currentLogFilter = level;
  document.querySelectorAll('.log-filter').forEach(function(b){
    b.style.background = 'transparent';
    b.style.color = '#6b7280';
  });
  btn.style.background = '#1a1a1a';
  btn.style.color = '#d4d4d8';

  // Restart log stream with new filter
  logStreamRunning = false;
  logIndex = 0;
  document.getElementById('log-stream').innerHTML = '';
  startLogStream();
}

/* === Init === */
buildFlameGraph();

/* Auto-scroll for the overview log preview area - not needed since it's static */

/* Responsive: handle narrow screens - stack flame graph label */
(function(){
  var mq = window.matchMedia('(max-width: 640px)');
  function handleResize(e) {
    var rows = document.querySelectorAll('#flame-graph > div');
    rows.forEach(function(r){
      if(e.matches) {
        r.style.gridTemplateColumns = '1fr';
        r.style.gap = '4px';
      } else {
        r.style.gridTemplateColumns = '180px 1fr 60px';
        r.style.gap = '12px';
      }
    });
  }
  mq.addListener(handleResize);
  handleResize(mq);
})();
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
