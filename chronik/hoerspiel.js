/* =====================================================================
   HÖRSPIEL – macht aus dem Vorlesen der Chronik ein kleines Hörspiel
   ---------------------------------------------------------------------
   Unter Helmuts Stimme liegt die Geräuschkulisse des Ortes, an dem die
   Geschichte gerade spielt (dieselben Aufnahmen und dieselbe Technik wie
   die Kulissen der Bühne: lange Aufnahmen, aus denen immer neue Ausschnitte
   weich ineinander geblendet werden – keine hörbare Schleife).
   An passenden Stellen erklingen Effekte (Schwerter, Drachen, Türen, Münzen …),
   bei jedem Abschnittswechsel ein kurzes Zwischenspiel und zu Kapitelanfang
   und -ende Barradins Lied – gespielt von einem kleinen Sequenzer aus den
   Instrumenten-Samples der Bühne (klang/).

   Partitur: chronik/hoerspiel-<sprache>.json (erzeugt von chronik/hoerspiel-werkzeug.py).
   Gesteuert von chronik/vorlesen.js über window.ImresHoerspiel.
   Die Stimme bleibt ein gewöhnliches <audio>-Element (läuft auch im Sperrbildschirm
   weiter); das Hörspiel liegt in einem eigenen AudioContext darüber.
   ===================================================================== */
