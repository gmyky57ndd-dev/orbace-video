const {chromium}=require('playwright');const {setup}=require('./serve');
const [,,W,H,DPR,DIR]=process.argv;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:+W,height:+H},deviceScaleFactor:+DPR});
const p=await c.newPage();await setup(p);await p.goto('https://orbacesudoku.com/su-pu/SP-20260925-683633');await p.waitForTimeout(2000);
await p.addStyleTag({content:'*{scroll-behavior:auto!important}'});await p.evaluate(()=>window.scrollTo(0,300));
for(let k=0;k<49;k++) await p.click('.osr-btn-fwd');
await p.waitForTimeout(200);
for(let k=48;k>=0;k--){ await p.click('.osr-btn-back'); await p.waitForTimeout(120);
  await p.locator('.osgc-card--replay').screenshot({path:`${DIR}/r${String(k).padStart(3,'0')}.png`});}
await b.close();})();
