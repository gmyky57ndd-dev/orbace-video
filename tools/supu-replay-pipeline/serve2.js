const fs=require('fs'),path=require('path');
const FS='node_modules/@fontsource';
const SITE=process.env.SITE||'site2';  // snapshot dir; site3 = 2026-09-30 refresh (page_<last6>.html, data_<last6>.json)
const tag=u=>(u.pathname.match(/(\d{6})\/?$/)||[])[1];
const fontCss=['noto-serif-sc/500.css','noto-serif-sc/700.css','noto-serif-sc/400.css','ibm-plex-mono/400.css','ibm-plex-mono/500.css','ibm-plex-mono/600.css','ibm-plex-sans/400.css','ibm-plex-sans/500.css','ibm-plex-sans/600.css']
  .map(f=>fs.readFileSync(path.join(FS,f),'utf8').replace(/url\(\.\/files\//g,`url(https://fonts.local/${f.split('/')[0]}/files/`)).join('\n');
const types={css:'text/css',js:'application/javascript',html:'text/html',json:'application/json',woff2:'font/woff2',woff:'font/woff'};
async function setup(page,{extraCss=''}={}){
  await page.route('**/*',async r=>{
    const u=new URL(r.request().url());
    if(u.host==='orbacesudoku.com'){
      let p=u.pathname==='/'?'index.html':u.pathname.slice(1);
      if(p.startsWith('su-pu/')) {return r.fulfill({body:fs.readFileSync(SITE!=='site2'?`${SITE}/page_${tag(u)}.html`:u.pathname.includes('355762')?'site2/page_355762.html':u.pathname.includes('047554')?'site2/page_easy.html':'site2/page.html'),contentType:'text/html'});}
      const fp=path.join(SITE,p);
      if(fs.existsSync(fp)){let body=fs.readFileSync(fp); return r.fulfill({body,contentType:types[p.split('.').pop()]||'text/plain'});}
      return r.fulfill({status:404,body:''});
    }
    if(u.host==='justinzero.fly.dev'&&u.pathname.startsWith('/supu/')) return r.fulfill({body:fs.readFileSync(SITE!=='site2'?`${SITE}/data_${tag(u)}.json`:u.pathname.includes('355762')?'site2/data_355762.json':u.pathname.includes('047554')?'site2/data_easy.json':'site2/data.json'),contentType:'application/json',headers:{'access-control-allow-origin':'https://orbacesudoku.com','access-control-allow-credentials':'true'}});
    if(u.host==='fonts.googleapis.com') return r.fulfill({body:fontCss+extraCss,contentType:'text/css',headers:{'access-control-allow-origin':'*'}});
    if(u.host==='fonts.local'){const fp=path.join(FS,u.pathname);return r.fulfill({body:fs.readFileSync(fp),contentType:'font/woff2',headers:{'access-control-allow-origin':'*'}});}
    return r.abort();
  });
}
module.exports={setup};
