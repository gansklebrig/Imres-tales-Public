(async()=>{const o={};try{__hsGLWELT.modus='aus'}catch(e){}window.__stb='ast:0';__hs.start('friedrich',0);__hs.bot(true);
let n=0;while(!__hs.G.portal&&__hs.G.stage===0&&n++<400){__hs.step(150,1/30);if(n%4===0)await new Promise(r=>setTimeout(r,0))}
const G=__hs.G,P=__hs.P;o.portal=!!G.portal;o.stage=G.stage;o.t=Math.round(G.time);o.kills=G.kills;o.need=G.need;o.sk=G.stageKills;if(!G.portal||G.stage!==0)return JSON.stringify(o);
// Bleiben: Bot aus, Automatik an – Held steht 300 s neben dem Portal herum
const S=__hs.SAVE();const au=S.auto;S.auto=true;__hs.bot(false);const k0=G.kills,lv0=P.level,xp0=P.xp,g0=G.goldRun,t0=G.time;const px=P.x,py=P.y;
for(let i=0;i<60;i++){__hs.step(150,1/30);if(__hs.G.stage!==0||__hs.G.state!=='play')break;await new Promise(r=>setTimeout(r,0))}
o.bleib={s:Math.round(__hs.G.time-t0),kills:__hs.G.kills-k0,lv:[lv0,__hs.P.level],gold:__hs.G.goldRun-g0,feinde:__hs.G.enemies.filter(e=>!e.dead).length,state:__hs.G.state,stage:__hs.G.stage,hp:Math.round(__hs.P.hp),weg:Math.round(Math.hypot(__hs.P.x-px,__hs.P.y-py))};S.auto=au;
return JSON.stringify(o)})()
