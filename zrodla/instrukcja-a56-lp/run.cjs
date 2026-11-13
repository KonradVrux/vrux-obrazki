const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{
 const [W,H]=[+process.argv[3]||1600,+process.argv[4]||1200];
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:800,height:600}});
 p.on('pageerror',e=>console.log('E:',e.message)); p.on('console',m=>{if(m.type()==='error')console.log('C:',m.text())});
 await p.goto(`http://127.0.0.1:8765/instr.html?w=${W}&h=${H}&v=${process.env.V||'lp'}`); await p.waitForFunction('window.ready===true',{timeout:180000});
 for(const n of process.argv[2].split(',')){ const t0=Date.now(); const r=await p.evaluate(async([n])=>{await I.still(n);return I.canvas.toDataURL('image/png')},[n]);
   fs.writeFileSync(`instr/${process.env.V||'lp'}_${n}.png`,Buffer.from(r.split(',')[1],'base64')); console.log(n,Date.now()-t0,'ms'); }
 await b.close();})();
