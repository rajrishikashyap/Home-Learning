/* ---------- The book: page turning (turn.js 4.1.0) ----------
 *
 * turn.js owns #flipbook and its 19 .page children. It wraps each page in a
 * .page-wrapper, keeps a few pages in the DOM at a time, and drives the fold
 * itself. Everything below is the glue: sizing, the scroll gesture, and keeping
 * the dots / nav pill / mascot / overflow hint in step with turn.js's events.
 *
 * The 4th release drives its own frames off requestAnimationFrame (see
 * `window.requestAnim` / `animatef` in vendor/turn.js), which is why the hand
 * written rAF patch the 3rd release needed is gone.
 *
 * Every page is `hard`. turn.js has two turn effects: `sheet` bends the leaf
 * like paper, and `hard` swings it rigid. Only one of them is cheap. The sheet
 * fold drives four surfaces per frame and rebuilds two gradient backgrounds and
 * a blurred box-shadow on every one of them; `hard` writes a transform and an
 * alpha. That is the whole reason the cover turned smoothly while the rest of
 * the book stuttered, and marking the pages hard is what closed the gap.
 *
 * turn.js starts a drag-turn only within `cornerSize` of a corner (see
 * _cornerActivated), so the middle of a page stays free for the scrolling
 * .page-inner panes. On touch we shrink that zone further — at phone widths a
 * 100px corner would swallow most of a swipe. A hard page ignores the vertical
 * half of that and takes the whole left or right edge, as a board does.
 */
const $book   = jQuery('#flipbook');
const bookEl  = document.getElementById('flipbook');
const pageEls = [...bookEl.querySelectorAll(':scope > .page')];
const LAST    = pageEls.length;                 // 19 designed pages
/* The book opens on its cover, which stands alone on the right the way a real
   one does, and everything after it is a spread:
     view 0  = page 1            (cover)
     view i  = pages 2i, 2i+1    (the nine designed spreads)
   There is no longer a blank leading endpaper. It used to exist only to push
   the cover onto an EVEN page so turn.js would pair it leftward; folding the
   old welcome page into the cover removed the need for it without re-pairing
   anything — the plate still faces its philosophy text, the portrait its bio. */
const SPREADS = 1 + Math.ceil((LAST - 1) / 2);  // 10 views
const prog    = document.getElementById('progress');
const reduce  = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const isNarrow = () => (window.innerWidth || document.documentElement.clientWidth || 1024) <= 900;

const FLIP_MS    = reduce ? 280 : 650;
const CORNER_PX  = jQuery.isTouch ? 28 : 56;
const SPREAD_LABELS = ['Cover','The idea','Roots & philosophy','Our story',
  'What we teach','How it works','Your tutor','Programme & fee','Principles','Questions & contact'];

let bookInited = false, fitWidth = 0;

/* Page 1 is the cover, and it is the floor for every navigation path — the
   wheel and the keyboard included, which used to bypass the disabled prev
   button and land on view [0,1], a half-empty spread with nothing in it. */
const FIRST = 1;                                /* the cover */
const spreadToPage = i => { i = Math.max(0, Math.min(SPREADS - 1, i)); return i === 0 ? 1 : i * 2; };
const pageToSpread = p => p <= 1 ? 0 : Math.min(SPREADS - 1, Math.floor(p / 2));

function measuredWidth(){ return window.innerWidth || document.documentElement.clientWidth || 0; }
function viewport(){
  return { vw: measuredWidth() || 1024,
           vh: window.innerHeight || document.documentElement.clientHeight || 768 };
}

/* turn.js needs pixel dimensions, so the CSS clamps are mirrored here */
function bookSize(){
  const { vw, vh } = viewport();
  return isNarrow()
    ? { w: Math.min(560, vw - 24),  h: Math.min(Math.round(vh * 0.78), 660) }
    : { w: Math.min(1120, vw - 240), h: Math.min(Math.round(vh * 0.80), 780) };
}

function curPage(){ return bookInited ? $book.turn('page') : 2; }
function animating(){ return bookInited && $book.turn('animating'); }

