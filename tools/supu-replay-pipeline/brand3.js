const {chromium}=require('playwright');const {setup}=require('./serve2');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME});const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:6});
const p=await c.newPage();await setup(p);await p.goto('https://orbacesudoku.com/su-pu/SP-20260930-610092');await p.waitForTimeout(1500);
const h=await p.evaluate(()=>{const a=document.querySelector('header a, .brand, [class*=brand], [class*=logo]');return a?a.outerHTML.slice(0,300):null});console.log(h);
const loc=p.locator('header a').first(); await loc.screenshot({path:'shots/brand.png',omitBackground:true});await b.close();})();
