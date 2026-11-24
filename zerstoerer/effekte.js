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
    if (hurtT > 0 && Z.settings.flashes !== false) {
      c.save(); c.globalAlpha = Math.min(1, hurtT / 0.45) * 0.55; c.drawImage(vigSprite(), 0, 0, W, H); c.restore();
    }
    if (lines && Z.settings.flashes !== false) drawLines(c, W, H);
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
})();
