// Seller Hub revise helper: adds the PL-570 rubber installation guide to a listing description
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ta; for(let k=0;k<40&&!(ta=document.querySelector('textarea[name=description]'));k++) await sleep(500);
await sleep(1500);
const IMG='https://cdn.jsdelivr.net/gh/KonradVrux/vrux-obrazki@67ce0954b86e1f1c3c20791ace855bf793ed6331/instrukcje/pioneer-pl570/VRUX-Pioneer-PL570-gumy-instrukcja-EN.jpg';
const TT={en:{box:['Adhesive for bonding the inserts','Illustrated installation guide'],alt:'Installation guide',p:'Clean the cup of the original foot very thoroughly – remove all old rubber and dirt. Fit the nuts and the original stud to the new rubber, glue it in with the included adhesive and weigh the feet down evenly for 2 hours. Step-by-step guide below. A professional bonding kit (primer, adhesive, degreaser) is also available in a separate listing.'},
 it:{box:['Adesivo per incollare gli inserti','Istruzioni di montaggio illustrate'],alt:'Istruzioni di montaggio',p:'Pulisci molto accuratamente la coppa del piedino originale da tutta la gomma vecchia e dallo sporco. Monta i dadi e il perno originale sulla nuova gomma, incollala con l’adesivo incluso e carica i piedini in modo uniforme per 2 ore. Istruzioni passo passo qui sotto. Un kit di incollaggio professionale (primer, adesivo, sgrassatore) è disponibile anche in un’inserzione separata.'},
 fr:{box:['Colle pour coller les inserts','Notice de montage illustrée'],alt:'Notice de montage',p:'Nettoyez très soigneusement la coupelle du pied d’origine : retirez toute l’ancienne gomme et la saleté. Montez les écrous et la tige d’origine sur la nouvelle gomme, collez-la avec la colle fournie et lestez les pieds uniformément pendant 2 heures. Notice étape par étape ci-dessous. Un kit de collage professionnel (primaire, colle, dégraissant) est également disponible dans une annonce séparée.'},
 es:{box:['Adhesivo para pegar los insertos','Instrucciones de montaje ilustradas'],alt:'Instrucciones de montaje',p:'Limpia muy a fondo la copa del pie original: retira toda la goma vieja y la suciedad. Monta las tuercas y el espárrago original en la goma nueva, pégala con el adhesivo incluido y pon peso de forma uniforme sobre los pies durante 2 horas. Guía paso a paso más abajo. Un kit de pegado profesional (imprimación, adhesivo, desengrasante) también está disponible en un anuncio aparte.'}};
const title=document.title; const v=ta.value;
const res={title:title.slice(17,80), host:location.host};
if(!/Pioneer/i.test(title)) { res.err='not Pioneer'; }
else if(v.includes('pioneer-pl570/VRUX')) { res.skip='already'; }
else {
 const lang=(v.match(/<div lang="(\w+)"/)||[])[1]; const T=TT[lang]; res.lang=lang;
 const m4=v.search(/M4/); const ulS=v.lastIndexOf('<ul',m4), ulE=v.indexOf('</ul>',m4);
 const ul=v.slice(ulS,ulE); const lis=[...ul.matchAll(/<li[^>]*>(?:<span[^>]*><\/span>)?([^<]*)<\/li>/g)];
 const ci=v.search(/cyano|ciano/i);
 if(!T||m4<0||lis.length<3||ci<0) { res.err='structure '+[!!T,m4,lis.length,ci].join(','); }
 else {
  const last=lis[lis.length-1]; res.li=last[1]; const liOpen=last[0].slice(0,last[0].length-last[1].length-5);
  let out=v.slice(0,ulS)+ul.replace(last[0], liOpen+T.box[0]+'</li>'+liOpen+T.box[1]+'</li>')+v.slice(ulE);
  const c2=out.search(/cyano|ciano/i); const pS=out.lastIndexOf('<p',c2), pE=out.indexOf('</p>',c2)+4; const pOpen=out.slice(pS,out.indexOf('>',pS)+1);
  res.oldP=out.slice(pS,pE).replace(/<[^>]+>/g,'').slice(0,90);
  out=out.slice(0,pS)+pOpen+T.p+'</p><img src="'+IMG+'" alt="'+T.alt+'" style="display:block;width:100%;max-width:640px;height:auto;margin:16px auto 0;border-radius:4px;">'+out.slice(pE);
  const nDraft=()=>performance.getEntriesByType('resource').filter(e=>/listing_draft/.test(e.name)).length; const n0=nDraft();
  const f=document.getElementById('se-rte-frame__summary'); const d=f.contentDocument; const ed=d.querySelector('.se-rte-editor__rich');
  ed.focus(); const sel=d.getSelection(); const rg=d.createRange(); rg.selectNodeContents(ed); sel.removeAllRanges(); sel.addRange(rg);
  d.execCommand('insertHTML',false,out);
  ed.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'a'})); ed.dispatchEvent(new FocusEvent('blur')); ed.dispatchEvent(new FocusEvent('focusout',{bubbles:true})); ed.blur(); f.blur(); document.activeElement?.blur();
  for(let k=0;k<20&&nDraft()===n0;k++) await sleep(500);
  res.saved=nDraft()>n0; res.synced=ta.value.includes('pioneer-pl570/VRUX');
  if(res.saved&&res.synced){ await sleep(1000); const b=[...document.querySelectorAll('button')].find(b=>/^(Revise it|Rivedi|Modifica|Modifier|Revisar)/.test(b.innerText.trim())); res.btn=b&&b.innerText.trim();
   if(b){ b.click(); for(let k=0;k<30&&!/has been revised|è stata modificata|a été modifiée|se ha modificado|revised/i.test(document.body.innerText.slice(0,400));k++) await sleep(500);
    res.done=/has been revised|revised|modificat|modifiée|modificado|überarbeitet/i.test(document.body.innerText.slice(0,400)); res.msg=document.body.innerText.replace(/\s+/g,' ').slice(20,90);} }
 }
}
return res;
