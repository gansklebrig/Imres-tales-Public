// Im Spiel: __simLauf(held, ast, stufen, schwierigkeit, bot) → JSON
window.__simLauf=async function(held,ast,stufen,diff,bot){const o={tode:0,st:[]};try{
 try{__hsGLWELT.modus='aus'}catch(e){}
 window.__bb=null;window.__bpick=[];window.__stb='ast:'+ast;
 __hs.start(held,diff||0);__hs.bot(true);const fn=__hs.fn();o.ast=__hs.P.hero.branches[ast];
 let last=0,tS=0,echt=performance.now(),maxS=stufen*900,hpMin=1,dmgIn=0,hp0=__hs.P.hp;
 for(;;){__hs.step(150,1/30);const G=__hs.G,P=__hs.P;
  if(bot&&bot!=='std'&&window.__simBot)try{window.__simBot(bot,G,P)}catch(e){o.botF=String(e)}
  if(P.hp<hp0)dmgIn+=hp0-P.hp;hp0=P.hp;const hf=P.hp/Math.max(1,P.st.maxHp||P.hp);if(hf<hpMin)hpMin=hf;
  if(G.stage!==last){o.st.push({s:last,t:Math.round(G.time-tS),lv:P.level,kills:G.kills});tS=G.time;last=G.stage}
  if(G.state==='dead'||G.state==='over'||G.state==='gameover'||P.down&&G.state!=='play'){o.tode++;o.ende='tot';break}
  if(G.state!=='play'&&G.state!=='between'){o.ende=G.state;break}
  if(G.stage>=stufen){o.ende='ziel';break}if(G.time>maxS){o.ende='zeit';break}
  if(performance.now()-echt>40){await new Promise(r=>setTimeout(r,0));echt=performance.now()}}
 const G=__hs.G,P=__hs.P;o.stufe=G.stage;o.zeit=Math.round(G.time);o.lv=P.level;o.kills=G.kills;o.hpMin=+hpMin.toFixed(2);o.schadenRein=Math.round(dmgIn);o.gold=G.goldRun;
 try{const d=fn.dmSum();const R=d&&d.run||{};const sum=Object.values(R).reduce((a,v)=>a+v,0)||1;o.dps=Math.round(sum/Math.max(1,G.time));o.quellen=Object.entries(R).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>[k,Math.round(100*v/sum)])}catch(e){o.dmF=String(e)}
 o.leiste=(P.bar||[]).slice();
}catch(e){o.fehler=String(e&&e.stack||e).slice(0,300)}return JSON.stringify(o)};
'ok'
