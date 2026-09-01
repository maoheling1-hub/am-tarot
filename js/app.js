/* 阿毛塔罗 - 核心逻辑 */
(function(){
'use strict';

/* ---------- 数据合并与工具 ---------- */
const ELEMENTS = { '火':'火 · 行动/热情', '水':'水 · 情感/直觉', '风':'风 · 思考/理性', '土':'土 · 物质/务实' };
const SUITE = { wands:'权杖', cups:'圣杯', swords:'宝剑', pents:'星币' };
const SUITE_CN = { wands:'权杖(火)', cups:'圣杯(水)', swords:'宝剑(风)', pents:'星币(土)' };

let DECK = []; // 全部78张

const MAJOR_MAP = { 0:'愚人',1:'魔术师',2:'女祭司',3:'皇后',4:'皇帝',5:'教皇',6:'恋人',7:'战车',8:'力量',9:'隐士',10:'命运之轮',11:'正义',12:'倒吊人',13:'死神',14:'节制',15:'恶魔',16:'高塔',17:'星星',18:'月亮',19:'太阳',20:'审判',21:'世界' };

function buildDeck(){
  DECK = [];
  MAJOR.forEach(c=> DECK.push({ ...c, suite:'major', suitName:'大阿卡纳' }));
  WANDS.forEach(c=> DECK.push({ ...c, suite:'wands', suitName:SUITE_CN.wands }));
  CUPS.forEach(c=> DECK.push({ ...c, suite:'cups', suitName:SUITE_CN.cups }));
  SWORDS.forEach(c=> DECK.push({ ...c, suite:'swords', suitName:SUITE_CN.swords }));
  PENTACLES.forEach(c=> DECK.push({ ...c, suite:'pents', suitName:SUITE_CN.pents }));
}

/* 花色首牌/宫廷显示 */
function suitNameOf(suite){
  return SUITE[suite] || '大阿卡纳';
}

/* ---------- DOM 助手 ---------- */
const $ = (s)=> document.querySelector(s);
const el = (t, cls, html)=> { const e=document.createElement(t); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; };
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------- 密码学级安全随机 ----------
   优先使用 crypto.getRandomValues()（操作系统真随机源），
   仅在极少数不支持的环境回退到 Math.random()。
*/
function secureRandom(){
  if(typeof crypto!=='undefined' && crypto.getRandomValues){
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 4294967296; // 归一化到 [0,1)
  }
  return Math.random();
}

/* ---------- 洗牌（Fisher-Yates 均匀洗牌法） ----------
   每一个位置都与它之前的随机位置交换，算法保证 78! 种排列等概率。
*/
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(secureRandom()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

/* ---------- 抽牌 ---------- */
function drawCards(count){
  const arr = shuffle(DECK);
  return arr.slice(0, count).map(c=>({ card:c, reversed: secureRandom()<0.35, position:0 }));
}

/* ---------- 状态 ---------- */
const state = { current:[], spreadCount:1, question:'' };

/* ---------- 卡片花纹 SVG ---------- */
function cardImagePath(card){
  return `images/${card.suite}/${card.id}.jpg`;
}

function cardBackHTML(){
  return `<div class="cardface card-back"><div class="back-pattern">✦</div><div class="back-frame"></div></div>`;
}

function cardFaceHTML(card, reversed, number){
  const elm = `<span class="cf-elm">${card.el}</span>`;
  const numDisplay = card.num;
  const rev = reversed ? 'rev' : '';
  const imgPath = cardImagePath(card);
  // 优先显示真实塔罗图片；图片加载失败时回退到右侧的文字牌面
  const iconPart = `
    <div class="cf-iconbox">${suitIcon(card.suite)}
      <div class="cf-name">${card.n}</div>
      <div class="cf-en">${card.en}</div>
    </div>`;
  return `
  <div class="cardface card-front ${rev}" data-i="${number}">
    <img class="cf-img" src="${imgPath}" alt="${card.n}" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="cf-fallback">${iconPart}
      <div class="cf-numline">
        <span class="cf-num">${numDisplay}</span>
        <span class="cf-suit">${card.suitName}</span>
        ${elm}
      </div>
    </div>
  </div>`;
}

function suitIcon(suite){
  switch(suite){
    case 'wands': return '<span class="ico">🌿</span>';
    case 'cups': return '<span class="ico">🏺</span>';
    case 'swords': return '<span class="ico">⚔️</span>';
    case 'pents': return '<span class="ico">🪙</span>';
    default: return '<span class="ico">✦</span>';
  }
}

/* ---------- 洗牌光效 ---------- */
function burstSparkle(){
  const table = $('#table');
  const rect = table.getBoundingClientRect();
  for(let s=0;s<10;s++){
    const sp = el('span','spark');
    const x = Math.random()*rect.width;
    const y = 20 + Math.random()*(rect.height-40);
    sp.style.left = x + 'px';
    sp.style.top = y + 'px';
    sp.style.setProperty('--dx', (Math.random()*80-40)+'px');
    sp.style.setProperty('--dy', (Math.random()*70-35)+'px');
    sp.style.setProperty('--r', (Math.random()*360)+'deg');
    sp.style.animationDelay = (Math.random()*0.1)+'s';
    table.appendChild(sp);
    setTimeout(()=> sp.remove(), 700);
  }
}

/* ---------- 牌面渲染（洗牌 → 飞牌散开） ---------- */
function renderTable(dealtImmediately){
  const table = $('#table');
  table.innerHTML = '';
  const deck = el('div','deck-pile');
  deck.innerHTML = `
    <div class="deck-stack">
      <div class="db d1"></div><div class="db d2"></div><div class="db d3"></div>
      <div class="db d4"></div><div class="db d5"></div><div class="db d6"></div>
      <div class="db top">✦</div>
    </div>
    <div class="deck-glint"></div>`;
  if(!dealtImmediately) deck.classList.add('shuffling');
  table.appendChild(deck);

  // 初始全部背面叠在中央牌堆上
  state.current.forEach((item, i)=>{
    const wrap = el('div', `grid-cell cell-${state.spreadCount} dealing`);
    wrap.innerHTML = `
      <div class="card3d" data-i="${i}">
        <div class="flipper">
          ${cardBackHTML()}
          ${cardFaceHTML(item.card, item.reversed, i)}
        </div>
        <div class="pos-tag"></div>
      </div>`;
    table.appendChild(wrap);
  });

  if(dealtImmediately){
    table.querySelectorAll('.grid-cell').forEach(c=> c.classList.add('dealt'));
    deck.style.opacity = '0';
  }
}

/* 翻转单张 */
function flipCard(cellIndex){
  const flipper = document.querySelector(`.card3d[data-i="${cellIndex}"] .flipper`);
  if(!flipper) return;
  flipper.classList.add('flipped');
}

/* 洗牌(约1.4s) → 逐张散开 → 逐张翻开 → 出现解读 */
function flipAllSequential(){
  const n = state.current.length;
  const shuffleTime = 1400;      // 中央牌堆洗牌抖动时长
  const dealGap = 220;           // 每张散开间隔
  const table = $('#table');
  const deck = table.querySelector('.deck-pile');

  // 1) 洗牌结束 → 牌从中央牌堆飞向各自位置散开
  setTimeout(()=>{
    table.querySelectorAll('.grid-cell').forEach((c,i)=>{
      c.style.transitionDelay = i*dealGap/1000 + 's';
      c.classList.add('dealt');
    });
    if(deck){ deck.style.opacity = '0'; }
  }, shuffleTime);

  // 2) 散开后逐张翻牌，露出正面
  const flipBase = shuffleTime + dealGap*n + 250;
  const flipGap = state.spreadCount===1 ? 420 : 550;
  state.current.forEach((_, i)=>{
    setTimeout(()=> burstSparkle(), flipBase - 180 + i*flipGap);
    setTimeout(()=> flipCard(i), flipBase + i*flipGap);
  });

  // 3) 全部翻开后显示解读
  const revealDelay = flipBase + n*flipGap + 450;
  setTimeout(()=> renderResult(), revealDelay);
}

/* ---------- 解读渲染 ---------- */
function renderResult(){
  const res = $('#result');
  res.innerHTML = '';
  if(!state.current.length) return;

  // 标题
  const question = state.question || '今日对内心的指引';
  res.appendChild(el('div','res-question', `✦ ${escapeHtml(question)} ✦`));

  // 每张牌详解
  state.current.forEach((item, i)=>{
    const { card, reversed } = item;
    const posName = state.spreadCount===3 ? threePosName(i) : '';
    const block = renderCardDetail(card, reversed, posName, true);
    res.appendChild(block);
  });

  // 综合结语
  res.appendChild(renderSummary());

  // 引导学牌控
  res.appendChild(learningCta());
  res.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

/* 三张牌阵位名 */
function threePosName(i){ return ['过去','现在','未来'][i] || ''; }

/* 单张牌完整详情块 */
function renderCardDetail(card, reversed, posName, withButt){
  const wrap = el('div','detail-card');
  const kw = reversed ? card.kR : card.kU;
  const detail = reversed ? card.r : card.m;
  wrap.innerHTML = `
    <div class="dc-head">
      <div class="dc-thumb">
        <img class="dc-img" src="images/${card.suite}/${card.id}.jpg" alt="${card.n}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="dc-fb" style="display:none"><span class="dc-fb-icon">${suitIcon(card.suite)}</span></div>
      </div>
      <div class="dc-title">
        ${posName ? `<div class="dc-pos">${posName}</div>`:''}
        <div class="dc-name">${card.n} <span class="dc-en">${card.en}</span></div>
        <div class="dc-meta">${SUITE[card.suite]||'大阿卡纳'} · ${card.num} · 元素${card.el}</div>
      </div>
      <div class="dc-orient ${reversed?'rev':''}">${reversed?'逆位':'正位'}</div>
    </div>
    <div class="dc-kw"><div class="kw-row">${kw.map(k=>`<span class="chip">${k}</span>`).join('')}</div></div>
    <div class="dc-mean"><b>${reversed?'逆位':'正位'}牌意　</b>${detail}</div>
    <div class="dc-learn">📗 <b>学习引导</b>　${card.teach}</div>
    ${card.sym ? `<div class="dc-sym">🔍 <b>牌面象征</b>　${card.sym}</div>`:''}
  `;
  if(withButt){
    const more = el('div','dc-open','继续学习这张牌 »');
    more.onclick = ()=> openModal(card, reversed);
    wrap.appendChild(more);
  }
  return wrap;
}

/* 综合结语 */
function renderSummary(){
  const sum = el('div','summary');
  if(state.spreadCount===1){
    const { card, reversed } = state.current[0];
    const or = reversed?'逆位':'正位';
    sum.innerHTML = `<div class="sum-head">⊹ 一句话总结 ⊹</div>
      <div class="sum-text">“${card.n}${or}”提醒你：${reversed ? card.r.slice(0,40) : card.m.slice(0,40)}……<br>
      把它当作今天的一个<b>提醒或角度</b>，不必全信，用它来观照自己的处境。</div>`;
  } else {
    const names = state.current.map((it,i)=>`${threePosName(i)}「${it.card.n}${it.reversed?'逆':''}」`);
    sum.innerHTML = `<div class="sum-head">⊹ 三牌故事 ⊹</div>
      <div class="sum-text">${names.join(' → ')}<br>
      过去留下了痕迹，现在是关键，未来由你的选择书写。试着用每张牌的<b>关键词</b>串成一句只属于你的话。</div>`;
  }
  return sum;
}

/* 引导学牌入口 */
function learningCta(){
  const box = el('div','learn-cta');
  box.innerHTML = `<div class="lc-title">想真正学会塔罗？</div>
    <div class="lc-sub">① 把每张牌的 <b>3 个关键词</b>当“记忆锚点”，别死记长文。<br>
    ② 看<b>学习引导</b>里的内核故事，理解它是谁。<br>
    ③ 去“牌库自学”逐张浏览，或去“自测”检验自己记下没。<br>
    ④ 每天抽一张牌当作今日提醒，练出牌感。</div>
    <div class="lc-btns">
      <button class="ghost" onclick="showTab('learn');scrollSearch([${state.current.map(it=>`'${it.card.n}'`).join(',')}])">去牌库看这张牌</button>
      <button class="ghost" onclick="showTab('quiz')">去自测一下</button>
    </div>`;
  return box;
}
window.showTab = showTab; // 供内联调用
window.scrollSearch = function(){ showTab('learn'); };

/* ---------- 弹层：牌库/详解详情 ---------- */
function openModal(card, reversed){
  const mc = $('#modalContent');
  const block = renderCardDetail(card, reversed, '', false);
  block.classList.add('in-modal');
  mc.innerHTML = '';
  mc.appendChild(block);
  // 关联练习
  const ex = el('div','modal-ex');
  ex.innerHTML = `<div class="ex-title">✎ 自我练习</div>
    <div class="ex-text">① 不看这里，回忆这张牌 <b>3 个正位关键词</b>。<br>
    ② 若抽到逆位，问：这个能量是“过度”还是“受阻”？<br>
    ③ 用一句话造句：“此刻我在生活中，哪里像${card.n}？”<br>
    ④ 收藏这张牌，过几天回来看，遗忘会替你标记重点。</div>`;
  mc.appendChild(ex);
  $('#modal').classList.add('open');
  $('#modalClose').onclick = ()=> { $('#modal').classList.remove('open'); };
  mc.querySelector('.dc-open')?.remove();
}
window.openModal = openModal; // 供牌库 grid 调用

function showModalCard(card){
  openModal(card, false);
}

/* ---------- 抽牌按钮 ---------- */
$('#drawBtn').onclick = function(){
  state.question = $('#questionInput').value.trim();
  const count = state.spreadCount;
  state.current = drawCards(count);
  $('#result').innerHTML = '';
  renderTable();
  flipAllSequential();
};

/* 牌阵切换 */
document.querySelectorAll('.spread').forEach(btn=>{
  btn.onclick = function(){
    document.querySelectorAll('.spread').forEach(b=>b.classList.remove('active'));
    this.classList.add('active');
    state.spreadCount = parseInt(this.dataset.count, 10);
    $('#result').innerHTML = '';
    renderTable(true); // 切换牌阵只摆牌站位，不触发洗牌动画
  };
});

/* ---------- Tab 切换 ---------- */
function showTab(name){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id===name));
  window.scrollTo({ top:0, behavior:'smooth' });
  if(name==='learn') renderCardGrid();
  if(name==='quiz') resetQuiz();
}
document.querySelectorAll('.tab').forEach(t=>{
  t.onclick = ()=> showTab(t.dataset.tab);
});

/* ---------- 牌库浏览 ---------- */
const learnState = { filter:'all', kw:'' };

function renderCardGrid(){
  const grid = $('#cardGrid');
  grid.innerHTML = '';
  let list = DECK.slice();
  if(learnState.filter==='major') list = list.filter(c=>c.suite==='major');
  if(learnState.filter==='minor') list = list.filter(c=>c.suite!=='major');
  if(learnState.kw){
    const kw = learnState.kw.toLowerCase();
    list = list.filter(c=> c.n.includes(kw) || c.en.toLowerCase().includes(kw) ||
      c.kU.join(' ').toLowerCase().includes(kw) || c.kR.join(' ').toLowerCase().includes(kw));
  }
  $('#deckCount').textContent = list.length;
  list.forEach(card=>{
    const cell = el('div','grid-card');
    cell.dataset.suite = card.suite;
    cell.innerHTML = `
      <div class="gc-img-wrap">
        <img class="gc-img" src="images/${card.suite}/${card.id}.jpg" alt="${card.n}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="gc-fallback" style="display:none">
          <span class="gc-fb-icon">${suitIcon(card.suite)}</span>
        </div>
      </div>
      <div class="gc-name">${card.n}</div>
      <div class="gc-sub">${SUITE[card.suite]||'大阿卡纳'} · ${card.el}元素</div>`;
    cell.onclick = ()=> openModal(card, false);
    grid.appendChild(cell);
  });
}

document.querySelectorAll('.bfilter').forEach(b=>{
  b.onclick = function(){
    document.querySelectorAll('.bfilter').forEach(x=>x.classList.remove('active'));
    this.classList.add('active');
    learnState.filter = this.dataset.filter;
    renderCardGrid();
  };
});
$('#learnSearch').addEventListener('input', function(){
  learnState.kw = this.value.trim();
  renderCardGrid();
});

/* ---------- 自测 ---------- */
let quizCard = null;

function resetQuiz(){
  $('#quizArea').innerHTML = '';
  $('#quizCardBack').style.display='flex';
  quizCard = null;
}

$('#quizDraw').onclick = function(){
  quizCard = DECK[Math.floor(Math.random()*DECK.length)];
  const rev = Math.random()<0.5;
  $('#quizCardBack').style.display='none';
  const area = $('#quizArea');
  area.innerHTML = '';
  const q = el('div','quiz-card');
  q.innerHTML = `
    <div class="qz-img-wrap">
      <img class="qz-img" src="images/${quizCard.suite}/${quizCard.id}.jpg" alt="${quizCard.n}" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="qz-fb" style="display:none"><span class="qz-fb-icon">✦</span></div>
    </div>
    <div class="qz-name">${quizCard.n} <span>${quizCard.en}</span></div>
    <div class="qz-meta">${SUITE[quizCard.suite]||'大阿卡纳'} · ${quizCard.num} · 元素${quizCard.el} · ${rev?'逆位':'正位'}</div>
    <div class="qz-ask">先凭记忆回想这张牌的<b>关键词</b>与<b>一句话牌意</b>，再看看对照。</div>
    <div class="qz-mem">你来写：<textarea id="qzCapture" rows="2" placeholder="想到什么都行，想不出来就直接看答案"></textarea></div>
    <button id="qzShow" class="draw-btn small">查看对照答案</button>
    <div id="qzAns" style="display:none"></div>`;
  area.appendChild(q);
  $('#qzShow', q).onclick = function(){
    const ans = $('#qzAns');
    ans.style.display='block';
    const detail = renderCardDetail(quizCard, rev, '', false);
    detail.querySelector('.dc-open')?.remove();
    ans.innerHTML = '';
    ans.appendChild(detail);
    this.style.display='none';
  };
};

/* 内部绑定辅助 */
function bindAll(){}

/* ---------- 初始化 ---------- */
function init(){
  buildDeck();
  $('#deckCount').textContent = DECK.length;
  state.current = drawCards(1);
  renderTable(); // 开始时背面空桌示意
  $('#table').innerHTML='';
  const hint = el('div','table-hint','点下方按钮，静心默念你的问题，然后抽牌');
  $('#table').appendChild(hint);
}

init();

})();