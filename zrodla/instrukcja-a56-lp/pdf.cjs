const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:794,height:1123}});
 const dir=__dirname;
 for(const l of (process.env.L||'pl,en,de').split(',')){ await p.goto('file://'+dir+'/'+l+'.html'); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(300);
  const ov=await p.evaluate(()=>{const r=[];document.querySelectorAll('main,section,p,h3').forEach(e=>{if(e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1)r.push(e.tagName+':'+e.textContent.slice(0,30))});const m=document.querySelector('main').getBoundingClientRect(), f=document.querySelector('footer').getBoundingClientRect(), g=document.querySelectorAll('section')[1].getBoundingClientRect();return {r,gridBottom:g.bottom,footerTop:f.top, fonts:[...document.fonts].filter(f=>f.status==='loaded').length}});
  console.log(l,JSON.stringify(ov));
  await p.pdf({path:dir+(l.startsWith('mk2-')?`/VRUX-A56-MK2-instrukcja-${l.slice(4).toUpperCase()}.pdf`:`/VRUX-A56-LP-instrukcja-${l.toUpperCase()}.pdf`),width:'794px',height:'1123px',printBackground:true,pageRanges:'1'});
  await p.screenshot({path:dir+`/${l}.png`}); }
 await b.close(); })();
