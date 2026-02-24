INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'fc3fdafe-3022-49fc-b814-97b10c276dd3',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DealFlow CRM Pipeline</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { outfit: ['Outfit', 'sans-serif'] },
      colors: {
        coral: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#e11d48', 600: '#be123c', 700: '#9f1239' },
        charcoal: { 50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e3', 300: '#d6d3d1', 400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c', 800: '#292524', 900: '#1c1917' },
        cream: { 50: '#fffbf7', 100: '#fef7ed', 200: '#fef0d9' }
      }
    }
  }
}
</script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Outfit', sans-serif; background: #fffbf7; color: #1c1917; overflow-x: hidden; height: 100vh; display: flex; flex-direction: column; }

/* Layered card shadows */
.deal-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.1);
  position: relative;
}
.deal-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.14);
}
.deal-card:hover .card-actions {
  opacity: 1;
  pointer-events: auto;
}
.card-actions {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
}
.card-actions button {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e7e5e3;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.15s;
}
.card-actions button:hover {
  background: #ffe4e6;
  border-color: #fda4af;
}

/* Pipeline column */
.pipeline-col {
  min-width: 220px;
  flex: 1;
  background: #fafaf9;
  border-radius: 14px;
  padding: 14px;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}
.pipeline-col.collapsed .col-body {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  margin-top: 0;
  padding: 0;
}
.pipeline-col .col-body {
  max-height: 2000px;
  opacity: 1;
  transition: max-height 0.4s ease, opacity 0.3s ease;
  margin-top: 12px;
  flex: 1;
}
.col-header {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px;
}
.col-header:hover .collapse-icon {
  opacity: 1;
}
.collapse-icon {
  opacity: 0.4;
  transition: opacity 0.2s, transform 0.3s;
  font-size: 11px;
  color: #78716c;
}
.pipeline-col.collapsed .collapse-icon {
  transform: rotate(-90deg);
}

/* Avatar */
.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}

/* Varying widths by deal value */
.deal-w-sm { min-width: 180px; max-width: 200px; }
.deal-w-md { min-width: 200px; max-width: 240px; }
.deal-w-lg { min-width: 240px; max-width: 280px; }
.deal-w-xl { min-width: 270px; max-width: 320px; }

/* Constellation */
.constellation-node {
  fill: #fda4af;
  opacity: 0.6;
}
.constellation-line {
  stroke: #fecdd3;
  stroke-width: 1;
  opacity: 0.35;
}
.constellation-node-accent {
  fill: #e11d48;
  opacity: 0.45;
}

/* Scrollbar */
.pipeline-scroll::-webkit-scrollbar { height: 6px; }
.pipeline-scroll::-webkit-scrollbar-track { background: transparent; }
.pipeline-scroll::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 3px; }
.pipeline-scroll::-webkit-scrollbar-thumb:hover { background: #a8a29e; }

/* Subtle pulse for new deals */
@keyframes subtle-pulse {
  0%, 100% { box-shadow: 0 2px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.1); }
  50% { box-shadow: 0 2px 4px rgba(225,29,72,0.1), 0 8px 24px rgba(225,29,72,0.15); }
}
.deal-new { animation: subtle-pulse 2.5s ease-in-out infinite; }

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #292524;
  color: #fff;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  transform: translateY(80px);
  opacity: 0;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 9999;
  font-family: 'Outfit', sans-serif;
}
.toast.show { transform: translateY(0); opacity: 1; }
</style>
</head>
<body>

<div class="toast" id="toast"></div>

