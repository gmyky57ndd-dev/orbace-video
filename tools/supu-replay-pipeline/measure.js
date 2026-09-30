const {chromium}=require('playwright');const {setup}=require('./serve');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});
const p=await c.newPage();await setup(p);await p.goto('https://orbacesudoku.com/su-pu/SP-20260925-683633');await p.waitForTimeout(2000);
const r=await p.evaluate(()=>{const o={};const sel=['.osr-v2','.osr-story','[class*=story]','.og-board','[class*=controls]','[class*=list]','.osr-step'];
for(const s of sel){document.querySelectorAll(s).forEach((e,i)=>{if(i<3){const b=e.getBoundingClientRect();o[s+'#'+i+' '+e.className.slice(0,50)]=[Math.round(b.x),Math.round(b.y+scrollY),Math.round(b.width),Math.round(b.height)]}})}return o});
console.log(r);await b.close();})();
