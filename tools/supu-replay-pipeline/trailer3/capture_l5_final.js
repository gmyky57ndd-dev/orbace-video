// Lesson 05 finals: phone-layout capture (390 px viewport) of the real replay for one output format, steps s000..s046, with the app's pencil
// notes enlarged by CSS (readability on phones). Then quiet frames for steps 39..46 (sNNNq): the app's path pins (.og-pin, .haspin outline)
// hidden once the trial is resolved, and at step 39 also the gold 'cleared cell' outlines (.justplaced). Values, notes and colours are untouched.
// usage: CHROME=... SITE=site3 node trailer3/capture_l5_final.js <dpr> <dir>
const {chromium}=require('playwright');const {setup}=require('../serve2');
const [,,DPR,DIR]=process.argv;
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME});const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:+DPR});
const p=await c.newPage();await setup(p);await p.goto('https://orbacesudoku.com/su-pu/SP-20261005-922508');await p.waitForTimeout(2000);
await p.addStyleTag({content:'*{scroll-behavior:auto!important}.og-board-frame{grid-template-columns:22px 1fr!important;grid-template-rows:19px auto!important}.og-board-colheads span,.og-board-rowheads span{font-size:13px!important;font-weight:600!important;color:#2f3531!important;letter-spacing:.02em!important}.og-notes{font-size:14px!important;font-weight:700!important;inset:1px!important}.og-notes span{font-weight:700!important}'});
await p.waitForTimeout(400);await p.evaluate(()=>window.scrollTo(0,300));
const shot=async n=>p.locator('.osgc-card--replay').screenshot({path:`${DIR}/${n}.png`});
const pad=k=>String(k).padStart(3,'0');
await p.click('.osr-btn-first');await p.waitForTimeout(150);await shot('s000');
for(let k=1;k<=46;k++){await p.click('.osr-btn-fwd');await p.waitForTimeout(110);await shot('s'+pad(k));}
await p.evaluate(()=>{const s=document.createElement('style');s.id='quiet';document.head.appendChild(s)});
for(let k=39;k<=46;k++){
  await p.click('.osr-btn-first');await p.waitForTimeout(100);
  for(let j=0;j<k;j++) await p.click('.osr-btn-fwd');
  await p.evaluate(k=>{document.getElementById('quiet').textContent='.osr-v2 .og-pin{visibility:hidden!important}.osr-v2 .og-cell.haspin{box-shadow:none!important}'+(k==39?'.osr-v2 .og-cell.justplaced{box-shadow:none!important;animation:none!important}':'')},k);
  await p.waitForTimeout(700);await shot('s'+pad(k)+'q');
  await p.evaluate(()=>{document.getElementById('quiet').textContent=''});}
console.log(await p.evaluate(()=>{const C=document.querySelector('.osgc-card--replay').getBoundingClientRect();const r=document.querySelector('.og-board').getBoundingClientRect();return JSON.stringify({card:[C.width,C.height],board:[r.x-C.x,r.y-C.y,r.width,r.height]})}));
await b.close();})();
