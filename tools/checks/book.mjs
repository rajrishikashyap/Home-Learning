import { launch, PAGE } from './browser.mjs';
const b=await launch();
const errs=[],bad=[];
for(const [name,w,h] of [['desktop',1440,900],['tablet',900,1000],['mobile',390,844]]){
  const p=await b.newPage({viewport:{width:w,height:h}});
  p.on('pageerror',e=>errs.push(`[${name}] ${e.message}`));
  p.on('response',r=>{if(r.status()>=400)bad.push(`[${name}] ${r.status()} ${r.url().split('/').pop()}`)});
  await p.goto(PAGE,{waitUntil:'load'});
  await p.waitForTimeout(2500);
  const s=await p.evaluate(()=>({
    display:jQuery('#flipbook').turn('display'),
    page:jQuery('#flipbook').turn('page'),
    pages:jQuery('#flipbook').turn('pages'),
    view:jQuery('#flipbook').turn('view'),
    size:jQuery('#flipbook').turn('size'),
    inDOM:document.querySelectorAll('#flipbook > .page-wrapper').length,
    dots:document.getElementById('progress').children.length}));
  console.log(`[${name}]`, JSON.stringify(s));
  // scroll-to-flip
  await p.mouse.move(w/2,h/2);
  const before=await p.evaluate(()=>jQuery('#flipbook').turn('page'));
  for(let i=0;i<5;i++){ await p.mouse.wheel(0,150); await p.waitForTimeout(70); }
  await p.waitForTimeout(1600);
  const after=await p.evaluate(()=>jQuery('#flipbook').turn('page'));
  console.log(`  scroll-to-flip: ${before} -> ${after}  ${after!==before?'OK':'NO TURN'}`);
  // nav pill jump
  await p.evaluate(()=>goto(6)); await p.waitForTimeout(1500);
  const jumped=await p.evaluate(()=>({page:jQuery('#flipbook').turn('page'),
    head:(document.querySelector('#flipbook .page .running-head span')||{}).textContent}));
  console.log(`  goto(6) -> page ${jumped.page} (${jumped.head})`);
  // more-fade must still be able to show
  const fade=await p.evaluate(()=>{const f=document.querySelector('.more-fade');
    return f?getComputedStyle(f).display:'none-found'});
  console.log(`  more-fade display: ${fade}`);
  await p.screenshot({path:`tj-${name}.png`});
  await p.close();
}
await b.close();
console.log('\npageerrors:',errs.length?errs:'none');
console.log('failed requests:',bad.length?bad:'none');