/* the pages on screen right now, as DOM nodes */
function visiblePages(){
  if(!bookInited) return [];
  return $book.turn('view').filter(Boolean).map(n => pageEls[n - 1]).filter(Boolean);
}
function activeScrollers(){ return visiblePages().map(p => p.querySelector('.page-inner')).filter(Boolean); }
function roomIn(el, dir){ return dir > 0 ? (el.scrollHeight - el.clientHeight - el.scrollTop) : el.scrollTop; }
function canInnerScroll(dir){ for(const el of activeScrollers()){ if(roomIn(el, dir) > 2) return el; } return null; }

/* a page whose text overflows gets a fade + chevron so it never looks cut off */
function updateMore(){
  pageEls.forEach(p => p.classList.remove('has-more'));
  visiblePages().forEach(p => {
    const inner = p.querySelector('.page-inner');
    if(inner && (inner.scrollHeight - inner.clientHeight - inner.scrollTop) > 8) p.classList.add('has-more');
  });
}

/* turn.js rebuilds a page's flip when it re-enters the range, which resets the
   corner size, so this is reapplied on every turn rather than once at init */
/* Entry orchestration. When a spread arrives, its blocks rise in 50ms apart.
   Only opacity and transform are animated — nothing here touches height or
   margin, so a stagger can never shift layout mid-turn. The index is written
   as a custom property; the easing itself lives in CSS. */
function staggerIn(){
  visiblePages().forEach(pg => {
    const inner = pg.querySelector('.page-inner');
    if(!inner) return;
    inner.classList.remove('stagger');
    [...inner.children].forEach((el, i) => el.style.setProperty('--i', i));
    void inner.offsetWidth;          /* restart the animation on re-entry */
    inner.classList.add('stagger');
  });
}

function applyCornerSize(){
  const data = $book.data();
  if(!data || !data.pages) return;
  for(const p in data.pages){
    if(Object.prototype.hasOwnProperty.call(data.pages, p)){
      try { data.pages[p].flip('options', { cornerSize: CORNER_PX }); } catch(err){ /* page not ready */ }
    }
  }
}

/* turn.js keeps ~6 pages in the DOM but only two are on screen; without this a
   screen reader reads straight through the ones behind the current spread. */
function syncPageA11y(){
  if(!bookInited) return;
  const shown = new Set($book.turn('view').filter(Boolean));
  pageEls.forEach((el, i) => {
    const on = shown.has(i + 1);
    el.setAttribute('aria-hidden', on ? 'false' : 'true');
    el.querySelectorAll('a[href],button,input,select,textarea,details,summary')
      .forEach(f => { if(on) f.removeAttribute('tabindex'); else f.setAttribute('tabindex','-1'); });
  });
}

function paint(){
  if(!bookInited) return;
  const page = curPage();
  const idx  = pageToSpread(page);
  bookEl.classList.toggle('at-cover', page <= 1 && !isNarrow());
  [...prog.children].forEach((b, k) => b.classList.toggle('on', k === idx));
  const prev = document.getElementById('prevBtn'), next = document.getElementById('nextBtn');
  if(prev) prev.disabled = page <= 2;
  if(next) next.disabled = isNarrow() ? (page >= LAST) : (idx >= SPREADS - 1);
  const np = document.getElementById('navpill');
  if(np) [...np.children].forEach(b => b.classList.toggle('on', +b.dataset.spread === idx));
  updateMore();
}

/* ---------- public navigation (inline handlers in index.html use these) ---------- */
function goto(i){
  if(!bookInited) return;
  $book.turn('page', Math.max(FIRST, spreadToPage(i)));
}
function turn(d){
  if(!bookInited || animating()) return;
  if(d < 0 && curPage() <= FIRST) return;
  if(d > 0 && !isNarrow() && pageToSpread(curPage()) >= SPREADS - 1) return;
  d > 0 ? $book.turn('next') : $book.turn('previous');
}
function showPage(n){
  if(!bookInited) return;
  $book.turn('page', Math.max(FIRST, Math.min(LAST, n)));
}

/* ---------- build ---------- */
function buildProgress(){
  for(let i = 0; i < SPREADS; i++){
    const b = document.createElement('button');
    b.type  = 'button';
    b.title = (i + 1) + '. ' + (SPREAD_LABELS[i] || 'Spread ' + (i + 1));
    b.setAttribute('aria-label', b.title);
    b.onclick = () => goto(i);
    prog.appendChild(b);
  }
}