<!-- Background Constellation SVG -->
<svg style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
  <!-- Connection lines -->
  <line x1="120" y1="80" x2="320" y2="160" class="constellation-line"/>
  <line x1="320" y1="160" x2="280" y2="340" class="constellation-line"/>
  <line x1="280" y1="340" x2="480" y2="420" class="constellation-line"/>
  <line x1="480" y1="420" x2="680" y2="360" class="constellation-line"/>
  <line x1="680" y1="360" x2="820" y2="520" class="constellation-line"/>
  <line x1="820" y1="520" x2="1040" y2="440" class="constellation-line"/>
  <line x1="1040" y1="440" x2="1200" y2="280" class="constellation-line"/>
  <line x1="1200" y1="280" x2="1340" y2="180" class="constellation-line"/>
  <line x1="320" y1="160" x2="680" y2="360" class="constellation-line"/>
  <line x1="120" y1="80" x2="280" y2="340" class="constellation-line"/>
  <line x1="480" y1="420" x2="820" y2="520" class="constellation-line"/>
  <line x1="1040" y1="440" x2="1340" y2="180" class="constellation-line"/>
  <line x1="680" y1="360" x2="1040" y2="440" class="constellation-line"/>
  <line x1="120" y1="80" x2="480" y2="420" class="constellation-line" style="opacity:0.15"/>
  <line x1="820" y1="520" x2="1340" y2="180" class="constellation-line" style="opacity:0.15"/>
  <!-- Additional cross-links -->
  <line x1="200" y1="680" x2="480" y2="420" class="constellation-line" style="opacity:0.2"/>
  <line x1="200" y1="680" x2="280" y2="340" class="constellation-line" style="opacity:0.2"/>
  <line x1="1100" y1="700" x2="820" y2="520" class="constellation-line" style="opacity:0.2"/>
  <line x1="1100" y1="700" x2="1040" y2="440" class="constellation-line" style="opacity:0.2"/>
  <line x1="600" y1="780" x2="480" y2="420" class="constellation-line" style="opacity:0.15"/>
  <line x1="600" y1="780" x2="820" y2="520" class="constellation-line" style="opacity:0.15"/>
  <!-- Nodes -->
  <circle cx="120" cy="80" r="6" class="constellation-node"/>
  <circle cx="320" cy="160" r="8" class="constellation-node-accent"/>
  <circle cx="280" cy="340" r="5" class="constellation-node"/>
  <circle cx="480" cy="420" r="9" class="constellation-node-accent"/>
  <circle cx="680" cy="360" r="6" class="constellation-node"/>
  <circle cx="820" cy="520" r="7" class="constellation-node-accent"/>
  <circle cx="1040" cy="440" r="5" class="constellation-node"/>
  <circle cx="1200" cy="280" r="8" class="constellation-node"/>
  <circle cx="1340" cy="180" r="6" class="constellation-node-accent"/>
  <circle cx="200" cy="680" r="4" class="constellation-node"/>
  <circle cx="1100" cy="700" r="5" class="constellation-node"/>
  <circle cx="600" cy="780" r="4" class="constellation-node"/>
  <!-- Tiny decorative dots -->
  <circle cx="50" cy="400" r="2" class="constellation-node" style="opacity:0.3"/>
  <circle cx="900" cy="120" r="2.5" class="constellation-node" style="opacity:0.3"/>
  <circle cx="1380" cy="600" r="2" class="constellation-node" style="opacity:0.25"/>
  <circle cx="750" cy="800" r="2" class="constellation-node" style="opacity:0.2"/>
  <circle cx="400" cy="60" r="2" class="constellation-node" style="opacity:0.25"/>
</svg>

<!-- Top Bar -->
<header style="position:relative;z-index:10;background:rgba(255,251,247,0.88);backdrop-filter:blur(12px);border-bottom:1px solid #e7e5e3;padding:12px 24px;flex-shrink:0">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
    <!-- Left: Logo + Title -->
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#e11d48,#be123c);display:flex;align-items:center;justify-content:center">
        <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v-2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
      </div>
      <div>
        <div style="font-weight:700;font-size:17px;color:#1c1917;letter-spacing:-0.02em">DealFlow</div>
        <div style="font-size:11px;color:#78716c;font-weight:400;margin-top:-2px">CRM Pipeline</div>
      </div>
    </div>

    <!-- Center: Search -->
    <div style="flex:1;max-width:360px;position:relative">
      <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);opacity:0.4" width="16" height="16" fill="none" stroke="#78716c" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input type="text" placeholder="Search deals, contacts..." style="width:100%;padding:9px 12px 9px 36px;border:1px solid #e7e5e3;border-radius:10px;font-family:'Outfit',sans-serif;font-size:13px;background:#fff;color:#1c1917;outline:none;transition:border-color 0.2s" onfocus="this.style.borderColor='#fda4af'" onblur="this.style.borderColor='#e7e5e3'"/>
    </div>

    <!-- Right: Add Deal + Avatar -->
    <div style="display:flex;align-items:center;gap:12px">
      <button onclick="showToast('New deal form opened')" style="background:#e11d48;color:#fff;border:none;padding:8px 18px;border-radius:9px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s" onmouseover="this.style.background='#be123c'" onmouseout="this.style.background='#e11d48'">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        Add Deal
      </button>
      <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#e11d48,#fb7185);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:600;cursor:pointer" onclick="showToast('Profile settings')">JC</div>
    </div>
  </div>
