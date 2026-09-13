/* ---------- The book: page turning (CSS 3D leaves) ---------- */
const bookEl = document.getElementById('flipbook');
const pageEls = [...bookEl.querySelectorAll(':scope > .page')];
const LAST = pageEls.length;                 // 21 = leading endpaper + 20 designed pages
const SPREADS = Math.floor((LAST - 1) / 2);  // 10 designed spreads
const prog = document.getElementById('progress');
const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const isNarrow = () => (window.innerWidth || document.documentElement.clientWidth || 1024) <= 900;
let idx = 0, animating = false, pageNo = 2;

const FLIP_MS = 820;
const faces = pageEls.slice();
if(faces.length % 2) faces.push(null);          // 22 faces -> 11 leaves
const leafBox = document.createElement('div');
leafBox.className = 'leaves';
const leaves = [];
for(let k = 0; k < faces.length / 2; k++){
  const leaf = document.createElement('div'); leaf.className = 'leaf';
  const front = document.createElement('div'); front.className = 'face front';
  const back  = document.createElement('div'); back.className  = 'face back';
  if(faces[2*k])   front.appendChild(faces[2*k]);
  if(faces[2*k+1]) back.appendChild(faces[2*k+1]);
  leaf.appendChild(front); leaf.appendChild(back);
  leafBox.appendChild(leaf); leaves.push(leaf);
}
bookEl.insertBefore(leafBox, bookEl.firstChild);
const MAXS = SPREADS;      /* spread s shows faces[2s-1] | faces[2s] */
let cur = 1;               /* spread 1 = pages 2 & 3 */

const SPREAD_LABELS = ['Cover & welcome','The idea','Roots & philosophy','Our story',
  'What we teach','How it works','Your tutor','Programme & fee','Principles','Questions & contact'];
for(let i=0;i<SPREADS;i++){
  const b=document.createElement('button');
  b.type='button';
  b.title=(i+1)+'. '+(SPREAD_LABELS[i]||'Spread '+(i+1));
  b.setAttribute('aria-label',b.title);
  b.onclick=()=>goto(i);
  prog.appendChild(b);
}

function curPage(){ return isNarrow() ? pageNo : 2 + (cur-1)*2 }
function visiblePages(){
  if(isNarrow()) return [pageEls[pageNo-1]].filter(Boolean);
  return [faces[2*cur-1], faces[2*cur]].filter(Boolean);
}
function activeScrollers(){ return visiblePages().map(p=>p.querySelector('.page-inner')).filter(Boolean) }
function roomIn(el,dir){ return dir>0 ? (el.scrollHeight-el.clientHeight-el.scrollTop) : el.scrollTop }
function canInnerScroll(dir){ for(const el of activeScrollers()){ if(roomIn(el,dir)>2) return el } return null }

/* a page whose text overflows gets a fade + chevron so it never looks cut off */
function updateMore(){
  pageEls.forEach(p=>p.classList.remove('has-more'));
  visiblePages().forEach(p=>{
    const inner=p.querySelector('.page-inner');
    if(inner && (inner.scrollHeight-inner.clientHeight-inner.scrollTop)>8) p.classList.add('has-more');
  });
}

function paint(){
  const p=curPage();
  idx=Math.max(0,Math.min(SPREADS-1,Math.floor((p-2)/2)));
  [...prog.children].forEach((b,k)=>b.classList.toggle('on',k===idx));
  const prev=document.getElementById('prevBtn'), next=document.getElementById('nextBtn');
  prev.disabled = p<=2;
  // in double display turn.js reports the LEFT page of the final spread, so page never reaches LAST
  next.disabled = isNarrow() ? (p>=LAST) : (idx>=SPREADS-1);
  const np=document.getElementById('navpill');
  if(np) [...np.children].forEach(b=>b.classList.toggle('on', +b.dataset.spread===idx));
  updateMore();
}

function showOnly(s){ leaves.forEach((L,k)=>L.classList.toggle('off', k<s-2 || k>s+1)) }
function restack(s){
  leaves.forEach((L,k)=>{
    L.style.zIndex = k<s ? (k+1) : (leaves.length-k);
    L.classList.toggle('inert', k!==s-1 && k!==s);   /* only the open spread is hittable */
  });
}

