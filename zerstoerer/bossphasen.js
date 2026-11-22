/* Ezekiel – The Destroyer · Bossphasen
   Jeder Boss und Wächter kämpft in mehreren Phasen (Wächter: 66 % / 33 %, Endbosse: 70 % / 40 % / 15 %).
   Phasenwechsel: kurze Unverwundbarkeit, Aufladen, Brüllen, Beben, Farbwechsel der Aura, Phasenname mit Zitat.
   Jede Phase bringt neue, benannte Techniken mit klarer Vorwarnung, schnellere Muster und Veränderungen der Arena.
   Grundsatz: sehr stark – aber jede Technik ist lesbar und ohne Treffer ausweichbar (Laufen, Springen, Ducken, Rollen).
   Aufbau: 1. Zeitplaner & Vorwarnungen · 2. Phasenmaschine · 3. Bausteine · 4. Bosse · 5. Zeichnen & Verkabelung */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v), R = () => Z.R();
  const K = Z.bossKit, B = Z.BOSSDEF, TAU = Math.PI * 2;
  if (!K || !B) return;
  const { cxOf, feet, dmg, melee, box, face, grav, summon } = K;
  const AR = () => K.arena();
  const pcx = P => P.x + P.w / 2;
  const alive = e => e && !e.dead && !Z.bossDefeated;
  /* tatsächliche Ausholzeit (im Zorn 20 % kürzer, siehe bossBrain) – Vorwarnungen laufen genau so lang */
  const PRE = (e, v) => v * (e.rage ? 0.8 : 1);
  const minions = e => Z.enemies.filter(o => o.master === e && !o.dead).length;

  /* ======================= 1. ZEITPLANER & VORWARNUNGEN ======================= */
  /* Spielzeit-Zeitplaner: ersetzt setTimeout in den Bossmustern (läuft mit Pause, Zeitlupe und Einzelschritten) */
  let Q = [];
  Z.bossLater = (fn, ms) => { Q.push({ t: (ms || 0) / 1000, fn }); };
  const later = (sec, fn) => Q.push({ t: sec, fn });
  function tickQ(dt) {
    if (!Q.length) return;
    let due = null;
    for (const q of Q) { q.t -= dt; if (q.t <= 0) (due || (due = [])).push(q); }
    if (!due) return;
    Q = Q.filter(q => q.t > 0);
    for (const q of due) { try { q.fn(); } catch (err) { console.error("Bossplan:", err); } }
  }

  /* Vorwarnungen ohne Schaden (Bodenmarken, Säulen, Bänder, Ringe, Ziellinien, sichere Felder) */
  const TELE = [];
  function tele(o) { o.t = 0; o.dur = o.dur || 0.8; o.col = o.col || "#ff3a2a"; o.k = o.k || "floor"; TELE.push(o); if (TELE.length > 160) TELE.shift(); return o; }
  Z.bossTele = tele; Z.bossTeleList = TELE;
  /* Dauerhafte Arena-Objekte (Netze, Lava, Abgrundschlick …): { upd(dt) → false = entfernen, draw(c, t) } */
  let OBJ = [];

  /* Bodenhöhe (nur feste Kacheln, Plattformen zählen nicht) */
  function floorAt(x, ref) {
    ref = ref == null ? AR().floor : ref;
    let y = ref - 36;
    for (let k = 0; k < 8 && W.solidAt(x, y); k++) y -= T;
    for (let n = 0; n < 70; n++, y += 4) if (W.solidAt(x, y)) return Math.floor(y / T) * T;
    return ref;
  }
  /* Stand-Höhe des Spielers (mit Plattformen) */
  function standY(P) { if (P.onGround) return P.y + P.h; const g = W.groundBelow(pcx(P), P.y + P.h - 2, 260); return g != null ? g : AR().floor; }

  /* Varianten der Geschossarten mit eigener Farbe (Zeichnung nimmt p.k.col) */
  const KV = {};
  function kv(kind, col) { const id = kind + col; return KV[id] || (KV[id] = Object.assign({}, Z.PK[kind], { col })); }

  /* ======================= 2. PHASENMASCHINE ======================= */
  const BRAIN = K.brain;
  function phaseIndex(d, frac) { let k = 0; d.phases.forEach((p, i) => { if (frac <= p.at) k = i; }); return k; }

  function forceMove(e, id, P) {
    const mv = e.def.moves[id]; if (!mv) return;
    e.mv = { id, stage: "pre", t: 0 }; e.lastMv = id; face(e, P); e.tele = mv.pre;
    if (mv.start) mv.start(e, P, e.mv);
    if (mv.sfx) A.play(mv.sfx, { vol: 0.6, x: e.x });
  }

  function startTrans(e, k, P) {
    const d = e.def, ph = d.phases[k];
    /* laufende Technik sauber beenden */
    if (e.mv) { const mv = d.moves[e.mv.id]; if (mv && mv.abort) try { mv.abort(e, P, e.mv); } catch (_) {} }
    e.mv = null; e.tele = 0; e.hidden = 0; e.st.stun = 0;
    e.trans = { k, t: 0, dur: ph.transDur || 1.7, fired: false, size: e.size };
    e.invuln = e.trans.dur + 0.3;
    A.play("gong", { vol: 0.45 }); A.play(d.roar || "roar", { vol: 0.5, rate: 0.8 });
    FX.slowmo(0.45, 0.35);
    FX.flashScreen(ph.aura || "#ff6a3a", 0.18);
  }

  function transTick(e, dt, P) {
    const d = e.def, tr = e.trans, ph = d.phases[tr.k];
    tr.t += dt;
    e.invuln = Math.max(e.invuln, 0.3);
    const cx = cxOf(e), cy = e.y + e.h * 0.45, col = ph.aura || "#ff6a3a";
    /* Aufladen: Funken ziehen sich zusammen, Gestalt flackert */
    if (!tr.fired) {
      if (R() < dt * 50) { const a = R() * TAU, r = 50 + e.h * 0.6; FX.p({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.8, vx: -Math.cos(a) * r * 2.2, vy: -Math.sin(a) * r * 1.8, life: 0.42, size: 2.4, col, kind: "glow", add: true, drag: 1 }); }
      e.flash = (tr.t % 0.22) < 0.07 ? 0.05 : 0;
      FX.addShake(2 + tr.t * 3, 5);
    }
    if (!tr.fired && tr.t >= 0.8) {
      tr.fired = true;
      e.phase = tr.k; e.rage = tr.k >= 1; e.aura = col; e.phaseT = 0; e.ar = {};
      if (ph.tint) { if (ph.tint.c) e.def.c = ph.tint.c; if (ph.tint.t) e.def.t = ph.tint.t; }
      /* Ausbruch: Ringe, Beben, feindliche Geschosse verpuffen */
      A.play(d.roar || "roar", { vol: 0.9 }); A.play("quake", { vol: 0.5 });
      FX.addShake(11); FX.flashScreen(col, 0.35);
      FX.ring(cx, cy, 70 + e.w, col, 0.5, 4); FX.ring(cx, cy, 130 + e.w, "#fff2d0", 0.7, 2);
      FX.burst(cx, cy, 46, { col: [col, "#fff2d0", d.t || "#ffd27a"], sp: 240, life: 0.8, size: 2.6, kind: "spark", add: true });
      for (const p of Z.projs) if (p.owner === "e" && U.dist(p.x, p.y, cx, cy) < 600) { p.dead = true; FX.p({ x: p.x, y: p.y, vx: 0, vy: -20, life: 0.3, size: 4, col: "#fff2d0", kind: "glow", add: true }); }
      /* kein Rückstoß auf den Spieler: er könnte sonst in Lava oder Stacheln geschleudert werden */
      if (Z.ui && Z.ui.banner && ph.name) Z.ui.banner(L(ph.name), ph.quote ? L(ph.quote) : "", 3400);
      if (ph.enter) ph.enter(e, P);
      syncBar(e, true);
    }
    if (d.fixed) { if (d.move) d.move(e, P, dt); }
    else {
      e.vx = U.approach(e.vx, 0, 900 * dt);
      if (d.fly && !e.grounded) { e.vy = U.approach(e.vy, 0, 600 * dt); } else grav(e, dt);
      Z.moveBody(e, dt);
    }
    /* Aufblähen beim Brüllen, dann zurück auf Normalgröße */
    const sw = tr.t < 0.8 ? tr.t / 0.8 : Math.max(0, 1 - (tr.t - 0.8) / 0.5);
    e.size = tr.size * (1 + 0.08 * sw * sw);
    if (tr.t >= tr.dur) { e.size = tr.size; e.trans = null; e.flash = 0; e.idle = 0.35; e.invuln = 0.15; }
  }

  /* Gemeinsame Update-Hülle aller Bosse */
  function phased(e, dt, P) {
    const d = e.def;
    if (!P) return BRAIN(e, dt, P);
    if (e.trans) return transTick(e, dt, P);
    const multi = d.phases && d.phases.length > 1;
    if (multi && !(e.intro > 0) && !d.phaseFollow) {
      const tgt = phaseIndex(d, e.hp / e.hpMax), cur = e.phase || 0;
      if (tgt > cur) { startTrans(e, cur + 1, P); return; }
    }
    const ph = d.phases[e.phase || 0] || d.phases[0];
    if (ph && ph.arena && !(e.intro > 0) && alive(e)) { e.ar = e.ar || {}; e.phaseT = (e.phaseT || 0) + dt; ph.arena(e, dt, P, e.ar); }
    /* erzwungene nächste Technik (z. B. direkt nach einem Phasenwechsel) */
    if (e.nextMv && !e.mv && !(e.intro > 0) && e.idle <= dt) { const id = e.nextMv; e.nextMv = null; forceMove(e, id, P); }
    /* beim Ausholen nicht weiterrutschen: Vorwarnungen bleiben dort, wo der Schlag landet */
    if (e.mv && e.mv.stage === "pre" && !(d.moves[e.mv.id] || {}).preTick && !d.fixed) {
      e.vx = U.approach(e.vx, 0, 900 * dt);
      if (d.fly && !e.grounded) e.vy = U.approach(e.vy, 0, 600 * dt);
    }
    BRAIN(e, dt, P);
    if (e.box && e.box.warden && !d.fixed) keepIn(e);
    /* Tempo: kürzere Erholung zwischen den Mustern – die Vorwarnung bleibt gleich lang */
    const tp = ((ph && ph.tempo) || 1) * (e.tempoBonus || 1);
    if (tp !== 1) { if (!e.mv) e.idle -= dt * (tp - 1); else if (e.mv.stage === "post") e.mv.t += dt * (tp - 1); }
  }

  /* Wächter bleiben in ihrem Raum: an den Rändern halten, nach einem Sturz zurückholen */
  function keepIn(e) {
    const b = e.box; let moved = false;
    if (e.x < b.x0) { e.x = b.x0; e.vx = Math.max(0, e.vx); moved = true; }
    if (e.x + e.w > b.x1) { e.x = b.x1 - e.w; e.vx = Math.min(0, e.vx); moved = true; }
    if (e.y > b.y1 + 24 || e.y + e.h < b.top - 60) {
      FX.burst(cxOf(e), e.y + e.h / 2, 14, { col: [e.def.t || "#ffd27a", "#3a3030"], sp: 80, life: 0.5, size: 3, kind: "smoke" });
      e.x = e.home.x - e.w / 2; e.y = e.home.y - e.h; e.vx = 0; e.vy = 0; e.mv = null; e.idle = 0.6; e.hidden = 0; moved = true;
      FX.burst(cxOf(e), e.y + e.h / 2, 14, { col: [e.def.t || "#ffd27a", "#3a3030"], sp: 80, life: 0.5, size: 3, kind: "smoke" });
    }
    if (moved) Z.unstick(e);
  }
  /* Phasen-Sperre: ein einzelner Treffer überspringt keine ganze Phase, und vor der letzten Phase stirbt kein Boss */
  function lockFloor(e) {
    const d = e.def; if (!d.phases || d.phases.length < 2 || d.phaseFollow) return 0;
    const cur = e.trans ? e.trans.k : (e.phase || 0);
    if (d.phases[cur + 2]) return d.phases[cur + 2].at * e.hpMax + 1;
    if (d.phases[cur + 1]) return 1;
    return 0;
  }
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmgV, o) {
    if (!e || !e.def || !e.def.boss || e.dead) return hit0.apply(this, arguments);
    const before = e.hp; e._preHit = before;
    const r = hit0.apply(this, arguments);
    if (!e.dead && e.hp < before) {
      const fl = lockFloor(e);
      if (fl > 0 && before > fl && e.hp < fl) e.hp = fl;
      if (e.mv && e.mv.chan != null) e.mv.chan += before - e.hp;
    }
    return r;
  };
  const kill0 = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    if (e && e.def && e.def.boss && !e.dead) {
      const fl = lockFloor(e);
      if (fl > 0 && (e._preHit || 0) > e.hpMax * 0.04) { e.hp = Math.max(1, Math.min(fl, e._preHit || fl)); return; }
      /* Nezna fällt: der Bugbear rast */
      if (e.id === "nezna" && e.partner && !e.partner.dead && e.partner.hp > 0) {
        const b = e.partner; b.tempoBonus = 1.25;
        Z.bossLater(() => { if (alive(b)) { K.roar(b); FX.text(cxOf(b), b.y - 12, L(["Der Bugbear rast vor Wut!", "The bugbear seethes with rage!"]), "#ff6a3a", true); } }, 400);
      }
    }
    return kill0.apply(this, arguments);
  };

  /* ======================= 3. BAUSTEINE ======================= */
  function zone(e, x, y, w, h, warn, m, o) {
    return Z.spawnHazard(Object.assign({ kind: "zone", x, y, w, hgt: h, warn, active: 0.2, life: 0.32, dmg: dmg(e, m), owner: "e", col: "#ffb040", warnCol: "#ff3a2a" }, o || {}));
  }
  function pillar(e, x, warn, m, o) {
    return Z.spawnHazard(Object.assign({ kind: "column", x, y: floorAt(x), w: 26, hgt: 300, warn, life: 0.35, dmg: dmg(e, m), owner: "e", col: "rgba(255,140,40,.75)", warnCol: "#ff3a2a" }, o || {}));
  }
  /* Wo fällt etwas herab? Start unter der Decke (höchstens ~230 px über dem Spieler), Landung auf der ersten Fläche darunter */
  function dropPath(x, ref, kind) {
    const P = Z.player; ref = ref != null ? ref : (P ? standY(P) : AR().floor);
    if (W.solidAt(x, ref - 10)) return null;
    let top = ref - 10; for (let k = 0; k < 28 && !W.solidAt(x, top - 8); k++) top -= 8;
    top = Math.max(top, Z.cam.y - 12);
    /* Plattformen fangen nur Würfe, Brocken und Splitter auf – alles andere fällt hindurch */
    const k = kind && Z.PK[kind], plat = !k || k.lob || k.rain || k.shard;
    let land = null;
    if (plat) land = W.groundBelow(x, top + 2, 460);
    else for (let y = top + 2; y < top + 460; y += 4) if (W.solidAt(x, y)) { land = Math.floor(y / T) * T; break; }
    return { top, land: land != null ? land : ref };
  }
  Z.bossDrop = dropPath;
  /* Fallender Brocken mit Bodenmarke genau an der Landestelle (≈1 s Vorwarnung) */
  function dropFrom(e, x, kind, m, o) {
    o = o || {};
    const dp = dropPath(x, o.ref, kind); if (!dp) return;
    const d = Math.max(0, dp.land - dp.top), fall = (-140 + Math.sqrt(140 * 140 + 1800 * d)) / 900;
    tele({ k: "floor", x, y: dp.land, w: 24, dur: 0.42 + fall + 0.04, col: o.warnCol || "#ff3a2a" });
    later(0.42, () => { if (!alive(e)) return; const p = Z.spawnProj(kind, x, dp.top, 0, Object.assign({ dmg: dmg(e, m), vx: 0, vy: 140, owner: "e" }, o.p)); p.g = 900; });
  }
  /* Bodenlauf: Segmente leuchten nacheinander auf (überspringen) */
  function floorSweep(e, x0, dir, len, o) {
    o = o || {};
    const seg = o.seg || 20, n = Math.max(1, Math.ceil(len / seg)), warn = o.warn == null ? 0.6 : o.warn, gap = o.gap || 0.03, a = AR();
    const xs = []; for (let i = 0; i < n; i++) { const x = x0 + dir * (i + 0.5) * seg; if (x < a.x0 - 8 || x > a.x1 + 8) break; xs.push(x); }
    if (!xs.length) return 0;
    const y = floorAt(xs[0], o.ref);
    tele({ k: "band", x0: Math.min(x0, xs[xs.length - 1]) - seg / 2, x1: Math.max(x0, xs[xs.length - 1]) + seg / 2, y: y, h: o.h || 16, dur: warn, col: o.warnCol || "#ff3a2a", arrow: dir });
    xs.forEach((x, i) => later(warn + i * gap, () => {
      if (!alive(e)) return;
      const fy = floorAt(x, o.ref);
      zone(e, x, fy, seg + 2, o.h || 16, 0, o.m || 0.9, { col: o.col || "#ffd27a", active: 0.1, life: 0.22, eff: o.eff, kb: 120, kbUp: 220 });
      if (i % 2 === 0) FX.burst(x, fy - 2, 3, { col: o.fx || [o.col || "#ffd27a", "#fff2d0"], sp: 90, ang: -Math.PI / 2, spread: 1.2, life: 0.35, size: 2, kind: "spark", add: true });
      if (i % 6 === 0 && o.sfx !== false) A.play(o.sfx || "zap", { vol: 0.25, x, gap: 0.05 });
    }));
    return warn + xs.length * gap;
  }
  /* Waagrechter Strahl über die Arena (y = Unterkante) */
  function beam(e, x0, x1, yBottom, h, warn, m, o) {
    o = o || {};
    tele({ k: "band", x0, x1, y: yBottom, h, dur: warn, col: o.warnCol || "#ff3a2a" });
    later(warn, () => {
      if (!alive(e)) return;
      zone(e, (x0 + x1) / 2, yBottom, x1 - x0, h, 0, m, { col: o.col || "rgba(255,230,120,.9)", active: o.active || 0.15, life: 0.3, eff: o.eff });
      FX.addShake(3); if (o.sfx !== false) A.play(o.sfx || "zap", { vol: 0.5 });
    });
  }
  /* Ring aus Geschossen mit Lücken */
  function nova(e, x, y, kind, n, sp, gapN, m, o) {
    o = o || {};
    const a0 = o.a0 != null ? o.a0 : R() * TAU, g0 = Math.floor(R() * n);
    for (let i = 0; i < n; i++) {
      if (gapN && ((i - g0 + n) % n) < gapN) continue;
      const a = a0 + (i / n) * TAU;
      Z.spawnProj(kind, x, y, 1, Object.assign({ vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, dmg: dmg(e, m), life: o.life || 2.2, owner: "e" }, o.p || {}));
    }
  }
  /* Sprung mit Landeschlag auf eine markierte Stelle */
  function leapSlam(o) {
    const pre = o.pre || 0.6;
    return {
      name: o.name, pre, dur: 2.2, post: o.post || 0.65, sfx: o.sfx || "roar", w: o.w, range: o.range, cond: o.cond, danger: o.danger,
      start: (e, P, m) => { const a = AR(); m.tx = U.clamp(pcx(P), a.x0 + 30, a.x1 - 30); m.fy = standY(P); m.mk = tele({ k: "floor", x: m.tx, y: m.fy, w: o.r * 2, dur: PRE(e, pre) + 0.8, col: o.col || "#ff3a2a" }); },
      preTick: (e, P, dt, m) => { e.vx = U.approach(e.vx, 0, 900 * dt); if (R() < dt * 20) FX.p({ x: cxOf(e) + (R() - 0.5) * e.w, y: feet(e), vx: (R() - 0.5) * 60, vy: -40, life: 0.4, size: 3, col: Z.dustCol || "#8a7a70", kind: "smoke" }); },
      act: (e, P, m) => { const v = o.jump || 560; e.vy = -v; e.onGround = false; e.grounded = false; m.T = Math.max(0.35, 2 * v / 1400); e.vx = (m.tx - cxOf(e)) / m.T; A.play("jump", { vol: 0.6, rate: 0.6 }); FX.burst(cxOf(e), feet(e), 12, { col: Z.dustCol || "#8a7a70", sp: 100, life: 0.5, size: 4, kind: "smoke" }); },
      tick: (e, P, dt, m) => {
        /* durch Plattformen über dem Ziel hindurch, auf der Zielhöhe landen */
        e.dropT = feet(e) < m.fy - 6 ? 0.2 : 0;
        if (m.t < m.T * 0.9) e.vx = U.clamp((m.tx - cxOf(e)) / Math.max(0.08, m.T - m.t), -520, 520);
        if ((m.t > 0.12 && e.onGround) || m.t > m.T + 0.9) {
          m.t = 99; e.vx = 0; e.dropT = 0;
          const fy = feet(e), r = o.r;
          melee(e, { x: cxOf(e) - r, y: fy - 34, w: r * 2, h: 36 }, o.m || 1.3, { kb: 260, kbUp: 220 });
          FX.addShake(10); A.play("quake", { vol: 0.8 }); A.play("hitHeavy", { vol: 0.6 });
          FX.burst(cxOf(e), fy, 26, { col: [Z.dustCol || "#8a7a70", "#c8b8a0"], sp: 170, ang: -Math.PI / 2, spread: 2.8, life: 0.6, size: 4, kind: "smoke" });
          FX.ring(cxOf(e), fy - 4, r + 20, o.col || "#ffd27a", 0.35, 3);
          if (o.waves) for (const s of [-1, 1]) Z.spawnProj("e_welle", cxOf(e) + s * (r * 0.5), fy - 6, s, Object.assign({ dmg: dmg(e, 0.8), life: o.waveLife || 1.3, speed: o.waveSpd || 210 }, o.waveK ? { k: o.waveK } : null));
          if (o.land) o.land(e, P, fy);
        }
      },
      end: e => { e.dropT = 0; }
    };
  }
  /* Teppich aus Bodeneffekten (Feuer, Gift), der über den Boden zieht */
  function carpet(e, x0, dir, len, o) {
    const step = o.step || 30, n = Math.ceil(len / step), warn = o.warn || 0.8, a = AR();
    const xs = []; for (let i = 0; i < n; i++) { const x = x0 + dir * (i + 0.5) * step; if (x < a.x0 || x > a.x1) break; xs.push(x); }
    if (!xs.length) return;
    tele({ k: "band", x0: Math.min(x0, xs[xs.length - 1]) - step / 2, x1: Math.max(x0, xs[xs.length - 1]) + step / 2, y: floorAt(xs[0]), h: 14, dur: warn + xs.length * (o.gap || 0.06), col: o.warnCol || "#ff3a2a", arrow: dir });
    xs.forEach((x, i) => later(warn + i * (o.gap || 0.06), () => { if (!alive(e)) return; const fy = floorAt(x); Z.spawnHazard({ kind: o.kind || "fire", x, y: fy, w: step + 4, life: o.life || 1.6, dmg: dmg(e, o.m || 0.3), owner: "e", eff: o.eff }); if (i % 3 === 0) A.play(o.sfx || "fire", { vol: 0.3, x, gap: 0.05 }); }));
  }
  /* Taktgeber für Arena-Veränderungen */
  function every(s, key, dt, period, fn, first) {
    if (s[key] == null) s[key] = first != null ? first : period * 0.6;
    s[key] -= dt; if (s[key] <= 0) { s[key] = period; fn(); }
  }
  /* Spieler wird angezogen (Sog), Rennen hält dagegen */
  function drift(P, tx, spd, dt) { if (P.dead || P.iframe > 0.2) return; const d = tx - pcx(P); if (Math.abs(d) > 6) P.x += U.sign(d) * Math.min(Math.abs(d), spd * dt); }

  /* Netze: verlangsamen, solange man drinsteht */
  function web(x, y, w, h, life) {
    const o = { x, y, w, h, t: 0, life: life || 9,
      upd(dt) { this.t += dt; const P = Z.player; if (P && !P.dead && U.overlap({ x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }, P) && this.t > 0.5) Z.addStatus(P, "web", 0.15, true); return this.t < this.life && !Z.bossDefeated; },
      draw(c) { const k = Math.min(1, this.t / 0.5) * Math.min(1, (this.life - this.t) / 0.6); c.save(); c.globalAlpha = 0.75 * k; c.strokeStyle = "#eee8f0"; c.lineWidth = 0.7; const x0 = this.x - this.w / 2, y0 = this.y - this.h; c.beginPath(); for (let i = 0; i <= 6; i++) { const xx = x0 + this.w * i / 6; c.moveTo(xx, this.y); c.lineTo(this.x + (xx - this.x) * 0.3, y0); } for (let j = 1; j <= 3; j++) { const yy = this.y - this.h * j / 4; c.moveTo(x0 + j * 2, yy); c.quadraticCurveTo(this.x, yy + 4, x0 + this.w - j * 2, yy); } c.stroke(); c.globalAlpha = 0.12 * k; c.fillStyle = "#eee8f0"; c.fillRect(x0, y0, this.w, this.h); c.restore(); } };
    OBJ.push(o); FX.burst(x, y - h / 2, 10, { col: "#eee8f0", sp: 60, life: 0.4, size: 1.5 }); return o;
  }
  /* Bodenfläche, die schadet (Lava, Abgrundschlick); zeichnet sich selbst – günstig für breite Flächen */
  function sheet(e, x0, x1, y, o) {
    const s = { x0, x1, y, t: 0, life: o.life, rise: o.rise || 0.3, tick: 0, col: o.col, col2: o.col2, m: o.m, eff: o.eff, glowC: o.glow,
      upd(dt) {
        this.t += dt; const P = Z.player, k = Math.min(1, this.t / this.rise) * Math.min(1, (this.life - this.t) / 0.4);
        this.tick -= dt;
        if (P && !P.dead && k > 0.6 && pcx(P) > this.x0 && pcx(P) < this.x1 && P.y + P.h > this.y - 9 && P.y + P.h <= this.y + 4 && this.tick <= 0) {
          this.tick = 0.4;
          Z.hurtPlayer(dmg(e, this.m), { x: pcx(P), kb: 0, kbUp: 330, unblockable: true, hazard: true, eff: this.eff });
          P.vy = Math.min(P.vy, -330); P.onGround = false;
        }
        return this.t < this.life && !Z.bossDefeated;
      },
      draw(c, t) {
        const k = Math.min(1, this.t / this.rise) * Math.min(1, (this.life - this.t) / 0.4), h = 9 * k;
        c.save(); c.fillStyle = this.col; c.globalAlpha = 0.92; c.fillRect(this.x0, this.y - h, this.x1 - this.x0, h + 3);
        c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.6 * k; c.fillStyle = this.col2;
        for (let x = this.x0; x < this.x1; x += 14) { const f = Math.sin(t * 5 + x * 0.21) * 0.5 + 0.5; c.fillRect(x, this.y - h - f * 3, 9, 2 + f * 2); }
        c.restore();
        if (R() < 0.35 && k > 0.5) FX.p({ x: this.x0 + R() * (this.x1 - this.x0), y: this.y - h, vx: 0, vy: -50 - R() * 40, life: 0.6, size: 1.6, col: this.glowC || this.col2, kind: "spark", add: true });
      } };
    OBJ.push(s); return s;
  }

  /* ======================= 4. BOSSE ======================= */
  /* Phase anlegen: { at, name, quote, aura, tempo, moves, enter, arena, tint } */
  const SPEC = {};
  function extend(id, spec) { SPEC[id] = spec; if (B[id]) apply(id); }
  function apply(id) {
    const d = B[id], s = SPEC[id]; if (!d || !s || d.phx) return;
    d.phx = true;
    if (s.copy) for (const k of s.copy) if (d.moves[k]) d.moves[k] = Object.assign({}, d.moves[k]);
    Object.assign(d.moves, s.moves || {});
    for (const k in s.names || {}) if (d.moves[k]) d.moves[k].name = s.names[k];
    for (const k of s.danger || []) if (d.moves[k]) d.moves[k].danger = true;
    if (s.phases) d.phases = s.phases;
    if (s.phaseFollow) d.phaseFollow = true;
    d.update = phased;
    if (s.def) Object.assign(d, s.def);
  }

  /* ---------- Gemeinsame Arena-Effekte ---------- */
  const rubble = (e, P, n, spread, kind, m, col) => { for (let i = 0; i < n; i++) later(i * 0.25, () => { if (!alive(e)) return; const a = AR(); dropFrom(e, U.clamp(pcx(P) + (R() - 0.5) * spread, a.x0 + 10, a.x1 - 10), kind || "e_stein", m || 0.6, { warnCol: col }); }); };
  const stormBolt = (e, P, m, col) => { const x = pcx(P) + (R() - 0.5) * 60; K.strikeAt(x, { y: floorAt(x, standY(P)), dmg: dmg(e, m || 0.9), col: col || "rgba(255,240,160,1)", warnCol: "#ffe080", warn: 0.95 }); later(0.95, () => { A.play("thunder", { vol: 0.45 }); FX.flashScreen("#fff8d0", 0.12); }); };

  /* ---------- GLASSTAB ---------- */
  extend("glasstab", {
    def: { roar: "laugh" },
    names: { phiolen: N("Phiolenwurf", "Vial Toss"), blink: N("Blinzeln", "Blink"), scherben: N("Scherbenregen", "Shard Rain"), beschwoeren: N("Rote Roben, zu mir!", "Red Robes, to me!"), feuerball: N("Feuerball-Salve", "Fireball Salvo") },
    moves: {
      /* Phiolen landen nebeneinander und entzünden sich – eine Lücke bleibt frei (grün markiert) */
      kaskade: { name: N("Phiolenkaskade", "Vial Cascade"), pre: 0.6, dur: 1.3, post: 0.6, sfx: "glass",
        act: (e, P, m) => {
          const a = AR(), n = e.phase >= 2 ? 9 : 7, step = 40, c0 = U.clamp(pcx(P), a.x0 + 80, a.x1 - 80), x0 = c0 - (n - 1) / 2 * step;
          const gap = Math.floor(n / 2) + (R() < 0.5 ? -1 : 1) * (1 + Math.floor(R() * 2));
          for (let i = 0; i < n; i++) {
            const x = U.clamp(x0 + i * step, a.x0 + 10, a.x1 - 10), fy = floorAt(x);
            if (i === gap) { tele({ k: "safe", x, y: fy, w: 30, dur: 1.5 }); continue; }
            tele({ k: "floor", x, y: fy, w: 30, dur: 0.95, col: "#7fd36a" });
            later(0.95, () => { if (!alive(e)) return; Z.spawnHazard({ kind: "fire", x, y: fy, w: 34, life: e.phase >= 2 ? 2.6 : 2.0, dmg: dmg(e, 0.25), owner: "e", eff: { burn: 1 } }); FX.burst(x, fy - 6, 8, { col: ["#7fd36a", "#d8f0e0", "#ffb040"], sp: 110, life: 0.4, size: 2, kind: "spark", add: true }); A.play("glass", { vol: 0.35, x, gap: 0.04 }); });
            FX.p({ x: cxOf(e), y: e.y + 8, vx: (x - cxOf(e)) / 0.9, vy: -260, g: 600, life: 0.9, size: 2.6, col: "#7fd36a", kind: "glow", add: true });
          }
        } },
      /* Kranz aus Glassplittern mit Lücken – durchspringen oder Lücke suchen */
      splitterkranz: { name: N("Splitterkranz", "Shard Wreath"), pre: 0.85, dur: 0.9, post: 0.7, sfx: "glass",
        start: (e, P, m) => { tele({ k: "ring", x: cxOf(e), y: e.y + 14, r: 44, dur: PRE(e, 0.85), col: "#d8f0e0" }); },
        act: (e, P, m) => { nova(e, cxOf(e), e.y + 14, "e_scherbe", 16, 120, 3, 0.6, { life: 2.6 }); if (e.phase >= 2) later(0.5, () => { if (alive(e)) nova(e, cxOf(e), e.y + 14, "e_scherbe", 16, 120, 3, 0.6, { life: 2.6 }); }); A.play("glass", { vol: 0.7 }); FX.ring(cxOf(e), e.y + 14, 40, "#d8f0e0", 0.3, 2); } },
      /* Bodenstrahl aus dem Stab: springen */
      stabblitz: { name: N("Stabblitz", "Staff Bolt"), pre: 0.8, dur: 0.6, post: 0.6, sfx: "zap",
        start: (e, P, m) => { const a = AR(); m.fy = floorAt(cxOf(e)); m.x0 = e.face > 0 ? cxOf(e) : a.x0; m.x1 = e.face > 0 ? a.x1 : cxOf(e); tele({ k: "band", x0: m.x0, x1: m.x1, y: m.fy, h: 16, dur: PRE(e, 0.8), col: "#7fd36a", arrow: e.face }); FX.text(pcx(P), P.y - 16, L(["Springen!", "Jump!"]), "#ffd27a", true); },
        preTick: (e, P, dt) => { e.vx = U.approach(e.vx, 0, 900 * dt); },
        act: (e, P, m) => { beam(e, m.x0, m.x1, m.fy, 16, 0.01, 1.1, { col: "rgba(190,240,170,.95)", sfx: "zap" }); } }
    },
    phases: [
      { at: 1, name: N("Anführer der Roten Roben", "Leader of the Red Robes"), moves: ["phiolen", "blink", "scherben", "beschwoeren", "kaskade"] },
      { at: 0.66, name: N("Die rote Phiole", "The Red Vial"), quote: N("„Ihr wollt meine Tränke? Dann schluckt!“", "\"You want my potions? Then swallow!\""), aura: "#ff3a2a", tempo: 1.15,
        moves: ["phiolen", "blink", "scherben", "feuerball", "kaskade", "splitterkranz", "beschwoeren"],
        enter: e => { e.nextMv = "splitterkranz"; },
        /* Die Regale wackeln: Glas fällt von oben */
        arena: (e, dt, P, s) => every(s, "glas", dt, 3.4, () => rubble(e, P, 2, 220, "e_scherbe", 0.55, "#d8f0e0")) },
      { at: 0.33, name: N("Die grüne Flamme", "The Green Flame"), quote: N("„Die Spinne hat mir mehr versprochen als DAS!“", "\"The Spider promised me more than THIS!\""), aura: "#7fd36a", tempo: 1.35, tint: { t: "#5a8a3a" },
        moves: ["phiolen", "blink", "kaskade", "splitterkranz", "stabblitz", "feuerball", "scherben"],
        enter: e => { e.nextMv = "stabblitz"; const a = AR(); for (const x of [a.x0 + 30, a.x1 - 30]) tele({ k: "floor", x, y: floorAt(x), w: 60, dur: 1.4, col: "#7fd36a" }); },
        /* Alchemistenfeuer an beiden Rändern: die Arena wird enger */
        arena: (e, dt, P, s) => {
          every(s, "rand", dt, 2.4, () => { const a = AR(); for (const x of [a.x0 + 30, a.x1 - 30]) Z.spawnHazard({ kind: "fire", x, y: floorAt(x), w: 60, life: 2.5, dmg: dmg(e, 0.25), owner: "e", eff: { burn: 1 } }); }, 1.4);
          every(s, "glas", dt, 4.2, () => rubble(e, P, 2, 200, "e_scherbe", 0.55, "#d8f0e0"));
        } }
    ]
  });

  /* ---------- FALSCHE ERZPRIESTERIN ---------- */
  extend("erzpriesterin", {
    def: { roar: "monster" },
    names: { blitze: N("Zorn der Tiefe", "Wrath of the Deep"), blasen: N("Blasenfluch", "Bubble Curse"), speere: N("Grätenstoß", "Bone Thrust"), rufen: N("Ruf der Kuo-Toa", "Call of the Kuo-toa"), flut: N("Flutwelle", "Tidal Wave") },
    danger: ["gebet"],
    moves: {
      /* Blitzbogen läuft über die Planken: springen */
      blitzlauf: { name: N("Blitzlauf", "Running Lightning"), pre: 0.55, dur: 1.0, post: 0.55, sfx: "zap",
        act: (e, P, m) => { const dir = pcx(P) > cxOf(e) ? 1 : -1; floorSweep(e, cxOf(e), dir, 520, { warn: 0.5, gap: 0.026, col: "#ffe080", m: 0.9, eff: { stun: 0.2 }, sfx: "zap" }); if (e.phase >= 2) later(0.5, () => { if (alive(e)) floorSweep(e, cxOf(e), -dir, 520, { warn: 0.5, gap: 0.026, col: "#ffe080", m: 0.9, sfx: "zap" }); }); FX.text(pcx(P), P.y - 16, L(["Springen!", "Jump!"]), "#ffe080", true); } },
      /* Gebet: Kanalisieren – genug Schaden unterbricht sie, sonst heilt sie und ruft Gläubige */
      gebet: { name: N("Gebet an Demogorgon", "Prayer to Demogorgon"), pre: 0.45, dur: 2.4, post: 0.6, sfx: "dark", w: 0.8,
        cond: e => e.hp < e.hpMax * 0.92,
        start: (e, P, m) => { m.chan = 0; },
        act: (e, P, m) => { m.chan = 0; FX.text(cxOf(e), e.y - 18, L(["Unterbrich sie!", "Interrupt her!"]), "#ffd27a", true); A.play("dark", { vol: 0.7 }); },
        tick: (e, P, dt, m) => {
          e.vx = 0;
          if (R() < dt * 30) { const a = R() * TAU; FX.p({ x: cxOf(e) + Math.cos(a) * 40, y: e.y + 14 + Math.sin(a) * 30, vx: -Math.cos(a) * 80, vy: -Math.sin(a) * 60, life: 0.5, size: 2, col: "#e5b454", kind: "glow", add: true }); }
          if (m.t > 1.6 && !m.warned) { m.warned = true; tele({ k: "ring", x: cxOf(e), y: feet(e) - 20, r: 80, dur: 0.8, col: "#ff3a2a" }); }
          if (m.chan >= e.hpMax * 0.07 && !m.broke) {
            m.broke = true; m.t = 99; e.st.stun = 2.2;
            FX.text(cxOf(e), e.y - 14, L(["Unterbrochen!", "Interrupted!"]), "#ffe08a", true); A.play("parry", { vol: 0.7 }); FX.ring(cxOf(e), e.y + 14, 40, "#ffe08a", 0.4, 3); FX.addShake(4);
          }
        },
        end: (e, P, m) => {
          if (m.broke) return;
          e.hp = Math.min(e.hpMax, e.hp + e.hpMax * 0.06); FX.text(cxOf(e), e.y - 14, L(["Demogorgon antwortet …", "Demogorgon answers…"]), "#e5b454", true);
          zone(e, cxOf(e), feet(e), 160, 56, 0, 1.1, { col: "rgba(229,180,84,.9)", eff: { stun: 0.3 } }); FX.ring(cxOf(e), feet(e) - 20, 80, "#e5b454", 0.4, 4); A.play("thunder", { vol: 0.6 });
          if (minions(e) < 3) summon(e, "kuotoa", 2, 70);
        } },
      /* Fächer aus Grätenspeeren, zweimal */
      graetensalve: { name: N("Grätensalve", "Bone Volley"), pre: 0.55, dur: 0.6, post: 0.55, sfx: "throwK", range: [60, 999],
        act: (e, P, m) => { const fire = () => { if (!alive(e)) return; for (let i = -2; i <= 2; i++) { const a = Math.atan2(P.y + 12 - (e.y + 10), pcx(P) - cxOf(e)) + i * 0.13; Z.spawnProj("e_pfeil", cxOf(e), e.y + 10, 1, { dmg: dmg(e, 0.7), vx: Math.cos(a) * 300, vy: Math.sin(a) * 300 - 30 }); } A.play("throwK", { vol: 0.5 }); }; fire(); later(0.4, fire); } },
      /* Kettenblitz: springt vom Ziel nach außen weiter */
      kettenblitz: { name: N("Kettenblitz", "Chain Lightning"), pre: 0.5, dur: 1.4, post: 0.6, sfx: "zap",
        act: (e, P, m) => { const x0 = pcx(P), dir = R() < 0.5 ? -1 : 1; for (let i = 0; i < 6; i++) later(i * 0.18, () => { if (!alive(e)) return; const x = x0 + dir * (i % 2 ? -1 : 1) * Math.ceil(i / 2) * 46; K.strikeAt(x, { y: floorAt(x, standY(P)), dmg: dmg(e, 0.9), col: "rgba(255,240,160,1)", warnCol: "#ffe080", warn: 0.75, eff: { stun: 0.25 } }); }); later(0.8, () => A.play("thunder", { vol: 0.5 })); } }
    },
    phases: [
      { at: 1, name: N("Die falsche Erzpriesterin", "The False Archpriestess"), moves: ["blitze", "blasen", "speere", "rufen", "blitzlauf"] },
      { at: 0.66, name: N("Die Tiefe hört", "The Deep Listens"), quote: N("„Hörst du es? Unter den Planken … ER atmet.“", "\"Do you hear it? Beneath the planks… HE breathes.\""), aura: "#e5b454", tempo: 1.15,
        moves: ["blitze", "flut", "blasen", "speere", "rufen", "blitzlauf", "gebet", "graetensalve"],
        enter: e => { e.nextMv = "gebet"; },
        /* Der See schwappt: Wellen rollen vom Rand her über die Planken */
        arena: (e, dt, P, s) => every(s, "welle", dt, 6.5, () => { const a = AR(), left = R() < 0.5, x = left ? a.x0 + 12 : a.x1 - 12; tele({ k: "floor", x, y: floorAt(x), w: 40, dur: 0.9, col: "#e5b454" }); FX.text(x, floorAt(x) - 30, L(["Welle!", "Wave!"]), "#ffd27a"); later(0.9, () => { if (alive(e)) { Z.spawnProj("e_welle", x, floorAt(x) - 6, left ? 1 : -1, { dmg: dmg(e, 0.9), life: 3.4, speed: 200 }); A.play("splash", { vol: 0.6 }); } }); }) },
      { at: 0.33, name: N("Für Demogorgon!", "For Demogorgon!"), quote: N("„Demogorgon! Nimm dieses Opfer an!“", "\"Demogorgon! Accept this offering!\""), aura: "#ff7a3a", tempo: 1.3,
        moves: ["blitze", "flut", "blitzlauf", "gebet", "graetensalve", "kettenblitz", "speere"],
        enter: e => { e.nextMv = "kettenblitz"; },
        /* Gewitter über dem Steg */
        arena: (e, dt, P, s) => {
          every(s, "blitz", dt, 2.6, () => stormBolt(e, P, 0.8));
          every(s, "welle", dt, 7.5, () => { const a = AR(), left = R() < 0.5, x = left ? a.x0 + 12 : a.x1 - 12; tele({ k: "floor", x, y: floorAt(x), w: 40, dur: 0.9, col: "#e5b454" }); later(0.9, () => { if (alive(e)) Z.spawnProj("e_welle", x, floorAt(x) - 6, left ? 1 : -1, { dmg: dmg(e, 0.9), life: 3.4, speed: 210 }); }); });
        } }
    ]
  });

  /* ---------- BUGBEAR & NEZNA ---------- */
  extend("bugbear", {
    def: { roar: "roar" },
    names: { sturm: N("Sturmangriff", "Charge"), morgenstern: N("Morgenstern", "Morningstar"), hieb: N("Krallenhiebe", "Claw Flurry"), gebruell: N("Goblins, her!", "Goblins, here!") },
    danger: ["doppelsturm"],
    moves: {
      sprungschlag: leapSlam({ name: N("Sprungschlag", "Leaping Smash"), r: 40, pre: 0.6, jump: 560, waves: true, range: [70, 999], m: 1.3 }),
      /* Glocke als Keule: erst tiefe, dann hohe Schallwelle */
      glockenschlag: { name: N("Glockenschlag", "Bell Toll"), pre: 0.85, dur: 0.9, post: 0.7, sfx: "swingHeavy",
        start: (e, P) => { FX.text(pcx(P), P.y - 16, L(["Springen … dann stehen!", "Jump… then stand!"]), "#ffd27a", true); },
        act: (e, P, m) => {
          melee(e, box(e, -10, -40, 56, 42), 1.3); A.play("bell", { vol: 1 }); A.play("gong", { vol: 0.7 }); FX.addShake(8); FX.ring(cxOf(e), e.y + 16, 90, "#ffd27a", 0.5, 4);
          const kw = kv("e_schall", "#ffd27a");
          for (const s of [-1, 1]) Z.spawnProj("e_schall", cxOf(e) + s * 20, feet(e) - 9, s, { dmg: dmg(e, 0.9), speed: 210, life: 2.4, k: kw });
          later(0.7, () => { if (!alive(e)) return; A.play("bell", { vol: 0.8, rate: 0.8 }); for (const s of [-1, 1]) Z.spawnProj("e_schall", cxOf(e) + s * 20, feet(e) - 42, s, { dmg: dmg(e, 0.9), speed: 210, life: 2.4, k: kw }); });
        } },
      /* Doppelter Ansturm: prallt einmal ab, dreht um, stürmt zurück */
      doppelsturm: { name: N("Doppelsturm", "Double Charge"), pre: 0.75, dur: 3.2, post: 0.4, sfx: "roar", range: [40, 999],
        start: (e, P, m) => { m.dir = e.face; m.n = 0; const a = AR(); tele({ k: "band", x0: m.dir > 0 ? cxOf(e) : a.x0, x1: m.dir > 0 ? a.x1 : cxOf(e), y: feet(e), h: 36, dur: PRE(e, 0.75), col: "#ff3a2a", arrow: m.dir }); },
        tick: (e, P, dt, m) => {
          if (m.pause > 0) { m.pause -= dt; e.vx = 0; if (m.pause <= 0) { const a = AR(); tele({ k: "band", x0: m.dir > 0 ? cxOf(e) : a.x0, x1: m.dir > 0 ? a.x1 : cxOf(e), y: feet(e), h: 36, dur: 0.01, col: "#ff3a2a" }); } return; }
          e.vx = m.dir * 360; e.face = m.dir; if (!m.hit) m.hit = melee(e, box(e, 0, -34, 30, 34), 1.2);
          if (R() < dt * 30) FX.p({ x: cxOf(e), y: feet(e), vx: -m.dir * 60, vy: -20, life: 0.4, size: 4, col: Z.dustCol, kind: "smoke" });
          if (e.hitWall) {
            FX.addShake(8); A.play("hitHeavy", { vol: 0.9 }); rubble(e, P, 2, 200, "e_stein", 0.6);
            if (m.n === 0) { m.n = 1; m.dir *= -1; m.hit = false; m.pause = 0.55; e.face = m.dir; FX.text(cxOf(e), e.y - 8, L(["Noch mal!", "Again!"]), "#ff6a3a", true); const a = AR(); tele({ k: "band", x0: m.dir > 0 ? cxOf(e) : a.x0, x1: m.dir > 0 ? a.x1 : cxOf(e), y: feet(e), h: 36, dur: 0.55, col: "#ff3a2a", arrow: m.dir }); }
            else { m.t = 99; e.st.stun = 2; FX.text(cxOf(e), e.y - 6, L(["Benommen!", "Dazed!"]), "#ffd27a", true); }
          }
        } }
    },
    phases: [
      { at: 1, name: N("Der Wächter des Wachturms", "Keeper of the Watchtower"), moves: ["sturm", "morgenstern", "hieb", "sprungschlag"] },
      { at: 0.66, name: N("Die Turmglocke", "The Tower Bell"), quote: N("Der Bugbear reißt die Glocke aus dem Gebälk. „DONG!“", "The bugbear tears the bell from the beams. 'DONG!'"), aura: "#ffb040", tempo: 1.15,
        moves: ["sturm", "morgenstern", "hieb", "gebruell", "sprungschlag", "glockenschlag"],
        enter: (e, P) => { e.nextMv = "glockenschlag"; if (e.partner && !e.partner.dead) { e.partner.phase = 1; FX.text(cxOf(e.partner), e.partner.y - 10, L(["„Ich mach das schon selbst.“", "\"I'll handle this myself.\""]), "#b080ff"); } },
        /* Mauerwerk bröckelt aus dem Turm */
        arena: (e, dt, P, s) => every(s, "bruch", dt, 3.6, () => rubble(e, P, 2, 240, "e_stein", 0.6)) },
      { at: 0.33, name: N("Blutrausch", "Blood Frenzy"), quote: N("„MEIN TURM! MEINE GOBLINS! MEINE BEUTE!“", "\"MY TOWER! MY GOBLINS! MY LOOT!\""), aura: "#ff3a2a", tempo: 1.35,
        moves: ["doppelsturm", "morgenstern", "hieb", "sprungschlag", "glockenschlag", "gebruell"],
        enter: (e, P) => { e.nextMv = "doppelsturm"; if (e.partner && !e.partner.dead) e.partner.phase = 2; },
        arena: (e, dt, P, s) => every(s, "bruch", dt, 2.8, () => rubble(e, P, 3, 260, "e_stein", 0.6)) }
    ]
  });
  extend("nezna", {
    names: { dolche: N("Dolchfächer", "Dagger Fan"), schattenstoss: N("Schattenstoß", "Shadow Strike"), dunkel: N("Dunkelheit", "Darkness") },
    phaseFollow: true,
    moves: {
      /* Fledermausschwarm: eine Kette dunkler Flatterer auf das markierte Ziel */
      schwarm: { name: N("Fledermausschwarm", "Bat Swarm"), pre: 0.6, dur: 1.0, post: 0.6, sfx: "bat",
        start: (e, P, m) => { m.aim = { x: pcx(P), y: P.y + 12 }; },
        preTick: (e, P, dt, m) => { if (m.t < 0.35) m.aim = { x: pcx(P), y: P.y + 12 }; },
        act: (e, P, m) => { e.hidden = 1.0; const kb = kv("e_feder", "#2a1830"); for (let i = 0; i < 9; i++) later(i * 0.07, () => { if (!alive(e)) return; const a = Math.atan2(m.aim.y - (e.y + 10), m.aim.x - cxOf(e)) + (R() - 0.5) * 0.18; Z.spawnProj("e_feder", cxOf(e), e.y + 10, 1, { dmg: dmg(e, 0.6), vx: Math.cos(a) * 280, vy: Math.sin(a) * 280, k: kb, g: 0, life: 2 }); if (i % 3 === 0) A.play("bat", { vol: 0.4, x: e.x }); }); FX.burst(cxOf(e), e.y + 10, 14, { col: ["#2a1830", "#b080ff"], sp: 90, life: 0.5, size: 3, kind: "smoke" }); } },
      /* Giftklinge: zwei Würfe kurz nacheinander */
      giftklinge: { name: N("Giftklinge", "Venom Blade"), pre: 0.5, dur: 0.5, post: 0.5, sfx: "throwK",
        act: (e, P) => { const t = () => { if (!alive(e)) return; Z.aimProj("e_dolch", cxOf(e), e.y + 8, pcx(P), P.y + 10, { dmg: dmg(e, 0.7), eff: { poison: 1 } }); }; t(); later(0.25, t); } }
    },
    phases: [
      { at: 1, moves: ["dolche", "schattenstoss", "dunkel", "giftklinge"] },
      { at: -1, moves: ["dolche", "schattenstoss", "dunkel", "giftklinge", "schwarm"] },
      { at: -1, moves: ["schattenstoss", "giftklinge", "schwarm", "dunkel"] }
    ]
  });

  /* ---------- WRAITH ---------- */
  extend("wraith", {
    def: { roar: "undead" },
    names: { sog: N("Lebenssog", "Life Drain"), kugeln: N("Seelenkugeln", "Soul Orbs"), blinzeln: N("Schattenschritt", "Shadow Step"), schatten: N("Schatten erwachen", "Shades Awaken"), schrei: N("Todesschrei", "Death Scream") },
    danger: ["sog", "schattenreigen"],
    moves: {
      /* Lebenssog: Reichweite als Ring angezeigt; eine Rolle zerreißt das Band für einen Moment */
      sog: { name: N("Lebenssog", "Life Drain"), pre: 0.75, dur: 1.6, post: 0.6, sfx: "dark",
        start: (e, P, m) => { tele({ k: "ring", x: cxOf(e), y: e.y + 15, r: 115, dur: PRE(e, 0.75), col: "#b070ff" }); },
        tick: (e, P, dt, m) => {
          e.vx *= 0.9; e.vy *= 0.9;
          if (P.rollT > 0 && m.tether) { m.cut = 0.6; FX.text(pcx(P), P.y - 10, L(["Losgerissen!", "Torn free!"]), "#e0c8ff"); FX.burst(pcx(P), P.y + 10, 8, { col: "#b070ff", sp: 90, life: 0.3, size: 2, kind: "spark", add: true }); }
          if (m.cut > 0) { m.cut -= dt; m.tether = false; return; }
          const d = U.dist(cxOf(e), e.y + 15, pcx(P), P.y + 12);
          m.tether = d < 115;
          if (m.tether && P.iframe <= 0) {
            P.vx += U.sign(cxOf(e) - pcx(P)) * 420 * dt;
            m.acc = (m.acc || 0) + dt;
            if (m.acc > 0.4) { m.acc = 0; Z.hurtPlayer(dmg(e, 0.35), { x: cxOf(e), kb: 0, unblockable: true }); P.hurtT = 0; e.hp = Math.min(e.hpMax, e.hp + e.hpMax * 0.01); }
          }
        },
        end: (e, P, m) => { m.tether = false; } },
      /* Knochenhände brechen nacheinander unter dem Spieler hervor */
      grabeshaende: { name: N("Grabeshände", "Grave Hands"), pre: 0.5, dur: 1.4, post: 0.5, sfx: "undead",
        act: (e, P, m) => { const n = e.phase >= 2 ? 4 : 3; for (let i = 0; i < n; i++) later(i * 0.38, () => { if (!alive(e)) return; const x = pcx(P), fy = standY(P); zone(e, x, fy, 30, 34, 0.62, 0.9, { col: "#c8a0ff", warnCol: "#b070ff", eff: { slow: 1.2 } }); later(0.62, () => FX.burst(x, fy - 4, 10, { col: ["#e8e0f0", "#9a6aff"], sp: 110, ang: -Math.PI / 2, spread: 1, life: 0.4, size: 2.4, kind: "shard", g: 300 })); }); } },
      /* Grabeskälte: sinkt auf Spielerhöhe und haucht eine kalte Wolke */
      kaeltehauch: { name: N("Grabeskälte", "Grave Chill"), pre: 0.7, dur: 1.1, post: 0.6, sfx: "dark",
        preTick: (e, P, dt) => { face(e, P); const ty = P.y + P.h - e.h; e.vy = U.clamp((ty - e.y) * 4, -140, 140); e.vx = U.approach(e.vx, 0, 400 * dt); },
        act: (e, P, m) => { m.h = Z.spawnHazard({ kind: "breath", x: cxOf(e) + e.face * 12, y: e.y + e.h * 0.6, w: 140, dir: e.face, life: 1.1, dmg: dmg(e, 0.3), owner: "e", eff: { slow: 1.5 }, col: "rgba(210,180,255,.55)" }); },
        tick: (e, P, dt, m) => { e.vx = 0; e.vy = 0; if (m.h) { m.h.x = cxOf(e) + e.face * 12; m.h.y = e.y + e.h * 0.6; } } },
      /* Schattenreigen: drei Schatten jagen waagrecht durch den Raum – jeweils auf Spielerhöhe */
      schattenreigen: { name: N("Schattenreigen", "Dance of Shades"), pre: 0.5, dur: 2.2, post: 0.8, sfx: "shadow",
        act: (e, P, m) => {
          const a = AR();
          for (let i = 0; i < 3; i++) later(i * 0.62, () => {
            if (!alive(e)) return;
            const yb = P.y + P.h - 4, dir = i % 2 ? -1 : 1;
            tele({ k: "band", x0: a.x0, x1: a.x1, y: yb, h: 18, dur: 0.6, col: "#b070ff", arrow: dir });
            later(0.6, () => {
              if (!alive(e)) return;
              zone(e, (a.x0 + a.x1) / 2, yb, a.x1 - a.x0, 18, 0, 0.9, { col: "rgba(176,112,255,.85)", active: 0.18 });
              for (let k = 0; k < 14; k++) FX.p({ x: dir > 0 ? a.x0 : a.x1, y: yb - 9 + (R() - 0.5) * 10, vx: dir * (600 + R() * 300), vy: 0, life: 0.5, size: 4, col: "#2a1838", kind: "smoke", drag: 1 });
              A.play("shadow", { vol: 0.6 });
            });
          });
          e.invuln = 0.4; FX.text(pcx(P), P.y - 16, L(["Springen oder fallen lassen!", "Jump or drop!"]), "#c8a0ff", true);
        } }
    },
    phases: [
      { at: 1, name: N("Hüter von Khaems Grab", "Keeper of Khaem's Tomb"), moves: ["sog", "kugeln", "blinzeln", "schatten", "grabeshaende"] },
      { at: 0.66, name: N("Grabeskälte", "Grave Chill"), quote: N("„… Khaem … schläft … Niemand … stört … ihren … Schlaf …“", "\"…Khaem… sleeps… None… shall… wake… her…\""), aura: "#9a6aff", tempo: 1.15,
        moves: ["sog", "kugeln", "blinzeln", "schatten", "grabeshaende", "kaeltehauch", "schrei"],
        enter: e => { e.nextMv = "kaeltehauch"; Z.darkness = Math.max(Z.darkness || 0, 1.5); },
        /* Das Grab atmet: kurze Dunkelheit in Abständen */
        arena: (e, dt, P, s) => every(s, "dunkel", dt, 8, () => { Z.darkness = Math.max(Z.darkness || 0, 1.5); A.play("dark", { vol: 0.4 }); }) },
      { at: 0.33, name: N("Schattenreigen", "Dance of Shades"), quote: N("„DAS GRAB GEHÖRT MIR. UND DU BALD AUCH.“", "\"THE TOMB IS MINE. AND SOON, SO ARE YOU.\""), aura: "#c040ff", tempo: 1.3, tint: { t: "#c040ff" },
        moves: ["sog", "kugeln", "grabeshaende", "kaeltehauch", "schattenreigen", "schrei", "blinzeln"],
        enter: e => { e.nextMv = "schattenreigen"; },
        /* Einzelne Hände tasten nach dem Spieler */
        arena: (e, dt, P, s) => every(s, "hand", dt, 3.2, () => { const x = pcx(P) + (R() - 0.5) * 50, fy = standY(P); zone(e, x, fy, 26, 30, 0.8, 0.7, { col: "#c8a0ff", warnCol: "#b070ff", eff: { slow: 1 } }); }) }
    ]
  });

  /* ---------- SCHMIEDEWÄCHTER ---------- */
  extend("schmiedewaechter", {
    def: { roar: "anvil" },
    names: { stampf: N("Erdstampfer", "Earth Stomp"), strahl: N("Runenstrahl", "Rune Beam"), pylone: N("Runenfunken", "Rune Sparks"), runenregen: N("Runenregen", "Rune Rain") },
    danger: ["kernschmelze"],
    moves: {
      /* Runenstrahl: hoch (ducken) oder tief (springen) – schon beim Ausholen angezeigt */
      strahl: { name: N("Runenstrahl", "Rune Beam"), pre: 1.0, dur: 0.5, post: 0.7, sfx: "rune",
        start: (e, P, m) => {
          const a = AR(); m.high = R() < 0.5; m.fy = feet(e); m.yb = m.high ? m.fy - 19 : m.fy;
          m.x0 = e.face > 0 ? cxOf(e) : Math.max(a.x0, cxOf(e) - 400); m.x1 = e.face > 0 ? Math.min(a.x1, cxOf(e) + 400) : cxOf(e);
          tele({ k: "band", x0: m.x0, x1: m.x1, y: m.yb, h: 14, dur: PRE(e, 1.0), col: "#ffb040", arrow: e.face });
          FX.text(cxOf(e), e.y - 12, m.high ? L(["Ducken!", "Duck!"]) : L(["Springen!", "Jump!"]), "#ffb040", true);
        },
        preTick: (e, P, dt) => { e.vx = U.approach(e.vx, 0, 900 * dt); },
        act: (e, P, m) => { zone(e, (m.x0 + m.x1) / 2, m.yb, m.x1 - m.x0, 14, 0, 1.2, { col: "rgba(255,170,60,.9)", active: 0.15, life: 0.4 }); FX.addShake(3); A.play("zap", { vol: 0.6 }); } },
      hammerfall: leapSlam({ name: N("Hammerfall", "Hammerfall"), r: 46, pre: 0.65, jump: 520, waves: true, m: 1.35, col: "#ffb040",
        land: (e, P, fy) => Z.spawnHazard({ kind: "fire", x: cxOf(e), y: fy, w: 44, life: 1.6, dmg: dmg(e, 0.25), owner: "e", eff: { burn: 1 } }) }),
      /* Runenkäfig: zwei Säulen sperren ein, dann schlägt es in der Mitte ein – an den Gitterstäben ist Platz */
      runenkaefig: { name: N("Runenkäfig", "Rune Cage"), pre: 0.6, dur: 1.6, post: 0.6, sfx: "magic",
        act: (e, P, m) => {
          const cx = pcx(P), fy = standY(P);
          for (const s of [-1, 1]) pillar(e, cx + s * 82, 0.7, 0.8, { w: 16, life: 1.6, col: "rgba(255,170,60,.85)", y: floorAt(cx + s * 82, fy) });
          tele({ k: "safe", x: cx - 58, y: fy, w: 22, dur: 1.4 }); tele({ k: "safe", x: cx + 58, y: fy, w: 22, dur: 1.4 });
          zone(e, cx, fy, 84, 46, 1.35, 1.3, { col: "rgba(255,190,80,.95)", warnCol: "#ff8a1a" });
          later(1.35, () => { if (alive(e)) { FX.addShake(6); A.play("explode", { vol: 0.6 }); FX.burst(cx, fy - 10, 20, { col: ["#ffb040", "#fff2d0"], sp: 160, life: 0.5, size: 2.4, kind: "spark", add: true }); } });
        } },
      /* Kernschmelze: Kern glüht auf, dann Explosion im Umkreis – danach ist er lange offen */
      kernschmelze: { name: N("Kernschmelze", "Meltdown"), pre: 0.4, dur: 1.2, post: 1.4, sfx: "fireBig",
        act: (e, P, m) => { tele({ k: "ring", x: cxOf(e), y: e.y + e.h / 2, r: 92, dur: 1.15, col: "#ff6a1a" }); FX.text(pcx(P), P.y - 16, L(["Weg von ihm!", "Get away!"]), "#ff8a3a", true); },
        tick: (e, P, dt, m) => { e.vx = 0; if (R() < dt * 40) FX.p({ x: cxOf(e) + (R() - 0.5) * e.w, y: e.y + R() * e.h, vx: 0, vy: -60, life: 0.5, size: 3, col: "#ffb040", kind: "glow", add: true }); if (m.t > 1.15 && !m.boom) { m.boom = true; zone(e, cxOf(e), feet(e) + 4, 184, e.h + 50, 0, 1.4, { col: "rgba(255,140,40,.9)", eff: { burn: 1 } }); FX.ring(cxOf(e), e.y + e.h / 2, 92, "#ff8a3a", 0.4, 5); FX.addShake(10); A.play("explode", { vol: 0.9 }); FX.burst(cxOf(e), e.y + e.h / 2, 40, { col: ["#ff8a3a", "#ffd27a", "#5a4a40"], sp: 230, life: 0.6, size: 3, kind: "spark", add: true }); } } }
    },
    phases: [
      { at: 1, name: N("Der letzte Wächter", "The Last Warden"), moves: ["stampf", "strahl", "pylone", "hammerfall"] },
      { at: 0.66, name: N("Glühende Runen", "Glowing Runes"), quote: N("Die Runen auf seiner Brust lodern: „EINDRINGLING. SCHMIEDE SCHÜTZEN.“", "The runes on its chest blaze: 'INTRUDER. PROTECT THE FORGE.'"), aura: "#ffb040", tempo: 1.15,
        moves: ["stampf", "strahl", "pylone", "runenregen", "hammerfall", "runenkaefig"],
        enter: e => { e.nextMv = "runenkaefig"; },
        /* Funkenflug aus den Essen */
        arena: (e, dt, P, s) => every(s, "funken", dt, 4, () => rubble(e, P, 2, 200, "e_glut", 0.5, "#ff8a1a")) },
      { at: 0.33, name: N("Kernschmelze", "Meltdown"), quote: N("„SCHMIEDE … WIRD … NICHT … FALLEN.“", "\"THE FORGE… SHALL… NOT… FALL.\""), aura: "#ff5a1a", tempo: 1.3, tint: { c: "#5a4a48" },
        moves: ["stampf", "strahl", "runenregen", "hammerfall", "runenkaefig", "kernschmelze"],
        enter: e => { e.nextMv = "kernschmelze"; },
        /* Runenboden: jedes zweite Feld lodert auf – in den Lücken oder in der Luft ist man sicher */
        arena: (e, dt, P, s) => every(s, "boden", dt, 5.2, () => {
          const a = AR(), seg = 40, x0 = pcx(P) - 180 + (s.flip ? seg : 0); s.flip = !s.flip;
          for (let i = 0; i < 9; i += 2) { const x = x0 + i * seg + seg / 2; if (x < a.x0 || x > a.x1) continue; zone(e, x, floorAt(x, standY(P)), seg, 18, 1.0, 0.7, { col: "rgba(255,170,60,.9)", warnCol: "#ff8a1a" }); }
        }) }
    ]
  });

  /* ---------- CHASME ---------- */
  extend("chasme", {
    def: { roar: "insect" },
    names: { stich: N("Rüsselstich", "Proboscis Strike"), summen: N("Einschläferndes Summen", "Drowsy Drone"), manen: N("Manen rufen", "Call Manes"), doppelstich: N("Doppelstich", "Double Sting") },
    danger: ["blutsauger"],
    moves: {
      /* Stachelregen: schwebt über dem Spieler, fächert Stacheln nach unten */
      stachelregen: { name: N("Stachelregen", "Stinger Rain"), pre: 0.7, dur: 0.8, post: 0.5, sfx: "insect",
        preTick: (e, P, dt, m) => { if (m.t < PRE(e, 0.7) - 0.3) { const tx = pcx(P) - e.w / 2, ty = P.y - 100; e.vx = U.clamp((tx - e.x) * 4, -220, 220); e.vy = U.clamp((ty - e.y) * 4, -220, 220); } else { e.vx *= 0.8; e.vy *= 0.8; } },
        act: (e, P) => {
          const wave = angs => { if (!alive(e)) return; for (const o of angs) { const a = Math.PI / 2 + o; Z.spawnProj("e_nadel", cxOf(e), feet(e), 1, { dmg: dmg(e, 0.6), vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, g: 0 }); } A.play("insect", { vol: 0.5 }); };
          wave([-0.75, -0.5, -0.27, 0.27, 0.5, 0.75]);
          later(0.55, () => wave([-0.2, 0, 0.2]));
          FX.text(pcx(P), P.y - 16, L(["Stehen – dann zur Seite!", "Stay – then step aside!"]), "#ffd27a", true);
        },
        tick: (e) => { e.vx *= 0.9; e.vy *= 0.9; } },
      /* Wespentanz: drei Stöße, jeder mit sichtbarer Ziellinie */
      wespentanz: { name: N("Wespentanz", "Wasp Dance"), pre: 0.4, dur: 3.2, post: 0.6, sfx: "insect",
        act: (e, P, m) => { m.k = 0; m.s = "aim"; m.st = 0; },
        tick: (e, P, dt, m) => {
          m.st += dt;
          if (m.s === "aim") { e.vx *= 0.85; e.vy *= 0.85; if (m.st < 0.3) m.aim = { x: pcx(P), y: P.y + 14 }; if (m.st > 0.5) { const a = Math.atan2(m.aim.y - (e.y + 10), m.aim.x - cxOf(e)); m.vx = Math.cos(a) * 470; m.vy = Math.sin(a) * 470; m.s = "dash"; m.st = 0; m.hit = false; A.play("insect", { vol: 0.6 }); } }
          else { e.vx = m.vx; e.vy = m.vy; if (!m.hit) m.hit = melee(e, { x: e.x, y: e.y, w: e.w, h: e.h }, 1.0); if (m.st > 0.4 || e.onGround || e.hitWall) { m.k++; m.s = "aim"; m.st = 0; m.aim = null; e.vy = -120; if (m.k >= 3) m.t = 99; } }
        } },
      /* Blutsauger: Sturz mit Ziellinie; trifft er, heilt die Chasme und der Spieler blutet */
      blutsauger: { name: N("Blutsauger", "Bloodsucker"), pre: 0.75, dur: 0.75, post: 0.7, sfx: "insect",
        start: (e, P, m) => { m.aim = { x: pcx(P), y: P.y + 14 }; },
        preTick: (e, P, dt, m) => { if (m.t < 0.45) m.aim = { x: pcx(P), y: P.y + 14 }; e.vx *= 0.9; e.vy = -30; },
        act: (e, P, m) => { const a = Math.atan2(m.aim.y - (e.y + 10), m.aim.x - cxOf(e)); m.vx = Math.cos(a) * 450; m.vy = Math.sin(a) * 450; },
        tick: (e, P, dt, m) => { e.vx = m.vx; e.vy = m.vy; if (!m.hit) { m.hit = melee(e, { x: e.x, y: e.y, w: e.w, h: e.h }, 1.2, { eff: { bleed: 2 } }); if (m.hit) { e.hp = Math.min(e.hpMax, e.hp + e.hpMax * 0.03); FX.text(cxOf(e), e.y - 8, L(["Saugt Blut!", "Drinks blood!"]), "#ff4a3a", true); } } if (e.onGround || e.hitWall) { m.t = 99; FX.addShake(4); } } }
    },
    phases: [
      { at: 1, name: N("Summender Dämon", "The Droning Demon"), moves: ["stich", "summen", "manen", "stachelregen"] },
      { at: 0.66, name: N("Ohrenbetäubendes Summen", "Deafening Drone"), quote: N("Das Summen schwillt an, bis die Zähne vibrieren …", "The drone swells until your teeth vibrate…"), aura: "#ff3a2a", tempo: 1.15,
        moves: ["stich", "summen", "manen", "doppelstich", "stachelregen", "wespentanz"],
        enter: e => { e.nextMv = "wespentanz"; },
        /* Risse im Raum: ab und zu kriecht ein Mane heraus (höchstens zwei) */
        arena: (e, dt, P, s) => every(s, "riss", dt, 9, () => { if (minions(e) >= 2) return; const a = AR(), x = U.clamp(pcx(P) + (R() < 0.5 ? -120 : 120), a.x0 + 20, a.x1 - 20), fy = floorAt(x, standY(P)); tele({ k: "ring", x, y: fy - 12, r: 16, dur: 1, col: "#ff3a2a" }); later(1, () => { if (!alive(e)) return; const m = Z.spawnEnemy("mane", x, fy - 2, { tier: e.tier }); if (m) { m.aware = true; m.master = e; m.spawnT = 0.4; } FX.burst(x, fy - 10, 14, { col: ["#3a1010", "#ff3a2a"], sp: 80, life: 0.5, size: 3, kind: "smoke" }); }); }) },
      { at: 0.33, name: N("Blutdurst", "Bloodthirst"), quote: N("Der Rüssel der Chasme glüht rot. Sie hat Blut geleckt.", "The chasme's proboscis glows red. It has tasted blood."), aura: "#e0201a", tempo: 1.35, tint: { t: "#ff1a1a" },
        moves: ["doppelstich", "wespentanz", "stachelregen", "blutsauger", "summen", "stich"],
        enter: e => { e.nextMv = "blutsauger"; },
        arena: (e, dt, P, s) => every(s, "riss", dt, 10, () => { if (minions(e) >= 2) return; const x = pcx(P) + (R() < 0.5 ? -110 : 110), fy = floorAt(x, standY(P)); tele({ k: "ring", x, y: fy - 12, r: 16, dur: 1, col: "#ff3a2a" }); later(1, () => { if (!alive(e)) return; const m = Z.spawnEnemy("mane", x, fy - 2, { tier: e.tier }); if (m) { m.aware = true; m.master = e; } }); }) }
    ]
  });

  /* ---------- ILVARA ---------- */
  extend("ilvaraW", {
    def: { roar: "laugh" },
    names: { wurzeln: N("Würgewurzeln", "Strangling Roots"), nebel: N("Giftnebel", "Poison Mist"), fuechse: N("Meine Tiere!", "My Animals!"), klingensturm: N("Klingensturm", "Blade Storm"), dolchfaecher: N("Dolchfächer", "Dagger Fan"), dunkelheit: N("Dunkelheit", "Darkness"), schattensprung: N("Schattensprung", "Shadow Leap") },
    danger: ["peitsche"],
    moves: {
      /* Klingensturm: Bahn wird angezeigt – drüber springen */
      klingensturm: { name: N("Klingensturm", "Blade Storm"), pre: 0.6, dur: 0.9, post: 0.55, sfx: "slash",
        start: (e, P, m) => { const a = AR(); m.dir = e.face; tele({ k: "band", x0: m.dir > 0 ? cxOf(e) : a.x0, x1: m.dir > 0 ? a.x1 : cxOf(e), y: feet(e), h: 28, dur: PRE(e, 0.6), col: "#b080ff", arrow: m.dir }); FX.text(pcx(P), P.y - 16, L(["Springen!", "Jump!"]), "#c8a0ff", true); },
        preTick: (e, P, dt) => { e.vx = U.approach(e.vx, 0, 900 * dt); },
        act: (e, P, m) => { m.dir = m.dir || e.face; },
        tick: (e, P, dt, m) => {
          e.vx = m.dir * 380; e.face = m.dir; e.invuln = 0.1;
          const k = Math.floor(m.t / 0.18); if (k !== m.k) { m.k = k; m.hit = false; FX.smear({ x: cxOf(e), y: feet(e) - 14, dir: m.dir, r: 26, a0: -1.2, a1: 1.2, th: 6, life: 0.12, col: "#b080ff" }); }
          if (!m.hit) m.hit = melee(e, box(e, -10, -26, 40, 26), 0.8);
          if (e.hitWall) { m.dir *= -1; e.face = m.dir; m.bounces = (m.bounces || 0) + 1; if (m.bounces > 1) m.t = 99; }
        } },
      /* Schattensprung: taucht hinter dem Spieler auf – Bodenmarke, dann der Stich */
      schattensprung: { name: N("Schattensprung", "Shadow Leap"), pre: 0.35, dur: 0.6, post: 0.5, sfx: "shadow",
        act: (e, P, m) => { e.x = pcx(P) - P.face * 36 - e.w / 2; e.y = P.y + P.h - e.h; Z.unstick(e); e.face = U.sign(P.x - e.x) || 1; FX.burst(cxOf(e), e.y + 12, 14, { col: ["#3a2a4a", "#b080ff"], sp: 70, life: 0.4, size: 3, kind: "smoke" }); tele({ k: "floor", x: cxOf(e) + e.face * 18, y: feet(e), w: 40, dur: 0.4, col: "#b080ff" }); },
        tick: (e, P, dt, m) => { e.vx = 0; if (m.t > 0.4 && !m.hit) { m.hit = true; melee(e, box(e, 0, -26, 34, 24), 1.2); FX.smear({ x: cxOf(e), y: feet(e) - 14, dir: e.face, r: 28, a0: -1.2, a1: 1.2, th: 7, life: 0.13, col: "#b080ff" }); A.play("slash"); } } },
      /* Kräutersuppe: der Topf fliegt – Giftpfützen */
      suppe: { name: N("Kräutersuppe", "Herbal Soup"), pre: 0.6, dur: 0.4, post: 0.6, sfx: "slime", range: [40, 999],
        start: e => { FX.text(cxOf(e), e.y - 14, L(["„Noch etwas Suppe, Fremder?“", "\"More soup, stranger?\""]), "#9ad04a"); },
        act: (e, P) => { for (let i = -1; i <= 1; i++) Z.aimProj("e_gift", cxOf(e), e.y + 6, pcx(P) + i * 46, P.y + P.h, { dmg: dmg(e, 0.7) }); } },
      /* Spinnenpeitsche: tief (springen), dann hoch (ducken) */
      peitsche: { name: N("Spinnenpeitsche", "Spider Scourge"), pre: 0.65, dur: 0.7, post: 0.6, sfx: "whip", range: [0, 110],
        start: (e, P, m) => { m.lowFirst = R() < 0.5; const f = feet(e), x0 = e.face > 0 ? cxOf(e) : cxOf(e) - 104, x1 = x0 + 104; tele({ k: "band", x0, x1, y: f - (m.lowFirst ? 0 : 18), h: m.lowFirst ? 14 : 16, dur: PRE(e, 0.65), col: "#c03a5a" }); FX.text(cxOf(e), e.y - 14, m.lowFirst ? L(["Springen – dann ducken!", "Jump – then duck!"]) : L(["Ducken – dann springen!", "Duck – then jump!"]), "#e07090", true); },
        tick: (e, P, dt, m) => {
          const lash = (low) => { const r = box(e, 4, low ? -14 : -34, 100, low ? 14 : 16); melee(e, r, 0.9, { eff: { poison: 2 } }); FX.smear({ x: cxOf(e), y: feet(e) - (low ? 7 : 26), dir: e.face, r: 96, a0: -0.08, a1: 0.08, th: 3, life: 0.16, col: "#c03a5a", stab: true }); A.play("whip", { vol: 0.6 }); };
          if (!m.a && m.t > 0.02) { m.a = true; lash(m.lowFirst); const f = feet(e), x0 = e.face > 0 ? cxOf(e) : cxOf(e) - 104; tele({ k: "band", x0, x1: x0 + 104, y: f - (!m.lowFirst ? 0 : 18), h: !m.lowFirst ? 14 : 16, dur: 0.42, col: "#c03a5a" }); }
          if (!m.b && m.t > 0.45) { m.b = true; lash(!m.lowFirst); }
        } },
      /* Lolths Netz: drei klebrige Netze im Fächer */
      lolthsnetz: { name: N("Lolths Netz", "Lolth's Web"), pre: 0.55, dur: 0.3, post: 0.5, sfx: "web",
        act: (e, P) => { for (let i = -1; i <= 1; i++) { const a = Math.atan2(P.y + 12 - (e.y + 10), pcx(P) - cxOf(e)) + i * 0.25; Z.spawnProj("e_netz", cxOf(e), e.y + 10, 1, { dmg: dmg(e, 0.4), vx: Math.cos(a) * 240, vy: Math.sin(a) * 240 }); } } },
      brut: { name: N("Spinnenbrut", "Spider Brood"), pre: 0.7, dur: 0.2, post: 0.5, sfx: "insect", w: 0.6, cond: e => minions(e) < 3, act: e => summon(e, "spinnchen", 3, 26) }
    },
    phases: [
      { at: 1, name: N("Die freundliche Druidin", "The Kindly Druid"), moves: ["wurzeln", "nebel", "fuechse", "suppe"] },
      { at: 0.66, name: N("Die Maske fällt", "The Mask Falls"), quote: N("„Suppe? Ich koche DICH, Oberflächenwurm!“", "\"Soup? I'll cook YOU, surface worm!\""), aura: "#b080ff", tempo: 1.1,
        moves: ["klingensturm", "dolchfaecher", "dunkelheit", "schattensprung", "peitsche"],
        enter: e => { e.revealed = true; e.def.c = "#1a1420"; FX.flashScreen("#b080ff", 0.3); FX.burst(cxOf(e), e.y + 14, 30, { col: ["#3a6a3a", "#c8682a", "#1a1420"], sp: 140, life: 0.7, size: 3, kind: "smoke" }); e.nextMv = "peitsche"; } },
      { at: 0.33, name: N("Lolths Dienerin", "Servant of Lolth"), quote: N("„Lolth, sieh her! Ich bringe dir sein Herz!“", "\"Lolth, behold! I bring you his heart!\""), aura: "#c03a5a", tempo: 1.3,
        moves: ["klingensturm", "dolchfaecher", "peitsche", "lolthsnetz", "schattensprung", "brut"],
        enter: (e, P) => { e.revealed = true; e.def.c = "#1a1420"; e.nextMv = "brut"; const a = AR(); const fy = standY(P); for (const dx of [-120, 120]) { const x = U.clamp(pcx(P) + dx, a.x0 + 30, a.x1 - 30); web(x, floorAt(x, fy), 54, 34, 30); } },
        /* Netze spannen sich durch den Raum */
        arena: (e, dt, P, s) => every(s, "netz", dt, 7, () => { const a = AR(), x = U.clamp(pcx(P) + (R() - 0.5) * 220, a.x0 + 30, a.x1 - 30); tele({ k: "floor", x, y: floorAt(x, standY(P)), w: 48, dur: 0.8, col: "#eee8f0" }); later(0.8, () => { if (alive(e)) web(x, floorAt(x, standY(P)), 48, 30, 9); }); }) }
    ]
  });

  /* ---------- DER RASENDE RIESE ---------- */
  extend("riese", {
    def: { roar: "roar" },
    names: { stampfen: N("Stampfen", "Stomp"), felswurf: N("Felswurf", "Boulder Toss"), fausthieb: N("Fausthieb", "Fist Swing"), erdbeben: N("Erdbeben", "Earthquake") },
    danger: ["doppelfaust"],
    moves: {
      /* Felsrollen: ein Brocken rollt über den Boden – springen */
      felsrollen: { name: N("Felsrollen", "Rolling Boulder"), pre: 0.7, dur: 0.4, post: 0.6, sfx: "rock",
        act: (e, P) => { const dir = pcx(P) > cxOf(e) ? 1 : -1, n = e.phase >= 2 ? 2 : 1; for (let i = 0; i < n; i++) later(i * 0.7, () => { if (!alive(e)) return; Z.spawnProj("e_stein", cxOf(e) + dir * 24, feet(e) - 8, dir, { vx: dir * 190, vy: 0, g: 0, r: 8, life: 3.5, dmg: dmg(e, 1.0) }); A.play("rock", { vol: 0.7 }); FX.addShake(3); }); FX.text(pcx(P), P.y - 16, L(["Springen!", "Jump!"]), "#ffd27a"); } },
      /* Stimmen im Kopf: er taumelt (verwundbar!), dann schreit er im Umkreis */
      stimmen: { name: N("Stimmen im Kopf", "Voices in His Head"), pre: 0.35, dur: 2.0, post: 0.8, sfx: "monster",
        act: (e, P, m) => { e.st.mark = 1.5; FX.text(cxOf(e), e.y - 14, L(["Er taumelt – zuschlagen!", "He staggers – strike!"]), "#ffe08a", true); },
        tick: (e, P, dt, m) => {
          e.vx = Math.sin(m.t * 7) * 30;
          if (m.t > 1.05 && !m.w) { m.w = true; tele({ k: "ring", x: cxOf(e), y: e.y + e.h / 2, r: 100, dur: 0.85, col: "#ff3a2a" }); FX.text(pcx(P), P.y - 16, L(["Weg!", "Away!"]), "#ff6a3a", true); }
          if (m.t > 1.9 && !m.s) { m.s = true; zone(e, cxOf(e), feet(e) + 4, 200, e.h + 40, 0, 1.2, { col: "rgba(255,210,122,.85)", eff: { stun: 0.4 } }); FX.ring(cxOf(e), e.y + e.h / 2, 100, "#ffd27a", 0.45, 6); FX.addShake(9); A.play("roar", { vol: 0.9 }); }
        } },
      riesensprung: leapSlam({ name: N("Riesensprung", "Giant Leap"), r: 52, pre: 0.7, jump: 520, waves: true, waveLife: 1.8, m: 1.4 }),
      /* Doppelfaust: hoch (ducken), dann tief (springen) – oder umgekehrt */
      doppelfaust: { name: N("Doppelfaust", "Double Fist"), pre: 0.8, dur: 0.95, post: 0.75, sfx: "swingHeavy", range: [0, 150],
        start: (e, P, m) => { m.highFirst = R() < 0.5; FX.text(cxOf(e), e.y - 14, m.highFirst ? L(["Ducken – dann springen!", "Duck – then jump!"]) : L(["Springen – dann ducken!", "Jump – then duck!"]), "#ffd27a", true); const x0 = e.face > 0 ? cxOf(e) : cxOf(e) - 130; tele({ k: "band", x0, x1: x0 + 130, y: feet(e) - (m.highFirst ? 19 : 0), h: m.highFirst ? 30 : 15, dur: PRE(e, 0.8), col: "#ff3a2a" }); },
        tick: (e, P, dt, m) => {
          const swing = hi => { melee(e, box(e, -10, hi ? -60 : -15, 130, hi ? 41 : 15), 1.2); FX.smear({ x: cxOf(e), y: feet(e) - (hi ? 38 : 8), dir: e.face, r: 84, a0: -0.25, a1: 0.25, th: 16, life: 0.2, col: "#c8a090" }); FX.addShake(5); A.play("swingHeavy", { vol: 0.7 }); };
          if (!m.a) { m.a = true; swing(m.highFirst); const x0 = e.face > 0 ? cxOf(e) : cxOf(e) - 130; tele({ k: "band", x0, x1: x0 + 130, y: feet(e) - (!m.highFirst ? 19 : 0), h: !m.highFirst ? 30 : 15, dur: 0.55, col: "#ff3a2a" }); }
          if (!m.b && m.t > 0.55) { m.b = true; swing(!m.highFirst); }
        } }
    },
    phases: [
      { at: 1, name: N("Der rasende Riese", "The Raging Giant"), moves: ["stampfen", "felswurf", "fausthieb", "felsrollen"] },
      { at: 0.66, name: N("Stimmen im Kopf", "Voices in His Head"), quote: N("„DIE STIMMEN! SIE SOLLEN AUFHÖREN! SIE SOLLEN ENDLICH AUFHÖREN!“", "\"THE VOICES! MAKE THEM STOP! MAKE THEM FINALLY STOP!\""), aura: "#ff8a3a", tempo: 1.15,
        moves: ["stampfen", "felswurf", "fausthieb", "erdbeben", "felsrollen", "stimmen"],
        enter: e => { e.nextMv = "stimmen"; },
        /* Die Decke bröckelt bei jedem Schritt */
        arena: (e, dt, P, s) => every(s, "decke", dt, 3.4, () => rubble(e, P, 2, 220, "e_stein", 0.6)) },
      { at: 0.33, name: N("ZERSCHLAGEN!", "SMASH!"), quote: N("„ZERSCHLAGEN … ALLES … ZERSCHLAGEN!“", "\"SMASH… EVERYTHING… SMASH!\""), aura: "#ff3a2a", tempo: 1.3,
        moves: ["stampfen", "fausthieb", "erdbeben", "felsrollen", "stimmen", "riesensprung", "doppelfaust"],
        enter: e => { e.nextMv = "riesensprung"; },
        /* Risse im Boden: Felsspitzen brechen in einer Welle hervor */
        arena: (e, dt, P, s) => {
          every(s, "decke", dt, 3.8, () => rubble(e, P, 2, 220, "e_stein", 0.6));
          every(s, "riss", dt, 5, () => { const a = AR(), dir = R() < 0.5 ? 1 : -1, x0 = dir > 0 ? Math.max(a.x0, pcx(P) - 200) : Math.min(a.x1, pcx(P) + 200); floorSweep(e, x0, dir, 400, { warn: 0.8, gap: 0.04, seg: 24, h: 22, col: "#c8a070", m: 0.8, sfx: "rock", ref: standY(P) }); });
        } }
    ]
  });

  /* ---------- VROCK ---------- */
  extend("vrock", {
    def: { roar: "roar" },
    names: { sturzflug: N("Sturzflug", "Dive"), federn: N("Federfächer", "Feather Fan"), sporen: N("Sporen", "Spores"), schrei: N("Betäubender Schrei", "Stunning Screech"), manen: N("Manen rufen", "Call Manes") },
    danger: ["schrei", "verderbenstanz"],
    moves: {
      federsturm: { name: N("Federsturm", "Feather Storm"), pre: 0.6, dur: 1.4, post: 0.5, sfx: "bat",
        preTick: (e, P, dt) => { e.vy = U.approach(e.vy, -80, 400 * dt); },
        act: (e, P) => K.rainProj("e_feder", e.phase >= 2 ? 10 : 7, 230, e, 0.6, { gap: 110 }) },
      /* Sporenbombe: ein Sporensack platzt zur großen Wolke */
      sporenbombe: { name: N("Sporenbombe", "Spore Bomb"), pre: 0.6, dur: 0.3, post: 0.5, sfx: "poison",
        act: (e, P) => { const x = pcx(P), fy = standY(P); tele({ k: "floor", x, y: fy, w: 70, dur: 0.9, col: "#9ad04a" }); Z.aimProj("e_gift", cxOf(e), feet(e) - 4, x, fy - 2, { dmg: dmg(e, 0.6) }); later(0.9, () => { if (alive(e)) Z.spawnHazard({ kind: "poisoncloud", x, y: fy, w: 76, life: 4.5, dmg: dmg(e, 0.12), owner: "e", eff: { poison: 1 } }); }); } },
      /* Tanz des Verderbens: Blitze schlagen überall ein – nur die grünen Felder sind sicher */
      verderbenstanz: { name: N("Tanz des Verderbens", "Dance of Ruin"), pre: 1.2, dur: 1.6, post: 1.0, sfx: "zap",
        preTick: (e, P, dt, m) => { e.vx *= 0.9; e.vy = U.approach(e.vy, -40, 300 * dt); if (R() < dt * 30) FX.p({ x: cxOf(e) + (R() - 0.5) * 40, y: e.y + R() * e.h, vx: (R() - 0.5) * 120, vy: (R() - 0.5) * 120, life: 0.2, size: 1.6, col: "#ffe080", kind: "spark", add: true }); if (!m.r && m.t > 0.2) { m.r = true; FX.ring(cxOf(e), e.y + e.h / 2, 60, "#ffe080", 0.8, 2); } },
        act: (e, P, m) => {
          const a = AR(), sp = 38, fy0 = standY(P), xs = [];
          for (let x = Math.max(a.x0 + 10, pcx(P) - 230); x <= Math.min(a.x1 - 10, pcx(P) + 230); x += sp) xs.push(x);
          /* eine sichere Stelle liegt immer in Reichweite (≤ 110 px), die zweite irgendwo anders */
          const near = xs.map((x, i) => i).filter(i => Math.abs(xs[i] - pcx(P)) > 30 && Math.abs(xs[i] - pcx(P)) < 110);
          const g1 = near.length ? near[Math.floor(R() * near.length)] : Math.floor(xs.length / 2);
          let g2 = Math.floor(R() * xs.length); for (let k = 0; k < 8 && Math.abs(g2 - g1) < 3; k++) g2 = Math.floor(R() * xs.length);
          xs.forEach((x, i) => {
            if (i === g1 || i === g2) { tele({ k: "safe", x, y: floorAt(x, fy0), w: sp - 6, dur: 1.4 }); return; }
            K.strikeAt(x, { y: floorAt(x, fy0), w: sp - 2, dmg: dmg(e, 1.0), col: "rgba(255,240,160,1)", warnCol: "#ffe080", warn: 1.15, eff: { stun: 0.3 } });
          });
          FX.text(pcx(P), P.y - 18, L(["Auf die grünen Felder!", "Onto the green spots!"]), "#9ad04a", true);
          later(1.15, () => { if (alive(e)) { A.play("thunder", { vol: 0.9 }); FX.flashScreen("#fff8d0", 0.25); FX.addShake(8); } });
        },
        tick: (e) => { e.vx *= 0.9; e.vy *= 0.9; } }
    },
    phases: [
      { at: 1, name: N("Geier aus dem Abyss", "Vulture of the Abyss"), moves: ["sturzflug", "federn", "sporen", "schrei", "federsturm"] },
      { at: 0.66, name: N("Aasgeier", "Carrion Feast"), quote: N("„KRAAAH! Euer Blut riecht nach Furcht!“", "\"KRAAAH! Your blood smells of fear!\""), aura: "#c8a070", tempo: 1.15,
        moves: ["sturzflug", "federn", "sporen", "schrei", "manen", "federsturm", "sporenbombe"],
        enter: e => { e.nextMv = "sporenbombe"; },
        /* Sporen quellen aus Ritzen */
        arena: (e, dt, P, s) => every(s, "spore", dt, 5.5, () => { const a = AR(), x = U.clamp(pcx(P) + (R() < 0.5 ? -1 : 1) * (60 + R() * 80), a.x0 + 20, a.x1 - 20), fy = floorAt(x, standY(P)); tele({ k: "floor", x, y: fy, w: 50, dur: 1, col: "#9ad04a" }); later(1, () => { if (alive(e)) Z.spawnHazard({ kind: "poisoncloud", x, y: fy, w: 52, life: 3.5, dmg: dmg(e, 0.1), owner: "e", eff: { poison: 1 } }); }); }) },
      { at: 0.33, name: N("Tanz des Verderbens", "Dance of Ruin"), quote: N("Der Vrock beginnt zu tanzen. Funken knistern zwischen seinen Federn.", "The vrock begins to dance. Sparks crackle between its feathers."), aura: "#ffd27a", tempo: 1.3,
        moves: ["sturzflug", "federn", "schrei", "federsturm", "sporenbombe", "verderbenstanz"],
        enter: e => { e.nextMv = "verderbenstanz"; },
        arena: (e, dt, P, s) => every(s, "blitz", dt, 3.2, () => stormBolt(e, P, 0.8)) }
    ]
  });

  /* ---------- DEMOGORGON ---------- */
  extend("demogorgon", {
    def: { roar: "monster" },
    names: { tentakel: N("Tentakelschlag", "Tentacle Strike"), blick: N("Bannblick", "Binding Gaze"), doppelblick: N("Doppelblick", "Double Gaze"), schrei: N("Seelenschrei", "Soul Scream"), rochen: N("Rochenschwarm", "Ray Swarm"), wellen: N("Seebeben", "Lakequake"), tentakelsturm: N("Tentakelsturm", "Tentacle Storm") },
    danger: ["abgrundsog"],
    moves: {
      /* Tentakelfeger: ein Arm fegt über den ganzen Boden – springen */
      tentakelfeger: { name: N("Tentakelfeger", "Tentacle Sweep"), pre: 0.6, dur: 1.6, post: 0.6, sfx: "monster",
        act: (e, P) => { const a = AR(), left = R() < 0.5; floorSweep(e, left ? a.x0 : a.x1, left ? 1 : -1, a.x1 - a.x0, { warn: 0.75, gap: 0.022, seg: 22, h: 18, col: "#c88a50", m: 1.1, fx: ["#6a4a2a", "#c88a50"], sfx: "splash" }); FX.text(pcx(P), P.y - 16, L(["Springen!", "Jump!"]), "#ffd27a", true); if (e.phase >= 3) later(1.1, () => { if (alive(e)) floorSweep(e, left ? a.x1 : a.x0, left ? -1 : 1, a.x1 - a.x0, { warn: 0.6, gap: 0.022, seg: 22, h: 18, col: "#c88a50", m: 1.1, sfx: "splash" }); }); } },
      /* Zwiegesicht: jeder Kopf bannt eine Hälfte – tief oder hoch, dann vertauscht */
      zwiegesicht: { name: N("Zwiegesicht", "Twin Gaze"), pre: 0.7, dur: 1.9, post: 0.7, sfx: "magic",
        act: (e, P) => {
          const a = AR(), mid = cxOf(e), fy = a.floor, lowLeft = R() < 0.5;
          const wave = (ll, warn) => {
            beam(e, a.x0, mid, ll ? fy : fy - 19, ll ? 15 : 17, warn, 1.0, { col: "rgba(255,210,120,.9)", warnCol: ll ? "#ff3a2a" : "#ff8a1a", sfx: "zap" });
            beam(e, mid, a.x1, !ll ? fy : fy - 19, !ll ? 15 : 17, warn, 1.0, { col: "rgba(255,210,120,.9)", warnCol: !ll ? "#ff3a2a" : "#ff8a1a", sfx: false });
          };
          wave(lowLeft, 0.95); later(1.0, () => { if (alive(e)) wave(!lowLeft, 0.8); });
          const leftSide = pcx(P) < mid, low1 = leftSide === lowLeft;
          FX.text(pcx(P), P.y - 18, low1 ? L(["Springen – dann ducken!", "Jump – then duck!"]) : L(["Ducken – dann springen!", "Duck – then jump!"]), "#ffd27a", true);
        } },
      /* Sog des Abgrunds: zieht zur Mitte, Tentakel brechen um ihn herum hervor */
      abgrundsog: { name: N("Sog des Abgrunds", "Pull of the Abyss"), pre: 0.7, dur: 2.6, post: 0.8, sfx: "dark",
        act: (e, P, m) => { FX.text(pcx(P), P.y - 18, L(["Gegen den Sog anrennen!", "Run against the pull!"]), "#ff8a3a", true); m.k = 0; },
        tick: (e, P, dt, m) => {
          drift(P, cxOf(e), e.phase >= 3 ? 95 : 80, dt);
          if (R() < dt * 40) { const s = R() < 0.5 ? -1 : 1, x = cxOf(e) + s * (120 + R() * 260); FX.p({ x, y: AR().floor - 6 - R() * 60, vx: -s * 260, vy: 0, life: 0.5, size: 2, col: "#c88a50", kind: "spark", add: true, drag: 1 }); }
          m.k -= dt; if (m.k <= 0) { m.k = 0.55; for (const s of [-1, 1]) { const x = cxOf(e) + s * (60 + R() * 40); pillar(e, x, 0.7, 1.0, { w: 30, col: "rgba(200,140,80,.7)" }); } }
        } }
    },
    phases: [
      { at: 1, name: N("Fürst der Dämonen", "Prince of Demons"), moves: ["tentakel", "blick", "schrei", "rochen", "tentakelfeger"] },
      { at: 0.7, name: N("Zwei Köpfe, ein Wahn", "Two Heads, One Madness"), quote: N("Zwei Stimmen zugleich: „WIR SIND VIELE. DU BIST ALLEIN.“", "Two voices at once: \"WE ARE MANY. YOU ARE ALONE.\""), aura: "#ffd27a", tempo: 1.1,
        moves: ["tentakel", "doppelblick", "schrei", "rochen", "wellen", "tentakelfeger", "zwiegesicht"],
        enter: e => { e.nextMv = "zwiegesicht"; },
        /* Der See schwappt von beiden Seiten herein */
        arena: (e, dt, P, s) => every(s, "see", dt, 7.5, () => { const a = AR(); for (const [x, d] of [[a.x0 + 10, 1], [a.x1 - 10, -1]]) { tele({ k: "floor", x, y: a.floor, w: 40, dur: 0.9, col: "#c88a50" }); later(0.9, () => { if (alive(e)) Z.spawnProj("e_welle", x, a.floor - 6, d, { dmg: dmg(e, 0.9), life: 2.2, speed: 200 }); }); } A.play("splash", { vol: 0.6 }); }) },
      { at: 0.4, name: N("Der See erhebt sich", "The Lake Rises"), quote: N("„Der See gehört uns. Die Tiefe gehört uns. DU gehörst uns.“", "\"The lake is ours. The deep is ours. YOU are ours.\""), aura: "#ff8a3a", tempo: 1.2,
        moves: ["tentakel", "doppelblick", "wellen", "tentakelfeger", "zwiegesicht", "abgrundsog", "tentakelsturm"],
        enter: e => { e.nextMv = "abgrundsog"; },
        /* Tropfsteine lösen sich von der Höhlendecke */
        arena: (e, dt, P, s) => { every(s, "stein", dt, 3.2, () => rubble(e, P, 2, 260, "e_stein", 0.7)); every(s, "see", dt, 9, () => { const a = AR(); for (const [x, d] of [[a.x0 + 10, 1], [a.x1 - 10, -1]]) { tele({ k: "floor", x, y: a.floor, w: 40, dur: 0.9, col: "#c88a50" }); later(0.9, () => { if (alive(e)) Z.spawnProj("e_welle", x, a.floor - 6, d, { dmg: dmg(e, 0.9), life: 2.2, speed: 200 }); }); } }); } },
      { at: 0.15, name: N("Aameul & Hathradiah", "Aameul & Hathradiah"), quote: N("„AAMEUL! HATHRADIAH! ZERREISST IHN!“", "\"AAMEUL! HATHRADIAH! TEAR HIM APART!\""), aura: "#ff3a2a", tempo: 1.4, transDur: 2,
        moves: ["tentakelsturm", "zwiegesicht", "abgrundsog", "tentakelfeger", "doppelblick", "tentakel"],
        enter: (e, P) => { e.nextMv = "tentakelfeger"; const a = AR(); for (const [x0, x1] of [[a.x0, a.x0 + 80], [a.x1 - 80, a.x1]]) tele({ k: "band", x0, x1, y: a.floor, h: 12, dur: 1.2, col: "#a01a2a" }); later(1.2, () => { if (!alive(e)) return; for (const [x0, x1] of [[a.x0, a.x0 + 80], [a.x1 - 80, a.x1]]) sheet(e, x0, x1, a.floor, { life: 999, m: 0.4, col: "#2a0a14", col2: "#a01a2a", glow: "#ff3a2a", eff: { slow: 1 } }); }); },
        arena: (e, dt, P, s) => every(s, "stein", dt, 2.6, () => rubble(e, P, 2, 240, "e_stein", 0.7)) }
    ]
  });

  /* ---------- THEMBERCHAUD ---------- */
  const goldWave = kv("e_welle", "#ffd27a");
  extend("themberchaud", {
    def: { roar: "dragon" },
    names: { odem: N("Flammenodem", "Flame Breath"), klauen: N("Klauenhiebe", "Claw Swipes"), fluegel: N("Flügelschlag", "Wing Buffet"), muenzregen: N("Münzregen", "Coin Rain"), sturzflug: N("Sturzflug", "Dive"), geysire: N("Lavageysire", "Lava Geysers"), feuersturm: N("Feuersturm", "Firestorm") },
    danger: ["hortschmelze"],
    moves: {
      /* Goldlawine: Schwanzschlag in den Hort – zwei Goldwellen, springen */
      goldlawine: { name: N("Goldlawine", "Gold Avalanche"), pre: 0.7, dur: 0.9, post: 0.6, sfx: "coin",
        act: (e, P) => { const go = () => { if (!alive(e)) return; for (const s of [-1, 1]) Z.spawnProj("e_welle", cxOf(e) + s * 36, feet(e) - 6, s, { dmg: dmg(e, 0.9), life: 2.6, speed: 220, k: goldWave }); FX.burst(cxOf(e), feet(e) - 8, 24, { col: ["#ffd27a", "#c08a2a"], sp: 200, ang: -Math.PI / 2, spread: 2.4, life: 0.7, size: 2.4, kind: "shard", g: 600 }); A.play("coin", { vol: 0.8 }); FX.addShake(6); }; go(); later(0.55, go); } },
      /* Flammenteppich: fliegt auf und zieht eine Feuerspur über den Boden */
      flammenteppich: { name: N("Flammenteppich", "Carpet of Flame"), pre: 0.7, dur: 1.5, post: 0.6, sfx: "fireBig",
        start: e => { e.grounded = false; e.vy = -220; },
        preTick: (e, P, dt) => { e.vy = U.approach(e.vy, 0, 500 * dt); e.vx = U.approach(e.vx, 0, 300 * dt); },
        act: (e, P) => { const a = AR(), dir = pcx(P) > cxOf(e) ? 1 : -1, x0 = U.clamp(cxOf(e), a.x0, a.x1); carpet(e, x0, dir, 300, { warn: 1.0, gap: 0.04, life: 1.4, m: 0.3, eff: { burn: 1 } }); },
        tick: (e, P, dt) => { e.vy = U.approach(e.vy, 0, 600 * dt); e.vx = U.approach(e.vx, 0, 300 * dt); if (R() < dt * 30) FX.p({ x: cxOf(e) + e.face * 30, y: feet(e) - 10, vx: 0, vy: 160, life: 0.4, size: 4, col: "#ff8a3a", kind: "glow", add: true }); } },
      /* Der Hort schmilzt: der ganze Boden wird zu Lava – nur Plattformen sind sicher */
      hortschmelze: { name: N("Der Hort schmilzt", "The Hoard Melts"), pre: 2.2, dur: 3.4, post: 0.6, sfx: "fireBig", w: 0.8,
        cond: e => !e.ar || !e.ar.lastMelt || e.phaseT - e.ar.lastMelt > 12,
        start: (e, P, m) => { const a = AR(); e.ar.lastMelt = e.phaseT || 0; e.grounded = false; e.vy = -260; tele({ k: "band", x0: a.x0, x1: a.x1, y: a.floor, h: 10, dur: PRE(e, 2.2), col: "#ff5a1a" }); Z.bossSay && Z.bossSay(L(["Der Hort schmilzt zu Lava – auf die Plattformen!", "The hoard melts into lava – onto the platforms!"])); FX.text(pcx(P), P.y - 22, L(["Auf die Plattformen!", "Onto the platforms!"]), "#ff8a3a", true); A.play("fireBig", { vol: 0.8 }); },
        preTick: (e, P, dt) => { const a = AR(), ty = a.floor - 190; e.vy = U.clamp((ty - e.y) * 3, -200, 200); e.vx = U.clamp(((a.x0 + a.x1) / 2 - cxOf(e)) * 2, -160, 160); if (R() < dt * 25) FX.p({ x: AR().x0 + R() * (AR().x1 - AR().x0), y: AR().floor - 2, vx: 0, vy: -40, life: 0.5, size: 2, col: "#ff8a3a", kind: "spark", add: true }); },
        act: (e, P, m) => { const a = AR(); m.s = sheet(e, a.x0, a.x1, a.floor, { life: 3.4, rise: 0.4, m: 0.7, col: "#8a1a08", col2: "#ffb040", glow: "#ffd27a", eff: { burn: 1 } }); FX.addShake(8); A.play("fireBig", { vol: 1 }); },
        tick: (e, P, dt, m) => { e.vx *= 0.9; e.vy *= 0.9; m.k = (m.k == null ? 0.8 : m.k) - dt; if (m.k <= 0) { m.k = 1.3; Z.aimProj("e_feuerball", cxOf(e), feet(e) - 8, pcx(P), P.y + 12, { dmg: dmg(e, 0.6), speed: 170 }); A.play("fire", { vol: 0.5 }); } },
        abort: (e, P, m) => { if (m.s) m.s.life = Math.min(m.s.life, m.s.t + 0.4); } }
    },
    phases: [
      { at: 1, name: N("Meister der Flammen", "Master of Flames"), moves: ["odem", "klauen", "fluegel", "muenzregen", "goldlawine"] },
      { at: 0.7, name: N("Der Hort erwacht", "The Hoard Awakens"), quote: N("„Ihr trampelt mit DRECKIGEN STIEFELN über MEIN Gold?!“", "\"You trample MY gold with FILTHY BOOTS?!\""), aura: "#ffb040", tempo: 1.1,
        moves: ["odem", "klauen", "sturzflug", "geysire", "muenzregen", "goldlawine", "flammenteppich"],
        enter: e => { e.nextMv = "goldlawine"; },
        /* Die Lavagruben spucken */
        arena: (e, dt, P, s) => every(s, "grube", dt, 4.2, () => { const a = AR(), pits = [16 * T, 39 * T].filter(x => x > a.x0 && x < a.x1); const x = pits[Math.floor(R() * pits.length)] || pcx(P); pillar(e, x, 0.9, 0.9, { w: 56, hgt: 220, col: "rgba(255,120,30,.85)", eff: { burn: 1 }, y: a.floor }); later(0.9, () => { A.play("fireBig", { vol: 0.5 }); FX.addShake(4); }); }) },
      { at: 0.4, name: N("Glutsturm", "Ember Storm"), quote: N("„Ich röste euch. Langsam. Mit Beilage.“", "\"I shall roast you. Slowly. With a side dish.\""), aura: "#ff6a1a", tempo: 1.2,
        moves: ["odem", "sturzflug", "geysire", "feuersturm", "flammenteppich", "goldlawine", "klauen"],
        enter: e => { e.nextMv = "flammenteppich"; },
        arena: (e, dt, P, s) => { every(s, "glut", dt, 2.8, () => rubble(e, P, 2, 260, "e_glut", 0.5, "#ff8a1a")); every(s, "grube", dt, 5, () => { const a = AR(); for (const x of [16 * T, 39 * T]) if (x > a.x0 && x < a.x1) pillar(e, x, 0.9, 0.9, { w: 56, hgt: 220, col: "rgba(255,120,30,.85)", eff: { burn: 1 }, y: a.floor }); }); } },
      { at: 0.15, name: N("Der Hort schmilzt", "The Hoard Melts"), quote: N("„MEIN GOLD! MEINS! ALLES MEINS!“", "\"MY GOLD! MINE! ALL MINE!\""), aura: "#ff3a1a", tempo: 1.35, transDur: 2,
        moves: ["hortschmelze", "odem", "sturzflug", "feuersturm", "flammenteppich"],
        enter: e => { e.nextMv = "hortschmelze"; e.ar.lastMelt = -99; },
        arena: (e, dt, P, s) => every(s, "glut", dt, 3, () => rubble(e, P, 2, 240, "e_glut", 0.5, "#ff8a1a")) }
    ]
  });

  /* ---------- VENOMFANG ---------- */
  extend("venomfang", {
    def: { roar: "dragon" },
    names: { giftatem: N("Giftodem", "Poison Breath"), klauen: N("Klauenhiebe", "Claw Swipes"), schwanz: N("Schwanzhieb", "Tail Lash"), abflug: N("Giftbombardement", "Venom Barrage"), giftregen: N("Giftregen", "Venom Rain") },
    danger: ["nebelhinterhalt"],
    moves: {
      /* Schwanzfeger: tief (springen) oder hoch (ducken), weithin um ihn */
      schwanzfeger: { name: N("Schwanzfeger", "Tail Sweep"), pre: 0.7, dur: 0.4, post: 0.6, sfx: "swingHeavy", range: [0, 200],
        start: (e, P, m) => { m.high = R() < 0.4; tele({ k: "band", x0: cxOf(e) - 110, x1: cxOf(e) + 110, y: feet(e) - (m.high ? 19 : 0), h: m.high ? 22 : 16, dur: PRE(e, 0.7), col: "#a8e050" }); FX.text(pcx(P), P.y - 16, m.high ? L(["Ducken!", "Duck!"]) : L(["Springen!", "Jump!"]), "#c8f080", true); },
        act: (e, P, m) => { melee(e, { x: cxOf(e) - 110, y: feet(e) - (m.high ? 41 : 16), w: 220, h: m.high ? 22 : 16 }, 1.1, { kb: 260 }); FX.smear({ x: cxOf(e), y: feet(e) - (m.high ? 30 : 8), dir: -e.face, r: 104, a0: -0.4, a1: 0.4, th: 10, life: 0.2, col: "#6aa040" }); FX.smear({ x: cxOf(e), y: feet(e) - (m.high ? 30 : 8), dir: e.face, r: 104, a0: -0.4, a1: 0.4, th: 10, life: 0.2, col: "#6aa040" }); FX.addShake(5); } },
      /* Nebelhinterhalt: verschwindet im Gift, nur die Augen glühen – dann der Sturz */
      nebelhinterhalt: { name: N("Nebelhinterhalt", "Mist Ambush"), pre: 0.55, dur: 2.6, post: 0.7, sfx: "poison",
        act: (e, P, m) => {
          for (let i = -1; i <= 1; i++) Z.spawnHazard({ kind: "poisoncloud", x: cxOf(e) + i * 50, y: floorAt(cxOf(e) + i * 50), w: 60, life: 3.2, dmg: dmg(e, 0.1), owner: "e", eff: { poison: 1 } });
          const a = AR(); e.hidden = 1.6; e.grounded = false; m.tx = pcx(P) < (a.x0 + a.x1) / 2 ? a.x1 - 80 : a.x0 + 80; m.ty = a.floor - 170; m.s = 0;
        },
        tick: (e, P, dt, m) => {
          if (m.s === 0) { e.vx = U.clamp((m.tx - cxOf(e)) * 3, -260, 260); e.vy = U.clamp((m.ty - e.y) * 3, -260, 260); m.eyes = true; if (m.t > 1.0) { m.s = 1; m.aimT = 0; } }
          else if (m.s === 1) { e.vx *= 0.8; e.vy *= 0.8; m.aimT += dt; if (m.aimT < 0.35) m.aim = { x: pcx(P), y: P.y + 10 }; if (m.aimT > 0.6) { e.hidden = 0; const an = Math.atan2(m.aim.y - e.y, m.aim.x - cxOf(e)); m.vx = Math.cos(an) * 470; m.vy = Math.sin(an) * 470 + 40; m.s = 2; m.aim = null; A.play("roar", { vol: 0.7 }); } }
          else { e.vx = m.vx; e.vy = m.vy; if (!m.hit) m.hit = melee(e, { x: e.x, y: e.y, w: e.w, h: e.h }, 1.3, { eff: { poison: 1 } }); if (e.onGround || e.hitWall || m.t > 2.5) { m.t = 99; e.grounded = true; FX.addShake(8); A.play("quake"); for (const s of [-1, 1]) Z.spawnProj("e_welle", cxOf(e) + s * 30, feet(e) - 6, s, { dmg: dmg(e, 0.8), life: 1.6 }); } }
        },
        end: e => { e.grounded = true; e.hidden = 0; }, abort: e => { e.hidden = 0; e.grounded = true; } },
      /* Giftschwenk: aus der Luft eine Giftspur über den Boden */
      giftschwenk: { name: N("Giftschwenk", "Venom Sweep"), pre: 0.7, dur: 1.5, post: 0.6, sfx: "fireBig",
        start: e => { e.grounded = false; e.vy = -220; },
        preTick: (e, P, dt) => { e.vy = U.approach(e.vy, 0, 500 * dt); e.vx = U.approach(e.vx, 0, 300 * dt); },
        act: (e, P) => { const a = AR(), dir = pcx(P) > cxOf(e) ? 1 : -1; carpet(e, U.clamp(cxOf(e), a.x0, a.x1), dir, 300, { kind: "poisonpool", warn: 1.0, gap: 0.04, life: 2.0, m: 0.25, eff: { poison: 1 }, warnCol: "#9ad04a", sfx: "poison" }); },
        tick: (e, P, dt) => { e.vy = U.approach(e.vy, 0, 600 * dt); e.vx = U.approach(e.vx, 0, 300 * dt); if (R() < dt * 30) FX.p({ x: cxOf(e) + e.face * 30, y: feet(e) - 10, vx: 0, vy: 160, life: 0.4, size: 4, col: "#9ad04a", kind: "glow", add: true }); } }
    },
    phases: [
      { at: 1, name: N("Der grüne Drache", "The Green Dragon"), moves: ["giftatem", "klauen", "schwanz", "abflug", "schwanzfeger"] },
      { at: 0.7, name: N("Kein Barde diesmal", "No Bard This Time"), quote: N("„Kein Barde diesmal. Kein Lied. Nur Gift.“", "\"No bard this time. No song. Only venom.\""), aura: "#a8e050", tempo: 1.1,
        moves: ["giftatem", "klauen", "schwanz", "abflug", "giftregen", "schwanzfeger", "nebelhinterhalt"],
        enter: e => { e.nextMv = "nebelhinterhalt"; },
        /* Giftschwaden kriechen über die Turmspitze */
        arena: (e, dt, P, s) => every(s, "schwaden", dt, 6, () => { const a = AR(), x = U.clamp(pcx(P) + (R() < 0.5 ? -1 : 1) * (80 + R() * 100), a.x0 + 30, a.x1 - 30); tele({ k: "floor", x, y: floorAt(x), w: 56, dur: 1, col: "#9ad04a" }); later(1, () => { if (alive(e)) Z.spawnHazard({ kind: "poisoncloud", x, y: floorAt(x), w: 60, life: 4, dmg: dmg(e, 0.1), owner: "e", eff: { poison: 1 } }); }); }) },
      { at: 0.4, name: N("Säurehimmel", "Acid Sky"), quote: N("„Ich habe euch beobachtet, Würmer. Jeden Schritt.“", "\"I have watched you, worms. Every step.\""), aura: "#d0e040", tempo: 1.2,
        moves: ["giftatem", "abflug", "giftregen", "schwanzfeger", "nebelhinterhalt", "giftschwenk", "klauen"],
        enter: e => { e.nextMv = "giftschwenk"; },
        arena: (e, dt, P, s) => every(s, "saeure", dt, 2.6, () => rubble(e, P, 2, 260, "e_gift", 0.5, "#9ad04a")) },
      { at: 0.15, name: N("Sturm über Donnerbaum", "Storm over Thundertree"), quote: N("„Wenn ich falle, fallt ihr mit mir!“", "\"If I fall, you fall with me!\""), aura: "#f0e070", tempo: 1.4, transDur: 2,
        moves: ["giftschwenk", "nebelhinterhalt", "abflug", "giftregen", "schwanzfeger", "giftatem"],
        enter: e => { e.nextMv = "schwanzfeger"; FX.flashScreen("#fff8d0", 0.4); A.play("thunder", { vol: 1 }); },
        arena: (e, dt, P, s) => { every(s, "blitz", dt, 2.3, () => stormBolt(e, P, 0.8)); every(s, "saeure", dt, 3.4, () => rubble(e, P, 2, 240, "e_gift", 0.5, "#9ad04a")); } }
    ]
  });

  /* ---------- DIE WEBERIN (Wahres Ende; Definition in abenteuer.js, Erweiterung beim ersten Auftritt) ---------- */
  extend("weberin", {
    def: { roar: "monster" },
    copy: ["stampf", "strahl", "runenregen", "felswurf", "erdbeben"],
    names: { stampf: N("Achtbeinstampfer", "Eight-Legged Stomp"), strahl: N("Fadenstrahl", "Thread Beam"), runenregen: N("Seidensäulen", "Silk Pillars"), felswurf: N("Kokonwurf", "Cocoon Toss"), erdbeben: N("Netzbeben", "Web Quake"), brut: N("Spinnenbrut", "Spider Brood"), netzfaecher: N("Netzfächer", "Web Fan") },
    danger: ["marionette"],
    moves: {
      /* Fadenschnitt: Fäden fallen in einer Reihe aus der Decke, Schritt für Schritt auf den Spieler zu */
      fadenschnitt: { name: N("Fadenschnitt", "Thread Cut"), pre: 0.55, dur: 1.4, post: 0.6, sfx: "web",
        act: (e, P) => { const dir = pcx(P) > cxOf(e) ? 1 : -1, x0 = cxOf(e) + dir * 40, n = e.phase >= 2 ? 7 : 5; for (let i = 0; i < n; i++) later(i * 0.16, () => { if (!alive(e)) return; const x = x0 + dir * i * 44; K.strikeAt(x, { y: floorAt(x), w: 18, dmg: dmg(e, 0.9), col: "rgba(240,220,236,1)", warnCol: "#e05a8a", warn: 0.7 }); }); } },
      /* Kokon: langsame, klebrige Kugeln, die dem Spieler folgen */
      kokon: { name: N("Kokon", "Cocoon"), pre: 0.6, dur: 0.6, post: 0.5, sfx: "web",
        act: (e, P) => { for (let i = 0; i < 3; i++) later(i * 0.2, () => { if (!alive(e)) return; const p = Z.aimProj("e_netz", cxOf(e), e.y + e.h * 0.4, pcx(P), P.y + 12, { dmg: dmg(e, 0.5), speed: 200 }); p.g = 40; }); } },
      /* Seidenregen */
      fadenregen: { name: N("Seidenregen", "Silk Rain"), pre: 0.6, dur: 1.4, post: 0.5, sfx: "web", act: (e, P) => K.rainProj("e_netz", e.phase >= 2 ? 10 : 7, 240, e, 0.5, { gap: 100 }) },
      /* Marionettenfäden: drei Fäden ziehen am Spieler – jede Rolle kappt einen; alle gekappt = sie taumelt */
      marionette: { name: N("Marionettenfäden", "Puppet Strings"), pre: 0.7, dur: 2.8, post: 0.7, sfx: "web", w: 0.9,
        act: (e, P, m) => { m.n = 3; m.rolls = P.rolls || 0; m.string = true; FX.text(pcx(P), P.y - 18, L(["Rollen kappt die Fäden!", "Roll to cut the strings!"]), "#e05a8a", true); A.play("web", { vol: 0.8 }); },
        tick: (e, P, dt, m) => {
          if (m.n <= 0) return;
          const r = P.rolls || 0;
          if (r > m.rolls && P.rollT > 0) { m.rolls = r; m.n--; A.play("slash", { vol: 0.6 }); FX.burst(pcx(P), P.y + 10, 10, { col: ["#e05a8a", "#eee8f0"], sp: 120, life: 0.4, size: 2, kind: "spark", add: true }); FX.text(pcx(P), P.y - 10, m.n > 0 ? L(["Gekappt!", "Cut!"]) : L(["Frei!", "Free!"]), "#ffe08a", true);
            if (m.n <= 0) { m.t = 99; m.free = true; e.st.stun = 2; FX.text(cxOf(e), e.y - 14, L(["Sie taumelt!", "She staggers!"]), "#ffe08a", true); return; } }
          drift(P, cxOf(e), 40 + m.n * 25, dt);
          if (m.t > 2.0 && !m.w) { m.w = true; tele({ k: "ring", x: cxOf(e), y: feet(e) - 12, r: 90, dur: 0.75, col: "#e05a8a" }); }
        },
        end: (e, P, m) => { m.string = false; if (m.free) return; zone(e, cxOf(e), feet(e) + 2, 180, 50, 0, 1.3, { col: "rgba(224,90,138,.9)" }); FX.addShake(8); A.play("roar", { vol: 0.8 }); },
        abort: (e, P, m) => { m.string = false; } }
    },
    phases: [
      { at: 1, name: N("Die Weberin", "The Weaver"), moves: ["stampf", "netzfaecher", "brut", "fadenschnitt", "kokon"] },
      { at: 0.7, name: N("Ohne Netz", "Without a Web"), quote: N("„Dann eben ohne Netz.“", "\"Then without a web.\""), aura: "#c03a5a", tempo: 1.1,
        moves: ["stampf", "strahl", "netzfaecher", "brut", "fadenschnitt", "kokon", "fadenregen"],
        enter: (e, P) => { e.nextMv = "fadenregen"; const a = AR(); for (const x of [a.x0 + 120, (a.x0 + a.x1) / 2, a.x1 - 120]) web(x, floorAt(x), 60, 36, 40); },
        arena: (e, dt, P, s) => every(s, "netz", dt, 8, () => { const a = AR(), x = U.clamp(pcx(P) + (R() - 0.5) * 300, a.x0 + 40, a.x1 - 40); tele({ k: "floor", x, y: floorAt(x), w: 54, dur: 0.8, col: "#eee8f0" }); later(0.8, () => { if (alive(e)) web(x, floorAt(x), 54, 32, 10); }); }) },
      { at: 0.4, name: N("Der letzte Faden", "The Last Thread"), quote: N("„Jeder Faden in dieser Feste ist meiner. Auch deiner.“", "\"Every thread in this keep is mine. Yours too.\""), aura: "#e05a8a", tempo: 1.2,
        moves: ["strahl", "runenregen", "netzfaecher", "fadenschnitt", "kokon", "fadenregen", "marionette"],
        enter: e => { e.nextMv = "marionette"; },
        /* Kokons fallen aus dem Gewölbe */
        arena: (e, dt, P, s) => every(s, "kokon", dt, 3.4, () => rubble(e, P, 2, 260, "e_stein", 0.6, "#e05a8a")) },
      { at: 0.15, name: N("ICH BIN DAS NETZ", "I AM THE WEB"), quote: N("„ICH BIN DAS NETZ.“", "\"I AM THE WEB.\""), aura: "#ff3a5a", tempo: 1.4, transDur: 2,
        moves: ["marionette", "fadenschnitt", "fadenregen", "kokon", "netzfaecher", "strahl"],
        enter: e => { e.dmgMul *= 1.15; e.nextMv = "fadenschnitt"; FX.flashScreen("#c03a5a", 0.4); },
        arena: (e, dt, P, s) => { every(s, "faden", dt, 2.8, () => { const x = pcx(P) + (R() - 0.5) * 80; K.strikeAt(x, { y: floorAt(x, standY(P)), w: 18, dmg: dmg(e, 0.8), col: "rgba(240,220,236,1)", warnCol: "#e05a8a", warn: 0.9 }); }); every(s, "kokon", dt, 4, () => rubble(e, P, 2, 260, "e_stein", 0.6, "#e05a8a")); } }
    ]
  });
  function N(de, en) { return [de, en]; }

  /* ======================= 5. ZEICHNEN & VERKABELUNG ======================= */
  /* Gegner-Update: Zeitplaner + Arena-Objekte mitlaufen lassen */
  const ue0 = Z.updateEnemies;
  Z.updateEnemies = function (dt) {
    tickQ(dt);
    for (let i = TELE.length - 1; i >= 0; i--) { const t = TELE[i]; t.t += dt; if (t.t >= t.dur) TELE.splice(i, 1); }
    if (OBJ.length) OBJ = OBJ.filter(o => { try { return o.upd(dt) !== false; } catch (err) { console.error(err); return false; } });
    return ue0.apply(this, arguments);
  };
  /* Bossdefinition je Kampf kopieren: Änderungen (Farbe, Schlaf des Riesen) betreffen nur diesen Kampf */
  const se0 = Z.spawnEnemy;
  Z.spawnEnemy = function (id) {
    if (SPEC[id] && B[id] && !B[id].phx) apply(id);
    const e = se0.apply(this, arguments);
    if (e && e.def && e.def.boss && !Object.prototype.hasOwnProperty.call(e.def, "__inst")) { e.def = Object.create(e.def); e.def.__inst = true; e.aura = null; }
    return e;
  };
  /* Beim Gebietswechsel alles abräumen */
  const la0 = Z.loadArea;
  Z.loadArea = function () { Q = []; TELE.length = 0; OBJ = []; return la0.apply(this, arguments); };

  /* Lebensbalken: Phasenmarken und Phasenfarbe */
  let barFor = null;
  function syncBar(e, force) {
    try {
      const bb = document.querySelector("#bossbar .bbar"), fill = document.getElementById("bossfill"); if (!bb || !fill) return;
      if (barFor === e && !force) return; barFor = e;
      bb.style.position = "relative";
      bb.querySelectorAll(".phmark").forEach(n => n.remove());
      const ph = e && e.def.phases && !e.def.phaseFollow ? e.def.phases : [];
      ph.forEach((p, i) => { if (i === 0 || p.at <= 0) return; const m = document.createElement("div"); m.className = "phmark"; const done = (e.phase || 0) >= i; m.style.cssText = "position:absolute;top:-1px;bottom:-1px;width:2px;left:calc(" + (p.at * 100) + "% - 1px);background:" + (done ? "rgba(255,255,255,.25)" : "#fff2d0") + ";box-shadow:0 0 3px #000;pointer-events:none"; bb.appendChild(m); });
      const cur = ph[(e && e.phase) || 0];
      fill.style.background = cur && cur.aura ? "linear-gradient(" + cur.aura + ",#5a0a0a)" : "";
      /* Untertitel: Titel des Bosses, ab Phase II der Phasenname */
      const sm = document.querySelector("#bossname small");
      if (sm && e) { const roman = ["", "II", "III", "IV", "V"][(e.phase || 0)] || ""; sm.textContent = (e.phase || 0) > 0 && cur && cur.name ? L(["Phase ", "Phase "]) + roman + " · " + L(cur.name) : L(e.def.title || ["", ""]); }
    } catch (_) {}
  }
  const uiTick = () => { const b = Z.boss && !Z.bossDefeated ? Z.boss : null; if (b !== barFor) syncBar(b); };

  /* Aura hinter dem Boss, Aufladen beim Phasenwechsel */
  const de0 = Z.drawEnemy;
  Z.drawEnemy = function (c, e, time) {
    if (e && e.def && e.def.boss && !e.dead && !(e.hidden > 0)) {
      const cx = cxOf(e), cy = e.y + e.h * 0.5, col = e.trans ? e.def.phases[e.trans.k].aura : e.aura;
      if (col) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 4 + e.anim), k = e.trans ? Math.min(1.6, 0.6 + e.trans.t) : 0.55 + 0.1 * (e.phase || 0);
        Z.draw.glow(c, cx, cy, Math.max(e.w, e.h) * (0.75 + 0.15 * pulse) * k, col, 0.42);
        if (R() < 0.25 + 0.1 * (e.phase || 0)) FX.p({ x: cx + (R() - 0.5) * e.w, y: e.y + e.h - R() * e.h * 0.6, vx: (R() - 0.5) * 20, vy: -30 - R() * 40, life: 0.6, size: 1.8, col, kind: "glow", add: true });
      }
    }
    return de0.apply(this, arguments);
  };

  /* Bodenmarken, Bänder, sichere Felder und Arena-Objekte (unter den Figuren) */
  const dh0 = Z.drawHazards;
  Z.drawHazards = function (c, time) {
    dh0.apply(this, arguments);
    for (const o of OBJ) { try { o.draw(c, time); } catch (_) {} }
    if (!TELE.length) return;
    c.save();
    for (const t of TELE) {
      const k = U.clamp(t.t / t.dur, 0, 1), late = k > 0.75, pulse = 0.5 + 0.5 * Math.sin(t.t * (late ? 40 : 22));
      c.globalCompositeOperation = "source-over";
      switch (t.k) {
        case "floor": {
          const w = t.w;
          c.globalAlpha = 0.35 + 0.45 * k; c.fillStyle = t.col; c.fillRect(t.x - w / 2, t.y - 3, w, 3);
          c.globalAlpha = (0.15 + 0.25 * pulse) * (0.4 + k); c.fillRect(t.x - w / 2, t.y - 3 - 14 * k, w, 14 * k);
          c.globalAlpha = 0.5 + 0.5 * pulse; c.beginPath(); c.moveTo(t.x - 3, t.y - 20 - 4 * pulse); c.lineTo(t.x + 3, t.y - 20 - 4 * pulse); c.lineTo(t.x, t.y - 15 - 4 * pulse); c.fill();
          if (late) { c.globalAlpha = 0.6 * pulse; c.fillStyle = "#fff2d0"; c.fillRect(t.x - w / 2, t.y - 1.5, w, 1.5); }
          break;
        }
        case "band": {
          const w = t.x1 - t.x0;
          c.globalAlpha = (0.12 + 0.22 * pulse) * (0.5 + k); c.fillStyle = t.col; c.fillRect(t.x0, t.y - t.h, w, t.h);
          c.globalAlpha = 0.55 + 0.35 * k; c.fillRect(t.x0, t.y - t.h, w, 1); c.fillRect(t.x0, t.y - 1, w, 1);
          if (t.arrow) { c.globalAlpha = 0.6 * pulse; const n = Math.max(1, Math.floor(w / 60)); for (let i = 0; i < n; i++) { const ax = t.x0 + (i + 0.5) * w / n + t.arrow * ((t.t * 60) % 20), ay = t.y - t.h / 2; c.beginPath(); c.moveTo(ax - t.arrow * 4, ay - 4); c.lineTo(ax + t.arrow * 3, ay); c.lineTo(ax - t.arrow * 4, ay + 4); c.fill(); } }
          if (late) { c.globalAlpha = 0.5 * pulse; c.fillStyle = "#fff2d0"; c.fillRect(t.x0, t.y - t.h, w, 1.2); }
          break;
        }
        case "ring": {
          c.globalAlpha = 0.2 + 0.5 * k * pulse; c.strokeStyle = t.col; c.lineWidth = 1.5 + k * 1.5;
          c.beginPath(); c.arc(t.x, t.y, t.r, 0, TAU); c.stroke();
          c.globalAlpha = 0.08 + 0.12 * k; c.fillStyle = t.col; c.beginPath(); c.arc(t.x, t.y, t.r * k, 0, TAU); c.fill();
          break;
        }
        case "safe": {
          c.globalAlpha = 0.45 + 0.35 * pulse; c.fillStyle = "#7fd36a"; c.fillRect(t.x - t.w / 2, t.y - 3, t.w, 3);
          c.globalAlpha = 0.14; c.fillRect(t.x - t.w / 2, t.y - 30, t.w, 27);
          c.globalAlpha = 0.85; c.font = "700 7px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillText("✓", t.x, t.y - 8);
          break;
        }
      }
    }
    c.restore();
  };

  /* Namen der Techniken über dem Boss, Zielinien, Augen im Nebel, Marionettenfäden */
  const dp0 = Z.drawProjs;
  Z.drawProjs = function (c) {
    if (dp0) dp0.apply(this, arguments);
    uiTick();
    const t = (Z.gfx && Z.gfx.time) || 0;
    for (const e of Z.enemies) {
      if (!e.def || !e.def.boss || e.dead) continue;
      const cx = cxOf(e), m = e.mv, mv = m && e.def.moves[m.id];
      if (m && m.aim && mv) {
        c.save(); c.globalAlpha = 0.25 + 0.45 * Math.abs(Math.sin(t * 14)); c.strokeStyle = mv.danger ? "#ff3a2a" : "#ffb040"; c.lineWidth = 0.8; c.setLineDash([4, 3]);
        c.beginPath(); c.moveTo(cx, e.y + e.h * 0.4); c.lineTo(m.aim.x, m.aim.y); c.stroke(); c.setLineDash([]);
        c.beginPath(); c.arc(m.aim.x, m.aim.y, 5, 0, TAU); c.stroke(); c.restore();
      }
      if (m && m.tether && Z.player) { const P = Z.player; c.save(); c.strokeStyle = "rgba(200,150,255,.75)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx, e.y + 15); const mx = (cx + pcx(P)) / 2 + Math.sin(t * 20) * 4, my = (e.y + 15 + P.y + 12) / 2 + Math.cos(t * 17) * 4; c.quadraticCurveTo(mx, my, pcx(P), P.y + 12); c.stroke(); c.restore(); }
      if (m && m.eyes && e.hidden > 0) { Z.draw.glow(c, cx + e.face * e.w * 0.35, e.y + e.h * 0.35, 10, "rgba(170,240,80,.9)", 0.9); c.fillStyle = "#e8ffb0"; c.fillRect(cx + e.face * e.w * 0.35 - 3, e.y + e.h * 0.35 - 1, 2, 2); c.fillRect(cx + e.face * e.w * 0.35 + 2, e.y + e.h * 0.35 - 1, 2, 2); }
      if (m && m.string && Z.player && m.n > 0) { const P = Z.player; c.save(); c.strokeStyle = "rgba(240,200,220,.85)"; c.lineWidth = 0.7; for (let i = 0; i < m.n; i++) { c.beginPath(); c.moveTo(cx + (i - 1) * 8, e.y + e.h * 0.4); c.quadraticCurveTo((cx + pcx(P)) / 2, Math.min(e.y, P.y) - 30 - i * 10, pcx(P) + (i - 1) * 3, P.y + 6 + i * 6); c.stroke(); } c.restore(); }
      if (mv && mv.name && m.stage !== "post" && !(e.hidden > 0) && !e.trans) {
        const u = m.stage === "pre" ? Math.min(1, m.t / 0.12) : 1;
        c.save(); c.globalAlpha = u; c.font = "italic 800 8px 'Alegreya Sans',sans-serif"; c.textAlign = "center";
        const s = L(mv.name), w = c.measureText(s).width + 10, y = Math.max(Z.cam.y + 40, e.y - 10);
        c.fillStyle = "rgba(20,8,10,.82)"; c.fillRect(cx - w / 2, y - 8, w, 11);
        c.fillStyle = e.aura || "#ffb040"; c.fillRect(cx - w / 2, y + 2, w, 1);
        c.fillStyle = mv.danger ? "#ff7a6a" : "#ffd8a0"; c.fillText(s, cx, y);
        if (mv.danger && m.stage === "pre") { c.font = "900 12px 'Alegreya Sans',sans-serif"; c.fillStyle = "#ff3a2a"; c.strokeStyle = "rgba(0,0,0,.8)"; c.lineWidth = 2.5; const yy = y - 12 - Math.sin(m.t * 20) * 1.5; c.strokeText("!!", cx, yy); c.fillText("!!", cx, yy); }
        c.restore();
      }
    }
  };
})();
