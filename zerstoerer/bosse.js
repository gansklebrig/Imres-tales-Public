/* Ezekiel – The Destroyer · Bosse und Wächter
   Jeder Boss hat Phasen und eigene Muster. Ablauf: Auftritt → Muster wählen → Ausholen (Warnung) → Wirkung → Erholung (Lücke zum Zuschlagen). */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v);
  const R = () => Z.R();

  /* ---------- Bausteine ---------- */
  const cxOf = e => e.x + e.w / 2, feet = e => e.y + e.h;
  const dmg = (e, m) => e.dmgMul * (m || 1) * (e.st.weak > 0 ? 0.6 : 1);
  /* Kampfbereich: in Bossarenen die ganze Ebene, bei Wächtern der Raum, in dem sie erwacht sind (e.box, siehe spawnBoss) */
  const arena = () => { const b = Z.boss; if (b && b.box && !Z.bossDefeated) return b.box; return { x0: 2 * T, x1: (W.lv.W - 2) * T, floor: Z.groundY(W.lv.W * T / 2, (W.lv.H - 4) * T), top: T }; };
  /* Zeitversetzte Abläufe laufen in Spielzeit (Pause, Zeitlupe und Trefferstopp halten sie mit an) – siehe bossphasen.js */
  const setTimeout = (fn, ms) => (Z.bossLater ? Z.bossLater(fn, ms) : window.setTimeout(fn, ms));
  function box(e, bx, by, bw, bh) { const c = cxOf(e), f = feet(e); return e.face > 0 ? { x: c + bx, y: f + by, w: bw, h: bh } : { x: c - bx - bw, y: f + by, w: bw, h: bh }; }
  function melee(e, r, m, o) { const P = Z.player; if (P && !P.dead && U.overlap(r, P)) return Z.hurtPlayer(dmg(e, m), Object.assign({ x: cxOf(e), kb: 220, kbUp: 180, attacker: e, melee: true }, o || {})); }
  function mark(x, o) { return Z.spawnHazard(Object.assign({ kind: "zone", x, y: Z.groundY(x, arena().floor - 8), w: 30, hgt: 30, warn: 0.8, life: 0.25, owner: "e" }, o)); }
  function strikeAt(x, o) { return Z.spawnHazard(Object.assign({ kind: "strike", x, y: Z.groundY(x, arena().floor - 8), w: 24, hgt: 400, warn: 0.85, life: 0.3, owner: "e", unblockable: false }, o)); }
  /* Regen aus Geschossen: Bodenmarke an der Landestelle, Start unter der Decke (Z.bossDrop aus bossphasen.js) */
  function rainProj(kind, n, spanX, e, m, o) {
    const P = Z.player;
    for (let i = 0; i < n; i++) setTimeout(() => {
      if (e.dead) return;
      const x = P.x + P.w / 2 + (R() - 0.5) * spanX;
      const dp = Z.bossDrop ? Z.bossDrop(x, null, kind) : { top: Z.cam.y - 10, land: Z.groundY(x, arena().floor - 8) };
      if (!dp) return;
      const fall = (-60 + Math.sqrt(3600 + 1800 * Math.max(0, dp.land - dp.top))) / 900;
      if (Z.bossTele) Z.bossTele({ k: "floor", x, y: dp.land, w: 18, dur: 0.3 + fall + 0.04, col: "#ff3a2a" }); else Z.spawnHazard({ kind: "zone", x, y: dp.land, w: 18, hgt: 4, warn: 0.7, life: 0.01, owner: "e", dmg: 0, warnCol: "#ff3a2a" });
      setTimeout(() => { if (!e.dead) { const p = Z.spawnProj(kind, x, dp.top, 0, Object.assign({ dmg: dmg(e, m), vx: 0, vy: 60 }, o || {})); p.g = 900; } }, 300);
    }, i * (o && o.gap || 110));
  }
  function face(e, P) { const d = P.x + P.w / 2 - cxOf(e); if (Math.abs(d) > 6) e.face = U.sign(d); }
  function walkTo(e, dt, tx, spd) { const d = tx - cxOf(e); e.vx = U.approach(e.vx, Math.abs(d) > 8 ? U.sign(d) * spd : 0, 1000 * dt); }
  function grav(e, dt) { if (!e.def.fly || e.grounded) { e.vy += 1400 * dt; if (e.vy > 600) e.vy = 600; } }
  function summon(e, id, n, spread) { for (let i = 0; i < n; i++) { const x = cxOf(e) + (i - (n - 1) / 2) * (spread || 30); const m = Z.spawnEnemy(id, x, feet(e) - 4, { tier: e.tier }); if (m) { m.aware = true; m.master = e; m.spawnT = 0.5; FX.burst(x, feet(e) - 10, 12, { col: "#a99a8b", sp: 70, life: 0.5, size: 3, kind: "smoke" }); } } }
  function roar(e, txt) { A.play(e.def.roar || "roar", { vol: 0.8 }); FX.addShake(7); FX.ring(cxOf(e), e.y + e.h * 0.4, 80, "#ffd27a", 0.5, 3); if (txt) Z.bossSay && Z.bossSay(txt); }
  function telegraph(e, t) { e.tele = t; }

  /* ---------- Gemeinsames Boss-Gehirn ---------- */
  function bossBrain(e, dt, P) {
    const d = e.def;
    e.tele = Math.max(0, (e.tele || 0) - dt);
    if (e.intro > 0) { e.intro -= dt; grav(e, dt); Z.moveBody(e, dt); face(e, P); return; }
    /* Phasenwechsel */
    const hp = e.hp / e.hpMax;
    const ph = d.phases.findIndex((p, i) => hp <= p.at && (i === d.phases.length - 1 || hp > d.phases[i + 1].at));
    if (ph > (e.phase || 0)) {
      e.phase = ph; e.mv = null; e.invuln = 1.2; e.idle = 1.2;
      if (d.phases[ph].enter) d.phases[ph].enter(e, P);
      else roar(e);
    }
    if (e.st.stun > 0) { grav(e, dt); e.vx *= 0.9; Z.moveBody(e, dt); return; }
    if (e.mv) {
      const m = e.mv; m.t += dt;
      const def = d.moves[m.id];
      if (m.stage === "pre") { if (def.preTick) def.preTick(e, P, dt, m); if (m.t >= def.pre * (e.rage ? 0.8 : 1)) { m.stage = "act"; m.t = 0; def.act && def.act(e, P, m); } }
      else if (m.stage === "act") { if (def.tick) def.tick(e, P, dt, m); if (m.t >= (m.dur != null ? m.dur : def.dur || 0.2)) { m.stage = "post"; m.t = 0; def.end && def.end(e, P, m); } }
      else { if (def.postTick) def.postTick(e, P, dt, m); else { e.vx = U.approach(e.vx, 0, 800 * dt); } if (m.t >= def.post * (e.rage ? 0.75 : 1)) { e.mv = null; e.idle = (d.idleT || 0.6) * (0.6 + R() * 0.7) * (e.rage ? 0.6 : 1); } }
      if (!d.fly || e.grounded) grav(e, dt);
      e.noPlat = !!d.noPlat;
      Z.moveBody(e, dt);
      return;
    }
    /* zwischen den Mustern: Bewegung */
    if (d.move) d.move(e, P, dt); else { face(e, P); walkTo(e, dt, P.x + P.w / 2 - e.face * 50, d.spd || 70); }
    if (!d.fly || e.grounded) grav(e, dt);
    e.noPlat = !!d.noPlat;
    Z.moveBody(e, dt);
    e.idle = (e.idle || 0) - dt;
    if (e.idle <= 0) {
      const pool = d.phases[e.phase || 0].moves;
      const dx = Math.abs(P.x + P.w / 2 - cxOf(e));
      const opts = pool.filter(id => { const mv = d.moves[id]; return (!mv.range || (dx >= mv.range[0] && dx <= mv.range[1])) && !(id === e.lastMv && pool.length > 1) && (!mv.cond || mv.cond(e, P)); });
      const list = opts.length ? opts : pool;
      let sum = 0; list.forEach(id => (sum += d.moves[id].w || 1));
      let r = R() * sum, id = list[0];
      for (const x of list) { r -= d.moves[x].w || 1; if (r <= 0) { id = x; break; } }
      e.lastMv = id; e.mv = { id, stage: "pre", t: 0 };
      const mv = d.moves[id];
      face(e, P); telegraph(e, mv.pre);
      if (mv.start) mv.start(e, P, e.mv);
      if (mv.sfx) A.play(mv.sfx, { vol: 0.6, x: e.x });
    }
  }

  /* ======================= BOSS-DEFINITIONEN ======================= */
  const B = (Z.BOSSDEF = {});
  const base = o => Object.assign({ boss: true, poise: 99, heavy: true, sight: 999, atks: [], update: bossBrain }, o);

  /* ---------- Glasstab ---------- */
  B.glasstab = base({
    n: ["Glasstab", "Glasstaff"], title: ["Anführer der Roten Roben", "Leader of the Red Robes"], shape: "human", c: "#8a1a2a", t: "#e5b454", skin: "#e8c8a8", staff: 1, hat: 0, hood: 1, glowStaff: "#bfe6c0",
    w: 14, h: 28, size: 1.15, hp: 40, dmg: 1.15, spd: 60, idleT: 0.7,
    intro: ["„Ihr habt meine Phiole zerbrochen. Wisst ihr, wie lange die gedauert hat?“", '"You broke my vial. Do you know how long that took?"'],
    outro: ["Glasstab sinkt zwischen seine Scherben. Mit dem letzten Atemzug flüstert er: „Die Spinne … sieht … alles …“", "Glasstaff sinks among his shards. With his last breath he whispers: 'The Spider… sees… everything…'"],
    phases: [{ at: 1, moves: ["phiolen", "blink", "scherben", "beschwoeren"] }, { at: 0.5, moves: ["phiolen", "blink", "scherben", "feuerball", "beschwoeren"], enter: (e) => { roar(e, L(["„Genug! Ich trinke die rote!“", '"Enough! I\'ll drink the red one!"'])); e.rage = true; FX.flashScreen("#ff3a2a", 0.3); } }],
    move: (e, P, dt) => { face(e, P); const want = P.x + P.w / 2 + (cxOf(e) < P.x ? -110 : 110); walkTo(e, dt, want, 60); },
    moves: {
      phiolen: { pre: 0.55, dur: 0.6, post: 0.6, sfx: "glass", act: (e, P, m) => { const n = e.rage ? 5 : 3; for (let i = 0; i < n; i++) setTimeout(() => { if (!e.dead) Z.aimProj("e_phiole", cxOf(e), e.y + 6, P.x + P.w / 2 + (i - (n - 1) / 2) * 34, P.y + P.h, { dmg: dmg(e, 0.8) }); }, i * 110); } },
      blink: { pre: 0.35, dur: 0.1, post: 0.2, sfx: "magic", act: (e, P) => { const a = arena(); FX.burst(cxOf(e), e.y + 14, 18, { col: ["#bfe6c0", "#8a1a2a"], sp: 90, life: 0.4, size: 3, kind: "smoke" }); const plats = [[13 * T, 5 * T], [34 * T, 5 * T], [24 * T, 8 * T], [7 * T, 11 * T], [36 * T, 11 * T], [6 * T, a.floor - 2], [40 * T, a.floor - 2]]; const p = plats.filter(q => Math.abs(q[0] - P.x) > 80)[Math.floor(R() * 5)] || plats[0]; e.x = p[0] - e.w / 2; e.y = p[1] - e.h - 2; Z.unstick(e); e.vy = 0; FX.burst(cxOf(e), e.y + 14, 18, { col: ["#bfe6c0", "#8a1a2a"], sp: 90, life: 0.4, size: 3, kind: "smoke" }); } },
      scherben: { pre: 0.7, dur: 1.4, post: 0.6, sfx: "glass", act: (e, P) => rainProj("e_scherbe", e.rage ? 14 : 9, 220, e, 0.6, { gap: 90 }) },
      beschwoeren: { pre: 0.8, dur: 0.2, post: 0.5, sfx: "magic", w: 0.6, cond: e => Z.enemies.filter(o => o.master === e && !o.dead).length < 3, act: e => summon(e, "phiole", 2, 40) },
      feuerball: { pre: 0.5, dur: 0.5, post: 0.5, sfx: "fire", act: (e, P) => { for (let i = 0; i < 3; i++) setTimeout(() => { if (!e.dead) Z.aimProj("e_feuerball", cxOf(e) + e.face * 10, e.y + 8, P.x + P.w / 2, P.y + 12, { dmg: dmg(e, 0.9), speed: 220 }); }, i * 160); } }
    }
  });

  /* ---------- Falsche Erzpriesterin ---------- */
  B.erzpriesterin = base({
    n: ["Die falsche Erzpriesterin", "The False Archpriestess"], title: ["Dienerin Demogorgons", "Servant of Demogorgon"], shape: "kuotoa", c: "#244a52", t: "#e5b454", staff: 1, crown: 1,
    w: 16, h: 30, size: 1.08, hp: 40, dmg: 1.15, spd: 55, idleT: 0.6, demon: false,
    intro: ["„Du bringst mir Opfer? Wie aufmerksam. Für Demogorgon!“", '"You bring me offerings? How thoughtful. For Demogorgon!"'],
    outro: ["Die falsche Erzpriesterin sinkt auf die Planken. Unter dem Steg grollt etwas Tiefes – und verstummt. Noch.", "The false archpriestess slumps onto the planks. Beneath the pier something deep rumbles – and falls silent. For now."],
    phases: [{ at: 1, moves: ["blitze", "blasen", "speere", "rufen"] }, { at: 0.5, moves: ["blitze", "flut", "blasen", "speere", "rufen"], enter: e => { roar(e, L(["„Die Tiefe hört mich!“", '"The deep hears me!"'])); e.rage = true; } }],
    move: (e, P, dt) => { face(e, P); walkTo(e, dt, P.x + P.w / 2 + (cxOf(e) < P.x ? -90 : 90), 55); },
    moves: {
      blitze: { pre: 0.5, dur: 1.2, post: 0.5, sfx: "zap", act: (e, P) => { const n = e.rage ? 5 : 3; for (let i = 0; i < n; i++) setTimeout(() => { if (!e.dead) strikeAt(P.x + P.w / 2 + (R() - 0.5) * 40, { dmg: dmg(e), col: "rgba(255,240,160,1)", warnCol: "#ffe080", eff: { stun: 0.3 } }); }, i * 260); setTimeout(() => A.play("thunder", { vol: 0.5 }), 800); } },
      blasen: { pre: 0.5, dur: 0.6, post: 0.5, sfx: "slime", act: (e, P) => { for (let i = 0; i < (e.rage ? 5 : 3); i++) setTimeout(() => { if (!e.dead) Z.spawnProj("e_blase", cxOf(e), e.y + 10, e.face, { dmg: dmg(e, 0.8), speed: 80 + i * 15 }); }, i * 150); } },
      speere: { pre: 0.6, dur: 0.3, post: 0.6, range: [0, 60], sfx: "spear", act: (e, P) => { melee(e, box(e, -6, -26, 60, 18), 1.2); FX.smear({ x: cxOf(e), y: feet(e) - 16, dir: e.face, r: 52, a0: -0.1, a1: 0.1, th: 4, life: 0.15, col: "#e5b454", stab: true }); } },
      rufen: { pre: 0.8, dur: 0.2, post: 0.5, sfx: "monster", w: 0.5, cond: e => Z.enemies.filter(o => o.master === e && !o.dead).length < 2, act: e => summon(e, R() < 0.5 ? "kuotoa" : "kuotoaSpeer", 2, 60) }, /* W9: höchstens 2–3 Gläubige (Bot-Tode durch Speerwürfe) */
      flut: { pre: 1.0, dur: 1.4, post: 0.8, sfx: "splash", act: (e, P) => { const a = arena(); const dir = P.x > cxOf(e) ? 1 : -1; Z.bossSay && Z.bossSay(L(["Eine Welle! Rauf auf die Stege!", "A wave! Up onto the piers!"])); for (let i = 0; i < 2; i++) Z.spawnProj("e_welle", cxOf(e) + dir * 10, a.floor - 6, dir, { dmg: dmg(e, 1.2), life: 3, speed: 180 + i * 40 }); A.play("splash", { vol: 0.9 }); } }
    }
  });

  /* ---------- Bugbear & Nezna ---------- */
  B.bugbear = base({
    n: ["Der Bugbear", "The Bugbear"], title: ["Wächter des Wachturms", "Keeper of the Watchtower"], shape: "bugbear", c: "#b08a4a", t: "#5a3a1a", w: 22, h: 40, size: 1.12, hp: 36, dmg: 1.35, spd: 80, idleT: 0.5,
    intro: ["Ein Bugbear richtet sich zu voller Größe auf – und neben ihm zieht eine Drow ihren Krummsäbel. Nezna.", "A bugbear rises to its full height – and beside it a drow draws her scimitar. Nezna."],
    outro: ["Der Bugbear schlägt so schwer auf, dass der Steinboden bebt. Nezna ist als Fledermaus entwischt. Natürlich.", "The bugbear hits the ground so hard the stone trembles. Nezna has escaped as a bat. Of course."],
    init: e => { e.partner = null; },
    phases: [{ at: 1, moves: ["sturm", "morgenstern", "hieb"] }, { at: 0.5, moves: ["sturm", "morgenstern", "hieb", "gebruell"], enter: e => { roar(e, L(["Der Bugbear brüllt vor Wut!", "The bugbear roars in rage!"])); e.rage = true; } }],
    move: (e, P, dt) => { face(e, P); walkTo(e, dt, P.x + P.w / 2, 80); },
    moves: {
      sturm: { pre: 0.7, dur: 1.4, post: 0.4, sfx: "roar", range: [60, 999], start: (e) => { e.chargeDir = e.face; }, tick: (e, P, dt, m) => { e.vx = e.chargeDir * 340; melee(e, box(e, 0, -34, 30, 34), 1.2); if (Math.random() < dt * 30) FX.p({ x: cxOf(e), y: feet(e), vx: -e.chargeDir * 60, vy: -20, life: 0.4, size: 4, col: Z.dustCol, kind: "smoke" }); if (e.hitWall) { m.t = 9; FX.addShake(8); A.play("hitHeavy", { vol: 0.9 }); Z.addStatus(e, "stun", 1.8); FX.text(cxOf(e), e.y - 6, L(["Benommen!", "Dazed!"]), "#ffd27a", true); rainProj("e_stein", 3, 160, e, 0.6); } } },
      morgenstern: { pre: 0.75, dur: 0.25, post: 0.7, sfx: "swingHeavy", range: [0, 90], act: (e) => { melee(e, box(e, -10, -40, 56, 42), 1.4); FX.addShake(6); A.play("quake", { vol: 0.6 }); for (const s of [-1, 1]) Z.spawnProj("e_welle", cxOf(e) + s * 20, feet(e) - 6, s, { dmg: dmg(e, 0.8), life: e.rage ? 1.8 : 1.2 }); FX.smear({ x: cxOf(e), y: feet(e) - 20, dir: e.face, r: 40, a0: -2.6, a1: 1.2, th: 14, life: 0.2, col: "#c8a070" }); } },
      hieb: { pre: 0.4, dur: 0.5, post: 0.5, sfx: "claw", range: [0, 60], act: () => {}, tick: (e, P, dt, m) => { const k = Math.floor(m.t / 0.2); if (k !== m.k) { m.k = k; m.hit = false; e.vx = e.face * 80; A.play("claw", { x: e.x }); FX.smear({ x: cxOf(e), y: feet(e) - 20, dir: e.face, r: 30, a0: k % 2 ? 1.2 : -1.4, a1: k % 2 ? -1.2 : 1.0, th: 8, life: 0.12, col: "#c8a070" }); } if (!m.hit) m.hit = melee(e, box(e, 0, -36, 40, 34), 0.8); } },
      gebruell: { pre: 0.6, dur: 0.3, post: 0.5, sfx: "roar", w: 0.6, cond: e => Z.enemies.filter(o => o.master === e && !o.dead).length < 2, act: e => { roar(e); summon(e, "goblin", 2, 80); } }
    }
  });
  B.nezna = base({
    n: ["Nezna", "Nezna"], shape: "human", c: "#1a1420", t: "#3a2a4a", skin: "#4a3e5e", hair: "#f0f0ff", scim: 1, w: 11, h: 23, size: 1.0, hp: 13, dmg: 1, spd: 120, idleT: 0.7, noBar: true,
    phases: [{ at: 1, moves: ["dolche", "schattenstoss", "dunkel"] }],
    move: (e, P, dt) => { face(e, P); const want = P.x + P.w / 2 + (cxOf(e) < P.x ? -120 : 120); walkTo(e, dt, want, 110); if (e.onGround && R() < dt * 0.6) e.vy = -380; },
    moves: {
      dolche: { pre: 0.45, dur: 0.3, post: 0.5, sfx: "throwK", act: (e, P) => { for (let i = -1; i <= 1; i++) { const p = Z.aimProj("e_dolch", cxOf(e), e.y + 8, P.x + P.w / 2, P.y + 10, { dmg: dmg(e, 0.8) }); const a = Math.atan2(p.vy, p.vx) + i * 0.22, s = Math.hypot(p.vx, p.vy); p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s; } } },
      schattenstoss: { pre: 0.3, dur: 0.35, post: 0.55, sfx: "shadow", start: (e, P) => { FX.burst(cxOf(e), e.y + 10, 12, { col: ["#3a2a4a", "#b080ff"], sp: 70, life: 0.4, size: 3, kind: "smoke" }); }, act: (e, P) => { e.x = P.x + P.w / 2 - P.face * 30 - e.w / 2; e.y = P.y + P.h - e.h; Z.unstick(e); e.face = U.sign(P.x - e.x) || 1; FX.burst(cxOf(e), e.y + 10, 12, { col: ["#3a2a4a", "#b080ff"], sp: 70, life: 0.4, size: 3, kind: "smoke" }); e.tele = 0.25; }, tick: (e, P, dt, m) => { if (m.t > 0.22 && !m.hit) { m.hit = true; melee(e, box(e, 0, -22, 30, 20), 1.1); FX.smear({ x: cxOf(e), y: feet(e) - 12, dir: e.face, r: 24, a0: -1, a1: 1, th: 6, life: 0.13, col: "#b080ff" }); A.play("slash", { x: e.x }); } } },
      dunkel: { pre: 0.5, dur: 3, post: 0.3, sfx: "dark", w: 0.4, act: () => { Z.darkness = 3; } }
    }
  });

  /* ---------- Wraith (Wächter im Spinnenschlund) ---------- */
  B.wraith = base({
    n: ["Der Wraith", "The Wraith"], title: ["Hüter von Khaems Grab", "Keeper of Khaem's Tomb"], shape: "wraith", c: "#1a1424", t: "#9a6aff", w: 18, h: 30, size: 1.12, hp: 30, dmg: 1.25, fly: true, ghost: true, noPlat: true, undead: true, idleT: 0.5,
    intro: ["Eine geisterhafte Gestalt spricht in unverständlichen Worten. Dann wird sie kalt.", "A ghostly figure speaks in words no one understands. Then it turns cold."],
    outro: ["Der Wraith zerfällt mit einem markerschütternden Schrei. Wo er stand, liegt ein Schimmer wie Morgenlicht.", "The wraith shatters with a bone-chilling scream. Where it stood lies a glimmer like morning light."],
    drop: "dawnbringer",
    phases: [{ at: 1, moves: ["sog", "kugeln", "blinzeln", "schatten"] }, { at: 0.45, moves: ["sog", "kugeln", "blinzeln", "schatten", "schrei"], enter: e => { roar(e); e.rage = true; } }],
    move: (e, P, dt) => { face(e, P); const tx = P.x + P.w / 2 - e.face * 70, ty = P.y - 30 + Math.sin(e.anim * 2) * 20; e.vx = U.approach(e.vx, U.clamp((tx - cxOf(e)) * 2, -90, 90), 400 * dt); e.vy = U.approach(e.vy, U.clamp((ty - e.y) * 2, -90, 90), 400 * dt); },
    moves: {
      sog: { pre: 0.7, dur: 1.6, post: 0.6, sfx: "dark", tick: (e, P, dt, m) => { e.vx *= 0.9; e.vy *= 0.9; const d = U.dist(cxOf(e), e.y + 15, P.x + P.w / 2, P.y + 12); m.tether = d < 150; if (m.tether && P.iframe <= 0) { P.vx += U.sign(cxOf(e) - P.x) * 500 * dt; m.acc = (m.acc || 0) + dt; if (m.acc > 0.35) { m.acc = 0; P.iframe = 0; Z.hurtPlayer(dmg(e, 0.35), { x: cxOf(e), kb: 0, unblockable: true }); P.hurtT = 0; e.hp = Math.min(e.hpMax, e.hp + e.hpMax * 0.01); } } } },
      kugeln: { pre: 0.5, dur: 0.6, post: 0.5, sfx: "dark", act: (e, P) => { const n = e.rage ? 6 : 4; for (let i = 0; i < n; i++) { const a = (i / n) * 6.283; Z.spawnProj("e_kugel", cxOf(e), e.y + 14, 1, { dmg: dmg(e, 0.8), vx: Math.cos(a) * 90, vy: Math.sin(a) * 90 }); } } },
      blinzeln: { pre: 0.3, dur: 0.1, post: 0.3, sfx: "shadow", act: (e, P) => { e.x = P.x + (R() < 0.5 ? -1 : 1) * 110; e.y = P.y - 40; FX.burst(cxOf(e), e.y + 14, 16, { col: ["#9a6aff", "#1a1424"], sp: 80, life: 0.4, size: 3, kind: "smoke" }); } },
      schatten: { pre: 0.7, dur: 0.2, post: 0.4, sfx: "undead", cond: e => Z.enemies.filter(o => o.master === e && !o.dead).length < 2, act: e => summon(e, "schatten", 2, 60) },
      schrei: { pre: 0.8, dur: 0.3, post: 0.6, sfx: "roar", act: (e, P) => { FX.ring(cxOf(e), e.y + 14, 120, "#9a6aff", 0.5, 4); if (U.dist(cxOf(e), e.y, P.x, P.y) < 120 && P.iframe <= 0) { Z.hurtPlayer(dmg(e, 0.9), { x: cxOf(e), unblockable: true }); Z.addStatus(P, "silence", 4, true); FX.text(P.x + P.w / 2, P.y - 14, L(["Fähigkeiten versiegelt!", "Skills sealed!"]), "#9a6aff", true); } } }
    }
  });

  /* ---------- Schmiedewächter ---------- */
  B.schmiedewaechter = base({
    n: ["Der Wächter der Schmiede", "The Forge Warden"], title: ["Letzter Hüter der Runen", "Last Keeper of the Runes"], shape: "golem", c: "#4a5060", t: "#ffb040", w: 26, h: 44, size: 1.42, hp: 32, dmg: 1.35, spd: 45, armor: 0.1, metal: true, idleT: 0.6, immune: ["bleed", "poison"],
    intro: ["Die Runen an den Wänden glimmen auf. Der letzte Wächter der Schmiede erwacht.", "The runes on the walls begin to glow. The forge's last warden awakens."],
    outro: ["Der Wächter zerfällt in glühende Brocken. Die Runen verlöschen eine nach der anderen.", "The warden crumbles into glowing chunks. The runes go dark one by one."],
    phases: [{ at: 1, moves: ["stampf", "strahl", "pylone"] }, { at: 0.5, moves: ["stampf", "strahl", "pylone", "runenregen"], enter: e => { roar(e); e.rage = true; } }],
    move: (e, P, dt) => { face(e, P); walkTo(e, dt, P.x + P.w / 2, 45); },
    moves: {
      stampf: { pre: 0.85, dur: 0.25, post: 0.7, sfx: "swingHeavy", range: [0, 110], act: e => { melee(e, box(e, -14, -50, 70, 52), 1.4); FX.addShake(8); A.play("quake", { vol: 0.8 }); for (const s of [-1, 1]) for (let i = 0; i < (e.rage ? 2 : 1); i++) Z.spawnProj("e_welle", cxOf(e) + s * 20, feet(e) - 6, s, { dmg: dmg(e, 0.8), life: 2, speed: 200 + i * 60 }); } },
      strahl: { pre: 1.0, dur: 0.5, post: 0.7, sfx: "rune", act: (e, P) => { const y = (R() < 0.5 ? feet(e) - 8 : feet(e) - 34); Z.spawnHazard({ kind: "zone", x: cxOf(e) + e.face * 200, y: y + 6, w: 400, hgt: 12, active: 0.5, life: 0.5, dmg: dmg(e, 1.2), owner: "e", col: "rgba(255,170,60,.9)", unblockable: false }); FX.addShake(3); FX.text(cxOf(e), e.y - 10, y > feet(e) - 20 ? L(["Springen!", "Jump!"]) : L(["Ducken – rollen!", "Duck – roll!"]), "#ffb040"); } },
      pylone: { pre: 0.8, dur: 0.2, post: 0.6, sfx: "rune", cond: e => Z.enemies.filter(o => o.master === e && !o.dead).length < 2, act: e => summon(e, "runenfunke", e.rage ? 3 : 2, 90) },
      runenregen: { pre: 0.6, dur: 1.4, post: 0.5, sfx: "rune", act: (e, P) => { for (let i = 0; i < 6; i++) setTimeout(() => { if (!e.dead) Z.spawnHazard({ kind: "column", x: P.x + P.w / 2 + (R() - 0.5) * 120, y: arena().floor, w: 26, hgt: 160, warn: 0.7, life: 0.4, dmg: dmg(e), owner: "e", col: "rgba(255,170,60,.8)" }); }, i * 220); } }
    }
  });

  /* ---------- Chasme ---------- */
  B.chasme = base({
    n: ["Chasme", "Chasme"], title: ["Summender Dämon", "The Droning Demon"], shape: "wasp", c: "#2a2a30", t: "#ff3a2a", w: 34, h: 20, size: 1.3, hp: 30, dmg: 1.15 /* W9 4. Runde: 1,3 → 1,15 (Wand für frische Meta) */, fly: true, noPlat: true, demon: true, idleT: 0.4,
    intro: ["Ein Summen schwillt an … eine Chasme stürzt sich herab!", "A drone swells… a chasme dives down!"],
    outro: ["Die Chasme kracht auf die Zinnen. Das Summen verstummt endlich.", "The chasme crashes onto the battlements. The droning finally stops."],
    phases: [{ at: 1, moves: ["stich", "summen", "manen"] }, { at: 0.5, moves: ["stich", "summen", "manen", "doppelstich"], enter: e => { roar(e); e.rage = true; } }],
    move: (e, P, dt) => { face(e, P); const tx = P.x + P.w / 2 - e.face * 44 + Math.sin(e.anim) * 24, ty = P.y - 26 + Math.cos(e.anim * 1.6) * 12; /* W9: auf Kopfhöhe – im Stand/Sprung erreichbar */ e.vx = U.approach(e.vx, U.clamp((tx - cxOf(e)) * 2.5, -160, 160), 500 * dt); e.vy = U.approach(e.vy, U.clamp((ty - e.y) * 2.5, -160, 160), 500 * dt); if (R() < dt * 2) A.play("insect", { vol: 0.3, x: e.x }); },
    moves: {
      stich: { pre: 0.6, dur: 0.7, post: 0.6, sfx: "insect", start: (e, P, m) => { m.tx = P.x + P.w / 2; m.ty = P.y + 14; }, preTick: (e, P, dt, m) => { m.tx = P.x + P.w / 2; m.ty = P.y + 14; e.vx *= 0.9; e.vy = -30; }, act: (e, P, m) => { const a = Math.atan2(m.ty - (e.y + 10), m.tx - cxOf(e)); m.vx = Math.cos(a) * 420; m.vy = Math.sin(a) * 420; }, tick: (e, P, dt, m) => { e.vx = m.vx; e.vy = m.vy; if (!m.hit) m.hit = melee(e, { x: e.x, y: e.y, w: e.w, h: e.h }, 1.4, { eff: { poison: 2 } }); if (e.onGround || e.hitWall) { m.t = 9; FX.addShake(4); } } },
      doppelstich: { pre: 0.4, dur: 0.6, post: 0.4, sfx: "insect", act: (e, P, m) => { const a = Math.atan2(P.y + 14 - (e.y + 10), P.x + P.w / 2 - cxOf(e)); m.vx = Math.cos(a) * 480; m.vy = Math.sin(a) * 480; }, tick: (e, P, dt, m) => { e.vx = m.vx; e.vy = m.vy; if (!m.hit) m.hit = melee(e, { x: e.x, y: e.y, w: e.w, h: e.h }, 1.2); if (e.onGround || e.hitWall) m.t = 9; } },
      summen: { pre: 0.5, dur: 3, post: 0.4, sfx: "insect", act: (e, P, m) => { m.h = Z.spawnHazard({ kind: "sleep", x: cxOf(e), y: e.y + 10, w: 150, life: 3, owner: "e", dmg: 0 }); Z.bossSay && Z.bossSay(L(["Das Summen macht schläfrig …", "The drone makes you drowsy…"])); }, tick: (e, P, dt, m) => { e.vx *= 0.95; e.vy *= 0.95; if (m.h) { m.h.x = cxOf(e); m.h.y = e.y + 10; } } },
      manen: { pre: 0.7, dur: 0.2, post: 0.4, sfx: "monster", cond: e => Z.enemies.filter(o => o.master === e && !o.dead).length < 3, act: e => { e.grounded = false; summon(e, "mane", 2, 40); } }
    }
  });

  /* ---------- Ilvara (Wächterin am See) ---------- */
  B.ilvaraW = base({
    n: ["Ilvara Mizzrym", "Ilvara Mizzrym"], title: ["Die Gestaltwandlerin", "The Shapeshifter"], shape: "druidin", c: "#3a6a3a", t: "#c8682a", skin: "#e8c8a8", w: 13, h: 28, size: 1.0, hp: 34, dmg: 1.25, spd: 80, idleT: 0.55,
    intro: ["Am Ufer wartet eine freundliche alte Druidin. „Suppe, Fremder?“", "On the shore waits a kind old druid. 'Soup, stranger?'"],
    outro: ["Ilvara springt ins schwarze Wasser. „Die Spinne wird dich kriegen!“ Ein Platschen. Natürlich.", "Ilvara leaps into the black water. 'The Spider will get you!' A splash. Of course."],
    phases: [{ at: 1, moves: ["wurzeln", "nebel", "fuechse"] }, { at: 0.55, moves: ["klingensturm", "dolchfaecher", "dunkelheit", "schattensprung"], enter: e => { e.revealed = true; e.def.c = "#1a1420"; roar(e, L(["Die Maske fällt: eine Drow!", "The mask falls: a drow!"])); FX.flashScreen("#b080ff", 0.4); e.rage = true; } }],
    move: (e, P, dt) => { face(e, P); const want = e.revealed ? P.x + P.w / 2 - e.face * 40 : P.x + P.w / 2 + (cxOf(e) < P.x ? -120 : 120); walkTo(e, dt, want, e.revealed ? 130 : 60); },
    moves: {
      wurzeln: { pre: 0.5, dur: 1.4, post: 0.5, sfx: "roots", act: (e, P) => { const dir = P.x > cxOf(e) ? 1 : -1; for (let i = 0; i < 7; i++) setTimeout(() => { if (!e.dead) mark(cxOf(e) + dir * (40 + i * 32), { w: 26, warn: 0.45, kind: "zone", dmg: dmg(e), eff: { root: 1 }, col: "#5a8a30", hgt: 34 }); }, i * 140); } },
      nebel: { pre: 0.6, dur: 0.3, post: 0.6, sfx: "poison", act: (e, P) => { Z.spawnHazard({ kind: "poisoncloud", x: P.x + P.w / 2, y: Z.groundY(P.x, P.y + P.h), w: 90, life: 5, dmg: dmg(e, 0.15), owner: "e", eff: { poison: 1 } }); } },
      fuechse: { pre: 0.7, dur: 0.2, post: 0.5, sfx: "wolf", cond: e => Z.enemies.filter(o => o.master === e && !o.dead).length < 2, act: e => summon(e, "wolf", 2, 50) },
      klingensturm: { pre: 0.4, dur: 0.9, post: 0.5, sfx: "slash", act: (e, P, m) => { m.dir = e.face; }, tick: (e, P, dt, m) => { e.vx = m.dir * 380; e.invuln = 0.1; const k = Math.floor(m.t / 0.18); if (k !== m.k) { m.k = k; m.hit = false; FX.smear({ x: cxOf(e), y: feet(e) - 14, dir: m.dir, r: 26, a0: -1.2, a1: 1.2, th: 6, life: 0.12, col: "#b080ff" }); } if (!m.hit) m.hit = melee(e, box(e, -10, -26, 40, 26), 0.8); if (e.hitWall) { m.dir *= -1; e.face = m.dir; } } },
      dolchfaecher: { pre: 0.5, dur: 0.2, post: 0.5, sfx: "throwK", act: (e, P) => { for (let i = -3; i <= 3; i++) { const a = Math.atan2(P.y + 10 - (e.y + 8), P.x - cxOf(e)) + i * 0.16; Z.spawnProj("e_dolch", cxOf(e), e.y + 8, 1, { dmg: dmg(e, 0.7), vx: Math.cos(a) * 340, vy: Math.sin(a) * 340 }); } } },
      dunkelheit: { pre: 0.5, dur: 0.2, post: 0.3, sfx: "dark", w: 0.6, act: () => { Z.darkness = 4; } },
      schattensprung: { pre: 0.3, dur: 0.4, post: 0.5, sfx: "shadow", act: (e, P) => { e.x = P.x + P.w / 2 - P.face * 34 - e.w / 2; e.y = P.y + P.h - e.h; Z.unstick(e); e.face = U.sign(P.x - e.x) || 1; FX.burst(cxOf(e), e.y + 12, 14, { col: ["#3a2a4a", "#b080ff"], sp: 70, life: 0.4, size: 3, kind: "smoke" }); }, tick: (e, P, dt, m) => { if (m.t > 0.25 && !m.hit) { m.hit = true; melee(e, box(e, 0, -26, 34, 24), 1.2); FX.smear({ x: cxOf(e), y: feet(e) - 14, dir: e.face, r: 28, a0: -1.2, a1: 1.2, th: 7, life: 0.13, col: "#b080ff" }); A.play("slash"); } } }
    }
  });

  /* ---------- Der rasende Riese ---------- */
  B.riese = base({
    n: ["Der rasende Riese", "The Raging Giant"], title: ["„ZERSCHLAGEN! ALLES ZERSCHLAGEN!“", '"SMASH! SMASH EVERYTHING!"'], shape: "giant", c: "#8a7a72", t: "#5a4a44", w: 30, h: 64, size: 1.62, hp: 40, dmg: 1.45, spd: 55, idleT: 0.5, heavy: true,
    intro: ["Der Boden bebt. Ein Riese, die Augen weit aufgerissen – nicht bei sich. Stimmen in seinem Kopf.", "The ground shakes. A giant, eyes wide open – not himself. Voices in his head."],
    outro: ["Der Riese sinkt auf die Knie, die Augen werden glasig – und er schläft ein. Schnarchend. Du lässt ihn schlafen.", "The giant sinks to his knees, his eyes glaze over – and he falls asleep. Snoring. You let him sleep."],
    noKill: true,
    phases: [{ at: 1, moves: ["stampfen", "felswurf", "fausthieb"] }, { at: 0.5, moves: ["stampfen", "felswurf", "fausthieb", "erdbeben"], enter: e => { roar(e, L(["„ZERSCHLAGEN!“", '"SMASH!"'])); e.rage = true; } }],
    move: (e, P, dt) => { face(e, P); walkTo(e, dt, P.x + P.w / 2, 55); if (Math.abs(e.vx) > 10 && Math.floor(e.anim * 2) !== e._st) { e._st = Math.floor(e.anim * 2); FX.addShake(2); A.play("land", { vol: 0.5, rate: 0.6 }); } },
    moves: {
      stampfen: { pre: 0.8, dur: 0.25, post: 0.7, sfx: "roar", range: [0, 120], act: e => { melee(e, box(e, -20, -30, 80, 30), 1.3); FX.addShake(10); A.play("quake"); for (const s of [-1, 1]) Z.spawnProj("e_welle", cxOf(e) + s * 30, feet(e) - 6, s, { dmg: dmg(e, 0.8), life: 2.4 }); } },
      felswurf: { pre: 0.9, dur: 0.3, post: 0.6, sfx: "rock", range: [80, 999], act: (e, P) => { const n = e.rage ? 3 : 1; for (let i = 0; i < n; i++) Z.aimProj("e_stein", cxOf(e), e.y + 10, P.x + P.w / 2 + (i - (n - 1) / 2) * 50, P.y + P.h, { dmg: dmg(e, 1.1) }); } },
      fausthieb: { pre: 0.75, dur: 0.3, post: 0.7, sfx: "swingHeavy", range: [0, 140], act: (e) => { const low = R() < 0.5; melee(e, box(e, -10, low ? -22 : -60, 120, low ? 22 : 38), 1.3); FX.smear({ x: cxOf(e), y: feet(e) - (low ? 12 : 40), dir: e.face, r: 80, a0: -0.25, a1: 0.25, th: 18, life: 0.2, col: "#c8a090" }); FX.addShake(5); }, start: (e, P, m) => { FX.text(cxOf(e), e.y - 10, L(["Ausweichen!", "Dodge!"]), "#ffd27a"); } },
      erdbeben: { pre: 0.9, dur: 1.6, post: 0.6, sfx: "quake", act: e => { FX.addShake(12); rainProj("e_stein", 7, 260, e, 0.8, { gap: 180 }); } }
    }
  });

  /* ---------- Vrock ---------- */
  B.vrock = base({
    n: ["Der Vrock", "The Vrock"], title: ["Geier aus dem Abyss", "Vulture of the Abyss"], shape: "vulture", c: "#3a3a30", t: "#8a2a2a", w: 26, h: 36, size: 1.2, hp: 32, dmg: 1.3, fly: true, noPlat: true, demon: true, idleT: 0.45,
    intro: ["Ein geierartiger Dämon kreist über der Turmspitze. Es stinkt nach Blut und nassen Federn.", "A vulture-like demon circles the spire. It stinks of blood and wet feathers."],
    outro: ["Ein Blitz aus den Wolken holt den Vrock vom Himmel. Ein paar Federn segeln langsam hinterher.", "A bolt from the clouds brings the vrock down. A few feathers drift slowly after it."],
    phases: [{ at: 1, moves: ["sturzflug", "federn", "sporen", "schrei"] }, { at: 0.5, moves: ["sturzflug", "federn", "sporen", "schrei", "manen"], enter: e => { roar(e); e.rage = true; } }],
    move: (e, P, dt) => { face(e, P); const tx = P.x + P.w / 2 + Math.sin(e.anim * 0.9) * 110, ty = P.y - 38 + Math.cos(e.anim * 1.3) * 12; /* W9: auf Kopfhöhe – im Stand/Sprung erreichbar */ e.vx = U.approach(e.vx, U.clamp((tx - cxOf(e)) * 2, -150, 150), 400 * dt); e.vy = U.approach(e.vy, U.clamp((ty - e.y) * 2, -150, 150), 400 * dt); },
    moves: {
      sturzflug: { pre: 0.65, dur: 0.8, post: 0.6, sfx: "roar", act: (e, P, m) => { const a = Math.atan2(P.y + 10 - (e.y + 15), P.x + P.w / 2 - cxOf(e)); m.vx = Math.cos(a) * 400; m.vy = Math.sin(a) * 400; }, tick: (e, P, dt, m) => { e.vx = m.vx; e.vy = m.vy; if (!m.hit) m.hit = melee(e, { x: e.x, y: e.y, w: e.w, h: e.h }, 1.3); if (e.onGround || e.hitWall) { m.t = 9; FX.addShake(5); A.play("land"); } } },
      federn: { pre: 0.5, dur: 0.4, post: 0.5, sfx: "bat", act: (e, P) => { for (let i = -2; i <= 2; i++) { const a = Math.atan2(P.y + 10 - (e.y + 15), P.x - cxOf(e)) + i * 0.15; Z.spawnProj("e_feder", cxOf(e), e.y + 15, 1, { dmg: dmg(e, 0.7), vx: Math.cos(a) * 300, vy: Math.sin(a) * 300 }); } } },
      sporen: { pre: 0.6, dur: 0.3, post: 0.5, sfx: "poison", act: (e, P) => { for (let i = 0; i < 3; i++) Z.spawnHazard({ kind: "poisoncloud", x: P.x + P.w / 2 + (i - 1) * 60, y: Z.groundY(P.x + (i - 1) * 60, P.y + P.h), w: 50, life: 4, dmg: dmg(e, 0.12), owner: "e", eff: { poison: 1 } }); } },
      schrei: { pre: 0.9, dur: 0.3, post: 0.6, sfx: "roar", act: (e, P) => { FX.ring(cxOf(e), e.y + 15, 140, "#c8a070", 0.5, 5); FX.addShake(6); if (U.dist(cxOf(e), e.y, P.x, P.y) < 140 && P.iframe <= 0 && P.rollT <= 0) { Z.addStatus(P, "stun", 0, true); P.hurtT = 0.9; Z.hurtPlayer(dmg(e, 0.5), { x: cxOf(e), unblockable: true, kb: 0 }); FX.text(P.x + P.w / 2, P.y - 12, L(["Betäubt!", "Stunned!"]), "#ffd27a", true); } } },
      manen: { pre: 0.6, dur: 0.2, post: 0.4, sfx: "monster", cond: e => Z.enemies.filter(o => o.master === e && !o.dead).length < 3, act: e => summon(e, "mane", 2, 40) }
    }
  });

  /* ---------- DEMOGORGON (Ende der Tiefe) ----------
     Nur die Grunddaten. Kampf (3 Phasen, Techniken, Seelenhunger), Gestalt (Rig mit zwei Köpfen und Tentakeln) und Arena: demogorgon.js */
  B.demogorgon = base({
    n: ["Demogorgon", "Demogorgon"], title: ["Fürst der Dämonen", "Prince of Demons"], shape: "demogorgon", c: "#3a2a36", t: "#e0a8ff", w: 68, h: 120, size: 1.0, hp: 80, dmg: 1.6, idleT: 0.55, demon: true, fixed: true, noBlock: true,
    intro: ["Der schwarze See wölbt sich. Zwei Pavianköpfe, Tentakel statt Arme – Demogorgon steigt aus der Tiefe. Er hungert nach Seelen: Heilung nährt ihn.", "The black lake bulges. Two baboon heads, tentacles for arms – Demogorgon rises from the deep. He hungers for souls: healing feeds him."],
    outro: ["Demogorgon versinkt im schwarzen Wasser, beide Köpfe kreischen ein letztes Mal. Dann wird der See still. Diesmal wirklich.", "Demogorgon sinks into the black water, both heads shrieking one last time. Then the lake falls silent. This time for real."],
    phases: [{ at: 1, moves: [] }], moves: {}
  });

  /* ---------- THEMBERCHAUD (Ende der Glut) ---------- */
  B.themberchaud = base({
    n: ["Themberchaud", "Themberchaud"], title: ["Meister der Flammen", "Master of Flames"], shape: "dragon", c: "#a02a1a", t: "#ffd27a", belly: "#f0d080", w: 66, h: 46, size: 1.3, hp: 78, dmg: 1.5, idleT: 0.5, fly: true, grounded: true, noPlat: true, immune: ["burn"],
    intro: ["Mit tosendem Brausen landet der Meister der Flammen auf seinem Schatz. Münzen rutschen in Kaskaden herab.", "With a roaring gust the Master of Flames lands on his hoard. Coins slide down in cascades."],
    outro: ["Themberchaud sackt auf seinen Goldberg. Eine Münze rollt bis vor deinen Stiefel. Echo wäre stolz.", "Themberchaud slumps onto his mountain of gold. A coin rolls up to your boot. Echo would be proud."],
    phases: [{ at: 1, moves: ["odem", "klauen", "fluegel", "muenzregen"] }, { at: 0.55, moves: ["odem", "klauen", "sturzflug", "geysire", "muenzregen"], enter: e => { roar(e, L(["Themberchaud erhebt sich in die Luft!", "Themberchaud takes to the air!"])); e.rage = true; } }, { at: 0.2, moves: ["odem", "sturzflug", "geysire", "feuersturm"], enter: e => { roar(e, L(["Der Hort glüht!", "The hoard glows!"])); FX.flashScreen("#ff6a1a", 0.4); } }],
    move: (e, P, dt) => { face(e, P); if (!e.grounded) { const tx = P.x + P.w / 2 - e.face * 120, ty = P.y - 90; e.vx = U.approach(e.vx, U.clamp((tx - cxOf(e)) * 2, -140, 140), 300 * dt); e.vy = U.approach(e.vy, U.clamp((ty - e.y) * 2, -140, 140), 300 * dt); if (R() < dt * 0.3) e.grounded = true; } else { walkTo(e, dt, P.x + P.w / 2 - e.face * 70, 60); if (e.rage && R() < dt * 0.25) { e.grounded = false; e.vy = -200; } } },
    moves: {
      odem: { pre: 0.85, dur: 1.3, post: 0.7, sfx: "fireBig", start: (e, P) => { FX.text(cxOf(e), e.y - 10, L(["Er holt Luft …", "He draws breath…"]), "#ff8a3a"); }, act: (e, P, m) => { m.h = Z.spawnHazard({ kind: "breath", x: cxOf(e) + e.face * 40, y: feet(e) - 14, w: 170, dir: e.face, life: 1.3, dmg: dmg(e, 0.27) /* W9 7. Runde: 0,35 → 0,27 (ein Odem-Treffer nahm 40 % Leben) */, owner: "e", eff: { burn: 1 }, col: "rgba(255,150,40,.65)" }); A.play("fireBig", { vol: 0.9 }); FX.addShake(3); }, tick: (e, P, dt, m) => { e.vx = 0; if (m.h) { m.h.x = cxOf(e) + e.face * 40; m.h.y = feet(e) - 14; } } },
      klauen: { pre: 0.6, dur: 0.5, post: 0.6, sfx: "claw", range: [0, 110], tick: (e, P, dt, m) => { const k = Math.floor(m.t / 0.25); if (k !== m.k) { m.k = k; m.hit = false; A.play("claw"); FX.smear({ x: cxOf(e) + e.face * 26, y: feet(e) - 20, dir: e.face, r: 34, a0: -1.2, a1: 1.0, th: 10, life: 0.15, col: "#ffd27a" }); } if (!m.hit) m.hit = melee(e, box(e, 10, -40, 50, 40), 1.1); } },
      fluegel: { pre: 0.7, dur: 0.8, post: 0.5, sfx: "bat", act: (e, P) => { FX.ring(cxOf(e), e.y + 20, 150, "#ffd27a", 0.5, 4); }, tick: (e, P, dt) => { const d = P.x + P.w / 2 - cxOf(e); /* W9 7. Runde: nicht in Lava/Stacheln blasen (Themberchaud war häufigster Tod; Flügelstoß + Lavarand) */ const ax = Math.floor((P.x + P.w / 2 + U.sign(d) * (P.w / 2 + 10)) / Z.TILE), ay = Math.floor((P.y + P.h + 4) / Z.TILE), bad = v => v === 3 || v === 5 || v === 9; const edge = bad(Z.world.tile(ax, ay)) || bad(Z.world.tile(ax, ay - 1)) || bad(Z.world.tile(ax, ay + 1)); if (Math.abs(d) < 220 && P.rollT <= 0 && !edge) P.vx += U.sign(d) * 1500 * dt; else if (edge && P.onGround) P.vx *= 0.5; if (R() < dt * 30) FX.p({ x: cxOf(e) + U.sign(d) * 40, y: feet(e) - R() * 40, vx: U.sign(d) * 300, vy: 0, life: 0.4, size: 3, col: "#c8a070", kind: "spark" }); } },
      sturzflug: { pre: 0.7, dur: 0.9, post: 0.7, sfx: "roar", start: e => { e.grounded = false; e.vy = -260; }, act: (e, P, m) => { const a = Math.atan2(P.y - e.y, P.x + P.w / 2 - cxOf(e)); m.vx = Math.cos(a) * 420; m.vy = Math.sin(a) * 420 + 60; }, tick: (e, P, dt, m) => { e.vx = m.vx; e.vy = m.vy; if (!m.hit) m.hit = melee(e, { x: e.x, y: e.y, w: e.w, h: e.h }, 1.4); if (e.onGround || e.hitWall) { m.t = 9; e.grounded = true; FX.addShake(9); A.play("quake"); for (const s of [-1, 1]) Z.spawnProj("e_welle", cxOf(e) + s * 30, feet(e) - 6, s, { dmg: dmg(e, 0.8), life: 1.6 }); } }, end: e => { e.grounded = true; } },
      muenzregen: { pre: 0.6, dur: 1.4, post: 0.4, sfx: "coin", act: (e, P) => { Z.bossSay && Z.bossSay(L(["Gold regnet herab. Es tut weh.", "Gold rains down. It hurts."])); rainProj("e_zahn", 14, 260, e, 0.5, { gap: 80 }); } },
      geysire: { pre: 0.6, dur: 1.4, post: 0.5, sfx: "fireBig", act: (e, P) => { for (let i = 0; i < 5; i++) setTimeout(() => { if (!e.dead) { const x = P.x + P.w / 2 + (R() - 0.5) * 160; Z.spawnHazard({ kind: "column", x, y: arena().floor, w: 28, hgt: 200, warn: 0.7, life: 0.5, dmg: dmg(e, 1.1), owner: "e", col: "rgba(255,120,30,.85)", eff: { burn: 1 } }); } }, i * 260); } },
      feuersturm: { pre: 0.8, dur: 2, post: 0.6, sfx: "fireBig", act: (e, P) => { for (let i = 0; i < 10; i++) setTimeout(() => { if (!e.dead) Z.aimProj("e_glut", cxOf(e), e.y + 10, 3 * T + R() * (W.lv.W - 6) * T, arena().floor, { dmg: dmg(e, 0.8) }); }, i * 180); } }
    }
  });

  /* ---------- VENOMFANG (Ende des Himmels) ---------- */
  B.venomfang = base({
    n: ["Venomfang", "Venomfang"], title: ["Der grüne Drache", "The Green Dragon"], shape: "dragon", c: "#2e6a34", t: "#a8e050", belly: "#c8e090", w: 60, h: 42, size: 1.18, hp: 74, dmg: 1.45, idleT: 0.45, fly: true, grounded: true, noPlat: true, immune: ["poison"],
    intro: ["Ein markerschütternder Schrei aus den Wolken – Venomfang landet auf der Turmspitze. Diesmal ist kein Barde da, der ihn bannt.", "A bone-chilling scream from the clouds – Venomfang lands on the tower top. This time there's no bard to entrance him."],
    outro: ["Ein letzter, gezielter Hieb – und Venomfang stürzt von der Turmspitze in die Wolken. „Und dann hab ich ihn erledigt.“", "One last, precise strike – and Venomfang plunges from the tower into the clouds. 'And then I finished him.'"],
    phases: [{ at: 1, moves: ["giftatem", "klauen", "schwanz", "abflug"] }, { at: 0.5, moves: ["giftatem", "klauen", "schwanz", "giftregen", "abflug"], enter: e => { roar(e, L(["Venomfang tobt!", "Venomfang rages!"])); e.rage = true; } }],
    move: (e, P, dt) => { face(e, P); if (!e.grounded) { const tx = P.x + P.w / 2 + Math.sin(e.anim) * 140, ty = P.y - 100; e.vx = U.approach(e.vx, U.clamp((tx - cxOf(e)) * 2, -160, 160), 320 * dt); e.vy = U.approach(e.vy, U.clamp((ty - e.y) * 2, -160, 160), 320 * dt); } else walkTo(e, dt, P.x + P.w / 2 - e.face * 60, 70); },
    moves: {
      giftatem: { pre: 0.8, dur: 1.2, post: 0.6, sfx: "fireBig", act: (e, P, m) => { m.h = Z.spawnHazard({ kind: "breath", x: cxOf(e) + e.face * 36, y: feet(e) - 12, w: 160, dir: e.face, life: 1.2, dmg: dmg(e, 0.3), owner: "e", eff: { poison: 2 }, col: "rgba(170,230,80,.6)" }); }, tick: (e, P, dt, m) => { if (m.h) { m.h.x = cxOf(e) + e.face * 36; m.h.y = feet(e) - 12; } } },
      klauen: { pre: 0.55, dur: 0.6, post: 0.6, sfx: "claw", range: [0, 100], tick: (e, P, dt, m) => { const k = Math.floor(m.t / 0.2); if (k !== m.k) { m.k = k; m.hit = false; e.vx = e.face * 90; A.play("claw"); FX.smear({ x: cxOf(e) + e.face * 24, y: feet(e) - 18, dir: e.face, r: 32, a0: k % 2 ? 1.1 : -1.2, a1: k % 2 ? -1.1 : 1.0, th: 9, life: 0.13, col: "#a8e050" }); } if (!m.hit) m.hit = melee(e, box(e, 6, -36, 48, 36), 1, { eff: { poison: 1 } }); } },
      schwanz: { pre: 0.6, dur: 0.3, post: 0.6, sfx: "swingHeavy", act: (e) => { e.face *= -1; melee(e, box(e, -10, -18, 80, 18), 1.2); FX.smear({ x: cxOf(e), y: feet(e) - 8, dir: e.face, r: 70, a0: -0.3, a1: 0.3, th: 10, life: 0.18, col: "#6aa040" }); FX.text(cxOf(e), e.y - 8, L(["Hinter ihm!", "Behind him!"]), "#a8e050"); } },
      abflug: { pre: 0.5, dur: 2.2, post: 0.4, sfx: "bat", start: e => { e.grounded = false; e.vy = -300; }, tick: (e, P, dt, m) => { if (m.t > 0.5 && !m.dove) { m.k = (m.k || 0) + dt; if (m.k > 0.35) { m.k = 0; Z.aimProj("e_gift", cxOf(e), feet(e), P.x + P.w / 2 + (R() - 0.5) * 40, P.y + P.h, { dmg: dmg(e, 0.7) }); } } if (m.t > 1.6 && !m.dove) { m.dove = true; const a = Math.atan2(P.y - e.y, P.x + P.w / 2 - cxOf(e)); m.vx = Math.cos(a) * 440; m.vy = Math.sin(a) * 440 + 50; } if (m.dove) { e.vx = m.vx; e.vy = m.vy; if (!m.hit) m.hit = melee(e, { x: e.x, y: e.y, w: e.w, h: e.h }, 1.3); if (e.onGround || e.hitWall) { m.t = 9; e.grounded = true; FX.addShake(8); A.play("quake"); for (const s of [-1, 1]) Z.spawnProj("e_welle", cxOf(e) + s * 30, feet(e) - 6, s, { dmg: dmg(e, 0.8), life: 1.6 }); } } }, end: e => { e.grounded = true; } },
      giftregen: { pre: 0.6, dur: 1.4, post: 0.5, sfx: "poison", act: (e, P) => { for (let i = 0; i < 8; i++) setTimeout(() => { if (!e.dead) Z.aimProj("e_gift", cxOf(e), e.y, P.x + P.w / 2 + (R() - 0.5) * 220, arena().floor, { dmg: dmg(e, 0.7) }); }, i * 150); } }
    }
  });

  /* Hilfen für die Arenen: welche Bosse spielen dort, Begleiter (Nezna) */
  /* Wächter: Raum (Zelle) bestimmen, in dem der Kampf stattfindet; liegt der Startpunkt außerhalb, in den Raum holen */
  function wardenBox(id, x, y) {
    const lv = Z.level; if (!lv || lv.arena || !lv.warden) return null;
    const c = lv.warden.cell, x0 = c.x * Z.CW * T, y0 = c.y * Z.CH * T, x1 = x0 + Z.CW * T, y1 = y0 + Z.CH * T;
    const P = Z.player, d = B[id] || {}, bw = d.w || 16, bh = d.h || 28;
    let bx = U.clamp(x, x0 + 3 * T, x1 - 3 * T), by = y;
    const inside = (px, py) => px > x0 && px < x1 && py - bh > y0 && py <= y1;
    /* ganzer Körper frei, fester Boden (oder Plattform) darunter */
    const free = (px, py) => {
      for (let yy = py - bh + 1; yy < py - 1; yy += 6) for (let xx = px - bw / 2 + 1; xx < px + bw / 2; xx += 6) if (W.solidAt(xx, yy)) return false;
      return W.solidAt(px, py + 2) || W.isPlat(Math.floor(px / T), Math.floor((py + 2) / T));
    };
    if (!inside(bx, by) || !free(bx, by)) {
      /* Bodenstelle im Raum suchen: nicht zu nah am Spieler, nicht zu weit weg */
      let best = null, bd = 1e9;
      for (let tx = x0 + 3 * T; tx < x1 - 3 * T; tx += 8) for (let ty = y0 + 2 * T; ty <= y1; ty += T) {
        const fy = ty - 1; if (!free(tx, fy)) continue;
        const dx = P ? Math.abs(tx - P.x) : 120, dy = P ? Math.abs(fy - (P.y + P.h)) : 0;
        const score = Math.abs(dx - 130) + dy * 1.5;
        if (dx > 70 && score < bd) { bd = score; best = [tx, fy]; }
      }
      if (best) { bx = best[0]; by = best[1]; }
    }
    const fl = Z.groundY(bx, by);
    return { x: bx, y: by, box: { x0: x0 + T, x1: x1 - T, floor: fl, top: y0 + T, y1, warden: true } };
  }
  Z.spawnBoss = function (id, x, y) {
    const wb = wardenBox(id, x, y);
    if (wb) { x = wb.x; y = wb.y; }
    const e = Z.spawnEnemy(id, x, y, { tier: Z.run.tier });
    if (!e) return null;
    e.box = wb ? wb.box : null;
    e.intro = 1.8; e.aware = true; e.phase = 0; e.idle = 1;
    if (id === "bugbear") { const n = Z.spawnEnemy("nezna", x - 60, y, { tier: Z.run.tier }); n.intro = 1.8; n.aware = true; n.phase = 0; n.idle = 2; e.partner = n; n.partner = e; }
    if (e.partner) e.partner.box = e.box;
    return e;
  };
  /* Bausteine für Erweiterungen (bossphasen.js) */
  Z.bossKit = { cxOf, feet, dmg, arena, box, melee, mark, strikeAt, rainProj, face, walkTo, grav, summon, roar, brain: bossBrain };
})();
