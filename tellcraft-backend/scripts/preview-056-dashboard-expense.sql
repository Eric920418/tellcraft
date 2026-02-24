INSERT INTO template_previews (template_id, html_content, version)
VALUES (
  'a87430f7-47d1-4ef7-b532-5eb111ac4806',
  $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ExpenseTrack - My Expenses</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{mint:'#10b981','mint-light':'#d1fae5','mint-dark':'#059669',rose:'#f43f5e','rose-light':'#ffe4e6',amber:'#f59e0b','amber-light':'#fef3c7',blue:'#3b82f6','blue-light':'#dbeafe',purple:'#8b5cf6','purple-light':'#ede9fe',teal:'#14b8a6','teal-light':'#ccfbf1',warm50:'#fafaf9',warm100:'#f5f5f4',warm200:'#e7e5e4',warm300:'#d6d3d1',warm400:'#a8a29e',warm500:'#78716c',warm600:'#57534e',warm700:'#44403c',warm800:'#292524',warm900:'#1c1917'},fontFamily:{display:['Manrope','sans-serif'],body:['Manrope','sans-serif']}}}}
</script>
<style>
*{font-family:'Manrope',sans-serif;-webkit-tap-highlight-color:transparent}
body{background:#e7e5e4;margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh}
.phone-frame{width:100%;max-width:420px;margin:20px auto;border-radius:2.5rem;border:8px solid #292524;box-shadow:0 25px 60px rgba(0,0,0,0.3),0 0 0 2px #44403c;overflow:hidden;position:relative;background:#fafaf9;height:880px;display:flex;flex-direction:column}
.phone-notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:150px;height:28px;background:#292524;border-radius:0 0 20px 20px;z-index:50}
.status-bar{padding:10px 24px 0;display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:700;color:#1c1917;position:relative;z-index:40;height:44px;flex-shrink:0}
.scroll-content{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.scroll-content::-webkit-scrollbar{display:none}
.category-scroll{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:0 20px 12px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.category-scroll::-webkit-scrollbar{display:none}
.category-card{min-width:140px;scroll-snap-align:start;flex-shrink:0}
.fade-edge{position:relative}
.fade-edge::after{content:'';position:absolute;top:0;right:0;bottom:12px;width:60px;background:linear-gradient(to right,transparent,#fafaf9);pointer-events:none;z-index:2}
.bottom-tab-bar{display:flex;align-items:flex-end;justify-content:space-around;padding:8px 16px 20px;background:#fff;border-top:1px solid #e7e5e4;flex-shrink:0;position:relative}
.tab-item{display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 12px;border-radius:12px;transition:all 0.2s}
.tab-item.active svg{color:#10b981}
.tab-item.active span{color:#10b981;font-weight:700}
.fab-btn{width:56px;height:56px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 20px rgba(16,185,129,0.4);margin-top:-28px;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;border:4px solid #fff}
.fab-btn:hover{transform:scale(1.08);box-shadow:0 6px 25px rgba(16,185,129,0.5)}
@keyframes slide-hint{0%,100%{transform:translateX(0);opacity:0.4}50%{transform:translateX(8px);opacity:1}}
@keyframes slide-hint-left{0%,100%{transform:translateX(0);opacity:0.4}50%{transform:translateX(-8px);opacity:1}}
.hint-right{animation:slide-hint 2s ease-in-out infinite}
.hint-left{animation:slide-hint-left 2s ease-in-out infinite;animation-delay:1s}
@keyframes donut-draw{from{stroke-dasharray:0 100}}
.donut-segment{animation:donut-draw 1.2s ease-out forwards}
@keyframes fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.animate-fade-up{animation:fade-up 0.5s ease-out forwards}
.transaction-item{transition:background 0.15s}
.transaction-item:active{background:#f5f5f4}

/* Tab pages */
.tab-page{display:none}
.tab-page.active{display:block}
</style>
</head>
<body>

<div class="phone-frame">
  <!-- Notch -->
  <div class="phone-notch"></div>

  <!-- Status Bar -->
  <div class="status-bar">
    <span>9:41</span>
    <div style="display:flex;align-items:center;gap:6px">
      <!-- Signal bars -->
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><rect x="0" y="8" width="3" height="4" rx="0.5" fill="#1c1917"/><rect x="4.5" y="5" width="3" height="7" rx="0.5" fill="#1c1917"/><rect x="9" y="2" width="3" height="10" rx="0.5" fill="#1c1917"/><rect x="13.5" y="0" width="2.5" height="12" rx="0.5" fill="#d6d3d1"/></svg>
      <!-- WiFi -->
      <svg width="15" height="12" viewBox="0 0 15 12" fill="#1c1917"><path d="M7.5 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/><path d="M4.2 8.4a4.5 4.5 0 016.6 0" stroke="#1c1917" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M1.5 5.7a8 8 0 0112 0" stroke="#1c1917" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>
      <!-- Battery -->
      <svg width="27" height="12" viewBox="0 0 27 12" fill="none"><rect x="0.5" y="0.5" width="23" height="11" rx="2.5" stroke="#1c1917" stroke-width="1"/><rect x="24.5" y="3.5" width="2" height="5" rx="1" fill="#1c1917"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#10b981"/></svg>
    </div>
  </div>

  <!-- Scrollable Content -->
  <div class="scroll-content">
    <!-- HOME TAB -->
    <div id="tab-home" class="tab-page active">
      <!-- Header -->
      <div style="padding:8px 20px 16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div>
            <div style="font-size:22px;font-weight:800;color:#1c1917">My Expenses</div>
          </div>
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center">
            <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="7" r="4"/><path d="M2 17c0-4 3-7 7-7s7 3 7 7"/></svg>
          </div>
        </div>

        <!-- Month Selector -->
        <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:8px">
          <button onclick="changeMonth(-1)" style="width:32px;height:32px;border-radius:50%;background:#f5f5f4;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#78716c;font-size:16px">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 2L4 7l5 5"/></svg>
          </button>
          <span id="monthLabel" style="font-size:15px;font-weight:700;color:#1c1917;min-width:140px;text-align:center">January 2024</span>
          <button onclick="changeMonth(1)" style="width:32px;height:32px;border-radius:50%;background:#f5f5f4;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#78716c;font-size:16px">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 2l5 5-5 5"/></svg>
          </button>
        </div>

        <!-- Total Balance -->
        <div style="text-align:center;margin-bottom:4px">
          <div style="font-size:11px;color:#a8a29e;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Total Balance</div>
          <div style="font-size:32px;font-weight:800;color:#1c1917;margin-top:2px">$3,247.80</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-top:8px">
            <span style="font-size:13px;font-weight:700;color:#10b981">+$5,240.00</span>
            <span style="font-size:13px;font-weight:700;color:#f43f5e">-$2,841.20</span>
          </div>
        </div>
      </div>

      <!-- Donut Chart Section -->
      <div style="padding:0 20px 20px;text-align:center" class="animate-fade-up">
        <div style="background:#fff;border-radius:20px;padding:24px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
          <div style="font-size:13px;font-weight:700;color:#44403c;margin-bottom:16px;text-align:left">Spending Breakdown</div>
          <div style="position:relative;width:200px;height:200px;margin:0 auto">
            <svg viewBox="0 0 42 42" style="width:200px;height:200px;transform:rotate(-90deg)">
              <!-- Food & Dining 35% -->
              <circle class="donut-segment" cx="21" cy="21" r="15.9" fill="none" stroke="#f59e0b" stroke-width="4" stroke-dasharray="35 65" stroke-dashoffset="0" style="cursor:pointer" onmouseenter="showDonutTip(this,'Food & Dining','$994','35%')" onmouseleave="hideDonutTip()"/>
              <!-- Transportation 20% -->
              <circle class="donut-segment" cx="21" cy="21" r="15.9" fill="none" stroke="#3b82f6" stroke-width="4" stroke-dasharray="20 80" stroke-dashoffset="-35" style="cursor:pointer;animation-delay:0.15s" onmouseenter="showDonutTip(this,'Transportation','$568','20%')" onmouseleave="hideDonutTip()"/>
              <!-- Shopping 18% -->
              <circle class="donut-segment" cx="21" cy="21" r="15.9" fill="none" stroke="#f43f5e" stroke-width="4" stroke-dasharray="18 82" stroke-dashoffset="-55" style="cursor:pointer;animation-delay:0.3s" onmouseenter="showDonutTip(this,'Shopping','$511','18%')" onmouseleave="hideDonutTip()"/>
              <!-- Bills 15% -->
              <circle class="donut-segment" cx="21" cy="21" r="15.9" fill="none" stroke="#8b5cf6" stroke-width="4" stroke-dasharray="15 85" stroke-dashoffset="-73" style="cursor:pointer;animation-delay:0.45s" onmouseenter="showDonutTip(this,'Bills & Utilities','$426','15%')" onmouseleave="hideDonutTip()"/>
              <!-- Entertainment 12% -->
              <circle class="donut-segment" cx="21" cy="21" r="15.9" fill="none" stroke="#14b8a6" stroke-width="4" stroke-dasharray="12 88" stroke-dashoffset="-88" style="cursor:pointer;animation-delay:0.6s" onmouseenter="showDonutTip(this,'Entertainment','$341','12%')" onmouseleave="hideDonutTip()"/>
            </svg>
            <!-- Center number -->
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
              <div id="donutCenter" style="text-align:center">
                <div style="font-size:28px;font-weight:800;color:#1c1917">$2,841</div>
                <div style="font-size:11px;color:#a8a29e;font-weight:600">total spent</div>
              </div>
            </div>
          </div>
          <!-- Legend row -->
          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px 16px;margin-top:16px">
            <span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#57534e"><span style="width:8px;height:8px;border-radius:2px;background:#f59e0b;display:inline-block"></span>Food 35%</span>
            <span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#57534e"><span style="width:8px;height:8px;border-radius:2px;background:#3b82f6;display:inline-block"></span>Transport 20%</span>
            <span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#57534e"><span style="width:8px;height:8px;border-radius:2px;background:#f43f5e;display:inline-block"></span>Shopping 18%</span>
            <span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#57534e"><span style="width:8px;height:8px;border-radius:2px;background:#8b5cf6;display:inline-block"></span>Bills 15%</span>
            <span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#57534e"><span style="width:8px;height:8px;border-radius:2px;background:#14b8a6;display:inline-block"></span>Fun 12%</span>
          </div>
        </div>
      </div>

      <!-- Category Cards (SIGNATURE - swipeable) -->
      <div style="padding:0 0 4px">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px 10px">
          <div style="font-size:13px;font-weight:700;color:#44403c">Categories</div>
          <div style="display:flex;align-items:center;gap:2px">
            <svg class="hint-left" width="16" height="16" fill="none" stroke="#a8a29e" stroke-width="2" stroke-linecap="round"><path d="M10 3L5 8l5 5"/></svg>
            <svg class="hint-right" width="16" height="16" fill="none" stroke="#a8a29e" stroke-width="2" stroke-linecap="round"><path d="M6 3l5 5-5 5"/></svg>
          </div>
        </div>
        <div class="fade-edge">
          <div class="category-scroll" id="categoryScroll">
            <!-- Food & Dining -->
            <div class="category-card" style="background:#fff;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                <div style="width:40px;height:40px;border-radius:12px;background:#fef3c7;display:flex;align-items:center;justify-content:center">
                  <svg width="20" height="20" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 6v10a2 2 0 002 2h10a2 2 0 002-2V6M7 6V4a2 2 0 012-2h2a2 2 0 012 2v2"/><circle cx="10" cy="12" r="2"/></svg>
                </div>
                <div>
                  <div style="font-size:12px;font-weight:700;color:#1c1917">Food & Dining</div>
                  <div style="font-size:11px;color:#a8a29e">35%</div>
                </div>
              </div>
              <div style="font-size:18px;font-weight:800;color:#1c1917;margin-bottom:6px">$994.42</div>
              <div style="height:4px;background:#fef3c7;border-radius:999px;overflow:hidden">
                <div style="width:35%;height:100%;background:#f59e0b;border-radius:999px"></div>
              </div>
            </div>
            <!-- Transportation -->
            <div class="category-card" style="background:#fff;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                <div style="width:40px;height:40px;border-radius:12px;background:#dbeafe;display:flex;align-items:center;justify-content:center">
                  <svg width="20" height="20" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="8" width="16" height="8" rx="2"/><circle cx="6" cy="16" r="2"/><circle cx="14" cy="16" r="2"/><path d="M2 11h16M5 8V5h6l3 3"/></svg>
                </div>
                <div>
                  <div style="font-size:12px;font-weight:700;color:#1c1917">Transportation</div>
                  <div style="font-size:11px;color:#a8a29e">20%</div>
                </div>
              </div>
              <div style="font-size:18px;font-weight:800;color:#1c1917;margin-bottom:6px">$568.24</div>
              <div style="height:4px;background:#dbeafe;border-radius:999px;overflow:hidden">
                <div style="width:20%;height:100%;background:#3b82f6;border-radius:999px"></div>
              </div>
            </div>
            <!-- Shopping -->
            <div class="category-card" style="background:#fff;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                <div style="width:40px;height:40px;border-radius:12px;background:#ffe4e6;display:flex;align-items:center;justify-content:center">
                  <svg width="20" height="20" fill="none" stroke="#f43f5e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h2l1.7 8.4a1 1 0 001 .8h7.5a1 1 0 001-.8L18 6H6"/><circle cx="9" cy="17" r="1.2"/><circle cx="15" cy="17" r="1.2"/></svg>
                </div>
                <div>
                  <div style="font-size:12px;font-weight:700;color:#1c1917">Shopping</div>
                  <div style="font-size:11px;color:#a8a29e">18%</div>
                </div>
              </div>
              <div style="font-size:18px;font-weight:800;color:#1c1917;margin-bottom:6px">$511.42</div>
              <div style="height:4px;background:#ffe4e6;border-radius:999px;overflow:hidden">
                <div style="width:18%;height:100%;background:#f43f5e;border-radius:999px"></div>
              </div>
            </div>
            <!-- Bills -->
            <div class="category-card" style="background:#fff;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                <div style="width:40px;height:40px;border-radius:12px;background:#ede9fe;display:flex;align-items:center;justify-content:center">
                  <svg width="20" height="20" fill="none" stroke="#8b5cf6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M7 7h6M7 10h6M7 13h3"/></svg>
                </div>
                <div>
                  <div style="font-size:12px;font-weight:700;color:#1c1917">Bills</div>
                  <div style="font-size:11px;color:#a8a29e">15%</div>
                </div>
              </div>
              <div style="font-size:18px;font-weight:800;color:#1c1917;margin-bottom:6px">$426.18</div>
              <div style="height:4px;background:#ede9fe;border-radius:999px;overflow:hidden">
                <div style="width:15%;height:100%;background:#8b5cf6;border-radius:999px"></div>
              </div>
            </div>
            <!-- Entertainment -->
            <div class="category-card" style="background:#fff;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                <div style="width:40px;height:40px;border-radius:12px;background:#ccfbf1;display:flex;align-items:center;justify-content:center">
                  <svg width="20" height="20" fill="none" stroke="#14b8a6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8"/><path d="M8 7.5l5 2.5-5 2.5z"/></svg>
                </div>
                <div>
                  <div style="font-size:12px;font-weight:700;color:#1c1917">Entertainment</div>
                  <div style="font-size:11px;color:#a8a29e">12%</div>
                </div>
              </div>
              <div style="font-size:18px;font-weight:800;color:#1c1917;margin-bottom:6px">$340.94</div>
              <div style="height:4px;background:#ccfbf1;border-radius:999px;overflow:hidden">
                <div style="width:12%;height:100%;background:#14b8a6;border-radius:999px"></div>
              </div>
            </div>
            <!-- Spacer for fade edge -->
            <div style="min-width:8px;flex-shrink:0"></div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div style="padding:8px 20px 24px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="font-size:13px;font-weight:700;color:#44403c">Recent Transactions</div>
          <button onclick="switchTab('expenses')" style="font-size:11px;font-weight:700;color:#10b981;background:none;border:none;cursor:pointer">See all</button>
        </div>
        <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
          <!-- Transaction 1 -->
          <div class="transaction-item" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #f5f5f4">
            <div style="width:40px;height:40px;border-radius:12px;background:#fef3c7;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#f59e0b" stroke-width="1.8"><circle cx="9" cy="6" r="3"/><path d="M3 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke-linecap="round"/></svg>
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:#1c1917">Whole Foods Market</div>
              <div style="font-size:11px;color:#a8a29e">Today, 2:30 PM</div>
            </div>
            <div style="font-size:14px;font-weight:800;color:#f43f5e">-$84.32</div>
          </div>
          <!-- Transaction 2 -->
          <div class="transaction-item" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #f5f5f4">
            <div style="width:40px;height:40px;border-radius:12px;background:#dbeafe;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="6" width="14" height="7" rx="1.5"/><circle cx="5.5" cy="13" r="1.5"/><circle cx="12.5" cy="13" r="1.5"/></svg>
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:#1c1917">Uber Ride</div>
              <div style="font-size:11px;color:#a8a29e">Today, 11:15 AM</div>
            </div>
            <div style="font-size:14px;font-weight:800;color:#f43f5e">-$23.50</div>
          </div>
          <!-- Transaction 3 - Income -->
          <div class="transaction-item" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #f5f5f4">
            <div style="width:40px;height:40px;border-radius:12px;background:#d1fae5;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#10b981" stroke-width="1.8" stroke-linecap="round"><path d="M9 2v14M5 6l4-4 4 4"/></svg>
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:#1c1917">Salary Deposit</div>
              <div style="font-size:11px;color:#a8a29e">Jan 15, 9:00 AM</div>
            </div>
            <div style="font-size:14px;font-weight:800;color:#10b981">+$5,240.00</div>
          </div>
          <!-- Transaction 4 -->
          <div class="transaction-item" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #f5f5f4">
            <div style="width:40px;height:40px;border-radius:12px;background:#ffe4e6;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#f43f5e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h2l1.5 7h7l1.5-5H6"/><circle cx="8.5" cy="15" r="1"/><circle cx="13.5" cy="15" r="1"/></svg>
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:#1c1917">Amazon Purchase</div>
              <div style="font-size:11px;color:#a8a29e">Jan 14, 6:45 PM</div>
            </div>
            <div style="font-size:14px;font-weight:800;color:#f43f5e">-$156.99</div>
          </div>
          <!-- Transaction 5 -->
          <div class="transaction-item" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #f5f5f4">
            <div style="width:40px;height:40px;border-radius:12px;background:#ede9fe;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#8b5cf6" stroke-width="1.8" stroke-linecap="round"><path d="M3 3h12a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M6 7h6M6 10h3"/></svg>
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:#1c1917">Electric Bill</div>
              <div style="font-size:11px;color:#a8a29e">Jan 12, 12:00 PM</div>
            </div>
            <div style="font-size:14px;font-weight:800;color:#f43f5e">-$127.40</div>
          </div>
          <!-- Transaction 6 -->
          <div class="transaction-item" style="display:flex;align-items:center;gap:12px;padding:14px 16px">
            <div style="width:40px;height:40px;border-radius:12px;background:#ccfbf1;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#14b8a6" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="9" r="7"/><path d="M7 7l4 2-4 2z"/></svg>
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:#1c1917">Netflix</div>
              <div style="font-size:11px;color:#a8a29e">Jan 10, 12:00 AM</div>
            </div>
            <div style="font-size:14px;font-weight:800;color:#f43f5e">-$15.99</div>
          </div>
        </div>
      </div>
    </div>

    <!-- EXPENSES TAB -->
    <div id="tab-expenses" class="tab-page">
      <div style="padding:8px 20px 16px">
        <div style="font-size:22px;font-weight:800;color:#1c1917;margin-bottom:16px">All Expenses</div>
        <!-- Filter pills -->
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none">
          <button onclick="filterExpenses('all',this)" class="expense-filter active" style="padding:6px 14px;border-radius:999px;border:none;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;background:#10b981;color:#fff">All</button>
          <button onclick="filterExpenses('food',this)" class="expense-filter" style="padding:6px 14px;border-radius:999px;border:1px solid #e7e5e4;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;background:#fff;color:#57534e">Food</button>
          <button onclick="filterExpenses('transport',this)" class="expense-filter" style="padding:6px 14px;border-radius:999px;border:1px solid #e7e5e4;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;background:#fff;color:#57534e">Transport</button>
          <button onclick="filterExpenses('shopping',this)" class="expense-filter" style="padding:6px 14px;border-radius:999px;border:1px solid #e7e5e4;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;background:#fff;color:#57534e">Shopping</button>
          <button onclick="filterExpenses('bills',this)" class="expense-filter" style="padding:6px 14px;border-radius:999px;border:1px solid #e7e5e4;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;background:#fff;color:#57534e">Bills</button>
        </div>
      </div>
      <div style="padding:0 20px 24px">
        <div style="font-size:11px;font-weight:700;color:#a8a29e;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">January 16</div>
        <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);margin-bottom:16px">
          <div class="transaction-item" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #f5f5f4">
            <div style="width:40px;height:40px;border-radius:12px;background:#fef3c7;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#f59e0b" stroke-width="1.8"><circle cx="9" cy="6" r="3"/><path d="M3 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke-linecap="round"/></svg>
            </div>
            <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#1c1917">Whole Foods Market</div><div style="font-size:11px;color:#a8a29e">2:30 PM - Groceries</div></div>
            <div style="font-size:14px;font-weight:800;color:#f43f5e">-$84.32</div>
          </div>
          <div class="transaction-item" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #f5f5f4">
            <div style="width:40px;height:40px;border-radius:12px;background:#dbeafe;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="6" width="14" height="7" rx="1.5"/><circle cx="5.5" cy="13" r="1.5"/><circle cx="12.5" cy="13" r="1.5"/></svg>
            </div>
            <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#1c1917">Uber Ride</div><div style="font-size:11px;color:#a8a29e">11:15 AM - Commute</div></div>
            <div style="font-size:14px;font-weight:800;color:#f43f5e">-$23.50</div>
          </div>
          <div class="transaction-item" style="display:flex;align-items:center;gap:12px;padding:14px 16px">
            <div style="width:40px;height:40px;border-radius:12px;background:#fef3c7;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#f59e0b" stroke-width="1.8"><circle cx="9" cy="6" r="3"/><path d="M3 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke-linecap="round"/></svg>
            </div>
            <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#1c1917">Starbucks</div><div style="font-size:11px;color:#a8a29e">8:20 AM - Coffee</div></div>
            <div style="font-size:14px;font-weight:800;color:#f43f5e">-$6.75</div>
          </div>
        </div>
        <div style="font-size:11px;font-weight:700;color:#a8a29e;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">January 15</div>
        <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);margin-bottom:16px">
          <div class="transaction-item" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #f5f5f4">
            <div style="width:40px;height:40px;border-radius:12px;background:#ffe4e6;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#f43f5e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h2l1.5 7h7l1.5-5H6"/><circle cx="8.5" cy="15" r="1"/><circle cx="13.5" cy="15" r="1"/></svg>
            </div>
            <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#1c1917">Amazon Purchase</div><div style="font-size:11px;color:#a8a29e">6:45 PM - Electronics</div></div>
            <div style="font-size:14px;font-weight:800;color:#f43f5e">-$156.99</div>
          </div>
          <div class="transaction-item" style="display:flex;align-items:center;gap:12px;padding:14px 16px">
            <div style="width:40px;height:40px;border-radius:12px;background:#fef3c7;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#f59e0b" stroke-width="1.8"><circle cx="9" cy="6" r="3"/><path d="M3 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke-linecap="round"/></svg>
            </div>
            <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#1c1917">Chipotle</div><div style="font-size:11px;color:#a8a29e">12:30 PM - Lunch</div></div>
            <div style="font-size:14px;font-weight:800;color:#f43f5e">-$14.85</div>
          </div>
        </div>
      </div>
    </div>

    <!-- REPORTS TAB -->
    <div id="tab-reports" class="tab-page">
      <div style="padding:8px 20px 20px">
        <div style="font-size:22px;font-weight:800;color:#1c1917;margin-bottom:20px">Reports</div>
        <!-- Weekly summary card -->
        <div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.04);margin-bottom:16px">
          <div style="font-size:13px;font-weight:700;color:#44403c;margin-bottom:16px">Weekly Summary</div>
          <!-- Simple bar chart -->
          <div style="display:flex;align-items:flex-end;gap:8px;height:120px;padding-bottom:24px;position:relative">
            <div style="position:absolute;bottom:0;left:0;right:0;height:1px;background:#f5f5f4"></div>
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
              <div style="width:100%;background:#d1fae5;border-radius:6px 6px 0 0;height:40px"></div>
              <span style="font-size:10px;color:#a8a29e;position:absolute;bottom:4px">Mon</span>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
              <div style="width:100%;background:#ffe4e6;border-radius:6px 6px 0 0;height:72px"></div>
              <span style="font-size:10px;color:#a8a29e;position:absolute;bottom:4px">Tue</span>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
              <div style="width:100%;background:#ffe4e6;border-radius:6px 6px 0 0;height:28px"></div>
              <span style="font-size:10px;color:#a8a29e;position:absolute;bottom:4px">Wed</span>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
              <div style="width:100%;background:#ffe4e6;border-radius:6px 6px 0 0;height:56px"></div>
              <span style="font-size:10px;color:#a8a29e;position:absolute;bottom:4px">Thu</span>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
              <div style="width:100%;background:#f43f5e;border-radius:6px 6px 0 0;height:96px"></div>
              <span style="font-size:10px;color:#a8a29e;position:absolute;bottom:4px">Fri</span>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
              <div style="width:100%;background:#ffe4e6;border-radius:6px 6px 0 0;height:84px"></div>
              <span style="font-size:10px;color:#a8a29e;position:absolute;bottom:4px">Sat</span>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
              <div style="width:100%;background:#10b981;border-radius:6px 6px 0 0;height:20px"></div>
              <span style="font-size:10px;color:#a8a29e;position:absolute;bottom:4px">Sun</span>
            </div>
          </div>
        </div>
        <!-- Insights -->
        <div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
          <div style="font-size:13px;font-weight:700;color:#44403c;margin-bottom:14px">Insights</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#d1fae5;border-radius:12px">
              <div style="font-size:20px">
                <svg width="24" height="24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round"><path d="M12 2v14M8 12l4 4 4-4"/><path d="M20 18H4"/></svg>
              </div>
              <div>
                <div style="font-size:12px;font-weight:700;color:#059669">Spending is down 12%</div>
                <div style="font-size:11px;color:#57534e">Compared to last month</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#fef3c7;border-radius:12px">
              <div style="font-size:20px">
                <svg width="24" height="24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"><path d="M12 9v4M12 17h0"/><circle cx="12" cy="12" r="10"/></svg>
              </div>
              <div>
                <div style="font-size:12px;font-weight:700;color:#d97706">Food spending is high</div>
                <div style="font-size:11px;color:#57534e">35% of total - consider cooking more</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SETTINGS TAB -->
    <div id="tab-settings" class="tab-page">
      <div style="padding:8px 20px 24px">
        <div style="font-size:22px;font-weight:800;color:#1c1917;margin-bottom:20px">Settings</div>
        <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:14px;padding:16px;border-bottom:1px solid #f5f5f4">
            <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center">
              <svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="8" r="4"/><path d="M3 19c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
            </div>
            <div>
              <div style="font-size:15px;font-weight:700;color:#1c1917">Alex Johnson</div>
              <div style="font-size:12px;color:#a8a29e">alex@example.com</div>
            </div>
            <svg style="margin-left:auto" width="16" height="16" fill="none" stroke="#a8a29e" stroke-width="2" stroke-linecap="round"><path d="M6 3l5 5-5 5"/></svg>
          </div>
        </div>
        <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);margin-bottom:16px">
          <div class="transaction-item" style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-bottom:1px solid #f5f5f4;cursor:pointer">
            <div style="width:36px;height:36px;border-radius:10px;background:#d1fae5;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#10b981" stroke-width="1.8" stroke-linecap="round"><path d="M9 2v14M5 6l4-4 4 4"/></svg>
            </div>
            <span style="font-size:13px;font-weight:600;color:#1c1917;flex:1">Currency</span>
            <span style="font-size:12px;color:#a8a29e">USD ($)</span>
            <svg width="16" height="16" fill="none" stroke="#a8a29e" stroke-width="2" stroke-linecap="round"><path d="M6 3l5 5-5 5"/></svg>
          </div>
          <div class="transaction-item" style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-bottom:1px solid #f5f5f4;cursor:pointer">
            <div style="width:36px;height:36px;border-radius:10px;background:#dbeafe;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 5v4l3 2"/></svg>
            </div>
            <span style="font-size:13px;font-weight:600;color:#1c1917;flex:1">Reminders</span>
            <span style="font-size:12px;color:#10b981;font-weight:600">On</span>
            <svg width="16" height="16" fill="none" stroke="#a8a29e" stroke-width="2" stroke-linecap="round"><path d="M6 3l5 5-5 5"/></svg>
          </div>
          <div class="transaction-item" style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-bottom:1px solid #f5f5f4;cursor:pointer">
            <div style="width:36px;height:36px;border-radius:10px;background:#ede9fe;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#8b5cf6" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="12" height="12" rx="2"/><path d="M3 8h12"/><path d="M8 3v12"/></svg>
            </div>
            <span style="font-size:13px;font-weight:600;color:#1c1917;flex:1">Categories</span>
            <span style="font-size:12px;color:#a8a29e">5 active</span>
            <svg width="16" height="16" fill="none" stroke="#a8a29e" stroke-width="2" stroke-linecap="round"><path d="M6 3l5 5-5 5"/></svg>
          </div>
          <div class="transaction-item" style="display:flex;align-items:center;gap:14px;padding:14px 16px;cursor:pointer">
            <div style="width:36px;height:36px;border-radius:10px;background:#fef3c7;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round"><path d="M4 15V5a2 2 0 012-2h6a2 2 0 012 2v10M2 15h14"/></svg>
            </div>
            <span style="font-size:13px;font-weight:600;color:#1c1917;flex:1">Export Data</span>
            <svg width="16" height="16" fill="none" stroke="#a8a29e" stroke-width="2" stroke-linecap="round"><path d="M6 3l5 5-5 5"/></svg>
          </div>
        </div>
        <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
          <div class="transaction-item" style="display:flex;align-items:center;gap:14px;padding:14px 16px;cursor:pointer">
            <div style="width:36px;height:36px;border-radius:10px;background:#ffe4e6;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" fill="none" stroke="#f43f5e" stroke-width="1.8" stroke-linecap="round"><path d="M5 5l8 8M13 5l-8 8"/></svg>
            </div>
            <span style="font-size:13px;font-weight:600;color:#f43f5e;flex:1">Log Out</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom Tab Bar -->
  <div class="bottom-tab-bar">
    <div class="tab-item active" onclick="switchTab('home')" id="tabHome">
      <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:#10b981"><path d="M3 10.5L11 4l8 6.5V18a1 1 0 01-1 1H4a1 1 0 01-1-1z"/></svg>
      <span style="font-size:10px;font-weight:600;color:#10b981">Home</span>
    </div>
    <div class="tab-item" onclick="switchTab('expenses')" id="tabExpenses">
      <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:#a8a29e"><path d="M4 4h14a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M3 8h16"/><path d="M8 4v4"/></svg>
      <span style="font-size:10px;font-weight:600;color:#a8a29e">Expenses</span>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center" onclick="showAddModal()">
      <div class="fab-btn">
        <svg width="26" height="26" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M13 5v16M5 13h16"/></svg>
      </div>
    </div>
    <div class="tab-item" onclick="switchTab('reports')" id="tabReports">
      <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:#a8a29e"><path d="M4 18V9M9 18V5M14 18v-7M19 18v-4"/></svg>
      <span style="font-size:10px;font-weight:600;color:#a8a29e">Reports</span>
    </div>
    <div class="tab-item" onclick="switchTab('settings')" id="tabSettings">
      <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:#a8a29e"><circle cx="11" cy="11" r="3"/><path d="M19.4 14a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V20a2 2 0 01-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H2a2 2 0 010-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3h.1a1.6 1.6 0 001-1.5V2a2 2 0 014 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8v.1a1.6 1.6 0 001.5 1H20a2 2 0 010 4h-.1a1.6 1.6 0 00-1.5 1z"/></svg>
      <span style="font-size:10px;font-weight:600;color:#a8a29e">Settings</span>
    </div>
  </div>
</div>

<!-- Add Expense Modal (overlays inside the phone frame conceptually, but positioned fixed for simplicity) -->
<div id="addModal" style="display:none;position:fixed;inset:0;z-index:100;display:none;align-items:flex-end;justify-content:center">
  <div style="position:fixed;inset:0;background:rgba(0,0,0,0.4)" onclick="hideAddModal()"></div>
  <div style="position:relative;width:100%;max-width:420px;background:#fff;border-radius:24px 24px 0 0;padding:24px 20px 36px;z-index:101;animation:slide-up 0.3s ease-out">
    <!-- Handle -->
    <div style="width:40px;height:4px;background:#e7e5e4;border-radius:999px;margin:0 auto 20px"></div>
    <div style="font-size:18px;font-weight:800;color:#1c1917;margin-bottom:16px">Add Expense</div>
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button id="modalTypeExpense" onclick="setModalType('expense')" style="flex:1;padding:10px;border-radius:12px;border:none;font-size:13px;font-weight:700;cursor:pointer;background:#f43f5e;color:#fff">Expense</button>
      <button id="modalTypeIncome" onclick="setModalType('income')" style="flex:1;padding:10px;border-radius:12px;border:2px solid #e7e5e4;font-size:13px;font-weight:700;cursor:pointer;background:#fff;color:#57534e">Income</button>
    </div>
    <input type="text" placeholder="$0.00" style="width:100%;text-align:center;font-size:36px;font-weight:800;border:none;outline:none;color:#1c1917;margin-bottom:16px;font-family:Manrope,sans-serif;background:transparent">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      <button style="padding:8px 14px;border-radius:999px;border:2px solid #fef3c7;font-size:12px;font-weight:600;cursor:pointer;background:#fef3c7;color:#d97706">Food</button>
      <button style="padding:8px 14px;border-radius:999px;border:2px solid #e7e5e4;font-size:12px;font-weight:600;cursor:pointer;background:#fff;color:#57534e">Transport</button>
      <button style="padding:8px 14px;border-radius:999px;border:2px solid #e7e5e4;font-size:12px;font-weight:600;cursor:pointer;background:#fff;color:#57534e">Shopping</button>
      <button style="padding:8px 14px;border-radius:999px;border:2px solid #e7e5e4;font-size:12px;font-weight:600;cursor:pointer;background:#fff;color:#57534e">Bills</button>
      <button style="padding:8px 14px;border-radius:999px;border:2px solid #e7e5e4;font-size:12px;font-weight:600;cursor:pointer;background:#fff;color:#57534e">Fun</button>
    </div>
    <input type="text" placeholder="Add a note..." style="width:100%;padding:14px 16px;border-radius:12px;border:2px solid #e7e5e4;font-size:13px;outline:none;font-family:Manrope,sans-serif;margin-bottom:16px;color:#1c1917">
    <button onclick="hideAddModal()" style="width:100%;padding:16px;border-radius:16px;border:none;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:Manrope,sans-serif;box-shadow:0 4px 16px rgba(16,185,129,0.3)">Save Expense</button>
  </div>
</div>

<style>
@keyframes slide-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
</style>

<script>
// Tab switching
const tabs = ['home','expenses','reports','settings'];
const tabElements = {home:'tabHome',expenses:'tabExpenses',reports:'tabReports',settings:'tabSettings'};

function switchTab(tab) {
  // Hide all tab pages
  tabs.forEach(t => {
    const page = document.getElementById('tab-' + t);
    if (page) page.classList.remove('active');
  });
  // Show selected
  const selected = document.getElementById('tab-' + tab);
  if (selected) selected.classList.add('active');

  // Update tab bar active state
  Object.entries(tabElements).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const svgEl = el.querySelector('svg');
    const spanEl = el.querySelector('span');
    if (key === tab) {
      el.classList.add('active');
      if (svgEl) svgEl.style.color = '#10b981';
      if (spanEl) { spanEl.style.color = '#10b981'; spanEl.style.fontWeight = '700'; }
    } else {
      el.classList.remove('active');
      if (svgEl) svgEl.style.color = '#a8a29e';
      if (spanEl) { spanEl.style.color = '#a8a29e'; spanEl.style.fontWeight = '600'; }
    }
  });

  // Scroll to top
  document.querySelector('.scroll-content').scrollTop = 0;
}

// Month navigation
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
let currentMonth = 0; // January
let currentYear = 2024;

function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  document.getElementById('monthLabel').textContent = months[currentMonth] + ' ' + currentYear;
}

// Donut chart hover
function showDonutTip(el, name, amount, pct) {
  el.style.strokeWidth = '5';
  el.style.filter = 'brightness(1.1)';
  document.getElementById('donutCenter').innerHTML =
    '<div style="font-size:18px;font-weight:800;color:#1c1917">' + amount + '</div>' +
    '<div style="font-size:11px;color:#a8a29e;font-weight:600">' + name + '</div>' +
    '<div style="font-size:10px;color:#78716c">' + pct + '</div>';
}

function hideDonutTip() {
  document.querySelectorAll('.donut-segment').forEach(s => {
    s.style.strokeWidth = '4';
    s.style.filter = '';
  });
  document.getElementById('donutCenter').innerHTML =
    '<div style="font-size:28px;font-weight:800;color:#1c1917">$2,841</div>' +
    '<div style="font-size:11px;color:#a8a29e;font-weight:600">total spent</div>';
}

// Filter expenses
function filterExpenses(cat, btn) {
  document.querySelectorAll('.expense-filter').forEach(b => {
    b.style.background = '#fff';
    b.style.color = '#57534e';
    b.style.border = '1px solid #e7e5e4';
  });
  btn.style.background = '#10b981';
  btn.style.color = '#fff';
  btn.style.border = 'none';
}

// Add modal
function showAddModal() {
  const modal = document.getElementById('addModal');
  modal.style.display = 'flex';
}

function hideAddModal() {
  document.getElementById('addModal').style.display = 'none';
}

function setModalType(type) {
  const expBtn = document.getElementById('modalTypeExpense');
  const incBtn = document.getElementById('modalTypeIncome');
  if (type === 'expense') {
    expBtn.style.background = '#f43f5e'; expBtn.style.color = '#fff'; expBtn.style.border = 'none';
    incBtn.style.background = '#fff'; incBtn.style.color = '#57534e'; incBtn.style.border = '2px solid #e7e5e4';
  } else {
    incBtn.style.background = '#10b981'; incBtn.style.color = '#fff'; incBtn.style.border = 'none';
    expBtn.style.background = '#fff'; expBtn.style.color = '#57534e'; expBtn.style.border = '2px solid #e7e5e4';
  }
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