function initBook(){
  if(bookInited) return;
  if(!measuredWidth()){ setTimeout(initBook, 50); return; }   /* wait for a real width */

  const size = bookSize();
  fitWidth = measuredWidth();

  buildProgress();

  $book.turn({
    width:        size.w,
    height:       size.h,
    display:      isNarrow() ? 'single' : 'double',
    page:         FIRST,                  /* open on the cover */
    duration:     FLIP_MS,
    acceleration: true,
    elevation:    50,                     /* the lift before the page swings */
    gradients:    !jQuery.isTouch,        /* the fold shading costs too much on touch */
    /* Only meaningful for sheet pages, which this book no longer has — every
       page is hard, and turn.js gives a hard page the whole 'l'/'r' outer edge
       regardless. Kept explicit so that turning a page back into a sheet does
       not silently re-enable the top corners, where the running head sits. */
    turnCorners:  'bl,br',
    /* Left at false on purpose. turn.js would shift the whole book a quarter
       width left so the lone cover sat centred; here the half beside the cover
       is drawn as the front board (.book.at-cover in site.css), so the book
       should stay put and the board should stay where the board is. */
    autoCenter:   false,
    when: {
      turning: function(e, page){
        document.documentElement.classList.add('flipping');
        /* The front board has to be under the cover before the cover starts
           moving, not after it lands — otherwise flipping back to the cover
           swings it onto a bare half and the board pops in at the end. */
        bookEl.classList.toggle('at-cover', page <= 1 && !isNarrow());
      },
      turned: function(e, page){
        document.documentElement.classList.remove('flipping');
        applyCornerSize();
        syncPageA11y();
        guideTo(pageToSpread(page));
        bumpIdleLife();
        staggerIn();
        paint();
      }
    }
  });

  bookEl.classList.toggle('single', isNarrow());
  bookInited = true;

  pageEls.forEach(p => {
    p.appendChild(Object.assign(document.createElement('div'), { className: 'more-fade' }));
    const inner = p.querySelector('.page-inner');
    if(inner) inner.addEventListener('scroll', updateMore, { passive: true });
  });

  applyCornerSize();
  syncPageA11y();
  guideTo(pageToSpread(curPage()));
  paint();
  moveSprout();

  /* Until turn.js has wrapped and positioned the pages there is a moment where
     the book is just an empty shell — that was the blank spread you saw before
     the cover appeared. The pages now carry their own paper colour (see
     site.css) and the book fades up only once it is actually built. */
  requestAnimationFrame(() => { bookEl.classList.add('ready'); staggerIn(); });
  startIdleLife();                     /* blinks, mood drift and the odd wave */
  /* the greeting is guideTo's, fired once the book has settled */
}

function resizeBook(){
  if(!bookInited){ initBook(); return; }
  fitWidth = measuredWidth();
  const want = isNarrow() ? 'single' : 'double';
  if($book.turn('display') !== want){
    $book.turn('display', want);
    bookEl.classList.toggle('single', want === 'single');
  }
  const size = bookSize();
  $book.turn('size', size.w, size.h);
  moveSprout();
  paint();
}
window.addEventListener('resize', resizeBook);

/* A fit is only trustworthy if it came from a real, non-zero viewport width. */
function refitIfStale(){
  const w = measuredWidth();
  if(w && Math.abs(w - fitWidth) > 1) resizeBook();
}
if(window.ResizeObserver){
  const ro = new ResizeObserver(refitIfStale);
  ro.observe(bookEl.parentElement || bookEl);
  ro.observe(document.documentElement);
}

document.addEventListener('keydown', e => {
  const portalOpen = document.getElementById('portal').classList.contains('open');
  const modalOpen  = document.getElementById('modal').classList.contains('open');
  if(e.key === 'Escape'){ if(modalOpen) closeModal(); else if(portalOpen) closePortal(); return; }
  if(portalOpen || modalOpen) return;
  if(/^(input|textarea|select)$/i.test(e.target.tagName)) return;
  if(e.key === 'ArrowRight' || e.key === 'PageDown') turn(1);
  if(e.key === 'ArrowLeft'  || e.key === 'PageUp')   turn(-1);
});

