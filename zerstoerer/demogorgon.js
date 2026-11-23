/* Ezekiel – The Destroyer · Demogorgon, Fürst der Dämonen (Endboss „Herz des Sees“)
   Ein gottgleicher Dämonenprinz ragt halb aus dem schwarzen See hinter der Steininsel. Zwei Mandrillköpfe mit eigenem Willen
   (Aameul links: Säure, Hathradiah rechts: Kreischen), statt Händen je zwei lange Saugnapf-Tentakel (Feder-Ketten).
   Er ist verwundbar am Rumpf (Schuppenpanzer: weniger Schaden), stark verwundbar an steckengebliebenen Tentakeln und
   an herabgestoßenen Köpfen (Schwachpunkte). Seelenhunger: er frisst einen Teil jeder Heilung (Tränke ausgenommen).
   Aufbau: 1. Grundlagen · 2. Rig (Körper, Köpfe, Tentakel) · 3. Trefferzonen, Seelenhunger, Griff, Wahnsinn · 4. Techniken
           5. Phasen & Arena · 6. Zeichnen (Hintergrund, Vordergrund, Leuchten) · 7. Verkabelung
   Grundsatz: übermächtig, aber jede Technik ist lesbar (Schatten, Bodenmarken, Ringe, Augen-Anzeige) und ohne Treffer ausweichbar. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v), R = () => Z.R();
  const K = Z.bossKit, B = Z.BOSSDEF, BP = Z.bossPhase;
  if (!K || !B || !B.demogorgon || !BP) return;
  const { dmg } = K;
  const { phased, tele, later, zone, floorSweep, alive, PRE, minions, drift } = BP;
  const AR = () => K.arena();
  const TAU = Math.PI * 2, N = (de, en) => [de, en];
  const pcx = P => P.x + P.w / 2, pcy = P => P.y + P.h / 2;
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v), lp = (a, b, k) => a + (b - a) * k;
  const sstep = k => { k = cl(k, 0, 1); return k * k * (3 - 2 * k); };
  const low = () => (Z.lowGfx ? Z.lowGfx() : false);
  const isDemo = e => !!(e && e.def && e.def.boss && e.def.shape === "demogorgon");
  const D = B.demogorgon;
  const skulls = () => (Z.run && Z.run.skulls) || 0;
  const say = (de, en) => Z.bossSay && Z.bossSay(L([de, en]));
  const hint = (P, de, en, col) => P && FX.text(pcx(P), P.y - 18, L([de, en]), col || "#ffd27a", true);
  const once = (e, k) => { const s = e.dg.seen; if (s[k]) return false; s[k] = 1; return true; };
  const inArena = () => !!(Z.level && Z.level.arena === "demogorgon");
  const live = () => { const b = Z.boss; return isDemo(b) && b.dg && !b.dead && !Z.bossDefeated && inArena() ? b : null; };
  /* Farben (kein Blau): schwarzes/grünliches/violettes Wasser, silbriger Glanz */
  const COL = { ink: "#0c070e", skin: "#2b2130", skin2: "#4a3846", belly: "#5e3a4a", suck: "#d8a6a8", suck2: "#4a1a2a", gloss: "rgba(232,236,226,.42)",
    water: "#070a08", water2: "#16221a", foam: "#d8dcd2", acid: "#b8ff4a", scream: "#ff5a3a", rune: "#e8c86a", soul: "#c070ff", mad: "#b05aff", ichor: "#7a3a6a" };
  const EYE = ["#b8ff4a", "#ff6a3a"];
  /* Phasen-Kennzahlen (0, 1, 2) */
  const PV = (e, a, b, c) => [a, b, c][Math.min(2, e.phase || 0)];

  /* ======================= 2. RIG ======================= */
  const ARMN = 22;
  function mkArm(side, k) { return { side, k, n: ARMN, p: new Float32Array(ARMN * 2), v: new Float32Array(ARMN * 2), o: new Float32Array(ARMN * 2), mode: "idle", t: 0, tx: 0, ty: 0, u: 0, sd: 0, hit: 0, init: false, ph: k * 2.1 + (side > 0 ? 1 : 0), busy: false, wound: 0 }; }
  function mkHead(i) { return { i, side: i ? 1 : -1, x: 0, y: 0, f: i ? 1 : -1, ang: 0, jaw: 0.1, jawT: 0.1, rear: 0, rearT: 0, lunge: 0, lungeT: 0, lx: 0, ly: 0, glow: 0.5, blink: 0, blinkT: 2 + i * 1.7, steamT: i * 0.8, hit: 0, throat: 0, throatT: 0, stare: 0, stareT: 0, shake: 0 }; }
  function st(e) {
    if (e.dg) return e.dg;
    e.dg = { t: 0, rise: 0, lift: 0, liftT: 0, bob: 0, lean: 0, hunch: 0, heads: [mkHead(0), mkHead(1)], arms: [mkArm(-1, 0), mkArm(-1, 1), mkArm(1, 0), mkArm(1, 1)],
      spouts: [], globs: [], rings: [], shadows: [], ripples: [], flood: 0, floodT: 0, holes: [], whirl: 0, whirlT: 0, held: null, madT: 0, madMax: 1, gaze: null, grab: null,
      hunger: 0, hungerTxt: 0, rage: 0, seen: {}, part: null, quarrel: 0, introT: 0, introSet: false, thread: 0, snapped: false, lastDraw: null, torsoHit: 0, rageT: 0, deathFx: {} };
    geo(e); return e.dg;
  }
  /* Lage des Körpers: Wasserlinie des Sees hinter der Insel, Schulterlinie, Mitte */
  function geo(e) {
    const d = e.dg, FY = AR().floor;
    d.FY = FY; d.cx = W.lv.W * T / 2;
    const dk = e.dead ? cl((e.deadT || 0) / 3.4, 0, 1) : 0;
    d.wl = FY - 14;
    d.bx = d.cx + d.lean * 10 + Math.sin(d.t * 0.37) * 4;
    d.by = d.wl + 14 + (1 - sstep(d.rise)) * 250 - d.lift + d.bob + dk * dk * 230 + d.hunch * 8;
    d.sy = d.by - 92 + d.hunch * 8;
  }
  const wrist = (e, s) => ({ x: e.dg.bx + s * 84, y: e.dg.sy + 30 });
  const shoulder = (e, s) => ({ x: e.dg.bx + s * 56, y: e.dg.sy - 2 });
  const neckBase = (e, h) => ({ x: e.dg.bx + h.side * 22, y: e.dg.sy + 2 });
  function armRoot(e, a) { const w = wrist(e, a.side); return { x: w.x + a.side * (a.k ? -2 : 5), y: w.y + (a.k ? 7 : -3) }; }
  const tip = a => ({ x: a.p[(a.n - 1) * 2], y: a.p[(a.n - 1) * 2 + 1] });
  function bez(o, n, x0, y0, cx, cy, x1, y1) { for (let i = 0; i < n; i++) { const t = i / (n - 1), u = 1 - t; o[i * 2] = u * u * x0 + 2 * u * t * cx + t * t * x1; o[i * 2 + 1] = u * u * y0 + 2 * u * t * cy + t * t * y1; } }
  function wobble(o, n, t, amp, f) { for (let i = 2; i < n - 1; i++) { const q = i / (n - 1), j = i * 2, w = Math.sin(t * f - i * 0.7) * amp * Math.sin(q * Math.PI); o[j] += w * 0.4; o[j + 1] -= Math.abs(w) * 0.8; } }
  function overHole(e, x) { for (const h of e.dg.holes) if (x > h[0] && x < h[1]) return true; return false; }
  /* Sollform je Zustand (die Kette folgt ihr mit Federn: Wurzel steif, Spitze träge → Peitschen-Nachschwingen) */
  function desired(e, a) {
    const d = e.dg, r = armRoot(e, a), n = a.n, o = a.o, s = a.side, t = d.t + a.ph, FY = d.FY;
    switch (a.mode) {
      case "raise": { const hy = FY - 150 - a.k * 10; bez(o, n, r.x, r.y, lp(r.x, a.tx, 0.35), Math.min(r.y, hy) - 80, a.tx + Math.sin(t * 4) * 5, hy + Math.sin(t * 3) * 6); break; }
      case "slam": { const u = sstep(a.u), hy = lp(FY - 150, FY - 3, u * u); bez(o, n, r.x, r.y, lp(r.x, a.tx, lp(0.35, 0.62, u)), lp(Math.min(r.y, FY - 150) - 70, FY - 26, u), a.tx, hy); break; }
      case "stuck": { bez(o, n, r.x, r.y, lp(r.x, a.tx, 0.6), FY - 30, a.tx, FY - 3); wobble(o, n, t, 6 + 6 * a.hit, 7); break; }
      case "sweep": { bez(o, n, r.x, r.y, lp(r.x, a.tx, 0.5), FY - 46, a.tx, FY - 7); break; }
      case "reach": case "hold": { bez(o, n, r.x, r.y, lp(r.x, a.tx, 0.45), Math.min(r.y, a.ty) - 60, a.tx, a.ty); if (a.mode === "hold") wobble(o, n, t, 4, 11); break; }
      default: { /* Ruhe, Rückzug, Tod: rollt sich farnartig ein und wogt */
        const dead = a.mode === "dead", ang0 = dead ? 1.35 : a.k ? 0.35 : -0.38, curl = dead ? 0.5 : a.k ? -1.9 : -2.7, L0 = dead ? 12 : a.k ? 8.2 : 10.5;
        const sway = dead ? 0.05 : 0.2 + 0.12 * d.rage;
        let x = r.x, y = r.y; o[0] = x; o[1] = y;
        for (let i = 1; i < n; i++) {
          const q = i / (n - 1), ang = ang0 + curl * Math.pow(q, 1.7) + Math.sin(t * 1.4 - i * 0.32) * sway * q + Math.sin(t * 0.6) * 0.14;
          x += Math.cos(ang) * L0 * s; y += Math.sin(ang) * L0; o[i * 2] = x; o[i * 2 + 1] = y;
        }
      }
    }
  }
  const KMODE = { idle: [70, 26], retract: [60, 24], raise: [150, 60], slam: [1500, 950], stuck: [520, 260], sweep: [1100, 800], reach: [900, 560], hold: [700, 420], dead: [26, 9] };
  function updArm(e, a, dt) {
    const d = e.dg;
    a.t += dt; a.hit = Math.max(0, a.hit - dt * 5); if (a.wound > 0) a.wound -= dt;
    if (a.mode === "slam") a.u = Math.min(1, a.u + dt / 0.13);
    if (a.mode === "stuck" && (a.sd -= dt) <= 0) { setArm(a, "retract"); FX.burst(a.tx, d.FY - 4, 10, { col: [Z.dustCol || "#8a7a70", "#3a3030"], sp: 90, ang: -Math.PI / 2, spread: 1.6, life: 0.5, size: 3, kind: "smoke" }); A.play("slime", { vol: 0.45, x: a.tx }); }
    if (a.mode === "retract" && a.t > 0.7) { a.mode = "idle"; a.busy = false; }
    desired(e, a);
    const p = a.p, v = a.v, o = a.o, n = a.n;
    if (!a.init) { p.set(o); a.init = true; }
    const km = KMODE[a.mode] || KMODE.idle, sub = dt > 1 / 70 ? 2 : 1, h = Math.min(dt, 1 / 30) / sub;
    for (let s = 0; s < sub; s++) for (let i = 1; i < n; i++) {
      const q = i / (n - 1), Kk = lp(km[0] * 1.7, km[1], q), C = Math.sqrt(Kk) * 1.05, j = i * 2;
      v[j] += ((o[j] - p[j]) * Kk - v[j] * C) * h; v[j + 1] += ((o[j + 1] - p[j + 1]) * Kk - v[j + 1] * C) * h;
      p[j] += v[j] * h; p[j + 1] += v[j + 1] * h;
    }
    p[0] = o[0]; p[1] = o[1];
    const FY = d.FY;
    if (a.mode !== "dead") for (let i = 1; i < n; i++) { const j = i * 2; if (p[j + 1] > FY - 2 && !overHole(e, p[j])) { p[j + 1] = FY - 2; if (v[j + 1] > 0) v[j + 1] *= -0.2; } }
    /* Schleim tropft von hängenden Tentakeln */
    if (!low() && R() < dt * 1.2) { const i = 6 + ((R() * (n - 8)) | 0); FX.p({ x: p[i * 2], y: p[i * 2 + 1] + 2, vx: 0, vy: 20, g: 420, life: 0.7, size: 1.6, col: "#9ab070", kind: "drop" }); }
  }
  function setArm(a, mode, tx, ty) { a.mode = mode; a.t = 0; if (tx != null) a.tx = tx; if (ty != null) a.ty = ty; if (mode === "slam") a.u = 0; a.busy = mode !== "idle" && mode !== "retract"; }
  /* freien Arm wählen: Seite zum Ziel, gesunde Arme zuerst */
  function pickArm(e, x, not) {
    const d = e.dg, side = x < d.bx ? -1 : 1;
    const free = d.arms.filter(a => !a.busy && a !== not && !(not && not.includes && not.includes(a)));
    free.sort((a, b) => (a.side === side ? 0 : 2) + (a.wound > 0 ? 3 : 0) + a.k * 0.5 - ((b.side === side ? 0 : 2) + (b.wound > 0 ? 3 : 0) + b.k * 0.5));
    return free[0] || null;
  }
  function headRest(e, h) { const d = e.dg; return { x: d.bx + h.side * (h.i ? 50 : 46) + d.lean * 5, y: d.sy - (h.i ? 50 : 44) + Math.sin(d.t * (h.i ? 1.3 : 1.1) + h.i * 2) * 2.4 }; }
  function updHead(e, h, dt, P) {
    const d = e.dg, r = headRest(e, h);
    let tx = P ? pcx(P) : d.bx, ty = P ? pcy(P) : d.FY;
    if (d.quarrel > 0) { const o = d.heads[1 - h.i]; tx = o.x; ty = o.y; }
    h.f = U.approach(h.f, tx > h.x + 10 ? 1 : tx < h.x - 10 ? -1 : h.f, dt * 7);
    h.rear = U.approach(h.rear, h.rearT, dt * 4); h.lunge = U.approach(h.lunge, h.lungeT, dt * (h.lungeT > h.lunge ? 9 : 2.6));
    h.jaw = U.approach(h.jaw, h.jawT, dt * 7); h.throat = U.approach(h.throat, h.throatT, dt * 3); h.stare = U.approach(h.stare, h.stareT, dt * 2.5);
    let x = r.x - h.side * 8 * h.rear, y = r.y - 14 * h.rear;
    if (d.quarrel > 0) { const sn = Math.max(0, Math.sin(d.t * 8 + h.i * 1.7)); x -= h.side * (8 + 10 * sn) * d.quarrel; y += 4 * sn * d.quarrel; h.jawT = 0.2 + 0.8 * sn; }
    if (h.lunge > 0) { const k = sstep(h.lunge); x = lp(x, h.lx, k); y = lp(y, h.ly, k); }
    h.shake = Math.max(0, h.shake - dt * 3);
    h.x = x + (h.shake > 0 ? (R() - 0.5) * 3 * h.shake : 0); h.y = y;
    const dy = ty - h.y, dx = Math.abs(tx - h.x) + 20;
    h.ang = lp(h.ang, cl(Math.atan2(dy, dx) * 0.5, -0.3, 0.55) - h.rear * 0.45 + sstep(h.lunge) * 0.35, 1 - Math.exp(-dt * 6));
    h.hit = Math.max(0, h.hit - dt * 4);
    h.blinkT -= dt; if (h.blinkT <= 0) { h.blink = 0.16; h.blinkT = 2.2 + R() * 4; } h.blink = Math.max(0, h.blink - dt);
    h.glow = lp(h.glow, 0.5 + 0.5 * h.stare + 0.4 * h.throat + 0.3 * d.rage, 1 - Math.exp(-dt * 4));
    /* Atemdampf aus den Nüstern, Geifer */
    h.steamT -= dt;
    if (h.steamT <= 0 && d.rise > 0.9) {
      h.steamT = 1.4 + R() * 1.2;
      const m = mouth(h, 25, 0);
      if (!low()) for (let i = 0; i < 4; i++) FX.p({ x: m.x, y: m.y, vx: h.f * (16 + R() * 18), vy: -8 - R() * 10, life: 1.3, size: 3 + R() * 2, col: "rgba(210,215,205,.55)", kind: "smoke", drag: 0.97 });
    }
    if (h.jaw > 0.35 && R() < dt * 4) { const m = mouth(h, 14, 9); FX.p({ x: m.x, y: m.y, vx: 0, vy: 10, g: 300, life: 0.8, size: 1.6, col: h.i ? "#e0a0a0" : "#c8e890", kind: "drop" }); }
  }
  /* Punkt im Kopf-Rahmen (Blickrichtung rechts) → Welt */
  function mouth(h, lx, ly) { const fs = h.f >= 0 ? Math.max(0.6, h.f) : Math.min(-0.6, h.f), ca = Math.cos(h.ang), sa = Math.sin(h.ang); const X = lx * ca - ly * sa, Y = lx * sa + ly * ca; return { x: h.x + X * fs, y: h.y + Y }; }

  /* ======================= 3. TREFFERZONEN, SEELENHUNGER, GRIFF, WAHNSINN ======================= */
  function parts(e) {
    const d = e.dg, FY = d.FY, out = [];
    const top = Math.max(d.sy + 12, FY - 110);
    out.push({ k: "torso", x: d.bx - 34, y: top, w: 68, h: FY - top, mul: 0.6 });
    for (const a of d.arms) if (a.mode === "stuck") {
      let x0 = 1e9, x1 = -1e9; for (let i = a.n - 7; i < a.n; i++) { x0 = Math.min(x0, a.p[i * 2]); x1 = Math.max(x1, a.p[i * 2]); }
      out.push({ k: "arm", a, x: x0 - 6, y: FY - 30, w: Math.max(30, x1 - x0 + 12), h: 30, mul: 1.6 });
    }
    for (const hd of d.heads) if (hd.lunge > 0.6) out.push({ k: "head", hd, x: hd.x - 20, y: hd.y - 18, w: 40, h: 36, mul: 1.6 });
    return out;
  }
  function placeBox(e, P) {
    const ps = parts(e); let best = ps[0], bd = 1e9;
    const px = P ? pcx(P) : e.dg.bx, py = P ? pcy(P) : e.dg.FY;
    for (const q of ps) { const dx = Math.max(q.x - px, 0, px - (q.x + q.w)), dy = Math.max(q.y - py, 0, py - (q.y + q.h)), dd = dx + dy * 0.7 - (q.mul > 1 ? 14 : 0); if (dd < bd) { bd = dd; best = q; } }
    e.x = best.x; e.y = best.y; e.w = best.w; e.h = best.h; e.vx = 0; e.vy = 0; e.onGround = true; e.grounded = true; e.dgPart = best; e.face = px < e.dg.bx ? -1 : 1;
  }
  /* Ein Tentakel wird zerfetzt: Demogorgon taumelt */
  function rip(e, a) {
    const d = e.dg, t0 = tip(a);
    setArm(a, "retract"); a.wound = 7; a.sd = 0;
    FX.burst(t0.x, t0.y - 6, 30, { col: [COL.ichor, "#2a1020", "#c8e890"], sp: 200, ang: -Math.PI / 2, spread: 2.2, life: 0.8, size: 3, kind: "drop", g: 500 });
    FX.addShake(9); FX.stop(0.09); A.play("monster", { vol: 0.9, rate: 0.7 }); A.play("slime", { vol: 0.8 });
    if (!e.trans) { e.st.stun = Math.max(e.st.stun || 0, 1.1); for (const h of d.heads) { h.rearT = 0; h.jawT = 1; h.shake = 1; } }
    FX.text(t0.x, t0.y - 30, L(["Tentakel zerfetzt!", "Tentacle torn!"]), "#ffd27a", true);
    later(0.9, () => { for (const h of d.heads) h.jawT = 0.1; });
  }
  /* Seelenhunger: ein Teil jeder Heilung fließt zu Demogorgon (Tränke heilen direkt und sind ausgenommen) */
  function hunger(e, s, P) {
    const d = e.dg; d.hunger += s;
    e.hp = Math.min(e.hpMax, e.hp + s * 3);
    const h = d.heads[pcx(P) < d.bx ? 0 : 1], m = mouth(h, 18, 4), n = Math.min(6, 1 + (s / 2) | 0);
    for (let i = 0; i < n; i++) { const x = pcx(P) + (R() - 0.5) * 10, y = pcy(P) + (R() - 0.5) * 14, life = 0.55 + R() * 0.25; FX.p({ x, y, vx: (m.x - x) / life, vy: (m.y - y) / life, life, size: 2.4, col: COL.soul, kind: "glow", add: true, drag: 1 }); }
    h.throat = Math.min(1, h.throat + 0.15);
    if (once(e, "hunger")) { say("Seelenhunger: Demogorgon frisst einen Teil jeder Heilung – Tränke ausgenommen.", "Soul Hunger: Demogorgon devours part of all healing – potions excepted."); FX.text(pcx(P), P.y - 22, L(["Seelenhunger!", "Soul Hunger!"]), COL.soul, true); }
    else if (d.hungerTxt <= 0 && d.hunger > 3) { d.hungerTxt = 3.5; FX.text(pcx(P), P.y - 12, "−" + Math.round(d.hunger) + " ♥", COL.soul); d.hunger = 0; }
  }
  /* Griff: Spieler hängt im Tentakel, kann sich durch Hämmern befreien */
  const HOLD_KEYS = ["left", "right", "up", "down", "jump", "roll", "a1", "a2", "s1", "s2", "potion", "use"];
  function release(e, freed) {
    const d = e.dg, hd = d.held, P = Z.player; if (!hd) return;
    d.held = null; const a = hd.arm;
    if (P && !P.dead) {
      const dir = hd.dir; P.iframe = 0;
      if (!freed) Z.hurtPlayer(dmg(e, 0.75), { x: pcx(P) - dir * 20, kb: 0, unblockable: true, force: true });
      P.vx = dir * (freed ? 160 : 400); P.vy = freed ? -180 : -260; P.onGround = false; P.iframe = Math.max(P.iframe, freed ? 0.6 : 0.35);
      FX.text(pcx(P), P.y - 14, freed ? L(["Befreit!", "Broke free!"]) : L(["Geschleudert!", "Hurled!"]), freed ? "#7fd36a" : "#ff8a5a", true);
      A.play(freed ? "slime" : "whip", { vol: 0.8 });
    }
    if (a) { setArm(a, freed ? "retract" : "stuck", hd.tx); if (!freed) { a.tx = U.clamp(a.tx, AR().x0 + 20, AR().x1 - 20); a.sd = 1.2; a.stuckDmg = 0; } }
  }
  function holdTick(e, P, dt) {
    const d = e.dg, hd = d.held, inp = Z.input, a = hd.arm;
    hd.t += dt;
    if (inp.pressed.a1 || inp.pressed.a2 || inp.pressed.jump || inp.pressed.roll) { hd.mash++; FX.burst(pcx(P), pcy(P), 5, { col: ["#ffd27a", "#fff2d0"], sp: 90, life: 0.25, size: 1.6, kind: "spark", add: true }); a.hit = 1; A.play("hitFlesh", { vol: 0.4, gap: 0.05 }); }
    /* Hebebahn: hoch, quetschen, schleudern */
    const k = cl(hd.t / 0.6, 0, 1), sx = hd.x0, sy = hd.y0;
    a.tx = lp(sx, d.bx + a.side * 120, sstep(k) * 0.6); a.ty = lp(sy, d.FY - 150, sstep(k));
    if (hd.t > 0.6) { a.tx += Math.sin(hd.t * 30) * 2; a.ty += Math.cos(hd.t * 26) * 2; }
    const t0 = tip(a);
    P.x = t0.x - P.w / 2; P.y = t0.y - P.h * 0.55; P.vx = 0; P.vy = 0; P.onGround = false; P.rollT = 0; P.iframe = Math.max(P.iframe, 0.12);
    if (hd.mash >= (skulls() >= 3 ? 6 : 5)) release(e, true);
    else if (hd.t >= hd.dur) release(e, false);
  }
  /* ======================= 4. TECHNIKEN ======================= */
  function impactFx(e, x, big) {
    const d = e.dg, FY = d.FY;
    FX.addShake(big ? 10 : 7); A.play("quake", { vol: big ? 0.8 : 0.55, x }); A.play("hitHeavy", { vol: 0.6, x }); A.play("splash", { vol: 0.6, x, gap: 0.05 });
    FX.burst(x, FY - 2, big ? 26 : 16, { col: [Z.dustCol || "#8a7a70", "#c8b8a0", "#3a3030"], sp: 170, ang: -Math.PI / 2, spread: 2.6, life: 0.6, size: 3.4, kind: "smoke" });
    FX.burst(x, FY - 4, 14, { col: ["#1a2a20", COL.foam, "#5a7a64"], sp: 210, ang: -Math.PI / 2, spread: 1.4, life: 0.7, size: 1.8, kind: "drop", g: 560 });
    FX.ring(x, FY - 3, 40, "#d8dcd2", 0.35, 2);
    d.ripples.push({ x, y: FY - 1, t: 0, life: 0.8, r: 50, floor: true });
  }
  /* Tentakelhammer: Arm hebt sich über den Spieler (Schatten folgt), friert ein, kracht herab und bleibt stecken (Schwachpunkt) */
  function hammerScript(e, m, n, o) {
    o = o || {};
    m.strikes = []; for (let i = 0; i < n; i++) m.strikes.push({ t0: (o.t0 || 0) + i * (o.gap || PV(e, 0.6, 0.5, 0.42)), st: "wait", a: null, x: 0 });
    m.track = o.track || PV(e, 0.55, 0.48, 0.42); m.hitD = o.hitD || PV(e, 0.5, 0.46, 0.42); m.stuck = o.stuck || PV(e, 2.3, 1.9, 1.6);
  }
  function hammerRun(e, P, dt, m) {
    if (!m.strikes) return;
    const d = e.dg, a0 = AR();
    for (const s of m.strikes) {
      if (s.st === "done") continue;
      const tt = m.clk - s.t0;
      if (s.st === "wait") {
        if (tt < 0) continue;
        s.a = pickArm(e, pcx(P)); if (!s.a) { s.st = "done"; continue; }
        s.x = U.clamp(pcx(P), a0.x0 + 18, a0.x1 - 18); setArm(s.a, "raise", s.x); s.st = "track";
        s.sh = { x: s.x, t: 0, dur: m.track + m.hitD, lock: false }; d.shadows.push(s.sh);
        A.play("whip", { vol: 0.5, rate: 0.7, x: s.x });
      }
      if (s.st === "track") {
        s.x = U.approach(s.x, U.clamp(pcx(P), a0.x0 + 18, a0.x1 - 18), dt * 280); s.a.tx = s.x; s.sh.x = s.x;
        if (tt >= m.track) {
          s.st = "lock"; s.sh.lock = true;
          zone(e, s.x, d.FY, 46, 70, m.hitD, 1.35, { col: "rgba(0,0,0,0)", warnCol: "rgba(0,0,0,0)", kb: 200, kbUp: 240, active: 0.12 });
        }
      }
      if (s.st === "lock") {
        if (tt >= m.track + m.hitD - 0.12 && s.a.mode === "raise") setArm(s.a, "slam", s.x);
        if (tt >= m.track + m.hitD) { s.st = "done"; setArm(s.a, "stuck", s.x); s.a.sd = m.stuck; s.a.stuckDmg = 0; impactFx(e, s.x, m.strikes.length === 1); if (once(e, "weakArm")) later(0.4, () => { if (alive(e)) FX.text(s.x, d.FY - 40, L(["Schwachpunkt!", "Weak point!"]), "#ffd27a", true); }); }
      }
    }
  }
  const hammerDone = m => !m.strikes || m.strikes.every(s => s.st === "done");
  /* Bodenfegen: ein Tentakel fegt flach über die ganze Insel (springen) */
  function sweepStart(e, P, m, fromLeft, warn, ret) {
    const d = e.dg, a = AR(), x0 = fromLeft ? a.x0 + 4 : a.x1 - 4, dir = fromLeft ? 1 : -1, len = a.x1 - a.x0 - 8;
    const arm = m.sweepArm && m.sweepArm.mode === "sweep" ? m.sweepArm : pickArm(e, x0);
    if (!arm) return;
    setArm(arm, "sweep", x0); m.sweepArm = arm;
    const seg = 22, gap = 0.75 / (len / seg);
    floorSweep(e, x0, dir, len, { warn, gap, seg, h: 20, col: "#b07a9a", m: 1.15, fx: ["#2a2230", "#b07a9a"], sfx: "whip", warnCol: "#ff3a2a" });
    m.sw = { x0, dir, len, warn, gap, seg, t: 0 };
    if (!ret) hint(P, "Springen!", "Jump!");
  }
  function sweepRun(e, dt, m) {
    const s = m.sw; if (!s || !m.sweepArm) return;
    s.t += dt;
    const k = (s.t - s.warn) / s.gap * s.seg;
    m.sweepArm.tx = s.x0 + s.dir * cl(k, 0, s.len);
  }
  /* Tentakelgitter aus dem Wasser: Reihe aus Fangarmen, eine Lücke (grün) */
  function spout(e, x, warn, life, m, hgt) {
    const d = e.dg; hgt = hgt || 176;
    Z.spawnHazard({ kind: "column", x, y: d.FY, w: 24, hgt, warn, life, dmg: dmg(e, m), owner: "e", col: "rgba(0,0,0,0)", warnCol: "rgba(176,90,255,.28)", kb: 160, kbUp: 260 });
    d.spouts.push({ x, t: 0, warn, life, h: hgt, ph: R() * 6 });
  }
  function gitterWave(e, P, warn, shiftGap) {
    const d = e.dg, a = AR(), n = 7, step = 50;
    const c0 = U.clamp(pcx(P), a.x0 + step * 3 + 10, a.x1 - step * 3 - 10);
    const near = Math.round((pcx(P) - c0) / step) + 3;
    let gap = cl(near + (R() < 0.5 ? -2 : 2), 0, n - 1); if (gap === near) gap = cl(near + 2, 0, n - 1);
    if (shiftGap != null) gap = cl(shiftGap, 0, n - 1);
    for (let i = 0; i < n; i++) {
      const x = c0 + (i - 3) * step;
      if (i === gap) { tele({ k: "safe", x, y: d.FY, w: 34, dur: warn + 0.4 }); continue; }
      spout(e, x, warn, 0.5, 1.0);
      for (const ex of [-1, 1]) if ((i === 0 && ex < 0) || (i === n - 1 && ex > 0)) { const x2 = x + ex * step; if (x2 > a.x0 + 8 && x2 < a.x1 - 8) spout(e, x2, warn, 0.5, 1.0); }
    }
    later(warn, () => { if (alive(e)) { FX.addShake(5); A.play("splash", { vol: 0.8 }); A.play("monster", { vol: 0.5, rate: 1.2 }); } });
    return gap;
  }
  /* Säurespeien (Aameul): Klumpen im Bogen, Landestellen markiert, Giftlachen bleiben liegen */
  function spit(e, P, n, spread) {
    const d = e.dg, h = d.heads[0], a = AR();
    const xs = []; for (let i = 0; i < n; i++) xs.push(U.clamp(pcx(P) + (i - (n - 1) / 2) * spread + (R() - 0.5) * 14, a.x0 + 14, a.x1 - 14));
    xs.forEach((x, i) => later(i * 0.12, () => {
      if (!alive(e)) return;
      const m0 = mouth(h, 22, 6), fl = 0.78;
      tele({ k: "floor", x, y: d.FY, w: 30, dur: fl + 0.04, col: "#9ad04a" });
      d.globs.push({ x0: m0.x, y0: m0.y, x1: x, y1: d.FY - 3, t: 0, dur: fl, arc: 70 + R() * 30 });
      A.play("slime", { vol: 0.45, x: m0.x, gap: 0.03 }); h.jaw = Math.max(h.jaw, 0.9);
      later(fl, () => {
        if (!alive(e)) return;
        zone(e, x, d.FY, 34, 26, 0, 0.8, { col: "rgba(184,255,74,.85)", active: 0.12, eff: { poison: 1 } });
        Z.spawnHazard({ kind: "poisonpool", x, y: d.FY, w: 36, life: PV(e, 3.2, 3.6, 4.0), dmg: dmg(e, 0.18), owner: "e", eff: { poison: 1 } });
        FX.burst(x, d.FY - 3, 12, { col: ["#b8ff4a", "#6a9a2a", "#e8ffb0"], sp: 120, ang: -Math.PI / 2, spread: 2.2, life: 0.5, size: 2, kind: "drop", g: 500 });
        A.play("poison", { vol: 0.5, x, gap: 0.05 });
      });
    }));
  }
  /* Kreischen (Hathradiah): Lärmringe breiten sich vom Maul aus – durchrollen, sonst betäubt */
  function scream(e, n) {
    const d = e.dg, h = d.heads[1];
    for (let i = 0; i < n; i++) later(i * 0.48, () => {
      if (!alive(e)) return;
      const m = mouth(h, 22, 6);
      d.rings.push({ x: m.x, y: m.y, r: 8, sp: 290, max: 640, t: 0, hit: false });
      h.jaw = 1; h.shake = 1; FX.addShake(5); A.play("roar", { vol: 0.75, rate: 1.35 + i * 0.1 }); A.play("dark", { vol: 0.4 });
    });
  }
  function ringTick(e, P, dt) {
    const d = e.dg;
    for (const r of d.rings) {
      r.t += dt; r.r += r.sp * dt;
      if (r.hit || !P || P.dead || d.held) continue;
      const dist = Math.hypot(pcx(P) - r.x, pcy(P) - r.y);
      if (Math.abs(dist - r.r) < 10) {
        r.hit = true;
        if (Z.hurtPlayer(dmg(e, 0.45), { x: r.x, kb: 150, kbUp: 120, unblockable: true })) {
          P.hurtT = Math.max(P.hurtT, 0.85); Z.addStatus(P, "slow", 1.2, true);
          FX.text(pcx(P), P.y - 14, L(["Betäubt!", "Stunned!"]), "#ff8a5a", true);
        }
      }
    }
    d.rings = d.rings.filter(r => r.r < r.max);
  }
  /* Kopfbiss: ein Kopf stößt auf die markierte Stelle herab und bleibt kurz unten (Schwachpunkt) */
  function bite(e, h, x, warn) {
    const d = e.dg;
    h.rearT = 1; h.jawT = 0.6; h.lx = x; h.ly = d.FY - 24;
    tele({ k: "floor", x, y: d.FY, w: 66, dur: warn, col: "#ff3a2a" });
    zone(e, x, d.FY, 62, 52, warn, 1.5, { col: "rgba(0,0,0,0)", warnCol: "rgba(0,0,0,0)", kb: 230, kbUp: 220, active: 0.12 });
    later(warn - 0.1, () => { if (!alive(e)) return; h.lungeT = 1; h.rearT = 0; h.jawT = 1; A.play("bite", { vol: 0.9, x }); });
    later(warn, () => { if (!alive(e)) return; h.jawT = 0.05; impactFx(e, x, false); FX.burst(x, d.FY - 20, 10, { col: ["#f0e8d0", "#c8b8a0"], sp: 90, life: 0.3, size: 1.6, kind: "spark", add: true }); });
    later(warn + PV(e, 1.5, 1.3, 1.1), () => { h.lungeT = 0; h.jawT = 0.2; });
  }
  function biteHead(e, P) { const d = e.dg, a = d.heads[0], b = d.heads[1]; return pcx(P) < d.bx ? (a.lungeT > 0 ? b : a) : (b.lungeT > 0 ? a : b); }
  const biteX = (e, P) => U.clamp(pcx(P), e.dg.bx - 200, e.dg.bx + 200);

  const MV = {
    hammer: { nm: N("Tentakelhammer", "Tentacle Hammer"), pre: 0.35, dur: 9, post: 0.55, sfx: "monster", w: 1.35,
      start: (e, P, m) => { m.clk = 0; hammerScript(e, m, Math.min(3, PV(e, 1, 2, 3) + (skulls() >= 4 && e.phase >= 1 ? 1 : 0))); if (once(e, "hammerHint")) hint(P, "Schatten! Weg da!", "Shadow! Move!"); },
      preTick: (e, P, dt, m) => { m.clk += dt; hammerRun(e, P, dt, m); },
      tick: (e, P, dt, m) => { m.clk += dt; hammerRun(e, P, dt, m); if (hammerDone(m) && m.t > 0.1) m.dur = m.t; },
      abort: (e, P, m) => { for (const s of m.strikes || []) if (s.a && s.st !== "done") setArm(s.a, "retract"); } },
    fegen: { nm: N("Tentakelfegen", "Tentacle Sweep"), pre: 0.9, dur: 1.1, post: 0.55, sfx: "whip", w: 1,
      start: (e, P, m) => { const a = AR(); m.from = pcx(P) > (a.x0 + a.x1) / 2; sweepStart(e, P, m, m.from, PRE(e, 0.9)); },
      preTick: (e, P, dt, m) => sweepRun(e, dt, m),
      act: (e, P, m) => { if (e.phase >= 2) { m.dur = 2.35; later(0.95, () => { if (alive(e) && m.sweepArm) { m.sw = null; sweepStart(e, P, m, !m.from, 0.5, true); FX.text(pcx(P), P.y - 18, L(["Noch einmal!", "Again!"]), "#ffd27a", true); } }); } },
      tick: (e, P, dt, m) => sweepRun(e, dt, m),
      end: (e, P, m) => { if (m.sweepArm) setArm(m.sweepArm, "retract"); },
      abort: (e, P, m) => { if (m.sweepArm) setArm(m.sweepArm, "retract"); } },
    gitter: { nm: N("Tentakelgitter", "Tentacle Lattice"), pre: 0.3, dur: 1.4, post: 0.6, sfx: "splash", w: 1,
      start: (e, P, m) => { const warn = PV(e, 1.15, 1.05, 0.95); m.waves = PV(e, 1, 2, 3); m.gap = gitterWave(e, P, warn); m.next = warn + 0.45; m.k = 1; if (once(e, "gitterHint")) hint(P, "Die Lücke suchen!", "Find the gap!", "#7fd36a"); },
      preTick: () => {},
      tick: (e, P, dt, m) => { m.c = (m.c || 0) + dt; if (m.k < m.waves && m.c + PRE(e, 0.3) >= m.next) { m.k++; m.next += PV(e, 1.2, 1.15, 0.95); const ng = cl(m.gap + (R() < 0.5 ? -3 : 3), 0, 6); m.gap = gitterWave(e, P, PV(e, 1.0, 0.95, 0.8), ng === m.gap ? 6 - m.gap : ng); m.dur = m.t + PV(e, 1.4, 1.35, 1.2); } } },
    griff: { nm: N("Griff des Fürsten", "Grasp of the Prince"), pre: 1.0, dur: 1.8, post: 0.6, sfx: "chain", w: 0.8,
      cond: e => !e.dg.held,
      start: (e, P, m) => { const d = e.dg; m.arm = pickArm(e, pcx(P)); if (!m.arm) { m.dur = 0.01; return; } setArm(m.arm, "reach", pcx(P) - (pcx(P) < d.bx ? -50 : 50), d.FY - 120); d.grab = { x: pcx(P), y: pcy(P), t: 0, dur: PRE(e, 1.0), lock: false }; hint(P, "Ausweichen!", "Dodge!", "#ff8a5a"); },
      preTick: (e, P, dt, m) => { const g = e.dg.grab; if (!g || !m.arm) return; g.t += dt; if (g.t < g.dur * 0.68) { g.x = U.approach(g.x, pcx(P), dt * 260); g.y = U.approach(g.y, pcy(P), dt * 260); } else g.lock = true; m.arm.tx = lp(m.arm.tx, g.x - (g.x < e.dg.bx ? -40 : 40), 0.1); m.arm.ty = e.dg.FY - 110; },
      act: (e, P, m) => { const g = e.dg.grab; if (!m.arm || !g) return; setArm(m.arm, "reach", g.x, g.y); A.play("whip", { vol: 0.8, x: g.x }); m.chk = 0; },
      tick: (e, P, dt, m) => {
        const d = e.dg, g = d.grab; if (!m.arm || !g) return;
        if (m.chk != null && m.t > 0.1 && m.t < 0.3 && !d.held) {
          const t0 = tip(m.arm);
          if (P && !P.dead && Math.hypot(pcx(P) - t0.x, pcy(P) - t0.y) < 22 && P.iframe <= 0 && P.rollT <= 0) {
            m.chk = null; d.grab = null;
            Z.hurtPlayer(dmg(e, 0.45), { x: t0.x, kb: 0, unblockable: true });
            d.held = { arm: m.arm, t: 0, dur: 1.35, mash: 0, x0: t0.x, y0: t0.y, dir: pcx(P) < d.bx ? -1 : 1, tx: g.x };
            setArm(m.arm, "hold", t0.x, t0.y); m.dur = 1.8;
            A.play("slime", { vol: 0.9 }); A.play("monster", { vol: 0.6, rate: 0.8 });
            if (once(e, "mash")) say("Gepackt! Angriff hämmern, um dich zu befreien!", "Grabbed! Mash attack to break free!");
            hint(P, "Hämmern!", "Mash!", "#ff8a5a");
          }
        }
        if (m.chk != null && m.t >= 0.3) { m.chk = null; d.grab = null; setArm(m.arm, "stuck", U.clamp(tip(m.arm).x, AR().x0 + 16, AR().x1 - 16)); m.arm.sd = 1.1; m.arm.stuckDmg = 0; impactFx(e, m.arm.tx, false); m.dur = m.t + 0.2; }
        if (!d.held && m.arm.mode === "hold") m.dur = Math.min(m.dur, m.t + 0.1);
      },
      end: (e, P, m) => { e.dg.grab = null; },
      abort: (e, P, m) => { e.dg.grab = null; if (e.dg.held) release(e, true); if (m.arm) setArm(m.arm, "retract"); } },
    blick: { nm: N("Wahnsinnsblick", "Gaze of Madness"), pre: 1.4, dur: 0.35, post: 0.7, sfx: "dark", w: 0.85, danger: true,
      cond: e => e.dg.madT <= 0,
      start: (e, P, m) => { const d = e.dg; d.gaze = { t: 0, dur: PRE(e, 1.4) }; for (const h of d.heads) { h.stareT = 1; h.rearT = 0.3; } hint(P, "Wende dich ab!", "Look away!", "#d8a0ff"); A.play("magic", { vol: 0.6, rate: 0.6 }); },
      preTick: (e, P, dt) => { const g = e.dg.gaze; if (g) g.t += dt; },
      act: (e, P) => {
        const d = e.dg; d.gaze = null; for (const h of d.heads) { h.stareT = 0; h.rearT = 0; }
        FX.flashScreen(COL.mad, 0.25); A.play("dark", { vol: 0.8 });
        if (!P || P.dead || d.held) return;
        const dx = (d.heads[0].x + d.heads[1].x) / 2 - pcx(P), facing = Math.abs(dx) < 24 || P.face === Math.sign(dx);
        if (facing && P.rollT <= 0) {
          d.madT = d.madMax = PV(e, 3, 3.2, 3.6) + skulls() * 0.2; Z.hurtPlayer(dmg(e, 0.25), { x: pcx(P) + dx, kb: 0, unblockable: true, force: true });
          FX.text(pcx(P), P.y - 22, L(["Wahnsinn! Links ⇄ rechts", "Madness! Left ⇄ right"]), COL.mad, true); A.play("laugh", { vol: 0.5 });
        } else FX.text(pcx(P), P.y - 22, L(["Abgewandt!", "Looked away!"]), "#7fd36a", true);
        if (e.phase >= 1 && R() < 0.65) e.nextMv = "hammer";
      },
      abort: e => { e.dg.gaze = null; for (const h of e.dg.heads) h.stareT = 0; } },
    speien: { nm: N("Aameul speit Säure", "Aameul Spits Acid"), pre: 0.85, dur: 0.9, post: 0.6, sfx: "poison", w: 1,
      start: (e, P, m) => { const h = e.dg.heads[0]; h.rearT = 1; h.throatT = 1; h.jawT = 0.35; },
      act: (e, P, m) => { const h = e.dg.heads[0]; h.rearT = 0.2; h.jawT = 1; const n = PV(e, 3, 4, 5); spit(e, P, n, PV(e, 54, 50, 46)); m.dur = n * 0.12 + 0.3; if (e.phase >= 2 && R() < 0.5) later(0.5, () => { if (alive(e)) e.nextMv = e.nextMv || "kreischen"; }); },
      end: e => { const h = e.dg.heads[0]; h.rearT = 0; h.throatT = 0; h.jawT = 0.1; },
      abort: e => { const h = e.dg.heads[0]; h.rearT = 0; h.throatT = 0; h.jawT = 0.1; } },
    kreischen: { nm: N("Hathradiah kreischt", "Hathradiah Shrieks"), pre: 1.0, dur: 1.2, post: 0.6, sfx: "roar", w: 0.85,
      start: (e, P, m) => { const h = e.dg.heads[1]; h.rearT = 1; h.throatT = 1; h.jawT = 0.45; const mo = mouth(h, 22, 6); tele({ k: "ring", x: mo.x, y: mo.y, r: 34, dur: PRE(e, 1.0), col: COL.scream }); if (e.dg.seen.screamHint == null || e.dg.seen.screamHint < 2) { e.dg.seen.screamHint = (e.dg.seen.screamHint || 0) + 1; hint(P, "Durch den Ring rollen!", "Roll through the ring!", "#ff8a5a"); } },
      act: (e, P, m) => { const h = e.dg.heads[1]; h.rearT = 0; const n = PV(e, 1, 2, 3); scream(e, n); m.dur = n * 0.48 + 0.3; },
      end: e => { const h = e.dg.heads[1]; h.throatT = 0; h.jawT = 0.1; },
      abort: e => { const h = e.dg.heads[1]; h.throatT = 0; h.jawT = 0.1; h.rearT = 0; } },
    biss: { nm: N("Kopfbiss", "Head Strike"), pre: 0.35, dur: 2.4, post: 0.5, sfx: "monster", w: 1,
      cond: (e, P) => Math.abs(pcx(P) - e.dg.bx) < 230 && e.dg.heads.every(h => h.lungeT === 0),
      start: (e, P, m) => { const h = biteHead(e, P); m.h = h; m.x = biteX(e, P); h.rearT = 1; h.jawT = 0.6; },
      preTick: (e, P, dt, m) => { m.x = U.approach(m.x, biteX(e, P), dt * 240); },
      act: (e, P, m) => {
        const w1 = PV(e, 0.95, 0.85, 0.75), stay = PV(e, 1.5, 1.3, 1.1); bite(e, m.h, m.x, w1); m.dur = w1 + stay + 0.15;
        if (e.phase >= 1) { const o = e.dg.heads[1 - m.h.i], w2 = PV(e, 0.85, 0.8, 0.7); later(0.75, () => { if (alive(e) && o.lungeT === 0) bite(e, o, biteX(e, Z.player), w2); }); m.dur = Math.max(m.dur, 0.75 + w2 + stay + 0.15); }
      } },
    brut: { nm: N("Brut aus der Tiefe", "Brood of the Deep"), pre: 0.8, dur: 0.6, post: 0.6, sfx: "monster", w: 0.6,
      cond: e => minions(e) < 2,
      start: e => { for (const h of e.dg.heads) { h.jawT = 1; h.rearT = 0.6; } },
      act: (e, P) => {
        const a = AR(), d = e.dg;
        for (const h of d.heads) { h.jawT = 0.1; h.rearT = 0; }
        const spots = [a.x0 + 26, a.x1 - 26];
        spots.forEach((x, i) => later(i * 0.25, () => {
          if (!alive(e)) return;
          const m = Z.spawnEnemy("ertrunkener", x, d.FY - 2, { tier: e.tier }); if (m) { m.aware = true; m.master = e; m.spawnT = 0.6; }
          FX.burst(x, d.FY - 4, 18, { col: ["#1a2a20", COL.foam, "#3a5a4a"], sp: 160, ang: -Math.PI / 2, spread: 1.2, life: 0.7, size: 2, kind: "drop", g: 500 }); A.play("splash", { vol: 0.7, x });
        }));
        if (e.phase >= 2) later(0.5, () => { if (!alive(e)) return; const r = Z.spawnEnemy("rochen", d.bx + (R() < 0.5 ? -1 : 1) * 140, d.FY - 120, { tier: e.tier }); if (r) { r.aware = true; r.master = e; } });
      } },
    sog: { nm: N("Strudel des Abgrunds", "Maelstrom of the Abyss"), pre: 0.9, dur: 3.2, post: 0.8, sfx: "dark", w: 0.75, danger: true,
      start: (e, P) => { e.dg.whirlT = 1; hint(P, "Gegen den Sog anrennen!", "Run against the pull!", "#ff8a3a"); A.play("splash", { vol: 0.8, rate: 0.7 }); },
      act: (e, P, m) => { m.k = 0.2; },
      tick: (e, P, dt, m) => {
        const d = e.dg; if (!d.held) drift(P, d.bx, PV(e, 70, 80, 92), dt);
        m.k -= dt; if (m.k <= 0) { m.k = PV(e, 0.6, 0.55, 0.5); const s = R() < 0.5 ? -1 : 1; spout(e, U.clamp(d.bx + s * (46 + R() * 110), AR().x0 + 16, AR().x1 - 16), 0.65, 0.4, 0.9, 150); }
        if (!low() && R() < dt * 30) { const s = R() < 0.5 ? -1 : 1, x = d.bx + s * (100 + R() * 240); FX.p({ x, y: d.FY - 4 - R() * 40, vx: -s * 220, vy: 0, life: 0.5, size: 1.6, col: "#8a7aa0", kind: "spark", add: true, drag: 1 }); }
      },
      end: e => { e.dg.whirlT = e.phase >= 2 ? 0.35 : 0; },
      abort: e => { e.dg.whirlT = e.phase >= 2 ? 0.35 : 0; } },
    raserei: { nm: N("Raserei der Zwillingsköpfe", "Frenzy of the Twin Heads"), pre: 1.2, dur: 4.6, post: 1.5, sfx: "roar", w: 0.7, danger: true,
      cond: e => e.phaseT - (e.dg.rageT || -99) > 16,
      start: (e, P) => { const d = e.dg; d.rageT = e.phaseT; for (const h of d.heads) { h.rearT = 1; h.jawT = 1; h.shake = 1; } FX.flashScreen("#ff3a2a", 0.25); A.play("roar", { vol: 1, rate: 0.75 }); FX.addShake(8); },
      act: (e, P, m) => {
        const d = e.dg; for (const h of d.heads) { h.rearT = 0; h.jawT = 0.3; }
        m.clk = 0; hammerScript(e, m, 3, { gap: 0.42, track: 0.42, hitD: 0.42, stuck: 2.6 });
        later(1.7, () => { if (alive(e)) { const a = AR(); sweepStart(e, P, m, pcx(P) > (a.x0 + a.x1) / 2, 0.6); } });
        later(2.9, () => { if (alive(e)) gitterWave(e, P, 0.85); });
        later(3.5, () => { if (alive(e)) { const h = d.heads[0]; h.jawT = 1; spit(e, P, 3, 60); } });
      },
      tick: (e, P, dt, m) => { m.clk += dt; hammerRun(e, P, dt, m); sweepRun(e, dt, m); },
      end: (e, P, m) => { if (m.sweepArm && m.sweepArm.mode === "sweep") setArm(m.sweepArm, "retract"); },
      abort: (e, P, m) => { for (const s of m.strikes || []) if (s.a && s.st !== "done") setArm(s.a, "retract"); if (m.sweepArm) setArm(m.sweepArm, "retract"); } }
  };
  /* Namen für bossphasen.js bleiben aus (eigene Beschriftung oben im Bild): mv.nm statt mv.name */

  /* ======================= 5. PHASEN & ARENA ======================= */
  function waves(e) {
    const a = AR(), d = e.dg;
    for (const [x, dir] of [[a.x0 + 10, 1], [a.x1 - 10, -1]]) {
      tele({ k: "floor", x, y: d.FY, w: 40, dur: 0.9, col: "#b07a9a" });
      later(0.9, () => { if (alive(e)) Z.spawnProj("e_welle", x, d.FY - 6, dir, { dmg: dmg(e, 0.85), life: 2.4, speed: 200 }); });
    }
    A.play("splash", { vol: 0.6 });
  }
  function breakTiles(e, x0, x1, ty, hole) {
    const lv = Z.level, d = e.dg;
    for (let x = x0; x <= x1; x++) {
      lv.set(x, ty, 0); Z.dirtyTiles && Z.dirtyTiles(x, ty);
      FX.burst(x * T + 8, ty * T + 4, 8, { col: [Z.dustCol || "#8a7a70", "#4a4040", "#2a2428"], sp: 90, ang: Math.PI / 2, spread: 2, life: 0.9, size: 3, kind: "shard", g: 600 });
    }
    if (hole) { d.holes.push([x0 * T, (x1 + 1) * T]); safeSpot(e); }
    A.play("rock", { vol: 0.8 }); A.play("quake", { vol: 0.5 });
  }
  /* Rücksetzpunkt nach einem Sturz ins Wasser nie über einem Loch */
  function safeSpot(e) {
    const P = Z.player; if (!P || !P.lastSafe) return;
    const d = e.dg, cx = P.lastSafe.x + P.w / 2;
    for (const h of d.holes) if (cx > h[0] - 6 && cx < h[1] + 6) { const nx = cx < d.cx ? h[1] + 20 : h[0] - 20; P.lastSafe = { x: nx - P.w / 2, y: d.FY - P.h }; }
  }
  D.phases = [
    { at: 1, name: N("Fürst der Dämonen", "Prince of Demons"), moves: ["hammer", "fegen", "speien", "kreischen", "biss", "griff"] },
    { at: 0.7, name: N("Zwei Köpfe, ein Wahn", "Two Heads, One Madness"), quote: N("Aameul: „Er gehört MIR!“ – Hathradiah: „Schweig, Bruder. Er gehört UNS.“", "Aameul: \"He is MINE!\" – Hathradiah: \"Silence, brother. He is OURS.\""),
      aura: "#c86aff", tempo: 1.12, transDur: 2.9,
      moves: ["hammer", "fegen", "gitter", "speien", "kreischen", "biss", "griff", "blick", "brut"],
      enter: e => { const d = e.dg; d.floodT = 7; e.nextMv = "gitter"; FX.addShake(8); A.play("splash", { vol: 1, rate: 0.6 }); say("Der See steigt – Wellen rollen über die Insel.", "The lake rises – waves roll over the island."); },
      arena: (e, dt, P, s) => BP.every(s, "see", dt, 8.5, () => waves(e)) },
    { at: 0.35, name: N("Der Abgrund öffnet sich", "The Abyss Opens"), quote: N("Beide Köpfe zugleich: „WIR SIND DER SEE. WIR SIND DIE TIEFE.“", "Both heads at once: \"WE ARE THE LAKE. WE ARE THE DEEP.\""),
      aura: "#ff4a3a", tempo: 1.3, transDur: 3.1,
      moves: ["hammer", "fegen", "gitter", "speien", "kreischen", "biss", "griff", "blick", "sog", "raserei", "brut"],
      enter: e => {
        const d = e.dg, H = Z.level.H; d.floodT = 0; d.liftT = 9; d.whirlT = 0.35; e.nextMv = "sog";
        const c = Math.floor(Z.level.W / 2);
        later(0.3, () => breakTiles(e, c - 12, c - 10, H - 3, true));
        later(0.75, () => breakTiles(e, c + 9, c + 11, H - 3, true));
        later(1.1, () => breakTiles(e, c - 4, c + 3, 12, false));
        say("Die Insel bricht! Nicht ins schwarze Wasser fallen.", "The island breaks! Don't fall into the black water.");
      },
      arena: (e, dt, P, s) => BP.every(s, "see", dt, 10, () => waves(e)) }
  ];
  D.moves = MV;
  D.danger = ["blick", "sog", "raserei"];

  /* Phasenwechsel-Inszenierung (während e.trans): Kopf-Streit, gemeinsames Brüllen */
  function transAnim(e, dt) {
    const d = e.dg, tr = e.trans, k = tr.t / tr.dur;
    if (tr.k === 1) {
      d.quarrel = k < 0.85 ? Math.min(1, k * 5) : Math.max(0, (1 - k) / 0.15);
      if (!tr.s1 && tr.t > 0.2) { tr.s1 = 1; FX.text(d.heads[0].x, d.heads[0].y - 26, L(["„MEINER!“", "\"MINE!\""]), EYE[0], true); A.play("monster", { vol: 0.8, rate: 1.2 }); }
      if (!tr.s2 && tr.t > 0.9) { tr.s2 = 1; FX.text(d.heads[1].x, d.heads[1].y - 26, L(["„UNSER!“", "\"OURS!\""]), EYE[1], true); A.play("roar", { vol: 0.8, rate: 1.4 }); }
      if (!tr.s3 && tr.t > 1.6) { tr.s3 = 1; A.play("bite", { vol: 1 }); FX.burst((d.heads[0].x + d.heads[1].x) / 2, (d.heads[0].y + d.heads[1].y) / 2, 14, { col: [COL.ichor, "#2a1020"], sp: 120, life: 0.6, size: 2.4, kind: "drop", g: 400 }); FX.addShake(6); }
    } else {
      d.quarrel = 0;
      for (const h of d.heads) { h.jawT = k < 0.75 ? 1 : 0.2; h.rearT = k < 0.6 ? 0.8 : 0; h.shake = k < 0.7 ? 1 : 0; h.throatT = k < 0.7 ? 1 : 0; }
      if (!tr.s1 && tr.t > 0.85) { tr.s1 = 1; A.play("roar", { vol: 1, rate: 0.6 }); A.play("quake", { vol: 0.8 }); FX.addShake(12); }
    }
  }
  /* Hauptschleife */
  function update(e, dt, P) {
    const d = st(e);
    d.t += dt;
    if (!d.introSet) { d.introSet = true; e.intro = 4.0; e.idle = 0.6; d.introT = 0; A.play("splash", { vol: 1, rate: 0.5 }); A.play("quake", { vol: 0.6 }); }
    if (e.intro > 0) introTick(e, dt);
    else d.rise = 1;
    /* Phasenmaschine und Techniken (bossphasen.js) */
    try { phased(e, dt, P); } catch (err) { console.error("Demogorgon:", err); }
    if (e.dead) return;
    if (e.trans) transAnim(e, dt); else d.quarrel = Math.max(0, d.quarrel - dt * 3);
    d.rage = e.phase >= 2 ? 1 : e.phase >= 1 ? 0.5 : 0;
    e.tempoBonus = 1 + 0.03 * skulls(); /* Totenköpfe: kürzere Pausen (Vorwarnungen bleiben gleich lang) */
    d.lift = U.approach(d.lift, d.liftT, dt * 12);
    d.bob = Math.sin(d.t * 0.9) * 2.4;
    d.lean = U.approach(d.lean, P ? cl((pcx(P) - d.cx) / 300, -1, 1) : 0, dt * 0.8);
    d.flood = U.approach(d.flood, d.floodT, dt * 3);
    d.whirl = U.approach(d.whirl, d.whirlT, dt * 0.8);
    d.hungerTxt -= dt;
    if (d.madT > 0) d.madT -= dt;
    geo(e);
    for (const h of d.heads) updHead(e, h, dt, P);
    for (const a of d.arms) updArm(e, a, dt);
    ringTick(e, P, dt);
    for (const s of d.spouts) s.t += dt; d.spouts = d.spouts.filter(s => s.t < s.warn + s.life + 0.5);
    for (const g of d.globs) g.t += dt; d.globs = d.globs.filter(g => g.t < g.dur);
    for (const s of d.shadows) s.t += dt; d.shadows = d.shadows.filter(s => s.t < s.dur + 0.1);
    for (const r of d.ripples) r.t += dt; d.ripples = d.ripples.filter(r => r.t < r.life);
    if (d.grab && !(e.mv && e.mv.id === "griff")) d.grab = null;
    if (d.held && P) { if (P.dead) d.held = null; }
    if (d.holes.length) safeSpot(e);
    if (R() < dt * 1.3) d.ripples.push({ x: d.bx + (R() - 0.5) * 90, y: d.wl + 1, t: 0, life: 1.6, r: 40 + R() * 30 });
    /* Wasser rinnt vom Leib (nach dem Auftauchen stärker) */
    if (!low() && R() < dt * (e.intro > 0 ? 30 : 5)) { const x = d.bx + (R() - 0.5) * 150; FX.p({ x, y: d.sy - 4 + R() * 30, vx: (R() - 0.5) * 6, vy: 20, g: 520, life: 0.9, size: 1.5, col: "rgba(200,215,205,.8)", kind: "drop" }); }
    placeBox(e, P);
    /* Kamera: zur Mitte geneigt, damit der Fürst im Bild bleibt */
    const lk = Z.cam.lock;
    if (!lk || lk.dg) Z.cam.lock = e.intro > 0 ? { x: d.cx, y: 160, k: 0.85, dg: true } : { x: d.cx, y: 200, k: 0.45, dg: true };
  }
  function introTick(e, dt) {
    const d = e.dg; d.introT += dt;
    d.rise = cl((d.introT - 0.7) / 2.7, 0, 1);
    for (const h of d.heads) { h.jawT = d.introT > 2.9 && d.introT < 3.8 ? 1 : 0.1; h.rearT = d.introT > 2.9 && d.introT < 3.8 ? 0.7 : 0; }
    if (!low() && R() < dt * 40) FX.p({ x: d.cx + (R() - 0.5) * 220, y: d.wl + 2, vx: 0, vy: -20 - R() * 30, life: 0.6, size: 1.5 + R() * 2, col: "#c8d0c0", kind: "bubble" });
    if (d.introT > 0.7 && !d.deathFx.s1) { d.deathFx.s1 = 1; FX.burst(d.cx, d.wl, 40, { col: ["#1a2a20", COL.foam, "#5a7a64"], sp: 260, ang: -Math.PI / 2, spread: 1.2, life: 1.1, size: 2.2, kind: "drop", g: 420 }); A.play("splash", { vol: 1, rate: 0.45 }); FX.addShake(6); }
    if (d.introT > 2.9 && !d.deathFx.s2) { d.deathFx.s2 = 1; A.play("roar", { vol: 1, rate: 0.7 }); A.play("monster", { vol: 0.8, rate: 0.6, delay: 0.2 }); FX.addShake(10); FX.flashScreen("#3a2050", 0.2); }
    FX.addShake(2 + 3 * d.rise * (1 - d.rise));
  }
  /* Tod: brüllen, erschlaffen, versinken – und irgendwo unter dem See reißt ein Faden */
  function deathTick(e, dt) {
    const d = e.dg, t = e.deadT || 0;
    d.t += dt;
    if (d.held) release(e, true);
    d.madT = 0; d.gaze = null; d.grab = null; d.rings.length = 0; d.whirlT = 0; d.floodT = 0;
    for (const h of d.heads) { h.jawT = t < 1.6 ? 1 : 0.5; h.rearT = t < 1.4 ? 1 : 0; h.shake = t < 1.6 ? 1 : 0; h.stareT = 0; h.throatT = 0; h.lungeT = 0; }
    for (const a of d.arms) if (a.mode !== "dead" && t > 0.9) { a.mode = "dead"; a.busy = false; }
    d.flood = U.approach(d.flood, 0, dt * 3); d.whirl = U.approach(d.whirl, 0, dt);
    geo(e);
    for (const h of d.heads) updHead(e, h, dt, null);
    for (const a of d.arms) updArm(e, a, dt);
    for (const r of d.ripples) r.t += dt; d.ripples = d.ripples.filter(r => r.t < r.life);
    const fx = d.deathFx;
    if (t < 3.2 && R() < dt * 30) FX.p({ x: d.bx + (R() - 0.5) * 160, y: d.wl + 2, vx: 0, vy: -30 - R() * 40, life: 0.7, size: 1.5 + R() * 2.5, col: "#c8d0c0", kind: "bubble" });
    if (t > 1.6 && !fx.d1) { fx.d1 = 1; A.play("splash", { vol: 1, rate: 0.5 }); A.play("quake", { vol: 0.7 }); }
    if (t > 2.7 && !fx.d2) { fx.d2 = 1; FX.burst(d.bx, d.wl, 50, { col: ["#1a2a20", COL.foam, "#5a7a64"], sp: 280, ang: -Math.PI / 2, spread: 1.6, life: 1.2, size: 2.4, kind: "drop", g: 420 }); A.play("splash", { vol: 1, rate: 0.4 }); FX.addShake(9); for (let i = 0; i < 4; i++) d.ripples.push({ x: d.bx, y: d.wl + 1, t: -i * 0.25, life: 2.4, r: 180 + i * 40 }); }
    d.thread = cl((t - 2.0) / 1.0, 0, 1);
    if (t > 3.05 && !d.snapped) { d.snapped = true; A.play("parry", { vol: 1, rate: 0.45 }); A.play("whip", { vol: 0.9, rate: 0.6 }); FX.flashScreen("#ffe0a0", 0.3); FX.addShake(5); }
    if (t < 3.6) { const lk = Z.cam.lock; if (!lk || lk.dg) Z.cam.lock = { x: d.cx, y: 190, k: 0.55, dg: true }; }
    else if (Z.cam.lock && Z.cam.lock.dg) Z.cam.lock = null;
  }

  /* ======================= 6. ZEICHNEN ======================= */
  const draw = Z.draw;
  /* --- Sprites (einmal gemalt, dann nur noch gestempelt) --- */
  const SPR = {};
  function mkCv(w, h, res) { const cv = document.createElement("canvas"); cv.width = Math.ceil(w * res); cv.height = Math.ceil(h * res); const g = cv.getContext("2d"); g.scale(res, res); return [cv, g]; }
  const TOR = { w: 190, h: 150, ox: 95, oy: 136 };
  function torsoPath(g) {
    g.beginPath(); g.moveTo(-38, 16);
    g.bezierCurveTo(-42, -10, -44, -34, -54, -50); g.bezierCurveTo(-68, -58, -84, -66, -82, -80);
    g.bezierCurveTo(-80, -96, -56, -100, -36, -100); g.quadraticCurveTo(0, -110, 36, -100);
    g.bezierCurveTo(56, -100, 80, -96, 82, -80); g.bezierCurveTo(84, -66, 68, -58, 54, -50);
    g.bezierCurveTo(44, -34, 42, -10, 38, 16); g.closePath();
  }
  /* Fellmantel über Schultern und Nacken (Mandrill-Dämon) */
  function mantlePath(g) {
    g.beginPath(); g.moveTo(-88, -74);
    for (let k = 0; k <= 26; k++) { const q = k / 26, x = lp(-88, 88, q), base = -84 - Math.sin(q * Math.PI) * 26, j = k % 2 ? 0 : 7 + Math.sin(k * 1.7) * 3; g.lineTo(x, base - j); }
    g.lineTo(88, -74);
    for (let k = 26; k >= 0; k--) { const q = k / 26, x = lp(-80, 80, q), y = -70 - Math.sin(q * Math.PI) * 18 + (k % 2 ? 6 : 0); g.lineTo(x, y); }
    g.closePath();
  }
  function paintTorso(g, flash) {
    g.translate(TOR.ox, TOR.oy); g.lineJoin = "round"; g.lineCap = "round";
    const F = c => (flash ? "#fff6ea" : c);
    /* Rückenstacheln über dem Mantel */
    for (let i = -6; i <= 6; i++) {
      const x = i * 12, by = -100 + Math.abs(i) * 2.4, tx = x + i * 2.2, ty = -128 + Math.abs(i) * 3.4;
      g.fillStyle = F("#1a1219"); g.beginPath(); g.moveTo(x - 5, by); g.quadraticCurveTo(tx - 3, (by + ty) / 2, tx, ty); g.quadraticCurveTo(tx + 2, (by + ty) / 2 + 3, x + 5, by); g.closePath(); g.fill();
      if (!flash) { g.strokeStyle = COL.ink; g.lineWidth = 0.9; g.stroke(); g.strokeStyle = "rgba(220,225,215,.28)"; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x - 3, by - 1); g.quadraticCurveTo(tx - 2, (by + ty) / 2, tx, ty + 1); g.stroke(); }
    }
    torsoPath(g);
    if (flash) { g.fillStyle = "#fff6ea"; g.fill(); mantlePath(g); g.fill(); return; }
    const gr = g.createRadialGradient(-18, -70, 8, 0, -40, 120); gr.addColorStop(0, "#5e4a58"); gr.addColorStop(0.4, "#3a2b3e"); gr.addColorStop(1, "#130d16");
    g.fillStyle = gr; g.fill();
    g.save(); torsoPath(g); g.clip();
    /* Brustmuskeln mit Glanz */
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(s * 3, -92); g.bezierCurveTo(s * 30, -100, s * 60, -86, s * 58, -62); g.bezierCurveTo(s * 44, -48, s * 18, -50, s * 4, -56); g.closePath();
      const pg = g.createRadialGradient(s * 24 - 6, -80, 2, s * 28, -72, 34); pg.addColorStop(0, "#6a5462"); pg.addColorStop(1, "#33263a"); g.fillStyle = pg; g.fill();
      g.strokeStyle = "rgba(12,7,14,.85)"; g.lineWidth = 1.3; g.stroke();
      g.fillStyle = "rgba(235,238,230,.14)"; g.beginPath(); g.ellipse(s * 22 - 4, -82, 13, 5, s * 0.2, 0, TAU); g.fill();
      /* Rippenwülste */
      for (let r = 0; r < 4; r++) { const y = -44 + r * 9; g.strokeStyle = "rgba(10,6,12,.65)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(s * 20, y); g.quadraticCurveTo(s * 36, y - 6, s * (46 - r * 2), y + 2); g.stroke(); g.strokeStyle = "rgba(225,228,224,.16)"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(s * 21, y - 2); g.quadraticCurveTo(s * 36, y - 8, s * (45 - r * 2), y); g.stroke(); }
    }
    /* Bauchplatten (wie beim Krokodil), überlappend, mit Glanzkante */
    for (let r = 0; r < 8; r++) {
      const y = -50 + r * 8.4, w = 16 - r * 0.6;
      g.fillStyle = r % 2 ? "#54404e" : "#5c4654"; g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y - 4, w, y); g.lineTo(w - 1, y + 7.5); g.quadraticCurveTo(0, y + 4.5, -w + 1, y + 7.5); g.closePath(); g.fill();
      g.strokeStyle = "rgba(10,6,12,.8)"; g.lineWidth = 0.9; g.stroke();
      g.strokeStyle = "rgba(235,236,232,.3)"; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-w + 3, y + 0.5); g.quadraticCurveTo(0, y - 3, w - 3, y + 0.5); g.stroke();
    }
    /* feine Schuppen an den Flanken */
    g.fillStyle = "rgba(225,228,232,.12)";
    for (let k = 0; k < 70; k++) { const s = k % 2 ? 1 : -1, y = -46 + ((k * 37) % 60), x = s * (24 + ((k * 13) % 20)); g.beginPath(); g.arc(x, y, 1.6, Math.PI, 0); g.fill(); }
    /* Runenfurchen (leuchten im Leuchtdurchgang) */
    g.strokeStyle = "#0e080e"; g.lineWidth = 2.4; runePath(g); g.stroke();
    g.strokeStyle = "rgba(232,200,106,.3)"; g.lineWidth = 0.8; runePath(g); g.stroke();
    /* nasser Glanz unten */
    g.strokeStyle = "rgba(200,220,210,.18)"; g.lineWidth = 1.1;
    for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(i * 8 + 2, -6 - Math.abs(i) * 2); g.quadraticCurveTo(i * 8 + 4, 4, i * 8 + 1, 16); g.stroke(); }
    g.restore();
    /* Randlicht (silbrig) */
    g.strokeStyle = "rgba(220,228,220,.4)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-54, -50); g.bezierCurveTo(-46, -30, -42, -10, -40, 10); g.stroke();
    torsoPath(g); g.strokeStyle = COL.ink; g.lineWidth = 1.8; g.stroke();
    /* Fellmantel */
    mantlePath(g); const mg = g.createLinearGradient(0, -112, 0, -66); mg.addColorStop(0, "#2c2420"); mg.addColorStop(1, "#141012"); g.fillStyle = mg; g.fill();
    g.strokeStyle = COL.ink; g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = "rgba(120,100,80,.35)"; g.lineWidth = 0.8;
    for (let k = 0; k < 40; k++) { const q = k / 39, x = lp(-84, 84, q), y = -80 - Math.sin(q * Math.PI) * 20; g.beginPath(); g.moveTo(x, y + 6); g.lineTo(x + Math.sin(k) * 3, y - 6); g.stroke(); }
    /* Schulterdornen */
    for (const s of [-1, 1]) { g.fillStyle = "#cfc4b0"; g.beginPath(); g.moveTo(s * 64, -94); g.quadraticCurveTo(s * 80, -112, s * 92, -116); g.quadraticCurveTo(s * 84, -104, s * 76, -90); g.closePath(); g.fill(); g.strokeStyle = COL.ink; g.lineWidth = 0.9; g.stroke(); g.strokeStyle = "rgba(90,70,60,.8)"; g.lineWidth = 0.6; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(s * (66 + k * 5), -96 - k * 4); g.lineTo(s * (70 + k * 5), -92 - k * 4); g.stroke(); } }
  }
  function runePath(g) {
    g.beginPath(); g.moveTo(0, -84); g.lineTo(0, -30);
    g.moveTo(-10, -74); g.lineTo(0, -64); g.lineTo(10, -74);
    g.moveTo(-8, -48); g.lineTo(0, -40); g.lineTo(8, -48);
    g.moveTo(-17, -66); g.quadraticCurveTo(-27, -60, -19, -52); g.moveTo(17, -66); g.quadraticCurveTo(27, -60, 19, -52);
    g.moveTo(-6, -92); g.lineTo(0, -86); g.lineTo(6, -92);
  }
  const HD = { w: 70, h: 64, ox: 30, oy: 32, res: 3 };
  function paintHead(g, i, flash) {
    g.translate(HD.ox, HD.oy); g.lineJoin = "round"; g.lineCap = "round";
    const F = c => (flash ? "#fff6ea" : c), fur = i ? "#2c1416" : "#1c1a12", fur2 = i ? "#4a2220" : "#2e2e1c";
    /* Mähne */
    g.beginPath();
    const nS = i ? 18 : 15;
    for (let k = 0; k <= nS; k++) { const a = -Math.PI * 0.95 + (k / nS) * Math.PI * 1.55, r = (k % 2 ? 17 : 25 + (i ? 3 : 0)) + Math.sin(k * 2.3) * 2; const x = -6 + Math.cos(a) * r * 1.05, y = 0 + Math.sin(a) * r; k ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.lineTo(-2, 16); g.closePath(); g.fillStyle = F(fur); g.fill(); if (!flash) { g.strokeStyle = COL.ink; g.lineWidth = 1; g.stroke(); g.strokeStyle = F(fur2); g.lineWidth = 0.8; for (let k = 0; k < 9; k++) { const a = -2.6 + k * 0.45; g.beginPath(); g.moveTo(-6 + Math.cos(a) * 10, Math.sin(a) * 9); g.lineTo(-6 + Math.cos(a) * 20, Math.sin(a) * 19); g.stroke(); } }
    /* Hörner */
    if (i === 0) { /* Aameul: Widderhörner, nach hinten gerollt */
      g.strokeStyle = F("#bdb19a"); g.lineWidth = 4.2; g.beginPath(); g.moveTo(-4, -12); g.bezierCurveTo(-14, -26, -30, -22, -28, -10); g.quadraticCurveTo(-26, -2, -18, -6); g.stroke();
      if (!flash) { g.strokeStyle = "rgba(60,50,40,.8)"; g.lineWidth = 0.7; for (let k = 0; k < 6; k++) { const t = k / 6; g.beginPath(); g.arc(lp(-6, -26, t), lp(-16, -18, t) - Math.sin(t * Math.PI) * 6, 2.2, 0, Math.PI); g.stroke(); } }
    } else { /* Hathradiah: zwei gerade, gezackte Spieße */
      for (const [x0, y0, x1, y1] of [[-2, -13, -14, -34], [-8, -10, -26, -24]]) { g.fillStyle = F("#d0c4ae"); g.beginPath(); g.moveTo(x0 - 2.5, y0); g.lineTo(x1, y1); g.lineTo(x0 + 2.5, y0 + 1); g.closePath(); g.fill(); if (!flash) { g.strokeStyle = COL.ink; g.lineWidth = 0.7; g.stroke(); } }
    }
    /* Schädel */
    g.beginPath(); g.ellipse(-1, -3, 15, 12.5, -0.1, 0, TAU); g.fillStyle = F("#2e2228"); g.fill(); if (!flash) { g.strokeStyle = COL.ink; g.lineWidth = 1.1; g.stroke(); }
    /* Ohr */
    g.beginPath(); g.moveTo(-9, -10); g.lineTo(-15, -19); g.lineTo(-4, -13); g.closePath(); g.fillStyle = F("#3a2630"); g.fill(); if (!flash) { g.strokeStyle = COL.ink; g.lineWidth = 0.8; g.stroke(); }
    /* Schnauze (Mandrill): langer Rücken, Wangenwülste */
    g.beginPath(); g.moveTo(0, -9); g.quadraticCurveTo(14, -10, 24, -6); g.quadraticCurveTo(29, -1, 26, 6); g.lineTo(5, 9); g.quadraticCurveTo(-2, 4, 0, -9); g.closePath();
    g.fillStyle = F("#3c2430"); g.fill();
    if (!flash) {
      /* roter Nasenrücken */
      g.strokeStyle = "#a82436"; g.lineWidth = 3.6; g.beginPath(); g.moveTo(3, -8); g.quadraticCurveTo(15, -9, 25, -4); g.stroke();
      g.strokeStyle = "#e0606a"; g.lineWidth = 1; g.beginPath(); g.moveTo(5, -9); g.quadraticCurveTo(15, -10.2, 23, -6); g.stroke();
      /* violette Wülste */
      for (let k = 0; k < 4; k++) { g.strokeStyle = k % 2 ? "#5e2c6c" : "#764488"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(4 + k, -4 + k * 2.4); g.quadraticCurveTo(14, -3 + k * 2.2, 23 - k * 1.5, -1 + k * 1.8); g.stroke(); }
      g.strokeStyle = "rgba(230,200,240,.35)"; g.lineWidth = 0.6; g.beginPath(); g.moveTo(5, -3.5); g.quadraticCurveTo(14, -2.6, 22, -1); g.stroke();
      /* Nüstern */
      g.fillStyle = "#0a0608"; g.beginPath(); g.ellipse(26, 1, 1.6, 1.1, 0.3, 0, TAU); g.fill();
      g.strokeStyle = COL.ink; g.lineWidth = 1.1; g.beginPath(); g.moveTo(0, -9); g.quadraticCurveTo(14, -10, 24, -6); g.quadraticCurveTo(29, -1, 26, 6); g.lineTo(5, 9); g.stroke();
      /* Augenhöhle, Brauenwulst */
      g.fillStyle = "#060406"; g.beginPath(); g.ellipse(3, -6, 4.4, 3.2, 0.15, 0, TAU); g.fill();
      g.strokeStyle = "#140c12"; g.lineWidth = 3; g.beginPath(); g.moveTo(-4, -10); g.quadraticCurveTo(3, -13, 10, -9); g.stroke();
      g.strokeStyle = "rgba(220,225,215,.3)"; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-3, -12); g.quadraticCurveTo(3, -14.5, 9, -11); g.stroke();
      /* obere Reißzähne */
      g.fillStyle = "#efe6d0"; for (let k = 0; k < 5; k++) { const x = 9 + k * 3.4, l = k === 0 ? (i ? 7 : 5.5) : 2.4; g.beginPath(); g.moveTo(x - 1.2, 8); g.lineTo(x, 8 + l); g.lineTo(x + 1.2, 8); g.closePath(); g.fill(); }
      /* Bart */
      g.strokeStyle = F(fur2); g.lineWidth = 0.9; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-2 + k * 2, 8); g.lineTo(-5 + k * 2.4, 16 + k % 2 * 3); g.stroke(); }
    }
  }
  function sprites() {
    if (SPR.ok) return SPR;
    const res = 2;
    let [cv, g] = mkCv(TOR.w, TOR.h, res); paintTorso(g, false); SPR.torso = cv;
    [cv, g] = mkCv(TOR.w, TOR.h, res); paintTorso(g, true); SPR.torsoF = cv;
    SPR.head = []; SPR.headF = [];
    for (let i = 0; i < 2; i++) { [cv, g] = mkCv(HD.w, HD.h, HD.res); paintHead(g, i, false); SPR.head[i] = cv; [cv, g] = mkCv(HD.w, HD.h, HD.res); paintHead(g, i, true); SPR.headF[i] = cv; }
    [cv, g] = mkCv(12, 12, 4); g.translate(6, 6);
    g.fillStyle = COL.suck; g.beginPath(); g.ellipse(0, 0, 5.4, 4.6, 0, 0, TAU); g.fill(); g.strokeStyle = "rgba(40,10,20,.8)"; g.lineWidth = 0.8; g.stroke();
    g.fillStyle = COL.suck2; g.beginPath(); g.ellipse(0, 0.4, 2.6, 2.1, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(255,240,240,.75)"; g.beginPath(); g.ellipse(-1.8, -1.8, 1.4, 0.8, -0.5, 0, TAU); g.fill();
    SPR.suck = cv; SPR.ok = true; return SPR;
  }
  /* --- Tentakel --- */
  const TL = new Float32Array(64), TR = new Float32Array(64), NX = new Float32Array(32), NY = new Float32Array(32);
  function tentacle(c, p, n, w0, w1, flash, t, ph, lowQ, hurtK) {
    const ink = COL.ink;
    if (lowQ) { /* Handheld: drei Striche je Abschnitt (Umriss, Haut, heller Bauch) – gut lesbar, billig */
      c.lineCap = "round"; c.lineJoin = "round";
      for (let pass = 0; pass < 3; pass++) {
        if (pass === 2 && flash) break;
        c.strokeStyle = pass === 0 ? ink : flash ? "#fff6ea" : pass === 1 ? "#45334a" : "#9a6474";
        for (let i = 1; i < n; i += 2) {
          const j = Math.min(n - 1, i + 1), w = lp(w0, w1, Math.pow(i / (n - 1), 0.8));
          c.lineWidth = pass === 0 ? w + 2.4 : pass === 1 ? w : w * 0.32;
          const oy = pass === 2 ? w * 0.22 : 0;
          c.beginPath(); c.moveTo(p[(i - 1) * 2], p[(i - 1) * 2 + 1] + oy); c.lineTo(p[i * 2], p[i * 2 + 1] + oy); c.lineTo(p[j * 2], p[j * 2 + 1] + oy); c.stroke();
        }
      }
      return;
    }
    let sy = 0;
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
      let tx = p[b * 2] - p[a * 2], ty = p[b * 2 + 1] - p[a * 2 + 1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const nx = -ty, ny = tx, w = lp(w0, w1, Math.pow(i / (n - 1), 0.75)) / 2;
      NX[i] = nx; NY[i] = ny; sy += ny;
      TL[i * 2] = p[i * 2] + nx * w; TL[i * 2 + 1] = p[i * 2 + 1] + ny * w; TR[i * 2] = p[i * 2] - nx * w; TR[i * 2 + 1] = p[i * 2 + 1] - ny * w;
    }
    /* Haut */
    c.beginPath(); c.moveTo(TL[0], TL[1]);
    for (let i = 1; i < n; i++) c.lineTo(TL[i * 2], TL[i * 2 + 1]);
    for (let i = n - 1; i >= 0; i--) c.lineTo(TR[i * 2], TR[i * 2 + 1]);
    c.closePath(); c.fillStyle = flash ? "#fff6ea" : COL.skin; c.fill();
    c.lineJoin = "round"; c.strokeStyle = ink; c.lineWidth = 1.2; c.stroke();
    if (flash) return;
    /* Unterseite (heller) mit Saugnäpfen: die nach unten zeigende Seite */
    const down = sy >= 0, S = down ? TL : TR, sg = down ? 1 : -1;
    c.beginPath(); c.moveTo(p[0], p[1]);
    for (let i = 1; i < n; i++) c.lineTo(lp(p[i * 2], S[i * 2], 0.25), lp(p[i * 2 + 1], S[i * 2 + 1], 0.25));
    for (let i = n - 1; i >= 0; i--) c.lineTo(lp(p[i * 2], S[i * 2], 0.92), lp(p[i * 2 + 1], S[i * 2 + 1], 0.92));
    c.closePath(); c.fillStyle = hurtK > 0 ? "#8a4a5a" : COL.belly; c.fill();
    const sp = SPR.suck;
    for (let i = 2; i < n - 2; i += 1) {
      if ((i & 1) && i < n - 6) continue;
      const w = lp(w0, w1, Math.pow(i / (n - 1), 0.75)), r = Math.max(1.1, w * 0.27), x = lp(p[i * 2], S[i * 2], 0.6), y = lp(p[i * 2 + 1], S[i * 2 + 1], 0.6);
      c.drawImage(sp, x - r, y - r, r * 2, r * 2);
    }
    /* Glanz oben (silbrig) und wandernder Lichtpunkt */
    const G = down ? TR : TL;
    c.strokeStyle = COL.gloss; c.lineWidth = 1; c.beginPath();
    for (let i = 1; i < n - 3; i++) { const x = lp(p[i * 2], G[i * 2], 0.6), y = lp(p[i * 2 + 1], G[i * 2 + 1], 0.6); i > 1 ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
    const gi = 2 + (((t * 5 + ph * 3) % (n - 5)) | 0), gx = lp(p[gi * 2], G[gi * 2], 0.55), gy = lp(p[gi * 2 + 1], G[gi * 2 + 1], 0.55);
    c.fillStyle = "rgba(255,255,250,.75)"; c.beginPath(); c.ellipse(gx, gy, 1.6, 0.8, Math.atan2(-NX[gi], NY[gi]), 0, TAU); c.fill();
    /* Rückenkamm: kleine Dornen auf der Oberseite des dicken Teils */
    c.fillStyle = "#1a1219";
    for (let i = 1; i < n * 0.45; i += 2) { const w = lp(w0, w1, Math.pow(i / (n - 1), 0.75)) / 2, x = p[i * 2] - NX[i] * sg * w, y = p[i * 2 + 1] - NY[i] * sg * w; c.beginPath(); c.moveTo(x + NY[i] * 2, y - NX[i] * 2); c.lineTo(x - NX[i] * sg * 4, y - NY[i] * sg * 4); c.lineTo(x - NY[i] * 2, y + NX[i] * 2); c.closePath(); c.fill(); }
  }
  /* Wasser-Tentakel (Gitter, Sog): steigt senkrecht aus einer Gischtfontäne */
  const SP = new Float32Array(24);
  function spoutDraw(c, e, s, t, lowQ) {
    const d = e.dg, FY = d.FY;
    if (s.t < s.warn) {
      const k = s.t / s.warn;
      c.save(); c.globalAlpha = 0.5 + 0.4 * k; c.strokeStyle = "#c8a8e0"; c.lineWidth = 1;
      for (let i = 0; i < 2; i++) { const r = ((s.t * 18 + i * 7) % 14) + 2; c.beginPath(); c.ellipse(s.x, FY - 1, r, r * 0.25, 0, 0, TAU); c.stroke(); }
      c.restore();
      if (R() < 0.3 + k * 0.5) FX.p({ x: s.x + (R() - 0.5) * 16, y: FY - 2, vx: 0, vy: -30 - k * 60, life: 0.4, size: 1 + R() * 1.6, col: "#c8d0c0", kind: "bubble" });
      return;
    }
    const at = s.t - s.warn, k = at < 0.09 ? at / 0.09 : at > s.life ? Math.max(0, 1 - (at - s.life) / 0.35) : 1;
    if (k <= 0) return;
    const n = 12, H = s.h * sstep(k);
    for (let i = 0; i < n; i++) { const q = i / (n - 1); SP[i * 2] = s.x + Math.sin(t * 7 + s.ph - q * 3) * 7 * q + Math.sin(q * 2.2 + s.ph) * 5 * q; SP[i * 2 + 1] = FY + 2 - H * q; }
    tentacle(c, SP, n, 17, 3, false, t, s.ph, lowQ, 0);
    /* Gischt am Fuß */
    c.save(); c.globalAlpha = 0.85 * k; c.fillStyle = COL.water; c.beginPath(); c.ellipse(s.x, FY - 2, 16, 4, 0, 0, TAU); c.fill();
    c.fillStyle = COL.foam; c.globalAlpha = 0.6 * k; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(s.x - 12 + i * 6, FY - 4 - Math.abs(Math.sin(t * 9 + i)) * 3, 1.4, 0, TAU); c.fill(); }
    c.restore();
    if (at < 0.1 && !s.fx) { s.fx = true; FX.burst(s.x, FY - 4, lowQ ? 6 : 14, { col: ["#1a2a20", COL.foam, "#5a7a64"], sp: 200, ang: -Math.PI / 2, spread: 0.9, life: 0.6, size: 1.8, kind: "drop", g: 520 }); }
  }
  /* --- Hintergrund: der See, der Leib, die Köpfe (hinter Boden und Plattformen) --- */
  function lakeDraw(c, e, cam, t) {
    const d = e ? e.dg : null, FY = d ? d.FY : AR().floor, wl = FY - 14, lowQ = low();
    const x0 = Math.max(0, cam.x - 4), x1 = Math.min(W.lv.W * T, cam.x + cam.w + 4);
    const g = c.createLinearGradient(0, wl - 3, 0, FY + 6); g.addColorStop(0, COL.water2); g.addColorStop(0.35, "#0b110d"); g.addColorStop(1, COL.water);
    c.fillStyle = g; c.fillRect(x0, wl, x1 - x0, FY + 16 - wl);
    /* Oberfläche: silbrige Wellenkämme, violetter Schimmer */
    c.strokeStyle = "rgba(205,215,200,.38)"; c.lineWidth = 0.9; c.beginPath();
    for (let x = Math.floor(x0 / 6) * 6; x <= x1; x += 6) { const y = wl + Math.sin(x * 0.07 + t * 1.6) * 0.8 + Math.sin(x * 0.023 - t * 0.9) * 0.9; x === Math.floor(x0 / 6) * 6 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
    if (!lowQ) {
      c.strokeStyle = "rgba(150,110,180,.18)"; c.lineWidth = 0.8;
      for (let r = 1; r < 4; r++) { c.beginPath(); for (let x = Math.floor(x0 / 10) * 10; x <= x1; x += 10) { const y = wl + r * 3.4 + Math.sin(x * 0.05 + t * (1 + r * 0.3) + r) * 0.7; x === Math.floor(x0 / 10) * 10 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
    }
    if (!d) return;
    /* Strudel */
    if (d.whirl > 0.02) {
      c.save(); c.globalAlpha = Math.min(1, d.whirl) * 0.7; c.strokeStyle = "rgba(200,190,220,.55)"; c.lineWidth = 1;
      for (let i = 0; i < (lowQ ? 3 : 6); i++) { const a0 = t * 2.4 + i * TAU / 6; c.beginPath(); for (let k = 0; k < 18; k++) { const a = a0 + k * 0.35, r = 150 - k * 7.5; const x = d.bx + Math.cos(a) * r, y = wl + 6 + Math.sin(a) * r * 0.05; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
      c.restore();
    }
    /* Kreise auf dem Wasser */
    c.strokeStyle = "rgba(210,220,205,.4)";
    for (const r of d.ripples) { if (r.floor || r.t < 0) continue; const k = r.t / r.life; c.globalAlpha = (1 - k) * 0.6; c.lineWidth = 1; c.beginPath(); c.ellipse(r.x, r.y + 1, r.r * k + 4, (r.r * k + 4) * 0.08, 0, 0, TAU); c.stroke(); }
    c.globalAlpha = 1;
  }
  function headDraw(c, e, h, t) {
    const d = e.dg, S = SPR, fs = h.f >= 0 ? Math.max(0.6, h.f) : Math.min(-0.6, h.f), flash = (e.flash > 0 && e.dgPart && e.dgPart.hd === h) || h.hit > 0.6;
    const nb = neckBase(e, h), hb = mouth(h, -12, 8), lowQ = low();
    /* Hals: dicker, zottiger Schlauch */
    const mx = (nb.x + hb.x) / 2 + h.side * 8, my = Math.min(nb.y, hb.y) - 8 + sstep(h.lunge) * 30;
    c.lineCap = "round";
    c.strokeStyle = COL.ink; c.lineWidth = 21; c.beginPath(); c.moveTo(nb.x, nb.y); c.quadraticCurveTo(mx, my, hb.x, hb.y); c.stroke();
    c.strokeStyle = flash ? "#fff6ea" : h.i ? "#2a1618" : "#1e1c14"; c.lineWidth = 18.5; c.stroke();
    if (!lowQ && !flash) { c.strokeStyle = h.i ? "#4a2420" : "#30301e"; c.lineWidth = 1; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(nb.x + k * 3, nb.y); c.quadraticCurveTo(mx + k * 3, my, hb.x + k * 2, hb.y); c.stroke(); } }
    c.save(); c.translate(h.x, h.y); c.scale(fs, 1); c.rotate(h.ang);
    /* Maul innen + Unterkiefer (hinter dem Kopf-Sprite) */
    const ja = h.jaw * 0.8;
    if (h.jaw > 0.05) {
      c.fillStyle = "#2a060c"; c.beginPath(); c.moveTo(3, 7); c.lineTo(26, 5); c.lineTo(Math.cos(ja) * 22 + 3, Math.sin(ja) * 22 + 9); c.closePath(); c.fill();
      if (h.throat > 0.05) { const col = h.i ? "rgba(255,90,58," : "rgba(184,255,74,"; draw.glow(c, 12, 9 + ja * 6, 12 + 8 * h.throat, col + (0.55 * h.throat).toFixed(2) + ")", 1); }
    }
    c.save(); c.translate(3, 8); c.rotate(ja);
    c.fillStyle = flash ? "#fff6ea" : "#2c1c24"; c.beginPath(); c.moveTo(0, -1); c.lineTo(21, 0); c.quadraticCurveTo(22, 4, 18, 6); c.lineTo(2, 6); c.closePath(); c.fill();
    c.strokeStyle = COL.ink; c.lineWidth = 1; c.stroke();
    if (!flash) { c.fillStyle = "#efe6d0"; for (let k = 0; k < 5; k++) { const x = 5 + k * 3.4, l = k === 4 ? (h.i ? 6 : 4.5) : 2.2; c.beginPath(); c.moveTo(x - 1.1, 0); c.lineTo(x, -l); c.lineTo(x + 1.1, 0); c.closePath(); c.fill(); } }
    c.restore();
    c.drawImage(flash ? S.headF[h.i] : S.head[h.i], -HD.ox, -HD.oy, HD.w, HD.h);
    /* Geifer-Fäden bei offenem Maul */
    if (h.jaw > 0.4 && !lowQ) { c.strokeStyle = h.i ? "rgba(230,180,180,.55)" : "rgba(200,240,150,.55)"; c.lineWidth = 0.6; for (let k = 0; k < 2; k++) { const x = 10 + k * 7; c.beginPath(); c.moveTo(x, 8); c.quadraticCurveTo(x + 1, 8 + 10 * h.jaw, x - 1 + Math.cos(ja) * 2, Math.sin(ja) * (x + 1) + 9); c.stroke(); } }
    /* Auge (Glühen kommt im Leuchtdurchgang dazu) */
    const bl = h.blink > 0 ? 0.15 : 1;
    c.fillStyle = flash ? "#fff" : EYE[h.i]; c.beginPath(); c.ellipse(3.4, -6, 2.8, 1.9 * bl, 0.15, 0, TAU); c.fill();
    if (bl > 0.5) { c.fillStyle = "#0a0406"; c.beginPath(); c.ellipse(4, -6, h.stare > 0.3 ? 1.4 : 0.55, 1.6, 0, 0, TAU); c.fill(); }
    c.restore();
  }
  function bodyDraw(c, e, cam, t) {
    const d = e.dg, S = sprites(), lowQ = low(), flashT = e.flash > 0 && e.dgPart && e.dgPart.k === "torso";
    if (d.rise <= 0.001 && !e.dead) return;
    /* Arme (Oberarm von der Schulter bis zum Ansatz der Tentakel) */
    for (const s of [-1, 1]) {
      const sh = shoulder(e, s), w = wrist(e, s);
      c.lineCap = "round"; c.strokeStyle = COL.ink; c.lineWidth = 25; c.beginPath(); c.moveTo(sh.x, sh.y); c.quadraticCurveTo(sh.x + s * 26, sh.y + 4, w.x, w.y); c.stroke();
      c.strokeStyle = "#2e2232"; c.lineWidth = 22; c.stroke();
      if (!lowQ) { c.strokeStyle = "rgba(225,228,232,.22)"; c.lineWidth = 1; c.beginPath(); c.moveTo(sh.x + s * 4, sh.y - 9); c.quadraticCurveTo(sh.x + s * 28, sh.y - 6, w.x + s * 2, w.y - 10); c.stroke(); }
      /* Manschette aus kleinen Fühlern am Übergang */
      c.fillStyle = "#3a2a3c"; c.beginPath(); c.ellipse(w.x, w.y, 13, 11, s * 0.5, 0, TAU); c.fill(); c.strokeStyle = COL.ink; c.lineWidth = 1.2; c.stroke();
    }
    /* Rumpf (gecachtes Sprite) mit Atmen */
    const br = 1 + Math.sin(d.t * 1.6) * 0.012 + (e.trans ? 0.03 * Math.sin(d.t * 20) * (e.trans.t < 1 ? 1 : 0) : 0);
    c.save(); c.translate(d.bx, d.by); c.rotate(d.lean * 0.035); c.scale(1, br);
    c.drawImage(flashT ? S.torsoF : S.torso, -TOR.ox, -TOR.oy, TOR.w, TOR.h);
    c.restore();
    /* Köpfe: der hintere zuerst */
    const hs = d.heads.slice().sort((a, b) => b.lunge - a.lunge);
    for (const h of hs) headDraw(c, e, h, t);
    /* Licht in die Szene (Augen, Runen, Kehle) */
    if (Z.addLight && !lowQ) {
      for (const h of d.heads) { const m = mouth(h, 3, -6); Z.addLight(m.x, m.y, 30 + 20 * h.glow, EYE[h.i], 0.35 + 0.25 * h.glow); if (h.throat > 0.1) { const q = mouth(h, 14, 10); Z.addLight(q.x, q.y, 50, EYE[h.i], 0.4 * h.throat); } }
      Z.addLight(d.bx, d.by - 60, 70, COL.rune, 0.18 + 0.12 * d.rage);
    }
  }
  /* Wasserlinie vor dem Leib: Schaumkranz und Spiegelungen */
  function waterFront(c, e, t) {
    const d = e.dg, FY = d.FY, wl = d.wl, lowQ = low();
    const g = c.createLinearGradient(0, wl - 2, 0, FY + 6); g.addColorStop(0, "rgba(22,34,26,.96)"); g.addColorStop(0.4, "rgba(10,16,12,.98)"); g.addColorStop(1, COL.water);
    c.fillStyle = g; c.fillRect(d.bx - 150, wl, 300, FY + 16 - wl);
    c.strokeStyle = "rgba(205,215,200,.38)"; c.lineWidth = 0.9; c.beginPath();
    for (let x = d.bx - 150; x <= d.bx + 150; x += 6) { const y = wl + Math.sin(x * 0.07 + t * 1.6) * 0.8 + Math.sin(x * 0.023 - t * 0.9) * 0.9; x === d.bx - 150 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
    if (d.rise > 0.05 && d.by < FY + 30) {
      /* Schaum um die Hüfte */
      c.fillStyle = COL.foam;
      const n = lowQ ? 7 : 16;
      for (let i = 0; i < n; i++) { const q = i / (n - 1), x = d.bx - 46 + q * 92, y = wl - 0.5 + Math.sin(t * 3 + i * 1.3) * 0.9; c.globalAlpha = 0.45 + 0.3 * Math.sin(t * 2 + i); c.beginPath(); c.ellipse(x, y, 4 + Math.sin(i * 2.1) * 1.5, 1.4, 0, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
      /* Spiegelung der Augen */
      if (!lowQ) for (const h of d.heads) { const m = mouth(h, 3, -6); c.globalAlpha = 0.16 + 0.12 * h.glow; c.fillStyle = EYE[h.i]; for (let k = 0; k < 3; k++) c.fillRect(m.x - 3 + Math.sin(t * 4 + k) * 1.5, wl + 2 + k * 3, 6 - k, 0.8); c.globalAlpha = 1; }
    }
  }
  /* --- Vordergrund: Schatten, Flut, Tentakel, Geschosse, Ringe, Anzeigen --- */
  function frontDraw(c, e, t) {
    const d = e.dg, FY = d.FY, P = Z.player, lowQ = low();
    sprites();
    /* Flut auf der Insel */
    if (d.flood > 0.2) {
      const a = AR(), fh = d.flood;
      c.fillStyle = "rgba(10,18,14,.72)"; c.fillRect(a.x0 - 32, FY - fh, a.x1 - a.x0 + 64, fh);
      c.strokeStyle = "rgba(205,215,200,.42)"; c.lineWidth = 0.8; c.beginPath();
      for (let x = a.x0 - 32; x <= a.x1 + 32; x += 8) { const y = FY - fh + Math.sin(x * 0.09 + t * 2.4) * 0.8; x === a.x0 - 32 ? c.moveTo(x, y) : c.lineTo(x, y); }
      c.stroke();
      if (P && Math.abs(P.vx) > 40 && P.onGround && R() < 0.35) FX.p({ x: pcx(P) - Math.sign(P.vx) * 4, y: FY - fh, vx: -P.vx * 0.2 + (R() - 0.5) * 30, vy: -60 - R() * 40, g: 500, life: 0.4, size: 1.4, col: "#c8d0c0", kind: "drop" });
    }
    /* Hammer-Schatten: wächst und wird dunkler bis zum Einschlag */
    for (const s of d.shadows) {
      const k = cl(s.t / s.dur, 0, 1), w = 16 + 30 * k, late = k > 0.7, pulse = 0.5 + 0.5 * Math.sin(s.t * (late ? 40 : 20));
      c.save(); c.globalAlpha = 0.25 + 0.5 * k; c.fillStyle = "#000"; c.beginPath(); c.ellipse(s.x, FY - 1, w, 3 + 2 * k, 0, 0, TAU); c.fill();
      c.globalAlpha = s.lock ? 0.55 + 0.45 * pulse : 0.35; c.strokeStyle = s.lock ? "#ff3a2a" : "#ff9a5a"; c.lineWidth = s.lock ? 1.6 : 1; c.beginPath(); c.ellipse(s.x, FY - 1, w + 2, 4 + 2 * k, 0, 0, TAU); c.stroke();
      if (s.lock) { c.globalAlpha = 0.6 * pulse; c.fillStyle = "#ff3a2a"; c.beginPath(); c.moveTo(s.x - 4, FY - 26 - 3 * pulse); c.lineTo(s.x + 4, FY - 26 - 3 * pulse); c.lineTo(s.x, FY - 19 - 3 * pulse); c.fill(); }
      c.restore();
    }
    /* Wasser-Tentakel */
    for (const s of d.spouts) spoutDraw(c, e, s, t, lowQ);
    /* Löcher in der Insel: schwarzes Wasser mit Schaumrand */
    for (const h of d.holes) {
      const y = FY + 9;
      c.fillStyle = COL.water; c.fillRect(h[0], y, h[1] - h[0], 22);
      c.strokeStyle = "rgba(205,215,200,.45)"; c.lineWidth = 0.8; c.beginPath();
      for (let x = h[0]; x <= h[1]; x += 4) { const yy = y + Math.sin(x * 0.3 + t * 3) * 0.8; x === h[0] ? c.moveTo(x, yy) : c.lineTo(x, yy); }
      c.stroke();
      if (!lowQ && R() < 0.08) FX.p({ x: h[0] + R() * (h[1] - h[0]), y: y + 2, vx: 0, vy: -14, life: 0.6, size: 1.2 + R(), col: "#c8d0c0", kind: "bubble" });
    }
    /* Arm-Tentakel (beim Tod: versinken hinter der Inselkante, verblassen) */
    const flashA = e.flash > 0 && e.dgPart && e.dgPart.k === "arm" ? e.dgPart.a : null;
    const dk = e.dead ? cl(((e.deadT || 0) - 1.2) / 2, 0, 1) : 0;
    if (dk >= 1) return;
    if (e.dead) { c.save(); c.globalAlpha = 1 - dk; c.beginPath(); c.rect(Z.cam.x - 50, Z.cam.y - 50, Z.cam.w + 100, FY - Z.cam.y + 50); c.clip(); }
    for (const a of d.arms) {
      tentacle(c, a.p, a.n, a.wound > 0 ? 11 : 15, a.mode === "stuck" || a.mode === "hold" ? 5 : 2.2, a === flashA || a.hit > 0.7, t, a.ph, lowQ, a.wound > 0 ? 1 : 0);
      if (a.mode === "stuck") { /* Risse im Stein, wo er steckt */
        c.strokeStyle = "rgba(10,6,10,.8)"; c.lineWidth = 1; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(a.tx, FY); c.lineTo(a.tx + k * 7, FY + 4 + Math.abs(k)); c.stroke(); }
      }
    }
    if (e.dead) { c.restore(); return; }
    /* Säureklumpen */
    for (const g of d.globs) {
      const k = g.t / g.dur, x = lp(g.x0, g.x1, k), y = lp(g.y0, g.y1, k) - Math.sin(k * Math.PI) * g.arc;
      c.fillStyle = "#6a9a2a"; c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fill(); c.fillStyle = COL.acid; c.beginPath(); c.arc(x - 1, y - 1, 2.6, 0, TAU); c.fill();
      if (!lowQ && R() < 0.6) FX.p({ x, y, vx: 0, vy: 10, g: 200, life: 0.35, size: 1.4, col: "#b8ff4a", kind: "drop" });
    }
    /* Griff-Ziel */
    if (d.grab) {
      const g = d.grab, k = cl(g.t / g.dur, 0, 1), pulse = 0.5 + 0.5 * Math.sin(t * (g.lock ? 36 : 16));
      c.save(); c.strokeStyle = g.lock ? "#ff3a2a" : "#ff9a5a"; c.globalAlpha = 0.5 + 0.4 * pulse; c.lineWidth = 1.4 + k;
      c.beginPath(); c.arc(g.x, g.y, 22 - 8 * k, 0, TAU); c.stroke();
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t * 2; c.beginPath(); c.moveTo(g.x + Math.cos(a) * (26 - 8 * k), g.y + Math.sin(a) * (26 - 8 * k)); c.lineTo(g.x + Math.cos(a) * (18 - 6 * k), g.y + Math.sin(a) * (18 - 6 * k)); c.stroke(); }
      c.restore();
    }
  }
  /* --- Leuchtdurchgang (nach dem Licht): Augen, Runen, Ringe, Schwachpunkte, Wahnsinn, Beschriftung --- */
  function glowDraw(c, e, cam, t) {
    const d = e.dg, lowQ = low(), P = Z.player;
    for (const h of d.heads) {
      const m = mouth(h, 3.4, -6);
      draw.glow(c, m.x, m.y, 8 + 10 * h.glow, EYE[h.i], 0.55 + 0.35 * h.glow);
      if (h.stare > 0.1) { c.save(); c.strokeStyle = COL.mad; c.globalAlpha = h.stare * 0.8; c.lineWidth = 1; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(m.x, m.y, 4 + k * 4 + ((t * 18) % 4), t * 4 + k, t * 4 + k + 4); c.stroke(); } c.restore(); }
    }
    /* Runen auf der Brust: pulsieren, in Phase III rot */
    if (d.rise > 0.3 && !lowQ) {
      c.save(); c.translate(d.bx, d.by); c.rotate(d.lean * 0.035);
      c.globalCompositeOperation = "lighter"; c.globalAlpha = (0.35 + 0.3 * Math.sin(t * 2.2) + 0.25 * d.rage) * (e.dead ? Math.max(0, 1 - (e.deadT || 0) / 2) : 1);
      c.strokeStyle = e.phase >= 2 ? "#ff6a4a" : COL.rune; c.lineWidth = 1.2; runePath(c); c.stroke(); c.restore();
    }
    /* Lärmringe */
    for (const r of d.rings) {
      const k = r.r / r.max;
      c.save(); c.globalAlpha = 0.75 * (1 - k * 0.6); c.strokeStyle = COL.scream; c.lineWidth = 5; c.beginPath(); c.arc(r.x, r.y, r.r, 0, TAU); c.stroke();
      c.globalAlpha = 0.9 * (1 - k * 0.5); c.strokeStyle = "#fff2d0"; c.lineWidth = 1.2; c.beginPath(); c.arc(r.x, r.y, r.r, 0, TAU); c.stroke();
      if (!lowQ) { c.globalAlpha = 0.25 * (1 - k); c.strokeStyle = COL.scream; c.lineWidth = 1; c.beginPath(); c.arc(r.x, r.y, r.r - 9, 0, TAU); c.stroke(); }
      c.restore();
    }
    /* Säure leuchtet */
    for (const g of d.globs) { const k = g.t / g.dur, x = lp(g.x0, g.x1, k), y = lp(g.y0, g.y1, k) - Math.sin(k * Math.PI) * g.arc; draw.glow(c, x, y, 10, "rgba(184,255,74,.7)", 0.8); }
    /* Schwachpunkte pulsieren (stecken gebliebene Tentakel, Köpfe unten) */
    const pulse = 0.5 + 0.5 * Math.sin(t * 9);
    for (const a of d.arms) if (a.mode === "stuck") { const tp = tip(a); draw.glow(c, tp.x - a.side * 8, d.FY - 8, 20 + 6 * pulse, "rgba(255,210,122,.55)", 0.55 + 0.3 * pulse); c.save(); c.strokeStyle = "#ffd27a"; c.globalAlpha = 0.45 + 0.4 * pulse; c.lineWidth = 1; c.beginPath(); c.ellipse(tp.x - a.side * 8, d.FY - 10, 22, 13, 0, 0, TAU); c.stroke(); c.restore(); }
    for (const h of d.heads) if (h.lunge > 0.7) { c.save(); c.strokeStyle = "#ffd27a"; c.globalAlpha = 0.45 + 0.4 * pulse; c.lineWidth = 1; c.beginPath(); c.ellipse(h.x, h.y, 24, 20, 0, 0, TAU); c.stroke(); c.restore(); }
    /* Blick-Anzeige über dem Spieler: offenes rotes Auge = du siehst ihn an, geschlossenes grünes = abgewandt */
    if (d.gaze && P && !P.dead) {
      const dx = (d.heads[0].x + d.heads[1].x) / 2 - pcx(P), facing = Math.abs(dx) < 24 || P.face === Math.sign(dx);
      const x = pcx(P), y = P.y - 14 - Math.sin(t * 6) * 1.2, k = cl(d.gaze.t / d.gaze.dur, 0, 1);
      c.save(); c.lineWidth = 1.3;
      if (facing) { c.strokeStyle = "#ff4a6a"; c.fillStyle = "rgba(255,74,106,.25)"; c.beginPath(); c.moveTo(x - 7, y); c.quadraticCurveTo(x, y - 6, x + 7, y); c.quadraticCurveTo(x, y + 6, x - 7, y); c.fill(); c.stroke(); c.fillStyle = "#ff4a6a"; c.beginPath(); c.arc(x, y, 2 + k, 0, TAU); c.fill(); }
      else { c.strokeStyle = "#7fd36a"; c.beginPath(); c.moveTo(x - 7, y); c.quadraticCurveTo(x, y + 5, x + 7, y); c.stroke(); for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(x + i * 4, y + 3); c.lineTo(x + i * 5, y + 6); c.stroke(); } }
      c.restore();
    }
    /* Todesfaden: spannt sich aus der Tiefe – und reißt */
    if (e.dead && d.thread > 0) {
      const x = d.bx + 8, y0 = d.FY + 4, y1 = cam.y - 8, k = d.thread;
      c.save(); c.globalCompositeOperation = "lighter";
      if (!d.snapped) { c.strokeStyle = "rgba(255,210,140,.85)"; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y0); for (let i = 1; i <= 12; i++) { const q = i / 12, yy = lp(y0, lp(y0, y1, k), q); c.lineTo(x + Math.sin(q * 9 + t * 30) * (1 - k) * 2, yy); } c.stroke(); draw.glow(c, x, lp(y0, y1, k), 10, "rgba(255,210,140,.8)", 0.8); }
      else { const s = Math.min(1, ((e.deadT || 0) - 3.05) * 2), mid = (y0 + y1) / 2; c.globalAlpha = Math.max(0, 1 - s); c.strokeStyle = "rgba(255,210,140,.9)"; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y1); c.quadraticCurveTo(x + 20 * s, mid - 40 * s, x + 30 * s, mid - 60 * s); c.moveTo(x, y0); c.quadraticCurveTo(x - 16 * s, mid + 50 * s, x - 10 * s, mid + 80 * s); c.stroke(); }
      c.restore();
    }
  }
  function labelDraw(c, e, cam, t) {
    const m = e.mv, mv = m && D.moves[m.id];
    if (!mv || !mv.nm || m.stage === "post" || e.trans) return;
    const u = m.stage === "pre" ? Math.min(1, m.t / 0.12) : 1, d = e.dg;
    c.save(); c.globalAlpha = u; c.font = "italic 800 8px 'Alegreya Sans',sans-serif"; c.textAlign = "center";
    const s = L(mv.nm), w = c.measureText(s).width + 12, x = U.clamp(d.bx, cam.x + w / 2 + 6, cam.x + cam.w - w / 2 - 6), y = cam.y + 66;
    c.fillStyle = "rgba(14,8,16,.84)"; c.fillRect(x - w / 2, y - 8, w, 11);
    c.fillStyle = e.aura || "#c86aff"; c.fillRect(x - w / 2, y + 2, w, 1);
    c.fillStyle = mv.danger ? "#ff7a6a" : "#ffd8a0"; c.fillText(s, x, y);
    if (mv.danger && m.stage === "pre") { c.font = "900 12px 'Alegreya Sans',sans-serif"; c.fillStyle = "#ff3a2a"; c.strokeStyle = "rgba(0,0,0,.8)"; c.lineWidth = 2.5; const yy = y - 12 - Math.sin(m.t * 20) * 1.5; c.strokeText("!!", x, yy); c.fillText("!!", x, yy); }
    c.restore();
  }
  /* Bildschirmeffekte: Wahnsinn (gespiegelt), Blick-Vorwarnung */
  function screenDraw(c, e, W2, H2, t) {
    const d = e.dg, P = Z.player;
    const g = d.gaze ? cl(d.gaze.t / d.gaze.dur, 0, 1) : 0, mk = d.madT > 0 ? Math.min(1, d.madT / 0.6) : 0, k = Math.max(g * 0.8, mk);
    if (k <= 0.01) return;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const vg = c.createRadialGradient(W2 / 2, H2 / 2, Math.min(W2, H2) * (0.42 - 0.06 * k), W2 / 2, H2 / 2, Math.max(W2, H2) * 0.7);
    vg.addColorStop(0, "rgba(120,40,160,0)"); vg.addColorStop(1, "rgba(120,40,160," + (0.45 * k).toFixed(3) + ")");
    c.fillStyle = vg; c.fillRect(0, 0, W2, H2);
    if (mk > 0 && !low()) {
      c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.06 * mk; c.fillStyle = COL.mad;
      for (let i = 0; i < 5; i++) { const y = ((t * 40 + i * H2 / 5) % H2); c.fillRect(0, y + Math.sin(t * 3 + i) * 6, W2, 3); }
    }
    c.restore();
    if (mk > 0 && P && !P.dead) {
      /* „⇄“ über dem Kopf mit ablaufendem Balken */
      const S = Z.gfx.scale, x = (pcx(P) - Z.cam.x) * S, y = (P.y - 18 - Z.cam.y) * S;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.font = "900 " + Math.round(9 * S) + "px 'Alegreya Sans',sans-serif"; c.textAlign = "center";
      c.fillStyle = COL.mad; c.strokeStyle = "rgba(0,0,0,.8)"; c.lineWidth = 3; c.strokeText("⇄", x, y); c.fillText("⇄", x, y);
      const bw = 18 * S, q = cl(d.madT / d.madMax, 0, 1); c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(x - bw / 2, y + 3 * S, bw, 2 * S); c.fillStyle = COL.mad; c.fillRect(x - bw / 2, y + 3 * S, bw * q, 2 * S);
      c.restore();
    }
  }

  /* ======================= 7. VERKABELUNG ======================= */
  D.update = update;
  D.move = e => { e.vx = 0; };
  D.init = e => { st(e); placeBox(e, Z.player); };
  D.noBlock = true;
  /* Hintergrund: hinter den Kacheln */
  const bt0 = Z.drawBehindTiles;
  Z.drawBehindTiles = function (c, cam, t) {
    if (bt0) bt0.apply(this, arguments);
    if (!inArena()) return;
    const e = Z.enemies.find(isDemo);
    try {
      lakeDraw(c, e && e.dg ? e : null, cam, t);
      if (!e || !e.dg) return;
      const d = e.dg;
      if (e.dead) { const now = t, dt = d.lastDraw == null ? 0 : cl(now - d.lastDraw, 0, 0.05); d.lastDraw = now; deathTick(e, dt); }
      else d.lastDraw = null;
      sprites(); bodyDraw(c, e, cam, t); waterFront(c, e, t);
    } catch (err) { if (!Z._dgErr) { Z._dgErr = 1; console.error("Demogorgon-Bild:", err); } }
  };
  /* Vordergrund (bild.js ruft drawEnemy für Demogorgon in einem eigenen Durchgang) */
  const de0 = Z.drawEnemy;
  Z.drawEnemy = function (c, e, time) {
    if (isDemo(e) && e.dg) { try { frontDraw(c, e, time); } catch (err) { if (!Z._dgErr2) { Z._dgErr2 = 1; console.error("Demogorgon-Bild:", err); } } return; }
    return de0.apply(this, arguments);
  };
  /* Leuchten, Beschriftung und Bildschirmeffekte nach dem Licht */
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W2, H2, t) {
    if (al0) al0.apply(this, arguments);
    if (!inArena()) return;
    const e = Z.enemies.find(isDemo); if (!e || !e.dg) return;
    try {
      const S = Z.gfx.scale, ox = Math.round((-cam.x + FX.shakeX) * S) / S, oy = Math.round((-cam.y + FX.shakeY) * S) / S;
      c.save(); c.setTransform(S, 0, 0, S, ox * S, oy * S);
      glowDraw(c, e, cam, t); if (!e.dead) labelDraw(c, e, cam, t);
      c.restore();
      if (!e.dead) screenDraw(c, e, W2, H2, t);
    } catch (err) { if (!Z._dgErr3) { Z._dgErr3 = 1; console.error("Demogorgon-Leuchten:", err); } }
  };
  /* Treffer: Schuppenpanzer am Rumpf, Schwachpunkte an Tentakeln und Köpfen */
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, v, o) {
    if (!isDemo(e) || !e.dg || e.dead || (o && o.src === "cap")) return hit0.apply(this, arguments);
    const d = e.dg, q = e.dgPart, P = Z.player; o = o || {};
    let m = q ? q.mul : 1; if (o.dot) m = Math.min(1, m);
    /* Heilung innerhalb des Treffers (Gegenwehr, Vampirisch …) gesammelt messen, damit der Seelenhunger sie einmal anteilig frisst */
    const hp0 = e.hp, php0 = P ? P.hp : 0; inHit++;
    let r; try { r = hit0.call(this, e, v * m, o); } finally { inHit--; }
    const done = hp0 - e.hp;
    if (P && !P.dead && P.hp > php0 && !(e.intro > 0)) { const gain = P.hp - php0, stolen = gain * (skulls() >= 2 ? 0.6 : 0.5); P.hp -= stolen; try { hunger(e, stolen, P); } catch (_) {} }
    if (done > 0 && q) {
      if (q.k === "arm") { q.a.hit = 1; q.a.stuckDmg += done; if (q.a.stuckDmg > e.hpMax * 0.035 && q.a.mode === "stuck") rip(e, q.a); }
      else if (q.k === "head") { q.hd.hit = 1; q.hd.shake = 0.6; }
      else if (!o.dot) { d.torsoHit = 1; if (P && once(e, "armor")) FX.text(pcx(P), P.y - 24, L(["Schuppenpanzer! Tentakel und Köpfe sind verwundbarer.", "Scale armour! Tentacles and heads are softer."]), "#d8c8b0", true); }
    }
    return r;
  };
  /* Seelenhunger: Heilung (außer Tränken) wird zum Teil gefressen */
  let inHit = 0;
  const heal0 = Z.healPlayer;
  Z.healPlayer = function (n) {
    const b = live(), P = Z.player;
    if (b && P && !inHit && !(b.intro > 0) && typeof n === "number" && isFinite(n) && n > 0) {
      const share = skulls() >= 2 ? 0.6 : 0.5, stolen = n * share, r = heal0.call(this, n - stolen);
      try { hunger(b, stolen, P); } catch (_) {}
      return r;
    }
    return heal0.apply(this, arguments);
  };
  /* Griff (Eingaben gesperrt, Hämmern befreit) und Wahnsinn (links/rechts vertauscht) */
  const swapLR = o => { if (!o) return; const l = o.left; o.left = o.right; o.right = l; };
  const up0 = Z.updatePlayer;
  Z.updatePlayer = function (P, dt) {
    const b = live(), d = b && b.dg;
    if (d && d.held && P && !P.dead) {
      const inp = Z.input, sv = {};
      holdTick(b, P, dt || 1 / 60);
      for (const k of HOLD_KEYS) { sv[k] = inp.held[k]; inp.held[k] = false; inp.pressed[k] = false; }
      try { return up0.apply(this, arguments); }
      finally { for (const k of HOLD_KEYS) inp.held[k] = sv[k]; if (d.held) { const t0 = tip(d.held.arm); P.x = t0.x - P.w / 2; P.y = t0.y - P.h * 0.55; P.vx = 0; P.vy = 0; } }
    }
    if (d && d.madT > 0 && P && !P.dead) {
      const inp = Z.input, ax = inp.axis;
      swapLR(inp.held); swapLR(inp.pressed); swapLR(inp.released); inp.axis = -(ax || 0);
      try { return up0.apply(this, arguments); }
      finally { swapLR(inp.held); swapLR(inp.pressed); swapLR(inp.released); inp.axis = ax; }
    }
    return up0.apply(this, arguments);
  };
  /* Prüfstand/Galerie: Technik erzwingen */
  Z.demoForce = id => { const b = live(); if (!b || !MV[id]) return false; if (b.mv) { const mv = MV[b.mv.id]; if (mv && mv.abort) try { mv.abort(b, Z.player, b.mv); } catch (_) {} } b.mv = null; b.idle = 0; b.nextMv = id; return true; };
})();
