// kleines CDP-Werkzeug: node cdp.js '<js-Ausdruck>' [png]
const expr=process.argv[2],png=process.argv[3];
(async()=>{const l=await (await fetch('http://127.0.0.1:9222/json')).json();const p=l.find(x=>x.type==='page');
const ws=new WebSocket(p.webSocketDebuggerUrl);let id=0;const pend={};
ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend[d.id]){pend[d.id](d);delete pend[d.id]}};
await new Promise(r=>ws.onopen=r);const send=(method,params={})=>new Promise(r=>{pend[++id]=r;ws.send(JSON.stringify({id,method,params}))});
const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true});
if(r.result.exceptionDetails)console.log('EXC',JSON.stringify(r.result.exceptionDetails).slice(0,1500));console.log(JSON.stringify(r.result.result.value!==undefined?r.result.result.value:r.result,null,1).slice(0,6000));
if(png){const s=await send('Page.captureScreenshot',{format:'png'});require('fs').writeFileSync(png,Buffer.from(s.result.data,'base64'))}
ws.close()})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
