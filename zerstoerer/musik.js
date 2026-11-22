/* Ezekiel – The Destroyer · Musik und Klangkulisse
   Die Musik entsteht live aus echten Instrumentaufnahmen (klang/) plus einem prozeduralen Streicherteppich (WebAudio).
   Sie ist in Ebenen gebaut, die je nach Lage weich ineinander überblenden:
     Erkundung  – Bordun, Streicherteppich, Chor, spärliche Melodie und „Farbe“ (Harfe, Glocken …)
     Spannung   – leise Pauken und Zupfer, wenn Gegner wach werden oder näher kommen
     Kampf      – Ostinato (3+3+2), Bass, Trommeln, Blechstöße, Tremolo, bei Bossen Chor
   Der Wechsel Erkundung ↔ Kampf passiert musikalisch: mit Einsatz-Schlag beim Kampfbeginn,
   Nachhall-Akkord beim Kampfende und Rückwärts-Becken vor Bossen. Dazu Stinger (Seite, Truhe, Bossphase,
   Sieg, Tod, Killketten), Dämpfung im Pausenmenü und bei wenig Leben.
   Alles läuft über den Musikbus von Z.audio (Lautstärkeregler „Musik“). Die Kulisse der Bühne (amb/) steht unten. */
(function () {
  "use strict";
  const Z = window.Z, A = Z.audio;
  const K = n => "klang/" + n + ".mp3";
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = l => l[Math.floor(Math.random() * l.length)];

  /* verfügbare Tonhöhen je Instrument (MIDI-Nummern der Aufnahmen in klang/) */
  const INST = {
    vc: [36, 40, 43, 47, 50, 53, 57, 60, 64, 67, 71, 74, 77], vctrem: [36, 40, 43, 50, 53, 57, 59, 60, 64, 67, 71, 74, 77],
    ooh: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78], aah: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81],
    rorg: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88],
    orgel: [36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96], eh: [52, 55, 58, 61, 64, 67, 70, 73, 76, 79],
    harfe: [28, 31, 35, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 89, 93, 95, 98, 101],
    koto: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93], hpan: [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
    cel: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105, 108], kal: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96],
    bra: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84], blech: [46, 49, 52, 55, 58, 61, 64, 67, 70, 73, 76, 79, 82],
    tuba: [34, 39, 41, 46, 50, 53, 58], hornst: [33, 36, 39, 43, 46, 50, 53, 57, 60, 74, 77], timpt: [36, 39, 42, 45, 48, 51, 54, 57],
    rgl: [60, 63, 66, 69, 72, 75, 78], mar: [45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96], dudel: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87],
    spic: [36, 40, 43, 47, 50, 53, 57, 60, 64, 67, 71, 74, 77], pizz: [36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84],
    vlntrem: [55, 57, 59, 62, 69, 72, 76, 79, 83, 86], kb: [28, 30, 31, 34, 36, 38, 40, 42, 44, 45, 49, 52, 56, 59],
    horn: [36, 39, 43, 46, 50, 53, 57, 60], pos: [34, 37, 39, 41, 46, 50, 53, 60, 61, 63, 65], trpst: [53, 57, 60, 63, 65, 67, 70, 74, 77, 81, 84],
    glock: [79, 84, 91, 96, 103, 108], fl: [60, 64, 69, 72, 76, 81, 84, 88, 93, 96], pfeife: [72, 75, 78, 81, 84, 87, 90, 93, 96],
    shaku: [55, 58, 61, 64, 67, 70, 73, 76, 79, 82], shanai: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93],
    sitar: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84], cemb: [41, 44, 47, 50, 53, 56, 59, 62, 65, 68, 71, 74, 77, 80, 83, 86, 89],
    gitarre: [36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84], spiel: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105],
    glas: [75, 78, 86], didge: [37], oboe: [58, 62, 65, 70, 74, 77, 82, 86, 89],
    mbira: [46, 48, 50, 51, 53, 55, 56, 58, 60, 62, 63, 65, 67, 68, 70, 72, 73, 74, 75], akk: [53, 56, 59, 62, 65, 68, 71, 74, 77, 80, 83, 86, 89]
  };
  function nearest(inst, midi) { const l = INST[inst]; let best = l[0]; for (const n of l) if (Math.abs(n - midi) < Math.abs(best - midi)) best = n; return best; }
  /* Ton in den Umfang des Instruments oktavieren, damit nichts unnatürlich weit verstimmt klingt */
  function fit(inst, midi) { const l = INST[inst]; if (!l) return midi; const lo = l[0] - 4, hi = l[l.length - 1] + 4; while (midi > hi) midi -= 12; while (midi < lo) midi += 12; return midi; }

  /* Tonleitern (Halbtonschritte) */
  const SC = { moll: [0, 2, 3, 5, 7, 8, 10], dorisch: [0, 2, 3, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], hpan: [0, 2, 3, 5, 7, 8, 10] };
  const deg = (scale, i, root) => { const s = SC[scale], n = s.length; const o = Math.floor(i / n); return root + s[((i % n) + n) % n] + 12 * o; };

  /* Profile je Gebiet: Grundton (MIDI), Tempo, Leiter und Besetzung der Ebenen.
     drone/pad/mel/col = Erkundung, ost/bass/brass/dr = Kampf. dr: [tief, mittel, hoch]. */
  const PROF = {
    lager:    { root: 50, bpm: 66, scale: "hpan", drone: "didge", pad: null, mel: "hpan", col: "kal", calm: true, wave: "triangle" },
    passage:  { root: 50, bpm: 60, scale: "hpan", drone: "vc", pad: "ooh", mel: "hpan", col: "glas", calm: true },
    torhof:   { root: 50, bpm: 92, scale: "dorisch", drone: "vc", pad: "ooh", mel: "eh", col: "harfe", ost: "spic", bass: "kb", brass: "hornst", dr: ["taiko_36", "timp1", "marsch1"] },
    keller:   { root: 45, bpm: 84, scale: "phryg", drone: "rorg", pad: "ooh", mel: "koto", col: "kal", ost: "pizz", bass: "kb", brass: "pos", dr: ["riese1", "bodh1", "rahm_1"] },
    hallen:   { root: 48, bpm: 96, scale: "harm", drone: "orgel", pad: "aah", mel: "bra", col: "cemb", ost: "spic", bass: "tuba", brass: "blech", dr: ["timp1", "marsch1", "snare1"] },
    wehrgang: { root: 52, bpm: 104, scale: "dorisch", drone: "vc", pad: "aah", mel: "fl", col: "pfeife", ost: "spic", bass: "kb", brass: "trpst", dr: ["taiko_42", "marsch2", "snare2"] },
    verlies:  { root: 43, bpm: 78, scale: "phryg", drone: "vctrem", pad: "ooh", mel: "cel", col: "spiel", ost: "pizz", bass: "kb", brass: "pos", dr: ["riese2", "bodh2", "schlitz1"] },
    hafen:    { root: 50, bpm: 98, scale: "dorisch", drone: "vc", pad: "ooh", mel: "dudel", col: "gitarre", ost: "pizz", bass: "kb", brass: "hornst", dr: ["bodh1", "taiko_48", "tamb_1"] },
    glocken:  { root: 47, bpm: 100, scale: "moll", drone: "rorg", pad: "aah", mel: "rgl", col: "glock", ost: "spic", bass: "tuba", brass: "blech", dr: ["timp3", "marsch1", "triangel1"] },
    schlund:  { root: 44, bpm: 82, scale: "phryg", drone: "vctrem", pad: "ooh", mel: "kal", col: "shaku", ost: "pizz", bass: "kb", brass: "pos", dr: ["riese1", "taiko_36", "darb_1"] },
    schmiede: { root: 46, bpm: 108, scale: "harm", drone: "vc", pad: "aah", mel: "mar", col: "cemb", ost: "spic", bass: "tuba", brass: "blech", dr: ["taiko_42", "riese3", "amboss"] },
    zinnen:   { root: 49, bpm: 112, scale: "harm", drone: "vctrem", pad: "aah", mel: "oboe", col: "glock", ost: "spic", bass: "tuba", brass: "hornst", dr: ["taiko_36", "timp5", "snare1"] },
    see:      { root: 41, bpm: 80, scale: "phryg", drone: "rorg", pad: "ooh", mel: "harfe", col: "glas", ost: "pizz", bass: "kb", brass: "horn", dr: ["riese2", "bodh2", "rahm_2"] },
    glut:     { root: 45, bpm: 114, scale: "harm", drone: "vc", pad: "aah", mel: "shanai", col: "sitar", ost: "spic", bass: "tuba", brass: "blech", dr: ["taiko_48", "riese3", "darb_2"] },
    sturm:    { root: 47, bpm: 110, scale: "moll", drone: "vctrem", pad: "aah", mel: "eh", col: "harfe", ost: "spic", bass: "kb", brass: "hornst", dr: ["timp1", "taiko_36", "snare2"] },
    boss1:    { root: 45, bpm: 126, scale: "harm", drone: "vctrem", pad: "aah", mel: "blech", col: "glock", ost: "spic", bass: "tuba", brass: "hornst", dr: ["taiko_36", "riese1", "snare1"], boss: true },
    final:    { root: 41, bpm: 132, scale: "harm", drone: "vctrem", pad: "aah", mel: "horn", col: "rgl", ost: "spic", bass: "tuba", brass: "blech", dr: ["riese1", "taiko_36", "snare2"], boss: true }
  };
  /* Akkordfolgen (Stufen der Leiter, 0 = Tonika). Erkundung: zwei Takte je Akkord, Kampf: ein Takt. */
  const PROG_EXP = [[0, 5, 2, 6], [0, 3, 5, 4], [0, 6, 5, 6], [0, 2, 3, 0], [0, 5, 3, 6], [0, 3, 6, 2]];
  const PROG_CMB = [[0, 0, 5, 6], [0, 5, 3, 4], [0, 6, 5, 4], [0, 3, 0, 4], [0, 1, 0, 6], [0, 5, 6, 4]];
  /* Rhythmusvorlagen für Melodiephrasen: [Achtel, Länge in Achteln] auf 16 Achteln (zwei Takte) */
  const RHY_RUHIG = [
    [[0, 2], [2, 2], [4, 4], [10, 2], [12, 4]], [[0, 3], [3, 1], [4, 4], [10, 2], [12, 4]], [[0, 4], [4, 2], [6, 2], [8, 8]],
    [[2, 2], [4, 1], [5, 1], [6, 2], [8, 6], [14, 2]], [[0, 2], [3, 1], [4, 2], [6, 2], [8, 4], [13, 3]], [[0, 6], [6, 2], [8, 6]]
  ];
  const RHY_KAMPF = [
    [[0, 1], [1, 1], [2, 2], [4, 2], [6, 2], [8, 1], [9, 1], [10, 2], [12, 3], [15, 1]], [[0, 3], [3, 3], [6, 2], [8, 3], [11, 3], [14, 2]],
    [[0, 2], [2, 1], [3, 1], [4, 4], [8, 2], [10, 1], [11, 1], [12, 4]], [[0, 1], [2, 1], [3, 2], [5, 1], [6, 2], [8, 6], [14, 1], [15, 1]]
  ];
  /* Ostinato-Muster als Akkordton-Index (0 Grundton, 1 Terz, 2 Quinte, 3 Oktave) über 8 Achtel */
  const OSTP = [[0, 0, 2, 0, 0, 2, 0, 3], [0, 3, 0, 2, 0, 3, 2, 1], [0, 0, 1, 0, 0, 2, 3, 2], [0, 2, 3, 2, 0, 2, 3, 1], [0, 0, 0, 2, 0, 0, 3, 2]];

  const M = (Z.music = {
    prof: null, id: null, next: 0, step: 0, intensity: 0, target: 0, heat: 0, combat: false, C: 0, T: 0, calmT: 0,
    live: 0, stats: { notes: 0, skipped: 0, stingers: {} }, rage: 0, ambush: false, low: 0, pausedMix: 0
  });

  /* ---------- Signalfluss ----------
     Ebenen-Busse → M.out (Gesamtpegel, Duck) → M.lp (Tiefpass: Pause, wenig Leben) → A.mus (Musiklautstärke).
     Jeder Ebenen-Bus hat einen festen Hallanteil zum gemeinsamen Hall von Z.audio. */
  M.init = () => {
    if (!A.ok || M.out) return;
    const c = A.ctx;
    M.lp = c.createBiquadFilter(); M.lp.type = "lowpass"; M.lp.frequency.value = 20000; M.lp.Q.value = 0.5; M.lp.connect(A.mus);
    M.out = c.createGain(); M.out.gain.value = 0.62; M.out.connect(M.lp);
    const verbIn = c.createGain(); verbIn.gain.value = 1; verbIn.connect(A.verb); M.verbIn = verbIn;
    const bus = (g, pan, verb) => {
      const b = c.createGain(); b.gain.value = g; let o = b;
      if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; b.connect(p); o = p; }
      o.connect(M.out); if (verb) { const v = c.createGain(); v.gain.value = verb; o.connect(v); v.connect(verbIn); }
      return b;
    };
    M.busExp = bus(1, 0, 0.45);      /* Bordun, Chor */
    M.busMel = bus(1, -0.12, 0.5);   /* Melodie */
    M.busCol = bus(1, 0.3, 0.6);     /* Farbe */
    M.busTen = bus(0, 0, 0.3);       /* Spannung */
    M.busCmb = bus(0, 0.08, 0.25);   /* Ostinato, Bass, Blech */
    M.busDr = bus(0, 0, 0.2);        /* Trommeln */
    M.busSt = bus(1, 0, 0.55);       /* Stinger */
    M.drums = M.busDr; M.bus = M.busMel; M.padBus = M.busExp; /* alte Namen */
    buildPad();
  };

  /* ---------- Prozeduraler Streicherteppich ----------
     Drei Stimmen aus je zwei leicht verstimmten Sägezähnen plus Sinus-Grundton, durch einen weichen Tiefpass,
     dessen Grenzfrequenz langsam atmet. Die Stimmen gleiten bei jedem Akkordwechsel (Stimmführung: kleinste Bewegung). */
  function buildPad() {
    const c = A.ctx, P = (M.pad = { v: [], cur: null });
    P.f = c.createBiquadFilter(); P.f.type = "lowpass"; P.f.frequency.value = 700; P.f.Q.value = 0.7;
    P.g = c.createGain(); P.g.gain.value = 0; P.f.connect(P.g); P.g.connect(M.out);
    const vs = c.createGain(); vs.gain.value = 0.6; P.g.connect(vs); vs.connect(M.verbIn);
    P.lfo = c.createOscillator(); P.lfo.frequency.value = 0.07; P.lfoG = c.createGain(); P.lfoG.gain.value = 220; P.lfo.connect(P.lfoG); P.lfoG.connect(P.f.frequency); P.lfo.start();
    for (let i = 0; i < 3; i++) {
      const g = c.createGain(); g.gain.value = 0.03; g.connect(P.f);
      const o1 = c.createOscillator(), o2 = c.createOscillator();
      o1.type = "sawtooth"; o2.type = "sawtooth"; o1.detune.value = -7 - i; o2.detune.value = 6 + i;
      o1.frequency.value = o2.frequency.value = 220; o1.connect(g); o2.connect(g); o1.start(); o2.start();
      P.v.push({ g, o: [o1, o2], m: 57 });
    }
    P.sub = c.createOscillator(); P.sub.type = "sine"; P.subG = c.createGain(); P.subG.gain.value = 0.07; P.sub.connect(P.subG); P.subG.connect(P.g); P.sub.start();
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  /* Akkord auf dem Teppich setzen: Stimmen gleiten zur nächstgelegenen Lage */
  function padChord(chord, when, glide) {
    const P = M.pad, p = M.prof; if (!P) return;
    const tones = [deg(p.scale, chord, p.root), deg(p.scale, chord + 2, p.root), deg(p.scale, chord + 4, p.root)];
    let best = null, bs = 1e9;
    for (let inv = 0; inv < 3; inv++) for (let oc = -1; oc <= 0; oc++) {
      const v = tones.map((t, i) => t + (i < inv ? 12 : 0) + oc * 12).sort((a, b) => a - b);
      if (v[0] < p.root - 7 || v[2] > p.root + 16) continue;
      const s = P.cur ? v.reduce((a, t, i) => a + Math.abs(t - P.cur[i]), 0) : Math.abs(v[0] - p.root);
      if (s < bs) { bs = s; best = v; }
    }
    best = best || tones; P.cur = best;
    best.forEach((m, i) => P.v[i].o.forEach(o => o.frequency.setTargetAtTime(hz(m), when, glide)));
    P.sub.frequency.setTargetAtTime(hz(deg(p.scale, chord, p.root) - 12), when, glide * 0.6);
  }

  /* ---------- Einzelnoten aus Aufnahmen ---------- */
  function playNote(inst, midi, when, vol, dur, bus, prio) {
    if (!A.ok || !M.out || !INST[inst]) return;
    if (M.live > 110 && !prio) { M.stats.skipped++; return; } /* Notbremse für die Stimmenzahl */
    midi = fit(inst, midi);
    const n = nearest(inst, midi), path = K(inst + "_" + n), b = A.buf[path];
    if (!b) { if (b === undefined) A.load(path); return; }
    const c = A.ctx; when = Math.max(when, c.currentTime + 0.005);
    const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = Math.pow(2, (midi - n) / 12);
    const g = c.createGain(), att = Math.min(0.06, dur * 0.15);
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + att);
    g.gain.setValueAtTime(vol, when + dur * 0.72); g.gain.linearRampToValueAtTime(0, when + dur);
    s.connect(g); g.connect(bus || M.busMel);
    track(s, g); s.start(when); s.stop(when + dur + 0.05);
  }
  /* Schlagwerk / Einzelklang */
  function hit(name, when, vol, rate, bus, rev) {
    if (!A.ok || !M.out) return;
    if (M.live > 110) { M.stats.skipped++; return; }
    const path = K(name); let b = A.buf[path]; if (!b) { if (b === undefined) A.load(path); return; }
    if (rev) b = reversed(path, b);
    const c = A.ctx; when = Math.max(when, c.currentTime + 0.005);
    const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = rate || 1;
    const g = c.createGain(); g.gain.value = vol; s.connect(g); g.connect(bus || M.busDr);
    track(s, g); s.start(when);
    return b.duration / (rate || 1);
  }
  /* Knoten nach dem Verklingen wieder lösen und mitzählen */
  function track(s, g) {
    M.live++; M.stats.notes++;
    s.onended = () => { M.live--; try { s.disconnect(); g.disconnect(); } catch (_) {} };
  }
  const revCache = {};
  function reversed(path, b) {
    if (revCache[path]) return revCache[path];
    const r = A.ctx.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
    for (let ch = 0; ch < b.numberOfChannels; ch++) { const s = b.getChannelData(ch), d = r.getChannelData(ch); for (let i = 0, n = s.length; i < n; i++) d[i] = s[n - 1 - i]; }
    return (revCache[path] = r);
  }
  M.note = playNote; M.hit = hit;

  /* ---------- Melodie: Motive mit Abwandlungen ---------- */
  function newMotif(R, combat) {
    const rhy = (R ? R.pick : pick)(combat ? RHY_KAMPF : RHY_RUHIG);
    const r = R || Math.random;
    let d = [0, 2, 4, 7][Math.floor(r() * 4)];
    const steps = [-2, -1, -1, 1, 1, 1, 2, -3, 3, 0];
    const notes = rhy.map(([s, l], i) => {
      if (i > 0) { d += steps[Math.floor(r() * steps.length)]; d = clamp(d, -1, 9); }
      return { s, l, d };
    });
    notes[notes.length - 1].d = [0, 4, 7][Math.floor(r() * 3)];
    return notes;
  }
  /* Abwandlungen, damit nichts stumpf wiederholt wird */
  const VAR = {
    orig: m => m,
    hoch: m => m.map(n => ({ ...n, d: n.d + 2 })),
    tief: m => m.map(n => ({ ...n, d: n.d - 1 })),
    umkehr: m => m.map(n => ({ ...n, d: clamp(2 * m[0].d - n.d, -1, 9) })),
    kopf: m => { const h = m.filter(n => n.s < 8), t = newMotif(null, M.combat).filter(n => n.s >= 8); return h.concat(t); },
    frage: m => m.filter(n => n.s < 8).concat([{ s: 8, l: 6, d: m[0].d + 1 }]),
    echo: m => m.filter(n => n.s < 8).map(n => ({ ...n })).concat(m.filter(n => n.s < 8).map(n => ({ s: n.s + 8, l: n.l, d: n.d - 2, soft: 1 })))
  };
  function nextVariant() {
    const w = { orig: 3, hoch: 2, tief: 1.5, umkehr: 1.5, kopf: 2, frage: 1.5, echo: 1.5 };
    if (M.lastVar) w[M.lastVar] = 0;
    if (M.lastVar2) w[M.lastVar2] *= 0.4;
    let sum = 0; for (const k in w) sum += w[k]; let x = Math.random() * sum;
    for (const k in w) { x -= w[k]; if (x <= 0) { M.lastVar2 = M.lastVar; M.lastVar = k; return k; } }
    return "orig";
  }
  /* Phrasenplan: spielen oder atmen (in der Erkundung bewusst mit Pausen) */
  function planPhrase() {
    const calm = !M.combat;
    M.phraseN = (M.phraseN || 0) + 1;
    if (M.phraseN % (calm ? 9 : 6) === 0) M.motif = newMotif(null, !calm); /* Weiterentwicklung */
    let play;
    if (M.bossOn || M.combat) play = M.restRun >= 1 || Math.random() < 0.82;
    else if (M.restRun >= 2) play = true;
    else if (M.playRun >= 2) play = false;
    else play = Math.random() < (M.prof.calm ? 0.55 : 0.5);
    if (play) { M.playRun = (M.playRun || 0) + 1; M.restRun = 0; M.phrase = VAR[nextVariant()](M.motif); }
    else { M.restRun = (M.restRun || 0) + 1; M.playRun = 0; M.phrase = null; }
  }

  /* ---------- Gebiet setzen ---------- */
  const ambushFight = () => !!(Z.ambush && Z.ambush() && Z.ambush().state === "fight");
  M.set = (id) => {
    M.init(); if (!A.ok) return;
    if (M.id === id) return;
    /* Hinterhalt: Tonart des Gebiets behalten, nur in den vollen Kampf gehen */
    if (id === "boss1" && M.prof && !M.prof.boss && ambushFight()) { M.ambush = true; M.stinger("hinterhalt"); return; }
    const prevBoss = M.prof && M.prof.boss, sameLevel = M.levelRef && M.levelRef === Z.level;
    const prof = PROF[id] || PROF.torhof;
    M.id = id; M.prof = prof; M.levelRef = Z.level; M.ambush = false;
    const now = A.ctx.currentTime;
    /* Boss tritt mitten im Gebiet auf: Rückwärts-Becken atmet ein, dann setzt alles auf einmal ein */
    let start = now + 0.35;
    if (prof.boss && sameLevel && !prevBoss) { start = now + 1.6; M.bossLead = start; }
    M.next = start; M.step = 0; M.phraseN = 0; M.playRun = 0; M.restRun = 1; M.lastVar = M.lastVar2 = null;
    const R = Z.Rng(id.length * 131 + id.charCodeAt(0) * 7 + id.charCodeAt(id.length - 1));
    M.motif = newMotif(R, !!prof.boss); M.phrase = null;
    M.progE = R.pick(PROG_EXP); M.progC = R.pick(PROG_CMB); M.ost = R.pick(OSTP);
    M.combat = !!(prof.boss && Z.boss && !Z.bossDefeated); M.calmT = 0; M.rage = 0;
    if (!sameLevel) { M.C = M.combat ? 1 : 0; M.intensity = Math.min(M.intensity, 0.2); M.heat = 0; }
    if (M.pad) M.pad.cur = null;
    if (M.pad) {
      M.pad.g.gain.setTargetAtTime(prof.calm ? 0.45 : 0.36, start, 1.5);
      /* im Lager weicher (Dreieck), sonst Streicher-Säge */
      const wv = prof.wave || "sawtooth"; M.pad.v.forEach(v => v.o.forEach(o => { if (o.type !== wv) o.type = wv; }));
    }
    preload(prof);
    if (prof.boss && sameLevel && !prevBoss) M.stinger("boss");
  };
  function preload(p) {
    const near = (inst, c, r) => INST[inst] && INST[inst].forEach(n => { if (Math.abs(n - c) < r) A.load(K(inst + "_" + n)); });
    near(p.drone, p.root - 12, 20); if (p.pad) near(p.pad, p.root + 12, 16); near(p.mel, p.root + 12, 22); near(p.col, p.root + 19, 22);
    if (p.ost) { near(p.ost, p.root - 4, 20); near(p.bass, p.root - 18, 16); near(p.brass, p.root + 4, 18); near("vlntrem", p.root + 24, 14); near("aah", p.root + 12, 14); }
    near("timpt", p.root - 12, 10); near("pizz", p.root - 6, 14);
    (p.dr || []).forEach(d => A.load(K(d)));
    ["crash", "timproll", "beckenroll", "glock_91", "glock_96", "gong"].forEach(n => A.load(K(n)));
  }
  M.stop = () => { M.id = null; M.prof = null; if (M.pad && A.ctx) M.pad.g.gain.setTargetAtTime(0, A.ctx.currentTime, 0.8); };

  /* ---------- Lage im Spiel → Intensität ---------- */
  function gameIntensity(dt) {
    const P = Z.player, lv = Z.level;
    if (!P || !lv || P.dead) { M.heat = 0; return 0; }
    let s = 0, n = 0;
    for (const e of Z.enemies || []) {
      if (e.dead || !e.aware || e.dummy || e.ally || e.sleep) continue;
      const dx = Math.abs(e.x - P.x), dy = Math.abs(e.y - P.y); if (dx > 420 || dy > 260) continue;
      const near = clamp(1.2 - Math.hypot(dx, dy * 1.3) / 380, 0.15, 1);
      s += near * (e.elite ? 2 : 1) * (e.def && e.def.boss ? 3 : 1); n++;
    }
    /* Hitze: Treffer einstecken und Gegner fällen hält die Kampfmusik kurz am Leben */
    if (M.lastHp != null && P.hp < M.lastHp - 0.5) M.heat = Math.max(M.heat, 0.6);
    M.lastHp = P.hp;
    const k = (Z.stats && Z.stats.kills) || 0;
    if (M.lastKills != null && k > M.lastKills && n > 0) M.heat = Math.max(M.heat, 0.5);
    M.lastKills = k;
    M.heat = Math.max(0, M.heat - dt * 0.08);
    let I = Math.max(Math.min(1, s / 3.2), M.target || 0, n ? M.heat : M.heat * 0.6);
    if (lv.hub) I = Math.min(I, 0.3);
    if (Z.boss && !Z.bossDefeated && !Z.boss.dead) I = 1;
    M.ambush = ambushFight();
    if (M.ambush) I = Math.max(I, 0.9);
    return I;
  }

  /* ---------- Hauptschleife: Zustände, Mischung, Taktgeber ---------- */
  M.update = (dt) => {
    if (!A.ok || !M.prof || !M.out) return;
    const p = M.prof, c = A.ctx, now = c.currentTime;
    dt = Math.min(dt || 0, 0.1);
    const paused = !!(Z.paused && Z.ui && Z.ui.modalOpen);
    if (!paused) M.goal = gameIntensity(dt);
    /* Bossmusik zählt nur, solange ein Boss lebt (oder sein Einsatz gerade eingeleitet wird);
       in der Arena vor dem Auftritt bleibt es bei Spannung, nach dem Sieg wird es ruhig */
    M.bossOn = !!(p.boss && ((Z.boss && !Z.bossDefeated && !Z.boss.dead) || (M.bossLead && now < M.bossLead + 1)));
    const wait = p.boss && !M.bossOn && Z.level && Z.level.arena && !Z.bossDefeated;
    const goal = Math.max(M.goal || 0, wait ? 0.32 : 0);
    M.intensity += (goal - M.intensity) * Math.min(1, dt * (goal > M.intensity ? 2.2 : 0.5));
    const I = M.bossOn ? Math.max(0.75, M.intensity) : M.intensity;
    /* Kampf an/aus mit Hysterese */
    if (!p.calm && !paused) {
      if (!M.combat && (I >= 0.42 || M.ambush || M.bossOn)) { M.combat = true; M.calmT = 0; if (!M.bossOn) M.stinger("kampf"); }
      else if (M.combat && !M.bossOn && !M.ambush) {
        if (I < 0.2) { M.calmT += dt; if (M.calmT > 3.5) { M.combat = false; if (!(M.lastSting && M.lastSting.sieg && now - M.lastSting.sieg < 15)) M.stinger("ruhe"); } } else M.calmT = 0;
      }
    }
    if (p.calm && M.combat) M.combat = false;
    /* weiche Überblendung der Ebenen */
    const cT = M.combat ? 1 : 0;
    M.C += (cT - M.C) * Math.min(1, dt * (cT > M.C ? 2.5 : 0.35));
    const tension = p.calm ? 0 : clamp((I - 0.1) / 0.32, 0, 1) * (1 - M.C * 0.6);
    M.T = tension;
    const pm = paused ? 0.35 : 1;
    const set = (node, v, tc) => node.gain.setTargetAtTime(v, now, tc || 0.25);
    set(M.busExp, (1 - 0.45 * M.C) * (M.bossOn ? 0.6 : 1));
    set(M.busMel, 0.95 - 0.1 * M.C);
    set(M.busCol, (1 - 0.7 * M.C));
    set(M.busTen, tension * 0.9 * pm);
    set(M.busCmb, M.C * (0.62 + 0.2 * I) * pm);
    set(M.busDr, M.C * (0.45 + 0.35 * I) * pm);
    /* Teppich: im Kampf heller und lauter, bei wenig Leben dunkel */
    const P = Z.player, lowHp = P && !P.dead && Z.level && !Z.level.hub && P.hpMax ? clamp((0.32 - P.hp / P.hpMax) / 0.22, 0, 1) : 0;
    M.low += (lowHp - M.low) * Math.min(1, dt * 1.5);
    if (M.pad) M.pad.f.frequency.setTargetAtTime((600 + 1500 * M.C * I + 300 * tension) * (1 - 0.45 * M.low), now, 0.5);
    /* Pause: dumpf und leiser; wenig Leben: Tiefpass, der mit dem Puls atmet */
    M.pausedMix += ((paused ? 1 : 0) - M.pausedMix) * Math.min(1, dt * 4);
    const beatPh = (now * (p.bpm / 60)) % 1, pulse = M.low > 0.05 ? Math.exp(-beatPh * 6) : 0;
    let cut = 20000 * Math.pow(0.08, M.low * 0.9) * (1 + pulse * M.low * 0.8);
    cut = Math.min(cut, paused ? 900 : 20000);
    M.lp.frequency.setTargetAtTime(cut, now, paused ? 0.15 : 0.08);
    M.out.gain.setTargetAtTime(0.62 * (paused ? 0.6 : 1) * (1 - 0.15 * M.low), now, 0.2);
    /* Wut der Bossphase klingt langsam ab, bleibt aber, solange der Boss lebt */
    if (M.rage > 0 && !(Z.boss && !Z.bossDefeated)) M.rage = Math.max(0, M.rage - dt * 0.2);

    /* Taktgeber: Achtel, 8 je Takt, Phrase = 2 Takte, Akkordfolge = 4 Akkorde */
    const tempo = p.bpm * (p.calm ? 1 : 1 + 0.05 * M.C + 0.03 * M.rage);
    const beat = (M.beat = 60 / tempo / 2);
    if (M.next < now - 0.25) { M.next = now + 0.05; } /* nach einem Hänger (Tab im Hintergrund) nicht alles nachholen */
    let guard = 0;
    while (M.next < now + 0.16 && guard++ < 16) { scheduleStep(M.next, beat, I); M.step++; M.next += beat; }
  };

  function scheduleStep(t, beat, I) {
    const p = M.prof, st = M.step % 8, bar = Math.floor(M.step / 8), ph = M.step % 16;
    const combat = M.combat || M.C > 0.3;
    /* Harmonie: Erkundung zwei Takte je Akkord, Kampf einer */
    const slow = !combat;
    const prog = combat ? M.progC : M.progE;
    const ci = slow ? Math.floor(bar / 2) % 4 : bar % 4;
    const chord = prog[ci];
    const chordStart = st === 0 && (!slow || bar % 2 === 0);
    if (st === 0 && bar % 8 === 0 && M.step > 0) {
      /* neue Akkordfolge alle 8 Takte, nie dieselbe zweimal */
      const pool = combat ? PROG_CMB : PROG_EXP; let np; do { np = pick(pool); } while (np === prog && pool.length > 1);
      if (combat) M.progC = np; else M.progE = np;
      if (Math.random() < 0.5) M.ost = pick(OSTP);
    }
    M.chord = chord;
    const tone = (i, base) => deg(p.scale, chord + [0, 2, 4, 7][i], base);
    if (chordStart) padChord(chord, t, slow ? 0.6 : 0.18);
    if (ph === 0) planPhrase();
    const hum = () => t + rnd(-0.006, 0.01);

    /* --- Erkundung --- */
    /* Bordun: jeden Takt neu angestoßen und überlappend, damit die kurzen Aufnahmen keine Lücken lassen */
    if (st === 0) {
      const len = beat * 8 * 1.45, re = chordStart ? 1 : 0.75;
      if (p.drone === "didge") playNote("didge", p.root - 12, t, 0.32 * re, len, M.busExp); /* Didgeridoo bleibt als Orgelpunkt auf dem Grundton */
      else { playNote(p.drone, tone(0, p.root - 12), t, 0.25 * re, len, M.busExp); if (I > 0.25 || p.calm) playNote(p.drone, tone(2, p.root - 12), t, 0.12 * re, len, M.busExp); }
    }
    if (p.pad && st === 0) {
      const len = beat * 8 * 1.35;
      playNote(p.pad, tone(1, p.root + 12), t, 0.09 + I * 0.04, len, M.busExp);
      playNote(p.pad, tone(2, p.root + 12), t, 0.07 + I * 0.04, len, M.busExp);
    }
    /* Farbe: gebrochener Akkord bei Akkordwechseln, sonst seltene Einzeltöne in den Atempausen */
    if (p.col && !combat) {
      if (chordStart && Math.random() < 0.35) { const up = Math.random() < 0.6; for (let i = 0; i < 4; i++) playNote(p.col, tone(up ? i : 3 - i, p.root + 12), t + i * beat * 0.5, 0.11 - i * 0.012, beat * 4, M.busCol); }
      else if (!M.phrase && (st === 2 || st === 5) && Math.random() < 0.18) playNote(p.col, deg(p.scale, pick([0, 2, 4, 7, 9]) + chord, p.root + 19), hum(), 0.08, beat * 5, M.busCol);
    }
    /* Melodie */
    if (M.phrase) {
      for (const n of M.phrase) if (n.s === ph) {
        let d = n.d;
        if (n.s % 4 === 0) { /* betonte Zeit: auf einen Akkordton ziehen */
          const ct = [chord, chord + 2, chord + 4, chord + 7, chord - 3, chord - 5];
          let best = d, bd = 99; for (const x of ct) for (const o of [-7, 0, 7]) { const y = x + o; if (Math.abs(y - d) < bd) { bd = Math.abs(y - d); best = y; } }
          if (bd <= 1) d = best;
        }
        const calm = !combat;
        const vol = (calm ? 0.24 : 0.2 + 0.04 * I) * (n.soft ? 0.55 : 1) * (n.s % 4 === 0 ? 1 : 0.85);
        playNote(p.mel, deg(p.scale, d, p.root + 12), hum(), vol, beat * n.l * (calm ? 1.6 : 1.1) + 0.1, M.busMel);
        /* höchste Stufe: Blech verdoppelt die Melodie eine Oktave tiefer */
        if (combat && (I > 0.8 || M.rage > 0.3) && n.s % 2 === 0 && p.brass) playNote(p.brass, deg(p.scale, d, p.root), t, 0.1, beat * n.l, M.busCmb);
      }
    }

    /* --- Spannung (Gegner wach, aber noch kein Kampf) --- */
    if (!p.calm && M.T > 0.02) {
      if (st === 0 || st === 4) playNote("timpt", tone(st === 0 ? 0 : 2, p.root - 12), t, 0.2 + 0.1 * M.T, beat * 3, M.busTen);
      if (M.T > 0.45 && (st === 0 || st === 3 || st === 6)) playNote("pizz", tone(st === 6 ? 2 : 0, p.root - 12), hum(), 0.16, beat * 1.5, M.busTen);
    }

    /* --- Kampf --- */
    if (p.ost && (M.combat || M.C > 0.05)) {
      const acc = st === 0 || st === 3 || st === 6; /* 3+3+2 */
      const oi = M.ost[st];
      playNote(p.ost, tone(oi, p.root - 12), t, (acc ? 0.22 : 0.14) + 0.04 * I, beat * 0.95, M.busCmb);
      if (I > 0.7 && acc) playNote(p.ost, tone(oi, p.root), t, 0.1, beat * 0.9, M.busCmb);
      if (st === 0 || (I > 0.65 && (st === 3 || st === 6))) playNote(p.bass, tone(0, p.root - 24), t, st === 0 ? 0.3 : 0.2, beat * (st === 0 ? 3 : 2.2), M.busCmb);
      if (chordStart && p.brass && (I > 0.55 || M.bossOn)) for (let i = 0; i < 3; i++) playNote(p.brass, tone(i, p.root), t + i * 0.008, 0.11, beat * 1.6, M.busCmb);
      if ((I > 0.85 || M.bossOn || M.rage > 0) && st === 0) for (const i of [1, 2]) playNote("vlntrem", tone(i, p.root + 24), t, 0.06 + 0.03 * M.rage, beat * 8.4, M.busCmb);
      if ((M.bossOn || M.ambush || M.rage > 0) && st === 0 && bar % 2 === 0) for (const i of [0, 1, 2]) playNote("aah", tone(i, p.root + 12), t, 0.07, beat * 16, M.busCmb);
      /* Trommeln */
      const [lo, mid, hi] = p.dr || [];
      if (lo) {
        if (st === 0) hit(lo, t, 0.75);
        if (I > 0.35 && (st === 3 || st === 6)) hit(lo, t, 0.45, 1.06);
      }
      if (mid) {
        if (I > 0.5 && st === 4) hit(mid, t, 0.5);
        const fill = bar % 4 === 3 && I > 0.6;
        if (fill && st >= 5) { hit(mid, t, 0.3 + (st - 5) * 0.08, 1.15); hit(mid, t + beat / 2, 0.25 + (st - 5) * 0.08, 1.2); }
      }
      if (hi && (I > 0.72 || M.rage > 0.3) && st % 2 === 1) hit(hi, hum(), hi === "amboss" ? 0.12 : 0.22, 1 + rnd(-0.03, 0.03));
      if (bar % 8 === 7 && st === 4 && I > 0.6) hit("timproll", t, 0.22);
    }
  }

  /* ---------- Stinger und Akzente ---------- */
  /* nächster Rasterpunkt des Taktgebers (div Achtel; 0.5 = Sechzehntel), damit Stinger im Takt sitzen */
  function grid(div) {
    const now = A.ctx.currentTime + 0.03, beat = M.beat || 0.3;
    if (!M.prof || M.next < now - beat) return now;
    let t = M.next, s = M.step;
    if (div < 1) { while (t - beat * 0.5 > now) t -= beat * 0.5; return t; }
    while (t - beat > now) { t -= beat; s--; }
    while (s % div !== 0 || t < now) { t += beat; s++; }
    return t;
  }
  const q16 = () => grid(0.5);
  /* Rückwärts-Becken, das genau zum Zeitpunkt „at“ seinen Höhepunkt erreicht */
  function swell(at, vol) {
    const path = K("crash"), b0 = A.buf[path]; if (!b0) { if (b0 === undefined) A.load(path); return; }
    const b = reversed(path, b0), c = A.ctx, now = c.currentTime + 0.02, start = Math.max(now, at - b.duration);
    const off = start - (at - b.duration);
    const s = c.createBufferSource(); s.buffer = b; const g = c.createGain();
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(vol, start + 0.3); s.connect(g); g.connect(M.busSt);
    track(s, g); s.start(start, off);
  }
  M.stinger = (kind, o) => {
    if (!A.ok || !M.out) return;
    const p = M.prof || PROF.torhof, now = A.ctx.currentTime, t = Math.max(q16(), now + 0.03), beat = M.beat || 60 / p.bpm / 2;
    M.lastSting = M.lastSting || {};
    const gap = { kampf: 6, ruhe: 8, kette: 0.2, truhe: 1, seite: 2 }[kind] || 1.5;
    if (M.lastSting[kind] && now - M.lastSting[kind] < gap) return;
    M.lastSting[kind] = now; M.stats.stingers[kind] = (M.stats.stingers[kind] || 0) + 1;
    const ch = M.chord || 0, tn = (i, base, c2) => deg(p.scale, (c2 == null ? ch : c2) + [0, 2, 4, 7][i], base), B = M.busSt;
    switch (kind) {
      case "kampf": { /* Einsatz: tiefer Schlag, Becken, Blechstoß – auf die nächste Viertel */
        const tq = grid(2);
        if (p.dr) hit(p.dr[0], tq, 0.8, 0.94, B);
        hit("crash", tq, 0.16, 0.9, B);
        if (p.brass) for (let i = 0; i < 3; i++) playNote(p.brass, tn(i, p.root), tq, 0.13, beat * 2.5, B, 1);
        playNote("pizz", tn(0, p.root - 12), tq, 0.2, beat * 2, B, 1);
        break;
      }
      case "ruhe": /* Kampf vorbei: Chor-Akkord auf der Tonika, Harfe fällt herab */
        for (const i of [0, 1, 2]) playNote(p.pad || "ooh", tn(i, p.root + 12, 0), t, 0.1, 4.5, B, 1);
        for (let i = 0; i < 5; i++) playNote("harfe", deg(p.scale, 9 - i * 2, p.root + 12), t + 0.2 + i * 0.16, 0.12, 2.5, B, 1);
        break;
      case "boss": { /* Rückwärts-Becken atmet bis zum Einsatz, Paukenwirbel darunter */
        let at = M.bossLead && M.bossLead > now + 0.3 ? M.bossLead : grid(8);
        while (at < now + 1.2) at += beat * 8;
        swell(at, 0.3);
        hit("timproll", Math.max(now + 0.02, at - 1.5), 0.25, 1, B);
        if (p.dr) hit(p.dr[0], at, 0.9, 0.9, B);
        hit("gong", at, 0.25, 0.8, B);
        for (const i of [0, 1, 2]) playNote("aah", tn(i, p.root + 12, 0), at, 0.12, 3.5, B, 1);
        break;
      }
      case "hinterhalt": { /* Falle schnappt zu: harter Stoß, dissonanter Blechcluster */
        if (M.prof && M.prof.dr) hit(M.prof.dr[0], t, 0.9, 0.85, B);
        hit("crash", t, 0.2, 0.8, B);
        const b = p.brass || "hornst";
        playNote(b, p.root, t, 0.13, 1.2, B, 1); playNote(b, p.root + 1, t, 0.1, 1.2, B, 1); playNote(b, p.root + 6, t, 0.1, 1.2, B, 1);
        M.heat = Math.max(M.heat, 0.9);
        break;
      }
      case "phase": { /* Bossphase: Paukenwirbel → Schlag, Blech eine Stufe höher, Wut steigt */
        hit("timproll", t, 0.3, 1, B);
        const tt = t + 1.0;
        if (p.dr) hit(p.dr[0], tt, 0.9, 0.88, B);
        hit("crash", tt, 0.2, 1, B);
        const b = p.brass || "blech";
        for (let i = 0; i < 3; i++) playNote(b, tn(i, p.root + 1), tt, 0.14, 2, B, 1);
        M.rage = Math.min(1, M.rage + 0.6);
        break;
      }
      case "sieg": { /* Boss besiegt: aufgehellter Schlussakkord (Pikardie-Terz) */
        hit("crash", t, 0.2, 1, B);
        if (p.dr) hit(p.dr[0], t, 0.8, 1, B);
        const r = p.root, maj = [r, r + 4, r + 7, r + 12];
        const b = p.brass || "blech";
        [0, 0.18, 0.36].forEach((d, i) => playNote(b, maj[i], t + d, 0.13, 0.5, B, 1));
        maj.forEach(m => playNote(b, m, t + 0.6, 0.12, 3.2, B, 1));
        maj.forEach(m => playNote("aah", m + 12, t + 0.6, 0.08, 4, B, 1));
        for (let i = 0; i < 6; i++) playNote("harfe", maj[i % 4] + 12 * (1 + Math.floor(i / 4)), t + 0.6 + i * 0.09, 0.1, 2.5, B, 1);
        break;
      }
      case "tod": /* tiefer Chor sinkt herab */
        [0, -2, -4].forEach((d, i) => playNote("ooh", deg(p.scale, d, p.root + 12), t + i * 0.9, 0.12, 2.4, B, 1));
        playNote("vc", p.root - 12, t, 0.2, 4, B, 1);
        hit("gong", t + 0.1, 0.18, 0.7, B);
        break;
      case "seite": { /* Tagebuchseite: geheimnisvolles Celesta-Motiv über leisem Chor */
        const mot = [4, 2, 7, 6];
        mot.forEach((d, i) => playNote("cel", deg(p.scale, d, p.root + 24), t + i * 0.22, 0.13, 2.2, B, 1));
        playNote("ooh", tn(0, p.root + 12, 0), t, 0.08, 3.5, B, 1); playNote("ooh", tn(2, p.root + 12, 0), t, 0.06, 3.5, B, 1);
        break;
      }
      case "truhe": { /* Truhe: Harfenglissando hinauf und ein Glockenfunkeln */
        for (let i = 0; i < 7; i++) playNote("harfe", deg(p.scale, i, p.root + 12), t + i * 0.045, 0.08 + i * 0.006, 1.6, B, 1);
        playNote("glock", deg(p.scale, 7, p.root + 24), t + 0.34, 0.09, 2, B, 1);
        break;
      }
      case "kette": { /* Killkette: jeder weitere Treffer eine Stufe höher, ab fünf ein kleiner Blechruf */
        const n = (o && o.n) || 2;
        playNote("glock", deg(p.scale, Math.min(n, 9) + 2, p.root + 24), t, 0.07 + Math.min(0.05, n * 0.006), 1.4, B, 1);
        if (n === 5 || n === 10 || n === 15 || n === 25) {
          const b = "trpst", s = [0, 2, 4];
          s.forEach((d, i) => playNote(b, deg(p.scale, d, p.root + 12), t + i * beat * 0.5, 0.1, beat * (i === 2 ? 2 : 0.6), B, 1));
          M.heat = Math.max(M.heat, 0.7);
        }
        break;
      }
    }
  };

  /* ---------- Kulisse der Bühne ---------- */
  const AMB = (Z.ambience = { biome: null, timers: [] });
  AMB.set = (B, arena) => {
    if (!A.ok) return;
    if (AMB.biome === B) return;
    AMB.biome = B; A.stopAllLoops(1.2); AMB.heart = false;
    if (!B || !B.amb) { AMB.timers = []; return; }
    B.amb.loops.forEach((l, i) => A.loop("amb" + i, l[0], l[1] * (arena ? 0.6 : 1), A.amb));
    AMB.timers = (B.amb.one || []).map(([pre, n, every]) => ({ pre, n, every, t: every * (0.3 + Math.random()) }));
    /* Raumklang setzt klang.js je Gebiet; ohne klang.js der alte Grundwert */
    if (!(Z.klang && Z.klang.raum)) A.setVerb(B.out ? 0.12 : 0.3);
  };
  AMB.update = (dt) => {
    if (!A.ok) return;
    /* Kulisse tritt im Kampf zurück; bei wenig Leben schlägt das Herz */
    const I = Math.max(M.C || 0, (M.intensity || 0) * 0.6);
    A.amb.gain.setTargetAtTime(A.vol.amb * (1 - 0.45 * I), A.ctx.currentTime, 0.5);
    const P = Z.player, low = P && !P.dead && Z.level && !Z.level.hub && P.hp < P.hpMax * 0.3;
    if (low && !AMB.heart) { AMB.heart = true; A.loop("herz", "amb/a_herzschlag.mp3", 0.55, A.sfx); }
    else if (!low && AMB.heart) { AMB.heart = false; A.stopLoop("herz", 0.8); }
    for (const tm of AMB.timers) {
      tm.t -= dt;
      if (tm.t <= 0) { tm.t = tm.every * (0.6 + Math.random() * 0.9); const i = 1 + Math.floor(Math.random() * tm.n); const path = "amb/" + tm.pre + i + ".mp3"; if (!A.buf[path]) { A.load(path); continue; } A.play(path, { vol: 0.25 + Math.random() * 0.2, pan: (Math.random() - 0.5) * 1.6, bus: A.amb, verb: 0.8, vary: 0.1 }); }
    }
  };
})();
