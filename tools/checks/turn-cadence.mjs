import { launch, PAGE } from './browser.mjs';
const URL = process.argv[2] || PAGE;
const b=await launch();
async function trial(startSpread){
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.goto(URL,{waitUntil:'load'});
  await p.waitForTimeout(2600);
  if(startSpread){ await p.evaluate(k=>goto(k),startSpread); await p.waitForTimeout(1800); }
  const r=await p.evaluate(async()=>{
    const gaps=[]; let last=performance.now(), on=true;
    (function t(){ if(!on)return; const n=performance.now(); gaps.push(n-last); last=n; requestAnimationFrame(t); })();
    turn(1); await new Promise(r=>setTimeout(r,1200)); on=false;
    const g=gaps.slice(3).sort((a,b)=>a-b);
    return {n:g.length, med:+g[g.length>>1].toFixed(1), p95:+g[Math.floor(g.length*.95)].toFixed(1),
      worst:+g[g.length-1].toFixed(1), o20:g.filter(x=>x>20).length, o33:g.filter(x=>x>33).length};
  });
  await p.close(); return r;
}
for(const [label,sp] of [['cover -> spread 1 (hard board)',0],['spread 4 -> 5 (mid-book)',4]]){
  const rs=[]; for(let i=0;i<5;i++) rs.push(await trial(sp));
  const avg=k=>+(rs.reduce((a,r)=>a+r[k],0)/rs.length).toFixed(1);
  console.log(`${label}\n  median ${avg('med')}ms  p95 ${avg('p95')}ms  worst ${avg('worst')}ms  >20ms ${avg('o20')}  >33ms ${avg('o33')}   (5 trials)`);
}
await b.close();
