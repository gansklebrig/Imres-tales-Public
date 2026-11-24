/* Ezekiel – The Destroyer · Effekte
   Mehr Wucht in jedem Treffer:
   – Aufprallblitz an der Trefferstelle, Schlagstriche in Schlagrichtung
   – Treffer-Funken je Material: Metall sprüht Funken, Knochen splittert, Fleisch versprüht Glut, Stein staubt,
     Glas klirrt, Geister zerfasern, Holz splittert
   – Krits: Standbild-Ring (hält während des Trefferstopps scharf still, dann platzt er auf) mit Sternblitz
   – Paraden: Glanzblitz am Schild, Zeitlupe und Zeitlinien am Bildrand; perfektes Ausweichen: leichte Zeitlinien
   – Gegner werden beim Treffer gestaucht und federn zurück
   – Getötete Gegner zerfallen als leuchtende Silhouette nach oben, zerbrechen passend zum Material,
     Seelenfunken fliegen in geschwungenen Bahnen mit Schweif zu Ezekiel
   – Killketten: „Doppelt!“, „Dreifach!“, „Gemetzel!“
   – Landestaub, Sprungwölkchen, Doppelsprung-Ring, Laufstaub, Rollschlieren
   – Roter Schmerzrand am Bildschirm, wenn Ezekiel getroffen wird
   Leistung: alle Verläufe sind vorgerenderte Sprites (keine Gradients pro Bild); Grafikstufe 0 spart Zusatzteile. */
(function () {
  "use strict";
  const Z = window.Z, FX = Z.fx, A = Z.audio, L = v => Z.L(v);
  const TAU = Math.PI * 2;
  const rich = () => !Z.gq || Z.gq.level >= 1 || (Z.gq.level === -1 && Z.gq.part >= 0.3);
  const low = () => !rich();
  const spr = col => Z.glowSprite(col);
  let fx = [], ghosts = [], souls = [], hurtT = 0, chain = { n: 0, t: 0 }, banner = null, lastNow = 0, lines = null;

  /* ---------- Material der Gegner ---------- */
  function matOf(e) {
    const d = e.def || {}, sh = d.shape;
    if (d.mat) return d.mat;
    if (sh === "skel") return "bone";
    if (sh === "armor" || sh === "duergar" || d.helm || d.shield) return "metal";
    if (sh === "golem" || sh === "golemBig") return "stone";
    if (sh === "blob") return d.glow ? "ember" : "glass";
    if (sh === "wraith" || sh === "wisp") return "spirit";
    if (sh === "crab") return "shell";
    if (sh === "dummy" || sh === "blight") return "wood";
    return "flesh";
  }
  Z.matOf = matOf;
  const MAT = {
    metal: { col: ["#fff6d8", "#ffd27a", "#ffb040"], kind: "spark", n: 8, sp: 170, g: 520, size: 1.6, life: 0.32, add: true },
    bone: { col: ["#efe8d8", "#d8d0bc", "#b8ae98"], kind: "shard", n: 5, sp: 120, g: 620, size: 1.4, life: 0.5 },
    flesh: { col: ["#ff7a3a", "#ffb060", "#e0402a"], kind: "glow", n: 5, sp: 100, g: 260, size: 1.7, life: 0.4, add: true },
    stone: { col: ["#8a8278", "#a89e90", "#6a6258"], kind: "shard", n: 5, sp: 100, g: 600, size: 1.6, life: 0.5, dust: true },
    glass: { col: ["#f0f8f0", "#d0e8d8", "#ffffff"], kind: "shard", n: 6, sp: 130, g: 560, size: 1.2, life: 0.45 },
    spirit: { col: ["#e8e0d8", "#c8b8c8", "#fff0e0"], kind: "glow", n: 5, sp: 50, g: -40, size: 2, life: 0.55, add: true },
    shell: { col: ["#c88a6a", "#e8c0a0", "#fff0d0"], kind: "shard", n: 4, sp: 110, g: 560, size: 1.4, life: 0.45 },
    wood: { col: ["#8a6a42", "#b08a5a", "#5a4228"], kind: "shard", n: 5, sp: 110, g: 560, size: 1.5, life: 0.5 },
    ember: { col: ["#ffd27a", "#ff8a2a", "#ff5a1a"], kind: "glow", n: 6, sp: 110, g: 200, size: 1.8, life: 0.45, add: true }
  };
  const MATL = { metal: "#ffe0a0", bone: "#f0e4d0", flesh: "#ff9a5a", stone: "#d8c8b0", glass: "#e8fff0", spirit: "#e8d8f0", shell: "#ffd0a8", wood: "#ffcc90", ember: "#ff8a30" };
  const rich2 = () => !Z.gq || Z.gq.level >= 2 || (Z.gq.level === -1 && Z.gq.layers !== false);
  /* Staubwolke mit Volumen: vorgerenderter Bausch (oben hell angestrahlt, unten dunkel), in Bildschirmauflösung skaliert */
  const puffCache = {};
  function puffSpr(col) {
    if (puffCache[col]) return puffCache[col];
    const cv = document.createElement("canvas"); cv.width = cv.height = 48; const g = cv.getContext("2d"), n = parseInt(col.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const gr = g.createRadialGradient(24, 26, 2, 24, 24, 23); gr.addColorStop(0, "rgba(" + r + "," + gg + "," + b + ",.9)"); gr.addColorStop(0.65, "rgba(" + r + "," + gg + "," + b + ",.55)"); gr.addColorStop(1, "rgba(" + r + "," + gg + "," + b + ",0)");
    g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
    g.globalCompositeOperation = "source-atop"; const lg = g.createLinearGradient(0, 4, 0, 44); lg.addColorStop(0, "rgba(255,244,230,.35)"); lg.addColorStop(0.45, "rgba(255,244,230,0)"); lg.addColorStop(0.7, "rgba(0,0,0,0)"); lg.addColorStop(1, "rgba(0,0,0,.35)"); g.fillStyle = lg; g.fillRect(0, 0, 48, 48);
    return (puffCache[col] = cv);
  }
  function cloud(x, y, w, col, life) {
    if (!rich2()) return;
    const n = Math.max(4, Math.min(10, Math.round(w / 6))), P = [];
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n - 0.5; P.push({ x: x + u * w * 0.8, y: y - 2 - Math.random() * 3, vx: u * (40 + Math.random() * 30), vy: -6 - Math.random() * 14, r: 3 + Math.random() * 3 + (1 - Math.abs(u) * 2) * 3 }); }
    fx.push({ k: "cloud", t: 0, life: life || 0.9, p: P, col: col || "#8a7a70" });
  }
  function hexOf(c) { if (!c) return "#8a7a70"; if (c[0] === "#" && c.length === 7) return c; const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(c); return m ? "#" + [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, "0")).join("") : "#8a7a70"; }
  function matBurst(e, x, y, dir, heavy, scale) {
    const m = MAT[matOf(e)] || MAT.flesh, k = (heavy ? 1.5 : 1) * (scale || 1) * (low() ? 0.5 : 1);
    const n = Math.max(1, Math.round(m.n * k));
    /* Funken fliegen bevorzugt in Schlagrichtung weg */
    FX.burst(x, y, n, { col: m.col, sp: m.sp * (heavy ? 1.25 : 1), ang: dir > 0 ? -0.35 : Math.PI + 0.35, spread: 2.4, life: m.life, size: m.size, kind: m.kind, g: m.g, add: m.add, drag: 0.93 });
    if (m.dust) FX.burst(x, y, Math.max(1, Math.round(3 * k)), { col: ["#7a7268", "#948a7e"], sp: 40, life: 0.6, size: 2.6, kind: "smoke", g: -20 });
    if (matOf(e) === "flesh" && e.def && e.def.blood) FX.burst(x, y, Math.max(1, Math.round(2 * k)), { col: e.def.blood, sp: 80, ang: dir > 0 ? -0.2 : Math.PI + 0.2, spread: 1.6, life: 0.4, size: 1.5, g: 500, drag: 0.95 });
  }

  /* ---------- Treffer ---------- */
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    const n = hit0.apply(this, arguments);
    if (n > 0 && e && !(o && (o.dot || o.fx))) {
      const P = Z.player, heavy = o && (o.heavy || o.crit);
      const ex = e.x + e.w / 2, ey = e.y + e.h * 0.45;
      const dir = (o && o.dir) || (P ? (ex > P.x + P.w / 2 ? 1 : -1) : 1);
      const hx = ex - dir * e.w * 0.35;
      const mat = matOf(e);
      const fcol = o && o.crit ? "#ffd27a" : mat === "metal" ? "#fffbe8" : mat === "flesh" ? "#ffe0c0" : "#fff4e0";
      fx.push({ k: "flare", x: hx, y: ey, t: 0, life: heavy ? 0.14 : 0.09, r: heavy ? 16 : 10, col: fcol, rot: Math.random() });
      fx.push({ k: "streak", x: hx, y: ey, dir, t: 0, life: 0.16, n: heavy ? 5 : 3, seed: Math.random() * 9, col: mat === "metal" ? "#ffe8b0" : (e.def && e.def.blood) || "#ffcf9a" });
      matBurst(e, hx, ey, dir, heavy);
      /* der Treffer leuchtet kurz in die Umgebung (Farblicht ab Stufe 1) */
      if (rich() && Z.lightFlash) Z.lightFlash(hx, ey, heavy ? 72 : 46, MATL[mat] || "#ffd8a0", heavy ? 0.7 : 0.42, heavy ? 0.24 : 0.16);
      if (o && o.crit) {
        /* Standbild-Ring: hält während des Trefferstopps still, dann platzt er auf */
        const hold = Math.max(0.06, Math.min(0.14, FX.hitstop || 0));
        fx.push({ k: "crit", x: hx, y: ey, t: 0, hold, life: hold + 0.3, r: 30 + Math.min(20, e.w * 0.6), rot: Math.random() * TAU });
      }
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
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        souls.push({ x: cx, y: cy, vx: Math.cos(a) * (90 + Math.random() * 90), vy: Math.sin(a) * (90 + Math.random() * 90), t: 0, delay: i * 0.05, col: e.elite ? "#ffd27a" : "#ff9a6a", sw: (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.6), tr: [] });
      }
      fx.push({ k: "pop", x: cx, y: cy, t: 0, life: 0.35, r: 10 + e.w * 0.8 });
      /* Zerbrechen passend zum Material */
      deathBurst(e, cx, cy);
      { const m = matOf(e); if (m !== "spirit" && m !== "ember") cloud(cx, e.y + e.h, Math.max(14, e.w * 1.6), m === "stone" ? "#8a8278" : m === "bone" ? "#b8ae98" : hexOf(Z.dustCol), e.def && e.def.boss ? 1.6 : 0.9); }
      if (rich() && Z.lightFlash) Z.lightFlash(cx, cy, 60 + e.w, e.elite ? "#ffd27a" : "#ff9a6a", 0.5, 0.3);
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
  function deathBurst(e, cx, cy) {
    const m = matOf(e), s = Math.max(1, Math.min(3, (e.w + e.h) / 30)) * (low() ? 0.5 : 1), fy = e.y + e.h;
    const R = n => Math.max(1, Math.round(n * s));
    if (m === "bone") FX.burst(cx, cy, R(8), { col: ["#efe8d8", "#d0c8b4"], sp: 110, ang: -Math.PI / 2, spread: 2.6, life: 0.7, size: 1.8, kind: "shard", g: 640, drag: 0.96 });
    else if (m === "metal") { FX.burst(cx, cy, R(6), { col: ["#8a8e98", "#6a6e78", "#b8bcc4"], sp: 120, ang: -Math.PI / 2, spread: 2.4, life: 0.7, size: 2.4, kind: "shard", g: 700, drag: 0.96 }); FX.burst(cx, cy, R(6), { col: ["#fff2c0", "#ffb040"], sp: 150, life: 0.3, size: 1.4, kind: "spark", g: 400, add: true }); }
    else if (m === "stone") { FX.burst(cx, cy, R(7), { col: ["#6a6258", "#8a8278", "#4a443e"], sp: 100, ang: -Math.PI / 2, spread: 2.6, life: 0.7, size: 2.8, kind: "shard", g: 700, drag: 0.96 }); FX.burst(cx, fy - 2, R(4), { col: ["#7a7268", "#948a7e"], sp: 50, life: 0.7, size: 2.2, kind: "smoke", g: -15 }); }
    else if (m === "glass") { FX.burst(cx, cy, R(9), { col: ["#f0f8f0", "#ffffff", "#d0e8d8"], sp: 140, life: 0.5, size: 1.3, kind: "shard", g: 560 }); FX.burst(cx, cy, R(5), { col: (e.def && e.def.c) || "#8ad0a0", sp: 90, life: 0.5, size: 1.6, g: 500, drag: 0.95 }); }
    else if (m === "spirit") FX.burst(cx, cy, R(8), { col: ["#e8e0d8", "#c8b8c8", "#fff0e0"], sp: 40, ang: -Math.PI / 2, spread: 1.6, life: 0.9, size: 2.4, kind: "glow", g: -60, add: true });
    else if (m === "wood") FX.burst(cx, cy, R(7), { col: ["#8a6a42", "#b08a5a"], sp: 110, ang: -Math.PI / 2, spread: 2.6, life: 0.6, size: 1.8, kind: "shard", g: 600 });
    else if (m === "ember") FX.burst(cx, cy, R(8), { col: ["#ffd27a", "#ff8a2a", "#ff5a1a"], sp: 120, life: 0.6, size: 2, kind: "glow", g: 220, add: true });
    else { FX.burst(cx, cy, R(5), { col: ["#ff8a3a", "#ffc070"], sp: 90, ang: -Math.PI / 2, spread: 2.2, life: 0.55, size: 1.6, kind: "glow", g: 120, add: true }); FX.burst(cx, cy, R(2), { col: ["#4a3a34", "#5a4a40"], sp: 30, life: 0.6, size: 1.8, kind: "smoke", g: -20 }); }
  }

  /* ---------- Schmerz ---------- */
  const hurt0 = Z.hurtPlayer;
  Z.hurtPlayer = function (dmg, o) {
    const P = Z.player, before = P ? P.hp : 0;
    const r = hurt0.apply(this, arguments);
    if (P && P.hp < before) { hurtT = 0.45; chain.t = Math.min(chain.t, 0.4); }
    return r;
  };

  /* ---------- Parade: Glanzblitz, Zeitlupe, Zeitlinien ---------- */
  const sh0 = Z.shieldHook;
  Z.shieldHook = function (ev, P, o, dmg) {
    const r = sh0 ? sh0.apply(this, arguments) : undefined;
    if (ev === "parry" && P) {
      const x = P.x + P.w / 2 + P.face * 8, y = P.y + 12;
      fx.push({ k: "glint", x, y, t: 0, life: 0.45, rot: 0.2 });
      lines = { t: 0, life: 0.55, x, y, strong: true, seed: Math.random() * 10 };
      if (!(FX.slow > 0 && FX.slow < 0.5)) FX.slowmo(0.4, 0.22);
    }
    return r;
  };

  /* ---------- Bewegung: Staub und Schlieren ---------- */
  let prev = { ground: true, vy: 0, air: 1, rollT: 0, stepT: 0, dodged: false };
  function moveFx(dt) {
    const P = Z.player; if (!P || P.dead) return;
    const fx0 = P.x + P.w / 2, fy = P.y + P.h;
    if (P.onGround && !prev.ground && prev.vy > 260) {
      const s = Math.min(1, (prev.vy - 200) / 400);
      fx.push({ k: "dust", x: fx0, y: fy, t: 0, life: 0.45, w: 18 + s * 30 });
      FX.burst(fx0, fy - 1, 4 + Math.round(s * 8), { col: [Z.dustCol || "#8a7a70"], sp: 70 + s * 90, ang: -Math.PI / 2, spread: 2.8, life: 0.4, size: 2.4, kind: "smoke" });
      if (s > 0.5) { fx.push({ k: "ring2", x: fx0, y: fy - 1, t: 0, life: 0.28, wide: true }); cloud(fx0, fy, 20 + s * 30, hexOf(Z.dustCol), 0.7); }
    }
    if (!P.onGround && prev.ground && P.vy < -200) fx.push({ k: "puff", x: fx0, y: fy, t: 0, life: 0.3 });
    if (!P.onGround && P.airJumps < prev.air && P.vy < -150) fx.push({ k: "ring2", x: fx0, y: fy - 2, t: 0, life: 0.3 });
    if (P.rollT > 0) { if (Math.random() < 0.7) fx.push({ k: "slip", x: P.x + Math.random() * P.w, y: P.y + P.h * (0.3 + Math.random() * 0.6), vx: -P.vx * 0.2, t: 0, life: 0.22 }); }
    if (P.onGround && Math.abs(P.vx) > 120 && P.rollT <= 0) { prev.stepT -= dt; if (prev.stepT <= 0) { prev.stepT = 0.24; FX.p({ x: fx0 - Math.sign(P.vx) * 4, y: fy - 1, vx: -Math.sign(P.vx) * 20, vy: -12, life: 0.35, size: 2, col: Z.dustCol || "#8a7a70", kind: "smoke", a: 0.6 }); } }
    /* perfektes Ausweichen: leichte Zeitlinien */
    if (P.dodged && !prev.dodged && !(lines && lines.strong && lines.t < lines.life)) lines = { t: 0, life: 0.4, x: fx0, y: P.y + P.h / 2, strong: false, seed: Math.random() * 10 };
    prev.ground = P.onGround; prev.vy = P.vy; prev.air = P.airJumps; prev.dodged = !!P.dodged;
  }

  /* ---------- Gestaucht zeichnen ---------- */
  const de0 = Z.drawEnemy;
  Z.drawEnemy = function (c, e, t) {
    if (e.squash > 0 && !e.dead) {
      const s = e.squash, fx0 = e.x + e.w / 2, fy = e.y + e.h;
      /* gedämpftes Nachfedern statt linearem Zurückgehen */
      const k = s / 0.32, osc = Math.cos((1 - k) * 9) * k;
      c.save(); c.translate(fx0, fy); c.scale(1 + osc * 0.16 * (s > 0.2 ? 1.4 : 1), 1 - osc * 0.14 * (s > 0.2 ? 1.4 : 1)); c.translate(-fx0, -fy);
      const r = de0.apply(this, arguments); c.restore(); return r;
    }
    return de0.apply(this, arguments);
  };

  /* ---------- Spieler-Wischspur aus dem Kern dämpfen, wenn die Figur ihre eigene Klingenspur zeichnet ---------- */
  const sm0 = FX.smear;
  FX.smear = function (o) {
    if (o && o.core === "#fff6e0" && rich() && Z.player && Z.player.act && Z.player.act.type === "melee") { o.a = (o.a || 0.9) * 0.42; o.th = (o.th || 6) * 0.75; }
    return sm0.apply(this, arguments);
  };

  /* ---------- Fortschreiben ---------- */
  function step(dt) {
    for (const f of fx) { f.t += dt; f.dt = dt; if (f.k === "slip") f.x += f.vx * dt; }
    fx = fx.filter(f => f.t < f.life);
    for (const g of ghosts) g.t += dt; ghosts = ghosts.filter(g => g.t < g.life);
    const P = Z.player;
    for (const s of souls) {
      s.t += dt; if (s.t < s.delay) continue;
      const tt = s.t - s.delay;
      if (tt < 0.3 || !P) { s.x += s.vx * dt; s.y += s.vy * dt; const dr = Math.pow(0.0009, dt); s.vx *= dr; s.vy *= dr; }
      else {
        /* lenken statt direkt ansteuern: ergibt geschwungene Bahnen; seitlicher Schwung klingt ab */
        const tx = P.x + P.w / 2, ty = P.y + P.h * 0.4, dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy) || 1;
        const acc = 900 + (tt - 0.3) * 2600, swirl = s.sw * Math.max(0, 1 - (tt - 0.3) * 2.2) * 700;
        s.vx += (dx / d * acc - dy / d * swirl) * dt; s.vy += (dy / d * acc + dx / d * swirl) * dt;
        const sp = Math.hypot(s.vx, s.vy), max = 220 + (tt - 0.3) * 700; if (sp > max) { s.vx *= max / sp; s.vy *= max / sp; }
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (d < 7 || tt > 2.4) { s.done = true; FX.burst(tx, ty, 3, { col: [s.col, "#fff"], sp: 50, life: 0.25, size: 1.4, kind: "spark", add: true }); fx.push({ k: "absorb", x: tx, y: ty, t: 0, life: 0.2, col: s.col }); }
      }
      s.tr.push(s.x, s.y); if (s.tr.length > (low() ? 8 : 16)) s.tr.splice(0, 2);
    }
    souls = souls.filter(s => !s.done && s.t < 3.2);
    for (const e of Z.enemies) if (e.squash > 0) e.squash = Math.max(0, e.squash - dt * 2.4);
    if (chain.t > 0) chain.t -= dt;
    if (banner) { banner.t += dt; if (banner.t > 1.3) banner = null; }
    if (hurtT > 0) hurtT -= dt;
    if (lines) { lines.t += dt; if (lines.t > lines.life) lines = null; }
    moveFx(dt);
  }

  /* ---------- Weltraum-Zeichnen (nach dem Spieler) ---------- */
  function star(c, r, w) { c.beginPath(); c.moveTo(-r, 0); c.lineTo(0, w); c.lineTo(r, 0); c.lineTo(0, -w); c.closePath(); c.fill(); c.beginPath(); c.moveTo(0, -r); c.lineTo(w, 0); c.lineTo(0, r); c.lineTo(-w, 0); c.closePath(); c.fill(); }
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
        c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 1 - u; c.fillStyle = f.col; c.translate(f.x, f.y); c.rotate(0.4 + (f.rot || 0) * 0.6);
        const r = f.r * (0.6 + u * 0.6);
        star(c, r, r * 0.12);
        const g = r * 0.7; c.drawImage(spr("rgba(255,255,255,0.9)"), -g, -g, g * 2, g * 2);
        c.restore();
      } else if (f.k === "streak") {
        c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = f.col; c.lineCap = "round";
        for (let k = 0; k < f.n; k++) { const a = (Math.sin(f.seed + k * 2.3) * 0.7), len = 10 + ((f.seed * 7 + k * 13) % 14), d0 = 4 + u * 26, d1 = d0 + len * (1 - u); c.globalAlpha = (1 - u) * 0.9; c.lineWidth = 1.6 * (1 - u) + 0.3; c.beginPath(); c.moveTo(f.x + f.dir * Math.cos(a) * d0, f.y + Math.sin(a) * d0); c.lineTo(f.x + f.dir * Math.cos(a) * d1, f.y + Math.sin(a) * d1); c.stroke(); }
        c.restore();
      } else if (f.k === "crit") {
        /* Standbild: scharfer Ring mit Zacken, still – dann aufplatzen und verblassen */
        c.save(); c.globalCompositeOperation = "lighter"; c.translate(f.x, f.y);
        if (f.t < f.hold) {
          const r0 = 9;
          c.globalAlpha = 1; c.strokeStyle = "#fffaf0"; c.lineWidth = 2;
          c.beginPath(); c.arc(0, 0, r0, 0, TAU); c.stroke();
          c.fillStyle = "#fff4d8"; c.rotate(f.rot);
          for (let k = 0; k < 8; k++) { c.rotate(TAU / 8); c.beginPath(); c.moveTo(r0 + 1, -1.2); c.lineTo(r0 + (k % 2 ? 6 : 11), 0); c.lineTo(r0 + 1, 1.2); c.fill(); }
          c.globalAlpha = 0.85; star(c, 14, 1.4);
        } else {
          const v = (f.t - f.hold) / (f.life - f.hold), e = 1 - (1 - v) * (1 - v), r = 9 + f.r * e;
          c.globalAlpha = (1 - v) * 0.9; c.strokeStyle = "#ffd27a"; c.lineWidth = 3 * (1 - v) + 0.5;
          c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
          c.globalAlpha = (1 - v) * 0.6; c.strokeStyle = "#fff0c8"; c.lineWidth = 1; c.rotate(f.rot);
          for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * (r + 2), Math.sin(a) * (r + 2)); c.lineTo(Math.cos(a) * (r + 6 + 8 * (1 - v)), Math.sin(a) * (r + 6 + 8 * (1 - v))); c.stroke(); }
        }
        c.restore();
      } else if (f.k === "glint") {
        /* Glanzblitz der Parade: großer Stern mit langer waagrechter Lichtlinie */
        const a = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85, s = 0.6 + Math.sin(Math.min(1, u * 2) * Math.PI / 2) * 0.6;
        c.save(); c.globalCompositeOperation = "lighter"; c.translate(f.x, f.y);
        c.globalAlpha = a * 0.5; const g = 16 * s; c.drawImage(spr("rgb(255,236,180)"), -g, -g, g * 2, g * 2);
        c.globalAlpha = a; c.fillStyle = "#fffaf0";
        c.beginPath(); c.moveTo(-34 * s, 0); c.lineTo(0, 0.9); c.lineTo(34 * s, 0); c.lineTo(0, -0.9); c.fill();
        c.rotate(f.rot + u * 0.8); star(c, 11 * s, 1.6);
        c.rotate(Math.PI / 4); c.globalAlpha = a * 0.6; star(c, 6 * s, 1);
        c.restore();
      } else if (f.k === "absorb") {
        c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = (1 - u) * 0.8; c.strokeStyle = f.col; c.lineWidth = 1.2 * (1 - u) + 0.3;
        c.beginPath(); c.arc(f.x, f.y, 3 + u * 9, 0, TAU); c.stroke(); c.restore();
      } else if (f.k === "pop") {
        c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.6 * (1 - u); const r = f.r * (0.5 + u); c.drawImage(spr("rgb(255,170,110)"), f.x - r, f.y - r, r * 2, r * 2); c.restore();
      } else if (f.k === "dust") {
        c.save(); c.fillStyle = Z.dustCol || "#8a7a70";
        for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const d = f.w * 0.5 * (0.3 + u) + k * 5, r = (3 + k) * (1 - u * 0.6); c.globalAlpha = (1 - u) * (0.5 - k * 0.12); c.beginPath(); c.arc(f.x + s * d, f.y - 2 - k * 1.5 - u * 4, r, 0, TAU); c.fill(); }
        c.restore();
      } else if (f.k === "puff") {
        c.save(); c.globalAlpha = (1 - u) * 0.45; c.fillStyle = Z.dustCol || "#8a7a70"; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(f.x + s * (4 + u * 8), f.y - 1, 3 + u * 3, 1.6 + u, 0, 0, TAU); c.fill(); } c.restore();
      } else if (f.k === "ring2") {
        c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = (1 - u) * (f.wide ? 0.45 : 0.8); c.strokeStyle = f.wide ? "#e8d8c8" : "#ffd8a8"; c.lineWidth = f.wide ? 1 : 1.4; c.beginPath(); c.ellipse(f.x, f.y, (f.wide ? 8 : 4) + u * (f.wide ? 26 : 16), 1.5 + u * (f.wide ? 2 : 4), 0, 0, TAU); c.stroke(); c.restore();
      } else if (f.k === "cloud") {
        /* Bausch für Bausch: wächst, steigt, verliert an Dichte */
        const spc = puffSpr(f.col), dts = Math.min(0.05, f.dt || 0.016); c.save();
        for (const q of f.p) { const r = q.r * (1 + u * 1.6), a = (1 - u) * (1 - u) * 0.55; q.x += q.vx * dts; q.y += q.vy * dts; q.vx *= 0.94; q.vy *= 0.97; c.globalAlpha = a; c.drawImage(spc, q.x - r, q.y - r * 0.9, r * 2, r * 1.8); }
        c.restore();
      } else if (f.k === "slip") {
        c.save(); c.globalAlpha = (1 - u) * 0.35; c.strokeStyle = "#ffe8d0"; c.lineWidth = 1; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x - (Z.player ? Math.sign(Z.player.vx) : 1) * 10, f.y); c.stroke(); c.restore();
      }
    }
    /* Angriffe lesbar machen: Aufblitzen kurz vor dem Schlag, Hiebspur während des Schlags */
    const cam = Z.cam;
    for (const e of Z.enemies) {
      const ac = e.act; if (!ac || e.dead || !ac.a || !ac.a.box) continue;
      if (e.x < cam.x - 40 || e.x > cam.x + cam.w + 40) continue;
      const a = ac.a, sz = e.size || 1, bx = a.box[0] * sz, by = a.box[1] * sz, bw = a.box[2] * sz, bh = a.box[3] * sz, cx = e.x + e.w / 2, fy = e.y + e.h;
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
    /* Seelenfunken: Schweif (verjüngter Linienzug) und leuchtender Kopf */
    c.globalCompositeOperation = "lighter"; c.lineCap = "round"; c.lineJoin = "round";
    for (const s of souls) {
      if (s.t < s.delay) continue;
      const tr = s.tr, n = tr.length / 2;
      if (n > 1) {
        c.strokeStyle = s.col;
        for (let i = 1; i < n; i++) { const k = i / n; c.globalAlpha = k * 0.7; c.lineWidth = 0.4 + k * 2; c.beginPath(); c.moveTo(tr[i * 2 - 2], tr[i * 2 - 1]); c.lineTo(tr[i * 2], tr[i * 2 + 1]); c.stroke(); }
      }
      const pu = 0.85 + 0.15 * Math.sin(s.t * 30);
      c.globalAlpha = 1; c.drawImage(spr(s.col), s.x - 6 * pu, s.y - 6 * pu, 12 * pu, 12 * pu);
      c.fillStyle = "#fff4e0"; c.beginPath(); c.arc(s.x, s.y, 1.1, 0, TAU); c.fill();
    }
    c.restore();
  }

  /* ---------- Bildschirm ---------- */
  let vig = null;
  function vigSprite() {
    if (vig) return vig;
    vig = document.createElement("canvas"); vig.width = 160; vig.height = 90; const v = vig.getContext("2d");
    const g = v.createRadialGradient(80, 45, 90 * 0.35, 80, 45, 160 * 0.75); g.addColorStop(0, "rgba(150,10,10,0)"); g.addColorStop(1, "rgba(150,10,10,1)"); v.fillStyle = g; v.fillRect(0, 0, 160, 90);
    return vig;
  }
  function drawLines(c, W, H) {
    const l = lines, cam = Z.cam, S = W / cam.w;
    const sx = (l.x - cam.x) * S, sy = (l.y - cam.y) * S, u = l.t / l.life;
    const a = (u < 0.12 ? u / 0.12 : 1 - (u - 0.12) / 0.88) * (l.strong ? 0.55 : 0.32);
    const R = Math.hypot(W, H), n = l.strong ? (low() ? 14 : 26) : (low() ? 8 : 14);
    c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = l.strong ? "#fff0c8" : "#ffe8d0"; c.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const h = Math.sin(l.seed + i * 12.9898) * 43758.5453, r = h - Math.floor(h);
      const ang = i / n * TAU + r * 0.3, r0 = R * (0.22 + r * 0.12) + u * R * 0.05, r1 = R * (0.42 + r * 0.25);
      c.globalAlpha = a * (0.5 + r * 0.5); c.lineWidth = (1 + r * 2) * S * 0.5;
      c.beginPath(); c.moveTo(sx + Math.cos(ang) * r0, sy + Math.sin(ang) * r0); c.lineTo(sx + Math.cos(ang) * r1, sy + Math.sin(ang) * r1); c.stroke();
    }
    if (l.strong) { c.globalAlpha = a * 0.35; c.fillStyle = "#fff4dc"; c.fillRect(0, 0, W, Math.max(2, H * 0.06 * (1 - u))); c.fillRect(0, H - Math.max(2, H * 0.06 * (1 - u)), W, H); }
    c.restore();
  }
  function drawScreen(c, W, H) {
    const fk = Z.flashK ? Z.flashK() : 1; /* Komfort: Treffer-Aufleuchten und Paraden-Linien gedämpft/aus */
    if (hurtT > 0 && fk > 0) {
      c.save(); c.globalAlpha = Math.min(1, hurtT / 0.45) * 0.55 * Math.max(fk, 0.5); c.drawImage(vigSprite(), 0, 0, W, H); c.restore();
    }
    if (lines && fk > 0) { c.save(); c.globalAlpha = fk; drawLines(c, W, H); c.restore(); }
    if (banner) {
      const u = banner.t / 1.3, a = u < 0.12 ? u / 0.12 : u > 0.75 ? (1 - u) / 0.25 : 1, s = 1 + (u < 0.12 ? (1 - u / 0.12) * 0.6 : 0);
      const fs = Math.max(14, Math.min(W, H) * 0.045) * s * (1 + Math.min(0.5, (banner.n - 2) * 0.1));
      const fd = getComputedStyle(document.documentElement).getPropertyValue("--fd") || "serif";
      c.save(); c.globalAlpha = a; c.textAlign = "right"; c.textBaseline = "middle"; c.font = Math.round(fs) + "px " + fd;
      /* R24: in der 16:9-Spalte des HUD bleiben (UWQHD) und unter den Musik-/Ton-Knöpfen rechts (Handheld) */
      const colW = Math.min(W, H * 16 / 9), x = W / 2 + colW / 2 - colW * 0.04;
      /* R25: unter der rechten HUD-Spalte (Gebietsname, Minikarte, Herausforderungen, Musik-Knöpfe) bleiben */
      let y = H * 0.35;
      try { const hr = document.querySelector("#hud .hr"), cvm = c.canvas; if (hr && hr.offsetParent !== null) { const a = hr.getBoundingClientRect(), b = cvm.getBoundingClientRect(); if (b.height > 0) y = Math.max(y, (a.bottom - b.top) * H / b.height + fs * 0.75); } } catch (_) {}
      y = Math.min(y, H * 0.6);
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
  /* Seelenfunken leuchten in ihre Umgebung (Farblicht ab Stufe 1) */
  if (Z.gfx && Z.gfx.lightGather) Z.gfx.lightGather.push(function (add) { if (!rich()) return; let n = 0; for (const s of souls) { if (s.t < s.delay || n++ > 10) continue; add(s.x, s.y, 34, s.col, 0.4, 0); } });
  /* Explosionen (große, kurze, warme Ringe): Glutfunken, die aufsteigen und verglimmen, und eine Rauchwolke mit Volumen */
  const ring0 = FX.ring;
  FX.ring = function (x, y, r, col, life, w) {
    const res = ring0.apply(this, arguments);
    if (rich2() && r >= 34 && (life || 0.35) <= 0.6 && typeof col === "string") {
      const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(col), hot = col[0] === "#" ? (() => { const n = parseInt(col.slice(1, 7), 16); return (n >> 16) > 200 && ((n >> 8) & 255) < 210 && (n & 255) < 140; })() : m && +m[1] > 200 && +m[2] < 210 && +m[3] < 140;
      if (hot) {
        const k = Math.min(1.6, r / 50), q = (Z.gq && Z.gq.part) || 1;
        for (let i = 0; i < Math.round(10 * k * q); i++) { const a = Math.random() * TAU, sp = 40 + Math.random() * 90 * k; FX.p({ x: x + Math.cos(a) * 4, y: y + Math.sin(a) * 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, g: -30, drag: 0.94, life: 0.8 + Math.random() * 0.9, size: 1.2 + Math.random() * 1.4, col: ["#ffd27a", "#ff9a3a", "#ff6a1a"][i % 3], kind: "glow", add: true }); }
        cloud(x, y + r * 0.2, r * 1.2, "#4a3a34", 1.4);
      }
    }
    return res;
  };
  const load0 = Z.loadArea;
  Z.loadArea = function () { fx = []; ghosts = []; souls = []; chain = { n: 0, t: 0 }; banner = null; lines = null; return load0.apply(this, arguments); };
  (Z.rueckHooks = Z.rueckHooks || []).push({ id: "effekte", load: () => { fx = []; ghosts = []; souls = []; chain = { n: 0, t: 0 }; banner = null; lines = null; } }); /* W14 Rückweg-Gnade (rueckweg.js): Gebietszustand merken/einsetzen */
})();

