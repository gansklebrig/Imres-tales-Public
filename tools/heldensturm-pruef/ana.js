window.__ana=function(T){const G=__hs.G,K=G.ka;if(!K||!K.M)return null;const n=K.n,Z=K.Z,M=K.M,N=n*n;T=T||7;
 const LO=K.lo;const free=i=>M[i]===0&&!(LO&&LO[i]);const dist=new Int16Array(N).fill(-1);const q=new Int32Array(N);let h=0,t=0;
 const W=[];
 const nb=(c,f)=>{const i=c%n,j=(c/n)|0;if(i>0)f(c-1);if(i<n-1)f(c+1);if(j>0)f(c-n);if(j<n-1)f(c+n)};
 const nah=p=>{const i0=Math.floor(p[0]/Z),j0=Math.floor(p[1]/Z);for(let r=0;r<6;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){const a=i0+di,b=j0+dj;if(a<0||b<0||a>=n||b>=n)continue;if(free(b*n+a))return b*n+a}return -1};
 const bfs=s=>{const d=new Int32Array(N).fill(-1);if(s<0)return d;let h=0,t=0;d[s]=0;q[t++]=s;while(h<t){const c=q[h++];nb(c,e=>{if(free(e)&&d[e]<0){d[e]=d[c]+1;q[t++]=e}})}return d};
 let zp=K.kampfP?[K.kampfP.x,K.kampfP.y]:null;if(!zp){let ls=null;for(const S of K.sec)if(S&&S.main)ls=S;if(ls)zp=[ls.cx,ls.cy]}if(!zp)return{th:K.th,err:'kein Ziel'};const cS=nah([K.start.x,K.start.y]),cE=nah(zp);const dS=bfs(cS),dE=bfs(cE);const L=dS[cE];
 for(let c=0;c<N;c++){if(free(c)&&dS[c]>=0&&dE[c]>=0)dist[c]=Math.max(0,(dS[c]+dE[c]-L)>>1)}
 let freeN=0,reach=0,far=0;for(let c=0;c<N;c++){if(free(c)){freeN++;if(dist[c]>=0)reach++;if(dist[c]>T)far++}}
 const comp=new Int32Array(N).fill(-1);const P=[];
 const things=[];try{for(const p of G.props||[])if(p&&isFinite(p.x))things.push([p.x,p.y,'p:'+(p.k||'')])}catch(e){}try{for(const l of G.loot||[])things.push([l.x,l.y,'loot'])}catch(e){}
 try{for(const e of (K.park||[]))things.push([e.x,e.y,'foe'])}catch(e){}try{for(const e of G.enemies||[])things.push([e.x,e.y,'foe'])}catch(e){}
 try{for(const o of (G.np||[]))if(o&&isFinite(o.x))things.push([o.x,o.y,'npc'])}catch(e){}
 for(let s=0;s<N;s++){if(!(free(s)&&dist[s]>T)||comp[s]>=0)continue;const id=P.length;let a=0,mx=0;const st=[s];comp[s]=id;const mouth=new Set();
  while(st.length){const c=st.pop();a++;if(dist[c]>mx)mx=dist[c];nb(c,d=>{if(!free(d))return;if(dist[d]>T){if(comp[d]<0){comp[d]=id;st.push(d)}}else if(dist[d]===T)mouth.add(d)})}
  /* Mündungen: zusammenhängende Gruppen der Randzellen (8er-Nachbarschaft, Lücke bis 2) */
  const ms=[...mouth];const seen=new Set();let mN=0;for(const m of ms){if(seen.has(m))continue;mN++;const s2=[m];seen.add(m);while(s2.length){const c=s2.pop(),ci=c%n,cj=(c/n)|0;for(const m2 of ms){if(seen.has(m2))continue;if(Math.abs(m2%n-ci)<=2&&Math.abs(((m2/n)|0)-cj)<=2){seen.add(m2);s2.push(m2)}}}}
  const sd=K.sid[s],SE=sd!==255?K.sec[sd]:null;P.push({a,depth:(mx-T)*Z,mN,mw:ms.length,id,seite:SE&&SE.seite?1:0})}
 for(const p of P){p.in={}}for(const th of things){const c=Math.floor(th[1]/Z)*n+Math.floor(th[0]/Z);const id=comp[c];if(id>=0){const k=th[2].split(':')[0]==='p'?th[2]:th[2];P[id].in[k]=(P[id].in[k]||0)+1}}
 const big=P.filter(p=>p.a>=6&&p.depth>=200);
 if(window.__anaMal){const S=4,cv=document.createElement('canvas');cv.width=cv.height=n*S;const g=cv.getContext('2d');g.fillStyle='#111';g.fillRect(0,0,n*S,n*S);
  for(let c=0;c<N;c++){const i=c%n,j=(c/n)|0;if(LO&&LO[c]&&!M[c]){g.fillStyle='#246';g.fillRect(i*S,j*S,S,S);continue}if(!free(c))continue;let col='#bbb';const id=comp[c];if(id>=0){const p=P[id];if(p.a>=6&&p.depth>=200)col=p.mN<=1?'#e55':'#5c5';else col='#ddd'}else if(dist[c]<=1)col='#fd6';
   const sd=K.sid[c];if(col==='#bbb'&&sd!==255&&K.sec[sd]&&K.sec[sd].seite)col='#99b';g.fillStyle=col;g.fillRect(i*S,j*S,S,S)}
  g.fillStyle='#0ff';for(const t of K.tore){g.fillRect(t.pa.i*S-2,t.pa.j*S-2,S+4,S+4);g.fillRect(t.pb.i*S-2,t.pb.j*S-2,S+4,S+4)}
  g.fillStyle='#0f0';g.fillRect((cS%n)*S-4,((cS/n)|0)*S-4,12,12);g.fillStyle='#f0f';g.fillRect((cE%n)*S-4,((cE/n)|0)*S-4,12,12);window.__anaUrl=cv.toDataURL('image/png')}const dead=big.filter(p=>p.mN<=1),loop=big.filter(p=>p.mN>1);
 const leer=dead.filter(p=>!Object.keys(p.in).some(k=>k!=='foe'));
 return{th:K.th,lay:K.T&&K.T.lay,freeN,unreach:freeN-reach,farPct:Math.round(100*far/Math.max(1,freeN)),L:L*Z,sec:K.sec.length,main:K.nMain,dead:dead.length,deadEmpty:leer.length,loop:loop.length,
  deadSeite:dead.filter(p=>p.seite).length,sumMain:dead.filter(p=>!p.seite).reduce((s,p)=>s+p.depth,0),tore:K.tore.length,schl:K.tore.filter(t=>t.ka2).length,ka3:K.ka3||0,maxDead:Math.max(0,...dead.map(p=>p.depth)),sumDead:dead.reduce((s,p)=>s+p.depth,0),deadL:dead.map(p=>[p.a,p.depth,Object.keys(p.in).join('+')]).slice(0,8),W:W.length}};
'ok'