/* ---------- Wheel: read the page first, turn it only at the end ----------
 * The pen drives turn.js from the keyboard and from dragging a corner; the
 * scroll gesture is ours. A wheel event scrolls whichever visible page still
 * has text left in the direction you are going, and only once both pages have
 * bottomed out does the accumulated delta turn the leaf. */
let wheelLock = false, wheelAccum = 0, wheelTimer = null;
const THRESHOLD = 60;
function onWheel(e){
  if(!bookInited) return;
  if(document.getElementById('portal').classList.contains('open')) return;
  if(document.getElementById('modal').classList.contains('open')) return;

  const dir = e.deltaY > 0 ? 1 : -1;
  let scroller = e.target.closest ? e.target.closest('.page-inner') : null;
  if(scroller && roomIn(scroller, dir) <= 2) scroller = null;
  if(!scroller) scroller = canInnerScroll(dir);

  if(scroller){
    scroller.scrollTop += e.deltaY;
    e.preventDefault();
    updateMore();
    wheelAccum = 0;
    return;
  }

  e.preventDefault();
  if(wheelLock || animating()){ wheelAccum = 0; return; }
  wheelAccum += e.deltaY;
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => { wheelAccum = 0; }, 200);

  if(Math.abs(wheelAccum) >= THRESHOLD){
    turn(wheelAccum > 0 ? 1 : -1);
    wheelAccum = 0;
    wheelLock  = true;
    setTimeout(() => { wheelLock = false; }, FLIP_MS + 180);
  }
}
window.addEventListener('wheel', onWheel, { passive: false });

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBook);
else initBook();
window.addEventListener('load', () => setTimeout(resizeBook, 80));


/* ---------- Sprout the navigator: per-page mood + position ---------- */
const sprout=document.getElementById('sprout');
const sEyes=document.getElementById('s-eyes');
const sMouth=document.getElementById('s-mouth');
const sBrows=document.getElementById('s-brows');
const sBrowL=document.getElementById('s-browL');
const sBrowR=document.getElementById('s-browR');

/* ---------- Sprout, the guide ----------
 * Sprout's job is to get the reader through the book: greet them, say what the
 * spread in front of them is, point down when there is more text below the
 * fold, and nudge toward the next page when they have gone quiet. Clicking
 * Sprout turns the page.
 *
 * A pose is the body (arms, head tilt); a face is the mouth/eyes/brows. They are
 * set together but stored apart, so "pointing while curious" is expressible.
 */
/* Expressions. The mouth is a path swap and the eyes are a small subtree swap;
   neither travels, which is why they are kept under reduced motion. Coordinates
   are the head's, so they must move with it if the drawing ever changes. */
const FACES={
  happy:  {mouth:'M105 160c9 13 21 13 30 0', brows:0, eyes:'normal'},
  smile:  {mouth:'M108 159c7 9 17 9 24 0',   brows:0, eyes:'arc'},
  curious:{mouth:'M113 158a7.5 7.5 0 1 0 15 0a7.5 7.5 0 1 0 -15 0', brows:1,
           browL:'M84 108c8-7 19-6 26 2', browR:'M131 111c8-8 19-7 26 1', eyes:'wide'},
  cheer:  {mouth:'M101 156c11 17 27 17 38 0', brows:1,
           browL:'M85 106c8-6 19-5 26 1', browR:'M130 107c8-6 19-5 26 1', eyes:'arc'},
  wink:   {mouth:'M106 159c9 12 20 12 28 0', brows:0, eyes:'wink'},
  oh:     {mouth:'M114 156a6.5 8.5 0 1 0 13 0a6.5 8.5 0 1 0 -13 0', brows:1,
           browL:'M84 105c8-6 19-5 26 2', browR:'M131 106c8-6 19-5 26 1', eyes:'wide'}
};

/* One line and one pose per spread. Kept short — a speech bubble is a caption,
   not a paragraph, and everything it says is already on the page beside it. */
