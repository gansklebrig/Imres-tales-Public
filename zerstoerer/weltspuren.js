/* Ezekiel – The Destroyer · Weltspuren: eine Welt, die auf Ezekiel reagiert, und Kämpfe, die Spuren hinterlassen
   Reaktive Umgebung
   – Grasbüschel auf Moosböden und unter freiem Himmel: wiegen im Wind, biegen sich unter Schritten, legen sich beim Rollen flach
   – Laubhäufchen draußen: Rollen und Rennen wirbeln die Blätter auf, später fällt neues Laub
   – Pfützen bei Regen (wachsen und trocknen langsam) und in feuchten Kellern: Regenringe, Spritzer, nasse Stiefelabdrücke
   – Spinnweben in Raumecken: zittern, wenn man vorbeistreift, reißen beim Hindurchlaufen und wehen als lose Fäden
   – Staub rieselt von Simsen und Decken, wenn Ezekiel hart landet oder etwas einschlägt
   – Flammen von Fackeln, Kerzen und Becken neigen sich, wenn jemand vorbeirollt oder es knallt
   – Ketten und Banner schwingen bei Treffern, Explosionen und Berührung nach
   – Glut, Asche, Staub und Laub in der Luft werden verwirbelt; Glühwürmchen weichen aus
   – Ranken verlieren Blätter, wenn man sie streift; Mäuse huschen in ihre Löcher, wenn Ezekiel kommt
   Kampfspuren (verblassen langsam, Anzahl begrenzt)
   – Krater und Risse nach Sturzangriffen, harten Landungen, schweren Treffern, Steinwürfen und Explosionen
   – Brandflecken mit verglimmender Glut, Rußfahnen an Wänden, eingetrocknete Giftflecken, Netzkleckse
   – Schleifspuren beim Rollen, Bremsen und Zurückgestoßenwerden; Kratzer, wo jemand gegen die Wand prallt
   – Pfeile, Bolzen und Messer bleiben zitternd in Wand und Boden stecken – wer dagegenläuft, schlägt sie herunter
   – Fußspuren in Asche, Glutasche (glimmen kurz nach) und Schlamm; Kiesel aus Kratern lassen sich wegkicken
   Alles wird unter den Figuren gezeichnet, bleibt dunkel und gedeckt (keine Verwechslung mit Gefahren) und nutzt
   vorgemalte Sprites. Grafikstufe 0 (Handheld): alles aus. */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, FX = Z.fx, A = Z.audio;
  const TAU = Math.PI * 2, PI = Math.PI;
  const SS = 3; /* Auflösung der vorgemalten Sprites */

  /* ======================= Grundlagen ======================= */
  const qlv = () => { const g = Z.gq; if (!g) return 2; if (g.level >= 0) return g.level; return g.part != null && g.part < 0.4 ? 0 : g.part != null && g.part < 0.8 ? 1 : 2; };
  let OFF = false;
  const on = () => !OFF && qlv() >= 1;
  const rich = () => qlv() >= 2;
  const tile = (x, y) => (Z.level ? Z.level.get(x, y) : 1);
  const solidV = v => v === 1 || v === 7 || v === 12;
  const sol = (x, y) => solidV(tile(x, y));
  const platV = v => v === 2 || v === 8 || v === 10;
  const solAt = (x, y) => sol(Math.floor(x / T), Math.floor(y / T));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sgn = v => (v > 0 ? 1 : v < 0 ? -1 : 0);
  const rnd = () => Math.random();
  const isOpen = (tx, ty) => (Z.gfx && Z.gfx.isOpen ? Z.gfx.isOpen(tx, ty) : false);
  const skyAt = (tx, ty) => { const s = Z.gfx && Z.gfx.sky, lv = Z.level; return !!(s && lv && tx >= 0 && ty >= 0 && tx < lv.W && ty < lv.H && s[ty * lv.W + tx]); };
  const sight = (x, y) => (Z.sightAt ? Math.min(1, Z.sightAt(x, y) * 1.4) : 1);
  function shadeHex(hex, f) { return Z.shade ? Z.shade(hex, f) : hex; }
  function ell(c, x, y, rx, ry, rot) { c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, TAU); }
  function E(c, x, y, rx, ry, col, rot) { c.fillStyle = col; c.beginPath(); ell(c, x, y, rx, ry, rot); c.fill(); }
  const inView = (x, y, m) => { const cam = Z.cam; return x > cam.x - m && x < cam.x + cam.w + m && y > cam.y - m && y < cam.y + cam.h + m; };

  /* Sprites: einmal in eine Leinwand gemalt, danach nur noch kopiert */
  const SPR = new Map();
  function spr(key, w, h, ox, oy, paint) {
    let s = SPR.get(key); if (s) return s;
    const cv = document.createElement("canvas"); cv.width = Math.ceil(w * SS); cv.height = Math.ceil(h * SS);
    const g = cv.getContext("2d"); g.scale(SS, SS); g.translate(ox, oy); g.lineCap = "round"; g.lineJoin = "round";
    try { paint(g); } catch (err) { console.error(err); }
    s = { cv, w, h, ox, oy }; SPR.set(key, s); return s;
  }
  function blit(c, s, x, y, sc) { sc = sc || 1; c.drawImage(s.cv, x - s.ox * sc, y - s.oy * sc, s.w * sc, s.h * sc); }
  function jag(g, x, y, a, len, n, R, w0, am) {
    am = am == null ? 1 : am;
    /* gezackte Risslinie mit verjüngter Strichstärke; liefert Endpunkt */
    let px = x, py = y; const pts = [[px, py]];
    for (let i = 0; i < n; i++) { a += (R() - 0.5) * 0.6; const l = len / n * (0.7 + R() * 0.6); px += Math.cos(a) * l; py += Math.sin(a) * l; pts.push([px, py]); }
    for (let i = 1; i < pts.length; i++) {
      const k = 1 - (i - 1) / pts.length;
      g.lineWidth = (w0 || 0.8) * k + 0.12; g.strokeStyle = "rgba(10,6,6," + ((0.8 * k + 0.15) * am).toFixed(2) + ")";
      g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1]); g.lineTo(pts[i][0], pts[i][1]); g.stroke();
      g.lineWidth = 0.3 * k + 0.1; g.strokeStyle = "rgba(255,236,206," + (0.2 * k * am).toFixed(2) + ")";
      g.beginPath(); g.moveTo(pts[i - 1][0] + 0.45, pts[i - 1][1] + 0.35); g.lineTo(pts[i][0] + 0.45, pts[i][1] + 0.35); g.stroke();
    }
    return pts;
  }

  /* ======================= Zustand je Gebiet ======================= */
  let lvRef = null, BIO = "", TOP = "", OUT = false;
  let tufts = [], piles = [], puddles = [], webs = [], flames = [], swings = [], vines = [], pipes = [], bells = [];
  let decals = [], prints = [], stuck = [], loose = [], mice = [], dustQ = [], scuffs = new Map();
  let prevProjs = [], hitCd = new WeakMap();
  const MAXD = () => (rich() ? 90 : 45), MAXP = 56, MAXS = 30, MAXL = 28;
  let pal = null;

  function reset() {
    restoreSwings(); decRef = null; decLen = -1;
    tufts = []; piles = []; puddles = []; webs = []; flames = []; swings = []; vines = []; pipes = []; bells = [];
    decals = []; prints = []; stuck = []; loose = []; mice = []; dustQ = []; scuffs = new Map(); prevProjs = []; hitCd = new WeakMap();
  }

  function setup(lv) {
    reset(); lvRef = lv; if (!lv) return;
    const B = Z.biome || {}; BIO = lv.biome || ""; TOP = (B.tile && B.tile.top) || ""; OUT = !!(B.out || lv.out);
    const topCol = (B.tile && B.tile.topCol && B.tile.topCol[0] === "#") ? B.tile.topCol : "#4f6b34";
    pal = {
      g0: shadeHex(topCol, -0.45), g1: shadeHex(topCol, -0.15), g2: shadeHex(topCol, 0.1),
      dust: Z.dustCol || "#8a7a70", bg: B.bg || "", refl: reflCol(B)
    };
    const R = Z.Rng(((lv.seed || 7) * 31 + 4099) >>> 0);
    const W = lv.W, H = lv.H;
    const doorNear = (x, y, r) => (lv.doors || []).some(d => Math.abs(d.x - x) <= r && Math.abs(d.y - y) <= r);
    const decorAt = (x, y, r) => (lv.decor || []).some(d => Math.abs(d.x - x) <= r && Math.abs(d.y - y) <= r);
    const floorOK = (x, y) => sol(x, y) && tile(x, y) !== 7 && tile(x, y - 1) === 0;
    /* --- Pfützen zuerst (Gras soll nicht durch Kellerpfützen wachsen) --- */
    const wetBiome = TOP === "drip" || TOP === "slime" || BIO === "see" || BIO === "verlies" || BIO === "keller";
    const rainable = OUT;
    for (let y = 2; y < H - 1; y++) {
      let x = 1;
      while (x < W - 1) {
        if (!floorOK(x, y)) { x++; continue; }
        let x2 = x; while (x2 + 1 < W - 1 && floorOK(x2 + 1, y)) x2++;
        const len = x2 - x + 1;
        if (len >= 3) {
          const sky = skyAt(x + 1, y - 1) && skyAt(x2 - 1, y - 1);
          const perm = wetBiome && !sky && R() < 0.22;
          const rain = rainable && sky && R() < 0.55;
          if ((perm || rain) && !doorNear(x + len / 2, y - 1, 1)) {
            const pw = clamp(14 + R() * 26, 12, len * T - 10), px0 = x * T + 5 + R() * Math.max(0, len * T - 10 - pw);
            const spikes = [x - 1, x2 + 1].some(xx => tile(xx, y - 1) === 3);
            if (!spikes) puddles.push({ x0: px0, x1: px0 + pw, cx: px0 + pw / 2, w: pw, y: y * T, perm, fill: perm ? 1 : 0, rings: [], ph: R() * 9, dripT: 1 + R() * 4 });
          }
        }
        x = x2 + 1;
      }
    }
    /* --- Gras --- */
    const grassy = TOP === "moss" || TOP === "algae";
    if (grassy || OUT) {
      for (let y = 2; y < H; y++) for (let x = 1; x < W - 1; x++) {
        if (!floorOK(x, y)) continue;
        const sky = skyAt(x, y - 1);
        if (!grassy && !(sky && ["", "none", "drip"].includes(TOP))) continue;
        if (tile(x - 1, y - 1) === 3 || tile(x + 1, y - 1) === 3 || tile(x, y - 1) === 4) continue;
        const p = TOP === "algae" ? 0.4 : sky ? 0.62 : 0.3;
        for (let k = 0; k < 2; k++) {
          if (R() > p * (k ? 0.45 : 1)) continue;
          const tx = x * T + 2 + R() * 12;
          if (puddles.some(q => q.perm && tx > q.x0 - 2 && tx < q.x1 + 2)) continue;
          tufts.push(mkTuft(tx, y * T, R, sky, TOP === "algae"));
        }
      }
      tufts.sort((a, b) => a.x - b.x);
    }
    /* --- Laub --- */
    const leafy = (B.weather || []).includes("leaves") || BIO === "torhof" || BIO === "wehrgang" || BIO === "lager";
    if (leafy) for (let y = 2; y < H; y++) for (let x = 1; x < W - 1; x++) {
      if (!floorOK(x, y) || !skyAt(x, y - 1) || R() > 0.1 || doorNear(x, y - 1, 1)) continue;
      const n = 5 + ((R() * 6) | 0), lv2 = [];
      for (let i = 0; i < n; i++) lv2.push({ dx: (R() - 0.5) * 12, dy: -R() * 1.4, r: R() * PI, s: 1.3 + R() * 1, c: ["#8a5a2a", "#6a4a20", "#9a6a2a", "#7a3a1a", "#a07a30"][(R() * 5) | 0] });
      piles.push({ x: x * T + 8, y: y * T, l: lv2, a: 1, gone: 0 });
    }
    /* --- Spinnweben in Ecken --- */
    if (!lv.hub) {
      const dens = { keller: 0.4, verlies: 0.45, schlund: 0.5, glocken: 0.4, hallen: 0.22, passage: 0.3, schmiede: 0.12, glut: 0.08, see: 0.15, hafen: 0.2 }[BIO] || 0.14;
      for (let y = 1; y < H - 2; y++) for (let x = 1; x < W - 1; x++) {
        if (tile(x, y) !== 0 || !sol(x, y - 1) || tile(x, y + 1) !== 0 || skyAt(x, y) || isOpen(x, y)) continue;
        const L = tile(x - 1, y) === 1, Rr = tile(x + 1, y) === 1; if (!L && !Rr) continue;
        if (R() > dens || doorNear(x, y, 2) || decorAt(x, y, 1)) continue;
        const dir = L ? 1 : -1;
        webs.push({ x: L ? x * T : (x + 1) * T, y: y * T, dir, up: false, r: 9 + R() * 9, v: (R() * 4) | 0, torn: false, jig: 0, jv: 0, th: [], t: 0 });
        if (webs.length > 40) break;
      }
      /* kleinere Weben in Bodenecken: die zerreißt man auch im Laufen */
      for (let y = 2; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        if (webs.length > 48) break;
        if (tile(x, y) !== 0 || !sol(x, y + 1) || tile(x, y - 1) !== 0 || skyAt(x, y) || isOpen(x, y)) continue;
        const L = tile(x - 1, y) === 1 && tile(x - 1, y - 1) === 1, Rr = tile(x + 1, y) === 1 && tile(x + 1, y - 1) === 1; if (!L && !Rr) continue;
        if (R() > dens * 0.45 || doorNear(x, y, 2) || decorAt(x, y, 1)) continue;
        webs.push({ x: L ? x * T : (x + 1) * T, y: (y + 1) * T, dir: L ? 1 : -1, up: true, r: 7 + R() * 6, v: (R() * 4) | 0, torn: false, jig: 0, jv: 0, th: [], t: 0 });
      }
    }
    decorSync(lv, true);
    /* --- Mäuse --- */
    if (["keller", "verlies", "hallen", "glocken", "hafen", "passage"].includes(BIO)) {
      const n = rich() ? 4 : 2;
      for (let i = 0; i < n; i++) mice.push({ st: "gone", t: 1 + R() * 6, x: 0, y: 0, d: 1, run: 0, ph: R() * 9 });
    }
  }
  /* Requisiten aus lv.decor: wird neu gelesen, sobald sich die Liste ändert (andere Module ersetzen/filtern sie);
     der Zustand je Deko-Objekt bleibt erhalten */
  let decRef = null, decLen = -1, decKinds = "";
  const DST = new WeakMap();
  function dstate(d, mk) { let o = DST.get(d); if (!o) { o = mk(); DST.set(d, o); } return o; }
  function decorSync(lv, force) {
    const D = lv.decor || [];
    let kinds = ""; if (!force) { for (let i = 0; i < D.length; i += 7) kinds += D[i].kind[0]; }
    if (!force && D === decRef && D.length === decLen && kinds === decKinds) return;
    for (const w of swings) if (w.hid && !D.includes(w.d)) { w.d.kind = w.kind; w.hid = false; }
    decRef = D; decLen = D.length; decKinds = kinds || ""; if (force) { kinds = ""; for (let i = 0; i < D.length; i += 7) kinds += D[i].kind[0]; decKinds = kinds; }
    flames = []; swings = []; vines = []; pipes = []; bells = [];
    const fl = (d, i, k) => { const o = dstate(d, () => ({ f: [] })); let f = o.f[i]; if (!f) f = o.f[i] = { l: 0, v: 0, dd: d, i, k }; placeFlame(f); flames.push(f); };
    for (const d of D) {
      const px = d.x * T + 8, py = d.y * T + 16, k = d.kind.startsWith("_ws_") ? d.kind.slice(4) : d.kind;
      switch (k) {
        case "torch": case "candle": case "brazier": case "greenfire": fl(d, 0, k); break;
        case "candelabra": for (let i = 0; i < 3; i++) fl(d, i, k); break;
        case "chandelier": for (let i = 0; i < 5; i++) fl(d, i, k); break;
        case "chain": case "banner": swings.push(dstate(d, () => ({ d, kind: k, a: 0, va: 0, hid: false, cd: 0 }))); break;
        case "vine": vines.push(dstate(d, () => ({ x: px, y: py, cd: 0 }))); break;
        case "pipe": pipes.push(dstate(d, () => ({ x: px, y: py, cd: 0 }))); break;
        case "bell": bells.push(dstate(d, () => ({ x: px, y: py, cd: 0 }))); break;
      }
    }
  }
  /* Flammenposition wie in bild.js – live, weil bild.js Fackeln beim ersten Zeichnen noch an einen Pfeiler verschiebt */
  function placeFlame(f) {
    const d = f.dd, px = d.x * T + 8, py = d.y * T + 16;
    switch (f.k) {
      case "torch": f.x = px; f.y = py - 25; f.s = 1.05; f.col = "255,154,58"; break;
      case "candle": f.x = px; f.y = py - 1.8 - (6 + (d.s || 0.5) * 3); f.s = 0.55; f.col = "255,192,96"; break;
      case "candelabra": { const o = [-6, 0, 6][f.i]; f.x = px + o; f.y = (o ? py - 22 : py - 24) - 4; f.s = 0.45; f.col = "255,192,96"; break; }
      case "brazier": f.x = px; f.y = py - 10; f.s = 1.4; f.col = "255,138,42"; break;
      case "greenfire": f.x = px; f.y = py - 6; f.s = 1.3; f.col = "106,255,122"; break;
      case "chandelier": f.x = px + (f.i - 2) * 4.5; f.y = py + 4; f.s = 0.42; f.col = "255,192,96"; f.d = d; break;
    }
  }
  /* Spiegelung in Pfützen: Horizontfarbe des Gebiets, aufgehellt (nie blau) */
  function reflCol(B) {
    const h = (B.sky && B.sky[2]) || "#4a3a40", n = parseInt(h.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (b > r + 10) { r = 74; g = 64; b = 72; }
    const f = v => Math.round(v + (255 - v) * 0.22);
    return "rgba(" + f(r) + "," + f(g) + "," + f(b) + ",";
  }
  function mkTuft(x, y, R, sky, algae) {
    const n = algae ? 3 + ((R() * 3) | 0) : 4 + ((R() * 5) | 0), bl = [];
    const hmax = algae ? 7 + R() * 7 : sky ? 4 + R() * 6 : 3 + R() * 4;
    for (let i = 0; i < n; i++) {
      const h = hmax * (0.55 + R() * 0.45);
      bl.push({ dx: (R() - 0.5) * (algae ? 6 : 8), h, lean: (R() - 0.5) * 0.7, w: algae ? 1.1 : 0.7 + R() * 0.4, c: R() < 0.35 ? 0 : R() < 0.75 ? 1 : 2, fx: h / 7 });
    }
    bl.sort((a, b) => a.c - b.c);
    let fl = null;
    if (!algae && sky && R() < 0.14) { const b = bl[(R() * bl.length) | 0]; fl = { b, c: ["#e8c050", "#ece4d6", "#d8607a", "#e08a3a"][(R() * 4) | 0] }; }
    return { x, y, bl, b: 0, vb: 0, ph: R() * TAU, algae, fl, rustle: 0 };
  }

  /* ======================= Ereignisse ======================= */
  /* Einschlag: Staub, Ketten, Flammen, Netze, Gras, Laub, Mäuse, Ranken – Stärke s etwa 0..1.5 */
  function impact(x, y, s, o) {
    if (!on() || Z.level !== lvRef) return;
    o = o || {};
    if (s >= 0.45 && !o.noDust) dustFrom(x, y, s);
    for (const w of swings) {
      const d = w.d, px = d.x * T + 8, py = d.y * T + (w.kind === "chain" ? 8 : -6);
      const dx = px - x, dy = py - y, dist = Math.hypot(dx, dy), R = 70 + s * 50;
      if (dist < R) { const f = s * (1 - dist / R); w.va += (sgn(dx) || o.dir || 1) * f * (w.kind === "chain" ? 0.9 : 0.7); }
    }
    for (const f of flames) { const dx = f.x - x, dy = f.y - y, dist = Math.hypot(dx, dy), R = 50 + s * 60; if (dist < R) f.v += (sgn(dx) || 1) * s * (1 - dist / R) * 9; }
    for (const w of webs) if (!w.torn) { const dist = Math.hypot(w.x + w.dir * w.r * 0.4 - x, w.y + (w.up ? -1 : 1) * w.r * 0.4 - y); if (dist < 16 + s * 40) tear(w, sgn(w.x - x) * 100, -40); else if (dist < 60 + s * 40) w.jv += s * 6; }
    const R2 = 24 + s * 40;
    for (let i = lowerTuft(x - R2), n = tufts.length; i < n; i++) { const t = tufts[i]; if (t.x > x + R2) break; if (Math.abs(t.y - y) < R2) { const dx = t.x - x; t.vb += sgn(dx) * s * 14 * (1 - Math.abs(dx) / R2); } }
    for (const p of piles) if (p.a > 0.5 && Math.abs(p.x - x) < 10 + s * 40 && Math.abs(p.y - y) < 20 + s * 30) scatter(p, sgn(p.x - x) * 120 * s, s);
    for (const m of mice) if (m.st !== "gone" && Math.hypot(m.x - x, m.y - y) < 80 + s * 120) flee(m, x);
    for (const v of vines) if (Math.abs(v.x - x) < 30 + s * 40 && Math.abs(v.y - y) < 50 + s * 30) leafFall(v, 1 + Math.round(s * 3));
    for (const st of stuck) if (s >= 0.6 && Math.hypot(st.x - x, st.y - y) < 30 + s * 30) knock(st, sgn(st.x - x) * 60);
    if (s >= 0.6) for (const b of bells) if (b.cd <= 0 && Math.hypot(b.x - x, b.y - y) < 90) { b.cd = 3; A.play("bell", { vol: 0.12 + s * 0.08, rate: 1.2 + rnd() * 0.3, x: b.x }); }
    if (s >= 0.35) for (const p of pipes) if (p.cd <= 0 && Math.abs(p.x - x) < 50 && Math.abs(p.y - 20 - y) < 50) { p.cd = 1.5; steam(p.x, p.y - 20 + rnd() * 10, sgn(p.x - x) || 1); }
  }
  function lowerTuft(x) { let lo = 0, hi = tufts.length; while (lo < hi) { const m = (lo + hi) >> 1; if (tufts[m].x < x) lo = m + 1; else hi = m; } return lo; }

  /* Staub rieselt von Decken und vom Sims unter den Füßen */
  function dustFrom(x, y, s) {
    const tx0 = Math.floor((x - 20 - s * 50) / T), tx1 = Math.floor((x + 20 + s * 50) / T), tyF = Math.floor((y + 2) / T);
    let budget = Math.round(6 + s * 16);
    for (let tx = tx0; tx <= tx1 && budget > 0; tx++) {
      for (let ty = tyF - 1; ty >= tyF - 7 - Math.round(s * 3); ty--) {
        if (sol(tx, ty) && !sol(tx, ty + 1)) {
          if (rnd() < 0.55 + s * 0.3) { const n = 1 + ((rnd() * (1 + s * 2)) | 0); for (let k = 0; k < n && budget > 0; k++, budget--) dustQ.push({ t: rnd() * 0.5 + Math.abs(tx * T + 8 - x) / 400, x: tx * T + 1 + rnd() * 14, y: (ty + 1) * T + 0.5 }); }
          break;
        }
      }
    }
    /* der Sims selbst: dünne Kante unter den Füßen und die Kanten daneben */
    const txF = Math.floor(x / T);
    for (let tx = txF - 1; tx <= txF + 1; tx++) {
      const v = tile(tx, tyF);
      if ((solidV(v) && !sol(tx, tyF + 1)) || platV(v)) { const uy = platV(v) ? tyF * T + 4 : (tyF + 1) * T; for (let k = 0; k < 2 + s * 4; k++) dustQ.push({ t: 0.05 + rnd() * 0.6, x: tx * T + rnd() * 16, y: uy + 0.5 }); }
      if (solidV(v) && !sol(tx, tyF - 1)) for (const side of [-1, 1]) if (!sol(tx + side, tyF) && !platV(tile(tx + side, tyF)) && Math.abs(tx * T + (side > 0 ? 16 : 0) - x) < 26) for (let k = 0; k < 2 + s * 3; k++) dustQ.push({ t: rnd() * 0.5, x: tx * T + (side > 0 ? 16 + rnd() * 1.5 : -rnd() * 1.5), y: tyF * T + rnd() * 4, edge: side });
    }
    if (dustQ.length > 120) dustQ.splice(0, dustQ.length - 120);
  }
  function steam(x, y, dir) {
    for (let k = 0; k < 6; k++) FX.p({ x, y, vx: dir * (20 + rnd() * 40), vy: -10 - rnd() * 25, life: 0.9 + rnd() * 0.6, size: 3 + rnd() * 3, col: "rgba(214,206,198,.5)", kind: "smoke", drag: 0.94, g: -20 });
    A.play("fire", { vol: 0.08, rate: 2.2, x, gap: 0.2 });
  }

  /* ======================= Spuren (Decals) ======================= */
  function floorAt(x, y, max) {
    for (let yy = y - 6; yy < y + (max || 24); yy += 2) { const tx = Math.floor(x / T), ty = Math.floor(yy / T); if (sol(tx, ty) && !sol(tx, ty - 1)) return ty * T; }
    return null;
  }
  function wallAt(x, y, dir, max) {
    for (let k = 0; k <= (max || 14); k += 2) {
      const xx = x + dir * k, tx = Math.floor(xx / T), ty = Math.floor(y / T);
      if (sol(tx, ty) && !sol(tx - dir, ty)) return { x: dir > 0 ? tx * T : (tx + 1) * T, tx, ty };
    }
    return null;
  }
  /* Ausdehnung der Lauffläche bzw. Wandfläche für sauberes Abschneiden */
  function floorRun(x, y) { const tx = Math.floor(x / T), ty = Math.floor(y / T); let a = tx, b = tx; while (a > tx - 6 && sol(a - 1, ty) && !sol(a - 1, ty - 1)) a--; while (b < tx + 6 && sol(b + 1, ty) && !sol(b + 1, ty - 1)) b++; return [a * T, (b + 1) * T]; }
  function wallRun(tx, ty, dir) { let a = ty, b = ty; const open = yy => !sol(tx - dir, yy); while (a > ty - 4 && sol(tx, a - 1) && open(a - 1)) a--; while (b < ty + 4 && sol(tx, b + 1) && open(b + 1)) b++; return [a * T, (b + 1) * T]; }

  /* Decal anlegen. k: krater, riss, kratzer, brand, rauch, brandw, gift, netz, chip */
  function decal(k, x, y, o) {
    if (!on() || Z.level !== lvRef) return null;
    o = o || {};
    const s = o.s || 1;
    /* nahe gleiche Spur auffrischen statt stapeln */
    for (const d of decals) if (d.k === k && Math.abs(d.x - x) < 5 * s + 2 && Math.abs(d.y - y) < 5 && d.dir === (o.dir || 0)) { d.t = Math.min(d.t, 1); d.s = Math.min(d.s * 1.12, 1.8); return d; }
    const LIFE = { krater: 55, riss: 50, kratzer: 40, brand: 45, rauch: 45, brandw: 45, gift: 40, netz: 30, chip: 25 };
    const d = { k, x, y, s, dir: o.dir || 0, v: (rnd() * 4) | 0, t: -(o.delay || 0), life: (LIFE[k] || 40) * (o.lifeMul || 1), a: o.a || 1, fresh: o.fresh || 0, seed: rnd() * 99, clip: null, tx: 0, ty: 0, wall: false };
    if (k === "krater" || k === "brand" || k === "gift") {
      const run = floorRun(x, y); const hw = { krater: 13, brand: 15, gift: 14 }[k] * s;
      if (x - hw < run[0] || x + hw > run[1]) d.clip = [run[0], y - 30, run[1] - run[0], 50];
      d.tx = Math.floor(x / T); d.ty = Math.floor(y / T);
      if (k === "brand" && !isOpen(d.tx, d.ty - 1) && !skyAt(d.tx, d.ty - 1)) d.plume = true;
    } else if (k === "riss" || k === "kratzer" || k === "brandw" && o.dir) {
      d.tx = Math.floor((x + (o.dir || 1) * 2) / T); d.ty = Math.floor(y / T); d.wall = true;
      const run = wallRun(d.tx, d.ty, o.dir || 1); d.clip = o.dir > 0 ? [x - 1, run[0], 30, run[1] - run[0]] : [x - 29, run[0], 30, run[1] - run[0]];
    } else { d.tx = Math.floor(x / T); d.ty = Math.floor(y / T); d.bg = !sol(d.tx, d.ty); }
    d.anch = sol(d.tx, d.ty);
    decals.push(d);
    const mx = MAXD(); if (decals.length > mx) { decals.sort((a, b) => (b.t / b.life) - (a.t / a.life)); decals.splice(0, decals.length - mx); }
    return d;
  }
  /* Krater mit ausgesprengten Kieseln */
  function crater(x, y, s, pebbles) {
    const fy = floorAt(x, y, 20); if (fy == null) return;
    decal("krater", x, fy, { s: clamp(s, 0.5, 1.6), fresh: 1 });
    if (pebbles) for (let i = 0; i < pebbles && loose.length < MAXL; i++) loose.push({ k: "kiesel", x: x + (rnd() - 0.5) * 10, y: fy - 2, vx: (rnd() - 0.5) * 160, vy: -80 - rnd() * 90, r: 0.9 + rnd() * 0.9, rot: rnd() * TAU, vr: (rnd() - 0.5) * 20, t: 0, life: 40, rest: false, c: rnd() < 0.5 ? pal.dust : shadeHex("#7a6a62", -0.2 + rnd() * 0.3) });
  }

  /* ---------- Sprite-Maler der Spuren ---------- */
  function pKrater(g, R) {
    /* ausgebrochene Kerbe in der Lauffläche: unregelmäßiger Grund, helle Bruchkante, kurze Haarrisse, Schutt */
    const hw = 7 + R() * 2.5, dp = 2.2 + R() * 1, n = 9, pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push([-hw + u * hw * 2 + (i && i < n ? (R() - 0.5) * 1.2 : 0), Math.sin(u * PI) * dp * (0.55 + R() * 0.55)]); }
    g.fillStyle = "rgba(12,8,8,.6)"; g.beginPath(); g.moveTo(-hw - 0.5, -0.3); for (const q of pts) g.lineTo(q[0], q[1]); g.lineTo(hw + 0.5, -0.3); g.closePath(); g.fill();
    g.strokeStyle = "rgba(244,226,200,.26)"; g.lineWidth = 0.35; g.beginPath(); for (let i = 1; i < n; i++) { const q = pts[i]; if (i === 1) g.moveTo(q[0], q[1] - 0.25); else g.lineTo(q[0], q[1] - 0.25); } g.stroke();
    g.save(); g.beginPath(); g.rect(-24, 0.2, 48, 12); g.clip();
    for (let i = 0; i < 5; i++) { const q = pts[1 + ((R() * (n - 1)) | 0)]; jag(g, q[0], q[1], PI * (0.18 + R() * 0.64), 1.5 + R() * 2.5, 2, R, 0.35, 0.6); }
    g.restore();
    for (let i = 0; i < 7; i++) { const x = (R() < 0.5 ? -1 : 1) * (hw * 0.7 + R() * 6), y = -0.35 - R() * 0.6, r = 0.3 + R() * 0.45; E(g, x, y, r, r * 0.75, R() < 0.5 ? "rgba(58,48,44,.75)" : "rgba(176,156,136,.55)"); }
  }
  function pRiss(g, R) {
    g.save(); g.beginPath(); g.rect(-0.2, -20, 30, 40); g.clip();
    g.fillStyle = "rgba(8,5,5,.45)"; g.beginPath(); g.moveTo(0, -3); g.quadraticCurveTo(2.2, -1, 1.9, 0.3); g.quadraticCurveTo(2.1, 1.8, 0, 3.2); g.closePath(); g.fill();
    for (let i = 0; i < 5; i++) { const a = (R() - 0.5) * 2.4; jag(g, 1.2, (R() - 0.5) * 4, a, 3 + R() * 5, 3, R, 0.45, 0.75); }
    g.restore();
    for (let i = 0; i < 4; i++) E(g, -0.3 - R() * 0.8, (R() - 0.5) * 8, 0.3 + R() * 0.3, 0.25, "rgba(160,140,120,.35)");
  }
  function pKratzer(g, R) {
    const n = 3 + ((R() * 2) | 0), sl = 0.4 + R() * 0.5;
    for (let i = 0; i < n; i++) {
      const y0 = -6 + i * 2.6 + R(), x0 = 0.6 + R() * 0.8, x1 = x0 + 4 + R() * 3, y1 = y0 + 3 + sl * 4;
      g.strokeStyle = "rgba(10,6,6,.7)"; g.lineWidth = 0.65; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 0.6, (y0 + y1) / 2 - 0.4, x1, y1); g.stroke();
      g.strokeStyle = "rgba(255,236,206,.28)"; g.lineWidth = 0.3; g.beginPath(); g.moveTo(x0 + 0.3, y0 + 0.45); g.quadraticCurveTo((x0 + x1) / 2 + 0.9, (y0 + y1) / 2, x1 + 0.2, y1 + 0.4); g.stroke();
    }
  }
  function pBrand(g, R) {
    g.fillStyle = "rgba(10,6,6,.5)"; g.beginPath();
    for (let k = 0; k <= 16; k++) { const a = k / 16 * TAU, rr = 13 * (0.75 + R() * 0.35); g.lineTo(Math.cos(a) * rr, 1 + Math.sin(a) * 2.6 * (0.8 + R() * 0.3)); }
    g.fill(); E(g, 0, 1, 8, 1.6, "rgba(0,0,0,.45)");
    for (let i = 0; i < 14; i++) { const x = (R() - 0.5) * 30, y = -0.3 - R() * 1.2 + (Math.abs(x) < 10 ? 0 : 1); E(g, x, y, 0.4 + R() * 0.6, 0.3, R() < 0.6 ? "rgba(20,14,12,.6)" : "rgba(150,140,130,.4)"); }
    g.save(); g.beginPath(); g.rect(-20, 0.5, 40, 20); g.clip();
    for (let i = 0; i < 3; i++) jag(g, (R() - 0.5) * 12, 1.5, PI * (0.3 + R() * 0.4), 2 + R() * 3, 2, R, 0.4);
    g.restore();
  }
  function pRauch(g, R) {
    const gr = g.createRadialGradient(0, -4, 1, 0, -10, 18); gr.addColorStop(0, "rgba(8,5,5,.42)"); gr.addColorStop(0.5, "rgba(8,5,5,.18)"); gr.addColorStop(1, "rgba(8,5,5,0)");
    g.fillStyle = gr; g.beginPath(); g.moveTo(-12, 0); g.quadraticCurveTo(-14, -14, -4 + (R() - 0.5) * 6, -26); g.quadraticCurveTo(6 + (R() - 0.5) * 6, -18, 12, 0); g.closePath(); g.fill();
    g.strokeStyle = "rgba(8,5,5,.18)"; g.lineWidth = 1.2; for (let i = 0; i < 4; i++) { const x = (R() - 0.5) * 14; g.beginPath(); g.moveTo(x, -1); g.quadraticCurveTo(x + (R() - 0.5) * 8, -10, x * 0.6 + (R() - 0.5) * 6, -16 - R() * 8); g.stroke(); }
  }
  function pBrandW(g, R) {
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 11); gr.addColorStop(0, "rgba(6,4,4,.6)"); gr.addColorStop(0.45, "rgba(10,6,6,.32)"); gr.addColorStop(1, "rgba(10,6,6,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.fill();
    g.strokeStyle = "rgba(8,5,5,.35)"; g.lineWidth = 0.7;
    for (let i = 0; i < 9; i++) { const a = R() * TAU, r0 = 3 + R() * 2, r1 = 7 + R() * 5; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); g.stroke(); }
    E(g, 0, 0, 2.6, 2.2, "rgba(0,0,0,.4)");
  }
  function pGift(g, R) {
    g.fillStyle = "rgba(58,70,26,.42)"; g.beginPath();
    for (let k = 0; k <= 14; k++) { const a = k / 14 * TAU, rr = 12 * (0.7 + R() * 0.4); g.lineTo(Math.cos(a) * rr, 0.9 + Math.sin(a) * 2 * (0.8 + R() * 0.3)); }
    g.fill(); E(g, (R() - 0.5) * 4, 1, 6, 1, "rgba(34,40,14,.45)");
    g.strokeStyle = "rgba(150,160,80,.28)"; g.lineWidth = 0.35; g.beginPath(); ell(g, 0, 0.9, 11, 1.9); g.stroke();
    for (let i = 0; i < 6; i++) E(g, (R() - 0.5) * 18, 0.6 + (R() - 0.5) * 1.5, 0.5, 0.25, "rgba(170,180,100,.3)");
    for (let i = 0; i < 3; i++) { const x = (R() - 0.5) * 24; E(g, x, 0.3, 1.4, 0.5, "rgba(58,70,26,.4)"); }
  }
  function pNetz(g, R) {
    E(g, 0, 0, 2.4, 2, "rgba(230,224,232,.35)");
    g.strokeStyle = "rgba(232,226,236,.5)"; g.lineWidth = 0.35;
    const n = 9, ends = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU + R() * 0.4, r = 4 + R() * 4; ends.push([Math.cos(a) * r, Math.sin(a) * r]); g.beginPath(); g.moveTo(0, 0); g.lineTo(ends[i][0], ends[i][1]); g.stroke(); }
    for (const f of [0.45, 0.75]) { g.beginPath(); for (let i = 0; i <= n; i++) { const e = ends[i % n]; if (i) g.quadraticCurveTo(ends[(i - 1) % n][0] * f * 0.5 + e[0] * f * 0.5 * 0.8, ends[(i - 1) % n][1] * f * 0.5 + e[1] * f * 0.5 * 0.8, e[0] * f, e[1] * f); else g.moveTo(e[0] * f, e[1] * f); } g.stroke(); }
  }
  function pChip(g, R) {
    E(g, 0, 0, 1.2, 1.2, "rgba(6,4,4,.5)");
    for (let i = 0; i < 3; i++) jag(g, 0, 0, R() * TAU, 2 + R() * 3, 2, R, 0.45);
  }
  const PAINT = {
    krater: [pKrater, 34, 26, 17, 6], riss: [pRiss, 22, 30, 4, 15], kratzer: [pKratzer, 14, 22, 2, 9], brand: [pBrand, 36, 12, 18, 5],
    rauch: [pRauch, 32, 30, 16, 28], brandw: [pBrandW, 24, 24, 12, 12], gift: [pGift, 30, 8, 15, 3.5], netz: [pNetz, 18, 18, 9, 9], chip: [pChip, 10, 10, 5, 5]
  };
  function decalSpr(k, v, dir) {
    const p = PAINT[k];
    return spr("d" + k + v + (dir < 0 ? "L" : ""), p[1], p[2], dir < 0 ? p[1] - p[3] : p[3], p[4], g => { if (dir < 0) g.scale(-1, 1); p[0](g, Z.Rng(k.length * 977 + v * 131 + 5)); });
  }

  /* ======================= Spinnweben ======================= */
  function webSpr(w) {
    const rb = Math.round(w.r / 3) * 3, key = "w" + w.v + "_" + rb + (w.dir < 0 ? "L" : "");
    return spr(key, rb + 3, rb + 3, w.dir < 0 ? rb + 1.5 : 1.5, 1.5, g => {
      if (w.dir < 0) g.scale(-1, 1);
      const R = Z.Rng(w.v * 733 + rb * 17 + 3), r = rb;
      g.fillStyle = "rgba(210,204,214,.05)"; g.beginPath(); g.moveTo(0, 0); g.lineTo(r, 0); g.quadraticCurveTo(r * 0.5, r * 0.5, 0, r); g.closePath(); g.fill();
      const n = 5 + ((R() * 2) | 0), sp = [];
      for (let i = 0; i < n; i++) { const a = (i + 0.15 + R() * 0.3) / n * PI / 2, l = r * (0.78 + R() * 0.25) / (Math.cos(a - PI / 4) * 0.35 + 0.75); sp.push([Math.cos(a), Math.sin(a), l]); }
      g.strokeStyle = "rgba(232,228,238,.5)"; g.lineWidth = 0.32;
      for (const s of sp) { g.beginPath(); g.moveTo(0, 0); g.lineTo(s[0] * s[2], s[1] * s[2]); g.stroke(); }
      g.beginPath(); g.moveTo(r * 0.92, 0); g.lineTo(sp[0][0] * sp[0][2], sp[0][1] * sp[0][2]); g.moveTo(0, r * 0.92); g.lineTo(sp[n - 1][0] * sp[n - 1][2], sp[n - 1][1] * sp[n - 1][2]); g.stroke();
      const rings = 4 + ((R() * 3) | 0);
      for (let k = 1; k <= rings; k++) {
        const f = k / (rings + 0.6); g.strokeStyle = "rgba(232,228,238," + (0.32 + R() * 0.2).toFixed(2) + ")"; g.lineWidth = 0.26;
        g.beginPath();
        for (let i = 0; i < n - 1; i++) {
          if (R() < 0.08) continue; /* gealterte Lücken */
          const a = sp[i], b = sp[i + 1], ax = a[0] * a[2] * f, ay = a[1] * a[2] * f, bx = b[0] * b[2] * f, by = b[1] * b[2] * f;
          g.moveTo(ax, ay); g.quadraticCurveTo((ax + bx) * 0.42, (ay + by) * 0.42 + 0.6, bx, by);
        }
        g.stroke();
      }
      if (R() < 0.35) { const s = sp[(R() * n) | 0], f = 0.5 + R() * 0.3; E(g, s[0] * s[2] * f, s[1] * s[2] * f + 0.6, 0.9, 1.3, "rgba(200,190,180,.75)"); E(g, s[0] * s[2] * f, s[1] * s[2] * f + 0.2, 0.5, 0.5, "rgba(40,30,30,.6)"); }
      for (let i = 0; i < 4; i++) { const s = sp[(R() * n) | 0], f = 0.3 + R() * 0.6; E(g, s[0] * s[2] * f, s[1] * s[2] * f, 0.35, 0.35, "rgba(240,236,244,.5)"); }
    });
  }
  function tear(w, vx, vy) {
    if (w.torn) return;
    w.torn = true; w.t = 0;
    const n = 4 + ((rnd() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const onCeil = !w.up && rnd() < 0.55, f = 0.2 + rnd() * 0.75;
      w.th.push({ ax: onCeil ? w.dir * w.r * f : 0, ay: onCeil ? 0 : w.up ? -w.r * f : w.r * f, L: w.up ? Math.min(3 + rnd() * w.r * 0.6, w.r * f * 0.9) : 4 + rnd() * w.r * 0.8, a: clamp(vx * 0.006, -1.2, 1.2) + (rnd() - 0.5) * 0.6, va: vx * 0.02 + (rnd() - 0.5) * 3, ph: rnd() * TAU });
    }
    for (let i = 0; i < 5; i++) FX.p({ x: w.x + w.dir * rnd() * w.r * 0.7, y: w.y + rnd() * w.r * 0.7, vx: vx * 0.2 + (rnd() - 0.5) * 20, vy: vy * 0.1 + (rnd() - 0.5) * 10, life: 1.4 + rnd(), size: 0.8, col: "rgba(236,232,240,.55)", drag: 0.95, g: 18, shrink: false });
    A.play("web", { vol: 0.08, rate: 1.4 + rnd() * 0.3, x: w.x, gap: 0.15 });
  }

  /* ======================= Laub, Ranken, Mäuse ======================= */
  function scatter(p, vx, s) {
    if (p.a < 0.3) return;
    for (const l of p.l) FX.p({ x: p.x + l.dx, y: p.y - 1, vx: vx * (0.5 + rnd() * 0.6) + (rnd() - 0.5) * 40, vy: -50 - rnd() * 90 * (0.6 + (s || 0.6)), g: 140, life: 1.6 + rnd() * 1.2, size: l.s * 0.9, col: l.c, kind: "leaf", drag: 0.965, vr: (rnd() - 0.5) * 14 });
    p.a = 0; p.gone = 0;
  }
  function leafFall(v, n) {
    if (v.cd > 0) return; v.cd = 0.6;
    for (let i = 0; i < n; i++) FX.p({ x: v.x + (rnd() - 0.5) * 12, y: v.y - 4 + rnd() * 20, vx: (rnd() - 0.5) * 20 + (Z.windX || 0) * 0.3, vy: 8 + rnd() * 10, g: 30, life: 2.5 + rnd() * 1.5, size: 1.5, col: rnd() < 0.5 ? "#4a7a2a" : "#3a5a2a", kind: "leaf", drag: 0.97, vr: (rnd() - 0.5) * 8 });
  }
  function flee(m, fromX) {
    if (m.st === "gone" || m.st === "flee") return;
    m.st = "flee"; m.d = sgn(m.x - fromX) || 1; m.t = 0;
    if (rnd() < 0.5) A.play("rat", { vol: 0.06, rate: 1.8 + rnd() * 0.4, x: m.x, gap: 0.3 });
  }
  function placeMouse(m) {
    const cam = Z.cam, lv = Z.level, P = Z.player;
    for (let tries = 0; tries < 30; tries++) {
      const tx = 2 + ((rnd() * (lv.W - 4)) | 0), ty = 2 + ((rnd() * (lv.H - 3)) | 0);
      if (!(sol(tx, ty) && tile(tx, ty - 1) === 0 && tile(tx, ty - 2) === 0)) continue;
      const x = tx * T + 8, y = ty * T;
      if (P && Math.abs(x - P.x) < 220 && Math.abs(y - P.y) < 140) continue;
      if (inView(x, y, 30) && tries < 25) continue;
      m.x = x; m.y = y; m.st = "idle"; m.t = 1 + rnd() * 3; m.d = rnd() < 0.5 ? -1 : 1; m.a = 0; return true;
    }
    return false;
  }
  function mouseTick(m, dt) {
    const P = Z.player;
    m.t -= dt; m.ph += dt;
    if (m.st === "gone") { if (m.t <= 0 && !placeMouse(m)) m.t = 5; return; }
    m.a = Math.min(1, (m.a || 0) + dt * 2);
    if (P && m.st !== "flee") { const dx = m.x - (P.x + P.w / 2), dy = m.y - (P.y + P.h); if (Math.abs(dx) < 70 + Math.abs(P.vx) * 0.3 && Math.abs(dy) < 30) flee(m, P.x + P.w / 2); }
    let sp = 0;
    if (m.st === "idle") { if (m.t <= 0) { m.st = "walk"; m.t = 0.6 + rnd() * 1.4; if (rnd() < 0.4) m.d = -m.d; } }
    else if (m.st === "walk") { sp = 22; if (m.t <= 0) { m.st = "idle"; m.t = 0.8 + rnd() * 2.5; } }
    else if (m.st === "flee") sp = 150;
    if (sp) {
      const nx = m.x + m.d * sp * dt, tx = Math.floor((nx + m.d * 2) / T), ty = Math.floor(m.y / T);
      if (sol(tx, ty - 1)) { /* Wand: im Mauseloch verschwinden */ if (m.st === "flee") { gone(m); return; } m.d = -m.d; }
      else if (!sol(tx, ty) && !platV(tile(tx, ty))) { if (m.st === "flee") { const gy = Z.world.groundBelow(nx, m.y + 2, 120); if (gy != null) { m.x = nx; m.y = gy; } else { gone(m); return; } } else m.d = -m.d; }
      else m.x = nx;
      m.run += dt * sp * 0.6;
      if (m.st === "flee" && m.t > 2.5) { gone(m); return; }
    }
  }
  function gone(m) { m.st = "gone"; m.t = 18 + rnd() * 20; FX.p({ x: m.x, y: m.y - 1, vx: 0, vy: -6, life: 0.4, size: 2, col: pal.dust, kind: "smoke", a: 0.5 }); }

  /* ======================= Steckende Geschosse ======================= */
  const STICK = { pfeil: ["#d8b46a", 9, "arrow"], bolzen: ["#c8a060", 7, "bolt"], e_pfeil: ["#c9b38a", 9, "arrow"], e_bolzen: ["#d8d0c0", 7, "bolt"], messer: ["#e0d8d0", 5, "knife"], e_dolch: ["#c890ff", 5, "knife"], e_nadel: ["#b8d060", 5, "needle"], e_feder: ["#3a3a30", 6, "feather"] };
  function stick(kind, x, y, vx, vy) {
    const st = STICK[kind]; if (!st) return;
    let rot = Math.atan2(vy, vx);
    /* Spitze bis knapp in den Fels vorschieben; findet sich kein Fels, bleibt nichts stecken */
    const cx = Math.cos(rot), cy = Math.sin(rot); let ok = false;
    for (let k = 0; k <= 10; k += 0.5) if (solAt(x + cx * k, y + cy * k)) { x += cx * (k + 1); y += cy * (k + 1); ok = true; break; }
    if (!ok) return;
    if (st[2] === "knife") rot += (rnd() - 0.5) * 0.4;
    stuck.push({ kind, x, y, rot, col: st[0], len: st[1], shape: st[2], t: 0, life: 24, wob: 1 });
    if (stuck.length > MAXS) stuck.shift();
    decal("chip", x, y, { lifeMul: 0.9 });
  }
  function knock(s, vx) {
    if (s.down) return; s.down = true; s.t = s.life;
    if (loose.length >= MAXL) loose.shift();
    loose.push({ k: "pfeil", src: s, x: s.x - Math.cos(s.rot) * s.len * 0.5, y: s.y - Math.sin(s.rot) * s.len * 0.5, vx: vx + (rnd() - 0.5) * 30, vy: -40 - rnd() * 40, r: 1, rot: s.rot + PI, vr: (rnd() - 0.5) * 16, t: 0, life: 8, rest: false });
  }

  /* ======================= Takt ======================= */
  const BOD = [];
  function bodies() {
    BOD.length = 0; const P = Z.player, cam = Z.cam;
    if (P && !P.dead) BOD.push(P);
    for (const e of Z.enemies) if (!e.dead && e.x > cam.x - 120 && e.x < cam.x + cam.w + 120 && e.y > cam.y - 120 && e.y < cam.y + cam.h + 120) BOD.push(e);
    return BOD;
  }
  function tick(dt) {
    const lv = Z.level; if (!lv || lv !== lvRef) return;
    if (!on()) { restoreSwings(); return; }
    const P = Z.player, cam = Z.cam, t = (Z.gfx && Z.gfx.time) || 0;
    decorSync(lv, false);
    const bs = bodies();
    const wx = Z.windX || 0;
    /* --- Gras --- */
    const x0 = cam.x - 30, x1 = cam.x + cam.w + 30;
    for (let i = lowerTuft(x0), n = tufts.length; i < n; i++) {
      const g = tufts[i]; if (g.x > x1) break; if (g.y < cam.y - 30 || g.y > cam.y + cam.h + 40) continue;
      let tgt = 0, hit = false;
      for (const b of bs) {
        const feet = b.y + b.h; if (feet < g.y - 12 || b.y > g.y) continue;
        const half = b.w / 2 + 4, dx = g.x - (b.x + b.w / 2); if (Math.abs(dx) > half) continue;
        const roll = b === P && P.rollT > 0;
        let push = (sgn(dx) || sgn(b.vx) || 1) * (1 - Math.abs(dx) / half * 0.5) * 0.75 + clamp(b.vx / 260, -0.7, 0.7);
        if (roll) push *= 1.6; if (feet < g.y - 6) push *= 0.5;
        if (Math.abs(push) > Math.abs(tgt)) tgt = push; hit = true;
        if (Math.abs(b.vx) > 90 && g.rustle <= 0) {
          g.rustle = 0.5;
          if (rich() && rnd() < (roll ? 0.7 : 0.25)) FX.p({ x: g.x, y: g.y - 3, vx: b.vx * 0.3 + (rnd() - 0.5) * 30, vy: -30 - rnd() * 40, g: 160, life: 0.7 + rnd() * 0.4, size: 1, col: pal.g1, kind: "leaf", drag: 0.96, vr: (rnd() - 0.5) * 16 });
          if ((BIO === "torhof" || BIO === "lager") && rnd() < (roll ? 0.12 : 0.04)) FX.p({ x: g.x, y: g.y - 5, vx: (rnd() - 0.5) * 16, vy: -14 - rnd() * 10, life: 3 + rnd() * 2, size: 2.2, col: "rgba(230,255,140,.8)", kind: "glow", add: true, drag: 1 });
        }
      }
      tgt = clamp(tgt, -1.35, 1.35);
      const k = hit ? 160 : 70, damp = hit ? 14 : 5.5;
      g.vb += (tgt - g.b) * k * dt; g.vb *= Math.exp(-damp * dt); g.b += g.vb * dt;
      if (g.rustle > 0) g.rustle -= dt;
    }
    /* --- Laubhaufen --- */
    for (const p of piles) {
      if (p.a < 1) { p.gone += dt; if (p.gone > 30 && !inView(p.x, p.y, 0)) p.a = 1; else if (p.gone > 30) p.a = Math.min(1, p.a + dt * 0.1); }
      if (p.a < 0.5 || !inView(p.x, p.y, 20)) continue;
      for (const b of bs) { const feet = b.y + b.h; if (Math.abs(feet - p.y) > 4 || Math.abs(b.x + b.w / 2 - p.x) > b.w / 2 + 6) continue; const roll = b === P && P.rollT > 0; if (roll || Math.abs(b.vx) > 120) scatter(p, b.vx, roll ? 0.9 : 0.5); }
    }
    /* --- Pfützen --- */
    const W0 = Z.wetter && Z.wetter(), mood = W0 && W0.mood, rain = mood === "regen" || mood === "gewitter" ? 1 : mood === "niesel" ? 0.45 : 0;
    for (const q of puddles) {
      if (!q.perm) q.fill = clamp(q.fill + (rain > 0 ? dt / (28 / rain) : -dt / 70), 0, 1);
      const vis = inView(q.cx, q.y, 40);
      for (let i = q.rings.length - 1; i >= 0; i--) { q.rings[i].t += dt; if (q.rings[i].t > q.rings[i].life) q.rings.splice(i, 1); }
      if (!vis) continue;
      const w = q.perm ? q.w : q.w * Math.min(1, q.fill * 1.25);
      if (w < 3) continue;
      if (rain > 0 && rnd() < dt * w / 16 * 3.5 * rain && q.rings.length < 12) q.rings.push({ x: q.cx + (rnd() - 0.5) * (w - 4), t: 0, life: 0.55 + rnd() * 0.3, r: 2.5 + rnd() * 3 });
      if (q.perm) { q.dripT -= dt; if (q.dripT <= 0) { q.dripT = 2 + rnd() * 5; q.rings.push({ x: q.cx + (rnd() - 0.5) * (w - 4), t: 0, life: 0.9, r: 4 + rnd() * 2 }); } }
      for (const b of bs) {
        const fx = b.x + b.w / 2; if (Math.abs(b.y + b.h - q.y) > 1.5 || fx < q.cx - w / 2 - 2 || fx > q.cx + w / 2 + 2 || !b.onGround) continue;
        if (b === P) P._wsWet = 4;
        const sp = Math.abs(b.vx), land = b.justLanded && (b.landV || 0) > 150;
        b._wsSpl = (b._wsSpl || 0) - dt;
        if ((sp > 40 && b._wsSpl <= 0) || land) {
          b._wsSpl = land ? 0.2 : clamp(14 / sp, 0.08, 0.3);
          const n = land ? 8 : (b === P && P.rollT > 0) ? 6 : 3;
          for (let k = 0; k < n; k++) FX.p({ x: fx + (rnd() - 0.5) * 6, y: q.y - 1, vx: (rnd() - 0.5) * 60 + b.vx * 0.3, vy: -50 - rnd() * (land ? 90 : 50), g: 520, life: 0.35 + rnd() * 0.2, size: 0.9, col: "rgba(200,192,184,.75)", kind: "dot" });
          if (q.rings.length < 14) q.rings.push({ x: clamp(fx, q.cx - w / 2 + 3, q.cx + w / 2 - 3), t: 0, life: 0.7, r: land ? 9 : 5 });
          if (b === P && (land || rnd() < 0.3)) A.play("splash", { vol: land ? 0.18 : 0.06, rate: 1.4 + rnd() * 0.4, x: fx, gap: 0.12 });
        }
      }
    }
    /* --- Spinnweben --- */
    for (const w of webs) {
      const vis = inView(w.x, w.y, 40); if (!vis) continue;
      if (w.torn) { w.t += dt; for (const th of w.th) { const tg = wx * 0.012 + Math.sin(t * 1.6 + th.ph) * 0.14; th.va += (tg - th.a) * 30 * dt; th.va *= Math.exp(-2.2 * dt); th.a += th.va * dt; } }
      else { w.jv += -w.jig * 220 * dt; w.jv *= Math.exp(-6 * dt); w.jig += w.jv * dt; }
      for (const b of bs) {
        const nx = clamp(w.x, b.x, b.x + b.w), ny = clamp(w.y, b.y, b.y + b.h), u = (nx - w.x) * w.dir / w.r, v = (ny - w.y) / w.r * (w.up ? -1 : 1);
        if (u < -0.15 || v < -0.15 || u + v > 1.25) continue;
        const sp = Math.abs(b.vx) + Math.abs(b.vy);
        if (w.torn) { for (const th of w.th) th.va += b.vx * 0.04 * dt * 10; continue; }
        if (u + v < 0.85 && sp > 30) tear(w, b.vx, b.vy); else if (sp > 10) w.jv += sgn(b.vx || 1) * dt * 40;
      }
    }
    /* --- Flammen --- */
    for (const f of flames) {
      if (f.dd.kind !== f.k) { f.l = 0; f.v = 0; continue; }
      placeFlame(f);
      if (!inView(f.x, f.y, 60)) { f.l = 0; f.v = 0; continue; }
      let tg = 0;
      for (const b of bs) {
        const dx = f.x - (b.x + b.w / 2), dy = f.y - (b.y + b.h / 2); if (Math.abs(dx) > 34 || dy > 30 || dy < -54) continue;
        const roll = b === P && P.rollT > 0, sp = Math.abs(b.vx);
        if (sp > 70 || roll) { const v = clamp(b.vx / 300, -0.8, 0.8) * (1 - Math.abs(dx) / 34) * (roll ? 1.5 : 1); if (Math.abs(v) > Math.abs(tg)) tg = v; }
      }
      f.v += ((tg - f.l) * 70 - f.v * 7) * dt; f.l = clamp(f.l + f.v * dt, -1, 1);
      if (Math.abs(f.l) > 0.55 && rich() && rnd() < dt * 14) FX.p({ x: f.x, y: f.y - 5 * f.s, vx: f.l * 70 + (rnd() - 0.5) * 20, vy: -20 - rnd() * 20, life: 0.4 + rnd() * 0.3, size: 1, col: "rgb(" + f.col + ")", kind: "spark", add: true });
    }
    /* --- Ketten und Banner --- */
    for (const w of swings) {
      const d = w.d, px = d.x * T + 8, py = d.y * T + 16;
      if (w.kind === "chain" && inView(px, py, 60)) {
        const len = 32 + (d.s || 0) * 20; w.cd -= dt;
        for (const b of bs) if (w.cd <= 0 && Math.abs(b.vx) > 40 && b.x < px + 3 && b.x + b.w > px - 3 && b.y < py - 16 + len && b.y + b.h > py - 10) { w.va += clamp(b.vx * 0.0025, -0.8, 0.8); w.cd = 0.4; if (Math.abs(b.vx) > 100) A.play("chain", { vol: 0.07, rate: 1.4 + rnd() * 0.3, x: px, gap: 0.2 }); }
      }
      if (w.kind === "banner" && Z.gfx.bannerOk && !Z.gfx.bannerOk(d)) { w.a = 0; w.va = 0; if (w.hid) { w.hid = false; d.kind = w.kind; } continue; } /* W11 R44: unpassende Banner schwingen nie ins Bild */
      const om = w.kind === "chain" ? 2.3 : 3.1, dm = w.kind === "chain" ? 0.7 : 1.6;
      w.va += (-w.a * om * om - w.va * dm) * dt; w.va = clamp(w.va, -1.6, 1.6); w.a = clamp(w.a + w.va * dt, -0.6, 0.6);
      const act = Math.abs(w.a) > 0.004 || Math.abs(w.va) > 0.02;
      if (act && !w.hid) { w.hid = true; d.kind = "_ws_" + w.kind; }
      else if (!act && w.hid) { w.a = 0; w.va = 0; w.hid = false; d.kind = w.kind; }
    }
    /* --- Ranken, Rohre, Glocken --- */
    for (const v of vines) { if (v.cd > 0) v.cd -= dt; if (!inView(v.x, v.y, 30)) continue; for (const b of bs) if ((Math.abs(b.vx) > 50 || Math.abs(b.vy) > 80) && b.x < v.x + 8 && b.x + b.w > v.x - 8 && b.y < v.y + 22 && b.y + b.h > v.y - 16) leafFall(v, 1 + ((rnd() * 2) | 0)); }
    for (const p of pipes) { if (p.cd > 0) { p.cd -= dt; continue; } if (P && rich() && Math.abs(P.x + P.w / 2 - p.x) < 14 && P.y + P.h > p.y - 20 && P.y < p.y + 40 && Math.abs(P.vx) > 60 && inView(p.x, p.y, 0)) { p.cd = 5 + rnd() * 4; steam(p.x, p.y - 22 + rnd() * 8, sgn(P.vx)); } }
    for (const b of bells) if (b.cd > 0) b.cd -= dt;
    /* --- Staub-Warteschlange --- */
    for (let i = dustQ.length - 1; i >= 0; i--) {
      const q = dustQ[i]; q.t -= dt; if (q.t > 0) continue; dustQ.splice(i, 1);
      FX.p({ x: q.x, y: q.y, vx: (q.edge || 0) * (4 + rnd() * 8) + (rnd() - 0.5) * 6, vy: 4 + rnd() * 18, g: 300 + rnd() * 120, life: 0.9 + rnd() * 0.7, size: 0.6 + rnd() * 0.9, col: pal.dust, kind: rnd() < 0.18 ? "shard" : "dot", drag: 0.985 });
      if (rnd() < 0.15) FX.p({ x: q.x, y: q.y + 2, vx: (rnd() - 0.5) * 6, vy: 6, g: 12, life: 1.3, size: 2.2, col: pal.dust, kind: "smoke", a: 0.35, drag: 0.97 });
    }
    /* --- Mäuse --- */
    for (const m of mice) mouseTick(m, dt);
    /* --- Körper: Landungen, Wandprall, Schleifspuren, Fußspuren --- */
    for (const b of bs) bodyTick(b, dt);
    /* --- Geschosse: Einschläge erkennen --- */
    projTick();
    /* --- Steckende und lose Dinge --- */
    for (const s of stuck) {
      s.t += dt; s.wob *= Math.exp(-dt * 7);
      if (s.down || !P) continue;
      if (!sol(Math.floor((s.x + Math.cos(s.rot) * 2) / T), Math.floor((s.y + Math.sin(s.rot) * 2) / T))) { knock(s, 0); continue; }
      const mx = s.x - Math.cos(s.rot) * s.len * 0.6, my = s.y - Math.sin(s.rot) * s.len * 0.6;
      for (const b of bs) if ((Math.abs(b.vx) > 70 || (b === P && P.rollT > 0)) && mx > b.x - 1 && mx < b.x + b.w + 1 && my > b.y && my < b.y + b.h) { knock(s, b.vx * 0.4); break; }
    }
    stuck = stuck.filter(s => s.t < s.life);
    for (const o of loose) looseTick(o, dt, bs);
    loose = loose.filter(o => o.t < o.life);
    for (const d of decals) d.t += dt;
    decals = decals.filter(d => d.t < d.life);
    for (const p of prints) p.t += dt;
    prints = prints.filter(p => p.t < p.life);
    for (const [b, s] of scuffs) { if (s.done) scuffs.delete(b); }
    if (scuffList.length) { for (const s of scuffList) s.t += dt; scuffList = scuffList.filter(s => s.t < s.life); }
    /* --- Luftteilchen verwirbeln, Glühwürmchen weichen aus --- */
    stir(dt, P);
  }

  /* Landungen, Wandprall, Schleifspuren, Fußspuren je Körper */
  let scuffList = [];
  function bodyTick(b, dt) {
    const P = Z.player, isP = b === P, def = b.def || {};
    const heavy = isP || def.heavy || def.boss || b.elite || (b.w || 0) >= 22;
    /* Landung */
    if (b.justLanded && !b._wsLanded) {
      const v = b.landV || b._wsVy || 0, fx = b.x + b.w / 2, fy = b.y + b.h;
      if (isP && b._wsPlunge) { crater(fx, fy, 1.15, 3); impact(fx, fy, 1.1); }
      else if (v > (isP ? 400 : 380) && heavy && !def.fly) {
        const s = clamp((v - 300) / 400, 0.3, 1.1) * (def.boss ? 1.5 : 1);
        impact(fx, fy, s * 0.8);
        if (!isP && (def.heavy || def.boss) && v > 420) crater(fx, fy, 0.7 + s * 0.4, 1);
        if (isP && v > 540) decal("chip", fx + (rnd() - 0.5) * 6, fy + 1, { lifeMul: 0.8 });
      }
    }
    b._wsLanded = b.justLanded; b._wsVy = b.vy;
    if (isP) b._wsPlunge = !!b.plunge;
    /* Wandprall */
    b._wsWcd = (b._wsWcd || 0) - dt;
    if (b.hitWall && b._wsWcd <= 0) {
      const vh = Math.abs(b.vxHit || 0), thr = isP ? (P.hurtT > 0 ? 200 : 330) : (b.wallSlam > 0 || def.boss ? 180 : 260);
      if (vh > thr) {
        b._wsWcd = 0.45;
        const dir = b.hitWall, wx = dir > 0 ? b.x + b.w : b.x, wy = b.y + b.h * (0.35 + rnd() * 0.3), w = wallAt(wx - dir * 2, wy, dir, 6);
        if (w) { const big = vh > 380 || b.wallSlam > 0 || def.boss; decal(big ? "riss" : "kratzer", w.x, wy, { dir, s: big ? clamp(vh / 400, 0.7, 1.4) : 1 }); impact(w.x, wy, big ? 0.8 : 0.4); }
      }
    }
    /* Schleifspuren: Rollen, Bremsen, Rückstoß, Sturmläufe */
    const fx = b.x + b.w / 2, fy = b.y + b.h;
    let skid = 0;
    if (b.onGround && !b.onPlat && !def.fly) {
      const sp = Math.abs(b.vx);
      if (isP && P.rollT > 0 && sp > 60) skid = 0.6;
      else if (isP && sp > 90 && sgn(b.vx) !== b.face && !P.rollT) skid = 0.8;
      else if (isP && P.hurtT > 0 && sp > 150) skid = 1;
      else if (!isP && sp > 230) skid = def.boss || def.heavy ? 1 : 0.7;
      else if (!isP && sp > 140 && b.kb > 0) skid = 0.7;
    }
    let cur = scuffs.get(b);
    if (skid && sol(Math.floor(fx / T), Math.floor((fy + 1) / T))) {
      const sy = Math.floor((fy + 1) / T) * T;
      if (!cur || cur.done || Math.abs(cur.y - sy) > 1 || Math.abs(cur.x1 - fx) > 10) {
        if (cur) cur.done = true;
        cur = { x0: fx, x1: fx, y: sy, t: 0, life: 14 + skid * 10, a: 0.35 + skid * 0.3, done: false, seed: rnd() * 9, w: clamp((b.w || 12) / 12, 0.8, 2) };
        scuffList.push(cur); scuffs.set(b, cur); if (scuffList.length > 40) scuffList.shift();
      } else { cur.x1 = fx; cur.t = 0; }
    } else if (cur) cur.done = true;
    /* Fußspuren */
    if (b.onGround && !def.fly && Math.abs(b.vx) > 25 && !(isP && P.rollT > 0)) {
      b._wsStep = (b._wsStep || 0) + Math.abs(b.vx) * dt;
      if (isP && P._wsWet > 0) P._wsWet -= dt;
      if (b._wsStep > (isP ? 10 : 14)) {
        b._wsStep = 0; b._wsFoot = -(b._wsFoot || 1);
        const tx = Math.floor(fx / T), ty = Math.floor((fy + 1) / T), v = tile(tx, ty);
        let k = null;
        if (v === 1 && !sol(tx, ty - 1)) {
          if (TOP === "ash") k = "ash"; else if (TOP === "soot") k = "soot"; else if (TOP === "slime" || BIO === "verlies") k = "mud";
          else if (TOP === "moss" && skyAt(tx, ty - 1) && puddles.some(q => !q.perm && q.fill > 0.4)) k = "mud";
        }
        if (!k && isP && P._wsWet > 0 && (v === 1 || platV(v))) k = "wet";
        if (isP && tile(tx, ty - 1) === 6) P._wsWet = 4;
        if (k) {
          prints.push({ x: fx + b._wsFoot * 1.6, y: ty * T, f: sgn(b.vx) || b.face || 1, k, t: 0, life: k === "wet" ? 5 + P._wsWet * 1.5 : k === "soot" ? 16 : 20, big: !isP && heavy ? 1.5 : 1 });
          if (prints.length > MAXP) prints.shift();
        }
      }
    }
  }
  function looseTick(o, dt, bs) {
    o.t += dt;
    if (!o.rest) {
      o.vy += 700 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
      if (solAt(o.x + sgn(o.vx) * o.r, o.y)) { o.vx *= -0.45; o.x += o.vx * dt * 2; }
      const tx = Math.floor(o.x / T), ty = Math.floor((o.y + o.r) / T);
      if (o.vy > 0 && (sol(tx, ty) || (platV(tile(tx, ty)) && o.y + o.r - ty * T < 4))) {
        o.y = ty * T - o.r;
        if (o.vy > 90) { o.vy *= -0.32; o.vr *= 0.5; o.vx *= 0.7; if (o.k === "pfeil" && o.t > 0.1) A.play("arrowHit", { vol: 0.05, rate: 1.6, x: o.x, gap: 0.1 }); }
        else { o.vy = 0; o.vx *= 0.8; if (Math.abs(o.vx) < 8) { o.rest = true; o.vx = 0; if (o.k === "pfeil") o.rot = Math.cos(o.rot) > 0 ? 0.04 : PI - 0.04; } }
      }
      if (o.y > Z.level.H * T + 20) o.t = o.life;
    } else if (o.k === "kiesel") {
      for (const b of bs) {
        if (Math.abs(b.vx) < 60 || Math.abs(b.y + b.h - o.y - o.r) > 4 || o.x < b.x - 2 || o.x > b.x + b.w + 2) continue;
        o.rest = false; o.vx = b.vx * (0.7 + rnd() * 0.6); o.vy = -50 - rnd() * 70; o.vr = (rnd() - 0.5) * 20;
        if (rnd() < 0.5) A.play("rock", { vol: 0.04, rate: 2 + rnd() * 0.5, x: o.x, gap: 0.12 });
        break;
      }
    }
  }
  /* Glut, Asche, Staub, Laub verwirbeln; Glühwürmchen fliehen */
  function stir(dt, P) {
    if (!P || P.dead) return;
    const cx = P.x + P.w / 2, cy = P.y + P.h / 2, sp = Math.hypot(P.vx, P.vy);
    const atk = P.act && P.act.phase === "act" ? 0.8 : 0;
    const wake = Math.min(1.4, sp / 260 + (P.rollT > 0 ? 0.8 : 0) + atk);
    const R = 36 + wake * 12, swirl = sgn(P.vx) || P.face || 1;
    for (const p of FX.parts) {
      const dx = p.x - cx, dy = p.y - cy; if (dx > R || dx < -R || dy > R || dy < -R) continue;
      const ff = p.kind === "glow" && typeof p.col === "string" && p.col.charCodeAt(5) === 50 && p.col.indexOf("230,255,140") > 0;
      const amb = ff || (p.drag === 1 && (p.kind === "glow" || p.shrink === false || p.kind === "dot")) || (p.kind === "leaf" && p.drag > 0.98);
      if (!amb) continue;
      const d = Math.hypot(dx, dy) || 1; if (d > R) continue;
      if (p._v0x == null) { p._v0x = p.vx; p._v0y = p.vy; }
      const f = (1 - d / R) * (ff ? 1.2 : wake); if (f <= 0) continue;
      const ax = dx / d * 220 * f + P.vx * 1.6 * f - dy / d * swirl * 140 * f, ay = dy / d * 220 * f + P.vy * 0.8 * f + dx / d * swirl * 60 * f - 40 * f;
      p.vx += ax * dt; p.vy += ay * dt; p._st = 1;
    }
    /* sanft zur ursprünglichen Drift zurück */
    for (const p of FX.parts) if (p._st) { const k = Math.min(1, dt * 1.6); p.vx += (p._v0x - p.vx) * k; p.vy += (p._v0y - p.vy) * k; if (Math.abs(p.vx - p._v0x) + Math.abs(p.vy - p._v0y) < 1) p._st = 0; }
  }

  /* Geschoss-Einschläge über den Positionsverlauf: was gestern noch flog und heute mit p.wall fehlt, ist eingeschlagen */
  const SEEN = new Set();
  function projTick() {
    SEEN.clear(); for (const p of Z.projs) SEEN.add(p);
    for (const p of prevProjs) {
      if (SEEN.has(p) || !p.wall) continue;
      const k = p.k || {}, x = p.x, y = p.y, vx = p.vx || 0, vy = p.vy || 0;
      const side = solAt(x + sgn(vx) * 4, y) && Math.abs(vx) > Math.abs(vy) * 0.5 ? sgn(vx) : 0, floor = !side && solAt(x, y + 4), ceil = !side && !floor && solAt(x, y - 4);
      if (STICK[p.kind]) stick(p.kind, x, y, vx, vy);
      else if (k.rock) { if (floor) crater(x, y, 0.8, 2); else if (side) { const w = wallAt(x - side * 3, y, side, 8); if (w) decal("riss", w.x, y, { dir: side, s: 0.8 }); } impact(x, y, 0.7); }
      else if (k.web) { decal("netz", x, y, { s: 1 }); }
      else if (k.fire || k.glow) {
        if (floor) { const fy = floorAt(x, y, 10); if (fy != null) decal("brand", x, fy, { s: 0.55, fresh: 1 }); }
        else if (side) { const w = wallAt(x - side * 3, y, side, 8); if (w) decal("brandw", w.x + side * 2, y, { dir: side, s: 0.6, fresh: 1 }); }
        else if (!ceil) decal("brandw", x, y, { s: 0.5, fresh: 1 });
        impact(x, y, 0.3, { noDust: true });
      } else if (side || floor) decal("chip", x, y, { lifeMul: 0.8 });
    }
    prevProjs = Z.projs.slice();
  }

  /* ======================= Zeichnen ======================= */
  function drawBack(c, t) {
    const cam = Z.cam;
    /* Schleifspuren */
    if (scuffList.length) {
      c.save(); c.lineCap = "round";
      for (const s of scuffList) {
        const a0 = Math.min(s.x0, s.x1), a1 = Math.max(s.x0, s.x1); if (a1 - a0 < 2 || a1 < cam.x - 10 || a0 > cam.x + cam.w + 10 || s.y < cam.y - 10 || s.y > cam.y + cam.h + 10) continue;
        const al = s.a * Math.min(1, (s.life - s.t) / 6);
        c.globalAlpha = al; c.strokeStyle = "rgba(16,10,8,.6)"; c.lineWidth = 0.7 * s.w;
        c.beginPath(); c.moveTo(a0, s.y + 0.6); c.lineTo(a1, s.y + 0.6); c.moveTo(a0 + 2, s.y + 1.8); c.lineTo(a1 - 1, s.y + 1.8); c.stroke();
        c.strokeStyle = "rgba(240,220,190,.35)"; c.lineWidth = 0.35; c.beginPath(); c.moveTo(a0 + 1, s.y + 1.2); c.lineTo(a1 - 2, s.y + 1.2); c.stroke();
      }
      c.restore();
    }
    /* Ketten und Banner, die gerade schwingen */
    for (const w of swings) if (w.hid) { try { if (w.kind === "chain") drawChain(c, w.d, t, w.a); else drawBanner(c, w.d, t, w.a); } catch (err) { console.error(err); w.d.kind = w.kind; w.hid = false; } }
    /* Decals */
    for (const d of decals) {
      if (d.t < 0) continue;
      if (!inView(d.x, d.y, 40)) continue;
      if (d.anch && !sol(d.tx, d.ty)) { d.t = d.life; continue; } /* Wand zerschlagen: Spur verschwindet mit */
      const fin = d.k === "gift" ? Math.min(1, d.t / 1.2) : Math.min(1, d.t / 0.12), fo = Math.min(1, (d.life - d.t) / 10);
      const al = d.a * fin * fo; if (al <= 0.01) continue;
      c.globalAlpha = al;
      if (d.clip) { c.save(); c.beginPath(); c.rect(d.clip[0], d.clip[1], d.clip[2], d.clip[3]); c.clip(); }
      if (d.k === "brand" && d.plume) blit(c, decalSpr("rauch", d.v, 1), d.x, d.y, d.s);
      blit(c, decalSpr(d.k, d.v, d.dir || 1), d.x, d.y, d.s);
      if (d.clip) c.restore();
    }
    c.globalAlpha = 1;
    /* Steckende Geschosse */
    for (const s of stuck) {
      if (s.down || !inView(s.x, s.y, 20)) continue;
      const fo = Math.min(1, (s.life - s.t) / 4), wob = Math.sin(s.t * 55) * 0.16 * s.wob;
      drawStuck(c, s.x, s.y, s.rot + wob, s, fo);
    }
    /* Fußspuren */
    for (const p of prints) {
      if (!inView(p.x, p.y, 10)) continue;
      const fo = Math.min(1, (p.life - p.t) / 5) * Math.min(1, p.t / 0.1);
      const col = p.k === "ash" ? "rgba(44,36,34,.5)" : p.k === "soot" ? "rgba(6,4,4,.55)" : p.k === "mud" ? "rgba(30,26,12,.5)" : "rgba(14,10,16,.42)";
      c.globalAlpha = fo; c.fillStyle = col; c.beginPath(); ell(c, p.x + p.f * 0.9 * p.big, p.y - 0.15, 1.7 * p.big, 0.55); ell(c, p.x - p.f * 1.5 * p.big, p.y - 0.15, 0.85 * p.big, 0.5); c.fill();
      if (p.k === "ash") { c.fillStyle = "rgba(220,210,200,.25)"; c.fillRect(p.x - 2 * p.big, p.y - 1.1, 4 * p.big, 0.4); }
      if (p.k === "wet") { c.fillStyle = "rgba(240,230,220,.18)"; c.fillRect(p.x + p.f * 0.4, p.y - 0.5, 1, 0.3); }
    }
    c.globalAlpha = 1;
  }
  const GB = [[], [], [], []]; /* wiederverwendete Puffer für die Grashalme */
  function drawFront(c, t) {
    const cam = Z.cam, wx = Z.windX || 0;
    /* Pfützen */
    for (const q of puddles) {
      const w = q.perm ? q.w : q.w * Math.min(1, q.fill * 1.25); if (w < 3 || !inView(q.cx, q.y, 30)) continue;
      const hw = w / 2, a = q.perm ? 1 : Math.min(1, q.fill * 2);
      c.globalAlpha = a;
      c.fillStyle = "rgba(16,11,18,.6)"; c.beginPath(); ell(c, q.cx, q.y + 0.3, hw, 1.3); c.fill();
      c.fillStyle = pal.refl + "0.32)"; c.beginPath(); ell(c, q.cx, q.y + 0.05, hw - 1, 0.75); c.fill();
      c.fillStyle = "rgba(0,0,0,.22)"; c.beginPath(); ell(c, q.cx, q.y + 0.95, hw - 2, 0.45); c.fill();
      const fl = Z.flashLight > 0 ? Z.flashLight : 0;
      c.fillStyle = "rgba(246,236,222," + (0.3 + fl * 0.5).toFixed(2) + ")";
      for (let k = 0; k < 3; k++) { const u = ((q.ph + k * 0.37 + t * 0.03) % 1), x = q.cx - hw + 2 + u * (w - 4); c.fillRect(x, q.y - 0.35, 1 + (k % 2) * 1.2, 0.3); }
      c.lineWidth = 0.22;
      for (const r of q.rings) {
        const u = r.t / r.life, rx = 0.5 + Math.sqrt(u) * r.r; if (Math.abs(r.x - q.cx) + rx > hw - 0.5) continue;
        c.strokeStyle = "rgba(246,238,226," + ((1 - u) * 0.42).toFixed(2) + ")"; c.beginPath(); ell(c, r.x, q.y + 0.15, rx, rx * 0.16); c.stroke();
      }
    }
    c.globalAlpha = 1;
    /* Gras */
    if (tufts.length) {
      const PS = GB; PS[0].length = 0; PS[1].length = 0; PS[2].length = 0; const fls = GB[3]; fls.length = 0;
      const x0 = cam.x - 12, x1 = cam.x + cam.w + 12, gust = wx * 0.009, amp = 0.1 + Math.min(0.25, Math.abs(wx) * 0.005);
      for (let i = lowerTuft(x0), n = tufts.length; i < n; i++) {
        const g = tufts[i]; if (g.x > x1) break; if (g.y < cam.y - 4 || g.y > cam.y + cam.h + 14) continue;
        const sway = (g.algae ? Math.sin(t * 0.9 + g.ph) * 0.22 : Math.sin(t * 1.7 + g.x * 0.11 + g.ph * 0.3) * amp + Math.sin(t * 4.1 + g.ph) * amp * 0.25) + gust;
        for (const b of g.bl) {
          const a = b.lean + (sway + g.b) * b.fx * (1 - Math.min(0.5, Math.abs(g.b) * 0.2)), flat = 1 - Math.min(0.55, Math.abs(g.b) * 0.35);
          const bx = g.x + b.dx, h = b.h * flat, tx = bx + Math.sin(a) * h, ty = g.y - Math.cos(a) * h, cx = bx + Math.sin(a) * h * 0.35, cy = g.y - h * 0.6;
          PS[b.c].push(bx - b.w, g.y + 0.6, cx, cy, tx, ty, bx + b.w);
          if (g.fl && g.fl.b === b) fls.push(tx, ty, g.fl.c);
        }
      }
      const cols = [pal.g0, pal.g1, pal.g2];
      for (let k = 0; k < 3; k++) {
        const L = PS[k]; if (!L.length) continue;
        c.fillStyle = cols[k]; c.beginPath();
        for (let i = 0; i < L.length; i += 7) { c.moveTo(L[i], L[i + 1]); c.quadraticCurveTo(L[i + 2], L[i + 3], L[i + 4], L[i + 5]); c.quadraticCurveTo(L[i + 2] + 0.5, L[i + 3] + 0.4, L[i + 6], L[i + 1]); }
        c.fill();
      }
      for (let i = 0; i < fls.length; i += 3) { c.fillStyle = fls[i + 2]; c.fillRect(fls[i] - 0.8, fls[i + 1] - 0.8, 1.6, 1.6); c.fillStyle = "rgba(255,240,200,.7)"; c.fillRect(fls[i] - 0.3, fls[i + 1] - 0.3, 0.6, 0.6); }
    }
    /* Laub */
    for (const p of piles) {
      if (p.a <= 0.02 || !inView(p.x, p.y, 16)) continue;
      c.globalAlpha = p.a;
      for (const l of p.l) E(c, p.x + l.dx, p.y - 0.4 + l.dy * 0.5, l.s, l.s * 0.42, l.c, l.r);
    }
    c.globalAlpha = 1;
    /* Spinnweben */
    for (const w of webs) {
      if (!inView(w.x, w.y, 30)) continue;
      const s = webSpr(w);
      if (!w.torn) {
        if (Math.abs(w.jig) > 0.01 || w.up) { c.save(); c.translate(w.x, w.y); if (w.up) c.scale(1, -1); c.transform(1, w.jig * 0.08, w.jig * 0.12, 1, 0, 0); blit(c, s, 0, 0); c.restore(); }
        else blit(c, s, w.x, w.y);
      } else {
        const fo = Math.max(0.35, 1 - w.t / 40);
        c.globalAlpha = 0.8; if (w.up) { c.save(); c.translate(w.x, w.y); c.scale(1, -1); blit(c, s, 0, 0, 0.34); c.restore(); } else blit(c, s, w.x, w.y, 0.34);
        c.globalAlpha = fo; c.strokeStyle = "rgba(232,228,238,.55)"; c.lineWidth = 0.32; c.beginPath();
        for (const th of w.th) {
          const ax = w.x + th.ax, ay = w.y + th.ay, ex = ax + Math.sin(th.a) * th.L, ey = ay + Math.cos(th.a) * th.L;
          c.moveTo(ax, ay); c.quadraticCurveTo(ax + Math.sin(th.a) * th.L * 0.2, ay + th.L * 0.55, ex, ey);
        }
        c.stroke(); c.globalAlpha = 1;
      }
    }
    /* Mäuse */
    for (const m of mice) {
      if (m.st === "gone" || !inView(m.x, m.y, 10)) continue;
      const run = m.st !== "idle", bob = run ? Math.abs(Math.sin(m.run * 3)) * 0.5 : 0, sniff = m.st === "idle" ? Math.sin(m.ph * 14) * 0.3 : 0;
      c.save(); c.translate(m.x, m.y); c.scale(m.d, 1); c.globalAlpha = m.a;
      c.strokeStyle = "#4a3e38"; c.lineWidth = 0.35; c.beginPath(); c.moveTo(-2.2, -0.9); c.quadraticCurveTo(-4, -0.2 - (run ? Math.sin(m.run * 5) : 0.6), -5.4, -1.2); c.stroke();
      E(c, -0.2, -1.2 - bob, 2.3, 1.25, "#5e544c"); E(c, 1.9 + sniff, -1.5 - bob, 1.05, 0.85, "#5e544c");
      E(c, 1.3, -2.4 - bob, 0.55, 0.55, "#a8867c"); c.fillStyle = "#120c0c"; c.fillRect(2.3 + sniff, -1.8 - bob, 0.4, 0.4); c.fillStyle = "#c09088"; c.fillRect(2.85 + sniff, -1.45 - bob, 0.35, 0.3);
      c.fillStyle = "rgba(220,200,180,.25)"; c.fillRect(-1.6, -2.3 - bob, 2.4, 0.35);
      if (run) { c.fillStyle = "#3a302a"; const k = Math.sin(m.run * 6) * 0.7; c.fillRect(-1.2 + k, -0.4, 0.5, 0.4); c.fillRect(0.9 - k, -0.4, 0.5, 0.4); }
      c.restore();
    }
    c.globalAlpha = 1;
    /* Lose Dinge */
    for (const o of loose) {
      if (!inView(o.x, o.y, 20)) continue;
      const fo = Math.min(1, (o.life - o.t) / 2);
      if (o.k === "pfeil") { const s = o.src; drawStuck(c, o.x + Math.cos(o.rot) * s.len * 0.5, o.y + Math.sin(o.rot) * s.len * 0.5 - 0.6, o.rot, s, fo, true); }
      else { c.globalAlpha = fo; E(c, o.x, o.y, o.r, o.r * 0.8, o.c, o.rot); c.fillStyle = "rgba(255,240,220,.25)"; c.fillRect(o.x - o.r * 0.6, o.y - o.r * 0.7, o.r * 0.7, 0.35); }
    }
    c.globalAlpha = 1;
  }
  /* Pfeil/Bolzen/Messer/Nadel/Feder: Spitze bei (x,y), Schaft nach hinten */
  function drawStuck(c, x, y, rot, s, a, whole) {
    c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = a;
    const L = s.len;
    if (s.shape === "arrow" || s.shape === "bolt") {
      c.fillStyle = "#5a3e22"; c.fillRect(-L, -0.35, L + (whole ? 0 : 0.5), 0.7); c.fillStyle = "rgba(255,230,190,.3)"; c.fillRect(-L, -0.35, L, 0.25);
      if (whole) { c.fillStyle = "#8a8682"; c.beginPath(); c.moveTo(0, -0.8); c.lineTo(2, 0); c.lineTo(0, 0.8); c.fill(); }
      const fc = s.shape === "bolt" ? "#6a5a4a" : s.kind === "e_pfeil" ? "#3a3430" : "#e8e0d0";
      c.fillStyle = fc; c.beginPath(); c.moveTo(-L + 2.6, -0.3); c.lineTo(-L - 0.2, -1.5); c.lineTo(-L + 0.6, -0.3); c.fill(); c.beginPath(); c.moveTo(-L + 2.6, 0.3); c.lineTo(-L - 0.2, 1.5); c.lineTo(-L + 0.6, 0.3); c.fill();
      if (s.shape === "arrow" && s.kind === "pfeil") { c.fillStyle = "#a83030"; c.fillRect(-L + 0.6, -0.9, 1.2, 0.5); }
      c.fillStyle = "rgba(10,6,6,.5)"; c.fillRect(-0.4, -0.9, 0.8, 1.8);
    } else if (s.shape === "knife") {
      c.fillStyle = "#c8c4c0"; c.beginPath(); c.moveTo(whole ? 3 : 0.5, 0); c.lineTo(-1.2, -0.8); c.lineTo(-1.2, 0.6); c.closePath(); c.fill();
      c.fillStyle = "#4a3020"; c.fillRect(-4.6, -0.55, 3.2, 1.1); c.fillStyle = s.kind === "e_dolch" ? "#6a4a6a" : "#8a7a5a"; c.fillRect(-1.6, -1.1, 0.6, 2.2);
    } else if (s.shape === "needle") {
      c.strokeStyle = "#8a9a50"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(-L, 0); c.lineTo(whole ? 1 : 0.3, 0); c.stroke();
    } else {
      c.fillStyle = "#3a3a30"; c.beginPath(); c.moveTo(0.4, 0); c.quadraticCurveTo(-3, -1.6, -L, -0.4); c.quadraticCurveTo(-3, 1.2, 0.4, 0); c.fill(); c.strokeStyle = "rgba(200,190,170,.4)"; c.lineWidth = 0.25; c.beginPath(); c.moveTo(0.3, 0); c.lineTo(-L, -0.2); c.stroke();
    }
    c.restore();
  }
  /* Kette mit Schwung (nachgebaut aus bild.js, plus Auslenkung a) */
  function drawChain(c, d, t, a) {
    const px = d.x * T + 8, py = d.y * T + 16;
    const sw = Math.sin(t * 1.1 + d.x) * 2, len = 32 + d.s * 20, ox = Math.sin(a) * len, ex = px + sw * 1.4 + ox, ey = py - 16 + len * Math.cos(a);
    c.fillStyle = "#2a2522"; c.fillRect(px - 2.5, py - 16, 5, 1.6); c.strokeStyle = "#3a3430"; c.lineWidth = 0.9; c.beginPath(); c.arc(px, py - 13.6, 1.4, 0, TAU); c.stroke();
    const n = Math.floor(len / 2.6), cx = px + sw + ox * 0.45, cy = py + 4 - (len - len * Math.cos(a)) * 0.5;
    for (let i = 1; i <= n; i++) {
      const u = i / n, ix = (1 - u) * (1 - u) * px + 2 * (1 - u) * u * cx + u * u * ex, iy = (1 - u) * (1 - u) * (py - 12) + 2 * (1 - u) * u * cy + u * u * ey;
      if (i % 2) { c.strokeStyle = "#4a4440"; c.lineWidth = 0.75; c.beginPath(); c.ellipse(ix, iy, 0.9, 1.6, sw * 0.04 - a * u, 0, TAU); c.stroke(); c.fillStyle = "rgba(220,200,180,.35)"; c.fillRect(ix - 0.9, iy - 1, 0.4, 0.8); }
      else { c.save(); c.translate(ix, iy); c.rotate(-a * u); c.fillStyle = "#2e2a26"; c.fillRect(-0.35, -1.5, 0.7, 3); c.restore(); }
    }
    c.save(); c.translate(ex, ey); c.rotate(-a);
    if (d.s > 0.6) { c.strokeStyle = "#4a4440"; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 4, 3, -0.4, 3.6); c.stroke(); c.strokeStyle = "rgba(220,200,180,.3)"; c.lineWidth = 0.5; c.beginPath(); c.arc(0, 4, 3, 2.4, 3.4); c.stroke(); }
    else if (d.s > 0.3) { c.strokeStyle = "#4a4440"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 3); c.arc(-2, 3, 2, 0, PI); c.stroke(); }
    c.restore();
  }
  /* Banner mit Schwung (nachgebaut aus bild.js, plus Auslenkung a) */
  function drawBanner(c, d, t, a) {
    const D = Z.draw, Bm = Z.biome || {};
    const px = d.x * T + 8, py = d.y * T + 16, w = 11, h = 24, y = py - 31, wind = (Z.windX || 0) / 20 + 1;
    const col = Bm.bg === "spires" ? "#4a1a1a" : Bm.bg === "storm" ? "#2e3a24" : Bm.bg === "halls" ? "#8a1a22" : "#7a1a20";
    const sw = k => a * 16 * (k / 4) * (k / 4) + Math.sin(t * 9 + k) * a * 2 * (k / 4);
    const sway = k => Math.sin(t * 2 + k * 0.8 + d.x) * (k / 4) * 2 * wind + sw(k);
    const lift = k => -Math.abs(a) * 5 * (k / 4) * (k / 4);
    const pts = []; for (let k = 0; k <= 4; k++) pts.push([px + w / 2 + sway(k), y + (k / 4) * h + lift(k)]);
    const tipL = [px - w / 2 + Math.sin(t * 2 + d.x) * 2 * wind + sw(4), y + h + lift(4)], mid = [px + sway(3) * 0.5 + sw(3) * 0.5, y + h - 5 + lift(3)];
    const shape = () => { c.beginPath(); c.moveTo(px - w / 2, y); for (const q of pts) c.lineTo(q[0], q[1]); c.lineTo(mid[0], mid[1]); c.lineTo(tipL[0], tipL[1]); c.closePath(); };
    if (Z.gfx.bannerMount) Z.gfx.bannerMount(c, px, y, shape, rich()); /* W11 R44 */
    c.fillStyle = col; shape(); c.fill();
    c.save(); shape(); c.clip();
    c.fillStyle = "rgba(0,0,0,.22)"; for (let k = 0; k < 3; k++) { const fx = px - w / 2 + 2 + k * 3.6 + Math.sin(t * 2 + d.x + k) * 0.8 + sw(2) * 0.5; c.fillRect(fx, y, 1.3, h); }
    c.fillStyle = "rgba(255,220,200,.12)"; c.fillRect(px - w / 2, y, w, 1.2);
    c.strokeStyle = "#d8a84a"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(px - w / 2 + 1.2, y + 1); c.lineTo(tipL[0] + 1.2, tipL[1] - 2); c.moveTo(pts[0][0] - 1.2, y + 1); for (let k = 1; k <= 3; k++) c.lineTo(pts[k][0] - 1.2, pts[k][1]); c.stroke();
    c.restore();
    const ex = px + sway(2) * 0.4 + sw(2) * 0.4, ey = y + 9.5 + lift(2);
    c.strokeStyle = "#e5b454"; c.lineWidth = 0.55; for (let k = 0; k < 12; k++) { const an = k / 12 * TAU + t * 0.05; c.beginPath(); c.moveTo(ex + Math.cos(an) * 2.6, ey + Math.sin(an) * 2.6); c.lineTo(ex + Math.cos(an) * (k % 2 ? 4 : 4.8), ey + Math.sin(an) * (k % 2 ? 4 : 4.8)); c.stroke(); }
    D.circ(c, ex, ey, 2.4, "#e5b454"); D.circ(c, ex - 0.5, ey - 0.5, 1, "#ffe0a0");
    c.fillStyle = "#d8a84a"; for (let k = 0; k < 3; k++) c.fillRect(ex - 2 + k * 2 - 0.4 + sw(3) * 0.3, y + 17 + lift(3), 0.8, 0.8);
    c.fillStyle = "#2a1c10"; c.fillRect(px - 8, y - 1.6, 16, 1.8); c.fillStyle = "#6a4a26"; c.fillRect(px - 8, y - 1.6, 16, 0.5);
    D.circ(c, px - 8.5, y - 0.7, 1.4, "#c8a050"); D.circ(c, px + 8.5, y - 0.7, 1.4, "#c8a050");
    c.strokeStyle = "#a07a34"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(px - 7, y - 1); c.lineTo(px, y - 6); c.lineTo(px + 7, y - 1); c.stroke(); D.circ(c, px, y - 6.3, 0.8, "#3a2a1a");
    for (const q of [tipL, pts[4]]) { c.fillStyle = "#d8a84a"; c.save(); c.translate(q[0], q[1]); c.rotate(-a * 0.8); c.fillRect(-0.5, 0, 1, 1.6); c.beginPath(); c.moveTo(-1.2, 1.4); c.lineTo(1.2, 1.4); c.lineTo(0, 4); c.fill(); c.restore(); }
  }
  function restoreSwings() { for (const w of swings) if (w.hid) { w.d.kind = w.kind; w.hid = false; w.a = 0; w.va = 0; } }

  /* Nach dem Licht: Glut in frischen Brandflecken, glimmende Fußspuren, geneigte Flammen */
  function drawGlow(c, t) {
    const cam = Z.cam;
    c.save(); c.globalCompositeOperation = "lighter";
    for (const d of decals) {
      if (!d.fresh || d.t < 0 || d.t > 6 || !inView(d.x, d.y, 30)) continue;
      const sv = sight(d.x, d.y - 4); if (sv < 0.05) continue;
      const u = d.t / 6, R = Z.Rng((d.seed * 1000) | 0);
      if (d.k === "brand" || d.k === "brandw") {
        for (let i = 0; i < 7; i++) {
          const x = d.x + (R() - 0.5) * 22 * d.s, y = d.k === "brand" ? d.y - 0.3 + R() * 1.4 : d.y + (R() - 0.5) * 12 * d.s, life = 0.3 + R() * 0.7;
          if (u > life) continue;
          const f = (1 - u / life) * (0.6 + 0.4 * Math.sin(t * (9 + R() * 8) + i)) * sv;
          c.globalAlpha = f * 0.35; c.fillStyle = "#ff6a1a"; c.fillRect(x - 1.2, y - 0.9, 2.4, 1.8);
          c.globalAlpha = f; c.fillStyle = "#ffb060"; c.fillRect(x - 0.4, y - 0.4, 0.8, 0.8);
        }
      } else if (d.k === "krater" && d.t < 0.8) {
        c.globalAlpha = (1 - d.t / 0.8) * 0.35 * sv; c.fillStyle = "#ffd8a0"; c.beginPath(); ell(c, d.x, d.y + 0.6, 7 * d.s, 1.3); c.fill();
      }
    }
    for (const p of prints) {
      if (p.k !== "soot" || p.t > 2.5 || !inView(p.x, p.y, 10)) continue;
      const f = (1 - p.t / 2.5) * sight(p.x, p.y - 3);
      c.globalAlpha = f * 0.55; c.fillStyle = "#ff5a1a"; c.beginPath(); ell(c, p.x + p.f * 0.9, p.y - 0.2, 1.6, 0.5); ell(c, p.x - p.f * 1.5, p.y - 0.2, 0.8, 0.45); c.fill();
      c.globalAlpha = f * 0.8; c.fillStyle = "#ffb060"; c.fillRect(p.x + p.f * 0.6 - 0.3, p.y - 0.4, 0.6, 0.4);
    }
    /* geneigte Flammen: eine Zunge in Bewegungsrichtung, die die Flamme mitreißt */
    for (const f of flames) {
      if (Math.abs(f.l) < 0.07 || f.dd.kind !== f.k || !inView(f.x, f.y, 30)) continue;
      const sv = sight(f.x, f.y); if (sv < 0.05) continue;
      const fx = f.x + (f.d ? Math.sin(t * 0.8 + f.d.x) * 1.5 : 0), s = f.s, l = f.l, h = (8 + Math.sin(t * 19 + f.x) * 1.4) * s;
      const tipx = fx + l * 9 * s, tipy = f.y - h * (1 - Math.min(0.6, Math.abs(l) * 0.45)), w = 2.4 * s;
      c.globalAlpha = Math.min(1, Math.abs(l) * 1.6) * 0.85 * sv;
      c.fillStyle = "rgba(" + f.col + ",.8)"; c.beginPath(); c.moveTo(fx - w, f.y); c.quadraticCurveTo(fx + l * 3 * s, f.y - h * 0.5, tipx, tipy); c.quadraticCurveTo(fx + l * 5 * s + w * 0.6, f.y - h * 0.3, fx + w, f.y); c.closePath(); c.fill();
      c.fillStyle = "rgba(255,226,160,.8)"; c.beginPath(); c.moveTo(fx - w * 0.5, f.y); c.quadraticCurveTo(fx + l * 2 * s, f.y - h * 0.35, fx + l * 5 * s, f.y - h * 0.55); c.quadraticCurveTo(fx + l * 2.6 * s + w * 0.3, f.y - h * 0.2, fx + w * 0.5, f.y); c.closePath(); c.fill();
      if (Math.abs(l) > 0.5) { c.globalAlpha *= 0.55; const wx2 = tipx + l * 2.2 * s, wy2 = tipy - 1.2 * s; c.fillStyle = "rgba(" + f.col + ",.75)"; c.beginPath(); c.moveTo(wx2 - l * 1.6 * s, wy2 + 0.6 * s); c.quadraticCurveTo(wx2, wy2 - 0.8 * s, wx2 + l * 1.4 * s, wy2 - 0.2 * s); c.quadraticCurveTo(wx2, wy2 + 0.5 * s, wx2 - l * 1.6 * s, wy2 + 0.6 * s); c.fill(); }
    }
    c.restore();
  }

  /* ======================= Hooks ======================= */
  const load0 = Z.loadArea;
  Z.loadArea = function () { const r = load0.apply(this, arguments); try { setup(Z.level); } catch (err) { console.error(err); } return r; };
  (Z.rueckHooks = Z.rueckHooks || []).push({ id: "weltspuren", load: (s, lv) => setup(lv) }); /* W14 Rückweg-Gnade (rueckweg.js): Gebietszustand merken/einsetzen */

  const tick0 = Z.ebenenTick;
  Z.ebenenTick = function (dt) { if (tick0) tick0(dt); try { tick(dt); } catch (err) { console.error(err); } };

  const dwp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) {
    const ok = Z.level === lvRef && on();
    if (ok) { try { c.save(); drawBack(c, t); c.restore(); } catch (err) { console.error(err); c.restore(); } }
    if (dwp0) dwp0.apply(this, arguments);
    if (ok) { try { c.save(); drawFront(c, t); c.restore(); } catch (err) { console.error(err); c.restore(); } }
  };
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W, H, t) {
    if (al0) al0.apply(this, arguments);
    if (Z.level === lvRef && on()) { try { drawGlow(c, t); } catch (err) { console.error(err); } }
  };

  /* Treffer */
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    const n = hit0.apply(this, arguments);
    try {
      if (n > 0 && e && on() && !(o && (o.dot || o.fx))) {
        const heavy = o && (o.heavy || o.crit || o.src === "wall"), ex = e.x + e.w / 2, ey = e.y + e.h * 0.5, P = Z.player;
        const dir = (o && o.dir) || (P ? (ex > P.x + P.w / 2 ? 1 : -1) : 1);
        impact(ex, ey, heavy ? 0.6 : 0.25, { dir, noDust: !heavy });
        if (heavy && (hitCd.get(e) || 0) < performance.now()) {
          hitCd.set(e, performance.now() + 500);
          const w = wallAt(dir > 0 ? e.x + e.w : e.x, ey, dir, 10);
          if (w) decal(o.src === "wall" ? "riss" : "kratzer", w.x, ey + (rnd() - 0.5) * 6, { dir, s: o.src === "wall" ? 1.1 : 0.8 });
          else if (e.onGround && o.src !== "ranged" && (e.def && (e.def.heavy || e.def.boss))) decal("chip", ex + dir * 4, e.y + e.h + 1, {});
        }
      }
    } catch (err) { console.error(err); }
    return n;
  };
  const kill0 = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    const was = e && e.dead; const r = kill0.apply(this, arguments);
    try { if (e && !was && e.dead && on()) { const big = e.def && (e.def.boss || e.def.heavy); impact(e.x + e.w / 2, e.y + e.h, big ? 1 : 0.35, { noDust: !big }); if (big && e.onGround) crater(e.x + e.w / 2, e.y + e.h, e.def.boss ? 1.3 : 0.8, 2); } } catch (err) { console.error(err); }
    return r;
  };
  const hurt0 = Z.hurtPlayer;
  Z.hurtPlayer = function (dmg, o) {
    const P = Z.player, before = P ? P.hp : 0; const r = hurt0.apply(this, arguments);
    try { if (P && P.hp < before && on()) impact(P.x + P.w / 2, P.y + P.h * 0.5, clamp((before - P.hp) / 30, 0.25, 0.8), { noDust: true }); } catch (err) { console.error(err); }
    return r;
  };
  const exp0 = Z.explode;
  Z.explode = function (x, y, r, dmg, owner, eff) {
    const res = exp0.apply(this, arguments);
    try {
      if (on() && Z.level === lvRef) {
        const s = clamp((r || 40) / 40, 0.6, 1.6);
        impact(x, y, s);
        const fy = floorAt(x, y, (r || 40) * 0.8);
        if (fy != null) { decal("brand", x, fy, { s: s * 0.9, fresh: 1 }); if (fy - y < (r || 40) * 0.5) crater(x, fy, s * 0.8, 2); }
        let wall = false;
        for (const dir of [-1, 1]) { const w = wallAt(x, y, dir, (r || 40) * 0.7); if (w) { wall = true; decal("brandw", w.x + dir * 3, y, { dir, s: s * 0.8, fresh: 1 }); decal("riss", w.x, y + (rnd() - 0.5) * 6, { dir, s: s * 0.8 }); } }
        const tx = Math.floor(x / T), ty = Math.floor(y / T);
        if (!wall && (fy == null || fy - y > 20) && !isOpen(tx, ty) && !skyAt(tx, ty) && !sol(tx, ty)) decal("brandw", x, y, { s: s, fresh: 1 });
      }
    } catch (err) { console.error(err); }
    return res;
  };
  const haz0 = Z.spawnHazard;
  Z.spawnHazard = function (o) {
    const h = haz0.apply(this, arguments);
    try {
      if (h && on() && Z.level === lvRef) {
        if (h.kind === "fire") { const fy = floorAt(h.x, h.y, 12); if (fy != null) decal("brand", h.x, fy, { s: clamp((h.w || 40) / 32, 0.6, 1.5), fresh: 1 }); }
        else if (h.kind === "poisonpool") { const fy = floorAt(h.x, h.y, 12); if (fy != null) decal("gift", h.x, fy, { s: clamp((h.w || 40) / 30, 0.7, 1.5), delay: (h.life || 4) * 0.75 }); }
        else if (h.kind === "rockspike") { const fy = floorAt(h.x, h.y, 12); if (fy != null) decal("krater", h.x, fy, { s: 0.55 }); }
      }
    } catch (err) { console.error(err); }
    return h;
  };
  /* Pfeile: das einfache Steckenbleiben aus geschosse.js übernimmt hier die ausführliche Fassung */
  if (Z.stuck) { const push0 = Z.stuck.push; Z.stuck.push = function () { if (on()) return this.length; return push0.apply(this, arguments); }; }

  /* Test- und Diagnosezugang */
  Z.weltspuren = {
    off: v => { OFF = !!v; if (OFF) restoreSwings(); }, lv: () => lvRef, list: () => decals, state: () => ({ tufts: tufts.length, piles: piles.length, puddles: puddles.length, webs: webs.length, torn: webs.filter(w => w.torn).length, flames: flames.length, swings: swings.length, swinging: swings.filter(w => w.hid).length, decals: decals.length, prints: prints.length, stuck: stuck.length, loose: loose.length, mice: mice.filter(m => m.st !== "gone").length, scuffs: scuffList.length }),
    impact, decal, crater, stick, tear: i => webs[i] && tear(webs[i], 100, 0), webs: () => webs, puddles: () => puddles, tufts: () => tufts, mice: () => mice, swings: () => swings, flames: () => flames
  };
})();