(function () {
  "use strict";
  if (window.ImresHoerspiel) return;
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const zz = (a, b) => a + Math.random() * (b - a);
  const wahl = l => l[Math.floor(Math.random() * l.length)];
  const sk = document.currentScript || document.querySelector('script[src*="chronik/hoerspiel.js"]');
  const SRC = (sk && sk.src) || "";
  const BASIS = SRC ? SRC.replace(/chronik\/hoerspiel\.js.*$/, "") : "";
  const VERSION = (SRC.match(/[?&]v=([^&]+)/) || [])[1] || "1";
  const handy = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") || (window.matchMedia && matchMedia("(pointer: coarse)").matches);
  const SPAR = handy;                     /* Handy: weniger Schichten, kleinerer Puffer-Speicher */
  const MAX_BETTEN = SPAR ? 3 : 4;
  const MAX_AMB_PUFFER = SPAR ? 6 : 14;

  /* ---------- Einstellungen ---------- */
  let an = lies("imres-hoerspiel", "1") !== "0";
  let kulVol = parseFloat(lies("imres-hoerspiel-kulisse", "1")); if (!(kulVol >= 0 && kulVol <= 1.5)) kulVol = 1;
  let musVol = parseFloat(lies("imres-hoerspiel-musik", "1")); if (!(musVol >= 0 && musVol <= 1.5)) musVol = 1;
  const debug = /hoerspiel-debug/.test(location.search + location.hash) || lies("imres-hoerspiel-debug", "") === "1";
  const LOG = [];
  function L(typ, name, mehr) {
    const e = Object.assign({ ms: Math.round(performance.now()), ctx: ctx ? +ctx.currentTime.toFixed(2) : 0, typ, name }, mehr || {});
    LOG.push(e); if (LOG.length > 800) LOG.shift();
    if (debug) try { console.debug("[Hörspiel]", typ, name, mehr || ""); } catch (_) {}
  }

  /* ---------- Partitur ---------- */
  let P = null, pSprache = null, pLaedt = null;
  const spr = () => ((document.documentElement.lang || "de").slice(0, 2) === "en" ? "en" : "de");
  function partitur() {
    const sp = spr();
    if (pSprache === sp && (P || pLaedt)) return pLaedt || Promise.resolve(P);
    pSprache = sp; P = null;
    pLaedt = fetch(BASIS + "chronik/hoerspiel-" + sp + ".json?v=" + VERSION).then(r => r.ok ? r.json() : null).catch(() => null)
      .then(d => { if (pSprache === sp) { P = d; pLaedt = null; L("partitur", d ? "geladen" : "fehlt", { sp }); if (d) { pegelSetzen(); instrumenteVorladen(); } } return P; });
    return pLaedt;
  }
  const absatz = x => P && x ? P.absaetze[x.kap + ":" + x.i] || null : null;
  function abschnitt(x) {
    if (!P || !x) return null;
    const l = P.abschnitte[x.kap] || []; let a = null;
    for (const s of l) if (s.i <= x.i) a = s;
    return a;
  }
  /* Ort zu Beginn des Absatzes bzw. an der Stelle t (Sekunden in der Aufnahme) */
  function ortBei(x, t) {
    if (!x) return null;
    if (x.kap === "vorab") return "erzaehler";
    const a = absatz(x), s = abschnitt(x);
    let ort = (a && a.ort) || (s && s.ort) || null;
    if (a && a.e && t != null) a.e.forEach(e => { if (e.ort && e.t <= t + .15) ort = e.ort; });
    return ort;
  }

  /* ---------- Audio-Graph ---------- */
  let ctx = null, master, comp, atmoBus, duck, fxBus, musBus, hallIn, hallOut;
  const RT2 = Math.SQRT2;
  function graph() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ctx = new AC({ latencyHint: "playback" }); } catch (_) { try { ctx = new AC(); } catch (__) { return false; } }
    master = ctx.createGain(); master.gain.value = 0;
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4; comp.knee.value = 6; comp.attack.value = .005; comp.release.value = .25;
    master.connect(comp); comp.connect(ctx.destination);
    atmoBus = ctx.createGain(); duck = ctx.createGain(); duck.gain.value = 1;
    atmoBus.connect(duck); duck.connect(master);
    fxBus = ctx.createGain(); fxBus.connect(master);
    musBus = ctx.createGain(); musBus.connect(master);
    /* kleiner Hall für Musik und hallende Effekte (synthetische Impulsantwort, 2,2 s) */
    hallIn = ctx.createGain(); hallOut = ctx.createGain();
    try {
      const n = Math.floor(2.2 * ctx.sampleRate), ir = ctx.createBuffer(2, n, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 1.73 * Math.exp(-i / ctx.sampleRate * 3.2); }
      const conv = ctx.createConvolver(); conv.normalize = false; conv.buffer = ir;
      hallIn.connect(conv); conv.connect(hallOut); hallOut.connect(master);
    } catch (_) {}
    pegelSetzen();
    ctx.addEventListener && ctx.addEventListener("statechange", () => L("ctx", ctx.state));
    L("ctx", "erzeugt", { sr: ctx.sampleRate });
    return true;
  }
  function pegelSetzen() {
    if (!ctx || !P) return;
    const pg = P.pegel, j = ctx.currentTime;
    atmoBus.gain.setTargetAtTime(pg.atmo * kulVol, j, .15);
    fxBus.gain.setTargetAtTime(pg.fx * musVol, j, .15);
    musBus.gain.setTargetAtTime(pg.musik * musVol, j, .15);
    hallOut.gain.setTargetAtTime(pg.hall * .08 * musVol, j, .15);
  }
  /* Muss im Klick des Nutzers laufen (Autoplay-Regeln von iOS/Android) */
  function ein() {
    partitur();
    if (!an) return;
    if (!graph()) return;
    if (ctx.state !== "running") { try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (_) {} }
    /* iOS: einmal einen stillen Puffer anstoßen, dann ist der Kontext sicher entsperrt */
    try { const b = ctx.createBuffer(1, 1, 22050), q = ctx.createBufferSource(); q.buffer = b; q.connect(ctx.destination); q.start(0); } catch (_) {}
    master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(1, ctx.currentTime, .25);
    instrumenteVorladen();
  }
  const laeuft = () => !!(an && ctx && ctx.state === "running" && P);
  /* resume() ist asynchron: kurz darauf warten, statt das Hörspiel für diesen Absatz auszulassen */
  function wach() {
    if (!an || !ctx || ctx.state === "running") return Promise.resolve();
    let p; try { p = ctx.resume(); } catch (_) { p = null; }
    return Promise.race([p || Promise.resolve(), new Promise(r => setTimeout(r, 700))]).catch(() => {});
  }

  /* ---------- Proben laden (nur nach Bedarf) ---------- */
  const puffer = new Map(), laedt = new Map(), ambReihe = [];
  const ordner = n => /^(a|e|g|n|l)_/.test(n) ? "amb/" : "klang/";
  function laden(name) {
    if (puffer.has(name)) { if (/^a_/.test(name)) { const i = ambReihe.indexOf(name); if (i >= 0) ambReihe.splice(i, 1); ambReihe.push(name); } return Promise.resolve(puffer.get(name)); }
    if (laedt.has(name)) return laedt.get(name);
    if (!ctx) return Promise.resolve(null);
    const c = ctx;
    const pr = fetch(BASIS + ordner(name) + encodeURIComponent(name) + ".mp3").then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
      .then(ab => new Promise((res, rej) => { const x = c.decodeAudioData(ab, res, rej); if (x && x.catch) x.catch(rej); }))
      .then(b => {
        laedt.delete(name); puffer.set(name, b);
        if (/^a_/.test(name)) { ambReihe.push(name); aufraeumen(); }
        return b;
      }).catch(() => { laedt.delete(name); return null; });
    laedt.set(name, pr); return pr;
  }
  /* lange Aufnahmen (a_*) sind groß: nur die zuletzt gebrauchten behalten */
  function aufraeumen() {
    const inGebrauch = new Set();
    [ort, altOrte].flat().forEach(o => o && o.betten && o.betten.forEach(b => inGebrauch.add(b.name)));
    Object.values(zusaetze).forEach(b => inGebrauch.add(b.name));
    let i = 0;
    while (ambReihe.length > MAX_AMB_PUFFER && i < ambReihe.length) {
      const n = ambReihe[i];
      if (inGebrauch.has(n)) { i++; continue; }
      ambReihe.splice(i, 1); puffer.delete(n);
    }
  }

  /* ---------- Geräuschkulisse ---------- */
  let ort = null, altOrte = [], planUhr = 0;
  const zusaetze = {};
  function bettStarten(o, [name, staerke, opt], j, ziel) {
    opt = opt || {};
    const b = { name, opt, staerke, naechst: 0, buf: null, quellen: [], ziel, aus: false };
    b.out = ctx.createGain(); b.out.gain.value = staerke * ((P.norm && P.norm[name]) || 1);
    let letzt = b.out;
    if (opt.tief) { const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = opt.tief; lp.Q.value = .707; letzt.connect(lp); letzt = lp; }
    if (ctx.createStereoPanner) {
      const pn = ctx.createStereoPanner(); pn.pan.value = Math.sin([0, 125, 235, 60, 180, 300][j % 6] * Math.PI / 180) * .45;
      const k = ctx.createGain(); k.gain.value = RT2; letzt.connect(pn); pn.connect(k); letzt = k;
    }
    letzt.connect(ziel); b.ende = letzt;
    laden(name).then(buf => {
      if (!buf || b.aus || !ctx) return;
      b.buf = buf; b.naechst = ctx.currentTime + .05;
      if (opt.schleife) {
        const q = ctx.createBufferSource(); q.buffer = buf; q.loop = true; if (opt.rate) q.playbackRate.value = opt.rate;
        q.connect(b.out); q.start(ctx.currentTime + .05, Math.random() * buf.duration); b.quellen.push(q);
      }
      bettPlanen(b);
    });
    return b;
  }
  /* immer neue, zufällige Ausschnitte (9–22 s), gleichleistungs-Überblendung (bis 3 s) – keine Nahtstelle */
  const EIN = new Float32Array(64), AUS = new Float32Array(64);
  for (let i = 0; i < 64; i++) { EIN[i] = Math.sin(i / 63 * Math.PI / 2); AUS[i] = Math.cos(i / 63 * Math.PI / 2); }
  function bettPlanen(b) {
    if (!b.buf || b.aus || b.opt.schleife) return;
    const D = b.buf.duration, rate = (b.opt.rate || 1) * zz(.99, 1.01);
    while (b.naechst < ctx.currentTime + 9) {
      const len = Math.min((D - .3) / rate * .85, zz(9, 22)), X = Math.min(3, len * .3), t = Math.max(b.naechst, ctx.currentTime + .02);
      const off = Math.random() * Math.max(0, D - len * rate - .2);
      const q = ctx.createBufferSource(), g = ctx.createGain(); q.buffer = b.buf; q.playbackRate.value = rate;
      g.gain.value = 0; g.gain.setValueCurveAtTime(EIN, t, X); g.gain.setValueCurveAtTime(AUS, t + len - X, X);
      q.connect(g); g.connect(b.out); q.start(t, off); q.stop(t + len + .05);
      b.quellen.push(q); q.onended = () => { const i = b.quellen.indexOf(q); if (i >= 0) b.quellen.splice(i, 1); try { g.disconnect(); } catch (_) {} };
      b.naechst = t + len - X;
    }
  }
  function bettStoppen(b, dauer) {
    if (!b || b.aus) return; b.aus = true;
    const j = ctx.currentTime;
    try { b.out.gain.cancelScheduledValues(j); b.out.gain.setValueAtTime(b.out.gain.value, j); b.out.gain.linearRampToValueAtTime(0, j + dauer); } catch (_) {}
    setTimeout(() => { b.quellen.forEach(q => { try { q.stop(); } catch (_) {} }); b.quellen = []; try { b.ende.disconnect(); } catch (_) {} }, dauer * 1000 + 200);
  }
  function ortSetzen(name, ueber) {
    if (!ctx || !P || !name || !P.orte[name]) return;
    if (ort && ort.name === name) return;
    ueber = ueber == null ? 4 : ueber;
    const j = ctx.currentTime;
    if (ort) {
      const alt = ort; altOrte.push(alt);
      alt.g.gain.cancelScheduledValues(j); alt.g.gain.setValueAtTime(alt.g.gain.value, j); alt.g.gain.linearRampToValueAtTime(0, j + ueber);
      alt.betten.forEach(b => bettStoppen(b, ueber));
      setTimeout(() => { const i = altOrte.indexOf(alt); if (i >= 0) altOrte.splice(i, 1); try { alt.g.disconnect(); } catch (_) {} }, ueber * 1000 + 400);
    }
    const def = P.orte[name];
    const o = { name, g: ctx.createGain(), betten: [], ev: [] };
    o.g.gain.value = 0; o.g.connect(atmoBus);
    o.g.gain.setValueAtTime(0, j); o.g.gain.linearRampToValueAtTime(1, j + ueber);
    o.betten = def.betten.slice(0, MAX_BETTEN).map((b, k) => bettStarten(o, b, k, o.g));
    o.ev = (def.ev || []).map(e => ({ art: e[0], ab: e[1], g: e[2], fern: e[3], naechst: j + zz(e[1][0], e[1][1]) * .5 }));
    ort = o; L("ort", name, { ueber });
    planStarten();
  }
  function ortWeg(dauer) {
    if (!ctx) return;
    if (ort) { const o = ort; ort = null; altOrte.push(o); const j = ctx.currentTime; o.g.gain.cancelScheduledValues(j); o.g.gain.setValueAtTime(o.g.gain.value, j); o.g.gain.linearRampToValueAtTime(0, j + dauer); o.betten.forEach(b => bettStoppen(b, dauer)); setTimeout(() => { const i = altOrte.indexOf(o); if (i >= 0) altOrte.splice(i, 1); }, dauer * 1000 + 400); }
    Object.keys(zusaetze).forEach(k => { bettStoppen(zusaetze[k], dauer); delete zusaetze[k]; });
  }
  function zusatzAn(name, def) {
    if (!ctx || zusaetze[name]) return;
    const g = ctx.createGain(); g.gain.value = 0; g.connect(atmoBus);
    const b = bettStarten(null, def, Object.keys(zusaetze).length + 3, g);
    b.huelle = g; zusaetze[name] = b;
    const j = ctx.currentTime; g.gain.setValueAtTime(0, j); g.gain.linearRampToValueAtTime(1, j + 2.5);
    L("zusatz", name);
  }
  function zusatzAus(name) { const b = zusaetze[name]; if (!b) return; delete zusaetze[name]; bettStoppen(b, 2.5); L("zusatz_aus", name); }

  /* Planer: Betten nachlegen, Ereignisse der Orte (Möwen, Hämmer …) ab und zu einstreuen */
  function planStarten() { if (!planUhr) planUhr = setInterval(planen, 1000); }
  function planen() {
    if (!ctx || ctx.state !== "running") return;
    [ort].concat(Object.values(zusaetze).map(b => ({ betten: [b] }))).forEach(o => o && o.betten.forEach(bettPlanen));
    if (ort && sprichtOderPause && ort.ev.length) {
      const j = ctx.currentTime;
      ort.ev.forEach(e => {
        if (j < e.naechst) return;
        e.naechst = j + zz(e.ab[0], e.ab[1]) * (SPAR ? 1.3 : 1);
        if (Math.abs(j - letzterFx) < 2.5 || j < stilleBis || j < musikBis) return;   /* nicht in gesetzte Effekte oder Stille hineinplappern */
        const fern = Math.random() < (e.fern || 0);
        artSpielen(e.art, j + .05, e.g * (fern ? zz(.4, .6) : zz(.7, 1)), { fern }, atmoBus, null);
      });
    }
    if (!ort && !Object.keys(zusaetze).length && !altOrte.length && planUhr) { clearInterval(planUhr); planUhr = 0; }
  }
  let sprichtOderPause = false, letzterFx = -10, stilleBis = 0, musikBis = 0;

  /* ---------- Effekte ---------- */
  function artSpielen(art, wann, g, o, ziel, sammel) {
    const A = P.arten[art]; if (!A) return;
    o = o || {};
    let n = o.n || (A.folge ? Math.round(zz(A.folge[0], A.folge[1])) : 1), t = wann;
    for (let k = 0; k < n; k++) {
      const name = wahl(A.f), tk = t;
      const buf = puffer.get(name);
      const spielen = b => {
        if (!b || !ctx) return;
        if (tk < ctx.currentTime - .05) return;     /* zu spät geladen: lieber weglassen als hinterherhinken */
        const q = ctx.createBufferSource(); q.buffer = b;
        q.playbackRate.value = o.rate || (A.rate ? zz(A.rate[0], A.rate[1]) : zz(.97, 1.03));
        const gg = ctx.createGain(); gg.gain.value = g * ((P.norm && P.norm[name]) || 1);
        let letzt = gg; q.connect(gg);
        if (o.fern) { const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1400; gg.gain.value *= .75; gg.connect(lp); letzt = lp; }
        if (o.pan && ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = o.pan; const k2 = ctx.createGain(); k2.gain.value = RT2; letzt.connect(pn); pn.connect(k2); letzt = k2; }
        letzt.connect(ziel || fxBus);
        if (o.hall && hallIn) { const h = ctx.createGain(); h.gain.value = o.hall; letzt.connect(h); h.connect(hallIn); }
        const start = Math.max(tk, ctx.currentTime);
        if (A.aus) { /* Ausschnitt aus einer langen Aufnahme (Herzschlag) */
          const d = A.aus[1] - A.aus[0];
          gg.gain.setValueAtTime(0, start); gg.gain.linearRampToValueAtTime(g * ((P.norm && P.norm[name]) || 1), start + .3);
          gg.gain.setValueAtTime(g * ((P.norm && P.norm[name]) || 1), start + d - .8); gg.gain.linearRampToValueAtTime(0, start + d);
          q.start(start, A.aus[0]); q.stop(start + d + .05);
        } else q.start(start);
        if (sammel) sammel.push({ q, t: start });
        q.onended = () => { try { letzt.disconnect(); } catch (_) {} };
      };
      if (buf) spielen(buf); else laden(name).then(spielen);
      t += A.folge ? zz(A.folge[2], A.folge[3]) : .35;
    }
    if (ziel !== atmoBus) letzterFx = wann;
    L("fx", art, { wann: +wann.toFixed(2), g: +g.toFixed(2) });
  }
  function artVorladen(art) { const A = P && P.arten[art]; if (A && ctx) A.f.forEach(laden); }

  /* ---------- Musik: kleiner Sequenzer ---------- */
  function naechsteProbe(liste, m) { let best = liste[0]; for (const s of liste) if (Math.abs(s - m) < Math.abs(best - m)) best = s; return best; }
  function notenNamen(st) {
    const out = new Set();
    st.spuren.forEach(sp => { const ins = P.instrumente[sp.i]; sp.n.forEach(n => [].concat(n[1]).forEach(m => out.add(typeof m === "string" ? m : ins.p + "_" + naechsteProbe(ins.t, m)))); });
    return Array.from(out);
  }
  function instrumenteVorladen() {
    if (!P || !ctx || instrumenteVorladen.los) return; instrumenteVorladen.los = true;
    /* zuerst Barradins Lied, dann die Zwischenspiele */
    const reihe = ["thema", "heiter", "spannung", "duester", "geheimnis", "warm", "triumph", "kampf", "drache", "cliff", "traurig", "lied", "ballade", "klage", "floete", "licht"];
    reihe.reduce((p, n) => p.then(() => P.musik[n] ? Promise.all(notenNamen(P.musik[n]).map(laden)) : null), Promise.resolve());
  }
  function stueckBereit(name) {
    const st = P && P.musik[name]; if (!st || !ctx) return Promise.resolve(false);
    return Promise.all(notenNamen(st).map(laden)).then(l => l.every(Boolean));
  }
  function stueckSpielen(name, wann, g, sammel) {
    const st = P.musik[name]; if (!st) return 0;
    const spb = 60 / st.bpm, ges = (st.g || 1) * g;
    const hall = ctx.createGain(); hall.gain.value = .6; hall.connect(hallIn || musBus);
    st.spuren.forEach(sp => {
      const ins = P.instrumente[sp.i];
      const spur = ctx.createGain(); spur.gain.value = sp.g * ges;
      let ziel = spur;
      if (ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = sp.pan || 0; const k = ctx.createGain(); k.gain.value = RT2; spur.connect(pn); pn.connect(k); k.connect(musBus); k.connect(hall); }
      else { spur.connect(musBus); spur.connect(hall); }
      sp.n.forEach(n => {
        const opt = n[4] || {};
        [].concat(n[1]).forEach(m => {
          let name2, rate = 1;
          if (typeof m === "string") name2 = m;
          else { const s = naechsteProbe(ins.t, m); name2 = ins.p + "_" + s; rate = Math.pow(2, (m - s) / 12); }
          const b = puffer.get(name2); if (!b) return;
          const t = wann + n[0] * spb + (opt.strum || 0), halt = n[2] * spb;
          const ende = Math.min(b.duration / rate, halt + ins.aus), v = n[3];
          const q = ctx.createBufferSource(), e = ctx.createGain(); q.buffer = b; q.playbackRate.value = rate;
          e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(v, t + .004);
          e.gain.setValueAtTime(v, t + Math.min(halt, ende)); e.gain.linearRampToValueAtTime(0, t + ende);
          q.connect(e); e.connect(ziel); q.start(t); q.stop(t + ende + .02);
          q.onended = () => { try { e.disconnect(); } catch (_) {} };
          if (sammel) sammel.push({ q, t });
        });
      });
    });
    musikBis = Math.max(musikBis, wann + st.ende);
    L("musik", name, { wann: +wann.toFixed(2), dauer: st.ende });
    return st.ende;
  }

  /* ---------- Mischung: Stimme vorn, Kulisse duckt ---------- */
  function duckAuf(wert, zeit, tau) { if (!ctx) return; const j = Math.max(zeit, ctx.currentTime); duck.gain.setTargetAtTime(wert, j, tau || .3); }

  /* ---------- Ablauf je Absatz ---------- */
  let akt = null;          /* { x, audio, quellen: [], uhren: [] } */
  let musikQuellen = [];
  function quellenStoppen(liste, abJetzt) {
    const j = ctx ? ctx.currentTime : 0;
    liste.forEach(s => { if (!abJetzt || s.t > j - .01) try { s.q.stop(); } catch (_) {} });
  }
  function absatzAufraeumen() {
    if (!akt) return;
    quellenStoppen(akt.quellen, true); akt.quellen = [];
    akt.uhren.forEach(clearTimeout); akt.uhren = [];
  }
  function spaeter(wann, f) { const ms = Math.max(0, (wann - ctx.currentTime) * 1000); const u = setTimeout(f, ms); if (akt) akt.uhren.push(u); return u; }
  /* Stimme spielt (Start, Weiter nach Pause, Tempo- oder Positionswechsel): alles ab der aktuellen Stelle neu planen */
  function sprache(x, audio, nochmal) {
    if (!laeuft() || !x || !audio) {
      akt = { x, audio, quellen: [], uhren: [] };
      if (!nochmal && an && ctx && P && x && audio) wach().then(() => { if (laeuft() && akt && akt.x === x && !audio.paused) sprache(x, audio, true); });
      return;
    }
    absatzAufraeumen();
    akt = { x, audio, quellen: [], uhren: [] };
    weiter();
    const a = absatz(x), ct = audio.currentTime || 0, rate = audio.playbackRate || 1, T0 = ctx.currentTime;
    const d = a ? a.d : (audio.duration || 0);
    ortSetzen(ortBei(x, ct), ct > .5 ? 2 : 3);
    sprichtOderPause = true;
    const pg = P.pegel;
    duck.gain.cancelScheduledValues(T0); duck.gain.setTargetAtTime(pg.atmoSprache, T0, .12);
    if (!a) return;
    /* in längeren Sprechpausen atmet die Kulisse kurz auf */
    (a.p || []).forEach(([ps, pe]) => {
      if (pe - ps < 1 || ps < ct) return;
      const s = T0 + (ps - ct) / rate, e = T0 + (pe - ct) / rate;
      duck.gain.setTargetAtTime(.7, s + .1, .15); duck.gain.setTargetAtTime(pg.atmoSprache, e - .3, .08);
    });
    (a.e || []).forEach(e => {
      if (e.t < ct - .05 || e.t > d - .02) return;
      const wann = T0 + (e.t - ct) / rate;
      if (e.fx) artSpielen(e.fx, wann, e.g, e, fxBus, akt.quellen);
      else if (e.stueck) { const ende = e.t >= d - .3; stueckSpielen(e.stueck, wann, e.g * (ende ? 1 : .6), akt.quellen); }
      else if (e.ort || e.zusatz || e.zusatz_aus) {
        if (e.t <= ct + .15) return;      /* gleich am Anfang: erledigen ortBei() und zusaetzeAbgleichen() */
        if (e.ort) spaeter(wann, () => ortSetzen(e.ort, 3));
        else if (e.zusatz) spaeter(wann, () => zusatzAn(e.zusatz, e.bett));
        else spaeter(wann, () => zusatzAus(e.zusatz_aus));
      }
      else if (e.stille) {
        duck.gain.setTargetAtTime(.08, wann, .3); stilleBis = wann + e.stille / rate;
        duck.gain.setTargetAtTime(pg.atmoSprache, wann + e.stille / rate, .8);
      }
    });
    zusaetzeAbgleichen(x, ct);
    vorladen(x);
    L("absatz", x.kap + ":" + x.i, { ab: +ct.toFixed(2), rate, ort: ort && ort.name });
  }
  /* welche Zusatz-Schichten (Summen der Chasme, Kampflärm …) an dieser Stelle laufen sollten – auch nach Sprüngen */
  function zusaetzeAbgleichen(x, ct) {
    const s = abschnitt(x), soll = {};
    if (s) {
      const idx = Object.keys(P.absaetze).filter(k => k.split(":")[0] === x.kap).map(k => +k.split(":")[1]).filter(i => i >= s.i && i <= x.i).sort((a, b) => a - b);
      idx.forEach(i => (P.absaetze[x.kap + ":" + i].e || []).forEach(e => {
        if (i === x.i && e.t > ct + .15) return;
        if (e.zusatz) soll[e.zusatz] = e.bett; else if (e.zusatz_aus) delete soll[e.zusatz_aus];
      }));
    }
    Object.keys(zusaetze).forEach(n => { if (!soll[n]) zusatzAus(n); });
    Object.keys(soll).forEach(n => zusatzAn(n, soll[n]));
  }
  function vorladen(x) {
    if (!P || !ctx) return;
    const a = absatz(x); if (a && a.e) a.e.forEach(e => e.fx && artVorladen(e.fx));
    if (vorladen.naechster) { const n = vorladen.naechster; const an2 = absatz(n); if (an2 && an2.e) an2.e.forEach(e => e.fx && artVorladen(e.fx)); const o = ortBei(n, 0); if (o && P.orte[o]) P.orte[o].betten.slice(0, MAX_BETTEN).forEach(b => laden(b[0])); }
  }
  function pause() {
    if (!ctx) return;
    absatzAufraeumen(); quellenStoppen(musikQuellen, false); musikQuellen = [];
    sprichtOderPause = false;
    master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, .12);
    clearTimeout(pause.uhr);
    pause.uhr = setTimeout(() => { if (ctx && master.gain.value < .05 && !sprichtOderPause) { try { ctx.suspend(); } catch (_) {} } }, 900);
    L("pause", "");
  }
  function weiter() {
    if (!an || !ctx) return;
    clearTimeout(pause.uhr);
    if (ctx.state !== "running") try { ctx.resume(); } catch (_) {}
    master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(1, ctx.currentTime, .2);
  }
  /* Im Sperrbildschirm des Handys (oder wenn der Kontext schläft) läuft die Stimme ohne Wartezeiten weiter:
     iOS hält Seiten ohne laufendes <audio> an, dann käme der nächste Absatz nie. */
  function direkt() { return !an || !P || !ctx || ctx.state !== "running" || (SPAR && document.hidden); }
  /* Absatz zu Ende: Kulisse atmet auf, Effekte „ende“ erklingen; liefert die Wartezeit bis zum nächsten Absatz (ms) */
  function absatzEnde(x) {
    if (!laeuft()) return 0;
    const a = absatz(x), j = ctx.currentTime;
    duckAuf(P.pegel.atmoPause, j + .05, .35);
    let warte = .2;   /* Grundpause steckt jetzt in den Aufnahmen (tools/vertonung/pausen.py) */
    if (a && a.e) a.e.forEach(e => {
      if (e.t <= a.d - .02) return;
      const wann = j + Math.max(0, e.t - a.d);
      if (e.fx) artSpielen(e.fx, wann, e.g, e, fxBus, musikQuellen);
      if (e.stueck) { const d = stueckSpielen(e.stueck, wann, e.g, musikQuellen); warte = Math.max(warte, Math.min(d, e.warte || d) - .3); }
      if (e.warte) warte = Math.max(warte, e.warte);
    });
    L("ende", x.kap + ":" + x.i, { warte });
    return SPAR && document.hidden ? 0 : Math.round(warte * 1000);
  }
  /* Vor einem Absatz: Ortswechsel und Zwischenspiel. info: { art: start|weiter|sprung, kapStart, kapEnde (vorheriger Absatz war der letzte seines Kapitels), naechster } → Promise<ms> */
  function uebergang(vor, x, info) {
    info = info || {};
    vorladen.naechster = info.naechster || null;
    if (!an) return Promise.resolve(0);
    if (info.art !== "weiter" && ctx) { absatzAufraeumen(); quellenStoppen(musikQuellen, false); musikQuellen = []; musikBis = 0; }
    return partitur().then(wach).then(() => {
      if (!laeuft()) return 0;
      const ziel = ortBei(x, 0), j0 = ctx.currentTime + .08;
      sprichtOderPause = true;
      duckAuf(P.pegel.atmoPause, j0, .3);
      if (info.art === "sprung" || !x) { ortSetzen(ziel, 2.5); return 0; }
      const folge = [];
      const s = abschnitt(x);
      if (vor && vor.kap !== x.kap && info.art === "weiter" && vor.kap !== "vorab") folge.push({ n: "cliff", pause: .9 });
      if (info.kapStart && x.kap !== "vorab") folge.push({ n: "thema", ort: true });
      else if (x.kap === "vorab") folge.push({ n: "warm", ort: true });
      else if (x.titel && s) folge.push({ n: s.stimmung, ort: true, vor: .3 });
      if (!folge.length) { ortSetzen(ziel, 3.5); return 0; }
      if (!folge.some(f => f.ort)) ortSetzen(ziel, 3.5);
      /* höchstens 2,5 s auf die Instrumente warten – sonst ohne Musik weiter */
      const bereit = Promise.all(folge.map(f => stueckBereit(f.n))).then(l => l.every(Boolean));
      const frist = new Promise(r => setTimeout(() => r(false), 2500));
      return Promise.race([bereit, frist]).then(ok => {
        if (!laeuft()) return 0;
        if (!ok) { ortSetzen(ziel, 3.5); L("musik", "nicht bereit"); return 0; }
        let t = ctx.currentTime + .08, ms = 0;
        folge.forEach(f => {
          const st = P.musik[f.n]; if (!st) return;
          t += f.vor || 0;
          if (f.ort) { if (t - ctx.currentTime < .2) ortSetzen(ziel, 3.5); else setTimeout(() => ortSetzen(ziel, 3.5), (t - ctx.currentTime) * 1000); }
          stueckSpielen(f.n, t, 1, musikQuellen);
          duck.gain.setTargetAtTime(.75, t, .4);
          const nachher = t + st.ende - (f.n === "cliff" ? 0 : st.ueber);
          t = nachher + (f.pause || 0);
        });
        ms = Math.max(0, (t - ctx.currentTime) * 1000);
        return Math.round(ms);
      });
    });
  }
  /* letzter Absatz der Liste: Cliffhanger, dann Ruhe */
  function kapitelEnde() {
    return wach().then(() => laeuft() ? stueckBereit("cliff") : false).then(ok => {
      if (!ok || !laeuft()) return 0;
      const t = ctx.currentTime + .4, d = stueckSpielen("cliff", t, 1, musikQuellen);
      setTimeout(() => { if (ctx) ortWeg(4); }, (d - 2) * 1000);
      return Math.round((d + .6) * 1000);
    });
  }
  function stopp() {
    vorladen.naechster = null;
    if (!ctx) return;
    absatzAufraeumen(); akt = null;
    sprichtOderPause = false;
    const j = ctx.currentTime;
    master.gain.cancelScheduledValues(j); master.gain.setTargetAtTime(0, j, .2);
    setTimeout(() => { quellenStoppen(musikQuellen, false); musikQuellen = []; ortWeg(.05); }, 900);
    clearTimeout(pause.uhr);
    pause.uhr = setTimeout(() => { if (ctx && !sprichtOderPause) try { ctx.suspend(); } catch (_) {} }, 1500);
    L("stopp", "");
  }
  function setAn(v) {
    an = !!v; schreib("imres-hoerspiel", an ? "1" : "0"); L("schalter", an ? "an" : "aus");
    if (!an) { if (ctx) { const j = ctx.currentTime; master.gain.cancelScheduledValues(j); master.gain.setTargetAtTime(0, j, .25); setTimeout(() => { if (!an) { absatzAufraeumen(); quellenStoppen(musikQuellen, false); musikQuellen = []; ortWeg(.05); try { ctx.suspend(); } catch (_) {} } }, 1200); } return; }
    ein();
    if (akt && akt.audio && !akt.audio.paused) partitur().then(wach).then(() => { if (akt && akt.audio && !akt.audio.paused) sprache(akt.x, akt.audio); });
  }

  window.ImresHoerspiel = {
    verfuegbar: () => spr() === "de",
    an: () => an, setAn,
    kulisse: v => { if (v == null) return kulVol; kulVol = Math.max(0, Math.min(1.5, +v || 0)); schreib("imres-hoerspiel-kulisse", String(kulVol)); pegelSetzen(); },
    musik: v => { if (v == null) return musVol; musVol = Math.max(0, Math.min(1.5, +v || 0)); schreib("imres-hoerspiel-musik", String(musVol)); pegelSetzen(); },
    vorbereiten: partitur, ein, uebergang, direkt, ortNur: x => { if (laeuft()) ortSetzen(ortBei(x, 0), 3); }, sprache, pause, weiter, absatzEnde, kapitelEnde, stopp,
    zustand: () => ({ an, ctx: ctx ? ctx.state : "keiner", ort: ort && ort.name, zusaetze: Object.keys(zusaetze), puffer: puffer.size, partitur: !!P }),
    log: LOG
  };
})();
