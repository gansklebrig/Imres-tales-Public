/* Ezekiel – The Destroyer · Effekte
   Mehr Wucht in jedem Treffer:
   – Aufprallblitz an der Trefferstelle, Schlagstriche in Schlagrichtung, Krits mit Sternblitz und Druckwelle
   – Gegner werden beim Treffer gestaucht und federn zurück
   – Getötete Gegner zerfallen als leuchtende Silhouette nach oben, Seelenfunken fliegen zu Ezekiel
   – Killketten: „Doppelt!“, „Dreifach!“, „Gemetzel!“
   – Landestaub, Sprungwölkchen, Doppelsprung-Ring, Laufstaub, Rollschlieren
   – Roter Schmerzrand am Bildschirm, wenn Ezekiel getroffen wird */
(function () {
  "use strict";
  const Z = window.Z, FX = Z.fx, A = Z.audio, L = v => Z.L(v);
  const TAU = Math.PI * 2;
  const rich = () => !Z.gq || Z.gq.level >= 1;
  let fx = [], ghosts = [], souls = [], hurtT = 0, chain = { n: 0, t: 0 }, banner = null, lastNow = 0;

  /* ---------- Treffer ---------- */
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    const n = hit0.apply(this, arguments);
    if (n > 0 && e && !(o && (o.dot || o.fx))) {
      const P = Z.player, heavy = o && (o.heavy || o.crit);
      const ex = e.x + e.w / 2, ey = e.y + e.h * 0.45;
      const dir = (o && o.dir) || (P ? (ex > P.x + P.w / 2 ? 1 : -1) : 1);
      const hx = ex - dir * e.w * 0.35;
      fx.push({ k: "flare", x: hx, y: ey, t: 0, life: heavy ? 0.14 : 0.09, r: heavy ? 16 : 10, col: o && o.crit ? "#ffd27a" : "#fff4e0" });
      fx.push({ k: "streak", x: hx, y: ey, dir, t: 0, life: 0.16, n: heavy ? 5 : 3, seed: Math.random() * 9, col: (e.def && e.def.blood) || "#ffcf9a" });
      if (o && o.crit) { fx.push({ k: "shock", x: ex, y: ey, t: 0, life: 0.3, r: 34 }); }
      e.squash = heavy ? 0.32 : 0.2; e.squashDir = dir;
    }
    return n;
  };

  /* ---------- Tode ---------- */
  const kill0 = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    const was = e && e.dead;
    const r = kill0.apply(this, arguments);
    if (e && !was && e.dead) {
      const P = Z.player;
      if (rich()) ghosts.push({ e, t: 0, life: 0.55, x: e.x, y: e.y });
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
      const n = e.def && e.def.boss ? 12 : e.elite ? 6 : 3;
      for (let i = 0; i < n; i++) souls.push({ x: cx, y: cy, vx: (Math.random() - 0.5) * 160, vy: -80 - Math.random() * 120, t: 0, delay: i * 0.05, col: e.elite ? "#ffd27a" : "#ff9a6a" });
      fx.push({ k: "pop", x: cx, y: cy, t: 0, life: 0.35, r: 10 + e.w * 0.8 });
      if (!(o && o.self) && P) {
        chain.n = chain.t > 0 ? chain.n + 1 : 1; chain.t = 2.2;
        const names = [null, null, ["Doppelt!", "Double!"], ["Dreifach!", "Triple!"], ["Vierfach!", "Quadra!"], ["Gemetzel!", "Carnage!"], ["Zerstörer!", "Destroyer!"]];
        const nm = names[Math.min(chain.n, names.length - 1)];
        if (nm) { banner = { txt: L(nm), n: chain.n, t: 0 }; A.play(chain.n >= 5 ? "roar" : "crit", { vol: 0.25 + Math.min(0.3, chain.n * 0.05), rate: 0.9 + chain.n * 0.05 }); if (chain.n >= 4) FX.slowmo(0.45, 0.18); }
      }
      if (e.def && (e.def.heavy || e.elite)) { fx.push({ k: "dust", x: cx, y: e.y + e.h, t: 0, life: 0.5, w: e.w * 2.4 }); FX.addShake(4); }
    }
    return r;
  };

  /* ---------- Schmerz ---------- */
  const hurt0 = Z.hurtPlayer;
  Z.hurtPlayer = function (dmg, o) {
    const P = Z.player, before = P ? P.hp : 0;
    const r = hurt0.apply(this, arguments);
    if (P && P.hp < before) { hurtT = 0.45; chain.t = Math.min(chain.t, 0.4); }
    return r;
  };

  /* ---------- Bewegung: Staub und Schlieren ---------- */
  let prev = { ground: true, vy: 0, air: 1, rollT: 0, stepT: 0 };
  function moveFx(dt) {
    const P = Z.player; if (!P || P.dead) return;
    const fx0 = P.x + P.w / 2, fy = P.y + P.h;
    if (P.onGround && !prev.ground && prev.vy > 260) {
      const s = Math.min(1, (prev.vy - 200) / 400);
      fx.push({ k: "dust", x: fx0, y: fy, t: 0, life: 0.45, w: 18 + s * 30 });
      FX.burst(fx0, fy - 1, 4 + Math.round(s * 8), { col: [Z.dustCol || "#8a7a70"], sp: 70 + s * 90, ang: -Math.PI / 2, spread: 2.8, life: 0.4, size: 2.4, kind: "smoke" });
    }
    if (!P.onGround && prev.ground && P.vy < -200) fx.push({ k: "puff", x: fx0, y: fy, t: 0, life: 0.3 });
    if (!P.onGround && P.airJumps < prev.air && P.vy < -150) fx.push({ k: "ring2", x: fx0, y: fy - 2, t: 0, life: 0.3 });
    if (P.rollT > 0) { if (Math.random() < 0.7) fx.push({ k: "slip", x: P.x + Math.random() * P.w, y: P.y + P.h * (0.3 + Math.random() * 0.6), vx: -P.vx * 0.2, t: 0, life: 0.22 }); }
    if (P.onGround && Math.abs(P.vx) > 120 && P.rollT <= 0) { prev.stepT -= dt; if (prev.stepT <= 0) { prev.stepT = 0.24; FX.p({ x: fx0 - Math.sign(P.vx) * 4, y: fy - 1, vx: -Math.sign(P.vx) * 20, vy: -12, life: 0.35, size: 2, col: Z.dustCol || "#8a7a70", kind: "smoke", a: 0.6 }); } }
    prev.ground = P.onGround; prev.vy = P.vy; prev.air = P.airJumps;
  }

  /* ---------- Gestaucht zeichnen ---------- */
  const de0 = Z.drawEnemy;
  Z.drawEnemy = function (c, e, t) {
    if (e.squash > 0 && !e.dead) {
      const s = e.squash, fx0 = e.x + e.w / 2, fy = e.y + e.h;
      c.save(); c.translate(fx0, fy); c.scale(1 + s * 0.5, 1 - s * 0.45); c.translate(-fx0, -fy);
      const r = de0.apply(this, arguments); c.restore(); return r;
    }
    return de0.apply(this, arguments);
  };

  /* ---------- Weltraum-Zeichnen (nach dem Spieler) ---------- */
  function step(dt) {
    for (const f of fx) { f.t += dt; if (f.k === "slip") f.x += f.vx * dt; }
    fx = fx.filter(f => f.t < f.life);
    for (const g of ghosts) g.t += dt; ghosts = ghosts.filter(g => g.t < g.life);
    const P = Z.player;
    for (const s of souls) {
      s.t += dt; if (s.t < s.delay) continue;
      if (s.t < 0.35 + s.delay || !P) { s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.92; s.vy *= 0.92; }
      else { const tx = P.x + P.w / 2, ty = P.y + P.h * 0.4, dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy) || 1, sp = 260 + (s.t - 0.35) * 600; s.x += dx / d * Math.min(d, sp * dt); s.y += dy / d * Math.min(d, sp * dt); if (d < 6) { s.done = true; FX.burst(tx, ty, 3, { col: [s.col, "#fff"], sp: 50, life: 0.25, size: 1.4, kind: "spark", add: true }); } }
      if (Math.random() < 0.5) FX.p({ x: s.x, y: s.y, vx: 0, vy: 0, life: 0.25, size: 1.4, col: s.col, kind: "glow", add: true });
    }
    souls = souls.filter(s => !s.done && s.t < 3);
    for (const e of Z.enemies) if (e.squash > 0) e.squash = Math.max(0, e.squash - dt * 2.4);
    if (chain.t > 0) chain.t -= dt;
    if (banner) { banner.t += dt; if (banner.t > 1.3) banner = null; }
    if (hurtT > 0) hurtT -= dt;
    moveFx(dt);
  }
  function drawWorld(c, t) {
    c.save();
    /* Zerfallende Silhouetten */
    for (const g of ghosts) {
      const u = g.t / g.life, e = g.e;
      c.save(); c.globalAlpha = (1 - u) * 0.4; c.globalCompositeOperation = "lighter";
      const fx0 = e.x + e.w / 2, fy = e.y + e.h; c.translate(fx0, fy - u * 14); c.scale(1 - u * 0.3, 1 + u * 0.5); c.translate(-fx0, -fy);
      try { const dd = e.dead; e.dead = false; de0.call(null, c, e, t); e.dead = dd; } catch (err) {}
      c.restore();
    }
    for (const f of fx) {
      const u = f.t / f.life;
      if (f.k === "flare") {
        c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 1 - u; c.fillStyle = f.col; c.translate(f.x, f.y); c.rotate(0.4);
        const r = f.r * (0.6 + u * 0.6);
        for (let k = 0; k < 2; k++) { c.rotate(Math.PI / 2 * k + 0.3); c.beginPath(); c.moveTo(-r, 0); c.lineTo(0, r * 0.12); c.lineTo(r, 0); c.lineTo(0, -r * 0.12); c.closePath(); c.fill(); }
        const g = c.createRadialGradient(0, 0, 0, 0, 0, r * 0.6); g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 0.6, 0, TAU); c.fill();
        c.restore();
      } else if (f.k === "streak") {
        c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = f.col; c.lineCap = "round";
        for (let k = 0; k < f.n; k++) { const a = (Math.sin(f.seed + k * 2.3) * 0.7), len = 10 + ((f.seed * 7 + k * 13) % 14), d0 = 4 + u * 26, d1 = d0 + len * (1 - u); c.globalAlpha = (1 - u) * 0.9; c.lineWidth = 1.6 * (1 - u) + 0.3; c.beginPath(); c.moveTo(f.x + f.dir * Math.cos(a) * d0, f.y + Math.sin(a) * d0); c.lineTo(f.x + f.dir * Math.cos(a) * d1, f.y + Math.sin(a) * d1); c.stroke(); }
        c.restore();
      } else if (f.k === "shock") {
        c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = (1 - u) * 0.8; c.strokeStyle = "#ffd27a"; c.lineWidth = 3 * (1 - u) + 0.5; c.beginPath(); c.arc(f.x, f.y, 6 + f.r * u, 0, TAU); c.stroke();
        c.globalAlpha = (1 - u) * 0.6; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; c.beginPath(); c.moveTo(f.x + Math.cos(a) * (10 + f.r * u), f.y + Math.sin(a) * (10 + f.r * u)); c.lineTo(f.x + Math.cos(a) * (18 + f.r * u * 1.4), f.y + Math.sin(a) * (18 + f.r * u * 1.4)); c.stroke(); }
        c.restore();
      } else if (f.k === "pop") {
        c.save(); c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * (0.5 + u)); g.addColorStop(0, "rgba(255,200,140," + 0.6 * (1 - u) + ")"); g.addColorStop(1, "rgba(255,120,60,0)"); c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y, f.r * (0.5 + u), 0, TAU); c.fill(); c.restore();
      } else if (f.k === "dust") {
        c.save(); c.fillStyle = Z.dustCol || "#8a7a70";
        for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const d = f.w * 0.5 * (0.3 + u) + k * 5, r = (3 + k) * (1 - u * 0.6); c.globalAlpha = (1 - u) * (0.5 - k * 0.12); c.beginPath(); c.arc(f.x + s * d, f.y - 2 - k * 1.5 - u * 4, r, 0, TAU); c.fill(); }
        c.restore();
      } else if (f.k === "puff") {
        c.save(); c.globalAlpha = (1 - u) * 0.45; c.fillStyle = Z.dustCol || "#8a7a70"; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(f.x + s * (4 + u * 8), f.y - 1, 3 + u * 3, 1.6 + u, 0, 0, TAU); c.fill(); } c.restore();
      } else if (f.k === "ring2") {
        c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = (1 - u) * 0.8; c.strokeStyle = "#ffd8a8"; c.lineWidth = 1.4; c.beginPath(); c.ellipse(f.x, f.y, 4 + u * 16, 1.5 + u * 4, 0, 0, TAU); c.stroke(); c.restore();
      } else if (f.k === "slip") {
        c.save(); c.globalAlpha = (1 - u) * 0.35; c.strokeStyle = "#ffe8d0"; c.lineWidth = 1; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x - (Z.player ? Math.sign(Z.player.vx) : 1) * 10, f.y); c.stroke(); c.restore();
      }
    }
    /* Angriffe lesbar machen: Aufblitzen kurz vor dem Schlag, Hiebspur während des Schlags */
    const cam = Z.cam;
    for (const e of Z.enemies) {
      const ac = e.act; if (!ac || e.dead || !ac.a || !ac.a.box) continue;
      if (e.x < cam.x - 40 || e.x > cam.x + cam.w + 40) continue;
      const a = ac.a, sz = e.size || 1, [bx, by, bw, bh] = a.box.map(v => v * sz), cx = e.x + e.w / 2, fy = e.y + e.h;
      const hx = e.face > 0 ? cx + bx : cx - bx - bw, hy = fy + by;
      const unbl = a.unblockable, col = unbl ? "#ff3a6a" : "#ffb040";
      if (ac.phase === "pre") {
        const left = a.pre - ac.t;
        if (left < 0.2 && left > 0) { const u = 1 - left / 0.2, gx = e.face > 0 ? hx + bw * 0.6 : hx + bw * 0.4, gy = hy + bh * 0.3; c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = Math.sin(u * Math.PI); c.fillStyle = unbl ? "#ff6a8a" : "#fff0c0"; c.translate(gx, gy); c.rotate(u * 1.5); for (let k = 0; k < 2; k++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(-7, 0); c.lineTo(0, 1); c.lineTo(7, 0); c.lineTo(0, -1); c.fill(); } c.restore(); }
      } else if (ac.phase === "act" && ac.t < 0.14 && !["shoot", "lob", "web", "volley", "summon", "heal", "beam", "mark"].includes(a.k)) {
        const u = ac.t / 0.14; c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = (1 - u) * 0.7; c.strokeStyle = col; c.lineCap = "round";
        const r = Math.max(bw, bh) * 0.62, ox = hx + bw / 2 - e.face * bw * 0.2, oy = hy + bh * 0.55;
        for (let k = 0; k < 3; k++) { c.lineWidth = (3 - k) * 1.2; c.beginPath(); const a0 = e.face > 0 ? -1.9 : Math.PI + 1.9, a1 = e.face > 0 ? 0.6 : Math.PI - 0.6; c.arc(ox, oy, r - k * 2, Math.min(a0, a1) + (e.face > 0 ? u * 0.6 : 0), Math.max(a0, a1) - (e.face > 0 ? 0 : u * 0.6), e.face < 0); c.stroke(); }
        c.restore();
      }
    }
    /* Seelenfunken */
    c.globalCompositeOperation = "lighter";
    for (const s of souls) { if (s.t < s.delay) continue; const g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, 5); g.addColorStop(0, "rgba(255,240,210,.95)"); g.addColorStop(0.4, s.col); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.beginPath(); c.arc(s.x, s.y, 5, 0, TAU); c.fill(); }
    c.restore();
  }
  function drawScreen(c, W, H) {
    if (hurtT > 0 && Z.settings.flashes !== false) {
      const a = Math.min(1, hurtT / 0.45) * 0.55;
      const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, "rgba(120,0,0,0)"); g.addColorStop(1, "rgba(150,10,10," + a + ")"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
    if (banner) {
      const u = banner.t / 1.3, a = u < 0.12 ? u / 0.12 : u > 0.75 ? (1 - u) / 0.25 : 1, s = 1 + (u < 0.12 ? (1 - u / 0.12) * 0.6 : 0);
      const fs = Math.max(14, Math.min(W, H) * 0.045) * s * (1 + Math.min(0.5, (banner.n - 2) * 0.1));
      const fd = getComputedStyle(document.documentElement).getPropertyValue("--fd") || "serif";
      c.save(); c.globalAlpha = a; c.textAlign = "right"; c.textBaseline = "middle"; c.font = Math.round(fs) + "px " + fd;
      const x = W - W * 0.04, y = H * 0.26;
      c.shadowColor = banner.n >= 5 ? "#ff3a2a" : "#ff9a3a"; c.shadowBlur = fs * 0.5; c.fillStyle = banner.n >= 5 ? "#ffb0a0" : "#ffd8a0";
      c.fillText(banner.txt, x + (Math.random() - 0.5) * (banner.n >= 5 ? 3 : 0), y);
      c.shadowBlur = 0; c.font = "700 " + Math.round(fs * 0.45) + "px " + (getComputedStyle(document.documentElement).getPropertyValue("--fb") || "sans-serif"); c.fillStyle = "#e8d8c8"; c.fillText("× " + banner.n, x, y + fs * 0.72);
      c.restore();
    }
  }
  const dp0 = Z.drawProjs;
  Z.drawProjs = function (c) {
    if (dp0) dp0.apply(this, arguments);
    const now = performance.now(), raw = Math.min(0.05, (now - (lastNow || now)) / 1000); lastNow = now;
    const dt = Z.paused || (Z.ui && Z.ui.modalOpen) ? 0 : raw * (FX.slow > 0 ? FX.slow : 1);
    step(dt);
    drawWorld(c, Z.gfx.time || 0);
  };
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W, H, t) {
    if (al0) al0.apply(this, arguments);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); drawScreen(c, W, H); c.restore();
  };
  const load0 = Z.loadArea;
  Z.loadArea = function () { fx = []; ghosts = []; souls = []; chain = { n: 0, t: 0 }; banner = null; return load0.apply(this, arguments); };
})();