/* Ezekiel – The Destroyer · Kampf-Optik II (Grafik-Runde 11)
   – Treffer-Charakter je Waffenart (ab Stufe 1): Klinge = feiner Schnittbogen mit langen Funken, Wucht = Druckring mit
     Brocken und Staub, Feuer = Glutstoß mit Flammenzunge, Frost = Eissplitter mit Reifnebel (weiß/grünlich, kein Blau).
   – Krit (ab Stufe 1): goldener Vierstrahl-Stern mit Gegenzacken und Lichtbruch – deutlich anders als normale Treffer.
   – Boss-Tod (ab Stufe 1, Strahlen ab Stufe 2): Lichtbruch mit rotierenden Strahlen und Druckwelle, danach zerfällt der
     Boss je nach Heimat in Asche, Glut oder Wasser (Zeitlupe kommt schon aus spiel.js).
   – Ezekiel (ab Stufe 1): Landen wirbelt je Untergrund anderes auf (Gras, Laub, Asche, Sand, Knochenstaub) und spritzt
     in Pfützen; Wandkontakt im Fall schabt Staub und Mörtel ab; Rolle (ab Stufe 2) zieht eine Bewegungsspur.
   Alles bei Handheld (lean) und Stufe 0 aus. Schalter Z.gfx.off.kampf2. */
