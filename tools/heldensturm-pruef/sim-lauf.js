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
// Schnellstart: Held mit passendem Level und Ausrüstung direkt in eine späte Stufe setzen und genau diese Stufe spielen lassen.
// Levelkurve aus einem vollen Bot-Lauf (Normal): Eintritt in Stufe 3 mit Level 10, danach etwa +1 je Stufe, ab Stufe 12 langsamer.
window.__simLv=s=>s<3?[1,6,8][s]:s<=12?10+s:Math.round(22+0.75*(s-12));
window.__simSchnell=async function(held,ast,stufe,diff,bot){const o={tode:0,stufe0:stufe};try{
 try{__hsGLWELT.modus='aus'}catch(e){}
 window.__bb=null;window.__bpick=[];window.__stb='ast:'+ast;
 __hs.start(held,diff||0);__hs.bot(true);const fn=__hs.fn();o.ast=__hs.P.hero.branches[ast];
 const L=__simLv(stufe);let g=0;while(__hs.P.level<L&&g++<400)__hs.xp(40+__hs.P.level*30);
 __hs.step(30,1/30);
 for(let i=0;i<12;i++)try{__hs.drop(i<9?2:3,(i%4-1.5)*36,((i/4|0)-1)*36)}catch(e){o.dropF=String(e)}
 for(let k=0;k<8;k++){__hs.step(90,1/30);await new Promise(r=>setTimeout(r,0))}
 __hs.stage(stufe);__hs.bot(true);const P0=__hs.P;P0.hp=P0.st.maxHp;o.lv=P0.level;o.maxHp=Math.round(P0.st.maxHp);o.dmg=Math.round(P0.st.dmg);
 const t0=__hs.G.time;let echt=performance.now(),hpMin=1,dmgIn=0,hp0=P0.hp,k0=__hs.G.kills;try{const d=fn.dmSum();o.s0=Object.values(d.run||{}).reduce((a,v)=>a+v,0)}catch(e){o.s0=0}
 for(;;){__hs.step(150,1/30);const G=__hs.G,P=__hs.P;if(P.hp<hp0)dmgIn+=hp0-P.hp;hp0=P.hp;const hf=P.hp/Math.max(1,P.st.maxHp);if(hf<hpMin)hpMin=hf;
  if(G.state!=='play'&&G.state!=='between'){o.ende=P.hp<=0||G.state==='end'?'tot':G.state;if(o.ende==='tot')o.tode=1;break}
  if(G.stage!==stufe||G.state==='between'){o.ende='ziel';break}if(G.time-t0>1200){o.ende='zeit';break}
  if(performance.now()-echt>40){await new Promise(r=>setTimeout(r,0));echt=performance.now()}}
 const G=__hs.G,P=__hs.P;o.zeit=Math.round(G.time-t0);o.kills=G.kills-k0;o.hpMin=+hpMin.toFixed(2);o.rein=Math.round(dmgIn/Math.max(1,o.maxHp)*100)/100;o.fort=G.need?+(G.stageKills/G.need).toFixed(2):null;
 try{const d=fn.dmSum();const R=d&&d.stage||{};const sum=Object.values(R).reduce((a,v)=>a+v,0)||1;o.dps=Math.round(sum/Math.max(1,o.zeit));o.quellen=Object.entries(R).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>[k,Math.round(100*v/sum)])}catch(e){o.dmF=String(e)}
}catch(e){o.fehler=String(e&&e.stack||e).slice(0,300)}return JSON.stringify(o)};
'ok'