</header>

<!-- Pipeline Summary Bar -->
<div style="position:relative;z-index:10;background:rgba(255,251,247,0.7);backdrop-filter:blur(8px);border-bottom:1px solid #f5f5f4;padding:10px 24px;flex-shrink:0">
  <div style="display:flex;align-items:center;gap:32px;justify-content:flex-start">
    <div style="display:flex;align-items:center;gap:8px">
      <div style="width:8px;height:8px;border-radius:50%;background:#e11d48"></div>
      <span style="font-size:12px;color:#78716c;font-weight:500">Total Pipeline</span>
      <span style="font-size:16px;font-weight:700;color:#1c1917">$2.4M</span>
    </div>
    <div style="width:1px;height:20px;background:#e7e5e3"></div>
    <div style="display:flex;align-items:center;gap:8px">
      <svg width="14" height="14" fill="none" stroke="#e11d48" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <span style="font-size:12px;color:#78716c;font-weight:500">Win Rate</span>
      <span style="font-size:16px;font-weight:700;color:#e11d48">34%</span>
    </div>
    <div style="width:1px;height:20px;background:#e7e5e3"></div>
    <div style="display:flex;align-items:center;gap:8px">
      <svg width="14" height="14" fill="none" stroke="#78716c" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
      <span style="font-size:12px;color:#78716c;font-weight:500">Avg Deal</span>
      <span style="font-size:16px;font-weight:700;color:#1c1917">$18.5k</span>
    </div>
  </div>
</div>