function setSpread(ns, animate){
  ns = Math.max(1, Math.min(MAXS, ns));
  if(ns === cur || animating) return;
  const from = cur; cur = ns;
  const hero = ns > from ? ns-1 : ns;          /* the one leaf that moves */
  /* settle every other leaf instantly, in a single reflow */
  leaves.forEach((L,k)=>{ if(k!==hero) L.style.transition='none' });
  leaves.forEach((L,k)=>{ if(k!==hero) L.classList.toggle('flipped', k<ns) });
  void bookEl.offsetHeight;
  leaves.forEach((L,k)=>{ if(k!==hero) L.style.transition='' });
  showOnly(ns); restack(ns);
  const L = leaves[hero];
  L.style.zIndex = leaves.length + 10;
  if(animate === false || reduce){
    L.style.transition='none';
    L.classList.toggle('flipped', hero<ns);
    void bookEl.offsetHeight;
    L.style.transition='';
    restack(cur); showOnly(cur); paint();
    return;
  }
  const land = () => {
    L.removeEventListener('transitionend', onEnd);
    clearTimeout(L._t); L.classList.remove('moving');
    animating = false; flipEnd(); restack(cur); showOnly(cur); paint();
  };
  const onEnd = e => { if(e.target===L && e.propertyName==='transform') land(); };
  animating = true; flipStart();
  L.classList.add('moving');
  L.addEventListener('transitionend', onEnd);
  L._t = setTimeout(land, FLIP_MS + 240);
  requestAnimationFrame(()=>L.classList.toggle('flipped', hero<ns));
}

function showPage(n){            /* narrow mode: one page at a time */
  pageNo = Math.max(2, Math.min(LAST, n));
  pageEls.forEach((p,i)=>p.parentElement.classList.toggle('show', i === pageNo-1));
  paint();
}
function goto(i){
  i=Math.max(0,Math.min(SPREADS-1,i));
  if(isNarrow()) showPage(2+i*2); else setSpread(i+1, true);
}
function turn(d){
  if(isNarrow()){ showPage(pageNo+d); return; }
  setSpread(cur+d, true);
}

/* ---------- Sprout the navigator: per-page mood + position ---------- */
const sprout=document.getElementById('sprout');
const sEyes=document.getElementById('s-eyes');
const sMouth=document.getElementById('s-mouth');
const sBrows=document.getElementById('s-brows');
const sBrowL=document.getElementById('s-browL');
const sBrowR=document.getElementById('s-browR');

const MOODS={
  happy:  {mouth:'M107 164c6 8 18 8 24 0', brows:0, eyes:'normal'},
  wave:   {mouth:'M107 164c6 8 18 8 24 0', brows:0, eyes:'normal', wave:true},
  curious:{mouth:'M112 166c4 3 10 3 14 0', brows:1, browL:'M88 122c6-4 13-4 19 2', browR:'M131 129c6-5 14-4 19 2', eyes:'wide'},
  proud:  {mouth:'M106 162c7 10 21 10 28 0', brows:1, browL:'M88 124c6-4 13-4 19 0', browR:'M131 124c6-4 13-4 19 0', eyes:'happyclosed'},
  calm:   {mouth:'M109 165c5 4 13 4 18 0', brows:0, eyes:'normal'},
  think:  {mouth:'M109 166h20', brows:1, browL:'M88 124c6-3 13-3 19 1', browR:'M131 125c6-4 13-4 19 0', eyes:'normal'}
};
const PLAN=[
  {mood:'wave',    side:'r', vy:.62},
  {mood:'calm',    side:'l', vy:.30},
  {mood:'proud',   side:'r', vy:.30},
  {mood:'curious', side:'r', vy:.68},
  {mood:'happy',   side:'l', vy:.72},
  {mood:'think',   side:'r', vy:.30},
  {mood:'proud',   side:'l', vy:.34},
  {mood:'happy',   side:'r', vy:.66},
  {mood:'calm',    side:'l', vy:.66},
  {mood:'wave',    side:'r', vy:.60}
];

