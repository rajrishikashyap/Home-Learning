import { launch, PAGE } from './browser.mjs';
const b=await launch();
const errs=[];
const p=await b.newPage({viewport:{width:1440,height:900}});
p.on('pageerror',e=>errs.push(e.message));
await p.goto(PAGE,{waitUntil:'load'});
await p.waitForTimeout(3000);
const labels=await p.evaluate(()=>[...document.getElementById('progress').children].map(b=>b.title));
console.log('pages:', await p.evaluate(()=>jQuery('#flipbook').turn('pages')),
            '| views:', labels.length,
            '| start page:', await p.evaluate(()=>jQuery('#flipbook').turn('page')));
console.log();
for(let i=0;i<10;i++){
  await p.evaluate(k=>goto(k),i); await p.waitForTimeout(1100);
  const r=await p.evaluate(()=>{
    const view=jQuery('#flipbook').turn('view').filter(Boolean);
    const d=jQuery('#flipbook').data();
    const heads=view.map(n=>{const el=d.pageObjs[n][0];
      const h=el.querySelector('.running-head span'); const f=el.querySelector('.folio');
      const isCover=el.classList.contains('cover');
      return isCover?'COVER':(h?h.textContent:'(plate)')+'/'+(f?f.textContent:'—');});
    return {page:jQuery('#flipbook').turn('page'),view,heads,
      dot:[...document.getElementById('progress').children].findIndex(b=>b.classList.contains('on'))};
  });
  console.log(`  goto(${i}) -> p${String(r.page).padStart(2)} view[${String(r.view).padEnd(6)}] dot=${r.dot}  ${r.heads.join('  |  ')}`);
}
// endpaper can no longer exist — try the drag that used to reach it
const box=await p.evaluate(()=>{const r=document.getElementById('flipbook').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
await p.evaluate(()=>goto(0)); await p.waitForTimeout(1100);
await p.mouse.move(box.x+14, box.y+box.h-14); await p.mouse.down();
for(let i=1;i<=12;i++){ await p.mouse.move(box.x+14+i*40, box.y+box.h-14-i*8); await p.waitForTimeout(25); }
await p.mouse.up(); await p.waitForTimeout(1400);
console.log('\nafter the backward corner-drag on the cover:', JSON.stringify(await p.evaluate(()=>({p:jQuery('#flipbook').turn('page'),v:jQuery('#flipbook').turn('view')}))));
await p.evaluate(()=>goto(0)); await p.waitForTimeout(1200);
await p.screenshot({path:'cover-new.png'});
await p.close(); await b.close();
console.log('errors:', errs.length?errs:'none');
