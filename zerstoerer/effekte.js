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
