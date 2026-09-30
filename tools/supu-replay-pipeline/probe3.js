const {chromium}=require('playwright');const {setup}=require('./serve2');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME||undefined});const c=await b.newContext({viewport:{width:+process.argv[2],height:+process.argv[3]},deviceScaleFactor:1});
const p=await c.newPage();p.on('pageerror',e=>console.log('ERR',e.message));await setup(p);await p.goto('https://orbacesudoku.com/su-pu/SP-20260930-610092');await p.waitForTimeout(2500);
console.log(await p.evaluate(()=>document.querySelector('.osr-step')?.textContent));
await p.click('.osr-btn-fwd');await p.waitForTimeout(300);
await p.locator('.osgc-card--replay').screenshot({path:'shots/probe_'+process.argv[2]+'.png'});await b.close();})();
