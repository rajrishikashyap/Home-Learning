import { launch, PAGE } from './browser.mjs';
const b = await launch();

for (const rm of ['no-preference','reduce']) {
  const p = await b.newPage({ viewport:{width:1440,height:900}, reducedMotion: rm });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(PAGE, { waitUntil:'load' });
  await p.waitForTimeout(3000);

  const cfg = await p.evaluate(()=>({
    spring: getComputedStyle(document.documentElement).getPropertyValue('--spring').trim().slice(0,26),
    flip:   jQuery('#flipbook').data().opts.duration,
    btnFn:  getComputedStyle(document.querySelector('.btn.gold')).transitionTimingFunction.slice(0,22),
  }));

  // does the face change on its own?
  /* Idle drift ticks every 5.2s and picks randomly between the spread's own
     face and a soft smile, so comparing two instants is a coin flip. Watch the
     whole window and count how many distinct mouths actually appear. */
  const moods = await p.evaluate(()=>new Promise(res=>{
    const seen=new Set(); const el=document.getElementById('s-mouth');
    const t=setInterval(()=>seen.add(el.getAttribute('d')), 250);
    setTimeout(()=>{ clearInterval(t); res(seen.size); }, 20000);
  }));
  const m0 = 1, m1 = moods;

  // does it wave, and with which animation?
  // goto() a spread whose GUIDE pose actually waves ('wave' on 0, 'cheer' on 9)
  // and that we are not already on — otherwise no turn fires and nothing waves.
  await p.evaluate(()=>goto(4)); await p.waitForTimeout(1600);
  const waves = await p.evaluate(async ()=>{
    let hits=0; const el=document.getElementById('sprout');
    const o=new MutationObserver(()=>{ if(el.classList.contains('waving')) hits++; });
    o.observe(el,{attributes:true,attributeFilter:['class']});
    goto(0); await new Promise(r=>setTimeout(r,2600)); o.disconnect(); return hits;
  });
  // sample the arm WHILE it is waving, not after
  const waveAnim = await p.evaluate(async ()=>{
    /* The swing lives in the forearm and wrist now, not the shoulder — reading
       s-armR reports 'none' on cheer, which waves from where it already is. */
    goto(9); await new Promise(r=>setTimeout(r,1200));
    return getComputedStyle(document.getElementById('s-foreR')).animationName;
  });

  // is the entry animation present?
  const stag = await p.evaluate(()=>{
    const k=document.querySelector('.page-inner.stagger > *');
    return k ? getComputedStyle(k).animationName : 'none';
  });

  console.log(`\n--- prefers-reduced-motion: ${rm} ---`);
  console.log(`  --spring        ${cfg.spring}`);
  console.log(`  flip duration   ${cfg.flip}ms`);
  console.log(`  button easing   ${cfg.btnFn}`);
  console.log(`  face changes    ${m1>1 ? 'YES ('+m1+' distinct)' : 'no'}`);
  console.log(`  waves on turn   ${waves>0 ? 'YES ('+waves+')' : 'no'}`);
  console.log(`  wave animation  ${waveAnim}`);
  console.log(`  entry animation ${stag}`);
  console.log(`  errors          ${errs.length?errs:'none'}`);
  await p.close();
}
await b.close();
