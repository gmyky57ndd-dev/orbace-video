const {chromium}=require('playwright');const {setup}=require('./serve');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});
const p=await c.newPage();await setup(p);await p.goto('https://orbacesudoku.com/su-pu/SP-20260925-683633');await p.waitForTimeout(2000);
const r=await p.evaluate(()=>{const C=document.querySelector('.osgc-card--replay').getBoundingClientRect();const f=e=>{const b=e.getBoundingClientRect();return [+(b.x-C.x).toFixed(1),+(b.y-C.y).toFixed(1),+b.width.toFixed(1),+b.height.toFixed(1)]};
return {card:[C.width,C.height],story:f(document.querySelector('.osr-story')),title:f(document.querySelector('.osr-story-title')),li:[...document.querySelectorAll('.osr-story-chapters li')].map(f),board:f(document.querySelector('.og-board')),controls:f(document.querySelector('.osr-controls')),list:f(document.querySelector('.osr-movelist'))}});
console.log(JSON.stringify(r));await b.close();})();