<!-- Pipeline Columns (MAIN VIEW) -->
<div class="pipeline-scroll" style="position:relative;z-index:10;flex:1;overflow-x:auto;overflow-y:auto;padding:20px 24px 14px;display:flex;gap:14px;align-items:flex-start">

  <!-- LEAD Column -->
  <div class="pipeline-col" id="col-lead" style="background:#fafaf9;min-width:250px">
    <div class="col-header" onclick="toggleColumn('col-lead')">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:3px;background:#a8a29e"></div>
        <span style="font-size:13px;font-weight:700;color:#57534e">Lead</span>
        <span style="background:#e7e5e3;border-radius:8px;padding:1px 7px;font-size:11px;font-weight:600;color:#78716c">3</span>
      </div>
      <span class="collapse-icon">&#9660;</span>
    </div>
    <div class="col-body">
      <!-- $50k - large -->
      <div class="deal-card deal-w-xl deal-new" onclick="showToast('Opening: Acme Corp')">
        <div class="card-actions">
          <button title="Edit">&#9998;</button>
          <button title="Move">&#8594;</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div class="avatar-circle" style="background:linear-gradient(135deg,#e11d48,#fb7185)">AC</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#1c1917">Acme Corp</div>
            <div style="font-size:11px;color:#a8a29e">Enterprise SaaS</div>
          </div>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <span style="font-size:18px;font-weight:700;color:#e11d48">$50,000</span>
          <span style="font-size:11px;color:#a8a29e;background:#f5f5f4;padding:2px 8px;border-radius:6px">12d</span>
        </div>
      </div>
      <!-- $12k - medium -->
      <div class="deal-card deal-w-md" onclick="showToast('Opening: Bright Studio')">
        <div class="card-actions">
          <button title="Edit">&#9998;</button>
          <button title="Move">&#8594;</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div class="avatar-circle" style="background:#f59e0b">BS</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#1c1917">Bright Studio</div>
            <div style="font-size:11px;color:#a8a29e">Design Agency</div>
          </div>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <span style="font-size:16px;font-weight:700;color:#e11d48">$12,000</span>
          <span style="font-size:11px;color:#a8a29e;background:#f5f5f4;padding:2px 8px;border-radius:6px">5d</span>
        </div>
      </div>
      <!-- $5k - small -->
      <div class="deal-card deal-w-sm" onclick="showToast('Opening: Nova Labs')">
        <div class="card-actions">
          <button title="Edit">&#9998;</button>
          <button title="Move">&#8594;</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div class="avatar-circle" style="background:#6366f1">NL</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#1c1917">Nova Labs</div>
            <div style="font-size:11px;color:#a8a29e">Startup</div>
          </div>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <span style="font-size:15px;font-weight:700;color:#e11d48">$5,000</span>
          <span style="font-size:11px;color:#a8a29e;background:#f5f5f4;padding:2px 8px;border-radius:6px">2d</span>
        </div>
      </div>
    </div>
  </div>

  <!-- QUALIFIED Column -->
  <div class="pipeline-col" id="col-qualified" style="background:#f0f9ff;min-width:250px">
    <div class="col-header" onclick="toggleColumn('col-qualified')">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:3px;background:#3b82f6"></div>
        <span style="font-size:13px;font-weight:700;color:#1e40af">Qualified</span>
        <span style="background:#dbeafe;border-radius:8px;padding:1px 7px;font-size:11px;font-weight:600;color:#3b82f6">2</span>
      </div>
      <span class="collapse-icon">&#9660;</span>
    </div>
    <div class="col-body">
      <!-- $35k - large -->
      <div class="deal-card deal-w-lg" onclick="showToast('Opening: Zenith Inc')">
        <div class="card-actions">
          <button title="Edit">&#9998;</button>
          <button title="Move">&#8594;</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div class="avatar-circle" style="background:linear-gradient(135deg,#3b82f6,#60a5fa)">ZI</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#1c1917">Zenith Inc</div>
            <div style="font-size:11px;color:#a8a29e">FinTech</div>
          </div>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <span style="font-size:17px;font-weight:700;color:#e11d48">$35,000</span>
          <span style="font-size:11px;color:#a8a29e;background:#f5f5f4;padding:2px 8px;border-radius:6px">8d</span>
        </div>
      </div>
      <!-- $8k - small-medium -->
      <div class="deal-card deal-w-sm" onclick="showToast('Opening: Coral Media')">
        <div class="card-actions">
          <button title="Edit">&#9998;</button>
          <button title="Move">&#8594;</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div class="avatar-circle" style="background:#ec4899">CM</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#1c1917">Coral Media</div>
            <div style="font-size:11px;color:#a8a29e">Marketing</div>
          </div>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <span style="font-size:15px;font-weight:700;color:#e11d48">$8,000</span>
          <span style="font-size:11px;color:#a8a29e;background:#f5f5f4;padding:2px 8px;border-radius:6px">14d</span>
        </div>
      </div>
    </div>
  </div>

  <!-- PROPOSAL Column -->
  <div class="pipeline-col" id="col-proposal" style="background:#fffbeb;min-width:250px">
    <div class="col-header" onclick="toggleColumn('col-proposal')">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:3px;background:#f59e0b"></div>
        <span style="font-size:13px;font-weight:700;color:#92400e">Proposal</span>
        <span style="background:#fef3c7;border-radius:8px;padding:1px 7px;font-size:11px;font-weight:600;color:#d97706">2</span>
      </div>
      <span class="collapse-icon">&#9660;</span>
    </div>
    <div class="col-body">
      <!-- $28k - medium-large -->
      <div class="deal-card deal-w-lg" onclick="showToast('Opening: Horizon Group')">
        <div class="card-actions">
          <button title="Edit">&#9998;</button>
          <button title="Move">&#8594;</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div class="avatar-circle" style="background:#f59e0b">HG</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#1c1917">Horizon Group</div>
            <div style="font-size:11px;color:#a8a29e">Healthcare</div>
          </div>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <span style="font-size:17px;font-weight:700;color:#e11d48">$28,000</span>
          <span style="font-size:11px;color:#a8a29e;background:#f5f5f4;padding:2px 8px;border-radius:6px">6d</span>
        </div>
      </div>
      <!-- $15k - medium -->
      <div class="deal-card deal-w-md" onclick="showToast('Opening: Peak Digital')">
        <div class="card-actions">
          <button title="Edit">&#9998;</button>
          <button title="Move">&#8594;</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div class="avatar-circle" style="background:#14b8a6">PD</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#1c1917">Peak Digital</div>
            <div style="font-size:11px;color:#a8a29e">E-commerce</div>
          </div>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <span style="font-size:16px;font-weight:700;color:#e11d48">$15,000</span>
          <span style="font-size:11px;color:#a8a29e;background:#f5f5f4;padding:2px 8px;border-radius:6px">21d</span>
        </div>
      </div>
    </div>
  </div>

  <!-- NEGOTIATION Column -->
  <div class="pipeline-col" id="col-negotiation" style="background:#fff1f2;min-width:250px">
    <div class="col-header" onclick="toggleColumn('col-negotiation')">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:3px;background:#e11d48"></div>
        <span style="font-size:13px;font-weight:700;color:#9f1239">Negotiation</span>
        <span style="background:#ffe4e6;border-radius:8px;padding:1px 7px;font-size:11px;font-weight:600;color:#e11d48">1</span>
      </div>
      <span class="collapse-icon">&#9660;</span>
    </div>
    <div class="col-body">
      <!-- $72k - extra large (biggest deal in pipeline) -->
      <div class="deal-card deal-w-xl" style="border-left:3px solid #e11d48" onclick="showToast('Opening: Atlas Enterprise')">
        <div class="card-actions">
          <button title="Edit">&#9998;</button>
          <button title="Move">&#8594;</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div class="avatar-circle" style="background:linear-gradient(135deg,#e11d48,#9f1239);width:38px;height:38px;font-size:14px">AE</div>
          <div>
            <div style="font-size:14px;font-weight:700;color:#1c1917">Atlas Enterprise</div>
            <div style="font-size:11px;color:#a8a29e">Manufacturing</div>
          </div>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:20px;font-weight:800;color:#e11d48">$72,000</span>
          <span style="font-size:11px;color:#a8a29e;background:#fff1f2;padding:2px 8px;border-radius:6px">3d</span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <span style="font-size:10px;background:#ffe4e6;color:#be123c;padding:2px 8px;border-radius:5px;font-weight:500">Contract sent</span>
          <span style="font-size:10px;background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:5px;font-weight:500">Closing soon</span>
        </div>
      </div>
    </div>
  </div>

  <!-- CLOSED WON Column -->
  <div class="pipeline-col" id="col-won" style="background:#f0fdf4;min-width:250px">
    <div class="col-header" onclick="toggleColumn('col-won')">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:3px;background:#16a34a"></div>
        <span style="font-size:13px;font-weight:700;color:#166534">Closed Won</span>
        <span style="background:#bbf7d0;border-radius:8px;padding:1px 7px;font-size:11px;font-weight:600;color:#16a34a">2</span>
      </div>
      <span class="collapse-icon">&#9660;</span>
    </div>
    <div class="col-body">
      <!-- $42k - large -->
      <div class="deal-card deal-w-xl" style="border-left:3px solid #16a34a" onclick="showToast('Deal won: Redwood Partners')">
        <div class="card-actions">
          <button title="View">&#128065;</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div class="avatar-circle" style="background:#16a34a">RP</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#1c1917">Redwood Partners</div>
            <div style="font-size:11px;color:#a8a29e">Consulting</div>
          </div>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <span style="font-size:17px;font-weight:700;color:#16a34a">$42,000</span>
          <span style="font-size:10px;color:#16a34a;background:#dcfce7;padding:2px 8px;border-radius:6px;font-weight:600">Won</span>
        </div>
      </div>
      <!-- $18k - medium -->
      <div class="deal-card deal-w-md" style="border-left:3px solid #16a34a" onclick="showToast('Deal won: Summit Co')">
        <div class="card-actions">
          <button title="View">&#128065;</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div class="avatar-circle" style="background:#059669">SC</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#1c1917">Summit Co</div>
            <div style="font-size:11px;color:#a8a29e">Education</div>
          </div>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <span style="font-size:16px;font-weight:700;color:#16a34a">$18,000</span>
          <span style="font-size:10px;color:#16a34a;background:#dcfce7;padding:2px 8px;border-radius:6px;font-weight:600">Won</span>
        </div>
      </div>
    </div>
  </div>

</div>

<!-- Bottom Strip -->
<div style="position:relative;z-index:10;background:rgba(255,251,247,0.9);backdrop-filter:blur(8px);border-top:1px solid #e7e5e3;padding:10px 24px;flex-shrink:0">
  <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap">
    <span style="font-size:12px;color:#78716c">24 deals in pipeline</span>
    <span style="color:#d6d3d1">&bull;</span>
    <span style="font-size:12px;color:#78716c">6 closing this month</span>
    <span style="color:#d6d3d1">&bull;</span>
    <span style="font-size:12px;font-weight:600;color:#e11d48">$847k weighted forecast</span>
  </div>
</div>

<script>
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2200);
}

function toggleColumn(id) {
  var col = document.getElementById(id);
  col.classList.toggle('collapsed');
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