(function () {
  "use strict";
  const Z = window.Z, FX = Z.fx, G = Z.gfx, T = Z.TILE, TAU = Math.PI * 2;
  const lvl = () => { const q = Z.gq; if (q && q.lean) return 0; if (G && G.off && G.off.kampf2) return 0; if (!q || !Number.isFinite(q.level)) return 2; return q.level === -1 ? 2 : q.level; };
  const W = [];   /* eigene Weltzeichnungen: {k,x,y,t,life,...} */
  const BLUNT = { hammer: 1, club: 1, fist: 1, stonefist: 1, anchor: 1, staff: 1, goldshield: 1, shield: 1, thornshield: 1 };
  function kindOf(e, o) {
    if (o && o.eff && o.eff.burn) return "feuer";
    if (e && e.frozenT > 0) return "frost";
    const it = o && o.it, id = it && (it.id || it), wd = id && Z.WEAPONS && Z.WEAPONS[id];
    if (wd && /eis|frost/i.test(String(id))) return "frost";
    if (wd && /feuer|glut|brand|flamm/i.test(String(id))) return "feuer";
    if ((wd && BLUNT[wd.icon]) || (o && o.heavy && !wd)) return "wucht";
    return "klinge";
  }
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    const n = hit0.apply(this, arguments);
    const L = lvl();
    if (L >= 1 && n > 0 && e && !(o && (o.dot || o.fx))) {
      const P = Z.player, ex = e.x + e.w / 2, ey = e.y + e.h * 0.45, dir = (o && o.dir) || (P ? (ex > P.x + P.w / 2 ? 1 : -1) : 1), hx = ex - dir * e.w * 0.3;
      const k = kindOf(e, o), q = L >= 2 ? 1 : 0.6;
      if (k === "klinge") { W.push({ k: "schnitt", x: hx, y: ey, dir, t: 0, life: 0.16, r: 12 + e.h * 0.25, a0: Math.random() * 0.6 - 0.3 }); FX.burst(hx, ey, Math.round(5 * q), { col: ["#fffbe8", "#ffe0a0"], sp: 260, ang: dir > 0 ? -0.15 : Math.PI + 0.15, spread: 0.9, life: 0.18, size: 1.1, kind: "spark", add: true, drag: 0.9 }); }
      else if (k === "wucht") { W.push({ k: "druck", x: hx, y: ey, t: 0, life: 0.24, r: 16 + e.w * 0.6 }); FX.burst(hx, ey + 4, Math.round(5 * q), { col: ["#7a7268", "#948a7e", "#5a524a"], sp: 120, ang: -Math.PI / 2, spread: 2.8, life: 0.5, size: 2.2, kind: "shard", g: 600, drag: 0.95 }); FX.addShake(2); }
      else if (k === "feuer") { W.push({ k: "glutstoss", x: hx, y: ey, dir, t: 0, life: 0.3, r: 14 }); FX.burst(hx, ey, Math.round(9 * q), { col: ["#ffd27a", "#ff8a2a", "#ff5a1a"], sp: 130, ang: -Math.PI / 2 + dir * 0.4, spread: 1.8, life: 0.55, size: 1.6, kind: "glow", g: -80, add: true }); }
      else { W.push({ k: "reif", x: hx, y: ey, t: 0, life: 0.45, r: 14 + e.w * 0.4, seed: Math.random() * 9 }); FX.burst(hx, ey, Math.round(8 * q), { col: ["#ffffff", "#e8f4ee", "#d0e8dc"], sp: 140, life: 0.45, size: 1.4, kind: "shard", g: 400, drag: 0.94 }); }
      /* Feuer- und Frosttreffer werfen kurzes Licht (Runde 12) */
      if (Z.lightFlash) { if (k === "feuer") Z.lightFlash(hx, ey, 70, "#ff9a40", 0.65, 0.28); else if (k === "frost") Z.lightFlash(hx, ey, 60, "#e8f4ee", 0.5, 0.3); else if (o && o.crit) Z.lightFlash(hx, ey, 64, "#ffd27a", 0.55, 0.2); }
      if (o && o.crit) W.push({ k: "krit", x: hx, y: ey, t: 0, life: 0.34, r: 26 + Math.min(18, e.w * 0.5), rot: Math.random() * 0.8 });
    }
    return n;
  };
  /* ---------- Boss-Tod ---------- */
  const seen = new WeakSet();
  function bossWatch() {
    if (lvl() < 1) return;
    for (const b of Z.enemies || []) {
      if (!b.def || !b.def.boss || seen.has(b) || !(b.dead || b.hp <= 0)) continue; seen.add(b);
      const bg = (Z.biome && Z.biome.bg) || "", art = bg === "lake" || bg === "harbour" ? "wasser" : (bg === "forge" || bg === "embercity" || bg === "spires") ? "glut" : "asche";
      W.push({ k: "bosstod", x: b.x + b.w / 2, y: b.y + b.h / 2, w: b.w, h: b.h, bx: b.x, by: b.y, t: 0, life: 2.6, art, rot: Math.random() * TAU, em: 0 });
      if (Z.lightFlash) Z.lightFlash(b.x + b.w / 2, b.y + b.h / 2, 260, art === "wasser" ? "#c8f0d8" : "#ffe0a0", 1, 0.9);
    }
  }
  function bossEmit(f, dt) {
    f.em += dt * (f.t < 1.8 ? 60 : 10); const n = Math.floor(f.em); f.em -= n;
    for (let i = 0; i < n; i++) {
      const x = f.bx + Math.random() * f.w, y = f.by + Math.random() * f.h;
      if (f.art === "asche") FX.p({ x, y, vx: (Math.random() - 0.3) * 30, vy: -20 - Math.random() * 40, life: 1.4, size: 1.6 + Math.random() * 1.6, col: Math.random() < 0.3 ? "#ffb060" : "#6a6058", kind: Math.random() < 0.3 ? "glow" : "smoke", g: -10, add: false });
      else if (f.art === "glut") FX.p({ x, y, vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 60, life: 1.1, size: 1.4 + Math.random(), col: ["#ffd27a", "#ff8a2a", "#ff5a1a"][(Math.random() * 3) | 0], kind: "glow", g: -30, add: true });
      else FX.p({ x, y, vx: (Math.random() - 0.5) * 30, vy: -10 - Math.random() * 30, life: 0.9, size: 1.4, col: Math.random() < 0.5 ? "#c8f0d8" : "#8ac0a0", kind: "drop", g: 420, collide: true });
    }
  }
  /* ---------- Ezekiel: Landen, Wand, Rolle ---------- */
  const DUST = { castle: ["#5a7a3a", "#8a6a3a", "leaf"], ramparts: ["#6a6a5a", "#8a7a5a", "dust"], camp: ["#5a7a3a", "#a08a50", "leaf"], storm: ["#4a6a3a", "#6a5a40", "leaf"], cellar: ["#a08a60", "#7a6a50", "dust"], halls: ["#8a6a5a", "#b8908a", "dust"], dungeon: ["#c8c0a8", "#6a6a50", "bone"], harbour: ["#c8b890", "#8a8070", "dust"], belltower: ["#e8e0d0", "#8a7a6a", "feather"], chasm: ["#8a7a90", "#c8b8d0", "dust"], lake: ["#5a7a5a", "#8aa080", "dust"], forge: ["#4a4040", "#ff8a3a", "ash"], embercity: ["#3a3030", "#ff7a2a", "ash"], spires: ["#4a4040", "#8a7a6a", "ash"] };
  const pv = { ground: true, vy: 0, wallT: 0, trail: [] };
  function playerFx(dt) {
    const P = Z.player, L = lvl(); if (!P || P.dead || L < 1) { pv.trail.length = 0; return; }
    const fx0 = P.x + P.w / 2, fy = P.y + P.h, lv = Z.level, bg = (Z.biome && Z.biome.bg) || "";
    if (P.onGround && !pv.ground && pv.vy > 230 && lv) {
      const s = Math.min(1, (pv.vy - 200) / 450), tx = Math.floor(fx0 / T), ty = Math.floor((fy + 2) / T);
      if (G.pfuetzen && G.pfLv === lv && G.pfuetzen.has(tx + "," + ty)) {
        FX.burst(fx0, fy - 1, 8 + Math.round(s * 10), { col: ["#c8e0d0", "#a0c0b0", "#e8f4ee"], sp: 110 + s * 80, ang: -Math.PI / 2, spread: 1.9, life: 0.55, size: 1.3, kind: "drop", g: 520, drag: 0.97 });
        W.push({ k: "welle", x: fx0, y: fy, t: 0, life: 0.6, r: 14 + s * 10 });
      } else {
        const d = DUST[bg] || ["#8a7a70", "#6a5a50", "dust"], n = 3 + Math.round(s * 6);
        if (d[2] === "leaf") FX.burst(fx0, fy - 1, n, { col: [d[0], d[1]], sp: 70 + s * 60, ang: -Math.PI / 2, spread: 2.2, life: 0.9, size: 1.6, kind: "leaf", g: 120, drag: 0.94 });
        else if (d[2] === "ash") FX.burst(fx0, fy - 1, n, { col: [d[0], d[1]], sp: 60 + s * 50, ang: -Math.PI / 2, spread: 2.6, life: 0.8, size: 1.3, kind: Math.random() < 0.5 ? "glow" : "dot", g: -20, add: false });
        else if (d[2] === "feather") FX.burst(fx0, fy - 1, Math.max(2, n >> 1), { col: [d[0]], sp: 50, ang: -Math.PI / 2, spread: 2, life: 1.4, size: 1.6, kind: "leaf", g: 40, drag: 0.92 });
        else FX.burst(fx0, fy - 1, n, { col: [d[0], d[1]], sp: 60 + s * 70, ang: -Math.PI / 2, spread: 2.8, life: 0.5, size: 1.1, kind: d[2] === "bone" ? "shard" : "dot", g: 500, drag: 0.95 });
      }
    }
    /* Wandkontakt in der Luft: an der Wand entlang schaben */
    if (!P.onGround && !P.ledge && lv && Z.world && Math.abs(P.vy) > 60) {
      const side = P.face || 1, wx = side > 0 ? P.x + P.w + 1.5 : P.x - 1.5, my = P.y + P.h * 0.55;
      if (Z.world.solidAt(wx, my) && Z.world.solidAt(wx, P.y + P.h * 0.2)) { pv.wallT -= dt; if (pv.wallT <= 0) { pv.wallT = 0.07; FX.p({ x: wx - side * 1, y: my + (Math.random() - 0.5) * 8, vx: -side * (20 + Math.random() * 30), vy: -P.vy * 0.15, life: 0.4, size: 1.2, col: Z.dustCol || "#8a7a70", kind: "dot", g: 300 }); if (P.vy > 200 && Math.random() < 0.4) FX.p({ x: wx, y: my, vx: -side * 40, vy: -20, life: 0.18, size: 0.9, col: "#ffd8a0", kind: "spark", add: true }); } }
    }
    /* Rollspur */
    if (L >= 2 && P.rollT > 0) { pv.trail.push({ x: fx0, y: P.y + P.h - 8, t: 0 }); if (pv.trail.length > 7) pv.trail.shift(); }
    for (const q of pv.trail) q.t += dt; while (pv.trail.length && pv.trail[0].t > 0.22) pv.trail.shift();
    pv.ground = P.onGround; pv.vy = P.vy;
  }
  /* ---------- Zeichnen ---------- */
  let lastT = 0;
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, Wd, Hd, t) {
    if (al0) al0.apply(this, arguments);
    const dt = Math.min(0.05, Math.max(0, t - lastT)); lastT = t;
    try { bossWatch(); playerFx(dt); } catch (e) { console.error(e); }
    if (!W.length && !pv.trail.length) return;
    const S = G.scale || 2, L = lvl(); c.save(); c.setTransform(S, 0, 0, S, -cam.x * S, -cam.y * S);
    /* Rollspur hinter Ezekiel (ab Stufe 2) */
    if (pv.trail.length > 1) { const cc = (Z.capeCol && Z.capeCol[0]) || "#8a1414"; c.globalCompositeOperation = "source-over"; for (let i = 0; i < pv.trail.length - 1; i++) { const q = pv.trail[i], a = (1 - q.t / 0.22) * 0.35 * (i / pv.trail.length); c.globalAlpha = a; c.fillStyle = cc; c.beginPath(); c.arc(q.x, q.y, 7 * (0.6 + 0.4 * i / pv.trail.length), 0, TAU); c.fill(); } c.globalAlpha = 1; }
    for (let i = W.length - 1; i >= 0; i--) {
      const f = W[i]; f.t += dt; if (f.t >= f.life) { W.splice(i, 1); continue; }
      const u = f.t / f.life, a = 1 - u;
      if (f.k === "schnitt") { c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,250,230," + (0.9 * a).toFixed(2) + ")"; c.lineWidth = 2.2 * a + 0.4; c.beginPath(); c.arc(f.x - f.dir * f.r * 0.4, f.y, f.r * (0.8 + u * 0.4), f.a0 - 0.9 + (f.dir < 0 ? Math.PI : 0), f.a0 + 0.9 + (f.dir < 0 ? Math.PI : 0)); c.stroke(); }
      else if (f.k === "druck") { c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,236,200," + (0.6 * a).toFixed(2) + ")"; c.lineWidth = 3 * a + 0.5; c.beginPath(); c.ellipse(f.x, f.y, f.r * (0.3 + u), f.r * (0.2 + u * 0.6), 0, 0, TAU); c.stroke(); }
      else if (f.k === "glutstoss") { c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * (1 + u)); g.addColorStop(0, "rgba(255,200,100," + (0.7 * a).toFixed(2) + ")"); g.addColorStop(1, "rgba(255,90,20,0)"); c.fillStyle = g; c.fillRect(f.x - f.r * 2, f.y - f.r * 2, f.r * 4, f.r * 4); c.fillStyle = "rgba(255,150,60," + (0.8 * a).toFixed(2) + ")"; c.beginPath(); c.moveTo(f.x - 3, f.y); c.quadraticCurveTo(f.x + f.dir * 4, f.y - 8 - u * 10, f.x + f.dir * 2, f.y - 14 - u * 12); c.quadraticCurveTo(f.x + 3, f.y - 6, f.x + 3, f.y); c.fill(); }
      else if (f.k === "reif") { c.globalCompositeOperation = "source-over"; c.fillStyle = "rgba(236,246,240," + (0.35 * a).toFixed(2) + ")"; c.beginPath(); c.arc(f.x, f.y, f.r * (0.5 + u * 0.8), 0, TAU); c.fill(); c.strokeStyle = "rgba(255,255,255," + (0.8 * a).toFixed(2) + ")"; c.lineWidth = 0.8; c.beginPath(); for (let k = 0; k < 6; k++) { const an = k / 6 * TAU + f.seed; c.moveTo(f.x, f.y); c.lineTo(f.x + Math.cos(an) * f.r * 0.9, f.y + Math.sin(an) * f.r * 0.9); c.moveTo(f.x + Math.cos(an) * f.r * 0.5, f.y + Math.sin(an) * f.r * 0.5); c.lineTo(f.x + Math.cos(an + 0.5) * f.r * 0.65, f.y + Math.sin(an + 0.5) * f.r * 0.65); } c.stroke(); }
      else if (f.k === "krit") { c.globalCompositeOperation = "lighter"; const R = f.r * (0.6 + u * 0.7), rot = f.rot + u * 0.6; c.fillStyle = "rgba(255,214,110," + (0.95 * a).toFixed(2) + ")"; c.beginPath(); for (let k = 0; k < 8; k++) { const an = rot + k / 8 * TAU, rr = k % 2 ? R * 0.18 : R; c.lineTo(f.x + Math.cos(an) * rr, f.y + Math.sin(an) * rr); } c.closePath(); c.fill(); c.fillStyle = "rgba(255,255,240," + a.toFixed(2) + ")"; c.beginPath(); for (let k = 0; k < 8; k++) { const an = rot + Math.PI / 8 + k / 8 * TAU, rr = k % 2 ? R * 0.1 : R * 0.5; c.lineTo(f.x + Math.cos(an) * rr, f.y + Math.sin(an) * rr); } c.closePath(); c.fill(); c.strokeStyle = "rgba(255,230,160," + (0.6 * a).toFixed(2) + ")"; c.lineWidth = 1.2; c.beginPath(); c.arc(f.x, f.y, R * 1.1, 0, TAU); c.stroke(); }
      else if (f.k === "welle") { c.globalCompositeOperation = "source-over"; c.strokeStyle = "rgba(220,240,228," + (0.6 * a).toFixed(2) + ")"; c.lineWidth = 0.8; c.beginPath(); c.ellipse(f.x, f.y, f.r * (0.3 + u), 1.6 * (0.5 + u), 0, 0, TAU); c.stroke(); }
      else if (f.k === "bosstod") {
        bossEmit(f, dt);
        c.globalCompositeOperation = "lighter";
        const ph = Math.min(1, f.t / 0.5), fade = f.t < 1.6 ? 1 : 1 - (f.t - 1.6) / 1;
        if (L >= 2) { /* Lichtbruch: rotierende Strahlen */ const col = f.art === "wasser" ? "200,240,216" : "255,226,160"; for (let k = 0; k < 12; k++) { const an = f.rot + f.t * 0.4 + k / 12 * TAU, len = (120 + (k % 3) * 60) * ph, wd = 0.06 + (k % 2) * 0.04; c.fillStyle = "rgba(" + col + "," + (0.15 * fade).toFixed(3) + ")"; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x + Math.cos(an - wd) * len, f.y + Math.sin(an - wd) * len); c.lineTo(f.x + Math.cos(an + wd) * len, f.y + Math.sin(an + wd) * len); c.fill(); } }
        const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, 60 + f.w); g.addColorStop(0, "rgba(255,240,210," + (0.5 * fade).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,240,210,0)"); c.fillStyle = g; c.fillRect(f.x - 80 - f.w, f.y - 80 - f.w, 160 + f.w * 2, 160 + f.w * 2);
        if (f.t < 0.8) { c.strokeStyle = "rgba(255,240,210," + (0.7 * (1 - f.t / 0.8)).toFixed(3) + ")"; c.lineWidth = 3; c.beginPath(); c.arc(f.x, f.y, 20 + f.t * 260, 0, TAU); c.stroke(); }
      }
    }
    c.restore();
  };
  /* Dynamisches Licht (Runde 12, Stufe 2, Budget je Bild): Geschosse ohne eigenes Licht leuchten schwach in ihrer
     Farbe, leuchtende Partikel (Zauber, Runen, Glut) werfen kleine Lichtflecken */
  if (G && G.lightGather) G.lightGather.push(function (add, cam) {
    if (lvl() < 2 || Z.darkness > 0) return;
    let n = 0;
    for (const p of Z.projs || []) { const k = p.k; if (!k || k.glow || k.fire || k.wave || k.ground || p.kind === "bombe" || p.kind === "e_bombe") continue; if (p.x < cam.x - 40 || p.x > cam.x + cam.w + 40 || p.y < cam.y - 40 || p.y > cam.y + cam.h + 40) continue; add(p.x, p.y, 30, k.col || "#ffe0b0", 0.22, 0); if (++n >= 10) break; }
    n = 0; const PS = FX.parts;
    for (let i = PS.length - 1; i >= 0 && n < 10; i--) { const q = PS[i]; if (!q.add || q.kind !== "glow" || q.size < 1.4 || typeof q.col !== "string" || q.col[0] !== "#") continue; if (q.x < cam.x || q.x > cam.x + cam.w || q.y < cam.y || q.y > cam.y + cam.h) continue; add(q.x, q.y, 18 + q.size * 6, q.col, 0.28 * (1 - q.t / q.life), 0); n++; i -= 3; }
  });
  const load0 = Z.loadArea;
  Z.loadArea = function () { W.length = 0; pv.trail.length = 0; return load0.apply(this, arguments); };
  (Z.rueckHooks = Z.rueckHooks || []).push({ id: "effekte2", load: () => { W.length = 0; pv.trail.length = 0; } }); /* W14 Rückweg-Gnade (rueckweg.js): Gebietszustand merken/einsetzen */
})();

/* W11 R15: Auflage für Gittertore, Falltüren und Hebel (Code in tageszeit.js) – hier eingehängt, weil effekte.js nach
   erkundung.js geladen wird und so über dessen schlichten Toren zeichnet */
(function () {
  const Z = window.Z, d0 = Z.drawParcours;
  Z.drawParcours = function (c, t) { if (d0) d0.apply(this, arguments); if (Z.toreAuf) Z.toreAuf(c, t); };
})();

/* Ezekiel – The Destroyer · Lebendige Welt und Bossauftritte (W11 Runde 16)
   1) Umgebung reagiert auf Kampf: Treffer schütteln Staub von der Decke (Kachel über dem Getroffenen), Explosionen und
      schwere Erschütterungen lassen hängende Laternen, Radleuchter, Ketten, Käfige und Banner (lv.decor, Auslenkung
      d.swing – gezeichnet in bild.js) schaukeln; im Zellenblock/Folterkammer/Gebeinhaus klirren alle Ketten des Raums.
   2) Kleine Szenen in Räumen mit Funktion (nur im Raum des Spielers, ab Stufe 1, nicht lean): Ratten huschen über
      Tische (Küche, Vorrats-/Gesindestube, Weinkeller, Wärterstube, Bankettsaal, Anrichte), Bücher fallen aus Regalen
      (Bibliothek), Zugluft aus Schächten drückt Kerzenflammen flach (d.gust → bild.js flame), Ketten im Zellenblock
      knarren von selbst.
   3) Bossauftritt (während e.intro, also nicht länger als bisher): Kamerafahrt zum Boss, Licht flackert, Staub fällt,
      Lampen schaukeln, je Bossgestalt eine Eigenheit (Chasme: Fliegenschwarm/Summen, Vrock: Federn, Riese: Stampfen,
      Wächter: Runenfunken, Wraith: Kältenebel und fast erlöschendes Licht, Druidin: Sporen, Drachen: Glut und
      Goldglanz, Bugbear: Brüllwelle, Kuo-toa: Tropfen, Glasstab: Glassplitter). Jede neue Taste beendet die
      Kamerafahrt. Namensbanner bleibt das bestehende (ui.js/uebergang.js). Lean: nur etwas Staub, keine Kamera/Flackern.
   Schalter: Z.gfx.off.umwelt, Z.gfx.off.szenen, Z.gfx.off.auftritt. */
