/* =====================================================================
   BARRADINS LAUTENWERK – eine kleine mittelalterliche Beat-Maschine
   ---------------------------------------------------------------------
   Vier Spuren mit je 16 Schritten:
     Klopfen   Barradin klopft auf den Lautenkorpus (Beat)
     Schellen  der Schellenring an seinem Stiefel
     Bass      tiefe Töne, mit dem Daumen gezupft
     Melodie   die Lautenmelodie
   Dazu: Tempo, Tonart (transponieren), Kirchentonart, Tanzschritt (Swing)
   und ein Bordun (Halteton wie bei einer Drehleier).
   Lieder werden im Browser gemerkt und lassen sich als Link teilen.
   ===================================================================== */
(function () {
  "use strict";
  const root = document.getElementById("lautenwerk");
  if (!root) return;

  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const SCHRITTE = 16;

  /* ---------- Texte ---------- */
  const TX = {
    de: {
      label: "Spielmannskunst", titel: "Barradins Lautenwerk",
      text: "Barradin spielt, du bestimmst wie. Tippe in die Raster: Wann er auf die Laute klopft, wann die Schellen am Stiefel klingeln, was der Daumen im Bass zupft und welche Melodie er spielt.",
      spielen: "▶ Spielen", stopp: "■ Anhalten", tempo: "Tempo", tonart: "Tonart", modus: "Tonleiter",
      swing: "Tanzschritt", bordun: "Bordun", an: "an", aus: "aus",
      spuren: { klopf: "Klopfen", schelle: "Schellen", bass: "Bass", melodie: "Melodie" },
      spurInfo: { klopf: "auf den Korpus", schelle: "am Stiefel", bass: "mit dem Daumen", melodie: "auf der Laute" },
      vorlagen: "Vorlagen", zufall: "🎲 Improvisieren", leeren: "Leeren",
      teilen: "🔗 Lied teilen", kopiert: "Link kopiert – schick ihn an die Gruppe!", geteilt: "Geteilt!",
      geladen: "Ein geteiltes Lied wurde geladen.",
      modi: { dorisch: "Dorisch", mixolydisch: "Mixolydisch", aeolisch: "Äolisch", phrygisch: "Phrygisch" },
      lieder: { taverne: "Tavernentanz", saltarello: "Saltarello", trauer: "Trauerlied", schlacht: "Schlachtruf", wiegen: "Wiegenlied" },
      noten: ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B", "H"],
      wischen: "← wischen →"
    },
    en: {
      label: "Minstrelsy", titel: "Barradin's Lute Machine",
      text: "Barradin plays, you decide how. Tap the grids: when he knocks on the lute, when the bells on his boot jingle, what his thumb plucks in the bass and which melody he plays.",
      spielen: "▶ Play", stopp: "■ Stop", tempo: "Tempo", tonart: "Key", modus: "Mode",
      swing: "Dance step", bordun: "Drone", an: "on", aus: "off",
      spuren: { klopf: "Knock", schelle: "Bells", bass: "Bass", melodie: "Melody" },
      spurInfo: { klopf: "on the body", schelle: "on the boot", bass: "with the thumb", melodie: "on the lute" },
      vorlagen: "Presets", zufall: "🎲 Improvise", leeren: "Clear",
      teilen: "🔗 Share song", kopiert: "Link copied – send it to the party!", geteilt: "Shared!",
      geladen: "A shared song has been loaded.",
      modi: { dorisch: "Dorian", mixolydisch: "Mixolydian", aeolisch: "Aeolian", phrygisch: "Phrygian" },
      lieder: { taverne: "Tavern dance", saltarello: "Saltarello", trauer: "Lament", schlacht: "Battle cry", wiegen: "Lullaby" },
      noten: ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
      wischen: "← swipe →"
    }
  };
  const t = () => TX[sprache()];

  /* ---------- Musik ---------- */
  const MODI = {
    dorisch: [0, 2, 3, 5, 7, 9, 10, 12],
    mixolydisch: [0, 2, 4, 5, 7, 9, 10, 12],
    aeolisch: [0, 2, 3, 5, 7, 8, 10, 12],
    phrygisch: [0, 1, 3, 5, 7, 8, 10, 12]
  };
  const MODUS_LISTE = Object.keys(MODI);
  const BASS_STUFEN = [0, 2, 3, 4, 6]; /* Grundton, Terz, Quarte, Quinte, Septime */
  const MEL_GRUND = 62, BASS_GRUND = 50; /* D4 und D3 */
  const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
  const melMidi = (stufe, s) => MEL_GRUND + s.transpose + MODI[s.modus][stufe];
  const bassMidi = (zeile, s) => BASS_GRUND + s.transpose + MODI[s.modus][BASS_STUFEN[zeile]];
  const notenName = m => t().noten[((m % 12) + 12) % 12];

  /* ---------- Vorlagen ---------- */
  const leer = () => Array(SCHRITTE).fill(-1);
  const an = (liste) => { const a = Array(SCHRITTE).fill(0); liste.forEach(i => a[i] = 1); return a; };
  const folge = (paare) => { const a = leer(); Object.keys(paare).forEach(i => a[+i] = paare[i]); return a; };
  const VORLAGEN = {
    taverne: { tempo: 112, transpose: 0, modus: "dorisch", swing: 0, bordun: 1,
      klopf: an([0, 4, 8, 12, 14]), schelle: an([2, 6, 10, 15]),
      bass: folge({ 0: 0, 4: 3, 8: 0, 12: 3, 14: 2 }),
      melodie: folge({ 0: 4, 2: 5, 3: 4, 4: 3, 6: 2, 7: 3, 8: 4, 10: 7, 11: 6, 12: 4, 13: 3, 14: 1, 15: 0 }) },
    saltarello: { tempo: 126, transpose: 0, modus: "mixolydisch", swing: 0, bordun: 1,
      klopf: an([0, 3, 6, 8, 11, 14]), schelle: an([2, 5, 10, 13]),
      bass: folge({ 0: 0, 6: 3, 8: 0, 14: 3 }),
      melodie: folge({ 0: 0, 1: 2, 2: 4, 3: 5, 4: 4, 5: 2, 6: 3, 7: 1, 8: 0, 9: 2, 10: 4, 11: 7, 12: 6, 13: 4, 14: 5, 15: 4 }) },
    trauer: { tempo: 70, transpose: -2, modus: "aeolisch", swing: 0, bordun: 1,
      klopf: an([0, 8]), schelle: an([]),
      bass: folge({ 0: 0, 8: 2, 12: 3 }),
      melodie: folge({ 0: 4, 3: 3, 4: 2, 6: 1, 8: 2, 11: 1, 12: 0 }) },
    schlacht: { tempo: 138, transpose: 2, modus: "phrygisch", swing: 0, bordun: 1,
      klopf: an([0, 3, 6, 8, 10, 11, 14]), schelle: an([0, 2, 4, 6, 8, 10, 12, 14]),
      bass: folge({ 0: 0, 3: 0, 6: 0, 8: 0, 11: 0, 14: 1 }),
      melodie: folge({ 0: 0, 1: 1, 2: 0, 4: 4, 6: 3, 7: 1, 8: 0, 10: 5, 12: 4, 14: 1, 15: 0 }) },
    wiegen: { tempo: 84, transpose: 0, modus: "mixolydisch", swing: 1, bordun: 0,
      klopf: an([0, 8]), schelle: an([12]),
      bass: folge({ 0: 0, 4: 3, 8: 0, 12: 3 }),
      melodie: folge({ 0: 4, 2: 4, 4: 5, 6: 4, 8: 2, 10: 3, 12: 1, 14: 0 }) }
  };
  const kopie = o => JSON.parse(JSON.stringify(o));

  /* ---------- Zustand (gemerkt im Browser) ---------- */
  let S = kopie(VORLAGEN.taverne);
  try { const g = JSON.parse(localStorage.getItem("imres-lautenwerk") || "null"); if (g && g.klopf) S = Object.assign(S, g); } catch (_) {}
  const merken = () => { try { localStorage.setItem("imres-lautenwerk", JSON.stringify(S)); } catch (_) {} };

  /* Lied als kurzer Code für den Link */
  const hex = a => { let n = 0; a.forEach((v, i) => { if (v) n |= 1 << i; }); return n.toString(16).padStart(4, "0"); };
  const unhex = h => { const n = parseInt(h, 16) || 0; return Array.from({ length: SCHRITTE }, (_, i) => (n >> i) & 1); };
  const kodieren = () => [S.tempo, S.transpose, MODUS_LISTE.indexOf(S.modus), S.swing, S.bordun, hex(S.klopf), hex(S.schelle),
    S.bass.map(v => v < 0 ? "." : v).join(""), S.melodie.map(v => v < 0 ? "." : v).join("")].join("-");
  function dekodieren(code) {
    const p = String(code).split("-");
    if (p.length !== 9 || p[7].length !== SCHRITTE || p[8].length !== SCHRITTE) return null;
    const zahl = (x, min, max, d) => { const n = parseInt(x, 10); return isNaN(n) ? d : Math.max(min, Math.min(max, n)); };
    const zeichen = (str, max) => str.split("").map(c => { const n = parseInt(c, 10); return isNaN(n) || n > max ? -1 : n; });
    return {
      tempo: zahl(p[0], 50, 180, 110), transpose: zahl(p[1], -5, 6, 0), modus: MODUS_LISTE[zahl(p[2], 0, 3, 0)],
      swing: zahl(p[3], 0, 1, 0), bordun: zahl(p[4], 0, 1, 1), klopf: unhex(p[5]), schelle: unhex(p[6]),
      bass: zeichen(p[7], 4), melodie: zeichen(p[8], 7)
    };
  }
  let ausLink = false;
  try {
    const code = new URLSearchParams(location.search).get("lied");
    const d = code && dekodieren(code);
    if (d) { S = d; ausLink = true; }
  } catch (_) {}

  /* ---------- Klang ---------- */
  let ctx = null, master = null, rauschen = null;
  const saitenCache = new Map();
  function audioStart() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const komp = ctx.createDynamicsCompressor();
      komp.threshold.value = -14; komp.ratio.value = 4;
      master = ctx.createGain(); master.gain.value = .8;
      master.connect(komp); komp.connect(ctx.destination);
      const n = ctx.sampleRate;
      rauschen = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = rauschen.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
  }
  function saite(freq, art) {
    const key = art + freq.toFixed(2);
    if (saitenCache.has(key)) return saitenCache.get(key);
    const sr = ctx.sampleRate, dauer = art === "bass" ? 1.8 : 1.4, n = Math.round(sr * dauer);
    const buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    const p = Math.max(2, Math.round(sr / freq)), ring = new Float32Array(p);
    for (let j = 0; j < p; j++) ring[j] = Math.random() * 2 - 1;
    const daempf = art === "bass" ? .4985 : .4975;
    let idx = 0;
    for (let j = 0; j < n; j++) {
      const a = ring[idx], b = ring[(idx + 1) % p];
      d[j] = a;
      ring[idx] = (a + b) * daempf;
      idx = (idx + 1) % p;
    }
    saitenCache.set(key, buf);
    return buf;
  }
  function zupf(freq, zeit, art, laut) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = saite(freq, art);
    f.type = "lowpass"; f.frequency.value = art === "bass" ? 1100 : 3400; f.Q.value = .7;
    g.gain.value = (laut || 1) * (art === "bass" ? .9 : .55);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(zeit);
  }
  function klopfen(zeit, betont) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(betont ? 170 : 150, zeit);
    o.frequency.exponentialRampToValueAtTime(65, zeit + .08);
    g.gain.setValueAtTime(betont ? 1 : .7, zeit);
    g.gain.exponentialRampToValueAtTime(.001, zeit + .16);
    o.connect(g); g.connect(master); o.start(zeit); o.stop(zeit + .2);
    const r = ctx.createBufferSource(), b = ctx.createBiquadFilter(), rg = ctx.createGain();
    r.buffer = rauschen; b.type = "bandpass"; b.frequency.value = 1300; b.Q.value = 1.5;
    rg.gain.setValueAtTime(betont ? .35 : .22, zeit); rg.gain.exponentialRampToValueAtTime(.001, zeit + .035);
    r.connect(b); b.connect(rg); rg.connect(master); r.start(zeit, Math.random() * .5, .05);
  }
  function schellen(zeit) {
    const r = ctx.createBufferSource(), h = ctx.createBiquadFilter(), g = ctx.createGain();
    r.buffer = rauschen; h.type = "highpass"; h.frequency.value = 6500;
    g.gain.setValueAtTime(.32, zeit); g.gain.exponentialRampToValueAtTime(.001, zeit + .2);
    r.connect(h); h.connect(g); g.connect(master); r.start(zeit, Math.random() * .5, .22);
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator(), og = ctx.createGain(), z = zeit + i * .012;
      o.type = "sine"; o.frequency.value = 4200 + Math.random() * 3200;
      og.gain.setValueAtTime(.05, z); og.gain.exponentialRampToValueAtTime(.0005, z + .09);
      o.connect(og); og.connect(master); o.start(z); o.stop(z + .1);
    }
  }
  let bordunTeile = null;
  function bordunAn() {
    if (!ctx || bordunTeile || !S.bordun) return;
    const f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "lowpass"; f.frequency.value = 650; f.Q.value = .5;
    g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(.05, ctx.currentTime + .8);
    const oscs = [0, 7].map(iv => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.connect(f); o.start(); return o; });
    f.connect(g); g.connect(master);
    bordunTeile = { oscs, g };
    bordunStimmen();
  }
  function bordunStimmen() {
    if (!bordunTeile) return;
    [0, 7].forEach((iv, i) => bordunTeile.oscs[i].frequency.setTargetAtTime(midiHz(BASS_GRUND - 12 + S.transpose + iv), ctx.currentTime, .05));
  }
  function bordunAus() {
    if (!bordunTeile) return;
    const { oscs, g } = bordunTeile, jetzt = ctx.currentTime;
    g.gain.cancelScheduledValues(jetzt); g.gain.setValueAtTime(g.gain.value, jetzt); g.gain.linearRampToValueAtTime(0, jetzt + .4);
    oscs.forEach(o => o.stop(jetzt + .45));
    bordunTeile = null;
  }

  /* ---------- Taktgeber ---------- */
  let laeuft = false, schritt = 0, naechste = 0, timer = null;
  const anzeige = [];
  const schrittDauer = () => 60 / S.tempo / 4;
  function planen() {
    while (naechste < ctx.currentTime + .12) {
      const versatz = S.swing && schritt % 2 === 1 ? schrittDauer() * .33 : 0, z = naechste + versatz;
      const ev = { schritt, zeit: z, klopf: 0, schelle: 0, bass: 0, mel: 0 };
      if (S.klopf[schritt]) { klopfen(z, schritt % 4 === 0); ev.klopf = 1; }
      if (S.schelle[schritt]) { schellen(z); ev.schelle = 1; }
      if (S.bass[schritt] >= 0) { zupf(midiHz(bassMidi(S.bass[schritt], S)), z, "bass"); ev.bass = 1; }
      if (S.melodie[schritt] >= 0) { zupf(midiHz(melMidi(S.melodie[schritt], S)), z, "mel"); ev.mel = 1; }
      anzeige.push(ev);
      naechste += schrittDauer();
      schritt = (schritt + 1) % SCHRITTE;
    }
  }
  function start() {
    audioStart();
    laeuft = true; schritt = 0; naechste = ctx.currentTime + .06; anzeige.length = 0;
    planen(); timer = setInterval(planen, 25);
    bordunAn();
    requestAnimationFrame(malen);
    knoepfe();
  }
  function stopp() {
    laeuft = false; clearInterval(timer); bordunAus();
    spalte(-1); knoepfe();
  }

  /* ---------- Anzeige im Takt ---------- */
  let spalten = [], aktiv = -1;
  function spalte(i) {
    if (aktiv >= 0 && spalten[aktiv]) spalten[aktiv].forEach(z => z.classList.remove("jetzt"));
    aktiv = i;
    if (i >= 0 && spalten[i]) spalten[i].forEach(z => z.classList.add("jetzt"));
  }
  const buehne = () => root.querySelector(".lw-buehne");
  function zucken(klasse) {
    const b = buehne(); if (!b || ruhig) return;
    b.classList.remove(klasse); void b.offsetWidth; b.classList.add(klasse);
  }
  function note(zeichen, bass) {
    const b = buehne(); if (!b || ruhig) return;
    const n = document.createElement("span");
    n.className = "lw-note" + (bass ? " tief" : "");
    n.textContent = zeichen;
    n.style.left = (bass ? 52 : 62) + Math.random() * 14 + "%";
    n.style.setProperty("--dx", (Math.random() * 40 - 10) + "px");
    b.appendChild(n);
    setTimeout(() => n.remove(), 1600);
  }
  function malen() {
    if (!laeuft) return;
    const jetzt = ctx.currentTime;
    while (anzeige.length && anzeige[0].zeit <= jetzt) {
      const ev = anzeige.shift();
      spalte(ev.schritt);
      if (ev.klopf) zucken("klopf");
      if (ev.schelle) zucken("schelle");
      if (ev.bass) { zucken("bass"); if (Math.random() < .5) note("♩", true); }
      if (ev.mel) { zucken("mel"); note(Math.random() < .5 ? "♪" : "♫"); }
    }
    requestAnimationFrame(malen);
  }

  /* ---------- Barradin ---------- */
  const BARRADIN = `
<svg class="lw-figur" viewBox="0 0 280 200" aria-hidden="true">
  <ellipse cx="125" cy="192" rx="80" ry="6" fill="rgba(0,0,0,.45)"/>
  <!-- Fass -->
  <g class="fass"><path d="M78 150 Q74 172 80 194 L132 194 Q138 172 134 150 Z" fill="#3a2a1c" stroke="#8a6a44" stroke-width="2"/>
    <path d="M77 162 H135 M77 182 H135" stroke="#6b5130" stroke-width="3"/></g>
  <!-- Beine -->
  <path d="M104 150 Q130 146 150 152 L156 186" fill="none" stroke="#2a2230" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
  <g class="fuss"><path d="M126 154 Q150 156 166 160 L170 188" fill="none" stroke="#231c29" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M162 186 Q172 183 186 190 L186 194 L160 194 Z" fill="#1b1512" stroke="#8a6a44" stroke-width="1.5"/>
    <g class="schellring"><circle cx="164" cy="181" r="2.4" fill="#e0a046"/><circle cx="170" cy="182" r="2.4" fill="#e0a046"/><circle cx="176" cy="181" r="2.4" fill="#e0a046"/></g></g>
  <path d="M150 186 Q160 183 172 190 L172 194 L146 194 Z" fill="#1b1512" stroke="#8a6a44" stroke-width="1.5"/>
  <!-- Körper -->
  <g class="koerper">
    <path d="M96 150 Q92 118 100 96 Q110 84 126 88 Q136 104 132 150 Z" fill="#1d1820" stroke="#e0a046" stroke-width="1.6"/>
    <path d="M112 92 L114 148" stroke="#e0a046" stroke-width="1.2" stroke-dasharray="3 4"/>
    <!-- hinterer Arm (greift den Hals) -->
    <path class="arm-griff" d="M122 96 Q160 92 196 84" fill="none" stroke="#1d1820" stroke-width="10" stroke-linecap="round"/>
    <path d="M108 74 L109 92 L121 92 L121 74 Z" fill="#b8865f"/>
    <path d="M100 96 Q112 86 128 92" fill="none" stroke="#e0a046" stroke-width="2.4" stroke-linecap="round"/>
    <g class="kopf"><g transform="translate(0 6)">
      <path d="M100 70 Q96 50 112 44 Q128 40 132 56 Q134 70 124 76 Q110 80 100 70 Z" fill="#c99872"/>
      <path d="M103 60 L90 50 L104 66 Z" fill="#c99872" stroke="#9a7254" stroke-width="1"/>
      <path d="M98 58 Q92 36 112 32 Q134 28 138 48 Q142 40 136 34 Q146 44 134 58 Q130 46 120 46 Q112 46 106 56 Q104 50 98 58 Z" fill="#7a3f1d"/>
      <path d="M119 62 q3 -2 6 0" stroke="#2a1a10" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M118 70 q6 4 11 -1" stroke="#5a2a18" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M126 72 L140 76 L142 70" fill="none" stroke="#3a2a1c" stroke-width="2.4" stroke-linecap="round"/>
    </g></g>
  </g>
  <!-- Laute -->
  <g class="laute">
    <path class="hals" d="M164 122 L232 70 L238 77 L172 130 Z" fill="#5a3a20" stroke="#2a1a10" stroke-width="1.2"/>
    <path d="M232 70 L250 74 L252 82 L238 77 Z" fill="#4a2e18" stroke="#2a1a10" stroke-width="1.2"/>
    <g fill="#e0a046"><circle cx="242" cy="72" r="1.6"/><circle cx="247" cy="74" r="1.6"/><circle cx="244" cy="79" r="1.6"/><circle cx="249" cy="80" r="1.6"/></g>
    <ellipse class="korpus" cx="150" cy="140" rx="36" ry="25" transform="rotate(-38 150 140)" fill="#a8743c" stroke="#5a3a20" stroke-width="2"/>
    <circle cx="156" cy="134" r="8" fill="#2a1a10" stroke="#e0a046" stroke-width="1.2"/>
    <path class="saiten" d="M132 154 L236 74 M134 156 L238 76 M136 158 L240 78" stroke="#ebe2cc" stroke-width=".7" opacity=".85"/>
    <path d="M130 150 L138 160" stroke="#2a1a10" stroke-width="3" stroke-linecap="round"/>
  </g>
  <!-- Griffhand -->
  <circle class="hand-griff" cx="200" cy="85" r="6" fill="#c99872"/>
  <!-- vorderer Arm (schlägt/zupft) -->
  <g class="arm-schlag"><path d="M118 98 Q106 126 132 140" fill="none" stroke="#231c29" stroke-width="11" stroke-linecap="round"/>
    <path d="M118 98 Q106 126 132 140" fill="none" stroke="#e0a046" stroke-width="1" stroke-dasharray="2 5"/>
    <circle class="hand-schlag" cx="136" cy="142" r="6.5" fill="#c99872"/></g>
  <circle class="rauchwolke" cx="146" cy="68" r="5" fill="rgba(220,215,230,.25)"/>
</svg>`;

  /* ---------- Oberfläche ---------- */
  function rasterZeile(spur, zeile, beschriftung, klasse) {
    let html = '<div class="lw-name ' + (klasse || "") + '">' + beschriftung + "</div>";
    for (let i = 0; i < SCHRITTE; i++) {
      let an = false;
      if (spur === "klopf" || spur === "schelle") an = !!S[spur][i];
      else an = S[spur][i] === zeile;
      html += '<button type="button" class="lw-zelle s-' + spur + (i % 4 === 0 ? " takt" : "") + (an ? " an" : "") +
        '" data-spur="' + spur + '" data-zeile="' + zeile + '" data-s="' + i + '" aria-pressed="' + an + '"></button>';
    }
    return html;
  }
  function zeichnen() {
    const T = t();
    const tonarten = Array.from({ length: 12 }, (_, i) => i - 5).map(tr => '<option value="' + tr + '"' + (tr === S.transpose ? " selected" : "") + ">" + notenName(MEL_GRUND + tr) + "</option>").join("");
    const modi = MODUS_LISTE.map(m => '<option value="' + m + '"' + (m === S.modus ? " selected" : "") + ">" + T.modi[m] + "</option>").join("");
    let raster = '<div class="lw-kopf">' + T.spuren.klopf + " · " + T.spurInfo.klopf + "</div>" + rasterZeile("klopf", 0, "✊", "sym");
    raster += '<div class="lw-kopf">' + T.spuren.schelle + " · " + T.spurInfo.schelle + "</div>" + rasterZeile("schelle", 0, "🔔", "sym");
    raster += '<div class="lw-kopf">' + T.spuren.bass + " · " + T.spurInfo.bass + "</div>";
    for (let z = BASS_STUFEN.length - 1; z >= 0; z--) raster += rasterZeile("bass", z, notenName(bassMidi(z, S)), z === 0 ? "grund" : "");
    raster += '<div class="lw-kopf">' + T.spuren.melodie + " · " + T.spurInfo.melodie + "</div>";
    for (let z = 7; z >= 0; z--) raster += rasterZeile("melodie", z, notenName(melMidi(z, S)), z === 0 || z === 7 ? "grund" : "");

    root.innerHTML =
      '<p class="label">' + T.label + "</p><h3>" + T.titel + '</h3><p class="tav-info">' + T.text + "</p>" +
      '<div class="lw-buehne">' + BARRADIN + "</div>" +
      '<div class="lw-steuer">' +
        '<button type="button" class="lw-play">' + (laeuft ? T.stopp : T.spielen) + "</button>" +
        '<label class="lw-feld lw-tempo"><span>' + T.tempo + ' <b class="lw-bpm">' + S.tempo + '</b></span><input type="range" min="50" max="180" step="2" value="' + S.tempo + '" data-feld="tempo"></label>' +
        '<label class="lw-feld"><span>' + T.tonart + '</span><select data-feld="transpose">' + tonarten + "</select></label>" +
        '<label class="lw-feld"><span>' + T.modus + '</span><select data-feld="modus">' + modi + "</select></label>" +
        '<button type="button" class="lw-schalter" data-feld="swing" aria-pressed="' + !!S.swing + '">' + T.swing + "</button>" +
        '<button type="button" class="lw-schalter" data-feld="bordun" aria-pressed="' + !!S.bordun + '">' + T.bordun + "</button>" +
      "</div>" +
      '<div class="lw-vorlagen"><span>' + T.vorlagen + ":</span>" +
        Object.keys(VORLAGEN).map(k => '<button type="button" data-vorlage="' + k + '">' + T.lieder[k] + "</button>").join("") +
        '<button type="button" data-vorlage="zufall">' + T.zufall + '</button><button type="button" data-vorlage="leer">' + T.leeren + "</button>" +
      "</div>" +
      '<div class="lw-scroll"><div class="lw-raster">' + raster + "</div></div>" +
      '<p class="lw-wisch">' + T.wischen + "</p>" +
      '<div class="lw-fuss"><button type="button" class="lw-teilen">' + T.teilen + '</button><span class="lw-status" aria-live="polite"></span></div>';

    spalten = Array.from({ length: SCHRITTE }, (_, i) => Array.from(root.querySelectorAll('.lw-zelle[data-s="' + i + '"]')));
    aktiv = -1;
  }
  function knoepfe() {
    const b = root.querySelector(".lw-play");
    if (b) { b.textContent = laeuft ? t().stopp : t().spielen; b.classList.toggle("laeuft", laeuft); }
  }
  function status(text) {
    const s = root.querySelector(".lw-status");
    if (!s) return;
    s.textContent = text;
    clearTimeout(status.t); status.t = setTimeout(() => { s.textContent = ""; }, 3500);
  }

  function zufallsLied() {
    const s = kopie(S);
    s.klopf = an([0, 8].concat(Math.random() < .6 ? [4, 12] : [6, 14]).concat(Math.random() < .5 ? [14] : [3, 11]));
    s.schelle = an([2, 6, 10, 14].filter(() => Math.random() < .7));
    s.bass = leer(); [0, 4, 8, 12].forEach(i => { if (i % 8 === 0 || Math.random() < .6) s.bass[i] = i % 8 === 0 ? 0 : [2, 3, 3, 1][Math.floor(Math.random() * 4)]; });
    s.melodie = leer();
    let stufe = 4;
    for (let i = 0; i < SCHRITTE; i++) {
      if (i % 2 === 1 && Math.random() < .45) continue;
      stufe = Math.max(0, Math.min(7, stufe + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
      s.melodie[i] = stufe;
    }
    s.melodie[0] = s.melodie[0] < 0 ? 4 : s.melodie[0];
    s.melodie[14] = 1; s.melodie[15] = 0;
    s.modus = MODUS_LISTE[Math.floor(Math.random() * MODUS_LISTE.length)];
    s.tempo = 80 + Math.floor(Math.random() * 25) * 2;
    return s;
  }

  function antippen(z) {
    const spur = z.dataset.spur, i = +z.dataset.s, zeile = +z.dataset.zeile;
    if (spur === "klopf" || spur === "schelle") S[spur][i] = S[spur][i] ? 0 : 1;
    else S[spur][i] = S[spur][i] === zeile ? -1 : zeile;
    root.querySelectorAll('.lw-zelle[data-spur="' + spur + '"][data-s="' + i + '"]').forEach(c => {
      const an = spur === "klopf" || spur === "schelle" ? !!S[spur][i] : S[spur][i] === +c.dataset.zeile;
      c.classList.toggle("an", an); c.setAttribute("aria-pressed", an);
    });
    merken();
    /* Vorhören */
    const istAn = spur === "klopf" || spur === "schelle" ? S[spur][i] : S[spur][i] >= 0;
    if (!istAn) return;
    try {
      audioStart();
      const jetzt = ctx.currentTime + .01;
      if (spur === "klopf") klopfen(jetzt, i % 4 === 0);
      else if (spur === "schelle") schellen(jetzt);
      else if (spur === "bass") zupf(midiHz(bassMidi(zeile, S)), jetzt, "bass");
      else zupf(midiHz(melMidi(zeile, S)), jetzt, "mel");
    } catch (_) {}
  }

  root.addEventListener("click", e => {
    const z = e.target.closest(".lw-zelle");
    if (z) { antippen(z); return; }
    if (e.target.closest(".lw-play")) { laeuft ? stopp() : start(); return; }
    const sch = e.target.closest(".lw-schalter");
    if (sch) {
      const f = sch.dataset.feld; S[f] = S[f] ? 0 : 1; sch.setAttribute("aria-pressed", !!S[f]); merken();
      if (f === "bordun" && laeuft) { S.bordun ? bordunAn() : bordunAus(); }
      return;
    }
    const v = e.target.closest("[data-vorlage]");
    if (v) {
      const k = v.dataset.vorlage;
      if (k === "leer") S = Object.assign(S, { klopf: Array(SCHRITTE).fill(0), schelle: Array(SCHRITTE).fill(0), bass: leer(), melodie: leer() });
      else if (k === "zufall") S = zufallsLied();
      else S = kopie(VORLAGEN[k]);
      merken(); zeichnen(); knoepfe();
      if (laeuft) { bordunAus(); bordunAn(); }
      return;
    }
    if (e.target.closest(".lw-teilen")) {
      const url = location.origin + location.pathname + "?lied=" + kodieren() + "#taverne";
      if (navigator.share) {
        navigator.share({ title: t().titel, url }).then(() => status(t().geteilt)).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => status(t().kopiert), () => window.prompt(t().teilen, url));
      } else window.prompt(t().teilen, url);
    }
  });
  root.addEventListener("input", e => {
    const f = e.target.dataset && e.target.dataset.feld;
    if (f === "tempo") { S.tempo = +e.target.value; root.querySelector(".lw-bpm").textContent = S.tempo; merken(); }
  });
  root.addEventListener("change", e => {
    const f = e.target.dataset && e.target.dataset.feld;
    if (f === "transpose") { S.transpose = +e.target.value; merken(); zeichnen(); knoepfe(); bordunStimmen(); }
    if (f === "modus") { S.modus = e.target.value; merken(); zeichnen(); knoepfe(); }
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden && laeuft) stopp(); });

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.lautenwerk { grid-column: 1 / -1; }
.lw-buehne { position: relative; height: clamp(150px, 34vw, 230px); display: grid; place-items: center; overflow: hidden;
  background: radial-gradient(ellipse at 45% 85%, rgba(224,160,70,.16), transparent 65%); border-bottom: 1px solid var(--line); margin-inline: calc(-1 * clamp(1.2rem, 4vw, 2rem)); }
