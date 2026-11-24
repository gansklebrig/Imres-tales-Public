(async()=>{if(!__hs.G||!__hs.P)__hs.start('barradin',0);const t0=performance.now();const R=[];const N=__hs.fn().STAGES.length;for(let s=0;s<N;s++){for(let k=0;k<REP;k++){try{__hs.stage(s);__hs.G.paused=true;const a=__ana(7);a.s=s;R.push(a)}catch(e){R.push({s,err:String(e).slice(0,80)})}}}
window.__R=R;return JSON.stringify({ms:Math.round(performance.now()-t0),n:R.length,ex:R[0]})})()
