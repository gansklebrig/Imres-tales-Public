/* Ezekiel – The Destroyer · Raumklang und musikalische Akzente
   1. Raumklang je Gebiet: große Hallen bekommen einen langen, dunklen Hall (eigene Impulsantwort),
      Keller und Grüfte einen Tropfhall (Rückkopplungs-Echo) samt prozedural erzeugten Wassertropfen,
      Freiflächen bleiben trocken. Die Sende-Anteile hängen hinter den Lautstärkereglern (Effekte, Kulisse, Musik).
   2. Ereignisse aus dem Spiel werden beobachtet (ohne andere Dateien anzufassen) und lösen Stinger der Musik aus:
      Tagebuchseite, Truhe, Bossauftritt, Bossphase, Bosssieg, Tod, Killketten (Stufen 3/5/8/12/20),
      Elite-Sichtung, seltene/legendäre Beute, geschaffte Herausforderung oder Prüfung. */
(function () {
  "use strict";
  const Z = window.Z, A = Z.audio, M = Z.music;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  /* Raumtypen: verb = allgemeiner Hall von Z.audio, hall = großer Hall, echo = Tropfhall, drip = Tropfen je Sekunde */
  const RAUM = {
    frei:   { verb: 0.1, hall: 0, echo: 0, delay: 0.3, fb: 0.2, drip: 0 },
    lager:  { verb: 0.07, hall: 0, echo: 0, delay: 0.3, fb: 0.2, drip: 0 },
    halle:  { verb: 0.2, hall: 0.6, echo: 0, delay: 0.3, fb: 0.2, drip: 0 },
    turm:   { verb: 0.2, hall: 0.45, echo: 0.12, delay: 0.46, fb: 0.3, drip: 0 },
    esse:   { verb: 0.18, hall: 0.3, echo: 0.06, delay: 0.19, fb: 0.25, drip: 0 },
    keller: { verb: 0.26, hall: 0.12, echo: 0.34, delay: 0.27, fb: 0.38, drip: 0.35 },
    gang:   { verb: 0.24, hall: 0.05, echo: 0.22, delay: 0.21, fb: 0.3, drip: 0.15 },
    gruft:  { verb: 0.28, hall: 0.32, echo: 0.4, delay: 0.43, fb: 0.44, drip: 0.25 }
  };
  const BIOME_RAUM = { torhof: "frei", wehrgang: "frei", zinnen: "frei", sturm: "frei", hafen: "frei", hallen: "halle", glocken: "turm", schmiede: "esse", glut: "esse", keller: "keller", verlies: "keller", schlund: "gruft", see: "gruft", lager: "lager", passage: "gang" };
  const ARENA_RAUM = { lab: "keller", pier: "frei", tower: "turm", lakeboss: "gruft", hoard: "halle", towertop: "frei" };

  const KL = (Z.klang = { raum: null, drips: 0, stats: { drips: 0 } });
  let net = null;

  /* Impulsantwort für große Hallen: Vorverzögerung, frühe Reflexionen, dann ein Rauschschweif,
     der mit der Zeit dunkler wird (Luft und Stein schlucken die Höhen) */
  function hallIR(c, sec) {
    const sr = c.sampleRate, len = Math.floor(sr * sec), pre = Math.floor(sr * 0.028), ir = c.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch); let lp = 0;
      for (let i = pre; i < len; i++) {
        const x = (i - pre) / (len - pre), k = 0.55 + 0.42 * x; /* Dämpfung nimmt zu */
        lp = lp * k + (Math.random() * 2 - 1) * (1 - k);
        d[i] = lp * Math.pow(1 - x, 2.4) * 2.2;
      }
      for (let r = 0; r < 7; r++) { const at = pre + Math.floor(sr * (0.012 + r * 0.017 + Math.random() * 0.01)); if (at < len) d[at] += (Math.random() < 0.5 ? -1 : 1) * (0.5 - r * 0.05); }
    }
    return ir;
  }
  function build() {
    if (net || !A.ok) return net;
    const c = A.ctx; net = {};
    /* großer Hall */
    net.hall = c.createConvolver(); net.hall.buffer = hallIR(c, 4.2);
    net.hallOut = c.createGain(); net.hallOut.gain.value = 0.5; net.hall.connect(net.hallOut); net.hallOut.connect(A.master);
    /* Tropfhall: Verzögerung mit gefilterter Rückkopplung, leicht nach rechts versetzt, zweite Linie links */
    net.dl = c.createDelay(1.5); net.dl.delayTime.value = 0.27;
    net.dl2 = c.createDelay(1.5); net.dl2.delayTime.value = 0.27 * 1.5;
    net.fbLp = c.createBiquadFilter(); net.fbLp.type = "lowpass"; net.fbLp.frequency.value = 2400;
    net.fbHp = c.createBiquadFilter(); net.fbHp.type = "highpass"; net.fbHp.frequency.value = 220;
    net.fb = c.createGain(); net.fb.gain.value = 0.35;
    net.dl.connect(net.fbLp); net.fbLp.connect(net.fbHp); net.fbHp.connect(net.fb); net.fb.connect(net.dl);
    net.echoOut = c.createGain(); net.echoOut.gain.value = 0.55;
    const pr = c.createStereoPanner ? c.createStereoPanner() : null, pl = c.createStereoPanner ? c.createStereoPanner() : null;
    if (pr && pl) { pr.pan.value = 0.45; pl.pan.value = -0.45; net.fbHp.connect(pr); pr.connect(net.echoOut); net.fbHp.connect(net.dl2); net.dl2.connect(pl); pl.connect(net.echoOut); }
    else net.fbHp.connect(net.echoOut);
    net.echoOut.connect(A.master);
    /* Sende-Wege hinter den Lautstärkereglern */
    const send = (from, to) => { const g = c.createGain(); g.gain.value = 0; from.connect(g); g.connect(to); return g; };
    net.sH = { sfx: send(A.sfx, net.hall), amb: send(A.amb, net.hall), mus: send(A.mus, net.hall) };
    net.sE = { sfx: send(A.sfx, net.dl), amb: send(A.amb, net.dl), mus: send(A.mus, net.dl) };
    /* eigener Bus für die erzeugten Tropfen (hängt an der Kulissen-Lautstärke) */
    net.drip = c.createGain(); net.drip.gain.value = 1; net.drip.connect(A.amb);
    return net;
  }
  /* Raum anwenden: alle Werte gleiten weich hinüber */
  KL.setRaum = (name) => {
    if (!build()) return;
    const R = RAUM[name] || RAUM.frei, c = A.ctx, now = c.currentTime, tc = 0.6;
    KL.raum = name; KL.R = R;
    A.setVerb(R.verb);
    net.sH.sfx.gain.setTargetAtTime(R.hall * 0.45, now, tc); net.sH.amb.gain.setTargetAtTime(R.hall * 0.5, now, tc); net.sH.mus.gain.setTargetAtTime(R.hall * 0.4, now, tc);
    net.sE.sfx.gain.setTargetAtTime(R.echo * 0.3, now, tc); net.sE.amb.gain.setTargetAtTime(R.echo, now, tc); net.sE.mus.gain.setTargetAtTime(R.echo * 0.1, now, tc);
    net.dl.delayTime.setTargetAtTime(R.delay, now, 0.3); net.dl2.delayTime.setTargetAtTime(R.delay * 1.5, now, 0.3);
    net.fb.gain.setTargetAtTime(R.fb, now, tc);
  };
  function raumFor(lv) {
    if (!lv) return "frei";
    if (lv.hub) return "lager";
    if (lv.passage) return "gang";
    if (lv.arena && Z.ARENAS && Z.ARENAS[lv.arena]) return ARENA_RAUM[Z.ARENAS[lv.arena].kind] || BIOME_RAUM[lv.biome] || "frei";
    return BIOME_RAUM[lv.biome] || "frei";
  }

  /* Wassertropfen: Sinus mit schnell steigender Tonhöhe („Plink“), läuft durch den Tropfhall */
  function drip() {
    const c = A.ctx, t = c.currentTime + 0.01, f = 900 + Math.random() * 1500;
    const o = c.createOscillator(), g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null;
    o.type = "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * (1.6 + Math.random() * 0.6), t + 0.045);
    const v = 0.05 + Math.random() * 0.06;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.11);
    o.connect(g); let last = g;
    if (p) { p.pan.value = (Math.random() - 0.5) * 1.6; g.connect(p); last = p; }
    last.connect(net.drip);
    KL.drips++; KL.stats.drips++;
    o.onended = () => { KL.drips--; try { o.disconnect(); g.disconnect(); p && p.disconnect(); } catch (_) {} };
    o.start(t); o.stop(t + 0.14);
    /* manchmal ein zweiter, kleinerer Tropfen hinterher */
    if (Math.random() < 0.25) setTimeout(() => { if (A.ok && KL.R && KL.R.drip && !Z.paused) drip(); }, 180 + Math.random() * 300);
  }

  /* ---------- Beobachter ---------- */
  const W = { lv: null, pages: 0, kills: 0, chain: 0, chainT: 0, boss: null, phase: 0, won: false, dead: false, seenChest: new WeakSet(), seenElite: new WeakSet(), seenLoot: new WeakSet(), chall: 0, trials: 0, dripT: 2 };
  /* liegt ein Punkt im Bild (mit etwas Rand)? */
  const onCam = (x, y, m) => { const c = Z.cam; if (!c) return true; m = m || 0; return x > c.x - m && x < c.x + c.w + m && y > c.y - m && y < c.y + c.h + m; };
  const pageCount = () => (Z.meta && Z.meta.tagebuch ? Object.keys(Z.meta.tagebuch).length : 0);
  function onLevel(lv) {
    W.lv = lv; W.pages = pageCount(); W.kills = (Z.stats && Z.stats.kills) || 0; W.chain = 0; W.chainT = 0;
    W.boss = Z.boss || null; W.phase = (Z.boss && Z.boss.phase) || 0; W.won = !!Z.bossDefeated; W.dead = !!(Z.player && Z.player.dead);
    for (const p of Z.pickups || []) { if (p.open) W.seenChest.add(p); }
    W.chall = (Z.stats && Z.stats.challenges) || 0; W.trials = (Z.stats && Z.stats.pruefungen) || 0;
    KL.setRaum(raumFor(lv));
  }
  KL.tick = (dt) => {
    if (!A.ok || !M.out) return;
    const lv = Z.level; if (!lv) return;
    if (lv !== W.lv) onLevel(lv);
    if (Z.paused) return;
    const P = Z.player;
    /* Tagebuchseite */
    const pc = pageCount();
    if (pc > W.pages) M.stinger("seite");
    W.pages = pc;
    /* Truhen (auch verfluchte) */
    for (const p of Z.pickups || []) if ((p.kind === "chest" || p.kind === "cursed") && p.open && !W.seenChest.has(p)) { W.seenChest.add(p); M.stinger("truhe"); }
    /* Boss: Auftritt, Phasen, Sieg */
    const b = Z.boss && !Z.boss.dead && !Z.bossDefeated ? Z.boss : null;
    if (b && b !== W.boss) { W.phase = b.phase || 0; if (!(M.lastSting && M.lastSting.boss && A.ctx.currentTime - M.lastSting.boss < 4)) M.stinger("boss"); }
    if (b && (b.phase || 0) > W.phase) { W.phase = b.phase; M.stinger("phase"); }
    W.boss = b || (Z.bossDefeated ? W.boss : null);
    if (Z.bossDefeated && !W.won && Z.boss) {
      M.stinger("sieg");
      /* Wächter mitten im Gebiet besiegt: nach dem Schlussakkord zurück zur Musik des Gebiets */
      const l0 = lv;
      if (!lv.arena && !lv.hub && !lv.passage) setTimeout(() => { if (Z.level === l0 && M.prof && M.prof.boss) M.set(l0.biome); }, 4500);
    }
    W.won = !!Z.bossDefeated;
    /* Tod */
    const dead = !!(P && P.dead);
    if (dead && !W.dead) M.stinger("tod");
    W.dead = dead;
    /* Killketten: Gegner, die kurz nacheinander fallen – Intensität steigt, Stinger nur auf den Stufen */
    const k = (Z.stats && Z.stats.kills) || 0;
    if (k < W.kills) W.kills = k; /* neuer Lauf */
    if (k > W.kills) {
      const n = k - W.kills, prev = W.chain; W.kills = k;
      W.chain = W.chainT > 0 ? W.chain + n : n; W.chainT = 2.6;
      if (!dead && M.chainHit && W.chain >= 3) M.chainHit(W.chain, prev); /* Mehrfach-Kill: nur die höchste erreichte Stufe erklingt */
    }
    if (W.chainT > 0) { W.chainT -= dt; if (W.chainT <= 0) { W.chain = 0; M.chainEnd && M.chainEnd(); } }
    /* Elite gesichtet: das erste Mal im Bild und wach (oder schon recht nah) */
    if (P && !dead) for (const e of Z.enemies || []) {
      if (!e.elite || e.dead || e.ally || e.dummy || W.seenElite.has(e)) continue;
      const ex = e.x + (e.w || 0) / 2, ey = e.y + (e.h || 0) / 2;
      if (!onCam(ex, ey, -8)) continue;
      if (e.aware || Math.hypot(ex - P.x, ey - P.y) < 220) { W.seenElite.add(e); M.stinger("elite"); M.push && M.push(0.5, 5); }
    }
    /* seltene Beute: ein sehr seltener oder legendärer Gegenstand liegt neu im Bild */
    for (const p of Z.pickups || []) {
      if (p.kind !== "item" || !p.it || W.seenLoot.has(p) || !onCam(p.x, p.y, 8)) continue;
      W.seenLoot.add(p);
      if ((p.it.rar || 0) >= 2 && !p.it.cursed) M.stinger("beute", { rar: p.it.rar });
    }
    /* Herausforderung (bilanz.js) oder Prüfungskammer (erkundung.js) geschafft */
    const ch = (Z.stats && Z.stats.challenges) || 0, tr = (Z.stats && Z.stats.pruefungen) || 0;
    if ((ch > W.chall || tr > W.trials) && !dead) M.stinger("geschafft");
    W.chall = ch; W.trials = tr;
    /* Tropfen im Keller und in Grüften */
    if (KL.R && KL.R.drip > 0 && net && KL.drips < 6) {
      W.dripT -= dt;
      if (W.dripT <= 0) { W.dripT = (0.6 + Math.random() * 1.8) / KL.R.drip; drip(); }
    }
  };

  /* in den Takt der Musik einhängen (läuft auch während der Pause weiter) */
  const upd0 = M.update;
  M.update = function (dt) { const r = upd0.apply(this, arguments); try { KL.tick(dt || 0); } catch (e) { if (!KL.err) { KL.err = 1; console.error(e); } } return r; };
})();