(function () {
  const Z = window.Z, G = Z.gfx, FX = Z.fx, T = 16, TAU = Math.PI * 2;
  if (!G || !FX) return;
  const off = k => !!(G.off && G.off[k]);
  const qL = () => (Z.gq && Number.isFinite(Z.gq.level) && Z.gq.level >= 0 ? Z.gq.level : 2);
  const lean = () => !!(Z.gq && (Z.gq.lean || Z.gq.mini));
  const rnd = Math.random;
  const solidT = (x, y) => { const v = Z.level.get(x, y); return v === 1 || v === 7; };
  const standT = (x, y) => { const v = Z.level.get(x, y); return v === 1 || v === 7 || v === 2 || v === 8; };

  /* ---------- Staub von der Decke ---------- */
  function ceilAt(x, y) { let tx = Math.floor(x / T), ty = Math.floor(y / T); for (let i = 0; i < 14; i++, ty--) { if (ty < 1) return null; if (solidT(tx, ty)) return (ty + 1) * T; } return null; }
  function dust(x, y, n, spread) {
    if (!Z.level || off("umwelt")) return; if (lean()) n = Math.min(n, 2);
    const col = Z.dustCol || "#8a7a70";
    for (let i = 0; i < n; i++) {
      const xx = x + (rnd() - 0.5) * (spread || 30), cy = ceilAt(xx, y); if (cy == null) continue;
      FX.p({ x: xx, y: cy + 1, vx: (rnd() - 0.5) * 8, vy: 8 + rnd() * 26, g: 150, drag: 0.97, life: 0.9 + rnd() * 0.8, size: 0.8 + rnd() * 0.9, col, kind: "dot" });
      if (i === 0 && !lean()) FX.p({ x: xx, y: cy + 3, vx: 0, vy: 10, life: 1.1, size: 4 + rnd() * 3, col, kind: "smoke", a: 0.45 });
    }
  }
  Z.deckenStaub = dust;

  /* ---------- Schaukeln hängender Dinge ---------- */
  const SWK = { chain: 1, banner: 0.55, lantern: 1, chandelier: 0.7, cage: 0.8 };
  const act = new Set(); let lvRef = null;
  function impulse(x, y, R, s) {
    const lv = Z.level; if (!lv || !lv.decor || off("umwelt")) return;
    for (const d of lv.decor) {
      const k = SWK[d.kind]; if (!k) continue;
      const dx = d.x * T + 8 - x, dy = d.y * T + 8 - y; if (Math.abs(dx) > R || Math.abs(dy) > R) continue; const r = Math.hypot(dx, dy); if (r > R) continue;
      d._va = (d._va || 0) + (dx >= 0 ? 1 : -1) * s * k * (1 - r / R) * (0.75 + rnd() * 0.5); d._a = d._a || 0; act.add(d);
    }
  }
  Z.umweltStoss = impulse;
  function swingTick(dt) {
    for (const d of act) {
      d._va += (-d._a * 28 - d._va * 1.5) * dt; d._a = Math.max(-0.9, Math.min(0.9, d._a + d._va * dt)); d.swing = d._a;
      if (Math.abs(d._a) < 0.003 && Math.abs(d._va) < 0.01) { d.swing = 0; d._a = d._va = 0; act.delete(d); }
    }
  }

  /* ---------- Kampf → Umgebung ---------- */
  let hcd = 0, scd = 0;
  const CELLS = /zellen|folter|gebein|waerter/;
  const h0 = Z.hitEnemy;
  if (h0) Z.hitEnemy = function (e, dmg, o) {
    const r = h0.apply(this, arguments);
    try {
      if (e && Z.level && !off("umwelt") && hcd <= 0) {
        hcd = 0.14; const x = e.x + e.w / 2, y = e.y + 2, big = !!(o && (o.crit || o.heavy)) || dmg >= 30;
        dust(x, y, big ? 5 : 2, 40);
        const rt = Z.raumTypAt && Z.raumTypAt(Math.floor(x / T), Math.floor(y / T)), cells = !!(rt && CELLS.test(rt.id));
        impulse(x, y, cells ? 300 : 90, big ? 0.9 : 0.45);
        if (cells && Z.ausstattungImpuls) Z.ausstattungImpuls(x, y, big ? 0.7 : 0.4, 0);
      }
    } catch (err) { console.error(err); }
    return r;
  };
  const ex0 = Z.explode;
  if (ex0) Z.explode = function (x, y, r) {
    const res = ex0.apply(this, arguments);
    try { if (Z.level && !off("umwelt")) { const R = r || 40; dust(x, y, 9, R * 2.2); impulse(x, y, R * 3 + 90, 2.0); } } catch (err) { console.error(err); }
    return res;
  };

  /* ---------- Szenen in Räumen mit Funktion ---------- */
  const TABLE = { kuechentisch: [-14, 22], wachtisch: [-18, 24], esstisch: [-20, 32], tisch: [-14, 22] };
  const RATROOM = /kueche|vorrat|gesinde|weinkeller|waerter|bankett|anrichte/;
  const SC = new Map(); /* Zelle -> { next, gust, gt, draft } */
  let rats = [], books = [], gustOn = null;
  function cellInfo(key, cx, cy) {
    let s = SC.get(key); if (s) return s;
    const lv = Z.level, CW = Z.CW, CH = Z.CH; let draft = false;
    /* Zugluft: offene Kacheln durch Decke oder Boden der Zelle (Schacht, Leiterloch, Falltür) */
    for (const yy of [cy * CH, cy * CH + CH - 1]) { let n = 0; for (let x = cx * CW; x < cx * CW + CW; x++) { const a = lv.get(x, yy), b = lv.get(x, yy === cy * CH ? yy - 1 : yy + 1); if ((a === 0 || a === 4) && (b === 0 || b === 4)) n++; } if (n >= 1 && n < CW - 2) draft = true; }
    s = { next: G.time + 2 + rnd() * 4, bnext: G.time + 3 + rnd() * 5, gnext: G.time + 2 + rnd() * 5, cnext: G.time + 4 + rnd() * 6, draft }; SC.set(key, s); return s;
  }
  function scenes(dt) {
    const P = Z.player, lv = Z.level; if (!P || !lv) return;
    const cx = Math.floor((P.x + P.w / 2) / T / Z.CW), cy = Math.floor((P.y + P.h / 2) / T / Z.CH), key = cx + "," + cy;
    const rt = Z.raumTyp && Z.raumTyp(cx, cy), s = cellInfo(key, cx, cy), now = G.time, props = Z.ausstattung ? Z.ausstattung() : [];
    const inCell = p => Math.floor(p.x / Z.CW) === cx && Math.floor(p.y / Z.CH) === cy && !p.broken && !p.gone;
    /* Ratten über Tische */
    if (rt && RATROOM.test(rt.id) && now > s.next) {
      s.next = now + 7 + rnd() * 8;
      const tb = props.filter(p => TABLE[p.kind] && inCell(p));
      if (tb.length && rats.length < 2) { const p = tb[(rnd() * tb.length) | 0], g = TABLE[p.kind], x = p.x * T + 8, y = (p.y + 1) * T + g[0], dir = rnd() < 0.5 ? 1 : -1;
        rats.push({ x0: x - dir * (g[1] + 6), x1: x + dir * (g[1] + 6), y, t: 0, dur: 0.9 + rnd() * 0.5, dir, hop: rnd() < 0.5 }); }
    }
    /* Bücher fallen aus Regalen */
    if (rt && /bibliothek|archiv|schreib|studier/.test(rt.id) && now > s.bnext) {
      s.bnext = now + 8 + rnd() * 7;
      /* Quellen: Bücherregale (Fächer), Lesepulte (Pultkante), Wandborde (lv.decor shelf) */
      const sh = props.filter(p => /buecherregal|wandregal|lesepult/.test(p.kind) && inCell(p)).map(p => p.kind === "lesepult" ? [p.x * T + 8, (p.y + 1) * T - 24, 6] : p.kind === "wandregal" ? [p.x * T + 8, p.y * T + 6, 12] : [p.x * T + 8, (p.y + 1) * T - 14 - rnd() * 30, 28])
        .concat((lv.decor || []).filter(d => d.kind === "shelf" && Math.floor(d.x / Z.CW) === cx && Math.floor(d.y / Z.CH) === cy).map(d => [d.x * T + 8, d.y * T + 6, 10]));
      if (sh.length && books.length < 4) { const q = sh[(rnd() * sh.length) | 0], x = q[0] + (rnd() - 0.5) * q[2], y = q[1];
        books.push({ x, y, vx: (rnd() < 0.5 ? -1 : 1) * (18 + rnd() * 20), vy: -20, rot: 0, vr: (rnd() - 0.5) * 14, st: 0, t: 0, col: ["#6a2a22", "#3a4a2a", "#5a3a1a", "#7a5a2a", "#4a2a3a"][(rnd() * 5) | 0] }); }
    }
    /* Zugluft: Kerzen in Zellen mit Schacht */
    if (s.draft && now > s.gnext && !gustOn) { s.gnext = now + 6 + rnd() * 7; gustOn = { key, t: 0, dur: 1.6 + rnd() * 0.8, cx, cy, list: (lv.decor || []).filter(d => (d.kind === "candle" || d.kind === "candelabra" || d.kind === "chandelier") && Math.floor(d.x / Z.CW) === cx && Math.floor(d.y / Z.CH) === cy) }; }
    /* Ketten im Zellenblock knarren */
    if (rt && CELLS.test(rt.id) && now > s.cnext) { s.cnext = now + 8 + rnd() * 8; impulse(cx * Z.CW * T + rnd() * Z.CW * T, cy * Z.CH * T + 40, 140, 0.22); }
  }
  function sceneTick(dt) {
    for (let i = rats.length - 1; i >= 0; i--) { const r = rats[i]; r.t += dt; if (r.t > r.dur) rats.splice(i, 1); }
    for (let i = books.length - 1; i >= 0; i--) {
      const b = books[i]; b.t += dt;
      if (b.st === 0) { b.vy += 520 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vr * dt;
        if (b.vy > 0 && standT(Math.floor(b.x / T), Math.floor((b.y + 2) / T))) { b.y = Math.floor((b.y + 2) / T) * T - 1.5; b.st = 1; b.t = 0; b.rot = Math.round(b.rot / Math.PI) * Math.PI;
          FX.burst(b.x, b.y, 4, { col: [Z.dustCol || "#8a7a70"], sp: 30, life: 0.5, size: 2.5, kind: "smoke", ang: -Math.PI / 2, spread: 2.4 });
          FX.p({ x: b.x, y: b.y - 2, vx: (rnd() - 0.5) * 30, vy: -30, g: 60, drag: 0.94, life: 1.2, size: 2, col: "#e8dcc0", kind: "leaf" }); }
        if (b.t > 3) books.splice(i, 1); }
      else if (b.t > 7) books.splice(i, 1);
    }
    if (gustOn) { const g = gustOn; g.t += dt; const u = g.t / g.dur, k = u >= 1 ? 0 : Math.sin(Math.PI * u) * (0.75 + 0.25 * Math.sin(g.t * 17));
      for (const d of g.list) d.gust = k;
      { const P = Z.player; Z.zugWind = P && Math.floor((P.x + P.w / 2) / T / Z.CW) === g.cx && Math.floor((P.y + P.h / 2) / T / Z.CH) === g.cy ? k * 32 * ((g.cx + g.cy) % 2 ? 1 : -1) : 0; }
      if (u > 0.3 && u < 0.7 && rnd() < dt * 6) { const d = g.list[(rnd() * g.list.length) | 0]; if (d) FX.p({ x: d.x * T + 8, y: d.y * T + 2, vx: 14, vy: -12, life: 1, size: 2.5, col: "#9a8e84", kind: "smoke", a: 0.4 }); }
      if (u >= 1) { for (const d of g.list) d.gust = 0; gustOn = null; Z.zugWind = 0; } }
  }
  function drawScenes(c) {
    const cam = Z.cam;
    for (const r of rats) {
      const u = r.t / r.dur, x = r.x0 + (r.x1 - r.x0) * u, y = r.y - (r.hop ? Math.abs(Math.sin(u * Math.PI * 3)) * 2 : 0), d = r.dir, f = Math.sin(r.t * 40);
      if (x < cam.x - 20 || x > cam.x + cam.w + 20) continue;
      c.fillStyle = "#5e4a40"; c.beginPath(); c.ellipse(x, y - 2.6, 4.6, 2.4, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + d * 4.6, y - 2.8, 2.4, 1.7, d * 0.2, 0, TAU); c.fill();
      c.fillStyle = "#8a7262"; c.beginPath(); c.ellipse(x, y - 3.8, 3.4, 0.9, 0, 0, TAU); c.fill();
      c.fillStyle = "#b08a80"; c.beginPath(); c.arc(x + d * 3, y - 4.6, 1, 0, TAU); c.fill();
      c.fillStyle = "#1a1010"; c.fillRect(x + d * 5.2 - 0.4, y - 3.4, 0.8, 0.8);
      c.strokeStyle = "#b08078"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - d * 4.2, y - 2); c.quadraticCurveTo(x - d * 8, y - 0.5 + f, x - d * 11, y - 3); c.stroke();
      c.strokeStyle = "#3a2a24"; c.beginPath(); c.moveTo(x - 2, y - 1); c.lineTo(x - 2 + f * 1.4, y); c.moveTo(x + 2, y - 1); c.lineTo(x + 2 - f * 1.4, y); c.stroke();
    }
    for (const b of books) {
      const a = b.st ? Math.max(0, Math.min(1, (7 - b.t) / 1.2)) : 1; if (a <= 0) continue;
      c.save(); c.globalAlpha = a; c.translate(b.x, b.y); c.rotate(b.rot);
      c.fillStyle = b.col; c.fillRect(-4, -1.5, 8, 3); c.fillStyle = "#e8dcc0"; c.fillRect(-3.4, -1, 6.6, 0.8); c.fillStyle = "#c8a050"; c.fillRect(-4, -1.5, 0.8, 3);
      c.restore();
    }
  }

  /* ---------- Bossauftritt ---------- */
  const seenB = new WeakSet(); let BI = null;
  function startIntro(e) {
    const lo = lean(), cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    BI = { e, t: 0, dur: Math.min(1.8, e.intro || 1.8), lock0: Z.cam.lock, cam: false, h0: Object.assign({}, Z.input && Z.input.held), shape: (e.def && e.def.shape) || "", id: e.id || (e.def && e.def.id) || "", lo, steps: 0 };
    if (!lo && !off("auftritt")) { const P = Z.player, mx = P ? (cx * 0.7 + (P.x + P.w / 2) * 0.3) : cx, my = P ? (cy * 0.7 + (P.y + P.h / 2) * 0.3) : cy; Z.cam.lock = { x: mx, y: my - 10, k: 0.75 }; BI.cam = true; }
    const cam = Z.cam;
    for (let i = 0; i < (lo ? 2 : 7); i++) dust(cam.x + rnd() * cam.w, cy, lo ? 1 : 3, 20);
    impulse(cx, cy, 420, 0.7); if (Z.ausstattungImpuls) Z.ausstattungImpuls(cx, cy, 0.5, 0);
  }
  function endCam() { if (BI && BI.cam) { if (Z.cam.lock && BI.lock0 !== Z.cam.lock) Z.cam.lock = BI.lock0; BI.cam = false; } }
  function quirk(B, dt) {
    const e = B.e, x = e.x + e.w / 2, y = e.y + e.h / 2, cam = Z.cam, t = B.t, sh = B.shape, p = r => rnd() < dt * r;
    if (sh === "wasp") { if (t < 1.4) FX.addShake(1.2); if (p(30)) { const a = rnd() * TAU, r = 18 + rnd() * 26; FX.p({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.6, vx: -Math.sin(a) * 90, vy: Math.cos(a) * 50, life: 0.6, size: 1.3, col: "#1a1418", kind: "dot", drag: 0.96 }); } }
    else if (sh === "vulture") { if (p(10)) FX.p({ x: cam.x + rnd() * cam.w, y: cam.y - 4, vx: 10 + rnd() * 10, vy: 20 + rnd() * 20, g: 8, drag: 0.99, life: 2.4, size: 3, col: rnd() < 0.5 ? "#3a3036" : "#5a4a4a", kind: "leaf" }); }
    else if (sh === "giant") { const n = Math.floor(t / 0.4); if (n > B.steps && n <= 3) { B.steps = n; FX.addShake(6); for (let i = 0; i < 4; i++) dust(cam.x + rnd() * cam.w, y, 2, 20); impulse(x, y, 400, 0.6); } }
    else if (sh === "golem") { if (p(26)) FX.p({ x: x + (rnd() - 0.5) * 80, y: e.y + e.h, vx: 0, vy: -40 - rnd() * 40, life: 0.9, size: 1.6, col: rnd() < 0.5 ? "#ffb060" : "#ffd890", kind: "spark", add: true }); }
    else if (sh === "wraith") { if (p(14)) FX.p({ x: x + (rnd() - 0.5) * 90, y: e.y + e.h - 4, vx: (rnd() - 0.5) * 20, vy: -6, life: 1.6, size: 8 + rnd() * 6, col: "#a89ab0", kind: "smoke", a: 0.35 }); }
    else if (sh === "druidin") { if (p(18)) FX.p({ x: x + (rnd() - 0.5) * 70, y: e.y + e.h, vx: (rnd() - 0.5) * 14, vy: -20 - rnd() * 20, life: 1.6, size: 1.5, col: "#9ad870", kind: "glow", add: true }); }
    else if (sh === "dragon") { if (p(22)) FX.p({ x: cam.x + rnd() * cam.w, y: cam.y + rnd() * 20, vx: (rnd() - 0.5) * 20, vy: 30 + rnd() * 30, life: 1.6, size: 1.4, col: rnd() < 0.5 ? "#ff8a3a" : "#ffc060", kind: "ember", add: true });
      if (p(8)) FX.p({ x: x + (rnd() - 0.5) * 120, y: e.y + e.h - 2, vx: 0, vy: -4, life: 0.5, size: 2, col: "#ffe08a", kind: "spark", add: true }); }
    else if (sh === "bugbear") { if (!B.roar && t > 0.45) { B.roar = 1; FX.ring && FX.ring(x, y - 6, 70, "#e8d0a0", 0.5, 3); FX.addShake(4); impulse(x, y, 300, 1.0); for (let i = 0; i < 4; i++) dust(cam.x + rnd() * cam.w, y, 2, 20); } }
    else if (sh === "kuotoa") { if (p(12)) { const xx = cam.x + rnd() * cam.w, cy = ceilAt(xx, y); if (cy != null) FX.p({ x: xx, y: cy + 1, vx: 0, vy: 30, g: 400, drag: 1, life: 1.5, size: 1.4, col: "#7a9a80", kind: "drop", collide: true }); } }
    else if (sh === "human") { if (p(10)) FX.p({ x: x + (rnd() - 0.5) * 50, y: y + (rnd() - 0.5) * 40, vx: (rnd() - 0.5) * 30, vy: -10, g: 60, life: 0.8, size: 1.6, col: "#f0e8d8", kind: "shard", add: true }); }
  }
  function bossTick(dt) {
    const b = Z.boss;
    if (b && !seenB.has(b) && b.intro > 0 && !b.dg && !off("auftritt")) { seenB.add(b); startIntro(b); }
    if (!BI) return;
    const B = BI; B.t += dt;
    if (B.cam) { const h = Z.input && Z.input.held; if (h) for (const k in h) if (h[k] && !B.h0[k]) { endCam(); break; } }
    if (B.cam && B.t > B.dur * 0.8) endCam();
    if (!B.lo && B.t < B.dur) quirk(B, dt);
    if (B.t > B.dur + 0.3 || B.e.dead || Z.boss !== B.e) { endCam(); BI = null; }
  }
  /* Licht flackert: dunkle Schleier in unregelmäßigem Takt, nach dem Licht (Stufe 1+) */
  function flickOver(c, cam) {
    const B = BI; if (!B || B.lo || B.t > 1.3 || qL() < 1) return;
    const t = B.t, cold = B.shape === "wraith", n = Math.sin(t * 31) * Math.sin(t * 17 + 1) + (Math.sin(t * 53) > 0.6 ? 0.8 : 0);
    const a = Math.max(0, n) * (cold ? 0.42 : 0.24) * (1 - t / 1.3); if (a < 0.01) return;
    c.fillStyle = cold ? "rgba(16,12,24," + a.toFixed(3) + ")" : "rgba(10,6,4," + a.toFixed(3) + ")"; c.fillRect(cam.x - 4, cam.y - 4, cam.w + 8, cam.h + 8);
  }

  /* ---------- Einhängen ---------- */
  let last = 0;
  function tick() {
    const now = performance.now(), dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    if (Z.level !== lvRef) { lvRef = Z.level; act.clear(); SC.clear(); rats = []; books = []; gustOn = null; Z.zugWind = 0; if (BI) { endCam(); BI = null; } }
    if (Z.paused) return;
    hcd -= dt; scd -= dt;
    if (!off("umwelt") && FX.shake > 5 && scd <= 0 && Z.player) { scd = 0.7; const cam = Z.cam; for (let i = 0; i < 3; i++) dust(cam.x + rnd() * cam.w, Z.player.y, 2, 16); }
    swingTick(dt);
    bossTick(dt);
    if (!off("szenen") && qL() >= 1 && !lean()) { scenes(dt); }
    sceneTick(dt);
  }
  const dml0 = Z.drawMidLife;
  Z.drawMidLife = function () { if (dml0) dml0.apply(this, arguments); try { tick(); } catch (e) { console.error(e); } };
  const dp0 = Z.drawParcours;
  Z.drawParcours = function (c, t) { if (dp0) dp0.apply(this, arguments); try { if (rats.length || books.length) drawScenes(c); } catch (e) { console.error(e); } };
  const dal0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam) { if (dal0) dal0.apply(this, arguments); try { flickOver(c, cam); } catch (e) { console.error(e); } };
  Z.umweltDbg = () => ({ act: act.size, rats: rats.length, ratList: rats.map(r => [r.x0, r.x1, r.y, r.t, r.dur]), books: books.length, gust: !!gustOn, boss: BI && { t: BI.t, cam: BI.cam, shape: BI.shape } });
})();

/* Ezekiel – The Destroyer · Angriffsspuren je Waffe (W11 Runde 18, ab Stufe 1; lean: die schlichte Sichel aus kern.js)
   Ezekiels Nahkampf-Sicheln (FX.smear mit core "#fff6e0") werden markiert und hier gezeichnet:
   – Klinge: spitz zulaufende Sichel mit hellem Schneiden-Rand; breit bei Zweihändern/Sensen/Äxten, schmal bei
     Dolch/Rapier/Sicheln;
   – Wucht (Hammer, Keule, Anker, Fäuste): schwere, dumpfe Sichel + Druckwelle am Boden vor Ezekiel;
   – Stoß (Speer, Hellebarde, Rapier-Stoß): gerade Stoßlinie mit Spitze und Geschwindigkeitsstrichen;
   – Peitsche: Schlinge (geschwungene, auslaufende Schleife).
   Farbe: Waffenfarbe, bei Element-Zusatz (brennend, giftig, blutig, betäubend, Eis/Feuer im Namen) die Elementfarbe.
   Kombo-Schritte steigern die Spur (dicker, heller, Nachbild ab Schritt 2, Funken ab Schritt 3). Kein Blau.
   Schalter Z.gfx.off.spuren. */
