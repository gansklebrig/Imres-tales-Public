/* Ezekiel – The Destroyer · Parcours: Abgründe, bröckelnde Stege, Fähren und Fallen
   Kacheln: 9 Abgrund (tödliche Tiefe), 10 bröckelnder Steg, 11 Fährstrecke (unsichtbar).
   Fallen aus den Raumvorlagen (lv.traps): p Pendel, f Flammendüse, k Stachelfalle, r Steinschlag, j Sprungfeder, z Säge, < > Pfeilfalle, m Fähre. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v);
  const { limb, circ, poly, ell, glow } = Z.draw;
  let traps = [], movers = [], crumbles = [], voidTops = [];
  Z.traps = traps; Z.parcoursMovers = movers;

  const tier = () => (Z.run ? Z.run.tier || 0 : 0);
  const dmgFrac = f => { const P = Z.player; return Math.round((P ? P.hpMax : 100) * f * (1 + tier() * 0.12)); };
  function ceilingAbove(tx, ty) { for (let y = ty; y > ty - 14; y--) if (W.solidT(W.tile(tx, y - 1))) return y * T; return ty * T; }
  function floorBelow(tx, ty) { for (let y = ty; y < ty + 16; y++) if (W.solidT(W.tile(tx, y + 1)) || W.isPlat(tx, y + 1)) return (y + 1) * T; return (ty + 8) * T; }

  /* ======================= AUFBAU ======================= */
  Z.setupParcours = function (lv) {
    traps.length = 0; movers.length = 0; crumbles.length = 0; voidTops.length = 0;
    if (!lv) return;
    const list = (lv.traps || []).slice(), used = new Set(), key = m => m.x + "," + m.y;
    const R = Z.Rng ? Z.Rng((lv.seed || 1) ^ 0x51ab) : Math.random;
    const rnd = () => (typeof R === "function" ? R() : Math.random());
    /* Läufe gleicher Zeichen in einer Zeile zusammenfassen (Säge, Fähre) */
    const run = (m, ch) => { let x0 = m.x, x1 = m.x; while (list.some(o => o.t === ch && o.y === m.y && o.x === x0 - 1)) x0--; while (list.some(o => o.t === ch && o.y === m.y && o.x === x1 + 1)) x1++; for (let x = x0; x <= x1; x++) used.add(x + "," + m.y); return [x0, x1]; };
    for (const m of list) {
      if (used.has(key(m))) continue;
      const cx = m.x * T + 8;
      switch (m.t) {
        case "p": { const ay = ceilingAbove(m.x, m.y), fl = floorBelow(m.x, m.y); const len = U.clamp(fl - ay - 17, 56, 210); traps.push({ k: "pendel", ax: cx, ay, len, amp: 0.95 + rnd() * 0.2, per: 2.2 + rnd() * 0.7, ph: rnd() * 6.28, bx: cx, by: ay + len, cd: new WeakMap() }); break; }
        case "f": traps.push({ k: "flamme", x: cx, y: floorBelow(m.x, m.y), cyc: 3, ph: rnd() * 3, cd: new WeakMap() }); break;
        case "k": traps.push({ k: "stachel", x: cx, y: floorBelow(m.x, m.y), cyc: 2.4, ph: rnd() * 2.4, up: 0, cd: new WeakMap() }); break;
        case "r": traps.push({ k: "stein", x: cx, ay: ceilingAbove(m.x, m.y), y: 0, vy: 0, st: "hang", t: 0, grow: 1, cd: new WeakMap() }); break;
        case "j": traps.push({ k: "feder", x: cx, y: floorBelow(m.x, m.y), sq: 0 }); break;
        case "<": case ">": traps.push({ k: "pfeil", x: m.x * T + (m.t === ">" ? 2 : 14), y: m.y * T + 8, dir: m.t === ">" ? 1 : -1, t: rnd() * 2.2, per: 2.2 }); break;
        case "z": { const [x0, x1] = run(m, "z"); traps.push({ k: "saege", x0: x0 * T + 10, x1: (x1 + 1) * T - 10, x: x0 * T + 10, y: floorBelow(m.x, m.y) - 3, dir: 1, sp: 95 + rnd() * 30, rot: 0, cd: new WeakMap() }); break; }
        case "m": { const [x0, x1] = run(m, "m"); movers.push({ x0: x0 * T, x1: (x1 + 1) * T, w: 48, y: m.y * T, x: x0 * T + rnd() * ((x1 - x0 + 1) * T - 48), dir: 1, sp: 62, pause: 0, dx: 0 }); break; }
      }
    }
    /* bröckelnde Stege: zusammenhängende Läufe; Abgrundkanten für Nebel */
    for (let y = 0; y < lv.H; y++) for (let x = 0; x < lv.W; x++) {
      const v = lv.get(x, y);
      if (v === 10 && lv.get(x - 1, y) !== 10) { let x1 = x; while (lv.get(x1 + 1, y) === 10) x1++; crumbles.push({ x0: x, x1, y, st: "ok", t: 0 }); }
      if (v === 9 && lv.get(x, y - 1) !== 9) voidTops.push([x, y]);
    }
  };
  const load0 = Z.loadArea;
  Z.loadArea = function () { const r = load0.apply(this, arguments); try { Z.setupParcours(Z.level); } catch (e) { console.error(e); } return r; };

  /* ======================= TREFFER ======================= */
  function hitP(tr, frac, x, o) {
    const P = Z.player; if (!P || P.dead) return;
    Z.hurtPlayer(dmgFrac(frac), Object.assign({ x, kb: 200, kbUp: 220, parryable: false, trap: true }, o || {}));
  }
  function hitE(tr, e, dmg, o) {
    if (tr.cd.get(e) > Z.time0()) return;
    tr.cd.set(e, Z.time0() + 0.6);
    Z.hitEnemy(e, dmg, Object.assign({ src: "trap", kb: 160, kbUp: 160 }, o || {}));
  }
  let clock = 0; Z.time0 = () => clock;
  const rectP = P => ({ x: P.x, y: P.y, w: P.w, h: P.h });
  const circRect = (cx, cy, r, b) => { const nx = U.clamp(cx, b.x, b.x + b.w), ny = U.clamp(cy, b.y, b.y + b.h); return (cx - nx) * (cx - nx) + (cy - ny) * (cy - ny) < r * r; };

  /* ======================= UPDATE ======================= */
  Z.updateParcours = function (dt) {
    clock += dt;
    const P = Z.player; if (!Z.level) return;
    const near = (x, y, d) => P && Math.abs(P.x - x) < (d || 420) && Math.abs(P.y - y) < 300;
    for (const tr of traps) {
      switch (tr.k) {
        case "pendel": {
          const a = Math.sin(clock * 6.283 / tr.per + tr.ph) * tr.amp;
          const ox = tr.bx; tr.bx = tr.ax + Math.sin(a) * tr.len; tr.by = tr.ay + Math.cos(a) * tr.len; tr.v = Math.abs(tr.bx - ox) / Math.max(dt, 1e-4);
          if (near(tr.ax, tr.ay) && Math.abs(a) < 0.15 && !tr.swoosh) { tr.swoosh = true; A.play("swingHeavy", { x: tr.bx, y: tr.by, vol: 0.35, rate: 0.7 }); } else if (Math.abs(a) > 0.3) tr.swoosh = false;
          if (P && circRect(tr.bx, tr.by, 11, rectP(P))) hitP(tr, 0.14, tr.bx);
          for (const e of Z.enemies) if (!e.dead && !e.def.boss && circRect(tr.bx, tr.by, 11, e)) hitE(tr, e, 40);
          break;
        }
        case "flamme": {
          const t = (clock + tr.ph) % tr.cyc; tr.state = t < 0.7 ? "warn" : t < 1.8 ? "fire" : "off";
          if (tr.state === "warn" && Math.random() < dt * 30 && near(tr.x, tr.y)) FX.p({ x: tr.x + (Math.random() - 0.5) * 6, y: tr.y - 2, vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 30, life: 0.3, size: 1.4, col: "#ffb040", kind: "spark", add: true });
          if (tr.state === "fire") {
            if (!tr.on) { tr.on = true; if (near(tr.x, tr.y)) A.play("fireBig", { x: tr.x, vol: 0.35, rate: 1.2 }); }
            const r = { x: tr.x - 7, y: tr.y - 58, w: 14, h: 58 };
            if (P && U.overlap(r, P)) { hitP(tr, 0.12, tr.x, { kb: 120 }); Z.addStatus(P, "burn", 1.5, true); }
            for (const e of Z.enemies) if (!e.dead && U.overlap(r, e)) { hitE(tr, e, 30); Z.addStatus(e, "burn", 2); }
            if (Math.random() < dt * 70) FX.p({ x: tr.x + (Math.random() - 0.5) * 8, y: tr.y - 4, vx: (Math.random() - 0.5) * 30, vy: -170 - Math.random() * 80, life: 0.35, size: 3, col: Math.random() < 0.5 ? "#ffd27a" : "#ff6a1a", kind: "glow", add: true });
          } else tr.on = false;
          break;
        }
        case "stachel": {
          const t = (clock + tr.ph) % tr.cyc, want = t < 0.95 ? 1 : t > tr.cyc - 0.35 ? 0.25 : 0;
          if (want === 1 && tr.up < 1 && near(tr.x, tr.y, 260)) A.play("chain", { x: tr.x, vol: 0.3, rate: 1.6, gap: 0.05 });
          tr.up = U.approach(tr.up, want, dt * (want === 1 ? 18 : 6));
          if (tr.up > 0.8) {
            const r = { x: tr.x - 7, y: tr.y - 10, w: 14, h: 10 };
            if (P && U.overlap(r, P)) hitP(tr, 0.12, tr.x, { kb: 60, kbUp: 300 });
            for (const e of Z.enemies) if (!e.dead && !e.def.fly && U.overlap(r, e)) hitE(tr, e, 25);
          }
          break;
        }
        case "stein": {
          tr.t += dt;
          if (tr.st === "hang") {
            tr.grow = Math.min(1, tr.grow + dt * 0.8);
            if (tr.grow >= 1 && P && Math.abs(P.x + P.w / 2 - tr.x) < 26 && P.y > tr.ay && P.y - tr.ay < 230 && W.los(tr.x, tr.ay + 6, P.x + P.w / 2, P.y)) { tr.st = "shake"; tr.t = 0; A.play("rock", { x: tr.x, vol: 0.4, rate: 1.4 }); }
          } else if (tr.st === "shake") {
            if (Math.random() < dt * 20) FX.p({ x: tr.x + (Math.random() - 0.5) * 8, y: tr.ay + 2, vx: 0, vy: 30, g: 400, life: 0.5, size: 1.4, col: Z.dustCol || "#8a7a70", kind: "shard" });
            if (tr.t > 0.42) { tr.st = "fall"; tr.y = tr.ay + 6; tr.vy = 0; }
          } else if (tr.st === "fall") {
            tr.vy = Math.min(tr.vy + 1300 * dt, 700); tr.y += tr.vy * dt;
            const b = { x: tr.x - 6, y: tr.y - 6, w: 12, h: 16 };
            if (P && U.overlap(b, P)) { hitP(tr, 0.15, tr.x, { kb: 120, kbUp: 100 }); tr.st = "gone"; tr.t = 0; shatter(tr); }
            for (const e of Z.enemies) if (!e.dead && U.overlap(b, e)) { hitE(tr, e, 50, { eff: { stun: 1 } }); tr.st = "gone"; tr.t = 0; shatter(tr); break; }
            if (tr.st === "fall" && W.solidAt(tr.x, tr.y + 10)) { tr.st = "gone"; tr.t = 0; shatter(tr); }
          } else if (tr.st === "gone" && tr.t > 5) { tr.st = "hang"; tr.grow = 0; }
          break;
        }
        case "feder": {
          tr.sq = Math.max(0, tr.sq - dt);
          const r = { x: tr.x - 8, y: tr.y - 7, w: 16, h: 8 };
          if (P && P.vy >= 0 && U.overlap(r, P) && !P.climbing) { P.vy = -680; P.onGround = false; P.airJumps = 1; P.cut = true; P.coyote = 0; tr.sq = 0.25; A.play("jump", { vol: 0.6, rate: 0.6 }); FX.burst(tr.x, tr.y - 6, 8, { col: ["#ffd27a", "#fff"], sp: 80, ang: -Math.PI / 2, spread: 1, life: 0.3, size: 1.6, kind: "spark", add: true }); Z.input.rumble(0.2, 40); }
          for (const e of Z.enemies) if (!e.dead && !e.def.boss && !e.def.fly && e.vy >= 0 && U.overlap(r, e)) { e.vy = -560; e.onGround = false; tr.sq = 0.25; }
          break;
        }
        case "pfeil": {
          if (!near(tr.x, tr.y, 360)) break;
          tr.t += dt;
          tr.warn = tr.t > tr.per - 0.4;
          if (tr.t >= tr.per) { tr.t = 0; Z.spawnProj("e_bolzen", tr.x + tr.dir * 4, tr.y, tr.dir, { dmg: dmgFrac(0.1), vy: 0, g: 0, speed: 330 }); A.play("bow", { x: tr.x, vol: 0.4, rate: 1.3 }); }
          break;
        }
        case "saege": {
          tr.x += tr.dir * tr.sp * dt; if (tr.x > tr.x1) { tr.x = tr.x1; tr.dir = -1; } if (tr.x < tr.x0) { tr.x = tr.x0; tr.dir = 1; }
          tr.rot += dt * 22 * tr.dir;
          if (Math.random() < dt * 25 && near(tr.x, tr.y)) FX.p({ x: tr.x - tr.dir * 8, y: tr.y + 2, vx: -tr.dir * (60 + Math.random() * 80), vy: -60 - Math.random() * 60, g: 500, life: 0.3, size: 1.2, col: "#ffd27a", kind: "spark", add: true });
          if (near(tr.x, tr.y, 200) && Math.random() < dt * 3) A.play("hitMetal", { x: tr.x, vol: 0.12, rate: 2, gap: 0.2 });
          if (P && circRect(tr.x, tr.y, 10, rectP(P))) hitP(tr, 0.13, tr.x, { kb: 220, kbUp: 260 });
          for (const e of Z.enemies) if (!e.dead && !e.def.fly && circRect(tr.x, tr.y, 10, e)) { hitE(tr, e, 35, { eff: { bleed: 2 } }); }
          break;
        }
      }
    }
    /* Fähren: bewegen und Spieler mitnehmen */
    for (const m of movers) {
      const ox = m.x;
      if (m.pause > 0) m.pause -= dt;
      else { m.x += m.dir * m.sp * dt; if (m.x + m.w > m.x1) { m.x = m.x1 - m.w; m.dir = -1; m.pause = 0.55; } if (m.x < m.x0) { m.x = m.x0; m.dir = 1; m.pause = 0.55; } }
      m.dx = m.x - ox;
      if (!P || P.dead) continue;
      const over = P.x + P.w > m.x + 1 && P.x < m.x + m.w - 1;
      if (P.onMover === m) {
        if (over && P.vy >= 0 && Math.abs(P.y + P.h - m.y) < 3 && !P.grapple) { P.x += m.dx; P.y = m.y - P.h; P.vy = 0; P.onGround = true; }
        else P.onMover = null;
      } else if (over && P.vy >= 0 && P.y + P.h >= m.y - 1 && P.y + P.h - P.vy * dt <= m.y + 4 && !P.dropT && !P.grapple) {
        const land = P.vy > 120; P.y = m.y - P.h; if (land) { P.anim.land = Math.min(1, P.vy / 500); A.play("stepWood", { vol: 0.5 }); } P.vy = 0; P.onGround = true; P.onMover = m; P.cut = false;
      }
    }
    /* bröckelnde Stege */
    for (const c of crumbles) {
      c.t += dt;
      if (c.st === "ok" && P && P.onGround && !P.onMover) {
        const fy = Math.floor((P.y + P.h + 1) / T);
        if (fy === c.y && P.x + P.w > c.x0 * T && P.x < (c.x1 + 1) * T) { c.st = "shake"; c.t = 0; A.play("rock", { x: P.x, vol: 0.35, rate: 1.6 }); }
      } else if (c.st === "shake" && c.t > 0.5) {
        c.st = "gone"; c.t = 0;
        for (let x = c.x0; x <= c.x1; x++) { Z.level.set(x, c.y, 0); FX.burst(x * T + 8, c.y * T + 3, 6, { col: [Z.dustCol || "#8a7a70", "#5a4a40"], sp: 50, ang: Math.PI / 2, spread: 1.6, life: 0.7, size: 2.6, kind: "shard", g: 500 }); }
        A.play("rock", { x: c.x0 * T, vol: 0.55 });
      } else if (c.st === "gone" && c.t > 3.6) {
        const r = { x: c.x0 * T, y: c.y * T - 2, w: (c.x1 - c.x0 + 1) * T, h: 8 };
        if (!P || !U.overlap(r, P)) { c.st = "ok"; c.t = 0; for (let x = c.x0; x <= c.x1; x++) Z.level.set(x, c.y, 10); }
      }
    }
    /* Gegner, die in den Abgrund stürzen */
    for (const e of Z.enemies) if (!e.dead && !e.def.fly && W.tile(Math.floor((e.x + e.w / 2) / T), Math.floor((e.y + e.h * 0.4) / T)) === 9) { e.hp = 0; Z.killEnemy && Z.killEnemy(e, { src: "fall" }); }
    /* aufsteigender Nebel aus der Tiefe */
    const cam = Z.cam, q = Z.gq && Z.gq.part != null ? Z.gq.part : 1;
    for (const [x, y] of voidTops) {
      const px = x * T, py = y * T; if (px < cam.x - 16 || px > cam.x + cam.w || py < cam.y - 16 || py > cam.y + cam.h + 16) continue;
      if (Math.random() < dt * 1.6 * q) FX.p({ x: px + Math.random() * T, y: py + 10, vx: (Math.random() - 0.5) * 6, vy: -8 - Math.random() * 10, life: 2.2, size: 7, col: "rgba(40,30,36,.35)", kind: "smoke", drag: 1, keep: false });
    }
  };
  function shatter(tr) { FX.burst(tr.x, tr.y + 6, 12, { col: [Z.dustCol || "#8a7a70", "#6a5a50"], sp: 120, ang: -Math.PI / 2, spread: 2.6, life: 0.5, size: 2.4, kind: "shard", g: 600 }); A.play("rock", { x: tr.x, vol: 0.6 }); FX.addShake(2); }

  /* ======================= LICHT ======================= */
  Z.lightExtra = hole => {
    for (const tr of traps) {
      if (tr.k === "flamme" && tr.state === "fire") hole(tr.x, tr.y - 30, 80, 0.9);
      else if (tr.k === "flamme" && tr.state === "warn") hole(tr.x, tr.y - 4, 26, 0.5);
      else if (tr.k === "saege") hole(tr.x, tr.y, 30, 0.45);
      else if (tr.k === "pfeil" && tr.warn) hole(tr.x, tr.y, 22, 0.6);
    }
  };

  /* ======================= ZEICHNEN ======================= */
  Z.drawParcours = function (c, t) {
    const cam = Z.cam, vis = (x, y, m) => x > cam.x - (m || 60) && x < cam.x + cam.w + (m || 60) && y > cam.y - (m || 60) - 120 && y < cam.y + cam.h + (m || 60);
    const B = Z.biome || {}, plat = B.plat || "#6a5040";
    /* bröckelnde Stege */
    for (const cr of crumbles) {
      if (cr.st === "gone") { if (cr.t > 3.0) { c.save(); c.globalAlpha = (cr.t - 3) / 0.6 * 0.4; for (let x = cr.x0; x <= cr.x1; x++) { c.fillStyle = plat; c.fillRect(x * T, cr.y * T, T, 5); } c.restore(); } continue; }
      const px0 = cr.x0 * T, py = cr.y * T; if (!vis(px0, py, 80)) continue;
      const sh = cr.st === "shake" ? (Math.random() - 0.5) * 2.2 * (0.5 + cr.t) : 0;
      for (let x = cr.x0; x <= cr.x1; x++) {
        const px = x * T + sh, h = (x * 7 + cr.y * 3) % 5;
        c.fillStyle = "#2a2024"; c.fillRect(px, py + 1, T, 6);
        c.fillStyle = "#7a6a5e"; c.fillRect(px + 0.5, py, T - 1, 5);
        c.fillStyle = "#958476"; c.fillRect(px + 0.5, py, T - 1, 1.5);
        c.strokeStyle = "rgba(20,14,16,.8)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(px + 3 + h, py); c.lineTo(px + 6 + h, py + 3); c.lineTo(px + 4 + h, py + 5); c.moveTo(px + 11, py + 1); c.lineTo(px + 13 - h * 0.4, py + 5); c.stroke();
        if (x === cr.x0 || x === cr.x1) { c.fillStyle = "#4a3e38"; c.fillRect(x === cr.x0 ? px : px + T - 3, py + 5, 3, 4); }
      }
      if (cr.st === "shake" && Math.random() < 0.4) FX.p({ x: px0 + Math.random() * (cr.x1 - cr.x0 + 1) * T, y: py + 5, vx: 0, vy: 20, g: 400, life: 0.5, size: 1.2, col: "#6a5a50", kind: "shard" });
    }
    /* Fähren */
    for (const m of movers) {
      if (!vis(m.x, m.y)) continue;
      const x = Math.round(m.x * 4) / 4, y = m.y;
      c.fillStyle = "#1e1618"; c.fillRect(x + 2, y + 3, m.w - 4, 6);
      c.fillStyle = shade(plat, -0.2); c.fillRect(x, y, m.w, 6);
      c.fillStyle = plat; c.fillRect(x, y, m.w, 3);
      c.fillStyle = shade(plat, 0.25); c.fillRect(x, y, m.w, 1);
      for (let i = 1; i < 3; i++) { c.fillStyle = shade(plat, -0.45); c.fillRect(x + i * 16, y, 1, 5); }
      c.fillStyle = "#3a3034"; c.fillRect(x - 1, y + 1, 3, 6); c.fillRect(x + m.w - 2, y + 1, 3, 6);
      /* Glutrunen unten: zeigen die Fahrtrichtung */
      c.save(); c.globalCompositeOperation = "lighter"; const k = 0.5 + 0.5 * Math.sin(t * 4);
      glow(c, x + m.w / 2 + m.dir * 10, y + 8, 6 + k * 2, "rgba(255,150,60,.5)"); c.restore();
      c.fillStyle = "#ffb060"; c.fillRect(x + m.w / 2 + m.dir * 10 - 1, y + 7, 2, 2);
    }
    for (const tr of traps) {
      switch (tr.k) {
        case "pendel": {
          if (!vis(tr.ax, tr.ay + tr.len / 2, 160)) break;
          c.strokeStyle = "#3a3236"; c.lineWidth = 2; c.beginPath(); c.moveTo(tr.ax, tr.ay); c.lineTo(tr.bx, tr.by); c.stroke();
          c.strokeStyle = "#6a6266"; c.lineWidth = 0.8; c.setLineDash([2, 2]); c.beginPath(); c.moveTo(tr.ax, tr.ay); c.lineTo(tr.bx, tr.by); c.stroke(); c.setLineDash([]);
          circ(c, tr.ax, tr.ay + 2, 3, "#2a2226"); circ(c, tr.ax, tr.ay + 2, 1.4, "#8a8084");
          const ang = Math.atan2(tr.by - tr.ay, tr.bx - tr.ax);
          /* Bewegungsunschärfe */
          if (tr.v > 160) { c.save(); c.globalAlpha = Math.min(0.35, tr.v / 1600); c.strokeStyle = "#e8e0e0"; c.lineWidth = 10; c.beginPath(); c.arc(tr.ax, tr.ay, tr.len, ang - 0.12, ang + 0.12); c.stroke(); c.restore(); }
          c.save(); c.translate(tr.bx, tr.by); c.rotate(ang - Math.PI / 2);
          c.fillStyle = "#4a4448"; c.fillRect(-2, -6, 4, 6);
          c.fillStyle = "#b8b0b4"; c.beginPath(); c.moveTo(-12, -2); c.quadraticCurveTo(0, 16, 12, -2); c.lineTo(8, -4); c.quadraticCurveTo(0, 8, -8, -4); c.closePath(); c.fill();
          c.fillStyle = "#f0ece8"; c.beginPath(); c.moveTo(-11, 0); c.quadraticCurveTo(0, 15, 11, 0); c.quadraticCurveTo(0, 13, -11, 0); c.fill();
          c.fillStyle = "rgba(140,20,20,.6)"; c.fillRect(-3, 7, 3, 2);
          c.restore(); break;
        }
        case "flamme": {
          if (!vis(tr.x, tr.y)) break;
          c.fillStyle = "#2a2226"; c.fillRect(tr.x - 6, tr.y - 3, 12, 3); c.fillStyle = "#4a4044"; c.fillRect(tr.x - 4, tr.y - 4, 8, 2);
          c.fillStyle = tr.state === "warn" ? "#ff8a3a" : "#1a1214"; c.fillRect(tr.x - 2, tr.y - 4, 4, 1);
          if (tr.state === "warn") { c.save(); c.globalCompositeOperation = "lighter"; glow(c, tr.x, tr.y - 4, 8 + Math.sin(t * 40) * 2, "rgba(255,140,40,.6)"); c.restore(); }
          if (tr.state === "fire") {
            c.save(); c.globalCompositeOperation = "lighter";
            const k = (clock + tr.ph) % tr.cyc - 0.7, hh = 58 * Math.min(1, k * 8) * (0.9 + Math.sin(t * 50) * 0.1);
            for (let i = 0; i < 3; i++) { const w = 9 - i * 2.5, g = c.createLinearGradient(0, tr.y - hh, 0, tr.y); g.addColorStop(0, "rgba(255,200,90,0)"); g.addColorStop(0.35, i === 2 ? "rgba(255,250,220,.9)" : "rgba(255,150,40,.75)"); g.addColorStop(1, i === 2 ? "rgba(255,255,240,1)" : "rgba(255,90,20,.9)"); c.fillStyle = g; c.beginPath(); c.moveTo(tr.x - w, tr.y - 3); c.quadraticCurveTo(tr.x - w * 0.6 + Math.sin(t * 30 + i) * 2, tr.y - hh * 0.6, tr.x, tr.y - hh); c.quadraticCurveTo(tr.x + w * 0.6 + Math.sin(t * 27 + i) * 2, tr.y - hh * 0.6, tr.x + w, tr.y - 3); c.fill(); }
            c.restore();
          }
          break;
        }
        case "stachel": {
          if (!vis(tr.x, tr.y)) break;
          c.fillStyle = "#2a2226"; c.fillRect(tr.x - 7, tr.y - 2, 14, 2);
          const hh = tr.up * 10;
          if (hh > 0.5) for (let i = 0; i < 4; i++) { const x = tr.x - 6 + i * 4; c.fillStyle = "#7a7276"; c.beginPath(); c.moveTo(x - 1.6, tr.y - 1); c.lineTo(x, tr.y - 1 - hh); c.lineTo(x + 1.6, tr.y - 1); c.fill(); c.fillStyle = "#d8d0d4"; c.fillRect(x - 0.3, tr.y - 1 - hh, 0.6, hh * 0.5); }
          break;
        }
        case "stein": {
          if (!vis(tr.x, tr.ay, 40)) break;
          if (tr.st === "hang" || tr.st === "shake") {
            const sx = tr.st === "shake" ? (Math.random() - 0.5) * 2 : 0, g = tr.grow;
            c.fillStyle = "#4a4044"; c.beginPath(); c.moveTo(tr.x - 7 * g + sx, tr.ay); c.lineTo(tr.x + 7 * g + sx, tr.ay); c.lineTo(tr.x + 1 + sx, tr.ay + 18 * g); c.closePath(); c.fill();
            c.fillStyle = "#6a6064"; c.beginPath(); c.moveTo(tr.x - 4 * g + sx, tr.ay); c.lineTo(tr.x + sx, tr.ay); c.lineTo(tr.x + 1 + sx, tr.ay + 15 * g); c.closePath(); c.fill();
          } else if (tr.st === "fall") {
            c.fillStyle = "#4a4044"; c.beginPath(); c.moveTo(tr.x - 7, tr.y - 6); c.lineTo(tr.x + 7, tr.y - 6); c.lineTo(tr.x + 1, tr.y + 12); c.closePath(); c.fill();
            c.save(); c.globalAlpha = 0.3; c.fillStyle = "#e8e0d8"; c.fillRect(tr.x - 5, tr.y - 20, 10, 12); c.restore();
          }
          break;
        }
        case "feder": {
          if (!vis(tr.x, tr.y)) break;
          const s = tr.sq > 0 ? 1 - Math.sin(tr.sq / 0.25 * Math.PI) * 0.5 : 1;
          c.strokeStyle = "#a89a8a"; c.lineWidth = 1.2; c.beginPath(); for (let i = 0; i <= 4; i++) { const y = tr.y - i * 1.6 * s - 1; c.lineTo(tr.x + (i % 2 ? 4 : -4), y); } c.stroke();
          c.fillStyle = "#c8a040"; c.fillRect(tr.x - 7, tr.y - 8 * s - 2, 14, 2.4); c.fillStyle = "#ffe08a"; c.fillRect(tr.x - 7, tr.y - 8 * s - 2, 14, 0.8);
          c.fillStyle = "#3a3034"; c.fillRect(tr.x - 6, tr.y - 1.5, 12, 1.5);
          break;
        }
        case "pfeil": {
          if (!vis(tr.x, tr.y)) break;
          const bx = tr.dir > 0 ? tr.x - 2 : tr.x - 6;
          c.fillStyle = "#3a3236"; c.fillRect(bx, tr.y - 6, 8, 12); c.fillStyle = "#5a5256"; c.fillRect(bx + 1, tr.y - 5, 6, 10);
          circ(c, tr.x + tr.dir * 2, tr.y, 2, tr.warn ? "#ff8a3a" : "#120c0e");
          if (tr.warn) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, tr.x + tr.dir * 3, tr.y, 7, "rgba(255,120,40,.7)"); c.restore(); }
          break;
        }
        case "saege": {
          if (!vis(tr.x, tr.y)) break;
          c.fillStyle = "#120c0e"; c.fillRect(tr.x0 - 10, tr.y + 2, tr.x1 - tr.x0 + 20, 2);
          c.save(); c.translate(tr.x, tr.y); c.rotate(tr.rot);
          c.fillStyle = "#8a8286"; c.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, a2 = a + 0.26; c.lineTo(Math.cos(a) * 11, Math.sin(a) * 11); c.lineTo(Math.cos(a2) * 8, Math.sin(a2) * 8); } c.closePath(); c.fill();
          circ(c, 0, 0, 7, "#b8b0b4"); circ(c, 0, 0, 2.4, "#3a3236"); c.fillStyle = "rgba(255,255,255,.5)"; c.fillRect(-5, -1, 10, 0.8);
          c.restore();
          break;
        }
      }
    }
  };
  function shade(hex, k) {
    const n = parseInt(String(hex).slice(1), 16); if (isNaN(n)) return hex;
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
    return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
  }
})();
