INSERT INTO template_previews (template_id, html_content, version)
VALUES ('35b4dd9d-f6fd-49fe-a17e-d8df7ee8d0ef', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kevin & Emily — 婚禮邀請</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600&family=Noto+Serif+TC:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Serif TC',serif;background:#fdf8f4;color:#3d2e2a;overflow-x:hidden}
.serif{font-family:'Cormorant Garamond','Noto Serif TC',serif}
.rose{color:#b76e79}
.gold{color:#c9a96e}
.bg-rose{background:#b76e79}
.bg-blush{background:#fdf0ed}
.divider{width:60px;height:1px;background:linear-gradient(90deg,transparent,#c9a96e,transparent);margin:0 auto}
.divider-wide{width:200px;height:1px;background:linear-gradient(90deg,transparent,#c9a96e,transparent);margin:0 auto}
.ornament{font-size:24px;color:#c9a96e;letter-spacing:8px;text-align:center}
.btn-rose{background:#b76e79;color:#fff;border:none;padding:14px 36px;border-radius:4px;font-weight:500;cursor:pointer;transition:all 0.3s;font-size:15px;letter-spacing:1px;font-family:'Cormorant Garamond','Noto Serif TC',serif}
.btn-rose:hover{background:#a05d68;transform:translateY(-2px);box-shadow:0 8px 20px rgba(183,110,121,0.25)}
.btn-outline-gold{border:1px solid #c9a96e;color:#c9a96e;padding:14px 36px;border-radius:4px;font-weight:500;cursor:pointer;transition:all 0.3s;background:transparent;font-size:15px;letter-spacing:1px;font-family:'Cormorant Garamond','Noto Serif TC',serif}
.btn-outline-gold:hover{background:rgba(201,169,110,0.08)}
.timeline-item{display:flex;gap:24px;align-items:flex-start}
.timeline-dot{width:12px;height:12px;border-radius:50%;border:2px solid #c9a96e;background:#fdf8f4;flex-shrink:0;margin-top:6px}
.timeline-line{width:1px;background:linear-gradient(180deg,#c9a96e,transparent);height:40px;margin-left:5px}
.gallery-item{border-radius:12px;overflow:hidden;cursor:pointer;transition:all 0.4s;aspect-ratio:1}
.gallery-item:hover{transform:scale(1.03);box-shadow:0 12px 32px rgba(183,110,121,0.15)}
.countdown-box{background:#fff;border:1px solid #ebe0d8;border-radius:12px;padding:20px;text-align:center;min-width:90px}
.countdown-num{font-size:36px;font-weight:600;color:#b76e79;font-family:'Cormorant Garamond',serif}
.countdown-label{font-size:12px;color:#a08b80;margin-top:2px;letter-spacing:1px}
.toast{position:fixed;bottom:24px;right:24px;background:#b76e79;color:#fff;padding:14px 24px;border-radius:8px;font-size:14px;font-weight:500;transform:translateY(100px);opacity:0;transition:all 0.4s;z-index:9999}
.toast.show{transform:translateY(0);opacity:1}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.8s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.rsvp-input{border:1px solid #ebe0d8;border-radius:6px;padding:12px 16px;font-size:14px;outline:none;width:100%;background:#fdf8f4;font-family:'Inter','Noto Serif TC',serif}
.rsvp-input:focus{border-color:#b76e79}
.rsvp-radio{display:flex;gap:12px}
.rsvp-radio label{display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px;padding:8px 16px;border:1px solid #ebe0d8;border-radius:6px;transition:all 0.2s}
.rsvp-radio label:hover{border-color:#b76e79}
.rsvp-radio input:checked+span{color:#b76e79;font-weight:600}
.flower-border{border:1px solid #ebe0d8;border-radius:20px;position:relative}
.flower-border::before{content:'✿';position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#fdf8f4;padding:0 16px;color:#c9a96e;font-size:20px}
</style>
</head>
<body>

<div class="toast" id="toast"></div>

<!-- Hero -->
<section style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 24px;background:linear-gradient(180deg,#fdf8f4,#fdf0ed);position:relative;overflow:hidden">
  <div style="position:absolute;top:40px;left:40px;font-size:40px;opacity:0.15;transform:rotate(-15deg)">🌸</div>
  <div style="position:absolute;bottom:60px;right:50px;font-size:48px;opacity:0.12;transform:rotate(20deg)">🌿</div>
  <div style="position:absolute;top:30%;left:10%;font-size:24px;opacity:0.1">✿</div>
  <div style="position:absolute;top:20%;right:15%;font-size:20px;opacity:0.1">❀</div>

  <div class="reveal" style="position:relative;z-index:1">
    <p style="font-size:14px;color:#c9a96e;letter-spacing:4px;margin-bottom:20px;text-transform:uppercase">We're Getting Married</p>
    <div class="divider" style="margin-bottom:28px"></div>
    <h1 class="serif" style="font-size:clamp(3rem,8vw,6rem);font-weight:400;line-height:1;margin-bottom:8px;color:#3d2e2a">
      <span style="font-style:italic;font-weight:500">Kevin</span>
      <span style="display:block;font-size:clamp(1.2rem,3vw,1.8rem);color:#c9a96e;margin:8px 0">&</span>
      <span style="font-style:italic;font-weight:500">Emily</span>
    </h1>
    <div class="divider" style="margin:24px auto"></div>
    <p class="serif" style="font-size:20px;color:#a08b80;margin-bottom:12px;letter-spacing:2px">二〇二六年五月十七日</p>
    <p style="font-size:14px;color:#a08b80;margin-bottom:36px">Saturday, May 17, 2026</p>

    <!-- Countdown -->
    <div style="display:flex;gap:16px;justify-content:center;margin-bottom:40px;flex-wrap:wrap">
      <div class="countdown-box">
        <div class="countdown-num" id="cd-days">90</div>
        <div class="countdown-label">DAYS</div>
      </div>
      <div class="countdown-box">
        <div class="countdown-num" id="cd-hours">14</div>
        <div class="countdown-label">HOURS</div>
      </div>
      <div class="countdown-box">
        <div class="countdown-num" id="cd-mins">32</div>
        <div class="countdown-label">MINS</div>
      </div>
      <div class="countdown-box">
        <div class="countdown-num" id="cd-secs">08</div>
        <div class="countdown-label">SECS</div>
      </div>
    </div>

    <button class="btn-rose" onclick="document.getElementById('rsvp').scrollIntoView({behavior:'smooth'})">出席回覆 RSVP</button>
  </div>

  <div style="position:absolute;bottom:24px;animation:bounce 2s infinite">
    <svg width="24" height="24" fill="none" stroke="#c9a96e" stroke-width="1.5" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
  </div>
  <style>@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}</style>
</section>

<!-- Our Story -->
<section style="padding:80px 24px">
  <div style="max-width:700px;margin:0 auto;text-align:center">
    <div class="reveal">
      <div class="ornament">✿ ✿ ✿</div>
      <p style="font-size:13px;color:#c9a96e;letter-spacing:3px;margin:16px 0 8px">OUR STORY</p>
      <h2 class="serif" style="font-size:clamp(1.8rem,4vw,2.8rem);font-weight:600;margin-bottom:24px">我們的故事</h2>
    </div>
    <div class="reveal" style="text-align:left;margin-top:40px">
      <div class="timeline-item">
        <div>
          <div class="timeline-dot"></div>
          <div class="timeline-line"></div>
        </div>
        <div style="padding-bottom:32px">
          <div style="font-size:12px;color:#c9a96e;font-weight:600;margin-bottom:4px">2020 年 3 月</div>
          <h3 class="serif" style="font-size:20px;font-weight:600;margin-bottom:6px">初次相遇 ☕</h3>
          <p style="font-size:14px;color:#7a6b65;line-height:1.8">在朋友的生日派對上，Kevin 不小心打翻了 Emily 的拿鐵。一句「對不起，我請你喝一杯更好的」，開啟了這段故事。</p>
        </div>
      </div>
      <div class="timeline-item">
        <div>
          <div class="timeline-dot"></div>
          <div class="timeline-line"></div>
        </div>
        <div style="padding-bottom:32px">
          <div style="font-size:12px;color:#c9a96e;font-weight:600;margin-bottom:4px">2020 年 9 月</div>
          <h3 class="serif" style="font-size:20px;font-weight:600;margin-bottom:6px">正式交往 💕</h3>
          <p style="font-size:14px;color:#7a6b65;line-height:1.8">經過半年的咖啡約會與深夜電話，Kevin 在象山步道日落時，鼓起勇氣牽起了 Emily 的手。</p>
        </div>
      </div>
      <div class="timeline-item">
        <div>
          <div class="timeline-dot"></div>
          <div class="timeline-line"></div>
        </div>
        <div style="padding-bottom:32px">
          <div style="font-size:12px;color:#c9a96e;font-weight:600;margin-bottom:4px">2023 年 12 月</div>
          <h3 class="serif" style="font-size:20px;font-weight:600;margin-bottom:6px">求婚 💍</h3>
          <p style="font-size:14px;color:#7a6b65;line-height:1.8">在京都嵐山竹林小徑，初雪紛飛的早晨，Kevin 單膝跪下。Emily 哭著說了「我願意」，竹林裡迴盪著幸福的回音。</p>
        </div>
      </div>
      <div class="timeline-item">
        <div>
          <div class="timeline-dot" style="background:#c9a96e"></div>
        </div>
        <div>
          <div style="font-size:12px;color:#c9a96e;font-weight:600;margin-bottom:4px">2026 年 5 月 17 日</div>
          <h3 class="serif" style="font-size:20px;font-weight:600;margin-bottom:6px">婚禮 🎉</h3>
          <p style="font-size:14px;color:#7a6b65;line-height:1.8">期待與所有最重要的人，一起見證我們人生最美的一天。</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Details -->
<section style="padding:80px 24px;background:#fdf0ed">
  <div style="max-width:900px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:48px">
      <div class="ornament">✿ ✿ ✿</div>
      <p style="font-size:13px;color:#c9a96e;letter-spacing:3px;margin:16px 0 8px">DETAILS</p>
      <h2 class="serif" style="font-size:clamp(1.8rem,4vw,2.8rem);font-weight:600">婚禮資訊</h2>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px">
      <div class="reveal flower-border" style="padding:40px;text-align:center;background:#fff">
        <div style="font-size:40px;margin-bottom:16px">💒</div>
        <h3 class="serif" style="font-size:22px;font-weight:600;margin-bottom:4px">證婚儀式</h3>
        <div class="divider" style="margin:12px auto"></div>
        <p style="font-size:15px;color:#7a6b65;margin-bottom:4px">下午 2:00</p>
        <p style="font-size:15px;font-weight:600;margin-bottom:4px">翡翠灣福華渡假飯店</p>
        <p style="font-size:13px;color:#a08b80">新北市萬里區翡翠路 17 號</p>
        <p style="font-size:13px;color:#a08b80;margin-top:8px">戶外草坪儀式</p>
        <button class="btn-outline-gold" style="margin-top:16px;padding:8px 20px;font-size:13px" onclick="showToast('📍 已開啟地圖導航')">查看地圖</button>
      </div>
      <div class="reveal flower-border" style="padding:40px;text-align:center;background:#fff">
        <div style="font-size:40px;margin-bottom:16px">🥂</div>
        <h3 class="serif" style="font-size:22px;font-weight:600;margin-bottom:4px">晚宴</h3>
        <div class="divider" style="margin:12px auto"></div>
        <p style="font-size:15px;color:#7a6b65;margin-bottom:4px">下午 6:00</p>
        <p style="font-size:15px;font-weight:600;margin-bottom:4px">翡翠灣福華渡假飯店</p>
        <p style="font-size:13px;color:#a08b80">二樓 翡翠廳</p>
        <p style="font-size:13px;color:#a08b80;margin-top:8px">Dress Code: 半正式</p>
        <button class="btn-outline-gold" style="margin-top:16px;padding:8px 20px;font-size:13px" onclick="showToast('📋 已複製地址')">複製地址</button>
      </div>
    </div>

    <!-- Schedule -->
    <div class="reveal" style="margin-top:48px;background:#fff;border-radius:20px;padding:40px;border:1px solid #ebe0d8">
      <h3 class="serif" style="font-size:22px;font-weight:600;text-align:center;margin-bottom:24px">當日流程</h3>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px">
        <div style="display:flex;gap:16px;align-items:center;padding:12px;border-radius:8px;background:#fdf8f4">
          <span class="serif" style="font-size:18px;font-weight:600;color:#b76e79;min-width:60px">14:00</span>
          <span style="font-size:14px">賓客入場 · 戶外草坪</span>
        </div>
        <div style="display:flex;gap:16px;align-items:center;padding:12px;border-radius:8px;background:#fdf8f4">
          <span class="serif" style="font-size:18px;font-weight:600;color:#b76e79;min-width:60px">14:30</span>
          <span style="font-size:14px">證婚儀式</span>
        </div>
        <div style="display:flex;gap:16px;align-items:center;padding:12px;border-radius:8px;background:#fdf8f4">
          <span class="serif" style="font-size:18px;font-weight:600;color:#b76e79;min-width:60px">15:30</span>
          <span style="font-size:14px">拍照 & 茶會</span>
        </div>
        <div style="display:flex;gap:16px;align-items:center;padding:12px;border-radius:8px;background:#fdf8f4">
          <span class="serif" style="font-size:18px;font-weight:600;color:#b76e79;min-width:60px">18:00</span>
          <span style="font-size:14px">晚宴開始</span>
        </div>
        <div style="display:flex;gap:16px;align-items:center;padding:12px;border-radius:8px;background:#fdf8f4">
          <span class="serif" style="font-size:18px;font-weight:600;color:#b76e79;min-width:60px">19:30</span>
          <span style="font-size:14px">遊戲環節 & 抽獎</span>
        </div>
        <div style="display:flex;gap:16px;align-items:center;padding:12px;border-radius:8px;background:#fdf8f4">
          <span class="serif" style="font-size:18px;font-weight:600;color:#b76e79;min-width:60px">21:00</span>
          <span style="font-size:14px">送客 & After Party 🎵</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Gallery -->
<section style="padding:80px 24px">
  <div style="max-width:900px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:48px">
      <div class="ornament">✿ ✿ ✿</div>
      <p style="font-size:13px;color:#c9a96e;letter-spacing:3px;margin:16px 0 8px">GALLERY</p>
      <h2 class="serif" style="font-size:clamp(1.8rem,4vw,2.8rem);font-weight:600">我們的日常</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
      <div class="reveal gallery-item" style="background:linear-gradient(135deg,#fdf0ed,#f9d5d3);display:flex;align-items:center;justify-content:center"><span style="font-size:64px">🌅</span></div>
      <div class="reveal gallery-item" style="background:linear-gradient(135deg,#ecfdf5,#bbf7d0);display:flex;align-items:center;justify-content:center"><span style="font-size:64px">🌿</span></div>
      <div class="reveal gallery-item" style="background:linear-gradient(135deg,#fef3c7,#fde68a);display:flex;align-items:center;justify-content:center"><span style="font-size:64px">☀️</span></div>
      <div class="reveal gallery-item" style="background:linear-gradient(135deg,#ede9fe,#c4b5fd);display:flex;align-items:center;justify-content:center"><span style="font-size:64px">🌸</span></div>
      <div class="reveal gallery-item" style="background:linear-gradient(135deg,#fdf2f8,#fbcfe8);display:flex;align-items:center;justify-content:center;grid-column:span 2;aspect-ratio:2/1"><span style="font-size:80px">💑</span></div>
    </div>
  </div>
</section>

<!-- RSVP -->
<section id="rsvp" style="padding:80px 24px;background:#fdf0ed">
  <div style="max-width:560px;margin:0 auto">
    <div class="reveal" style="text-align:center;margin-bottom:40px">
      <div class="ornament">✿ ✿ ✿</div>
      <p style="font-size:13px;color:#c9a96e;letter-spacing:3px;margin:16px 0 8px">RSVP</p>
      <h2 class="serif" style="font-size:clamp(1.8rem,4vw,2.8rem);font-weight:600;margin-bottom:8px">出席回覆</h2>
      <p style="font-size:14px;color:#a08b80">請於 2026 年 4 月 30 日前回覆</p>
    </div>
    <div class="reveal" style="background:#fff;border-radius:20px;padding:40px;border:1px solid #ebe0d8">
      <div style="margin-bottom:20px">
        <label style="font-size:13px;color:#7a6b65;display:block;margin-bottom:6px">姓名 *</label>
        <input class="rsvp-input" placeholder="請輸入姓名">
      </div>
      <div style="margin-bottom:20px">
        <label style="font-size:13px;color:#7a6b65;display:block;margin-bottom:6px">Email</label>
        <input class="rsvp-input" type="email" placeholder="email@example.com">
      </div>
      <div style="margin-bottom:20px">
        <label style="font-size:13px;color:#7a6b65;display:block;margin-bottom:8px">是否出席 *</label>
        <div class="rsvp-radio">
          <label><input type="radio" name="attend" style="display:none" checked><span>🎉 欣然出席</span></label>
          <label><input type="radio" name="attend" style="display:none"><span>😢 無法出席</span></label>
        </div>
      </div>
      <div style="margin-bottom:20px">
        <label style="font-size:13px;color:#7a6b65;display:block;margin-bottom:6px">出席人數</label>
        <select class="rsvp-input">
          <option>1 位</option>
          <option>2 位（含伴侶）</option>
          <option>3 位（含小孩）</option>
        </select>
      </div>
      <div style="margin-bottom:20px">
        <label style="font-size:13px;color:#7a6b65;display:block;margin-bottom:6px">飲食限制</label>
        <select class="rsvp-input">
          <option>無</option>
          <option>素食</option>
          <option>海鮮過敏</option>
          <option>其他（請備註）</option>
        </select>
      </div>
      <div style="margin-bottom:24px">
        <label style="font-size:13px;color:#7a6b65;display:block;margin-bottom:6px">給新人的話 💌</label>
        <textarea class="rsvp-input" rows="3" placeholder="寫下你的祝福..." style="resize:vertical"></textarea>
      </div>
      <button class="btn-rose" style="width:100%;padding:14px;font-size:16px" onclick="showToast('💌 感謝回覆！期待與你相見')">送出回覆</button>
    </div>
  </div>
</section>

<!-- Footer -->
<section style="padding:60px 24px;text-align:center">
  <div class="reveal">
    <div class="ornament" style="margin-bottom:16px">✿</div>
    <p class="serif" style="font-size:clamp(1.5rem,3vw,2.2rem);font-weight:500;font-style:italic;color:#b76e79;margin-bottom:8px">
      "The best thing to hold onto in life is each other."
    </p>
    <p style="font-size:13px;color:#a08b80;margin-bottom:24px">— Audrey Hepburn</p>
    <div class="divider-wide" style="margin-bottom:24px"></div>
    <p class="serif" style="font-size:20px;color:#3d2e2a;margin-bottom:4px">Kevin & Emily</p>
    <p style="font-size:13px;color:#a08b80">2026.05.17 · 翡翠灣</p>
  </div>
</section>

<script>
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}

// Countdown
const wedding=new Date('2026-05-17T14:00:00+08:00').getTime();
function updateCountdown(){
  const now=Date.now();const diff=wedding-now;
  if(diff<=0){document.getElementById('cd-days').textContent='0';document.getElementById('cd-hours').textContent='0';document.getElementById('cd-mins').textContent='0';document.getElementById('cd-secs').textContent='0';return}
  const d=Math.floor(diff/(1000*60*60*24));
  const h=Math.floor((diff%(1000*60*60*24))/(1000*60*60));
  const m=Math.floor((diff%(1000*60*60))/(1000*60));
  const s=Math.floor((diff%(1000*60))/1000);
  document.getElementById('cd-days').textContent=d;
  document.getElementById('cd-hours').textContent=String(h).padStart(2,'0');
  document.getElementById('cd-mins').textContent=String(m).padStart(2,'0');
  document.getElementById('cd-secs').textContent=String(s).padStart(2,'0');
}
updateCountdown();setInterval(updateCountdown,1000);

// RSVP radio
document.querySelectorAll('.rsvp-radio label').forEach(l=>{
  l.addEventListener('click',()=>{
    l.parentNode.querySelectorAll('label').forEach(lb=>lb.style.borderColor='#ebe0d8');
    l.style.borderColor='#b76e79';
  });
});

// Reveal
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}})},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
</script>

</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