.lw-figur { position: absolute; inset: 6px 0 0; width: 100%; height: calc(100% - 6px); overflow: visible; }
.lw-figur .kopf, .lw-figur .arm-schlag, .lw-figur .fuss, .lw-figur .laute, .lw-figur .hand-griff { transform-box: view-box; }
.lw-figur .kopf { transform-origin: 114px 84px; }
.lw-figur .arm-schlag { transform-origin: 118px 98px; }
.lw-figur .fuss { transform-origin: 130px 155px; }
.lw-figur .laute { transform-origin: 150px 140px; }
.lw-figur .hand-griff { transform-origin: 200px 85px; }
.lw-figur .rauchwolke { animation: lwrauch 4s ease-in-out infinite; }
@keyframes lwrauch { 0% { transform: translate(0,0); opacity: 0 } 30% { opacity: .9 } 100% { transform: translate(10px,-26px) scale(2); opacity: 0 } }
.lw-buehne.klopf .kopf { animation: lwnick .28s ease-out; }
.lw-buehne.klopf .arm-schlag { animation: lwklopf .18s ease-out; }
.lw-buehne.klopf .laute { animation: lwwackel .2s ease-out; }
.lw-buehne.schelle .fuss { animation: lwfuss .2s ease-out; }
.lw-buehne.schelle .schellring { animation: lwbling .25s ease-out; }
.lw-buehne.bass .arm-schlag { animation: lwzupf .22s ease-out; }
.lw-buehne.mel .hand-griff { animation: lwgriff .25s ease-out; }
.lw-buehne.mel .saiten, .lw-buehne.bass .saiten { animation: lwsaite .3s ease-out; }
@keyframes lwnick { 40% { transform: rotate(6deg) translateY(2px) } }
@keyframes lwklopf { 40% { transform: rotate(-9deg) translate(2px, 4px) } }
@keyframes lwwackel { 40% { transform: rotate(-1.5deg) } }
@keyframes lwfuss { 40% { transform: rotate(-8deg) } }
@keyframes lwbling { 40% { filter: drop-shadow(0 0 4px #ffd27a) brightness(1.6) } }
@keyframes lwzupf { 40% { transform: rotate(5deg) } }
@keyframes lwgriff { 40% { transform: translate(-6px, 4px) scale(1.15) } }
@keyframes lwsaite { 0% { stroke: #ffd27a; opacity: 1; filter: drop-shadow(0 0 3px #ffd27a) } }
.lw-note { position: absolute; bottom: 38%; font-size: 1.4rem; color: var(--ember); pointer-events: none; animation: lwnote 1.5s ease-out forwards; text-shadow: 0 0 8px rgba(224,160,70,.6); }
.lw-note.tief { color: var(--vellum); font-size: 1.1rem; }
@keyframes lwnote { from { transform: translate(0, 0); opacity: 1 } to { transform: translate(var(--dx, 10px), -90px) rotate(15deg); opacity: 0 } }

.lw-steuer { display: flex; flex-wrap: wrap; align-items: end; gap: .7rem 1rem; }
.lw-play { border: 1px solid var(--ember); background: var(--ember); color: var(--night); font: inherit; font-weight: 600; padding: .55rem 1.2rem; cursor: pointer; min-width: 8.5rem; }
.lw-play.laeuft { background: none; color: var(--ember); }
.lw-feld { display: grid; gap: .2rem; font-size: .78rem; letter-spacing: .06em; color: var(--ash); }
.lw-feld b { color: var(--vellum); font-weight: 600; }
.lw-feld select { font: inherit; font-size: .9rem; letter-spacing: 0; background: var(--night); color: var(--vellum); border: 1px solid var(--line); padding: .35rem .5rem; }
.lw-tempo input { width: 9rem; accent-color: #e0a046; }
.lw-schalter { border: 1px solid var(--line); background: none; color: var(--ash); font: inherit; font-size: .85rem; padding: .4rem .8rem; cursor: pointer; border-radius: 999px; }
.lw-schalter[aria-pressed="true"] { border-color: var(--ember); color: var(--ember); }
.lw-schalter[aria-pressed="true"]::before { content: "✓ "; }
.lw-vorlagen { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem; font-size: .85rem; color: var(--ash); }
.lw-vorlagen button { border: 1px solid var(--line); background: none; color: var(--vellum); font: inherit; font-size: .82rem; padding: .25rem .7rem; cursor: pointer; }
.lw-vorlagen button:hover { border-color: var(--ember); color: var(--ember); }

.lw-scroll { overflow-x: auto; margin-inline: calc(-1 * clamp(1.2rem, 4vw, 2rem)); padding-inline: clamp(1.2rem, 4vw, 2rem); -webkit-overflow-scrolling: touch; }
.lw-raster { display: grid; grid-template-columns: 3.2rem repeat(16, minmax(1.75rem, 1fr)); gap: 3px; min-width: 36rem; }
.lw-kopf { grid-column: 1 / -1; font-size: .7rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--ember); margin-top: .7rem; }
.lw-kopf:first-child { margin-top: 0; }
.lw-name { position: sticky; left: 0; z-index: 1; display: flex; align-items: center; justify-content: flex-end; padding-right: .45rem;
  font-family: var(--display); font-size: .82rem; color: var(--ash); background: var(--hall); }
.lw-name.grund { color: var(--vellum); }
.lw-name.sym { font-family: inherit; }
.lw-zelle { height: 1.75rem; padding: 0; border: 1px solid rgba(224,160,70,.14); background: rgba(235,226,204,.035); cursor: pointer; border-radius: 3px; transition: background .12s; -webkit-tap-highlight-color: transparent; }
.lw-zelle.takt { background: rgba(235,226,204,.08); }
.lw-zelle:hover { border-color: rgba(224,160,70,.5); }
.lw-zelle.an { background: var(--ember); border-color: var(--ember); box-shadow: 0 0 8px rgba(224,160,70,.35); }
.lw-zelle.s-schelle.an { background: #f0d48a; border-color: #f0d48a; }
.lw-zelle.s-bass.an { background: #b5643c; border-color: #b5643c; }
.lw-zelle.s-klopf.an { background: #c98a3a; border-color: #c98a3a; }
.lw-zelle.jetzt { outline: 1px solid rgba(235,226,204,.55); outline-offset: 0; }
.lw-zelle.jetzt.an { filter: brightness(1.35); box-shadow: 0 0 14px rgba(255,210,122,.8); }
.lw-wisch { display: none; font-size: .78rem; color: var(--ash); text-align: center; margin-top: -.3rem; }
@media (max-width: 640px) { .lw-wisch { display: block; } }
.lw-fuss { display: flex; flex-wrap: wrap; align-items: center; gap: .8rem; }
.lw-teilen { border: 1px solid var(--ember); background: none; color: var(--ember); font: inherit; font-size: .9rem; padding: .45rem 1rem; cursor: pointer; }
.lw-teilen:hover { background: var(--ember); color: var(--night); }
.lw-status { font-family: var(--hand); font-size: 1.3rem; color: var(--ember); }
@media (prefers-reduced-motion: reduce) { .lw-figur .rauchwolke { animation: none; } }
`;
  document.head.appendChild(css);

  zeichnen();
  let letzteSprache = sprache();
  new MutationObserver(() => { if (sprache() === letzteSprache) return; letzteSprache = sprache(); zeichnen(); knoepfe(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  if (ausLink) {
    setTimeout(() => {
      root.scrollIntoView({ block: "start" });
      status(t().geladen);
    }, 400);
  }
})();
