/* Ezekiel – The Destroyer · Musik und Klangkulisse
   Erzeugt die Musik live aus echten Instrumentaufnahmen (klang/): Bordun, Chor, Trommeln, Melodie.
   Die Intensität folgt dem Kampf: ruhig beim Erkunden, Trommeln bei Gegnern, alles bei Bossen.
   Dazu die Geräuschkulissen der Bühne (amb/) als Schleifen und zufällige Einzelgeräusche. */
(function () {
  "use strict";
  const Z = window.Z, A = Z.audio;
  const K = n => "klang/" + n + ".mp3";
  /* verfügbare Tonhöhen je Instrument (MIDI-Nummern der Aufnahmen) */
  const INST = {
    vc: [36, 40, 43, 47, 50, 53, 57, 60, 64, 67, 71, 74, 77], vctrem: [36, 40, 43, 50, 53, 57, 59, 60, 64, 67, 71, 74, 77],
    ooh: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78], aah: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81],
    rorg: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88],
    orgel: [36, 42, 48, 54, 60, 66, 72, 78, 84], eh: [52, 55, 58, 61, 64, 67, 70, 73, 76, 79], harfe: [28, 31, 35, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86],
    koto: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78], hpan: [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
    cel: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90], kal: [60, 63, 66, 69, 72, 75, 78, 81, 84], bra: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84],
    blech: [46, 49, 52, 55, 58, 61, 64, 67, 70, 73, 76, 79, 82], tuba: [34, 39, 41, 46, 50, 53, 58], hornst: [33, 36, 39, 43, 46, 50, 53, 57, 60, 74, 77], timpt: [36, 39, 42, 45, 48, 51, 54, 57],
    rgl: [60, 63, 66, 69, 72, 75, 78], mar: [45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75], dudel: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87]
  };
  function nearest(inst, midi) { const l = INST[inst]; let best = l[0]; for (const n of l) if (Math.abs(n - midi) < Math.abs(best - midi)) best = n; return best; }
  function playNote(inst, midi, when, vol, dur, bus) {
    if (!A.ok) return;
    const n = nearest(inst, midi), path = K(inst + "_" + n), b = A.buf[path];
    if (!b) { if (b === undefined) A.load(path); return; }
    const s = A.ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = Math.pow(2, (midi - n) / 12);
    const g = A.ctx.createGain(); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + Math.min(0.08, dur * 0.2));
    g.gain.setValueAtTime(vol, when + dur * 0.7); g.gain.linearRampToValueAtTime(0, when + dur);
    s.connect(g); g.connect(bus || M.bus); const vg = A.ctx.createGain(); vg.gain.value = 0.5; g.connect(vg); vg.connect(A.verb);
    s.start(when); s.stop(when + dur + 0.05);
  }
  function hit(name, when, vol, rate) {
    if (!A.ok) return; const path = K(name), b = A.buf[path]; if (!b) { if (b === undefined) A.load(path); return; }
    const s = A.ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate || 1; const g = A.ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(M.drums); s.start(when);
  }
  /* Tonleitern */
  const SC = { moll: [0, 2, 3, 5, 7, 8, 10], dorisch: [0, 2, 3, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], pent: [0, 3, 5, 7, 10], hpan: [0, 2, 3, 5, 7, 8, 10] };
  /* Profile je Gebiet: Grundton, Tempo, Bordun, Chor, Melodie, Trommeln, Leiter */
  const PROF = {
    lager: { root: 50, bpm: 66, drone: "vc", pad: null, mel: "hpan", scale: "hpan", drums: [], calm: true },
    passage: { root: 50, bpm: 60, drone: "vc", pad: "ooh", mel: "hpan", scale: "hpan", drums: [], calm: true },
    torhof: { root: 50, bpm: 92, drone: "vc", pad: "ooh", mel: "eh", scale: "dorisch", drums: ["taiko_36", "timp1"] },
    keller: { root: 45, bpm: 84, drone: "rorg", pad: "ooh", mel: "koto", scale: "phryg", drums: ["riese1", "bodh1"] },
    hallen: { root: 48, bpm: 96, drone: "orgel", pad: "aah", mel: "bra", scale: "harm", drums: ["timp1", "marsch1"] },
    wehrgang: { root: 52, bpm: 104, drone: "vc", pad: "aah", mel: "hornst", scale: "dorisch", drums: ["marsch2", "taiko_42"] },
    verlies: { root: 43, bpm: 78, drone: "vctrem", pad: "ooh", mel: "cel", scale: "phryg", drums: ["riese2", "bodh2"] },
    hafen: { root: 50, bpm: 98, drone: "vc", pad: "ooh", mel: "dudel", scale: "dorisch", drums: ["bodh1", "taiko_48"] },
    glocken: { root: 47, bpm: 100, drone: "rorg", pad: "aah", mel: "rgl", scale: "moll", drums: ["timp3", "marsch1"] },
    schlund: { root: 44, bpm: 82, drone: "vctrem", pad: "ooh", mel: "kal", scale: "phryg", drums: ["riese1", "taiko_36"] },
    schmiede: { root: 46, bpm: 108, drone: "vc", pad: "aah", mel: "mar", scale: "harm", drums: ["taiko_42", "riese3"] },
    zinnen: { root: 49, bpm: 112, drone: "vctrem", pad: "aah", mel: "blech", scale: "harm", drums: ["taiko_36", "timp5"] },
    see: { root: 41, bpm: 80, drone: "rorg", pad: "ooh", mel: "harfe", scale: "phryg", drums: ["riese2", "bodh2"] },
    glut: { root: 45, bpm: 114, drone: "vc", pad: "aah", mel: "blech", scale: "harm", drums: ["taiko_48", "riese3"] },
    sturm: { root: 47, bpm: 110, drone: "vctrem", pad: "aah", mel: "eh", scale: "moll", drums: ["timp1", "taiko_36"] },
    boss1: { root: 45, bpm: 126, drone: "vctrem", pad: "aah", mel: "blech", scale: "harm", drums: ["taiko_36", "riese1", "timp1"], boss: true },
    final: { root: 41, bpm: 132, drone: "vctrem", pad: "aah", mel: "hornst", scale: "harm", drums: ["riese1", "taiko_36", "timp5"], boss: true }
  };
  const M = (Z.music = { prof: null, id: null, next: 0, step: 0, intensity: 0, target: 0, bus: null, drums: null, bar: 0, motif: null });
  M.init = () => {
    if (!A.ok || M.bus) return;
    M.bus = A.ctx.createGain(); M.bus.gain.value = 0.55; M.bus.connect(A.mus);
    M.drums = A.ctx.createGain(); M.drums.gain.value = 0; M.drums.connect(A.mus);
    M.padBus = A.ctx.createGain(); M.padBus.gain.value = 0.3; M.padBus.connect(A.mus);
  };
  M.set = (id) => {
    M.init(); if (!A.ok) return;
    if (M.id === id) return;
    M.id = id; M.prof = PROF[id] || PROF.torhof; M.step = 0; M.bar = 0; M.next = A.ctx.currentTime + 0.3;
    /* Motiv: kurze Folge von Tonleiterstufen, die sich durch das Gebiet zieht */
    const R = Z.Rng(id.length * 131 + id.charCodeAt(0));
    M.motif = Array.from({ length: 8 }, () => (R() < 0.25 ? null : R.int(0, 6)));
    M.chords = [0, R.pick([3, 5]), R.pick([4, 5, 6]), R.pick([0, 3])];
    /* Vorladen */
    const p = M.prof; [p.drone, p.pad, p.mel].filter(Boolean).forEach(inst => INST[inst].forEach(n => { if (Math.abs(n - p.root) < 26) A.load(K(inst + "_" + n)); }));
    p.drums.forEach(d => A.load(K(d)));
  };
  M.stop = () => { M.id = null; M.prof = null; };
  const deg = (scale, i, root) => { const s = SC[scale]; const o = Math.floor(i / s.length); return root + s[((i % s.length) + s.length) % s.length] + 12 * o; };
  M.update = (dt) => {
    if (!A.ok || !M.prof || !M.bus) return;
    const p = M.prof;
    M.intensity += (M.target - M.intensity) * Math.min(1, dt * (M.target > M.intensity ? 1.6 : 0.35));
    M.drums.gain.setTargetAtTime(p.calm ? 0 : Math.max(p.boss ? 0.55 : 0, M.intensity) * 0.75, A.ctx.currentTime, 0.3);
    const beat = 60 / p.bpm / 2; /* Achtel */
    const now = A.ctx.currentTime;
    while (M.next < now + 0.15) {
      const t = M.next, st = M.step % 16, bar = Math.floor(M.step / 16);
      const chord = M.chords[bar % 4];
      const I = p.boss ? Math.max(0.7, M.intensity) : M.intensity;
      /* Bordun am Taktanfang */
      if (st === 0) { playNote(p.drone, deg(p.scale, chord, p.root - 12), t, 0.32, beat * 16.5); if (I > 0.3 || p.calm) playNote(p.drone, deg(p.scale, chord + 4, p.root - 12), t, 0.16, beat * 16.5); }
      if (p.pad && st === 0 && (bar % 2 === 0)) { playNote(p.pad, deg(p.scale, chord + 2, p.root + 12), t, 0.12 + I * 0.08, beat * 32, M.padBus); playNote(p.pad, deg(p.scale, chord + 4, p.root + 12), t, 0.09 + I * 0.06, beat * 32, M.padBus); }
      /* Melodie: ruhig spärlich, im Kampf dichter */
      const m = M.motif[st % 8];
      const dens = p.calm ? 0.35 : 0.18 + I * 0.5;
      if (m != null && (st % 2 === 0 || I > 0.6) && Math.random() < dens) playNote(p.mel, deg(p.scale, m + chord + (I > 0.7 && st > 8 ? 2 : 0), p.root + (p.mel === "hpan" ? 12 : 12)), t, p.calm ? 0.28 : 0.22, beat * (p.calm ? 6 : 3));
      /* Trommeln */
      if (!p.calm && p.drums.length) {
        if (st % 8 === 0) hit(p.drums[0], t, 0.9);
        if (I > 0.35 && (st === 6 || st === 10 || st === 14)) hit(p.drums[1], t, 0.55);
        if (I > 0.6 && st % 2 === 1 && Math.random() < 0.5) hit(p.drums[1], t, 0.3, 1.3);
        if (p.drums[2] && I > 0.8 && st === 12) hit(p.drums[2], t, 0.7);
      }
      M.step++; M.next += beat;
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
    A.setVerb(B.out ? 0.12 : 0.3);
  };
  AMB.update = (dt) => {
    if (!A.ok) return;
    /* Kulisse tritt im Kampf zurück; bei wenig Leben schlägt das Herz */
    const I = M.intensity || 0;
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