function setEyes(kind){
  if(kind==='happyclosed'){
    sEyes.innerHTML='<path d="M89 144c3-5 12-5 15 0" stroke="#2a2a26" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M133 144c3-5 12-5 15 0" stroke="#2a2a26" stroke-width="4" fill="none" stroke-linecap="round"/>';
  }else{
    const ry = kind==='wide' ? 13.5 : 11.5;
    const rx = kind==='wide' ? 9.5 : 8.5;
    sEyes.innerHTML=
      '<ellipse cx="98" cy="142" rx="'+rx+'" ry="'+ry+'" fill="#2a2a26"/>'+
      '<ellipse cx="140" cy="142" rx="'+rx+'" ry="'+ry+'" fill="#2a2a26"/>'+
      '<circle cx="101" cy="138" r="2.8" fill="#fff"/>'+
      '<circle cx="143" cy="138" r="2.8" fill="#fff"/>';
  }
}
function setMood(name){
  const m=MOODS[name]||MOODS.happy;
  sMouth.setAttribute('d',m.mouth);
  sBrows.style.opacity=m.brows?1:0;
  if(m.brows){ if(m.browL)sBrowL.setAttribute('d',m.browL); if(m.browR)sBrowR.setAttribute('d',m.browR); }
  setEyes(m.eyes);
  if(window.Sprout3D) window.Sprout3D.mood(name);
  if(m.wave) waveOnce();
}
function waveOnce(){
  if(window.Sprout3D){ window.Sprout3D.wave(); return; }
  if(reduce) return;
  sprout.classList.remove('waving'); void sprout.offsetWidth; sprout.classList.add('waving');
}

/* Sprout keeps ONE spot in the left margin for the whole book. It is placed on
   load and on resize only — never on a page turn — so the flip and the mascot
   never compete for the same frame. Its liveliness (blinks, expressions, the
   occasional wave) is driven entirely by its own clock. */
const BOXW = 132;                 /* the canvas never changes size; CSS scales it */
function moveSprout(){
  const vp=viewport(), vw=vp.vw, vh=vp.vh;
  const r=bookEl.getBoundingClientRect();
  if(r.width < 200){ sprout.style.opacity=0; return; }   /* book not sized yet */
  const PAD=13, MINW=54, MAXW = vw<1100 ? 104 : 132;
  const gutL=r.left, gutR=vw-r.right;
  const side = gutL >= gutR ? 'l' : 'r';          /* whichever margin is roomier */
  const own = side==='l' ? gutL : gutR;
  const w = Math.min(MAXW, own-PAD*2);
  if(w < MINW){ sprout.style.opacity=0; return; } /* no margin (phones): step away */
  const hh = w*1.25;   /* rendered box is BOXW wide; w is reached by CSS scale */
  const cx = side==='l' ? (r.left - PAD - w) : (r.right + PAD);
  let cy = r.top + r.height*0.66 - hh*0.5;
  cy = Math.max(86, Math.min(vh - hh - 10, cy));
  sprout.style.setProperty('--x', Math.round(cx)+'px');
  sprout.style.setProperty('--y', Math.round(cy)+'px');
  sprout.style.setProperty('--s', (w/BOXW).toFixed(3));
  sprout.style.setProperty('--face', side==='l' ? '1' : '-1');
  sprout.style.opacity = 1;
  if(window.Sprout3D) window.Sprout3D.face(side);
}

/* Viewport width can read 0 in an embedded pane that has not been measured
   yet, so anything that depends on a real width waits for one. */
function measuredWidth(){ return window.innerWidth || document.documentElement.clientWidth || 0; }
function viewport(){
  const vw = measuredWidth() || 1024;
  const vh = window.innerHeight || document.documentElement.clientHeight || 768;
  return {vw, vh};
}
let fitWidth = 0, bookInited = false;
/* Some viewers throttle requestAnimationFrame to a standstill, so anything the
   book needs in order to exist is scheduled on rAF AND a timer — first one wins. */
function soon(fn, ms){
  let ran = false;
  const run = () => { if(ran) return; ran = true; fn(); };
  if(window.requestAnimationFrame) requestAnimationFrame(run);
  setTimeout(run, ms || 32);
}

/* While a leaf is in the air the page texture (a mix-blend-mode layer) and the
   topbar blur would have to be re-rasterised every frame — dropping them for
   the duration is what keeps the turn fluid. */
