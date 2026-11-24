const fs=require('fs');const st=process.argv[2],out=process.argv[3];
(async()=>{const l=await (await fetch('http://127.0.0.1:9222/json')).json();const p=l.find(x=>x.type==='page');const ws=new WebSocket(p.webSocketDebuggerUrl);let id=0;const pend={};
ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend[d.id]){pend[d.id](d);delete pend[d.id]}};await new Promise(r=>ws.onopen=r);
const send=(method,params={})=>new Promise(r=>{pend[++id]=r;ws.send(JSON.stringify({id,method,params}))});
const r=await send('Runtime.evaluate',{expression:`(()=>{__hs.stage(${st});__hs.G.paused=true;window.__anaMal=1;const a=__ana(7);window.__anaMal=0;return JSON.stringify({a,u:__anaUrl})})()`,returnByValue:true});
const o=JSON.parse(r.result.result.value);fs.writeFileSync(out,Buffer.from(o.u.split(',')[1],'base64'));console.log(JSON.stringify(o.a));ws.close()})();