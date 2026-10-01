// Capture the real replay at step 60 (trial closed) at several delays, to see whether the app's "cleared cell" outlines fade on their own.
const {chromium}=require('playwright');const {setup}=require('../serve2');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME});const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});
const p=await c.newPage();await setup(p);await p.goto('https://orbacesudoku.com/su-pu/SP-20260930-610092');await p.waitForTimeout(2000);
await p.addStyleTag({content:'*{scroll-behavior:auto!important}.og-board-frame{grid-template-columns:22px 1fr!important;grid-template-rows:19px auto!important}.og-board-colheads span,.og-board-rowheads span{font-size:13px!important;font-weight:600!important;color:#2f3531!important}'});
await p.evaluate(()=>window.scrollTo(0,300));await p.click('.osr-btn-first');await p.waitForTimeout(150);
for(let k=1;k<=60;k++){await p.click('.osr-btn-fwd');await p.waitForTimeout(60);}
const shot=async n=>p.locator('.osgc-card--replay').screenshot({path:`shots/ret_${n}.png`});
await shot('0110');for(const d of [400,1500,3000]){await p.waitForTimeout(d);await shot('after'+d);}
console.log(await p.evaluate(()=>[...document.querySelectorAll('.og-cell')].filter(e=>getComputedStyle(e).outlineStyle!=='none'||/gold|sel|flash|cleared|recent/i.test(e.className)).slice(0,6).map(e=>e.className)));
await b.close();})();