const GUIDE=[
  {pose:'wave',    face:'happy',   say:"Hi! I'm Sprout. I'll show you around."},
  {pose:'curious', face:'curious', say:"This is why we started."},
  {pose:'smile',   face:'smile',   say:"Old wisdom, new tools."},
  {pose:'read',    face:'smile',   say:"The quiet one in the room? That was me too."},
  {pose:'point',   face:'happy',   say:"Everything English, in one place."},
  {pose:'think',   face:'oh',      say:"Four simple steps to begin."},
  {pose:'happy',   face:'wink',    say:"Meet your tutor."},
  {pose:'point',   face:'happy',   say:"One programme, one fee. No surprises."},
  {pose:'read',    face:'smile',   say:"The house rules, in plain words."},
  {pose:'cheer',   face:'cheer',   say:"That's the whole book. Shall we begin?"}
];

const sproutSay = document.getElementById('sproutSay');
const sproutHit = document.getElementById('sproutHit');
const sayText   = sproutSay ? sproutSay.querySelector('span') : null;

let idleTimer=null, waveTimer=null, sayTimer=null, nudgeTimer=null, waveBackTimer=null;

function setPose(pose){ sprout.setAttribute('data-pose', pose); }

function say(text, holdMs){
  if(!sproutSay || !sayText) return;
  clearTimeout(sayTimer);
  sayText.textContent = text;
  sproutSay.classList.add('on');
  if(holdMs) sayTimer = setTimeout(()=>sproutSay.classList.remove('on'), holdMs);
}
function hush(){ if(sproutSay){ clearTimeout(sayTimer); sproutSay.classList.remove('on'); } }

/* Arriving on a spread: greet, take the spread's pose, and say what it is. */
function guideTo(spread){
  const g = GUIDE[spread] || GUIDE[0];
  setMood(g.face);
  setPose(g.pose);
  if(g.pose === 'wave' || g.pose === 'cheer') waveOnce();
  say(g.say, 5200);
  armNudge();
}

/* If the page has more text below the fold, Sprout looks down and says so
   before it suggests moving on — otherwise it would hurry the reader past
   half a page. */
function pageHasMore(){
  return visiblePages().some(pg => pg.classList.contains('has-more'));
}

/* Gone quiet: point at the next page and pulse. Re-armed by every turn. */
function armNudge(){
  clearTimeout(nudgeTimer);
  if(reduce) return;
  nudgeTimer = setTimeout(()=>{
    if(document.hidden || animating()) { armNudge(); return; }
    const last = pageToSpread(curPage()) >= SPREADS - 1;
    if(last){ setPose('cheer'); setMood('cheer'); say("Ready when you are.", 5200); return; }
    if(pageHasMore()){
      setPose('read'); setMood('smile');
      say("There's a little more below.", 4600);
    } else {
      setPose('point'); setMood('happy');
      say("Turn the page when you're ready.", 4600);
      sprout.classList.remove('nudging'); void sprout.offsetWidth; sprout.classList.add('nudging');
      setTimeout(()=>sprout.classList.remove('nudging'), 2600);
    }
    armNudge();
  }, 9000);
}

function startIdleLife(){
  clearInterval(idleTimer); clearInterval(waveTimer);
  /* Expressions are not motion — swapping a path changes shape with no travel,
     so they run under reduced motion too. Only the idle WAVE slows down there. */
  idleTimer=setInterval(()=>{
    if(document.hidden || animating()) return;
    const g = GUIDE[pageToSpread(curPage())] || GUIDE[0];
    /* drift between the spread's own face and a soft smile, so Sprout keeps
       breathing without wandering off the expression the page asked for */
    setMood(Math.random() < 0.5 ? g.face : 'smile', true);
  }, reduce ? 7000 : 5200);
  waveTimer=setInterval(()=>{ if(!document.hidden && !animating()) waveOnce(); }, reduce ? 26000 : 15000);
}
function bumpIdleLife(){ startIdleLife(); armNudge(); }

/* clicking Sprout is a real way to move on */
if(sproutHit){
  sproutHit.addEventListener('click', ()=>{
    if(pageToSpread(curPage()) >= SPREADS - 1){ openModal(); return; }
    turn(1);
  });
  sproutHit.addEventListener('mouseenter', ()=>{
    const last = pageToSpread(curPage()) >= SPREADS - 1;
    setPose(last ? 'cheer' : 'point');
    say(last ? "Book a free assessment?" : "Click me to turn the page.", 3200);
  });
}

