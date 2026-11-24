(async()=>{const W8=ms=>new Promise(r=>setTimeout(r,ms));const E=[];window.addEventListener('error',e=>E.push('err '+e.message+' @'+e.lineno));window.addEventListener('unhandledrejection',e=>E.push('rej '+String(e.reason).slice(0,120)));
const ce=console.error;console.error=function(){try{E.push('con '+[...arguments].map(a=>String(a&&a.message||a)).join(' ').slice(0,160))}catch(x){}return ce.apply(this,arguments)};
__hsGLWELT.modus='an';__hs.G.paused=false;const N=__hs.fn().STAGES.length,out=[];
for(let s=0;s<N;s++){const e0=E.length;try{__hs.stage(s);__hs.bot(true)}catch(e){E.push('stage '+s+' '+String(e).slice(0,120))}await W8(3500);
 const r={s,th:__hs.G.themeKey,gl:__hsGLWELT.err.length,fx:__hsGLFX.err.length,dach:__hsDACH.err,ka3:__hs.G.ka&&__hs.G.ka.ka3,neu:E.slice(e0)};if(r.gl||r.fx||r.dach||r.neu.length)out.push(r)}
console.error=ce;return JSON.stringify({stufen:N,auff:out,glErr:__hsGLWELT.err.slice(0,4),fxErr:__hsGLFX.err.slice(0,4),bilder:__hsGLWELT.st&&__hsGLWELT.st.bilder})})()
