const {chromium}=require('playwright');const {setup}=require('./serve');
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[360,640],[430,764],[1280,720]]){
 const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1080/Math.min(w,h)*(w<h?1:1)});
 const p=await c.newPage(); await setup(p); const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push('PE '+e.message));
 await p.goto('https://orbacesudoku.com/su-pu/SP-20260925-683633',{waitUntil:'load'}); await p.waitForTimeout(2500);
 await p.screenshot({path:`shots/probe_${w}.png`,fullPage:true}); console.log(w,errs.slice(0,6));
 const dims=await p.evaluate(()=>({h:document.body.scrollHeight}));console.log(dims);
 await c.close();}
await b.close();})();