(function () {
  const Z = window.Z, FX = Z.fx, G = Z.gfx, TAU = Math.PI * 2;
  if (!FX || !FX.smear || !FX.drawSmears) return;
  const lean = () => !!(Z.gq && (Z.gq.lean || Z.gq.mini || Z.gq.level === 0));
  const off = () => !!(G.off && G.off.spuren);
  const BROAD = { zweihaender: 1, scythe: 1, axe: 1, dawn: 1, hellebarde: 1 };
  const THIN = { dagger: 1, knives: 1, rapier: 1, sickles: 1, sickle: 1, scimitar: 1, krallen: 1, claw: 1 };
  const BLUNT = { hammer: 1, club: 1, anchor: 1, fist: 1, stonefist: 1, kampfstab: 1, staff: 1 };
  const ELEM = { brennend: "#ff8a2a", giftig: "#9ad040", blutig: "#d0202a", betaeubend: "#ffe070" };
  function elemCol(it, id, base) {
    for (const a of (it && it.aff) || []) if (ELEM[a]) return ELEM[a];
    if (/eis|frost/i.test(id)) return "#e8e4f0"; if (/feuer|glut|brand|flamm|drach/i.test(id)) return "#ff8a2a";
    return base;
  }
  const s0 = FX.smear;
  FX.smear = function (o) {
    try {
      const P = Z.player, a = P && P.act;
      if (o && o.core === "#fff6e0" && a && a.type === "melee" && a.d && Math.abs(o.x - (P.x + P.w / 2)) < 40) {
        const id = (a.it && a.it.id) || "", icon = a.d.icon;
        o.ez = { icon, step: a.step | 0, col: elemCol(a.it, id, o.col), kind: o.stab ? "stoss" : icon === "whip" ? "peitsche" : BLUNT[icon] ? "wucht" : "klinge", heavy: !!(a.def && a.def.heavy) || !!BROAD[icon], thin: !!THIN[icon], gy: P.y + P.h };
      }
    } catch (e) { console.error(e); }
    return s0.apply(this, arguments);
  };
  const d0 = FX.drawSmears;
  FX.drawSmears = function (c) {
    if (off() || lean() || !FX.smears.some(s => s.ez)) return d0.apply(this, arguments);
    const all = FX.smears; FX.smears = all.filter(s => !s.ez);
    try { d0.apply(this, arguments); } finally { FX.smears = all; }
    c.save(); c.globalCompositeOperation = "lighter";
    for (const s of all) if (s.ez) try { draw(c, s); } catch (e) { console.error(e); }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
  };
  function crescent(c, r, th, a0, a1, ccw, col, alpha) {
    /* spitz zulaufend: Innenkante als Kurve, die an beiden Enden die Außenkante trifft */
    const n = 14; c.globalAlpha = alpha; c.fillStyle = col; c.beginPath();
    for (let i = 0; i <= n; i++) { const u = i / n, a = a0 + (a1 - a0) * u; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    for (let i = n; i >= 0; i--) { const u = i / n, a = a0 + (a1 - a0) * u, w = th * Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 0.8; c.lineTo(Math.cos(a) * (r - w), Math.sin(a) * (r - w)); }
    c.closePath(); c.fill();
  }
  function draw(c, s) {
    const e = s.ez, k = s.t / s.life, st = Math.min(3, e.step), boost = 1 + st * 0.22, a = (1 - k) * (s.a || 0.85) * Math.min(1.25, boost);
    const a0 = s.a0, a1 = s.a0 + (s.a1 - s.a0) * Math.min(1, k * 3.5 + 0.35);
    c.save(); c.translate(s.x, s.y); c.scale(s.dir, 1); c.rotate(s.rot || 0);
    if (e.kind === "stoss") {
      const L = (s.r + 16) * Math.min(1, k * 4 + 0.3) * boost, w = (e.heavy ? 3.2 : 2) * boost;
      c.globalAlpha = a; c.fillStyle = e.col; c.beginPath(); c.moveTo(-6, -w * 0.5); c.lineTo(L, 0); c.lineTo(-6, w * 0.5); c.closePath(); c.fill();
      c.globalAlpha = a * 0.9; c.fillStyle = "#fff6e0"; c.beginPath(); c.moveTo(0, -w * 0.18); c.lineTo(L + 2, 0); c.lineTo(0, w * 0.18); c.closePath(); c.fill();
      c.strokeStyle = e.col; c.lineWidth = 0.6; c.globalAlpha = a * 0.6;
      for (let i = 0; i < 3; i++) { const yy = (i - 1) * (w + 2.5), x0 = -4 - i * 3 + k * 10; c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + L * 0.55, yy); c.stroke(); }
    } else if (e.kind === "peitsche") {
      const R = s.r, u = Math.min(1, k * 3 + 0.3);
      c.lineCap = "round";
      for (let pass = 0; pass < 2; pass++) {
        c.strokeStyle = pass ? "#fff6e0" : e.col; c.globalAlpha = a * (pass ? 0.8 : 1); c.lineWidth = (pass ? 0.8 : 2.2) * boost;
        c.beginPath(); c.moveTo(-2, -4);
        c.bezierCurveTo(R * 0.6 * u, -R * 0.9, R * 1.2 * u, -R * 0.1, R * 0.7 * u, R * 0.25 * u);
        c.bezierCurveTo(R * 0.4 * u, R * 0.5 * u, R * 0.9 * u, R * 0.6 * u, R * 1.35 * u, R * 0.15);
        c.stroke();
      }
    } else {
      const ccw = s.a1 < s.a0, th = (s.th || 6) * (e.heavy ? 1.6 : e.thin ? 0.55 : 1) * boost * (1 - k * 0.4);
      if (st >= 2) crescent(c, s.r * 0.86, th * 0.8, a0 - 0.25 * Math.sign(s.a1 - s.a0), a1 - 0.25 * Math.sign(s.a1 - s.a0), ccw, e.col, a * 0.35);
      crescent(c, s.r, th, a0, a1, ccw, e.kind === "wucht" ? mixDark(e.col) : e.col, a);
      /* Schneide: heller Rand außen */
      c.globalAlpha = a * (e.kind === "wucht" ? 0.5 : 0.95); c.strokeStyle = "#fff6e0"; c.lineWidth = e.thin ? 0.6 : 1;
      c.beginPath(); c.arc(0, 0, s.r - 0.4, a0 + (a1 - a0) * 0.12, a1, ccw); c.stroke();
    }
    c.restore();
    if (e.kind === "wucht" && k > 0.25) { /* Druckwelle am Boden vor Ezekiel */
      const q = (k - 0.25) / 0.75, x = s.x + s.dir * (s.r * 0.9), y = e.gy - 1, R = 6 + q * (18 + st * 6) * (e.heavy ? 1.3 : 1);
      c.globalAlpha = (1 - q) * 0.7; c.strokeStyle = e.col; c.lineWidth = 2 * (1 - q) + 0.5;
      c.beginPath(); c.ellipse(x, y, R, R * 0.28, 0, Math.PI, TAU); c.stroke();
      c.globalAlpha = (1 - q) * 0.5; c.strokeStyle = "#fff0d0"; c.lineWidth = 0.7; c.beginPath(); c.ellipse(x, y, R * 0.7, R * 0.2, 0, Math.PI, TAU); c.stroke();
    }
    if (st >= 3 && !s.ezSp) { s.ezSp = 1; FX.burst(s.x + s.dir * s.r * 0.8, s.y - 4, 6, { col: [e.col, "#fff6e0"], sp: 120, life: 0.3, size: 1.4, kind: "spark", add: true }); }
  }
  function mixDark(h) { if (!/^#[0-9a-f]{6}$/i.test(h)) return h; const n = parseInt(h.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; return "rgb(" + (r * 0.8 | 0) + "," + (g * 0.72 | 0) + "," + (b * 0.65 | 0) + ")"; }
})();

/* Ezekiel – The Destroyer · Gegner-Tod je Familie (W11 Runde 18, ab Stufe 1; lean: nur Asche/Glut aus gegner.js)
   Zusätzlich zum Aschezerfall: Knochen fallen auseinander (Schädel + Knochen springen, bleiben liegen), Schleim
   zerplatzt (Tropfen + Lache), Geister verwehen (Schleier ziehen seitlich davon, nichts bleibt), Konstrukte zerspringen
   (Splitter mit Drehung, Trümmer bleiben), Insekten bleiben als Panzer auf dem Rücken liegen, Feuerwesen hinterlassen
   Brandfleck und Glut, alle übrigen eine dunkle Leiche. Reste liegen ~4 s und verblassen. Höchstens 70 Teile.
   Schalter Z.gfx.off.tod. Kein Blau. */
(function () {
  const Z = window.Z, FX = Z.fx, G = Z.gfx, TAU = Math.PI * 2;
  if (!Z.killEnemy) return;
  const lean = () => !!(Z.gq && (Z.gq.lean || Z.gq.mini || Z.gq.level === 0));
  const FAM = { skel: "knochen", blob: "schleim", cube: "schleim", slug: "schleim", bloat: "schleim", sac: "schleim", myconid: "schleim",
    wraith: "geist", wisp: "geist", bellghost: "geist", golem: "konstrukt", armor: "konstrukt", gargoyle: "konstrukt", mimic: "konstrukt", rustmonster: "konstrukt",
    spider: "insekt", stirge: "insekt", ettercap: "insekt", drider: "insekt", crab: "insekt", salamander: "feuer", mephit: "feuer", firebat: "feuer" };
  const D = []; /* Reste: {k, x, y, vx, vy, r, vr, t, life, rest, col, w, h, ...} */
  let lvRef = null, lastT = 0;
  const solid = (x, y) => Z.world && Z.world.solidAt(x, y);
  function groundBelow(x, y) { for (let i = 0; i < 6; i++) if (solid(x, y + i * 8 + 1)) return Math.floor((y + i * 8 + 1) / 16) * 16; return null; }
  function add(o) { o.t = 0; if (D.length > 70) D.splice(0, D.length - 70); D.push(o); return o; }
  function hexA(h, a, k) { if (!/^#[0-9a-f]{6}$/i.test(h || "")) h = "#5a4a44"; const n = parseInt(h.slice(1), 16), m = k == null ? 1 : k; return "rgba(" + ((n >> 16 & 255) * m | 0) + "," + ((n >> 8 & 255) * m | 0) + "," + ((n & 255) * m | 0) + "," + a.toFixed(3) + ")"; }
  function death(e) {
    const d = e.def || {}, fam = FAM[d.shape] || (d.undead && d.shape === "zombie" ? "leiche" : "leiche");
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2, gy = groundBelow(cx, e.y + e.h - 2), col = d.c || "#6a5a50", col2 = d.t || "#3a3030", f = e.face || 1;
    if (fam === "knochen") {
      add({ k: "schaedel", x: cx, y: e.y + 4, vx: (Math.random() - 0.5) * 90, vy: -160, r: 0, vr: (Math.random() - 0.5) * 14, life: 4.5, col: "#e8e2d0" });
      for (let i = 0; i < 5; i++) add({ k: "knochen", x: cx + (Math.random() - 0.5) * 8, y: cy, vx: (Math.random() - 0.5) * 160, vy: -80 - Math.random() * 140, r: Math.random() * 3, vr: (Math.random() - 0.5) * 20, life: 4 + Math.random(), col: "#dcd4c0", w: 5 + Math.random() * 3 });
    } else if (fam === "schleim") {
      for (let i = 0; i < 12; i++) FX.p({ x: cx, y: cy, vx: (Math.random() - 0.5) * 220, vy: -60 - Math.random() * 180, g: 600, drag: 0.99, life: 1.2, size: 1.8 + Math.random() * 1.5, col, kind: "drop", collide: true });
      if (gy != null) add({ k: "lache", x: cx, y: gy, life: 4.5, col, w: e.w * 0.9 + 6, rest: 1 });
    } else if (fam === "geist") {
      for (let i = 0; i < 12; i++) FX.p({ x: cx + (Math.random() - 0.5) * e.w, y: e.y + Math.random() * e.h, vx: f * (30 + Math.random() * 50) + (Math.random() - 0.5) * 20, vy: -20 - Math.random() * 30, drag: 0.97, life: 1.4 + Math.random() * 0.6, size: 5 + Math.random() * 5, col: "#c8bcc8", kind: "smoke", a: 0.35 });
      for (let i = 0; i < 6; i++) FX.p({ x: cx, y: cy, vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 40, life: 1, size: 1.4, col: col2 && /^#/.test(col2) ? col2 : "#e0d0ff", kind: "glow", add: true });
    } else if (fam === "konstrukt") {
      for (let i = 0; i < 9; i++) add({ k: "splitter", x: cx + (Math.random() - 0.5) * e.w * 0.6, y: cy + (Math.random() - 0.5) * e.h * 0.6, vx: (Math.random() - 0.5) * 200, vy: -100 - Math.random() * 160, r: Math.random() * 6, vr: (Math.random() - 0.5) * 18, life: 4 + Math.random(), col: i % 3 ? col : col2, w: 2.5 + Math.random() * 3.5 });
      FX.burst(cx, cy, 10, { col: ["#8a8078", "#6a625a"], sp: 80, life: 0.7, size: 3, kind: "smoke", g: -10 });
    } else if (fam === "insekt") {
      add({ k: "panzer", x: cx, y: cy, vx: f * -30, vy: -120, r: 0, vr: f * 8, life: 4.2, col, w: Math.max(6, e.w * 0.6), rr: Math.PI });
    } else if (fam === "feuer") {
      FX.burst(cx, cy, 14, { col: ["#ff8a2a", "#ffc060", "#ff5a2a"], sp: 140, life: 0.7, size: 1.6, kind: "ember", add: true, g: 120 });
      if (gy != null) add({ k: "brand", x: cx, y: gy, life: 4.5, w: e.w + 8, rest: 1 });
    } else {
      if (gy != null && e.w < 60) add({ k: "leiche", x: cx, y: gy, life: 4, col, col2, w: Math.max(8, e.w * 0.9), h: Math.max(3, Math.min(7, e.h * 0.22)), f, rest: 1 });
    }
  }
  const k0 = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    const was = e && e.dead, r = k0.apply(this, arguments);
    try { if (e && !was && e.dead && !(e.def && e.def.boss) && !lean() && !(G.off && G.off.tod) && Z.level) death(e); } catch (err) { console.error(err); }
    return r;
  };
  function tick() {
    const now = performance.now() / 1000, dt = Math.min(0.05, lastT ? now - lastT : 0.016); lastT = now;
    if (Z.level !== lvRef) { lvRef = Z.level; D.length = 0; }
    if (Z.paused) return;
    for (let i = D.length - 1; i >= 0; i--) {
      const o = D[i]; o.t += dt; if (o.t > o.life) { D.splice(i, 1); continue; }
      if (o.rest) continue;
      o.vy += 620 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.r += (o.vr || 0) * dt;
      if (solid(o.x, o.y + 1.5)) { o.y = Math.floor((o.y + 1.5) / 16) * 16 - 1.2; if (Math.abs(o.vy) > 90) { o.vy *= -0.35; o.vx *= 0.6; o.vr = (o.vr || 0) * 0.5; } else { o.vy = 0; o.vx = 0; o.vr = 0; o.rest = 1; if (o.k === "panzer") o.r = Math.PI; } }
      if (solid(o.x + Math.sign(o.vx) * 2, o.y - 2)) o.vx *= -0.4;
    }
  }
  function draw(c) {
    const cam = Z.cam;
    for (const o of D) {
      if (o.x < cam.x - 40 || o.x > cam.x + cam.w + 40 || o.y < cam.y - 40 || o.y > cam.y + cam.h + 40) continue;
      const a = Math.min(1, (o.life - o.t) / 1.2);
      c.save(); c.globalAlpha = a; c.translate(o.x, o.y);
      if (o.k === "schaedel") { c.rotate(o.r); c.fillStyle = o.col; c.beginPath(); c.arc(0, -2.2, 2.6, 0, TAU); c.fill(); c.fillRect(-1.6, -0.5, 3.2, 1.8); c.fillStyle = "#2a2020"; c.fillRect(-1.5, -2.8, 1.1, 1.1); c.fillRect(0.5, -2.8, 1.1, 1.1); }
      else if (o.k === "knochen") { c.rotate(o.r); c.fillStyle = o.col; const w = o.w; c.fillRect(-w / 2, -0.6, w, 1.2); c.beginPath(); c.arc(-w / 2, -0.7, 0.9, 0, TAU); c.arc(-w / 2, 0.7, 0.9, 0, TAU); c.arc(w / 2, -0.7, 0.9, 0, TAU); c.arc(w / 2, 0.7, 0.9, 0, TAU); c.fill(); }
      else if (o.k === "lache") { const g = Math.min(1, o.t / 0.25); c.fillStyle = hexA(o.col, 0.75, 0.8); c.beginPath(); c.ellipse(0, -0.8, o.w / 2 * g, 1.6 * g, 0, 0, TAU); c.fill(); c.fillStyle = "rgba(255,250,230,.35)"; c.fillRect(-o.w * 0.2 * g, -1.6, o.w * 0.15 * g, 0.5); }
      else if (o.k === "splitter") { c.rotate(o.r); c.fillStyle = o.col; c.beginPath(); c.moveTo(-o.w / 2, o.w / 3); c.lineTo(0, -o.w / 2); c.lineTo(o.w / 2, o.w / 4); c.closePath(); c.fill(); c.fillStyle = "rgba(255,240,220,.25)"; c.fillRect(-o.w / 4, -o.w / 4, o.w / 3, 0.6); }
      else if (o.k === "panzer") { c.rotate(o.r); c.fillStyle = hexA(o.col, 1, 0.7); c.beginPath(); c.ellipse(0, 0, o.w / 2, o.w / 3.2, 0, 0, TAU); c.fill(); c.strokeStyle = hexA(o.col, 1, 0.45); c.lineWidth = 0.7; c.beginPath(); for (let i = -1; i <= 1; i++) { c.moveTo(i * o.w / 5, -o.w / 4); c.quadraticCurveTo(i * o.w / 4, -o.w / 2.2, i * o.w / 6 + 1, -o.w / 1.8); } c.stroke(); }
      else if (o.k === "brand") { c.fillStyle = "rgba(20,10,8,.55)"; c.beginPath(); c.ellipse(0, -0.6, o.w / 2, 1.8, 0, 0, TAU); c.fill(); if (o.t < 2.5) { c.globalCompositeOperation = "lighter"; c.globalAlpha = a * (1 - o.t / 2.5) * 0.7; c.fillStyle = "#ff7a2a"; for (let i = 0; i < 4; i++) c.fillRect((i - 1.5) * o.w / 5, -1.4, 1.2, 1.2); } }
      else if (o.k === "leiche") { c.scale(o.f, 1); c.fillStyle = hexA(o.col, 0.95, 0.55); c.beginPath(); c.ellipse(0, -o.h / 2, o.w / 2, o.h / 2, 0, 0, TAU); c.fill(); c.fillStyle = hexA(o.col2 || o.col, 0.95, 0.5); c.beginPath(); c.arc(o.w / 2 - 1, -o.h * 0.55, Math.min(3, o.h * 0.55), 0, TAU); c.fill(); }
      c.restore();
    }
  }
  const dp0 = Z.drawParcours;
  Z.drawParcours = function (c, t) { if (dp0) dp0.apply(this, arguments); try { tick(); if (D.length) draw(c); } catch (e) { console.error(e); } };
  Z.todDbg = () => D.map(o => o.k);
})();

/* Ezekiel – The Destroyer · Sonderräume (W11 Runde 18): Kran, eingestürzte Brücke, Flutkammer
   Daten aus welt.js (lv.specials) und erkundung.js (Z._kraene(): {x,w,y0,y1,y}); gezeichnet NACH der schlichten
   Fassung in erkundung.js (dieser Haken liegt weiter außen) und deckt sie weitgehend ab.
   – Kran: Holzpfosten auf dem oberen Boden, Ausleger mit Strebe, drehende Seilrolle, zwei Ketten aus Gliedern,
     Plattform aus Bohlen mit Geländer, Gegengewicht (Steinblock) fährt gegenläufig.
   – Brücke: abgebrochene Bogenansätze über der verschütteten Öffnung, herabhängende Bohlen (pendeln), Mauerrisse,
     rieselnder Staub.
   – Flutkammer: Ablaufgitter am Beckenboden (unter Wasser sichtbar); nach dem Hebel sinkt das Wasser in 1,6 s
     sichtbar ab, mit Strudel über dem Gitter und Blasen; danach nasser Glanz. Grün/Türkis, kein Blau.
   Alle Stufen (spielrelevant), Zierde (Staub, Blasen, Glanz) erst ab Stufe 1. Schalter Z.gfx.off.sonder. */
(function () {
  const Z = window.Z, FX = Z.fx, G = Z.gfx, T = 16, TAU = Math.PI * 2;
  const lean = () => !!(Z.gq && (Z.gq.lean || Z.gq.mini || Z.gq.level === 0));
  const R = (n, s) => { const v = Math.sin(n * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); };
  const drain = new WeakMap();
  function chain(c, x0, y0, x1, y1, col) {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.floor(L / 3)); c.strokeStyle = col; c.lineWidth = 0.8;
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; c.beginPath(); if (i % 2) c.ellipse(x, y, 0.7, 1.5, 0, 0, TAU); else c.ellipse(x, y, 1.2, 1.5, 0, 0, TAU); c.stroke(); }
  }
  function kran(c, m, t) {
    const x = m.x, w = m.w, top = m.y0 - 3 * T, px = x + w + 6, wood = "#5a3e26", woodL = "#8a6844", iron = "#4a4448";
    /* Pfosten auf dem oberen Boden, Ausleger, Strebe */
    c.fillStyle = wood; c.fillRect(px - 2.5, top - 4, 5, m.y0 - top + 4); c.fillStyle = woodL; c.fillRect(px - 2.5, top - 4, 1, m.y0 - top + 4);
    c.fillStyle = wood; c.fillRect(x - 8, top - 6, w + 22, 5); c.fillStyle = woodL; c.fillRect(x - 8, top - 6, w + 22, 1);
    c.save(); c.translate(px, top + 18); c.rotate(-0.9); c.fillStyle = wood; c.fillRect(-1.6, -22, 3.2, 22); c.restore();
    c.fillStyle = iron; c.fillRect(px - 3.5, top - 6.5, 7, 2); c.fillRect(px - 3.5, top + 14, 7, 1.6);
    /* Seilrolle */
    const cx = x + w / 2, cy = top + 1, ang = m.y / 7;
    c.fillStyle = "#3a2c20"; c.beginPath(); c.arc(cx, cy, 5, 0, TAU); c.fill(); c.strokeStyle = "#8a7a60"; c.lineWidth = 0.8; c.beginPath(); c.arc(cx, cy, 4, 0, TAU); c.stroke();
    c.strokeStyle = "#6a5a48"; c.lineWidth = 0.9; c.beginPath(); for (let i = 0; i < 3; i++) { const a = ang + i * Math.PI / 3; c.moveTo(cx - Math.cos(a) * 4, cy - Math.sin(a) * 4); c.lineTo(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4); } c.stroke();
    c.fillStyle = iron; c.beginPath(); c.arc(cx, cy, 1.3, 0, TAU); c.fill();
    /* Ketten zur Plattform */
    chain(c, cx - 4, cy + 2, x + 3, m.y - 9, "#9a9088"); chain(c, cx + 4, cy + 2, x + w - 3, m.y - 9, "#9a9088");
    c.strokeStyle = iron; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 3, m.y - 9); c.lineTo(x + 1, m.y); c.moveTo(x + 3, m.y - 9); c.lineTo(x + 7, m.y); c.moveTo(x + w - 3, m.y - 9); c.lineTo(x + w - 1, m.y); c.moveTo(x + w - 3, m.y - 9); c.lineTo(x + w - 7, m.y); c.stroke();
    /* Plattform: Bohlen mit Geländer */
    c.fillStyle = "#6a4a2c"; c.fillRect(x - 1, m.y, w + 2, 5); c.fillStyle = "#9a7a52"; c.fillRect(x - 1, m.y, w + 2, 1.2);
    c.fillStyle = "rgba(0,0,0,.35)"; for (let i = 1; i < 4; i++) c.fillRect(x + i * w / 4, m.y + 1, 0.7, 4);
    c.fillStyle = iron; c.fillRect(x - 1, m.y + 4, w + 2, 1.2);
    c.fillStyle = wood; c.fillRect(x - 1, m.y - 9, 1.6, 9); c.fillRect(x + w - 0.6, m.y - 9, 1.6, 9); c.fillRect(x - 1, m.y - 9, 3, 1.2); c.fillRect(x + w - 2, m.y - 9, 3, 1.2);
    /* Gegengewicht: hängt am Ausleger-Ende, fährt gegenläufig */
    const gx = x + w + 12, span = Math.max(1, m.y1 - m.y0), gy = top + 10 + (1 - (m.y - m.y0) / span) * Math.min(3 * T, span * 0.4);
    chain(c, gx, top - 1, gx, gy, "#8a8078");
    c.fillStyle = "#6a625a"; c.fillRect(gx - 4.5, gy, 9, 8); c.fillStyle = "#8a8278"; c.fillRect(gx - 4.5, gy, 9, 1.2); c.fillStyle = "#4a443e"; c.fillRect(gx - 4.5, gy + 4, 9, 0.7);
  }
  function bruecke(c, o, t) {
    const x = o.x * T, y = o.y0 * T, w = 2 * T, h = 3 * T, rich = !lean();
    /* Mauerrisse über und in der verschütteten Öffnung */
    c.strokeStyle = "rgba(20,14,12,.7)"; c.lineWidth = 0.9; c.beginPath();
    for (let k = 0; k < 4; k++) { let cx = x + w * (0.2 + 0.6 * R(k, o.x)), cy = y - 6 + R(k + 3, o.x) * 10; c.moveTo(cx, cy); for (let s = 0; s < 4; s++) { cx += (R(k * 7 + s, o.x) - 0.5) * 9; cy += 4 + R(k * 5 + s, o.y0) * 6; c.lineTo(cx, cy); } }
    c.stroke();
    /* abgebrochene Bogenansätze links und rechts */
    for (const sd of [-1, 1]) {
      const bx = sd < 0 ? x - 2 : x + w + 2, n = 3;
      for (let i = 0; i < n; i++) { const a0 = sd < 0 ? Math.PI + i * 0.32 : -i * 0.32 - 0.3, a1 = a0 + 0.3; const cx = sd < 0 ? bx + 22 : bx - 22, cy = y + 10;
        c.fillStyle = i % 2 ? "#6a625c" : "#7a7068"; c.beginPath(); c.arc(cx, cy, 24, a0, a1); c.arc(cx, cy, 18, a1, a0, true); c.closePath(); c.fill(); }
      /* hängende Bohle */
      const sw = Math.sin(t * 1.3 + sd) * 0.08; c.save(); c.translate(sd < 0 ? x + 3 : x + w - 3, y + h - 6); c.rotate((sd < 0 ? 1.15 : -1.15) + sw); c.fillStyle = "#6a4a2c"; c.fillRect(-1.5, 0, 3, 14); c.fillStyle = "#8a6a44"; c.fillRect(-1.5, 0, 0.8, 14); c.fillStyle = "#3a2a1c"; c.fillRect(-1.5, 12, 3, 2); c.restore();
    }
    if (rich && Math.random() < 0.04) FX.p({ x: x + Math.random() * w, y: y - 4, vx: 0, vy: 15, g: 120, life: 1.2, size: 1, col: Z.dustCol || "#8a7a70", kind: "dot" });
  }
  function flut(c, o, t) {
    const lv = Z.level, g = (lv.gates || [])[o.gate]; if (!g) return;
    const x0 = o.x0 * T, x1 = (o.x1 + 1) * T;
    let s = drain.get(g); if (!s) { s = { t0: g.open ? -1 : null }; drain.set(g, s); }
    /* Beckenform aus den Flut-Kacheln (g.tiles): je Spalte tiefste Kachel; Gitter über der tiefsten Stelle der Mitte */
    if (!s.cols) { s.cols = new Map(); let mn = 1e9; for (const [tx, ty] of g.tiles) { const c0 = s.cols.get(tx); if (!c0) s.cols.set(tx, [ty, ty]); else { c0[0] = Math.min(c0[0], ty); c0[1] = Math.max(c0[1], ty); } mn = Math.min(mn, ty); }
      s.top = mn; const mid = Math.round((o.x0 + o.x1) / 2); let best = null; for (const [tx, v] of s.cols) if (!best || Math.abs(tx - mid) < Math.abs(best[0] - mid) || (Math.abs(tx - mid) === Math.abs(best[0] - mid) && v[1] > best[1][1])) best = [tx, v]; s.gx = best ? best[0] * T + 8 : (x0 + x1) / 2; s.gy = best ? (best[1][1] + 1) * T : (o.bot + 1) * T; }
    const floor = s.gy, topY = s.top * T, cx = s.gx;
    if (g.open && s.t0 === null) s.t0 = t;
    const d = s.t0 === null ? 0 : s.t0 < 0 ? 1 : Math.min(1, (t - s.t0) / 1.6);
    /* Ablaufgitter im Beckenboden */
    c.fillStyle = "#14100e"; c.fillRect(cx - 14, floor - 2, 28, 3);
    c.fillStyle = "#4a4448"; c.fillRect(cx - 15, floor - 3, 30, 1.4); for (let i = 0; i <= 7; i++) c.fillRect(cx - 14 + i * 4, floor - 3, 1.2, 4);
    c.fillStyle = "#7a7278"; c.fillRect(cx - 15, floor - 3, 30, 0.5);
    if (d > 0 && d < 1) {
      /* sinkender Wasserspiegel (die Kacheln sind schon leer) */
      const e = d * d * (3 - 2 * d), lvl = topY + (floor - topY) * e;
      for (const [tx, v] of s.cols) { const yb = (v[1] + 1) * T; if (yb <= lvl) continue; const ya = Math.max(lvl, v[0] * T);
        c.fillStyle = "rgba(40,86,72,.62)"; c.fillRect(tx * T, ya, T, yb - ya);
        if (ya === lvl) { c.fillStyle = "rgba(150,200,170,.6)"; for (let x = tx * T; x < tx * T + T; x += 3) c.fillRect(x, lvl + Math.sin(x * 0.4 + t * 9) * 0.8, 2, 0.8); } }
      /* Strudel über dem Gitter */
      c.save(); c.translate(cx, Math.max(lvl + 3, floor - 10)); c.strokeStyle = "rgba(190,230,200,.7)"; c.lineWidth = 0.8;
      for (let k = 0; k < 3; k++) { c.beginPath(); for (let i = 0; i < 26; i++) { const a = -t * 9 + i * 0.45 + k * TAU / 3, r = 1 + i * 0.5 * (1 - d * 0.5); c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.35); } c.stroke(); }
      c.restore();
      if (!lean() && Math.random() < 0.5) FX.p({ x: cx + (Math.random() - 0.5) * 20, y: floor - 3, vx: (Math.random() - 0.5) * 10, vy: -20 - Math.random() * 20, life: 0.6, size: 1.2, col: "#b8e0c8", kind: "bubble" });
    } else if (d >= 1 && s.t0 !== null && !lean()) {
      /* nasser Glanz am Beckenboden, verblasst */
      const age = s.t0 < 0 ? 99 : t - s.t0 - 1.6; if (age < 8) { c.fillStyle = "rgba(160,210,180," + (0.25 * (1 - age / 8)).toFixed(3) + ")"; for (const [tx, v] of s.cols) c.fillRect(tx * T, (v[1] + 1) * T - 1, T, 1); }
    }
  }
  /* Merker für erkundung.js: die schlichte Fassung darf entfallen (siehe Bericht: eine Zeile in drawKran/drawTruemmer) */
  Z.sonderPracht = () => !(G.off && G.off.sonder);
  const dp0 = Z.drawParcours;
  Z.drawParcours = function (c, t) {
    if (dp0) dp0.apply(this, arguments);
    const lv = Z.level; if (!lv || !lv.specials || !lv.specials.length || (G.off && G.off.sonder)) return;
    try {
      const cam = Z.cam, vis = (x, y, m) => x > cam.x - (m || 80) && x < cam.x + cam.w + (m || 80) && y > cam.y - 120 && y < cam.y + cam.h + 120;
      const tt = performance.now() / 1000;
      for (const m of (Z._kraene ? Z._kraene() : [])) if (m.x > cam.x - 80 && m.x < cam.x + cam.w + 80 && m.y1 > cam.y - 80 && m.y0 - 60 < cam.y + cam.h) kran(c, m, tt);
      for (const o of lv.specials) {
        if (o.k === "bruecke" && vis(o.x * T, o.y0 * T)) bruecke(c, o, tt);
        else if (o.k === "flut" && vis(o.x0 * T, o.top * T, 120)) flut(c, o, tt);
      }
    } catch (e) { console.error(e); }
  };
})();

/* Ezekiel – The Destroyer · Zerstörbare Wände und morsche Böden (W11 Runde 19)
   Daten: welt.js lv.wuchtSet/lv.wucht (Wucht-Risse, Kachel 7) und lv.morsch [{x0,x1,y,broken}] (erkundung.js).
   – Wucht-Wände: Aussehen im Kachelbild (bild.js wuchtWall: Putz, Rissnetz, Ausbruch, Bröckel); hier: in der Nähe
     rieselt ab und zu Staub; bricht die Wand, fallen Brocken (drehen, springen, bleiben ~3 s liegen), Putzplatten und
     eine Staubwolke.
   – Morsche Böden: einzelne Bohlen mit Maserung, Nägeln, Rissen und herabhängenden Splittern; unter Ezekiel biegen sie
     sich leicht durch. Brechen sie, fliegen die Bohlenstücke (drehend) in die Tiefe, an den Rändern bleiben gesplitterte
     Stümpfe stehen.
   Lean: nur die Bruchstücke (wenige), kein Rieseln/Durchbiegen. Schalter Z.gfx.off.bruch. */
(function () {
  const Z = window.Z, FX = Z.fx, G = Z.gfx, T = 16, TAU = Math.PI * 2;
  const lean = () => !!(Z.gq && (Z.gq.lean || Z.gq.mini || Z.gq.level === 0));
  const off = () => !!(G.off && G.off.bruch);
  const solid = (x, y) => Z.world && Z.world.solidAt(x, y);
  let lvRef = null, wt = [], mState = new Map(), D = [], lastT = 0;
  const hash = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  function reset(lv) { lvRef = lv; D = []; mState = new Map(); wt = lv && lv.wuchtSet ? Array.from(lv.wuchtSet).filter(i => lv.get(i % lv.W, (i / lv.W) | 0) === 7) : []; }
  function chunks(px, py, col, n) {
    for (let i = 0; i < n; i++) D.push({ k: "brocken", x: px + Math.random() * T, y: py + Math.random() * T, vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 120, r: Math.random() * 6, vr: (Math.random() - 0.5) * 16, s: 2 + Math.random() * 3, col, t: 0, life: 3 + Math.random() });
  }
  function collapse(x, y) {
    const px = x * T, py = y * T, lo = lean(), col = (Z.biome && Z.biome.wall) || "#4a4240";
    chunks(px, py, col, lo ? 3 : 7);
    if (!lo) {
      FX.burst(px + 8, py + 8, 10, { col: [Z.dustCol || "#8a7a70", "#a89a8a"], sp: 70, life: 1.1, size: 5, kind: "smoke", g: -10, drag: 0.95 });
      for (let i = 0; i < 4; i++) D.push({ k: "putz", x: px + Math.random() * T, y: py + Math.random() * 8, vx: (Math.random() - 0.5) * 60, vy: -20, r: 0, vr: (Math.random() - 0.5) * 10, s: 3 + Math.random() * 2, col: "#c8b8a0", t: 0, life: 2.5 });
    }
    if (D.length > 90) D.splice(0, D.length - 90);
  }
  function breakPlanks(m) {
    const lo = lean();
    for (let x = m.x0; x <= m.x1; x++) for (let k = 0; k < (lo ? 1 : 3); k++) D.push({ k: "bohle", x: x * T + 3 + k * 5, y: m.y * T + 3, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 100, r: (Math.random() - 0.5) * 0.4, vr: (Math.random() - 0.5) * 14, s: 5 + Math.random() * 3, col: "#6a4a2c", t: 0, life: 3 });
  }
  function tick() {
    const now = performance.now() / 1000, dt = Math.min(0.05, lastT ? now - lastT : 0.016); lastT = now;
    const lv = Z.level; if (lv !== lvRef) reset(lv); if (!lv || Z.paused) return;
    /* gebrochene Wucht-Kacheln */
    for (let i = wt.length - 1; i >= 0; i--) { const idx = wt[i], x = idx % lv.W, y = (idx / lv.W) | 0; if (lv.get(x, y) !== 7) { wt.splice(i, 1); collapse(x, y); } }
    /* gebrochene Bohlen */
    for (const m of lv.morsch || []) { let s = mState.get(m); if (!s) { s = { broken: !!m.broken, seen: !!m.broken }; mState.set(m, s); } if (m.broken && !s.broken) { s.broken = true; breakPlanks(m); } }
    for (let i = D.length - 1; i >= 0; i--) {
      const o = D[i]; o.t += dt; if (o.t > o.life) { D.splice(i, 1); continue; }
      if (o.rest) continue;
      o.vy += (o.k === "putz" ? 260 : 640) * dt; if (o.k === "putz") o.vx *= 0.98; o.x += o.vx * dt; o.y += o.vy * dt; o.r += o.vr * dt;
      if (solid(o.x, o.y + 1)) { o.y = Math.floor((o.y + 1) / T) * T - 1; if (o.vy > 120) { o.vy *= -0.3; o.vx *= 0.6; o.vr *= 0.5; } else { o.rest = 1; o.vx = o.vy = o.vr = 0; } }
    }
    /* Rieseln an Wucht-Wänden in Spielernähe */
    if (!lean() && wt.length && Math.random() < 0.05) { const P = Z.player; if (P) { const idx = wt[(Math.random() * wt.length) | 0], x = idx % lv.W, y = (idx / lv.W) | 0; if (Math.abs(x * T - P.x) < 200 && Math.abs(y * T - P.y) < 150) FX.p({ x: x * T + Math.random() * T, y: y * T + Math.random() * 6, vx: 0, vy: 10, g: 140, life: 1, size: 0.9, col: Z.dustCol || "#8a7a70", kind: "dot" }); } }
  }
  function drawPlanks(c, m, t) {
    const x = m.x0 * T, y = m.y * T, w = (m.x1 - m.x0 + 1) * T, P = Z.player, lo = lean();
    if (m.broken) { /* gesplitterte Stümpfe an den Rändern */
      for (const [sx, d] of [[x - 1, 1], [x + w + 1, -1]]) { c.fillStyle = "#5a3e26"; c.beginPath(); c.moveTo(sx, y); c.lineTo(sx + d * 6, y); c.lineTo(sx + d * 4, y + 3); c.lineTo(sx + d * 7, y + 5); c.lineTo(sx, y + 6); c.fill(); }
      return;
    }
    const on = P && P.onGround && P.x + P.w > x && P.x < x + w && Math.abs(P.y + P.h - y) < 3;
    const sag = !lo && on ? 1.6 + Math.sin(t * 9) * 0.3 : 0, px0 = P ? Math.max(x, Math.min(x + w, P.x + P.w / 2)) : x + w / 2;
    const n = m.x1 - m.x0 + 1, bw = w / (n * 2);
    for (let i = 0; i < n * 2; i++) {
      const bx = x + i * bw, mid = bx + bw / 2, dd = 1 - Math.min(1, Math.abs(mid - px0) / (w * 0.6)), sy = y + sag * dd;
      c.fillStyle = i % 2 ? "#5e4028" : "#664630"; c.fillRect(bx, sy, bw - 0.6, 6.5);
      c.fillStyle = "#86603e"; c.fillRect(bx, sy, bw - 0.6, 1.2);
      c.strokeStyle = "rgba(40,24,12,.55)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(bx + 1, sy + 3 + hash(i, m.x0) * 2); c.quadraticCurveTo(mid, sy + 2 + hash(m.y, i) * 3, bx + bw - 1.5, sy + 3.4); c.stroke();
      c.fillStyle = "#3a3438"; c.fillRect(bx + 1, sy + 1.6, 0.9, 0.9); c.fillRect(bx + bw - 2.4, sy + 1.6, 0.9, 0.9);
      if (hash(i * 3, m.y) < 0.4) { c.strokeStyle = "rgba(20,10,4,.9)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(mid - 1, sy); c.lineTo(mid + 1, sy + 3); c.lineTo(mid - 0.5, sy + 6.5); c.stroke(); }
      if (!lo && hash(i, m.x1) < 0.35) { c.fillStyle = "#4a3220"; c.beginPath(); c.moveTo(mid - 1, sy + 6.5); c.lineTo(mid + 0.6, sy + 6.5); c.lineTo(mid - 0.2 + Math.sin(t * 2 + i) * 0.4, sy + 10 + hash(i, 7) * 3); c.fill(); }
    }
    c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(x, y + 6.5 + sag, w, 1);
  }
  function draw(c, t) {
    const cam = Z.cam;
    for (const m of Z.level.morsch || []) { const x = m.x0 * T, y = m.y * T; if (x > cam.x - 60 && x < cam.x + cam.w + 20 && y > cam.y - 30 && y < cam.y + cam.h + 30) drawPlanks(c, m, t); }
    for (const o of D) {
      if (o.x < cam.x - 30 || o.x > cam.x + cam.w + 30 || o.y < cam.y - 30 || o.y > cam.y + cam.h + 30) continue;
      const a = Math.min(1, (o.life - o.t) / 0.8); c.save(); c.globalAlpha = a; c.translate(o.x, o.y); c.rotate(o.r);
      if (o.k === "brocken") { c.fillStyle = o.col; c.beginPath(); c.moveTo(-o.s, o.s * 0.5); c.lineTo(-o.s * 0.4, -o.s); c.lineTo(o.s, -o.s * 0.3); c.lineTo(o.s * 0.6, o.s * 0.8); c.closePath(); c.fill(); c.fillStyle = "rgba(255,235,200,.18)"; c.fillRect(-o.s * 0.4, -o.s * 0.9, o.s, 0.7); }
      else if (o.k === "putz") { c.fillStyle = o.col; c.fillRect(-o.s / 2, -o.s / 3, o.s, o.s * 0.6); }
      else { c.fillStyle = o.col; c.fillRect(-o.s / 2, -1.5, o.s, 3); c.fillStyle = "#86603e"; c.fillRect(-o.s / 2, -1.5, o.s, 0.7); c.fillStyle = "#3a2416"; c.beginPath(); c.moveTo(o.s / 2, -1.5); c.lineTo(o.s / 2 + 2, 0); c.lineTo(o.s / 2, 1.5); c.fill(); }
      c.restore();
    }
  }
  const dp0 = Z.drawParcours;
  Z.drawParcours = function (c, t) {
    if (dp0) dp0.apply(this, arguments);
    if (off()) return;
    try { tick(); if (Z.level && ((Z.level.morsch && Z.level.morsch.length) || D.length)) draw(c, performance.now() / 1000); } catch (e) { console.error(e); }
  };
  Z.bruchDbg = () => ({ wucht: wt.length, teile: D.length, morsch: (Z.level && Z.level.morsch || []).length });
})();

/* Ezekiel – The Destroyer · Bewegte Teile der Raumvorlagen (W11 Runde 22)
   Fähren (parcours.js, Z.parcoursMovers) in Förderband-, Fasslager-, Uhrwerk- und Kai-Räumen werden als Band-Wagen mit
   Rollen und laufendem Gurt gezeichnet (über der Fährplatte); die Säge (Z.traps k "saege") im Uhrwerk als drehendes
   Zahnrad mit Nabe. Trefferzonen unverändert. Schalter Z.gfx.off.vorlagen. */
(function () {
  const Z = window.Z, G = Z.gfx, T = 16, TAU = Math.PI * 2;
  const tplAt = (x, y) => { const lv = Z.level, c = lv && lv.cells && lv.cells[Math.floor(x / T / Z.CW) + "," + Math.floor(y / T / Z.CH)]; return c && c.tpl ? c.tpl.replace(/_(o|u|ou)$/, "") : ""; };
  const BAND = { foerderband: 1, fasslager: 1, uhrwerk: 1, kai: 1 };
  function belt(c, m, t) {
    const x = Math.round(m.x * 4) / 4, y = m.y, w = m.w;
    c.fillStyle = "#2a2426"; c.fillRect(x - 2, y - 0.5, w + 4, 9);
    c.fillStyle = "#3e3638"; c.fillRect(x, y, w, 4); c.fillStyle = "#5a5256"; c.fillRect(x, y, w, 1);
    const off = (t * 30 * (m.dir || 1)) % 6; c.fillStyle = "rgba(0,0,0,.45)"; for (let k = -6; k < w + 6; k += 6) { const xx = x + ((k + off) % (w + 6) + w + 6) % (w + 6); if (xx < x + w - 1) c.fillRect(xx, y + 1, 1.2, 3); }
    for (const rx of [x + 4, x + w / 2, x + w - 4]) { c.fillStyle = "#4a4448"; c.beginPath(); c.arc(rx, y + 6, 3, 0, TAU); c.fill(); c.strokeStyle = "#8a8288"; c.lineWidth = 0.6; const a = t * 6 * (m.dir || 1); c.beginPath(); c.moveTo(rx + Math.cos(a) * 2.4, y + 6 + Math.sin(a) * 2.4); c.lineTo(rx - Math.cos(a) * 2.4, y + 6 - Math.sin(a) * 2.4); c.stroke(); }
  }
  function gear(c, tr, t) {
    const x = tr.x, y = tr.y, r = 11, n = 10, a0 = (tr.rot || t * 6);
    c.save(); c.translate(x, y); c.rotate(a0);
    c.fillStyle = "#6a5a40"; c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, rr = i % 2 ? r : r + 3; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill();
    c.fillStyle = "#8a7650"; c.beginPath(); c.arc(0, 0, r - 2, 0, TAU); c.fill();
    c.fillStyle = "#3a3024"; for (let k = 0; k < 4; k++) { c.save(); c.rotate(k * Math.PI / 2); c.fillRect(-1.2, 2.5, 2.4, r - 5); c.restore(); }
    c.beginPath(); c.arc(0, 0, 2.6, 0, TAU); c.fill(); c.fillStyle = "#c8a860"; c.fillRect(-0.7, -0.7, 1.4, 1.4);
    c.restore();
  }
  const dp0 = Z.drawParcours;
  Z.drawParcours = function (c, t) {
    if (dp0) dp0.apply(this, arguments);
    if (G.off && G.off.vorlagen) return;
    try {
      const cam = Z.cam, tt = performance.now() / 1000, vis = (x, y) => x > cam.x - 60 && x < cam.x + cam.w + 60 && y > cam.y - 60 && y < cam.y + cam.h + 60;
      for (const m of Z.parcoursMovers || []) if (vis(m.x, m.y) && BAND[tplAt(m.x + m.w / 2, m.y)]) belt(c, m, tt);
      for (const tr of Z.traps || []) if (tr.k === "saege" && vis(tr.x, tr.y) && tplAt(tr.x, tr.y) === "uhrwerk") gear(c, tr, tt);
    } catch (e) { console.error(e); }
  };
})();

/* Ezekiel – The Destroyer · Rollende Fässer, Kronleuchter-Schwung, Gezeiten (W11 Runde 23; Daten/Logik erkundung.js)
   Über der schlichten Fassung aus erkundung.js:
   – Fässer: Stirnansicht mit Dauben (abwechselnd hell/dunkel), zwei Eisenreifen, Spundloch, Staubspur am Boden;
     Rutsche als Holzschacht mit Rahmen, beim Vorwarnen rumpelt sie (Wackeln).
   – Kronleuchter: Gliederkette, eiserner Radleuchter mit Tropfschalen, sechs Kerzen mit Flammen, die sich gegen die
     Bewegung legen; bei Schwung eine leuchtende Bogen-Spur.
   – Gezeiten: Schaumlinie auf dem Wasserspiegel, Wasserstandsmarke (nasser Streifen) an den Wänden bis zur Flut,
     aufsteigende Blasen kurz vor dem Steigen. Grün/Türkis, kein Blau.
   Lean: schlichter (keine Spur, weniger Kerzen). Schalter Z.gfx.off.r7. */
(function () {
  const Z = window.Z, G = Z.gfx, T = 16, TAU = Math.PI * 2;
  const lean = () => !!(Z.gq && (Z.gq.lean || Z.gq.mini));
  const trail = new WeakMap();
  function barrels(c, ro, t) {
    const lo = lean(), sh = ro.warn ? Math.sin(t * 60) * 0.8 : 0, cx = ro.x - ro.dir * 6 + sh, cy = ro.y - 9;
    c.fillStyle = "#3a2616"; c.fillRect(cx - 11, cy - 10, 22, 19); c.fillStyle = "#14100c"; c.beginPath(); c.arc(cx, cy, 8, Math.PI, 0); c.fill(); c.fillRect(cx - 8, cy, 16, 9);
    c.fillStyle = "#6a4a2c"; c.fillRect(cx - 11, cy - 11, 22, 2); c.fillRect(cx - 11, cy - 10, 2, 19); c.fillRect(cx + 9, cy - 10, 2, 19);
    for (const b of ro.barrels) {
      if (!lo && Math.random() < 0.3) Z.fx.p({ x: b.x - Math.sign(b.vx) * b.r, y: b.y + b.r - 1, vx: -b.vx * 0.1, vy: -8, life: 0.5, size: 2.5, col: Z.dustCol || "#8a7a70", kind: "smoke", a: 0.4 });
      c.save(); c.translate(b.x, b.y); c.rotate(b.rot); const r = b.r;
      for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? "#6e4828" : "#7e5634"; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, k * TAU / 8, (k + 1) * TAU / 8); c.closePath(); c.fill(); }
      c.strokeStyle = "#3a2a24"; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 0, r - 0.7, 0, TAU); c.stroke();
      c.strokeStyle = "#6a6266"; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, r * 0.62, 0, TAU); c.stroke();
      c.fillStyle = "#2a1a10"; c.beginPath(); c.arc(r * 0.35, 0, 1.3, 0, TAU); c.fill();
      c.restore();
      c.fillStyle = "rgba(255,230,190,.18)"; c.beginPath(); c.arc(b.x - 2, b.y - 2, b.r * 0.6, Math.PI * 1.1, Math.PI * 1.6); c.lineTo(b.x, b.y); c.fill();
    }
  }
  function swing(c, s2, t) {
    const lo = lean(), hx = s2.ax + Math.sin(s2.th) * s2.L, hy = s2.ay + Math.cos(s2.th) * s2.L;
    /* Spur */
    if (!lo) { let tr = trail.get(s2); if (!tr) { tr = []; trail.set(s2, tr); } tr.push([hx, hy]); if (tr.length > 10) tr.shift();
      if (Math.abs(s2.om) > 1.2 && tr.length > 2) { c.save(); c.globalCompositeOperation = "lighter"; c.lineCap = "round"; for (let i = 1; i < tr.length; i++) { c.strokeStyle = "rgba(255,190,100," + (0.05 * i).toFixed(3) + ")"; c.lineWidth = 2 + i * 0.6; c.beginPath(); c.moveTo(tr[i - 1][0], tr[i - 1][1] - 6); c.lineTo(tr[i][0], tr[i][1] - 6); c.stroke(); } c.restore(); } }
    /* Kette aus Gliedern */
    const n = Math.max(3, Math.floor(s2.L / 5)); c.strokeStyle = "#5a5058"; c.lineWidth = 0.9;
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, x = s2.ax + (hx - s2.ax) * u, y = s2.ay + (hy - s2.ay) * u; c.beginPath(); c.ellipse(x, y, i % 2 ? 0.8 : 1.6, 2.2, -s2.th, 0, TAU); c.stroke(); }
    /* Radleuchter */
    c.save(); c.translate(hx, hy); c.rotate(-s2.th * 0.3);
    c.strokeStyle = "#3a3236"; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0); c.lineTo(-12, 6); c.moveTo(0, 0); c.lineTo(12, 6); c.moveTo(0, 0); c.lineTo(0, 6); c.stroke();
    c.fillStyle = "#3a2a18"; c.beginPath(); c.ellipse(0, 7, 14, 3, 0, 0, TAU); c.fill(); c.fillStyle = "#8a6a28"; c.beginPath(); c.ellipse(0, 6.4, 14, 2.4, 0, 0, TAU); c.fill(); c.fillStyle = "#2a1c0e"; c.beginPath(); c.ellipse(0, 6.4, 10.5, 1.3, 0, 0, TAU); c.fill();
    const lean2 = -s2.om * 1.6;
    for (const dx of lo ? [-9, 0, 9] : [-12, -7, -2.5, 2.5, 7, 12]) {
      c.fillStyle = "#6a5020"; c.fillRect(dx - 1.6, 4.6, 3.2, 1); c.fillStyle = "#efe4c8"; c.fillRect(dx - 0.9, 0, 1.8, 5);
      const f = 0.75 + 0.25 * Math.sin(t * 11 + dx); c.fillStyle = "rgba(255,190,90," + f.toFixed(2) + ")"; c.beginPath(); c.moveTo(dx - 1.3, 0); c.quadraticCurveTo(dx + lean2 * 0.5, -3, dx + lean2, -4.6 * f); c.quadraticCurveTo(dx + lean2 * 0.3 + 0.8, -2, dx + 1.3, 0); c.fill();
    }
    c.restore();
  }
  function tides(c, o, t) {
    const lv = Z.level, cols = new Map(); let maxRow = 1e9;
    for (const [x, y, s2] of o.td.rows) { if (s2 === 2) maxRow = Math.min(maxRow, y); if (lv.get(x, y) === 6) { const v = cols.get(x); if (v == null || y < v) cols.set(x, y); } }
    /* Wasserstandsmarke bei Flut: nasser, dunkler Streifen auf den Wänden neben dem Becken */
    if (maxRow < 1e9) for (const [x, y] of o.td.rows) if (y === maxRow) for (const sd of [-1, 1]) { const v = lv.get(x + sd, y); if (v === 1) { c.fillStyle = "rgba(20,40,32,.35)"; c.fillRect((x + (sd > 0 ? 1 : 0)) * T - (sd > 0 ? 0 : 3), y * T, 3, T); c.fillStyle = "rgba(200,220,190,.25)"; c.fillRect((x + (sd > 0 ? 1 : 0)) * T - (sd > 0 ? 0 : 3), y * T, 3, 1); } }
    /* R25: steigende Flut ohne kantige Spaltenstufen. erkundung.js füllt nur Luftkacheln; Leiter-/Stegspalten
       blieben trocken und der Spiegel zerfiel in Stücke. Hier (nur Bild) dieselbe Wasserfarbe in diesen Spalten und
       ein durchgehender, über die Spalten interpolierter Wasserspiegel; nur massive Kacheln unterbrechen ihn. */
    { const h = o.h || 0, td = o.td;
      if (h >= 0.5) {
        const top = td.yw * T - h, solid = v => v === 1 || v === 7 || v === 12, inRows = new Set(td.rows.map(r => r[0] + "," + r[1]));
        c.fillStyle = "rgba(48,96,82,.62)";
        for (let x = td.xa; x <= td.xb; x++) for (let s2 = 1; s2 <= 2; s2++) { const y = td.yw - s2; if (inRows.has(x + "," + y) || solid(lv.get(x, y))) continue; const y0 = Math.max(y * T, top), y1 = (y + 1) * T; if (y1 > y0) c.fillRect(x * T, y0, T, y1 - y0); }
        /* R26: zweite, deckendere Wasserschicht mit Tiefenverlauf über allen gefluteten Kacheln – so scheinen helle
           Himmels- und dunkle Mauerspalten kaum noch unterschiedlich durch (vorher 62 % Deckung, jetzt rund 80 %) */
        { const dg = c.createLinearGradient(0, top, 0, td.yw * T); dg.addColorStop(0, "rgba(44,92,76,.34)"); dg.addColorStop(1, "rgba(22,52,44,.5)"); c.fillStyle = dg;
          for (let x = td.xa; x <= td.xb; x++) for (let s2 = 1; s2 <= 2; s2++) { const y = td.yw - s2; if (!inRows.has(x + "," + y) && solid(lv.get(x, y))) continue; const y0 = Math.max(y * T, top), y1 = (y + 1) * T; if (y1 > y0) c.fillRect(x * T, y0, T, y1 - y0); } }
        const ty = Math.floor((top + 1) / T), wy = x => top + Math.sin(x * 0.11 + t * 2.4) * 0.9 + Math.sin(x * 0.037 - t * 1.3) * 0.6;
        /* Spiegelband (heller Saum unter der Linie) und Linie als ein Pfad je zusammenhängendem Stück */
        let run = null; const segs = [];
        for (let x = td.xa; x <= td.xb + 1; x++) { const ok = x <= td.xb && !solid(lv.get(x, ty)); if (ok && !run) run = [x, x]; else if (ok) run[1] = x; else if (run) { segs.push(run); run = null; } }
        for (const [a0, a1] of segs) {
          const x0 = a0 * T, x1 = (a1 + 1) * T;
          const gr = c.createLinearGradient(0, top - 1, 0, top + 7); gr.addColorStop(0, "rgba(150,205,175,.28)"); gr.addColorStop(1, "rgba(150,205,175,0)");
          c.fillStyle = gr; c.beginPath(); c.moveTo(x0, wy(x0)); for (let x = x0 + 3; x < x1; x += 3) c.lineTo(x, wy(x)); c.lineTo(x1, wy(x1)); c.lineTo(x1, top + 7); c.lineTo(x0, top + 7); c.closePath(); c.fill();
          c.strokeStyle = "rgba(210,236,214,.75)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, wy(x0)); for (let x = x0 + 3; x < x1; x += 3) c.lineTo(x, wy(x)); c.lineTo(x1, wy(x1)); c.stroke();
        }
      }
    }
    /* Schaumlinie */
    c.strokeStyle = "rgba(220,236,220,.7)"; c.lineWidth = 1;
    for (const [x, y] of cols) { const px = x * T, py = y * T + 5; c.beginPath(); for (let k = 0; k <= T; k += 2) { const yy = py + Math.sin(t * 3 + (px + k) * 0.25) * 0.9; k ? c.lineTo(px + k, yy) : c.moveTo(px + k, yy); } c.stroke();
      if (Math.random() < 0.04) Z.fx.p({ x: px + Math.random() * T, y: py, vx: 0, vy: -6, life: 0.6, size: 1.2, col: "#e0f0e0", kind: "dot" }); }
    /* Gurgeln vor dem Steigen */
    if (o.ph > 4.5 && o.ph < 6 && !lean()) for (const [x, y, s2] of o.td.rows) if (s2 === 1 && Math.random() < 0.05) Z.fx.p({ x: x * T + Math.random() * T, y: (y + 1) * T, vx: 0, vy: -30, life: 0.8, size: 1.4, col: "#b8e0c8", kind: "bubble" });
  }
  const dp0 = Z.drawParcours;
  Z.drawParcours = function (c, t) {
    if (dp0) dp0.apply(this, arguments);
    if (G.off && G.off.r7) return;
    try {
      const S = Z.erkundung && Z.erkundung(); if (!S || S.lv !== Z.level) return;
      const cam = Z.cam, tt = performance.now() / 1000, vis = (x, y, m) => x > cam.x - (m || 80) && x < cam.x + cam.w + (m || 80) && y > cam.y - 120 && y < cam.y + cam.h + 120;
      for (const ro of S.rollers || []) if (vis(ro.x, ro.y) || ro.barrels.length) barrels(c, ro, tt);
      for (const s2 of S.swings || []) if (vis(s2.ax, s2.ay + s2.L)) swing(c, s2, tt);
      for (const o of S.tides || []) { const [cx, cy] = o.td.cell.split(",").map(Number); if (vis(cx * Z.CW * T + Z.CW * 8, cy * Z.CH * T + Z.CH * 8, 300)) tides(c, o, tt); }
    } catch (e) { console.error(e); }
  };
})();

