import { launch, PAGE } from './browser.mjs';
const b = await launch();
const errs = [];
const p = await b.newPage({ viewport:{width:1440,height:900} });
p.on('pageerror', e => errs.push(e.message));
await p.goto(PAGE, { waitUntil:'load' });
await p.waitForTimeout(3000);

// 1. the cover is the floor: nothing before it by any path
await p.mouse.move(720,450);
for (let i=0;i<6;i++){ await p.mouse.wheel(0,-150); await p.waitForTimeout(70); }
await p.waitForTimeout(1500);
const scrollUp = await p.evaluate(()=>({p:jQuery('#flipbook').turn('page'),v:jQuery('#flipbook').turn('view')}));
await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(1200);
const key = await p.evaluate(()=>jQuery('#flipbook').turn('page'));
const fn  = await p.evaluate(()=>{ turn(-1); return jQuery('#flipbook').turn('page'); });
const gt  = await p.evaluate(()=>{ goto(-5); return jQuery('#flipbook').turn('page'); });
console.log(`cover floor:  scrollUp=${scrollUp.p} view=[${scrollUp.v}]  arrowLeft=${key}  turn(-1)=${fn}  goto(-5)=${gt}`);
console.log(Math.min(scrollUp.p,key,fn,gt) >= 1 && Math.max(scrollUp.p,key,fn,gt) <= 2 ? '  NOTHING BEFORE THE COVER\n' : '  WENT PAST THE COVER\n');

// 2. one expression per spread, visibly different
const seen = [];
for (const i of [0,1,2,3,8,9]) {
  await p.evaluate(k=>goto(k), i); await p.waitForTimeout(1600);
  seen.push(await p.evaluate(()=>({
    mouth: document.getElementById('s-mouth').getAttribute('d').slice(0,18),
    brows: document.getElementById('s-brows').style.opacity,
    tilt:  document.getElementById('sprout').style.getPropertyValue('--tilt') || '0deg'
  })));
}
console.log('expression per spread:');
[0,1,2,3,8,9].forEach((sp,i)=>console.log(`  spread ${sp}: ${JSON.stringify(seen[i])}`));
console.log(`  distinct mouths: ${new Set(seen.map(m=>m.mouth)).size}\n`);

// 3. waving actually happens
const waved = await p.evaluate(async ()=>{
  let hits = 0;
  const el = document.getElementById('sprout');
  const obs = new MutationObserver(()=>{ if(el.classList.contains('waving')) hits++; });
  obs.observe(el, {attributes:true, attributeFilter:['class']});
  goto(0);                                   // back to the cover: GUIDE pose 'wave'
                                             // (the loop above left us on 9, and
                                             //  goto() to where you already are
                                             //  never fires a turn)
  await new Promise(r=>setTimeout(r,2500));
  obs.disconnect();
  return hits;
});
console.log(`wave fired on arrival: ${waved > 0 ? 'yes' : 'NO'} (${waved} times)`);

// 4. idle drift between turns (one tick is 5.2s and is a 50/50 coin flip,
//    so sample long enough for several ticks before calling it dead)
/* Watch the whole window rather than comparing two instants: the drift picks
   randomly between the spread's face and a soft smile, so endpoints are a coin
   flip and the test failed at random. */
const moods = await p.evaluate(()=>new Promise(res=>{
  const seen=new Set(), el=document.getElementById('s-mouth');
  const t=setInterval(()=>seen.add(el.getAttribute('d')),250);
  setTimeout(()=>{clearInterval(t);res(seen.size)},22000);
}));
console.log(`idle drift over 22s: ${moods>1 ? moods+' distinct expressions' : 'NO CHANGE'}`);

console.log('3D mascot active:', await p.evaluate(()=>document.getElementById('sprout').classList.contains('is3d')));
await p.close(); await b.close();
console.log('\nerrors:', errs.length ? errs : 'none');