let flipTimer=0;
function flipStart(){
  document.documentElement.classList.add('flipping');
  clearTimeout(flipTimer);
  flipTimer=setTimeout(flipEnd, FLIP_MS + 400);
}
function flipEnd(){
  clearTimeout(flipTimer);
  document.documentElement.classList.remove('flipping');
}

function applyMode(){
  const narrow = isNarrow();
  bookEl.classList.toggle('single', narrow);
  if(narrow){
    leaves.forEach(L=>{ L.classList.remove('off','moving','flipped','inert'); L.style.zIndex=''; });
    showPage(pageNo);
  }else{
    pageEls.forEach(p=>p.parentElement.classList.remove('show'));
    cur = Math.max(1, Math.min(MAXS, Math.round(pageNo/2)));
    leaves.forEach((L,k)=>{ L.style.transition='none'; L.classList.toggle('flipped', k<cur); });
    void bookEl.offsetHeight;
    leaves.forEach(L=>{ L.style.transition=''; });
    restack(cur); showOnly(cur);
  }
  paint();
}

function initBook(){
  if(bookInited) return;
  if(!measuredWidth()){ soon(initBook, 50); return; }   /* wait for a real width */
  fitWidth = measuredWidth();
  bookInited = true;
  applyMode();
  pageEls.forEach(p=>{
    p.appendChild(Object.assign(document.createElement('div'),{className:'more-fade'}));
    const inner=p.querySelector('.page-inner');
    if(inner) inner.addEventListener('scroll',updateMore,{passive:true});
  });
  paint();
  soon(moveSprout);                    /* place Sprout from the sized book */
}

function resizeBook(){
  if(!bookInited){ initBook(); return; }
  fitWidth = measuredWidth();
  if(bookEl.classList.contains('single') !== isNarrow()) applyMode();
  /* Sprout's one constant spot is derived from the book's real rect */
  soon(moveSprout);
  updateMore();
}
window.addEventListener('resize',resizeBook);

/* A fit is only trustworthy if it was computed from a real, non-zero viewport
   width. Watch both the wrap and the document element, and re-fit whenever the
   measured width differs from the one the current fit used — that also repairs
   a first fit made against the fallback width. */
function refitIfStale(){
  const w = measuredWidth();
  if(w && Math.abs(w - fitWidth) > 1) resizeBook();
}
if(window.ResizeObserver){
  const ro = new ResizeObserver(refitIfStale);
  ro.observe(bookEl.parentElement || bookEl);
  ro.observe(document.documentElement);
}
/* last resort for viewers that report no width at all until after first paint */
(function awaitWidth(tries){
  if(measuredWidth()){ refitIfStale(); return; }
  if(tries > 0) soon(()=>awaitWidth(tries-1), 50);
})(120);

document.addEventListener('keydown',e=>{
  const portalOpen=document.getElementById('portal').classList.contains('open');
  const modalOpen=document.getElementById('modal').classList.contains('open');
  if(e.key==='Escape'){ if(modalOpen)closeModal(); else if(portalOpen)closePortal(); return; }
  if(portalOpen||modalOpen) return;
  if(/^(input|textarea|select)$/i.test(e.target.tagName)) return;
  if(e.key==='ArrowRight'||e.key==='PageDown')turn(1);
  if(e.key==='ArrowLeft'||e.key==='PageUp')turn(-1);
});

/* ---------- Wheel: read the page first, turn it only at the end ---------- */
let wheelLock=false, wheelAccum=0, wheelTimer=null;
const THRESHOLD=60;
function onWheel(e){
  if(!bookInited) return;
  if(document.getElementById('portal').classList.contains('open')) return;
  if(document.getElementById('modal').classList.contains('open')) return;
  const dir=e.deltaY>0?1:-1;
  let scroller = e.target.closest ? e.target.closest('.page-inner') : null;
  if(scroller && roomIn(scroller,dir)<=2) scroller=null;
  if(!scroller) scroller=canInnerScroll(dir);
  if(scroller){
    scroller.scrollTop += e.deltaY;
    e.preventDefault();
    updateMore();
    wheelAccum=0;
    return;
  }
  e.preventDefault();
  if(wheelLock||animating){ wheelAccum=0; return; }
  wheelAccum+=e.deltaY;
  clearTimeout(wheelTimer);
  wheelTimer=setTimeout(()=>{wheelAccum=0;},200);
  if(Math.abs(wheelAccum)>=THRESHOLD){
    turn(wheelAccum>0?1:-1);
    wheelAccum=0; wheelLock=true;
    setTimeout(()=>{wheelLock=false;},FLIP_MS+180);
  }
}
window.addEventListener('wheel',onWheel,{passive:false});


