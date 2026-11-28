/* Ezekiel – The Destroyer · Werkzeuge & Granaten (LB/RB) und Schilde mit eigenen Wirkungen
   Jede Fähigkeit verändert den Spielstil: werfen, legen, ziehen, ausweichen, fesseln, sprengen.
   Eigene Objekte (Granaten, Türme, Fässer, Haken …) leben in Z.gadgets. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, FX = Z.fx, A = Z.audio, W = Z.world, T = Z.TILE, L = v => Z.L(v);
  const D = Z.draw, { limb, circ, poly, ell, glow } = D;
  const G = (Z.gadgets = []);
  const inp = Z.input;

  /* ======================= Hilfen ======================= */
  const alive = e => e && !e.dead && !(e.intro > 0);
  const big = e => e.def.boss || e.def.heavy;
  function aoe(x, y, r, dmg, o, fn) {
    let n = 0;
    for (const e of Z.enemies) {
      if (!alive(e)) continue;
      if (U.dist(x, y, e.x + e.w / 2, e.y + e.h / 2) > r + e.w / 2) continue;
      Z.hitEnemy(e, dmg, Object.assign({ src: "skill", dir: U.sign(e.x + e.w / 2 - x) || 1 }, o || {}));
      if (fn) fn(e); n++;
    }
    return n;
  }
  function blast(x, y, r, col, smoke) {
    FX.ring(x, y, r, col, 0.3, 4); FX.addShake(Math.min(7, 2 + r / 14)); FX.stop(0.03);
    FX.burst(x, y, 18 + r / 3, { col: [col, "#fff4d0"], sp: 90 + r * 2.4, life: 0.45, size: 2.6, kind: "spark", add: true });
    if (smoke !== false) FX.burst(x, y, 8, { col: ["#4a4040", "#6a5a50"], sp: 60, life: 0.9, size: 6, kind: "smoke", g: -30 });
  }
  const hand = P => ({ x: P.x + P.w / 2 + P.face * 6, y: P.y + 8 });
  /* Wurfrichtung: hoch = steil, runter = vor die Füße */
  function throwVel(P, sp, g) {
    sp = sp || 1; g = g || 720;
    if (inp.held.down) return { vx: P.face * 70 * sp, vy: -80 };
    if (inp.held.up) return { vx: P.face * 120 * sp, vy: -380 };
    /* Wurfhilfe: auf den nächsten Gegner vor dir zielen, so dass die Granate bei ihm landet */
    const h = hand(P); let best = null, bd = 240;
    for (const e of Z.enemies) { if (!alive(e) || e.hidden) continue; const dx = e.x + e.w / 2 - h.x; if (U.sign(dx) !== P.face) continue; const d = Math.abs(dx) + Math.abs(e.y - P.y) * 0.5; if (d < bd && Math.abs(e.y + e.h - (P.y + P.h)) < 90) { bd = d; best = e; } }
    if (best) { const dx = best.x + best.w / 2 + best.vx * 0.2 - h.x, dy = best.y + best.h * 0.5 - h.y, t = U.clamp(Math.abs(dx) / 200, 0.28, 0.8); return { vx: dx / t, vy: (dy - 0.5 * g * t * t) / t }; }
    return { vx: P.face * 210 * sp + P.vx * 0.3, vy: -200 };
  }
  const groundAt = (x, y, max) => W.groundBelow(x, y - 6, max || 120);

  /* ======================= Granate (allgemein) ======================= */
  /* o: col, col2, r, g, bounce, stick, fuse, life, shape, onBoom(x, y, nade, hitEnemy) */
  function nade(P, o) {
    const h = hand(P), v = o.v || throwVel(P, o.sp);
    const g = Object.assign({ k: "nade", x: h.x, y: h.y, vx: v.vx, vy: v.vy, g: 720, r: 3, t: 0, life: 3, col: "#ff6a2a", col2: "#e0d8c0", bounce: 0, rot: 0 }, o);
    G.push(g); A.play("glass", { vol: 0.25, rate: 1.4 });
    return g;
  }
  function nadeStep(g, dt) {
    if (g.stuckE) {
      const e = g.stuckE; if (!e.dead) { g.x = e.x + e.w / 2 + g.ox; g.y = e.y + g.oy; }
      g.fuse -= dt; if (Math.random() < dt * 30) FX.p({ x: g.x, y: g.y - 3, vx: 0, vy: -30, life: 0.25, size: 1.5, col: "#ffd27a", kind: "spark", add: true });
      if (g.fuse <= 0) return boom(g, g.x, g.y, e);
      return true;
    }
    if (g.stuck) { g.fuse -= dt; if (g.fuse <= 0) return boom(g, g.x, g.y, null); return true; }
    if ((g.t += dt) > g.life) return boom(g, g.x, g.y, null);
    g.vy += g.g * dt; const ox = g.x, oy = g.y;
    g.x += g.vx * dt; g.y += g.vy * dt; g.rot += dt * 14 * (U.sign(g.vx) || 1);
    if (g.trail && Math.random() < dt * 40) FX.p({ x: g.x, y: g.y, vx: 0, vy: 0, life: 0.3, size: 2, col: g.trail, kind: "glow", add: true });
    /* Gegner */
    for (const e of Z.enemies) {
      if (!alive(e) || g.x + g.r < e.x || g.x - g.r > e.x + e.w || g.y + g.r < e.y || g.y - g.r > e.y + e.h) continue;
      if (g.stick) { g.stuckE = e; g.ox = g.x - (e.x + e.w / 2); g.oy = g.y - e.y; g.fuse = g.fuse || 1.3; A.play("slime", { vol: 0.5 }); FX.text(e.x + e.w / 2, e.y - 6, L(["Klebt!", "Stuck!"]), "#ffd27a"); return true; }
      return boom(g, g.x, g.y, e);
    }
    /* Wände und Boden */
    if (W.solidAt(g.x, g.y) || (g.vy > 0 && W.isPlat(Math.floor(g.x / T), Math.floor(g.y / T)) && oy < Math.floor(g.y / T) * T)) {
      if (g.bounce > 0) {
        g.bounce--;
        if (W.solidAt(g.x, oy)) g.vx *= -0.55; else { g.vy *= -0.45; g.vx *= 0.7; }
        g.x = ox; g.y = oy; A.play("land", { vol: 0.2, rate: 2 }); return true;
      }
      if (g.stick) { g.x = ox; g.y = oy; g.stuck = true; g.fuse = g.fuse || 1.3; A.play("slime", { vol: 0.4 }); return true; }
      return boom(g, ox, oy, null);
    }
    return true;
  }
  function boom(g, x, y, e) { if (g.onBoom) g.onBoom(x, y, g, e); return false; }
  function drawNade(g, c, t) {
    c.save(); c.translate(g.x, g.y); c.rotate(g.rot);
    switch (g.shape) {
      case "flask": poly(c, [-2.5, 3, 2.5, 3, 3, -1, 1, -3, -1, -3, -3, -1], g.col); c.fillStyle = g.col2; c.fillRect(-1.2, -5, 2.4, 2); break;
      case "pot": ell(c, 0, 0.5, 4, 3.4, g.col); c.fillStyle = "#3a2a20"; c.fillRect(-2.5, -3.5, 5, 1.4); break;
      case "stone": poly(c, [-3, -2, 0, -4, 3.5, -1, 2, 3, -2.5, 3], g.col); glow(c, 0, 0, 7, "rgba(200,140,255,.5)"); break;
      case "spiky": circ(c, 0, 0, 3, g.col); for (let i = 0; i < 6; i++) { const a = i * 1.047; limb(c, Math.cos(a) * 2, Math.sin(a) * 2, Math.cos(a) * 5, Math.sin(a) * 5, 0.8, g.col2); } break;
      case "mini": circ(c, 0, 0, 2, g.col); break;
      default: circ(c, 0, 1, g.r + 0.5, g.col); c.fillStyle = g.col2; c.fillRect(-1, -4.5, 2, 2.4);
    }
    c.restore();
    if (!g.noFuse) { c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = Math.random() < 0.5 ? "#ffd27a" : "#ff6a1a"; c.fillRect(g.x - 1, g.y - 7, 2, 2); c.restore(); }
    if (g.stuckE || g.stuck) { const k = 0.5 + 0.5 * Math.sin(t * 30); c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = k; glow(c, g.x, g.y, 10, "rgba(255,90,40,.8)"); c.restore(); }
  }

  /* ======================= Felder, Türme, Fässer … ======================= */
  function field(o) { const f = Object.assign({ k: "field", t: 0, tick: 0 }, o); G.push(f); return f; }
  function inField(f, e) { return e.x + e.w > f.x - f.w / 2 && e.x < f.x + f.w / 2 && e.y + e.h > f.y - (f.hgt || 14) && e.y < f.y + 2; }

  function stepGadget(g, dt) {
    switch (g.k) {
      case "nade": return nadeStep(g, dt);
      case "field": {
        g.t += dt; if (g.t > g.life) return false;
        g.tick -= dt; const tick = g.tick <= 0; if (tick) g.tick = g.rate || 0.5;
        for (const e of Z.enemies) if (alive(e) && inField(g, e)) g.on(e, tick, dt);
        if (g.onPlayer && Z.player && inField(g, Z.player)) g.onPlayer(Z.player, tick, dt);
        return true;
      }
      case "turret": {
        g.t += dt; if (g.t > g.life) { FX.burst(g.x, g.y - 6, 10, { col: ["#6a5a4a", "#a08a6a"], sp: 70, life: 0.5, size: 2.5, kind: "shard", g: 400 }); A.play("rock", { vol: 0.4 }); return false; }
        g.cd -= dt;
        let best = null, bd = g.range;
        for (const e of Z.enemies) { if (!alive(e) || e.hidden) continue; const d = U.dist(g.x, g.y - 8, e.x + e.w / 2, e.y + e.h / 2); if (d < bd && W.los(g.x, g.y - 10, e.x + e.w / 2, e.y + e.h / 2)) { bd = d; best = e; } }
        if (best) g.face = U.sign(best.x + best.w / 2 - g.x) || g.face;
        if (best && g.cd <= 0) { g.cd = g.rate; g.fire(g, best); }
        return true;
      }
      case "barrel": {
        g.t += dt;
        if (!g.ground) { g.vy += 900 * dt; g.y += g.vy * dt; const gy = groundAt(g.x, g.y, 20); if (gy != null && g.y >= gy) { g.y = gy; g.ground = true; A.play("land", { vol: 0.4 }); } }
        for (const p of Z.projs) if (p.owner === "p" && !p.dead && Math.abs(p.x - g.x) < 9 && p.y > g.y - 18 && p.y < g.y) { p.dead = true; g.t = g.life; }
        if (g.t >= g.life) { const P = Z.player; Z.explode(g.x, g.y - 8, 82, g.dmg, "p"); FX.flashScreen("#ffb040", 0.25); FX.addShake(9);
          if (P && U.dist(g.x, g.y, P.x + P.w / 2, P.y + P.h) < 70) { Z.hurtPlayer(Math.round(P.hpMax * 0.12), { x: g.x, unblockable: true, kb: 0, hazard: true }); P.vy = -420; P.onGround = false; P.vx = U.sign(P.x + P.w / 2 - g.x) * 200; }
          return false; }
        return true;
      }
      case "pad": {
        g.t += dt; if (g.t > g.life) return false;
        const P = Z.player, r = { x: g.x - 10, y: g.y - 8, w: 20, h: 9 };
        if (P && P.vy >= 0 && U.overlap(r, P) && !P.climbing) { P.vy = -640; P.onGround = false; P.airJumps = 1; P.cut = true; g.squash = 0.25; A.play("jump", { vol: 0.6, rate: 0.7 }); FX.burst(g.x, g.y - 6, 10, { col: ["#ff8aa0", "#ffe0e8"], sp: 90, ang: -Math.PI / 2, spread: 1.2, life: 0.4, size: 2, kind: "spark", add: true }); }
        for (const e of Z.enemies) if (alive(e) && !big(e) && !e.def.fly && U.overlap(r, e) && (e.padT || 0) <= 0) { e.padT = 0.8; e.vy = -520; e.onGround = false; Z.addStatus(e, "stun", 0.7); g.squash = 0.25; A.play("jump", { vol: 0.4, rate: 0.6 }); }
        g.squash = Math.max(0, (g.squash || 0) - dt);
        return true;
      }
      case "boomerang": {
        g.t += dt; const P = Z.player;
        if (!g.ret && g.t > g.out) { g.ret = true; g.hits = new Set(); }
        if (g.ret && P) { const a = Math.atan2(P.y + 12 - g.y, P.x + P.w / 2 - g.x); g.vx = U.approach(g.vx, Math.cos(a) * g.sp, 2400 * dt); g.vy = U.approach(g.vy, Math.sin(a) * g.sp, 2400 * dt); if (U.dist(g.x, g.y, P.x + P.w / 2, P.y + 12) < 14 || g.t > 3) { if (g.onCatch) g.onCatch(); return false; } }
        g.x += g.vx * dt; g.y += g.vy * dt; g.rot += dt * 22;
        if (!g.ret && W.solidAt(g.x, g.y)) { g.ret = true; g.hits = new Set(); A.play("hitMetal", { vol: 0.4 }); }
        for (const e of Z.enemies) if (alive(e) && !g.hits.has(e) && U.overlap({ x: g.x - g.r, y: g.y - g.r, w: g.r * 2, h: g.r * 2 }, e)) { g.hits.add(e); Z.hitEnemy(e, g.dmg, { src: g.src || "skill", it: g.it, kb: 60, eff: g.eff, dir: U.sign(g.vx) || 1 }); if (g.onHit) g.onHit(e); }
        return true;
      }
      case "hook": {
        g.t += dt; const P = Z.player; if (!P || P.dead) return false;
        g.x += g.vx * dt; g.y += g.vy * dt;
        if (U.dist(g.x, g.y, g.x0, g.y0) > g.range) { A.play("chain", { vol: 0.3, rate: 1.5 }); P.cd[g.slot] = Math.min(P.cd[g.slot], 0.8); return false; }
        for (const e of Z.enemies) if (alive(e) && U.overlap({ x: g.x - 4, y: g.y - 4, w: 8, h: 8 }, e)) { P.grapple = { e, t: 0, dmg: g.dmg, it: g.it }; A.play("chain", { vol: 0.6 }); return false; }
        if (W.solidAt(g.x, g.y)) { P.grapple = { x: g.x - U.sign(g.vx) * 2, y: g.y + (g.vy < 0 ? 4 : -2), t: 0 }; A.play("arrowHit", { vol: 0.6 }); FX.burst(g.x, g.y, 6, { col: Z.dustCol || "#8a7a70", sp: 60, life: 0.3, size: 2, kind: "shard", g: 300 }); return false; }
        return true;
      }
      case "pull": {
        g.t += dt; const e = g.e, P = Z.player;
        if (!alive(e) || !P || g.t > 0.22) return false;
        const tx = P.x + P.w / 2 + P.face * 18 - e.w / 2; e.x += (tx - e.x) * Math.min(1, dt * 18); e.y += (P.y + P.h - e.h - e.y) * Math.min(1, dt * 8); e.vx = 0;
        return true;
      }
      case "magnet": {
        g.t += dt;
        for (const e of Z.enemies) if (alive(e) && !e.def.boss && U.dist(g.x, g.y, e.x + e.w / 2, e.y + e.h / 2) < 120) { const d = g.x - (e.x + e.w / 2); e.vx = U.clamp(d * 6, -260, 260) * (e.def.heavy ? 0.4 : 1); if (e.def.fly) e.vy = (g.y - 10 - (e.y + e.h / 2)) * 4; }
        if (Math.random() < dt * 60) { const a = Math.random() * 6.283; FX.p({ x: g.x + Math.cos(a) * 60, y: g.y - 8 + Math.sin(a) * 40, vx: -Math.cos(a) * 120, vy: -Math.sin(a) * 80, life: 0.45, size: 1.6, col: "#ff6a8a", kind: "spark", add: true }); }
        if (g.t > 1.3) { blast(g.x, g.y - 6, 50, "#ff6a8a"); A.play("explode", { vol: 0.7 }); aoe(g.x, g.y - 6, 50, g.dmg, { kb: 80, kbUp: 220, heavy: true, eff: { stun: 0.8 } }); return false; }
        return true;
      }
      case "float": {
        g.t += dt;
        for (const e of g.list) if (alive(e)) { e.y -= 36 * dt; e.vy = 0; e.vx *= 0.9; e.floatT = 1; if (!(e.st.stun > 0.1)) e.st.stun = 0.1; }
        if (g.t > 1.6) { for (const e of g.list) if (alive(e)) { e.floatT = 0; e.vy = 640; Z.hitEnemy(e, g.dmg, { src: "skill", heavy: true, kb: 0, eff: { stun: 0.7 } }); } A.play("quake", { vol: 0.5 }); FX.addShake(5); return false; }
        return true;
      }
      case "tornado": {
        g.t += dt; if (g.t > 3.2) return false;
        g.x += g.vx * dt; if (W.solidAt(g.x + U.sign(g.vx) * 10, g.y - 10)) g.vx *= -1;
        const gy = groundAt(g.x, g.y, 40); if (gy != null) g.y = gy;
        g.tick -= dt; const tick = g.tick <= 0; if (tick) g.tick = 0.3;
        for (const e of Z.enemies) if (alive(e) && Math.abs(e.x + e.w / 2 - g.x) < 22 && e.y + e.h > g.y - 70 && e.y < g.y) {
          if (!e.def.boss) { e.vx = (g.x - (e.x + e.w / 2)) * 6 + g.vx; e.vy = Math.min(e.vy, -160 * (e.def.heavy ? 0.4 : 1)); e.onGround = false; }
          if (tick) Z.hitEnemy(e, g.dmg, { src: "skill", dot: true, col: "#d8e0d0" });
        }
        if (Math.random() < dt * 50) FX.p({ x: g.x + (Math.random() - 0.5) * 20, y: g.y - Math.random() * 60, vx: (Math.random() - 0.5) * 60, vy: -60, life: 0.5, size: 2, col: Z.dustCol || "#a99a8b", kind: "smoke" });
        return true;
      }
      case "rune": {
        g.t += dt; if (g.t > g.life) return false;
        for (const p of Z.projs) if (p.owner === "e" && !p.dead && Math.abs(p.x - g.x) < 7 && p.y > g.y - 64 && p.y < g.y + 2) { p.dead = true; FX.burst(p.x, p.y, 8, { col: ["#ffd27a", "#fff"], sp: 90, life: 0.25, size: 1.6, kind: "spark", add: true }); A.play("block", { vol: 0.4, rate: 1.4 }); }
        for (const e of Z.enemies) if (alive(e) && !e.def.boss && !e.def.fly && Math.abs(e.x + e.w / 2 - g.x) < e.w / 2 + 4 && e.y + e.h > g.y - 64) { e.vx = U.sign(e.x + e.w / 2 - g.x) * 160; }
        return true;
      }
      case "fx": g.t += dt; return g.t < g.life;
    }
    return false;
  }
  Z.updateGadgets = function (dt) {
    for (let i = G.length - 1; i >= 0; i--) if (!stepGadget(G[i], dt)) G.splice(i, 1);
    for (const e of Z.enemies) {
      if (e.frozenT > 0) { e.frozenT -= dt; if (!(e.st.stun > 0)) e.frozenT = 0; }
      if (e.acidT > 0) { e.acidT -= dt; if (Math.random() < dt * 8) FX.p({ x: e.x + Math.random() * e.w, y: e.y + e.h * Math.random(), vx: 0, vy: -16, life: 0.5, size: 1.6, col: "#c8e050", kind: "bubble" }); }
      if (e.padT > 0) e.padT -= dt;
    }
    /* Spiegelbild (Köder) */
    for (const a of Z.allies) if (a.kind === "spiegel") {
      for (const e of Z.enemies) if (alive(e) && !e.def.boss && U.dist(a.x, a.y, e.x, e.y) < 240) e.decoy = a;
      a.vy = Math.min((a.vy || 0) + 1400 * dt, 500); a.vx = 0; Z.moveBody(a, dt);
      if (a.t > a.life - 0.02 && !a.popped) { a.popped = true; blast(a.x + a.w / 2, a.y + a.h / 2, 52, "#c060ff"); A.play("explode", { vol: 0.6 }); aoe(a.x + a.w / 2, a.y + a.h / 2, 52, a.dmg, { kb: 160, kbUp: 140, heavy: true, eff: { stun: 0.6 } }); }
    }
  };

  Z.drawGadgets = function (c, t) {
    const P = Z.player;
    /* Eis und Säure auf Gegnern */
    for (const e of Z.enemies) {
      if (e.dead) continue;
      if (e.frozenT > 0) { c.save(); c.globalAlpha = Math.min(1, e.frozenT * 2) * 0.55; c.fillStyle = "#eef6f2"; c.fillRect(e.x - 1, e.y - 1, e.w + 2, e.h + 2); c.globalAlpha *= 1.3; c.strokeStyle = "#ffffff"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(e.x + 2, e.y + 3); c.lineTo(e.x + e.w * 0.5, e.y + e.h * 0.4); c.lineTo(e.x + e.w - 2, e.y + 2); c.moveTo(e.x + e.w * 0.5, e.y + e.h * 0.4); c.lineTo(e.x + e.w * 0.4, e.y + e.h - 2); c.stroke(); c.restore(); }
      if (e.acidT > 0) { c.save(); c.globalAlpha = 0.25; c.fillStyle = "#c8e050"; c.fillRect(e.x, e.y + e.h * 0.4, e.w, e.h * 0.6); c.restore(); }
    }
    for (const g of G) {
      switch (g.k) {
        case "nade": drawNade(g, c, t); break;
        case "field": if (g.draw) g.draw(g, c, t); break;
        case "turret": {
          c.save(); c.translate(g.x, g.y);
          limb(c, -6, 0, -2, -9, 1.6, "#5a4030"); limb(c, 6, 0, 2, -9, 1.6, "#5a4030"); limb(c, 0, 0, 0, -9, 1.6, "#4a3424");
          c.scale(g.face || 1, 1);
          if (g.style === "fire") { ell(c, 1, -12, 6, 4.5, "#3a2a2a"); circ(c, 6, -12, 2.4, "#1a1010"); glow(c, 6, -12, 6 + Math.sin(t * 12) * 1.5, "rgba(255,120,40,.7)"); }
          else { limb(c, -4, -12, 9, -12, 2.6, "#6a4a2a"); limb(c, 5, -17, 5, -7, 1.4, "#8a6a40"); limb(c, 5, -17, -2, -12, 0.5, "#d8d0c0"); limb(c, 5, -7, -2, -12, 0.5, "#d8d0c0"); }
          c.restore();
          const k = 1 - g.t / g.life; c.fillStyle = "rgba(0,0,0,.5)"; c.fillRect(g.x - 7, g.y + 2, 14, 2); c.fillStyle = "#e5b454"; c.fillRect(g.x - 7, g.y + 2, 14 * k, 2);
          break;
        }
        case "barrel": {
          c.save(); c.translate(g.x, g.y);
          poly(c, [-7, 0, 7, 0, 8, -9, 7, -18, -7, -18, -8, -9], "#6a4426"); limb(c, -8, -5, 8, -5, 1.4, "#3a2a1a"); limb(c, -8, -13, 8, -13, 1.4, "#3a2a1a");
          c.fillStyle = "#1a1010"; c.font = "bold 8px serif"; c.textAlign = "center"; c.fillText("☠", 0, -6);
          const left = g.life - g.t; if (left < 1.5 && Math.floor(t * (left < 0.6 ? 16 : 8)) % 2) { c.globalCompositeOperation = "lighter"; glow(c, 0, -9, 16, "rgba(255,80,30,.7)"); }
          c.fillStyle = Math.random() < 0.5 ? "#ffd27a" : "#ff6a1a"; c.fillRect(-1, -22, 2, 3);
          c.restore(); break;
        }
        case "pad": {
          const s = 1 + (g.squash || 0) * 1.5;
          c.save(); c.translate(g.x, g.y); c.scale(s, 1 / s);
          limb(c, 0, 0, 0, -5, 3, "#e8d8c0"); ell(c, 0, -6, 9, 4.5, "#c84a6a"); for (let i = -1; i <= 1; i++) circ(c, i * 4, -7.5, 1.2, "#ffe0e8");
          c.restore(); break;
        }
        case "boomerang": { c.save(); c.translate(g.x, g.y); c.rotate(g.rot); if (g.draw) g.draw(c); else { limb(c, -6, 2, 0, -3, 2.4, "#a07040"); limb(c, 0, -3, 6, 2, 2.4, "#a07040"); } c.restore(); break; }
        case "hook": if (P) { c.strokeStyle = "#a08a6a"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(P.x + P.w / 2, P.y + 9); c.lineTo(g.x, g.y); c.stroke(); c.save(); c.translate(g.x, g.y); c.rotate(Math.atan2(g.vy, g.vx)); limb(c, -3, 0, 3, 0, 1.4, "#c8c0b8"); limb(c, 3, 0, 1, -3, 1.2, "#c8c0b8"); limb(c, 3, 0, 1, 3, 1.2, "#c8c0b8"); c.restore(); } break;
        case "magnet": { const k = g.t / 1.3; c.save(); c.translate(g.x, g.y - 6); c.globalCompositeOperation = "lighter"; glow(c, 0, 0, 14 + k * 10, "rgba(255,90,130,.55)"); c.globalCompositeOperation = "source-over"; c.strokeStyle = "#c83a4a"; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 4, Math.PI, 0); c.stroke(); c.fillStyle = "#e8e0d0"; c.fillRect(-5.5, 0, 3, 2); c.fillRect(2.5, 0, 3, 2); c.restore(); break; }
        case "float": for (const e of g.list) if (alive(e)) { c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.5; glow(c, e.x + e.w / 2, e.y + e.h / 2, e.w, "rgba(190,120,255,.6)"); c.restore(); } break;
        case "tornado": {
          c.save(); c.globalAlpha = Math.min(1, (3.2 - g.t) * 2) * 0.7; c.strokeStyle = "#d8d0c4"; c.lineWidth = 1.4;
          for (let i = 0; i < 7; i++) { const y = g.y - i * 10, w = 6 + i * 3.2, ph = t * 14 + i; c.beginPath(); c.ellipse(g.x + Math.sin(ph * 0.5) * 3, y, w, 2.5, 0, ph % 6.283, ph % 6.283 + 4); c.stroke(); }
          c.restore(); break;
        }
        case "rune": {
          const k = Math.min(1, (g.life - g.t) * 2);
          c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = k * (0.55 + 0.15 * Math.sin(t * 8));
          const gr = c.createLinearGradient(g.x - 6, 0, g.x + 6, 0); gr.addColorStop(0, "rgba(255,210,120,0)"); gr.addColorStop(0.5, "rgba(255,210,120,.8)"); gr.addColorStop(1, "rgba(255,210,120,0)");
          c.fillStyle = gr; c.fillRect(g.x - 6, g.y - 64, 12, 64); c.fillStyle = "#ffe8b0"; for (let i = 0; i < 4; i++) c.fillRect(g.x - 1, g.y - 10 - i * 15 - (t * 20 % 15), 2, 4);
          c.restore(); break;
        }
        case "fx": if (g.draw) g.draw(g, c, t); break;
      }
    }
    /* Ausweichfenster der Rolle: heller Schimmer, solange man unverwundbar ist */
    if (P && P.dodgeT > 0) { c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = P.dodgeT / Z.PC.DODGE * 0.6; glow(c, P.x + P.w / 2, P.y + P.h - 9, 14, "rgba(255,236,190,.8)"); c.restore(); }
    /* Seil des Enterhakens während des Zugs */
    if (P && P.grapple) { const gp = P.grapple, tx = gp.e ? gp.e.x + gp.e.w / 2 : gp.x, ty = gp.e ? gp.e.y + gp.e.h / 2 : gp.y; c.strokeStyle = "#a08a6a"; c.lineWidth = 1; c.beginPath(); c.moveTo(P.x + P.w / 2, P.y + 9); c.lineTo(tx, ty); c.stroke(); }
  };

  /* Gefrorene und verätzte Gegner nehmen mehr Schaden; Eis zerspringt beim Treffer */
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    o = o || {};
    if (e && !e.dead && !o.dot) {
      if (e.frozenT > 0) { dmg *= 1.6; e.frozenT = 0; if (e.st) e.st.stun = Math.min(e.st.stun || 0, 0.15); FX.burst(e.x + e.w / 2, e.y + e.h / 2, 14, { col: ["#ffffff", "#e0ece8", "#c8d8d4"], sp: 140, life: 0.45, size: 2.2, kind: "shard", g: 500 }); A.play("glass", { vol: 0.6, rate: 0.8 }); FX.text(e.x + e.w / 2, e.y - 10, L(["Zersplittert!", "Shattered!"]), "#ffffff"); }
      if (e.acidT > 0) dmg *= 1.35;
    }
    return hit0(e, dmg, o);
  };
  /* Pulverfass explodiert, wenn man es schlägt */
  const props0 = Z.hitProps;
  Z.hitProps = function (r, dmg, act) {
    if (r) for (const g of G) if (g.k === "barrel" && U.overlap(r, { x: g.x - 8, y: g.y - 18, w: 16, h: 18 })) g.t = g.life;
    return props0 ? props0(r, dmg, act) : undefined;
  };
  /* Spiegelbild zeichnen */
  const drawAlly0 = Z.drawAlly;
  Z.drawAlly = function (c, a, t) {
    if (a.kind === "spiegel") {
      const P = Z.player; if (!P) return;
      const fake = Object.assign({}, P, { x: a.x, y: a.y, face: a.face, act: null, rollT: 0, iframe: 0, invis: 0, wrath: 0, drinkT: 0, hurtT: 0, climbing: false, ledge: null, dead: false, onGround: true, vx: 0, cape: a.cape, anim: Object.assign({}, P.anim, { run: 0, land: 0 }) });
      c.save(); c.globalAlpha = 0.5 + 0.15 * Math.sin(t * 9); c.filter = "none";
      Z.drawPlayer(c, fake, t); a.cape = fake.cape;
      c.globalCompositeOperation = "lighter"; glow(c, a.x + a.w / 2, a.y + a.h / 2, 18, "rgba(190,90,255,.45)");
      c.restore();
      const k = 1 - a.t / a.life; c.fillStyle = "rgba(0,0,0,.5)"; c.fillRect(a.x - 1, a.y - 6, a.w + 2, 2); c.fillStyle = "#c060ff"; c.fillRect(a.x - 1, a.y - 6, (a.w + 2) * k, 2);
      return;
    }
    drawAlly0(c, a, t);
  };

  /* ======================= Enterhaken: Zug zum Haken ======================= */
  const upd0 = Z.updatePlayer;
  Z.updatePlayer = function (P, dt) {
    const gp = P.grapple;
    if (gp && !P.dead) {
      gp.t += dt;
      for (const k of ["s1", "s2"]) P.cd[k] = Math.max(0, P.cd[k] - dt);
      const tx = gp.e ? gp.e.x + gp.e.w / 2 : gp.x, ty = gp.e ? gp.e.y + gp.e.h * 0.4 : gp.y;
      const dx = tx - (P.x + P.w / 2), dy = ty - (P.y + (gp.e ? P.h * 0.5 : 4)), d = Math.hypot(dx, dy) || 1;
      P.iframe = Math.max(P.iframe, 0.06); P.act = null; P.rollT = 0; P.climbing = false; P.plunge = false;
      P.vx = dx / d * 560; P.vy = dy / d * 560; if (Math.abs(dx) > 2) P.face = U.sign(dx);
      Z.moveBody(P, dt);
      if (Math.random() < dt * 60) FX.p({ x: P.x + P.w / 2, y: P.y + 10, vx: -P.vx * 0.1, vy: -P.vy * 0.1, life: 0.25, size: 2.5, col: "#3a2028", kind: "smoke" });
      const arrived = d < (gp.e ? 18 : 12) || gp.t > 0.5 || (gp.e && gp.e.dead) || (P.hitWall && gp.t > 0.06) || (P.onGround && dy > -4 && gp.t > 0.1);
      if (arrived) {
        P.grapple = null; P.airJumps = 1; P.coyote = 0; P.cut = true;
        if (gp.e && alive(gp.e)) {
          Z.hitEnemy(gp.e, gp.dmg, { src: "skill", it: gp.it, kb: 220, kbUp: 140, heavy: true, eff: { stun: 1 }, dir: P.face });
          P.vx = -P.face * 170; P.vy = -280; A.play("punch", { vol: 0.7 }); FX.ring(P.x + P.w / 2 + P.face * 8, P.y + 12, 18, "#ffd27a", 0.25, 3);
        } else { P.vx *= 0.35; P.vy = Math.min(P.vy * 0.2, -230); A.play("jump", { vol: 0.5, rate: 0.9 }); }
        P.onGround = false; P.afterRoll = 2;
      }
      Z.capeUpdate && 0;
      P.anim.t += dt;
      return;
    }
    upd0(P, dt);
  };

  /* ======================= FÄHIGKEITEN (LB/RB) ======================= */
  const SK = Z.SKILLS, FX_ = (Z.SKILL_FX = Z.SKILL_FX || {});
  function add(id, def, fx) { SK[id] = def; FX_[id] = fx; }

  /* ---------- Granaten ---------- */
  add("frostgranate", { n: ["Frostgranate", "Frost Grenade"], stat: "takt", find: "haeufig", tier: 0, cd: 12, icon: "frost", col: "#e8f4f0",
    d: ["Friert alles im Umkreis 2,5 Sekunden ein. Der nächste Treffer zersplittert das Eis: +60 % Schaden.", "Freezes everything nearby for 2.5 seconds. The next hit shatters the ice: +60% damage."], tags: ["Kontrolle"] },
  (P, it, o) => { nade(P, { col: "#dfeee8", col2: "#a8b8b0", shape: "flask", trail: "#ffffff", onBoom: (x, y) => {
    blast(x, y, 58, "#ffffff", false); A.play("glass", { vol: 0.8, rate: 0.6 }); FX.burst(x, y, 24, { col: ["#ffffff", "#dfeee8"], sp: 130, life: 0.8, size: 2, kind: "shard", g: 200 });
    aoe(x, y, 58, 6 * o.m, { eff: o.eff }, e => { Z.addStatus(e, "stun", 2.5); e.frozenT = e.st.stun; e.vx = 0; });
  } }); });

  add("brandtopf", { n: ["Feuertopf", "Fire Pot"], stat: "brut", find: "haeufig", tier: 0, cd: 11, icon: "firepot", col: "#ff8a3a",
    d: ["Ein Tontopf voller Lampenöl. Zerplatzt zu einem breiten Flammenteppich, der 5 Sekunden brennt.", "A clay pot full of lamp oil. Bursts into a wide carpet of flame that burns for 5 seconds."], tags: ["Brand", "Fläche"] },
  (P, it, o) => { nade(P, { col: "#a0603a", shape: "pot", onBoom: (x, y) => {
    const gy = groundAt(x, y) || y; A.play("glass", { vol: 0.7 }); A.play("fireBig", { vol: 0.5 });
    Z.spawnHazard({ kind: "fire", x, y: gy, w: 110, life: 5, dmg: 4 * o.m, owner: "p", eff: Object.assign({ burn: 1 }, o.eff) });
    FX.burst(x, gy - 4, 24, { col: ["#ffd27a", "#ff6a2a"], sp: 150, ang: -Math.PI / 2, spread: 2.4, life: 0.5, size: 2.4, kind: "spark", add: true });
  } }); });

  add("klebebombe", { n: ["Klebebombe", "Sticky Bomb"], stat: "brut", find: "selten", tier: 1, cd: 13, icon: "sticky", col: "#c8e050",
    d: ["Bleibt am ersten Gegner (oder an der Wand) kleben und detoniert nach 1,3 Sekunden mit gewaltigem Knall.", "Sticks to the first enemy (or wall) and detonates after 1.3 seconds with a huge bang."], tags: ["Explosion", "Einzelziel"] },
  (P, it, o) => { nade(P, { col: "#8aa030", col2: "#c8e050", shape: "spiky", stick: true, fuse: 1.3, onBoom: (x, y) => {
    blast(x, y, 56, "#ffb040"); A.play("explode", { vol: 1 }); FX.flashScreen("#ffb040", 0.15);
    aoe(x, y, 56, 58 * o.m, { kb: 240, kbUp: 200, heavy: true, eff: Object.assign({ burn: 1 }, o.eff) });
    Z.hitProps({ x: x - 56, y: y - 56, w: 112, h: 112 }, 58 * o.m);
  } }); });

  add("splittergranate", { n: ["Splittergranate", "Shrapnel Grenade"], stat: "takt", find: "haeufig", tier: 0, cd: 10, icon: "shrapnel", col: "#c8c0b8",
    d: ["Zerreißt in zwölf scharfe Splitter, die in alle Richtungen fliegen und bluten lassen.", "Bursts into twelve sharp shards that fly in all directions and cause bleeding."], tags: ["Blutung", "Fläche"] },
  (P, it, o) => { nade(P, { col: "#6a6058", shape: "spiky", col2: "#c8c0b8", onBoom: (x, y) => {
    blast(x, y, 26, "#e0d8d0"); A.play("explode", { vol: 0.6, rate: 1.3 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + Math.random() * 0.2; Z.spawnProj("messer", x, y - 3, 1, { vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, dmg: 8 * o.m, eff: Object.assign({ bleed: 1 }, o.eff), life: 0.45 }); }
  } }); });

  add("magnetbombe", { n: ["Magnetbombe", "Magnet Bomb"], stat: "ueber", find: "selten", tier: 1, cd: 14, icon: "magnet", col: "#ff6a8a",
    d: ["Zieht 1,3 Sekunden lang alle Gegner auf einen Punkt zusammen und sprengt sie dann in die Luft. Perfekt vor einem großen Schlag.", "Pulls all enemies to one spot for 1.3 seconds, then blasts them into the air. Perfect before a big hit."], tags: ["Kontrolle", "Gruppe"] },
  (P, it, o) => { nade(P, { col: "#c83a4a", shape: "mini", noFuse: true, onBoom: (x, y) => { const gy = groundAt(x, y, 30) || y; G.push({ k: "magnet", x, y: gy, t: 0, dmg: 22 * o.m }); A.play("magic", { vol: 0.6, rate: 0.6 }); } }); });

  add("donnerkeil", { n: ["Donnerkeil", "Thunder Wedge"], stat: "takt", find: "selten", tier: 1, cd: 13, icon: "thunder", col: "#f0e060",
    d: ["Wo er landet, schlägt ein Blitz vom Himmel ein, betäubt und springt auf drei weitere Gegner über.", "Where it lands, lightning strikes from the sky, stuns and jumps to three more enemies."], tags: ["Blitz", "Kontrolle"] },
  (P, it, o) => { nade(P, { col: "#8a8070", shape: "stone", noFuse: true, onBoom: (x, y) => {
    Z.bolts.push({ x0: x + (Math.random() - 0.5) * 20, y0: Z.cam.y - 10, x1: x, y1: y, t: 0, life: 0.3 }); A.play("thunder", { vol: 0.7 }); A.play("zap", { vol: 0.7 }); FX.flashScreen("#fff8c0", 0.25);
    blast(x, y, 40, "#f0e060", false); aoe(x, y, 40, 26 * o.m, { eff: Object.assign({ stun: 1.1 }, o.eff), kb: 40 });
    Z.chainLightning(P, x, y - 6, 16 * o.m, 3, { stun: 0.5 }, it);
  } }); });

  add("saeurephiole", { n: ["Säurephiole", "Acid Vial"], stat: "takt", find: "selten", tier: 1, cd: 12, icon: "acid", col: "#c8e050",
    d: ["Eine Lache, die Rüstung zerfrisst. Wer darin steht, nimmt 35 % mehr Schaden – von allem.", "A puddle that eats through armour. Anyone standing in it takes 35% more damage – from everything."], tags: ["Schwächen"] },
  (P, it, o) => { nade(P, { col: "#c8e050", shape: "flask", trail: "#c8e050", onBoom: (x, y) => {
    const gy = groundAt(x, y) || y; A.play("slime", { vol: 0.7 }); A.play("glass", { vol: 0.5 });
    FX.burst(x, gy - 2, 16, { col: ["#c8e050", "#8aa030"], sp: 110, ang: -Math.PI / 2, spread: 2.4, life: 0.5, size: 2, kind: "drop", g: 400 });
    field({ x, y: gy, w: 96, hgt: 30, life: 6, rate: 0.5, on: (e, tick) => { e.acidT = Math.max(e.acidT || 0, 1.5); if (tick) Z.hitEnemy(e, 2 * o.m, { dot: true, col: "#c8e050", src: "skill" }); },
      draw: (f, c, t) => { const k = Math.min(1, (f.life - f.t) * 2, f.t * 6); c.save(); c.globalAlpha = 0.7 * k; c.fillStyle = "#a8c040"; c.beginPath(); c.ellipse(f.x, f.y - 1, f.w / 2, 3, 0, 0, 6.283); c.fill(); c.fillStyle = "#e0f080"; for (let i = 0; i < 5; i++) { const xx = f.x - f.w / 2 + ((i * 23 + t * 9) % f.w); circ(c, xx, f.y - 2 - Math.abs(Math.sin(t * 3 + i)) * 2, 1.2, "#e0f080"); } c.restore(); } });
  } }); });

  add("streubombe", { n: ["Streubombe", "Cluster Bomb"], stat: "brut", find: "selten", tier: 1, cd: 14, icon: "cluster", col: "#ff9a3a",
    d: ["Platzt in fünf kleine Bomben, die über den Boden hüpfen und einzeln explodieren.", "Bursts into five small bombs that bounce across the floor and explode one by one."], tags: ["Explosion", "Fläche"] },
  (P, it, o) => { nade(P, { col: "#5a4a40", onBoom: (x, y) => {
    blast(x, y, 24, "#ff9a3a"); A.play("explode", { vol: 0.5, rate: 1.4 });
    for (let i = 0; i < 5; i++) G.push({ k: "nade", x, y: y - 4, vx: (i - 2) * 70 + (Math.random() - 0.5) * 30, vy: -220 - Math.random() * 120, g: 720, r: 2, t: 0, life: 0.9 + i * 0.12, col: "#ff9a3a", shape: "mini", bounce: 3, rot: 0,
      onBoom: (bx, by) => { blast(bx, by, 30, "#ff9a3a"); A.play("explode", { vol: 0.45, rate: 1.5 }); aoe(bx, by, 30, 15 * o.m, { kb: 120, kbUp: 120, eff: Object.assign({ burn: 1 }, o.eff) }); } });
  } }); });

  add("blendgranate", { n: ["Blendgranate", "Flash Grenade"], stat: "takt", find: "haeufig", tier: 0, cd: 12, icon: "flash", col: "#fff4c0",
    d: ["Ein greller Blitz: Gegner verlieren dich aus den Augen, sind verängstigt und richten 4 Sekunden lang kaum Schaden an.", "A blinding flash: enemies lose sight of you, are frightened and barely deal damage for 4 seconds."], tags: ["Kontrolle", "Schutz"] },
  (P, it, o) => { nade(P, { col: "#e8e0c0", shape: "flask", col2: "#fff", onBoom: (x, y) => {
    FX.flashScreen("#ffffff", 0.5); A.play("zap", { vol: 0.6, rate: 1.6 }); A.play("magic", { vol: 0.4, rate: 1.8 });
    FX.ring(x, y, 110, "#fff8e0", 0.35, 5); FX.burst(x, y, 30, { col: ["#ffffff", "#fff4c0"], sp: 220, life: 0.35, size: 2, kind: "spark", add: true });
    for (const e of Z.enemies) if (alive(e) && U.dist(x, y, e.x + e.w / 2, e.y + e.h / 2) < 110) { Z.addStatus(e, "weak", 4); if (!e.def.boss) { Z.addStatus(e, "fear", 1.2); e.lostT = 3; } FX.text(e.x + e.w / 2, e.y - 6, "✦", "#fff4c0"); }
  } }); });

  add("schwerkraftstein", { n: ["Schwerkraftstein", "Gravity Stone"], stat: "ueber", find: "rar", tier: 2, cd: 16, icon: "gravity", col: "#c08aff",
    d: ["Lässt alle Gegner im Umkreis hilflos schweben – und schmettert sie nach 1,6 Sekunden zu Boden.", "Makes every enemy nearby float helplessly – then slams them to the ground after 1.6 seconds."], tags: ["Kontrolle", "Gruppe"] },
  (P, it, o) => { nade(P, { col: "#6a4a8a", shape: "stone", noFuse: true, onBoom: (x, y) => {
    const list = Z.enemies.filter(e => alive(e) && !e.def.boss && U.dist(x, y, e.x + e.w / 2, e.y + e.h / 2) < 80);
    A.play("magic", { vol: 0.7, rate: 0.5 }); FX.ring(x, y, 80, "#c08aff", 0.5, 3); FX.burst(x, y, 20, { col: ["#c08aff", "#fff"], sp: 60, up: 60, life: 1, size: 2, kind: "glow", add: true });
    for (const e of list) { e.onGround = false; e.y -= 4; }
    G.push({ k: "float", list, t: 0, dmg: 24 * o.m });
  } }); });

  add("weihwasser", { n: ["Weihwasser der Erzpriesterin", "Archpriestess's Holy Water"], stat: "ueber", find: "selten", tier: 1, cd: 18, icon: "holy", col: "#ffe8a0",
    d: ["Segnet den Boden 5 Sekunden lang: Du heilst darin, Untote und Dämonen verbrennen.", "Blesses the ground for 5 seconds: you heal inside it, undead and demons burn."], tags: ["Heilung", "Fläche"] },
  (P, it, o) => { nade(P, { col: "#fff4d0", shape: "flask", col2: "#ffd27a", trail: "#ffe8a0", onBoom: (x, y) => {
    const gy = groundAt(x, y) || y; A.play("heal", { vol: 0.6 }); A.play("glass", { vol: 0.5, rate: 1.2 });
    field({ x, y: gy, w: 90, hgt: 60, life: 5, rate: 0.5,
      on: (e, tick) => { if (tick) { const holy = e.def.undead || e.def.demon; Z.hitEnemy(e, (holy ? 9 : 2.5) * o.m, { dot: true, col: "#ffe8a0", src: "skill" }); if (holy) Z.addStatus(e, "burn", 1); } },
      onPlayer: (Pl, tick) => { if (tick) Z.healPlayer(Pl.hpMax * 0.025); },
      draw: (f, c, t) => { const k = Math.min(1, (f.life - f.t) * 2, f.t * 6); c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.35 * k; const g = c.createLinearGradient(0, f.y - 60, 0, f.y); g.addColorStop(0, "rgba(255,230,150,0)"); g.addColorStop(1, "rgba(255,230,150,.8)"); c.fillStyle = g; c.fillRect(f.x - f.w / 2, f.y - 60, f.w, 60); c.globalAlpha = 0.8 * k; for (let i = 0; i < 6; i++) { const xx = f.x - f.w / 2 + ((i * 17 + t * 7) % f.w), yy = f.y - ((t * 30 + i * 13) % 56); c.fillStyle = "#fff4c0"; c.fillRect(xx, yy, 1.4, 1.4); } c.restore(); } });
  } }); });

  /* ---------- Legen & Bauen ---------- */
  add("kraehenfuesse", { n: ["Krähenfüße", "Caltrops"], stat: "takt", find: "haeufig", tier: 0, cd: 9, icon: "caltrops", col: "#a8a098",
    d: ["Streut Eisendornen vor dich: Wer darüber läuft, wird langsam und blutet. Hält 8 Sekunden.", "Scatters iron spikes ahead of you: whoever walks over them slows down and bleeds. Lasts 8 seconds."], tags: ["Falle", "Blutung"] },
  (P, it, o) => {
    const x = P.x + P.w / 2 + P.face * 40, gy = groundAt(x, P.y + P.h - 4, 60); if (gy == null) return false;
    A.play("chain", { vol: 0.5, rate: 1.4 }); const pts = []; for (let i = 0; i < 9; i++) pts.push([(Math.random() - 0.5) * 80, Math.random() * 6.283]);
    field({ x, y: gy, w: 84, life: 8, rate: 0.6, pts, on: (e, tick) => { if (e.def.fly) return; Z.addStatus(e, "slow", 0.4); if (tick) Z.hitEnemy(e, 3 * o.m, { dot: true, col: "#e04040", src: "skill", eff: Object.assign({ bleed: 1 }, o.eff) }); },
      draw: (f, c) => { c.save(); c.globalAlpha = Math.min(1, (f.life - f.t) * 2); for (const [dx, a] of f.pts) { c.save(); c.translate(f.x + dx, f.y - 1); c.rotate(a); c.strokeStyle = "#8a8480"; c.lineWidth = 1; c.beginPath(); c.moveTo(-2.5, 0); c.lineTo(2.5, 0); c.moveTo(0, -2.5); c.lineTo(0, 2); c.stroke(); c.restore(); } c.restore(); } });
  });

  add("pulverfass", { n: ["Pulverfass", "Powder Keg"], stat: "brut", find: "selten", tier: 1, cd: 22, icon: "keg", col: "#c86a2a",
    d: ["Stellt ein Fass Schwarzpulver ab. Es explodiert nach 5 Sekunden – oder sofort, wenn du draufschlägst oder schießt. Riesiger Radius, auch für dich.", "Places a keg of black powder. It explodes after 5 seconds – or instantly when you hit or shoot it. Huge radius, for you too."], tags: ["Explosion", "Glaskanone"] },
  (P, it, o) => { G.push({ k: "barrel", x: P.x + P.w / 2 + P.face * 18, y: P.y + P.h - 2, vy: 0, t: 0, life: 5, dmg: 90 * o.m, ground: false }); A.play("land", { vol: 0.5 }); });

  add("feuerturm", { n: ["Glutwerfer", "Ember Thrower"], stat: "takt", find: "selten", tier: 1, cd: 20, icon: "turretFire", col: "#ff6a1a",
    d: ["Ein kleiner Gnomen-Kessel auf drei Beinen. Wirft 10 Sekunden lang Feuerbälle auf den nächsten Gegner.", "A small gnomish kettle on three legs. Lobs fireballs at the nearest enemy for 10 seconds."], tags: ["Brand", "Begleiter"] },
  (P, it, o) => {
    const x = P.x + P.w / 2 + P.face * 14, gy = groundAt(x, P.y + P.h - 4, 40); if (gy == null) return false;
    G.push({ k: "turret", style: "fire", x, y: gy, t: 0, life: 10, cd: 0.4, rate: 1.1, range: 220, face: P.face, fire: (g, e) => { Z.aimProj("e_feuerball", g.x + g.face * 6, g.y - 12, e.x + e.w / 2, e.y + e.h / 2, { owner: "p", dmg: 11 * o.m, eff: Object.assign({ burn: 1 }, o.eff), speed: 240 }); A.play("fire", { vol: 0.35 }); } });
    A.play("anvil", { vol: 0.4, rate: 1.4 });
  });

  add("bolzenwerfer", { n: ["Zwergischer Bolzenwerfer", "Dwarven Bolt Thrower"], stat: "takt", find: "haeufig", tier: 0, cd: 18, icon: "turretBolt", col: "#c8a060",
    d: ["Ein Geschütz, das 12 Sekunden lang schnelle Bolzen verschießt. Die Bolzen durchschlagen Gegner.", "A turret that fires fast bolts for 12 seconds. The bolts pierce through enemies."], tags: ["Fernkampf", "Begleiter"] },
  (P, it, o) => {
    const x = P.x + P.w / 2 + P.face * 14, gy = groundAt(x, P.y + P.h - 4, 40); if (gy == null) return false;
    G.push({ k: "turret", style: "bolt", x, y: gy, t: 0, life: 12, cd: 0.3, rate: 0.55, range: 260, face: P.face, fire: (g, e) => { Z.aimProj("bolzen", g.x + g.face * 8, g.y - 12, e.x + e.w / 2, e.y + e.h / 2, { dmg: 7 * o.m, eff: o.eff }); A.play("bow", { vol: 0.3, rate: 1.4 }); } });
    A.play("anvil", { vol: 0.4, rate: 1.6 });
  });

  add("sprungpilz", { n: ["Sprungpilz", "Bounce Shroom"], stat: "ueber", find: "haeufig", tier: 0, cd: 10, icon: "shroom", col: "#c84a6a",
    d: ["Pflanzt einen Pilz aus dem Unterreich. Wer draufspringt, fliegt hoch – du zu neuen Wegen, Gegner hilflos in die Luft.", "Plants an Underdark mushroom. Whoever lands on it flies high – you to new paths, enemies helplessly into the air."], tags: ["Bewegung", "Kontrolle"] },
  (P, it, o) => {
    const x = P.x + P.w / 2 + P.face * (P.onGround ? 22 : 0), gy = groundAt(x, P.y + P.h - 4, 140); if (gy == null) return false;
    G.push({ k: "pad", x, y: gy, t: 0, life: 12 }); A.play("slime", { vol: 0.5, rate: 0.7 }); FX.burst(x, gy, 8, { col: ["#c84a6a", "#e8d8c0"], sp: 50, ang: -Math.PI / 2, spread: 1.6, life: 0.4, size: 2, kind: "smoke" });
  });

  add("schutzrune", { n: ["Schutzrune", "Warding Rune"], stat: "ueber", find: "selten", tier: 1, cd: 16, icon: "rune", col: "#ffd27a",
    d: ["Ein Lichtwall vor dir, 7 Sekunden lang: Er schluckt alle feindlichen Geschosse und drückt Gegner zurück.", "A wall of light ahead of you for 7 seconds: it swallows every enemy projectile and pushes enemies back."], tags: ["Schutz", "Panzer"] },
  (P, it, o) => {
    const x = P.x + P.w / 2 + P.face * 22, gy = groundAt(x, P.y + P.h - 4, 60); if (gy == null) return false;
    G.push({ k: "rune", x, y: gy, t: 0, life: 7 }); A.play("magic", { vol: 0.6 }); FX.burst(x, gy - 30, 16, { col: ["#ffd27a", "#fff"], sp: 60, life: 0.6, size: 2, kind: "glow", add: true });
  });

  add("sturmphiole", { n: ["Sturmphiole", "Storm Vial"], stat: "takt", find: "rar", tier: 2, cd: 17, icon: "tornado", col: "#d8d0c4",
    d: ["Entfesselt einen kleinen Wirbelsturm, der langsam vorwärts zieht und Gegner 3 Sekunden lang durch die Luft wirbelt.", "Unleashes a small whirlwind that drifts forward and juggles enemies through the air for 3 seconds."], tags: ["Kontrolle", "Gruppe"] },
  (P, it, o) => {
    const x = P.x + P.w / 2 + P.face * 20, gy = groundAt(x, P.y + P.h - 4, 80); if (gy == null) return false;
    G.push({ k: "tornado", x, y: gy, vx: P.face * 70, t: 0, tick: 0, dmg: 4 * o.m }); A.play("shadow", { vol: 0.6, rate: 0.6 });
  });

  /* ---------- Bewegung & Ausweichen ---------- */
  add("enterhaken", { n: ["Enterhaken", "Grappling Hook"], stat: "takt", find: "haeufig", tier: 0, cd: 5, icon: "hook", col: "#a08a6a",
    d: ["Seilwurf schräg nach oben (mit Hoch steil, mit Runter waagerecht). Trifft er eine Wand, zieht er dich hin – unverwundbar, auch mitten in der Luft. Trifft er einen Gegner, fliegst du hin und trittst zu.", "Throws a rope diagonally up (up = steep, down = level). If it hits a wall, it yanks you there – invulnerable, even in mid-air. If it hits an enemy, you fly at it and kick."], tags: ["Bewegung", "Ausweichen"] },
  (P, it, o) => {
    if (P.grapple) return false;
    const ang = inp.held.up ? -1.25 : inp.held.down ? -0.05 : -0.62, h = hand(P);
    G.push({ k: "hook", x: h.x, y: h.y, x0: h.x, y0: h.y, vx: Math.cos(ang) * 780 * P.face, vy: Math.sin(ang) * 780, range: 190, t: 0, slot: o.slot, dmg: 18 * o.m, it });
    A.play("chain", { vol: 0.5, rate: 1.2 }); P.act = null;
  });

  add("blinkstein", { n: ["Blinkstein", "Blink Stone"], stat: "takt", find: "selten", tier: 1, cd: 7, icon: "blink", col: "#ff7aa0",
    d: ["Ein Sprung durch den Schatten: 100 Schritt nach vorn, durch Gegner hindurch, unverwundbar. Wer im Weg stand, wird zerschnitten.", "A leap through shadow: 100 paces forward, through enemies, invulnerable. Whoever stood in the way is cut."], tags: ["Bewegung", "Ausweichen"] },
  (P, it, o) => {
    const dir = (inp.held.left && !inp.held.right) ? -1 : (inp.held.right && !inp.held.left) ? 1 : P.face, x0 = P.x;
    let dist = 0;
    for (let s = 4; s <= 104; s += 4) { const nx = x0 + dir * s; if (W.solidAt(nx + 1, P.y + 2) || W.solidAt(nx + P.w - 1, P.y + 2) || W.solidAt(nx + 1, P.y + P.h - 2) || W.solidAt(nx + P.w - 1, P.y + P.h - 2)) break; dist = s; }
    const x1 = x0 + dir * dist;
    const r = { x: Math.min(x0, x1), y: P.y - 4, w: Math.abs(x1 - x0) + P.w, h: P.h + 8 };
    for (const e of Z.enemies) if (alive(e) && U.overlap(r, e)) Z.hitEnemy(e, 16 * o.m, { src: "skill", it, kb: 40, eff: Object.assign({ bleed: 1 }, o.eff), dir });
    for (let i = 0; i < 8; i++) FX.p({ x: x0 + P.w / 2 + dir * dist * i / 8, y: P.y + 4 + Math.random() * P.h, vx: 0, vy: -10, life: 0.4, size: 4, col: i % 2 ? "#ff7aa0" : "#3a1a2a", kind: "smoke" });
    P.x = x1; P.face = dir; P.iframe = Math.max(P.iframe, 0.3); P.vx = dir * 120; if (!P.onGround) P.vy = Math.min(P.vy, 0);
    A.play("shadow", { vol: 0.6, rate: 1.4 }); FX.smear({ x: x0 + P.w / 2 + dir * dist / 2, y: P.y + 10, dir, r: dist / 2 + 6, a0: -0.05, a1: 0.05, th: 3, life: 0.16, col: "#ff7aa0", core: "#fff", stab: true });
  });

  add("kettenhaken", { n: ["Kettenhaken", "Chain Hook"], stat: "brut", find: "haeufig", tier: 0, cd: 8, icon: "chainhook", col: "#9a8a7a",
    d: ["Reißt den nächsten Gegner vor dir an deine Klinge und betäubt ihn. Große Gegner ziehen stattdessen dich heran.", "Yanks the nearest enemy in front of you onto your blade and stuns it. Big enemies pull you in instead."], tags: ["Kontrolle", "Einzelziel"] },
  (P, it, o) => {
    let best = null, bd = 190;
    for (const e of Z.enemies) { if (!alive(e) || e.hidden) continue; const dx = e.x + e.w / 2 - (P.x + P.w / 2); if (U.sign(dx) !== P.face && Math.abs(dx) > 6) continue; const d = Math.hypot(dx, (e.y + e.h / 2 - P.y - 12) * 1.5); if (d < bd && W.los(P.x + P.w / 2, P.y + 10, e.x + e.w / 2, e.y + e.h / 2)) { bd = d; best = e; } }
    if (!best) return false;
    A.play("chain", { vol: 0.7 });
    G.push({ k: "fx", t: 0, life: 0.18, e: best, draw: (g, c) => { const Pl = Z.player; c.strokeStyle = "#9a8a7a"; c.lineWidth = 1.4; c.setLineDash([2, 1.5]); c.beginPath(); c.moveTo(Pl.x + Pl.w / 2, Pl.y + 10); c.lineTo(g.e.x + g.e.w / 2, g.e.y + g.e.h / 2); c.stroke(); c.setLineDash([]); } });
    Z.hitEnemy(best, 10 * o.m, { src: "skill", it, kb: 0, eff: Object.assign({ stun: 1.2 }, o.eff) });
    if (big(best)) P.grapple = { e: best, t: 0, dmg: 8 * o.m, it };
    else G.push({ k: "pull", e: best, t: 0 });
  });

  add("spiegelbild", { n: ["Spiegelbild", "Mirror Image"], stat: "takt", find: "selten", tier: 1, cd: 18, icon: "mirror", col: "#c060ff",
    d: ["Ein Schatten-Ezekiel bleibt stehen und zieht 6 Sekunden lang alle Angriffe auf sich. Danach platzt er in einer Explosion.", "A shadow Ezekiel stays behind and draws all attacks for 6 seconds. Then it bursts in an explosion."], tags: ["Köder", "Explosion"] },
  (P, it, o) => {
    const a = Z.spawnAlly("spiegel", P.x, P.y, { w: P.w, h: P.h, life: 6, dmg: 30 * o.m, face: P.face }); a.ghost = false;
    P.invis = Math.max(P.invis, 0.6); A.play("magic", { vol: 0.6, rate: 0.8 });
  });

  add("bumerang", { n: ["Echos Bumerang", "Echo's Boomerang"], stat: "takt", find: "haeufig", tier: 0, cd: 6, icon: "boomerang", col: "#a07040",
    d: ["Fliegt hinaus und kommt zurück – trifft jeden Gegner auf dem Hin- und auf dem Rückweg.", "Flies out and comes back – hits every enemy on the way out and on the way back."], tags: ["Fernkampf", "Gruppe"] },
  (P, it, o) => { const h = hand(P); G.push({ k: "boomerang", x: h.x, y: h.y, vx: P.face * 360, vy: inp.held.up ? -160 : 0, sp: 380, out: 0.42, r: 7, t: 0, rot: 0, hits: new Set(), dmg: 11 * o.m, it, eff: o.eff }); A.play("swingHeavy", { vol: 0.4, rate: 1.5 }); });

  add("messerfaecher", { n: ["Messerfächer", "Knife Fan"], stat: "takt", find: "haeufig", tier: 0, cd: 7, icon: "knives", col: "#e0d8d0",
    d: ["Sieben Wurfmesser auf einmal, fächerförmig. Aus nächster Nähe treffen fast alle.", "Seven throwing knives at once, in a fan. Up close, almost all of them hit."], tags: ["Blutung", "Fernkampf"] },
  (P, it, o) => { const h = hand(P); for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.12 + (inp.held.up ? -0.5 : 0); Z.spawnProj("messer", h.x, h.y, P.face, { vx: Math.cos(a) * 470 * P.face, vy: Math.sin(a) * 470, dmg: 6 * o.m, eff: Object.assign({ bleed: 1 }, o.eff), life: 0.5 }); } A.play("swing", { vol: 0.5, rate: 1.5 }); });

  /* ======================= SCHILDE (X/Y statt Waffe) ======================= */
  const WP = Z.WEAPONS;
  const SH = {
    fassdeckel: { n: ["Fassdeckel", "Barrel Lid"], kind: "shield", stat: "ueber", find: "haeufig", tier: 0, icon: "lid", col: "#8a6a40",
      d: ["Rex hat schon reingebissen. Wenig Schutz, kleines Paradefenster – aber der Schildstoß schleudert Gegner gegen die Wand.", "Rex has already bitten into it. Little protection, small parry window – but the bash slams enemies into walls."],
      shield: { block: 0.6, parry: 0.18, bash: 9, parryStun: 1.0, bashDef: { kb: 360, kbUp: 120, wallSlam: true } }, tags: ["Rückstoß"], master: ["Meisterschaft: Gegner, die gegen eine Wand prallen, sind 2 Sekunden betäubt.", "Mastery: enemies slammed into a wall are stunned for 2 seconds."] },
    spiegelschild: { n: ["Spiegelschild", "Mirror Shield"], kind: "shield", stat: "takt", find: "selten", tier: 1, icon: "mirrorshield", col: "#e8e0d8",
      d: ["Poliert wie ein Teich. Jedes geblockte Geschoss fliegt zurück – nicht nur bei einer Parade. Der Stoß blendet.", "Polished like a pond. Every blocked projectile flies back – not just on a parry. The bash blinds."],
      shield: { block: 0.7, parry: 0.24, bash: 9, parryStun: 1.1, reflectMul: 1.6, bashEff: { weak: 3 } }, tags: ["Rückwurf", "Fernkampf-Schutz"], master: ["Meisterschaft: Zurückgeworfene Geschosse durchschlagen Gegner.", "Mastery: reflected projectiles pierce enemies."] },
    frostschild: { n: ["Frostschild vom Unterreich-See", "Frost Shield of the Underlake"], kind: "shield", stat: "ueber", find: "selten", tier: 1, only: ["see", "verlies", "keller", "hafen"], icon: "frostshield", col: "#e8f4f0",
      d: ["Kalt wie das Wasser, aus dem er kam. Paraden frieren den Angreifer ein, Blocken und Stoßen verlangsamen.", "Cold as the water it came from. Parries freeze the attacker, blocks and bashes slow them."],
      shield: { block: 0.85, parry: 0.22, bash: 10, parryStun: 0.6, bashEff: { slow: 3 } }, tags: ["Kontrolle", "Parade"], master: ["Meisterschaft: Der Schildstoß friert ebenfalls ein.", "Mastery: the bash also freezes."] },
    glockenschild: { n: ["Glockenschild", "Bell Shield"], kind: "shield", stat: "ueber", find: "selten", tier: 1, only: ["glocken", "wehrgang", "zinnen", "wachturm"], icon: "bellshield", col: "#d8a040",
      d: ["Aus einer gesprungenen Turmglocke getrieben. Jeder Stoß läutet und betäubt alles drumherum, eine Parade dröhnt durch den ganzen Raum.", "Hammered from a cracked tower bell. Every bash rings and stuns everything around, a parry booms through the whole room."],
      shield: { block: 0.9, parry: 0.2, bash: 8, parryStun: 1.4 }, tags: ["Kontrolle", "Gruppe"], master: ["Meisterschaft: Das Läuten macht Gegner verwundbar (+25 % Schaden).", "Mastery: the ringing makes enemies vulnerable (+25% damage)."] },
    funkenschild: { n: ["Funkenschild aus der Schmiede", "Forge Spark Shield"], kind: "shield", stat: "takt", find: "selten", tier: 2, only: ["schmiede", "glut", "sturm", "themberchaud"], icon: "sparkshield", col: "#f0e060",
      d: ["Kupferbeschlagen und immer ein wenig geladen. Eine Parade entlädt Kettenblitze, der Stoß schlägt Funken.", "Copper-bound and always slightly charged. A parry discharges chain lightning, the bash throws sparks."],
      shield: { block: 0.8, parry: 0.22, bash: 10, parryStun: 1.2 }, tags: ["Blitz", "Parade"], master: ["Meisterschaft: Auch jeder Block entlädt einen kleinen Blitz.", "Mastery: every block also discharges a small bolt."] },
    blutschild: { n: ["Darkin-Blutschild", "Darkin Blood Shield"], kind: "shield", stat: "brut", find: "rar", tier: 2, icon: "bloodshield", col: "#c02a3a",
      d: ["Er trinkt mit. Geblockter Schaden lässt sich durch Angriffe zurückholen, der Stoß raubt Leben, eine Parade entfacht kurz Darkin-Zorn.", "It drinks too. Blocked damage can be won back by attacking, the bash steals life, a parry briefly ignites Darkin wrath."],
      shield: { block: 0.85, parry: 0.2, bash: 14, parryStun: 1.0 }, leech: 0.3, tags: ["Erholung", "Glaskanone"], master: ["Meisterschaft: Der Zorn nach einer Parade hält doppelt so lange.", "Mastery: the wrath after a parry lasts twice as long."] },
    wurfschild: { n: ["Wurfschild", "Throwing Shield"], kind: "shield", stat: "takt", find: "selten", tier: 1, icon: "roundshield", col: "#b89a6a",
      d: ["Ein runder Schild mit scharfem Rand. Tippen wirft ihn: Er prallt durch alle Gegner und kehrt zurück – solange er fliegt, kannst du nicht blocken.", "A round shield with a sharp rim. A tap throws it: it ricochets through every enemy and returns – while it's flying, you can't block."],
      shield: { block: 0.75, parry: 0.2, bash: 13, parryStun: 1.0 }, tags: ["Fernkampf", "Gruppe"], master: ["Meisterschaft: Der Wurfschild betäubt jeden Getroffenen.", "Mastery: the throwing shield stuns everyone it hits."] },
    lavaschild: { n: ["Glutschild", "Ember Shield"], kind: "shield", stat: "brut", find: "selten", tier: 2, only: ["glut", "schmiede", "schlund"], icon: "lavashield", col: "#ff6a1a",
      d: ["Unter der Kruste glüht es noch. Wer gegen ihn schlägt, fängt Feuer; der Stoß hinterlässt brennenden Boden.", "Beneath the crust it still glows. Whoever strikes it catches fire; the bash leaves burning ground."],
      shield: { block: 0.85, parry: 0.18, bash: 11, parryStun: 1.0, bashEff: { burn: 1 } }, tags: ["Brand", "Dornen"], master: ["Meisterschaft: Paraden lösen eine Feuerwelle aus.", "Mastery: parries release a wave of fire."] },
    panzerschild: { n: ["Panzer der Seeschildkröte", "Sea Turtle Shell"], kind: "shield", stat: "ueber", find: "rar", tier: 1, only: ["hafen", "see"], icon: "turtle", col: "#6a8a5a",
      d: ["Ein ganzer Panzer auf dem Rücken: Blockt von vorn UND hinten, und mit ihm läufst du beim Blocken fast normal schnell. Kleines Paradefenster.", "A whole shell on your back: blocks from the front AND behind, and you walk almost at full speed while blocking. Small parry window."],
      shield: { block: 0.9, parry: 0.12, bash: 9, parryStun: 0.8, allround: true, move: 0.75 }, tags: ["Panzer"], master: ["Meisterschaft: Jeder Block heilt 1 % Leben.", "Mastery: every block heals 1% health."] }
  };
  for (const id in SH) WP[id] = SH[id];
  const lvl = id => (Z.metaLvl ? Z.metaLvl(id) : 0);

  Z.shieldHook = function (ev, P, o, dmg) {
    const act = P.act, id = act && act.it ? act.it.id : act && act.d ? Object.keys(WP).find(k => WP[k] === act.d) : null;
    const cx = P.x + P.w / 2, cy = P.y + 12;
    if (ev === "bashStart") {
      if (o.it && o.it.id === "wurfschild") {
        if (P.shieldOut) return false;
        const h = hand(P), it = o.it;
        const g = { k: "boomerang", x: h.x, y: h.y, vx: P.face * 420, vy: 0, sp: 440, out: 0.38, r: 8, t: 0, rot: 0, hits: new Set(), dmg: Z.dmgOf(P, it, 11) /* W38 Balance: 13 → 11 (−15 %, schild.py 8×: 2537 gegen Median 482) */, it, src: "melee", eff: lvl("wurfschild") >= 3 ? { stun: 0.8 } : { stun: 0.2 },
          draw: c => { circ(c, 0, 0, 6, "#8a6a40"); circ(c, 0, 0, 4.4, "#b89a6a"); circ(c, 0, 0, 1.6, "#e0c890"); }, onCatch: () => { P.shieldOut = null; A.play("block", { vol: 0.4, rate: 1.3 }); } };
        G.push(g); P.shieldOut = { slot: o.slot, g }; A.play("swingHeavy", { vol: 0.5, rate: 1.2 });
        return false;
      }
      return;
    }
    if (ev === "bashHit") {
      const a = o.a, e = o.e;
      if (id === "glockenschild" && !a.rang) { a.rang = true; A.play("anvil", { vol: 0.8, rate: 0.55 }); FX.ring(e.x + e.w / 2, e.y + e.h / 2, 64, "#d8a040", 0.45, 4); for (const x of Z.enemies) if (alive(x) && x !== e && U.dist(x.x, x.y, e.x, e.y) < 64) { Z.addStatus(x, "stun", 0.9); Z.hitEnemy(x, o.dmg * 0.5, { src: "skill", kb: 80 }); if (lvl(id) >= 3) Z.addStatus(x, "mark", 4); } if (lvl(id) >= 3) Z.addStatus(e, "mark", 4); }
      if (id === "funkenschild" && !a.zapped) { a.zapped = true; Z.chainLightning(P, e.x + e.w / 2, e.y + e.h / 2, o.dmg * 0.6, 2, { stun: 0.3 }, act.it); }
      if (id === "lavaschild" && !a.lit) { a.lit = true; const gy = groundAt(e.x + e.w / 2, e.y + e.h - 4, 40); if (gy != null) Z.spawnHazard({ kind: "fire", x: e.x + e.w / 2, y: gy, w: 50, life: 3, dmg: Z.dmgOf(P, act.it, 2.55) /* W38 Balance: 3 → 2,55 (−15 %) */, owner: "p", eff: { burn: 1 } }); }
      if (id === "frostschild" && lvl(id) >= 3) { Z.addStatus(e, "stun", 1.5); e.frozenT = e.st.stun; }
      if (id === "fassdeckel" && lvl(id) >= 3) e.slamStun = 2;
      return;
    }
    if (ev === "parry") {
      const at = o.attacker;
      if (id === "frostschild" && at && !at.dead) { Z.addStatus(at, "stun", 2.4); at.frozenT = at.st.stun; FX.burst(at.x + at.w / 2, at.y + at.h / 2, 16, { col: ["#ffffff", "#dfeee8"], sp: 100, life: 0.6, size: 2, kind: "shard", g: 200 }); }
      if (id === "glockenschild") { A.play("anvil", { vol: 0.9, rate: 0.45 }); FX.ring(cx, cy, 100, "#d8a040", 0.6, 5); FX.addShake(5); for (const x of Z.enemies) if (alive(x) && U.dist(x.x, x.y, P.x, P.y) < 100) { Z.addStatus(x, "stun", 1.4); if (lvl(id) >= 3) Z.addStatus(x, "mark", 4); } }
      if (id === "funkenschild") Z.chainLightning(P, cx + P.face * 8, cy, Z.dmgOf(P, act.it, 18), 4, { stun: 0.6 }, act.it);
      if (id === "blutschild") { P.wrath = Math.max(P.wrath, lvl(id) >= 3 ? 4 : 2); A.play("roar", { vol: 0.4, rate: 1.3 }); }
      if (id === "lavaschild" && lvl(id) >= 3) for (const d of [-1, 1]) Z.spawnProj("glutsichel", cx + d * 10, P.y + 10, d, { dmg: Z.dmgOf(P, act.it, 12), it: act.it });
      if (id === "spiegelschild" && o.proj && lvl(id) >= 3) o.proj.pierce = true;
      return;
    }
    if (ev === "block") {
      const at = o.attacker, sh = act.d.shield;
      if (id === "spiegelschild" && o.proj) { const p = o.proj; p.owner = "p"; p.vx *= -1.2; p.vy *= -0.4; p.dmg = Z.dmgOf(P, act.it, 10) * sh.reflectMul; p.hits = new Set(); p.reflected = true; if (lvl(id) >= 3) p.pierce = true; FX.text(cx, P.y - 8, L(["Gespiegelt!", "Reflected!"]), "#e8e0d8"); return "reflect"; }
      if (id === "frostschild" && at && !at.dead) Z.addStatus(at, "slow", 2);
      if (id === "lavaschild" && at && !at.dead && o.melee !== false) Z.addStatus(at, "burn", 2);
      if (id === "blutschild") { P.rally += dmg * sh.block * 0.8; P.rallyT = 2.5; }
      if (id === "funkenschild" && lvl(id) >= 3) Z.chainLightning(P, cx + P.face * 8, cy, Z.dmgOf(P, act.it, 8), 1, { stun: 0.2 }, act.it);
      if (id === "panzerschild" && lvl(id) >= 3) Z.healPlayer(P.hpMax * 0.01);
    }
  };
  /* Fassdeckel-Meisterschaft: Wandaufprall betäubt länger */
  const upE0 = Z.updateEnemies;
  Z.updateEnemies = function (dt) {
    upE0(dt);
    for (const e of Z.enemies) if (e.slamStun > 0) { e.slamStun -= dt; if (e.hitWall && Math.abs(e.vx) > 40) { Z.addStatus(e, "stun", 2); e.slamStun = 0; FX.text(e.x + e.w / 2, e.y - 6, L(["Bumm!", "Bonk!"]), "#ffd27a"); } }
  };

  /* ======================= SYMBOLE ======================= */
  const SI = Z.SKILL_ICON;
  Object.assign(SI, {
    frost: c => { poly(c, [-2.5, 6, 2.5, 6, 3.5, 0, 1.2, -3, -1.2, -3, -3.5, 0], "#dfeee8"); c.fillStyle = "#a8b8b0"; c.fillRect(-1.2, -6, 2.4, 3); c.strokeStyle = "#fff"; c.lineWidth = 0.8; for (let i = 0; i < 3; i++) { const a = i * 1.047; c.beginPath(); c.moveTo(Math.cos(a) * 3, 2 + Math.sin(a) * 3); c.lineTo(-Math.cos(a) * 3, 2 - Math.sin(a) * 3); c.stroke(); } },
    firepot: c => { ell(c, 0, 2, 6, 5, "#a0603a"); c.fillStyle = "#3a2a20"; c.fillRect(-3.5, -4, 7, 2); glow(c, 0, -6, 6, "rgba(255,140,40,.8)"); poly(c, [-2, -4, 0, -9, 2, -4], "#ffb040"); },
    sticky: c => { circ(c, 0, 1, 5, "#8aa030"); for (let i = 0; i < 7; i++) { const a = i * 0.9; limb(c, Math.cos(a) * 4, 1 + Math.sin(a) * 4, Math.cos(a) * 7, 1 + Math.sin(a) * 7, 1, "#c8e050"); } },
    shrapnel: c => { circ(c, 0, 0, 3.5, "#6a6058"); for (let i = 0; i < 8; i++) { const a = i * 0.785; poly(c, [Math.cos(a) * 5, Math.sin(a) * 5, Math.cos(a + 0.2) * 8.5, Math.sin(a + 0.2) * 8.5, Math.cos(a + 0.35) * 5, Math.sin(a + 0.35) * 5], "#c8c0b8"); } },
    magnet: c => { c.strokeStyle = "#c83a4a"; c.lineWidth = 3.4; c.beginPath(); c.arc(0, 1, 5, Math.PI, 0); c.stroke(); c.fillStyle = "#e8e0d0"; c.fillRect(-6.7, 1, 3.4, 3); c.fillRect(3.3, 1, 3.4, 3); },
    thunder: c => { poly(c, [-4, 2, 0, -6, 5, -1, 2, 6], "#8a8070"); poly(c, [1, -9, -2, -2, 1, -2, -1, 4, 4, -4, 1, -4, 3, -9], "#f0e060"); },
    acid: c => { poly(c, [-3, 6, 3, 6, 4, 0, 1.4, -3, -1.4, -3, -4, 0], "#c8e050"); c.fillStyle = "#e0d8c0"; c.fillRect(-1.4, -6, 2.8, 3); circ(c, -1, 2, 1, "#f0ff90"); circ(c, 1.5, 4, 0.8, "#f0ff90"); },
    cluster: c => { circ(c, 0, 0, 4, "#5a4a40"); for (let i = 0; i < 5; i++) { const a = i * 1.257 - 1.57; circ(c, Math.cos(a) * 7, Math.sin(a) * 7, 1.8, "#ff9a3a"); } },
    flash: c => { for (let i = 0; i < 8; i++) { const a = i * 0.785; limb(c, 0, 0, Math.cos(a) * (i % 2 ? 6 : 9), Math.sin(a) * (i % 2 ? 6 : 9), 1.2, "#fff4c0"); } circ(c, 0, 0, 3.5, "#ffffff"); },
    gravity: c => { poly(c, [-4, -1, 0, -5, 4.5, -2, 3, 3, -3, 3], "#6a4a8a"); glow(c, 0, 0, 9, "rgba(190,130,255,.6)"); for (let i = -1; i <= 1; i++) limb(c, i * 4, 8, i * 4, 5, 1, "#c08aff"); },
    holy: c => { poly(c, [-3, 6, 3, 6, 4, 0, 1.4, -3, -1.4, -3, -4, 0], "#fff4d0"); c.fillStyle = "#ffd27a"; c.fillRect(-0.6, -1, 1.2, 5); c.fillRect(-2, 0.6, 4, 1.2); glow(c, 0, 1, 8, "rgba(255,220,140,.6)"); },
    caltrops: c => { for (const [x, y] of [[-4, 3], [3, 4], [0, -2], [5, -3]]) { c.strokeStyle = "#a8a098"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + 3, y); c.moveTo(x, y - 3); c.lineTo(x, y + 2); c.stroke(); } },
    keg: c => { poly(c, [-5, 7, 5, 7, 6, 0, 5, -7, -5, -7, -6, 0], "#6a4426"); limb(c, -6, -3, 6, -3, 1.2, "#3a2a1a"); limb(c, -6, 3, 6, 3, 1.2, "#3a2a1a"); c.fillStyle = "#ffd27a"; c.fillRect(-0.6, -10, 1.2, 3); },
    turretFire: c => { limb(c, -5, 7, -1, 0, 1.4, "#5a4030"); limb(c, 5, 7, 1, 0, 1.4, "#5a4030"); ell(c, 0, -2, 6, 4.5, "#3a2a2a"); glow(c, 5, -2, 6, "rgba(255,120,40,.8)"); },
    turretBolt: c => { limb(c, -5, 7, -1, 0, 1.4, "#5a4030"); limb(c, 5, 7, 1, 0, 1.4, "#5a4030"); limb(c, -6, -2, 8, -2, 2.4, "#6a4a2a"); limb(c, 4, -7, 4, 3, 1.3, "#8a6a40"); },
    shroom: c => { limb(c, 0, 7, 0, 0, 3, "#e8d8c0"); ell(c, 0, -1, 8, 4.5, "#c84a6a"); for (let i = -1; i <= 1; i++) circ(c, i * 4, -2.5, 1.2, "#ffe0e8"); },
    rune: c => { c.strokeStyle = "#ffd27a"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, -8); c.lineTo(0, 8); c.moveTo(0, -4); c.lineTo(5, -8); c.moveTo(0, 0); c.lineTo(-5, -4); c.moveTo(0, 4); c.lineTo(5, 0); c.stroke(); glow(c, 0, 0, 10, "rgba(255,210,120,.4)"); },
    tornado: c => { c.strokeStyle = "#d8d0c4"; c.lineWidth = 1.4; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(i * 0.6, 6 - i * 3.4, 2 + i * 1.6, 1.3, 0, 0, 6.283); c.stroke(); } },
    hook: c => { limb(c, -7, 7, 2, -2, 0.9, "#a08a6a"); limb(c, 2, -2, 6, -6, 1.6, "#c8c0b8"); limb(c, 6, -6, 2, -7, 1.2, "#c8c0b8"); limb(c, 6, -6, 7, -2, 1.2, "#c8c0b8"); },
    blink: c => { circ(c, -4, 1, 3, "#3a1a2a"); for (let i = 0; i < 3; i++) poly(c, [-1 + i * 3, -5, 4 + i * 3, 0, -1 + i * 3, 5], i === 2 ? "#ff7aa0" : "rgba(255,122,160,.5)"); },
    chainhook: c => { for (let i = 0; i < 4; i++) { c.strokeStyle = "#9a8a7a"; c.lineWidth = 1.2; c.beginPath(); c.ellipse(-6 + i * 3.2, 4 - i * 2.4, 1.8, 1.1, -0.6, 0, 6.283); c.stroke(); } c.strokeStyle = "#c8c0b8"; c.lineWidth = 1.6; c.beginPath(); c.arc(6, -4, 3.5, -0.5, 2.6); c.stroke(); },
    mirror: c => { circ(c, -2, 0, 4, "#3a2a4a"); poly(c, [-4, -6, 0, -8, 1, -3], "#120c0e"); glow(c, 3, 0, 8, "rgba(190,90,255,.5)"); circ(c, 3, 0, 4, "rgba(192,96,255,.5)"); },
    boomerang: c => { limb(c, -7, 4, 0, -4, 2.6, "#a07040"); limb(c, 0, -4, 7, 4, 2.6, "#a07040"); },
    knives: c => { for (let i = -2; i <= 2; i++) { c.save(); c.rotate(i * 0.28); poly(c, [9, 0, 2, -1.2, 2, 1.2], "#e0d8d0"); limb(c, -1, 0, 2, 0, 1.4, "#4a3a30"); c.restore(); } }
  });
  Z.WICON = Object.assign(Z.WICON || {}, {
    lid: c => { ell(c, 1, 0, 4.5, 10, "#6a4a2a"); ell(c, 1.5, 0, 3.4, 8.6, "#8a6a40"); limb(c, 1.5, -8, 1.5, 8, 0.6, "#5a3a1a"); limb(c, -1, -5, 4, -5, 1, "#3a2a1a"); limb(c, -1, 5, 4, 5, 1, "#3a2a1a"); circ(c, 4, 3, 1, "#2a1a10"); circ(c, 4.5, 5, 0.8, "#2a1a10"); },
    mirrorshield: c => { ell(c, 1, 0, 5, 11, "#8a8478"); ell(c, 1.5, 0, 3.8, 9.4, "#e8e0d8"); poly(c, [0, -6, 2.5, -7, 1.5, 2, -0.5, 3], "rgba(255,255,255,.7)"); },
    frostshield: c => { poly(c, [-2, -11, 5, -11, 6, 2, 1.5, 11, -3, 2], "#a8b8b0"); poly(c, [-1, -9.5, 4, -9.5, 4.8, 1.5, 1.5, 9, -2, 1.5], "#e8f4f0"); limb(c, 1.5, -8, 1.5, 7, 0.6, "#ffffff"); limb(c, -1, -2, 4, -2, 0.6, "#ffffff"); },
    bellshield: c => { poly(c, [-1, -10, 4, -10, 6, 6, 7, 10, -4, 10, -3, 6], "#9a6a20"); poly(c, [0, -8.5, 3.5, -8.5, 5, 6, -2, 6], "#d8a040"); circ(c, 1.5, 8, 1.6, "#5a3a10"); },
    sparkshield: c => { ell(c, 1, 0, 5, 10.5, "#8a5a2a"); ell(c, 1.5, 0, 3.6, 9, "#c8783a"); poly(c, [2.5, -6, -0.5, 0.5, 2, 0.5, 0.5, 6, 4, -1, 1.5, -1, 3.5, -6], "#f0e060"); },
    bloodshield: c => { poly(c, [-2, -11, 5, -11, 6, 0, 1.5, 11, -3, 0], "#3a0a10"); poly(c, [-1, -9.5, 4, -9.5, 4.8, 0, 1.5, 9, -2, 0], "#8a1a24"); circ(c, 1.5, -1, 2, "#ff2a3a"); glow(c, 1.5, -1, 5, "rgba(255,40,50,.5)"); },
    roundshield: c => { circ(c, 1, 0, 9, "#6a4a2a"); circ(c, 1, 0, 7.6, "#b89a6a"); circ(c, 1, 0, 2.4, "#e0c890"); c.strokeStyle = "#e8e0d0"; c.lineWidth = 0.7; c.beginPath(); c.arc(1, 0, 8.6, 0, 6.283); c.stroke(); },
    lavashield: c => { ell(c, 1, 0, 5, 10.5, "#2a1a14"); for (let i = -6; i <= 6; i += 4) limb(c, -1, i, 4, i + 2, 0.8, "#ff6a1a"); glow(c, 1.5, 0, 7, "rgba(255,90,20,.35)"); },
    turtle: c => { ell(c, 1, 0, 6, 11, "#3a4a2a"); ell(c, 1, 0, 4.8, 9.6, "#6a8a5a"); for (const [x, y] of [[1, -5], [1, 0], [1, 5], [-1.5, -2.5], [3.5, -2.5], [-1.5, 2.5], [3.5, 2.5]]) circ(c, x, y, 1.5, "#4a6a3a"); }
  });
})();
/* Bedienhinweis für alle Schilde */
(function () { const W = window.Z.WEAPONS; for (const id in W) if (W[id].kind === "shield" && !W[id]._hint) { W[id]._hint = 1; W[id].d = [W[id].d[0] + " (Halten: blocken · Tippen: Schildstoß)", W[id].d[1] + " (Hold: block · Tap: shield bash)"]; } })();