/* Each eye carries a big catchlight and a small one low on the far side. That
   second dot is most of what separates a drawn eye from a printed dot. */
const ARC  = '<path d="M87 139c4.5-7 15.5-7 20 0" stroke="#2f2a26" stroke-width="4.4" fill="none" stroke-linecap="round"/>'
           + '<path d="M133 139c4.5-7 15.5-7 20 0" stroke="#2f2a26" stroke-width="4.4" fill="none" stroke-linecap="round"/>';
function openEye(cx, rx, ry, hl){
  return '<ellipse cx="'+cx+'" cy="'+(rx>11?135:136)+'" rx="'+rx+'" ry="'+ry+'" fill="#2f2a26"/>'
       + '<circle cx="'+(cx+4.5)+'" cy="'+(rx>11?128.5:130)+'" r="'+hl+'" fill="#fff"/>'
       + '<circle cx="'+(cx-4)+'" cy="141.5" r="'+(hl*0.52)+'" fill="#fff" opacity=".65"/>';
}
function setEyes(kind){
  if(kind==='arc'){ sEyes.innerHTML = ARC; return; }
  if(kind==='wink'){
    sEyes.innerHTML = openEye(97, 11, 13.5, 3.9)
      + '<path d="M133 139c4.5-7 15.5-7 20 0" stroke="#2f2a26" stroke-width="4.4" fill="none" stroke-linecap="round"/>';
    return;
  }
  const wide = kind === 'wide';
  const rx = wide ? 12.5 : 11, ry = wide ? 15.5 : 13.5, hl = wide ? 4.4 : 3.9;
  sEyes.innerHTML = openEye(97, rx, ry, hl) + openEye(143, rx, ry, hl);
}
function setMood(name){
  const m=FACES[name]||FACES.happy;
  sMouth.setAttribute('d',m.mouth);
  sBrows.style.opacity=m.brows?1:0;
  if(m.brows){ if(m.browL)sBrowL.setAttribute('d',m.browL); if(m.browR)sBrowR.setAttribute('d',m.browR); }
  setEyes(m.eyes);
  /* the curious face tilts the head; the rig does the rest */
  sprout.style.setProperty('--tilt', name==='curious' ? '-7deg' : '0deg');
  if(window.Sprout3D) window.Sprout3D.mood(name);
}

/* Kept under reduced motion: CSS swaps in a gentler, slower swing (waveGentle)
   rather than removing the greeting entirely. A hand waving hello is brief and
   local — it is not the kind of large sweeping travel the setting is about.

   The keyframes start and end at the wave pose's own angles, so the arm has to
   BE in that pose or it snaps there on the first frame and snaps back on the
   last. The idle wave can fire on any spread, so the pose is taken for the
   duration and handed back when the animation ends — the arm springs home on the
   ordinary transition rather than cutting. */
function waveOnce(){
  if(window.Sprout3D){ window.Sprout3D.wave(); return; }
  /* Poses that already hold the right arm up wave from where they are — cheer
     has its own keyframes, and borrowing would drop it to a one-arm greeting. */
  const cur  = sprout.getAttribute('data-pose');
  const keep = cur === 'wave' || cur === 'cheer';
  const back = keep ? null : cur;
  if(!keep) setPose('wave');
  sprout.classList.remove('waving'); void sprout.offsetWidth; sprout.classList.add('waving');
  clearTimeout(waveBackTimer);
  waveBackTimer = setTimeout(() => {
    sprout.classList.remove('waving');
    if(sprout.getAttribute('data-pose') === 'wave' && back && back !== 'wave') setPose(back);
  }, reduce ? 1800 : 1600);
}

/* Sprout keeps ONE spot in the left margin for the whole book. It is placed on
   load and on resize only — never on a page turn — so the flip and the mascot
   never compete for the same frame. Its liveliness (blinks, expressions, the
   occasional wave) is driven entirely by its own clock. */
