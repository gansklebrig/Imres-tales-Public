/* Ezekiel – The Destroyer · W38 Optik (optik3.js)
   Bestand geprüft (effekte.js: Treffer-Funken je Material, Zerfall je Gegnerfamilie, Landestaub je Untergrund; wetter.js: Regen,
   Gewitter, Böen; pracht.js: Fahnen; hintergrund/ausstattung: Möwen; bild.js: Lava-Schollen und -Blasen). Neu und noch nicht da:
   1) EINTAUCHEN: Wer oder was in Wasser oder Lava fällt (Ezekiel, Spieler 2, Gegner, Geschosse), erzeugt einen Spritzer an der
      Oberfläche – Wasser: Tropfenkrone, Gischt, zwei sich ausbreitende Ringe; Lava: glühende Tropfen, Glutfunken, Rauchstoß,
      kurzer Glutschein und ein dunkler Krustenring. Ezekiel wird nach dem Eintauchen zurückgesetzt (kampf.js) – erkannt über
      P._hzRT, gezeichnet an der zuletzt gesehenen Stelle über der Oberfläche.
   2) ATEMWOLKEN in der Kälte: Lager im Winter (lagerwelt.js), Zinnen und Sturmspitze, Schneewetter. Ezekiel und Spieler 2
      atmen kleine Wölkchen in Blickrichtung aus – schneller nach Sprint, Rolle oder Treffer; wache Gegner in der Nähe gelegentlich.
   3) HITZEFLIMMERN über Lava (ab Stufe 2): dünne, warme, wellende Schlieren steigen über jeder sichtbaren Lavaoberfläche auf
      (bild.js G.lava-Läufe), dazu vereinzelt Glutfäden.
   Grafikstufen: Stufe 0/Handheld (lean): nur wenige Tropfen beim Eintauchen, keine Ringe, kein Atem, kein Flimmern.
   Stufe 1: Spritzer + Ringe, Atem. Stufe ≥ 2: alles. Kein Blau (Wasser grünlich-grau wie im Bestand).
   Schalter: Z.gfx.off.w38optik = true (alles aus), .w38tauch, .w38atem, .w38hitze, .w38glut. Prüfhilfe Z.optik3.splash(x,y,"lava"|"wasser"). */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || Z.optik3) return;
  const FX = Z.fx, T = Z.TILE, A = Z.audio, TAU = Math.PI * 2;
  const G = () => Z.gfx || {};
  const off = k => { const o = G().off; return !!(o && (o.w38optik || o[k])); };
  const lvl = () => { const q = Z.gq; if (!q) return 2; if (q.lean || q.mini) return 0; return q.level === -1 ? 2 : (q.level | 0); };
  const tileAt = (x, y) => { const lv = Z.level; if (!lv || !lv.get) return 0; return lv.get(Math.floor(x / T), Math.floor(y / T)); };
  const liquid = v => v === 5 || v === 6;

  /* Oberfläche suchen: von y abwärts bis zur ersten Flüssigkeitskachel, deren Kachel darüber keine Flüssigkeit ist */
  function surfaceBelow(x, y, maxT) {
    const lv = Z.level; if (!lv) return null;
    const tx = Math.floor(x / T); let ty = Math.floor(y / T);
    for (let i = 0; i < (maxT || 3); i++, ty++) { const v = lv.get(tx, ty); if (liquid(v)) { let top = ty; while (top > 0 && lv.get(tx, top - 1) === v) top--; return { y: top * T + 3, v }; } if (v === 1) return null; }
    return null;
  }

  /* ======================= 1) EINTAUCHEN ======================= */
  const RINGS = []; /* {x,y,t,life,r0,r1,k} */
  function splash(x, y, kind, big) {
    if (off("w38tauch")) return;
    const L = lvl(), lava = kind === "lava" || kind === 5, s = big ? 1 : 0.55;
    const n = Math.round((L === 0 ? 6 : L === 1 ? 16 : 26) * s);
    if (lava) {
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, sp = (90 + Math.random() * 150) * (big ? 1 : 0.7); FX.p({ x: x + (Math.random() - 0.5) * 8, y: y - 1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 520, drag: 0.98, life: 0.45 + Math.random() * 0.35, size: 1.4 + Math.random() * 1.4, col: Math.random() < 0.5 ? "#ffb040" : "#ff6a1a", kind: "spark", add: true }); }
      if (L >= 1) {
        for (let i = 0; i < 4 * s + 2; i++) FX.p({ x: x + (Math.random() - 0.5) * 14, y: y - 4, vx: (Math.random() - 0.5) * 18, vy: -22 - Math.random() * 20, g: -12, drag: 0.96, life: 1.1 + Math.random() * 0.6, size: 4 + Math.random() * 3, col: "#3a2a24", kind: "smoke" });
        for (let i = 0; i < 6 * s; i++) FX.p({ x: x + (Math.random() - 0.5) * 10, y: y - 2, vx: (Math.random() - 0.5) * 40, vy: -60 - Math.random() * 80, g: -20, drag: 0.97, life: 0.9 + Math.random() * 0.8, size: 1, col: "#ffd27a", kind: "ember", add: true });
        RINGS.push({ x, y, t: 0, life: 0.4, r0: 0, r1: big ? 0.8 : 0.5, k: "kroneL", seed: Math.random() * 9 });
        RINGS.push({ x, y, t: 0, life: 0.7, r0: 3, r1: big ? 22 : 13, k: "lava" });
        RINGS.push({ x, y, t: -0.02, life: 0.35, r0: 2, r1: big ? 16 : 9, k: "glut" });
      }
      try { A.play("fire", { x, vol: big ? 0.35 : 0.18, rate: 1.3 }); } catch (_) {}
    } else {
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * (i % 3 === 0 ? 0.5 : 1.5), sp = (110 + Math.random() * 170) * (big ? 1 : 0.7); FX.p({ x: x + (Math.random() - 0.5) * 8, y: y - 1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 600, drag: 0.985, life: 0.45 + Math.random() * 0.35, size: 1.6 + Math.random() * 1.6, col: Math.random() < 0.55 ? "#b4c8b8" : "#eef2ea", kind: "dot" }); }
      if (L >= 1) {
        for (let i = 0; i < 3 * s + 1; i++) FX.p({ x: x + (Math.random() - 0.5) * 12, y: y - 3, vx: (Math.random() - 0.5) * 30, vy: -18 - Math.random() * 16, g: 30, drag: 0.94, life: 0.5 + Math.random() * 0.3, size: 3 + Math.random() * 2, col: "#c8d8cc", kind: "smoke" });
        RINGS.push({ x, y, t: 0, life: 0.45, r0: 0, r1: big ? 1 : 0.6, k: "krone", seed: Math.random() * 9 });
        RINGS.push({ x, y, t: 0, life: 0.8, r0: 3, r1: big ? 26 : 15, k: "wasser" });
        RINGS.push({ x, y, t: -0.12, life: 0.7, r0: 2, r1: big ? 16 : 9, k: "wasser" });
      }
    }
    if (RINGS.length > 24) RINGS.splice(0, RINGS.length - 24);
  }
  /* Beobachtung je Bild */
  const seen = new WeakMap();
  let lastPT = null, lastPP = null;
  function watch() {
    const lv = Z.level; if (!lv || lv.hub || off("w38tauch")) { lastPP = null; return; }
    const P = Z.player;
    /* Ezekiel: kampf.js setzt ihn beim Eintauchen sofort zurück und schreibt P._hzRT */
    if (P) {
      if (P._hzRT != null && P._hzRT !== lastPT && lastPT !== null && lastPP) {
        const s = surfaceBelow(lastPP.x, lastPP.y - 4, 4);
        if (s) splash(lastPP.x, s.y, s.v === 5 ? "lava" : "wasser", true);
      }
      lastPT = P._hzRT != null ? P._hzRT : lastPT === null ? -1 : lastPT;
      if (!P.dead) lastPP = { x: P.x + P.w / 2, y: P.y + P.h };
    }
    const cam = Z.cam; if (!cam) return;
    const vis = (x, y) => x > cam.x - 40 && x < cam.x + cam.w + 40 && y > cam.y - 40 && y < cam.y + cam.h + 40;
    const check = (o, x, y, big) => {
      if (!vis(x, y)) return;
      const v = tileAt(x, y), was = seen.get(o);
      const inL = liquid(v);
      if (inL && was === false) { const s = surfaceBelow(x, y - T, 2); if (s) splash(x, s.y, v === 5 ? "lava" : "wasser", big); }
      seen.set(o, inL);
    };
    const K = Z.koop && Z.koop.p2; if (K && !K.down) check(K, K.x + K.w / 2, K.y + K.h - 2, true);
    for (const e of Z.enemies) { if (e.dead || (e.def && (e.def.fly || e.def.boss)) || e.ghost) continue; check(e, e.x + e.w / 2, e.y + e.h - 2, (e.h || 16) > 18); }
    for (const p of Z.projs) { if (p.dead) continue; check(p, p.x, p.y, false); }
  }

  /* ======================= 2) ATEMWOLKEN ======================= */
  const breath = new WeakMap(); let puffN = 0;
  function cold() {
    const lv = Z.level; if (!lv) return false;
    if (lv.hub) { try { return !!(Z.lagerwelt && Z.lagerwelt.season && Z.lagerwelt.season() === "winter"); } catch (_) { return false; } }
    if (lv.id === "zinnen" || lv.id === "sturm") return true;
    try { const w = Z.wetter && Z.wetter(); if (w && /schnee/.test(w.mood || "")) return true; } catch (_) {}
    return false;
  }
  function puff(o, x, y, face, strong) {
    const n = strong ? 5 : 4; puffN++;
    for (let i = 0; i < n; i++) FX.p({ x: x + face * (1.5 + i * 1.2), y: y + (Math.random() - 0.5), vx: face * (12 + Math.random() * 12 + (strong ? 10 : 0)) + (o.vx || 0) * 0.25, vy: -4 - Math.random() * 5, g: -8, drag: 0.94, life: 1.1 + Math.random() * 0.6, size: 1.9 + i * 0.55, col: "#f6f0e8", kind: "smoke", keep: true });
  }
  let coldT = 0, isCold = false;
  function atem(dt) {
    if (off("w38atem") || lvl() < 1) return;
    coldT -= dt; if (coldT <= 0) { coldT = 1; isCold = cold(); }
    if (!isCold) return;
    const ppl = [Z.player, Z.koop && Z.koop.p2].filter(p => p && !p.dead && !p.down);
    for (const p of ppl) {
      let s = breath.get(p); if (!s) { s = { t: Math.random() * 2 }; breath.set(p, s); }
      const exert = (p.rollT > 0) || Math.abs(p.vx || 0) > 120 || (p.iframe > 0.3);
      s.t -= dt * (exert ? 1.9 : 1);
      if (s.t <= 0) { s.t = 2.1 + Math.random() * 0.8; const f = p.face || 1; puff(p, p.x + p.w / 2 + f * 4, p.y + (p.crouch ? 9 : 6), f, exert); }
    }
    if (lvl() < 2) return;
    const P = Z.player; if (!P) return;
    for (const e of Z.enemies) {
      if (e.dead || !e.aware || e.ghost || (e.def && (e.def.fly || e.def.boss || e.def.undead))) continue;
      if (Math.abs(e.x - P.x) > 260 || Math.abs(e.y - P.y) > 160) continue;
      let s = breath.get(e); if (!s) { s = { t: 1 + Math.random() * 3 }; breath.set(e, s); }
      s.t -= dt; if (s.t <= 0) { s.t = 2.6 + Math.random() * 1.6; puff(e, e.x + e.w / 2 + (e.face || 1) * 4, e.y + Math.min(8, e.h * 0.3), e.face || 1, false); }
    }
  }

  /* ======================= Takt ======================= */
  let lastNow = 0;
  const tk0 = Z.ebenenTick;
  Z.ebenenTick = function (dt) {
    if (tk0) tk0.apply(this, arguments);
    try { watch(); atem(Math.min(0.05, dt || 0)); } catch (e) { if (!errN++) console.error("W38 Optik", e); }
  };
  let errN = 0;

  /* ======================= ZEICHNEN ======================= */
  /* Ringe auf der Oberfläche (Weltkoordinaten, vor den Figuren) */
  const dp0 = Z.drawParcours;
  Z.drawParcours = function (c, t) {
    if (dp0) dp0.apply(this, arguments);
    try { drawRings(c, t); } catch (e) { if (!errN++) console.error("W38 Optik", e); }
  };
  let ringT = 0;
  function drawRings(c, t) {
    const now = (G().time || t || 0), dt = Math.min(0.05, Math.max(0, now - ringT)); ringT = now;
    if (!RINGS.length) return;
    c.save();
    for (let i = RINGS.length - 1; i >= 0; i--) {
      const r = RINGS[i]; r.t += dt; if (r.t >= r.life) { RINGS.splice(i, 1); continue; } if (r.t < 0) continue;
      const u = r.t / r.life, e = 1 - (1 - u) * (1 - u), R = r.r0 + (r.r1 - r.r0) * e, a = (1 - u);
      if (r.k === "wasser") { c.globalCompositeOperation = "source-over"; c.strokeStyle = "rgba(220,232,222," + (0.55 * a).toFixed(3) + ")"; c.lineWidth = 1.2; c.beginPath(); c.ellipse(r.x, r.y, R, R * 0.22, 0, 0, TAU); c.stroke(); }
      else if (r.k === "lava") { c.globalCompositeOperation = "source-over"; c.strokeStyle = "rgba(60,20,10," + (0.7 * a).toFixed(3) + ")"; c.lineWidth = 2; c.beginPath(); c.ellipse(r.x, r.y, R, R * 0.25, 0, 0, TAU); c.stroke(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,150,60," + (0.45 * a).toFixed(3) + ")"; c.lineWidth = 1; c.beginPath(); c.ellipse(r.x, r.y - 0.5, R * 0.9, R * 0.2, 0, 0, TAU); c.stroke(); }
      else if (r.k === "krone" || r.k === "kroneL") {
        /* Tropfenkrone: Wassersäule steigt und fällt, Zacken spreizen sich nach außen */
        const lav = r.k === "kroneL", hgt = 22 * r.r1 * Math.sin(Math.min(1, u * 1.15) * Math.PI), sp = 4 + 10 * e * r.r1;
        c.globalCompositeOperation = lav ? "lighter" : "source-over";
        c.fillStyle = lav ? "rgba(255,150,60," + (0.75 * a).toFixed(3) + ")" : "rgba(214,228,216," + (0.7 * a).toFixed(3) + ")";
        c.beginPath(); c.ellipse(r.x, r.y - hgt * 0.5, 2.2 + 1.2 * (1 - u), Math.max(0.5, hgt * 0.5), 0, 0, TAU); c.fill();
        if (hgt > 3) { c.beginPath(); c.arc(r.x, r.y - hgt - 1.5, 1.6, 0, TAU); c.fill(); }
        c.strokeStyle = c.fillStyle; c.lineWidth = 1.3; c.lineCap = "round";
        for (let k = 0; k < 6; k++) { const ang = Math.PI * (0.12 + 0.76 * k / 5) + Math.sin(r.seed + k) * 0.08, L1 = sp * (0.7 + 0.3 * Math.sin(r.seed * 3 + k)); const bx = r.x + Math.cos(ang) * 3, by = r.y; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(r.x - Math.cos(ang) * L1 * 0.6, by - L1 * 0.9, r.x - Math.cos(ang) * L1, by - L1 * 0.55 + 6 * u * u); c.stroke(); }
      }
      else if (r.k === "glut" && lvl() >= 1) { c.globalCompositeOperation = "lighter"; if (Z.draw && Z.draw.glow) Z.draw.glow(c, r.x, r.y - 3, 10 + R, "rgba(255,140,50," + (0.35 * a).toFixed(3) + ")"); }
    }
    c.restore();
  }
  /* Hitzeflimmern über Lava (nach dem Licht, damit die Schlieren nicht abgedunkelt werden) */
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, Wd, Hd, t) {
    if (al0) al0.apply(this, arguments);
    try { hitze(c, cam, t); glutluft(c, cam, Wd, Hd, t); } catch (e) { if (!errN++) console.error("W38 Optik", e); }
  };
  /* W38 Optik (späte Gebiete): GLUTLUFT – Glutgassen wirkten wie ein brauner Kerker; jetzt treiben glimmende Funken durch die
     Luft (Glut 28, Runenschmiede 12 goldene Essenfunken), dazu ein warmer Hitzeschleier vom unteren Bildrand. Ohne Partikel-
     Anlage: Lage je Funke aus Index + Zeit berechnet (stabil, keine Speicherlast). Stufe 0: aus; Stufe 1: halbe Zahl, kein Schleier. */
  const GLUT = { glut: { n: 28, col: [255, 150, 60], haze: 0.10 }, schmiede: { n: 12, col: [255, 200, 110], haze: 0.05 } };
  function glutluft(c, cam, Wd, Hd, t) {
    const lv = Z.level; if (!lv || lv.hub || !cam || off("w38glut")) return;
    const cfg = GLUT[lv.biome] || GLUT[lv.id]; if (!cfg) return;
    const L1 = lvl(); if (L1 < 1) return;
    const g = G(), S = g.scale || 2, now = g.time || t || 0, n = L1 >= 2 ? cfg.n : cfg.n >> 1, col = cfg.col;
    c.save();
    if (L1 >= 2 && Wd && Hd) { /* Hitzeschleier (Bildschirmraum) */
      c.setTransform(1, 0, 0, 1, 0, 0);
      const gr = c.createLinearGradient(0, Hd, 0, Hd * 0.55), k = cfg.haze * (0.85 + 0.15 * Math.sin(now * 0.7));
      gr.addColorStop(0, "rgba(" + col[0] + "," + (col[1] - 40) + "," + col[2] + "," + k.toFixed(3) + ")"); gr.addColorStop(1, "rgba(" + col[0] + "," + col[1] + "," + col[2] + ",0)");
      c.globalCompositeOperation = "lighter"; c.fillStyle = gr; c.fillRect(0, Hd * 0.55, Wd, Hd * 0.45);
    }
    c.setTransform(S, 0, 0, S, -cam.x * S, -cam.y * S);
    c.globalCompositeOperation = L1 >= 2 ? "lighter" : "source-over";
    for (let i = 0; i < n; i++) {
      const sd = (i * 0.618034) % 1, sp = 14 + (i * 7 % 11) * 2.2, per = (cam.h + 40) / sp, u = ((now / per) + sd) % 1;
      const x = cam.x + (((sd * 9301 + i * 0.37) % 1) * (cam.w + 60)) - 30 + Math.sin(now * 0.9 + i * 1.7) * 10 + u * 18;
      const y = cam.y + cam.h + 20 - u * (cam.h + 40);
      const fl = 0.55 + 0.45 * Math.sin(now * (5 + i % 4) + i), a = Math.sin(u * Math.PI) * fl * (L1 >= 2 ? 0.8 : 0.6);
      if (a < 0.04) continue;
      const r = i % 5 === 0 ? 1.3 : 0.8;
      c.fillStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + a.toFixed(3) + ")";
      c.fillRect(x - r / 2, y - r / 2, r, r);
      if (L1 >= 2 && i % 5 === 0) { c.fillStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + (a * 0.18).toFixed(3) + ")"; c.fillRect(x - 2, y - 2, 4, 4); }
    }
    c.restore();
  }
  function hitze(c, cam, t) {
    if (off("w38hitze") || lvl() < 2) return;
    const g = G(), LA = g.lava, n = g.lavaN | 0; if (!LA || !n || !cam) return;
    const S = g.scale || 2, now = g.time || t || 0;
    c.save(); c.setTransform(S, 0, 0, S, -cam.x * S, -cam.y * S);
    c.globalCompositeOperation = "lighter"; c.lineWidth = 1.4; c.lineCap = "round";
    let strokes = 0;
    for (let i = 0; i < n && strokes < 32; i += 3) {
      const x0 = LA[i] * T, x1 = (LA[i + 1] + 1) * T, y = LA[i + 2] * T + 2;
      if (x1 < cam.x - 10 || x0 > cam.x + cam.w + 10 || y < cam.y - 4 || y - 40 > cam.y + cam.h) continue;
      for (let x = Math.max(x0 + 4, Math.floor((cam.x - 10) / 14) * 14); x < Math.min(x1 - 2, cam.x + cam.w + 10) && strokes < 32; x += 14) {
        const ph = (x * 0.137) % 1, u = ((now * 0.55 + ph) % 1), h = 12 + ((x * 7) % 13);
        const yb = y - u * 26, a = Math.sin(u * Math.PI) * 0.09;
        if (a < 0.01) continue;
        c.strokeStyle = "rgba(255,170,90," + a.toFixed(3) + ")";
        c.beginPath();
        for (let k = 0; k <= 3; k++) { const yy = yb - k * h / 3, xx = x + Math.sin(now * 3.1 + x * 0.21 + k * 1.3) * (1.4 + k * 0.5); if (k === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy); }
        c.stroke(); strokes++;
      }
      if (Math.random() < 0.04) FX.p({ x: x0 + Math.random() * (x1 - x0), y: y - 2, vx: (Math.random() - 0.5) * 6, vy: -30 - Math.random() * 30, g: -10, drag: 0.98, life: 1.2 + Math.random(), size: 0.9, col: "#ffc070", kind: "ember", add: true });
    }
    c.restore();
  }

  Z.optik3 = { splash: (x, y, k) => splash(x, y, k || "wasser", true), rings: () => RINGS.length, cold: () => cold(), puffs: () => puffN };
})();