/* W11 R24: Schwebetexte stapeln statt überlappen (z. B. „Kette 3 …“ und „Kette 5 …“ kurz nacheinander):
   ein neuer Text, der dicht auf einem noch lebenden landet, rückt darüber. Nur Lage, Inhalt/Dauer unverändert. */
(function () {
  const FX = window.Z && window.Z.fx; if (!FX || !FX.text) return;
  const t0 = FX.text;
  FX.text = function (x, y, txt, col, big) {
    const r = t0.apply(this, arguments);
    try {
      const L = FX.texts, n = L[L.length - 1]; if (!n) return r;
      const cm = window.Z.cam, dir = cm && n.y - cm.y < 40 ? 1 : -1; /* am oberen Bildrand nach unten stapeln */
          for (let k = 0; k < 4; k++) { let hit = false; for (let i = 0; i < L.length - 1; i++) { const o = L[i]; if (o.t < o.life * 0.8 && Math.abs(o.x - n.x) < (n.big || o.big ? 60 : 24) && Math.abs(o.y - n.y) < (n.big || o.big ? 12 : 8)) { n.y = o.y + dir * (n.big || o.big ? 13 : 9); hit = true; } } if (!hit) break; }
    } catch (_) {}
    return r;
  };
})();

/* Ezekiel – The Destroyer · Zeitrennen-Kammer, gemalt (W11 Runde 29; Daten/Logik abenteuer.js, gelesen über Z.abEvents)
   Über die schlichte Fassung: Steinsockel mit Kapitell, Messing-Sanduhr mit Glas, rinnendem Sand und Glanz;
   goldene Ringe, die sich drehen (Ellipse wechselt die Breite) und funkeln; Einsammeln: Funkenring und Lichtblitz;
   Countdown als Medaillon über Ezekiel (Bogen läuft ab, letzte 5 s rot pulsierend); Erfolg: goldener Funkenregen;
   dritter Fehlversuch: die Sanduhr zerspringt (Glasscherben, Sandschwall), danach bleibt der leere, gebrochene Rahmen.
   Kein Blau. Lean: ohne Glanz-/Funkenextras. Schalter Z.gfx.off.rennen. */
