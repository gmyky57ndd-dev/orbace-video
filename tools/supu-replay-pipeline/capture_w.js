const {chromium}=require('playwright');const {setup}=require('./serve');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1280,height:900},deviceScaleFactor:2});
const p=await c.newPage();await setup(p);await p.goto('https://orbacesudoku.com/su-pu/SP-20260925-683633');await p.waitForTimeout(2000);
await p.addStyleTag({content:'*{scroll-behavior:auto!important}'});
const card=await p.evaluate(()=>{const s=document.querySelector('.osr-story').closest('section,article,div.card,div[class*=card]')||document.querySelector('.osr-story').parentElement;const r=s.getBoundingClientRect();return {cls:s.className,x:r.x,y:r.y+scrollY,w:r.width,h:r.height}});
console.log('card',card);
await p.evaluate(()=>window.scrollTo(0,300));
const info=[];
for(let k=0;k<=110;k++){
  if(k>0) await p.click('.osr-btn-fwd'); else await p.click('.osr-btn-first');
  await p.waitForTimeout(120);
  const st=await p.evaluate(()=>({step:document.querySelector('.osr-step').textContent,contra:document.querySelectorAll('.og-cell.contradiction').length,
     chap:[...document.querySelectorAll('.osr-story *')].filter(e=>/active|current/.test(e.className)).map(e=>e.className+':'+e.textContent.slice(0,30)).slice(0,3),
     cur:(document.querySelector('.osr-movelist .current, .osr-movelist [aria-current], .osr-movelist .active')||{}).textContent}));
  const off=await p.evaluate(()=>{const c=document.querySelector('.osgc-card--replay').getBoundingClientRect();const s=document.querySelector('.osr-story').getBoundingClientRect();const l=document.querySelector('.osr-movelist').getBoundingClientRect();return {top:s.top-c.top,listBottom:l.bottom-c.top,h:c.height}});info.push({k,...st,...off});
  await p.locator('.osgc-card--replay').screenshot({path:`steps_w/s${String(k).padStart(3,'0')}.png`});
}
require('fs').writeFileSync('steps_w/info.json',JSON.stringify(info,null,1));
await b.close();})();
