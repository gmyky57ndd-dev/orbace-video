const {chromium}=require('playwright');const {setup}=require('./serve2');
const [,,W,H,DPR,DIR,ID,N,REVFROM]=process.argv;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:+W,height:+H},deviceScaleFactor:+DPR});
const p=await c.newPage();await setup(p);await p.goto('https://orbacesudoku.com/su-pu/'+ID);await p.waitForTimeout(2000);
await p.addStyleTag({content:'*{scroll-behavior:auto!important}'});
const FS=+W>600?16:13, GC=+W>600?28:22, GR=+W>600?24:19;
await p.addStyleTag({content:`.og-board-frame{grid-template-columns:${GC}px 1fr!important;grid-template-rows:${GR}px auto!important}
.og-board-colheads span,.og-board-rowheads span{font-size:${FS}px!important;font-weight:600!important;color:#2f3531!important;letter-spacing:.02em!important}`});
await p.waitForTimeout(400);await p.evaluate(()=>window.scrollTo(0,300));
const shot=async n=>p.locator('.osgc-card--replay').screenshot({path:`${DIR}/${n}.png`});
await p.click('.osr-btn-first');await p.waitForTimeout(150);await shot('s000');
const info=[];
for(let k=1;k<=+N;k++){await p.click('.osr-btn-fwd');await p.waitForTimeout(110);await shot('s'+String(k).padStart(3,'0'));
 if(k==1||k==12||k==136) info.push(await p.evaluate(()=>{const C=document.querySelector('.osgc-card--replay').getBoundingClientRect();const f=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return [Math.round(b.x-C.x),Math.round(b.y-C.y),Math.round(b.width),Math.round(b.height)]};return {step:document.querySelector('.osr-step').textContent,card:[C.width,C.height],story:f('.osr-story'),takeaway:f('.osr-story-takeaway'),board:f('.og-board'),controls:f('.osr-controls'),list:f('.osr-movelist')}}));}
if(+REVFROM>=0){for(let k=+N;k>+REVFROM;k--) await p.click('.osr-btn-back');
for(let k=+REVFROM-1;k>=0;k--){await p.click('.osr-btn-back');await p.waitForTimeout(110);await shot('r'+String(k).padStart(3,'0'));}}
console.log(JSON.stringify(info));await b.close();})();
