import { launch, PAGE } from './browser.mjs';
const b=await launch();
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto(PAGE,{waitUntil:'load'});
await p.waitForTimeout(3000);
const box=await p.evaluate(()=>{const r=document.getElementById('flipbook').getBoundingClientRect();
  return {x:r.x,y:r.y,w:r.width,h:r.height}});
console.log('start page:', await p.evaluate(()=>jQuery('#flipbook').turn('page')));

// drag the BOTTOM-LEFT corner rightwards — turn.js's own backward fold,
// which never goes through our turn() guard
await p.mouse.move(box.x+14, box.y+box.h-14);
await p.mouse.down();
for(let i=1;i<=12;i++){ await p.mouse.move(box.x+14+i*40, box.y+box.h-14-i*8); await p.waitForTimeout(25); }
await p.mouse.up();
await p.waitForTimeout(1600);
const after=await p.evaluate(()=>({page:jQuery('#flipbook').turn('page'),view:jQuery('#flipbook').turn('view')}));
console.log('after dragging the bottom-left corner:', JSON.stringify(after));
/* Page 1 is the cover and the floor. A backward drag on it must leave the book
   exactly where it was — there is nothing behind the cover to reach. */
console.log(after.page === 1 ? '  drag went nowhere, as it should' : '  >>> DRAG WENT PAST THE COVER');
await p.screenshot({path:'drag-repro.png'});
await b.close();