const BOXW = 132;                 /* the canvas never changes size; CSS scales it */
function moveSprout(){
  const vp=viewport(), vw=vp.vw, vh=vp.vh;
  const r=bookEl.getBoundingClientRect();
  if(r.width < 200){                                     /* book not sized yet */
    sprout.style.opacity=0; hush();
    if(sproutHit) sproutHit.hidden = true;
    return;
  }
  const PAD=10, MINW=54, MAXW = vw<1100 ? 112 : 150;
  const gutL=r.left, gutR=vw-r.right;
  const side = gutL >= gutR ? 'l' : 'r';          /* whichever margin is roomier */
  const own = side==='l' ? gutL : gutR;
  const w = Math.min(MAXW, own-PAD*2);
  if(w < MINW){                                   /* no margin (phones): step away */
    sprout.style.opacity=0; hush();
    if(sproutHit) sproutHit.hidden = true;
    return;
  }
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

  /* The bubble and the click target ride alongside rather than inside, because
     anything inside inherits the mascot's scale — at the small end that would
     shrink the text to nothing. Both are placed from the same numbers. */
  const bw = 176, bh = 78;
  if(sproutSay){
    let bx = Math.round(cx + w/2 - bw/2);
    bx = Math.max(10, Math.min(vw - bw - 10, bx));       /* never off-screen */
    /* below Sprout: the turn arrows live at the book's vertical middle, which is
       exactly where a bubble placed above would land in a margin this narrow */
    let by = Math.round(cy + hh + 12);
    if(by + bh > vh - 12) by = Math.round(cy - bh - 12);  /* flip up if it would clip */
    sproutSay.style.setProperty('--bx', bx + 'px');
    sproutSay.style.setProperty('--by', Math.max(72, by) + 'px');
  }
  if(sproutHit){
    sproutHit.hidden = false;
    sproutHit.style.setProperty('--hx', Math.round(cx) + 'px');
    sproutHit.style.setProperty('--hy', Math.round(cy + hh*0.18) + 'px');
    sproutHit.style.setProperty('--hw', Math.round(w) + 'px');
    sproutHit.style.setProperty('--hh', Math.round(hh*0.72) + 'px');
  }
}

/* Some viewers throttle requestAnimationFrame to a standstill, so anything the
   book needs in order to exist is scheduled on rAF AND a timer — first one wins. */
function soon(fn, ms){
  let ran = false;
  const run = () => { if(ran) return; ran = true; fn(); };
  if(window.requestAnimationFrame) requestAnimationFrame(run);
  setTimeout(run, ms || 32);
}

/* ---------- Focus management for the overlays ----------
 * Both the portal and the assessment modal cover the book, so focus has to be
 * held inside them: without this, tabbing walks out of the dialog and into the
 * pages behind it, which are still there and still focusable. */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
let lastFocus = null;

function focusablesIn(el){
  return [...el.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null || n === document.activeElement);
}
function trapFocus(e){
  const box = document.querySelector('.modal.open .modalbox') ||
              document.querySelector('.portal-overlay.open');
  if(!box || e.key !== 'Tab') return;
  const f = focusablesIn(box);
  if(!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
}
document.addEventListener('keydown', trapFocus, true);

function openOverlay(el){
  lastFocus = document.activeElement;
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
  el.setAttribute('role','dialog');
  el.setAttribute('aria-modal','true');
  const f = focusablesIn(el);
  if(f.length) setTimeout(() => f[0].focus(), 40);
}
function closeOverlay(el){
  el.classList.remove('open');
  el.removeAttribute('aria-modal');
  document.body.style.overflow = '';
  if(lastFocus && lastFocus.focus) lastFocus.focus();
  lastFocus = null;
}

/* ---------- Portal ---------- */
function openPortal(){openOverlay(document.getElementById('portal'))}
function closePortal(){closeOverlay(document.getElementById('portal'));logout()}
function doLogin(){document.getElementById('loginCard').style.display='none';document.getElementById('dash').classList.add('on')}
function logout(){document.getElementById('loginCard').style.display='block';document.getElementById('dash').classList.remove('on')}

/* ---------- Assessment modal ---------- */
const WHATSAPP_NUMBER="91XXXXXXXXXX";   /* <-- put the real number here */
const WA_READY=!WHATSAPP_NUMBER.includes('X');
document.getElementById('year').textContent=new Date().getFullYear();
function openModal(){openOverlay(document.getElementById('modal'))}
function closeModal(){closeOverlay(document.getElementById('modal'));setTimeout(()=>{document.getElementById('formArea').style.display='block';document.getElementById('success').style.display='none';},200)}
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