if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initBook);
else initBook();
window.addEventListener('load',()=>setTimeout(()=>{resizeBook();},80));

/* ---------- Portal ---------- */
function openPortal(){document.getElementById('portal').classList.add('open');document.body.style.overflow='hidden'}
function closePortal(){document.getElementById('portal').classList.remove('open');document.body.style.overflow='';logout()}
function doLogin(){document.getElementById('loginCard').style.display='none';document.getElementById('dash').classList.add('on')}
function logout(){document.getElementById('loginCard').style.display='block';document.getElementById('dash').classList.remove('on')}

/* ---------- Assessment modal ---------- */
const WHATSAPP_NUMBER="91XXXXXXXXXX";   /* <-- put the real number here */
const WA_READY=!WHATSAPP_NUMBER.includes('X');
document.getElementById('year').textContent=new Date().getFullYear();
function openModal(){document.getElementById('modal').classList.add('open')}
function closeModal(){document.getElementById('modal').classList.remove('open');setTimeout(()=>{document.getElementById('formArea').style.display='block';document.getElementById('success').style.display='none';},200)}
function waLink(d){const t=`Hello Home Learning,%0A%0AI'd like to enquire about English tuition.%0A%0AParent: ${d.parent}%0AStudent: ${d.student}%0AClass: ${d.class}%0ABoard: ${d.board}%0APhone: ${d.phone}%0ANeeds: ${d.message||'Not specified'}%0A%0APlease share the free assessment details.`;return `https://wa.me/${WHATSAPP_NUMBER}?text=${t}`}
document.getElementById('leadForm').addEventListener('submit',function(e){
  e.preventDefault();
  const d=Object.fromEntries(new FormData(this).entries());
  showSuccess(d);
  document.getElementById('formArea').style.display='none';
  document.getElementById('success').style.display='block';
});
const wa=document.getElementById('waFloat');
if(!WHATSAPP_NUMBER.includes('X')){wa.href=`https://wa.me/${WHATSAPP_NUMBER}?text=Hello%20Home%20Learning,%20I'd%20like%20to%20know%20more.`}else{
  wa.removeAttribute('href');
  wa.style.cursor='pointer';
  wa.title='Send an enquiry';
  wa.setAttribute('aria-label','Send an enquiry');
  wa.addEventListener('click',ev=>{ev.preventDefault();openModal();});
}
function payNote(btn){
  const n=document.getElementById('payNote');
  if(n)n.style.display='block';
  btn.disabled=true; btn.style.opacity=.55; btn.style.cursor='default';
}
/* the enquiry can always be completed, number or no number */
function plainMsg(d){
  return 'Hello Home Learning,\n\nI would like to enquire about English tuition.\n\n'
    + 'Parent: '+d.parent+'\nStudent: '+d.student+'\nClass: '+d.class
    + '\nBoard: '+d.board+'\nPhone: '+d.phone
    + '\nNeeds: '+(d.message||'Not specified')
    + '\n\nPlease share the free assessment details.';
}
function showSuccess(d){
  const send=document.getElementById('sendWhatsapp');
  const pend=document.getElementById('waPending');
  const note=document.getElementById('successNote');
  if(WA_READY){
    send.href=waLink(d); send.style.display=''; pend.style.display='none';
    note.textContent='Your WhatsApp message is ready. Tap below to send it to the tutor.';
  }else{
    send.style.display='none'; pend.style.display='block';
    document.getElementById('waMsg').value=plainMsg(d);
    note.textContent="Your enquiry is ready. The tutor's WhatsApp number is being added \u2014 copy it below and send it as soon as the number is live.";
  }
}
function copyMsg(){
  const t=document.getElementById('waMsg'), btn=document.getElementById('copyMsg');
  const done=function(){btn.textContent='Copied';setTimeout(function(){btn.textContent='Copy enquiry'},1800)};
  t.select();
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t.value).then(done,done)}
  else{try{document.execCommand('copy')}catch(err){}done()}
}