(function () {
  const Z = window.Z, G = Z.gfx, FX = Z.fx, TAU = Math.PI * 2;
  if (!G) return;
  const lean = () => !!(Z.gq && (Z.gq.lean || Z.gq.mini));
  const off = () => G.off && G.off.rennen;
  const ST = new WeakMap();
  const st = ev => { let s = ST.get(ev); if (!s) { s = { on: false, got: ev.rings.map(r => r.got), done: ev.done, win: false, broke: false, pulse: [], flash: 0 }; ST.set(ev, s); } return s; };
  function sparks(x, y, n, cols, sp) { if (!FX || !FX.burst) return; FX.burst(x, y, n, { col: cols, sp: sp || 90, life: 0.55, size: 1.8, kind: "glow", add: true }); }
  function track(ev) {
    const s = st(ev), now = performance.now() / 1000;
    if (ev.on && !s.on) { s.flash = now; s.broke = false; }
    ev.rings.forEach((r, i) => { if (r.got && !s.got[i]) { s.pulse.push({ x: r.x, y: r.y, t0: now }); if (!lean()) sparks(r.x, r.y, 14, ["#fff2c0", "#ffd27a", "#ffb040"], 110); } s.got[i] = r.got; });
    if (!ev.on && s.on && ev.done && ev.rings.every(r => r.got)) { s.win = true; if (!lean()) sparks(ev.x, ev.y - 30, 30, ["#fff2c0", "#ffd27a"], 160); }
    if (ev.done && !s.done && !s.win && ev.tries >= 3) { s.broke = true; s.brokeT = now; if (FX && FX.burst) { FX.burst(ev.x, ev.y - 22, lean() ? 8 : 18, { col: ["#f0f4e8", "#d8e0d0", "#fff"], sp: 130, life: 0.8, size: 1.6, kind: "shard", g: 600 }); FX.burst(ev.x, ev.y - 22, lean() ? 6 : 16, { col: ["#e5b454", "#c8963a"], sp: 70, life: 0.9, size: 1.4, g: 500, drag: 0.95 }); } }
    s.on = ev.on; s.done = ev.done; s.pulse = s.pulse.filter(p => now - p.t0 < 0.6);
    return s;
  }
  function pedestal(c, x, y, t) {
    /* Sockel: Fuß, Schaft mit Fugen, Kapitell – überdeckt die schlichte Fassung */
    const sg = c.createLinearGradient(x - 12, 0, x + 12, 0); sg.addColorStop(0, "#6a5e5a"); sg.addColorStop(0.5, "#4a4044"); sg.addColorStop(1, "#2a2428");
    c.fillStyle = "#2a2226"; c.fillRect(x - 13, y - 4, 26, 4); c.fillStyle = "#5a4e4c"; c.fillRect(x - 13, y - 4, 26, 1);
    c.fillStyle = sg; c.fillRect(x - 9, y - 15, 18, 11);
    c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(x - 9, y - 10, 18, 0.8); c.fillRect(x - 1, y - 15, 0.8, 5); c.fillRect(x + 3, y - 10, 0.8, 6);
    c.fillStyle = "#5e5250"; c.fillRect(x - 12, y - 18, 24, 3); c.fillStyle = "#7a6e68"; c.fillRect(x - 12, y - 18, 24, 1);
    /* eingeritzte Sanduhr-Rune vorn */
    c.strokeStyle = "rgba(229,180,84,.55)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 3, y - 13); c.lineTo(x + 3, y - 13); c.lineTo(x - 3, y - 7); c.lineTo(x + 3, y - 7); c.closePath(); c.stroke();
  }
  function hourglass(c, x, y, f, t, run, broke, bt) {
    const sy = y - 38, h = 20, w = 8;
    if (!broke) {
      /* Glas */
      c.fillStyle = "rgba(240,236,220,.16)"; c.beginPath(); c.moveTo(x - w, sy + 2); c.quadraticCurveTo(x - w, sy + h * 0.42, x - 1, sy + h / 2); c.quadraticCurveTo(x - w, sy + h * 0.58, x - w, sy + h - 2); c.lineTo(x + w, sy + h - 2); c.quadraticCurveTo(x + w, sy + h * 0.58, x + 1, sy + h / 2); c.quadraticCurveTo(x + w, sy + h * 0.42, x + w, sy + 2); c.closePath(); c.fill();
      c.strokeStyle = "rgba(255,245,220,.32)"; c.lineWidth = 0.8; c.stroke(); /* Glaskontur */
      /* Sand oben (nimmt ab), unten (Kegel wächst), Rinnsal */
      const top = Math.max(0, f), bot = 1 - top;
      if (top > 0.01) { const ty = sy + 2 + (h / 2 - 3) * (1 - top); c.fillStyle = "#e5b454"; c.beginPath(); c.moveTo(x - w * 0.85 * Math.sqrt(top), ty); c.lineTo(x + w * 0.85 * Math.sqrt(top), ty); c.lineTo(x + 1, sy + h / 2 - 0.5); c.lineTo(x - 1, sy + h / 2 - 0.5); c.closePath(); c.fill(); }
      c.fillStyle = "#d8a040"; c.beginPath(); c.moveTo(x - w + 0.5, sy + h - 2); c.lineTo(x + w - 0.5, sy + h - 2); c.lineTo(x + w * 0.3, sy + h - 2 - (h / 2 - 3) * (0.25 + bot * 0.75)); c.lineTo(x - w * 0.3, sy + h - 2 - (h / 2 - 3) * (0.25 + bot * 0.75)); c.closePath(); c.fill();
      if (run && top > 0.01) { c.fillStyle = "#ffd27a"; c.fillRect(x - 0.5, sy + h / 2, 1, h / 2 - 3); for (let k = 0; k < 3; k++) { const u = (t * 3 + k / 3) % 1; c.fillRect(x - 0.6, sy + h / 2 + u * (h / 2 - 3), 1.2, 1.2); } }
      /* Glanz */
      c.strokeStyle = "rgba(255,250,235,.55)"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - w + 2, sy + 4); c.quadraticCurveTo(x - w + 1.5, sy + 7, x - 3, sy + h / 2 - 2); c.stroke();
      c.strokeStyle = "rgba(255,250,235,.25)"; c.beginPath(); c.moveTo(x - w + 2, sy + h - 4); c.lineTo(x - 3, sy + h / 2 + 3); c.stroke();
    } else {
      /* gebrochen: Glassplitter am Rahmen, Sandhaufen auf dem Kapitell */
      c.fillStyle = "rgba(240,236,220,.22)"; for (const [a, b, cc, d] of [[-w, 2, -w + 3, 7], [w, 3, w - 2, 9], [-w, h - 2, -w + 4, h - 6], [w, h - 2, w - 3, h - 7]]) { c.beginPath(); c.moveTo(x + a, sy + b); c.lineTo(x + cc, sy + d); c.lineTo(x + a, sy + d + 2); c.closePath(); c.fill(); }
      c.fillStyle = "#c8963a"; c.beginPath(); c.ellipse(x, y - 18, 11, 2.4, 0, Math.PI, 0); c.fill();
    }
    /* Messingrahmen: Deckel, Boden, drei Stäbe */
    const bg = c.createLinearGradient(0, sy - 2, 0, sy + 2); bg.addColorStop(0, "#f0c870"); bg.addColorStop(1, "#8a5a1a");
    c.fillStyle = bg; c.fillRect(x - w - 2, sy - 1, w * 2 + 4, 3); c.fillRect(x - w - 2, sy + h - 2, w * 2 + 4, 3);
    c.fillStyle = "#a8742a"; for (const dx of [-w - 1, w]) c.fillRect(x + dx, sy + 1, 1.4, h - 3);
    c.fillStyle = "#ffe0a0"; c.fillRect(x - w - 2, sy - 1, w * 2 + 4, 0.8);
    if (broke) { c.strokeStyle = "#6a4a1a"; c.lineWidth = 1; c.beginPath(); c.moveTo(x + w, sy + 3); c.lineTo(x + w + 3, sy + 8); c.stroke(); }
  }
  function ring(c, r, t, k) {
    const b = Math.sin(t * 4 + r.x) * 2, ry = r.y + b, spin = Math.cos(t * 2.6 + r.x * 0.05), rx = 6.5 * Math.max(0.18, Math.abs(spin)), lo = lean();
    if (!lo) { const g = c.createRadialGradient(r.x, ry, 0, r.x, ry, 16); g.addColorStop(0, "rgba(255,220,140,.35)"); g.addColorStop(1, "rgba(255,200,100,0)"); c.fillStyle = g; c.fillRect(r.x - 16, ry - 16, 32, 32); }
    /* dunkle Unterkante, Gold, Glanzkante */
    c.lineWidth = 3.2; c.strokeStyle = "#7a4a10"; c.beginPath(); c.ellipse(r.x + 0.4, ry + 0.6, rx, 7, 0, 0, TAU); c.stroke();
    c.lineWidth = 2.4; c.strokeStyle = spin > 0 ? "#f0c050" : "#d09030"; c.beginPath(); c.ellipse(r.x, ry, rx, 7, 0, 0, TAU); c.stroke();
    c.lineWidth = 0.9; c.strokeStyle = "#fff4c8"; c.beginPath(); c.ellipse(r.x, ry, rx, 7, 0, Math.PI * 1.05, Math.PI * 1.55); c.stroke();
    /* Funkeln */
    if (!lo) { const tw = (Math.sin(t * 6 + k * 1.7) + 1) / 2; if (tw > 0.75) { const a = (tw - 0.75) * 4, sx = r.x - rx * 0.7, sy2 = ry - 5; c.fillStyle = "rgba(255,255,235," + a.toFixed(2) + ")"; c.beginPath(); c.moveTo(sx, sy2 - 4); c.lineTo(sx + 0.9, sy2); c.lineTo(sx, sy2 + 4); c.lineTo(sx - 0.9, sy2); c.closePath(); c.fill(); c.fillRect(sx - 3.5, sy2 - 0.45, 7, 0.9); } }
  }
  Z.rennenGemalt = true; /* abenteuer.js zeichnet dann nur noch die Beschriftung */
  const dp0 = Z.drawParcours;
  Z.drawParcours = function (c, t) {
    if (dp0) dp0.apply(this, arguments);
    if (off()) return;
    try {
      const tt = performance.now() / 1000, cam = Z.cam;
      for (const ev of Z.abEvents || []) {
        if (ev.k !== "rennen" || !ev.rings) continue;
        if (cam && (ev.x < cam.x - 400 || ev.x > cam.x + cam.w + 400)) { track(ev); continue; }
        const s = track(ev), f = ev.on ? Math.max(0, ev.left / ev.limit) : s.win ? 0 : 1;
        pedestal(c, ev.x, ev.y, tt);
        if (!ev.done || s.win || s.broke || ev.tries >= 3) hourglass(c, ev.x, ev.y, f, tt, ev.on, s.broke || (ev.done && !s.win && ev.tries >= 3), s.brokeT);
        if (ev.on) ev.rings.forEach((r, k) => { if (!r.got) ring(c, r, tt, k); });
        /* Einsammel-Funkenring */
        for (const p of s.pulse) { const u = (tt - p.t0) / 0.6; c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,220,140," + (1 - u).toFixed(2) + ")"; c.lineWidth = 2 * (1 - u) + 0.5; c.beginPath(); c.arc(p.x, p.y, 6 + u * 22, 0, TAU); c.stroke();
          if (!lean()) for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + u * 0.8, rr = 8 + u * 26; c.fillStyle = "rgba(255,240,190," + (1 - u).toFixed(2) + ")"; c.fillRect(p.x + Math.cos(a) * rr - 0.8, p.y + Math.sin(a) * rr - 0.8, 1.6, 1.6); } c.restore(); }
      }
    } catch (e) { console.error(e); }
  };
  /* Licht: Ringe und Sanduhr leuchten */
  if (G.lightGather) G.lightGather.push(function (add) { if (off()) return; for (const ev of Z.abEvents || []) { if (ev.k !== "rennen" || !ev.rings) continue; if (!ev.done) add(ev.x, ev.y - 28, 46, "#ffc870", 0.4, 0); if (ev.on) for (const r of ev.rings) if (!r.got) add(r.x, r.y, 30, "#ffd27a", 0.45, 0); } });
  /* Countdown: Medaillon über Ezekiel, nach dem Licht (immer lesbar) */
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c) {
    if (al0) al0.apply(this, arguments);
    if (off()) return;
    try {
      const P = Z.player; if (!P) return;
      const ev = (Z.abEvents || []).find(e => e.k === "rennen" && e.on); if (!ev) return;
      const tt = performance.now() / 1000, left = Math.max(0, ev.left), f = left / ev.limit, crit = left <= 5;
      const pu = crit ? 1 + 0.12 * Math.max(0, Math.sin((left % 1) * Math.PI)) : 1;
      const x = P.x + P.w / 2, y = P.y - 22, R = 9 * pu;
      c.save();
      c.fillStyle = "rgba(20,12,10,.78)"; c.beginPath(); c.arc(x, y, R + 2.5, 0, TAU); c.fill();
      c.strokeStyle = "rgba(90,70,60,.9)"; c.lineWidth = 1; c.beginPath(); c.arc(x, y, R + 2.5, 0, TAU); c.stroke();
      c.strokeStyle = crit ? "#ff6a4a" : "#e5b454"; c.lineWidth = 2.4; c.lineCap = "round"; c.beginPath(); c.arc(x, y, R, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke();
      c.fillStyle = crit ? "#ffd0c0" : "#ffe8b0"; c.font = "bold " + Math.round(9 * pu) + "px " + (getComputedStyle(document.documentElement).getPropertyValue("--fb") || "sans-serif"); c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(left >= 10 ? String(Math.ceil(left)) : left.toFixed(1), x, y + 0.5);
      /* Ringe gesammelt: kleine Punkte darunter */
      const n = ev.rings.length, g = ev.rings.filter(r => r.got).length;
      for (let i = 0; i < n; i++) { c.fillStyle = i < g ? "#ffd27a" : "rgba(120,100,80,.8)"; c.beginPath(); c.arc(x + (i - (n - 1) / 2) * 5, y + R + 6, 1.6, 0, TAU); c.fill(); }
      c.restore();
    } catch (e) { console.error(e); }
  };
})();

