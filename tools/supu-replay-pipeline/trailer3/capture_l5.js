// Phone-layout captures (390 px viewport) for SP-20261005-922508: forward steps 0..N (sNNN) and a real Back-control pass from step RB down to 0 (rNNN).
const {chromium}=require('playwright');const {setup}=require('../serve2');
const [,,DPR,DIR,N,RB]=process.argv;
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME});const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:+DPR});
const p=await c.newPage();await setup(p);await p.goto('https://orbacesudoku.com/su-pu/SP-20261005-922508');await p.waitForTimeout(2000);
await p.addStyleTag({content:'*{scroll-behavior:auto!important}.og-board-frame{grid-template-columns:22px 1fr!important;grid-template-rows:19px auto!important}.og-board-colheads span,.og-board-rowheads span{font-size:13px!important;font-weight:600!important;color:#2f3531!important;letter-spacing:.02em!important}'});
await p.waitForTimeout(400);await p.evaluate(()=>window.scrollTo(0,300));
const shot=async n=>p.locator('.osgc-card--replay').screenshot({path:`${DIR}/${n}.png`});
const pad=k=>String(k).padStart(3,'0');
await p.click('.osr-btn-first');await p.waitForTimeout(150);await shot('s000');
for(let k=1;k<=+N;k++){await p.click('.osr-btn-fwd');await p.waitForTimeout(110);await shot('s'+pad(k));}
await p.click('.osr-btn-first');await p.waitForTimeout(150);
for(let k=0;k<+RB;k++) await p.click('.osr-btn-fwd');
await p.waitForTimeout(200);
for(let k=+RB-1;k>=0;k--){await p.click('.osr-btn-back');await p.waitForTimeout(120);await shot('r'+pad(k));}
console.log(await p.evaluate(()=>{const C=document.querySelector('.osgc-card--replay').getBoundingClientRect();const f=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return [Math.round(r.x-C.x),Math.round(r.y-C.y),Math.round(r.width),Math.round(r.height)]};return JSON.stringify({card:[C.width,C.height],story:f('.osr-story'),board:f('.og-board'),controls:f('.osr-controls'),list:f('.osr-movelist')})}));
await b.close();})();
