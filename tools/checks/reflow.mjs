import { launch, PAGE } from './browser.mjs';
const b=await launch();
async function run(label, spread){
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.goto(PAGE,{waitUntil:'load'});
  await p.waitForTimeout(2600);
  if(spread){ await p.evaluate(k=>goto(k),spread); await p.waitForTimeout(1700); }
  const r=await p.evaluate(async()=>{
    // count the reads that force layout, and the writes that invalidate it
    const c={read:0, styleWrite:0, frames:0};
    const props=['offsetWidth','offsetHeight','clientWidth','clientHeight','scrollWidth','scrollHeight'];
    for(const pr of props){
      const d=Object.getOwnPropertyDescriptor(HTMLElement.prototype,pr);
      Object.defineProperty(HTMLElement.prototype,pr,{get(){c.read++;return d.get.call(this);}});
    }
    const gcs=window.getComputedStyle;
    window.getComputedStyle=function(...a){c.read++;return gcs.apply(this,a);};
    const sp=CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty=function(...a){c.styleWrite++;return sp.apply(this,a);};
    const oc=jQuery.fn.css;
    jQuery.fn.css=function(...a){ if(a.length>1||typeof a[0]==='object') c.styleWrite++; return oc.apply(this,a); };
    let on=true; (function t(){ if(!on)return; c.frames++; requestAnimationFrame(t); })();
    turn(1); await new Promise(r=>setTimeout(r,1150)); on=false;
    return c;
  });
  console.log(`${label.padEnd(26)} forced reads ${String(r.read).padStart(5)}   style writes ${String(r.styleWrite).padStart(5)}   frames ${r.frames}`
    + `   -> ${(r.read/r.frames).toFixed(1)} reads/frame, ${(r.styleWrite/r.frames).toFixed(1)} writes/frame`);
  await p.close();
}
await run('HARD  cover -> spread 1', 0);
await run('SHEET spread 4 -> 5', 4);
await b.close();