/* Ezekiel – The Destroyer · Hebelrätsel, gemalt (W11 Runde 30; Logik abenteuer.js, Haken Z.raetselGemalt)
   Steintafel mit Fase, Rissen und eingemeißelten Zeichen (Kerbe dunkel, Lichtkante unten rechts); gelöste Zeichen
   glühen in ihrer Farbe, Fortschritt als Messingnieten. Hebel: Grundplatte mit Nieten und Schlitz, Holzschaft mit
   Eisenknauf, darüber eine Messing-Plakette mit dem Zeichen; richtiger Hebel leuchtet in seiner Farbe, falscher
   blitzt kurz rot. Gelöst: der Riegel unter der Tafel springt auf (Bolzen gleitet, Funken), warmes Leuchten.
   Die Reihenfolge-Beschriftung bleibt wie in der schlichten Fassung. Lean: ohne Leuchten/Funken. Schalter Z.gfx.off.raetsel. */
(function () {
  const Z = window.Z, G = Z.gfx, TAU = Math.PI * 2; if (!G) return;
  const lean = () => !!(Z.gq && (Z.gq.lean || Z.gq.mini));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const ST = new WeakMap();
  function shape(c, k, x, y, r) {
    c.beginPath();
    if (k === 0) { c.moveTo(x, y - r); c.lineTo(x + r * 0.8, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.8, y); c.closePath(); }
    else if (k === 1) { c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); c.closePath(); }
    else if (k === 2) c.arc(x, y, r * 0.85, 0, TAU);
    else { c.rect(x - r * 0.3, y - r, r * 0.6, r * 2); c.rect(x - r, y - r * 0.3, r * 2, r * 0.6); }
  }
  /* eingemeißelt: Lichtkante versetzt, dunkle Kerbe, optional leuchtende Füllung */
  function carve(c, k, x, y, r, lit, col) {
    c.fillStyle = "rgba(255,240,220,.22)"; shape(c, k, x + 0.7, y + 0.7, r); c.fill();
    c.fillStyle = "#1e181c"; shape(c, k, x, y, r); c.fill();
    if (lit) { c.fillStyle = col; shape(c, k, x, y, r * 0.78); c.fill(); if (!lean()) { c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.5; c.fillStyle = col; shape(c, k, x, y, r * 1.25); c.fill(); c.restore(); } }
  }
  function tablet(c, ev, t, RZ, s) {
    const n = ev.levers.length, w = 16 + n * 15, h = 32, x0 = ev.x - w / 2, y0 = ev.y - 44;
    /* Pfosten */
    const pg = c.createLinearGradient(ev.x - 4, 0, ev.x + 4, 0); pg.addColorStop(0, "#5a5056"); pg.addColorStop(1, "#2e282c"); c.fillStyle = pg; c.fillRect(ev.x - 4, y0 + h, 8, ev.y - (y0 + h));
    c.fillStyle = "#2a2226"; c.fillRect(ev.x - 7, ev.y - 3, 14, 3);
    /* Platte mit Fase */
    c.fillStyle = "#2a2428"; c.fillRect(x0 - 1, y0 - 1, w + 2, h + 2);
    const g = c.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, "#6e6468"); g.addColorStop(1, "#4a4246"); c.fillStyle = g; c.fillRect(x0, y0, w, h);
    c.fillStyle = "#574e52"; c.fillRect(x0 + 2.5, y0 + 2.5, w - 5, h - 5);
    c.fillStyle = "rgba(255,240,225,.16)"; c.fillRect(x0, y0, w, 1); c.fillRect(x0, y0, 1, h);
    c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(x0, y0 + h - 1, w, 1); c.fillRect(x0 + w - 1, y0, 1, h);
    /* Riss */
    c.strokeStyle = "rgba(20,14,16,.6)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x0 + w - 7, y0 + 2.5); c.lineTo(x0 + w - 10, y0 + 9); c.lineTo(x0 + w - 8, y0 + 13); c.stroke();
    /* Zeichen in Reihenfolge, Messingnieten darunter */
    ev.seq.forEach((li, k) => { const sk = ev.levers[li].sym, cx = x0 + 15.5 + k * 15 - 7, lit = ev.done || k < ev.prog;
      carve(c, sk, cx, y0 + 12, 5, lit, RZ[sk].col);
      c.fillStyle = lit ? "#ffd27a" : "#2a2024"; c.beginPath(); c.arc(cx, y0 + 24, 1.7, 0, TAU); c.fill(); if (lit) { c.fillStyle = "rgba(255,250,220,.8)"; c.fillRect(cx - 0.8, y0 + 23.2, 0.8, 0.8); } });
    /* Riegel: Bolzen unter der Tafel, springt nach dem Lösen auf */
    const u = ev.done ? Math.min(1, (performance.now() / 1000 - (s.doneT || 0)) / 0.45) : 0, e = u < 1 ? 1 - Math.pow(1 - u, 3) : 1;
    const by = y0 + h + 3, bx = ev.x + 6 + e * 8;
    c.fillStyle = "#3a3034"; c.fillRect(ev.x - 10, by - 2.5, 20, 5);
    c.fillStyle = "#8a6430"; c.fillRect(ev.x - 8 + e * 8, by - 1.2, 12, 2.4); c.fillStyle = "#e8c070"; c.fillRect(ev.x - 8 + e * 8, by - 1.2, 12, 0.7);
    c.fillStyle = "#b08038"; c.beginPath(); c.arc(bx, by, 2, 0, TAU); c.fill();
    if (ev.done && !lean()) { c.save(); c.globalCompositeOperation = "lighter"; const gg = c.createRadialGradient(ev.x, y0 + h / 2, 2, ev.x, y0 + h / 2, w * 0.8); gg.addColorStop(0, "rgba(255,200,110," + (0.25 + 0.1 * Math.sin(t * 3)).toFixed(2) + ")"); gg.addColorStop(1, "rgba(255,200,110,0)"); c.fillStyle = gg; c.fillRect(ev.x - w, y0 - w * 0.4, w * 2, h + w * 0.8); c.restore(); }
    return y0;
  }
  function lever(c, ev, i, t, RZ, s) {
    const l = ev.levers[i], x = l.x, y = l.y, idx = ev.seq.indexOf(i), ok = ev.done || (idx >= 0 && idx < ev.prog && l.down), wrong = l.down && !ok && ev.resetT > 0;
    /* Grundplatte mit Schlitz und Nieten */
    c.fillStyle = "#2a2226"; c.fillRect(x - 8, y - 6, 16, 6); c.fillStyle = "#4a4044"; c.fillRect(x - 7, y - 5.5, 14, 4.5);
    c.fillStyle = "#141012"; c.fillRect(x - 5, y - 4, 10, 1.4);
    c.fillStyle = "#7a6e66"; for (const dx of [-5.5, 5.5]) { c.beginPath(); c.arc(x + dx, y - 2, 0.9, 0, TAU); c.fill(); }
    /* Schaft mit Knauf */
    c.save(); c.translate(x, y - 4); c.rotate(-0.75 + l.a * 1.5);
    c.fillStyle = "#5a3a22"; c.fillRect(-1.3, -14, 2.6, 14); c.fillStyle = "#8a5e3a"; c.fillRect(-1.3, -14, 0.9, 14);
    c.fillStyle = "#2e2a2e"; c.beginPath(); c.arc(0, -15, 2.6, 0, TAU); c.fill(); c.fillStyle = "#8a8288"; c.beginPath(); c.arc(-0.8, -15.8, 0.9, 0, TAU); c.fill();
    c.restore();
    /* Plakette mit Zeichen */
    const py = y - 26, col = RZ[l.sym].col;
    c.fillStyle = "#5a3e18"; c.fillRect(x - 6.5, py - 6.5, 13, 13);
    const pg = c.createLinearGradient(0, py - 6, 0, py + 6); pg.addColorStop(0, "#e8c070"); pg.addColorStop(1, "#8a5e20"); c.fillStyle = pg; c.fillRect(x - 6, py - 6, 12, 12);
    c.fillStyle = "#6a4a1a"; c.fillRect(x - 6, py + 5, 12, 1); c.fillStyle = "#fff0c0"; c.fillRect(x - 6, py - 6, 12, 0.7);
    c.fillStyle = "#3a2410"; shape(c, l.sym, x, py, 3.6); c.fill();
    c.fillStyle = ok || ev.done ? col : "rgba(60,36,14,.0)"; if (ok || ev.done) { shape(c, l.sym, x, py, 2.8); c.fill(); }
    if (!lean() && (ok || wrong)) { c.save(); c.globalCompositeOperation = "lighter"; const gc = wrong ? "255,70,50" : col === "#efe6d0" ? "255,240,210" : null; const g = c.createRadialGradient(x, py, 1, x, py, 16); const rgb = gc || hexRgb(col); g.addColorStop(0, "rgba(" + rgb + "," + (wrong ? 0.6 : 0.45) + ")"); g.addColorStop(1, "rgba(" + rgb + ",0)"); c.fillStyle = g; c.fillRect(x - 16, py - 16, 32, 32); c.restore(); }
  }
  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255); }
  Z.raetselGemalt = function (c, ev, t, RZ) {
    if (G.off && G.off.raetsel) return false;
    try {
      let s = ST.get(ev); if (!s) { s = { done: ev.done, doneT: ev.done ? -9 : 0, prog: ev.prog }; ST.set(ev, s); }
      if (ev.done && !s.done) { s.doneT = performance.now() / 1000; if (!lean() && Z.fx && Z.fx.burst) Z.fx.burst(ev.x + 8, ev.y - 9, 14, { col: ["#ffd27a", "#fff2c0"], sp: 90, life: 0.5, size: 1.6, kind: "glow", add: true }); }
      if (ev.prog > s.prog && !lean() && Z.fx && Z.fx.burst) { const li = ev.seq[ev.prog - 1], l = ev.levers[li]; if (l) Z.fx.burst(l.x, l.y - 26, 8, { col: [RZ[l.sym].col, "#fff2c0"], sp: 50, life: 0.45, size: 1.4, kind: "glow", add: true }); }
      s.done = ev.done; s.prog = ev.prog;
      const cam = Z.cam, vis = (x, y) => !(x < cam.x - 60 || x > cam.x + cam.w + 60 || y < cam.y - 60 || y > cam.y + cam.h + 60);
      if (vis(ev.x, ev.y)) {
        const y0 = tablet(c, ev, t, RZ, s);
        /* Reihenfolge-Beschriftung wie in der schlichten Fassung */
        const P = Z.player, L = v => Z.L(v), nah = (x, y, dx, dy) => P && Math.abs(P.x + P.w / 2 - x) < dx && Math.abs(P.y + P.h - y) < dy;
        if (P && !ev.done && (nah(ev.x, ev.y, 70, 50) || ev.levers.some(l => nah(l.x, l.y, 90, 60))) && Z.ui && Z.ui.worldLabel)
          Z.ui.worldLabel("raetsel" + Math.round(ev.x), { x: ev.x, y: y0 - 10, html: esc(L(["Reihenfolge: ", "Order: "])) + ev.seq.map(li => '<b style="color:' + RZ[ev.levers[li].sym].col + '">' + RZ[ev.levers[li].sym].g + "</b>").join(" → "), jetzt: true });
      }
      ev.levers.forEach((l, i) => { if (vis(l.x, l.y)) lever(c, ev, i, t, RZ, s); });
      return true;
    } catch (e) { console.error(e); return false; }
  };
  if (G.lightGather) G.lightGather.push(function (add) {
    if (G.off && G.off.raetsel) return;
    for (const ev of Z.abEvents || []) { if (ev.k !== "raetsel") continue; if (ev.done) add(ev.x, ev.y - 30, 50, "#ffc870", 0.4, 0); else add(ev.x, ev.y - 30, 34, "#ffd8a0", 0.18, 0);
      ev.levers.forEach((l, i) => { const k = ev.seq.indexOf(i); if (ev.done || (k >= 0 && k < ev.prog && l.down)) add(l.x, l.y - 26, 26, "#ffd27a", 0.3, 0); }); }
  });
})();
