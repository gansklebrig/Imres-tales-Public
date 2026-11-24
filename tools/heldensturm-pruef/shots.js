const fs=require('fs');const S=process.argv.slice(2).map(Number);
(async()=>{const l=await (await fetch('http://127.0.0.1:9222/json')).json();const p=l.find(x=>x.type==='page');const ws=new WebSocket(p.webSocketDebuggerUrl);let id=0;const pend={};
ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend[d.id]){pend[d.id](d);delete pend[d.id]}};await new Promise(r=>ws.onopen=r);
const send=(method,params={})=>new Promise(r=>{pend[++id]=r;ws.send(JSON.stringify({id,method,params}))});
const ev=e=>send('Runtime.evaluate',{expression:e,awaitPromise:true,returnByValue:true}).then(d=>d.result.result&&d.result.result.value);
console.log(await ev(`(async()=>{const W8=ms=>new Promise(r=>setTimeout(r,ms));__hsGLWELT.modus='an';__hs.start('barradin',0);await W8(800);try{__hs.call('openOverlay','settings')}catch(e){}await W8(900);const s=document.querySelector('[data-gfx]');if(s){s.value=5;s.dispatchEvent(new Event('input',{bubbles:true}))}await W8(300);const rb=document.querySelector('[data-act="res"][data-v="1"]');if(rb)rb.click();await W8(300);try{__hs.call('closeOverlay')}catch(e){}return 'bereit '+!!s})()`));
for(const s of S){await ev(`(async()=>{__hs.stage(${s});__hs.bot(true);__hs.G.paused=false;await new Promise(r=>setTimeout(r,${process.env.WARTE||14000}));__hs.G.paused=true;await new Promise(r=>setTimeout(r,2500));return 1})()`);
 const sh=await send('Page.captureScreenshot',{format:'jpeg',quality:82});fs.writeFileSync(`/tmp/t/th${s}.jpg`,Buffer.from(sh.result.data,'base64'));console.log('Stufe',s,await ev('__hs.G.themeKey+" "+__hsGLFX.err.length+" "+__hsGLWELT.err.length'))}
ws.close()})();
