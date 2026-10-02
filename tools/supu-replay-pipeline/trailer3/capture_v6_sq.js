// Desktop-layout captures (1280 px viewport) of SP-20260925-683633 for the V6 1:1: forward steps 0..66 (sNNN) and the rewind pass 48..0 (rNNN), same enlarged r/c labels as cap2.js.
const {chromium}=require('playwright');const {setup}=require('../serve2');
const [,,DPR,DIR]=process.argv;
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME});const c=await b.newContext({viewport:{width:1280,height:900},deviceScaleFactor:+DPR});
const p=await c.newPage();await setup(p);await p.goto('https://orbacesudoku.com/su-pu/SP-20260925-683633');await p.waitForTimeout(2000);
await p.addStyleTag({content:'*{scroll-behavior:auto!important}.og-board-frame{grid-template-columns:28px 1fr!important;grid-template-rows:24px auto!important}.og-board-colheads span,.og-board-rowheads span{font-size:16px!important;font-weight:600!important;color:#2f3531!important;letter-spacing:.02em!important}'});
await p.waitForTimeout(400);await p.evaluate(()=>window.scrollTo(0,300));
const shot=async n=>p.locator('.osgc-card--replay').screenshot({path:`${DIR}/${n}.png`});
await p.click('.osr-btn-first');await p.waitForTimeout(150);await shot('s000');
for(let k=1;k<=66;k++){await p.click('.osr-btn-fwd');await p.waitForTimeout(110);await shot('s'+String(k).padStart(3,'0'));}
await p.click('.osr-btn-first');await p.waitForTimeout(150);
for(let k=0;k<49;k++) await p.click('.osr-btn-fwd');
await p.waitForTimeout(200);
for(let k=48;k>=0;k--){await p.click('.osr-btn-back');await p.waitForTimeout(120);await shot('r'+String(k).padStart(3,'0'));}
console.log(await p.evaluate(()=>{const C=document.querySelector('.osgc-card--replay').getBoundingClientRect();const f=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return [Math.round(r.x-C.x),Math.round(r.y-C.y),Math.round(r.width),Math.round(r.height)]};return JSON.stringify({card:[C.width,C.height],story:f('.osr-story'),board:f('.og-board'),list:f('.osr-movelist'),chapters:[...document.querySelectorAll('.osr-story li, .osr-story [class*=chapter]')].slice(0,6).map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.x-C.x),Math.round(r.y-C.y+C.top*0),Math.round(r.width),Math.round(r.height),e.textContent.slice(0,24)]})})}));
await b.close();})();
