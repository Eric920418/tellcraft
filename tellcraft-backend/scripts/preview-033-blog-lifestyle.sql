INSERT INTO template_previews (template_id, html_content, version)
VALUES ('0b5df05f-9a59-4f96-851e-24f26152bc34', $HTML$
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AURA — 生活風格誌</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans TC',sans-serif;background:#fefcfb;color:#1a1a1a;overflow-x:hidden}
.serif{font-family:'Playfair Display','Noto Sans TC',serif}
.pink{color:#d4638f}
.bg-blush{background:#fdf2f8}
.bg-lavender{background:#f5f0ff}
.bg-mint{background:#ecfdf5}
.bg-peach{background:#fff7ed}
.article-card{border-radius:16px;overflow:hidden;transition:all 0.3s;cursor:pointer;background:#fff;border:1px solid #f3e8f4}
.article-card:hover{transform:translateY(-6px);box-shadow:0 20px 40px rgba(212,99,143,0.1)}
.article-thumb{width:100%;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;font-size:56px;position:relative}
.cat-label{position:absolute;top:12px;left:12px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(255,255,255,0.9);backdrop-filter:blur(4px)}
.btn-pink{background:#d4638f;color:#fff;border:none;padding:12px 28px;border-radius:24px;font-weight:600;cursor:pointer;transition:all 0.3s;font-size:14px}
.btn-pink:hover{background:#be4b77;transform:translateY(-2px);box-shadow:0 8px 20px rgba(212,99,143,0.25)}
.btn-outline{border:1.5px solid #e8d5e0;color:#d4638f;padding:10px 24px;border-radius:24px;font-weight:500;cursor:pointer;transition:all 0.3s;background:transparent;font-size:14px}
.btn-outline:hover{background:#fdf2f8;border-color:#d4638f}
.tag{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.2s}
.tag-beauty{background:#fdf2f8;color:#d4638f}
.tag-fashion{background:#f5f0ff;color:#7c3aed}
.tag-food{background:#fff7ed;color:#ea580c}
.tag-travel{background:#ecfdf5;color:#059669}
.tag-wellness{background:#eff6ff;color:#2563eb}
.tag-home{background:#fef3c7;color:#b45309}
.toast{position:fixed;bottom:24px;right:24px;background:#d4638f;color:#fff;padding:14px 24px;border-radius:24px;font-size:14px;font-weight:500;transform:translateY(100px);opacity:0;transition:all 0.4s;z-index:9999}
.toast.show{transform:translateY(0);opacity:1}
.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.detail-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:100;display:none;align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto}
.detail-panel{background:#fff;border-radius:24px;max-width:720px;width:100%;margin:40px auto;position:relative}
.newsletter-input{border:1.5px solid #e8d5e0;border-radius:24px;padding:12px 20px;font-size:14px;outline:none;width:100%;background:#fefcfb}
.newsletter-input:focus{border-color:#d4638f}
</style>
</head>
<body>

<div class="toast" id="toast"></div>

<div class="detail-overlay" id="detail-overlay" onclick="if(event.target===this)closeArticle()">
  <div class="detail-panel" id="detail-panel"></div>
</div>

<!-- Nav -->
<nav style="position:fixed;top:0;left:0;right:0;z-index:50;backdrop-filter:blur(12px);background:rgba(254,252,251,0.9);padding:14px 0;border-bottom:1px solid #f3e8f4">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between">
    <div style="cursor:pointer" onclick="window.scrollTo({top:0,behavior:'smooth'})">
      <span class="serif" style="font-size:24px;font-weight:700;color:#d4638f">AURA</span>
    </div>
    <div style="display:flex;align-items:center;gap:24px">
      <a style="text-decoration:none;color:#737373;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#d4638f'" onmouseout="this.style.color='#737373'">美妝</a>
      <a style="text-decoration:none;color:#737373;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#d4638f'" onmouseout="this.style.color='#737373'">穿搭</a>
      <a style="text-decoration:none;color:#737373;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#d4638f'" onmouseout="this.style.color='#737373'">美食</a>
      <a style="text-decoration:none;color:#737373;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#d4638f'" onmouseout="this.style.color='#737373'">旅行</a>
      <a style="text-decoration:none;color:#737373;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#d4638f'" onmouseout="this.style.color='#737373'">身心</a>
    </div>
    <button class="btn-pink" style="padding:8px 20px;font-size:13px" onclick="showToast('✨ 歡迎訂閱！')">訂閱</button>
  </div>
</nav>

<!-- Hero -->
<section style="padding:100px 24px 40px">
  <div style="max-width:1100px;margin:0 auto">
    <div class="reveal" style="background:linear-gradient(135deg,#fdf2f8,#f5f0ff);border-radius:24px;padding:48px;display:grid;grid-template-columns:1.2fr 0.8fr;gap:40px;align-items:center;cursor:pointer" onclick="showArticle(0)">
      <div>
        <span class="tag tag-beauty" style="margin-bottom:12px;display:inline-block">美妝</span>
        <h1 class="serif" style="font-size:clamp(1.8rem,4vw,2.8rem);font-weight:700;line-height:1.2;margin-bottom:16px">
          2026 春季保養革命：<br>肌膚屏障修復全指南
        </h1>
        <p style="font-size:15px;color:#737373;line-height:1.7;margin-bottom:20px">
          皮膚科醫師推薦的黃金修復法則，從清潔到封層，每一步都有科學根據。不再被行銷話術牽著走。
        </p>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:32px;height:32px;border-radius:50%;background:#d4638f;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:600">E</div>
          <div><span style="font-size:13px;font-weight:600">Emma Lin</span><span style="font-size:12px;color:#a1a1aa"> · 8 分鐘閱讀</span></div>
        </div>
      </div>
      <div style="background:#fce7f3;border-radius:16px;padding:48px;text-align:center">
        <span style="font-size:80px">✨</span>
      </div>
    </div>
  </div>
</section>

<!-- Tags Bar -->
<section style="padding:0 24px 32px">
  <div style="max-width:1100px;margin:0 auto;display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
    <span class="tag tag-beauty" style="cursor:pointer" onclick="showToast('篩選：美妝')">💄 美妝</span>
    <span class="tag tag-fashion" style="cursor:pointer" onclick="showToast('篩選：穿搭')">👗 穿搭</span>
    <span class="tag tag-food" style="cursor:pointer" onclick="showToast('篩選：美食')">🍰 美食</span>
    <span class="tag tag-travel" style="cursor:pointer" onclick="showToast('篩選：旅行')">✈️ 旅行</span>
    <span class="tag tag-wellness" style="cursor:pointer" onclick="showToast('篩選：身心')">🧘 身心</span>
    <span class="tag tag-home" style="cursor:pointer" onclick="showToast('篩選：居家')">🏠 居家</span>
  </div>
</section>

<!-- Articles Grid -->
<section style="padding:0 24px 60px">
  <div style="max-width:1100px;margin:0 auto">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px" id="articles-grid"></div>
  </div>
</section>

<!-- Newsletter -->
<section style="padding:60px 24px">
  <div class="reveal" style="max-width:600px;margin:0 auto;background:linear-gradient(135deg,#fdf2f8,#f5f0ff);border-radius:24px;padding:48px;text-align:center">
    <span style="font-size:40px;display:block;margin-bottom:16px">💌</span>
    <h2 class="serif" style="font-size:24px;font-weight:700;margin-bottom:8px">加入 AURA 電子報</h2>
    <p style="font-size:14px;color:#737373;margin-bottom:24px;line-height:1.7">每週精選生活靈感，直送你的信箱。已有 12,000+ 訂閱者。</p>
    <div style="display:flex;gap:10px;max-width:400px;margin:0 auto">
      <input class="newsletter-input" placeholder="輸入 Email" style="flex:1">
      <button class="btn-pink" onclick="showToast('✨ 訂閱成功！歡迎加入')">訂閱</button>
    </div>
    <p style="font-size:11px;color:#a1a1aa;margin-top:12px">不會寄垃圾信，隨時可取消。</p>
  </div>
</section>

<!-- Footer -->
<footer style="padding:48px 24px;border-top:1px solid #f3e8f4">
  <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px">
    <div>
      <span class="serif" style="font-size:24px;font-weight:700;color:#d4638f;display:block;margin-bottom:12px">AURA</span>
      <p style="font-size:13px;color:#a1a1aa;line-height:1.7;max-width:260px">探索美好生活的每一個面向。美妝、穿搭、美食、旅行、身心靈。</p>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;margin-bottom:16px;color:#737373">分類</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a style="font-size:13px;color:#a1a1aa;text-decoration:none;cursor:pointer">美妝保養</a>
        <a style="font-size:13px;color:#a1a1aa;text-decoration:none;cursor:pointer">穿搭時尚</a>
        <a style="font-size:13px;color:#a1a1aa;text-decoration:none;cursor:pointer">美食探店</a>
        <a style="font-size:13px;color:#a1a1aa;text-decoration:none;cursor:pointer">旅行日誌</a>
      </div>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;margin-bottom:16px;color:#737373">社群</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a style="font-size:13px;color:#a1a1aa;text-decoration:none;cursor:pointer">Instagram</a>
        <a style="font-size:13px;color:#a1a1aa;text-decoration:none;cursor:pointer">YouTube</a>
        <a style="font-size:13px;color:#a1a1aa;text-decoration:none;cursor:pointer">Pinterest</a>
        <a style="font-size:13px;color:#a1a1aa;text-decoration:none;cursor:pointer">Threads</a>
      </div>
    </div>
    <div>
      <div style="font-size:13px;font-weight:600;margin-bottom:16px;color:#737373">關於</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a style="font-size:13px;color:#a1a1aa;text-decoration:none;cursor:pointer">編輯團隊</a>
        <a style="font-size:13px;color:#a1a1aa;text-decoration:none;cursor:pointer">合作邀約</a>
        <a style="font-size:13px;color:#a1a1aa;text-decoration:none;cursor:pointer">隱私政策</a>
      </div>
    </div>
  </div>
  <div style="max-width:1100px;margin:32px auto 0;padding-top:24px;border-top:1px solid #f3e8f4;text-align:center">
    <p style="font-size:12px;color:#a1a1aa">© 2026 AURA Magazine. All rights reserved.</p>
  </div>
</footer>

<script>
const articles=[
  {id:0,title:'2026 春季保養革命：肌膚屏障修復全指南',cat:'beauty',tag:'tag-beauty',tagLabel:'美妝',emoji:'✨',bg:'#fdf2f8',author:'Emma Lin',avatar:'E',time:'8 分鐘',body:'<p>近年來「肌膚屏障」成為保養界最熱門的關鍵字。所謂的屏障修復，不是要你買一堆新產品，而是回歸最基本的護膚邏輯。</p><h3>Step 1：溫和清潔</h3><p>把起泡網丟掉吧。改用胺基酸系潔面乳，pH 值 5.5 最理想。清潔後皮膚不應該有緊繃感。</p><h3>Step 2：精簡保濕</h3><p>神經醯胺（Ceramide）是修復屏障的核心成分。搭配玻尿酸做為保濕底層，再用含角鯊烷的面霜封層。</p><h3>Step 3：防曬是最強的抗老</h3><p>SPF50 PA++++ 是基本。每 2 小時補擦一次。室內靠窗也要擦。這不是行銷話術，是皮膚科的共識。</p>'},
  {id:1,title:'東京 72 小時：文青必訪的 8 間咖啡館',cat:'travel',tag:'tag-travel',tagLabel:'旅行',emoji:'☕',bg:'#ecfdf5',author:'Mia Chang',avatar:'M',time:'12 分鐘',body:'<p>東京的咖啡文化已經進化到另一個層次。這次三天兩夜，我走訪了 8 間各有特色的咖啡館。</p><h3>1. Fuglen Tokyo 代官山</h3><p>來自挪威奧斯陸的北歐風咖啡館。白天是咖啡店，晚上變成雞尾酒吧。手沖拿鐵堪稱完美。</p><h3>2. Blue Bottle 清澄白河</h3><p>倉庫改造的旗艦店，挑高空間讓人心曠神怡。必點 New Orleans Iced Coffee。</p>'},
  {id:2,title:'極簡衣櫃計畫：用 30 件打造 90 天穿搭',cat:'fashion',tag:'tag-fashion',tagLabel:'穿搭',emoji:'👗',bg:'#f5f0ff',author:'Sophie Wu',avatar:'S',time:'6 分鐘',body:'<p>擁有更少但更好的衣服，是我今年給自己的課題。經過三個月的實驗，我用 30 件單品撐過了一整季。</p><h3>基本原則</h3><p>80% 基本款 + 20% 亮點單品。顏色控制在 5 色以內。每件都能至少搭出 3 套造型。</p>'},
  {id:3,title:'台北最值得一訪的 5 間抹茶甜點店',cat:'food',tag:'tag-food',tagLabel:'美食',emoji:'🍵',bg:'#fff7ed',author:'Yuki Chen',avatar:'Y',time:'5 分鐘',body:'<p>身為抹茶控，台北這幾間店是我的心頭好。從濃厚到清爽，總有一款適合你。</p><h3>1. 微生 Smile</h3><p>信義區巷弄內的秘密基地。他們的濃抹茶提拉米蘇用的是宇治一番茶，苦甜平衡到令人感動。</p>'},
  {id:4,title:'冥想入門：給焦慮世代的 10 分鐘靜心指南',cat:'wellness',tag:'tag-wellness',tagLabel:'身心',emoji:'🧘',bg:'#eff6ff',author:'Aria Huang',avatar:'A',time:'7 分鐘',body:'<p>你不需要去印度修行，也不需要盤腿坐蓮花座。冥想可以很簡單：找個安靜的地方，閉上眼睛，專注呼吸 10 分鐘。</p><h3>常見誤區</h3><p>冥想不是「什麼都不想」，而是覺察自己的念頭而不評判。腦中有雜念是正常的，重點是注意到它然後溫柔地回到呼吸。</p>'},
  {id:5,title:'租屋也能打造夢想空間：零釘牆佈置術',cat:'home',tag:'tag-home',tagLabel:'居家',emoji:'🏠',bg:'#fef3c7',author:'Lena Wu',avatar:'L',time:'10 分鐘',body:'<p>租屋族最大的限制就是不能釘牆、不能改裝。但其實有很多方法可以在不破壞牆面的情況下打造出雜誌感的空間。</p><h3>1. 3M 無痕掛鉤</h3><p>這是租屋族的救星。搭配漂亮的畫框，瞬間提升整面牆的質感。</p>'},
  {id:6,title:'素顏好氣色：韓系光澤底妝的秘密',cat:'beauty',tag:'tag-beauty',tagLabel:'美妝',emoji:'💄',bg:'#fdf2f8',author:'Emma Lin',avatar:'E',time:'6 分鐘',body:'<p>韓國女生的底妝秘訣不是遮蓋力，而是讓肌膚自帶光澤感。重點在「skincare is makeup」的概念。</p>'},
  {id:7,title:'京都秋日散策：紅葉狩的完美三日遊',cat:'travel',tag:'tag-travel',tagLabel:'旅行',emoji:'🍁',bg:'#ecfdf5',author:'Mia Chang',avatar:'M',time:'15 分鐘',body:'<p>京都的秋天是日本最美的季節之一。我把三天行程精心安排，避開人潮，找到最私密的賞楓秘境。</p>'},
  {id:8,title:'一週備餐計畫：健康午餐只需週日 2 小時',cat:'food',tag:'tag-food',tagLabel:'美食',emoji:'🥗',bg:'#fff7ed',author:'Yuki Chen',avatar:'Y',time:'8 分鐘',body:'<p>meal prep 不是什麼新概念，但真正堅持下來的人不多。關鍵是：不要太複雜。我的原則是每週只準備 3 道主菜 + 2 種配菜。</p>'}
];

function renderArticles(){
  document.getElementById('articles-grid').innerHTML=articles.slice(1).map((a,i)=>`
    <div class="article-card reveal visible" onclick="showArticle(${a.id})">
      <div class="article-thumb" style="background:${a.bg}">
        <span style="font-size:56px">${a.emoji}</span>
        <span class="cat-label"><span class="${a.tag}" style="background:transparent;padding:0">${a.tagLabel}</span></span>
      </div>
      <div style="padding:20px">
        <h3 style="font-size:16px;font-weight:700;line-height:1.4;margin-bottom:8px">${a.title}</h3>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:24px;height:24px;border-radius:50%;background:#d4638f;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:600">${a.avatar}</div>
          <span style="font-size:12px;color:#a1a1aa">${a.author} · ${a.time}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function showArticle(id){
  const a=articles.find(x=>x.id===id);if(!a)return;
  document.getElementById('detail-panel').innerHTML=`
    <button onclick="closeArticle()" style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.1);border:none;border-radius:50%;width:32px;height:32px;font-size:16px;cursor:pointer;color:#737373;z-index:1;display:flex;align-items:center;justify-content:center">✕</button>
    <div style="background:${a.bg};padding:48px;text-align:center;border-radius:24px 24px 0 0">
      <span style="font-size:80px">${a.emoji}</span>
    </div>
    <div style="padding:36px">
      <span class="tag ${a.tag}" style="margin-bottom:12px;display:inline-block">${a.tagLabel}</span>
      <h1 class="serif" style="font-size:28px;font-weight:700;line-height:1.3;margin-bottom:16px">${a.title}</h1>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid #f3e8f4">
        <div style="width:36px;height:36px;border-radius:50%;background:#d4638f;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:600">${a.avatar}</div>
        <div><span style="font-size:14px;font-weight:600">${a.author}</span><br><span style="font-size:12px;color:#a1a1aa">${a.time}閱讀</span></div>
      </div>
      <div style="font-size:15px;color:#525252;line-height:2">${a.body}</div>
      <div style="display:flex;gap:8px;margin-top:24px;padding-top:24px;border-top:1px solid #f3e8f4">
        <button class="btn-outline" style="font-size:12px;padding:6px 16px" onclick="showToast('❤️ 已收藏')">❤️ 收藏</button>
        <button class="btn-outline" style="font-size:12px;padding:6px 16px" onclick="showToast('📋 連結已複製')">🔗 分享</button>
      </div>
    </div>
  `;
  document.getElementById('detail-overlay').style.display='flex';
}
function closeArticle(){document.getElementById('detail-overlay').style.display='none'}
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}

renderArticles();
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}})},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
</script>

</body>
</html>
$HTML$, 1)
ON CONFLICT (template_id)
DO UPDATE SET html_content = EXCLUDED.html_content, version = template_previews.version + 1, updated_at = NOW();
